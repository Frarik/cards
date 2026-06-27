/* frarik-version: 1.1 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_frigocard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function Attr(h, id, attr) { const s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes[attr] != null) ? s.attributes[attr] : null; }
  function num(v) { const x = parseFloat(String(v || '').replace(',', '.')); return isNaN(x) ? null : x; }
  function has(h, id) { return !!(h && h.states && h.states[id]); }
  function isOn(h, id) { return !!(h && h.states && h.states[id] && h.states[id].state === 'on'); }
  function callSvc(domain, service, data) { try { const h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch (e) {} }
  async function callApi(method, path) { try { const h = H(); if (h && h.callApi) return await h.callApi(method, path); } catch (e) {} return null; }

  function fmtEur(v) { if (v == null || v === '') return '—'; const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(2) + ' €'; }
  function fmtKwh(v) { if (v == null || v === '') return '—'; const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(3) + ' kWh'; }
  function fmtKwhShort(v) { if (v == null || v === '') return '—'; const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(2) + ' kWh'; }

  function pkDefaults() {
    return {
      pk_power:      'sensor.potenza_frigo_w',
      pk_running:    'binary_sensor.compressore_frigo',
      pk_switch:     'switch.presa_frigorifero',
      pk_kwh_oggi:   'sensor.frigo_energy_oggi',
      pk_kwh_mese:   'sensor.frigo_energy_mese',
      pk_kwh_anno:   'sensor.frigo_energy_anno',
      pk_cicli_oggi: 'sensor.frigo_cicli_oggi',
      pk_cicli_mese: 'sensor.frigo_cicli_mese',
      pk_cicli_anno: 'sensor.frigo_cicli_anno',
      pk_cicli_tot:  'counter.frigo_cicli_totale',
      pk_time_on:    'sensor.time_on_frigo',
      pk_soglia:     'input_number.frigo_soglia_w',
      pk_versione:   'sensor.versione_pkg_frigo',
    };
  }

  function cfgFor(card) {
    const c = load(card), pk = pkDefaults(), r = {};
    Object.keys(pk).forEach(function (k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    r.name = c.name || 'Frigorifero';
    return r;
  }

  /* ── RING ── */
  function ringHTML(key, pct, col, label, sz) {
    const s = sz || 72, r = +(s * .36).toFixed(1), cx = s / 2, cy = s / 2;
    const circ = +(2 * Math.PI * r).toFixed(2);
    const p = Math.max(0, Math.min(100, pct || 0));
    const dash = +((p / 100) * circ).toFixed(2);
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">'
      + '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '" style="overflow:visible">'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="6"/>'
      + '<circle data-arc="' + key + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="6" stroke-dasharray="' + dash + ' ' + circ + '" stroke-linecap="round" transform="rotate(-90 ' + cx + ' ' + cy + ')" style="transition:stroke-dasharray .9s ease-in-out;filter:drop-shadow(0 0 7px ' + col + '99)"/>'
      + '<text data-txt="' + key + '" x="' + cx + '" y="' + (cy + 1) + '" text-anchor="middle" dominant-baseline="middle" fill="' + col + '" font-size="' + (s * .185).toFixed(0) + 'px" font-weight="800" font-family="system-ui,sans-serif">' + (pct == null ? '—' : Math.round(pct) + '%') + '</text>'
      + '</svg>'
      + '<div style="font-size:9px;font-weight:700;color:#fff;letter-spacing:.06em;text-transform:uppercase">' + label + '</div>'
      + '</div>';
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = cfgFor(card);
    const rid = 'frc' + (card.id || Math.random().toString(36).slice(2, 8));

    const pwV    = num(S(h, c.pk_power));
    const running = isOn(h, c.pk_running);
    const swOn   = isOn(h, c.pk_switch);
    const soglia = num(S(h, c.pk_soglia)) || 30;

    const kwOggi  = S(h, c.pk_kwh_oggi);
    const kwMese  = S(h, c.pk_kwh_mese);
    const kwAnno  = S(h, c.pk_kwh_anno);
    const cicOggi = S(h, c.pk_cicli_oggi);
    const cicMese = S(h, c.pk_cicli_mese);
    const cicAnno = S(h, c.pk_cicli_anno);
    const cicTot  = S(h, c.pk_cicli_tot);

    const ton     = c.pk_time_on;
    const timeOggi   = Attr(h, ton, 'Oggi')          || '—';
    const timeIeri   = Attr(h, ton, 'Ieri')          || '—';
    const timeMese   = Attr(h, ton, 'Mese')          || '—';
    const tempoC     = Attr(h, ton, 'tempo_ciclo_frigo') || '—';
    const consumoC   = Attr(h, ton, 'consumo_ciclo_frigo') || '—';
    const costoC     = Attr(h, ton, 'costo_ciclo_frigo');
    const costoOggi  = Attr(h, ton, 'costo_oggi_frigo');
    const costoMese  = Attr(h, ton, 'costo_mese_frigo');
    const costoAnno  = Attr(h, ton, 'costo_anno_frigo');
    const costoIeri  = Attr(h, ton, 'costo_ieri_frigo');
    const costoMeseP = Attr(h, ton, 'costo_mese_prec_frigo');
    const terminato  = Attr(h, ton, 'terminato') || '—';

    const pct = soglia > 0 ? Math.min(100, ((pwV || 0) / soglia) * 100) : 0;
    const col = running ? '#38bdf8' : '#64748b';
    const statusLabel = running ? 'COMPRESSORE ON' : 'STANDBY';
    const statusCol   = running ? '#38bdf8' : '#64748b';

    function statBox(val, label, col2) {
      return '<div class="fc-stat-box"><div class="fc-stat-n" style="color:' + (col2 || '#fff') + '">' + val + '</div><div class="fc-stat-l">' + label + '</div></div>';
    }
    function row(label, val, col2) {
      return '<div class="fc-row"><span class="fc-row-l">' + label + '</span><span class="fc-row-v" style="color:' + (col2 || '#fff') + '">' + val + '</span></div>';
    }
    function secHdr(label) {
      return '<div class="fc-sec-hdr"><div class="fc-sec-ln"></div><span class="fc-sec-lb">' + label + '</span><div class="fc-sec-ln"></div></div>';
    }

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:140px;background:radial-gradient(ellipse at 30% 0%,rgba(56,189,248,.06) 0%,transparent 70%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:12px 15px 10px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:14px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:10px;font-weight:800;padding:3px 9px;border-radius:20px;white-space:nowrap}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:center;gap:14px;padding:13px 15px 10px}'
      + '#' + rid + ' .fc-hero-info{flex:1;display:flex;flex-direction:column;gap:4px}'
      + '#' + rid + ' .fc-hero-pw{font-size:38px;font-weight:900;line-height:1;letter-spacing:-2px}'
      + '#' + rid + ' .fc-hero-lbl{font-size:10px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.7px}'
      + '#' + rid + ' .fc-hero-status{display:inline-flex;align-items:center;gap:5px;margin-top:2px}'
      + '#' + rid + ' .fc-dot{width:7px;height:7px;border-radius:50%}'
      + '#' + rid + ' .fc-dot.on{background:#38bdf8;box-shadow:0 0 6px #38bdf8}'
      + '#' + rid + ' .fc-dot.off{background:#64748b}'
      + '#' + rid + ' .fc-sec{padding:0 15px 10px}'
      + '#' + rid + ' .fc-sec-hdr{display:flex;align-items:center;gap:7px;margin-bottom:8px}'
      + '#' + rid + ' .fc-sec-ln{flex:1;height:1px;background:rgba(255,255,255,.05)}'
      + '#' + rid + ' .fc-sec-lb{font-size:9px;font-weight:800;color:rgba(255,255,255,.22);text-transform:uppercase;letter-spacing:1px;white-space:nowrap}'
      + '#' + rid + ' .fc-stats{display:flex;margin:0 15px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:hidden}'
      + '#' + rid + ' .fc-stat-box{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 4px;gap:2px;cursor:pointer}'
      + '#' + rid + ' .fc-stat-box:hover{background:rgba(255,255,255,.03)}'
      + '#' + rid + ' .fc-stat-sep{width:1px;background:rgba(255,255,255,.06);flex-shrink:0}'
      + '#' + rid + ' .fc-stat-n{font-size:13px;font-weight:900}'
      + '#' + rid + ' .fc-stat-l{font-size:8px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.5px;text-align:center}'
      + '#' + rid + ' .fc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}'
      + '#' + rid + ' .fc-cell{padding:8px 10px;border-radius:10px;background:rgba(56,189,248,.05);border:1px solid rgba(56,189,248,.12)}'
      + '#' + rid + ' .fc-cell-lbl{font-size:8px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}'
      + '#' + rid + ' .fc-cell-val{font-size:13px;font-weight:900;color:#38bdf8}'
      + '#' + rid + ' .fc-ciclo{padding:10px 12px;border-radius:12px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.2);display:flex;flex-direction:column;gap:6px}'
      + '#' + rid + ' .fc-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)}'
      + '#' + rid + ' .fc-row:last-child{border-bottom:none}'
      + '#' + rid + ' .fc-row-l{font-size:11px;color:rgba(255,255,255,.55)}'
      + '#' + rid + ' .fc-row-v{font-size:12px;font-weight:800}'
      + '#' + rid + ' [data-sya]{cursor:pointer}'
      + '#' + rid + ' [data-sya]:hover{filter:brightness(1.1)}'
      + (running ? '@keyframes fcPulse{0%,100%{opacity:.7}50%{opacity:1}}' : '')
      + '</style>';

    /* HERO */
    const heroHtml = '<div class="fc-hero">'
      + '<div>' + ringHTML('pct', pct, col, running ? 'CICLO' : 'STAND', 76) + '</div>'
      + '<div class="fc-hero-info">'
      + '<div class="fc-hero-pw" style="color:' + col + '">' + (pwV == null ? '—' : pwV.toFixed(0) + ' W') + '</div>'
      + '<div class="fc-hero-lbl">Potenza istantanea</div>'
      + '<div class="fc-hero-status"><div class="fc-dot ' + (running ? 'on' : 'off') + '" ' + (running ? 'style="animation:fcPulse 1.5s ease-in-out infinite"' : '') + '></div>'
      + '<span style="font-size:10px;font-weight:800;color:' + statusCol + '">' + statusLabel + '</span></div>'
      + '</div>'
      + '</div>';

    /* STATS BAR */
    const statsHtml = '<div class="fc-stats" data-sya="popup-cicli">'
      + statBox(cicOggi || '—', 'Cicli oggi', '#38bdf8')
      + '<div class="fc-stat-sep"></div>'
      + statBox(timeOggi, 'Tempo oggi', '#7dd3fc')
      + '<div class="fc-stat-sep"></div>'
      + statBox(fmtKwhShort(kwOggi), 'kWh oggi', '#bae6fd')
      + '<div class="fc-stat-sep"></div>'
      + statBox(fmtEur(costoOggi), '€ oggi', '#e0f2fe')
      + '</div>';

    /* CICLO CORRENTE / ULTIMO CICLO */
    const cicloHtml = '<div class="fc-sec">'
      + secHdr(running ? '❄ Ciclo in corso' : '⏱ Ultimo ciclo')
      + '<div class="fc-ciclo">'
      + row('Durata', tempoC, '#38bdf8')
      + row('Consumo', consumoC, '#7dd3fc')
      + row(running ? 'Costo corrente' : 'Costo ciclo', costoC != null ? costoC + ' €' : '—', '#bae6fd')
      + (running ? '' : row('Terminato', terminato, 'rgba(255,255,255,.4)'))
      + '</div>'
      + '</div>';

    /* ENERGIA GRID */
    const energiaHtml = '<div class="fc-sec" data-sya="popup-energia">'
      + secHdr('⚡ Energia ›')
      + '<div class="fc-grid">'
      + '<div class="fc-cell"><div class="fc-cell-lbl">kWh oggi</div><div class="fc-cell-val">' + fmtKwhShort(kwOggi) + '</div></div>'
      + '<div class="fc-cell"><div class="fc-cell-lbl">kWh ieri</div><div class="fc-cell-val" style="color:#7dd3fc">' + fmtKwhShort(Attr(h, c.pk_kwh_oggi, 'last_period')) + '</div></div>'
      + '<div class="fc-cell"><div class="fc-cell-lbl">kWh mese</div><div class="fc-cell-val">' + fmtKwhShort(kwMese) + '</div></div>'
      + '<div class="fc-cell"><div class="fc-cell-lbl">kWh anno</div><div class="fc-cell-val">' + fmtKwhShort(kwAnno) + '</div></div>'
      + '</div>'
      + '</div>';

    /* COSTI GRID */
    const costiHtml = '<div class="fc-sec" data-sya="popup-energia">'
      + secHdr('💶 Costi ›')
      + '<div class="fc-grid">'
      + '<div class="fc-cell"><div class="fc-cell-lbl">€ oggi</div><div class="fc-cell-val">' + fmtEur(costoOggi) + '</div></div>'
      + '<div class="fc-cell"><div class="fc-cell-lbl">€ ieri</div><div class="fc-cell-val" style="color:#7dd3fc">' + fmtEur(costoIeri) + '</div></div>'
      + '<div class="fc-cell"><div class="fc-cell-lbl">€ mese</div><div class="fc-cell-val">' + fmtEur(costoMese) + '</div></div>'
      + '<div class="fc-cell"><div class="fc-cell-lbl">€ mese prec.</div><div class="fc-cell-val" style="color:#7dd3fc">' + fmtEur(costoMeseP) + '</div></div>'
      + '</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">🧊</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'Frigorifero') + '</div>'
      + '<div class="fc-hdr-pill" style="background:' + (running ? 'rgba(56,189,248,.12)' : 'rgba(255,255,255,.05)') + ';border:1px solid ' + (running ? 'rgba(56,189,248,.3)' : 'rgba(255,255,255,.1)') + ';color:' + statusCol + '">'
      + statusLabel
      + '</div>'
      + '</div>'
      + '<div class="fc-scroll">'
      + heroHtml
      + statsHtml
      + cicloHtml
      + energiaHtml
      + costiHtml
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
  const POP_CSS = '<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc{overflow-y:auto;scrollbar-width:none}.fcpc::-webkit-scrollbar{display:none}</style>';
  function popShell(icon, rgb, title, sub, closeId, content) {
    return POP_CSS + '<div style="width:100%;max-height:76vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + rgb + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.3)">' + icon + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#fff">' + title + '</div><div style="font-size:11px;color:#fff;margin-top:1px">' + sub + '</div></div>'
      + '<button id="' + closeId + '" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      + '</div>'
      + '<div class="fcpc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }

  /* ── POPUP ENERGIA ── */
  function openEnergiaPopup(c) {
    const h = H();
    function row(lbl, val, col) { return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span style="font-size:12px;color:#fff">' + lbl + '</span><span style="font-size:13px;font-weight:800;color:' + (col || '#38bdf8') + '">' + val + '</span></div>'; }
    const ton = c.pk_time_on;
    const kwIeri  = Attr(h, c.pk_kwh_oggi, 'last_period');
    const kwMeseP = Attr(h, c.pk_kwh_mese, 'last_period');
    const kwAnnoP = Attr(h, c.pk_kwh_anno, 'last_period');
    const pwV = num(S(h, c.pk_power));
    const content = '<div style="background:rgba(56,189,248,.1);border-radius:12px;padding:12px 14px;text-align:center;margin-bottom:12px">'
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Potenza Attuale</div>'
      + '<div style="font-size:28px;font-weight:900;color:#38bdf8">' + (pwV == null ? '—' : pwV.toFixed(0) + ' W') + '</div>'
      + '</div>'
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Energia</div>'
      + row('Oggi', fmtKwh(S(h, c.pk_kwh_oggi)), '#bae6fd')
      + row('Ieri', fmtKwh(kwIeri), 'rgba(255,255,255,.4)')
      + row('Questo mese', fmtKwh(S(h, c.pk_kwh_mese)), '#bae6fd')
      + row('Mese precedente', fmtKwh(kwMeseP), 'rgba(255,255,255,.4)')
      + row('Questo anno', fmtKwh(S(h, c.pk_kwh_anno)), '#bae6fd')
      + row('Anno precedente', fmtKwh(kwAnnoP), 'rgba(255,255,255,.4)')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Costi</div>'
      + row('Oggi', fmtEur(Attr(h, ton, 'costo_oggi_frigo')), '#7dd3fc')
      + row('Ieri', fmtEur(Attr(h, ton, 'costo_ieri_frigo')), 'rgba(255,255,255,.4)')
      + row('Questo mese', fmtEur(Attr(h, ton, 'costo_mese_frigo')), '#7dd3fc')
      + row('Mese precedente', fmtEur(Attr(h, ton, 'costo_mese_prec_frigo')), 'rgba(255,255,255,.4)')
      + row('Questo anno', fmtEur(Attr(h, ton, 'costo_anno_frigo')), '#7dd3fc')
      + row('Anno precedente', fmtEur(Attr(h, ton, 'costo_anno_prec_frigo')), 'rgba(255,255,255,.4)');
    mkOv(popShell('⚡', '56,189,248', 'Energia & Costi', 'Frigorifero', 'fc-en-close', content), 'fc-en-close');
  }

  /* ── POPUP CICLI ── */
  function openCicliPopup(c) {
    const h = H();
    function row(lbl, val, col) { return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span style="font-size:12px;color:#fff">' + lbl + '</span><span style="font-size:13px;font-weight:800;color:' + (col || '#38bdf8') + '">' + val + '</span></div>'; }
    const DAYS = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
    const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const ton = c.pk_time_on;
    let weekHtml = '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 6px">Ultimi 7 giorni</div>'
      + '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:12px">';
    DAYS.forEach(function (d, i) {
      const cicli = S(h, 'input_text.' + d + '_frigo_cicli') || '—';
      const tempo = S(h, 'input_text.' + d + '_frigo_tempo') || '—';
      weekHtml += '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;background:rgba(56,189,248,.05);border:1px solid rgba(56,189,248,.1);border-radius:8px;padding:6px 2px">'
        + '<div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.4)">' + DAY_LABELS[i] + '</div>'
        + '<div style="font-size:11px;font-weight:900;color:#38bdf8">' + cicli + '</div>'
        + '<div style="font-size:8px;color:rgba(255,255,255,.35);text-align:center;line-height:1.2">' + tempo + '</div>'
        + '</div>';
    });
    weekHtml += '</div>';
    const content = weekHtml
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Cicli compressore</div>'
      + row('Oggi', S(h, c.pk_cicli_oggi) || '—', '#38bdf8')
      + row('Questo mese', S(h, c.pk_cicli_mese) || '—', '#38bdf8')
      + row('Questo anno', S(h, c.pk_cicli_anno) || '—', '#38bdf8')
      + row('Totale storico', S(h, c.pk_cicli_tot) || '—', '#7dd3fc')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Tempo compressore</div>'
      + row('Oggi', Attr(h, ton, 'Oggi') || '—', '#7dd3fc')
      + row('Ieri', Attr(h, ton, 'Ieri') || '—', 'rgba(255,255,255,.4)')
      + row('Questo mese', Attr(h, ton, 'Mese') || '—', '#7dd3fc')
      + row('Mese precedente', Attr(h, ton, 'Mese Precedente') || '—', 'rgba(255,255,255,.4)')
      + row('Questo anno', Attr(h, ton, 'Anno') || '—', '#7dd3fc');
    mkOv(popShell('❄', '56,189,248', 'Cicli & Statistiche', 'Compressore frigo', 'fc-ci-close', content), 'fc-ci-close');
  }

  /* ── CONFIGURE ── */
  function openCfg(card, el) {
    const h = H(), c = load(card), cf = cfgFor(card);
    const states = (h && h.states) || {};
    const allIds = Object.keys(states).sort();
    const stInp = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:10;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 9px 9px;display:none';
    const stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stSec = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(56,189,248,.2)';
    var _prevTimer = null;

    function field(fid, lbl2, val, hint) {
      return '<div style="margin-bottom:9px;position:relative"><label style="' + stLbl + '">' + lbl2 + (hint ? '<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">' + hint + '</span>' : '') + '</label><input id="' + fid + '" type="text" value="' + (val || '').replace(/"/g, '&quot;') + '" autocomplete="off" placeholder="Cerca entità…" style="' + stInp + '"><div id="' + fid + '-d" style="' + stDrop + '"></div></div>';
    }

    const formHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label><input id="fc-name" type="text" value="' + (cf.name || '').replace(/"/g, '&quot;') + '" placeholder="es. Frigo cucina" style="' + stInp.replace('monospace', 'system-ui') + '"></div>'
      + '<div style="' + stSec + '">Sensori base</div>'
      + field('fc-power', 'Potenza istantanea (W)', cf.pk_power, 'sensor.potenza_frigo_w')
      + field('fc-running', 'Compressore on/off', cf.pk_running, 'binary_sensor.compressore_frigo')
      + field('fc-switch', 'Switch presa', cf.pk_switch, 'switch.presa_frigorifero')
      + '<div style="' + stSec + '">PKG — Energia (kWh)</div>'
      + field('fc-kwh-oggi', 'kWh oggi', cf.pk_kwh_oggi, 'sensor.frigo_energy_oggi')
      + field('fc-kwh-mese', 'kWh mese', cf.pk_kwh_mese, 'sensor.frigo_energy_mese')
      + field('fc-kwh-anno', 'kWh anno', cf.pk_kwh_anno, 'sensor.frigo_energy_anno')
      + '<div style="' + stSec + '">PKG — Cicli</div>'
      + field('fc-cic-oggi', 'Cicli oggi', cf.pk_cicli_oggi, 'sensor.frigo_cicli_oggi')
      + field('fc-cic-mese', 'Cicli mese', cf.pk_cicli_mese, 'sensor.frigo_cicli_mese')
      + field('fc-cic-anno', 'Cicli anno', cf.pk_cicli_anno, 'sensor.frigo_cicli_anno')
      + field('fc-cic-tot', 'Cicli totale', cf.pk_cicli_tot, 'counter.frigo_cicli_totale')
      + '<div style="' + stSec + '">PKG — Statistiche</div>'
      + field('fc-time-on', 'Sensore time_on', cf.pk_time_on, 'sensor.time_on_frigo')
      + field('fc-soglia', 'Soglia lavoro (W)', cf.pk_soglia, 'input_number.frigo_soglia_w')
      + '<div style="display:flex;gap:8px;margin-top:14px">'
      + '<button id="fc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="fc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#060d14">Salva</button>'
      + '</div>';

    const pkgYaml = _FRIGO_PKG_YAML;
    const allFieldIds = ['fc-power', 'fc-running', 'fc-switch', 'fc-kwh-oggi', 'fc-kwh-mese', 'fc-kwh-anno', 'fc-cic-oggi', 'fc-cic-mese', 'fc-cic-anno', 'fc-cic-tot', 'fc-time-on', 'fc-soglia'];

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML = '<style>@keyframes fcSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@media(max-width:600px){.fccc{flex-direction:column!important}.fccf{width:100%!important;border-right:none!important;flex-shrink:0!important}}</style>'
      + '<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#080f18;border:1px solid rgba(56,189,248,.3);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:fcSlideUp .22s cubic-bezier(.32,1.12,.56,1)">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.3)">🧊</div>'
      + '<div><div style="font-size:14px;font-weight:800">Configura Frigorifero</div><div style="font-size:11px;color:#fff;margin-top:1px">' + card.id + '</div></div>'
      + '<button id="fc-hdr-close" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      + '</div>'
      + '<div id="fc-cfg-tabs" style="display:flex;gap:2px;padding:8px 16px 0;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<button data-tab="settings" style="padding:5px 12px;border-radius:8px 8px 0 0;border:none;font-size:10px;font-weight:700;cursor:pointer;background:rgba(56,189,248,.2);color:#38bdf8;border-bottom:2px solid #38bdf8">⚙ Impostazioni</button>'
      + '<button data-tab="pkg" style="padding:5px 12px;border-radius:8px 8px 0 0;border:none;font-size:10px;font-weight:700;cursor:pointer;background:rgba(255,255,255,.05);color:rgba(255,255,255,.4);border-bottom:2px solid transparent">📦 PKG YAML</button>'
      + '</div>'
      + '<div class="fccc" style="display:flex;flex:1;overflow:hidden;min-height:0">'
      + '<div class="fccf" data-tabcontent="settings" style="width:380px;flex-shrink:0;overflow-y:auto;padding:14px 16px;scrollbar-width:none">' + formHtml + '</div>'
      + '<div data-tabcontent="pkg" style="display:none;flex:1;overflow-y:auto;padding:14px 16px;background:rgba(0,0,0,.2);scrollbar-width:none">'
      + '<div style="font-size:11px;color:#94a3b8;margin-bottom:10px">Installa questo package in <code style="color:#38bdf8">config/packages/</code> e riavvia HA, poi configura i sensori nella tab Impostazioni.</div>'
      + '<pre style="font-size:10px;color:#e2e8f0;background:#060d14;border:1px solid rgba(56,189,248,.15);border-radius:10px;padding:12px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;max-height:60vh;overflow-y:auto">' + pkgYaml.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>'
      + '</div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(ov);

    const close = function () { try { document.body.removeChild(ov); } catch (e) {} };
    ov.querySelector('#fc-hdr-close').addEventListener('click', close);
    ov.querySelector('#fc-cancel').addEventListener('click', close);

    ov.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ov.querySelectorAll('[data-tab]').forEach(function (b) { b.style.background = 'rgba(255,255,255,.05)'; b.style.color = 'rgba(255,255,255,.4)'; b.style.borderBottom = '2px solid transparent'; });
        btn.style.background = 'rgba(56,189,248,.2)'; btn.style.color = '#38bdf8'; btn.style.borderBottom = '2px solid #38bdf8';
        ov.querySelectorAll('[data-tabcontent]').forEach(function (d) { d.style.display = 'none'; });
        const tc = ov.querySelector('[data-tabcontent="' + btn.dataset.tab + '"]'); if (tc) tc.style.display = 'block';
      });
    });

    function g(id) { const e = ov.querySelector('#' + id); return e ? e.value.trim() : ''; }
    allFieldIds.forEach(function (fid) {
      const inp = ov.querySelector('#' + fid), drop = ov.querySelector('#' + fid + '-d');
      if (!inp || !drop) return;
      function showDrop() {
        const q = inp.value.toLowerCase().trim();
        const hits = (q ? allIds.filter(function (id) { return id.toLowerCase().includes(q); }) : allIds).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(function (id) { return '<div data-pick="' + id + '" style="padding:5px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">' + id + '</div>'; }).join('');
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

    ov.querySelector('#fc-save').addEventListener('click', function () {
      save(card, {
        name: g('fc-name'),
        pk_power: g('fc-power'), pk_running: g('fc-running'), pk_switch: g('fc-switch'),
        pk_kwh_oggi: g('fc-kwh-oggi'), pk_kwh_mese: g('fc-kwh-mese'), pk_kwh_anno: g('fc-kwh-anno'),
        pk_cicli_oggi: g('fc-cic-oggi'), pk_cicli_mese: g('fc-cic-mese'), pk_cicli_anno: g('fc-cic-anno'),
        pk_cicli_tot: g('fc-cic-tot'), pk_time_on: g('fc-time-on'), pk_soglia: g('fc-soglia'),
      });
      close();
      try { el._fcSig = ''; el.innerHTML = render(card); } catch (e) {}
    });
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    const h = H(), c = cfgFor(card);
    const sig = [S(h, c.pk_power), S(h, c.pk_running), S(h, c.pk_kwh_oggi), S(h, c.pk_cicli_oggi), Attr(h, c.pk_time_on, 'Oggi'), Attr(h, c.pk_time_on, 'tempo_ciclo_frigo'), Attr(h, c.pk_time_on, 'costo_oggi_frigo')].join('|');
    if (!el.querySelector('.fc-card') || el._fcSig !== sig) {
      el._fcSig = sig;
      el.innerHTML = render(card);
    }
    mount(card, hass, el);
  }

  function mount(card, hass, el) {
    if (el._fcBound) return; el._fcBound = true;
    el.addEventListener('click', function (e) {
      const sya = e.target.closest('[data-sya]'); if (!sya) return;
      const a = sya.dataset.sya;
      if (a === 'popup-energia') { openEnergiaPopup(cfgFor(card)); return; }
      if (a === 'popup-cicli')   { openCicliPopup(cfgFor(card)); return; }
    });
  }

  /* ── PKG YAML EMBEDDED ── */
  var _FRIGO_PKG_YAML = `###############################################################
#   Package: Centro Controllo Frigorifero 1.0 — Frarik
###############################################################
#
# INSTALLAZIONE
#  1. Aggiungi in configuration.yaml:
#       homeassistant:
#         packages: !include_dir_named packages
#  2. Copia in config/packages/centro_controllo_frigorifero.yaml
#  3. Modifica "Sensore Potenza Frigo" e "Switch Frigo"
#  4. Riavvia HA
#  5. Configura la card con le entità generate
#
###############################################################
# VEDI IL FILE COMPLETO NEL REPO:
# cards/pkg/centro_controllo_frigorifero.yaml
###############################################################

# Entità generate dopo l'installazione:
#
#  sensor.potenza_frigo_w          — Potenza W (usa la tua presa)
#  sensor.kwh_frigo                — Integrazione kWh
#  binary_sensor.compressore_frigo — Compressore on/off
#  sensor.time_on_frigo            — Tempo acceso + attributi
#  sensor.frigo_energy_oggi/mese/anno
#  sensor.frigo_cicli_oggi/mese/anno
#  counter.frigo_cicli_totale
#  input_number.frigo_soglia_w     — Soglia attivazione compressore`;

  const CARD = {
    id: 'frigorifero', name: 'Frigorifero', icon: '🧊', version: '1.1',
    desc: 'Monitoraggio compressore, cicli, energia e costi. Richiede PKG centro_controllo_frigorifero.',
    render, mount, update, configure: openCfg
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: frigorifero v' + CARD.version); } catch (e) {}
})();
