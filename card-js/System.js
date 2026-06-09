/* frarik-version: 1.0 */
/**
 * System.js — FratechStore card "Sistema"
 * CPU, RAM, disco, temperatura, uptime + numero di aggiornamenti disponibili (update.*).
 * Entità auto-rilevate (System Monitor di HA) o configurabili dal ⚙.
 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(card) { return 'frarik_systemcard_' + (card.id || 'x'); }
  function load(card) { try { return JSON.parse(localStorage.getItem(keyOf(card)) || '{}') || {}; } catch (e) { return {}; } }
  function save(card, o) { try { localStorage.setItem(keyOf(card), JSON.stringify(o)); } catch (e) {} }
  function S(h, id) { const s = h && h.states && h.states[id]; return s ? s.state : null; }
  function num(v) { const x = parseFloat(v); return isNaN(x) ? null : x; }
  function has(h, id) { return !!(h && h.states && h.states[id]); }

  function autodetect(h) {
    const f = (...c) => c.find(id => has(h, id)) || '';
    return {
      cpu:  f('sensor.processor_use', 'sensor.cpu_usage', 'sensor.system_monitor_processor_use'),
      ram:  f('sensor.memory_use_percent', 'sensor.system_monitor_memory_use_percent', 'sensor.ram_usage'),
      disk: f('sensor.disk_use_percent', 'sensor.system_monitor_disk_use_percent_root', 'sensor.disk_usage'),
      temp: f('sensor.processor_temperature', 'sensor.system_monitor_processor_temperature', 'sensor.cpu_temperature'),
      boot: f('sensor.last_boot', 'sensor.system_monitor_last_boot')
    };
  }
  function cfgFor(card) {
    const c = load(card), a = autodetect(H());
    return { cpu: c.cpu || a.cpu, ram: c.ram || a.ram, disk: c.disk || a.disk, temp: c.temp || a.temp, boot: c.boot || a.boot };
  }
  function barColor(p) { if (p >= 90) return '#ef4444'; if (p >= 75) return '#f97316'; if (p >= 50) return '#fbbf24'; return '#22c55e'; }
  function uptimeText(h, id) {
    if (!id) return '—';
    const s = S(h, id); if (!s) return '—';
    const t = new Date(s).getTime(); if (isNaN(t)) return '—';
    let sec = Math.floor((Date.now() - t) / 1000); if (sec < 0) sec = 0;
    const d = Math.floor(sec / 86400); sec -= d * 86400;
    const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60);
    return (d ? d + 'g ' : '') + hh + 'h ' + mm + 'm';
  }
  function updatesCount(h) { let n = 0; const st = (h && h.states) || {}; for (const id in st) { if (id.indexOf('update.') === 0 && st[id].state === 'on') n++; } return n; }

  function bar(label, id, h) {
    const v = num(S(h, id)); const p = v == null ? 0 : Math.max(0, Math.min(100, v)); const col = barColor(p);
    return `<div class="syc-row">
      <div class="syc-rl">${label}</div>
      <div class="syc-track"><div class="syc-fill" style="width:${p}%;background:${col}"></div></div>
      <div class="syc-val" style="color:${col}">${v == null ? '—' : Math.round(v) + '%'}</div>
    </div>`;
  }

  function render(card) {
    const h = H(); const c = cfgFor(card); const rid = 'syc' + (card.id || Math.random().toString(36).slice(2));
    const temp = num(S(h, c.temp)); const ups = updatesCount(h);
    return `<style>${css(rid)}</style><div id="${rid}" class="syc-root">
      <div class="syc-hdr"><div class="syc-ico">🖥️</div><div class="syc-tit">Sistema</div><div class="syc-gear" data-syc="gear" title="Impostazioni">⚙️</div></div>
      <div class="syc-bars">
        ${bar('CPU', c.cpu, h)}
        ${bar('RAM', c.ram, h)}
        ${bar('Disco', c.disk, h)}
      </div>
      <div class="syc-foot">
        <div class="syc-pill">🌡️ ${temp == null ? '—' : Math.round(temp) + '°'}</div>
        <div class="syc-pill">⏱️ ${uptimeText(h, c.boot)}</div>
        <div class="syc-pill ${ups ? 'on' : ''}">⬆️ ${ups} update</div>
      </div>
    </div>`;
  }

  function css(rid) {
    return `
#${rid}.syc-root{position:relative;width:100%;height:100%;min-height:120px;border-radius:18px;overflow:hidden;padding:14px 16px;box-sizing:border-box;
  font-family:var(--primary-font-family,'Inter',system-ui,sans-serif);color:#e8ebf5;display:flex;flex-direction:column;gap:12px;
  background:linear-gradient(150deg,#0c1322 0%,#0a0f1c 60%,#0c1626 100%);border:1px solid rgba(99,102,241,.22);box-shadow:0 10px 40px rgba(0,0,0,.45);}
#${rid} .syc-hdr{display:flex;align-items:center;gap:9px;}
#${rid} .syc-ico{font-size:18px;}
#${rid} .syc-tit{flex:1;font-size:14px;font-weight:800;letter-spacing:-.2px;}
#${rid} .syc-gear{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:rgba(255,255,255,.45);background:rgba(255,255,255,.06);}
#${rid} .syc-gear:hover{color:#fff;background:rgba(255,255,255,.14);}
#${rid} .syc-bars{display:flex;flex-direction:column;gap:9px;}
#${rid} .syc-row{display:flex;align-items:center;gap:10px;}
#${rid} .syc-rl{width:46px;font-size:11px;font-weight:700;color:rgba(255,255,255,.6);flex-shrink:0;}
#${rid} .syc-track{flex:1;height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;}
#${rid} .syc-fill{height:100%;border-radius:99px;transition:width .4s ease;}
#${rid} .syc-val{width:42px;text-align:right;font-size:12px;font-weight:800;flex-shrink:0;}
#${rid} .syc-foot{display:flex;gap:7px;flex-wrap:wrap;margin-top:auto;}
#${rid} .syc-pill{font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.8);}
#${rid} .syc-pill.on{background:rgba(34,197,94,.16);border-color:rgba(34,197,94,.4);color:#86efac;}
`;
  }

  function mount(card, hass, el) {
    if (el._sycBound) return; el._sycBound = true;
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-syc]');
      if (t && t.getAttribute('data-syc') === 'gear') { e.stopPropagation(); openCfg(card, el, hass); }
    });
  }
  function update(card, hass, el) { try { el.innerHTML = render(card); } catch (e) {} }

  function openCfg(card, el, hass) {
    const h = H(); const c = load(card); const a = autodetect(h);
    const states = (h && h.states) || {};
    const opts = (prefix, sel) => `<option value="">— auto —</option>` +
      Object.keys(states).filter(id => id.startsWith(prefix)).sort().map(id =>
        `<option value="${id}" ${id === sel ? 'selected' : ''}>${(states[id].attributes && states[id].attributes.friendly_name) || id}</option>`).join('');
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.74);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    const sel = 'width:100%;margin-top:5px;padding:10px 11px;border-radius:10px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.2);font-size:12px';
    const lbl = 'display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-top:12px';
    ov.innerHTML = `<div style="width:min(440px,94vw);max-height:90vh;overflow:auto;background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9">
        <div style="font-size:16px;font-weight:800;margin-bottom:6px">🖥️ Configura Sistema</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:6px">Lascia "auto" per usare i sensori System Monitor rilevati automaticamente.</div>
        <label style="${lbl}">CPU (%)</label><select id="sy-cpu" style="${sel}">${opts('sensor.', c.cpu)}</select>
        <label style="${lbl}">RAM (%)</label><select id="sy-ram" style="${sel}">${opts('sensor.', c.ram)}</select>
        <label style="${lbl}">Disco (%)</label><select id="sy-disk" style="${sel}">${opts('sensor.', c.disk)}</select>
        <label style="${lbl}">Temperatura</label><select id="sy-temp" style="${sel}">${opts('sensor.', c.temp)}</select>
        <label style="${lbl}">Uptime (last_boot)</label><select id="sy-boot" style="${sel}">${opts('sensor.', c.boot)}</select>
        <div style="display:flex;gap:10px;margin-top:20px">
          <button id="sy-cancel" style="flex:1;padding:12px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>
          <button id="sy-save" style="flex:1;padding:12px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('#sy-cancel').addEventListener('click', close);
    ov.querySelector('#sy-save').addEventListener('click', () => {
      save(card, {
        cpu: ov.querySelector('#sy-cpu').value, ram: ov.querySelector('#sy-ram').value,
        disk: ov.querySelector('#sy-disk').value, temp: ov.querySelector('#sy-temp').value, boot: ov.querySelector('#sy-boot').value
      });
      close();
      try { el.innerHTML = render(card); } catch (e) {}
    });
  }

  const CARD = {
    id: 'system-card', name: 'Sistema', icon: '🖥️', version: '1.0',
    desc: 'CPU, RAM, disco, temperatura, uptime e numero di aggiornamenti disponibili.',
    render, mount, update
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: system-card v' + CARD.version); } catch (e) {}
})();
