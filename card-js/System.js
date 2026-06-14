/* frarik-version: 4.8 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_systemcard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function Attr(h, id, attr) { const s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes[attr] != null) ? s.attributes[attr] : null; }
  function num(v) { const x = parseFloat(String(v || '').replace(',', '.')); return isNaN(x) ? null : x; }
  function has(h, id) { return !!(h && h.states && h.states[id]); }
  function unit(h, id) { const s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes.unit_of_measurement) || ''; }
  function isOn(h, id) { return !!(h && h.states && h.states[id] && h.states[id].state === 'on'); }
  function callSvc(domain, service, data) { try { const h = H(); if (h && h.callService) h.callService(domain, service, data || {}); } catch (e) {} }
  async function callApi(method, path) { try { const h = H(); if (h && h.callApi) return await h.callApi(method, path); } catch (e) {} return null; }

  function autodetect(h) {
    const f = function() { const a = Array.prototype.slice.call(arguments); return a.find(function(id) { return has(h, id); }) || ''; };
    return {
      cpu:     f('sensor.processor_use', 'sensor.cpu_usage'),
      ram:     f('sensor.memory_use_percent', 'sensor.system_monitor_memory_use_percent'),
      disk:    f('sensor.disk_use_percent', 'sensor.disk_use_percent_root', 'sensor.system_monitor_disk_use_percent_root'),
      temp:    f('sensor.processor_temperature', 'sensor.system_monitor_processor_temperature', 'sensor.cpu_temperatura'),
      boot:    f('sensor.last_boot', 'sensor.system_monitor_last_boot'),
      swap:    f('sensor.swap_use_percent', 'sensor.system_monitor_swap_use_percent'),
      load1:   f('sensor.load_1m', 'sensor.load_1_m', 'sensor.system_monitor_load_1m'),
      load5:   f('sensor.load_5m', 'sensor.load_5_m', 'sensor.system_monitor_load_5m'),
      load15:  f('sensor.load_15m', 'sensor.load_15_m', 'sensor.system_monitor_load_15m'),
      netin:   f('sensor.network_throughput_in_enp2s0', 'sensor.network_throughput_in', 'sensor.network_in'),
      netout:  f('sensor.network_throughput_out_enp2s0', 'sensor.network_throughput_out', 'sensor.network_out'),
      ip:      f('sensor.ipv4_address_enp2s0', 'sensor.ipv4_address', 'sensor.local_ip'),
      memuse:  f('sensor.memory_use', 'sensor.system_monitor_memory_use'),
      memfree: f('sensor.memory_free', 'sensor.system_monitor_memory_free'),
      diskuse: f('sensor.disk_use', 'sensor.system_monitor_disk_use'),
      diskfree:f('sensor.disk_free', 'sensor.system_monitor_disk_free'),
      swapuse: f('sensor.swap_use', 'sensor.system_monitor_swap_use'),
      diskr:   f('sensor.disk_read_throughput', 'sensor.disk_read', 'sensor.system_monitor_disk_read'),
      diskw:   f('sensor.disk_write_throughput', 'sensor.disk_write', 'sensor.system_monitor_disk_write'),
    };
  }

  function pkDefaults() {
    return {
      pk_power:     'sensor.sensore_potenza_server_w',
      pk_en_oggi:   'sensor.energia_oggi_server',
      pk_en_mese:   'sensor.energia_mese_server',
      pk_en_anno:   'sensor.energia_anno_server',
      pk_co_oggi:   'sensor.costo_consumo_giornaliero_server',
      pk_co_ieri:   'sensor.costo_consumo_ieri_server',
      pk_co_mese:   'sensor.costo_consumo_mensile_server',
      pk_co_mese_p: 'sensor.costo_consumo_mese_precedente_server',
      pk_co_anno:   'sensor.costo_consumo_annuale_server',
      pk_co_anno_p: 'sensor.costo_consumo_anno_precedente_server',
      pk_ha_uptime: 'sensor.template_tempo_di_avvio_homeassistant',
      pk_srv_uptime:'sensor.tempo_avvio_server',
      pk_entita:    'sensor.conteggio_entita',
      pk_backup:    'sensor.ultimo_backup_google_drive',
      pk_ha_start:  'sensor.homeassistant_start',
      pk_core:      'sensor.update_core_card',
      pk_sup:       'sensor.update_supervisor_card',
      pk_addon:     'sensor.supervisor_update_addon_card',
      pk_hacs_card: 'sensor.hacs_store_card',
      pk_hacs:      'sensor.hacs',
      pk_cert:      '',
      pk_ventola:   'switch.presa_ventola_armadietto_sala',
      pk_ram_tot:   'sensor.ram_totale',
      pk_disk_tot:  'sensor.disk_total',
    };
  }

  function cfgFor(card) {
    const c = load(card), a = autodetect(H()), pk = pkDefaults(), r = {};
    Object.keys(a).forEach(function(k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : a[k]; });
    Object.keys(pk).forEach(function(k) { r[k] = (c[k] !== undefined && c[k] !== '') ? c[k] : pk[k]; });
    return r;
  }

  function usageColor(p) { return (p||0)>=90?'#ef4444':(p||0)>=75?'#f97316':(p||0)>=50?'#fbbf24':'#22c55e'; }
  function tempColor(t) { return t==null?'#94a3b8':t>=85?'#ef4444':t>=70?'#f97316':t>=55?'#fbbf24':'#22c55e'; }
  function loadColor(v) { return (v||0)>=4?'#ef4444':(v||0)>=2?'#f97316':(v||0)>=1?'#fbbf24':'#22c55e'; }
  function healthScore(cpu,ram,load1,temp,swap) { return Math.max(cpu||0,ram||0,Math.min(100,((load1||0)/4)*100),temp!=null?Math.min(100,(temp/100)*100):0,swap||0); }
  function healthColor(s) { return s>=85?'#ef4444':s>=70?'#f97316':s>=50?'#fbbf24':'#22c55e'; }
  function statusBadges(cpu,ram,temp,load,swap) {
    const b=[];
    if((load||0)>=4) b.push(['⚠ Sovraccarico','#ef4444']);
    else if((cpu||0)>=85) b.push(['↑ CPU alta','#f97316']);
    if((temp||0)>=80) b.push(['🔥 Surriscaldamento','#ef4444']);
    else if((temp||0)>=70) b.push(['🌡 Caldo','#f97316']);
    if((ram||0)>=90) b.push(['⚠ RAM piena','#ef4444']);
    else if((ram||0)>=80) b.push(['↑ RAM alta','#fbbf24']);
    if((swap||0)>=80) b.push(['↑ Swap alta','#fbbf24']);
    if(!b.length) b.push(['✓ Sistema OK','#22c55e']);
    return b;
  }

  function fmtGB(v) { if(v==null) return ''; if(v<1) return (v*1024).toFixed(0)+'MB'; return v.toFixed(1)+'GB'; }
  function fmtNet(v) { if(v==null) return '—'; if(v<0.001) return (v*1024*1024).toFixed(0)+' B/s'; if(v<1) return (v*1024).toFixed(1)+' KB/s'; return v.toFixed(2)+' MB/s'; }
  function fmtIO(v,u) { if(v==null) return '—'; const un=(u||'').toLowerCase(); if(un.includes('kb')) return v.toFixed(1)+' KB/s'; if(un.includes('mb')) return v.toFixed(2)+' MB/s'; if(v<1) return (v*1024).toFixed(0)+' KB/s'; return v.toFixed(2)+' MB/s'; }
  function fmtEur(v) { if(v==null||v==='') return '—'; const n=parseFloat(v); return isNaN(n)?'—':n.toFixed(2)+' €'; }
  function fmtKwh(v) { if(v==null||v==='') return '—'; const n=parseFloat(v); return isNaN(n)?'—':n.toFixed(3)+' kWh'; }
  function uptimeText(h,id) { if(!id) return '—'; const sv=S(h,id); if(!sv) return '—'; const t=new Date(sv).getTime(); if(isNaN(t)) return sv; let sec=Math.floor((Date.now()-t)/1000); if(sec<0) sec=0; const d=Math.floor(sec/86400); sec-=d*86400; const hh=Math.floor(sec/3600),mm=Math.floor((sec%3600)/60); return (d?d+'g ':'')+hh+'h '+mm+'m'; }
  function updatesCount(h) { let n=0; const st=(h&&h.states)||{}; for(const id in st) { if(id.startsWith('update.')&&st[id].state==='on') n++; } return n; }
  function pushBuf(el,key,val,max) { el._sycBuf=el._sycBuf||{}; el._sycBuf[key]=el._sycBuf[key]||[]; if(val!=null) el._sycBuf[key].push(val); if(el._sycBuf[key].length>(max||40)) el._sycBuf[key].shift(); }

  function togBtn(id,label,on) {
    return '<button data-sya="toggle" data-eid="'+id+'" style="padding:4px 10px;border-radius:99px;border:1px solid '+(on?'rgba(34,197,94,.5)':'rgba(255,255,255,.15)')+';background:'+(on?'rgba(34,197,94,.12)':'rgba(255,255,255,.05)')+';color:'+(on?'#86efac':'rgba(255,255,255,.4)')+';font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .2s">'+label+'</button>';
  }
  function updBadge(label,isOk) {
    const col=isOk?'#22c55e':'#f97316';
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 6px;border-radius:8px;background:'+col+'12;border:1px solid '+col+'30;flex:1;min-width:44px"><div style="font-size:8px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.05em">'+label+'</div><div style="font-size:11px;font-weight:900;color:'+col+'">'+(isOk?'✓':'!')+'</div></div>';
  }

  /* SVG */
  function ekgSVG(data,w,h,col,gid) {
    if(!data||data.length<2) return '<svg width="'+w+'" height="'+h+'"></svg>';
    const mx=Math.max(1,...data);
    const pts=data.map(function(v,i){ return (i/(data.length-1)*w).toFixed(1)+','+(h-2-(v/mx)*(h-4)).toFixed(1); });
    const lx=pts[pts.length-1].split(',')[0],ly=pts[pts.length-1].split(',')[1];
    const grid=[.25,.5,.75].map(function(p){ return '<line x1="0" y1="'+(h*p).toFixed(1)+'" x2="'+w+'" y2="'+(h*p).toFixed(1)+'" stroke="rgba(255,255,255,.04)" stroke-width="1"/>'; }).join('');
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="display:block;overflow:visible">'+grid+'<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+col+'" stop-opacity=".35"/><stop offset="100%" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs><polygon points="'+pts.join(' ')+' '+w+','+h+' 0,'+h+'" fill="url(#'+gid+')"/><polyline points="'+pts.join(' ')+'" fill="none" stroke="'+col+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+lx+'" cy="'+ly+'" r="6" fill="'+col+'" opacity=".18"/><circle cx="'+lx+'" cy="'+ly+'" r="3" fill="'+col+'" style="filter:drop-shadow(0 0 5px '+col+')"/></svg>';
  }
  function dualNetSVG(dI,dO,w,h,gI,gO) {
    const all=[...(dI||[]),...(dO||[])]; if(all.length<2) return '<svg width="'+w+'" height="'+h+'"></svg>';
    const mx=Math.max(0.001,...all);
    function toPts(d){ return (d&&d.length>=2)?d.map(function(v,i){ return (i/(d.length-1)*w).toFixed(1)+','+(h-2-(v/mx)*(h-4)).toFixed(1); }).join(' '):''; }
    const pi=toPts(dI),po=toPts(dO);
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="display:block;overflow:hidden"><defs><linearGradient id="'+gI+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8" stop-opacity=".3"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/></linearGradient><linearGradient id="'+gO+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a78bfa" stop-opacity=".25"/><stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/></linearGradient></defs>'+(pi?'<polygon points="'+pi+' '+w+','+h+' 0,'+h+'" fill="url(#'+gI+')"/><polyline points="'+pi+'" fill="none" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>':'')+(po?'<polygon points="'+po+' '+w+','+h+' 0,'+h+'" fill="url(#'+gO+')"/><polyline points="'+po+'" fill="none" stroke="#a78bfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>':'')+'</svg>';
  }
  function miniSparkSVG(data,w,h,col,gid) {
    if(!data||data.length<2) return '<svg width="'+w+'" height="'+h+'"></svg>';
    const mx=Math.max(1,...data);
    const pts=data.map(function(v,i){ return (i/(data.length-1)*w).toFixed(1)+','+(h-1-(v/mx)*(h-2)).toFixed(1); }).join(' ');
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="display:block"><defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+col+'" stop-opacity=".4"/><stop offset="100%" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs><polygon points="'+pts+' '+w+','+h+' 0,'+h+'" fill="url(#'+gid+')"/><polyline points="'+pts+'" fill="none" stroke="'+col+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function histSVG(pts,minV,maxV,w,h,col,gid) {
    if(!pts||pts.length<2) return '<svg width="100%" height="'+h+'"><text x="50%" y="50%" text-anchor="middle" fill="rgba(255,255,255,.3)" font-size="11">Nessun dato</text></svg>';
    const range=(maxV-minV)||1;
    const coords=pts.map(function(v,i){ return ((i/(pts.length-1))*w).toFixed(1)+','+(h-4-((v-minV)/range)*(h-8)).toFixed(1); });
    return '<svg width="100%" height="'+h+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="display:block"><defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+col+'" stop-opacity=".4"/><stop offset="100%" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs><polygon points="'+coords.join(' ')+' '+w+','+h+' 0,'+h+'" fill="url(#'+gid+')"/><polyline points="'+coords.join(' ')+'" fill="none" stroke="'+col+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function ringHTML(key,pct,col,label,sz,sub) {
    const s=sz||72,r=+(s*.36).toFixed(1),cx=s/2,cy=s/2,circ=+(2*Math.PI*r).toFixed(2),p=Math.max(0,Math.min(100,pct||0)),dash=+((p/100)*circ).toFixed(2);
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><svg width="'+s+'" height="'+s+'" viewBox="0 0 '+s+' '+s+'" style="overflow:visible"><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="6"/><circle data-arc="'+key+'" cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="6" stroke-dasharray="'+dash+' '+circ+'" stroke-linecap="round" transform="rotate(-90 '+cx+' '+cy+')" style="transition:stroke-dasharray .9s ease-in-out,stroke .5s;filter:drop-shadow(0 0 7px '+col+'99)"/><text data-txt="'+key+'" x="'+cx+'" y="'+(cy+1)+'" text-anchor="middle" dominant-baseline="middle" fill="'+col+'" font-size="'+(s*.185).toFixed(0)+'px" font-weight="800" font-family="system-ui,sans-serif">'+(pct==null?'—':Math.round(pct)+'%')+'</text></svg><div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.45);letter-spacing:.06em;text-transform:uppercase">'+label+'</div><div data-sub="'+key+'" style="font-size:9px;font-weight:600;color:rgba(255,255,255,.3);height:12px;line-height:12px">'+(sub||'')+'</div></div>';
  }
  function updateRing(el,key,pct,col,sz) {
    const arc=el.querySelector('[data-arc="'+key+'"]'),txt=el.querySelector('[data-txt="'+key+'"]');
    if(!arc||!txt) return;
    const r=(sz||72)*.36,circ=+(2*Math.PI*r).toFixed(2),dash=+((Math.max(0,Math.min(100,pct||0))/100)*circ).toFixed(2);
    arc.setAttribute('stroke-dasharray',dash+' '+circ); arc.setAttribute('stroke',col);
    arc.style.filter='drop-shadow(0 0 7px '+col+'99)';
    txt.setAttribute('fill',col); txt.textContent=pct==null?'—':Math.round(pct)+'%';
  }

  /* ── RENDER ── */
  function render(card) {
    const h=H(), c=cfgFor(card), rid='syc'+(card.id||Math.random().toString(36).slice(2,8));
    const nm=load(card).name||'Mini-PC';
    const cpuV=num(S(h,c.cpu)), ramV=num(S(h,c.ram)), dskV=num(S(h,c.disk));
    const tmpV=num(S(h,c.temp)), swpV=num(S(h,c.swap));
    const l1=num(S(h,c.load1)), l5=num(S(h,c.load5)), l15=num(S(h,c.load15));
    const niV=num(S(h,c.netin)), noV=num(S(h,c.netout));
    const drV=num(S(h,c.diskr)), dwV=num(S(h,c.diskw));
    const ip=S(h,c.ip), upd=updatesCount(h);
    const muV=num(S(h,c.memuse)), mfV=num(S(h,c.memfree));
    const duV=num(S(h,c.diskuse)), dfV=num(S(h,c.diskfree));
    const suV=num(S(h,c.swapuse));
    const tCol=tempColor(tmpV), cpuC=usageColor(cpuV), ramC='#a78bfa', dskC=usageColor(dskV), swpC=usageColor(swpV);
    const hs=healthScore(cpuV,ramV,l1,tmpV,swpV), hCol=healthColor(hs);
    const bdgs=statusBadges(cpuV,ramV,tmpV,l1,swpV);
    const ramTot=num(S(h,c.pk_ram_tot)), dskTot=num(S(h,c.pk_disk_tot));
    const ramSub=(muV!=null&&mfV!=null)?fmtGB(muV)+'/'+fmtGB(muV+mfV):ramTot!=null?fmtGB(ramTot):'';
    const dskSub=(duV!=null&&dfV!=null)?fmtGB(duV)+'/'+fmtGB(duV+dfV):dskTot!=null?fmtGB(dskTot):'';
    const swpSub=suV!=null?fmtGB(suV):'';
    const hotAnim=tmpV!=null&&tmpV>=70?('@keyframes '+rid+'p{0%,100%{text-shadow:0 0 10px '+tCol+'99}50%{text-shadow:0 0 30px '+tCol+'ee,0 0 55px '+tCol+'44}}'):'';

    const pwV=num(S(h,c.pk_power));
    const enOggi=S(h,c.pk_en_oggi), coOggi=S(h,c.pk_co_oggi), coMese=S(h,c.pk_co_mese);
    const haUptime=S(h,c.pk_ha_uptime), srvUptimeRaw=S(h,c.pk_srv_uptime);
    const entCount=S(h,c.pk_entita), lastBk=S(h,c.pk_backup), haStart=S(h,c.pk_ha_start);
    const coreOk=S(h,c.pk_core)==='Aggiornato', supOk=S(h,c.pk_sup)==='Aggiornato';
    const addonOk=S(h,c.pk_addon)==='Aggiornati', hacsOk=S(h,c.pk_hacs_card)==='Aggiornato';
    const hacsN=num(S(h,c.pk_hacs)), certS=c.pk_cert?S(h,c.pk_cert):null;
    const anyUpd=!coreOk||!supOk||!addonOk||!hacsOk;
    const alertOn=isOn(h,'input_boolean.on_off_alert_ha'), backupOn=isOn(h,'input_boolean.ha_backup');
    const reportOn=isOn(h,'input_boolean.ha_report'), riavHaOn=isOn(h,'input_boolean.on_off_riavvio_ha');
    const riavSrvOn=isOn(h,'input_boolean.on_off_riavvio_server'), ventolOn=isOn(h,'input_boolean.on_off_ventola_rack');
    const aggOn=isOn(h,'input_boolean.on_off_aggiornamenti_ha');
    const ventilaSwOn=c.pk_ventola?isOn(h,c.pk_ventola):false;

    function loadRow(lbl,v,k) {
      const p=Math.min(100,((v||0)/4)*100),col=loadColor(v);
      return '<div style="display:flex;align-items:center;gap:5px"><div style="width:28px;font-size:9px;font-weight:700;color:rgba(255,255,255,.4);flex-shrink:0">'+lbl+'</div><div style="flex:1;height:5px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden"><div data-bar="'+k+'" style="height:100%;width:'+p.toFixed(1)+'%;background:'+col+';border-radius:99px;transition:width .9s ease-in-out,background .5s"></div></div><div data-syv="'+k+'" style="width:30px;text-align:right;font-size:10px;font-weight:800;color:'+col+';flex-shrink:0">'+(v==null?'—':v.toFixed(2))+'</div></div>';
    }

    const css='<style>'
      +'@keyframes '+rid+'scan{0%{background-position:0% 0%}100%{background-position:200% 0%}}'
      +'@keyframes '+rid+'ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0}}'
      +hotAnim
      +'#'+rid+'{position:relative;width:100%;height:100%;min-height:320px;border-radius:18px;padding:13px 14px;box-sizing:border-box;font-family:system-ui,sans-serif;color:#e8ebf5;display:flex;flex-direction:column;gap:7px;overflow:hidden;background:linear-gradient(150deg,#0c1322 0%,#0a0f1c 60%,#0c1626 100%);border:1px solid rgba(99,102,241,.22);box-shadow:0 10px 40px rgba(0,0,0,.45);}'
      +'#'+rid+'::before{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(105deg,transparent 40%,rgba(99,102,241,.06) 50%,transparent 60%);background-size:200% 100%;animation:'+rid+'scan 7s linear infinite;}'
      +'#'+rid+' .syk-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0;position:relative;}'
      +'#'+rid+' .syk-dot::after{content:"";position:absolute;inset:-3px;border-radius:50%;background:#22c55e;animation:'+rid+'ping 2s ease-out infinite;}'
      +(hotAnim?'#'+rid+' .syk-hot{animation:'+rid+'p 1.8s ease-in-out infinite;}':'')
      +'#'+rid+' .syk-sp{flex:1;background:rgba(255,255,255,.03);border-radius:10px;padding:5px 8px;}'
      +'#'+rid+' .syk-spl{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;}'
      +'#'+rid+' [data-sya]{cursor:pointer;transition:filter .12s;}'
      +'#'+rid+' [data-sya]:hover{filter:brightness(1.15);}'
      +'#'+rid+' [data-sya]:active{transform:scale(.97);}'
      +'</style>';

    const header='<div style="display:flex;align-items:center;gap:7px;position:relative;z-index:1"><div class="syk-dot"></div><div style="flex:1;font-size:20px;font-weight:800;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+nm+'</div>'+(ip?'<div style="font-size:10px;font-weight:700;color:#38bdf8;background:rgba(56,189,248,.1);padding:3px 8px;border-radius:99px;border:1px solid rgba(56,189,248,.2);flex-shrink:0;font-family:monospace">'+ip+'</div>':'')+'</div>';
    const hbar='<div style="height:4px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden;position:relative;z-index:1"><div data-syv="hbar" style="height:100%;width:'+hs.toFixed(1)+'%;background:'+hCol+';border-radius:99px;transition:width 1.2s ease-in-out,background .6s;box-shadow:0 0 8px '+hCol+'88"></div></div>';
    const badgesRow='<div data-syv="badges" style="display:flex;gap:5px;flex-wrap:wrap;position:relative;z-index:1">'+bdgs.map(function(b){ return '<div style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:99px;background:'+b[1]+'18;border:1px solid '+b[1]+'44;color:'+b[1]+'">'+b[0]+'</div>'; }).join('')+'</div>';
    const rings='<div style="display:flex;justify-content:space-around;align-items:flex-start;position:relative;z-index:1">'+ringHTML('cpu',cpuV,cpuC,'CPU',70,'')+ringHTML('ram',ramV,ramC,'RAM',70,ramSub)+ringHTML('dsk',dskV,dskC,'Disco',70,dskSub)+ringHTML('swp',swpV,swpC,'Swap',70,swpSub)+'</div>';

    const tempSection='<div style="display:flex;align-items:stretch;gap:8px;position:relative;z-index:1">'
      +'<div data-sya="stat" data-eid="'+(c.temp||'')+'" data-lbl="Temperatura CPU" style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border-radius:12px;padding:7px 12px;flex-shrink:0;min-width:72px;gap:3px">'
      +'<div data-syv="temp" class="'+(tmpV!=null&&tmpV>=70?'syk-hot':'')+'" style="font-size:25px;font-weight:800;line-height:1;color:'+tCol+'">'+(tmpV==null?'—':tmpV.toFixed(1)+'°')+'</div>'
      +'<div style="width:100%;height:3px;border-radius:99px;background:linear-gradient(90deg,#22c55e 0%,#fbbf24 50%,#ef4444 100%);opacity:.7;position:relative;margin:2px 0"><div data-syv="tbar" style="position:absolute;top:-2px;left:'+Math.min(99,(tmpV||0)).toFixed(0)+'%;width:7px;height:7px;border-radius:50%;background:#fff;transform:translateX(-50%);box-shadow:0 0 6px rgba(255,255,255,.8);transition:left .9s ease-in-out"></div></div>'
      +'<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em">Temp CPU</div>'
      +'<div data-syv="temp-sp" style="width:62px;height:18px"></div>'
      +'</div>'
      +'<div style="flex:1;background:rgba(255,255,255,.04);border-radius:12px;padding:7px 9px;display:flex;flex-direction:column;justify-content:center;gap:5px">'
      +'<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:1px">Carico sistema</div>'
      +loadRow('1m',l1,'l1')+loadRow('5m',l5,'l5')+loadRow('15m',l15,'l15')
      +'</div></div>';

    const sparklines='<div style="display:flex;gap:7px;position:relative;z-index:1"><div class="syk-sp"><div class="syk-spl" style="color:'+cpuC+'">▸ Processore</div><div data-syv="cpu-sp" style="height:46px"></div></div><div class="syk-sp"><div class="syk-spl" style="color:'+ramC+'">▸ RAM</div><div data-syv="ram-sp" style="height:46px"></div></div></div>';

    const netSection=(c.netin||c.netout)?('<div style="background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.15);border-radius:11px;padding:6px 10px;position:relative;z-index:1"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em">🌐 Rete</div><div style="display:flex;gap:10px"><div data-syv="ni" style="font-size:10px;font-weight:700;color:#38bdf8">↓ '+fmtNet(niV)+'</div><div data-syv="no" style="font-size:10px;font-weight:700;color:#a78bfa">↑ '+fmtNet(noV)+'</div></div></div><div data-syv="net-sp" style="height:32px"></div></div>'):'';

    const diskIOSection=(c.diskr||c.diskw)?('<div style="display:flex;align-items:center;gap:10px;padding:6px 10px;background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.15);border-radius:11px;position:relative;z-index:1"><div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;flex-shrink:0">💾 I/O Disco</div><div style="flex:1;display:flex;gap:12px;justify-content:flex-end">'+(c.diskr?'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:1px"><div style="font-size:9px;color:rgba(255,255,255,.4)">Lettura</div><div data-syv="dr" style="font-size:11px;font-weight:700;color:#fbbf24">'+fmtIO(drV,unit(h,c.diskr))+'</div></div>':'')+(c.diskw?'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:1px"><div style="font-size:9px;color:rgba(255,255,255,.4)">Scrittura</div><div data-syv="dw" style="font-size:11px;font-weight:700;color:#f97316">'+fmtIO(dwV,unit(h,c.diskw))+'</div></div>':'')+'</div></div>'):'';

    const energiaSection='<div data-sya="popup-energia" style="background:rgba(249,115,22,.07);border:1px solid rgba(249,115,22,.2);border-radius:11px;padding:7px 10px;position:relative;z-index:1"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px"><div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em">⚡ Energia</div><div style="font-size:9px;color:rgba(255,255,255,.25)">dettagli ›</div></div><div style="display:flex;gap:6px;flex-wrap:wrap"><div style="display:flex;flex-direction:column;gap:1px;flex:1;min-width:54px"><div style="font-size:8px;color:rgba(255,255,255,.4)">Potenza</div><div data-syv="pw" style="font-size:14px;font-weight:800;color:#fb923c">'+(pwV==null?'—':pwV.toFixed(0)+' W')+'</div></div><div style="display:flex;flex-direction:column;gap:1px;flex:1;min-width:54px"><div style="font-size:8px;color:rgba(255,255,255,.4)">Oggi kWh</div><div data-syv="en-oggi" style="font-size:11px;font-weight:800;color:#fdba74">'+fmtKwh(enOggi)+'</div></div><div style="display:flex;flex-direction:column;gap:1px;flex:1;min-width:54px"><div style="font-size:8px;color:rgba(255,255,255,.4)">Costo oggi</div><div data-syv="co-oggi" style="font-size:11px;font-weight:800;color:#fbbf24">'+fmtEur(coOggi)+'</div></div><div style="display:flex;flex-direction:column;gap:1px;flex:1;min-width:54px"><div style="font-size:8px;color:rgba(255,255,255,.4)">Mese</div><div data-syv="co-mese" style="font-size:11px;font-weight:800;color:#fbbf24">'+fmtEur(coMese)+'</div></div></div></div>';

    const haInfoSection='<div style="display:flex;flex-direction:column;gap:5px;position:relative;z-index:1">'
      +'<div style="display:flex;gap:6px">'
      +'<div data-sya="stat" data-eid="'+(c.pk_ha_uptime||'')+'" data-lbl="Uptime HA" style="flex:1;background:rgba(167,139,250,.07);border:1px solid rgba(167,139,250,.15);border-radius:10px;padding:6px 9px"><div style="font-size:8px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">HA attivo da</div><div data-syv="ha-uptime" style="font-size:11px;font-weight:800;color:#a78bfa">'+(haUptime||'—')+'</div></div>'
      +'<div data-sya="stat" data-eid="'+(c.pk_srv_uptime||'')+'" data-lbl="Uptime Server" style="flex:1;background:rgba(99,102,241,.07);border:1px solid rgba(99,102,241,.15);border-radius:10px;padding:6px 9px"><div style="font-size:8px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Server attivo da</div><div data-syv="srv-uptime" style="font-size:11px;font-weight:800;color:#818cf8">'+(srvUptimeRaw?uptimeText(h,c.pk_srv_uptime):'—')+'</div></div>'
      +'<div data-sya="popup-entita" style="flex:1;background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.15);border-radius:10px;padding:6px 9px;cursor:pointer"><div style="font-size:8px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Entità ›</div><div data-syv="ent-count" style="font-size:11px;font-weight:800;color:#38bdf8">'+(entCount||'—')+'</div></div>'
      +'<div style="flex:1.4;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:10px;padding:6px 9px"><div style="font-size:8px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Ultimo backup</div><div data-syv="last-bk" style="font-size:9px;font-weight:700;color:#86efac;line-height:1.3">'+(lastBk||'—')+'</div></div>'
      +'</div>'
      +(haStart?'<div style="font-size:9px;color:rgba(255,255,255,.3);padding:3px 8px;background:rgba(255,255,255,.03);border-radius:6px;font-family:monospace">⏱ Avvio HA: <span data-syv="ha-start">'+haStart+'</span></div>':'')
      +'</div>';

    const certCol=certS==null?'rgba(255,255,255,.3)':(certS.toLowerCase().includes('scad')||certS==='off'?'#ef4444':'#22c55e');
    const aggSection='<div data-sya="popup-agg" style="background:'+(anyUpd?'rgba(249,115,22,.07)':'rgba(34,197,94,.05)')+';border:1px solid '+(anyUpd?'rgba(249,115,22,.2)':'rgba(34,197,94,.15)')+';border-radius:11px;padding:7px 10px;position:relative;z-index:1"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px"><div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em">🔄 Aggiornamenti</div><div style="font-size:9px;color:rgba(255,255,255,.25)">dettagli ›</div></div><div style="display:flex;gap:5px;align-items:stretch"><div data-syv="agg-badges" style="display:flex;gap:4px;flex:1">'+updBadge('Core',coreOk)+updBadge('Supv',supOk)+updBadge('Addon',addonOk)+updBadge('HACS',hacsOk)+'</div>'+(hacsN!=null&&hacsN>0?'<div style="font-size:9px;font-weight:700;color:#f97316;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.2);border-radius:6px;padding:3px 7px;white-space:nowrap;display:flex;align-items:center">'+hacsN+' HACS</div>':'')+(c.pk_cert?'<div style="font-size:9px;font-weight:700;color:'+certCol+';background:'+certCol+'12;border:1px solid '+certCol+'30;border-radius:6px;padding:3px 7px;white-space:nowrap;display:flex;align-items:center">🔐 SSL</div>':'')+'</div></div>';

    const togglesSection='<div style="background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.18);border-radius:11px;padding:7px 10px;position:relative;z-index:1">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em">⚙ Automazioni</div><button data-sya="popup-notif" style="font-size:9px;color:rgba(255,255,255,.3);background:none;border:none;cursor:pointer;padding:0">configura ›</button></div>'
      +'<div data-syv="toggles-row" style="display:flex;gap:5px;flex-wrap:wrap">'
      +togBtn('input_boolean.on_off_alert_ha','Alert',alertOn)
      +togBtn('input_boolean.ha_backup','Backup',backupOn)
      +togBtn('input_boolean.ha_report','Report',reportOn)
      +togBtn('input_boolean.on_off_riavvio_ha','Riavvio HA',riavHaOn)
      +togBtn('input_boolean.on_off_riavvio_server','Riavvio Srv',riavSrvOn)
      +togBtn('input_boolean.on_off_ventola_rack','Ventola auto',ventolOn)
      +togBtn('input_boolean.on_off_aggiornamenti_ha','Update notif',aggOn)
      +(c.pk_ventola?togBtn(c.pk_ventola,'Ventola',ventilaSwOn):'')
      +'</div></div>';

    const footer='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;position:relative;z-index:1"><div data-syv="uptime" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)">⏱ '+uptimeText(h,c.boot)+'</div><div data-syv="updates" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:'+(upd?'rgba(34,197,94,.12)':'rgba(255,255,255,.06)')+';border:1px solid '+(upd?'rgba(34,197,94,.3)':'rgba(255,255,255,.1)')+';color:'+(upd?'#86efac':'rgba(255,255,255,.8)')+'">⬆ '+upd+' aggiorn.</div></div>';

    return css+'<div id="'+rid+'">'+header+hbar+badgesRow+rings+tempSection+sparklines+netSection+diskIOSection+energiaSection+haInfoSection+aggSection+togglesSection+footer+'</div>';
  }

  /* ── PATCH ── */
  function _patch(card,el) {
    const h=H(), c=cfgFor(card);
    const cpuV=num(S(h,c.cpu)), ramV=num(S(h,c.ram)), dskV=num(S(h,c.disk));
    const tmpV=num(S(h,c.temp)), swpV=num(S(h,c.swap));
    const l1=num(S(h,c.load1)), l5=num(S(h,c.load5)), l15=num(S(h,c.load15));
    const niV=num(S(h,c.netin)), noV=num(S(h,c.netout));
    const drV=num(S(h,c.diskr)), dwV=num(S(h,c.diskw));
    const upd=updatesCount(h);
    const muV=num(S(h,c.memuse)), mfV=num(S(h,c.memfree));
    const duV=num(S(h,c.diskuse)), dfV=num(S(h,c.diskfree));
    const suV=num(S(h,c.swapuse));
    const ramTot=num(S(h,c.pk_ram_tot)), dskTot=num(S(h,c.pk_disk_tot));
    const tCol=tempColor(tmpV), cpuC=usageColor(cpuV), ramC='#a78bfa', dskC=usageColor(dskV), swpC=usageColor(swpV);
    const hs=healthScore(cpuV,ramV,l1,tmpV,swpV), hCol=healthColor(hs);
    const pwV=num(S(h,c.pk_power));
    const enOggi=S(h,c.pk_en_oggi), coOggi=S(h,c.pk_co_oggi), coMese=S(h,c.pk_co_mese);
    const haUptime=S(h,c.pk_ha_uptime), entCount=S(h,c.pk_entita);
    const lastBk=S(h,c.pk_backup), haStart=S(h,c.pk_ha_start);
    const coreOk=S(h,c.pk_core)==='Aggiornato', supOk=S(h,c.pk_sup)==='Aggiornato';
    const addonOk=S(h,c.pk_addon)==='Aggiornati', hacsOk=S(h,c.pk_hacs_card)==='Aggiornato';

    pushBuf(el,'cpu',cpuV); pushBuf(el,'ram',ramV); pushBuf(el,'net',niV); pushBuf(el,'netout',noV); pushBuf(el,'temp',tmpV,30);

    function sv(k,t) { const e=el.querySelector('[data-syv="'+k+'"]'); if(e) e.textContent=t==null?'—':t; }
    const hb=el.querySelector('[data-syv="hbar"]');
    if(hb){ hb.style.width=hs.toFixed(1)+'%'; hb.style.background=hCol; hb.style.boxShadow='0 0 8px '+hCol+'88'; }
    const bdgRow=el.querySelector('[data-syv="badges"]');
    if(bdgRow){ const bdgs=statusBadges(cpuV,ramV,tmpV,l1,swpV); bdgRow.innerHTML=bdgs.map(function(b){ return '<div style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:99px;background:'+b[1]+'18;border:1px solid '+b[1]+'44;color:'+b[1]+'">'+b[0]+'</div>'; }).join(''); }
    updateRing(el,'cpu',cpuV,cpuC,70); updateRing(el,'ram',ramV,ramC,70); updateRing(el,'dsk',dskV,dskC,70); updateRing(el,'swp',swpV,swpC,70);
    function setSub(k,t) { const e=el.querySelector('[data-sub="'+k+'"]'); if(e) e.textContent=t; }
    setSub('ram',(muV!=null&&mfV!=null)?fmtGB(muV)+'/'+fmtGB(muV+mfV):ramTot!=null?fmtGB(ramTot):'');
    setSub('dsk',(duV!=null&&dfV!=null)?fmtGB(duV)+'/'+fmtGB(duV+dfV):dskTot!=null?fmtGB(dskTot):'');
    setSub('swp',suV!=null?fmtGB(suV):'');
    const te=el.querySelector('[data-syv="temp"]');
    if(te){ te.textContent=tmpV==null?'—':tmpV.toFixed(1)+'°'; te.style.color=tCol; te.className=tmpV!=null&&tmpV>=70?'syk-hot':''; }
    const tb=el.querySelector('[data-syv="tbar"]'); if(tb) tb.style.left=Math.min(99,(tmpV||0)).toFixed(0)+'%';
    [[l1,'l1'],[l5,'l5'],[l15,'l15']].forEach(function(x) {
      const v=x[0],k=x[1],col=loadColor(v);
      const txt=el.querySelector('[data-syv="'+k+'"]'),bar=el.querySelector('[data-bar="'+k+'"]');
      if(txt){ txt.textContent=v==null?'—':v.toFixed(2); txt.style.color=col; }
      if(bar){ bar.style.width=Math.min(100,((v||0)/4)*100).toFixed(1)+'%'; bar.style.background=col; }
    });
    const niEl=el.querySelector('[data-syv="ni"]'); if(niEl) niEl.textContent='↓ '+fmtNet(niV);
    const noEl=el.querySelector('[data-syv="no"]'); if(noEl) noEl.textContent='↑ '+fmtNet(noV);
    const drEl=el.querySelector('[data-syv="dr"]'); if(drEl) drEl.textContent=fmtIO(drV,unit(h,c.diskr));
    const dwEl=el.querySelector('[data-syv="dw"]'); if(dwEl) dwEl.textContent=fmtIO(dwV,unit(h,c.diskw));
    const ue=el.querySelector('[data-syv="uptime"]'); if(ue) ue.textContent='⏱ '+uptimeText(h,c.boot);
    const ude=el.querySelector('[data-syv="updates"]');
    if(ude){ ude.textContent='⬆ '+upd+' aggiorn.'; ude.style.background=upd?'rgba(34,197,94,.12)':'rgba(255,255,255,.06)'; ude.style.borderColor=upd?'rgba(34,197,94,.3)':'rgba(255,255,255,.1)'; ude.style.color=upd?'#86efac':'rgba(255,255,255,.8)'; }
    const rid=((el.querySelector('[id^="syc"]')||{}).id)||'sycx';
    const cpuSpEl=el.querySelector('[data-syv="cpu-sp"]'); if(cpuSpEl) cpuSpEl.innerHTML=ekgSVG(el._sycBuf&&el._sycBuf.cpu||[],cpuSpEl.offsetWidth||100,46,cpuC,rid+'gc');
    const ramSpEl=el.querySelector('[data-syv="ram-sp"]'); if(ramSpEl) ramSpEl.innerHTML=ekgSVG(el._sycBuf&&el._sycBuf.ram||[],ramSpEl.offsetWidth||100,46,ramC,rid+'gr');
    const tmpSpEl=el.querySelector('[data-syv="temp-sp"]'); if(tmpSpEl) tmpSpEl.innerHTML=miniSparkSVG(el._sycBuf&&el._sycBuf.temp||[],62,18,tCol,rid+'gt');
    const netSpEl=el.querySelector('[data-syv="net-sp"]'); if(netSpEl) netSpEl.innerHTML=dualNetSVG(el._sycBuf&&el._sycBuf.net||[],el._sycBuf&&el._sycBuf.netout||[],netSpEl.offsetWidth||200,32,rid+'ni',rid+'no');
    sv('pw',pwV==null?'—':pwV.toFixed(0)+' W');
    sv('en-oggi',fmtKwh(enOggi)); sv('co-oggi',fmtEur(coOggi)); sv('co-mese',fmtEur(coMese));
    sv('ha-uptime',haUptime||'—'); sv('srv-uptime',uptimeText(h,c.pk_srv_uptime));
    sv('ent-count',entCount||'—'); sv('last-bk',lastBk||'—'); sv('ha-start',haStart||'—');
    const aggBadges=el.querySelector('[data-syv="agg-badges"]');
    if(aggBadges) aggBadges.innerHTML=updBadge('Core',coreOk)+updBadge('Supv',supOk)+updBadge('Addon',addonOk)+updBadge('HACS',hacsOk);
    const togRow=el.querySelector('[data-syv="toggles-row"]');
    if(togRow){
      togRow.innerHTML=togBtn('input_boolean.on_off_alert_ha','Alert',isOn(h,'input_boolean.on_off_alert_ha'))
        +togBtn('input_boolean.ha_backup','Backup',isOn(h,'input_boolean.ha_backup'))
        +togBtn('input_boolean.ha_report','Report',isOn(h,'input_boolean.ha_report'))
        +togBtn('input_boolean.on_off_riavvio_ha','Riavvio HA',isOn(h,'input_boolean.on_off_riavvio_ha'))
        +togBtn('input_boolean.on_off_riavvio_server','Riavvio Srv',isOn(h,'input_boolean.on_off_riavvio_server'))
        +togBtn('input_boolean.on_off_ventola_rack','Ventola auto',isOn(h,'input_boolean.on_off_ventola_rack'))
        +togBtn('input_boolean.on_off_aggiornamenti_ha','Update notif',isOn(h,'input_boolean.on_off_aggiornamenti_ha'))
        +(c.pk_ventola?togBtn(c.pk_ventola,'Ventola',isOn(h,c.pk_ventola)):'');
    }
  }

  /* ── POPUP HELPERS ── */
  function mkOv(html,closeId) {
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML=html;
    document.body.appendChild(ov);
    const close=function(){ try{ document.body.removeChild(ov); }catch(e){} };
    const btn=ov.querySelector('#'+closeId); if(btn) btn.addEventListener('click',close);
    ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
    ov._close=close;
    return ov;
  }
  const POP_CSS='<style>@keyframes syUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.sypc{overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none}.sypc::-webkit-scrollbar{display:none}</style>';
  function popShell(icon,rgb,title,sub,closeId,content) {
    return POP_CSS+'<div style="width:100%;max-height:76vh;display:flex;flex-direction:column;background:#080b14;border:1px solid rgba('+rgb+',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:syUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
        +'<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba('+rgb+',.15);border:1px solid rgba('+rgb+',.3)">'+icon+'</div>'
        +'<div><div style="font-size:14px;font-weight:800;color:#fff">'+title+'</div><div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:1px">'+sub+'</div></div>'
        +'<button id="'+closeId+'" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:rgba(255,255,255,.5);background:rgba(255,255,255,.07);border:none">✕</button>'
      +'</div>'
      +'<div class="sypc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">'+content+'</div>'
      +'</div>';
  }

  /* ── ENERGIA POPUP ── */
  function openEnergiaPopup(c) {
    const h=H();
    function row(lbl,val,col){ return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span style="font-size:12px;color:rgba(255,255,255,.5)">'+lbl+'</span><span style="font-size:13px;font-weight:800;color:'+(col||'#fbbf24')+'">'+val+'</span></div>'; }
    const pwV=num(S(h,c.pk_power));
    const enIeri=Attr(h,c.pk_en_oggi,'last_period');
    const enMeseP=Attr(h,c.pk_en_mese,'last_period');
    const enAnnoP=Attr(h,c.pk_en_anno,'last_period');
    const content='<div style="background:rgba(249,115,22,.1);border-radius:12px;padding:12px 14px;text-align:center;margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Potenza Attuale</div><div style="font-size:28px;font-weight:900;color:#fb923c">'+(pwV==null?'—':pwV.toFixed(0)+' W')+'</div></div>'
      +'<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Energia</div>'
      +row('Oggi',fmtKwh(S(h,c.pk_en_oggi)),'#fdba74')
      +row('Ieri',fmtKwh(enIeri),'rgba(255,255,255,.4)')
      +row('Questo mese',fmtKwh(S(h,c.pk_en_mese)),'#fdba74')
      +row('Mese precedente',fmtKwh(enMeseP),'rgba(255,255,255,.4)')
      +row('Questo anno',fmtKwh(S(h,c.pk_en_anno)),'#fdba74')
      +row('Anno precedente',fmtKwh(enAnnoP),'rgba(255,255,255,.4)')
      +'<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.06em;margin:12px 0 4px">Costi (€)</div>'
      +row('Oggi',fmtEur(S(h,c.pk_co_oggi)),'#fbbf24')
      +row('Ieri',fmtEur(S(h,c.pk_co_ieri)),'rgba(255,255,255,.4)')
      +row('Questo mese',fmtEur(S(h,c.pk_co_mese)),'#fbbf24')
      +row('Mese precedente',fmtEur(S(h,c.pk_co_mese_p)),'rgba(255,255,255,.4)')
      +row('Questo anno',fmtEur(S(h,c.pk_co_anno)),'#fbbf24')
      +row('Anno precedente',fmtEur(S(h,c.pk_co_anno_p)),'rgba(255,255,255,.4)');
    mkOv(popShell('⚡','249,115,22','Energia & Costi','Consumo server','en-close',content),'en-close');
  }

  /* ── AGGIORNAMENTI POPUP ── */
  function openAggPopup(c) {
    const h=H();
    function badge(lbl,isOk,text){ const col=isOk?'#22c55e':'#f97316'; return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:10px;background:'+col+'10;border:1px solid '+col+'25;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:#fff">'+lbl+'</span><span style="font-size:11px;font-weight:800;color:'+col+'">'+(isOk?'✓ Aggiornato':'! '+(text||'Da aggiornare'))+'</span></div>'; }
    const coreS=S(h,c.pk_core),supS=S(h,c.pk_sup),addonS=S(h,c.pk_addon),hacsS=S(h,c.pk_hacs_card);
    const hacsN=S(h,c.pk_hacs),certS=c.pk_cert?S(h,c.pk_cert):null;
    const content=badge('Core HA',coreS==='Aggiornato',coreS)+badge('Supervisor',supS==='Aggiornato',supS)+badge('Add-on',addonS==='Aggiornati',addonS)+badge('HACS',hacsS==='Aggiornato',hacsS)
      +(hacsN&&parseInt(hacsN)>0?'<div style="padding:8px 12px;border-radius:10px;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.2);font-size:11px;color:#fdba74;margin-bottom:6px">'+hacsN+' aggiornamenti HACS disponibili</div>':'')
      +(certS!=null?'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:10px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.2)"><span style="font-size:11px;color:rgba(255,255,255,.7)">🔐 Certificato SSL</span><span style="font-size:11px;font-weight:800;color:#38bdf8">'+certS+'</span></div>':'');
    mkOv(popShell('🔄','56,189,248','Aggiornamenti','Stato sistema HA','ag-close',content),'ag-close');
  }

  /* ── ENTITA POPUP ── */
  function openEntitaPopup(c) {
    const h=H();
    const attrs=(h&&c.pk_entita&&h.states[c.pk_entita]&&h.states[c.pk_entita].attributes)||{};
    const total=S(h,c.pk_entita);
    const keys=['sensor','automation','binary_sensor','switch','light','input_boolean','input_number','input_datetime','input_select','script','media_player','camera','cover','climate','device_tracker','group','scene','zone'];
    let rows='';
    keys.forEach(function(k){ if(attrs[k]!=null) rows+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span style="font-size:12px;color:rgba(255,255,255,.5)">'+k+'</span><span style="font-size:12px;font-weight:700;color:#38bdf8">'+attrs[k]+'</span></div>'; });
    const content='<div style="text-align:center;margin-bottom:10px"><div style="font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em">Totale entità</div><div style="font-size:32px;font-weight:900;color:#38bdf8">'+(total||'—')+'</div></div>'+rows;
    mkOv(popShell('📊','56,189,248','Entità Home Assistant','Distribuzione per dominio','ent-close',content),'ent-close');
  }

  /* ── STORIA POPUP ── */
  function openHistPopup(entityId,label) {
    if(!entityId) return;
    const content='<div id="sh-stats" style="display:flex;gap:8px;margin-bottom:10px"></div><div id="sh-chart" style="min-height:120px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3);font-size:12px">Caricamento dati…</div>';
    mkOv(popShell('📈','251,191,36',label,'Ultime 24 ore','sh-close',content),'sh-close');
    const now=new Date(),start=new Date(now-86400000);
    callApi('GET','history/period/'+start.toISOString()+'?filter_entity_id='+entityId+'&end_time='+now.toISOString()).then(function(data){
      const chartEl=document.getElementById('sh-chart'),statsEl=document.getElementById('sh-stats');
      if(!chartEl) return;
      try {
        const series=Array.isArray(data)&&data[0]?data[0]:[];
        const pts=series.map(function(s){ return parseFloat(s.state); }).filter(function(v){ return !isNaN(v); });
        if(!pts.length){ chartEl.textContent='Nessun dato disponibile'; return; }
        const minV=Math.min(...pts),maxV=Math.max(...pts),cur=pts[pts.length-1];
        if(statsEl){ function st(l,v,col){ return '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:10px;padding:8px 10px;text-align:center"><div style="font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">'+l+'</div><div style="font-size:14px;font-weight:800;color:'+col+'">'+v.toFixed(1)+'</div></div>'; } statsEl.innerHTML=st('Min',minV,'#38bdf8')+st('Attuale',cur,'#fbbf24')+st('Max',maxV,'#ef4444'); }
        chartEl.innerHTML=histSVG(pts,minV,maxV,400,120,'#fbbf24','shg'+Date.now());
      } catch(e){ chartEl.textContent='Errore'; }
    });
  }

  /* ── NOTIFICHE & AUTOMAZIONI POPUP (con tabs) ── */
  function openNotifPopup() {
    const h=H();
    const DAYS=[['L','lunedi'],['M','martedi'],['Me','mercoledi'],['G','giovedi'],['V','venerdi'],['S','sabato'],['D','domenica']];

    function togR(id,lbl){
      const on=isOn(h,id);
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        +'<span style="font-size:12px;color:rgba(255,255,255,.65)">'+lbl+'</span>'
        +'<button data-sya="ntog" data-eid="'+id+'" style="padding:3px 12px;border-radius:99px;border:1px solid '+(on?'rgba(34,197,94,.5)':'rgba(255,255,255,.2)')+';background:'+(on?'rgba(34,197,94,.15)':'rgba(255,255,255,.06)')+';color:'+(on?'#86efac':'rgba(255,255,255,.4)')+';font-size:10px;font-weight:700;cursor:pointer">'+(on?'ON':'OFF')+'</button>'
        +'</div>';
    }
    function alertRow(boolId,numId,lbl,un){
      const on=isOn(h,boolId); const v=S(h,numId);
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        +'<button data-sya="ntog" data-eid="'+boolId+'" style="padding:3px 10px;border-radius:99px;border:1px solid '+(on?'rgba(34,197,94,.5)':'rgba(255,255,255,.2)')+';background:'+(on?'rgba(34,197,94,.12)':'rgba(255,255,255,.06)')+';color:'+(on?'#86efac':'rgba(255,255,255,.4)')+';font-size:10px;font-weight:700;cursor:pointer">'+lbl+'</button>'
        +(numId?'<div style="display:flex;align-items:center;gap:4px"><span style="font-size:10px;color:rgba(255,255,255,.3)">soglia</span><input type="number" data-sya="set-num" data-eid="'+numId+'" value="'+(v||'')+'" min="0" max="100" step="1" style="width:54px;padding:3px 6px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fbbf24;font-size:12px;font-weight:700;text-align:center;outline:none"><span style="font-size:10px;color:rgba(255,255,255,.35);min-width:20px">'+un+'</span></div>':'')
        +'</div>';
    }
    function numR(id,lbl,mn,mx,un){
      const v=S(h,id);
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        +'<span style="font-size:12px;color:rgba(255,255,255,.6)">'+lbl+'</span>'
        +'<div style="display:flex;align-items:center;gap:5px"><input type="number" data-sya="set-num" data-eid="'+id+'" value="'+(v||'')+'" min="'+mn+'" max="'+mx+'" step="1" style="width:64px;padding:4px 7px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fbbf24;font-size:12px;font-weight:700;text-align:center;outline:none"><span style="font-size:11px;color:rgba(255,255,255,.4);min-width:24px">'+un+'</span></div>'
        +'</div>';
    }
    function timeR(id,lbl){
      const v=S(h,id); const tval=v?v.substring(0,5):'';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        +'<span style="font-size:12px;color:rgba(255,255,255,.6)">'+lbl+'</span>'
        +'<input type="time" data-sya="set-time" data-eid="'+id+'" value="'+tval+'" style="padding:4px 8px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#a78bfa;font-size:12px;font-weight:700;outline:none;cursor:pointer">'
        +'</div>';
    }
    function dayChips(prefix){
      return '<div style="display:flex;gap:5px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)">'
        +DAYS.map(function(d){
          const eid='input_boolean.'+prefix+'_'+d[1]; const on=isOn(h,eid);
          return '<button data-sya="ntog" data-eid="'+eid+'" data-daychip="1" style="padding:4px 8px;border-radius:8px;border:1px solid '+(on?'rgba(139,92,246,.6)':'rgba(255,255,255,.15)')+';background:'+(on?'rgba(139,92,246,.2)':'rgba(255,255,255,.05)')+';color:'+(on?'#c4b5fd':'rgba(255,255,255,.4)')+';font-size:11px;font-weight:700;cursor:pointer">'+d[0]+'</button>';
        }).join('')
        +'</div>';
    }
    function sec(t,col){ return '<div style="font-size:9px;font-weight:800;color:'+(col||'rgba(255,255,255,.3)')+';text-transform:uppercase;letter-spacing:.08em;padding:10px 0 4px">'+t+'</div>'; }

    const TABS=[{id:'notif',lbl:'🔔 Notifiche'},{id:'alert',lbl:'⚠ Alert'},{id:'backup',lbl:'💾 Backup'},{id:'report',lbl:'📊 Report'},{id:'riavvio',lbl:'🔄 Riavvio'},{id:'update',lbl:'⬆ Update'}];

    const tabBar='<div id="nt-tabs" style="display:flex;gap:4px;flex-wrap:wrap;padding:8px 15px 0;background:#080b14;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.07)">'
      +TABS.map(function(t,i){ return '<button data-tab="'+t.id+'" style="padding:5px 10px;border-radius:8px 8px 0 0;border:none;font-size:10px;font-weight:700;cursor:pointer;transition:all .15s;background:'+(i===0?'rgba(139,92,246,.2)':'rgba(255,255,255,.05)')+';color:'+(i===0?'#c4b5fd':'rgba(255,255,255,.4)')+';border-bottom:2px solid '+(i===0?'#a78bfa':'transparent')+'">'+t.lbl+'</button>'; }).join('')
      +'</div>';

    function tab(id,html){ return '<div data-tabcontent="'+id+'" style="display:'+(id==='notif'?'flex':'none')+';flex-direction:column">'+html+'</div>'; }

    const tabs=''
      +tab('notif',
        sec('Notifiche sistema','rgba(56,189,248,.7)')
        +togR('input_boolean.notifica_avvio_ha','Avvio HA')
        +togR('input_boolean.notifica_tempo_avvio_ha','Tempo avvio HA')
        +togR('input_boolean.notifica_login_errato','Login errato')
        +togR('input_boolean.notifica_certificato_scaduto','Certificato SSL scaduto')
      )
      +tab('alert',
        sec('Master alert','rgba(239,68,68,.7)')
        +togR('input_boolean.on_off_alert_ha','Alert HA attivo')
        +sec('Soglie (toggle + soglia modificabile)')
        +alertRow('input_boolean.alert_ram','input_number.utilizzo_ram','RAM','%')
        +alertRow('input_boolean.alert_temperatura','input_number.temperatura_server','Temperatura','°C')
        +alertRow('input_boolean.alert_cpu','input_number.utilizzo_cpu','CPU','%')
        +alertRow('input_boolean.alert_disco','input_number.utilizzo_disco','Disco','%')
        +alertRow('input_boolean.alert_db','','Database','')
        +sec('Ventola rack','rgba(139,92,246,.7)')
        +togR('input_boolean.on_off_ventola_rack','Automazione ventola rack')
        +numR('input_number.temperatura_rack_on','Accendi ventola sopra',0,100,'°C')
        +numR('input_number.temperatura_rack_off','Spegni ventola sotto',0,100,'°C')
      )
      +tab('backup',
        sec('Backup Home Assistant','rgba(34,197,94,.7)')
        +togR('input_boolean.ha_backup','Backup attivo')
        +timeR('input_datetime.orario_backup_homeassistant','Orario backup')
        +sec('Giorni')
        +dayChips('ha_backup')
      )
      +tab('report',
        sec('Report Home Assistant','rgba(251,191,36,.7)')
        +togR('input_boolean.ha_report','Report attivo')
        +timeR('input_datetime.orario_report_ha','Orario report')
        +sec('Giorni')
        +dayChips('ha_report')
      )
      +tab('riavvio',
        sec('Riavvio Home Assistant','rgba(99,102,241,.7)')
        +togR('input_boolean.on_off_riavvio_ha','Riavvio HA attivo')
        +timeR('input_datetime.orario_riavvio_homeassistant','Orario riavvio HA')
        +sec('Giorni')
        +dayChips('ha_riavvio')
        +sec('Riavvio Server','rgba(99,102,241,.7)')
        +togR('input_boolean.on_off_riavvio_server','Riavvio Server attivo')
        +timeR('input_datetime.orario_riavvio_server','Orario riavvio server')
        +sec('Giorni')
        +dayChips('server_riavvio')
      )
      +tab('update',
        sec('Aggiornamenti HA','rgba(249,115,22,.7)')
        +togR('input_boolean.on_off_aggiornamenti_ha','Notifiche update attive')
        +timeR('input_datetime.orario_notifiche_aggiornamenti_homeassistant','Orario notifica')
        +sec('Componenti')
        +togR('input_boolean.notifica_aggiornamenti_core','Core HA')
        +togR('input_boolean.notifica_aggiornamenti_supervisor','Supervisor')
        +togR('input_boolean.notifica_aggiornamenti_addon','Add-on')
        +togR('input_boolean.notifica_aggiornamenti_hacs','HACS')
        +sec('Giorni')
        +dayChips('ha_update')
      );

    const html=POP_CSS+'<div style="width:100%;max-height:84vh;display:flex;flex-direction:column;background:#080b14;border:1px solid rgba(139,92,246,.3);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);animation:syUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
        +'<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3)">🔔</div>'
        +'<div><div style="font-size:14px;font-weight:800;color:#fff">Notifiche & Automazioni</div><div style="font-size:11px;color:rgba(255,255,255,.4)">Configurazione completa pkg</div></div>'
        +'<button id="nf-close" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:rgba(255,255,255,.5);background:rgba(255,255,255,.07);border:none">✕</button>'
      +'</div>'
      +tabBar
      +'<div class="sypc" style="flex:1;overflow-y:auto;padding:0 15px 14px">'+tabs+'</div>'
      +'</div>';

    const ov=mkOv(html,'nf-close');

    ov.querySelectorAll('[data-tab]').forEach(function(btn){
      btn.addEventListener('click',function(){
        ov.querySelectorAll('[data-tab]').forEach(function(b){ b.style.background='rgba(255,255,255,.05)'; b.style.color='rgba(255,255,255,.4)'; b.style.borderBottom='2px solid transparent'; });
        btn.style.background='rgba(139,92,246,.2)'; btn.style.color='#c4b5fd'; btn.style.borderBottom='2px solid #a78bfa';
        ov.querySelectorAll('[data-tabcontent]').forEach(function(d){ d.style.display='none'; });
        const tc=ov.querySelector('[data-tabcontent="'+btn.dataset.tab+'"]'); if(tc) tc.style.display='flex';
      });
    });

    ov.addEventListener('click',function(e){
      const t=e.target.closest('[data-sya="ntog"]'); if(!t) return;
      const eid=t.dataset.eid, cur=isOn(H(),eid);
      callSvc('homeassistant',cur?'turn_off':'turn_on',{entity_id:eid});
      const nov=!cur;
      if(t.dataset.daychip){
        t.style.background=nov?'rgba(139,92,246,.2)':'rgba(255,255,255,.05)';
        t.style.borderColor=nov?'rgba(139,92,246,.6)':'rgba(255,255,255,.15)';
        t.style.color=nov?'#c4b5fd':'rgba(255,255,255,.4)';
      } else {
        t.textContent=nov?'ON':'OFF';
        t.style.background=nov?'rgba(34,197,94,.15)':'rgba(255,255,255,.06)';
        t.style.borderColor=nov?'rgba(34,197,94,.5)':'rgba(255,255,255,.2)';
        t.style.color=nov?'#86efac':'rgba(255,255,255,.4)';
      }
    });

    ov.addEventListener('change',function(e){
      const t=e.target;
      if(t.dataset.sya==='set-num'&&t.dataset.eid){
        const v=parseFloat(t.value);
        if(!isNaN(v)){ callSvc('input_number','set_value',{entity_id:t.dataset.eid,value:v}); t.style.borderColor='#22c55e'; setTimeout(function(){ t.style.borderColor='rgba(255,255,255,.2)'; },900); }
      }
      if(t.dataset.sya==='set-time'&&t.dataset.eid&&t.value){
        callSvc('input_datetime','set_datetime',{entity_id:t.dataset.eid,time:t.value+':00'});
        t.style.borderColor='#22c55e'; setTimeout(function(){ t.style.borderColor='rgba(255,255,255,.2)'; },900);
      }
    });
  }

  /* ── UPDATE / MOUNT ── */
  function update(card,hass,el) {
    if(!el.querySelector('[data-arc]')){ el.innerHTML=render(card); el._sycBound=false; mount(card,hass,el); return; }
    _patch(card,el);
  }
  function mount(card,hass,el) {
    if(el._sycBound) return; el._sycBound=true;
    setTimeout(function(){ _patch(card,el); },80);
    el.addEventListener('click',function(e){
      const togEl=e.target.closest('[data-sya="toggle"]');
      if(togEl){ const eid=togEl.dataset.eid; const h=H(),cur=h&&h.states&&h.states[eid]&&h.states[eid].state; callSvc('homeassistant',cur==='on'?'turn_off':'turn_on',{entity_id:eid}); return; }
      if(e.target.closest('[data-sya="popup-energia"]')){ openEnergiaPopup(cfgFor(card)); return; }
      if(e.target.closest('[data-sya="popup-agg"]')){ openAggPopup(cfgFor(card)); return; }
      if(e.target.closest('[data-sya="popup-notif"]')){ openNotifPopup(); return; }
      if(e.target.closest('[data-sya="popup-entita"]')){ openEntitaPopup(cfgFor(card)); return; }
      const statEl=e.target.closest('[data-sya="stat"]');
      if(statEl&&statEl.dataset.eid){ openHistPopup(statEl.dataset.eid,statEl.dataset.lbl||statEl.dataset.eid); return; }
    });
  }

  /* ── SETTINGS ── */
  function openCfg(card,el) {
    const h=H(), c=load(card);
    const states=(h&&h.states)||{};
    const allIds=Object.keys(states).sort();
    const stInp='width:100%;padding:9px 11px;border-radius:10px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop='position:absolute;left:0;right:0;top:100%;z-index:10;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 10px 10px;display:none';
    const stLbl='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stSec='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#6366f1;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(99,102,241,.2)';
    const stSecPk='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#f97316;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(249,115,22,.2)';
    const stBase='width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:13px;box-sizing:border-box';
    const cf=cfgFor(card);
    var _fll=JSON.parse(localStorage.getItem('_frk_layout_'+(card.id||''))||'{}');
    const cardScaleV=_fll.cardScale!=null?_fll.cardScale:(c.cardScale||100),cardWV=_fll.cardW!=null?_fll.cardW:(c.cardW||100);
    var _prevTimer=null;

    function field(fid,lbl2,val,hint){ return '<div style="margin-bottom:9px;position:relative"><label style="'+stLbl+'">'+lbl2+(hint?'<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">'+hint+'</span>':'')+'</label><input id="'+fid+'" type="text" value="'+(val||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="Clicca o scrivi…" style="'+stInp+'"><div id="'+fid+'-d" style="'+stDrop+'"></div></div>'; }

    const formHtml='<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome</label><input id="sy-name" type="text" value="'+(c.name||'').replace(/"/g,'&quot;')+'" placeholder="es. Mini PC, NAS…" style="'+stBase+'"></div>'
      +'<div style="'+stSec+'">Utilizzi %</div>'
      +field('sy-cpu','CPU (%)',cf.cpu,'sensor.processor_use')+field('sy-ram','RAM (%)',cf.ram,'sensor.memory_use_percent')
      +field('sy-disk','Disco (%)',cf.disk,'sensor.disk_use_percent')+field('sy-swap','Swap (%)',cf.swap,'sensor.swap_use_percent')
      +field('sy-temp','Temperatura CPU',cf.temp,'sensor.cpu_temperatura')
      +'<div style="'+stSec+'">Carico e avvio</div>'
      +field('sy-load1','Load 1m',cf.load1,'sensor.load_1m')+field('sy-load5','Load 5m',cf.load5,'sensor.load_5m')
      +field('sy-load15','Load 15m',cf.load15,'sensor.load_15m')+field('sy-boot','Last boot OS',cf.boot,'sensor.last_boot')
      +'<div style="'+stSec+'">Rete</div>'
      +field('sy-netin','Traffico in',cf.netin,'sensor.network_throughput_in_enp2s0')
      +field('sy-netout','Traffico out',cf.netout,'sensor.network_throughput_out_enp2s0')
      +field('sy-ip','IP locale',cf.ip,'sensor.ipv4_address_enp2s0')
      +'<div style="'+stSec+'">Valori assoluti</div>'
      +field('sy-memuse','RAM usata',cf.memuse,'sensor.memory_use')+field('sy-memfree','RAM libera',cf.memfree,'sensor.memory_free')
      +field('sy-diskuse','Disco usato',cf.diskuse,'sensor.disk_use')+field('sy-diskfree','Disco libero',cf.diskfree,'sensor.disk_free')
      +field('sy-swapuse','Swap usata',cf.swapuse,'sensor.swap_use')
      +field('sy-diskr','Lettura disco',cf.diskr,'sensor.disk_read_throughput')+field('sy-diskw','Scrittura disco',cf.diskw,'sensor.disk_write_throughput')
      +'<div style="'+stSecPk+'">⚡ PKG — Energia</div>'
      +field('sy-pk-power','Potenza (W)',cf.pk_power,'sensor.sensore_potenza_server_w')
      +field('sy-pk-en-oggi','Energia oggi kWh',cf.pk_en_oggi,'sensor.energia_oggi_server')
      +field('sy-pk-en-mese','Energia mese kWh',cf.pk_en_mese,'sensor.energia_mese_server')
      +field('sy-pk-en-anno','Energia anno kWh',cf.pk_en_anno,'sensor.energia_anno_server')
      +field('sy-pk-co-oggi','Costo oggi €',cf.pk_co_oggi,'sensor.costo_consumo_giornaliero_server')
      +field('sy-pk-co-ieri','Costo ieri €',cf.pk_co_ieri,'sensor.costo_consumo_ieri_server')
      +field('sy-pk-co-mese','Costo mese €',cf.pk_co_mese,'sensor.costo_consumo_mensile_server')
      +field('sy-pk-co-mese-p','Costo mese prec €',cf.pk_co_mese_p,'sensor.costo_consumo_mese_precedente_server')
      +field('sy-pk-co-anno','Costo anno €',cf.pk_co_anno,'sensor.costo_consumo_annuale_server')
      +field('sy-pk-co-anno-p','Costo anno prec €',cf.pk_co_anno_p,'sensor.costo_consumo_anno_precedente_server')
      +'<div style="'+stSecPk+'">🖥 PKG — Sistema HA</div>'
      +field('sy-pk-ha-uptime','Uptime HA',cf.pk_ha_uptime,'sensor.template_tempo_di_avvio_homeassistant')
      +field('sy-pk-srv-uptime','Uptime Server',cf.pk_srv_uptime,'sensor.tempo_avvio_server')
      +field('sy-pk-entita','Conteggio entità',cf.pk_entita,'sensor.conteggio_entita')
      +field('sy-pk-backup','Ultimo backup',cf.pk_backup,'sensor.ultimo_backup_google_drive')
      +field('sy-pk-ha-start','Log avvio HA',cf.pk_ha_start,'sensor.homeassistant_start')
      +field('sy-pk-ram-tot','RAM totale',cf.pk_ram_tot,'sensor.ram_totale')
      +field('sy-pk-disk-tot','Disco totale',cf.pk_disk_tot,'sensor.disk_total')
      +'<div style="'+stSecPk+'">🔄 PKG — Aggiornamenti</div>'
      +field('sy-pk-core','Stato Core HA',cf.pk_core,'sensor.update_core_card')
      +field('sy-pk-sup','Stato Supervisor',cf.pk_sup,'sensor.update_supervisor_card')
      +field('sy-pk-addon','Stato Add-on',cf.pk_addon,'sensor.supervisor_update_addon_card')
      +field('sy-pk-hacs-card','Stato HACS store',cf.pk_hacs_card,'sensor.hacs_store_card')
      +field('sy-pk-hacs','HACS count',cf.pk_hacs,'sensor.hacs')
      +field('sy-pk-cert','Certificato SSL',cf.pk_cert,'')
      +'<div style="'+stSecPk+'">🔌 PKG — Switch</div>'
      +field('sy-pk-ventola','Switch ventola fisica',cf.pk_ventola,'switch.presa_ventola_armadietto_sala')
      +'<div style="display:flex;gap:8px;margin-top:14px"><button id="sy-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button><button id="sy-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#fbbf24;color:#0a0816">Salva</button></div>';

    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML='<style>@keyframes sySlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@media(max-width:600px){.fcc{flex-direction:column!important}.fcf{width:100%!important;border-right:none!important;overflow-y:visible!important;flex-shrink:0!important}.fcp{min-width:0!important}}</style>'
      +'<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(139,92,246,.32);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:sySlideUp .22s cubic-bezier(.32,1.12,.56,1)">'
        +'<div style="display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
          +'<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);flex-shrink:0">🖥️</div>'
          +'<div><div style="font-size:14px;font-weight:800">Configura Mini-PC</div><div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:1px">'+card.id+'</div></div>'
          +'<button id="sy-hdr-close" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:rgba(255,255,255,.5);background:rgba(255,255,255,.07);border:none">✕</button>'
        +'</div>'
        +'<div class="fcc" style="display:flex;flex:1;overflow:hidden;min-height:0">'
          +'<div class="fcf" style="width:420px;flex-shrink:0;overflow-y:auto;padding:14px 16px;border-right:1px solid rgba(255,255,255,.07);scrollbar-width:none">'+formHtml+'</div>'
          +'<div class="fcp" style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:10px;padding:14px 16px;overflow-y:auto;background:rgba(0,0,0,.15);scrollbar-width:none">'
            +'<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.07em">Anteprima live</div>'
            +'<div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.08)"><div id="sy-prev-inner"></div></div>'
            +'<div style="padding-top:12px;border-top:1px solid rgba(255,255,255,.08)">'
              +'<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Dimensioni card</div>'
              +'<div style="display:flex;align-items:center;gap:8px;margin-top:8px"><span style="font-size:11px;font-weight:700;color:#fff;width:72px;flex-shrink:0">Altezza</span><input type="range" id="sy-cardscale" min="20" max="100" step="5" value="'+cardScaleV+'" style="flex:1;cursor:pointer;accent-color:#fbbf24;height:4px"><span id="sy-cardscale-lbl" style="font-size:12px;font-weight:800;color:#fbbf24;width:64px;text-align:right;flex-shrink:0">'+(cardScaleV>=100?'Auto (100%)':cardScaleV+'%')+'</span></div>'
              +'<div style="display:flex;align-items:center;gap:8px;margin-top:8px"><span style="font-size:11px;font-weight:700;color:#fff;width:72px;flex-shrink:0">Larghezza</span><input type="range" id="sy-cardw" min="20" max="100" step="5" value="'+cardWV+'" style="flex:1;cursor:pointer;accent-color:#fbbf24;height:4px"><span id="sy-cardw-lbl" style="font-size:12px;font-weight:800;color:#fbbf24;width:64px;text-align:right;flex-shrink:0">'+(cardWV>=100?'Auto (100%)':cardWV+'%')+'</span></div>'
            +'</div>'
          +'</div>'
        +'</div>'
      +'</div>';
    document.body.appendChild(ov);

    var allFieldIds=['sy-cpu','sy-ram','sy-disk','sy-swap','sy-temp','sy-load1','sy-load5','sy-load15','sy-boot','sy-netin','sy-netout','sy-ip','sy-memuse','sy-memfree','sy-diskuse','sy-diskfree','sy-swapuse','sy-diskr','sy-diskw','sy-pk-power','sy-pk-en-oggi','sy-pk-en-mese','sy-pk-en-anno','sy-pk-co-oggi','sy-pk-co-ieri','sy-pk-co-mese','sy-pk-co-mese-p','sy-pk-co-anno','sy-pk-co-anno-p','sy-pk-ha-uptime','sy-pk-srv-uptime','sy-pk-entita','sy-pk-backup','sy-pk-ha-start','sy-pk-ram-tot','sy-pk-disk-tot','sy-pk-core','sy-pk-sup','sy-pk-addon','sy-pk-hacs-card','sy-pk-hacs','sy-pk-cert','sy-pk-ventola'];

    function g(id){ var e=ov.querySelector('#'+id); return e?e.value.trim():''; }
    function updatePrev(){
      var prevEl=ov.querySelector('#sy-prev-inner'); if(!prevEl) return;
      var scV=parseInt((ov.querySelector('#sy-cardscale')||{}).value)||100;
      try {
        localStorage.setItem('frarik_systemcard___prev__',JSON.stringify({name:g('sy-name'),cpu:g('sy-cpu'),ram:g('sy-ram'),disk:g('sy-disk'),swap:g('sy-swap'),temp:g('sy-temp'),cardScale:100,cardW:100}));
        prevEl.innerHTML=render({id:'__prev__'}); prevEl.style.zoom=scV<100?scV+'%':'';
      } catch(e){}
    }
    function schedPrev(){ clearTimeout(_prevTimer); _prevTimer=setTimeout(updatePrev,180); }
    ov.querySelector('#sy-cardscale').addEventListener('input',function(){ ov.querySelector('#sy-cardscale-lbl').textContent=this.value>=100?'Auto (100%)':this.value+'%'; schedPrev(); });
    ov.querySelector('#sy-cardw').addEventListener('input',function(){ ov.querySelector('#sy-cardw-lbl').textContent=this.value>=100?'Auto (100%)':this.value+'%'; schedPrev(); });
    const close=function(){ try{ document.body.removeChild(ov); }catch(e){} };
    ov.querySelector('#sy-hdr-close').addEventListener('click',close);
    allFieldIds.forEach(function(fid){
      var inp2=ov.querySelector('#'+fid),drop=ov.querySelector('#'+fid+'-d');
      if(!inp2||!drop) return;
      function showDrop(){
        var q=inp2.value.toLowerCase().trim();
        var hits=(q?allIds.filter(function(id){ return id.toLowerCase().includes(q)||((states[id]&&states[id].attributes&&states[id].attributes.friendly_name||'').toLowerCase().includes(q)); }):allIds).slice(0,50);
        if(!hits.length){ drop.style.display='none'; return; }
        drop.style.display='block';
        drop.innerHTML=hits.map(function(id){ var fn=(states[id]&&states[id].attributes&&states[id].attributes.friendly_name)||''; return '<div data-pick="'+id+'" style="padding:5px 11px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#e2e8f0">'+id+'</span>'+(fn?'<span style="color:#475569;margin-left:7px;font-family:system-ui;font-size:10px">'+fn+'</span>':'')+'</div>'; }).join('');
        drop.querySelectorAll('[data-pick]').forEach(function(row){
          row.addEventListener('mousedown',function(ev){ ev.preventDefault(); inp2.value=row.getAttribute('data-pick'); drop.style.display='none'; schedPrev(); });
          row.addEventListener('mouseover',function(){ row.style.background='rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout',function(){ row.style.background=''; });
        });
      }
      inp2.addEventListener('focus',showDrop); inp2.addEventListener('input',function(){ showDrop(); schedPrev(); });
      inp2.addEventListener('blur',function(){ setTimeout(function(){ drop.style.display='none'; },200); });
    });
    ov.querySelector('#sy-cancel').addEventListener('click',close);
    ov.querySelector('#sy-save').addEventListener('click',function(){
      var scV=parseInt(ov.querySelector('#sy-cardscale').value)||100;
      var wV=parseInt(ov.querySelector('#sy-cardw').value)||100;
      save(card,{
        name:g('sy-name'),cpu:g('sy-cpu'),ram:g('sy-ram'),disk:g('sy-disk'),swap:g('sy-swap'),temp:g('sy-temp'),
        boot:g('sy-boot'),load1:g('sy-load1'),load5:g('sy-load5'),load15:g('sy-load15'),
        netin:g('sy-netin'),netout:g('sy-netout'),ip:g('sy-ip'),
        memuse:g('sy-memuse'),memfree:g('sy-memfree'),diskuse:g('sy-diskuse'),diskfree:g('sy-diskfree'),swapuse:g('sy-swapuse'),
        diskr:g('sy-diskr'),diskw:g('sy-diskw'),
        pk_power:g('sy-pk-power'),pk_en_oggi:g('sy-pk-en-oggi'),pk_en_mese:g('sy-pk-en-mese'),pk_en_anno:g('sy-pk-en-anno'),
        pk_co_oggi:g('sy-pk-co-oggi'),pk_co_ieri:g('sy-pk-co-ieri'),pk_co_mese:g('sy-pk-co-mese'),pk_co_mese_p:g('sy-pk-co-mese-p'),
        pk_co_anno:g('sy-pk-co-anno'),pk_co_anno_p:g('sy-pk-co-anno-p'),
        pk_ha_uptime:g('sy-pk-ha-uptime'),pk_srv_uptime:g('sy-pk-srv-uptime'),pk_entita:g('sy-pk-entita'),
        pk_backup:g('sy-pk-backup'),pk_ha_start:g('sy-pk-ha-start'),pk_ram_tot:g('sy-pk-ram-tot'),pk_disk_tot:g('sy-pk-disk-tot'),
        pk_core:g('sy-pk-core'),pk_sup:g('sy-pk-sup'),pk_addon:g('sy-pk-addon'),pk_hacs_card:g('sy-pk-hacs-card'),
        pk_hacs:g('sy-pk-hacs'),pk_cert:g('sy-pk-cert'),pk_ventola:g('sy-pk-ventola'),
        cardScale:scV,cardW:wV
      });
      var detail={cardId:card.id};
      if(scV!==cardScaleV) detail.cardScale=scV; if(wV!==cardWV) detail.cardW=wV;
      if(detail.cardScale!=null||detail.cardW!=null) el.dispatchEvent(new CustomEvent('frarik-card-layout',{bubbles:true,composed:true,detail:detail}));
      close();
      try{ el.innerHTML=render(card); el._sycBound=false; mount(card,H(),el); }catch(e){}
    });
    updatePrev();
  }

  var CARD={
    id:'system-card', name:'Mini-PC', icon:'🖥️', version:'4.8',
    desc:'Mini-PC/Server: ring CPU/RAM/Disco/Swap, energia & costi PKG, aggiornamenti, notifiche/alert con soglie editabili, orari e giorni settimana configurabili, grafici storici. Tutti i sensori PKG configurabili.',
    colSpan:2, rowSpan:4,
    render:render, mount:mount, update:update, configure:openCfg,
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{ console.log('[FratechStore] Card registrata: system-card v'+CARD.version); }catch(e){}
})();
