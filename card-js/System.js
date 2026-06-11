/* frarik-version: 2.1 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(card) { return 'frarik_systemcard_' + (card.id || 'x'); }
  function load(card) { try { return JSON.parse(localStorage.getItem(keyOf(card)) || '{}') || {}; } catch (e) { return {}; } }
  function save(card, o) { try { localStorage.setItem(keyOf(card), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && id && h.states && h.states[id]; return s ? s.state : null; }
  function num(v) { const x = parseFloat(v); return isNaN(x) ? null : x; }
  function has(h, id) { return !!(h && h.states && h.states[id]); }

  function autodetect(h) {
    const f = (...c) => c.find(id => has(h, id)) || '';
    return {
      cpu:  f('sensor.processor_use','sensor.cpu_usage','sensor.system_monitor_processor_use'),
      ram:  f('sensor.memory_use_percent','sensor.system_monitor_memory_use_percent','sensor.ram_usage'),
      disk: f('sensor.disk_use_percent','sensor.system_monitor_disk_use_percent_root','sensor.disk_usage'),
      temp: f('sensor.processor_temperature','sensor.system_monitor_processor_temperature','sensor.cpu_temperature'),
      boot: f('sensor.last_boot','sensor.system_monitor_last_boot'),
    };
  }
  function cfgFor(card) {
    const c = load(card), a = autodetect(H());
    return {
      cpu: c.cpu||a.cpu, ram: c.ram||a.ram, disk: c.disk||a.disk,
      temp: c.temp||a.temp, boot: c.boot||a.boot,
      netin: c.netin||'', netout: c.netout||'',
      diskr: c.diskr||'', diskw: c.diskw||'',
    };
  }

  function usageColor(p) {
    if (p >= 90) return '#ef4444';
    if (p >= 75) return '#f97316';
    if (p >= 50) return '#fbbf24';
    return '#22c55e';
  }
  function tempColor(t) {
    if (t == null) return '#94a3b8';
    if (t >= 85) return '#ef4444';
    if (t >= 70) return '#f97316';
    if (t >= 55) return '#fbbf24';
    return '#22c55e';
  }
  function uptimeText(h, id) {
    if (!id) return '—';
    const s = S(h, id); if (!s) return '—';
    const t = new Date(s).getTime(); if (isNaN(t)) return '—';
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
  function netFmt(h, id) {
    const v = num(S(h, id)); if (v == null || !id) return null;
    if (v >= 1048576) return (v / 1048576).toFixed(1) + ' MB/s';
    if (v >= 1024) return (v / 1024).toFixed(1) + ' KB/s';
    return Math.round(v) + ' B/s';
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
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / mx) * (h - 2) - 1;
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    const area = pts.join(' ') + ' ' + w + ',' + h + ' 0,' + h;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;overflow:hidden">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${col}" stop-opacity=".5"/>
        <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
      </linearGradient></defs>
      <polygon points="${area}" fill="url(#${gid})"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function ringHTML(key, pct, col, label) {
    const sz = 82, r = 29, cx = 41, cy = 41;
    const circ = +(2 * Math.PI * r).toFixed(2);
    const p = Math.max(0, Math.min(100, pct || 0));
    const dash = +((p / 100) * circ).toFixed(2);
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
      <svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="7"/>
        <circle data-arc="${key}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="7"
          stroke-dasharray="${dash} ${circ}" stroke-linecap="round"
          transform="rotate(-90 ${cx} ${cy})"
          style="transition:stroke-dasharray .8s ease-in-out,stroke .5s"/>
        <text data-txt="${key}" x="${cx}" y="${cy + 1}" text-anchor="middle" dominant-baseline="middle"
          fill="${col}" font-size="13px" font-weight="800" font-family="system-ui,sans-serif">
          ${pct == null ? '—' : Math.round(pct) + '%'}
        </text>
      </svg>
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.45);letter-spacing:.07em;text-transform:uppercase">${label}</div>
    </div>`;
  }

  function updateRing(el, key, pct, col) {
    const arc = el.querySelector('[data-arc="' + key + '"]');
    const txt = el.querySelector('[data-txt="' + key + '"]');
    if (!arc || !txt) return;
    const r = 29, circ = +(2 * Math.PI * r).toFixed(2);
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
    const cpuV = num(S(h, c.cpu)), ramV = num(S(h, c.ram)), dskV = num(S(h, c.disk));
    const tmpV = num(S(h, c.temp)), upd = updatesCount(h);
    const tCol = tempColor(tmpV);
    const cpuC = usageColor(cpuV ?? 0), ramC = '#a78bfa', dskC = usageColor(dskV ?? 0);
    const ni = netFmt(h, c.netin), no = netFmt(h, c.netout);
    const dr = netFmt(h, c.diskr), dw = netFmt(h, c.diskw);
    const hotAnim = tmpV != null && tmpV >= 70
      ? `@keyframes ${rid}p{0%,100%{text-shadow:0 0 10px ${tCol}99}50%{text-shadow:0 0 28px ${tCol}dd,0 0 50px ${tCol}44}}`
      : '';
    const scanAnim = `@keyframes ${rid}s{0%{background-position:0% 0%}100%{background-position:200% 0%}}`;

    return `<style>
      @keyframes ${rid}blink{0%,100%{opacity:1}50%{opacity:.25}}
      ${hotAnim}
      ${scanAnim}
      #${rid}{position:relative;width:100%;height:100%;min-height:240px;border-radius:18px;
        padding:14px 15px;box-sizing:border-box;font-family:system-ui,sans-serif;color:#e8ebf5;
        display:flex;flex-direction:column;gap:9px;overflow:hidden;
        background:linear-gradient(150deg,#0c1322 0%,#090e1a 55%,#0c1626 100%);
        border:1px solid rgba(99,102,241,.22);}
      #${rid}::before{content:'';position:absolute;inset:0;pointer-events:none;
        background:linear-gradient(105deg,transparent 40%,rgba(99,102,241,.04) 50%,transparent 60%);
        background-size:200% 100%;
        animation:${rid}s 6s linear infinite;border-radius:inherit;}
      #${rid} .syk-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;
        margin-right:6px;animation:${rid}blink 2s ease-in-out infinite;}
      #${rid} .syk-hot{animation:${rid}p 1.8s ease-in-out infinite;}
      #${rid} .syk-sp{flex:1;background:rgba(255,255,255,.03);border-radius:10px;padding:5px 8px;}
      #${rid} .syk-spl{font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:3px;}
    </style>
    <div id="${rid}">

      <div style="text-align:center;font-size:22px;font-weight:800;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
        <span class="syk-dot"></span>${nm}
      </div>

      <div style="display:flex;justify-content:space-around;align-items:flex-start">
        ${ringHTML('cpu', cpuV, cpuC, 'CPU')}
        ${ringHTML('ram', ramV, ramC, 'RAM')}
        ${ringHTML('dsk', dskV, dskC, 'Disco')}
      </div>

      <div style="display:flex;align-items:stretch;gap:8px">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border-radius:12px;padding:8px 16px;min-width:74px;flex-shrink:0">
          <div data-syv="temp" class="${tmpV != null && tmpV >= 70 ? 'syk-hot' : ''}" style="font-size:30px;font-weight:800;line-height:1;color:${tCol}">${tmpV == null ? '—' : Math.round(tmpV) + '°'}</div>
          <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.07em;margin-top:3px">Temp</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:5px">
          <div data-syv="uptime" style="font-size:11px;font-weight:700;padding:5px 10px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)">⏱ ${uptimeText(h, c.boot)}</div>
          <div data-syv="updates" style="font-size:11px;font-weight:700;padding:5px 10px;border-radius:99px;background:${upd ? 'rgba(34,197,94,.12)' : 'rgba(255,255,255,.06)'};border:1px solid ${upd ? 'rgba(34,197,94,.3)' : 'rgba(255,255,255,.1)'};color:${upd ? '#86efac' : 'rgba(255,255,255,.8)'}">⬆ ${upd} aggiornamenti</div>
        </div>
      </div>

      <div style="display:flex;gap:7px">
        <div class="syk-sp">
          <div class="syk-spl" style="color:${cpuC}">▸ CPU</div>
          <div data-syv="cpu-sp" style="height:32px"></div>
        </div>
        <div class="syk-sp">
          <div class="syk-spl" style="color:${ramC}">▸ RAM</div>
          <div data-syv="ram-sp" style="height:32px"></div>
        </div>
      </div>

      ${(c.netin || c.netout) ? `<div style="display:flex;align-items:center;gap:7px;padding:6px 10px;border-radius:10px;background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.18)">
        <div style="font-size:11px;color:#7dd3fc;font-weight:700;flex-shrink:0">🌐 Rete</div>
        <div data-syv="net" style="flex:1;font-size:11px;font-weight:700;color:#bae6fd">↓ ${ni || '—'} &nbsp; ↑ ${no || '—'}</div>
        <div data-syv="net-sp" style="width:80px;height:22px"></div>
      </div>` : ''}

      ${(c.diskr || c.diskw) ? `<div style="display:flex;align-items:center;gap:7px;padding:6px 10px;border-radius:10px;background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.16)">
        <div style="font-size:11px;color:#fcd34d;font-weight:700;flex-shrink:0">💾 Disco I/O</div>
        <div data-syv="diskio" style="flex:1;font-size:11px;font-weight:700;color:#fde68a">R: ${dr || '—'} &nbsp; W: ${dw || '—'}</div>
      </div>` : ''}

    </div>`;
  }

  function _patch(card, el) {
    const h = H(); const c = cfgFor(card);
    const cpuV = num(S(h, c.cpu)), ramV = num(S(h, c.ram)), dskV = num(S(h, c.disk));
    const tmpV = num(S(h, c.temp)), upd = updatesCount(h);
    const tCol = tempColor(tmpV);
    const cpuC = usageColor(cpuV ?? 0), ramC = '#a78bfa', dskC = usageColor(dskV ?? 0);

    pushBuf(el, 'cpu', cpuV);
    pushBuf(el, 'ram', ramV);
    if (c.netin) pushBuf(el, 'net', num(S(h, c.netin)));

    updateRing(el, 'cpu', cpuV, cpuC);
    updateRing(el, 'ram', ramV, ramC);
    updateRing(el, 'dsk', dskV, dskC);

    const te = el.querySelector('[data-syv="temp"]');
    if (te) { te.textContent = tmpV == null ? '—' : Math.round(tmpV) + '°'; te.style.color = tCol; te.className = (tmpV != null && tmpV >= 70) ? 'syk-hot' : ''; }
    const ue = el.querySelector('[data-syv="uptime"]');
    if (ue) ue.textContent = '⏱ ' + uptimeText(h, c.boot);
    const ude = el.querySelector('[data-syv="updates"]');
    if (ude) {
      ude.textContent = '⬆ ' + upd + ' aggiornamenti';
      ude.style.background = upd ? 'rgba(34,197,94,.12)' : 'rgba(255,255,255,.06)';
      ude.style.borderColor = upd ? 'rgba(34,197,94,.3)' : 'rgba(255,255,255,.1)';
      ude.style.color = upd ? '#86efac' : 'rgba(255,255,255,.8)';
    }
    const ne = el.querySelector('[data-syv="net"]');
    if (ne) { const ni = netFmt(h, c.netin), no = netFmt(h, c.netout); ne.innerHTML = '↓ ' + (ni || '—') + ' &nbsp; ↑ ' + (no || '—'); }
    const de = el.querySelector('[data-syv="diskio"]');
    if (de) { const dr = netFmt(h, c.diskr), dw = netFmt(h, c.diskw); de.innerHTML = 'R: ' + (dr || '—') + ' &nbsp; W: ' + (dw || '—'); }

    const rid = (el.querySelector('[id^="syc"]') || {}).id || 'sycx';
    function redrawSp(key, col, sfx) {
      const sp = el.querySelector('[data-syv="' + key + '-sp"]'); if (!sp) return;
      const buf = (el._sycBuf && el._sycBuf[key]) || [];
      sp.innerHTML = sparkSVG(buf, sp.offsetWidth || 80, parseInt(sp.style.height) || 32, col, rid + sfx);
    }
    redrawSp('cpu', cpuC, 'gc');
    redrawSp('ram', ramC, 'gr');
    redrawSp('net', '#38bdf8', 'gn');
  }

  function update(card, hass, el) {
    if (!el.querySelector('[data-arc]')) { el.innerHTML = render(card); return; }
    _patch(card, el);
  }

  function mount(card, hass, el) {
    if (el._sycBound) return; el._sycBound = true;
    setTimeout(() => _patch(card, el), 60);
  }

  /* ── CONFIG POPUP ── */
  function openCfg(card, el) {
    const h = H(); const c = load(card);
    const states = (h && h.states) || {};
    const allIds = Object.keys(states).sort();

    const stInp = 'width:100%;padding:10px 11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:10;max-height:180px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 10px 10px;display:none';
    const stLbl = 'font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px;display:block';
    const stInpBase = 'width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:13px;box-sizing:border-box';

    function field(fid, lbl2, val) {
      return `<div style="margin-bottom:10px;position:relative">
        <label style="${stLbl}">${lbl2}</label>
        <input id="${fid}" type="text" value="${(val || '').replace(/"/g, '&quot;')}" autocomplete="off"
          placeholder="Clicca per scegliere oppure scrivi per filtrare…"
          style="${stInp}">
        <div id="${fid}-d" style="${stDrop}"></div>
      </div>`;
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.74);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    ov.innerHTML = `<div style="width:min(460px,95vw);background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9;max-height:90vh;overflow-y:auto">
      <div style="font-size:16px;font-weight:800;margin-bottom:14px">🖥️ Configura Sistema</div>
      <div style="margin-bottom:12px">
        <label style="${stLbl}">Nome</label>
        <input id="sy-name" type="text" value="${(c.name||'').replace(/"/g,'&quot;')}" placeholder="es. Mini PC, NAS, Server…" style="${stInpBase}">
      </div>
      ${field('sy-cpu',    'CPU (%)',               c.cpu    ||'')}
      ${field('sy-ram',    'RAM (%)',               c.ram    ||'')}
      ${field('sy-disk',   'Disco (%)',             c.disk   ||'')}
      ${field('sy-temp',   'Temperatura (°C)',      c.temp   ||'')}
      ${field('sy-boot',   'Uptime / last boot',    c.boot   ||'')}
      ${field('sy-netin',  'Network In  (opz.)',    c.netin  ||'')}
      ${field('sy-netout', 'Network Out (opz.)',    c.netout ||'')}
      ${field('sy-diskr',  'Disco Read  (opz.)',    c.diskr  ||'')}
      ${field('sy-diskw',  'Disco Write (opz.)',    c.diskw  ||'')}
      <div style="display:flex;gap:10px;margin-top:16px">
        <button id="sy-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>
        <button id="sy-save"   style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
    ov.addEventListener('click', e => { if (e.target === ov) close(); });

    // Combobox: show all on focus, filter on type
    ['sy-cpu','sy-ram','sy-disk','sy-temp','sy-boot','sy-netin','sy-netout','sy-diskr','sy-diskw'].forEach(fid => {
      const inp2 = ov.querySelector('#' + fid);
      const drop = ov.querySelector('#' + fid + '-d');
      if (!inp2 || !drop) return;

      function showDrop() {
        const q = inp2.value.toLowerCase().trim();
        const hits = (q
          ? allIds.filter(id => id.toLowerCase().includes(q) || ((states[id]?.attributes?.friendly_name || '').toLowerCase().includes(q)))
          : allIds
        ).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.style.display = 'block';
        drop.innerHTML = hits.map(id => {
          const fn = states[id]?.attributes?.friendly_name || '';
          return `<div data-pick="${id}" style="padding:6px 10px;cursor:pointer;font-size:11px;border-bottom:1px solid rgba(255,255,255,.04)">
            <span style="color:#e2e8f0">${id}</span>${fn ? `<span style="color:#475569;margin-left:7px;font-family:system-ui;font-size:10px">${fn}</span>` : ''}
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
        temp:   ov.querySelector('#sy-temp').value.trim(),
        boot:   ov.querySelector('#sy-boot').value.trim(),
        netin:  ov.querySelector('#sy-netin').value.trim(),
        netout: ov.querySelector('#sy-netout').value.trim(),
        diskr:  ov.querySelector('#sy-diskr').value.trim(),
        diskw:  ov.querySelector('#sy-diskw').value.trim(),
      });
      close();
      try { el.innerHTML = render(card); el._sycBound = false; mount(card, H(), el); } catch (e) {}
    });
  }

  const CARD = {
    id: 'system-card', name: 'Sistema', icon: '🖥️', version: '2.1',
    desc: 'CPU, RAM, disco, temperatura e rete con ring gauge animati, sparkline live e scan background.',
    colSpan: 2, rowSpan: 3,
    render, mount, update, configure: openCfg,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: system-card v' + CARD.version); } catch (e) {}
})();
