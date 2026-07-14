(function () {
  'use strict';
  const ID = 'letpot-max';
  const LS = id => 'frarik_letpot_' + (id || 'x');

  function H() { try { const h = window.frarikHass?.(); if (h?.states) return h; } catch(e){} return null; }
  function liveH(raw) { return H() || (raw?.states ? raw : null); }
  function stateOf(h, id) { if (!h || !id) return 'unknown'; return h?.states?.[id]?.state || 'unknown'; }
  function attrOf(h, id, attr) { return h?.states?.[id]?.attributes?.[attr]; }
  function eh(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function isOn(s) { return s==='on'||s==='true'||s==='1'; }

  const _mounted = new WeakSet();
  const _lastStage = {};

  function getEnt(card) { try { return JSON.parse(localStorage.getItem(LS(card.id))||'{}'); } catch(e){ return {}; } }
  function saveEnt(card, ent) { try { localStorage.setItem(LS(card.id), JSON.stringify(ent)); } catch(e){} }

  /* ── Servizi HA ── */
  function svc(domain, service, data) {
    try {
      const h = H();
      if (h?.callService) return h.callService(domain, service, data);
    } catch(e) { console.warn('[LetpotMax] callService:', e); }
  }
  function toggleEnt(entityId) {
    if (!entityId || entityId==='unknown') return;
    const domain = entityId.split('.')[0];
    const svcDomain = { input_boolean:'input_boolean', switch:'switch', automation:'automation' }[domain] || 'switch';
    const s = stateOf(H(), entityId);
    svc(svcDomain, s==='on'?'turn_off':'turn_on', { entity_id: entityId });
  }
  function setTimeEnt(entityId, hhmm) {
    if (!entityId || entityId==='unknown') return;
    const t = hhmm.length===5 ? hhmm+':00' : hhmm;
    const domain = entityId.split('.')[0];
    if (domain==='input_datetime') svc('input_datetime','set_datetime',{ entity_id:entityId, time:t });
    else svc('time','set_value',{ entity_id:entityId, time:t });
  }
  function setSelectEnt(entityId, option) {
    if (!entityId || entityId==='unknown') return;
    const domain = entityId.split('.')[0];
    if (domain==='input_select') svc('input_select','select_option',{ entity_id:entityId, option });
    else svc('select','select_option',{ entity_id:entityId, option });
  }
  function setNumberEnt(entityId, value) {
    if (!entityId || entityId==='unknown') return;
    const domain = entityId.split('.')[0];
    if (domain==='input_number') svc('input_number','set_value',{ entity_id:entityId, value });
    else svc('number','set_value',{ entity_id:entityId, value });
  }

  /* ── Fasi di crescita ── */
  const STAGES = [
    { name:'Germinazione', icon:'🌱', color:'#86efac' },
    { name:'Piantina',     icon:'🌿', color:'#4ade80' },
    { name:'Vegetativa',   icon:'🍃', color:'#22c55e' },
    { name:'Crescita',     icon:'🌿', color:'#16a34a' },
    { name:'Pre-raccolta', icon:'🌾', color:'#facc15' },
    { name:'Raccolta',     icon:'🥬', color:'#4ade80' },
  ];
  function getStage(ageStr) {
    const d = parseInt(ageStr)||0;
    return d<=3?0 : d<=10?1 : d<=21?2 : d<=40?3 : d<=60?4 : 5;
  }

  /* ── Barra ciclo pompa 30min ── */
  function pumpCycleBar() {
    const CYCLE = 30*60*1000;
    const remaining = CYCLE - (Date.now() % CYCLE);
    const pct = Math.round((remaining/CYCLE)*100);
    const min = Math.floor(remaining/60000);
    const sec = Math.floor((remaining%60000)/1000);
    const col = pct>60?'#4ade80':pct>25?'#facc15':'#f97316';
    return { pct, col, label:`${min}:${String(sec).padStart(2,'0')}` };
  }

  /* ── Piante SVG ── */
  function sproutSvg(i) {
    const v=(i%3)*2;
    return `<svg width="22" height="16" viewBox="0 0 22 16" style="flex-shrink:0">
      <line x1="11" y1="16" x2="11" y2="10" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="6" cy="9" rx="5.5" ry="2.5" fill="#86efac" opacity="0.92" transform="rotate(-28 6 9)"/>
      <ellipse cx="16" cy="${8+v}" rx="5.5" ry="2.5" fill="#4ade80" opacity="0.9" transform="rotate(28 16 ${8+v})"/>
    </svg>`;
  }
  function plantSvg(phase, idx, delay) {
    if(phase===0) return sproutSvg(idx);
    const heights=[0,26,44,62,80,94];
    const h=heights[phase];
    const ls=[0,9,12,15,18,21][phase];
    const cx=ls+5, W=cx*2;
    const sway=`animation:lp-sway ${2.5+delay*0.4}s ease-in-out ${(delay*0.6).toFixed(1)}s infinite;transform-origin:${cx}px ${h+8}px;flex-shrink:0;overflow:visible`;
    let s=`<svg width="${W}" height="${h+10}" viewBox="0 0 ${W} ${h+10}" style="${sway}">`;
    s+=`<line x1="${cx}" y1="${h+8}" x2="${cx}" y2="8" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round"/>`;
    for(let i=0;i<phase;i++){
      const ly=h+4-Math.round((i/Math.max(phase-1,1))*(h-8));
      const angle=22+i*4;
      const lf=['#16a34a','#22c55e','#15803d','#166534','#4ade80'][i%5];
      const rf=['#22c55e','#4ade80','#16a34a','#22c55e','#86efac'][i%5];
      s+=`<ellipse cx="${cx-Math.round(ls*0.55)}" cy="${ly}" rx="${ls}" ry="${Math.round(ls*0.38)}" fill="${lf}" opacity="0.92" transform="rotate(-${angle} ${cx-Math.round(ls*0.55)} ${ly})"/>`;
      s+=`<ellipse cx="${cx+Math.round(ls*0.55)}" cy="${ly-Math.round(ls*0.2)}" rx="${ls}" ry="${Math.round(ls*0.38)}" fill="${rf}" opacity="0.88" transform="rotate(${angle} ${cx+Math.round(ls*0.55)} ${ly-Math.round(ls*0.2)})"/>`;
    }
    if(phase>=5){
      const hr=Math.round(ls*0.95);
      s+=`<ellipse cx="${cx}" cy="9" rx="${hr}" ry="${Math.round(hr*1.15)}" fill="#bbf7d0" opacity="0.85"/>`;
      s+=`<ellipse cx="${cx-4}" cy="7" rx="${Math.round(hr*0.75)}" ry="${Math.round(hr*0.9)}" fill="#86efac" opacity="0.75"/>`;
      s+=`<ellipse cx="${cx+4}" cy="6" rx="${Math.round(hr*0.75)}" ry="${Math.round(hr*0.9)}" fill="#4ade80" opacity="0.72"/>`;
      s+=`<ellipse cx="${cx}" cy="5" rx="${Math.round(hr*0.55)}" ry="${Math.round(hr*0.65)}" fill="#d1fae5" opacity="0.6"/>`;
    } else if(phase>=4){
      const hr=Math.round(ls*0.8);
      s+=`<ellipse cx="${cx}" cy="8" rx="${hr}" ry="${Math.round(hr*1.1)}" fill="#86efac" opacity="0.88"/>`;
      s+=`<ellipse cx="${cx-3}" cy="6" rx="${Math.round(hr*0.7)}" ry="${Math.round(hr*0.85)}" fill="#4ade80" opacity="0.72"/>`;
    } else {
      const brx=Math.round(ls*0.45), bry=Math.round(ls*0.55);
      s+=`<ellipse cx="${cx}" cy="8" rx="${brx}" ry="${bry}" fill="#86efac" opacity="0.88"/>`;
    }
    s+='</svg>';
    return s;
  }

  /* ── LED Matrix ── */
  const LED_MAP=[
    ['R','B','R','B','R','B','R','B'],
    ['B','W','B','R','B','W','B','R'],
    ['R','B','R','B','W','B','R','B'],
    ['B','R','B','W','B','R','B','W'],
  ];
  const LED_COL={R:'#ff1a3c',B:'#2055ff',W:'#ffe9b0'};
  const LED_GLOW={R:'rgba(255,26,60,.85)',B:'rgba(32,85,255,.85)',W:'rgba(255,233,176,.6)'};

  function renderLedPanel(on, lightOnVal, lightOffVal, lightBr, modeOptions, currentMode, brMin, brMax) {
    const dotSize=7, cols=8, rows=4;
    let dots='';
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const t=LED_MAP[r][c];
      const anim=on?`box-shadow:0 0 ${t==='W'?5:9}px 2px ${LED_GLOW[t]};animation:lp-glow ${1.4+(c*r%3)*0.3}s ease-in-out ${(c*0.1).toFixed(1)}s infinite`:'opacity:0.12';
      dots+=`<div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${LED_COL[t]};${anim};flex-shrink:0"></div>`;
    }
    const btnBase='border:none;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0';
    const modeOpts = modeOptions.length
      ? modeOptions.map(o=>`<option value="${eh(o)}" ${o===currentMode?'selected':''}>${eh(o)}</option>`).join('')
      : (currentMode&&currentMode!=='unknown'?`<option value="${eh(currentMode)}" selected>${eh(currentMode)}</option>`:'<option value="">—</option>');

    return `
  <div style="background:${on?'linear-gradient(180deg,#1a0a2e,#120820)':'linear-gradient(180deg,#0a0a14,#080810)'};padding:8px 10px 6px;flex-shrink:0;position:relative;overflow:hidden">
    ${on?`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(180,30,255,0.22) 0%,rgba(100,20,200,0.08) 60%,transparent 100%)"></div>`:''}
    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;position:relative;z-index:1">${dots}</div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:5px;position:relative;z-index:1">
      <div style="font-size:9px;color:${on?'#e0b0ff':'rgba(255,255,255,.35)'}">${on?'💜 Full Spectrum ON':'⬛ Luce spenta'}</div>
      <div style="font-size:8px;color:rgba(255,255,255,.4)">✨ <span data-lp-bval>${lightBr!=='unknown'?lightBr:'—'}</span>/${brMax}</div>
    </div>
  </div>
  ${on?`<div style="height:20px;background:linear-gradient(180deg,rgba(180,30,255,0.14) 0%,transparent 100%);flex-shrink:0;pointer-events:none"></div>`:'<div style="height:4px;flex-shrink:0"></div>'}
  <!-- CONTROLLI LUCE -->
  <div style="background:rgba(0,0,0,.35);border-bottom:1px solid rgba(255,255,255,.06);padding:6px 10px;flex-shrink:0;display:flex;align-items:center;gap:6px">
    <span style="font-size:10px">🌅</span>
    <input type="time" data-lp-action="ton" value="${lightOnVal}" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:7px;color:#fff;font-size:9px;padding:3px 5px;color-scheme:dark;width:64px;flex-shrink:0">
    <span style="font-size:8px;color:rgba(255,255,255,.3)">→</span>
    <span style="font-size:10px">🌙</span>
    <input type="time" data-lp-action="toff" value="${lightOffVal}" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:7px;color:#fff;font-size:9px;padding:3px 5px;color-scheme:dark;width:64px;flex-shrink:0">
    <div style="flex:1"></div>
    <button data-lp-action="br-dn" style="${btnBase};width:22px;height:22px;background:rgba(255,255,255,.08);color:#fff;font-size:15px">−</button>
    <span style="font-size:11px;color:#fff;min-width:18px;text-align:center;font-weight:700" data-lp-bval2>${lightBr!=='unknown'?lightBr:'—'}</span>
    <button data-lp-action="br-up" style="${btnBase};width:22px;height:22px;background:rgba(255,255,255,.08);color:#fff;font-size:15px">+</button>
  </div>
  <div style="background:rgba(0,0,0,.2);padding:4px 10px;flex-shrink:0">
    <select data-lp-action="mode" style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#fff;font-size:10px;padding:4px 7px;color-scheme:dark;cursor:pointer">${modeOpts}</select>
  </div>`;
  }

  /* ── Stili ── */
  function injectStyles() {
    if(document.getElementById('lp-kf')) return;
    const s=document.createElement('style'); s.id='lp-kf';
    s.textContent=`
      @keyframes lp-wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes lp-bubble{0%{transform:translateY(0) scale(1);opacity:.55}80%{opacity:.15}100%{transform:translateY(-100px) scale(1.5);opacity:0}}
      @keyframes lp-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
      @keyframes lp-glow{0%,100%{opacity:.5;filter:brightness(.75)}50%{opacity:1;filter:brightness(1.5)}}
      @keyframes lp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes lp-ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.2);opacity:0}}
      [data-lp-action]:not(input):not(select){transition:opacity .12s,transform .08s}
      [data-lp-action]:not(input):not(select):active{opacity:.7;transform:scale(.93)}
    `;
    document.head.appendChild(s);
  }

  /* ── Valori live ── */
  function computeValues(card, rawHass) {
    const h=liveH(rawHass), e=getEnt(card);
    const power    = isOn(stateOf(h,e.powerEntity));
    const autoMode = isOn(stateOf(h,e.autoModeEntity));
    const pumpCycl = isOn(stateOf(h,e.pumpCyclingEntity));
    const pumpS    = stateOf(h,e.pumpEntity);
    const pumpRun  = pumpS==='on'||pumpS==='running';
    const pumpIsSwitch = e.pumpEntity?.split('.')?.[0]==='switch';
    const lightBr  = stateOf(h,e.lightBrightnessEntity);
    const lightOnT = stateOf(h,e.lightOnEntity);
    const lightOffT= stateOf(h,e.lightOffEntity);
    const currentMode= stateOf(h,e.lightModeEntity);
    const modeOptions= attrOf(h,e.lightModeEntity,'options')||[];
    const brMin    = parseFloat(attrOf(h,e.lightBrightnessEntity,'min'))||1;
    const brMax    = parseFloat(attrOf(h,e.lightBrightnessEntity,'max'))||10;
    const brStep   = parseFloat(attrOf(h,e.lightBrightnessEntity,'step'))||1;
    const lowWater = isOn(stateOf(h,e.lowWaterEntity));
    const lowNutr  = isOn(stateOf(h,e.lowNutrientsEntity));
    const refillErr= isOn(stateOf(h,e.refillErrorEntity));
    const waterPct = Math.min(100,Math.max(0,parseFloat(stateOf(h,e.waterLevelEntity))||0));
    const tempVal  = parseFloat(stateOf(h,e.tempEntity))||0;
    const plantsAge= stateOf(h,e.plantsAgeEntity);
    const now=new Date(), nowMin=now.getHours()*60+now.getMinutes();
    function parseT(t){ if(!t||t==='unknown') return null; const p=String(t).split(':'); return parseInt(p[0]||0)*60+parseInt(p[1]||0); }
    const onMin=parseT(lightOnT), offMin=parseT(lightOffT);
    let lightActive=false;
    if(onMin!==null&&offMin!==null) lightActive=onMin<offMin?(nowMin>=onMin&&nowMin<offMin):(nowMin>=onMin||nowMin<offMin);
    const lightOnVal= lightOnT!=='unknown'?String(lightOnT).slice(0,5):'';
    const lightOffVal=lightOffT!=='unknown'?String(lightOffT).slice(0,5):'';
    const tempCol  = tempVal>30?'#f97316':tempVal>26?'#4ade80':'#60a5fa';
    const waterCol = waterPct<30?'#f97316':waterPct<60?'#facc15':'#4ade80';
    const tankH    = 120;
    const waterH   = Math.round(tankH*(waterPct/100)*0.78+tankH*0.05);
    const stage    = getStage(plantsAge);
    const cb       = pumpCycl ? pumpCycleBar() : null;
    return { power,autoMode,pumpCycl,pumpRun,pumpIsSwitch,lightBr,lightOnT,lightOffT,lightActive,
             lightOnVal,lightOffVal,currentMode,modeOptions,brMin,brMax,brStep,
             lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
             tempCol,waterCol,tankH,waterH,stage,cb };
  }

  /* ── RENDER ── */
  function render(card, rawHass) {
    const v=computeValues(card,rawHass);
    const { power,autoMode,pumpCycl,pumpRun,pumpIsSwitch,lightBr,lightActive,
            lightOnVal,lightOffVal,currentMode,modeOptions,brMin,brMax,
            lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
            tempCol,waterCol,tankH,waterH,stage,cb } = v;

    const stageInfo=STAGES[stage];
    const pHeightsAll=[[],[26,26,26,26,26],[26,30,28,32,24],[44,52,58,50,42],[62,72,78,68,60],[80,90,94,86,78],[92,100,106,98,88]];
    const pHeights=pHeightsAll[stage]||pHeightsAll[3];
    const plants=stage===0?[0,1,2,3,4].map(i=>sproutSvg(i)).join(''):pHeights.map((h,i)=>plantSvg(stage,i,i)).join('');

    const bubbles=[9,20,33,48,60,72,83,92].map((_,i)=>{
      const sz=3+(i%3)*2;
      return `<div data-lp-bub="${i}" style="position:absolute;bottom:${3+(i%3)*3}px;left:${_}%;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(120,200,255,0.5);border:1px solid rgba(160,230,255,0.55);animation:lp-bubble ${1.6+i*0.22}s ease-in ${(i*0.33).toFixed(2)}s infinite;display:${pumpRun&&power?'block':'none'}"></div>`;
    }).join('');
    const ripple=pumpRun&&power?`
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;border:1px solid rgba(100,180,255,.4);animation:lp-ripple 1.8s ease-out 0s infinite"></div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:50%;border:1px solid rgba(100,180,255,.3);animation:lp-ripple 1.8s ease-out 0.6s infinite"></div>`:'';
    const cycleBarHtml=pumpCycl&&cb?`
      <div style="display:flex;align-items:center;gap:6px;padding:3px 8px 5px;flex-shrink:0">
        <div style="font-size:8px;color:#fff;white-space:nowrap">♻️ ${cb.label}</div>
        <div style="flex:1;height:4px;background:rgba(255,255,255,.12);border-radius:2px;overflow:hidden">
          <div data-lp-cycbar style="height:100%;width:${cb.pct}%;background:${cb.col};border-radius:2px;transition:width .8s linear"></div>
        </div>
        <div style="font-size:8px;color:rgba(255,255,255,.5)">30m</div>
      </div>`:'';

    const chipStyle=(on,label,action)=>`<div data-lp-action="${action}" style="background:${on?'rgba(74,222,128,.1)':'rgba(255,255,255,.04)'};border:1px solid ${on?'rgba(74,222,128,.28)':'rgba(255,255,255,.07)'};border-radius:7px;padding:4px 3px;text-align:center;font-size:9px;cursor:pointer"><div style="color:#fff;opacity:.6;font-size:7px">${label.split(' ')[0]}</div><b style="color:${on?'#4ade80':'#fff'};opacity:${on?1:.35}">${on?'ON':'OFF'}</b></div>`;
    const alertStyle=(bad,icon)=>`<div style="background:${bad?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${bad?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)'};border-radius:7px;padding:4px 3px;text-align:center"><div style="font-size:11px">${icon}</div><div style="font-size:8px;font-weight:700;color:${bad?'#f87171':'#4ade80'}">${bad?'⚠️':'✓'}</div></div>`;

    return `<div style="background:linear-gradient(170deg,#04101e 0%,#081828 55%,#050d18 100%);border-radius:14px;overflow:hidden;color:#fff;font-family:inherit;user-select:none;height:100%;display:flex;flex-direction:column">

  <!-- HEADER -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 11px 7px;background:linear-gradient(90deg,rgba(6,30,60,.75),rgba(4,15,30,.3));flex-shrink:0">
    <div style="display:flex;align-items:center;gap:7px">
      <div style="width:28px;height:28px;border-radius:8px;background:${power?'rgba(74,222,128,.15)':'rgba(255,255,255,.05)'};border:1px solid ${power?'rgba(74,222,128,.3)':'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;font-size:15px">🌿</div>
      <div>
        <div style="font-size:12px;font-weight:800;color:#fff">${eh(card.label||'LetPot Max')}</div>
        <div style="font-size:8px;color:rgba(255,255,255,.5)">Sistema idroponico</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px">
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        <div data-lp-power data-lp-action="power" style="background:${power?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)'};border:1px solid ${power?'rgba(74,222,128,.3)':'rgba(248,113,113,.28)'};border-radius:5px;padding:3px 8px;font-size:9px;font-weight:700;color:${power?'#4ade80':'#f87171'};cursor:pointer">${power?'● ATTIVO':'○ SPENTO'}</div>
        <div data-lp-age style="font-size:8px;color:#fff">${plantsAge&&plantsAge!=='unknown'?`🌱 Giorno ${plantsAge}`:''}</div>
      </div>
      <button data-lp-opencfg title="Impostazioni" style="width:26px;height:26px;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(255,255,255,.6);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">⚙️</button>
    </div>
  </div>

  ${renderLedPanel(lightActive&&power, lightOnVal, lightOffVal, lightBr, modeOptions, currentMode, brMin, brMax)}

  <!-- FASE DI CRESCITA -->
  <div style="display:flex;align-items:center;gap:6px;padding:4px 11px;flex-shrink:0">
    <div style="background:${stageInfo.color}22;border:1px solid ${stageInfo.color}55;border-radius:20px;padding:2px 8px;font-size:9px;font-weight:700;color:${stageInfo.color}">${stageInfo.icon} ${stageInfo.name}</div>
    ${plantsAge&&plantsAge!=='unknown'?`<div style="font-size:8px;color:rgba(255,255,255,.45)">Giorno ${plantsAge}</div>`:''}
  </div>

  <!-- PIANTE -->
  <div style="position:relative;display:flex;align-items:flex-end;justify-content:center;gap:${stage<=1?'8px':'3px'};height:${[16,32,50,68,86,100][stage]||68}px;overflow:hidden;padding:0 6px;flex-shrink:0">
    ${lightActive&&power?`<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(180,30,255,0.1) 0%,transparent 70%);pointer-events:none"></div>`:''}
    ${plants}
  </div>

  <!-- TANK ACQUA -->
  <div style="position:relative;margin:4px 11px 0;border-radius:10px;overflow:hidden;border:1px solid rgba(30,90,170,.35);height:${tankH}px;background:linear-gradient(180deg,#060f1e 0%,#091626 100%);flex-shrink:0">
    <div data-lp-wtext style="position:absolute;top:5px;right:7px;font-size:10px;font-weight:800;color:${waterCol};z-index:5;text-shadow:0 0 8px #000">💧 ${waterPct}%</div>
    <div data-lp-fill style="position:absolute;bottom:0;left:0;right:0;height:${waterH}px;z-index:1;transition:height 1.4s ease">
      <svg style="position:absolute;top:-20px;left:0;width:200%;animation:lp-wave ${pumpRun&&power?'2s':'4s'} linear infinite" viewBox="0 0 800 22" preserveAspectRatio="none">
        <path d="M0,11 C60,0 120,22 180,11 C240,0 300,22 360,11 C420,0 480,22 540,11 C600,0 660,22 720,11 C780,0 800,22 800,11 L800,22 L0,22 Z" fill="rgba(20,85,165,.88)"/>
        <path d="M0,14 C80,4 160,22 240,14 C320,4 400,22 480,14 C560,4 640,22 720,14 L800,14 L800,22 L0,22 Z" fill="rgba(12,55,115,.72)"/>
      </svg>
      <div style="position:absolute;top:20px;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(18,85,165,.88) 0%,rgba(8,48,108,.96) 100%)"></div>
      ${lightActive&&power?`<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent 15%,rgba(180,60,255,.04) 50%,transparent 85%);z-index:2"></div>`:''}
      <div style="position:absolute;inset:0;z-index:3">${bubbles}</div>
      <div style="position:absolute;bottom:18px;left:50%;transform:translateX(-50%);width:60px;height:30px;z-index:4">${ripple}</div>
    </div>
    <div style="position:absolute;top:0;left:0;right:0;height:20px;background:rgba(5,12,26,.75);border-bottom:1px solid rgba(25,75,145,.45);z-index:2;display:flex;align-items:center;justify-content:center;gap:8px">
      ${[0,1,2,3,4].map(()=>`<div style="width:10px;height:10px;border-radius:3px;background:rgba(35,90,170,.55);border:1px solid rgba(55,130,210,.45)"></div>`).join('')}
    </div>
    <!-- POMPA -->
    <div data-lp-pumprow data-lp-action="${pumpIsSwitch?'pump':''}" style="position:absolute;bottom:0;left:0;right:0;height:22px;background:rgba(4,10,22,.85);border-top:1px solid rgba(25,65,130,.4);z-index:5;display:flex;align-items:center;padding:0 7px;gap:4px;${pumpIsSwitch?'cursor:pointer':''}">
      <span data-lp-gear style="font-size:13px;display:inline-block;${pumpRun&&power?'animation:lp-spin 1.2s linear infinite':'opacity:0.3'}">⚙️</span>
      <div data-lp-pumptxt style="font-size:8px;color:#fff;font-weight:600">POMPA ${pumpRun&&power?'ATTIVA':'FERMA'}</div>
      ${pumpRun&&power?`<div style="display:flex;gap:2px;margin-left:2px">
        <div style="font-size:7px;color:rgba(74,222,128,.7)">←</div>
        <div style="font-size:7px;color:rgba(74,222,128,.7)">◆</div>
        <div style="font-size:7px;color:rgba(74,222,128,.7)">→</div></div>`:''}
      <div style="flex:1"></div>
      <div data-lp-temp style="font-size:8px;color:${tempCol};font-weight:700">🌡️ ${tempVal.toFixed(1)}°C</div>
    </div>
  </div>

  ${cycleBarHtml}

  <!-- STATS -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:5px 11px;flex-shrink:0">
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:6px 4px;text-align:center">
      <div style="font-size:7px;color:#fff;opacity:.5;text-transform:uppercase;letter-spacing:.5px">Acqua</div>
      <div data-lp-wval style="font-size:15px;font-weight:900;color:${waterCol};line-height:1.1">${waterPct}%</div>
      <div style="font-size:11px">💧</div>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:6px 4px;text-align:center">
      <div style="font-size:7px;color:#fff;opacity:.5;text-transform:uppercase;letter-spacing:.5px">Temp</div>
      <div data-lp-tval style="font-size:15px;font-weight:900;color:${tempCol};line-height:1.1">${tempVal.toFixed(1)}°</div>
      <div style="font-size:11px">🌡️</div>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:6px 4px;text-align:center">
      <div style="font-size:7px;color:#fff;opacity:.5;text-transform:uppercase;letter-spacing:.5px">Giorno</div>
      <div data-lp-aval style="font-size:15px;font-weight:900;color:#86efac;line-height:1.1">${plantsAge!=='unknown'?plantsAge:'—'}</div>
      <div style="font-size:11px">🌱</div>
    </div>
  </div>

  <!-- CHIP STATO + ALERT -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:4px;padding:0 11px 9px;flex:1;align-content:end">
    ${chipStyle(autoMode,'Auto','auto')}
    ${chipStyle(pumpCycl,'Ciclo','cycl')}
    <div data-lp-antr>${alertStyle(lowNutr,'🧪')}</div>
    <div data-lp-awtr>${alertStyle(lowWater,'💧')}</div>
    <div data-lp-aref>${alertStyle(refillErr,'🔄')}</div>
  </div>

