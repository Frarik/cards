(function () {
  'use strict';
  const ID = 'letpot-max';
  const LS = id => 'frarik_letpot_' + (id || 'x');

  /* ── Helpers ── */
  function H() { try { const h = window.frarikHass?.(); if (h?.states) return h; } catch(e){} return null; }
  function liveH(raw) { return H() || (raw?.states ? raw : null); }
  function stateOf(h, id) { if (!h || !id) return 'unknown'; return h?.states?.[id]?.state || 'unknown'; }
  function eh(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function isOn(s) { return s==='on'||s==='true'||s==='1'; }

  const _mounted = new WeakSet();

  function getEnt(card) {
    try { return JSON.parse(localStorage.getItem(LS(card.id)) || '{}'); } catch(e) { return {}; }
  }
  function saveEnt(card, ent) {
    try { localStorage.setItem(LS(card.id), JSON.stringify(ent)); } catch(e) {}
  }

  /* ── Valori live ── */
  function computeValues(card, rawHass) {
    const h = liveH(rawHass);
    const e = getEnt(card);
    const power     = isOn(stateOf(h, e.powerEntity));
    const autoMode  = isOn(stateOf(h, e.autoModeEntity));
    const pumpCycl  = isOn(stateOf(h, e.pumpCyclingEntity));
    const pumpS     = stateOf(h, e.pumpEntity);
    const pumpRun   = pumpS === 'on' || pumpS === 'running';
    const lightModeS= stateOf(h, e.lightModeEntity);
    const lightBr   = stateOf(h, e.lightBrightnessEntity);
    const lightOnT  = stateOf(h, e.lightOnEntity);
    const lightOffT = stateOf(h, e.lightOffEntity);
    const lowWater  = isOn(stateOf(h, e.lowWaterEntity));
    const lowNutr   = isOn(stateOf(h, e.lowNutrientsEntity));
    const refillErr = isOn(stateOf(h, e.refillErrorEntity));
    const waterPct  = Math.min(100, Math.max(0, parseFloat(stateOf(h, e.waterLevelEntity)) || 0));
    const tempVal   = parseFloat(stateOf(h, e.tempEntity)) || 0;
    const plantsAge = stateOf(h, e.plantsAgeEntity);
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();
    function parseT(t) { if(!t||t==='unknown') return null; const p=String(t).split(':'); return parseInt(p[0]||0)*60+parseInt(p[1]||0); }
    const onMin=parseT(lightOnT), offMin=parseT(lightOffT);
    let lightActive=false;
    if(onMin!==null&&offMin!==null) lightActive=onMin<offMin?(nowMin>=onMin&&nowMin<offMin):(nowMin>=onMin||nowMin<offMin);
    const tempCol = tempVal>30?'#f97316':tempVal>26?'#4ade80':'#60a5fa';
    const waterCol = waterPct<30?'#f97316':waterPct<60?'#facc15':'#4ade80';
    const tankH = 130;
    const waterH = Math.round(tankH*(waterPct/100)*0.8+tankH*0.05);
    return { power,autoMode,pumpCycl,pumpRun,lightModeS,lightBr,lightOnT,lightOffT,
             lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,lightActive,
             tempCol,waterCol,tankH,waterH };
  }

  /* ── Stili animazioni iniettati nel <head> una sola volta ── */
  function injectStyles() {
    if(document.getElementById('lp-kf')) return;
    const s=document.createElement('style'); s.id='lp-kf';
    s.textContent=`
      @keyframes lp-wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes lp-bubble{0%{transform:translateY(0) scale(1);opacity:.6}80%{opacity:.2}100%{transform:translateY(-110px) scale(1.6);opacity:0}}
      @keyframes lp-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
      @keyframes lp-glow{0%,100%{opacity:.55;filter:brightness(.8)}50%{opacity:1;filter:brightness(1.4)}}
      @keyframes lp-pump{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
    `;
    document.head.appendChild(s);
  }

  /* ── SVG piante ── */
  function plantSvg(h, delay) {
    const hh=Math.max(40,h);
    return `<svg width="32" height="${hh+10}" viewBox="0 0 36 ${hh+10}" style="animation:lp-sway ${2.5+delay*0.4}s ease-in-out ${delay*0.6}s infinite;transform-origin:18px ${hh+10}px;flex-shrink:0">
      <line x1="18" y1="${hh+8}" x2="18" y2="18" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M18 ${Math.round(hh*0.55)} Q4 ${Math.round(hh*0.3)} 10 ${Math.round(hh*0.12)} Q15 ${Math.round(hh*0.38)} 18 ${Math.round(hh*0.55)}" fill="#16a34a" opacity="0.92"/>
      <path d="M18 ${Math.round(hh*0.42)} Q32 ${Math.round(hh*0.18)} 26 ${Math.round(hh*0.05)} Q21 ${Math.round(hh*0.28)} 18 ${Math.round(hh*0.42)}" fill="#22c55e" opacity="0.88"/>
      <path d="M18 ${Math.round(hh*0.75)} Q8 ${Math.round(hh*0.6)} 12 ${Math.round(hh*0.5)} Q16 ${Math.round(hh*0.64)} 18 ${Math.round(hh*0.75)}" fill="#4ade80" opacity="0.75"/>
      <path d="M18 ${Math.round(hh*0.68)} Q28 ${Math.round(hh*0.52)} 24 ${Math.round(hh*0.44)} Q20 ${Math.round(hh*0.58)} 18 ${Math.round(hh*0.68)}" fill="#86efac" opacity="0.7"/>
      <ellipse cx="18" cy="${Math.round(hh*0.12)}" rx="7" ry="10" fill="#4ade80" opacity="0.9"/>
      <ellipse cx="14" cy="${Math.round(hh*0.18)}" rx="5" ry="7" fill="#86efac" opacity="0.7"/>
      <ellipse cx="22" cy="${Math.round(hh*0.16)}" rx="5" ry="7" fill="#22c55e" opacity="0.8"/>
    </svg>`;
  }
  const PLANTS_HTML = [plantSvg(60,0),plantSvg(75,1),plantSvg(85,2),plantSvg(70,3),plantSvg(55,4)].join('');
  const LED_PATTERN = ['red','blue','red','blue','white','red','blue','red','blue','white','red','blue','red','blue','white','red','blue','red'];

  /* ── RENDER DASHBOARD ── */
  function render(card, rawHass) {
    const v=computeValues(card, rawHass);
    const { power,autoMode,pumpCycl,pumpRun,lightBr,lightOnT,lightOffT,lightModeS,
            lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,lightActive,
            tempCol,waterCol,tankH,waterH } = v;

    const ledDots = LED_PATTERN.map((t,i)=>`<div data-lp-led="${i}" style="width:6px;height:6px;border-radius:50%;flex-shrink:0;background:${t==='red'?'#ff3060':t==='blue'?'#5030ff':'#e0e0ff'};${lightActive&&power?`box-shadow:0 0 ${t==='white'?4:8}px 1px ${t==='red'?'rgba(255,50,80,.9)':t==='blue'?'rgba(80,50,255,.9)':'rgba(200,200,255,.7)'};animation:lp-glow ${1.5+(i%3)*0.3}s ease-in-out infinite`:'opacity:0.25'}"></div>`).join('');

    const bubbles=[8,18,30,44,55,65,75,88].map((left,i)=>{
      const sz=4+(i%3)*2;
      return `<div data-lp-bub="${i}" style="position:absolute;bottom:${4+(i%3)*4}px;left:${left}%;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(120,210,255,0.45);border:1px solid rgba(150,230,255,0.6);animation:lp-bubble ${1.8+i*0.25}s ease-in ${(i*0.37).toFixed(2)}s infinite;display:${pumpRun&&power?'block':'none'}"></div>`;
    }).join('');

    return `<div style="background:linear-gradient(165deg,#04101e 0%,#081828 50%,#050d18 100%);border-radius:14px;overflow:hidden;color:#fff;font-family:inherit;user-select:none;height:100%;display:flex;flex-direction:column">

  <!-- HEADER -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px 8px;background:linear-gradient(90deg,rgba(6,30,60,.7),rgba(4,15,30,.3));flex-shrink:0">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:30px;height:30px;border-radius:8px;background:${power?'rgba(74,222,128,.15)':'rgba(255,255,255,.06)'};border:1px solid ${power?'rgba(74,222,128,.35)':'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;font-size:16px">🌿</div>
      <div>
        <div style="font-size:12px;font-weight:800">${eh(card.label||'LetPot Max')}</div>
        <div style="font-size:9px;color:rgba(255,255,255,.4)">Sistema idroponico</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:7px">
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
        <div data-lp-power style="background:${power?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)'};border:1px solid ${power?'rgba(74,222,128,.35)':'rgba(248,113,113,.3)'};border-radius:6px;padding:2px 7px;font-size:9px;font-weight:700;color:${power?'#4ade80':'#f87171'}">${power?'● ATTIVO':'○ SPENTO'}</div>
        <div data-lp-age style="font-size:9px;color:rgba(255,255,255,.4)">${plantsAge&&plantsAge!=='unknown'?`🌱 ${plantsAge}g`:''}</div>
      </div>
      <button data-lp-opencfg title="Impostazioni" style="width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:rgba(255,255,255,.55);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">⚙️</button>
    </div>
  </div>

  <!-- LED GROW LIGHT BAR -->
  <div style="position:relative;overflow:hidden;padding:5px 12px;background:rgba(0,0,0,.45);flex-shrink:0">
    <div data-lp-ledbg style="position:absolute;inset:0;background:${lightActive&&power?'linear-gradient(90deg,rgba(200,40,255,.08),rgba(255,40,100,.08),rgba(200,40,255,.08))':'transparent'};${lightActive&&power?'animation:lp-glow 2.5s ease-in-out infinite':''}"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1">
      <div style="display:flex;align-items:center;gap:2px;flex-wrap:wrap">${ledDots}</div>
      <div data-lp-ledtxt style="font-size:9px;color:rgba(255,255,255,.4);white-space:nowrap;margin-left:6px">${lightActive&&power?'☀️ ON':'🌑 OFF'} · ${lightBr!=='unknown'?lightBr+'/10':'—'}</div>
    </div>
    ${lightOnT!=='unknown'&&lightOffT!=='unknown'?`<div style="font-size:8px;color:rgba(255,255,255,.3);margin-top:2px;position:relative;z-index:1">⏰ ${String(lightOnT).slice(0,5)} → ${String(lightOffT).slice(0,5)}${lightModeS!=='unknown'?' · '+eh(lightModeS):''}</div>`:''}
  </div>

  <!-- PIANTE -->
  <div style="display:flex;align-items:flex-end;justify-content:center;gap:3px;height:78px;overflow:hidden;padding:0 8px;flex-shrink:0">${PLANTS_HTML}</div>

  <!-- TANK ACQUA -->
  <div style="position:relative;margin:0 12px;border-radius:10px;overflow:hidden;border:1px solid rgba(30,100,180,.3);height:${tankH}px;background:linear-gradient(180deg,#071525 0%,#0a1e35 100%);flex-shrink:0">
    <div data-lp-wtext style="position:absolute;top:6px;right:8px;font-size:10px;font-weight:800;color:${waterCol};z-index:4;text-shadow:0 0 8px rgba(0,0,0,.9)">💧 ${waterPct}%</div>
    <div data-lp-fill style="position:absolute;bottom:0;left:0;right:0;height:${waterH}px;z-index:1;transition:height 1.2s ease">
      <svg style="position:absolute;top:-18px;left:0;width:200%;animation:lp-wave 3.5s linear infinite" viewBox="0 0 800 22" preserveAspectRatio="none">
        <path d="M0,11 C60,0 120,22 180,11 C240,0 300,22 360,11 C420,0 480,22 540,11 C600,0 660,22 720,11 C780,0 800,22 800,11 L800,22 L0,22 Z" fill="rgba(20,90,170,.85)"/>
        <path d="M0,14 C80,4 160,22 240,14 C320,4 400,22 480,14 C560,4 640,22 720,14 C760,8 800,18 800,14 L800,22 L0,22 Z" fill="rgba(12,60,120,.7)"/>
      </svg>
      <div style="position:absolute;top:18px;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(20,90,170,.85) 0%,rgba(8,50,110,.95) 100%)"></div>
      <div style="position:absolute;inset:0;z-index:3">${bubbles}</div>
    </div>
    <div style="position:absolute;top:0;left:0;right:0;height:20px;background:rgba(5,15,30,.7);border-bottom:1px solid rgba(30,80,150,.4);z-index:2;display:flex;align-items:center;justify-content:center;gap:9px">
      ${[0,1,2,3,4].map(()=>`<div style="width:11px;height:11px;border-radius:3px;background:rgba(40,100,180,.5);border:1px solid rgba(60,140,220,.4)"></div>`).join('')}
    </div>
    <div style="position:absolute;bottom:6px;left:8px;display:flex;align-items:center;gap:5px;z-index:4">
      <div data-lp-pump style="width:8px;height:8px;border-radius:50%;background:${pumpRun&&power?'#4ade80':'#6b7280'};${pumpRun&&power?'animation:lp-pump 1s ease-in-out infinite;box-shadow:0 0 8px rgba(74,222,128,.7)':''}"></div>
      <div data-lp-pumptxt style="font-size:8px;color:rgba(255,255,255,.45)">POMPA ${pumpRun&&power?'ON':'OFF'}</div>
    </div>
    <div data-lp-temp style="position:absolute;bottom:6px;right:8px;font-size:8px;color:${tempCol};z-index:4;font-weight:700">🌡️ ${tempVal.toFixed(1)}°C</div>
  </div>

  <!-- STATS -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:6px 12px;flex-shrink:0">
    <div data-lp-sw style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:7px 5px;text-align:center">
      <div style="font-size:7px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.5px">Acqua</div>
      <div style="font-size:16px;font-weight:900;color:${waterCol};line-height:1.1">${waterPct}%</div>
      <div style="font-size:12px">💧</div>
    </div>
    <div data-lp-st style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:7px 5px;text-align:center">
      <div style="font-size:7px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.5px">Temp</div>
      <div style="font-size:16px;font-weight:900;color:${tempCol};line-height:1.1">${tempVal.toFixed(1)}°</div>
      <div style="font-size:12px">🌡️</div>
    </div>
    <div data-lp-sa style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:7px 5px;text-align:center">
      <div style="font-size:7px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.5px">Età</div>
      <div style="font-size:16px;font-weight:900;color:#86efac;line-height:1.1">${plantsAge!=='unknown'?plantsAge+'g':'—'}</div>
      <div style="font-size:12px">🌱</div>
    </div>
  </div>

  <!-- STATO -->
  <div style="display:flex;gap:5px;padding:0 12px 6px;flex-shrink:0;flex-wrap:wrap">
    <div data-lp-auto style="background:${autoMode?'rgba(74,222,128,.1)':'rgba(255,255,255,.04)'};border:1px solid ${autoMode?'rgba(74,222,128,.3)':'rgba(255,255,255,.08)'};border-radius:7px;padding:3px 9px;font-size:10px;display:flex;gap:4px;align-items:center">
      🤖 Auto <b style="color:${autoMode?'#4ade80':'rgba(255,255,255,.3)'}">${autoMode?'ON':'OFF'}</b>
    </div>
    <div data-lp-cycl style="background:${pumpCycl?'rgba(74,222,128,.1)':'rgba(255,255,255,.04)'};border:1px solid ${pumpCycl?'rgba(74,222,128,.3)':'rgba(255,255,255,.08)'};border-radius:7px;padding:3px 9px;font-size:10px;display:flex;gap:4px;align-items:center">
      ♻️ Ciclo <b style="color:${pumpCycl?'#4ade80':'rgba(255,255,255,.3)'}">${pumpCycl?'ON':'OFF'}</b>
    </div>
  </div>

  <!-- DIAGNOSTICA -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:0 12px 10px;flex:1;align-content:end">
    <div data-lp-antr style="background:${lowNutr?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${lowNutr?'rgba(248,113,113,.35)':'rgba(74,222,128,.18)'};border-radius:8px;padding:6px 4px;text-align:center">
      <div style="font-size:14px">🧪</div>
      <div style="font-size:7px;color:rgba(255,255,255,.45);margin:2px 0;text-transform:uppercase">Nutrienti</div>
      <div style="font-size:9px;font-weight:800;color:${lowNutr?'#f87171':'#4ade80'}">${lowNutr?'⚠️ Alert':'✓ OK'}</div>
    </div>
    <div data-lp-awtr style="background:${lowWater?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${lowWater?'rgba(248,113,113,.35)':'rgba(74,222,128,.18)'};border-radius:8px;padding:6px 4px;text-align:center">
      <div style="font-size:14px">💧</div>
      <div style="font-size:7px;color:rgba(255,255,255,.45);margin:2px 0;text-transform:uppercase">Acqua bassa</div>
      <div style="font-size:9px;font-weight:800;color:${lowWater?'#f87171':'#4ade80'}">${lowWater?'⚠️ Alert':'✓ OK'}</div>
    </div>
    <div data-lp-aref style="background:${refillErr?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)'};border:1px solid ${refillErr?'rgba(248,113,113,.35)':'rgba(74,222,128,.18)'};border-radius:8px;padding:6px 4px;text-align:center">
      <div style="font-size:14px">🔄</div>
      <div style="font-size:7px;color:rgba(255,255,255,.45);margin:2px 0;text-transform:uppercase">Ricarica</div>
      <div style="font-size:9px;font-weight:800;color:${refillErr?'#f87171':'#4ade80'}">${refillErr?'⚠️ Alert':'✓ OK'}</div>
    </div>
  </div>

</div>`;
  }

  function mount(card, rawHass, el) {
    injectStyles();
    if(_mounted.has(el)) return;
    _mounted.add(el);
    el.addEventListener('click', function(e) {
      if(e.target.closest('[data-lp-opencfg]')) configure(card);
    });
  }

  /* ── UPDATE mirato — non ricrea il DOM, aggiorna solo i valori ── */
  function update(card, rawHass, el) {
    try {
      const v = computeValues(card, rawHass);
      const { power,autoMode,pumpCycl,pumpRun,lightBr,lightActive,
              lowWater,lowNutr,refillErr,waterPct,tempVal,plantsAge,tempCol,waterCol,waterH } = v;
      const q = s => el.querySelector(`[data-lp-${s}]`);

      const fill=q('fill'); if(fill) fill.style.height=waterH+'px';
      const wt=q('wtext'); if(wt){wt.textContent='💧 '+waterPct+'%';wt.style.color=waterCol;}
      const tp=q('temp'); if(tp){tp.textContent='🌡️ '+tempVal.toFixed(1)+'°C';tp.style.color=tempCol;}
      const ag=q('age'); if(ag) ag.textContent=plantsAge&&plantsAge!=='unknown'?`🌱 ${plantsAge}g`:'';
      const pw=q('power'); if(pw){
        pw.textContent=power?'● ATTIVO':'○ SPENTO'; pw.style.color=power?'#4ade80':'#f87171';
        pw.style.background=power?'rgba(74,222,128,.15)':'rgba(248,113,113,.12)';
        pw.style.borderColor=power?'rgba(74,222,128,.35)':'rgba(248,113,113,.3)';
      }
      const pm=q('pump'); if(pm){
        pm.style.background=pumpRun&&power?'#4ade80':'#6b7280';
        pm.style.animation=pumpRun&&power?'lp-pump 1s ease-in-out infinite':'';
        pm.style.boxShadow=pumpRun&&power?'0 0 8px rgba(74,222,128,.7)':'';
      }
      const pmtxt=q('pumptxt'); if(pmtxt) pmtxt.textContent='POMPA '+(pumpRun&&power?'ON':'OFF');
      [8,18,30,44,55,65,75,88].forEach((_,i)=>{
        const b=el.querySelector(`[data-lp-bub="${i}"]`); if(b) b.style.display=pumpRun&&power?'block':'none';
      });
      LED_PATTERN.forEach((t,i)=>{
        const d=el.querySelector(`[data-lp-led="${i}"]`); if(!d) return;
        if(lightActive&&power){
          d.style.opacity='';
          d.style.boxShadow=`0 0 ${t==='white'?4:8}px 1px ${t==='red'?'rgba(255,50,80,.9)':t==='blue'?'rgba(80,50,255,.9)':'rgba(200,200,255,.7)'}`;
          d.style.animation=`lp-glow ${1.5+(i%3)*0.3}s ease-in-out infinite`;
        } else { d.style.opacity='0.25'; d.style.boxShadow=''; d.style.animation=''; }
      });
      const lb=q('ledbg'); if(lb){
        lb.style.background=lightActive&&power?'linear-gradient(90deg,rgba(200,40,255,.08),rgba(255,40,100,.08),rgba(200,40,255,.08))':'transparent';
        lb.style.animation=lightActive&&power?'lp-glow 2.5s ease-in-out infinite':'';
      }
      const lt=q('ledtxt'); if(lt) lt.textContent=(lightActive&&power?'☀️ ON':'🌑 OFF')+' · '+(v.lightBr!=='unknown'?v.lightBr+'/10':'—');
      function updStat(attr, val, col) {
        const c=q(attr); if(!c) return;
        const d=c.querySelector('[style*="font-size:16px"]'); if(d){d.textContent=val; if(col) d.style.color=col;}
      }
      updStat('sw', waterPct+'%', waterCol);
      updStat('st', tempVal.toFixed(1)+'°', tempCol);
      updStat('sa', plantsAge!=='unknown'?plantsAge+'g':'—', null);
      function updChip(attr, on) {
        const c=q(attr); if(!c) return;
        c.style.background=on?'rgba(74,222,128,.1)':'rgba(255,255,255,.04)';
        c.style.borderColor=on?'rgba(74,222,128,.3)':'rgba(255,255,255,.08)';
        const b=c.querySelector('b'); if(b){b.textContent=on?'ON':'OFF';b.style.color=on?'#4ade80':'rgba(255,255,255,.3)';}
      }
      updChip('auto', autoMode);
      updChip('cycl', pumpCycl);
      function updAlert(attr, bad) {
        const a=q(attr); if(!a) return;
        a.style.background=bad?'rgba(248,113,113,.12)':'rgba(74,222,128,.07)';
        a.style.borderColor=bad?'rgba(248,113,113,.35)':'rgba(74,222,128,.18)';
        const b=a.querySelector('[style*="font-weight:800"]'); if(b){b.textContent=bad?'⚠️ Alert':'✓ OK';b.style.color=bad?'#f87171':'#4ade80';}
      }
      updAlert('antr', lowNutr);
      updAlert('awtr', lowWater);
      updAlert('aref', refillErr);
    } catch(e) {}
  }

  /* ── CONFIGURE — popup dal basso con input + autocomplete live ── */
  const FIELDS = [
    { key:'powerEntity',          label:'💡 Power (switch)',             domains:['switch'] },
    { key:'autoModeEntity',       label:'🤖 Auto mode (switch)',         domains:['switch'] },
    { key:'pumpCyclingEntity',    label:'♻️ Pump cycling (switch)',      domains:['switch'] },
    { key:'waterLevelEntity',     label:'💧 Livello acqua (sensor %)',   domains:['sensor'] },
    { key:'tempEntity',           label:'🌡️ Temperatura (sensor)',       domains:['sensor'] },
    { key:'plantsAgeEntity',      label:'🌱 Età piante (sensor)',        domains:['sensor'] },
    { key:'pumpEntity',           label:'⚙️ Pompa (binary_sensor)',      domains:['binary_sensor','switch'] },
    { key:'lightOnEntity',        label:'🌅 Luce accensione (time)',     domains:['time','input_datetime'] },
    { key:'lightOffEntity',       label:'🌙 Luce spegnimento (time)',    domains:['time','input_datetime'] },
    { key:'lightBrightnessEntity',label:'✨ Luminosità (number)',        domains:['number','input_number'] },
    { key:'lightModeEntity',      label:'🎛️ Modalità luce (select)',     domains:['select','input_select'] },
    { key:'lowWaterEntity',       label:'⚠️ Acqua bassa (binary)',       domains:['binary_sensor'] },
    { key:'lowNutrientsEntity',   label:'⚠️ Nutrienti bassi (binary)',   domains:['binary_sensor'] },
    { key:'refillErrorEntity',    label:'🔄 Errore ricarica (binary)',   domains:['binary_sensor'] },
  ];

  function configure(card) {
    const ent = getEnt(card);
    const h = H();
    const allEntities = h ? Object.keys(h.states).sort() : [];

    /* Overlay + bottom sheet */
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);display:flex;align-items:flex-end';

    const sheet = document.createElement('div');
    sheet.style.cssText = 'width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0d1a;border:1px solid rgba(255,255,255,.1);border-bottom:none;border-radius:20px 20px 0 0;color:#fff;overflow:hidden';
    ov.appendChild(sheet);

    /* Header */
    sheet.innerHTML = `
      <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;gap:10px">
        <span style="font-size:20px">🌿</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:800">Configura LetPot Max</div>
          <div style="font-size:10px;color:rgba(255,255,255,.4)">Scrivi il nome dell'entità — i suggerimenti appaiono mentre digiti</div>
        </div>
        <button id="lp-close" style="width:30px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.1);color:#fff;cursor:pointer;font-size:14px;flex-shrink:0">✕</button>
      </div>
      <div id="lp-body" style="flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin"></div>
      <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
        <button id="lp-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:linear-gradient(90deg,#16a34a,#4ade80);color:#fff;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
        <button id="lp-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
      </div>`;

    /* Crea i campi con input + dropdown autocomplete */
    const body = sheet.querySelector('#lp-body');
    const inputs = {};

    FIELDS.forEach(f => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative';

      const label = document.createElement('div');
      label.style.cssText = 'font-size:10px;color:rgba(255,255,255,.45);margin-bottom:4px;font-weight:600';
      label.textContent = f.label;

      const inp = document.createElement('input');
      inp.value = ent[f.key] || '';
      inp.placeholder = f.domains[0] + '.*';
      inp.autocomplete = 'off';
      inp.spellcheck = false;
      inp.style.cssText = 'width:100%;padding:9px 11px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:12px;box-sizing:border-box;outline:none';
      inputs[f.key] = inp;

      const drop = document.createElement('div');
      drop.style.cssText = 'display:none;position:absolute;left:0;right:0;top:100%;background:#0d1a2e;border:1px solid rgba(129,140,248,.4);border-top:none;border-radius:0 0 10px 10px;max-height:160px;overflow-y:auto;z-index:500;scrollbar-width:thin';

      function showSuggestions(typed) {
        const q = typed.toLowerCase();
        const results = allEntities
          .filter(k => f.domains.some(d => k.startsWith(d+'.')) && (!q || k.toLowerCase().includes(q)))
          .sort((a,b) => {
            const ap=a.toLowerCase().startsWith(q), bp=b.toLowerCase().startsWith(q);
            if(ap&&!bp) return -1; if(!ap&&bp) return 1; return a.localeCompare(b);
          })
          .slice(0, 10);
        if(!results.length) { drop.style.display='none'; return; }
        drop.innerHTML = '';
        results.forEach(s => {
          const item = document.createElement('div');
          item.textContent = s;
          item.style.cssText = 'padding:8px 11px;font-size:11px;color:#e2e8f0;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04)';
          item.addEventListener('mouseenter', () => item.style.background='rgba(129,140,248,.15)');
          item.addEventListener('mouseleave', () => item.style.background='');
          item.addEventListener('mousedown', e => {
            e.preventDefault(); // evita blur sull'input
            inp.value = s;
            drop.style.display = 'none';
          });
          drop.appendChild(item);
        });
        drop.style.display = 'block';
      }

      inp.addEventListener('input', () => showSuggestions(inp.value));
      inp.addEventListener('focus', () => showSuggestions(inp.value));
      inp.addEventListener('blur', () => setTimeout(() => { drop.style.display='none'; }, 150));

      wrap.appendChild(label);
      wrap.appendChild(inp);
      wrap.appendChild(drop);
      body.appendChild(wrap);
    });

    /* Chiusura */
    const close = () => ov.remove();
    sheet.querySelector('#lp-close').onclick = close;
    sheet.querySelector('#lp-cancel').onclick = close;
    ov.addEventListener('click', e => { if(e.target===ov) close(); });
    document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown',esc); } });

    /* Salva */
    sheet.querySelector('#lp-save').onclick = () => {
      const newEnt = {};
      FIELDS.forEach(f => { newEnt[f.key] = inputs[f.key].value.trim(); });
      saveEnt(card, newEnt);
      close();
      try { window.showToast?.('✅ Impostazioni LetPot Max salvate'); } catch(_){}
    };

    document.body.appendChild(ov);
    /* Focus sul primo campo vuoto */
    const firstEmpty = FIELDS.find(f => !ent[f.key]);
    if(firstEmpty) inputs[firstEmpty.key].focus();
  }

  /* ── PREVIEW ── */
  function preview() {
    const mockCard = { id:'__prev__', type:'js-custom', jsCardId:ID, label:'LetPot Max', colSpan:2, rowSpan:3 };
    try { localStorage.setItem(LS('__prev__'), JSON.stringify({
      powerEntity:'switch.letpot_max_power', autoModeEntity:'switch.letpot_max_auto_mode',
      pumpCyclingEntity:'switch.letpot_max_pump_cycling', waterLevelEntity:'sensor.letpot_max_water_level',
      tempEntity:'sensor.letpot_max_temperatura', plantsAgeEntity:'sensor.letpot_max_plants_age',
      pumpEntity:'binary_sensor.letpot_max_pump', lightOnEntity:'time.letpot_max_light_on',
      lightOffEntity:'time.letpot_max_light_off', lightBrightnessEntity:'number.letpot_max_light_brightness',
      lightModeEntity:'select.letpot_max_modalita_luce', lowWaterEntity:'binary_sensor.letpot_max_low_water',
      lowNutrientsEntity:'binary_sensor.letpot_max_low_nutrients', refillErrorEntity:'binary_sensor.letpot_max_refill_error',
    })); } catch(_) {}
    return render(mockCard, { states:{
      'switch.letpot_max_power':{state:'on'}, 'switch.letpot_max_auto_mode':{state:'on'},
      'switch.letpot_max_pump_cycling':{state:'on'}, 'sensor.letpot_max_water_level':{state:'90'},
      'sensor.letpot_max_temperatura':{state:'27.0'}, 'sensor.letpot_max_plants_age':{state:'5'},
      'binary_sensor.letpot_max_pump':{state:'off'}, 'time.letpot_max_light_on':{state:'06:00:00'},
      'time.letpot_max_light_off':{state:'18:00:00'}, 'number.letpot_max_light_brightness':{state:'2'},
      'select.letpot_max_modalita_luce':{state:'Verdure'}, 'binary_sensor.letpot_max_low_water':{state:'off'},
      'binary_sensor.letpot_max_low_nutrients':{state:'off'}, 'binary_sensor.letpot_max_refill_error':{state:'off'},
    }});
  }

  /* ── REGISTRAZIONE ── */
  const CARD = {
    id: ID, name:'LetPot Max', icon:'🌿',
    desc:'Sistema idroponico LetPot Max — acqua, pompa, luci LED, temperatura, alerts',
    version:'2.0', colSpan:2, rowSpan:3,
    render, mount, update, configure, preview,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: letpot-max v2.0'); } catch(e) {}
})();
