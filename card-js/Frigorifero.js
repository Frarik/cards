/* frarik-version: 1.8 */
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
      pk_versione:   'sensor.frarik_frigorifero_versione',
    };
  }

  function cfgFor(card) {
    const c = load(card), pk = pkDefaults(), r = {};
    Object.keys(pk).forEach(function (k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    r.name = c.name || 'Frigorifero';
    return r;
  }

  /* ── FRIDGE SVG ── */
  function _fridgeSVG(running) {
    const c  = running ? '#38bdf8' : '#64748b';
    const cf = running ? 'rgba(56,189,248,.12)' : 'rgba(100,116,139,.07)';
    const glow = running ? ';filter:drop-shadow(0 0 12px rgba(56,189,248,.4))' : '';
    const css = running
      ? '@keyframes fA{0%{opacity:0;transform:translateY(0)}45%{opacity:.9}100%{opacity:0;transform:translateY(18px)}}@keyframes fB{0%{opacity:0;transform:translateY(0)}45%{opacity:.7}100%{opacity:0;transform:translateY(14px)}}@keyframes fG{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}.fa{animation:fA 2.4s ease-in-out infinite}.fb{animation:fB 2s ease-in-out infinite .8s}.fc2{animation:fA 2.8s ease-in-out infinite 1.5s}.fg{animation:fG 1.8s ease-in-out infinite}'
      : '';
    const snowMain = running
      ? '<text class="fg" x="32" y="24" font-size="14" fill="' + c + '" text-anchor="middle">❄</text>'
      : '<text x="32" y="24" font-size="11" fill="' + c + '" text-anchor="middle" opacity=".22">❄</text>';
    const snowFall = running
      ? '<g class="fa"><text x="15" y="65" font-size="10" fill="' + c + '" text-anchor="middle" opacity=".85">❄</text></g>'
        + '<g class="fb"><text x="32" y="58" font-size="8" fill="' + c + '" text-anchor="middle" opacity=".7">❄</text></g>'
        + '<g class="fc2"><text x="49" y="68" font-size="9" fill="' + c + '" text-anchor="middle" opacity=".8">❄</text></g>'
      : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 108" width="64" height="108" style="display:block;overflow:visible' + glow + '"><defs><style>' + css + '</style></defs>'
      + (running ? '<rect x="0" y="0" width="64" height="108" rx="11" fill="rgba(56,189,248,.04)" stroke="rgba(56,189,248,.15)" stroke-width="1"/>' : '')
      + '<rect x="3" y="3" width="58" height="102" rx="9" fill="' + cf + '" stroke="' + c + '" stroke-width="2"/>'
      + '<rect x="3" y="3" width="58" height="34" rx="8" fill="' + (running ? 'rgba(56,189,248,.1)' : 'rgba(100,116,139,.05)') + '" stroke="' + c + '" stroke-width="1.5"/>'
      + '<rect x="3" y="35" width="58" height="5" fill="' + c + '" opacity=".1"/>'
      + '<line x1="3" y1="37.5" x2="61" y2="37.5" stroke="' + c + '" stroke-width="2"/>'
      + '<rect x="49" y="11" width="7" height="14" rx="4" fill="' + c + '" opacity=".85"/>'
      + '<rect x="49" y="52" width="7" height="22" rx="4" fill="' + c + '" opacity=".85"/>'
      + '<line x1="9" y1="69" x2="55" y2="69" stroke="' + c + '" stroke-width=".8" opacity=".15"/>'
      + '<line x1="9" y1="83" x2="55" y2="83" stroke="' + c + '" stroke-width=".8" opacity=".15"/>'
      + '<rect x="9" y="89" width="46" height="11" rx="3" fill="' + c + '" opacity=".07" stroke="' + c + '" stroke-width=".8"/>'
      + snowMain + snowFall
      + '<rect x="10" y="103" width="12" height="5" rx="3" fill="' + c + '" opacity=".28"/>'
      + '<rect x="42" y="103" width="12" height="5" rx="3" fill="' + c + '" opacity=".28"/>'
      + '</svg>';
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = cfgFor(card);
    const rid = 'frc' + (card.id || Math.random().toString(36).slice(2, 8));

    const pwV     = num(S(h, c.pk_power));
    const running = isOn(h, c.pk_running);
    const ton     = c.pk_time_on;

    const terminato  = Attr(h, ton, 'terminato')           || '—';
    const tempoC     = Attr(h, ton, 'tempo_ciclo_frigo')   || '—';
    const consumoC   = Attr(h, ton, 'consumo_ciclo_frigo') || '—';
    const costoC     = Attr(h, ton, 'costo_ciclo_frigo');
    const kwOggi     = S(h, c.pk_kwh_oggi);
    const cicOggi    = S(h, c.pk_cicli_oggi);
    const timeOggi   = Attr(h, ton, 'Oggi')                || '—';
    const costoOggi  = Attr(h, ton, 'costo_oggi_frigo');

    const pw     = pwV || 0;
    const col    = running ? '#38bdf8' : '#64748b';
    const statusLabel = running ? 'COMPRESSORE ON' : 'STANDBY';
    const soglia = num(S(h, c.pk_soglia)) || 300;
    const barPct = Math.min(100, (pw / soglia) * 100);
    const barCol = pw < 50 ? '#64748b' : pw <= 150 ? '#38bdf8' : pw <= 250 ? '#22c55e' : pw <= 400 ? '#f97316' : '#ef4444';

    function ir(icon, lbl, val, vc) {
      return '<div class="fc-ir">'
        + '<div class="fc-ir-h"><span class="fc-ir-ic">' + icon + '</span><span class="fc-ir-lb">' + lbl + '</span></div>'
        + '<div class="fc-ir-v" style="color:' + (vc || '#fff') + '">' + val + '</div>'
        + '</div>';
    }

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:260px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:180px;background:radial-gradient(ellipse at 25% 0%,rgba(56,189,248,.07) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + col + (running ? ';box-shadow:0 0 5px #38bdf8;animation:fcPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:center;gap:0;padding:12px 14px 8px}'
      + '#' + rid + ' .fc-hero-img{flex-shrink:0;padding-right:12px;display:flex;align-items:center;cursor:pointer}'
      + '#' + rid + ' .fc-hero-rows{flex:1;display:flex;flex-direction:column;gap:0}'
      + '#' + rid + ' .fc-ir{padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-ir:last-child{border-bottom:none}'
      + '#' + rid + ' .fc-ir-h{display:flex;align-items:center;gap:4px;margin-bottom:2px}'
      + '#' + rid + ' .fc-ir-ic{font-size:9px;opacity:.5}'
      + '#' + rid + ' .fc-ir-lb{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em}'
      + '#' + rid + ' .fc-ir-v{font-size:13px;font-weight:800;padding-left:2px}'
      + '#' + rid + ' .fc-pbar{padding:0 14px 10px}'
      + '#' + rid + ' .fc-pbar-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px}'
      + '#' + rid + ' .fc-pbar-lbl{font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em}'
      + '#' + rid + ' .fc-pbar-v{font-size:14px;font-weight:900;color:' + barCol + ';transition:color .4s}'
      + '#' + rid + ' .fc-pbar-bg{height:8px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}'
      + '#' + rid + ' .fc-pbar-fill{height:100%;border-radius:4px;transition:width .6s ease,background .4s ease}'
      + '#' + rid + ' .fc-stats{display:flex;margin:0 14px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;cursor:pointer}'
      + '#' + rid + ' .fc-stats:hover{background:rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-sb{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 3px;gap:2px}'
      + '#' + rid + ' .fc-sb-sep{width:1px;background:rgba(255,255,255,.08);flex-shrink:0}'
      + '#' + rid + ' .fc-sb-n{font-size:12px;font-weight:900;color:' + col + '}'
      + '#' + rid + ' .fc-sb-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px;text-align:center}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 12px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(56,189,248,.12);border-color:rgba(56,189,248,.3);color:#38bdf8}'
      + '#' + rid + ' [data-sya]{cursor:pointer}'
      + (running ? '@keyframes fcPulse{0%,100%{opacity:.6}50%{opacity:1}}' : '')
      + '</style>';

    const heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img" data-sya="popup-cicli">' + _fridgeSVG(running) + '</div>'
      + '<div class="fc-hero-rows">'
      + ir('⚡', running ? 'Compressore' : 'Ultimo avvio', terminato, running ? '#38bdf8' : '#fff')
      + ir('⏱', running ? 'Durata ciclo' : 'Durata ultimo', tempoC, '#fff')
      + ir('🔌', running ? 'Consumo ON' : 'Consumo ultimo', consumoC, '#fff')
      + ir('💶', running ? 'Costo attuale' : 'Costo ultimo', costoC != null ? costoC + ' €' : '—', '#fff')
      + '</div>'
      + '</div>';

    const barHtml = '<div class="fc-pbar">'
      + '<div class="fc-pbar-hdr"><span class="fc-pbar-lbl">Consumo Istantaneo</span><span class="fc-pbar-v">' + (pw > 0 ? pw.toFixed(0) + ' W' : '— W') + '</span></div>'
      + '<div class="fc-pbar-bg"><div class="fc-pbar-fill" style="width:' + barPct + '%;background:' + barCol + ';box-shadow:0 0 7px ' + barCol + '55"></div></div>'
      + '</div>';

    const statsHtml = '<div class="fc-stats" data-sya="popup-cicli">'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (cicOggi || '—') + '</div><div class="fc-sb-l">Cicli oggi</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + timeOggi + '</div><div class="fc-sb-l">Tempo oggi</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n" style="font-size:9px">' + fmtKwhShort(kwOggi) + '</div><div class="fc-sb-l">kWh oggi</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n" style="font-size:9px">' + fmtEur(costoOggi) + '</div><div class="fc-sb-l">€ oggi</div></div>'
      + '</div>';

    const btnsHtml = '<div class="fc-btns">'
      + '<div class="fc-btn" data-sya="popup-cicli">📅 Ultimi 7gg</div>'
      + '<div class="fc-btn" data-sya="popup-energia">📊 Statistiche</div>'
      + '<div class="fc-btn" data-sya="popup-impostazioni">⚙ Impostazioni</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">🧊</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'Frigorifero') + '</div>'
      + '<div class="fc-hdr-pill" style="background:' + (running ? 'rgba(56,189,248,.1)' : 'rgba(255,255,255,.05)') + ';border:1px solid ' + (running ? 'rgba(56,189,248,.28)' : 'rgba(255,255,255,.08)') + ';color:' + col + '">'
      + '<div class="fc-dot"></div>'
      + statusLabel
      + '</div>'
      + '</div>'
      + '<div class="fc-scroll">'
      + heroHtml
      + barHtml
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
      + row('Ieri', fmtKwh(kwIeri), '#fff')
      + row('Questo mese', fmtKwh(S(h, c.pk_kwh_mese)), '#bae6fd')
      + row('Mese precedente', fmtKwh(kwMeseP), '#fff')
      + row('Questo anno', fmtKwh(S(h, c.pk_kwh_anno)), '#bae6fd')
      + row('Anno precedente', fmtKwh(kwAnnoP), '#fff')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Costi</div>'
      + row('Oggi', fmtEur(Attr(h, ton, 'costo_oggi_frigo')), '#7dd3fc')
      + row('Ieri', fmtEur(Attr(h, ton, 'costo_ieri_frigo')), '#fff')
      + row('Questo mese', fmtEur(Attr(h, ton, 'costo_mese_frigo')), '#7dd3fc')
      + row('Mese precedente', fmtEur(Attr(h, ton, 'costo_mese_prec_frigo')), '#fff')
      + row('Questo anno', fmtEur(Attr(h, ton, 'costo_anno_frigo')), '#7dd3fc')
      + row('Anno precedente', fmtEur(Attr(h, ton, 'costo_anno_prec_frigo')), '#fff');
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
        + '<div style="font-size:8px;font-weight:700;color:#fff">' + DAY_LABELS[i] + '</div>'
        + '<div style="font-size:11px;font-weight:900;color:#38bdf8">' + cicli + '</div>'
        + '<div style="font-size:8px;color:#fff;text-align:center;line-height:1.2">' + tempo + '</div>'
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
      + row('Ieri', Attr(h, ton, 'Ieri') || '—', '#fff')
      + row('Questo mese', Attr(h, ton, 'Mese') || '—', '#7dd3fc')
      + row('Mese precedente', Attr(h, ton, 'Mese Precedente') || '—', '#fff')
      + row('Questo anno', Attr(h, ton, 'Anno') || '—', '#7dd3fc');
    mkOv(popShell('❄', '56,189,248', 'Cicli & Statistiche', 'Compressore frigo', 'fc-ci-close', content), 'fc-ci-close');
  }

  /* ── CONFIGURE ── */
  function openCfg(card, el) {
    const h = H(), c = load(card), cf = cfgFor(card);
    const states = (h && h.states) || {};
    const allIds = Object.keys(states).sort();
    const stInp = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none';
    const stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stSec = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(56,189,248,.2)';

    function field(fid, lbl2, val, hint) {
      return '<div style="margin-bottom:9px;position:relative"><label style="' + stLbl + '">' + lbl2 + (hint ? '<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">' + hint + '</span>' : '') + '</label><input id="' + fid + '" type="text" value="' + (val || '').replace(/"/g, '&quot;') + '" autocomplete="off" placeholder="Cerca entità…" style="' + stInp + '"><div id="' + fid + '-d" style="' + stDrop + '"></div></div>';
    }

    const formHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label><input id="fc-name" type="text" value="' + (cf.name || '').replace(/"/g, '&quot;') + '" placeholder="es. Frigo cucina" style="' + stInp.replace('monospace', 'system-ui') + '"></div>'
      + '<div style="' + stSec + '">Sensori base</div>'
      + field('fc-power',   'Potenza istantanea (W)', cf.pk_power,   'sensor.potenza_frigo_w')
      + field('fc-running', 'Compressore on/off',     cf.pk_running, 'binary_sensor.compressore_frigo')
      + field('fc-switch',  'Switch presa',           cf.pk_switch,  'switch.presa_frigorifero')
      + '<div style="' + stSec + '">PKG — Energia (kWh)</div>'
      + field('fc-kwh-oggi', 'kWh oggi', cf.pk_kwh_oggi, 'sensor.frigo_energy_oggi')
      + field('fc-kwh-mese', 'kWh mese', cf.pk_kwh_mese, 'sensor.frigo_energy_mese')
      + field('fc-kwh-anno', 'kWh anno', cf.pk_kwh_anno, 'sensor.frigo_energy_anno')
      + '<div style="' + stSec + '">PKG — Cicli</div>'
      + field('fc-cic-oggi', 'Cicli oggi',    cf.pk_cicli_oggi, 'sensor.frigo_cicli_oggi')
      + field('fc-cic-mese', 'Cicli mese',    cf.pk_cicli_mese, 'sensor.frigo_cicli_mese')
      + field('fc-cic-anno', 'Cicli anno',    cf.pk_cicli_anno, 'sensor.frigo_cicli_anno')
      + field('fc-cic-tot',  'Cicli totale',  cf.pk_cicli_tot,  'counter.frigo_cicli_totale')
      + '<div style="' + stSec + '">PKG — Statistiche</div>'
      + field('fc-time-on', 'Sensore time_on',  cf.pk_time_on, 'sensor.time_on_frigo')
      + field('fc-soglia',  'Soglia lavoro (W)', cf.pk_soglia,  'input_number.frigo_soglia_w')
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="fc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="fc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#060d14">Salva</button>'
      + '</div>';

    const allFieldIds = ['fc-power','fc-running','fc-switch','fc-kwh-oggi','fc-kwh-mese','fc-kwh-anno','fc-cic-oggi','fc-cic-mese','fc-cic-anno','fc-cic-tot','fc-time-on','fc-soglia'];
    const ov = mkOv(popShell('🧊', '56,189,248', 'Configura Frigorifero', card.id || '', 'fc-cfg-close', formHtml), 'fc-cfg-close');

    ov.querySelector('#fc-cancel').addEventListener('click', function() { ov._close(); });

    function g(id) { const e = ov.querySelector('#' + id); return e ? e.value.trim() : ''; }
    allFieldIds.forEach(function(fid) {
      const inp = ov.querySelector('#' + fid), drop = ov.querySelector('#' + fid + '-d');
      if (!inp || !drop) return;
      function showDrop() {
        const q = inp.value.toLowerCase().trim();
        const hits = (q ? allIds.filter(function(id) { return id.toLowerCase().includes(q); }) : allIds).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(function(id) { return '<div data-pick="' + id + '" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">' + id + '</div>'; }).join('');
        drop.querySelectorAll('[data-pick]').forEach(function(row) {
          row.addEventListener('mousedown', function(ev) { ev.preventDefault(); inp.value = row.getAttribute('data-pick'); drop.style.display = 'none'; });
          row.addEventListener('mouseover', function() { row.style.background = 'rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout', function() { row.style.background = ''; });
        });
      }
      inp.addEventListener('focus', showDrop);
      inp.addEventListener('input', showDrop);
      inp.addEventListener('blur', function() { setTimeout(function() { drop.style.display = 'none'; }, 200); });
    });

    ov.querySelector('#fc-save').addEventListener('click', function() {
      save(card, {
        name: g('fc-name'),
        pk_power: g('fc-power'), pk_running: g('fc-running'), pk_switch: g('fc-switch'),
        pk_kwh_oggi: g('fc-kwh-oggi'), pk_kwh_mese: g('fc-kwh-mese'), pk_kwh_anno: g('fc-kwh-anno'),
        pk_cicli_oggi: g('fc-cic-oggi'), pk_cicli_mese: g('fc-cic-mese'), pk_cicli_anno: g('fc-cic-anno'),
        pk_cicli_tot: g('fc-cic-tot'), pk_time_on: g('fc-time-on'), pk_soglia: g('fc-soglia'),
      });
      ov._close();
      try { el._fcSig = ''; el.innerHTML = render(card); } catch(e) {}
    });
  }

  /* ── IMPOSTAZIONI HA POPUP ── */
  function openImpostazioniHAPopup(c) {
    const h = H();
    function bs(e) { return !!(h && h.states && h.states[e] && h.states[e].state === 'on'); }
    function ss(e) { const st = h && h.states && h.states[e]; return (st && st.state) || ''; }
    function ns(e) { return num(S(h, e)); }

    const iBase = 'background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);border-radius:8px;font-size:12px;font-family:system-ui;box-sizing:border-box;outline:none;color-scheme:dark';
    const rows = [];

    function dSec(lbl) {
      rows.push('<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding:12px 0 6px;border-bottom:1px solid rgba(56,189,248,.15)">' + lbl + '</div>');
    }
    function dToggle(entity, lbl) {
      const on = bs(entity);
      rows.push('<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        + '<span style="font-size:13px;color:#fff">' + lbl + '</span>'
        + '<div class="fi-sw ' + (on ? 'on' : 'off') + '" data-entity="' + entity + '"><div class="fi-knob"></div></div>'
        + '</div>');
    }
    function dTime(entity, lbl) {
      const raw = ss(entity);
      const val = raw && raw.length >= 5 ? raw.substring(0, 5) : '';
      rows.push('<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);gap:10px">'
        + '<span style="font-size:13px;color:#fff;flex:1">' + lbl + '</span>'
        + '<input type="time" class="fi-inp" data-entity="' + entity + '" data-svctype="time" value="' + val + '" style="' + iBase + ';width:108px;padding:6px 8px;text-align:center">'
        + '</div>');
    }
    function dNum(entity, lbl, unit, mn, mx, step) {
      const val = ns(entity);
      rows.push('<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);gap:10px">'
        + '<span style="font-size:13px;color:#fff;flex:1">' + lbl + (unit ? ' <span style="font-size:10px;color:rgba(255,255,255,.6)">(' + unit + ')</span>' : '') + '</span>'
        + '<input type="number" class="fi-inp" data-entity="' + entity + '" data-svctype="number" value="' + (val != null ? val : '') + '" min="' + (mn != null ? mn : 0) + '" max="' + (mx != null ? mx : 9999) + '" step="' + (step || 1) + '" style="' + iBase + ';width:90px;padding:6px 8px;text-align:right">'
        + '</div>');
    }
    function dText(entity, lbl) {
      const val = ss(entity);
      rows.push('<div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        + '<div style="font-size:13px;color:#fff;margin-bottom:5px">' + lbl + '</div>'
        + '<input type="text" class="fi-inp" data-entity="' + entity + '" data-svctype="text" value="' + (val || '').replace(/"/g, '&quot;') + '" style="' + iBase + ';width:100%;padding:7px 10px">'
        + '</div>');
    }
    function dInfo(lbl, val) {
      rows.push('<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        + '<span style="font-size:12px;color:rgba(255,255,255,.7)">' + lbl + '</span>'
        + '<span style="font-size:12px;font-weight:700;color:#fff">' + (val || '—') + '</span>'
        + '</div>');
    }

    dSec('🔔 Notifiche push & vocali');
    dToggle('input_boolean.frigo_notify_push',   '📱 Push');
    dToggle('input_boolean.frigo_notify_google', '🔊 Google');
    dToggle('input_boolean.frigo_notify_alexa',  '🗣 Alexa');
    dTime('input_datetime.frigo_notifiche_inizio', '⏰ Orario inizio notifiche');
    dTime('input_datetime.frigo_notifiche_fine',   '⏰ Orario fine notifiche');

    dSec('🔌 Elettrodomestico');
    dToggle('input_boolean.frigo_switch', 'Switch presa');
    dNum('input_number.frigo_soglia_w',          'Soglia lavoro',  'W',   0, 5000, 1);
    dNum('input_number.frigo_tempo_innesco_m',   'Delay spegnimento', 'min', 0, 60, 1);
    dNum('input_number.frigo_avvio_ritardato_s', 'Delay riavvio',  's',   0, 300, 1);

    dSec('⏰ Spegnimento automatico');
    dToggle('automation.frigo_off_automatico', 'Auto OFF abilitato');
    dTime('input_datetime.frigo_off', 'Orario spegnimento');

    dSec('📝 Personalizzazione');
    dText('input_text.frigo_nome',      'Nome elettrodomestico');
    dText('input_text.frigo_messaggio', 'Messaggio notifica');
    dNum('input_number.costo_energia',  'Costo energia', '€/kWh', 0, 2, 0.001);
    dInfo('Ultimo reset contatori', ss('input_text.frigo_data_reset'));

    const swCss = '<style>'
      + '.fi-sw{width:44px;height:26px;border-radius:13px;cursor:pointer;position:relative;flex-shrink:0;transition:background .25s}'
      + '.fi-sw.on{background:#38bdf8}.fi-sw.off{background:rgba(255,255,255,.12)}'
      + '.fi-knob{position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .25s;box-shadow:0 1px 4px rgba(0,0,0,.4)}'
      + '.fi-sw.on .fi-knob{left:21px}.fi-sw.off .fi-knob{left:3px}'
      + '.fi-inp:focus{border-color:rgba(56,189,248,.55)!important;box-shadow:0 0 0 2px rgba(56,189,248,.12)}'
      + '</style>';
    const resetBtn = '<button id="fi-reset" style="width:100%;margin-top:16px;padding:12px;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.22);color:#f87171;font-size:13px;font-weight:700;cursor:pointer">🔄 Reset Contatori</button>';
    const closeId = 'fi-cl-' + Math.random().toString(36).slice(2, 6);
    const ov = mkOv(popShell('⚙', '100,116,139', 'Impostazioni', c.name || 'Frigorifero', closeId, swCss + rows.join('') + resetBtn), closeId);

    ov.querySelectorAll('.fi-sw').forEach(function(sw) {
      sw.addEventListener('click', function() {
        const entity = sw.dataset.entity; if (!entity) return;
        callSvc(entity.split('.')[0], 'toggle', {entity_id: entity});
        sw.classList.toggle('on'); sw.classList.toggle('off');
      });
    });

    ov.querySelectorAll('.fi-inp').forEach(function(inp) {
      inp.addEventListener('change', function() {
        const entity = inp.dataset.entity, type = inp.dataset.svctype;
        if (!entity) return;
        if (type === 'time') {
          if (inp.value) callSvc('input_datetime', 'set_datetime', {entity_id: entity, time: inp.value + ':00'});
        } else if (type === 'number') {
          const v = parseFloat(inp.value);
          if (!isNaN(v)) callSvc('input_number', 'set_value', {entity_id: entity, value: v});
        } else if (type === 'text') {
          callSvc('input_text', 'set_value', {entity_id: entity, value: inp.value});
        }
      });
    });

    const rb = ov.querySelector('#fi-reset');
    if (rb) rb.addEventListener('click', function() {
      callSvc('script', 'turn_on', {entity_id: 'script.frigo_reset_sensori'});
      rb.textContent = '✅ Reset avviato!'; rb.style.color = '#4ade80';
      setTimeout(function() { try { ov._close(); } catch(e) {} }, 1500);
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
      if (a === 'popup-energia')      { openEnergiaPopup(cfgFor(card)); return; }
      if (a === 'popup-cicli')        { openCicliPopup(cfgFor(card)); return; }
      if (a === 'popup-impostazioni') { openImpostazioniHAPopup(cfgFor(card)); return; }
    });
  }

  /* ── PKG YAML EMBEDDED ── */
  var _FRIGO_PKG_YAML = `###############################################################
#                                                             #
#   ███████╗██████╗  █████╗ ██████╗ ██╗██╗  ██╗             #
#   ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██║ ██╔╝             #
#   █████╗  ██████╔╝███████║██████╔╝██║█████╔╝              #
#   ██╔══╝  ██╔══██╗██╔══██║██╔══██╗██║██╔═██╗              #
#   ██║     ██║  ██║██║  ██║██║  ██║██║██║  ██╗             #
#   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝            #
#                                                             #
#   Package: Centro Controllo Frigorifero                     #
#   Versione: 1.3  |  Frarik / Fratech                       #
#                                                             #
###############################################################

homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Centro Controllo Frigorifero 1.3 — Frarik'

      setting:

        Sensore Potenza Frigo: &sensore_potenza_frigo "{{ states('IL_TUO_SENSORE_POTENZA_FRIGO') | float(0) }}"
        Switch Frigo:          &switch_frigo 'IL_TUO_SWITCH_FRIGO'

        Lista MediaPlayer Google: &google
          - IL_TUO_MEDIA_PLAYER_GOOGLE_1

        Lista mediaplayer alexa: &alexa
          - IL_TUO_MEDIA_PLAYER_ALEXA_1

        Device per notifica push: &push
          - service: IL_TUO_MOBILE_APP_1

notify:
  - name: Frigorifero
    platform: group
    services: *push

sensor:
  - platform: integration
    source: sensor.potenza_frigo_w
    name: kwh_frigo
    unit_prefix: k
    method: left
    round: 2

input_number:
  frigo_soglia_w:
    name: Soglia Lavoro Frigo W
    icon: mdi:flash
    min: 0
    max: 5000
    step: 1.00
    unit_of_measurement: "w"
    mode: box

  frigo_tempo_innesco_m:
    name: Tempo Innesco Frigo M
    icon: mdi:timer
    min: 0
    max: 60
    step: 1.00
    unit_of_measurement: "m"
    mode: box

  frigo_avvio_ritardato_s:
    name: Avvio Ritardato Frigo S
    icon: mdi:timer-sand
    min: 0
    max: 60
    step: 1.00
    unit_of_measurement: "s"
    mode: box

  lunedi_frigo_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  lunedi_frigo_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  martedi_frigo_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  martedi_frigo_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  mercoledi_frigo_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  mercoledi_frigo_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  giovedi_frigo_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  giovedi_frigo_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  venerdi_frigo_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  venerdi_frigo_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  sabato_frigo_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  sabato_frigo_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  domenica_frigo_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  domenica_frigo_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

utility_meter:

  frigo_tempo_oggi:
    source: sensor.time_on_frigo
    cycle: daily

  frigo_tempo_mese:
    source: sensor.time_on_frigo
    cycle: monthly

  frigo_tempo_anno:
    source: sensor.time_on_frigo
    cycle: yearly

  frigo_cicli_oggi:
    source: counter.frigo_cicli_totale
    cycle: daily

  frigo_cicli_mese:
    source: counter.frigo_cicli_totale
    cycle: monthly

  frigo_cicli_anno:
    source: counter.frigo_cicli_totale
    cycle: yearly

  frigo_energy_oggi:
    source: sensor.kwh_frigo
    cycle: daily

  frigo_energy_mese:
    source: sensor.kwh_frigo
    cycle: monthly

  frigo_energy_anno:
    source: sensor.kwh_frigo
    cycle: yearly

template:
  - binary_sensor:
      - name: compressore_frigo
        icon: mdi:snowflake
        state: >-
          {{ 'on' if (states('sensor.potenza_frigo_w') | int(0)) >
             states('input_number.frigo_soglia_w') | int(0) else 'off' }}
        delay_off: "00:{{ states('input_number.frigo_tempo_innesco_m') | int(0) }}:00"
        delay_on:  "00:00:{{ states('input_number.frigo_avvio_ritardato_s') | int(0) }}"

  - trigger:
      - platform: state
        entity_id: input_boolean.frigo_ciclo_attivo
        from: "off"
        to: "on"
    sensor:
      - name: inizio_ciclo_frigo
        state: "{{ states('sensor.kwh_frigo') }}"

  - trigger:
      - platform: state
        entity_id: binary_sensor.compressore_frigo
        from: "on"
        to: "off"
    sensor:
      - name: fine_ciclo_frigo
        state: "{{ now().strftime('%d/%m/%Y %H:%M') }}"

  - trigger:
      - platform: state
        entity_id: input_boolean.frigo_ciclo_attivo
        from: "off"
        to: "on"
    sensor:
      - name: tempo_riavvio_frigo
        state: "{{ as_timestamp(now()) }}"

  - sensor:
      - name: "time_on_frigo"
        icon: mdi:history
        state: >-
          {% if is_state('binary_sensor.compressore_frigo', 'on') and
                (as_timestamp(states.binary_sensor.compressore_frigo.last_changed) + 1) <= as_timestamp(now()) %}
            {{ ((as_timestamp(now()) - as_timestamp(states.binary_sensor.compressore_frigo.last_changed)) / 3600) }}
          {% else %} 0 {% endif %}
        attributes:
          terminato: >-
            {{ states('sensor.fine_ciclo_frigo') if is_state('binary_sensor.compressore_frigo', 'off') else 'In funzione' }}
          tempo_ciclo_frigo: >
            {% set hours = (as_timestamp(now()) - states('sensor.tempo_riavvio_frigo') | float(0)) / 3600 %}
            {% set minutes = ((hours % 1) * 60) | int(0) %}
            {% set hours = (hours - (hours % 1)) | int(0) %}
            {% set day = ((hours | int(0) / 24)) | int(0) %}
            {% if is_state('input_boolean.frigo_ciclo_attivo', 'on') %}
              {% if day | int(0) > 0 %}
                {{ day }}d {{ (hours | int(0)) - (day * 24) }}h {{ minutes }}m
              {% elif hours | int(0) > 0 %}
                {{ hours }}h {{ minutes }}m
              {% else %}
                {{ minutes }}min
              {% endif %}
            {% else %}
              {{ states('input_text.frigo_ultimo_ciclo') }}
            {% endif %}
          Oggi: >
            {% set hours = states('sensor.frigo_tempo_oggi') | float(0) %}
            {% set minutes = ((hours % 1) * 60) | int(0) %}
            {% set hours = (hours - (hours % 1)) | int(0) %}
            {% if hours | int(0) > 0 %}
              {{ hours }}h {{ minutes }}m
            {% else %}
              {{ minutes }}min
            {% endif %}
          Mese: >
            {% set hours = states('sensor.frigo_tempo_mese') | float(0) %}
            {% set minutes = ((hours % 1) * 60) | int(0) %}
            {% set hours = (hours - (hours % 1)) | int(0) %}
            {% set day = ((hours | int / 24)) | int(0) %}
            {% if day | int(0) > 0 %}
              {{ day }}d {{ (hours | int) - (day * 24) }}h {{ minutes }}m
            {% elif hours | int(0) > 0 %}
              {{ hours }}h {{ minutes }}m
            {% else %}
              {{ minutes }}min
            {% endif %}
          Anno: >
            {% set hours = states('sensor.frigo_tempo_anno') | float(0) %}
            {% set minutes = ((hours % 1) * 60) | int(0) %}
            {% set hours = (hours - (hours % 1)) | int(0) %}
            {% set day = ((hours | int(0) / 24)) | int(0) %}
            {% if day | int(0) > 0 %}
              {{ day }}d {{ (hours | int(0)) - (day * 24) }}h {{ minutes }}m
            {% elif hours | int(0) > 0 %}
              {{ hours }}h {{ minutes }}m
            {% else %}
              {{ minutes }}min
            {% endif %}
          Ieri: >
            {% set hours = state_attr('sensor.frigo_tempo_oggi', 'last_period') | float(0) %}
            {% set minutes = ((hours % 1) * 60) | int(0) %}
            {% set hours = (hours - (hours % 1)) | int(0) %}
            {% if hours | int(0) > 0 %}
              {{ hours }}h {{ minutes }}m
            {% else %}
              {{ minutes }}min
            {% endif %}
          Mese Precedente: >
            {% set hours = state_attr('sensor.frigo_tempo_mese', 'last_period') | float(0) %}
            {% set minutes = ((hours % 1) * 60) | int(0) %}
            {% set hours = (hours - (hours % 1)) | int(0) %}
            {% set day = ((hours | int / 24)) | int(0) %}
            {% if day | int(0) > 0 %}
              {{ day }}d {{ (hours | int) - (day * 24) }}h {{ minutes }}m
            {% elif hours | int(0) > 0 %}
              {{ hours }}h {{ minutes }}m
            {% else %}
              {{ minutes }}min
            {% endif %}
          consumo_ciclo_frigo: >-
            {{ (states('sensor.kwh_frigo') | float(0) - states('sensor.inizio_ciclo_frigo') | float(0)) | round(3) }} kWh
          costo_ciclo_frigo: >-
            {{ ((states('sensor.kwh_frigo') | float(0) - states('sensor.inizio_ciclo_frigo') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(3, default=0) }}
          costo_oggi_frigo: >-
            {{ ((states('sensor.frigo_energy_oggi') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_mese_frigo: >-
            {{ ((states('sensor.frigo_energy_mese') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_anno_frigo: >-
            {{ ((states('sensor.frigo_energy_anno') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_ieri_frigo: >-
            {{ ((state_attr('sensor.frigo_energy_oggi', 'last_period') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_mese_prec_frigo: >-
            {{ ((state_attr('sensor.frigo_energy_mese', 'last_period') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_anno_prec_frigo: >-
            {{ ((state_attr('sensor.frigo_energy_anno', 'last_period') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}

      - name: "potenza_frigo_w"
        unit_of_measurement: 'W'
        device_class: power
        state_class: measurement
        icon: mdi:flash
        state: *sensore_potenza_frigo

      - name: "frarik_frigorifero_versione"
        state: "1.2"

counter:
  frigo_cicli_totale:
    name: Cicli Compressore Frigo
    initial: 0
    step: 1

input_boolean:
  frigo_switch:
    name: Switch Frigo
    icon: mdi:power

  frigo_ciclo_attivo:
    name: Ciclo Attivo Frigo

  frigo_notify_push:
    name: Notifica Push Frigo

  frigo_notify_alexa:
    name: Notifica Alexa Frigo

  frigo_notify_google:
    name: Notifica Google Frigo

group:
  frigo_notifiche:
    entities:
      - input_boolean.frigo_notify_google
      - input_boolean.frigo_notify_alexa
      - input_boolean.frigo_notify_push
      - automation.frigo_off_automatico
      - input_boolean.frigo_switch

input_datetime:
  frigo_notifiche_inizio:
    name: Orario Inizio Notifiche Frigo
    has_date: false
    has_time: true

  frigo_notifiche_fine:
    name: Orario Fine Notifiche Frigo
    has_date: false
    has_time: true

  frigo_off:
    name: Frigo Spegnimento Automatico
    has_date: false
    has_time: true

input_text:
  frigo_data_reset:
  frigo_nome:
  frigo_messaggio:
  frigo_ultimo_ciclo:
  lunedi_frigo_cicli:
  lunedi_frigo_tempo:
  martedi_frigo_cicli:
  martedi_frigo_tempo:
  mercoledi_frigo_cicli:
  mercoledi_frigo_tempo:
  giovedi_frigo_cicli:
  giovedi_frigo_tempo:
  venerdi_frigo_cicli:
  venerdi_frigo_tempo:
  sabato_frigo_cicli:
  sabato_frigo_tempo:
  domenica_frigo_cicli:
  domenica_frigo_tempo:

script:
  frigo_reset_sensori:
    sequence:
    - service: input_text.set_value
      data:
        value: "{{ now().strftime('%d/%m/%Y %H:%M') }}"
      target:
        entity_id: input_text.frigo_data_reset

    - service: utility_meter.calibrate
      data:
        value: '0'
      target:
        entity_id:
          - sensor.frigo_cicli_oggi
          - sensor.frigo_cicli_mese
          - sensor.frigo_cicli_anno
          - sensor.frigo_energy_oggi
          - sensor.frigo_energy_mese
          - sensor.frigo_energy_anno
          - sensor.frigo_tempo_oggi
          - sensor.frigo_tempo_mese
          - sensor.frigo_tempo_anno

    - service: input_number.set_value
      data:
        value: '0'
      target:
        entity_id:
          - input_number.lunedi_frigo_consumo
          - input_number.martedi_frigo_consumo
          - input_number.mercoledi_frigo_consumo
          - input_number.giovedi_frigo_consumo
          - input_number.venerdi_frigo_consumo
          - input_number.sabato_frigo_consumo
          - input_number.domenica_frigo_consumo
          - input_number.lunedi_frigo_costo
          - input_number.martedi_frigo_costo
          - input_number.mercoledi_frigo_costo
          - input_number.giovedi_frigo_costo
          - input_number.venerdi_frigo_costo
          - input_number.sabato_frigo_costo
          - input_number.domenica_frigo_costo

    - service: input_text.set_value
      data:
        value: '0'
      target:
        entity_id:
          - input_text.lunedi_frigo_cicli
          - input_text.martedi_frigo_cicli
          - input_text.mercoledi_frigo_cicli
          - input_text.giovedi_frigo_cicli
          - input_text.venerdi_frigo_cicli
          - input_text.sabato_frigo_cicli
          - input_text.domenica_frigo_cicli
          - input_text.lunedi_frigo_tempo
          - input_text.martedi_frigo_tempo
          - input_text.mercoledi_frigo_tempo
          - input_text.giovedi_frigo_tempo
          - input_text.venerdi_frigo_tempo
          - input_text.sabato_frigo_tempo
          - input_text.domenica_frigo_tempo

    - service: counter.reset
      target:
        entity_id:
          - counter.frigo_cicli_totale

automation:
- alias: frigo_automazioni
  id: frigo_automazioni
  max_exceeded: silent
  trigger:

  - platform: state
    entity_id: binary_sensor.compressore_frigo
    from: 'off'
    to: 'on'
    id: inizio_ciclo

  - platform: state
    entity_id: binary_sensor.compressore_frigo
    from: 'on'
    to: 'off'
    id: fine_ciclo

  - platform: time
    at: '23:59:59'
    id: incremento_statistiche_7gg

  - platform: state
    entity_id:
      - input_boolean.frigo_switch
      - *switch_frigo
    from: 'on'
    to: 'off'
    id: switch_off

  - platform: state
    entity_id:
      - input_boolean.frigo_switch
      - *switch_frigo
    from: 'off'
    to: 'on'
    id: switch_on

  - platform: template
    value_template: >-
      {{ is_state('binary_sensor.compressore_frigo','off') and
         is_state('input_boolean.frigo_ciclo_attivo','on') }}
    id: controllo_ciclo

  action:

  - choose:
    - conditions:
      - condition: trigger
        id: incremento_statistiche_7gg
      sequence:

      - service: input_text.set_value
        target:
          entity_id: >
            {% set today = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][now().weekday()] %}
            {% if today == "Monday" %}    input_text.lunedi_frigo_cicli
            {% elif today == "Tuesday" %} input_text.martedi_frigo_cicli
            {% elif today == "Wednesday" %} input_text.mercoledi_frigo_cicli
            {% elif today == "Thursday" %} input_text.giovedi_frigo_cicli
            {% elif today == "Friday" %}  input_text.venerdi_frigo_cicli
            {% elif today == "Saturday" %} input_text.sabato_frigo_cicli
            {% elif today == "Sunday" %}  input_text.domenica_frigo_cicli
            {% endif %}
        data:
          value: "{{ states('sensor.frigo_cicli_oggi') }}"

      - service: input_text.set_value
        target:
          entity_id: >
            {% set today = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][now().weekday()] %}
            {% if today == "Monday" %}    input_text.lunedi_frigo_tempo
            {% elif today == "Tuesday" %} input_text.martedi_frigo_tempo
            {% elif today == "Wednesday" %} input_text.mercoledi_frigo_tempo
            {% elif today == "Thursday" %} input_text.giovedi_frigo_tempo
            {% elif today == "Friday" %}  input_text.venerdi_frigo_tempo
            {% elif today == "Saturday" %} input_text.sabato_frigo_tempo
            {% elif today == "Sunday" %}  input_text.domenica_frigo_tempo
            {% endif %}
        data:
          value: "{{ state_attr('sensor.time_on_frigo','Oggi') }}"

      - service: input_number.set_value
        target:
          entity_id: >
            {% set today = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][now().weekday()] %}
            {% if today == "Monday" %}    input_number.lunedi_frigo_consumo
            {% elif today == "Tuesday" %} input_number.martedi_frigo_consumo
            {% elif today == "Wednesday" %} input_number.mercoledi_frigo_consumo
            {% elif today == "Thursday" %} input_number.giovedi_frigo_consumo
            {% elif today == "Friday" %}  input_number.venerdi_frigo_consumo
            {% elif today == "Saturday" %} input_number.sabato_frigo_consumo
            {% elif today == "Sunday" %}  input_number.domenica_frigo_consumo
            {% endif %}
        data:
          value: "{{ states('sensor.frigo_energy_oggi') }}"

      - service: input_number.set_value
        target:
          entity_id: >
            {% set today = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][now().weekday()] %}
            {% if today == "Monday" %}    input_number.lunedi_frigo_costo
            {% elif today == "Tuesday" %} input_number.martedi_frigo_costo
            {% elif today == "Wednesday" %} input_number.mercoledi_frigo_costo
            {% elif today == "Thursday" %} input_number.giovedi_frigo_costo
            {% elif today == "Friday" %}  input_number.venerdi_frigo_costo
            {% elif today == "Saturday" %} input_number.sabato_frigo_costo
            {% elif today == "Sunday" %}  input_number.domenica_frigo_costo
            {% endif %}
        data:
          value: "{{ state_attr('sensor.time_on_frigo','costo_oggi_frigo') }}"

  - choose:
    - alias: SWITCH OFF
      conditions:
      - condition: trigger
        id: switch_off
      sequence:
      - service: switch.turn_off
        target:
          entity_id: *switch_frigo
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.frigo_switch

  - choose:
    - alias: SWITCH ON
      conditions:
      - condition: trigger
        id: switch_on
      sequence:
      - service: switch.turn_on
        target:
          entity_id: *switch_frigo
      - service: input_boolean.turn_on
        target:
          entity_id: input_boolean.frigo_switch

  - choose:
    - conditions:
      - condition: trigger
        id: controllo_ciclo
      sequence:
      - delay: '00:01:00'
      - entity_id: input_boolean.frigo_ciclo_attivo
        service: input_boolean.turn_off

  - choose:
    - conditions:
      - condition: trigger
        id: inizio_ciclo
      sequence:
      - entity_id: input_boolean.frigo_ciclo_attivo
        service: input_boolean.turn_on

  - choose:
    - conditions:
      - condition: trigger
        id: fine_ciclo
      sequence:

      - service: input_text.set_value
        target:
          entity_id: input_text.frigo_ultimo_ciclo
        data:
          value: "{{ state_attr('sensor.time_on_frigo','tempo_ciclo_frigo') }}"

      - service: counter.increment
        target:
          entity_id: counter.frigo_cicli_totale

      - delay: '00:00:05'

      - entity_id: input_boolean.frigo_ciclo_attivo
        service: input_boolean.turn_off

  - parallel:
    - choose:
      - conditions:
        - condition: trigger
          id: fine_ciclo
        - condition: time
          after: 'input_datetime.frigo_notifiche_inizio'
          before: 'input_datetime.frigo_notifiche_fine'
        - condition: state
          entity_id: input_boolean.frigo_notify_google
          state: 'on'
        sequence:
        - service: tts.google_translate_say
          continue_on_error: true
          data:
            entity_id: *google
            message: "{{ states('input_text.frigo_messaggio') }} in {{ state_attr('sensor.time_on_frigo','tempo_ciclo_frigo') }}"

    - choose:
      - conditions:
        - condition: trigger
          id: fine_ciclo
        - condition: time
          after: 'input_datetime.frigo_notifiche_inizio'
          before: 'input_datetime.frigo_notifiche_fine'
        - condition: state
          entity_id: input_boolean.frigo_notify_alexa
          state: 'on'
        sequence:
        - service: notify.alexa_media
          continue_on_error: true
          data:
            target: *alexa
            data:
              type: announce
              method: spoken
            message: "{{ states('input_text.frigo_messaggio') }} in {{ state_attr('sensor.time_on_frigo','tempo_ciclo_frigo') }}"

    - choose:
      - conditions:
        - condition: trigger
          id: fine_ciclo
        - condition: state
          entity_id: input_boolean.frigo_notify_push
          state: 'on'
        sequence:
        - data_template:
            message: >-
              🧊 {{ states('input_text.frigo_nome') }}

              ⏱ Ciclo durato: {{ state_attr('sensor.time_on_frigo','tempo_ciclo_frigo') }}

              ⚡ Consumati: {{ state_attr('sensor.time_on_frigo','consumo_ciclo_frigo') }}

              💰 Spesi: {{ state_attr('sensor.time_on_frigo','costo_ciclo_frigo') }} €
            title: "Frigorifero"
          service: notify.frigorifero
          continue_on_error: true

- alias: frigo_off_automatico
  id: frigo_off_automatico
  trigger:
    - platform: time
      at: 'input_datetime.frigo_off'
      id: frigo_automatico_off
  condition: []
  action:
    - choose:
      - conditions:
        - condition: trigger
          id: frigo_automatico_off
        - condition: state
          entity_id: *switch_frigo
          state: 'on'
        sequence:
        - entity_id: *switch_frigo
          service: switch.turn_off`;

  /* ── PKG BUILD ── */
  var _FRIGO_WIZ_KEY = 'frarik_pkg_wizard_frigorifero';

  function _buildPkg(potenza, sw, push, google, alexa) {
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
    var yaml = _FRIGO_PKG_YAML
      .split('IL_TUO_SENSORE_POTENZA_FRIGO').join(potenza || 'sensor.non_configurato')
      .split('IL_TUO_SWITCH_FRIGO').join(sw || 'switch.non_configurato');
    yaml = yaml.replace(ind + '- service: IL_TUO_MOBILE_APP_1', pushLines);
    yaml = yaml.replace(ind + '- IL_TUO_MEDIA_PLAYER_GOOGLE_1', googleLines);
    yaml = yaml.replace(ind + '- IL_TUO_MEDIA_PLAYER_ALEXA_1', alexaLines);
    return yaml;
  }

  /* ── WIZARD ── */
  function _openWizard(hass, onDone) {
    var states = (hass && hass.states) || {};
    var allIds = Object.keys(states).sort();
    var sensorIds = allIds.filter(function(id) { return /^sensor\./.test(id); });
    var switchIds = allIds.filter(function(id) { return /^switch\./.test(id); });
    var mediaIds  = allIds.filter(function(id) { return /^media_player\./.test(id); });
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(_FRIGO_WIZ_KEY) || 'null'); } catch(e) {}
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
        return '<div class="wd-push-row"><input class="wd-inp ' + cls + '" type="text" autocomplete="off" placeholder="' + placeholder + '" value="' + (v || '').replace(/"/g, '&quot;') + '"><button class="wd-rm" data-rm="' + i + '">✕</button></div>';
      }).join('');
    }

    function renderWiz() {
      sr.innerHTML = '<style>'
        + ':host{all:initial;font-family:system-ui,sans-serif}'
        + '.wd-bd{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:flex-end}'
        + '.wd-panel{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#080f18;border:1px solid rgba(56,189,248,.3);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:wUp .22s cubic-bezier(.32,1.12,.56,1)}'
        + '@keyframes wUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'
        + '.wd-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}'
        + '.wd-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.3);flex-shrink:0}'
        + '.wd-tit{font-size:14px;font-weight:800}'
        + '.wd-sub{font-size:11px;color:rgba(255,255,255,.45);margin-top:1px}'
        + '.wd-x{margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none}'
        + '.wd-body{flex:1;overflow-y:auto;padding:16px;scrollbar-width:none;display:flex;flex-direction:column;gap:14px}'
        + '.wd-body::-webkit-scrollbar{display:none}'
        + '.wd-sec{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding-bottom:5px;border-bottom:1px solid rgba(56,189,248,.18);margin-bottom:10px}'
        + '.wd-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px}'
        + '.wd-frow{position:relative;margin-bottom:10px}'
        + '.wd-inp{width:100%;padding:9px 11px;border-radius:10px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none}'
        + '.wd-inp:focus{border-color:rgba(56,189,248,.5)}'
        + '.wd-drop{position:absolute;left:0;right:0;top:100%;z-index:10;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 9px 9px;display:none}'
        + '.wd-item{padding:5px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0}'
        + '.wd-push-row{display:flex;gap:6px;margin-bottom:6px}'
        + '.wd-push-row .wd-inp{flex:1}'
        + '.wd-rm{width:30px;height:38px;border-radius:8px;background:rgba(255,255,255,.07);border:none;color:#fff;cursor:pointer;font-size:14px;flex-shrink:0}'
        + '.wd-add{padding:6px 12px;border-radius:8px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.25);color:#38bdf8;font-size:11px;font-weight:700;cursor:pointer}'
        + '.wd-note{font-size:11px;color:rgba(255,255,255,.4);line-height:1.5;margin:0 0 10px}'
        + '.wd-foot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;gap:8px;flex-shrink:0}'
        + '.wd-cancel{flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;font-size:13px;background:rgba(255,255,255,.1);color:#fff}'
        + '.wd-install{flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#38bdf8;color:#060d14}'
        + '.wd-loading{opacity:.6;pointer-events:none}'
        + '</style>'
        + '<div class="wd-bd" id="wd-bd">'
        + '<div class="wd-panel">'
        + '<div class="wd-hdr"><div class="wd-ico">🧊</div>'
        + '<div><div class="wd-tit">Installa PKG Frigorifero</div><div class="wd-sub">frarik_frigorifero.yaml → config/packages/</div></div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'

        /* ── Sensori ── */
        + '<div><div class="wd-sec">Sensori</div>'
        + '<div class="wd-lbl">Sensore Potenza (W)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-potenza" type="text" autocomplete="off" placeholder="sensor.presa_frigorifero_potenza" value="' + ((saved && saved.potenza) || '').replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-potenza"></div></div>'
        + '<div class="wd-lbl">Switch Presa Frigo</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-switch" type="text" autocomplete="off" placeholder="switch.presa_frigorifero" value="' + ((saved && saved.sw) || '').replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-switch"></div></div>'
        + '</div>'

        /* ── Notifiche Push ── */
        + '<div><div class="wd-sec">Notifiche Push</div>'
        + '<p class="wd-note">mobile_app dei dispositivi che ricevono le notifiche push (es. <code>mobile_app_iphone</code>).</p>'
        + '<div id="push-rows">' + multiRows(pushRows, 'push-inp', 'mobile_app_...') + '</div>'
        + '<button class="wd-add" id="push-add">+ Aggiungi dispositivo</button>'
        + '</div>'

        /* ── Notifiche Google ── */
        + '<div><div class="wd-sec">Notifiche Google / Chromecast</div>'
        + '<p class="wd-note">media_player dei dispositivi Google Home / Chromecast (es. <code>media_player.google_cucina</code>). Lascia vuoto per non usare.</p>'
        + '<div id="google-rows">' + multiRows(googleRows, 'google-inp', 'media_player.google_cucina') + '</div>'
        + '<button class="wd-add" id="google-add">+ Aggiungi speaker Google</button>'
        + '</div>'

        /* ── Notifiche Alexa ── */
        + '<div><div class="wd-sec">Notifiche Alexa</div>'
        + '<p class="wd-note">media_player dei dispositivi Alexa (es. <code>media_player.echo_cucina</code>). Lascia vuoto per non usare.</p>'
        + '<div id="alexa-rows">' + multiRows(alexaRows, 'alexa-inp', 'media_player.echo_cucina') + '</div>'
        + '<button class="wd-add" id="alexa-add">+ Aggiungi Echo</button>'
        + '</div>'

        + '</div>'
        + '<div class="wd-foot">'
        + '<button class="wd-cancel" id="wd-cancel">Annulla</button>'
        + '<button class="wd-install" id="wd-install">📦 Installa PKG</button>'
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

      setupAC(sr.getElementById('f-potenza'), sr.getElementById('d-potenza'), sensorIds);
      setupAC(sr.getElementById('f-switch'),  sr.getElementById('d-switch'),  switchIds);
      sr.querySelectorAll('.google-inp').forEach(function(inp) { setupAC(inp, null, mediaIds); });
      sr.querySelectorAll('.alexa-inp').forEach(function(inp)  { setupAC(inp, null, mediaIds); });

      sr.getElementById('wd-install').addEventListener('click', function() {
        var potenza = sr.getElementById('f-potenza').value.trim();
        var sw      = sr.getElementById('f-switch').value.trim();
        var push    = Array.from(sr.querySelectorAll('.push-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        var google  = Array.from(sr.querySelectorAll('.google-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        var alexa   = Array.from(sr.querySelectorAll('.alexa-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        try { localStorage.setItem(_FRIGO_WIZ_KEY, JSON.stringify({potenza: potenza, sw: sw, push: push, google: google, alexa: alexa})); } catch(e) {}
        var yaml = _buildPkg(potenza, sw, push, google, alexa);
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading');
        btn.textContent = 'Installazione…';
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_frigorifero.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Frigorifero installato! Riavvia HA.'); } catch(e) {}
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

  /* ── CARD ── */
  const CARD = {
    id: 'frigorifero', name: 'Frigorifero', icon: '🧊', version: '1.8',
    desc: 'Monitoraggio compressore, cicli, energia e costi. Richiede PKG Centro Controllo Frigorifero.',
    render: render, mount: mount, update: update, configure: openCfg,
    frarik_pkg_check: 'sensor.frarik_frigorifero_versione',
    frarik_pkg_id: 'frarik_frigorifero',
    frarik_pkg_version: '1.3',
    openWizard: _openWizard,
    _buildPkgFromConfig: function(cfg) { return _buildPkg(cfg.potenza || '', cfg.sw || '', cfg.push || [], cfg.google || [], cfg.alexa || []); },
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: frigorifero v' + CARD.version); } catch (e) {}
})();