</div>`;
  }

  /* ── MOUNT + INTERAZIONI ── */
  function mount(card, rawHass, el) {
    injectStyles();
    if(_mounted.has(el)) return;
    _mounted.add(el);

    // Click delegation
    el.addEventListener('click', function(e) {
      const target = e.target.closest('[data-lp-action]');
      if(e.target.closest('[data-lp-opencfg]')) { configure(card); return; }
      if(!target) return;
      const action = target.dataset.lpAction;
      if(!action) return;
      const ent = getEnt(card);
      const h = H();

      switch(action) {
        case 'power':
          if(!ent.powerEntity) break;
          toggleEnt(ent.powerEntity);
          // Aggiornamento ottimistico
          { const s=stateOf(h,ent.powerEntity)==='on'?'off':'on';
            const pw=el.querySelector('[data-lp-power]');
            if(pw){ pw.textContent=s==='on'?'● ATTIVO':'○ SPENTO'; pw.style.color=s==='on'?'#4ade80':'#f87171'; pw.style.background=s==='on'?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)'; pw.style.borderColor=s==='on'?'rgba(74,222,128,.3)':'rgba(248,113,113,.28)'; } }
          break;

        case 'pump':
          if(!ent.pumpEntity||!ent.pumpEntity.startsWith('switch.')) break;
          toggleEnt(ent.pumpEntity);
          break;

        case 'auto':
          if(!ent.autoModeEntity) break;
          { const s=stateOf(h,ent.autoModeEntity)==='on'?'off':'on';
            toggleEnt(ent.autoModeEntity);
            const c=el.querySelector('[data-lp-action="auto"]');
            if(c){ c.style.background=s==='on'?'rgba(74,222,128,.1)':'rgba(255,255,255,.04)'; c.style.borderColor=s==='on'?'rgba(74,222,128,.28)':'rgba(255,255,255,.07)'; const b=c.querySelector('b'); if(b){b.textContent=s==='on'?'ON':'OFF';b.style.color=s==='on'?'#4ade80':'#fff';b.style.opacity=s==='on'?'1':'.35';} } }
          break;

        case 'cycl':
          if(!ent.pumpCyclingEntity) break;
          { const s=stateOf(h,ent.pumpCyclingEntity)==='on'?'off':'on';
            toggleEnt(ent.pumpCyclingEntity);
            const c=el.querySelector('[data-lp-action="cycl"]');
            if(c){ c.style.background=s==='on'?'rgba(74,222,128,.1)':'rgba(255,255,255,.04)'; c.style.borderColor=s==='on'?'rgba(74,222,128,.28)':'rgba(255,255,255,.07)'; const b=c.querySelector('b'); if(b){b.textContent=s==='on'?'ON':'OFF';b.style.color=s==='on'?'#4ade80':'#fff';b.style.opacity=s==='on'?'1':'.35';} } }
          break;

        case 'br-up':
        case 'br-dn': {
          if(!ent.lightBrightnessEntity) break;
          const attrs=h?.states?.[ent.lightBrightnessEntity]?.attributes||{};
          const cur=parseFloat(stateOf(h,ent.lightBrightnessEntity))||5;
          const step=parseFloat(attrs.step)||1;
          const min=parseFloat(attrs.min)||1, max=parseFloat(attrs.max)||10;
          const nv=Math.min(max,Math.max(min,cur+(action==='br-up'?step:-step)));
          setNumberEnt(ent.lightBrightnessEntity, nv);
          // Ottimistico
          el.querySelectorAll('[data-lp-bval],[data-lp-bval2]').forEach(b=>b.textContent=nv);
          break;
        }
      }
    });

    // Change delegation (time input + select)
    el.addEventListener('change', function(e) {
      const target = e.target.closest('[data-lp-action]');
      if(!target) return;
      const action = target.dataset.lpAction;
      const ent = getEnt(card);
      switch(action) {
        case 'ton':  if(ent.lightOnEntity)  setTimeEnt(ent.lightOnEntity,  target.value); break;
        case 'toff': if(ent.lightOffEntity) setTimeEnt(ent.lightOffEntity, target.value); break;
        case 'mode': if(ent.lightModeEntity) setSelectEnt(ent.lightModeEntity, target.value); break;
      }
    });
  }

  /* ── UPDATE ── */
  function update(card, rawHass, el) {
    try {
      const v=computeValues(card,rawHass);
      const { power,autoMode,pumpCycl,pumpRun,pumpIsSwitch,lightBr,lightActive,
              lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
              tempCol,waterCol,waterH,stage,cb,currentMode } = v;

      if(_lastStage[card.id]!==undefined && _lastStage[card.id]!==stage) {
        _lastStage[card.id]=stage; el.innerHTML=render(card,rawHass); return;
      }
      _lastStage[card.id]=stage;

      const q=s=>el.querySelector(`[data-lp-${s}]`);

      // Acqua
      const fill=q('fill'); if(fill) fill.style.height=waterH+'px';
      const wt=q('wtext'); if(wt){wt.textContent='💧 '+waterPct+'%';wt.style.color=waterCol;}
      const wv=q('wval'); if(wv){wv.textContent=waterPct+'%';wv.style.color=waterCol;}
      // Temp
      const tp=q('temp'); if(tp){tp.textContent='🌡️ '+tempVal.toFixed(1)+'°C';tp.style.color=tempCol;}
      const tv=q('tval'); if(tv){tv.textContent=tempVal.toFixed(1)+'°';tv.style.color=tempCol;}
      // Età
      const ag=q('age'); if(ag) ag.textContent=plantsAge&&plantsAge!=='unknown'?`🌱 Giorno ${plantsAge}`:'';
      const av=q('aval'); if(av) av.textContent=plantsAge!=='unknown'?plantsAge:'—';
      // Power
      const pw=q('power');
      if(pw){ pw.textContent=power?'● ATTIVO':'○ SPENTO'; pw.style.color=power?'#4ade80':'#f87171'; pw.style.background=power?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)'; pw.style.borderColor=power?'rgba(74,222,128,.3)':'rgba(248,113,113,.28)'; }
      // Pompa
      const gear=q('gear'); if(gear){ gear.style.animation=pumpRun&&power?'lp-spin 1.2s linear infinite':''; gear.style.opacity=pumpRun&&power?'1':'0.3'; }
      const pmtxt=q('pumptxt'); if(pmtxt) pmtxt.textContent='POMPA '+(pumpRun&&power?'ATTIVA':'FERMA');
      [9,20,33,48,60,72,83,92].forEach((_,i)=>{const b=el.querySelector(`[data-lp-bub="${i}"]`);if(b) b.style.display=pumpRun&&power?'block':'none';});
      // Barra ciclo
      if(pumpCycl&&cb){ const bar=q('cycbar'); if(bar){bar.style.width=cb.pct+'%';bar.style.background=cb.col;} }
      // Brightness (solo se non sta interagendo l'utente)
      if(document.activeElement?.dataset?.lpAction!=='br-up' && document.activeElement?.dataset?.lpAction!=='br-dn')
        el.querySelectorAll('[data-lp-bval],[data-lp-bval2]').forEach(b=>b.textContent=lightBr!=='unknown'?lightBr:'—');
      // Chips
      function updChip(attr,on){ const c=el.querySelector(`[data-lp-action="${attr}"]`); if(!c) return; c.style.background=on?'rgba(74,222,128,.1)':'rgba(255,255,255,.04)'; c.style.borderColor=on?'rgba(74,222,128,.28)':'rgba(255,255,255,.07)'; const b=c.querySelector('b'); if(b){b.textContent=on?'ON':'OFF';b.style.color=on?'#4ade80':'#fff';b.style.opacity=on?'1':'.35';} }
      updChip('auto',autoMode); updChip('cycl',pumpCycl);
      // Alert
      function updAlert(attr,bad){ const a=q(attr); if(!a) return; const inner=a.querySelector('[style]'); if(!inner) return; inner.outerHTML=`<div style="background:${bad?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${bad?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)'};border-radius:7px;padding:4px 3px;text-align:center"><div style="font-size:11px">${a.dataset.lpAntr!==undefined?'🧪':a.dataset.lpAwtr!==undefined?'💧':'🔄'}</div><div style="font-size:8px;font-weight:700;color:${bad?'#f87171':'#4ade80'}">${bad?'⚠️':'✓'}</div></div>`; }
      // Alert semplificato (contenuto statico, aggiorna solo colore wrapper)
      function updAlertSimple(sel,bad){
        const a=el.querySelector(`[data-lp-${sel}]`); if(!a) return;
        const inner=a.firstElementChild; if(!inner) return;
        inner.style.background=bad?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)';
        inner.style.borderColor=bad?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)';
        const txt=inner.querySelector('[style*="font-weight:700"]'); if(txt){txt.textContent=bad?'⚠️':'✓';txt.style.color=bad?'#f87171':'#4ade80';}
      }
      updAlertSimple('antr',lowNutr); updAlertSimple('awtr',lowWater); updAlertSimple('aref',refillErr);
    } catch(e){}
  }

  /* ── CONFIGURE ── */
  const FIELDS=[
    { key:'powerEntity',          label:'💡 Power (switch)',             domains:['switch'] },
    { key:'autoModeEntity',       label:'🤖 Auto mode (switch)',         domains:['switch'] },
    { key:'pumpCyclingEntity',    label:'♻️ Pump cycling (switch)',      domains:['switch'] },
    { key:'waterLevelEntity',     label:'💧 Livello acqua (sensor %)',   domains:['sensor'] },
    { key:'tempEntity',           label:'🌡️ Temperatura (sensor)',       domains:['sensor'] },
    { key:'plantsAgeEntity',      label:'🌱 Età piante (sensor)',        domains:['sensor'] },
    { key:'pumpEntity',           label:'⚙️ Pompa (binary_sensor/switch)',domains:['binary_sensor','switch'] },
    { key:'lightOnEntity',        label:'🌅 Luce accensione (time)',     domains:['time','input_datetime'] },
    { key:'lightOffEntity',       label:'🌙 Luce spegnimento (time)',    domains:['time','input_datetime'] },
    { key:'lightBrightnessEntity',label:'✨ Luminosità (number)',        domains:['number','input_number'] },
    { key:'lightModeEntity',      label:'🎛️ Modalità luce (select)',     domains:['select','input_select'] },
    { key:'lowWaterEntity',       label:'⚠️ Acqua bassa (binary)',       domains:['binary_sensor'] },
    { key:'lowNutrientsEntity',   label:'⚠️ Nutrienti bassi (binary)',   domains:['binary_sensor'] },
    { key:'refillErrorEntity',    label:'🔄 Errore ricarica (binary)',   domains:['binary_sensor'] },
  ];

  function configure(card) {
    const ent=getEnt(card), h=H();
    const allEntities=h?Object.keys(h.states).sort():[];
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);display:flex;align-items:flex-end';
    const sheet=document.createElement('div');
    sheet.style.cssText='width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0d1a;border:1px solid rgba(255,255,255,.1);border-bottom:none;border-radius:20px 20px 0 0;color:#fff;overflow:hidden';
    ov.appendChild(sheet);
    sheet.innerHTML=`<div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;gap:10px"><span style="font-size:20px">🌿</span><div style="flex:1"><div style="font-size:14px;font-weight:800;color:#fff">Configura LetPot Max</div><div style="font-size:10px;color:rgba(255,255,255,.4)">Collega le entità Home Assistant</div></div><button id="lp-close" style="width:30px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.1);color:#fff;cursor:pointer;font-size:14px;flex-shrink:0">✕</button></div><div id="lp-body" style="flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin"></div><div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0"><button id="lp-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:linear-gradient(90deg,#16a34a,#4ade80);color:#fff;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button><button id="lp-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button></div>`;
    const body=sheet.querySelector('#lp-body'), inputs={};
    FIELDS.forEach(f=>{
      const wrap=document.createElement('div'); wrap.style.cssText='position:relative';
      const label=document.createElement('div'); label.style.cssText='font-size:10px;color:rgba(255,255,255,.5);margin-bottom:4px;font-weight:600'; label.textContent=f.label;
      const inp=document.createElement('input'); inp.value=ent[f.key]||''; inp.placeholder=f.domains[0]+'.*'; inp.autocomplete='off'; inp.spellcheck=false;
      inp.style.cssText='width:100%;padding:9px 11px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:12px;box-sizing:border-box;outline:none';
      inputs[f.key]=inp;
      const drop=document.createElement('div'); drop.style.cssText='display:none;position:absolute;left:0;right:0;top:100%;background:#0d1a2e;border:1px solid rgba(129,140,248,.4);border-top:none;border-radius:0 0 10px 10px;max-height:160px;overflow-y:auto;z-index:500;scrollbar-width:thin';
      function showSugg(typed){ const q=typed.toLowerCase(); const res=allEntities.filter(k=>f.domains.some(d=>k.startsWith(d+'.'))&&(!q||k.toLowerCase().includes(q))).sort((a,b)=>{const ap=a.toLowerCase().startsWith(q),bp=b.toLowerCase().startsWith(q);return ap&&!bp?-1:!ap&&bp?1:a.localeCompare(b);}).slice(0,10); if(!res.length){drop.style.display='none';return;} drop.innerHTML=''; res.forEach(s=>{const item=document.createElement('div');item.textContent=s;item.style.cssText='padding:8px 11px;font-size:11px;color:#fff;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04)';item.addEventListener('mouseenter',()=>item.style.background='rgba(129,140,248,.15)');item.addEventListener('mouseleave',()=>item.style.background='');item.addEventListener('mousedown',e=>{e.preventDefault();inp.value=s;drop.style.display='none';});drop.appendChild(item);}); drop.style.display='block'; }
      inp.addEventListener('input',()=>showSugg(inp.value));
      inp.addEventListener('focus',()=>showSugg(inp.value));
      inp.addEventListener('blur',()=>setTimeout(()=>{drop.style.display='none';},150));
      wrap.appendChild(label);wrap.appendChild(inp);wrap.appendChild(drop);body.appendChild(wrap);
    });
    const close=()=>ov.remove();
    sheet.querySelector('#lp-close').onclick=close;
    sheet.querySelector('#lp-cancel').onclick=close;
    ov.addEventListener('click',e=>{if(e.target===ov)close();});
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc);}});
    sheet.querySelector('#lp-save').onclick=()=>{
      const n={};FIELDS.forEach(f=>{n[f.key]=inputs[f.key].value.trim();});
      saveEnt(card,n);close();try{window.showToast?.('✅ Impostazioni LetPot Max salvate');}catch(_){}
    };
    document.body.appendChild(ov);
    const firstEmpty=FIELDS.find(f=>!ent[f.key]);if(firstEmpty) inputs[firstEmpty.key].focus();
  }

  /* ── PREVIEW ── */
  function preview(){
    const mockCard={id:'__prev__',type:'js-custom',jsCardId:ID,label:'LetPot Max',colSpan:2,rowSpan:3};
    try{localStorage.setItem(LS('__prev__'),JSON.stringify({
      powerEntity:'switch.letpot_max_power',autoModeEntity:'switch.letpot_max_auto_mode',
      pumpCyclingEntity:'switch.letpot_max_pump_cycling',waterLevelEntity:'sensor.letpot_max_water_level',
      tempEntity:'sensor.letpot_max_temperatura',plantsAgeEntity:'sensor.letpot_max_plants_age',
      pumpEntity:'switch.letpot_max_pump',lightOnEntity:'time.letpot_max_light_on',
      lightOffEntity:'time.letpot_max_light_off',lightBrightnessEntity:'number.letpot_max_light_brightness',
      lightModeEntity:'select.letpot_max_modalita_luce',lowWaterEntity:'binary_sensor.letpot_max_low_water',
      lowNutrientsEntity:'binary_sensor.letpot_max_low_nutrients',refillErrorEntity:'binary_sensor.letpot_max_refill_error',
    }));}catch(_){}
    return render(mockCard,{states:{
      'switch.letpot_max_power':{state:'on'},'switch.letpot_max_auto_mode':{state:'on'},
      'switch.letpot_max_pump_cycling':{state:'on'},'sensor.letpot_max_water_level':{state:'78'},
      'sensor.letpot_max_temperatura':{state:'26.5'},'sensor.letpot_max_plants_age':{state:'18'},
      'switch.letpot_max_pump':{state:'on'},'time.letpot_max_light_on':{state:'06:00:00'},
      'time.letpot_max_light_off':{state:'22:00:00'},
      'number.letpot_max_light_brightness':{state:'7',attributes:{min:1,max:10,step:1}},
      'select.letpot_max_modalita_luce':{state:'Verdure/Erbe',attributes:{options:['Verdure/Erbe','Frutti','Fiori','Erbe aromatiche','Personalizzato']}},
      'binary_sensor.letpot_max_low_water':{state:'off'},'binary_sensor.letpot_max_low_nutrients':{state:'off'},
      'binary_sensor.letpot_max_refill_error':{state:'off'},
    }});
  }

  /* ── REGISTRAZIONE ── */
  const CARD={
    id:ID, name:'LetPot Max', icon:'🌿',
    desc:'Sistema idroponico LetPot Max — controlli interattivi, LED full-spectrum, fasi crescita',
    version:'3.1', colSpan:2, rowSpan:3,
    render, mount, update, configure, preview,
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{console.log('[FratechStore] Card registrata: letpot-max v3.1');}catch(e){}
})();
