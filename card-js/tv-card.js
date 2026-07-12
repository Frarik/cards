/* frarik-version: 1.0 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_tvcard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function Attr(h, id, k) { var s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes[k] != null) ? s.attributes[k] : null; }
  function callSvc(d, s, data) { try { var h = H(); if (h && h.callService) h.callService(d, s, data || {}); } catch (e) {} }
  function isBool(v) { return v === true || v === 'true'; }
  function _esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function hexRgb(hex) {
    try {
      var s = (hex || '#38bdf8').replace('#', '');
      if (s.length === 3) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
      return parseInt(s.slice(0,2),16)+','+parseInt(s.slice(2,4),16)+','+parseInt(s.slice(4,6),16);
    } catch(e) { return '56,189,248'; }
  }

  function cfgFor(card) {
    var c = load(card);
    return {
      pk_tv:       (c.pk_tv       && c.pk_tv       !== '') ? c.pk_tv       : 'media_player.tv_sala_2',
      pk_remote:   (c.pk_remote   && c.pk_remote   !== '') ? c.pk_remote   : '',
      pk_soundbar: (c.pk_soundbar && c.pk_soundbar !== '') ? c.pk_soundbar : '',
      name:        c.name  || 'TV',
      color:       c.color || '#38bdf8',
      nav_up:    c.nav_up    || 'UP',
      nav_down:  c.nav_down  || 'DOWN',
      nav_left:  c.nav_left  || 'LEFT',
      nav_right: c.nav_right || 'RIGHT',
      nav_ok:    c.nav_ok    || 'ENTER',
      nav_back:  c.nav_back  || 'BACK',
      nav_home:  c.nav_home  || 'HOME',
      nav_menu:  c.nav_menu  || 'MENU',
    };
  }

  /* ── TV SVG (fallback no art) ── */
  function tvSVG(col, rgb, isOn, isPlaying) {
    var scan = isPlaying
      ? '<style>@keyframes tvSc{0%{opacity:.7;transform:translateY(0)}80%{opacity:0}100%{opacity:0;transform:translateY(36px)}}</style>'
        + '<rect x="5" y="5" width="58" height="2" rx="1" fill="rgba('+rgb+',.6)" style="animation:tvSc 2.2s linear infinite"/>'
      : '';
    var screen = isOn
      ? '<rect x="4" y="4" width="60" height="40" rx="3" fill="rgba('+rgb+',.07)"/>' + scan
      : '<rect x="4" y="4" width="60" height="40" rx="3" fill="#020810"/>'
        + '<line x1="28" y1="24" x2="40" y2="24" stroke="rgba(255,255,255,.08)" stroke-width="1.5"/>'
        + '<line x1="34" y1="18" x2="34" y2="30" stroke="rgba(255,255,255,.08)" stroke-width="1.5"/>';
    return '<svg viewBox="0 0 68 58" style="width:74px;height:62px;display:block;margin:auto">'
      + '<style>@keyframes tvGlw{0%,100%{filter:drop-shadow(0 0 4px rgba('+rgb+',.5))}50%{filter:drop-shadow(0 0 8px rgba('+rgb+',.8))}}</style>'
      + '<rect x="1" y="1" width="66" height="48" rx="7" fill="#030c1c" stroke="'+col+'" stroke-width="'+(isOn?'1.8':'0.5')+'" opacity="'+(isOn?'1':'.35')+'"'+(isOn?' style="animation:tvGlw 2.5s ease-in-out infinite"':'')+'/>'
      + screen
      + '<rect x="29" y="50" width="10" height="5" rx="1" fill="rgba(255,255,255,.09)"/>'
      + '<rect x="12" y="55" width="44" height="3" rx="1.5" fill="rgba(255,255,255,.06)"/>'
      + '<circle cx="62" cy="7" r="3.5" fill="'+(isOn?col:'rgba(255,255,255,.12)')+'"'
        + (isOn?' style="filter:drop-shadow(0 0 4px '+col+')"':'') + '/>'
      + '</svg>';
  }

  /* ── RENDER ── */
  function render(card) {
    var h = H(), c = cfgFor(card), cid = card.id || 'x', rid = 'tv-' + cid;
    var col = c.color, rgb = hexRgb(col);
    var tvEid = c.pk_tv, sbEid = c.pk_soundbar, remEid = c.pk_remote;

    var tvState  = S(h, tvEid) || 'unavailable';
    var tvAttrs  = (h && h.states && h.states[tvEid] && h.states[tvEid].attributes) || {};
    var isOn     = tvState !== 'off' && tvState !== 'unavailable' && tvState !== 'standby';
    var isPlay   = tvState === 'playing';
    var isPause  = tvState === 'paused';

    var pic       = tvAttrs.entity_picture || '';
    var mediaTitle = tvAttrs.media_title || tvAttrs.app_name || '';
    var source    = tvAttrs.source || '';
    var sourceList = tvAttrs.source_list || [];
    var tvVol     = Math.round((tvAttrs.volume_level != null ? tvAttrs.volume_level : 0.5) * 100);
    var tvMuted   = isBool(tvAttrs.is_volume_muted);

    var sbState  = sbEid ? (S(h, sbEid) || 'unavailable') : null;
    var sbAttrs  = (sbEid && h && h.states && h.states[sbEid] && h.states[sbEid].attributes) || {};
    var sbVol    = sbEid ? Math.round((sbAttrs.volume_level != null ? sbAttrs.volume_level : 0.5) * 100) : 0;
    var sbMuted  = isBool(sbAttrs.is_volume_muted);
    var sbOn     = sbState && sbState !== 'off' && sbState !== 'unavailable';

    var stLbls = { playing:'In riproduzione', paused:'In pausa', idle:'Accesa', on:'Accesa', standby:'Standby', off:'Spenta', unavailable:'Non disponibile' };
    var stateLbl = stLbls[tvState] || tvState;
    var stateHex = isPlay ? col : isPause ? '#f59e0b' : isOn ? '#4ade80' : '#475569';
    var stateRgb = isPlay ? rgb : isPause ? '245,158,11' : isOn ? '74,222,128' : '71,85,105';

    /* art */
    var artContent;
    if (pic && isOn) {
      var src = pic.startsWith('http') ? pic : (window.location.origin + pic);
      artContent = '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:10px;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'
        + '<div style="display:none;width:100%;height:100%;align-items:center;justify-content:center">' + tvSVG(col, rgb, isOn, isPlay) + '</div>';
    } else {
      artContent = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">' + tvSVG(col, rgb, isOn, isPlay) + '</div>';
    }

    /* right info */
    var infoRows = '';
    if (isOn && mediaTitle) {
      infoRows += '<div style="font-size:12px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3">' + _esc(mediaTitle) + '</div>';
    }
    if (isOn && source) {
      infoRows += '<div style="font-size:10px;font-weight:600;color:rgba(255,255,255,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">' + _esc(source) + '</div>';
    }
    if (!isOn || (!mediaTitle && !source)) {
      infoRows += '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.25)">' + stateLbl + '</div>';
    }
    /* source pill */
    if (isOn && sourceList.length) {
      infoRows += '<div data-axa="source-open" style="margin-top:6px;display:flex;align-items:center;gap:5px;cursor:pointer;padding:3px 8px;border-radius:7px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);overflow:hidden;user-select:none">'
        + '<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.35);flex-shrink:0">INGRESSO</span>'
        + '<span style="font-size:10px;font-weight:600;color:#fff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _esc(source || '—') + '</span>'
        + '<span style="font-size:10px;color:rgba(255,255,255,.4);flex-shrink:0">▾</span>'
        + '</div>';
    }
    /* soundbar state chip */
    if (sbEid) {
      var sbLbl = sbAttrs.friendly_name || 'Soundbar';
      infoRows += '<div style="margin-top:6px;display:flex;align-items:center;gap:5px;padding:3px 8px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)">'
        + '<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.3);flex-shrink:0">SB</span>'
        + '<span style="font-size:10px;font-weight:600;color:rgba(255,255,255,'+(sbOn?'.8':'.25')+')">' + (sbOn ? '▶ Attiva' : '● Spenta') + '</span>'
        + '</div>';
    }

    /* button style helpers */
    var bBase = 'display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:10px;user-select:none;-webkit-tap-highlight-color:transparent;transition:opacity .1s';
    var bSm   = bBase + ';width:36px;height:36px;font-size:15px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);flex-shrink:0';
    var bMd   = bBase + ';width:42px;height:42px;font-size:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);flex-shrink:0';
    var bOK   = bBase + ';width:52px;height:52px;font-size:13px;font-weight:800;background:rgba('+rgb+',.18);border:2px solid '+col+';color:'+col+';box-shadow:0 0 14px rgba('+rgb+',.35);flex-shrink:0';
    var bPow  = 'display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:800;user-select:none;-webkit-tap-highlight-color:transparent;flex:1;'
      + (isOn ? 'background:rgba('+rgb+',.18);border:1px solid '+col+';color:'+col+';box-shadow:0 0 12px rgba('+rgb+',.3)'
              : 'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6)');
    var bMute = 'display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;user-select:none;-webkit-tap-highlight-color:transparent;flex:1;'
      + (tvMuted ? 'background:rgba(248,113,113,.18);border:1px solid #f87171;color:#f87171'
                 : 'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.6)');

    /* nav button common style */
    var bNav = bBase + ';width:44px;height:44px;font-size:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#fff;flex-shrink:0';
    var bNavSm = bBase + ';flex:1;height:36px;font-size:11px;font-weight:700;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.65)';

    /* nav disabled overlay if no remote */
    var navDim = remEid ? '' : ';opacity:.32;pointer-events:none';

    /* playback button */
    var bPlay = bBase + ';width:44px;height:44px;font-size:18px;background:rgba('+rgb+',.18);border:1px solid '+col+';color:'+col+';box-shadow:0 0 10px rgba('+rgb+',.3)';
    var bPb   = bBase + ';width:38px;height:38px;font-size:15px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7)';

    /* vol slider helper */
    function volRow(labelIco, pct, muted, volFillId, volKnobId, volLabelId, axa, muteAxa, color, colorRgb) {
      var disp = muted ? 0 : pct;
      return '<div style="display:flex;align-items:center;gap:8px;padding:2px 14px 4px;flex-shrink:0">'
        + '<div style="font-size:12px;flex-shrink:0;color:rgba(255,255,255,.5)">' + labelIco + '</div>'
        + '<div data-axa="' + muteAxa + '" style="cursor:pointer;font-size:13px;flex-shrink:0;color:' + (muted ? '#f87171' : 'rgba(255,255,255,.55)') + '";user-select:none>'
          + (muted ? '🔇' : '🔊') + '</div>'
        + '<div data-axa="' + axa + '" style="flex:1;height:20px;display:flex;align-items:center;cursor:pointer;position:relative;-webkit-tap-highlight-color:transparent">'
        + '<div style="position:absolute;left:0;right:0;height:4px;border-radius:2px;background:rgba(255,255,255,.09);overflow:hidden;pointer-events:none">'
        + '<div id="' + volFillId + '" style="height:100%;width:' + disp + '%;background:' + color + ';border-radius:2px;transition:none"></div></div>'
        + '<div id="' + volKnobId + '" style="position:absolute;left:' + disp + '%;transform:translateX(-50%);width:11px;height:11px;border-radius:50%;background:' + color + ';box-shadow:0 0 5px rgba('+colorRgb+',.6);pointer-events:none;top:50%;margin-top:-5.5px;transition:none"></div>'
        + '</div>'
        + '<span id="' + volLabelId + '" style="font-size:9px;font-weight:700;color:rgba(255,255,255,.4);min-width:26px;text-align:right">' + (muted ? '–' : pct + '%') + '</span>'
        + '</div>';
    }

    /* ── CSS ── */
    var css = '<style>'
      + '@keyframes tvDot{0%,100%{opacity:.5}50%{opacity:1}}'
      + '@keyframes tvPls{0%,100%{box-shadow:0 0 0 1px '+col+',0 4px 18px rgba('+rgb+',.3)}50%{box-shadow:0 0 0 2px '+col+',0 4px 24px rgba('+rgb+',.5),0 0 26px rgba('+rgb+',.2)}}'
      + '#'+rid+'{position:relative;width:100%;height:100%;min-height:490px;font-family:system-ui,sans-serif;display:block}'
      + '#'+rid+' .fc-card{display:flex;flex-direction:column;height:100%;min-height:490px;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#'+rid+' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 35% 0%,rgba('+rgb+',.1) 0%,transparent 65%);pointer-events:none}'
      + '#'+rid+' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#'+rid+' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;background:rgba('+rgb+',.12);border:1px solid rgba('+rgb+',.25)}'
      + '#'+rid+' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}'
      + '#'+rid+' .fc-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba('+stateRgb+',.08);border:1px solid rgba('+stateRgb+',.25);color:'+stateHex+'}'
      + '#'+rid+' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:'+stateHex+(isPlay?';animation:tvDot .8s ease-in-out infinite':'')+'}'
      + '#'+rid+' .fc-gear{margin-left:4px;cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      + '#'+rid+' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#'+rid+' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#'+rid+' .fc-hero{display:flex;align-items:center;padding:10px 14px 8px;gap:0}'
      + '#'+rid+' .fc-art{width:90px;height:80px;border-radius:10px;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,rgba('+rgb+',.15),rgba('+rgb+',.04));'+(isOn&&isPlay?'box-shadow:0 0 0 1.5px '+col+',0 4px 16px rgba('+rgb+',.4);animation:tvPls 2.5s ease-in-out infinite':'box-shadow:0 4px 12px rgba(0,0,0,.5)')+'}'
      + '#'+rid+' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0;padding-left:11px;border-left:1px solid rgba(255,255,255,.07)}'
      + '#'+rid+' .fc-sep{height:1px;background:rgba(255,255,255,.06);margin:0 14px;flex-shrink:0}'
      + '#'+rid+' .fc-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:rgba(255,255,255,.28);padding:6px 14px 2px;flex-shrink:0}'
      + '#'+rid+' [data-axa]:active{opacity:.65}'
      + (!remEid ? '#'+rid+' .nav-pad{opacity:.3}' : '')
      + '</style>';

    /* power + mute + source row */
    var ctrlRow = '<div style="display:flex;gap:7px;padding:6px 14px;flex-shrink:0">'
      + '<div style="'+bPow+'" data-axa="power">⏻ ' + (isOn ? 'Spegni' : 'Accendi') + '</div>'
      + '<div style="'+bMute+'" data-axa="mute-tv">' + (tvMuted ? '🔇 Muto' : '🔊 Audio') + '</div>'
      + (sourceList.length ? '<div style="'+bNavSm+';flex-shrink:0;width:auto;padding:0 12px" data-axa="source-open">📥 ▾</div>' : '')
      + '</div>';

    /* volume +/- row (TV) */
    var volBtnRow = '<div style="display:flex;align-items:center;gap:6px;padding:0 14px 4px;flex-shrink:0">'
      + '<span style="font-size:9px;font-weight:700;color:rgba(255,255,255,.3);min-width:16px">TV</span>'
      + '<div style="'+bSm+'" data-axa="vol-down-tv">🔉</div>'
      + volRow('', tvVol, tvMuted, 'tvvf-'+rid, 'tvvk-'+rid, 'tvvl-'+rid, 'vol-track-tv', 'mute-tv-sl', col, rgb)
        .replace('<div style="display:flex;', '<div style="flex:1;display:flex;').replace('padding:2px 14px 4px;','padding:0;')
      + '<div style="'+bSm+'" data-axa="vol-up-tv">🔊</div>'
      + '</div>';

    var sbVolBtnRow = '';
    if (sbEid) {
      sbVolBtnRow = '<div style="display:flex;align-items:center;gap:6px;padding:0 14px 6px;flex-shrink:0">'
        + '<span style="font-size:9px;font-weight:700;color:rgba(255,255,255,.3);min-width:16px">SB</span>'
        + '<div style="'+bSm+'" data-axa="vol-down-sb">🔉</div>'
        + volRow('', sbVol, sbMuted, 'sbvf-'+rid, 'sbvk-'+rid, 'sbvl-'+rid, 'vol-track-sb', 'mute-sb', col, rgb)
          .replace('<div style="display:flex;', '<div style="flex:1;display:flex;').replace('padding:2px 14px 4px;','padding:0;')
        + '<div style="'+bSm+'" data-axa="vol-up-sb">🔊</div>'
        + '</div>';
    }

    /* D-pad + nav */
    var dpadHtml = '<div class="nav-pad" style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:6px 14px 4px;flex-shrink:0">'
      /* row 1 */
      + '<div style="'+bNav+navDim+'" data-axa="nav-up">▲</div>'
      /* row 2 */
      + '<div style="display:flex;align-items:center;gap:5px">'
      + '<div style="'+bNav+navDim+'" data-axa="nav-left">◀</div>'
      + '<div style="'+bOK+navDim+'" data-axa="nav-ok">OK</div>'
      + '<div style="'+bNav+navDim+'" data-axa="nav-right">▶</div>'
      + '</div>'
      /* row 3 */
      + '<div style="'+bNav+navDim+'" data-axa="nav-down">▼</div>'
      + '</div>'
      /* home / back / menu */
      + '<div style="display:flex;gap:6px;padding:0 14px 6px;flex-shrink:0">'
      + '<div style="'+bNavSm+navDim+'" data-axa="nav-back">← BACK</div>'
      + '<div style="'+bNavSm+navDim+'" data-axa="nav-home">⌂ HOME</div>'
      + '<div style="'+bNavSm+navDim+'" data-axa="nav-menu">☰ MENU</div>'
      + '</div>'
      + (!remEid ? '<div style="font-size:9px;color:rgba(255,255,255,.28);text-align:center;padding:0 14px 4px">Configura entità remote in ⚙ per usare la navigazione</div>' : '');

    /* playback row */
    var pbRow = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:4px 14px 8px;flex-shrink:0">'
      + '<div style="'+bPb+'" data-axa="prev">⏮</div>'
      + '<div style="'+bPlay+'" data-axa="pp">'+(isPlay?'⏸':'▶')+'</div>'
      + '<div style="'+bPb+'" data-axa="next">⏭</div>'
      + '<div style="'+bPb+'" data-axa="stop">⏹</div>'
      + '<div style="'+bPb+'" data-axa="ch-up">⬆</div>'
      + '<div style="'+bPb+'" data-axa="ch-down">⬇</div>'
      + '</div>';

    return css
      + '<div id="'+rid+'">'
      + '<div class="fc-card">'
      /* header */
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">📺</div>'
      + '<div class="fc-hdr-tit" data-axa="rename">'+_esc(c.name||'TV')+'</div>'
      + '<div class="fc-pill"><div class="fc-dot"></div>'+stateLbl+'</div>'
      + '<div class="fc-gear" data-axa="cfg">⚙</div>'
      + '</div>'
      /* scroll area */
      + '<div class="fc-scroll">'
      /* hero */
      + '<div class="fc-hero">'
      + '<div class="fc-art">'+artContent+'</div>'
      + '<div class="fc-hero-r">'+infoRows+'</div>'
      + '</div>'
      + '<div class="fc-sep"></div>'
      /* power + mute + source */
      + ctrlRow
      + '<div class="fc-sep"></div>'
      /* d-pad */
      + dpadHtml
      + '<div class="fc-sep"></div>'
      /* playback */
      + pbRow
      + '<div class="fc-sep"></div>'
      /* volume rows */
      + '<div style="padding-top:2px">'
      + volBtnRow
      + sbVolBtnRow
      + '</div>'
      + '</div>'/* fc-scroll */
      + '</div>'/* fc-card */
      + '</div>';
  }

  /* ── VOL DOM update ── */
  function applyVolUI(el, fillId, knobId, labelId, pct) {
    var f=document.getElementById(fillId), k=document.getElementById(knobId), l=document.getElementById(labelId);
    if(f) f.style.width=pct+'%'; if(k) k.style.left=pct+'%'; if(l) l.textContent=pct+'%';
  }

  /* ── POPUP HELPERS ── */
  function mkOv(html, closeId) {
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML=html; document.body.appendChild(ov);
    var close=function(){try{document.body.removeChild(ov);}catch(e){}};
    var btn=ov.querySelector('#'+closeId); if(btn) btn.addEventListener('click',close);
    ov.addEventListener('click',function(e){if(e.target===ov)close();});
    ov._close=close; return ov;
  }

  var POP_CSS='<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc{overflow-y:auto;scrollbar-width:none}.fcpc::-webkit-scrollbar{display:none}</style>';

  function popShell(icon, rgb, title, sub, closeId, content) {
    return POP_CSS+'<div style="width:100%;max-height:76vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba('+rgb+',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      +'<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba('+rgb+',.15);border:1px solid rgba('+rgb+',.3)">'+icon+'</div>'
      +'<div><div style="font-size:14px;font-weight:800;color:#fff">'+title+'</div><div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:1px">'+sub+'</div></div>'
      +'<button id="'+closeId+'" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      +'</div>'
      +'<div class="fcpc" style="flex:1;overflow-y:auto;padding:0;display:flex;flex-direction:column">'+content+'</div>'
      +'</div>';
  }

  /* ── SOURCE PICKER ── */
  function openSourcePicker(card, el) {
    var h=H(), c=cfgFor(card), eid=c.pk_tv;
    var attrs=(h&&h.states&&h.states[eid]&&h.states[eid].attributes)||{};
    var sources=attrs.source_list||[], curSrc=attrs.source||'', col=c.color, rgb=hexRgb(col);
    var listHtml = sources.length
      ? sources.map(function(src){
          var active=src===curSrc;
          return '<div data-src="'+_esc(src)+'" style="padding:12px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.05);'+(active?'background:rgba('+rgb+',.1);':'')+'">'
            +'<span style="font-size:14px;width:18px;color:'+col+'">'+(active?'▶':'')+' </span>'
            +'<span style="font-size:12px;font-weight:'+(active?'800':'500')+';color:'+(active?col:'#fff')+'">'+_esc(src)+'</span>'
            +'</div>';
        }).join('')
      : '<div style="padding:20px;text-align:center;color:rgba(255,255,255,.35);font-size:12px">Nessuna sorgente disponibile</div>';
    var ov=mkOv(popShell('📥',rgb,'Sorgente / Ingresso',_esc(curSrc||'—'),'tvsrc-close',listHtml),'tvsrc-close');
    ov.querySelectorAll('[data-src]').forEach(function(row){
      row.addEventListener('mouseover',function(){row.style.background='rgba(255,255,255,.05)';});
      row.addEventListener('mouseout', function(){row.style.background=(row.getAttribute('data-src')===curSrc?'rgba('+rgb+',.1)':'');});
      row.addEventListener('click',function(){callSvc('media_player','select_source',{entity_id:c.pk_tv,source:row.getAttribute('data-src')});ov._close();});
    });
  }

  /* ── CONFIG POPUP ── */
  function openCfg(card, el) {
    var h=H(), c=cfgFor(card);
    var states=(h&&h.states)||{};
    var mpIds=Object.keys(states).filter(function(id){return id.startsWith('media_player.');}).sort();
    var remIds=Object.keys(states).filter(function(id){return id.startsWith('remote.');}).sort();
    var stInp='width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stLbl='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    var stSec='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(56,189,248,.2)';
    var COLORS=['#38bdf8','#818cf8','#f472b6','#4ade80','#fb923c','#f87171','#facc15','#c084fc'];
    var colorPicker='<div style="margin-bottom:10px"><label style="'+stLbl+'">Colore accent</label>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +COLORS.map(function(clr){return '<div data-col="'+clr+'" style="width:24px;height:24px;border-radius:7px;cursor:pointer;background:'+clr+';border:2px solid '+(c.color===clr?'#fff':'transparent')+';transition:border-color .1s"></div>';}).join('')
      +'</div></div>';
    function fldAC(fid,lbl,val,ph,ids){
      return '<div style="margin-bottom:9px;position:relative"><label style="'+stLbl+'">'+lbl+'</label>'
        +'<input id="'+fid+'" type="text" value="'+_esc(val||'')+'" autocomplete="off" placeholder="'+ph+'" style="'+stInp+'">'
        +'<div id="'+fid+'-d" style="position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:130px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none"></div>'
        +'</div>';
    }
    var formHtml='<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome card</label>'
      +'<input id="tvc-name" type="text" value="'+_esc(c.name||'')+'" placeholder="es. TV Sala" style="'+stInp.replace('monospace','system-ui')+'"></div>'
      +'<div style="'+stSec+'">Entità principali</div>'
      +fldAC('tvc-tv','TV (media_player)',c.pk_tv,'media_player.tv_sala_2',mpIds)
      +fldAC('tvc-remote','Telecomando (remote, opzionale)',c.pk_remote,'remote.tv_sala (per navigazione)',remIds)
      +fldAC('tvc-soundbar','Soundbar (media_player, opzionale)',c.pk_soundbar,'media_player.soundbar',mpIds)
      +'<div style="'+stSec+'">Comandi navigazione (remote)</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div><label style="'+stLbl+'">Su</label><input id="tvc-nup" type="text" value="'+_esc(c.nav_up)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">Giù</label><input id="tvc-ndown" type="text" value="'+_esc(c.nav_down)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">Sinistra</label><input id="tvc-nleft" type="text" value="'+_esc(c.nav_left)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">Destra</label><input id="tvc-nright" type="text" value="'+_esc(c.nav_right)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">OK / Invio</label><input id="tvc-nok" type="text" value="'+_esc(c.nav_ok)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">Indietro</label><input id="tvc-nback" type="text" value="'+_esc(c.nav_back)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">Home</label><input id="tvc-nhome" type="text" value="'+_esc(c.nav_home)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">Menu</label><input id="tvc-nmenu" type="text" value="'+_esc(c.nav_menu)+'" style="'+stInp+'"></div>'
      +'</div>'
      +'<div style="'+stSec+'">Aspetto</div>'
      +colorPicker
      +'<div style="display:flex;gap:8px;margin-top:16px">'
      +'<button id="tvc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      +'<button id="tvc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#040c1a">Salva</button>'
      +'</div>';
    var ov=mkOv(popShell('📺','56,189,248','Configura TV',card.id||'','tvc-cfg-close','<div style="padding:13px 15px">'+formHtml+'</div>'),'tvc-cfg-close');
    ov.querySelector('#tvc-cancel').addEventListener('click',function(){ov._close();});
    var selColor=c.color||'#38bdf8';
    ov.querySelectorAll('[data-col]').forEach(function(dot){
      dot.addEventListener('click',function(){selColor=dot.getAttribute('data-col');ov.querySelectorAll('[data-col]').forEach(function(d){d.style.borderColor='transparent';});dot.style.borderColor='#fff';});
    });
    [['tvc-tv',mpIds],['tvc-remote',remIds],['tvc-soundbar',mpIds]].forEach(function(pair){
      var fid=pair[0],ids=pair[1];
      var inp=ov.querySelector('#'+fid),drop=ov.querySelector('#'+fid+'-d');
      if(!inp||!drop) return;
      function show(){
        var q=inp.value.toLowerCase().trim();
        var hits=(q?ids.filter(function(id){return id.toLowerCase().includes(q);}):ids).slice(0,25);
        if(!hits.length){drop.style.display='none';return;}
        drop.style.display='block';
        drop.innerHTML=hits.map(function(id){return '<div data-pick="'+id+'" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">'+id+'</div>';}).join('');
        drop.querySelectorAll('[data-pick]').forEach(function(row){
          row.addEventListener('mousedown',function(ev){ev.preventDefault();inp.value=row.getAttribute('data-pick');drop.style.display='none';});
          row.addEventListener('mouseover',function(){row.style.background='rgba(255,255,255,.08)';});
          row.addEventListener('mouseout', function(){row.style.background='';});
        });
      }
      inp.addEventListener('focus',show); inp.addEventListener('input',show);
      inp.addEventListener('blur',function(){setTimeout(function(){drop.style.display='none';},200);});
    });
    ov.querySelector('#tvc-save').addEventListener('click',function(){
      function v(id){var el=ov.querySelector('#'+id);return el?el.value.trim():'';}
      save(card,{
        name:v('tvc-name'), pk_tv:v('tvc-tv'), pk_remote:v('tvc-remote'), pk_soundbar:v('tvc-soundbar'),
        color:selColor,
        nav_up:v('tvc-nup')||'UP', nav_down:v('tvc-ndown')||'DOWN',
        nav_left:v('tvc-nleft')||'LEFT', nav_right:v('tvc-nright')||'RIGHT',
        nav_ok:v('tvc-nok')||'ENTER', nav_back:v('tvc-nback')||'BACK',
        nav_home:v('tvc-nhome')||'HOME', nav_menu:v('tvc-nmenu')||'MENU',
      });
      ov._close(); try{el._tvSig='';el._tvBound=null;el.innerHTML=render(card);mount(card,null,el);}catch(e){}
    });
  }

  /* ── UPDATE ── */
  function update(card, hass, el) {
    if (el._tvVolDragging) return;
    var h=H(), c=cfgFor(card);
    var tvEid=c.pk_tv, sbEid=c.pk_soundbar;
    var tvSt=S(h,tvEid), tvAt=(h&&h.states&&h.states[tvEid]&&h.states[tvEid].attributes)||{};
    var sbSt=sbEid?S(h,sbEid):'', sbAt=sbEid&&h&&h.states&&h.states[sbEid]?(h.states[sbEid].attributes||{}):{};
    var sig=[CARD.version,tvSt,tvAt.media_title,tvAt.app_name,tvAt.entity_picture,tvAt.source,
             Math.round((tvAt.volume_level||0)*100),tvAt.is_volume_muted,
             sbSt,Math.round((sbAt.volume_level||0)*100),sbAt.is_volume_muted].join('|');
    if(!el.querySelector('.fc-card')||el._tvSig!==sig){
      el._tvSig=sig; el._tvBound=null; el.innerHTML=render(card);
    }
    mount(card,hass,el);
  }

  /* ── MOUNT ── */
  function mount(card, hass, el) {
    if (el._tvBound===CARD.version) return;
    el._tvBound=CARD.version;

    var c = cfgFor(card);
    function tvEid()  { return cfgFor(card).pk_tv; }
    function sbEid()  { return cfgFor(card).pk_soundbar; }
    function remEid() { return cfgFor(card).pk_remote; }
    function nav(cmd) {
      var re=remEid(); if(!re) return;
      callSvc('remote','send_command',{entity_id:re, command:cmd});
    }

    /* click handler */
    if(el._tvH) el.removeEventListener('click',el._tvH);
    el._tvH=function(e){
      var t=e.target.closest('[data-axa]'); if(!t) return;
      var a=t.dataset.axa;
      if(a==='cfg'){openCfg(card,el);return;}
      if(a==='rename'){
        var cur=cfgFor(card).name||'TV'; t.innerHTML='';
        var inp=document.createElement('input'); inp.type='text'; inp.value=cur;
        inp.style.cssText='width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.4);outline:none;color:#fff;font-size:13px;font-weight:800;font-family:system-ui;padding:0';
        t.appendChild(inp); inp.focus(); inp.select();
        function commit(){var v=inp.value.trim()||cur;var s=load(card);s.name=v;save(card,s);el._tvSig='';el._tvBound=null;el.innerHTML=render(card);mount(card,null,el);}
        inp.addEventListener('blur',commit,{once:true});
        inp.addEventListener('keydown',function(ev){if(ev.key==='Enter')inp.blur();if(ev.key==='Escape'){inp.removeEventListener('blur',commit);t.textContent=cur;}});
        return;
      }
      if(a==='source-open'){openSourcePicker(card,el);return;}
      if(a==='power'){
        var h=H(), st=S(h,tvEid());
        if(st==='off'||st==='unavailable'||st==='standby') callSvc('media_player','turn_on',{entity_id:tvEid()});
        else callSvc('media_player','turn_off',{entity_id:tvEid()});
        return;
      }
      if(a==='mute-tv'||a==='mute-tv-sl'){
        var h2=H(),at2=(h2&&h2.states&&h2.states[tvEid()]&&h2.states[tvEid()].attributes)||{};
        callSvc('media_player','volume_mute',{entity_id:tvEid(),is_volume_muted:!isBool(at2.is_volume_muted)}); return;
      }
      if(a==='mute-sb'){
        var h3=H(),at3=(h3&&h3.states&&h3.states[sbEid()]&&h3.states[sbEid()].attributes)||{};
        callSvc('media_player','volume_mute',{entity_id:sbEid(),is_volume_muted:!isBool(at3.is_volume_muted)}); return;
      }
      if(a==='vol-up-tv'){callSvc('media_player','volume_up',{entity_id:tvEid()});return;}
      if(a==='vol-down-tv'){callSvc('media_player','volume_down',{entity_id:tvEid()});return;}
      if(a==='vol-up-sb'){callSvc('media_player','volume_up',{entity_id:sbEid()});return;}
      if(a==='vol-down-sb'){callSvc('media_player','volume_down',{entity_id:sbEid()});return;}
      if(a==='pp')   {callSvc('media_player','media_play_pause',    {entity_id:tvEid()});return;}
      if(a==='stop') {callSvc('media_player','media_stop',          {entity_id:tvEid()});return;}
      if(a==='prev') {callSvc('media_player','media_previous_track',{entity_id:tvEid()});return;}
      if(a==='next') {callSvc('media_player','media_next_track',    {entity_id:tvEid()});return;}
      if(a==='ch-up')  {callSvc('media_player','media_next_track',    {entity_id:tvEid()});return;}
      if(a==='ch-down'){callSvc('media_player','media_previous_track',{entity_id:tvEid()});return;}
      var navMap={'nav-up':'nav_up','nav-down':'nav_down','nav-left':'nav_left','nav-right':'nav_right','nav-ok':'nav_ok','nav-back':'nav_back','nav-home':'nav_home','nav-menu':'nav_menu'};
      if(navMap[a]){nav(cfgFor(card)[navMap[a]]);return;}
    };
    el.addEventListener('click',el._tvH);

    /* vol drag TV */
    var cid=card.id||'x';
    function makeVolDrag(trackAxa, eid, fillId, knobId, labelId) {
      var tracks=el.querySelectorAll('[data-axa="'+trackAxa+'"]');
      tracks.forEach(function(track){
        function rPct(x){var rc=track.getBoundingClientRect();return Math.max(0,Math.min(1,(x-rc.left)/rc.width));}
        function sv(x){var p=Math.round(rPct(x)*100);applyVolUI(el,fillId,knobId,labelId,p);clearTimeout(el['_tvVT'+trackAxa]);el['_tvVT'+trackAxa]=setTimeout(function(){callSvc('media_player','volume_set',{entity_id:eid(),volume_level:rPct(x)});},80);}
        track.addEventListener('mousedown',function(e){
          e.preventDefault();el._tvVolDragging=true;sv(e.clientX);
          function onMove(ev){sv(ev.clientX);}
          function onUp(ev){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);clearTimeout(el['_tvVT'+trackAxa]);callSvc('media_player','volume_set',{entity_id:eid(),volume_level:rPct(ev.clientX)});setTimeout(function(){el._tvVolDragging=false;},300);}
          document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp);
        });
        track.addEventListener('touchstart',function(e){
          e.preventDefault();el._tvVolDragging=true;
          function rT(ev){var t=(ev.touches||ev.changedTouches)[0];return t?rPct(t.clientX):0;}
          sv(e.touches[0].clientX);
          function onMove(ev){var t=(ev.touches||ev.changedTouches)[0];if(t)sv(t.clientX);}
          function onEnd(ev){track.removeEventListener('touchmove',onMove);track.removeEventListener('touchend',onEnd);clearTimeout(el['_tvVT'+trackAxa]);var t=(ev.changedTouches||[])[0];if(t)callSvc('media_player','volume_set',{entity_id:eid(),volume_level:rT(ev)});setTimeout(function(){el._tvVolDragging=false;},300);}
          track.addEventListener('touchmove',onMove,{passive:false}); track.addEventListener('touchend',onEnd,{once:true});
        },{passive:false});
      });
    }
    makeVolDrag('vol-track-tv', tvEid, 'tvvf-'+cid, 'tvvk-'+cid, 'tvvl-'+cid);
    if(sbEid()) makeVolDrag('vol-track-sb', sbEid, 'sbvf-'+cid, 'sbvk-'+cid, 'sbvl-'+cid);
  }

  /* ── REGISTRATION ── */
  var CARD={
    id:'tv-card', name:'TV Remote', icon:'📺', version:'1.0',
    desc:'Controllo TV: telecomando, navigazione, volume, soundbar, sorgente.',
    colSpan:2, rowSpan:4, frarik_no_edit:true,
    render:function(card){return render(card);},
    mount:function(card,hass,el){return mount(card,hass,el);},
    update:function(card,hass,el){return update(card,hass,el);},
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{console.log('[FratechStore] Card registrata: tv-card v1.0');}catch(e){}
})();
