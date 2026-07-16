/* frarik-version: 1.2 */
/**
 * GruppoAllagamento.js — Distintivo FratechStore v1.1
 * Chip sensori allagamento/umidità — verde/blu se asciutto, rosso animato se allagamento
 */
(function () {
  'use strict';

  const ID = 'gruppo-allagamento';
  const ON_STATES = ['on','wet','detected','moisture'];

  function H() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    return null;
  }
  function loadCfg(cfg) { return cfg && typeof cfg === 'object' ? cfg : {}; }
  function nameOf(h, id) {
    const s = h && h.states && h.states[id];
    return (s && s.attributes && s.attributes.friendly_name) || (id && id.includes('.') ? id.split('.')[1].replace(/_/g,' ') : (id||''));
  }
  function stateOf(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || 'unknown'; }
  function isOn(h, id) { return ON_STATES.includes(stateOf(h, id).toLowerCase()); }
  function eh(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function liveH(rawHass) { return H() || (rawHass && rawHass.states ? rawHass : null); }

  function _timeAgo(isoStr) {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    if (diff < 60000) return 'adesso';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + ' min fa';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h fa';
    return Math.floor(hrs / 24) + 'g fa';
  }

  /* ─── chip icon SVG (piccola, cambia stato) ─── */
  function _chipSvg(isAlert) {
    if (!isAlert) {
      return `<svg viewBox="0 0 22 30" width="14" height="19" style="display:inline-block;vertical-align:middle;overflow:visible">
        <defs>
          <linearGradient id="gaChDg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#7dd3fc" stop-opacity=".6"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity=".2"/>
          </linearGradient>
        </defs>
        <path d="M11,2C11,2 19,13 19,19A8,8 0,0,1 3,19C3,13 11,2 11,2Z" fill="url(#gaChDg)" stroke="#38bdf8" stroke-width="1.2"/>
        <path d="M8,18L10.5,21L15,14" stroke="#4ade80" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 22 30" width="14" height="19" style="display:inline-block;vertical-align:middle;overflow:visible">
      <style>@keyframes gaChPu11{0%,100%{filter:drop-shadow(0 0 2px rgba(248,113,113,.5))}50%{filter:drop-shadow(0 0 8px rgba(248,113,113,.95))}}</style>
      <defs>
        <linearGradient id="gaChWetG" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fca5a5" stop-opacity=".9"/>
          <stop offset="100%" stop-color="#dc2626" stop-opacity=".7"/>
        </linearGradient>
      </defs>
      <path d="M11,2C11,2 19,13 19,19A8,8 0,0,1 3,19C3,13 11,2 11,2Z" fill="url(#gaChWetG)" stroke="#f87171" stroke-width="1.2" style="animation:gaChPu11 .85s ease-in-out infinite"/>
      <text x="11" y="22" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" font-family="system-ui">!</text>
    </svg>`;
  }

  /* ─── chip() ─── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    let isAlert = false, value = '—';
    if (c.pk_group) {
      isAlert = h ? isOn(h, c.pk_group) : false;
      value = isAlert ? 'ALLAGATO' : 'OK';
    } else if (ents.length) {
      const wetCount = h ? ents.filter(e => isOn(h, e.entity)).length : 0;
      isAlert = wetCount > 0;
      value = `${wetCount}/${ents.length}`;
    }

    const _fcr = window.FratechColorRules;
    const _cond = { alert: isAlert, ok: !isAlert };
    return {
      icon: _chipSvg(isAlert),
      label: c.label || 'Allagamento',
      value,
      color: (_fcr && _fcr.evalColor(cfg, _cond)) || (isAlert ? '#f87171' : '#4ade80'),
      borderColor: _fcr && _fcr.evalBorderColor(cfg, _cond),
    };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const ids = ents.map(e => e.entity).filter(Boolean);
    if (c.pk_group) ids.unshift(c.pk_group);
    return [...new Set(ids)];
  }

  /* ─── SVG goccia singolo sensore ─── */
  function _sensorSvg(isWet, idx) {
    const s = `gaS${idx}`;
    if (!isWet) {
      return `<svg viewBox="0 0 56 80" width="42" height="60" style="display:block;overflow:visible">
        <defs>
          <linearGradient id="${s}dg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#bae6fd" stop-opacity=".55"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity=".18"/>
          </linearGradient>
          <clipPath id="${s}c"><path d="M28,5C28,5 46,32 46,46A18,18 0,0,1 10,46C10,32 28,5 28,5Z"/></clipPath>
        </defs>
        <!-- glow ring sottile -->
        <path d="M28,4C28,4 48,32 48,47A20,20 0,0,1 8,47C8,32 28,4 28,4Z" fill="none" stroke="rgba(56,189,248,.18)" stroke-width="3"/>
        <!-- corpo goccia -->
        <path d="M28,5C28,5 46,32 46,46A18,18 0,0,1 10,46C10,32 28,5 28,5Z" fill="url(#${s}dg)" stroke="#38bdf8" stroke-width="1.4"/>
        <!-- riflesso interno -->
        <path d="M19,27Q28,19 37,27" stroke="rgba(255,255,255,.38)" stroke-width="1.3" fill="none"/>
        <!-- luccichio obliquo -->
        <line x1="33" y1="12" x2="38" y2="22" stroke="rgba(255,255,255,.2)" stroke-width="1" stroke-linecap="round"/>
        <!-- cerchio checkmark -->
        <circle cx="28" cy="63" r="9.5" fill="rgba(74,222,128,.1)" stroke="rgba(74,222,128,.55)" stroke-width="1.3"/>
        <path d="M23.5,63L27,67L33,56.5" stroke="#4ade80" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }

    return `<style>
      @keyframes ${s}Wv{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes ${s}Pu{0%,100%{transform:scale(1);filter:drop-shadow(0 0 3px rgba(248,113,113,.3))}50%{transform:scale(1.07);filter:drop-shadow(0 0 10px rgba(248,113,113,.75))}}
      @keyframes ${s}Rg{0%{transform:scale(1);opacity:.45}100%{transform:scale(1.3);opacity:0}}
      @keyframes ${s}Dr{0%{transform:translateY(0);opacity:.95}70%{opacity:.4}100%{transform:translateY(18px);opacity:0}}
    </style>
    <svg viewBox="0 0 56 80" width="42" height="60" style="display:block;overflow:visible">
      <defs>
        <clipPath id="${s}c"><path d="M28,5C28,5 46,32 46,46A18,18 0,0,1 10,46C10,32 28,5 28,5Z"/></clipPath>
        <linearGradient id="${s}wg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fca5a5" stop-opacity=".85"/>
          <stop offset="100%" stop-color="#dc2626" stop-opacity=".6"/>
        </linearGradient>
      </defs>
      <!-- anello pulsante esterno -->
      <path d="M28,3C28,3 49,32 49,47A21,21 0,0,1 7,47C7,32 28,3 28,3Z" fill="none" stroke="rgba(248,113,113,.35)" stroke-width="3.5" style="animation:${s}Rg 1.4s ease-out infinite"/>
      <!-- corpo goccia riempito rosso -->
      <path d="M28,5C28,5 46,32 46,46A18,18 0,0,1 10,46C10,32 28,5 28,5Z" fill="url(${s}wg)" stroke="#f87171" stroke-width="1.4" style="animation:${s}Pu 1.4s ease-in-out infinite"/>
      <!-- onde d'acqua all'interno (clippate) -->
      <g clip-path="url(#${s}c)">
        <rect x="0" y="34" width="56" height="20" fill="rgba(220,38,38,.3)"/>
        <path d="M-10,37Q4,32 18,37Q32,42 46,37Q60,32 74,37" stroke="rgba(252,165,165,.9)" stroke-width="2" fill="none" style="animation:${s}Wv 1.5s linear infinite"/>
        <path d="M-10,43Q4,38 18,43Q32,48 46,43Q60,38 74,43" stroke="rgba(248,113,113,.55)" stroke-width="1.5" fill="none" style="animation:${s}Wv 1.5s linear .5s infinite"/>
      </g>
      <!-- riflesso (attenuato) -->
      <path d="M19,23Q28,15 37,23" stroke="rgba(255,255,255,.18)" stroke-width="1.3" fill="none"/>
      <!-- gocce che cadono -->
      <ellipse cx="28" cy="51" rx="2.5" ry="3.5" fill="#fca5a5" style="animation:${s}Dr 1.7s ease-in infinite .1s"/>
      <ellipse cx="21" cy="50" rx="1.8" ry="2.5" fill="#f87171" style="animation:${s}Dr 1.7s ease-in infinite .85s"/>
      <ellipse cx="35" cy="50" rx="1.5" ry="2" fill="#f87171" style="animation:${s}Dr 1.7s ease-in infinite 1.4s"/>
      <!-- badge alert -->
      <circle cx="28" cy="68" r="9.5" fill="rgba(248,113,113,.18)" stroke="#f87171" stroke-width="1.3"/>
      <text x="28" y="73" text-anchor="middle" font-size="12" font-weight="900" fill="#f87171" font-family="system-ui">!</text>
    </svg>`;
  }

  /* ─── SVG hero per sensore gruppo (grande, larghezza piena) ─── */
  function _groupHeroSvg(isWet) {
    const s = 'gaHero11';
    if (!isWet) {
      return `<svg viewBox="0 0 260 80" style="width:100%;max-height:80px;display:block;overflow:visible">
        <defs>
          <linearGradient id="${s}Bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(7,89,133,.08)"/>
            <stop offset="100%" stop-color="rgba(56,189,248,.15)"/>
          </linearGradient>
          <linearGradient id="${s}Wt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(56,189,248,.3)"/>
            <stop offset="100%" stop-color="rgba(3,105,161,.12)"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="260" height="80" rx="12" fill="url(#${s}Bg)"/>
        <!-- acqua calma -->
        <path d="M0,54Q20,50 40,54Q60,58 80,54Q100,50 120,54Q140,58 160,54Q180,50 200,54Q220,58 240,54L260,54L260,80L0,80Z" fill="url(#${s}Wt)"/>
        <path d="M0,57Q20,53 40,57Q60,61 80,57Q100,53 120,57Q140,61 160,57Q180,53 200,57Q220,61 240,57" stroke="rgba(56,189,248,.5)" stroke-width="1.3" fill="none"/>
        <!-- casa -->
        <polygon points="65,52 65,33 90,18 115,33 115,52" fill="rgba(56,189,248,.07)" stroke="rgba(56,189,248,.45)" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="78" y="38" width="13" height="14" fill="rgba(56,189,248,.15)" stroke="rgba(56,189,248,.4)" stroke-width="1"/>
        <line x1="84.5" y1="38" x2="84.5" y2="52" stroke="rgba(56,189,248,.25)" stroke-width=".8"/>
        <!-- gocce piccole a sx (decor) -->
        <path d="M36,28C36,28 40,35 40,38A4,4 0,0,1 32,38C32,35 36,28 36,28Z" fill="rgba(56,189,248,.25)" stroke="rgba(56,189,248,.5)" stroke-width="1"/>
        <path d="M22,36C22,36 25,41 25,43A3,3 0,0,1 19,43C19,41 22,36 22,36Z" fill="rgba(56,189,248,.18)" stroke="rgba(56,189,248,.35)" stroke-width="1"/>
        <!-- cerchio check a dx -->
        <circle cx="196" cy="36" r="22" fill="rgba(74,222,128,.08)" stroke="rgba(74,222,128,.4)" stroke-width="1.5"/>
        <circle cx="196" cy="36" r="16" fill="rgba(74,222,128,.06)" stroke="rgba(74,222,128,.25)" stroke-width="1"/>
        <path d="M186,36L193,43.5L207,27" stroke="#4ade80" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- testo stato -->
        <text x="196" y="68" text-anchor="middle" font-size="11" font-weight="800" fill="#4ade80" font-family="system-ui" letter-spacing=".5">ASCIUTTO</text>
      </svg>`;
    }

    /* WET hero */
    return `<style>
      @keyframes ${s}Wv{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes ${s}Pu{0%,100%{opacity:.75}50%{opacity:1}}
      @keyframes ${s}Rp{0%{r:17;opacity:.6}100%{r:27;opacity:0}}
      @keyframes ${s}Tx{0%,100%{opacity:.85}50%{opacity:1}}
    </style>
    <svg viewBox="0 0 260 80" style="width:100%;max-height:80px;display:block;overflow:visible">
      <defs>
        <clipPath id="${s}Cl"><rect x="0" y="0" width="260" height="80" rx="12"/></clipPath>
        <linearGradient id="${s}Bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(127,29,29,.1)"/>
          <stop offset="100%" stop-color="rgba(248,113,113,.22)"/>
        </linearGradient>
        <linearGradient id="${s}Wt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(248,113,113,.55)"/>
          <stop offset="100%" stop-color="rgba(185,28,28,.35)"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="260" height="80" rx="12" fill="url(#${s}Bg)" style="animation:${s}Pu 1.5s ease-in-out infinite"/>
      <!-- acqua alluvionale animata -->
      <g clip-path="url(#${s}Cl)">
        <rect x="0" y="42" width="260" height="38" fill="url(#${s}Wt)"/>
        <path d="M-20,43Q0,37 26,43Q52,49 78,43Q104,37 130,43Q156,49 182,43Q208,37 234,43Q260,49 286,43" stroke="rgba(252,165,165,.85)" stroke-width="2.2" fill="none" style="animation:${s}Wv 1.8s linear infinite"/>
        <path d="M-20,51Q0,45 26,51Q52,57 78,51Q104,45 130,51Q156,57 182,51Q208,45 234,51Q260,57 286,51" stroke="rgba(248,113,113,.5)" stroke-width="1.6" fill="none" style="animation:${s}Wv 1.8s linear .65s infinite"/>
      </g>
      <!-- casa parzialmente sommersa -->
      <polygon points="65,42 65,27 90,13 115,27 115,42" fill="rgba(248,113,113,.06)" stroke="rgba(252,165,165,.4)" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- cerchio allarme -->
      <circle cx="196" cy="32" r="17" fill="rgba(248,113,113,.12)" stroke="rgba(248,113,113,.55)" stroke-width="1.5" style="animation:${s}Pu 1s ease-in-out infinite"/>
      <circle cx="196" cy="32" r="17" fill="none" stroke="rgba(248,113,113,.3)" stroke-width="5" style="animation:${s}Rp 1.6s ease-out infinite"/>
      <circle cx="196" cy="32" r="17" fill="none" stroke="rgba(248,113,113,.18)" stroke-width="5" style="animation:${s}Rp 1.6s ease-out infinite .55s"/>
      <text x="196" y="27" text-anchor="middle" font-size="16" font-weight="900" fill="#f87171" font-family="system-ui">!</text>
      <text x="196" y="40" text-anchor="middle" font-size="7" font-weight="800" fill="#fca5a5" font-family="system-ui" letter-spacing=".5">ALLARME</text>
      <!-- testo stato pulsante -->
      <text x="196" y="66" text-anchor="middle" font-size="12" font-weight="900" fill="#f87171" font-family="system-ui" letter-spacing=".8" style="animation:${s}Tx 1s ease-in-out infinite">ALLAGAMENTO!</text>
    </svg>`;
  }

  /* ─── render() ─── */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    /* sezione gruppo principale */
    let groupSection = '';
    if (c.pk_group) {
      const wet = h ? isOn(h, c.pk_group) : false;
      const name = nameOf(h, c.pk_group) || c.pk_group;
      const lastChanged = h && h.states && h.states[c.pk_group] && h.states[c.pk_group].last_changed;
      const timeStr = lastChanged ? _timeAgo(lastChanged) : '';
      const timeLabel = wet
        ? (timeStr === 'adesso' ? 'Rilevato adesso!' : `Allagato da ${timeStr}`)
        : (timeStr ? `Asciutto da ${timeStr}` : '');

      groupSection = `<div style="padding:12px 14px 10px">
        ${_groupHeroSvg(wet)}
        <div style="display:flex;align-items:center;gap:10px;margin-top:9px;padding:0 2px">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(name)}</div>
            ${timeLabel ? `<div style="font-size:10px;color:${wet?'#f87171':'rgba(255,255,255,.4)'};font-weight:${wet?'700':'400'};margin-top:2px">${eh(timeLabel)}</div>` : ''}
          </div>
          <div style="padding:5px 13px;border-radius:20px;background:${wet?'rgba(248,113,113,.18)':'rgba(74,222,128,.12)'};border:1px solid ${wet?'rgba(248,113,113,.55)':'rgba(74,222,128,.35)'};font-size:12px;font-weight:800;color:${wet?'#f87171':'#4ade80'};white-space:nowrap;flex-shrink:0">
            ${wet ? '🚨 Allagato!' : '✓ Asciutto'}
          </div>
        </div>
      </div>
      ${ents.length ? `<div style="height:1px;background:rgba(255,255,255,.07);margin:0 14px 4px"></div>` : ''}`;
    }

    /* righe sensori individuali */
    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const wet = h ? isOn(h, e.entity) : false;
      const lbl = e.label || nameOf(h, e.entity);
      const lastChanged = h && h.states && h.states[e.entity] && h.states[e.entity].last_changed;
      const timeStr = lastChanged ? _timeAgo(lastChanged) : '';
      const timeLabel = wet
        ? (timeStr === 'adesso' ? 'Rilevato adesso!' : `Allagato da ${timeStr}`)
        : (timeStr ? `Asciutto da ${timeStr}` : '');

      return `<div style="border-bottom:1px solid rgba(255,255,255,.04);${wet ? 'background:rgba(248,113,113,.04)' : ''}">
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px">
          <div style="flex-shrink:0">${_sensorSvg(wet, i)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            ${timeLabel ? `<div style="font-size:10px;color:${wet?'#f87171':'rgba(255,255,255,.4)'};margin-top:2px;font-weight:${wet?'700':'400'}">${eh(timeLabel)}</div>` : ''}
          </div>
          <div style="padding:4px 12px;border-radius:20px;background:${wet?'rgba(248,113,113,.15)':'rgba(74,222,128,.12)'};border:1px solid ${wet?'rgba(248,113,113,.4)':'rgba(74,222,128,.28)'};font-size:11px;font-weight:700;color:${wet?'#f87171':'#4ade80'};white-space:nowrap;flex-shrink:0">
            ${wet ? '⚠️ Allagato' : 'Asciutto'}
          </div>
        </div>
      </div>`;
    }).join('');

    const empty = !c.pk_group && !ents.length
      ? `<div style="padding:36px 20px;text-align:center;color:#fff;font-size:12px">Nessun sensore configurato.<br><span style="font-size:10px;color:rgba(255,255,255,.5)">Clicca ✏️ sulla chip per configurare.</span></div>`
      : '';

    return `<div id="gpall-popup-body">${groupSection}<div>${rows}${empty}</div></div>`;
  }

  /* ─── mount ─── */
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
    if (el._gaaPoll) return;
    el._gaaPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gaaPoll); delete el._gaaPoll; return; }
      try {
        const h = H(); if (!h) return;
        const sp = el.parentElement, st = sp ? sp.scrollTop : 0;
        el.innerHTML = render(cfg, h);
        _hideSubtitle(el);
        if (sp && st > 0) sp.scrollTop = st;
      } catch(e) {}
    }, 1500);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, rawHass || null); } catch(e) {}
  }

  /* ─── configure ─── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    let colorCfg = { mode: c.colorMode||'fixed', fixed: c.colorFixed||c.color||'#38bdf8', rules: Array.isArray(c.colorRules)?JSON.parse(JSON.stringify(c.colorRules)):[], borderMode: c.borderMode||'none', borderFixed: c.borderFixed||'#ffffff', borderRules: Array.isArray(c.borderRules)?JSON.parse(JSON.stringify(c.borderRules)):[] };
    const presets = [
      { key: 'alert',    label: 'Allarme allagamento attivo' },
      { key: 'ok',       label: 'Nessun allagamento (OK)' },
      { key: 'fallback', label: 'Sempre (fallback)' },
    ];
    let pkGroup = c.pk_group || '';
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
      const useAbove = spaceBelow < MAXH && rect.top > spaceBelow;
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#0a1628;border:1px solid rgba(56,189,248,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;flex-shrink:0">${m.icon||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.6)">${eh(m.id)}</div>
          </div>
        </div>`;
        r.addEventListener('mouseover', () => r.style.background='rgba(56,189,248,.08)');
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
        _openAc(inp, filterFn(q).slice(0,12), onPick);
      });
      inp.addEventListener('focus', () => {
        const q = (inp.value||'').toLowerCase().trim();
        if (q) _openAc(inp, filterFn(q).slice(0,12), onPick);
      });
      inp.addEventListener('blur', () => setTimeout(_closeAc, 160));
    }

    function _entityMatches(q) {
      if (!h || !h.states) return [];
      const lq = q.toLowerCase();
      return Object.keys(h.states)
        .filter(id => nameOf(h,id).toLowerCase().includes(lq) || id.toLowerCase().includes(lq))
        .map(id => {
          const dom = id.split('.')[0];
          const icons = { binary_sensor:'💧', group:'🔗', sensor:'📡' };
          return { id, name: nameOf(h,id), icon: icons[dom]||'📦' };
        })
        .sort((a,b) => {
          const rank = id => id.startsWith('group.') ? 0 : id.startsWith('binary_sensor.') ? 1 : 2;
          if (rank(a.id) !== rank(b.id)) return rank(a.id) - rank(b.id);
          return a.name.localeCompare(b.name);
        });
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch(e){} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key==='Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    function renderForm() {
      const pkGroupName = pkGroup && h ? nameOf(h, pkGroup) : '';
      const pkGroupWet = pkGroup && h ? isOn(h, pkGroup) : false;

      const selRows = ents.map((e, i) => {
        const lbl = e.label || nameOf(h, e.entity);
        const wet = h ? isOn(h, e.entity) : false;
        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid ${wet?'rgba(248,113,113,.35)':'rgba(255,255,255,.08)'};margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;flex-shrink:0">${wet?'🚨':'💧'}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:rgba(255,255,255,.5)">${eh(e.entity)}</div>
            </div>
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
          </div>
        </div>`;
      }).join('');

      const anim = _firstRender ? 'animation:gaaCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0d1a;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>
          @keyframes gaaCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .gaainp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit}
          .gaainp::placeholder{color:rgba(255,255,255,.45)}
          #gaacfg-body::-webkit-scrollbar{display:none}
        </style>

        <!-- intestazione -->
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(56,189,248,.13);border:1px solid rgba(56,189,248,.28);display:flex;align-items:center;justify-content:center;font-size:18px">💧</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800;color:#fff">Configura — Gruppo Allagamento</div>
          </div>
          <button id="gaacfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <div id="gaacfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">

          <!-- nome e colore chip -->
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.5);margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:16px">
            <div style="flex:1"><div style="font-size:9px;color:rgba(255,255,255,.6);margin-bottom:3px">Nome</div><input id="gaacfg-label" class="gaainp" placeholder="Allagamento" value="${eh(c.label||'Allagamento')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:rgba(255,255,255,.6);margin-bottom:3px">Colore</div><input type="color" id="gaacfg-color" value="${(c.color||'#38bdf8').match(/^#[0-9a-f]{6}$/i)?c.color:'#38bdf8'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>

          <!-- sensore gruppo principale -->
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.5);margin-bottom:6px">Sensore gruppo principale</div>
          ${pkGroup ? `
            <div style="padding:9px 11px;border-radius:9px;background:rgba(56,189,248,.06);border:1px solid ${pkGroupWet?'rgba(248,113,113,.4)':'rgba(56,189,248,.25)'};margin-bottom:8px;display:flex;align-items:center;gap:8px">
              <span style="font-size:16px">${pkGroupWet?'🚨':'🔗'}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(pkGroupName||pkGroup)}</div>
                <div style="font-size:9px;color:rgba(255,255,255,.5)">${eh(pkGroup)}</div>
              </div>
              <button id="gaacfg-del-group" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
            </div>
          ` : ''}
          <input id="gaacfg-add-group" class="gaainp" placeholder="🔍 Cerca group.* o binary_sensor.*…" autocomplete="off" value="${pkGroup&&!pkGroup?eh(pkGroup):''}">
          <div style="margin-top:5px;margin-bottom:16px;padding:7px 10px;border-radius:8px;background:rgba(56,189,248,.05);border:1px solid rgba(56,189,248,.14);font-size:10px;color:rgba(255,255,255,.7)">
            💡 Seleziona il <strong style="color:#38bdf8">group binary_sensor</strong> che aggrega tutti i sensori allagamento
          </div>

          ${window.FratechColorRules ? window.FratechColorRules.html(colorCfg, presets) : ''}
          <!-- sensori individuali -->
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.5);margin-bottom:6px">Sensori individuali${ents.length ? ` (${ents.length})` : ''}</div>
          ${ents.length ? `<div style="margin-bottom:10px">${selRows}</div>` : ''}
          <input id="gaacfg-add-entity" class="gaainp" placeholder="🔍 Cerca binary_sensor.*…" autocomplete="off">
          <div style="height:18px"></div>
        </div>

        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gaacfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#38bdf8;color:#060d14;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gaacfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#gaacfg-body');
      const savedScroll = prevBody ? prevBody.scrollTop : 0;
      ov.innerHTML = renderForm();
      _firstRender = false;
      const _fcr = window.FratechColorRules;
      if (_fcr) _fcr.attach(ov.querySelector('#fcr-section'), presets, () => { colorCfg = _fcr.read(ov.querySelector('#fcr-section')) || colorCfg; });
      const nb = ov.querySelector('#gaacfg-body');
      if (nb && savedScroll > 0) nb.scrollTop = savedScroll;

      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);
      ov.querySelector('#gaacfg-close').onclick = closeOv;
      ov.querySelector('#gaacfg-cancel').onclick = closeOv;

      const delGroup = ov.querySelector('#gaacfg-del-group');
      if (delGroup) delGroup.onclick = () => { pkGroup = ''; attach(); };

      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => { ents.splice(parseInt(btn.dataset.del), 1); attach(); });
      });

      const groupInp = ov.querySelector('#gaacfg-add-group');
      if (groupInp) {
        _setupAc(groupInp, _entityMatches, (id) => {
          pkGroup = id;
          groupInp.value = '';
          attach();
        });
      }

      const addInp = ov.querySelector('#gaacfg-add-entity');
      if (addInp) {
        _setupAc(addInp, _entityMatches, (id, name) => {
          if (!ents.find(e => e.entity === id)) ents.push({ entity: id, label: name||'' });
          addInp.value = '';
          attach();
        });
      }

      ov.querySelector('#gaacfg-save').addEventListener('click', () => {
        const _fcrData = _fcr ? (_fcr.read(ov.querySelector('#fcr-section')) || {}) : {};
        const newCfg = {
          ..._fcrData,
          label:    (ov.querySelector('#gaacfg-label')?.value || 'Allagamento').trim(),
          color:    ov.querySelector('#gaacfg-color')?.value || '#38bdf8',
          pk_group: pkGroup,
          entities: ents.filter(e => e.entity).map(e => ({ entity: e.entity.trim(), label: e.label||'' })),
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
    id: ID, name: 'Gruppo Allagamento', icon: 'mdi:water-alert',
    desc: 'Chip sensori allagamento. Chip blu/verde = asciutto, rosso pulsante = allarme. Popup con vista gruppo + sensori individuali.',
    version: '1.2', isDistintivo: true,
    defaultCfg: { label: 'Allagamento', icon: 'mdi:water-alert', color: '#38bdf8', pk_group: '', entities: [], colorMode: 'auto', colorRules: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-allagamento v1.1'); } catch(e) {}
})();
