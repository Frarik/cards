/* frarik-version: 2.0 */
/**
 * GruppoCalendario.js — Distintivo FratechStore v2.0
 * Chip: count eventi nel giorno più vicino + colore giorni mancanti
 * Popup: lista eventi 7 giorni (via HA callApi), raggruppata per giorno
 */
(function () {
  'use strict';

  const ID = 'gruppo-calendario';
  const CAL_COLORS = ['#818cf8','#60a5fa','#34d399','#f59e0b','#f87171','#a78bfa','#38bdf8','#fb7185'];

  function H() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch(e) {}
    return null;
  }
  function loadCfg(cfg) { return cfg && typeof cfg === 'object' ? cfg : {}; }
  function nameOf(h, id) {
    const s = h && h.states && h.states[id];
    return (s && s.attributes && s.attributes.friendly_name) || (id && id.includes('.') ? id.split('.')[1].replace(/_/g,' ') : (id||''));
  }
  function stateOf(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || ''; }
  function attrOf(h, id, k) { const s = h && h.states && h.states[id]; return (s && s.attributes && s.attributes[k]) ?? null; }
  function eh(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function liveH(r) { return H() || (r && r.states ? r : null); }

  /* ─── Colore in base ai giorni mancanti ─── */
  function _dayColor(days, isActive) {
    if (isActive || days === 0) return '#f87171';   // rosso: ora o oggi
    if (days === null) return '#94a3b8';             // grigio: nessun evento
    if (days <= 4)  return '#f59e0b';               // arancio: entro 4 giorni
    return '#4ade80';                                // verde: 5+ giorni
  }

  /* ─── Analisi eventi da attributi entità (sincrona, per chip) ─── */
  function _soonest(h, ents) {
    if (!h || !ents.length) return { days: null, count: 0, isActive: false };
    const today = new Date(); today.setHours(0,0,0,0);
    const dayMap = {}; // dateKey YYYY-MM-DD → count
    let hasActive = false;

    ents.forEach(e => {
      const id = e.entity || e;
      const st = stateOf(h, id).toLowerCase();
      const startT = attrOf(h, id, 'start_time');
      if (st === 'on') {
        hasActive = true;
        const key = today.toISOString().slice(0,10);
        dayMap[key] = (dayMap[key] || 0) + 1;
      } else if (startT) {
        try {
          const d = new Date(startT); d.setHours(0,0,0,0);
          const days = Math.round((d - today) / 86400000);
          if (days >= 0) {
            const key = d.toISOString().slice(0,10);
            dayMap[key] = (dayMap[key] || 0) + 1;
          }
        } catch(_) {}
      }
    });

    if (!Object.keys(dayMap).length) return { days: null, count: 0, isActive: hasActive };
    const nearestKey = Object.keys(dayMap).sort()[0];
    const nearestDate = new Date(nearestKey + 'T12:00:00');
    const days = Math.round((nearestDate - new Date(today.getTime())) / 86400000);
    return { days, count: dayMap[nearestKey], isActive: hasActive };
  }

  /* ─── chip icon SVG (calendario con count) ─── */
  function _chipSvg(days, count, isActive) {
    const col = _dayColor(days, isActive);
    const isPulse = isActive || days === 0;
    const css = isPulse ? `<style>@keyframes gcalCP{0%,100%{filter:drop-shadow(0 0 2px ${col})}50%{filter:drop-shadow(0 0 8px ${col})}}</style>` : '';
    const aStyle = isPulse ? `style="animation:gcalCP 1.2s ease-in-out infinite"` : '';
    const num = count > 0 ? String(count) : '–';
    return `${css}<svg viewBox="0 0 22 24" width="14" height="16" style="display:inline-block;vertical-align:middle;overflow:visible" ${aStyle}>
      <rect x="2" y="5" width="18" height="17" rx="3" fill="${col}" opacity=".5"/>
      <rect x="2" y="5" width="18" height="6" rx="3" fill="${col}" opacity=".85"/>
      <rect x="2" y="8" width="18" height="3" fill="${col}" opacity=".85"/>
      <line x1="7" y1="3" x2="7" y2="8" stroke="${col}" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="15" y1="3" x2="15" y2="8" stroke="${col}" stroke-width="1.8" stroke-linecap="round"/>
      <text x="11" y="19.5" text-anchor="middle" font-size="7.5" font-weight="900" fill="#fff" font-family="system-ui">${eh(num)}</text>
    </svg>`;
  }

  /* ─── chip() ─── */
  function chip(cfg, rawHass) {
    const c   = loadCfg(cfg);
    const h   = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const { days, count, isActive } = _soonest(h, ents);

    const color = _dayColor(days, isActive);
    const value = !ents.length   ? '—'
      : days === null            ? 'Nessuno'
      : isActive                 ? `${count} ora`
      : days === 0               ? `${count} oggi`
      : days === 1               ? `${count} dom.`
      : `${count} fra ${days}gg`;

    const _fcr = window.FratechColorRules;
    const _cond = { event_today: days === 0 || isActive, event_soon: v => days !== null && days >= 0 && days <= parseFloat(v||7), no_event: days === null };
    return {
      icon: _chipSvg(days, count, isActive),
      label: c.label || 'Calendario',
      value,
      color: (_fcr && _fcr.evalColor(cfg, _cond)) || color,
      borderColor: _fcr && _fcr.evalBorderColor(cfg, _cond),
    };
  }

  function watchEntities(cfg) {
    return (Array.isArray(loadCfg(cfg).entities) ? loadCfg(cfg).entities : []).map(e => e.entity||e).filter(Boolean);
  }

  /* ─── Helpers formato evento ─── */
  function _evDayKey(ev) {
    return ev.start?.dateTime ? ev.start.dateTime.slice(0,10)
         : ev.start?.date     ? ev.start.date
         : '';
  }

  function _evTime(ev) {
    if (!ev.start?.dateTime) return 'Tutto il giorno';
    const d  = new Date(ev.start.dateTime);
    const hm = d.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'});
    if (!ev.end?.dateTime) return hm;
    const de  = new Date(ev.end.dateTime);
    const hme = de.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'});
    return `${hm} – ${hme}`;
  }

  function _daysFromToday(dateStr) {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      const t = new Date(); t.setHours(12,0,0,0);
      return Math.round((d - t) / 86400000);
    } catch(_) { return 99; }
  }

  function _dayLabel(dateStr) {
    const days = _daysFromToday(dateStr);
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('it-IT', {weekday:'long', day:'numeric', month:'long'});
    } catch(_) { return dateStr; }
  }

  /* ─── Fetch 7 giorni via HA callApi ─── */
  async function _fetchWeekEvents(cfg, h) {
    const c    = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    if (!ents.length || !h || typeof h.callApi !== 'function') return [];

    const now    = new Date();
    const end    = new Date(now.getTime() + 7 * 86400000);
    const sStr   = now.toISOString();
    const eStr   = end.toISOString();

    const results = await Promise.all(ents.map((e, i) => {
      const id = e.entity || e;
      const calColor = CAL_COLORS[i % CAL_COLORS.length];
      return h.callApi('GET', `calendars/${encodeURIComponent(id)}?start=${encodeURIComponent(sStr)}&end=${encodeURIComponent(eStr)}`)
        .then(arr => (Array.isArray(arr) ? arr : []).map(ev => ({
          ...ev, _calId: id, _calName: e.label || nameOf(h, id), _calColor: calColor,
        })))
        .catch(() => []);
    }));

    const all = [].concat(...results);
    all.sort((a, b) => {
      const sa = a.start?.dateTime || (a.start?.date ? a.start.date+'T00:00:00' : '');
      const sb = b.start?.dateTime || (b.start?.date ? b.start.date+'T00:00:00' : '');
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    });
    return all;
  }

  /* ─── render popup loading ─── */
  function _renderLoading() {
    return `<div style="padding:44px 20px;text-align:center">
      <div style="font-size:26px;display:inline-block;animation:gcalSpin 1.1s linear infinite">📅</div>
      <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:10px">Caricamento eventi…</div>
      <style>@keyframes gcalSpin{to{transform:rotate(20deg)translateY(-2px)rotate(-20deg)}}</style>
    </div>`;
  }

  /* ─── render popup eventi (da API) ─── */
  function _renderEvents(cfg, events, h) {
    if (!events.length) {
      return `<div style="padding:40px 20px;text-align:center;color:#fff">
        <div style="font-size:36px;margin-bottom:10px">🎉</div>
        <div style="font-size:13px;font-weight:700">Nessun evento nei prossimi 7 giorni</div>
        <div style="font-size:11px;color:#fff;margin-top:5px">La settimana è libera!</div>
      </div>`;
    }

    // Raggruppa per giorno
    const byDay = {}, dayOrder = [];
    events.forEach(ev => {
      const k = _evDayKey(ev); if (!k) return;
      if (!byDay[k]) { byDay[k] = []; dayOrder.push(k); }
      byDay[k].push(ev);
    });

    const html = dayOrder.map(dayKey => {
      const daysAway  = _daysFromToday(dayKey);
      const hdrCol    = daysAway === 0 ? '#f87171' : daysAway <= 4 ? '#f59e0b' : '#4ade80';
      const label     = _dayLabel(dayKey);
      const dayEvs    = byDay[dayKey];
      const nEvs      = dayEvs.length;

      const rows = dayEvs.map(ev => {
        const title    = ev.summary || ev.message || '(senza titolo)';
        const timeStr  = _evTime(ev);
        const loc      = ev.location || '';
        const calColor = ev._calColor || '#818cf8';
        const calName  = ev._calName  || '';

        return `<div style="display:flex;align-items:flex-start;gap:12px;padding:13px 16px 13px 14px;border-bottom:1px solid rgba(255,255,255,.06)">
          <div style="padding-top:6px;flex-shrink:0">
            <div style="width:10px;height:10px;border-radius:50%;background:${calColor}"></div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:15px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(title)}</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:5px;align-items:center">
              <span style="font-size:12px;color:#fff;font-weight:600">${eh(timeStr)}</span>
              ${loc ? `<span style="font-size:11px;color:#fff">📍 ${eh(String(loc).slice(0,40))}</span>` : ''}
            </div>
          </div>
        </div>`;
      }).join('');

      return `<div>
        <div style="padding:10px 16px 9px;background:linear-gradient(90deg,${hdrCol}28,transparent);border-left:3px solid ${hdrCol};display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;font-weight:800;color:${hdrCol};text-transform:capitalize">${eh(label)}</span>
          <span style="font-size:11px;color:#fff;font-weight:600">${nEvs} event${nEvs>1?'i':'o'}</span>
        </div>
        ${rows}
      </div>`;
    }).join('');

    return `<div id="gcal-popup-body">${html}</div>`;
  }

  /* ─── render() — framework lo chiama alla prima apertura popup ─── */
  function render(cfg, rawHass) {
    const c    = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    if (!ents.length) {
      return `<div id="gcal-popup-body"><div style="padding:36px 20px;text-align:center;color:#fff;font-size:12px">Nessun calendario configurato.<br><span style="font-size:10px;color:rgba(255,255,255,.5)">Clicca ✏️ sulla chip per configurare.</span></div></div>`;
    }
    return _renderLoading();
  }

  /* ─── _hideSubtitle ─── */
  function _hideSubtitle(el) {
    try {
      const hdr = el.previousElementSibling; if (!hdr) return;
      const tw = hdr.children && hdr.children[1]; if (!tw) return;
      const sub = tw.children && tw.children[1]; if (!sub) return;
      sub.style.display = 'none';
    } catch(e) {}
  }

  /* ─── mount() — fetch API e aggiorna popup ─── */
  function mount(cfg, rawHass, el) {
    setTimeout(() => _hideSubtitle(el), 0);

    const _doFetch = () => {
      const h = H() || rawHass;
      const c = loadCfg(cfg);
      if (!(Array.isArray(c.entities) ? c.entities : []).length) {
        el.innerHTML = render(cfg, h); _hideSubtitle(el); return;
      }
      if (!h || typeof h.callApi !== 'function') {
        el.innerHTML = `<div style="padding:24px;text-align:center;color:rgba(255,255,255,.5);font-size:11px">⚠️ API HA non disponibile — usa la modalità add-on</div>`;
        _hideSubtitle(el); return;
      }
      el.innerHTML = _renderLoading(); _hideSubtitle(el);
      _fetchWeekEvents(cfg, h).then(events => {
        if (!el.isConnected) return;
        el.innerHTML = _renderEvents(cfg, events, h);
        _hideSubtitle(el);
      });
    };

    _doFetch();

    if (el._gcalPoll) clearInterval(el._gcalPoll);
    el._gcalPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gcalPoll); delete el._gcalPoll; return; }
      _doFetch();
    }, 5 * 60 * 1000);
  }

  /* ─── update() — throttled refetch quando entità cambiano ─── */
  function update(cfg, rawHass, el) {
    if (!el.isConnected || el._gcalFetching) return;
    el._gcalFetching = true;
    setTimeout(() => { el._gcalFetching = false; }, 15000);
    const h = H() || rawHass;
    if (!h || typeof h.callApi !== 'function') return;
    _fetchWeekEvents(cfg, h).then(events => {
      if (!el.isConnected) return;
      el.innerHTML = _renderEvents(cfg, events, h);
      try { _hideSubtitle(el); } catch(_) {}
    });
  }

  /* ─── configure() ─── */
  function configure(cfg, _el, onSave) {
    const c    = loadCfg(cfg);
    let colorCfg = { mode: c.colorMode||'fixed', fixed: c.colorFixed||c.color||'#60a5fa', rules: Array.isArray(c.colorRules)?JSON.parse(JSON.stringify(c.colorRules)):[], borderMode: c.borderMode||'none', borderFixed: c.borderFixed||'#ffffff', borderRules: Array.isArray(c.borderRules)?JSON.parse(JSON.stringify(c.borderRules)):[] };
    const presets = [
      { key: 'event_today', label: 'Evento oggi o in corso' },
      { key: 'event_soon',  label: 'Evento entro', hasValue: true, unit: 'giorni' },
      { key: 'no_event',    label: 'Nessun evento' },
      { key: 'fallback',    label: 'Sempre (fallback)' },
    ];
    const ents = JSON.parse(JSON.stringify(Array.isArray(c.entities) ? c.entities : []));
    const h    = H();
    let _firstRender = true, _acDrop = null;

    function _closeAc() { if (_acDrop) { try { _acDrop.remove(); } catch(e){} _acDrop = null; } }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 200;
      const useAbove = (window.innerHeight - rect.bottom - 6) < MAXH && rect.top > MAXH;
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight-rect.top+4}px` : `top:${rect.bottom+4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#0a1628;border:1px solid rgba(96,165,250,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
      matches.forEach((m,i) => {
        const calColor = CAL_COLORS[i % CAL_COLORS.length];
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:${m.isCalendar?calColor:'#94a3b8'};flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.5)">${eh(m.id)}</div>
          </div>
          ${m.active?'<span style="font-size:9px;color:#f87171;font-weight:700">● ora</span>':''}
        </div>`;
        r.addEventListener('mouseover', () => r.style.background='rgba(96,165,250,.08)');
        r.addEventListener('mouseout',  () => r.style.background='transparent');
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id, m.name); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.addEventListener('input', () => { const q=(inp.value||'').toLowerCase().trim(); if(!q){_closeAc();return;} _openAc(inp,filterFn(q).slice(0,14),onPick); });
      inp.addEventListener('focus', () => { const q=(inp.value||'').toLowerCase().trim()||'cal'; _openAc(inp,filterFn(q).slice(0,14),onPick); });
      inp.addEventListener('blur',  () => setTimeout(_closeAc, 160));
    }

    function _calMatches(q) {
      if (!h || !h.states) return [];
      const lq = q.toLowerCase();
      return Object.keys(h.states)
        .filter(id => id.toLowerCase().includes(lq) || nameOf(h,id).toLowerCase().includes(lq))
        .sort((a,b)=> (a.startsWith('calendar.')?0:1)-(b.startsWith('calendar.')?0:1) || a.localeCompare(b))
        .map((id,i) => ({ id, name:nameOf(h,id), isCalendar:id.startsWith('calendar.'), active:stateOf(h,id).toLowerCase()==='on' }));
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try{document.body.removeChild(ov);}catch(e){} document.removeEventListener('keydown',escFn); }
    function escFn(ev) { if(ev.key==='Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    function renderForm() {
      const selRows = ents.map((e,i) => {
        const id = e.entity||e;
        const lbl = e.label || nameOf(h,id);
        const active = stateOf(h,id).toLowerCase()==='on';
        const calColor = CAL_COLORS[i % CAL_COLORS.length];
        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:10px;height:10px;border-radius:50%;background:${calColor};flex-shrink:0"></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:rgba(255,255,255,.5)">${eh(id)}</div>
            </div>
            ${active?'<span style="font-size:9px;color:#f87171;font-weight:700">● ora</span>':''}
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px">✕</button>
          </div>
        </div>`;
      }).join('');

      const anim = _firstRender ? 'animation:gcalCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0d1a;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>
          @keyframes gcalCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .gcalinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit}
          .gcalinp::placeholder{color:rgba(255,255,255,.4)}
          #gcalcfg-body::-webkit-scrollbar{display:none}
        </style>
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(96,165,250,.13);border:1px solid rgba(96,165,250,.28);display:flex;align-items:center;justify-content:center;font-size:18px">📅</div>
          <div style="flex:1"><div style="font-size:14px;font-weight:800;color:#fff">Configura — Calendario</div></div>
          <button id="gcalcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>
        <div id="gcalcfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:rgba(255,255,255,.55);margin-bottom:3px">Nome chip</div><input id="gcalcfg-label" class="gcalinp" placeholder="Calendario" value="${eh(c.label||'Calendario')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:rgba(255,255,255,.55);margin-bottom:3px">Colore</div><input type="color" id="gcalcfg-color" value="${(c.color||'#60a5fa').match(/^#[0-9a-f]{6}$/i)?c.color:'#60a5fa'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>
          ${ents.length ? `<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.5);margin-bottom:6px">Calendari (${ents.length})</div><div style="margin-bottom:12px">${selRows}</div>` : ''}
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.5);margin-bottom:6px">Aggiungi calendario</div>
          <input id="gcalcfg-add" class="gcalinp" placeholder="🔍 Cerca calendar.*…" autocomplete="off">
          <div style="margin-top:5px;padding:7px 10px;border-radius:8px;background:rgba(96,165,250,.06);border:1px solid rgba(96,165,250,.15);font-size:10px;color:rgba(255,255,255,.7)">
            💡 Usa entità <strong style="color:#60a5fa">calendar.*</strong>. Il popup mostra tutti gli eventi dei prossimi 7 giorni tramite API HA.
          </div>
          ${window.FratechColorRules ? window.FratechColorRules.html(colorCfg, presets) : ''}
          <div style="height:18px"></div>
        </div>
        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gcalcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#60a5fa;color:#00091a;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gcalcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#gcalcfg-body');
      const saved = prevBody ? prevBody.scrollTop : 0;
      ov.innerHTML = renderForm();
      _firstRender = false;
      const _fcr = window.FratechColorRules;
      if (_fcr) _fcr.attach(ov.querySelector('#fcr-section'), presets, () => { colorCfg = _fcr.read(ov.querySelector('#fcr-section')) || colorCfg; });
      const nb = ov.querySelector('#gcalcfg-body'); if (nb && saved > 0) nb.scrollTop = saved;
      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);
      ov.querySelector('#gcalcfg-close').onclick = closeOv;
      ov.querySelector('#gcalcfg-cancel').onclick = closeOv;
      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => { ents.splice(parseInt(btn.dataset.del), 1); attach(); });
      });
      const addInp = ov.querySelector('#gcalcfg-add');
      if (addInp) {
        _setupAc(addInp, _calMatches, (id, name) => {
          if (!ents.find(e => (e.entity||e) === id)) ents.push({ entity:id, label:name||'' });
          addInp.value = ''; attach();
        });
      }
      ov.querySelector('#gcalcfg-save').addEventListener('click', () => {
        closeOv();
        const _fcrData = _fcr ? (_fcr.read(ov.querySelector('#fcr-section')) || {}) : {};
        if (typeof onSave === 'function') onSave({
          ..._fcrData,
          label:    (ov.querySelector('#gcalcfg-label')?.value || 'Calendario').trim(),
          color:    ov.querySelector('#gcalcfg-color')?.value || '#60a5fa',
          entities: ents.filter(e => e.entity||e).map(e => ({ entity:(e.entity||e).trim(), label:e.label||'' })),
        });
      });
    }

    attach();
    document.body.appendChild(ov);
  }

  /* ─── registrazione ─── */
  const CARD = {
    id: ID, name: 'Gruppo Calendario', icon: 'mdi:calendar',
    desc: 'Chip con count eventi del giorno più vicino + colore per giorni mancanti. Popup: 7 giorni di eventi via API HA.',
    version: '2.0', isDistintivo: true,
    defaultCfg: { label:'Calendario', icon:'mdi:calendar', color:'#60a5fa', entities:[], colorMode:'auto', colorRules:[] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-calendario v2.0'); } catch(e) {}
})();
