/* frarik-version: 1.9 */
/**
 * GruppoPrese.js — Distintivo FratechStore v1.9
 * Chip · riquadro riassuntivo · colori % · kWh auto-accumulati · picker icona per presa
 * v1.9: snake fluido (animation-delay negativo) · sensore energia sempre visibile senza ▾
 */
(function () {
  'use strict';

  const ID = 'gruppo-prese';
  const ON_STATES = ['on','open','unlocked','playing','heating','cooling','active','home','present','detected','wet','running','charging'];
  const MAX_W_DEFAULT = 2300; // watt massimi presa standard IT
  /* timestamp fisso al caricamento del modulo: permette animation-delay negativo
     per riprendere l'animazione snake da dove era arrivata invece di ripartire da 0 */
  const _GP_ANIM_T0 = Date.now();

  /* ── helpers ── */
  function H() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    return null;
  }
  function loadCfg(cfg) { return cfg && typeof cfg === 'object' ? cfg : {}; }
  function nameOf(h, id) {
    const s = h && h.states && h.states[id];
    return (s && s.attributes && s.attributes.friendly_name) || (id && id.includes('.') ? id.split('.')[1].replace(/_/g,' ') : (id||''));
  }
  function stateOf(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || 'unknown'; }
  function isOn(h, id) { return ON_STATES.includes(stateOf(h, id).toLowerCase()); }
  function numOf(h, id) {
    if (!h || !id) return null;
    const s = h && h.states && h.states[id]; if (!s) return null;
    const v = parseFloat(s.state); return isNaN(v) ? null : v;
  }
  function callSvc(domain, svc, entityId) {
    if (typeof window.callSvc === 'function') { window.callSvc(domain, svc, entityId); return; }
    const hh = H(); if (hh && hh.callService) hh.callService(domain, svc, { entity_id: entityId });
  }
  function eh(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function hex2rgba(hex, a) {
    let h = (hex||'').replace('#','');
    if (h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length!==6) return `rgba(255,255,255,${a})`;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }
  function liveH(rawHass) { return H() || (rawHass && rawHass.states ? rawHass : null); }
  function iconHtml(ico, sz) {
    sz = sz||16;
    if (typeof ico==='string' && ico.startsWith('mdi:'))
      return `<span class="mdi mdi-${ico.slice(4)}" style="font-size:${sz}px;line-height:1;color:inherit"></span>`;
    return `<span style="font-size:${sz}px;line-height:1">${ico||'🔌'}</span>`;
  }
  function fmtW(w) {
    if (w===null||w===undefined) return null;
    if (w>=1000) return (w/1000).toFixed(1)+' kW';
    return Math.round(w)+' W';
  }

  const COL_ON    = '#4ade80'; // verde accesa
  const COL_OFF   = '#ef4444'; // rosso spenta
  const COL_UNAVL = '#ef4444'; // rosso unavailable
  const COL_UNK   = '#f87171'; // rosso chiaro unknown

  /* ── stato presa: on / off / unavailable / unknown ── */
  function socketStatus(h, entityId) {
    if (!h || !h.states) return { on:false, unavail:true, unknown:false, label:'Non disponibile', mainCol:COL_UNAVL, canToggle:false };
    const s = h.states[entityId];
    if (!s) return { on:false, unavail:true, unknown:false, label:'Non disponibile', mainCol:COL_UNAVL, canToggle:false };
    const st = (s.state||'').toLowerCase();
    if (st==='unavailable') return { on:false, unavail:true,  unknown:false, label:'Non disponibile', mainCol:COL_UNAVL, canToggle:false };
    if (st==='unknown')     return { on:false, unavail:false, unknown:true,  label:'Sconosciuta',     mainCol:COL_UNK,   canToggle:false };
    const on = ON_STATES.includes(st);
    return { on, unavail:false, unknown:false, label: on?'Accesa':'Spenta', mainCol: on?COL_ON:COL_OFF, canToggle:true };
  }

  /* colore flusso in base alla % sul max configurato (verde→giallo→arancio→rosso) */
  function flowColor(w, maxW) {
    if (w===null || w<=0) return '#4ade80';
    const pct = Math.min(100, (w / (maxW || MAX_W_DEFAULT)) * 100);
    if (pct >= 85) return '#ef4444'; // rosso
    if (pct >= 65) return '#f97316'; // arancio
    if (pct >= 40) return '#facc15'; // giallo
    return '#4ade80';               // verde
  }
  /* velocità flusso: ms per ciclo (meno = più veloce)
     Scala logaritmica: distingue bene i bassi consumi (9W vs 97W percettibilmente diversi)
     1W→7000ms (lentissimo), 3600W→600ms (veloce) */
  function flowSpeed(w) {
    if (w===null||w<=0) return 0;
    const ratio = Math.min(1, Math.max(0, Math.log(w) / Math.log(3600)));
    return Math.round(7000 - ratio * (7000 - 600));
  }

  /* ── chip ── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    let active=0, totalW=null, hasUnavail=false;
    if (h) {
      let sum=0, hasPwr=false;
      ents.forEach(e => {
        const st = socketStatus(h, e.entity);
        if (st.on) active++;
        if (st.unavail||st.unknown) hasUnavail=true;
        if (e.power_entity && st.on) { const w=numOf(h,e.power_entity); if(w!==null){sum+=w;hasPwr=true;} }
      });
      if (hasPwr) totalW=sum;
    }
    const value = ents.length
      ? (totalW!==null ? `${active}/${ents.length} · ${fmtW(totalW)}` : `${active}/${ents.length}`)
      : '—';
    const chipCol = hasUnavail && active===0 ? COL_UNAVL : active>0 ? COL_ON : 'rgba(255,255,255,0.32)';
    return { icon: iconHtml(c.icon||'🔌'), label: c.label||'Prese', value, color: chipCol };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const ids = ents.map(e=>e.entity).filter(Boolean);
    ents.forEach(e=>{ if(e.power_entity) ids.push(e.power_entity); if(e.energy_entity) ids.push(e.energy_entity); if(e.automation) ids.push(e.automation); });
    return ids;
  }

  /* ── CSS condiviso (iniettato una volta) ── */
  const CSS = `
    @keyframes gpsnake{0%{left:-55%}100%{left:105%}}
    @keyframes gppulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.7);opacity:0}}
    @keyframes gpblink{0%,100%{opacity:1}50%{opacity:.2}}
    .gp-flow-track{position:relative;height:8px;border-radius:5px;overflow:hidden;background:rgba(255,255,255,.07)}
    .gp-snake{position:absolute;top:0;height:100%;width:55%;border-radius:5px;animation-name:gpsnake;animation-timing-function:linear;animation-iteration-count:infinite}
    .gp-dot-ring{position:absolute;border-radius:50%;animation:gppulse 1.6s ease-in-out infinite;pointer-events:none}
    .gp-blink{animation:gpblink 1s ease-in-out infinite}
  `;
  function _injectCss(){
    if(document.getElementById('gp-style')) return;
    const s=document.createElement('style'); s.id='gp-style'; s.textContent=CSS;
    document.head.appendChild(s);
  }

  /* ── accumulo energia giornaliera (senza sensore) ──
     Chiave localStorage: _gpkwh_{entity}_{yyyy-mm-dd}  (no frarik_ → non sincronizzata) */
  function _todayKey() { return new Date().toISOString().slice(0,10); }
  function _gpKwhKey(entityId) { return '_gpkwh_'+entityId+'_'+_todayKey(); }
  function _gpGetKwh(entityId) { return parseFloat(localStorage.getItem(_gpKwhKey(entityId))||'0'); }
  function _gpAddKwh(entityId, watts, deltaMs) {
    if (!watts || watts<=0 || deltaMs<=0) return;
    const k = _gpKwhKey(entityId);
    const prev = parseFloat(localStorage.getItem(k)||'0');
    localStorage.setItem(k, (prev + watts * deltaMs / 3600000).toFixed(5));
  }

  /* ── render popup ── */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const col = c.color || '#fb923c';
    const maxW = c.maxW || MAX_W_DEFAULT;

    let totalW=null, totalActive=0, totalDailyKwh=null;
    if (h) {
      let sum=0, hasPwr=false;
      ents.forEach(e=>{
        const st=socketStatus(h,e.entity); if(st.on) totalActive++;
        if(e.power_entity&&st.on){const w=numOf(h,e.power_entity);if(w!==null){sum+=w;hasPwr=true;}}
        /* kWh giornalieri: usa sensore se configurato, altrimenti accumulo automatico */
        const kw = e.energy_entity ? numOf(h,e.energy_entity) : _gpGetKwh(e.entity);
        if(kw>0) totalDailyKwh=(totalDailyKwh||0)+kw;
      });
      if(hasPwr) totalW=sum;
    }

    const totalPct = totalW!==null ? Math.min(100, Math.round((totalW/maxW)*100)) : null;
    const fCol = flowColor(totalW, maxW);
    const fSpd = flowSpeed(totalW);

    /* ── riquadro riassuntivo in cima (sempre visibile) ── */
    const allOff = totalActive === 0;
    const allOn  = ents.length > 0 && totalActive === ents.length;
    const statusLabel = allOff
      ? `<span style="color:${COL_OFF}">Tutto spento</span>`
      : allOn
        ? `<span style="color:${COL_ON}">Tutte accese</span>`
        : `<span style="color:${COL_ON}">${totalActive}</span><span style="color:#fff"> / ${ents.length} accese</span>`;

    /* stat W: mostra solo se almeno una presa ha sensore watt */
    const statW = totalW!==null
      ? `<div style="text-align:center;padding:0 8px;border-left:1px solid rgba(255,255,255,.07);border-right:1px solid rgba(255,255,255,.07)">
           <div style="font-size:22px;font-weight:900;letter-spacing:-.5px;color:${fCol};line-height:1">${fmtW(totalW)}</div>
           <div style="font-size:9px;color:#fff;margin-top:3px;text-transform:uppercase;letter-spacing:.5px">consumo</div>
         </div>`
      : '';
    const maxKwLabel = maxW >= 1000 ? (maxW/1000).toFixed(1).replace('.0','')+' kW' : maxW+' W';
    const statPct = totalPct!==null
      ? `<div style="text-align:center">
           <div style="font-size:22px;font-weight:900;color:${fCol};line-height:1">${totalPct}<span style="font-size:13px;font-weight:700">%</span></div>
           <div style="font-size:9px;color:#fff;margin-top:3px;text-transform:uppercase;letter-spacing:.5px">di ${maxKwLabel}</div>
         </div>`
      : '';

    /* barra carico + snake (solo se ha sensori W) */
    const loadBar = totalW!==null ? `
      <div class="gp-flow-track" style="height:6px;margin:10px 0 0">
        <div style="position:absolute;top:0;left:0;height:100%;width:${totalPct}%;background:${fCol};border-radius:3px;transition:width .6s"></div>
        ${fSpd?`<div class="gp-snake" style="background:linear-gradient(90deg,transparent 0%,${fCol}22 25%,${fCol}88 70%,${fCol} 90%,#fff 100%);animation-duration:${fSpd}ms;animation-delay:-${(Date.now()-_GP_ANIM_T0)%fSpd}ms"></div>`:''}
      </div>` : '';

    const hasTwoStats = statW && statPct;
    const statsRow = ents.length ? `
      <div style="display:grid;grid-template-columns:${hasTwoStats?'1fr 1fr 1fr':'1fr'};gap:0;align-items:center;padding:4px 0 2px">
        <div style="text-align:center">
          <div style="font-size:22px;font-weight:900;line-height:1">${statusLabel}</div>
          <div style="font-size:9px;color:#fff;margin-top:3px;text-transform:uppercase;letter-spacing:.5px">prese</div>
        </div>
        ${statW}
        ${statPct}
      </div>
      ${loadBar}` : '';

    const dailyTotalRow = totalDailyKwh!==null
      ? `<div style="text-align:center;margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,255,255,.06)">
           <span style="font-size:10px;color:#fff">📅 Oggi: </span>
           <span style="font-size:12px;font-weight:800;color:#fff">${totalDailyKwh.toFixed(2)} kWh</span>
           <span style="font-size:9px;color:#fff"> totali</span>
         </div>` : '';

    const ctrlBtns = ents.length ? `
      <div style="display:flex;gap:8px;margin-top:12px">
        <button data-gp-all="on" style="flex:1;padding:7px 0;border-radius:8px;border:1px solid rgba(74,222,128,.4);background:rgba(74,222,128,.1);color:${COL_ON};font-size:11px;font-weight:700;cursor:pointer">⚡ Accendi tutte</button>
        <button data-gp-all="off" style="flex:1;padding:7px 0;border-radius:8px;border:1px solid rgba(239,68,68,.3);background:rgba(239,68,68,.07);color:${COL_OFF};font-size:11px;font-weight:700;cursor:pointer">⏻ Spegni tutte</button>
      </div>` : '';

    const totalBar = ents.length ? `
      <div style="padding:12px 14px 10px">
        <div style="border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);padding:14px">
          ${statsRow}
          ${dailyTotalRow}
          ${ctrlBtns}
        </div>
      </div>` : '';

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const st = h ? socketStatus(h, e.entity) : { on:false, unavail:false, unknown:false, label:'—', mainCol:COL_OFF, canToggle:false };
      const lbl = e.label || nameOf(h, e.entity);
      const hasPowerSensor = !!(e.power_entity && e.power_entity.trim());
      const w = (h && hasPowerSensor) ? numOf(h, e.power_entity) : null;
      const pct = (w!==null && w>=0) ? Math.min(100, Math.round((w/maxW)*100)) : null;
      const fSpd2 = flowSpeed(w);
      const fCol2 = flowColor(w, maxW);
      const mc = st.mainCol;
      const dailyKwh = h ? (e.energy_entity ? numOf(h,e.energy_entity) : _gpGetKwh(e.entity)||null) : null;

      /* ── cerchio stato (sinistra) ── */
      const isError = st.unavail || st.unknown;
      const blinkClass = isError ? ' class="gp-blink"' : '';
      const circBg = isError ? `rgba(239,68,68,.15)` : st.on ? `rgba(74,222,128,.15)` : `rgba(239,68,68,.1)`;
      const circBorder = `2px solid ${mc}`;
      const circIcon = st.unavail ? '⚠️' : st.unknown ? '❓' : iconHtml(e.icon||c.icon||'🔌', 18);
      const circIconCol = st.on ? COL_ON : mc;
      /* ring pulsante sempre quando accesa */
      const ringCol = (w!==null && w>10) ? fCol2 : COL_ON;
      const pulseRing = st.on
        ? `<div class="gp-dot-ring" style="inset:-6px;border:2px solid ${ringCol};opacity:.55"></div>` : '';

      const dot = `<div style="position:relative;width:44px;height:44px;flex-shrink:0">
        ${pulseRing}
        <div${blinkClass} style="position:absolute;inset:0;border-radius:50%;background:${circBg};border:${circBorder};display:flex;align-items:center;justify-content:center;color:${circIconCol}">
          ${circIcon}
        </div>
      </div>`;

      /* ── testi stato + watt ── */
      const wattStr = w!==null ? fmtW(w) : null;
      let statusLine;
      if (st.unavail) {
        statusLine = `<span class="gp-blink" style="font-size:12px;color:${COL_UNAVL};font-weight:800">⚡ Non disponibile</span>`;
      } else if (st.unknown) {
        statusLine = `<span class="gp-blink" style="font-size:12px;color:${COL_UNK};font-weight:800">❓ Sconosciuta</span>`;
      } else if (st.on) {
        statusLine = `<span style="font-size:13px;color:${COL_ON};font-weight:800">● Accesa${wattStr?` &nbsp;<strong style="font-size:14px;letter-spacing:-.3px">${wattStr}</strong>`:''}</span>`;
      } else {
        statusLine = `<span style="font-size:13px;color:${COL_OFF};font-weight:800">● Spenta</span>`;
      }

      /* ── toggle ── */
      const swBg = st.on ? COL_ON : 'rgba(255,255,255,.12)';
      const thumbL = st.on ? '21px' : '2px';
      const toggle = st.canToggle
        ? `<button data-gp-toggle="${i}" style="width:46px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;background:${swBg};transition:background .2s;outline:none;flex-shrink:0">
            <div style="position:absolute;top:3px;left:${thumbL};width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transition:left .18s;pointer-events:none"></div>
           </button>`
        : `<div style="width:46px;height:26px;border-radius:13px;background:rgba(255,255,255,.05);border:1px solid ${mc}44;flex-shrink:0;display:flex;align-items:center;justify-content:center">
            <span style="font-size:9px;color:#fff">N/D</span>
           </div>`;

      /* ── barra consumo + flusso (solo se accesa e ha sensore watt) ── */
      let powerBar = '';
      if (st.on && hasPowerSensor) {
        const barPct = pct!==null ? pct : 0;
        const barFill = pct!==null ? `<div style="position:absolute;inset:0;width:${barPct}%;background:${fCol2};border-radius:4px;transition:width .5s"></div>` : '';
        const dots = (fSpd2>0) ? `
          <div class="gp-snake" style="background:linear-gradient(90deg,transparent 0%,${fCol2}22 25%,${fCol2}88 70%,${fCol2} 90%,#fff 100%);animation-duration:${fSpd2}ms;animation-delay:-${(Date.now()-_GP_ANIM_T0)%fSpd2}ms"></div>` : '';
        powerBar = `
          <div style="padding:4px 16px 10px">
            <div class="gp-flow-track">
              ${barFill}
              ${dots}
            </div>
          </div>`;
      }

      /* ── kWh giornalieri presa ── */
      const dailyBadge = dailyKwh!==null
        ? `<span style="margin-left:8px;font-size:10px;color:#fff;font-weight:600">📅 ${dailyKwh.toFixed(2)} kWh</span>` : '';

      /* ── automazione ── */
      let autoBadge = '';
      if (e.automation && h) {
        const autoOn = isOn(h, e.automation);
        autoBadge = `<div style="padding:0 16px 10px"><button data-gp-auto="${i}" style="padding:4px 10px;border-radius:6px;border:1px solid ${autoOn?'rgba(74,222,128,.35)':'rgba(248,113,113,.35)'};background:${autoOn?'rgba(74,222,128,.08)':'rgba(248,113,113,.08)'};color:${autoOn?'#4ade80':'#f87171'};cursor:pointer;font-size:9px;font-weight:700">${autoOn?'🟢 Auto attiva':'🔴 Auto disattiva'}</button></div>`;
      }

      return `<div style="border-bottom:1px solid rgba(255,255,255,.05)">
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px ${powerBar?'4px':'10px'}">
          ${dot}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            <div style="margin-top:3px;display:flex;align-items:center;flex-wrap:wrap;gap:2px">${statusLine}${dailyBadge}</div>
          </div>
          ${toggle}
        </div>
        ${powerBar}
        ${autoBadge}
      </div>`;
    }).join('');

    const empty = `<div style="padding:32px 20px;text-align:center;color:#fff;font-size:12px">
      Nessuna presa configurata.<br><span style="font-size:10px">Clicca ✏️ sulla chip per configurare.</span>
    </div>`;

    return `<div id="gp-popup-body" style="font-family:system-ui,sans-serif">
      ${totalBar}
      <div>${rows||empty}</div>
    </div>`;
  }

  /* ── mount ── */
  function _mountHandlers(cfg, el) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    if (el._gpHandler) el.removeEventListener('click', el._gpHandler);
    function handler(ev) {
      const tog = ev.target.closest('[data-gp-toggle]');
      if (tog) {
        const e = ents[parseInt(tog.dataset.gpToggle)]; if (!e) return;
        const on = isOn(H(), e.entity);
        tog.style.background = on ? 'rgba(255,255,255,.12)' : COL_ON;
        const thumb = tog.querySelector('div');
        if (thumb) { thumb.style.transition='left .18s'; thumb.style.left=on?'2px':'22px'; }
        callSvc(e.entity.split('.')[0], on?'turn_off':'turn_on', e.entity);
        ev.stopPropagation(); return;
      }
      const auto = ev.target.closest('[data-gp-auto]');
      if (auto) {
        const e = ents[parseInt(auto.dataset.gpAuto)]; if (!e||!e.automation) return;
        const autoOn = isOn(H(), e.automation);
        callSvc('automation', autoOn?'turn_off':'turn_on', e.automation);
        ev.stopPropagation(); return;
      }
      const allBtn = ev.target.closest('[data-gp-all]');
      if (allBtn) {
        const svc = allBtn.dataset.gpAll==='on'?'turn_on':'turn_off';
        ents.forEach(e=>{ if(e.entity){ const st=socketStatus(H(),e.entity); if(st.canToggle) callSvc(e.entity.split('.')[0],svc,e.entity); } });
        setTimeout(()=>{ if(!el.isConnected) return; el.innerHTML=render(cfg,null); _mountHandlers(cfg,el); },1000);
        ev.stopPropagation(); return;
      }
    }
    el._gpHandler = handler;
    el.addEventListener('click', handler);
  }

  function _syncTitle(cfg, el) {
    try {
      const hdr = el.previousElementSibling; if (!hdr) return;
      const textWrap = hdr.children?.[1]; if (!textWrap) return;
      const titleEl = textWrap.firstElementChild; if (!titleEl) return;
      const subEl = textWrap.children?.[1]; if (subEl) subEl.style.display='none';
      const c = loadCfg(cfg);
      const ents = Array.isArray(c.entities) ? c.entities : [];
      const h = H(); if (!h) return;
      let active=0, totalW=null, hasPwr=false;
      ents.forEach(e=>{
        const st=socketStatus(h,e.entity); if(st.on) active++;
        if(e.power_entity&&st.on){const w=numOf(h,e.power_entity);if(w!==null){totalW=(totalW||0)+w;hasPwr=true;}}
      });
      titleEl.style.color = active>0 ? COL_ON : COL_OFF;
      titleEl.textContent = active===0
        ? 'Tutte spente'
        : hasPwr && totalW!==null
          ? `${active} acces${active===1?'a':'e'} · ${fmtW(totalW)}`
          : `${active} pres${active===1?'a':'e'} acces${active===1?'a':'e'}`;
    } catch(e) {}
  }

  function mount(cfg, rawHass, el) {
    _injectCss();
    _mountHandlers(cfg, el);
    setTimeout(()=>_syncTitle(cfg,el), 0);
    if (el._gpPoll) return;
    el._gpLastPoll = Date.now();
    el._gpPoll = setInterval(()=>{
      if (!el.isConnected) { clearInterval(el._gpPoll); delete el._gpPoll; return; }
      try {
        const h = H(); if (!h) return;
        const now = Date.now();
        const deltaMs = now - (el._gpLastPoll||now);
        el._gpLastPoll = now;
        /* accumulo kWh automatico per le prese attive con sensore watt */
        const c2 = loadCfg(cfg);
        (Array.isArray(c2.entities)?c2.entities:[]).forEach(e=>{
          if(e.entity && e.power_entity && !e.energy_entity){
            const st=socketStatus(h,e.entity);
            if(st.on){ const w=numOf(h,e.power_entity); _gpAddKwh(e.entity,w,deltaMs); }
          }
        });
        el.innerHTML = render(cfg, h);
        _mountHandlers(cfg, el);
        _syncTitle(cfg, el);
      } catch(e) {}
    }, 1500);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML=render(cfg,null); _mountHandlers(cfg,el); } catch(e){}
  }

  /* ── configure ── (stessa struttura v1.0, aggiunto campo maxW) */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const ents = JSON.parse(JSON.stringify(Array.isArray(c.entities) ? c.entities : []));
    const h = H();
    let expandedFields = new Set();
    let _firstRender = true;

    let _acDrop = null;
    function _closeAc() { if (_acDrop) { try { _acDrop.remove(); } catch(e){} _acDrop=null; } }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 220;
      const useAbove = (window.innerHeight - rect.bottom - 6) < MAXH && rect.top > MAXH;
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight-rect.top+4}px` : `top:${rect.bottom+4}px`;
      _acDrop.style.cssText=`position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(251,147,60,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
      matches.forEach(m=>{
        const r=document.createElement('div');
        r.style.cssText='padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML=`<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;flex-shrink:0">${m.icon||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:#fff">${eh(m.id)}${m.stateLabel?` · <span style="color:rgba(251,147,60,.9)">${eh(m.stateLabel)}</span>`:''}</div>
          </div>
        </div>`;
        r.addEventListener('mouseover',()=>{r.style.background='rgba(251,147,60,.08)';});
        r.addEventListener('mouseout', ()=>{r.style.background='transparent';});
        r.addEventListener('mousedown',ev=>{ev.preventDefault();onPick(m.id,m.name);_closeAc();});
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
      inp.focus();
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.addEventListener('input',()=>{ const q=(inp.value||'').toLowerCase().trim(); if(!q){_closeAc();return;} _openAc(inp,filterFn(q).slice(0,12),onPick); });
      inp.addEventListener('focus',()=>{ const q=(inp.value||'').toLowerCase().trim(); if(q) _openAc(inp,filterFn(q).slice(0,12),onPick); });
      inp.addEventListener('blur', ()=>setTimeout(_closeAc,160));
    }

    function _switchMatches(q) {
      if (!h||!h.states) return [];
      const lq=q.toLowerCase();
      const icons={switch:'🔌',light:'💡',automation:'🤖',sensor:'📡',binary_sensor:'🔵',fan:'💨',media_player:'📺',climate:'🌡️',cover:'🪟'};
      return Object.keys(h.states)
        .filter(id=>nameOf(h,id).toLowerCase().includes(lq)||id.toLowerCase().includes(lq))
        .map(id=>{ const dom=id.split('.')[0]; const on=isOn(h,id); return {id,name:nameOf(h,id),on,icon:icons[dom]||'📦',stateLabel:on?'Accesa/On':'Spenta/Off'}; })
        .sort((a,b)=>{ const as=a.id.startsWith('switch.')?0:1,bs=b.id.startsWith('switch.')?0:1; if(as!==bs) return as-bs; return a.name.localeCompare(b.name); });
    }
    function _sensorMatches(q) {
      if (!h||!h.states) return [];
      const lq=q.toLowerCase();
      return Object.keys(h.states)
        .filter(id=>(id.startsWith('sensor.')||id.startsWith('input_number.'))&&(id.includes(lq)||nameOf(h,id).toLowerCase().includes(lq)))
        .map(id=>({id,name:nameOf(h,id),on:false,icon:'📡',stateLabel:(h.states[id].state||'—')+(h.states[id].attributes?.unit_of_measurement||'')}))
        .sort((a,b)=>a.name.localeCompare(b.name));
    }
    function _autoMatches(q) {
      if (!h||!h.states) return [];
      return Object.keys(h.states)
        .filter(id=>id.startsWith('automation.')&&(id.includes(q)||nameOf(h,id).toLowerCase().includes(q)))
        .map(id=>({id,name:nameOf(h,id),icon:'🤖',on:false,stateLabel:''}))
        .sort((a,b)=>a.name.localeCompare(b.name));
    }

    const ov = document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try{document.body.removeChild(ov);}catch(e){} document.removeEventListener('keydown',escFn); }
    function escFn(ev) { if(ev.key==='Escape') closeOv(); }
    document.addEventListener('keydown',escFn);

    function renderForm() {
      const col = c.color||'#fb923c';
      const selRows = ents.map((e,i)=>{
        const lbl=e.label||nameOf(h,e.entity);
        const st=h?socketStatus(h,e.entity):{on:false,unavail:false,unknown:false,dotColor:'rgba(255,255,255,.2)'};
        const exp=expandedFields.has(i);
        const hasPwr=!!(e.power_entity&&e.power_entity.trim());
        const hasAuto=!!(e.automation&&e.automation.trim());
        const hasEnergy=!!(e.energy_entity&&e.energy_entity.trim());
        /* ⚡ watt + 📅 energia: sempre visibili, side by side */
        const sensorsRow = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px">
            <div style="min-width:0">
              <div style="font-size:8px;color:#fff;margin-bottom:3px;letter-spacing:.3px;text-transform:uppercase">⚡ Watt (opz.)</div>
              ${hasPwr
                ? `<div style="display:flex;align-items:center;gap:4px">
                    <span style="flex:1;font-size:9px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(e.power_entity)}</span>
                    <button data-rmpwr="${i}" style="font-size:8px;padding:1px 5px;border-radius:3px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.1);color:#f87171;cursor:pointer;flex-shrink:0">✕</button>
                  </div>`
                : `<input data-pwr-idx="${i}" placeholder="sensor.presa_power" value="${eh(e.power_entity||'')}" style="width:100%;box-sizing:border-box;padding:4px 7px;border-radius:6px;border:1px solid rgba(251,147,60,.22);background:rgba(251,147,60,.05);color:#fff;font-size:9px;outline:none;font-family:inherit">`
              }
            </div>
            <div style="min-width:0">
              <div style="font-size:8px;color:#fff;margin-bottom:3px;letter-spacing:.3px;text-transform:uppercase">📅 Energia oggi (opz.)</div>
              ${hasEnergy
                ? `<div style="display:flex;align-items:center;gap:4px">
                    <span style="flex:1;font-size:9px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(e.energy_entity)}</span>
                    <button data-rmenergy="${i}" style="font-size:8px;padding:1px 5px;border-radius:3px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.1);color:#f87171;cursor:pointer;flex-shrink:0">✕</button>
                  </div>`
                : `<input data-energy-idx="${i}" placeholder="sensor.presa_oggi" value="${eh(e.energy_entity||'')}" style="width:100%;box-sizing:border-box;padding:4px 7px;border-radius:6px;border:1px solid rgba(99,102,241,.22);background:rgba(99,102,241,.05);color:#fff;font-size:9px;outline:none;font-family:inherit">`
              }
            </div>
          </div>`;
        /* ▾ sezione espansa: solo icona + automazione */
        const extraSection=exp?`
          <div style="margin-top:6px;padding:8px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;gap:6px">
            <div>
              <div style="font-size:9px;color:#fff;margin-bottom:3px">🎨 Icona</div>
              <div style="display:flex;gap:6px;align-items:center">
                <button data-icon-pick="${i}" style="width:38px;height:34px;border-radius:8px;border:1px solid rgba(251,147,60,.3);background:rgba(251,147,60,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">${iconHtml(e.icon||'🔌',20)}</button>
                <input data-icon-idx="${i}" placeholder="emoji o mdi:power-socket" value="${eh(e.icon||'')}" style="flex:1;box-sizing:border-box;padding:6px 9px;border-radius:7px;border:1px solid rgba(251,147,60,.2);background:rgba(251,147,60,.04);color:#fff;font-size:12px;outline:none;font-family:inherit">
              </div>
            </div>
            <div>
              <div style="font-size:9px;color:#fff;margin-bottom:3px">🤖 Automazione (opzionale)</div>
              ${hasAuto?`<div style="display:flex;align-items:center;gap:6px">
                <span style="flex:1;font-size:10px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(e.automation)}</span>
                <button data-rmauto="${i}" style="font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.1);color:#f87171;cursor:pointer">✕</button>
              </div>`:`<input data-auto-idx="${i}" placeholder="🔍 Cerca automazione…" value="${eh(e.automation||'')}" style="width:100%;box-sizing:border-box;padding:6px 9px;border-radius:7px;border:1px solid rgba(99,102,241,.3);background:rgba(99,102,241,.07);color:#fff;font-size:11px;outline:none;font-family:inherit">`}
            </div>
          </div>`:'';
        const outletIcon = e.icon ? iconHtml(e.icon, 15) : (st.unavail?'⚠️':st.unknown?'❓':'🔌');
        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid ${st.on?hex2rgba(col,.25):st.unavail?'rgba(239,68,68,.2)':st.unknown?'rgba(245,158,11,.2)':'rgba(255,255,255,.08)'};margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;flex-shrink:0">${outletIcon}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:${st.unavail?'#ef4444':st.unknown?'#f59e0b':'#fff'}">${eh(e.entity)}</div>
            </div>
            <button data-expand="${i}" title="${exp?'Chiudi':'Icona / Automazione'}" style="width:26px;height:26px;border:none;border-radius:6px;background:${exp?hex2rgba(col,.18):'rgba(255,255,255,.07)'};color:${exp?col:'#fff'};cursor:pointer;font-size:12px;flex-shrink:0">${exp?'▲':'▾'}</button>
            <button data-del="${i}" style="width:26px;height:26px;border:none;border-radius:6px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
          </div>
          ${sensorsRow}
          ${extraSection}
        </div>`;
      }).join('');

      const anim=_firstRender?'animation:gpCfgUp .22s cubic-bezier(.32,1.12,.56,1)':'';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(251,147,60,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes gpCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .gpcinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s} .gpcinp:focus{border-color:rgba(251,147,60,.5)} .gpcinp::placeholder{color:rgba(255,255,255,.55)} #gpcfg-body::-webkit-scrollbar{display:none}</style>
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(251,147,60,.13);border:1px solid rgba(251,147,60,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🔌</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Prese</div>
            <div style="font-size:10px;color:#fff">${ents.length} pres${ents.length===1?'a':'e'} selezionat${ents.length===1?'a':'e'}</div>
          </div>
          <button id="gpcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>
        <div id="gpcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:10px">
            <div style="flex:1"><div style="font-size:9px;color:#fff;margin-bottom:3px">Nome</div><input id="gpcfg-label" class="gpcinp" placeholder="Prese" value="${eh(c.label||'Prese')}"></div>
            <div style="flex:0 0 56px"><div style="font-size:9px;color:#fff;margin-bottom:3px">Icona</div><button id="gpcfg-icon-btn" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;outline:none;color:#fff">${iconHtml(c.icon||'🔌',22)}</button><input type="hidden" id="gpcfg-icon" value="${eh(c.icon||'🔌')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:#fff;margin-bottom:3px">Colore</div><input type="color" id="gpcfg-color" value="${(c.color||'#fb923c').match(/^#[0-9a-f]{6}$/i)?c.color:'#fb923c'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1">
              <div style="font-size:9px;color:#fff;margin-bottom:3px">⚡ Potenza disponibile (kW) — es. 4.5 · 3 · 6</div>
              <input id="gpcfg-maxw" class="gpcinp" type="number" step="0.1" min="0.5" placeholder="4.5" value="${eh(String(c.maxW ? (c.maxW/1000) : ''))}">
              <div style="font-size:9px;color:#fff;margin-top:3px">Serve per la % di carico e i colori (verde→giallo→arancio→rosso)</div>
            </div>
          </div>
          ${ents.length?`<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px">Prese (${ents.length}) <span style="font-size:8px;font-weight:400">▾ = icona + automazione · il kWh totale si somma automaticamente</span></div><div>${selRows}</div>`:''}
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin:${ents.length?'12px':0} 0 6px">Aggiungi presa</div>
          <input id="gpcfg-add-entity" class="gpcinp" placeholder="🔍 Inizia a scrivere il nome della presa…" autocomplete="off">
          <div style="font-size:9px;color:#fff;margin-top:5px">switch.* compaiono per prime · inserisci watt + sensore energia direttamente · ▾ = icona + automazione</div>
          <div style="height:16px"></div>
        </div>
        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gpcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#fb923c;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gpcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody=ov.querySelector('#gpcfg-body');
      const savedScroll=prevBody?prevBody.scrollTop:0;
      const curLabel=ov.querySelector('#gpcfg-label')?.value;
      const curIcon=ov.querySelector('#gpcfg-icon')?.value;
      const curColor=ov.querySelector('#gpcfg-color')?.value;
      ov.innerHTML=renderForm(); _firstRender=false;
      const nb=ov.querySelector('#gpcfg-body'); if(nb&&savedScroll>0) nb.scrollTop=savedScroll;
      if(curLabel!==undefined){const f=ov.querySelector('#gpcfg-label');if(f)f.value=curLabel;}
      if(curIcon!==undefined){const f=ov.querySelector('#gpcfg-icon');if(f)f.value=curIcon;const b=ov.querySelector('#gpcfg-icon-btn');if(b)b.innerHTML=iconHtml(curIcon,22);}
      if(curColor!==undefined){const f=ov.querySelector('#gpcfg-color');if(f)f.value=curColor;}

      ov.querySelector('#gpcfg-icon-btn')?.addEventListener('click',ev=>{
        ev.stopPropagation();
        if(typeof openIconPicker==='function'){
          openIconPicker(val=>{const f=ov.querySelector('#gpcfg-icon');if(f)f.value=val;const b=ov.querySelector('#gpcfg-icon-btn');if(b)b.innerHTML=iconHtml(val,22);});
          const _ipm=document.getElementById('ntf-icon-modal'); if(_ipm) _ipm.style.zIndex='200000';
        }
      });
      if(ov._ovClick) ov.removeEventListener('click',ov._ovClick);
      ov._ovClick=ev=>{if(ev.target===ov)closeOv();};
      ov.addEventListener('click',ov._ovClick);
      ov.querySelector('#gpcfg-close').onclick=closeOv;
      ov.querySelector('#gpcfg-cancel').onclick=closeOv;

      ov.querySelectorAll('[data-del]').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const i=parseInt(btn.dataset.del); ents.splice(i,1); expandedFields.delete(i);
          const newExp=new Set(); expandedFields.forEach(idx=>{if(idx>i)newExp.add(idx-1);else if(idx<i)newExp.add(idx);}); expandedFields=newExp; attach();
        });
      });
      ov.querySelectorAll('[data-expand]').forEach(btn=>{
        btn.addEventListener('click',()=>{ const i=parseInt(btn.dataset.expand); if(expandedFields.has(i))expandedFields.delete(i);else expandedFields.add(i); attach(); });
      });
      ov.querySelectorAll('[data-rmpwr]').forEach(btn=>{ btn.addEventListener('click',()=>{ents[parseInt(btn.dataset.rmpwr)].power_entity='';attach();}); });
      ov.querySelectorAll('[data-rmenergy]').forEach(btn=>{ btn.addEventListener('click',()=>{ents[parseInt(btn.dataset.rmenergy)].energy_entity='';attach();}); });
      ov.querySelectorAll('[data-rmauto]').forEach(btn=>{ btn.addEventListener('click',()=>{ents[parseInt(btn.dataset.rmauto)].automation='';attach();}); });
      ov.querySelectorAll('[data-icon-pick]').forEach(btn=>{
        btn.addEventListener('click', ev=>{
          ev.stopPropagation();
          const i=parseInt(btn.dataset.iconPick);
          if(typeof openIconPicker==='function'){
            openIconPicker(val=>{
              ents[i].icon=val;
              const inp=ov.querySelector(`[data-icon-idx="${i}"]`);
              if(inp) inp.value=val;
              btn.innerHTML=iconHtml(val,20);
            });
            /* porta il modal icone sopra l'overlay configure */
            const _ipm=document.getElementById('ntf-icon-modal');
            if(_ipm) _ipm.style.zIndex='200000';
          }
        });
      });
      ov.querySelectorAll('[data-icon-idx]').forEach(inp=>{
        const i=parseInt(inp.dataset.iconIdx);
        inp.addEventListener('input',()=>{
          ents[i].icon=(inp.value||'').trim();
          const btn=ov.querySelector(`[data-icon-pick="${i}"]`);
          if(btn) btn.innerHTML=iconHtml(ents[i].icon||'🔌',20);
        });
      });
      ov.querySelectorAll('[data-pwr-idx]').forEach(inp=>{
        const i=parseInt(inp.dataset.pwrIdx);
        _setupAc(inp,_sensorMatches,(id)=>{ents[i].power_entity=id;inp.value=id;});
        inp.addEventListener('blur',()=>setTimeout(()=>{const v=(inp.value||'').trim();if(v)ents[i].power_entity=v;},200));
      });
      ov.querySelectorAll('[data-energy-idx]').forEach(inp=>{
        const i=parseInt(inp.dataset.energyIdx);
        _setupAc(inp,_sensorMatches,(id)=>{ents[i].energy_entity=id;inp.value=id;});
        inp.addEventListener('blur',()=>setTimeout(()=>{const v=(inp.value||'').trim();if(v)ents[i].energy_entity=v;},200));
      });
      ov.querySelectorAll('[data-auto-idx]').forEach(inp=>{
        const i=parseInt(inp.dataset.autoIdx);
        _setupAc(inp,_autoMatches,(id)=>{ents[i].automation=id;inp.value=id;});
        inp.addEventListener('blur',()=>setTimeout(()=>{const v=(inp.value||'').trim();if(v)ents[i].automation=v;},200));
      });
      const addInp=ov.querySelector('#gpcfg-add-entity');
      if(addInp) _setupAc(addInp,_switchMatches,(id,name)=>{ if(!ents.find(e=>e.entity===id)) ents.push({entity:id,label:name||'',power_entity:'',energy_entity:'',automation:''}); addInp.value=''; attach(); });

      ov.querySelector('#gpcfg-save').addEventListener('click',()=>{
        const maxKwRaw=parseFloat(ov.querySelector('#gpcfg-maxw')?.value||'0');
        const maxWVal = maxKwRaw>0 ? Math.round(maxKwRaw*1000) : MAX_W_DEFAULT;
        const newCfg={
          label:(ov.querySelector('#gpcfg-label')?.value||'Prese').trim(),
          icon: (ov.querySelector('#gpcfg-icon')?.value||'🔌').trim(),
          color: ov.querySelector('#gpcfg-color')?.value||'#fb923c',
          maxW: maxWVal,
          entities: ents.filter(e=>e.entity).map(e=>({
            entity:e.entity.trim(), label:e.label||'', icon:e.icon||'',
            power_entity:e.power_entity||'', energy_entity:e.energy_entity||'',
            automation:e.automation||''
          })),
        };
        closeOv(); if(typeof onSave==='function') onSave(newCfg);
      });
    }

    attach();
    document.body.appendChild(ov);
  }

  /* ── registrazione ── */
  const CARD = {
    id: ID, name: 'Gruppo Prese', icon: '🔌',
    desc: 'Chip prese on/off · popup con stato, consumo W real-time, flusso animato e indicatori unavailable.',
    version: '1.9', isDistintivo: true,
    defaultCfg: { label:'Prese', icon:'🔌', color:'#fb923c', maxW:2300, entities:[] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-prese v1.9'); } catch(e) {}
})();
