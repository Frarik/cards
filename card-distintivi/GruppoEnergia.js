/* frarik-version: 3.3 */
/**
 * GruppoEnergia.js — Distintivo FratechStore v3.0
 * Flow shimmer · tralicio img data-URI · nodi uguali · speed reattiva
 */
(function () {
  'use strict';

  const ID = 'gruppo-energia';

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
  function _fmtPower(w) {
    if (w === null || w === undefined) return '—';
    return Math.abs(w) >= 1000 ? (w / 1000).toFixed(2) + ' kW' : Math.round(w) + ' W';
  }
  function _pct(w, mx) { return (w === null || mx <= 0) ? 0 : Math.min(100, Math.round((w / mx) * 100)); }
  function _col(p) { return p >= 90 ? '#ef4444' : p >= 75 ? '#f97316' : p >= 50 ? '#facc15' : '#4ade80'; }
  function _emo(p) { return p >= 90 ? '🔴' : p >= 75 ? '🟠' : p >= 50 ? '🟡' : '🟢'; }

  function _info(cfg, h) {
    const c = loadCfg(cfg);
    if (!c.entity || !h) return { w: null, pct: 0, col: '#4ade80', label: '—', emo: '⚡', maxW: 3000 };
    const unit = attrOf(h, c.entity, 'unit_of_measurement') || 'W';
    const w    = _parseW(stateOf(h, c.entity), unit);
    const maxW = (parseFloat(c.maxKw) || 3) * 1000;
    const p    = _pct(w, maxW);
    return { w, pct: p, col: _col(p), label: _fmtPower(w), emo: _emo(p), maxW };
  }

  /* ── history via HA callApi ── */
  const _GE_HIST = {};
  const _GE_TTL  = 10 * 60 * 1000;

  async function _fetchHist(h, entityId, hours) {
    if (!h || !entityId) return [];
    const key = entityId + '_' + hours;
    const cached = _GE_HIST[key];
    if (cached && (Date.now() - cached.ts < _GE_TTL)) return cached.pts;

    const start = new Date(Date.now() - hours * 3600000).toISOString();
    let rawPts = [];

    // WebSocket history/history_during_period (canale già autenticato)
    if (typeof h.callWS === 'function') {
      try {
        const wsRes = await h.callWS({
          type: 'history/history_during_period',
          entity_ids: [entityId],
          start_time: start,
          minimal_response: true,
          no_attributes: true,
        });
        const wsData = wsRes?.[entityId] || [];
        if (wsData.length) {
          rawPts = wsData.map(s => ({
            t: s.lu != null ? Math.round(s.lu * 1000) : +new Date(s.last_updated || s.last_changed || 0),
            v: parseFloat(s.s != null ? s.s : (s.state || 'NaN')),
          }));
        }
      } catch (_) {}
    }

    // Fallback REST callApi
    if (!rawPts.length && typeof h.callApi === 'function') {
      try {
        const raw = await h.callApi('GET', `history/period/${start}?filter_entity_id=${entityId}&minimal_response=true&no_attributes=true`);
        if (Array.isArray(raw) && raw[0] && raw[0].length) {
          rawPts = raw[0].map(s => ({ t: +new Date(s.last_changed), v: parseFloat(s.state) }));
        }
      } catch (_) {}
    }

    if (!rawPts.length) return [];
    const pts = rawPts
      .filter(p => isFinite(p.t) && p.t > 0 && !isNaN(p.v) && p.v >= 0)
      .sort((a, b) => a.t - b.t); // garantisce ordine cronologico per integrale kWh
    if (!pts.length) return [];
    const DS = 200;
    const out = pts.length > DS ? pts.filter((_, i) => i % Math.ceil(pts.length / DS) === 0) : pts;
    _GE_HIST[key] = { ts: Date.now(), pts: out };
    return out;
  }

  function _stats(pts) {
    if (!pts.length) return { peak: null, avg: null, kwh: null };
    const peak = Math.max(...pts.map(p => p.v));
    const avg  = pts.reduce((s, p) => s + p.v, 0) / pts.length;
    let kwh = 0;
    for (let i = 1; i < pts.length; i++)
      kwh += ((pts[i].v + pts[i - 1].v) / 2 / 1000) * ((pts[i].t - pts[i - 1].t) / 3600000);
    return { peak, avg, kwh };
  }

  /* ── delta html (confronto vs ieri) ── */
  function _deltaHtml(today, yest) {
    if (today === null || yest === null || yest < 0.001)
      return '<span style="font-size:10px;color:#fff">— vs ieri</span>';
    const diff = today - yest;
    const pct  = Math.round(Math.abs(diff / yest) * 100);
    const up   = diff > 0;
    const col  = up ? '#ef4444' : '#4ade80';
    return `<span style="font-size:10px;color:${col}">${up ? '▲' : '▼'} ${up ? '+' : '-'}${pct}% vs ieri</span>`;
  }

  /* ── grafico SVG compatto ── */
  function _chart(pts, maxW, col) {
    const W = 300, H = 120;
    const noData = `<div style="height:${H}px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff">Nessun dato storico disponibile</div>`;
    if (!pts || pts.length < 2) return noData;
    try {
      const now   = Date.now();
      const start = now - 24 * 3600000;
      const maxV  = Math.max(...pts.map(p => p.v), maxW * 0.1);
      const xf = t => Math.max(0, Math.min(W, ((t - start) / (now - start)) * W));
      const yf = v => Math.max(2, Math.min(H - 2, H - (v / maxV) * (H - 6)));
      const line = pts.map(p => `${xf(p.t).toFixed(1)},${yf(p.v).toFixed(1)}`).join(' L ');
      const area = `M ${line} L ${xf(pts[pts.length - 1].t).toFixed(1)},${H} L ${xf(pts[0].t).toFixed(1)},${H} Z`;
      const thr  = [{ r: .50, c: '#4ade80' }, { r: .75, c: '#facc15' }, { r: .90, c: '#f97316' }]
        .filter(t => maxV > maxW * t.r)
        .map(t => { const y = yf(maxW * t.r).toFixed(1); return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${t.c}" stroke-width="1" stroke-dasharray="4,3" opacity=".4"/>`; })
        .join('');
      const pk  = pts.reduce((a, b) => b.v > a.v ? b : a);
      const gid = 'eg' + col.replace('#', '');
      const labels = [0, 3, 6, 9, 12, 15, 18, 21].map(hr => {
        const d = new Date(); d.setHours(hr, 0, 0, 0);
        const x = xf(+d); if (x < 12 || x > W - 12) return '';
        return `<text x="${x.toFixed(1)}" y="${H + 14}" text-anchor="middle" fill="#fff" font-size="9">${String(hr).padStart(2, '0')}:00</text>`;
      }).join('');
      return `<svg width="100%" height="${H + 22}" viewBox="0 0 ${W} ${H + 22}" style="display:block;overflow:visible">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${col}" stop-opacity=".45"/><stop offset="100%" stop-color="${col}" stop-opacity=".02"/>
        </linearGradient></defs>
        ${thr}
        <path d="${area}" fill="url(#${gid})"/>
        <path d="M ${line}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${xf(pk.t).toFixed(1)}" cy="${yf(pk.v).toFixed(1)}" r="4" fill="${col}" stroke="rgba(0,0,0,.4)" stroke-width="1.5"/>
        ${labels}
      </svg>`;
    } catch (e) { return noData; }
  }

  /* ── velocità shimmer — range ampio: consumo basso=lentissimo, alto=velocissimo ── */
  function _flowSpeed(pct) {
    if (pct >= 95) return 0.12;
    if (pct >= 85) return 0.20;
    if (pct >= 70) return 0.35;
    if (pct >= 55) return 0.55;
    if (pct >= 40) return 0.85;
    if (pct >= 25) return 1.30;
    if (pct >= 12) return 2.00;
    if (pct >= 4)  return 3.00;
    return 4.50;
  }

  /* ── tralicio come <img> data-URI base64 — isolato da CSS ereditato ── */
  function _pylonIcon(col) {
    const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" fill="none"><line x1="15" y1="2" x2="15" y2="34" stroke="${col}" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="6" x2="29" y2="6" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/><line x1="5" y1="15" x2="25" y2="15" stroke="${col}" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="6" x2="15" y2="15" stroke="${col}" stroke-width="1.5" stroke-linecap="round"/><line x1="29" y1="6" x2="15" y2="15" stroke="${col}" stroke-width="1.5" stroke-linecap="round"/><line x1="5" y1="15" x2="15" y2="24" stroke="${col}" stroke-width="1.5" stroke-linecap="round"/><line x1="25" y1="15" x2="15" y2="24" stroke="${col}" stroke-width="1.5" stroke-linecap="round"/><line x1="15" y1="34" x2="4" y2="40" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/><line x1="15" y1="34" x2="26" y2="40" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/><circle cx="1" cy="6" r="2.5" fill="${col}"/><circle cx="29" cy="6" r="2.5" fill="${col}"/><circle cx="5" cy="15" r="2" fill="${col}"/><circle cx="25" cy="15" r="2" fill="${col}"/></svg>`;
    return `<img src="data:image/svg+xml;base64,${btoa(s)}" width="30" height="40" style="display:block"/>`;
  }

  /* ── nodo flow — tutti stessa dimensione 56px ── */
  function _node(icoHtml, valHtml, sublabel, valCls, borderCol, isCenter, nodeClass) {
    const sz = 56, rr = 14;
    const glow = isCenter
      ? `;box-shadow:0 0 28px ${borderCol}55`
      : `;box-shadow:0 0 12px ${borderCol}25`;
    const nc = nodeClass ? ` ${nodeClass}` : '';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;min-width:76px">
      <div class="e-node-box${nc}" style="width:${sz}px;height:${sz}px;border-radius:${rr}px;background:rgba(255,255,255,.05);border:1.5px solid ${borderCol};display:flex;align-items:center;justify-content:center${glow}">
        ${icoHtml}
      </div>
      <div class="${valCls}" style="font-size:13px;font-weight:900;color:${borderCol};line-height:1;text-align:center">${valHtml}</div>
      <div style="font-size:9px;color:#fff;text-align:center;white-space:nowrap">${sublabel}</div>
    </div>`;
  }

  /* ── pipe shimmer continua e luminosa ── */
  function _pipe(col, dir, pct) {
    const spd  = _flowSpeed(pct);
    const anim = dir === 'right' ? 'geShimR' : 'geShimL';
    const deg  = dir === 'right' ? '90deg' : '270deg';
    const arrR = `<div style="width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:9px solid ${col};flex-shrink:0"></div>`;
    const arrL = `<div style="width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-right:9px solid ${col};flex-shrink:0"></div>`;
    return `<div style="display:flex;align-items:center;gap:3px;padding:0 4px;flex:1;margin-bottom:16px">
      ${dir === 'left' ? arrL : ''}
      <div class="e-pipe" data-dir="${dir}" style="position:relative;flex:1;height:4px;border-radius:2px;overflow:hidden;background:${col}30">
        <div class="e-pipe-shimmer" data-col="${col}" data-dir="${dir}" style="position:absolute;inset:0;background:linear-gradient(${deg},transparent 0%,${col}88 35%,#ffffffee 50%,${col}88 65%,transparent 100%);animation:${anim} ${spd}s linear infinite"></div>
      </div>
      ${dir === 'right' ? arrR : ''}
    </div>`;
  }

  /* ── stat box con sub-riga ── */
  function _box(ico, val, label, valCls, sub, subCls) {
    return `<div style="padding:12px 8px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);text-align:center">
      <div style="font-size:20px;margin-bottom:5px">${ico}</div>
      <div class="${valCls}" style="font-size:16px;font-weight:800;color:#fff;line-height:1.2">${val}</div>
      <div style="font-size:9.5px;color:#fff;margin-top:3px;text-transform:uppercase;letter-spacing:.5px">${label}</div>
      <div class="${subCls}" style="margin-top:5px;min-height:14px;line-height:1.2">${sub}</div>
    </div>`;
  }

  /* ════════════════════════════════════════ CHIP ══ */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg); const h = liveH(rawHass); const i = _info(cfg, h);
    return { label: c.label || 'Energia', value: `${i.emo} ${i.label}`, color: i.col };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    return [c.entity, c.solarEntity, c.kwhEntity].filter(Boolean);
  }

  /* ════════════════════════════════════════ RENDER ══ */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);

    if (!c.entity) {
      return `<div style="padding:40px 20px;text-align:center;color:#fff;font-size:12px;font-family:system-ui,sans-serif">
        Nessun sensore configurato.<br><span style="font-size:10px;">Clicca ✏️ sulla chip per configurare.</span>
      </div>`;
    }

    const info = _info(cfg, h);
    const { col, pct, label, maxW } = info;

    /* solare */
    let solarW = null, solarLabel = 'Solare';
    const hasSolar = !!(c.solarEntity && h);
    if (hasSolar) {
      const su = attrOf(h, c.solarEntity, 'unit_of_measurement') || 'W';
      solarW   = _parseW(stateOf(h, c.solarEntity), su);
      solarLabel = nameOf(h, c.solarEntity) || 'Solare';
    }
    const totalW = hasSolar && solarW !== null && info.w !== null ? (info.w || 0) + (solarW || 0) : info.w;

    /* alert */
    const alertKw  = parseFloat(c.alertKw) || 0;
    const isAlert  = alertKw > 0 && info.w !== null && info.w >= alertKw * 1000;
    const houseCol = isAlert ? '#ef4444' : col;
    const priceOk  = parseFloat(c.priceKwh) > 0;

    /* nodi */
    const gridCol  = '#60a5fa';
    const solarCol = '#facc15';
    const pylonHtml = _pylonIcon(isAlert ? '#ef4444' : gridCol);
    const houseHtml = `<span style="font-size:${hasSolar ? 26 : 28}px">🏠</span>`;
    const sunHtml   = `<span style="font-size:26px">☀️</span>`;

    let flowRow = '';
    if (hasSolar) {
      flowRow = `<div style="display:flex;align-items:center;justify-content:center">
        ${_node(pylonHtml, `<span class="e-grid-val">${eh(label)}</span>`, 'Rete', 'e-grid-wrap', isAlert ? '#ef4444' : gridCol, false)}
        ${_pipe(isAlert ? '#ef4444' : gridCol, 'right', pct)}
        ${_node(houseHtml, `<span class="e-val">${eh(_fmtPower(totalW))}</span>`, 'Casa', 'e-casa-wrap', houseCol, true, 'e-house-node')}
        ${_pipe(isAlert ? '#ef4444' : solarCol, 'left', pct)}
        ${_node(sunHtml, `<span class="e-solar-val">${_fmtPower(solarW)}</span>`, solarLabel, 'e-solar-wrap', solarCol, false)}
      </div>`;
    } else {
      flowRow = `<div style="display:flex;align-items:center;justify-content:center">
        ${_node(pylonHtml, `<span class="e-grid-val">${eh(label)}</span>`, 'Rete', 'e-grid-wrap', isAlert ? '#ef4444' : gridCol, false)}
        ${_pipe(isAlert ? '#ef4444' : col, 'right', pct)}
        ${_node(houseHtml, `<span class="e-val">${eh(label)}</span>`, 'Consumo', 'e-casa-wrap', houseCol, true, 'e-house-node')}
      </div>`;
    }

    const noSub = '<span style="font-size:9px;color:#fff">— vs ieri</span>';

    return `<div style="font-family:system-ui,sans-serif;padding:10px 14px 4px">
      <style>
        @keyframes geShimR{from{transform:translateX(-100%)}to{transform:translateX(200%)}}
        @keyframes geShimL{from{transform:translateX(200%)}to{transform:translateX(-100%)}}
        @keyframes gePulse{0%,100%{opacity:.55}50%{opacity:1}}
      </style>

      <!-- ALERT BANNER -->
      <div class="e-alert" style="display:${isAlert ? 'flex' : 'none'};align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);margin-bottom:10px;font-size:11px;font-weight:700;color:#ef4444">
        ⚠️ Soglia superata: <span class="e-alert-val">${eh(label)}</span> / ${eh(_fmtPower(alertKw * 1000))}
      </div>

      <!-- FLOW -->
      <div style="padding:8px 0 12px">${flowRow}</div>

      <!-- STATS: kWh · Costo · Picco -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:14px">
        ${_box('⚡', '—', 'kWh oggi', 'e-kwh', noSub, 'e-kwh-delta')}
        ${_box('💶', priceOk ? '—' : 'n/d', 'Costo oggi', 'e-cost', noSub, 'e-cost-delta')}
        ${_box('⬆️', '—', 'Picco oggi', 'e-peak', '<span style="font-size:9px;color:#fff">〰️ —</span>', 'e-avg-box')}
      </div>

      <!-- GRAFICO -->
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#fff;margin-bottom:8px">Ultime 24 ore</div>
      <div class="e-chart" style="padding-bottom:8px">
        <div style="height:142px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff">⏳ Caricamento…</div>
      </div>
    </div>`;
  }

  /* ── aggiornamento live chirurgico ── */
  function _live(cfg, rawH, el) {
    try {
      const h = H() || (rawH?.states ? rawH : null);
      if (!h) return;
      const info = _info(cfg, h);
      if (info.w === null) return;

      const c = loadCfg(cfg);
      const { col, pct, label } = info;
      const hasSolar = !!(c.solarEntity && h);
      let solarW = null;
      if (hasSolar) {
        const su = attrOf(h, c.solarEntity, 'unit_of_measurement') || 'W';
        solarW = _parseW(stateOf(h, c.solarEntity), su);
      }
      const totalW = hasSolar && solarW !== null ? (info.w || 0) + (solarW || 0) : info.w;

      /* valori nodi */
      const vEl = el.querySelector('.e-val');
      if (vEl) { vEl.textContent = hasSolar ? _fmtPower(totalW) : label; vEl.style.color = col; }
      const gEl = el.querySelector('.e-grid-val');
      if (gEl) gEl.textContent = label;
      const sEl = el.querySelector('.e-solar-val');
      if (sEl && solarW !== null) sEl.textContent = _fmtPower(solarW);

      /* alert */
      const alertKw = parseFloat(c.alertKw) || 0;
      const isAlert = alertKw > 0 && info.w >= alertKw * 1000;
      const houseCol = isAlert ? '#ef4444' : col;
      const gridCol  = isAlert ? '#ef4444' : '#60a5fa';

      /* banner */
      const alertEl = el.querySelector('.e-alert');
      if (alertEl) {
        alertEl.style.display = isAlert ? 'flex' : 'none';
        const av = alertEl.querySelector('.e-alert-val');
        if (av) av.textContent = label;
      }

      /* colore nodo casa */
      const cw = el.querySelector('.e-casa-wrap .e-val');
      if (cw) cw.style.color = houseCol;
      const hb = el.querySelector('.e-house-node');
      if (hb) {
        hb.style.borderColor  = houseCol;
        hb.style.boxShadow    = isAlert ? '0 0 20px #ef444455' : `0 0 24px ${col}40`;
        hb.style.animation    = isAlert ? 'gePulse .8s ease-in-out infinite' : '';
      }

      /* shimmer: aggiorna colore se alert cambia */
      el.querySelectorAll('.e-pipe-shimmer').forEach(s => {
        const dir = s.dataset.dir || 'right';
        const deg = dir === 'right' ? '90deg' : '270deg';
        const c2  = (dir === 'left' && hasSolar && !isAlert) ? '#facc15' : gridCol;
        s.style.background = `linear-gradient(${deg},transparent 0%,${c2}55 40%,#ffffff99 50%,${c2}55 60%,transparent 100%)`;
      });

      /* velocità shimmer */
      const newSpd = _flowSpeed(pct);
      if (Math.abs((el._eFlowSpd || 99) - newSpd) > 0.05) {
        el._eFlowSpd = newSpd;
        el.querySelectorAll('.e-pipe-shimmer').forEach(s => {
          s.style.animationDuration = newSpd + 's';
        });
      }

    } catch (e) {}
  }

  /* ── carica dati storici: grafico + stats oggi + ieri ── */
  async function _loadData(cfg, el) {
    const c = loadCfg(cfg);
    if (!c.entity) return;
    const h = H();
    if (!h) return;
    try {
      const pts48 = await _fetchHist(h, c.entity, 48);
      if (!el.isConnected) return;

      const now      = Date.now();
      const midT     = +(new Date().setHours(0, 0, 0, 0));
      const midY     = midT - 86400000;
      const pts24    = pts48.filter(p => p.t >= now - 86400000);
      const ptsToday = pts48.filter(p => p.t >= midT && p.t <= now);
      const ptsYest  = pts48.filter(p => p.t >= midY && p.t < midT);

      const stT = _stats(ptsToday);
      const stY = _stats(ptsYest);

      const maxW  = (parseFloat(c.maxKw) || 3) * 1000;
      const col   = _info(cfg, h).col;
      const price = parseFloat(c.priceKwh) || 0;

      /* grafico 24h */
      const chartEl = el.querySelector('.e-chart');
      if (chartEl) chartEl.innerHTML = _chart(pts24, maxW, col);

      /* kWh oggi (sensore diretto o stima) */
      let kwhT = null;
      if (c.kwhEntity) {
        const kv = parseFloat(stateOf(h, c.kwhEntity));
        kwhT = isNaN(kv) ? null : kv;
      } else {
        kwhT = stT.kwh;
      }
      const kwhY = stY.kwh;

      /* costo */
      const costT = kwhT !== null && price > 0 ? kwhT * price : null;
      const costY = kwhY !== null && price > 0 ? kwhY * price : null;

      /* aggiorna DOM */
      const kwhEl   = el.querySelector('.e-kwh');
      const kwhDEl  = el.querySelector('.e-kwh-delta');
      const costEl  = el.querySelector('.e-cost');
      const costDEl = el.querySelector('.e-cost-delta');
      const peakEl  = el.querySelector('.e-peak');
      const avgBox  = el.querySelector('.e-avg-box');

      if (kwhEl)  kwhEl.textContent  = kwhT !== null ? (c.kwhEntity ? kwhT.toFixed(2) : '~' + kwhT.toFixed(1)) + ' kWh' : '—';
      if (kwhDEl) kwhDEl.innerHTML   = _deltaHtml(kwhT, kwhY);
      if (costEl) costEl.textContent = costT !== null ? '€ ' + costT.toFixed(2) : (price > 0 ? '—' : 'n/d');
      if (costDEl) {
        if (price > 0) costDEl.innerHTML = _deltaHtml(costT, costY);
        else costDEl.innerHTML = '<span style="font-size:8px;color:#fff">Configura €/kWh</span>';
      }
      if (peakEl) peakEl.textContent = stT.peak !== null ? _fmtPower(stT.peak) : '—';
      if (avgBox) avgBox.innerHTML   = stT.avg  !== null
        ? `<span style="font-size:9px;color:#fff">〰️ ${_fmtPower(stT.avg)}</span>`
        : '<span style="font-size:9px;color:#fff">〰️ —</span>';

    } catch (e) {
      const chartEl = el.querySelector('.e-chart');
      if (chartEl) chartEl.innerHTML = `<div style="height:88px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff">Nessun dato storico</div>`;
    }
  }

  /* ════════════════════════════════════════ MOUNT / UPDATE ══ */
  function mount(cfg, rawHass, el) {
    if (el._eMounted) { _live(cfg, rawHass, el); return; }
    el._eMounted = true;
    el.innerHTML = render(cfg, rawHass);
    _loadData(cfg, el);
    if (el._ePoll) return;
    el._ePoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._ePoll); delete el._ePoll; return; }
      _live(cfg, null, el);
    }, 2000);
    el._eData = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._eData); delete el._eData; return; }
      _loadData(cfg, el);
    }, 300000);
  }

  function update(cfg, rawHass, el) {
    try { _live(cfg, rawHass, el); } catch (e) {}
  }

  /* ════════════════════════════════════════ CONFIGURE ══ */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const h = H();

    let _ac = null;
    function _closeAc() { try { _ac?.remove(); } catch (e) {} _ac = null; }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 180;
      const above = (window.innerHeight - rect.bottom - 6 < MAXH) && (rect.top > MAXH);
      _ac = document.createElement('div');
      const pos = above ? `bottom:${window.innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`;
      _ac.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(74,222,128,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
      matches.slice(0, 12).forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05)';
        r.innerHTML = `<div style="font-size:11px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${eh(m.name)}</div><div style="font-size:9px;color:#fff">${eh(m.id)}</div>`;
        r.addEventListener('mouseover', () => r.style.background = 'rgba(74,222,128,.08)');
        r.addEventListener('mouseout',  () => r.style.background = '');
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id); _closeAc(); });
        _ac.appendChild(r);
      });
      document.body.appendChild(_ac);
      inp.focus();
    }

    function _setupAc(inp, onPick) {
      function match(q) {
        if (!h?.states) return [];
        return Object.keys(h.states)
          .filter(id => id.startsWith('sensor.') && (id.toLowerCase().includes(q) || nameOf(h, id).toLowerCase().includes(q)))
          .map(id => ({ id, name: nameOf(h, id) }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      inp.addEventListener('input', () => { const q = inp.value.toLowerCase().trim(); q ? _openAc(inp, match(q), onPick) : _closeAc(); });
      inp.addEventListener('focus', () => { const q = inp.value.toLowerCase().trim(); if (q) _openAc(inp, match(q), onPick); });
      inp.addEventListener('blur',  () => setTimeout(_closeAc, 160));
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch (e) {} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key === 'Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    const sinp = 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px;outline:none;font-family:inherit';
    const secL = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px';

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

        <div style="${secL}">Sensore consumo / importazione rete (W o kW)</div>
        <input id="ecfg-entity" style="${sinp};margin-bottom:14px" value="${eh(c.entity || '')}" placeholder="🔍 sensor.consumo_potenza…" autocomplete="off">

        <div style="${secL}">Potenza massima contratto (kW)</div>
        <input id="ecfg-maxkw" type="number" step="0.5" min="0.5" max="200" style="${sinp};margin-bottom:14px" value="${eh(String(c.maxKw || '3'))}" placeholder="es. 4.5">

        <div style="${secL}">Prezzo energia (€/kWh)</div>
        <input id="ecfg-price" type="number" step="0.001" min="0" max="5" style="${sinp};margin-bottom:4px" value="${eh(String(c.priceKwh || ''))}" placeholder="es. 0.254">
        <div style="font-size:9px;color:#fff;margin-bottom:14px">Necessario per calcolare il costo giornaliero in €</div>

        <div style="${secL}">Soglia alert (kW) — 0 = disabilitata</div>
        <input id="ecfg-alert" type="number" step="0.1" min="0" max="200" style="${sinp};margin-bottom:4px" value="${eh(String(c.alertKw || '0'))}" placeholder="es. 3.0">
        <div style="font-size:9px;color:#fff;margin-bottom:14px">Quando il consumo supera questa soglia il flow diventa rosso e appare un banner</div>

        <div style="${secL}">Produzione solare (opzionale)</div>
        <input id="ecfg-solar" style="${sinp};margin-bottom:14px" value="${eh(c.solarEntity || '')}" placeholder="🔍 sensor.fotovoltaico…" autocomplete="off">

        <div style="${secL}">Sensore kWh oggi diretto (opzionale)</div>
        <input id="ecfg-kwh" style="${sinp};margin-bottom:4px" value="${eh(c.kwhEntity || '')}" placeholder="🔍 sensor.energia_oggi…" autocomplete="off">
        <div style="font-size:9px;color:#fff;margin-bottom:14px">Se configurato usa il dato reale del contatore; altrimenti stima (~) dall'integrazione della potenza</div>

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
    _setupAc(ov.querySelector('#ecfg-entity'), id => { ov.querySelector('#ecfg-entity').value = id; });
    _setupAc(ov.querySelector('#ecfg-solar'),  id => { ov.querySelector('#ecfg-solar').value  = id; });
    _setupAc(ov.querySelector('#ecfg-kwh'),    id => { ov.querySelector('#ecfg-kwh').value    = id; });

    ov.querySelector('#ecfg-save').addEventListener('click', () => {
      const newCfg = {
        label:       (ov.querySelector('#ecfg-label')?.value  || 'Energia').trim(),
        entity:      (ov.querySelector('#ecfg-entity')?.value || '').trim(),
        maxKw:       parseFloat(ov.querySelector('#ecfg-maxkw')?.value)  || 3,
        priceKwh:    parseFloat(ov.querySelector('#ecfg-price')?.value)  || 0,
        alertKw:     parseFloat(ov.querySelector('#ecfg-alert')?.value)  || 0,
        solarEntity: (ov.querySelector('#ecfg-solar')?.value  || '').trim(),
        kwhEntity:   (ov.querySelector('#ecfg-kwh')?.value    || '').trim(),
      };
      closeOv();
      if (typeof onSave === 'function') onSave(newCfg);
    });
    document.body.appendChild(ov);
  }

  /* ════════════════════════════════════════ PREVIEW STORE ══ */
  function preview() {
    const _orig = window.frarikHass;
    window.frarikHass = null;
    try {
      const mockH = {
        states: {
          'sensor.prev_grid': { state: '1840', attributes: { friendly_name: 'Rete', unit_of_measurement: 'W' } },
          'sensor.prev_solar': { state: '620', attributes: { friendly_name: 'Fotovoltaico', unit_of_measurement: 'W' } },
        },
      };
      const mockCfg = {
        label: 'Energia', entity: 'sensor.prev_grid',
        maxKw: 3, priceKwh: 0.25, alertKw: 0,
        solarEntity: 'sensor.prev_solar', kwhEntity: '',
      };
      return render(mockCfg, mockH);
    } finally {
      window.frarikHass = _orig;
    }
  }

  /* ════════════════════════════════════════ REGISTRAZIONE ══ */
  const CARD = {
    id: ID, name: 'Gruppo Energia', icon: '⚡', desc: '',
    version: '3.3', isDistintivo: true,
    defaultCfg: { label: 'Energia', entity: '', maxKw: 3, priceKwh: 0, alertKw: 0, solarEntity: '', kwhEntity: '' },
    chip, watchEntities, render, mount, update, configure, preview,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-energia v3.3'); } catch (e) {}
})();
