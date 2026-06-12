/* frarik-version: 2.1 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_clima_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }

  function clState(h, id) {
    if (!id || !h || !h.states || !h.states[id]) return null;
    const s = h.states[id], a = s.attributes || {};
    return {
      mode:       s.state,
      action:     a.hvac_action || 'idle',
      target:     a.temperature,
      current:    a.current_temperature,
      fan:        a.fan_mode   || 'auto',
      swing:      a.swing_mode || 'off',
      min:        a.min_temp   || 16,
      max:        a.max_temp   || 30,
      step:       a.target_temp_step || 1,
      hvacModes:  a.hvac_modes   || ['off','cool','heat'],
      fanModes:   a.fan_modes    || ['auto','low','medium','high'],
      swingModes: a.swing_modes  || ['off','on'],
      friendlyName: a.friendly_name || id,
    };
  }

  function callSvc(domain, service, data) {
    try { const h = H(); if (h && h.callService) h.callService(domain, service, data); } catch (e) {}
  }

  const HVAC_LBL = { cool:'Raffredda', heat:'Scalda', fan_only:'Ventola', dry:'Deumidifica', auto:'Auto', heat_cool:'Caldo/Freddo', off:'Spento' };
  const HVAC_ICO = { cool:'❄', heat:'🔥', fan_only:'💨', dry:'💧', auto:'⟳', heat_cool:'♨', off:'⏻' };
  // Colori aria: azzurro=freddo, rosso=caldo, verde=deumid
  const HVAC_COL = { cool:'#38bdf8', heat:'#f87171', fan_only:'#94a3b8', dry:'#34d399', auto:'#a78bfa', heat_cool:'#fb923c', off:'#475569' };
  const FAN_LBL  = { auto:'Auto', low:'Bassa', medium:'Media', high:'Alta', turbo:'Turbo', quiet:'Silenziosa', 'off':'Ferma', 'on':'Attiva' };
  const SWING_LBL= { 'off':'Off', 'on':'On', both:'Tutto', vertical:'Verticale', horizontal:'Orizzontale' };

  function mColor(m) { return HVAC_COL[m] || '#475569'; }
  function mLabel(m) { return HVAC_LBL[m] || m; }
  function mIcon(m)  { return HVAC_ICO[m] || '⏻'; }
  function fLabel(m) { return FAN_LBL[m]   || m; }
  function sLabel(m) { return SWING_LBL[m] || m; }

  /* ── Air flow streams (visibili quando isOn) ── */
  function airStreams(rid, col, show) {
    if (!show) return '';
    const def = [
      [3,74,0,2.2],[15,58,0.38,1.9],[7,80,0.72,2.4],[23,64,1.15,2.0],
      [11,52,0.55,1.85],[29,70,1.45,2.45],[5,62,0.92,1.75],[19,76,0.2,2.3],
      [26,60,1.65,2.05],[9,67,1.85,1.65],
    ];
    return def.map(function(s) {
      return '<div style="position:absolute;left:'+s[0]+'%;width:'+s[1]+'%;height:2px;border-radius:99px;'
        +'background:linear-gradient(90deg,transparent,'+col+'cc,'+col+'88,transparent);'
        +'animation:'+rid+'air '+s[3]+'s ease-in-out '+s[2]+'s infinite;pointer-events:none"></div>';
    }).join('');
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = load(card);
    const rid = 'clm' + (card.id || Math.random().toString(36).slice(2,8));
    const entityId = c.entity || '';
    const st = clState(h, entityId);
    const mode    = st ? st.mode   : 'off';
    const isOn    = mode !== 'off';
    const swingOn = st ? st.swing !== 'off' : false;
    const mCol    = mColor(mode);

    const targetTemp  = (st && st.target  != null) ? parseFloat(st.target).toFixed(1)  : '--.-';
    const currentTemp = (st && st.current != null) ? parseFloat(st.current).toFixed(1) : null;
    const fanMode   = st ? st.fan   : 'auto';
    const swingMode = st ? st.swing : 'off';
    const nm = c.name || (st ? st.friendlyName : 'Climatizzatore');

    const hvacModes  = st ? st.hvacModes  : ['off','cool','heat'];
    const fanModes   = st ? st.fanModes   : ['auto','low','medium','high'];
    const swingModes = st ? st.swingModes : ['off','on'];

    /* ── CSS animations ── */
    const css = '<style>'
      // aria scende dal basso
      +'@keyframes '+rid+'air{0%{transform:translateY(0);opacity:0}14%{opacity:.72}82%{opacity:.45}100%{transform:translateY(68px);opacity:0}}'
      // aletta: ruota attorno al bordo superiore, perspective 3D
      +'@keyframes '+rid+'flap{0%,100%{transform:rotateX(5deg)}50%{transform:rotateX(52deg)}}'
      // LED pulse
      +'@keyframes '+rid+'led{0%,100%{opacity:1}46%{opacity:.7}}'
      // indicatore glow
      +'@keyframes '+rid+'ind{0%,100%{box-shadow:0 0 5px '+mCol+'66}50%{box-shadow:0 0 14px '+mCol+',0 0 28px '+mCol+'66}}'
      // ventola spin
      +'@keyframes '+rid+'spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}'
      +'#'+rid+' .cb{padding:5px 10px;border-radius:8px;border:none;cursor:pointer;font-size:11px;font-weight:700;transition:all .18s;}'
      +'#'+rid+' .cb:hover{filter:brightness(1.3);}'
      +'</style>';

    /* ── AC body ── */
    // Il corpo è un wrapper con position:relative e overflow:visible
    // così la aletta può sporgere senza essere tagliata
    const acBody = ''
      +'<div style="position:relative">'

        // Guscio bianco principale (overflow:hidden solo per i bordi arrotondati del corpo)
        +'<div style="border-radius:14px;overflow:hidden;'
        +'background:linear-gradient(170deg,#ffffff 0%,#f2f5fb 70%,#e8edf6 100%);'
        +'box-shadow:0 6px 28px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 5px rgba(0,0,0,.1),inset 2px 0 rgba(255,255,255,.6),inset -2px 0 rgba(0,0,0,.04);">'

          // ── Top indicator bar
          +'<div style="display:flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(0,0,0,.04);border-bottom:1px solid rgba(0,0,0,.06)">'
            +'<div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;'
              +'background:'+(isOn?mCol:'#9ca3af')+';'
              +(isOn?'animation:'+rid+'ind 2.2s ease-in-out infinite;box-shadow:0 0 8px '+mCol+';':'')
            +'"></div>'
            +'<div style="flex:1;font-size:11px;font-weight:700;color:rgba(0,0,0,.45);text-transform:uppercase;letter-spacing:.06em">'+(isOn?mIcon(mode)+' '+mLabel(mode):'SPENTO')+'</div>'
            +(currentTemp?'<div style="font-size:11px;font-weight:700;color:rgba(0,0,0,.45);background:rgba(0,0,0,.06);padding:2px 8px;border-radius:99px">🌡 '+currentTemp+'°C</div>':'')
          +'</div>'

          // ── Main face: area sinistra (bianca pulita) + pannello display destra
          +'<div style="display:flex;height:82px">'

            // Area sinistra BIANCA PULITA - niente righe, niente texture
            +'<div style="flex:1;position:relative;background:linear-gradient(90deg,rgba(255,255,255,.6),rgba(240,245,255,.4));overflow:hidden">'
              // Solo un leggero riflesso/sfumatura interna per profondità
              +'<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.5) 0%,transparent 70%);pointer-events:none"></div>'
              +'<div style="position:absolute;top:0;right:0;bottom:0;width:16px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.05));pointer-events:none"></div>'
            +'</div>'

            // Separatore verticale
            +'<div style="width:1px;background:rgba(0,0,0,.08);flex-shrink:0"></div>'

            // Pannello display (destra)
            +'<div style="width:140px;flex-shrink:0;background:rgba(0,0,0,.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 10px">'
              // LED display frame
              +'<div style="background:#060e0b;border-radius:9px;padding:5px 14px;width:100%;box-sizing:border-box;'
              +'border:1px solid rgba(0,0,0,.45);'
              +'box-shadow:inset 0 3px 10px rgba(0,0,0,.65),inset 0 0 22px rgba(0,0,0,.35)">'
                +'<div style="font-family:\'Courier New\',Courier,monospace;font-size:32px;font-weight:700;letter-spacing:2px;line-height:1;text-align:center;'
                +'color:'+(isOn?mCol:'#0d1a12')+';'
                +'text-shadow:'+(isOn?'0 0 14px '+mCol+',0 0 30px '+mCol+'66':'none')+';'
                +(isOn?'animation:'+rid+'led 3s ease-in-out infinite;':'')
                +'">'+targetTemp+'</div>'
                +'<div style="font-size:9px;font-family:monospace;letter-spacing:1px;text-align:right;margin-top:2px;color:'+(isOn?mCol+'99':'#0d1a12')+'">°C</div>'
              +'</div>'
              // Ventola
              +'<div style="font-size:9px;font-weight:700;color:rgba(0,0,0,.35);display:flex;align-items:center;gap:3px">'
                +'<span style="'+(mode==='fan_only'&&isOn?'animation:'+rid+'spin 1.4s linear infinite;display:inline-block':'')+'">💨</span>'
                +fLabel(fanMode)
              +'</div>'
            +'</div>'

          +'</div>' // end main face

          // ── Area uscita aria (parte bassa del corpo, senza aletta qui)
          +'<div style="height:16px;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.08));border-top:1px solid rgba(0,0,0,.06)"></div>'

        +'</div>' // fine guscio overflow:hidden

        // ── Aletta (FUORI dal guscio per evitare il clipping dell'overflow:hidden)
        // Il container imposta solo la perspective, l'animazione è solo sull'elemento interno
        +'<div style="position:absolute;bottom:-8px;left:16px;right:16px;height:14px;perspective:220px;perspective-origin:50% 0%">'
          +'<div style="width:100%;height:100%;'
          +'background:linear-gradient(180deg,rgba(255,255,255,.25) 0%,rgba(200,212,225,.92) 40%,rgba(155,172,195,.85) 100%);'
          +'border-radius:5px 5px 4px 4px;'
          +'box-shadow:0 4px 10px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.6);'
          +'transform-origin:50% 0%;'
          +(swingOn&&isOn?'animation:'+rid+'flap 2.5s ease-in-out infinite;':'')
          +'"></div>'
        +'</div>'

      +'</div>'; // fine wrapper position:relative

    /* ── Flusso d'aria (visibile quando isOn) ── */
    const airSection = '<div style="position:relative;height:'+(isOn?'68px':'10px')+';overflow:hidden;transition:height .6s ease;margin-top:6px;pointer-events:none">'
      +airStreams(rid, mCol, isOn)
    +'</div>';

    /* ── Selector buttons ── */
    function selBtn(eId, action, val, label, active, col2) {
      const st2 = active
        ? 'background:'+col2+'33;color:'+col2+';border:1px solid '+col2+'55;box-shadow:0 0 9px '+col2+'44;'
        : 'background:rgba(255,255,255,.07);color:#64748b;border:1px solid rgba(255,255,255,.1);';
      return '<button class="cb" data-cid="'+eId+'" data-action="'+action+'" data-val="'+val+'" style="'+st2+'">'+label+'</button>';
    }

    // Temperature row
    const tempRow = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,.06);border-radius:13px;padding:7px 14px;border:1px solid rgba(255,255,255,.1)">'
      +'<button class="cb" data-cid="'+entityId+'" data-action="temp-down" style="width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.1);color:#e2e8f0;font-size:20px;font-weight:700;padding:0;display:flex;align-items:center;justify-content:center">−</button>'
      +'<div style="font-size:26px;font-weight:800;min-width:80px;text-align:center;color:'+(isOn?mCol:'#334155')+';text-shadow:'+(isOn?'0 0 10px '+mCol:'none')+';">'+(isOn?targetTemp+'°':'—')+'</div>'
      +'<button class="cb" data-cid="'+entityId+'" data-action="temp-up" style="width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.1);color:#e2e8f0;font-size:20px;font-weight:700;padding:0;display:flex;align-items:center;justify-content:center">+</button>'
    +'</div>';

    // Mode
    const modeRow = '<div style="display:flex;flex-direction:column;gap:4px">'
      +'<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.07em">Modalità</div>'
      +'<div style="display:flex;gap:5px;flex-wrap:wrap">'
      +hvacModes.map(function(m){ return selBtn(entityId,'mode',m,mIcon(m)+' '+mLabel(m),mode===m,mColor(m)); }).join('')
      +'</div></div>';

    // Fan
    const fanRow = fanModes.length>1
      ? '<div style="display:flex;flex-direction:column;gap:4px">'
        +'<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.07em">Ventola</div>'
        +'<div style="display:flex;gap:5px;flex-wrap:wrap">'
        +fanModes.map(function(m){ return selBtn(entityId,'fan',m,fLabel(m),fanMode===m,'#38bdf8'); }).join('')
        +'</div></div>' : '';

    // Swing
    const swingRow = swingModes.length>1
      ? '<div style="display:flex;flex-direction:column;gap:4px">'
        +'<div style="font-size:9px;font-weight:800;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.07em">Oscillazione</div>'
        +'<div style="display:flex;gap:5px;flex-wrap:wrap">'
        +swingModes.map(function(m){ return selBtn(entityId,'swing',m,sLabel(m),swingMode===m,'#a78bfa'); }).join('')
        +'</div></div>' : '';

    return css
      +'<div id="'+rid+'" style="position:relative;width:100%;height:100%;min-height:260px;border-radius:18px;'
      +'padding:14px;box-sizing:border-box;font-family:system-ui,sans-serif;color:#e8ebf5;'
      +'display:flex;flex-direction:column;gap:9px;overflow:hidden;'
      +'background:linear-gradient(150deg,#0c1322 0%,#0a0f1c 60%,#0c1626 100%);'
      +'border:1px solid rgba(99,102,241,.22);box-shadow:0 10px 40px rgba(0,0,0,.45);">'
        // Nome centrato
        +'<div style="text-align:center;font-size:20px;font-weight:800;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+nm+'</div>'
        +acBody
        +airSection
        +tempRow
        +modeRow
        +(fanRow?fanRow:'')
        +(swingRow?swingRow:'')
      +'</div>';
  }

  /* ── MOUNT — debounce 700ms per evitare bip ripetuti ── */
  function mount(card, hass, el) {
    if (el._clmBound) return; el._clmBound = true;
    el.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.stopPropagation();
      e.preventDefault();

      // Debounce: ignora click ravvicinati (evita bip multipli)
      const now = Date.now();
      if (now - (el._lastSvc || 0) < 700) return;
      el._lastSvc = now;

      const h = H(), c = load(card);
      const entityId = btn.getAttribute('data-cid') || c.entity || '';
      if (!entityId) return;
      const st = clState(h, entityId);
      const action = btn.getAttribute('data-action');
      const val    = btn.getAttribute('data-val');

      if (action === 'mode') {
        if (val === 'off') {
          callSvc('climate', 'turn_off', { entity_id: entityId });
        } else {
          callSvc('climate', 'set_hvac_mode', { entity_id: entityId, hvac_mode: val });
          const sv = load(card); sv.lastMode = val; save(card, sv);
        }
      } else if (action === 'fan') {
        callSvc('climate', 'set_fan_mode', { entity_id: entityId, fan_mode: val });
      } else if (action === 'swing') {
        callSvc('climate', 'set_swing_mode', { entity_id: entityId, swing_mode: val });
      } else if (action === 'temp-up' || action === 'temp-down') {
        if (!st) return;
        const step = parseFloat(st.step) || 1;
        const cur  = parseFloat(st.target) || 22;
        const nxt  = action === 'temp-up' ? Math.min(st.max, cur+step) : Math.max(st.min, cur-step);
        callSvc('climate', 'set_temperature', { entity_id: entityId, temperature: Math.round(nxt/step)*step });
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
    const stLbl  = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stBase = 'width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:13px;box-sizing:border-box';

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.78);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML = '<div style="width:min(440px,94vw);background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9">'
      +'<div style="font-size:16px;font-weight:800;margin-bottom:14px">❄️ Configura Climatizzatore</div>'
      +'<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome (centrato nella card)</label>'
      +'<input id="cl-name" type="text" value="'+(c.name||'').replace(/"/g,'&quot;')+'" placeholder="es. CLIMA SALOTTO" style="'+stBase+'"></div>'
      +'<div style="margin-bottom:10px;position:relative"><label style="'+stLbl+'">Entità clima <span style="font-weight:400;color:#475569;font-family:monospace;text-transform:none;letter-spacing:0">climate.xxx</span></label>'
      +'<input id="cl-ent" type="text" value="'+(c.entity||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="Clicca o scrivi per filtrare…" style="'+stInp+'">'
      +'<div id="cl-ent-d" style="'+stDrop+'"></div></div>'
      +'<div style="display:flex;gap:10px;margin-top:16px">'
      +'<button id="cl-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>'
      +'<button id="cl-save" style="flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>'
      +'</div></div>';
    document.body.appendChild(ov);
    const close = function(){try{document.body.removeChild(ov);}catch(e){}};
    ov.addEventListener('click', function(e){if(e.target===ov) close();});

    var inp = ov.querySelector('#cl-ent'), drop = ov.querySelector('#cl-ent-d');
    function showDrop(){
      var q = inp.value.toLowerCase().trim();
      var hits = (q
        ? allIds.filter(function(id){return id.toLowerCase().includes(q)||(((states[id]||{}).attributes||{}).friendly_name||'').toLowerCase().includes(q);})
        : climIds
      ).slice(0,50);
      if(!hits.length){drop.style.display='none';return;}
      drop.style.display='block';
      drop.innerHTML=hits.map(function(id){
        var fn=(((states[id]||{}).attributes)||{}).friendly_name||'';
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
    inp.addEventListener('blur', function(){setTimeout(function(){drop.style.display='none';},200);});
    ov.querySelector('#cl-cancel').addEventListener('click', close);
    ov.querySelector('#cl-save').addEventListener('click', function(){
      save(card,{name:ov.querySelector('#cl-name').value.trim(),entity:inp.value.trim()});
      close();
      try{el.innerHTML=render(card);el._clmBound=false;mount(card,H(),el);}catch(e){}
    });
  }

  var CARD = {
    id:'clima-card', name:'Climatizzatore', icon:'❄️', version:'2.1',
    desc:'Split murale: corpo bianco pulito, display LED, aletta 3D animata, flusso aria colorato, selettori da attributi entità.',
    colSpan:2, rowSpan:4,
    render:render, mount:mount, update:update, configure:openCfg,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try{console.log('[FratechStore] Card registrata: clima-card v2.1');}catch(e){}
})();
