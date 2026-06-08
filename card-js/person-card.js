/**
 * person-card.js v1.7 — FratechStore Card "Persona"
 * Foto entità + tracker · sfondo Google Maps con segnaposto live.
 * Affianco al nome: A casa (verde) / Fuori casa (rosso) / nome zona HA (azzurro) + "X min fa".
 * Tap sulla card → popup mappa intera con lo storico dei tracciati delle ultime 24h.
 * Config interna (⚙️): entità person + entità GPS (device_tracker).
 * Il contenuto scala (transform) per adattarsi alla dimensione della card, mantenendo le posizioni.
 */
(function () {
  'use strict';

  function bestHass() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    try {
      for (const w of [window.parent, window.top]) {
        try { const ha = w.document.querySelector('home-assistant'); if (ha && ha.hass) return ha.hass; } catch (e) {}
      }
    } catch (e) {}
    return null;
  }

  function cfgKey(card) { return 'fratech_personcard_' + (card.id || 'x'); }
  function loadCfg(card) { try { return JSON.parse(localStorage.getItem(cfgKey(card)) || '{}') || {}; } catch (e) { return {}; } }
  function saveCfg(card, o) { try { localStorage.setItem(cfgKey(card), JSON.stringify(o)); } catch (e) {} }
  function getPerson(card) { const c = loadCfg(card); return c.person || card.person || card.entity || ''; }
  function getGps(card) { const c = loadCfg(card); return c.gps || card.gps || ''; }

  function attrs(H, id) { const s = H && H.states && H.states[id]; return (s && s.attributes) || {}; }
  function stateOf(H, id) { const s = H && H.states && H.states[id]; return s ? s.state : null; }
  function lastChanged(H, id) { const s = H && H.states && H.states[id]; return s && (s.last_changed || s.last_updated); }

  function zoneInfo(state) {
    const s = (state || '').toString();
    if (s === 'home') return { label: 'A casa', color: '#22c55e', glow: 'rgba(34,197,94,.55)' };
    if (s === 'not_home') return { label: 'Fuori casa', color: '#ef4444', glow: 'rgba(239,68,68,.55)' };
    if (!s || s === 'unknown' || s === 'unavailable') return { label: '—', color: '#64748b', glow: 'rgba(100,116,139,.4)' };
    return { label: s, color: '#38bdf8', glow: 'rgba(56,189,248,.55)' };
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
  function gmapUrl(lat, lon) { return `https://maps.google.com/maps?q=${lat},${lon}&z=17&t=k&hl=it&output=embed`; }

  // icona segnaposto Leaflet (foto nel cerchio del colore zona) — usata nel popup
  function markerIcon(L, color, pic, ini) {
    const inner = pic
      ? `<div style="width:100%;height:100%;background-size:cover;background-position:center;background-image:url('${pic}')"></div>`
      : `<div style="color:#fff;font-weight:800;font-size:15px;font-family:system-ui,sans-serif">${ini}</div>`;
    return L.divIcon({
      className: 'pc-mk',
      html: `<div style="width:40px;height:40px;border-radius:50%;border:3px solid ${color};overflow:hidden;background:#0b1220;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px ${color}33,0 4px 12px rgba(0,0,0,.5)">${inner}</div>`,
      iconSize: [40, 40], iconAnchor: [20, 20]
    });
  }

  const ST = (window.__pcState = window.__pcState || {});

  // ── scala il contenuto per adattarlo alla card (zoom-to-fit, posizioni invariate) ──
  function fit(el) {
    try {
      const root = el.querySelector('.pc-root'); if (!root) return;
      const content = root.querySelector('.pc-content'); if (!content) return;
      content.style.transform = 'scale(1)';
      const bw = content.offsetWidth || 1, bh = content.offsetHeight || 1;
      const availW = Math.max(30, root.clientWidth - 14 - 42); // padding sx + spazio per il gear a dx
      const availH = Math.max(16, root.clientHeight - 14);
      let s = Math.min(availW / bw, availH / bh);
      s = Math.max(0.4, Math.min(2.6, s));
      content.style.transform = 'scale(' + s + ')';
    } catch (e) {}
  }

  function render(card, hass) {
    const H = bestHass();
    const rid = 'pc' + (card.id || Math.random().toString(36).slice(2));
    const personId = getPerson(card);
    if (!personId) return emptyView(rid);

    const zi = zoneInfo(stateOf(H, personId));
    const nm = nameOf(H, personId);
    const pic = picUrl(H, personId);
    const ll = latlon(H, personId, getGps(card));
    const ago = agoText(lastChanged(H, getGps(card)) || lastChanged(H, personId));

    const mapHtml = ll
      ? `<iframe class="pc-map" id="${rid}-map" src="${gmapUrl(ll[0], ll[1])}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" frameborder="0"></iframe>`
      : `<div class="pc-map pc-map-empty"></div>`;
    const avaInner = pic ? '' : initials(nm);
    const avaStyle = pic ? `background-image:url('${pic}')` : '';

    return `<style>${baseCss(rid)}</style><div id="${rid}" class="pc-root" style="--pc-col:${zi.color};--pc-glow:${zi.glow}">
      ${mapHtml}
      <div class="pc-scrim"></div>
      <div class="pc-stage"><div class="pc-content">
        <div class="pc-ava" style="${avaStyle}">${avaInner}</div>
        <div class="pc-info">
          <div class="pc-name">${nm}</div>
          <div class="pc-row2"><span class="pc-pill"><span class="pc-pilltxt">${zi.label}</span></span></div>
          <div class="pc-ago">${ago || ''}</div>
        </div>
      </div></div>
      <div class="pc-gear" data-pc="gear" title="Impostazioni">⚙️</div>
    </div>`;
  }

  function emptyView(rid) {
    return `<style>${baseCss(rid)}</style><div id="${rid}" class="pc-root" style="--pc-col:#38bdf8;--pc-glow:rgba(56,189,248,.4)">
      <div class="pc-map pc-map-empty"></div>
      <div class="pc-stage" style="justify-content:center"><div class="pc-content" style="flex-direction:column;text-align:center;gap:4px">
        <div style="font-size:30px">👤</div>
        <div style="font-weight:800;font-size:15px">Card Persona</div>
        <div style="opacity:.7;font-size:11px">Tocca per scegliere l'entità <b>person</b> e il <b>GPS</b>.</div>
      </div></div>
      <div class="pc-gear" data-pc="gear" title="Impostazioni">⚙️</div>
    </div>`;
  }

  function baseCss(rid) {
    return `
#${rid}.pc-root{position:relative;width:100%;height:100%;min-height:64px;border-radius:18px;overflow:hidden;
  font-family:var(--primary-font-family,'Inter',system-ui,-apple-system,sans-serif);color:#f1f5f9;
  background:#0b1220;border:1px solid rgba(255,255,255,.10);}
/* mappa estesa e ritagliata per nascondere la barra "Google / Termini" in basso, segnaposto centrato */
#${rid} .pc-map{position:absolute;left:0;right:0;top:-24px;width:100%;height:calc(100% + 48px);border:0;z-index:0;pointer-events:none;filter:saturate(1.05);}
#${rid} .pc-map-empty{background:radial-gradient(120% 120% at 75% 30%,#27364b,#0b1220);}
#${rid} .pc-scrim{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:linear-gradient(90deg,rgba(8,12,22,.94) 0%,rgba(8,12,22,.82) 32%,rgba(8,12,22,.30) 62%,rgba(8,12,22,0) 88%);}
/* stage: centra verticalmente il contenuto; il contenuto è a dimensione BASE e viene scalato via JS */
#${rid} .pc-stage{position:absolute;inset:0;z-index:2;display:flex;align-items:center;padding-left:14px;pointer-events:none;}
#${rid} .pc-content{width:max-content;display:flex;align-items:center;gap:13px;transform-origin:left center;will-change:transform;}
#${rid} .pc-ava{width:56px;height:56px;border-radius:50%;flex-shrink:0;background-size:cover;background-position:center;
  background-color:rgba(56,189,248,.25);border:3px solid var(--pc-col,#38bdf8);
  box-shadow:0 0 0 3px var(--pc-glow),0 0 14px var(--pc-glow),0 6px 16px rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:21px;color:#fff;}
#${rid} .pc-info{min-width:0;}
#${rid} .pc-name{font-size:21px;font-weight:800;letter-spacing:-.3px;white-space:nowrap;max-width:300px;overflow:hidden;
  text-overflow:ellipsis;text-shadow:0 1px 4px rgba(0,0,0,.7);}
#${rid} .pc-row2{margin-top:7px;}
#${rid} .pc-pill{display:inline-flex;align-items:center;padding:3px 12px;border-radius:999px;
  font-size:12px;font-weight:800;line-height:1;white-space:nowrap;background:color-mix(in srgb,var(--pc-col) 22%,transparent);
  border:1px solid var(--pc-col);color:var(--pc-col);}
#${rid} .pc-ago{font-size:12px;color:rgba(255,255,255,.62);margin-top:5px;white-space:nowrap;}
/* ingranaggio impostazioni: in alto a destra, grigio chiaro discreto (NON scalato) */
#${rid} .pc-gear{position:absolute;top:6px;right:7px;z-index:5;width:24px;height:24px;border-radius:7px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;background:rgba(8,12,22,.4);color:#cbd5e1;
  font-size:13px;transition:background .15s,color .15s;}
#${rid} .pc-gear:hover{background:rgba(8,12,22,.8);color:#fff;}
`;
  }

  function mount(card, hass, el) {
    try {
      ST[card.id] = ST[card.id] || {};
      const st = ST[card.id];
      const H = bestHass();
      st.lastLL = latlon(H, getPerson(card), getGps(card));

      // scala il contenuto ora e ad ogni cambio di dimensione della card
      const root = el.querySelector('.pc-root');
      fit(el);
      requestAnimationFrame(() => fit(el));
      if (st.ro) { try { st.ro.disconnect(); } catch (e) {} }
      if (root && 'ResizeObserver' in window) {
        st.ro = new ResizeObserver(() => fit(el));
        st.ro.observe(root);
      }

      if (!el._pcBound) {
        el._pcBound = true;
        el.addEventListener('click', (e) => {
          const t = e.target.closest('[data-pc]');
          const act = t && t.getAttribute('data-pc');
          if (act === 'gear') { e.stopPropagation(); openConfig(card, el, hass); return; }
          if (getPerson(card)) openHistory(card); else openConfig(card, el, hass);
        });
      }
    } catch (e) {}
  }

  function update(card, hass, el) {
    try {
      const personId = getPerson(card);
      const renderedEmpty = !el.querySelector('.pc-stage .pc-name');
      if (!personId) { if (!el.querySelector('.pc-root')) { el.innerHTML = render(card, hass); mount(card, hass, el); } return; }
      if (renderedEmpty) { el.innerHTML = render(card, hass); mount(card, hass, el); return; }

      const H = bestHass();
      const zi = zoneInfo(stateOf(H, personId));
      const root = el.querySelector('.pc-root');
      if (root) { root.style.setProperty('--pc-col', zi.color); root.style.setProperty('--pc-glow', zi.glow); }
      const pill = el.querySelector('.pc-pilltxt'); if (pill) pill.textContent = zi.label;
      const ago = el.querySelector('.pc-ago'); if (ago) ago.textContent = agoText(lastChanged(H, getGps(card)) || lastChanged(H, personId)) || '';
      const ll = latlon(H, personId, getGps(card));
      const st = ST[card.id] || (ST[card.id] = {});
      const iframe = el.querySelector('.pc-map');
      if (ll && iframe && iframe.tagName === 'IFRAME') {
        const prev = st.lastLL;
        const moved = !prev || Math.abs(prev[0] - ll[0]) > 0.0002 || Math.abs(prev[1] - ll[1]) > 0.0002;
        if (moved) { iframe.src = gmapUrl(ll[0], ll[1]); st.lastLL = ll; }
      } else if (ll && (!iframe || iframe.tagName !== 'IFRAME')) {
        el.innerHTML = render(card, hass); mount(card, hass, el); return;
      }
      fit(el); // il nome può essere cambiato → riscala
    } catch (e) {}
  }

  // ── config: modale a tutto schermo ─────────────────────────────────────────────
  function openConfig(card, el, hass) {
    const H = bestHass();
    const personId = getPerson(card), gpsId = getGps(card);
    const opts = (prefix, sel) => {
      const states = (H && H.states) || {};
      const list = Object.keys(states).filter(id => id.startsWith(prefix)).sort().map(id => {
        const fn = (states[id].attributes && states[id].attributes.friendly_name) || id;
        return `<option value="${id}" ${id === sel ? 'selected' : ''}>${fn} (${id})</option>`;
      });
      return `<option value="">— nessuna —</option>` + list.join('');
    };
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.74);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML = `
      <div style="width:min(440px,94vw);max-height:90vh;overflow:auto;background:#0b1220;border:1px solid rgba(255,255,255,.14);
        border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9">
        <style>
          .pccfg-sel{width:100%;margin-top:6px;padding:11px 12px;border-radius:11px;background:#0f1830;color:#f1f5f9;
            border:1px solid rgba(255,255,255,.20);font-size:13px;font-family:inherit}
          .pccfg-sel option,.pccfg-sel optgroup{background:#0f1830;color:#f1f5f9}
          .pccfg-lbl{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8}
        </style>
        <div style="font-size:16px;font-weight:800;margin-bottom:16px">👤 Configura card persona</div>
        <label class="pccfg-lbl">Entità Person</label>
        <select id="pccfg-person" class="pccfg-sel">${opts('person.', personId)}</select>
        <label class="pccfg-lbl" style="margin-top:14px">Entità GPS (device_tracker) — opzionale</label>
        <select id="pccfg-gps" class="pccfg-sel">${opts('device_tracker.', gpsId)}</select>
        <div style="font-size:11px;color:#64748b;margin-top:8px;line-height:1.5">Se lasci il GPS vuoto, la posizione viene presa dalla person stessa o dal suo tracker attivo.</div>
        <div style="display:flex;gap:10px;margin-top:20px">
          <button id="pccfg-cancel" style="flex:1;padding:12px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>
          <button id="pccfg-save" style="flex:1;padding:12px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('#pccfg-cancel').addEventListener('click', close);
    ov.querySelector('#pccfg-save').addEventListener('click', () => {
      const p = ov.querySelector('#pccfg-person').value;
      const g = ov.querySelector('#pccfg-gps').value;
      saveCfg(card, { person: p, gps: g });
      card.person = p; card.gps = g;
      close();
      try { el.innerHTML = render(card, hass); mount(card, hass, el); } catch (e) {}
    });
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
            <div style="font-size:15px;font-weight:800">${nm} — tracciati</div>
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
      // TUTTO lo storico disponibile (nessun limite 24h), dalle 2 entità (person + GPS): una o l'altra
      const cand = [...new Set([getGps(card), attrs(H, personId).source, ent, personId].filter(Boolean))];
      const start = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
      let data = null;
      if (H && typeof H.callApi === 'function') {
        data = await H.callApi('GET', `history/period/${start}?filter_entity_id=${cand.map(encodeURIComponent).join(',')}&minimal_response=false&significant_changes_only=false`);
      }
      const raw = [];
      (data || []).forEach(series => (series || []).forEach(s => {
        const a = s.attributes || {};
        if (a.latitude != null && a.longitude != null) raw.push({ lat: +a.latitude, lon: +a.longitude, t: +new Date(s.last_changed || s.last_updated || 0) });
      }));
      raw.sort((x, y) => x.t - y.t);
      pts = raw.map(p => [p.lat, p.lon]);
    } catch (e) {}

    const mapDiv = ov.querySelector('#pc-hist-map');
    try {
      const map = L.map(mapDiv, { zoomControl: true, attributionControl: false });
      // tile SATELLITE (Esri World Imagery, senza chiave)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }).addTo(map);
      const mkIcon = () => markerIcon(L, zoneInfo(stateOf(H, personId)).color, picUrl(H, personId), initials(nameOf(H, personId)));
      if (pts.length) {
        L.polyline(pts, { color: '#38bdf8', weight: 4, opacity: .9 }).addTo(map);
        L.circleMarker(pts[0], { radius: 7, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }).addTo(map).bindTooltip('Inizio');
        L.marker(pts[pts.length - 1], { icon: mkIcon(), zIndexOffset: 1000 }).addTo(map);   // posizione attuale
        map.fitBounds(L.latLngBounds(pts).pad(0.15));
        if (sub) sub.textContent = pts.length + ' punti registrati';
      } else {
        const cur = latlon(H, personId, getGps(card));
        if (cur) { map.setView([cur[0], cur[1]], 16); L.marker([cur[0], cur[1]], { icon: mkIcon() }).addTo(map); }
        else map.setView([41.9, 12.5], 5);
        if (sub) sub.textContent = 'Nessuno storico posizione (serve un device_tracker GPS che registri lat/lon)';
      }
      setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 80);
    } catch (e) { if (sub) sub.textContent = 'Errore mappa: ' + (e && e.message || e); }
  }

  const CARD = {
    id: 'person-card',
    name: 'Persona',
    icon: '👤',
    version: '1.13',
    desc: 'Foto persona + tracker, sfondo Google Maps live, stato zona colorato e storico 24h. Contenuto che scala con la dimensione della card.',
    noAutoFit: true,   // ha già il suo scaling interno (mappa a tutto sfondo) → niente auto-fit del core
    render, mount, update
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: person-card v' + CARD.version); } catch (e) {}
})();
