/* frarik-version: 1.0 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_speedcard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function Attr(h, id, attr) { const s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes[attr] != null) ? s.attributes[attr] : null; }
  function num(v) { const x = parseFloat(String(v != null ? v : '').replace(',', '.')); return isNaN(x) ? null : x; }
  function callSvc(domain, service, data) { try { const h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch (e) {} }
  function stateObj(h, id) { return h && id && h.states && h.states[id] ? h.states[id] : null; }

  function pkDefaults() {
    return {
      pk_download: 'sensor.speedtest_download',
      pk_upload:   'sensor.speedtest_upload',
      pk_ping:     'sensor.speedtest_ping',
      pk_jitter:   'sensor.speedtest_jitter',
      pk_grade:    'sensor.speedtest_download_bufferbloat',
      pk_isp:      'sensor.speedtest_isp',
      pk_server:   'sensor.speedtest_server_name',
      pk_button:   'button.ookla_speedtest',
    };
  }

  function cfgFor(card) {
    const c = load(card), pk = pkDefaults(), r = {};
    Object.keys(pk).forEach(function (k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    r.name = c.name || 'Speedtest';
    r.max_speed = num(c.max_speed) || 500;
    return r;
  }

  function gradeCol(g) {
    if (!g) return '#64748b';
    var l = String(g).trim()[0].toUpperCase();
    if (l === 'A') return '#22c55e';
    if (l === 'B') return '#84cc16';
    if (l === 'C') return '#eab308';
    if (l === 'D') return '#f97316';
    return '#ef4444';
  }

  function gradeLetter(g) {
    if (!g) return '—';
    var l = String(g).trim()[0].toUpperCase();
    return ['A','B','C','D','F'].indexOf(l) >= 0 ? l : g.length > 1 ? g : '—';
  }

  function arcD(cx, cy, r, sDeg, eDeg) {
    var s = (sDeg - 90) * Math.PI / 180;
    var e = (eDeg - 90) * Math.PI / 180;
    var x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    var x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    var large = (eDeg - sDeg) > 180 ? 1 : 0;
    return 'M' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ',' + y2.toFixed(2);
  }

  var ARC_S = 225, ARC_SWEEP = 270;

  function speedArc(cx, cy, r, val, maxVal, col, sw) {
    var track = '<path d="' + arcD(cx, cy, r, ARC_S, ARC_S + ARC_SWEEP) + '" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="' + sw + '" stroke-linecap="round"/>';
    if (val == null || val <= 0) return track;
    var pct = Math.min(1, val / maxVal);
    var endDeg = ARC_S + pct * ARC_SWEEP;
    var fill = '<path d="' + arcD(cx, cy, r, ARC_S, endDeg) + '" fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round" filter="url(#spGlow)"/>';
    return track + fill;
  }

  function dlCol(v, maxVal) {
    if (v == null) return '#64748b';
    var p = v / maxVal;
    if (p > 0.7) return '#22c55e';
    if (p > 0.35) return '#38bdf8';
    return '#f97316';
  }

  function ulCol(v, maxVal) {
    if (v == null) return '#64748b';
    var p = v / maxVal;
    if (p > 0.7) return '#22c55e';
    if (p > 0.35) return '#a78bfa';
    return '#f97316';
  }

  function pingCol(v) {
    if (v == null) return '#64748b';
    if (v < 20) return '#22c55e';
    if (v < 50) return '#38bdf8';
    if (v < 100) return '#eab308';
    return '#ef4444';
  }

  function fmtSpeed(v) {
    if (v == null) return '—';
    return v >= 100 ? v.toFixed(0) : v.toFixed(1);
  }

  function fmtTime(h, id) {
    var s = stateObj(h, id);
    if (!s) return null;
    var ts = s.last_updated || s.last_changed;
    if (!ts) return null;
    try {
      var d = new Date(ts);
      if (isNaN(d.getTime())) return null;
      var pad = function(n) { return String(n).padStart(2, '0'); };
      return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    } catch (e) { return null; }
  }

  function _speedSVG(dl, ul, maxVal, dlC, ulC) {
    var cx = 50, cy = 52;
    var outerR = 40, innerR = 28;

    var glowDef = '<defs><filter id="spGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';

    var rings = speedArc(cx, cy, outerR, dl, maxVal, dlC, 5.5)
      + speedArc(cx, cy, innerR, ul, maxVal, ulC, 4);

    var ticks = '';
    for (var i = 0; i <= 10; i++) {
      var tdeg = ARC_S + i * (ARC_SWEEP / 10);
      var major = (i === 0 || i === 5 || i === 10);
      var tr = (tdeg - 90) * Math.PI / 180;
      var r1 = outerR + 1.5, r2 = outerR + (major ? 5 : 3);
      ticks += '<line x1="' + (cx + r1 * Math.cos(tr)).toFixed(1) + '" y1="' + (cy + r1 * Math.sin(tr)).toFixed(1)
        + '" x2="' + (cx + r2 * Math.cos(tr)).toFixed(1) + '" y2="' + (cy + r2 * Math.sin(tr)).toFixed(1)
        + '" stroke="rgba(255,255,255,' + (major ? '.35' : '.13') + ')" stroke-width="' + (major ? '.9' : '.5') + '"/>';
    }

    function tickLbl(deg, lbl) {
      var tr2 = (deg - 90) * Math.PI / 180;
      var lx = cx + (outerR + 9) * Math.cos(tr2), ly = cy + (outerR + 9) * Math.sin(tr2);
      return '<text x="' + lx.toFixed(1) + '" y="' + (ly + 1.2).toFixed(1) + '" text-anchor="middle" font-family="system-ui,sans-serif" font-size="4" fill="rgba(255,255,255,.35)">' + lbl + '</text>';
    }
    var labels = tickLbl(ARC_S, '0')
      + tickLbl(ARC_S + 135, (maxVal / 2 >= 100 ? Math.round(maxVal / 2) : (maxVal / 2).toFixed(0)) + '')
      + tickLbl(ARC_S + ARC_SWEEP, maxVal + '');

    var dlTxt = fmtSpeed(dl);
    var ulTxt = fmtSpeed(ul);

    var center = '<text x="50" y="42" text-anchor="middle" font-family="system-ui,sans-serif" font-size="5" font-weight="700" letter-spacing=".5" fill="rgba(255,255,255,.45)">DOWNLOAD</text>'
      + '<text x="50" y="54" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="900" fill="' + dlC + '">' + dlTxt + '</text>'
      + '<text x="50" y="60" text-anchor="middle" font-family="system-ui,sans-serif" font-size="4.5" font-weight="600" fill="rgba(255,255,255,.5)">Mb/s</text>'
      + '<line x1="38" y1="63" x2="62" y2="63" stroke="rgba(255,255,255,.08)" stroke-width=".5"/>'
      + '<text x="50" y="68" text-anchor="middle" font-family="system-ui,sans-serif" font-size="4.5" font-weight="700" letter-spacing=".4" fill="rgba(255,255,255,.4)">UPLOAD</text>'
      + '<text x="50" y="76" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" font-weight="800" fill="' + ulC + '">' + ulTxt + '</text>'
      + '<text x="50" y="80.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="4" font-weight="600" fill="rgba(255,255,255,.4)">Mb/s</text>';

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90" style="display:block;width:100%;height:100%;filter:drop-shadow(0 0 8px rgba(56,189,248,.12))">'
      + glowDef
      + rings
      + ticks
      + labels
      + center
      + '</svg>';
  }

  /* ── RENDER ── */
  function render(card) {
    const h = H(), c = cfgFor(card);
    const rid = 'fsp' + (card.id || Math.random().toString(36).slice(2, 8));
    const maxVal = c.max_speed;

    const dl    = num(S(h, c.pk_download));
    const ul    = num(S(h, c.pk_upload));
    const ping  = num(S(h, c.pk_ping));
    const jitter = num(S(h, c.pk_jitter));
    const rawGrade = S(h, c.pk_grade);
    const grade = gradeLetter(rawGrade);
    const grCol = gradeCol(rawGrade);
    const isp    = S(h, c.pk_isp)    || Attr(h, c.pk_download, 'isp')    || '—';
    const server = S(h, c.pk_server) || Attr(h, c.pk_download, 'server_name') || '—';
    const lastTest = fmtTime(h, c.pk_download);

    const dlC = dlCol(dl, maxVal);
    const ulC = ulCol(ul, maxVal);
    const pinC = pingCol(ping);

    const isActive = dl != null || ul != null;
    const dotCol = isActive ? '#22c55e' : '#64748b';

    const css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(56,189,248,.08) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + dotCol + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 6px;flex:1;gap:4px}'
      + '#' + rid + ' .fc-hero-img{flex:1.2;display:flex;align-items:center;justify-content:center;overflow:hidden}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:6px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:12px;overflow:hidden}'
      + '#' + rid + ' .fc-met{display:flex;align-items:center;justify-content:space-between;gap:4px}'
      + '#' + rid + ' .fc-met-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.5);flex-shrink:0}'
      + '#' + rid + ' .fc-met-v{font-size:13px;font-weight:800;text-align:right}'
      + '#' + rid + ' .fc-stats{display:flex;margin:0 14px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden}'
      + '#' + rid + ' .fc-sb{flex:1;display:flex;flex-direction:column;align-items:center;padding:7px 3px;gap:2px}'
      + '#' + rid + ' .fc-sb-sep{width:1px;background:rgba(255,255,255,.08);flex-shrink:0}'
      + '#' + rid + ' .fc-sb-n{font-size:11px;font-weight:900;height:17px;display:flex;align-items:center;justify-content:center}'
      + '#' + rid + ' .fc-sb-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px;text-align:center}'
      + '#' + rid + ' .fc-info{display:flex;flex-direction:column;gap:3px;margin:0 14px 8px}'
      + '#' + rid + ' .fc-info-row{display:flex;align-items:center;gap:6px;padding:5px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:9px}'
      + '#' + rid + ' .fc-info-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.45);flex-shrink:0;min-width:36px}'
      + '#' + rid + ' .fc-info-v{font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-btn-row{padding:0 14px 12px}'
      + '#' + rid + ' .fc-run-btn{width:100%;padding:10px;border-radius:10px;border:1px solid rgba(56,189,248,.3);background:rgba(56,189,248,.1);font-size:12px;font-weight:800;color:#38bdf8;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}'
      + '#' + rid + ' .fc-run-btn:hover{background:rgba(56,189,248,.2);border-color:rgba(56,189,248,.5)}'
      + '#' + rid + ' .fc-gear{margin-left:4px;cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      + '#' + rid + ' .fc-gear:hover{background:rgba(255,255,255,.12)}'
      + '</style>';

    const heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img">' + _speedSVG(dl, ul, maxVal, dlC, ulC) + '</div>'
      + '<div class="fc-hero-r">'
      + '<div style="display:flex;flex-direction:column;gap:2px">'
      + '<div class="fc-met-lbl">Ping</div>'
      + '<div style="display:flex;align-items:baseline;gap:3px">'
      + '<span style="font-size:28px;font-weight:900;line-height:1;color:' + pinC + '">' + (ping != null ? ping.toFixed(0) : '—') + '</span>'
      + (ping != null ? '<span style="font-size:11px;font-weight:700;color:#fff">ms</span>' : '')
      + '</div>'
      + '</div>'
      + '<div style="height:1px;background:rgba(255,255,255,.07);margin:2px 0"></div>'
      + '<div class="fc-met">'
      + '<span class="fc-met-lbl">Jitter</span>'
      + '<span class="fc-met-v" style="color:#fff">' + (jitter != null ? jitter.toFixed(1) + ' ms' : '—') + '</span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:4px">'
      + '<span class="fc-met-lbl">Bufferbloat</span>'
      + (rawGrade ? '<div style="min-width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;background:' + grCol + '22;border:1px solid ' + grCol + '55;color:' + grCol + '">' + grade + '</div>' : '<span style="font-size:13px;font-weight:800;color:#64748b">—</span>')
      + '</div>'
      + '</div>'
      + '</div>';

    const statsHtml = '<div class="fc-stats">'
      + '<div class="fc-sb"><div class="fc-sb-n" style="color:' + dlC + '">' + fmtSpeed(dl) + '</div><div class="fc-sb-l">DL Mb/s</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n" style="color:' + ulC + '">' + fmtSpeed(ul) + '</div><div class="fc-sb-l">UL Mb/s</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n" style="color:' + pinC + '">' + (ping != null ? ping.toFixed(0) : '—') + '</div><div class="fc-sb-l">Ping ms</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n" style="color:#fff">' + (jitter != null ? jitter.toFixed(1) : '—') + '</div><div class="fc-sb-l">Jitter ms</div></div>'
      + '</div>';

    const infoHtml = '<div class="fc-info">'
      + '<div class="fc-info-row"><span class="fc-info-lbl">ISP</span><span class="fc-info-v">' + isp + '</span></div>'
      + '<div class="fc-info-row"><span class="fc-info-lbl">Server</span><span class="fc-info-v">' + server + '</span></div>'
      + '</div>';

    const btnHtml = '<div class="fc-btn-row">'
      + '<div class="fc-run-btn" data-sya="run-test">⚡ Avvia Test</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">🌐</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'Speedtest') + '</div>'
      + (lastTest ? '<div class="fc-hdr-pill"><div class="fc-dot"></div>' + lastTest + '</div>' : '')
      + '<div class="fc-gear" data-sya="cfg">⚙</div>'
      + '</div>'
      + '<div class="fc-scroll">'
      + heroHtml
      + statsHtml
      + infoHtml
      + btnHtml
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

  /* ── CONFIGURE POPUP ── */
  function openCfg(card, el) {
    const h = H(), c = load(card), cf = cfgFor(card);
    const states = (h && h.states) || {};
    const allIds = Object.keys(states).sort();
    const stInp = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none';
    const stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stSec = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(56,189,248,.2)';

    function field(fid, lbl, val, hint) {
      return '<div style="margin-bottom:9px;position:relative"><label style="' + stLbl + '">' + lbl + (hint ? '<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">' + hint + '</span>' : '') + '</label><input id="' + fid + '" type="text" value="' + (val || '').replace(/"/g, '&quot;') + '" autocomplete="off" placeholder="Cerca entità…" style="' + stInp + '"><div id="' + fid + '-d" style="' + stDrop + '"></div></div>';
    }
    function numField(fid, lbl, val, hint) {
      return '<div style="margin-bottom:9px"><label style="' + stLbl + '">' + lbl + (hint ? '<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">' + hint + '</span>' : '') + '</label><input id="' + fid + '" type="number" value="' + (val || '') + '" min="1" max="10000" style="' + stInp + '"></div>';
    }

    const allFieldIds = ['fsc-dl','fsc-ul','fsc-ping','fsc-jitter','fsc-grade','fsc-isp','fsc-server','fsc-button'];

    const formHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label><input id="fsc-name" type="text" value="' + (cf.name || '').replace(/"/g, '&quot;') + '" placeholder="es. Speedtest casa" style="' + stInp.replace('monospace', 'system-ui') + '"></div>'
      + numField('fsc-maxspeed', 'Velocità massima (Mbit/s)', cf.max_speed, 'es. 500')
      + '<div style="' + stSec + '">Sensori Speedtest</div>'
      + field('fsc-dl',      'Download (Mbit/s)',   cf.pk_download, 'sensor.speedtest_download')
      + field('fsc-ul',      'Upload (Mbit/s)',     cf.pk_upload,   'sensor.speedtest_upload')
      + field('fsc-ping',    'Ping (ms)',            cf.pk_ping,     'sensor.speedtest_ping')
      + field('fsc-jitter',  'Jitter (ms)',          cf.pk_jitter,   'sensor.speedtest_jitter')
      + field('fsc-grade',   'Bufferbloat Grade',   cf.pk_grade,    'sensor.speedtest_download_bufferbloat')
      + '<div style="' + stSec + '">Info connessione</div>'
      + field('fsc-isp',    'ISP',                  cf.pk_isp,      'sensor.speedtest_isp')
      + field('fsc-server', 'Server',               cf.pk_server,   'sensor.speedtest_server_name')
      + '<div style="' + stSec + '">Azione</div>'
      + field('fsc-button', 'Pulsante avvia test',  cf.pk_button,   'button.ookla_speedtest')
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="fsc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="fsc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#060d14">Salva</button>'
      + '</div>';

    const ov = mkOv(popShell('🌐', '56,189,248', 'Configura Speedtest', card.id || '', 'fsc-cfg-close', formHtml), 'fsc-cfg-close');

    ov.querySelector('#fsc-cancel').addEventListener('click', function () { ov._close(); });

    function g(id) { const e = ov.querySelector('#' + id); return e ? e.value.trim() : ''; }

    allFieldIds.forEach(function (fid) {
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

    ov.querySelector('#fsc-save').addEventListener('click', function () {
      save(card, {
        name: g('fsc-name'),
        max_speed: g('fsc-maxspeed'),
        pk_download: g('fsc-dl'),
        pk_upload: g('fsc-ul'),
        pk_ping: g('fsc-ping'),
        pk_jitter: g('fsc-jitter'),
        pk_grade: g('fsc-grade'),
        pk_isp: g('fsc-isp'),
        pk_server: g('fsc-server'),
        pk_button: g('fsc-button'),
      });
      ov._close();
      try { el._fspSig = ''; el.innerHTML = render(card); } catch (e) {}
    });
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    const h = H(), c = cfgFor(card);
    const sig = [CARD.version, S(h, c.pk_download), S(h, c.pk_upload), S(h, c.pk_ping), S(h, c.pk_jitter), S(h, c.pk_grade)].join('|');
    if (!el.querySelector('.fc-card') || el._fspSig !== sig) {
      el._fspSig = sig;
      el.innerHTML = render(card);
    }
    mount(card, hass, el);
  }

  function mount(card, hass, el) {
    if (el._fspBound === CARD.version) return;
    el._fspBound = CARD.version;
    if (el._fspHandler) el.removeEventListener('click', el._fspHandler);
    el._fspHandler = function (e) {
      const sya = e.target.closest('[data-sya]'); if (!sya) return;
      const a = sya.dataset.sya, c = cfgFor(card);
      if (a === 'run-test') {
        callSvc('button', 'press', { entity_id: c.pk_button });
        sya.textContent = '⏳ Test avviato…';
        sya.style.opacity = '.6';
        setTimeout(function () { try { sya.textContent = '⚡ Avvia Test'; sya.style.opacity = ''; } catch (_) {} }, 3000);
        return;
      }
      if (a === 'cfg') { openCfg(card, el); return; }
    };
    el.addEventListener('click', el._fspHandler);
  }

  /* ── CARD ── */
  var CARD = {
    id: 'speedtest-card',
    name: 'Speedtest',
    icon: '🌐',
    version: '1.0',
    desc: 'Monitoraggio connessione internet: download, upload, ping, jitter e bufferbloat. Richiede integrazione Ookla Speedtest.',
    colSpan: 2,
    rowSpan: 3,
    frarik_no_edit: true,
    render: function (card) { return render(card); },
    mount: function (card, hass, el) { return mount(card, hass, el); },
    update: function (card, hass, el) { return update(card, hass, el); },
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: speedtest-card v' + CARD.version); } catch (e) {}
})();
