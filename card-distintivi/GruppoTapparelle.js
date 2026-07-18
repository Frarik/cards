/* frarik-version: 3.2 */
/**
 * GruppoTapparelle.js — Distintivo FratechStore v3.2
 * Chip: contatore tapparelle aperte
 * Popup: Apri/Stop/Chiudi + preset 25/50/75/100% (globali e per singola tapparella)
 * v3.0: stesso trattamento di GruppoAllarme/GruppoLuci/GruppoFinestre/GruppoPorte —
 *       chip "TAPPARELLE: N" (solo numero aperte, maiuscolo/grassetto, colore
 *       rosso/verde canonico, niente più posizione media); popup rifatto a stile
 *       "glass" con hero riepilogo, riquadri con lo stesso sfondo/colore/altezza degli
 *       altri distintivi (icona + nome + stato + pulsanti apri/stop/chiudi + slider),
 *       automazione come badge nell'angolo (verde/rosso, senza scritte, icona robot);
 *       Apri/Chiudi tutte come medaglioni circolari, preset 25/50/75% sotto; titolo
 *       popup bianco/maiuscolo/grassetto; tutto il testo a dimensione unica (12px);
 *       fix update() che scartava lo stato hass live
 * v3.1: le frecce apri/chiudi/stop della singola tapparella sono sempre bianche/neutre
 *       (prima "apri" era verde); rimosso lo slider di posizione, sostituito con 4
 *       pulsanti percentuale (25/50/75/100%) per ogni singola tapparella, non solo
 *       globali; pulsanti apri/stop/chiudi spostati su una riga propria a tutta
 *       larghezza per lasciare più spazio al nome/stato
 * v3.2: ripristinato lo slider di posizione per la singola tapparella (tolto per errore
 *       in v3.1, ora convive con i 4 pulsanti percentuale); aggiunto il preset 100%
 *       mancante nella riga globale sotto Apri tutte/Chiudi tutte
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
  function callSvcEx(domain, svc, data) {
    if (typeof window.callSvc === 'function') {
      const { entity_id, ...rest } = data;
      window.callSvc(domain, svc, entity_id, Object.keys(rest).length ? rest : undefined);
      return;
    }
    const hh = H(); if (hh && hh.callService) hh.callService(domain, svc, data);
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
    const anyOpen = active > 0;
    const _fcr = window.FratechColorRules;
    const _cond = { any_open: active > 0, all_closed: active === 0 };
    return {
      icon: iconHtml(_dynIcon(c.icon||'mdi:blinds', anyOpen)),
      value: `${(c.label || 'Tapparelle').toUpperCase()}: ${ents.length ? active : '—'}`,
      // stesso rosso/verde canonico del popup (aperta=rosso, chiusa=verde), non l'accento
      // configurabile — altrimenti il chip mostrava un colore diverso dal popup
      color: (_fcr && _fcr.evalColor(cfg, _cond)) || (anyOpen ? '#f87171' : '#4ade80'),
      borderColor: _fcr && _fcr.evalBorderColor(cfg, _cond),
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

    const openCount = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
    const anyOpen = openCount > 0;
    const heroCol = anyOpen ? '#f87171' : '#4ade80';
    const heroTxt = !ents.length ? 'NESSUNA TAPPARELLA'
      : openCount === 0 ? 'TUTTE CHIUSE'
      : openCount === ents.length ? 'TUTTE APERTE'
      : `${openCount}/${ents.length} APERTE`;

    const hero = `<div style="position:relative;overflow:hidden;display:flex;align-items:center;gap:14px;padding:16px;border-radius:18px;background:linear-gradient(155deg,${hex2rgba(heroCol,.16)},${hex2rgba(heroCol,.04)});border:1px solid ${hex2rgba(heroCol,.32)};margin:0 14px 14px">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 18% 15%,${hex2rgba(heroCol,.22)},transparent 62%);pointer-events:none"></div>
      <div style="position:relative;width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${hex2rgba(heroCol,.18)};border:1.5px solid ${hex2rgba(heroCol,.45)};box-shadow:0 0 18px ${hex2rgba(heroCol,.35)}">
        <span style="font-size:26px;color:${heroCol}">${iconHtml(_dynIcon(c.icon||'mdi:blinds', anyOpen), 26)}</span>
      </div>
      <div style="position:relative;flex:1;min-width:0">
        <div style="font-size:19px;font-weight:900;color:${heroCol};letter-spacing:.3px;text-transform:uppercase">${heroTxt}</div>
      </div>
    </div>`;

    const ctrlBar = ents.length ? `
      <div style="display:flex;gap:20px;justify-content:center;margin:0 14px 12px">
        <button data-gt-all="open" style="background:none;border:none;padding:4px 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:7px;outline:none">
          <span style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(155deg,${hex2rgba('#4ade80',.3)},${hex2rgba('#4ade80',.08)});border:1.5px solid ${hex2rgba('#4ade80',.55)};box-shadow:0 0 16px ${hex2rgba('#4ade80',.35)}">
            <span style="font-size:21px;color:#4ade80">${iconHtml('mdi:arrow-up-bold', 21)}</span>
          </span>
          <span style="white-space:nowrap;color:#4ade80;text-transform:uppercase;font-weight:900;font-size:12px">Apri tutte</span>
        </button>
        <button data-gt-all="close" style="background:none;border:none;padding:4px 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:7px;outline:none">
          <span style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.12)">
            <span style="font-size:21px;color:#fff">${iconHtml('mdi:arrow-down-bold', 21)}</span>
          </span>
          <span style="white-space:nowrap;color:#fff;text-transform:uppercase;font-weight:900;font-size:12px">Chiudi tutte</span>
        </button>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin:0 14px 16px">
        <button data-gt-preset="25"  style="flex:0 0 auto;padding:9px 18px;border-radius:11px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font-size:12px;font-weight:900;text-transform:uppercase;cursor:pointer;outline:none">25%</button>
        <button data-gt-preset="50"  style="flex:0 0 auto;padding:9px 18px;border-radius:11px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font-size:12px;font-weight:900;text-transform:uppercase;cursor:pointer;outline:none">50%</button>
        <button data-gt-preset="75"  style="flex:0 0 auto;padding:9px 18px;border-radius:11px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font-size:12px;font-weight:900;text-transform:uppercase;cursor:pointer;outline:none">75%</button>
        <button data-gt-preset="100" style="flex:0 0 auto;padding:9px 18px;border-radius:11px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font-size:12px;font-weight:900;text-transform:uppercase;cursor:pointer;outline:none">100%</button>
      </div>` : '';

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const st = h ? stateOf(h, e.entity).toLowerCase() : 'unknown';
      const on = ON_STATES.includes(st);
      const moving = st === 'opening' || st === 'closing';
      const lbl = e.label || nameOf(h, e.entity);
      const pos = h ? coverPos(h, e.entity) : null;
      const stLbl = coverStateLbl(st);
      const rCol = on ? '#f87171' : moving ? '#fbbf24' : '#4ade80';

      // pallino automazione — piccolo badge nell'angolo del riquadro, senza scritte: solo colore stato
      let autoDot = '';
      if (e.automation) {
        const autoOn = h ? isOn(h, e.automation) : false;
        const aCol = autoOn ? '#4ade80' : '#f87171';
        autoDot = `<button data-gt-auto="${i}" style="position:absolute;top:8px;right:8px;z-index:1;width:26px;height:26px;border-radius:50%;border:1.5px solid ${hex2rgba(aCol,.55)};background:linear-gradient(155deg,${hex2rgba(aCol,.4)},${hex2rgba(aCol,.12)});box-shadow:0 0 8px ${hex2rgba(aCol,.35)};display:flex;align-items:center;justify-content:center;cursor:pointer;outline:none;color:${aCol}">${iconHtml('mdi:robot', 13)}</button>`;
      }

      // le frecce apri/chiudi restano sempre bianche/neutre (non colorate come lo stato)
      const btnBase = 'flex:1;height:36px;border-radius:10px;cursor:pointer;outline:none;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.07);color:#fff;border:1px solid rgba(255,255,255,.15)';
      const ctrlBtns = `
        <button data-gt-open="${i}"  title="Apri"  style="${btnBase}">${iconHtml('mdi:chevron-up', 18)}</button>
        <button data-gt-stop="${i}"  title="Stop"  style="${btnBase}">${iconHtml('mdi:stop', 15)}</button>
        <button data-gt-close="${i}" title="Chiudi" style="${btnBase}">${iconHtml('mdi:chevron-down', 18)}</button>`;

      // percentuali per la singola tapparella (non solo globali)
      const presetBtns = pos !== null ? [25, 50, 75, 100].map(p => {
        const cur = pos === p;
        return `<button data-gt-epos="${i}" data-pct="${p}" style="flex:1;padding:8px 4px;border-radius:10px;border:1px solid ${cur ? hex2rgba(rCol,.5) : 'rgba(255,255,255,.18)'};background:${cur ? hex2rgba(rCol,.22) : 'rgba(255,255,255,.06)'};color:${cur ? rCol : '#fff'};font-size:12px;font-weight:900;text-transform:uppercase;cursor:pointer;outline:none">${p}%</button>`;
      }).join('') : '';

      const slider = pos !== null ? `
        <div style="position:relative;display:flex;align-items:center;gap:10px;margin-top:10px">
          <input type="range" data-gt-pos="${i}" data-entity="${eh(e.entity)}" min="0" max="100" value="${pos}"
            style="flex:1;accent-color:${rCol};cursor:pointer;outline:none;border:none;background:transparent">
          <span data-gt-poslbl="${i}" style="font-size:12px;color:#fff;flex-shrink:0;width:36px;text-align:right;font-weight:900">${pos}%</span>
        </div>` : '';

      return `<div style="position:relative;overflow:hidden;border-radius:18px;background:linear-gradient(155deg,${hex2rgba(rCol,.18)},${hex2rgba(rCol,.03)});border:1px solid ${hex2rgba(rCol,.4)};padding:16px;margin:0 14px 8px">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 15% 10%,${hex2rgba(rCol,.2)},transparent 62%);pointer-events:none"></div>
        ${autoDot}
        <div style="position:relative;display:flex;align-items:center;gap:12px">
          <span style="width:44px;height:44px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${hex2rgba(rCol,.22)};border:1px solid ${hex2rgba(rCol,.5)};box-shadow:0 0 12px ${hex2rgba(rCol,.3)};color:${rCol}">${iconHtml(_dynIcon(c.icon||'mdi:blinds', on||moving), 22)}</span>
          <span style="flex:1;min-width:0">
            <span style="display:block;font-size:12px;font-weight:900;text-transform:uppercase;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</span>
            <span style="display:block;font-size:12px;font-weight:900;text-transform:uppercase;color:${rCol};letter-spacing:.3px;margin-top:2px">${stLbl}</span>
          </span>
        </div>
        <div style="position:relative;display:flex;gap:8px;margin-top:12px">${ctrlBtns}</div>
        ${presetBtns ? `<div style="position:relative;display:flex;gap:6px;margin-top:8px">${presetBtns}</div>` : ''}
        ${slider}
      </div>`;
    }).join('');

    return `<div id="gta-popup-body">
      ${hero}
      ${ctrlBar}
      <div>${rows||'<div style="padding:32px 20px;text-align:center;color:#fff;font-size:12px;font-weight:900;text-transform:uppercase">Nessuna tapparella configurata<br><span style="font-size:12px;font-weight:900;text-transform:uppercase;opacity:.7">Clicca ✏️ sulla chip per configurare</span></div>'}</div>
    </div>`;
  }

  /* ── mount + handlers ── */
  function _mountHandlers(cfg, el) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    if (el._gtHandler)       el.removeEventListener('click',  el._gtHandler);
    if (el._gtInputHandler)  el.removeEventListener('input',  el._gtInputHandler);
    if (el._gtChangeHandler) el.removeEventListener('change', el._gtChangeHandler);

    function handler(ev) {
      const openBtn = ev.target.closest('[data-gt-open]');
      if (openBtn) { const e = ents[parseInt(openBtn.dataset.gtOpen)]; if (e) callSvc('cover', 'open_cover', e.entity); ev.stopPropagation(); return; }
      const stopBtn = ev.target.closest('[data-gt-stop]');
      if (stopBtn) { const e = ents[parseInt(stopBtn.dataset.gtStop)]; if (e) callSvc('cover', 'stop_cover', e.entity); ev.stopPropagation(); return; }
      const closeBtn = ev.target.closest('[data-gt-close]');
      if (closeBtn) { const e = ents[parseInt(closeBtn.dataset.gtClose)]; if (e) callSvc('cover', 'close_cover', e.entity); ev.stopPropagation(); return; }
      const auto = ev.target.closest('[data-gt-auto]');
      if (auto) {
        const e = ents[parseInt(auto.dataset.gtAuto)]; if (!e||!e.automation) return;
        const autoOn = isOn(H(), e.automation);
        const nextOn = !autoOn;
        const newCol = nextOn ? '#4ade80' : '#f87171';
        auto.style.color = newCol;
        auto.style.borderColor = hex2rgba(newCol, .55);
        auto.style.background = `linear-gradient(155deg,${hex2rgba(newCol,.4)},${hex2rgba(newCol,.12)})`;
        auto.style.boxShadow = `0 0 8px ${hex2rgba(newCol,.35)}`;
        callSvc('automation', autoOn ? 'turn_off' : 'turn_on', e.automation);
        ev.stopPropagation(); return;
      }
      const allBtn = ev.target.closest('[data-gt-all]');
      if (allBtn) {
        const svc = allBtn.dataset.gtAll === 'open' ? 'open_cover' : 'close_cover';
        ents.forEach(e => { if (e.entity) callSvc('cover', svc, e.entity); });
        ev.stopPropagation(); return;
      }
      const presetBtn = ev.target.closest('[data-gt-preset]');
      if (presetBtn) {
        const pos = parseInt(presetBtn.dataset.gtPreset);
        ents.forEach(e => { if (e.entity) callSvcEx('cover', 'set_cover_position', { entity_id: e.entity, position: pos }); });
        ev.stopPropagation(); return;
      }
      const ePosBtn = ev.target.closest('[data-gt-epos]');
      if (ePosBtn) {
        const e = ents[parseInt(ePosBtn.dataset.gtEpos)]; if (!e) return;
        callSvcEx('cover', 'set_cover_position', { entity_id: e.entity, position: parseInt(ePosBtn.dataset.pct) });
        ev.stopPropagation(); return;
      }
    }

    function inputHandler(ev) {
      const rangeEl = ev.target.closest('[data-gt-pos]');
      if (!rangeEl) return;
      const lbl = el.querySelector(`[data-gt-poslbl="${rangeEl.dataset.gtPos}"]`);
      if (lbl) lbl.textContent = rangeEl.value + '%';
      ev.stopPropagation();
    }

    function changeHandler(ev) {
      const rangeEl = ev.target.closest('[data-gt-pos]');
      if (!rangeEl) return;
      const e = ents[parseInt(rangeEl.dataset.gtPos)]; if (!e) return;
      callSvcEx('cover', 'set_cover_position', { entity_id: e.entity, position: parseInt(rangeEl.value) });
      ev.stopPropagation();
    }

    el._gtHandler       = handler;
    el._gtInputHandler  = inputHandler;
    el._gtChangeHandler = changeHandler;
    el.addEventListener('click',  handler);
    el.addEventListener('input',  inputHandler);
    el.addEventListener('change', changeHandler);
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
        titleEl.style.color = '#fff';
        titleEl.style.fontWeight = '900';
        titleEl.style.textTransform = 'uppercase';
        titleEl.textContent = active === 1 ? '1 tapparella aperta' : `${active} tapparelle aperte`;
      } catch(e) {}
    }

    setTimeout(_syncTitle, 0);

    if (el._gtPoll) return;
    el._gtPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gtPoll); delete el._gtPoll; return; }
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
    try { el.innerHTML = render(cfg, rawHass); _mountHandlers(cfg, el); } catch(e){}
  }

  /* ── configure ── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    let colorCfg = { mode: c.colorMode||'fixed', fixed: c.colorFixed||c.color||'#38bdf8', rules: Array.isArray(c.colorRules)?JSON.parse(JSON.stringify(c.colorRules)):[], borderMode: c.borderMode||'none', borderFixed: c.borderFixed||'#ffffff', borderRules: Array.isArray(c.borderRules)?JSON.parse(JSON.stringify(c.borderRules)):[] };
    const presets = [
      { key: 'any_open',   label: 'Almeno una tapparella aperta' },
      { key: 'all_closed', label: 'Tutte chiuse' },
      { key: 'fallback',   label: 'Sempre (fallback)' },
    ];
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
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(255,255,255,.2);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin;scrollbar-color:#fff transparent`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;flex-shrink:0;filter:${m.on?'none':'grayscale(1) opacity(.4)'}">${m.icon||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:#fff;margin-top:1px">${eh(m.id)}${m.stateLabel?` · <span style="color:#fff">${eh(m.stateLabel)}</span>`:''}</div>
          </div>
        </div>`;
        r.addEventListener('mouseover', () => { r.style.background='rgba(255,255,255,.06)'; });
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

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch(e){} document.removeEventListener('keydown', escFn); }
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

      const anim = _firstRender ? 'animation:gtCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes gtCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .gtcinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s} .gtcinp:focus{border-color:rgba(255,255,255,.35);background:rgba(255,255,255,.08)} .gtcinp::placeholder{color:rgba(255,255,255,.55)} #gtcfg-body::-webkit-scrollbar{display:none}</style>

        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(56,189,248,.13);border:1px solid rgba(56,189,248,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🪟</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Tapparelle</div>
            <div style="font-size:10px;color:#fff">${ents.length} entit${ents.length===1?'à':'à'} selezionate</div>
          </div>
          <button id="gtcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <div id="gtcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:#fff;margin-bottom:3px">Nome chip</div><input id="gtcfg-label" class="gtcinp" placeholder="Tapparelle" value="${eh(c.label||'Tapparelle')}"></div>
            <div style="flex:0 0 56px"><div style="font-size:9px;color:#fff;margin-bottom:3px">Icona</div><button id="gtcfg-icon-btn" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;outline:none;color:#fff">${iconHtml(c.icon||'mdi:blinds',22)}</button><input type="hidden" id="gtcfg-icon" value="${eh(c.icon||'mdi:blinds')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:#fff;margin-bottom:3px">Colore</div><input type="color" id="gtcfg-color" value="${(c.color||'#38bdf8').match(/^#[0-9a-f]{6}$/i)?c.color:'#38bdf8'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>

          ${ents.length ? `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px">Entità selezionate (${ents.length})</div>
            <div>${selRows}</div>
          ` : ''}

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin:${ents.length?'12px':0} 0 6px">Aggiungi entità</div>
          <input id="gtcfg-add-entity" class="gtcinp" placeholder="🔍 Inizia a scrivere il nome dell'entità…" autocomplete="off">
          <div style="font-size:9px;color:#fff;margin-top:5px">Mostra tutte le entità — cover.* compaiono per prime</div>
          ${window.FratechColorRules ? window.FratechColorRules.html(colorCfg, presets) : ''}
          <div style="height:16px"></div>
        </div>

        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gtcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#38bdf8;color:#fff;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gtcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#gtcfg-body');
      const savedBody = prevBody ? prevBody.scrollTop : 0;
      const curLabel = ov.querySelector('#gtcfg-label')?.value;
      const curIcon  = ov.querySelector('#gtcfg-icon')?.value;
      const curColor = ov.querySelector('#gtcfg-color')?.value;

      ov.innerHTML = renderForm();
      _firstRender = false;
      const _fcr = window.FratechColorRules;
      if (_fcr) _fcr.attach(ov.querySelector('#fcr-section'), presets, () => { colorCfg = _fcr.read(ov.querySelector('#fcr-section')) || colorCfg; });

      const nb = ov.querySelector('#gtcfg-body');
      if (nb && savedBody > 0) nb.scrollTop = savedBody;
      if (curLabel !== undefined) { const f = ov.querySelector('#gtcfg-label'); if (f) f.value = curLabel; }
      if (curIcon  !== undefined) {
        const f = ov.querySelector('#gtcfg-icon'); if (f) f.value = curIcon;
        const b = ov.querySelector('#gtcfg-icon-btn'); if (b) b.innerHTML = iconHtml(curIcon, 22);
      }
      if (curColor !== undefined) { const f = ov.querySelector('#gtcfg-color'); if (f) f.value = curColor; }

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

      const addInp = ov.querySelector('#gtcfg-add-entity');
      if (addInp) {
        _setupAc(addInp, _entityMatches, (id, name) => {
          if (!ents.find(e => e.entity === id)) ents.push({ entity: id, label: name || '', automation: '' });
          addInp.value = ''; attach();
        });
      }

      ov.querySelector('#gtcfg-save').addEventListener('click', () => {
        const _fcrData = _fcr ? (_fcr.read(ov.querySelector('#fcr-section')) || {}) : {};
        const newCfg = {
          ..._fcrData,
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
    desc: 'Chip con contatore + posizione media. Popup: Apri/Stop/Chiudi, preset 25/50/75%, slider posizione per entità.',
    version: '3.2', isDistintivo: true,
    defaultCfg: { label: 'Tapparelle', icon: 'mdi:blinds', color: '#38bdf8', entities: [], colorMode: 'auto', colorRules: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-tapparelle v3.2'); } catch(e){}
})();
