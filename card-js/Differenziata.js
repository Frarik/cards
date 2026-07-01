/* frarik-version: 5.3 */
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

  /* ── bidone SVG ── */
  function binSvg(color, sz) {
    const uid = 'b' + color.replace(/[^0-9a-f]/gi,'').slice(0,6) + String(sz);
    const L   = shade(color,  68);
    const D   = shade(color, -48);
    const D2  = shade(color, -72);
    const lL  = shade(color,  42);
    const lD  = shade(color, -28);
    const h   = Math.round(sz * 1.46);
    return `<svg width="${sz}" height="${h}" viewBox="0 0 56 82" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${uid}bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${L}"/>
      <stop offset="32%"  stop-color="${color}"/>
      <stop offset="100%" stop-color="${D}"/>
    </linearGradient>
    <linearGradient id="${uid}ld" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${lL}"/>
      <stop offset="100%" stop-color="${lD}"/>
    </linearGradient>
    <filter id="${uid}sh" x="-25%" y="-10%" width="150%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="rgba(0,0,0,.55)"/>
    </filter>
  </defs>
  <!-- shadow -->
  <ellipse cx="28" cy="80" rx="19" ry="2.8" fill="rgba(0,0,0,.25)"/>
  <!-- axle -->
  <rect x="10" y="63" width="36" height="5" rx="2.5" fill="${D2}"/>
  <!-- left wheel -->
  <circle cx="15" cy="68" r="7.5" fill="${D2}"/>
  <circle cx="15" cy="68" r="4"   fill="#0c0c0c"/>
  <circle cx="13" cy="66" r="1.4" fill="rgba(255,255,255,.2)"/>
  <!-- right wheel -->
  <circle cx="41" cy="68" r="7.5" fill="${D2}"/>
  <circle cx="41" cy="68" r="4"   fill="#0c0c0c"/>
  <circle cx="39" cy="66" r="1.4" fill="rgba(255,255,255,.2)"/>
  <!-- body -->
  <path d="M12,23 L7,65 Q7,70 13,70 H43 Q49,70 49,65 L44,23 Z" fill="url(#${uid}bg)" filter="url(#${uid}sh)"/>
  <!-- left shine -->
  <path d="M12,23 L7,65 Q7,70 13,70 H16 L11,23 Z" fill="rgba(255,255,255,.26)"/>
  <!-- right shade -->
  <path d="M44,23 L49,65 Q49,70 43,70 H40 L45,23 Z" fill="rgba(0,0,0,.22)"/>
  <!-- lid rim -->
  <rect x="7"  y="16" width="42" height="9"  rx="4.5" fill="${D}"/>
  <!-- lid -->
  <rect x="4"  y="4"  width="48" height="14" rx="6"   fill="url(#${uid}ld)"/>
  <!-- lid gloss -->
  <rect x="8"  y="7"  width="20" height="4"  rx="2"   fill="rgba(255,255,255,.35)"/>
  <!-- hinge -->
  <rect x="20" y="3.5" width="16" height="4" rx="2"   fill="${D2}"/>
  <!-- handle bar -->
  <rect x="18" y="0"  width="20" height="5"  rx="2.5" fill="${D}"/>
  <rect x="20" y="0"  width="10" height="2"  rx="1"   fill="rgba(255,255,255,.28)"/>
</svg>`;
  }

  function emptyBinSvg(sz) {
    const h = Math.round(sz * 1.46);
    return `<svg width="${sz}" height="${h}" viewBox="0 0 56 82" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="28" cy="80" rx="19" ry="2.8" fill="rgba(255,255,255,.03)"/>
  <rect x="10" y="63" width="36" height="5" rx="2.5" fill="rgba(255,255,255,.05)"/>
  <circle cx="15" cy="68" r="7.5" fill="rgba(255,255,255,.05)"/>
  <circle cx="41" cy="68" r="7.5" fill="rgba(255,255,255,.05)"/>
  <path d="M12,23 L7,65 Q7,70 13,70 H43 Q49,70 49,65 L44,23 Z" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.1)" stroke-width="1.2"/>
  <rect x="7"  y="16" width="42" height="9"  rx="4.5" fill="rgba(255,255,255,.06)"/>
  <rect x="4"  y="4"  width="48" height="14" rx="6"   fill="rgba(255,255,255,.07)"/>
  <line x1="16" y1="32" x2="40" y2="60" stroke="rgba(255,255,255,.14)" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="40" y1="32" x2="16" y2="60" stroke="rgba(255,255,255,.14)" stroke-width="3.5" stroke-linecap="round"/>
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
    const h   = H();
    const rid = 'frd' + (card.id || Math.random().toString(36).slice(2,8));
    const ACC     = '#4ade80';
    const ACC_RGB = '74,222,128';

    const ti          = todayIdx();
    const tmrI        = (ti + 1) % 7;
    const todayWastes = parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + DAYS[ti])  || '');
    const tmrWastes   = parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + DAYS[tmrI]) || '');
    const hasPickup   = todayWastes.length > 0;
    const col         = hasPickup ? ACC : '#64748b';
    const colRgb      = hasPickup ? ACC_RGB : '100,116,139';

    /* conteggio settimana */
    var weekCount = 0;
    DAYS.forEach(function(d) {
      if (parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + d) || '').length) weekCount++;
    });

    /* prossima raccolta */
    var nextFull = '', nextAbbr = '', nextDaysAway = 0;
    for (var dd = 1; dd <= 7; dd++) {
      var ni = (ti + dd) % 7;
      if (parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + DAYS[ni]) || '').length) {
        nextFull = DFULL[ni]; nextAbbr = DLBL[ni]; nextDaysAway = dd; break;
      }
    }
    var nextLabel = nextFull
      ? (nextDaysAway === 1 ? 'Domani' : nextFull + ' (tra ' + nextDaysAway + ' gg)')
      : 'Nessuna';

    /* bidoni */
    const binSz = todayWastes.length <= 1 ? 90 : todayWastes.length === 2 ? 70 : 56;
    var binsHtml = hasPickup
      ? '<div style="display:flex;align-items:flex-end;justify-content:center;gap:4px;height:100%;width:100%">'
          + todayWastes.map(function(id) { return binSvg(getClr(id), binSz); }).join('') + '</div>'
      : emptyBinSvg(82);

    /* riga rifiuto (colonna destra) */
    function wasteRow(id) {
      var t = TIPI.find(function(x) { return x.id === id; }), c = getClr(id);
      return '<div class="fc-met"><span class="fc-met-lbl" style="display:flex;align-items:center;gap:6px">'
        + '<div style="width:8px;height:8px;border-radius:50%;background:' + c + ';box-shadow:0 0 5px ' + c + '88;flex-shrink:0"></div>'
        + (t ? t.label : id) + '</span></div>';
    }
    var tonightRows = hasPickup
      ? todayWastes.map(wasteRow).join('')
      : '<div class="fc-met"><span class="fc-met-lbl" style="color:rgba(255,255,255,.3)">Niente da esporre</span></div>';
    var tmrRows = tmrWastes.length
      ? tmrWastes.map(wasteRow).join('')
      : '<div class="fc-met"><span class="fc-met-lbl" style="color:rgba(255,255,255,.3)">Nessun ritiro</span></div>';

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(' + ACC_RGB + ',.08) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(' + ACC_RGB + ',.1);border:1px solid rgba(' + ACC_RGB + ',.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + col + (hasPickup ? ';box-shadow:0 0 5px ' + ACC + ';animation:fcPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;max-height:130px}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:5px;justify-content:flex-start;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      + '#' + rid + ' .fc-st{display:flex;align-items:center;justify-content:flex-end;gap:7px;font-size:14px;font-weight:800;color:' + col + ';padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-stdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:' + col + (hasPickup ? ';box-shadow:0 0 7px ' + ACC + ';animation:fcPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-sub{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.35);margin-top:4px}'
      + '#' + rid + ' .fc-pwfull{margin:0 14px 12px}'
      + '#' + rid + ' .fc-pwfull-hd{display:flex;align-items:center;justify-content:space-between}'
      + '#' + rid + ' .fc-pwfull-lbl{font-size:10px;font-weight:700;color:#fff}'
      + '#' + rid + ' .fc-pwfull-v{font-size:15px;font-weight:900;color:' + col + ';line-height:1}'
      + '#' + rid + ' .fc-met{display:flex;align-items:center;gap:4px}'
      + '#' + rid + ' .fc-met-lbl{font-size:12px;font-weight:700;color:#fff;flex-shrink:0}'
      + '#' + rid + ' .fc-stats{display:flex;margin:0 14px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden}'
      + '#' + rid + ' .fc-sb{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 3px;gap:2px}'
      + '#' + rid + ' .fc-sb-sep{width:1px;background:rgba(255,255,255,.08);flex-shrink:0}'
      + '#' + rid + ' .fc-sb-n{font-size:12px;font-weight:900;color:' + ACC + ';height:18px;display:flex;align-items:center;justify-content:center}'
      + '#' + rid + ' .fc-sb-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px;text-align:center}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 12px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(' + ACC_RGB + ',.12);border-color:rgba(' + ACC_RGB + ',.3);color:' + ACC + '}'
      + '#' + rid + ' [data-sya]{cursor:pointer}'
      + (hasPickup ? '@keyframes fcPulse{0%,100%{opacity:.6}50%{opacity:1}}' : '')
      + '</style>';

    const heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img">' + binsHtml + '</div>'
      + '<div class="fc-hero-r">'
      + '<div class="fc-st">Questa sera<div class="fc-stdot"></div></div>'
      + tonightRows
      + '<div class="fc-sub">Per domani (' + DFULL[tmrI] + ')</div>'
      + tmrRows
      + '</div>'
      + '</div>';

    const nextHtml = '<div class="fc-pwfull">'
      + '<div class="fc-pwfull-hd">'
      + '<span class="fc-pwfull-lbl">Prossima raccolta</span>'
      + '<span class="fc-pwfull-v">' + nextLabel + '</span>'
      + '</div>'
      + '</div>';

    const statsHtml = '<div class="fc-stats">'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (todayWastes.length || '—') + '</div><div class="fc-sb-l">Questa sera</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (tmrWastes.length || '—') + '</div><div class="fc-sb-l">Domani</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + weekCount + '</div><div class="fc-sb-l">Settimana</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n" style="font-size:10px">' + (nextAbbr || '—') + '</div><div class="fc-sb-l">Prossima</div></div>'
      + '</div>';

    const btnsHtml = '<div class="fc-btns">'
      + '<div class="fc-btn" data-sya="popup-settimana">📅 Settimana</div>'
      + '<div class="fc-btn" data-sya="popup-imp">⚙ Impostazioni</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">♻️</div>'
      + '<div class="fc-hdr-tit">Raccolta Differenziata</div>'
      + '<div class="fc-hdr-pill" style="background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.28);color:' + col + '">'
      + '<div class="fc-dot"></div>'
      + (hasPickup ? 'RACCOLTA' : 'NESSUN RITIRO')
      + '</div>'
      + '</div>'
      + '<div class="fc-scroll">'
      + heroHtml
      + nextHtml
      + statsHtml
      + btnsHtml
      + '</div>'
      + '</div>'
      + '</div>';
  }

  /* ── MOUNT / UPDATE / EVENTS ── */
  function mount(card, hass, el) {
    if (el._diffBound) return;
    el._diffBound = true;
    el.addEventListener('click', function(e) {
      const t = e.target.closest('[data-sya]');
      if (!t) return;
      if (t.dataset.sya === 'popup-imp')       openImpostazioni(card);
      if (t.dataset.sya === 'popup-settimana') openSettimana(card);
    });
  }

  function update(card, hass, el) {
    const h    = H();
    const ti   = todayIdx();
    const tmrI = (ti + 1) % 7;
    const sig  = [
      S(h, 'input_text.frarik_differenziata_rifiuto_' + DAYS[ti]),
      S(h, 'input_text.frarik_differenziata_rifiuto_' + DAYS[tmrI]),
      JSON.stringify(getClrs())
    ].join('|');
    if (!el.querySelector('.fc-card') || el._diffSig !== sig) {
      el._diffSig = sig;
      el.innerHTML = render(card);
    }
  }

  /* ── POPUP SETTIMANA ── */
  function openSettimana(card) {
    const h  = H();
    const ti = todayIdx();
    const content = DAYS.map(function(d, i) {
      var ws = parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + d) || '');
      var isToday = i === ti;
      var dots = ws.length
        ? ws.map(function(id) {
            var t = TIPI.find(function(x) { return x.id === id; }), c = getClr(id);
            return '<div style="display:flex;align-items:center;gap:5px">'
              + '<div style="width:8px;height:8px;border-radius:50%;background:' + c + ';box-shadow:0 0 4px ' + c + '88;flex-shrink:0"></div>'
              + '<span style="font-size:12px;font-weight:700;color:#fff">' + (t ? t.label : id) + '</span>'
              + '</div>';
          }).join('')
        : '<span style="font-size:11px;color:rgba(255,255,255,.3)">Nessun ritiro</span>';
      return '<div style="padding:10px;border-radius:10px;border:1px solid ' + (isToday ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.06)') + ';background:' + (isToday ? 'rgba(74,222,128,.05)' : 'rgba(255,255,255,.02)') + ';margin-bottom:6px">'
        + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:' + (isToday ? '#4ade80' : 'rgba(255,255,255,.45)') + ';margin-bottom:6px">'
        + DFULL[i] + (isToday ? ' — OGGI' : '') + '</div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:8px">' + dots + '</div>'
        + '</div>';
    }).join('');
    mkOv(popShell('📅', '74,222,128', 'Rifiuti della settimana', 'Panoramica raccolta settimanale', 'ds-close', content), 'ds-close');
  }

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

    /* pills giorni — layout a blocco per giorno */
    function renderGiorni() {
      return DAYS.map(function(d, i) {
        var hasSel = dayState[d].size > 0;
        var pills = TIPI.map(function(t) {
          var sel = dayState[d].has(t.id);
          var c = getClr(t.id);
          var border = sel ? c : 'rgba(255,255,255,.1)';
          var bg     = sel ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.03)';
          var dot    = '<div style="width:8px;height:8px;border-radius:50%;background:' + (sel ? c : 'rgba(255,255,255,.2)') + ';flex-shrink:0"></div>';
          var fc     = sel ? '#fff' : 'rgba(255,255,255,.45)';
          return '<button data-di="' + d + '" data-ti="' + t.id + '" style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;border:1.5px solid ' + border + ';background:' + bg + ';color:' + fc + ';font-size:11px;font-weight:700;cursor:pointer;font-family:system-ui;transition:all .15s">'
            + dot + t.label + '</button>';
        }).join('');
        var dayColor = hasSel ? '#fff' : 'rgba(255,255,255,.35)';
        return '<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
          + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:' + dayColor + ';margin-bottom:6px">' + DFULL[i] + '</div>'
          + '<div style="display:flex;gap:5px;flex-wrap:wrap">' + pills + '</div>'
          + '</div>';
      }).join('');
    }

    /* colori — una riga per tipo, palette colorata */
    const PALETTE = ['#92400e','#c2410c','#d97706','#ca8a04','#16a34a','#15803d','#0284c7','#1d4ed8','#374151','#4b5563','#7c3aed','#9333ea','#db2777','#e11d48'];
    function renderColori() {
      return TIPI.map(function(t) {
        var cur = getClr(t.id);
        var sws = PALETTE.map(function(c) {
          var ring = c === cur ? ';box-shadow:0 0 0 2px #fff,0 0 0 4px ' + c + ';transform:scale(1.12)' : '';
          return '<div data-ci="' + t.id + '" data-cv="' + c + '" style="width:22px;height:22px;border-radius:50%;background:' + c + ';cursor:pointer;flex-shrink:0;transition:transform .12s' + ring + '"></div>';
        }).join('');
        return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
          + '<div style="width:30px;height:30px;border-radius:9px;background:' + cur + ';flex-shrink:0;border:2px solid rgba(255,255,255,.18)"></div>'
          + '<div style="font-size:12px;font-weight:700;color:#fff;width:56px;flex-shrink:0">' + t.label + '</div>'
          + '<div style="display:flex;gap:4px;flex-wrap:wrap;flex:1;align-items:center">'
          + sws
          + '<input type="color" data-ci="' + t.id + '" value="' + cur + '" style="width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,.15);cursor:pointer;padding:0;background:none;flex-shrink:0" title="Colore libero">'
          + '</div>'
          + '</div>';
      }).join('');
    }

    /* toggle */
    function tog(id, on, lbl, sub) {
      var bg   = on ? '#22c55e' : 'rgba(255,255,255,.12)';
      var knob = on ? 'left:22px' : 'left:3px';
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        + '<div><div style="font-size:13px;font-weight:700;color:#fff">' + lbl + '</div>'
        + '<div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:1px">' + sub + '</div></div>'
        + '<div data-tg="' + id + '" style="width:44px;height:26px;border-radius:13px;background:' + bg + ';cursor:pointer;position:relative;flex-shrink:0;transition:background .18s">'
        + '<div style="position:absolute;top:3px;' + knob + ';width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transition:left .18s"></div>'
        + '</div>'
        + '</div>';
    }

    const saveBtn = '<button id="dd-save" style="width:100%;margin-top:16px;padding:14px;border-radius:13px;background:#22c55e;border:none;color:#060d14;font-size:14px;font-weight:900;cursor:pointer;font-family:system-ui;letter-spacing:.01em">💾 Salva impostazioni</button>';

    const content = sttl('📅 Rifiuti per giorno')
      + '<div id="dd-giorni">' + renderGiorni() + '</div>'
      + sttl('🎨 Colori per tipo')
      + '<div id="dd-colori">' + renderColori() + '</div>'
      + sttl('🔔 Notifiche')
      + tog('push',   pushOn,   '📱 Push',   'Notifica su app mobile')
      + tog('alexa',  alexaOn,  '🗣 Alexa',  'Annuncio vocale Alexa')
      + tog('google', googleOn, '🔊 Google', 'Annuncio vocale Google')
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0">'
      + '<div><div style="font-size:13px;font-weight:700;color:#fff">⏰ Orario</div>'
      + '<div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:1px">Il giorno della raccolta</div></div>'
      + '<input type="time" id="dd-time" value="' + notifT + '" style="height:32px;padding:0 10px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;font-size:13px;font-family:system-ui">'
      + '</div>'
      + saveBtn;

    var ov = mkOv(popShell('♻️', '34,197,94', 'Raccolta Differenziata', 'Configura giorni, colori e notifiche', 'dd-close', content), 'dd-close');

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
      ov.querySelector('#dd-colori').innerHTML = renderColori();
      ov.querySelector('#dd-giorni').innerHTML = renderGiorni();
    });

    /* toggle click */
    ov.addEventListener('click', function(e) {
      var tg = e.target.closest('[data-tg]'); if (!tg) return;
      var on = tg.style.background === 'rgb(34, 197, 94)' || tg.style.background === '#22c55e';
      tg.style.background = on ? 'rgba(255,255,255,.12)' : '#22c55e';
      var knob = tg.querySelector('div');
      if (knob) knob.style.left = on ? '3px' : '22px';
    });

    /* salva */
    ov.querySelector('#dd-save').addEventListener('click', function() {
      DAYS.forEach(function(d) {
        callSvc('input_text', 'set_value', { entity_id: 'input_text.frarik_differenziata_rifiuto_' + d, value: [...dayState[d]].join(',') });
      });
      ov.querySelectorAll('[data-tg]').forEach(function(tg) {
        var id = tg.dataset.tg;
        var on = tg.style.background === '#22c55e' || tg.style.background === 'rgb(34, 197, 94)';
        callSvc('input_boolean', on ? 'turn_on' : 'turn_off', { entity_id: 'input_boolean.frarik_differenziata_notifica_' + id });
      });
      var tv = ov.querySelector('#dd-time');
      if (tv && tv.value) callSvc('input_datetime', 'set_datetime', { entity_id: 'input_datetime.frarik_differenziata_orario_notifica', time: tv.value + ':00' });
      var sb = ov.querySelector('#dd-save');
      sb.textContent = '✅ Salvato!'; sb.style.background = 'rgba(34,197,94,.5)';
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
    version: '5.3',
    frarik_pkg_check: 'sensor.frarik_differenziata_versione',
    frarik_pkg_id: 'frarik_differenziata',
    frarik_pkg_version: '2.0',
    render:  render,
    mount:   mount,
    update:  update,
    pkgYaml: function() { return _DIFF_PKG; }
  };
})();
