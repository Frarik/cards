/* frarik-version: 2.2 */
/**
 * GruppoFinestre.js — Distintivo FratechStore v2.2
 * Chip contatore finestre aperte + popup con sommario, finestra bianca SVG animata, tempo da/fa
 */
(function () {
  'use strict';

  const ID = 'gruppo-finestre';
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
    sz = sz || 16;
    if (typeof ico === 'string' && ico.startsWith('mdi:'))
      return `<span class="mdi mdi-${ico.slice(4)}" style="font-size:${sz}px;line-height:1;color:inherit"></span>`;
    return `<span style="font-size:${sz}px;line-height:1">${ico||'📦'}</span>`;
  }
  function _dynIcon(ico, isOpen) {
    const P = {
      '🪟':['mdi:window-open','mdi:window'],
      'mdi:window':['mdi:window-open','mdi:window'],
      'mdi:window-open':['mdi:window-open','mdi:window'],
      'mdi:window-closed':['mdi:window-open','mdi:window-closed'],
      'mdi:window-closed-variant':['mdi:window-open','mdi:window-closed-variant'],
      'mdi:window-shutter':['mdi:window-shutter-open','mdi:window-shutter'],
      'mdi:window-shutter-open':['mdi:window-shutter-open','mdi:window-shutter'],
    };
    const pair = P[ico];
    if (pair) return isOpen ? pair[0] : pair[1];
    return ico || (isOpen ? 'mdi:window-open' : 'mdi:window');
  }

  function _windowSvg(isOpen, idx) {
    if (!isOpen) {
      return `<svg viewBox="0 0 60 60" width="60" height="60" style="display:block">
        <rect x="0" y="56" width="60" height="4" rx="2" fill="rgba(255,255,255,.35)"/>
        <rect x="3" y="3" width="54" height="54" rx="3" fill="rgba(0,0,0,.22)"/>
        <rect x="2" y="2" width="54" height="54" rx="3" fill="#f0f0f4" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/>
        <rect x="5" y="5" width="23" height="42" rx="1" fill="rgba(140,200,248,.35)"/>
        <rect x="32" y="5" width="23" height="42" rx="1" fill="rgba(140,200,248,.35)"/>
        <rect x="28" y="4" width="5" height="44" rx="2" fill="#f0f0f4"/>
        <rect x="4" y="4" width="53" height="5" rx="2" fill="#f0f0f4"/>
        <rect x="4" y="48" width="53" height="5" rx="2" fill="#f0f0f4"/>
        <line x1="8" y1="9" x2="15" y2="16" stroke="rgba(255,255,255,.65)" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="35" y1="9" x2="42" y2="16" stroke="rgba(255,255,255,.65)" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="30" cy="49" r="4" fill="#c4c8d0" stroke="#a8acb4" stroke-width=".8"/>
        <circle cx="30" cy="49" r="1.8" fill="#e4e6ec"/>
      </svg>`;
    }
    const sid = `gfbrz${idx}`;
    return `<style>@keyframes ${sid}{0%,100%{opacity:.38}50%{opacity:.85}}</style>
      <svg viewBox="0 0 60 60" width="60" height="60" style="display:block;overflow:visible">
        <rect x="0" y="56" width="60" height="4" rx="2" fill="rgba(255,255,255,.35)"/>
        <rect x="2" y="2" width="54" height="54" rx="3" fill="#f0f0f4" stroke="rgba(248,113,113,.45)" stroke-width="1.5"/>
        <rect x="4" y="4" width="53" height="5" rx="2" fill="#f0f0f4"/>
        <rect x="4" y="48" width="53" height="5" rx="2" fill="#f0f0f4"/>
        <rect x="28" y="4" width="5" height="44" rx="2" fill="#f0f0f4"/>
        <rect x="32" y="5" width="23" height="42" rx="1" fill="rgba(140,200,248,.35)"/>
        <line x1="35" y1="9" x2="42" y2="16" stroke="rgba(255,255,255,.65)" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="5" y="5" width="22" height="42" rx="1" fill="rgba(140,210,255,.2)" style="animation:${sid} 2s ease-in-out infinite"/>
        <polygon points="27,5 14,7 14,51 27,53" fill="#f0f0f4" stroke="rgba(0,0,0,.07)" stroke-width="1"/>
        <polygon points="14,7 10,8 10,50 14,51" fill="#d8d8dc"/>
        <polygon points="25,7 15,9 15,49 25,51" fill="rgba(140,200,248,.35)"/>
        <line x1="16" y1="12" x2="21" y2="17" stroke="rgba(255,255,255,.65)" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="30" cy="49" r="4" fill="#c4c8d0" stroke="#a8acb4" stroke-width=".8"/>
        <circle cx="30" cy="49" r="1.8" fill="#e4e6ec"/>
      </svg>`;
  }

  function _timeAgo(isoStr) {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    if (diff < 60000) return 'adesso';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + ' min';
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    if (hrs < 24) return rem > 0 ? hrs + 'h ' + rem + 'min' : hrs + 'h';
    return Math.floor(hrs / 24) + 'g';
  }

  /* ── chip ── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const active = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
    const col = c.color || '#34d399';
    const anyOpen = active > 0;
    return {
      icon: iconHtml(_dynIcon(c.icon||'🪟', anyOpen)),
      label: c.label || 'Finestre',
      value: ents.length ? `${active}/${ents.length}` : '—',
      color: (window.FratechColorRules && window.FratechColorRules.evalColor(cfg, h)) || (active > 0 ? col : '#fff'),
    };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const ids = ents.map(e => e.entity).filter(Boolean);
    ents.forEach(e => { if (e.automation) ids.push(e.automation); });
    return ids;
  }

  /* ── render popup ── */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const col = c.color || '#34d399';

    const openCount   = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
    const closedCount = ents.length - openCount;

    let summary = '';
    if (ents.length) {
      if (openCount === 0) {
        summary = `<div style="padding:10px 16px 6px">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.22)">
            <span style="font-size:14px">🔒</span>
            <span style="font-size:12px;font-weight:700;color:#4ade80">Tutte chiuse</span>
          </div>
        </div>`;
      } else {
        summary = `<div style="display:flex;gap:7px;padding:10px 16px 6px;flex-wrap:wrap">
          <div style="display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:20px;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.28)">
            <span style="font-size:11px">🔓</span>
            <span style="font-size:12px;font-weight:700;color:#f87171">${openCount} ${openCount===1?'aperta':'aperte'}</span>
          </div>
          ${closedCount ? `<div style="display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:20px;background:rgba(74,222,128,.09);border:1px solid rgba(74,222,128,.2)">
            <span style="font-size:12px;font-weight:700;color:#4ade80">✓ ${closedCount} ${closedCount===1?'chiusa':'chiuse'}</span>
          </div>` : ''}
        </div>`;
      }
    }

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const on    = h ? isOn(h, e.entity) : false;
      const lbl   = e.label || nameOf(h, e.entity);
      const stLbl = on ? 'Aperta' : 'Chiusa';
      const stCol = on ? '#f87171' : '#4ade80';
      const stBg  = on ? 'rgba(248,113,113,.14)' : 'rgba(74,222,128,.12)';
      const stBdr = on ? 'rgba(248,113,113,.32)' : 'rgba(74,222,128,.28)';
      const lastChanged = h?.states?.[e.entity]?.last_changed;
      const timeStr   = h && lastChanged ? _timeAgo(lastChanged) : '';
      const timeLabel = on
        ? (timeStr === 'adesso' ? 'Appena aperta' : `Aperta da ${timeStr}`)
        : (timeStr ? `Chiusa da ${timeStr}` : '');
      const timeColor = on ? 'rgba(248,113,113,.75)' : 'rgba(255,255,255,.42)';

      let autoBadge = '';
      if (e.automation) {
        const autoOn = h ? isOn(h, e.automation) : false;
        const aBg  = autoOn ? 'rgba(74,222,128,.13)'  : 'rgba(248,113,113,.13)';
        const aBdr = autoOn ? 'rgba(74,222,128,.38)'  : 'rgba(248,113,113,.38)';
        const aCol = autoOn ? '#4ade80'               : '#f87171';
        const aTxt = autoOn ? '🟢 Attiva'             : '🔴 Disattiva';
        autoBadge = `<button data-gf-auto="${i}" style="margin-top:5px;padding:3px 9px;border-radius:6px;border:1px solid ${aBdr};background:${aBg};color:${aCol};cursor:pointer;font-size:9px;font-weight:700;white-space:nowrap;outline:none">${aTxt}</button>`;
      }

      return `<div style="border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px">
          <div style="flex-shrink:0">${_windowSvg(on, i)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            ${timeLabel ? `<div style="font-size:10px;color:${timeColor};margin-top:2px">${eh(timeLabel)}</div>` : ''}
            ${autoBadge}
          </div>
          <div style="padding:4px 12px;border-radius:20px;background:${stBg};border:1px solid ${stBdr};font-size:11px;font-weight:700;color:${stCol};white-space:nowrap;flex-shrink:0">${stLbl}</div>
        </div>
      </div>`;
    }).join('');

    return `<div id="gf-popup-body">
      ${summary}
      <div>${rows||'<div style="padding:32px 20px;text-align:center;color:#fff;font-size:12px">Nessuna finestra configurata.<br><span style="font-size:10px;">Clicca ✏️ sulla chip per configurare.</span></div>'}</div>
    </div>`;
  }

  /* ── mount + handlers ── */
  function _mountHandlers(cfg, el) {
    const ents = Array.isArray(loadCfg(cfg).entities) ? loadCfg(cfg).entities : [];
    if (el._gfHandler) el.removeEventListener('click', el._gfHandler);

    function handler(ev) {
      const auto = ev.target.closest('[data-gf-auto]');
      if (auto) {
        const e = ents[parseInt(auto.dataset.gfAuto)]; if (!e||!e.automation) return;
        const autoOn = isOn(H(), e.automation);
        const nextOn = !autoOn;
        const newCol = nextOn ? '#4ade80' : '#f87171';
        const newBdr = nextOn ? 'rgba(74,222,128,.38)' : 'rgba(248,113,113,.38)';
        const newBg  = nextOn ? 'rgba(74,222,128,.13)' : 'rgba(248,113,113,.13)';
        auto.textContent = nextOn ? '🟢 Attiva' : '🔴 Disattiva';
        auto.style.color = newCol; auto.style.borderColor = newBdr; auto.style.background = newBg;
        callSvc('automation', autoOn ? 'turn_off' : 'turn_on', e.automation);
        ev.stopPropagation(); return;
      }
    }

    el._gfHandler = handler;
    el.addEventListener('click', handler);
  }

  function mount(cfg, rawHass, el) {
    _mountHandlers(cfg, el);

    function _syncTitle() {
      try {
        const hdr = el.previousElementSibling; if (!hdr) return;
        const textWrap = hdr.children?.[1]; if (!textWrap) return;
        const titleEl = textWrap.firstElementChild; if (!titleEl) return;
        const subEl = textWrap.children?.[1]; if (subEl) subEl.style.display = 'none';
        const c = loadCfg(cfg);
        const ents = Array.isArray(c.entities) ? c.entities : [];
        const h = H();
        const active = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
        const col = c.color || '#34d399';
        titleEl.style.color = active > 0 ? col : '';
        titleEl.textContent = active === 1 ? '1 finestra aperta' : `${active} finestre aperte`;
      } catch(e) {}
    }

    setTimeout(_syncTitle, 0);

    if (el._gfPoll) return;
    el._gfPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gfPoll); delete el._gfPoll; return; }
      try {
        const h = H(); if (!h) return;
        const _sp=el.parentElement, _st=_sp?_sp.scrollTop:0;
        el.innerHTML = render(cfg, h);
        _mountHandlers(cfg, el);
        _syncTitle();
        if(_sp&&_st>0) _sp.scrollTop=_st;
      } catch(e) {}
    }, 1500);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, null); _mountHandlers(cfg, el); } catch(e){}
  }

  /* ── configure ── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    let colorCfg = { mode: c.colorMode||'auto', fixed: c.colorFixed||c.color||'#34d399', rules: Array.isArray(c.colorRules)?JSON.parse(JSON.stringify(c.colorRules)):[] };
    const ents = JSON.parse(JSON.stringify(Array.isArray(c.entities) ? c.entities : []));
    const h = H();
    let expandedAuto = new Set();
    let _firstRender = true;

    let _acDrop = null;
    function _closeAc() { if (_acDrop) { try { _acDrop.remove(); } catch(e){} _acDrop = null; } }

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
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(52,211,153,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin;scrollbar-color:#fff transparent`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        const stColor = m.on ? '#34d399' : '#fff';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;flex-shrink:0;filter:${m.on?'none':'grayscale(1) opacity(.4)'}">${m.icon||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:#fff;margin-top:1px">${eh(m.id)}${m.stateLabel?` · <span style="color:${stColor}">${eh(m.stateLabel)}</span>`:''}</div>
          </div>
        </div>`;
        r.addEventListener('mouseover', () => { r.style.background='rgba(52,211,153,.08)'; });
        r.addEventListener('mouseout',  () => { r.style.background='transparent'; });
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id, m.name); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
      inp.focus();
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.addEventListener('input', () => {
        const q = (inp.value||'').toLowerCase().trim();
        if (!q) { _closeAc(); return; }
        _openAc(inp, filterFn(q).slice(0,12), onPick);
      });
      inp.addEventListener('focus', () => {
        const q = (inp.value||'').toLowerCase().trim();
        if (q) _openAc(inp, filterFn(q).slice(0,12), onPick);
      });
      inp.addEventListener('blur', () => setTimeout(_closeAc, 160));
    }

    // Tutte le entità HA — binary_sensor.* per prime
    function _entityMatches(q) {
      if (!h||!h.states) return [];
      const lq = q.toLowerCase();
      return Object.keys(h.states)
        .filter(id => nameOf(h,id).toLowerCase().includes(lq) || id.toLowerCase().includes(lq))
        .map(id => {
          const dom = id.split('.')[0];
          const on = isOn(h, id);
          const icons = { light:'💡', switch:'🔌', automation:'🤖', sensor:'📡', binary_sensor:'🪟', cover:'🪟', climate:'🌡️', media_player:'📺', fan:'💨' };
          return { id, name: nameOf(h,id), on, icon: icons[dom]||'📦', stateLabel: on ? 'Aperta' : 'Chiusa' };
        })
        .sort((a,b) => {
          const ab = a.id.startsWith('binary_sensor.') ? 0 : 1;
          const bb = b.id.startsWith('binary_sensor.') ? 0 : 1;
          if (ab!==bb) return ab-bb;
          return a.name.localeCompare(b.name);
        });
    }

    function _autoMatches(q) {
      if (!h||!h.states) return [];
      return Object.keys(h.states)
        .filter(id => id.startsWith('automation.') && (id.includes(q) || nameOf(h,id).toLowerCase().includes(q)))
        .map(id => ({ id, name: nameOf(h,id), icon:'🤖', on:false, stateLabel:'' }))
        .sort((a,b) => a.name.localeCompare(b.name));
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch(e){} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key==='Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    function renderForm() {
      const col = c.color || '#34d399';

      const selRows = ents.map((e, i) => {
        const lbl = e.label || nameOf(h, e.entity);
        const on = h ? isOn(h, e.entity) : false;
        const hasAuto = !!(e.automation && e.automation.trim());
        const autoExpanded = expandedAuto.has(i);
        const autoSection = hasAuto
          ? `<div style="display:flex;align-items:center;gap:6px;margin-top:5px;padding:5px 7px;border-radius:7px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.22)">
              <span style="font-size:10px;">🤖</span>
              <span style="flex:1;font-size:10px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(e.automation)}</span>
              <button data-rmauto="${i}" style="font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.1);color:#f87171;cursor:pointer">✕</button>
            </div>`
          : autoExpanded
            ? `<div style="display:flex;gap:5px;margin-top:5px">
                <input data-auto-idx="${i}" placeholder="🔍 Cerca automazione…" value="${eh(e.automation||'')}" style="flex:1;padding:6px 9px;border-radius:7px;border:1px solid rgba(56,189,248,.35);background:rgba(56,189,248,.08);color:#fff;font-size:11px;outline:none;font-family:inherit">
                <button data-saveauto="${i}" style="padding:6px 10px;border-radius:7px;border:none;background:#38bdf8;color:#fff;cursor:pointer;font-size:11px;font-weight:700">OK</button>
              </div>`
            : `<button data-addauto="${i}" style="margin-top:4px;font-size:9px;padding:3px 8px;border-radius:5px;border:1px dashed rgba(255,255,255,.2);background:transparent;color:#fff;cursor:pointer">🤖 + Automazione (opz.)</button>`;

        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid ${on?hex2rgba(col,.25):'rgba(255,255,255,.08)'};margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;flex-shrink:0;filter:${on?'none':'grayscale(1) opacity(.4)'}">🪟</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:#fff">${eh(e.entity)}</div>
            </div>
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
          </div>
          ${autoSection}
        </div>`;
      }).join('');

      const anim = _firstRender ? 'animation:gfCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes gfCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .gfcinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s} .gfcinp:focus{border-color:rgba(255,255,255,.35);background:rgba(255,255,255,.08)} .gfcinp::placeholder{color:rgba(255,255,255,.55)} #gfcfg-body::-webkit-scrollbar{display:none}</style>

        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(52,211,153,.13);border:1px solid rgba(52,211,153,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🪟</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Finestre</div>
            <div style="font-size:10px;color:#fff">${ents.length} entit${ents.length===1?'à':'à'} selezionate</div>
          </div>
          <button id="gfcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <div id="gfcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:#fff;margin-bottom:3px">Nome chip</div><input id="gfcfg-label" class="gfcinp" placeholder="Finestre" value="${eh(c.label||'Finestre')}"></div>
            <div style="flex:0 0 56px"><div style="font-size:9px;color:#fff;margin-bottom:3px">Icona</div><button id="gfcfg-icon-btn" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;outline:none;color:#fff">${iconHtml(c.icon||'🪟',22)}</button><input type="hidden" id="gfcfg-icon" value="${eh(c.icon||'🪟')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:#fff;margin-bottom:3px">Colore</div><input type="color" id="gfcfg-color" value="${(c.color||'#34d399').match(/^#[0-9a-f]{6}$/i)?c.color:'#34d399'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>

          ${ents.length ? `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px">Entità selezionate (${ents.length})</div>
            <div>${selRows}</div>
          ` : ''}

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin:${ents.length?'12px':0} 0 6px">Aggiungi entità</div>
          <input id="gfcfg-add-entity" class="gfcinp" placeholder="🔍 Inizia a scrivere il nome dell'entità…" autocomplete="off">
          <div style="font-size:9px;color:#fff;margin-top:5px">Mostra tutte le entità — binary_sensor.* compaiono per prime</div>
          ${window.FratechColorRules ? window.FratechColorRules.html(colorCfg) : ''}
          <div style="height:16px"></div>
        </div>

        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gfcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#38bdf8;color:#fff;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gfcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#gfcfg-body');
      const savedBody = prevBody ? prevBody.scrollTop : 0;
      const curLabel = ov.querySelector('#gfcfg-label')?.value;
      const curIcon  = ov.querySelector('#gfcfg-icon')?.value;
      const curColor = ov.querySelector('#gfcfg-color')?.value;

      ov.innerHTML = renderForm();
      _firstRender = false;
      const _fcr = window.FratechColorRules;
      if (_fcr) _fcr.attach(ov.querySelector('#fcr-section'), () => { colorCfg = _fcr.read(ov.querySelector('#fcr-section')) || colorCfg; });

      const nb = ov.querySelector('#gfcfg-body');
      if (nb && savedBody > 0) nb.scrollTop = savedBody;

      if (curLabel !== undefined) { const f = ov.querySelector('#gfcfg-label'); if (f) f.value = curLabel; }
      if (curIcon  !== undefined) {
        const f = ov.querySelector('#gfcfg-icon'); if (f) f.value = curIcon;
        const b = ov.querySelector('#gfcfg-icon-btn'); if (b) b.innerHTML = iconHtml(curIcon, 22);
      }
      if (curColor !== undefined) { const f = ov.querySelector('#gfcfg-color'); if (f) f.value = curColor; }

      ov.querySelector('#gfcfg-icon-btn')?.addEventListener('click', ev => {
        ev.stopPropagation();
        if (typeof openIconPicker === 'function') {
          openIconPicker(val => {
            const f = ov.querySelector('#gfcfg-icon'); if (f) f.value = val;
            const b = ov.querySelector('#gfcfg-icon-btn'); if (b) b.innerHTML = iconHtml(val, 22);
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

      ov.querySelector('#gfcfg-close').onclick = closeOv;
      ov.querySelector('#gfcfg-cancel').onclick = closeOv;

      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => { const i = parseInt(btn.dataset.del); ents.splice(i, 1); expandedAuto.delete(i); attach(); });
      });
      ov.querySelectorAll('[data-addauto]').forEach(btn => {
        btn.addEventListener('click', () => {
          expandedAuto.add(parseInt(btn.dataset.addauto)); attach();
          setTimeout(() => { const inp = ov.querySelector(`[data-auto-idx="${btn.dataset.addauto}"]`); if (inp) inp.focus(); }, 40);
        });
      });
      ov.querySelectorAll('[data-saveauto]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.saveauto);
          const inp = ov.querySelector(`[data-auto-idx="${i}"]`);
          if (inp) ents[i].automation = inp.value.trim();
          expandedAuto.delete(i); attach();
        });
      });
      ov.querySelectorAll('[data-rmauto]').forEach(btn => {
        btn.addEventListener('click', () => { ents[parseInt(btn.dataset.rmauto)].automation = ''; attach(); });
      });
      ov.querySelectorAll('[data-auto-idx]').forEach(inp => {
        const i = parseInt(inp.dataset.autoIdx);
        _setupAc(inp, _autoMatches, id => { ents[i].automation = id; inp.value = id; });
      });

      const addInp = ov.querySelector('#gfcfg-add-entity');
      if (addInp) {
        _setupAc(addInp, _entityMatches, (id, name) => {
          if (!ents.find(e => e.entity === id)) ents.push({ entity: id, label: name||'', automation: '' });
          addInp.value = ''; attach();
        });
      }

      ov.querySelector('#gfcfg-save').addEventListener('click', () => {
        const _fcrData = _fcr ? (_fcr.read(ov.querySelector('#fcr-section')) || {}) : {};
        const newCfg = {
          ..._fcrData,
          label: (ov.querySelector('#gfcfg-label')?.value || 'Finestre').trim(),
          icon:  (ov.querySelector('#gfcfg-icon')?.value  || '🪟').trim(),
          color: ov.querySelector('#gfcfg-color')?.value  || '#34d399',
          entities: ents.filter(e => e.entity).map(e => ({ entity: e.entity.trim(), label: e.label||'', automation: e.automation||'' })),
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
    id: ID, name: 'Gruppo Finestre', icon: '🪟',
    desc: 'Chip con contatore finestre aperte. Clic → stato Aperta/Chiusa per ogni finestra.',
    version: '2.2', isDistintivo: true,
    defaultCfg: { label: 'Finestre', icon: '🪟', color: '#34d399', entities: [], colorMode: 'auto', colorRules: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-finestre v2.2'); } catch(e){}
})();
