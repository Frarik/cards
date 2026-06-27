/* frarik-version: 1.0 */
/**
 * GruppoBatterie.js — Distintivo FratechStore v1.0
 * Monitora batterie e dispositivi offline
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

  /* ── classify a single entity ── */
  /*
   * Returns: { status: 'ok' | 'low' | 'critical' | 'offline', level: number|null }
   * - 'offline'  → state is unavailable / unknown / -
   * - 'critical' → numeric level < thr_c
   * - 'low'      → numeric level < thr_l
   * - 'ok'       → numeric level >= thr_l  OR binary_sensor state is 'off'
   */
  function _classifyEntity(h, id, thrL, thrC) {
    if (!h?.states?.[id]) return { status: 'offline', level: null };

    const st = stateOf(h, id);
    if (['unavailable', 'unknown', 'none', '-', ''].includes(st.toLowerCase())) {
      return { status: 'offline', level: null };
    }

    /* binary sensor (device_class: battery → on=low, off=ok) */
    const domain = id.split('.')[0];
    if (domain === 'binary_sensor') {
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

  /* severity rank (higher = worse) */
  const RANK = { offline: 3, critical: 2, low: 1, ok: 0 };
  const STATUS_LABEL = { offline: 'Offline', critical: 'Critica', low: 'Bassa', ok: 'OK' };
  const STATUS_COL   = { offline: '#ef4444', critical: '#f97316', low: '#facc15', ok: '#4ade80' };
  const STATUS_EMO   = { offline: '📴', critical: '🔴', low: '🟡', ok: '🟢' };

  function _analyze(cfg, h) {
    const c      = loadCfg(cfg);
    const ids    = Array.isArray(c.entities) ? c.entities : [];
    const thrL   = parseFloat(c.threshLow)  || 20;
    const thrC   = parseFloat(c.threshCrit) || 10;

    const items = ids.map(id => {
      const cl = _classifyEntity(h, id, thrL, thrC);
      return { id, name: nameOf(h, id), ...cl };
    }).sort((a, b) => RANK[b.status] - RANK[a.status] || a.name.localeCompare(b.name));

    const offline  = items.filter(i => i.status === 'offline').length;
    const critical = items.filter(i => i.status === 'critical').length;
    const low      = items.filter(i => i.status === 'low').length;

    let worstStatus = 'ok';
    if (offline + critical > 0) worstStatus = offline > 0 ? 'offline' : 'critical';
    else if (low > 0) worstStatus = 'low';

    return { items, offline, critical, low, worstStatus, thrL, thrC };
  }

  /* ════════════════════════════════════════ CHIP ══ */
  function chip(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);
    const ids  = Array.isArray(c.entities) ? c.entities : [];

    if (!ids.length || !h) {
      return { label: c.label || 'Batterie', value: '🔋 —', color: '#4ade80' };
    }

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
    const c = loadCfg(cfg);
    return Array.isArray(c.entities) ? [...c.entities] : [];
  }

  /* ════════════════════════════════════════ RENDER ══ */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);

    if (!Array.isArray(c.entities) || !c.entities.length) {
      return `<div style="padding:36px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px;font-family:system-ui,sans-serif">
        Nessun dispositivo configurato.<br>
        <span style="font-size:10px;opacity:.6">Clicca ✏️ sulla chip per aggiungere sensori.</span>
      </div>`;
    }

    if (!h) {
      return `<div style="padding:24px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px;font-family:system-ui,sans-serif">Caricamento…</div>`;
    }

    const { items, offline, critical, low, worstStatus, thrL, thrC } = _analyze(cfg, h);
    const col = STATUS_COL[worstStatus];

    /* summary pill */
    let summaryTxt;
    if (worstStatus === 'ok') summaryTxt = `✅ Tutti i dispositivi sono OK`;
    else {
      const pcs = [];
      if (offline  > 0) pcs.push(`${offline} offline`);
      if (critical > 0) pcs.push(`${critical} critica/e`);
      if (low      > 0) pcs.push(`${low} bassa/e`);
      summaryTxt = `⚠️ ${pcs.join(' · ')}`;
    }

    /* rows */
    const rows = items.map(item => {
      const sc = STATUS_COL[item.status];
      const lbl = STATUS_LABEL[item.status];
      const levelStr = item.level !== null ? `${Math.round(item.level)}%` : '';

      /* battery bar */
      let bar = '';
      if (item.level !== null) {
        bar = `<div style="position:relative;width:38px;height:6px;border-radius:3px;background:rgba(255,255,255,.08);flex-shrink:0">
          <div style="position:absolute;top:0;left:0;height:100%;width:${Math.max(3, item.level)}%;background:${sc};border-radius:3px"></div>
        </div>`;
      }

      return `<div style="display:flex;align-items:center;gap:9px;padding:9px 8px;border-radius:9px;border:1px solid ${sc}22;background:${sc}08;margin-bottom:5px">
        <span style="font-size:18px;flex-shrink:0">${STATUS_EMO[item.status]}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(item.name)}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.32);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(item.id)}</div>
        </div>
        ${bar}
        <div style="text-align:right;flex-shrink:0">
          ${levelStr ? `<div style="font-size:13px;font-weight:800;color:${sc}">${eh(levelStr)}</div>` : ''}
          <div style="font-size:9px;font-weight:700;color:${sc}">${eh(lbl)}</div>
        </div>
      </div>`;
    }).join('');

    return `<div style="padding:10px 10px 0;font-family:system-ui,sans-serif">

      <!-- summary -->
      <div style="text-align:center;padding:4px 10px 12px">
        <div style="display:inline-block;padding:6px 16px;border-radius:20px;background:${col}18;border:1px solid ${col}44;font-size:11px;font-weight:700;color:${col}">${summaryTxt}</div>
        <div style="font-size:9px;color:rgba(255,255,255,.25);margin-top:6px">Soglie: bassa &lt;${thrL}% · critica &lt;${thrC}%</div>
      </div>

      <!-- lista dispositivi -->
      <div style="max-height:240px;overflow-y:auto;scrollbar-width:thin">${rows}</div>

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
    const c   = loadCfg(cfg);
    const h   = H();
    let entities = Array.isArray(c.entities) ? [...c.entities] : [];
    let thrL  = c.threshLow  ?? 20;
    let thrC  = c.threshCrit ?? 10;

    let _acDrop = null;
    function _closeAc() { try { _acDrop?.remove(); } catch (e) {} _acDrop = null; }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 160;
      const useAbove = (window.innerHeight - rect.bottom - 6 < MAXH) && (rect.top > MAXH);
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(250,204,21,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
      matches.slice(0, 10).forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05)';
        r.innerHTML = `<div style="font-size:11px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${eh(m.name)}</div><div style="font-size:9px;color:rgba(255,255,255,.38)">${eh(m.id)}</div>`;
        r.addEventListener('mouseover', () => r.style.background = 'rgba(250,204,21,.08)');
        r.addEventListener('mouseout',  () => r.style.background = '');
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
      inp.focus();
    }

    function _setupAc(inp, onPick) {
      function _batteryMatches(q) {
        if (!h?.states) return [];
        return Object.keys(h.states)
          .filter(id => {
            if (!['sensor', 'binary_sensor', 'device_tracker'].includes(id.split('.')[0])) return false;
            const dc = h.states[id]?.attributes?.device_class || '';
            const lId = id.toLowerCase(), lNm = nameOf(h,id).toLowerCase();
            return lId.includes(q) || lNm.includes(q) || dc.includes(q) ||
                   lId.includes('battery') || dc === 'battery';
          })
          .filter(id => {
            const q2 = q.toLowerCase();
            return id.toLowerCase().includes(q2) || nameOf(h,id).toLowerCase().includes(q2);
          })
          .map(id => ({ id, name: nameOf(h, id) }))
          .sort((a,b)=>a.name.localeCompare(b.name));
      }
      inp.addEventListener('input', () => { const q = inp.value.toLowerCase().trim(); q ? _openAc(inp, _batteryMatches(q), onPick) : _closeAc(); });
      inp.addEventListener('focus', () => { const q = inp.value.toLowerCase().trim(); if (q) _openAc(inp, _batteryMatches(q), onPick); });
      inp.addEventListener('blur',  () => setTimeout(_closeAc, 160));
    }

    /* ─── build overlay ─── */
    const ov  = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch (e) {} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key === 'Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    const sinp  = 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px;outline:none;font-family:inherit';
    const sninp = 'width:70px;box-sizing:border-box;padding:7px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px;outline:none;font-family:inherit;text-align:center';
    const secL  = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px';

    function _listHtml() {
      if (!entities.length) return `<div style="padding:10px 0;font-size:11px;color:rgba(255,255,255,.28);text-align:center">Nessun dispositivo aggiunto</div>`;
      return entities.map((id, i) => `
        <div class="batt-row" style="display:flex;align-items:center;gap:7px;padding:7px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);margin-bottom:4px">
          <span style="font-size:14px">🔋</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${eh(nameOf(h, id))}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${eh(id)}</div>
          </div>
          <button data-del="${i}" style="width:22px;height:22px;border-radius:6px;border:none;background:rgba(239,68,68,.15);color:#ef4444;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
        </div>`).join('');
    }

    ov.innerHTML = `<div style="width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(250,204,21,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;animation:bcfgUp .22s cubic-bezier(.32,1.12,.56,1)">
      <style>@keyframes bcfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} #bcfg-body::-webkit-scrollbar{display:none}</style>

      <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(250,204,21,.13);border:1px solid rgba(250,204,21,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🔋</div>
        <div style="flex:1"><div style="font-size:14px;font-weight:800">Configura — Gruppo Batterie</div></div>
        <button id="bcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
      </div>

      <div id="bcfg-body" style="flex:1;overflow-y:auto;scrollbar-width:none;padding:14px 14px 4px">

        <div style="${secL}">Nome chip</div>
        <input id="bcfg-label" style="${sinp};margin-bottom:14px" value="${eh(c.label || 'Batterie')}" placeholder="Nome chip">

        <div style="${secL}">Soglie</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <div style="flex:1">
            <div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:4px">🟡 Bassa (&lt;%)</div>
            <input id="bcfg-thrL" type="number" min="1" max="99" style="${sninp}" value="${eh(String(thrL))}">
          </div>
          <div style="flex:1">
            <div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:4px">🔴 Critica (&lt;%)</div>
            <input id="bcfg-thrC" type="number" min="1" max="99" style="${sninp}" value="${eh(String(thrC))}">
          </div>
        </div>
        <div style="font-size:9px;color:rgba(255,255,255,.28);margin-bottom:14px">Percentuale batteria sotto cui scatta l'avviso</div>

        <div style="${secL}">Aggiungi dispositivo</div>
        <div style="display:flex;gap:6px;margin-bottom:6px">
          <input id="bcfg-add" style="${sinp}" placeholder="🔍 sensor.battery… o binary_sensor…" autocomplete="off">
          <button id="bcfg-addBtn" style="flex-shrink:0;padding:0 12px;border-radius:8px;border:none;background:rgba(250,204,21,.18);color:#facc15;cursor:pointer;font-size:13px;font-weight:700">＋</button>
        </div>
        <div style="font-size:9px;color:rgba(255,255,255,.28);margin-bottom:10px">Cerca per nome o inserisci l'entity_id direttamente</div>

        <div id="bcfg-list">${_listHtml()}</div>
        <div style="height:10px"></div>
      </div>

      <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
        <button id="bcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#facc15;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
        <button id="bcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
      </div>
    </div>`;

    ov.querySelector('#bcfg-close').onclick  = closeOv;
    ov.querySelector('#bcfg-cancel').onclick = closeOv;
    ov.onclick = ev => { if (ev.target === ov) closeOv(); };

    const addInp = ov.querySelector('#bcfg-add');
    _setupAc(addInp, id => { addInp.value = id; });

    function _refreshList() {
      ov.querySelector('#bcfg-list').innerHTML = _listHtml();
      ov.querySelector('#bcfg-list').querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          entities.splice(parseInt(btn.dataset.del), 1);
          _refreshList();
        });
      });
    }
    _refreshList();

    ov.querySelector('#bcfg-addBtn').addEventListener('click', () => {
      const id = addInp.value.trim();
      if (!id) return;
      if (!entities.includes(id)) { entities.push(id); _refreshList(); }
      addInp.value = '';
    });
    addInp.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') { ev.preventDefault(); ov.querySelector('#bcfg-addBtn').click(); }
    });

    ov.querySelector('#bcfg-save').addEventListener('click', () => {
      const newCfg = {
        label:       (ov.querySelector('#bcfg-label')?.value || 'Batterie').trim(),
        entities:    [...entities],
        threshLow:   parseFloat(ov.querySelector('#bcfg-thrL')?.value)  || 20,
        threshCrit:  parseFloat(ov.querySelector('#bcfg-thrC')?.value)  || 10,
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
    version: '1.0', isDistintivo: true,
    defaultCfg: { label: 'Batterie', entities: [], threshLow: 20, threshCrit: 10 },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-batterie v1.0'); } catch (e) {}
})();
