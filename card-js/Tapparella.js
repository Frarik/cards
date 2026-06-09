/* frarik-version: 1.1 */
/**
 * Tapparella.js — FratechStore card "Tapparella" (cover)
 * Disegno di una tapparella reale sincronizzato con la posizione dell'entità cover,
 * pulsanti Apri / Ferma / Chiudi, percentuale e stato (Aperta/Chiusa/…).
 * Entità configurabile dall'icona ⚙ nella card (oppure dal campo Entità del ✏️) — dominio `cover`.
 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(card) { return 'frarik_tapparellacard_' + (card.id || 'x'); }
  function load(card) { try { return JSON.parse(localStorage.getItem(keyOf(card)) || '{}') || {}; } catch (e) { return {}; } }
  function save(card, o) { try { localStorage.setItem(keyOf(card), JSON.stringify(Object.assign(load(card), o))); } catch (e) {} }
  // entità: prima la config interna (⚙), poi il campo Entità del ✏️
  function entOf(card) { const c = load(card); return String(c.entity || card.entity || '').trim(); }

  function getPos(h, id) {
    const s = h && h.states && h.states[id]; if (!s) return null;
    let p = s.attributes && s.attributes.current_position;
    if (p == null) { const st = s.state; p = st === 'open' ? 100 : st === 'closed' ? 0 : 50; }
    p = parseFloat(p); if (isNaN(p)) return null;
    return Math.max(0, Math.min(100, Math.round(p)));
  }
  function stateOf(h, id) { const s = h && h.states && h.states[id]; return s ? s.state : null; }
  function statusLabel(st, pos) {
    if (st === 'opening') return 'In apertura…';
    if (st === 'closing') return 'In chiusura…';
    if (pos == null) return '—';
    if (pos >= 99 || st === 'open') return 'Aperta';
    if (pos <= 1 || st === 'closed') return 'Chiusa';
    return 'Parziale';
  }
  function statusColor(st, pos) {
    if (st === 'opening' || st === 'closing') return '#fb923c';
    if (pos != null && (pos >= 99 || st === 'open')) return '#4ade80';
    if (pos != null && (pos <= 1 || st === 'closed')) return '#f87171';
    return '#38bdf8';
  }
  function listCovers(h) {
    const out = []; const st = (h && h.states) || {};
    for (const id in st) { if (id.indexOf('cover.') === 0) out.push({ id: id, name: (st[id].attributes && st[id].attributes.friendly_name) || id }); }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  const gear = `<div data-tap="gear" title="Impostazioni" style="position:absolute;top:7px;right:7px;width:24px;height:24px;border-radius:7px;
    display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;z-index:3;
    color:rgba(255,255,255,.5);background:rgba(255,255,255,.08)">⚙️</div>`;

  function render(card) {
    const h = H(), id = entOf(card), acc = card.color || '#38bdf8';
    if (!id || id.split('.')[0] !== 'cover') {
      return `<div style="position:relative;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
        color:rgba(255,255,255,.55);text-align:center;padding:14px">${gear}
        <div style="font-size:34px">🪟</div>
        <div style="font-size:12px;font-weight:700;color:#e2e8f0">Tapparella</div>
        <div style="font-size:11px">Tocca il <b style="color:${acc}">⚙️</b> per scegliere l'entità <b style="color:${acc}">cover</b></div>
      </div>`;
    }
    const pos = getPos(h, id), st = stateOf(h, id), shutterH = pos == null ? 0 : (100 - pos);
    const btn = (act, ico, lbl, col) =>
      `<button data-cov="${act}" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
        padding:8px 4px;border-radius:11px;cursor:pointer;border:1px solid ${col}44;background:${col}1a;
        color:${col};font-weight:800;font-size:11px;transition:all .15s"
        onmouseover="this.style.background='${col}2e'" onmouseout="this.style.background='${col}1a'">
        <span style="font-size:15px;line-height:1">${ico}</span>${lbl}</button>`;

    return `<div style="position:relative;height:100%;display:flex;flex-direction:column;min-height:0;gap:9px">${gear}
      <div style="position:relative;flex:1;min-height:60px;border-radius:11px;overflow:hidden;
        background:linear-gradient(to bottom,#16314f 0%,#27567f 42%,#5b93c9 100%);
        border:3px solid #3a4252;box-shadow:inset 0 0 14px rgba(0,0,0,.45),inset 0 0 0 2px rgba(0,0,0,.25)">
        <div style="position:absolute;inset:0;background:radial-gradient(120% 60% at 70% 90%,rgba(255,255,255,.18),transparent 60%);pointer-events:none"></div>
        <div data-sh style="position:absolute;top:0;left:0;right:0;height:${shutterH}%;
          transition:height .6s cubic-bezier(.4,0,.2,1);
          background:repeating-linear-gradient(to bottom,#c4ccd8 0px,#b3bcc9 6px,#7e8796 7px,#b3bcc9 8px);
          border-bottom:4px solid #5b6472;box-shadow:0 7px 12px rgba(0,0,0,.5),inset 0 2px 0 rgba(255,255,255,.25)"></div>
      </div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;padding:0 2px">
        <span data-pct style="font-size:24px;font-weight:800;color:${acc}">${pos == null ? '—' : pos + '%'}</span>
        <span data-st style="font-size:12px;font-weight:800;letter-spacing:.3px;color:${statusColor(st, pos)}">${statusLabel(st, pos)}</span>
      </div>
      <div style="display:flex;gap:6px">
        ${btn('open', '▲', 'Apri', '#4ade80')}
        ${btn('stop', '■', 'Ferma', '#fb923c')}
        ${btn('close', '▼', 'Chiudi', '#f87171')}
      </div>
    </div>`;
  }

  function update(card, hass, el) {
    try {
      if (!el.querySelector('[data-sh]')) { el.innerHTML = render(card); return; }
      const h = H(), id = entOf(card);
      const pos = getPos(h, id), st = stateOf(h, id);
      const sh = el.querySelector('[data-sh]'); if (sh) sh.style.height = (pos == null ? 0 : (100 - pos)) + '%';
      const pe = el.querySelector('[data-pct]'); if (pe) pe.textContent = pos == null ? '—' : pos + '%';
      const se = el.querySelector('[data-st]'); if (se) { se.textContent = statusLabel(st, pos); se.style.color = statusColor(st, pos); }
    } catch (e) {}
  }

  function mount(card, hass, el) {
    if (el._tapWired) return; el._tapWired = true;
    el.addEventListener('click', e => {
      const g = e.target.closest('[data-tap="gear"]'); if (g) { e.stopPropagation(); openCfg(card, el); return; }
      const b = e.target.closest('[data-cov]'); if (!b) return;
      const id = entOf(card); if (!id) { openCfg(card, el); return; }
      const act = b.getAttribute('data-cov');
      const svc = act === 'open' ? 'open_cover' : act === 'close' ? 'close_cover' : 'stop_cover';
      try { window.callSvc('cover', svc, id); } catch (e2) {}
    });
  }

  function openCfg(card, el) {
    const h = H(), cur = entOf(card), covers = listCovers(h);
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.74);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    const opts = ['<option value="">— Seleziona tapparella —</option>']
      .concat(covers.map(c => `<option value="${c.id}"${c.id === cur ? ' selected' : ''}>${c.name}</option>`)).join('');
    ov.innerHTML = `<div style="width:min(440px,94vw);background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9">
        <div style="font-size:16px;font-weight:800;margin-bottom:4px">🪟 Tapparella</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:12px">Scegli l'entità <b>cover</b> (${covers.length} trovate). Oppure scrivila a mano.</div>
        <select id="tap-sel" style="width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.2);font-size:13px;margin-bottom:8px">${opts}</select>
        <input id="tap-man" placeholder="cover.tapparella_salotto" value="${cur}" style="width:100%;padding:11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.2);font-size:12px;font-family:monospace;box-sizing:border-box">
        <div style="display:flex;gap:10px;margin-top:16px">
          <button id="tap-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>
          <button id="tap-save" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
    // selezionando dal menu, aggiorna il campo manuale
    ov.querySelector('#tap-sel').addEventListener('change', function () { if (this.value) ov.querySelector('#tap-man').value = this.value; });
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('#tap-cancel').addEventListener('click', close);
    ov.querySelector('#tap-save').addEventListener('click', () => {
      const man = ov.querySelector('#tap-man').value.trim();
      const entity = man || ov.querySelector('#tap-sel').value || '';
      save(card, { entity: entity });
      close();
      try { el.innerHTML = render(card); } catch (e) {}   // il listener delegato su `el` resta valido
    });
  }

  const CARD = {
    id: 'tapparella', name: 'Tapparella', icon: '🪟', version: '1.1',
    desc: 'Tapparella animata sincronizzata con la cover — Apri/Ferma/Chiudi, % e stato. ⚙ per scegliere l\'entità.',
    render, update, mount
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: tapparella v' + CARD.version); } catch (e) {}
})();
