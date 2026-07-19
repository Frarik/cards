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
  const _lastOn    = {};   // track light state for re-render
  const _lastMode  = {};   // track light mode (tonalita') for re-render
  const _lastPumpActive = {}; // track pump running state for re-render
  const _localBr   = {};
  const _localSw   = {};
  const _pumpStart = {};   // timestamp di accensione pompa, per il countdown reale 30min

  function getEnt(card) { try { return JSON.parse(localStorage.getItem(LS(card.id))||'{}'); } catch(e){ return {}; } }
  function saveEnt(card, ent) { try { localStorage.setItem(LS(card.id), JSON.stringify(ent)); } catch(e){} }

  /* ── Servizi HA ── */
  function svc(domain, service, data) {
    try { const h=H(); if(h?.callService) h.callService(domain, service, data); } catch(e){}
  }
  function toggleEnt(entityId) {
    if(!entityId||entityId==='unknown') return;
    const d={input_boolean:'input_boolean'}[entityId.split('.')[0]]||'switch';
    svc(d, isOn(stateOf(H(),entityId))?'turn_off':'turn_on', {entity_id:entityId});
  }
  function setTimeEnt(id, hhmm) {
    if(!id||id==='unknown') return;
    const t=hhmm.length===5?hhmm+':00':hhmm;
    id.startsWith('input_datetime') ? svc('input_datetime','set_datetime',{entity_id:id,time:t}) : svc('time','set_value',{entity_id:id,time:t});
  }
  function setSelectEnt(id, option) {
    if(!id||id==='unknown') return;
    id.startsWith('input_select') ? svc('input_select','select_option',{entity_id:id,option}) : svc('select','select_option',{entity_id:id,option});
  }
  function setNumberEnt(id, value) {
    if(!id||id==='unknown') return;
    id.startsWith('input_number') ? svc('input_number','set_value',{entity_id:id,value}) : svc('number','set_value',{entity_id:id,value});
  }

  /* ── Local state ── */
  function doToggle(card, entityId) {
    if(!entityId||entityId==='unknown') return null;
    const cur=localSwState(card,entityId,stateOf(H(),entityId));
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

  /* ── Timer pompa: countdown reale di 30 minuti dal momento in cui la pompa si attiva ── */
  function pumpTimerData(cardId, active){
    const CYCLE=30*60*1000;
    if(!active){ delete _pumpStart[cardId]; return null; }
    if(!_pumpStart[cardId]) _pumpStart[cardId]=Date.now();
    const rem=CYCLE-(Date.now()-_pumpStart[cardId]);
    if(rem<=0){ delete _pumpStart[cardId]; return null; }
    const pct=Math.max(1,Math.round(rem/CYCLE*100)),col=pct>60?'#4ade80':pct>25?'#facc15':'#f97316';
    const m=Math.floor(rem/60000),s=Math.floor((rem%60000)/1000);
    return{pct,col,label:`${m}:${String(s).padStart(2,'0')}`};
  }

  /* ── Piante SVG ── */
  function plantsSvg(stage, pumpActive, lightOn){
    const CFGS=[
      {n:7,H:[8,10,7,11,9,8,10], W:14,L:5},
      {n:7,H:[22,28,20,30,25,22,26],W:16,L:7},
      {n:8,H:[38,46,42,50,40,44,38,48],W:18,L:10},
      {n:9,H:[56,68,62,72,58,66,60,70,54],W:20,L:13},
      {n:9,H:[72,85,80,90,76,84,78,88,74],W:22,L:16},
      {n:9,H:[80,95,88,100,84,92,86,96,82],W:24,L:18},
    ];
    const c=CFGS[Math.min(stage,5)];
    let svgs='';
    for(let i=0;i<c.n;i++){
      const h=c.H[i]||c.H[0],ls=c.L,delay=(i*.32).toFixed(2),sd=2.3+i*.2,cx=c.W/2+2;
      if(stage===0){
        svgs+=`<svg width="${c.W}" height="${h+2}" viewBox="0 0 ${c.W} ${h+2}" style="flex-shrink:0">
          <line x1="${c.W/2}" y1="${h+2}" x2="${c.W/2}" y2="${h-3}" stroke="#4ade80" stroke-width="1.2" stroke-linecap="round"/>
          <ellipse cx="${c.W/2-4}" cy="${h-4}" rx="4" ry="2" fill="#86efac" opacity=".9" transform="rotate(-30 ${c.W/2-4} ${h-4})"/>
          <ellipse cx="${c.W/2+4}" cy="${h-5}" rx="4" ry="2" fill="#4ade80" opacity=".9" transform="rotate(30 ${c.W/2+4} ${h-5})"/>
        </svg>`;
        continue;
      }
      const sway=`animation:lp-sway ${sd}s ease-in-out ${delay}s infinite;transform-origin:${cx}px ${h+2}px;overflow:visible`;
      let s=`<svg width="${cx*2}" height="${h+6}" viewBox="0 0 ${cx*2} ${h+6}" style="${sway};flex-shrink:0">`;
      s+=`<line x1="${cx}" y1="${h+4}" x2="${cx}" y2="8" stroke="#4ade80" stroke-width="1.6" stroke-linecap="round"/>`;
      const lN=Math.min(stage+1,5);
      for(let j=0;j<lN;j++){
        const ly=h+2-Math.round((j/Math.max(lN-1,1))*(h-10));
        const ang=20+j*4;
        const lf=['#15803d','#16a34a','#22c55e','#166534','#4ade80'][j%5];
        const rf=['#22c55e','#4ade80','#15803d','#22c55e','#86efac'][j%5];
        s+=`<ellipse cx="${cx-Math.round(ls*.5)}" cy="${ly}" rx="${ls}" ry="${Math.round(ls*.37)}" fill="${lf}" opacity=".92" transform="rotate(-${ang} ${cx-Math.round(ls*.5)} ${ly})"/>`;
        s+=`<ellipse cx="${cx+Math.round(ls*.5)}" cy="${ly-Math.round(ls*.18)}" rx="${ls}" ry="${Math.round(ls*.37)}" fill="${rf}" opacity=".88" transform="rotate(${ang} ${cx+Math.round(ls*.5)} ${ly-Math.round(ls*.18)})"/>`;
      }
      if(stage>=5){
        const hr=Math.round(ls*.9);
        s+=`<ellipse cx="${cx}" cy="8" rx="${hr}" ry="${Math.round(hr*1.1)}" fill="#bbf7d0" opacity=".84"/>`;
        s+=`<ellipse cx="${cx-4}" cy="6" rx="${Math.round(hr*.65)}" ry="${Math.round(hr*.82)}" fill="#86efac" opacity=".7"/>`;
        s+=`<ellipse cx="${cx+4}" cy="7" rx="${Math.round(hr*.65)}" ry="${Math.round(hr*.8)}" fill="#4ade80" opacity=".68"/>`;
        if(i%3===0) s+=`<circle cx="${cx+Math.round(ls*.6)}" cy="${Math.round(h*.42)}" r="4.5" fill="#ef4444" opacity=".88"/>`;
        if(i%3===1) s+=`<circle cx="${cx-Math.round(ls*.55)}" cy="${Math.round(h*.55)}" r="3.8" fill="#dc2626" opacity=".82"/>`;
      } else if(stage>=4){
        const hr=Math.round(ls*.75);
        s+=`<ellipse cx="${cx}" cy="8" rx="${hr}" ry="${Math.round(hr*1.05)}" fill="#86efac" opacity=".86"/>`;
        s+=`<ellipse cx="${cx-3}" cy="6" rx="${Math.round(hr*.62)}" ry="${Math.round(hr*.8)}" fill="#4ade80" opacity=".68"/>`;
      } else {
        s+=`<ellipse cx="${cx}" cy="8" rx="${Math.round(ls*.42)}" ry="${Math.round(ls*.54)}" fill="#86efac" opacity=".84"/>`;
      }
      s+='</svg>';
      svgs+=s;
    }
    return svgs;
  }

  /* ── Tonalita' luce in base alla modalita' (sensore modalita' luce) ── */
  const LIGHT_PALETTES = {
    bloom :{bright:[255,105,170],mid:[230,60,150],deep:[150,20,95]},   // Frutti — rosso/rosa
    flower:{bright:[215,110,255],mid:[165,40,220],deep:[110,20,175]},  // Fiori — viola (storico)
    veg   :{bright:[125,195,255],mid:[70,145,235],deep:[20,90,175]},   // Verdure/Erbe — blu vegetativo
    herb  :{bright:[125,255,205],mid:[55,205,160],deep:[15,140,105]},  // Erbe aromatiche — verde acqua
    white :{bright:[255,255,255],mid:[225,228,235],deep:[175,178,190]},// Personalizzato — bianco neutro
  };
  function rgbaC(rgb,a){return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;}
  function modeColor(mode){
    const m=String(mode||'').toLowerCase();
    if(/frutt/.test(m))  return LIGHT_PALETTES.bloom;
    if(/fior/.test(m))   return LIGHT_PALETTES.flower;
    if(/aromat/.test(m)) return LIGHT_PALETTES.herb;
    if(/verdur|veg/.test(m)) return LIGHT_PALETTES.veg;
    if(/personal|custom/.test(m)) return LIGHT_PALETTES.white;
    return LIGHT_PALETTES.flower;
  }

  /* ── Fascio luminoso volumetrico (colore in base alla modalita') ── */
  function lightBeam(pal){
    return `
    <!-- CONO DI LUCE principale -->
    <div style="position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden">
      <!-- Alone diffuso alla sorgente -->
      <div style="position:absolute;left:12%;right:12%;top:-8px;height:24px;background:radial-gradient(ellipse at 50% 0%,${rgbaC(pal.bright,.6)} 0%,transparent 75%);filter:blur(3px)"></div>
      <!-- Fascio volumetrico, bordi sfumati, respira leggermente -->
      <div style="position:absolute;left:6%;right:6%;top:0;bottom:0;
        background:linear-gradient(180deg,${rgbaC(pal.mid,.4)} 0%,${rgbaC(pal.mid,.2)} 40%,${rgbaC(pal.deep,.08)} 72%,transparent 100%);
        clip-path:polygon(23% 0%,77% 0%,97% 100%,3% 100%);filter:blur(2px);transform-origin:top center;animation:lp-beam-pulse 3.4s ease-in-out infinite">
      </div>
      <div style="position:absolute;left:22%;right:22%;top:0;bottom:0;
        background:linear-gradient(180deg,${rgbaC(pal.bright,.5)} 0%,transparent 55%);
        clip-path:polygon(30% 0%,70% 0%,86% 100%,14% 100%);mix-blend-mode:screen;filter:blur(1px)">
      </div>
      <!-- Raggi sottili animati -->
      <div style="position:absolute;left:29%;top:0;width:1.4px;height:68%;background:linear-gradient(180deg,${rgbaC(pal.bright,.6)},transparent);transform:skewX(6deg);transform-origin:top center;animation:lp-shimmer 2.6s ease-in-out infinite"></div>
      <div style="position:absolute;right:29%;top:0;width:1.4px;height:68%;background:linear-gradient(180deg,${rgbaC(pal.bright,.6)},transparent);transform:skewX(-6deg);transform-origin:top center;animation:lp-shimmer 2.6s ease-in-out .5s infinite"></div>
      <div style="position:absolute;left:47%;top:0;width:1px;height:52%;background:linear-gradient(180deg,${rgbaC(pal.mid,.4)},transparent);animation:lp-shimmer 2.2s ease-in-out .3s infinite"></div>
      <div style="position:absolute;right:47%;top:0;width:1px;height:52%;background:linear-gradient(180deg,${rgbaC(pal.mid,.4)},transparent);animation:lp-shimmer 2.2s ease-in-out .8s infinite"></div>
      <!-- Alone ambientale sulle piante -->
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -5%,${rgbaC(pal.mid,.16)} 0%,transparent 72%)"></div>
    </div>`;
  }

  /* ── Riga luminosa del pannello (colore in base alla modalita') ── */
  function lightBar(on,pal){
    return on
      ? `background:${rgbaC(pal.bright,1)};box-shadow:0 0 10px 2px ${rgbaC(pal.mid,.7)},0 0 24px 5px ${rgbaC(pal.mid,.35)}`
      : `background:rgba(255,255,255,.1);box-shadow:none`;
  }

  /* ── Vortice/ripple quando la pompa e' attiva (sempre nel DOM, visibilita' via display) ── */
  function pumpVortex(active){
    const rings=[0,0.6,1.2].map(d=>`<div style="position:absolute;left:16%;bottom:26px;width:10px;height:10px;margin-left:-5px;border-radius:50%;border:1.5px solid rgba(120,200,255,.55);animation:lp-ripple 1.8s ease-out ${d}s infinite"></div>`).join('');
    return `<div data-lp-vortex style="display:${active?'block':'none'};position:absolute;inset:0;z-index:4;pointer-events:none">${rings}</div>`;
  }

  /* ── Pompa sommersa (SINISTRA): corpo con griglia di aspirazione + impeller ── */
  function pumpInWater(pumpRun, power){
    const active=pumpRun&&power;
    const tuboColor=active?'rgba(55,120,210,.85)':'rgba(25,60,120,.4)';
    const bodyBg=active?'linear-gradient(180deg,rgba(35,80,160,.95),rgba(15,40,95,.95))':'linear-gradient(180deg,rgba(20,45,90,.75),rgba(10,25,60,.75))';
    const bodyBorder=active?'rgba(65,138,255,.6)':'rgba(28,65,135,.35)';
    const bodyGlow=active?'0 0 12px rgba(40,120,255,.3)':'none';

    // Gocce che salgono nel tubo di mandata (animate)
    const flowDrops=active?[0,.4,.8].map(d=>`<div style="position:absolute;left:0;right:0;margin:auto;width:3px;height:5px;background:rgba(110,195,255,.8);border-radius:2px;animation:lp-flowUp .9s ease-in ${d}s infinite"></div>`).join(''):'';
    // Risalita verso i pod
    const flowUp=active?[0,.5,1].map(d=>`<div style="position:absolute;width:2.5px;height:7px;background:rgba(90,190,255,.5);border-radius:1px;animation:lp-flowUp 1.1s ease-in ${d}s infinite"></div>`).join(''):'';

    return `
    <!-- POMPA sommersa -->
    <div style="position:absolute;bottom:4px;left:16%;z-index:6;display:flex;flex-direction:column;align-items:center;gap:0">
      <!-- Tubo di mandata (va verso i pod) -->
      <div style="width:4px;height:15px;background:${tuboColor};border-radius:2px 2px 0 0;position:relative;overflow:hidden">
        ${flowDrops}
      </div>
      <!-- Corpo pompa: griglia di aspirazione in basso + impeller -->
      <div style="width:20px;height:24px;background:${bodyBg};border:1.5px solid ${bodyBorder};border-radius:4px 4px 9px 9px;position:relative;box-shadow:${bodyGlow};display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:2px;gap:1.5px">
        ${[0,1,2].map(()=>`<div style="width:12px;height:1.5px;background:rgba(255,255,255,.4);border-radius:1px;flex-shrink:0"></div>`).join('')}
        <div data-lp-update="pump-gear" style="font-size:8px;line-height:1;${active?'animation:lp-spin .7s linear infinite':'opacity:.3'}">⚙</div>
      </div>
    </div>
    <!-- Risalita acqua verso i pod -->
    <div style="position:absolute;left:32%;top:6px;bottom:30px;z-index:5;display:flex;flex-direction:column;justify-content:space-evenly;align-items:center;width:8px">
      ${flowUp}
    </div>`;
  }

  /* ── Vaschetta nutrienti (DESTRA, più grande) — riflette il sensore "nutrienti bassi" configurato ── */
  function nutrientBox(lowNutr){
    const ok=!lowNutr;
    return `
    <div style="position:absolute;bottom:4px;right:10%;z-index:6;display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="width:34px;height:24px;background:linear-gradient(180deg,rgba(20,26,36,.95),rgba(10,14,22,.95));border:1.5px solid ${ok?'rgba(90,110,140,.6)':'rgba(248,113,113,.6)'};border-radius:5px;position:relative;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.45)${ok?'':',0 0 8px rgba(248,113,113,.3)'}">
        <div style="position:absolute;top:3px;left:3px;right:3px;height:3px;border-radius:1px;background:${ok?'linear-gradient(90deg,#ff5a5a,#ffd15a,#5affa0,#5ab0ff)':'rgba(140,145,155,.5)'};opacity:${ok?'.95':'.6'}"></div>
        <div style="position:absolute;bottom:3px;left:0;right:0;display:flex;justify-content:center;gap:3px">
          ${[0,1,2].map(()=>`<div style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,${ok?'.22':'.12'});border:1px solid rgba(255,255,255,.15)"></div>`).join('')}
        </div>
      </div>
      <span style="font-size:5px;color:${ok?'#fff':'#f87171'};font-weight:700;background:rgba(10,14,20,.55);border-radius:3px;padding:0 3px">${ok?'NUTRIENTI':'NUTR. BASSI'}</span>
    </div>`;
  }

  /* ── Stili ── */
  function injectStyles(){
    if(document.getElementById('lp-kf')) return;
    const s=document.createElement('style');s.id='lp-kf';
    s.textContent=`
      @keyframes lp-wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes lp-bubble{0%{transform:translateY(0) scale(1);opacity:.6}85%{opacity:.1}100%{transform:translateY(-70px) scale(1.5);opacity:0}}
      @keyframes lp-sway{0%,100%{transform:rotate(-3.5deg)}50%{transform:rotate(3.5deg)}}
      @keyframes lp-glow{0%,100%{opacity:.38;filter:brightness(.6)}50%{opacity:1;filter:brightness(1.8)}}
      @keyframes lp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes lp-ripple{0%{opacity:.55;transform:scale(.5)}100%{opacity:0;transform:scale(2.6)}}
      @keyframes lp-shimmer{0%,100%{opacity:.55}50%{opacity:1}}
      @keyframes lp-beam-pulse{0%,100%{opacity:.85;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.03)}}
      @keyframes lp-flowUp{0%{transform:translateY(14px);opacity:0}15%{opacity:.75}80%{opacity:.6}100%{transform:translateY(-2px);opacity:0}}
      @keyframes lp-lcd-blink{0%,88%,100%{opacity:1}92%,96%{opacity:.5}}
      [data-lp-action]:not(input):not(select){cursor:pointer}
      [data-lp-action]:not(input):not(select):active{opacity:.6;transform:scale(.92)}
      [data-lp-opensettings]:active{opacity:.6;transform:scale(.92)}
      .lp-sw{width:38px;height:22px;border-radius:11px;background:rgba(255,255,255,.15);position:relative;cursor:pointer;transition:background .2s;flex-shrink:0}
      .lp-sw::after{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s}
      .lp-sw.on{background:#4ade80}
      .lp-sw.on::after{transform:translateX(16px)}
    `;
    document.head.appendChild(s);
  }

  /* ── Valori computati ── */
  function computeValues(card, rawHass){
    const h=liveH(rawHass),e=getEnt(card);
    const power    =isOn(localSwState(card,e.powerEntity,stateOf(h,e.powerEntity)));
    const autoMode =isOn(localSwState(card,e.autoModeEntity,stateOf(h,e.autoModeEntity)));
    const pumpCycl =isOn(localSwState(card,e.pumpCyclingEntity,stateOf(h,e.pumpCyclingEntity)));
    const pumpRun  =isOn(stateOf(h,e.pumpEntity));
    const brHA=stateOf(h,e.lightBrightnessEntity);
    const lbr=_localBr[card.id];
    const lightBr=(lbr&&Date.now()-lbr.ts<5000)?lbr.v:brHA;
    const lightOnT =stateOf(h,e.lightOnEntity);
    const lightOffT=stateOf(h,e.lightOffEntity);
    const currentMode=stateOf(h,e.lightModeEntity);
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
    const pumpActive=pumpRun&&power;
    const cb=pumpTimerData(card.id,pumpActive);
    const waterH=Math.round(92*(waterPct/100)*0.8+6);
    return{power,autoMode,pumpCycl,pumpRun,pumpActive,lightBr,
           currentMode,on,
           lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
           tempCol,waterCol,waterH,stage,cb};
  }

  /* ── RENDER ── */
  function render(card, rawHass){
    const v=computeValues(card,rawHass);
    const{power,pumpRun,pumpActive,on,
          lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
          tempCol,waterCol,waterH,stage,cb,currentMode}=v;
    const pal=modeColor(currentMode);
    const stageInfo=STAGES[stage];
    const plantAreaH=[56,82,118,148,178,206][stage]||148;
    const plants=plantsSvg(stage,pumpActive,on);

    // Bolle acqua (quando pompa attiva, lato sx)
    const bubs=[15,28,40,52,65,78,88].map((_,i)=>{
      const sz=2+(i%3)*1.5;
      return `<div data-lp-bub="${i}" style="position:absolute;bottom:${24+(i%2)*4}px;left:${_}%;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(120,200,255,.5);border:1px solid rgba(160,230,255,.4);animation:lp-bubble ${1.4+i*.18}s ease-in ${(i*.28).toFixed(1)}s infinite;display:${pumpActive?'block':'none'}"></div>`;
    }).join('');

    // Riflessi shimmer sull'acqua (quando luce accesa, colore in base alla modalita')
    const waterShimmer=on?[20,42,65,82].map((l,i)=>`<div style="position:absolute;top:-6px;left:${l}%;width:${6+i*2}px;height:3px;border-radius:2px;background:${rgbaC(pal.bright,.28)};animation:lp-shimmer ${2+i*.4}s ease-in-out ${i*.35}s infinite;z-index:4"></div>`).join(''):'';

    const rid='lp'+Math.random().toString(36).slice(2,8);
    return `<style>#${rid}{position:relative}#${rid}::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(56,189,248,.16) 0%,transparent 65%);pointer-events:none;z-index:0}#${rid} > div{position:relative;z-index:1}</style><div id="${rid}" style="background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:14px;overflow:hidden;color:#fff;font-family:inherit;user-select:none;height:100%;display:flex;flex-direction:column">

<!-- HEADER -->
<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:linear-gradient(90deg,rgba(6,30,60,.75),rgba(4,15,30,.3));flex-shrink:0">
  <div style="display:flex;align-items:center;gap:6px">
    <div style="width:26px;height:26px;border-radius:8px;background:rgba(74,222,128,.1);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:14px;position:relative">
      🌿
      <span data-lp-update="powerdot" style="position:absolute;bottom:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:${power?'#4ade80':'#64748b'};border:1.5px solid #04101e"></span>
    </div>
    <div>
      <div style="font-size:11px;font-weight:800;color:#fff">${eh(card.label||'LetPot Max')}</div>
      <div data-lp-update="stagetxt" style="font-size:7px;color:#fff">${stageInfo.icon} ${stageInfo.name}${plantsAge&&plantsAge!=='unknown'?' · Giorno '+plantsAge:''}</div>
    </div>
  </div>
  <button data-lp-opensettings style="width:26px;height:26px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">⚙️</button>
</div>

<!-- ══════════════════════════════════════════════ -->
<!-- DEVICE: LetPot Max — LED ▸ palo ▸ piante ▸ tank -->
<!-- ══════════════════════════════════════════════ -->
<div style="margin:6px 8px 0;flex-shrink:0;display:flex;flex-direction:column;align-items:center">

  <!-- PANNELLO LED: vista frontale a taglio, colore in base alla modalita' luce -->
  <div style="width:94%;position:relative">
    <div style="background:${on?'linear-gradient(180deg,#171126,#100b1e)':'linear-gradient(180deg,#101020,#0c0c18)'};border:2px solid ${on?rgbaC(pal.mid,.6):'rgba(55,55,85,.5)'};border-radius:50px;height:13px;position:relative;overflow:hidden;box-shadow:${on?`0 0 28px ${rgbaC(pal.mid,.4)},0 0 60px ${rgbaC(pal.mid,.12)}`:'none'};display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px">
      <div style="width:86%;height:3px;border-radius:2px;${lightBar(on,pal)}"></div>
    </div>
    <!-- Alone luce verso il basso dal pannello -->
    ${on?`<div style="position:absolute;left:10%;right:10%;top:100%;height:18px;background:linear-gradient(180deg,${rgbaC(pal.mid,.28)},transparent);pointer-events:none"></div>`:''}
  </div>

  <!-- GAMBO + ZONA PIANTE: il palo attraversa tutta la zona e tocca sempre il bordo della vasca -->
  <div style="width:100%;position:relative;display:flex;align-items:flex-end;justify-content:center;gap:2px;min-height:${plantAreaH}px;padding:0 4px;overflow:hidden">
    <!-- Palo telescopico: dal pannello fino al bordo vasca, mai "nel vuoto" -->
    <div style="position:absolute;left:50%;top:0;bottom:0;width:9px;transform:translateX(-50%);background:linear-gradient(to right,#c0c0c0,#888,#c0c0c0);box-shadow:0 0 4px rgba(0,0,0,.4);z-index:0"></div>
    ${on ? lightBeam(pal) : ''}
    <!-- Piante (sopra il fascio e il palo) -->
    <div style="position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:center;gap:2px;width:100%;height:100%">
      ${plants}
    </div>
  </div>

  <!-- TANK BODY: vasca in acciaio — solo acqua, pompa, vaschetta nutrienti -->
  <div style="width:100%;border-radius:20px 20px 16px 16px;overflow:hidden;border:1.5px solid rgba(255,255,255,.4);box-shadow:0 6px 20px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.5)">

    <!-- SERBATOIO -->
    <div style="position:relative;height:92px;background:linear-gradient(180deg,#1b1f27,#14171d);overflow:hidden">
      <!-- Alert overlay: visibili SOLO se il sensore collegato segnala un problema -->
      <div data-lp-update="al-water" title="Acqua bassa" style="display:${lowWater?'flex':'none'};position:absolute;top:4px;left:4px;z-index:10;width:16px;height:16px;border-radius:50%;background:rgba(248,113,113,.9);align-items:center;justify-content:center;font-size:9px;box-shadow:0 0 8px rgba(248,113,113,.6);animation:lp-glow 1.6s ease-in-out infinite">💧</div>
      <div data-lp-update="al-nutr" title="Nutrienti bassi" style="display:${lowNutr?'flex':'none'};position:absolute;top:4px;right:4px;z-index:10;width:16px;height:16px;border-radius:50%;background:rgba(248,113,113,.9);align-items:center;justify-content:center;font-size:9px;box-shadow:0 0 8px rgba(248,113,113,.6);animation:lp-glow 1.6s ease-in-out infinite">🧪</div>
      <div data-lp-update="al-refill" title="Errore ricarica" style="display:${refillErr?'flex':'none'};position:absolute;bottom:4px;left:4px;z-index:10;width:16px;height:16px;border-radius:50%;background:rgba(248,113,113,.9);align-items:center;justify-content:center;font-size:9px;box-shadow:0 0 8px rgba(248,113,113,.6);animation:lp-glow 1.6s ease-in-out infinite">🔄</div>

      <!-- Acqua animata: l'onda e' la superficie reale, sempre visibile SOPRA il livello -->
      <div data-lp-update="fill" style="position:absolute;bottom:0;left:0;right:0;height:${waterH}px;transition:height 1.4s ease;z-index:2;overflow:visible">
        <!-- Corpo acqua: il pieno inizia SOTTO la cresta dell'onda (mai a filo piatto) -->
        <div style="position:absolute;left:0;right:0;top:14px;bottom:0;background:linear-gradient(rgba(14,75,152,.9),rgba(5,42,100,.97))"></div>
        <!-- Onda: cresta ben sopra il pelo dell'acqua, disegnata per prima e in cima a tutto -->
        <svg style="position:absolute;top:-14px;left:0;width:200%;height:28px;z-index:4;animation:lp-wave ${pumpActive?'1.6s':'3.2s'} linear infinite" viewBox="0 0 800 40" preserveAspectRatio="none">
          <path d="M0,20C60,4 120,36 180,20C240,4 300,36 360,20C420,4 480,36 540,20C600,4 660,36 720,20C780,4 800,36 800,20L800,40L0,40Z" fill="rgba(16,76,155,.92)"/>
          <path d="M0,26C80,10 160,36 240,26C320,10 400,36 480,26C560,10 640,36 720,26L800,26L800,40L0,40Z" fill="rgba(8,48,108,.85)"/>
        </svg>
        <!-- Riflesso luce sulla superficie dell'acqua (colore in base alla modalita') -->
        ${waterShimmer}
        <!-- Bolle di risalita -->
        <div style="position:absolute;inset:0;z-index:3">${bubs}</div>
        <!-- Vortice/ripple quando la pompa e' attiva -->
        ${pumpVortex(pumpActive)}
        <!-- POMPA e RICIRCOLO dentro l'acqua -->
        ${pumpInWater(pumpRun,power)}
        <!-- Vaschetta nutrienti galleggiante -->
        ${nutrientBox(lowNutr)}
      </div>
    </div>

  </div>
