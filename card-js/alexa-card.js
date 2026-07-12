/* frarik-version: 2.1 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_alexacard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function callSvc(d, s, data) { try { var h = H(); if (h && h.callService) h.callService(d, s, data || {}); } catch (e) {} }
  function isBool(v) { return v === true || v === 'true'; }

  function hexRgb(hex) {
    try {
      var s = (hex || '#f472b6').replace('#', '');
      if (s.length === 3) s = s[0]+s[0]+s[1]+s[1]+s[2]+s[2];
      return parseInt(s.slice(0,2),16)+','+parseInt(s.slice(2,4),16)+','+parseInt(s.slice(4,6),16);
    } catch(e) { return '244,114,182'; }
  }

  function cfgFor(card) {
    var c = load(card);
    return {
      pk_player: (c.pk_player && c.pk_player !== '') ? c.pk_player : 'media_player.sfera_piano_terra',
      pk_notify: (c.pk_notify  && c.pk_notify  !== '') ? c.pk_notify  : 'alexa_media',
      name:  c.name  || 'Alexa',
      color: c.color || '#f472b6',
    };
  }

  function fmtTime(s) { s=Math.floor(s||0); return Math.floor(s/60)+':'+(s%60<10?'0':'')+(s%60); }
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* module-level UI state */
  var _timerOpen  = {};
  var _timerState = {};   /* { startMs, durationMs, minutes, done } */
  var _timerIv    = {};   /* setInterval handles */

  /* ── EQUALIZER ── */
  function eqBars(col, playing) {
    var base=[6,14,9,20,11,18,7,16,5], durs=['.52','.65','.48','.72','.57','.50','.62','.55','.45'], dels=['0','.12','.22','.07','.17','.05','.20','.10','.28'];
    var kf='', bars='';
    base.forEach(function(h,i){
      if(playing) kf+='@keyframes aleq'+i+'{0%,100%{height:'+h+'px}50%{height:22px}}';
      bars+='<div style="flex:1;min-width:3px;border-radius:2px;align-self:flex-end;background:'+col+';'+(playing?'height:'+h+'px;animation:aleq'+i+' '+durs[i]+'s ease-in-out '+dels[i]+'s infinite;box-shadow:0 0 5px '+col+'99':'height:'+h+'px;opacity:.22')+'"></div>';
    });
    return (playing?'<style>'+kf+'</style>':'')+'<div style="display:flex;align-items:flex-end;gap:3px;height:22px;width:100%">'+bars+'</div>';
  }

  /* ── VINYL SVG ── */
  function vinylSVG(col, playing) {
    var spin=playing?';animation:alVin 3s linear infinite':'';
    return '<svg width="68" height="68" viewBox="0 0 74 74" style="display:block'+spin+'">'
      +(playing?'<style>@keyframes alVin{to{transform:rotate(360deg);transform-origin:37px 37px}}</style>':'')
      +'<circle cx="37" cy="37" r="37" fill="#0d0820"/><circle cx="37" cy="37" r="31" fill="#140f2a"/>'
      +'<circle cx="37" cy="37" r="24" fill="#0d0820"/><circle cx="37" cy="37" r="18" fill="#1a1035"/>'
      +'<circle cx="37" cy="37" r="7"  fill="#0d0820"/><circle cx="37" cy="37" r="4"  fill="'+col+'"/>'
      +'<circle cx="37" cy="37" r="1.8" fill="#0d0820"/>'
      +'<path d="M37,6 A31,31 0 0,1 68,37" stroke="'+col+'" stroke-width=".8" fill="none" opacity=".5"/>'
      +'<path d="M37,68 A31,31 0 0,1 6,37"  stroke="'+col+'" stroke-width=".8" fill="none" opacity=".3"/>'
      +'</svg>';
  }

  /* ── TIMER HELPERS ── */
  function timerTtsMsg(min) {
    if (min >= 60 && min % 60 === 0) {
      var h = min / 60;
      return 'imposta un timer di ' + h + (h === 1 ? ' ora' : ' ore');
    }
    return 'imposta un timer di ' + min + ' minut' + (min === 1 ? 'o' : 'i');
  }

  function fmtCountdown(remainMs) {
    var s = Math.max(0, Math.ceil(remainMs / 1000));
    var m = Math.floor(s / 60), sec = s % 60;
    return m + 'm ' + (sec < 10 ? '0' : '') + sec + 's';
  }

  /* ── RENDER ── */
  function render(card) {
    var h=H(), c=cfgFor(card), cid=card.id||'x', rid='alx-'+cid;
    var col=c.color, rgb=hexRgb(col);
    var eid=c.pk_player;
    var timerOpen   = !!_timerOpen[cid];
    var timerState  = _timerState[cid] && !_timerState[cid].done ? _timerState[cid] : null;

    var state=S(h,eid)||'unavailable', attrs=(h&&h.states&&h.states[eid]&&h.states[eid].attributes)||{};
    var isPlaying=state==='playing', isPaused=state==='paused', isActive=isPlaying||isPaused;

    var title=attrs.media_title||'', artist=attrs.media_artist||'', album=attrs.media_album_name||'';
    var pic=attrs.entity_picture||'';
    var vol=Math.round((attrs.volume_level!=null?attrs.volume_level:0.5)*100);
    var muted=isBool(attrs.is_volume_muted), shuffle=isBool(attrs.shuffle), repeat=attrs.repeat||'off';
    var dur=parseFloat(attrs.media_duration)||0, pos=parseFloat(attrs.media_position)||0;
    var sourceList=attrs.source_list||[], source=attrs.source||'';

    var stLbls={playing:'In riproduzione',paused:'In pausa',idle:'Inattivo',standby:'Standby',off:'Spento',unavailable:'Non disponibile'};
    var stateLbl=stLbls[state]||state;
    var stateHex=isPlaying?col:isPaused?'#94a3b8':'#475569', stateRgb=isPlaying?rgb:isPaused?'148,163,184':'71,85,105';

    /* art */
    var artInner;
    if(pic){
      var src=pic.startsWith('http')?pic:(window.location.origin+pic);
      artInner='<img src="'+src+'" style="width:100%;height:100%;object-fit:cover;display:block;'+(isPlaying?'animation:alArtPls 2.5s ease-in-out infinite':'')+'" '
        +'onerror="this.style.display=\'none\';var f=this.nextElementSibling;if(f)f.style.display=\'flex\'">'
        +'<div style="display:none;width:100%;height:100%;align-items:center;justify-content:center">'+vinylSVG(col,isPlaying)+'</div>';
    } else {
      artInner='<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">'+vinylSVG(col,isPlaying)+'</div>';
    }

    /* right info */
    var infoRows='';
    if(isActive&&title){
      infoRows+='<div style="font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2">'+_esc(title)+'</div>';
      if(artist) infoRows+='<div style="font-size:10px;font-weight:600;color:rgba(255,255,255,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">'+_esc(artist)+'</div>';
      if(album)  infoRows+='<div style="font-size:9px;font-weight:500;color:rgba(255,255,255,.38);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_esc(album)+'</div>';
    } else {
      infoRows+='<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.28)">'+stateLbl+'</div>';
    }
    if(isActive&&dur>0){
      infoRows+='<div style="margin-top:4px">'
        +'<div style="height:3px;border-radius:2px;background:rgba(255,255,255,.07);overflow:hidden">'
        +'<div style="height:100%;width:'+Math.round(Math.min(1,pos/dur)*100)+'%;background:'+col+';border-radius:2px"></div></div>'
        +'<div style="display:flex;justify-content:space-between;margin-top:2px">'
        +'<span style="font-size:8px;color:rgba(255,255,255,.3)">'+fmtTime(pos)+'</span>'
        +'<span style="font-size:8px;color:rgba(255,255,255,.3)">'+fmtTime(dur)+'</span>'
        +'</div></div>';
    }
    infoRows+='<div style="margin-top:5px">'+eqBars(isActive?col:'rgba(255,255,255,.18)',isPlaying)+'</div>';
    if(sourceList.length){
      infoRows+='<div data-axa="source-open" style="margin-top:5px;display:flex;align-items:center;gap:5px;cursor:pointer;padding:3px 7px;border-radius:7px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);overflow:hidden;user-select:none">'
        +'<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.35);flex-shrink:0">SORGENTE</span>'
        +'<span style="font-size:10px;font-weight:600;color:#fff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(source||'—')+'</span>'
        +'<span style="font-size:10px;color:rgba(255,255,255,.4);flex-shrink:0">▾</span>'
        +'</div>';
    }

    /* button styles */
    var bOff='width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent;font-size:13px;color:rgba(255,255,255,.6)';
    var bOn='width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid '+col+';background:rgba('+rgb+',.22);color:'+col+';flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent;font-size:13px;box-shadow:0 0 10px rgba('+rgb+',.5),inset 0 0 6px rgba('+rgb+',.1)';
    var bPP='width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid '+col+';background:rgba('+rgb+',.22);color:'+col+';flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent;font-size:17px;box-shadow:0 0 14px rgba('+rgb+',.5),0 2px 10px rgba('+rgb+',.3)';
    var bTmr='width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent;font-size:13px;'
      +(timerOpen||timerState?'border:1px solid '+col+';background:rgba('+rgb+',.22);color:'+col+';box-shadow:0 0 8px rgba('+rgb+',.4)':'border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(255,255,255,.6)');

    var repIco=repeat==='one'?'🔂':'🔁';
    var ctrlHtml='<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;flex-shrink:0">'
      +'<div style="'+(shuffle?bOn:bOff)+'" data-axa="shuffle" title="Casuale">⇄</div>'
      +'<div style="'+bOff+'" data-axa="prev">⏮</div>'
      +'<div style="'+bOff+'" data-axa="stop">⏹</div>'
      +'<div style="'+bPP+'"  data-axa="pp">'+(isPlaying?'⏸':'▶')+'</div>'
      +'<div style="'+bOff+'" data-axa="next">⏭</div>'
      +'<div style="'+(repeat!=='off'?bOn:bOff)+'" data-axa="repeat">'+repIco+'</div>'
      +'<div style="'+bTmr+'" data-axa="timer-toggle" title="Timer">⏱</div>'
      +'</div>';

    /* timer active bar */
    var timerBarHtml='';
    if(timerState){
      var elapsed=Date.now()-timerState.startMs;
      var total=timerState.durationMs;
      var remaining=Math.max(0,total-elapsed);
      var fillPct=Math.min(100,elapsed/total*100);
      timerBarHtml='<div style="padding:2px 14px 8px;flex-shrink:0">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">'
        +'<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.35)">⏱ Timer in corso</div>'
        +'<div style="display:flex;align-items:center;gap:7px">'
        +'<span data-timer-label style="font-size:12px;font-weight:800;color:'+col+'">'+fmtCountdown(remaining)+'</span>'
        +'<div data-axa="timer-cancel" style="cursor:pointer;font-size:10px;color:rgba(255,255,255,.3);width:18px;height:18px;border-radius:5px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05)">✕</div>'
        +'</div></div>'
        +'<div style="height:5px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden">'
        +'<div data-timer-bar style="height:100%;width:'+fillPct+'%;background:linear-gradient(90deg,'+col+',rgba('+rgb+',.6));border-radius:3px;transition:none"></div>'
        +'</div></div>';
    }

    /* timer panel (preset + custom input) */
    var timerPanelHtml='';
    if(timerOpen){
      var tPill='flex:1;min-width:0;padding:6px 0;text-align:center;border-radius:8px;cursor:pointer;font-size:10px;font-weight:700;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);user-select:none;-webkit-tap-highlight-color:transparent';
      timerPanelHtml='<div style="display:flex;gap:5px;align-items:center;padding:0 14px 8px;flex-shrink:0">'
        +[[5,'5m'],[10,'10m'],[15,'15m'],[30,'30m'],[60,'1h']].map(function(t){
          return '<div style="'+tPill+'" data-axa="timer-set" data-min="'+t[0]+'">'+t[1]+'</div>';
        }).join('')
        +'<input type="number" data-axa="timer-custom" min="1" max="240" placeholder="min" '
        +'style="width:42px;flex-shrink:0;padding:5px 4px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:10px;font-weight:700;text-align:center;outline:none;-moz-appearance:textfield;-webkit-appearance:none">'
        +'<div style="'+tPill.replace('flex:1;min-width:0;','flex-shrink:0;width:28px;')+'" data-axa="timer-custom-go">▶</div>'
        +'</div>';
    }

    /* volume presets */
    var presetsHtml='<div style="display:flex;gap:5px;padding:0 14px 6px;flex-shrink:0">'
      +[25,50,75,100].map(function(p){
        var active=!muted&&vol===p;
        return '<div style="flex:1;padding:5px 0;text-align:center;border-radius:8px;cursor:pointer;font-size:10px;font-weight:700;user-select:none;-webkit-tap-highlight-color:transparent;'
          +(active?'background:rgba('+rgb+',.22);border:1px solid '+col+';color:'+col:'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5)')
          +'" data-axa="vol-preset" data-vol="'+p+'">'+p+'%</div>';
      }).join('')+'</div>';

    /* volume slider */
    var dispVol=muted?0:vol;
    var volIco=muted?'🔇':vol<35?'🔈':vol<65?'🔉':'🔊';
    var volHtml='<div style="display:flex;align-items:center;gap:10px;padding:4px 14px 8px;flex-shrink:0">'
      +'<div data-axa="mute" style="cursor:pointer;font-size:15px;flex-shrink:0;user-select:none;-webkit-tap-highlight-color:transparent">'+volIco+'</div>'
      +'<div data-axa="vol-track" style="flex:1;height:20px;display:flex;align-items:center;cursor:pointer;position:relative;-webkit-tap-highlight-color:transparent">'
      +'<div style="position:absolute;left:0;right:0;height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;pointer-events:none">'
      +'<div data-vol-fill style="height:100%;width:'+dispVol+'%;background:'+col+';border-radius:2px;transition:none"></div></div>'
      +'<div data-vol-knob style="position:absolute;left:'+dispVol+'%;transform:translateX(-50%);width:12px;height:12px;border-radius:50%;background:'+col+';box-shadow:0 0 6px rgba('+rgb+',.7);pointer-events:none;top:50%;margin-top:-6px;transition:none"></div>'
      +'</div>'
      +'<span data-vol-label style="font-size:9px;font-weight:700;color:rgba(255,255,255,.45);min-width:26px;text-align:right">'+(muted?'–':vol+'%')+'</span>'
      +'</div>';

    /* TTS */
    var ttsHtml='<div style="display:flex;align-items:center;gap:7px;padding:0 14px 12px;flex-shrink:0">'
      +'<div style="font-size:14px;flex-shrink:0">🎤</div>'
      +'<input id="axtts-'+rid+'" data-axa="tts-inp" type="text" placeholder="Scrivi qualcosa per Alexa…" autocomplete="off" autocorrect="off" spellcheck="false"'
      +' style="flex:1;padding:7px 10px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:11px;font-family:system-ui;outline:none;min-width:0;-webkit-tap-highlight-color:transparent">'
      +'<div data-axa="tts-send" style="flex-shrink:0;padding:7px 11px;border-radius:9px;cursor:pointer;font-size:11px;font-weight:700;background:rgba('+rgb+',.2);border:1px solid rgba('+rgb+',.4);color:'+col+';white-space:nowrap;user-select:none">Parla</div>'
      +'</div>';

    /* CSS */
    var css='<style>'
      +'@keyframes alArtPls{0%,100%{box-shadow:0 0 0 2px '+col+',0 4px 20px rgba('+rgb+',.4)}50%{box-shadow:0 0 0 3px '+col+',0 4px 28px rgba('+rgb+',.6),0 0 30px rgba('+rgb+',.25)}}'
      +'@keyframes alDot{0%,100%{opacity:.5}50%{opacity:1}}'
      +'#'+rid+'{position:relative;width:100%;height:100%;min-height:375px;font-family:system-ui,sans-serif;display:block}'
      +'#'+rid+' .fc-card{display:flex;flex-direction:column;height:100%;min-height:375px;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      +'#'+rid+' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:220px;background:radial-gradient(ellipse at 30% 0%,rgba('+rgb+',.1) 0%,transparent 65%);pointer-events:none}'
      +'#'+rid+' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      +'#'+rid+' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;background:rgba('+rgb+',.12);border:1px solid rgba('+rgb+',.25)}'
      +'#'+rid+' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}'
      +'#'+rid+' .fc-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba('+stateRgb+',.08);border:1px solid rgba('+stateRgb+',.25);color:'+stateHex+'}'
      +'#'+rid+' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:'+stateHex+(isPlaying?';animation:alDot .8s ease-in-out infinite':'')+'}'
      +'#'+rid+' .fc-gear{margin-left:4px;cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      +'#'+rid+' .fc-gear:hover{background:rgba(255,255,255,.12)}'
      +'#'+rid+' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      +'#'+rid+' .fc-scroll::-webkit-scrollbar{display:none}'
      +'#'+rid+' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      +'#'+rid+' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;max-height:130px}'
      +'#'+rid+' .fc-art{width:100%;max-width:110px;aspect-ratio:1;border-radius:13px;overflow:hidden;flex-shrink:0;position:relative;'
      +(isPlaying?'box-shadow:0 0 0 2px '+col+',0 4px 20px rgba('+rgb+',.4);':'box-shadow:0 4px 14px rgba(0,0,0,.5);')
      +'background:linear-gradient(135deg,rgba('+rgb+',.18),rgba('+rgb+',.05))}'
      +'#'+rid+' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:4px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      +'#'+rid+' .fc-sep{height:1px;background:rgba(255,255,255,.06);margin:0 14px;flex-shrink:0}'
      +'#'+rid+' [data-axa]:active{opacity:.72}'
      +'#'+rid+' #axtts-'+rid+'::placeholder{color:rgba(255,255,255,.28)}'
      +'#'+rid+' #axtts-'+rid+':focus{border-color:rgba('+rgb+',.45);background:rgba('+rgb+',.06)}'
      +'#'+rid+' [data-axa="timer-custom"]::-webkit-outer-spin-button,[data-axa="timer-custom"]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}'
      +'#'+rid+' [data-axa="timer-custom"]::placeholder{color:rgba(255,255,255,.3)}'
      +'#'+rid+' [data-axa="timer-custom"]:focus{border-color:rgba('+rgb+',.45);background:rgba('+rgb+',.06)}'
      +'</style>';

    return css
      +'<div id="'+rid+'">'
      +'<div class="fc-card">'
      +'<div class="fc-hdr">'
      +'<div class="fc-hdr-iw">🔊</div>'
      +'<div class="fc-hdr-tit" data-axa="rename" title="Clicca per rinominare">'+_esc(c.name||'Alexa')+'</div>'
      +'<div class="fc-pill"><div class="fc-dot"></div>'+stateLbl+'</div>'
      +'<div class="fc-gear" data-axa="cfg">⚙</div>'
      +'</div>'
      +'<div class="fc-scroll">'
      +'<div class="fc-hero">'
      +'<div class="fc-hero-img"><div class="fc-art">'+artInner+'</div></div>'
      +'<div class="fc-hero-r">'+infoRows+'</div>'
      +'</div>'
      +'<div class="fc-sep"></div>'
      +ctrlHtml
      +timerBarHtml
      +(timerOpen?'<div class="fc-sep"></div>'+timerPanelHtml:'')
      +'<div class="fc-sep"></div>'
      +presetsHtml
      +volHtml
      +'<div class="fc-sep"></div>'
      +ttsHtml
      +'</div>'
      +'</div>'
      +'</div>';
  }

  /* ── VOL DOM ── */
  function applyVolUI(el, pct) {
    var f=el.querySelector('[data-vol-fill]'),k=el.querySelector('[data-vol-knob]'),l=el.querySelector('[data-vol-label]');
    if(f) f.style.width=pct+'%'; if(k) k.style.left=pct+'%'; if(l) l.textContent=pct+'%';
  }

  /* ── POPUP HELPERS ── */
  function mkOv(html,closeId){
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML=html; document.body.appendChild(ov);
    var close=function(){try{document.body.removeChild(ov);}catch(e){}};
    var btn=ov.querySelector('#'+closeId); if(btn) btn.addEventListener('click',close);
    ov.addEventListener('click',function(e){if(e.target===ov) close();});
    ov._close=close; return ov;
  }

  var POP_CSS='<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc2{overflow-y:auto;scrollbar-width:none}.fcpc2::-webkit-scrollbar{display:none}</style>';

  function popShell(icon,rgb,title,sub,closeId,content){
    return POP_CSS+'<div style="width:100%;max-height:76vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba('+rgb+',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      +'<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba('+rgb+',.15);border:1px solid rgba('+rgb+',.3)">'+icon+'</div>'
      +'<div><div style="font-size:14px;font-weight:800;color:#fff">'+title+'</div><div style="font-size:11px;color:#fff;margin-top:1px">'+sub+'</div></div>'
      +'<button id="'+closeId+'" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      +'</div>'
      +'<div class="fcpc2" style="flex:1;overflow-y:auto;padding:0;display:flex;flex-direction:column">'+content+'</div>'
      +'</div>';
  }

  /* ── SOURCE PICKER ── */
  function openSourcePicker(card,el){
    var h=H(),c=cfgFor(card),eid=c.pk_player;
    var attrs=(h&&h.states&&h.states[eid]&&h.states[eid].attributes)||{};
    var sources=attrs.source_list||[], curSrc=attrs.source||'', col=c.color, rgb=hexRgb(col);
    var listHtml=sources.length
      ?sources.map(function(src){
          var active=src===curSrc;
          return '<div data-src="'+_esc(src)+'" style="padding:12px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.05);'+(active?'background:rgba('+rgb+',.1);':'')+'">'
            +'<span style="font-size:14px;width:18px;text-align:center;color:'+col+'">'+(active?'▶':'')+'</span>'
            +'<span style="font-size:12px;font-weight:'+(active?'800':'500')+';color:'+(active?col:'#fff')+'">'+_esc(src)+'</span>'
            +'</div>';
        }).join('')
        +'<div style="padding:10px 16px;font-size:10px;color:rgba(255,255,255,.25);border-top:1px solid rgba(255,255,255,.05)">Le sorgenti disponibili dipendono dai servizi collegati al tuo account Amazon.</div>'
      :'<div style="padding:20px;text-align:center;color:rgba(255,255,255,.35);font-size:12px">Nessuna sorgente disponibile</div>';
    var ov=mkOv(popShell('🎵',rgb,'Sorgente audio',_esc(curSrc||'—'),'axsrc-close',listHtml),'axsrc-close');
    ov.querySelectorAll('[data-src]').forEach(function(row){
      row.addEventListener('mouseover',function(){row.style.background='rgba(255,255,255,.06)';});
      row.addEventListener('mouseout', function(){row.style.background=(row.getAttribute('data-src')===curSrc?'rgba('+rgb+',.1)':'');});
      row.addEventListener('click',function(){callSvc('media_player','select_source',{entity_id:eid,source:row.getAttribute('data-src')});ov._close();});
    });
  }

  /* ── CONFIG ── */
  function openCfg(card,el){
    var h=H(),c=cfgFor(card);
    var states=(h&&h.states)||{};
    var mpIds=Object.keys(states).filter(function(id){return id.startsWith('media_player.');}).sort();
    var stInp='width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stLbl='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    var stSec='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#f472b6;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(244,114,182,.2)';
    var COLORS=['#f472b6','#818cf8','#38bdf8','#4ade80','#fb923c','#f87171','#facc15','#c084fc'];
    var colorPicker='<div style="margin-bottom:10px"><label style="'+stLbl+'">Colore accent</label>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +COLORS.map(function(clr){return '<div data-axcol="'+clr+'" style="width:24px;height:24px;border-radius:7px;cursor:pointer;background:'+clr+';border:2px solid '+(c.color===clr?'#fff':'transparent')+';transition:border-color .1s"></div>';}).join('')
      +'</div></div>';
    function fldAC(fid,lbl,val,ph){
      return '<div style="margin-bottom:9px;position:relative"><label style="'+stLbl+'">'+lbl+'</label>'
        +'<input id="'+fid+'" type="text" value="'+_esc(val||'')+'" autocomplete="off" placeholder="'+ph+'" style="'+stInp+'">'
        +'<div id="'+fid+'-d" style="position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:140px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none"></div>'
        +'</div>';
    }
    var formHtml='<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome card</label>'
      +'<input id="axc-name" type="text" value="'+_esc(c.name||'')+'" placeholder="es. Alexa Cucina" style="'+stInp.replace('monospace','system-ui')+'"></div>'
      +'<div style="'+stSec+'">Entità</div>'
      +fldAC('axc-player','Media Player',c.pk_player,'media_player.sfera_piano_terra')
      +'<div style="'+stSec+'">TTS</div>'
      +fldAC('axc-notify','Servizio notify Alexa',c.pk_notify,'es. alexa_media')
      +'<div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:-5px;margin-bottom:10px">Solitamente <code style="background:rgba(255,255,255,.08);padding:1px 5px;border-radius:4px">alexa_media</code></div>'
      +'<div style="'+stSec+'">Aspetto</div>'
      +colorPicker
      +'<div style="display:flex;gap:8px;margin-top:16px">'
      +'<button id="axc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
      +'<button id="axc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#f472b6;color:#0a0614">Salva</button>'
      +'</div>';
    var ov=mkOv(popShell('🔊','244,114,182','Configura Alexa',card.id||'','axc-cfg-close','<div style="padding:13px 15px">'+formHtml+'</div>'),'axc-cfg-close');
    ov.querySelector('#axc-cancel').addEventListener('click',function(){ov._close();});
    var selColor=c.color||'#f472b6';
    ov.querySelectorAll('[data-axcol]').forEach(function(dot){
      dot.addEventListener('click',function(){selColor=dot.getAttribute('data-axcol');ov.querySelectorAll('[data-axcol]').forEach(function(d){d.style.borderColor='transparent';});dot.style.borderColor='#fff';});
    });
    [['axc-player',mpIds],['axc-notify',['alexa_media']]].forEach(function(pair){
      var fid=pair[0],ids=pair[1];
      var inp=ov.querySelector('#'+fid),drop=ov.querySelector('#'+fid+'-d');
      if(!inp||!drop) return;
      function show(){
        var q=inp.value.toLowerCase().trim();
        var hits=(q?ids.filter(function(id){return id.toLowerCase().includes(q);}):ids).slice(0,30);
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
    ov.querySelector('#axc-save').addEventListener('click',function(){
      var n=ov.querySelector('#axc-name'),p=ov.querySelector('#axc-player'),nt=ov.querySelector('#axc-notify');
      save(card,{name:n?n.value.trim():c.name,pk_player:p?p.value.trim():c.pk_player,pk_notify:nt?nt.value.trim():c.pk_notify,color:selColor});
      ov._close(); try{el._axSig='';el._axBound=null;el.innerHTML=render(card);mount(card,null,el);}catch(e){}
    });
  }

  /* ── UPDATE ── */
  function update(card,hass,el){
    if(el._axVolDragging||el._axTtsFocus||el._axTimerInputFocus) return;
    var h=H(),c=cfgFor(card),eid=c.pk_player;
    var st=S(h,eid),at=(h&&h.states&&h.states[eid]&&h.states[eid].attributes)||{};
    var cid=card.id||'x';
    var timerRunning=!!(_timerState[cid]&&!_timerState[cid].done);
    var sig=[CARD.version,st,at.media_title,at.media_artist,at.entity_picture,
             Math.round((at.volume_level||0)*100),isBool(at.is_volume_muted),
             isBool(at.shuffle),at.repeat,Math.floor(at.media_position||0),
             at.source,!!_timerOpen[cid],timerRunning].join('|');
    if(!el.querySelector('.fc-card')||el._axSig!==sig){
      el._axSig=sig; el._axBound=null; el.innerHTML=render(card);
    }
    mount(card,hass,el);
  }

  /* ── MOUNT ── */
  function mount(card,hass,el){
    if(el._axBound===CARD.version) return;
    el._axBound=CARD.version;
    ['_axHandler','_axVolMD','_axVolTS'].forEach(function(k){if(el[k]){el.removeEventListener(k==='_axHandler'?'click':k==='_axVolMD'?'mousedown':'touchstart',el[k]);}});

    var cid=card.id||'x';
    function eid(){return cfgFor(card).pk_player;}
    function notifSvc(){return cfgFor(card).pk_notify||'alexa_media';}
    function sendTts(text){text=(text||'').trim();if(!text)return;callSvc('notify',notifSvc(),{target:[eid()],message:text,data:{type:'tts'}});}

    /* timer interval helper */
    function startTimerIv(){
      if(_timerIv[cid]) clearInterval(_timerIv[cid]);
      _timerIv[cid]=setInterval(function(){
        var ts=_timerState[cid]; if(!ts||ts.done){clearInterval(_timerIv[cid]);return;}
        var elapsed=Date.now()-ts.startMs, total=ts.durationMs;
        var remaining=Math.max(0,total-elapsed), fillPct=Math.min(100,elapsed/total*100);
        var bar=el.querySelector('[data-timer-bar]'), lbl=el.querySelector('[data-timer-label]');
        if(bar) bar.style.width=fillPct+'%';
        if(lbl) lbl.textContent=fmtCountdown(remaining);
        if(remaining<=0){
          ts.done=true; clearInterval(_timerIv[cid]);
          /* announce via Alexa TTS when timer expires */
          var mins=ts.minutes;
          var msg='Timer di '+mins+' minut'+(mins===1?'o':'i')+' scaduto!';
          var cfg=cfgFor(card);
          callSvc('notify',cfg.pk_notify||'alexa_media',{target:[cfg.pk_player],message:msg,data:{type:'tts'}});
          setTimeout(function(){el._axSig='';el._axBound=null;el.innerHTML=render(card);mount(card,null,el);},1200);
        }
      },1000);
    }

    /* restart interval if timer is already running (after re-render) */
    if(_timerState[cid]&&!_timerState[cid].done) startTimerIv();

    function startTimer(min){
      _timerState[cid]={startMs:Date.now(),durationMs:min*60000,minutes:min,done:false};
      startTimerIv();
      el._axSig='';el._axBound=null;el.innerHTML=render(card);mount(card,null,el);
    }

    /* click */
    el._axHandler=function(e){
      var t=e.target.closest('[data-axa]'); if(!t) return;
      var a=t.dataset.axa;
      if(a==='cfg'){openCfg(card,el);return;}
      if(a==='rename'){
        var cur=cfgFor(card).name||'Alexa'; t.innerHTML='';
        var inp=document.createElement('input'); inp.type='text'; inp.value=cur;
        inp.style.cssText='width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.4);outline:none;color:#fff;font-size:13px;font-weight:800;font-family:system-ui;padding:0;line-height:1';
        t.appendChild(inp); inp.focus(); inp.select(); el._axTtsFocus=true;
        function commit(){var v=inp.value.trim()||cur;var stored=load(card);stored.name=v;save(card,stored);el._axTtsFocus=false;el._axSig='';el._axBound=null;el.innerHTML=render(card);mount(card,null,el);}
        inp.addEventListener('blur',commit,{once:true});
        inp.addEventListener('keydown',function(e){if(e.key==='Enter')inp.blur();if(e.key==='Escape'){inp.removeEventListener('blur',commit);t.textContent=cur;el._axTtsFocus=false;}});
        return;
      }
      if(a==='source-open'){openSourcePicker(card,el);return;}
      if(a==='pp'){callSvc('media_player','media_play_pause',{entity_id:eid()});return;}
      if(a==='stop'){callSvc('media_player','media_stop',{entity_id:eid()});return;}
      if(a==='prev'){callSvc('media_player','media_previous_track',{entity_id:eid()});return;}
      if(a==='next'){callSvc('media_player','media_next_track',{entity_id:eid()});return;}
      if(a==='mute'){var h2=H(),at2=(h2&&h2.states&&h2.states[eid()]&&h2.states[eid()].attributes)||{};callSvc('media_player','volume_mute',{entity_id:eid(),is_volume_muted:!isBool(at2.is_volume_muted)});return;}
      if(a==='shuffle'){var h3=H(),at3=(h3&&h3.states&&h3.states[eid()]&&h3.states[eid()].attributes)||{};callSvc('media_player','shuffle_set',{entity_id:eid(),shuffle:!isBool(at3.shuffle)});return;}
      if(a==='repeat'){var h4=H(),at4=(h4&&h4.states&&h4.states[eid()]&&h4.states[eid()].attributes)||{};var modes=['off','all','one'],cur2=String(at4.repeat||'off');callSvc('media_player','repeat_set',{entity_id:eid(),repeat:modes[(modes.indexOf(cur2)+1)%modes.length]});return;}
      if(a==='vol-preset'){var pct=parseInt(t.dataset.vol)||50;callSvc('media_player','volume_set',{entity_id:eid(),volume_level:pct/100});applyVolUI(el,pct);return;}
      if(a==='timer-toggle'){_timerOpen[cid]=!_timerOpen[cid];el._axSig='';el._axBound=null;el.innerHTML=render(card);mount(card,null,el);return;}
      if(a==='timer-set'){startTimer(parseInt(t.dataset.min)||5);return;}
      if(a==='timer-custom-go'){
        var ci=el.querySelector('[data-axa="timer-custom"]');
        var min=ci?parseInt(ci.value):0;
        if(!min||min<1||min>240){if(ci){ci.style.borderColor='rgba(248,113,113,.6)';setTimeout(function(){ci.style.borderColor='';},1000);}return;}
        startTimer(min); return;
      }
      if(a==='timer-cancel'){
        if(_timerIv[cid]) clearInterval(_timerIv[cid]);
        _timerState[cid]=null;
        el._axSig='';el._axBound=null;el.innerHTML=render(card);mount(card,null,el); return;
      }
      if(a==='tts-send'){var inp2=el.querySelector('[data-axa="tts-inp"]');if(inp2){sendTts(inp2.value);inp2.value='';inp2.blur();}return;}
    };
    el.addEventListener('click',el._axHandler);

    /* TTS focus guard */
    var ttsInp=el.querySelector('[data-axa="tts-inp"]');
    if(ttsInp){
      ttsInp.addEventListener('focus',function(){el._axTtsFocus=true;});
      ttsInp.addEventListener('blur', function(){setTimeout(function(){el._axTtsFocus=false;},200);});
      ttsInp.addEventListener('keydown',function(e){if(e.key==='Enter'){sendTts(ttsInp.value);ttsInp.value='';ttsInp.blur();}});
    }

    /* timer custom input focus guard */
    var timerInp=el.querySelector('[data-axa="timer-custom"]');
    if(timerInp){
      timerInp.addEventListener('focus',function(){el._axTimerInputFocus=true;});
      timerInp.addEventListener('blur', function(){setTimeout(function(){el._axTimerInputFocus=false;},200);});
      timerInp.addEventListener('keydown',function(e){
        if(e.key==='Enter'){var m=parseInt(timerInp.value);if(m>=1&&m<=240)startTimer(m);}
      });
    }

    /* volume drag — mouse */
    el._axVolMD=function(e){
      var track=e.target.closest('[data-axa="vol-track"]'); if(!track) return;
      e.preventDefault(); el._axVolDragging=true;
      function r(x){var rc=track.getBoundingClientRect();return Math.max(0,Math.min(1,(x-rc.left)/rc.width));}
      function sv(x){applyVolUI(el,Math.round(r(x)*100));clearTimeout(el._axVolTimer);el._axVolTimer=setTimeout(function(){callSvc('media_player','volume_set',{entity_id:eid(),volume_level:r(x)});},80);}
      sv(e.clientX);
      function onMove(ev){sv(ev.clientX);}
      function onUp(ev){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);clearTimeout(el._axVolTimer);callSvc('media_player','volume_set',{entity_id:eid(),volume_level:Math.round(r(ev.clientX)*100)/100});setTimeout(function(){el._axVolDragging=false;},300);}
      document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp);
    };
    el.addEventListener('mousedown',el._axVolMD);

    /* volume drag — touch */
    el._axVolTS=function(e){
      var track=e.target.closest('[data-axa="vol-track"]'); if(!track) return;
      e.preventDefault(); el._axVolDragging=true;
      function r(t){var rc=track.getBoundingClientRect();return Math.max(0,Math.min(1,(t.clientX-rc.left)/rc.width));}
      function sv(ev){var t2=(ev.touches||ev.changedTouches)[0];if(!t2)return;applyVolUI(el,Math.round(r(t2)*100));clearTimeout(el._axVolTimer);el._axVolTimer=setTimeout(function(){callSvc('media_player','volume_set',{entity_id:eid(),volume_level:r(t2)});},80);}
      sv(e);
      function onMove(ev){sv(ev);}
      function onEnd(ev){el.removeEventListener('touchmove',onMove);el.removeEventListener('touchend',onEnd);clearTimeout(el._axVolTimer);var t2=(ev.changedTouches||[])[0];if(t2)callSvc('media_player','volume_set',{entity_id:eid(),volume_level:Math.round(r(t2)*100)/100});setTimeout(function(){el._axVolDragging=false;},300);}
      el.addEventListener('touchmove',onMove,{passive:false}); el.addEventListener('touchend',onEnd,{once:true});
    };
    el.addEventListener('touchstart',el._axVolTS,{passive:false});
  }

  /* ── REGISTRATION ── */
  var CARD={
    id:'alexa-card',name:'Alexa Media',icon:'🔊',version:'2.1',
    desc:'Alexa: album art, equalizzatore, sorgente, preset volume, timer countdown, TTS inline.',
    colSpan:2,rowSpan:3,frarik_no_edit:true,
    render:function(card){return render(card);},
    mount:function(card,hass,el){return mount(card,hass,el);},
    update:function(card,hass,el){return update(card,hass,el);},
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{console.log('[FratechStore] Card registrata: alexa-card v1.8');}catch(e){}
})();
