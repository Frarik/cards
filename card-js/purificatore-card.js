/* frarik-version: 1.2 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch(e) {} return null; }
  function keyOf(c) { return 'frarik_purcard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch(e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch(e) {} }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function callSvc(d, s, data) { try { var h = H(); if (h && h.callService) h.callService(d, s, data || {}); } catch(e) {} }
  function hexRgb(hex) { try { var s=(hex||'#4ade80').replace('#',''); if(s.length===3)s=s[0]+s[0]+s[1]+s[1]+s[2]+s[2]; return parseInt(s.slice(0,2),16)+','+parseInt(s.slice(2,4),16)+','+parseInt(s.slice(4,6),16); } catch(e){return '74,222,128';} }
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function num(v) { var x=parseFloat(String(v!=null?v:'').replace(',','.')); return isNaN(x)?null:x; }

  function cfgFor(card) {
    var c = load(card);
    return {
      pk_device: c.pk_device || 'fan.purificatore',
      pk_pm25:   c.pk_pm25   || '',
      pk_aqi:    c.pk_aqi    || '',
      name:      c.name      || 'Purificatore',
      color:     c.color     || '#4ade80',
    };
  }

  /* ── SVG PURIFICATORE ── */
  function purSVG(col, rgb, isOn, pm25) {
    var uid = 'pur' + Math.floor(Math.random()*99999);
    var css = isOn
      ? '@keyframes '+uid+'Ring{0%,100%{opacity:.55}50%{opacity:1}}'
        + '@keyframes '+uid+'P{0%{opacity:.8;transform:translateY(0px)}100%{opacity:0;transform:translateY(-22px)}}'
        + '@keyframes '+uid+'Led{0%,100%{opacity:.7}50%{opacity:1}}'
        + '@keyframes '+uid+'Gw{0%,100%{filter:drop-shadow(0 0 7px rgba('+rgb+',.45))}50%{filter:drop-shadow(0 0 16px rgba('+rgb+',.85))}}'
      : '';

    var pm25Col = pm25==null?'#64748b':pm25<12?'#22c55e':pm25<35?'#eab308':'#ef4444';
    var pm25Txt = pm25!=null ? pm25.toFixed(pm25<10?1:0) : '—';

    var particles = isOn
      ? '<circle cx="34" cy="48" r="1.5" fill="rgba('+rgb+',.75)" style="animation:'+uid+'P 2s ease-out infinite"/>'
        + '<circle cx="50" cy="52" r="1.2" fill="rgba('+rgb+',.55)" style="animation:'+uid+'P 2.4s ease-out .65s infinite"/>'
        + '<circle cx="66" cy="46" r="1.5" fill="rgba('+rgb+',.75)" style="animation:'+uid+'P 1.9s ease-out 1.2s infinite"/>'
        + '<circle cx="42" cy="50" r="1.0" fill="rgba('+rgb+',.45)" style="animation:'+uid+'P 2.2s ease-out .3s infinite"/>'
        + '<circle cx="58" cy="49" r="1.3" fill="rgba('+rgb+',.65)" style="animation:'+uid+'P 2.1s ease-out .9s infinite"/>'
      : '';

    return '<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;overflow:visible" preserveAspectRatio="xMidYMid meet">'
      + '<style>'+css+'</style>'
      + '<defs>'
      + '<linearGradient id="'+uid+'Bg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#0d1c2a"/><stop offset="45%" stop-color="#18293d"/><stop offset="100%" stop-color="#0d1c2a"/></linearGradient>'
      + '<radialGradient id="'+uid+'TopG" cx="50%" cy="100%" r="70%"><stop offset="0%" stop-color="rgba('+rgb+',.25)"/><stop offset="100%" stop-color="rgba('+rgb+',0)"/></radialGradient>'
      + '</defs>'
      /* body — torre sottile */
      + '<rect x="28" y="2" width="44" height="88" rx="14" fill="url(#'+uid+'Bg)" stroke="'+(isOn?col:'#1a3050')+'" stroke-width="'+(isOn?'1.5':'0.7')+'" '+(isOn?'style="animation:'+uid+'Gw 2.5s ease-in-out infinite"':'')+'/>'
      /* cima arrotondata — griglia uscita aria */
      + '<ellipse cx="50" cy="14" rx="18" ry="7" fill="#07111c" stroke="rgba(255,255,255,.07)" stroke-width=".7"/>'
      + '<ellipse cx="50" cy="12" rx="12" ry="4.5" fill="#04090f"/>'
      + (isOn?'<ellipse cx="50" cy="12" rx="12" ry="4.5" fill="none" stroke="'+col+'" stroke-width="1.2" style="animation:'+uid+'Ring 1.5s ease-in-out infinite"/>':'')
      + (isOn?'<ellipse cx="50" cy="12" rx="6" ry="2.2" fill="rgba('+rgb+',.4)" style="animation:'+uid+'Ring 1.8s ease-in-out infinite .3s"/>':'')
      /* griglia laterale sinistra */
      + '<line x1="28" y1="38" x2="32" y2="38" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      + '<line x1="28" y1="43" x2="32" y2="43" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      + '<line x1="28" y1="48" x2="32" y2="48" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      + '<line x1="28" y1="53" x2="32" y2="53" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      + '<line x1="28" y1="58" x2="32" y2="58" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      /* griglia laterale destra */
      + '<line x1="68" y1="38" x2="72" y2="38" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      + '<line x1="68" y1="43" x2="72" y2="43" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      + '<line x1="68" y1="48" x2="72" y2="48" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      + '<line x1="68" y1="53" x2="72" y2="53" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      + '<line x1="68" y1="58" x2="72" y2="58" stroke="rgba(255,255,255,.13)" stroke-width=".9"/>'
      /* anello filtro HEPA */
      + '<rect x="30" y="25" width="40" height="30" rx="5" fill="#060e18"/>'
      + '<rect x="32" y="27" width="36" height="26" rx="4" fill="none" stroke="rgba('+rgb+',.15)" stroke-width="1"/>'
      + '<rect x="34" y="29" width="32" height="22" rx="3" fill="none" stroke="rgba('+rgb+',.08)" stroke-width=".7"/>'
      /* particelle aria */
      + particles
      /* display PM2.5 */
      + '<rect x="32" y="60" width="36" height="22" rx="5" fill="#040d17" stroke="rgba('+rgb+',.18)" stroke-width=".7"/>'
      + '<text x="50" y="71" text-anchor="middle" font-family="monospace,system-ui" font-size="10" font-weight="900" fill="'+pm25Col+'">'+pm25Txt+'</text>'
      + '<text x="50" y="77" text-anchor="middle" font-family="system-ui" font-size="3.8" font-weight="700" fill="#fff">PM2.5 µg/m³</text>'
      /* gradiente cima (aria uscente) */
      + (isOn?'<rect x="28" y="2" width="44" height="30" rx="14" fill="url(#'+uid+'TopG)" style="pointer-events:none"/>':'')
      /* base */
      + '<rect x="22" y="88" width="56" height="10" rx="6" fill="#07111d"/>'
      + '<rect x="24" y="90" width="52" height="6" rx="4" fill="#0a1926"/>'
      /* LED */
      + '<circle cx="50" cy="93" r="2" fill="'+(isOn?col:'#0e2035')+'" '+(isOn?'style="filter:drop-shadow(0 0 4px '+col+');animation:'+uid+'Led 2s ease-in-out infinite"':'')+'/>'
      + '</svg>';
  }

  /* ── HELPERS ── */
  function mkOv(html,closeId){var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';ov.innerHTML=html;document.body.appendChild(ov);var close=function(){try{document.body.removeChild(ov);}catch(e){}};var btn=ov.querySelector('#'+closeId);if(btn)btn.addEventListener('click',close);ov.addEventListener('click',function(e){if(e.target===ov)close();});ov._close=close;return ov;}
  var POP_CSS='<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc{overflow-y:auto;scrollbar-width:none}.fcpc::-webkit-scrollbar{display:none}</style>';
  function popShell(icon,rgb,title,sub,closeId,content){return POP_CSS+'<div style="width:100%;max-height:76vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba('+rgb+',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden"><div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0"><div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba('+rgb+',.15);border:1px solid rgba('+rgb+',.3)">'+icon+'</div><div><div style="font-size:14px;font-weight:800;color:#fff">'+title+'</div><div style="font-size:11px;color:#fff;margin-top:1px">'+sub+'</div></div><button id="'+closeId+'" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button></div><div class="fcpc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column">'+content+'</div></div>';}

  /* ── CONFIG ── */
  function openCfg(card, el) {
    var c=cfgFor(card), h=H(), states=(h&&h.states)||{};
    var allIds=Object.keys(states).sort();
    var stInp='width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stLbl='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#fff;margin-bottom:3px;display:block';
    var stSec='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:'+c.color+';margin:12px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(74,222,128,.2)';
    var COLORS=['#4ade80','#38bdf8','#60a5fa','#a78bfa','#f472b6','#fb923c','#facc15','#f87171'];
    function fld(fid,lbl,val){return '<div style="margin-bottom:9px;position:relative"><label style="'+stLbl+'">'+lbl+'</label><input id="'+fid+'" type="text" value="'+_esc(val||'')+'" autocomplete="off" placeholder="Cerca entità…" style="'+stInp+'"><div id="'+fid+'-d" style="position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:140px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none"></div></div>';}
    var colorPicker='<div style="margin-bottom:12px"><label style="'+stLbl+'">Colore accent</label><div style="display:flex;gap:6px;flex-wrap:wrap">'+COLORS.map(function(clr){return '<div data-pcol="'+clr+'" style="width:24px;height:24px;border-radius:7px;cursor:pointer;background:'+clr+';border:2px solid '+(c.color===clr?'#fff':'transparent')+'"></div>';}).join('')+'</div></div>';
    var formHtml='<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome card</label><input id="pc-name" type="text" value="'+_esc(c.name||'')+'" placeholder="es. Purificatore Salotto" style="'+stInp.replace('monospace','system-ui')+'"></div>'
      +'<div style="'+stSec+'">Entità</div>'
      +fld('pc-dev','Purificatore (fan.*)',c.pk_device)
      +fld('pc-pm25','Sensore PM2.5 (opzionale)',c.pk_pm25)
      +fld('pc-aqi','Sensore AQI (opzionale)',c.pk_aqi)
      +colorPicker
      +'<div style="display:flex;gap:8px;margin-top:12px"><button id="pc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button><button id="pc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:'+c.color+';color:#060d14">Salva</button></div>';
    var ov=mkOv(popShell('🌿',hexRgb(c.color),'Configura Purificatore',card.id||'','pc-cfg-close',formHtml),'pc-cfg-close');
    ov.querySelector('#pc-cancel').addEventListener('click',function(){ov._close();});
    var selColor=c.color;
    ov.querySelectorAll('[data-pcol]').forEach(function(dot){dot.addEventListener('click',function(){selColor=dot.getAttribute('data-pcol');ov.querySelectorAll('[data-pcol]').forEach(function(d){d.style.borderColor='transparent';});dot.style.borderColor='#fff';});});
    ['pc-dev','pc-pm25','pc-aqi'].forEach(function(fid){
      var inp=ov.querySelector('#'+fid),drop=ov.querySelector('#'+fid+'-d');
      if(!inp||!drop) return;
      function show(){var q=inp.value.toLowerCase().trim();var hits=(q?allIds.filter(function(id){return id.toLowerCase().includes(q);}):allIds).slice(0,30);if(!hits.length){drop.style.display='none';return;}drop.style.display='block';drop.innerHTML=hits.map(function(id){return '<div data-pick="'+id+'" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#fff">'+id+'</div>';}).join('');drop.querySelectorAll('[data-pick]').forEach(function(row){row.addEventListener('mousedown',function(ev){ev.preventDefault();inp.value=row.getAttribute('data-pick');drop.style.display='none';});row.addEventListener('mouseover',function(){row.style.background='rgba(255,255,255,.08)';});row.addEventListener('mouseout',function(){row.style.background='';});});}
      inp.addEventListener('focus',show);inp.addEventListener('input',show);inp.addEventListener('blur',function(){setTimeout(function(){drop.style.display='none';},200);});
    });
    ov.querySelector('#pc-save').addEventListener('click',function(){
      var n=ov.querySelector('#pc-name'),d=ov.querySelector('#pc-dev'),p=ov.querySelector('#pc-pm25'),a=ov.querySelector('#pc-aqi');
      save(card,{name:n?n.value.trim():c.name,pk_device:d?d.value.trim():c.pk_device,pk_pm25:p?p.value.trim():c.pk_pm25,pk_aqi:a?a.value.trim():c.pk_aqi,color:selColor});
      ov._close();try{el._purSig='';el._purBound=null;el.innerHTML=render(card);mount(card,null,el);}catch(e){}
    });
  }

  /* ── RENDER ── */
  function render(card) {
    var h=H(), c=cfgFor(card), cid=card.id||'x', rid='pur-'+cid;
    var col=c.color, rgb=hexRgb(col);
    var eid=c.pk_device;
    var state=S(h,eid)||'unavailable';
    var attrs=(h&&h.states&&h.states[eid]&&h.states[eid].attributes)||{};
    var isOn=state==='on';

    var pm25 = c.pk_pm25 ? num(S(h,c.pk_pm25)) : null;
    var aqi  = c.pk_aqi  ? num(S(h,c.pk_aqi))  : null;
    var pct  = num(attrs.percentage);
    var mode = attrs.preset_mode || '';
    var modes = attrs.preset_modes || ['auto','notte','turbo'];

    var pm25Col = pm25==null?col:pm25<12?'#22c55e':pm25<35?'#eab308':'#ef4444';
    var pm25Lbl = pm25==null?'—':pm25<12?'Ottima':pm25<35?'Buona':'Scarsa';

    var stLbls={on:'Acceso',off:'Spento',unavailable:'Non disponibile'};
    var stateLbl=stLbls[state]||state;
    var stateCol=isOn?col:'#6b7fa8', stateRgb=isOn?rgb:'107,127,168';

    var artHtml='<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:6px;box-sizing:border-box">'+purSVG(col,rgb,isOn,pm25)+'</div>';

    var infoRows='';
    if(pm25!=null){
      infoRows+='<div style="font-size:22px;font-weight:900;color:'+pm25Col+';line-height:1">'+pm25.toFixed(pm25<10?1:0)+'<span style="font-size:11px;font-weight:600;color:#fff"> µg/m³</span></div>'
        +'<div style="font-size:9px;font-weight:700;color:#fff;margin-top:2px">PM2.5 — Qualità '+pm25Lbl+'</div>';
    } else {
      infoRows+='<div style="font-size:13px;font-weight:700;color:#fff">'+stateLbl+'</div>';
    }
    if(pct!=null && isOn){
      infoRows+='<div style="margin-top:5px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:9px;font-weight:800;color:#fff">Velocità ventola</span><span style="font-size:9px;font-weight:800;color:'+col+'">'+Math.round(pct)+'%</span></div>'
        +'<div style="height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden"><div style="height:100%;width:'+Math.round(pct)+'%;background:'+col+';border-radius:2px"></div></div></div>';
    }
    if(aqi!=null){
      infoRows+='<div style="margin-top:5px;padding:3px 8px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);display:inline-flex;align-items:center;gap:6px">'
        +'<span style="font-size:9px;font-weight:800;color:#fff">AQI</span><span style="font-size:12px;font-weight:900;color:'+col+'">'+Math.round(aqi)+'</span></div>';
    }

    var bOff='flex:1;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;font-size:10px;font-weight:700;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff';
    var bOn='flex:1;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;font-size:10px;font-weight:700;border:1px solid '+col+';background:rgba('+rgb+',.2);color:'+col;
    var bPow=isOn?'flex:1;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;user-select:none;font-size:11px;font-weight:800;border:1px solid '+col+';background:rgba('+rgb+',.18);color:'+col
                :'flex:1;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;user-select:none;font-size:11px;font-weight:800;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff';

    var speedPills=[10,25,50,75,100].map(function(p){
      var active=isOn&&pct!=null&&Math.abs(pct-p)<6;
      return '<div style="'+(active?bOn:bOff)+'" data-pya="speed" data-pct="'+p+'">'+p+'%</div>';
    }).join('');

    var modePills=modes.slice(0,4).map(function(m){
      var active=m&&mode&&m.toLowerCase()===mode.toLowerCase();
      return '<div style="'+(active?bOn:bOff)+'" data-pya="mode" data-mode="'+_esc(m)+'">'+_esc(m.charAt(0).toUpperCase()+m.slice(1))+'</div>';
    }).join('');

    var css='<style>'
      +'@keyframes purDot{0%,100%{opacity:.5}50%{opacity:1}}'
      +'#'+rid+'{position:relative;width:100%;height:100%;min-height:340px;font-family:system-ui,sans-serif}'
      +'#'+rid+' .fc-card{display:flex;flex-direction:column;height:100%;min-height:340px;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      +'#'+rid+' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:220px;background:radial-gradient(ellipse at 30% 0,rgba('+rgb+',.1) 0%,transparent 65%);pointer-events:none}'
      +'#'+rid+' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      +'#'+rid+' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;background:rgba('+rgb+',.12);border:1px solid rgba('+rgb+',.25)}'
      +'#'+rid+' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}'
      +'#'+rid+' .fc-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba('+stateRgb+',.08);border:1px solid rgba('+stateRgb+',.25);color:#fff}'
      +'#'+rid+' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:'+stateCol+(isOn?';animation:purDot .9s ease-in-out infinite':'')+'}'
      +'#'+rid+' .fc-gear{margin-left:4px;cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      +'#'+rid+' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      +'#'+rid+' .fc-scroll::-webkit-scrollbar{display:none}'
      +'#'+rid+' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      +'#'+rid+' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:visible;max-height:160px}'
      +'#'+rid+' .fc-art{width:100%;max-width:130px;aspect-ratio:1;border-radius:13px;overflow:visible;flex-shrink:0;background:linear-gradient(135deg,rgba('+rgb+',.18),rgba('+rgb+',.05));'+(isOn?'box-shadow:0 0 0 2px '+col+',0 4px 20px rgba('+rgb+',.4)':'box-shadow:0 4px 14px rgba(0,0,0,.5)')+'}'
      +'#'+rid+' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:4px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      +'#'+rid+' .fc-sep{height:1px;background:rgba(255,255,255,.06);margin:0 14px;flex-shrink:0}'
      +'#'+rid+' [data-pya]:active{opacity:.5}'
      +'</style>';

    return css
      +'<div id="'+rid+'"><div class="fc-card">'
      +'<div class="fc-hdr"><div class="fc-hdr-iw">🌿</div>'
      +'<div class="fc-hdr-tit" data-pya="rename">'+_esc(c.name)+'</div>'
      +'<div class="fc-pill"><div class="fc-dot"></div>'+_esc(stateLbl)+'</div>'
      +'<div class="fc-gear" data-pya="cfg">⚙</div></div>'
      +'<div class="fc-scroll">'
      +'<div class="fc-hero"><div class="fc-hero-img"><div class="fc-art">'+artHtml+'</div></div>'
      +'<div class="fc-hero-r">'+infoRows+'</div></div>'
      +'<div class="fc-sep"></div>'
      +'<div style="padding:8px 14px 6px;flex-shrink:0"><div style="display:flex;gap:7px">'
      +'<div style="'+bPow+'" data-pya="power">⏻ '+(isOn?'Spegni':'Accendi')+'</div>'
      +'</div></div>'
      +(isOn
        ? '<div class="fc-sep"></div>'
          +'<div style="padding:4px 14px 6px;flex-shrink:0">'
          +'<div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#fff;margin-bottom:5px">Velocità</div>'
          +'<div style="display:flex;gap:5px">'+speedPills+'</div>'
          +(modes.length
            ? '<div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#fff;margin:8px 0 5px">Modalità</div>'
              +'<div style="display:flex;gap:5px">'+modePills+'</div>'
            : '')
          +'</div>'
        : '')
      +'</div></div></div>';
  }

  /* ── UPDATE / MOUNT ── */
  function update(card, hass, el) {
    var h=H(), c=cfgFor(card), eid=c.pk_device;
    var st=S(h,eid), at=(h&&h.states&&h.states[eid]&&h.states[eid].attributes)||{};
    var pm25=c.pk_pm25?S(h,c.pk_pm25):null, aqi=c.pk_aqi?S(h,c.pk_aqi):null;
    var sig=[CARD.version,st,at.percentage,at.preset_mode,pm25,aqi].join('|');
    if(!el.querySelector('.fc-card')||el._purSig!==sig){ el._purSig=sig; el._purBound=null; el.innerHTML=render(card); }
    mount(card,hass,el);
  }

  function mount(card, hass, el) {
    if(el._purBound===CARD.version) return;
    el._purBound=CARD.version;
    if(el._purHandler) el.removeEventListener('click',el._purHandler);
    function eid(){ return cfgFor(card).pk_device; }
    el._purHandler=function(e){
      var t=e.target.closest('[data-pya]'); if(!t) return;
      var a=t.dataset.pya;
      if(a==='cfg'){ openCfg(card,el); return; }
      if(a==='rename'){
        var cur=cfgFor(card).name; t.innerHTML='';
        var inp=document.createElement('input'); inp.type='text'; inp.value=cur;
        inp.style.cssText='width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.4);outline:none;color:#fff;font-size:13px;font-weight:800;font-family:system-ui;padding:0;line-height:1';
        t.appendChild(inp); inp.focus(); inp.select();
        function commit(){ var v=inp.value.trim()||cur; var s=load(card); s.name=v; save(card,s); el._purSig=''; el._purBound=null; el.innerHTML=render(card); mount(card,null,el); }
        inp.addEventListener('blur',commit,{once:true});
        inp.addEventListener('keydown',function(ev){ if(ev.key==='Enter') inp.blur(); if(ev.key==='Escape'){ inp.removeEventListener('blur',commit); t.textContent=cur; } });
        return;
      }
      if(a==='power'){ var h=H(),st=S(h,eid()); callSvc('fan',st==='on'?'turn_off':'turn_on',{entity_id:eid()}); return; }
      if(a==='speed'){ callSvc('fan','set_percentage',{entity_id:eid(),percentage:parseInt(t.dataset.pct)||50}); return; }
      if(a==='mode'){ callSvc('fan','set_preset_mode',{entity_id:eid(),preset_mode:t.dataset.mode}); return; }
    };
    el.addEventListener('click',el._purHandler);
  }

  var CARD={
    id:'purificatore-card',name:'Purificatore',icon:'🌿',version:'1.2',
    desc:'Controllo purificatore aria: qualità PM2.5, velocità ventola, modalità. Richiede integrazione fan.',
    colSpan:2,rowSpan:3,frarik_no_edit:true,
    render:function(card){ return render(card); },
    mount:function(card,hass,el){ return mount(card,hass,el); },
    update:function(card,hass,el){ return update(card,hass,el); },
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{console.log('[FratechStore] Card registrata: purificatore-card v'+CARD.version);}catch(e){}
})();