</div><!-- /device -->

<!-- TIMER POMPA: visibile SOLO mentre la pompa e' realmente attiva, countdown reale di 30 minuti -->
<div data-lp-timerwrap style="display:${cb?'flex':'none'};align-items:center;gap:5px;padding:4px 10px 0;flex-shrink:0">
  <span style="font-size:8px;color:#fff;font-weight:700;flex-shrink:0">⏱️ <span data-lp-update="cyctxt">${cb?cb.label:''}</span></span>
  <div style="flex:1;height:5px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden">
    <div data-lp-update="cycbar" style="height:100%;width:${cb?cb.pct:0}%;background:${cb?cb.col:'#4ade80'};border-radius:3px;transition:width .4s linear"></div>
  </div>
</div>

<!-- STATS: solo cio' che l'utente vuole vedere a colpo d'occhio -->
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:6px 10px 10px;flex:1;align-content:end">
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:5px;text-align:center">
    <div style="font-size:6px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.5px">Acqua</div>
    <div data-lp-update="wval" style="font-size:14px;font-weight:900;color:${waterCol}">${waterPct}%</div>
    <div style="font-size:10px">💧</div>
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:5px;text-align:center">
    <div style="font-size:6px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.5px">Temp</div>
    <div data-lp-update="tval" style="font-size:14px;font-weight:900;color:${tempCol}">${tempVal.toFixed(1)}°</div>
    <div style="font-size:10px">🌡️</div>
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:5px;text-align:center">
    <div style="font-size:6px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.5px">Giorno</div>
    <div data-lp-update="aval" style="font-size:14px;font-weight:900;color:#86efac">${plantsAge!=='unknown'?plantsAge:'—'}</div>
    <div style="font-size:10px">🌱</div>
  </div>
