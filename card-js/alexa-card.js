/* frarik-version: 1.2 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_alexacard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function callSvc(d, s, data) { try { var h = H(); if (h && h.callService) h.callService(d, s, data || {}); } catch (e) {} }

  function hexRgb(hex) {
    try {
      var s = (hex || '#f472b6').replace('#', '');
      if (s.length === 3) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
      return parseInt(s.slice(0,2),16)+','+parseInt(s.slice(2,4),16)+','+parseInt(s.slice(4,6),16);
    } catch(e) { return '244,114,182'; }
  }

  function pkDefaults() { return { pk_player: 'media_player.sfera_piano_terra' }; }

  function cfgFor(card) {
    var c = load(card), pk = pkDefaults();
    return {
      pk_player: (c.pk_player !== undefined && c.pk_player !== '') ? c.pk_player : pk.pk_player,
      name:  c.name  || 'Alexa',
      color: c.color || '#f472b6',
    };
  }

  function fmtTime(s) {
    s = Math.floor(s || 0);
    return Math.floor(s/60) + ':' + (s%60 < 10 ? '0' : '') + (s%60);
  }

  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── EQUALIZER (9 HTML bars, CSS animation) ── */
  function eqBars(col, playing) {
    var base = [6, 14, 9, 20, 11, 18, 7, 16, 5];
    var peak = [22, 22, 22, 22, 22, 22, 22, 22, 22];
    var durs = ['.52', '.65', '.48', '.72', '.57', '.50', '.62', '.55', '.45'];
    var dels = ['0', '.12', '.22', '.07', '.17', '.05', '.20', '.10', '.28'];
    var kf = '', bars = '';
    base.forEach(function (h, i) {
      if (playing) kf += '@keyframes aleq' + i + '{0%,100%{height:' + h + 'px}50%{height:' + peak[i] + 'px}}';
      bars += '<div style="width:4px;flex-shrink:0;border-radius:2px;align-self:flex-end;background:' + col + ';'
        + (playing
            ? 'height:' + h + 'px;animation:aleq' + i + ' ' + durs[i] + 's ease-in-out ' + dels[i] + 's infinite;box-shadow:0 0 4px ' + col + '88'
            : 'height:' + h + 'px;opacity:.25')
        + '"></div>';
    });
    return (playing ? '<style>' + kf + '</style>' : '')
      + '<div style="display:flex;align-items:flex-end;gap:3px;height:22px">' + bars + '</div>';
  }

  /* ── VINYL SVG fallback ── */
  function vinylSVG(col, playing) {
    var spin = playing ? ';animation:alVin 3s linear infinite' : '';
    return '<svg width="68" height="68" viewBox="0 0 74 74" style="display:block' + spin + '">'
      + (playing ? '<style>@keyframes alVin{to{transform:rotate(360deg);transform-origin:37px 37px}}</style>' : '')
      + '<circle cx="37" cy="37" r="37" fill="#0d0820"/>'
      + '<circle cx="37" cy="37" r="31" fill="#140f2a"/>'
      + '<circle cx="37" cy="37" r="24" fill="#0d0820"/>'
      + '<circle cx="37" cy="37" r="18" fill="#1a1035"/>'
      + '<circle cx="37" cy="37" r="7" fill="#0d0820"/>'
      + '<circle cx="37" cy="37" r="4" fill="' + col + '"/>'
      + '<circle cx="37" cy="37" r="1.8" fill="#0d0820"/>'
      + '<path d="M37,6 A31,31 0 0,1 68,37" stroke="' + col + '" stroke-width=".8" fill="none" opacity=".5"/>'
      + '<path d="M37,68 A31,31 0 0,1 6,37"  stroke="' + col + '" stroke-width=".8" fill="none" opacity=".3"/>'
      + '</svg>';
  }

  /* ── RENDER ── */
  function render(card) {
    var h = H();
    var c = cfgFor(card);
    var rid = 'alx-' + (card.id || 'x');
    var col = c.color, rgb = hexRgb(col);
    var eid = c.pk_player;

    var state = S(h, eid) || 'unavailable';
    var attrs = (h && h.states && h.states[eid] && h.states[eid].attributes) || {};

    var isPlaying = state === 'playing';
    var isPaused  = state === 'paused';
    var isActive  = isPlaying || isPaused;

    var title   = attrs.media_title      || '';
    var artist  = attrs.media_artist     || '';
    var album   = attrs.media_album_name || '';
    var pic     = attrs.entity_picture   || '';
    var vol     = Math.round((attrs.volume_level != null ? attrs.volume_level : 0.5) * 100);
    var muted   = !!attrs.is_volume_muted;
    var shuffle = !!attrs.shuffle;
    var repeat  = attrs.repeat || 'off';
    var dur     = parseFloat(attrs.media_duration) || 0;
    var pos     = parseFloat(attrs.media_position) || 0;

    var stateLabels = { playing:'In riproduzione', paused:'In pausa', idle:'Inattivo', standby:'Standby', off:'Spento', unavailable:'Non disponibile' };
    var stateLbl = stateLabels[state] || state;
    var stateRgb = isPlaying ? rgb : isPaused ? '148,163,184' : '71,85,105';
    var stateHex = isPlaying ? col  : isPaused ? '#94a3b8'    : '#475569';

    /* ── album art (left column) ── */
    var artInner;
    if (pic) {
      var src = pic.startsWith('http') ? pic : (window.location.origin + pic);
      artInner = '<img src="' + src + '" id="aximg-' + rid + '" '
        + 'style="width:100%;height:100%;object-fit:cover;display:block;'
        + (isPlaying ? 'animation:alArtPls 2.5s ease-in-out infinite' : '') + '" '
        + 'onerror="this.style.display=\'none\';var f=document.getElementById(\'axvfb-' + rid + '\');if(f)f.style.display=\'flex\'">'
        + '<div id="axvfb-' + rid + '" style="display:none;width:100%;height:100%;align-items:center;justify-content:center">'
        + vinylSVG(col, isPlaying) + '</div>';
    } else {
      artInner = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">'
        + vinylSVG(col, isPlaying) + '</div>';
    }

    /* ── right column info ── */
    var infoRows = '';
    if (isActive && title) {
      infoRows += '<div style="font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2">' + _esc(title) + '</div>';
      if (artist) infoRows += '<div style="font-size:10px;font-weight:600;color:rgba(255,255,255,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">' + _esc(artist) + '</div>';
      if (album)  infoRows += '<div style="font-size:9px;font-weight:500;color:rgba(255,255,255,.38);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(album) + '</div>';
    } else {
      infoRows += '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.3)">' + stateLbl + '</div>';
    }
    /* progress bar inside info (only when active + duration available) */
    if (isActive && dur > 0) {
      var prog = Math.min(1, pos / dur);
      infoRows += '<div style="margin-top:5px">'
        + '<div style="height:3px;border-radius:2px;background:rgba(255,255,255,.07);overflow:hidden">'
        + '<div style="height:100%;width:' + Math.round(prog*100) + '%;background:' + col + ';border-radius:2px"></div>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;margin-top:2px">'
        + '<span style="font-size:8px;color:rgba(255,255,255,.3)">' + fmtTime(pos) + '</span>'
        + '<span style="font-size:8px;color:rgba(255,255,255,.3)">' + fmtTime(dur) + '</span>'
        + '</div></div>';
    }
    /* equalizer */
    infoRows += '<div style="margin-top:6px">' + eqBars(isActive ? col : 'rgba(255,255,255,.18)', isPlaying) + '</div>';

    /* ── controls row ── */
    var bs  = 'width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent;font-size:13px;color:rgba(255,255,255,.7)';
    var bsA = 'width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid ' + col + ';background:rgba(' + rgb + ',.22);color:' + col + ';flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent;font-size:13px;box-shadow:0 0 10px rgba(' + rgb + ',.45),inset 0 0 8px rgba(' + rgb + ',.1)';
    var bPP = 'width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid ' + col + ';background:rgba(' + rgb + ',.22);color:' + col + ';flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent;font-size:17px;box-shadow:0 0 14px rgba(' + rgb + ',.5),0 2px 10px rgba(' + rgb + ',.3)';

    var repIco = repeat === 'one' ? '🔂' : '🔁';
    var ctrlHtml = '<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;flex-shrink:0">'
      + '<div style="' + (shuffle ? bsA : bs) + '" data-axa="shuffle">⇄</div>'
      + '<div style="' + bs + '" data-axa="prev">⏮</div>'
      + '<div style="' + bs + '" data-axa="stop">⏹</div>'
      + '<div style="' + bPP + '" data-axa="pp">' + (isPlaying ? '⏸' : '▶') + '</div>'
      + '<div style="' + bs + '" data-axa="next">⏭</div>'
      + '<div style="' + (repeat !== 'off' ? bsA : bs) + '" data-axa="repeat">' + repIco + '</div>'
      + '</div>';

    /* ── volume row ── */
    var dispVol = muted ? 0 : vol;
    var volIco  = muted ? '🔇' : vol < 35 ? '🔈' : vol < 65 ? '🔉' : '🔊';
    var volHtml = '<div style="display:flex;align-items:center;gap:10px;padding:4px 14px 12px;flex-shrink:0">'
      + '<div data-axa="mute" style="cursor:pointer;font-size:15px;flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent">' + volIco + '</div>'
      + '<div data-axa="vol-track" style="flex:1;height:20px;display:flex;align-items:center;cursor:pointer;position:relative;-webkit-tap-highlight-color:transparent">'
      + '<div style="position:absolute;left:0;right:0;height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;pointer-events:none">'
      + '<div data-vol-fill style="height:100%;width:' + dispVol + '%;background:' + col + ';border-radius:2px;transition:none"></div></div>'
      + '<div data-vol-knob style="position:absolute;left:' + dispVol + '%;transform:translateX(-50%);width:12px;height:12px;border-radius:50%;background:' + col + ';box-shadow:0 0 6px rgba(' + rgb + ',.7);pointer-events:none;top:50%;margin-top:-6px;transition:none"></div>'
      + '</div>'
      + '<span data-vol-label style="font-size:9px;font-weight:700;color:rgba(255,255,255,.45);min-width:26px;text-align:right">' + (muted ? '–' : vol + '%') + '</span>'
      + '</div>';

    /* ── CSS ── */
    var css = '<style>'
      + '@keyframes alArtPls{0%,100%{box-shadow:0 0 0 2px ' + col + ',0 4px 20px rgba(' + rgb + ',.4)}50%{box-shadow:0 0 0 3px ' + col + ',0 4px 28px rgba(' + rgb + ',.6),0 0 30px rgba(' + rgb + ',.25)}}'
      + '@keyframes alDot{0%,100%{opacity:.5}50%{opacity:1}}'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:285px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:220px;background:radial-gradient(ellipse at 30% 0%,rgba(' + rgb + ',.1) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;background:rgba(' + rgb + ',.12);border:1px solid rgba(' + rgb + ',.25)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba(' + stateRgb + ',.08);border:1px solid rgba(' + stateRgb + ',.25);color:' + stateHex + '}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + stateHex + (isPlaying ? ';animation:alDot .8s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-gear{margin-left:4px;cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      + '#' + rid + ' .fc-gear:hover{background:rgba(255,255,255,.12)}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;max-height:130px}'
      + '#' + rid + ' .fc-art{width:100%;max-width:110px;aspect-ratio:1;border-radius:13px;overflow:hidden;flex-shrink:0;position:relative;'
      + (isPlaying ? 'box-shadow:0 0 0 2px ' + col + ',0 4px 20px rgba(' + rgb + ',.4);' : 'box-shadow:0 4px 14px rgba(0,0,0,.5);')
      + 'background:linear-gradient(135deg,rgba(' + rgb + ',.18),rgba(' + rgb + ',.05))'
      + '}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:4px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      + '#' + rid + ' .fc-ctrl-sep{height:1px;background:rgba(255,255,255,.06);margin:0 14px;flex-shrink:0}'
      + '#' + rid + ' [data-axa]:active{opacity:.7}'
      + '</style>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="fc-card">'
      /* header */
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">🔊</div>'
      + '<div class="fc-hdr-tit">' + _esc(c.name || 'Alexa') + '</div>'
      + '<div class="fc-pill"><div class="fc-dot"></div>' + stateLbl + '</div>'
      + '<div class="fc-gear" data-axa="cfg">⚙</div>'
      + '</div>'
      /* content */
      + '<div class="fc-scroll">'
      /* hero: art | info */
      + '<div class="fc-hero">'
      + '<div class="fc-hero-img"><div class="fc-art">' + artInner + '</div></div>'
      + '<div class="fc-hero-r">' + infoRows + '</div>'
      + '</div>'
      /* controls */
      + '<div class="fc-ctrl-sep"></div>'
      + ctrlHtml
      /* volume */
      + '<div class="fc-ctrl-sep"></div>'
      + volHtml
      + '</div>'
      + '</div>'
      + '</div>';
  }

  /* ── VOLUME DOM UPDATE (real-time, no re-render) ── */
  function applyVolUI(el, pct) {
    var fill = el.querySelector('[data-vol-fill]');
    var knob = el.querySelector('[data-vol-knob]');
    var lbl  = el.querySelector('[data-vol-label]');
    if (fill) fill.style.width  = pct + '%';
    if (knob) knob.style.left   = pct + '%';
    if (lbl)  lbl.textContent   = pct + '%';
  }

  /* ── POPUP HELPERS ── */
  function mkOv(html, closeId) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    var close = function () { try { document.body.removeChild(ov); } catch (e) {} };
    var btn = ov.querySelector('#' + closeId); if (btn) btn.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov._close = close;
    return ov;
  }

  var POP_CSS = '<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc2{overflow-y:auto;scrollbar-width:none}.fcpc2::-webkit-scrollbar{display:none}</style>';

  function popShell(icon, rgb, title, sub, closeId, content) {
    return POP_CSS + '<div style="width:100%;max-height:76vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + rgb + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.3)">' + icon + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#fff">' + title + '</div><div style="font-size:11px;color:#fff;margin-top:1px">' + sub + '</div></div>'
      + '<button id="' + closeId + '" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      + '</div>'
      + '<div class="fcpc2" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }

  /* ── CONFIG POPUP ── */
  function openCfg(card, el) {
    var h = H(), c = cfgFor(card);
    var states = (h && h.states) || {};
    var allIds = Object.keys(states).filter(function (id) { return id.startsWith('media_player.'); }).sort();
    var stInp = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    var stSec = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#f472b6;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(244,114,182,.2)';

    var COLORS = ['#f472b6','#818cf8','#38bdf8','#4ade80','#fb923c','#f87171','#facc15','#c084fc'];
    var colorPicker = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Colore accent</label>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
      + COLORS.map(function (clr) {
          return '<div data-axcol="' + clr + '" style="width:24px;height:24px;border-radius:7px;cursor:pointer;background:' + clr
            + ';border:2px solid ' + (c.color === clr ? '#fff' : 'transparent') + ';transition:border-color .1s"></div>';
        }).join('')
      + '</div></div>';

    var formHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label>'
      + '<input id="axc-name" type="text" value="' + _esc(c.name||'') + '" placeholder="es. Alexa Cucina" style="' + stInp.replace('monospace','system-ui') + '"></div>'
      + '<div style="' + stSec + '">Entità</div>'
      + '<div style="margin-bottom:9px;position:relative"><label style="' + stLbl + '">Media Player</label>'
      + '<input id="axc-player" type="text" value="' + _esc(c.pk_player||'') + '" autocomplete="off" placeholder="media_player.sfera_piano_terra" style="' + stInp + '">'
      + '<div id="axc-player-d" style="position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none"></div>'
      + '</div>'
      + '<div style="' + stSec + '">Aspetto</div>'
      + colorPicker
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="axc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="axc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#f472b6;color:#0a0614">Salva</button>'
      + '</div>';

    var ov = mkOv(popShell('🔊','244,114,182','Configura Alexa',card.id||'','axc-cfg-close',formHtml),'axc-cfg-close');
    ov.querySelector('#axc-cancel').addEventListener('click', function () { ov._close(); });

    var selColor = c.color || '#f472b6';
    ov.querySelectorAll('[data-axcol]').forEach(function (dot) {
      dot.addEventListener('click', function () {
        selColor = dot.getAttribute('data-axcol');
        ov.querySelectorAll('[data-axcol]').forEach(function (d) { d.style.borderColor = 'transparent'; });
        dot.style.borderColor = '#fff';
      });
    });

    var inp = ov.querySelector('#axc-player'), drop = ov.querySelector('#axc-player-d');
    if (inp && drop) {
      function showDrop() {
        var q = inp.value.toLowerCase().trim();
        var hits = (q ? allIds.filter(function (id) { return id.toLowerCase().includes(q); }) : allIds).slice(0,30);
        if (!hits.length) { drop.style.display='none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(function (id) {
          return '<div data-pick="'+id+'" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">'+id+'</div>';
        }).join('');
        drop.querySelectorAll('[data-pick]').forEach(function (row) {
          row.addEventListener('mousedown', function (ev) { ev.preventDefault(); inp.value=row.getAttribute('data-pick'); drop.style.display='none'; });
          row.addEventListener('mouseover', function () { row.style.background='rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout',  function () { row.style.background=''; });
        });
      }
      inp.addEventListener('focus', showDrop);
      inp.addEventListener('input', showDrop);
      inp.addEventListener('blur',  function () { setTimeout(function () { drop.style.display='none'; }, 200); });
    }

    ov.querySelector('#axc-save').addEventListener('click', function () {
      var n = ov.querySelector('#axc-name'), p = ov.querySelector('#axc-player');
      save(card, { name:n?n.value.trim():c.name, pk_player:p?p.value.trim():c.pk_player, color:selColor });
      ov._close();
      try { el._axSig=''; el.innerHTML=render(card); mount(card,null,el); } catch(e){}
    });
  }

  /* ── UPDATE ── */
  function update(card, hass, el) {
    if (el._axVolDragging) return; /* don't interrupt active volume drag */
    var h = H(), c = cfgFor(card);
    var eid = c.pk_player;
    var st = S(h, eid);
    var at = (h && h.states && h.states[eid] && h.states[eid].attributes) || {};
    var sig = [CARD.version, st, at.media_title, at.media_artist, at.entity_picture,
               Math.round((at.volume_level||0)*100), !!at.is_volume_muted,
               !!at.shuffle, at.repeat, Math.floor(at.media_position||0)].join('|');
    if (!el.querySelector('.fc-card') || el._axSig !== sig) {
      el._axSig = sig;
      el.innerHTML = render(card);
      mount(card, hass, el);
    }
  }

  /* ── MOUNT ── */
  function mount(card, hass, el) {
    if (el._axBound === CARD.version) return;
    el._axBound = CARD.version;
    if (el._axHandler) el.removeEventListener('click', el._axHandler);
    if (el._axVolMD)   el.removeEventListener('mousedown', el._axVolMD);
    if (el._axVolTS)   el.removeEventListener('touchstart', el._axVolTS);

    function eid() { return cfgFor(card).pk_player; }

    /* click: buttons */
    el._axHandler = function (e) {
      var t = e.target.closest('[data-axa]'); if (!t) return;
      var a = t.dataset.axa;
      if (a==='cfg')     { openCfg(card, el); return; }
      if (a==='pp')      { callSvc('media_player','media_play_pause',   {entity_id:eid()}); return; }
      if (a==='stop')    { callSvc('media_player','media_stop',         {entity_id:eid()}); return; }
      if (a==='prev')    { callSvc('media_player','media_previous_track',{entity_id:eid()}); return; }
      if (a==='next')    { callSvc('media_player','media_next_track',   {entity_id:eid()}); return; }
      if (a==='mute') {
        var h2=H(), at2=(h2&&h2.states&&h2.states[eid()]&&h2.states[eid()].attributes)||{};
        callSvc('media_player','volume_mute',{entity_id:eid(),is_volume_muted:!at2.is_volume_muted}); return;
      }
      if (a==='shuffle') {
        var h3=H(), at3=(h3&&h3.states&&h3.states[eid()]&&h3.states[eid()].attributes)||{};
        callSvc('media_player','shuffle_set',{entity_id:eid(),shuffle:!at3.shuffle}); return;
      }
      if (a==='repeat') {
        var h4=H(), at4=(h4&&h4.states&&h4.states[eid()]&&h4.states[eid()].attributes)||{};
        var modes=['off','all','one'], cur=at4.repeat||'off';
        callSvc('media_player','repeat_set',{entity_id:eid(),repeat:modes[(modes.indexOf(cur)+1)%modes.length]}); return;
      }
    };
    el.addEventListener('click', el._axHandler);

    /* volume drag — mouse */
    el._axVolMD = function (e) {
      var track = e.target.closest('[data-axa="vol-track"]'); if (!track) return;
      e.preventDefault();
      el._axVolDragging = true;

      function ratio(clientX) {
        var r = track.getBoundingClientRect();
        return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      }
      function setVol(clientX) {
        var pct = Math.round(ratio(clientX) * 100);
        applyVolUI(el, pct);
        clearTimeout(el._axVolTimer);
        el._axVolTimer = setTimeout(function () {
          callSvc('media_player','volume_set',{entity_id:eid(),volume_level:ratio(clientX)});
        }, 80);
      }
      setVol(e.clientX);

      function onMove(ev) { setVol(ev.clientX); }
      function onUp(ev)   {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
        clearTimeout(el._axVolTimer);
        var r = ratio(ev.clientX);
        callSvc('media_player','volume_set',{entity_id:eid(),volume_level:Math.round(r*100)/100});
        setTimeout(function(){ el._axVolDragging=false; }, 300);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    };
    el.addEventListener('mousedown', el._axVolMD);

    /* volume drag — touch */
    el._axVolTS = function (e) {
      var track = e.target.closest('[data-axa="vol-track"]'); if (!track) return;
      e.preventDefault();
      el._axVolDragging = true;

      function ratio(touch) {
        var r = track.getBoundingClientRect();
        return Math.max(0, Math.min(1, (touch.clientX - r.left) / r.width));
      }
      function setVolT(ev) {
        var t = (ev.touches||ev.changedTouches)[0]; if (!t) return;
        var pct = Math.round(ratio(t) * 100);
        applyVolUI(el, pct);
        clearTimeout(el._axVolTimer);
        el._axVolTimer = setTimeout(function () {
          callSvc('media_player','volume_set',{entity_id:eid(),volume_level:ratio(t)});
        }, 80);
      }
      setVolT(e);

      function onMove(ev) { setVolT(ev); }
      function onEnd(ev) {
        el.removeEventListener('touchmove', onMove);
        el.removeEventListener('touchend',  onEnd);
        clearTimeout(el._axVolTimer);
        var t=(ev.changedTouches||[])[0]; if(t){
          callSvc('media_player','volume_set',{entity_id:eid(),volume_level:Math.round(ratio(t)*100)/100});
        }
        setTimeout(function(){ el._axVolDragging=false; }, 300);
      }
      el.addEventListener('touchmove', onMove, {passive:false});
      el.addEventListener('touchend',  onEnd,  {once:true});
    };
    el.addEventListener('touchstart', el._axVolTS, {passive:false});
  }

  /* ── REGISTRATION ── */
  var CARD = {
    id: 'alexa-card',
    name: 'Alexa Media',
    icon: '🔊',
    version: '1.2',
    desc: 'Controllo media player Alexa/Amazon Echo: album art animata, equalizzatore, play/pausa/stop, shuffle, repeat, volume slide in tempo reale.',
    colSpan: 2,
    rowSpan: 3,
    frarik_no_edit: true,
    render: function (card)          { return render(card); },
    mount:  function (card, hass, el) { return mount(card, hass, el); },
    update: function (card, hass, el) { return update(card, hass, el); },
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: alexa-card v1.2'); } catch (e) {}
})();
