/* frarik-version: 5.0 */
;(function () {
  'use strict';

  /* ── helpers ── */
  function H() { try { const h = typeof window.frarikHass === 'function' ? window.frarikHass() : null; return h && h.states ? h : null; } catch(e) { return null; } }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function callSvc(d, s, data) { try { const h = H(); if (h && h.callService) h.callService(d, s, data || {}); } catch(e) {} }

  /* ── dati rifiuti ── */
  const DAYS  = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
  const DLBL  = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];
  const DFULL = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
  const TIPI  = [
    { id:'umido',    label:'Umido',    defColor:'#92400e' },
    { id:'secco',    label:'Secco',    defColor:'#374151' },
    { id:'carta',    label:'Carta',    defColor:'#1d4ed8' },
    { id:'plastica', label:'Plastica', defColor:'#d97706' },
    { id:'vetro',    label:'Vetro',    defColor:'#15803d' },
  ];
  const CKEY = 'frarik_diff_v5_clr';

  function getClrs() { try { return JSON.parse(localStorage.getItem(CKEY) || '{}'); } catch(e) { return {}; } }
  function getClr(id) { const c = getClrs(), t = TIPI.find(x => x.id === id); return c[id] || (t ? t.defColor : '#6b7280'); }
  function saveClr(id, v) { const c = getClrs(); c[id] = v; try { localStorage.setItem(CKEY, JSON.stringify(c)); } catch(e) {} }
  function shade(hex, n) {
    const x = parseInt(hex.replace('#',''), 16) || 0;
    const r = Math.max(0, Math.min(255, ((x >> 16) & 255) + n));
    const g = Math.max(0, Math.min(255, ((x >> 8)  & 255) + n));
    const b = Math.max(0, Math.min(255, (x & 255) + n));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2,'0')).join('');
  }
  function parseWastes(str) {
    if (!str || !str.trim()) return [];
    return str.split(',').map(s => s.trim().toLowerCase()).filter(s => TIPI.some(t => t.id === s));
  }
  function todayIdx() { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; }

  /* ── bidone SVG ultra-realistico ── */
  function binSvg(color, sz) {
    const uid  = 'dd' + color.replace('#','');
    const lgt  = shade(color, 55);
    const mid  = color;
    const drk  = shade(color, -45);
    const drk2 = shade(color, -65);
    const lid  = shade(color, 25);
    const lidH = shade(color, 60);
    return `<svg width="${sz}" height="${Math.round(sz*1.25)}" viewBox="0 0 100 126" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${uid}b" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${lgt}"/>
      <stop offset="30%"  stop-color="${mid}"/>
      <stop offset="100%" stop-color="${drk}"/>
    </linearGradient>
    <linearGradient id="${uid}l" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${lidH}"/>
      <stop offset="60%"  stop-color="${lid}"/>
      <stop offset="100%" stop-color="${drk}"/>
    </linearGradient>
    <linearGradient id="${uid}tb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(255,255,255,.06)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,.22)"/>
    </linearGradient>
    <filter id="${uid}sh" x="-15%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,.45)"/>
    </filter>
    <radialGradient id="${uid}lsp" cx="25%" cy="25%" r="65%">
      <stop offset="0%"   stop-color="rgba(255,255,255,.35)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <!-- ombra terreno -->
  <ellipse cx="50" cy="123" rx="32" ry="4.5" fill="rgba(0,0,0,.28)"/>
  <!-- assale -->
  <rect x="20" y="108" width="60" height="6" rx="3" fill="${drk2}"/>
  <!-- ruote -->
  <circle cx="26" cy="114" r="9" fill="${drk2}"/>
  <circle cx="74" cy="114" r="9" fill="${drk2}"/>
  <circle cx="26" cy="114" r="5.5" fill="#111"/>
  <circle cx="74" cy="114" r="5.5" fill="#111"/>
  <circle cx="26" cy="114" r="2"   fill="#222"/>
  <circle cx="74" cy="114" r="2"   fill="#222"/>
  <line x1="26" y1="108.5" x2="26" y2="119.5" stroke="#333" stroke-width=".8"/>
  <line x1="20.5" y1="114" x2="31.5" y2="114" stroke="#333" stroke-width=".8"/>
  <line x1="74" y1="108.5" x2="74" y2="119.5" stroke="#333" stroke-width=".8"/>
  <line x1="68.5" y1="114" x2="79.5" y2="114" stroke="#333" stroke-width=".8"/>
  <circle cx="24" cy="112" r="1.2" fill="rgba(255,255,255,.25)"/>
  <circle cx="72" cy="112" r="1.2" fill="rgba(255,255,255,.25)"/>
  <!-- corpo principale (trapezio: stretto in alto, largo in basso) -->
  <path d="M20 30 L14 105 Q14 110 21 110 H79 Q86 110 86 105 L80 30 Z" fill="url(#${uid}b)" filter="url(#${uid}sh)"/>
  <path d="M20 30 L14 105 Q14 110 21 110 H79 Q86 110 86 105 L80 30 Z" fill="url(#${uid}tb)"/>
  <!-- highlight bordo sinistro -->
  <path d="M20 30 L14 105 Q14 110 21 110 H24 L18 30 Z" fill="rgba(255,255,255,.18)"/>
  <!-- ombra bordo destro -->
  <path d="M80 30 L86 105 Q86 110 79 110 H76 L82 30 Z" fill="rgba(0,0,0,.22)"/>
  <!-- ribs orizzontali -->
  <path d="M16 48 Q50 45 84 48" stroke="rgba(0,0,0,.18)" stroke-width="2" fill="none"/>
  <path d="M16 47 Q50 44 84 47" stroke="rgba(255,255,255,.07)" stroke-width="1" fill="none"/>
  <path d="M15 65 Q50 62 85 65" stroke="rgba(0,0,0,.18)" stroke-width="2" fill="none"/>
  <path d="M15 64 Q50 61 85 64" stroke="rgba(255,255,255,.07)" stroke-width="1" fill="none"/>
  <path d="M15 82 Q50 79 85 82" stroke="rgba(0,0,0,.18)" stroke-width="2" fill="none"/>
  <path d="M15 81 Q50 78 85 81" stroke="rgba(255,255,255,.07)" stroke-width="1" fill="none"/>
  <path d="M14 99 Q50 96 86 99" stroke="rgba(0,0,0,.18)" stroke-width="2" fill="none"/>
  <!-- pannello frontale etichetta -->
  <rect x="28" y="52" width="44" height="24" rx="4" fill="rgba(255,255,255,.09)"/>
  <rect x="28" y="52" width="44" height="4"  rx="4" fill="rgba(255,255,255,.18)"/>
  <!-- bordo coperchio (rim) -->
  <rect x="13" y="22" width="74" height="10" rx="5" fill="${drk}"/>
  <rect x="13" y="22" width="74" height="4"  rx="5" fill="rgba(255,255,255,.15)"/>
  <!-- coperchio -->
  <rect x="11" y="10" width="78" height="14" rx="6" fill="url(#${uid}l)"/>
  <!-- speculare coperchio -->
  <rect x="11" y="10" width="78" height="14" rx="6" fill="url(#${uid}lsp)"/>
  <!-- cerniera -->
  <rect x="38" y="9" width="24" height="4" rx="2" fill="${drk2}"/>
  <!-- manico -->
  <path d="M34 3 Q50 -1 66 3 L66 10 Q50 6 34 10 Z" fill="${drk}"/>
  <path d="M34 3 Q50 -1 66 3 L66 5.5 Q50 1.5 34 5.5 Z" fill="rgba(255,255,255,.25)"/>
</svg>`;
  }

  function emptyBinSvg(sz) {
    return `<svg width="${sz}" height="${Math.round(sz*1.25)}" viewBox="0 0 100 126" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="50" cy="123" rx="32" ry="4.5" fill="rgba(255,255,255,.04)"/>
  <rect x="20" y="108" width="60" height="6" rx="3" fill="rgba(255,255,255,.05)"/>
  <circle cx="26" cy="114" r="9" fill="rgba(255,255,255,.05)"/>
  <circle cx="74" cy="114" r="9" fill="rgba(255,255,255,.05)"/>
  <path d="M20 30 L14 105 Q14 110 21 110 H79 Q86 110 86 105 L80 30 Z" fill="rgba(255,255,255,.04)"/>
  <rect x="13" y="22" width="74" height="10" rx="5" fill="rgba(255,255,255,.05)"/>
  <rect x="11" y="10" width="78" height="14" rx="6" fill="rgba(255,255,255,.06)"/>
  <path d="M30 40 L70 90 M70 40 L30 90" stroke="rgba(255,255,255,.1)" stroke-width="4" stroke-linecap="round"/>
</svg>`;
  }

  /* ── popup helpers (stile elettrodomestici) ── */
  function mkOv(html, closeId) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    const close = function() { try { document.body.removeChild(ov); } catch(e) {} };
    const btn = ov.querySelector('#' + closeId); if (btn) btn.addEventListener('click', close);
    ov.addEventListener('click', function(e) { if (e.target === ov) close(); });
    ov._close = close;
    return ov;
  }
  const POP_CSS = '<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc{overflow-y:auto;scrollbar-width:none}.fcpc::-webkit-scrollbar{display:none}</style>';
  function popShell(icon, rgb, title, sub, closeId, content) {
    return POP_CSS + '<div style="width:100%;max-height:82vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + rgb + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.3)">' + icon + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#fff">' + title + '</div><div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:1px">' + sub + '</div></div>'
      + '<button id="' + closeId + '" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      + '</div>'
      + '<div class="fcpc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }
  function sttl(t) {
    return '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.45);margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.06)">' + t + '</div>';
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H();
    const rid = 'frd' + (card.id || Math.random().toString(36).slice(2,8));

    const ti = todayIdx();
    const tmrI = (ti + 1) % 7;
    const todayWastes = parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + DAYS[ti]) || '');
    const tmrWastes   = parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + DAYS[tmrI]) || '');
    const hasPickup   = todayWastes.length > 0;

    /* status pill */
    const statusLabel = hasPickup ? 'RACCOLTA' : 'NESSUN RITIRO';
    const statusCol   = hasPickup ? '34,197,94' : '100,116,139';

    /* bidoni hero */
    const binSz = todayWastes.length <= 1 ? 82 : todayWastes.length === 2 ? 66 : 52;
    let binsHtml = '';
    if (!hasPickup) {
      binsHtml = '<div style="display:flex;justify-content:center">' + emptyBinSvg(72) + '</div>';
    } else {
      binsHtml = '<div style="display:flex;align-items:flex-end;justify-content:center;gap:4px">'
        + todayWastes.map(function(id) { return binSvg(getClr(id), binSz); }).join('')
        + '</div>';
    }

    /* colonna destra */
    function wasteChip(id) {
      const t = TIPI.find(function(x) { return x.id === id; });
      const c = getClr(id);
      return '<div style="display:flex;align-items:center;gap:6px;padding:5px 0">'
        + '<div style="width:10px;height:10px;border-radius:50%;background:' + c + ';flex-shrink:0;box-shadow:0 0 6px ' + c + '88"></div>'
        + '<span style="font-size:13px;font-weight:700;color:#fff">' + (t ? t.label : id) + '</span>'
        + '</div>';
    }
    const tonight = hasPickup
      ? '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.4);margin-bottom:5px">Questa sera</div>'
        + todayWastes.map(wasteChip).join('')
      : '<div style="font-size:11px;color:rgba(255,255,255,.3);padding:6px 0">Nessun ritiro</div>';

    const tomorrow = tmrWastes.length
      ? '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.4);margin-top:10px;margin-bottom:5px">Per domani (' + DFULL[tmrI] + ')</div>'
        + tmrWastes.map(wasteChip).join('')
      : '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.4);margin-top:10px;margin-bottom:5px">Per domani</div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,.3);padding:6px 0">Nessun ritiro</div>';

    /* settimana mini */
    const weekHtml = DAYS.map(function(d, i) {
      const ws = parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + d) || '');
      const isToday = i === ti;
      const dots = ws.length
        ? ws.map(function(id) {
            return '<div style="width:7px;height:7px;border-radius:50%;background:' + getClr(id) + '"></div>';
          }).join('')
        : '<div style="width:7px;height:2px;border-radius:1px;background:rgba(255,255,255,.12);margin:2px auto"></div>';
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 2px;border-radius:7px;background:' + (isToday ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.02)') + ';border:1px solid ' + (isToday ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.05)') + '">'
        + '<div style="font-size:7px;font-weight:' + (isToday ? '800' : '600') + ';color:' + (isToday ? '#fff' : 'rgba(255,255,255,.4)') + '">' + DLBL[i] + '</div>'
        + '<div style="display:flex;flex-direction:column;align-items:center;gap:1px">' + dots + '</div>'
        + '</div>';
    }).join('');

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:260px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(34,197,94,.06) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.22)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;max-height:140px}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;justify-content:flex-start;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:12px;overflow:hidden}'
      + '#' + rid + ' .fc-week{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin:0 14px 10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.05)}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 12px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.3);color:#4ade80}'
      + '#' + rid + ' [data-sya]{cursor:pointer}'
      + '</style>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">🗑️</div>'
      + '<div class="fc-hdr-tit">Raccolta Differenziata</div>'
      + '<div class="fc-hdr-pill" style="background:rgba(' + statusCol + ',.1);border:1px solid rgba(' + statusCol + ',.28);color:rgb(' + statusCol + ')">'
      + statusLabel + '</div>'
      + '</div>'
      + '<div class="fc-scroll">'
      + '<div class="fc-hero">'
      + '<div class="fc-hero-img">' + binsHtml + '</div>'
      + '<div class="fc-hero-r">'
      + tonight
      + tomorrow
      + '</div>'
      + '</div>'
      + '<div class="fc-week">' + weekHtml + '</div>'
      + '<div class="fc-btns">'
      + '<div class="fc-btn" data-sya="popup-imp">⚙ Impostazioni</div>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  /* ── MOUNT / UPDATE / EVENTS ── */
  function mount(card, hass, el) {
    el.addEventListener('click', function(e) {
      const t = e.target.closest('[data-sya]');
      if (!t) return;
      const a = t.getAttribute('data-sya');
      if (a === 'popup-imp') openImpostazioni(card);
    });
  }
  function update(card, hass, el) {}

  /* ── POPUP IMPOSTAZIONI ── */
  function openImpostazioni(card) {
    const h = H();

    /* stato locale giorni */
    const dayState = {};
    DAYS.forEach(function(d) {
      dayState[d] = new Set(parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + d) || ''));
    });

    const pushOn   = S(h, 'input_boolean.frarik_differenziata_notifica_push')   === 'on';
    const alexaOn  = S(h, 'input_boolean.frarik_differenziata_notifica_alexa')  === 'on';
    const googleOn = S(h, 'input_boolean.frarik_differenziata_notifica_google') === 'on';
    const notifT   = (S(h, 'input_datetime.frarik_differenziata_orario_notifica') || '00:00:00').slice(0,5);

    /* pills giorni */
    function renderGiorni() {
      return DAYS.map(function(d, i) {
        var pills = TIPI.map(function(t) {
          var sel = dayState[d].has(t.id);
          var bc = sel ? getClr(t.id) : 'rgba(255,255,255,.12)';
          var bg = sel ? 'rgba(' + parseInt(getClr(t.id).slice(1,3),16)+','+parseInt(getClr(t.id).slice(3,5),16)+','+parseInt(getClr(t.id).slice(5,7),16)+',.15)' : 'rgba(255,255,255,.04)';
          var fc = sel ? '#fff' : 'rgba(255,255,255,.5)';
          return '<button data-di="' + d + '" data-ti="' + t.id + '" style="padding:4px 9px;border-radius:20px;border:1.5px solid ' + bc + ';background:' + bg + ';color:' + fc + ';font-size:11px;font-weight:700;cursor:pointer;font-family:system-ui">' + t.label + '</button>';
        }).join('');
        return '<div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
          + '<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.45);width:22px;flex-shrink:0">' + DLBL[i] + '</div>'
          + '<div style="display:flex;gap:4px;flex-wrap:wrap">' + pills + '</div>'
          + '</div>';
      }).join('');
    }

    /* swatches colori */
    const PALETTE = ['#92400e','#b45309','#d97706','#16a34a','#15803d','#1d4ed8','#2563eb','#4b5563','#374151','#7c3aed','#db2777','#e11d48'];
    function renderColori() {
      return TIPI.map(function(t) {
        var cur = getClr(t.id);
        var sws = PALETTE.map(function(c) {
          var active = c === cur ? ';outline:2px solid #fff;outline-offset:1px;transform:scale(1.15)' : '';
          return '<div data-ci="' + t.id + '" data-cv="' + c + '" style="width:20px;height:20px;border-radius:50%;background:' + c + ';cursor:pointer;flex-shrink:0' + active + '"></div>';
        }).join('');
        return '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
          + '<div style="font-size:12px;font-weight:700;color:#fff;width:60px;flex-shrink:0">' + t.label + '</div>'
          + '<div style="display:flex;gap:4px;flex-wrap:wrap;flex:1">' + sws
          + '<input type="color" data-ci="' + t.id + '" value="' + cur + '" style="width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,.15);cursor:pointer;padding:0;background:none;flex-shrink:0" title="Colore personalizzato">'
          + '</div>'
          + '</div>';
      }).join('');
    }

    /* toggle */
    function tog(id, on, lbl, sub) {
      var onCs = on ? 'background:#22c55e' : 'background:rgba(255,255,255,.15)';
      var knob = on ? 'left:20px' : 'left:3px';
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        + '<div><div style="font-size:13px;font-weight:700;color:#fff">' + lbl + '</div><div style="font-size:10px;color:rgba(255,255,255,.4)">' + sub + '</div></div>'
        + '<div data-tg="' + id + '" style="width:38px;height:22px;border-radius:11px;' + onCs + ';cursor:pointer;position:relative;flex-shrink:0;transition:background .2s">'
        + '<div style="position:absolute;top:3px;' + knob + ';width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s"></div>'
        + '</div>'
        + '</div>';
    }

    /* salva btn */
    const saveBtn = '<button id="dd-save" style="width:100%;margin-top:14px;padding:14px;border-radius:13px;background:#22c55e;border:none;color:#060d14;font-size:14px;font-weight:900;cursor:pointer;font-family:system-ui">💾 Salva impostazioni</button>';

    const content = sttl('🗓 Giorni — scegli i rifiuti (multiplo)')
      + '<div id="dd-giorni">' + renderGiorni() + '</div>'
      + sttl('🎨 Colori per tipo')
      + '<div id="dd-colori">' + renderColori() + '</div>'
      + sttl('🔔 Notifiche')
      + tog('push',   pushOn,   '📱 Push',   'Notifica app mobile')
      + tog('alexa',  alexaOn,  '🗣 Alexa',  'Annuncio vocale Alexa')
      + tog('google', googleOn, '🔊 Google', 'Annuncio vocale Google')
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0">'
      + '<div><div style="font-size:13px;font-weight:700;color:#fff">⏰ Orario</div><div style="font-size:10px;color:rgba(255,255,255,.4)">Il giorno della raccolta</div></div>'
      + '<input type="time" id="dd-time" value="' + notifT + '" style="height:30px;padding:0 8px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:13px;font-family:system-ui">'
      + '</div>'
      + saveBtn;

    var ov = mkOv(popShell('🗑️', '34,197,94', 'Impostazioni Differenziata', 'Giorni, colori, notifiche', 'dd-close', content), 'dd-close');

    /* pill click */
    ov.querySelector('#dd-giorni').addEventListener('click', function(e) {
      var p = e.target.closest('[data-di]'); if (!p) return;
      var d = p.dataset.di, tid = p.dataset.ti;
      if (dayState[d].has(tid)) dayState[d].delete(tid); else dayState[d].add(tid);
      ov.querySelector('#dd-giorni').innerHTML = renderGiorni();
    });

    /* swatch click */
    ov.querySelector('#dd-colori').addEventListener('click', function(e) {
      var sw = e.target.closest('[data-ci][data-cv]'); if (!sw) return;
      saveClr(sw.dataset.ci, sw.dataset.cv);
      ov.querySelector('#dd-colori').innerHTML = renderColori();
      ov.querySelector('#dd-giorni').innerHTML = renderGiorni();
    });
    ov.querySelector('#dd-colori').addEventListener('input', function(e) {
      var inp = e.target.closest('input[type="color"][data-ci]'); if (!inp) return;
      saveClr(inp.dataset.ci, inp.value);
      ov.querySelector('#dd-giorni').innerHTML = renderGiorni();
    });

    /* toggle click */
    ov.addEventListener('click', function(e) {
      var tg = e.target.closest('[data-tg]'); if (!tg) return;
      var on = tg.style.background === 'rgb(34, 197, 94)';
      tg.style.background = on ? 'rgba(255,255,255,.15)' : 'rgb(34,197,94)';
      var knob = tg.querySelector('div');
      if (knob) knob.style.left = on ? '3px' : '20px';
    });

    /* salva */
    ov.querySelector('#dd-save').addEventListener('click', function() {
      /* giorni */
      DAYS.forEach(function(d) {
        callSvc('input_text', 'set_value', { entity_id: 'input_text.frarik_differenziata_rifiuto_' + d, value: [...dayState[d]].join(',') });
      });
      /* notifiche toggles */
      ov.querySelectorAll('[data-tg]').forEach(function(tg) {
        var id = tg.dataset.tg;
        var on = tg.style.background === 'rgb(34,197,94)' || tg.style.background === 'rgb(34, 197, 94)';
        callSvc('input_boolean', on ? 'turn_on' : 'turn_off', { entity_id: 'input_boolean.frarik_differenziata_notifica_' + id });
      });
      /* orario */
      var tv = ov.querySelector('#dd-time'); if (tv && tv.value) callSvc('input_datetime', 'set_datetime', { entity_id: 'input_datetime.frarik_differenziata_orario_notifica', time: tv.value + ':00' });
      /* feedback */
      var sb = ov.querySelector('#dd-save');
      sb.textContent = '✅ Salvato!'; sb.style.background = 'rgba(34,197,94,.6)';
      setTimeout(function() { sb.textContent = '💾 Salva impostazioni'; sb.style.background = '#22c55e'; }, 2000);
    });
  }

  /* ── PKG YAML embedded ── */
  var _DIFF_PKG = [
    'homeassistant:',
    '  customize:',
    '    package.node_anchors:',
    '      customize: &customize',
    '        package: "Frarik — Raccolta Differenziata 2.0"',
    'notify:',
    '  - name: frarik_differenziata',
    '    platform: group',
    '    services:',
    '      - service: IL_TUO_MOBILE_APP_1',
    'input_text:',
    '  frarik_differenziata_rifiuto_lunedi:    {name: "Differenziata — Lunedì",    icon: mdi:recycle, max: 255}',
    '  frarik_differenziata_rifiuto_martedi:   {name: "Differenziata — Martedì",   icon: mdi:recycle, max: 255}',
    '  frarik_differenziata_rifiuto_mercoledi: {name: "Differenziata — Mercoledì", icon: mdi:recycle, max: 255}',
    '  frarik_differenziata_rifiuto_giovedi:   {name: "Differenziata — Giovedì",   icon: mdi:recycle, max: 255}',
    '  frarik_differenziata_rifiuto_venerdi:   {name: "Differenziata — Venerdì",   icon: mdi:recycle, max: 255}',
    '  frarik_differenziata_rifiuto_sabato:    {name: "Differenziata — Sabato",    icon: mdi:recycle, max: 255}',
    '  frarik_differenziata_rifiuto_domenica:  {name: "Differenziata — Domenica",  icon: mdi:recycle, max: 255}',
    'input_datetime:',
    '  frarik_differenziata_orario_notifica:',
    '    name: "Orario Notifica Differenziata"',
    '    has_date: false',
    '    has_time: true',
    'input_boolean:',
    '  frarik_differenziata_notifica_push:   {name: "Differenziata — Push",   icon: mdi:cellphone-message}',
    '  frarik_differenziata_notifica_google: {name: "Differenziata — Google", icon: mdi:google-assistant}',
    '  frarik_differenziata_notifica_alexa:  {name: "Differenziata — Alexa",  icon: mdi:amazon-alexa}',
    'template:',
    '  - sensor:',
    '      - name: frarik_differenziata_versione',
    '        state: "2.0"',
    '        unique_id: frarik_differenziata_versione',
    '      - name: frarik_differenziata_raccolta',
    '        unique_id: frarik_differenziata_raccolta',
    '        state: >',
    '          {% set wd = now().weekday() %}',
    '          {% set g = ["lunedi","martedi","mercoledi","giovedi","venerdi","sabato","domenica"] %}',
    '          {{ states("input_text.frarik_differenziata_rifiuto_" + g[wd]) }}',
  ].join('\n');

  /* ── registrazione store ── */
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry['differenziata-card'] = {
    id: 'differenziata-card',
    name: 'Raccolta Differenziata',
    description: 'Card rifiuti differenziata con multi-selezione per giorno, bidoni realistici e colori personalizzabili.',
    icon: 'mdi:recycle',
    version: '5.0',
    frarik_pkg_check: 'sensor.frarik_differenziata_versione',
    frarik_pkg_id: 'frarik_differenziata',
    frarik_pkg_version: '2.0',
    render:  render,
    mount:   mount,
    update:  update,
    pkgYaml: function() { return _DIFF_PKG; }
  };
})();
