/**
 * person-card.js v1.1 — FratechStore Card "Persona"
 * Foto entità + tracker · sfondo Google Maps con segnaposto live · badge LIVE.
 * Affianco al nome: In Casa (verde) / Fuori Casa (rosso) / nome zona HA (azzurro) + "X min fa".
 * Tap sulla card → popup mappa intera con lo storico dei tracciati delle ultime 24h.
 * Config interna (⚙️): entità person + entità GPS (device_tracker).
 */
(function () {
  'use strict';

  // ── hass completo di HA (stati con attributi + callApi) ────────────────────────
  function bestHass() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    try {
      for (const w of [window.parent, window.top]) {
        try { const ha = w.document.querySelector('home-assistant'); if (ha && ha.hass) return ha.hass; } catch (e) {}
      }
    } catch (e) {}
    return null;
  }

  // ── config per-card (localStorage, no modifiche al core) ────────────────────────
  function cfgKey(card) { return 'fratech_personcard_' + (card.id || 'x'); }
  function loadCfg(card) { try { return JSON.parse(localStorage.getItem(cfgKey(card)) || '{}') || {}; } catch (e) { return {}; } }
  function saveCfg(card, o) { try { localStorage.setItem(cfgKey(card), JSON.stringify(o)); } catch (e) {} }
  function getPerson(card) { const c = loadCfg(card); return c.person || card.person || card.entity || ''; }
  function getGps(card) { const c = loadCfg(card); return c.gps || card.gps || ''; }

  // ── helpers stato/attributi ─────────────────────────────────────────────────────
  function attrs(H, id) { const s = H && H.states && H.states[id]; return (s && s.attributes) || {}; }
  function stateOf(H, id) { const s = H && H.states && H.states[id]; return s ? s.state : null; }
  function lastChanged(H, id) { const s = H && H.states && H.states[id]; return s && (s.last_changed || s.last_updated); }

  function zoneInfo(state) {
    const s = (state || '').toString();
    if (s === 'home') return { label: 'A casa', color: '#22c55e', glow: 'rgba(34,197,94,.55)' };
    if (s === 'not_home') return { label: 'Fuori casa', color: '#ef4444', glow: 'rgba(239,68,68,.55)' };
    if (!s || s === 'unknown' || s === 'unavailable') return { label: '—', color: '#64748b', glow: 'rgba(100,116,139,.4)' };
    return { label: s, color: '#38bdf8', glow: 'rgba(56,189,248,.55)' }; // zona assegnata da HA
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
  function agoText(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return '';
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'adesso';
    if (m < 60) return m + ' min fa';
    const h = Math.floor(m / 60);
    if (h < 24) return h + (h === 1 ? ' ora fa' : ' ore fa');
    return Math.floor(h / 24) + ' g fa';
  }
  function gmapUrl(lat, lon) {
    return `https://maps.google.com/maps?q=${lat},${lon}&z=16&hl=it&output=embed`;
  }

  const ST = (window.__pcState = window.__pcState || {});

  // ── render ──────────────────────────────────────────────────────────────────────
  function render(card, hass) {
    const H = bestHass();
    const rid = 'pc' + (card.id || Math.random().toString(36).slice(2));
    const personId = getPerson(card);
    if (!personId) return emptyView(rid, H, '', '');

    const zi = zoneInfo(stateOf(H, personId));
    const nm = nameOf(H, personId);
    const pic = picUrl(H, personId);
    const ll = latlon(H, personId, getGps(card));
    const ago = agoText(lastChanged(H, getGps(card)) || lastChanged(H, personId));

    const css = baseCss(rid);
    const mapHtml = ll
      ? `<iframe class="pc-map" id="${rid}-map" src="${gmapUrl(ll[0], ll[1])}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allow="" frameborder="0"></iframe>`
      : `<div class="pc-map pc-map-empty"></div>`;

    const avaInner = pic ? '' : initials(nm);
    const avaStyle = pic ? `background-image:url('${pic}')` : '';

    return `<style>${css}</style><div id="${rid}" class="pc-root" style="--pc-col:${zi.color};--pc-glow:${zi.glow}">
      ${mapHtml}
      <div class="pc-scrim"></div>
      <div class="pc-live"><span class="pc-live-dot"></span>LIVE</div>
      <div class="pc-gear" data-pc="gear" title="Impostazioni">⚙️</div>
      <div class="pc-glass">
        <div class="pc-ava" style="${avaStyle}">${avaInner}</div>
        <div class="pc-info">
          <div class="pc-row1">
            <span class="pc-name">${nm}</span>
            <span class="pc-pill"><span class="pc-pilltxt">${zi.label}</span></span>
          </div>
          <div class="pc-ago">${ago || ''}</div>
        </div>
      </div>
      ${cfgPanel(rid, H, personId, getGps(card))}
    </div>`;
  }

  function emptyView(rid, H, personId, gpsId) {
    return `<style>${baseCss(rid)}</style><div id="${rid}" class="pc-root" style="--pc-col:#38bdf8;--pc-glow:rgba(56,189,248,.4)">
      <div class="pc-map pc-map-empty"></div>
      <div class="pc-empty">
        <div style="font-size:32px">👤</div>
        <div style="font-weight:800;margin-top:4px">Card Persona</div>
        <div style="opacity:.7;font-size:11px;margin-top:2px">Tocca ⚙️ per scegliere l'entità <b>person</b> e il <b>GPS</b>.</div>
      </div>
      <div class="pc-gear" data-pc="gear" title="Impostazioni">⚙️</div>
      ${cfgPanel(rid, H, personId, gpsId)}
    </div>`;
  }

  function baseCss(rid) {
    return `
#${rid}.pc-root{position:relative;width:100%;height:100%;min-height:96px;border-radius:18px;overflow:hidden;
  font-family:var(--primary-font-family,'Inter',system-ui,-apple-system,sans-serif);color:#f1f5f9;
  background:#0b1220;border:1px solid rgba(255,255,255,.10);}
#${rid} .pc-map{position:absolute;inset:0;width:100%;height:100%;border:0;z-index:0;pointer-events:none;filter:saturate(1.05);}
#${rid} .pc-map-empty{background:radial-gradient(120% 120% at 75% 30%,#27364b,#0b1220);}
#${rid} .pc-scrim{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(90deg,rgba(8,12,22,.94) 0%,rgba(8,12,22,.82) 32%,rgba(8,12,22,.30) 62%,rgba(8,12,22,0) 88%);}
#${rid} .pc-glass{position:absolute;left:0;top:0;bottom:0;z-index:2;display:flex;align-items:center;gap:13px;
  padding:0 18px;max-width:78%;pointer-events:none;}
#${rid} .pc-ava{width:clamp(46px,15cqw,64px);height:clamp(46px,15cqw,64px);aspect-ratio:1;border-radius:50%;flex-shrink:0;
  background-size:cover;background-position:center;background-color:rgba(56,189,248,.25);
  border:3px solid var(--pc-col,#38bdf8);box-shadow:0 0 0 3px var(--pc-glow),0 0 14px var(--pc-glow),0 6px 16px rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;color:#fff;}
#${rid} .pc-info{min-width:0;}
#${rid} .pc-row1{display:flex;align-items:center;gap:9px;min-width:0;}
#${rid} .pc-name{font-size:clamp(15px,5cqw,21px);font-weight:800;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis;text-shadow:0 1px 4px rgba(0,0,0,.7);}
#${rid} .pc-pill{display:inline-flex;align-items:center;flex-shrink:0;padding:3px 11px;border-radius:999px;
  font-size:clamp(10px,3.2cqw,12px);font-weight:800;line-height:1;background:color-mix(in srgb,var(--pc-col) 22%,transparent);
  border:1px solid var(--pc-col);color:var(--pc-col);}
#${rid} .pc-ago{font-size:clamp(9px,2.8cqw,12px);color:rgba(255,255,255,.6);margin-top:5px;white-space:nowrap;}
#${rid} .pc-live{position:absolute;top:10px;right:10px;z-index:3;display:flex;align-items:center;gap:6px;
  padding:4px 9px;border-radius:8px;background:rgba(8,12,22,.62);backdrop-filter:blur(6px);
  border:1px solid rgba(34,197,94,.45);color:#4ade80;font-size:10px;font-weight:900;letter-spacing:.08em;}
#${rid} .pc-live-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;animation:pcblink 1.6s infinite;}
@keyframes pcblink{0%,100%{opacity:1}50%{opacity:.35}}
#${rid} .pc-gear{position:absolute;top:10px;left:10px;z-index:4;width:28px;height:28px;border-radius:8px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;background:rgba(8,12,22,.55);backdrop-filter:blur(6px);
  border:1px solid rgba(255,255,255,.15);color:#cbd5e1;font-size:14px;transition:.15s;}
#${rid} .pc-gear:hover{background:rgba(8,12,22,.85);color:#fff;}
#${rid} .pc-empty{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:16px;color:#cbd5e1;}
#${rid} .pc-cfg{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;gap:9px;justify-content:center;
  padding:18px;background:rgba(8,12,22,.94);backdrop-filter:blur(16px);}
#${rid} .pc-cfg.open{display:flex;}
#${rid} .pc-cfg h4{font-size:13px;font-weight:800;margin:0 0 2px;}
#${rid} .pc-cfg label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;}
#${rid} .pc-cfg select{width:100%;margin-top:4px;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.06);
  color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:inherit;}
#${rid} .pc-cfg .pc-crow{display:flex;gap:8px;margin-top:6px;}
#${rid} .pc-cfg button{flex:1;padding:9px;border-radius:10px;border:none;cursor:pointer;font-weight:700;font-size:12px;}
#${rid} .pc-save{background:#22c55e;color:#04210f;}
#${rid} .pc-close{background:rgba(255,255,255,.1);color:#e2e8f0;}
`;
  }

  function cfgPanel(rid, H, personId, gpsId) {
    const opts = (prefix, sel) => {
      const states = (H && H.states) || {};
      const list = Object.keys(states).filter(id => id.startsWith(prefix)).sort().map(id => {
        const fn = (states[id].attributes && states[id].attributes.friendly_name) || id;
        return `<option value="${id}" ${id === sel ? 'selected' : ''}>${fn}</option>`;
      });
      return `<option value="">— nessuna —</option>` + list.join('');
    };
    return `<div class="pc-cfg" data-pc="cfg">
      <h4>Configura card persona</h4>
      <div><label>Entità Person</label><select data-pc="sel-person">${opts('person.', personId)}</select></div>
      <div><label>Entità GPS (device_tracker)</label><select data-pc="sel-gps">${opts('device_tracker.', gpsId)}</select></div>
      <div class="pc-crow">
        <button class="pc-close" data-pc="cfg-close">Annulla</button>
        <button class="pc-save" data-pc="cfg-save">Salva</button>
      </div>
    </div>`;
  }

  // ── mount: interazioni ──────────────────────────────────────────────────────────
  function mount(card, hass, el) {
    try {
      ST[card.id] = ST[card.id] || {};
      const H = bestHass();
      const ll = latlon(H, getPerson(card), getGps(card));
      ST[card.id].lastLL = ll;

      if (!el._pcBound) {
        el._pcBound = true;
        el.addEventListener('click', (e) => {
          const t = e.target.closest('[data-pc]');
          const act = t && t.getAttribute('data-pc');
          if (act === 'gear') { e.stopPropagation(); const c = el.querySelector('[data-pc="cfg"]'); if (c) c.classList.add('open'); return; }
          if (act === 'cfg-close') { const c = el.querySelector('[data-pc="cfg"]'); if (c) c.classList.remove('open'); return; }
          if (act === 'cfg-save') {
            const p = el.querySelector('[data-pc="sel-person"]'); const g = el.querySelector('[data-pc="sel-gps"]');
            saveCfg(card, { person: p ? p.value : '', gps: g ? g.value : '' });
            card.person = p ? p.value : ''; card.gps = g ? g.value : '';
            el.innerHTML = render(card, hass); mount(card, hass, el); return;
          }
          // tap sulla card (non sui controlli) → popup storico
          if (!el.querySelector('[data-pc="cfg"]')?.classList.contains('open')) openHistory(card);
        });
      }
    } catch (e) {}
  }

  // ── update: live senza ricostruire ──────────────────────────────────────────────
  function update(card, hass, el) {
    try {
      const personId = getPerson(card);
      if (!personId) { el.innerHTML = render(card, hass); mount(card, hass, el); return; }
      const H = bestHass();
      const zi = zoneInfo(stateOf(H, personId));
      const root = el.querySelector('.pc-root');
      if (root) { root.style.setProperty('--pc-col', zi.color); root.style.setProperty('--pc-glow', zi.glow); }
      const pill = el.querySelector('.pc-pilltxt'); if (pill) pill.textContent = zi.label;
      const ago = el.querySelector('.pc-ago'); if (ago) ago.textContent = agoText(lastChanged(H, getGps(card)) || lastChanged(H, personId)) || '';
      const ll = latlon(H, personId, getGps(card));
      const st = ST[card.id] || (ST[card.id] = {});
      const iframe = el.querySelector('.pc-map');
      // aggiorna la mappa solo se spostato (evita reload/flicker continui)
      if (ll && iframe && iframe.tagName === 'IFRAME') {
        const prev = st.lastLL;
        const moved = !prev || Math.abs(prev[0] - ll[0]) > 0.0002 || Math.abs(prev[1] - ll[1]) > 0.0002;
        if (moved) { iframe.src = gmapUrl(ll[0], ll[1]); st.lastLL = ll; }
      } else if (ll && (!iframe || iframe.tagName !== 'IFRAME')) {
        // prima posizione disponibile dopo un render "empty" → ricostruisci
        el.innerHTML = render(card, hass); mount(card, hass, el);
      }
    } catch (e) {}
  }

  // ── Leaflet on-demand (solo per il popup storico) ───────────────────────────────
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

  // ── popup storico 24h ───────────────────────────────────────────────────────────
  async function openHistory(card) {
    const H = bestHass();
    const personId = getPerson(card);
    if (!personId) return;
    const ent = histEntity(H, personId, getGps(card));
    const nm = nameOf(H, personId);

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.74);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML = `
      <div style="position:relative;width:min(960px,96vw);height:min(700px,90vh);border-radius:20px;overflow:hidden;
        background:#0b1220;border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px rgba(0,0,0,.6);display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08);color:#f1f5f9">
          <span style="font-size:18px">🗺️</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:15px;font-weight:800">${nm} — spostamenti 24h</div>
            <div style="font-size:11px;opacity:.6" id="pc-hist-sub">Caricamento percorso…</div>
          </div>
          <button id="pc-hist-x" style="width:34px;height:34px;border-radius:10px;border:none;cursor:pointer;background:rgba(255,255,255,.08);color:#e2e8f0;font-size:18px">✕</button>
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
        if (a.latitude != null && a.longitude != null) pts.push([a.latitude, a.longitude]);
      });
    } catch (e) {}

    const mapDiv = ov.querySelector('#pc-hist-map');
    try {
      const map = L.map(mapDiv, { zoomControl: true, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      if (pts.length) {
        L.polyline(pts, { color: '#38bdf8', weight: 4, opacity: .85 }).addTo(map);
        L.circleMarker(pts[0], { radius: 7, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }).addTo(map).bindTooltip('Inizio 24h');
        L.circleMarker(pts[pts.length - 1], { radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }).addTo(map).bindTooltip('Ora');
        map.fitBounds(L.latLngBounds(pts).pad(0.15));
        if (sub) sub.textContent = pts.length + ' punti negli ultimi 24h';
      } else {
        const cur = latlon(H, personId, getGps(card));
        if (cur) { map.setView([cur[0], cur[1]], 14); L.marker([cur[0], cur[1]]).addTo(map); }
        else map.setView([41.9, 12.5], 5);
        if (sub) sub.textContent = 'Nessuno storico posizione (il device_tracker deve registrare lat/lon nel recorder)';
      }
      setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 80);
    } catch (e) { if (sub) sub.textContent = 'Errore mappa: ' + (e && e.message || e); }
  }

  // ── registrazione FratechStore ─────────────────────────────────────────────────
  const CARD = {
    id: 'person-card',
    name: 'Persona',
    icon: '👤',
    version: '1.1',
    desc: 'Foto persona + tracker, sfondo Google Maps live, stato zona colorato e storico spostamenti 24h. Entità configurabili.',
    render, mount, update
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: person-card v' + CARD.version); } catch (e) {}
})();
