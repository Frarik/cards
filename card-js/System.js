/* frarik-version: 4.5 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(c) { return 'frarik_systemcard_' + (c.id || 'x'); }
  function load(c) { try { return JSON.parse(localStorage.getItem(keyOf(c)) || '{}') || {}; } catch (e) { return {}; } }
  function save(c, o) { try { localStorage.setItem(keyOf(c), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function num(v) { const x = parseFloat(String(v || '').replace(',', '.')); return isNaN(x) ? null : x; }
  function has(h, id) { return !!(h && h.states && h.states[id]); }
  function unit(h, id) { const s = h && id && h.states && h.states[id]; return (s && s.attributes && s.attributes.unit_of_measurement) || ''; }

  function autodetect(h) {
    const f = (...c) => c.find(id => has(h, id)) || '';
    return {
      cpu:     f('sensor.processor_use','sensor.cpu_usage'),
      ram:     f('sensor.memory_use_percent','sensor.system_monitor_memory_use_percent'),
      disk:    f('sensor.disk_use_percent','sensor.disk_use_percent_root','sensor.system_monitor_disk_use_percent_root'),
      temp:    f('sensor.processor_temperature','sensor.system_monitor_processor_temperature','sensor.cpu_temperature'),
      boot:    f('sensor.last_boot','sensor.system_monitor_last_boot'),
      swap:    f('sensor.swap_use_percent','sensor.system_monitor_swap_use_percent'),
      load1:   f('sensor.load_1m','sensor.load_1_m','sensor.system_monitor_load_1m'),
      load5:   f('sensor.load_5m','sensor.load_5_m','sensor.system_monitor_load_5m'),
      load15:  f('sensor.load_15m','sensor.load_15_m','sensor.system_monitor_load_15m'),
      netin:   f('sensor.network_throughput_in_enp2s0','sensor.network_throughput_in','sensor.network_in'),
      netout:  f('sensor.network_throughput_out_enp2s0','sensor.network_throughput_out','sensor.network_out'),
      ip:      f('sensor.ipv4_address_enp2s0','sensor.ipv4_address','sensor.local_ip'),
      memuse:  f('sensor.memory_use','sensor.system_monitor_memory_use'),
      memfree: f('sensor.memory_free','sensor.system_monitor_memory_free'),
      diskuse: f('sensor.disk_use','sensor.system_monitor_disk_use'),
      diskfree:f('sensor.disk_free','sensor.system_monitor_disk_free'),
      swapuse: f('sensor.swap_use','sensor.system_monitor_swap_use'),
      diskr:   f('sensor.disk_read_throughput','sensor.disk_read','sensor.system_monitor_disk_read'),
      diskw:   f('sensor.disk_write_throughput','sensor.disk_write','sensor.system_monitor_disk_write'),
    };
  }
  function cfgFor(card) {
    const c = load(card), a = autodetect(H());
    const r = {};
    Object.keys(a).forEach(k => { r[k] = c[k] !== undefined ? c[k] : a[k]; });
    return r;
  }

  function usageColor(p) { return (p??0)>=90?'#ef4444':(p??0)>=75?'#f97316':(p??0)>=50?'#fbbf24':'#22c55e'; }
  function tempColor(t)  { return t==null?'#94a3b8':t>=85?'#ef4444':t>=70?'#f97316':t>=55?'#fbbf24':'#22c55e'; }
  function loadColor(v)  { return (v??0)>=4?'#ef4444':(v??0)>=2?'#f97316':(v??0)>=1?'#fbbf24':'#22c55e'; }
  function healthScore(cpu,ram,load1,temp,swap){ return Math.max(cpu??0,ram??0,Math.min(100,((load1??0)/4)*100),temp!=null?Math.min(100,(temp/100)*100):0,swap??0); }
  function healthColor(s){ return s>=85?'#ef4444':s>=70?'#f97316':s>=50?'#fbbf24':'#22c55e'; }

  function statusBadges(cpu,ram,temp,load,swap){
    const b=[];
    if((load??0)>=4)        b.push(['⚠ Sovraccarico','#ef4444']);
    else if((cpu??0)>=85)   b.push(['↑ CPU alta','#f97316']);
    if((temp??0)>=80)       b.push(['🔥 Surriscaldamento','#ef4444']);
    else if((temp??0)>=70)  b.push(['🌡 Caldo','#f97316']);
    if((ram??0)>=90)        b.push(['⚠ RAM piena','#ef4444']);
    else if((ram??0)>=80)   b.push(['↑ RAM alta','#fbbf24']);
    if((swap??0)>=80)       b.push(['↑ Swap alta','#fbbf24']);
    if(!b.length)           b.push(['✓ Sistema OK','#22c55e']);
    return b;
  }

  function fmtGB(v) { if(v==null) return ''; if(v<1) return (v*1024).toFixed(0)+'MB'; return v.toFixed(1)+'GB'; }
  function fmtNet(v){ if(v==null) return '—'; if(v<0.001) return (v*1024*1024).toFixed(0)+' B/s'; if(v<1) return (v*1024).toFixed(1)+' KB/s'; return v.toFixed(2)+' MB/s'; }
  function fmtIO(v,u){ if(v==null) return '—'; const un=(u||'').toLowerCase(); if(un.includes('kb')) return v.toFixed(1)+' KB/s'; if(un.includes('mb')) return v.toFixed(2)+' MB/s'; if(v<1) return (v*1024).toFixed(0)+' KB/s'; return v.toFixed(2)+' MB/s'; }

  function uptimeText(h,id){
    if(!id) return '—';
    const sv=S(h,id); if(!sv) return '—';
    const t=new Date(sv).getTime(); if(isNaN(t)) return sv;
    let sec=Math.floor((Date.now()-t)/1000); if(sec<0) sec=0;
    const d=Math.floor(sec/86400); sec-=d*86400;
    const hh=Math.floor(sec/3600), mm=Math.floor((sec%3600)/60);
    return (d?d+'g ':'')+hh+'h '+mm+'m';
  }
  function updatesCount(h){ let n=0; const st=(h&&h.states)||{}; for(const id in st){ if(id.startsWith('update.')&&st[id].state==='on') n++; } return n; }
  function pushBuf(el,key,val,max){ el._sycBuf=el._sycBuf||{}; el._sycBuf[key]=el._sycBuf[key]||[]; if(val!=null) el._sycBuf[key].push(val); if(el._sycBuf[key].length>(max||40)) el._sycBuf[key].shift(); }

  /* ── SVG helpers ── */
  function ekgSVG(data, w, h, col, gid) {
    if(!data||data.length<2) return '<svg width="'+w+'" height="'+h+'"></svg>';
    const mx=Math.max(1,...data);
    const pts=data.map((v,i)=>(i/(data.length-1)*w).toFixed(1)+','+(h-2-(v/mx)*(h-4)).toFixed(1));
    const lx=pts[pts.length-1].split(',')[0], ly=pts[pts.length-1].split(',')[1];
    const grid=[.25,.5,.75].map(p=>'<line x1="0" y1="'+(h*p).toFixed(1)+'" x2="'+w+'" y2="'+(h*p).toFixed(1)+'" stroke="rgba(255,255,255,.04)" stroke-width="1"/>').join('');
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="display:block;overflow:visible">'
      +grid
      +'<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+col+'" stop-opacity=".35"/><stop offset="100%" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs>'
      +'<polygon points="'+pts.join(' ')+' '+w+','+h+' 0,'+h+'" fill="url(#'+gid+')"/>'
      +'<polyline points="'+pts.join(' ')+'" fill="none" stroke="'+col+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
      +'<circle cx="'+lx+'" cy="'+ly+'" r="6" fill="'+col+'" opacity=".18"/>'
      +'<circle cx="'+lx+'" cy="'+ly+'" r="3" fill="'+col+'" style="filter:drop-shadow(0 0 5px '+col+')"/>'
      +'</svg>';
  }

  function dualNetSVG(dataIn, dataOut, w, h, gidI, gidO) {
    const all=[...(dataIn||[]),...(dataOut||[])];
    if(all.length<2) return '<svg width="'+w+'" height="'+h+'"></svg>';
    const mx=Math.max(0.001,...all);
    function toPts(d){ return (d&&d.length>=2)?d.map((v,i)=>(i/(d.length-1)*w).toFixed(1)+','+(h-2-(v/mx)*(h-4)).toFixed(1)).join(' '):''; }
    const pi=toPts(dataIn), po=toPts(dataOut);
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="display:block;overflow:hidden">'
      +'<defs>'
      +'<linearGradient id="'+gidI+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8" stop-opacity=".3"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/></linearGradient>'
      +'<linearGradient id="'+gidO+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a78bfa" stop-opacity=".25"/><stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/></linearGradient>'
      +'</defs>'
      +(pi?'<polygon points="'+pi+' '+w+','+h+' 0,'+h+'" fill="url(#'+gidI+')"/>'
          +'<polyline points="'+pi+'" fill="none" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        :'')
      +(po?'<polygon points="'+po+' '+w+','+h+' 0,'+h+'" fill="url(#'+gidO+')"/>'
          +'<polyline points="'+po+'" fill="none" stroke="#a78bfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        :'')
      +'</svg>';
  }

  function miniSparkSVG(data, w, h, col, gid) {
    if(!data||data.length<2) return '<svg width="'+w+'" height="'+h+'"></svg>';
    const mx=Math.max(1,...data);
    const pts=data.map((v,i)=>(i/(data.length-1)*w).toFixed(1)+','+(h-1-(v/mx)*(h-2)).toFixed(1)).join(' ');
    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" style="display:block">'
      +'<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+col+'" stop-opacity=".4"/><stop offset="100%" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs>'
      +'<polygon points="'+pts+' '+w+','+h+' 0,'+h+'" fill="url(#'+gid+')"/>'
      +'<polyline points="'+pts+'" fill="none" stroke="'+col+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
      +'</svg>';
  }

  function ringHTML(key, pct, col, label, sz, sub) {
    const s=sz||72, r=+(s*0.36).toFixed(1), cx=s/2, cy=s/2;
    const circ=+(2*Math.PI*r).toFixed(2), p=Math.max(0,Math.min(100,pct||0));
    const dash=+((p/100)*circ).toFixed(2);
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">'
      +'<svg width="'+s+'" height="'+s+'" viewBox="0 0 '+s+' '+s+'" style="overflow:visible">'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="6"/>'
      +'<circle data-arc="'+key+'" cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="6"'
      +' stroke-dasharray="'+dash+' '+circ+'" stroke-linecap="round" transform="rotate(-90 '+cx+' '+cy+')"'
      +' style="transition:stroke-dasharray .9s ease-in-out,stroke .5s;filter:drop-shadow(0 0 7px '+col+'99)"/>'
      +'<text data-txt="'+key+'" x="'+cx+'" y="'+(cy+1)+'" text-anchor="middle" dominant-baseline="middle"'
      +' fill="'+col+'" font-size="'+(s*0.185).toFixed(0)+'px" font-weight="800" font-family="system-ui,sans-serif">'
      +(pct==null?'—':Math.round(pct)+'%')+'</text>'
      +'</svg>'
      +'<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.45);letter-spacing:.06em;text-transform:uppercase">'+label+'</div>'
      +'<div data-sub="'+key+'" style="font-size:9px;font-weight:600;color:rgba(255,255,255,.3);height:12px;line-height:12px">'+(sub||'')+'</div>'
      +'</div>';
  }
  function updateRing(el, key, pct, col, sz) {
    const arc=el.querySelector('[data-arc="'+key+'"]'), txt=el.querySelector('[data-txt="'+key+'"]');
    if(!arc||!txt) return;
    const r=(sz||72)*0.36, circ=+(2*Math.PI*r).toFixed(2);
    const dash=+((Math.max(0,Math.min(100,pct||0))/100)*circ).toFixed(2);
    arc.setAttribute('stroke-dasharray',dash+' '+circ);
    arc.setAttribute('stroke',col);
    arc.style.filter='drop-shadow(0 0 7px '+col+'99)';
    txt.setAttribute('fill',col);
    txt.textContent=pct==null?'—':Math.round(pct)+'%';
  }

  /* ── RENDER ── */
  function render(card) {
    const h=H(), c=cfgFor(card);
    const rid='syc'+(card.id||Math.random().toString(36).slice(2,8));
    const nm=load(card).name||'Sistema';
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
    const ramSub=(muV!=null&&mfV!=null)?fmtGB(muV)+'/'+fmtGB(muV+mfV):muV!=null?fmtGB(muV):'';
    const dskSub=(duV!=null&&dfV!=null)?fmtGB(duV)+'/'+fmtGB(duV+dfV):duV!=null?fmtGB(duV):'';
    const swpSub=suV!=null?fmtGB(suV):'';
    const hotAnim=tmpV!=null&&tmpV>=70?('@keyframes '+rid+'p{0%,100%{text-shadow:0 0 10px '+tCol+'99}50%{text-shadow:0 0 30px '+tCol+'ee,0 0 55px '+tCol+'44}}'):'';

    function loadRow(lbl,v,k){
      const p=Math.min(100,((v??0)/4)*100), col=loadColor(v);
      return '<div style="display:flex;align-items:center;gap:5px">'
        +'<div style="width:28px;font-size:9px;font-weight:700;color:rgba(255,255,255,.4);flex-shrink:0">'+lbl+'</div>'
        +'<div style="flex:1;height:5px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden">'
        +'<div data-bar="'+k+'" style="height:100%;width:'+p.toFixed(1)+'%;background:'+col+';border-radius:99px;transition:width .9s ease-in-out,background .5s"></div>'
        +'</div>'
        +'<div data-syv="'+k+'" style="width:30px;text-align:right;font-size:10px;font-weight:800;color:'+col+';flex-shrink:0">'+(v==null?'—':v.toFixed(2))+'</div>'
        +'</div>';
    }

    const css='<style>'
      +'@keyframes '+rid+'blink{0%,100%{opacity:1}50%{opacity:.15}}'
      +'@keyframes '+rid+'scan{0%{background-position:0% 0%}100%{background-position:200% 0%}}'
      +'@keyframes '+rid+'ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.8);opacity:0}}'
      +hotAnim
      +'#'+rid+'{position:relative;width:100%;height:100%;min-height:320px;border-radius:18px;'
      +'padding:13px 14px;box-sizing:border-box;font-family:system-ui,sans-serif;color:#e8ebf5;'
      +'display:flex;flex-direction:column;gap:7px;overflow:hidden;'
      +'background:linear-gradient(150deg,#0c1322 0%,#0a0f1c 60%,#0c1626 100%);'
      +'border:1px solid rgba(99,102,241,.22);box-shadow:0 10px 40px rgba(0,0,0,.45);}'
      +'#'+rid+'::before{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;'
      +'background:linear-gradient(105deg,transparent 40%,rgba(99,102,241,.06) 50%,transparent 60%);'
      +'background-size:200% 100%;animation:'+rid+'scan 7s linear infinite;}'
      +'#'+rid+' .syk-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0;position:relative;}'
      +'#'+rid+' .syk-dot::after{content:"";position:absolute;inset:-3px;border-radius:50%;background:#22c55e;animation:'+rid+'ping 2s ease-out infinite;}'
      +'#'+rid+' .syk-hot{animation:'+rid+'p 1.8s ease-in-out infinite;}'
      +'#'+rid+' .syk-sp{flex:1;background:rgba(255,255,255,.03);border-radius:10px;padding:5px 8px;}'
      +'#'+rid+' .syk-spl{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;}'
      +'</style>';

    const header='<div style="display:flex;align-items:center;gap:7px;position:relative;z-index:1">'
      +'<div class="syk-dot"></div>'
      +'<div style="flex:1;font-size:20px;font-weight:800;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+nm+'</div>'
      +(ip?'<div style="font-size:10px;font-weight:700;color:#38bdf8;background:rgba(56,189,248,.1);padding:3px 8px;border-radius:99px;border:1px solid rgba(56,189,248,.2);flex-shrink:0;font-family:monospace">'+ip+'</div>':'')
      +'</div>';

    const hbar='<div style="height:4px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden;position:relative;z-index:1">'
      +'<div data-syv="hbar" style="height:100%;width:'+hs.toFixed(1)+'%;background:'+hCol+';border-radius:99px;transition:width 1.2s ease-in-out,background .6s;box-shadow:0 0 8px '+hCol+'88"></div>'
      +'</div>';

    const badgesRow='<div data-syv="badges" style="display:flex;gap:5px;flex-wrap:wrap;position:relative;z-index:1">'
      +bdgs.map(function(b){return '<div style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:99px;background:'+b[1]+'18;border:1px solid '+b[1]+'44;color:'+b[1]+'">'+b[0]+'</div>';}).join('')
      +'</div>';

    const rings='<div style="display:flex;justify-content:space-around;align-items:flex-start;position:relative;z-index:1">'
      +ringHTML('cpu',cpuV,cpuC,'CPU',70,'')
      +ringHTML('ram',ramV,ramC,'RAM',70,ramSub)
      +ringHTML('dsk',dskV,dskC,'Disco',70,dskSub)
      +ringHTML('swp',swpV,swpC,'Swap',70,swpSub)
      +'</div>';

    const tempSection='<div style="display:flex;align-items:stretch;gap:8px;position:relative;z-index:1">'
      +'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border-radius:12px;padding:7px 12px;flex-shrink:0;min-width:72px;gap:3px">'
      +'<div data-syv="temp" class="'+(tmpV!=null&&tmpV>=70?'syk-hot':'')+'" style="font-size:25px;font-weight:800;line-height:1;color:'+tCol+'">'+(tmpV==null?'—':tmpV.toFixed(1)+'°')+'</div>'
      +'<div style="width:100%;height:3px;border-radius:99px;background:linear-gradient(90deg,#22c55e 0%,#fbbf24 50%,#ef4444 100%);opacity:.7;position:relative;margin:2px 0">'
      +'<div data-syv="tbar" style="position:absolute;top:-2px;left:'+Math.min(99,(tmpV??0)).toFixed(0)+'%;width:7px;height:7px;border-radius:50%;background:#fff;transform:translateX(-50%);box-shadow:0 0 6px rgba(255,255,255,.8);transition:left .9s ease-in-out"></div>'
      +'</div>'
      +'<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em">Temp CPU</div>'
      +'<div data-syv="temp-sp" style="width:62px;height:18px"></div>'
      +'</div>'
      +'<div style="flex:1;background:rgba(255,255,255,.04);border-radius:12px;padding:7px 9px;display:flex;flex-direction:column;justify-content:center;gap:5px">'
      +'<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:1px">Carico sistema</div>'
      +loadRow('1m',l1,'l1')
      +loadRow('5m',l5,'l5')
      +loadRow('15m',l15,'l15')
      +'</div>'
      +'</div>';

    const sparklines='<div style="display:flex;gap:7px;position:relative;z-index:1">'
      +'<div class="syk-sp"><div class="syk-spl" style="color:'+cpuC+'">▸ Processore</div><div data-syv="cpu-sp" style="height:46px"></div></div>'
      +'<div class="syk-sp"><div class="syk-spl" style="color:'+ramC+'">▸ RAM</div><div data-syv="ram-sp" style="height:46px"></div></div>'
      +'</div>';

    const netSection=(c.netin||c.netout)?('<div style="background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.15);border-radius:11px;padding:6px 10px;position:relative;z-index:1">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'
      +'<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em">🌐 Rete</div>'
      +'<div style="display:flex;gap:10px">'
      +'<div data-syv="ni" style="font-size:10px;font-weight:700;color:#38bdf8">↓ '+fmtNet(niV)+'</div>'
      +'<div data-syv="no" style="font-size:10px;font-weight:700;color:#a78bfa">↑ '+fmtNet(noV)+'</div>'
      +'</div></div>'
      +'<div data-syv="net-sp" style="height:32px"></div>'
      +'</div>'):'';

    const diskIOSection=(c.diskr||c.diskw)?('<div style="display:flex;align-items:center;gap:10px;padding:6px 10px;background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.15);border-radius:11px;position:relative;z-index:1">'
      +'<div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;flex-shrink:0">💾 I/O Disco</div>'
      +'<div style="flex:1;display:flex;gap:12px;justify-content:flex-end">'
      +(c.diskr?'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:1px"><div style="font-size:9px;color:rgba(255,255,255,.4)">Lettura</div><div data-syv="dr" style="font-size:11px;font-weight:700;color:#fbbf24">'+fmtIO(drV,unit(h,c.diskr))+'</div></div>':'')
      +(c.diskw?'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:1px"><div style="font-size:9px;color:rgba(255,255,255,.4)">Scrittura</div><div data-syv="dw" style="font-size:11px;font-weight:700;color:#f97316">'+fmtIO(dwV,unit(h,c.diskw))+'</div></div>':'')
      +'</div></div>'):'';

    const footer='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;position:relative;z-index:1">'
      +'<div data-syv="uptime" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)">⏱ '+uptimeText(h,c.boot)+'</div>'
      +'<div data-syv="updates" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:'+(upd?'rgba(34,197,94,.12)':'rgba(255,255,255,.06)')+';border:1px solid '+(upd?'rgba(34,197,94,.3)':'rgba(255,255,255,.1)')+';color:'+(upd?'#86efac':'rgba(255,255,255,.8)')+'">⬆ '+upd+' aggiorn.</div>'
      +'</div>';

    return css+'<div id="'+rid+'">'+header+hbar+badgesRow+rings+tempSection+sparklines+netSection+diskIOSection+footer+'</div>';
  }

  /* ── PATCH (partial update) ── */
  function _patch(card, el) {
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
    const tCol=tempColor(tmpV), cpuC=usageColor(cpuV), ramC='#a78bfa', dskC=usageColor(dskV), swpC=usageColor(swpV);
    const hs=healthScore(cpuV,ramV,l1,tmpV,swpV), hCol=healthColor(hs);

    pushBuf(el,'cpu',cpuV); pushBuf(el,'ram',ramV);
    pushBuf(el,'net',niV); pushBuf(el,'netout',noV); pushBuf(el,'temp',tmpV,30);

    const hb=el.querySelector('[data-syv="hbar"]');
    if(hb){hb.style.width=hs.toFixed(1)+'%';hb.style.background=hCol;hb.style.boxShadow='0 0 8px '+hCol+'88';}

    const bdgRow=el.querySelector('[data-syv="badges"]');
    if(bdgRow){
      const bdgs=statusBadges(cpuV,ramV,tmpV,l1,swpV);
      bdgRow.innerHTML=bdgs.map(function(b){return '<div style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:99px;background:'+b[1]+'18;border:1px solid '+b[1]+'44;color:'+b[1]+'">'+b[0]+'</div>';}).join('');
    }

    updateRing(el,'cpu',cpuV,cpuC,70); updateRing(el,'ram',ramV,ramC,70);
    updateRing(el,'dsk',dskV,dskC,70); updateRing(el,'swp',swpV,swpC,70);

    function setSub(k,t){ const e=el.querySelector('[data-sub="'+k+'"]'); if(e) e.textContent=t; }
    setSub('ram',(muV!=null&&mfV!=null)?fmtGB(muV)+'/'+fmtGB(muV+mfV):muV!=null?fmtGB(muV):'');
    setSub('dsk',(duV!=null&&dfV!=null)?fmtGB(duV)+'/'+fmtGB(duV+dfV):duV!=null?fmtGB(duV):'');
    setSub('swp',suV!=null?fmtGB(suV):'');

    const te=el.querySelector('[data-syv="temp"]');
    if(te){te.textContent=tmpV==null?'—':tmpV.toFixed(1)+'°';te.style.color=tCol;te.className=tmpV!=null&&tmpV>=70?'syk-hot':'';}
    const tb=el.querySelector('[data-syv="tbar"]');
    if(tb) tb.style.left=Math.min(99,tmpV??0).toFixed(0)+'%';

    [[l1,'l1'],[l5,'l5'],[l15,'l15']].forEach(function(x){
      const v=x[0], k=x[1], col=loadColor(v);
      const txt=el.querySelector('[data-syv="'+k+'"]'), bar=el.querySelector('[data-bar="'+k+'"]');
      if(txt){txt.textContent=v==null?'—':v.toFixed(2);txt.style.color=col;}
      if(bar){bar.style.width=Math.min(100,((v??0)/4)*100).toFixed(1)+'%';bar.style.background=col;}
    });

    const niEl=el.querySelector('[data-syv="ni"]'); if(niEl) niEl.textContent='↓ '+fmtNet(niV);
    const noEl=el.querySelector('[data-syv="no"]'); if(noEl) noEl.textContent='↑ '+fmtNet(noV);
    const drEl=el.querySelector('[data-syv="dr"]'); if(drEl) drEl.textContent=fmtIO(drV,unit(h,c.diskr));
    const dwEl=el.querySelector('[data-syv="dw"]'); if(dwEl) dwEl.textContent=fmtIO(dwV,unit(h,c.diskw));

    const ue=el.querySelector('[data-syv="uptime"]'); if(ue) ue.textContent='⏱ '+uptimeText(h,c.boot);
    const ude=el.querySelector('[data-syv="updates"]');
    if(ude){ude.textContent='⬆ '+upd+' aggiorn.';ude.style.background=upd?'rgba(34,197,94,.12)':'rgba(255,255,255,.06)';ude.style.borderColor=upd?'rgba(34,197,94,.3)':'rgba(255,255,255,.1)';ude.style.color=upd?'#86efac':'rgba(255,255,255,.8)';}

    const rid=((el.querySelector('[id^="syc"]')||{}).id)||'sycx';
    const cpuSpEl=el.querySelector('[data-syv="cpu-sp"]'); if(cpuSpEl) cpuSpEl.innerHTML=ekgSVG(el._sycBuf&&el._sycBuf.cpu||[],cpuSpEl.offsetWidth||100,46,cpuC,rid+'gc');
    const ramSpEl=el.querySelector('[data-syv="ram-sp"]'); if(ramSpEl) ramSpEl.innerHTML=ekgSVG(el._sycBuf&&el._sycBuf.ram||[],ramSpEl.offsetWidth||100,46,ramC,rid+'gr');
    const tmpSpEl=el.querySelector('[data-syv="temp-sp"]'); if(tmpSpEl) tmpSpEl.innerHTML=miniSparkSVG(el._sycBuf&&el._sycBuf.temp||[],62,18,tCol,rid+'gt');
    const netSpEl=el.querySelector('[data-syv="net-sp"]'); if(netSpEl) netSpEl.innerHTML=dualNetSVG(el._sycBuf&&el._sycBuf.net||[],el._sycBuf&&el._sycBuf.netout||[],netSpEl.offsetWidth||200,32,rid+'ni',rid+'no');
  }

  function update(card, hass, el) {
    if(!el.querySelector('[data-arc]')){ el.innerHTML=render(card); return; }
    _patch(card, el);
  }
  function mount(card, hass, el) {
    if(el._sycBound) return; el._sycBound=true;
    setTimeout(function(){ _patch(card, el); }, 80);
  }

  /* ── CONFIG POPUP ── */
  function openCfg(card, el) {
    const h=H(), c=load(card);
    const states=(h&&h.states)||{};
    const allIds=Object.keys(states).sort();
    const stInp='width:100%;padding:9px 11px;border-radius:10px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop='position:absolute;left:0;right:0;top:100%;z-index:10;max-height:160px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 10px 10px;display:none';
    const stLbl='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px;display:block';
    const stSec='font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#6366f1;margin:14px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(99,102,241,.2)';
    const stBase='width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:13px;box-sizing:border-box';
    const cf=cfgFor(card);

    function field(fid,lbl2,val,hint){
      return '<div style="margin-bottom:9px;position:relative">'
        +'<label style="'+stLbl+'">'+lbl2+(hint?'<span style="font-weight:400;color:#475569;margin-left:6px;font-family:monospace;text-transform:none;letter-spacing:0">'+hint+'</span>':'')+'</label>'
        +'<input id="'+fid+'" type="text" value="'+(val||'').replace(/"/g,'&quot;')+'" autocomplete="off" placeholder="Clicca o scrivi per filtrare…" style="'+stInp+'">'
        +'<div id="'+fid+'-d" style="'+stDrop+'"></div>'
        +'</div>';
    }

    var _fll=JSON.parse(localStorage.getItem('_frk_layout_'+(card.id||''))||'{}');
    const cardScaleV=_fll.cardScale!=null?_fll.cardScale:(c.cardScale||100), cardWV=_fll.cardW!=null?_fll.cardW:(c.cardW||100);
    var _prevTimer=null;

    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML='<style>@keyframes sySlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@media(max-width:600px){.frk-cfg-cols{flex-direction:column!important;overflow-y:auto!important;overflow-x:hidden!important}.frk-form-col{width:100%!important;border-right:none!important;border-bottom:1px solid rgba(255,255,255,.07)!important;overflow-y:visible!important;flex-shrink:0!important}.frk-prev-col{min-width:0!important;overflow-y:visible!important}}</style>'
      +'<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(139,92,246,.32);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:sySlideUp .22s cubic-bezier(.32,1.12,.56,1)">'
      +'<div style="display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
        +'<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);color:#fbbf24;flex-shrink:0">🖥️</div>'
        +'<div><div style="font-size:14px;font-weight:800">Configura Sistema</div><div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:1px">'+card.id+'</div></div>'
        +'<button id="sy-hdr-close" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:rgba(255,255,255,.5);background:rgba(255,255,255,.07);border:none">✕</button>'
      +'</div>'
      +'<div class="frk-cfg-cols" style="display:flex;flex:1;overflow:hidden;min-height:0">'
        +'<div class="frk-form-col" style="width:400px;flex-shrink:0;overflow-y:auto;padding:14px 16px;border-right:1px solid rgba(255,255,255,.07);scrollbar-width:none">'
          +'<div style="margin-bottom:10px"><label style="'+stLbl+'">Nome del sistema</label><input id="sy-name" type="text" value="'+(c.name||'').replace(/"/g,'&quot;')+'" placeholder="es. Mini PC, NAS, Server…" style="'+stBase+'"></div>'
          +'<div style="'+stSec+'">Utilizzi percentuale</div>'
          +field('sy-cpu','Uso Processore (%)',cf.cpu,'sensor.processor_use')
          +field('sy-ram','Utilizzo RAM (%)',cf.ram,'sensor.memory_use_percent')
          +field('sy-disk','Utilizzo Disco (%)',cf.disk,'sensor.disk_use_percent')
          +field('sy-swap','Utilizzo Swap (%)',cf.swap,'sensor.swap_use_percent')
          +field('sy-temp','Temperatura Processore (°C)',cf.temp,'sensor.processor_temperature')
          +'<div style="'+stSec+'">Carico e avvio</div>'
          +field('sy-load1','Carico sistema — 1 minuto',cf.load1,'sensor.load_1m')
          +field('sy-load5','Carico sistema — 5 minuti',cf.load5,'sensor.load_5m')
          +field('sy-load15','Carico sistema — 15 minuti',cf.load15,'sensor.load_15m')
          +field('sy-boot','Tempo di attività (last boot)',cf.boot,'sensor.last_boot')
          +'<div style="'+stSec+'">Rete</div>'
          +field('sy-netin','Traffico in entrata',cf.netin,'sensor.network_throughput_in_enp2s0')
          +field('sy-netout','Traffico in uscita',cf.netout,'sensor.network_throughput_out_enp2s0')
          +field('sy-ip','Indirizzo IP locale',cf.ip,'sensor.ipv4_address_enp2s0')
          +'<div style="'+stSec+'">Valori assoluti (opzionale)</div>'
          +field('sy-memuse','RAM usata (GB)',cf.memuse,'sensor.memory_use')
          +field('sy-memfree','RAM libera (GB)',cf.memfree,'sensor.memory_free')
          +field('sy-diskuse','Spazio disco usato',cf.diskuse,'sensor.disk_use')
          +field('sy-diskfree','Spazio disco libero',cf.diskfree,'sensor.disk_free')
          +field('sy-swapuse','Swap usata (GB)',cf.swapuse,'sensor.swap_use')
          +'<div style="'+stSec+'">I/O Disco (opzionale)</div>'
          +field('sy-diskr','Velocità lettura disco',cf.diskr,'sensor.disk_read_throughput')
          +field('sy-diskw','Velocità scrittura disco',cf.diskw,'sensor.disk_write_throughput')
          +'<div style="display:flex;gap:8px;margin-top:14px">'
            +'<button id="sy-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>'
            +'<button id="sy-save" style="flex:2;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#fbbf24;color:#0a0816">Salva</button>'
          +'</div>'
        +'</div>'
        +'<div class="frk-prev-col" style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:10px;padding:14px 16px;overflow-y:auto;background:rgba(0,0,0,.15);scrollbar-width:none">'
          +'<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.07em">Anteprima live</div>'
          +'<div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.08)"><div id="sy-prev-inner"></div></div>'
          +'<div style="padding-top:12px;border-top:1px solid rgba(255,255,255,.08)">'
            +'<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Dimensioni card</div>'
            +'<div style="display:flex;align-items:center;gap:8px;margin-top:8px">'
              +'<span style="font-size:11px;font-weight:700;color:#fff;width:72px;flex-shrink:0">Altezza</span>'
              +'<input type="range" id="sy-cardscale" min="20" max="100" step="5" value="'+cardScaleV+'" style="flex:1;cursor:pointer;accent-color:#fbbf24;height:4px">'
              +'<span id="sy-cardscale-lbl" style="font-size:12px;font-weight:800;color:#fbbf24;width:64px;text-align:right;flex-shrink:0">'+(cardScaleV>=100?'Auto (100%)':cardScaleV+'%')+'</span>'
            +'</div>'
            +'<div style="display:flex;align-items:center;gap:8px;margin-top:8px">'
              +'<span style="font-size:11px;font-weight:700;color:#fff;width:72px;flex-shrink:0">Larghezza</span>'
              +'<input type="range" id="sy-cardw" min="20" max="100" step="5" value="'+cardWV+'" style="flex:1;cursor:pointer;accent-color:#fbbf24;height:4px">'
              +'<span id="sy-cardw-lbl" style="font-size:12px;font-weight:800;color:#fbbf24;width:64px;text-align:right;flex-shrink:0">'+(cardWV>=100?'Auto (100%)':cardWV+'%')+'</span>'
            +'</div>'
          +'</div>'
        +'</div>'
      +'</div>'
    +'</div>';

    document.body.appendChild(ov);

    function updatePrev(){
      var prevEl=ov.querySelector('#sy-prev-inner'); if(!prevEl) return;
      var scV=parseInt((ov.querySelector('#sy-cardscale')||{}).value)||100;
      var wV=parseInt((ov.querySelector('#sy-cardw')||{}).value)||100;
      function g(id){var e=ov.querySelector('#'+id);return e?e.value.trim():'';}
      try{
        localStorage.setItem('frarik_systemcard___prev__',JSON.stringify({name:g('sy-name'),cpu:g('sy-cpu'),ram:g('sy-ram'),disk:g('sy-disk'),swap:g('sy-swap'),temp:g('sy-temp'),cardScale:100,cardW:100}));
        prevEl.innerHTML=render({id:'__prev__'});
        prevEl.style.zoom=scV<100?scV+'%':''; prevEl.style.width=wV<100?wV+'%':'';
      }catch(e){}
    }
    function schedPrev(){clearTimeout(_prevTimer);_prevTimer=setTimeout(updatePrev,180);}

    ov.querySelector('#sy-cardscale').addEventListener('input',function(){ov.querySelector('#sy-cardscale-lbl').textContent=this.value>=100?'Auto (100%)':this.value+'%';schedPrev();});
    ov.querySelector('#sy-cardw').addEventListener('input',function(){ov.querySelector('#sy-cardw-lbl').textContent=this.value>=100?'Auto (100%)':this.value+'%';schedPrev();});

    const close=function(){try{document.body.removeChild(ov);}catch(e){}};
    ov.querySelector('#sy-hdr-close').addEventListener('click',close);

    var fieldIds=['sy-cpu','sy-ram','sy-disk','sy-swap','sy-temp','sy-load1','sy-load5','sy-load15','sy-boot','sy-netin','sy-netout','sy-ip','sy-memuse','sy-memfree','sy-diskuse','sy-diskfree','sy-swapuse','sy-diskr','sy-diskw'];
    fieldIds.forEach(function(fid){
      var inp2=ov.querySelector('#'+fid), drop=ov.querySelector('#'+fid+'-d');
      if(!inp2||!drop) return;
      function showDrop(){
        var q=inp2.value.toLowerCase().trim();
        var hits=(q?allIds.filter(function(id){return id.toLowerCase().includes(q)||((states[id]&&states[id].attributes&&states[id].attributes.friendly_name||'').toLowerCase().includes(q));}):allIds).slice(0,50);
        if(!hits.length){drop.style.display='none';return;}
        drop.style.display='block';
        drop.innerHTML=hits.map(function(id){
          var fn=(states[id]&&states[id].attributes&&states[id].attributes.friendly_name)||'';
          return '<div data-pick="'+id+'" style="padding:5px 11px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#e2e8f0">'+id+'</span>'+(fn?'<span style="color:#475569;margin-left:7px;font-family:system-ui;font-size:10px">'+fn+'</span>':'')+'</div>';
        }).join('');
        drop.querySelectorAll('[data-pick]').forEach(function(row){
          row.addEventListener('mousedown',function(ev){ev.preventDefault();inp2.value=row.getAttribute('data-pick');drop.style.display='none';});
          row.addEventListener('mouseover',function(){row.style.background='rgba(255,255,255,.08)';});
          row.addEventListener('mouseout', function(){row.style.background='';});
        });
      }
      inp2.addEventListener('focus',showDrop);
      inp2.addEventListener('input',function(){showDrop();schedPrev();});
      inp2.addEventListener('blur',function(){setTimeout(function(){drop.style.display='none';},200);});
    });

    ov.querySelector('#sy-cancel').addEventListener('click',close);
    ov.querySelector('#sy-save').addEventListener('click',function(){
      function g(id){var e=ov.querySelector('#'+id); return e?e.value.trim():'';}
      var scV=parseInt(ov.querySelector('#sy-cardscale').value)||100;
      var wV=parseInt(ov.querySelector('#sy-cardw').value)||100;
      save(card,{name:g('sy-name'),cpu:g('sy-cpu'),ram:g('sy-ram'),disk:g('sy-disk'),swap:g('sy-swap'),
        temp:g('sy-temp'),boot:g('sy-boot'),load1:g('sy-load1'),load5:g('sy-load5'),load15:g('sy-load15'),
        netin:g('sy-netin'),netout:g('sy-netout'),ip:g('sy-ip'),
        memuse:g('sy-memuse'),memfree:g('sy-memfree'),diskuse:g('sy-diskuse'),diskfree:g('sy-diskfree'),swapuse:g('sy-swapuse'),
        diskr:g('sy-diskr'),diskw:g('sy-diskw'),cardScale:scV,cardW:wV});
      var detail={cardId:card.id};
      if(scV!==cardScaleV) detail.cardScale=scV; if(wV!==cardWV) detail.cardW=wV;
      if(detail.cardScale!=null||detail.cardW!=null) el.dispatchEvent(new CustomEvent('frarik-card-layout',{bubbles:true,composed:true,detail:detail}));
      close();
      try{el.innerHTML=render(card);el._sycBound=false;mount(card,H(),el);}catch(e){}
    });
    updatePrev();
  }

  var CARD={
    id:'system-card', name:'Sistema', icon:'🖥️', version:'4.1',
    desc:'Mini PC / Server: ring con glow, barra salute, badge stato, valori assoluti GB, sparkline EKG, rete doppia linea, I/O disco, temp con indicatore.',
    colSpan:2, rowSpan:4,
    render:render, mount:mount, update:update, configure:openCfg,
  };
  window.FratechCardRegistry=window.FratechCardRegistry||{};
  window.FratechCardRegistry[CARD.id]=CARD;
  window.FratechCards=window.FratechCards||{};
  window.FratechCards[CARD.id]=CARD;
  try{console.log('[FratechStore] Card registrata: system-card v'+CARD.version);}catch(e){}
})();
