/* frarik-version: 1.5 */
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
      <div class="dwc-hdr"><div class="dwc-ico">🚪</div><div class="dwc-tit">Porte e Finestre</div><button class="dwc-cfg" data-a="cfg" title="Impostazioni">⚙️</button></div>
      <div class="dwc-status" style="--c:${col}">
        <div class="dwc-big">${allClosed ? '✅' : open.length}</div>
        <div class="dwc-lbl">${allClosed ? 'Tutto chiuso' : (open.length === 1 ? '1 aperta' : open.length + ' aperte') + ' · su ' + list.length}</div>
      </div>
      ${allClosed ? '' : `<div class="dwc-list">${rows}</div>`}
      ${list.length ? '' : '<div class="dwc-empty">Nessun sensore apertura rilevato. Tocca ⚙️ per configurare.</div>'}
    </div>`;
  }

  function css(rid) {
    return `
#${rid}.dwc-root{position:relative;width:100%;height:100%;min-height:120px;border-radius:18px;overflow:auto;padding:14px 16px;box-sizing:border-box;
  font-family:var(--primary-font-family,'Inter',system-ui,sans-serif);color:#fff;display:flex;flex-direction:column;gap:12px;
  background:linear-gradient(155deg,#060d14 0%,#080f18 55%,#060d14 100%);border:1px solid rgba(56,189,248,.15);box-shadow:0 10px 40px rgba(0,0,0,.45);}
#${rid} .dwc-hdr{display:flex;align-items:center;gap:9px;}
#${rid} .dwc-ico{font-size:18px;}
#${rid} .dwc-tit{flex:1;font-size:14px;font-weight:800;}
#${rid} .dwc-cfg{width:24px;height:24px;border-radius:7px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
#${rid} .dwc-status{display:flex;align-items:center;gap:12px;}
#${rid} .dwc-big{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;
  background:color-mix(in srgb,var(--c) 18%,transparent);border:1px solid var(--c);color:var(--c);flex-shrink:0;}
