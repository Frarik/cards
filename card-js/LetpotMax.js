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
  const _localBr   = {};
  const _localSw   = {};

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

  /* ── Local state per switch ── */
  function doToggle(card, entityId) {
    if(!entityId||entityId==='unknown') return null;
    const cur=localSwState(card, entityId, stateOf(H(), entityId));
    const next=isOn(cur)?'off':'on';
    if(!_localSw[card.id]) _localSw[card.id]={};
    _localSw[card.id][entityId]={s:next,ts:Date.now()};
    toggleEnt(entityId);
    return next;
  }
  function localSwState(card, entityId, haState) {
    const p=_localSw[card.id]?.[entityId];
    if(p&&Date.now()-p.ts<5000) return p.s;
    if(p) delete _localSw[card.id][entityId];
    return haState;
  }

  /* ── Fasi crescita ── */
  const STAGES=[
    {name:'Germinazione',icon:'🌱',col:'#86efac'},
    {name:'Piantina',    icon:'🌿',col:'#4ade80'},
    {name:'Vegetativa',  icon:'🍃',col:'#22c55e'},
    {name:'Crescita',    icon:'🌿',col:'#16a34a'},
    {name:'Pre-raccolta',icon:'🌾',col:'#facc15'},
    {name:'Raccolta',    icon:'🥬',col:'#4ade80'},
  ];
  function getStage(a){const d=parseInt(a)||0;return d<=3?0:d<=10?1:d<=21?2:d<=40?3:d<=60?4:5;}

  /* ── Timer 30min ── */
  function cycleBarData(){
    const C=30*60*1000, rem=C-(Date.now()%C);
    const pct=Math.round(rem/C*100);
    const col=pct>60?'#4ade80':pct>25?'#facc15':'#f97316';
    const m=Math.floor(rem/60000), s=Math.floor((rem%60000)/1000);
    return {pct,col,label:`${m}:${String(s).padStart(2,'0')}`};
  }

  /* ── Piante SVG per fase ── */
  function plantsSvg(stage, pumpRun, lightOn) {
    // Altezze per fase: [0]=germinazione  [5]=raccolta
    const configs = [
      // phase 0: germogli minimi
      { count:7, h:[8,10,7,11,9,8,10], w:14, leaf:5 },
      // phase 1: piantina
      { count:7, h:[22,28,20,30,25,22,26], w:16, leaf:7 },
      // phase 2: vegetativa
      { count:8, h:[38,46,42,50,40,44,38,48], w:18, leaf:10 },
      // phase 3: crescita
      { count:9, h:[56,68,62,72,58,66,60,70,54], w:20, leaf:13 },
      // phase 4: pre-raccolta
      { count:9, h:[72,85,80,90,76,84,78,88,74], w:22, leaf:16 },
      // phase 5: raccolta (con frutti)
      { count:9, h:[80,95,88,100,84,92,86,96,82], w:24, leaf:18 },
    ];
    const c=configs[Math.min(stage,5)];
    const lightGlow=lightOn?'filter:drop-shadow(0 -2px 4px rgba(180,50,255,.25))':'';

    let svgs='';
    for(let i=0;i<c.count;i++){
      const h=c.h[i]||c.h[0];
      const delay=(i*0.35).toFixed(2);
      const swayD=2.4+i*0.22;
      const ls=c.leaf;
      const cx=c.w/2;

      if(stage===0){
        // Germogli: solo due foglioline
        svgs+=`<svg width="${c.w}" height="${h+2}" viewBox="0 0 ${c.w} ${h+2}" style="flex-shrink:0;${lightGlow}">
          <line x1="${cx}" y1="${h+2}" x2="${cx}" y2="${h-4}" stroke="#4ade80" stroke-width="1.2" stroke-linecap="round"/>
          <ellipse cx="${cx-4}" cy="${h-5}" rx="4" ry="2" fill="#86efac" opacity=".9" transform="rotate(-30 ${cx-4} ${h-5})"/>
          <ellipse cx="${cx+4}" cy="${h-6}" rx="4" ry="2" fill="#4ade80" opacity=".9" transform="rotate(30 ${cx+4} ${h-6})"/>
        </svg>`;
        continue;
      }

      const sway=`animation:lp-sway ${swayD}s ease-in-out ${delay}s infinite;transform-origin:${cx}px ${h+2}px;overflow:visible`;
      let s=`<svg width="${c.w+4}" height="${h+4}" viewBox="0 0 ${c.w+4} ${h+4}" style="${sway};flex-shrink:0;${lightGlow}">`;
      // Stelo
      s+=`<line x1="${cx+2}" y1="${h+2}" x2="${cx+2}" y2="8" stroke="#4ade80" stroke-width="1.6" stroke-linecap="round"/>`;
      // Foglie
      const leavesN=Math.min(stage+1,5);
      for(let j=0;j<leavesN;j++){
        const ly=h+2-Math.round((j/Math.max(leavesN-1,1))*(h-10));
        const ang=20+j*5;
        const lf=['#15803d','#16a34a','#22c55e','#166534','#4ade80'][j%5];
        const rf=['#22c55e','#4ade80','#15803d','#22c55e','#86efac'][j%5];
        s+=`<ellipse cx="${cx+2-Math.round(ls*.5)}" cy="${ly}" rx="${ls}" ry="${Math.round(ls*.37)}" fill="${lf}" opacity=".92" transform="rotate(-${ang} ${cx+2-Math.round(ls*.5)} ${ly})"/>`;
        s+=`<ellipse cx="${cx+2+Math.round(ls*.5)}" cy="${ly-Math.round(ls*.18)}" rx="${ls}" ry="${Math.round(ls*.37)}" fill="${rf}" opacity=".88" transform="rotate(${ang} ${cx+2+Math.round(ls*.5)} ${ly-Math.round(ls*.18)})"/>`;
      }
      // Cima: testa lattuga o germoglio apicale
      if(stage>=5){
        const hr=Math.round(ls*.9);
        s+=`<ellipse cx="${cx+2}" cy="8" rx="${hr}" ry="${Math.round(hr*1.1)}" fill="#bbf7d0" opacity=".84"/>`;
        s+=`<ellipse cx="${cx}" cy="6" rx="${Math.round(hr*.7)}" ry="${Math.round(hr*.85)}" fill="#86efac" opacity=".72"/>`;
        s+=`<ellipse cx="${cx+4}" cy="7" rx="${Math.round(hr*.7)}" ry="${Math.round(hr*.82)}" fill="#4ade80" opacity=".7"/>`;
        // Frutti (fase raccolta - piccoli cerchi rossi)
        if(i%3===0) s+=`<circle cx="${cx+2+Math.round(ls*.6)}" cy="${Math.round(h*.4)}" r="4" fill="#ef4444" opacity=".85"/>`;
        if(i%3===1) s+=`<circle cx="${cx+2-Math.round(ls*.55)}" cy="${Math.round(h*.55)}" r="3.5" fill="#dc2626" opacity=".8"/>`;
      } else if(stage>=4){
        const hr=Math.round(ls*.75);
        s+=`<ellipse cx="${cx+2}" cy="8" rx="${hr}" ry="${Math.round(hr*1.05)}" fill="#86efac" opacity=".86"/>`;
        s+=`<ellipse cx="${cx}" cy="6" rx="${Math.round(hr*.65)}" ry="${Math.round(hr*.8)}" fill="#4ade80" opacity=".7"/>`;
      } else {
        s+=`<ellipse cx="${cx+2}" cy="8" rx="${Math.round(ls*.4)}" ry="${Math.round(ls*.52)}" fill="#86efac" opacity=".85"/>`;
      }
      s+='</svg>';
      svgs+=s;
    }
    return svgs;
  }

  /* ── LED Panel (pannello orizzontale in cima al palo) ── */
  const LED_MAP=[
    ['R','B','R','B','R','B','R','B','R'],
    ['B','W','B','R','B','W','B','R','B'],
    ['R','B','R','B','W','B','R','B','R'],
  ];
  const LC={R:'#ff1a3c',B:'#2055ff',W:'#ffe9b0'};
  const LG={R:'rgba(255,26,60,.9)',B:'rgba(32,85,255,.9)',W:'rgba(255,233,176,.7)'};

  function buildLeds(on){
    let d='';
    for(let r=0;r<3;r++) for(let c=0;c<9;c++){
      const t=LED_MAP[r][c];
      const st=on
        ?`background:${LC[t]};box-shadow:0 0 ${t==='W'?5:10}px 2px ${LG[t]};animation:lp-glow ${1.4+(c*r%3)*.28}s ease-in-out ${(c*.09).toFixed(2)}s infinite`
        :`background:${LC[t]};opacity:.13`;
      d+=`<div style="width:7px;height:7px;border-radius:50%;${st};flex-shrink:0"></div>`;
    }
    return d;
  }

  /* ── Stili ── */
  function injectStyles(){
    if(document.getElementById('lp-kf')) return;
    const s=document.createElement('style');s.id='lp-kf';
    s.textContent=`
      @keyframes lp-wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes lp-bubble{0%{transform:translateY(0) scale(1);opacity:.6}85%{opacity:.1}100%{transform:translateY(-80px) scale(1.5);opacity:0}}
      @keyframes lp-sway{0%,100%{transform:rotate(-3.5deg)}50%{transform:rotate(3.5deg)}}
      @keyframes lp-glow{0%,100%{opacity:.4;filter:brightness(.65)}50%{opacity:1;filter:brightness(1.7)}}
      @keyframes lp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes lp-ripple{0%{opacity:.6;transform:translate(-50%,-50%) scale(.8)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.8)}}
      @keyframes lp-lcd-blink{0%,90%,100%{opacity:1}92%,98%{opacity:.6}}
      [data-lp-action]:not(input):not(select){cursor:pointer}
      [data-lp-action]:not(input):not(select):active{opacity:.6;transform:scale(.92)}
    `;
    document.head.appendChild(s);
  }

  /* ── Valori computati ── */
  function computeValues(card, rawHass){
    const h=liveH(rawHass), e=getEnt(card);
    const power   =isOn(localSwState(card,e.powerEntity,stateOf(h,e.powerEntity)));
    const autoMode=isOn(localSwState(card,e.autoModeEntity,stateOf(h,e.autoModeEntity)));
    const pumpCycl=isOn(localSwState(card,e.pumpCyclingEntity,stateOf(h,e.pumpCyclingEntity)));
    const pumpS   =stateOf(h,e.pumpEntity);
    const pumpRun =isOn(pumpS);
    const pumpIsSwitch=e.pumpEntity?.split('.')?.[0]==='switch';
    const brHA=stateOf(h,e.lightBrightnessEntity);
    const lbr=_localBr[card.id];
    const lightBr=(lbr&&Date.now()-lbr.ts<5000)?lbr.v:brHA;
    const brMin=parseFloat(attrOf(h,e.lightBrightnessEntity,'min'))||1;
    const brMax=parseFloat(attrOf(h,e.lightBrightnessEntity,'max'))||10;
    const brStep=parseFloat(attrOf(h,e.lightBrightnessEntity,'step'))||1;
    const lightOnT =stateOf(h,e.lightOnEntity);
    const lightOffT=stateOf(h,e.lightOffEntity);
    const currentMode=stateOf(h,e.lightModeEntity);
    const modeOptions=attrOf(h,e.lightModeEntity,'options')||[];
    const lightOnVal =lightOnT !=='unknown'?String(lightOnT).slice(0,5):'';
    const lightOffVal=lightOffT!=='unknown'?String(lightOffT).slice(0,5):'';
    const now=new Date(),nowMin=now.getHours()*60+now.getMinutes();
    function parseT(t){if(!t||t==='unknown')return null;const p=String(t).split(':');return parseInt(p[0]||0)*60+parseInt(p[1]||0);}
    const onMin=parseT(lightOnT),offMin=parseT(lightOffT);
    let lightActive=false;
    if(onMin!==null&&offMin!==null) lightActive=onMin<offMin?(nowMin>=onMin&&nowMin<offMin):(nowMin>=onMin||nowMin<offMin);
    const on=lightActive&&power;
    const lowWater =isOn(stateOf(h,e.lowWaterEntity));
    const lowNutr  =isOn(stateOf(h,e.lowNutrientsEntity));
    const refillErr=isOn(stateOf(h,e.refillErrorEntity));
    const waterPct=Math.min(100,Math.max(0,parseFloat(stateOf(h,e.waterLevelEntity))||0));
    const tempVal =parseFloat(stateOf(h,e.tempEntity))||0;
    const plantsAge=stateOf(h,e.plantsAgeEntity);
    const tempCol =tempVal>30?'#f97316':tempVal>26?'#4ade80':'#60a5fa';
    const waterCol=waterPct<30?'#f97316':waterPct<60?'#facc15':'#4ade80';
    const stage=getStage(plantsAge);
    const cb=pumpCycl?cycleBarData():null;
    // water fill height dentro il serbatoio (50px totali)
    const waterH=Math.round(50*(waterPct/100)*0.82+4);
    return{power,autoMode,pumpCycl,pumpRun,pumpIsSwitch,lightBr,brMin,brMax,brStep,
           lightOnVal,lightOffVal,currentMode,modeOptions,on,lightOnT,lightOffT,
           lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
           tempCol,waterCol,waterH,stage,cb};
  }

  /* ── RENDER ── */
  function render(card, rawHass){
    const v=computeValues(card,rawHass);
    const{power,autoMode,pumpCycl,pumpRun,pumpIsSwitch,lightBr,brMax,
          lightOnVal,lightOffVal,currentMode,modeOptions,on,
          lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
          tempCol,waterCol,waterH,stage,cb}=v;

    const stageInfo=STAGES[stage];
    const plantAreaH=[14,28,46,62,78,92][stage]||62;

    // Piante
    const plants=plantsSvg(stage, pumpRun&&power, on);

    // Bolle acqua
    const bubs=[10,22,35,48,60,73,85,93].map((_,i)=>{
      const sz=2+(i%3)*1.5;
      return `<div data-lp-bub="${i}" style="position:absolute;bottom:${2+(i%2)*3}px;left:${_}%;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(120,200,255,.5);border:1px solid rgba(160,230,255,.45);animation:lp-bubble ${1.5+i*.2}s ease-in ${(i*.3).toFixed(1)}s infinite;display:${pumpRun&&power?'block':'none'}"></div>`;
    }).join('');

    // Ripple pompa
    const ripple=pumpRun&&power?[0,.8,1.6].map(d=>`<div style="position:absolute;left:50%;top:50%;width:28px;height:28px;border-radius:50%;border:1.5px solid rgba(100,180,255,.4);animation:lp-ripple 2.2s ease-out ${d}s infinite"></div>`).join(''):'';

    // Mode options
    const modeOpts=modeOptions.length
      ?modeOptions.map(o=>`<option value="${eh(o)}" ${o===currentMode?'selected':''}>${eh(o)}</option>`).join('')
      :(currentMode&&currentMode!=='unknown'?`<option value="${eh(currentMode)}" selected>${eh(currentMode)}</option>`:'<option value="">—</option>');

    const btnStyle=`width:24px;height:24px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;padding:0`;

    return `<div style="background:linear-gradient(170deg,#04101e 0%,#081828 55%,#050d18 100%);border-radius:14px;overflow:hidden;color:#fff;font-family:inherit;user-select:none;height:100%;display:flex;flex-direction:column">

<!-- HEADER -->
<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px 6px;background:linear-gradient(90deg,rgba(6,30,60,.75),rgba(4,15,30,.3));flex-shrink:0">
  <div style="display:flex;align-items:center;gap:6px">
    <div style="width:24px;height:24px;border-radius:7px;background:${power?'rgba(74,222,128,.15)':'rgba(255,255,255,.05)'};border:1px solid ${power?'rgba(74,222,128,.3)':'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;font-size:13px">🌿</div>
    <div>
      <div style="font-size:11px;font-weight:800;color:#fff">${eh(card.label||'LetPot Max')}</div>
      <div style="font-size:7px;color:#fff">${stageInfo.icon} ${stageInfo.name}${plantsAge&&plantsAge!=='unknown'?' · G.'+plantsAge:''}</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:5px">
    <div data-lp-update="power" data-lp-action="power" style="background:${power?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)'};border:1px solid ${power?'rgba(74,222,128,.3)':'rgba(248,113,113,.28)'};border-radius:5px;padding:2px 7px;font-size:8px;font-weight:700;color:${power?'#4ade80':'#f87171'}">${power?'● ON':'○ OFF'}</div>
    <button data-lp-opencfg style="width:22px;height:22px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">⚙️</button>
  </div>
</div>

<!-- CONTROLLI LUCE (compatti) -->
<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(0,0,0,.3);flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.05)">
  <span style="font-size:9px;flex-shrink:0">🌅</span>
  <input type="time" data-lp-action="ton" value="${lightOnVal}" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:5px;color:#fff;font-size:8px;padding:2px 4px;color-scheme:dark;width:58px;flex-shrink:0">
  <span style="font-size:7px;color:#fff;flex-shrink:0">→</span>
  <span style="font-size:9px;flex-shrink:0">🌙</span>
  <input type="time" data-lp-action="toff" value="${lightOffVal}" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:5px;color:#fff;font-size:8px;padding:2px 4px;color-scheme:dark;width:58px;flex-shrink:0">
  <div style="flex:1"></div>
  <button data-lp-action="br-dn" style="${btnStyle}">−</button>
  <span data-lp-update="bval" style="font-size:10px;color:#fff;font-weight:800;min-width:14px;text-align:center">${lightBr!=='unknown'?lightBr:'—'}</span>
  <span style="font-size:7px;color:#fff">/${brMax}</span>
  <button data-lp-action="br-up" style="${btnStyle}">+</button>
</div>
<div style="padding:3px 8px;background:rgba(0,0,0,.2);flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.04)">
  <select data-lp-action="mode" style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:6px;color:#fff;font-size:9px;padding:3px 6px;color-scheme:dark">${modeOpts}</select>
</div>

<!-- ============================================================ -->
<!-- DEVICE VISUAL: LetPot Max fedele all'originale              -->
<!-- ============================================================ -->
<div style="margin:4px 8px 0;flex-shrink:0;display:flex;flex-direction:column;align-items:center">

  <!-- PANNELLO LED (in cima al palo, orizzontale) -->
  <div style="width:92%;position:relative;margin-bottom:-1px">
    <div style="background:${on?'linear-gradient(180deg,#12082a,#1a0e38)':'linear-gradient(180deg,#0c0c18,#10101e)'};border:2px solid ${on?'rgba(180,50,255,.55)':'rgba(60,60,90,.5)'};border-radius:10px;padding:6px 10px 5px;position:relative;overflow:hidden;box-shadow:${on?'0 0 24px rgba(160,20,255,.35),inset 0 1px 0 rgba(255,255,255,.06)':'inset 0 1px 0 rgba(255,255,255,.04)'}">
      ${on?`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(180,30,255,.22) 0%,transparent 70%)"></div>`:''}
      <div style="position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:3px;justify-content:center">${buildLeds(on)}</div>
      <div style="display:flex;justify-content:space-between;margin-top:3px;position:relative;z-index:1">
        <span style="font-size:7px;color:#fff;font-weight:600">${on?'💜 36W Full Spectrum':'⬛ Luce spenta'}</span>
        <span style="font-size:7px;color:#fff">✨ <span data-lp-update="bval2">${lightBr!=='unknown'?lightBr:'—'}</span>/${brMax}</span>
      </div>
    </div>
  </div>

  <!-- PALO TELESCOPICO (al centro, tra pannello e tank) -->
  <div style="width:10px;height:22px;background:linear-gradient(to right,#bbb,#888,#bbb);border-radius:0 0 3px 3px;flex-shrink:0;box-shadow:0 2px 4px rgba(0,0,0,.5)"></div>

  <!-- ZONA PIANTE (cresce tra il palo e il coperchio del tank) -->
  <div style="width:100%;position:relative;display:flex;align-items:flex-end;justify-content:center;gap:2px;min-height:${plantAreaH}px;overflow:hidden;padding:0 4px">
    ${on?`<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(180,30,255,.12) 0%,rgba(0,0,0,0) 65%);pointer-events:none"></div>`:''}
    ${plants}
  </div>

  <!-- CORPO DEL TANK (acciaio inossidabile look) -->
  <div style="width:100%;border-radius:10px;overflow:hidden;border:1.5px solid rgba(150,160,190,.3);box-shadow:0 4px 16px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08)">

    <!-- COPERCHIO CON 21 POD (7 visibili in prima fila) -->
    <div style="background:linear-gradient(180deg,#1a2235,#111828);height:22px;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 8px;border-bottom:1px solid rgba(40,100,180,.35)">
      ${[...Array(7)].map((_,i)=>`<div style="width:11px;height:11px;border-radius:50%;background:rgba(${pumpRun&&power?'30,80,160,.7':'20,60,130,.55)'};border:1.5px solid rgba(${pumpRun&&power?'80,150,230,.55':'60,120,200,.4)'};box-shadow:${pumpRun&&power?'inset 0 2px 4px rgba(0,120,255,.2)':'none'}"></div>`).join('')}
    </div>

    <!-- CORPO ACCIAIO: display LCD + indicatori -->
    <div style="background:linear-gradient(180deg,#181a28 0%,#121420 100%);padding:6px 8px;display:flex;align-items:center;gap:8px">

      <!-- DISPLAY LCD (4.8" sul fronte) -->
      <div style="flex:1;background:#030b08;border:1.5px solid rgba(74,222,128,.28);border-radius:7px;padding:5px 7px;min-height:58px;box-shadow:0 0 8px rgba(0,0,0,.5),inset 0 0 12px rgba(0,255,80,.04)">
        <!-- Riga 1: acqua + temp -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:9px;font-weight:700;color:#fff">💧 <span data-lp-update="lcd-w">${waterPct}%</span></span>
          <span style="font-size:9px;font-weight:700;color:#fff">🌡️ <span data-lp-update="lcd-t">${tempVal.toFixed(1)}°</span></span>
        </div>
        <!-- Barra livello acqua -->
        <div style="height:4px;background:rgba(0,0,0,.6);border-radius:2px;margin-bottom:4px;overflow:hidden">
          <div data-lp-update="lcd-bar" style="height:100%;width:${waterPct}%;background:${waterCol};border-radius:2px;transition:width 1.4s ease"></div>
        </div>
        <!-- Riga 2: fase + età -->
        <div style="margin-bottom:3px">
          <span style="font-size:8px;font-weight:700;color:${stageInfo.col}">${stageInfo.icon} ${stageInfo.name}</span>
          ${plantsAge&&plantsAge!=='unknown'?`<span style="font-size:7px;color:#fff;margin-left:4px">· G.${plantsAge}</span>`:''}
        </div>
        <!-- Riga 3: modalità + pompa -->
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:7px;color:#fff">${currentMode&&currentMode!=='unknown'?currentMode.slice(0,14):''}</span>
          <span data-lp-update="lcd-pump" style="font-size:7px;font-weight:700;color:${pumpRun&&power?'#4ade80':'#fff'};animation:${pumpRun&&power?'lp-lcd-blink 2s ease-in-out infinite':''}">${pumpRun&&power?'⚙ POMPA ON':''}</span>
        </div>
      </div>

      <!-- POMPA (pulsante sul fianco) -->
      <div data-lp-action="${pumpIsSwitch?'pump':''}" data-lp-update="pumpbtn" style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;${pumpIsSwitch?'cursor:pointer':''}">
        <div style="width:32px;height:32px;border-radius:50%;background:${pumpRun&&power?'rgba(74,222,128,.15)':'rgba(255,255,255,.06)'};border:2px solid ${pumpRun&&power?'rgba(74,222,128,.4)':'rgba(255,255,255,.12)'};display:flex;align-items:center;justify-content:center">
          <span data-lp-update="gear" style="font-size:15px;display:inline-block;${pumpRun&&power?'animation:lp-spin 1s linear infinite':'opacity:.3'}">⚙️</span>
        </div>
        <span data-lp-update="pumptxt" style="font-size:6px;color:#fff;font-weight:600;text-align:center;line-height:1.1">${pumpRun&&power?'ATTIVA':'FERMA'}</span>
      </div>
    </div>

    <!-- SERBATOIO ACQUA (parte bassa visibile come "finestra" trasparente) -->
    <div style="position:relative;height:52px;overflow:hidden;background:#040c14;border-top:1px solid rgba(20,80,160,.3)">
      <!-- Etichette acqua / temp -->
      <div data-lp-update="wtext" style="position:absolute;top:3px;left:6px;font-size:8px;font-weight:800;color:${waterCol};z-index:5">💧 ${waterPct}%</div>
      <div data-lp-update="temp" style="position:absolute;top:3px;right:6px;font-size:8px;font-weight:700;color:${tempCol};z-index:5">🌡️ ${tempVal.toFixed(1)}°</div>
      <!-- Acqua animata -->
      <div data-lp-update="fill" style="position:absolute;bottom:0;left:0;right:0;height:${waterH}px;transition:height 1.4s ease;z-index:2">
        <svg style="position:absolute;top:-16px;left:0;width:200%;animation:lp-wave ${pumpRun&&power?'1.8s':'3.5s'} linear infinite" viewBox="0 0 800 18" preserveAspectRatio="none">
          <path d="M0,9C60,0 120,18 180,9C240,0 300,18 360,9C420,0 480,18 540,9C600,0 660,18 720,9C780,0 800,18 800,9L800,18L0,18Z" fill="rgba(18,80,160,.92)"/>
          <path d="M0,13C80,4 160,18 240,13C320,4 400,18 480,13C560,4 640,18 720,13L800,13L800,18L0,18Z" fill="rgba(10,50,110,.78)"/>
        </svg>
        <div style="position:absolute;top:16px;left:0;right:0;bottom:0;background:linear-gradient(rgba(16,80,158,.9),rgba(6,44,102,.97))"></div>
        ${on?`<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent 25%,rgba(180,60,255,.04) 50%,transparent 75%);z-index:2"></div>`:''}
        <!-- Bolle -->
        <div style="position:absolute;inset:0;z-index:3">${bubs}</div>
        <!-- Ripple pompa -->
        <div style="position:absolute;bottom:8px;left:50%;z-index:4;width:0;height:0">${ripple}</div>
      </div>
    </div>

  </div><!-- fine tank -->
</div><!-- fine device -->

<!-- BARRA CICLO POMPA 30min -->
${pumpCycl&&cb?`
<div style="display:flex;align-items:center;gap:5px;padding:4px 10px;flex-shrink:0">
  <div style="font-size:8px;color:#fff;font-weight:700;flex-shrink:0">♻️ <span data-lp-update="cyctxt">${cb.label}</span></div>
  <div style="flex:1;height:5px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden">
    <div data-lp-update="cycbar" style="height:100%;width:${cb.pct}%;background:${cb.col};border-radius:3px;transition:width .4s linear"></div>
  </div>
  <div style="font-size:7px;color:#fff;flex-shrink:0">30m</div>
</div>`:''}

<!-- STATS -->
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px 10px;flex-shrink:0">
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:4px;text-align:center">
    <div style="font-size:6px;color:#fff;text-transform:uppercase;letter-spacing:.5px">Acqua</div>
    <div data-lp-update="wval" style="font-size:13px;font-weight:900;color:${waterCol}">${waterPct}%</div>
    <div style="font-size:9px">💧</div>
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:4px;text-align:center">
    <div style="font-size:6px;color:#fff;text-transform:uppercase;letter-spacing:.5px">Temp</div>
    <div data-lp-update="tval" style="font-size:13px;font-weight:900;color:${tempCol}">${tempVal.toFixed(1)}°</div>
    <div style="font-size:9px">🌡️</div>
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:4px;text-align:center">
    <div style="font-size:6px;color:#fff;text-transform:uppercase;letter-spacing:.5px">Giorno</div>
    <div data-lp-update="aval" style="font-size:13px;font-weight:900;color:#86efac">${plantsAge!=='unknown'?plantsAge:'—'}</div>
    <div style="font-size:9px">🌱</div>
  </div>
</div>

<!-- CHIPS + ALERT -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:4px;padding:0 10px 8px;flex:1;align-content:end">
  <div data-lp-action="auto" data-lp-update="chip-auto" style="background:${autoMode?'rgba(74,222,128,.12)':'rgba(255,255,255,.05)'};border:1px solid ${autoMode?'rgba(74,222,128,.3)':'rgba(255,255,255,.1)'};border-radius:7px;padding:4px 2px;text-align:center">
    <div style="font-size:6px;color:#fff">Auto</div>
    <b style="font-size:8px;color:${autoMode?'#4ade80':'#fff'}">${autoMode?'ON':'OFF'}</b>
  </div>
  <div data-lp-action="cycl" data-lp-update="chip-cycl" style="background:${pumpCycl?'rgba(74,222,128,.12)':'rgba(255,255,255,.05)'};border:1px solid ${pumpCycl?'rgba(74,222,128,.3)':'rgba(255,255,255,.1)'};border-radius:7px;padding:4px 2px;text-align:center">
    <div style="font-size:6px;color:#fff">Ciclo</div>
    <b style="font-size:8px;color:${pumpCycl?'#4ade80':'#fff'}">${pumpCycl?'ON':'OFF'}</b>
  </div>
  <div data-lp-update="al-nutr" style="background:${lowNutr?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${lowNutr?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)'};border-radius:7px;padding:4px 2px;text-align:center">
    <div style="font-size:10px">🧪</div>
    <div style="font-size:7px;font-weight:700;color:${lowNutr?'#f87171':'#4ade80'}">${lowNutr?'⚠️':'✓'}</div>
  </div>
  <div data-lp-update="al-water" style="background:${lowWater?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${lowWater?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)'};border-radius:7px;padding:4px 2px;text-align:center">
    <div style="font-size:10px">💧</div>
    <div style="font-size:7px;font-weight:700;color:${lowWater?'#f87171':'#4ade80'}">${lowWater?'⚠️':'✓'}</div>
  </div>
  <div data-lp-update="al-refill" style="background:${refillErr?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${refillErr?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)'};border-radius:7px;padding:4px 2px;text-align:center">
    <div style="font-size:10px">🔄</div>
    <div style="font-size:7px;font-weight:700;color:${refillErr?'#f87171':'#4ade80'}">${refillErr?'⚠️':'✓'}</div>
  </div>
</div>

</div>`;
  }

  /* ── MOUNT ── */
  function mount(card, rawHass, el){
    injectStyles();
    if(_mounted.has(el)) return;
    _mounted.add(el);

    // 1s interval per timer
    const tid=setInterval(()=>{
      if(!document.body.contains(el)){clearInterval(tid);_intervals.delete(el);return;}
      const ent=getEnt(card),h=H();
      const pumpCycl=isOn(localSwState(card,ent.pumpCyclingEntity,stateOf(h,ent.pumpCyclingEntity)));
      if(!pumpCycl) return;
      const cb=cycleBarData();
      const bar=el.querySelector('[data-lp-update="cycbar"]');
      const txt=el.querySelector('[data-lp-update="cyctxt"]');
      if(bar){bar.style.width=cb.pct+'%';bar.style.background=cb.col;}
      if(txt) txt.textContent=cb.label;
    },1000);
    _intervals.set(el,tid);

    el.addEventListener('click',function(e){
      if(e.target.closest('[data-lp-opencfg]')){configure(card);return;}
      const tgt=e.target.closest('[data-lp-action]');
      if(!tgt) return;
      const action=tgt.dataset.lpAction;
      if(!action) return;
      const ent=getEnt(card),h=H();

      if(action==='power'){
        if(!ent.powerEntity) return;
        const next=doToggle(card,ent.powerEntity);
        const pw=el.querySelector('[data-lp-update="power"]');
        if(pw&&next!==null){const on=next==='on';pw.textContent=on?'● ON':'○ OFF';pw.style.color=on?'#4ade80':'#f87171';pw.style.background=on?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)';pw.style.borderColor=on?'rgba(74,222,128,.3)':'rgba(248,113,113,.28)';}
      }
      else if(action==='pump'){
        if(!ent.pumpEntity||!ent.pumpEntity.startsWith('switch.')) return;
        doToggle(card,ent.pumpEntity);
      }
      else if(action==='auto'){
        if(!ent.autoModeEntity) return;
        const next=doToggle(card,ent.autoModeEntity);
        _updateChip(el,'chip-auto',next==='on');
      }
      else if(action==='cycl'){
        if(!ent.pumpCyclingEntity) return;
        const next=doToggle(card,ent.pumpCyclingEntity);
        _updateChip(el,'chip-cycl',next==='on');
      }
      else if(action==='br-up'||action==='br-dn'){
        if(!ent.lightBrightnessEntity) return;
        const attrs=h?.states?.[ent.lightBrightnessEntity]?.attributes||{};
        const haVal=parseFloat(stateOf(h,ent.lightBrightnessEntity))||5;
        const lbr=_localBr[card.id];
        const cur=(lbr&&Date.now()-lbr.ts<5000)?lbr.v:haVal;
        const step=parseFloat(attrs.step)||1;
        const min=parseFloat(attrs.min)||1,max=parseFloat(attrs.max)||10;
        const nv=Math.min(max,Math.max(min,cur+(action==='br-up'?step:-step)));
        _localBr[card.id]={v:nv,ts:Date.now()};
        setNumberEnt(ent.lightBrightnessEntity,nv);
        el.querySelectorAll('[data-lp-update="bval"],[data-lp-update="bval2"]').forEach(b=>{if(b)b.textContent=nv;});
      }
    });

    el.addEventListener('change',function(e){
      const tgt=e.target.closest('[data-lp-action]');
      if(!tgt) return;
      const action=tgt.dataset.lpAction, ent=getEnt(card);
      if(action==='ton' &&ent.lightOnEntity)  setTimeEnt(ent.lightOnEntity,tgt.value);
      if(action==='toff'&&ent.lightOffEntity) setTimeEnt(ent.lightOffEntity,tgt.value);
      if(action==='mode'&&ent.lightModeEntity) setSelectEnt(ent.lightModeEntity,tgt.value);
    });
  }

  function _updateChip(el,upd,on){
    const c=el.querySelector(`[data-lp-update="${upd}"]`);
    if(!c) return;
    c.style.background=on?'rgba(74,222,128,.12)':'rgba(255,255,255,.05)';
    c.style.borderColor=on?'rgba(74,222,128,.3)':'rgba(255,255,255,.1)';
    const b=c.querySelector('b');
    if(b){b.textContent=on?'ON':'OFF';b.style.color=on?'#4ade80':'#fff';}
  }
  function _updateAlert(el,upd,bad){
    const a=el.querySelector(`[data-lp-update="${upd}"]`);
    if(!a) return;
    a.style.background=bad?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)';
    a.style.borderColor=bad?'rgba(248,113,113,.3)':'rgba(74,222,128,.16)';
    const d=a.querySelector('[style*="font-weight:700"]');
    if(d){d.textContent=bad?'⚠️':'✓';d.style.color=bad?'#f87171':'#4ade80';}
  }

  /* ── UPDATE ── */
  function update(card, rawHass, el){
    try{
      const v=computeValues(card,rawHass);
      const{power,autoMode,pumpCycl,pumpRun,lightBr,brMax,on,
            lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
            tempCol,waterCol,waterH,stage,cb,currentMode,stageInfo:si}=v;
      const SI=STAGES[v.stage];

      if(_lastStage[card.id]!==undefined&&_lastStage[card.id]!==stage){
        _lastStage[card.id]=stage; el.innerHTML=render(card,rawHass); return;
      }
      _lastStage[card.id]=stage;

      const qu=n=>el.querySelector(`[data-lp-update="${n}"]`);

      // Power badge
      const pw=qu('power');
      if(pw){pw.textContent=power?'● ON':'○ OFF';pw.style.color=power?'#4ade80':'#f87171';pw.style.background=power?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)';pw.style.borderColor=power?'rgba(74,222,128,.3)':'rgba(248,113,113,.28)';}
      // Acqua
      const fill=qu('fill');if(fill)fill.style.height=waterH+'px';
      const wt=qu('wtext');if(wt){wt.textContent='💧 '+waterPct+'%';wt.style.color=waterCol;}
      const wv=qu('wval');if(wv){wv.textContent=waterPct+'%';wv.style.color=waterCol;}
      // LCD
      const lw=qu('lcd-w');if(lw) lw.textContent=waterPct+'%';
      const lb=qu('lcd-bar');if(lb){lb.style.width=waterPct+'%';lb.style.background=waterCol;}
      const lt=qu('lcd-t');if(lt){lt.textContent=tempVal.toFixed(1)+'°';lt.style.color=tempCol;}
      const lp=qu('lcd-pump');if(lp){lp.textContent=pumpRun&&power?'⚙ POMPA ON':'';lp.style.color=pumpRun&&power?'#4ade80':'#fff';lp.style.animation=pumpRun&&power?'lp-lcd-blink 2s ease-in-out infinite':'';}
      // Temp
      const tp=qu('temp');if(tp){tp.textContent='🌡️ '+tempVal.toFixed(1)+'°';tp.style.color=tempCol;}
      const tv=qu('tval');if(tv){tv.textContent=tempVal.toFixed(1)+'°';tv.style.color=tempCol;}
      // Età
      const av=qu('aval');if(av) av.textContent=plantsAge!=='unknown'?plantsAge:'—';
      // Pompa
      const gear=qu('gear');if(gear){gear.style.animation=pumpRun&&power?'lp-spin 1s linear infinite':'';gear.style.opacity=pumpRun&&power?'1':'0.3';}
      const pm=qu('pumptxt');if(pm) pm.textContent=pumpRun&&power?'ATTIVA':'FERMA';
      [10,22,35,48,60,73,85,93].forEach((_,i)=>{const b=el.querySelector(`[data-lp-bub="${i}"]`);if(b)b.style.display=pumpRun&&power?'block':'none';});
      // Luminosità
      const lbr=_localBr[card.id];
      if(!lbr||Date.now()-lbr.ts>5000){
        if(lbr) delete _localBr[card.id];
        el.querySelectorAll('[data-lp-update="bval"],[data-lp-update="bval2"]').forEach(b=>{if(b) b.textContent=lightBr!=='unknown'?lightBr:'—';});
      }
      // Chips
      _updateChip(el,'chip-auto',autoMode);
      _updateChip(el,'chip-cycl',pumpCycl);
      // Alert
      _updateAlert(el,'al-nutr',lowNutr);
      _updateAlert(el,'al-water',lowWater);
      _updateAlert(el,'al-refill',refillErr);
    }catch(e){}
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
    const ent=getEnt(card),h=H(),all=h?Object.keys(h.states).sort():[];
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
      inp.addEventListener('input',()=>show(inp.value));inp.addEventListener('focus',()=>show(inp.value));inp.addEventListener('blur',()=>setTimeout(()=>{dr.style.display='none';},150));
      w.appendChild(lb);w.appendChild(inp);w.appendChild(dr);body.appendChild(w);
    });
    const close=()=>ov.remove();
    sh.querySelector('#lp-x').onclick=close;sh.querySelector('#lp-cancel').onclick=close;
    ov.addEventListener('click',e=>{if(e.target===ov)close();});
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc);}});
    sh.querySelector('#lp-save').onclick=()=>{const n={};FIELDS.forEach(f=>{n[f.key]=inputs[f.key].value.trim();});saveEnt(card,n);close();try{window.showToast?.('✅ Impostazioni LetPot Max salvate');}catch(_){}};
    document.body.appendChild(ov);
    const first=FIELDS.find(f=>!ent[f.key]);if(first)inputs[first.key].focus();
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
      'sensor.letpot_max_temperatura':{state:'26.5'},'sensor.letpot_max_plants_age':{state:'45'},
      'switch.letpot_max_pump':{state:'on'},'time.letpot_max_light_on':{state:'06:00:00'},
      'time.letpot_max_light_off':{state:'22:00:00'},
      'number.letpot_max_light_brightness':{state:'7',attributes:{min:1,max:10,step:1}},
      'select.letpot_max_modalita_luce':{state:'Verdure/Erbe',attributes:{options:['Verdure/Erbe','Frutti','Fiori','Erbe aromatiche','Personalizzato']}},
      'binary_sensor.letpot_max_low_water':{state:'off'},'binary_sensor.letpot_max_low_nutrients':{state:'off'},
      'binary_sensor.letpot_max_refill_error':{state:'off'},
    }});
  }

  const CARD={id:ID,name:'LetPot Max',icon:'🌿',desc:'Sistema idroponico LetPot Max 21 pod — layout fedele al device reale',version:'4.0',colSpan:2,rowSpan:3,render,mount,update,configure,preview};
  window.FratechCardRegistry=window.FratechCardRegistry||{};window.FratechCardRegistry[ID]=CARD;
  window.FratechCards=window.FratechCards||{};window.FratechCards[ID]=CARD;
  try{console.log('[FratechStore] letpot-max v4.0');}catch(e){}
})();
