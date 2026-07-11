/* frarik-version: 1.9.1 */
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

  function _adviceLines(avgTemp, avgHum, minTemp, maxTemp) {
    const lines = [];
    const spread = (minTemp != null && maxTemp != null) ? maxTemp - minTemp : null;
    if (avgTemp != null) {
      if (avgTemp >= 19 && avgTemp <= 25)
        lines.push({ ico: '✅', txt: 'Temperatura nella zona di comfort. Nessuna azione necessaria.' });
      else if (avgTemp > 28)
        lines.push({ ico: '🥵', txt: `Caldo (${avgTemp.toFixed(1)}°). Ventila gli ambienti o abbassa il riscaldamento.` });
      else if (avgTemp > 25)
        lines.push({ ico: '☀️', txt: `Leggermente caldo (${avgTemp.toFixed(1)}°). Valuta di arieggiare.` });
      else if (avgTemp < 15)
        lines.push({ ico: '🥶', txt: `Freddo (${avgTemp.toFixed(1)}°). Controlla il riscaldamento.` });
      else if (avgTemp < 18)
        lines.push({ ico: '🌡', txt: `Fresco (${avgTemp.toFixed(1)}°). Potresti aumentare il riscaldamento.` });
    }
    if (avgHum != null) {
      if (avgHum >= 40 && avgHum <= 60)
        lines.push({ ico: '✅', txt: `Umidità ottimale (${Math.round(avgHum)}%). Nessuna azione.` });
      else if (avgHum > 70)
        lines.push({ ico: '💦', txt: `Umidità alta (${Math.round(avgHum)}%). Arieggia per prevenire muffe.` });
      else if (avgHum > 60)
        lines.push({ ico: '🌧', txt: `Umidità elevata (${Math.round(avgHum)}%). Apri le finestre.` });
      else if (avgHum < 30)
        lines.push({ ico: '🏜', txt: `Aria molto secca (${Math.round(avgHum)}%). Valuta un umidificatore.` });
      else if (avgHum < 40)
        lines.push({ ico: '🌵', txt: `Umidità bassa (${Math.round(avgHum)}%). Un po' di vapore aiuterebbe.` });
    }
    if (avgTemp != null && avgHum != null && avgTemp > 26 && avgHum > 60)
      lines.push({ ico: '😰', txt: 'Effetto afa: caldo e umidità combinati. Usa un deumidificatore.' });
    if (avgTemp != null && avgHum != null && avgTemp < 17 && avgHum > 65)
      lines.push({ ico: '🍄', txt: 'Freddo e umidità: rischio muffe. Scalda e arieggia brevemente.' });
    if (spread != null && spread > 5)
      lines.push({ ico: '📊', txt: `Grande differenza tra le stanze (${spread.toFixed(1)}°). Verifica l'isolamento.` });
    else if (spread != null && spread > 3)
      lines.push({ ico: '📊', txt: `Differenza di ${spread.toFixed(1)}° tra la stanza più fredda e quella più calda.` });
    return lines;
  }

  /* ── icona stanza rilevata dal nome ────────────────────────── */
  function _roomIcon(label) {
    const l = (label || '').toLowerCase();
    if (l.includes('camera') || l.includes('letto') || l.includes('bedroom') || l.includes('notte')) return 'bed-king-outline';
    if (l.includes('cucina') || l.includes('kitchen') || l.includes('cucinotto')) return 'chef-hat';
    if (l.includes('bagno') || l.includes('bathroom') || l.includes('doccia') || l.includes('wc') || l.includes('toilet')) return 'shower';
    if (l.includes('soggiorno') || l.includes('salotto') || l.includes('living') || l.includes('sala')) return 'sofa-outline';
    if (l.includes('studio') || l.includes('ufficio') || l.includes('office') || l.includes('lavoro')) return 'desk';
    if (l.includes('garage') || l.includes('box')) return 'garage-open-variant';
    if (l.includes('cantina') || l.includes('cave') || l.includes('interrato')) return 'domain';
    if (l.includes('terrazzo') || l.includes('balcone') || l.includes('balcony') || l.includes('terraza')) return 'balcony';
    if (l.includes('giardino') || l.includes('garden') || l.includes('esterno') || l.includes('outdoor')) return 'tree-outline';
    if (l.includes('corridoio') || l.includes('ingresso') || l.includes('entrata') || l.includes('hall')) return 'door-open';
    if (l.includes('mansarda') || l.includes('soffitta') || l.includes('attico')) return 'home-roof';
    if (l.includes('ripostiglio') || l.includes('lavanderia') || l.includes('laundry')) return 'washing-machine';
    return 'home-thermometer-outline';
  }

  /* ── consiglio specifico per stanza ─────────────────────────── */
  function _roomAdvice(label, temp, hum) {
    const l = (label || '').toLowerCase();
    const isBed  = l.includes('camera') || l.includes('letto') || l.includes('notte') || l.includes('bedroom');
    const isKit  = l.includes('cucina') || l.includes('kitchen') || l.includes('cucinotto');
    const isBath = l.includes('bagno') || l.includes('doccia') || l.includes('wc') || l.includes('toilet');
    const isOut  = l.includes('esterno') || l.includes('giardino') || l.includes('terrazzo') || l.includes('balcone') || l.includes('outdoor');

    const tOk = temp != null && temp >= 19 && temp <= 25;
    const hOk = hum  == null || (hum >= 40 && hum <= 60);

    if (temp == null && hum == null) return null;

    /* camera da letto */
    if (isBed) {
      if (temp != null && temp >= 17 && temp <= 21 && hOk)
        return { ico: '😴', txt: 'Temperatura ideale per dormire bene. Ottimo!' };
      if (temp != null && temp > 22)
        return { ico: '💤', txt: 'Un po\' caldo per dormire. Abbassa leggermente il riscaldamento la sera.' };
      if (temp != null && temp < 16)
        return { ico: '🥶', txt: 'Troppo freddo per dormire. Imposta il riscaldamento notturno almeno a 17°.' };
      if (hum != null && hum > 65)
        return { ico: '💦', txt: 'Umidità elevata: arieggia di mattina per ridurre il rischio di condensa.' };
    }

    /* cucina */
    if (isKit) {
      if (temp != null && temp > 26)
        return { ico: '🌬', txt: 'La cucina si surriscalda durante la cottura. Usa la cappa e apri la finestra.' };
      if (hum != null && hum > 65)
        return { ico: '💨', txt: 'Vapore in cucina: usa la cappa aspirante e ventila per evitare condensa.' };
      if (tOk && hOk)
        return { ico: '✅', txt: 'Cucina ben ventilata e a temperatura ottimale.' };
    }

    /* bagno */
    if (isBath) {
      if (hum != null && hum > 75)
        return { ico: '🍄', txt: 'Umidità molto alta: arieggia subito e considera un deumidificatore per prevenire le muffe.' };
      if (hum != null && hum > 60)
        return { ico: '💧', txt: 'Apri la finestra dopo la doccia per far scendere l\'umidità sotto al 60%.' };
      if (hum != null && hum <= 60 && temp != null && temp >= 18)
        return { ico: '✅', txt: 'Bagno ben ventilato. Nessuna azione necessaria.' };
    }

    /* esterno */
    if (isOut) {
      if (temp != null && temp > 32)
        return { ico: '☀️', txt: 'Caldo intenso all\'esterno. Evita le ore centrali e idratati.' };
      if (temp != null && temp < 5)
        return { ico: '❄️', txt: 'Gelo possibile. Attenzione a tubi esposti e piante sensibili al freddo.' };
      if (hum != null && hum > 80)
        return { ico: '🌧', txt: 'Umidità esterna elevata. Probabile pioggia in arrivo.' };
    }

    /* consigli generici per qualsiasi stanza */
    if (tOk && hOk)
      return { ico: '✅', txt: 'Condizioni ottime. Temperatura e umidità nella norma.' };
    if (temp != null && temp > 28 && hum != null && hum > 60)
      return { ico: '😰', txt: 'Afa: caldo e umidità combinati. Usa un deumidificatore e ventila nelle ore fresche.' };
    if (temp != null && temp < 16 && hum != null && hum > 65)
      return { ico: '🍄', txt: 'Freddo e umido: rischio muffe. Scalda l\'ambiente e arieggia brevemente ogni giorno.' };
    if (temp != null && temp > 27)
      return { ico: '🔥', txt: 'Temperatura elevata. Apri le finestre nelle ore più fresche o abbassa il riscaldamento.' };
    if (temp != null && temp < 16)
      return { ico: '🥶', txt: 'Freddo: controlla il riscaldamento in questa stanza.' };
    if (hum != null && hum > 70)
      return { ico: '💦', txt: 'Umidità alta. Arieggia almeno 10 minuti al giorno per prevenire muffe.' };
    if (hum != null && hum < 30)
      return { ico: '🏜', txt: 'Aria molto secca. Un umidificatore migliora il comfort e riduce le irritazioni.' };
    if (hum != null && hum < 40)
      return { ico: '🌵', txt: 'Umidità un po\' bassa. Un umidificatore portatile può aiutare.' };
    if (temp != null && temp > 25)
      return { ico: '☀️', txt: 'Leggermente caldo. Valuta di arieggiare nelle ore serali.' };
    if (temp != null && temp < 19)
      return { ico: '🌡', txt: 'Fresco. Potresti aumentare leggermente il riscaldamento.' };

    return null;
  }

  /* ── history cache + fetch ───────────────────────────────────── */
  const _GTE_HIST = {};
  const _HIST_TTL = 10 * 60 * 1000; // 10 min
  const _HIST_H   = 24;             // ore da mostrare

  function _safeId(id) { return (id || '').replace(/[^a-zA-Z0-9]/g, '_'); }

  async function _getHistory(h, entityId) {
    const now = Date.now();
    const c = _GTE_HIST[entityId];
    if (c && now - c.ts < _HIST_TTL) return c.pts;
    try {
      const start = new Date(now - _HIST_H * 3600000).toISOString();
      const res = await h.callApi('GET',
        `history/period/${start}?filter_entity_id=${entityId}&minimal_response=true&no_attributes=true`);
      const raw = res?.[0] || [];
      const step = Math.max(1, Math.floor(raw.length / 80));
      const pts = raw
        .filter((_, i) => i % step === 0 || i === raw.length - 1)
        .map(s => ({ t: new Date(s.last_changed).getTime(), v: parseFloat(s.state) }))
        .filter(p => !isNaN(p.v));
      _GTE_HIST[entityId] = { ts: now, pts };
      return pts;
    } catch(e) { return []; }
  }

  /* ── sparkline SVG ───────────────────────────────────────────── */
  function _sparkline(pts, color, scaleMin, scaleMax) {
    const W = 100, H = 46, PAD = 3;
    if (!pts || pts.length < 2) {
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none">
        <line x1="${PAD}" y1="${H/2}" x2="${W-PAD}" y2="${H/2}"
          stroke="rgba(255,255,255,.14)" stroke-width="1" stroke-dasharray="4 3"/>
      </svg>`;
    }
    const tMin = pts[0].t, tRange = Math.max(pts[pts.length-1].t - tMin, 1);
    const vRange = Math.max(scaleMax - scaleMin, 0.1);
    const x = t => ((t - tMin) / tRange * (W - PAD*2) + PAD).toFixed(2);
    const y = v => (H - PAD - (Math.min(scaleMax, Math.max(scaleMin, v)) - scaleMin) / vRange * (H - PAD*2)).toFixed(2);
    const line = pts.map(p => `${x(p.t)},${y(p.v)}`).join(' ');
    const lx = x(pts[pts.length-1].t), ly = y(pts[pts.length-1].v);
    const area = `M ${pts.map(p=>`${x(p.t)} ${y(p.v)}`).join(' L ')} L ${lx} ${H-PAD} L ${PAD} ${H-PAD} Z`;
    const gid  = `gsg${color.replace('#','')}`;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" style="overflow:visible;display:block">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity=".28"/>
          <stop offset="100%" stop-color="${color}" stop-opacity=".02"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#${gid})"/>
      <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        style="filter:drop-shadow(0 0 2px ${color})"/>
      <circle cx="${lx}" cy="${ly}" r="3" fill="${color}"
        style="filter:drop-shadow(0 0 5px ${color})"/>
    </svg>`;
  }

  /* ── aggiorna solo i div grafico dopo fetch asincrona ────────── */
  async function _loadGraphs(cfg, el) {
    const h = H();
    if (!h || typeof h.callApi !== 'function') return;
    const c    = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    await Promise.allSettled(ents.flatMap(e => [
      e.tempEntity ? _getHistory(h, e.tempEntity) : null,
      e.humEntity  ? _getHistory(h, e.humEntity)  : null,
    ].filter(Boolean)));
    if (!el.isConnected) return;
    ents.forEach(e => {
      [
        { id: e.tempEntity, scaleMax: 40,  colorFn: _tempColor },
        { id: e.humEntity,  scaleMax: 100, colorFn: _humColor  },
      ].forEach(({ id, scaleMax, colorFn }) => {
        if (!id) return;
        const div = el.querySelector('#gte-g-' + _safeId(id));
        if (!div) return;
        const v = parseFloat(stateOf(h, id));
        const pts = _GTE_HIST[id]?.pts || [];
        div.innerHTML = _sparkline(pts, colorFn(!isNaN(v) ? v : null), 0, scaleMax);
      });
    });
  }

  /* ── fingerprint ─────────────────────────────────────────────── */
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
  function eh(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function hex2rgba(hex, a) {
    let h = (hex || '').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return `rgba(255,255,255,${a})`;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }

  /* ── CSS ────────────────────────────────────────────────────── */
  const _GTE_CSS = `
    @keyframes gte-hero-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
    @keyframes gte-row-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes gte-num{0%,100%{text-shadow:0 0 0 transparent}50%{text-shadow:0 0 20px currentColor}}
    .gte-hero{animation:gte-hero-in .38s cubic-bezier(.22,1,.36,1) both}
    .gte-row{animation:gte-row-in .35s cubic-bezier(.22,1,.36,1) both}
    .gte-num{animation:gte-num 4s ease-in-out infinite}
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
    let chipVal = '—', chipCol = col;
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
          chipVal = `${temps[0].toFixed(1)}°`; chipCol = _tempColor(temps[0]);
        } else if (temps.length > 1) {
          const min = Math.min(...temps), max = Math.max(...temps);
          chipVal = `${min.toFixed(0)}°–${max.toFixed(0)}°`;
          chipCol = _tempColor(Math.abs(max-22) > Math.abs(min-22) ? max : min);
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
    const c = loadCfg(cfg), ents = Array.isArray(c.entities) ? c.entities : [], ids = [];
    if (c.avgTempEntity) ids.push(c.avgTempEntity);
    if (c.avgHumEntity)  ids.push(c.avgHumEntity);
    ents.forEach(e => { if (e.tempEntity) ids.push(e.tempEntity); if (e.humEntity) ids.push(e.humEntity); });
    return ids;
  }

  /* ── render ─────────────────────────────────────────────────── */
  function render(cfg, rawHass, noAnim) {
    const c    = loadCfg(cfg);
    const h    = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    if (!ents.length) {
      return `<div style="padding:48px 24px;text-align:center;color:#fff;font-size:12px">
        <div style="font-size:42px;margin-bottom:12px">🌡️</div>
        <div style="font-size:13px;font-weight:700;margin-bottom:6px">Nessun sensore configurato</div>
        <div style="font-size:10px">Clicca ✏️ sulla chip per aggiungere le stanze.</div>
      </div>`;
    }

    /* statistiche globali */
    const allTemps = ents.map(e => e.tempEntity && h ? parseFloat(stateOf(h, e.tempEntity)) : NaN).filter(v => !isNaN(v));
    const allHums  = ents.map(e => e.humEntity  && h ? parseFloat(stateOf(h, e.humEntity))  : NaN).filter(v => !isNaN(v));
    const hasHumG  = allHums.length > 0;
    const multi    = ents.length > 1;

    const avgTemp = allTemps.length ? allTemps.reduce((a,b)=>a+b,0)/allTemps.length : null;
    const avgHum  = allHums.length  ? allHums.reduce((a,b)=>a+b,0)/allHums.length   : null;
    const minTemp = allTemps.length ? Math.min(...allTemps) : null;
    const maxTemp = allTemps.length ? Math.max(...allTemps) : null;
    const minHum  = allHums.length  ? Math.min(...allHums)  : null;
    const maxHum  = allHums.length  ? Math.max(...allHums)  : null;

    /* valori da mostrare nell'hero:
       se sensore singolo → valori diretti
       se multiplo → medie */
    const heroTemp = multi ? avgTemp : (allTemps[0] ?? null);
    const heroHum  = multi ? avgHum  : (allHums[0]  ?? null);
    const heroLabel = multi ? 'media casa' : (ents[0].label || nameOf(h, ents[0].tempEntity) || 'sensore');
    const comfort  = _comfortInfo(heroTemp, heroHum);
    const advice   = _adviceLines(heroTemp, heroHum, minTemp, maxTemp);

    const tCol = _tempColor(heroTemp);
    const hCol = _humColor(heroHum);

    /* footer min/max (solo se multi + ci sono dati) */
    const footCell = (ico, lbl, val, col) =>
      `<div style="text-align:center;padding:9px 4px">
        <div style="font-size:7px;color:#fff;font-weight:700;letter-spacing:.5px;margin-bottom:2px">${ico} ${lbl}</div>
        <div style="font-size:15px;font-weight:900;color:${col};line-height:1">${val}</div>
      </div>`;

    const heroFooter = multi ? `
      <div style="display:grid;grid-template-columns:${hasHumG?'1fr 1fr 1fr 1fr':'1fr 1fr'};border-top:1px solid rgba(255,255,255,.07)">
        ${footCell('❄','MIN', minTemp!=null?minTemp.toFixed(1)+'°':'—', _tempColor(minTemp))}
        ${footCell('🔥','MAX', maxTemp!=null?maxTemp.toFixed(1)+'°':'—', _tempColor(maxTemp))}
        ${hasHumG ? footCell('💧','MIN', minHum!=null?Math.round(minHum)+'%':'—', _humColor(minHum)) : ''}
        ${hasHumG ? footCell('💦','MAX', maxHum!=null?Math.round(maxHum)+'%':'—', _humColor(maxHum)) : ''}
      </div>` : '';

    const heroClass = noAnim ? '' : 'class="gte-hero"';
    const numClass  = noAnim ? '' : 'class="gte-num"';

    const hero = `
      <div ${heroClass} style="border-radius:20px;overflow:hidden;border:1px solid ${hex2rgba(comfort.color,.28)};margin-bottom:10px;background:linear-gradient(145deg,#0a1828 0%,#0e2038 100%);position:relative">
        <!-- glow radiale angolo -->
        <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:radial-gradient(circle at 50% 50%,${hex2rgba(comfort.color,.18)} 0%,transparent 68%);pointer-events:none"></div>

        <div style="padding:16px 16px 14px;position:relative">
          <!-- riga top: label + badge -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:5px">
              <span class="mdi mdi-home-thermometer-outline" style="color:${comfort.color};font-size:15px"></span>
              <span style="font-size:10px;font-weight:700;color:#fff;letter-spacing:.3px">${eh(heroLabel)}</span>
            </div>
            <span style="font-size:18px;line-height:1">${comfort.emoji}</span>
          </div>

          <!-- valori principali -->
          <div style="display:flex;align-items:flex-end;gap:20px">
            <div style="flex:1">
              <div ${numClass} style="font-size:58px;font-weight:900;color:${tCol};line-height:.95;letter-spacing:-3px">${heroTemp!=null?heroTemp.toFixed(1):'—'}<span style="font-size:24px;font-weight:700;color:#fff;letter-spacing:0">°</span></div>
              <div style="font-size:9px;color:#fff;margin-top:5px;letter-spacing:.3px;font-weight:600">TEMPERATURA</div>
            </div>
            ${hasHumG && heroHum!=null ? `
            <div style="flex:1;text-align:right">
              <div ${numClass} style="font-size:58px;font-weight:900;color:${hCol};line-height:.95;letter-spacing:-3px">${Math.round(heroHum)}<span style="font-size:24px;font-weight:700;color:#fff;letter-spacing:0">%</span></div>
              <div style="font-size:9px;color:#fff;margin-top:5px;letter-spacing:.3px;font-weight:600">UMIDITÀ</div>
            </div>` : ''}
          </div>
        </div>

        ${heroFooter}
      </div>`;

    /* consigli (plain text, max 2) */
    const adviceHtml = advice.length ? `
      <div style="margin-bottom:10px;padding:0 2px">
        ${advice.slice(0,2).map(a =>
          `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:7px">
            <span style="font-size:14px;flex-shrink:0;line-height:1.35">${a.ico}</span>
            <span style="font-size:11px;color:#fff;line-height:1.5">${a.txt}</span>
          </div>`
        ).join('')}
      </div>` : '';

    /* stanze */
    const roomHeader = multi
      ? `<div style="font-size:9px;font-weight:700;color:#fff;letter-spacing:.8px;margin-bottom:8px;padding:0 2px">STANZE · ${ents.length}</div>`
      : '';

    const roomRows = ents.map((e, idx) => {
      if (!e.tempEntity) return '';
      const label   = e.label || nameOf(h, e.tempEntity);
      const tempRaw = h ? parseFloat(stateOf(h, e.tempEntity)) : NaN;
      const humRaw  = (e.humEntity && h) ? parseFloat(stateOf(h, e.humEntity)) : NaN;
      const tempVal = !isNaN(tempRaw) ? tempRaw : null;
      const humVal  = !isNaN(humRaw)  ? humRaw  : null;
      const tC      = _tempColor(tempVal);
      const hC      = _humColor(humVal);
      const rc      = _comfortInfo(tempVal, humVal);
      const adv     = _roomAdvice(label, tempVal, humVal);
      const icon    = _roomIcon(label);
      const hasHum  = !!e.humEntity;

      const rowClass  = noAnim ? '' : `class="gte-row"`;
      const cardDelay = noAnim ? '' : `animation-delay:${idx * 90}ms`;

      const tempDisplay = tempVal != null ? tempVal.toFixed(1) : '—';
      const humDisplay  = humVal  != null ? Math.round(humVal).toString() : '—';
      const numClass    = noAnim ? '' : 'class="gte-num"';

      /* history già in cache (se disponibile) */
      const tPts = _GTE_HIST[e.tempEntity]?.pts || [];
      const hPts = _GTE_HIST[e.humEntity]?.pts  || [];

      /* pannello valore: numero grande + sparkline affianco */
      const valPanel = (display, unit, color, pts, scaleMax, borderRight) => `
        <div style="padding:15px 12px 14px${borderRight ? ';border-right:1px solid rgba(255,255,255,.07)' : ''}">
          <div style="font-size:8px;font-weight:700;color:#fff;letter-spacing:.5px;opacity:.6;margin-bottom:9px">${unit === '°C' ? 'TEMPERATURA' : 'UMIDITÀ'}</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="flex-shrink:0">
              <div ${numClass} style="font-size:44px;font-weight:900;color:${color};line-height:1;letter-spacing:-2px">${display}</div>
              <div style="font-size:14px;font-weight:700;color:#fff;margin-top:3px">${unit}</div>
            </div>
            <div id="gte-g-${_safeId(unit==='°C'?e.tempEntity:e.humEntity)}" style="flex:1;min-width:0">
              ${_sparkline(pts, color, 0, scaleMax)}
            </div>
          </div>
        </div>`;

      return `
        <div ${rowClass} style="margin-bottom:10px;border-radius:18px;overflow:hidden;background:rgba(255,255,255,.045);border:1px solid ${hex2rgba(rc.color,.28)};${cardDelay}">

          <!-- intestazione -->
          <div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px">
            <div style="width:36px;height:36px;border-radius:10px;background:${hex2rgba(rc.color,.14)};border:1px solid ${hex2rgba(rc.color,.32)};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span class="mdi mdi-${icon}" style="font-size:18px;color:${rc.color}"></span>
            </div>
            <span style="flex:1;font-size:15px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(label)}</span>
            <span style="font-size:9px;font-weight:800;padding:4px 11px;border-radius:20px;background:${hex2rgba(rc.color,.14)};border:1px solid ${hex2rgba(rc.color,.32)};color:${rc.color};flex-shrink:0;white-space:nowrap">${rc.emoji} ${rc.label}</span>
          </div>

          <!-- valori + sparkline -->
          <div style="display:grid;grid-template-columns:1fr${hasHum ? ' 1fr' : ''};border-top:1px solid rgba(255,255,255,.07)${adv ? ';border-bottom:1px solid rgba(255,255,255,.07)' : ''}">
            ${valPanel(tempDisplay, '°C', tC, tPts, 40, hasHum)}
            ${hasHum ? valPanel(humDisplay, '%', hC, hPts, 100, false) : ''}
          </div>

          <!-- consiglio -->
          ${adv ? `
          <div style="display:flex;align-items:flex-start;gap:9px;padding:10px 15px 12px">
            <span style="font-size:16px;flex-shrink:0;line-height:1.3">${adv.ico}</span>
            <span style="font-size:11.5px;color:#fff;line-height:1.55">${adv.txt}</span>
          </div>` : ''}

        </div>`;
    }).join('');

    return `<div id="gte-popup-body" style="padding:10px 10px 6px">${hero}${adviceHtml}${roomHeader}${roomRows}</div>`;
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
    /* fetch history async — aggiorna solo i div grafico quando arriva */
    _loadGraphs(cfg, el).catch(() => {});
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
      inp.oninput = () => { const q=(inp.value||'').toLowerCase().trim(); q?_openAc(inp,filterFn(q).slice(0,10),onPick):_closeAc(); };
      inp.onfocus = () => { const q=(inp.value||'').toLowerCase().trim(); if(q)_openAc(inp,filterFn(q).slice(0,10),onPick); };
      inp.onblur  = () => setTimeout(_closeAc, 160);
    }

    function _sensorMatches(q) {
      if (!h?.states) return [];
      return Object.keys(h.states)
        .filter(id => (id.startsWith('sensor.') || id.startsWith('input_number.')) &&
                      (nameOf(h,id).toLowerCase().includes(q) || id.toLowerCase().includes(q)))
        .map(id => {
          const s = h.states[id], unit = s?.attributes?.unit_of_measurement || '';
          return { id, name: nameOf(h,id), st: s?.state + (unit?' '+unit:'') };
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
            <div style="font-size:10px;color:#fff;margin-bottom:9px">Se impostati, la chip mostra questi valori invece del range min–max delle stanze.</div>
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
      const prevBody = ov.querySelector('#gtcfg-body');
      const savedScroll = prevBody ? prevBody.scrollTop : 0;
      const curLabel = ov.querySelector('#gtcfg-label')?.value;
      const curColor = ov.querySelector('#gtcfg-color')?.value;
      const curAvgT  = ov.querySelector('#gtcfg-avg-temp')?.value;
      const curAvgH  = ov.querySelector('#gtcfg-avg-hum')?.value;

      ov.innerHTML = renderForm();
      _firstRender = false;

      const nb = ov.querySelector('#gtcfg-body');
      if (nb && savedScroll > 0) nb.scrollTop = savedScroll;
      if (curLabel !== undefined) { const f=ov.querySelector('#gtcfg-label');    if(f) f.value=curLabel; }
      if (curColor !== undefined) { const f=ov.querySelector('#gtcfg-color');    if(f) f.value=curColor; }
      if (curAvgT  !== undefined) { const f=ov.querySelector('#gtcfg-avg-temp'); if(f) f.value=curAvgT;  }
      if (curAvgH  !== undefined) { const f=ov.querySelector('#gtcfg-avg-hum');  if(f) f.value=curAvgH;  }

      const avgTInp = ov.querySelector('#gtcfg-avg-temp');
      if (avgTInp) _setupAc(avgTInp, _sensorMatches, id => { avgTInp.value = id; });
      const avgHInp = ov.querySelector('#gtcfg-avg-hum');
      if (avgHInp) _setupAc(avgHInp, _sensorMatches, id => { avgHInp.value = id; });

      ov.querySelectorAll('[data-temp-idx]').forEach(inp => {
        const i = parseInt(inp.dataset.tempIdx);
        _setupAc(inp, _sensorMatches, id => { ents[i].tempEntity=id; inp.value=id; attach(); });
        inp.onchange = () => { ents[i].tempEntity = inp.value.trim(); };
      });
      ov.querySelectorAll('[data-hum-idx]').forEach(inp => {
        const i = parseInt(inp.dataset.humIdx);
        _setupAc(inp, _sensorMatches, id => { ents[i].humEntity=id; inp.value=id; });
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
          if (!ents.find(e => e.tempEntity === id)) ents.push({ tempEntity:id, humEntity:'', label:name||'' });
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
            humEntity:  (e.humEntity||'').trim(),
            label:      (e.label||'').trim(),
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
    desc: 'Chip con media temp/umidità; popup weather-style con hero, consigli e righe stanza.',
    version: '1.9',
    isDistintivo: true,
    defaultCfg: { label: 'Temperatura', color: '#38bdf8', avgTempEntity: '', avgHumEntity: '', entities: [] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-temperatura v1.9'); } catch(e) {}
})();