#${rid} .dwc-lbl{font-size:13px;font-weight:700;color:var(--c);}
#${rid} .dwc-list{display:flex;flex-direction:column;gap:6px;}
#${rid} .dwc-row{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:10px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.18);}
#${rid} .dwc-i{font-size:14px;}
#${rid} .dwc-n{flex:1;min-width:0;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#${rid} .dwc-t{font-size:10px;color:#fff;flex-shrink:0;}
#${rid} .dwc-empty{font-size:11px;color:#fff;text-align:center;padding:10px;}
`;
  }

  function mount(card, hass, el) {
    if (el._dwcHandler) el.removeEventListener('click', el._dwcHandler);
    el._dwcHandler = function (e) { if (e.target.closest('[data-a="cfg"]')) openCfg(card, el); };
    el.addEventListener('click', el._dwcHandler);
  }
  function update(card, hass, el) { try { el.innerHTML = render(card); } catch (e) {} }

  function openCfg(card, el) {
    const h = H(); const c = load(card);
    const auto = detect(h, {});
    const cur = (Array.isArray(c.entities) && c.entities.length) ? c.entities : auto;
    var _fll=JSON.parse(localStorage.getItem('_frk_layout_'+(card.id||''))||'{}');
    const cardScaleV=_fll.cardScale!=null?_fll.cardScale:(c.cardScale||100), cardWV=_fll.cardW!=null?_fll.cardW:(c.cardW||100);
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    const states = (h && h.states) || {};
    const allIds = Object.keys(states).sort();
    const stInp = 'width:100%;padding:10px 11px;border-radius:10px;background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none';
    const stDrop = 'position:absolute;left:0;right:0;top:100%;z-index:10;max-height:180px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 10px 10px;display:none;scrollbar-width:none';

    ov.innerHTML = `<style>@keyframes dwSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@media(max-width:600px){.frk-cfg-cols{flex-direction:column!important;overflow-y:auto!important;overflow-x:hidden!important}.frk-form-col{width:100%!important;border-right:none!important;border-bottom:1px solid rgba(255,255,255,.07)!important;overflow-y:visible!important;flex-shrink:0!important}.frk-prev-col{min-width:0!important;overflow-y:visible!important}}</style>
    <div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(139,92,246,.32);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:dwSlideUp .22s cubic-bezier(.32,1.12,.56,1)">
      <div style="display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">
        <div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);color:#fbbf24;flex-shrink:0">🚪</div>
        <div><div style="font-size:14px;font-weight:800">Porte e Finestre</div><div style="font-size:11px;color:#fff;margin-top:1px">${auto.length} sensori rilevati automaticamente</div></div>
        <button id="dw-hdr-close" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>
      </div>
      <div class="frk-cfg-cols" style="display:flex;flex:1;overflow:hidden;min-height:0">
        <div class="frk-form-col" style="width:380px;flex-shrink:0;overflow-y:auto;padding:14px 16px;border-right:1px solid rgba(255,255,255,.07);scrollbar-width:none;display:flex;flex-direction:column;gap:10px">
          <div style="font-size:11px;color:#fff;line-height:1.5">Aggiungi sensori dalla lista o digitali. Lascia <b style="color:#fff">vuoto</b> per rilevamento automatico.</div>
          <div style="position:relative">
            <input id="dw-pick" type="text" autocomplete="off" placeholder="Cerca e aggiungi un'entità…" style="${stInp}">
            <div id="dw-pick-d" style="${stDrop}"></div>
          </div>
          <textarea id="dw-ents" style="width:100%;height:160px;border-radius:10px;background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.15);font-size:12px;font-family:monospace;padding:10px;resize:vertical;box-sizing:border-box">${cur.join('\n')}</textarea>
          <div style="display:flex;gap:8px;margin-top:4px">
            <button id="dw-auto" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(56,189,248,.18);color:#38bdf8">↻ Auto</button>
            <button id="dw-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:700;background:rgba(255,255,255,.1);color:#fff">Annulla</button>
            <button id="dw-save" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;font-weight:800;background:#fbbf24;color:#0a0816">Salva</button>
          </div>
        </div>
        <div class="frk-prev-col" style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:10px;padding:14px 16px;overflow-y:auto;background:rgba(0,0,0,.15);scrollbar-width:none">
          <div style="font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.07em">Anteprima live</div>
          <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.08)"><div id="dw-prev-inner"></div></div>
          <div style="padding-top:12px;border-top:1px solid rgba(255,255,255,.08)">
            <div style="font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Dimensioni card</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
              <span style="font-size:11px;font-weight:700;color:#fff;width:72px;flex-shrink:0">Altezza</span>
              <input type="range" id="dw-cardscale" min="20" max="100" step="5" value="${cardScaleV}" style="flex:1;cursor:pointer;accent-color:#fbbf24;height:4px">
              <span id="dw-cardscale-lbl" style="font-size:12px;font-weight:800;color:#fbbf24;width:64px;text-align:right;flex-shrink:0">${cardScaleV>=100?'Auto (100%)':cardScaleV+'%'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
              <span style="font-size:11px;font-weight:700;color:#fff;width:72px;flex-shrink:0">Larghezza</span>
              <input type="range" id="dw-cardw" min="20" max="100" step="5" value="${cardWV}" style="flex:1;cursor:pointer;accent-color:#fbbf24;height:4px">
              <span id="dw-cardw-lbl" style="font-size:12px;font-weight:800;color:#fbbf24;width:64px;text-align:right;flex-shrink:0">${cardWV>=100?'Auto (100%)':cardWV+'%'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    document.body.appendChild(ov);
    const close = () => { try { document.body.removeChild(ov); } catch (e) {} document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('#dw-cancel').addEventListener('click', close);
    ov.querySelector('#dw-hdr-close').addEventListener('click', close);
    ov.querySelector('#dw-auto').addEventListener('click', () => { ov.querySelector('#dw-ents').value = ''; schedPrev(); });

    var _prevTimer = null;
    function updatePrev() {
      const prevEl = ov.querySelector('#dw-prev-inner'); if (!prevEl) return;
      const scV = parseInt((ov.querySelector('#dw-cardscale')||{}).value)||100;
      const wV  = parseInt((ov.querySelector('#dw-cardw')||{}).value)||100;
      try {
        const ids = ov.querySelector('#dw-ents').value.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
        localStorage.setItem('frarik_doorscard___prev__', JSON.stringify({entities:ids,cardScale:100,cardW:100}));
        prevEl.innerHTML = render({id:'__prev__'});
        prevEl.style.zoom = scV<100?scV+'%':''; prevEl.style.width = wV<100?wV+'%':'';
      } catch(e) {}
    }
    function schedPrev() { clearTimeout(_prevTimer); _prevTimer = setTimeout(updatePrev, 180); }

    ov.querySelector('#dw-cardscale').addEventListener('input', function(){ ov.querySelector('#dw-cardscale-lbl').textContent=this.value>=100?'Auto (100%)':this.value+'%'; schedPrev(); });
    ov.querySelector('#dw-cardw').addEventListener('input', function(){ ov.querySelector('#dw-cardw-lbl').textContent=this.value>=100?'Auto (100%)':this.value+'%'; schedPrev(); });
    ov.querySelector('#dw-ents').addEventListener('input', schedPrev);

    const pickInp = ov.querySelector('#dw-pick'), pickDrop = ov.querySelector('#dw-pick-d');
    function showPickDrop() {
      const q = pickInp.value.toLowerCase().trim();
      const hits = (q ? allIds.filter(id => id.toLowerCase().includes(q) || ((states[id]?.attributes?.friendly_name||'').toLowerCase().includes(q))) : allIds).slice(0, 50);
      if (!hits.length) { pickDrop.style.display = 'none'; return; }
      pickDrop.style.display = 'block';
      pickDrop.innerHTML = hits.map(id => {
        const fn = states[id]?.attributes?.friendly_name || '';
        return `<div data-pick="${id}" style="padding:6px 11px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#fff">${id}</span>${fn?`<span style="color:#fff;margin-left:7px;font-family:system-ui;font-size:10px">${fn}</span>`:''}</div>`;
      }).join('');
      pickDrop.querySelectorAll('[data-pick]').forEach(row => {
        row.addEventListener('mousedown', ev => {
          ev.preventDefault();
          const ta = ov.querySelector('#dw-ents'), v = ta.value.trim(), id = row.getAttribute('data-pick');
          ta.value = v ? v+'\n'+id : id;
          pickInp.value = ''; pickDrop.style.display = 'none'; schedPrev();
        });
        row.addEventListener('mouseover', () => { row.style.background = 'rgba(255,255,255,.08)'; });
        row.addEventListener('mouseout',  () => { row.style.background = ''; });
      });
    }
    pickInp.addEventListener('focus', showPickDrop); pickInp.addEventListener('input', showPickDrop);
    pickInp.addEventListener('blur', () => setTimeout(() => { pickDrop.style.display='none'; }, 200));

    ov.querySelector('#dw-save').addEventListener('click', () => {
      const ids = ov.querySelector('#dw-ents').value.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
      const scV = parseInt(ov.querySelector('#dw-cardscale').value)||100;
      const wV  = parseInt(ov.querySelector('#dw-cardw').value)||100;
      save(card, { entities:ids, cardScale:scV, cardW:wV });
      const detail = {cardId:card.id};
      if (scV!==cardScaleV) detail.cardScale=scV; if (wV!==cardWV) detail.cardW=wV;
      if (detail.cardScale!=null||detail.cardW!=null) el.dispatchEvent(new CustomEvent('frarik-card-layout',{bubbles:true,composed:true,detail}));
      close(); try { el.innerHTML = render(card); } catch (e) {}
    });
    updatePrev();
  }

  const CARD = {
    id: 'doors-windows', name: 'Porte e Finestre', icon: '🚪', version: '1.1',
    desc: 'Sensori apertura (porte/finestre/garage) auto-rilevati: quanti aperti, da quanto, "tutto chiuso".',
    render, mount, update, configure: openCfg
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata: doors-windows v' + CARD.version); } catch (e) {}
})();
