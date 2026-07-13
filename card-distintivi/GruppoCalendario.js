/* frarik-version: 1.0 */
/**
 * GruppoCalendario.js — Distintivo FratechStore v1.0
 * Chip calendario eventi — entità calendar.* di Home Assistant
 * Mostra prossimo evento per ogni calendario, animazione quando evento attivo
 */
(function () {
  'use strict';

  const ID = 'gruppo-calendario';

  function H() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    return null;
  }
  function loadCfg(cfg) { return cfg && typeof cfg === 'object' ? cfg : {}; }
  function nameOf(h, id) {
    const s = h && h.states && h.states[id];
    return (s && s.attributes && s.attributes.friendly_name) || (id && id.includes('.') ? id.split('.')[1].replace(/_/g,' ') : (id||''));
  }
  function stateOf(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || ''; }
  function attrOf(h, id, k) { const s = h && h.states && h.states[id]; return (s && s.attributes && s.attributes[k]) ?? null; }
  function eh(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function liveH(r) { return H() || (r && r.states ? r : null); }

  /* ─── parse orario evento ─── */
  function _fmtTime(dtStr) {
    if (!dtStr) return '';
    try {
      const d = new Date(dtStr);
      if (isNaN(d.getTime())) return String(dtStr).slice(0,16);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const evDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diff  = Math.round((evDay - today) / 86400000);
      const hm    = d.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' });
      if (diff === 0) return hm;
      if (diff === 1) return `Domani ${hm}`;
      if (diff === -1) return `Ieri ${hm}`;
      return `${d.toLocaleDateString('it-IT', { day:'2-digit', month:'short' })} ${hm}`;
    } catch(e) {
      return String(dtStr).slice(0,16);
    }
  }

  function _fmtDuration(startStr, endStr) {
    if (!startStr || !endStr) return '';
    try {
      const s = new Date(startStr), e = new Date(endStr);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
      const mins = Math.round((e - s) / 60000);
      if (mins < 60) return `${mins}min`;
      const h = Math.floor(mins/60), m = mins%60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    } catch(e) { return ''; }
  }

  function _isActive(h, id) { return stateOf(h, id).toLowerCase() === 'on'; }

  /* ─── chip icon SVG (calendario) ─── */
  function _chipSvg(activeCount, hasAny) {
    const col  = activeCount > 0 ? '#818cf8' : hasAny ? '#60a5fa' : '#94a3b8';
    const anim = activeCount > 0
      ? `<style>@keyframes gcalChP{0%,100%{filter:drop-shadow(0 0 2px ${col})}50%{filter:drop-shadow(0 0 7px ${col})}}</style>`
      : '';
    const today = new Date().getDate();
    return `${anim}<svg viewBox="0 0 22 24" width="14" height="16" style="display:inline-block;vertical-align:middle;overflow:visible">
      <!-- pagina -->
      <rect x="2" y="4" width="18" height="18" rx="3" fill="${col}" opacity="${activeCount>0?'.7':'.42'}"/>
      <!-- header banda -->
      <rect x="2" y="4" width="18" height="6" rx="3" fill="${col}" opacity="${activeCount>0?'.9':'.6'}"/>
      <rect x="2" y="7" width="18" height="3" rx="0" fill="${col}" opacity="${activeCount>0?'.9':'.6'}"/>
      <!-- anelli -->
      <line x1="7" y1="2" x2="7" y2="8"  stroke="rgba(255,255,255,.75)" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="15" y1="2" x2="15" y2="8" stroke="rgba(255,255,255,.75)" stroke-width="1.6" stroke-linecap="round"/>
      <!-- numero giorno -->
      <text x="11" y="18.5" text-anchor="middle" font-size="8" font-weight="900" fill="#fff" font-family="system-ui">${today}</text>
      <!-- dot evento (se attivo) -->
      ${activeCount>0 ? `<circle cx="18" cy="4" r="3.5" fill="#f87171" style="animation:gcalChP .9s ease-in-out infinite"/>` : ''}
    </svg>`;
  }

  /* ─── chip() ─── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    let activeNow = 0;
    if (h) ents.forEach(e => { if (_isActive(h, e.entity||e)) activeNow++; });

    const value = !ents.length ? '—' : activeNow > 0 ? `${activeNow} ora` : `${ents.length} cal.`;

    return {
      icon:  _chipSvg(activeNow, ents.length > 0),
      label: c.label || 'Calendario',
      value,
      color: activeNow > 0 ? '#818cf8' : '#60a5fa',
    };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    return (Array.isArray(c.entities) ? c.entities : []).map(e => e.entity||e).filter(Boolean);
  }

  /* ─── SVG calendario (per ogni riga popup) ─── */
  function _calSvg(isActive, eventTitle, idx) {
    const s   = `gcalE${idx}`;
    const col = isActive ? '#818cf8' : '#60a5fa';
    const bgA = isActive ? 'rgba(129,140,248,' : 'rgba(96,165,250,';
    const today = new Date().getDate();
    const month = new Date().toLocaleString('it-IT', { month:'short' }).replace('.','').toUpperCase();

    const pulseCss = isActive
      ? `@keyframes ${s}Pu{0%,100%{filter:drop-shadow(0 0 5px rgba(129,140,248,.4))}50%{filter:drop-shadow(0 0 14px rgba(129,140,248,.8))}}`
      : '';
    const dotCss = isActive
      ? `@keyframes ${s}Dt{0%,100%{r:3;opacity:.8}50%{r:5;opacity:1}}`
      : '';
    const pageStyle = isActive ? `style="animation:${s}Pu 1.5s ease-in-out infinite"` : '';

    return `<style>${pulseCss}${dotCss}</style>
    <svg viewBox="0 0 56 72" width="44" height="56" style="display:block;overflow:visible">
      <!-- ombra pagina -->
      <rect x="8" y="14" width="40" height="52" rx="7" fill="rgba(0,0,0,.25)" transform="translate(2,2)"/>
      <!-- pagina principale -->
      <rect x="8" y="14" width="40" height="52" rx="7" fill="${bgA}.18)" stroke="${col}" stroke-width="1.5" ${pageStyle}/>
      <!-- header banda -->
      <rect x="8" y="14" width="40" height="17" rx="7" fill="${col}" opacity=".75"/>
      <rect x="8" y="24" width="40" height="7"  rx="0" fill="${col}" opacity=".75"/>
      <!-- anelli -->
      <rect x="18" y="8"  width="4" height="13" rx="2" fill="${col}" opacity=".6"/>
      <rect x="34" y="8"  width="4" height="13" rx="2" fill="${col}" opacity=".6"/>
      <!-- mese (header) -->
      <text x="28" y="27" text-anchor="middle" font-size="8.5" font-weight="700" fill="#fff" font-family="system-ui" letter-spacing=".5">${eh(month)}</text>
      <!-- numero giorno (grande) -->
      <text x="28" y="49" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" font-family="system-ui">${today}</text>
      <!-- riga evento placeholder -->
      <rect x="13" y="56" width="${isActive?'30':eventTitle?'28':'18'}" height="3" rx="1.5" fill="${col}" opacity="${isActive?'.7':'.4'}"/>
      <rect x="13" y="61" width="${isActive?'20':eventTitle?'18':'12'}" height="3" rx="1.5" fill="${col}" opacity="${isActive?'.5':'.25'}"/>
      <!-- dot "ora" se attivo -->
      ${isActive ? `<circle cx="44" cy="15" r="4" fill="#f87171">
        <animate attributeName="r" values="3;5;3" dur="1.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".8;1;.8" dur="1.2s" repeatCount="indefinite"/>
      </circle>` : ''}
    </svg>`;
  }

  /* ─── render() ─── */
  function render(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    const rows = ents.map((e, i) => {
      const id      = e.entity || e;
      if (!id) return '';
      const calName  = e.label || nameOf(h, id);
      const active   = _isActive(h, id);
      const msgTitle = attrOf(h, id, 'message') || attrOf(h, id, 'event') || '';
      const startT   = attrOf(h, id, 'start_time') || attrOf(h, id, 'start') || '';
      const endT     = attrOf(h, id, 'end_time')   || attrOf(h, id, 'end')   || '';
      const allDay   = attrOf(h, id, 'all_day');
      const location = attrOf(h, id, 'location') || '';
      const hasEv    = !!msgTitle;
      const dur      = _fmtDuration(startT, endT);

      const col     = active ? '#818cf8' : hasEv ? '#60a5fa' : '#94a3b8';
      const bgBand  = active ? 'rgba(129,140,248,.13)' : hasEv ? 'rgba(96,165,250,.08)' : 'rgba(148,163,184,.05)';
      const bdr     = active ? 'rgba(129,140,248,.38)' : hasEv ? 'rgba(96,165,250,.25)' : 'rgba(148,163,184,.15)';
      const statusPill = active
        ? `<span style="display:inline-block;padding:3px 9px;border-radius:20px;background:rgba(129,140,248,.22);border:1px solid rgba(129,140,248,.45);font-size:10px;font-weight:700;color:#818cf8">🟣 In corso</span>`
        : hasEv
          ? `<span style="display:inline-block;padding:3px 9px;border-radius:20px;background:rgba(96,165,250,.15);border:1px solid rgba(96,165,250,.3);font-size:10px;font-weight:700;color:#60a5fa">📅 ${allDay?'Tutto il giorno':_fmtTime(startT)}</span>`
          : `<span style="display:inline-block;padding:3px 9px;border-radius:20px;background:rgba(148,163,184,.1);border:1px solid rgba(148,163,184,.2);font-size:10px;font-weight:600;color:#94a3b8">Nessun evento</span>`;

      const rowBg = active ? 'background:rgba(129,140,248,.04)' : '';

      return `<div style="border-bottom:1px solid rgba(255,255,255,.04);${rowBg}">
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px">
          <div style="flex-shrink:0">${_calSvg(active, msgTitle, i)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.65);margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(calName)}</div>
            ${hasEv ? `<div style="font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px">${eh(msgTitle)}</div>` : ''}
            <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center">
              ${statusPill}
              ${dur && !allDay ? `<span style="font-size:10px;color:rgba(255,255,255,.5)">⏱ ${eh(dur)}</span>` : ''}
              ${location ? `<span style="font-size:10px;color:rgba(255,255,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">📍 ${eh(location)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    return `<div id="gcal-popup-body">
      <div>${rows || '<div style="padding:36px 20px;text-align:center;color:#fff;font-size:12px">Nessun calendario configurato.<br><span style="font-size:10px;color:rgba(255,255,255,.5)">Clicca ✏️ sulla chip per configurare.</span></div>'}</div>
    </div>`;
  }

  /* ─── mount ─── */
  function _hideSubtitle(el) {
    try {
      const hdr = el.previousElementSibling; if (!hdr) return;
      const tw = hdr.children && hdr.children[1]; if (!tw) return;
      const sub = tw.children && tw.children[1]; if (!sub) return;
      sub.style.display = 'none';
    } catch(e) {}
  }

  function mount(cfg, rawHass, el) {
    setTimeout(() => _hideSubtitle(el), 0);
    if (el._gcalPoll) return;
    el._gcalPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gcalPoll); delete el._gcalPoll; return; }
      try {
        const h = H(); if (!h) return;
        const sp = el.parentElement, st = sp ? sp.scrollTop : 0;
        el.innerHTML = render(cfg, h);
        _hideSubtitle(el);
        if (sp && st > 0) sp.scrollTop = st;
      } catch(e) {}
    }, 30000);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, rawHass || null); } catch(e) {}
  }

  /* ─── configure ─── */
  function configure(cfg, _el, onSave) {
    const c    = loadCfg(cfg);
    const ents = JSON.parse(JSON.stringify(Array.isArray(c.entities) ? c.entities : []));
    const h    = H();
    let _firstRender = true, _acDrop = null;

    function _closeAc() { if (_acDrop) { try { _acDrop.remove(); } catch(e){} _acDrop = null; } }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 220;
      const useAbove = (window.innerHeight - rect.bottom - 6) < MAXH && rect.top > MAXH;
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight-rect.top+4}px` : `top:${rect.bottom+4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#0a1628;border:1px solid rgba(96,165,250,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:14px;flex-shrink:0">${m.icon||'📆'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.55)">${eh(m.id)}</div>
          </div>
          ${m.active ? '<span style="font-size:10px;color:#818cf8">● attivo</span>' : ''}
        </div>`;
        r.addEventListener('mouseover', () => r.style.background='rgba(96,165,250,.08)');
        r.addEventListener('mouseout',  () => r.style.background='transparent');
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id, m.name); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.addEventListener('input', () => {
        const q = (inp.value||'').toLowerCase().trim();
        if (!q) { _closeAc(); return; }
        _openAc(inp, filterFn(q).slice(0,14), onPick);
      });
      inp.addEventListener('focus', () => {
        // show all calendar.* by default on focus
        const q = (inp.value||'').toLowerCase().trim() || 'cal';
        _openAc(inp, filterFn(q).slice(0,14), onPick);
      });
      inp.addEventListener('blur', () => setTimeout(_closeAc, 160));
    }

    function _calMatches(q) {
      if (!h || !h.states) return [];
      const lq = q.toLowerCase();
      const allIds = Object.keys(h.states);
      const cals   = allIds.filter(id => id.startsWith('calendar.'));
      const others = allIds.filter(id => !id.startsWith('calendar.'));
      const filterFn = id => nameOf(h,id).toLowerCase().includes(lq) || id.toLowerCase().includes(lq);
      return [
        ...cals.filter(filterFn).map(id => ({
          id, name: nameOf(h,id), icon:'📆', active: _isActive(h,id),
        })),
        ...others.filter(filterFn).map(id => ({
          id, name: nameOf(h,id), icon:'📦', active: false,
        })),
      ];
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.8);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch(e){} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key==='Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    function renderForm() {
      const selRows = ents.map((e, i) => {
        const id      = e.entity || e;
        const lbl     = e.label  || nameOf(h, id);
        const active  = _isActive(h, id);
        const msg     = attrOf(h, id, 'message') || '';
        const dotCol  = active ? '#818cf8' : '#60a5fa';
        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:16px">📆</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:rgba(255,255,255,.5)">${eh(id)}${msg?` · ${eh(String(msg).slice(0,30))}`:''}</div>
            </div>
            ${active?`<span style="font-size:9px;color:${dotCol};font-weight:700">● ORA</span>`:''}
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0;margin-left:4px">✕</button>
          </div>
        </div>`;
      }).join('');

      const anim = _firstRender ? 'animation:gcalCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>
          @keyframes gcalCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .gcalinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit}
          .gcalinp::placeholder{color:rgba(255,255,255,.45)}
          #gcalcfg-body::-webkit-scrollbar{display:none}
        </style>
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(96,165,250,.13);border:1px solid rgba(96,165,250,.28);display:flex;align-items:center;justify-content:center;font-size:18px">📆</div>
          <div style="flex:1"><div style="font-size:14px;font-weight:800;color:#fff">Configura — Calendario</div></div>
          <button id="gcalcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>
        <div id="gcalcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:rgba(255,255,255,.55);margin-bottom:3px">Nome chip</div><input id="gcalcfg-label" class="gcalinp" placeholder="Calendario" value="${eh(c.label||'Calendario')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:rgba(255,255,255,.55);margin-bottom:3px">Colore</div><input type="color" id="gcalcfg-color" value="${(c.color||'#60a5fa').match(/^#[0-9a-f]{6}$/i)?c.color:'#60a5fa'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>
          ${ents.length ? `<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.5);margin-bottom:6px">Calendari (${ents.length})</div><div style="margin-bottom:12px">${selRows}</div>` : ''}
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.5);margin-bottom:6px">Aggiungi calendario</div>
          <input id="gcalcfg-add" class="gcalinp" placeholder="🔍 Cerca calendar.*…" autocomplete="off">
          <div style="margin-top:5px;padding:7px 10px;border-radius:8px;background:rgba(96,165,250,.05);border:1px solid rgba(96,165,250,.14);font-size:10px;color:rgba(255,255,255,.7)">
            💡 Usa entità <strong style="color:#60a5fa">calendar.*</strong> di Home Assistant (Google Calendar, calendario locale, ecc.). Il popup mostra il prossimo evento per ogni calendario.
          </div>
          <div style="height:18px"></div>
        </div>
        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gcalcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#60a5fa;color:#00091a;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gcalcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#gcalcfg-body');
      const saved = prevBody ? prevBody.scrollTop : 0;
      ov.innerHTML = renderForm();
      _firstRender = false;
      const nb = ov.querySelector('#gcalcfg-body'); if (nb && saved > 0) nb.scrollTop = saved;

      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);
      ov.querySelector('#gcalcfg-close').onclick = closeOv;
      ov.querySelector('#gcalcfg-cancel').onclick = closeOv;

      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => { ents.splice(parseInt(btn.dataset.del), 1); attach(); });
      });

      const addInp = ov.querySelector('#gcalcfg-add');
      if (addInp) {
        _setupAc(addInp, _calMatches, (id, name) => {
          if (!ents.find(e => (e.entity||e) === id)) ents.push({ entity: id, label: name||'' });
          addInp.value = '';
          attach();
        });
      }

      ov.querySelector('#gcalcfg-save').addEventListener('click', () => {
        const newCfg = {
          label:    (ov.querySelector('#gcalcfg-label')?.value || 'Calendario').trim(),
          color:    ov.querySelector('#gcalcfg-color')?.value || '#60a5fa',
          entities: ents.filter(e => e.entity||e).map(e => ({ entity:(e.entity||e).trim(), label:e.label||'' })),
        };
        closeOv();
        if (typeof onSave === 'function') onSave(newCfg);
      });
    }

    attach();
    document.body.appendChild(ov);
  }

  /* ─── registrazione ─── */
  const CARD = {
    id: ID, name: 'Gruppo Calendario', icon: 'mdi:calendar',
    desc: 'Chip calendario eventi Home Assistant. Mostra prossimo evento per ogni calendar.*, animazione se evento attivo ora.',
    version: '1.0', isDistintivo: true,
    defaultCfg: { label:'Calendario', icon:'mdi:calendar', color:'#60a5fa', entities:[] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-calendario v1.0'); } catch(e) {}
})();
