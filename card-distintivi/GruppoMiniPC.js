/* frarik-version: 1.0 */
/**
 * GruppoMiniPC.js — Distintivo FratechStore v1.0
 * Tab Monitor: CPU · RAM · Disco · Temp · Rete · Uptime · Consumo
 * Tab Impostazioni: form configurazione sensori direttamente nel popup
 */
(function () {
  'use strict';

  const ID = 'gruppo-minipc';

  /* ── save callback (impostato da configure()) ── */
  let _mpcSaveFn = null;

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

  /* ── formatters ── */
  function _pct(h, id) {
    if (!h || !id) return null;
    const v = parseFloat(stateOf(h, id));
    return isNaN(v) ? null : Math.min(100, Math.max(0, Math.round(v)));
  }
  function _num(h, id) {
    if (!h || !id) return null;
    const v = parseFloat(stateOf(h, id));
    return isNaN(v) ? null : v;
  }
  function _fmtTemp(v) {
    return v === null ? '—' : v.toFixed(1) + '°C';
  }
  function _fmtNet(v, unit) {
    if (v === null) return '—';
    const u = (unit || '').toLowerCase();
    if (u.includes('mbit') || u.includes('mbps')) return v.toFixed(1) + ' Mbps';
    if (u.includes('kbit') || u.includes('kbps')) return (v / 1000).toFixed(1) + ' Mbps';
    if (u.includes('mb')) return v.toFixed(1) + ' MB/s';
    if (u.includes('kb')) { const mb = v / 1024; return mb >= 1 ? mb.toFixed(1) + ' MB/s' : v.toFixed(0) + ' KB/s'; }
    if (v >= 1048576) return (v / 1048576).toFixed(1) + ' MB/s';
    if (v >= 1024)    return (v / 1024).toFixed(0) + ' KB/s';
    return Math.round(v) + ' B/s';
  }
  function _fmtPow(v) { return v === null ? '—' : v.toFixed(1) + ' W'; }
  function _fmtUptime(raw) {
    if (!raw || raw === 'unknown' || raw === 'unavailable') return null;
    const m1 = String(raw).match(/(\d+)\s+day[s]?,?\s+(\d+):(\d+)/);
    if (m1) {
      const d = +m1[1], h = +m1[2], mn = +m1[3];
      return d > 0 ? `${d}g ${h}h` : h > 0 ? `${h}h ${mn}m` : `${mn}m`;
    }
    const m2 = String(raw).match(/^(\d+):(\d+):(\d+)$/);
    if (m2) {
      const h = +m2[1], mn = +m2[2];
      if (h >= 24) { const d = Math.floor(h / 24); return `${d}g ${h % 24}h`; }
      return h > 0 ? `${h}h ${mn}m` : `${mn}m`;
    }
    return String(raw).slice(0, 14);
  }

  /* ── colori ── */
  function _pctCol(p) {
    if (p === null) return '#6b7280';
    if (p >= 90) return '#ef4444';
    if (p >= 75) return '#f97316';
    if (p >= 50) return '#facc15';
    return '#4ade80';
  }
  function _tempCol(v) {
    if (v === null) return '#6b7280';
    if (v >= 85) return '#ef4444';
    if (v >= 75) return '#f97316';
    if (v >= 60) return '#facc15';
    return '#4ade80';
  }

  /* ── Arc gauge SVG (240°) ── */
  function _arc(pct, label) {
    const col = _pctCol(pct);
    const cx = 50, cy = 54, r = 37;
    const toXY = deg => ({ x: cx + r * Math.cos(deg * Math.PI / 180), y: cy + r * Math.sin(deg * Math.PI / 180) });
    const s = toXY(150), e = toXY(390);
    const bgD = `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 1 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
    let fgD = '';
    if (pct !== null && pct > 0) {
      const fd = Math.min(240 * pct / 100, 239.9);
      const fe = toXY(150 + fd);
      fgD = `<path d="M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${fd > 180 ? 1 : 0} 1 ${fe.x.toFixed(1)} ${fe.y.toFixed(1)}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round"/>`;
    }
    const val = pct !== null ? `${pct}%` : '—';
    return `<svg viewBox="0 0 100 95" style="width:90px;height:86px">
      <path d="${bgD}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="8" stroke-linecap="round"/>
      ${fgD}
      <text x="50" y="52" text-anchor="middle" fill="${col}" font-size="19" font-weight="900" font-family="system-ui,sans-serif">${eh(val)}</text>
      <text x="50" y="68" text-anchor="middle" fill="rgba(255,255,255,.65)" font-size="10" font-family="system-ui,sans-serif">${eh(label)}</text>
    </svg>`;
  }

  /* ── stat card compatta ── */
  function _stat(ico, val, label, col) {
    return `<div style="display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)">
      <span style="font-size:20px;flex-shrink:0">${ico}</span>
      <div style="min-width:0">
        <div style="font-size:16px;font-weight:800;color:${col};line-height:1.1">${eh(val)}</div>
        <div style="font-size:10px;color:#fff;margin-top:2px">${eh(label)}</div>
      </div>
    </div>`;
  }

  /* ── render tab monitor ── */
  function _renderMonitor(cfg, h) {
    const c = loadCfg(cfg);
    const hasSensor = c.cpuEntity || c.ramEntity || c.diskEntity || c.tempEntity;
    if (!hasSensor) {
      return `<div style="padding:30px 0;text-align:center;color:#fff;font-size:13px">
        Nessun sensore configurato.<br>
        <span style="font-size:11px;color:#fff">Passa al tab ⚙️ Impostazioni.</span>
      </div>`;
    }

    const cpu  = _pct(h, c.cpuEntity);
    const ram  = _pct(h, c.ramEntity);
    const disk = _pct(h, c.diskEntity);
    const temp = _num(h, c.tempEntity);
    const pwr  = _num(h, c.powerEntity);
    const upRaw   = _num(h, c.netUpEntity);
    const dnRaw   = _num(h, c.netDownEntity);
    const upUnit  = c.netUpEntity   ? (attrOf(h, c.netUpEntity,   'unit_of_measurement') || '') : '';
    const dnUnit  = c.netDownEntity ? (attrOf(h, c.netDownEntity, 'unit_of_measurement') || '') : '';
    const uptime  = c.uptimeEntity  ? _fmtUptime(stateOf(h, c.uptimeEntity)) : null;

    /* online: qualsiasi sensore principale risponde */
    const checks = [c.cpuEntity, c.ramEntity, c.diskEntity, c.tempEntity].filter(Boolean);
    const online = h && checks.some(id => { const s = stateOf(h, id); return s !== 'unknown' && s !== 'unavailable'; });
    const dotCol = online ? '#4ade80' : '#ef4444';

    /* gauge row (solo quelli configurati) */
    const gauges = [
      { pct: cpu,  lbl: 'CPU',   id: c.cpuEntity  },
      { pct: ram,  lbl: 'RAM',   id: c.ramEntity  },
      { pct: disk, lbl: 'Disco', id: c.diskEntity },
    ].filter(g => g.id);

    /* misc stats */
    const miscPairs = [
      c.tempEntity  ? _stat('🌡️', _fmtTemp(temp), 'Temperatura CPU', _tempCol(temp)) : '',
      c.powerEntity ? _stat('⚡', _fmtPow(pwr),   'Consumo',          '#60a5fa')     : '',
    ].filter(Boolean);

    const hasNet = c.netUpEntity || c.netDownEntity;
    const netPairs = [
      c.netUpEntity   ? _stat('⬆️', _fmtNet(upRaw, upUnit), 'Upload',   '#34d399') : '',
      c.netDownEntity ? _stat('⬇️', _fmtNet(dnRaw, dnUnit), 'Download', '#818cf8') : '',
    ].filter(Boolean);

    return `
      <div style="display:flex;align-items:center;gap:8px;padding:9px 13px;border-radius:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:16px">
        <span style="width:8px;height:8px;border-radius:50%;background:${dotCol};flex-shrink:0;box-shadow:0 0 7px ${dotCol}99;display:inline-block"></span>
        <span style="font-size:13px;font-weight:700;color:#fff">${online ? 'Online' : 'Offline'}</span>
        ${uptime ? `<span style="font-size:11px;color:#fff;margin-left:auto">⏱ ${eh(uptime)}</span>` : ''}
      </div>

      <div style="display:flex;justify-content:space-around;align-items:center;margin-bottom:16px">
        ${gauges.map(g => `<div style="display:flex;flex-direction:column;align-items:center">${_arc(g.pct, g.lbl)}</div>`).join('')}
      </div>

      ${miscPairs.length ? `<div style="display:grid;grid-template-columns:${miscPairs.length > 1 ? '1fr 1fr' : '1fr'};gap:8px;margin-bottom:14px">${miscPairs.join('')}</div>` : ''}

      ${hasNet ? `<div style="display:grid;grid-template-columns:${netPairs.length > 1 ? '1fr 1fr' : '1fr'};gap:8px;margin-bottom:4px">${netPairs.join('')}</div>` : ''}
    `;
  }

  /* ── autocomplete nel popup ── */
  let _mpcAc = null;
  function _mpcCloseAc() { try { _mpcAc?.remove(); } catch (e) {} _mpcAc = null; }
  function _mpcOpenAc(inp, matches, onPick) {
    _mpcCloseAc();
    if (!matches.length) return;
    const rect = inp.getBoundingClientRect();
    const MAXH = 160;
    const above = (window.innerHeight - rect.bottom - 4 < MAXH) && (rect.top > MAXH);
    _mpcAc = document.createElement('div');
    const pos = above ? `bottom:${window.innerHeight - rect.top + 2}px` : `top:${rect.bottom + 2}px`;
    _mpcAc.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100010;background:#1a1630;border:1px solid rgba(99,102,241,.35);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
    matches.slice(0, 10).forEach(m => {
      const row = document.createElement('div');
      row.style.cssText = 'padding:7px 11px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04)';
      row.innerHTML = `<div style="font-size:11px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${eh(m.name)}</div><div style="font-size:9px;color:#fff">${eh(m.id)}</div>`;
      row.addEventListener('mouseover', () => row.style.background = 'rgba(99,102,241,.1)');
      row.addEventListener('mouseout',  () => row.style.background = '');
      row.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id); _mpcCloseAc(); });
      _mpcAc.appendChild(row);
    });
    document.body.appendChild(_mpcAc);
    inp.focus();
  }
  function _mpcSetupAc(inp, onPick) {
    function match(q) {
      const h = H(); if (!h?.states) return [];
      return Object.keys(h.states)
        .filter(id => id.startsWith('sensor.') && (id.toLowerCase().includes(q) || nameOf(h, id).toLowerCase().includes(q)))
        .map(id => ({ id, name: nameOf(h, id) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    inp.addEventListener('input', () => { const q = inp.value.toLowerCase().trim(); q ? _mpcOpenAc(inp, match(q), onPick) : _mpcCloseAc(); });
    inp.addEventListener('focus', () => { const q = inp.value.toLowerCase().trim(); if (q) _mpcOpenAc(inp, match(q), onPick); });
    inp.addEventListener('blur',  () => setTimeout(_mpcCloseAc, 180));
  }

  /* ── render tab impostazioni ── */
  function _renderSettings(cfg) {
    const c = loadCfg(cfg);
    const sinp = 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px;outline:none;font-family:system-ui,sans-serif';
    const secH = (ico, lbl) => `<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin:14px 0 8px;padding:6px 10px;background:rgba(255,255,255,.04);border-radius:8px;border:1px solid rgba(255,255,255,.07)">${ico} ${lbl}</div>`;
    const fld  = (id, label, val, ph) =>
      `<div style="margin-bottom:9px">
        <div style="font-size:10px;color:#fff;margin-bottom:4px">${label}</div>
        <input id="mpc-${id}" style="${sinp}" value="${eh(val || '')}" placeholder="${eh(ph || '')}">
      </div>`;

    return `<div>
      ${secH('🖥️', 'Sensori principali')}
      ${fld('label',  'Nome chip',        c.label,       'es. MiniPC')}
      ${fld('cpu',    'CPU %',            c.cpuEntity,   'sensor.cpu_percent')}
      ${fld('ram',    'RAM %',            c.ramEntity,   'sensor.memory_use_percent')}
      ${fld('disk',   'Disco %',          c.diskEntity,  'sensor.disk_use_percent')}
      ${fld('temp',   'Temperatura CPU',  c.tempEntity,  'sensor.processor_temperature')}

      ${secH('🌐', 'Rete')}
      ${fld('netup',   'Upload',   c.netUpEntity,   'sensor.network_throughput_up')}
      ${fld('netdown', 'Download', c.netDownEntity, 'sensor.network_throughput_in')}

      ${secH('⏱', 'Altro')}
      ${fld('uptime', 'Uptime',     c.uptimeEntity, 'sensor.last_boot')}
      ${fld('power',  'Consumo W',  c.powerEntity,  'sensor.power_consumption')}

      <button data-mpc-save style="width:100%;margin-top:16px;padding:12px;border-radius:11px;border:none;background:#6366f1;color:#fff;font-weight:800;cursor:pointer;font-size:13px;font-family:system-ui,sans-serif">💾 Salva</button>
    </div>`;
  }

  /* ── render principale ── */
  function render(cfg, rawHass, tab) {
    const h = liveH(rawHass);
    const activeTab = tab || 'monitor';

    const tabBtn = (t, ico, lbl) => {
      const on = activeTab === t;
      return `<button data-mpc-tab="${t}" style="flex:1;padding:9px 6px;border:none;border-radius:0;background:${on ? 'rgba(99,102,241,.15)' : 'transparent'};color:${on ? '#818cf8' : '#fff'};font-weight:${on ? '800' : '600'};font-size:12px;cursor:pointer;border-bottom:2px solid ${on ? '#6366f1' : 'transparent'};transition:all .15s;font-family:system-ui,sans-serif">${ico} ${lbl}</button>`;
    };

    return `<div style="font-family:system-ui,sans-serif">
      <div style="display:flex;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:14px">
        ${tabBtn('monitor',  '🖥️', 'Monitor')}
        ${tabBtn('settings', '⚙️', 'Impostazioni')}
      </div>
      <div style="padding:0 14px 8px">
        ${activeTab === 'monitor' ? _renderMonitor(cfg, h) : _renderSettings(cfg)}
      </div>
    </div>`;
  }

  /* ── chip ── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const cpu = h && c.cpuEntity ? _pct(h, c.cpuEntity) : null;
    const col = _pctCol(cpu);
    return { label: c.label || 'MiniPC', value: cpu !== null ? `🖥️ ${cpu}%` : '🖥️', color: col };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    return [c.cpuEntity, c.ramEntity, c.diskEntity, c.tempEntity, c.netUpEntity, c.netDownEntity, c.uptimeEntity, c.powerEntity].filter(Boolean);
  }

  /* ── handlers ── */
  function _mountHandlers(cfg, el) {
    if (el._mpcHandler) el.removeEventListener('click', el._mpcHandler);

    function handler(ev) {
      /* switch tab */
      const tabBtn = ev.target.closest('[data-mpc-tab]');
      if (tabBtn) {
        _mpcCloseAc();
        el._mpcTab = tabBtn.dataset.mpcTab;
        const _sp = el.parentElement, _st = _sp ? _sp.scrollTop : 0;
        el.innerHTML = render(cfg, null, el._mpcTab);
        _mountHandlers(cfg, el);
        if (el._mpcTab === 'settings') _mpcSetupInputsAc(el);
        if (_sp && _st > 0) _sp.scrollTop = _st;
        ev.stopPropagation(); return;
      }

      /* save impostazioni */
      const saveBtn = ev.target.closest('[data-mpc-save]');
      if (saveBtn) {
        const get = id => (el.querySelector(`#mpc-${id}`)?.value || '').trim();
        const newCfg = {
          label:         get('label') || 'MiniPC',
          cpuEntity:     get('cpu'),
          ramEntity:     get('ram'),
          diskEntity:    get('disk'),
          tempEntity:    get('temp'),
          netUpEntity:   get('netup'),
          netDownEntity: get('netdown'),
          uptimeEntity:  get('uptime'),
          powerEntity:   get('power'),
        };
        _mpcCloseAc();
        if (typeof _mpcSaveFn === 'function') {
          _mpcSaveFn(newCfg);
          _mpcSaveFn = null;
          el._mpcTab = 'monitor';
          el.innerHTML = render(newCfg, H(), 'monitor');
          _mountHandlers(newCfg, el);
        } else {
          try { window.showToast?.('✅ Premi ✕, poi usa ✏️ sulla chip per salvare la prima volta'); } catch (_) {}
        }
        ev.stopPropagation(); return;
      }
    }

    el._mpcHandler = handler;
    el.addEventListener('click', handler);
  }

  /* ── autocomplete setup per tutti i campi delle impostazioni ── */
  function _mpcSetupInputsAc(el) {
    const fields = [
      { id: 'cpu',    pick: v => { const i = el.querySelector('#mpc-cpu');    if (i) i.value = v; } },
      { id: 'ram',    pick: v => { const i = el.querySelector('#mpc-ram');    if (i) i.value = v; } },
      { id: 'disk',   pick: v => { const i = el.querySelector('#mpc-disk');   if (i) i.value = v; } },
      { id: 'temp',   pick: v => { const i = el.querySelector('#mpc-temp');   if (i) i.value = v; } },
      { id: 'netup',  pick: v => { const i = el.querySelector('#mpc-netup');  if (i) i.value = v; } },
      { id: 'netdown',pick: v => { const i = el.querySelector('#mpc-netdown');if (i) i.value = v; } },
      { id: 'uptime', pick: v => { const i = el.querySelector('#mpc-uptime'); if (i) i.value = v; } },
      { id: 'power',  pick: v => { const i = el.querySelector('#mpc-power');  if (i) i.value = v; } },
    ];
    fields.forEach(({ id, pick }) => {
      const inp = el.querySelector(`#mpc-${id}`);
      if (inp) _mpcSetupAc(inp, pick);
    });
  }

  /* ── mount / update ── */
  function mount(cfg, rawHass, el) {
    if (el._mpcMounted) return;
    el._mpcMounted = true;
    el._mpcTab = 'monitor';
    el.setAttribute('data-mpc-body', '1');
    el.innerHTML = render(cfg, rawHass, 'monitor');
    _mountHandlers(cfg, el);

    if (el._mpcPoll) return;
    el._mpcPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._mpcPoll); delete el._mpcPoll; _mpcCloseAc(); return; }
      if (el._mpcTab === 'settings') return;
      try {
        const h = H(); if (!h) return;
        const _sp = el.parentElement, _st = _sp ? _sp.scrollTop : 0;
        el.innerHTML = render(cfg, h, 'monitor');
        _mountHandlers(cfg, el);
        if (_sp && _st > 0) _sp.scrollTop = _st;
      } catch (e) {}
    }, 2000);
  }

  function update(cfg, rawHass, el) {
    try {
      if (!el._mpcTab || el._mpcTab === 'settings') return;
      const h = liveH(rawHass); if (!h) return;
      el.innerHTML = render(cfg, h, 'monitor');
      _mountHandlers(cfg, el);
    } catch (e) {}
  }

  /* ── configure: memorizza onSave, poi apre il tab impostazioni nel popup se aperto ── */
  function configure(cfg, _el, onSave) {
    _mpcSaveFn = onSave || null;
    const popup = document.querySelector('[data-mpc-body]');
    if (popup) {
      _mpcCloseAc();
      popup._mpcTab = 'settings';
      popup.innerHTML = render(cfg, null, 'settings');
      _mountHandlers(cfg, popup);
      _mpcSetupInputsAc(popup);
    }
  }

  /* ── preview store ── */
  function preview() {
    const mockH = {
      states: {
        'sensor.p_cpu':  { state: '65', attributes: { unit_of_measurement: '%', friendly_name: 'CPU' } },
        'sensor.p_ram':  { state: '48', attributes: { unit_of_measurement: '%', friendly_name: 'RAM' } },
        'sensor.p_disk': { state: '72', attributes: { unit_of_measurement: '%', friendly_name: 'Disco' } },
        'sensor.p_temp': { state: '58', attributes: { unit_of_measurement: '°C', friendly_name: 'Temperatura' } },
        'sensor.p_up':   { state: '2.5',  attributes: { unit_of_measurement: 'MB/s', friendly_name: 'Upload' } },
        'sensor.p_down': { state: '18.3', attributes: { unit_of_measurement: 'MB/s', friendly_name: 'Download' } },
      },
    };
    const mockCfg = {
      label: 'MiniPC',
      cpuEntity: 'sensor.p_cpu', ramEntity: 'sensor.p_ram', diskEntity: 'sensor.p_disk',
      tempEntity: 'sensor.p_temp', netUpEntity: 'sensor.p_up', netDownEntity: 'sensor.p_down',
    };
    return render(mockCfg, mockH, 'monitor');
  }

  /* ── registrazione ── */
  const CARD = {
    id: ID, name: 'Gruppo MiniPC', icon: '🖥️',
    desc: 'Monitor CPU · RAM · Disco · Rete · Temperatura · Consumo',
    version: '1.0', isDistintivo: true,
    defaultCfg: { label: 'MiniPC', cpuEntity: '', ramEntity: '', diskEntity: '', tempEntity: '', netUpEntity: '', netDownEntity: '', uptimeEntity: '', powerEntity: '' },
    chip, watchEntities,
    render: (cfg, rawHass) => render(cfg, rawHass, 'monitor'),
    mount, update, configure, preview,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-minipc v1.0'); } catch (e) {}
})();
