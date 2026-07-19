/* frarik-version: 1.7 */
/* v1.7: rimosso il limite max-width:340px sulla colonna anteprima, che la
   rendeva più stretta della colonna sensori nei popup larghi: ora le due
   colonne restano sempre esattamente uguali. */
/* v1.6: anteprima live del popup Configura ora a colonne pari 50/50 (era
   230px fisso, sproporzionato); il pulsante "⚙ Soglie" in card ora apre
   direttamente Configura (con anteprima+dimensione subito visibili) invece
   di Soglie, con un pulsante "🎚 Soglie batteria & reset contatori" per
   raggiungerle da lì. */
/* v1.5: consolidata la dimensione/anteprima card nel popup "Configura sensori"
   (prima duplicata anche in Soglie, ora rimossa da lì): il popup Configura
   ha ora un layout a due colonne con i campi sensore raggruppati in riquadri
   con contorno a sinistra, e anteprima live + slider dimensione a destra,
   come nelle altre card. */
/* v1.4: allineati popup ed etichette allo standard delle altre card (sfondo
   #0a0816, icona/bordo neutri, titolo maiuscolo, niente sottotitoli); bagliore
   card più visibile (.08→.16); pulsanti "Salva" ora blu pieno invece che
   translucidi; applicato maiuscolo+grassetto a TUTTO il testo di card e
   popup tramite regola CSS universale. Aggiunta sezione "Aspetto" nel popup
   Soglie con zoom/larghezza card e anteprima live (mancava del tutto). */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_upscard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function Attr(h, id, attr) { const s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes[attr] != null) ? s.attributes[attr] : null; }
  function num(v) { const x = parseFloat(String(v != null ? v : '').replace(',', '.')); return isNaN(x) ? null : x; }
  function callSvc(domain, service, data) { try { const h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch (e) {} }

  function pkDefaults() {
    return {
      pk_main:        'sensor.alimentazione_ups_tecnoware',
      pk_stato:       'sensor.tecnoware_dati_di_stato',
      pk_tipo:        'sensor.tecnoware_tipo_di_ups',
      pk_stato_txt:   'sensor.tecnoware_stato',
      pk_batteria:    'sensor.tecnoware_carica_batterie',
      pk_carico:      'sensor.tecnoware_carico',
      pk_vin:         'sensor.tecnoware_tensione_di_ingresso',
      pk_vout:        'sensor.tecnoware_tensione_di_uscita',
      pk_bo_oggi:     'sensor.cicli_blackout_oggi_ups',
      pk_bo_mese:     'sensor.cicli_blackout_mese_ups',
      pk_bo_anno:     'sensor.cicli_blackout_anno_ups',
      pk_bo_tot:      'counter.cicli_blackout_totale_ups',
      pk_dur_bo:      'input_text.durata_ultimo_blackout',
      pk_data_bo:     'input_text.data_ultimo_blackout',
      pk_ripristino:  'input_text.data_ripristino_energia',
      pk_soglia_av:   'input_number.soglia_avviso_batteria_tecnoware',
      pk_soglia_spg:  'input_number.soglia_batteria_spegnimento_programmato_server_tecnoware',
      pk_ntf_energia: 'input_boolean.notify_push_ups_tecnoware_energia',
      pk_ntf_batt:    'input_boolean.notify_push_ups_tecnoware_batteria_sotto_soglia',
      pk_ntf_spg:     'input_boolean.notify_push_ups_tecnoware_spegni_server',
    };
  }

  function cfgFor(card) {
    const c = load(card), pk = pkDefaults(), r = {};
    Object.keys(pk).forEach(function (k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    r.name = c.name || 'UPS Tecnoware';
    return r;
  }

  /* ── UPS SVG ── */
  function _socket(x, y) {
    return '<rect x="' + x + '" y="' + y + '" width="9" height="7" rx="1.5" fill="#040a14" stroke="rgba(255,255,255,.08)" stroke-width=".4"/>'
      + '<circle cx="' + (x + 2.5) + '" cy="' + (y + 3) + '" r="1.1" fill="#010407"/>'
      + '<circle cx="' + (x + 6.5) + '" cy="' + (y + 3) + '" r="1.1" fill="#010407"/>'
      + '<rect x="' + (x + 3.5) + '" y="' + (y + 5) + '" width="2" height="1.5" rx=".4" fill="#010407"/>';
  }

  function _upsSVG(batV, status) {
    const isOL = status === 'OL';
    const isOB = status === 'OB';
    const active = isOL || isOB;
    const batPct = batV != null ? Math.max(0, Math.min(100, Math.round(batV))) : null;
    const batSegs = batPct != null ? Math.min(5, Math.ceil(batPct / 20)) : 0;
    const batCol = batPct == null ? '#64748b' : batPct > 40 ? '#22c55e' : batPct > 20 ? '#f97316' : '#ef4444';
    const accentCol = isOB ? '#f97316' : '#38bdf8';
    const glowRgb = isOB ? '249,115,22' : '56,189,248';

    /* ── Battery bars: horizontal, bottom→top, staggered fade-in ── */
    const BX = 5, BW = 48, BH = 3.5, BGAP = 1.5, BY_BOT = 62;
    let bars = '';
    for (let i = 0; i < 5; i++) {
      const by = BY_BOT - i * (BH + BGAP);
      bars += '<rect x="' + BX + '" y="' + by + '" width="' + BW + '" height="' + BH + '" rx="1.2" fill="rgba(255,255,255,.035)" stroke="rgba(255,255,255,.07)" stroke-width=".3"/>';
      if (i < batSegs) {
        bars += '<rect x="' + BX + '" y="' + by + '" width="' + BW + '" height="' + BH + '" rx="1.2" fill="' + batCol + '"'
          + ' style="opacity:.88;animation:_uBF .45s ' + (i * .09).toFixed(2) + 's ease-out both"/>';
      }
    }

    /* ── Charging bolt (right of bars, when OL) ── */
    const boltX = BX + BW + 5;
    const bolt = isOL
      ? '<path d="M' + boltX + ',43 L' + (boltX - 5) + ',53 L' + boltX + ',53 L' + (boltX - 5) + ',65"'
        + ' stroke="' + accentCol + '" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"'
        + ' style="animation:_uBolt 1.3s ease-in-out infinite"/>'
      : '';

    /* ── Power flow lines ── */
    const inC  = isOL ? accentCol : 'rgba(255,255,255,.06)';
    const outC = active ? (isOB ? '#f97316' : '#22c55e') : 'rgba(255,255,255,.06)';
    const inAnim  = isOL   ? ' style="animation:_uFL 1s linear infinite"' : '';
    const outAnim = active  ? ' style="animation:_uFR 1s linear infinite"' : '';

    /* ── Status LEDs ── */
    const ledSpd  = isOB ? '.85' : '2.2';
    const pwrFill  = isOL ? '#22c55e' : '#091509';
    const battFill = isOB ? '#f97316' : '#190b00';
    const pwrAnim  = isOL ? ' style="animation:_uPls ' + ledSpd + 's ease-in-out infinite"' : '';
    const battAnim = isOB ? ' style="animation:_uPls ' + ledSpd + 's ease-in-out infinite"' : '';

    const statusTxt = isOL ? 'ON LINE' : isOB ? 'ON BATT' : 'N / D';
    const dispBat   = batPct != null ? batPct + '%' : '--';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96" style="display:block;width:100%;height:100%;filter:drop-shadow(0 0 12px rgba(' + glowRgb + ',.22))">'
      + '<defs><style>'
      + '@keyframes _uBF{from{opacity:0}to{opacity:.88}}'
      + '@keyframes _uPls{0%,100%{opacity:.4}50%{opacity:1}}'
      + '@keyframes _uFL{0%{stroke-dashoffset:14}100%{stroke-dashoffset:0}}'
      + '@keyframes _uFR{0%{stroke-dashoffset:-14}100%{stroke-dashoffset:0}}'
      + '@keyframes _uBolt{0%,100%{opacity:.15;stroke-width:1.5}50%{opacity:1;stroke-width:2.8}}'
      + '@keyframes _uBdr{0%,100%{stroke-opacity:.22}50%{stroke-opacity:.58}}'
      + '</style></defs>'

      /* Body */
      + '<rect x="1" y="1" width="62" height="94" rx="6" fill="#091727" stroke="' + accentCol + '" stroke-width=".8" style="animation:_uBdr 2.6s ease-in-out infinite"/>'

      /* Header band */
      + '<rect x="1" y="1" width="62" height="15" rx="6" fill="#060f1d"/>'
      + '<rect x="1" y="10" width="62" height="6" fill="#060f1d"/>'
      + '<text x="9" y="9.5" font-size="4" font-family="monospace" font-weight="900" fill="' + accentCol + '" opacity=".5" letter-spacing=".5">TECNOWARE</text>'

      /* PWR LED */
      + '<circle cx="46" cy="7" r="3" fill="' + pwrFill + '"' + pwrAnim + '/>'
      + '<circle cx="46" cy="7" r="1.1" fill="rgba(255,255,255,.18)"/>'
      + '<text x="46" y="13" text-anchor="middle" font-size="2.8" fill="rgba(255,255,255,.3)" font-family="system-ui">PWR</text>'

      /* BATT LED */
      + '<circle cx="56" cy="7" r="3" fill="' + battFill + '"' + battAnim + '/>'
      + '<circle cx="56" cy="7" r="1.1" fill="rgba(255,255,255,.18)"/>'
      + '<text x="56" y="13" text-anchor="middle" font-size="2.8" fill="rgba(255,255,255,.3)" font-family="system-ui">BATT</text>'

      /* LCD Display */
      + '<rect x="4" y="16" width="56" height="19" rx="3" fill="#030c16" stroke="rgba(' + glowRgb + ',.22)" stroke-width=".5"/>'
      + '<text x="8" y="24" font-size="5" font-family="monospace" font-weight="700" fill="' + accentCol + '" opacity=".75">' + statusTxt + '</text>'
      + '<text x="48" y="33" text-anchor="end" font-size="13" font-family="monospace" font-weight="900" fill="' + batCol + '">' + dispBat + '</text>'

      /* Battery section label */
      + '<text x="5" y="38.5" font-size="3.5" fill="rgba(255,255,255,.2)" font-family="system-ui" letter-spacing=".3">BATTERY LEVEL</text>'

      /* Battery bars + charging bolt */
      + bars
      + bolt

      /* Separator */
      + '<rect x="1" y="67" width="62" height=".5" fill="rgba(255,255,255,.06)"/>'

      /* Power flow labels + animated dashes */
      + '<text x="4" y="71.5" font-size="3.2" fill="rgba(255,255,255,.22)" font-family="system-ui">AC IN</text>'
      + '<line x1="16" y1="73" x2="30" y2="73" stroke="' + inC + '" stroke-width="1.5" stroke-dasharray="4 3"' + inAnim + '/>'
      + '<text x="33" y="71.5" font-size="3.2" fill="rgba(255,255,255,.22)" font-family="system-ui">OUT</text>'
      + '<line x1="41" y1="73" x2="62" y2="73" stroke="' + outC + '" stroke-width="1.5" stroke-dasharray="4 3"' + outAnim + '/>'

      /* Separator 2 */
      + '<rect x="1" y="75.5" width="62" height=".4" fill="rgba(255,255,255,.04)"/>'

      /* Sockets */
      + '<text x="4" y="79.5" font-size="3.2" fill="rgba(255,255,255,.15)" font-family="system-ui">USCITE</text>'
      + _socket(3, 81) + _socket(14, 81) + _socket(25, 81) + _socket(36, 81) + _socket(47, 81)
      + '<rect x="57" y="81" width="6" height="7" rx="1.5" fill="#040a14" stroke="rgba(255,255,255,.08)" stroke-width=".4"/>'
      + '<rect x="58.5" y="82.5" width="3" height="4" rx=".5" fill="rgba(255,255,255,.04)"/>'

      /* Bottom accent */
      + '<rect x="1" y="90" width="62" height=".4" fill="rgba(255,255,255,.04)"/>'

      + '</svg>';
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = cfgFor(card);
    const rid = 'fru' + (card.id || Math.random().toString(36).slice(2, 8));

    const rawStatus = S(h, c.pk_stato) || '';
    const status = rawStatus === 'OL' ? 'OL' : rawStatus === 'OB' ? 'OB' : 'ND';
    const isOL = status === 'OL', isOB = status === 'OB';

    const _batAttr = Attr(h, c.pk_main, 'livello_batteria');
    const batV = _batAttr != null ? num(_batAttr) : num(S(h, c.pk_batteria));
    const _caricoAttr = Attr(h, c.pk_main, 'carico_ups');
    const caricoV = _caricoAttr != null ? num(_caricoAttr) : num(S(h, c.pk_carico));
    const _vinAttr = Attr(h, c.pk_main, 'volt_ingresso');
    const vinV = _vinAttr != null ? num(_vinAttr) : num(S(h, c.pk_vin));
    const _voutAttr = Attr(h, c.pk_main, 'volt_uscita');
    const voutV = _voutAttr != null ? num(_voutAttr) : num(S(h, c.pk_vout));

    const boOggi = S(h, c.pk_bo_oggi);
    const boMese = S(h, c.pk_bo_mese);
    const boAnno = S(h, c.pk_bo_anno);
    const durBO = S(h, c.pk_dur_bo);

    const batPct = batV != null ? Math.round(batV) : null;
    const batCol = batPct == null ? '#64748b' : batPct > 40 ? '#38bdf8' : batPct > 20 ? '#f97316' : '#ef4444';
    const statusLabel = isOL ? 'ON LINE' : isOB ? 'BATTERIA' : 'N/D';
    const statusRgb = isOB ? '249,115,22' : isOL ? '56,189,248' : '100,116,139';
    const statusHex = isOB ? '#f97316' : isOL ? '#38bdf8' : '#64748b';
    const pulsing = isOL || isOB;

    function met(lbl, val, col) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:4px">'
        + '<span style="font-size:11px;font-weight:700;color:#fff;flex-shrink:0">' + lbl + '</span>'
        + '<span style="font-size:13px;font-weight:800;color:' + (col || '#fff') + '">' + val + '</span>'
        + '</div>';
    }

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(56,189,248,.16) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-card *{text-transform:uppercase!important;font-weight:800!important}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + statusHex + (pulsing ? ';box-shadow:0 0 5px ' + statusHex + ';animation:fcPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;max-height:130px}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:5px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      + '#' + rid + ' .fc-stats{display:flex;margin:0 14px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden}'
      + '#' + rid + ' .fc-sb{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 3px;gap:2px}'
      + '#' + rid + ' .fc-sb-sep{width:1px;background:rgba(255,255,255,.08);flex-shrink:0}'
      + '#' + rid + ' .fc-sb-n{font-size:12px;font-weight:900;color:#38bdf8;height:18px;display:flex;align-items:center;justify-content:center}'
      + '#' + rid + ' .fc-sb-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px;text-align:center}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 12px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(56,189,248,.12);border-color:rgba(56,189,248,.3);color:#38bdf8}'
      + (pulsing ? '@keyframes fcPulse{0%,100%{opacity:.6}50%{opacity:1}}' : '')
      + '</style>';

    const heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img">' + _upsSVG(batV, status) + '</div>'
      + '<div class="fc-hero-r">'
      + '<div style="display:flex;align-items:baseline;gap:3px">'
      + '<span style="font-size:30px;font-weight:900;line-height:1;color:' + batCol + '">' + (batPct != null ? batPct : '—') + '</span>'
      + (batPct != null ? '<span style="font-size:13px;font-weight:700;color:#fff">%</span>' : '')
      + '</div>'
      + '<div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">'
      + '<div style="height:100%;width:' + (batPct != null ? Math.min(100, batPct) : 0) + '%;background:' + batCol + ';border-radius:3px;transition:width .6s"></div>'
      + '</div>'
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Batteria</div>'
      + met('Carico', caricoV != null ? Math.round(caricoV) + ' %' : '—', '#a78bfa')
      + met('V-In', vinV != null ? Math.round(vinV) + ' V' : '—', '#38bdf8')
      + met('V-Out', voutV != null ? Math.round(voutV) + ' V' : '—', '#34d399')
      + '</div>'
      + '</div>';

    const durShort = durBO && durBO !== 'unknown' && durBO !== 'unavailable' ? durBO : '—';
    const statsHtml = '<div class="fc-stats">'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (boOggi || '—') + '</div><div class="fc-sb-l">Oggi</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (boMese || '—') + '</div><div class="fc-sb-l">Mese</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (boAnno || '—') + '</div><div class="fc-sb-l">Anno</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n" style="font-size:10px">' + durShort + '</div><div class="fc-sb-l">Ultimo</div></div>'
      + '</div>';

    const btnsHtml = '<div class="fc-btns">'
      + '<div class="fc-btn" data-sya="storico">📊 Storico</div>'
      + '<div class="fc-btn" data-sya="notifiche">🔔 Notifiche</div>'
      + '<div class="fc-btn" data-sya="soglie">⚙ Soglie</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">🔋</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'UPS Tecnoware') + '</div>'
      + '<div class="fc-hdr-pill" style="background:rgba(' + statusRgb + ',.1);border:1px solid rgba(' + statusRgb + ',.3);color:' + statusHex + '">'
      + '<div class="fc-dot"></div>'
      + statusLabel
      + '</div>'
      + '</div>'
      + '<div class="fc-scroll">'
      + heroHtml
      + statsHtml
      + btnsHtml
      + '</div>'
      + '</div>'
      + '</div>';
  }

  /* ── POPUP HELPERS ── */
  function mkOv(html, closeId) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    const close = function () { try { document.body.removeChild(ov); } catch (e) {} };
    const btn = ov.querySelector('#' + closeId); if (btn) btn.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov._close = close;
    return ov;
  }
  const POP_CSS = '<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc{overflow-y:auto;scrollbar-width:none}.fcpc::-webkit-scrollbar{display:none}.fcpc *{text-transform:uppercase!important;font-weight:800!important}</style>';
  function popShell(icon, title, closeId, content) {
    return POP_CSS + '<div style="width:100%;max-height:88vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">'
      + '<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;flex-shrink:0">' + icon + '</div>'
      + '<div style="flex:1;font-size:16px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:.3px">' + title + '</div>'
      + '<button id="' + closeId + '" style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);flex-shrink:0">✕</button>'
      + '</div>'
      + '<div class="fcpc" style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }

  /* ── STORICO POPUP ── */
  function openStoricoPopup(c) {
    const h = H();
    function row(lbl, val, col) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        + '<span style="font-size:12px;color:#fff">' + lbl + '</span>'
        + '<span style="font-size:13px;font-weight:800;color:' + (col || '#38bdf8') + '">' + (val != null && val !== 'unknown' && val !== 'unavailable' ? val : '—') + '</span>'
        + '</div>';
    }
    function sec(lbl) {
      return '<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding:12px 0 6px;border-bottom:1px solid rgba(56,189,248,.15)">' + lbl + '</div>';
    }
    const batVal = Attr(h, c.pk_main, 'livello_batteria') != null ? Attr(h, c.pk_main, 'livello_batteria') : S(h, c.pk_batteria);
    const caricoVal = Attr(h, c.pk_main, 'carico_ups') != null ? Attr(h, c.pk_main, 'carico_ups') : S(h, c.pk_carico);
    const vinVal = Attr(h, c.pk_main, 'volt_ingresso') != null ? Attr(h, c.pk_main, 'volt_ingresso') : S(h, c.pk_vin);
    const voutVal = Attr(h, c.pk_main, 'volt_uscita') != null ? Attr(h, c.pk_main, 'volt_uscita') : S(h, c.pk_vout);
    const content = sec('⚡ Conteggio blackout')
      + row('Oggi', S(h, c.pk_bo_oggi))
      + row('Questo mese', S(h, c.pk_bo_mese))
      + row('Questo anno', S(h, c.pk_bo_anno))
      + row('Totale storico', S(h, c.pk_bo_tot), '#7dd3fc')
      + sec('🕐 Ultimo evento')
      + row('Data blackout', S(h, c.pk_data_bo), '#fff')
      + row('Durata blackout', S(h, c.pk_dur_bo), '#f97316')
      + row('Data ripristino', S(h, c.pk_ripristino), '#fff')
      + sec('🔋 Stato UPS')
      + row('Stato', S(h, c.pk_stato), '#38bdf8')
      + row('Stato testuale', S(h, c.pk_stato_txt), '#7dd3fc')
      + row('Modello / Tipo', S(h, c.pk_tipo), '#fff')
      + row('Batteria', batVal != null ? batVal + ' %' : null, '#38bdf8')
      + row('Carico', caricoVal != null ? caricoVal + ' %' : null, '#a78bfa')
      + row('Tensione ingresso', vinVal != null ? vinVal + ' V' : null, '#7dd3fc')
      + row('Tensione uscita', voutVal != null ? voutVal + ' V' : null, '#34d399');
    mkOv(popShell('📊', 'Storico Blackout', 'ups-st-close', content), 'ups-st-close');
  }

  /* ── NOTIFICHE POPUP ── */
  function openNotifPopup(c) {
    const h = H();
    function bs(e) { return !!(h && h.states && h.states[e] && h.states[e].state === 'on'); }
    const swCss = '<style>'
      + '.ups-sw{width:44px;height:26px;border-radius:13px;cursor:pointer;position:relative;flex-shrink:0;transition:background .25s}'
      + '.ups-sw.on{background:#38bdf8}.ups-sw.off{background:rgba(255,255,255,.12)}'
      + '.ups-knob{position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .25s;box-shadow:0 1px 4px rgba(0,0,0,.4)}'
      + '.ups-sw.on .ups-knob{left:21px}.ups-sw.off .ups-knob{left:3px}'
      + '</style>';
    function tog(entity, lbl) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        + '<span style="font-size:13px;color:#fff">' + lbl + '</span>'
        + '<div class="ups-sw ' + (bs(entity) ? 'on' : 'off') + '" data-entity="' + entity + '"><div class="ups-knob"></div></div>'
        + '</div>';
    }
    const content = swCss
      + tog(c.pk_ntf_energia, '📱 Ripristino energia')
      + tog(c.pk_ntf_batt, '🔋 Batteria sotto soglia')
      + tog(c.pk_ntf_spg, '🖥 Spegnimento server programmato')
      + '<button id="ups-ntf-save" style="width:100%;margin-top:14px;padding:12px;border-radius:12px;background:#38bdf8;border:none;color:#fff;font-size:14px;font-weight:800;cursor:pointer">💾 Salva</button>';
    const ov = mkOv(popShell('🔔', 'Notifiche Push', 'ups-ntf-close', content), 'ups-ntf-close');
    ov.querySelectorAll('.ups-sw').forEach(function (sw) {
      sw.addEventListener('click', function () { sw.classList.toggle('on'); sw.classList.toggle('off'); });
    });
    const sb = ov.querySelector('#ups-ntf-save');
    if (sb) sb.addEventListener('click', function () {
      ov.querySelectorAll('.ups-sw[data-entity]').forEach(function (sw) {
        callSvc('input_boolean', sw.classList.contains('on') ? 'turn_on' : 'turn_off', {entity_id: sw.dataset.entity});
      });
      sb.textContent = '✅ Salvato!'; sb.style.background = 'rgba(34,197,94,.15)'; sb.style.borderColor = 'rgba(34,197,94,.4)'; sb.style.color = '#4ade80';
      setTimeout(function () { try { ov._close(); } catch (e) {} }, 1500);
    });
  }

  /* ── SOGLIE POPUP ── */
  function openSogliePopup(card, el) {
    const h = H(), c = cfgFor(card);
    const iBase = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:13px;box-sizing:border-box;outline:none;color-scheme:dark';
    function nv(e) { const v = num(S(h, e)); return v != null ? v : ''; }
    const boxOpen = '<div style="padding:14px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #fff">';
    const boxClose = '</div>';
    const content = '<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding:0 0 10px;border-bottom:1px solid rgba(56,189,248,.15);margin-bottom:12px">Soglie batteria</div>'
      + boxOpen
      + '<div style="margin-bottom:10px"><div style="font-size:12px;color:#fff;margin-bottom:5px">⚠️ Soglia avviso (%)</div>'
      + '<input id="ups-sg-av" type="number" min="0" max="100" step="1" value="' + nv(c.pk_soglia_av) + '" style="' + iBase + '"></div>'
      + '<div><div style="font-size:12px;color:#fff;margin-bottom:5px">🖥 Soglia spegnimento server (%)</div>'
      + '<input id="ups-sg-spg" type="number" min="0" max="100" step="1" value="' + nv(c.pk_soglia_spg) + '" style="' + iBase + '"></div>'
      + boxClose
      + '<button id="ups-sg-save" style="width:100%;margin-top:14px;padding:12px;border-radius:12px;background:#38bdf8;border:none;color:#fff;font-size:14px;font-weight:800;cursor:pointer;margin-bottom:8px">💾 Salva soglie</button>'
      + '<button id="ups-sg-reset" style="width:100%;padding:11px;border-radius:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#f87171;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px">🔄 Reset contatori blackout</button>'
      + '<button id="ups-sg-cfg" style="width:100%;padding:11px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#fff;font-size:13px;font-weight:700;cursor:pointer">⚙ Configura sensori & aspetto</button>';
    const ov = mkOv(popShell('⚙', 'Soglie & Impostazioni', 'ups-sg-close', content), 'ups-sg-close');

    const sb = ov.querySelector('#ups-sg-save');
    if (sb) sb.addEventListener('click', function () {
      const av = parseFloat(ov.querySelector('#ups-sg-av').value);
      const spg = parseFloat(ov.querySelector('#ups-sg-spg').value);
      if (!isNaN(av)) callSvc('input_number', 'set_value', {entity_id: c.pk_soglia_av, value: av});
      if (!isNaN(spg)) callSvc('input_number', 'set_value', {entity_id: c.pk_soglia_spg, value: spg});
      sb.textContent = '✅ Salvato!'; sb.style.background = 'rgba(34,197,94,.15)'; sb.style.borderColor = 'rgba(34,197,94,.4)'; sb.style.color = '#4ade80';
      setTimeout(function () { sb.textContent = '💾 Salva soglie'; sb.style.background = ''; sb.style.borderColor = ''; sb.style.color = ''; }, 2000);
    });
    const rb = ov.querySelector('#ups-sg-reset');
    if (rb) rb.addEventListener('click', function () {
      callSvc('script', 'turn_on', {entity_id: 'script.reset_sensori_blackout_ups'});
      rb.textContent = '✅ Reset avviato!'; rb.style.color = '#4ade80';
      setTimeout(function () { try { ov._close(); } catch (e) {} }, 1500);
    });
    const cfgBtn = ov.querySelector('#ups-sg-cfg');
    if (cfgBtn) cfgBtn.addEventListener('click', function () {
      ov._close();
      setTimeout(function () { openCfg(card, el); }, 80);
    });
  }

  /* ── CONFIG WIZARD ── */
  function openCfg(card, el) {
    const h = H(), cf = cfgFor(card);
    const allIds = Object.keys((h && h.states) || {}).sort();
    const stInp = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none';
    const stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stSec = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(56,189,248,.2)';
    const boxOpen = '<div style="padding:14px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid #fff;margin-bottom:9px">';
    const boxClose = '</div>';
    function field(fid, lbl2, val, hint) {
      return '<div style="margin-bottom:9px;position:relative"><label style="' + stLbl + '">' + lbl2 + (hint ? '<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">' + hint + '</span>' : '') + '</label>'
        + '<input id="' + fid + '" type="text" value="' + (val || '').replace(/"/g, '&quot;') + '" autocomplete="off" placeholder="Cerca entità…" style="' + stInp + '">'
        + '<div id="' + fid + '-d" style="' + stDrop + '"></div></div>';
    }
    const cardId = (card && card.id) || '';
    let _ll = {}; try { _ll = JSON.parse(localStorage.getItem('_frk_layout_'+cardId)||'{}'); } catch(e) {}
    let tScale = _ll.cardScale!=null?_ll.cardScale:100, tW = _ll.cardW!=null?_ll.cardW:100;
    function layoutRow(lbl2, id, val) {
      const vLbl = val>=100?'Auto (100%)':val+'%';
      return '<div style="display:flex;align-items:center;gap:8px;margin-top:10px">'
        + '<span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#fff;width:72px;flex-shrink:0">' + lbl2 + '</span>'
        + '<input type="range" id="' + id + '" min="20" max="100" step="5" value="' + val + '" style="flex:1;accent-color:#38bdf8;cursor:pointer">'
        + '<span id="' + id + '-lbl" style="font-size:12px;font-weight:900;color:#fff;width:54px;text-align:right;flex-shrink:0">' + vLbl + '</span>'
        + '</div>';
    }
    const settingsHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label>'
      + '<input id="ups-cf-name" type="text" value="' + (cf.name || '').replace(/"/g, '&quot;') + '" placeholder="es. UPS Server" style="' + stInp.replace('monospace', 'system-ui') + '"></div>'
      + '<div style="' + stSec + '">Sensori principali</div>'
      + boxOpen
      + field('ups-cf-main',   'Sensore aggregato',      cf.pk_main,      'sensor.alimentazione_ups_tecnoware')
      + field('ups-cf-stato',  'Stato raw (OL/OB)',      cf.pk_stato,     'sensor.tecnoware_dati_di_stato')
      + field('ups-cf-tipo',   'Tipo / Modello UPS',     cf.pk_tipo,      'sensor.tecnoware_tipo_di_ups')
      + field('ups-cf-stxt',   'Stato testuale',         cf.pk_stato_txt, 'sensor.tecnoware_stato')
      + boxClose
      + '<div style="' + stSec + '">Sensori fisici</div>'
      + boxOpen
      + field('ups-cf-batt',   'Carica batteria %',      cf.pk_batteria, 'sensor.tecnoware_carica_batterie')
      + field('ups-cf-carico', 'Carico UPS %',           cf.pk_carico,   'sensor.tecnoware_carico')
      + field('ups-cf-vin',    'Tensione ingresso',      cf.pk_vin,      'sensor.tecnoware_tensione_di_ingresso')
      + field('ups-cf-vout',   'Tensione uscita',        cf.pk_vout,     'sensor.tecnoware_tensione_di_uscita')
      + boxClose
      + '<div style="' + stSec + '">Contatori blackout</div>'
      + boxOpen
      + field('ups-cf-bo-og',  'Blackout oggi',          cf.pk_bo_oggi,  'sensor.cicli_blackout_oggi_ups')
      + field('ups-cf-bo-me',  'Blackout mese',          cf.pk_bo_mese,  'sensor.cicli_blackout_mese_ups')
      + field('ups-cf-bo-an',  'Blackout anno',          cf.pk_bo_anno,  'sensor.cicli_blackout_anno_ups')
      + field('ups-cf-bo-tot', 'Blackout totale',        cf.pk_bo_tot,   'counter.cicli_blackout_totale_ups')
      + boxClose
      + '<div style="' + stSec + '">Testi evento</div>'
      + boxOpen
      + field('ups-cf-dur',    'Durata ultimo blackout', cf.pk_dur_bo,    'input_text.durata_ultimo_blackout')
      + field('ups-cf-data',   'Data ultimo blackout',   cf.pk_data_bo,   'input_text.data_ultimo_blackout')
      + field('ups-cf-rip',    'Data ripristino',        cf.pk_ripristino,'input_text.data_ripristino_energia')
      + boxClose
      + '<div style="' + stSec + '">Soglie & notifiche</div>'
      + boxOpen
      + field('ups-cf-sgav',   'Soglia avviso batt.',    cf.pk_soglia_av,  'input_number.soglia_avviso_batteria_tecnoware')
      + field('ups-cf-sgspg',  'Soglia spegni server',   cf.pk_soglia_spg, 'input_number.soglia_batteria_spegnimento_programmato_server_tecnoware')
      + field('ups-cf-nte',    'Notify energia',         cf.pk_ntf_energia,'input_boolean.notify_push_ups_tecnoware_energia')
      + field('ups-cf-ntb',    'Notify batteria',        cf.pk_ntf_batt,   'input_boolean.notify_push_ups_tecnoware_batteria_sotto_soglia')
      + field('ups-cf-nts',    'Notify spegnimento',     cf.pk_ntf_spg,    'input_boolean.notify_push_ups_tecnoware_spegni_server')
      + boxClose
      + '<button id="ups-cf-sg" style="width:100%;margin-top:16px;padding:11px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#fff;font-size:13px;font-weight:700;cursor:pointer">🎚 Soglie batteria & reset contatori</button>'
      + '<div style="display:flex;gap:8px;margin-top:8px">'
      + '<button id="ups-cf-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="ups-cf-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#fff">Salva</button>'
      + '</div>';

    const previewHtml = '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#fff">Anteprima live</div>'
      + '<div id="ups-cf-prev" style="border-radius:14px;overflow:hidden;background:rgba(255,255,255,.02);margin-top:8px;padding:10px;display:flex;justify-content:center"></div>'
      + '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#fff;margin-top:16px">Dimensione card</div>'
      + layoutRow('Altezza', 'ups-cf-scale', tScale)
      + layoutRow('Larghezza', 'ups-cf-w', tW);

    const formHtml = '<div style="display:flex;gap:20px;align-items:flex-start">'
      + '<div style="flex:1;min-width:0">' + settingsHtml + '</div>'
      + '<div style="flex:1;min-width:0">' + previewHtml + '</div>'
      + '</div>';

    const fieldIds = ['ups-cf-main','ups-cf-stato','ups-cf-tipo','ups-cf-stxt','ups-cf-batt','ups-cf-carico','ups-cf-vin','ups-cf-vout',
      'ups-cf-bo-og','ups-cf-bo-me','ups-cf-bo-an','ups-cf-bo-tot',
      'ups-cf-dur','ups-cf-data','ups-cf-rip','ups-cf-sgav','ups-cf-sgspg','ups-cf-nte','ups-cf-ntb','ups-cf-nts'];
    const ov = mkOv(popShell('🔋', 'Configura UPS', 'ups-cf-close', formHtml), 'ups-cf-close');
    ov.querySelector('#ups-cf-cancel').addEventListener('click', function () { ov._close(); });
    const sgBtn = ov.querySelector('#ups-cf-sg');
    if (sgBtn) sgBtn.addEventListener('click', function () {
      ov._close();
      setTimeout(function () { openSogliePopup(card, el); }, 80);
    });

    function _upsCfPreview() {
      const wrap = ov.querySelector('#ups-cf-prev'); if (!wrap) return;
      const baseRid = 'fru' + (cardId || 'x');
      const previewRid = baseRid + '-prev';
      try { wrap.innerHTML = render(card).split(baseRid).join(previewRid); } catch(e) {}
      const elp = wrap.querySelector('#' + previewRid);
      if (elp) { elp.style.width = tW<100?tW+'%':''; elp.style.zoom = tScale<100?tScale+'%':''; }
    }
    const cfScaleInp = ov.querySelector('#ups-cf-scale'), cfWInp = ov.querySelector('#ups-cf-w');
    if (cfScaleInp) cfScaleInp.addEventListener('input', function() {
      tScale = parseInt(cfScaleInp.value, 10);
      const l = ov.querySelector('#ups-cf-scale-lbl'); if (l) l.textContent = tScale>=100?'Auto (100%)':tScale+'%';
      _upsCfPreview();
    });
    if (cfWInp) cfWInp.addEventListener('input', function() {
      tW = parseInt(cfWInp.value, 10);
      const l = ov.querySelector('#ups-cf-w-lbl'); if (l) l.textContent = tW>=100?'Auto (100%)':tW+'%';
      _upsCfPreview();
    });
    _upsCfPreview();

    function g(id) { const e = ov.querySelector('#' + id); return e ? e.value.trim() : ''; }
    fieldIds.forEach(function (fid) {
      const inp = ov.querySelector('#' + fid), drop = ov.querySelector('#' + fid + '-d');
      if (!inp || !drop) return;
      function showDrop() {
        const q = inp.value.toLowerCase().trim();
        const hits = (q ? allIds.filter(function (id) { return id.toLowerCase().includes(q); }) : allIds).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(function (id) { return '<div data-pick="' + id + '" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">' + id + '</div>'; }).join('');
        drop.querySelectorAll('[data-pick]').forEach(function (row) {
          row.addEventListener('mousedown', function (ev) { ev.preventDefault(); inp.value = row.getAttribute('data-pick'); drop.style.display = 'none'; });
          row.addEventListener('mouseover', function () { row.style.background = 'rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout', function () { row.style.background = ''; });
        });
      }
      inp.addEventListener('focus', showDrop);
      inp.addEventListener('input', showDrop);
      inp.addEventListener('blur', function () { setTimeout(function () { drop.style.display = 'none'; }, 200); });
    });

    ov.querySelector('#ups-cf-save').addEventListener('click', function () {
      save(card, {
        name: g('ups-cf-name'),
        pk_main: g('ups-cf-main'), pk_stato: g('ups-cf-stato'),
        pk_tipo: g('ups-cf-tipo'), pk_stato_txt: g('ups-cf-stxt'),
        pk_batteria: g('ups-cf-batt'), pk_carico: g('ups-cf-carico'),
        pk_vin: g('ups-cf-vin'), pk_vout: g('ups-cf-vout'),
        pk_bo_oggi: g('ups-cf-bo-og'), pk_bo_mese: g('ups-cf-bo-me'),
        pk_bo_anno: g('ups-cf-bo-an'), pk_bo_tot: g('ups-cf-bo-tot'),
        pk_dur_bo: g('ups-cf-dur'), pk_data_bo: g('ups-cf-data'), pk_ripristino: g('ups-cf-rip'),
        pk_soglia_av: g('ups-cf-sgav'), pk_soglia_spg: g('ups-cf-sgspg'),
        pk_ntf_energia: g('ups-cf-nte'), pk_ntf_batt: g('ups-cf-ntb'), pk_ntf_spg: g('ups-cf-nts'),
      });
      try {
        localStorage.setItem('_frk_layout_'+cardId, JSON.stringify({cardScale:tScale, cardW:tW}));
        document.dispatchEvent(new CustomEvent('frarik-card-layout', {bubbles:true, detail:{cardId:cardId, cardScale:tScale, cardW:tW}}));
      } catch(e) {}
      ov._close();
      try { el._upsSig = ''; el.innerHTML = render(card); } catch (e) {}
    });
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    const h = H(), c = cfgFor(card);
    const sig = [CARD.version, S(h, c.pk_main), S(h, c.pk_stato), S(h, c.pk_batteria), S(h, c.pk_bo_oggi), S(h, c.pk_carico)].join('|');
    if (!el.querySelector('.fc-card') || el._upsSig !== sig) {
      el._upsSig = sig;
      el.innerHTML = render(card);
    }
    mount(card, hass, el);
  }

  function mount(card, hass, el) {
    if (el._upsBound === CARD.version) return;
    el._upsBound = CARD.version;
    if (el._upsHandler) el.removeEventListener('click', el._upsHandler);
    el._upsHandler = function (e) {
      const sya = e.target.closest('[data-sya]'); if (!sya) return;
      const a = sya.dataset.sya;
      if (a === 'storico')   { openStoricoPopup(cfgFor(card)); return; }
      if (a === 'notifiche') { openNotifPopup(cfgFor(card)); return; }
      if (a === 'soglie')    { openCfg(card, el); return; }
    };
    el.addEventListener('click', el._upsHandler);
  }

  /* ── CARD DEFINITION ── */
  var CARD = {
    id: 'ups-card',
    name: 'UPS',
    icon: '🔋',
    version: '1.7',
    desc: 'Monitoraggio UPS: batteria, carico, tensioni, storico blackout e notifiche push. Richiede PKG UPS Tecnoware.',
    colSpan: 2,
    rowSpan: 3,
    frarik_no_edit: true,
    frarik_pkg_id: 'frarik_ups',
    frarik_pkg_check: 'sensor.alimentazione_ups_tecnoware',
    frarik_pkg_version: '1.0',
    render: function (card) { return render(card); },
    mount: function (card, hass, el) { return mount(card, hass, el); },
    update: function (card, hass, el) { return update(card, hass, el); },
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
})();
