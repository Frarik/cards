/* frarik-version: 1.0 */
/**
 * GruppoLuci.js — Distintivo FratechStore
 * Chip nel header che mostra quante luci (o altri device) sono accese.
 * Clic → popup con lista entity + toggle on/off + (opzionale) toggle automazione.
 * ⚙ Configura: elenco entità, etichetta, colore, automazioni collegate.
 */
(function () {
  'use strict';

  const ID = 'gruppo-luci';
  const ON_STATES = ['on','open','unlocked','playing','heating','cooling','active','home','present','detected','wet','running','charging'];

  function H() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    return null;
  }
  function cfgKey() { return 'frarik_jsd_' + ID; }
  function loadCfg(cfg) { return cfg && typeof cfg === 'object' ? cfg : {}; }
  function nameOf(h, id) {
    const s = h && h.states && h.states[id];
    return (s && s.attributes && s.attributes.friendly_name) || id;
  }
  function isOn(h, id) {
    const st = (h && h.states && h.states[id] && h.states[id].state) || 'unknown';
    return ON_STATES.includes(st.toLowerCase());
  }
  function callSvc(domain, svc, entityId) {
    if (typeof window.callSvc === 'function') { window.callSvc(domain, svc, entityId); return; }
    const h = H(); if (h && h.callService) h.callService(domain, svc, { entity_id: entityId });
  }
  function eh(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function hex2rgba(h, a) {
    h = h.replace('#',''); if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ── chip: ritorna {icon, label, value, color} per il framework ── */
  function chip(cfg, hass) {
    const c = loadCfg(cfg);
    const h = hass && hass.states ? { states: hass.states } : H();
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const active = ents.filter(e => isOn(h, e.entity)).length;
    const col = c.color || '#fbbf24';
    return {
      icon: c.icon || '💡',
      label: c.label || 'Luci',
      value: `${active}/${ents.length}`,
      color: active > 0 ? col : 'rgba(255,255,255,0.32)',
    };
  }

  /* ── watchEntities: lista entity da monitorare per aggiornamento live ── */
  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const ids = ents.map(e => e.entity).filter(Boolean);
    ents.forEach(e => { if (e.automation) ids.push(e.automation); });
    return ids;
  }

  /* ── render: corpo del popup (chiamato da _openJsdPopup) ── */
  function render(cfg, hass) {
    const c = loadCfg(cfg);
    const h = hass && hass.states ? { states: hass.states } : H();
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const col = c.color || '#fbbf24';
    const active = ents.filter(e => isOn(h, e.entity)).length;

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const on = isOn(h, e.entity);
      const lbl = e.label || nameOf(h, e.entity);
      const stTxt = h && h.states && h.states[e.entity] ? h.states[e.entity].state : '—';
      const dotCol = on ? col : 'rgba(255,255,255,0.18)';
      const dotShadow = on ? `0 0 7px ${col}` : 'none';
      const swBg = on ? col : 'rgba(255,255,255,0.15)';
      const thumbL = on ? '23px' : '3px';

      let autoRow = '';
      if (e.automation) {
        const autoOn = isOn(h, e.automation);
        const autoLbl = nameOf(h, e.automation);
        autoRow = `<div style="display:flex;align-items:center;gap:6px;padding:4px 14px 8px 36px">
          <span style="opacity:.38;font-size:12px">🤖</span>
          <span style="flex:1;font-size:10px;color:rgba(255,255,255,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(autoLbl)}</span>
          <button class="glbtn-auto${autoOn?' on':''}" data-jsd-auto="${i}" style="padding:3px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:${autoOn?hex2rgba(col,.15):'rgba(255,255,255,.06)'};color:${autoOn?col:'#94a3b8'};cursor:pointer;font-size:10px;font-weight:700">${autoOn ? 'Disattiva' : 'Attiva'}</button>
        </div>`;
      }

      return `<div style="margin-bottom:6px">
        <div class="glrow" data-jsd-row="${i}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.04);cursor:pointer;transition:background .15s">
          <div style="width:10px;height:10px;border-radius:50%;flex-shrink:0;background:${dotCol};box-shadow:${dotShadow};transition:background .3s,box-shadow .3s"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            <div style="font-size:10px;opacity:.42;margin-top:1px">${eh(stTxt)}</div>
          </div>
          <button class="glsw ${on?'on':'off'}" data-jsd-toggle="${i}" style="width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;background:${swBg};transition:background .2s;flex-shrink:0;outline:none">
            <div style="position:absolute;top:3px;left:${thumbL};width:18px;height:18px;border-radius:50%;background:#fff;transition:left .18s;pointer-events:none"></div>
          </button>
        </div>${autoRow}
      </div>`;
    }).join('');

    return `<div id="gl-body" data-col="${eh(col)}">
      <div style="padding:8px 2px 10px;font-size:11px;color:rgba(255,255,255,.4);text-align:center">${active} / ${ents.length} attiv${active===1?'o':'i'}</div>
      ${rows || '<div style="padding:24px;text-align:center;color:rgba(255,255,255,.3)">Nessuna entità configurata.<br>Clicca ✏️ sulla chip per configurare.</div>'}
    </div>`;
  }

  /* ── mount: collega i click sui toggle dopo render ── */
  function mount(cfg, hass, el) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    el.addEventListener('click', ev => {
      const tog = ev.target.closest('[data-jsd-toggle]');
      if (tog) {
        const i = parseInt(tog.dataset.jsdToggle);
        const e = ents[i]; if (!e) return;
        const h = H();
        const on = isOn(h, e.entity);
        callSvc(e.entity.split('.')[0], on ? 'turn_off' : 'turn_on', e.entity);
        setTimeout(() => { try { update(cfg, { states: (H()||{states:{}}).states }, el); } catch(_) {} }, 700);
        ev.stopPropagation();
        return;
      }
      const auto = ev.target.closest('[data-jsd-auto]');
      if (auto) {
        const i = parseInt(auto.dataset.jsdAuto);
        const e = ents[i]; if (!e || !e.automation) return;
        const h = H();
        const on = isOn(h, e.automation);
        callSvc('automation', on ? 'turn_off' : 'turn_on', e.automation);
        setTimeout(() => { try { update(cfg, { states: (H()||{states:{}}).states }, el); } catch(_) {} }, 700);
        ev.stopPropagation();
      }
    });
  }

  /* ── update: aggiorna il corpo del popup live ── */
  function update(cfg, hass, el) {
    try { el.innerHTML = render(cfg, hass); mount(cfg, hass, el); } catch (e) {}
  }

  /* ── configure: editor configurazione dedicato ── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? JSON.parse(JSON.stringify(c.entities)) : [];
    const h = H();
    const col = c.color || '#fbbf24';

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);font-family:system-ui,sans-serif';
    const sty = document.createElement('style');
    sty.textContent = '@keyframes glSlUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .glcfg-inp{width:100%;padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:12px;box-sizing:border-box;outline:none;font-family:inherit} .glcfg-inp::placeholder{color:rgba(255,255,255,.3)} .glcfg-row{display:flex;flex-direction:column;gap:5px;background:rgba(255,255,255,.04);border-radius:10px;padding:10px;position:relative} .glcfg-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.38);margin-bottom:2px}';
    ov.appendChild(sty);

    function renderForm() {
      const rows = ents.map((e, i) => `
        <div class="glcfg-row" id="glrow-${i}">
          <button style="position:absolute;top:6px;right:6px;width:22px;height:22px;border:none;border-radius:6px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center" data-del="${i}">✕</button>
          <div class="glcfg-lbl">Entità *</div>
          <div style="display:flex;gap:5px"><input class="glcfg-inp" placeholder="light.xxx" value="${eh(e.entity||'')}" data-field="${i}-entity" style="flex:1"><button style="padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font-size:11px" data-browse="${i}-entity">🔍</button></div>
          <div class="glcfg-lbl">Etichetta</div>
          <input class="glcfg-inp" placeholder="Es. Soggiorno (opzionale)" value="${eh(e.label||'')}" data-field="${i}-label">
          <div class="glcfg-lbl">Automazione 🤖 (opzionale)</div>
          <div style="display:flex;gap:5px"><input class="glcfg-inp" placeholder="automation.xxx" value="${eh(e.automation||'')}" data-field="${i}-automation" style="flex:1"><button style="padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font-size:11px" data-browse="${i}-automation">🔍</button></div>
        </div>`).join('');

      return `<div style="width:100%;max-height:90vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(139,92,246,.3);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;animation:glSlUp .22s cubic-bezier(.32,1.12,.56,1)">
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);flex-shrink:0">💡</div>
          <div><div style="font-size:14px;font-weight:800">Configura — Gruppo Luci</div><div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:1px">Aggiungi entità e automazioni</div></div>
          <button id="gl-hdr-close" style="margin-left:auto;width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:15px">✕</button>
        </div>
        <div style="flex:1;overflow-y:auto;scrollbar-width:none;padding:14px 14px 4px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;gap:8px;margin-bottom:4px">
            <div style="flex:1"><div class="glcfg-lbl">Etichetta chip</div><input class="glcfg-inp" id="gl-label" placeholder="Es. Luci" value="${eh(c.label||'Luci')}"></div>
            <div style="flex:0 0 70px"><div class="glcfg-lbl">Icona</div><input class="glcfg-inp" id="gl-icon" placeholder="💡" value="${eh(c.icon||'💡')}" style="text-align:center;font-size:14px"></div>
            <div style="flex:0 0 50px"><div class="glcfg-lbl">Colore</div><input type="color" id="gl-color" value="${col.startsWith('#')?col:'#fbbf24'}" style="width:100%;height:36px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:none;cursor:pointer;padding:2px"></div>
          </div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.38)">Entità del gruppo</div>
          <div id="gl-rows" style="display:flex;flex-direction:column;gap:8px">${rows}</div>
          <button id="gl-add" style="padding:9px;border-radius:10px;border:1px dashed rgba(255,255,255,.2);background:rgba(255,255,255,.04);color:rgba(255,255,255,.55);cursor:pointer;font-size:12px;font-weight:700;margin-top:2px">➕ Aggiungi entità</button>
        </div>
        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);flex-shrink:0">
          <button id="gl-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#fbbf24;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="gl-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      ov.innerHTML = ''; ov.appendChild(sty); ov.innerHTML += renderForm();

      ov.querySelector('#gl-hdr-close').addEventListener('click', close);
      ov.querySelector('#gl-cancel').addEventListener('click', close);

      ov.querySelector('#gl-add').addEventListener('click', () => {
        ents.push({ entity: '', label: '', automation: '' });
        attach();
      });

      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => { ents.splice(parseInt(btn.dataset.del), 1); attach(); });
      });

      ov.querySelectorAll('[data-field]').forEach(inp => {
        const [i, field] = inp.dataset.field.split('-');
        if (!ents[i]) return;
        inp.addEventListener('input', () => { ents[parseInt(i)][field] = inp.value.trim(); });
      });

      ov.querySelectorAll('[data-browse]').forEach(btn => {
        btn.addEventListener('click', () => {
          const [i, field] = btn.dataset.browse.split('-');
          const fid = `glcfginp-${i}-${field}`;
          const inp = ov.querySelector(`[data-field="${i}-${field}"]`);
          if (inp) { inp.id = fid; if (typeof window.browseField === 'function') window.browseField(fid); }
        });
      });

      ov.querySelector('#gl-save').addEventListener('click', () => {
        const newCfg = {
          label: ov.querySelector('#gl-label').value.trim() || 'Luci',
          icon: ov.querySelector('#gl-icon').value.trim() || '💡',
          color: ov.querySelector('#gl-color').value || '#fbbf24',
          entities: ents.filter(e => e.entity.trim()).map(e => ({
            entity: e.entity.trim(),
            label: e.label || '',
            automation: e.automation || '',
          })),
        };
        close();
        if (typeof onSave === 'function') onSave(newCfg);
      });

      ov.addEventListener('click', ev => { if (ev.target === ov) close(); });
    }

    function close() { try { document.body.removeChild(ov); } catch (e) {} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key === 'Escape') close(); }
    document.addEventListener('keydown', escFn);

    attach();
    document.body.appendChild(ov);
  }

  const CARD = {
    id: ID,
    name: 'Gruppo Luci',
    icon: '💡',
    desc: 'Chip con contatore luci accese. Clic → lista con toggle on/off e automazioni.',
    version: '1.0',
    isDistintivo: true,
    defaultCfg: { label: 'Luci', icon: '💡', color: '#fbbf24', entities: [] },
    chip,
    watchEntities,
    render,
    mount,
    update,
    configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-luci v1.0'); } catch (e) {}
})();
