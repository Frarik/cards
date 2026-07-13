/* frarik-version: 1.1 */
/**
 * GruppoPresenza.js — Distintivo FratechStore v1.1
 * Chip contatore sensori presenza/movimento attivi + popup con dettaglio e SVG animato
 */
(function () {
  'use strict';

  const ID = 'gruppo-presenza';
  const ON_STATES = ['on','home','present','detected','active','motion'];

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
    return `<span style="font-size:${sz}px;line-height:1">${ico||'🚶'}</span>`;
  }

  function _presenceSvg(isOn, idx) {
    const s = `gpS${idx}`;

    if (!isOn) {
      return `<svg viewBox="0 0 56 80" width="42" height="60" style="display:block;overflow:visible">
        <defs>
          <linearGradient id="${s}hg" x1="30%" y1="20%" x2="70%" y2="80%">
            <stop offset="0%" stop-color="rgba(148,163,184,.5)"/>
            <stop offset="100%" stop-color="rgba(71,85,105,.25)"/>
          </linearGradient>
        </defs>
        <!-- ombra -->
        <ellipse cx="28" cy="72" rx="13" ry="2.5" fill="rgba(255,255,255,.05)"/>
        <!-- testa -->
        <circle cx="28" cy="11" r="7.5" fill="url(#${s}hg)" stroke="rgba(148,163,184,.4)" stroke-width="1.3"/>
        <circle cx="25.5" cy="9.5" r="1.8" fill="rgba(148,163,184,.2)"/>
        <!-- collo -->
        <rect x="25.5" y="18" width="5" height="4" rx="1" fill="rgba(100,116,139,.3)"/>
        <!-- corpo/torso -->
        <path d="M15,47C15,29 21,22 28,22C35,22 41,29 41,47L36,52L28,54L20,52Z" fill="rgba(71,85,105,.35)" stroke="rgba(100,116,139,.38)" stroke-width="1.3"/>
        <!-- braccia -->
        <line x1="15" y1="33" x2="5" y2="46" stroke="rgba(100,116,139,.42)" stroke-width="3.8" stroke-linecap="round"/>
        <line x1="41" y1="33" x2="51" y2="46" stroke="rgba(100,116,139,.42)" stroke-width="3.8" stroke-linecap="round"/>
        <!-- gambe -->
        <line x1="22" y1="52" x2="20" y2="72" stroke="rgba(100,116,139,.42)" stroke-width="4.2" stroke-linecap="round"/>
        <line x1="34" y1="52" x2="36" y2="72" stroke="rgba(100,116,139,.42)" stroke-width="4.2" stroke-linecap="round"/>
      </svg>`;
    }

    return `<style>
      @keyframes ${s}Rg{0%{transform:scale(.45);opacity:.9}100%{transform:scale(1.7);opacity:0}}
      @keyframes ${s}Gw{0%,100%{filter:drop-shadow(0 0 4px rgba(245,158,11,.45))}50%{filter:drop-shadow(0 0 13px rgba(245,158,11,.95))}}
      @keyframes ${s}P1{0%{transform:translate(0,0);opacity:.9}100%{transform:translate(-8px,-15px);opacity:0}}
      @keyframes ${s}P2{0%{transform:translate(0,0);opacity:.8}100%{transform:translate(7px,-13px);opacity:0}}
      @keyframes ${s}P3{0%{transform:translate(0,0);opacity:.7}100%{transform:translate(-3px,-18px);opacity:0}}
    </style>
    <svg viewBox="0 0 56 80" width="42" height="60" style="display:block;overflow:visible">
      <defs>
        <linearGradient id="${s}hg" x1="25%" y1="15%" x2="75%" y2="85%">
          <stop offset="0%" stop-color="#fcd34d" stop-opacity=".95"/>
          <stop offset="100%" stop-color="#d97706" stop-opacity=".7"/>
        </linearGradient>
      </defs>
      <!-- anelli radar espandenti centrati sul corpo -->
      <circle cx="28" cy="30" r="24" fill="none" stroke="rgba(245,158,11,.6)" stroke-width="2" style="animation:${s}Rg 2.3s ease-out infinite"/>
      <circle cx="28" cy="30" r="24" fill="none" stroke="rgba(245,158,11,.42)" stroke-width="2" style="animation:${s}Rg 2.3s ease-out infinite .75s"/>
      <circle cx="28" cy="30" r="24" fill="none" stroke="rgba(245,158,11,.25)" stroke-width="1.5" style="animation:${s}Rg 2.3s ease-out infinite 1.5s"/>
      <!-- alone corpo -->
      <ellipse cx="28" cy="33" rx="15" ry="22" fill="rgba(245,158,11,.07)"/>
      <!-- ombra calda -->
      <ellipse cx="28" cy="72" rx="14" ry="3.5" fill="rgba(245,158,11,.15)"/>
      <!-- testa -->
      <circle cx="28" cy="11" r="8" fill="url(#${s}hg)" stroke="#f59e0b" stroke-width="1.5" style="animation:${s}Gw 1.6s ease-in-out infinite"/>
      <!-- riflesso fronte -->
      <circle cx="25" cy="9" r="2.2" fill="rgba(255,255,255,.3)"/>
      <!-- collo -->
      <rect x="25.5" y="18.5" width="5" height="4" rx="1" fill="rgba(245,158,11,.65)"/>
      <!-- torso -->
      <path d="M15,47C15,29 21,22 28,22C35,22 41,29 41,47L36,52L28,54L20,52Z" fill="rgba(245,158,11,.55)" stroke="#f59e0b" stroke-width="1.4" style="animation:${s}Gw 1.6s ease-in-out infinite"/>
      <!-- braccia -->
      <line x1="15" y1="33" x2="5" y2="47" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
      <line x1="41" y1="33" x2="51" y2="47" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
      <!-- gambe -->
      <line x1="22" y1="52" x2="20" y2="72" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="34" y1="52" x2="36" y2="72" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round"/>
      <!-- particelle moto -->
      <circle cx="6" cy="42" r="2.8" fill="rgba(245,158,11,.88)" style="animation:${s}P1 2s ease-in-out infinite"/>
      <circle cx="50" cy="37" r="2.2" fill="rgba(245,158,11,.75)" style="animation:${s}P2 2s ease-in-out infinite .7s"/>
      <circle cx="13" cy="20" r="2" fill="rgba(245,158,11,.65)" style="animation:${s}P3 2s ease-in-out infinite 1.4s"/>
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
    const col = c.color || '#f59e0b';
    return {
      icon: iconHtml(c.icon || 'mdi:motion-sensor'),
      label: c.label || 'Presenza',
      value: ents.length ? `${active}/${ents.length}` : '—',
      color: active > 0 ? col : '#fff',
    };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    return ents.map(e => e.entity).filter(Boolean);
  }

  /* ── render popup ── */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const on    = h ? isOn(h, e.entity) : false;
      const lbl   = e.label || nameOf(h, e.entity);
      const stLbl = on ? 'Rilevato' : 'Libero';
      const stCol = on ? '#f59e0b' : '#4ade80';
      const stBg  = on ? 'rgba(245,158,11,.14)' : 'rgba(74,222,128,.12)';
      const stBdr = on ? 'rgba(245,158,11,.35)'  : 'rgba(74,222,128,.28)';
      const lastChanged = h && h.states && h.states[e.entity] && h.states[e.entity].last_changed;
      const timeStr = lastChanged ? _timeAgo(lastChanged) : '';
      const timeLabel = on
        ? (timeStr === 'adesso' ? 'Appena rilevato' : `Rilevato da ${timeStr}`)
        : (timeStr ? `Libero da ${timeStr}` : '');
      const timeColor = on ? 'rgba(245,158,11,.8)' : 'rgba(255,255,255,.42)';

      return `<div style="border-bottom:1px solid rgba(255,255,255,.04);${on ? 'background:rgba(245,158,11,.03)' : ''}">
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px">
          <div style="flex-shrink:0">${_presenceSvg(on, i)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            ${timeLabel ? `<div style="font-size:10px;color:${timeColor};margin-top:2px;font-weight:${on?'600':'400'}">${eh(timeLabel)}</div>` : ''}
          </div>
          <div style="padding:4px 12px;border-radius:20px;background:${stBg};border:1px solid ${stBdr};font-size:11px;font-weight:700;color:${stCol};white-space:nowrap;flex-shrink:0">${stLbl}</div>
        </div>
      </div>`;
    }).join('');

    return `<div id="gppre-popup-body">
      <div>${rows || '<div style="padding:36px 20px;text-align:center;color:#fff;font-size:12px">Nessun sensore configurato.<br><span style="font-size:10px;color:rgba(255,255,255,.5)">Clicca ✏️ sulla chip per configurare.</span></div>'}</div>
    </div>`;
  }

  /* ── mount ── */
  function _hideSubtitle(el) {
    try {
      const hdr = el.previousElementSibling; if (!hdr) return;
      const textWrap = hdr.children && hdr.children[1]; if (!textWrap) return;
      const subEl = textWrap.children && textWrap.children[1]; if (!subEl) return;
      subEl.style.display = 'none';
    } catch(e) {}
  }

  function mount(cfg, rawHass, el) {
    setTimeout(() => _hideSubtitle(el), 0);
    if (el._gpPoll) return;
    el._gpPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gpPoll); delete el._gpPoll; return; }
      try {
        const h = H(); if (!h) return;
        const _sp=el.parentElement, _st=_sp?_sp.scrollTop:0;
        el.innerHTML = render(cfg, h);
        _hideSubtitle(el);
        if(_sp&&_st>0) _sp.scrollTop=_st;
      } catch(e) {}
    }, 1500);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, null); } catch(e){}
  }

  /* ── configure ── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const ents = JSON.parse(JSON.stringify(Array.isArray(c.entities) ? c.entities : []));
    const h = H();
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
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1a2e;border:1px solid rgba(245,158,11,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;flex-shrink:0">${m.icon||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:#fff">${eh(m.id)}</div>
          </div>
        </div>`;
        r.addEventListener('mouseover', () => { r.style.background='rgba(245,158,11,.08)'; });
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

    function _entityMatches(q) {
      if (!h||!h.states) return [];
      const lq = q.toLowerCase();
      return Object.keys(h.states)
        .filter(id => (nameOf(h,id).toLowerCase().includes(lq) || id.toLowerCase().includes(lq)))
        .map(id => {
          const dom = id.split('.')[0];
          const icons = { binary_sensor:'🚶', sensor:'📡', automation:'🤖' };
          return { id, name: nameOf(h,id), icon: icons[dom]||'📦' };
        })
        .sort((a,b) => {
          const ab = a.id.startsWith('binary_sensor.') ? 0 : 1;
          const bb = b.id.startsWith('binary_sensor.') ? 0 : 1;
          if (ab!==bb) return ab-bb;
          return a.name.localeCompare(b.name);
        });
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch(e){} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key==='Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    function renderForm() {
      const col = c.color || '#f59e0b';
      const selRows = ents.map((e, i) => {
        const lbl = e.label || nameOf(h, e.entity);
        const on  = h ? isOn(h, e.entity) : false;
        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid ${on?hex2rgba(col,.25):'rgba(255,255,255,.08)'};margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;flex-shrink:0">${on?'🚶':'🧍'}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:#fff">${eh(e.entity)}</div>
            </div>
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
          </div>
        </div>`;
      }).join('');

      const anim = _firstRender ? 'animation:gpCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes gpCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .gpcinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit} .gpcinp::placeholder{color:rgba(255,255,255,.5)} #gpcfg-body::-webkit-scrollbar{display:none}</style>

        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(245,158,11,.13);border:1px solid rgba(245,158,11,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🚶</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800;color:#fff">Configura — Gruppo Presenza</div>
            <div style="font-size:10px;color:#fff">${ents.length} sensori selezionati</div>
          </div>
          <button id="gpcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <div id="gpcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:#fff;margin-bottom:3px">Nome chip</div><input id="gpcfg-label" class="gpcinp" placeholder="Presenza" value="${eh(c.label||'Presenza')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:#fff;margin-bottom:3px">Colore</div><input type="color" id="gpcfg-color" value="${(c.color||'#f59e0b').match(/^#[0-9a-f]{6}$/i)?c.color:'#f59e0b'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>

          ${ents.length ? `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px">Sensori selezionati (${ents.length})</div>
            <div>${selRows}</div>
          ` : ''}

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin:${ents.length?'12px':0} 0 6px">Aggiungi sensore</div>
          <input id="gpcfg-add-entity" class="gpcinp" placeholder="🔍 Cerca binary_sensor.* o sensor.*…" autocomplete="off">
          <div style="height:16px"></div>
        </div>

        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gpcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#f59e0b;color:#1a1a00;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gpcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#gpcfg-body');
      const savedBody = prevBody ? prevBody.scrollTop : 0;
      ov.innerHTML = renderForm();
      _firstRender = false;
      const nb = ov.querySelector('#gpcfg-body');
      if (nb && savedBody > 0) nb.scrollTop = savedBody;

      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);
      ov.querySelector('#gpcfg-close').onclick = closeOv;
      ov.querySelector('#gpcfg-cancel').onclick = closeOv;

      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => { ents.splice(parseInt(btn.dataset.del), 1); attach(); });
      });

      const addInp = ov.querySelector('#gpcfg-add-entity');
      if (addInp) {
        _setupAc(addInp, _entityMatches, (id, name) => {
          if (!ents.find(e => e.entity === id)) ents.push({ entity: id, label: name||'' });
          addInp.value = ''; attach();
        });
      }

      ov.querySelector('#gpcfg-save').addEventListener('click', () => {
        const newCfg = {
          label:    (ov.querySelector('#gpcfg-label')?.value || 'Presenza').trim(),
          color:    ov.querySelector('#gpcfg-color')?.value || '#f59e0b',
          entities: ents.filter(e => e.entity).map(e => ({ entity: e.entity.trim(), label: e.label||'' })),
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
    id: ID, name: 'Gruppo Presenza', icon: 'mdi:motion-sensor',
    desc: 'Chip contatore sensori presenza/movimento attivi. Clic → stato rilevato/libero per ogni zona.',
    version: '1.1', isDistintivo: true,
    defaultCfg: { label: 'Presenza', icon: 'mdi:motion-sensor', color: '#f59e0b', entities: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-presenza v1.0'); } catch(e){}
})();
