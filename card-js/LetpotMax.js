(function () {
  'use strict';
  const ID = 'letpot-max';
  const LS = id => 'frarik_letpot_' + (id || 'x');

  function H() { try { const h = window.frarikHass?.(); if (h?.states) return h; } catch(e){} return null; }
  function liveH(raw) { return H() || (raw?.states ? raw : null); }
  function stateOf(h, id) { if (!h || !id) return 'unknown'; return h?.states?.[id]?.state || 'unknown'; }
  function attrOf(h, id, a) { return h?.states?.[id]?.attributes?.[a]; }
  function eh(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function isOn(s) { return s==='on'||s==='true'||s==='1'||s==='running'; }

  const _mounted   = new WeakSet();
  const _intervals = new WeakMap();
  const _lastStage = {};
  const _localBr   = {};   // cardId → {v, ts}
  const _localSw   = {};   // cardId → {entityId → {s, ts}}

  /* ── LS helpers ── */
  function getEnt(card) { try { return JSON.parse(localStorage.getItem(LS(card.id))||'{}'); } catch(e){ return {}; } }
  function saveEnt(card, ent) { try { localStorage.setItem(LS(card.id), JSON.stringify(ent)); } catch(e){} }

  /* ── Servizi HA ── */
  function svc(domain, service, data) {
    try { const h=H(); if(h?.callService) h.callService(domain, service, data); } catch(e){}
  }
  function toggleEnt(entityId) {
    if(!entityId||entityId==='unknown') return;
    const dom=entityId.split('.')[0];
    const d={input_boolean:'input_boolean'}[dom]||'switch';
    svc(d, isOn(stateOf(H(),entityId))?'turn_off':'turn_on', {entity_id:entityId});
  }
  function setTimeEnt(entityId, hhmm) {
    if(!entityId||entityId==='unknown') return;
    const t=hhmm.length===5?hhmm+':00':hhmm;
    entityId.startsWith('input_datetime')
      ? svc('input_datetime','set_datetime',{entity_id:entityId,time:t})
      : svc('time','set_value',{entity_id:entityId,time:t});
  }
  function setSelectEnt(entityId, option) {
    if(!entityId||entityId==='unknown') return;
    entityId.startsWith('input_select')
      ? svc('input_select','select_option',{entity_id:entityId,option})
      : svc('select','select_option',{entity_id:entityId,option});
  }
  function setNumberEnt(entityId, value) {
    if(!entityId||entityId==='unknown') return;
    entityId.startsWith('input_number')
      ? svc('input_number','set_value',{entity_id:entityId,value})
      : svc('number','set_value',{entity_id:entityId,value});
  }

  /* ── Stato locale per switch (evita flip durante l'attesa di HA) ── */
  function doToggle(card, entityId, el) {
    if(!entityId||entityId==='unknown') return null;
    const h=H();
    const cur = localSwState(card, entityId, stateOf(h, entityId));
    const next = isOn(cur)?'off':'on';
    if(!_localSw[card.id]) _localSw[card.id]={};
    _localSw[card.id][entityId]={s:next,ts:Date.now()};
    toggleEnt(entityId);
    return next;
  }
  function localSwState(card, entityId, haState) {
    const p=_localSw[card.id]?.[entityId];
    if(p && Date.now()-p.ts<5000) return p.s;
    if(p) delete _localSw[card.id][entityId];
    return haState;
  }

  /* ── Fasi di crescita ── */
  const STAGES=[
    {name:'Germinazione',icon:'🌱',col:'#86efac'},
    {name:'Piantina',    icon:'🌿',col:'#4ade80'},
    {name:'Vegetativa',  icon:'🍃',col:'#22c55e'},
    {name:'Crescita',    icon:'🌿',col:'#16a34a'},
    {name:'Pre-raccolta',icon:'🌾',col:'#facc15'},
    {name:'Raccolta',    icon:'🥬',col:'#4ade80'},
  ];
  function getStage(ageStr){const d=parseInt(ageStr)||0;return d<=3?0:d<=10?1:d<=21?2:d<=40?3:d<=60?4:5;}

  /* ── Timer 30min ── */
  function cycleBarData(){
    const CYCLE=30*60*1000;
    const remaining=CYCLE-(Date.now()%CYCLE);
    const pct=Math.round((remaining/CYCLE)*100);
    const min=Math.floor(remaining/60000);
    const sec=Math.floor((remaining%60000)/1000);
    const col=pct>60?'#4ade80':pct>25?'#facc15':'#f97316';
    return {pct,col,label:`${min}:${String(sec).padStart(2,'0')}`};
  }

  /* ── SVG Piante ── */
  function sproutSvg(i){const v=(i%3)*2;return `<svg width="22" height="16" viewBox="0 0 22 16" style="flex-shrink:0"><line x1="11" y1="16" x2="11" y2="10" stroke="#4ade80" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="6" cy="9" rx="5.5" ry="2.5" fill="#86efac" opacity="0.92" transform="rotate(-28 6 9)"/><ellipse cx="16" cy="${8+v}" rx="5.5" ry="2.5" fill="#4ade80" opacity="0.9" transform="rotate(28 16 ${8+v})"/></svg>`;}
  function plantSvg(phase,idx,delay){
    if(phase===0) return sproutSvg(idx);
    const heights=[0,26,44,62,80,94];
    const h=heights[phase];
    const ls=[0,9,12,15,18,21][phase];
    const cx=ls+5,W=cx*2;
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
    if(phase>=5){const hr=Math.round(ls*0.95);s+=`<ellipse cx="${cx}" cy="9" rx="${hr}" ry="${Math.round(hr*1.15)}" fill="#bbf7d0" opacity="0.85"/><ellipse cx="${cx-4}" cy="7" rx="${Math.round(hr*0.75)}" ry="${Math.round(hr*0.9)}" fill="#86efac" opacity="0.75"/><ellipse cx="${cx+4}" cy="6" rx="${Math.round(hr*0.75)}" ry="${Math.round(hr*0.9)}" fill="#4ade80" opacity="0.72"/>`;}
    else if(phase>=4){const hr=Math.round(ls*0.8);s+=`<ellipse cx="${cx}" cy="8" rx="${hr}" ry="${Math.round(hr*1.1)}" fill="#86efac" opacity="0.88"/><ellipse cx="${cx-3}" cy="6" rx="${Math.round(hr*0.7)}" ry="${Math.round(hr*0.85)}" fill="#4ade80" opacity="0.72"/>`;}
    else{const brx=Math.round(ls*0.45),bry=Math.round(ls*0.55);s+=`<ellipse cx="${cx}" cy="8" rx="${brx}" ry="${bry}" fill="#86efac" opacity="0.88"/>`;}
    return s+'</svg>';
  }

  /* ── LED Panel (pannello piatto come nella foto) ── */
  const LED_MAP=[
    ['R','B','R','B','R','B','R','B','R','B'],
    ['B','W','B','R','B','W','B','R','B','W'],
    ['R','B','R','B','W','B','R','B','R','B'],
    ['B','R','B','W','B','R','B','W','B','R'],
  ];
  const LCOL={R:'#ff1a3c',B:'#2055ff',W:'#ffe9b0'};
  const LGLOW={R:'rgba(255,26,60,.9)',B:'rgba(32,85,255,.9)',W:'rgba(255,233,176,.65)'};

  function buildLedPanel(on){
    let dots='';
    for(let r=0;r<4;r++) for(let c=0;c<10;c++){
      const t=LED_MAP[r][c];
      const anim=on
        ?`background:${LCOL[t]};box-shadow:0 0 ${t==='W'?5:10}px 2px ${LGLOW[t]};animation:lp-glow ${1.4+(c*r%3)*0.28}s ease-in-out ${(c*0.09).toFixed(2)}s infinite`
        :`background:${LCOL[t]};opacity:0.12`;
      dots+=`<div style="width:6px;height:6px;border-radius:50%;${anim};flex-shrink:0"></div>`;
    }
    return dots;
  }

  /* ── Stili ── */
  function injectStyles(){
    if(document.getElementById('lp-kf')) return;
    const s=document.createElement('style');s.id='lp-kf';
    s.textContent=`
      @keyframes lp-wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes lp-bubble{0%{transform:translateY(0) scale(1);opacity:.6}80%{opacity:.15}100%{transform:translateY(-90px) scale(1.6);opacity:0}}
      @keyframes lp-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
      @keyframes lp-glow{0%,100%{opacity:.45;filter:brightness(.7)}50%{opacity:1;filter:brightness(1.6)}}
      @keyframes lp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes lp-ripple{0%{transform:translate(-50%,-50%) scale(1);opacity:.55}100%{transform:translate(-50%,-50%) scale(2.6);opacity:0}}
      [data-lp-action]:not(input):not(select){cursor:pointer}
      [data-lp-action]:not(input):not(select):active{opacity:.65;transform:scale(.93)}
    `;
    document.head.appendChild(s);
  }

  /* ── Valori computed ── */
  function computeValues(card, rawHass){
    const h=liveH(rawHass), e=getEnt(card);
    const powerHA=stateOf(h,e.powerEntity);
    const power=isOn(localSwState(card,e.powerEntity,powerHA));
    const autoModeHA=stateOf(h,e.autoModeEntity);
    const autoMode=isOn(localSwState(card,e.autoModeEntity,autoModeHA));
    const pumpCyclHA=stateOf(h,e.pumpCyclingEntity);
    const pumpCycl=isOn(localSwState(card,e.pumpCyclingEntity,pumpCyclHA));
    const pumpS=stateOf(h,e.pumpEntity);
    const pumpRun=isOn(pumpS);
    const pumpIsSwitch=e.pumpEntity?.split('.')?.[0]==='switch';
    // brightness
    const brHA=stateOf(h,e.lightBrightnessEntity);
    const localBr=_localBr[card.id];
    const lightBr=(localBr&&Date.now()-localBr.ts<5000)?localBr.v:brHA;
    const brMin=parseFloat(attrOf(h,e.lightBrightnessEntity,'min'))||1;
    const brMax=parseFloat(attrOf(h,e.lightBrightnessEntity,'max'))||10;
    const brStep=parseFloat(attrOf(h,e.lightBrightnessEntity,'step'))||1;
    const lightOnT=stateOf(h,e.lightOnEntity);
    const lightOffT=stateOf(h,e.lightOffEntity);
    const currentMode=stateOf(h,e.lightModeEntity);
    const modeOptions=attrOf(h,e.lightModeEntity,'options')||[];
    const now=new Date(),nowMin=now.getHours()*60+now.getMinutes();
    function parseT(t){if(!t||t==='unknown')return null;const p=String(t).split(':');return parseInt(p[0]||0)*60+parseInt(p[1]||0);}
    const onMin=parseT(lightOnT),offMin=parseT(lightOffT);
    let lightActive=false;
    if(onMin!==null&&offMin!==null) lightActive=onMin<offMin?(nowMin>=onMin&&nowMin<offMin):(nowMin>=onMin||nowMin<offMin);
    const lightOnVal=lightOnT!=='unknown'?String(lightOnT).slice(0,5):'';
    const lightOffVal=lightOffT!=='unknown'?String(lightOffT).slice(0,5):'';
    const lowWater=isOn(stateOf(h,e.lowWaterEntity));
    const lowNutr=isOn(stateOf(h,e.lowNutrientsEntity));
    const refillErr=isOn(stateOf(h,e.refillErrorEntity));
    const waterPct=Math.min(100,Math.max(0,parseFloat(stateOf(h,e.waterLevelEntity))||0));
    const tempVal=parseFloat(stateOf(h,e.tempEntity))||0;
    const plantsAge=stateOf(h,e.plantsAgeEntity);
    const tempCol=tempVal>30?'#f97316':tempVal>26?'#4ade80':'#60a5fa';
    const waterCol=waterPct<30?'#f97316':waterPct<60?'#facc15':'#4ade80';
    const tankH=100;
    const waterH=Math.round(tankH*(waterPct/100)*0.72+tankH*0.06);
    const stage=getStage(plantsAge);
    const cb=pumpCycl?cycleBarData():null;
    const on=lightActive&&power;
    return{power,autoMode,pumpCycl,pumpRun,pumpIsSwitch,lightBr,brMin,brMax,brStep,
           lightOnVal,lightOffVal,currentMode,modeOptions,on,
           lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
           tempCol,waterCol,tankH,waterH,stage,cb};
  }

  /* ── RENDER ── */
  function render(card, rawHass){
    const v=computeValues(card,rawHass);
    const{power,autoMode,pumpCycl,pumpRun,pumpIsSwitch,lightBr,brMax,
          lightOnVal,lightOffVal,currentMode,modeOptions,on,
          lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
          tempCol,waterCol,tankH,waterH,stage,cb}=v;

    const stageInfo=STAGES[stage];
    const plantHeightsAll=[[],[26,26,26,26,26],[26,30,28,32,24],[44,52,58,50,42],[62,72,78,68,60],[80,90,94,86,78],[92,100,106,98,88]];
    const pHeights=plantHeightsAll[stage]||plantHeightsAll[3];
    const plants=stage===0?[0,1,2,3,4].map(i=>sproutSvg(i)).join(''):pHeights.map((h,i)=>plantSvg(stage,i,i)).join('');
    const plantH=[16,30,48,64,82,96][stage]||64;

    // Bubbles
    const bubs=[8,18,30,43,55,67,79,90].map((_,i)=>{
      const sz=3+(i%3)*2;
      return `<div data-lp-bub="${i}" style="position:absolute;bottom:${3+(i%3)*4}px;left:${_}%;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(120,200,255,.55);border:1px solid rgba(160,230,255,.5);animation:lp-bubble ${1.6+i*0.22}s ease-in ${(i*0.33).toFixed(2)}s infinite;display:${pumpRun&&power?'block':'none'}"></div>`;
    }).join('');

    // Ripple pompa
    const ripple=pumpRun&&power?[0,.7,1.4].map(d=>`<div style="position:absolute;left:50%;top:50%;width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(100,180,255,.45);animation:lp-ripple 2s ease-out ${d}s infinite"></div>`).join(''):'';

    // Mode options
    const modeOpts=modeOptions.length
      ?modeOptions.map(o=>`<option value="${eh(o)}" ${o===currentMode?'selected':''}>${eh(o)}</option>`).join('')
      :(currentMode&&currentMode!=='unknown'?`<option value="${eh(currentMode)}" selected>${eh(currentMode)}</option>`:'<option value="">—</option>');

    const btn=(action,lbl)=>`<button data-lp-action="${action}" style="width:22px;height:22px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;padding:0">${lbl}</button>`;

    return `<div style="background:linear-gradient(170deg,#04101e 0%,#081828 55%,#050d18 100%);border-radius:14px;overflow:hidden;color:#fff;font-family:inherit;user-select:none;height:100%;display:flex;flex-direction:column">

<!-- HEADER -->
<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 11px 6px;background:linear-gradient(90deg,rgba(6,30,60,.75),rgba(4,15,30,.3));flex-shrink:0">
  <div style="display:flex;align-items:center;gap:7px">
    <div style="width:26px;height:26px;border-radius:8px;background:${power?'rgba(74,222,128,.15)':'rgba(255,255,255,.05)'};border:1px solid ${power?'rgba(74,222,128,.3)':'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;font-size:14px">🌿</div>
    <div>
      <div style="font-size:12px;font-weight:800;color:#fff">${eh(card.label||'LetPot Max')}</div>
      <div style="font-size:8px;color:#fff">${stageInfo.icon} ${stageInfo.name}${plantsAge&&plantsAge!=='unknown'?' · Giorno '+plantsAge:''}</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:5px">
    <div data-lp-update="power" data-lp-action="power" style="background:${power?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)'};border:1px solid ${power?'rgba(74,222,128,.3)':'rgba(248,113,113,.28)'};border-radius:5px;padding:3px 7px;font-size:9px;font-weight:700;color:${power?'#4ade80':'#f87171'}">${power?'● ON':'○ OFF'}</div>
    <button data-lp-opencfg style="width:24px;height:24px;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">⚙️</button>
  </div>
</div>

<!-- CONTROLLI LUCE -->
<div style="display:flex;align-items:center;gap:5px;padding:5px 10px;background:rgba(0,0,0,.3);flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.05)">
  <span style="font-size:10px;flex-shrink:0">🌅</span>
  <input type="time" data-lp-action="ton" value="${lightOnVal}" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#fff;font-size:9px;padding:3px 5px;color-scheme:dark;width:62px;flex-shrink:0">
  <span style="font-size:8px;color:#fff;flex-shrink:0">→</span>
  <span style="font-size:10px;flex-shrink:0">🌙</span>
  <input type="time" data-lp-action="toff" value="${lightOffVal}" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#fff;font-size:9px;padding:3px 5px;color-scheme:dark;width:62px;flex-shrink:0">
  <div style="flex:1"></div>
  ${btn('br-dn','−')}
  <span data-lp-update="bval" style="font-size:11px;color:#fff;font-weight:800;min-width:16px;text-align:center">${lightBr!=='unknown'?lightBr:'—'}</span>
  <span style="font-size:9px;color:#fff">/${brMax}</span>
  ${btn('br-up','+')}
</div>
<div style="padding:4px 10px;background:rgba(0,0,0,.2);flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.05)">
  <select data-lp-action="mode" style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#fff;font-size:10px;padding:4px 7px;color-scheme:dark">${modeOpts}</select>
</div>

<!-- DEVICE: LED panel + bracci + piante + tank -->
<div style="margin:4px 8px 0;flex-shrink:0">

  <!-- LED PANEL PIATTO (come nella foto) -->
  <div style="background:${on?'linear-gradient(180deg,#0e0820,#160e2a)':'linear-gradient(180deg,#0a0a14,#0c0c18)'};border:1px solid ${on?'rgba(180,50,255,.45)':'rgba(255,255,255,.1)'};border-radius:10px 10px 3px 3px;padding:6px 10px 5px;position:relative;overflow:hidden">
    ${on?`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(180,30,255,.22) 0%,transparent 75%)"></div>`:''}
    <div style="position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:3px;justify-content:center">${buildLedPanel(on)}</div>
    <div style="display:flex;justify-content:space-between;margin-top:4px;position:relative;z-index:1">
      <div style="font-size:8px;color:#fff;font-weight:600">${on?'💜 Spettro completo ON':'⬛ Luce spenta'}</div>
      <div style="font-size:8px;color:#fff">✨ <span data-lp-update="bval2">${lightBr!=='unknown'?lightBr:'—'}</span>/${brMax}</div>
    </div>
  </div>

  <!-- BRACCI LATERALI + PIANTE -->
  <div style="display:flex">
    <!-- Braccio sx -->
    <div style="width:6px;background:linear-gradient(180deg,#777 0%,#444 100%);flex-shrink:0;box-shadow:inset -1px 0 0 rgba(255,255,255,.08)"></div>
    <!-- Zona piante -->
    <div style="flex:1;background:${on?'linear-gradient(180deg,rgba(180,30,255,.08) 0%,rgba(0,0,0,0) 70%)':'transparent'};display:flex;align-items:flex-end;justify-content:center;gap:${stage<=1?'8':'3'}px;height:${plantH}px;padding:2px 4px;overflow:hidden">
      ${plants}
    </div>
    <!-- Braccio dx -->
    <div style="width:6px;background:linear-gradient(180deg,#777 0%,#444 100%);flex-shrink:0;box-shadow:inset 1px 0 0 rgba(255,255,255,.08)"></div>
  </div>

  <!-- TANK ACQUA -->
  <div style="position:relative;background:linear-gradient(180deg,#050e1c 0%,#08162a 100%);border:1px solid rgba(30,90,170,.4);border-top:2px solid rgba(80,120,180,.4);border-radius:0 0 10px 10px;height:${tankH}px;overflow:hidden">
    <!-- Water % overlay -->
    <div data-lp-update="wtext" style="position:absolute;top:5px;left:7px;font-size:9px;font-weight:800;color:${waterCol};z-index:6">💧 ${waterPct}%</div>
    <!-- Temp overlay -->
    <div data-lp-update="temp" style="position:absolute;top:5px;right:7px;font-size:9px;font-weight:700;color:${tempCol};z-index:6">🌡️ ${tempVal.toFixed(1)}°</div>
    <!-- Acqua animata -->
    <div data-lp-update="fill" style="position:absolute;bottom:22px;left:0;right:0;height:${waterH}px;z-index:1;transition:height 1.4s ease">
      <svg style="position:absolute;top:-18px;left:0;width:200%;animation:lp-wave ${pumpRun&&power?'1.8s':'3.5s'} linear infinite" viewBox="0 0 800 22" preserveAspectRatio="none">
        <path d="M0,11 C60,0 120,22 180,11 C240,0 300,22 360,11 C420,0 480,22 540,11 C600,0 660,22 720,11 C780,0 800,22 800,11 L800,22 L0,22Z" fill="rgba(20,85,165,.9)"/>
        <path d="M0,14 C80,4 160,22 240,14 C320,4 400,22 480,14 C560,4 640,22 720,14L800,14L800,22L0,22Z" fill="rgba(12,55,115,.75)"/>
      </svg>
      <div style="position:absolute;top:18px;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(18,85,165,.9) 0%,rgba(8,48,108,.97) 100%)"></div>
      <!-- Effetto luce sull'acqua -->
      ${on?`<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent 20%,rgba(180,60,255,.05) 50%,transparent 80%);z-index:2"></div>`:''}
      <div style="position:absolute;inset:0;z-index:3">${bubs}</div>
      <!-- Ripple pompa -->
      <div style="position:absolute;bottom:10px;left:50%;width:0;height:0;z-index:4">${ripple}</div>
    </div>
    <!-- Griglia fori (coperchio) -->
    <div style="position:absolute;top:0;left:0;right:0;height:18px;background:rgba(4,10,22,.8);border-bottom:1px solid rgba(25,75,145,.4);z-index:5;display:flex;align-items:center;justify-content:center;gap:8px">
      ${[0,1,2,3,4].map(()=>`<div style="width:9px;height:9px;border-radius:2px;background:rgba(30,80,165,.55);border:1px solid rgba(60,130,220,.4)"></div>`).join('')}
    </div>
    <!-- POMPA (basata su pumpEntity sensor) -->
    <div data-lp-update="pumprow" data-lp-action="${pumpIsSwitch?'pump':''}" style="position:absolute;bottom:0;left:0;right:0;height:22px;background:rgba(3,8,20,.9);border-top:1px solid rgba(25,65,130,.4);z-index:6;display:flex;align-items:center;padding:0 8px;gap:5px">
      <span data-lp-update="gear" style="font-size:13px;display:inline-block;${pumpRun&&power?'animation:lp-spin 1s linear infinite':'opacity:.3'}">⚙️</span>
      <div style="display:flex;flex-direction:column;gap:0">
        <div data-lp-update="pumptxt" style="font-size:8px;font-weight:700;color:#fff;line-height:1">${pumpRun&&power?'POMPA ATTIVA':'POMPA FERMA'}</div>
        ${pumpRun&&power?`<div style="font-size:7px;color:#fff;display:flex;gap:2px">
          <span style="color:rgba(74,222,128,.8)">← ◆ →</span>
        </div>`:''}
      </div>
      <div style="flex:1"></div>
      ${pumpIsSwitch?`<div style="font-size:7px;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:4px;padding:1px 5px">${pumpRun&&power?'ON':'OFF'}</div>`:''}
    </div>
  </div>
</div>

<!-- BARRA CICLO POMPA 30min -->
${pumpCycl&&cb?`
<div style="display:flex;align-items:center;gap:5px;padding:4px 11px;flex-shrink:0">
  <div style="font-size:9px;color:#fff;font-weight:700;flex-shrink:0">♻️ <span data-lp-update="cyctxt">${cb.label}</span></div>
  <div style="flex:1;height:5px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden">
    <div data-lp-update="cycbar" style="height:100%;width:${cb.pct}%;background:${cb.col};border-radius:3px;transition:width .4s linear"></div>
  </div>
  <div style="font-size:8px;color:#fff;flex-shrink:0">30m</div>
</div>`:''}

<!-- STATS -->
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px 11px;flex-shrink:0">
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:5px 4px;text-align:center">
    <div style="font-size:7px;color:#fff;text-transform:uppercase;letter-spacing:.5px">Acqua</div>
    <div data-lp-update="wval" style="font-size:14px;font-weight:900;color:${waterCol}">${waterPct}%</div>
    <div style="font-size:10px">💧</div>
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:5px 4px;text-align:center">
    <div style="font-size:7px;color:#fff;text-transform:uppercase;letter-spacing:.5px">Temp</div>
    <div data-lp-update="tval" style="font-size:14px;font-weight:900;color:${tempCol}">${tempVal.toFixed(1)}°</div>
    <div style="font-size:10px">🌡️</div>
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:5px 4px;text-align:center">
    <div style="font-size:7px;color:#fff;text-transform:uppercase;letter-spacing:.5px">Giorno</div>
    <div data-lp-update="aval" style="font-size:14px;font-weight:900;color:#86efac">${plantsAge!=='unknown'?plantsAge:'—'}</div>
    <div style="font-size:10px">🌱</div>
  </div>
</div>

<!-- CHIPS + ALERT -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:4px;padding:0 11px 9px;flex:1;align-content:end">
  <div data-lp-action="auto" data-lp-update="chip-auto" style="background:${autoMode?'rgba(74,222,128,.12)':'rgba(255,255,255,.05)'};border:1px solid ${autoMode?'rgba(74,222,128,.3)':'rgba(255,255,255,.1)'};border-radius:7px;padding:4px 3px;text-align:center">
    <div style="font-size:7px;color:#fff">Auto</div>
    <b style="font-size:9px;color:${autoMode?'#4ade80':'#fff'}">${autoMode?'ON':'OFF'}</b>
  </div>
  <div data-lp-action="cycl" data-lp-update="chip-cycl" style="background:${pumpCycl?'rgba(74,222,128,.12)':'rgba(255,255,255,.05)'};border:1px solid ${pumpCycl?'rgba(74,222,128,.3)':'rgba(255,255,255,.1)'};border-radius:7px;padding:4px 3px;text-align:center">
    <div style="font-size:7px;color:#fff">Ciclo</div>
    <b style="font-size:9px;color:${pumpCycl?'#4ade80':'#fff'}">${pumpCycl?'ON':'OFF'}</b>
  </div>
  <div data-lp-update="al-nutr" style="background:${lowNutr?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${lowNutr?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)'};border-radius:7px;padding:4px 3px;text-align:center">
    <div style="font-size:11px">🧪</div>
    <div style="font-size:8px;font-weight:700;color:${lowNutr?'#f87171':'#4ade80'}">${lowNutr?'⚠️':'✓'}</div>
  </div>
  <div data-lp-update="al-water" style="background:${lowWater?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${lowWater?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)'};border-radius:7px;padding:4px 3px;text-align:center">
    <div style="font-size:11px">💧</div>
    <div style="font-size:8px;font-weight:700;color:${lowWater?'#f87171':'#4ade80'}">${lowWater?'⚠️':'✓'}</div>
  </div>
  <div data-lp-update="al-refill" style="background:${refillErr?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${refillErr?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)'};border-radius:7px;padding:4px 3px;text-align:center">
    <div style="font-size:11px">🔄</div>
    <div style="font-size:8px;font-weight:700;color:${refillErr?'#f87171':'#4ade80'}">${refillErr?'⚠️':'✓'}</div>
  </div>
</div>

</div>`;
  }

  /* ── MOUNT ── */
  function mount(card, rawHass, el) {
    injectStyles();
    if(_mounted.has(el)) return;
    _mounted.add(el);

    /* Intervallo 1s per timer in tempo reale */
    const tid = setInterval(() => {
      if(!document.body.contains(el)) { clearInterval(tid); _intervals.delete(el); return; }
      const ent=getEnt(card), h=H();
      const pumpCycl=isOn(localSwState(card,ent.pumpCyclingEntity,stateOf(h,ent.pumpCyclingEntity)));
      if(!pumpCycl) return;
      const cb=cycleBarData();
      const bar=el.querySelector('[data-lp-update="cycbar"]');
      const txt=el.querySelector('[data-lp-update="cyctxt"]');
      if(bar){bar.style.width=cb.pct+'%';bar.style.background=cb.col;}
      if(txt) txt.textContent=cb.label;
    }, 1000);
    _intervals.set(el, tid);

    /* Click delegation */
    el.addEventListener('click', function(e) {
      if(e.target.closest('[data-lp-opencfg]')) { configure(card); return; }
      const tgt=e.target.closest('[data-lp-action]');
      if(!tgt) return;
      const action=tgt.dataset.lpAction;
      if(!action) return;
      const ent=getEnt(card), h=H();

      if(action==='power') {
        if(!ent.powerEntity) return;
        const next=doToggle(card,ent.powerEntity,el);
        const pw=el.querySelector('[data-lp-update="power"]');
        if(pw&&next!==null){
          const on=next==='on';
          pw.textContent=on?'● ON':'○ OFF';
          pw.style.color=on?'#4ade80':'#f87171';
          pw.style.background=on?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)';
          pw.style.borderColor=on?'rgba(74,222,128,.3)':'rgba(248,113,113,.28)';
        }
      }
      else if(action==='pump') {
        if(!ent.pumpEntity||!ent.pumpEntity.startsWith('switch.')) return;
        doToggle(card,ent.pumpEntity,el);
      }
      else if(action==='auto') {
        if(!ent.autoModeEntity) return;
        const next=doToggle(card,ent.autoModeEntity,el);
        _updateChip(el,'chip-auto',next==='on');
      }
      else if(action==='cycl') {
        if(!ent.pumpCyclingEntity) return;
        const next=doToggle(card,ent.pumpCyclingEntity,el);
        _updateChip(el,'chip-cycl',next==='on');
      }
      else if(action==='br-up'||action==='br-dn') {
        if(!ent.lightBrightnessEntity) return;
        const attrs=h?.states?.[ent.lightBrightnessEntity]?.attributes||{};
        const haVal=parseFloat(stateOf(h,ent.lightBrightnessEntity))||5;
        const localBr=_localBr[card.id];
        const cur=(localBr&&Date.now()-localBr.ts<5000)?localBr.v:haVal;
        const step=parseFloat(attrs.step)||1;
        const min=parseFloat(attrs.min)||1, max=parseFloat(attrs.max)||brMaxFallback(card,rawHass);
        const nv=Math.min(max,Math.max(min,cur+(action==='br-up'?step:-step)));
        _localBr[card.id]={v:nv,ts:Date.now()};
        setNumberEnt(ent.lightBrightnessEntity,nv);
        el.querySelectorAll('[data-lp-update="bval"],[data-lp-update="bval2"]').forEach(b=>{if(b)b.textContent=nv;});
      }
    });

    /* Change delegation */
    el.addEventListener('change', function(e) {
      const tgt=e.target.closest('[data-lp-action]');
      if(!tgt) return;
      const action=tgt.dataset.lpAction;
      const ent=getEnt(card);
      if(action==='ton'&&ent.lightOnEntity)  setTimeEnt(ent.lightOnEntity, tgt.value);
      if(action==='toff'&&ent.lightOffEntity) setTimeEnt(ent.lightOffEntity, tgt.value);
      if(action==='mode'&&ent.lightModeEntity) setSelectEnt(ent.lightModeEntity, tgt.value);
    });
  }

  function brMaxFallback(card,rawHass){
    const h=liveH(rawHass),e=getEnt(card);
    return parseFloat(attrOf(h,e?.lightBrightnessEntity,'max'))||10;
  }

  function _updateChip(el, upd, on) {
    const c=el.querySelector(`[data-lp-update="${upd}"]`);
    if(!c) return;
    c.style.background=on?'rgba(74,222,128,.12)':'rgba(255,255,255,.05)';
    c.style.borderColor=on?'rgba(74,222,128,.3)':'rgba(255,255,255,.1)';
    const b=c.querySelector('b');
    if(b){b.textContent=on?'ON':'OFF';b.style.color=on?'#4ade80':'#fff';}
  }
  function _updateAlert(el, upd, bad, icon) {
    const a=el.querySelector(`[data-lp-update="${upd}"]`);
    if(!a) return;
    a.style.background=bad?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)';
    a.style.borderColor=bad?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)';
    const d=a.querySelector('[style*="font-weight:700"]');
    if(d){d.textContent=bad?'⚠️':'✓';d.style.color=bad?'#f87171':'#4ade80';}
  }

  /* ── UPDATE mirato ── */
  function update(card, rawHass, el) {
    try {
      const v=computeValues(card,rawHass);
      const{power,autoMode,pumpCycl,pumpRun,pumpIsSwitch,lightBr,brMax,on,
            lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
            tempCol,waterCol,waterH,stage,cb}=v;

      // Re-render se fase cambiata
      if(_lastStage[card.id]!==undefined&&_lastStage[card.id]!==stage){
        _lastStage[card.id]=stage; el.innerHTML=render(card,rawHass); return;
      }
      _lastStage[card.id]=stage;

      const qu=n=>el.querySelector(`[data-lp-update="${n}"]`);

      // Power
      const pw=qu('power');
      if(pw){pw.textContent=power?'● ON':'○ OFF';pw.style.color=power?'#4ade80':'#f87171';pw.style.background=power?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)';pw.style.borderColor=power?'rgba(74,222,128,.3)':'rgba(248,113,113,.28)';}
      // Acqua
      const fill=qu('fill');if(fill) fill.style.height=waterH+'px';
      const wt=qu('wtext');if(wt){wt.textContent='💧 '+waterPct+'%';wt.style.color=waterCol;}
      const wv=qu('wval');if(wv){wv.textContent=waterPct+'%';wv.style.color=waterCol;}
      // Temp
      const tp=qu('temp');if(tp){tp.textContent='🌡️ '+tempVal.toFixed(1)+'°';tp.style.color=tempCol;}
      const tv=qu('tval');if(tv){tv.textContent=tempVal.toFixed(1)+'°';tv.style.color=tempCol;}
      // Età
      const av=qu('aval');if(av) av.textContent=plantsAge!=='unknown'?plantsAge:'—';
      // Pompa
      const gear=qu('gear');if(gear){gear.style.animation=pumpRun&&power?'lp-spin 1s linear infinite':'';gear.style.opacity=pumpRun&&power?'1':'0.3';}
      const pmtxt=qu('pumptxt');if(pmtxt) pmtxt.textContent=pumpRun&&power?'POMPA ATTIVA':'POMPA FERMA';
      [8,18,30,43,55,67,79,90].forEach((_,i)=>{const b=el.querySelector(`[data-lp-bub="${i}"]`);if(b) b.style.display=pumpRun&&power?'block':'none';});
      // Luminosità (solo se non abbiamo local state recente)
      const localBr=_localBr[card.id];
      if(!localBr||Date.now()-localBr.ts>5000){
        if(localBr) delete _localBr[card.id];
        el.querySelectorAll('[data-lp-update="bval"],[data-lp-update="bval2"]').forEach(b=>{if(b) b.textContent=lightBr!=='unknown'?lightBr:'—';});
      }
      // Chips
      _updateChip(el,'chip-auto',autoMode);
      _updateChip(el,'chip-cycl',pumpCycl);
      // Alert
      _updateAlert(el,'al-nutr',lowNutr,'🧪');
      _updateAlert(el,'al-water',lowWater,'💧');
      _updateAlert(el,'al-refill',refillErr,'🔄');
    } catch(e){}
  }

  /* ── CONFIGURE ── */
  const FIELDS=[
    {key:'powerEntity',          label:'💡 Power (switch)',              domains:['switch']},
    {key:'autoModeEntity',       label:'🤖 Auto mode (switch)',          domains:['switch']},
    {key:'pumpCyclingEntity',    label:'♻️ Pump cycling (switch)',       domains:['switch']},
    {key:'waterLevelEntity',     label:'💧 Livello acqua (sensor %)',    domains:['sensor']},
    {key:'tempEntity',           label:'🌡️ Temperatura (sensor)',        domains:['sensor']},
    {key:'plantsAgeEntity',      label:'🌱 Età piante (sensor)',         domains:['sensor']},
    {key:'pumpEntity',           label:'⚙️ Pompa (binary_sensor/switch)',domains:['binary_sensor','switch']},
    {key:'lightOnEntity',        label:'🌅 Luce accensione (time)',      domains:['time','input_datetime']},
    {key:'lightOffEntity',       label:'🌙 Luce spegnimento (time)',     domains:['time','input_datetime']},
    {key:'lightBrightnessEntity',label:'✨ Luminosità (number)',         domains:['number','input_number']},
    {key:'lightModeEntity',      label:'🎛️ Modalità luce (select)',      domains:['select','input_select']},
    {key:'lowWaterEntity',       label:'⚠️ Acqua bassa (binary)',        domains:['binary_sensor']},
    {key:'lowNutrientsEntity',   label:'⚠️ Nutrienti bassi (binary)',    domains:['binary_sensor']},
    {key:'refillErrorEntity',    label:'🔄 Errore ricarica (binary)',    domains:['binary_sensor']},
  ];
  function configure(card){
    const ent=getEnt(card),h=H();
    const all=h?Object.keys(h.states).sort():[];
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);display:flex;align-items:flex-end';
    const sh=document.createElement('div');
    sh.style.cssText='width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0d1a;border:1px solid rgba(255,255,255,.1);border-bottom:none;border-radius:20px 20px 0 0;color:#fff;overflow:hidden';
    ov.appendChild(sh);
    sh.innerHTML=`<div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;gap:10px"><span style="font-size:20px">🌿</span><div style="flex:1"><div style="font-size:14px;font-weight:800;color:#fff">Configura LetPot Max</div><div style="font-size:10px;color:#fff">Collega le entità Home Assistant</div></div><button id="lp-x" style="width:30px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.1);color:#fff;cursor:pointer;font-size:14px;flex-shrink:0">✕</button></div><div id="lp-body" style="flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin"></div><div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0"><button id="lp-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:linear-gradient(90deg,#16a34a,#4ade80);color:#fff;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button><button id="lp-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button></div>`;
    const body=sh.querySelector('#lp-body'),inputs={};
    FIELDS.forEach(f=>{
      const w=document.createElement('div');w.style.cssText='position:relative';
      const lb=document.createElement('div');lb.style.cssText='font-size:10px;color:#fff;margin-bottom:4px;font-weight:600';lb.textContent=f.label;
      const inp=document.createElement('input');inp.value=ent[f.key]||'';inp.placeholder=f.domains[0]+'.*';inp.autocomplete='off';inp.spellcheck=false;
      inp.style.cssText='width:100%;padding:9px 11px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:12px;box-sizing:border-box;outline:none';
      inputs[f.key]=inp;
      const dr=document.createElement('div');dr.style.cssText='display:none;position:absolute;left:0;right:0;top:100%;background:#0d1a2e;border:1px solid rgba(129,140,248,.4);border-top:none;border-radius:0 0 10px 10px;max-height:160px;overflow-y:auto;z-index:500;scrollbar-width:thin';
      function show(typed){const q=typed.toLowerCase();const res=all.filter(k=>f.domains.some(d=>k.startsWith(d+'.'))&&(!q||k.toLowerCase().includes(q))).sort((a,b)=>{const ap=a.toLowerCase().startsWith(q),bp=b.toLowerCase().startsWith(q);return ap&&!bp?-1:!ap&&bp?1:a.localeCompare(b);}).slice(0,10);if(!res.length){dr.style.display='none';return;}dr.innerHTML='';res.forEach(s=>{const item=document.createElement('div');item.textContent=s;item.style.cssText='padding:8px 11px;font-size:11px;color:#fff;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04)';item.addEventListener('mouseenter',()=>item.style.background='rgba(129,140,248,.15)');item.addEventListener('mouseleave',()=>item.style.background='');item.addEventListener('mousedown',ev=>{ev.preventDefault();inp.value=s;dr.style.display='none';});dr.appendChild(item);});dr.style.display='block';}
      inp.addEventListener('input',()=>show(inp.value));
      inp.addEventListener('focus',()=>show(inp.value));
      inp.addEventListener('blur',()=>setTimeout(()=>{dr.style.display='none';},150));
      w.appendChild(lb);w.appendChild(inp);w.appendChild(dr);body.appendChild(w);
    });
    const close=()=>ov.remove();
    sh.querySelector('#lp-x').onclick=close;
    sh.querySelector('#lp-cancel').onclick=close;
    ov.addEventListener('click',e=>{if(e.target===ov)close();});
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc);}});
    sh.querySelector('#lp-save').onclick=()=>{const n={};FIELDS.forEach(f=>{n[f.key]=inputs[f.key].value.trim();});saveEnt(card,n);close();try{window.showToast?.('✅ Impostazioni LetPot Max salvate');}catch(_){}};
    document.body.appendChild(ov);
    const first=FIELDS.find(f=>!ent[f.key]);if(first) inputs[first.key].focus();
  }

  /* ── PREVIEW ── */
  function preview(){
    const mc={id:'__prev__',type:'js-custom',jsCardId:ID,label:'LetPot Max',colSpan:2,rowSpan:3};
    try{localStorage.setItem(LS('__prev__'),JSON.stringify({
      powerEntity:'switch.letpot_max_power',autoModeEntity:'switch.letpot_max_auto_mode',
      pumpCyclingEntity:'switch.letpot_max_pump_cycling',waterLevelEntity:'sensor.letpot_max_water_level',
      tempEntity:'sensor.letpot_max_temperatura',plantsAgeEntity:'sensor.letpot_max_plants_age',
      pumpEntity:'switch.letpot_max_pump',lightOnEntity:'time.letpot_max_light_on',
      lightOffEntity:'time.letpot_max_light_off',lightBrightnessEntity:'number.letpot_max_light_brightness',
      lightModeEntity:'select.letpot_max_modalita_luce',lowWaterEntity:'binary_sensor.letpot_max_low_water',
      lowNutrientsEntity:'binary_sensor.letpot_max_low_nutrients',refillErrorEntity:'binary_sensor.letpot_max_refill_error',
    }));}catch(_){}
    return render(mc,{states:{
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
  const CARD={id:ID,name:'LetPot Max',icon:'🌿',desc:'Sistema idroponico — LED spettro completo, fasi crescita, controlli interattivi',version:'3.2',colSpan:2,rowSpan:3,render,mount,update,configure,preview};
  window.FratechCardRegistry=window.FratechCardRegistry||{};window.FratechCardRegistry[ID]=CARD;
  window.FratechCards=window.FratechCards||{};window.FratechCards[ID]=CARD;
  try{console.log('[FratechStore] letpot-max v3.2');}catch(e){}
})();
