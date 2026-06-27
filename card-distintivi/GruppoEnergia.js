/* frarik-version: 2.0 */
/**
 * GruppoEnergia.js — Distintivo FratechStore v2.0
 * Arco SVG animato · Grafico 24h · Statistiche · Solare
 */
(function () {
  'use strict';

  const ID = 'gruppo-energia';
  const ARC_R = 52, ARC_CX = 64, ARC_CY = 64;
  const ARC_C = +(2 * Math.PI * ARC_R).toFixed(4); // 326.726

  (function injectBadgeStyle() {
    if (document.getElementById('cc-badge-border-fix')) return;
    const s = document.createElement('style');
    s.id = 'cc-badge-border-fix';
    s.textContent = '.hbadge{background:transparent!important;border-color:var(--bc,rgba(255,255,255,.35))!important;border-width:1.5px!important}';
    (document.head || document.documentElement).appendChild(s);
  })();

  /* ── helpers ── */
  function H() {
    try { const h = window.frarikHass?.(); if (h?.states) return h; } catch (e) {}
    return null;
  }
  function loadCfg(c) { return c && typeof c === 'object' ? c : {}; }
  function stateOf(h, id) { return h?.states?.[id]?.state || 'unknown'; }
  function attrOf(h, id, a) { return h?.states?.[id]?.attributes?.[a]; }
  function nameOf(h, id) {
    const s = h?.states?.[id];
    return s?.attributes?.friendly_name || (id?.includes('.') ? id.split('.')[1].replace(/_/g, ' ') : (id || ''));
  }
  function liveH(raw) { return H() || (raw?.states ? raw : null); }
  function eh(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function _parseW(val, unit) {
    const n = parseFloat(val);
    if (isNaN(n)) return null;
    return (unit || '').toLowerCase() === 'kw' ? n * 1000 : n;
  }
  function _fmtPower(watts, force2dec) {
    if (watts === null || watts === undefined) return '—';
    if (Math.abs(watts) >= 1000) return (watts / 1000).toFixed(force2dec ? 2 : 2) + ' kW';
    return Math.round(watts) + ' W';
  }
  function _pct(w, maxW) { return (w === null || maxW <= 0) ? 0 : Math.min(100, Math.round((w / maxW) * 100)); }
  function _color(p) { return p >= 90 ? '#ef4444' : p >= 75 ? '#f97316' : p >= 50 ? '#facc15' : '#4ade80'; }
  function _emo(p)   { return p >= 90 ? '🔴' : p >= 75 ? '🟠' : p >= 50 ? '🟡' : '🟢'; }

  function _info(cfg, h) {
    const c = loadCfg(cfg);
    if (!c.entity || !h) return { watts: null, pct: 0, col: '#4ade80', label: '—', emo: '⚡' };
    const unit  = attrOf(h, c.entity, 'unit_of_measurement') || 'W';
    const watts = _parseW(stateOf(h, c.entity), unit);
    const maxW  = (parseFloat(c.maxKw) || 3) * 1000;
    const p     = _pct(watts, maxW);
    return { watts, pct: p, col: _color(p), label: _fmtPower(watts), emo: _emo(p), maxW };
  }

  /* ── history ── */
  async function _fetchHist(entityId, hours) {
    try {
      if (typeof window.fetchHistory === 'function') {
        const pts = await window.fetchHistory(entityId, hours);
        if (Array.isArray(pts) && pts.length) return pts.map(p => ({ t: +p.t, v: +p.v })).filter(p => !isNaN(p.v));
      }
    } catch (e) {}
    return [];
  }

  function _calcStats(pts) {
    if (!pts.length) return { peak: null, avg: null, kwh: null };
    const peak = Math.max(...pts.map(p => p.v));
    const avg  = pts.reduce((s, p) => s + p.v, 0) / pts.length;
    let kwh = 0;
    for (let i = 1; i < pts.length; i++) {
      kwh += ((pts[i].v + pts[i - 1].v) / 2 / 1000) * ((pts[i].t - pts[i - 1].t) / 3600000);
    }
    return { peak, avg, kwh };
  }

  /* ── SVG area chart ── */
  function _svgChart(pts, maxW, col) {
    const W = 300, H = 72;
    if (!pts || pts.length < 2) return `<div style="height:${H}px;display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.2)">Dati non disponibili</div>`;

    const now   = Date.now();
    const start = now - 24 * 3600000;
    const maxV  = Math.max(...pts.map(p => p.v), maxW * 0.15);

    const xf = t  => Math.max(0, Math.min(W, ((t  - start) / (now - start)) * W));
    const yf = v  => Math.max(1, Math.min(H - 1, H - (v / maxV) * (H - 4)));

    const linePts  = pts.map(p => `${xf(p.t).toFixed(1)},${yf(p.v).toFixed(1)}`).join(' L ');
    const areaPath = `M ${linePts} L ${xf(pts[pts.length - 1].t).toFixed(1)},${H} L ${xf(pts[0].t).toFixed(1)},${H} Z`;

    /* soglie colorate */
    const threshLines = [
      { r: 0.50, c: '#4ade80' },
      { r: 0.75, c: '#facc15' },
      { r: 0.90, c: '#f97316' },
    ].filter(t => maxV > maxW * t.r).map(t => {
      const y = yf(maxW * t.r);
      return `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}" stroke="${t.c}" stroke-width=".7" stroke-dasharray="4,3" opacity=".45"/>`;
    }).join('');

    /* etichette orario */
    const hourLabels = [0, 6, 12, 18].map(h => {
      const t = new Date(); t.setHours(h, 0, 0, 0);
      const x = xf(+t);
      if (x < 10 || x > W - 10) return '';
      return `<text x="${x.toFixed(1)}" y="${H + 11}" text-anchor="middle" fill="rgba(255,255,255,.25)" font-size="8">${String(h).padStart(2,'0')}:00</text>`;
    }).join('');

    /* marker picco */
    const peakPt = pts.reduce((a, b) => b.v > a.v ? b : a);
    const px = xf(peakPt.t), py = yf(peakPt.v);
    const peakMark = `
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="${col}" opacity=".9"/>
      <text x="${(px + 5).toFixed(1)}" y="${(py - 4).toFixed(1)}" fill="${col}" font-size="7.5" font-weight="700">${_fmtPower(peakPt.v)}</text>`;

    /* linea "ora" */
    const nowLine = `<line x1="${W}" y1="0" x2="${W}" y2="${H}" stroke="rgba(255,255,255,.2)" stroke-width=".8" stroke-dasharray="3,2"/>`;

    return `<svg width="100%" viewBox="0 0 ${W} ${H + 16}" style="overflow:visible;display:block" preserveAspectRatio="none">
      <defs>
        <linearGradient id="eGrad${col.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${col}" stop-opacity=".4"/>
          <stop offset="100%" stop-color="${col}" stop-opacity=".02"/>
        </linearGradient>
      </defs>
      ${threshLines}
      ${nowLine}
      <path d="${areaPath}" fill="url(#eGrad${col.replace('#','')})"/>
      <path d="M ${linePts}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
      ${peakMark}
      ${hourLabels}
    </svg>`;
  }

  /* ── arc SVG ── */
  function _arcSvg(pct, col, animate) {
    const offset     = +(ARC_C * (1 - pct / 100)).toFixed(2);
    const offsetFull = ARC_C;
    const pulse      = pct >= 90 ? `style="animation:ePulse 1.4s ease-in-out infinite"` : '';
    const animEl     = animate
      ? `<animate attributeName="stroke-dashoffset" from="${offsetFull}" to="${offset}" dur=".85s" fill="freeze" calcMode="spline" keySplines=".4 0 .2 1" keyTimes="0;1"/>`
      : '';
    /* glow filter only when critical */
    const filtDef = pct >= 90
      ? `<filter id="eGlw"><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
      : '';
    const filtAttr = pct >= 90 ? `filter="url(#eGlw)"` : '';

    return `<svg width="128" height="128" viewBox="0 0 128 128" style="overflow:visible;flex-shrink:0">
      <defs>${filtDef}</defs>
      <style>@keyframes ePulse{0%,100%{opacity:.75}50%{opacity:1}}</style>
      <!-- traccia sfondo -->
      <circle cx="${ARC_CX}" cy="${ARC_CY}" r="${ARC_R}" fill="none"
        stroke="rgba(255,255,255,.07)" stroke-width="12" stroke-linecap="round"
        transform="rotate(-90 ${ARC_CX} ${ARC_CY})"
        stroke-dasharray="${ARC_C}" stroke-dashoffset="0"/>
      <!-- gradiente zona sfondo -->
      <circle cx="${ARC_CX}" cy="${ARC_CY}" r="${ARC_R}" fill="none"
        stroke="url(#arcBg)" stroke-width="12" stroke-linecap="round"
        transform="rotate(-90 ${ARC_CX} ${ARC_CY})"
        stroke-dasharray="${ARC_C}" stroke-dashoffset="0" opacity=".18"/>
      <!-- fill attivo -->
      <circle class="e-arc-fill" cx="${ARC_CX}" cy="${ARC_CY}" r="${ARC_R}" fill="none"
        stroke="${col}" stroke-width="12" stroke-linecap="round"
        transform="rotate(-90 ${ARC_CX} ${ARC_CY})"
        stroke-dasharray="${ARC_C}" stroke-dashoffset="${animate ? offsetFull : offset}"
        ${filtAttr} ${pulse}>${animEl}</circle>
      <!-- sfumatura interna -->
      <defs>
        <radialGradient id="arcBg">
          <stop offset="0%" stop-color="#4ade80"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="75%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#ef4444"/>
        </radialGradient>
      </defs>
    </svg>`;
  }

  /* ════════════════════════════════════════ CHIP ══ */
  function chip(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);
    const info = _info(cfg, h);
    return { label: c.label || 'Energia', value: `${info.emo} ${info.label}`, color: info.col };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    return [c.entity, c.solarEntity].filter(Boolean);
  }

  /* ════════════════════════════════════════ RENDER SHELL ══ */
  function render(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);

    if (!c.entity) {
      return `<div style="padding:36px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px;font-family:system-ui,sans-serif">
        Nessun sensore configurato.<br><span style="font-size:10px;opacity:.6">Clicca ✏️ sulla chip per configurare.</span>
      </div>`;
    }

    const info = _info(cfg, h);
    const { col, pct, watts, maxW } = info;
    const maxKwLbl = _fmtPower(maxW);

    /* solare */
    let solarRow = '';
    if (c.solarEntity && h) {
      const sUnit = attrOf(h, c.solarEntity, 'unit_of_measurement') || 'W';
      const sW    = _parseW(stateOf(h, c.solarEntity), sUnit);
      solarRow = `<div style="display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;background:rgba(250,204,21,.07);border:1px solid rgba(250,204,21,.2);margin-bottom:10px">
        <span style="font-size:16px">☀️</span>
        <span style="flex:1;font-size:11px;font-weight:600;color:rgba(255,255,255,.65)">${eh(c.solarLabel || nameOf(h, c.solarEntity))}</span>
        <span class="e-solar-val" style="font-size:14px;font-weight:800;color:#facc15">${eh(_fmtPower(sW))}</span>
      </div>`;
    }

    return `<div style="font-family:system-ui,sans-serif;padding:10px 12px 0">

      <!-- arco + valore centrale -->
      <div style="display:flex;align-items:center;gap:14px;padding:4px 0 14px">
        <div style="position:relative;flex-shrink:0">
          ${_arcSvg(pct, col, true)}
          <!-- valore sovrapposto all'arco -->
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none">
            <div class="e-val" style="font-size:17px;font-weight:900;color:${col};line-height:1;letter-spacing:-.5px">${eh(info.label)}</div>
            <div class="e-pct" style="font-size:10px;color:rgba(255,255,255,.38);margin-top:3px">${pct}%</div>
          </div>
        </div>

        <!-- colonna destra: label + barra 4 zone + contratto -->
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.5);margin-bottom:8px">CONSUMO ISTANTANEO</div>
          <!-- barra 4 zone -->
          <div style="position:relative;height:10px;border-radius:5px;overflow:hidden;background:rgba(255,255,255,.06);margin-bottom:5px">
            <div style="position:absolute;inset:0;background:linear-gradient(to right,#4ade80 0%,#4ade80 50%,#facc15 50%,#facc15 75%,#f97316 75%,#f97316 90%,#ef4444 90%,#ef4444 100%);opacity:.18"></div>
            <div class="e-bar" style="position:absolute;top:0;left:0;height:100%;width:${pct}%;background:${col};border-radius:5px;transition:width .5s ease,background .3s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:8px;color:rgba(255,255,255,.22);margin-bottom:10px">
            <span>0</span><span style="color:#4ade80">50%</span><span style="color:#facc15">75%</span><span style="color:#f97316">90%</span><span style="color:#ef4444">100%</span>
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,.3)">Contratto: <b style="color:rgba(255,255,255,.55)">${eh(maxKwLbl)}</b></div>
        </div>
      </div>

      ${solarRow}

      <!-- stats row (placeholders, aggiornati dopo fetch history) -->
      <div class="e-stats" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">
        ${_statBox('Picco oggi','—','⬆️','e-peak')}
        ${_statBox('Media 24h','—','〰️','e-avg')}
        ${_statBox('kWh oggi','—','⚡','e-kwh')}
      </div>

      <!-- grafico 24h -->
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:rgba(255,255,255,.3);margin-bottom:6px">Ultime 24 ore</div>
      <div class="e-chart" style="padding-bottom:12px">
        <div style="height:72px;display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.2)">⏳ Caricamento grafico…</div>
      </div>

    </div>`;
  }

  function _statBox(lbl, val, ico, cls) {
    return `<div style="padding:8px 8px 7px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);text-align:center">
      <div style="font-size:14px;margin-bottom:3px">${ico}</div>
      <div class="${cls}" style="font-size:12px;font-weight:800;color:#fff;line-height:1">${val}</div>
      <div style="font-size:8px;color:rgba(255,255,255,.3);margin-top:3px">${lbl}</div>
    </div>`;
  }

  /* ── aggiornamento live chirurgico (non tocca il grafico) ── */
  function _updateLive(cfg, h, el) {
    try {
      const info = _info(cfg, h);
      const { col, pct, watts } = info;

      const valEl = el.querySelector('.e-val');
      if (valEl) { valEl.textContent = info.label; valEl.style.color = col; }

      const pctEl = el.querySelector('.e-pct');
      if (pctEl) pctEl.textContent = pct + '%';

      const barEl = el.querySelector('.e-bar');
      if (barEl) { barEl.style.width = pct + '%'; barEl.style.background = col; }

      const arcEl = el.querySelector('.e-arc-fill');
      if (arcEl) {
        arcEl.style.strokeDashoffset = (ARC_C * (1 - pct / 100)).toFixed(2);
        arcEl.style.stroke = col;
        arcEl.style.transition = 'stroke-dashoffset .5s ease, stroke .3s';
      }

      /* solare live */
      if (cfg.solarEntity && h) {
        const sUnit = attrOf(h, cfg.solarEntity, 'unit_of_measurement') || 'W';
        const sW    = _parseW(stateOf(h, cfg.solarEntity), sUnit);
        const sEl   = el.querySelector('.e-solar-val');
        if (sEl) sEl.textContent = _fmtPower(sW);
      }
    } catch (e) {}
  }

  /* ── fetch history e aggiornamento grafico/stats ── */
  async function _loadChart(cfg, el) {
    const c = loadCfg(cfg);
    if (!c.entity || !el.isConnected) return;
    try {
      const pts   = await _fetchHist(c.entity, 24);
      if (!el.isConnected) return;
      const maxW  = (parseFloat(c.maxKw) || 3) * 1000;
      const h     = H();
      const info  = _info(cfg, h);

      /* grafico */
      const chartEl = el.querySelector('.e-chart');
      if (chartEl) chartEl.innerHTML = _svgChart(pts, maxW, info.col);

      /* stats */
      const { peak, avg, kwh } = _calcStats(pts);
      const peakEl = el.querySelector('.e-peak'); if (peakEl) peakEl.textContent = peak !== null ? _fmtPower(peak) : '—';
      const avgEl  = el.querySelector('.e-avg');  if (avgEl)  avgEl.textContent  = avg  !== null ? _fmtPower(avg)  : '—';
      const kwhEl  = el.querySelector('.e-kwh');  if (kwhEl)  kwhEl.textContent  = kwh  !== null ? kwh.toFixed(1) + ' kWh' : '—';
    } catch (e) {}
  }

  /* ════════════════════════════════════════ MOUNT / UPDATE ══ */
  function mount(cfg, rawHass, el) {
    el.innerHTML = render(cfg, rawHass);
    _loadChart(cfg, el);

    if (el._ePoll) return;
    el._ePoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._ePoll); delete el._ePoll; return; }
      const h = H(); if (h) _updateLive(cfg, h, el);
    }, 2000);

    /* ricarica grafico ogni 5 min */
    el._eChartPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._eChartPoll); delete el._eChartPoll; return; }
      _loadChart(cfg, el);
    }, 300000);
  }

  function update(cfg, rawHass, el) {
    try { _updateLive(cfg, rawHass, el); } catch (e) {}
  }

  /* ════════════════════════════════════════ CONFIGURE ══ */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const h = H();

    let _acDrop = null;
    function _closeAc() { try { _acDrop?.remove(); } catch (e) {} _acDrop = null; }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 180;
      const useAbove = (window.innerHeight - rect.bottom - 6 < MAXH) && (rect.top > MAXH);
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(74,222,128,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
      matches.slice(0, 12).forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05)';
        r.innerHTML = `<div style="font-size:11px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${eh(m.name)}</div><div style="font-size:9px;color:rgba(255,255,255,.38)">${eh(m.id)}</div>`;
        r.addEventListener('mouseover', () => r.style.background = 'rgba(74,222,128,.08)');
        r.addEventListener('mouseout',  () => r.style.background = '');
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
      inp.focus();
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.addEventListener('input', () => { const q = inp.value.toLowerCase().trim(); q ? _openAc(inp, filterFn(q), onPick) : _closeAc(); });
      inp.addEventListener('focus', () => { const q = inp.value.toLowerCase().trim(); if (q) _openAc(inp, filterFn(q), onPick); });
      inp.addEventListener('blur',  () => setTimeout(_closeAc, 160));
    }

    function _sensorMatches(q) {
      if (!h?.states) return [];
      return Object.keys(h.states)
        .filter(id => id.startsWith('sensor.') && (id.toLowerCase().includes(q) || nameOf(h,id).toLowerCase().includes(q)))
        .map(id => ({ id, name: nameOf(h, id) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch (e) {} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key === 'Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    const sinp = 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px;outline:none;font-family:inherit';
    const secL = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px';

    ov.innerHTML = `<div style="width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(74,222,128,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;animation:ecfgUp .22s cubic-bezier(.32,1.12,.56,1)">
      <style>@keyframes ecfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} #ecfg-body::-webkit-scrollbar{display:none}</style>

      <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(74,222,128,.13);border:1px solid rgba(74,222,128,.28);display:flex;align-items:center;justify-content:center;font-size:18px">⚡</div>
        <div style="flex:1"><div style="font-size:14px;font-weight:800">Configura — Gruppo Energia</div></div>
        <button id="ecfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
      </div>

      <div id="ecfg-body" style="flex:1;overflow-y:auto;scrollbar-width:none;padding:14px 14px 4px">
        <div style="${secL}">Nome chip</div>
        <input id="ecfg-label" style="${sinp};margin-bottom:14px" value="${eh(c.label || 'Energia')}" placeholder="Nome chip">

        <div style="${secL}">Sensore consumo istantaneo</div>
        <input id="ecfg-entity" style="${sinp};margin-bottom:4px" value="${eh(c.entity || '')}" placeholder="🔍 sensor.consumo_potenza…" autocomplete="off">
        <div style="font-size:9px;color:rgba(255,255,255,.28);margin-bottom:14px">Supporta W e kW — unità letta automaticamente dall'entità</div>

        <div style="${secL}">Potenza massima contratto (kW)</div>
        <input id="ecfg-maxkw" type="number" step="0.5" min="0.5" max="200" style="${sinp};margin-bottom:4px" value="${eh(String(c.maxKw || '3'))}" placeholder="es. 4.5">
        <div style="font-size:9px;color:rgba(255,255,255,.28);margin-bottom:14px">Verde &lt;50% · Giallo 50-75% · Arancio 75-90% · Rosso ≥90%</div>

        <div style="${secL}">Produzione solare (opzionale)</div>
        <input id="ecfg-solar" style="${sinp};margin-bottom:4px" value="${eh(c.solarEntity || '')}" placeholder="🔍 sensor.fotovoltaico_potenza…" autocomplete="off">
        <div style="font-size:9px;color:rgba(255,255,255,.28);margin-bottom:14px">Se impostato appare nel popup sopra il grafico</div>

        <div style="height:10px"></div>
      </div>

      <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
        <button id="ecfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#4ade80;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
        <button id="ecfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
      </div>
    </div>`;

    ov.querySelector('#ecfg-close').onclick  = closeOv;
    ov.querySelector('#ecfg-cancel').onclick = closeOv;
    ov.onclick = ev => { if (ev.target === ov) closeOv(); };

    _setupAc(ov.querySelector('#ecfg-entity'), _sensorMatches, id => { ov.querySelector('#ecfg-entity').value = id; });
    _setupAc(ov.querySelector('#ecfg-solar'),  _sensorMatches, id => { ov.querySelector('#ecfg-solar').value  = id; });

    ov.querySelector('#ecfg-save').addEventListener('click', () => {
      const newCfg = {
        label:       (ov.querySelector('#ecfg-label')?.value  || 'Energia').trim(),
        entity:      (ov.querySelector('#ecfg-entity')?.value || '').trim(),
        maxKw:       parseFloat(ov.querySelector('#ecfg-maxkw')?.value) || 3,
        solarEntity: (ov.querySelector('#ecfg-solar')?.value  || '').trim(),
      };
      closeOv();
      if (typeof onSave === 'function') onSave(newCfg);
    });

    document.body.appendChild(ov);
  }

  /* ════════════════════════════════════════ REGISTRAZIONE ══ */
  const CARD = {
    id: ID, name: 'Gruppo Energia', icon: '⚡',
    desc: '',
    version: '2.0', isDistintivo: true,
    defaultCfg: { label: 'Energia', entity: '', maxKw: 3, solarEntity: '' },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-energia v2.0'); } catch (e) {}
})();
