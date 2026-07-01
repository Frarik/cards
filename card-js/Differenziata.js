/* frarik-version: 5.1 */
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

  /* ── bidone SVG illustrativo ── */
  function binSvg(color, sz) {
    const uid = 'b' + color.replace(/[^a-f0-9]/gi,'').slice(0,6) + sz;
    const lgt  = shade(color, 60);
    const mid  = color;
    const drk  = shade(color, -50);
    const drk2 = shade(color, -70);
    const lidT = shade(color, 40);
    const lidB = shade(color, -20);
    const h = Math.round(sz * 1.3);
    return `<svg width="${sz}" height="${h}" viewBox="0 0 80 104" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${uid}bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${lgt}"/>
      <stop offset="28%"  stop-color="${mid}"/>
      <stop offset="100%" stop-color="${drk}"/>
    </linearGradient>
    <linearGradient id="${uid}ld" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${lidT}"/>
      <stop offset="100%" stop-color="${lidB}"/>
    </linearGradient>
    <linearGradient id="${uid}sh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(255,255,255,.08)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,.18)"/>
    </linearGradient>
    <radialGradient id="${uid}sp" cx="28%" cy="28%" r="60%">
      <stop offset="0%"   stop-color="rgba(255,255,255,.45)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <filter id="${uid}dr" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="rgba(0,0,0,.5)"/>
    </filter>
  </defs>
  <!-- ombra terreno -->
  <ellipse cx="40" cy="101" rx="26" ry="3.5" fill="rgba(0,0,0,.25)"/>
  <!-- assale -->
  <rect x="14" y="85" width="52" height="5" rx="2.5" fill="${drk2}"/>
  <!-- ruote sx -->
  <circle cx="19" cy="90"  r="7.5" fill="${drk2}"/>
  <circle cx="19" cy="90"  r="4"   fill="#0e0e0e"/>
  <circle cx="19" cy="90"  r="1.8" fill="#1c1c1c"/>
  <circle cx="17" cy="88"  r="1"   fill="rgba(255,255,255,.18)"/>
  <!-- ruote dx -->
  <circle cx="61" cy="90"  r="7.5" fill="${drk2}"/>
  <circle cx="61" cy="90"  r="4"   fill="#0e0e0e"/>
  <circle cx="61" cy="90"  r="1.8" fill="#1c1c1c"/>
  <circle cx="59" cy="88"  r="1"   fill="rgba(255,255,255,.18)"/>
  <!-- corpo bidone (trapezio) -->
  <path d="M17 22 L10 82 Q10 87 16 87 H64 Q70 87 70 82 L63 22 Z" fill="url(#${uid}bg)" filter="url(#${uid}dr)"/>
  <path d="M17 22 L10 82 Q10 87 16 87 H64 Q70 87 70 82 L63 22 Z" fill="url(#${uid}sh)"/>
  <!-- bordo luminoso sinistra -->
  <path d="M17 22 L10 82 Q10 87 16 87 H19 L12 22 Z" fill="rgba(255,255,255,.22)"/>
  <!-- ombra destra -->
  <path d="M63 22 L70 82 Q70 87 64 87 H61 L68 22 Z" fill="rgba(0,0,0,.2)"/>
  <!-- striscia frontale decorativa -->
  <rect x="22" y="46" width="36" height="3" rx="1.5" fill="rgba(255,255,255,.13)"/>
  <rect x="22" y="56" width="36" height="3" rx="1.5" fill="rgba(255,255,255,.08)"/>
  <rect x="22" y="66" width="36" height="3" rx="1.5" fill="rgba(255,255,255,.05)"/>
  <!-- bordo sotto coperchio (rim) -->
  <rect x="9"  y="17" width="62" height="7" rx="3.5" fill="${drk}"/>
  <rect x="9"  y="17" width="62" height="3" rx="3.5" fill="rgba(255,255,255,.18)"/>
  <!-- coperchio -->
  <rect x="7"  y="6"  width="66" height="13" rx="5" fill="url(#${uid}ld)"/>
  <rect x="7"  y="6"  width="66" height="13" rx="5" fill="url(#${uid}sp)"/>
  <!-- cerniera centrale -->
  <rect x="32" y="5"  width="16" height="3.5" rx="1.75" fill="${drk2}"/>
  <!-- manico -->
  <path d="M30 1 Q40 -3 50 1 L50 5 Q40 1 30 5 Z" fill="${drk}"/>
  <path d="M30 1 Q40 -3 50 1 L50 2.8 Q40 -1 30 2.8 Z" fill="rgba(255,255,255,.3)"/>
</svg>`;
  }

  function emptyBinSvg(sz) {
    const h = Math.round(sz * 1.3);
    return `<svg width="${sz}" height="${h}" viewBox="0 0 80 104" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="40" cy="101" rx="26" ry="3.5" fill="rgba(255,255,255,.03)"/>
  <rect x="14" y="85" width="52" height="5" rx="2.5" fill="rgba(255,255,255,.04)"/>
  <circle cx="19" cy="90" r="7.5" fill="rgba(255,255,255,.04)"/>
  <circle cx="61" cy="90" r="7.5" fill="rgba(255,255,255,.04)"/>
  <path d="M17 22 L10 82 Q10 87 16 87 H64 Q70 87 70 82 L63 22 Z" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
  <rect x="9"  y="17" width="62" height="7"  rx="3.5" fill="rgba(255,255,255,.05)"/>
  <rect x="7"  y="6"  width="66" height="13" rx="5"   fill="rgba(255,255,255,.06)"/>
  <line x1="27" y1="38" x2="53" y2="78" stroke="rgba(255,255,255,.12)" stroke-width="4" stroke-linecap="round"/>
  <line x1="53" y1="38" x2="27" y2="78" stroke="rgba(255,255,255,.12)" stroke-width="4" stroke-linecap="round"/>
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
    const binSz = todayWastes.length <= 1 ? 96 : todayWastes.length === 2 ? 74 : 58;
    let binsHtml = '';
    if (!hasPickup) {
      binsHtml = '<div style="display:flex;justify-content:center;align-items:flex-end;height:100%">' + emptyBinSvg(86) + '</div>';
    } else {
      binsHtml = '<div style="display:flex;align-items:flex-end;justify-content:center;gap:6px;height:100%">'
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

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:260px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:220px;background:radial-gradient(ellipse at 20% 0%,rgba(34,197,94,.07) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.22)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:12px 14px 10px;flex:1;min-height:0}'
      + '#' + rid + ' .fc-hero-img{flex:0 0 48%;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;justify-content:flex-start;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:12px;overflow:hidden}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 12px;flex-shrink:0}'
      + '#' + rid + ' .fc-btn{flex:1;padding:9px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
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
    version: '5.1',
    frarik_pkg_check: 'sensor.frarik_differenziata_versione',
    frarik_pkg_id: 'frarik_differenziata',
    frarik_pkg_version: '2.0',
    render:  render,
    mount:   mount,
    update:  update,
    pkgYaml: function() { return _DIFF_PKG; }
  };
})();
