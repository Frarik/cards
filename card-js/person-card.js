/**
 * person-card.js v1.12 — FratechStore Card "Persona"
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
  function getW(card) { const c = loadCfg(card); return parseInt(c.w, 10) || 0; }   // larghezza px (0 = automatica)
  function getH(card) { const c = loadCfg(card); return parseInt(c.h, 10) || 0; }   // altezza px (0 = automatica)

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
    const _W = getW(card), _H = getH(card);
    const _sz = (_W ? `width:${_W}px;max-width:100%;` : '') + (_H ? `height:${_H}px;` : '');

    return `<style>${baseCss(rid)}</style><div id="${rid}" class="pc-root" style="--pc-col:${zi.color};--pc-glow:${zi.glow};${_sz}">
      ${mapHtml}
      <div class="pc-scrim"></div>
      <div class="pc-mapmask"></div>
      <div class="pc-mapmask-tr"></div>
      <button data-pc-cfg title="Impostazioni" style="position:absolute;top:8px;right:8px;z-index:5;width:26px;height:26px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(0,0,0,.4);color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;pointer-events:auto">⚙️</button>
      <div class="pc-stage"><div class="pc-content">
        <div class="pc-ava" style="${avaStyle}">${avaInner}</div>
        <div class="pc-info">
          <div class="pc-name">${nm}</div>
          <div class="pc-row2"><span class="pc-pill"><span class="pc-pilltxt">${zi.label}</span></span></div>
          <div class="pc-ago">${ago || ''}</div>
        </div>
      </div></div>
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
    </div>`;
  }

  function baseCss(rid) {
    return `
#${rid}.pc-root{position:relative;width:100%;height:100%;min-height:64px;border-radius:18px;overflow:hidden;
  font-family:var(--primary-font-family,'Inter',system-ui,-apple-system,sans-serif);color:#fff;
  background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border:1px solid rgba(255,255,255,.10);}
/* mappa estesa e ritagliata (44px sopra+sotto) per nascondere barra Google + controlli, segnaposto centrato */
#${rid} .pc-map{position:absolute;left:0;right:0;top:-44px;width:100%;height:calc(100% + 88px);border:0;z-index:0;pointer-events:none;filter:saturate(1.05);}
#${rid} .pc-map-empty{background:radial-gradient(120% 120% at 75% 30%,#27364b,#0b1220);}
/* sfumatura piena in basso: copre la scritta "Google" e il controllo schermo-intero (le freccette) */
#${rid} .pc-mapmask{position:absolute;left:0;right:0;bottom:0;height:34px;z-index:1;pointer-events:none;
  background:linear-gradient(to top,rgba(8,12,22,.92) 0%,rgba(8,12,22,.55) 55%,rgba(8,12,22,0) 100%);}
