/* frarik-version: 1.0 */
/**
 * GruppoScadenze.js — Distintivo FratechStore v1.0
 * Chip scadenze/date — clessidra animata, urgente/scaduto/ok
 */
(function () {
  'use strict';

  const ID = 'gruppo-scadenze';
  const DEF_URGENT = 7;

  function H() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    return null;
  }
  function loadCfg(cfg) { return cfg && typeof cfg === 'object' ? cfg : {}; }
  function nameOf(h, id) {
    const s = h && h.states && h.states[id];
    return (s && s.attributes && s.attributes.friendly_name) || (id && id.includes('.') ? id.split('.')[1].replace(/_/g,' ') : (id||''));
  }
  function stateOf(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || ''; }
  function eh(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function liveH(r) { return H() || (r && r.states ? r : null); }

  /* ─── date parsing → giorni rimanenti ─── */
  function _parseDays(val) {
    if (val === null || val === undefined || val === '' || val === 'unknown') return null;
    const sv = String(val).trim();
    if (/^-?\d+$/.test(sv)) return parseInt(sv, 10);
    let d = new Date(sv);
    if (!isNaN(d.getTime())) {
      const now = new Date(); now.setHours(0,0,0,0); d.setHours(0,0,0,0);
      return Math.round((d - now) / 86400000);
    }
    const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(sv);
    if (m) {
      d = new Date(+m[3], +m[2]-1, +m[1]); d.setHours(0,0,0,0);
      const now = new Date(); now.setHours(0,0,0,0);
      return Math.round((d - now) / 86400000);
    }
    return null;
  }

  const FALLBACK_ATTRS = ['expiry_date','expiry','due_date','due','end_date','valid_until','date','scadenza'];

  function _getRaw(h, e) {
    if (!h || !h.states || !h.states[e.entity]) return stateOf(h, e.entity);
    const attrs = h.states[e.entity].attributes || {};
    if (e.date_attr && attrs[e.date_attr] !== undefined) return attrs[e.date_attr];
    for (const k of FALLBACK_ATTRS) { if (attrs[k] !== undefined) return attrs[k]; }
    return stateOf(h, e.entity);
  }

  function _getDays(h, e) { return _parseDays(_getRaw(h, e)); }

  function _status(days, urgentDays) {
    if (days === null) return 'unknown';
    if (days < 0) return 'expired';
    if (days <= urgentDays) return 'urgent';
    return 'ok';
  }

  function _daysLabel(days) {
    if (days === null) return '—';
    if (days < 0) return `${Math.abs(days)}gg fa`;
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    return `${days}gg`;
  }

  /* ─── chip icon SVG (piccola clessidra) ─── */
  function _chipSvg(hasExpired, hasUrgent) {
    const col = hasExpired ? '#f87171' : hasUrgent ? '#f59e0b' : '#4ade80';
    const anim = (hasExpired || hasUrgent)
      ? `<style>@keyframes gscChP{0%,100%{filter:drop-shadow(0 0 2px ${col})}50%{filter:drop-shadow(0 0 7px ${col})}}</style>`
      : '';
    return `${anim}<svg viewBox="0 0 22 32" width="12" height="18" style="display:inline-block;vertical-align:middle;overflow:visible">
      <line x1="2" y1="2" x2="20" y2="2" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="2" y1="30" x2="20" y2="30" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M3,2 L19,2 L11,14 L11,18 L19,30 L3,30 L11,18 L11,14 Z" fill="${col}" opacity="${hasExpired||hasUrgent?'.75':'.45'}"${hasExpired||hasUrgent?' style="animation:gscChP .9s ease-in-out infinite"':''}/>
    </svg>`;
  }

  /* ─── chip() ─── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const ud = c.urgent_days != null ? +c.urgent_days : DEF_URGENT;

    let exp = 0, urg = 0;
    if (h) ents.forEach(e => {
      const st = _status(_getDays(h, e), ud);
      if (st === 'expired') exp++;
      else if (st === 'urgent') urg++;
    });

    const isAlert = exp > 0 || urg > 0;
    const value = !ents.length ? '—' : exp > 0 ? `${exp} scad.` : urg > 0 ? `${urg} urge` : 'OK';

    return {
      icon: _chipSvg(exp > 0, urg > 0),
      label: c.label || 'Scadenze',
      value,
      color: exp > 0 ? '#f87171' : urg > 0 ? '#f59e0b' : '#4ade80',
    };
  }

  function watchEntities(cfg) {
    return (Array.isArray(loadCfg(cfg).entities) ? loadCfg(cfg).entities : []).map(e => e.entity).filter(Boolean);
  }

  /* ─── SVG clessidra (per ogni riga popup) ─── */
  function _hourglassSvg(status, days, idx) {
    const s = `gscH${idx}`;
    const col   = status==='expired' ? '#f87171' : status==='urgent' ? '#f59e0b' : '#4ade80';
    const dark  = status==='expired' ? '#dc2626' : status==='urgent' ? '#d97706' : '#16a34a';
    const bgA   = status==='expired' ? 'rgba(248,113,113,' : status==='urgent' ? 'rgba(245,158,11,' : 'rgba(74,222,128,';

    /* geometria: top half apex (28,38) base y=5, bot half apex (28,50) base y=83 */
    const topFill = status==='expired' ? 0   : status==='urgent' ? 0.45 : 0.88;
    const botFill = status==='expired' ? 1   : status==='urgent' ? 0.45 : 0.08;
    const TH = 33, BH = 33, HW = 20; // half-height top, half-height bot, half-width at base

    const tBot  = 5 + TH*(1-topFill);
    const tHW   = HW*(38-tBot)/TH;
    const bTop  = 83 - BH*botFill;
    const bHW   = HW*(bTop-50)/BH;

    const topSand = topFill>0.01
      ? `<polygon points="${(28-tHW).toFixed(1)},${tBot.toFixed(1)} 8,5 48,5 ${(28+tHW).toFixed(1)},${tBot.toFixed(1)}" fill="${dark}" opacity=".65"/>`
      : '';
    const botSand = botFill>0.01
      ? `<polygon points="${(28-Math.max(bHW,0)).toFixed(1)},${bTop.toFixed(1)} 8,83 48,83 ${(28+Math.max(bHW,0)).toFixed(1)},${bTop.toFixed(1)}" fill="${dark}" opacity=".7"/>`
      : '';

    const pulseCss = status==='expired'
      ? `@keyframes ${s}Pu{0%,100%{filter:drop-shadow(0 0 4px rgba(248,113,113,.4))}50%{filter:drop-shadow(0 0 10px rgba(248,113,113,.85))}}`
      : '';
    const sandCss = status==='urgent'
      ? `@keyframes ${s}Sd{0%{transform:translateY(0);opacity:.9}100%{transform:translateY(10px);opacity:0}}`
      : '';
    const frameStyle = status==='expired' ? `style="animation:${s}Pu 1.3s ease-in-out infinite"` : '';

    const badge = status==='expired' ? 'SCADUTO'
      : days===0 ? 'OGGI' : days===1 ? 'DOMANI' : `${days}gg`;

    return `<style>${pulseCss}${sandCss}</style>
    <svg viewBox="0 0 56 92" width="42" height="69" style="display:block;overflow:visible">
      <!-- cornice clessidra -->
      <path d="M8,5 L48,5 L28,38 L28,50 L48,83 L8,83 L28,50 L28,38 Z" fill="${bgA}.08)" stroke="${col}" stroke-width="1.5" stroke-linejoin="round" ${frameStyle}/>
      <!-- barre -->
      <line x1="5" y1="5"  x2="51" y2="5"  stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="5" y1="83" x2="51" y2="83" stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>
      <!-- sabbia top -->
      ${topSand}
      <!-- sabbia bottom -->
      ${botSand}
      <!-- granuli cadenti (urgent) -->
      ${status==='urgent' ? `
      <circle cx="28" cy="41" r="2"   fill="${col}" style="animation:${s}Sd 1.3s ease-in infinite"/>
      <circle cx="28" cy="38" r="1.4" fill="${col}" style="animation:${s}Sd 1.3s ease-in infinite .44s"/>
      <circle cx="28" cy="45" r="1.1" fill="${col}" style="animation:${s}Sd 1.3s ease-in infinite .88s"/>
      ` : ''}
      <!-- badge giorni -->
      <text x="28" y="91" text-anchor="middle" font-size="9.5" font-weight="800" fill="${col}" font-family="system-ui">${eh(badge)}</text>
    </svg>`;
  }

  /* ─── render() ─── */
  function render(cfg, rawHass) {
    const c   = loadCfg(cfg);
    const h   = liveH(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const ud  = c.urgent_days != null ? +c.urgent_days : DEF_URGENT;

    /* sort: expired first, then urgent by days, then ok */
    const sorted = [...ents].map(e => {
      const days = _getDays(h, e);
      return { e, days, status: _status(days, ud) };
    }).sort((a, b) => {
      const rank = { expired:0, urgent:1, ok:2, unknown:3 };
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      if (a.days !== null && b.days !== null) return a.days - b.days;
      return 0;
    });

    const rows = sorted.map(({ e, days, status }, i) => {
      if (!e.entity) return '';
      const lbl  = e.label || nameOf(h, e.entity);
      const col  = status==='expired' ? '#f87171' : status==='urgent' ? '#f59e0b' : '#4ade80';
      const stBg = status==='expired' ? 'rgba(248,113,113,.14)' : status==='urgent' ? 'rgba(245,158,11,.13)' : 'rgba(74,222,128,.11)';
      const stBdr= status==='expired' ? 'rgba(248,113,113,.42)' : status==='urgent' ? 'rgba(245,158,11,.38)' : 'rgba(74,222,128,.28)';
      const pill = status==='expired' ? '⚠️ Scaduto'
        : days===0 ? '🔴 Oggi'
        : days===1 ? '🟠 Domani'
        : status==='urgent' ? `⏰ ${days}gg`
        : days!==null ? `✓ ${days}gg` : '—';
      const rowBg = status==='expired' ? 'background:rgba(248,113,113,.04)' : status==='urgent' ? 'background:rgba(245,158,11,.03)' : '';

      return `<div style="border-bottom:1px solid rgba(255,255,255,.04);${rowBg}">
        <div style="display:flex;align-items:center;gap:12px;padding:10px 16px">
          <div style="flex-shrink:0">${_hourglassSvg(status, days, i)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
          </div>
          <div style="padding:4px 11px;border-radius:20px;background:${stBg};border:1px solid ${stBdr};font-size:11px;font-weight:700;color:${col};white-space:nowrap;flex-shrink:0">${pill}</div>
        </div>
      </div>`;
    }).join('');

    return `<div id="gscad-popup-body">
      <div>${rows || '<div style="padding:36px 20px;text-align:center;color:#fff;font-size:12px">Nessuna scadenza configurata.<br><span style="font-size:10px;color:rgba(255,255,255,.5)">Clicca ✏️ sulla chip per configurare.</span></div>'}</div>
    </div>`;
  }

  /* ─── mount ─── */
  function _hideSubtitle(el) {
    try {
      const hdr = el.previousElementSibling; if (!hdr) return;
      const tw = hdr.children && hdr.children[1]; if (!tw) return;
      const sub = tw.children && tw.children[1]; if (!sub) return;
      sub.style.display = 'none';
    } catch(e) {}
  }

  function mount(cfg, rawHass, el) {
    setTimeout(() => _hideSubtitle(el), 0);
    if (el._gscPoll) return;
    el._gscPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._gscPoll); delete el._gscPoll; return; }
      try {
        const h = H(); if (!h) return;
        const sp = el.parentElement, st = sp ? sp.scrollTop : 0;
        el.innerHTML = render(cfg, h);
        _hideSubtitle(el);
        if (sp && st > 0) sp.scrollTop = st;
      } catch(e) {}
    }, 60000);
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, rawHass || null); } catch(e) {}
  }

  /* ─── configure ─── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const ents = JSON.parse(JSON.stringify(Array.isArray(c.entities) ? c.entities : []));
    const h = H();
    let _firstRender = true, _acDrop = null;

    function _closeAc() { if (_acDrop) { try { _acDrop.remove(); } catch(e){} _acDrop = null; } }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 220;
      const useAbove = (window.innerHeight - rect.bottom - 6) < MAXH && rect.top > MAXH;
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#0a1628;border:1px solid rgba(245,158,11,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin`;
      matches.forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:9px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;flex-shrink:0">${m.icon||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.55)">${eh(m.id)}</div>
          </div>
        </div>`;
        r.addEventListener('mouseover', () => r.style.background='rgba(245,158,11,.08)');
        r.addEventListener('mouseout',  () => r.style.background='transparent');
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id, m.name); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.addEventListener('input', () => {
        const q = (inp.value||'').toLowerCase().trim();
        if (!q) { _closeAc(); return; }
        _openAc(inp, filterFn(q).slice(0,12), onPick);
      });
      inp.addEventListener('focus', () => {
        const q = (inp.value||'').toLowerCase().trim();
        if (q) _openAc(inp, filterFn(q).slice(0,12), onPick);
      });
      inp.addEventListener('blur', () => setTimeout(_closeAc, 160));
    }

    function _entityMatches(q) {
      if (!h || !h.states) return [];
      const lq = q.toLowerCase();
      return Object.keys(h.states)
        .filter(id => nameOf(h,id).toLowerCase().includes(lq) || id.toLowerCase().includes(lq))
        .map(id => {
          const dom = id.split('.')[0];
          const icons = { sensor:'⏳', input_datetime:'📅', calendar:'📆', binary_sensor:'🔔' };
          return { id, name: nameOf(h,id), icon: icons[dom]||'📦' };
        })
        .sort((a,b) => {
          const rank = id => ['sensor','input_datetime','calendar'].includes(id.split('.')[0]) ? 0 : 1;
          if (rank(a.id)!==rank(b.id)) return rank(a.id)-rank(b.id);
          return a.name.localeCompare(b.name);
        });
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.8);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch(e){} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key==='Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    function renderForm() {
      const ud = c.urgent_days != null ? c.urgent_days : DEF_URGENT;
      const selRows = ents.map((e, i) => {
        const lbl = e.label || nameOf(h, e.entity);
        const days = _getDays(h, e);
        const st = _status(days, ud);
        const dotCol = st==='expired'?'#f87171':st==='urgent'?'#f59e0b':'#4ade80';
        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:8px;color:${dotCol}">⬤</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:rgba(255,255,255,.5)">${eh(e.entity)}${e.date_attr?` · attr: ${e.date_attr}`:''}</div>
            </div>
            <div style="font-size:10px;color:${dotCol};font-weight:700;flex-shrink:0">${_daysLabel(days)}</div>
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0;margin-left:4px">✕</button>
          </div>
        </div>`;
      }).join('');

      const anim = _firstRender ? 'animation:gscCfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';
      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>
          @keyframes gscCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
          .gscinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit}
          .gscinp::placeholder{color:rgba(255,255,255,.45)}
          #gsccfg-body::-webkit-scrollbar{display:none}
        </style>
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(245,158,11,.13);border:1px solid rgba(245,158,11,.28);display:flex;align-items:center;justify-content:center;font-size:18px">⏳</div>
          <div style="flex:1"><div style="font-size:14px;font-weight:800;color:#fff">Configura — Scadenze</div></div>
          <button id="gsccfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>
        <div id="gsccfg-body" style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding:14px 14px 4px">
          <div style="display:flex;gap:7px;margin-bottom:14px">
            <div style="flex:1"><div style="font-size:9px;color:rgba(255,255,255,.55);margin-bottom:3px">Nome chip</div><input id="gsccfg-label" class="gscinp" placeholder="Scadenze" value="${eh(c.label||'Scadenze')}"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:rgba(255,255,255,.55);margin-bottom:3px">Colore</div><input type="color" id="gsccfg-color" value="${(c.color||'#f59e0b').match(/^#[0-9a-f]{6}$/i)?c.color:'#f59e0b'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
            <div style="flex:0 0 60px"><div style="font-size:9px;color:rgba(255,255,255,.55);margin-bottom:3px">Urgente (gg)</div><input type="number" id="gsccfg-urgent" class="gscinp" style="padding:8px 6px;text-align:center" value="${ud}" min="1" max="365"></div>
          </div>
          ${ents.length ? `<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.5);margin-bottom:6px">Scadenze (${ents.length})</div><div style="margin-bottom:12px">${selRows}</div>` : ''}
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.5);margin-bottom:6px">Aggiungi sensore</div>
          <input id="gsccfg-add" class="gscinp" placeholder="🔍 Cerca sensor.* o input_datetime.*…" autocomplete="off">
          <div style="margin-top:5px;padding:7px 10px;border-radius:8px;background:rgba(245,158,11,.05);border:1px solid rgba(245,158,11,.14);font-size:10px;color:rgba(255,255,255,.7)">
            💡 Il sensore deve avere la data in <strong style="color:#f59e0b">state</strong> (es. <code>2026-09-15</code>) o in un attributo come <code>expiry_date</code>. Se l'attributo ha nome diverso, aggiungilo nel campo "Attr" dopo.
          </div>
          <div style="height:18px"></div>
        </div>
        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="gsccfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#f59e0b;color:#1a0e00;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gsccfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      _closeAc();
      const prevBody = ov.querySelector('#gsccfg-body');
      const saved = prevBody ? prevBody.scrollTop : 0;
      ov.innerHTML = renderForm();
      _firstRender = false;
      const nb = ov.querySelector('#gsccfg-body'); if (nb && saved > 0) nb.scrollTop = saved;

      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);
      ov.querySelector('#gsccfg-close').onclick = closeOv;
      ov.querySelector('#gsccfg-cancel').onclick = closeOv;

      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => { ents.splice(parseInt(btn.dataset.del), 1); attach(); });
      });

      const addInp = ov.querySelector('#gsccfg-add');
      if (addInp) {
        _setupAc(addInp, _entityMatches, (id, name) => {
          if (!ents.find(e => e.entity === id)) ents.push({ entity: id, label: name||'', date_attr: '' });
          addInp.value = '';
          attach();
        });
      }

      ov.querySelector('#gsccfg-save').addEventListener('click', () => {
        const newCfg = {
          label:       (ov.querySelector('#gsccfg-label')?.value || 'Scadenze').trim(),
          color:       ov.querySelector('#gsccfg-color')?.value || '#f59e0b',
          urgent_days: parseInt(ov.querySelector('#gsccfg-urgent')?.value||'7', 10) || DEF_URGENT,
          entities:    ents.filter(e => e.entity).map(e => ({ entity:e.entity.trim(), label:e.label||'', date_attr:e.date_attr||'' })),
        };
        closeOv();
        if (typeof onSave === 'function') onSave(newCfg);
      });
    }

    attach();
    document.body.appendChild(ov);
  }

  /* ─── registrazione ─── */
  const CARD = {
    id: ID, name: 'Gruppo Scadenze', icon: 'mdi:timer-sand',
    desc: 'Chip scadenze/date. Verde=ok, arancio=urgente, rosso=scaduto. Clessidra animata per ogni voce.',
    version: '1.0', isDistintivo: true,
    defaultCfg: { label:'Scadenze', icon:'mdi:timer-sand', color:'#f59e0b', urgent_days:7, entities:[] },
    chip, watchEntities, render, mount, update, configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-scadenze v1.0'); } catch(e) {}
})();
