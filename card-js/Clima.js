/* frarik-version: 2.9 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_clima_' + (c.id || 'x'); }
  function load(c)  { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o){ try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }

  function clState(h, id) {
    if (!id || !h || !h.states || !h.states[id]) return null;
    const s = h.states[id], a = s.attributes || {};
    return {
      mode: s.state, action: a.hvac_action || 'idle',
      target: a.temperature, current: a.current_temperature,
      fan: a.fan_mode || 'auto', swing: a.swing_mode || 'off',
      min: a.min_temp || 16, max: a.max_temp || 30, step: a.target_temp_step || 1,
      hvacModes:  a.hvac_modes   || ['off','cool','heat'],
      fanModes:   a.fan_modes    || ['auto','low','medium','high'],
      swingModes: a.swing_modes  || ['off','on'],
      friendlyName: a.friendly_name || id,
    };
  }

  function callSvc(domain, service, data) {
    try { const h = H(); if (h && h.callService) h.callService(domain, service, data); } catch (e) {}
  }

  const HVAC_LBL = { cool:'Raffrescamento', heat:'Riscaldamento', fan_only:'Solo Ventola', dry:'Deumidificazione', auto:'Automatico', heat_cool:'Caldo/Freddo', off:'Spento' };
  const HVAC_ICO = { cool:'❄', heat:'🔥', fan_only:'💨', dry:'💧', auto:'⟳', heat_cool:'♨', off:'⏻' };
  const HVAC_COL = { cool:'#38bdf8', heat:'#f87171', fan_only:'#94a3b8', dry:'#34d399', auto:'#a78bfa', heat_cool:'#fb923c', off:'#475569' };
  const FAN_LBL  = { auto:'Auto', low:'Bassa', medium:'Media', high:'Alta', turbo:'Turbo', quiet:'Silenziosa', 'off':'Ferma', 'on':'Attiva' };
  const SWING_LBL= { 'off':'Off', 'on':'On', both:'Tutto', vertical:'Verticale', horizontal:'Orizzontale' };
  const BRANDS   = ['Daikin','Samsung','LG','Mitsubishi Electric','Panasonic','Fujitsu','Toshiba','Hitachi','Midea','Haier','Gree','Bosch','Carrier','York'];

  /* ── SVG loghi fedeli all'originale, sfondo scuro ── */
  const BRAND_SVG = {

    /* Daikin: chevron doppio piano navy/azzurro + DAIKIN ciano */
    'Daikin': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 18" height="15" style="display:block;margin:auto">'
      +'<polygon points="0,9 9,1 9,17" fill="#0077CC"/>'
      +'<polygon points="9,2.5 14,1 14,17 9,15.5" fill="#1a83e0"/>'
      +'<text x="18" y="14" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" fill="#00ADEF" letter-spacing="1.4">DAIKIN</text>'
      +'</svg>'
    ),

    /* Samsung: ovale #1428A0 + SAMSUNG bianco centrato */
    'Samsung': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 24" height="20" style="display:block;margin:auto">'
      +'<ellipse cx="70" cy="12" rx="69" ry="11" fill="#1428A0"/>'
      +'<text x="70" y="16.8" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="700" fill="white" text-anchor="middle" letter-spacing="0.8">SAMSUNG</text>'
      +'</svg>'
    ),

    /* LG: cerchio rosso con L (2 rect) + G (arco 300° ccw + naso) + "LG" grigio */
    'LG': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 82 22" height="20" style="display:block;margin:auto">'
      +'<circle cx="11" cy="11" r="10.5" fill="#A50034"/>'
      // L — barra verticale sinistra
      +'<rect x="3.5" y="4.5" width="2.5" height="10.5" fill="white"/>'
      // L — barra orizzontale in basso
      +'<rect x="3.5" y="13.5" width="7" height="2.5" fill="white"/>'
      // G — arco ~300° counterclockwise + naso orizzontale
      // Centro (10,11) r≈7: punto top-gap (13.5,5), punto right (17,11)
      +'<path d="M13.5,5 A7,7 0 1,0 17,11 L12,11 L12,9" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
      // testo LG grigio a destra
      +'<text x="29" y="17" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="700" fill="#b5b5c5">LG</text>'
      +'</svg>'
    ),

    /* Fujitsu: doppio anello (∞) sopra la J + FUJITSU rosso bold */
    'Fujitsu': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 28" height="24" style="display:block;margin:auto">'
      // due ellissi incatenate centrate sopra la "J" di FUJITSU
      +'<ellipse cx="50" cy="6" rx="6" ry="4.5" fill="none" stroke="#E60012" stroke-width="2"/>'
      +'<ellipse cx="60" cy="6" rx="6" ry="4.5" fill="none" stroke="#E60012" stroke-width="2"/>'
      +'<text x="65" y="25" font-family="Arial Black,Arial,sans-serif" font-size="17" font-weight="900" fill="#E60012" text-anchor="middle" letter-spacing="0.3">FUJITSU</text>'
      +'</svg>'
    ),

    /* Mitsubishi Electric: tre rombi rossi + testo */
    'Mitsubishi Electric': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 22" height="17" style="display:block;margin:auto">'
      +'<polygon points="8,11 12,5 16,11 12,17" fill="#E60012"/>'
      +'<polygon points="16,11 20,5 24,11 20,17" fill="#E60012"/>'
      +'<polygon points="24,11 28,5 32,11 28,17" fill="#E60012"/>'
      +'<text x="90" y="15" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="700" fill="#E60012" text-anchor="middle" letter-spacing="0.5">MITSUBISHI ELECTRIC</text>'
      +'</svg>'
    ),

    'Panasonic': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 20" height="16" style="display:block;margin:auto">'
      +'<text x="65" y="15" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" fill="#0039A6" text-anchor="middle" letter-spacing="0.5">Panasonic</text>'
      +'</svg>'
    ),
    'Toshiba': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 20" height="16" style="display:block;margin:auto">'
      +'<text x="55" y="14" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700" fill="#E60012" text-anchor="middle" letter-spacing="0.5">TOSHIBA</text>'
      +'</svg>'
    ),
    'Hitachi': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20" height="16" style="display:block;margin:auto">'
      +'<text x="50" y="14" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700" fill="#E60012" text-anchor="middle" letter-spacing="0.6">HITACHI</text>'
      +'</svg>'
    ),
    'Midea': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20" height="16" style="display:block;margin:auto">'
      +'<text x="45" y="14" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700" fill="#00529B" text-anchor="middle" letter-spacing="1">MIDEA</text>'
      +'</svg>'
    ),
    'Haier': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20" height="16" style="display:block;margin:auto">'
      +'<text x="45" y="14" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700" fill="#0066CC" text-anchor="middle" letter-spacing="1">haier</text>'
      +'</svg>'
    ),
    'Gree': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 20" height="16" style="display:block;margin:auto">'
      +'<text x="40" y="14" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700" fill="#00A652" text-anchor="middle" letter-spacing="1">GREE</text>'
      +'</svg>'
    ),
    'Bosch': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 20" height="16" style="display:block;margin:auto">'
      +'<text x="45" y="14" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700" fill="#EC0016" text-anchor="middle" letter-spacing="0.5">BOSCH</text>'
      +'</svg>'
    ),
    'Carrier': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20" height="16" style="display:block;margin:auto">'
      +'<text x="50" y="14" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" fill="#003087" text-anchor="middle" letter-spacing="0.8">CARRIER</text>'
      +'</svg>'
    ),
    'York': (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 20" height="16" style="display:block;margin:auto">'
      +'<text x="40" y="14" font-family="Arial Black,Arial,sans-serif" font-size="14" font-weight="900" fill="#003087" text-anchor="middle" letter-spacing="1.2">YORK</text>'
      +'</svg>'
    ),
  };

  function mColor(m) { return HVAC_COL[m] || '#475569'; }
  function mLabel(m) { return HVAC_LBL[m] || m; }
  function mIcon(m)  { return HVAC_ICO[m] || '⏻'; }
  function fLabel(m) { return FAN_LBL[m]  || m; }
  function sLabel(m) { return SWING_LBL[m]|| m; }

  var _openSecs        = {};
  var _lastKeys        = {};
  var _optimisticTemps = {};
  var _optimisticState = {};

  /* ── Animazione aletta via requestAnimationFrame (100% JS, nessuna CSS animation) ── */
  var _flapRafs = {}; // rid → { id: rafId, t0: startTime }

  function _flapStart(flapEl, rid) {
    _flapStop(rid);
    var period = 12000, maxAngle = 52;
    var state = { id: null, t0: Date.now() };
    _flapRafs[rid] = state;
    function loop() {
      if (!flapEl.isConnected) { _flapStop(rid); return; }
      var phase = ((Date.now() - state.t0) % period) / period;
      var angle = phase < 0.5 ? phase * 2 * maxAngle : (1 - phase) * 2 * maxAngle;
      flapEl.style.transform = 'rotateX(' + angle.toFixed(1) + 'deg)';
      state.id = requestAnimationFrame(loop);
    }
    state.id = requestAnimationFrame(loop);
  }

  function _flapStop(rid) {
    var s = _flapRafs[rid];
    if (s && s.id != null) cancelAnimationFrame(s.id);
    delete _flapRafs[rid];
  }

  // "stopped", "off", "none", "fixed" → swing fermo; tutto il resto → oscillazione attiva
  function _swingIsActive(swingMode) {
    if (!swingMode) return false;
    var s = String(swingMode).toLowerCase();
    return s !== 'off' && s !== 'stopped' && s !== 'none' && s !== 'fixed';
  }

  function _flapSet(flapEl, rid, isOn, swingOn) {
    _flapStop(rid);
    if (isOn && swingOn) {
      _flapStart(flapEl, rid);
    } else {
      flapEl.style.transform = isOn ? 'rotateX(40deg)' : 'rotateX(0deg)';
    }
  }

  function _stateKey(card, hass) {
    try {
      const c = load(card), h = (hass && hass.states) || {};
      function cv(id) {
        const s = h[id]; if (!s) return '';
        const a = s.attributes || {};
        return [s.state, a.temperature, a.current_temperature, a.fan_mode, a.swing_mode, a.hvac_action].join(':');
      }
      function sv(id) { const s = h[id]; return s ? s.state : ''; }
      return cv(c.entity) + '|' + sv(c.tempEntity) + '|' + sv(c.humEntity) + '|' + sv(c.swingSensor);
    } catch(e) { return String(Date.now()); }
  }

  function airStreams(rid, col, show) {
    if (!show) return '';
    var p = [
      [2,  95,18,10, 7.2,0.0], [16,62,14, 7, 8.8,1.4],
      [32,105,20,13, 6.6,0.6], [6,  46,15, 6, 8.0,2.6],
      [46, 85,18,10, 8.2,1.0], [22,56,12, 7, 7.4,3.6],
      [56, 98,20,12, 6.9,1.9], [10,74,16, 9, 7.6,0.3],
      [41, 48,13, 6, 8.5,3.0], [66,80,18,10, 7.1,1.6],
      [26, 90,19,12, 9.0,4.3], [74,40,12, 5, 6.6,2.4],
      [50, 70,16, 9, 7.5,0.9], [18,50,13, 7, 8.1,2.1],
      [60, 58,14, 8, 7.9,5.1], [38,88,19,11, 8.6,0.5],
    ];
    return p.map(function(s) {
      var l=s[0],w=s[1],h=s[2],blur=s[3],dur=s[4],delay=s[5];
      return '<div style="position:absolute;left:'+l+'%;top:-'+(h+4)+'px;width:'+w+'px;height:'+h+'px;'
        +'border-radius:50%;'
        +'background:radial-gradient(ellipse at 50% 38%,'+col+'ee 0%,'+col+'99 45%,'+col+'33 72%,transparent 100%);'
        +'filter:blur('+blur+'px);opacity:0;'
        +'animation:'+rid+'mist '+dur+'s ease-in-out '+delay+'s infinite;'
        +'pointer-events:none"></div>';
    }).join('');
  }

  function _rerenderCard(card, el) {
    var oldFlap = el.querySelector('[data-clm-flap]');
    if (oldFlap) _flapStop(oldFlap.getAttribute('data-rid'));
    el.innerHTML = render(card);
    mount(card, H(), el);
    _lastKeys[card.id] = _stateKey(card, H());
    var os = _openSecs[card.id];
    if (os) {
      var se = el.querySelector('[data-secpanel="'+os+'"]');
      var tb = el.querySelector('[data-action="toggle"][data-sec="'+os+'"]');
      if (se) se.style.display = 'flex';
      if (tb) { tb.style.background='rgba(255,255,255,.16)'; tb.style.color='#e2e8f0'; tb.style.borderColor='rgba(255,255,255,.22)'; }
    }
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = load(card);
    const rid = 'clm' + (card.id || Math.random().toString(36).slice(2,8));
    const entityId = c.entity || '';
    const st = clState(h, entityId);

    const optS = _optimisticState[card.id];
    const useOptS = optS && Date.now() < optS.expires;
    if (useOptS && st) {
      const confirmed =
        (optS.mode  === undefined || optS.mode  === st.mode)  &&
        (optS.fan   === undefined || optS.fan   === st.fan)   &&
        (optS.swing === undefined || optS.swing === st.swing);
      if (confirmed) delete _optimisticState[card.id];
    }
    const useOpt = useOptS && !!_optimisticState[card.id];

    const mode     = useOpt && optS.mode  !== undefined ? optS.mode  : (st ? st.mode  : 'off');
    const fanMode  = useOpt && optS.fan   !== undefined ? optS.fan   : (st ? st.fan   : 'auto');
    const swingMode= useOpt && optS.swing !== undefined ? optS.swing : (st ? st.swing : 'off');
    const isOn     = mode !== 'off';
    const swingOn  = _swingIsActive(swingMode);
    const mCol     = mColor(mode);

    const optT = _optimisticTemps[card.id];
    const useOptT = optT && Date.now() < optT.expires;
    if (useOptT && st && st.target != null && Math.abs(optT.temp - parseFloat(st.target)) < 0.001) delete _optimisticTemps[card.id];
    const targetTemp = (useOptT && _optimisticTemps[card.id]) ? optT.temp.toFixed(1)
      : (st && st.target != null ? parseFloat(st.target).toFixed(1) : '--.-');

    const nm = c.name || (st ? st.friendlyName : 'Climatizzatore');
    const hvacModes  = st ? st.hvacModes  : ['off','cool','heat'];
    const fanModes   = st ? st.fanModes   : ['auto','low','medium','high'];
    const swingModes = st ? st.swingModes : ['off','on'];

    const tempEnt = c.tempEntity && h && h.states && h.states[c.tempEntity] ? h.states[c.tempEntity] : null;
    const humEnt  = c.humEntity  && h && h.states && h.states[c.humEntity]  ? h.states[c.humEntity]  : null;
    const sensorT = tempEnt ? parseFloat(tempEnt.state).toFixed(1) : null;
    const sensorH = humEnt  ? parseFloat(humEnt.state).toFixed(0)  : null;

    const swSEnt  = c.useSwingSensor && c.swingSensor && h && h.states && h.states[c.swingSensor] ? h.states[c.swingSensor] : null;
    const flapPhys= swSEnt ? swSEnt.state === 'on' : null;
    const syncCol = flapPhys !== null ? ((isOn === flapPhys) ? '#22c55e' : '#ef4444') : null;

    const brand    = c.showBrand && c.brand ? c.brand : null;
    const brandSvg = brand ? (BRAND_SVG[brand] || null) : null;

    /* Aletta: transform iniziale nel DOM; l'animazione è gestita da RAF in mount() */
    const flapInitTransform = !isOn ? 'rotateX(0deg)' : 'rotateX(40deg)';

    /* CSS (nessun @keyframes per l'aletta — RAF la anima) */
    const css = '<style id="'+rid+'-css">'
      +'@keyframes '+rid+'mist{0%{opacity:0;transform:translateY(-8px) scaleX(1)}15%{opacity:.82}76%{opacity:.26}100%{opacity:0;transform:translateY(96px) scaleX(1.22)}}'
      +'@keyframes '+rid+'led{0%,100%{opacity:1}46%{opacity:.72}}'
      +'@keyframes '+rid+'ind{0%,100%{box-shadow:0 0 6px '+mCol+'77}50%{box-shadow:0 0 16px '+mCol+',0 0 32px '+mCol+'66}}'
      +'@keyframes '+rid+'glow{0%,100%{opacity:.5}50%{opacity:1}}'
      +'#'+rid+' .cb{padding:5px 10px;border-radius:8px;border:none;cursor:pointer;font-size:11px;font-weight:700;transition:all .18s;}'
      +'#'+rid+' .cb:hover{filter:brightness(1.3);}'
      +'#'+rid+' .tog{flex:1;padding:8px 4px;border-radius:12px;border:1px solid rgba(255,255,255,.1);cursor:pointer;font-size:10px;'
        +'font-weight:700;display:flex;flex-direction:column;align-items:center;gap:3px;'
        +'background:rgba(255,255,255,.07);color:#94a3b8;transition:all .2s;}'
      +'#'+rid+' .tog:hover{background:rgba(255,255,255,.13);color:#e2e8f0;}'
      +'</style>';

    const indRight = '<div style="display:flex;gap:5px;align-items:center">'
      +(syncCol ? '<div title="Sync aletta" style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:'+syncCol+';box-shadow:0 0 6px '+syncCol+'cc"></div>' : '')
      +(sensorT ? '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.65);background:rgba(255,255,255,.09);padding:2px 7px;border-radius:99px">🌡 '+sensorT+'°</div>' : '')
      +(sensorH ? '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.65);background:rgba(255,255,255,.09);padding:2px 7px;border-radius:99px">💧 '+sensorH+'%</div>' : '')
      +'</div>';

    /* Corpo AC antracite */
    const acBody = '<div style="position:relative">'
      +'<div style="border-radius:15px;overflow:hidden;'
        +'background:linear-gradient(160deg,#1e2b3e 0%,#141c2c 55%,#192334 100%);'
        +'border:1px solid '+(isOn ? mCol+'55' : 'rgba(255,255,255,.09)')+';'
        +'box-shadow:0 8px 34px rgba(0,0,0,.65),'+(isOn ? '0 0 24px '+mCol+'1e,' : '')+'inset 0 1px 0 rgba(255,255,255,.06);">'

        +'<div style="display:flex;align-items:center;gap:8px;padding:5px 10px 5px 13px;'
          +'background:rgba(0,0,0,.35);border-bottom:1px solid rgba(255,255,255,.05);'
          +'border-left:3px solid '+(isOn ? mCol : 'rgba(255,255,255,.14)')+'">'
          +'<div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;'
            +'background:'+(isOn?mCol:'rgba(255,255,255,.2)')+';'
            +(isOn?'animation:'+rid+'ind 2.2s ease-in-out infinite;':'')+'"></div>'
          +'<div style="flex:1;font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;'
            +'color:'+(isOn?mCol:'rgba(255,255,255,.3)')+'">'+(isOn?mLabel(mode):'SPENTO')+'</div>'
          +indRight
        +'</div>'

        +'<div style="display:flex;height:78px">'
          +'<div style="flex:1;position:relative;overflow:hidden;'
            +'background:linear-gradient(135deg,rgba(255,255,255,.05) 0%,rgba(255,255,255,.02) 100%);">'
            +(isOn
              ? '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 20% 55%,'+mCol+'25 0%,transparent 68%);pointer-events:none;animation:'+rid+'glow 3s ease-in-out infinite"></div>'
              : '')
            +'<div style="position:absolute;top:0;right:0;bottom:0;width:20px;'
              +'background:linear-gradient(90deg,transparent,rgba(0,0,0,.25));pointer-events:none"></div>'
            +(brandSvg
              ? '<div style="position:absolute;bottom:6px;left:0;right:0;text-align:center;line-height:0">'+brandSvg+'</div>'
              : '')
          +'</div>'

          +'<div style="width:1px;background:rgba(255,255,255,.07);flex-shrink:0"></div>'

          +'<div style="width:85px;flex-shrink:0;background:rgba(0,0,0,.25);'
            +'display:flex;align-items:center;justify-content:center;padding:0 7px">'
            +'<div style="background:#040c09;border-radius:8px;padding:6px 8px;width:100%;box-sizing:border-box;'
              +'border:1px solid rgba(0,0,0,.7);box-shadow:inset 0 3px 12px rgba(0,0,0,.75),inset 0 0 22px rgba(0,0,0,.4)">'
              +'<div data-clm-led style="font-family:\'Courier New\',Courier,monospace;font-size:23px;'
                +'font-weight:700;letter-spacing:2px;line-height:1;text-align:center;'
                +'color:'+(isOn?mCol:'#0d1a12')+';'
                +'text-shadow:'+(isOn?'0 0 14px '+mCol+',0 0 30px '+mCol+'55':'none')+';'
                +(isOn?'animation:'+rid+'led 3s ease-in-out infinite;':'')
              +'">'+targetTemp+'</div>'
            +'</div>'
          +'</div>'
        +'</div>'

        +'<div style="height:12px;background:linear-gradient(180deg,rgba(0,0,0,.3),rgba(0,0,0,.45));'
          +'border-top:1px solid rgba(255,255,255,.04)"></div>'
      +'</div>'

      // Aletta: transform iniziale statico; RAF in mount() gestisce l'oscillazione
      +'<div style="position:absolute;bottom:-7px;left:13px;right:13px;height:15px;'
        +'perspective:220px;perspective-origin:50% 0%;z-index:2">'
        +'<div data-clm-flap data-rid="'+rid+'" style="width:100%;height:100%;'
          +'background:linear-gradient(180deg,#2d3e58 0%,#22304a 40%,#1b2640 100%);'
          +'border-radius:2px 2px 6px 6px;'
          +'box-shadow:0 5px 16px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.1);'
          +'transform-origin:50% 0%;transform:'+flapInitTransform
        +'"></div>'
      +'</div>'
    +'</div>';

    const airSection = '<div style="position:relative;height:'+(isOn?'86px':'10px')+';overflow:hidden;'
      +'transition:height .7s ease;margin-top:6px;pointer-events:none">'
      +airStreams(rid, mCol, isOn)
    +'</div>';

    const tempRow = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;'
      +'background:rgba(255,255,255,.06);border-radius:13px;padding:7px 14px;border:1px solid rgba(255,255,255,.1)">'
      +'<button class="cb" data-cid="'+entityId+'" data-action="temp-down" '
        +'style="width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.1);color:#e2e8f0;'
        +'font-size:20px;font-weight:700;padding:0;display:flex;align-items:center;justify-content:center">−</button>'
      +'<div data-clm-temp style="font-size:26px;font-weight:800;min-width:80px;text-align:center;'
        +'color:'+(isOn?mCol:'#334155')+';text-shadow:'+(isOn?'0 0 10px '+mCol:'none')+';">'
        +(isOn?targetTemp+'°':'—')
      +'</div>'
      +'<button class="cb" data-cid="'+entityId+'" data-action="temp-up" '
        +'style="width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.1);color:#e2e8f0;'
        +'font-size:20px;font-weight:700;padding:0;display:flex;align-items:center;justify-content:center">+</button>'
    +'</div>';

    const togRow = '<div style="display:flex;gap:7px">'
      +'<button class="tog" data-action="toggle" data-sec="mode"><span style="font-size:17px">'+mIcon(mode)+'</span><span>Modalità</span></button>'
      +'<button class="tog" data-action="toggle" data-sec="fan"><span style="font-size:17px">💨</span><span>Ventola</span></button>'
      +(swingModes.length>1?'<button class="tog" data-action="toggle" data-sec="swing"><span style="font-size:17px">↕</span><span>Alette</span></button>':'')
    +'</div>';

    function selBtn(eId, action, val, label, active, col2) {
      const bs = active
        ? 'background:'+col2+'33;color:'+col2+';border:1px solid '+col2+'55;box-shadow:0 0 9px '+col2+'44;'
        : 'background:rgba(255,255,255,.07);color:#64748b;border:1px solid rgba(255,255,255,.1);';
      return '<button class="cb" data-cid="'+eId+'" data-action="'+action+'" data-val="'+val+'" style="'+bs+'">'+label+'</button>';
    }
    const pw = 'display:none;flex-direction:column;gap:6px;background:rgba(255,255,255,.04);border-radius:13px;padding:10px;border:1px solid rgba(255,255,255,.08);';

    const modePanel = '<div data-secpanel="mode" style="'+pw+'">'
      +'<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Modalità</div>'
      +'<div style="display:flex;gap:5px;flex-wrap:wrap">'
      +hvacModes.map(function(m){ return selBtn(entityId,'mode',m,mIcon(m)+' '+mLabel(m),mode===m,mColor(m)); }).join('')
      +'</div></div>';

    const fanPanel = fanModes.length>1
      ? '<div data-secpanel="fan" style="'+pw+'">'
          +'<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Ventola</div>'
          +'<div style="display:flex;gap:5px;flex-wrap:wrap">'
          +fanModes.map(function(m){ return selBtn(entityId,'fan',m,fLabel(m),fanMode===m,'#38bdf8'); }).join('')
          +'</div></div>'
      : '';

    const swingPanel = swingModes.length>1
      ? '<div data-secpanel="swing" style="'+pw+'">'
          +'<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Oscillazione</div>'
          +'<div style="display:flex;gap:5px;flex-wrap:wrap">'
          +swingModes.map(function(m){ return selBtn(entityId,'swing',m,sLabel(m),swingMode===m,'#a78bfa'); }).join('')
          +'</div></div>'
      : '';

    return css
      +'<div id="'+rid+'" style="position:relative;width:100%;height:100%;min-height:260px;border-radius:18px;'
        +'padding:14px;box-sizing:border-box;font-family:system-ui,sans-serif;color:#e8ebf5;'
        +'display:flex;flex-direction:column;gap:9px;overflow:hidden;'
        +'background:linear-gradient(150deg,#0c1322 0%,#0a0f1c 60%,#0c1626 100%);'
        +'border:1px solid rgba(99,102,241,.22);box-shadow:0 10px 40px rgba(0,0,0,.45);">'
        +'<div style="text-align:center;font-size:19px;font-weight:800;letter-spacing:-.2px;'
          +'white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+nm+'</div>'
        +acBody+airSection+tempRow+togRow+modePanel+(fanPanel||'')+(swingPanel||'')
      +'</div>';
  }

  /* ── MOUNT ── */
  function mount(card, hass, el) {
    if (el._clmHandler) el.removeEventListener('click', el._clmHandler);

    el._clmHandler = function(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.stopPropagation(); e.preventDefault();

      const action = btn.getAttribute('data-action');

      if (action === 'toggle') {
        const sec   = btn.getAttribute('data-sec');
        const secEl = el.querySelector('[data-secpanel="'+sec+'"]');
        if (!secEl) return;
        const wasOpen = secEl.style.display === 'flex';
        el.querySelectorAll('[data-secpanel]').forEach(function(s){ s.style.display='none'; });
        el.querySelectorAll('.tog').forEach(function(b){
          b.style.background='rgba(255,255,255,.07)'; b.style.color='#94a3b8'; b.style.borderColor='rgba(255,255,255,.1)';
        });
        if (!wasOpen) {
          secEl.style.display='flex';
          btn.style.background='rgba(255,255,255,.16)'; btn.style.color='#e2e8f0'; btn.style.borderColor='rgba(255,255,255,.22)';
          _openSecs[card.id]=sec;
        } else { _openSecs[card.id]=null; }
        return;
      }

      const now = Date.now();
      if (now-(el._lastSvc||0)<700) return;
      el._lastSvc = now;

      const h = H(), c = load(card);
      const entityId = btn.getAttribute('data-cid') || c.entity || '';
      if (!entityId) return;
      const st  = clState(h, entityId);
      const val = btn.getAttribute('data-val');
      const curOpt = _optimisticState[card.id] || {};

      if (action === 'mode') {
        if (val==='off') callSvc('climate','turn_off',{entity_id:entityId});
        else callSvc('climate','set_hvac_mode',{entity_id:entityId,hvac_mode:val});
        _optimisticState[card.id] = { mode:val, fan:curOpt.fan, swing:curOpt.swing, expires:Date.now()+8000 };
        _rerenderCard(card, el);

      } else if (action === 'fan') {
        callSvc('climate','set_fan_mode',{entity_id:entityId,fan_mode:val});
        _optimisticState[card.id] = { mode:curOpt.mode, fan:val, swing:curOpt.swing, expires:Date.now()+8000 };
        _rerenderCard(card, el);

      } else if (action === 'swing') {
        callSvc('climate','set_swing_mode',{entity_id:entityId,swing_mode:val});
        _optimisticState[card.id] = { mode:curOpt.mode, fan:curOpt.fan, swing:val, expires:Date.now()+8000 };

        const isOnNow  = !!(st && st.mode && st.mode !== 'off');
        const swingNow = _swingIsActive(val);

        const flapEl = el.querySelector('[data-clm-flap]');
        if (flapEl) {
          const r = flapEl.getAttribute('data-rid');
          _flapSet(flapEl, r, isOnNow, swingNow);
        }

        el.querySelectorAll('[data-secpanel="swing"] .cb').forEach(function(b){
          const active = b.getAttribute('data-val')===val;
          b.style.background  = active?'#a78bfa33':'rgba(255,255,255,.07)';
          b.style.color       = active?'#a78bfa':'#64748b';
          b.style.border      = active?'1px solid #a78bfa55':'1px solid rgba(255,255,255,.1)';
          b.style.boxShadow   = active?'0 0 9px #a78bfa44':'';
        });

      } else if (action==='temp-up'||action==='temp-down') {
        if (!st) return;
        const step    = parseFloat(st.step)||1;
        const curT    = parseFloat(st.target)||22;
        const nxt     = action==='temp-up' ? Math.min(st.max,curT+step) : Math.max(st.min,curT-step);
        const rounded = Math.round(nxt/step)*step;
        callSvc('climate','set_temperature',{entity_id:entityId,temperature:rounded});
        _optimisticTemps[card.id] = { temp:rounded, expires:Date.now()+10000 };
        const disp  = rounded.toFixed(1);
        const ledEl = el.querySelector('[data-clm-led]');
        const tmpEl = el.querySelector('[data-clm-temp]');
        if (ledEl) ledEl.textContent=disp;
        if (tmpEl && (st.mode||'off')!=='off') tmpEl.textContent=disp+'°';
      }
    };

    el.addEventListener('click', el._clmHandler);

    /* Avvia RAF aletta in base allo stato corrente */
    var flapEl0 = el.querySelector('[data-clm-flap]');
    if (flapEl0) {
      var r0    = flapEl0.getAttribute('data-rid');
      var c0    = load(card), h0 = H(), st0 = clState(h0, c0.entity||'');
      var opt0  = _optimisticState[card.id];
      var useOpt0 = opt0 && Date.now() < opt0.expires;
      var mode0  = (useOpt0 && opt0.mode  !== undefined) ? opt0.mode  : (st0 ? st0.mode  : 'off');
      var swing0 = (useOpt0 && opt0.swing !== undefined) ? opt0.swing : (st0 ? st0.swing : 'off');
      _flapSet(flapEl0, r0, mode0 !== 'off', _swingIsActive(swing0));
    }
  }

  /* ── UPDATE ── */
  function update(card, hass, el) {
    try {
      const key = _stateKey(card, hass);
      if (_lastKeys[card.id]===key) return;
      _lastKeys[card.id]=key;
      const openSec=_openSecs[card.id];
      var oldFlapU = el.querySelector('[data-clm-flap]');
      if (oldFlapU) _flapStop(oldFlapU.getAttribute('data-rid'));
      el.innerHTML=render(card);
      mount(card,hass,el);
      if (openSec) {
        const se=el.querySelector('[data-secpanel="'+openSec+'"]');
        const tb=el.querySelector('[data-action="toggle"][data-sec="'+openSec+'"]');
        if (se) se.style.display='flex';
        if (tb){ tb.style.background='rgba(255,255,255,.16)'; tb.style.color='#e2e8f0'; tb.style.borderColor='rgba(255,255,255,.22)'; }
      }
    } catch(e){}
  }

  /* ── CONFIG ── */
  function openCfg(card, el) {
    const h=H(), c=load(card);
    const states=(h&&h.states)||{};
    const allIds=Object.keys(states).sort();
    const climIds=allIds.filter(function(id){return id.startsWith('climate.');});
    const sensIds=allIds.filter(function(id){return id.startsWith('sensor.');});
    const binIds =allIds.filter(function(id){return id.startsWith('binary_sensor.');});

    const stInp ='width:100%;padding:9px 11px;border-radius:10px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop='position:absolute;left:0;right:0;top:100%;z-index:20;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 10px 10px;display:none';
    const stLbl ='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stBase='width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:13px;box-sizing:border-box';

    function mkTog(id,on){
      const bg=on?'#22c55e':'rgba(255,255,255,.15)', lft=on?'17px':'2px';
      return '<div id="'+id+'" data-on="'+(on?'1':'0')+'" style="width:34px;height:18px;border-radius:9px;cursor:pointer;flex-shrink:0;position:relative;background:'+bg+';transition:background .2s">'
        +'<div style="position:absolute;top:1px;left:'+lft+';width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div></div>';
    }

    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.78);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';

    ov.innerHTML='<div style="width:min(480px,94vw);max-height:90vh;overflow-y:auto;background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9">'
      +'<div style="font-size:16px;font-weight:800;margin-bottom:14px">❄️ Configura Climatizzatore</div>'
      +'<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome</label>'
        +'<input id="cl-name" type="text" value="'+(c.name||'').replace(/"/g,'&quot;')+'" placeholder="CLIMA SALOTTO" style="'+stBase+'"></div>'
      +'<div style="margin-bottom:10px;position:relative"><label style="'+stLbl+'">Entità Clima</label>'
        +'<input id="cl-ent" type="text" value="'+(c.entity||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="climate.xxx" style="'+stInp+'">'
        +'<div id="cl-ent-d" style="'+stDrop+'"></div></div>'
      +'<div style="margin-bottom:10px;position:relative"><label style="'+stLbl+'">Sensore Temperatura</label>'
        +'<input id="cl-temp" type="text" value="'+(c.tempEntity||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="sensor.temperatura_salotto" style="'+stInp+'">'
        +'<div id="cl-temp-d" style="'+stDrop+'"></div></div>'
      +'<div style="margin-bottom:10px;position:relative"><label style="'+stLbl+'">Sensore Umidità</label>'
        +'<input id="cl-hum" type="text" value="'+(c.humEntity||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="sensor.umidita_salotto" style="'+stInp+'">'
        +'<div id="cl-hum-d" style="'+stDrop+'"></div></div>'
      +'<div style="margin-bottom:12px;padding:12px;background:rgba(255,255,255,.04);border-radius:12px;border:1px solid rgba(255,255,255,.08)">'
        +'<div style="display:flex;align-items:center;gap:10px">'+mkTog('cl-showbrand-tog',!!c.showBrand)+'<span style="font-size:12px;font-weight:700">Mostra marca</span></div>'
        +'<div id="cl-brand-row" style="margin-top:10px;display:'+(c.showBrand?'block':'none')+'">'
          +'<select id="cl-brand" style="'+stBase+';cursor:pointer">'
          +BRANDS.map(function(b){return '<option value="'+b+'"'+(c.brand===b?' selected':'')+'>'+b+'</option>';}).join('')
          +'</select>'
        +'</div>'
      +'</div>'
      +'<div style="margin-bottom:16px;padding:12px;background:rgba(255,255,255,.04);border-radius:12px;border:1px solid rgba(255,255,255,.08)">'
        +'<div style="display:flex;align-items:center;gap:10px">'+mkTog('cl-swsensor-tog',!!c.useSwingSensor)
        +'<div><div style="font-size:12px;font-weight:700">Sensore aletta fisica</div><div style="font-size:10px;color:#475569;margin-top:1px">Pallino verde/rosso sync clima ↔ aletta</div></div></div>'
        +'<div id="cl-swsensor-row" style="margin-top:10px;position:relative;display:'+(c.useSwingSensor?'block':'none')+'">'
          +'<input id="cl-swsensor" type="text" value="'+(c.swingSensor||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="binary_sensor.aletta_clima" style="'+stInp+'">'
          +'<div id="cl-swsensor-d" style="'+stDrop+'"></div>'
        +'</div>'
      +'</div>'
      +'<div style="display:flex;gap:10px">'
        +'<button id="cl-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>'
        +'<button id="cl-save"   style="flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>'
      +'</div></div>';

    document.body.appendChild(ov);
    const close=function(){try{document.body.removeChild(ov);}catch(e){}};
    ov.addEventListener('click',function(e){if(e.target===ov)close();});
    ov.querySelector('#cl-cancel').addEventListener('click',close);

    function bindTog(id,rowId){
      const tog=ov.querySelector('#'+id), row=ov.querySelector('#'+rowId);
      tog.addEventListener('click',function(){
        const on=this.getAttribute('data-on')!=='1';
        this.setAttribute('data-on',on?'1':'0');
        this.style.background=on?'#22c55e':'rgba(255,255,255,.15)';
        this.querySelector('div').style.left=on?'17px':'2px';
        row.style.display=on?'block':'none';
      });
    }
    bindTog('cl-showbrand-tog','cl-brand-row');
    bindTog('cl-swsensor-tog','cl-swsensor-row');

    function makeCombo(inpId,dropId,defaults){
      var inp=ov.querySelector('#'+inpId),drop=ov.querySelector('#'+dropId);
      function show(){
        var q=inp.value.toLowerCase().trim();
        var hits=(q?allIds.filter(function(id){return id.toLowerCase().includes(q)||(((states[id]||{}).attributes||{}).friendly_name||'').toLowerCase().includes(q);}):defaults).slice(0,60);
        if(!hits.length){drop.style.display='none';return;}
        drop.style.display='block';
        drop.innerHTML=hits.map(function(id){var fn=(((states[id]||{}).attributes)||{}).friendly_name||'';
          return '<div data-pick="'+id+'" style="padding:5px 11px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)">'
            +'<span style="color:#e2e8f0">'+id+'</span>'+(fn?'<span style="color:#475569;margin-left:7px;font-family:system-ui;font-size:10px">'+fn+'</span>':'')+'</div>';
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
    makeCombo('cl-ent','cl-ent-d',climIds);
    makeCombo('cl-temp','cl-temp-d',sensIds);
    makeCombo('cl-hum','cl-hum-d',sensIds);
    makeCombo('cl-swsensor','cl-swsensor-d',binIds);

    ov.querySelector('#cl-save').addEventListener('click',function(){
      save(card,{
        name:           ov.querySelector('#cl-name').value.trim(),
        entity:         ov.querySelector('#cl-ent').value.trim(),
        tempEntity:     ov.querySelector('#cl-temp').value.trim(),
        humEntity:      ov.querySelector('#cl-hum').value.trim(),
        showBrand:      ov.querySelector('#cl-showbrand-tog').getAttribute('data-on')==='1',
        brand:          ov.querySelector('#cl-brand').value,
        useSwingSensor: ov.querySelector('#cl-swsensor-tog').getAttribute('data-on')==='1',
        swingSensor:    ov.querySelector('#cl-swsensor').value.trim(),
      });
      close();
      _lastKeys[card.id]=null;
      try{el.innerHTML=render(card);mount(card,H(),el);}catch(e){}
    });
  }

  function duplicateCard(src, copy) {
    var data = localStorage.getItem(keyOf(src));
    if (data) localStorage.setItem(keyOf(copy), data);
  }

  var CARD={
    id:'clima-card',name:'Climatizzatore',icon:'❄️',version:'2.9',
    desc:'Split — look scuro, SVG loghi reali, aletta RAF, glow modalità.',
    colSpan:2,rowSpan:4,render:render,mount:mount,update:update,configure:openCfg,duplicate:duplicateCard,
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{console.log('[FratechStore] Card registrata: clima-card v2.8');}catch(e){}
})();
