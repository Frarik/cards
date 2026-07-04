/* frarik-version: 1.0 */
/**
 * GruppoTemperatura.js — Distintivo FratechStore v1.0
 * Visualizza temperatura e umidità per più sensori con colori dinamici e comfort indicator
 */
(function () {
  'use strict';

  const ID = 'gruppo-temperatura';

  /* ── color helpers ─────────────────────────────────────────── */
  function _tempColor(v) {
    if (v == null || isNaN(v)) return 'rgba(255,255,255,.35)';
    if (v <= 10) return '#38bdf8';
    if (v <= 15) return '#7dd3fc';
    if (v <= 19) return '#86efac';
    if (v <= 25) return '#4ade80';
    if (v <= 28) return '#facc15';
    if (v <= 32) return '#fb923c';
    return '#f87171';
  }

  function _humColor(v) {
    if (v == null || isNaN(v)) return 'rgba(255,255,255,.35)';
    if (v < 25 || v > 75) return '#f87171';
    if (v < 30 || v > 65) return '#fb923c';
    if (v < 40 || v > 60) return '#facc15';
    return '#4ade80';
  }

  function _comfortInfo(temp, hum) {
    const tOk   = temp != null && temp >= 19 && temp <= 25;
    const hOk   = hum  != null && hum  >= 40 && hum  <= 60;
    const tGood = temp != null && temp >= 17 && temp <= 27;
    const hGood = hum  != null && hum  >= 30 && hum  <= 65;
    const tBad  = temp != null && (temp < 10 || temp > 35);
    if (tOk && (hOk || hum == null))     return { label: 'Comfort',    emoji: '🌿', color: '#4ade80' };
    if (tBad)                             return { label: 'Critico',    emoji: '⚠️',  color: '#f87171' };
    if (tGood && (hGood || hum == null)) return { label: 'Buono',      emoji: '😊', color: '#a3e635' };
    return                                       { label: 'Attenzione', emoji: '🌡', color: '#fb923c' };
  }

  /* ── helpers ────────────────────────────────────────────────── */
  function H() {
    try { const h = window.frarikHass?.(); if (h?.states) return h; } catch (e) {}
    return null;
  }
  function liveH(raw) { return H() || (raw?.states ? raw : null); }
  function loadCfg(c) { return c && typeof c === 'object' ? c : {}; }
  function stateOf(h, id) { return h?.states?.[id]?.state ?? 'unknown'; }
  function nameOf(h, id) {
    const s = h?.states?.[id];
    return s?.attributes?.friendly_name || (id?.includes('.') ? id.split('.')[1].replace(/_/g, ' ') : (id || ''));
  }
  function eh(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function hex2rgba(hex, a) {
    let h = (hex || '').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return `rgba(255,255,255,${a})`;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }

  /* ── chip ───────────────────────────────────────────────────── */
  function chip(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const col  = c.color || '#38bdf8';

    let chipVal = '—';
    let chipCol = col;

    if (h && ents.length) {
      const temps = ents.map(e => parseFloat(stateOf(h, e.tempEntity))).filter(v => !isNaN(v));
      if (temps.length === 1) {
        chipVal = `${temps[0].toFixed(1)}°`;
        chipCol = _tempColor(temps[0]);
      } else if (temps.length > 1) {
        const min = Math.min(...temps), max = Math.max(...temps);
        chipVal = `${min.toFixed(0)}°–${max.toFixed(0)}°`;
        const extreme = Math.abs(max - 22) > Math.abs(min - 22) ? max : min;
        chipCol = _tempColor(extreme);
      }
    }

    return {
      icon:  `<span class="mdi mdi-thermometer" style="font-size:16px;line-height:1;color:inherit"></span>`,
      label: c.label || 'Temperatura',
      value: chipVal,
      color: chipCol,
    };
  }

  /* ── watchEntities ──────────────────────────────────────────── */
  function watchEntities(cfg) {
    const c    = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const ids  = [];
    ents.forEach(e => {
      if (e.tempEntity) ids.push(e.tempEntity);
      if (e.humEntity)  ids.push(e.humEntity);
    });
    return ids;
  }

  /* ── render popup ───────────────────────────────────────────── */
  function render(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    if (!ents.length) {
      return `<div style="padding:40px 24px;text-align:center;color:rgba(255,255,255,.3);font-size:12px">
        <div style="font-size:36px;margin-bottom:10px;opacity:.4">🌡️</div>
        Nessun sensore configurato.<br>
        <span style="font-size:10px;opacity:.6">Clicca ✏️ sulla chip per configurare.</span>
      </div>`;
    }

    const cards = ents.map(e => {
      if (!e.tempEntity) return '';

      const label   = e.label || nameOf(h, e.tempEntity);
      const tempRaw = h ? parseFloat(stateOf(h, e.tempEntity)) : NaN;
      const humRaw  = (e.humEntity && h) ? parseFloat(stateOf(h, e.humEntity)) : NaN;
      const tempVal = !isNaN(tempRaw) ? tempRaw : null;
      const humVal  = !isNaN(humRaw)  ? humRaw  : null;
      const unavail = tempVal == null;

      const tCol    = _tempColor(tempVal);
      const hCol    = _humColor(humVal);
      const comfort = _comfortInfo(tempVal, humVal);

      /* position on scale bars */
      const tPct = tempVal != null ? Math.min(100, Math.max(0, (tempVal / 40) * 100)) : 0;
      const hPct = humVal  != null ? Math.min(100, Math.max(0, humVal))               : 0;

      /* thermometer icon variant */
      const tIcoName = (tempVal != null && tempVal <= 15) ? 'thermometer-low'
                     : (tempVal != null && tempVal >= 28) ? 'thermometer-high'
                     : 'thermometer';

      const tempStr = tempVal != null ? tempVal.toFixed(1) : '—';
      const humStr  = humVal  != null ? Math.round(humVal).toString() : '—';

      const hasHum = !!e.humEntity;

      return `
        <div style="margin-bottom:14px;padding:16px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid ${unavail ? 'rgba(255,255,255,.08)' : hex2rgba(tCol,.22)};box-shadow:0 4px 24px ${unavail ? 'transparent' : hex2rgba(tCol,.08)}">

          <!-- Header -->
          <div style="display:flex;align-items:center;gap:9px;margin-bottom:14px">
            <div style="width:34px;height:34px;border-radius:10px;background:${unavail ? 'rgba(255,255,255,.06)' : hex2rgba(tCol,.14)};border:1px solid ${unavail ? 'rgba(255,255,255,.1)' : hex2rgba(tCol,.28)};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span class="mdi mdi-${tIcoName}" style="font-size:18px;color:${unavail ? 'rgba(255,255,255,.3)' : tCol}"></span>
            </div>
            <span style="flex:1;font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(label)}</span>
            ${!unavail
              ? `<span style="font-size:9px;font-weight:700;padding:4px 9px;border-radius:20px;background:${hex2rgba(comfort.color,.14)};border:1px solid ${hex2rgba(comfort.color,.3)};color:${comfort.color};white-space:nowrap">${comfort.emoji} ${comfort.label}</span>`
              : `<span style="font-size:10px;color:rgba(255,255,255,.28);font-style:italic">Non disponibile</span>`
            }
          </div>

          <!-- Value panels -->
          <div style="display:flex;gap:10px">

            <!-- Temperature panel -->
            <div style="flex:1;padding:13px 14px 11px;border-radius:14px;background:${hex2rgba(tCol,.08)};border:1px solid ${hex2rgba(tCol,.2)}">
              <div style="font-size:10px;color:rgba(255,255,255,.45);margin-bottom:6px;display:flex;align-items:center;gap:5px;font-weight:600;letter-spacing:.3px">
                <span class="mdi mdi-thermometer" style="font-size:12px;color:${tCol}"></span>
                TEMPERATURA
              </div>
              <div style="display:flex;align-items:baseline;gap:3px;margin-bottom:10px">
                <span style="font-size:34px;font-weight:900;color:${tCol};line-height:1;letter-spacing:-1.5px">${tempStr}</span>
                <span style="font-size:17px;font-weight:700;color:${tCol};opacity:.8">°C</span>
              </div>
              <!-- Scale bar -->
              <div style="height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden">
                <div style="width:${tPct}%;height:100%;border-radius:2px;background:linear-gradient(90deg,#38bdf8,${tCol});transition:width .5s ease"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:4px">
                <span style="font-size:8px;color:rgba(255,255,255,.22)">❄️ 0°</span>
                <span style="font-size:8px;color:rgba(255,255,255,.22)">🔥 40°</span>
              </div>
            </div>

            <!-- Humidity panel -->
            ${hasHum ? `<div style="flex:1;padding:13px 14px 11px;border-radius:14px;background:${hex2rgba(hCol,.08)};border:1px solid ${hex2rgba(hCol,.2)}">
              <div style="font-size:10px;color:rgba(255,255,255,.45);margin-bottom:6px;display:flex;align-items:center;gap:5px;font-weight:600;letter-spacing:.3px">
                <span class="mdi mdi-water-percent" style="font-size:12px;color:${hCol}"></span>
                UMIDITÀ
              </div>
              <div style="display:flex;align-items:baseline;gap:3px;margin-bottom:10px">
                <span style="font-size:34px;font-weight:900;color:${hCol};line-height:1;letter-spacing:-1.5px">${humStr}</span>
                <span style="font-size:17px;font-weight:700;color:${hCol};opacity:.8">%</span>
              </div>
              <!-- Scale bar -->
              <div style="height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden">
                <div style="width:${hPct}%;height:100%;border-radius:2px;background:linear-gradient(90deg,#38bdf8 0%,#4ade80 45%,#4ade80 55%,#f87171 100%);clip-path:inset(0 ${100-hPct}% 0 0);transition:clip-path .5s ease"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:4px">
                <span style="font-size:8px;color:rgba(255,255,255,.22)">🏜 0%</span>
                <span style="font-size:8px;color:rgba(255,255,255,.22)">💦 100%</span>
              </div>
            </div>` : ''}

          </div>
        </div>`;
    }).join('');

    return `<div id="gt-popup-body" style="padding:12px">${cards}</div>`;
  }

  /* ── mount ──────────────────────────────────────────────────── */
  function mount(cfg, rawHass, el) {
    if (el._gtPoll) return;
    el._gtPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gtPoll); delete el._gtPoll; return; }
      try {
        const h = H(); if (!h) return;
        el.innerHTML = render(cfg, h);
      } catch(e) {}
    }, 3000);
  }

  /* ── update ─────────────────────────────────────────────────── */
  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, rawHass); } catch(e) {}
  }

  /* ── configure ──────────────────────────────────────────────── */
  function configure(cfg, _el, onSave) {
    const c    = loadCfg(cfg);
    const ents = JSON.parse(JSON.stringify(Array.isArray(c.entities) ? c.entities : []));
    const h    = H();
    let _firstRender = true;
    let _acDrop = null;

    function _closeAc() {
      if (_acDrop) { try { _acDrop.remove(); } catch(e){} _acDrop = null; }
    }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 200;
      const useAbove = (window.innerHeight - rect.bottom - 6) < MAXH && rect.top > MAXH;
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${Math.max(rect.width,260)}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#0b1422;border:1px solid rgba(56,189,248,.32);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88)`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05)';
        r.innerHTML = `<div style="font-size:11px;font-weight:600;color:#fff">${eh(m.name)}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.38);margin-top:1px">${eh(m.id)}${m.st ? ' · '+eh(m.st) : ''}</div>`;
        r.onmouseover = () => r.style.background = 'rgba(56,189,248,.1)';
        r.onmouseout  = () => r.style.background = 'transparent';
        r.onmousedown = ev => { ev.preventDefault(); onPick(m.id, m.name); _closeAc(); };
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.oninput = () => { const q = (inp.value||'').toLowerCase().trim(); q ? _openAc(inp, filterFn(q).slice(0,10), onPick) : _closeAc(); };
      inp.onfocus = () => { const q = (inp.value||'').toLowerCase().trim(); if (q) _openAc(inp, filterFn(q).slice(0,10), onPick); };
      inp.onblur  = () => setTimeout(_closeAc, 160);
    }

    function _sensorMatches(q) {
      if (!h?.states) return [];
      return Object.keys(h.states)
        .filter(id => (id.startsWith('sensor.') || id.startsWith('input_number.')) &&
                      (nameOf(h,id).toLowerCase().includes(q) || id.toLowerCase().includes(q)))
        .map(id => {
          const s    = h.states[id];
          const unit = s?.attributes?.unit_of_measurement || '';
          return { id, name: nameOf(h,id), st: s?.state + (unit ? ' '+unit : '') };
        })
        .sort((a,b) => a.name.localeCompare(b.name));
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() {
      _closeAc();
      try { document.body.removeChild(ov); } catch(e) {}
      document.removeEventListener('keydown', escFn);
    }
    function escFn(ev) { if (ev.key === 'Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    const sinp = 'flex:1;padding:5px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff;font-size:10px;outline:none;font-family:inherit';

    function renderForm() {
      const selRows = ents.map((e, i) => {
        const lbl = e.label || nameOf(h, e.tempEntity) || e.tempEntity || '—';
        return `<div style="padding:10px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);margin-bottom:7px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
            <span style="font-size:16px">🌡️</span>
            <span style="flex:1;font-size:12px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</span>
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:9px;color:rgba(255,255,255,.4);width:56px;flex-shrink:0">🌡 Temp.</span>
              <input data-temp-idx="${i}" value="${eh(e.tempEntity||'')}" placeholder="sensor.temperatura…" style="${sinp}">
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:9px;color:rgba(255,255,255,.4);width:56px;flex-shrink:0">💧 Umid.</span>
              <input data-hum-idx="${i}" value="${eh(e.humEntity||'')}" placeholder="sensor.umidita… (opz.)" style="${sinp}">
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:9px;color:rgba(255,255,255,.4);width:56px;flex-shrink:0">📝 Nome</span>
              <input data-lbl-idx="${i}" value="${eh(e.label||'')}" placeholder="Nome visualizzato (opz.)" style="${sinp}">
            </div>
          </div>
        </div>`;
      }).join('');

      const anim = _firstRender ? 'animation:gtCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0b1422;border:1px solid rgba(56,189,248,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>
          @keyframes gtCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .gtinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s}
          .gtinp:focus{border-color:rgba(56,189,248,.5);background:rgba(56,189,248,.04)}
          .gtinp::placeholder{color:rgba(255,255,255,.3)}
          #gtcfg-body::-webkit-scrollbar{display:none}
        </style>

        <!-- Header -->
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:38px;height:38px;border-radius:11px;background:rgba(56,189,248,.13);border:1px solid rgba(56,189,248,.28);display:flex;align-items:center;justify-content:center;font-size:19px">🌡️</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800;color:#fff">Configura — Gruppo Temperatura</div>
            <div style="font-size:10px;color:rgba(255,255,255,.38)">${ents.length} sensor${ents.length===1?'e':'i'}</div>
          </div>
          <button id="gtcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <!-- Body -->
        <div id="gtcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:16px">
            <div style="flex:1">
              <div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Nome chip</div>
              <input id="gtcfg-label" class="gtinp" placeholder="Temperatura" value="${eh(c.label||'Temperatura')}">
            </div>
            <div style="flex:0 0 52px">
              <div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Colore</div>
              <input type="color" id="gtcfg-color" value="${(c.color||'#38bdf8').match(/^#[0-9a-f]{6}$/i)?c.color:'#38bdf8'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px">
            </div>
          </div>

          ${ents.length ? `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Sensori (${ents.length})</div>
            ${selRows}
          ` : ''}

          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin:${ents.length?'14px':0} 0 6px">Aggiungi sensore</div>
          <input id="gtcfg-add" class="gtinp" placeholder="🔍 Cerca sensore temperatura…" autocomplete="off">
          <div style="font-size:9px;color:rgba(255,255,255,.22);margin-top:5px">Digita il nome o l'entity_id — poi aggiungi umidità nella riga creata</div>
          <div style="height:18px"></div>
        </div>

        <!-- Footer -->
        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gtcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#38bdf8;color:#0a1628;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gtcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#gtcfg-body');
      const savedScroll = prevBody ? prevBody.scrollTop : 0;
      const curLabel = ov.querySelector('#gtcfg-label')?.value;
      const curColor = ov.querySelector('#gtcfg-color')?.value;

      ov.innerHTML = renderForm();
      _firstRender = false;

      const nb = ov.querySelector('#gtcfg-body');
      if (nb && savedScroll > 0) nb.scrollTop = savedScroll;
      if (curLabel !== undefined) { const f = ov.querySelector('#gtcfg-label'); if (f) f.value = curLabel; }
      if (curColor !== undefined) { const f = ov.querySelector('#gtcfg-color'); if (f) f.value = curColor; }

      ov.querySelectorAll('[data-temp-idx]').forEach(inp => {
        const i = parseInt(inp.dataset.tempIdx);
        _setupAc(inp, _sensorMatches, id => { ents[i].tempEntity = id; inp.value = id; attach(); });
        inp.onchange = () => { ents[i].tempEntity = inp.value.trim(); };
      });
      ov.querySelectorAll('[data-hum-idx]').forEach(inp => {
        const i = parseInt(inp.dataset.humIdx);
        _setupAc(inp, _sensorMatches, id => { ents[i].humEntity = id; inp.value = id; });
        inp.onchange = () => { ents[i].humEntity = inp.value.trim(); };
      });
      ov.querySelectorAll('[data-lbl-idx]').forEach(inp => {
        const i = parseInt(inp.dataset.lblIdx);
        inp.onchange = () => { ents[i].label = inp.value.trim(); };
        inp.oninput  = () => { ents[i].label = inp.value.trim(); };
      });
      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.onclick = () => { ents.splice(parseInt(btn.dataset.del), 1); attach(); };
      });

      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);
      ov.querySelector('#gtcfg-close').onclick  = closeOv;
      ov.querySelector('#gtcfg-cancel').onclick = closeOv;

      const addInp = ov.querySelector('#gtcfg-add');
      if (addInp) {
        _setupAc(addInp, _sensorMatches, (id, name) => {
          if (!ents.find(e => e.tempEntity === id)) {
            ents.push({ tempEntity: id, humEntity: '', label: name || '' });
          }
          addInp.value = ''; attach();
        });
      }

      ov.querySelector('#gtcfg-save').onclick = () => {
        /* flush any unfocused label inputs */
        ov.querySelectorAll('[data-lbl-idx]').forEach(inp => { ents[parseInt(inp.dataset.lblIdx)].label = inp.value.trim(); });
        ov.querySelectorAll('[data-hum-idx]').forEach(inp => { ents[parseInt(inp.dataset.humIdx)].humEntity = inp.value.trim(); });
        const newCfg = {
          label:    (ov.querySelector('#gtcfg-label')?.value || 'Temperatura').trim(),
          color:     ov.querySelector('#gtcfg-color')?.value  || '#38bdf8',
          entities: ents.filter(e => e.tempEntity).map(e => ({
            tempEntity: e.tempEntity.trim(),
            humEntity:  (e.humEntity || '').trim(),
            label:      (e.label     || '').trim(),
          })),
        };
        closeOv();
        if (typeof onSave === 'function') onSave(newCfg);
      };
    }

    attach();
    document.body.appendChild(ov);
  }

  /* ── registrazione ──────────────────────────────────────────── */
  const CARD = {
    id: ID,
    name: 'Gruppo Temperatura',
    icon: '🌡️',
    desc: 'Temperatura e umidità per più sensori con colori dinamici, barre scala e indicatore comfort.',
    version: '1.0',
    isDistintivo: true,
    defaultCfg: { label: 'Temperatura', color: '#38bdf8', entities: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-temperatura v1.0'); } catch(e) {}
})();
