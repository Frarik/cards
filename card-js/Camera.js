/* frarik-version: 1.7 */
(function () {
  'use strict';

  /* ── Helpers ── */
  function H() {
    try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch(e) {}
    return null;
  }
  function keyOf(c)  { return 'frarik_cam_' + (c.id || 'x'); }
  function load(c)   { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch(e) { return {}; } }
  function save(c,o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch(e) {} }
  function eh(s)     { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ── URL ── */
  function camThumbUrl(entityId, h, ts) {
    if (!entityId || !h) return '';
    var st = h.states[entityId]; if (!st) return '';
    var ep = (st.attributes || {}).entity_picture; if (!ep) return '';
    var base = /^https?:/i.test(ep) ? ep : (typeof h.hassUrl === 'function' ? h.hassUrl(ep) : ep);
    var clean = base.replace(/[?&]_=\d+/g, '');
    return clean + (clean.includes('?') ? '&' : '?') + '_=' + (ts || Date.now());
  }

  function camMjpegUrl(entityId, h) {
    if (!entityId || !h) return '';
    var st = h.states[entityId]; if (!st) return '';
    var ep = (st.attributes || {}).entity_picture; if (!ep) return '';
    if (!ep.includes('/api/camera_proxy/')) return '';
    var s = ep.replace('/api/camera_proxy/', '/api/camera_proxy_stream/');
    return /^https?:/i.test(s) ? s : (typeof h.hassUrl === 'function' ? h.hassUrl(s) : s);
  }

  /* ── Stato modulo ── */
  var _selectedCam   = {};
  var _thumbTimers   = {};
  var _snapTimers    = {};   /* card.id → fallback snapshot timer */
  var _peerConns     = {};   /* card.id → RTCPeerConnection */
  var _streamSlot    = {};   /* card.id → contatore generazione (invalida async vecchie) */
  var _lastKeys      = {};

  function _sel(card, cams) {
    var i = _selectedCam[card.id] || 0;
    return cams.length ? Math.min(Math.max(0, i), cams.length - 1) : 0;
  }

  /* ── Batteria ── */
  function battPct(batEntity, h) {
    if (!batEntity || !h) return null;
    var s = h.states[batEntity];
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

  /* ── Pulizia ── */
  function _stopSnap(card) {
    if (_snapTimers[card.id]) { clearInterval(_snapTimers[card.id]); delete _snapTimers[card.id]; }
  }
  function _closePc(card) {
    if (_peerConns[card.id]) { try { _peerConns[card.id].close(); } catch(e) {} delete _peerConns[card.id]; }
  }
  function _cancelAll(card) {
    _stopSnap(card);
    _closePc(card);
    /* incrementa il contatore di generazione → invalida tutte le callback async pendenti */
    _streamSlot[card.id] = (_streamSlot[card.id] || 0) + 1;
  }

  /* Controlla se questa generazione è ancora valida */
  function _valid(card, el, si, gen) {
    if (!el.isConnected) return false;
    if (_streamSlot[card.id] !== gen) return false;
    var cams = load(card).cameras || [];
    return _sel(card, cams) === si;
  }

  /* ── WebRTC via camera/webrtc/offer ─────────────────────────────────────────
     • ontrack va settato PRIMA di createOffer per evitare race conditions
     • timeout 5s (non 10s) per non bloccare il fallback MJPEG
     • go2rtc usa ICE completo nell'SDP: nessun trickle ICE necessario         */
  function _startWebRTC(cam, h, card, el, si, wrap, gen, onFirst) {
    if (!window.RTCPeerConnection) return;
    if (!h || !h.connection || typeof h.connection.sendMessagePromise !== 'function') return;

    var pc;
    try { pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }); }
    catch(e) { return; }

    _closePc(card);
    _peerConns[card.id] = pc;

    /* video element creato subito (prima di createOffer) */
    var vid = document.createElement('video');
    vid.autoplay = true; vid.muted = true; vid.playsInline = true;
    vid.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';

    /* ontrack PRIMA di createOffer — evita race condition se go2rtc risponde velocissimo */
    pc.ontrack = function(event) {
      if (!_valid(card, el, si, gen) || _peerConns[card.id] !== pc) { try{pc.close();}catch(e){} return; }
      var stream = event.streams && event.streams[0];
      if (!stream) return;
      vid.srcObject = stream;
      onFirst(vid); /* callback: monta il video e segnala vittoria */
    };

    pc.onconnectionstatechange = function() {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        if (_peerConns[card.id] === pc) { try{pc.close();}catch(e){} delete _peerConns[card.id]; }
      }
    };

    /* timeout 5s: se entro 5s non arriva nessun track → chiudi */
    var rtcTimeout = setTimeout(function() {
      if (_peerConns[card.id] === pc) { try{pc.close();}catch(e){} delete _peerConns[card.id]; }
    }, 5000);

    try {
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });
    } catch(e) { clearTimeout(rtcTimeout); try{pc.close();}catch(e2){} delete _peerConns[card.id]; return; }

    pc.createOffer()
      .then(function(offer) { return pc.setLocalDescription(offer).then(function(){ return offer; }); })
      .then(function(offer) {
        /* race tra sendMessagePromise e un timeout di 5s */
        var wsPromise = h.connection.sendMessagePromise({
          type: 'camera/webrtc/offer',
          entity_id: cam.entity,
          offer: offer.sdp
        });
        var raceTimeout = new Promise(function(_, rej) { setTimeout(function(){ rej(new Error('timeout')); }, 5000); });
        return Promise.race([wsPromise, raceTimeout]);
      })
      .then(function(result) {
        clearTimeout(rtcTimeout);
        if (!result || !result.answer) { try{pc.close();}catch(e){} delete _peerConns[card.id]; return; }
        if (_peerConns[card.id] !== pc) return;
        return pc.setRemoteDescription({ type: 'answer', sdp: result.answer });
      })
      .catch(function() {
        clearTimeout(rtcTimeout);
        if (_peerConns[card.id] === pc) { try{pc.close();}catch(e){} delete _peerConns[card.id]; }
      });
  }

  /* ── MJPEG via <img> ── */
  function _startMjpeg(cam, h, card, el, si, gen, onWin) {
    var mjpeg = camMjpegUrl(cam.entity, h);
    if (!mjpeg) return;
    var img = document.createElement('img');
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
    img.onload = function() {
      img.onload = null; img.onerror = null;
      if (_streamSlot[card.id] === gen) onWin(img);
    };
    img.onerror = function() { img.onload = null; img.onerror = null; };
    img.src = mjpeg;
  }

  /* ── HLS via camera/stream ───────────────────────────────────────────────────
     Funziona anche per cam senza entity_picture (campanello live view).
     Safari: HLS nativo. Chrome: HLS.js da CDN (4s timeout).                  */
  function _startHLS(cam, h, card, el, si, gen, onWin) {
    if (!h || !h.connection || typeof h.connection.sendMessagePromise !== 'function') return;
    var wsP = h.connection.sendMessagePromise({ type: 'camera/stream', entity_id: cam.entity });
    var toP = new Promise(function(_, rej){ setTimeout(function(){ rej(); }, 5000); });
    Promise.race([wsP, toP])
      .then(function(r) {
        if (!r || !r.url || _streamSlot[card.id] !== gen) return;
        var hlsUrl = /^https?:/i.test(r.url) ? r.url : (typeof h.hassUrl === 'function' ? h.hassUrl(r.url) : r.url);
        var vid = document.createElement('video');
        vid.autoplay = true; vid.muted = true; vid.playsInline = true;
        vid.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
        if (vid.canPlayType('application/vnd.apple.mpegurl') !== '') {
          vid.src = hlsUrl;
          vid.addEventListener('loadeddata', function() { if (_streamSlot[card.id] === gen) onWin(vid); }, { once: true });
          return;
        }
        function setupHlsJs() {
          if (!window.Hls || !window.Hls.isSupported()) return;
          var hls = new window.Hls({ lowLatencyMode: true, maxBufferLength: 4, backBufferLength: 0 });
          hls.loadSource(hlsUrl); hls.attachMedia(vid);
          vid.addEventListener('loadeddata', function() {
            if (_streamSlot[card.id] !== gen) { hls.destroy(); return; }
            onWin(vid);
          }, { once: true });
          hls.on(window.Hls.Events.ERROR, function(_, d) { if (d.fatal) hls.destroy(); });
        }
        if (window.Hls) { setupHlsJs(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
        var cdnT = setTimeout(function() { try{document.head.removeChild(s);}catch(e){} }, 4000);
        s.onload = function() { clearTimeout(cdnT); if (_streamSlot[card.id] === gen) setupHlsJs(); };
        s.onerror = function() { clearTimeout(cdnT); };
        document.head.appendChild(s);
      })
      .catch(function() {});
  }

  /* ── Snapshot refresh ogni 2s — baseline immediato ──────────────────────────
     Crea l'img solo se ha url valido (niente rettangolo grigio Chrome per
     cam senza entity_picture). Fermato dal gen slot quando cam cambia.        */
  function _startSnap(cam, h, card, el, wrap, gen) {
    _stopSnap(card);
    var img = null;
    function refresh() {
      if (!el.isConnected || _streamSlot[card.id] !== gen) { _stopSnap(card); return; }
      var url = camThumbUrl(cam.entity, h);
      if (!url) return;
      if (!img) {
        img = document.createElement('img');
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
        wrap.innerHTML = ''; wrap.appendChild(img);
      }
      img.src = url;
    }
    refresh();
    _snapTimers[card.id] = setInterval(refresh, 2000);
  }

  /*
   * _showCamStream
   *  1. Snapshot refresh IMMEDIATO ogni 2s (baseline)
   *  2. HLS + WebRTC + MJPEG in parallelo — il primo che vince ferma il refresh
   */
  function _showCamStream(card, el, si) {
    var h = H(), c = load(card), cams = c.cameras || [];
    var cam = cams[si]; if (!cam || !el.isConnected) return;
    var wrap = el.querySelector('[data-cam-main-wrap]'); if (!wrap) return;

    _cancelAll(card);
    var gen = _streamSlot[card.id];

    wrap.innerHTML = '';

    /* 1. Snapshot refresh immediato */
    _startSnap(cam, h, card, el, wrap, gen);

    var won = false;
    function onWin(mediaEl) {
      if (won || _streamSlot[card.id] !== gen) return;
      won = true;
      _stopSnap(card);
      _closePc(card);
      wrap.innerHTML = '';
      wrap.appendChild(mediaEl);
      if (typeof mediaEl.play === 'function') mediaEl.play().catch(function(){});
    }

    /* 2. Tre tentativi in parallelo */
    _startHLS(cam, h, card, el, si, gen, onWin);
    _startWebRTC(cam, h, card, el, si, wrap, gen, onWin);
    _startMjpeg(cam, h, card, el, si, gen, onWin);
  }

  /* ── Cambio cam senza re-render ── */
  function _switchCam(card, el, newIdx) {
    var h = H(), c = load(card), cams = c.cameras || [];
    if (!cams.length || newIdx < 0 || newIdx >= cams.length) return;
    _selectedCam[card.id] = newIdx;
    var sel = cams[newIdx];

    _showCamStream(card, el, newIdx);

    var nameEl = el.querySelector('[data-cam-name-ov]');
    if (nameEl) nameEl.textContent = sel.name || sel.entity;

    var batEl = el.querySelector('[data-cam-bat-ov]');
    if (batEl) {
      var pct = battPct(sel.battery, h);
      if (pct !== null) { batEl.textContent='🔋 '+Math.round(pct)+'%'; batEl.style.color=battColor(pct); batEl.style.display=''; }
      else batEl.style.display = 'none';
    }

    el.querySelectorAll('[data-cam-idx]').forEach(function(thumb) {
      var i = parseInt(thumb.getAttribute('data-cam-idx'));
      var active = (i === newIdx);
      thumb.style.outline       = '2px solid '+(active ? '#818cf8' : 'transparent');
      thumb.style.outlineOffset = '1px';
      thumb.style.boxShadow     = active ? '0 0 10px rgba(129,140,248,.45)' : '0 2px 8px rgba(0,0,0,.55)';
    });
  }

  /* ── Overlay (batteria, unavailable) — non tocca lo stream ── */
  function _updateOverlays(card, el) {
    var h = H(), c = load(card), cams = c.cameras || [];
    var si = _sel(card, cams), sel = cams[si]; if (!sel) return;
    var batEl = el.querySelector('[data-cam-bat-ov]');
    if (batEl) {
      var pct = battPct(sel.battery, h);
      if (pct !== null) { batEl.textContent='🔋 '+Math.round(pct)+'%'; batEl.style.color=battColor(pct); batEl.style.display=''; }
      else batEl.style.display = 'none';
    }
    var unavEl = el.querySelector('[data-cam-unavail]');
    if (unavEl) unavEl.style.display = (h&&h.states[sel.entity]&&h.states[sel.entity].state==='unavailable') ? 'flex' : 'none';
    cams.forEach(function(cam, i) {
      var b = el.querySelector('[data-cam-bat-thumb="'+i+'"]');
      if (b) b.innerHTML = battHtml(battPct(cam.battery, h), cam.battery);
    });
  }

  function _stateKey(card, h) {
    try {
      var c = load(card), cams = c.cameras || [];
      return cams.map(function(cam) {
        var cs = h && h.states[cam.entity];
        var bs = cam.battery && h && h.states[cam.battery];
        return (cs ? cs.state : '?') + ':' + (bs ? Math.round(parseFloat(bs.state)||0) : '-');
      }).join(',');
    } catch(e) { return ''; }
  }

  /* ── Refresh miniature ── */
  function _refreshThumbs(card, el) {
    var h = H(), c = load(card), cams = c.cameras || [];
    if (!cams.length || !el.isConnected) return;
    var ts = Date.now();
    el.querySelectorAll('[data-cam-thumb]').forEach(function(img) {
      var cam = cams[parseInt(img.getAttribute('data-cam-thumb'))]; if (!cam) return;
      var url = camThumbUrl(cam.entity, h, ts);
      if (url) img.src = url;
    });
  }

  /* ── RENDER ── */
  function render(card) {
    var h = H(), c = load(card), cams = c.cameras || [];
    var rid = 'cam' + (card.id || Math.random().toString(36).slice(2,8));

    if (!cams.length) {
      return '<div id="'+rid+'" style="display:flex;flex-direction:column;align-items:center;justify-content:center;'
        +'height:100%;gap:12px;padding:20px;text-align:center;color:rgba(255,255,255,.3)">'
        +'<div style="font-size:40px;opacity:.35">📷</div>'
        +'<div style="font-size:13px;font-weight:700">Nessuna telecamera</div>'
        +'<div style="font-size:11px;line-height:1.6;opacity:.7">Attiva modifica → ✏️ per aggiungere le telecamere</div>'
        +'</div>';
    }

    var si = _sel(card, cams), sel = cams[si], ts = Date.now();
    var initThumb = camThumbUrl(sel.entity, h, ts);
    var mainState = h && h.states[sel.entity];
    var isUnavail = mainState && mainState.state === 'unavailable';
    var pctMain   = battPct(sel.battery, h);

    var mainView =
      '<div style="position:relative;flex:1;min-height:0;border-radius:12px;overflow:hidden;background:#050810">'
        +'<div data-cam-main-wrap style="width:100%;height:100%;background:#050810">'
          /* mount() sovrascrive subito con _showCamStream — questo è solo il flash iniziale */
          +(initThumb
            ? '<img src="'+eh(initThumb)+'" style="width:100%;height:100%;object-fit:cover;display:block" />'
            : '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:rgba(255,255,255,.15)">'
              +'<div style="font-size:36px">📷</div>'
              +'<div style="font-size:10px;font-weight:700;letter-spacing:.05em">CONNESSIONE STREAM...</div>'
              +'</div>'
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
      var multiRow = cams.length > 4;
      thumbsHtml = '<div style="display:flex;gap:5px;flex-shrink:0;'+(multiRow?'overflow-x:auto;padding-bottom:2px':'')+'">'
        +cams.map(function(cam, i) {
          var active  = (i === si);
          var tUrl    = camThumbUrl(cam.entity, h, ts);
          var pct     = battPct(cam.battery, h);
          var camSt   = h && h.states[cam.entity];
          var unavail = camSt && camSt.state === 'unavailable';
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

  /* ── MOUNT ── */
  function mount(card, hass, el) {
    el.removeEventListener('click', el._camHandler);
    el._camHandler = function(ev) {
      var t = ev.target.closest('[data-action="selcam"]'); if (!t) return;
      _switchCam(card, el, parseInt(t.getAttribute('data-val')));
    };
    el.addEventListener('click', el._camHandler);

    var c = load(card), cams = c.cameras || [];
    _showCamStream(card, el, _sel(card, cams));

    if (_thumbTimers[card.id]) clearInterval(_thumbTimers[card.id]);
    _thumbTimers[card.id] = setInterval(function() {
      if (!el.isConnected) { clearInterval(_thumbTimers[card.id]); delete _thumbTimers[card.id]; return; }
      _refreshThumbs(card, el);
    }, 10000);
  }

  /* ── UPDATE ── */
  function update(card, hass, el) {
    try {
      var key = _stateKey(card, hass);
      if (_lastKeys[card.id] === key) return;
      _lastKeys[card.id] = key;
      _updateOverlays(card, el);
    } catch(e) {}
  }

  /* ── CONFIGURE ── */
  function openCfg(card, el) {
    var h = H(), c = load(card);
    var states  = (h && h.states) || {};
    var allIds  = Object.keys(states).sort();
    var camIds  = allIds.filter(function(id) { return id.startsWith('camera.'); });
    var sensIds = allIds.filter(function(id) { return id.startsWith('sensor.'); });
    var cams = JSON.parse(JSON.stringify(c.cameras || []));

    var stInp = 'width:100%;padding:8px 10px;border-radius:8px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:11px;font-family:monospace;box-sizing:border-box;outline:none';
    var stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:20;max-height:130px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 8px 8px;display:none';
    var stLbl  = 'font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:2px;display:block';

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

    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';

    function buildDialog() {
      return '<style>@keyframes camSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}</style><div style="width:100%;max-height:92vh;overflow-y:auto;background:#0a0816;border:1px solid rgba(139,92,246,.32);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);padding:20px;color:#fff;animation:camSlideUp .22s cubic-bezier(.32,1.12,.56,1);scrollbar-width:none">'
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
    var close = function() { try { document.body.removeChild(ov); } catch(e) {} };
    ov.addEventListener('click', function(e){ if (e.target===ov) close(); });
    ov.querySelector('#cam-cfg-cancel').addEventListener('click', close);

    function makeCombo(inpSel, dropSel, defaults) {
      var inp = ov.querySelector(inpSel), drop = ov.querySelector(dropSel);
      if (!inp || !drop) return;
      function show() {
        var q = inp.value.toLowerCase().trim();
        var hits = (q ? allIds.filter(function(id){return id.toLowerCase().includes(q);}) : defaults).slice(0,60);
        if (!hits.length) { drop.style.display='none'; return; }
        drop.style.display='block';
        drop.innerHTML=hits.map(function(id){var fn=((states[id]||{}).attributes||{}).friendly_name||'';
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
        var n=ov.querySelector('[data-cam-name="'+i+'"]');
        var e=ov.querySelector('[data-cam-ent="'+i+'"]');
        var b=ov.querySelector('[data-cam-bat="'+i+'"]');
        if(n) cam.name=n.value.trim(); if(e) cam.entity=e.value.trim(); if(b) cam.battery=b.value.trim();
      });
    }
    function rebuildList() {
      var list=ov.querySelector('#cam-cfg-list');
      list.innerHTML=cams.length?cams.map(buildRow).join(''):'<div style="font-size:12px;color:rgba(255,255,255,.3);text-align:center;padding:16px">Nessuna telecamera — clicca "Aggiungi" per iniziare</div>';
      bindAllCombos();
    }
    bindAllCombos();
    ov.addEventListener('click',function(e){
      var b=e.target.closest('[data-action="delcam"]'); if(!b) return;
      readValues(); cams.splice(parseInt(b.getAttribute('data-idx')),1); rebuildList();
    });
    ov.querySelector('#cam-cfg-add').addEventListener('click',function(){
      readValues(); cams.push({entity:'',name:'',battery:''}); rebuildList();
      var inner=ov.querySelector('div'); if(inner) inner.scrollTop=99999;
    });
    ov.querySelector('#cam-cfg-save').addEventListener('click',function(){
      readValues();
      var validCams=cams.filter(function(cam){return cam.entity.trim();});
      save(card,Object.assign({},c,{cameras:validCams}));
      close(); _lastKeys[card.id]=null;
      el.innerHTML=render(card); mount(card,H(),el);
    });
  }

  function duplicateCard(src, copy) {
    var data = localStorage.getItem(keyOf(src));
    if (data) localStorage.setItem(keyOf(copy), data);
  }

  var CARD = {
    id: 'camera-card', name: 'Telecamere', icon: '📷', version: '1.6',
    desc: 'WebRTC (go2rtc) + MJPEG in parallelo. Click istantaneo, fallback snapshot 2s.',
    colSpan: 2, rowSpan: 5,
    render: render, mount: mount, update: update, configure: openCfg, duplicate: duplicateCard,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
})();
