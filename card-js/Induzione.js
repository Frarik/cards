/* frarik-version: 1.1 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_induzionecard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function Attr(h, id, attr) { const s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes[attr] != null) ? s.attributes[attr] : null; }
  function num(v) { const x = parseFloat(String(v != null ? v : '').replace(',', '.')); return isNaN(x) ? null : x; }
  function has(h, id) { return !!(h && h.states && h.states[id]); }
  function isOn(h, id) { return !!(h && h.states && h.states[id] && h.states[id].state === 'on'); }
  function callSvc(domain, service, data) { try { const h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch (e) {} }
  async function callApi(method, path) { try { const h = H(); if (h && h.callApi) return await h.callApi(method, path); } catch (e) {} return null; }

  function fmtEur(v) { if (v == null || v === '') return '—'; const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(2) + ' €'; }
  function fmtKwh(v) { if (v == null || v === '') return '—'; const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(3) + ' kWh'; }
  function fmtKwhShort(v) { if (v == null || v === '') return '—'; const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(2) + ' kWh'; }

  function pkDefaults() {
    return {
      pk_power:      'sensor.potenza_induzione_w',
      pk_running:    'binary_sensor.piano_induzione',
      pk_switch:     'switch.presa_induzione',
      pk_kwh_oggi:   'sensor.induzione_energy_oggi',
      pk_kwh_mese:   'sensor.induzione_energy_mese',
      pk_kwh_anno:   'sensor.induzione_energy_anno',
      pk_cicli_oggi: 'sensor.induzione_cicli_oggi',
      pk_cicli_mese: 'sensor.induzione_cicli_mese',
      pk_cicli_anno: 'sensor.induzione_cicli_anno',
      pk_cicli_tot:  'counter.induzione_cicli_totale',
      pk_time_on:    'sensor.time_on_induzione',
      pk_soglia:     'input_number.induzione_soglia_w',
      pk_versione:   'sensor.frarik_induzione_versione',
    };
  }

  function cfgFor(card) {
    const c = load(card), pk = pkDefaults(), r = {};
    Object.keys(pk).forEach(function (k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    r.name = c.name || 'Induzione';
    return r;
  }

  /* â”€â”€ INDUCTION SVG â”€â”€ */
  function _induzioneSVG(running) {
    var c   = running ? '#38bdf8' : '#64748b';
    var glow = running ? ';filter:drop-shadow(0 0 14px rgba(56,189,248,.4))' : '';
    var css = running ? '@keyframes indzn{0%,100%{opacity:.35;stroke-width:1.5}50%{opacity:.95;stroke-width:2.2}}@keyframes indzn2{0%,100%{opacity:.2}50%{opacity:.75}}@keyframes indzn3{0%,100%{opacity:.12}50%{opacity:.5}}' : '';
    var z1a = running ? ' style="animation:indzn  2s ease-in-out infinite"'     : '';
    var z2a = running ? ' style="animation:indzn2 2s ease-in-out infinite"'     : '';
    var z3a = running ? ' style="animation:indzn3 2s ease-in-out infinite"'     : '';
    var z1b = running ? ' style="animation:indzn  2s ease-in-out infinite .5s"' : '';
    var z2b = running ? ' style="animation:indzn2 2s ease-in-out infinite .5s"' : '';
    var z3b = running ? ' style="animation:indzn3 2s ease-in-out infinite .5s"' : '';
    var z1c = running ? ' style="animation:indzn  2s ease-in-out infinite 1s"'  : '';
    var z2c = running ? ' style="animation:indzn2 2s ease-in-out infinite 1s"'  : '';
    var z3c = running ? ' style="animation:indzn3 2s ease-in-out infinite 1s"'  : '';
    var z1d = running ? ' style="animation:indzn  2s ease-in-out infinite 1.5s"': '';
    var z2d = running ? ' style="animation:indzn2 2s ease-in-out infinite 1.5s"': '';
    var z3d = running ? ' style="animation:indzn3 2s ease-in-out infinite 1.5s"': '';
    var zo = running ? '.7' : '.22'; var zo2 = running ? '.45' : '.12'; var zo3 = running ? '.9' : '.15';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 78" style="display:block;width:100%;max-height:130px' + glow + '">'
      + (running ? '<defs><style>' + css + '</style></defs>' : '')
      + '<rect x="1" y="1" width="108" height="76" rx="10" fill="#06111e" stroke="' + c + '" stroke-width="1.5"/>'
      + '<rect x="3" y="3" width="104" height="72" rx="8" fill="#050e1a"/>'
      + '<rect x="4" y="4" width="80" height="3" rx="2" fill="rgba(255,255,255,.04)"/>'
      + '<circle cx="28" cy="21" r="19" fill="none" stroke="' + (running ? '#38bdf8' : '#1a3050') + '" stroke-width="1.8"' + z1a + ' opacity="' + zo + '"/>'
      + '<circle cx="28" cy="21" r="13" fill="none" stroke="' + c + '" stroke-width="1.1"' + z2a + ' opacity="' + zo2 + '"/>'
      + '<circle cx="28" cy="21" r="7"  fill="none" stroke="' + c + '" stroke-width=".8"' + z3a + ' opacity="' + zo3 + '"/>'
      + '<circle cx="28" cy="21" r="2.5" fill="' + c + '" opacity="' + (running ? '.85' : '.15') + '"/>'
      + '<circle cx="82" cy="21" r="19" fill="none" stroke="' + (running ? '#38bdf8' : '#1a3050') + '" stroke-width="1.8"' + z1b + ' opacity="' + zo + '"/>'
      + '<circle cx="82" cy="21" r="13" fill="none" stroke="' + c + '" stroke-width="1.1"' + z2b + ' opacity="' + zo2 + '"/>'
      + '<circle cx="82" cy="21" r="7"  fill="none" stroke="' + c + '" stroke-width=".8"' + z3b + ' opacity="' + zo3 + '"/>'
      + '<circle cx="82" cy="21" r="2.5" fill="' + c + '" opacity="' + (running ? '.85' : '.15') + '"/>'
      + '<circle cx="28" cy="57" r="19" fill="none" stroke="' + (running ? '#38bdf8' : '#1a3050') + '" stroke-width="1.8"' + z1c + ' opacity="' + zo + '"/>'
      + '<circle cx="28" cy="57" r="13" fill="none" stroke="' + c + '" stroke-width="1.1"' + z2c + ' opacity="' + zo2 + '"/>'
      + '<circle cx="28" cy="57" r="7"  fill="none" stroke="' + c + '" stroke-width=".8"' + z3c + ' opacity="' + zo3 + '"/>'
      + '<circle cx="28" cy="57" r="2.5" fill="' + c + '" opacity="' + (running ? '.85' : '.15') + '"/>'
      + '<circle cx="82" cy="57" r="19" fill="none" stroke="' + (running ? '#38bdf8' : '#1a3050') + '" stroke-width="1.8"' + z1d + ' opacity="' + zo + '"/>'
      + '<circle cx="82" cy="57" r="13" fill="none" stroke="' + c + '" stroke-width="1.1"' + z2d + ' opacity="' + zo2 + '"/>'
      + '<circle cx="82" cy="57" r="7"  fill="none" stroke="' + c + '" stroke-width=".8"' + z3d + ' opacity="' + zo3 + '"/>'
      + '<circle cx="82" cy="57" r="2.5" fill="' + c + '" opacity="' + (running ? '.85' : '.15') + '"/>'
      + '<line x1="55" y1="4" x2="55" y2="74" stroke="rgba(56,189,248,.07)" stroke-width=".8"/>'
      + '<line x1="4" y1="39" x2="106" y2="39" stroke="rgba(56,189,248,.07)" stroke-width=".8"/>'
      + '<circle cx="103" cy="72" r="2.5" fill="' + (running ? '#22c55e' : '#162035') + '" opacity="' + (running ? '1' : '.5') + '"/>'
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
    const tempoC     = Attr(h, ton, 'tempo_ciclo_induzione')   || '—';
    const consumoC   = Attr(h, ton, 'consumo_ciclo_induzione') || '—';
    const costoC     = Attr(h, ton, 'costo_ciclo_induzione');
    const kwOggi     = S(h, c.pk_kwh_oggi);
    const cicOggi    = S(h, c.pk_cicli_oggi);
    const timeOggi   = Attr(h, ton, 'Oggi')                || '—';
    const costoOggi  = Attr(h, ton, 'costo_oggi_induzione');

    const pw     = pwV || 0;
    const col    = running ? '#38bdf8' : '#64748b';
    const statusLabel = running ? 'PIANO ON' : 'STANDBY';
    const soglia = num(S(h, c.pk_soglia)) || 300;
    const barPct = Math.min(100, (pw / soglia) * 100);
    const barCol = pw < 50 ? '#64748b' : pw <= 150 ? '#38bdf8' : pw <= 250 ? '#22c55e' : pw <= 400 ? '#f97316' : '#ef4444';

    let lastCycleFull = null;
    if (!running && terminato && terminato !== '—') {
      try {
        const rst = h && h.states && h.states[c.pk_running];
        const lc = rst ? (rst.last_changed || rst.last_updated) : null;
        if (lc) {
          const _ld = new Date(lc);
          if (!isNaN(_ld.getTime())) {
            lastCycleFull = String(_ld.getDate()).padStart(2,'0') + '/' + String(_ld.getMonth()+1).padStart(2,'0') + ' · ' + terminato;
          } else { lastCycleFull = terminato; }
        } else { lastCycleFull = terminato; }
      } catch(e) { lastCycleFull = terminato; }
    }
    const kwOggiNum = num(kwOggi);
    const costoOggiNum = num(costoOggi);

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(56,189,248,.08) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:#38bdf8' + (running ? ';box-shadow:0 0 5px #38bdf8;animation:fcPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:6px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      + '#' + rid + ' .fc-st{display:flex;align-items:center;justify-content:flex-end;gap:7px;font-size:14px;font-weight:800;color:' + col + ';padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-stdot{width:8px;height:8px;border-radius:50%;background:#38bdf8;flex-shrink:0' + (running ? ';box-shadow:0 0 7px #38bdf8;animation:fcPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-pwfull{margin:0 14px 14px}'
      + '#' + rid + ' .fc-pwfull-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px}'
      + '#' + rid + ' .fc-pwfull-lbl{font-size:10px;font-weight:700;color:#fff}'
      + '#' + rid + ' .fc-pwfull-v{font-size:18px;font-weight:900;color:' + barCol + ';line-height:1}'
      + '#' + rid + ' .fc-pw-bar{height:5px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}'
      + '#' + rid + ' .fc-pw-fill{height:100%;border-radius:2px;transition:width .6s,background .4s}'
      + '#' + rid + ' .fc-met{display:flex;align-items:center;justify-content:space-between;gap:6px}'
      + '#' + rid + ' .fc-met-lbl{font-size:11px;font-weight:700;color:#fff;flex-shrink:0}'
      + '#' + rid + ' .fc-met-v{font-size:15px;font-weight:800;color:#fff;text-align:right}'
      + '#' + rid + ' .fc-met-sm{font-size:12px;font-weight:800;color:#fff;text-align:right}'
      + '#' + rid + ' .fc-stats{display:flex;margin:0 14px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;cursor:pointer}'
      + '#' + rid + ' .fc-stats:hover{background:rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-sb{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 3px;gap:2px}'
      + '#' + rid + ' .fc-sb-sep{width:1px;background:rgba(255,255,255,.08);flex-shrink:0}'
      + '#' + rid + ' .fc-sb-n{font-size:12px;font-weight:900;color:#38bdf8;height:18px;display:flex;align-items:center;justify-content:center}'
      + '#' + rid + ' .fc-sb-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px;text-align:center}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 12px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(56,189,248,.12);border-color:rgba(56,189,248,.3);color:#38bdf8}'
      + '#' + rid + ' [data-sya]{cursor:pointer}'
      + (running ? '@keyframes fcPulse{0%,100%{opacity:.6}50%{opacity:1}}' : '')
      + '</style>';

    let cycleDt = '—', cycleLbl = 'Fine ciclo';
    if (running) {
      cycleLbl = 'Avviato';
      try {
        const _rst = h && h.states && h.states[c.pk_running];
        const _lc = _rst ? (_rst.last_changed || _rst.last_updated) : null;
        if (_lc) {
          const _sd = new Date(_lc);
          if (!isNaN(_sd.getTime())) {
            cycleDt = String(_sd.getHours()).padStart(2,'0') + ':' + String(_sd.getMinutes()).padStart(2,'0');
          }
        }
      } catch(e) {}
    } else {
      cycleDt = lastCycleFull || (terminato && terminato !== '—' && /\d/.test(terminato) ? terminato : '—');
    }

    const heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img" data-sya="popup-cicli">' + _induzioneSVG(running) + '</div>'
      + '<div class="fc-hero-r">'
      + '<div class="fc-st">' + (running ? 'In funzione' : 'Standby') + '<div class="fc-stdot"></div></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">' + cycleLbl + '</span><span class="fc-met-sm">' + cycleDt + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Costo</span><span class="fc-met-v">' + (costoC != null ? costoC + ' €' : '—') + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Durata</span><span class="fc-met-v">' + tempoC + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Energia</span><span class="fc-met-v">' + consumoC + '</span></div>'
      + '</div>'
      + '</div>';

    const pwBarHtml = '<div class="fc-pwfull">'
      + '<div class="fc-pwfull-hd">'
      + '<span class="fc-pwfull-lbl">Consumo istantaneo</span>'
      + '<span class="fc-pwfull-v">' + (pw > 0 ? pw.toFixed(0) + ' W' : '— W') + '</span>'
      + '</div>'
      + '<div class="fc-pw-bar"><div class="fc-pw-fill" style="width:' + barPct + '%;background:' + barCol + ';box-shadow:0 0 6px ' + barCol + '88"></div></div>'
      + '</div>';

    const statsHtml = '<div class="fc-stats" data-sya="popup-cicli">'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (cicOggi || '—') + '</div><div class="fc-sb-l">Cicli oggi</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + timeOggi + '</div><div class="fc-sb-l">Tempo oggi</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (kwOggiNum != null ? kwOggiNum.toFixed(2) : '—') + '</div><div class="fc-sb-l">kWh oggi</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (costoOggiNum != null ? costoOggiNum.toFixed(2) : '—') + '</div><div class="fc-sb-l">€ oggi</div></div>'
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
      + '<div class="fc-hdr-iw">🍳</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'Induzione') + '</div>'
      + '<div class="fc-hdr-pill" style="background:' + (running ? 'rgba(56,189,248,.1)' : 'rgba(56,189,248,.05)') + ';border:1px solid rgba(56,189,248,' + (running ? '.28' : '.15') + ');color:#38bdf8">'
      + '<div class="fc-dot"></div>'
      + statusLabel
      + '</div>'
      + '</div>'
      + '<div class="fc-scroll">'
      + heroHtml
      + pwBarHtml
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
      + row('Oggi', fmtEur(Attr(h, ton, 'costo_oggi_induzione')), '#7dd3fc')
      + row('Ieri', fmtEur(Attr(h, ton, 'costo_ieri_induzione')), '#fff')
      + row('Questo mese', fmtEur(Attr(h, ton, 'costo_mese_induzione')), '#7dd3fc')
      + row('Mese precedente', fmtEur(Attr(h, ton, 'costo_mese_prec_induzione')), '#fff')
      + row('Questo anno', fmtEur(Attr(h, ton, 'costo_anno_induzione')), '#7dd3fc')
      + row('Anno precedente', fmtEur(Attr(h, ton, 'costo_anno_prec_induzione')), '#fff');
    mkOv(popShell('⚡', '56,189,248', 'Energia & Costi', 'Induzione', 'fc-en-close', content), 'fc-en-close');
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
    const _todayJsDay = new Date().getDay();
    const _todayIdx = [6,0,1,2,3,4,5][_todayJsDay];
    function cleanVal(v) { return (!v || v === 'unknown' || v === 'unavailable' || v === 'none') ? '—' : v; }
    DAYS.forEach(function (d, i) {
      const isToday = i === _todayIdx;
      const cicli = isToday ? cleanVal(S(h, c.pk_cicli_oggi))      : cleanVal(S(h, 'input_text.' + d + '_induzione_cicli'));
      const tempo = isToday ? cleanVal(Attr(h, ton, 'Oggi'))        : cleanVal(S(h, 'input_text.' + d + '_induzione_tempo'));
      weekHtml += '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;background:' + (isToday ? 'rgba(56,189,248,.12)' : 'rgba(56,189,248,.05)') + ';border:1px solid ' + (isToday ? 'rgba(56,189,248,.4)' : 'rgba(56,189,248,.1)') + ';border-radius:8px;padding:6px 2px' + (isToday ? ';box-shadow:0 0 8px rgba(56,189,248,.15)' : '') + '">'
        + '<div style="font-size:8px;font-weight:' + (isToday ? '900' : '700') + ';color:' + (isToday ? '#38bdf8' : '#fff') + '">' + DAY_LABELS[i] + '</div>'
        + '<div style="font-size:11px;font-weight:900;color:#38bdf8">' + cicli + '</div>'
        + '<div style="font-size:8px;color:#fff;text-align:center;line-height:1.2">' + tempo + '</div>'
        + '</div>';
    });
    weekHtml += '</div>';
    const content = weekHtml
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Cicli piano</div>'
      + row('Oggi', S(h, c.pk_cicli_oggi) || '—', '#38bdf8')
      + row('Questo mese', S(h, c.pk_cicli_mese) || '—', '#38bdf8')
      + row('Questo anno', S(h, c.pk_cicli_anno) || '—', '#38bdf8')
      + row('Totale storico', S(h, c.pk_cicli_tot) || '—', '#7dd3fc')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Tempo piano</div>'
      + row('Oggi', Attr(h, ton, 'Oggi') || '—', '#7dd3fc')
      + row('Ieri', Attr(h, ton, 'Ieri') || '—', '#fff')
      + row('Questo mese', Attr(h, ton, 'Mese') || '—', '#7dd3fc')
      + row('Mese precedente', Attr(h, ton, 'Mese Precedente') || '—', '#fff')
      + row('Questo anno', Attr(h, ton, 'Anno') || '—', '#7dd3fc')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Costo</div>'
      + row('Ultimo ciclo', fmtEur(Attr(h, ton, 'costo_ciclo_induzione')), '#7dd3fc')
      + row('Oggi', fmtEur(Attr(h, ton, 'costo_oggi_induzione')), '#7dd3fc')
      + row('Questo mese', fmtEur(Attr(h, ton, 'costo_mese_induzione')), '#fff')
      + row('Questo anno', fmtEur(Attr(h, ton, 'costo_anno_induzione')), '#fff');
    mkOv(popShell('❄', '56,189,248', 'Cicli & Statistiche', 'Piano induzione', 'fc-ci-close', content), 'fc-ci-close');
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

    const formHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label><input id="fc-name" type="text" value="' + (cf.name || '').replace(/"/g, '&quot;') + '" placeholder="es. Induzione cucina" style="' + stInp.replace('monospace', 'system-ui') + '"></div>'
      + '<div style="' + stSec + '">Sensori base</div>'
      + field('fc-power',   'Potenza istantanea (W)', cf.pk_power,   'sensor.potenza_induzione_w')
      + field('fc-running', 'Piano on/off',     cf.pk_running, 'binary_sensor.piano_induzione')
      + field('fc-switch',  'Switch presa',           cf.pk_switch,  'switch.presa_induzione')
      + '<div style="' + stSec + '">PKG — Energia (kWh)</div>'
      + field('fc-kwh-oggi', 'kWh oggi', cf.pk_kwh_oggi, 'sensor.induzione_energy_oggi')
      + field('fc-kwh-mese', 'kWh mese', cf.pk_kwh_mese, 'sensor.induzione_energy_mese')
      + field('fc-kwh-anno', 'kWh anno', cf.pk_kwh_anno, 'sensor.induzione_energy_anno')
      + '<div style="' + stSec + '">PKG — Cicli</div>'
      + field('fc-cic-oggi', 'Cicli oggi',    cf.pk_cicli_oggi, 'sensor.induzione_cicli_oggi')
      + field('fc-cic-mese', 'Cicli mese',    cf.pk_cicli_mese, 'sensor.induzione_cicli_mese')
      + field('fc-cic-anno', 'Cicli anno',    cf.pk_cicli_anno, 'sensor.induzione_cicli_anno')
      + field('fc-cic-tot',  'Cicli totale',  cf.pk_cicli_tot,  'counter.induzione_cicli_totale')
      + '<div style="' + stSec + '">PKG — Statistiche</div>'
      + field('fc-time-on', 'Sensore time_on',  cf.pk_time_on, 'sensor.time_on_induzione')
      + field('fc-soglia',  'Soglia lavoro (W)', cf.pk_soglia,  'input_number.induzione_soglia_w')
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="fc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="fc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#060d14">Salva</button>'
      + '</div>';

    const allFieldIds = ['fc-power','fc-running','fc-switch','fc-kwh-oggi','fc-kwh-mese','fc-kwh-anno','fc-cic-oggi','fc-cic-mese','fc-cic-anno','fc-cic-tot','fc-time-on','fc-soglia'];
    const ov = mkOv(popShell('🍳', '56,189,248', 'Configura Induzione', card.id || '', 'fc-cfg-close', formHtml), 'fc-cfg-close');

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
    dToggle('input_boolean.induzione_notify_push',   '📱 Push');
    dToggle('input_boolean.induzione_notify_google', '🔊 Google');
    dToggle('input_boolean.induzione_notify_alexa',  '🗣 Alexa');
    dTime('input_datetime.induzione_notifiche_inizio', '⏰ Orario inizio notifiche');
    dTime('input_datetime.induzione_notifiche_fine',   '⏰ Orario fine notifiche');

    dSec('🔌 Elettrodomestico');
    dToggle('input_boolean.induzione_switch', 'Switch presa');
    dNum('input_number.induzione_soglia_w',          'Soglia lavoro',  'W',   0, 5000, 1);
    dNum('input_number.induzione_tempo_innesco_m',   'Delay spegnimento', 'min', 0, 60, 1);
    dNum('input_number.induzione_avvio_ritardato_s', 'Delay riavvio',  's',   0, 300, 1);

    dSec('⏰ Spegnimento automatico');
    dToggle('automation.induzione_off_automatico', 'Auto OFF abilitato');
    dTime('input_datetime.induzione_off', 'Orario spegnimento');

    dSec('📝 Personalizzazione');
    dText('input_text.induzione_nome',      'Nome elettrodomestico');
    dText('input_text.induzione_messaggio', 'Messaggio notifica');
    dNum('input_number.costo_energia',  'Costo energia', '€/kWh', 0, 2, 0.001);
    dInfo('Ultimo reset contatori', ss('input_text.induzione_data_reset'));

    const swCss = '<style>'
      + '.fi-sw{width:44px;height:26px;border-radius:13px;cursor:pointer;position:relative;flex-shrink:0;transition:background .25s}'
      + '.fi-sw.on{background:#38bdf8}.fi-sw.off{background:rgba(255,255,255,.12)}'
      + '.fi-knob{position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .25s;box-shadow:0 1px 4px rgba(0,0,0,.4)}'
      + '.fi-sw.on .fi-knob{left:21px}.fi-sw.off .fi-knob{left:3px}'
      + '.fi-inp:focus{border-color:rgba(56,189,248,.55)!important;box-shadow:0 0 0 2px rgba(56,189,248,.12)}'
      + '</style>';
    const resetBtn = '<button id="fi-reset" style="width:100%;margin-top:16px;padding:12px;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.22);color:#f87171;font-size:13px;font-weight:700;cursor:pointer">🔄 Reset Contatori</button>';
    const closeId = 'fi-cl-' + Math.random().toString(36).slice(2, 6);
    const ov = mkOv(popShell('⚙', '100,116,139', 'Impostazioni', c.name || 'Induzione', closeId, swCss + rows.join('') + resetBtn), closeId);

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
      callSvc('script', 'turn_on', {entity_id: 'script.induzione_reset_sensori'});
      rb.textContent = '✅ Reset avviato!'; rb.style.color = '#4ade80';
      setTimeout(function() { try { ov._close(); } catch(e) {} }, 1500);
    });
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    const h = H(), c = cfgFor(card);
    const sig = [CARD.version, S(h, c.pk_power), S(h, c.pk_running), S(h, c.pk_kwh_oggi), S(h, c.pk_cicli_oggi), Attr(h, c.pk_time_on, 'Oggi'), Attr(h, c.pk_time_on, 'tempo_ciclo_induzione'), Attr(h, c.pk_time_on, 'costo_oggi_induzione')].join('|');
    if (!el.querySelector('.fc-card') || el._fcSig !== sig) {
      el._fcSig = sig;
      el.innerHTML = render(card);
    }
    mount(card, hass, el);
  }

  function mount(card, hass, el) {
    if (el._fcBound === CARD.version) return;
    el._fcBound = CARD.version;
    if (el._fcHandler) el.removeEventListener('click', el._fcHandler);
    el._fcHandler = function (e) {
      const sya = e.target.closest('[data-sya]'); if (!sya) return;
      const a = sya.dataset.sya;
      if (a === 'popup-energia')      { openEnergiaPopup(cfgFor(card)); return; }
      if (a === 'popup-cicli')        { openCicliPopup(cfgFor(card)); return; }
      if (a === 'popup-impostazioni') { openImpostazioniHAPopup(cfgFor(card)); return; }
    };
    el.addEventListener('click', el._fcHandler);
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
#   Package: Centro Controllo Induzione                     #
#   Versione: 1.3  |  Frarik / Fratech                       #
#                                                             #
###############################################################

homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Centro Controllo Induzione 1.3 — Frarik'

      setting:

        Sensore Potenza Induzione: &sensore_potenza_induzione "{{ states('IL_TUO_SENSORE_POTENZA_INDUZIONE') | float(0) }}"
        Switch Induzione:          &switch_induzione 'IL_TUO_SWITCH_INDUZIONE'

        Lista MediaPlayer Google: &google
          - IL_TUO_MEDIA_PLAYER_GOOGLE_1

        Lista mediaplayer alexa: &alexa
          - IL_TUO_MEDIA_PLAYER_ALEXA_1

        Device per notifica push: &push
          - service: IL_TUO_MOBILE_APP_1

notify:
  - name: Induzione
    platform: group
    services: *push

sensor:
  - platform: integration
    source: sensor.potenza_induzione_w
    name: kwh_induzione
    unit_prefix: k
    method: left
    round: 2

input_number:
  induzione_soglia_w:
    name: Soglia Lavoro Induzione W
    icon: mdi:flash
    min: 0
    max: 5000
    step: 1.00
    unit_of_measurement: "w"
    mode: box

  induzione_tempo_innesco_m:
    name: Tempo Innesco Induzione M
    icon: mdi:timer
    min: 0
    max: 60
    step: 1.00
    unit_of_measurement: "m"
    mode: box

  induzione_avvio_ritardato_s:
    name: Avvio Ritardato Induzione S
    icon: mdi:timer-sand
    min: 0
    max: 60
    step: 1.00
    unit_of_measurement: "s"
    mode: box

  lunedi_induzione_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  lunedi_induzione_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  martedi_induzione_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  martedi_induzione_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  mercoledi_induzione_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  mercoledi_induzione_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  giovedi_induzione_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  giovedi_induzione_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  venerdi_induzione_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  venerdi_induzione_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  sabato_induzione_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  sabato_induzione_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  domenica_induzione_consumo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  domenica_induzione_costo:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

utility_meter:

  induzione_tempo_oggi:
    source: sensor.time_on_induzione
    cycle: daily

  induzione_tempo_mese:
    source: sensor.time_on_induzione
    cycle: monthly

  induzione_tempo_anno:
    source: sensor.time_on_induzione
    cycle: yearly

  induzione_cicli_oggi:
    source: counter.induzione_cicli_totale
    cycle: daily

  induzione_cicli_mese:
    source: counter.induzione_cicli_totale
    cycle: monthly

  induzione_cicli_anno:
    source: counter.induzione_cicli_totale
    cycle: yearly

  induzione_energy_oggi:
    source: sensor.kwh_induzione
    cycle: daily

  induzione_energy_mese:
    source: sensor.kwh_induzione
    cycle: monthly

  induzione_energy_anno:
    source: sensor.kwh_induzione
    cycle: yearly

template:
  - binary_sensor:
      - name: piano_induzione
        icon: mdi:snowflake
        state: >-
          {{ 'on' if (states('sensor.potenza_induzione_w') | int(0)) >
             states('input_number.induzione_soglia_w') | int(0) else 'off' }}
        delay_off: "00:{{ states('input_number.induzione_tempo_innesco_m') | int(0) }}:00"
        delay_on:  "00:00:{{ states('input_number.induzione_avvio_ritardato_s') | int(0) }}"

  - trigger:
      - platform: state
        entity_id: input_boolean.induzione_ciclo_attivo
        from: "off"
        to: "on"
    sensor:
      - name: inizio_ciclo_induzione
        state: "{{ states('sensor.kwh_induzione') }}"

  - trigger:
      - platform: state
        entity_id: binary_sensor.piano_induzione
        from: "on"
        to: "off"
    sensor:
      - name: fine_ciclo_induzione
        state: "{{ now().strftime('%d/%m/%Y %H:%M') }}"

  - trigger:
      - platform: state
        entity_id: input_boolean.induzione_ciclo_attivo
        from: "off"
        to: "on"
    sensor:
      - name: tempo_riavvio_induzione
        state: "{{ as_timestamp(now()) }}"

  - sensor:
      - name: "time_on_induzione"
        icon: mdi:history
        state: >-
          {% if is_state('binary_sensor.piano_induzione', 'on') and
                (as_timestamp(states.binary_sensor.piano_induzione.last_changed) + 1) <= as_timestamp(now()) %}
            {{ ((as_timestamp(now()) - as_timestamp(states.binary_sensor.piano_induzione.last_changed)) / 3600) }}
          {% else %} 0 {% endif %}
        attributes:
          terminato: >-
            {{ states('sensor.fine_ciclo_induzione') if is_state('binary_sensor.piano_induzione', 'off') else 'In funzione' }}
          tempo_ciclo_induzione: >
            {% set hours = (as_timestamp(now()) - states('sensor.tempo_riavvio_induzione') | float(0)) / 3600 %}
            {% set minutes = ((hours % 1) * 60) | int(0) %}
            {% set hours = (hours - (hours % 1)) | int(0) %}
            {% set day = ((hours | int(0) / 24)) | int(0) %}
            {% if is_state('input_boolean.induzione_ciclo_attivo', 'on') %}
              {% if day | int(0) > 0 %}
                {{ day }}d {{ (hours | int(0)) - (day * 24) }}h {{ minutes }}m
              {% elif hours | int(0) > 0 %}
                {{ hours }}h {{ minutes }}m
              {% else %}
                {{ minutes }}min
              {% endif %}
            {% else %}
              {{ states('input_text.induzione_ultimo_ciclo') }}
            {% endif %}
          Oggi: >
            {% set hours = states('sensor.induzione_tempo_oggi') | float(0) %}
            {% set minutes = ((hours % 1) * 60) | int(0) %}
            {% set hours = (hours - (hours % 1)) | int(0) %}
            {% if hours | int(0) > 0 %}
              {{ hours }}h {{ minutes }}m
            {% else %}
              {{ minutes }}min
            {% endif %}
          Mese: >
            {% set hours = states('sensor.induzione_tempo_mese') | float(0) %}
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
            {% set hours = states('sensor.induzione_tempo_anno') | float(0) %}
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
            {% set hours = state_attr('sensor.induzione_tempo_oggi', 'last_period') | float(0) %}
            {% set minutes = ((hours % 1) * 60) | int(0) %}
            {% set hours = (hours - (hours % 1)) | int(0) %}
            {% if hours | int(0) > 0 %}
              {{ hours }}h {{ minutes }}m
            {% else %}
              {{ minutes }}min
            {% endif %}
          Mese Precedente: >
            {% set hours = state_attr('sensor.induzione_tempo_mese', 'last_period') | float(0) %}
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
          consumo_ciclo_induzione: >-
            {{ (states('sensor.kwh_induzione') | float(0) - states('sensor.inizio_ciclo_induzione') | float(0)) | round(3) }} kWh
          costo_ciclo_induzione: >-
            {{ ((states('sensor.kwh_induzione') | float(0) - states('sensor.inizio_ciclo_induzione') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(3, default=0) }}
          costo_oggi_induzione: >-
            {{ ((states('sensor.induzione_energy_oggi') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_mese_induzione: >-
            {{ ((states('sensor.induzione_energy_mese') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_anno_induzione: >-
            {{ ((states('sensor.induzione_energy_anno') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_ieri_induzione: >-
            {{ ((state_attr('sensor.induzione_energy_oggi', 'last_period') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_mese_prec_induzione: >-
            {{ ((state_attr('sensor.induzione_energy_mese', 'last_period') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_anno_prec_induzione: >-
            {{ ((state_attr('sensor.induzione_energy_anno', 'last_period') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}

      - name: "potenza_induzione_w"
        unit_of_measurement: 'W'
        device_class: power
        state_class: measurement
        icon: mdi:flash
        state: *sensore_potenza_induzione

      - name: "frarik_induzione_versione"
        state: "1.2"

counter:
  induzione_cicli_totale:
    name: Cicli Piano Induzione
    initial: 0
    step: 1

input_boolean:
  induzione_switch:
    name: Switch Induzione
    icon: mdi:power

  induzione_ciclo_attivo:
    name: Ciclo Attivo Induzione

  induzione_notify_push:
    name: Notifica Push Induzione

  induzione_notify_alexa:
    name: Notifica Alexa Induzione

  induzione_notify_google:
    name: Notifica Google Induzione

group:
  induzione_notifiche:
    entities:
      - input_boolean.induzione_notify_google
      - input_boolean.induzione_notify_alexa
      - input_boolean.induzione_notify_push
      - automation.induzione_off_automatico
      - input_boolean.induzione_switch

input_datetime:
  induzione_notifiche_inizio:
    name: Orario Inizio Notifiche Induzione
    has_date: false
    has_time: true

  induzione_notifiche_fine:
    name: Orario Fine Notifiche Induzione
    has_date: false
    has_time: true

  induzione_off:
    name: Induzione Spegnimento Automatico
    has_date: false
    has_time: true

input_text:
  induzione_data_reset:
  induzione_nome:
  induzione_messaggio:
  induzione_ultimo_ciclo:
  lunedi_induzione_cicli:
  lunedi_induzione_tempo:
  martedi_induzione_cicli:
  martedi_induzione_tempo:
  mercoledi_induzione_cicli:
  mercoledi_induzione_tempo:
  giovedi_induzione_cicli:
  giovedi_induzione_tempo:
  venerdi_induzione_cicli:
  venerdi_induzione_tempo:
  sabato_induzione_cicli:
  sabato_induzione_tempo:
  domenica_induzione_cicli:
  domenica_induzione_tempo:

script:
  induzione_reset_sensori:
    sequence:
    - service: input_text.set_value
      data:
        value: "{{ now().strftime('%d/%m/%Y %H:%M') }}"
      target:
        entity_id: input_text.induzione_data_reset

    - service: utility_meter.calibrate
      data:
        value: '0'
      target:
        entity_id:
          - sensor.induzione_cicli_oggi
          - sensor.induzione_cicli_mese
          - sensor.induzione_cicli_anno
          - sensor.induzione_energy_oggi
          - sensor.induzione_energy_mese
          - sensor.induzione_energy_anno
          - sensor.induzione_tempo_oggi
          - sensor.induzione_tempo_mese
          - sensor.induzione_tempo_anno

    - service: input_number.set_value
      data:
        value: '0'
      target:
        entity_id:
          - input_number.lunedi_induzione_consumo
          - input_number.martedi_induzione_consumo
          - input_number.mercoledi_induzione_consumo
          - input_number.giovedi_induzione_consumo
          - input_number.venerdi_induzione_consumo
          - input_number.sabato_induzione_consumo
          - input_number.domenica_induzione_consumo
          - input_number.lunedi_induzione_costo
          - input_number.martedi_induzione_costo
          - input_number.mercoledi_induzione_costo
          - input_number.giovedi_induzione_costo
          - input_number.venerdi_induzione_costo
          - input_number.sabato_induzione_costo
          - input_number.domenica_induzione_costo

    - service: input_text.set_value
      data:
        value: '0'
      target:
        entity_id:
          - input_text.lunedi_induzione_cicli
          - input_text.martedi_induzione_cicli
          - input_text.mercoledi_induzione_cicli
          - input_text.giovedi_induzione_cicli
          - input_text.venerdi_induzione_cicli
          - input_text.sabato_induzione_cicli
          - input_text.domenica_induzione_cicli
          - input_text.lunedi_induzione_tempo
          - input_text.martedi_induzione_tempo
          - input_text.mercoledi_induzione_tempo
          - input_text.giovedi_induzione_tempo
          - input_text.venerdi_induzione_tempo
          - input_text.sabato_induzione_tempo
          - input_text.domenica_induzione_tempo

    - service: counter.reset
      target:
        entity_id:
          - counter.induzione_cicli_totale

automation:
- alias: induzione_automazioni
  id: induzione_automazioni
  max_exceeded: silent
  trigger:

  - platform: state
    entity_id: binary_sensor.piano_induzione
    from: 'off'
    to: 'on'
    id: inizio_ciclo

  - platform: state
    entity_id: binary_sensor.piano_induzione
    from: 'on'
    to: 'off'
    id: fine_ciclo

  - platform: time
    at: '23:59:59'
    id: incremento_statistiche_7gg

  - platform: state
    entity_id:
      - input_boolean.induzione_switch
      - *switch_induzione
    from: 'on'
    to: 'off'
    id: switch_off

  - platform: state
    entity_id:
      - input_boolean.induzione_switch
      - *switch_induzione
    from: 'off'
    to: 'on'
    id: switch_on

  - platform: template
    value_template: >-
      {{ is_state('binary_sensor.piano_induzione','off') and
         is_state('input_boolean.induzione_ciclo_attivo','on') }}
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
            {% if today == "Monday" %}    input_text.lunedi_induzione_cicli
            {% elif today == "Tuesday" %} input_text.martedi_induzione_cicli
            {% elif today == "Wednesday" %} input_text.mercoledi_induzione_cicli
            {% elif today == "Thursday" %} input_text.giovedi_induzione_cicli
            {% elif today == "Friday" %}  input_text.venerdi_induzione_cicli
            {% elif today == "Saturday" %} input_text.sabato_induzione_cicli
            {% elif today == "Sunday" %}  input_text.domenica_induzione_cicli
            {% endif %}
        data:
          value: "{{ states('sensor.induzione_cicli_oggi') }}"

      - service: input_text.set_value
        target:
          entity_id: >
            {% set today = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][now().weekday()] %}
            {% if today == "Monday" %}    input_text.lunedi_induzione_tempo
            {% elif today == "Tuesday" %} input_text.martedi_induzione_tempo
            {% elif today == "Wednesday" %} input_text.mercoledi_induzione_tempo
            {% elif today == "Thursday" %} input_text.giovedi_induzione_tempo
            {% elif today == "Friday" %}  input_text.venerdi_induzione_tempo
            {% elif today == "Saturday" %} input_text.sabato_induzione_tempo
            {% elif today == "Sunday" %}  input_text.domenica_induzione_tempo
            {% endif %}
        data:
          value: "{{ state_attr('sensor.time_on_induzione','Oggi') }}"

      - service: input_number.set_value
        target:
          entity_id: >
            {% set today = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][now().weekday()] %}
            {% if today == "Monday" %}    input_number.lunedi_induzione_consumo
            {% elif today == "Tuesday" %} input_number.martedi_induzione_consumo
            {% elif today == "Wednesday" %} input_number.mercoledi_induzione_consumo
            {% elif today == "Thursday" %} input_number.giovedi_induzione_consumo
            {% elif today == "Friday" %}  input_number.venerdi_induzione_consumo
            {% elif today == "Saturday" %} input_number.sabato_induzione_consumo
            {% elif today == "Sunday" %}  input_number.domenica_induzione_consumo
            {% endif %}
        data:
          value: "{{ states('sensor.induzione_energy_oggi') }}"

      - service: input_number.set_value
        target:
          entity_id: >
            {% set today = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][now().weekday()] %}
            {% if today == "Monday" %}    input_number.lunedi_induzione_costo
            {% elif today == "Tuesday" %} input_number.martedi_induzione_costo
            {% elif today == "Wednesday" %} input_number.mercoledi_induzione_costo
            {% elif today == "Thursday" %} input_number.giovedi_induzione_costo
            {% elif today == "Friday" %}  input_number.venerdi_induzione_costo
            {% elif today == "Saturday" %} input_number.sabato_induzione_costo
            {% elif today == "Sunday" %}  input_number.domenica_induzione_costo
            {% endif %}
        data:
          value: "{{ state_attr('sensor.time_on_induzione','costo_oggi_induzione') }}"

  - choose:
    - alias: SWITCH OFF
      conditions:
      - condition: trigger
        id: switch_off
      sequence:
      - service: switch.turn_off
        target:
          entity_id: *switch_induzione
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.induzione_switch

  - choose:
    - alias: SWITCH ON
      conditions:
      - condition: trigger
        id: switch_on
      sequence:
      - service: switch.turn_on
        target:
          entity_id: *switch_induzione
      - service: input_boolean.turn_on
        target:
          entity_id: input_boolean.induzione_switch

  - choose:
    - conditions:
      - condition: trigger
        id: controllo_ciclo
      sequence:
      - delay: '00:01:00'
      - entity_id: input_boolean.induzione_ciclo_attivo
        service: input_boolean.turn_off

  - choose:
    - conditions:
      - condition: trigger
        id: inizio_ciclo
      sequence:
      - entity_id: input_boolean.induzione_ciclo_attivo
        service: input_boolean.turn_on

  - choose:
    - conditions:
      - condition: trigger
        id: fine_ciclo
      sequence:

      - service: input_text.set_value
        target:
          entity_id: input_text.induzione_ultimo_ciclo
        data:
          value: "{{ state_attr('sensor.time_on_induzione','tempo_ciclo_induzione') }}"

      - service: counter.increment
        target:
          entity_id: counter.induzione_cicli_totale

      - delay: '00:00:05'

      - entity_id: input_boolean.induzione_ciclo_attivo
        service: input_boolean.turn_off

  - parallel:
    - choose:
      - conditions:
        - condition: trigger
          id: fine_ciclo
        - condition: time
          after: 'input_datetime.induzione_notifiche_inizio'
          before: 'input_datetime.induzione_notifiche_fine'
        - condition: state
          entity_id: input_boolean.induzione_notify_google
          state: 'on'
        sequence:
        - service: tts.google_translate_say
          continue_on_error: true
          data:
            entity_id: *google
            message: "{{ states('input_text.induzione_messaggio') }} in {{ state_attr('sensor.time_on_induzione','tempo_ciclo_induzione') }}"

    - choose:
      - conditions:
        - condition: trigger
          id: fine_ciclo
        - condition: time
          after: 'input_datetime.induzione_notifiche_inizio'
          before: 'input_datetime.induzione_notifiche_fine'
        - condition: state
          entity_id: input_boolean.induzione_notify_alexa
          state: 'on'
        sequence:
        - service: notify.alexa_media
          continue_on_error: true
          data:
            target: *alexa
            data:
              type: announce
              method: spoken
            message: "{{ states('input_text.induzione_messaggio') }} in {{ state_attr('sensor.time_on_induzione','tempo_ciclo_induzione') }}"

    - choose:
      - conditions:
        - condition: trigger
          id: fine_ciclo
        - condition: state
          entity_id: input_boolean.induzione_notify_push
          state: 'on'
        sequence:
        - data_template:
            message: >-
              🍳 {{ states('input_text.induzione_nome') }}

              ⏱ Ciclo durato: {{ state_attr('sensor.time_on_induzione','tempo_ciclo_induzione') }}

              ⚡ Consumati: {{ state_attr('sensor.time_on_induzione','consumo_ciclo_induzione') }}

              💰 Spesi: {{ state_attr('sensor.time_on_induzione','costo_ciclo_induzione') }} €
            title: "Induzione"
          service: notify.induzione
          continue_on_error: true

- alias: induzione_off_automatico
  id: induzione_off_automatico
  trigger:
    - platform: time
      at: 'input_datetime.induzione_off'
      id: induzione_automatico_off
  condition: []
  action:
    - choose:
      - conditions:
        - condition: trigger
          id: induzione_automatico_off
        - condition: state
          entity_id: *switch_induzione
          state: 'on'
        sequence:
        - entity_id: *switch_induzione
          service: switch.turn_off`;

  /* ── PKG BUILD ── */
  var _IND_WIZ_KEY = 'frarik_pkg_wizard_induzione';

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
      .split('IL_TUO_SENSORE_POTENZA_INDUZIONE').join(potenza || 'sensor.non_configurato')
      .split('IL_TUO_SWITCH_INDUZIONE').join(sw || 'switch.non_configurato');
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
    try { saved = JSON.parse(localStorage.getItem(_IND_WIZ_KEY) || 'null'); } catch(e) {}
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
        + '.wd-panel{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#080f18;border:1px solid rgba(56,189,248,.3);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:indUp .22s cubic-bezier(.32,1.12,.56,1)}'
        + '@keyframes indUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'
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
        + '<div class="wd-hdr"><div class="wd-ico">🍳</div>'
        + '<div><div class="wd-tit">Installa PKG Induzione</div><div class="wd-sub">frarik_induzione.yaml → config/packages/</div></div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'

        /* ── Sensori ── */
        + '<div><div class="wd-sec">Sensori</div>'
        + '<div class="wd-lbl">Sensore Potenza (W)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-potenza" type="text" autocomplete="off" placeholder="sensor.presa_induzione_potenza" value="' + ((saved && saved.potenza) || '').replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-potenza"></div></div>'
        + '<div class="wd-lbl">Switch Presa Induzione</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-switch" type="text" autocomplete="off" placeholder="switch.presa_induzione" value="' + ((saved && saved.sw) || '').replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-switch"></div></div>'
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
      sr.querySelectorAll('.google-inp').forEach(function(inp) { setupAC(inp, inp.parentElement.querySelector('.wd-drop'), mediaIds); });
      sr.querySelectorAll('.alexa-inp').forEach(function(inp)  { setupAC(inp, inp.parentElement.querySelector('.wd-drop'), mediaIds); });

      sr.getElementById('wd-install').addEventListener('click', function() {
        var potenza = sr.getElementById('f-potenza').value.trim();
        var sw      = sr.getElementById('f-switch').value.trim();
        var push    = Array.from(sr.querySelectorAll('.push-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        var google  = Array.from(sr.querySelectorAll('.google-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        var alexa   = Array.from(sr.querySelectorAll('.alexa-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        try { localStorage.setItem(_IND_WIZ_KEY, JSON.stringify({potenza: potenza, sw: sw, push: push, google: google, alexa: alexa})); } catch(e) {}
        var yaml = _buildPkg(potenza, sw, push, google, alexa);
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading');
        btn.textContent = 'Installazione…';
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_induzione.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Induzione installato! Riavvia HA.'); } catch(e) {}
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
    id: 'induzione', name: 'Induzione', icon: '🍳', version: '1.1',
    desc: 'Monitoraggio piano induzione, cicli, energia e costi. Richiede PKG Centro Controllo Induzione.',
    render: render, mount: mount, update: update, configure: openCfg,
    frarik_pkg_check: 'sensor.frarik_induzione_versione',
    frarik_pkg_id: 'frarik_induzione',
    frarik_pkg_version: '1.0',
    openWizard: _openWizard,
    _buildPkgFromConfig: function(cfg) { return _buildPkg(cfg.potenza || '', cfg.sw || '', cfg.push || [], cfg.google || [], cfg.alexa || []); },
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: induzione v' + CARD.version); } catch (e) {}
})();
