/* frarik-version: 1.3 */
/**
 * GruppoLuci.js — Distintivo FratechStore v1.3
 * Fix: animazione no-repeat, chip/render usa H() live, polling 2s nel popup, listener unico
 */
(function () {
  'use strict';

  const ID = 'gruppo-luci';
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
  // Usa sempre H() per dati live; fallback al parametro passato solo se H() non disponibile
  function liveH(rawHass) { return H() || (rawHass && rawHass.states ? rawHass : null); }

  /* ── chip — usa H() live ── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const active = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
    const col = c.color || '#fbbf24';
    return {
      icon: c.icon || '💡',
      label: c.label || 'Luci',
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

  /* ── render popup — usa H() live ── */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const col = c.color || '#fbbf24';
    const active = h ? ents.filter(e => isOn(h, e.entity)).length : 0;

    const ctrlBar = ents.length ? `
      <div style="display:flex;gap:8px;padding:10px 14px 4px">
        <button data-gl-all="on" style="flex:1;padding:7px;border-radius:8px;border:1px solid ${hex2rgba(col,.4)};background:${hex2rgba(col,.12)};color:${col};font-size:11px;font-weight:700;cursor:pointer">☀ Accendi tutte</button>
        <button data-gl-all="off" style="flex:1;padding:7px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(255,255,255,.6);font-size:11px;font-weight:700;cursor:pointer">⏻ Spegni tutte</button>
      </div>
      <div style="padding:4px 14px 8px;font-size:11px;font-weight:600;color:${active>0?col:'rgba(255,255,255,.35)'}">
        ${active} / ${ents.length} ${active===1?'luce accesa':'luci accese'}
      </div>` : '';

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const on = h ? isOn(h, e.entity) : false;
      const lbl = e.label || nameOf(h, e.entity);
      const swBg = on ? col : 'rgba(255,255,255,0.14)';
      const thumbL = on ? '22px' : '2px';
      let autoRow = '';
      if (e.automation) {
        const autoOn = h ? isOn(h, e.automation) : false;
        autoRow = `<div style="display:flex;align-items:center;gap:8px;padding:4px 16px 10px 60px">
          <span style="font-size:10px;opacity:.4">🤖</span>
          <span style="flex:1;font-size:10px;color:rgba(255,255,255,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(nameOf(h, e.automation))}</span>
          <button data-jsd-auto="${i}" style="padding:3px 10px;border-radius:6px;border:1px solid ${autoOn?hex2rgba(col,.4):'rgba(255,255,255,.15)'};background:${autoOn?hex2rgba(col,.15):'transparent'};color:${autoOn?col:'#64748b'};cursor:pointer;font-size:10px;font-weight:600">${autoOn?'Disattiva':'Attiva'}</button>
        </div>`;
      }
      return `<div style="border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="display:flex;align-items:center;gap:12px;padding:11px 16px">
          <div style="width:36px;height:36px;border-radius:50%;background:${on?hex2rgba(col,.15):'rgba(255,255,255,.05)'};border:1px solid ${on?hex2rgba(col,.3):'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;filter:${on?'none':'grayscale(1) opacity(.4)'}">💡</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:${on?'#fff':'rgba(255,255,255,.6)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            <div style="font-size:11px;color:${on?col:'rgba(255,255,255,.3)'};margin-top:1px;font-weight:${on?600:400}">${on?'Accesa':'Spenta'}</div>
          </div>
          <button data-jsd-toggle="${i}" style="width:46px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;background:${swBg};transition:background .2s;flex-shrink:0;outline:none">
            <div style="position:absolute;top:3px;left:${thumbL};width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:left .18s;pointer-events:none"></div>
          </button>
        </div>${autoRow}
      </div>`;
    }).join('');

    return `<div id="gl-popup-body">
      ${ctrlBar}
      <div>${rows||'<div style="padding:32px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px">Nessuna luce configurata.<br><span style="font-size:10px;opacity:.6">Clicca ✏️ sulla chip per configurare.</span></div>'}</div>
    </div>`;
  }

  /* ── mount: listener unico + polling 2s real-time ── */
  function _mountHandlers(cfg, el) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    // rimuovi listener precedente (evita accumulo su ogni update)
    if (el._glHandler) el.removeEventListener('click', el._glHandler);

    function handler(ev) {
      const tog = ev.target.closest('[data-jsd-toggle]');
      if (tog) {
        const e = ents[parseInt(tog.dataset.jsdToggle)]; if (!e) return;
        callSvc(e.entity.split('.')[0], isOn(H(), e.entity) ? 'turn_off' : 'turn_on', e.entity);
        setTimeout(() => {
          if (!el.isConnected) return;
          el.innerHTML = render(cfg, null);
          _mountHandlers(cfg, el);
        }, 1200);
        ev.stopPropagation(); return;
      }
      const auto = ev.target.closest('[data-jsd-auto]');
      if (auto) {
        const e = ents[parseInt(auto.dataset.jsdAuto)]; if (!e||!e.automation) return;
        callSvc('automation', isOn(H(), e.automation) ? 'turn_off' : 'turn_on', e.automation);
        setTimeout(() => {
          if (!el.isConnected) return;
          el.innerHTML = render(cfg, null);
          _mountHandlers(cfg, el);
        }, 1200);
        ev.stopPropagation(); return;
      }
      const allBtn = ev.target.closest('[data-gl-all]');
      if (allBtn) {
        const svc = allBtn.dataset.glAll === 'on' ? 'turn_on' : 'turn_off';
        ents.forEach(e => { if (e.entity) callSvc(e.entity.split('.')[0], svc, e.entity); });
        setTimeout(() => {
          if (!el.isConnected) return;
          el.innerHTML = render(cfg, null);
          _mountHandlers(cfg, el);
        }, 1200);
        ev.stopPropagation(); return;
      }
    }

    el._glHandler = handler;
    el.addEventListener('click', handler);
  }

  function mount(cfg, rawHass, el) {
    _mountHandlers(cfg, el);

    // Polling real-time ogni 2s — avvia solo una volta (check _glPoll)
    if (el._glPoll) return;
    el._glPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._glPoll); delete el._glPoll; return; }
      try {
        const h = H(); if (!h) return;
        el.innerHTML = render(cfg, h);
        _mountHandlers(cfg, el);
      } catch(e) {}
    }, 2000);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, null); _mountHandlers(cfg, el); } catch(e){}
  }

  /* ── configure ── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const ents = JSON.parse(JSON.stringify(Array.isArray(c.entities) ? c.entities : []));
    const h = H();
    let filterQ = '';
    let expandedAuto = new Set();
    let _firstRender = true; // animazione solo al primo render

    /* ---- autocomplete singleton ---- */
    let _acDrop = null;
    function _closeAc() { if (_acDrop) { try { _acDrop.remove(); } catch(e){} _acDrop = null; } }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      _acDrop = document.createElement('div');
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.bottom+3}px;width:${rect.width}px;max-height:180px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(251,191,36,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.85);scrollbar-width:thin`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div><div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:1px">${eh(m.id)}</div>`;
        r.addEventListener('mouseover', () => { r.style.background='rgba(251,191,36,.1)'; });
        r.addEventListener('mouseout',  () => { r.style.background='transparent'; });
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.addEventListener('input', () => {
        const q = (inp.value||'').toLowerCase();
        if (!q) { _closeAc(); return; }
        _openAc(inp, filterFn(q).slice(0,9), onPick);
      });
      inp.addEventListener('focus', () => {
        const q = (inp.value||'').toLowerCase();
        if (q) _openAc(inp, filterFn(q).slice(0,9), onPick);
      });
      inp.addEventListener('blur', () => setTimeout(_closeAc, 160));
    }

    function _autoMatches(q) {
      if (!h||!h.states) return [];
      return Object.keys(h.states)
        .filter(id => id.startsWith('automation.') && (id.includes(q) || nameOf(h,id).toLowerCase().includes(q)))
        .map(id => ({ id, name: nameOf(h,id) }))
        .sort((a,b) => a.name.localeCompare(b.name));
    }

    function getLights() {
      if (!h||!h.states) return [];
      return Object.keys(h.states)
        .filter(id => {
          if (!id.startsWith('light.')) return false;
          const n = nameOf(h, id).toLowerCase();
          // mostra solo entità il cui nome o entity_id contiene "luce"/"luci"
          return n.includes('luce') || n.includes('luci') || id.includes('luce') || id.includes('luci');
        })
        .map(id => ({ id, name: nameOf(h,id), on: isOn(h,id) }))
        .sort((a,b) => a.name.localeCompare(b.name));
    }
    const allLights = getLights();

    /* ---- overlay ---- */
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() {
      _closeAc();
      try { document.body.removeChild(ov); } catch(e){}
      document.removeEventListener('keydown', escFn);
    }
    function escFn(ev) { if (ev.key==='Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    /* ---- renderForm ---- */
    function renderForm() {
      const col = c.color || '#fbbf24';
      const selIds = new Set(ents.map(e => e.entity));
      const filtered = filterQ
        ? allLights.filter(l => l.name.toLowerCase().includes(filterQ.toLowerCase()) || l.id.includes(filterQ.toLowerCase()))
        : allLights;

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
                <input data-auto-idx="${i}" placeholder="🔍 automation.xxx" value="${eh(e.automation||'')}" style="flex:1;padding:6px 9px;border-radius:7px;border:1px solid rgba(99,102,241,.35);background:rgba(99,102,241,.08);color:#fff;font-size:11px;outline:none;font-family:inherit">
                <button data-saveauto="${i}" style="padding:6px 10px;border-radius:7px;border:none;background:#6366f1;color:#fff;cursor:pointer;font-size:11px;font-weight:700">OK</button>
              </div>`
            : `<button data-addauto="${i}" style="margin-top:4px;font-size:9px;padding:3px 8px;border-radius:5px;border:1px dashed rgba(255,255,255,.2);background:transparent;color:rgba(255,255,255,.4);cursor:pointer">🤖 + Automazione (opz.)</button>`;

        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid ${on?hex2rgba(col,.25):'rgba(255,255,255,.08)'};margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;flex-shrink:0;filter:${on?'none':'grayscale(1) opacity(.4)'}">💡</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:rgba(255,255,255,.35)">${eh(e.entity)}</div>
            </div>
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
          </div>
          ${autoSection}
        </div>`;
      }).join('');

      const lightRows = filtered.map(l => {
        const sel = selIds.has(l.id);
        return `<label data-light-id="${eh(l.id)}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:${sel?hex2rgba(col,.08):'rgba(255,255,255,.02)'};border:1px solid ${sel?hex2rgba(col,.3):'rgba(255,255,255,.06)'};cursor:pointer;margin-bottom:3px">
          <div style="width:28px;height:28px;border-radius:50%;background:${l.on?hex2rgba(col,.15):'rgba(255,255,255,.05)'};border:1px solid ${l.on?hex2rgba(col,.35):'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;filter:${l.on?'none':'grayscale(1) opacity(.4)'}">💡</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(l.name)}</div>
            <div style="font-size:10px;color:${l.on?col:'rgba(255,255,255,.3)'}">${l.on?'Accesa':'Spenta'}</div>
          </div>
          <div style="width:18px;height:18px;border-radius:4px;border:2px solid ${sel?col:'rgba(255,255,255,.3)'};background:${sel?col:'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#000;font-weight:900">${sel?'✓':''}</div>
        </label>`;
      }).join('') || `<div style="padding:20px;text-align:center;color:rgba(255,255,255,.3);font-size:11px">Nessuna luce trovata</div>`;

      // animazione glCfgUp solo al primissimo render — poi no, altrimenti sembra "chiudi/riapri"
      const anim = _firstRender ? 'animation:glCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(251,191,36,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes glCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .glcinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s} .glcinp:focus{border-color:rgba(251,191,36,.5);background:rgba(251,191,36,.04)} .glcinp::placeholder{color:rgba(255,255,255,.3)}</style>

        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(251,191,36,.13);border:1px solid rgba(251,191,36,.28);display:flex;align-items:center;justify-content:center;font-size:18px">💡</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Luci</div>
            <div style="font-size:10px;color:rgba(255,255,255,.38)">${ents.length} luc${ents.length===1?'e':'i'} selezionate</div>
          </div>
          <button id="glcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <div id="glcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;padding:14px 14px 4px">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Nome chip</div><input id="glcfg-label" class="glcinp" placeholder="Luci" value="${eh(c.label||'Luci')}"></div>
            <div style="flex:0 0 56px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Icona</div><input id="glcfg-icon" class="glcinp" placeholder="💡" value="${eh(c.icon||'💡')}" style="text-align:center;font-size:15px;padding:6px 4px"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Colore</div><input type="color" id="glcfg-color" value="${(c.color||'#fbbf24').match(/^#[0-9a-f]{6}$/i)?c.color:'#fbbf24'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>

          ${ents.length ? `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Luci selezionate (${ents.length})</div>
            <div id="glcfg-sel">${selRows}</div>
          ` : ''}

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin:${ents.length?'12px':0} 0 6px">Luci disponibili (${allLights.length})</div>
          <input id="glcfg-search" class="glcinp" placeholder="🔍 Cerca luce…" value="${eh(filterQ)}" style="margin-bottom:7px">
          <div id="glcfg-list" style="border-radius:10px;border:1px solid rgba(255,255,255,.07);padding:6px;background:rgba(0,0,0,.25);max-height:260px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent">${lightRows}</div>
          <div style="height:14px"></div>
        </div>

        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="glcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#fbbf24;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="glcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    /* ---- attach (scroll preservation su body + list interno) ---- */
    function attach() {
      _closeAc();
      // salva scroll di ENTRAMBI i contenitori prima di distruggere il DOM
      const prevBody = ov.querySelector('#glcfg-body');
      const savedBody = prevBody ? prevBody.scrollTop : 0;
      const prevList = ov.querySelector('#glcfg-list');
      const savedList = prevList ? prevList.scrollTop : 0;

      ov.innerHTML = renderForm();
      _firstRender = false;

      // ripristina dopo il layout — rAF garantisce che il DOM sia misurato
      requestAnimationFrame(() => {
        const nb = ov.querySelector('#glcfg-body');
        if (nb && savedBody > 0) nb.scrollTop = savedBody;
        const nl = ov.querySelector('#glcfg-list');
        if (nl && savedList > 0) nl.scrollTop = savedList;
      });

      /* ---- listener unico su ov per backdrop ---- */
      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);

      ov.querySelector('#glcfg-close').onclick = closeOv;
      ov.querySelector('#glcfg-cancel').onclick = closeOv;

      const srch = ov.querySelector('#glcfg-search');
      if (srch) srch.addEventListener('input', () => { filterQ = srch.value; attach(); });

      ov.querySelectorAll('[data-light-id]').forEach(lbl => {
        lbl.addEventListener('click', ev => {
          ev.preventDefault();
          ev.stopPropagation();
          const lid = lbl.dataset.lightId;
          const idx = ents.findIndex(e => e.entity === lid);
          if (idx >= 0) { ents.splice(idx, 1); expandedAuto.delete(idx); }
          else ents.push({ entity: lid, label: '', automation: '' });
          attach();
        });
      });

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

      ov.querySelector('#glcfg-save').addEventListener('click', () => {
        const newCfg = {
          label: (ov.querySelector('#glcfg-label')?.value || 'Luci').trim(),
          icon:  (ov.querySelector('#glcfg-icon')?.value  || '💡').trim(),
          color: ov.querySelector('#glcfg-color')?.value  || '#fbbf24',
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
    id: ID, name: 'Gruppo Luci', icon: '💡',
    desc: 'Chip con contatore luci accese. Clic → pannello toggle + Accendi/Spegni tutte.',
    version: '1.3', isDistintivo: true,
    defaultCfg: { label: 'Luci', icon: '💡', color: '#fbbf24', entities: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-luci v1.3'); } catch(e){}
})();
