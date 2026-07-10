/* frarik-version: 1.0 */
/**
 * GruppoPrese.js — Distintivo FratechStore v1.0
 * Chip contatore prese accese · popup toggle + watt real-time per ogni presa
 */
(function () {
  'use strict';

  const ID = 'gruppo-prese';
  const ON_STATES = ['on','open','unlocked','playing','heating','cooling','active','home','present','detected','wet','running','charging'];

  function H() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    return null;
  }
  function loadCfg(cfg) { return cfg && typeof cfg === 'object' ? cfg : {}; }
  function nameOf(h, id) {
    const s = h && h.states && h.states[id];
    return (s && s.attributes && s.attributes.friendly_name) || (id.includes('.') ? id.split('.')[1].replace(/_/g, ' ') : id);
  }
  function stateOf(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || 'unknown'; }
  function isOn(h, id) { return ON_STATES.includes(stateOf(h, id).toLowerCase()); }
  function numOf(h, id) {
    if (!h || !id) return null;
    const s = h.states && h.states[id];
    if (!s) return null;
    const v = parseFloat(s.state);
    return isNaN(v) ? null : v;
  }
  function callSvc(domain, svc, entityId) {
    if (typeof window.callSvc === 'function') { window.callSvc(domain, svc, entityId); return; }
    const hh = H(); if (hh && hh.callService) hh.callService(domain, svc, { entity_id: entityId });
  }
  function eh(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function hex2rgba(hex, a) {
    let h = (hex || '').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return `rgba(255,255,255,${a})`;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }
  function liveH(rawHass) { return H() || (rawHass && rawHass.states ? rawHass : null); }
  function iconHtml(ico, sz) {
    sz = sz || 16;
    if (typeof ico === 'string' && ico.startsWith('mdi:'))
      return `<span class="mdi mdi-${ico.slice(4)}" style="font-size:${sz}px;line-height:1;color:inherit"></span>`;
    return `<span style="font-size:${sz}px;line-height:1">${ico || '🔌'}</span>`;
  }
  function _dynIcon(ico, on) {
    const P = {
      '🔌':        ['🔌', '🔌'],
      'mdi:power-plug':        ['mdi:power-plug',        'mdi:power-plug-off'],
      'mdi:power-plug-off':    ['mdi:power-plug',        'mdi:power-plug-off'],
      'mdi:power-socket-eu':   ['mdi:power-socket-eu',   'mdi:power-socket-eu'],
      'mdi:power-socket':      ['mdi:power-socket',      'mdi:power-socket'],
      'mdi:socket-eu':         ['mdi:socket-eu',         'mdi:socket-eu'],
    };
    const pair = P[ico];
    if (pair) return on ? pair[0] : pair[1];
    return ico || (on ? 'mdi:power-plug' : 'mdi:power-plug-off');
  }
  function fmtW(w) {
    if (w === null || w === undefined) return null;
    if (w >= 1000) return (w / 1000).toFixed(1) + ' kW';
    return Math.round(w) + ' W';
  }

  /* ── chip ── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const active = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
    const col = c.color || '#fb923c';

    // somma watt solo delle prese accese (se configurato)
    let totalW = null;
    if (h) {
      let sum = 0, hasPwr = false;
      ents.forEach(e => {
        if (e.power_entity && isOn(h, e.entity)) {
          const w = numOf(h, e.power_entity);
          if (w !== null) { sum += w; hasPwr = true; }
        }
      });
      if (hasPwr) totalW = sum;
    }

    const value = ents.length
      ? (totalW !== null ? `${active}/${ents.length} · ${fmtW(totalW)}` : `${active}/${ents.length}`)
      : '—';

    return {
      icon: iconHtml(c.icon || '🔌'),
      label: c.label || 'Prese',
      value,
      color: active > 0 ? col : 'rgba(255,255,255,0.32)',
    };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const ids = ents.map(e => e.entity).filter(Boolean);
    ents.forEach(e => {
      if (e.power_entity) ids.push(e.power_entity);
      if (e.automation)   ids.push(e.automation);
    });
    return ids;
  }

  /* ── render popup ── */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const col = c.color || '#fb923c';
    const active = h ? ents.filter(e => isOn(h, e.entity)).length : 0;

    // totale watt (solo accese)
    let totalW = null;
    if (h) {
      let sum = 0, hasPwr = false;
      ents.forEach(e => {
        if (e.power_entity && isOn(h, e.entity)) {
          const w = numOf(h, e.power_entity);
          if (w !== null) { sum += w; hasPwr = true; }
        }
      });
      if (hasPwr) totalW = sum;
    }

    const ctrlBar = ents.length ? `
      <div style="display:flex;gap:8px;padding:4px 14px 8px">
        <button data-gp-all="on" style="flex:1;padding:7px;border-radius:8px;border:1px solid ${hex2rgba(col,.4)};background:${hex2rgba(col,.12)};color:${col};font-size:11px;font-weight:700;cursor:pointer">⚡ Accendi tutte</button>
        <button data-gp-all="off" style="flex:1;padding:7px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(255,255,255,.6);font-size:11px;font-weight:700;cursor:pointer">⏻ Spegni tutte</button>
      </div>` : '';

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const on = h ? isOn(h, e.entity) : false;
      const lbl = e.label || nameOf(h, e.entity);
      const swBg = on ? col : 'rgba(255,255,255,0.14)';
      const thumbL = on ? '22px' : '2px';
      const watt = (h && e.power_entity) ? numOf(h, e.power_entity) : null;
      const wattTxt = watt !== null ? fmtW(watt) : (e.power_entity ? '— W' : null);

      let autoBadge = '';
      if (e.automation) {
        const autoOn = h ? isOn(h, e.automation) : false;
        const aBg  = autoOn ? 'rgba(74,222,128,.13)'  : 'rgba(248,113,113,.13)';
        const aBdr = autoOn ? 'rgba(74,222,128,.38)'  : 'rgba(248,113,113,.38)';
        const aCol = autoOn ? '#4ade80'               : '#f87171';
        const aTxt = autoOn ? '🟢 Attiva'             : '🔴 Disattiva';
        autoBadge = `<button data-gp-auto="${i}" style="padding:3px 8px;border-radius:6px;border:1px solid ${aBdr};background:${aBg};color:${aCol};cursor:pointer;font-size:9px;font-weight:700;white-space:nowrap;outline:none">${aTxt}</button>`;
      }

      return `<div style="border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="display:flex;align-items:center;gap:12px;padding:11px 16px">
          <div style="width:36px;height:36px;border-radius:50%;background:${on?hex2rgba(col,.15):'rgba(255,255,255,.05)'};border:1px solid ${on?hex2rgba(col,.3):'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${on?col:'rgba(255,255,255,.4)'}">${iconHtml(_dynIcon(c.icon||'🔌', on), 18)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            <div style="font-size:11px;color:${on?col:'rgba(255,255,255,.45)'};margin-top:1px;font-weight:${on?600:400}">${on ? (wattTxt ? wattTxt : 'Accesa') : 'Spenta'}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
            <button data-gp-toggle="${i}" style="width:46px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;background:${swBg};transition:background .2s;outline:none">
              <div style="position:absolute;top:3px;left:${thumbL};width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:left .18s;pointer-events:none"></div>
            </button>
            ${autoBadge}
          </div>
        </div>
      </div>`;
    }).join('');

    const footer = totalW !== null ? `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-top:1px solid rgba(255,255,255,.06);margin-top:2px">
        <span style="font-size:11px;color:rgba(255,255,255,.45)">${active} pres${active===1?'a':'e'} accesa${active===1?'':'e'}</span>
        <span style="font-size:13px;font-weight:700;color:${col}">${fmtW(totalW)} totali</span>
      </div>` : '';

    return `<div id="gp-popup-body">
      ${ctrlBar}
      <div>${rows || '<div style="padding:32px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px">Nessuna presa configurata.<br><span style="font-size:10px;opacity:.6">Clicca ✏️ sulla chip per configurare.</span></div>'}</div>
      ${footer}
    </div>`;
  }

  /* ── mount ── */
  function _mountHandlers(cfg, el) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    if (el._gpHandler) el.removeEventListener('click', el._gpHandler);

    const col = c.color || '#fb923c';

    function handler(ev) {
      const tog = ev.target.closest('[data-gp-toggle]');
      if (tog) {
        const e = ents[parseInt(tog.dataset.gpToggle)]; if (!e) return;
        const on = isOn(H(), e.entity);
        tog.style.background = on ? 'rgba(255,255,255,0.14)' : col;
        const thumb = tog.querySelector('div');
        if (thumb) { thumb.style.transition = 'left .18s'; thumb.style.left = on ? '2px' : '22px'; }
        callSvc(e.entity.split('.')[0], on ? 'turn_off' : 'turn_on', e.entity);
        ev.stopPropagation(); return;
      }
      const auto = ev.target.closest('[data-gp-auto]');
      if (auto) {
        const e = ents[parseInt(auto.dataset.gpAuto)]; if (!e || !e.automation) return;
        const autoOn = isOn(H(), e.automation);
        auto.textContent = autoOn ? '🟢 Attiva' : '🔴 Disattiva';
        auto.style.color      = autoOn ? '#4ade80' : '#f87171';
        auto.style.borderColor= autoOn ? 'rgba(74,222,128,.38)' : 'rgba(248,113,113,.38)';
        auto.style.background = autoOn ? 'rgba(74,222,128,.13)' : 'rgba(248,113,113,.13)';
        callSvc('automation', autoOn ? 'turn_off' : 'turn_on', e.automation);
        ev.stopPropagation(); return;
      }
      const allBtn = ev.target.closest('[data-gp-all]');
      if (allBtn) {
        const svc = allBtn.dataset.gpAll === 'on' ? 'turn_on' : 'turn_off';
        ents.forEach(e => { if (e.entity) callSvc(e.entity.split('.')[0], svc, e.entity); });
        setTimeout(() => {
          if (!el.isConnected) return;
          el.innerHTML = render(cfg, null); _mountHandlers(cfg, el);
        }, 1000);
        ev.stopPropagation(); return;
      }
    }

    el._gpHandler = handler;
    el.addEventListener('click', handler);
  }

  function mount(cfg, rawHass, el) {
    _mountHandlers(cfg, el);

    function _syncTitle() {
      try {
        const hdr = el.previousElementSibling; if (!hdr) return;
        const textWrap = hdr.children?.[1]; if (!textWrap) return;
        const titleEl = textWrap.firstElementChild; if (!titleEl) return;
        const subEl = textWrap.children?.[1];
        if (subEl) subEl.style.display = 'none';
        const c = loadCfg(cfg);
        const ents = Array.isArray(c.entities) ? c.entities : [];
        const h = H();
        const active = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
        const col = c.color || '#fb923c';
        let totalW = null;
        if (h) {
          let sum = 0, hasPwr = false;
          ents.forEach(e => {
            if (e.power_entity && isOn(h, e.entity)) {
              const w = numOf(h, e.power_entity); if (w !== null) { sum += w; hasPwr = true; }
            }
          });
          if (hasPwr) totalW = sum;
        }
        titleEl.style.color = active > 0 ? col : '';
        titleEl.textContent = active === 0
          ? 'Tutte spente'
          : (totalW !== null
              ? `${active} acces${active===1?'a':'e'} · ${fmtW(totalW)}`
              : `${active} pres${active===1?'a':'e'} acces${active===1?'a':'e'}`);
      } catch(e) {}
    }

    setTimeout(_syncTitle, 0);

    if (el._gpPoll) return;
    el._gpPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gpPoll); delete el._gpPoll; return; }
      try {
        const h = H(); if (!h) return;
        el.innerHTML = render(cfg, h);
        _mountHandlers(cfg, el);
        _syncTitle();
      } catch(e) {}
    }, 1500);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, null); _mountHandlers(cfg, el); } catch(e) {}
  }

  /* ── configure ── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const ents = JSON.parse(JSON.stringify(Array.isArray(c.entities) ? c.entities : []));
    const h = H();
    let expandedFields = new Set(); // indici con campi extra espansi
    let _firstRender = true;

    let _acDrop = null;
    function _closeAc() { if (_acDrop) { try { _acDrop.remove(); } catch(e) {} _acDrop = null; } }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 220;
      const spaceBelow = window.innerHeight - rect.bottom - 6;
      const spaceAbove = rect.top - 6;
      const useAbove = spaceBelow < MAXH && spaceAbove > spaceBelow;
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(251,147,60,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;flex-shrink:0;filter:${m.on?'none':'grayscale(1) opacity(.4)'}">${m.icon||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.38);margin-top:1px">${eh(m.id)}${m.stateLabel?` · <span style="color:${m.on?'#fb923c':'rgba(255,255,255,.3)'}">${eh(m.stateLabel)}</span>`:''}</div>
          </div>
        </div>`;
        r.addEventListener('mouseover', () => { r.style.background = 'rgba(251,147,60,.08)'; });
        r.addEventListener('mouseout',  () => { r.style.background = 'transparent'; });
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id, m.name); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
      inp.focus();
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.addEventListener('input', () => {
        const q = (inp.value || '').toLowerCase().trim();
        if (!q) { _closeAc(); return; }
        _openAc(inp, filterFn(q).slice(0, 12), onPick);
      });
      inp.addEventListener('focus', () => {
        const q = (inp.value || '').toLowerCase().trim();
        if (q) _openAc(inp, filterFn(q).slice(0, 12), onPick);
      });
      inp.addEventListener('blur', () => setTimeout(_closeAc, 160));
    }

    // switch.* per prime, poi tutti
    function _switchMatches(q) {
      if (!h || !h.states) return [];
      const lq = q.toLowerCase();
      const icons = { switch:'🔌', light:'💡', automation:'🤖', sensor:'📡', binary_sensor:'🔵', fan:'💨', media_player:'📺', climate:'🌡️', cover:'🪟' };
      return Object.keys(h.states)
        .filter(id => nameOf(h, id).toLowerCase().includes(lq) || id.toLowerCase().includes(lq))
        .map(id => {
          const dom = id.split('.')[0];
          const on = isOn(h, id);
          return { id, name: nameOf(h, id), on, icon: icons[dom] || '📦', stateLabel: on ? 'Accesa/On' : 'Spenta/Off' };
        })
        .sort((a, b) => {
          const as = a.id.startsWith('switch.') ? 0 : 1;
          const bs = b.id.startsWith('switch.') ? 0 : 1;
          if (as !== bs) return as - bs;
          return a.name.localeCompare(b.name);
        });
    }

    function _sensorMatches(q) {
      if (!h || !h.states) return [];
      const lq = q.toLowerCase();
      return Object.keys(h.states)
        .filter(id => (id.startsWith('sensor.') || id.startsWith('input_number.')) && (id.includes(lq) || nameOf(h, id).toLowerCase().includes(lq)))
        .map(id => ({ id, name: nameOf(h, id), on: false, icon: '📡', stateLabel: (h.states[id].state || '—') + (h.states[id].attributes?.unit_of_measurement || '') }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    function _autoMatches(q) {
      if (!h || !h.states) return [];
      return Object.keys(h.states)
        .filter(id => id.startsWith('automation.') && (id.includes(q) || nameOf(h, id).toLowerCase().includes(q)))
        .map(id => ({ id, name: nameOf(h, id), icon: '🤖', on: false, stateLabel: '' }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() {
      _closeAc();
      try { document.body.removeChild(ov); } catch(e) {}
      document.removeEventListener('keydown', escFn);
    }
    function escFn(ev) { if (ev.key === 'Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    function renderForm() {
      const col = c.color || '#fb923c';

      const selRows = ents.map((e, i) => {
        const lbl = e.label || nameOf(h, e.entity);
        const on = h ? isOn(h, e.entity) : false;
        const hasPwr  = !!(e.power_entity  && e.power_entity.trim());
        const hasAuto = !!(e.automation    && e.automation.trim());
        const exp = expandedFields.has(i);

        const extraSection = exp ? `
          <div style="margin-top:6px;padding:8px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;gap:6px">
            <div>
              <div style="font-size:9px;color:rgba(255,255,255,.35);margin-bottom:3px">⚡ Sensore watt (opzionale)</div>
              ${hasPwr
                ? `<div style="display:flex;align-items:center;gap:6px">
                    <span style="flex:1;font-size:10px;color:rgba(255,255,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(e.power_entity)}</span>
                    <button data-rmpwr="${i}" style="font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.1);color:#f87171;cursor:pointer">✕</button>
                  </div>`
                : `<input data-pwr-idx="${i}" placeholder="🔍 Cerca sensor.xxx_power…" value="${eh(e.power_entity||'')}" style="width:100%;box-sizing:border-box;padding:6px 9px;border-radius:7px;border:1px solid rgba(251,147,60,.3);background:rgba(251,147,60,.06);color:#fff;font-size:11px;outline:none;font-family:inherit">`
              }
            </div>
            <div>
              <div style="font-size:9px;color:rgba(255,255,255,.35);margin-bottom:3px">🤖 Automazione (opzionale)</div>
              ${hasAuto
                ? `<div style="display:flex;align-items:center;gap:6px">
                    <span style="flex:1;font-size:10px;color:rgba(255,255,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(e.automation)}</span>
                    <button data-rmauto="${i}" style="font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.1);color:#f87171;cursor:pointer">✕</button>
                  </div>`
                : `<input data-auto-idx="${i}" placeholder="🔍 Cerca automazione…" value="${eh(e.automation||'')}" style="width:100%;box-sizing:border-box;padding:6px 9px;border-radius:7px;border:1px solid rgba(99,102,241,.3);background:rgba(99,102,241,.07);color:#fff;font-size:11px;outline:none;font-family:inherit">`
              }
            </div>
          </div>` : '';

        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid ${on?hex2rgba(col,.25):'rgba(255,255,255,.08)'};margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;flex-shrink:0;filter:${on?'none':'grayscale(1) opacity(.4)'}">🔌</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:rgba(255,255,255,.35)">${eh(e.entity)}</div>
            </div>
            <button data-expand="${i}" title="${exp?'Chiudi':'Watt / Automazione'}" style="width:26px;height:26px;border:none;border-radius:6px;background:${exp?hex2rgba(col,.18):'rgba(255,255,255,.07)'};color:${exp?col:'rgba(255,255,255,.4)'};cursor:pointer;font-size:12px;flex-shrink:0">${exp?'▲':'▾'}</button>
            <button data-del="${i}" style="width:26px;height:26px;border:none;border-radius:6px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
          </div>
          ${extraSection}
        </div>`;
      }).join('');

      const anim = _firstRender ? 'animation:gpCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(251,147,60,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes gpCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .gpcinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s} .gpcinp:focus{border-color:rgba(251,147,60,.5);background:rgba(251,147,60,.04)} .gpcinp::placeholder{color:rgba(255,255,255,.3)} #gpcfg-body::-webkit-scrollbar{display:none}</style>

        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(251,147,60,.13);border:1px solid rgba(251,147,60,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🔌</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Prese</div>
            <div style="font-size:10px;color:rgba(255,255,255,.38)">${ents.length} pres${ents.length===1?'a':'e'} selezionat${ents.length===1?'a':'e'}</div>
          </div>
          <button id="gpcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <div id="gpcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Nome chip</div><input id="gpcfg-label" class="gpcinp" placeholder="Prese" value="${eh(c.label||'Prese')}"></div>
            <div style="flex:0 0 56px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Icona</div><button id="gpcfg-icon-btn" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;outline:none;color:#fff">${iconHtml(c.icon||'🔌',22)}</button><input type="hidden" id="gpcfg-icon" value="${eh(c.icon||'🔌')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Colore</div><input type="color" id="gpcfg-color" value="${(c.color||'#fb923c').match(/^#[0-9a-f]{6}$/i)?c.color:'#fb923c'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>

          ${ents.length ? `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Prese selezionate (${ents.length}) <span style="font-size:8px;font-weight:400;opacity:.6">▾ = watt + automazione</span></div>
            <div>${selRows}</div>
          ` : ''}

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin:${ents.length?'12px':0} 0 6px">Aggiungi presa</div>
          <input id="gpcfg-add-entity" class="gpcinp" placeholder="🔍 Inizia a scrivere il nome della presa…" autocomplete="off">
          <div style="font-size:9px;color:rgba(255,255,255,.25);margin-top:5px">switch.* compaiono per prime · usa ▾ per aggiungere sensore watt e automazione</div>

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
      const prevBody = ov.querySelector('#gpcfg-body');
      const savedScroll = prevBody ? prevBody.scrollTop : 0;

      const curLabel = ov.querySelector('#gpcfg-label')?.value;
      const curIcon  = ov.querySelector('#gpcfg-icon')?.value;
      const curColor = ov.querySelector('#gpcfg-color')?.value;

      ov.innerHTML = renderForm();
      _firstRender = false;

      const nb = ov.querySelector('#gpcfg-body');
      if (nb && savedScroll > 0) nb.scrollTop = savedScroll;

      if (curLabel !== undefined) { const f = ov.querySelector('#gpcfg-label'); if (f) f.value = curLabel; }
      if (curIcon  !== undefined) {
        const f = ov.querySelector('#gpcfg-icon');    if (f) f.value = curIcon;
        const b = ov.querySelector('#gpcfg-icon-btn'); if (b) b.innerHTML = iconHtml(curIcon, 22);
      }
      if (curColor !== undefined) { const f = ov.querySelector('#gpcfg-color'); if (f) f.value = curColor; }

      ov.querySelector('#gpcfg-icon-btn')?.addEventListener('click', ev => {
        ev.stopPropagation();
        if (typeof openIconPicker === 'function') {
          openIconPicker(val => {
            const f = ov.querySelector('#gpcfg-icon');    if (f) f.value = val;
            const b = ov.querySelector('#gpcfg-icon-btn'); if (b) b.innerHTML = iconHtml(val, 22);
          });
          const _ipm = document.getElementById('ntf-icon-modal');
          if (_ipm) {
            _ipm.style.zIndex = '200000';
            const _ipmS = document.getElementById('ipm-search');
            if (_ipmS) _ipmS.addEventListener('focusout', function _rf() {
              const m = document.getElementById('ntf-icon-modal');
              if (!m || m.style.display === 'none') { _ipmS.removeEventListener('focusout', _rf); return; }
              setTimeout(() => { if (document.getElementById('ntf-icon-modal')?.style.display !== 'none') document.getElementById('ipm-search')?.focus(); }, 50);
            });
          }
        }
      });

      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);

      ov.querySelector('#gpcfg-close').onclick  = closeOv;
      ov.querySelector('#gpcfg-cancel').onclick = closeOv;

      // elimina presa
      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.del);
          ents.splice(i, 1); expandedFields.delete(i);
          // ricalcola indici nel Set
          const newExp = new Set();
          expandedFields.forEach(idx => { if (idx > i) newExp.add(idx - 1); else if (idx < i) newExp.add(idx); });
          expandedFields = newExp;
          attach();
        });
      });

      // toggle espansione (watt + auto)
      ov.querySelectorAll('[data-expand]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.expand);
          if (expandedFields.has(i)) expandedFields.delete(i); else expandedFields.add(i);
          attach();
        });
      });

      // rimuovi sensore watt
      ov.querySelectorAll('[data-rmpwr]').forEach(btn => {
        btn.addEventListener('click', () => { ents[parseInt(btn.dataset.rmpwr)].power_entity = ''; attach(); });
      });

      // rimuovi automazione
      ov.querySelectorAll('[data-rmauto]').forEach(btn => {
        btn.addEventListener('click', () => { ents[parseInt(btn.dataset.rmauto)].automation = ''; attach(); });
      });

      // autocomplete sensore watt
      ov.querySelectorAll('[data-pwr-idx]').forEach(inp => {
        const i = parseInt(inp.dataset.pwrIdx);
        _setupAc(inp, _sensorMatches, (id) => { ents[i].power_entity = id; inp.value = id; });
        inp.addEventListener('blur', () => {
          setTimeout(() => {
            const v = (inp.value || '').trim();
            if (v) ents[i].power_entity = v;
          }, 200);
        });
      });

      // autocomplete automazione
      ov.querySelectorAll('[data-auto-idx]').forEach(inp => {
        const i = parseInt(inp.dataset.autoIdx);
        _setupAc(inp, _autoMatches, (id) => { ents[i].automation = id; inp.value = id; });
        inp.addEventListener('blur', () => {
          setTimeout(() => {
            const v = (inp.value || '').trim();
            if (v) ents[i].automation = v;
          }, 200);
        });
      });

      // autocomplete aggiunta presa
      const addInp = ov.querySelector('#gpcfg-add-entity');
      if (addInp) {
        _setupAc(addInp, _switchMatches, (id, name) => {
          if (!ents.find(e => e.entity === id)) {
            ents.push({ entity: id, label: name || '', power_entity: '', automation: '' });
          }
          addInp.value = '';
          attach();
        });
      }

      // salva
      ov.querySelector('#gpcfg-save').addEventListener('click', () => {
        const newCfg = {
          label:  (ov.querySelector('#gpcfg-label')?.value || 'Prese').trim(),
          icon:   (ov.querySelector('#gpcfg-icon')?.value  || '🔌').trim(),
          color:  ov.querySelector('#gpcfg-color')?.value  || '#fb923c',
          entities: ents.filter(e => e.entity).map(e => ({
            entity:       e.entity.trim(),
            label:        e.label       || '',
            power_entity: e.power_entity || '',
            automation:   e.automation  || '',
          })),
        };
        closeOv();
        if (typeof onSave === 'function') onSave(newCfg);
      });
    }

    attach();
    document.body.appendChild(ov);
  }

  /* ── registrazione ── */
  const CARD = {
    id: ID, name: 'Gruppo Prese', icon: '🔌',
    desc: 'Chip con contatore prese accese e watt totali. Clic → pannello toggle + consumo real-time.',
    version: '1.0', isDistintivo: true,
    defaultCfg: { label: 'Prese', icon: '🔌', color: '#fb923c', entities: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-prese v1.0'); } catch(e) {}
})();
