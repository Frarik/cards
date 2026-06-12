/* frarik-version: 2.4 */
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

  function mColor(m) { return HVAC_COL[m] || '#475569'; }
  function mLabel(m) { return HVAC_LBL[m] || m; }
  function mIcon(m)  { return HVAC_ICO[m] || '⏻'; }
  function fLabel(m) { return FAN_LBL[m]  || m; }
  function sLabel(m) { return SWING_LBL[m]|| m; }

  var _openSecs       = {};
  var _lastKeys       = {};
  var _optimisticTemps = {}; // card.id → { temp:Number, expires:Number }

  function _stateKey(card, hass) {
    try {
      const c = load(card), h = (hass && hass.states) || {};
      function cv(id) {
        const s = h[id]; if (!s) return '';
        const a = s.attributes || {};
        return [s.state, a.temperature, a.current_temperature, a.fan_mode, a.swing_mode, a.hvac_action].join(':');
      }
      function sv(id) { const s = h[id]; return s ? s.state : ''; }
      return cv(c.entity) + '|' + sv(c.tempEntity) + '|' + sv(c.humEntity);
    } catch(e) { return String(Date.now()); }
  }

  /* ── Mist: blob nebulizzati che scendono morbidi dall'AC ── */
  function airStreams(rid, col, show) {
    if (!show) return '';
    // [leftPct, widthPx, heightPx, blurPx, durationS, delayS]
    var p = [
      [3,  88, 15, 10, 7.2, 0.0],
      [17, 58, 11,  7, 8.8, 1.4],
      [33, 98, 17, 12, 6.6, 0.6],
      [7,  42, 13,  6, 8.0, 2.6],
      [48, 78, 15, 10, 8.2, 1.0],
      [24, 52, 10,  6, 7.4, 3.6],
      [58, 90, 17, 11, 6.9, 1.9],
      [11, 68, 13,  8, 7.6, 0.3],
      [43, 44, 11,  5, 8.5, 3.0],
      [68, 72, 15, 10, 7.1, 1.6],
      [28, 82, 16, 11, 9.0, 4.3],
      [76, 36, 10,  5, 6.6, 2.4],
      [52, 62, 13,  8, 7.5, 0.9],
      [20, 46, 11,  6, 8.1, 2.1],
    ];
    return p.map(function(s) {
      var l=s[0], w=s[1], h=s[2], blur=s[3], dur=s[4], delay=s[5];
      return '<div style="position:absolute;left:'+l+'%;top:-'+(h+4)+'px;width:'+w+'px;height:'+h+'px;'
        +'border-radius:50%;'
        +'background:radial-gradient(ellipse at 50% 38%,'+col+'cc 0%,'+col+'55 52%,'+col+'11 78%,transparent 100%);'
        +'filter:blur('+blur+'px);opacity:0;'
        +'animation:'+rid+'mist '+dur+'s ease-in-out '+delay+'s infinite;'
        +'pointer-events:none"></div>';
    }).join('');
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = load(card);
    const rid = 'clm' + (card.id || Math.random().toString(36).slice(2,8));
    const entityId = c.entity || '';
    const st       = clState(h, entityId);
    const mode     = st ? st.mode  : 'off';
    const isOn     = mode !== 'off';
    const swingOn  = st ? st.swing !== 'off' : false;
    const mCol     = mColor(mode);

    // Temperatura: usa ottimistica se disponibile e non ancora confermata da HA
    const opt = _optimisticTemps[card.id];
    const optValid = opt && Date.now() < opt.expires;
    if (optValid && st && st.target != null && Math.abs(opt.temp - parseFloat(st.target)) < 0.001) {
      delete _optimisticTemps[card.id]; // HA ha confermato
    }
    const targetTemp = optValid ? opt.temp.toFixed(1) : ((st && st.target != null) ? parseFloat(st.target).toFixed(1) : '--.-');

    const fanMode    = st ? st.fan   : 'auto';
    const swingMode  = st ? st.swing : 'off';
    const nm         = c.name || (st ? st.friendlyName : 'Climatizzatore');

    const hvacModes  = st ? st.hvacModes  : ['off','cool','heat'];
    const fanModes   = st ? st.fanModes   : ['auto','low','medium','high'];
    const swingModes = st ? st.swingModes : ['off','on'];

    const tempEnt = c.tempEntity && h && h.states && h.states[c.tempEntity] ? h.states[c.tempEntity] : null;
    const humEnt  = c.humEntity  && h && h.states && h.states[c.humEntity]  ? h.states[c.humEntity]  : null;
    const sensorT = tempEnt ? parseFloat(tempEnt.state).toFixed(1) : null;
    const sensorH = humEnt  ? parseFloat(humEnt.state).toFixed(0)  : null;

    /* ── CSS ── */
    const css = '<style>'
      // Mist: blob scendono dall'alto verso il basso, lenti e nebulosi
      +'@keyframes '+rid+'mist{0%{opacity:0;transform:translateY(-8px) scaleX(1)}16%{opacity:.54}78%{opacity:.14}100%{opacity:0;transform:translateY(96px) scaleX(1.2)}}'
      // Aletta: più lenta (8 s), angoli realistici
      +'@keyframes '+rid+'flap{0%{transform:rotateX(4deg)}50%{transform:rotateX(40deg)}100%{transform:rotateX(4deg)}}'
      +'@keyframes '+rid+'led{0%,100%{opacity:1}46%{opacity:.72}}'
      +'@keyframes '+rid+'ind{0%,100%{box-shadow:0 0 5px '+mCol+'66}50%{box-shadow:0 0 14px '+mCol+',0 0 28px '+mCol+'66}}'
      +'#'+rid+' .cb{padding:5px 10px;border-radius:8px;border:none;cursor:pointer;font-size:11px;font-weight:700;transition:all .18s;}'
      +'#'+rid+' .cb:hover{filter:brightness(1.3);}'
      +'#'+rid+' .tog{flex:1;padding:8px 4px;border-radius:12px;border:1px solid rgba(255,255,255,.1);cursor:pointer;font-size:10px;'
        +'font-weight:700;display:flex;flex-direction:column;align-items:center;gap:3px;'
        +'background:rgba(255,255,255,.07);color:#94a3b8;transition:all .2s;}'
      +'#'+rid+' .tog:hover{background:rgba(255,255,255,.13);color:#e2e8f0;}'
      +'</style>';

    /* ── Badge sensori ── */
    const indRight = (sensorT || sensorH)
      ? '<div style="display:flex;gap:4px;align-items:center">'
          +(sensorT?'<div style="font-size:10px;font-weight:700;color:rgba(0,0,0,.44);background:rgba(0,0,0,.06);padding:2px 7px;border-radius:99px">🌡 '+sensorT+'°</div>':'')
          +(sensorH?'<div style="font-size:10px;font-weight:700;color:rgba(0,0,0,.44);background:rgba(0,0,0,.06);padding:2px 7px;border-radius:99px">💧 '+sensorH+'%</div>':'')
        +'</div>'
      : '';

    /* ── Corpo AC ── */
    const acBody = '<div style="position:relative">'

      // Frame principale – bordo più visibile, ombra più profonda
      +'<div style="border-radius:15px;overflow:hidden;'
        +'background:linear-gradient(170deg,#f8fafd 0%,#edf2fa 55%,#e3eaf5 100%);'
        +'border:1px solid rgba(100,125,162,.32);'
        +'box-shadow:0 8px 34px rgba(0,0,0,.52),0 2px 6px rgba(0,0,0,.2),'
          +'inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 6px rgba(0,0,0,.1);">'

        // Barra indicatore
        +'<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;'
          +'background:rgba(0,0,0,.05);border-bottom:1px solid rgba(0,0,0,.09)">'
          +'<div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;'
            +'background:'+(isOn?mCol:'#9ca3af')+';'
            +(isOn?'animation:'+rid+'ind 2.2s ease-in-out infinite;box-shadow:0 0 8px '+mCol+';':'')+'"></div>'
          +'<div style="flex:1;font-size:10px;font-weight:700;color:rgba(0,0,0,.42);text-transform:uppercase;letter-spacing:.06em">'
            +(isOn?mIcon(mode)+' '+mLabel(mode):'SPENTO')
          +'</div>'
          +indRight
        +'</div>'

        // Faccia
        +'<div style="display:flex;height:78px">'

          // Pannello bianco sinistro con texture griglia orizzontale
          +'<div style="flex:1;position:relative;overflow:hidden;'
            +'background:linear-gradient(90deg,rgba(255,255,255,.75),rgba(238,246,255,.45));">'
            +'<div style="position:absolute;inset:0;pointer-events:none;'
              +'background:repeating-linear-gradient(180deg,transparent,transparent 9px,rgba(0,0,0,.03) 9px,rgba(0,0,0,.03) 10px)"></div>'
            +'<div style="position:absolute;top:0;right:0;bottom:0;width:18px;'
              +'background:linear-gradient(90deg,transparent,rgba(0,0,0,.07));pointer-events:none"></div>'
            // Piccola spia status in basso a sinistra
            +(isOn?'<div style="position:absolute;bottom:6px;left:10px;width:5px;height:5px;border-radius:50%;background:'+mCol+';opacity:.7;box-shadow:0 0 6px '+mCol+'"></div>':'')
          +'</div>'

          // Separatore verticale
          +'<div style="width:1px;background:rgba(0,0,0,.12);flex-shrink:0"></div>'

          // Display LED
          +'<div style="width:108px;flex-shrink:0;background:rgba(0,0,0,.04);display:flex;align-items:center;justify-content:center;padding:0 8px">'
            +'<div style="background:#050d0a;border-radius:8px;padding:5px 10px;width:100%;box-sizing:border-box;'
              +'border:1px solid rgba(0,0,0,.6);'
              +'box-shadow:inset 0 3px 10px rgba(0,0,0,.7),inset 0 0 20px rgba(0,0,0,.35)">'
              +'<div data-clm-led style="font-family:\'Courier New\',Courier,monospace;font-size:25px;font-weight:700;letter-spacing:2px;line-height:1;text-align:center;'
                +'color:'+(isOn?mCol:'#0d1a12')+';'
                +'text-shadow:'+(isOn?'0 0 14px '+mCol+',0 0 30px '+mCol+'55':'none')+';'
                +(isOn?'animation:'+rid+'led 3s ease-in-out infinite;':'')
              +'">'+targetTemp+'</div>'
              +'<div style="font-size:8px;font-family:monospace;letter-spacing:1px;text-align:right;margin-top:2px;'
                +'color:'+(isOn?mCol+'88':'#0d1a12')+'">°C</div>'
            +'</div>'
          +'</div>'

        +'</div>'

        // Fascia inferiore griglia aria
        +'<div style="height:13px;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.12));'
          +'border-top:1px solid rgba(0,0,0,.08);position:relative;overflow:hidden">'
          +'<div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,'
            +'rgba(0,0,0,.07) 0px,rgba(0,0,0,.07) 1px,transparent 1px,transparent 13px)"></div>'
        +'</div>'

      +'</div>'

      // Aletta: fuori dall'overflow, visibile contro il bianco
      // border-top scuro per lo stacco netto dal corpo AC
      +'<div style="position:absolute;bottom:-7px;left:13px;right:13px;height:15px;'
        +'perspective:220px;perspective-origin:50% 0%;z-index:2">'
        +'<div style="width:100%;height:100%;'
          +'background:linear-gradient(180deg,'
            +'rgba(135,158,186,1.0) 0%,'
            +'rgba(168,190,213,.97) 32%,'
            +'rgba(182,204,224,.95) 100%);'
          +'border-top:2px solid rgba(85,112,146,.68);'
          +'border-radius:0 0 5px 5px;'
          +'box-shadow:0 -1px 3px rgba(0,0,0,.1),0 5px 15px rgba(0,0,0,.38),'
            +'inset 0 1px 0 rgba(255,255,255,.28);'
          +'transform-origin:50% 0%;'
          +(swingOn&&isOn?'animation:'+rid+'flap 8s ease-in-out infinite;':'')
        +'"></div>'
      +'</div>'

    +'</div>';

    /* ── Sezione aria nebulizzata ── */
    const airSection = '<div style="position:relative;height:'+(isOn?'86px':'10px')+';overflow:hidden;'
      +'transition:height .7s ease;margin-top:6px;pointer-events:none">'
      +airStreams(rid, mCol, isOn)
    +'</div>';

    /* ── Riga temperatura +/- ── */
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

    /* ── 3 bottoni toggle ── */
    const togRow = '<div style="display:flex;gap:7px">'
      +'<button class="tog" data-action="toggle" data-sec="mode">'
        +'<span style="font-size:17px">'+mIcon(mode)+'</span><span>Modalità</span>'
      +'</button>'
      +'<button class="tog" data-action="toggle" data-sec="fan">'
        +'<span style="font-size:17px">💨</span><span>Ventola</span>'
      +'</button>'
      +(swingModes.length>1
        ?'<button class="tog" data-action="toggle" data-sec="swing">'
          +'<span style="font-size:17px">↕</span><span>Alette</span>'
          +'</button>'
        :'')
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
        +acBody
        +airSection
        +tempRow
        +togRow
        +modePanel
        +(fanPanel||'')
        +(swingPanel||'')
      +'</div>';
  }

  /* ── MOUNT ── */
  function mount(card, hass, el) {
    if (el._clmHandler) el.removeEventListener('click', el._clmHandler);

    el._clmHandler = function(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();

      const action = btn.getAttribute('data-action');

      if (action === 'toggle') {
        const sec   = btn.getAttribute('data-sec');
        const secEl = el.querySelector('[data-secpanel="'+sec+'"]');
        if (!secEl) return;
        const wasOpen = secEl.style.display === 'flex';
        el.querySelectorAll('[data-secpanel]').forEach(function(s){ s.style.display = 'none'; });
        el.querySelectorAll('.tog').forEach(function(b){
          b.style.background  = 'rgba(255,255,255,.07)';
          b.style.color       = '#94a3b8';
          b.style.borderColor = 'rgba(255,255,255,.1)';
        });
        if (!wasOpen) {
          secEl.style.display = 'flex';
          btn.style.background  = 'rgba(255,255,255,.16)';
          btn.style.color       = '#e2e8f0';
          btn.style.borderColor = 'rgba(255,255,255,.22)';
          _openSecs[card.id] = sec;
        } else {
          _openSecs[card.id] = null;
        }
        return;
      }

      const now = Date.now();
      if (now - (el._lastSvc||0) < 700) return;
      el._lastSvc = now;

      const h = H(), c = load(card);
      const entityId = btn.getAttribute('data-cid') || c.entity || '';
      if (!entityId) return;
      const st  = clState(h, entityId);
      const val = btn.getAttribute('data-val');

      if (action === 'mode') {
        if (val === 'off') callSvc('climate','turn_off',{entity_id:entityId});
        else callSvc('climate','set_hvac_mode',{entity_id:entityId,hvac_mode:val});
      } else if (action === 'fan') {
        callSvc('climate','set_fan_mode',{entity_id:entityId,fan_mode:val});
      } else if (action === 'swing') {
        callSvc('climate','set_swing_mode',{entity_id:entityId,swing_mode:val});
      } else if (action==='temp-up'||action==='temp-down') {
        if (!st) return;
        const step    = parseFloat(st.step)||1;
        const cur     = parseFloat(st.target)||22;
        const nxt     = action==='temp-up' ? Math.min(st.max,cur+step) : Math.max(st.min,cur-step);
        const rounded = Math.round(nxt/step)*step;
        callSvc('climate','set_temperature',{entity_id:entityId,temperature:rounded});

        // Aggiornamento ottimistico immediato (nessun re-render, solo DOM diretto)
        _optimisticTemps[card.id] = { temp: rounded, expires: Date.now() + 10000 };
        const disp   = rounded.toFixed(1);
        const ledEl  = el.querySelector('[data-clm-led]');
        const tempEl = el.querySelector('[data-clm-temp]');
        if (ledEl) ledEl.textContent = disp;
        if (tempEl && st.mode !== 'off') tempEl.textContent = disp + '°';
      }
    };

    el.addEventListener('click', el._clmHandler);
  }

  /* ── UPDATE ── */
  function update(card, hass, el) {
    try {
      const key = _stateKey(card, hass);
      if (_lastKeys[card.id] === key) return;
      _lastKeys[card.id] = key;

      const openSec = _openSecs[card.id];
      el.innerHTML = render(card);
      mount(card, hass, el);

      if (openSec) {
        const secEl  = el.querySelector('[data-secpanel="'+openSec+'"]');
        const togBtn = el.querySelector('[data-action="toggle"][data-sec="'+openSec+'"]');
        if (secEl)  secEl.style.display = 'flex';
        if (togBtn) {
          togBtn.style.background  = 'rgba(255,255,255,.16)';
          togBtn.style.color       = '#e2e8f0';
          togBtn.style.borderColor = 'rgba(255,255,255,.22)';
        }
      }
    } catch(e) {}
  }

  /* ── CONFIG POPUP ── */
  function openCfg(card, el) {
    const h = H(), c = load(card);
    const states  = (h && h.states) || {};
    const allIds  = Object.keys(states).sort();
    const climIds = allIds.filter(function(id){ return id.startsWith('climate.'); });
    const sensIds = allIds.filter(function(id){ return id.startsWith('sensor.'); });

    const stInp  = 'width:100%;padding:9px 11px;border-radius:10px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:20;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 10px 10px;display:none';
    const stLbl  = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stBase = 'width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:13px;box-sizing:border-box';

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.78);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';

    ov.innerHTML = '<div style="width:min(460px,94vw);max-height:90vh;overflow-y:auto;background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9">'
      +'<div style="font-size:16px;font-weight:800;margin-bottom:14px">❄️ Configura Climatizzatore</div>'
      +'<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome</label>'
        +'<input id="cl-name" type="text" value="'+(c.name||'').replace(/"/g,'&quot;')+'" placeholder="CLIMA SALOTTO" style="'+stBase+'"></div>'
      +'<div style="margin-bottom:10px;position:relative"><label style="'+stLbl+'">Entità Clima</label>'
        +'<input id="cl-ent"  type="text" value="'+(c.entity||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="climate.xxx" style="'+stInp+'">'
        +'<div id="cl-ent-d"  style="'+stDrop+'"></div></div>'
      +'<div style="margin-bottom:10px;position:relative"><label style="'+stLbl+'">Sensore Temperatura <span style="font-weight:400;color:#475569;font-size:10px;text-transform:none;letter-spacing:0">sul corpo del clima</span></label>'
        +'<input id="cl-temp" type="text" value="'+(c.tempEntity||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="sensor.temperatura_salotto" style="'+stInp+'">'
        +'<div id="cl-temp-d" style="'+stDrop+'"></div></div>'
      +'<div style="margin-bottom:10px;position:relative"><label style="'+stLbl+'">Sensore Umidità <span style="font-weight:400;color:#475569;font-size:10px;text-transform:none;letter-spacing:0">sul corpo del clima</span></label>'
        +'<input id="cl-hum"  type="text" value="'+(c.humEntity||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="sensor.umidita_salotto" style="'+stInp+'">'
        +'<div id="cl-hum-d"  style="'+stDrop+'"></div></div>'
      +'<div style="display:flex;gap:10px;margin-top:16px">'
        +'<button id="cl-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>'
        +'<button id="cl-save"   style="flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>'
      +'</div></div>';

    document.body.appendChild(ov);
    const close = function(){ try{ document.body.removeChild(ov); }catch(e){} };
    ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
    ov.querySelector('#cl-cancel').addEventListener('click', close);

    function makeCombo(inpId, dropId, defaults) {
      var inp = ov.querySelector('#'+inpId), drop = ov.querySelector('#'+dropId);
      function show() {
        var q = inp.value.toLowerCase().trim();
        var hits = (q
          ? allIds.filter(function(id){ return id.toLowerCase().includes(q)||(((states[id]||{}).attributes||{}).friendly_name||'').toLowerCase().includes(q); })
          : defaults
        ).slice(0,60);
        if (!hits.length){ drop.style.display='none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(function(id){
          var fn=(((states[id]||{}).attributes)||{}).friendly_name||'';
          return '<div data-pick="'+id+'" style="padding:5px 11px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)">'
            +'<span style="color:#e2e8f0">'+id+'</span>'
            +(fn?'<span style="color:#475569;margin-left:7px;font-family:system-ui;font-size:10px">'+fn+'</span>':'')
          +'</div>';
        }).join('');
        drop.querySelectorAll('[data-pick]').forEach(function(row){
          row.addEventListener('mousedown',function(ev){ ev.preventDefault(); inp.value=row.getAttribute('data-pick'); drop.style.display='none'; });
          row.addEventListener('mouseover',function(){ row.style.background='rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout', function(){ row.style.background=''; });
        });
      }
      inp.addEventListener('focus', show);
      inp.addEventListener('input', show);
      inp.addEventListener('blur',  function(){ setTimeout(function(){ drop.style.display='none'; }, 200); });
    }

    makeCombo('cl-ent',  'cl-ent-d',  climIds);
    makeCombo('cl-temp', 'cl-temp-d', sensIds);
    makeCombo('cl-hum',  'cl-hum-d',  sensIds);

    ov.querySelector('#cl-save').addEventListener('click', function(){
      save(card,{
        name:       ov.querySelector('#cl-name').value.trim(),
        entity:     ov.querySelector('#cl-ent').value.trim(),
        tempEntity: ov.querySelector('#cl-temp').value.trim(),
        humEntity:  ov.querySelector('#cl-hum').value.trim(),
      });
      close();
      _lastKeys[card.id] = null;
      try{ el.innerHTML=render(card); mount(card,H(),el); }catch(e){}
    });
  }

  var CARD = {
    id:'clima-card', name:'Climatizzatore', icon:'❄️', version:'2.4',
    desc:'Split murale — mist nebulizzato, aletta 8s, temperatura ottimistica immediata, griglia e stacco aletta raffinati.',
    colSpan:2, rowSpan:4,
    render:render, mount:mount, update:update, configure:openCfg,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try{ console.log('[FratechStore] Card registrata: clima-card v2.4'); }catch(e){}
})();
