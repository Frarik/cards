/* frarik-version: 1.0 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_alexacard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function callSvc(domain, service, data) { try { var h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch (e) {} }

  function hexRgb(hex) {
    try {
      var s = hex.replace('#', '');
      if (s.length === 3) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
      return parseInt(s.slice(0,2),16)+','+parseInt(s.slice(2,4),16)+','+parseInt(s.slice(4,6),16);
    } catch(e) { return '244,114,182'; }
  }

  function pkDefaults() {
    return { pk_player: 'media_player.sfera_piano_terra' };
  }

  function cfgFor(card) {
    var c = load(card), pk = pkDefaults();
    return {
      pk_player: (c.pk_player !== undefined && c.pk_player !== '') ? c.pk_player : pk.pk_player,
      name: c.name || 'Alexa',
      color: c.color || '#f472b6',
    };
  }

  function fmtTime(s) {
    s = Math.floor(s || 0);
    var m = Math.floor(s / 60), ss = s % 60;
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  }

  /* ── EQUALIZER BARS (HTML divs, CSS animation) ── */
  function eqBars(col, playing) {
    var delays = [0, .1, .2, .07, .15, .05, .18];
    var durs   = [.5, .62, .45, .7, .55, .48, .6];
    var base   = [5, 10, 7, 13, 8, 11, 4];
    var css = '';
    var bars = '';
    delays.forEach(function (d, i) {
      var kf = '@keyframes aleq' + i + '{0%,100%{height:' + base[i] + 'px}50%{height:14px}}';
      css += kf;
      bars += '<div style="width:3px;border-radius:2px;flex-shrink:0;background:' + col + ';'
        + (playing
          ? 'height:' + base[i] + 'px;animation:aleq' + i + ' ' + durs[i] + 's ease-in-out ' + d + 's infinite'
          : 'height:' + base[i] + 'px;opacity:.35')
        + '"></div>';
    });
    return (playing ? '<style>' + css + '</style>' : '')
      + '<div style="display:flex;align-items:flex-end;gap:2px;height:14px">' + bars + '</div>';
  }

  /* ── VINYL SVG (fallback art when no entity_picture) ── */
  function vinylSVG(col, playing) {
    var spin = playing ? 'animation:alVin 3s linear infinite' : '';
    return '<svg width="74" height="74" viewBox="0 0 74 74" style="display:block;' + spin + '">'
      + (playing ? '<style>@keyframes alVin{to{transform:rotate(360deg);transform-origin:37px 37px}}</style>' : '')
      + '<circle cx="37" cy="37" r="37" fill="#0d0820"/>'
      + '<circle cx="37" cy="37" r="33" fill="#140f2a"/>'
      + '<circle cx="37" cy="37" r="26" fill="#0d0820"/>'
      + '<circle cx="37" cy="37" r="20" fill="#1a1035"/>'
      + '<circle cx="37" cy="37" r="8" fill="#0d0820"/>'
      + '<circle cx="37" cy="37" r="4.5" fill="' + col + '"/>'
      + '<circle cx="37" cy="37" r="2" fill="#0d0820"/>'
      + '<path d="M37,4 A33,33 0 0,1 70,37" stroke="' + col + '" stroke-width=".8" fill="none" opacity=".4"/>'
      + '<path d="M37,70 A33,33 0 0,1 4,37" stroke="' + col + '" stroke-width=".8" fill="none" opacity=".25"/>'
      + '</svg>';
  }

  /* ── MAIN RENDER ── */
  function render(card) {
    var h = H();
    var c = cfgFor(card);
    var rid = 'alx-' + (card.id || 'x');
    var col = c.color;
    var rgb = hexRgb(col);
    var eid = c.pk_player;

    var state = S(h, eid) || 'unavailable';
    var attrs = (h && h.states && h.states[eid] && h.states[eid].attributes) || {};

    var isPlaying = state === 'playing';
    var isPaused  = state === 'paused';
    var isActive  = isPlaying || isPaused;
    var isOff     = state === 'off' || state === 'unavailable';

    var title   = attrs.media_title || '';
    var artist  = attrs.media_artist || '';
    var album   = attrs.media_album_name || '';
    var pic     = attrs.entity_picture || '';
    var vol     = Math.round((attrs.volume_level != null ? attrs.volume_level : 0.5) * 100);
    var muted   = !!attrs.is_volume_muted;
    var shuffle = !!attrs.shuffle;
    var repeat  = attrs.repeat || 'off';
    var dur     = parseFloat(attrs.media_duration) || 0;
    var pos     = parseFloat(attrs.media_position) || 0;

    var stateLabels = { playing:'In riproduzione', paused:'In pausa', idle:'Inattivo', standby:'Standby', off:'Spento', unavailable:'Non disponibile' };
    var stateLbl = stateLabels[state] || state;
    var stateRgb = isPlaying ? rgb : isPaused ? '148,163,184' : '71,85,105';

    /* ── album art ── */
    var artHtml;
    if (pic) {
      var src = pic.startsWith('http') ? pic : (window.location.origin + pic);
      artHtml = '<div style="position:relative;flex-shrink:0;width:74px;height:74px">'
        + '<img src="' + src + '" id="aximg-' + rid + '" '
        + 'style="width:74px;height:74px;border-radius:14px;object-fit:cover;display:block;'
        + 'box-shadow:' + (isPlaying ? '0 0 0 2px ' + col + ',0 4px 20px rgba(' + rgb + ',.4)' : '0 4px 14px rgba(0,0,0,.5)') + ';'
        + (isPlaying ? 'animation:alArtPls 2.4s ease-in-out infinite' : '') + '" '
        + 'onerror="this.style.display=\'none\';var f=document.getElementById(\'axfb-' + rid + '\');if(f)f.style.display=\'flex\'">'
        + '<div id="axfb-' + rid + '" style="display:none;width:74px;height:74px;border-radius:14px;background:rgba(' + rgb + ',.1);border:1px solid rgba(' + rgb + ',.25);align-items:center;justify-content:center">'
        + vinylSVG(col, isPlaying) + '</div>'
        + '</div>';
    } else {
      artHtml = '<div style="flex-shrink:0;width:74px;height:74px;border-radius:14px;'
        + 'background:linear-gradient(135deg,rgba(' + rgb + ',.18) 0%,rgba(' + rgb + ',.06) 100%);'
        + 'border:1px solid rgba(' + rgb + ',.25);display:flex;align-items:center;justify-content:center;'
        + (isPlaying ? 'box-shadow:0 0 0 2px ' + col + ',0 0 20px rgba(' + rgb + ',.3);animation:alArtPls 2.4s ease-in-out infinite' : '') + '">'
        + vinylSVG(col, isPlaying) + '</div>';
    }

    /* ── song info ── */
    var infoHtml = '<div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:3px">';
    if (isActive && title) {
      infoHtml += '<div style="font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2">' + _esc(title) + '</div>';
      if (artist) infoHtml += '<div style="font-size:10px;font-weight:600;color:rgba(255,255,255,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(artist) + '</div>';
      if (album)  infoHtml += '<div style="font-size:9px;font-weight:500;color:rgba(255,255,255,.38);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _esc(album) + '</div>';
    } else if (isActive) {
      infoHtml += '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.45)">' + stateLbl + '</div>';
    } else {
      infoHtml += '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.25)">' + stateLbl + '</div>';
    }
    infoHtml += '<div style="margin-top:6px">' + eqBars(isActive ? col : 'rgba(255,255,255,.18)', isPlaying) + '</div>';
    infoHtml += '</div>';

    /* ── progress bar ── */
    var progressHtml = '';
    if (isActive && dur > 0) {
      var prog = Math.min(1, pos / dur);
      progressHtml = '<div style="padding:0 14px 2px;flex-shrink:0">'
        + '<div style="height:3px;border-radius:2px;background:rgba(255,255,255,.07);overflow:hidden;margin-bottom:4px">'
        + '<div style="height:100%;width:' + Math.round(prog * 100) + '%;background:' + col + ';border-radius:2px"></div>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between">'
        + '<span style="font-size:8px;color:rgba(255,255,255,.3)">' + fmtTime(pos) + '</span>'
        + '<span style="font-size:8px;color:rgba(255,255,255,.3)">' + fmtTime(dur) + '</span>'
        + '</div></div>';
    }

    /* ── controls ── */
    var bs  = 'width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent';
    var bsA = 'width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(' + rgb + ',.35);background:rgba(' + rgb + ',.12);color:' + col + ';flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent';
    var bPP = 'width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(' + rgb + ',.45);background:rgba(' + rgb + ',.18);font-size:17px;color:' + col + ';flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent;box-shadow:0 2px 12px rgba(' + rgb + ',.2)';

    var repIco = repeat === 'one' ? '🔂' : '🔁';
    var shuffleBtn = '<div style="' + (shuffle ? bsA : bs) + '" data-axa="shuffle" title="Shuffle"><span style="font-size:13px">⇄</span></div>';
    var repeatBtn  = '<div style="' + (repeat !== 'off' ? bsA : bs) + '" data-axa="repeat" title="Ripeti"><span style="font-size:12px">' + repIco + '</span></div>';

    var ctrlHtml = '<div style="display:flex;align-items:center;justify-content:center;gap:7px;padding:8px 14px 6px;flex-shrink:0">'
      + shuffleBtn
      + '<div style="' + bs + '" data-axa="prev" title="Precedente"><span style="font-size:14px">⏮</span></div>'
      + '<div style="' + bs + '" data-axa="stop" title="Stop"><span style="font-size:14px">⏹</span></div>'
      + '<div style="' + bPP + '" data-axa="pp" title="' + (isPlaying ? 'Pausa' : 'Play') + '"><span>' + (isPlaying ? '⏸' : '▶') + '</span></div>'
      + '<div style="' + bs + '" data-axa="next" title="Successivo"><span style="font-size:14px">⏭</span></div>'
      + repeatBtn
      + '</div>';

    /* ── volume slider ── */
    var dispVol = muted ? 0 : vol;
    var volIco  = muted ? '🔇' : vol < 35 ? '🔈' : vol < 65 ? '🔉' : '🔊';
    var volHtml = '<div style="display:flex;align-items:center;gap:10px;padding:4px 14px 12px;flex-shrink:0">'
      + '<div style="cursor:pointer;font-size:16px;flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent" data-axa="mute">' + volIco + '</div>'
      + '<div data-axa="vol-track" style="flex:1;height:22px;display:flex;align-items:center;cursor:pointer;position:relative;-webkit-tap-highlight-color:transparent">'
      + '<div style="position:absolute;left:0;right:0;height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;pointer-events:none">'
      + '<div style="height:100%;width:' + dispVol + '%;background:' + col + ';border-radius:2px"></div></div>'
      + '<div style="position:absolute;left:' + dispVol + '%;transform:translateX(-50%);width:12px;height:12px;border-radius:50%;background:' + col + ';box-shadow:0 0 6px rgba(' + rgb + ',.7);pointer-events:none;top:50%;margin-top:-6px"></div>'
      + '</div>'
      + '<span style="font-size:9px;font-weight:700;color:rgba(255,255,255,.45);min-width:26px;text-align:right">' + (muted ? '–' : vol + '%') + '</span>'
      + '</div>';

    /* ── CSS ── */
    var css = '<style>'
      + '@keyframes alArtPls{0%,100%{box-shadow:0 0 0 2px ' + col + ',0 4px 20px rgba(' + rgb + ',.4)}50%{box-shadow:0 0 0 3px ' + col + ',0 4px 28px rgba(' + rgb + ',.6),0 0 30px rgba(' + rgb + ',.25)}}'
      + '@keyframes alDot{0%,100%{opacity:.55}50%{opacity:1}}'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:285px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .ax-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#0a0614 0%,#0d0820 55%,#0a0614 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .ax-card::before{content:"";position:absolute;top:0;left:0;right:0;height:220px;background:radial-gradient(ellipse at 35% 0%,rgba(' + rgb + ',.1) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .ax-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .ax-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;background:rgba(' + rgb + ',.12);border:1px solid rgba(' + rgb + ',.25)}'
      + '#' + rid + ' .ax-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .ax-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba(' + stateRgb + ',.08);border:1px solid rgba(' + stateRgb + ',.25);color:rgb(' + stateRgb + ')}'
      + '#' + rid + ' .ax-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:rgb(' + stateRgb + ')' + (isPlaying ? ';animation:alDot .8s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .ax-gear{margin-left:4px;cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      + '#' + rid + ' .ax-gear:hover{background:rgba(255,255,255,.12)}'
      + '#' + rid + ' [data-axa]:active{opacity:.75}'
      + '</style>';

    return css
      + '<div id="' + rid + '">'
      + '<div class="ax-card">'
      /* header */
      + '<div class="ax-hdr">'
      + '<div class="ax-hdr-iw">🔊</div>'
      + '<div class="ax-hdr-tit">' + _esc(c.name || 'Alexa') + '</div>'
      + '<div class="ax-pill"><div class="ax-dot"></div>' + stateLbl + '</div>'
      + '<div class="ax-gear" data-axa="cfg">⚙</div>'
      + '</div>'
      /* hero: art + info */
      + '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px 10px;flex:1;min-height:0;position:relative;z-index:1">'
      + artHtml
      + infoHtml
      + '</div>'
      /* progress */
      + progressHtml
      /* controls */
      + ctrlHtml
      /* volume */
      + volHtml
      + '</div>'
      + '</div>';
  }

  function _esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

  var POP_CSS = '<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc{overflow-y:auto;scrollbar-width:none}.fcpc::-webkit-scrollbar{display:none}</style>';

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

  /* ── CONFIG POPUP ── */
  function openCfg(card, el) {
    var h = H(), c = cfgFor(card);
    var states = (h && h.states) || {};
    var allIds = Object.keys(states).filter(function (id) { return id.startsWith('media_player.'); }).sort();
    var stInp = 'width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    var stSec = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#f472b6;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(244,114,182,.2)';

    var COLORS = ['#f472b6','#818cf8','#38bdf8','#4ade80','#fb923c','#f87171','#facc15','#c084fc'];
    var colorPicker = '<div style="margin-bottom:10px">'
      + '<label style="' + stLbl + '">Colore accent</label>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
      + COLORS.map(function (clr) {
          return '<div data-axcol="' + clr + '" style="width:24px;height:24px;border-radius:7px;cursor:pointer;background:' + clr
            + ';border:2px solid ' + (c.color === clr ? '#fff' : 'transparent')
            + ';transition:border-color .1s" title="' + clr + '"></div>';
        }).join('')
      + '</div></div>';

    var formHtml = '<div style="margin-bottom:10px"><label style="' + stLbl + '">Nome card</label>'
      + '<input id="axc-name" type="text" value="' + _esc(c.name || '') + '" placeholder="es. Alexa Cucina" style="' + stInp.replace('monospace','system-ui') + '"></div>'
      + '<div style="' + stSec + '">Entità</div>'
      + '<div style="margin-bottom:9px;position:relative"><label style="' + stLbl + '">Media Player</label>'
      + '<input id="axc-player" type="text" value="' + _esc(c.pk_player || '') + '" autocomplete="off" placeholder="media_player.sfera_piano_terra" style="' + stInp + '">'
      + '<div id="axc-player-d" style="position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none"></div>'
      + '</div>'
      + '<div style="' + stSec + '">Aspetto</div>'
      + colorPicker
      + '<div style="display:flex;gap:8px;margin-top:16px">'
      + '<button id="axc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      + '<button id="axc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#f472b6;color:#0a0614">Salva</button>'
      + '</div>';

    var ov = mkOv(popShell('🔊', '244,114,182', 'Configura Alexa', card.id || '', 'axc-cfg-close', formHtml), 'axc-cfg-close');
    ov.querySelector('#axc-cancel').addEventListener('click', function () { ov._close(); });

    /* color picker */
    var selColor = c.color || '#f472b6';
    ov.querySelectorAll('[data-axcol]').forEach(function (dot) {
      dot.addEventListener('click', function () {
        selColor = dot.getAttribute('data-axcol');
        ov.querySelectorAll('[data-axcol]').forEach(function (d) { d.style.borderColor = 'transparent'; });
        dot.style.borderColor = '#fff';
      });
    });

    /* entity autocomplete */
    var inp = ov.querySelector('#axc-player'), drop = ov.querySelector('#axc-player-d');
    if (inp && drop) {
      function showDrop() {
        var q = inp.value.toLowerCase().trim();
        var hits = (q ? allIds.filter(function (id) { return id.toLowerCase().includes(q); }) : allIds).slice(0, 30);
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
    }

    ov.querySelector('#axc-save').addEventListener('click', function () {
      var nameEl = ov.querySelector('#axc-name'), playerEl = ov.querySelector('#axc-player');
      save(card, { name: nameEl ? nameEl.value.trim() : c.name, pk_player: playerEl ? playerEl.value.trim() : c.pk_player, color: selColor });
      ov._close();
      try { el._axSig = ''; el.innerHTML = render(card); mount(card, null, el); } catch (e) {}
    });
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    var h = H(), c = cfgFor(card);
    var eid = c.pk_player;
    var st  = S(h, eid);
    var at  = (h && h.states && h.states[eid] && h.states[eid].attributes) || {};
    var sig = [CARD.version, st, at.media_title, at.media_artist, at.entity_picture,
               at.volume_level, at.is_volume_muted, at.shuffle, at.repeat, at.media_position].join('|');
    if (!el.querySelector('.ax-card') || el._axSig !== sig) {
      el._axSig = sig;
      el.innerHTML = render(card);
      mount(card, hass, el);
    }
  }

  function mount(card, hass, el) {
    if (el._axBound === CARD.version) return;
    el._axBound = CARD.version;
    if (el._axHandler) el.removeEventListener('click', el._axHandler);
    if (el._axVolMD)   el.removeEventListener('mousedown', el._axVolMD);
    if (el._axVolTS)   el.removeEventListener('touchstart', el._axVolTS);

    function eid() { return cfgFor(card).pk_player; }

    el._axHandler = function (e) {
      var t = e.target.closest('[data-axa]'); if (!t) return;
      var a = t.dataset.axa;
      if (a === 'cfg')     { openCfg(card, el); return; }
      if (a === 'pp')      { callSvc('media_player','media_play_pause',{entity_id:eid()}); return; }
      if (a === 'stop')    { callSvc('media_player','media_stop',{entity_id:eid()}); return; }
      if (a === 'prev')    { callSvc('media_player','media_previous_track',{entity_id:eid()}); return; }
      if (a === 'next')    { callSvc('media_player','media_next_track',{entity_id:eid()}); return; }
      if (a === 'mute') {
        var h2 = H(), at2 = (h2 && h2.states && h2.states[eid()] && h2.states[eid()].attributes) || {};
        callSvc('media_player','volume_mute',{entity_id:eid(),is_volume_muted:!at2.is_volume_muted});
        return;
      }
      if (a === 'shuffle') {
        var h3 = H(), at3 = (h3 && h3.states && h3.states[eid()] && h3.states[eid()].attributes) || {};
        callSvc('media_player','shuffle_set',{entity_id:eid(),shuffle:!at3.shuffle});
        return;
      }
      if (a === 'repeat') {
        var h4 = H(), at4 = (h4 && h4.states && h4.states[eid()] && h4.states[eid()].attributes) || {};
        var modes = ['off','all','one'], cur = at4.repeat || 'off';
        callSvc('media_player','repeat_set',{entity_id:eid(),repeat:modes[(modes.indexOf(cur)+1)%modes.length]});
        return;
      }
    };
    el.addEventListener('click', el._axHandler);

    /* ── volume drag (mouse) ── */
    function setVol(clientX, track) {
      var rect = track.getBoundingClientRect();
      var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      callSvc('media_player','volume_set',{entity_id:eid(),volume_level:Math.round(ratio*100)/100});
    }

    el._axVolMD = function (e) {
      var track = e.target.closest('[data-axa="vol-track"]'); if (!track) return;
      e.preventDefault();
      setVol(e.clientX, track);
      function onMove(ev) { setVol(ev.clientX, track); }
      function onUp() { document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); }
      document.addEventListener('mousemove',onMove);
      document.addEventListener('mouseup',onUp);
    };
    el.addEventListener('mousedown', el._axVolMD);

    /* ── volume drag (touch) ── */
    el._axVolTS = function (e) {
      var track = e.target.closest('[data-axa="vol-track"]'); if (!track) return;
      e.preventDefault();
      function setVolT(ev) { var t = (ev.touches||ev.changedTouches)[0]; if(t) setVol(t.clientX,track); }
      setVolT(e);
      function onMove(ev) { setVolT(ev); }
      function onEnd() { el.removeEventListener('touchmove',onMove); el.removeEventListener('touchend',onEnd); }
      el.addEventListener('touchmove',onMove,{passive:false});
      el.addEventListener('touchend',onEnd,{once:true});
    };
    el.addEventListener('touchstart', el._axVolTS, {passive:false});
  }

  /* ── CARD REGISTRATION ── */
  var CARD = {
    id: 'alexa-card',
    name: 'Alexa Media',
    icon: '🔊',
    version: '1.0',
    desc: 'Controllo media player Alexa/Amazon Echo: riproduzione, volume, traccia, shuffle, repeat e album art animata. Configura con ⚙.',
    colSpan: 2,
    rowSpan: 3,
    frarik_no_edit: true,
    render: function (card) { return render(card); },
    mount:  function (card, hass, el) { return mount(card, hass, el); },
    update: function (card, hass, el) { return update(card, hass, el); },
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: alexa-card v' + CARD.version); } catch (e) {}
})();
