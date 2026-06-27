/* frarik-version: 1.7 */
/**
 * GruppoLuci.js — Distintivo FratechStore v1.7
 * Fix: icona configurabile (preserve su re-render), sottotitolo popup nascosto
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
      <div style="display:flex;gap:8px;padding:4px 14px 8px">
        <button data-gl-all="on" style="flex:1;padding:7px;border-radius:8px;border:1px solid ${hex2rgba(col,.4)};background:${hex2rgba(col,.12)};color:${col};font-size:11px;font-weight:700;cursor:pointer">☀ Accendi tutte</button>
        <button data-gl-all="off" style="flex:1;padding:7px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(255,255,255,.6);font-size:11px;font-weight:700;cursor:pointer">⏻ Spegni tutte</button>
      </div>` : '';

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const on = h ? isOn(h, e.entity) : false;
      const lbl = e.label || nameOf(h, e.entity);
      const swBg = on ? col : 'rgba(255,255,255,0.14)';
      const thumbL = on ? '22px' : '2px';

      // badge automazione — sotto il toggle, senza nome, solo stato cliccabile
      let autoBadge = '';
      if (e.automation) {
        const autoOn = h ? isOn(h, e.automation) : false;
        const aBg  = autoOn ? 'rgba(74,222,128,.13)'  : 'rgba(248,113,113,.13)';
        const aBdr = autoOn ? 'rgba(74,222,128,.38)'  : 'rgba(248,113,113,.38)';
        const aCol = autoOn ? '#4ade80'               : '#f87171';
        const aTxt = autoOn ? '🟢 Attiva'             : '🔴 Disattiva';
        autoBadge = `<button data-jsd-auto="${i}" style="padding:3px 8px;border-radius:6px;border:1px solid ${aBdr};background:${aBg};color:${aCol};cursor:pointer;font-size:9px;font-weight:700;white-space:nowrap;outline:none">${aTxt}</button>`;
      }

      return `<div style="border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="display:flex;align-items:center;gap:12px;padding:11px 16px">
          <div style="width:36px;height:36px;border-radius:50%;background:${on?hex2rgba(col,.15):'rgba(255,255,255,.05)'};border:1px solid ${on?hex2rgba(col,.3):'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;filter:${on?'none':'grayscale(1) opacity(.4)'}">💡</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:${on?'#fff':'rgba(255,255,255,.6)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            <div style="font-size:11px;color:${on?col:'rgba(255,255,255,.3)'};margin-top:1px;font-weight:${on?600:400}">${on?'Accesa':'Spenta'}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
            <button data-jsd-toggle="${i}" style="width:46px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;background:${swBg};transition:background .2s;outline:none">
              <div style="position:absolute;top:3px;left:${thumbL};width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:left .18s;pointer-events:none"></div>
            </button>
            ${autoBadge}
          </div>
        </div>
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

    const col = loadCfg(cfg).color || '#fbbf24';

    function handler(ev) {
      const tog = ev.target.closest('[data-jsd-toggle]');
      if (tog) {
        const e = ents[parseInt(tog.dataset.jsdToggle)]; if (!e) return;
        const on = isOn(H(), e.entity);
        // ottimistico immediato: sposta toggle visivamente senza aspettare HA
        tog.style.background = on ? 'rgba(255,255,255,0.14)' : col;
        const thumb = tog.querySelector('div');
        if (thumb) { thumb.style.transition = 'left .18s'; thumb.style.left = on ? '2px' : '22px'; }
        callSvc(e.entity.split('.')[0], on ? 'turn_off' : 'turn_on', e.entity);
        // nessun re-render ritardato: il polling a 1.5s aggiorna lo stato reale
        // (evita il flicker causato dal re-render prima che HA abbia processato il comando)
        ev.stopPropagation(); return;
      }
      const auto = ev.target.closest('[data-jsd-auto]');
      if (auto) {
        const e = ents[parseInt(auto.dataset.jsdAuto)]; if (!e||!e.automation) return;
        const autoOn = isOn(H(), e.automation);
        // ottimistico immediato: cambia badge automazione
        const newCol = autoOn ? '#4ade80' : '#f87171';
        const newBdr = autoOn ? 'rgba(74,222,128,.38)' : 'rgba(248,113,113,.38)';
        const newBg  = autoOn ? 'rgba(74,222,128,.13)' : 'rgba(248,113,113,.13)';
        auto.textContent = autoOn ? '🟢 Attiva' : '🔴 Disattiva';
        auto.style.color = newCol; auto.style.borderColor = newBdr; auto.style.background = newBg;
        callSvc('automation', autoOn ? 'turn_off' : 'turn_on', e.automation);
        ev.stopPropagation(); return;
      }
      const allBtn = ev.target.closest('[data-gl-all]');
      if (allBtn) {
        const svc = allBtn.dataset.glAll === 'on' ? 'turn_on' : 'turn_off';
        ents.forEach(e => { if (e.entity) callSvc(e.entity.split('.')[0], svc, e.entity); });
        // "accendi/spegni tutte" → aspetta 1s per HA poi re-render
        setTimeout(() => {
          if (!el.isConnected) return;
          el.innerHTML = render(cfg, null); _mountHandlers(cfg, el);
        }, 1000);
        ev.stopPropagation(); return;
      }
    }

    el._glHandler = handler;
    el.addEventListener('click', handler);
  }

  function mount(cfg, rawHass, el) {
    _mountHandlers(cfg, el);

    // Aggiorna il titolo dell'header popup (el.previousElementSibling = hdr di _openJsdPopup)
    // struttura: panel > [hdr, body(=el)]; hdr > [iconDiv, textDiv, closeBtn]; textDiv > [titleEl, subEl]
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
        const col = c.color || '#fbbf24';
        titleEl.style.color = active > 0 ? col : '';
        titleEl.textContent = active === 1 ? '1 luce accesa' : `${active} luci accese`;
      } catch(e) {}
    }

    _syncTitle();

    // Polling real-time ogni 1.5s — avvia solo una volta (check _glPoll)
    if (el._glPoll) return;
    el._glPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._glPoll); delete el._glPoll; return; }
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

    /* ---- autocomplete singleton ---- */
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
      // posizione: sopra se non c'è spazio sotto
      const pos = useAbove
        ? `bottom:${window.innerHeight - rect.top + 4}px`
        : `top:${rect.bottom + 4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(251,191,36,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        const stColor = m.on ? '#fbbf24' : 'rgba(255,255,255,.3)';
        const stLabel = m.stateLabel || '';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;flex-shrink:0;filter:${m.on?'none':'grayscale(1) opacity(.4)'}">${m.icon||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.38);margin-top:1px">${eh(m.id)}${stLabel?` · <span style="color:${stColor}">${eh(stLabel)}</span>`:''}</div>
          </div>
        </div>`;
        r.addEventListener('mouseover', () => { r.style.background='rgba(251,191,36,.08)'; });
        r.addEventListener('mouseout',  () => { r.style.background='transparent'; });
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id, m.name); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
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

    // Tutte le entità HA (no filtri di dominio) — light.* per prime
    function _entityMatches(q) {
      if (!h||!h.states) return [];
      const lq = q.toLowerCase();
      return Object.keys(h.states)
        .filter(id => nameOf(h,id).toLowerCase().includes(lq) || id.toLowerCase().includes(lq))
        .map(id => {
          const dom = id.split('.')[0];
          const on = isOn(h, id);
          const icons = { light:'💡', switch:'🔌', automation:'🤖', sensor:'📡', binary_sensor:'🔵', cover:'🪟', climate:'🌡️', media_player:'📺', fan:'💨' };
          return { id, name: nameOf(h,id), on, icon: icons[dom]||'📦', stateLabel: on?'Accesa/On':'Spenta/Off' };
        })
        .sort((a,b) => {
          // light.* per prime, poi alfabetico
          const al = a.id.startsWith('light.') ? 0 : 1;
          const bl = b.id.startsWith('light.') ? 0 : 1;
          if (al!==bl) return al-bl;
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

      const anim = _firstRender ? 'animation:glCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(251,191,36,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes glCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .glcinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s} .glcinp:focus{border-color:rgba(251,191,36,.5);background:rgba(251,191,36,.04)} .glcinp::placeholder{color:rgba(255,255,255,.3)} #glcfg-body::-webkit-scrollbar{display:none}</style>

        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(251,191,36,.13);border:1px solid rgba(251,191,36,.28);display:flex;align-items:center;justify-content:center;font-size:18px">💡</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Luci</div>
            <div style="font-size:10px;color:rgba(255,255,255,.38)">${ents.length} entit${ents.length===1?'à':'à'} selezionate</div>
          </div>
          <button id="glcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <div id="glcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Nome chip</div><input id="glcfg-label" class="glcinp" placeholder="Luci" value="${eh(c.label||'Luci')}"></div>
            <div style="flex:0 0 56px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Icona</div><input id="glcfg-icon" class="glcinp" placeholder="💡" value="${eh(c.icon||'💡')}" style="text-align:center;font-size:15px;padding:6px 4px"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Colore</div><input type="color" id="glcfg-color" value="${(c.color||'#fbbf24').match(/^#[0-9a-f]{6}$/i)?c.color:'#fbbf24'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>

          ${ents.length ? `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Entità selezionate (${ents.length})</div>
            <div>${selRows}</div>
          ` : ''}

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin:${ents.length?'12px':0} 0 6px">Aggiungi entità</div>
          <input id="glcfg-add-entity" class="glcinp" placeholder="🔍 Inizia a scrivere il nome dell'entità…" autocomplete="off">
          <div style="font-size:9px;color:rgba(255,255,255,.25);margin-top:5px">Mostra tutte le entità — light.* compaiono per prime</div>

          <div style="height:16px"></div>
        </div>

        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="glcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#fbbf24;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="glcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    /* ---- attach ---- */
    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#glcfg-body');
      const savedBody = prevBody ? prevBody.scrollTop : 0;

      // salva i valori correnti dei campi chip prima del re-render (evita reset se l'utente stava modificando)
      const curLabel = ov.querySelector('#glcfg-label')?.value;
      const curIcon  = ov.querySelector('#glcfg-icon')?.value;
      const curColor = ov.querySelector('#glcfg-color')?.value;

      ov.innerHTML = renderForm();
      _firstRender = false;

      // ripristina scroll del body — sincrono: funziona subito dopo innerHTML
      const nb = ov.querySelector('#glcfg-body');
      if (nb && savedBody > 0) nb.scrollTop = savedBody;

      // ripristina valori che l'utente stava modificando
      if (curLabel !== undefined) { const f = ov.querySelector('#glcfg-label'); if (f) f.value = curLabel; }
      if (curIcon  !== undefined) { const f = ov.querySelector('#glcfg-icon');  if (f) f.value = curIcon; }
      if (curColor !== undefined) { const f = ov.querySelector('#glcfg-color'); if (f) f.value = curColor; }

      // seleziona tutto al focus per facilitare la sostituzione dell'icona
      ov.querySelector('#glcfg-icon')?.addEventListener('focus', e => e.target.select());

      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);

      ov.querySelector('#glcfg-close').onclick = closeOv;
      ov.querySelector('#glcfg-cancel').onclick = closeOv;

      // rimuovi entità selezionata
      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.del);
          ents.splice(i, 1); expandedAuto.delete(i); attach();
        });
      });

      // automazione: apri input
      ov.querySelectorAll('[data-addauto]').forEach(btn => {
        btn.addEventListener('click', () => {
          expandedAuto.add(parseInt(btn.dataset.addauto)); attach();
          setTimeout(() => { const inp = ov.querySelector(`[data-auto-idx="${btn.dataset.addauto}"]`); if (inp) inp.focus(); }, 40);
        });
      });

      // automazione: salva
      ov.querySelectorAll('[data-saveauto]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.saveauto);
          const inp = ov.querySelector(`[data-auto-idx="${i}"]`);
          if (inp) ents[i].automation = inp.value.trim();
          expandedAuto.delete(i); attach();
        });
      });

      // automazione: rimuovi
      ov.querySelectorAll('[data-rmauto]').forEach(btn => {
        btn.addEventListener('click', () => { ents[parseInt(btn.dataset.rmauto)].automation = ''; attach(); });
      });

      // autocomplete automazioni
      ov.querySelectorAll('[data-auto-idx]').forEach(inp => {
        const i = parseInt(inp.dataset.autoIdx);
        _setupAc(inp, _autoMatches, id => { ents[i].automation = id; inp.value = id; });
      });

      // autocomplete aggiunta entità — tutte le entità HA
      const addInp = ov.querySelector('#glcfg-add-entity');
      if (addInp) {
        _setupAc(addInp, _entityMatches, (id, name) => {
          if (!ents.find(e => e.entity === id)) {
            ents.push({ entity: id, label: name || '', automation: '' });
          }
          addInp.value = '';
          attach(); // aggiorna lista selezionati senza scroll reset (body.scrollTop = 0 qui è corretto)
        });
      }

      // salva config
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
    version: '1.7', isDistintivo: true,
    defaultCfg: { label: 'Luci', icon: '💡', color: '#fbbf24', entities: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-luci v1.3'); } catch(e){}
})();
