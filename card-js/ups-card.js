/* frarik-version: 1.1 */
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
    return '<rect x="' + x + '" y="' + y + '" width="10" height="8" rx="2" fill="#060d1a" stroke="rgba(255,255,255,.1)" stroke-width=".5"/>'
      + '<circle cx="' + (x + 3) + '" cy="' + (y + 4) + '" r="1.2" fill="#020810"/>'
      + '<circle cx="' + (x + 7) + '" cy="' + (y + 4) + '" r="1.2" fill="#020810"/>';
  }

  function _upsSVG(batV, status) {
    const isOL = status === 'OL';
    const isOB = status === 'OB';
    const batPct = batV != null ? Math.max(0, Math.min(100, Math.round(batV))) : null;
    const batFilled = batPct != null ? Math.min(5, Math.ceil(batPct / 20)) : 0;
    const batCol = batPct == null ? '#64748b' : batPct > 40 ? '#38bdf8' : batPct > 20 ? '#f97316' : '#ef4444';
    const ledCol = isOL ? '#22c55e' : isOB ? '#f97316' : '#64748b';
    const accentCol = isOB ? '#f97316' : '#38bdf8';
    const glowRgb = isOB ? '249,115,22' : '56,189,248';
    const active = isOL || isOB;
    const kf = active ? '<defs><style>@keyframes uled{0%,100%{opacity:.4}50%{opacity:1}}</style></defs>' : '';
    const ledAnim = active ? ' style="animation:uled ' + (isOB ? '.9' : '2.5') + 's ease-in-out infinite"' : '';

    let bars = '';
    for (let seg = 0; seg < 5; seg++) {
      const barY = 52 - seg * 7;
      const filled = seg < batFilled;
      bars += '<rect x="5" y="' + barY + '" width="20" height="5" rx="1.5"'
        + ' fill="' + (filled ? batCol : 'rgba(255,255,255,.05)') + '"'
        + ' stroke="rgba(255,255,255,.08)" stroke-width=".4"/>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 78" style="display:block;width:100%;height:100%;filter:drop-shadow(0 0 10px rgba(' + glowRgb + ',.15))">'
      + kf
      + '<rect x="1" y="3" width="62" height="72" rx="5" fill="#0b1929" stroke="' + accentCol + '" stroke-opacity=".3" stroke-width=".8"/>'
      + '<rect x="1" y="3" width="62" height="20" rx="5" fill="#070f1c"/>'
      + '<rect x="1" y="17" width="62" height="6" fill="#070f1c"/>'
      + '<circle cx="13" cy="13" r="6" fill="#0a1830" stroke="' + accentCol + '" stroke-width=".7" stroke-opacity=".5"/>'
      + '<circle cx="13" cy="13" r="2.5" fill="' + (active ? accentCol : '#0a1525') + '" opacity="' + (active ? '.35' : '1') + '"/>'
      + '<line x1="13" y1="10" x2="13" y2="12.5" stroke="' + (active ? '#fff' : '#1a3050') + '" stroke-width="1.3" stroke-linecap="round"/>'
      + '<circle cx="27" cy="13" r="3" fill="' + ledCol + '"' + ledAnim + '/>'
      + '<circle cx="27" cy="13" r="1.2" fill="rgba(255,255,255,.25)"/>'
      + '<rect x="34" y="5" width="27" height="16" rx="3" fill="#020810" stroke="' + accentCol + '" stroke-width=".5" stroke-opacity=".4"/>'
      + '<text x="47.5" y="12" text-anchor="middle" font-size="4.5" font-family="monospace" font-weight="700" fill="' + accentCol + '" opacity=".6">' + (isOL ? 'ON LINE' : isOB ? 'ON BATTERY' : 'N / D') + '</text>'
      + '<text x="47.5" y="18.5" text-anchor="middle" font-size="8" font-family="monospace" font-weight="900" fill="' + (batPct != null ? batCol : '#64748b') + '">' + (batPct != null ? batPct + '%' : '—') + '</text>'
      + '<rect x="1" y="23" width="62" height=".7" fill="rgba(255,255,255,.06)"/>'
      + bars
      + '<rect x="29" y="24" width=".7" height="34" fill="rgba(255,255,255,.06)"/>'
      + '<text x="33" y="31" font-size="5" fill="rgba(255,255,255,.3)" font-family="system-ui">V-IN</text>'
      + '<text x="33" y="39" font-size="7" font-weight="800" fill="rgba(56,189,248,.6)" font-family="monospace">230V</text>'
      + '<text x="33" y="47" font-size="5" fill="rgba(255,255,255,.3)" font-family="system-ui">V-OUT</text>'
      + '<text x="33" y="55" font-size="7" font-weight="800" fill="' + (isOB ? 'rgba(249,115,22,.6)' : 'rgba(52,211,153,.55)') + '" font-family="monospace">230V</text>'
      + '<rect x="1" y="58" width="62" height=".7" fill="rgba(255,255,255,.06)"/>'
      + '<text x="5" y="65" font-size="4.5" fill="rgba(255,255,255,.2)" font-family="system-ui">USCITE</text>'
      + _socket(5, 66) + _socket(18, 66) + _socket(31, 66) + _socket(44, 66)
      + '<rect x="56" y="66" width="7" height="8" rx="1.5" fill="#060d1a" stroke="rgba(255,255,255,.1)" stroke-width=".5"/>'
      + '<rect x="57.5" y="67.5" width="4" height="5" rx=".5" fill="rgba(255,255,255,.05)"/>'
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
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(56,189,248,.08) 0%,transparent 65%);pointer-events:none}'
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
    mkOv(popShell('📊', '56,189,248', 'Storico Blackout', 'UPS Tecnoware', 'ups-st-close', content), 'ups-st-close');
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
      + '<button id="ups-ntf-save" style="width:100%;margin-top:14px;padding:12px;border-radius:12px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.3);color:#38bdf8;font-size:14px;font-weight:700;cursor:pointer">💾 Salva</button>';
    const ov = mkOv(popShell('🔔', '56,189,248', 'Notifiche Push', 'UPS Tecnoware', 'ups-ntf-close', content), 'ups-ntf-close');
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
    const content = '<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding:0 0 10px;border-bottom:1px solid rgba(56,189,248,.15);margin-bottom:12px">Soglie batteria</div>'
      + '<div style="margin-bottom:10px"><div style="font-size:12px;color:#fff;margin-bottom:5px">⚠️ Soglia avviso (%)</div>'
      + '<input id="ups-sg-av" type="number" min="0" max="100" step="1" value="' + nv(c.pk_soglia_av) + '" style="' + iBase + '"></div>'
      + '<div style="margin-bottom:16px"><div style="font-size:12px;color:#fff;margin-bottom:5px">🖥 Soglia spegnimento server (%)</div>'
      + '<input id="ups-sg-spg" type="number" min="0" max="100" step="1" value="' + nv(c.pk_soglia_spg) + '" style="' + iBase + '"></div>'
      + '<button id="ups-sg-save" style="width:100%;padding:12px;border-radius:12px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.3);color:#38bdf8;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px">💾 Salva soglie</button>'
      + '<button id="ups-sg-reset" style="width:100%;padding:11px;border-radius:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#f87171;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px">🔄 Reset contatori blackout</button>'
      + '<button id="ups-sg-cfg" style="width:100%;padding:11px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#fff;font-size:13px;font-weight:700;cursor:pointer">⚙ Configura sensori</button>';
    const ov = mkOv(popShell('⚙', '56,189,248', 'Soglie & Impostazioni', 'UPS Tecnoware', 'ups-sg-close', content), 'ups-sg-close');
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
    function field(fid, lbl2, val, hint) {
      return '<div style="margin-bottom:9px;position:relative"><label style="' + stLbl + '">' + lbl2 + (hint ? '<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">' + hint + '</span>' : '') + '</label>'
        + '<input id="' + fid + '" type="text" value="' + (val || '').replace(/"/g, '&quot;') + '" autocomplete="off" placeholder="Cerca entità…" style="' + stInp + '">'
        + '<div id="' + fid + '-d" style="' + stDrop + '"></div></div>';
    }
    const formHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label>'
      + '<input id="ups-cf-name" type="text" value="' + (cf.name || '').replace(/"/g, '&quot;') + '" placeholder="es. UPS Server" style="' + stInp.replace('monospace', 'system-ui') + '"></div>'
      + '<div style="' + stSec + '">Sensori principali</div>'
      + field('ups-cf-main',   'Sensore aggregato',      cf.pk_main,      'sensor.alimentazione_ups_tecnoware')
      + field('ups-cf-stato',  'Stato raw (OL/OB)',      cf.pk_stato,     'sensor.tecnoware_dati_di_stato')
      + field('ups-cf-tipo',   'Tipo / Modello UPS',     cf.pk_tipo,      'sensor.tecnoware_tipo_di_ups')
      + field('ups-cf-stxt',   'Stato testuale',         cf.pk_stato_txt, 'sensor.tecnoware_stato')
      + '<div style="' + stSec + '">Sensori fisici</div>'
      + field('ups-cf-batt',   'Carica batteria %',      cf.pk_batteria, 'sensor.tecnoware_carica_batterie')
      + field('ups-cf-carico', 'Carico UPS %',           cf.pk_carico,   'sensor.tecnoware_carico')
      + field('ups-cf-vin',    'Tensione ingresso',      cf.pk_vin,      'sensor.tecnoware_tensione_di_ingresso')
      + field('ups-cf-vout',   'Tensione uscita',        cf.pk_vout,     'sensor.tecnoware_tensione_di_uscita')
      + '<div style="' + stSec + '">Contatori blackout</div>'
      + field('ups-cf-bo-og',  'Blackout oggi',          cf.pk_bo_oggi,  'sensor.cicli_blackout_oggi_ups')
      + field('ups-cf-bo-me',  'Blackout mese',          cf.pk_bo_mese,  'sensor.cicli_blackout_mese_ups')
      + field('ups-cf-bo-an',  'Blackout anno',          cf.pk_bo_anno,  'sensor.cicli_blackout_anno_ups')
      + field('ups-cf-bo-tot', 'Blackout totale',        cf.pk_bo_tot,   'counter.cicli_blackout_totale_ups')
      + '<div style="' + stSec + '">Testi evento</div>'
      + field('ups-cf-dur',    'Durata ultimo blackout', cf.pk_dur_bo,    'input_text.durata_ultimo_blackout')
      + field('ups-cf-data',   'Data ultimo blackout',   cf.pk_data_bo,   'input_text.data_ultimo_blackout')
      + field('ups-cf-rip',    'Data ripristino',        cf.pk_ripristino,'input_text.data_ripristino_energia')
      + '<div style="' + stSec + '">Soglie & notifiche</div>'
      + field('ups-cf-sgav',   'Soglia avviso batt.',    cf.pk_soglia_av,  'input_number.soglia_avviso_batteria_tecnoware')
      + field('ups-cf-sgspg',  'Soglia spegni server',   cf.pk_soglia_spg, 'input_number.soglia_batteria_spegnimento_programmato_server_tecnoware')
      + field('ups-cf-nte',    'Notify energia',         cf.pk_ntf_energia,'input_boolean.notify_push_ups_tecnoware_energia')
      + field('ups-cf-ntb',    'Notify batteria',        cf.pk_ntf_batt,   'input_boolean.notify_push_ups_tecnoware_batteria_sotto_soglia')
      + field('ups-cf-nts',    'Notify spegnimento',     cf.pk_ntf_spg,    'input_boolean.notify_push_ups_tecnoware_spegni_server')
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="ups-cf-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="ups-cf-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#060d14">Salva</button>'
      + '</div>';

    const fieldIds = ['ups-cf-main','ups-cf-stato','ups-cf-tipo','ups-cf-stxt','ups-cf-batt','ups-cf-carico','ups-cf-vin','ups-cf-vout',
      'ups-cf-bo-og','ups-cf-bo-me','ups-cf-bo-an','ups-cf-bo-tot',
      'ups-cf-dur','ups-cf-data','ups-cf-rip','ups-cf-sgav','ups-cf-sgspg','ups-cf-nte','ups-cf-ntb','ups-cf-nts'];
    const ov = mkOv(popShell('🔋', '56,189,248', 'Configura UPS', card.id || '', 'ups-cf-close', formHtml), 'ups-cf-close');
    ov.querySelector('#ups-cf-cancel').addEventListener('click', function () { ov._close(); });

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
      if (a === 'soglie')    { openSogliePopup(card, el); return; }
    };
    el.addEventListener('click', el._upsHandler);
  }

  /* ── CARD DEFINITION ── */
  var CARD = {
    id: 'ups-card',
    name: 'UPS',
    icon: '🔋',
    version: '1.1',
    colSpan: 2,
    rowSpan: 3,
    frarik_no_edit: true,
    render: function (card) { return render(card); },
    mount: function (card, hass, el) { return mount(card, hass, el); },
    update: function (card, hass, el) { return update(card, hass, el); },
  };

  if (window.FratechCardRegistry && window.FratechCardRegistry.register) {
    window.FratechCardRegistry.register(CARD);
  }
})();
