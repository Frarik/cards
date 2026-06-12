/* frarik-version: 1.2 */
(function () {
  'use strict';

  /* ── Helpers ── */
  function H() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch(e) {}
    return null;
  }
  function keyOf(c)  { return 'frarik_cam_' + (c.id || 'x'); }
  function load(c)   { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch(e) { return {}; } }
  function save(c,o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch(e) {} }
  function eh(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* Snapshot URL con cache-buster (miniature + fallback) */
  function camThumbUrl(entityId, h, ts) {
    if (!entityId || !h) return '';
    const st = h.states[entityId]; if (!st) return '';
    const ep = (st.attributes || {}).entity_picture; if (!ep) return '';
    const base = /^https?:/i.test(ep) ? ep : (typeof h.hassUrl === 'function' ? h.hassUrl(ep) : ep);
    const clean = base.replace(/[?&]_=\d+/g, '');
    return clean + (clean.includes('?') ? '&' : '?') + '_=' + (ts || Date.now());
  }

  /* MJPEG stream URL (solo se deriva da /api/camera_proxy/) */
  function camMjpegUrl(entityId, h) {
    if (!entityId || !h) return '';
    const st = h.states[entityId]; if (!st) return '';
    const ep = (st.attributes || {}).entity_picture; if (!ep) return '';
    if (!ep.includes('/api/camera_proxy/')) return '';
    const stream = ep.replace('/api/camera_proxy/', '/api/camera_proxy_stream/');
    return /^https?:/i.test(stream) ? stream : (typeof h.hassUrl === 'function' ? h.hassUrl(stream) : stream);
  }

  /* HLS URL via WebSocket HA (camera/stream) → video fluido */
  function getHlsUrl(entityId, h) {
    return new Promise(function(resolve) {
      try {
        if (!h || !h.connection || typeof h.connection.sendMessagePromise !== 'function') { resolve(null); return; }
        h.connection.sendMessagePromise({ type: 'camera/stream', entity_id: entityId })
          .then(function(r) {
            if (r && r.url) {
              const url = /^https?:/i.test(r.url) ? r.url : (typeof h.hassUrl === 'function' ? h.hassUrl(r.url) : r.url);
              resolve(url);
            } else resolve(null);
          })
          .catch(function() { resolve(null); });
      } catch(e) { resolve(null); }
    });
  }

  /* Carica HLS.js una volta sola (per Chrome/Firefox che non supportano HLS nativo) */
  var _hlsState = 0; // 0=idle, 1=loading, 2=ok, 3=fail
  var _hlsCbs = [];
  function loadHlsJs(cb) {
    if (_hlsState === 2) { cb(true);  return; }
    if (_hlsState === 3) { cb(false); return; }
    _hlsCbs.push(cb);
    if (_hlsState === 1) return;
    _hlsState = 1;
    /* Prova prima se HA ha già caricato HLS.js nel frontend */
    if (window.Hls) { _hlsState = 2; _hlsCbs.forEach(function(f){f(true);}); _hlsCbs = []; return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
    s.onload  = function() { _hlsState = 2; _hlsCbs.forEach(function(f){f(true);}); _hlsCbs = []; };
    s.onerror = function() { _hlsState = 3; _hlsCbs.forEach(function(f){f(false);}); _hlsCbs = []; };
    document.head.appendChild(s);
  }

  /* Istanze HLS.js attive: card+camIdx → istanza */
  var _hlsInstances = {};
  function destroyHls(key) {
    if (_hlsInstances[key]) { try { _hlsInstances[key].destroy(); } catch(e) {} delete _hlsInstances[key]; }
  }

  function battPct(batEntity, h) {
    if (!batEntity || !h) return null;
    const s = h.states[batEntity];
    return (s && !isNaN(parseFloat(s.state))) ? parseFloat(s.state) : null;
  }
  function battColor(pct) {
    if (pct > 60) return '#4ade80'; if (pct > 30) return '#facc15';
    if (pct > 10) return '#fb923c'; return '#f87171';
  }
  function battHtml(pct, batEntity) {
    if (pct !== null) return '<span style="color:'+battColor(pct)+'">🔋 '+Math.round(pct)+'%</span>';
    if (batEntity)    return '<span style="color:rgba(255,255,255,.2)">🔋 —</span>';
    return '<span style="color:rgba(255,255,255,.18)">🔌</span>';
  }

  /* ── Stato modulo ── */
  var _selectedCam   = {};
  var _refreshTimers = {};
  var _lastKeys      = {};

  function _sel(card, cams) {
    const i = _selectedCam[card.id] || 0;
    return cams.length ? Math.min(Math.max(0, i), cams.length - 1) : 0;
  }
  function _stateKey(card, h) {
    try {
      const c = load(card), cams = c.cameras || [];
      return cams.map(function(cam) {
        const cs = h && h.states[cam.entity];
        const bs = cam.battery && h && h.states[cam.battery];
        return (cs ? cs.state : '?') + ':' + (bs ? Math.round(parseFloat(bs.state)||0) : '-');
      }).join(',');
    } catch(e) { return String(Date.now()); }
  }

  /* ── Imposta lo stream nella vista principale (asincrono) ──
     Ordine di priorità: HLS video → MJPEG img → snapshot con refresh */
  function _applyMainStream(card, el, si) {
    const h = H(), c = load(card), cams = c.cameras || [];
    const cam = cams[si]; if (!cam || !el.isConnected) return;
    const wrap = el.querySelector('[data-cam-main-wrap]'); if (!wrap) return;
    const hlsKey = card.id + '_' + si;

    /* Pulisce eventuale istanza HLS precedente */
    destroyHls(hlsKey);

    getHlsUrl(cam.entity, h).then(function(hlsUrl) {
      if (!el.isConnected || _sel(card, cams) !== si) return;

      if (hlsUrl) {
        /* ── Percorso 1: HLS (fluido, ~1-3s latenza) ── */
        const vid = document.createElement('video');
        vid.autoplay = true; vid.muted = true; vid.playsInline = true;
        vid.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';

        const canNative = vid.canPlayType('application/vnd.apple.mpegurl') !== '';
        if (canNative) {
          vid.src = hlsUrl;
          wrap.innerHTML = ''; wrap.appendChild(vid);
          vid.play().catch(function(){});
        } else {
          loadHlsJs(function(ok) {
            if (!el.isConnected || _sel(card, cams) !== si) return;
            if (ok && window.Hls && window.Hls.isSupported()) {
              const hls = new window.Hls({ lowLatencyMode: true });
              _hlsInstances[hlsKey] = hls;
              hls.loadSource(hlsUrl);
              hls.attachMedia(vid);
              wrap.innerHTML = ''; wrap.appendChild(vid);
              hls.on(window.Hls.Events.MANIFEST_PARSED, function() { vid.play().catch(function(){}); });
            } else {
              _applyMjpegOrSnapshot(cam, h, wrap, card, el, si);
            }
          });
        }
      } else {
        /* ── Percorso 2/3: MJPEG o snapshot ── */
        _applyMjpegOrSnapshot(cam, h, wrap, card, el, si);
      }
    });
  }

  function _applyMjpegOrSnapshot(cam, h, wrap, card, el, si) {
    const mjpeg = camMjpegUrl(cam.entity, h);
    const img = document.createElement('img');
    img.setAttribute('data-cam-main-img', '');
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';

    if (mjpeg) {
      img.src = mjpeg;
      img.onerror = function() {
        /* MJPEG fallito → passa a snapshot con refresh */
        _applySnapshotRefresh(cam, h, img, card, el);
      };
    } else {
      _applySnapshotRefresh(cam, h, img, card, el);
    }
    wrap.innerHTML = ''; wrap.appendChild(img);
  }

  function _applySnapshotRefresh(cam, h, img, card, el) {
    img.onerror = null;
    function refreshSnap() {
      if (!el.isConnected) return;
      const url = camThumbUrl(cam.entity, h);
      if (url) img.src = url;
    }
    refreshSnap();
    /* Refresh rapido per la vista principale in modalità snapshot */
    if (!card._snapTimer) card._snapTimer = {};
    clearInterval(card._snapTimer[cam.entity]);
    card._snapTimer[cam.entity] = setInterval(function() {
      if (!el.isConnected) { clearInterval(card._snapTimer[cam.entity]); return; }
      refreshSnap();
    }, 3000);
  }

  /* ── Aggiorna overlay senza toccare lo stream ── */
  function _updateOverlays(card, el) {
    const h = H(), c = load(card), cams = c.cameras || [];
    const si = _sel(card, cams), sel = cams[si]; if (!sel) return;

    const mainBatEl = el.querySelector('[data-cam-bat-ov]');
    if (mainBatEl) {
      const pct = battPct(sel.battery, h);
      if (pct !== null) { mainBatEl.textContent='🔋 '+Math.round(pct)+'%'; mainBatEl.style.color=battColor(pct); mainBatEl.style.display=''; }
      else mainBatEl.style.display = 'none';
    }
    const unavEl = el.querySelector('[data-cam-unavail]');
    if (unavEl) unavEl.style.display = (h&&h.states[sel.entity]&&h.states[sel.entity].state==='unavailable') ? 'flex' : 'none';
    cams.forEach(function(cam, i) {
      const b = el.querySelector('[data-cam-bat-thumb="'+i+'"]');
      if (b) b.innerHTML = battHtml(battPct(cam.battery, h), cam.battery);
    });
  }

  /* ── Cambia telecamera senza re-render ── */
  function _switchCam(card, el, newIdx) {
    const h = H(), c = load(card), cams = c.cameras || [];
    if (!cams.length || newIdx < 0 || newIdx >= cams.length) return;
    const prevIdx = _sel(card, cams);
    _selectedCam[card.id] = newIdx;
    const sel = cams[newIdx];

    /* Aggiorna stream principale */
    _applyMainStream(card, el, newIdx);

    /* Aggiorna overlay nome */
    const nameEl = el.querySelector('[data-cam-name-ov]');
    if (nameEl) nameEl.textContent = sel.name || sel.entity;

    /* Aggiorna overlay batteria */
    const batEl = el.querySelector('[data-cam-bat-ov]');
    if (batEl) {
      const pct = battPct(sel.battery, h);
      if (pct !== null) { batEl.textContent='🔋 '+Math.round(pct)+'%'; batEl.style.color=battColor(pct); batEl.style.display=''; }
      else batEl.style.display = 'none';
    }

    /* Aggiorna highlight miniature */
    el.querySelectorAll('[data-cam-idx]').forEach(function(thumb) {
      const i = parseInt(thumb.getAttribute('data-cam-idx'));
      const active = (i === newIdx);
      thumb.style.outline      = '2px solid '+(active ? '#818cf8' : 'transparent');
      thumb.style.outlineOffset= '1px';
      thumb.style.boxShadow    = active ? '0 0 10px rgba(129,140,248,.45)' : '0 2px 8px rgba(0,0,0,.55)';
    });

    /* Distruggi HLS della cam precedente se diversa */
    if (prevIdx !== newIdx) destroyHls(card.id + '_' + prevIdx);
  }

  /* ── RENDER (struttura, immagine placeholder per la main — lo stream viene in mount) ── */
  function render(card) {
    const h = H(), c = load(card), cams = c.cameras || [];
    const rid = 'cam' + (card.id || Math.random().toString(36).slice(2,8));

    if (!cams.length) {
      return '<div id="'+rid+'" style="display:flex;flex-direction:column;align-items:center;justify-content:center;'
        +'height:100%;gap:12px;padding:20px;text-align:center;color:rgba(255,255,255,.3)">'
        +'<div style="font-size:40px;opacity:.35">📷</div>'
        +'<div style="font-size:13px;font-weight:700">Nessuna telecamera</div>'
        +'<div style="font-size:11px;line-height:1.6;opacity:.7">Apri ✏️ → ⚙️ per aggiungere le telecamere</div>'
        +'</div>';
    }

    const si  = _sel(card, cams);
    const sel = cams[si];
    const ts  = Date.now();
    const initThumb = camThumbUrl(sel.entity, h, ts); /* placeholder mentre lo stream parte */
    const mainState = h && h.states[sel.entity];
    const isUnavail = mainState && mainState.state === 'unavailable';
    const pctMain   = battPct(sel.battery, h);

    const mainView =
      '<div style="position:relative;flex:1;min-height:0;border-radius:12px;overflow:hidden;background:#050810">'
        /* wrap dove viene iniettato il video/img da _applyMainStream */
        +'<div data-cam-main-wrap style="width:100%;height:100%">'
          +(initThumb
            ? '<img src="'+eh(initThumb)+'" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.opacity=\'.06\'" />'
            : '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">'
                +'<span style="font-size:32px;opacity:.1">📷</span></div>'
          )
        +'</div>'
        +'<div data-cam-unavail style="position:absolute;inset:0;background:rgba(0,0,0,.72);'
          +'display:'+(isUnavail?'flex':'none')+';align-items:center;justify-content:center">'
          +'<span style="font-size:10px;color:rgba(255,255,255,.3);font-weight:800;letter-spacing:.07em;text-transform:uppercase">Non disponibile</span>'
        +'</div>'
        +'<div style="position:absolute;bottom:0;left:0;right:0;padding:26px 10px 9px;'
          +'background:linear-gradient(transparent,rgba(0,0,0,.82))">'
          +'<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px">'
            +'<span data-cam-name-ov style="font-size:12px;font-weight:800;color:#fff;'
              +'text-shadow:0 1px 4px rgba(0,0,0,.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'
              +eh(sel.name || sel.entity)
            +'</span>'
            +'<span data-cam-bat-ov style="font-size:10px;font-weight:700;flex-shrink:0;'
              +'background:rgba(0,0,0,.55);border-radius:5px;padding:2px 7px;'
              +'color:'+battColor(pctMain !== null ? pctMain : 100)+';'
              +'display:'+(pctMain !== null ? '' : 'none')+'">'
              +(pctMain !== null ? '🔋 '+Math.round(pctMain)+'%' : '')
            +'</span>'
          +'</div>'
        +'</div>'
      +'</div>';

    var thumbsHtml = '';
    if (cams.length > 1) {
      const multiRow = cams.length > 4;
      thumbsHtml = '<div style="display:flex;gap:5px;flex-shrink:0;'+(multiRow?'overflow-x:auto;padding-bottom:2px':'')+'">'
        +cams.map(function(cam, i) {
          const active  = (i === si);
          const tUrl    = camThumbUrl(cam.entity, h, ts);
          const pct     = battPct(cam.battery, h);
          const camSt   = h && h.states[cam.entity];
          const unavail = camSt && camSt.state === 'unavailable';
          return '<div data-cam-idx="'+i+'" data-action="selcam" data-val="'+i+'" style="'
            +'flex:1;'+(multiRow?'min-width:80px;':'')+'cursor:pointer;position:relative;'
            +'border-radius:8px;overflow:hidden;background:#050810;'
            +'outline:2px solid '+(active?'#818cf8':'transparent')+';outline-offset:1px;'
            +'box-shadow:'+(active?'0 0 10px rgba(129,140,248,.45)':'0 2px 8px rgba(0,0,0,.55)')+'">'
            +'<div style="padding-top:56.25%;position:relative"><div style="position:absolute;inset:0">'
              +(tUrl
                ? '<img data-cam-thumb="'+i+'" src="'+eh(tUrl)+'" style="width:100%;height:100%;object-fit:cover;display:block'+(unavail?';opacity:.25':'')+'" onerror="this.style.opacity=\'.05\'" />'
                : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-size:14px;opacity:.12">📷</span></div>'
              )
            +'</div></div>'
            +'<div style="background:rgba(0,0,0,.82);backdrop-filter:blur(6px);padding:3px 5px 4px">'
              +'<div style="font-size:8px;font-weight:700;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+eh(cam.name||cam.entity.split('.').pop())+'</div>'
              +'<div data-cam-bat-thumb="'+i+'" style="font-size:8px;margin-top:1px">'+battHtml(pct, cam.battery)+'</div>'
            +'</div>'
          +'</div>';
        }).join('')
        +'</div>';
    }

    return '<div id="'+rid+'" style="display:flex;flex-direction:column;height:100%;padding:8px;gap:6px;box-sizing:border-box">'
      +mainView+thumbsHtml+'</div>';
  }

  /* ── Refresh miniature (non tocca lo stream principale) ── */
  function _refreshThumbs(card, el) {
    const h = H(), c = load(card), cams = c.cameras || [];
    if (!cams.length || !el.isConnected) return;
    const ts = Date.now();
    el.querySelectorAll('[data-cam-thumb]').forEach(function(img) {
      const cam = cams[parseInt(img.getAttribute('data-cam-thumb'))]; if (!cam) return;
      const url = camThumbUrl(cam.entity, h, ts);
      if (url) img.src = url;
    });
  }

  /* ── MOUNT ── */
  function mount(card, hass, el) {
    el.removeEventListener('click', el._camHandler);
    el._camHandler = function(ev) {
      const t = ev.target.closest('[data-action="selcam"]'); if (!t) return;
      _switchCam(card, el, parseInt(t.getAttribute('data-val')));
    };
    el.addEventListener('click', el._camHandler);

    /* Avvia stream principale */
    const c = load(card), cams = c.cameras || [];
    _applyMainStream(card, el, _sel(card, cams));

    /* Refresh miniature ogni 10s */
    if (_refreshTimers[card.id]) clearInterval(_refreshTimers[card.id]);
    _refreshTimers[card.id] = setInterval(function() {
      if (!el.isConnected) { clearInterval(_refreshTimers[card.id]); delete _refreshTimers[card.id]; return; }
      _refreshThumbs(card, el);
    }, 10000);
  }

  /* ── UPDATE ── */
  function update(card, hass, el) {
    try {
      const key = _stateKey(card, hass);
      if (_lastKeys[card.id] === key) return;
      _lastKeys[card.id] = key;
      _updateOverlays(card, el);
    } catch(e) {}
  }

  /* ── CONFIGURE ── */
  function openCfg(card, el) {
    const h = H(), c = load(card);
    const states  = (h && h.states) || {};
    const allIds  = Object.keys(states).sort();
    const camIds  = allIds.filter(function(id) { return id.startsWith('camera.'); });
    const sensIds = allIds.filter(function(id) { return id.startsWith('sensor.'); });
    var cams = JSON.parse(JSON.stringify(c.cameras || []));

    const stInp = 'width:100%;padding:8px 10px;border-radius:8px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:11px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:20;max-height:130px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 8px 8px;display:none';
    const stLbl  = 'font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:2px;display:block';

    function buildRow(cam, i) {
      return '<div data-cam-row="'+i+'" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:11px 13px">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px">'
          +'<span style="font-size:11px;font-weight:800;color:#818cf8">📷 Telecamera '+(i+1)+'</span>'
          +'<button data-action="delcam" data-idx="'+i+'" style="background:rgba(239,68,68,.18);border:1px solid rgba(239,68,68,.3);color:#fca5a5;border-radius:6px;padding:2px 8px;font-size:10px;cursor:pointer">🗑 Rimuovi</button>'
        +'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
          +'<div><label style="'+stLbl+'">Nome visualizzato</label>'
            +'<input data-cam-name="'+i+'" type="text" value="'+eh(cam.name||'')+'" placeholder="Ingresso" style="'+stInp+'"></div>'
          +'<div style="position:relative"><label style="'+stLbl+'">Entità camera</label>'
            +'<input data-cam-ent="'+i+'" type="text" value="'+eh(cam.entity||'')+'" autocomplete="off" placeholder="camera.xxx" style="'+stInp+'">'
            +'<div data-cam-ent-drop="'+i+'" style="'+stDrop+'"></div></div>'
          +'<div style="position:relative;grid-column:1/-1"><label style="'+stLbl+'">Sensore batteria <span style="font-weight:400;color:#475569;text-transform:none;letter-spacing:0">— vuoto se a corrente</span></label>'
            +'<input data-cam-bat="'+i+'" type="text" value="'+eh(cam.battery||'')+'" autocomplete="off" placeholder="sensor.camera_batteria" style="'+stInp+'">'
            +'<div data-cam-bat-drop="'+i+'" style="'+stDrop+'"></div></div>'
        +'</div></div>';
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.82);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';

    function buildDialog() {
      return '<div style="width:min(520px,94vw);max-height:90vh;overflow-y:auto;background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.7);padding:20px;color:#f1f5f9">'
        +'<div style="font-size:16px;font-weight:800;margin-bottom:14px">📷 Configura Telecamere</div>'
        +'<div id="cam-cfg-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">'
          +(cams.length ? cams.map(buildRow).join('') : '<div style="font-size:12px;color:rgba(255,255,255,.3);text-align:center;padding:16px">Nessuna telecamera — clicca "Aggiungi" per iniziare</div>')
        +'</div>'
        +'<button id="cam-cfg-add" style="width:100%;padding:9px;border-radius:9px;border:1px dashed rgba(129,140,248,.4);background:rgba(129,140,248,.07);color:#818cf8;cursor:pointer;font-size:12px;font-weight:700;margin-bottom:14px">+ Aggiungi telecamera</button>'
        +'<div style="display:flex;gap:10px">'
          +'<button id="cam-cfg-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>'
          +'<button id="cam-cfg-save"   style="flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#818cf8;color:#fff">Salva</button>'
        +'</div></div>';
    }

    ov.innerHTML = buildDialog();
    document.body.appendChild(ov);
    const close = function() { try { document.body.removeChild(ov); } catch(e) {} };
    ov.addEventListener('click', function(e){ if (e.target===ov) close(); });
    ov.querySelector('#cam-cfg-cancel').addEventListener('click', close);

    function makeCombo(inpSel, dropSel, defaults) {
      const inp = ov.querySelector(inpSel), drop = ov.querySelector(dropSel);
      if (!inp || !drop) return;
      function show() {
        const q = inp.value.toLowerCase().trim();
        const hits = (q ? allIds.filter(function(id){return id.toLowerCase().includes(q);}) : defaults).slice(0,60);
        if (!hits.length) { drop.style.display='none'; return; }
        drop.style.display='block';
        drop.innerHTML=hits.map(function(id){const fn=((states[id]||{}).attributes||{}).friendly_name||'';
          return '<div data-pick="'+id+'" style="padding:5px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)">'
            +'<span style="color:#e2e8f0">'+id+'</span>'+(fn?'<span style="color:#475569;margin-left:6px;font-family:system-ui;font-size:10px">'+fn+'</span>':'')+'</div>';
        }).join('');
        drop.querySelectorAll('[data-pick]').forEach(function(row){
          row.addEventListener('mousedown',function(ev){ev.preventDefault();inp.value=row.getAttribute('data-pick');drop.style.display='none';});
          row.addEventListener('mouseover',function(){row.style.background='rgba(255,255,255,.08)';});
          row.addEventListener('mouseout', function(){row.style.background='';});
        });
      }
      inp.addEventListener('focus',show); inp.addEventListener('input',show);
      inp.addEventListener('blur',function(){setTimeout(function(){drop.style.display='none';},200);});
    }
    function bindAllCombos() {
      cams.forEach(function(cam,i){
        makeCombo('[data-cam-ent="'+i+'"]','[data-cam-ent-drop="'+i+'"]',camIds);
        makeCombo('[data-cam-bat="'+i+'"]','[data-cam-bat-drop="'+i+'"]',sensIds);
      });
    }
    function readValues() {
      cams.forEach(function(cam,i){
        const n=ov.querySelector('[data-cam-name="'+i+'"]');
        const e=ov.querySelector('[data-cam-ent="'+i+'"]');
        const b=ov.querySelector('[data-cam-bat="'+i+'"]');
        if(n) cam.name=n.value.trim(); if(e) cam.entity=e.value.trim(); if(b) cam.battery=b.value.trim();
      });
    }
    function rebuildList() {
      const list=ov.querySelector('#cam-cfg-list');
      list.innerHTML=cams.length?cams.map(buildRow).join(''):'<div style="font-size:12px;color:rgba(255,255,255,.3);text-align:center;padding:16px">Nessuna telecamera — clicca "Aggiungi" per iniziare</div>';
      bindAllCombos();
    }
    bindAllCombos();

    ov.addEventListener('click',function(e){
      const b=e.target.closest('[data-action="delcam"]'); if(!b) return;
      readValues(); cams.splice(parseInt(b.getAttribute('data-idx')),1); rebuildList();
    });
    ov.querySelector('#cam-cfg-add').addEventListener('click',function(){
      readValues(); cams.push({entity:'',name:'',battery:''}); rebuildList();
      const inner=ov.querySelector('div'); if(inner) inner.scrollTop=99999;
    });
    ov.querySelector('#cam-cfg-save').addEventListener('click',function(){
      readValues();
      const validCams=cams.filter(function(cam){return cam.entity.trim();});
      save(card,Object.assign({},c,{cameras:validCams}));
      close(); _lastKeys[card.id]=null;
      el.innerHTML=render(card); mount(card,H(),el);
    });
  }

  /* ── Registrazione ── */
  function duplicateCard(src, copy) {
    const data = localStorage.getItem(keyOf(src));
    if (data) localStorage.setItem(keyOf(copy), data);
  }

  var CARD = {
    id: 'camera-card', name: 'Telecamere', icon: '📷', version: '1.2',
    desc: 'HLS live (via WebSocket HA) → MJPEG → snapshot. Miniature con refresh, batteria, switch senza re-render.',
    colSpan: 2, rowSpan: 5,
    render: render, mount: mount, update: update, configure: openCfg, duplicate: duplicateCard,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
})();
