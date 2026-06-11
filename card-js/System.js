/* frarik-version: 3.0 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(card) { return 'frarik_systemcard_' + (card.id || 'x'); }
  function load(card) { try { return JSON.parse(localStorage.getItem(keyOf(card)) || '{}') || {}; } catch (e) { return {}; } }
  function save(card, o) { try { localStorage.setItem(keyOf(card), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function num(v) { const x = parseFloat(String(v || '').replace(',', '.')); return isNaN(x) ? null : x; }
  function has(h, id) { return !!(h && h.states && h.states[id]); }

  function autodetect(h) {
    const f = (...c) => c.find(id => has(h, id)) || '';
    return {
      cpu:    f('sensor.processor_use','sensor.cpu_usage','sensor.system_monitor_processor_use'),
      ram:    f('sensor.memory_use_percent','sensor.system_monitor_memory_use_percent'),
      disk:   f('sensor.disk_use_percent','sensor.disk_use_percent_root','sensor.system_monitor_disk_use_percent_root'),
      temp:   f('sensor.processor_temperature','sensor.system_monitor_processor_temperature','sensor.cpu_temperature'),
      boot:   f('sensor.last_boot','sensor.system_monitor_last_boot'),
      swap:   f('sensor.swap_use_percent','sensor.system_monitor_swap_use_percent'),
      load1:  f('sensor.load_1m','sensor.load_1_m','sensor.system_monitor_load_1m'),
      load5:  f('sensor.load_5m','sensor.load_5_m','sensor.system_monitor_load_5m'),
      load15: f('sensor.load_15m','sensor.load_15_m','sensor.system_monitor_load_15m'),
      netin:  f('sensor.network_throughput_in_enp2s0','sensor.network_throughput_in','sensor.network_in'),
      netout: f('sensor.network_throughput_out_enp2s0','sensor.network_throughput_out','sensor.network_out'),
      ip:     f('sensor.ipv4_address_enp2s0','sensor.ipv4_address','sensor.local_ip'),
    };
  }
  function cfgFor(card) {
    const c = load(card), a = autodetect(H());
    return {
      cpu:c.cpu||a.cpu, ram:c.ram||a.ram, disk:c.disk||a.disk, temp:c.temp||a.temp,
      boot:c.boot||a.boot, swap:c.swap||a.swap,
      load1:c.load1||a.load1, load5:c.load5||a.load5, load15:c.load15||a.load15,
      netin:c.netin||a.netin, netout:c.netout||a.netout, ip:c.ip||a.ip,
    };
  }

  function usageColor(p) { return p>=90?'#ef4444':p>=75?'#f97316':p>=50?'#fbbf24':'#22c55e'; }
  function tempColor(t) { return t==null?'#94a3b8':t>=85?'#ef4444':t>=70?'#f97316':t>=55?'#fbbf24':'#22c55e'; }
  function loadColor(v) { return v>=4?'#ef4444':v>=2?'#f97316':v>=1?'#fbbf24':'#22c55e'; }

  function uptimeText(h, id) {
    if (!id) return '—';
    const s = S(h, id); if (!s) return s === null ? '—' : s;
    const t = new Date(s).getTime();
    if (isNaN(t)) return s; // potrebbe essere già un testo (es. "2 settimane")
    let sec = Math.floor((Date.now() - t) / 1000); if (sec < 0) sec = 0;
    const d = Math.floor(sec / 86400); sec -= d * 86400;
    const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60);
    return (d ? d + 'g ' : '') + hh + 'h ' + mm + 'm';
  }
  function updatesCount(h) {
    let n = 0; const st = (h && h.states) || {};
    for (const id in st) { if (id.startsWith('update.') && st[id].state === 'on') n++; }
    return n;
  }
  function fmtNet(v) {
    if (v == null) return '—';
    if (v < 0.001) return (v * 1024 * 1024).toFixed(0) + ' B/s';
    if (v < 1) return (v * 1024).toFixed(1) + ' KB/s';
    return v.toFixed(2) + ' MB/s';
  }

  function pushBuf(el, key, val, max) {
    el._sycBuf = el._sycBuf || {};
    el._sycBuf[key] = el._sycBuf[key] || [];
    if (val != null) el._sycBuf[key].push(val);
    if (el._sycBuf[key].length > (max || 40)) el._sycBuf[key].shift();
  }

  function sparkSVG(data, w, h, col, gid) {
    if (!data || data.length < 2) return '<svg width="' + w + '" height="' + h + '"></svg>';
    const mx = Math.max(1, ...data);
    const pts = data.map((v, i) => (i / (data.length - 1) * w).toFixed(1) + ',' + (h - (v / mx) * (h - 2) - 1).toFixed(1));
    const area = pts.join(' ') + ' ' + w + ',' + h + ' 0,' + h;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;overflow:hidden">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${col}" stop-opacity=".55"/>
        <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
      </linearGradient></defs>
      <polygon points="${area}" fill="url(#${gid})"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${pts[pts.length-1].split(',')[0]}" cy="${pts[pts.length-1].split(',')[1]}" r="3" fill="${col}"/>
    </svg>`;
  }

  function ringHTML(key, pct, col, label, sz) {
    const s = sz || 72, r = s * 0.36, cx = s / 2, cy = s / 2;
    const circ = +(2 * Math.PI * r).toFixed(2);
    const p = Math.max(0, Math.min(100, pct || 0));
    const dash = +((p / 100) * circ).toFixed(2);
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
      <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="6"/>
        <circle data-arc="${key}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="6"
          stroke-dasharray="${dash} ${circ}" stroke-linecap="round"
          transform="rotate(-90 ${cx} ${cy})"
          style="transition:stroke-dasharray .8s ease-in-out,stroke .5s"/>
        <text data-txt="${key}" x="${cx}" y="${cy + 1}" text-anchor="middle" dominant-baseline="middle"
          fill="${col}" font-size="${(s * 0.185).toFixed(0)}px" font-weight="800" font-family="system-ui,sans-serif">
          ${pct == null ? '—' : Math.round(pct) + '%'}
        </text>
      </svg>
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.45);letter-spacing:.06em;text-transform:uppercase">${label}</div>
    </div>`;
  }

  function updateRing(el, key, pct, col, sz) {
    const arc = el.querySelector('[data-arc="' + key + '"]');
    const txt = el.querySelector('[data-txt="' + key + '"]');
    if (!arc || !txt) return;
    const r = (sz || 72) * 0.36, circ = +(2 * Math.PI * r).toFixed(2);
    const dash = +((Math.max(0, Math.min(100, pct || 0)) / 100) * circ).toFixed(2);
    arc.setAttribute('stroke-dasharray', dash + ' ' + circ);
    arc.setAttribute('stroke', col);
    txt.setAttribute('fill', col);
    txt.textContent = pct == null ? '—' : Math.round(pct) + '%';
  }

  function render(card) {
    const h = H(); const c = cfgFor(card);
    const rid = 'syc' + (card.id || Math.random().toString(36).slice(2, 8));
    const nm = load(card).name || 'Sistema';
    const cpuV=num(S(h,c.cpu)), ramV=num(S(h,c.ram)), dskV=num(S(h,c.disk));
    const tmpV=num(S(h,c.temp)), swpV=num(S(h,c.swap));
    const l1=num(S(h,c.load1)), l5=num(S(h,c.load5)), l15=num(S(h,c.load15));
    const niV=num(S(h,c.netin)), noV=num(S(h,c.netout));
    const ip=S(h,c.ip), upd=updatesCount(h);
    const tCol=tempColor(tmpV), cpuC=usageColor(cpuV??0), ramC='#a78bfa', dskC=usageColor(dskV??0), swpC=usageColor(swpV??0);
    const hotAnim=tmpV!=null&&tmpV>=70?`@keyframes ${rid}p{0%,100%{text-shadow:0 0 10px ${tCol}99}50%{text-shadow:0 0 28px ${tCol}dd,0 0 50px ${tCol}44}}`:'';

    function loadRow(lbl, v, key) {
      const p = Math.min(100, ((v??0) / 4) * 100);
      const col = loadColor(v??0);
      return `<div style="display:flex;align-items:center;gap:6px">
        <div style="width:34px;font-size:10px;font-weight:600;color:rgba(255,255,255,.45);flex-shrink:0">${lbl}</div>
        <div style="flex:1;height:5px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden">
          <div data-bar="${key}" style="height:100%;width:${p.toFixed(1)}%;background:${col};border-radius:99px;transition:width .8s ease-in-out,background .5s"></div>
        </div>
        <div data-syv="${key}" style="width:32px;text-align:right;font-size:10px;font-weight:800;color:${col};flex-shrink:0">${v==null?'—':v.toFixed(2)}</div>
      </div>`;
    }

    return `<style>
      @keyframes ${rid}blink{0%,100%{opacity:1}50%{opacity:.2}}
      @keyframes ${rid}scan{0%{background-position:0% 0%}100%{background-position:200% 0%}}
      ${hotAnim}
      #${rid}{position:relative;width:100%;height:100%;min-height:280px;border-radius:18px;
        padding:13px 14px;box-sizing:border-box;font-family:system-ui,sans-serif;color:#e8ebf5;
        display:flex;flex-direction:column;gap:8px;overflow:hidden;
        background:linear-gradient(150deg,#0c1322 0%,#090e1a 55%,#0c1626 100%);
        border:1px solid rgba(99,102,241,.22);}
      #${rid}::before{content:'';position:absolute;inset:0;pointer-events:none;border-radius:inherit;
        background:linear-gradient(105deg,transparent 40%,rgba(99,102,241,.05) 50%,transparent 60%);
        background-size:200% 100%;animation:${rid}scan 7s linear infinite;}
      #${rid} .syk-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;
        flex-shrink:0;animation:${rid}blink 2s ease-in-out infinite;}
      #${rid} .syk-hot{animation:${rid}p 1.8s ease-in-out infinite;}
      #${rid} .syk-sp{flex:1;background:rgba(255,255,255,.03);border-radius:10px;padding:5px 8px;}
      #${rid} .syk-spl{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;}
    </style>
    <div id="${rid}">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:7px">
        <div class="syk-dot"></div>
        <div style="flex:1;font-size:20px;font-weight:800;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nm}</div>
        ${ip?`<div style="font-size:10px;font-weight:700;color:#38bdf8;background:rgba(56,189,248,.1);padding:3px 8px;border-radius:99px;border:1px solid rgba(56,189,248,.2);flex-shrink:0;font-family:monospace">${ip}</div>`:''}
      </div>

      <!-- 4 Ring gauge -->
      <div style="display:flex;justify-content:space-around;align-items:flex-start">
        ${ringHTML('cpu',cpuV,cpuC,'CPU',70)}
        ${ringHTML('ram',ramV,ramC,'RAM',70)}
        ${ringHTML('dsk',dskV,dskC,'Disco',70)}
        ${ringHTML('swp',swpV,swpC,'Swap',70)}
      </div>

      <!-- Temperatura + Carico sistema -->
      <div style="display:flex;align-items:stretch;gap:8px">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border-radius:12px;padding:8px 14px;flex-shrink:0;min-width:70px">
          <div data-syv="temp" class="${tmpV!=null&&tmpV>=70?'syk-hot':''}" style="font-size:26px;font-weight:800;line-height:1;color:${tCol}">${tmpV==null?'—':tmpV.toFixed(1)+'°'}</div>
          <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-top:3px">Temp CPU</div>
        </div>
        <div style="flex:1;background:rgba(255,255,255,.04);border-radius:12px;padding:8px 10px;display:flex;flex-direction:column;justify-content:center;gap:5px">
          <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:1px">Carico sistema</div>
          ${loadRow('1 min', l1, 'l1')}
          ${loadRow('5 min', l5, 'l5')}
          ${loadRow('15 min', l15, 'l15')}
        </div>
      </div>

      <!-- Sparklines CPU + RAM -->
      <div style="display:flex;gap:7px">
        <div class="syk-sp">
          <div class="syk-spl" style="color:${cpuC}">▸ Processore</div>
          <div data-syv="cpu-sp" style="height:34px"></div>
        </div>
        <div class="syk-sp">
          <div class="syk-spl" style="color:${ramC}">▸ RAM</div>
          <div data-syv="ram-sp" style="height:34px"></div>
        </div>
      </div>

      <!-- Rete -->
      ${(c.netin||c.netout)?`<div style="display:flex;align-items:center;gap:7px;padding:6px 10px;border-radius:10px;background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.15)">
        <div style="font-size:13px">🌐</div>
        <div style="display:flex;flex-direction:column;gap:2px;min-width:90px">
          <div data-syv="ni" style="font-size:10px;font-weight:700;color:#bae6fd">↓ In: ${fmtNet(niV)}</div>
          <div data-syv="no" style="font-size:10px;font-weight:700;color:#7dd3fc">↑ Out: ${fmtNet(noV)}</div>
        </div>
        <div data-syv="net-sp" style="flex:1;height:28px"></div>
      </div>`:''}

      <!-- Footer -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto">
        <div data-syv="uptime" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)">⏱ ${uptimeText(h,c.boot)}</div>
        <div data-syv="updates" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:${upd?'rgba(34,197,94,.12)':'rgba(255,255,255,.06)'};border:1px solid ${upd?'rgba(34,197,94,.3)':'rgba(255,255,255,.1)'};color:${upd?'#86efac':'rgba(255,255,255,.8)'}">⬆ ${upd} aggiorn.</div>
      </div>

    </div>`;
  }

  function _patch(card, el) {
    const h = H(); const c = cfgFor(card);
    const cpuV=num(S(h,c.cpu)), ramV=num(S(h,c.ram)), dskV=num(S(h,c.disk));
    const tmpV=num(S(h,c.temp)), swpV=num(S(h,c.swap));
    const l1=num(S(h,c.load1)), l5=num(S(h,c.load5)), l15=num(S(h,c.load15));
    const niV=num(S(h,c.netin)), noV=num(S(h,c.netout));
    const upd=updatesCount(h);
    const tCol=tempColor(tmpV), cpuC=usageColor(cpuV??0), ramC='#a78bfa', dskC=usageColor(dskV??0), swpC=usageColor(swpV??0);

    pushBuf(el,'cpu',cpuV); pushBuf(el,'ram',ramV); pushBuf(el,'net',niV);

    updateRing(el,'cpu',cpuV,cpuC,70); updateRing(el,'ram',ramV,ramC,70);
    updateRing(el,'dsk',dskV,dskC,70); updateRing(el,'swp',swpV,swpC,70);

    const te=el.querySelector('[data-syv="temp"]');
    if(te){te.textContent=tmpV==null?'—':tmpV.toFixed(1)+'°';te.style.color=tCol;te.className=tmpV!=null&&tmpV>=70?'syk-hot':'';}

    // Carico barre
    [[l1,'l1'],[l5,'l5'],[l15,'l15']].forEach(([v,k])=>{
      const txt=el.querySelector('[data-syv="'+k+'"]');
      const bar=el.querySelector('[data-bar="'+k+'"]');
      const col=loadColor(v??0);
      if(txt){txt.textContent=v==null?'—':v.toFixed(2);txt.style.color=col;}
      if(bar){bar.style.width=Math.min(100,((v??0)/4)*100).toFixed(1)+'%';bar.style.background=col;}
    });

    const ni=el.querySelector('[data-syv="ni"]'); if(ni) ni.textContent='↓ In: '+fmtNet(niV);
    const no=el.querySelector('[data-syv="no"]'); if(no) no.textContent='↑ Out: '+fmtNet(noV);

    const ue=el.querySelector('[data-syv="uptime"]'); if(ue) ue.textContent='⏱ '+uptimeText(h,c.boot);
    const ude=el.querySelector('[data-syv="updates"]');
    if(ude){ude.textContent='⬆ '+upd+' aggiorn.';ude.style.background=upd?'rgba(34,197,94,.12)':'rgba(255,255,255,.06)';ude.style.borderColor=upd?'rgba(34,197,94,.3)':'rgba(255,255,255,.1)';ude.style.color=upd?'#86efac':'rgba(255,255,255,.8)';}

    const rid=((el.querySelector('[id^="syc"]')||{}).id)||'sycx';
    function redrawSp(key,col,sfx,h2){
      const sp=el.querySelector('[data-syv="'+key+'"]'); if(!sp) return;
      const buf=(el._sycBuf&&el._sycBuf[key.replace('-sp','')||key])||[];
      sp.innerHTML=sparkSVG(buf,sp.offsetWidth||80,h2||34,col,rid+sfx);
    }
    redrawSp('cpu-sp',cpuC,'gc',34);
    redrawSp('ram-sp',ramC,'gr',34);
    const netSp=el.querySelector('[data-syv="net-sp"]');
    if(netSp){const buf=(el._sycBuf&&el._sycBuf.net)||[];netSp.innerHTML=sparkSVG(buf,netSp.offsetWidth||90,28,'#38bdf8',rid+'gn');}
  }

  function update(card, hass, el) {
    if (!el.querySelector('[data-arc]')) { el.innerHTML = render(card); return; }
    _patch(card, el);
  }
  function mount(card, hass, el) {
    if (el._sycBound) return; el._sycBound = true;
    setTimeout(() => _patch(card, el), 80);
  }

  /* ── CONFIG POPUP ── */
  function openCfg(card, el) {
    const h = H(); const c = load(card);
    const states = (h && h.states) || {};
    const allIds = Object.keys(states).sort();
    const stInp = 'width:100%;padding:10px 11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:10;max-height:180px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 11px 11px;display:none';
    const stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px;display:block';
    const stBase = 'width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:13px;box-sizing:border-box';

    function field(fid, lbl2, val, hint) {
      return `<div style="margin-bottom:10px;position:relative">
        <label style="${stLbl}">${lbl2}</label>
        ${hint ? `<div style="font-size:10px;color:#475569;margin-bottom:3px;font-family:monospace">${hint}</div>` : ''}
        <input id="${fid}" type="text" value="${(val||'').replace(/"/g,'&quot;')}" autocomplete="off"
          placeholder="Clicca per scegliere oppure scrivi…" style="${stInp}">
        <div id="${fid}-d" style="${stDrop}"></div>
      </div>`;
    }

    const cf = cfgFor(card);
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.74);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML = `<div style="width:min(460px,95vw);background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9;max-height:90vh;overflow-y:auto">
      <div style="font-size:16px;font-weight:800;margin-bottom:14px">🖥️ Configura Sistema</div>
      <div style="margin-bottom:12px">
        <label style="${stLbl}">Nome del sistema</label>
        <input id="sy-name" type="text" value="${(c.name||'').replace(/"/g,'&quot;')}" placeholder="es. Mini PC, NAS, Server…" style="${stBase}">
      </div>
      ${field('sy-cpu',   'Uso Processore (%)',          cf.cpu,    'sensor.processor_use')}
      ${field('sy-ram',   'Utilizzo RAM (%)',             cf.ram,    'sensor.memory_use_percent')}
      ${field('sy-disk',  'Utilizzo Disco (%)',           cf.disk,   'sensor.disk_use_percent')}
      ${field('sy-swap',  'Utilizzo Swap (%)',            cf.swap,   'sensor.swap_use_percent')}
      ${field('sy-temp',  'Temperatura Processore (°C)',  cf.temp,   'sensor.processor_temperature')}
      ${field('sy-boot',  'Tempo di attività (last boot)',cf.boot,   'sensor.last_boot')}
      ${field('sy-load1', 'Carico sistema — 1 minuto',   cf.load1,  'sensor.load_1m')}
      ${field('sy-load5', 'Carico sistema — 5 minuti',   cf.load5,  'sensor.load_5m')}
      ${field('sy-load15','Carico sistema — 15 minuti',  cf.load15, 'sensor.load_15m')}
      ${field('sy-netin', 'Traffico di rete in entrata',  cf.netin,  'sensor.network_throughput_in_enp2s0')}
      ${field('sy-netout','Traffico di rete in uscita',   cf.netout, 'sensor.network_throughput_out_enp2s0')}
      ${field('sy-ip',    'Indirizzo IP locale',          cf.ip,     'sensor.ipv4_address_enp2s0')}
      <div style="display:flex;gap:10px;margin-top:16px">
        <button id="sy-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>
        <button id="sy-save"   style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
    ov.addEventListener('click', e => { if (e.target === ov) close(); });

    ['sy-cpu','sy-ram','sy-disk','sy-swap','sy-temp','sy-boot','sy-load1','sy-load5','sy-load15','sy-netin','sy-netout','sy-ip'].forEach(fid => {
      const inp2 = ov.querySelector('#' + fid);
      const drop = ov.querySelector('#' + fid + '-d');
      if (!inp2 || !drop) return;
      function showDrop() {
        const q = inp2.value.toLowerCase().trim();
        const hits = (q
          ? allIds.filter(id => id.toLowerCase().includes(q) || ((states[id]?.attributes?.friendly_name||'').toLowerCase().includes(q)))
          : allIds
        ).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(id => {
          const fn = states[id]?.attributes?.friendly_name || '';
          return `<div data-pick="${id}" style="padding:6px 11px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)">
            <span style="color:#e2e8f0">${id}</span>${fn?`<span style="color:#475569;margin-left:7px;font-family:system-ui;font-size:10px">${fn}</span>`:''}
          </div>`;
        }).join('');
        drop.querySelectorAll('[data-pick]').forEach(row => {
          row.addEventListener('mousedown', ev => { ev.preventDefault(); inp2.value = row.getAttribute('data-pick'); drop.style.display = 'none'; });
          row.addEventListener('mouseover', () => { row.style.background = 'rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout',  () => { row.style.background = ''; });
        });
      }
      inp2.addEventListener('focus', showDrop);
      inp2.addEventListener('input', showDrop);
      inp2.addEventListener('blur',  () => setTimeout(() => { drop.style.display = 'none'; }, 200));
    });

    ov.querySelector('#sy-cancel').addEventListener('click', close);
    ov.querySelector('#sy-save').addEventListener('click', () => {
      save(card, {
        name:   ov.querySelector('#sy-name').value.trim(),
        cpu:    ov.querySelector('#sy-cpu').value.trim(),
        ram:    ov.querySelector('#sy-ram').value.trim(),
        disk:   ov.querySelector('#sy-disk').value.trim(),
        swap:   ov.querySelector('#sy-swap').value.trim(),
        temp:   ov.querySelector('#sy-temp').value.trim(),
        boot:   ov.querySelector('#sy-boot').value.trim(),
        load1:  ov.querySelector('#sy-load1').value.trim(),
        load5:  ov.querySelector('#sy-load5').value.trim(),
        load15: ov.querySelector('#sy-load15').value.trim(),
        netin:  ov.querySelector('#sy-netin').value.trim(),
        netout: ov.querySelector('#sy-netout').value.trim(),
        ip:     ov.querySelector('#sy-ip').value.trim(),
      });
      close();
      try { el.innerHTML = render(card); el._sycBound = false; mount(card, H(), el); } catch (e) {}
    });
  }

  const CARD = {
    id: 'system-card', name: 'Sistema', icon: '🖥️', version: '3.0',
    desc: 'Mini PC / Server: CPU, RAM, Disco, Swap, Temperatura, Carico, Rete — ring gauge animati + sparkline live.',
    colSpan: 2, rowSpan: 3,
    render, mount, update, configure: openCfg,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: system-card v' + CARD.version); } catch (e) {}
})();
