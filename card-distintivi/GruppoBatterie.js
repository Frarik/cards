/* frarik-version: 1.1 */
/**
 * GruppoBatterie.js — Distintivo FratechStore v1.1
 * Rileva automaticamente TUTTE le entità con device_class: battery
 * Critica <threshold_critical% · Bassa <threshold_low% · OK
 */
(function () {
  'use strict';

  const ID = 'gruppo-batterie';

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
  function stateOf(h, id) { return h?.states?.[id]?.state ?? 'unknown'; }
  function attrOf(h, id, a) { return h?.states?.[id]?.attributes?.[a]; }
  function nameOf(h, id) {
    const s = h?.states?.[id];
    return s?.attributes?.friendly_name || (id?.includes('.') ? id.split('.')[1].replace(/_/g, ' ') : (id || ''));
  }
  function liveH(raw) { return H() || (raw?.states ? raw : null); }
  function eh(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ── auto-detect entities with device_class: battery ── */
  function _getBatteryEntities(h) {
    if (!h?.states) return [];
    return Object.keys(h.states)
      .filter(id => attrOf(h, id, 'device_class') === 'battery')
      .sort((a, b) => nameOf(h, a).localeCompare(nameOf(h, b)));
  }

  /* ── classify a single entity ── */
  function _classifyEntity(h, id, thrL, thrC) {
    if (!h?.states?.[id]) return { status: 'offline', level: null };

    const st = stateOf(h, id);
    if (['unavailable', 'unknown', 'none', '-', ''].includes(st.toLowerCase())) {
      return { status: 'offline', level: null };
    }

    /* binary_sensor device_class battery: on = low, off = ok */
    if (id.startsWith('binary_sensor.')) {
      if (st === 'on') return { status: 'low', level: null };
      return { status: 'ok', level: null };
    }

    /* numeric sensor */
    const n = parseFloat(st);
    if (!isNaN(n)) {
      if (n < thrC) return { status: 'critical', level: n };
      if (n < thrL) return { status: 'low',      level: n };
      return { status: 'ok', level: n };
    }

    return { status: 'offline', level: null };
  }

  const RANK        = { offline: 3, critical: 2, low: 1, ok: 0 };
  const STATUS_LABEL = { offline: 'Offline', critical: 'Critica', low: 'Bassa', ok: 'OK' };
  const STATUS_COL  = { offline: '#ef4444', critical: '#f97316', low: '#facc15', ok: '#4ade80' };
  const STATUS_EMO  = { offline: '📴', critical: '🔴', low: '🟡', ok: '🟢' };

  function _analyze(cfg, h) {
    const c    = loadCfg(cfg);
    const thrL = parseFloat(c.threshLow)  || 20;
    const thrC = parseFloat(c.threshCrit) || 10;
    const ids  = _getBatteryEntities(h);

    const items = ids.map(id => {
      const cl = _classifyEntity(h, id, thrL, thrC);
      return { id, name: nameOf(h, id), ...cl };
    }).sort((a, b) => RANK[b.status] - RANK[a.status] || a.name.localeCompare(b.name));

    const offline  = items.filter(i => i.status === 'offline').length;
    const critical = items.filter(i => i.status === 'critical').length;
    const low      = items.filter(i => i.status === 'low').length;

    let worstStatus = 'ok';
    if (offline + critical > 0) worstStatus = offline > 0 ? 'offline' : 'critical';
    else if (low > 0)           worstStatus = 'low';

    return { items, offline, critical, low, worstStatus, thrL, thrC, total: ids.length };
  }

  /* ════════════════════════════════════════ CHIP ══ */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);

    if (!h) return { label: c.label || 'Batterie', value: '🔋 —', color: '#4ade80' };

    const { offline, critical, low, worstStatus } = _analyze(cfg, h);

    let value;
    if (worstStatus === 'ok') {
      value = '🔋 OK';
    } else {
      const parts = [];
      if (offline  > 0) parts.push(`📴 ${offline}`);
      if (critical > 0) parts.push(`🔴 ${critical}`);
      if (low      > 0) parts.push(`🟡 ${low}`);
      value = parts.join(' ');
    }

    return {
      label: c.label || 'Batterie',
      value,
      color: STATUS_COL[worstStatus],
      pulse: worstStatus === 'offline' || worstStatus === 'critical',
    };
  }

  function watchEntities(cfg) {
    const h = H();
    return h ? _getBatteryEntities(h) : [];
  }

  /* ════════════════════════════════════════ RENDER ══ */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);

    if (!h) {
      return `<div style="padding:24px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px;font-family:system-ui,sans-serif">Caricamento…</div>`;
    }

    const { items, offline, critical, low, worstStatus, thrL, thrC, total } = _analyze(cfg, h);
    const col = STATUS_COL[worstStatus];

    if (total === 0) {
      return `<div style="padding:36px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px;font-family:system-ui,sans-serif">
        Nessun sensore batteria trovato.<br>
        <span style="font-size:10px;opacity:.6">Verifica che le entità abbiano <code>device_class: battery</code>.</span>
      </div>`;
    }

    /* summary pill */
    let summaryTxt;
    if (worstStatus === 'ok') {
      summaryTxt = `✅ Tutte le ${total} batterie sono OK`;
    } else {
      const pcs = [];
      if (offline  > 0) pcs.push(`${offline} offline`);
      if (critical > 0) pcs.push(`${critical} critica/e`);
      if (low      > 0) pcs.push(`${low} bassa/e`);
      summaryTxt = `⚠️ ${pcs.join(' · ')} su ${total}`;
    }

    /* rows — only show non-ok first, then ok */
    const rows = items.map(item => {
      const sc  = STATUS_COL[item.status];
      const lbl = STATUS_LABEL[item.status];

      let bar = '';
      if (item.level !== null) {
        bar = `<div style="position:relative;width:40px;height:6px;border-radius:3px;background:rgba(255,255,255,.08);flex-shrink:0">
          <div style="position:absolute;top:0;left:0;height:100%;width:${Math.max(3, item.level)}%;background:${sc};border-radius:3px"></div>
        </div>`;
      }

      return `<div style="display:flex;align-items:center;gap:9px;padding:8px 8px;border-radius:9px;border:1px solid ${sc}22;background:${sc}07;margin-bottom:4px">
        <span style="font-size:17px;flex-shrink:0">${STATUS_EMO[item.status]}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(item.name)}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(item.id)}</div>
        </div>
        ${bar}
        <div style="text-align:right;flex-shrink:0">
          ${item.level !== null ? `<div style="font-size:13px;font-weight:800;color:${sc}">${Math.round(item.level)}%</div>` : ''}
          <div style="font-size:9px;font-weight:700;color:${sc}">${eh(lbl)}</div>
        </div>
      </div>`;
    }).join('');

    return `<div style="padding:10px 10px 0;font-family:system-ui,sans-serif">

      <div style="text-align:center;padding:4px 10px 12px">
        <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:${col}18;border:1px solid ${col}44;font-size:11px;font-weight:700;color:${col}">${summaryTxt}</div>
        <div style="font-size:9px;color:rgba(255,255,255,.25);margin-top:6px">Soglie: bassa &lt;${thrL}% · critica &lt;${thrC}%</div>
      </div>

      <div style="max-height:260px;overflow-y:auto;scrollbar-width:thin">${rows}</div>
      <div style="height:8px"></div>
    </div>`;
  }

  /* ════════════════════════════════════════ MOUNT / UPDATE ══ */
  function mount(cfg, rawHass, el) {
    el.innerHTML = render(cfg, rawHass);
    if (el._bPoll) return;
    el._bPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._bPoll); delete el._bPoll; return; }
      try { const h = H(); if (h) el.innerHTML = render(cfg, h); } catch (e) {}
    }, 3000);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, rawHass); } catch (e) {}
  }

  /* ════════════════════════════════════════ CONFIGURE ══ */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { try { document.body.removeChild(ov); } catch (e) {} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key === 'Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    const sinp  = 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px;outline:none;font-family:inherit';
    const sninp = 'width:80px;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:13px;outline:none;font-family:inherit;text-align:center';
    const secL  = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px';

    /* preview count */
    const h   = H();
    const ids = h ? _getBatteryEntities(h) : [];
    const previewNote = ids.length
      ? `<div style="padding:10px 12px;border-radius:9px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2);font-size:11px;color:rgba(255,255,255,.65);margin-bottom:14px">
           🔋 <b style="color:#4ade80">${ids.length}</b> sensori batteria rilevati automaticamente in Home Assistant
         </div>`
      : `<div style="padding:10px 12px;border-radius:9px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);font-size:11px;color:rgba(255,255,255,.5);margin-bottom:14px">
           Nessun sensore con <code style="font-size:10px">device_class: battery</code> trovato al momento
         </div>`;

    ov.innerHTML = `<div style="width:100%;max-height:80vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(250,204,21,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;animation:bcfgUp .22s cubic-bezier(.32,1.12,.56,1)">
      <style>@keyframes bcfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>

      <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(250,204,21,.13);border:1px solid rgba(250,204,21,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🔋</div>
        <div style="flex:1"><div style="font-size:14px;font-weight:800">Configura — Gruppo Batterie</div></div>
        <button id="bcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
      </div>

      <div style="flex:1;overflow-y:auto;scrollbar-width:none;padding:14px 14px 4px">

        <div style="${secL}">Nome chip</div>
        <input id="bcfg-label" style="${sinp};margin-bottom:14px" value="${eh(c.label || 'Batterie')}" placeholder="Nome chip">

        ${previewNote}

        <div style="${secL}">Soglie di allerta</div>
        <div style="display:flex;gap:12px;margin-bottom:4px">
          <div style="flex:1">
            <div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:6px">🟡 Bassa (sotto %)</div>
            <input id="bcfg-thrL" type="number" min="1" max="99" style="${sninp}" value="${eh(String(c.threshLow ?? 20))}">
          </div>
          <div style="flex:1">
            <div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:6px">🔴 Critica (sotto %)</div>
            <input id="bcfg-thrC" type="number" min="1" max="99" style="${sninp}" value="${eh(String(c.threshCrit ?? 10))}">
          </div>
        </div>
        <div style="font-size:9px;color:rgba(255,255,255,.28);margin-bottom:14px">Le entità <b>unavailable</b> o <b>unknown</b> vengono sempre segnalate come offline</div>

        <div style="height:6px"></div>
      </div>

      <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
        <button id="bcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#facc15;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
        <button id="bcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
      </div>
    </div>`;

    ov.querySelector('#bcfg-close').onclick  = closeOv;
    ov.querySelector('#bcfg-cancel').onclick = closeOv;
    ov.onclick = ev => { if (ev.target === ov) closeOv(); };

    ov.querySelector('#bcfg-save').addEventListener('click', () => {
      const newCfg = {
        label:      (ov.querySelector('#bcfg-label')?.value || 'Batterie').trim(),
        threshLow:  parseFloat(ov.querySelector('#bcfg-thrL')?.value)  || 20,
        threshCrit: parseFloat(ov.querySelector('#bcfg-thrC')?.value)  || 10,
      };
      closeOv();
      if (typeof onSave === 'function') onSave(newCfg);
    });

    document.body.appendChild(ov);
  }

  /* ════════════════════════════════════════ REGISTRAZIONE ══ */
  const CARD = {
    id: ID, name: 'Gruppo Batterie', icon: '🔋',
    desc: '',
    version: '1.1', isDistintivo: true,
    defaultCfg: { label: 'Batterie', threshLow: 20, threshCrit: 10 },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-batterie v1.1'); } catch (e) {}
})();
