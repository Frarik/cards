/* frarik-version: 2.3 */
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

  // Stato persistente per sezione aperta e chiave ultimo stato (per evitare re-render inutili)
  var _openSecs  = {};
  var _lastKeys  = {};

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

  /* ── Air streams: delay uniformi → flusso continuo senza scatti ── */
  function airStreams(rid, col, show) {
    if (!show) return '';
    const dur = 3.8;
    const pos = [
      [3,72],[16,54],[7,76],[25,60],[11,50],
      [30,66],[5,58],[21,72],[27,54],[9,64]
    ];
    return pos.map(function(s, i) {
      const delay = (i * dur / pos.length).toFixed(2);
      return '<div style="position:absolute;left:'+s[0]+'%;width:'+s[1]+'%;height:2px;border-radius:99px;'
        +'background:linear-gradient(90deg,transparent,'+col+'cc,'+col+'88,transparent);'
        +'animation:'+rid+'air '+dur+'s linear '+delay+'s infinite;pointer-events:none"></div>';
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

    const targetTemp = (st && st.target  != null) ? parseFloat(st.target).toFixed(1)  : '--.-';
    const fanMode    = st ? st.fan   : 'auto';
    const swingMode  = st ? st.swing : 'off';
    const nm         = c.name || (st ? st.friendlyName : 'Climatizzatore');

    const hvacModes  = st ? st.hvacModes  : ['off','cool','heat'];
    const fanModes   = st ? st.fanModes   : ['auto','low','medium','high'];
    const swingModes = st ? st.swingModes : ['off','on'];

    // Sensori esterni (mostrati nella barra del corpo AC, non nell'header)
    const tempEnt = c.tempEntity && h && h.states && h.states[c.tempEntity] ? h.states[c.tempEntity] : null;
    const humEnt  = c.humEntity  && h && h.states && h.states[c.humEntity]  ? h.states[c.humEntity]  : null;
    const sensorT = tempEnt ? parseFloat(tempEnt.state).toFixed(1) : null;
    const sensorH = humEnt  ? parseFloat(humEnt.state).toFixed(0)  : null;

    /* ── CSS ── */
    const css = '<style>'
      +'@keyframes '+rid+'air{0%{transform:translateY(-4px);opacity:0}12%{opacity:.7}80%{opacity:.4}100%{transform:translateY(80px);opacity:0}}'
      // Aletta lenta (5 s), angoli dolci come split reale
      +'@keyframes '+rid+'flap{0%{transform:rotateX(3deg)}50%{transform:rotateX(36deg)}100%{transform:rotateX(3deg)}}'
      +'@keyframes '+rid+'led{0%,100%{opacity:1}46%{opacity:.68}}'
      +'@keyframes '+rid+'ind{0%,100%{box-shadow:0 0 5px '+mCol+'66}50%{box-shadow:0 0 14px '+mCol+',0 0 28px '+mCol+'66}}'
      +'#'+rid+' .cb{padding:5px 10px;border-radius:8px;border:none;cursor:pointer;font-size:11px;font-weight:700;transition:all .18s;}'
      +'#'+rid+' .cb:hover{filter:brightness(1.3);}'
      +'#'+rid+' .tog{flex:1;padding:8px 4px;border-radius:12px;border:1px solid rgba(255,255,255,.1);cursor:pointer;font-size:10px;'
        +'font-weight:700;display:flex;flex-direction:column;align-items:center;gap:3px;'
        +'background:rgba(255,255,255,.07);color:#94a3b8;transition:all .2s;}'
      +'#'+rid+' .tog:hover{background:rgba(255,255,255,.13);color:#e2e8f0;}'
      +'</style>';

    /* ── Corpo AC ── */
    // Barra indicatore (dentro il corpo bianco): sensori temperatura + umidità al posto di currentTemp
    const indRight = (sensorT || sensorH)
      ? '<div style="display:flex;gap:4px;align-items:center">'
          +(sensorT?'<div style="font-size:10px;font-weight:700;color:rgba(0,0,0,.45);background:rgba(0,0,0,.06);padding:2px 7px;border-radius:99px">🌡 '+sensorT+'°</div>':'')
          +(sensorH?'<div style="font-size:10px;font-weight:700;color:rgba(0,0,0,.45);background:rgba(0,0,0,.06);padding:2px 7px;border-radius:99px">💧 '+sensorH+'%</div>':'')
        +'</div>'
      : '';

    const acBody = '<div style="position:relative">'

      +'<div style="border-radius:14px;overflow:hidden;'
        +'background:linear-gradient(170deg,#ffffff 0%,#f2f5fb 70%,#e8edf6 100%);'
        +'box-shadow:0 6px 28px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 5px rgba(0,0,0,.1);">'

        // Barra indicatore con sensori a destra
        +'<div style="display:flex;align-items:center;gap:8px;padding:5px 12px;background:rgba(0,0,0,.04);border-bottom:1px solid rgba(0,0,0,.06)">'
          +'<div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:'+(isOn?mCol:'#9ca3af')+';'
            +(isOn?'animation:'+rid+'ind 2.2s ease-in-out infinite;box-shadow:0 0 8px '+mCol+';':'')+'"></div>'
          +'<div style="flex:1;font-size:10px;font-weight:700;color:rgba(0,0,0,.42);text-transform:uppercase;letter-spacing:.06em">'
            +(isOn?mIcon(mode)+' '+mLabel(mode):'SPENTO')
          +'</div>'
          +indRight
        +'</div>'

        // Faccia: sinistra bianca + separatore + display LED piccolo
        +'<div style="display:flex;height:78px">'

          +'<div style="flex:1;position:relative;background:linear-gradient(90deg,rgba(255,255,255,.6),rgba(240,245,255,.35));overflow:hidden">'
            +'<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.5) 0%,transparent 65%);pointer-events:none"></div>'
            +'<div style="position:absolute;top:0;right:0;bottom:0;width:14px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.05));pointer-events:none"></div>'
          +'</div>'

          +'<div style="width:1px;background:rgba(0,0,0,.08);flex-shrink:0"></div>'

          +'<div style="width:108px;flex-shrink:0;background:rgba(0,0,0,.04);display:flex;align-items:center;justify-content:center;padding:0 8px">'
            +'<div style="background:#060e0b;border-radius:8px;padding:5px 10px;width:100%;box-sizing:border-box;'
              +'border:1px solid rgba(0,0,0,.5);box-shadow:inset 0 3px 10px rgba(0,0,0,.65),inset 0 0 18px rgba(0,0,0,.3)">'
              +'<div style="font-family:\'Courier New\',Courier,monospace;font-size:25px;font-weight:700;letter-spacing:2px;line-height:1;text-align:center;'
                +'color:'+(isOn?mCol:'#0d1a12')+';'
                +'text-shadow:'+(isOn?'0 0 14px '+mCol+',0 0 28px '+mCol+'55':'none')+';'
                +(isOn?'animation:'+rid+'led 3s ease-in-out infinite;':'')
              +'">'+targetTemp+'</div>'
              +'<div style="font-size:8px;font-family:monospace;letter-spacing:1px;text-align:right;margin-top:2px;color:'+(isOn?mCol+'88':'#0d1a12')+'">°C</div>'
            +'</div>'
          +'</div>'

        +'</div>'

        +'<div style="height:13px;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.09));border-top:1px solid rgba(0,0,0,.06)"></div>'
      +'</div>'

      // Aletta fuori dall'overflow:hidden, z-index:2 per stare sopra all'aria
      +'<div style="position:absolute;bottom:-7px;left:14px;right:14px;height:15px;perspective:220px;perspective-origin:50% 0%;z-index:2">'
        +'<div style="width:100%;height:100%;'
          +'background:linear-gradient(180deg,rgba(255,255,255,.28) 0%,rgba(198,212,226,.93) 40%,rgba(150,170,195,.86) 100%);'
          +'border-radius:5px 5px 4px 4px;'
          +'box-shadow:0 4px 10px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.6);'
          +'transform-origin:50% 0%;'
          +(swingOn&&isOn?'animation:'+rid+'flap 5s ease-in-out infinite;':'')
        +'"></div>'
      +'</div>'

    +'</div>';

    /* ── Flusso d'aria ── */
    const airSection = '<div style="position:relative;height:'+(isOn?'76px':'10px')+';overflow:hidden;'
      +'transition:height .6s ease;margin-top:6px;pointer-events:none">'
      +airStreams(rid, mCol, isOn)
    +'</div>';

    /* ── Temperatura +/- ── */
    const tempRow = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;'
      +'background:rgba(255,255,255,.06);border-radius:13px;padding:7px 14px;border:1px solid rgba(255,255,255,.1)">'
      +'<button class="cb" data-cid="'+entityId+'" data-action="temp-down" '
        +'style="width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.1);color:#e2e8f0;font-size:20px;font-weight:700;padding:0;display:flex;align-items:center;justify-content:center">−</button>'
      +'<div style="font-size:26px;font-weight:800;min-width:80px;text-align:center;'
        +'color:'+(isOn?mCol:'#334155')+';text-shadow:'+(isOn?'0 0 10px '+mCol:'none')+';">'
        +(isOn?targetTemp+'°':'—')
      +'</div>'
      +'<button class="cb" data-cid="'+entityId+'" data-action="temp-up" '
        +'style="width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.1);color:#e2e8f0;font-size:20px;font-weight:700;padding:0;display:flex;align-items:center;justify-content:center">+</button>'
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

    /* helper pulsante selezione */
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
        // Header: solo nome centrato (i sensori sono sul corpo del clima)
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

  /* ── MOUNT: rimuove sempre il vecchio handler prima di aggiungerne uno nuovo ──
     Questo è il fix del bug principale: update() chiama mount() a ogni stato HA,
     senza rimuovere il vecchio handler → i listener si accumulano → click toggle
     apre+chiude+apre N volte (N handler) → nessun effetto visibile. ── */
  function mount(card, hass, el) {
    if (el._clmHandler) el.removeEventListener('click', el._clmHandler);

    el._clmHandler = function(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();

      const action = btn.getAttribute('data-action');

      // Toggle dropdown (nessun debounce)
      if (action === 'toggle') {
        const sec   = btn.getAttribute('data-sec');
        const secEl = el.querySelector('[data-secpanel="'+sec+'"]');
        if (!secEl) return;
        const wasOpen = secEl.style.display === 'flex';
        // Chiudi tutti i pannelli e deseleziona tutti i bottoni
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

      // Debounce 700 ms per service call (evita bip multipli)
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
        else { callSvc('climate','set_hvac_mode',{entity_id:entityId,hvac_mode:val}); }
      } else if (action === 'fan') {
        callSvc('climate','set_fan_mode',{entity_id:entityId,fan_mode:val});
      } else if (action === 'swing') {
        callSvc('climate','set_swing_mode',{entity_id:entityId,swing_mode:val});
      } else if (action==='temp-up'||action==='temp-down') {
        if (!st) return;
        const step = parseFloat(st.step)||1;
        const cur  = parseFloat(st.target)||22;
        const nxt  = action==='temp-up' ? Math.min(st.max,cur+step) : Math.max(st.min,cur-step);
        callSvc('climate','set_temperature',{entity_id:entityId,temperature:Math.round(nxt/step)*step});
      }
    };

    el.addEventListener('click', el._clmHandler);
  }

  /* ── UPDATE: ri-rende SOLO se lo stato dell'entità è cambiato ──
     Evita il flickering delle animazioni CSS a ogni poll di HA. ── */
  function update(card, hass, el) {
    try {
      const key = _stateKey(card, hass);
      if (_lastKeys[card.id] === key) return;
      _lastKeys[card.id] = key;

      const openSec = _openSecs[card.id];
      el.innerHTML = render(card);
      mount(card, hass, el);

      // Ripristina sezione aperta dopo il re-render
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
      _lastKeys[card.id] = null; // forza re-render alla prossima update
      try{ el.innerHTML=render(card); mount(card,H(),el); }catch(e){}
    });
  }

  var CARD = {
    id:'clima-card', name:'Climatizzatore', icon:'❄️', version:'2.3',
    desc:'Split murale con fix listener, re-render solo su cambio stato, toggle dropdown stabili, badge temp/umidità sul corpo AC.',
    colSpan:2, rowSpan:4,
    render:render, mount:mount, update:update, configure:openCfg,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try{ console.log('[FratechStore] Card registrata: clima-card v2.3'); }catch(e){}
})();
