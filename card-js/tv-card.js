/* frarik-version: 1.1 */
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
      pk_tv:        (c.pk_tv        && c.pk_tv        !== '') ? c.pk_tv        : 'media_player.tv_sala_2',
      pk_remote:    (c.pk_remote    && c.pk_remote    !== '') ? c.pk_remote    : 'remote.tv_sala',
      pk_bl:        (c.pk_bl        && c.pk_bl        !== '') ? c.pk_bl        : 'remote.broadlink',
      bl_device:    (c.bl_device    && c.bl_device    !== '') ? c.bl_device    : 'soundbar_lg',
      bl_vol_up:    (c.bl_vol_up    && c.bl_vol_up    !== '') ? c.bl_vol_up    : 'volume_su',
      bl_vol_down:  (c.bl_vol_down  && c.bl_vol_down  !== '') ? c.bl_vol_down  : 'volume_giu',
      bl_mute:      (c.bl_mute      && c.bl_mute      !== '') ? c.bl_mute      : 'mute',
      pk_sb_sensor: (c.pk_sb_sensor && c.pk_sb_sensor !== '') ? c.pk_sb_sensor : 'sensor.presa_tv_sala_potenza',
      sb_threshold: (c.sb_threshold != null && c.sb_threshold !== '') ? parseFloat(c.sb_threshold) : 30,
      name:         c.name  || 'TV Sala',
      color:        c.color || '#38bdf8',
    };
  }

  /* ── TV SVG ── */
  function tvSVG(col, rgb, isOn, isPlaying) {
    var scan = isPlaying
      ? '<style>@keyframes tvSc{0%{opacity:.7;transform:translateY(0)}80%{opacity:0}100%{opacity:0;transform:translateY(36px)}}</style>'
        + '<rect x="5" y="5" width="58" height="2" rx="1" fill="rgba('+rgb+',.55)" style="animation:tvSc 2.2s linear infinite"/>'
      : '';
    var screen = isOn
      ? '<rect x="4" y="4" width="60" height="40" rx="3" fill="rgba('+rgb+',.06)"/>' + scan
      : '<rect x="4" y="4" width="60" height="40" rx="3" fill="#020810"/>'
        + '<line x1="27" y1="23" x2="41" y2="23" stroke="rgba(255,255,255,.07)" stroke-width="1.5"/>'
        + '<line x1="34" y1="16" x2="34" y2="30" stroke="rgba(255,255,255,.07)" stroke-width="1.5"/>';
    return '<svg viewBox="0 0 68 58" style="width:74px;height:62px;display:block;margin:auto">'
      + '<style>@keyframes tvGlw{0%,100%{filter:drop-shadow(0 0 4px rgba('+rgb+',.4))}50%{filter:drop-shadow(0 0 9px rgba('+rgb+',.75))}}</style>'
      + '<rect x="1" y="1" width="66" height="48" rx="7" fill="#030c1c" stroke="'+col+'" stroke-width="'+(isOn?'1.8':'0.5')+'" opacity="'+(isOn?'1':'.35')+'"'+(isOn?' style="animation:tvGlw 2.5s ease-in-out infinite"':'')+'/>'
      + screen
      + '<rect x="29" y="50" width="10" height="5" rx="1" fill="rgba(255,255,255,.08)"/>'
      + '<rect x="12" y="55" width="44" height="3" rx="1.5" fill="rgba(255,255,255,.05)"/>'
      + '<circle cx="62" cy="7" r="3.5" fill="'+(isOn?col:'rgba(255,255,255,.12)')+'"'+(isOn?' style="filter:drop-shadow(0 0 4px '+col+')"':'')+'/>'
      + '</svg>';
  }

  /* ── RENDER ── */
  function render(card) {
    var h = H(), c = cfgFor(card), cid = card.id || 'x', rid = 'tv-' + cid;
    var col = c.color, rgb = hexRgb(col);
    var tvEid = c.pk_tv;

    var tvState = S(h, tvEid) || 'unavailable';
    var tvAttrs = (h && h.states && h.states[tvEid] && h.states[tvEid].attributes) || {};
    var isOn    = tvState !== 'off' && tvState !== 'unavailable' && tvState !== 'standby';
    var isPlay  = tvState === 'playing';
    var isPause = tvState === 'paused';

    var pic        = tvAttrs.entity_picture || '';
    var mediaTitle = tvAttrs.media_title || tvAttrs.app_name || '';
    var source     = tvAttrs.source || '';
    var sourceList = tvAttrs.source_list || [];

    /* soundbar state from power sensor */
    var sbSensorVal = parseFloat(S(h, c.pk_sb_sensor) || '0') || 0;
    var sbOn = sbSensorVal > (c.sb_threshold || 30);

    var stLbls = { playing:'In riproduzione', paused:'In pausa', idle:'Accesa', on:'Accesa', standby:'Standby', off:'Spenta', unavailable:'Non disponibile' };
    var stateLbl = stLbls[tvState] || tvState;
    var stateHex = isPlay ? col : isPause ? '#f59e0b' : isOn ? '#4ade80' : '#475569';
    var stateRgb = isPlay ? rgb : isPause ? '245,158,11' : isOn ? '74,222,128' : '71,85,105';

    /* art */
    var artContent;
    if (pic && isOn) {
      var src = pic.startsWith('http') ? pic : (window.location.origin + pic);
      artContent = '<img src="'+src+'" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:10px" '
        + 'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
        + '<div style="display:none;width:100%;height:100%;align-items:center;justify-content:center">'+tvSVG(col,rgb,isOn,isPlay)+'</div>';
    } else {
      artContent = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">'+tvSVG(col,rgb,isOn,isPlay)+'</div>';
    }

    /* right info */
    var infoRows = '';
    if (isOn && mediaTitle) {
      infoRows += '<div style="font-size:12px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3">'+_esc(mediaTitle)+'</div>';
    }
    if (isOn && source) {
      infoRows += '<div style="font-size:10px;font-weight:600;color:rgba(255,255,255,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">'+_esc(source)+'</div>';
    }
    if (!isOn || (!mediaTitle && !source)) {
      infoRows += '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.25)">'+stateLbl+'</div>';
    }
    /* source pill */
    if (isOn && sourceList.length) {
      infoRows += '<div data-axa="source-open" style="margin-top:5px;display:flex;align-items:center;gap:5px;cursor:pointer;padding:3px 8px;border-radius:7px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);overflow:hidden;user-select:none">'
        +'<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.35);flex-shrink:0">INGRESSO</span>'
        +'<span style="font-size:10px;font-weight:600;color:#fff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(source||'—')+'</span>'
        +'<span style="font-size:10px;color:rgba(255,255,255,.4);flex-shrink:0">▾</span>'
        +'</div>';
    }
    /* soundbar status chip */
    infoRows += '<div style="margin-top:6px;display:flex;align-items:center;gap:6px;padding:3px 8px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)">'
      +'<span style="font-size:9px;font-weight:800;letter-spacing:.4px;color:rgba(255,255,255,.3)">SOUNDBAR</span>'
      +'<span style="width:6px;height:6px;border-radius:50%;background:'+(sbOn?'#4ade80':'#475569')+';flex-shrink:0'+(sbOn?';box-shadow:0 0 5px #4ade80':'')+'">'
      +'</span>'
      +'<span style="font-size:10px;font-weight:700;color:'+(sbOn?'rgba(74,222,128,.9)':'rgba(255,255,255,.3)')+'">'+sbSensorVal.toFixed(0)+' W</span>'
      +'</div>';

    /* ── button helpers ── */
    var bBase = 'display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:10px;user-select:none;-webkit-tap-highlight-color:transparent';
    var bSm   = bBase+';width:38px;height:38px;font-size:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);color:rgba(255,255,255,.75);flex-shrink:0';
    var bNav  = bBase+';width:46px;height:46px;font-size:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:#fff;flex-shrink:0';
    var bOK   = bBase+';width:54px;height:54px;font-size:14px;font-weight:900;background:rgba('+rgb+',.2);border:2px solid '+col+';color:'+col+';box-shadow:0 0 16px rgba('+rgb+',.4);flex-shrink:0;letter-spacing:.5px';
    var bPow  = bBase+';flex:1;height:38px;font-size:12px;font-weight:800;gap:6px;'
      +(isOn?'background:rgba('+rgb+',.18);border:1px solid '+col+';color:'+col+';box-shadow:0 0 10px rgba('+rgb+',.3)'
            :'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.65)');
    var bPb   = bBase+';width:40px;height:38px;font-size:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);color:rgba(255,255,255,.7)';
    var bPP   = bBase+';width:46px;height:42px;font-size:18px;background:rgba('+rgb+',.18);border:1px solid '+col+';color:'+col+';box-shadow:0 0 10px rgba('+rgb+',.3)';
    var bApp  = function(bg, txt) {
      return bBase+';flex:1;height:34px;font-size:10px;font-weight:800;background:'+bg+';border:none;color:'+txt+';border-radius:9px;white-space:nowrap';
    };
    var bSb   = bBase+';flex:1;height:40px;font-size:13px;font-weight:700;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.75)';
    var bSbOn = bBase+';flex:1;height:40px;font-size:13px;font-weight:700;gap:6px;background:rgba(248,113,113,.18);border:1px solid #f87171;color:#f87171';
    var bNavSm = bBase+';flex:1;height:36px;font-size:10px;font-weight:700;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.65)';
    var bCh    = bBase+';width:38px;height:38px;font-size:11px;font-weight:800;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);color:rgba(255,255,255,.65)';

    /* ── sections ── */
    var powerRow = '<div style="display:flex;gap:7px;padding:6px 14px 4px;flex-shrink:0">'
      +'<div style="'+bPow+'" data-axa="power">⏻ '+(isOn?'Spegni TV':'Accendi TV')+'</div>'
      +(sourceList.length ? '<div style="'+bSm+'" data-axa="source-open" title="Ingresso">📥</div>' : '')
      +'<div style="'+bSm+'" data-axa="info" title="Info">ℹ️</div>'
      +'</div>';

    /* app shortcuts */
    var appsRow = '<div style="display:flex;gap:6px;padding:0 14px 6px;flex-shrink:0">'
      +'<div style="'+bApp('rgba(229,9,20,.85)','#fff')+'" data-axa="app-netflix">▶ Netflix</div>'
      +'<div style="'+bApp('rgba(255,0,0,.75)','#fff')+'" data-axa="app-youtube">▶ YouTube</div>'
      +'<div style="'+bApp('rgba(30,215,96,.85)','#0a1a0f')+'" data-axa="app-spotify">♪ Spotify</div>'
      +'<div style="'+bApp('rgba(56,189,248,.15)','rgba(255,255,255,.7)')+';border:1px solid rgba(56,189,248,.2)" data-axa="app-tv">📡 TV</div>'
      +'</div>';

    /* d-pad */
    var dpad = '<div style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:4px 14px 2px;flex-shrink:0">'
      +'<div style="'+bNav+'" data-axa="nav-up">▲</div>'
      +'<div style="display:flex;align-items:center;gap:5px">'
      +'<div style="'+bNav+'" data-axa="nav-left">◀</div>'
      +'<div style="'+bOK+'" data-axa="nav-ok">OK</div>'
      +'<div style="'+bNav+'" data-axa="nav-right">▶</div>'
      +'</div>'
      +'<div style="'+bNav+'" data-axa="nav-down">▼</div>'
      +'</div>'
      +'<div style="display:flex;gap:6px;padding:2px 14px 6px;flex-shrink:0">'
      +'<div style="'+bNavSm+'" data-axa="nav-back">← BACK</div>'
      +'<div style="'+bNavSm+'" data-axa="nav-home">⌂ HOME</div>'
      +'<div style="'+bNavSm+'" data-axa="nav-menu">☰ MENU</div>'
      +'</div>';

    /* playback + channel */
    var pbRow = '<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:2px 14px 6px;flex-shrink:0">'
      +'<div style="'+bCh+'" data-axa="ch-up" title="Canale +">CH+</div>'
      +'<div style="'+bPb+'" data-axa="rewind">⏪</div>'
      +'<div style="'+bPP+'" data-axa="pp">'+(isPlay?'⏸':'▶')+'</div>'
      +'<div style="'+bPb+'" data-axa="ff">⏩</div>'
      +'<div style="'+bCh+'" data-axa="ch-down" title="Canale -">CH-</div>'
      +'</div>';

    /* soundbar controls (via Broadlink) */
    var sbRow = '<div style="padding:4px 14px 8px;flex-shrink:0">'
      +'<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.25);margin-bottom:5px;padding-left:2px">🔊 Soundbar</div>'
      +'<div style="display:flex;gap:6px">'
      +'<div style="'+bSb+'" data-axa="sb-vol-down">🔉 VOL −</div>'
      +'<div style="'+(false?bSbOn:bSb)+'" data-axa="sb-mute">🔇 MUTE</div>'
      +'<div style="'+bSb+'" data-axa="sb-vol-up">🔊 VOL +</div>'
      +'</div>'
      +'</div>';

    /* CSS */
    var css = '<style>'
      +'@keyframes tvDot{0%,100%{opacity:.5}50%{opacity:1}}'
      +'@keyframes tvPls{0%,100%{box-shadow:0 0 0 1px '+col+',0 3px 14px rgba('+rgb+',.25)}50%{box-shadow:0 0 0 2px '+col+',0 4px 22px rgba('+rgb+',.5)}}'
      +'#'+rid+'{position:relative;width:100%;height:100%;min-height:510px;font-family:system-ui,sans-serif;display:block}'
      +'#'+rid+' .fc-card{display:flex;flex-direction:column;height:100%;min-height:510px;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      +'#'+rid+' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:180px;background:radial-gradient(ellipse at 35% 0%,rgba('+rgb+',.1) 0%,transparent 65%);pointer-events:none}'
      +'#'+rid+' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      +'#'+rid+' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;background:rgba('+rgb+',.12);border:1px solid rgba('+rgb+',.25)}'
      +'#'+rid+' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}'
      +'#'+rid+' .fc-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba('+stateRgb+',.08);border:1px solid rgba('+stateRgb+',.25);color:'+stateHex+'}'
      +'#'+rid+' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:'+stateHex+(isPlay?';animation:tvDot .8s ease-in-out infinite':'')+'}'
      +'#'+rid+' .fc-gear{margin-left:4px;cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      +'#'+rid+' .fc-gear:hover{background:rgba(255,255,255,.1)}'
      +'#'+rid+' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      +'#'+rid+' .fc-scroll::-webkit-scrollbar{display:none}'
      +'#'+rid+' .fc-hero{display:flex;align-items:center;padding:10px 14px 8px;gap:0}'
      +'#'+rid+' .fc-art{width:90px;height:78px;border-radius:10px;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,rgba('+rgb+',.14),rgba('+rgb+',.03));'+(isOn&&isPlay?'box-shadow:0 0 0 1.5px '+col+',0 4px 16px rgba('+rgb+',.4);animation:tvPls 2.5s ease-in-out infinite':'box-shadow:0 4px 12px rgba(0,0,0,.5)')+'}'
      +'#'+rid+' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0;padding-left:11px;border-left:1px solid rgba(255,255,255,.07)}'
      +'#'+rid+' .fc-sep{height:1px;background:rgba(255,255,255,.06);margin:0 14px;flex-shrink:0}'
      +'#'+rid+' [data-axa]:active{opacity:.6}'
      +'</style>';

    return css
      +'<div id="'+rid+'">'
      +'<div class="fc-card">'
      +'<div class="fc-hdr">'
      +'<div class="fc-hdr-iw">📺</div>'
      +'<div class="fc-hdr-tit" data-axa="rename">'+_esc(c.name||'TV Sala')+'</div>'
      +'<div class="fc-pill"><div class="fc-dot"></div>'+stateLbl+'</div>'
      +'<div class="fc-gear" data-axa="cfg">⚙</div>'
      +'</div>'
      +'<div class="fc-scroll">'
      +'<div class="fc-hero">'
      +'<div class="fc-art">'+artContent+'</div>'
      +'<div class="fc-hero-r">'+infoRows+'</div>'
      +'</div>'
      +'<div class="fc-sep"></div>'
      + powerRow
      + appsRow
      +'<div class="fc-sep"></div>'
      + dpad
      +'<div class="fc-sep"></div>'
      + pbRow
      +'<div class="fc-sep"></div>'
      + sbRow
      +'</div>'
      +'</div>'
      +'</div>';
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
  function popShell(icon,rgb,title,sub,closeId,content){
    return POP_CSS+'<div style="width:100%;max-height:78vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba('+rgb+',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      +'<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba('+rgb+',.15);border:1px solid rgba('+rgb+',.3)">'+icon+'</div>'
      +'<div><div style="font-size:14px;font-weight:800;color:#fff">'+title+'</div><div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:1px">'+sub+'</div></div>'
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
            +'<span style="width:18px;color:'+col+';font-size:13px">'+(active?'▶':'')+'</span>'
            +'<span style="font-size:12px;font-weight:'+(active?'800':'500')+';color:'+(active?col:'#fff')+'">'+_esc(src)+'</span>'
            +'</div>';
        }).join('')
      : '<div style="padding:20px;text-align:center;color:rgba(255,255,255,.35);font-size:12px">Nessuna sorgente disponibile</div>';
    var ov=mkOv(popShell('📥',rgb,'Ingresso / Sorgente',_esc(curSrc||'—'),'tvsrc-close',listHtml),'tvsrc-close');
    ov.querySelectorAll('[data-src]').forEach(function(row){
      row.addEventListener('mouseover',function(){row.style.background='rgba(255,255,255,.05)';});
      row.addEventListener('mouseout', function(){row.style.background=(row.getAttribute('data-src')===curSrc?'rgba('+hexRgb(cfgFor(card).color)+',.1)':'');});
      row.addEventListener('click',function(){callSvc('media_player','select_source',{entity_id:c.pk_tv,source:row.getAttribute('data-src')});ov._close();});
    });
  }

  /* ── CONFIG ── */
  function openCfg(card, el) {
    var h=H(), c=cfgFor(card);
    var states=(h&&h.states)||{};
    var mpIds  = Object.keys(states).filter(function(id){return id.startsWith('media_player.');}).sort();
    var remIds = Object.keys(states).filter(function(id){return id.startsWith('remote.');}).sort();
    var sensIds= Object.keys(states).filter(function(id){return id.startsWith('sensor.');}).sort();
    var stInp='width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stLbl='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    var stSec='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(56,189,248,.2)';
    var COLORS=['#38bdf8','#818cf8','#f472b6','#4ade80','#fb923c','#f87171','#facc15','#c084fc'];
    var colorPicker='<div style="margin-bottom:10px"><label style="'+stLbl+'">Colore accent</label>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +COLORS.map(function(clr){return '<div data-col="'+clr+'" style="width:24px;height:24px;border-radius:7px;cursor:pointer;background:'+clr+';border:2px solid '+(c.color===clr?'#fff':'transparent')+'"></div>';}).join('')+'</div></div>';

    function fldAC(fid,lbl,val,ph,ids){
      return '<div style="margin-bottom:9px;position:relative"><label style="'+stLbl+'">'+lbl+'</label>'
        +'<input id="'+fid+'" type="text" value="'+_esc(val||'')+'" autocomplete="off" placeholder="'+ph+'" style="'+stInp+'">'
        +'<div id="'+fid+'-d" style="position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:120px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none"></div>'
        +'</div>';
    }
    function fldSimple(fid,lbl,val,ph){
      return '<div style="margin-bottom:9px"><label style="'+stLbl+'">'+lbl+'</label>'
        +'<input id="'+fid+'" type="text" value="'+_esc(val||'')+'" autocomplete="off" placeholder="'+ph+'" style="'+stInp+'"></div>';
    }

    var formHtml='<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome card</label>'
      +'<input id="tvc-name" type="text" value="'+_esc(c.name)+'" style="'+stInp.replace('monospace','system-ui')+'"></div>'
      +'<div style="'+stSec+'">TV</div>'
      +fldAC('tvc-tv','Media Player',c.pk_tv,'media_player.tv_sala_2',mpIds)
      +fldAC('tvc-remote','Remote (navigazione + app)',c.pk_remote,'remote.tv_sala',remIds)
      +'<div style="'+stSec+'">Soundbar (Broadlink IR)</div>'
      +fldAC('tvc-bl','Remote Broadlink',c.pk_bl,'remote.broadlink',remIds)
      +fldSimple('tvc-bl-dev','Device Broadlink',c.bl_device,'es. soundbar_lg')
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:9px">'
      +'<div><label style="'+stLbl+'">Cmd Vol+</label><input id="tvc-vup" type="text" value="'+_esc(c.bl_vol_up)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">Cmd Vol-</label><input id="tvc-vdn" type="text" value="'+_esc(c.bl_vol_down)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">Cmd Mute</label><input id="tvc-mute" type="text" value="'+_esc(c.bl_mute)+'" style="'+stInp+'"></div>'
      +'</div>'
      +fldAC('tvc-sb-sensor','Sensore potenza soundbar',c.pk_sb_sensor,'sensor.presa_tv_sala_potenza',sensIds)
      +fldSimple('tvc-sb-thr','Soglia ON (watt)',String(c.sb_threshold),'es. 30')
      +'<div style="'+stSec+'">Aspetto</div>'
      +colorPicker
      +'<div style="display:flex;gap:8px;margin-top:16px">'
      +'<button id="tvc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      +'<button id="tvc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#040c1a">Salva</button>'
      +'</div>';

    var ov=mkOv(popShell('📺','56,189,248','Configura TV',card.id||'','tvc-cfg-close','<div style="padding:13px 15px">'+formHtml+'</div>'),'tvc-cfg-close');
    ov.querySelector('#tvc-cancel').addEventListener('click',function(){ov._close();});
    var selColor=c.color;
    ov.querySelectorAll('[data-col]').forEach(function(dot){
      dot.addEventListener('click',function(){selColor=dot.getAttribute('data-col');ov.querySelectorAll('[data-col]').forEach(function(d){d.style.borderColor='transparent';});dot.style.borderColor='#fff';});
    });
    [['tvc-tv',mpIds],['tvc-remote',remIds],['tvc-bl',remIds],['tvc-sb-sensor',sensIds]].forEach(function(pair){
      var fid=pair[0],ids=pair[1];
      var inp=ov.querySelector('#'+fid),drop=ov.querySelector('#'+fid+'-d');
      if(!inp||!drop) return;
      function show(){
        var q=inp.value.toLowerCase().trim();
        var hits=(q?ids.filter(function(id){return id.toLowerCase().includes(q);}):ids).slice(0,25);
        if(!hits.length){drop.style.display='none';return;}
        drop.style.display='block';
        drop.innerHTML=hits.map(function(id){return '<div data-pick="'+id+'" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0">'+id+'</div>';}).join('');
        drop.querySelectorAll('[data-pick]').forEach(function(r){
          r.addEventListener('mousedown',function(ev){ev.preventDefault();inp.value=r.getAttribute('data-pick');drop.style.display='none';});
          r.addEventListener('mouseover',function(){r.style.background='rgba(255,255,255,.08)';});
          r.addEventListener('mouseout', function(){r.style.background='';});
        });
      }
      inp.addEventListener('focus',show); inp.addEventListener('input',show);
      inp.addEventListener('blur',function(){setTimeout(function(){drop.style.display='none';},200);});
    });
    ov.querySelector('#tvc-save').addEventListener('click',function(){
      function v(id){var el=ov.querySelector('#'+id);return el?el.value.trim():'';}
      save(card,{name:v('tvc-name'),pk_tv:v('tvc-tv'),pk_remote:v('tvc-remote'),
        pk_bl:v('tvc-bl'),bl_device:v('tvc-bl-dev'),bl_vol_up:v('tvc-vup'),bl_vol_down:v('tvc-vdn'),bl_mute:v('tvc-mute'),
        pk_sb_sensor:v('tvc-sb-sensor'),sb_threshold:parseFloat(v('tvc-sb-thr'))||30,color:selColor});
      ov._close(); try{el._tvSig='';el._tvBound=null;el.innerHTML=render(card);mount(card,null,el);}catch(e){}
    });
  }

  /* ── UPDATE ── */
  function update(card, hass, el) {
    if (el._tvDrag) return;
    var h=H(), c=cfgFor(card);
    var tvSt=S(h,c.pk_tv), tvAt=(h&&h.states&&h.states[c.pk_tv]&&h.states[c.pk_tv].attributes)||{};
    var sbW=parseFloat(S(h,c.pk_sb_sensor)||'0')||0;
    var sig=[CARD.version,tvSt,tvAt.media_title,tvAt.app_name,tvAt.entity_picture,tvAt.source,Math.floor(sbW)].join('|');
    if(!el.querySelector('.fc-card')||el._tvSig!==sig){
      el._tvSig=sig; el._tvBound=null; el.innerHTML=render(card);
    }
    mount(card,hass,el);
  }

  /* ── MOUNT ── */
  function mount(card, hass, el) {
    if (el._tvBound===CARD.version) return;
    el._tvBound=CARD.version;
    if(el._tvH) el.removeEventListener('click',el._tvH);

    function tv()  { return cfgFor(card).pk_tv; }
    function rem() { return cfgFor(card).pk_remote; }
    function tvCmd(cmd) { callSvc('remote','send_command',{entity_id:rem(),command:cmd}); }
    function blCmd(cmd) {
      var c=cfgFor(card);
      callSvc('remote','send_command',{entity_id:c.pk_bl,device:c.bl_device,command:cmd});
    }

    el._tvH=function(e){
      var t=e.target.closest('[data-axa]'); if(!t) return;
      var a=t.dataset.axa;
      if(a==='cfg'){openCfg(card,el);return;}
      if(a==='rename'){
        var cur=cfgFor(card).name; t.innerHTML='';
        var inp=document.createElement('input'); inp.type='text'; inp.value=cur;
        inp.style.cssText='width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.4);outline:none;color:#fff;font-size:13px;font-weight:800;font-family:system-ui;padding:0';
        t.appendChild(inp); inp.focus(); inp.select();
        function commit(){var v=inp.value.trim()||cur;var s=load(card);s.name=v;save(card,s);el._tvSig='';el._tvBound=null;el.innerHTML=render(card);mount(card,null,el);}
        inp.addEventListener('blur',commit,{once:true});
        inp.addEventListener('keydown',function(ev){if(ev.key==='Enter')inp.blur();if(ev.key==='Escape'){inp.removeEventListener('blur',commit);t.textContent=cur;}});
        return;
      }
      if(a==='source-open'){openSourcePicker(card,el);return;}
      /* power */
      if(a==='power'){
        var h=H(), st=S(h,tv());
        if(st==='off'||st==='unavailable'||st==='standby') callSvc('media_player','turn_on',{entity_id:tv()});
        else callSvc('media_player','turn_off',{entity_id:tv()});
        return;
      }
      /* navigation via remote.tv_sala */
      if(a==='nav-up')   {tvCmd('up');   return;}
      if(a==='nav-down') {tvCmd('down'); return;}
      if(a==='nav-left') {tvCmd('left'); return;}
      if(a==='nav-right'){tvCmd('right');return;}
      if(a==='nav-ok')   {tvCmd('center');return;}
      if(a==='nav-back') {tvCmd('back'); return;}
      if(a==='nav-home') {tvCmd('home'); return;}
      if(a==='nav-menu') {tvCmd('menu'); return;}
      if(a==='info')     {tvCmd('info'); return;}
      /* playback via remote.tv_sala */
      if(a==='pp')       {tvCmd('play_pause');   return;}
      if(a==='rewind')   {tvCmd('rewind');        return;}
      if(a==='ff')       {tvCmd('fast_forward');  return;}
      if(a==='ch-up')    {tvCmd('channel_up');    return;}
      if(a==='ch-down')  {tvCmd('channel_down');  return;}
      /* app shortcuts via remote.tv_sala */
      if(a==='app-netflix'){tvCmd('netflix'); return;}
      if(a==='app-youtube'){tvCmd('youtube'); return;}
      if(a==='app-spotify'){tvCmd('spotify'); return;}
      if(a==='app-tv')     {tvCmd('tv');      return;}
      /* soundbar via Broadlink */
      if(a==='sb-vol-up')  {blCmd(cfgFor(card).bl_vol_up);   return;}
      if(a==='sb-vol-down'){blCmd(cfgFor(card).bl_vol_down);  return;}
      if(a==='sb-mute')    {blCmd(cfgFor(card).bl_mute);      return;}
    };
    el.addEventListener('click',el._tvH);
  }

  var CARD={
    id:'tv-card', name:'TV Remote', icon:'📺', version:'1.1',
    desc:'TV Philips Android TV + Soundbar LG via Broadlink. Navigazione, app, volume, stato.',
    colSpan:2, rowSpan:4, frarik_no_edit:true,
    render:function(card){return render(card);},
    mount:function(card,hass,el){return mount(card,hass,el);},
    update:function(card,hass,el){return update(card,hass,el);},
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{console.log('[FratechStore] Card registrata: tv-card v1.1');}catch(e){}
})();
