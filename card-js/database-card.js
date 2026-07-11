/* frarik-version: 2.0 */
(function(){
'use strict';

var _h=null;
function H(){return _h;}
function liveH(h){_h=h;return h;}
function S(h,e){return(h&&h.states&&h.states[e]&&h.states[e].state)||'unknown';}
function N(h,e,fb){var v=parseFloat(S(h,e));return isNaN(v)?(fb===undefined?0:fb):v;}
function callSvc(d,s,t){if(!_h)return;try{_h.callService(d,s,t);}catch(e){}}

var LS_TAB='frarik_dbctab_';
var LS_STAB='frarik_dbcstab_';
var LS_SEN='frarik_dbc_sen_';

function css(){
  return '<style>'
    +'.dbc{font-family:system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;height:100%;background:linear-gradient(145deg,#1e1b4b,#0f0d2e);border-radius:18px;overflow:hidden}'
    +'.dbc-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 0;flex-shrink:0}'
    +'.dbc-hdr-ico{font-size:22px;line-height:1}'
    +'.dbc-hdr-tit{font-size:15px;font-weight:800;flex:1;color:#fff}'
    +'.dbc-pill{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px}'
    +'.dbc-pill-ok{background:rgba(52,211,153,.15);color:#34d399}'
    +'.dbc-pill-warn{background:rgba(251,146,60,.15);color:#fb923c}'
    +'.dbc-pill-err{background:rgba(239,68,68,.15);color:#f87171}'
    +'.dbc-pill-busy{background:rgba(99,102,241,.2);color:#818cf8;animation:dbcPulse 1.2s ease-in-out infinite}'
    +'.dbc-tabs{display:flex;gap:4px;padding:10px 14px 0;flex-shrink:0}'
    +'.dbc-tab{flex:1;padding:7px 0;border:none;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;font-family:system-ui;transition:all .2s}'
    +'.dbc-tab-on{background:rgba(99,102,241,.22);color:#a5b4fc;box-shadow:0 0 0 1px rgba(99,102,241,.3)}'
    +'.dbc-tab-off{background:rgba(255,255,255,.05);color:rgba(255,255,255,.45)}'
    +'.dbc-stabs{display:flex;gap:3px;background:rgba(0,0,0,.2);border-radius:10px;padding:3px;flex-shrink:0}'
    +'.dbc-stab{flex:1;padding:5px 0;border:none;border-radius:7px;font-size:10px;font-weight:700;cursor:pointer;font-family:system-ui;transition:all .15s}'
    +'.dbc-stab-on{background:rgba(99,102,241,.3);color:#c4b5fd}'
    +'.dbc-stab-off{background:transparent;color:rgba(255,255,255,.4)}'
    +'.dbc-scroll{flex:1;overflow-y:auto;padding:10px 14px 14px;display:flex;flex-direction:column;gap:9px}'
    +'.dbc-hero{display:flex;align-items:stretch;gap:9px}'
    +'.dbc-db-box{width:56px;border-radius:12px;background:rgba(99,102,241,.1);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 8px;flex-shrink:0}'
    +'.dbc-db-lbl{font-size:8px;color:rgba(255,255,255,.35);text-align:center;letter-spacing:.5px;text-transform:uppercase}'
    +'.dbc-hero-main{background:rgba(99,102,241,.08);border-radius:12px;padding:12px;flex:1;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:5px}'
    +'.dbc-shimmer{position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(99,102,241,.2) 50%,transparent 100%);background-size:200% 100%;animation:dbcShimmer 1.5s infinite;pointer-events:none}'
    +'.dbc-hero-num{font-size:30px;font-weight:900;color:#fff;line-height:1}'
    +'.dbc-hero-unit{font-size:12px;font-weight:600;color:rgba(255,255,255,.5);margin-left:2px}'
    +'.dbc-hero-bar{width:100%;height:5px;background:rgba(255,255,255,.08);border-radius:3px}'
    +'.dbc-hero-fill{height:5px;border-radius:3px;transition:width .5s}'
    +'.dbc-fill-ok{background:linear-gradient(90deg,#6366f1,#818cf8)}'
    +'.dbc-fill-warn{background:linear-gradient(90deg,#fb923c,#f97316)}'
    +'.dbc-fill-err{background:linear-gradient(90deg,#ef4444,#dc2626);animation:dbcPulse .8s ease-in-out infinite}'
    +'.dbc-hero-pct{font-size:9px;color:rgba(255,255,255,.35)}'
    +'.dbc-chips{display:flex;gap:5px;flex-wrap:wrap}'
    +'.dbc-chip{display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.06);border-radius:7px;padding:4px 8px;font-size:10px;color:rgba(255,255,255,.7)}'
    +'.dbc-repack-banner{display:flex;align-items:center;gap:10px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);border-radius:12px;padding:10px 14px;animation:dbcGlow 2s ease-in-out infinite}'
    +'.dbc-spin{animation:dbcSpin 1.5s linear infinite;display:inline-block}'
    +'.dbc-alert{display:flex;align-items:center;gap:8px;background:rgba(251,146,60,.1);border:1px solid rgba(251,146,60,.2);border-radius:10px;padding:8px 12px}'
    +'.dbc-alert-t{font-size:11px;color:#fb923c;font-weight:600}'
    +'.dbc-sec{display:flex;flex-direction:column;gap:6px}'
    +'.dbc-sec-hdr{display:flex;align-items:center;gap:6px}'
    +'.dbc-sec-ln{flex:1;height:1px;background:rgba(255,255,255,.07)}'
    +'.dbc-sec-lb{font-size:9px;font-weight:700;color:rgba(255,255,255,.3);white-space:nowrap;letter-spacing:.8px;text-transform:uppercase}'
    +'.dbc-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}'
    +'.dbc-stat{background:rgba(255,255,255,.04);border-radius:10px;padding:9px 11px}'
    +'.dbc-stat-lbl{font-size:9px;color:rgba(255,255,255,.4);margin-bottom:2px;text-transform:uppercase;letter-spacing:.3px}'
    +'.dbc-stat-val{font-size:17px;font-weight:900;color:#fff}'
    +'.dbc-stat-sub{font-size:9px;color:rgba(255,255,255,.35)}'
    +'.dbc-chart{background:rgba(0,0,0,.15);border-radius:12px;padding:8px 6px 2px}'
    +'.dbc-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border-radius:10px;padding:9px 12px;cursor:pointer}'
    +'.dbc-row-ico{font-size:15px;width:18px;text-align:center;flex-shrink:0}'
    +'.dbc-row-lbl{flex:1;font-size:12px;font-weight:600;color:#fff}'
    +'.dbc-row-sub{font-size:10px;color:rgba(255,255,255,.4);margin-top:1px}'
    +'.dbc-tgl{width:36px;height:20px;border-radius:10px;position:relative;transition:background .2s;flex-shrink:0}'
    +'.dbc-tgl-on{background:#6366f1}'
    +'.dbc-tgl-off{background:rgba(255,255,255,.15)}'
    +'.dbc-tgl::after{content:"";position:absolute;top:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left .2s}'
    +'.dbc-tgl-on::after{left:19px}'
    +'.dbc-tgl-off::after{left:3px}'
    +'.dbc-days{display:flex;gap:4px;flex-wrap:wrap}'
    +'.dbc-day{padding:5px 8px;border-radius:7px;font-size:10px;font-weight:700;cursor:pointer;border:none;font-family:system-ui;transition:all .15s}'
    +'.dbc-day-on{background:#6366f1;color:#fff}'
    +'.dbc-day-off{background:rgba(255,255,255,.07);color:rgba(255,255,255,.5)}'
    +'.dbc-nrow{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border-radius:10px;padding:8px 12px}'
    +'.dbc-nlbl{flex:1;font-size:11px;color:rgba(255,255,255,.6)}'
    +'.dbc-nbtn{width:26px;height:26px;border:none;border-radius:7px;background:rgba(99,102,241,.2);color:#a5b4fc;font-size:16px;font-weight:900;cursor:pointer;font-family:system-ui;display:flex;align-items:center;justify-content:center;flex-shrink:0}'
    +'.dbc-nval{font-size:14px;font-weight:800;color:#fff;min-width:56px;text-align:center}'
    +'.dbc-nunit{font-size:9px;color:rgba(255,255,255,.4);display:block}'
    +'.dbc-trow{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px}'
    +'.dbc-trow-l{font-size:11px;color:rgba(255,255,255,.6)}'
    +'.dbc-trow-v{font-size:15px;font-weight:800;color:#fff}'
    +'.dbc-inp-wrap{background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px}'
    +'.dbc-inp-lbl{font-size:9px;color:rgba(255,255,255,.4);margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px}'
    +'.dbc-inp{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:7px 10px;color:#fff;font-size:12px;font-family:monospace;outline:none;box-sizing:border-box}'
    +'.dbc-inp::placeholder{color:rgba(255,255,255,.2)}'
    +'.dbc-inp:focus{border-color:rgba(99,102,241,.5)}'
    +'.dbc-inp-cur{font-size:9px;color:rgba(255,255,255,.3);margin-top:4px;font-family:monospace}'
    +'.dbc-btn{width:100%;padding:11px;border:none;border-radius:11px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:12px;font-weight:800;cursor:pointer;font-family:system-ui;display:flex;align-items:center;justify-content:center;gap:7px}'
    +'.dbc-btn:active{opacity:.85}'
    +'.dbc-btn-busy{background:linear-gradient(135deg,#7c3aed,#6d28d9)}'
    +'.dbc-btn-save{background:linear-gradient(135deg,#10b981,#059669);padding:7px;font-size:11px;margin-top:6px}'
    +'.dbc-kv{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)}'
    +'.dbc-kv-k{font-size:10px;color:rgba(255,255,255,.45)}'
    +'.dbc-kv-v{font-size:11px;font-weight:700;color:#a5b4fc;max-width:55%;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    +'.dbc-kv-vm{font-size:11px;font-weight:700;color:rgba(255,255,255,.3)}'
    +'@keyframes dbcPulse{0%,100%{opacity:1}50%{opacity:.5}}'
    +'@keyframes dbcSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'
    +'@keyframes dbcShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}'
    +'@keyframes dbcGlow{0%,100%{box-shadow:0 0 6px rgba(99,102,241,.2)}50%{box-shadow:0 0 18px rgba(99,102,241,.55)}}'
    +'</style>';
}

function dbSvg(busy){
  var fc=busy?'#818cf8':'#6366f1';
  var fc2=busy?'rgba(129,140,248,.55)':'rgba(99,102,241,.45)';
  var fc3=busy?'rgba(129,140,248,.25)':'rgba(99,102,241,.25)';
  var pulse=busy?' style="animation:dbcPulse 1s ease-in-out infinite"':'';
  var glow=busy?' style="filter:drop-shadow(0 0 5px rgba(99,102,241,.8))"':'';
  return '<svg viewBox="0 0 32 32" fill="none" style="width:32px;height:32px'+(busy?';animation:dbcPulse 1.2s ease-in-out infinite':'')+'"'+glow+'>'
    +'<ellipse cx="16" cy="9" rx="10" ry="4" fill="'+fc+'"'+pulse+'/>'
    +'<path d="M6 9v7c0 2.2 4.5 4 10 4s10-1.8 10-4V9" fill="'+fc2+'"/>'
    +'<path d="M6 16v7c0 2.2 4.5 4 10 4s10-1.8 10-4v-7" fill="'+fc3+'"/>'
    +(busy?'<ellipse cx="16" cy="9" rx="5" ry="2" fill="rgba(255,255,255,.25)" style="animation:dbcPulse .7s ease-in-out infinite"/>':'')
    +'</svg>';
}

function _chart(h){
  var days=['L','M','M','G','V','S','D'];
  var keys=['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
  var vals=keys.map(function(k){return N(h,'input_number.frarik_db_'+k,0);});
  var maxV=Math.max.apply(null,vals.concat([1]));
  var W=260,CH=88,pad={t:6,r:2,b:20,l:28};
  var cW=W-pad.l-pad.r,cH=CH-pad.t-pad.b;
  var barW=Math.floor((cW-keys.length*3)/keys.length);
  var today=(new Date()).getDay(),todayIdx=today===0?6:today-1;
  var barsHtml='',gridHtml='';
  var step=Math.ceil(maxV/3/50)*50||50;
  for(var gv=0;gv<=maxV;gv+=step){
    var gy=pad.t+cH-Math.round((gv/maxV)*cH);
    gridHtml+='<line x1="'+pad.l+'" y1="'+gy+'" x2="'+(W-pad.r)+'" y2="'+gy+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
    if(gv>0){var gl=gv>=1000?(gv/1000).toFixed(1)+'k':gv+'';gridHtml+='<text x="'+(pad.l-3)+'" y="'+(gy+3)+'" text-anchor="end" fill="rgba(255,255,255,.25)" font-size="7" font-family="system-ui">'+gl+'</text>';}
  }
  vals.forEach(function(v,i){
    var bH=v>0?Math.max(3,Math.round((v/maxV)*cH)):2;
    var x=pad.l+i*(barW+3);
    var y=pad.t+cH-bH;
    var isT=i===todayIdx;
    barsHtml+='<rect x="'+x+'" y="'+y+'" width="'+barW+'" height="'+bH+'" rx="2" fill="'+(isT?'#6366f1':'rgba(99,102,241,.38)')+'" opacity="'+(isT?'1':'.9')+'"/>';
    if(isT&&v>0){var lbl=v>=1000?(v/1000).toFixed(1)+'k':Math.round(v)+'';barsHtml+='<text x="'+(x+barW/2)+'" y="'+(y-3)+'" text-anchor="middle" fill="rgba(255,255,255,.55)" font-size="7" font-family="system-ui">'+lbl+'</text>';}
    barsHtml+='<text x="'+(x+barW/2)+'" y="'+(CH-pad.b+12)+'" text-anchor="middle" fill="'+(isT?'#fff':'rgba(255,255,255,.4)')+'" font-size="8" font-family="system-ui">'+days[i]+'</text>';
  });
  return '<svg viewBox="0 0 '+W+' '+CH+'" style="width:100%;height:auto;display:block">'+gridHtml+barsHtml+'</svg>';
}

function secH(lbl){
  return '<div class="dbc-sec-hdr"><div class="dbc-sec-ln"></div><span class="dbc-sec-lb">'+lbl+'</span><div class="dbc-sec-ln"></div></div>';
}
function tglR(ico,lbl,eid,on,sub){
  return '<div class="dbc-row" data-sya="toggle" data-eid="'+eid+'">'
    +'<span class="dbc-row-ico">'+ico+'</span>'
    +'<div style="flex:1"><div class="dbc-row-lbl">'+lbl+'</div>'+(sub?'<div class="dbc-row-sub">'+sub+'</div>':'')+'</div>'
    +'<div class="dbc-tgl '+(on?'dbc-tgl-on':'dbc-tgl-off')+'"></div>'
    +'</div>';
}
function numR(lbl,eid,val,unit,step){
  return '<div class="dbc-nrow">'
    +'<div class="dbc-nlbl">'+lbl+'</div>'
    +'<button class="dbc-nbtn" data-sya="numstep" data-eid="'+eid+'" data-step="-'+Math.abs(step)+'">−</button>'
    +'<div class="dbc-nval">'+val+'<span class="dbc-nunit">'+unit+'</span></div>'
    +'<button class="dbc-nbtn" data-sya="numstep" data-eid="'+eid+'" data-step="'+Math.abs(step)+'">+</button>'
    +'</div>';
}
function kv(k,v){
  var unk=(v==='unknown'||v==='unavailable'||v===null||v===undefined);
  return '<div class="dbc-kv"><span class="dbc-kv-k">'+k+'</span><span class="'+(unk?'dbc-kv-vm':'dbc-kv-v')+'">'+( unk?'—':v)+'</span></div>';
}

function render(card){
  var h=H();
  if(!h||!h.states) return css()+'<div class="dbc"><div class="dbc-scroll" style="align-items:center;justify-content:center;text-align:center"><div style="font-size:36px">🗄️</div><div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:8px">In attesa dei dati…</div></div></div>';

  var cid=card.id||'x';
  var tab; try{tab=localStorage.getItem(LS_TAB+cid)||'monitor';}catch(e){tab='monitor';}
  var stab; try{stab=localStorage.getItem(LS_STAB+cid)||'automazioni';}catch(e){stab='automazioni';}
  var sen; try{sen=localStorage.getItem(LS_SEN+cid)||'sensor.frarik_db_dimensione';}catch(e){sen='sensor.frarik_db_dimensione';}

  var dimRaw=N(h,sen,0);
  var dimD=dimRaw>=1000?(dimRaw/1000).toFixed(2):Math.round(dimRaw)+'';
  var dimU=dimRaw>=1000?'GB':'MB';
  var media=N(h,'sensor.frarik_db_media_7_giorni',0);
  var mediaS=media>=1000?(media/1000).toFixed(1)+' GB':Math.round(media)+' MB';
  var giP=Math.round(N(h,'sensor.frarik_db_giorni_passati_repack',0));
  var giM=Math.round(N(h,'input_number.frarik_db_giorni_da_mantenere',30));
  var dimMax=Math.round(N(h,'input_number.frarik_db_dimensione_massima',1000));
  var dimPrec=Math.round(N(h,'input_number.frarik_db_dimensione_precedente',0));
  var rid=(Math.max(0,dimPrec-dimRaw)).toFixed(1);
  var stato=S(h,'input_text.frarik_db_stato')||'Standby';
  var ultRep=S(h,'input_text.frarik_db_ultimo_repack');
  var pct=dimMax>0?Math.min(100,Math.round((dimRaw/dimMax)*100)):0;
  var busy=stato==='In Corso';

  var repO=S(h,'input_boolean.frarik_db_repack_orario')==='on';
  var repD=S(h,'input_boolean.frarik_db_repack_dimensione')==='on';
  var notif=S(h,'input_boolean.frarik_db_notifiche_push')==='on';
  var dkKeys=['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
  var dkLbl=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  var orario=S(h,'input_datetime.frarik_db_orario_repack');
  if(orario&&orario!=='unknown'&&orario.length>=5) orario=orario.substring(0,5); else orario='--:--';

  var pCls,pTxt;
  if(busy){pCls='dbc-pill-busy';pTxt='⚙️ Repack…';}
  else if(pct>=100){pCls='dbc-pill-err';pTxt='🔴 DB Pieno';}
  else if(pct>=80||giP>=giM){pCls='dbc-pill-warn';pTxt='⚠️ Attenzione';}
  else{pCls='dbc-pill-ok';pTxt='✓ Standby';}
  var fillCls=pct>=100?'dbc-fill-err':pct>=80?'dbc-fill-warn':'dbc-fill-ok';

  /* ── TAB BAR ── */
  var tabBar='<div class="dbc-tabs">'
    +'<button class="dbc-tab '+(tab==='monitor'?'dbc-tab-on':'dbc-tab-off')+'" data-sya="tab-switch" data-tab="monitor">📊 Monitor</button>'
    +'<button class="dbc-tab '+(tab==='settings'?'dbc-tab-on':'dbc-tab-off')+'" data-sya="tab-switch" data-tab="settings">⚙️ Impostazioni</button>'
    +'</div>';

  /* ── MONITOR ── */
  var mon='';
  if(busy){
    mon+='<div class="dbc-repack-banner">'
      +'<span class="dbc-spin" style="font-size:22px">⚙️</span>'
      +'<div><div style="font-size:12px;font-weight:700;color:#a5b4fc">Repack database in corso…</div>'
      +'<div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">Compressione e ottimizzazione dati attiva</div></div>'
      +'</div>';
  }
  mon+='<div class="dbc-hero">'
    +'<div class="dbc-db-box"'+(busy?' style="animation:dbcGlow 2s ease-in-out infinite"':'')+'>'+dbSvg(busy)+'<div class="dbc-db-lbl">'+(busy?'REPACK':'DB')+'</div></div>'
    +'<div class="dbc-hero-main">'
    +(busy?'<div class="dbc-shimmer"></div>':'')
    +'<div><span class="dbc-hero-num">'+dimD+'</span><span class="dbc-hero-unit">'+dimU+'</span></div>'
    +'<div class="dbc-hero-bar"><div class="dbc-hero-fill '+fillCls+'" style="width:'+pct+'%"></div></div>'
    +'<div class="dbc-hero-pct">'+pct+'% di '+dimMax+' MB max</div>'
    +'</div>'
    +'</div>';
  if(!busy&&giP>=giM){
    mon+='<div class="dbc-alert"><span style="font-size:14px">⚠️</span><span class="dbc-alert-t">Repack necessario — '+giP+'gg passati (soglia '+giM+'gg)</span></div>';
  }
  mon+='<div class="dbc-chips">'
    +'<div class="dbc-chip">📅 '+(ultRep&&ultRep!=='unknown'?ultRep:'—')+'</div>'
    +'<div class="dbc-chip">⏱ '+giP+'gg fa</div>'
    +'<div class="dbc-chip">📊 '+mediaS+'</div>'
    +(dimPrec>0?'<div class="dbc-chip">⬇️ −'+rid+' MB</div>':'')
    +'</div>';
  mon+='<div class="dbc-sec">'+secH('Statistiche')
    +'<div class="dbc-grid">'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Storico</div><div class="dbc-stat-val">'+giM+'<span style="font-size:11px;font-weight:600;color:rgba(255,255,255,.4)">gg</span></div><div class="dbc-stat-sub">giorni mantenuti</div></div>'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Prossimo repack</div><div class="dbc-stat-val">'+Math.max(0,giM-giP)+'<span style="font-size:11px;font-weight:600;color:rgba(255,255,255,.4)">gg</span></div><div class="dbc-stat-sub">rimanenti</div></div>'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Pre-repack</div><div class="dbc-stat-val">'+(dimPrec>0?dimPrec+' <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,.4)">MB</span>':'—')+'</div><div class="dbc-stat-sub">dim. precedente</div></div>'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Riduzione</div><div class="dbc-stat-val">'+(dimPrec>0?rid+' <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,.4)">MB</span>':'—')+'</div><div class="dbc-stat-sub">ultimo repack</div></div>'
    +'</div></div>';
  mon+='<div class="dbc-sec">'+secH('Andamento Settimanale')+'<div class="dbc-chart">'+_chart(h)+'</div></div>';

  /* ── SETTINGS ── */
  var set='';
  set+='<div class="dbc-stabs">'
    +'<button class="dbc-stab '+(stab==='automazioni'?'dbc-stab-on':'dbc-stab-off')+'" data-sya="stab-switch" data-stab="automazioni">Automazioni</button>'
    +'<button class="dbc-stab '+(stab==='orario'?'dbc-stab-on':'dbc-stab-off')+'" data-sya="stab-switch" data-stab="orario">Orario</button>'
    +'<button class="dbc-stab '+(stab==='config'?'dbc-stab-on':'dbc-stab-off')+'" data-sya="stab-switch" data-stab="config">Config</button>'
    +'</div>';

  if(stab==='automazioni'){
    set+='<div class="dbc-sec">'+secH('Automazioni')
      +tglR('🕐','Repack a orario','input_boolean.frarik_db_repack_orario',repO,'Esegue repack all\'orario programmato')
      +tglR('📏','Repack per dimensione','input_boolean.frarik_db_repack_dimensione',repD,'Esegue se DB supera la soglia massima')
      +tglR('🔔','Notifiche push','input_boolean.frarik_db_notifiche_push',notif,'Invia notifica al completamento repack')
      +'</div>';
    set+='<div class="dbc-sec">'+secH('Repack Manuale')
      +'<button class="dbc-btn'+(busy?' dbc-btn-busy':'')+'" data-sya="repack-now">'
      +(busy?'<span class="dbc-spin">⚙️</span> Repack in corso…':'🔄 Esegui Repack Ora')
      +'</button></div>';
  }

  if(stab==='orario'){
    var daysHtml='';
    dkKeys.forEach(function(k,i){
      var on=S(h,'input_boolean.frarik_db_repack_'+k)==='on';
      daysHtml+='<button class="dbc-day '+(on?'dbc-day-on':'dbc-day-off')+'" data-sya="day-toggle" data-key="input_boolean.frarik_db_repack_'+k+'" data-on="'+(on?'1':'0')+'">'+dkLbl[i]+'</button>';
    });
    set+='<div class="dbc-sec">'+secH('Orario Repack')
      +'<div class="dbc-trow"><span class="dbc-trow-l">🕐 Orario programmato</span><span class="dbc-trow-v">'+orario+'</span></div>'
      +'</div>';
    set+='<div class="dbc-sec">'+secH('Giorni Attivi')+'<div class="dbc-days">'+daysHtml+'</div></div>';
    set+='<div class="dbc-sec">'+secH('Soglie')
      +numR('Giorni da mantenere','input_number.frarik_db_giorni_da_mantenere',giM,'gg',1)
      +numR('Dimensione massima','input_number.frarik_db_dimensione_massima',dimMax,'MB',100)
      +'</div>';
  }

  if(stab==='config'){
    set+='<div class="dbc-sec">'+secH('Sensore Sorgente')
      +'<div class="dbc-inp-wrap">'
      +'<div class="dbc-inp-lbl">Entity ID sensore dimensione DB</div>'
      +'<input class="dbc-inp" data-sya="sensor-inp" value="'+sen+'" placeholder="sensor.frarik_db_dimensione"/>'
      +'<div class="dbc-inp-cur">Attuale: '+sen+'</div>'
      +'<button class="dbc-btn dbc-btn-save" data-sya="sensor-save">💾 Salva sensore</button>'
      +'</div></div>';

    set+='<div class="dbc-sec">'+secH('Sensori PKG')
      +'<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:8px 12px">'
      +kv('frarik_db_dimensione',S(h,'sensor.frarik_db_dimensione')+' MB')
      +kv('giorni_passati_repack',giP+'gg')
      +kv('media_7_giorni',mediaS)
      +kv('versione_pkg',S(h,'sensor.frarik_database_versione'))
      +'</div></div>';

    set+='<div class="dbc-sec">'+secH('Dimensioni Giornaliere')
      +'<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:8px 12px">'
      +dkKeys.map(function(k,i){return kv(dkLbl[i],Math.round(N(h,'input_number.frarik_db_'+k,0))+' MB');}).join('')
      +'</div></div>';

    set+='<div class="dbc-sec">'+secH('Stato Sistema')
      +'<div style="background:rgba(255,255,255,.03);border-radius:10px;padding:8px 12px">'
      +kv('Stato',S(h,'input_text.frarik_db_stato'))
      +kv('Ultimo repack',S(h,'input_text.frarik_db_ultimo_repack'))
      +kv('Data reset',S(h,'input_text.frarik_db_data_reset'))
      +kv('Pre-repack',dimPrec>0?dimPrec+' MB':'—')
      +'</div></div>';
  }

  /* ── ASSEMBLE ── */
  return css()
    +'<div class="dbc">'
    +'<div class="dbc-hdr">'
    +(busy?'<div class="dbc-hdr-ico"><span class="dbc-spin">🗄️</span></div>':'<div class="dbc-hdr-ico">🗄️</div>')
    +'<div class="dbc-hdr-tit">'+(card.config&&card.config.name||'Database HA')+'</div>'
    +'<div class="dbc-pill '+pCls+'">'+pTxt+'</div>'
    +'</div>'
    +tabBar
    +'<div class="dbc-scroll">'+(tab==='monitor'?mon:set)+'</div>'
    +'</div>';
}

function mount(card,hass,el){
  if(el._dbcBound)return; el._dbcBound=true;
  el.addEventListener('click',function(e){
    var sya=e.target.closest('[data-sya]'); if(!sya)return;
    var a=sya.dataset.sya;
    var cid=card.id||'x';
    if(a==='tab-switch'){
      try{localStorage.setItem(LS_TAB+cid,sya.dataset.tab);}catch(er){}
      el.innerHTML=render(card); el._dbcBound=false; mount(card,hass,el); return;
    }
    if(a==='stab-switch'){
      try{localStorage.setItem(LS_STAB+cid,sya.dataset.stab);}catch(er){}
      el.innerHTML=render(card); el._dbcBound=false; mount(card,hass,el); return;
    }
    if(a==='toggle'){
      var eid=sya.dataset.eid;
      var cur=H()&&H().states&&H().states[eid]&&H().states[eid].state;
      callSvc('homeassistant',cur==='on'?'turn_off':'turn_on',{entity_id:eid}); return;
    }
    if(a==='day-toggle'){
      callSvc('homeassistant',sya.dataset.on==='1'?'turn_off':'turn_on',{entity_id:sya.dataset.key}); return;
    }
    if(a==='numstep'){
      var neid=sya.dataset.eid;
      var step=parseFloat(sya.dataset.step)||1;
      callSvc('input_number','set_value',{entity_id:neid,value:Math.max(1,N(H(),neid,0)+step)}); return;
    }
    if(a==='repack-now'){
      callSvc('script','turn_on',{entity_id:'script.frarik_db_repack'}); return;
    }
    if(a==='sensor-save'){
      var inp=el.querySelector('[data-sya="sensor-inp"]');
      if(inp&&inp.value.trim()){
        try{localStorage.setItem(LS_SEN+cid,inp.value.trim());}catch(er){}
        el.innerHTML=render(card); el._dbcBound=false; mount(card,hass,el);
      }
      return;
    }
  });
}

function update(card,hass,el){
  liveH(hass);
  var sig=[
    S(hass,'sensor.frarik_db_dimensione'),
    S(hass,'input_text.frarik_db_stato'),
    S(hass,'input_text.frarik_db_ultimo_repack'),
    S(hass,'sensor.frarik_db_giorni_passati_repack'),
    S(hass,'input_boolean.frarik_db_repack_orario'),
    S(hass,'input_boolean.frarik_db_repack_dimensione'),
    S(hass,'input_boolean.frarik_db_notifiche_push'),
  ].join('|');
  if(sig===el._dbcSig)return;
  el._dbcSig=sig;
  el.innerHTML=render(card);
  el._dbcBound=false;
  mount(card,hass,el);
}

var CARD={
  id:'database-card',name:'Database HA',icon:'🗄️',version:'2.0',
  desc:'Monitora il database di Home Assistant: dimensione, andamento settimanale, repack automatico con animazioni. Tab Monitor/Impostazioni.',
  colSpan:2,rowSpan:3,
  render:render,mount:mount,update:update,
  frarik_pkg_check:'sensor.frarik_database_versione',
  frarik_pkg_id:'frarik_database',
  frarik_pkg_version:'1.0',
};
window.FratechCardRegistry=window.FratechCardRegistry||{};
window.FratechCardRegistry[CARD.id]=CARD;
window.FratechCards=window.FratechCards||{};
window.FratechCards[CARD.id]=CARD;
try{console.log('[FratechStore] Card registrata: '+CARD.id+' v'+CARD.version);}catch(e){}
})();
