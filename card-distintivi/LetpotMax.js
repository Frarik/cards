(function () {
  'use strict';
  const ID = 'letpot-max';

  function H() {
    try { const h = window.frarikHass?.(); if (h?.states) return h; } catch (e) {}
    return null;
  }
  function stateOf(h, id) { if (!h || !id) return 'unknown'; return h?.states?.[id]?.state || 'unknown'; }
  function attrOf(h, id, a) { return h?.states?.[id]?.attributes?.[a]; }
  function liveH(raw) { return H() || (raw?.states ? raw : null); }
  function eh(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function loadCfg(c) { return c && typeof c === 'object' ? c : {}; }
  function isOn(state) { return state === 'on' || state === 'true' || state === '1'; }
  function isOk(state) { return state !== 'on' && state !== 'problem' && state !== 'error'; }

  /* ── CHIP (badge bar) ── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const water = parseFloat(stateOf(h, c.waterLevel)) || 0;
    const temp  = parseFloat(stateOf(h, c.temp)) || 0;
    const power = isOn(stateOf(h, c.power));
    const lowW  = isOn(stateOf(h, c.lowWater));
    const lowN  = isOn(stateOf(h, c.lowNutrients));
    const refE  = isOn(stateOf(h, c.refillError));
    const alert = lowW || lowN || refE;
    const col = !power ? '#6b7280' : alert ? '#ef4444' : water < 30 ? '#f97316' : '#4ade80';
    const val = power ? `💧${water}% · ${temp.toFixed(1)}°C` : '⏸ Spento';
    return { label: c.label || 'LetPot Max', value: val, color: col };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    return [c.power, c.waterLevel, c.temp, c.pump, c.lowWater, c.lowNutrients, c.refillError,
            c.lightOn, c.lightOff, c.lightBrightness, c.autoMode, c.pumpCycling, c.plantsAge, c.lightMode].filter(Boolean);
  }

  /* ── RENDER (popup) ── */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);

    const power      = isOn(stateOf(h, c.power));
    const autoMode   = isOn(stateOf(h, c.autoMode));
    const pumpCycl   = isOn(stateOf(h, c.pumpCycling));
    const pumpRun    = stateOf(h, c.pump) === 'on' || stateOf(h, c.pump) === 'running';
    const lightModeS = stateOf(h, c.lightMode);
    const lightBr    = stateOf(h, c.lightBrightness);
    const lightOnT   = stateOf(h, c.lightOn);
    const lightOffT  = stateOf(h, c.lightOff);
    const lowWater   = isOn(stateOf(h, c.lowWater));
    const lowNutr    = isOn(stateOf(h, c.lowNutrients));
    const refillErr  = isOn(stateOf(h, c.refillError));
    const waterPct   = Math.min(100, Math.max(0, parseFloat(stateOf(h, c.waterLevel)) || 0));
    const tempVal    = parseFloat(stateOf(h, c.temp)) || 0;
    const plantsAge  = stateOf(h, c.plantsAge);

    /* Determina se la luce è accesa (orario tra lightOn e lightOff) */
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    function parseTime(t) {
      if (!t || t === 'unknown') return null;
      const parts = String(t).split(':');
      return parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
    }
    const onMin = parseTime(lightOnT);
    const offMin = parseTime(lightOffT);
    let lightActive = false;
    if (onMin !== null && offMin !== null) {
      lightActive = onMin < offMin ? (nowMin >= onMin && nowMin < offMin)
                                   : (nowMin >= onMin || nowMin < offMin);
    }

    /* Temperatura colore */
    const tempCol = tempVal > 30 ? '#f97316' : tempVal > 26 ? '#4ade80' : '#60a5fa';
    const waterCol = waterPct < 30 ? '#f97316' : waterPct < 60 ? '#facc15' : '#4ade80';

    /* LED dots pattern (18 LEDs: red/blue alternating with white) */
    const ledPattern = [
      'red','blue','red','blue','white','red','blue','red','blue','white',
      'red','blue','red','blue','white','red','blue','red'
    ];

    /* Bubbles: 8 posizioni con delay variabili */
    const bubbles = [8,18,30,44,55,65,75,88].map((left, i) => {
      const delay = (i * 0.37).toFixed(2);
      const size = 4 + (i % 3) * 2;
      return `<div style="position:absolute;bottom:${4 + (i % 3) * 4}px;left:${left}%;width:${size}px;height:${size}px;
        border-radius:50%;background:rgba(120,210,255,0.45);border:1px solid rgba(150,230,255,0.6);
        animation:lp-bubble ${1.8 + i * 0.25}s ease-in ${delay}s infinite;
        display:${pumpRun && power ? 'block' : 'none'}"></div>`;
    }).join('');

    /* Plant SVG (5 piante di altezze diverse) */
    function plantSvg(h, delay) {
      const hh = Math.max(40, h);
      return `<svg width="36" height="${hh + 10}" viewBox="0 0 36 ${hh + 10}" style="animation:lp-sway ${2.5 + delay * 0.4}s ease-in-out ${delay * 0.6}s infinite;transform-origin:18px ${hh + 10}px;flex-shrink:0">
        <!-- Stelo -->
        <line x1="18" y1="${hh + 8}" x2="18" y2="18" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Foglia sx grande -->
        <path d="M18 ${Math.round(hh * 0.55)} Q4 ${Math.round(hh * 0.3)} 10 ${Math.round(hh * 0.12)} Q15 ${Math.round(hh * 0.38)} 18 ${Math.round(hh * 0.55)}" fill="#16a34a" opacity="0.92"/>
        <!-- Foglia dx grande -->
        <path d="M18 ${Math.round(hh * 0.42)} Q32 ${Math.round(hh * 0.18)} 26 ${Math.round(hh * 0.05)} Q21 ${Math.round(hh * 0.28)} 18 ${Math.round(hh * 0.42)}" fill="#22c55e" opacity="0.88"/>
        <!-- Foglia sx piccola -->
        <path d="M18 ${Math.round(hh * 0.75)} Q8 ${Math.round(hh * 0.6)} 12 ${Math.round(hh * 0.5)} Q16 ${Math.round(hh * 0.64)} 18 ${Math.round(hh * 0.75)}" fill="#4ade80" opacity="0.75"/>
        <!-- Foglia dx piccola -->
        <path d="M18 ${Math.round(hh * 0.68)} Q28 ${Math.round(hh * 0.52)} 24 ${Math.round(hh * 0.44)} Q20 ${Math.round(hh * 0.58)} 18 ${Math.round(hh * 0.68)}" fill="#86efac" opacity="0.7"/>
        <!-- Cima arrotondata -->
        <ellipse cx="18" cy="${Math.round(hh * 0.12)}" rx="7" ry="10" fill="#4ade80" opacity="0.9"/>
        <ellipse cx="14" cy="${Math.round(hh * 0.18)}" rx="5" ry="7" fill="#86efac" opacity="0.7"/>
        <ellipse cx="22" cy="${Math.round(hh * 0.16)}" rx="5" ry="7" fill="#22c55e" opacity="0.8"/>
      </svg>`;
    }

    const plants = [
      plantSvg(65, 0),
      plantSvg(80, 1),
      plantSvg(90, 2),
      plantSvg(75, 3),
      plantSvg(60, 4),
    ].join('');

    /* Water level → altezza visiva (30%–90% del tank) */
    const tankH = 160;
    const waterH = Math.round(tankH * (waterPct / 100) * 0.8 + tankH * 0.05);

    const ledClass = lightActive && power ? 'lp-led-live' : '';

    return `
<style>
  @keyframes lp-wave { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes lp-bubble { 0%{transform:translateY(0) scale(1);opacity:.6} 80%{opacity:.2} 100%{transform:translateY(-${Math.round(tankH * 0.85)}px) scale(1.6);opacity:0} }
  @keyframes lp-sway { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
  @keyframes lp-glow { 0%,100%{opacity:.55;filter:brightness(.8)} 50%{opacity:1;filter:brightness(1.4)} }
  @keyframes lp-pulse { 0%,100%{box-shadow:0 0 6px 2px rgba(180,60,255,.4)} 50%{box-shadow:0 0 18px 5px rgba(180,60,255,.9)} }
  @keyframes lp-pump { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
  @keyframes lp-drop { 0%{transform:translateY(0);opacity:.9} 100%{transform:translateY(8px);opacity:0} }
</style>
<div style="background:linear-gradient(165deg,#04101e 0%,#081828 50%,#050d18 100%);border-radius:16px;overflow:hidden;color:#fff;font-family:inherit;user-select:none">

  <!-- HEADER -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;background:linear-gradient(90deg,rgba(6,30,60,.7),rgba(4,15,30,.3))">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;border-radius:10px;background:${power ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.06)'};border:1px solid ${power ? 'rgba(74,222,128,.35)' : 'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;font-size:20px">🌿</div>
      <div>
        <div style="font-size:14px;font-weight:800;letter-spacing:-.3px">${eh(c.label || 'LetPot Max')}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.45)">Sistema idroponico</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
      <div style="background:${power ? 'rgba(74,222,128,.15)' : 'rgba(248,113,113,.12)'};border:1px solid ${power ? 'rgba(74,222,128,.35)' : 'rgba(248,113,113,.3)'};border-radius:7px;padding:3px 9px;font-size:10px;font-weight:700;color:${power ? '#4ade80' : '#f87171'}">${power ? '● ATTIVO' : '○ SPENTO'}</div>
      ${plantsAge && plantsAge !== 'unknown' ? `<div style="font-size:10px;color:rgba(255,255,255,.4)">🌱 ${plantsAge} giorni</div>` : ''}
    </div>
  </div>

  <!-- LED GROW LIGHT BAR -->
  <div class="${ledClass}" style="position:relative;overflow:hidden;padding:8px 16px;background:rgba(0,0,0,.45)">
    <div style="position:absolute;inset:0;background:${lightActive && power ? 'linear-gradient(90deg,rgba(200,40,255,.08),rgba(255,40,100,.08),rgba(200,40,255,.08))' : 'transparent'};${lightActive && power ? 'animation:lp-glow 2.5s ease-in-out infinite' : ''}"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1">
      <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap">
        ${ledPattern.map((t, i) => `<div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;
          background:${t === 'red' ? '#ff3060' : t === 'blue' ? '#5030ff' : '#e0e0ff'};
          ${lightActive && power ? `box-shadow:0 0 ${t === 'white' ? 4 : 8}px 1px ${t === 'red' ? 'rgba(255,50,80,.9)' : t === 'blue' ? 'rgba(80,50,255,.9)' : 'rgba(200,200,255,.7)'};animation:lp-glow ${1.5 + (i % 3) * 0.3}s ease-in-out infinite` : 'opacity:0.25'}
        "></div>`).join('')}
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,.4);white-space:nowrap;margin-left:8px">${lightActive && power ? '☀️ ON' : '🌑 OFF'} · ${lightBr !== 'unknown' ? lightBr + '/10' : '—'}</div>
    </div>
    ${lightOnT !== 'unknown' && lightOffT !== 'unknown' ? `<div style="font-size:9px;color:rgba(255,255,255,.35);margin-top:4px;position:relative;z-index:1">⏰ ${String(lightOnT).slice(0,5)} → ${String(lightOffT).slice(0,5)} · ${eh(lightModeS !== 'unknown' ? lightModeS : '—')}</div>` : ''}
  </div>

  <!-- VISUALE IDROPONICA -->
  <div style="padding:0 14px 10px;margin-top:8px">
    <!-- Piante -->
    <div style="display:flex;align-items:flex-end;justify-content:center;gap:6px;height:100px;overflow:hidden;padding:0 8px">
      ${plants}
    </div>

    <!-- Tank con acqua -->
    <div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(30,100,180,.3);height:${tankH}px;background:linear-gradient(180deg,#071525 0%,#0a1e35 100%)">

      <!-- Indicatore livello testo -->
      <div style="position:absolute;top:8px;right:10px;font-size:11px;font-weight:800;color:${waterCol};z-index:4;text-shadow:0 0 8px rgba(0,0,0,.9)">💧 ${waterPct}%</div>

      <!-- Acqua animata -->
      <div style="position:absolute;bottom:0;left:0;right:0;height:${waterH}px;z-index:1;transition:height 1.2s ease">
        <!-- Onda -->
        <svg style="position:absolute;top:-18px;left:0;width:200%;animation:lp-wave 3.5s linear infinite" viewBox="0 0 800 22" preserveAspectRatio="none">
          <path d="M0,11 C60,0 120,22 180,11 C240,0 300,22 360,11 C420,0 480,22 540,11 C600,0 660,22 720,11 C780,0 800,22 800,11 L800,22 L0,22 Z" fill="rgba(20,90,170,.85)"/>
          <path d="M0,14 C80,4 160,22 240,14 C320,4 400,22 480,14 C560,4 640,22 720,14 C760,8 800,18 800,14 L800,22 L0,22 Z" fill="rgba(12,60,120,.7)"/>
        </svg>
        <!-- Corpo acqua -->
        <div style="position:absolute;top:18px;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(20,90,170,.85) 0%,rgba(8,50,110,.95) 100%)"></div>
        <!-- Rifrazione luce -->
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(90deg,transparent 20%,rgba(60,160,255,.06) 50%,transparent 80%);z-index:2"></div>
        <!-- Bubbles -->
        <div style="position:absolute;inset:0;z-index:3">${bubbles}</div>
      </div>

      <!-- Griglia base (radici) -->
      <div style="position:absolute;top:0;left:0;right:0;height:24px;background:rgba(5,15,30,.7);border-bottom:1px solid rgba(30,80,150,.4);z-index:2;display:flex;align-items:center;justify-content:center;gap:12px">
        ${[0,1,2,3,4].map(i => `<div style="width:14px;height:14px;border-radius:3px;background:rgba(40,100,180,.5);border:1px solid rgba(60,140,220,.4)"></div>`).join('')}
      </div>

      <!-- Pompa indicator -->
      <div style="position:absolute;bottom:8px;left:10px;display:flex;align-items:center;gap:6px;z-index:4">
        <div style="width:10px;height:10px;border-radius:50%;background:${pumpRun && power ? '#4ade80' : '#6b7280'};${pumpRun && power ? 'animation:lp-pump 1s ease-in-out infinite;box-shadow:0 0 8px rgba(74,222,128,.7)' : ''}"></div>
        <div style="font-size:9px;color:rgba(255,255,255,.5)">POMPA ${pumpRun && power ? 'ON' : 'OFF'}</div>
      </div>

      <!-- Temp indicator -->
      <div style="position:absolute;bottom:8px;right:10px;font-size:9px;color:${tempCol};z-index:4;font-weight:700">🌡️ ${tempVal.toFixed(1)}°C</div>
    </div>
  </div>

  <!-- STATS -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:0 14px 10px">
    ${[
      { icon:'💧', val:`${waterPct}%`, lbl:'Acqua', col: waterCol },
      { icon:'🌡️', val:`${tempVal.toFixed(1)}°C`, lbl:'Temperatura', col: tempCol },
      { icon:'🌱', val: plantsAge !== 'unknown' ? `${plantsAge}g` : '—', lbl:'Età piante', col:'#86efac' }
    ].map(s => `
      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:10px 8px;text-align:center">
        <div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">${s.lbl}</div>
        <div style="font-size:20px;font-weight:900;color:${s.col};line-height:1">${s.val}</div>
        <div style="font-size:14px;margin-top:2px">${s.icon}</div>
      </div>`).join('')}
  </div>

  <!-- STATO SISTEMA -->
  <div style="display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px">
    ${[
      { label: '🤖 Auto', on: autoMode, onTxt: 'ON', offTxt: 'OFF' },
      { label: '♻️ Ciclo pompa', on: pumpCycl, onTxt: 'ON', offTxt: 'OFF' },
    ].map(ch => `
      <div style="background:${ch.on ? 'rgba(74,222,128,.1)' : 'rgba(255,255,255,.04)'};border:1px solid ${ch.on ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.08)'};border-radius:8px;padding:5px 11px;font-size:11px;display:flex;align-items:center;gap:5px">
        <span>${ch.label}</span>
        <span style="font-weight:800;color:${ch.on ? '#4ade80' : 'rgba(255,255,255,.35)'}">${ch.on ? ch.onTxt : ch.offTxt}</span>
      </div>`).join('')}
  </div>

  <!-- DIAGNOSTICA ALERT -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:0 14px 14px">
    ${[
      { icon:'🧪', lbl:'Nutrienti', bad: lowNutr },
      { icon:'💧', lbl:'Acqua bassa', bad: lowWater },
      { icon:'🔄', lbl:'Ricarica', bad: refillErr },
    ].map(a => `
      <div style="background:${a.bad ? 'rgba(248,113,113,.12)' : 'rgba(74,222,128,.07)'};border:1px solid ${a.bad ? 'rgba(248,113,113,.35)' : 'rgba(74,222,128,.18)'};border-radius:9px;padding:8px 6px;text-align:center">
        <div style="font-size:16px">${a.icon}</div>
        <div style="font-size:9px;color:rgba(255,255,255,.5);margin:3px 0 2px;text-transform:uppercase;letter-spacing:.4px">${a.lbl}</div>
        <div style="font-size:10px;font-weight:800;color:${a.bad ? '#f87171' : '#4ade80'}">${a.bad ? '⚠️ Alert' : '✓ OK'}</div>
      </div>`).join('')}
  </div>

</div>`;
  }

  function mount(cfg, rawHass, el) {
    /* nessun mount aggiuntivo necessario — animazioni via CSS */
  }

  function update(cfg, rawHass, el) {
    try {
      el.innerHTML = render(cfg, rawHass);
    } catch(e) {}
  }

  /* ── CONFIGURE ── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const fields = [
      { key:'label',          label:'Nome card',              ph:'LetPot Max',                            val:c.label||'' },
      { key:'power',          label:'Power (switch)',          ph:'switch.letpot_max_power',               val:c.power||'' },
      { key:'autoMode',       label:'Auto mode (switch)',      ph:'switch.letpot_max_auto_mode',           val:c.autoMode||'' },
      { key:'waterLevel',     label:'Water level (sensor %)', ph:'sensor.letpot_max_water_level',         val:c.waterLevel||'' },
      { key:'temp',           label:'Temperatura (sensor)',    ph:'sensor.letpot_max_temperatura',         val:c.temp||'' },
      { key:'plantsAge',      label:'Plants age (sensor)',     ph:'sensor.letpot_max_plants_age',          val:c.plantsAge||'' },
      { key:'pump',           label:'Pump (binary_sensor)',    ph:'binary_sensor.letpot_max_pump',         val:c.pump||'' },
      { key:'pumpCycling',    label:'Pump cycling (switch)',   ph:'switch.letpot_max_pump_cycling',        val:c.pumpCycling||'' },
      { key:'lightOn',        label:'Light on (time)',         ph:'time.letpot_max_light_on',              val:c.lightOn||'' },
      { key:'lightOff',       label:'Light off (time)',        ph:'time.letpot_max_light_off',             val:c.lightOff||'' },
      { key:'lightBrightness',label:'Light brightness',        ph:'number.letpot_max_light_brightness',    val:c.lightBrightness||'' },
      { key:'lightMode',      label:'Modalità luce (select)',  ph:'select.letpot_max_modalita_luce',       val:c.lightMode||'' },
      { key:'lowWater',       label:'Low water (binary)',      ph:'binary_sensor.letpot_max_low_water',    val:c.lowWater||'' },
      { key:'lowNutrients',   label:'Low nutrients (binary)',  ph:'binary_sensor.letpot_max_low_nutrients',val:c.lowNutrients||'' },
      { key:'refillError',    label:'Refill error (binary)',   ph:'binary_sensor.letpot_max_refill_error', val:c.refillError||'' },
    ];

    const ov = document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);display:flex;align-items:flex-end';
    ov.innerHTML=`<div style="width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0d1a;border:1px solid rgba(255,255,255,.1);border-bottom:none;border-radius:20px 20px 0 0;color:#fff;overflow:hidden">
      <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;gap:10px">
        <span style="font-size:20px">🌿</span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:800">Configura LetPot Max</div>
          <div style="font-size:10px;color:rgba(255,255,255,.4)">Inserisci gli entity ID di Home Assistant</div>
        </div>
        <button id="lp-cfg-close" style="width:30px;height:30px;border:none;border-radius:8px;background:rgba(255,255,255,.1);color:#fff;cursor:pointer;font-size:14px">✕</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:12px 14px;scrollbar-width:thin;display:flex;flex-direction:column;gap:8px">
        ${fields.map(f => `<div>
          <div style="font-size:10px;color:rgba(255,255,255,.45);margin-bottom:4px">${eh(f.label)}</div>
          <input id="lp-${f.key}" value="${eh(f.val)}" placeholder="${eh(f.ph)}"
            style="width:100%;padding:9px 11px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:12px;box-sizing:border-box;outline:none">
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
        <button id="lp-cfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:linear-gradient(90deg,#16a34a,#4ade80);color:#fff;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
        <button id="lp-cfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
      </div>
    </div>`;

    const close = () => ov.remove();
    ov.querySelector('#lp-cfg-close').onclick = close;
    ov.querySelector('#lp-cfg-cancel').onclick = close;
    ov.onclick = e => { if (e.target === ov) close(); };
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }});

    ov.querySelector('#lp-cfg-save').addEventListener('click', () => {
      const newCfg = {};
      fields.forEach(f => { newCfg[f.key] = (ov.querySelector(`#lp-${f.key}`)?.value || '').trim(); });
      close();
      if (typeof onSave === 'function') onSave(newCfg);
    });

    document.body.appendChild(ov);
  }

  /* ── PREVIEW per Store ── */
  function preview() {
    const mockCfg = {
      label:'LetPot Max', power:'switch.letpot_max_power', waterLevel:'sensor.letpot_max_water_level',
      temp:'sensor.letpot_max_temperatura', plantsAge:'sensor.letpot_max_plants_age',
      pump:'binary_sensor.letpot_max_pump', lightOn:'time.letpot_max_light_on',
      lightOff:'time.letpot_max_light_off', lightBrightness:'number.letpot_max_light_brightness',
      lightMode:'select.letpot_max_modalita_luce', autoMode:'switch.letpot_max_auto_mode',
      pumpCycling:'switch.letpot_max_pump_cycling', lowWater:'binary_sensor.letpot_max_low_water',
      lowNutrients:'binary_sensor.letpot_max_low_nutrients', refillError:'binary_sensor.letpot_max_refill_error',
    };
    const mockH = {
      states: {
        'switch.letpot_max_power':                  { state:'on' },
        'switch.letpot_max_auto_mode':              { state:'on' },
        'switch.letpot_max_pump_cycling':           { state:'on' },
        'sensor.letpot_max_water_level':            { state:'90' },
        'sensor.letpot_max_temperatura':            { state:'27.0', attributes:{unit_of_measurement:'°C'} },
        'sensor.letpot_max_plants_age':             { state:'5' },
        'binary_sensor.letpot_max_pump':            { state:'off' },
        'time.letpot_max_light_on':                 { state:'06:00:00' },
        'time.letpot_max_light_off':                { state:'18:00:00' },
        'number.letpot_max_light_brightness':       { state:'2' },
        'select.letpot_max_modalita_luce':          { state:'Verdure/Erbe aromatiche' },
        'binary_sensor.letpot_max_low_water':       { state:'off' },
        'binary_sensor.letpot_max_low_nutrients':   { state:'off' },
        'binary_sensor.letpot_max_refill_error':    { state:'off' },
      }
    };
    return render(mockCfg, mockH);
  }

  /* ── REGISTRAZIONE ── */
  const CARD = {
    id: ID,
    name: 'LetPot Max',
    icon: '🌿',
    desc: 'Sistema idroponico LetPot Max — livello acqua, pompa, luci LED, temperatura, alerts',
    version: '1.0',
    isDistintivo: true,
    defaultCfg: {
      label: 'LetPot Max',
      power: '', autoMode: '', pumpCycling: '',
      waterLevel: '', temp: '', plantsAge: '',
      pump: '', lightOn: '', lightOff: '',
      lightBrightness: '', lightMode: '',
      lowWater: '', lowNutrients: '', refillError: '',
    },
    chip, watchEntities, render, mount, update, configure, preview,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: letpot-max v1.0'); } catch (e) {}
})();
