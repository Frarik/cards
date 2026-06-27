/* frarik-version: 1.1 */
/**
 * GruppoTapparelle.js — Distintivo FratechStore v1.1
 * Chip contatore tapparelle aperte + popup con Apri/Stop/Chiudi + posizione + automazione opzionale
 */
(function () {
  'use strict';

  const ID = 'gruppo-tapparelle';
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
  function coverPos(h, id) {
    const s = h && h.states && h.states[id];
    const p = s && s.attributes && s.attributes.current_position;
    return (p !== undefined && p !== null) ? Math.round(p) : null;
  }
  function coverStateLbl(st) {
    switch (st) {
      case 'open':    return 'Aperta';
      case 'closed':  return 'Chiusa';
      case 'opening': return 'In apertura…';
      case 'closing': return 'In chiusura…';
      default:        return '—';
    }
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
    sz = sz || 16;
    if (typeof ico === 'string' && ico.startsWith('mdi:'))
      return `<span class="mdi mdi-${ico.slice(4)}" style="font-size:${sz}px;line-height:1;color:inherit"></span>`;
    return `<span style="font-size:${sz}px;line-height:1">${ico||'📦'}</span>`;
  }
  function _dynIcon(ico, isOpen) {
    const P = {
      'mdi:blinds':['mdi:blinds-open','mdi:blinds'],
      'mdi:blinds-open':['mdi:blinds-open','mdi:blinds'],
      'mdi:roller-shade':['mdi:roller-shade-open','mdi:roller-shade'],
      'mdi:roller-shade-open':['mdi:roller-shade-open','mdi:roller-shade'],
      'mdi:window-shutter':['mdi:window-shutter-open','mdi:window-shutter'],
      'mdi:window-shutter-open':['mdi:window-shutter-open','mdi:window-shutter'],
    };
    const pair = P[ico];
    if (pair) return isOpen ? pair[0] : pair[1];
    return isOpen ? 'mdi:blinds-open' : 'mdi:blinds';
  }

  /* ── chip ── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const active = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
    const col = c.color || '#38bdf8';
    const anyOpen = active > 0;
    return {
      icon: iconHtml(_dynIcon(c.icon||'mdi:blinds', anyOpen)),
      label: c.label || 'Tapparelle',
      value: ents.length ? `${active}/${ents.length}` : '—',
      color: active > 0 ? col : 'rgba(255,255,255,0.32)',
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
    const col = c.color || '#38bdf8';

    const ctrlBar = ents.length ? `
      <div style="display:flex;gap:8px;padding:4px 14px 8px">
        <button data-gt-all="open" style="flex:1;padding:7px;border-radius:8px;border:1px solid ${hex2rgba(col,.4)};background:${hex2rgba(col,.12)};color:${col};font-size:11px;font-weight:700;cursor:pointer">↑ Apri tutte</button>
        <button data-gt-all="close" style="flex:1;padding:7px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(255,255,255,.6);font-size:11px;font-weight:700;cursor:pointer">↓ Chiudi tutte</button>
      </div>` : '';

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const st = h ? stateOf(h, e.entity).toLowerCase() : 'unknown';
      const on = ON_STATES.includes(st);
      const moving = st === 'opening' || st === 'closing';
      const lbl = e.label || nameOf(h, e.entity);
      const pos = h ? coverPos(h, e.entity) : null;
      const stLbl = coverStateLbl(st);
      const stCol = on ? col : moving ? '#fbbf24' : 'rgba(255,255,255,.5)';

      const posBar = pos !== null ? `
        <div style="display:flex;align-items:center;gap:6px;margin-top:5px">
          <div style="flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden">
            <div style="height:100%;width:${pos}%;background:${col};border-radius:2px;transition:width .4s"></div>
          </div>
          <span style="font-size:9px;color:rgba(255,255,255,.3);flex-shrink:0">${pos}%</span>
        </div>` : '';

      let autoBadge = '';
      if (e.automation) {
        const autoOn = h ? isOn(h, e.automation) : false;
        const aBg  = autoOn ? 'rgba(74,222,128,.13)'  : 'rgba(248,113,113,.13)';
        const aBdr = autoOn ? 'rgba(74,222,128,.38)'  : 'rgba(248,113,113,.38)';
        const aCol = autoOn ? '#4ade80'               : '#f87171';
        const aTxt = autoOn ? '🟢 Attiva'             : '🔴 Disattiva';
        autoBadge = `<button data-gt-auto="${i}" style="padding:3px 8px;border-radius:6px;border:1px solid ${aBdr};background:${aBg};color:${aCol};cursor:pointer;font-size:9px;font-weight:700;white-space:nowrap;outline:none">${aTxt}</button>`;
      }

      const btnBase = 'width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:700;outline:none;flex-shrink:0';
      const ctrlBtns = `
        <button data-gt-open="${i}" title="Apri" style="${btnBase};background:${hex2rgba(col,.15)};color:${col};border:1px solid ${hex2rgba(col,.3)}">↑</button>
        <button data-gt-stop="${i}" title="Stop" style="${btnBase};background:rgba(255,255,255,.07);color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.15)">■</button>
        <button data-gt-close="${i}" title="Chiudi" style="${btnBase};background:rgba(255,255,255,.07);color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.15)">↓</button>`;

      return `<div style="border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="display:flex;align-items:center;gap:12px;padding:11px 16px">
          <div style="width:36px;height:36px;border-radius:50%;background:${on?hex2rgba(col,.15):'rgba(255,255,255,.05)'};border:1px solid ${on?hex2rgba(col,.3):'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${on||moving?col:'rgba(255,255,255,.4)'}">${iconHtml(_dynIcon(c.icon||'mdi:blinds',on||moving),18)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            <div style="font-size:11px;color:${stCol};margin-top:1px;font-weight:${on||moving?600:400}">${stLbl}</div>
            ${posBar}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
            <div style="display:flex;gap:4px">${ctrlBtns}</div>
            ${autoBadge}
          </div>
        </div>
      </div>`;
    }).join('');

    return `<div id="gt-popup-body">
      ${ctrlBar}
      <div>${rows||'<div style="padding:32px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px">Nessuna tapparella configurata.<br><span style="font-size:10px;opacity:.6">Clicca ✏️ sulla chip per configurare.</span></div>'}</div>
    </div>`;
  }

  /* ── mount + handlers ── */
  function _mountHandlers(cfg, el) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    if (el._gtHandler) el.removeEventListener('click', el._gtHandler);

    function handler(ev) {
      const openBtn = ev.target.closest('[data-gt-open]');
      if (openBtn) {
        const e = ents[parseInt(openBtn.dataset.gtOpen)]; if (!e) return;
        callSvc('cover', 'open_cover', e.entity);
        ev.stopPropagation(); return;
      }
      const stopBtn = ev.target.closest('[data-gt-stop]');
      if (stopBtn) {
        const e = ents[parseInt(stopBtn.dataset.gtStop)]; if (!e) return;
        callSvc('cover', 'stop_cover', e.entity);
        ev.stopPropagation(); return;
      }
      const closeBtn = ev.target.closest('[data-gt-close]');
      if (closeBtn) {
        const e = ents[parseInt(closeBtn.dataset.gtClose)]; if (!e) return;
        callSvc('cover', 'close_cover', e.entity);
        ev.stopPropagation(); return;
      }
      const auto = ev.target.closest('[data-gt-auto]');
      if (auto) {
        const e = ents[parseInt(auto.dataset.gtAuto)]; if (!e||!e.automation) return;
        const autoOn = isOn(H(), e.automation);
        const newCol = autoOn ? '#4ade80' : '#f87171';
        const newBdr = autoOn ? 'rgba(74,222,128,.38)' : 'rgba(248,113,113,.38)';
        const newBg  = autoOn ? 'rgba(74,222,128,.13)' : 'rgba(248,113,113,.13)';
        auto.textContent = autoOn ? '🟢 Attiva' : '🔴 Disattiva';
        auto.style.color = newCol; auto.style.borderColor = newBdr; auto.style.background = newBg;
        callSvc('automation', autoOn ? 'turn_off' : 'turn_on', e.automation);
        ev.stopPropagation(); return;
      }
      const allBtn = ev.target.closest('[data-gt-all]');
      if (allBtn) {
        const svc = allBtn.dataset.gtAll === 'open' ? 'open_cover' : 'close_cover';
        ents.forEach(e => { if (e.entity) callSvc('cover', svc, e.entity); });
        setTimeout(() => {
          if (!el.isConnected) return;
          el.innerHTML = render(cfg, null); _mountHandlers(cfg, el);
        }, 1000);
        ev.stopPropagation(); return;
      }
    }

    el._gtHandler = handler;
    el.addEventListener('click', handler);
  }

  function mount(cfg, rawHass, el) {
    _mountHandlers(cfg, el);

    // Aggiorna il titolo dell'header popup (el.previousElementSibling = hdr di _openJsdPopup)
    function _syncTitle() {
      try {
        const hdr = el.previousElementSibling; if (!hdr) return;
        const textWrap = hdr.children?.[1]; if (!textWrap) return;
        const titleEl = textWrap.firstElementChild; if (!titleEl) return;
        // nasconde il sottotitolo (def.desc) nel popup
        const subEl = textWrap.children?.[1];
        if (subEl) subEl.style.display = 'none';
        const c = loadCfg(cfg);
        const ents = Array.isArray(c.entities) ? c.entities : [];
        const h = H();
        const active = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
        const col = c.color || '#38bdf8';
        titleEl.style.color = active > 0 ? col : '';
        titleEl.textContent = active === 1 ? '1 tapparella aperta' : `${active} tapparelle aperte`;
      } catch(e) {}
    }

    setTimeout(_syncTitle, 0);

    if (el._gtPoll) return;
    el._gtPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gtPoll); delete el._gtPoll; return; }
      try {
        const h = H(); if (!h) return;
        el.innerHTML = render(cfg, h);
        _mountHandlers(cfg, el);
        _syncTitle();
      } catch(e) {}
    }, 1500);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, null); _mountHandlers(cfg, el); } catch(e){}
  }

  /* ── configure ── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
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
      const pos = useAbove
        ? `bottom:${window.innerHeight - rect.top + 4}px`
        : `top:${rect.bottom + 4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(56,189,248,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        const stColor = m.on ? '#38bdf8' : 'rgba(255,255,255,.3)';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;flex-shrink:0;filter:${m.on?'none':'grayscale(1) opacity(.4)'}">${m.icon||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.38);margin-top:1px">${eh(m.id)}${m.stateLabel?` · <span style="color:${stColor}">${eh(m.stateLabel)}</span>`:''}</div>
          </div>
        </div>`;
        r.addEventListener('mouseover', () => { r.style.background='rgba(56,189,248,.08)'; });
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

    // Tutte le entità HA — cover.* per prime
    function _entityMatches(q) {
      if (!h||!h.states) return [];
      const lq = q.toLowerCase();
      return Object.keys(h.states)
        .filter(id => nameOf(h,id).toLowerCase().includes(lq) || id.toLowerCase().includes(lq))
        .map(id => {
          const dom = id.split('.')[0];
          const on = isOn(h, id);
          const st = stateOf(h, id).toLowerCase();
          const icons = { light:'💡', switch:'🔌', automation:'🤖', sensor:'📡', binary_sensor:'🔵', cover:'🪟', climate:'🌡️', media_player:'📺', fan:'💨' };
          const stLabel = dom === 'cover' ? coverStateLbl(st) : stateOf(h, id);
          return { id, name: nameOf(h,id), on, icon: icons[dom]||'📦', stateLabel: stLabel };
        })
        .sort((a,b) => {
          const ac = a.id.startsWith('cover.') ? 0 : 1;
          const bc = b.id.startsWith('cover.') ? 0 : 1;
          if (ac!==bc) return ac-bc;
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

    function closeOv() {
      _closeAc();
      try { document.body.removeChild(ov); } catch(e){}
      document.removeEventListener('keydown', escFn);
    }
    function escFn(ev) { if (ev.key==='Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    function renderForm() {
      const col = c.color || '#38bdf8';

      const selRows = ents.map((e, i) => {
        const lbl = e.label || nameOf(h, e.entity);
        const on = h ? isOn(h, e.entity) : false;
        const hasAuto = !!(e.automation && e.automation.trim());
        const autoExpanded = expandedAuto.has(i);
        const autoSection = hasAuto
          ? `<div style="display:flex;align-items:center;gap:6px;margin-top:5px;padding:5px 7px;border-radius:7px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.22)">
              <span style="font-size:10px;opacity:.5">🤖</span>
              <span style="flex:1;font-size:10px;color:rgba(255,255,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(e.automation)}</span>
              <button data-rmauto="${i}" style="font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.1);color:#f87171;cursor:pointer">✕</button>
            </div>`
          : autoExpanded
            ? `<div style="display:flex;gap:5px;margin-top:5px">
                <input data-auto-idx="${i}" placeholder="🔍 Cerca automazione…" value="${eh(e.automation||'')}" style="flex:1;padding:6px 9px;border-radius:7px;border:1px solid rgba(99,102,241,.35);background:rgba(99,102,241,.08);color:#fff;font-size:11px;outline:none;font-family:inherit">
                <button data-saveauto="${i}" style="padding:6px 10px;border-radius:7px;border:none;background:#6366f1;color:#fff;cursor:pointer;font-size:11px;font-weight:700">OK</button>
              </div>`
            : `<button data-addauto="${i}" style="margin-top:4px;font-size:9px;padding:3px 8px;border-radius:5px;border:1px dashed rgba(255,255,255,.2);background:transparent;color:rgba(255,255,255,.4);cursor:pointer">🤖 + Automazione (opz.)</button>`;

        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid ${on?hex2rgba(col,.25):'rgba(255,255,255,.08)'};margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;flex-shrink:0;filter:${on?'none':'grayscale(1) opacity(.4)'}">🪟</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:rgba(255,255,255,.35)">${eh(e.entity)}</div>
            </div>
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
          </div>
          ${autoSection}
        </div>`;
      }).join('');

      const anim = _firstRender ? 'animation:gtCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(56,189,248,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes gtCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .gtcinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s} .gtcinp:focus{border-color:rgba(56,189,248,.5);background:rgba(56,189,248,.04)} .gtcinp::placeholder{color:rgba(255,255,255,.3)} #gtcfg-body::-webkit-scrollbar{display:none}</style>

        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(56,189,248,.13);border:1px solid rgba(56,189,248,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🪟</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Tapparelle</div>
            <div style="font-size:10px;color:rgba(255,255,255,.38)">${ents.length} entit${ents.length===1?'à':'à'} selezionate</div>
          </div>
          <button id="gtcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <div id="gtcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Nome chip</div><input id="gtcfg-label" class="gtcinp" placeholder="Tapparelle" value="${eh(c.label||'Tapparelle')}"></div>
            <div style="flex:0 0 56px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Icona</div><button id="gtcfg-icon-btn" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;outline:none;color:#fff">${iconHtml(c.icon||'mdi:blinds',22)}</button><input type="hidden" id="gtcfg-icon" value="${eh(c.icon||'mdi:blinds')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Colore</div><input type="color" id="gtcfg-color" value="${(c.color||'#38bdf8').match(/^#[0-9a-f]{6}$/i)?c.color:'#38bdf8'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>

          ${ents.length ? `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Entità selezionate (${ents.length})</div>
            <div>${selRows}</div>
          ` : ''}

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin:${ents.length?'12px':0} 0 6px">Aggiungi entità</div>
          <input id="gtcfg-add-entity" class="gtcinp" placeholder="🔍 Inizia a scrivere il nome dell'entità…" autocomplete="off">
          <div style="font-size:9px;color:rgba(255,255,255,.25);margin-top:5px">Mostra tutte le entità — cover.* compaiono per prime</div>

          <div style="height:16px"></div>
        </div>

        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gtcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#38bdf8;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gtcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#gtcfg-body');
      const savedBody = prevBody ? prevBody.scrollTop : 0;

      // salva i valori correnti dei campi chip prima del re-render
      const curLabel = ov.querySelector('#gtcfg-label')?.value;
      const curIcon  = ov.querySelector('#gtcfg-icon')?.value;
      const curColor = ov.querySelector('#gtcfg-color')?.value;

      ov.innerHTML = renderForm();
      _firstRender = false;

      const nb = ov.querySelector('#gtcfg-body');
      if (nb && savedBody > 0) nb.scrollTop = savedBody;

      // ripristina valori che l'utente stava modificando
      if (curLabel !== undefined) { const f = ov.querySelector('#gtcfg-label'); if (f) f.value = curLabel; }
      if (curIcon  !== undefined) {
        const f = ov.querySelector('#gtcfg-icon'); if (f) f.value = curIcon;
        const b = ov.querySelector('#gtcfg-icon-btn'); if (b) b.innerHTML = iconHtml(curIcon, 22);
      }
      if (curColor !== undefined) { const f = ov.querySelector('#gtcfg-color'); if (f) f.value = curColor; }

      // click sull'icona → apre il picker HA (emoji + MDI)
      ov.querySelector('#gtcfg-icon-btn')?.addEventListener('click', ev => {
        ev.stopPropagation();
        if (typeof openIconPicker === 'function') {
          openIconPicker(val => {
            const f = ov.querySelector('#gtcfg-icon'); if (f) f.value = val;
            const b = ov.querySelector('#gtcfg-icon-btn'); if (b) b.innerHTML = iconHtml(val, 22);
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

      ov.querySelector('#gtcfg-close').onclick = closeOv;
      ov.querySelector('#gtcfg-cancel').onclick = closeOv;

      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.del);
          ents.splice(i, 1); expandedAuto.delete(i); attach();
        });
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

      const addInp = ov.querySelector('#gtcfg-add-entity');
      if (addInp) {
        _setupAc(addInp, _entityMatches, (id, name) => {
          if (!ents.find(e => e.entity === id)) {
            ents.push({ entity: id, label: name || '', automation: '' });
          }
          addInp.value = '';
          attach();
        });
      }

      ov.querySelector('#gtcfg-save').addEventListener('click', () => {
        const newCfg = {
          label: (ov.querySelector('#gtcfg-label')?.value || 'Tapparelle').trim(),
          icon:  (ov.querySelector('#gtcfg-icon')?.value  || 'mdi:blinds').trim(),
          color: ov.querySelector('#gtcfg-color')?.value  || '#38bdf8',
          entities: ents.filter(e => e.entity).map(e => ({
            entity: e.entity.trim(), label: e.label||'', automation: e.automation||'',
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
    id: ID, name: 'Gruppo Tapparelle', icon: '🪟',
    desc: 'Chip con contatore tapparelle aperte. Clic → pannello Apri/Stop/Chiudi + posizione.',
    version: '1.1', isDistintivo: true,
    defaultCfg: { label: 'Tapparelle', icon: 'mdi:blinds', color: '#38bdf8', entities: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-tapparelle v1.0'); } catch(e){}
})();
