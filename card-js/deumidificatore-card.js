/* frarik-version: 1.1 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { var h = window.frarikHass(); if (h && h.states) return h; } } catch(e) {} return null; }
  function keyOf(c) { return 'frarik_deucard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch(e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch(e) {} }
  function S(h, id) { var s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function Attr(h, id, a) { var s = h && id && h.states && h.states[id]; return s && s.attributes ? s.attributes[a] : null; }
  function callSvc(d, s, data) { try { var h = H(); if (h && h.callService) h.callService(d, s, data || {}); } catch(e) {} }
  function hexRgb(hex) { try { var s=(hex||'#38bdf8').replace('#',''); if(s.length===3)s=s[0]+s[0]+s[1]+s[1]+s[2]+s[2]; return parseInt(s.slice(0,2),16)+','+parseInt(s.slice(2,4),16)+','+parseInt(s.slice(4,6),16); } catch(e){return '56,189,248';} }
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function num(v) { var x=parseFloat(String(v!=null?v:'').replace(',','.')); return isNaN(x)?null:x; }

  function cfgFor(card) {
    var c = load(card);
    return {
      pk_device:   c.pk_device   || 'humidifier.deumidificatore',
      pk_humidity: c.pk_humidity || '',
      name:        c.name        || 'Deumidificatore',
      color:       c.color       || '#38bdf8',
    };
  }

  /* ── SVG ── */
  function deumSVG(col, rgb, isOn, curHum, targetHum) {
    var uid = 'deu' + Math.floor(Math.random()*99999);
    var css = isOn
      ? '@keyframes '+uid+'Spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'
        + '@keyframes '+uid+'Drp{0%{transform:translateY(0);opacity:.9}85%{opacity:.5}100%{transform:translateY(20px);opacity:0}}'
        + '@keyframes '+uid+'Led{0%,100%{opacity:.7}50%{opacity:1}}'
        + '@keyframes '+uid+'Gw{0%,100%{filter:drop-shadow(0 0 6px rgba('+rgb+',.35))}50%{filter:drop-shadow(0 0 16px rgba('+rgb+',.75))}}'
        + '@keyframes '+uid+'Pu{0%,100%{opacity:.25}50%{opacity:.6}}'
      : '';

    var fanG = '<g style="transform-origin:50px 70px;'+(isOn?'animation:'+uid+'Spin 1.6s linear infinite':'')+'">'
      + '<ellipse cx="50" cy="70" rx="11" ry="3.2" fill="rgba('+rgb+','+(isOn?'.7':'.3')+')" transform="rotate(0,50,70)"/>'
      + '<ellipse cx="50" cy="70" rx="11" ry="3.2" fill="rgba('+rgb+','+(isOn?'.55':'.22')+')" transform="rotate(60,50,70)"/>'
      + '<ellipse cx="50" cy="70" rx="11" ry="3.2" fill="rgba('+rgb+','+(isOn?'.7':'.3')+')" transform="rotate(120,50,70)"/>'
      + '</g>';

    var drops = isOn
      ? '<circle cx="34" cy="55" r="2" fill="'+col+'" style="animation:'+uid+'Drp 1.2s ease-in infinite"/>'
        + '<circle cx="50" cy="53" r="2" fill="'+col+'" style="animation:'+uid+'Drp 1.2s ease-in .42s infinite"/>'
        + '<circle cx="66" cy="56" r="2" fill="'+col+'" style="animation:'+uid+'Drp 1.2s ease-in .8s infinite"/>'
      : '';

    var disp = curHum != null ? Math.round(curHum)+'%' : '—';

    return '<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;overflow:visible" preserveAspectRatio="xMidYMid meet">'
      + '<style>'+css+'</style>'
      + '<defs>'
      + '<linearGradient id="'+uid+'Bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+(isOn?'#1c3358':'#111e35')+'"/><stop offset="100%" stop-color="#080f1e"/></linearGradient>'
      + '<linearGradient id="'+uid+'Dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba('+rgb+',.22)"/><stop offset="100%" stop-color="rgba('+rgb+',.06)"/></linearGradient>'
      + '</defs>'
      /* body */
      + '<rect x="14" y="3" width="72" height="89" rx="12" fill="url(#'+uid+'Bg)" stroke="'+(isOn?col:'#1e2f50')+'" stroke-width="'+(isOn?'1.5':'0.6')+'" '+(isOn?'style="animation:'+uid+'Gw 2.8s ease-in-out infinite"':'')+'/>'
      /* side accent lines */
      + '<line x1="14" y1="20" x2="14" y2="75" stroke="rgba('+rgb+',.15)" stroke-width="1.5"/>'
      + '<line x1="86" y1="20" x2="86" y2="75" stroke="rgba('+rgb+',.1)" stroke-width="1"/>'
      /* top air grille */
      + '<rect x="18" y="7" width="64" height="19" rx="4" fill="rgba(0,0,0,.4)"/>'
      + '<line x1="18" y1="11.5" x2="82" y2="11.5" stroke="rgba(255,255,255,.15)" stroke-width="1"/>'
      + '<line x1="18" y1="16" x2="82" y2="16" stroke="rgba(255,255,255,.1)" stroke-width=".8"/>'
      + '<line x1="18" y1="20.5" x2="82" y2="20.5" stroke="rgba(255,255,255,.15)" stroke-width="1"/>'
      /* display panel */
      + '<rect x="18" y="28" width="64" height="24" rx="7" fill="url(#'+uid+'Dp)" stroke="rgba('+rgb+',.35)" stroke-width=".9"/>'
      + '<text x="50" y="42" text-anchor="middle" font-family="monospace,system-ui" font-size="16" font-weight="900" fill="'+(isOn?col:'rgba('+rgb+',.55)')+'">'+disp+'</text>'
      + (targetHum!=null && isOn
          ? '<text x="50" y="50" text-anchor="middle" font-family="system-ui" font-size="4.5" font-weight="700" fill="#fff">↓ target '+Math.round(targetHum)+'%</text>'
          : '<text x="50" y="50" text-anchor="middle" font-family="system-ui" font-size="4.5" font-weight="600" fill="rgba(255,255,255,.45)">umidità aria</text>')
      /* drops */
      + drops
      /* fan chamber */
      + '<rect x="20" y="60" width="60" height="26" rx="8" fill="rgba(0,0,0,.45)"/>'
      + '<circle cx="50" cy="70" r="13" fill="rgba(0,0,0,.35)" stroke="rgba('+rgb+',.12)" stroke-width=".8"/>'
      + (isOn?'<circle cx="50" cy="70" r="13" fill="none" stroke="rgba('+rgb+',.15)" stroke-width="2" style="animation:'+uid+'Pu 2s ease-in-out infinite"/>':'')
      + fanG
      + '<circle cx="50" cy="70" r="3.5" fill="'+(isOn?col:'#1a2f50')+'"/>'
      /* water bar */
      + '<rect x="18" y="92" width="64" height="3.5" rx="1.5" fill="rgba(0,0,0,.4)"/>'
      + '<rect x="19" y="92.5" width="36" height="2.5" rx="1.2" fill="rgba('+rgb+','+(isOn?'.55':'.2')+')" />'
      /* LED */
      + '<circle cx="79" cy="11" r="2.5" fill="'+(isOn?col:'#0e1a30')+'" '+(isOn?'style="filter:drop-shadow(0 0 5px '+col+');animation:'+uid+'Led 2s ease-in-out infinite"':'')+'/>'
      + '</svg>';
  }

  /* ── HELPERS ── */
  function mkOv(html, closeId) {
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML=html; document.body.appendChild(ov);
    var close=function(){ try{ document.body.removeChild(ov); }catch(e){} };
    var btn=ov.querySelector('#'+closeId); if(btn) btn.addEventListener('click',close);
    ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
    ov._close=close; return ov;
  }
  var POP_CSS='<style>@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.fcpc{overflow-y:auto;scrollbar-width:none}.fcpc::-webkit-scrollbar{display:none}</style>';
  function popShell(icon,rgb,title,sub,closeId,content){
    return POP_CSS+'<div style="width:100%;max-height:76vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba('+rgb+',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:fcUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      +'<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba('+rgb+',.15);border:1px solid rgba('+rgb+',.3)">'+icon+'</div>'
      +'<div><div style="font-size:14px;font-weight:800;color:#fff">'+title+'</div><div style="font-size:11px;color:#fff;margin-top:1px">'+sub+'</div></div>'
      +'<button id="'+closeId+'" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      +'</div>'
      +'<div class="fcpc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column">'+content+'</div>'
      +'</div>';
  }

  /* ── CONFIG ── */
  function openCfg(card, el) {
    var c=cfgFor(card), h=H(), states=(h&&h.states)||{};
    var allIds=Object.keys(states).sort();
    var stInp='width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#fff;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    var stLbl='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#fff;margin-bottom:3px;display:block';
    var stSec='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:'+c.color+';margin:12px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(56,189,248,.2)';
    var COLORS=['#38bdf8','#60a5fa','#4ade80','#a78bfa','#f472b6','#fb923c','#facc15','#f87171'];
    function fld(fid,lbl,val){ return '<div style="margin-bottom:9px;position:relative"><label style="'+stLbl+'">'+lbl+'</label><input id="'+fid+'" type="text" value="'+_esc(val||'')+'" autocomplete="off" placeholder="Cerca entità…" style="'+stInp+'"><div id="'+fid+'-d" style="position:absolute;left:0;right:0;top:calc(100% + 2px);z-index:200;max-height:140px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-radius:9px;display:none;scrollbar-width:none"></div></div>'; }
    var colorPicker='<div style="margin-bottom:12px"><label style="'+stLbl+'">Colore accent</label><div style="display:flex;gap:6px;flex-wrap:wrap">'+COLORS.map(function(clr){ return '<div data-dcol="'+clr+'" style="width:24px;height:24px;border-radius:7px;cursor:pointer;background:'+clr+';border:2px solid '+(c.color===clr?'#fff':'transparent')+'"></div>'; }).join('')+'</div></div>';
    var formHtml='<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome card</label><input id="dc-name" type="text" value="'+_esc(c.name||'')+'" placeholder="es. Deumidificatore Camera" style="'+stInp.replace('monospace','system-ui')+'"></div>'
      +'<div style="'+stSec+'">Entità</div>'
      +fld('dc-dev','Deumidificatore (humidifier.*)',c.pk_device)
      +fld('dc-hum','Sensore umidità esterno (opzionale)',c.pk_humidity)
      +colorPicker
      +'<div style="display:flex;gap:8px;margin-top:12px"><button id="dc-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button><button id="dc-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:'+c.color+';color:#060d14">Salva</button></div>';
    var ov=mkOv(popShell('💧',hexRgb(c.color),'Configura Deumidificatore',card.id||'','dc-cfg-close',formHtml),'dc-cfg-close');
    ov.querySelector('#dc-cancel').addEventListener('click',function(){ ov._close(); });
    var selColor=c.color;
    ov.querySelectorAll('[data-dcol]').forEach(function(dot){
      dot.addEventListener('click',function(){ selColor=dot.getAttribute('data-dcol'); ov.querySelectorAll('[data-dcol]').forEach(function(d){ d.style.borderColor='transparent'; }); dot.style.borderColor='#fff'; });
    });
    ['dc-dev','dc-hum'].forEach(function(fid){
      var inp=ov.querySelector('#'+fid), drop=ov.querySelector('#'+fid+'-d');
      if(!inp||!drop) return;
      function show(){ var q=inp.value.toLowerCase().trim(); var hits=(q?allIds.filter(function(id){ return id.toLowerCase().includes(q); }):allIds).slice(0,30); if(!hits.length){ drop.style.display='none'; return; } drop.style.display='block'; drop.innerHTML=hits.map(function(id){ return '<div data-pick="'+id+'" style="padding:6px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#fff">'+id+'</div>'; }).join(''); drop.querySelectorAll('[data-pick]').forEach(function(row){ row.addEventListener('mousedown',function(ev){ ev.preventDefault(); inp.value=row.getAttribute('data-pick'); drop.style.display='none'; }); row.addEventListener('mouseover',function(){ row.style.background='rgba(255,255,255,.08)'; }); row.addEventListener('mouseout',function(){ row.style.background=''; }); }); }
      inp.addEventListener('focus',show); inp.addEventListener('input',show);
      inp.addEventListener('blur',function(){ setTimeout(function(){ drop.style.display='none'; },200); });
    });
    ov.querySelector('#dc-save').addEventListener('click',function(){
      var n=ov.querySelector('#dc-name'),d=ov.querySelector('#dc-dev'),hm=ov.querySelector('#dc-hum');
      save(card,{name:n?n.value.trim():c.name,pk_device:d?d.value.trim():c.pk_device,pk_humidity:hm?hm.value.trim():c.pk_humidity,color:selColor});
      ov._close(); try{ el._deuSig=''; el._deuBound=null; el.innerHTML=render(card); mount(card,null,el); }catch(e){}
    });
  }

  /* ── RENDER ── */
  function render(card) {
    var h=H(), c=cfgFor(card), cid=card.id||'x', rid='deu-'+cid;
    var col=c.color, rgb=hexRgb(col);
    var eid=c.pk_device;
    var state=S(h,eid)||'unavailable';
    var attrs=(h&&h.states&&h.states[eid]&&h.states[eid].attributes)||{};
    var isOn=state==='on';

    var curHum = c.pk_humidity ? num(S(h,c.pk_humidity)) : num(attrs.current_humidity);
    var targetHum = num(attrs.humidity);
    var mode = attrs.mode || attrs.preset_mode || '';
    var availModes = attrs.available_modes || attrs.preset_modes || ['normale','auto','notte','boost'];

    var stLbls={on:'Acceso',off:'Spento',unavailable:'Non disponibile'};
    var stateLbl=stLbls[state]||state;
    var stateCol=isOn?col:'#6b7fa8', stateRgb=isOn?rgb:'107,127,168';

    var artHtml='<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:6px;box-sizing:border-box">'
      +deumSVG(col,rgb,isOn,curHum,targetHum)+'</div>';

    var infoRows='';
    if(curHum!=null){
      infoRows+='<div style="font-size:24px;font-weight:900;color:'+col+';line-height:1">'+Math.round(curHum)+'<span style="font-size:15px">%</span></div>'
        +'<div style="font-size:9px;font-weight:700;color:#fff;margin-top:2px">Umidità attuale</div>';
    } else {
      infoRows+='<div style="font-size:13px;font-weight:700;color:#fff">'+stateLbl+'</div>';
    }
    if(targetHum!=null && isOn){
      infoRows+='<div style="display:flex;align-items:center;gap:6px;margin-top:5px;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09)">'
        +'<span style="font-size:9px;font-weight:800;color:#fff">TARGET</span>'
        +'<span style="font-size:13px;font-weight:900;color:'+col+'">'+Math.round(targetHum)+'%</span></div>';
    }
    if(mode && isOn){
      infoRows+='<div style="margin-top:4px;padding:3px 8px;border-radius:8px;background:rgba('+rgb+',.1);border:1px solid rgba('+rgb+',.22);display:inline-flex;align-items:center">'
        +'<span style="font-size:9px;font-weight:800;color:'+col+'">'+mode.toUpperCase()+'</span></div>';
    }

    var bOff='flex:1;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;font-size:10px;font-weight:700;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff';
    var bOn='flex:1;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;font-size:10px;font-weight:700;border:1px solid '+col+';background:rgba('+rgb+',.2);color:'+col;
    var bPow=isOn?'flex:1;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;user-select:none;font-size:11px;font-weight:800;border:1px solid '+col+';background:rgba('+rgb+',.18);color:'+col
                 :'flex:1;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;user-select:none;font-size:11px;font-weight:800;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff';

    var modePills=availModes.slice(0,4).map(function(m){
      var active=m&&mode&&m.toLowerCase()===mode.toLowerCase();
      return '<div style="'+(active?bOn:bOff)+'" data-dya="mode" data-mode="'+_esc(m)+'">'+_esc(m.charAt(0).toUpperCase()+m.slice(1))+'</div>';
    }).join('');

    var css='<style>'
      +'@keyframes deuDot{0%,100%{opacity:.5}50%{opacity:1}}'
      +'@keyframes fcUP{from{transform:translateY(100%)}to{transform:translateY(0)}}'
      +'#'+rid+'{position:relative;width:100%;height:100%;min-height:340px;font-family:system-ui,sans-serif}'
      +'#'+rid+' .fc-card{display:flex;flex-direction:column;height:100%;min-height:340px;background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      +'#'+rid+' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:220px;background:radial-gradient(ellipse at 30% 0,rgba('+rgb+',.1) 0%,transparent 65%);pointer-events:none}'
      +'#'+rid+' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      +'#'+rid+' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;background:rgba('+rgb+',.12);border:1px solid rgba('+rgb+',.25)}'
      +'#'+rid+' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}'
      +'#'+rid+' .fc-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba('+stateRgb+',.08);border:1px solid rgba('+stateRgb+',.25);color:#fff}'
      +'#'+rid+' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:'+stateCol+(isOn?';animation:deuDot .9s ease-in-out infinite':'')+'}'
      +'#'+rid+' .fc-gear{margin-left:4px;cursor:pointer;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;flex-shrink:0}'
      +'#'+rid+' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      +'#'+rid+' .fc-scroll::-webkit-scrollbar{display:none}'
      +'#'+rid+' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      +'#'+rid+' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;max-height:130px}'
      +'#'+rid+' .fc-art{width:100%;max-width:110px;aspect-ratio:1;border-radius:13px;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,rgba('+rgb+',.18),rgba('+rgb+',.05));'+(isOn?'box-shadow:0 0 0 2px '+col+',0 4px 20px rgba('+rgb+',.4)':'box-shadow:0 4px 14px rgba(0,0,0,.5)')+'}'
      +'#'+rid+' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:4px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      +'#'+rid+' .fc-sep{height:1px;background:rgba(255,255,255,.06);margin:0 14px;flex-shrink:0}'
      +'#'+rid+' [data-dya]:active{opacity:.5}'
      +'</style>';

    return css
      +'<div id="'+rid+'"><div class="fc-card">'
      +'<div class="fc-hdr"><div class="fc-hdr-iw">💧</div>'
      +'<div class="fc-hdr-tit" data-dya="rename">'+_esc(c.name)+'</div>'
      +'<div class="fc-pill"><div class="fc-dot"></div>'+_esc(stateLbl)+'</div>'
      +'<div class="fc-gear" data-dya="cfg">⚙</div></div>'
      +'<div class="fc-scroll">'
      +'<div class="fc-hero"><div class="fc-hero-img"><div class="fc-art">'+artHtml+'</div></div>'
      +'<div class="fc-hero-r">'+infoRows+'</div></div>'
      +'<div class="fc-sep"></div>'
      +'<div style="padding:8px 14px 6px;flex-shrink:0"><div style="display:flex;gap:7px">'
      +'<div style="'+bPow+'" data-dya="power">⏻ '+(isOn?'Spegni':'Accendi')+'</div>'
      +'</div></div>'
      +(isOn
        ? '<div class="fc-sep"></div>'
          +'<div style="padding:4px 14px 6px;flex-shrink:0">'
          +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
          +'<span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#fff;flex:1">Target umidità</span>'
          +'<div style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:17px;font-weight:700;color:#fff" data-dya="hum-dn">−</div>'
          +'<span style="font-size:15px;font-weight:900;color:'+col+';min-width:44px;text-align:center">'+(targetHum!=null?Math.round(targetHum)+'%':'—')+'</span>'
          +'<div style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);font-size:17px;font-weight:700;color:#fff" data-dya="hum-up">+</div>'
          +'</div>'
          +(availModes.length
            ? '<div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#fff;margin-bottom:5px">Modalità</div>'
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
    var curHum=c.pk_humidity?S(h,c.pk_humidity):at.current_humidity;
    var sig=[CARD.version,st,at.humidity,curHum,at.mode,at.preset_mode].join('|');
    if(!el.querySelector('.fc-card')||el._deuSig!==sig){ el._deuSig=sig; el._deuBound=null; el.innerHTML=render(card); }
    mount(card,hass,el);
  }

  function mount(card, hass, el) {
    if(el._deuBound===CARD.version) return;
    el._deuBound=CARD.version;
    if(el._deuHandler) el.removeEventListener('click',el._deuHandler);
    function eid(){ return cfgFor(card).pk_device; }
    el._deuHandler=function(e){
      var t=e.target.closest('[data-dya]'); if(!t) return;
      var a=t.dataset.dya;
      if(a==='cfg'){ openCfg(card,el); return; }
      if(a==='rename'){
        var cur=cfgFor(card).name; t.innerHTML='';
        var inp=document.createElement('input'); inp.type='text'; inp.value=cur;
        inp.style.cssText='width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.4);outline:none;color:#fff;font-size:13px;font-weight:800;font-family:system-ui;padding:0;line-height:1';
        t.appendChild(inp); inp.focus(); inp.select();
        function commit(){ var v=inp.value.trim()||cur; var s=load(card); s.name=v; save(card,s); el._deuSig=''; el._deuBound=null; el.innerHTML=render(card); mount(card,null,el); }
        inp.addEventListener('blur',commit,{once:true});
        inp.addEventListener('keydown',function(ev){ if(ev.key==='Enter') inp.blur(); if(ev.key==='Escape'){ inp.removeEventListener('blur',commit); t.textContent=cur; } });
        return;
      }
      if(a==='power'){
        var h=H(), st=S(h,eid());
        callSvc('humidifier',st==='on'?'turn_off':'turn_on',{entity_id:eid()});
        return;
      }
      if(a==='hum-up'||a==='hum-dn'){
        var h2=H(), at=(h2&&h2.states&&h2.states[eid()]&&h2.states[eid()].attributes)||{};
        var cur2=num(at.humidity)||50;
        var next=a==='hum-up'?Math.min(cur2+5,80):Math.max(cur2-5,30);
        callSvc('humidifier','set_humidity',{entity_id:eid(),humidity:Math.round(next)});
        return;
      }
      if(a==='mode'){
        callSvc('humidifier','set_mode',{entity_id:eid(),mode:t.dataset.mode});
        return;
      }
    };
    el.addEventListener('click',el._deuHandler);
  }

  var CARD={
    id:'deumidificatore-card',name:'Deumidificatore',icon:'💧',version:'1.1',
    desc:'Controllo deumidificatore: umidità attuale/target, modalità operative. Richiede integrazione humidifier.',
    colSpan:2,rowSpan:3,frarik_no_edit:true,
    render:function(card){ return render(card); },
    mount:function(card,hass,el){ return mount(card,hass,el); },
    update:function(card,hass,el){ return update(card,hass,el); },
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{console.log('[FratechStore] Card registrata: deumidificatore-card v'+CARD.version);}catch(e){}
})();
