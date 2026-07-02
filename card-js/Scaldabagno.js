/* frarik-version: 1.0 */
(function () {
  'use strict';

  /* ── HASS helpers ── */
  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_scaldabagnocard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function Attr(h, id, attr) { const s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes[attr] != null) ? s.attributes[attr] : null; }
  function num(v) { const x = parseFloat(String(v != null ? v : '').replace(',', '.')); return isNaN(x) ? null : x; }
  function isOn(h, id) { return !!(h && h.states && h.states[id] && (h.states[id].state === 'on' || h.states[id].state === 'heating')); }

  function fmtEur(v) { if (v == null || v === '') return '—'; const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(2) + ' €'; }
  function fmtKwh(v) { if (v == null || v === '') return '—'; const n = parseFloat(v); return isNaN(n) ? '—' : n.toFixed(3) + ' kWh'; }

  /* ── DEFAULT ENTITIES ── */
  function pkDefaults() {
    return {
      pk_power:      'sensor.frarik_scaldabagno_potenza_w',
      pk_switch:     'switch.presa_scaldabagno',
      pk_temp_acqua: 'sensor.scaldabagno_temperatura_acqua',
      pk_temp_set:   'number.scaldabagno_setpoint',
      pk_kwh_oggi:   'sensor.frarik_scaldabagno_energy_oggi',
      pk_kwh_mese:   'sensor.frarik_scaldabagno_energy_mese',
      pk_kwh_anno:   'sensor.frarik_scaldabagno_energy_anno',
      pk_time_on:    'sensor.frarik_scaldabagno_time_on',
      pk_soglia:     'input_number.frarik_scaldabagno_soglia_w',
    };
  }

  function cfgFor(card) {
    const c = load(card), pk = pkDefaults(), r = {};
    Object.keys(pk).forEach(function (k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    r.name = c.name || 'Scaldabagno';
    return r;
  }

  /* ── SVG SCALDABAGNO ── */
  function _boilerSVG(heating, tempAcqua) {
    const col   = heating ? '#f97316' : '#38bdf8';
    const colA  = heating ? 'rgba(249,115,22,' : 'rgba(56,189,248,';
    const kf    = heating
      ? '@keyframes bheat{0%,100%{opacity:.08}50%{opacity:.32}}@keyframes bled{0%,100%{opacity:.45}50%{opacity:1}}'
      : '';
    const glow  = heating ? 'drop-shadow(0 0 10px rgba(249,115,22,.3))' : 'drop-shadow(0 0 8px rgba(56,189,248,.15))';
    const tempStr = (tempAcqua != null) ? Math.round(tempAcqua) + '°C' : '--°C';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 108" style="display:block;width:100%;height:100%;filter:' + glow + '">'
      + (kf ? '<defs><style>' + kf + '</style></defs>' : '')

      /* Staffa a muro */
      + '<rect x="21" y="2" width="22" height="5" rx="2.5" fill="#0a1525" stroke="#1e3a5f" stroke-width=".6"/>'
      + '<rect x="28.5" y="6.5" width="7" height="4.5" rx="1.5" fill="#0c1d35"/>'
      + '<circle cx="32" cy="4.5" r="1.3" fill="#15263e"/>'

      /* Corpo serbatoio principale (pill shape) */
      + '<rect x="9" y="10" width="46" height="80" rx="18" fill="#0b1929" stroke="' + col + '" stroke-width=".85"/>'

      /* 3D highlight sx */
      + '<rect x="11" y="17" width="6.5" height="60" rx="3.25" fill="rgba(255,255,255,.04)"/>'

      /* Dome superiore */
      + '<ellipse cx="32" cy="20" rx="21" ry="5" fill="#0d2040" stroke="' + colA + '.12)" stroke-width=".5"/>'

      /* Dome inferiore */
      + '<ellipse cx="32" cy="80" rx="21" ry="4.5" fill="#090f1e" stroke="' + colA + '.08)" stroke-width=".5"/>'

      /* Glow riscaldamento interno */
      + (heating
        ? '<ellipse cx="32" cy="67" rx="16" ry="11" fill="' + colA + '.1)" style="animation:bheat 2.4s ease-in-out infinite"/>'
          + '<ellipse cx="32" cy="67" rx="9" ry="6.5" fill="' + colA + '.07)" style="animation:bheat 3s ease-in-out infinite .8s"/>'
        : '')

      /* Resistenza elettrica (fondo interno) */
      + '<rect x="21.5" y="71.5" width="21" height="2.5" rx="1.25" fill="' + (heating ? '#f97316' : '#162035') + '" opacity="' + (heating ? '.6' : '.25') + '"/>'
      + '<rect x="23" y="69.5" width="2" height="5.5" rx="1" fill="' + (heating ? '#f97316' : '#162035') + '" opacity="' + (heating ? '.4' : '.15') + '"/>'
      + '<rect x="39" y="69.5" width="2" height="5.5" rx="1" fill="' + (heating ? '#f97316' : '#162035') + '" opacity="' + (heating ? '.4' : '.15') + '"/>'

      /* Tubo acqua calda (H — uscita superiore destra) */
      + '<rect x="47" y="13.5" width="9" height="4.5" rx="2.25" fill="#0b1929" stroke="#1e3a5f" stroke-width=".55"/>'
      + '<rect x="53.5" y="11" width="5" height="10" rx="2.5" fill="#0d2040" stroke="#1e3a5f" stroke-width=".5"/>'
      + '<text x="56" y="17.5" text-anchor="middle" font-size="3.5" fill="' + col + '" font-family="system-ui,sans-serif" font-weight="800">H</text>'

      /* Tubo acqua fredda (C — entrata inferiore sinistra) */
      + '<rect x="8" y="77.5" width="9" height="4.5" rx="2.25" fill="#0b1929" stroke="#1e3a5f" stroke-width=".55"/>'
      + '<rect x="5.5" y="75" width="5" height="10" rx="2.5" fill="#0d2040" stroke="#1e3a5f" stroke-width=".5"/>'
      + '<text x="8" y="81.5" text-anchor="middle" font-size="3.5" fill="#38bdf8" font-family="system-ui,sans-serif" font-weight="800">C</text>'

      /* Valvola di sicurezza (fianco destro, metà serbatoio) */
      + '<rect x="55" y="51" width="6" height="4" rx="2" fill="#0a1525" stroke="#1e3a5f" stroke-width=".5"/>'
      + '<circle cx="60" cy="53" r="1.4" fill="#15263e" stroke="#1e3a5f" stroke-width=".4"/>'

      /* Etichetta capacità */
      + '<text x="32" y="36" text-anchor="middle" font-size="5" fill="rgba(255,255,255,.09)" font-family="system-ui,sans-serif" font-weight="800">80 L</text>'

      /* Pannello comandi frontale */
      + '<rect x="15" y="42" width="34" height="30" rx="4" fill="#060e1c" stroke="' + colA + '.2)" stroke-width=".6"/>'

      /* Manopola termostato */
      + '<circle cx="32" cy="55" r="10.5" fill="#091526" stroke="' + col + '" stroke-width=".85"/>'
      + '<circle cx="32" cy="55" r="7.5" fill="#040a12"/>'
      + '<circle cx="32" cy="55" r="3.5" fill="' + (heating ? '#f97316' : '#0e2040') + '" opacity="' + (heating ? '.85' : '.45') + '"/>'
      /* Tacche dial */
      + '<line x1="32" y1="44.8" x2="32" y2="47.6" stroke="' + col + '" stroke-width=".65" stroke-linecap="round" opacity=".55"/>'
      + '<line x1="38.4" y1="48.2" x2="36.8" y2="50.2" stroke="' + col + '" stroke-width=".65" stroke-linecap="round" opacity=".4"/>'
      + '<line x1="25.6" y1="48.2" x2="27.2" y2="50.2" stroke="' + col + '" stroke-width=".65" stroke-linecap="round" opacity=".4"/>'
      + '<line x1="39.8" y1="56" x2="37.6" y2="56" stroke="' + col + '" stroke-width=".65" stroke-linecap="round" opacity=".3"/>'
      + '<line x1="24.2" y1="56" x2="26.4" y2="56" stroke="' + col + '" stroke-width=".65" stroke-linecap="round" opacity=".3"/>'

      /* Display temperatura */
      + '<rect x="17" y="66.5" width="23" height="5.5" rx="1.5" fill="#02060e" stroke="' + colA + '.3)" stroke-width=".5"/>'
      + '<text x="28.5" y="70.7" text-anchor="middle" font-size="4" font-weight="bold" font-family="monospace,system-ui" fill="' + col + '">' + tempStr + '</text>'

      /* LED stato */
      + '<circle cx="44" cy="69.2" r="2.4" fill="' + (heating ? '#f97316' : '#22c55e') + '"' + (heating ? ' style="animation:bled 1.2s ease-in-out infinite"' : '') + '/>'
      + '<circle cx="44" cy="69.2" r=".9" fill="rgba(255,255,255,.42)"/>'

      /* Pulsante power */
      + '<rect x="40" y="43" width="7" height="4" rx="2" fill="' + (heating ? 'rgba(249,115,22,.12)' : 'rgba(255,255,255,.04)') + '" stroke="' + colA + '.28)" stroke-width=".4"/>'
      + '<line x1="43.5" y1="43.7" x2="43.5" y2="46.3" stroke="' + col + '" stroke-width=".7" stroke-linecap="round" opacity=".7"/>'

      /* Bullone anodo (fondo serbatoio) */
      + '<circle cx="32" cy="88.5" r="2.4" fill="#0c1929" stroke="#1e3a5f" stroke-width=".5"/>'
      + '<line x1="30.5" y1="88.5" x2="33.5" y2="88.5" stroke="#1e3a5f" stroke-width=".55" stroke-linecap="round"/>'
      + '<line x1="32" y1="87" x2="32" y2="90" stroke="#1e3a5f" stroke-width=".55" stroke-linecap="round"/>'

      + '</svg>';
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = cfgFor(card);
    const rid = 'frc' + (card.id || Math.random().toString(36).slice(2, 8));

    const pwV       = num(S(h, c.pk_power));
    const swOn      = isOn(h, c.pk_switch);
    const tempAcqua = num(S(h, c.pk_temp_acqua));
    const tempSet   = num(S(h, c.pk_temp_set));
    const kwOggi    = S(h, c.pk_kwh_oggi);
    const kwMese    = S(h, c.pk_kwh_mese);
    const ton       = c.pk_time_on;

    const pw      = pwV != null ? pwV : 0;
    const soglia  = num(S(h, c.pk_soglia)) || 100;
    const heating = swOn && pw > soglia;

    const col    = heating ? '#f97316' : swOn ? '#38bdf8' : '#64748b';
    const colRgb = heating ? '249,115,22' : swOn ? '56,189,248' : '100,116,139';
    const statusLabel = heating ? 'RISCALDAMENTO' : swOn ? 'PRONTO' : 'SPENTO';
    const statusText  = heating ? 'In riscaldamento' : swOn ? 'Pronto' : 'Spento';

    const barMax = 2500;
    const barPct = Math.min(100, (pw / barMax) * 100);
    const barCol = pw < 50 ? '#64748b' : pw <= 500 ? '#38bdf8' : pw <= 1500 ? '#22c55e' : pw <= 2000 ? '#f97316' : '#ef4444';

    const kwOggiNum = num(kwOggi);
    const kwMeseNum = num(kwMese);
    const costoOggi = Attr(h, ton, 'costo_oggi_scaldabagno');
    const costoMese = Attr(h, ton, 'costo_mese_scaldabagno');

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#08101a 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(' + colRgb + ',.08) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.28);color:' + col + '}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + col + (heating ? ';animation:fcPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;max-height:130px}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:6px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      + '#' + rid + ' .fc-st{display:flex;align-items:center;justify-content:flex-end;gap:7px;font-size:14px;font-weight:800;color:' + col + ';padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-stdot{width:8px;height:8px;border-radius:50%;background:' + col + ';flex-shrink:0' + (heating ? ';animation:fcPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-met{display:flex;align-items:center;justify-content:space-between;gap:4px}'
      + '#' + rid + ' .fc-met-lbl{font-size:11px;font-weight:700;color:#fff;flex-shrink:0}'
      + '#' + rid + ' .fc-met-v{font-size:15px;font-weight:800;color:#fff;text-align:right}'
      + '#' + rid + ' .fc-met-sm{font-size:12px;font-weight:800;color:#fff;text-align:right}'
      + '#' + rid + ' .fc-pwfull{margin:0 14px 10px}'
      + '#' + rid + ' .fc-pwfull-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px}'
      + '#' + rid + ' .fc-pwfull-lbl{font-size:10px;font-weight:700;color:#fff}'
      + '#' + rid + ' .fc-pwfull-v{font-size:18px;font-weight:900;color:' + barCol + ';line-height:1}'
      + '#' + rid + ' .fc-pw-bar{height:5px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}'
      + '#' + rid + ' .fc-pw-fill{height:100%;border-radius:2px;transition:width .6s,background .4s}'
      + '#' + rid + ' .fc-stats{display:flex;margin:0 14px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;cursor:pointer}'
      + '#' + rid + ' .fc-stats:hover{background:rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-sb{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 3px;gap:2px}'
      + '#' + rid + ' .fc-sb-sep{width:1px;background:rgba(255,255,255,.08);flex-shrink:0}'
      + '#' + rid + ' .fc-sb-n{font-size:12px;font-weight:900;color:' + col + ';height:18px;display:flex;align-items:center;justify-content:center}'
      + '#' + rid + ' .fc-sb-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px;text-align:center}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 12px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(' + colRgb + ',.12);border-color:rgba(' + colRgb + ',.3);color:' + col + '}'
      + (heating ? '@keyframes fcPulse{0%,100%{opacity:.6}50%{opacity:1}}' : '')
      + '</style>';

    const heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img" data-sya="popup-energia">' + _boilerSVG(heating, tempAcqua) + '</div>'
      + '<div class="fc-hero-r">'
      + '<div class="fc-st">' + statusText + '<div class="fc-stdot"></div></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Temp. acqua</span><span class="fc-met-v">' + (tempAcqua != null ? tempAcqua.toFixed(1) + ' °C' : '—') + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Impostata</span><span class="fc-met-v">' + (tempSet != null ? tempSet.toFixed(0) + ' °C' : '—') + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Consumo</span><span class="fc-met-v">' + (pw > 0 ? pw.toFixed(0) + ' W' : '— W') + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Energia oggi</span><span class="fc-met-sm">' + (kwOggiNum != null ? kwOggiNum.toFixed(3) + ' kWh' : '—') + '</span></div>'
      + '</div>'
      + '</div>';

    const pwBarHtml = '<div class="fc-pwfull">'
      + '<div class="fc-pwfull-hd"><span class="fc-pwfull-lbl">Consumo istantaneo</span><span class="fc-pwfull-v">' + (pw > 0 ? pw.toFixed(0) + ' W' : '— W') + '</span></div>'
      + '<div class="fc-pw-bar"><div class="fc-pw-fill" style="width:' + barPct.toFixed(1) + '%;background:' + barCol + ';box-shadow:0 0 6px ' + barCol + '88"></div></div>'
      + '</div>';

    const statsHtml = '<div class="fc-stats" data-sya="popup-energia">'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (kwOggiNum != null ? kwOggiNum.toFixed(2) : '—') + '</div><div class="fc-sb-l">kWh oggi</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (kwMeseNum != null ? kwMeseNum.toFixed(1) : '—') + '</div><div class="fc-sb-l">kWh mese</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (costoOggi != null ? costoOggi : '—') + '</div><div class="fc-sb-l">€ oggi</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + (costoMese != null ? costoMese : '—') + '</div><div class="fc-sb-l">€ mese</div></div>'
      + '</div>';

    const btnsHtml = '<div class="fc-btns">'
      + '<div class="fc-btn" data-sya="popup-energia">⚡ Energia</div>'
      + '<div class="fc-btn" data-sya="popup-cfg">⚙ Impostazioni</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">🛁</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'Scaldabagno') + '</div>'
      + '<div class="fc-hdr-pill"><div class="fc-dot"></div>' + statusLabel + '</div>'
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

  /* ── OVERLAY / POPUP SHELL ── */
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
    return POP_CSS
      + '<div style="width:100%;max-height:78vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + rgb + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
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
    const h = H(), ton = c.pk_time_on;
    function row(lbl, val, col) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        + '<span style="font-size:12px;color:#fff">' + lbl + '</span>'
        + '<span style="font-size:13px;font-weight:800;color:' + (col || '#f97316') + '">' + val + '</span>'
        + '</div>';
    }
    const tempAcqua = num(S(h, c.pk_temp_acqua));
    const tempSet   = num(S(h, c.pk_temp_set));
    const pwV       = num(S(h, c.pk_power));

    const content = '<div style="background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.2);border-radius:12px;padding:12px 14px;text-align:center;margin-bottom:12px">'
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Temperatura Acqua</div>'
      + '<div style="font-size:30px;font-weight:900;color:#f97316">' + (tempAcqua != null ? tempAcqua.toFixed(1) + ' °C' : '—') + '</div>'
      + (tempSet != null ? '<div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:4px">Setpoint: ' + tempSet.toFixed(0) + ' °C</div>' : '')
      + '</div>'
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Potenza</div>'
      + row('Consumo attuale', (pwV != null ? pwV.toFixed(0) + ' W' : '—'), '#fdba74')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Energia</div>'
      + row('Oggi',             fmtKwh(S(h, c.pk_kwh_oggi)),                          '#fed7aa')
      + row('Ieri',             fmtKwh(Attr(h, c.pk_kwh_oggi, 'last_period')),         '#fff')
      + row('Questo mese',      fmtKwh(S(h, c.pk_kwh_mese)),                          '#fed7aa')
      + row('Mese precedente',  fmtKwh(Attr(h, c.pk_kwh_mese, 'last_period')),        '#fff')
      + row('Questo anno',      fmtKwh(S(h, c.pk_kwh_anno)),                          '#fed7aa')
      + row('Anno precedente',  fmtKwh(Attr(h, c.pk_kwh_anno, 'last_period')),        '#fff')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Costi</div>'
      + row('Oggi',             fmtEur(Attr(h, ton, 'costo_oggi_scaldabagno')),        '#fb923c')
      + row('Ieri',             fmtEur(Attr(h, ton, 'costo_ieri_scaldabagno')),        '#fff')
      + row('Questo mese',      fmtEur(Attr(h, ton, 'costo_mese_scaldabagno')),        '#fb923c')
      + row('Mese precedente',  fmtEur(Attr(h, ton, 'costo_mese_prec_scaldabagno')), '#fff')
      + row('Questo anno',      fmtEur(Attr(h, ton, 'costo_anno_scaldabagno')),        '#fb923c')
      + '<div style="font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Tempo riscaldamento</div>'
      + row('Oggi',         Attr(h, ton, 'Oggi')   || '—', '#fdba74')
      + row('Ieri',         Attr(h, ton, 'Ieri')   || '—', '#fff')
      + row('Questo mese',  Attr(h, ton, 'Mese')   || '—', '#fdba74')
      + row('Questo anno',  Attr(h, ton, 'Anno')   || '—', '#fdba74');

    mkOv(popShell('🛁', '249,115,22', 'Energia & Costi', c.name || 'Scaldabagno', 'fc-en-close', content), 'fc-en-close');
  }

  /* ── POPUP CONFIGURAZIONE ENTITÀ ── */
  function openCfg(card, el) {
    const h = H(), c = cfgFor(card);
    const allIds = Object.keys((h && h.states) || {}).sort();
    const stInp  = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none';
    const stLbl  = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stSec  = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#f97316;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(249,115,22,.2)';

    function field(fid, lbl2, val, hint) {
      return '<div style="margin-bottom:9px;position:relative">'
        + '<label style="' + stLbl + '">' + lbl2
        + (hint ? '<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">' + hint + '</span>' : '')
        + '</label>'
        + '<input id="' + fid + '" type="text" value="' + (val || '').replace(/"/g, '&quot;') + '" autocomplete="off" placeholder="Cerca entità…" style="' + stInp + '">'
        + '<div id="' + fid + '-d" style="' + stDrop + '"></div>'
        + '</div>';
    }

    const formHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label><input id="fc-name" type="text" value="' + (c.name || '').replace(/"/g, '&quot;') + '" placeholder="es. Scaldabagno bagno" style="' + stInp.replace('monospace', 'system-ui') + '"></div>'
      + '<div style="' + stSec + '">Sensori principali</div>'
      + field('fc-power',    'Potenza istantanea (W)',   c.pk_power,      'sensor.frarik_scaldabagno_potenza_w')
      + field('fc-switch',   'Switch / presa',            c.pk_switch,     'switch.presa_scaldabagno')
      + field('fc-temp-acq', 'Temperatura acqua (°C)', c.pk_temp_acqua, 'sensor.scaldabagno_temperatura_acqua')
      + field('fc-temp-set', 'Setpoint temperatura',     c.pk_temp_set,   'number.scaldabagno_setpoint')
      + '<div style="' + stSec + '">PKG — Energia (kWh)</div>'
      + field('fc-kwh-oggi', 'kWh oggi',  c.pk_kwh_oggi, 'sensor.frarik_scaldabagno_energy_oggi')
      + field('fc-kwh-mese', 'kWh mese',  c.pk_kwh_mese, 'sensor.frarik_scaldabagno_energy_mese')
      + field('fc-kwh-anno', 'kWh anno',  c.pk_kwh_anno, 'sensor.frarik_scaldabagno_energy_anno')
      + '<div style="' + stSec + '">PKG — Statistiche</div>'
      + field('fc-time-on',  'Sensore time_on', c.pk_time_on, 'sensor.frarik_scaldabagno_time_on')
      + field('fc-soglia',   'Soglia riscaldamento (W)', c.pk_soglia, 'input_number.frarik_scaldabagno_soglia_w')
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="fc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="fc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#f97316;color:#060d14">Salva</button>'
      + '</div>';

    const fieldIds = ['fc-power','fc-switch','fc-temp-acq','fc-temp-set','fc-kwh-oggi','fc-kwh-mese','fc-kwh-anno','fc-time-on','fc-soglia'];
    const ov = mkOv(popShell('🛁', '249,115,22', 'Configura Scaldabagno', card.id || '', 'fc-cfg-close', formHtml), 'fc-cfg-close');

    ov.querySelector('#fc-cancel').addEventListener('click', function () { ov._close(); });

    fieldIds.forEach(function (fid) {
      const inp = ov.querySelector('#' + fid), drop = ov.querySelector('#' + fid + '-d');
      if (!inp || !drop) return;
      function showDrop() {
        const q = inp.value.toLowerCase().trim();
        const hits = (q ? allIds.filter(function (id) { return id.toLowerCase().includes(q); }) : allIds).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(function (id) {
          return '<div data-pick="' + id + '" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">' + id + '</div>';
        }).join('');
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

    function g(id) { const e = ov.querySelector('#' + id); return e ? e.value.trim() : ''; }

    ov.querySelector('#fc-save').addEventListener('click', function () {
      save(card, {
        name:         g('fc-name'),
        pk_power:     g('fc-power'),     pk_switch:    g('fc-switch'),
        pk_temp_acqua: g('fc-temp-acq'), pk_temp_set:  g('fc-temp-set'),
        pk_kwh_oggi:  g('fc-kwh-oggi'),  pk_kwh_mese:  g('fc-kwh-mese'),  pk_kwh_anno: g('fc-kwh-anno'),
        pk_time_on:   g('fc-time-on'),   pk_soglia:    g('fc-soglia'),
      });
      ov._close();
      try { el._fcSig = ''; el.innerHTML = render(card); mount(card, null, el); } catch (e) {}
    });
  }

  /* ── MOUNT ── */
  function mount(card, hass, el) {
    if (el._fcBound === CARD.version) return;
    el._fcBound = CARD.version;
    if (el._fcHandler) el.removeEventListener('click', el._fcHandler);
    el._fcHandler = function (e) {
      const sya = e.target.closest('[data-sya]'); if (!sya) return;
      const a = sya.dataset.sya;
      if (a === 'popup-energia') { openEnergiaPopup(cfgFor(card)); return; }
      if (a === 'popup-cfg')     { openCfg(card, el); return; }
    };
    el.addEventListener('click', el._fcHandler);
  }

  /* ── UPDATE ── */
  function update(card, hass, el) {
    const h = H(), c = cfgFor(card);
    const sig = [CARD.version, S(h, c.pk_power), S(h, c.pk_switch), S(h, c.pk_temp_acqua), S(h, c.pk_temp_set), S(h, c.pk_kwh_oggi), S(h, c.pk_kwh_mese), Attr(h, c.pk_time_on, 'costo_oggi_scaldabagno')].join('|');
    if (!el.querySelector('.fc-card') || el._fcSig !== sig) {
      el._fcSig = sig;
      el.innerHTML = render(card);
    }
    mount(card, hass, el);
  }

  /* ── PKG YAML EMBEDDED ── */
  var _SCALDABAGNO_PKG_YAML = `###############################################################
#                                                             #
#   ███████╗██████╗  █████╗ ██████╗ ██╗██╗  ██╗             #
#   ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██║ ██╔╝             #
#   █████╗  ██████╔╝███████║██████╔╝██║█████╔╝              #
#   ██╔══╝  ██╔══██╗██╔══██║██╔══██╗██║██╔═██╗              #
#   ██║     ██║  ██║██║  ██║██║  ██║██║██║  ██╗             #
#   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝            #
#                                                             #
#   Package: Frarik — Centro Controllo Scaldabagno           #
#   Versione: 1.0  |  Frarik / Fratech                       #
#                                                             #
###############################################################
#
# COSA FA QUESTO PACKAGE
# ──────────────────────────────────────────────────────────
#  ▸ Monitoraggio potenza istantanea riscaldamento (W)
#  ▸ Tracciamento energia consumata (kWh) giorno/mese/anno
#  ▸ Calcolo costi energetici (usa input_number.costo_energia)
#  ▸ Sensore time_on con attributi costo giornaliero
#  ▸ Notifiche riscaldamento completato (Push / Alexa / Google)
#  ▸ Soglia riscaldamento configurabile
#
###############################################################

homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Frarik — Centro Controllo Scaldabagno 1.0 — Frarik'

      setting:

####################################################
#              IMPOSTAZIONI PACKAGE                #
####################################################

        Sensore Potenza Scaldabagno: &sensore_potenza_scaldabagno "{{ states('IL_TUO_SENSORE_POTENZA') | float(0) }}"
        Switch Scaldabagno:          &switch_scaldabagno 'IL_TUO_SWITCH'

        Lista MediaPlayer Google: &google
          - IL_TUO_MEDIA_PLAYER_GOOGLE_1

        Lista mediaplayer alexa: &alexa
          - IL_TUO_MEDIA_PLAYER_ALEXA_1

        Device per notifica push: &push
          - service: IL_TUO_MOBILE_APP_1

####################################################
#                    SENSORI                       #
####################################################

sensor:
  - platform: integration
    source: sensor.frarik_scaldabagno_potenza_w
    name: frarik_scaldabagno_kwh
    unit_prefix: k
    method: left
    round: 2

####################################################
#                INPUT NUMBER                      #
####################################################

input_number:
  frarik_scaldabagno_soglia_w:
    name: Soglia Riscaldamento Scaldabagno W
    icon: mdi:flash
    min: 0
    max: 5000
    step: 1.00
    unit_of_measurement: "w"
    mode: box

  frarik_scaldabagno_tempo_innesco_m:
    name: Tempo Innesco Scaldabagno M
    icon: mdi:timer
    min: 0
    max: 60
    step: 1.00
    unit_of_measurement: "m"
    mode: box

  frarik_scaldabagno_avvio_ritardato_s:
    name: Avvio Ritardato Scaldabagno S
    icon: mdi:timer-sand
    min: 0
    max: 60
    step: 1.00
    unit_of_measurement: "s"
    mode: box

####################################################
#                 UTILITY METER                    #
####################################################

utility_meter:

  frarik_scaldabagno_energy_oggi:
    source: sensor.frarik_scaldabagno_kwh
    cycle: daily

  frarik_scaldabagno_energy_mese:
    source: sensor.frarik_scaldabagno_kwh
    cycle: monthly

  frarik_scaldabagno_energy_anno:
    source: sensor.frarik_scaldabagno_kwh
    cycle: yearly

####################################################
#                TEMPLATE                          #
####################################################

template:
  - binary_sensor:
      - name: frarik_scaldabagno_motore
        icon: mdi:water-boiler
        state: >-
          {{ 'on' if (states('sensor.frarik_scaldabagno_potenza_w') | int(0)) >
             states('input_number.frarik_scaldabagno_soglia_w') | int(0) else 'off' }}
        delay_off: "00:{{ states('input_number.frarik_scaldabagno_tempo_innesco_m') | int(0) }}:00"
        delay_on:  "00:00:{{ states('input_number.frarik_scaldabagno_avvio_ritardato_s') | int(0) }}"

  - sensor:
      - name: "frarik_scaldabagno_time_on"
        icon: mdi:history
        state: >-
          {% if is_state('binary_sensor.frarik_scaldabagno_motore', 'on') and
                (as_timestamp(states.binary_sensor.frarik_scaldabagno_motore.last_changed) + 1) <= as_timestamp(now()) %}
            {{ ((as_timestamp(now()) - as_timestamp(states.binary_sensor.frarik_scaldabagno_motore.last_changed)) / 3600) }}
          {% else %} 0 {% endif %}
        attributes:
          Oggi: >
            {% set hours = states('sensor.frarik_scaldabagno_energy_oggi') | float(0) %}
            {{ hours | round(3) }} kWh
          Mese: >
            {% set kwh = states('sensor.frarik_scaldabagno_energy_mese') | float(0) %}
            {{ kwh | round(3) }} kWh
          Anno: >
            {% set kwh = states('sensor.frarik_scaldabagno_energy_anno') | float(0) %}
            {{ kwh | round(3) }} kWh
          costo_oggi_scaldabagno: >-
            {{ ((states('sensor.frarik_scaldabagno_energy_oggi') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_mese_scaldabagno: >-
            {{ ((states('sensor.frarik_scaldabagno_energy_mese') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_anno_scaldabagno: >-
            {{ ((states('sensor.frarik_scaldabagno_energy_anno') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_ieri_scaldabagno: >-
            {{ ((state_attr('sensor.frarik_scaldabagno_energy_oggi', 'last_period') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}
          costo_mese_prec_scaldabagno: >-
            {{ ((state_attr('sensor.frarik_scaldabagno_energy_mese', 'last_period') | float(0)) * (states('input_number.costo_energia') | float(0))) | round(2, default=0) }}

      - name: "frarik_scaldabagno_potenza_w"
        unit_of_measurement: 'W'
        device_class: power
        state_class: measurement
        icon: mdi:flash
        state: *sensore_potenza_scaldabagno

      - name: "frarik_scaldabagno_versione"
        state: "1.0"

####################################################
#                INPUT BOOLEAN                     #
####################################################

input_boolean:
  frarik_scaldabagno_switch:
    name: Switch Scaldabagno
    icon: mdi:power

  frarik_scaldabagno_notify_push:
    name: Notifica Push Scaldabagno

  frarik_scaldabagno_notify_alexa:
    name: Notifica Alexa Scaldabagno

  frarik_scaldabagno_notify_google:
    name: Notifica Google Scaldabagno

####################################################
#                 INPUT DATETIME                   #
####################################################

input_datetime:
  frarik_scaldabagno_notifiche_inizio:
    name: Orario Inizio Notifiche Scaldabagno
    has_date: false
    has_time: true

  frarik_scaldabagno_notifiche_fine:
    name: Orario Fine Notifiche Scaldabagno
    has_date: false
    has_time: true

  frarik_scaldabagno_off:
    name: Scaldabagno Spegnimento Automatico
    has_date: false
    has_time: true

####################################################
#                  INPUT TEXT                      #
####################################################

input_text:
  frarik_scaldabagno_nome:

  frarik_scaldabagno_messaggio:

####################################################
#                  AUTOMAZIONI                     #
####################################################

automation:
- alias: frarik_scaldabagno_automazioni
  id: frarik_scaldabagno_automazioni
  max_exceeded: silent
  trigger:

  - platform: state
    entity_id:
      - input_boolean.frarik_scaldabagno_switch
      - *switch_scaldabagno
    from: 'on'
    to: 'off'
    id: switch_off

  - platform: state
    entity_id:
      - input_boolean.frarik_scaldabagno_switch
      - *switch_scaldabagno
    from: 'off'
    to: 'on'
    id: switch_on

  action:

  - choose:
    - alias: SWITCH OFF
      conditions:
      - condition: trigger
        id: switch_off
      sequence:
      - service: switch.turn_off
        target:
          entity_id: *switch_scaldabagno
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.frarik_scaldabagno_switch

  - choose:
    - alias: SWITCH ON
      conditions:
      - condition: trigger
        id: switch_on
      sequence:
      - service: switch.turn_on
        target:
          entity_id: *switch_scaldabagno
      - service: input_boolean.turn_on
        target:
          entity_id: input_boolean.frarik_scaldabagno_switch

  - parallel:
    - choose:
      - conditions:
        - condition: trigger
          id: switch_off
        - condition: time
          after: 'input_datetime.frarik_scaldabagno_notifiche_inizio'
          before: 'input_datetime.frarik_scaldabagno_notifiche_fine'
        - condition: state
          entity_id: input_boolean.frarik_scaldabagno_notify_google
          state: 'on'
        sequence:
        - service: tts.google_translate_say
          continue_on_error: true
          data:
            entity_id: *google
            message: "{{ states('input_text.frarik_scaldabagno_messaggio') }}"

    - choose:
      - conditions:
        - condition: trigger
          id: switch_off
        - condition: time
          after: 'input_datetime.frarik_scaldabagno_notifiche_inizio'
          before: 'input_datetime.frarik_scaldabagno_notifiche_fine'
        - condition: state
          entity_id: input_boolean.frarik_scaldabagno_notify_alexa
          state: 'on'
        sequence:
        - service: notify.alexa_media
          continue_on_error: true
          data:
            target: *alexa
            data:
              type: announce
              method: spoken
            message: "{{ states('input_text.frarik_scaldabagno_messaggio') }}"

    - choose:
      - conditions:
        - condition: trigger
          id: switch_off
        - condition: state
          entity_id: input_boolean.frarik_scaldabagno_notify_push
          state: 'on'
        sequence:
        - repeat:
            for_each: *push
            sequence:
              - service: "{{ repeat.item.service }}"
                continue_on_error: true
                data:
                  message: >-
                    🚿 {{ states('input_text.frarik_scaldabagno_nome') }}

                    ⚡ Consumati oggi: {{ state_attr('sensor.frarik_scaldabagno_time_on','Oggi') }}

                    💰 Costo oggi: {{ state_attr('sensor.frarik_scaldabagno_time_on','costo_oggi_scaldabagno') }} €
                  title: "Scaldabagno"

- alias: frarik_scaldabagno_off_automatico
  id: frarik_scaldabagno_off_automatico
  trigger:
    - platform: time
      at: 'input_datetime.frarik_scaldabagno_off'
      id: scaldabagno_automatico_off
  condition: []
  action:
    - choose:
      - conditions:
        - condition: trigger
          id: scaldabagno_automatico_off
        - condition: state
          entity_id: *switch_scaldabagno
          state: 'on'
        sequence:
        - entity_id: *switch_scaldabagno
          service: switch.turn_off

###############################################################
#  Fine package — Frarik Centro Controllo Scaldabagno v1.0
###############################################################
`;

  /* ── PKG BUILD ── */
  var _SCA_WIZ_KEY = 'frarik_pkg_wizard_scaldabagno';

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
    var yaml = _SCALDABAGNO_PKG_YAML
      .split('IL_TUO_SENSORE_POTENZA').join(potenza || 'sensor.non_configurato')
      .split('IL_TUO_SWITCH').join(sw || 'switch.non_configurato');
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
    try { saved = JSON.parse(localStorage.getItem(_SCA_WIZ_KEY) || 'null'); } catch(e) {}
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
        + '<div class="wd-hdr"><div class="wd-ico">🛁</div>'
        + '<div><div class="wd-tit">Installa PKG Scaldabagno</div><div class="wd-sub">frarik_scaldabagno.yaml → config/packages/</div></div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'

        + '<div><div class="wd-sec">Sensori</div>'
        + '<div class="wd-lbl">Sensore Potenza (W)</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-potenza" type="text" autocomplete="off" placeholder="sensor.presa_scaldabagno_potenza" value="' + ((saved && saved.potenza) || '').replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-potenza"></div></div>'
        + '<div class="wd-lbl">Switch Presa Scaldabagno</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-switch" type="text" autocomplete="off" placeholder="switch.presa_scaldabagno" value="' + ((saved && saved.sw) || '').replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-switch"></div></div>'
        + '</div>'

        + '<div><div class="wd-sec">Notifiche Push</div>'
        + '<p class="wd-note">mobile_app dei dispositivi che ricevono le notifiche push (es. <code>mobile_app_iphone</code>).</p>'
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
        try { localStorage.setItem(_SCA_WIZ_KEY, JSON.stringify({potenza: potenza, sw: sw, push: push, google: google, alexa: alexa})); } catch(e) {}
        var yaml = _buildPkg(potenza, sw, push, google, alexa);
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading');
        btn.textContent = 'Installazione…';
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_scaldabagno.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Scaldabagno installato! Riavvia HA.'); } catch(e) {}
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

  /* ── REGISTRATION ── */
  const CARD = {
    id: 'scaldabagno', name: 'Scaldabagno', icon: '🛁', version: '1.0',
    desc: 'Scaldabagno elettrico — temperatura acqua, riscaldamento, consumo, energia e costi.',
    render: render, mount: mount, update: update, configure: openCfg,
    frarik_pkg_check: 'sensor.frarik_scaldabagno_versione',
    frarik_pkg_id: 'frarik_scaldabagno',
    frarik_pkg_version: '1.0',
    openWizard: _openWizard,
    _buildPkgFromConfig: function(cfg) { return _buildPkg(cfg.potenza || '', cfg.sw || '', cfg.push || [], cfg.google || [], cfg.alexa || []); },
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: scaldabagno v' + CARD.version); } catch (e) {}

})();
