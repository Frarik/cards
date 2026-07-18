/* frarik-version: 5.20 */
/* v5.15: aggiunta anteprima live + slider dimensione card (altezza/larghezza)
   nel popup Impostazioni, stesso meccanismo di Meteo.js/posta-card
   (localStorage _frk_layout_ + evento frarik-card-layout); aggiunto
   frarik_no_edit per nascondere la matita esterna in modifica dashboard
   (la card ha già il proprio pulsante "⚙ Impostazioni" interno). Popup
   e colori erano già allineati allo standard Frarik (niente giallo,
   chiusura anche cliccando fuori) — nessuna modifica necessaria lì. */
/* v5.16: aggiunta icona ingranaggio nell'header della card (accanto al
   pill di stato) — prima l'unico accesso alle impostazioni era il
   pulsante testuale "⚙ Impostazioni" in fondo alla card, non un'icona
   nell'header come le altre card Frarik (Meteo, posta-card). */
/* v5.17: rimosso il pulsante testuale "⚙ Impostazioni" in fondo alla card
   (duplicato dell'icona ingranaggio nell'header, resta solo "📅 Settimana").
   Uniformati testi bianchi pieni e stessa dimensione in card e popup
   (etichette sezione, header giorni, pill rifiuto, placeholder "nessun
   ritiro" — erano in vari grigi/opacità diverse); aggiunti riquadri con
   contorno bianco attorno alle sezioni "Rifiuti per giorno"/"Colori per
   tipo"/"Notifiche" nel popup Impostazioni; pulsante Salva ora blu #38bdf8
   come da standard Frarik (era verde, colore non universale). */
/* v5.18: popup completamente allineati allo standard posta-card/Meteo —
   stesso sfondo #0a0816 (era #060d14/#080f18 a seconda del popup), stessa
   icona neutra (era colorata a tema per popup e wizard), rimosso il
   sottotitolo sotto al titolo in tutti e 3 i popup (impostazioni/
   settimana/wizard). Anteprima live nel popup impostazioni ora occupa
   tutto lo spazio verticale disponibile (era forzata a 160×220px, minuscola
   anche con colonna vuota). Testo maiuscolo/grassetto ovunque nella card
   e nei popup: pill rifiuto, etichette colore, titoli toggle, "orario". */
/* v5.19: corretta l'anteprima live diventata enorme (era flex:1 su tutta
   l'altezza della colonna, ora dimensionata come quella di posta-card:
   riquadro centrato che segue la dimensione naturale della card, non
   forzata a riempire lo spazio). Rimossa la linea verticale che divideva
   l'illustrazione dei bidoni dal testo "Questa sera/Domani" nella card. */
