/* frarik-version: 1.3 */
/**
 * GruppoTemperatura.js — Distintivo FratechStore v1.3
 * - Popup: sezione situazione/consigli in cima, min/max temp+umid, card stanze
 * - Re-render solo quando i dati cambiano (niente flash ogni 3s)
 */
(function () {
  'use strict';

  const ID = 'gruppo-temperatura';

  /* ── color helpers ─────────────────────────────────────────── */
  function _tempColor(v) {
    if (v == null || isNaN(v)) return '#fff';
    if (v <= 10) return '#38bdf8';
    if (v <= 15) return '#7dd3fc';
    if (v <= 19) return '#86efac';
    if (v <= 25) return '#4ade80';
    if (v <= 28) return '#facc15';
    if (v <= 32) return '#fb923c';
    return '#f87171';
  }

  function _humColor(v) {
    if (v == null || isNaN(v)) return '#fff';
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

  /* ── frasi situazione + consigli ───────────────────────────── */
  function _adviceLines(avgTemp, avgHum, minTemp, maxTemp, minHum, maxHum) {
    const lines = [];
    const spread = (minTemp != null && maxTemp != null) ? maxTemp - minTemp : null;

    /* temperatura */
    if (avgTemp != null) {
      if (avgTemp >= 19 && avgTemp <= 25)
        lines.push({ ico: '✅', txt: `Temperatura media ideale (${avgTemp.toFixed(1)}°). Nessuna azione necessaria.` });
      else if (avgTemp > 28)
        lines.push({ ico: '🥵', txt: `Temperatura elevata (${avgTemp.toFixed(1)}°). Ventila gli ambienti o abbassa il riscaldamento.` });
      else if (avgTemp > 25)
        lines.push({ ico: '☀️', txt: `Leggermente caldo (${avgTemp.toFixed(1)}°). Valuta di arieggiare.` });
      else if (avgTemp < 15)
        lines.push({ ico: '🥶', txt: `Temperatura bassa (${avgTemp.toFixed(1)}°). Controlla il riscaldamento.` });
      else if (avgTemp < 18)
        lines.push({ ico: '🌡', txt: `Temperatura fresca (${avgTemp.toFixed(1)}°). Potresti aumentare il riscaldamento.` });
    }

    /* umidità */
    if (avgHum != null) {
      if (avgHum >= 40 && avgHum <= 60)
        lines.push({ ico: '✅', txt: `Umidità nella norma (${Math.round(avgHum)}%). Condizioni ottimali.` });
      else if (avgHum > 70)
        lines.push({ ico: '💦', txt: `Umidità molto alta (${Math.round(avgHum)}%). Arieggia i locali per prevenire muffe e condensa.` });
      else if (avgHum > 60)
        lines.push({ ico: '🌧', txt: `Umidità un po' elevata (${Math.round(avgHum)}%). Apri le finestre quando possibile.` });
      else if (avgHum < 25)
        lines.push({ ico: '🏜', txt: `Aria molto secca (${Math.round(avgHum)}%). Un umidificatore migliorerebbe il comfort e la salute.` });
      else if (avgHum < 35)
        lines.push({ ico: '🌵', txt: `Umidità bassa (${Math.round(avgHum)}%). Valuta un umidificatore.` });
    }

    /* combo caldo + umido = afa */
    if (avgTemp != null && avgHum != null && avgTemp > 26 && avgHum > 60)
      lines.push({ ico: '😰', txt: 'Effetto afa: caldo e umidità combinati. Usa un deumidificatore e ventila nelle ore fresche.' });

    /* combo freddo + umido = muffa */
    if (avgTemp != null && avgHum != null && avgTemp < 17 && avgHum > 65)
      lines.push({ ico: '🍄', txt: 'Freddo e umidità: rischio muffe. Arieggia brevemente e scalda l\'ambiente.' });

    /* differenza tra stanze */
    if (spread != null && spread > 5)
      lines.push({ ico: '📊', txt: `Grande differenza tra le stanze (${spread.toFixed(1)}°). Verifica l'isolamento termico o la distribuzione del calore.` });
    else if (spread != null && spread > 3)
      lines.push({ ico: '📊', txt: `Differenza di ${spread.toFixed(1)}° tra la stanza più fredda e quella più calda.` });

    return lines;
  }

  /* ── fingerprint dati (evita re-render inutili) ─────────────── */
  function _gteKey(h, ents, c) {
    if (!h) return '';
    const parts = ents.map(e => {
      const t = e.tempEntity ? stateOf(h, e.tempEntity) : '-';
      const u = e.humEntity  ? stateOf(h, e.humEntity)  : '-';
      return `${t}|${u}`;
    });
    if (c.avgTempEntity) parts.push('AT:' + stateOf(h, c.avgTempEntity));
    if (c.avgHumEntity)  parts.push('AH:' + stateOf(h, c.avgHumEntity));
    return parts.join(',');
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

  /* ── CSS ────────────────────────────────────────────────────── */
  const _GTE_CSS = `
    @keyframes gte-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes gte-pulse{0%,100%{text-shadow:0 0 0 transparent}50%{text-shadow:0 0 12px currentColor}}
    .gte-card{animation:gte-in .32s cubic-bezier(.22,1,.36,1) both}
    .gte-val{animation:gte-pulse 3.5s ease-in-out infinite}
  `;
  function _gteInjectCss() {
    if (document.getElementById('gte-style')) return;
    const s = document.createElement('style'); s.id = 'gte-style'; s.textContent = _GTE_CSS;
    document.head.appendChild(s);
  }

  /* ── nascondi sottotitolo popup ─────────────────────────────── */
  function _syncTitle(cfg, el) {
    try {
      const hdr = el.previousElementSibling; if (!hdr) return;
      const textWrap = hdr.children?.[1]; if (!textWrap) return;
      const subEl = textWrap.children?.[1]; if (subEl) subEl.style.display = 'none';
    } catch(e) {}
  }

  /* ── chip ───────────────────────────────────────────────────── */
  function chip(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const col  = c.color || '#38bdf8';

    let chipVal = '—';
    let chipCol = col;

    if (h) {
      if (c.avgTempEntity) {
        const avgT = parseFloat(stateOf(h, c.avgTempEntity));
        if (!isNaN(avgT)) {
          chipVal = `${avgT.toFixed(1)}°`;
          chipCol = _tempColor(avgT);
          if (c.avgHumEntity) {
            const avgH = parseFloat(stateOf(h, c.avgHumEntity));
            if (!isNaN(avgH)) chipVal += ` · ${Math.round(avgH)}%`;
          }
        }
      } else if (ents.length) {
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
    if (c.avgTempEntity) ids.push(c.avgTempEntity);
    if (c.avgHumEntity)  ids.push(c.avgHumEntity);
    ents.forEach(e => {
      if (e.tempEntity) ids.push(e.tempEntity);
      if (e.humEntity)  ids.push(e.humEntity);
    });
    return ids;
  }

  /* ── render popup ───────────────────────────────────────────── */
  function render(cfg, rawHass, noAnim) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    if (!ents.length) {
      return `<div style="padding:40px 24px;text-align:center;color:#fff;font-size:12px">
        <div style="font-size:36px;margin-bottom:10px">🌡️</div>
        Nessun sensore configurato.<br>
        <span style="font-size:10px">Clicca ✏️ sulla chip per configurare.</span>
      </div>`;
    }

    /* ── calcola statistiche globali ── */
    const allTemps = ents.map(e => e.tempEntity && h ? parseFloat(stateOf(h, e.tempEntity)) : NaN).filter(v => !isNaN(v));
    const allHums  = ents.map(e => e.humEntity  && h ? parseFloat(stateOf(h, e.humEntity))  : NaN).filter(v => !isNaN(v));
    const hasHumGlobal = allHums.length > 0;

    const avgTemp = allTemps.length ? allTemps.reduce((a,b)=>a+b,0)/allTemps.length : null;
    const avgHum  = allHums.length  ? allHums.reduce((a,b)=>a+b,0)/allHums.length   : null;
    const minTemp = allTemps.length ? Math.min(...allTemps) : null;
    const maxTemp = allTemps.length ? Math.max(...allTemps) : null;
    const minHum  = allHums.length  ? Math.min(...allHums)  : null;
    const maxHum  = allHums.length  ? Math.max(...allHums)  : null;

    const comfort  = _comfortInfo(avgTemp, avgHum);
    const advice   = _adviceLines(avgTemp, avgHum, minTemp, maxTemp, minHum, maxHum);

    /* ── SEZIONE CIMA: min/max ── */
    const statCell = (lbl, val, col, unit) =>
      `<div style="flex:1;text-align:center;padding:9px 4px">
        <div style="font-size:7px;font-weight:800;color:#fff;letter-spacing:.6px;margin-bottom:3px">${lbl}</div>
        <div style="font-size:18px;font-weight:900;color:${col};line-height:1">${val}<span style="font-size:11px;font-weight:700;color:#fff">${unit}</span></div>
      </div>`;
    const divider = `<div style="width:1px;background:rgba(255,255,255,.08);margin:6px 0"></div>`;

    const topStats = `
      <div style="display:flex;align-items:stretch;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);margin-bottom:10px">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 10px;border-right:1px solid rgba(255,255,255,.08);flex-shrink:0">
          <span class="mdi mdi-thermometer" style="font-size:16px;color:#38bdf8"></span>
          <span style="font-size:7px;color:#fff;font-weight:700;letter-spacing:.4px;margin-top:2px">TEMP.</span>
        </div>
        <div style="flex:1;display:flex;align-items:stretch">
          ${statCell('MIN', minTemp!=null?minTemp.toFixed(1):'—', _tempColor(minTemp), minTemp!=null?'°':'')}
          ${divider}
          ${statCell('MAX', maxTemp!=null?maxTemp.toFixed(1):'—', _tempColor(maxTemp), maxTemp!=null?'°':'')}
        </div>
        ${hasHumGlobal ? `
        <div style="width:1px;background:rgba(255,255,255,.08)"></div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 10px;border-left:none;flex-shrink:0">
          <span class="mdi mdi-water-percent" style="font-size:16px;color:#38bdf8"></span>
          <span style="font-size:7px;color:#fff;font-weight:700;letter-spacing:.4px;margin-top:2px">UMID.</span>
        </div>
        <div style="flex:1;display:flex;align-items:stretch">
          ${statCell('MIN', minHum!=null?Math.round(minHum)+'':'—', _humColor(minHum), minHum!=null?'%':'')}
          ${divider}
          ${statCell('MAX', maxHum!=null?Math.round(maxHum)+'':'—', _humColor(maxHum), maxHum!=null?'%':'')}
        </div>` : ''}
      </div>`;

    /* ── SEZIONE SITUAZIONE + CONSIGLI ── */
    const adviceRows = advice.map(a =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05)">
        <span style="font-size:14px;flex-shrink:0;line-height:1.4">${a.ico}</span>
        <span style="font-size:11px;color:#fff;line-height:1.45">${a.txt}</span>
      </div>`
    ).join('');

    const situationBox = `
      <div style="border-radius:14px;overflow:hidden;border:1px solid ${hex2rgba(comfort.color,.28)};background:${hex2rgba(comfort.color,.07)};margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:9px;padding:10px 13px;border-bottom:${advice.length?'1px solid '+hex2rgba(comfort.color,.18):'none'}">
          <span style="font-size:20px;line-height:1">${comfort.emoji}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:800;color:${comfort.color}">${comfort.label}</div>
            <div style="font-size:10px;color:#fff;margin-top:1px">Situazione generale della casa</div>
          </div>
        </div>
        ${advice.length ? `<div style="padding:4px 13px 6px">${adviceRows}</div>` : ''}
      </div>`;

    /* ── card per stanza ── */
    const cards = ents.map((e, idx) => {
      if (!e.tempEntity) return '';

      const label   = e.label || nameOf(h, e.tempEntity);
      const tempRaw = h ? parseFloat(stateOf(h, e.tempEntity)) : NaN;
      const humRaw  = (e.humEntity && h) ? parseFloat(stateOf(h, e.humEntity)) : NaN;
      const tempVal = !isNaN(tempRaw) ? tempRaw : null;
      const humVal  = !isNaN(humRaw)  ? humRaw  : null;
      const unavail = tempVal == null;

      const tCol    = _tempColor(tempVal);
      const hCol    = _humColor(humVal);
      const roomComfort = _comfortInfo(tempVal, humVal);

      const tPct = tempVal != null ? Math.min(98, Math.max(2, (tempVal / 40) * 100)) : 0;
      const hPct = humVal  != null ? Math.min(98, Math.max(2, humVal)) : 0;

      const tIcoName = (tempVal != null && tempVal <= 15) ? 'thermometer-low'
                     : (tempVal != null && tempVal >= 28) ? 'thermometer-high'
                     : 'thermometer';

      const tempStr = tempVal != null ? tempVal.toFixed(1) : '—';
      const humStr  = humVal  != null ? Math.round(humVal).toString() : '—';
      const hasHum  = !!e.humEntity;

      const cardClass = noAnim ? '' : `class="gte-card"`;
      const delay = noAnim ? '' : `animation-delay:${idx * 55}ms`;

      return `
        <div ${cardClass} style="margin-bottom:9px;border-radius:16px;overflow:hidden;border:1px solid ${unavail ? 'rgba(255,255,255,.08)' : hex2rgba(tCol,.28)};box-shadow:0 4px 16px ${unavail ? 'transparent' : hex2rgba(tCol,.1)};${delay}">
          <div style="padding:11px 13px;background:linear-gradient(135deg,${hex2rgba(tCol,.12)} 0%,rgba(255,255,255,.02) 70%)">

            <!-- header stanza -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <div style="width:28px;height:28px;border-radius:8px;background:${unavail ? 'rgba(255,255,255,.06)' : hex2rgba(tCol,.18)};border:1px solid ${unavail ? 'rgba(255,255,255,.1)' : hex2rgba(tCol,.38)};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="mdi mdi-${tIcoName}" style="font-size:15px;color:${unavail ? '#fff' : tCol}"></span>
              </div>
              <span style="flex:1;font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(label)}</span>
              ${!unavail
                ? `<span style="font-size:8px;font-weight:700;padding:3px 8px;border-radius:20px;background:${hex2rgba(roomComfort.color,.15)};border:1px solid ${hex2rgba(roomComfort.color,.38)};color:${roomComfort.color};white-space:nowrap;flex-shrink:0">${roomComfort.emoji} ${roomComfort.label}</span>`
                : `<span style="font-size:9px;color:#fff;font-style:italic;flex-shrink:0">N/D</span>`
              }
            </div>

            <!-- valori -->
            <div style="display:flex;gap:8px">

              <div style="flex:1;padding:9px 11px;border-radius:12px;background:rgba(0,0,0,.18);border:1px solid ${hex2rgba(tCol,.2)}">
                <div style="display:flex;align-items:center;gap:3px;margin-bottom:4px">
                  <span class="mdi mdi-thermometer" style="font-size:11px;color:${tCol}"></span>
                  <span style="font-size:7px;font-weight:800;color:#fff;letter-spacing:.5px">TEMPERATURA</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:2px;margin-bottom:7px">
                  <span class="gte-val" style="font-size:30px;font-weight:900;color:${tCol};line-height:1;letter-spacing:-1px">${tempStr}</span>
                  <span style="font-size:14px;font-weight:700;color:#fff">°C</span>
                </div>
                <div style="position:relative;height:5px;border-radius:3px;overflow:visible;margin-bottom:4px">
                  <div style="position:absolute;inset:0;border-radius:3px;background:linear-gradient(90deg,#38bdf8 0%,#4ade80 40%,#facc15 62%,#f87171 100%)"></div>
                  <div style="position:absolute;top:-2px;left:${tPct}%;transform:translateX(-50%);width:3px;height:9px;background:#fff;border-radius:2px;box-shadow:0 0 6px rgba(255,255,255,.9),0 0 2px #000"></div>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span style="font-size:7px;color:#fff">❄ 0°</span>
                  <span style="font-size:7px;color:#fff">🔥 40°</span>
                </div>
              </div>

              ${hasHum ? `
              <div style="flex:1;padding:9px 11px;border-radius:12px;background:rgba(0,0,0,.18);border:1px solid ${hex2rgba(hCol,.2)}">
                <div style="display:flex;align-items:center;gap:3px;margin-bottom:4px">
                  <span class="mdi mdi-water-percent" style="font-size:11px;color:${hCol}"></span>
                  <span style="font-size:7px;font-weight:800;color:#fff;letter-spacing:.5px">UMIDITÀ</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:2px;margin-bottom:7px">
                  <span class="gte-val" style="font-size:30px;font-weight:900;color:${hCol};line-height:1;letter-spacing:-1px">${humStr}</span>
                  <span style="font-size:14px;font-weight:700;color:#fff">%</span>
                </div>
                <div style="position:relative;height:5px;border-radius:3px;overflow:visible;margin-bottom:4px">
                  <div style="position:absolute;inset:0;border-radius:3px;background:linear-gradient(90deg,#f87171 0%,#facc15 22%,#4ade80 40%,#4ade80 60%,#facc15 78%,#f87171 100%)"></div>
                  <div style="position:absolute;top:-2px;left:${hPct}%;transform:translateX(-50%);width:3px;height:9px;background:#fff;border-radius:2px;box-shadow:0 0 6px rgba(255,255,255,.9),0 0 2px #000"></div>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span style="font-size:7px;color:#fff">🏜 0%</span>
                  <span style="font-size:7px;color:#fff">💦 100%</span>
                </div>
              </div>` : ''}

            </div>
          </div>
        </div>`;
    }).join('');

    return `<div id="gte-popup-body" style="padding:10px 10px 4px">${topStats}${situationBox}${cards}</div>`;
  }

  /* ── mount ──────────────────────────────────────────────────── */
  function mount(cfg, rawHass, el) {
    if (el._gtPoll) return;
    _gteInjectCss();
    const c = loadCfg(cfg);
    const h0 = H();
    if (h0) {
      el.innerHTML = render(cfg, h0, false);
      el._gteKey = _gteKey(h0, Array.isArray(c.entities)?c.entities:[], c);
    }
    setTimeout(() => _syncTitle(cfg, el), 0);
    el._gtPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gtPoll); delete el._gtPoll; return; }
      try {
        const h = H(); if (!h) return;
        const c2 = loadCfg(cfg);
        const key = _gteKey(h, Array.isArray(c2.entities)?c2.entities:[], c2);
        if (key === el._gteKey) return;
        el._gteKey = key;
        const _sp = el.parentElement, _st = _sp ? _sp.scrollTop : 0;
        el.innerHTML = render(cfg, h, true);
        _syncTitle(cfg, el);
        if (_sp && _st > 0) _sp.scrollTop = _st;
      } catch(e) {}
    }, 3000);
  }

  /* ── update ─────────────────────────────────────────────────── */
  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, rawHass, true); } catch(e) {}
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
          <div style="font-size:9px;color:#fff;margin-top:1px">${eh(m.id)}${m.st ? ' · '+eh(m.st) : ''}</div>`;
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
    const lbl9 = 'font-size:9px;color:#fff;width:64px;flex-shrink:0;font-weight:600';

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
              <span style="${lbl9}">🌡 Temp.</span>
              <input data-temp-idx="${i}" value="${eh(e.tempEntity||'')}" placeholder="sensor.temperatura…" style="${sinp}">
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="${lbl9}">💧 Umid.</span>
              <input data-hum-idx="${i}" value="${eh(e.humEntity||'')}" placeholder="sensor.umidita… (opz.)" style="${sinp}">
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="${lbl9}">📝 Nome</span>
              <input data-lbl-idx="${i}" value="${eh(e.label||'')}" placeholder="Nome stanza (opz.)" style="${sinp}">
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
          .gtinp::placeholder{color:rgba(255,255,255,.55)}
          #gtcfg-body::-webkit-scrollbar{display:none}
          .gtsec{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:7px}
        </style>

        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:38px;height:38px;border-radius:11px;background:rgba(56,189,248,.13);border:1px solid rgba(56,189,248,.28);display:flex;align-items:center;justify-content:center;font-size:19px">🌡️</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800;color:#fff">Configura — Gruppo Temperatura</div>
            <div style="font-size:10px;color:#fff">${ents.length} sensor${ents.length===1?'e':'i'} configurati</div>
          </div>
          <button id="gtcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <div id="gtcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">
          <div class="gtsec">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1">
              <div style="font-size:9px;color:#fff;margin-bottom:3px;font-weight:600">Nome chip</div>
              <input id="gtcfg-label" class="gtinp" placeholder="Temperatura" value="${eh(c.label||'Temperatura')}">
            </div>
            <div style="flex:0 0 52px">
              <div style="font-size:9px;color:#fff;margin-bottom:3px;font-weight:600">Colore</div>
              <input type="color" id="gtcfg-color" value="${(c.color||'#38bdf8').match(/^#[0-9a-f]{6}$/i)?c.color:'#38bdf8'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px">
            </div>
          </div>

          <div class="gtsec">Sensori media — chip (opz.)</div>
          <div style="padding:10px;border-radius:10px;background:rgba(56,189,248,.05);border:1px solid rgba(56,189,248,.18);margin-bottom:16px">
            <div style="font-size:10px;color:#fff;margin-bottom:9px">Se impostati, la chip mostra il valore di questi sensori. Altrimenti usa min–max dai sensori singoli.</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="${lbl9}">🌡 Temp.</span>
                <input id="gtcfg-avg-temp" value="${eh(c.avgTempEntity||'')}" placeholder="sensor.media_temperatura…" style="${sinp}">
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="${lbl9}">💧 Umid.</span>
                <input id="gtcfg-avg-hum" value="${eh(c.avgHumEntity||'')}" placeholder="sensor.media_umidita… (opz.)" style="${sinp}">
              </div>
            </div>
          </div>

          ${ents.length ? `<div class="gtsec">Sensori per stanza (${ents.length})</div>${selRows}` : ''}

          <div class="gtsec" style="margin-top:${ents.length?'14px':0}">Aggiungi stanza</div>
          <input id="gtcfg-add" class="gtinp" placeholder="🔍 Cerca sensore temperatura…" autocomplete="off">
          <div style="font-size:9px;color:#fff;margin-top:5px">Digita il nome o l'entity_id del sensore temperatura</div>
          <div style="height:18px"></div>
        </div>

        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gtcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#38bdf8;color:#0a1628;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gtcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody    = ov.querySelector('#gtcfg-body');
      const savedScroll = prevBody ? prevBody.scrollTop : 0;
      const curLabel    = ov.querySelector('#gtcfg-label')?.value;
      const curColor    = ov.querySelector('#gtcfg-color')?.value;
      const curAvgT     = ov.querySelector('#gtcfg-avg-temp')?.value;
      const curAvgH     = ov.querySelector('#gtcfg-avg-hum')?.value;

      ov.innerHTML = renderForm();
      _firstRender = false;

      const nb = ov.querySelector('#gtcfg-body');
      if (nb && savedScroll > 0) nb.scrollTop = savedScroll;
      if (curLabel !== undefined) { const f = ov.querySelector('#gtcfg-label');    if (f) f.value = curLabel; }
      if (curColor !== undefined) { const f = ov.querySelector('#gtcfg-color');    if (f) f.value = curColor; }
      if (curAvgT  !== undefined) { const f = ov.querySelector('#gtcfg-avg-temp'); if (f) f.value = curAvgT;  }
      if (curAvgH  !== undefined) { const f = ov.querySelector('#gtcfg-avg-hum');  if (f) f.value = curAvgH;  }

      const avgTInp = ov.querySelector('#gtcfg-avg-temp');
      if (avgTInp) _setupAc(avgTInp, _sensorMatches, id => { avgTInp.value = id; });
      const avgHInp = ov.querySelector('#gtcfg-avg-hum');
      if (avgHInp) _setupAc(avgHInp, _sensorMatches, id => { avgHInp.value = id; });

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
        inp.oninput  = () => { ents[i].label = inp.value.trim(); };
        inp.onchange = () => { ents[i].label = inp.value.trim(); };
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
        ov.querySelectorAll('[data-lbl-idx]').forEach(inp => { ents[parseInt(inp.dataset.lblIdx)].label      = inp.value.trim(); });
        ov.querySelectorAll('[data-hum-idx]').forEach(inp => { ents[parseInt(inp.dataset.humIdx)].humEntity  = inp.value.trim(); });
        ov.querySelectorAll('[data-temp-idx]').forEach(inp => { ents[parseInt(inp.dataset.tempIdx)].tempEntity = inp.value.trim(); });
        const newCfg = {
          label:         (ov.querySelector('#gtcfg-label')?.value    || 'Temperatura').trim(),
          color:          ov.querySelector('#gtcfg-color')?.value     || '#38bdf8',
          avgTempEntity: (ov.querySelector('#gtcfg-avg-temp')?.value || '').trim(),
          avgHumEntity:  (ov.querySelector('#gtcfg-avg-hum')?.value  || '').trim(),
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
    desc: 'Chip con media temp/umidità; popup con min/max, situazione, consigli e card per stanza.',
    version: '1.3',
    isDistintivo: true,
    defaultCfg: { label: 'Temperatura', color: '#38bdf8', avgTempEntity: '', avgHumEntity: '', entities: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-temperatura v1.3'); } catch(e) {}
})();