</div>

</div>`;
  }

  /* ── MOUNT ── */
  function mount(card, rawHass, el){
    injectStyles();
    if(_mounted.has(el)) return;
    _mounted.add(el);

    // Tick veloce: countdown pompa (secondo per secondo)
    const tid=setInterval(()=>{
      if(!document.body.contains(el)){clearInterval(tid);clearInterval(tidClock);_intervals.delete(el);return;}
      const ent=getEnt(card),h=H();
      const power=isOn(localSwState(card,ent.powerEntity,stateOf(h,ent.powerEntity)));
      const pumpRun=isOn(stateOf(h,ent.pumpEntity));
      const active=pumpRun&&power;
      const cb=pumpTimerData(card.id,active);
      const wrap=el.querySelector('[data-lp-timerwrap]');
      if(wrap) wrap.style.display=cb?'flex':'none';
      if(cb){
        const bar=el.querySelector('[data-lp-update="cycbar"]');
        const txt=el.querySelector('[data-lp-update="cyctxt"]');
        if(bar){bar.style.width=cb.pct+'%';bar.style.background=cb.col;}
        if(txt) txt.textContent=cb.label;
      }
    },1000);
    // Tick lento: ricontrolla l'orario programmato della luce anche senza aggiornamenti HA
    const tidClock=setInterval(()=>{
      if(!document.body.contains(el)) return;
      update(card,rawHass,el);
    },20000);
    _intervals.set(el,tid);

    el.addEventListener('click',function(e){
      if(e.target.closest('[data-lp-opensettings]')){openSettings(card,el);return;}
    });
  }

  function _updateAlert(el,upd,bad){
    const a=el.querySelector(`[data-lp-update="${upd}"]`);if(!a)return;
    a.style.display=bad?'flex':'none';
  }

  /* ── UPDATE ── */
  function update(card, rawHass, el){
    try{
      const v=computeValues(card,rawHass);
      const{power,on,pumpActive,
            lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,
            tempCol,waterCol,waterH,stage,currentMode}=v;

      // Re-render se cambia luce/fase/modalita'/pompa (impattano il visual completo)
      const stageDiff=_lastStage[card.id]!==undefined&&_lastStage[card.id]!==stage;
      const onDiff=_lastOn[card.id]!==undefined&&_lastOn[card.id]!==on;
      const modeDiff=_lastMode[card.id]!==undefined&&_lastMode[card.id]!==currentMode;
      const pumpDiff=_lastPumpActive[card.id]!==undefined&&_lastPumpActive[card.id]!==pumpActive;
      if(stageDiff||onDiff||modeDiff||pumpDiff){
        _lastStage[card.id]=stage;_lastOn[card.id]=on;_lastMode[card.id]=currentMode;_lastPumpActive[card.id]=pumpActive;
        el.innerHTML=render(card,rawHass); return;
      }
      _lastStage[card.id]=stage;_lastOn[card.id]=on;_lastMode[card.id]=currentMode;_lastPumpActive[card.id]=pumpActive;

      const qu=n=>el.querySelector(`[data-lp-update="${n}"]`);

      const pd=qu('powerdot'); if(pd) pd.style.background=power?'#4ade80':'#64748b';
      const fill=qu('fill');if(fill)fill.style.height=waterH+'px';
      const wv=qu('wval');if(wv){wv.textContent=waterPct+'%';wv.style.color=waterCol;}
      const tv=qu('tval');if(tv){tv.textContent=tempVal.toFixed(1)+'°';tv.style.color=tempCol;}
      const av=qu('aval');if(av)av.textContent=plantsAge!=='unknown'?plantsAge:'—';
      const st=qu('stagetxt');if(st){const si=STAGES[stage];st.textContent=`${si.icon} ${si.name}${plantsAge&&plantsAge!=='unknown'?' · Giorno '+plantsAge:''}`;}
      _updateAlert(el,'al-nutr',lowNutr);
      _updateAlert(el,'al-water',lowWater);
      _updateAlert(el,'al-refill',refillErr);
    }catch(e){}
  }

  /* ── IMPOSTAZIONI operative (pannello a comparsa dal basso) ── */
  function openSettings(card, el){
    const ent=getEnt(card), h=H();
    const power   =isOn(localSwState(card,ent.powerEntity,stateOf(h,ent.powerEntity)));
    const autoMode=isOn(localSwState(card,ent.autoModeEntity,stateOf(h,ent.autoModeEntity)));
    const pumpCycl=isOn(localSwState(card,ent.pumpCyclingEntity,stateOf(h,ent.pumpCyclingEntity)));
    const pumpRun =isOn(localSwState(card,ent.pumpEntity,stateOf(h,ent.pumpEntity)));
    const pumpIsSwitch=ent.pumpEntity?.split('.')?.[0]==='switch';
    const lightOnT=stateOf(h,ent.lightOnEntity), lightOffT=stateOf(h,ent.lightOffEntity);
    const lightOnVal =lightOnT !=='unknown'?String(lightOnT).slice(0,5):'';
    const lightOffVal=lightOffT!=='unknown'?String(lightOffT).slice(0,5):'';
    const brHA=stateOf(h,ent.lightBrightnessEntity);
    const lbrLocal=_localBr[card.id];
    let brCur=(lbrLocal&&Date.now()-lbrLocal.ts<5000)?lbrLocal.v:brHA;
    const brMax=parseFloat(attrOf(h,ent.lightBrightnessEntity,'max'))||10;
    const currentMode=stateOf(h,ent.lightModeEntity);
    const modeOptions=attrOf(h,ent.lightModeEntity,'options')||[];
    const modeOpts=modeOptions.length
      ?modeOptions.map(o=>`<option value="${eh(o)}" ${o===currentMode?'selected':''}>${eh(o)}</option>`).join('')
      :(currentMode&&currentMode!=='unknown'?`<option value="${eh(currentMode)}" selected>${eh(currentMode)}</option>`:'<option value="">—</option>');

    const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);display:flex;align-items:flex-end';
    const sh=document.createElement('div');sh.style.cssText='width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;color:#fff;overflow:hidden';
    ov.appendChild(sh);

    function swRow(label,icon,checked,action){
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 2px;border-bottom:1px solid rgba(255,255,255,.06)">
        <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:#fff">${icon} ${label}</span>
        <div class="lp-sw ${checked?'on':''}" data-sw-action="${action}"></div>
      </div>`;
    }

    sh.innerHTML=`<div style="display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
      <div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;flex-shrink:0">⚙️</div>
      <div style="flex:1;font-size:16px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">Impostazioni LetPot</div>
      <button id="lps-x" style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);flex-shrink:0">✕</button>
    </div>
    <div id="lps-body" style="flex:1;overflow-y:auto;padding:16px 20px 12px;scrollbar-width:thin">
      ${swRow('Alimentazione','🔌',power,'power')}
      ${pumpIsSwitch?swRow('Pompa','⚙️',pumpRun,'pump'):''}
      ${swRow('Modalità automatica','🤖',autoMode,'auto')}
      ${swRow('Ricircolo a cicli','♻️',pumpCycl,'cycl')}
      <div style="padding:14px 0 6px;font-size:10px;color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Illuminazione</div>
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0">
        <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#fff;width:78px;flex-shrink:0">🌅 Accensione</span>
        <input type="time" id="lps-ton" value="${lightOnVal}" style="flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#fff;font-size:12px;padding:6px 8px;color-scheme:dark">
      </div>
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0 14px">
        <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#fff;width:78px;flex-shrink:0">🌙 Spegnimento</span>
        <input type="time" id="lps-toff" value="${lightOffVal}" style="flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#fff;font-size:12px;padding:6px 8px;color-scheme:dark">
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:6px 0 14px">
        <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#fff;flex:1">✨ Luminosità</span>
        <button id="lps-brdn" style="width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;font-size:16px;cursor:pointer">−</button>
        <span id="lps-brval" style="font-size:13px;font-weight:800;min-width:22px;text-align:center">${brCur!=='unknown'&&brCur!==undefined?brCur:'—'}</span>
        <span style="font-size:10px;color:#fff">/${brMax}</span>
        <button id="lps-brup" style="width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;font-size:16px;cursor:pointer">+</button>
      </div>
      <div style="padding-bottom:16px">
        <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#fff;display:block;margin-bottom:5px">🎛️ Modalità luce</span>
        <select id="lps-mode" style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:9px;color:#fff;font-size:12px;padding:8px 10px;color-scheme:dark">${modeOpts}</select>
      </div>
      <button id="lps-cfg" style="width:100%;padding:9px;border-radius:10px;border:1px dashed rgba(255,255,255,.2);background:transparent;color:#fff;font-size:11px;cursor:pointer;margin-bottom:6px">🔧 Collega entità (setup avanzato)</button>
    </div>
    <div style="padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
      <button id="lps-close" style="width:100%;padding:12px;border-radius:11px;border:none;background:#38bdf8;color:#fff;font-weight:800;cursor:pointer;font-size:13px">Chiudi</button>
    </div>`;

    const close=()=>ov.remove();
    sh.querySelector('#lps-x').onclick=close;
    sh.querySelector('#lps-close').onclick=close;
    ov.addEventListener('click',e=>{if(e.target===ov)close();});
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc);}});

    const keyMap={power:'powerEntity',pump:'pumpEntity',auto:'autoModeEntity',cycl:'pumpCyclingEntity'};
    sh.querySelectorAll('.lp-sw').forEach(sw=>{
      sw.addEventListener('click',()=>{
        const action=sw.dataset.swAction, id=ent[keyMap[action]];
        if(!id) return;
        const next=doToggle(card,id);
        if(next!==null) sw.classList.toggle('on',next==='on');
      });
    });

    sh.querySelector('#lps-ton').addEventListener('change',e=>{if(ent.lightOnEntity) setTimeEnt(ent.lightOnEntity,e.target.value);});
    sh.querySelector('#lps-toff').addEventListener('change',e=>{if(ent.lightOffEntity) setTimeEnt(ent.lightOffEntity,e.target.value);});
    sh.querySelector('#lps-mode').addEventListener('change',e=>{if(ent.lightModeEntity) setSelectEnt(ent.lightModeEntity,e.target.value);});

    function stepBr(dir){
      if(!ent.lightBrightnessEntity) return;
      const attrs=h?.states?.[ent.lightBrightnessEntity]?.attributes||{};
      const step=parseFloat(attrs.step)||1,min=parseFloat(attrs.min)||1,max=parseFloat(attrs.max)||10;
      const base=parseFloat(brCur)||min;
      const nv=Math.min(max,Math.max(min,base+(dir*step)));
      brCur=nv;
      _localBr[card.id]={v:nv,ts:Date.now()};
      setNumberEnt(ent.lightBrightnessEntity,nv);
      sh.querySelector('#lps-brval').textContent=nv;
    }
    sh.querySelector('#lps-brup').onclick=()=>stepBr(1);
    sh.querySelector('#lps-brdn').onclick=()=>stepBr(-1);

    sh.querySelector('#lps-cfg').onclick=()=>{close();configure(card);};

    document.body.appendChild(ov);
  }

  /* ── CONFIGURE (collegamento entita', invocato dalla piattaforma o dal pannello impostazioni) ── */
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
    const ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);display:flex;align-items:flex-end';
    const sh=document.createElement('div');sh.style.cssText='width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;color:#fff;overflow:hidden';
    ov.appendChild(sh);
    sh.innerHTML=`<div style="display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0"><div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;flex-shrink:0">🌿</div><div style="flex:1;font-size:16px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">Configura LetPot Max</div><button id="lp-x" style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);flex-shrink:0">✕</button></div><div id="lp-body" style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin"></div><div style="display:flex;gap:8px;padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0"><button id="lp-save" style="flex:1;padding:12px;border-radius:11px;border:none;background:#38bdf8;color:#fff;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button><button id="lp-cancel" style="flex:0 0 80px;padding:12px;border-radius:11px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font-size:13px">Annulla</button></div>`;
    const body=sh.querySelector('#lp-body'),inputs={};
    FIELDS.forEach(f=>{
      const w=document.createElement('div');w.style.cssText='position:relative';
      const lb=document.createElement('div');lb.style.cssText='font-size:10px;color:#fff;margin-bottom:4px;font-weight:800;text-transform:uppercase;letter-spacing:.05em';lb.textContent=f.label;
      const inp=document.createElement('input');inp.value=ent[f.key]||'';inp.placeholder=f.domains[0]+'.*';inp.autocomplete='off';inp.spellcheck=false;
      inp.style.cssText='width:100%;padding:9px 11px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:12px;box-sizing:border-box;outline:none';
      inputs[f.key]=inp;
      const dr=document.createElement('div');dr.style.cssText='display:none;position:absolute;left:0;right:0;top:100%;background:#0d1a2e;border:1px solid rgba(129,140,248,.4);border-top:none;border-radius:0 0 10px 10px;max-height:160px;overflow-y:auto;z-index:500;scrollbar-width:thin';
      function show(t){const q=t.toLowerCase();const res=all.filter(k=>f.domains.some(d=>k.startsWith(d+'.'))&&(!q||k.toLowerCase().includes(q))).sort((a,b)=>{const ap=a.toLowerCase().startsWith(q),bp=b.toLowerCase().startsWith(q);return ap&&!bp?-1:!ap&&bp?1:a.localeCompare(b);}).slice(0,10);if(!res.length){dr.style.display='none';return;}dr.innerHTML='';res.forEach(s=>{const item=document.createElement('div');item.textContent=s;item.style.cssText='padding:8px 11px;font-size:11px;color:#fff;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04)';item.addEventListener('mouseenter',()=>item.style.background='rgba(129,140,248,.15)');item.addEventListener('mouseleave',()=>item.style.background='');item.addEventListener('mousedown',ev=>{ev.preventDefault();inp.value=s;dr.style.display='none';});dr.appendChild(item);});dr.style.display='block';}
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
    try{localStorage.setItem(LS('__prev__'),JSON.stringify({powerEntity:'switch.letpot_max_power',autoModeEntity:'switch.letpot_max_auto_mode',pumpCyclingEntity:'switch.letpot_max_pump_cycling',waterLevelEntity:'sensor.letpot_max_water_level',tempEntity:'sensor.letpot_max_temperatura',plantsAgeEntity:'sensor.letpot_max_plants_age',pumpEntity:'switch.letpot_max_pump',lightOnEntity:'time.letpot_max_light_on',lightOffEntity:'time.letpot_max_light_off',lightBrightnessEntity:'number.letpot_max_light_brightness',lightModeEntity:'select.letpot_max_modalita_luce',lowWaterEntity:'binary_sensor.letpot_max_low_water',lowNutrientsEntity:'binary_sensor.letpot_max_low_nutrients',refillErrorEntity:'binary_sensor.letpot_max_refill_error'}));}catch(_){}
    return render(mc,{states:{'switch.letpot_max_power':{state:'on'},'switch.letpot_max_auto_mode':{state:'on'},'switch.letpot_max_pump_cycling':{state:'on'},'sensor.letpot_max_water_level':{state:'78'},'sensor.letpot_max_temperatura':{state:'26.5'},'sensor.letpot_max_plants_age':{state:'45'},'switch.letpot_max_pump':{state:'on'},'time.letpot_max_light_on':{state:'06:00:00'},'time.letpot_max_light_off':{state:'22:00:00'},'number.letpot_max_light_brightness':{state:'7',attributes:{min:1,max:10,step:1}},'select.letpot_max_modalita_luce':{state:'Verdure/Erbe',attributes:{options:['Verdure/Erbe','Frutti','Fiori','Erbe aromatiche','Personalizzato']}},'binary_sensor.letpot_max_low_water':{state:'off'},'binary_sensor.letpot_max_low_nutrients':{state:'off'},'binary_sensor.letpot_max_refill_error':{state:'off'}}});
  }

  const CARD={id:ID,name:'LetPot Max',icon:'🌿',desc:'Sistema idroponico LPH-MAX 21 pod — luce che cambia tonalità in base alla modalità, timer pompa reale 30min, impostazioni in un pannello dedicato',version:'4.10',colSpan:2,rowSpan:3,frarik_no_edit:true,render,mount,update,configure,preview};
  window.FratechCardRegistry=window.FratechCardRegistry||{};window.FratechCardRegistry[ID]=CARD;
  window.FratechCards=window.FratechCards||{};window.FratechCards[ID]=CARD;
  try{console.log('[FratechStore] letpot-max v4.10');}catch(e){}
})();