/* maschera angolo in alto a dx: nasconde l'eventuale controllo (freccette) dell'embed Google */
#${rid} .pc-mapmask-tr{position:absolute;right:0;top:0;width:58px;height:46px;z-index:1;pointer-events:none;
  background:radial-gradient(125% 125% at 100% 0%,rgba(8,12,22,.96),rgba(8,12,22,.6) 45%,rgba(8,12,22,0) 75%);}
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
#${rid} .pc-ago{font-size:12px;color:#fff;margin-top:5px;white-space:nowrap;}
`;
  }

  function mount(card, hass, el) {
    try {
      ST[card.id] = ST[card.id] || {};
      const st = ST[card.id];

      // rende trasparente la cornice base ".card" del dashboard: la card è solo la .pc-root
      // (così stringendola non resta il "riquadro" attorno)
      try {
        const cardEl = el.closest && el.closest('.card');
        if (cardEl) {
          cardEl.style.background = 'transparent';
          cardEl.style.boxShadow = 'none';
          cardEl.style.padding = '0';
          cardEl.style.border = 'none';
          cardEl.style.backdropFilter = 'none';
          cardEl.style.webkitBackdropFilter = 'none';
        }
      } catch (e) {}
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
          if (e.target.closest('[data-pc-cfg]')) { e.stopPropagation(); openConfig(card, el, hass); return; }
          const t = e.target.closest('[data-pc]');
          const act = t && t.getAttribute('data-pc');
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
  function openConfig(card, el) {
    const H = bestHass();
    const c = loadCfg(card);
    const personId = getPerson(card), gpsId = getGps(card);
    const states = (H && H.states) || {};
    const allIds = Object.keys(states).sort();
    const stInp = 'width:100%;padding:9px 11px;border-radius:9px;background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:10;max-height:180px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 9px 9px;display:none;scrollbar-width:none';
    const stLbl = 'display:block;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#fff;margin-bottom:3px';
    var _fll=JSON.parse(localStorage.getItem('_frk_layout_'+(card.id||''))||'{}');
    let cardScaleV=_fll.cardScale!=null?_fll.cardScale:(c.cardScale||100), cardWV=_fll.cardW!=null?_fll.cardW:(c.cardW||100);
    let _prevTimer = null;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML = `<style>@keyframes pcSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@media(max-width:600px){.frk-cfg-cols{flex-direction:column!important;overflow-y:auto!important;overflow-x:hidden!important}.frk-form-col{width:100%!important;border-right:none!important;border-bottom:1px solid rgba(255,255,255,.07)!important;overflow-y:visible!important;flex-shrink:0!important}.frk-prev-col{min-width:0!important;overflow-y:visible!important}}</style>
      <div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(139,92,246,.32);border-bottom:none;
        border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:pcSlideUp .22s cubic-bezier(.32,1.12,.56,1)">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">
          <div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);color:#fbbf24;flex-shrink:0">👤</div>
          <div><div style="font-size:14px;font-weight:800">Configura card persona</div><div style="font-size:11px;color:#fff;margin-top:1px">${card.id}</div></div>
          <button id="pccfg-hdr-close" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>
        </div>
        <div class="frk-cfg-cols" style="display:flex;flex:1;overflow:hidden;min-height:0">
          <div class="frk-form-col" style="width:380px;flex-shrink:0;overflow-y:auto;padding:14px 16px;border-right:1px solid rgba(255,255,255,.07);scrollbar-width:none" id="pccfg-form-col">
            <label style="${stLbl}">Entità Person</label>
            <div style="position:relative;margin-bottom:12px">
              <input id="pccfg-person" type="text" value="${personId}" autocomplete="off"
                placeholder="person.nome" style="${stInp}">
              <div id="pccfg-person-d" style="${stDrop}"></div>
            </div>
            <label style="${stLbl}">Entità GPS (device_tracker) — opzionale</label>
            <div style="position:relative;margin-bottom:6px">
              <input id="pccfg-gps" type="text" value="${gpsId}" autocomplete="off"
                placeholder="device_tracker.xxx" style="${stInp}">
              <div id="pccfg-gps-d" style="${stDrop}"></div>
            </div>
            <div style="font-size:10px;color:#fff;margin-bottom:16px;line-height:1.5">Se vuoto, la posizione viene presa dalla person stessa o dal tracker attivo.</div>
            <div style="display:flex;gap:8px;margin-top:4px">
              <button id="pccfg-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>
              <button id="pccfg-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#fbbf24;color:#0a0816">Salva</button>
            </div>
          </div>
          <div class="frk-prev-col" style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:10px;padding:14px 16px;overflow-y:auto;background:rgba(0,0,0,.15);scrollbar-width:none">
            <div style="font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.07em">Anteprima live</div>
            <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.08)"><div id="pccfg-prev-inner"></div></div>
            <div style="padding-top:12px;border-top:1px solid rgba(255,255,255,.08)">
              <div style="font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Dimensioni card</div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                <span style="font-size:11px;font-weight:700;color:#fff;width:72px;flex-shrink:0">Altezza</span>
                <input type="range" id="pccfg-cardscale" min="20" max="100" step="5" value="${cardScaleV}" style="flex:1;cursor:pointer;accent-color:#fbbf24;height:4px">
                <span id="pccfg-cardscale-lbl" style="font-size:12px;font-weight:800;color:#fbbf24;width:64px;text-align:right;flex-shrink:0">${cardScaleV >= 100 ? 'Auto (100%)' : cardScaleV + '%'}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                <span style="font-size:11px;font-weight:700;color:#fff;width:72px;flex-shrink:0">Larghezza</span>
                <input type="range" id="pccfg-cardw" min="20" max="100" step="5" value="${cardWV}" style="flex:1;cursor:pointer;accent-color:#fbbf24;height:4px">
                <span id="pccfg-cardw-lbl" style="font-size:12px;font-weight:800;color:#fbbf24;width:64px;text-align:right;flex-shrink:0">${cardWV >= 100 ? 'Auto (100%)' : cardWV + '%'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const close = () => { if (_prevTimer) clearTimeout(_prevTimer); try { localStorage.removeItem(cfgKey({id:'__prev__'})); } catch(e) {} try { document.body.removeChild(ov); } catch (e) {} };
    ov.querySelector('#pccfg-hdr-close').addEventListener('click', close);
    ov.querySelector('#pccfg-cancel').addEventListener('click', close);

    function updatePrev() {
      const prevEl = ov.querySelector('#pccfg-prev-inner');
      if (!prevEl) return;
      const scV = parseInt((ov.querySelector('#pccfg-cardscale') || {}).value) || 100;
      const wV  = parseInt((ov.querySelector('#pccfg-cardw') || {}).value) || 100;
      try {
        const p = ov.querySelector('#pccfg-person').value.trim();
        const g = ov.querySelector('#pccfg-gps').value.trim();
        const tmpCfg = Object.assign({}, c, { person: p, gps: g, cardScale: 100, cardW: 100 });
        localStorage.setItem(cfgKey({id:'__prev__'}), JSON.stringify(tmpCfg));
        prevEl.innerHTML = render({id:'__prev__'}, H);
        prevEl.style.zoom = scV < 100 ? scV + '%' : '';
        prevEl.style.width = wV < 100 ? wV + '%' : '';
      } catch(e) {}
    }
    function schedPrev() {
      if (_prevTimer) clearTimeout(_prevTimer);
      _prevTimer = setTimeout(updatePrev, 180);
    }
    updatePrev();

    ov.querySelector('#pccfg-cardscale').addEventListener('input', function() {
      cardScaleV = parseInt(this.value) || 100;
      ov.querySelector('#pccfg-cardscale-lbl').textContent = cardScaleV >= 100 ? 'Auto (100%)' : cardScaleV + '%';
      schedPrev();
    });
    ov.querySelector('#pccfg-cardw').addEventListener('input', function() {
      cardWV = parseInt(this.value) || 100;
      ov.querySelector('#pccfg-cardw-lbl').textContent = cardWV >= 100 ? 'Auto (100%)' : cardWV + '%';
      schedPrev();
    });

    // Combobox helper
    function attachCombo(inpId, dropId) {
      const inp2 = ov.querySelector('#' + inpId);
      const drop = ov.querySelector('#' + dropId);
      if (!inp2 || !drop) return;
      function showDrop() {
        const q = inp2.value.toLowerCase().trim();
        const hits = (q
          ? allIds.filter(id => id.toLowerCase().includes(q) || ((states[id]?.attributes?.friendly_name||'').toLowerCase().includes(q)))
          : allIds
        ).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(id => {
          const fn = states[id]?.attributes?.friendly_name || '';
          return `<div data-pick="${id}" style="padding:6px 11px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)">
            <span style="color:#fff">${id}</span>${fn ? `<span style="color:#fff;margin-left:7px;font-family:system-ui;font-size:10px">${fn}</span>` : ''}
          </div>`;
        }).join('');
        drop.querySelectorAll('[data-pick]').forEach(row => {
          row.addEventListener('mousedown', ev => { ev.preventDefault(); inp2.value = row.getAttribute('data-pick'); drop.style.display = 'none'; schedPrev(); });
          row.addEventListener('mouseover', () => { row.style.background = 'rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout',  () => { row.style.background = ''; });
        });
      }
      inp2.addEventListener('focus', showDrop);
      inp2.addEventListener('input', () => { showDrop(); schedPrev(); });
      inp2.addEventListener('blur',  () => setTimeout(() => { drop.style.display = 'none'; }, 200));
    }
    attachCombo('pccfg-person', 'pccfg-person-d');
    attachCombo('pccfg-gps',    'pccfg-gps-d');

    ov.querySelector('#pccfg-save').addEventListener('click', () => {
      const p = ov.querySelector('#pccfg-person').value.trim();
      const g = ov.querySelector('#pccfg-gps').value.trim();
      saveCfg(card, Object.assign({}, c, { person: p, gps: g, w: 0, h: 0, cardScale: cardScaleV, cardW: cardWV }));
      card.person = p; card.gps = g;
      document.dispatchEvent(new CustomEvent('frarik-card-layout', { bubbles: true, composed: true, detail: { cardId: card.id, cardScale: cardScaleV, cardW: cardWV } }));
      close();
      try { el.innerHTML = render(card, bestHass()); mount(card, bestHass(), el); } catch (e) {}
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
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML = `<style>@keyframes pcMapSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>
      <div style="position:relative;width:100%;height:92vh;border-radius:20px 20px 0 0;overflow:hidden;
        background:#0a0816;border:1px solid rgba(139,92,246,.32);border-bottom:none;box-shadow:0 -12px 60px rgba(0,0,0,.8);display:flex;flex-direction:column;animation:pcMapSlideUp .22s cubic-bezier(.32,1.12,.56,1)">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08);color:#fff">
          <span style="font-size:18px">🗺️</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:15px;font-weight:800">${nm} — spostamenti 24h</div>
            <div style="font-size:11px;opacity:.6" id="pc-hist-sub">Caricamento percorso…</div>
          </div>
          <button id="pc-hist-x" style="width:34px;height:34px;border-radius:10px;border:none;cursor:pointer;background:rgba(255,255,255,.08);color:#fff;font-size:18px">✕</button>
        </div>
        <div id="pc-hist-map" style="flex:1;min-height:0;background:#0b1220"></div>
      </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
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
      series.forEach(s => { const a = s.attributes || {}; if (a.latitude != null && a.longitude != null) pts.push([a.latitude, a.longitude]); });
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

  const CARD = {
    id: 'person-card',
    name: 'Persona',
    icon: '👤',
    version: '1.11',
    desc: 'Foto persona + tracker, sfondo Google Maps live, stato zona colorato e storico 24h. Contenuto che scala con la dimensione della card.',
    noAutoFit: true,   // ha già il suo scaling interno (mappa a tutto sfondo) → niente auto-fit del core
    render, mount, update, configure: openConfig
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: person-card v' + CARD.version); } catch (e) {}
})();
