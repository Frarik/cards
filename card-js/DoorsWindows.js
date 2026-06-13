/* frarik-version: 1.1 */
/**
 * DoorsWindows.js — FratechStore card "Porte e Finestre"
 * Rileva automaticamente i sensori apertura (device_class door/window/garage_door/opening),
 * mostra quanti sono aperti, l'elenco con da quanto tempo, e "tutto chiuso" quando ok.
 * ⚙: lista manuale di sensori (vuota = auto-rilevamento).
 */
(function () {
  'use strict';

  function H() { try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {} return null; }
  function keyOf(card) { return 'frarik_doorscard_' + (card.id || 'x'); }
  function load(card) { try { return JSON.parse(localStorage.getItem(keyOf(card)) || '{}') || {}; } catch (e) { return {}; } }
  function save(card, o) { try { localStorage.setItem(keyOf(card), JSON.stringify(o)); } catch (e) {} }
  function nameOf(h, id) { const s = h && h.states && h.states[id]; return (s && s.attributes && s.attributes.friendly_name) || id; }

  const DC = ['door', 'window', 'garage_door', 'opening'];
  function detect(h, card) {
    const c = load(card);
    if (Array.isArray(c.entities) && c.entities.length) return c.entities.filter(id => h && h.states && h.states[id]);
    const out = [];
    const st = (h && h.states) || {};
    for (const id in st) {
      if (id.indexOf('binary_sensor.') !== 0) continue;
      const dc = st[id].attributes && st[id].attributes.device_class;
      if (DC.indexOf(dc) >= 0) out.push(id);
    }
    return out.sort();
  }
  function icoFor(h, id) {
    const dc = h && h.states && h.states[id] && h.states[id].attributes && h.states[id].attributes.device_class;
    return dc === 'window' ? '🪟' : dc === 'garage_door' ? '🚪' : '🚪';
  }
  function elapsed(h, id) {
    const s = h && h.states && h.states[id]; if (!s) return '';
    const lc = s.last_changed || s.last_updated; if (!lc) return '';
    let sec = Math.floor((Date.now() - new Date(lc).getTime()) / 1000); if (isNaN(sec) || sec < 0) return '';
    if (sec < 60) return sec + 's';
    const m = Math.floor(sec / 60); if (m < 60) return m + ' min';
    const hh = Math.floor(m / 60); if (hh < 24) return hh + 'h';
    return Math.floor(hh / 24) + 'g';
  }

  function render(card) {
    const h = H(); const rid = 'dwc' + (card.id || Math.random().toString(36).slice(2));
    const list = detect(h, card);
    const open = list.filter(id => h && h.states && h.states[id] && h.states[id].state === 'on');
    const allClosed = open.length === 0;
    const col = allClosed ? '#22c55e' : (open.length >= 3 ? '#ef4444' : '#f59e0b');
    const rows = open.map(id => `<div class="dwc-row">
        <span class="dwc-i">${icoFor(h, id)}</span>
        <span class="dwc-n">${nameOf(h, id)}</span>
        <span class="dwc-t">${elapsed(h, id)}</span>
      </div>`).join('');
    return `<style>${css(rid)}</style><div id="${rid}" class="dwc-root">
      <div class="dwc-hdr"><div class="dwc-ico">🚪</div><div class="dwc-tit">Porte e Finestre</div></div>
      <div class="dwc-status" style="--c:${col}">
        <div class="dwc-big">${allClosed ? '✅' : open.length}</div>
        <div class="dwc-lbl">${allClosed ? 'Tutto chiuso' : (open.length === 1 ? '1 aperta' : open.length + ' aperte') + ' · su ' + list.length}</div>
      </div>
      ${allClosed ? '' : `<div class="dwc-list">${rows}</div>`}
      ${list.length ? '' : '<div class="dwc-empty">Nessun sensore apertura rilevato. Attiva modifica → ✏️ per configurare.</div>'}
    </div>`;
  }

  function css(rid) {
    return `
#${rid}.dwc-root{position:relative;width:100%;height:100%;min-height:120px;border-radius:18px;overflow:auto;padding:14px 16px;box-sizing:border-box;
  font-family:var(--primary-font-family,'Inter',system-ui,sans-serif);color:#e8ebf5;display:flex;flex-direction:column;gap:12px;
  background:linear-gradient(150deg,#0c1322 0%,#0a0f1c 60%,#0c1626 100%);border:1px solid rgba(99,102,241,.22);box-shadow:0 10px 40px rgba(0,0,0,.45);}
#${rid} .dwc-hdr{display:flex;align-items:center;gap:9px;}
#${rid} .dwc-ico{font-size:18px;}
#${rid} .dwc-tit{flex:1;font-size:14px;font-weight:800;}
#${rid} .dwc-status{display:flex;align-items:center;gap:12px;}
#${rid} .dwc-big{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;
  background:color-mix(in srgb,var(--c) 18%,transparent);border:1px solid var(--c);color:var(--c);flex-shrink:0;}
#${rid} .dwc-lbl{font-size:13px;font-weight:700;color:var(--c);}
#${rid} .dwc-list{display:flex;flex-direction:column;gap:6px;}
#${rid} .dwc-row{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:10px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.18);}
#${rid} .dwc-i{font-size:14px;}
#${rid} .dwc-n{flex:1;min-width:0;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#${rid} .dwc-t{font-size:10px;color:rgba(255,255,255,.5);flex-shrink:0;}
#${rid} .dwc-empty{font-size:11px;color:rgba(255,255,255,.4);text-align:center;padding:10px;}
`;
  }

  function mount(card, hass, el) {}
  function update(card, hass, el) { try { el.innerHTML = render(card); } catch (e) {} }

  function openCfg(card, el) {
    const h = H(); const c = load(card);
    const auto = detect(h, {}); // lista auto-rilevata (ignorando config)
    const cur = (Array.isArray(c.entities) && c.entities.length) ? c.entities : auto;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,16,.74);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    const states = (h && h.states) || {};
    const allIds = Object.keys(states).sort();
    const stInp = 'width:100%;padding:10px 11px;border-radius:11px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:10;max-height:180px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 11px 11px;display:none';
    ov.innerHTML = `<div style="width:min(460px,94vw);max-height:90vh;overflow:auto;background:#0b1220;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:20px;color:#f1f5f9">
        <div style="font-size:16px;font-weight:800;margin-bottom:6px">🚪 Porte e Finestre</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:10px">Aggiungi sensori dalla lista oppure digitali direttamente. Lascia <b>vuoto</b> per rilevamento automatico (${auto.length} trovati).</div>
        <div style="position:relative;margin-bottom:8px">
          <input id="dw-pick" type="text" autocomplete="off" placeholder="Cerca e aggiungi un'entità…" style="${stInp}">
          <div id="dw-pick-d" style="${stDrop}"></div>
        </div>
        <textarea id="dw-ents" style="width:100%;height:150px;border-radius:10px;background:#0f1830;color:#f1f5f9;border:1px solid rgba(255,255,255,.2);font-size:12px;font-family:monospace;padding:10px;resize:vertical;box-sizing:border-box">${cur.join('\n')}</textarea>
        <div style="display:flex;gap:10px;margin-top:12px">
          <button id="dw-auto" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(99,102,241,.18);color:#a5b4fc">↻ Auto</button>
          <button id="dw-cancel" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#e2e8f0">Annulla</button>
          <button id="dw-save" style="flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;background:#22c55e;color:#04210f">Salva</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} };
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('#dw-cancel').addEventListener('click', close);
    ov.querySelector('#dw-auto').addEventListener('click', () => { ov.querySelector('#dw-ents').value = ''; });

    // Combobox picker → aggiunge alla textarea
    const pickInp = ov.querySelector('#dw-pick');
    const pickDrop = ov.querySelector('#dw-pick-d');
    function showPickDrop() {
      const q = pickInp.value.toLowerCase().trim();
      const hits = (q
        ? allIds.filter(id => id.toLowerCase().includes(q) || ((states[id]?.attributes?.friendly_name||'').toLowerCase().includes(q)))
        : allIds
      ).slice(0, 50);
      if (!hits.length) { pickDrop.style.display = 'none'; return; }
      pickDrop.style.display = 'block';
      pickDrop.innerHTML = hits.map(id => {
        const fn = states[id]?.attributes?.friendly_name || '';
        return `<div data-pick="${id}" style="padding:6px 11px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)">
          <span style="color:#e2e8f0">${id}</span>${fn ? `<span style="color:#475569;margin-left:7px;font-family:system-ui;font-size:10px">${fn}</span>` : ''}
        </div>`;
      }).join('');
      pickDrop.querySelectorAll('[data-pick]').forEach(row => {
        row.addEventListener('mousedown', ev => {
          ev.preventDefault();
          const ta = ov.querySelector('#dw-ents');
          const v = ta.value.trim();
          const id = row.getAttribute('data-pick');
          ta.value = v ? v + '\n' + id : id;
          pickInp.value = ''; pickDrop.style.display = 'none';
        });
        row.addEventListener('mouseover', () => { row.style.background = 'rgba(255,255,255,.08)'; });
        row.addEventListener('mouseout',  () => { row.style.background = ''; });
      });
    }
    pickInp.addEventListener('focus', showPickDrop);
    pickInp.addEventListener('input', showPickDrop);
    pickInp.addEventListener('blur',  () => setTimeout(() => { pickDrop.style.display = 'none'; }, 200));
    ov.querySelector('#dw-save').addEventListener('click', () => {
      const ids = ov.querySelector('#dw-ents').value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      save(card, { entities: ids });   // vuoto = auto (detect ignora array vuoto)
      close();
      try { el.innerHTML = render(card); } catch (e) {}
    });
  }

  const CARD = {
    id: 'doors-windows', name: 'Porte e Finestre', icon: '🚪', version: '1.1',
    desc: 'Sensori apertura (porte/finestre/garage) auto-rilevati: quanti aperti, da quanto, "tutto chiuso".',
    render, mount, update
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: doors-windows v' + CARD.version); } catch (e) {}
})();
