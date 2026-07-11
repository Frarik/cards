/* frarik-version: 2.1 */
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
var LS_SEN='frarik_dbc_sen_';    /* 'auto'|'interno'|'esterno'|'custom' */
var LS_S1='frarik_dbc_s1_';
var LS_S2='frarik_dbc_s2_';
var LS_SC='frarik_dbc_sc_';

function css(){
  return '<style>'
    +'.dbc{font-family:system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;height:100%;background:linear-gradient(145deg,#1e1b4b,#0f0d2e);border-radius:18px;overflow:hidden}'
    +'.dbc-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 0;flex-shrink:0}'
    +'.dbc-hdr-ico{font-size:22px;line-height:1}'
    +'.dbc-hdr-tit{font-size:15px;font-weight:800;color:#fff;flex:1}'
    +'.dbc-pill{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px}'
    +'.dbc-pill-ok{background:rgba(52,211,153,.18);color:#6ee7b7}'
    +'.dbc-pill-warn{background:rgba(251,146,60,.18);color:#fdba74}'
    +'.dbc-pill-err{background:rgba(239,68,68,.18);color:#fca5a5}'
    +'.dbc-pill-busy{background:rgba(99,102,241,.25);color:#c4b5fd;animation:dbcPulse 1.2s ease-in-out infinite}'
    +'.dbc-tabs{display:flex;gap:4px;padding:10px 14px 0;flex-shrink:0}'
    +'.dbc-tab{flex:1;padding:7px 0;border:none;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;font-family:system-ui;transition:all .2s;color:#fff}'
    +'.dbc-tab-on{background:rgba(99,102,241,.3);box-shadow:0 0 0 1px rgba(99,102,241,.4)}'
    +'.dbc-tab-off{background:rgba(255,255,255,.07);opacity:.65}'
    +'.dbc-stabs{display:flex;gap:3px;background:rgba(0,0,0,.25);border-radius:10px;padding:3px;flex-shrink:0}'
    +'.dbc-stab{flex:1;padding:5px 0;border:none;border-radius:7px;font-size:10px;font-weight:700;cursor:pointer;font-family:system-ui;transition:all .15s;color:#fff}'
    +'.dbc-stab-on{background:rgba(99,102,241,.35)}'
    +'.dbc-stab-off{background:transparent;opacity:.55}'
    +'.dbc-scroll{flex:1;overflow-y:auto;padding:10px 14px 14px;display:flex;flex-direction:column;gap:9px}'
    +'.dbc-hero{display:flex;align-items:stretch;gap:9px}'
    +'.dbc-db-box{width:56px;border-radius:12px;background:rgba(99,102,241,.15);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 8px;flex-shrink:0}'
    +'.dbc-db-lbl{font-size:8px;color:#fff;text-align:center;letter-spacing:.5px;text-transform:uppercase;font-weight:700}'
    +'.dbc-hero-main{background:rgba(99,102,241,.1);border-radius:12px;padding:12px;flex:1;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:5px}'
    +'.dbc-shimmer{position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(99,102,241,.25),transparent);background-size:200% 100%;animation:dbcShimmer 1.5s infinite;pointer-events:none}'
    +'.dbc-hero-num{font-size:30px;font-weight:900;color:#fff;line-height:1}'
    +'.dbc-hero-unit{font-size:12px;font-weight:700;color:#fff;margin-left:2px;opacity:.8}'
    +'.dbc-hero-bar{width:100%;height:5px;background:rgba(255,255,255,.12);border-radius:3px}'
    +'.dbc-hero-fill{height:5px;border-radius:3px;transition:width .5s}'
    +'.dbc-fill-ok{background:linear-gradient(90deg,#6366f1,#818cf8)}'
    +'.dbc-fill-warn{background:linear-gradient(90deg,#fb923c,#f97316)}'
    +'.dbc-fill-err{background:linear-gradient(90deg,#ef4444,#dc2626);animation:dbcPulse .8s ease-in-out infinite}'
    +'.dbc-hero-pct{font-size:10px;color:#fff;font-weight:600}'
    +'.dbc-chips{display:flex;gap:5px;flex-wrap:wrap}'
    +'.dbc-chip{display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.09);border-radius:7px;padding:4px 8px;font-size:10px;color:#fff;font-weight:600}'
    +'.dbc-repack-banner{display:flex;align-items:center;gap:10px;background:rgba(99,102,241,.18);border:1px solid rgba(99,102,241,.35);border-radius:12px;padding:10px 14px;animation:dbcGlow 2s ease-in-out infinite}'
    +'.dbc-spin{animation:dbcSpin 1.5s linear infinite;display:inline-block}'
    +'.dbc-reb-t{font-size:12px;font-weight:700;color:#fff}'
    +'.dbc-reb-s{font-size:10px;color:#fff;opacity:.7;margin-top:2px}'
    +'.dbc-alert{display:flex;align-items:center;gap:8px;background:rgba(251,146,60,.12);border:1px solid rgba(251,146,60,.3);border-radius:10px;padding:8px 12px}'
    +'.dbc-alert-t{font-size:11px;color:#fff;font-weight:700}'
    +'.dbc-sec{display:flex;flex-direction:column;gap:6px}'
    +'.dbc-sec-hdr{display:flex;align-items:center;gap:6px}'
    +'.dbc-sec-ln{flex:1;height:1px;background:rgba(255,255,255,.1)}'
    +'.dbc-sec-lb{font-size:9px;font-weight:800;color:#fff;white-space:nowrap;letter-spacing:.8px;text-transform:uppercase;opacity:.7}'
    +'.dbc-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}'
    +'.dbc-stat{background:rgba(255,255,255,.06);border-radius:10px;padding:9px 11px}'
    +'.dbc-stat-lbl{font-size:9px;color:#fff;margin-bottom:3px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;opacity:.65}'
    +'.dbc-stat-val{font-size:18px;font-weight:900;color:#fff;line-height:1.1}'
    +'.dbc-stat-u{font-size:11px;font-weight:600;color:#fff;opacity:.7}'
    +'.dbc-stat-sub{font-size:9px;color:#fff;opacity:.55;margin-top:2px}'
    +'.dbc-chart{background:rgba(0,0,0,.18);border-radius:12px;padding:8px 6px 2px}'
    +'.dbc-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border-radius:10px;padding:9px 12px;cursor:pointer}'
    +'.dbc-row-ico{font-size:15px;width:18px;text-align:center;flex-shrink:0}'
    +'.dbc-row-lbl{font-size:12px;font-weight:700;color:#fff}'
    +'.dbc-row-sub{font-size:10px;color:#fff;opacity:.6;margin-top:1px}'
    +'.dbc-tgl{width:36px;height:20px;border-radius:10px;position:relative;transition:background .2s;flex-shrink:0}'
    +'.dbc-tgl-on{background:#6366f1}'
    +'.dbc-tgl-off{background:rgba(255,255,255,.2)}'
    +'.dbc-tgl::after{content:"";position:absolute;top:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left .2s}'
    +'.dbc-tgl-on::after{left:19px}'
    +'.dbc-tgl-off::after{left:3px}'
    +'.dbc-days{display:flex;gap:4px;flex-wrap:wrap}'
    +'.dbc-day{padding:5px 9px;border-radius:7px;font-size:10px;font-weight:700;cursor:pointer;border:none;font-family:system-ui;transition:all .15s;color:#fff}'
    +'.dbc-day-on{background:#6366f1}'
    +'.dbc-day-off{background:rgba(255,255,255,.1);opacity:.65}'
    +'.dbc-nrow{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border-radius:10px;padding:8px 12px}'
    +'.dbc-nlbl{flex:1;font-size:11px;color:#fff;font-weight:600}'
    +'.dbc-nbtn{width:28px;height:28px;border:none;border-radius:7px;background:rgba(99,102,241,.3);color:#fff;font-size:16px;font-weight:900;cursor:pointer;font-family:system-ui;display:flex;align-items:center;justify-content:center;flex-shrink:0}'
    +'.dbc-nval{font-size:15px;font-weight:800;color:#fff;min-width:64px;text-align:center}'
    +'.dbc-nunit{font-size:9px;color:#fff;display:block;opacity:.7}'
    +'.dbc-trow{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.06);border-radius:10px;padding:10px 12px}'
    +'.dbc-trow-l{font-size:11px;color:#fff;font-weight:600}'
    +'.dbc-trow-v{font-size:15px;font-weight:900;color:#fff}'
    +'.dbc-inp-wrap{background:rgba(255,255,255,.06);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}'
    +'.dbc-inp-lbl{font-size:10px;color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:.4px;opacity:.75}'
    +'.dbc-inp{width:100%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:7px 10px;color:#fff;font-size:12px;font-family:monospace;outline:none;box-sizing:border-box;font-weight:600}'
    +'.dbc-inp::placeholder{color:rgba(255,255,255,.35)}'
    +'.dbc-inp:focus{border-color:rgba(99,102,241,.6);background:rgba(255,255,255,.12)}'
    +'.dbc-btn{width:100%;padding:11px;border:none;border-radius:11px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:12px;font-weight:800;cursor:pointer;font-family:system-ui;display:flex;align-items:center;justify-content:center;gap:7px}'
    +'.dbc-btn:active{opacity:.85}'
    +'.dbc-btn-busy{background:linear-gradient(135deg,#7c3aed,#6d28d9)}'
    +'.dbc-btn-sm{padding:7px;font-size:11px;background:linear-gradient(135deg,#10b981,#059669)}'
    +'.dbc-sen-opts{display:flex;gap:4px}'
    +'.dbc-sen-opt{flex:1;padding:6px 4px;border:none;border-radius:8px;font-size:10px;font-weight:700;cursor:pointer;font-family:system-ui;color:#fff;transition:all .15s}'
    +'.dbc-sen-on{background:rgba(99,102,241,.4);box-shadow:0 0 0 1px rgba(99,102,241,.5)}'
    +'.dbc-sen-off{background:rgba(255,255,255,.08);opacity:.65}'
    +'.dbc-kv{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.07)}'
    +'.dbc-kv-k{font-size:10px;color:#fff;font-weight:600;opacity:.7}'
    +'.dbc-kv-v{font-size:11px;font-weight:700;color:#fff;max-width:60%;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    +'.dbc-kv-m{font-size:11px;font-weight:700;color:#fff;opacity:.35}'
    +'.dbc-info-box{background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px}'
    +'@keyframes dbcPulse{0%,100%{opacity:1}50%{opacity:.5}}'
    +'@keyframes dbcSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'
    +'@keyframes dbcShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}'
    +'@keyframes dbcGlow{0%,100%{box-shadow:0 0 6px rgba(99,102,241,.2)}50%{box-shadow:0 0 20px rgba(99,102,241,.55)}}'
    +'</style>';
}

function dbSvg(busy){
  var c=busy?'#a5b4fc':'#818cf8';
  var c2=busy?'rgba(165,180,252,.5)':'rgba(99,102,241,.45)';
  var c3='rgba(99,102,241,.22)';
  return '<svg viewBox="0 0 32 32" fill="none" style="width:32px;height:32px'+(busy?';animation:dbcPulse 1.1s ease-in-out infinite':'')+'">'
    +'<ellipse cx="16" cy="9" rx="10" ry="4" fill="'+c+'"/>'
    +'<path d="M6 9v7c0 2.2 4.5 4 10 4s10-1.8 10-4V9" fill="'+c2+'"/>'
    +'<path d="M6 16v7c0 2.2 4.5 4 10 4s10-1.8 10-4v-7" fill="'+c3+'"/>'
    +(busy?'<ellipse cx="16" cy="9" rx="5" ry="1.8" fill="rgba(255,255,255,.3)" style="animation:dbcPulse .7s ease-in-out infinite"/>':'')
    +'</svg>';
}

function _chart(h){
  var days=['L','M','M','G','V','S','D'];
  var keys=['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
  var vals=keys.map(function(k){return N(h,'input_number.frarik_db_'+k,0);});
  var maxV=Math.max.apply(null,vals.concat([1]));
  var W=260,CH=88,pad={t:6,r:2,b:20,l:30};
  var cW=W-pad.l-pad.r,cH=CH-pad.t-pad.b;
  var barW=Math.floor((cW-keys.length*3)/keys.length);
  var today=(new Date()).getDay(),todayIdx=today===0?6:today-1;
  var html='';
  var step=Math.ceil(maxV/3/50)*50||50;
  for(var gv=0;gv<=maxV;gv+=step){
    var gy=pad.t+cH-Math.round((gv/maxV)*cH);
    html+='<line x1="'+pad.l+'" y1="'+gy+'" x2="'+(W-pad.r)+'" y2="'+gy+'" stroke="rgba(255,255,255,.07)" stroke-width="1"/>';
    if(gv>0){var gl=gv>=1000?(gv/1000).toFixed(1)+'k':gv+'';html+='<text x="'+(pad.l-3)+'" y="'+(gy+3)+'" text-anchor="end" fill="#fff" fill-opacity=".4" font-size="7" font-family="system-ui">'+gl+'</text>';}
  }
  vals.forEach(function(v,i){
    var bH=v>0?Math.max(3,Math.round((v/maxV)*cH)):2;
    var x=pad.l+i*(barW+3),y=pad.t+cH-bH;
    var isT=i===todayIdx;
    html+='<rect x="'+x+'" y="'+y+'" width="'+barW+'" height="'+bH+'" rx="2" fill="'+(isT?'#818cf8':'rgba(99,102,241,.45)')+'" opacity="'+(isT?'1':'.85')+'"/>';
    if(isT&&v>0){var lbl=v>=1000?(v/1000).toFixed(1)+'k':Math.round(v)+'';html+='<text x="'+(x+barW/2)+'" y="'+(y-3)+'" text-anchor="middle" fill="#fff" fill-opacity=".7" font-size="7" font-family="system-ui">'+lbl+'</text>';}
    html+='<text x="'+(x+barW/2)+'" y="'+(CH-pad.b+12)+'" text-anchor="middle" fill="#fff" fill-opacity="'+(isT?'1':'.5')+'" font-size="8" font-family="system-ui">'+days[i]+'</text>';
  });
  return '<svg viewBox="0 0 '+W+' '+CH+'" style="width:100%;height:auto;display:block">'+html+'</svg>';
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
function kvRow(k,v){
  var miss=(v==='unknown'||v==='unavailable'||v===''||v===null||v===undefined);
  return '<div class="dbc-kv"><span class="dbc-kv-k">'+k+'</span><span class="'+(miss?'dbc-kv-m':'dbc-kv-v')+'">'+( miss?'—':v)+'</span></div>';
}

function render(card){
  var h=H();
  if(!h||!h.states) return css()+'<div class="dbc"><div class="dbc-scroll" style="align-items:center;justify-content:center;text-align:center"><div style="font-size:36px">🗄️</div><div style="font-size:12px;color:#fff;opacity:.5;margin-top:8px">In attesa dei dati…</div></div></div>';

  var cid=card.id||'x';
  var tab; try{tab=localStorage.getItem(LS_TAB+cid)||'monitor';}catch(e){tab='monitor';}
  var stab; try{stab=localStorage.getItem(LS_STAB+cid)||'automazioni';}catch(e){stab='automazioni';}
  var senMode; try{senMode=localStorage.getItem(LS_SEN+cid)||'auto';}catch(e){senMode='auto';}
  var s1; try{s1=localStorage.getItem(LS_S1+cid)||'sensor.home_assistant_v2_db_dimensione';}catch(e){s1='sensor.home_assistant_v2_db_dimensione';}
  var s2; try{s2=localStorage.getItem(LS_S2+cid)||'sensor.maria_db_esterno';}catch(e){s2='sensor.maria_db_esterno';}
  var sc; try{sc=localStorage.getItem(LS_SC+cid)||'';}catch(e){sc='';}

  /* sensore attivo */
  var activeSen='sensor.frarik_db_dimensione';
  if(senMode==='interno') activeSen=s1;
  else if(senMode==='esterno') activeSen=s2;
  else if(senMode==='custom'&&sc) activeSen=sc;
  else{ /* auto: usa frarik_db_dimensione che legge dal pkg */ activeSen='sensor.frarik_db_dimensione'; }

  var dimRaw=N(h,activeSen,0);
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

  var tabBar='<div class="dbc-tabs">'
    +'<button class="dbc-tab '+(tab==='monitor'?'dbc-tab-on':'dbc-tab-off')+'" data-sya="tab-switch" data-tab="monitor">📊 Monitor</button>'
    +'<button class="dbc-tab '+(tab==='settings'?'dbc-tab-on':'dbc-tab-off')+'" data-sya="tab-switch" data-tab="settings">⚙️ Impostazioni</button>'
    +'</div>';

  /* ═══ MONITOR ═══ */
  var mon='';
  if(busy){
    mon+='<div class="dbc-repack-banner">'
      +'<span class="dbc-spin" style="font-size:22px">⚙️</span>'
      +'<div><div class="dbc-reb-t">Repack database in corso…</div>'
      +'<div class="dbc-reb-s">Compressione e ottimizzazione attiva</div></div>'
      +'</div>';
  }
  mon+='<div class="dbc-hero">'
    +'<div class="dbc-db-box"'+(busy?' style="animation:dbcGlow 2s ease-in-out infinite"':'')+'>'+dbSvg(busy)+'<div class="dbc-db-lbl">'+(busy?'REPACK':'DB')+'</div></div>'
    +'<div class="dbc-hero-main">'+(busy?'<div class="dbc-shimmer"></div>':'')
    +'<div><span class="dbc-hero-num">'+dimD+'</span><span class="dbc-hero-unit">'+dimU+'</span></div>'
    +'<div class="dbc-hero-bar"><div class="dbc-hero-fill '+fillCls+'" style="width:'+pct+'%"></div></div>'
    +'<div class="dbc-hero-pct">'+pct+'% di '+dimMax+' MB</div>'
    +'</div></div>';
  if(!busy&&giP>=giM){
    mon+='<div class="dbc-alert"><span style="font-size:14px">⚠️</span><span class="dbc-alert-t">Repack necessario — '+giP+' giorni (soglia '+giM+'gg)</span></div>';
  }
  mon+='<div class="dbc-chips">'
    +'<div class="dbc-chip">📅 '+(ultRep&&ultRep!=='unknown'?ultRep:'—')+'</div>'
    +'<div class="dbc-chip">⏱ '+giP+'gg fa</div>'
    +'<div class="dbc-chip">📊 '+mediaS+'</div>'
    +(dimPrec>0?'<div class="dbc-chip">⬇️ −'+rid+' MB</div>':'')
    +'</div>';
  mon+='<div class="dbc-sec">'+secH('Statistiche')
    +'<div class="dbc-grid">'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Storico</div><div class="dbc-stat-val">'+giM+'<span class="dbc-stat-u">gg</span></div><div class="dbc-stat-sub">giorni mantenuti</div></div>'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Prossimo repack</div><div class="dbc-stat-val">'+Math.max(0,giM-giP)+'<span class="dbc-stat-u">gg</span></div><div class="dbc-stat-sub">rimanenti</div></div>'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Pre-repack</div><div class="dbc-stat-val">'+(dimPrec>0?dimPrec:'—')+'<span class="dbc-stat-u">'+(dimPrec>0?' MB':'')+'</span></div><div class="dbc-stat-sub">dim. precedente</div></div>'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Riduzione</div><div class="dbc-stat-val">'+(dimPrec>0?rid:'—')+'<span class="dbc-stat-u">'+(dimPrec>0?' MB':'')+'</span></div><div class="dbc-stat-sub">ultimo repack</div></div>'
    +'</div></div>';
  mon+='<div class="dbc-sec">'+secH('Andamento Settimanale')+'<div class="dbc-chart">'+_chart(h)+'</div></div>';

  /* ═══ SETTINGS ═══ */
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
    /* due sensori sorgente + custom */
    set+='<div class="dbc-sec">'+secH('Sensore Sorgente')
      +'<div class="dbc-info-box" style="font-size:10px;color:#fff;opacity:.7;line-height:1.5">Seleziona quale sensore usare come sorgente dimensione DB. Le opzioni corrispondono ai 2 sensori del PKG.</div>'
      +'<div class="dbc-sen-opts">'
      +'<button class="dbc-sen-opt '+(senMode==='auto'?'dbc-sen-on':'dbc-sen-off')+'" data-sya="sen-mode" data-mode="auto">Auto PKG</button>'
      +'<button class="dbc-sen-opt '+(senMode==='interno'?'dbc-sen-on':'dbc-sen-off')+'" data-sya="sen-mode" data-mode="interno">HA Interno</button>'
      +'<button class="dbc-sen-opt '+(senMode==='esterno'?'dbc-sen-on':'dbc-sen-off')+'" data-sya="sen-mode" data-mode="esterno">MariaDB</button>'
      +'<button class="dbc-sen-opt '+(senMode==='custom'?'dbc-sen-on':'dbc-sen-off')+'" data-sya="sen-mode" data-mode="custom">Custom</button>'
      +'</div>'
      +(senMode==='interno'||senMode==='esterno'||senMode==='custom'?
        '<div class="dbc-inp-wrap">'
        +(senMode==='interno'?'<div class="dbc-inp-lbl">Entity ID sensore DB interno (HA)</div><input class="dbc-inp" data-sya="s1-inp" value="'+s1+'" placeholder="sensor.home_assistant_v2_db_dimensione"/><button class="dbc-btn dbc-btn-sm" data-sya="s1-save">💾 Salva</button>':'')
        +(senMode==='esterno'?'<div class="dbc-inp-lbl">Entity ID sensore MariaDB esterno</div><input class="dbc-inp" data-sya="s2-inp" value="'+s2+'" placeholder="sensor.maria_db_esterno"/><button class="dbc-btn dbc-btn-sm" data-sya="s2-save">💾 Salva</button>':'')
        +(senMode==='custom'?'<div class="dbc-inp-lbl">Entity ID sensore personalizzato</div><input class="dbc-inp" data-sya="sc-inp" value="'+sc+'" placeholder="sensor.custom_db_size"/><button class="dbc-btn dbc-btn-sm" data-sya="sc-save">💾 Salva</button>':'')
        +'</div>'
      :'')
      +'<div class="dbc-trow" style="margin-top:0"><span class="dbc-trow-l">Sensore attivo</span><span style="font-size:10px;font-weight:700;color:#a5b4fc;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+activeSen+'</span></div>'
      +'</div>';

    set+='<div class="dbc-sec">'+secH('Valori Live Sensori')
      +'<div class="dbc-info-box">'
      +kvRow('frarik_db_dimensione',S(h,'sensor.frarik_db_dimensione')+' MB')
      +kvRow('giorni_passati_repack',giP+'gg')
      +kvRow('media_7_giorni',mediaS)
      +kvRow('versione_pkg',S(h,'sensor.frarik_database_versione'))
      +'</div></div>';

    set+='<div class="dbc-sec">'+secH('Dimensioni Giornaliere')
      +'<div class="dbc-info-box">'
      +dkKeys.map(function(k,i){return kvRow(dkLbl[i],Math.round(N(h,'input_number.frarik_db_'+k,0))+' MB');}).join('')
      +'</div></div>';

    set+='<div class="dbc-sec">'+secH('Stato')
      +'<div class="dbc-info-box">'
      +kvRow('Stato corrente',S(h,'input_text.frarik_db_stato'))
      +kvRow('Ultimo repack',S(h,'input_text.frarik_db_ultimo_repack'))
      +kvRow('Data reset',S(h,'input_text.frarik_db_data_reset'))
      +kvRow('Dim. precedente',dimPrec>0?dimPrec+' MB':'—')
      +'</div></div>';
  }

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
  liveH(hass); /* CRITICO: setta _h prima di qualsiasi click */
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
    if(a==='sen-mode'){
      try{localStorage.setItem(LS_SEN+cid,sya.dataset.mode);}catch(er){}
      el.innerHTML=render(card); el._dbcBound=false; mount(card,hass,el); return;
    }
    if(a==='s1-save'){
      var i1=el.querySelector('[data-sya="s1-inp"]');
      if(i1&&i1.value.trim()){try{localStorage.setItem(LS_S1+cid,i1.value.trim());}catch(er){}}
      el.innerHTML=render(card); el._dbcBound=false; mount(card,hass,el); return;
    }
    if(a==='s2-save'){
      var i2=el.querySelector('[data-sya="s2-inp"]');
      if(i2&&i2.value.trim()){try{localStorage.setItem(LS_S2+cid,i2.value.trim());}catch(er){}}
      el.innerHTML=render(card); el._dbcBound=false; mount(card,hass,el); return;
    }
    if(a==='sc-save'){
      var ic=el.querySelector('[data-sya="sc-inp"]');
      if(ic&&ic.value.trim()){try{localStorage.setItem(LS_SC+cid,ic.value.trim());}catch(er){}}
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
      var step=parseFloat(sya.dataset.step)||1;
      callSvc('input_number','set_value',{entity_id:sya.dataset.eid,value:Math.max(1,N(H(),sya.dataset.eid,0)+step)}); return;
    }
    if(a==='repack-now'){
      callSvc('script','turn_on',{entity_id:'script.frarik_db_repack'}); return;
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
  id:'database-card',name:'Database HA',icon:'🗄️',version:'2.1',
  desc:'Database HA: dimensione live, repack automatico, animazioni, 2 sensori configurabili.',
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
