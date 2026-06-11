/* frarik-version: 1.0 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_clima_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }

  function clState(h, id) {
    if (!id || !h || !h.states || !h.states[id]) return null;
    const s = h.states[id]; const a = s.attributes || {};
    return {
      mode:        s.state,
      action:      a.hvac_action || 'idle',
      target:      a.temperature,
      current:     a.current_temperature,
      fan:         a.fan_mode || 'auto',
      swing:       a.swing_mode || 'off',
      min:         a.min_temp || 16,
      max:         a.max_temp || 30,
      step:        a.target_temp_step || 0.5,
      fanModes:    a.fan_modes   || ['auto','low','medium','high'],
      hvacModes:   a.hvac_modes  || ['off','cool','heat','fan_only'],
      swingModes:  a.swing_modes || ['off','on'],
      friendlyName:a.friendly_name || id,
    };
  }

  function callSvc(domain, service, data) {
    try { const h = H(); if (h && h.callService) h.callService(domain, service, data); } catch (e) {}
  }

  /* ── Colori per modalità ── */
  const MODES = {
    cool:      { label:'Raffredda', icon:'❄',  ledC:'#00e5ff', ledS:'#00e5ff99', bodyT:'#e4f4ff', bodyB:'#c8e8f8', airC:'#38bdf8', glowC:'#0ea5e9',  flapC:'rgba(0,80,160,.18)' },
    heat:      { label:'Scalda',    icon:'🔥', ledC:'#ff8c00', ledS:'#ff8c0099', bodyT:'#fff5e8', bodyB:'#f5d8b0', airC:'#fb923c', glowC:'#f97316',  flapC:'rgba(160,60,0,.18)'  },
    fan_only:  { label:'Ventila',   icon:'💨', ledC:'#b794f4', ledS:'#b794f499', bodyT:'#f3eeff', bodyB:'#ddd0f5', airC:'#c4b5fd', glowC:'#7c3aed',  flapC:'rgba(100,60,200,.18)'},
    dry:       { label:'Deumidif.', icon:'💧', ledC:'#34d399', ledS:'#34d39999', bodyT:'#edfff8', bodyB:'#b8efd8', airC:'#6ee7b7', glowC:'#059669',  flapC:'rgba(0,120,80,.18)'  },
    auto:      { label:'Auto',      icon:'⟳',  ledC:'#818cf8', ledS:'#818cf899', bodyT:'#eef0ff', bodyB:'#d0d4f8', airC:'#a5b4fc', glowC:'#4f46e5',  flapC:'rgba(60,60,180,.18)' },
    heat_cool: { label:'Termico',   icon:'♨',  ledC:'#f472b6', ledS:'#f472b699', bodyT:'#fdf2ff', bodyB:'#f0c8f0', airC:'#f9a8d4', glowC:'#db2777',  flapC:'rgba(180,40,120,.18)'},
    off:       { label:'Spento',    icon:'⏻',  ledC:'#22303e', ledS:'transparent', bodyT:'#f0f3f8', bodyB:'#d8dde8', airC:'#94a3b8', glowC:'#475569', flapC:'rgba(0,0,0,.18)'     },
  };
  function mDef(m) { return MODES[m] || MODES.off; }

  const FAN_LBL = { auto:'Auto', low:'Bassa', medium:'Media', high:'Alta', turbo:'Turbo', quiet:'Silenziosa', 'on':'On' };

  /* ── Flusso d'aria (CSS animati) ── */
  function airStreams(rid, airC, isActive) {
    if (!isActive) return '';
    const streams = [
      [3,72,0,2.2],[16,56,0.38,1.9],[7,78,0.72,2.4],[24,62,1.15,2.0],[12,50,0.55,1.85],
      [30,68,1.45,2.45],[5,60,0.92,1.75],[20,74,0.2,2.3],[27,58,1.65,2.05],[10,65,1.85,1.65],
    ];
    return streams.map(function(s) {
      return '<div style="position:absolute;left:'+s[0]+'%;width:'+s[1]+'%;height:2px;border-radius:99px;'
        +'background:linear-gradient(90deg,transparent,'+airC+'cc,'+airC+'88,transparent);'
        +'animation:'+rid+'air '+s[3]+'s ease-in-out '+s[2]+'s infinite;pointer-events:none"></div>';
    }).join('');
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = load(card);
    const rid = 'clm' + (card.id || Math.random().toString(36).slice(2,8));
    const entityId = c.entity || '';
    const st = clState(h, entityId);
    const mode  = st ? st.mode : 'off';
    const isOn  = mode !== 'off';
    const action = st ? st.action : 'idle';
    const isActive = isOn && ['cooling','heating','drying','fan'].includes(action);
    const swingOn  = st ? st.swing !== 'off' : false;
    const col = mDef(mode);

    const targetTemp  = (st && st.target  != null) ? parseFloat(st.target).toFixed(1)  : '--.-';
    const currentTemp = (st && st.current != null) ? parseFloat(st.current).toFixed(1) : null;
    const fanMode  = st ? st.fan : 'auto';
    const fanLabel = FAN_LBL[fanMode] || fanMode;
    const nm = c.name || (st ? st.friendlyName : 'Climatizzatore');

    const hvacModes  = (st ? st.hvacModes  : ['cool','heat','fan_only']).filter(function(m){return m!=='off';});
    const fanModes   = st ? st.fanModes  : ['auto','low','medium','high'];
    const swingModes = st ? st.swingModes : ['off','on'];
    const hasSwing   = swingModes.length > 1;
    const hasMultiFan = fanModes.length > 1;

    /* ── CSS ── */
    const css = '<style>'
      // air flow
      +'@keyframes '+rid+'air{0%{transform:translateY(0);opacity:0}14%{opacity:.72}82%{opacity:.45}100%{transform:translateY(64px);opacity:0}}'
      // flap
      +'@keyframes '+rid+'flap{0%,100%{transform:perspective(160px) rotateX(5deg)}50%{transform:perspective(160px) rotateX(46deg)}}'
      // LED pulse
      +'@keyframes '+rid+'led{0%,100%{opacity:1}46%{opacity:.75}}'
      // indicator glow
      +'@keyframes '+rid+'ind{0%,100%{box-shadow:0 0 6px '+col.glowC+'66,0 0 12px '+col.glowC+'33}50%{box-shadow:0 0 14px '+col.glowC+',0 0 28px '+col.glowC+'77}}'
      // fan spin
      +'@keyframes '+rid+'spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}'
      // button hover
      +'#'+rid+' .cl-btn{padding:7px 11px;border-radius:10px;border:none;cursor:pointer;font-size:12px;font-weight:700;transition:background .18s,box-shadow .18s;}'
      +'#'+rid+' .cl-btn:hover{filter:brightness(1.2);}'
      +'</style>';

    /* ── AC body ── */
    // Outer card bg same as other cards
    const acBody = '<div style="border-radius:14px;overflow:hidden;position:relative;'
      +'background:linear-gradient(170deg,'+col.bodyT+' 0%,'+col.bodyB+' 100%);'
      +'box-shadow:0 6px 28px rgba(0,0,0,.5),'
      +'inset 0 1px 0 rgba(255,255,255,.85),'
      +'inset 0 -1px 0 rgba(0,0,0,.12),'
      +'inset 2px 0 0 rgba(255,255,255,.4),'
      +'inset -2px 0 0 rgba(0,0,0,.06);">'

      // ── Top bar (thin indicator strip)
      +'<div style="height:6px;background:linear-gradient(90deg,rgba(0,0,0,.07),rgba(0,0,0,.04),rgba(0,0,0,.07));display:flex;align-items:center;padding:0 14px;gap:6px">'
      +'<div style="width:5px;height:5px;border-radius:50%;margin-top:0px;background:'+col.glowC+';flex-shrink:0;'+(isOn?'animation:'+rid+'ind 2.4s ease-in-out infinite;':'')+'box-shadow:'+(isOn?'0 0 8px '+col.glowC:'none')+'"></div>'
      +'</div>'

      // ── Main face: grille (left) + display (right)
      +'<div style="display:flex;height:80px">'

        // Intake grille — horizontal slots across 65% of width
        +'<div style="flex:1;position:relative;overflow:hidden">'
          // Grille lines via CSS gradient
          +'<div style="position:absolute;inset:0;'
          +'background:repeating-linear-gradient(0deg,transparent,transparent 5px,rgba(0,0,0,.1) 5px,rgba(0,0,0,.1) 6.5px);"></div>'
          // left-side sheen
          +'<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.35) 0%,transparent 55%);pointer-events:none"></div>'
          // subtle shadow cast from right panel
          +'<div style="position:absolute;top:0;right:0;bottom:0;width:18px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.06));pointer-events:none"></div>'
        +'</div>'

        // Vertical separator line
        +'<div style="width:1px;background:rgba(0,0,0,.1);flex-shrink:0"></div>'

        // Display panel (right 38% of width)
        +'<div style="width:38%;flex-shrink:0;background:rgba(0,0,0,.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 10px;position:relative">'
          // LED display frame
          +'<div style="background:#040d0a;border-radius:8px;padding:5px 12px;width:100%;box-sizing:border-box;'
          +'border:1px solid rgba(0,0,0,.5);box-shadow:inset 0 3px 8px rgba(0,0,0,.7),inset 0 0 20px rgba(0,0,0,.4)">'
            // Main temperature digits
            +'<div style="font-family:\'Courier New\',Courier,monospace;font-size:30px;font-weight:700;letter-spacing:2px;line-height:1;'
            +'color:'+(isOn?col.ledC:'#0d1a14')+';'
            +'text-shadow:'+(isOn?'0 0 14px '+col.ledS+',0 0 28px '+col.ledS:'none')+';'
            +(isOn?'animation:'+rid+'led 3s ease-in-out infinite;':'')
            +'">'+targetTemp+'</div>'
            +'<div style="font-size:9px;color:'+(isOn?col.airC:'#1a2e24')+';text-align:right;margin-top:1px;font-family:monospace;letter-spacing:1px">°C</div>'
          +'</div>'
          // Mode label under display
          +'<div style="font-size:10px;font-weight:700;color:rgba(0,0,0,.35);display:flex;align-items:center;gap:4px">'
            +'<span>'+col.icon+'</span>'
            +'<span>'+col.label+'</span>'
          +'</div>'
          // Fan speed indicator
          +'<div style="font-size:9px;color:rgba(0,0,0,.3);display:flex;align-items:center;gap:3px">'
            +'<span style="'+(mode==='fan_only'&&isOn?'animation:'+rid+'spin 1.4s linear infinite;display:inline-block':'')+'">💨</span>'
            +'<span>'+fanLabel+'</span>'
          +'</div>'
        +'</div>'

      +'</div>'// end main face

      // ── Output vent + oscillating flap
      +'<div style="position:relative;height:22px;'
      +'background:linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,.1));'
      +'border-top:1px solid rgba(0,0,0,.1);overflow:hidden">'
        // Vent slots (vertical lines)
        +'<div style="height:100%;background:repeating-linear-gradient(90deg,transparent,transparent 10px,rgba(0,0,0,.13) 10px,rgba(0,0,0,.13) 11px)"></div>'
        // Flap (animated when swing is on)
        +'<div style="position:absolute;left:10px;right:10px;bottom:2px;height:13px;'
        +'background:linear-gradient(180deg,rgba(255,255,255,.15),'+col.flapC+' 50%,rgba(0,0,0,.22));'
        +'border-radius:6px 6px 3px 3px;'
        +'transform-origin:50% 0%;'
        +'box-shadow:0 2px 6px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.3);'
        +(swingOn&&isOn?'animation:'+rid+'flap 2.5s ease-in-out infinite;':'')
        +'"></div>'
      +'</div>'

    +'</div>'; // end ac body

    /* ── Current room temp indicator (above card) ── */
    const tempBadge = currentTemp
      ? '<div style="font-size:11px;font-weight:700;color:#94a3b8;background:rgba(255,255,255,.06);padding:3px 9px;border-radius:99px;border:1px solid rgba(255,255,255,.1);flex-shrink:0">🌡 '+currentTemp+'°C</div>'
      : '';

    /* ── Air flow container ── */
    const airSection = '<div style="position:relative;height:'+(isActive?'62px':'10px')+';overflow:hidden;transition:height .5s ease;pointer-events:none">'
      +airStreams(rid, col.airC, isActive)
      +'</div>';

    /* ── Controls ── */
    function btn(extra, content) {
      return '<button class="cl-btn" '+extra+'>'+content+'</button>';
    }
    const powerStyle = 'background:'+(isOn?col.glowC+'44':'rgba(255,255,255,.08)')+';color:'+(isOn?col.ledC:'#64748b')+';border:1px solid '+(isOn?col.glowC+'66':'rgba(255,255,255,.1)')+';box-shadow:'+(isOn?'0 0 12px '+col.glowC+'44':'none');
    const powerBtn = btn('data-cid="'+entityId+'" data-action="power" style="'+powerStyle+'"', isOn ? '⏻ ON' : '⏻ OFF');

    const modeBtns = hvacModes.map(function(m) {
      const mc = mDef(m), active = (mode === m);
      return btn('data-cid="'+entityId+'" data-action="mode" data-mode="'+m+'" style="background:'+(active?mc.glowC+'55':'rgba(255,255,255,.07)')+';color:'+(active?mc.ledC:'#64748b')+';border:1px solid '+(active?mc.glowC+'66':'rgba(255,255,255,.1)')+';font-size:15px;box-shadow:'+(active?'0 0 12px '+mc.glowC+'66':'none')+'"', mc.icon);
    }).join('');

    const tempCtrl = '<div style="display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.06);border-radius:12px;padding:5px 10px;border:1px solid rgba(255,255,255,.1);margin-left:auto">'
      +btn('data-cid="'+entityId+'" data-action="temp-down" style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.1);color:#e2e8f0;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0"', '−')
      +'<div style="font-size:21px;font-weight:800;min-width:54px;text-align:center;color:'+(isOn?col.ledC:'#334155')+';text-shadow:'+(isOn?'0 0 10px '+col.glowC:'none')+'">'+(isOn?targetTemp+'°':'—')+'</div>'
      +btn('data-cid="'+entityId+'" data-action="temp-up" style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.1);color:#e2e8f0;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0"', '+')
      +'</div>';

    const row2 = '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
      +(hasMultiFan ? btn('data-cid="'+entityId+'" data-action="fan" style="background:rgba(255,255,255,.07);color:#94a3b8;border:1px solid rgba(255,255,255,.1)"',
          '<span style="'+(mode==='fan_only'&&isOn?'animation:'+rid+'spin 1.4s linear infinite;display:inline-block':'')+' ">💨</span> '+fanLabel) : '')
      +(hasSwing ? btn('data-cid="'+entityId+'" data-action="swing" style="background:'+(swingOn?col.glowC+'44':'rgba(255,255,255,.07)')+';color:'+(swingOn?col.ledC:'#94a3b8')+';border:1px solid '+(swingOn?col.glowC+'55':'rgba(255,255,255,.1)')+')', '⇅ Oscillazione') : '')
      +'</div>';

    return css
      +'<div id="'+rid+'" style="position:relative;width:100%;height:100%;min-height:260px;border-radius:18px;'
      +'padding:14px;box-sizing:border-box;font-family:system-ui,sans-serif;color:#e8ebf5;'
      +'display:flex;flex-direction:column;gap:9px;overflow:hidden;'
      +'background:linear-gradient(150deg,#0c1322 0%,#0a0f1c 60%,#0c1626 100%);'
      +'border:1px solid rgba(99,102,241,.22);box-shadow:0 10px 40px rgba(0,0,0,.45);">'

        // header
        +'<div style="display:flex;align-items:center;gap:8px">'
          +'<div style="flex:1;font-size:18px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+nm+'</div>'
          +tempBadge
        +'</div>'

        +acBody
        +airSection

        // controls row 1: power + modes + temp
        +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
          +powerBtn
          +modeBtns
          +tempCtrl
        +'</div>'

        +row2

      +'</div>';
  }

  /* ── MOUNT: event delegation ── */
  function mount(card, hass, el) {
    if (el._clmBound) return; el._clmBound = true;
    el.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.stopPropagation();
      const h = H(), c = load(card);
      const entityId = btn.getAttribute('data-cid') || c.entity || '';
      if (!entityId) return;
      const st = clState(h, entityId);
      const action = btn.getAttribute('data-action');

      if (action === 'power') {
        const isOn = st && st.mode !== 'off';
        if (isOn) {
          callSvc('climate', 'turn_off', { entity_id: entityId });
        } else {
          callSvc('climate', 'set_hvac_mode', { entity_id: entityId, hvac_mode: c.lastMode || 'cool' });
        }
      } else if (action === 'mode') {
        const m = btn.getAttribute('data-mode');
        callSvc('climate', 'set_hvac_mode', { entity_id: entityId, hvac_mode: m });
        const sv = load(card); sv.lastMode = m; save(card, sv);
      } else if (action === 'temp-up' || action === 'temp-down') {
        if (!st) return;
        const step = parseFloat(st.step) || 0.5;
        const cur  = parseFloat(st.target) || 22;
        const nxt  = action === 'temp-up' ? Math.min(st.max, cur+step) : Math.max(st.min, cur-step);
        callSvc('climate', 'set_temperature', { entity_id: entityId, temperature: Math.round(nxt / step) * step });
      } else if (action === 'fan') {
        if (!st) return;
        const modes = st.fanModes, idx = modes.indexOf(st.fan);
        callSvc('climate', 'set_fan_mode', { entity_id: entityId, fan_mode: modes[(idx+1) % modes.length] });
      } else if (action === 'swing') {
        if (!st) return;
        const sm = st.swingModes;
        const next = st.swing === 'off' ? (sm.find(function(m){return m!=='off';})||'on') : 'off';
        callSvc('climate', 'set_swing_mode', { entity_id: entityId, swing_mode: next });
      }
    });
  }

  function update(card, hass, el) {
    try { el.innerHTML = render(card); el._clmBound = false; mount(card, hass, el); } catch (e) {}
  }

  /* ── CONFIG POPUP ── */
  function openCfg(card, el) {
    const h = H(), c = load(card);
    const states = (h && h.states) || {};
    const allIds = Object.keys(states).sort();
    const climIds = allIds.filter(function(id){return id.startsWith('climate.');});
    const stInp = 'width:100%;padding:9px 11px;border-radius:10px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:10;max-height:180px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 10px 10px;display:none';
    const stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stBase = 'width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:13px;box-sizing:border-box';

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.78);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML = '<div style="width:min(420px,94vw);background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9">'
      +'<div style="font-size:16px;font-weight:800;margin-bottom:14px">❄️ Configura Climatizzatore</div>'
      +'<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome visualizzato</label><input id="cl-name" type="text" value="'+(c.name||'').replace(/"/g,'&quot;')+'" placeholder="es. Salotto, Camera da letto…" style="'+stBase+'"></div>'
      +'<div style="margin-bottom:10px;position:relative"><label style="'+stLbl+'">Entità climatizzatore <span style="font-weight:400;color:#475569;font-family:monospace;text-transform:none">climate.xxx</span></label>'
      +'<input id="cl-ent" type="text" value="'+(c.entity||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="Clicca o scrivi per filtrare…" style="'+stInp+'">'
      +'<div id="cl-ent-d" style="'+stDrop+'"></div></div>'
      +'<div style="display:flex;gap:10px;margin-top:16px">'
      +'<button id="cl-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>'
      +'<button id="cl-save" style="flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>'
      +'</div></div>';
    document.body.appendChild(ov);
    const close = function(){try{document.body.removeChild(ov);}catch(e){}};
    ov.addEventListener('click', function(e){if(e.target===ov) close();});

    const inp = ov.querySelector('#cl-ent'), drop = ov.querySelector('#cl-ent-d');
    function showDrop() {
      var q = inp.value.toLowerCase().trim();
      var hits = (q
        ? allIds.filter(function(id){return id.toLowerCase().includes(q)||(((states[id]||{}).attributes||{}).friendly_name||'').toLowerCase().includes(q);})
        : climIds
      ).slice(0,50);
      if (!hits.length) { drop.style.display='none'; return; }
      drop.style.display = 'block';
      drop.innerHTML = hits.map(function(id){
        var fn = (((states[id]||{}).attributes)||{}).friendly_name||'';
        return '<div data-pick="'+id+'" style="padding:5px 11px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)">'
          +'<span style="color:#e2e8f0">'+id+'</span>'+(fn?'<span style="color:#475569;margin-left:7px;font-family:system-ui;font-size:10px">'+fn+'</span>':'')+'</div>';
      }).join('');
      drop.querySelectorAll('[data-pick]').forEach(function(row){
        row.addEventListener('mousedown',function(ev){ev.preventDefault();inp.value=row.getAttribute('data-pick');drop.style.display='none';});
        row.addEventListener('mouseover',function(){row.style.background='rgba(255,255,255,.08)';});
        row.addEventListener('mouseout', function(){row.style.background='';});
      });
    }
    inp.addEventListener('focus', showDrop);
    inp.addEventListener('input', showDrop);
    inp.addEventListener('blur',  function(){setTimeout(function(){drop.style.display='none';},200);});
    ov.querySelector('#cl-cancel').addEventListener('click', close);
    ov.querySelector('#cl-save').addEventListener('click', function(){
      save(card, { name: ov.querySelector('#cl-name').value.trim(), entity: inp.value.trim() });
      close();
      try { el.innerHTML = render(card); el._clmBound = false; mount(card, H(), el); } catch(e) {}
    });
  }

  var CARD = {
    id:'clima-card', name:'Climatizzatore', icon:'❄️', version:'1.0',
    desc:'Unità split murale realistica: display LED, alette oscillanti animate, flusso aria, tutti i modi (cool/heat/fan/dry/auto).',
    colSpan:2, rowSpan:3,
    render:render, mount:mount, update:update, configure:openCfg,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: clima-card v1.0'); } catch(e) {}
})();
