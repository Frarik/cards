/* frarik-version: 2.5 */
(function () {
  'use strict';

  var CARD_VER = '2.5';
  var _sbMuted = {};

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_tvcard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function _esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function callSvc(domain, service, data) {
    try { var h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch (e) {}
  }

  function hexRgb(hex) {
    try { var s=(hex||'#38bdf8').replace('#',''); if(s.length===3)s=s[0]+s[0]+s[1]+s[1]+s[2]+s[2]; return parseInt(s.slice(0,2),16)+','+parseInt(s.slice(2,4),16)+','+parseInt(s.slice(4,6),16); } catch(e){return '56,189,248';}
  }

  function cfgFor(card) {
    var c = load(card);
    return {
      pk_tv:        c.pk_tv        || 'media_player.tv_sala_2',
      pk_remote:    c.pk_remote    || 'remote.tv_sala',
      pk_bl:        c.pk_bl        || 'remote.broadlink',
      bl_device:    c.bl_device    || 'soundbar_lg',
      bl_vol_up:    c.bl_vol_up    || 'volume_su',
      bl_vol_down:  c.bl_vol_down  || 'volume_giu',
      bl_mute:      c.bl_mute      || 'mute',
      bl_power:     c.bl_power     || 'power',
      pk_sb_sensor: c.pk_sb_sensor || 'sensor.presa_tv_sala_potenza',
      sb_threshold: parseFloat(c.sb_threshold) || 30,
      cmd_up:       c.cmd_up       || 'DPAD_UP',
      cmd_down:     c.cmd_down     || 'DPAD_DOWN',
      cmd_left:     c.cmd_left     || 'DPAD_LEFT',
      cmd_right:    c.cmd_right    || 'DPAD_RIGHT',
      cmd_ok:       c.cmd_ok       || 'DPAD_CENTER',
      cmd_back:     c.cmd_back     || 'BACK',
      cmd_home:     c.cmd_home     || 'HOME',
      cmd_menu:     c.cmd_menu     || 'MENU',
      name:         c.name         || 'TV Sala',
      color:        c.color        || '#38bdf8',
    };
  }

  /* ─────────────── RENDER ─────────────── */
  function render(card) {
    var h = H(), c = cfgFor(card), cid = card.id || 'x', rid = 'tv-' + cid;
    var col = c.color, rgb = hexRgb(col);

    var tvEid = c.pk_tv;
    var tvSt  = S(h, tvEid) || 'unavailable';
    var tvAt  = (h && h.states && h.states[tvEid] && h.states[tvEid].attributes) || {};
    var isOn  = tvSt !== 'off' && tvSt !== 'unavailable' && tvSt !== 'standby';
    var isPlay = tvSt === 'playing';
    var isPause = tvSt === 'paused';

    var mediaTitle = tvAt.media_title || tvAt.app_name || '';
    var source     = tvAt.source || '';
    var sourceList = tvAt.source_list || [];
    var pic        = tvAt.entity_picture || '';

    var sbW  = parseFloat(S(h, c.pk_sb_sensor) || '0') || 0;
    var sbOn = sbW > c.sb_threshold;

    var stMap = { playing:'In riproduzione', paused:'In pausa', idle:'Accesa', on:'Accesa', standby:'Standby', off:'Spenta', unavailable:'Non disponibile' };
    var stateLbl = stMap[tvSt] || tvSt;
    var stateCol = isPlay ? col : isPause ? '#f59e0b' : isOn ? '#4ade80' : '#475569';
    var stateRgb = isPlay ? rgb : isPause ? '245,158,11' : isOn ? '74,222,128' : '71,85,105';

    /* art box */
    var artSrc = pic ? (pic.startsWith('http') ? pic : window.location.origin + pic) : '';
    var artHtml = artSrc
      ? '<img src="'+artSrc+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">'
        +'<div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;flex-direction:column;gap:4px">'
        +'<span style="font-size:28px">📺</span>'
        +'<span style="font-size:9px;color:#fff;font-weight:700">'+_esc(stateLbl)+'</span>'
        +'</div>'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px">'
        +'<span style="font-size:28px">📺</span>'
        +'<span style="font-size:9px;color:#fff;font-weight:700">'+_esc(stateLbl)+'</span>'
        +'</div>';

    /* source pill */
    var srcPill = (isOn && sourceList.length)
      ? '<div data-axa="src" style="display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);cursor:pointer;overflow:hidden;min-width:0">'
        +'<span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#fff;flex-shrink:0">IN</span>'
        +'<span style="font-size:10px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0">'+_esc(source||'—')+'</span>'
        +'<span style="color:#fff;font-size:9px;flex-shrink:0">▾</span>'
        +'</div>'
      : '';

    /* soundbar chip */
    var sbChip = '<div style="display:flex;align-items:center;gap:5px;padding:3px 7px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)">'
      +'<span style="font-size:9px;color:#fff;font-weight:700">🔊</span>'
      +'<span style="width:5px;height:5px;border-radius:50%;background:'+(sbOn?'#4ade80':'#475569')+';flex-shrink:0'+(sbOn?';box-shadow:0 0 4px #4ade80':'')+'">'
      +'</span>'
      +'<span style="font-size:9px;font-weight:700;color:'+(sbOn?'#4ade80':'#fff')+'">'+(sbOn?'Accesa':'Spenta')+'</span>'
      +'</div>';

    /* ── button styles ── */
    var bBase = 'display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;transition:opacity .1s';
    var bIcon = bBase+';width:42px;height:42px;border-radius:11px;font-size:17px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#fff;flex-shrink:0';
    var bPow  = bBase+';flex:1;height:40px;font-size:11px;font-weight:800;gap:6px;border-radius:11px;'
      +(isOn?'background:rgba('+rgb+',.18);border:1px solid '+col+';color:'+col
           :'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:#fff');
    var bApp  = bBase+';height:32px;border-radius:9px;font-size:10px;font-weight:800;white-space:nowrap;flex:1';
    var bNum  = bBase+';flex:1;height:36px;font-size:13px;font-weight:800;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);color:#fff';
    var bPb   = bBase+';flex:1;height:40px;font-size:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:11px';
    var bPP   = bBase+';flex:1;height:40px;font-size:18px;background:rgba('+rgb+',.2);border:1px solid '+col+';color:'+col+';box-shadow:0 0 12px rgba('+rgb+',.35);border-radius:11px';
    var bCh   = bBase+';width:46px;height:40px;font-size:10px;font-weight:800;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#fff;border-radius:11px;flex-direction:column;gap:1px';
    var bSb   = bBase+';flex:1;height:38px;font-size:12px;font-weight:700;gap:5px;border-radius:11px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);color:#fff';
    var bSbA  = bBase+';flex:1;height:38px;font-size:12px;font-weight:700;gap:5px;border-radius:11px;background:rgba(248,113,113,.18);border:1px solid #f87171;color:#f87171;box-shadow:0 0 10px rgba(248,113,113,.3)';
    var bNav  = bBase+';width:40px;height:40px;font-size:16px;border-radius:11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:#fff';
    var bNavSm = bBase+';flex:1;height:34px;font-size:10px;font-weight:700;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#fff';
    var bSrc  = bBase+';width:40px;height:40px;border-radius:11px;font-size:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;flex-shrink:0';

    /* ─ CSS ─ */
    var css = '<style>'
      +'@keyframes tvGl{0%,100%{box-shadow:0 0 0 1.5px '+col+',0 3px 16px rgba('+rgb+',.3)}50%{box-shadow:0 0 0 2px '+col+',0 4px 28px rgba('+rgb+',.55)}}'
      +'@keyframes tvDot{0%,100%{opacity:.55}50%{opacity:1}}'
      +'@keyframes tpRip{0%{transform:scale(0);opacity:.6}100%{transform:scale(2.5);opacity:0}}'
      +'@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}'
      +'#'+rid+'{position:relative;width:100%;height:100%;min-height:620px;font-family:system-ui,sans-serif}'
      +'#'+rid+' .fc-card{display:flex;flex-direction:column;height:100%;min-height:620px;background:linear-gradient(155deg,#060d14 0%,#09111e 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      +'#'+rid+' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 40% 0,rgba('+rgb+',.09) 0%,transparent 65%);pointer-events:none;z-index:0}'
      +'#'+rid+' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      +'#'+rid+' .fc-hdr-ico{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;background:rgba('+rgb+',.12);border:1px solid rgba('+rgb+',.25);flex-shrink:0}'
      +'#'+rid+' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}'
      +'#'+rid+' .fc-pill{display:flex;align-items:center;gap:5px;font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;background:rgba('+stateRgb+',.08);border:1px solid rgba('+stateRgb+',.22);color:'+stateCol+'}'
      +'#'+rid+' .fc-dot{width:6px;height:6px;border-radius:50%;background:'+stateCol+';flex-shrink:0'+(isPlay?';animation:tvDot .9s ease-in-out infinite':'')+'}'
      +'#'+rid+' .fc-gear{margin-left:2px;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;cursor:pointer;flex-shrink:0}'
      +'#'+rid+' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      +'#'+rid+' .fc-scroll::-webkit-scrollbar{display:none}'
      +'#'+rid+' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;gap:0}'
      +'#'+rid+' .fc-art{width:82px;height:70px;border-radius:10px;overflow:hidden;flex-shrink:0;background:rgba('+rgb+',.08);'+(isOn&&isPlay?'animation:tvGl 2.5s ease-in-out infinite':'border:1px solid rgba(255,255,255,.07)')+'}'
      +'#'+rid+' .fc-info{flex:1;padding-left:10px;border-left:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;gap:3px;min-width:0;justify-content:center}'
      +'#'+rid+' .fc-sep{height:1px;background:rgba(255,255,255,.06);margin:0 14px;flex-shrink:0}'
      +'#'+rid+' .fc-sec{padding:6px 14px 4px;flex-shrink:0}'
      +'#'+rid+' .fc-sec-lbl{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.7px;color:#fff;margin-bottom:5px}'
      +'#'+rid+' [data-axa]:active{opacity:.5}'
      +'#'+rid+' .tp-wrap{position:relative;padding:0 14px 6px;flex-shrink:0}'
      +'#'+rid+' .tp-pad{border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);position:relative;overflow:hidden;height:140px;cursor:pointer;touch-action:none;user-select:none;-webkit-tap-highlight-color:transparent}'
      +'#'+rid+' .tp-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:3px;pointer-events:none}'
      +'#'+rid+' .tp-hint{font-size:9px;font-weight:700;color:#fff;letter-spacing:.4px}'
      +'#'+rid+' .tp-ico{font-size:22px;color:#fff}'
      +'#'+rid+' .tp-arr{position:absolute;font-size:13px;color:#fff;pointer-events:none}'
      +'#'+rid+' .tp-rip{position:absolute;width:60px;height:60px;border-radius:50%;background:rgba('+rgb+',.35);transform:scale(0);pointer-events:none;margin-left:-30px;margin-top:-30px}'
      +'</style>';

    /* ─ HERO ─ */
    var hero = '<div class="fc-hero">'
      +'<div class="fc-art">'+artHtml+'</div>'
      +'<div class="fc-info">'
      +(isOn && mediaTitle ? '<div style="font-size:12px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3">'+_esc(mediaTitle)+'</div>' : '')
      +(isOn && source ? '<div style="font-size:10px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_esc(source)+'</div>' : '')
      +(!isOn || (!mediaTitle&&!source) ? '<div style="font-size:12px;font-weight:700;color:#fff">'+_esc(stateLbl)+'</div>' : '')
      +srcPill
      +sbChip
      +'</div>'
      +'</div>';

    /* ─ POWER + SOURCE ─ */
    var powerRow = '<div class="fc-sec" style="padding-top:8px">'
      +'<div style="display:flex;gap:7px">'
      +'<div style="'+bPow+'" data-axa="power">⏻ '+(isOn?'Spegni':'Accendi TV')+'</div>'
      +'<div style="'+bSrc+'" data-axa="src" title="Sorgente">📥</div>'
      +'<div style="'+bSrc+'" data-axa="info" title="Info">ℹ️</div>'
      +'</div>'
      +'</div>';

    /* ─ APPS ─ */
    var appsRow = '<div class="fc-sec">'
      +'<div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.7px;color:#fff;margin-bottom:5px">App</div>'
      +'<div style="display:flex;gap:5px">'
      +'<div style="'+bApp+';background:rgba(229,9,20,.82);color:#fff" data-axa="app-netflix">▶ Netflix</div>'
      +'<div style="'+bApp+';background:rgba(255,0,0,.72);color:#fff" data-axa="app-youtube">▶ YouTube</div>'
      +'<div style="'+bApp+';background:rgba(30,215,96,.82);color:#0a1a0f" data-axa="app-spotify">♪ Spotify</div>'
      +'<div style="'+bApp+';background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#fff" data-axa="app-tv">📡 TV</div>'
      +'</div>'
      +'</div>';

    /* ─ TOUCHPAD ─ */
    var touchpad = '<div class="tp-wrap">'
      +'<div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.7px;color:#fff;margin-bottom:5px;padding:0">Touchpad</div>'
      +'<div class="tp-pad" id="'+rid+'-tp">'
      +'<div class="tp-center">'
      +'<div class="tp-ico">⊙</div>'
      +'</div>'
      +'<div class="tp-rip" id="'+rid+'-rip"></div>'
      +'</div>'
      +'</div>';

    /* ─ SYSTEM BUTTONS ─ */
    var sysRow = '<div class="fc-sec" style="padding-top:4px">'
      +'<div style="display:flex;gap:5px">'
      +'<div style="'+bNavSm+'" data-axa="nav-back">← BACK</div>'
      +'<div style="'+bNavSm+'" data-axa="nav-home">⌂ HOME</div>'
      +'<div style="'+bNavSm+'" data-axa="nav-menu">☰ MENU</div>'
      +'<div style="'+bNavSm+'" data-axa="nav-info">ℹ INFO</div>'
      +'</div>'
      +'</div>';

    /* ─ PLAYBACK + CHANNEL ─ */
    var pbRow = '<div class="fc-sec" style="padding-top:4px">'
      +'<div style="display:flex;gap:5px;align-items:center">'
      +'<div style="'+bCh+'" data-axa="ch-up"><span>▲</span><span style="font-size:8px;font-weight:800;letter-spacing:.3px">CH</span></div>'
      +'<div style="'+bPb+'" data-axa="rw">⏪</div>'
      +'<div style="'+bPP+'" data-axa="pp">'+(isPlay?'⏸':'▶')+'</div>'
      +'<div style="'+bPb+'" data-axa="ff">⏩</div>'
      +'<div style="'+bCh+'" data-axa="ch-down"><span style="font-size:8px;font-weight:800;letter-spacing:.3px">CH</span><span>▼</span></div>'
      +'</div>'
      +'</div>';

    /* ─ NUMBER PAD ─ */
    var nums = ['1','2','3','4','5','6','7','8','9','','0',''];
    var numRows = '';
    for (var ri=0; ri<4; ri++) {
      numRows += '<div style="display:flex;gap:5px;margin-bottom:5px">';
      for (var ci=0; ci<3; ci++) {
        var n = nums[ri*3+ci];
        if (n === '') {
          numRows += '<div style="flex:1;height:36px"></div>';
        } else {
          numRows += '<div style="'+bNum+'" data-axa="num-'+n+'">'+n+'</div>';
        }
      }
      numRows += '</div>';
    }
    var numPad = '<div class="fc-sec" style="padding-top:4px">'
      +'<div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.7px;color:#fff;margin-bottom:5px">Canali</div>'
      +numRows
      +'</div>';

    /* ─ SOUNDBAR ─ */
    var isMuted = !!_sbMuted[cid];
    var bMuteActive = bBase+';flex:1;height:38px;font-size:12px;font-weight:700;gap:5px;border-radius:11px;background:rgba(248,113,113,.22);border:1px solid #f87171;color:#f87171;box-shadow:0 0 12px rgba(248,113,113,.35)';
    var sbRow = '<div class="fc-sec" style="padding-top:2px;padding-bottom:10px">'
      +'<div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.7px;color:#fff;margin-bottom:5px">🔊 Soundbar</div>'
      +'<div style="display:flex;gap:5px">'
      +'<div style="'+bSb+'" data-axa="sb-dn">🔉 VOL −</div>'
      +'<div style="'+(isMuted?bMuteActive:bSb)+'" data-axa="sb-mu">🔇 MUTE'+(isMuted?' ✓':'')+'</div>'
      +'<div style="'+bSb+'" data-axa="sb-up">🔊 VOL +</div>'
      +'</div>'
      +'</div>';

    return css
      +'<div id="'+rid+'"><div class="fc-card">'
      +'<div class="fc-hdr">'
      +'<div class="fc-hdr-ico">📺</div>'
      +'<div class="fc-hdr-tit" data-axa="rename">'+_esc(c.name)+'</div>'
      +'<div class="fc-pill"><div class="fc-dot"></div>'+_esc(stateLbl)+'</div>'
      +'<div class="fc-gear" data-axa="cfg">⚙</div>'
      +'</div>'
      +'<div class="fc-scroll">'
      + hero
      +'<div class="fc-sep"></div>'
      + powerRow
      + appsRow
      +'<div class="fc-sep" style="margin-top:4px"></div>'
      + touchpad
      + sysRow
      +'<div class="fc-sep" style="margin-top:4px"></div>'
      + pbRow
      +'<div class="fc-sep" style="margin-top:4px"></div>'
      + numPad
      +'<div class="fc-sep"></div>'
      + sbRow
      +'</div>'
      +'</div></div>';
  }

  /* ─────────────── SOURCE POPUP ─────────────── */
  function mkOv(html, closeId) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML = html; document.body.appendChild(ov);
    var close = function(){ try{ document.body.removeChild(ov); }catch(e){} };
    var btn = ov.querySelector('#'+closeId); if(btn) btn.addEventListener('click', close);
    ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
    ov._close = close; return ov;
  }

  var POP_BASE = '<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcs{overflow-y:auto;scrollbar-width:none}.fcs::-webkit-scrollbar{display:none}</style>';

  function popShell(icon, rgb, title, sub, closeId, content) {
    return POP_BASE+'<div style="width:100%;max-height:80vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba('+rgb+',.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      +'<div style="width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;background:rgba('+rgb+',.14);border:1px solid rgba('+rgb+',.28)">'+icon+'</div>'
      +'<div><div style="font-size:14px;font-weight:800;color:#fff">'+title+'</div><div style="font-size:11px;color:#fff;margin-top:1px">'+sub+'</div></div>'
      +'<button id="'+closeId+'" style="margin-left:auto;width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07)">✕</button>'
      +'</div>'
      +'<div class="fcs" style="flex:1;overflow-y:auto">'+content+'</div>'
      +'</div>';
  }

  function openSrcPicker(card) {
    var h=H(), c=cfgFor(card);
    var at=(h&&h.states&&h.states[c.pk_tv]&&h.states[c.pk_tv].attributes)||{};
    var sources=at.source_list||[], curSrc=at.source||'', rgb=hexRgb(c.color);
    var listHtml = sources.length
      ? sources.map(function(s){
          var act=s===curSrc;
          return '<div data-src="'+_esc(s)+'" style="padding:12px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.05);'+(act?'background:rgba('+rgb+',.1)':'')+'">'
            +'<span style="width:16px;font-size:12px;color:'+c.color+'">'+( act?'▶':'' )+'</span>'
            +'<span style="font-size:12px;font-weight:'+(act?'800':'500')+';color:'+(act?c.color:'#fff')+'">'+_esc(s)+'</span>'
            +'</div>';
        }).join('')
      : '<div style="padding:20px;text-align:center;color:#fff;font-size:12px">Nessuna sorgente</div>';
    var ov=mkOv(popShell('📥',rgb,'Sorgente / Ingresso',curSrc||'—','src-close',listHtml),'src-close');
    ov.querySelectorAll('[data-src]').forEach(function(row){
      row.addEventListener('click',function(){
        callSvc('media_player','select_source',{entity_id:cfgFor(card).pk_tv,source:row.getAttribute('data-src')});
        ov._close();
      });
    });
  }

  /* ─────────────── CONFIG POPUP ─────────────── */
  function openCfg(card, el) {
    var h=H(), c=cfgFor(card);
    var allStates = (h&&h.states)||{};
    var mpIds   = Object.keys(allStates).filter(function(id){return id.startsWith('media_player.');}).sort();
    var remIds  = Object.keys(allStates).filter(function(id){return id.startsWith('remote.');}).sort();
    var sensIds = Object.keys(allStates).filter(function(id){return id.startsWith('sensor.');}).sort();
    var rgb = hexRgb(c.color);

    var stInp='width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stLbl='font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#fff;margin-bottom:3px;display:block';
    var stSec='font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:#38bdf8;margin:12px 0 7px;padding-bottom:3px;border-bottom:1px solid rgba(56,189,248,.18)';

    function acFld(fid,lbl,val,ph,ids){
      return '<div style="margin-bottom:8px;position:relative"><label style="'+stLbl+'">'+lbl+'</label>'
        +'<input id="'+fid+'" type="text" value="'+_esc(val||'')+'" autocomplete="off" placeholder="'+ph+'" style="'+stInp+'">'
        +'<div id="'+fid+'-d" style="position:absolute;left:0;right:0;top:100%;margin-top:2px;z-index:300;max-height:110px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.15);border-radius:9px;display:none;scrollbar-width:none"></div>'
        +'</div>';
    }
    function simFld(fid,lbl,val,ph){
      return '<div style="margin-bottom:8px"><label style="'+stLbl+'">'+lbl+'</label>'
        +'<input id="'+fid+'" type="text" value="'+_esc(val||'')+'" autocomplete="off" placeholder="'+ph+'" style="'+stInp+'"></div>';
    }

    var COLORS=['#38bdf8','#818cf8','#f472b6','#4ade80','#fb923c','#f87171','#facc15','#c084fc'];
    var colorPicker='<div style="margin-bottom:8px"><label style="'+stLbl+'">Colore</label>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +COLORS.map(function(clr){return '<div data-col="'+clr+'" style="width:24px;height:24px;border-radius:7px;cursor:pointer;background:'+clr+';border:2px solid '+(c.color===clr?'#fff':'transparent')+'"></div>';}).join('')+'</div></div>';

    var form='<div style="padding:13px 15px 6px">'
      +simFld('tvc-n','Nome card',c.name,'TV Sala')
      +'<div style="'+stSec+'">TV + Remote</div>'
      +acFld('tvc-tv','Media Player TV',c.pk_tv,'media_player.tv_sala_2',mpIds)
      +acFld('tvc-rem','Remote (navigazione)',c.pk_remote,'remote.tv_sala',remIds)
      +'<div style="'+stSec+'">Soundbar (Broadlink)</div>'
      +acFld('tvc-bl','Remote Broadlink',c.pk_bl,'remote.broadlink',remIds)
      +simFld('tvc-bld','Device',c.bl_device,'soundbar_lg')
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">'
      +'<div><label style="'+stLbl+'">VOL+</label><input id="tvc-bvu" type="text" value="'+_esc(c.bl_vol_up)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">VOL-</label><input id="tvc-bvd" type="text" value="'+_esc(c.bl_vol_down)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">MUTE</label><input id="tvc-bmu" type="text" value="'+_esc(c.bl_mute)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">POWER</label><input id="tvc-bpw" type="text" value="'+_esc(c.bl_power)+'" style="'+stInp+'"></div>'
      +'</div>'
      +acFld('tvc-sbs','Sensore potenza SB',c.pk_sb_sensor,'sensor.presa_tv_sala_potenza',sensIds)
      +simFld('tvc-sbt','Soglia ON (W)',String(c.sb_threshold),'30')
      +'<div style="'+stSec+'">Comandi navigazione (remote.tv_sala)</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">'
      +'<div><label style="'+stLbl+'">SU</label><input id="tvc-cu" type="text" value="'+_esc(c.cmd_up)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">GIÙ</label><input id="tvc-cd" type="text" value="'+_esc(c.cmd_down)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">SINISTRA</label><input id="tvc-cl" type="text" value="'+_esc(c.cmd_left)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">DESTRA</label><input id="tvc-cr" type="text" value="'+_esc(c.cmd_right)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">OK/ENTER</label><input id="tvc-co" type="text" value="'+_esc(c.cmd_ok)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">BACK</label><input id="tvc-cb" type="text" value="'+_esc(c.cmd_back)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">HOME</label><input id="tvc-ch" type="text" value="'+_esc(c.cmd_home)+'" style="'+stInp+'"></div>'
      +'<div><label style="'+stLbl+'">MENU</label><input id="tvc-cm" type="text" value="'+_esc(c.cmd_menu)+'" style="'+stInp+'"></div>'
      +'</div>'
      +'<div style="'+stSec+'">Aspetto</div>'
      +colorPicker
      +'<div style="display:flex;gap:8px;margin-top:14px;margin-bottom:2px">'
      +'<button id="tvc-can" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.09);color:#fff">Annulla</button>'
      +'<button id="tvc-sav" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#38bdf8;color:#040c1a">Salva</button>'
      +'</div>'
      +'</div>';

    var ov=mkOv(popShell('⚙',rgb,'Configura TV Card',card.id||'','tvc-cls',form),'tvc-cls');
    ov.querySelector('#tvc-can').addEventListener('click',function(){ov._close();});
    var selColor=c.color;
    ov.querySelectorAll('[data-col]').forEach(function(dot){
      dot.addEventListener('click',function(){selColor=dot.getAttribute('data-col');ov.querySelectorAll('[data-col]').forEach(function(d){d.style.borderColor='transparent';});dot.style.borderColor='#fff';});
    });
    [['tvc-tv',mpIds],['tvc-rem',remIds],['tvc-bl',remIds],['tvc-sbs',sensIds]].forEach(function(pr){
      var inp=ov.querySelector('#'+pr[0]),drop=ov.querySelector('#'+pr[0]+'-d');
      if(!inp||!drop) return;
      function show(){
        var q=inp.value.toLowerCase();
        var hits=(q?pr[1].filter(function(id){return id.toLowerCase().includes(q);}):pr[1]).slice(0,22);
        if(!hits.length){drop.style.display='none';return;}
        drop.style.display='block';
        drop.innerHTML=hits.map(function(id){return '<div data-p="'+id+'" style="padding:5px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#fff">'+id+'</div>';}).join('');
        drop.querySelectorAll('[data-p]').forEach(function(r){
          r.addEventListener('mousedown',function(ev){ev.preventDefault();inp.value=r.getAttribute('data-p');drop.style.display='none';});
          r.addEventListener('mouseover',function(){r.style.background='rgba(255,255,255,.08)';});
          r.addEventListener('mouseout',function(){r.style.background='';});
        });
      }
      inp.addEventListener('focus',show); inp.addEventListener('input',show);
      inp.addEventListener('blur',function(){setTimeout(function(){drop.style.display='none';},180);});
    });
    ov.querySelector('#tvc-sav').addEventListener('click',function(){
      function v(id){var e=ov.querySelector('#'+id);return e?e.value.trim():'';}
      save(card,{name:v('tvc-n'),pk_tv:v('tvc-tv'),pk_remote:v('tvc-rem'),
        pk_bl:v('tvc-bl'),bl_device:v('tvc-bld'),bl_vol_up:v('tvc-bvu'),bl_vol_down:v('tvc-bvd'),bl_mute:v('tvc-bmu'),bl_power:v('tvc-bpw'),
        pk_sb_sensor:v('tvc-sbs'),sb_threshold:parseFloat(v('tvc-sbt'))||30,
        cmd_up:v('tvc-cu'),cmd_down:v('tvc-cd'),cmd_left:v('tvc-cl'),cmd_right:v('tvc-cr'),
        cmd_ok:v('tvc-co'),cmd_back:v('tvc-cb'),cmd_home:v('tvc-ch'),cmd_menu:v('tvc-cm'),
        color:selColor});
      ov._close();
      try{el._tvSig='';el._tvBound=null;el.innerHTML=render(card);mount(card,null,el);}catch(e){}
    });
  }

  /* ─────────────── UPDATE ─────────────── */
  function update(card, hass, el) {
    if (el._tvTouch) return;
    var h=H(), c=cfgFor(card);
    var tvSt=S(h,c.pk_tv), tvAt=(h&&h.states&&h.states[c.pk_tv]&&h.states[c.pk_tv].attributes)||{};
    var sbW=parseFloat(S(h,c.pk_sb_sensor)||'0')||0;
    var sig=[CARD_VER,tvSt,tvAt.media_title,tvAt.app_name,tvAt.entity_picture,tvAt.source,Math.floor(sbW)].join('|');
    if(!el.querySelector('.fc-card')||el._tvSig!==sig){
      el._tvSig=sig; el._tvBound=null; el.innerHTML=render(card);
    }
    mount(card,hass,el);
  }

  /* ─────────────── MOUNT ─────────────── */
  function mount(card, hass, el) {
    if (el._tvBound===CARD_VER) return;
    el._tvBound=CARD_VER;
    if(el._tvCH) el.removeEventListener('click',el._tvCH);

    function cfg() { return cfgFor(card); }
    function remCmd(cmd) { callSvc('remote','send_command',{entity_id:cfg().pk_remote,command:cmd}); }
    function blCmd(cmd)  { var c=cfg(); callSvc('remote','send_command',{entity_id:c.pk_bl,device:c.bl_device,command:cmd}); }

    /* ─ CLICK HANDLER ─ */
    el._tvCH = function(e) {
      var t = e.target.closest('[data-axa]'); if(!t) return;
      var a = t.dataset.axa;
      if(a==='cfg')    { openCfg(card,el); return; }
      if(a==='src')    { openSrcPicker(card); return; }
      if(a==='rename') {
        var cur=cfg().name; t.innerHTML='';
        var inp=document.createElement('input'); inp.type='text'; inp.value=cur;
        inp.style.cssText='width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.4);outline:none;color:#fff;font-size:13px;font-weight:800;font-family:system-ui;padding:0';
        t.appendChild(inp); inp.focus(); inp.select();
        var commit=function(){var v=inp.value.trim()||cur;var s=load(card);s.name=v;save(card,s);el._tvSig='';el._tvBound=null;el.innerHTML=render(card);mount(card,null,el);};
        inp.addEventListener('blur',commit,{once:true});
        inp.addEventListener('keydown',function(ev){if(ev.key==='Enter')inp.blur();if(ev.key==='Escape'){inp.removeEventListener('blur',commit);t.textContent=cur;}});
        return;
      }
      /* power */
      if(a==='power') {
        var h=H(), st=S(h,cfg().pk_tv);
        if(st==='off'||st==='unavailable'||st==='standby') callSvc('media_player','turn_on',{entity_id:cfg().pk_tv});
        else callSvc('media_player','turn_off',{entity_id:cfg().pk_tv});
        return;
      }
      /* info */
      if(a==='info') { remCmd(cfg().cmd_menu); return; }
      /* navigation (dai comandi configurabili) */
      if(a==='nav-back'){ remCmd(cfg().cmd_back); return; }
      if(a==='nav-home'){ remCmd(cfg().cmd_home); return; }
      if(a==='nav-menu'){ remCmd(cfg().cmd_menu); return; }
      if(a==='nav-info'){ remCmd('INFO');          return; }
      /* playback */
      if(a==='pp')    { remCmd('MEDIA_PLAY_PAUSE');  return; }
      if(a==='rw')    { remCmd('MEDIA_REWIND');       return; }
      if(a==='ff')    { remCmd('MEDIA_FAST_FORWARD'); return; }
      if(a==='ch-up') { remCmd('CHANNEL_UP');         return; }
      if(a==='ch-down'){ remCmd('CHANNEL_DOWN');      return; }
      /* app shortcuts */
      if(a==='app-netflix'){ callSvc('media_player','select_source',{entity_id:cfg().pk_tv,source:'Netflix'}); return; }
      if(a==='app-youtube'){ callSvc('media_player','select_source',{entity_id:cfg().pk_tv,source:'YouTube'}); return; }
      if(a==='app-spotify'){ callSvc('media_player','select_source',{entity_id:cfg().pk_tv,source:'Spotify'}); return; }
      if(a==='app-tv')     { remCmd('TV'); return; }
      /* number buttons */
      if(a&&a.startsWith('num-')){ remCmd(a.replace('num-','')); return; }
      /* soundbar */
      if(a==='sb-up'){ blCmd(cfg().bl_vol_up);  return; }
      if(a==='sb-dn'){ blCmd(cfg().bl_vol_down); return; }
if(a==='sb-mu'){
        var cid2=card.id||'x';
        _sbMuted[cid2]=!_sbMuted[cid2];
        blCmd(cfg().bl_mute);
        el._tvSig=''; el._tvBound=null; el.innerHTML=render(card); mount(card,null,el);
        return;
      }
    };
    el.addEventListener('click', el._tvCH);

    /* ─ TOUCHPAD ─ */
    var rid = 'tv-' + (card.id||'x');
    var tp  = el.querySelector('#'+rid+'-tp');
    var rip = el.querySelector('#'+rid+'-rip');
    if(!tp) return;

    var tStart=null;
    var MIN_SWIPE=28, SWIPE_ANGLE=35;
    var tpActive=false;

    function doRipple(x,y) {
      if(!rip) return;
      rip.style.left=x+'px'; rip.style.top=y+'px';
      rip.style.animation='none'; rip.offsetHeight;
      rip.style.animation='tpRip .4s ease-out forwards';
    }

    function onTpDown(ex,ey,rect) {
      tStart={x:ex,y:ey,rx:ex-rect.left,ry:ey-rect.top,moved:false};
      el._tvTouch=true;
    }
    function onTpMove(ex,ey) {
      if(!tStart) return;
      var dx=ex-tStart.x, dy=ey-tStart.y;
      if(Math.abs(dx)>5||Math.abs(dy)>5) tStart.moved=true;
    }
    function onTpUp(ex,ey) {
      if(!tStart){el._tvTouch=false;return;}
      var dx=ex-tStart.x, dy=ey-tStart.y;
      var dist=Math.sqrt(dx*dx+dy*dy);
      doRipple(tStart.rx,tStart.ry);
      if(dist<MIN_SWIPE) {
        /* tap = OK */
        remCmd(cfg().cmd_ok);
      } else {
        /* swipe direction */
        var angle=Math.atan2(dy,dx)*180/Math.PI;
        if(angle>-(90+SWIPE_ANGLE)&&angle<-(90-SWIPE_ANGLE)) { remCmd(cfg().cmd_up); }
        else if(angle>(90-SWIPE_ANGLE)&&angle<(90+SWIPE_ANGLE)) { remCmd(cfg().cmd_down); }
        else if(dist>=MIN_SWIPE&&(angle>180-SWIPE_ANGLE||angle<-(180-SWIPE_ANGLE))) { remCmd(cfg().cmd_left); }
        else if(dist>=MIN_SWIPE&&angle>-SWIPE_ANGLE&&angle<SWIPE_ANGLE) { remCmd(cfg().cmd_right); }
      }
      tStart=null;
      setTimeout(function(){el._tvTouch=false;},80);
    }

    /* touch */
    tp.addEventListener('touchstart',function(e){
      e.preventDefault();
      var t=e.changedTouches[0], rect=tp.getBoundingClientRect();
      onTpDown(t.clientX,t.clientY,rect);
    },{passive:false});
    tp.addEventListener('touchmove',function(e){
      e.preventDefault();
      var t=e.changedTouches[0];
      onTpMove(t.clientX,t.clientY);
    },{passive:false});
    tp.addEventListener('touchend',function(e){
      var t=e.changedTouches[0];
      onTpUp(t.clientX,t.clientY);
    },{passive:false});
    /* mouse */
    tp.addEventListener('mousedown',function(e){
      var rect=tp.getBoundingClientRect();
      onTpDown(e.clientX,e.clientY,rect);
    });
    tp.addEventListener('mousemove',function(e){
      if(!tStart) return;
      onTpMove(e.clientX,e.clientY);
    });
    tp.addEventListener('mouseup',function(e){ onTpUp(e.clientX,e.clientY); });
    tp.addEventListener('mouseleave',function(e){ if(tStart) onTpUp(e.clientX,e.clientY); });
  }

  var CARD = {
    id:'tv-card', name:'TV Remote', icon:'📺', version:CARD_VER,
    desc:'TV Philips Android TV + Soundbar LG. Touchpad, numeri, app, navigazione.',
    colSpan:2, rowSpan:5, frarik_no_edit:true,
    render:  function(c){return render(c);},
    mount:   function(c,h,e){return mount(c,h,e);},
    update:  function(c,h,e){return update(c,h,e);},
  };
  window.FratechCardRegistry = window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards||{};
  window.FratechCards[CARD.id] = CARD;
  try{console.log('[FratechStore] Card registrata: tv-card v'+CARD_VER);}catch(e){}
})();
