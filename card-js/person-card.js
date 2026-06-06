/**
 * person-card.js — FratechStore Card "Persona"
 * Foto entità · stato zona colorato (In casa=verde, Fuori casa=rosso, zona HA=azzurro)
 * Sfondo: mappa live con segnaposto · Tap: popup mappa con spostamenti 24h.
 * Config interna: entità person + entità GPS (device_tracker). Glass, fluida, ridimensionabile.
 */
(function () {
  'use strict';

  // ── hass reale di Home Assistant (stati con attributi + callApi) ───────────────
  function bestHass() {
    try {
      for (const w of [window.parent, window.top]) {
        try { const ha = w.document.querySelector('home-assistant'); if (ha && ha.hass) return ha.hass; } catch (e) {}
      }
    } catch (e) {}
    return null;
  }

  // ── persistenza config per-card (no modifiche al core) ─────────────────────────
  function cfgKey(card) { return 'fratech_personcard_' + (card.id || 'x'); }
  function loadCfg(card) {
    let o = {};
    try { o = JSON.parse(localStorage.getItem(cfgKey(card)) || '{}') || {}; } catch (e) {}
    return o;
  }
  function saveCfg(card, o) {
    try { localStorage.setItem(cfgKey(card), JSON.stringify(o)); } catch (e) {}
  }
  function getPerson(card) { const c = loadCfg(card); return c.person || card.person || card.entity || ''; }
  function getGps(card)    { const c = loadCfg(card); return c.gps || card.gps || ''; }

  // ── helpers stato/zona/colore ──────────────────────────────────────────────────
  function attrs(H, id) { const s = H && H.states && H.states[id]; return (s && s.attributes) || {}; }
  function stateOf(H, id) { const s = H && H.states && H.states[id]; return s ? s.state : null; }

  function zoneInfo(state) {
    const s = (state || '').toString();
    if (s === 'home')      return { label: 'In Casa',    color: '#22c55e', glow: 'rgba(34,197,94,.45)' };
    if (s === 'not_home')  return { label: 'Fuori Casa', color: '#ef4444', glow: 'rgba(239,68,68,.45)' };
    if (!s || s === 'unknown' || s === 'unavailable')
                           return { label: '—',          color: '#64748b', glow: 'rgba(100,116,139,.3)' };
    return { label: s, color: '#38bdf8', glow: 'rgba(56,189,248,.45)' }; // zona assegnata da HA
  }

  function latlon(H, personId, gpsId) {
    const tryId = (id) => { if (!id) return null; const a = attrs(H, id); if (a.latitude != null && a.longitude != null) return [a.latitude, a.longitude, a.gps_accuracy]; return null; };
    let p = tryId(gpsId); if (p) return p;
    p = tryId(personId); if (p) return p;
    const pa = attrs(H, personId);
    if (pa.source) { const q = tryId(pa.source); if (q) return q; }
    return null;
  }
  function histEntity(H, personId, gpsId) {
    if (gpsId) return gpsId;
    const pa = attrs(H, personId);
    if (pa.source) return pa.source;
    return personId;
  }

  function picUrl(H, id) {
    const a = attrs(H, id);
    let p = a.entity_picture || a.entity_picture_local || '';
    if (!p) return '';
    if (/^https?:/i.test(p)) return p;
    try { if (H && typeof H.hassUrl === 'function') return H.hassUrl(p); } catch (e) {}
    try { return (window.parent && window.parent.location ? window.parent.location.origin : location.origin) + p; } catch (e) {}
    return p;
  }
  function nameOf(H, personId) {
    const a = attrs(H, personId);
    if (a.friendly_name) return a.friendly_name;
    return (personId || 'Persona').split('.').pop().replace(/_/g, ' ');
  }
  function initials(name) { return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase(); }

  // ── Leaflet loader (CDN, una sola volta) ───────────────────────────────────────
  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (window.__pcLeaflet) return window.__pcLeaflet;
    window.__pcLeaflet = new Promise((res, rej) => {
      try {
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
        const js = document.createElement('script');
        js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        js.onload = () => res(window.L); js.onerror = rej;
        document.head.appendChild(js);
      } catch (e) { rej(e); }
    });
    return window.__pcLeaflet;
  }

  function markerIcon(L, color, pic, ini) {
    const inner = pic
      ? `<div class="pc-mk-img" style="background-image:url('${pic}')"></div>`
      : `<div class="pc-mk-ini">${ini}</div>`;
    return L.divIcon({
      className: 'pc-mk',
      html: `<div class="pc-mk-ring" style="border-color:${color};box-shadow:0 0 0 4px ${color}33,0 4px 12px rgba(0,0,0,.5)">${inner}</div>`,
      iconSize: [44, 44], iconAnchor: [22, 22]
    });
  }

  const ST = (window.__pcState = window.__pcState || {}); // runtime per card.id

  // ── render: scheletro HTML ─────────────────────────────────────────────────────
  function render(card, hass) {
    const H = bestHass();
    const rid = 'pc' + (card.id || Math.random().toString(36).slice(2));
    const personId = getPerson(card);
    const gpsId = getGps(card);
    const configured = !!personId;

    const css = `
#${rid}{position:relative;width:100%;height:100%;min-height:120px;border-radius:18px;overflow:hidden;
  font-family:var(--primary-font-family,system-ui,-apple-system,sans-serif);color:#f1f5f9;}
#${rid} .pc-map{position:absolute;inset:0;z-index:0;filter:saturate(1.05) brightness(.92);}
#${rid} .pc-map.pc-empty{background:radial-gradient(circle at 30% 20%,#1e293b,#0b1220);}
#${rid} .pc-scrim{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(180deg,rgba(8,12,22,.15) 0%,rgba(8,12,22,.55) 60%,rgba(8,12,22,.8) 100%);}
#${rid} .pc-glass{position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;align-items:center;gap:12px;
  padding:14px 16px;backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);
  background:rgba(15,23,42,.42);border-top:1px solid rgba(255,255,255,.12);}
#${rid} .pc-ava{width:54px;height:54px;border-radius:50%;flex-shrink:0;background-size:cover;background-position:center;
  border:2px solid var(--pc-col,#38bdf8);box-shadow:0 0 0 4px var(--pc-glow,rgba(56,189,248,.35)),0 6px 16px rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;color:#fff;
  background-color:rgba(56,189,248,.25);}
#${rid} .pc-info{flex:1;min-width:0;}
#${rid} .pc-name{font-size:clamp(14px,4.2cqw,20px);font-weight:800;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  text-shadow:0 1px 4px rgba(0,0,0,.6);}
#${rid} .pc-pill{display:inline-flex;align-items:center;gap:6px;margin-top:5px;padding:4px 12px;border-radius:999px;
  font-size:clamp(10px,3cqw,13px);font-weight:700;background:var(--pc-pillbg,rgba(56,189,248,.18));
  border:1px solid var(--pc-col,#38bdf8);color:var(--pc-col,#38bdf8);}
#${rid} .pc-dot{width:8px;height:8px;border-radius:50%;background:var(--pc-col,#38bdf8);box-shadow:0 0 8px var(--pc-col,#38bdf8);}
#${rid} .pc-acc{font-size:10px;opacity:.6;margin-top:3px;white-space:nowrap;}
#${rid} .pc-gear{position:absolute;top:10px;right:10px;z-index:4;width:30px;height:30px;border-radius:9px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.5);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.15);color:#cbd5e1;font-size:15px;transition:.15s;}
#${rid} .pc-gear:hover{background:rgba(15,23,42,.8);color:#fff;}
#${rid} .pc-tap{position:absolute;inset:0;z-index:3;cursor:pointer;}
#${rid} .pc-cfg{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:10px;justify-content:center;
  padding:18px;background:rgba(8,12,22,.92);backdrop-filter:blur(16px);}
#${rid} .pc-cfg.open{display:flex;}
#${rid} .pc-cfg h4{font-size:13px;font-weight:800;margin:0 0 2px;}
#${rid} .pc-cfg label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;}
#${rid} .pc-cfg select{width:100%;margin-top:4px;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.06);
  color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:inherit;}
#${rid} .pc-cfg .pc-row{display:flex;gap:8px;margin-top:6px;}
#${rid} .pc-cfg button{flex:1;padding:9px;border-radius:10px;border:none;cursor:pointer;font-weight:700;font-size:12px;}
#${rid} .pc-save{background:#22c55e;color:#04210f;}
#${rid} .pc-close{background:rgba(255,255,255,.1);color:#e2e8f0;}
#${rid} .pc-empty-msg{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  text-align:center;padding:18px;color:#94a3b8;font-size:12px;}
.pc-mk-ring{width:44px;height:44px;border-radius:50%;border:3px solid #38bdf8;overflow:hidden;background:#0b1220;display:flex;align-items:center;justify-content:center;}
.pc-mk-img{width:100%;height:100%;background-size:cover;background-position:center;}
.pc-mk-ini{color:#fff;font-weight:800;font-size:16px;font-family:system-ui,sans-serif;}
`;

    if (!configured) {
      return `<style>${css}</style><div id="${rid}" style="container-type:inline-size">
        <div class="pc-map pc-empty"></div>
        <div class="pc-empty-msg"><div style="font-size:34px">👤</div>
          <div>Card Persona</div>
          <div style="opacity:.7">Tocca l'ingranaggio per scegliere l'entità <b>person</b> e il <b>GPS</b>.</div>
        </div>
        <div class="pc-gear" data-pc="gear">⚙️</div>
        ${cfgPanel(rid, H, personId, gpsId)}
      </div>`;
    }

    const zi = zoneInfo(stateOf(H, personId));
    const nm = nameOf(H, personId);
    const pic = picUrl(H, personId);
    const ll = latlon(H, personId, gpsId);
    const acc = ll && ll[2] != null ? `± ${Math.round(ll[2])} m` : '';

    const avaStyle = pic ? `background-image:url('${pic}')` : '';
    const avaInner = pic ? '' : initials(nm);

    return `<style>${css}</style><div id="${rid}" style="container-type:inline-size"
        data-person="${personId}" data-gps="${gpsId}">
      <div class="pc-map" id="${rid}-map"></div>
      <div class="pc-scrim"></div>
      <div class="pc-tap" data-pc="open"></div>
      <div class="pc-glass" style="--pc-col:${zi.color};--pc-glow:${zi.glow};--pc-pillbg:${zi.color}22">
        <div class="pc-ava" style="${avaStyle}">${avaInner}</div>
        <div class="pc-info">
          <div class="pc-name">${nm}</div>
          <div class="pc-pill"><span class="pc-dot"></span><span class="pc-pilltxt">${zi.label}</span></div>
          <div class="pc-acc">${acc}</div>
        </div>
      </div>
      <div class="pc-gear" data-pc="gear">⚙️</div>
      ${cfgPanel(rid, H, personId, gpsId)}
    </div>`;
  }

  function cfgPanel(rid, H, personId, gpsId) {
    const opts = (prefix, sel) => {
      const list = [];
      const states = (H && H.states) || {};
      Object.keys(states).filter(id => id.startsWith(prefix)).sort().forEach(id => {
        const fn = (states[id].attributes && states[id].attributes.friendly_name) || id;
        list.push(`<option value="${id}" ${id === sel ? 'selected' : ''}>${fn}</option>`);
      });
      return `<option value="">— nessuna —</option>` + list.join('');
    };
    return `<div class="pc-cfg" data-pc="cfg">
      <h4>Configura card persona</h4>
      <div><label>Entità Person</label><select data-pc="sel-person">${opts('person.', personId)}</select></div>
      <div><label>Entità GPS (device_tracker)</label><select data-pc="sel-gps">${opts('device_tracker.', gpsId)}</select></div>
      <div class="pc-row">
        <button class="pc-close" data-pc="cfg-close">Annulla</button>
        <button class="pc-save" data-pc="cfg-save">Salva</button>
      </div>
    </div>`;
  }

  // ── mount: mappa live + interazioni ────────────────────────────────────────────
  function mount(card, hass, el) {
    const root = el.querySelector('[id^="pc"]');
    if (!root) return;
    const rid = root.id;

    // pulizia mappa precedente per questa card
    if (ST[card.id] && ST[card.id].map) { try { ST[card.id].map.remove(); } catch (e) {} }
    ST[card.id] = ST[card.id] || {};

    // interazioni (delega click)
    if (!el._pcBound) {
      el._pcBound = true;
      el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-pc]'); if (!t) return;
        const act = t.getAttribute('data-pc');
        const r = el.querySelector('[id^="pc"]');
        if (act === 'gear') { e.stopPropagation(); const c = el.querySelector('[data-pc="cfg"]'); if (c) c.classList.add('open'); }
        else if (act === 'cfg-close') { const c = el.querySelector('[data-pc="cfg"]'); if (c) c.classList.remove('open'); }
        else if (act === 'cfg-save') {
          const p = el.querySelector('[data-pc="sel-person"]'); const g = el.querySelector('[data-pc="sel-gps"]');
          saveCfg(card, { person: p ? p.value : '', gps: g ? g.value : '' });
          card.person = p ? p.value : ''; card.gps = g ? g.value : ''; // anche sull'oggetto card
          el.innerHTML = render(card, hass); mount(card, hass, el);
        }
        else if (act === 'open') { e.stopPropagation(); openHistory(card); }
      });
    }

    const personId = getPerson(card);
    if (!personId) return;

    const H = bestHass();
    const ll = latlon(H, personId, getGps(card));
    const mapDiv = document.getElementById(rid + '-map');
    if (!mapDiv) return;
    if (!ll) { mapDiv.classList.add('pc-empty'); return; }

    loadLeaflet().then(L => {
      try {
        if (!document.body.contains(mapDiv)) return;
        const map = L.map(mapDiv, {
          zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false,
          doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, tap: false
        }).setView([ll[0], ll[1]], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        const zi = zoneInfo(stateOf(H, personId));
        const mk = L.marker([ll[0], ll[1]], { icon: markerIcon(L, zi.color, picUrl(H, personId), initials(nameOf(H, personId))) }).addTo(map);
        ST[card.id].map = map; ST[card.id].marker = mk;
        setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 60);
        // adatta la mappa al resize della card
        try {
          if (ST[card.id].ro) ST[card.id].ro.disconnect();
          ST[card.id].ro = new ResizeObserver(() => { try { map.invalidateSize(); map.setView([ (ST[card.id].lastLL||ll)[0], (ST[card.id].lastLL||ll)[1] ]); } catch (e) {} });
          ST[card.id].ro.observe(mapDiv);
        } catch (e) {}
        ST[card.id].lastLL = ll;
      } catch (e) {}
    }).catch(() => { mapDiv.classList.add('pc-empty'); });
  }

  // ── update: aggiornamento live senza ricostruire ───────────────────────────────
  function update(card, hass, el) {
    const personId = getPerson(card);
    if (!personId) { el.innerHTML = render(card, hass); mount(card, hass, el); return; }
    const H = bestHass();
    const zi = zoneInfo(stateOf(H, personId));
    const glass = el.querySelector('.pc-glass');
    if (glass) { glass.style.setProperty('--pc-col', zi.color); glass.style.setProperty('--pc-glow', zi.glow); glass.style.setProperty('--pc-pillbg', zi.color + '22'); }
    const pill = el.querySelector('.pc-pilltxt'); if (pill) pill.textContent = zi.label;
    const ll = latlon(H, personId, getGps(card));
    const acc = el.querySelector('.pc-acc'); if (acc) acc.textContent = ll && ll[2] != null ? '± ' + Math.round(ll[2]) + ' m' : '';
    const st = ST[card.id];
    if (st && st.map && st.marker && ll && window.L) {
      try {
        st.marker.setLatLng([ll[0], ll[1]]);
        st.marker.setIcon(markerIcon(window.L, zi.color, picUrl(H, personId), initials(nameOf(H, personId))));
        st.map.setView([ll[0], ll[1]]); st.lastLL = ll;
      } catch (e) {}
    } else if (ll && !(st && st.map)) {
      // mappa non ancora pronta (es. config appena salvata) → monta ora
      mount(card, hass, el);
    }
  }

  // ── popup storico 24h ──────────────────────────────────────────────────────────
  async function openHistory(card) {
    const H = bestHass();
    const personId = getPerson(card);
    const ent = histEntity(H, personId, getGps(card));
    const nm = nameOf(H, personId);

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.72);backdrop-filter:blur(6px);';
    ov.innerHTML = `
      <div style="position:relative;width:min(920px,96vw);height:min(680px,90vh);border-radius:20px;overflow:hidden;
        background:#0b1220;border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08);
          font-family:system-ui,sans-serif;color:#f1f5f9">
          <span style="font-size:18px">🗺️</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:15px;font-weight:800">${nm} — spostamenti 24h</div>
            <div style="font-size:11px;opacity:.6" id="pc-hist-sub">Caricamento percorso…</div>
          </div>
          <button id="pc-hist-x" style="width:34px;height:34px;border-radius:10px;border:none;cursor:pointer;
            background:rgba(255,255,255,.08);color:#e2e8f0;font-size:18px">✕</button>
        </div>
        <div id="pc-hist-map" style="flex:1;min-height:0;background:#0b1220"></div>
      </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('#pc-hist-x').addEventListener('click', close);

    const sub = ov.querySelector('#pc-hist-sub');
    let L, pts = [];
    try {
      L = await loadLeaflet();
      const start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      let data = null;
      if (H && typeof H.callApi === 'function') {
        data = await H.callApi('GET', `history/period/${start}?filter_entity_id=${encodeURIComponent(ent)}&minimal_response=false`);
      }
      const series = (data && data[0]) || [];
      series.forEach(s => {
        const a = s.attributes || {};
        if (a.latitude != null && a.longitude != null) pts.push([a.latitude, a.longitude, s.last_changed || s.last_updated]);
      });
    } catch (e) {}

    const mapDiv = ov.querySelector('#pc-hist-map');
    try {
      const map = L.map(mapDiv, { zoomControl: true, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      if (pts.length) {
        const line = pts.map(p => [p[0], p[1]]);
        L.polyline(line, { color: '#38bdf8', weight: 4, opacity: .85 }).addTo(map);
        L.circleMarker(line[0], { radius: 7, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }).addTo(map).bindTooltip('Inizio 24h');
        L.circleMarker(line[line.length - 1], { radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }).addTo(map).bindTooltip('Ora');
        map.fitBounds(L.latLngBounds(line).pad(0.15));
        if (sub) sub.textContent = pts.length + ' punti negli ultimi 24h';
      } else {
        const H2 = bestHass(); const cur = latlon(H2, personId, getGps(card));
        if (cur) { map.setView([cur[0], cur[1]], 14); L.marker([cur[0], cur[1]]).addTo(map); }
        else map.setView([41.9, 12.5], 5);
        if (sub) sub.textContent = 'Nessuno storico posizione disponibile (controlla che il device_tracker registri lat/lon)';
      }
      setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 80);
    } catch (e) { if (sub) sub.textContent = 'Errore mappa: ' + e.message; }
  }

  // ── registrazione FratechStore ─────────────────────────────────────────────────
  const CARD = {
    id: 'person-card',
    name: 'Persona',
    icon: '👤',
    version: '1.0.0',
    desc: 'Foto persona, stato zona colorato, mappa live e storico spostamenti 24h. Entità configurabili.',
    render, mount, update
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  // compat: alcune installazioni leggono window.FratechCards
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: person-card v' + CARD.version); } catch (e) {}
})();
