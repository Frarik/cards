/* frarik-version: 1.0 */
/**
 * GruppoEnergia.js — Distintivo FratechStore v1.0
 * Consumo istantaneo colorato in base alla % della potenza contrattuale
 * Verde <50% · Giallo 50-75% · Arancio 75-90% · Rosso ≥90%
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

  function _fmtPower(watts) {
    if (watts === null || watts === undefined) return '—';
    if (Math.abs(watts) >= 1000) return (watts / 1000).toFixed(2) + ' kW';
    return Math.round(watts) + ' W';
  }

  function _pct(watts, maxW) {
    if (watts === null || maxW <= 0) return 0;
    return Math.min(100, Math.round((watts / maxW) * 100));
  }

  function _color(pct) {
    if (pct >= 90) return '#ef4444';
    if (pct >= 75) return '#f97316';
    if (pct >= 50) return '#facc15';
    return '#4ade80';
  }

  function _emo(pct) {
    if (pct >= 90) return '🔴';
    if (pct >= 75) return '🟠';
    if (pct >= 50) return '🟡';
    return '🟢';
  }

  function _info(cfg, h) {
    const c = loadCfg(cfg);
    if (!c.entity || !h) return { watts: null, pct: 0, col: '#4ade80', label: '—', emo: '⚡' };
    const unit = attrOf(h, c.entity, 'unit_of_measurement') || 'W';
    const watts = _parseW(stateOf(h, c.entity), unit);
    const maxW  = (parseFloat(c.maxKw) || 3) * 1000;
    const p     = _pct(watts, maxW);
    return { watts, pct: p, col: _color(p), label: _fmtPower(watts), emo: _emo(p) };
  }

  /* ════════════════════════════════════════ CHIP ══ */
  function chip(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);
    const info = _info(cfg, h);
    return {
      label: c.label || 'Energia',
      value: `${info.emo} ${info.label}`,
      color: info.col,
    };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    const ids = [];
    if (c.entity)       ids.push(c.entity);
    if (c.solarEntity)  ids.push(c.solarEntity);
    return ids;
  }

  /* ════════════════════════════════════════ RENDER ══ */
  function render(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);

    if (!c.entity) {
      return `<div style="padding:36px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px;font-family:system-ui,sans-serif">
        Nessun sensore configurato.<br>
        <span style="font-size:10px;opacity:.6">Clicca ✏️ sulla chip per configurare.</span>
      </div>`;
    }

    const info = _info(cfg, h);
    const maxW = (parseFloat(c.maxKw) || 3) * 1000;
    const col  = info.col;
    const pct  = info.pct;

    /* solare opzionale */
    let solarRow = '';
    if (c.solarEntity && h) {
      const sUnit = attrOf(h, c.solarEntity, 'unit_of_measurement') || 'W';
      const sW    = _parseW(stateOf(h, c.solarEntity), sUnit);
      solarRow = `<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;background:rgba(250,204,21,.07);border:1px solid rgba(250,204,21,.22);margin-top:8px">
        <span style="font-size:15px;flex-shrink:0">☀️</span>
        <span style="flex:1;font-size:11px;font-weight:600;color:rgba(255,255,255,.7)">${eh(c.solarLabel || nameOf(h, c.solarEntity))}</span>
        <span style="font-size:13px;font-weight:800;color:#facc15">${eh(_fmtPower(sW))}</span>
      </div>`;
    }

    return `<div style="padding:12px 12px 0;font-family:system-ui,sans-serif">

      <!-- valore principale -->
      <div style="text-align:center;padding:14px 0 10px">
        <div style="font-size:42px;font-weight:900;color:${col};line-height:1;letter-spacing:-1px">${eh(info.label)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.38);margin-top:5px">${pct}% di ${eh(_fmtPower(maxW))} (contratto)</div>
      </div>

      <!-- barra a 4 zone -->
      <div style="position:relative;height:14px;border-radius:7px;overflow:hidden;background:rgba(255,255,255,.06);margin-bottom:6px">
        <div style="position:absolute;inset:0;background:linear-gradient(to right,#4ade80 0%,#4ade80 50%,#facc15 50%,#facc15 75%,#f97316 75%,#f97316 90%,#ef4444 90%,#ef4444 100%);opacity:.16;border-radius:7px"></div>
        <div style="position:absolute;top:0;left:0;height:100%;width:${pct}%;background:${col};border-radius:7px;transition:width .45s ease"></div>
      </div>

      <!-- etichette soglie -->
      <div style="display:flex;justify-content:space-between;font-size:8px;color:rgba(255,255,255,.25);margin-bottom:12px;padding:0 2px">
        <span>0</span>
        <span style="color:#4ade80">50%</span>
        <span style="color:#facc15">75%</span>
        <span style="color:#f97316">90%</span>
        <span style="color:#ef4444">100%</span>
      </div>

      ${solarRow}
      <div style="height:10px"></div>
    </div>`;
  }

  /* ════════════════════════════════════════ MOUNT / UPDATE ══ */
  function mount(cfg, rawHass, el) {
    el.innerHTML = render(cfg, rawHass);
    if (el._ePoll) return;
    el._ePoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._ePoll); delete el._ePoll; return; }
      try { const h = H(); if (h) el.innerHTML = render(cfg, h); } catch (e) {}
    }, 2000);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, rawHass); } catch (e) {}
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

    const ov  = document.createElement('div');
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
        <div style="font-size:9px;color:rgba(255,255,255,.28);margin-bottom:14px">
          Verde &lt;50% · Giallo 50-75% · Arancio 75-90% · Rosso ≥90%
        </div>

        <div style="${secL}">Produzione solare (opzionale)</div>
        <input id="ecfg-solar" style="${sinp};margin-bottom:4px" value="${eh(c.solarEntity || '')}" placeholder="🔍 sensor.fotovoltaico_potenza…" autocomplete="off">
        <div style="font-size:9px;color:rgba(255,255,255,.28);margin-bottom:14px">Se impostato viene mostrato nel popup sotto il consumo</div>

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
    version: '1.0', isDistintivo: true,
    defaultCfg: { label: 'Energia', entity: '', maxKw: 3, solarEntity: '' },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-energia v1.0'); } catch (e) {}
})();
