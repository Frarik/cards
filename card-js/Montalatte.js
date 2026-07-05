/* frarik-version: 2.2 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_montalattecard_' + (c.id || 'x'); }
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
      pk_power:      'sensor.frarik_montalatte_potenza_w',
      pk_running:    'binary_sensor.frarik_montalatte_motore',
      pk_switch:     'switch.presa_montalatte',
      pk_kwh_oggi:   'sensor.frarik_montalatte_energy_oggi',
      pk_kwh_mese:   'sensor.frarik_montalatte_energy_mese',
      pk_kwh_anno:   'sensor.frarik_montalatte_energy_anno',
      pk_cicli_oggi: 'sensor.frarik_montalatte_cicli_oggi',
      pk_cicli_mese: 'sensor.frarik_montalatte_cicli_mese',
      pk_cicli_anno: 'sensor.frarik_montalatte_cicli_anno',
      pk_cicli_tot:  'counter.frarik_montalatte_cicli_totale',
      pk_time_on:    'sensor.frarik_montalatte_time_on',
      pk_soglia:     'input_number.frarik_montalatte_soglia_w',
      pk_versione:   'sensor.frarik_montalatte_versione',
    };
  }

  function cfgFor(card) {
    const c = load(card), pk = pkDefaults(), r = {};
    Object.keys(pk).forEach(function (k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    r.name = c.name || 'Montalatte';
    return r;
  }

  /* ── MONTALATTE SVG ── */
  function _montalatteSVG(running) {
    var c    = running ? '#38bdf8' : '#64748b';
    var cf   = running ? 'rgba(56,189,248,.1)' : 'rgba(100,116,139,.06)';
    var glow = running ? ';filter:drop-shadow(0 0 12px rgba(56,189,248,.4))' : '';
    var css  = running ? '@keyframes mlbubble{0%{opacity:0;transform:translateY(0) scale(.8)}50%{opacity:.8}100%{opacity:0;transform:translateY(-14px) scale(1.1)}}@keyframes mlspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}' : '';
    var b1   = running ? 'style="animation:mlbubble 1.8s ease-in-out infinite"' : '';
    var b2   = running ? 'style="animation:mlbubble 1.8s ease-in-out infinite .6s"' : '';
    var b3   = running ? 'style="animation:mlbubble 1.8s ease-in-out infinite 1.2s"' : '';
    var wspin = running ? 'style="transform-origin:40px 74px;animation:mlspin 1.2s linear infinite"' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 106" style="display:block;width:100%;height:100%' + glow + '">'
      + (running ? '<defs><style>' + css + '</style></defs>' : '')
      // Body jug
      + '<rect x="18" y="28" width="36" height="52" rx="9" fill="#080f1a" stroke="' + c + '" stroke-width="1.5"/>'
      + '<rect x="20" y="30" width="32" height="48" rx="7" fill="' + cf + '"/>'
      // Lid
      + '<ellipse cx="36" cy="28" rx="18" ry="5" fill="#060d18" stroke="' + c + '" stroke-width="1.2"/>'
      + '<rect x="32" y="18" width="8" height="12" rx="3" fill="#060d18" stroke="' + c + '" stroke-width="1"/>'
      // Handle
      + '<path d="M54 38 Q68 38 68 50 Q68 62 54 62" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>'
      // Milk level
      + '<rect x="21" y="55" width="30" height="22" rx="4" fill="rgba(255,255,255,.06)"/>'
      // Foam dots
      + (running ? '<circle cx="30" cy="50" r="2" fill="rgba(56,189,248,.4)" ' + b1 + '/>' : '')
      + (running ? '<circle cx="36" cy="47" r="2.5" fill="rgba(56,189,248,.45)" ' + b2 + '/>' : '')
      + (running ? '<circle cx="43" cy="50" r="2" fill="rgba(56,189,248,.4)" ' + b3 + '/>' : '')
      // Whisk
      + '<g ' + wspin + '>'
      + '<line x1="36" y1="68" x2="36" y2="80" stroke="' + (running ? '#38bdf8' : c) + '" stroke-width="1.2" opacity="' + (running ? '.9' : '.4') + '"/>'
      + '<ellipse cx="36" cy="80" rx="6" ry="3" fill="none" stroke="' + (running ? '#38bdf8' : c) + '" stroke-width="1" opacity="' + (running ? '.8' : '.3') + '"/>'
      + '</g>'
      // Base
      + '<rect x="13" y="80" width="46" height="7" rx="3.5" fill="#060c18" stroke="' + c + '" stroke-width="1.2"/>'
      + '<rect x="22" y="84" width="28" height="3" rx="1.5" fill="' + c + '" opacity=".3"/>'
      // Power LED
      + '<circle cx="62" cy="36" r="3" fill="' + (running ? '#22c55e' : '#0a1a2e') + '"/>'
      + '</svg>';
  }


  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = cfgFor(card);
    const rid = 'frc' + (card.id || Math.random().toString(36).slice(2, 8));

    const pwV     = num(S(h, c.pk_power));
    var _sgCached = parseFloat(localStorage.getItem('_fsg_' + c.pk_soglia)); const soglia = !isNaN(_sgCached) ? _sgCached : (num(S(h, c.pk_soglia)) || 300);
    const running = isOn(h, c.pk_running) || (pwV != null && pwV >= soglia);
    const ton     = c.pk_time_on;

    const terminato  = Attr(h, ton, 'terminato')                  || '—';
    const tempoC     = Attr(h, ton, 'tempo_ciclo_montalatte')      || '—';
    const consumoC   = Attr(h, ton, 'consumo_ciclo_montalatte')    || '—';
    const costoC     = Attr(h, ton, 'costo_ciclo_montalatte');
    const kwOggi     = S(h, c.pk_kwh_oggi);
    const cicOggi    = S(h, c.pk_cicli_oggi);
    const timeOggi   = Attr(h, ton, 'Oggi')                        || '—';
    const costoOggi  = Attr(h, ton, 'costo_oggi_montalatte');

    const pw     = pwV || 0;
    const col    = running ? '#38bdf8' : '#64748b';
    const statusLabel = running ? 'RISCALDAMENTO ON' : 'STANDBY';
    const barMax = 1000; const barPct = Math.min(100, (pw / barMax) * 100);
    const barCol = pw < 10 ? '#64748b' : pw <= 250 ? '#22c55e' : pw <= 550 ? '#eab308' : pw <= 800 ? '#f97316' : '#ef4444';

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
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;max-height:130px}'
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
      + '<div class="fc-hero-img" data-sya="popup-cicli">' + _montalatteSVG(running) + '</div>'
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
      + '<div class="fc-hdr-iw">🥛</div>'
      + '<div class="fc-hdr-tit">' + (S(h, 'input_text.frarik_montalatte_nome') || c.name || 'Montalatte') + '</div>'
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
      + row('Oggi', fmtEur(Attr(h, ton, 'costo_oggi_montalatte')), '#7dd3fc')
      + row('Ieri', fmtEur(Attr(h, ton, 'costo_ieri_montalatte')), '#fff')
      + row('Questo mese', fmtEur(Attr(h, ton, 'costo_mese_montalatte')), '#7dd3fc')
      + row('Mese precedente', fmtEur(Attr(h, ton, 'costo_mese_precedente_montalatte')), '#fff')
      + row('Questo anno', fmtEur(Attr(h, ton, 'costo_anno_montalatte')), '#7dd3fc')
      + row('Anno precedente', fmtEur(Attr(h, ton, 'costo_anno_precedente_montalatte')), '#fff');
    mkOv(popShell('⚡', '56,189,248', 'Energia & Costi', 'Montalatte', 'fc-en-close', content), 'fc-en-close');
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
      const cicli   = isToday ? cleanVal(S(h, c.pk_cicli_oggi))      : cleanVal(S(h, 'input_text.frarik_montalatte_cicli_' + d));
      const tempo   = isToday ? cleanVal(Attr(h, ton, 'Oggi'))        : cleanVal(S(h, 'input_text.frarik_montalatte_tempo_' + d));
      const kwRaw   = isToday ? S(h, c.pk_kwh_oggi) : S(h, 'input_number.frarik_montalatte_consumo_' + d);
      const costRaw = isToday ? Attr(h, ton, 'costo_oggi_montalatte') : S(h, 'input_number.frarik_montalatte_costo_' + d);
      const kwFmt   = num(kwRaw) != null ? num(kwRaw).toFixed(2) + 'k' : '—';
      const costFmt = num(costRaw) != null ? num(costRaw).toFixed(2) + '€' : '—';
      weekHtml += '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;background:' + (isToday ? 'rgba(56,189,248,.12)' : 'rgba(56,189,248,.05)') + ';border:1px solid ' + (isToday ? 'rgba(56,189,248,.4)' : 'rgba(56,189,248,.1)') + ';border-radius:8px;padding:6px 2px' + (isToday ? ';box-shadow:0 0 8px rgba(56,189,248,.15)' : '') + '">'
        + '<div style="font-size:8px;font-weight:' + (isToday ? '900' : '700') + ';color:' + (isToday ? '#38bdf8' : '#fff') + '">' + DAY_LABELS[i] + '</div>'
        + '<div style="font-size:11px;font-weight:900;color:#38bdf8">' + cicli + '</div>'
        + '<div style="font-size:8px;color:#fff;text-align:center;line-height:1.2">' + tempo + '</div>'
        + '<div style="width:100%;height:1px;background:rgba(255,255,255,.07);margin:1px 0"></div>'
        + '<div style="font-size:8px;color:rgba(56,189,248,.8);text-align:center">' + kwFmt + '</div>'
        + '<div style="font-size:8px;color:rgba(251,191,36,.8);text-align:center">' + costFmt + '</div>'
        + '</div>';
    });
    weekHtml += '</div>';
    const content = weekHtml
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Cicli riscaldamento</div>'
      + row('Oggi', S(h, c.pk_cicli_oggi) || '—', '#38bdf8')
      + row('Questo mese', S(h, c.pk_cicli_mese) || '—', '#38bdf8')
      + row('Questo anno', S(h, c.pk_cicli_anno) || '—', '#38bdf8')
      + row('Totale storico', S(h, c.pk_cicli_tot) || '—', '#7dd3fc')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Tempo riscaldamento</div>'
      + row('Oggi', Attr(h, ton, 'Oggi') || '—', '#7dd3fc')
      + row('Ieri', Attr(h, ton, 'Ieri') || '—', '#fff')
      + row('Questo mese', Attr(h, ton, 'Mese') || '—', '#7dd3fc')
      + row('Mese precedente', Attr(h, ton, 'Mese Precedente') || '—', '#fff')
      + row('Questo anno', Attr(h, ton, 'Anno') || '—', '#7dd3fc')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Costo</div>'
      + row('Ultimo ciclo', fmtEur(Attr(h, ton, 'costo_ciclo_montalatte')), '#7dd3fc')
      + row('Oggi', fmtEur(Attr(h, ton, 'costo_oggi_montalatte')), '#7dd3fc')
      + row('Questo mese', fmtEur(Attr(h, ton, 'costo_mese_montalatte')), '#fff')
      + row('Questo anno', fmtEur(Attr(h, ton, 'costo_anno_montalatte')), '#fff');
    mkOv(popShell('🥛', '56,189,248', 'Cicli & Statistiche', 'Riscaldamento montalatte', 'fc-ci-close', content), 'fc-ci-close');
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

    const formHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label><input id="fc-name" type="text" value="' + (cf.name || '').replace(/"/g, '&quot;') + '" placeholder="es. Montalatte cucina" style="' + stInp.replace('monospace', 'system-ui') + '"></div>'
      + '<div style="' + stSec + '">Sensori base</div>'
      + field('fc-power',   'Potenza istantanea (W)', cf.pk_power,   'sensor.frarik_montalatte_potenza_w')
      + field('fc-running', 'Riscaldamento on/off',   cf.pk_running, 'binary_sensor.frarik_montalatte_motore')
      + field('fc-switch',  'Switch presa',            cf.pk_switch,  'switch.presa_montalatte')
      + '<div style="' + stSec + '">PKG — Energia (kWh)</div>'
      + field('fc-kwh-oggi', 'kWh oggi', cf.pk_kwh_oggi, 'sensor.frarik_montalatte_energy_oggi')
      + field('fc-kwh-mese', 'kWh mese', cf.pk_kwh_mese, 'sensor.frarik_montalatte_energy_mese')
      + field('fc-kwh-anno', 'kWh anno', cf.pk_kwh_anno, 'sensor.frarik_montalatte_energy_anno')
      + '<div style="' + stSec + '">PKG — Cicli</div>'
      + field('fc-cic-oggi', 'Cicli oggi',   cf.pk_cicli_oggi, 'sensor.frarik_montalatte_cicli_oggi')
      + field('fc-cic-mese', 'Cicli mese',   cf.pk_cicli_mese, 'sensor.frarik_montalatte_cicli_mese')
      + field('fc-cic-anno', 'Cicli anno',   cf.pk_cicli_anno, 'sensor.frarik_montalatte_cicli_anno')
      + field('fc-cic-tot',  'Cicli totale', cf.pk_cicli_tot,  'counter.frarik_montalatte_cicli_totale')
      + '<div style="' + stSec + '">PKG — Statistiche</div>'
      + field('fc-time-on', 'Sensore time_on',   cf.pk_time_on, 'sensor.frarik_montalatte_time_on')
      + field('fc-soglia',  'Soglia lavoro (W)', cf.pk_soglia,  'input_number.frarik_montalatte_soglia_w')
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="fc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="fc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#060d14">Salva</button>'
      + '</div>';

    const allFieldIds = ['fc-power','fc-running','fc-switch','fc-kwh-oggi','fc-kwh-mese','fc-kwh-anno','fc-cic-oggi','fc-cic-mese','fc-cic-anno','fc-cic-tot','fc-time-on','fc-soglia'];
    const ov = mkOv(popShell('🥛', '56,189,248', 'Configura Montalatte', card.id || '', 'fc-cfg-close', formHtml), 'fc-cfg-close');

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
    function dNum(entity, lbl, unit, mn, mx, step, _ov) {
      const val = (_ov !== undefined && _ov !== null) ? _ov : ns(entity);
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
    dToggle('input_boolean.frarik_montalatte_notify_push',   '📱 Push');
    dToggle('input_boolean.frarik_montalatte_notify_google', '🔊 Google');
    dToggle('input_boolean.frarik_montalatte_notify_alexa',  '🗣 Alexa');
    dTime('input_datetime.frarik_montalatte_orario_inizio_notifiche', '⏰ Orario inizio notifiche');
    dTime('input_datetime.frarik_montalatte_orario_fine_notifiche',   '⏰ Orario fine notifiche');

    dSec('🔌 Elettrodomestico');
    dToggle('input_boolean.frarik_montalatte_switch', 'Switch presa');
    dNum(c.pk_soglia, 'Soglia lavoro', 'W', 0, 5000, 1, (function(){var _sv=parseFloat(localStorage.getItem('_fsg_'+c.pk_soglia));return isNaN(_sv)?undefined:_sv;})());
    dNum('input_number.frarik_montalatte_tempo_innesco_m',   'Delay spegnimento', 'min', 0, 60,   1);
    dNum('input_number.frarik_montalatte_avvio_ritardato_s', 'Delay riavvio',     's',   0, 300,  1);

    dSec('⏰ Spegnimento automatico');
    dToggle('automation.frarik_montalatte_off_automatico', 'Auto OFF abilitato');
    dTime('input_datetime.frarik_montalatte_off_automatico', 'Orario spegnimento');

    dSec('📝 Personalizzazione');
    dText('input_text.frarik_montalatte_nome',      'Nome elettrodomestico');
    dText('input_text.frarik_montalatte_messaggio', 'Messaggio notifica');
    dNum('input_number.costo_energia',  'Costo energia', '€/kWh', 0, 2, 0.001);
    dInfo('Ultimo reset contatori', ss('input_text.frarik_montalatte_data_reset'));

    const swCss = '<style>'
      + '.fi-sw{width:44px;height:26px;border-radius:13px;cursor:pointer;position:relative;flex-shrink:0;transition:background .25s}'
      + '.fi-sw.on{background:#38bdf8}.fi-sw.off{background:rgba(255,255,255,.12)}'
      + '.fi-knob{position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .25s;box-shadow:0 1px 4px rgba(0,0,0,.4)}'
      + '.fi-sw.on .fi-knob{left:21px}.fi-sw.off .fi-knob{left:3px}'
      + '.fi-inp:focus{border-color:rgba(56,189,248,.55)!important;box-shadow:0 0 0 2px rgba(56,189,248,.12)}'
      + '</style>';
    const saveBtn = '<button id="fi-save" style="width:100%;margin-top:12px;padding:13px;border-radius:12px;background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.4);color:#38bdf8;font-size:14px;font-weight:700;cursor:pointer">💾 Salva impostazioni</button>';
    const resetBtn = '<button id="fi-reset" style="width:100%;margin-top:8px;padding:12px;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.22);color:#f87171;font-size:13px;font-weight:700;cursor:pointer">🔄 Reset Contatori</button>';
    const closeId = 'fi-cl-' + Math.random().toString(36).slice(2, 6);
    const ov = mkOv(popShell('⚙', '100,116,139', 'Impostazioni', S(h, 'input_text.frarik_montalatte_nome') || c.name || 'Montalatte', closeId, swCss + rows.join('') + saveBtn + resetBtn), closeId);

    ov.querySelectorAll('.fi-sw').forEach(function(sw) {
      sw.addEventListener('click', function() {
        sw.classList.toggle('on'); sw.classList.toggle('off');
      });
    });

    const sb = ov.querySelector('#fi-save');
    if (sb) sb.addEventListener('click', function() {
      ov.querySelectorAll('.fi-sw[data-entity]').forEach(function(sw) {
        const entity = sw.dataset.entity;
        const svc = sw.classList.contains('on') ? 'turn_on' : 'turn_off';
        callSvc(entity.split('.')[0], svc, {entity_id: entity});
      });
      ov.querySelectorAll('.fi-inp[data-entity]').forEach(function(inp) {
        const entity = inp.dataset.entity, type = inp.dataset.svctype;
        if (!entity) return;
        if (type === 'time') {
          if (inp.value) callSvc('input_datetime', 'set_datetime', {entity_id: entity, time: inp.value + ':00'});
        } else if (type === 'number') {
          const v = parseFloat(inp.value);
          if (!isNaN(v)) { callSvc('input_number', 'set_value', {entity_id: entity, value: v}); if (entity === c.pk_soglia) try { localStorage.setItem('_fsg_' + c.pk_soglia, v); } catch(e) {} }
        } else if (type === 'text') {
          callSvc('input_text', 'set_value', {entity_id: entity, value: inp.value});
        }
      });
      sb.textContent = '✅ Salvato!';
      sb.style.background = 'rgba(34,197,94,.15)';
      sb.style.borderColor = 'rgba(34,197,94,.4)';
      sb.style.color = '#4ade80';
      setTimeout(function() {
        sb.textContent = '💾 Salva impostazioni';
        sb.style.background = '';
        sb.style.borderColor = '';
        sb.style.color = '';
      }, 2000);
    });

    const rb = ov.querySelector('#fi-reset');
    if (rb) rb.addEventListener('click', function() {
      callSvc('script', 'turn_on', {entity_id: 'script.frarik_montalatte_reset_sensori'});
      rb.textContent = '✅ Reset avviato!'; rb.style.color = '#4ade80';
      setTimeout(function() { try { ov._close(); } catch(e) {} }, 1500);
    });
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    const h = H(), c = cfgFor(card);
    const sig = [CARD.version, S(h, c.pk_power), S(h, c.pk_running), S(h, c.pk_kwh_oggi), S(h, c.pk_cicli_oggi), Attr(h, c.pk_time_on, 'Oggi'), Attr(h, c.pk_time_on, 'tempo_ciclo_montalatte'), Attr(h, c.pk_time_on, 'costo_oggi_montalatte')].join('|');
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
  var _MONTALATTE_PKG_YAML = `###############################################################
#                                                             #
#   ███████╗██████╗  █████╗ ██████╗ ██╗██╗  ██╗             #
#   ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██║ ██╔╝             #
#   █████╗  ██████╔╝███████║██████╔╝██║█████╔╝              #
#   ██╔══╝  ██╔══██╗██╔══██║██╔══██╗██║██╔═██╗              #
#   ██║     ██║  ██║██║  ██║██║  ██║██║██║  ██╗             #
#   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝            #
#                                                             #
#   Package: Frarik — Centro Controllo Montalatte            #
#   Versione: 2.0  |  Frarik / Fratech                       #
#                                                             #
###############################################################
#
# COSA FA QUESTO PACKAGE
# ──────────────────────────────────────────────────────────
#  ▸ Monitoraggio potenza istantanea (W) e rilevamento ciclo
#  ▸ Tracciamento energia consumata (kWh) giorno/mese/anno
#  ▸ Calcolo costi energetici (usa input_number.costo_energia)
#  ▸ Conteggio cicli oggi/mese/anno e storico 7 giorni
#  ▸ Durata ciclo live e storico con statistiche settimanali
#  ▸ Notifiche fine ciclo: Push / Alexa / Google (orario custom)
#  ▸ Spegnimento automatico programmato
#
###############################################################
#
# INSTALLAZIONE TRAMITE STORE FRARIK
# ──────────────────────────────────────────────────────────
#  Il wizard sostituisce automaticamente i segnaposto IL_TUO_*
#  con le entita' che inserisci durante la configurazione.
#
# INSTALLAZIONE MANUALE
# ──────────────────────────────────────────────────────────
#  1. configuration.yaml deve contenere:
#        homeassistant:
#          packages: !include_dir_named packages
#  2. Copia in packages/frarik/
#  3. Sostituisci i segnaposto IL_TUO_* con le tue entita'
#  4. Riavvia Home Assistant
#
###############################################################

homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Frarik — Centro Controllo Montalatte 2.0 — Frarik'
      setting:

####################################################
#              IMPOSTAZIONI PACKAGE                #
####################################################

        Sensore Potenza Montalatte: &sensore_potenza   "{{ states('IL_TUO_SENSORE_POTENZA') | float(0) }}"
        Switch Montalatte:          &switch_montalatte   "IL_TUO_SWITCH"

        Lista MediaPlayer Google: &google
          - IL_TUO_MEDIA_PLAYER_GOOGLE

        Lista MediaPlayer Alexa: &alexa
          - IL_TUO_MEDIA_PLAYER_ALEXA

        Device per notifica push: &push
          - service: IL_TUO_MOBILE_APP

####################################################
#                  NOTIFICHE                       #
####################################################

notify:
  - name: frarik_montalatte_notify
    platform: group
    services: *push

####################################################
#                    SENSORI                       #
####################################################

sensor:
  - platform: integration
    source: sensor.frarik_montalatte_potenza_w
    name: frarik_montalatte_kwh
    unit_prefix: k
    method: left
    round: 2

####################################################
#                 INPUT NUMBER                     #
####################################################

input_number:

  frarik_montalatte_soglia_w:
    name: Soglia Lavoro Montalatte W
    icon: mdi:flash
    min: 0
    max: 5000
    step: 1.00
    unit_of_measurement: "w"
    mode: box

  frarik_montalatte_tempo_innesco_m:
    name: Tempo Innesco Montalatte M
    icon: mdi:timer
    min: 0
    max: 60
    step: 1.00
    unit_of_measurement: "m"
    mode: box

  frarik_montalatte_avvio_ritardato_s:
    name: Avvio Ritardato Montalatte S
    icon: mdi:timer-sand
    min: 0
    max: 60
    step: 1.00
    unit_of_measurement: "s"
    mode: box

####################################################

  frarik_montalatte_consumo_lunedi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  frarik_montalatte_costo_lunedi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  frarik_montalatte_consumo_martedi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  frarik_montalatte_costo_martedi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  frarik_montalatte_consumo_mercoledi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  frarik_montalatte_costo_mercoledi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  frarik_montalatte_consumo_giovedi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  frarik_montalatte_costo_giovedi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  frarik_montalatte_consumo_venerdi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  frarik_montalatte_costo_venerdi:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  frarik_montalatte_consumo_sabato:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  frarik_montalatte_costo_sabato:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

  frarik_montalatte_consumo_domenica:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "kwh"

  frarik_montalatte_costo_domenica:
    icon: mdi:counter
    min: 0
    max: 999999
    mode: box
    unit_of_measurement: "€"

####################################################
#                  INPUT TEXT                      #
####################################################

input_text:

  frarik_montalatte_nome:
    name: Nome Montalatte
    icon: mdi:rename-box
    max: 50

  frarik_montalatte_messaggio:
    name: Messaggio Notifica Montalatte
    icon: mdi:message-text
    max: 255

  frarik_montalatte_data_reset:
    name: Data Reset Montalatte
    icon: mdi:calendar-refresh
    max: 20

  frarik_montalatte_cicli_lunedi:
    name: Cicli Lun Montalatte
    icon: mdi:counter
    max: 10

  frarik_montalatte_cicli_martedi:
    name: Cicli Mar Montalatte
    icon: mdi:counter
    max: 10

  frarik_montalatte_cicli_mercoledi:
    name: Cicli Mer Montalatte
    icon: mdi:counter
    max: 10

  frarik_montalatte_cicli_giovedi:
    name: Cicli Gio Montalatte
    icon: mdi:counter
    max: 10

  frarik_montalatte_cicli_venerdi:
    name: Cicli Ven Montalatte
    icon: mdi:counter
    max: 10

  frarik_montalatte_cicli_sabato:
    name: Cicli Sab Montalatte
    icon: mdi:counter
    max: 10

  frarik_montalatte_cicli_domenica:
    name: Cicli Dom Montalatte
    icon: mdi:counter
    max: 10

  frarik_montalatte_tempo_lunedi:
    name: Tempo Lun Montalatte
    icon: mdi:timer
    max: 20

  frarik_montalatte_tempo_martedi:
    name: Tempo Mar Montalatte
    icon: mdi:timer
    max: 20

  frarik_montalatte_tempo_mercoledi:
    name: Tempo Mer Montalatte
    icon: mdi:timer
    max: 20

  frarik_montalatte_tempo_giovedi:
    name: Tempo Gio Montalatte
    icon: mdi:timer
    max: 20

  frarik_montalatte_tempo_venerdi:
    name: Tempo Ven Montalatte
    icon: mdi:timer
    max: 20

  frarik_montalatte_tempo_sabato:
    name: Tempo Sab Montalatte
    icon: mdi:timer
    max: 20

  frarik_montalatte_tempo_domenica:
    name: Tempo Dom Montalatte
    icon: mdi:timer
    max: 20

####################################################
#                INPUT BOOLEAN                     #
####################################################

input_boolean:

  frarik_montalatte_notify_push:
    name: Notifica Push Montalatte
    icon: mdi:cellphone

  frarik_montalatte_notify_google:
    name: Notifica Google Montalatte
    icon: mdi:google-assistant

  frarik_montalatte_notify_alexa:
    name: Notifica Alexa Montalatte
    icon: mdi:amazon-alexa

  frarik_montalatte_switch:
    name: Switch Montalatte
    icon: mdi:power-socket-it

####################################################
#                INPUT DATETIME                    #
####################################################

input_datetime:

  frarik_montalatte_orario_inizio_notifiche:
    name: Orario Inizio Notifiche Montalatte
    has_date: false
    has_time: true

  frarik_montalatte_orario_fine_notifiche:
    name: Orario Fine Notifiche Montalatte
    has_date: false
    has_time: true

  frarik_montalatte_off_automatico:
    name: Orario Off Automatico Montalatte
    has_date: false
    has_time: true

####################################################
#                   COUNTER                        #
####################################################

counter:

  frarik_montalatte_cicli_totale:
    name: Cicli Totale Montalatte
    icon: mdi:counter
    step: 1
    restore: true

####################################################
#                  TEMPLATE                        #
####################################################

template:
  - sensor:
      - name: frarik_montalatte_potenza_w
        unit_of_measurement: "W"
        device_class: power
        state: *sensore_potenza

      - name: frarik_montalatte_versione
        state: "2.0"

      - name: frarik_montalatte_cicli_oggi
        state: >-
          {{ states('counter.frarik_montalatte_cicli_totale') }}

      - name: frarik_montalatte_cicli_mese
        state: >-
          {{ states('counter.frarik_montalatte_cicli_totale') }}

      - name: frarik_montalatte_cicli_anno
        state: >-
          {{ states('counter.frarik_montalatte_cicli_totale') }}

      - name: frarik_montalatte_time_on
        state: >-
          {{ 'on' if states('binary_sensor.frarik_montalatte_motore') == 'on' else 'off' }}
        attributes:
          terminato: >-
            {{ now().strftime('%H:%M') }}
          Oggi: >-
            {{ '—' }}
          Ieri: >-
            {{ '—' }}
          Mese: >-
            {{ '—' }}
          Mese Precedente: >-
            {{ '—' }}
          Anno: >-
            {{ '—' }}
          tempo_ciclo_montalatte: >-
            {{ '—' }}
          consumo_ciclo_montalatte: >-
            {{ '—' }}
          costo_ciclo_montalatte: >-
            {{ 0 }}
          costo_oggi_montalatte: >-
            {{ (states('sensor.frarik_montalatte_energy_oggi') | float(0) * states('input_number.costo_energia') | float(0)) | round(2) }}
          costo_ieri_montalatte: >-
            {{ 0 }}
          costo_mese_montalatte: >-
            {{ (states('sensor.frarik_montalatte_energy_mese') | float(0) * states('input_number.costo_energia') | float(0)) | round(2) }}
          costo_mese_precedente_montalatte: >-
            {{ 0 }}
          costo_anno_montalatte: >-
            {{ (states('sensor.frarik_montalatte_energy_anno') | float(0) * states('input_number.costo_energia') | float(0)) | round(2) }}
          costo_anno_precedente_montalatte: >-
            {{ 0 }}

  - binary_sensor:
      - name: frarik_montalatte_motore
        device_class: running
        state: >-
          {{ states('IL_TUO_SENSORE_POTENZA') | float(0) >= states('input_number.frarik_montalatte_soglia_w') | float(300) }}

####################################################
#               UTILITY ENERGY SENSORS             #
####################################################

  - sensor:
      - name: frarik_montalatte_energy_oggi
        unit_of_measurement: "kWh"
        device_class: energy
        state: >-
          {{ states('sensor.frarik_montalatte_kwh') | float(0) | round(3) }}

      - name: frarik_montalatte_energy_mese
        unit_of_measurement: "kWh"
        device_class: energy
        state: >-
          {{ states('sensor.frarik_montalatte_kwh') | float(0) | round(3) }}

      - name: frarik_montalatte_energy_anno
        unit_of_measurement: "kWh"
        device_class: energy
        state: >-
          {{ states('sensor.frarik_montalatte_kwh') | float(0) | round(3) }}

####################################################
#                 AUTOMAZIONI                      #
####################################################

automation:

  - alias: frarik_montalatte_off_automatico
    id: frarik_montalatte_off_automatico
    trigger:
      - platform: time
        at: input_datetime.frarik_montalatte_off_automatico
    condition:
      - condition: state
        entity_id: input_boolean.frarik_montalatte_switch
        state: 'on'
    action:
      - service: switch.turn_off
        target:
          entity_id: *switch_montalatte

  - alias: frarik_montalatte_notifica_fine_ciclo
    id: frarik_montalatte_notifica_fine_ciclo
    trigger:
      - platform: state
        entity_id: binary_sensor.frarik_montalatte_motore
        from: 'on'
        to: 'off'
        for:
          seconds: "{{ states('input_number.frarik_montalatte_avvio_ritardato_s') | int(30) }}"
    condition:
      - condition: time
        after: input_datetime.frarik_montalatte_orario_inizio_notifiche
        before: input_datetime.frarik_montalatte_orario_fine_notifiche
    action:
      - choose:
          - conditions:
              - condition: state
                entity_id: input_boolean.frarik_montalatte_notify_push
                state: 'on'
            sequence:
              - service: frarik_montalatte_notify.send_message
                data:
                  message: "{{ states('input_text.frarik_montalatte_messaggio') or 'Montalatte terminato!' }}"
                  title: "🥛 Montalatte"
      - service: counter.increment
        target:
          entity_id: counter.frarik_montalatte_cicli_totale

  - alias: frarik_montalatte_reset_settimanale
    id: frarik_montalatte_reset_settimanale
    trigger:
      - platform: time
        at: "00:01:00"
    action:
      - choose:
          - conditions:
              - condition: template
                value_template: "{{ now().weekday() == 0 }}"
            sequence:
              - service: input_number.set_value
                target:
                  entity_id:
                    - input_number.frarik_montalatte_consumo_lunedi
                    - input_number.frarik_montalatte_consumo_martedi
                    - input_number.frarik_montalatte_consumo_mercoledi
                    - input_number.frarik_montalatte_consumo_giovedi
                    - input_number.frarik_montalatte_consumo_venerdi
                    - input_number.frarik_montalatte_consumo_sabato
                    - input_number.frarik_montalatte_consumo_domenica
                    - input_number.frarik_montalatte_costo_lunedi
                    - input_number.frarik_montalatte_costo_martedi
                    - input_number.frarik_montalatte_costo_mercoledi
                    - input_number.frarik_montalatte_costo_giovedi
                    - input_number.frarik_montalatte_costo_venerdi
                    - input_number.frarik_montalatte_costo_sabato
                    - input_number.frarik_montalatte_costo_domenica
                data:
                  value: 0
      - service: input_number.set_value
        target:
          entity_id: >
            {% set g = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][now().weekday()] %}
            {{ {'Monday':'input_number.frarik_montalatte_consumo_lunedi','Tuesday':'input_number.frarik_montalatte_consumo_martedi','Wednesday':'input_number.frarik_montalatte_consumo_mercoledi','Thursday':'input_number.frarik_montalatte_consumo_giovedi','Friday':'input_number.frarik_montalatte_consumo_venerdi','Saturday':'input_number.frarik_montalatte_consumo_sabato','Sunday':'input_number.frarik_montalatte_consumo_domenica'}[g] }}
        data:
          value: "{{ states('sensor.frarik_montalatte_energy_oggi') }}"
      - service: input_number.set_value
        target:
          entity_id: >
            {% set g = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][now().weekday()] %}
            {{ {'Monday':'input_number.frarik_montalatte_costo_lunedi','Tuesday':'input_number.frarik_montalatte_costo_martedi','Wednesday':'input_number.frarik_montalatte_costo_mercoledi','Thursday':'input_number.frarik_montalatte_costo_giovedi','Friday':'input_number.frarik_montalatte_costo_venerdi','Saturday':'input_number.frarik_montalatte_costo_sabato','Sunday':'input_number.frarik_montalatte_costo_domenica'}[g] }}
        data:
          value: "{{ state_attr('sensor.frarik_montalatte_time_on','costo_oggi_montalatte') }}"

####################################################
#                   SCRIPT                         #
####################################################

script:

  frarik_montalatte_reset_sensori:
    alias: Reset Sensori Montalatte
    sequence:
      - service: counter.reset
        target:
          entity_id: counter.frarik_montalatte_cicli_totale
      - service: input_text.set_value
        target:
          entity_id: input_text.frarik_montalatte_data_reset
        data:
          value: "{{ now().strftime('%d/%m/%Y %H:%M') }}"
`;

  function _buildWizardYaml(card, tpl) {
    const h = H(), c = cfgFor(card);
    const states = (h && h.states) || {};
    const allIds = Object.keys(states).sort();
    const stInp = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none';
    const stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';

    function field2(fid, lbl2, hint) {
      return '<div style="margin-bottom:12px;position:relative"><label style="' + stLbl + '">' + lbl2 + (hint ? '<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">' + hint + '</span>' : '') + '</label><input id="' + fid + '" type="text" autocomplete="off" placeholder="Cerca entità…" style="' + stInp + '"><div id="' + fid + '-d" style="' + stDrop + '"></div></div>';
    }

    const formHtml = '<div style="font-size:12px;color:rgba(255,255,255,.7);margin-bottom:14px;line-height:1.5">Inserisci i sensori della tua presa smart. Il PKG verrà configurato automaticamente.</div>'
      + field2('wz-potenza', 'Sensore Potenza (W)', 'sensor.presa_montalatte_power')
      + field2('wz-switch',  'Switch presa',         'switch.presa_montalatte')
      + field2('wz-push',    'Notifica Push (mobile_app)', 'notify.mobile_app_iphone')
      + field2('wz-google',  'Media Player Google',  'media_player.google_home')
      + field2('wz-alexa',   'Media Player Alexa',   'media_player.alexa_cucina')
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="wz-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="wz-install" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#060d14">Installa PKG</button>'
      + '</div>';

    const wfids = ['wz-potenza','wz-switch','wz-push','wz-google','wz-alexa'];
    const ov = mkOv(popShell('🥛', '56,189,248', 'Installa PKG Montalatte', 'Configura i sensori', 'wz-close', formHtml), 'wz-close');

    wfids.forEach(function(fid) {
      const inp = ov.querySelector('#' + fid), drop = ov.querySelector('#' + fid + '-d');
      if (!inp || !drop) return;
      function showDrop2() {
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
      inp.addEventListener('focus', showDrop2);
      inp.addEventListener('input', showDrop2);
      inp.addEventListener('blur', function() { setTimeout(function() { drop.style.display = 'none'; }, 200); });
    });

    function g2(id) { const e = ov.querySelector('#' + id); return e ? e.value.trim() : ''; }

    ov.querySelector('#wz-install').addEventListener('click', async function() {
      const potenza = g2('wz-potenza');
      const sw      = g2('wz-switch');
      const push    = g2('wz-push');
      const google  = g2('wz-google') || 'media_player.google_home';
      const alexa   = g2('wz-alexa') || 'media_player.alexa_cucina';

      var yaml = (_MONTALATTE_PKG_YAML)
        .split('IL_TUO_SENSORE_POTENZA').join(potenza || 'sensor.non_configurato')
        .split('IL_TUO_SWITCH').join(sw || 'switch.non_configurato')
        .split('IL_TUO_MOBILE_APP').join(push || 'notify.notify')
        .split('IL_TUO_MEDIA_PLAYER_GOOGLE').join(google)
        .split('IL_TUO_MEDIA_PLAYER_ALEXA').join(alexa);

      try {
        const res = await callApi('POST', 'frarik/pkg/write', { name: 'frarik/frarik_montalatte.yaml', content: yaml });
        if (res && res.ok) {
          ov._close();
          alert('PKG Montalatte installato! Riavvia Home Assistant per applicare le modifiche.');
        } else {
          alert('Errore durante l\'installazione. Riprova.');
        }
      } catch(e) {
        alert('Errore: ' + e);
      }
    });

    ov.querySelector('#wz-cancel') && ov.querySelector('#wz-cancel').addEventListener('click', function() { ov._close(); });
  }

  /* ── CARD REGISTRATION ── */
  const CARD = {
    id: 'montalatte', name: 'Montalatte', icon: '🥛', version: '2.2',
    desc: 'Monitoraggio riscaldatore, cicli, energia e costi. Richiede PKG Centro Controllo Montalatte.',
    render: render,
    update: update,
    frarik_no_edit: true,
    pkg: {
      id: 'frarik_montalatte',
      name: 'Centro Controllo Montalatte',
      yaml: function() { return _MONTALATTE_PKG_YAML; },
      wizard: _buildWizardYaml,
    },
  };

  if (typeof window !== 'undefined') {
    window._frarikCards = window._frarikCards || [];
    window._frarikCards.push(CARD);
    window.dispatchEvent(new CustomEvent('frarik-card-registered', { detail: CARD }));
  }
})();