/* v5.20: sfondo card ora identico a posta-card (gradiente #060d14→#080f18,
   era un blu piatto #070d18 diverso). Rimosse le ultime linee divisorie
   residue (sotto "Questa sera/Domani", sopra il pulsante Settimana).
   Popup Settimana riscritto con un unico riquadro (bordo bianco) invece
   di un box separato per ogni giorno, come lo standard posta-card.
   Rimossa la mini-chip "RACCOLTA/NESSUN RITIRO" accanto all'ingranaggio
   nell'header (duplicava l'informazione già visibile nella card).
   Ultimo giro testi: etichette e testo del wizard installazione (erano
   grigio #94a3b8/#e2e8f0, non rgba bianca) ora bianco pieno. */
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

  /* ── bidone SVG — illustrazione prodotto (corpo navy + coperchio colorato) ── */
  function binSvg(color, sz) {
    const uid = 'b' + color.replace(/[^0-9a-f]/gi,'').slice(0,6) + String(sz);
    const lL  = shade(color,  58);
    const lD  = shade(color, -28);
    const h   = Math.round(sz * 1.56);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 100" width="' + sz + '" height="' + h + '" style="display:block;filter:drop-shadow(0 6px 18px rgba(0,0,0,.7))">'
      + '<defs>'
      + '<linearGradient id="' + uid + 'bd" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#1a3255"/><stop offset="30%" stop-color="#0b1929"/><stop offset="100%" stop-color="#050d1a"/></linearGradient>'
      + '<linearGradient id="' + uid + 'ld" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + lL + '"/><stop offset="100%" stop-color="' + lD + '"/></linearGradient>'
      + '<radialGradient id="' + uid + 'sp" cx="26%" cy="28%" r="58%"><stop offset="0%" stop-color="rgba(255,255,255,.52)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient>'
      + '</defs>'
      + '<ellipse cx="32" cy="97" rx="26" ry="3.5" fill="rgba(0,0,0,.35)"/>'
      + '<rect x="9" y="79" width="46" height="5" rx="2.5" fill="#040912"/>'
      + '<circle cx="17" cy="87" r="10" fill="#0a1828"/>'
      + '<circle cx="17" cy="87" r="8" fill="#070e1c"/>'
      + '<circle cx="17" cy="87" r="5.5" fill="#050b16"/>'
      + '<circle cx="17" cy="87" r="2.5" fill="#030910"/>'
      + '<circle cx="15.5" cy="85.5" r="1" fill="rgba(255,255,255,.15)"/>'
      + '<line x1="17" y1="79" x2="17" y2="82" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="17" y1="92" x2="17" y2="95" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="9.3" y1="82.5" x2="12" y2="84.8" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="22" y1="89.2" x2="24.7" y2="91.5" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="9.3" y1="91.5" x2="12" y2="89.2" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="22" y1="84.8" x2="24.7" y2="82.5" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<circle cx="47" cy="87" r="10" fill="#0a1828"/>'
      + '<circle cx="47" cy="87" r="8" fill="#070e1c"/>'
      + '<circle cx="47" cy="87" r="5.5" fill="#050b16"/>'
      + '<circle cx="47" cy="87" r="2.5" fill="#030910"/>'
      + '<circle cx="45.5" cy="85.5" r="1" fill="rgba(255,255,255,.15)"/>'
      + '<line x1="47" y1="79" x2="47" y2="82" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="47" y1="92" x2="47" y2="95" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="39.3" y1="82.5" x2="42" y2="84.8" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="52" y1="89.2" x2="54.7" y2="91.5" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="39.3" y1="91.5" x2="42" y2="89.2" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<line x1="52" y1="84.8" x2="54.7" y2="82.5" stroke="#0e1e33" stroke-width="1.8" stroke-linecap="round"/>'
      + '<path d="M10,24 L12,80 Q12,84 17,84 H47 Q52,84 52,80 L54,24 Z" fill="url(#' + uid + 'bd)" stroke="#0a1e38" stroke-width=".8"/>'
      + '<path d="M10,24 L12,80 Q12,84 17,84 H19 L17,24 Z" fill="rgba(255,255,255,.08)"/>'
      + '<path d="M54,24 L52,80 Q52,84 47,84 H45 L53,24 Z" fill="rgba(0,0,0,.22)"/>'
      + '<path d="M11,42 Q32,40.5 53,42" stroke="rgba(255,255,255,.05)" stroke-width="1.2" fill="none"/>'
      + '<path d="M11.5,61 Q32,59.5 52.5,61" stroke="rgba(255,255,255,.035)" stroke-width="1.2" fill="none"/>'
      + '<rect x="19" y="36" width="26" height="34" rx="4" fill="rgba(0,0,0,.2)" stroke="rgba(255,255,255,.06)" stroke-width=".7"/>'
      + '<path d="M10.5,25 L11,33 Q32,31 53,33 L53.5,25 Z" fill="' + color + '" opacity=".2"/>'
      + '<path d="M10.5,25 Q32,23.5 53.5,25 L53.5,26.5 Q32,25 10.5,26.5 Z" fill="' + color + '" opacity=".12"/>'
      + '<rect x="8" y="18" width="48" height="8" rx="3.5" fill="#070f1c" stroke="#0a1e38" stroke-width=".7"/>'
      + '<rect x="8" y="18" width="48" height="2.5" rx="3.5" fill="rgba(255,255,255,.05)"/>'
      + '<rect x="26" y="16" width="12" height="5" rx="2.5" fill="#050c1a"/>'
      + '<rect x="5" y="5" width="54" height="15" rx="5.5" fill="url(#' + uid + 'ld)"/>'
      + '<rect x="5" y="5" width="54" height="15" rx="5.5" fill="url(#' + uid + 'sp)"/>'
      + '<rect x="5" y="5" width="54" height="15" rx="5.5" fill="none" stroke="' + lD + '" stroke-width=".7" opacity=".5"/>'
      + '<path d="M10,7 Q32,5.5 54,7" stroke="rgba(255,255,255,.15)" stroke-width=".8" fill="none"/>'
      + '<path d="M10,10 Q25,6.5 44,9" stroke="rgba(255,255,255,.42)" stroke-width="3" fill="none" stroke-linecap="round"/>'
      + '<path d="M10,13 Q22,11 36,12.5" stroke="rgba(255,255,255,.12)" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
      + '<rect x="22" y=".5" width="20" height="6" rx="3" fill="#060d1c" stroke="#0a1e38" stroke-width=".7"/>'
      + '<rect x="24" y="1.5" width="8" height="2" rx="1" fill="rgba(255,255,255,.12)"/>'
      + '</svg>';
  }

  function emptyBinSvg(sz) {
    const h = Math.round(sz * 1.56);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 100" width="' + sz + '" height="' + h + '" style="display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4))">'
      + '<ellipse cx="32" cy="97" rx="26" ry="3.5" fill="rgba(255,255,255,.02)"/>'
      + '<rect x="9" y="79" width="46" height="5" rx="2.5" fill="rgba(255,255,255,.04)"/>'
      + '<circle cx="17" cy="87" r="10" fill="rgba(255,255,255,.04)"/>'
      + '<circle cx="17" cy="87" r="8" fill="rgba(255,255,255,.03)"/>'
      + '<circle cx="17" cy="87" r="5.5" fill="rgba(255,255,255,.02)"/>'
      + '<circle cx="47" cy="87" r="10" fill="rgba(255,255,255,.04)"/>'
      + '<circle cx="47" cy="87" r="8" fill="rgba(255,255,255,.03)"/>'
      + '<circle cx="47" cy="87" r="5.5" fill="rgba(255,255,255,.02)"/>'
      + '<path d="M10,24 L12,80 Q12,84 17,84 H47 Q52,84 52,80 L54,24 Z" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.1)" stroke-width="1.2"/>'
      + '<rect x="8" y="18" width="48" height="8" rx="3.5" fill="rgba(255,255,255,.05)"/>'
      + '<rect x="5" y="5" width="54" height="15" rx="5.5" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.08)" stroke-width=".7"/>'
      + '<rect x="22" y=".5" width="20" height="6" rx="3" fill="rgba(255,255,255,.04)"/>'
      + '<line x1="21" y1="38" x2="43" y2="68" stroke="rgba(255,255,255,.15)" stroke-width="3.5" stroke-linecap="round"/>'
      + '<line x1="43" y1="38" x2="21" y2="68" stroke="rgba(255,255,255,.15)" stroke-width="3.5" stroke-linecap="round"/>'
      + '</svg>';
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
  function popShell(icon, title, closeId, content) {
    return POP_CSS + '<div style="width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">'
      + '<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;flex-shrink:0">' + icon + '</div>'
      + '<div style="flex:1;font-size:16px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">' + title + '</div>'
      + '<button id="' + closeId + '" style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18)">✕</button>'
      + '</div>'
      + '<div class="fcpc" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }
  function sttl(t) {
    return '<div style="font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#fff;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.06)">' + t + '</div>';
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
      return '<div class="fc-met">'
        + '<span class="fc-met-lbl">' + (t ? t.label : id) + '</span>'
        + '<div style="width:8px;height:8px;border-radius:50%;background:' + c + ';box-shadow:0 0 5px ' + c + '88;flex-shrink:0"></div>'
        + '</div>';
    }
    var tonightRows = hasPickup
      ? todayWastes.map(wasteRow).join('')
      : '<div class="fc-met"><span class="fc-met-lbl">Niente da esporre</span></div>';
    var tmrRows = tmrWastes.length
      ? tmrWastes.map(wasteRow).join('')
      : '<div class="fc-met"><span class="fc-met-lbl">Nessun ritiro</span></div>';

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:var(--card-r,20px);overflow:hidden}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:transparent;border-radius:0;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(' + ACC_RGB + ',.1);border:1px solid rgba(' + ACC_RGB + ',.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-gear{width:26px;height:26px;border-radius:8px;border:none;background:rgba(255,255,255,.06);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;font-size:13px;transition:background .15s}'
      + '#' + rid + ' .fc-gear:hover{background:rgba(255,255,255,.12)}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;max-height:160px}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:5px;justify-content:flex-start;min-width:0;padding-left:10px;overflow:hidden}'
      + '#' + rid + ' .fc-met{display:flex;align-items:center;justify-content:space-between;gap:6px}'
      + '#' + rid + ' .fc-met-lbl{font-size:12px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px;flex-shrink:0}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:10px 14px 12px;margin-top:14px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(' + ACC_RGB + ',.12);border-color:rgba(' + ACC_RGB + ',.3);color:' + ACC + '}'
      + '#' + rid + ' [data-sya]{cursor:pointer}'
      + (hasPickup ? '@keyframes fcPulse{0%,100%{opacity:.6}50%{opacity:1}}' : '')
      + '</style>';

    const dot = (c, pulse) => '<div style="width:6px;height:6px;border-radius:50%;background:' + c + ';flex-shrink:0' + (pulse ? ';box-shadow:0 0 6px ' + c + ';animation:fcPulse 1.5s ease-in-out infinite' : '') + '"></div>';
    const secHdr = (label, c) => '<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px">'
      + dot(c || 'rgba(255,255,255,.25)', !!(c && hasPickup))
      + '<span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:' + (c || '#fff') + '">' + label + '</span>'
      + '</div>';

    const heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img">' + binsHtml + '</div>'
      + '<div class="fc-hero-r">'
      + secHdr('Questa sera', col)
      + tonightRows
      + '<div style="margin:8px 0 6px"></div>'
      + secHdr('Domani — ' + DFULL[tmrI].slice(0,3), null)
      + tmrRows
      + '</div>'
      + '</div>';

    const btnsHtml = '<div class="fc-btns">'
      + '<div class="fc-btn" data-sya="popup-settimana">📅 Settimana</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">♻️</div>'
      + '<div class="fc-hdr-tit">Raccolta Differenziata</div>'
      + '<button class="fc-gear" data-sya="popup-imp" title="Impostazioni">⚙️</button>'
      + '</div>'
      + '<div class="fc-scroll">'
      + heroHtml
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
    const rows = DAYS.map(function(d, i) {
      var ws = parseWastes(S(h, 'input_text.frarik_differenziata_rifiuto_' + d) || '');
      var isToday = i === ti;
      var isLast = i === DAYS.length - 1;
      var dots = ws.length
        ? ws.map(function(id) {
            var t = TIPI.find(function(x) { return x.id === id; }), c = getClr(id);
            return '<div style="display:flex;align-items:center;gap:5px">'
              + '<div style="width:8px;height:8px;border-radius:50%;background:' + c + ';box-shadow:0 0 4px ' + c + '88;flex-shrink:0"></div>'
              + '<span style="font-size:12px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">' + (t ? t.label : id) + '</span>'
              + '</div>';
          }).join('')
        : '<span style="font-size:12px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">Nessun ritiro</span>';
      return '<div style="padding:10px 0' + (isLast ? '' : ';border-bottom:1px solid rgba(255,255,255,.06)') + '">'
        + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:' + (isToday ? '#4ade80' : '#fff') + ';margin-bottom:6px">'
        + DFULL[i] + (isToday ? ' — OGGI' : '') + '</div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:8px">' + dots + '</div>'
        + '</div>';
    }).join('');
    const content = '<div style="padding:14px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #fff">' + rows + '</div>';
    mkOv(popShell('📅', 'Rifiuti della settimana', 'ds-close', content), 'ds-close');
  }

  /* ── POPUP IMPOSTAZIONI ── */
  function openImpostazioni(card) {
    const h = H();
    const cardId = (card && card.id) || '';

    /* dimensione card — letta da localStorage, stesso meccanismo di Meteo/Posta */
    var _ll = {};
    try { _ll = JSON.parse(localStorage.getItem('_frk_layout_' + cardId) || '{}'); } catch(e) {}
    var tScale = _ll.cardScale != null ? _ll.cardScale : 100;
    var tW     = _ll.cardW     != null ? _ll.cardW     : 100;

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
          return '<button data-di="' + d + '" data-ti="' + t.id + '" style="display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;border:1.5px solid ' + border + ';background:' + bg + ';color:#fff;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.3px;cursor:pointer;font-family:system-ui;transition:all .15s">'
            + dot + t.label + '</button>';
        }).join('');
        var dayColor = '#fff';
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
          + '<div style="font-size:12px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px;width:56px;flex-shrink:0">' + t.label + '</div>'
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
        + '<div><div style="font-size:13px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">' + lbl + '</div>'
        + '<div style="font-size:10px;color:#fff;opacity:.6;margin-top:1px">' + sub + '</div></div>'
        + '<div data-tg="' + id + '" style="width:44px;height:26px;border-radius:13px;background:' + bg + ';cursor:pointer;position:relative;flex-shrink:0;transition:background .18s">'
        + '<div style="position:absolute;top:3px;' + knob + ';width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transition:left .18s"></div>'
        + '</div>'
        + '</div>';
    }

    const saveBtn = '<button id="dd-save" style="width:100%;margin-top:16px;padding:14px;border-radius:13px;background:#38bdf8;border:none;color:#fff;font-size:14px;font-weight:900;cursor:pointer;font-family:system-ui;letter-spacing:.01em">💾 Salva impostazioni</button>';

    function layoutRow(lbl, id, val) {
      var vLbl = val >= 100 ? 'Auto (100%)' : val + '%';
      return '<div style="display:flex;align-items:center;gap:8px;margin-top:10px">'
        + '<span style="font-size:12px;font-weight:900;color:#fff;width:72px;flex-shrink:0">' + lbl + '</span>'
        + '<input type="range" id="' + id + '" min="20" max="100" step="5" value="' + val + '" style="flex:1;accent-color:#fff;cursor:pointer">'
        + '<span id="' + id + '-lbl" style="font-size:12px;font-weight:900;color:#fff;width:54px;text-align:right;flex-shrink:0">' + vLbl + '</span>'
        + '</div>';
    }

    const boxOpen  = '<div style="padding:14px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #fff">';
    const boxClose = '</div>';

    const settingsHtml = sttl('📅 Rifiuti per giorno')
      + boxOpen + '<div id="dd-giorni">' + renderGiorni() + '</div>' + boxClose
      + sttl('🎨 Colori per tipo')
      + boxOpen + '<div id="dd-colori">' + renderColori() + '</div>' + boxClose
      + sttl('🔔 Notifiche')
      + boxOpen
      + tog('push',   pushOn,   '📱 Push',   'Notifica su app mobile')
      + tog('alexa',  alexaOn,  '🗣 Alexa',  'Annuncio vocale Alexa')
      + tog('google', googleOn, '🔊 Google', 'Annuncio vocale Google')
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0">'
      + '<div><div style="font-size:13px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">⏰ Orario</div>'
      + '<div style="font-size:10px;color:#fff;opacity:.6;margin-top:1px">Il giorno della raccolta</div></div>'
      + '<input type="time" id="dd-time" value="' + notifT + '" style="height:32px;padding:0 10px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;font-size:13px;font-family:system-ui">'
      + '</div>'
      + boxClose
      + saveBtn;

    const previewHtml = '<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#fff;opacity:.6">Anteprima live</div>'
      + '<div id="dd-prev-wrap" style="border-radius:14px;overflow:hidden;background:rgba(255,255,255,.02);margin-top:8px;padding:10px;display:flex;justify-content:center"></div>'
      + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)">'
      + '<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#fff;opacity:.6">Dimensione card</div>'
      + layoutRow('Altezza', 'dd-scale', tScale)
      + layoutRow('Larghezza', 'dd-w', tW)
      + '</div>';

    const content = '<div style="display:flex;gap:16px;align-items:stretch">'
      + '<div style="flex:1;min-width:0;display:flex;flex-direction:column">' + settingsHtml + '</div>'
      + '<div style="flex:1;min-width:0;display:flex;flex-direction:column;padding-left:16px;border-left:1px solid rgba(255,255,255,.07)">' + previewHtml + '</div>'
      + '</div>';

    var ov = mkOv(popShell('♻️', 'Raccolta Differenziata', 'dd-close', content), 'dd-close');

    /* anteprima live — stessa render() della card reale, scalata */
    function updatePreview() {
      var wrap = ov.querySelector('#dd-prev-wrap'); if (!wrap) return;
      try { wrap.innerHTML = render({ id: '__diffprev__' }); } catch(e) {}
      var el = wrap.querySelector('#frd__diffprev__');
      if (el) {
        el.style.width = tW < 100 ? tW + '%' : '';
        el.style.zoom = tScale < 100 ? tScale + '%' : '';
      }
    }
    updatePreview();

    /* dimensione card */
    ov.querySelector('#dd-scale').addEventListener('input', function(e) {
      tScale = Math.max(20, Math.min(100, parseInt(e.target.value, 10) || 100));
      var lbl = ov.querySelector('#dd-scale-lbl'); if (lbl) lbl.textContent = tScale >= 100 ? 'Auto (100%)' : tScale + '%';
      updatePreview();
    });
    ov.querySelector('#dd-w').addEventListener('input', function(e) {
      tW = Math.max(20, Math.min(100, parseInt(e.target.value, 10) || 100));
      var lbl = ov.querySelector('#dd-w-lbl'); if (lbl) lbl.textContent = tW >= 100 ? 'Auto (100%)' : tW + '%';
    });

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
      updatePreview();
    });
    ov.querySelector('#dd-colori').addEventListener('input', function(e) {
      var inp = e.target.closest('input[type="color"][data-ci]'); if (!inp) return;
      saveClr(inp.dataset.ci, inp.value);
      ov.querySelector('#dd-colori').innerHTML = renderColori();
      ov.querySelector('#dd-giorni').innerHTML = renderGiorni();
      updatePreview();
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
      if (cardId) {
        try { localStorage.setItem('_frk_layout_' + cardId, JSON.stringify({ cardScale: tScale, cardW: tW })); } catch(e) {}
        document.dispatchEvent(new CustomEvent('frarik-card-layout', { bubbles: true, detail: { cardId: cardId, cardScale: tScale, cardW: tW } }));
      }
      var sb = ov.querySelector('#dd-save');
      sb.textContent = '✅ Salvato!'; sb.style.background = 'rgba(56,189,248,.5)';
      setTimeout(function() { sb.textContent = '💾 Salva impostazioni'; sb.style.background = '#38bdf8'; }, 2000);
    });
  }

  /* ── PKG YAML EMBEDDED ── */
  var _DIFF_PKG_YAML = `###############################################################
#                                                             #
#   ███████╗██████╗  █████╗ ██████╗ ██╗██╗  ██╗             #
#   ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██║ ██╔╝             #
#   █████╗  ██████╔╝███████║██████╔╝██║█████╔╝              #
#   ██╔══╝  ██╔══██╗██╔══██║██╔══██╗██║██╔═██╗              #
#   ██║     ██║  ██║██║  ██║██║  ██║██║██║  ██╗             #
#   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝            #
#                                                             #
#   Package: Centro Controllo Raccolta Differenziata          #
#   Versione: 2.0  |  Frarik / Fratech                       #
#                                                             #
###############################################################
#
# COSA FA QUESTO PACKAGE
# ──────────────────────────────────────────────────────────
# Gestisce la raccolta differenziata settimanale:
#
#  ▸ Rifiuti per ogni giorno (lista separata da virgole)
#    es. "plastica,vetro"
#  ▸ Tipi supportati: umido, secco, carta, plastica, vetro
#  ▸ Sensore raccolta odierna (auto-aggiornato)
#  ▸ Notifiche push, Google Home e Alexa
#  ▸ Orario notifica configurabile
#
###############################################################
#
# INSTALLAZIONE — LEGGI PRIMA DI INIZIARE
# ──────────────────────────────────────────────────────────
#
#  PASSO 1 — Abilita i package in configuration.yaml
#  ───────────────────────────────────────────────────
#  Apri il tuo configuration.yaml e verifica che sia
#  presente questa sezione (aggiungila se manca):
#
#    homeassistant:
#      packages: !include_dir_named packages
#
#  Poi copia questo file nella cartella "packages/frarik"
#  e riavvia Home Assistant per attivare le modifiche.
#
#  PASSO 2 — Personalizza i segnaposto qui sotto
#  ───────────────────────────────────────────────
#  Nella sezione IMPOSTAZIONI trovi tutti i valori
#  da sostituire. Ogni segnaposto ha il formato:
#
#    IL_TUO_VALORE_QUI
#
#  PASSO 3 — Ricarica la configurazione
#  ───────────────────────────────────────────────
#  Strumenti per sviluppatori → YAML → Ricarica tutto
#
#  PASSO 4 — Aggiungi la card dal pannello Frarik
#  ───────────────────────────────────────────────
#  Frarik Dashboard → Store → "Raccolta Differenziata"
#
###############################################################
#
# ENTITÀ CREATE DA QUESTO PACKAGE
# ──────────────────────────────────────────────────────────
#  sensor.frarik_differenziata_versione        ← versione pkg
#  sensor.frarik_differenziata_raccolta        ← rifiuto di oggi
#  input_text.frarik_differenziata_rifiuto_GIORNO  (× 7)
#  input_datetime.frarik_differenziata_orario_notifica
#  input_boolean.frarik_differenziata_notifica_push
#  input_boolean.frarik_differenziata_notifica_google
#  input_boolean.frarik_differenziata_notifica_alexa
#  notify.frarik_differenziata                 ← gruppo push
#  automation: Frarik — Differenziata (notifiche)
#
###############################################################


####################################################
#                                                  #
#                  IMPOSTAZIONI                    #
#          ↓  MODIFICA SOLO QUESTA SEZIONE  ↓      #
#                                                  #
####################################################

homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Frarik — Centro Controllo Raccolta Differenziata'
        author: 'Frarik / Fratech'
        version: '2.0'

      setting:

        # ─────────────────────────────────────────────────
        # SPEAKER GOOGLE HOME / NEST
        # Entità media player dei tuoi dispositivi Google.
        # Esempi:
        #   - media_player.google_home_cucina
        # ─────────────────────────────────────────────────
        Lista MediaPlayer Google: &google
          - IL_TUO_MEDIA_PLAYER_GOOGLE

        # ─────────────────────────────────────────────────
        # DISPOSITIVI AMAZON ALEXA / ECHO
        # ─────────────────────────────────────────────────
        Lista MediaPlayer Alexa: &alexa
          - IL_TUO_MEDIA_PLAYER_ALEXA

        # ─────────────────────────────────────────────────
        # SERVIZI NOTIFICA PUSH (smartphone)
        # ─────────────────────────────────────────────────
        Device per notifica push: &push
          - service: IL_TUO_MOBILE_APP


####################################################
#                                                  #
#              NOTIFICHE GRUPPO PUSH               #
#                                                  #
####################################################



####################################################
#                                                  #
#                  INPUT TEXT                      #
#    Ogni giorno memorizza i rifiuti selezionati   #
#    come lista separata da virgole                #
#    es. "plastica,vetro"                          #
#                                                  #
####################################################

input_text:
  frarik_differenziata_rifiuto_lunedi:
    name: "Differenziata — Rifiuto Lunedì"
    icon: mdi:delete-variant
    max: 255

  frarik_differenziata_rifiuto_martedi:
    name: "Differenziata — Rifiuto Martedì"
    icon: mdi:delete-variant
    max: 255

  frarik_differenziata_rifiuto_mercoledi:
    name: "Differenziata — Rifiuto Mercoledì"
    icon: mdi:delete-variant
    max: 255

  frarik_differenziata_rifiuto_giovedi:
    name: "Differenziata — Rifiuto Giovedì"
    icon: mdi:delete-variant
    max: 255

  frarik_differenziata_rifiuto_venerdi:
    name: "Differenziata — Rifiuto Venerdì"
    icon: mdi:delete-variant
    max: 255

  frarik_differenziata_rifiuto_sabato:
    name: "Differenziata — Rifiuto Sabato"
    icon: mdi:delete-variant
    max: 255

  frarik_differenziata_rifiuto_domenica:
    name: "Differenziata — Rifiuto Domenica"
    icon: mdi:delete-variant
    max: 255


####################################################
#                                                  #
#               DATE E ORARI                       #
#                                                  #
####################################################

input_datetime:
  frarik_differenziata_orario_notifica:
    name: "Differenziata — Orario Notifica"
    has_date: false
    has_time: true
    icon: mdi:bell-ring-outline


####################################################
#                                                  #
#               INTERRUTTORI                       #
#                                                  #
####################################################

input_boolean:
  frarik_differenziata_notifica_push:
    name: "Differenziata — Notifica Push"
    icon: mdi:cellphone-message

  frarik_differenziata_notifica_google:
    name: "Differenziata — Annuncio Google"
    icon: mdi:google-assistant

  frarik_differenziata_notifica_alexa:
    name: "Differenziata — Annuncio Alexa"
    icon: mdi:amazon-alexa


####################################################
#                                                  #
#                    SENSORI                       #
#                                                  #
####################################################

template:
  - sensor:
      - name: "Frarik Differenziata Versione"
        unique_id: frarik_differenziata_versione
        state: "2.0"
        icon: mdi:package-variant-closed

      - name: "Frarik Differenziata Raccolta"
        unique_id: frarik_differenziata_raccolta
        icon: mdi:recycle
        state: >-
          {% set wd = now().weekday() %}
          {% set giorni = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'] %}
          {{ states('input_text.frarik_differenziata_rifiuto_' + giorni[wd]) }}


####################################################
#                                                  #
#                  AUTOMAZIONI                     #
#                                                  #
####################################################

automation:

  - alias: "Frarik — Differenziata (notifiche)"
    id: frarik_differenziata_notifiche
    description: "Notifica giornaliera rifiuti da buttare"
    mode: single

    trigger:
      - platform: time
        at: 'input_datetime.frarik_differenziata_orario_notifica'

    condition:
      - condition: not
        conditions:
          - condition: state
            entity_id: sensor.frarik_differenziata_raccolta
            state: ""

    action:

      - parallel:

          # ── Notifica Push ──────────────────────────
          - choose:
            - conditions:
              - condition: state
                entity_id: input_boolean.frarik_differenziata_notifica_push
                state: 'on'
              sequence:
              - repeat:
                  for_each: *push
                  sequence:
                    - service: "notify.{{ repeat.item.service }}"
                      continue_on_error: true
                      data:
                        title: "♻️ Frarik — Differenziata"
                        message: >-
                          {%- set rif = states('sensor.frarik_differenziata_raccolta') | lower | trim -%}
                          {%- set mappa = {'umido': "l'umido", 'secco': 'il secco', 'carta': 'la carta', 'plastica': 'la plastica', 'vetro': 'il vetro', 'organico': "l'organico", 'lattine': 'le lattine', 'metalli': 'i metalli', 'indifferenziata': "l'indifferenziata"} -%}
                          {%- set items = rif.split(',') | map('trim') | select | list -%}
                          {%- set ns = namespace(voci=[]) -%}
                          {%- for i in items -%}{%- set ns.voci = ns.voci + [mappa.get(i, i)] -%}{%- endfor -%}
                          {%- if ns.voci | length == 1 -%}Stasera metti fuori {{ ns.voci[0] }}{%- elif ns.voci | length > 1 -%}Stasera metti fuori {{ ns.voci[:-1] | join(', ') }} e {{ ns.voci[-1] }}{%- else -%}Nessun rifiuto stasera{%- endif -%}

          # ── Annuncio Google Home ───────────────────
          - choose:
            - conditions:
              - condition: state
                entity_id: input_boolean.frarik_differenziata_notifica_google
                state: 'on'
              sequence:
              - service: tts.google_translate_say
                continue_on_error: true
                data:
                  entity_id: *google
                  language: 'it'
                  message: >-
                    {%- set rif = states('sensor.frarik_differenziata_raccolta') | lower | trim -%}
                    {%- set mappa = {'umido': "l'umido", 'secco': 'il secco', 'carta': 'la carta', 'plastica': 'la plastica', 'vetro': 'il vetro', 'organico': "l'organico", 'lattine': 'le lattine', 'metalli': 'i metalli', 'indifferenziata': "l'indifferenziata"} -%}
                    {%- set items = rif.split(',') | map('trim') | select | list -%}
                    {%- set ns = namespace(voci=[]) -%}
                    {%- for i in items -%}{%- set ns.voci = ns.voci + [mappa.get(i, i)] -%}{%- endfor -%}
                    {%- if ns.voci | length == 1 -%}Stasera metti fuori {{ ns.voci[0] }}{%- elif ns.voci | length > 1 -%}Stasera metti fuori {{ ns.voci[:-1] | join(', ') }} e {{ ns.voci[-1] }}{%- else -%}Nessun rifiuto stasera{%- endif -%}

          # ── Annuncio Alexa ─────────────────────────
          - choose:
            - conditions:
              - condition: state
                entity_id: input_boolean.frarik_differenziata_notifica_alexa
                state: 'on'
              sequence:
              - service: notify.alexa_media
                continue_on_error: true
                data:
                  target: *alexa
                  data:
                    type: announce
                    method: spoken
                  message: >-
                    {%- set rif = states('sensor.frarik_differenziata_raccolta') | lower | trim -%}
                    {%- set mappa = {'umido': "l'umido", 'secco': 'il secco', 'carta': 'la carta', 'plastica': 'la plastica', 'vetro': 'il vetro', 'organico': "l'organico", 'lattine': 'le lattine', 'metalli': 'i metalli', 'indifferenziata': "l'indifferenziata"} -%}
                    {%- set items = rif.split(',') | map('trim') | select | list -%}
                    {%- set ns = namespace(voci=[]) -%}
                    {%- for i in items -%}{%- set ns.voci = ns.voci + [mappa.get(i, i)] -%}{%- endfor -%}
                    {%- if ns.voci | length == 1 -%}Stasera metti fuori {{ ns.voci[0] }}{%- elif ns.voci | length > 1 -%}Stasera metti fuori {{ ns.voci[:-1] | join(', ') }} e {{ ns.voci[-1] }}{%- else -%}Nessun rifiuto stasera{%- endif -%}

###############################################################
#  Fine package — Frarik Centro Controllo Raccolta Differenziata v2.0
###############################################################
`;

  /* ── PKG BUILD ── */
  var _DIFF_WIZ_KEY = 'frarik_pkg_wizard_differenziata';

  function _diffBuildPkg(push, google, alexa, _tpl) {
    var ind = '          ';
    var pushLines = (push && push.length)
      ? push.map(function(p) { return ind + '- service: ' + p; }).join('\n')
      : ind + '- service: mobile_app_smartphone';
    var googleLines = (google && google.length)
      ? google.map(function(p) { return ind + '- ' + p; }).join('\n')
      : ind + '- media_player.tv_sala';
    var alexaLines = (alexa && alexa.length)
      ? alexa.map(function(p) { return ind + '- ' + p; }).join('\n')
      : ind + '- media_player.alexa_cameretta';
    var yaml = (_tpl || _DIFF_PKG_YAML);
    yaml = yaml.replace(/[ 	]*- service: IL_TUO_MOBILE_APP/, pushLines);
    yaml = yaml.replace(/[ 	]*- IL_TUO_MEDIA_PLAYER_GOOGLE/, googleLines);
    yaml = yaml.replace(/[ 	]*- IL_TUO_MEDIA_PLAYER_ALEXA/, alexaLines);
    return yaml;
  }

  /* ── WIZARD ── */
  function _diffOpenWizard(hass, onDone, _tpl, opts) {
    var isUpdate = !!(opts && opts.isUpdate);
    var states = (hass && hass.states) || {};
    var allIds = Object.keys(states).sort();
    var mediaIds = allIds.filter(function(id) { return /^media_player\./.test(id); });
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(_DIFF_WIZ_KEY) || 'null'); } catch(e) {}
    var pushRows   = (saved && saved.push   && saved.push.length)   ? saved.push.slice()   : [''];
    var googleRows = (saved && saved.google && saved.google.length) ? saved.google.slice() : [''];
    var alexaRows  = (saved && saved.alexa  && saved.alexa.length)  ? saved.alexa.slice()  : [''];

    var host = document.createElement('div');
    var sr = host.attachShadow({mode: 'open'});
    document.body.appendChild(host);
    function destroy() { try { document.body.removeChild(host); } catch(e) {} }

    function setupAC(inp, drop, ids) {
      if (!inp || !drop) return;
      function show() {
        var q = inp.value.toLowerCase().trim();
        var hits = (q ? ids.filter(function(id) { return id.toLowerCase().includes(q); }) : ids).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.innerHTML = hits.map(function(id) { return '<div class="wd-item" data-pick="' + id + '">' + id + '</div>'; }).join('');
        drop.style.display = 'block';
        drop.querySelectorAll('[data-pick]').forEach(function(row) {
          row.addEventListener('mousedown', function(ev) { ev.preventDefault(); inp.value = row.getAttribute('data-pick'); drop.style.display = 'none'; });
          row.addEventListener('mouseover', function() { row.style.background = 'rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout', function() { row.style.background = ''; });
        });
      }
      inp.addEventListener('focus', show);
      inp.addEventListener('input', show);
      inp.addEventListener('blur', function() { setTimeout(function() { drop.style.display = 'none'; }, 200); });
    }

    function multiRows(rows, cls, placeholder) {
      return rows.map(function(v, i) {
        return '<div class="wd-push-row"><div style="position:relative;flex:1"><input class="wd-inp ' + cls + '" type="text" autocomplete="off" placeholder="' + placeholder + '" value="' + (v || '').replace(/"/g, '&quot;') + '"><div class="wd-drop"></div></div><button class="wd-rm" data-rm="' + i + '">✕</button></div>';
      }).join('');
    }

    function renderWiz() {
      sr.innerHTML = '<style>'
        + ':host{all:initial;font-family:system-ui,sans-serif}'
        + '.wd-bd{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:flex-end}'
        + '.wd-panel{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;overflow:hidden;animation:wUp .22s cubic-bezier(.32,1.12,.56,1)}'
        + '@keyframes wUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'
        + '.wd-hdr{display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}'
        + '.wd-ico{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;flex-shrink:0}'
        + '.wd-tit{flex:1;font-size:16px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px}'
        + '.wd-x{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18)}'
        + '.wd-body{flex:1;overflow-y:auto;padding:16px;scrollbar-width:none;display:flex;flex-direction:column;gap:14px}'
        + '.wd-body::-webkit-scrollbar{display:none}'
        + '.wd-sec{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding-bottom:5px;border-bottom:1px solid rgba(56,189,248,.18);margin-bottom:10px}'
        + '.wd-lbl{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#fff;margin-bottom:3px}'
        + '.wd-inp{width:100%;padding:9px 11px;border-radius:10px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none}'
        + '.wd-inp:focus{border-color:rgba(56,189,248,.5)}'
        + '.wd-drop{position:absolute;left:0;right:0;top:100%;z-index:10;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 9px 9px;display:none}'
        + '.wd-item{padding:5px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#fff}'
        + '.wd-push-row{display:flex;gap:6px;margin-bottom:6px}'
        + '.wd-push-row .wd-inp{flex:1}'
        + '.wd-rm{width:30px;height:38px;border-radius:8px;background:rgba(255,255,255,.07);border:none;color:#fff;cursor:pointer;font-size:14px;flex-shrink:0}'
        + '.wd-add{padding:6px 12px;border-radius:8px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.25);color:#38bdf8;font-size:11px;font-weight:700;cursor:pointer}'
        + '.wd-note{font-size:11px;color:#fff;opacity:.6;line-height:1.5;margin:0 0 10px}'
        + '.wd-foot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;gap:8px;flex-shrink:0}'
        + '.wd-cancel{flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;font-size:13px;background:rgba(255,255,255,.1);color:#fff}'
        + '.wd-install{flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#38bdf8;color:#060d14}'
        + '.wd-loading{opacity:.6;pointer-events:none}'
        + '</style>'
        + '<div class="wd-bd" id="wd-bd">'
        + '<div class="wd-panel">'
        + '<div class="wd-hdr"><div class="wd-ico">♻️</div>'
        + '<div class="wd-tit">' + (isUpdate ? 'Aggiorna PKG Differenziata' : 'Installa PKG Differenziata') + '</div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'

        + '<div><div class="wd-sec">Notifiche Push</div>'
        + '<p class="wd-note">mobile_app dei dispositivi che ricevono le notifiche push (es. <code>mobile_app_iphone</code>). Lascia vuoto per non usare.</p>'
        + '<div id="push-rows">' + multiRows(pushRows, 'push-inp', 'mobile_app_...') + '</div>'
        + '<button class="wd-add" id="push-add">+ Aggiungi dispositivo</button>'
        + '</div>'

        + '<div><div class="wd-sec">Notifiche Google / Chromecast</div>'
        + '<p class="wd-note">media_player dei dispositivi Google Home / Chromecast (es. <code>media_player.google_cucina</code>). Lascia vuoto per non usare.</p>'
        + '<div id="google-rows">' + multiRows(googleRows, 'google-inp', 'media_player.google_cucina') + '</div>'
        + '<button class="wd-add" id="google-add">+ Aggiungi speaker Google</button>'
        + '</div>'

        + '<div><div class="wd-sec">Notifiche Alexa</div>'
        + '<p class="wd-note">media_player dei dispositivi Alexa (es. <code>media_player.echo_cucina</code>). Lascia vuoto per non usare.</p>'
        + '<div id="alexa-rows">' + multiRows(alexaRows, 'alexa-inp', 'media_player.echo_cucina') + '</div>'
        + '<button class="wd-add" id="alexa-add">+ Aggiungi Echo</button>'
        + '</div>'

        + '</div>'
        + '<div class="wd-foot">'
        + '<button class="wd-cancel" id="wd-cancel">Annulla</button>'
        + '<button class="wd-install" id="wd-install">' + (isUpdate ? '🔄 Aggiorna PKG' : '📦 Installa PKG') + '</button>'
        + '</div>'
        + '</div>'
        + '</div>';

      sr.getElementById('wd-x').addEventListener('click', destroy);
      sr.getElementById('wd-cancel').addEventListener('click', destroy);
      sr.getElementById('wd-bd').addEventListener('click', function(e) { if (e.target === sr.getElementById('wd-bd')) destroy(); });

      function bindMulti(containerId, rows, cls, addId) {
        sr.getElementById(containerId).addEventListener('click', function(e) {
          var btn = e.target.closest('[data-rm]'); if (!btn) return;
          rows.length = 0;
          Array.from(sr.querySelectorAll('.' + cls)).forEach(function(i) { rows.push(i.value); });
          rows.splice(+btn.dataset.rm, 1);
          if (!rows.length) rows.push('');
          renderWiz();
        });
        sr.getElementById(addId).addEventListener('click', function() {
          Array.from(sr.querySelectorAll('.' + cls)).forEach(function(i, idx) { rows[idx] = i.value; });
          rows.push('');
          renderWiz();
        });
      }
      bindMulti('push-rows',   pushRows,   'push-inp',   'push-add');
      bindMulti('google-rows', googleRows, 'google-inp', 'google-add');
      bindMulti('alexa-rows',  alexaRows,  'alexa-inp',  'alexa-add');

      sr.querySelectorAll('.google-inp').forEach(function(inp) { setupAC(inp, inp.parentElement.querySelector('.wd-drop'), mediaIds); });
      sr.querySelectorAll('.alexa-inp').forEach(function(inp)  { setupAC(inp, inp.parentElement.querySelector('.wd-drop'), mediaIds); });

      sr.getElementById('wd-install').addEventListener('click', function() {
        var push   = Array.from(sr.querySelectorAll('.push-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        var google = Array.from(sr.querySelectorAll('.google-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        var alexa  = Array.from(sr.querySelectorAll('.alexa-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        try { localStorage.setItem(_DIFF_WIZ_KEY, JSON.stringify({push: push, google: google, alexa: alexa})); } catch(e) {}
        var yaml = _diffBuildPkg(push, google, alexa, _tpl);
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading');
        btn.textContent = 'Installazione…';
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_differenziata.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Differenziata installato! Riavvia HA.'); } catch(e) {}
              if (typeof onDone === 'function') onDone();
            } else {
              try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore installazione PKG: ' + ((res.j && res.j.error) || '')); } catch(e) {}
            }
          }).catch(function() {
            destroy();
            try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore connessione al PKG install'); } catch(e) {}
          });
      });
    }

    renderWiz();
  }

  /* ── IMPOSTAZIONI HA POPUP ── */
  function openImpostazioniHAPopup(card) {
    openImpostazioni(card);
  }

  /* ── registrazione store ── */
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry['differenziata'] = {
    id: 'differenziata',
    name: 'Raccolta Differenziata',
    description: 'Card rifiuti differenziata con multi-selezione per giorno, bidoni realistici e colori personalizzabili.',
    icon: 'mdi:recycle',
    version: '5.20',
    frarik_pkg_check: 'sensor.frarik_differenziata_versione',
    frarik_pkg_id: 'frarik_differenziata',
    frarik_pkg_version: '2.0',
    frarik_no_edit: true,
    render:  render,
    mount:   mount,
    update:  update,
    configure: null,
    openWizard: _diffOpenWizard,
    _buildPkgFromConfig: function(cfg, _tpl) { return _diffBuildPkg(cfg.push || [], cfg.google || [], cfg.alexa || [], _tpl); },
  };
})();
