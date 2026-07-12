/* frarik-version: 1.2 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch(e) {} return null; }
  function keyOf(c) { return 'frarik_vmccard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch(e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch(e) {} }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function callSvc(d, s, data) { try { var h = H(); if (h && h.callService) h.callService(d, s, data || {}); } catch(e) {} }
  function hexRgb(hex) { try { var s=(hex||'#a78bfa').replace('#',''); if(s.length===3)s=s[0]+s[0]+s[1]+s[1]+s[2]+s[2]; return parseInt(s.slice(0,2),16)+','+parseInt(s.slice(2,4),16)+','+parseInt(s.slice(4,6),16); } catch(e){return '167,139,250';} }
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function num(v) { var x=parseFloat(String(v!=null?v:'').replace(',','.')); return isNaN(x)?null:x; }

  function cfgFor(card) {
    var c = load(card);
    return {
      pk_device:   c.pk_device   || 'fan.vmc',
      pk_co2:      c.pk_co2      || '',
      pk_humidity: c.pk_humidity || '',
      name:        c.name        || 'VMC',
      color:       c.color       || '#a78bfa',
    };
  }

  /* ── SVG VMC ── */
  function vmcSVG(col, rgb, isOn, pct) {
    var uid = 'vmc' + Math.floor(Math.random()*99999);
    var css = isOn
      ? '@keyframes '+uid+'In{0%{stroke-dashoffset:0;opacity:.75}100%{stroke-dashoffset:-18;opacity:0}}'
        + '@keyframes '+uid+'Out{0%{stroke-dashoffset:0;opacity:.75}100%{stroke-dashoffset:18;opacity:0}}'
        + '@keyframes '+uid+'Led{0%,100%{opacity:.7}50%{opacity:1}}'
        + '@keyframes '+uid+'Gw{0%,100%{filter:drop-shadow(0 0 5px rgba('+rgb+',.4))}50%{filter:drop-shadow(0 0 12px rgba('+rgb+',.8))}}'
        + '@keyframes '+uid+'Hx{0%,100%{opacity:.5}50%{opacity:.9}}'
      : '';

    var spd = pct || 0;

    /* frecce aria entrante (da sinistra verso centro) */
    var arIn = isOn
      ? '<line x1="8" y1="40" x2="28" y2="40" stroke="'+col+'" stroke-width="1.2" stroke-dasharray="8 4" style="animation:'+uid+'In .9s linear infinite"/>'
        + '<line x1="8" y1="48" x2="28" y2="48" stroke="rgba('+rgb+',.6)" stroke-width="1" stroke-dasharray="6 4" style="animation:'+uid+'In .9s linear .3s infinite"/>'
        + '<line x1="8" y1="56" x2="28" y2="56" stroke="'+col+'" stroke-width="1.2" stroke-dasharray="8 4" style="animation:'+uid+'In .9s linear .6s infinite"/>'
      : '';

    /* frecce aria uscente (da centro verso destra) */
    var arOut = isOn
      ? '<line x1="72" y1="40" x2="92" y2="40" stroke="rgba('+rgb+',.7)" stroke-width="1.2" stroke-dasharray="8 4" style="animation:'+uid+'Out .9s linear infinite"/>'
        + '<line x1="72" y1="48" x2="92" y2="48" stroke="rgba('+rgb+',.5)" stroke-width="1" stroke-dasharray="6 4" style="animation:'+uid+'Out .9s linear .3s infinite"/>'
        + '<line x1="72" y1="56" x2="92" y2="56" stroke="rgba('+rgb+',.7)" stroke-width="1.2" stroke-dasharray="8 4" style="animation:'+uid+'Out .9s linear .6s infinite"/>'
      : '';

    return '<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;overflow:visible" preserveAspectRatio="xMidYMid meet">'
      + '<style>'+css+'</style>'
      + '<defs><linearGradient id="'+uid+'Bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a1d38"/><stop offset="100%" stop-color="#0d0f22"/></linearGradient></defs>'
      /* corpo principale */
      + '<rect x="4" y="20" width="92" height="60" rx="9" fill="url(#'+uid+'Bg)" stroke="'+(isOn?col:'#1e2040')+'" stroke-width="'+(isOn?'1.5':'0.7')+'" '+(isOn?'style="animation:'+uid+'Gw 2.5s ease-in-out infinite"':'')+'/>'
      /* griglia sinistra — ARIA FRESCA IN */
      + '<rect x="8" y="26" width="26" height="36" rx="4" fill="#080b1c"/>'
      + '<line x1="13" y1="26" x2="13" y2="62" stroke="rgba(255,255,255,.11)" stroke-width=".8"/>'
      + '<line x1="18" y1="26" x2="18" y2="62" stroke="rgba(255,255,255,.11)" stroke-width=".8"/>'
      + '<line x1="23" y1="26" x2="23" y2="62" stroke="rgba(255,255,255,.11)" stroke-width=".8"/>'
      + '<line x1="28" y1="26" x2="28" y2="62" stroke="rgba(255,255,255,.11)" stroke-width=".8"/>'
      + '<text x="21" y="68" text-anchor="middle" font-family="system-ui" font-size="4" font-weight="700" fill="rgba('+rgb+',.7)">IN</text>'
      /* recuperatore di calore — centro */
      + '<rect x="36" y="24" width="28" height="40" rx="4" fill="#0a0d1e" stroke="rgba('+rgb+',.12)" stroke-width=".8"/>'
      + '<line x1="36" y1="31" x2="64" y2="31" stroke="rgba('+rgb+',.18)" stroke-width=".7" '+(isOn?'style="animation:'+uid+'Hx 2s ease-in-out infinite"':'')+'/>'
      + '<line x1="36" y1="36" x2="64" y2="36" stroke="rgba('+rgb+',.12)" stroke-width=".6"/>'
      + '<line x1="36" y1="41" x2="64" y2="41" stroke="rgba('+rgb+',.18)" stroke-width=".7" '+(isOn?'style="animation:'+uid+'Hx 2s ease-in-out .5s infinite"':'')+'/>'
      + '<line x1="36" y1="46" x2="64" y2="46" stroke="rgba('+rgb+',.12)" stroke-width=".6"/>'
      + '<line x1="36" y1="51" x2="64" y2="51" stroke="rgba('+rgb+',.18)" stroke-width=".7" '+(isOn?'style="animation:'+uid+'Hx 2s ease-in-out 1s infinite"':'')+'/>'
      + '<line x1="36" y1="56" x2="64" y2="56" stroke="rgba('+rgb+',.12)" stroke-width=".6"/>'
      + '<text x="50" y="70" text-anchor="middle" font-family="system-ui" font-size="3.5" font-weight="700" fill="rgba('+rgb+',.5)">HRV</text>'
      /* griglia destra — ARIA ESAUSTA OUT */
      + '<rect x="66" y="26" width="26" height="36" rx="4" fill="#080b1c"/>'
      + '<line x1="70" y1="26" x2="70" y2="62" stroke="rgba(255,255,255,.11)" stroke-width=".8"/>'
      + '<line x1="75" y1="26" x2="75" y2="62" stroke="rgba(255,255,255,.11)" stroke-width=".8"/>'
      + '<line x1="80" y1="26" x2="80" y2="62" stroke="rgba(255,255,255,.11)" stroke-width=".8"/>'
      + '<line x1="85" y1="26" x2="85" y2="62" stroke="rgba(255,255,255,.11)" stroke-width=".8"/>'
      + '<text x="79" y="68" text-anchor="middle" font-family="system-ui" font-size="4" font-weight="700" fill="rgba(255,255,255,.4)">OUT</text>'
      /* frecce flusso aria */
      + arIn + arOut
      /* barra velocità */
      + '<rect x="8" y="73" width="84" height="4" rx="2" fill="#08091a"/>'
      + '<rect x="8" y="73" width="'+(isOn?Math.round(spd*0.84):0)+'" height="4" rx="2" fill="'+col+'"/>'
      /* pannello info in basso */
      + '<rect x="8" y="80" width="38" height="14" rx="3" fill="#07091a"/>'
      + '<text x="27" y="90" text-anchor="middle" font-family="system-ui" font-size="4" font-weight="700" fill="#fff">'+(isOn&&pct!=null?'VELOCITÀ '+Math.round(pct)+'%':isOn?'ACCESO':'SPENTO')+'</text>'
      /* LED */
      + '<circle cx="90" cy="84" r="2.2" fill="'+(isOn?col:'#0e1535')+'" '+(isOn?'style="filter:drop-shadow(0 0 4px '+col+');animation:'+uid+'Led 2s ease-in-out infinite"':'')+'/>'
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
    var stSec='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:'+c.color+';margin:12px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(167,139,250,.2)';
    var COLORS=['#a78bfa','#818cf8','#38bdf8','#4ade80','#f472b6','#fb923c','#facc15','#f87171'];
    function fld(fid,lbl,val){return '<div style="margin-bottom:9px;position:relative"><label style="'+stLbl+'">'+lbl+'</label><input id="'+fid+'" type="text" value="'+_esc(val||'')+'" autocomplete="off" placeholder="Cerca entità…" style="'+stInp+'"><div id="'+fid+'-d" style="position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:140px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none"></div></div>';}
    var colorPicker='<div style="margin-bottom:12px"><label style="'+stLbl+'">Colore accent</label><div style="display:flex;gap:6px;flex-wrap:wrap">'+COLORS.map(function(clr){return '<div data-vcol="'+clr+'" style="width:24px;height:24px;border-radius:7px;cursor:pointer;background:'+clr+';border:2px solid '+(c.color===clr?'#fff':'transparent')+'"></div>';}).join('')+'</div></div>';
    var formHtml='<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome card</label><input id="vc-name" type="text" value="'+_esc(c.name||'')+'" placeholder="es. VMC Piano Terra" style="'+stInp.replace('monospace','system-ui')+'"></div>'
      +'<div style="'+stSec+'">Entità</div>'
      +fld('vc-dev','VMC (fan.*)',c.pk_device)
      +fld('vc-co2','Sensore CO₂ (opzionale)',c.pk_co2)
      +fld('vc-hum','Sensore umidità (opzionale)',c.pk_humidity)
      +colorPicker
      +'<div style="display:flex;gap:8px;margin-top:12px"><button id="vc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button><button id="vc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:'+c.color+';color:#060d14">Salva</button></div>';
    var ov=mkOv(popShell('🌀',hexRgb(c.color),'Configura VMC',card.id||'','vc-cfg-close',formHtml),'vc-cfg-close');
    ov.querySelector('#vc-cancel').addEventListener('click',function(){ov._close();});
    var selColor=c.color;
    ov.querySelectorAll('[data-vcol]').forEach(function(dot){dot.addEventListener('click',function(){selColor=dot.getAttribute('data-vcol');ov.querySelectorAll('[data-vcol]').forEach(function(d){d.style.borderColor='transparent';});dot.style.borderColor='#fff';});});
    ['vc-dev','vc-co2','vc-hum'].forEach(function(fid){
      var inp=ov.querySelector('#'+fid),drop=ov.querySelector('#'+fid+'-d');
      if(!inp||!drop) return;
      function show(){var q=inp.value.toLowerCase().trim();var hits=(q?allIds.filter(function(id){return id.toLowerCase().includes(q);}):allIds).slice(0,30);if(!hits.length){drop.style.display='none';return;}drop.style.display='block';drop.innerHTML=hits.map(function(id){return '<div data-pick="'+id+'" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#fff">'+id+'</div>';}).join('');drop.querySelectorAll('[data-pick]').forEach(function(row){row.addEventListener('mousedown',function(ev){ev.preventDefault();inp.value=row.getAttribute('data-pick');drop.style.display='none';});row.addEventListener('mouseover',function(){row.style.background='rgba(255,255,255,.08)';});row.addEventListener('mouseout',function(){row.style.background='';});});}
      inp.addEventListener('focus',show);inp.addEventListener('input',show);inp.addEventListener('blur',function(){setTimeout(function(){drop.style.display='none';},200);});
    });
    ov.querySelector('#vc-save').addEventListener('click',function(){
      var n=ov.querySelector('#vc-name'),d=ov.querySelector('#vc-dev'),co=ov.querySelector('#vc-co2'),hm=ov.querySelector('#vc-hum');
      save(card,{name:n?n.value.trim():c.name,pk_device:d?d.value.trim():c.pk_device,pk_co2:co?co.value.trim():c.pk_co2,pk_humidity:hm?hm.value.trim():c.pk_humidity,color:selColor});
      ov._close();try{el._vmcSig='';el._vmcBound=null;el.innerHTML=render(card);mount(card,null,el);}catch(e){}
    });
  }

  /* ── RENDER ── */
  function render(card) {
    var h=H(), c=cfgFor(card), cid=card.id||'x', rid='vmc-'+cid;
    var col=c.color, rgb=hexRgb(col);
    var eid=c.pk_device;
    var state=S(h,eid)||'unavailable';
    var attrs=(h&&h.states&&h.states[eid]&&h.states[eid].attributes)||{};
    var isOn=state==='on';

    var co2  = c.pk_co2      ? num(S(h,c.pk_co2))      : null;
    var hum  = c.pk_humidity ? num(S(h,c.pk_humidity))  : null;
    var pct  = num(attrs.percentage);
    var mode = attrs.preset_mode || '';
    var modes = attrs.preset_modes || ['bassa','media','alta','auto'];

    var co2Col = co2==null?col:co2<600?'#22c55e':co2<1000?'#eab308':'#ef4444';
    var co2Lbl = co2==null?'—':co2<600?'Ottima':co2<1000?'Buona':'Scarsa';

    var stLbls={on:'Attiva',off:'Spenta',unavailable:'Non disponibile'};
    var stateLbl=stLbls[state]||state;
    var stateCol=isOn?col:'#6b7fa8', stateRgb=isOn?rgb:'107,127,168';

    var artHtml='<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:6px;box-sizing:border-box">'+vmcSVG(col,rgb,isOn,pct)+'</div>';

    var infoRows='';
    if(co2!=null){
      infoRows+='<div style="font-size:22px;font-weight:900;color:'+co2Col+';line-height:1">'+Math.round(co2)+'<span style="font-size:11px;font-weight:600;color:#fff"> ppm</span></div>'
        +'<div style="font-size:9px;font-weight:700;color:#fff;margin-top:2px">CO₂ — Qualità '+co2Lbl+'</div>';
    } else if(pct!=null && isOn){
      infoRows+='<div style="font-size:22px;font-weight:900;color:'+col+';line-height:1">'+Math.round(pct)+'<span style="font-size:14px">%</span></div>'
        +'<div style="font-size:9px;font-weight:700;color:#fff;margin-top:2px">Velocità ventilazione</div>';
    } else {
      infoRows+='<div style="font-size:13px;font-weight:700;color:#fff">'+stateLbl+'</div>';
    }
    if(hum!=null){
      infoRows+='<div style="margin-top:5px;display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)">'
        +'<span style="font-size:9px;font-weight:800;color:#fff">UMIDITÀ</span>'
        +'<span style="font-size:13px;font-weight:900;color:'+col+'">'+Math.round(hum)+'%</span></div>';
    }
    if(mode && isOn){
      infoRows+='<div style="margin-top:4px;padding:3px 8px;border-radius:8px;background:rgba('+rgb+',.1);border:1px solid rgba('+rgb+',.22);display:inline-flex">'
        +'<span style="font-size:9px;font-weight:800;color:'+col+'">'+mode.toUpperCase()+'</span></div>';
    }

    var bOff='flex:1;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;font-size:10px;font-weight:700;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff';
    var bOn='flex:1;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;font-size:10px;font-weight:700;border:1px solid '+col+';background:rgba('+rgb+',.2);color:'+col;
    var bPow=isOn?'flex:1;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;user-select:none;font-size:11px;font-weight:800;border:1px solid '+col+';background:rgba('+rgb+',.18);color:'+col
                :'flex:1;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;user-select:none;font-size:11px;font-weight:800;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff';

    /* preset velocità */
    var SPEEDS=[{lbl:'Bassa',pct:25},{lbl:'Media',pct:50},{lbl:'Alta',pct:75}];
    var speedPills=SPEEDS.map(function(sp){
      var active=isOn&&pct!=null&&Math.abs(pct-sp.pct)<13;
      return '<div style="'+(active?bOn:bOff)+'" data-vya="speed" data-pct="'+sp.pct+'">'+sp.lbl+'</div>';
    }).join('');

    var modePills=modes.slice(0,4).map(function(m){
      var active=m&&mode&&m.toLowerCase()===mode.toLowerCase();
      return '<div style="'+(active?bOn:bOff)+'" data-vya="mode" data-mode="'+_esc(m)+'">'+_esc(m.charAt(0).toUpperCase()+m.slice(1))+'</div>';
    }).join('');

    var css='<style>'
      +'@keyframes vmcDot{0%,100%{opacity:.5}50%{opacity:1}}'
      +'#'+rid+'{position:relative;width:100%;height:100%;min-height:340px;font-family:system-ui,sans-serif}'
      +'#'+rid+' .fc-card{display:flex;flex-direction:column;height:100%;min-height:340px;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      +'#'+rid+' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:220px;background:radial-gradient(ellipse at 30% 0,rgba('+rgb+',.1) 0%,transparent 65%);pointer-events:none}'
      +'#'+rid+' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      +'#'+rid+' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;background:rgba('+rgb+',.12);border:1px solid rgba('+rgb+',.25)}'
      +'#'+rid+' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}'
      +'#'+rid+' .fc-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba('+stateRgb+',.08);border:1px solid rgba('+stateRgb+',.25);color:#fff}'
      +'#'+rid+' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:'+stateCol+(isOn?';animation:vmcDot .9s ease-in-out infinite':'')+'}'
      +'#'+rid+' .fc-gear{margin-left:4px;cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      +'#'+rid+' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      +'#'+rid+' .fc-scroll::-webkit-scrollbar{display:none}'
      +'#'+rid+' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      +'#'+rid+' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:visible;max-height:160px}'
      +'#'+rid+' .fc-art{width:100%;max-width:130px;aspect-ratio:1;border-radius:13px;overflow:visible;flex-shrink:0;background:linear-gradient(135deg,rgba('+rgb+',.18),rgba('+rgb+',.05));'+(isOn?'box-shadow:0 0 0 2px '+col+',0 4px 20px rgba('+rgb+',.4)':'box-shadow:0 4px 14px rgba(0,0,0,.5)')+'}'
      +'#'+rid+' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:4px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      +'#'+rid+' .fc-sep{height:1px;background:rgba(255,255,255,.06);margin:0 14px;flex-shrink:0}'
      +'#'+rid+' [data-vya]:active{opacity:.5}'
      +'</style>';

    return css
      +'<div id="'+rid+'"><div class="fc-card">'
      +'<div class="fc-hdr"><div class="fc-hdr-iw">🌀</div>'
      +'<div class="fc-hdr-tit" data-vya="rename">'+_esc(c.name)+'</div>'
      +'<div class="fc-pill"><div class="fc-dot"></div>'+_esc(stateLbl)+'</div>'
      +'<div class="fc-gear" data-vya="cfg">⚙</div></div>'
      +'<div class="fc-scroll">'
      +'<div class="fc-hero"><div class="fc-hero-img"><div class="fc-art">'+artHtml+'</div></div>'
      +'<div class="fc-hero-r">'+infoRows+'</div></div>'
      +'<div class="fc-sep"></div>'
      +'<div style="padding:8px 14px 6px;flex-shrink:0"><div style="display:flex;gap:7px">'
      +'<div style="'+bPow+'" data-vya="power">⏻ '+(isOn?'Spegni':'Accendi')+'</div>'
      +'</div></div>'
      +(isOn
        ? '<div class="fc-sep"></div>'
          +'<div style="padding:4px 14px 6px;flex-shrink:0">'
          +'<div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#fff;margin-bottom:5px">Portata aria</div>'
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
    var co2=c.pk_co2?S(h,c.pk_co2):null, hum=c.pk_humidity?S(h,c.pk_humidity):null;
    var sig=[CARD.version,st,at.percentage,at.preset_mode,co2,hum].join('|');
    if(!el.querySelector('.fc-card')||el._vmcSig!==sig){ el._vmcSig=sig; el._vmcBound=null; el.innerHTML=render(card); }
    mount(card,hass,el);
  }

  function mount(card, hass, el) {
    if(el._vmcBound===CARD.version) return;
    el._vmcBound=CARD.version;
    if(el._vmcHandler) el.removeEventListener('click',el._vmcHandler);
    function eid(){ return cfgFor(card).pk_device; }
    el._vmcHandler=function(e){
      var t=e.target.closest('[data-vya]'); if(!t) return;
      var a=t.dataset.vya;
      if(a==='cfg'){ openCfg(card,el); return; }
      if(a==='rename'){
        var cur=cfgFor(card).name; t.innerHTML='';
        var inp=document.createElement('input'); inp.type='text'; inp.value=cur;
        inp.style.cssText='width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.4);outline:none;color:#fff;font-size:13px;font-weight:800;font-family:system-ui;padding:0;line-height:1';
        t.appendChild(inp); inp.focus(); inp.select();
        function commit(){ var v=inp.value.trim()||cur; var s=load(card); s.name=v; save(card,s); el._vmcSig=''; el._vmcBound=null; el.innerHTML=render(card); mount(card,null,el); }
        inp.addEventListener('blur',commit,{once:true});
        inp.addEventListener('keydown',function(ev){ if(ev.key==='Enter') inp.blur(); if(ev.key==='Escape'){ inp.removeEventListener('blur',commit); t.textContent=cur; } });
        return;
      }
      if(a==='power'){ var h=H(),st=S(h,eid()); callSvc('fan',st==='on'?'turn_off':'turn_on',{entity_id:eid()}); return; }
      if(a==='speed'){ callSvc('fan','set_percentage',{entity_id:eid(),percentage:parseInt(t.dataset.pct)||50}); return; }
      if(a==='mode'){ callSvc('fan','set_preset_mode',{entity_id:eid(),preset_mode:t.dataset.mode}); return; }
    };
    el.addEventListener('click',el._vmcHandler);
  }

  var CARD={
    id:'vmc-card',name:'VMC',icon:'🌀',version:'1.2',
    desc:'Controllo VMC (Ventilazione Meccanica Controllata): CO₂, umidità, portata aria, modalità.',
    colSpan:2,rowSpan:3,frarik_no_edit:true,
    render:function(card){ return render(card); },
    mount:function(card,hass,el){ return mount(card,hass,el); },
    update:function(card,hass,el){ return update(card,hass,el); },
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{console.log('[FratechStore] Card registrata: vmc-card v'+CARD.version);}catch(e){}
})();
