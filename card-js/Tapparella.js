/* frarik-version: 1.0 */
/**
 * Tapparella.js — FratechStore card "Tapparella" (cover)
 * Disegno di una tapparella reale sincronizzato con la posizione dell'entità cover,
 * pulsanti Apri / Ferma / Chiudi, percentuale e stato (Aperta/Chiusa/…).
 * Entità configurabile dal ✏️ — dev'essere di dominio `cover`.
 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function ent(card) { return card && card.entity ? String(card.entity) : ''; }

  // posizione 0–100 (100 = tutta aperta). Se l'entità non riporta current_position → deriva dallo stato.
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

  function render(card) {
    const h = H(), id = ent(card), acc = card.color || '#38bdf8';
    if (!id || id.split('.')[0] !== 'cover') {
      return `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
        color:rgba(255,255,255,.55);text-align:center;padding:14px">
        <div style="font-size:34px">🪟</div>
        <div style="font-size:12px;font-weight:700;color:#e2e8f0">Tapparella</div>
        <div style="font-size:11px">Configura un'entità <b style="color:${acc}">cover</b> dal ✏️</div>
      </div>`;
    }
    const pos = getPos(h, id), st = stateOf(h, id);
    const shutterH = pos == null ? 0 : (100 - pos);

    // pulsante glass riutilizzabile
    const btn = (act, ico, lbl, col) =>
      `<button data-cov="${act}" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
        padding:8px 4px;border-radius:11px;cursor:pointer;border:1px solid ${col}44;background:${col}1a;
        color:${col};font-weight:800;font-size:11px;transition:all .15s"
        onmouseover="this.style.background='${col}2e'" onmouseout="this.style.background='${col}1a'">
        <span style="font-size:15px;line-height:1">${ico}</span>${lbl}</button>`;

    return `<div style="height:100%;display:flex;flex-direction:column;min-height:0;gap:9px">

      <!-- FINESTRA + TAPPARELLA -->
      <div style="position:relative;flex:1;min-height:60px;border-radius:11px;overflow:hidden;
        background:linear-gradient(to bottom,#16314f 0%,#27567f 42%,#5b93c9 100%);
        border:3px solid #3a4252;box-shadow:inset 0 0 14px rgba(0,0,0,.45),inset 0 0 0 2px rgba(0,0,0,.25)">
        <!-- raggio di luce -->
        <div style="position:absolute;inset:0;background:radial-gradient(120% 60% at 70% 90%,rgba(255,255,255,.18),transparent 60%);pointer-events:none"></div>
        <!-- la tapparella scende dall'alto: altezza = 100 - posizione -->
        <div data-sh style="position:absolute;top:0;left:0;right:0;height:${shutterH}%;
          transition:height .6s cubic-bezier(.4,0,.2,1);
          background:repeating-linear-gradient(to bottom,#c4ccd8 0px,#b3bcc9 6px,#7e8796 7px,#b3bcc9 8px);
          border-bottom:4px solid #5b6472;
          box-shadow:0 7px 12px rgba(0,0,0,.5),inset 0 2px 0 rgba(255,255,255,.25)"></div>
      </div>

      <!-- PERCENTUALE + STATO -->
      <div style="display:flex;align-items:baseline;justify-content:space-between;padding:0 2px">
        <div><span data-pct style="font-size:24px;font-weight:800;color:${acc}">${pos == null ? '—' : pos + '%'}</span></div>
        <div data-st style="font-size:12px;font-weight:800;letter-spacing:.3px;color:${statusColor(st, pos)}">${statusLabel(st, pos)}</div>
      </div>

      <!-- PULSANTI -->
      <div style="display:flex;gap:6px">
        ${btn('open', '▲', 'Apri', '#4ade80')}
        ${btn('stop', '■', 'Ferma', '#fb923c')}
        ${btn('close', '▼', 'Chiudi', '#f87171')}
      </div>
    </div>`;
  }

  function update(card, hass, el) {
    try {
      // se la struttura non c'è (primo render o cambio entità non-cover) → ricostruisci
      if (!el.querySelector('[data-sh]')) { el.innerHTML = render(card); return; }
      const h = H(), id = ent(card);
      const pos = getPos(h, id), st = stateOf(h, id);
      const sh = el.querySelector('[data-sh]'); if (sh) sh.style.height = (pos == null ? 0 : (100 - pos)) + '%';
      const pe = el.querySelector('[data-pct]'); if (pe) pe.textContent = pos == null ? '—' : pos + '%';
      const se = el.querySelector('[data-st]'); if (se) { se.textContent = statusLabel(st, pos); se.style.color = statusColor(st, pos); }
    } catch (e) {}
  }

  function mount(card, hass, el) {
    if (el._covWired) return;
    el._covWired = true;
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-cov]'); if (!b) return;
      const id = ent(card); if (!id) return;
      const act = b.getAttribute('data-cov');
      const svc = act === 'open' ? 'open_cover' : act === 'close' ? 'close_cover' : 'stop_cover';
      try { window.callSvc('cover', svc, id); } catch (e2) {}
    });
  }

  const CARD = {
    id: 'tapparella',
    name: 'Tapparella',
    icon: '🪟',
    version: '1.0.0',
    desc: 'Tapparella animata sincronizzata con la cover — Apri/Ferma/Chiudi, % e stato.',
    render, update, mount
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
})();
