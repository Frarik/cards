/* frarik-version: 1.0 */
(function(){
'use strict';

/* ── helpers globali ── */
var _dbH=null;
function H(){return _dbH;}
function liveH(h){_dbH=h;return h;}
function S(h,e){return (h&&h.states&&h.states[e]&&h.states[e].state)||'unknown';}
function N(h,e,fb){var v=parseFloat(S(h,e));return isNaN(v)?fb:v;}
function callSvc(d,s,t){if(!_dbH)return;try{_dbH.callService(d,s,t);}catch(e){}}

/* ── bar chart settimanale ── */
function _chart(h){
  var days=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  var keys=['lun','mar','mer','gio','ven','sab','dom'];
  var vals=keys.map(function(k){return N(h,'input_number.frarik_db_'+k,0);});
  var maxV=Math.max.apply(null,vals.concat([1]));
  var W=280,H=160,pad={t:10,r:4,b:24,l:38};
  var cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
  var barW=Math.floor((cW-keys.length*3)/keys.length);
  var colors=['#6366f1','#818cf8','#38bdf8','#34d399','#fb923c','#f472b6','#a78bfa'];
  var today=(new Date()).getDay();
  var todayIdx=today===0?6:today-1;

  var barsHtml='';
  vals.forEach(function(v,i){
    var bH=v>0?Math.max(4,Math.round((v/maxV)*cH)):2;
    var x=pad.l+i*(barW+3);
    var y=pad.t+cH-bH;
    var isToday=i===todayIdx;
    barsHtml+='<rect x="'+x+'" y="'+y+'" width="'+barW+'" height="'+bH+'" rx="3"'
      +' fill="'+(isToday?colors[i]:'rgba(99,102,241,.55)')+'" opacity="'+(isToday?'1':'.7')+'"/>';
    barsHtml+='<text x="'+(x+barW/2)+'" y="'+(H-pad.b+13)+'" text-anchor="middle"'
      +' fill="'+(isToday?'#fff':'rgba(255,255,255,.45)')+'" font-size="9" font-family="system-ui">'
      +days[i]+'</text>';
    if(v>0){
      var lbl=v>=1000?(v/1000).toFixed(1)+'k':Math.round(v)+'';
      barsHtml+='<text x="'+(x+barW/2)+'" y="'+(y-3)+'" text-anchor="middle"'
        +' fill="rgba(255,255,255,.5)" font-size="8" font-family="system-ui">'+lbl+'</text>';
    }
  });

  var gridHtml='';
  var step=Math.ceil(maxV/4/100)*100||100;
  for(var gv=0;gv<=maxV;gv+=step){
    var gy=pad.t+cH-Math.round((gv/maxV)*cH);
    var glbl=gv>=1000?(gv/1000).toFixed(1)+'k':gv+'';
    gridHtml+='<line x1="'+pad.l+'" y1="'+gy+'" x2="'+(W-pad.r)+'" y2="'+gy+'"'
      +' stroke="rgba(255,255,255,.06)" stroke-width="1"/>';
    gridHtml+='<text x="'+(pad.l-3)+'" y="'+(gy+3)+'" text-anchor="end"'
      +' fill="rgba(255,255,255,.35)" font-size="8" font-family="system-ui">'+glbl+'</text>';
  }

  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">'+gridHtml+barsHtml+'</svg>';
}

/* ── css ── */
function css(){
  return '<style>'
    +'.dbc{background:linear-gradient(145deg,#1e1b4b,#14103a);border-radius:18px;overflow:hidden;font-family:system-ui,sans-serif;color:#fff}'
    +'.dbc-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 10px}'
    +'.dbc-hdr-ico{font-size:22px;line-height:1}'
    +'.dbc-hdr-tit{font-size:15px;font-weight:800;flex:1;color:#fff}'
    +'.dbc-pill{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px}'
    +'.dbc-pill-ok{background:rgba(52,211,153,.15);color:#34d399}'
    +'.dbc-pill-warn{background:rgba(251,146,60,.15);color:#fb923c}'
    +'.dbc-pill-busy{background:rgba(99,102,241,.25);color:#818cf8}'
    +'.dbc-scroll{padding:0 14px 16px;display:flex;flex-direction:column;gap:12px}'
    +'.dbc-hero{background:rgba(0,0,0,.2);border-radius:14px;padding:16px;display:flex;align-items:center;gap:14px}'
    +'.dbc-hero-size{font-size:34px;font-weight:900;color:#fff;line-height:1}'
    +'.dbc-hero-unit{font-size:14px;font-weight:600;color:rgba(255,255,255,.5);margin-left:2px}'
    +'.dbc-hero-info{display:flex;flex-direction:column;gap:4px}'
    +'.dbc-chip{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.07);border-radius:8px;padding:3px 8px;font-size:11px;color:rgba(255,255,255,.75);width:fit-content}'
    +'.dbc-sec{display:flex;flex-direction:column;gap:6px}'
    +'.dbc-sec-hdr{display:flex;align-items:center;gap:6px;margin-bottom:2px}'
    +'.dbc-sec-ln{flex:1;height:1px;background:rgba(255,255,255,.07)}'
    +'.dbc-sec-lb{font-size:10px;font-weight:700;color:rgba(255,255,255,.4);white-space:nowrap;letter-spacing:.5px;text-transform:uppercase}'
    +'.dbc-chart{background:rgba(0,0,0,.2);border-radius:12px;padding:10px 8px 4px}'
    +'.dbc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
    +'.dbc-stat{background:rgba(255,255,255,.05);border-radius:10px;padding:10px 12px}'
    +'.dbc-stat-lbl{font-size:10px;color:rgba(255,255,255,.45);margin-bottom:2px}'
    +'.dbc-stat-val{font-size:16px;font-weight:800;color:#fff}'
    +'.dbc-stat-sub{font-size:10px;color:rgba(255,255,255,.4)}'
    +'.dbc-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px;cursor:pointer}'
    +'.dbc-row-ico{font-size:16px;width:22px;text-align:center}'
    +'.dbc-row-lbl{flex:1;font-size:12px;font-weight:600;color:#fff}'
    +'.dbc-toggle{width:36px;height:20px;border-radius:10px;position:relative;transition:background .2s;flex-shrink:0}'
    +'.dbc-toggle-on{background:#6366f1}'
    +'.dbc-toggle-off{background:rgba(255,255,255,.15)}'
    +'.dbc-toggle::after{content:"";position:absolute;top:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left .2s}'
    +'.dbc-toggle-on::after{left:19px}'
    +'.dbc-toggle-off::after{left:3px}'
    +'.dbc-days{display:flex;gap:5px;flex-wrap:wrap}'
    +'.dbc-day{padding:5px 9px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;border:none;transition:all .15s;font-family:system-ui}'
    +'.dbc-day-on{background:#6366f1;color:#fff}'
    +'.dbc-day-off{background:rgba(255,255,255,.07);color:rgba(255,255,255,.5)}'
    +'.dbc-btn{width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:system-ui}'
    +'.dbc-btn:active{opacity:.85}'
    +'.dbc-cfg-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)}'
    +'.dbc-cfg-lbl{flex:1;font-size:11px;color:rgba(255,255,255,.6)}'
    +'.dbc-cfg-val{font-size:12px;font-weight:700;color:#fff}'
    +'</style>';
}

/* ── render ── */
function render(card){
  var h=H();
  if(!h||!h.states) return css()+'<div class="dbc"><div class="dbc-scroll" style="padding:20px;color:rgba(255,255,255,.4);font-size:12px">In attesa dei dati…</div></div>';

  var rid='dbc_'+(card.id||'x');
  var nm=(card.config&&card.config.name)||'Database HA';

  /* valori principali */
  var dimRaw=N(h,'sensor.frarik_db_dimensione',0);
  var dim=dimRaw>=1000?(dimRaw/1000).toFixed(2)+' GB':Math.round(dimRaw)+' MB';
  var dimUnit=dimRaw>=1000?'':'MB';
  var dimDisplay=dimRaw>=1000?(dimRaw/1000).toFixed(2):Math.round(dimRaw)+'';
  var dimUnitDisplay=dimRaw>=1000?'GB':'MB';

  var media=N(h,'sensor.frarik_db_media_7_giorni',0);
  var mediaStr=media>=1000?(media/1000).toFixed(1)+' GB':Math.round(media)+' MB';
  var giorniPassati=N(h,'sensor.frarik_db_giorni_passati_repack',0);
  var giorniDaMan=N(h,'input_number.frarik_db_giorni_da_mantenere',30);
  var dimMax=N(h,'input_number.frarik_db_dimensione_massima',1000);
  var dimPrec=N(h,'input_number.frarik_db_dimensione_precedente',0);
  var riduzione=Math.max(0,dimPrec-dimRaw).toFixed(1);

  var stato=S(h,'input_text.frarik_db_stato')||'Standby';
  var ultimoRepack=S(h,'input_text.frarik_db_ultimo_repack')||'—';

  /* status pill */
  var pillCls='dbc-pill-ok', pillTxt='Standby';
  if(stato==='In Corso'){pillCls='dbc-pill-busy';pillTxt='In Corso…';}
  else if(dimRaw>dimMax){pillCls='dbc-pill-warn';pillTxt='DB Pieno';}
  else if(giorniPassati>=giorniDaMan){pillCls='dbc-pill-warn';pillTxt='Repack Atteso';}

  /* toggle states */
  var repOrario=S(h,'input_boolean.frarik_db_repack_orario')==='on';
  var repDim=S(h,'input_boolean.frarik_db_repack_dimensione')==='on';
  var notifiche=S(h,'input_boolean.frarik_db_notifiche_push')==='on';

  /* giorni settimana */
  var dayKeys=['lun','mar','mer','gio','ven','sab','dom'];
  var dayLabels=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  var daysHtml='';
  dayKeys.forEach(function(k,i){
    var on=S(h,'input_boolean.frarik_db_repack_'+k)==='on';
    daysHtml+='<button class="dbc-day '+(on?'dbc-day-on':'dbc-day-off')+'"'
      +' data-sya="day-toggle" data-key="frarik_db_repack_'+k+'" data-on="'+(on?'1':'0')+'">'+dayLabels[i]+'</button>';
  });

  function toggleRow(ico,lbl,eid,on){
    return '<div class="dbc-row" data-sya="toggle" data-eid="'+eid+'">'
      +'<span class="dbc-row-ico">'+ico+'</span>'
      +'<span class="dbc-row-lbl">'+lbl+'</span>'
      +'<div class="dbc-toggle '+(on?'dbc-toggle-on':'dbc-toggle-off')+'"></div>'
      +'</div>';
  }

  /* orario */
  var orarioVal=S(h,'input_datetime.frarik_db_orario_repack');
  if(orarioVal&&orarioVal!=='unknown'&&orarioVal.length>=5) orarioVal=orarioVal.substring(0,5); else orarioVal='--:--';

  /* percentuale vs max */
  var pct=dimMax>0?Math.min(100,Math.round((dimRaw/dimMax)*100)):0;

  return css()
    +'<div id="'+rid+'" class="dbc">'
    +'<div class="dbc-hdr">'
    +'<div class="dbc-hdr-ico">🗄️</div>'
    +'<div class="dbc-hdr-tit">'+nm+'</div>'
    +'<div class="dbc-pill '+pillCls+'">'+pillTxt+'</div>'
    +'</div>'
    +'<div class="dbc-scroll">'

    /* hero */
    +'<div class="dbc-hero">'
    +'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(99,102,241,.12);border-radius:14px;padding:14px 18px;min-width:80px">'
    +'<div class="dbc-hero-size">'+dimDisplay+'<span class="dbc-hero-unit">'+dimUnitDisplay+'</span></div>'
    +'<div style="font-size:9px;color:rgba(255,255,255,.35);margin-top:3px">ATTUALE</div>'
    +'<div style="width:100%;height:4px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:8px">'
    +'<div style="height:4px;border-radius:2px;background:'+(pct>80?'#fb923c':'#6366f1')+';width:'+pct+'%"></div>'
    +'</div>'
    +'<div style="font-size:9px;color:rgba(255,255,255,.3);margin-top:3px">'+pct+'% di '+Math.round(dimMax)+' MB</div>'
    +'</div>'
    +'<div class="dbc-hero-info">'
    +'<div class="dbc-chip">📅 Ultimo repack: '+ultimoRepack+'</div>'
    +'<div class="dbc-chip">⏱️ '+giorniPassati+' giorni fa</div>'
    +'<div class="dbc-chip">📊 Media 7gg: '+mediaStr+'</div>'
    +(dimPrec>0?'<div class="dbc-chip">⬇️ Riduzione: '+riduzione+' MB</div>':'')
    +'</div>'
    +'</div>'

    /* chart */
    +'<div class="dbc-sec">'
    +'<div class="dbc-sec-hdr"><div class="dbc-sec-ln"></div><span class="dbc-sec-lb">📈 Dimensione Settimanale</span><div class="dbc-sec-ln"></div></div>'
    +'<div class="dbc-chart">'+_chart(h)+'</div>'
    +'</div>'

    /* stat grid */
    +'<div class="dbc-sec">'
    +'<div class="dbc-sec-hdr"><div class="dbc-sec-ln"></div><span class="dbc-sec-lb">📊 Statistiche</span><div class="dbc-sec-ln"></div></div>'
    +'<div class="dbc-grid">'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Giorni da mantenere</div><div class="dbc-stat-val">'+Math.round(giorniDaMan)+'</div><div class="dbc-stat-sub">giorni storico</div></div>'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Dimensione massima</div><div class="dbc-stat-val">'+Math.round(dimMax)+'</div><div class="dbc-stat-sub">MB soglia</div></div>'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Prima del repack</div><div class="dbc-stat-val">'+(dimPrec>0?Math.round(dimPrec):'—')+'</div><div class="dbc-stat-sub">MB</div></div>'
    +'<div class="dbc-stat"><div class="dbc-stat-lbl">Repack tra</div><div class="dbc-stat-val">'+Math.max(0,Math.round(giorniDaMan-giorniPassati))+'</div><div class="dbc-stat-sub">giorni</div></div>'
    +'</div>'
    +'</div>'

    /* automazioni */
    +'<div class="dbc-sec">'
    +'<div class="dbc-sec-hdr"><div class="dbc-sec-ln"></div><span class="dbc-sec-lb">⚙️ Automazioni</span><div class="dbc-sec-ln"></div></div>'
    +toggleRow('🕐','Repack automatico a orario','input_boolean.frarik_db_repack_orario',repOrario)
    +toggleRow('📏','Repack per dimensione massima','input_boolean.frarik_db_repack_dimensione',repDim)
    +toggleRow('🔔','Notifiche push','input_boolean.frarik_db_notifiche_push',notifiche)
    +'</div>'

    /* orario + giorni */
    +'<div class="dbc-sec">'
    +'<div class="dbc-sec-hdr"><div class="dbc-sec-ln"></div><span class="dbc-sec-lb">📅 Programmazione</span><div class="dbc-sec-ln"></div></div>'
    +'<div style="background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px">'
    +'<div class="dbc-cfg-row"><span class="dbc-cfg-lbl">🕐 Orario repack</span><span class="dbc-cfg-val">'+orarioVal+'</span></div>'
    +'<div style="padding-top:8px"><div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:6px">Giorni attivi</div>'
    +'<div class="dbc-days">'+daysHtml+'</div>'
    +'</div>'
    +'</div>'
    +'</div>'

    /* repack manuale */
    +'<div class="dbc-sec">'
    +'<button class="dbc-btn" data-sya="repack-now">🔄 Esegui Repack Ora</button>'
    +'</div>'

    +'</div>'/* /scroll */
    +'</div>';
}

/* ── mount ── */
function mount(card,hass,el){
  if(el._dbcBound) return; el._dbcBound=true;
  el.addEventListener('click',function(e){
    var sya=e.target.closest('[data-sya]'); if(!sya) return;
    var a=sya.dataset.sya;
    if(a==='toggle'){
      var eid=sya.dataset.eid;
      var h=H(),cur=h&&h.states&&h.states[eid]&&h.states[eid].state;
      callSvc('homeassistant',cur==='on'?'turn_off':'turn_on',{entity_id:eid});
      return;
    }
    if(a==='day-toggle'){
      var key=sya.dataset.key;
      var isOn=sya.dataset.on==='1';
      callSvc('homeassistant',isOn?'turn_off':'turn_on',{entity_id:'input_boolean.'+key});
      return;
    }
    if(a==='repack-now'){
      callSvc('script','turn_on',{entity_id:'script.frarik_db_repack'});
      return;
    }
  });
}

/* ── update ── */
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
  if(sig===el._dbcSig) return;
  el._dbcSig=sig;
  el.innerHTML=render(card);
  el._dbcBound=false;
  mount(card,hass,el);
}

/* ── registrazione card Frarik ── */
if(window.frarikCards) window.frarikCards['database-card']={render:render,mount:mount,update:update};

})();
