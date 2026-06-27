/* frarik-version: 1.1 */
/**
 * GruppoLuci.js — Distintivo FratechStore v1.1
 * Chip header con contatore luci accese.
 * Clic → pannello stile HA: toggle per ogni luce + Accendi/Spegni tutte
 * ⚙ Configura: picker inline luci (light.*) + automazione opzionale per luce
 */
(function () {
  'use strict';

  const ID = 'gruppo-luci';
  const ON_STATES = ['on','open','unlocked','playing','heating','cooling','active','home','present','detected','wet','running','charging'];

  function H() {
    try { if (typeof window.frarikHass === 'function') { const h = window.frarikHass(); if (h && h.states) return h; } } catch (e) {}
    return null;
  }
  function loadCfg(cfg) { return cfg && typeof cfg === 'object' ? cfg : {}; }
  function nameOf(h, id) {
    const s = h && h.states && h.states[id];
    return (s && s.attributes && s.attributes.friendly_name) || (id.includes('.') ? id.split('.')[1].replace(/_/g, ' ') : id);
  }
  function stateOf(h, id) {
    return (h && h.states && h.states[id] && h.states[id].state) || 'unknown';
  }
  function isOn(h, id) {
    return ON_STATES.includes(stateOf(h, id).toLowerCase());
  }
  function callSvc(domain, svc, entityId) {
    if (typeof window.callSvc === 'function') { window.callSvc(domain, svc, entityId); return; }
    const h = H(); if (h && h.callService) h.callService(domain, svc, { entity_id: entityId });
  }
  function eh(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function hex2rgba(hex, a) {
    let h = (hex || '').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return `rgba(255,255,255,${a})`;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }
  function hass(arg) { return arg && arg.states ? arg : H(); }

  /* ── chip ── */
  function chip(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = hass(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const active = ents.filter(e => isOn(h, e.entity)).length;
    const col = c.color || '#fbbf24';
    let value;
    if (c.sensorEntity && h && h.states && h.states[c.sensorEntity]) {
      const st = h.states[c.sensorEntity];
      value = st.state + (st.attributes && st.attributes.unit_of_measurement ? ' ' + st.attributes.unit_of_measurement : '');
    } else {
      value = ents.length ? `${active}/${ents.length}` : '—';
    }
    return {
      icon: c.icon || '💡',
      label: c.label || 'Luci',
      value,
      color: active > 0 ? col : 'rgba(255,255,255,0.32)',
    };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const ids = ents.map(e => e.entity).filter(Boolean);
    ents.forEach(e => { if (e.automation) ids.push(e.automation); });
    if (c.sensorEntity) ids.push(c.sensorEntity);
    return ids;
  }

  /* ── render popup (stile HA) ── */
  function render(cfg, rawHass) {
    const c = loadCfg(cfg);
    const h = hass(rawHass);
    const ents = Array.isArray(c.entities) ? c.entities : [];
    const col = c.color || '#fbbf24';
    const active = ents.filter(e => isOn(h, e.entity)).length;

    const ctrlBar = ents.length ? `
      <div style="display:flex;gap:8px;padding:10px 14px 6px;flex-shrink:0">
        <button data-gl-all="on" style="flex:1;padding:7px;border-radius:8px;border:1px solid ${hex2rgba(col,.4)};background:${hex2rgba(col,.12)};color:${col};font-size:11px;font-weight:700;cursor:pointer;transition:all .18s">☀ Accendi tutte</button>
        <button data-gl-all="off" style="flex:1;padding:7px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:rgba(255,255,255,.6);font-size:11px;font-weight:700;cursor:pointer;transition:all .18s">⏻ Spegni tutte</button>
      </div>
      <div style="padding:2px 14px 8px;font-size:10px;color:rgba(255,255,255,.35)">${active} / ${ents.length} accese</div>
    ` : '';

    const rows = ents.map((e, i) => {
      if (!e.entity) return '';
      const on = isOn(h, e.entity);
      const lbl = e.label || nameOf(h, e.entity);
      const stLbl = on ? 'Accesa' : 'Spenta';
      const swBg = on ? col : 'rgba(255,255,255,0.14)';
      const thumbL = on ? '22px' : '2px';

      let autoRow = '';
      if (e.automation) {
        const autoOn = isOn(h, e.automation);
        const autoLbl = nameOf(h, e.automation);
        autoRow = `<div style="display:flex;align-items:center;gap:8px;padding:4px 16px 10px 60px">
          <span style="font-size:10px;opacity:.4">🤖</span>
          <span style="flex:1;font-size:10px;color:rgba(255,255,255,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(autoLbl)}</span>
          <button data-jsd-auto="${i}" style="padding:3px 10px;border-radius:6px;border:1px solid ${autoOn?hex2rgba(col,.4):'rgba(255,255,255,.15)'};background:${autoOn?hex2rgba(col,.15):'transparent'};color:${autoOn?col:'#64748b'};cursor:pointer;font-size:10px;font-weight:600">${autoOn?'Disattiva':'Attiva'}</button>
        </div>`;
      }

      return `<div style="border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="display:flex;align-items:center;gap:12px;padding:11px 16px;cursor:pointer" data-jsd-row="${i}">
          <div style="width:36px;height:36px;border-radius:50%;background:${on?hex2rgba(col,.15):'rgba(255,255,255,.05)'};border:1px solid ${on?hex2rgba(col,.3):'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;filter:${on?'none':'grayscale(1) opacity(.4)'}">💡</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:${on?'#fff':'rgba(255,255,255,.6)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
            <div style="font-size:11px;color:${on?col:'rgba(255,255,255,.3)'};margin-top:1px;font-weight:${on?600:400}">${stLbl}</div>
          </div>
          <button data-jsd-toggle="${i}" style="width:46px;height:26px;border-radius:13px;border:none;cursor:pointer;position:relative;background:${swBg};transition:background .2s;flex-shrink:0;outline:none">
            <div style="position:absolute;top:3px;left:${thumbL};width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:left .18s;pointer-events:none"></div>
          </button>
        </div>${autoRow}
      </div>`;
    }).join('');

    return `<div id="gl-popup-body" data-col="${eh(col)}">
      ${ctrlBar}
      <div id="gl-rows">
        ${rows || '<div style="padding:32px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px">Nessuna luce configurata.<br><span style="font-size:10px;opacity:.6">Clicca ✏️ sulla chip per configurare.</span></div>'}
      </div>
    </div>`;
  }

  function mount(cfg, rawHass, el) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? c.entities : [];

    el.addEventListener('click', ev => {
      // toggle singola luce
      const tog = ev.target.closest('[data-jsd-toggle]');
      if (tog) {
        const i = parseInt(tog.dataset.jsdToggle);
        const e = ents[i]; if (!e) return;
        const h = H();
        const on = isOn(h, e.entity);
        callSvc(e.entity.split('.')[0], on ? 'turn_off' : 'turn_on', e.entity);
        setTimeout(() => { try { update(cfg, null, el); } catch(_){} }, 600);
        ev.stopPropagation(); return;
      }
      // toggle automazione
      const auto = ev.target.closest('[data-jsd-auto]');
      if (auto) {
        const i = parseInt(auto.dataset.jsdAuto);
        const e = ents[i]; if (!e || !e.automation) return;
        const h = H();
        const on = isOn(h, e.automation);
        callSvc('automation', on ? 'turn_off' : 'turn_on', e.automation);
        setTimeout(() => { try { update(cfg, null, el); } catch(_){} }, 600);
        ev.stopPropagation(); return;
      }
      // accendi/spegni tutte
      const allBtn = ev.target.closest('[data-gl-all]');
      if (allBtn) {
        const svc = allBtn.dataset.glAll === 'on' ? 'turn_on' : 'turn_off';
        ents.forEach(e => { if (e.entity) callSvc(e.entity.split('.')[0], svc, e.entity); });
        setTimeout(() => { try { update(cfg, null, el); } catch(_){} }, 700);
        ev.stopPropagation(); return;
      }
    });
  }

  function update(cfg, rawHass, el) {
    try { el.innerHTML = render(cfg, rawHass || H()); mount(cfg, rawHass || H(), el); } catch(e){}
  }

  /* ── configure ── */
  function configure(cfg, _el, onSave) {
    const c = loadCfg(cfg);
    const ents = Array.isArray(c.entities) ? JSON.parse(JSON.stringify(c.entities)) : [];
    const h = H();
    const col = c.color || '#fbbf24';
    let filterQ = '';
    let expandedAuto = new Set(); // indici con input automazione espanso

    function getLights() {
      if (!h || !h.states) return [];
      return Object.keys(h.states)
        .filter(id => id.startsWith('light.'))
        .map(id => ({ id, name: nameOf(h, id), on: isOn(h, id) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    const allLights = getLights();

    // overlay principale — z-index alto, NO nested popup
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { try { document.body.removeChild(ov); } catch(e){} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key === 'Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    function renderForm() {
      const selIds = new Set(ents.map(e => e.entity));
      const filtered = filterQ
        ? allLights.filter(l => l.name.toLowerCase().includes(filterQ.toLowerCase()) || l.id.includes(filterQ.toLowerCase()))
        : allLights;

      /* ---- luci selezionate ---- */
      const selRows = ents.map((e, i) => {
        const lbl = e.label || nameOf(h, e.entity);
        const on = isOn(h, e.entity);
        const hasAuto = !!(e.automation && e.automation.trim());
        const autoExpanded = expandedAuto.has(i);

        const autoSection = hasAuto
          ? `<div style="display:flex;align-items:center;gap:6px;margin-top:5px;padding:5px 6px;border-radius:6px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2)">
              <span style="font-size:10px;opacity:.5">🤖</span>
              <span style="flex:1;font-size:10px;color:rgba(255,255,255,.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(e.automation)}</span>
              <button data-rmauto="${i}" style="font-size:9px;padding:2px 6px;border-radius:4px;border:1px solid rgba(248,113,113,.3);background:rgba(248,113,113,.1);color:#f87171;cursor:pointer">✕</button>
            </div>`
          : autoExpanded
            ? `<div style="display:flex;gap:5px;margin-top:5px">
                <input id="gl-auto-inp-${i}" placeholder="automation.xxx" value="${eh(e.automation||'')}" style="flex:1;padding:6px 8px;border-radius:6px;border:1px solid rgba(99,102,241,.3);background:rgba(99,102,241,.08);color:#fff;font-size:11px;outline:none;font-family:inherit">
                <button data-saveauto="${i}" style="padding:6px 10px;border-radius:6px;border:none;background:#6366f1;color:#fff;cursor:pointer;font-size:11px;font-weight:700">OK</button>
              </div>`
            : `<button data-addauto="${i}" style="margin-top:4px;font-size:9px;padding:3px 8px;border-radius:5px;border:1px dashed rgba(255,255,255,.2);background:transparent;color:rgba(255,255,255,.4);cursor:pointer">🤖 + Automazione (opz.)</button>`;

        return `<div style="padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid ${on?hex2rgba(col,.25):'rgba(255,255,255,.08)'};margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;flex-shrink:0;filter:${on?'none':'grayscale(1) opacity(.4)'}">💡</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(lbl)}</div>
              <div style="font-size:9px;color:rgba(255,255,255,.35)">${eh(e.entity)}</div>
            </div>
            <button data-del="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
          </div>
          ${autoSection}
        </div>`;
      }).join('');

      /* ---- picker luci ---- */
      const lightRows = filtered.map(l => {
        const sel = selIds.has(l.id);
        return `<label data-light-id="${eh(l.id)}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:${sel?hex2rgba(col,.08):'rgba(255,255,255,.02)'};border:1px solid ${sel?hex2rgba(col,.3):'rgba(255,255,255,.06)'};cursor:pointer;margin-bottom:3px;transition:all .15s">
          <div style="width:28px;height:28px;border-radius:50%;background:${l.on?hex2rgba(col,.15):'rgba(255,255,255,.05)'};border:1px solid ${l.on?hex2rgba(col,.35):'rgba(255,255,255,.1)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;filter:${l.on?'none':'grayscale(1) opacity(.4)'}">💡</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(l.name)}</div>
            <div style="font-size:10px;color:${l.on?col:'rgba(255,255,255,.3)'}">${l.on?'Accesa':'Spenta'}</div>
          </div>
          <div style="width:18px;height:18px;border-radius:4px;border:2px solid ${sel?col:'rgba(255,255,255,.3)'};background:${sel?col:'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#000;font-weight:900;transition:all .15s">${sel?'✓':''}</div>
        </label>`;
      }).join('') || `<div style="padding:20px;text-align:center;color:rgba(255,255,255,.3);font-size:11px">Nessuna luce trovata</div>`;

      return `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(251,191,36,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;animation:glCfgUp .22s cubic-bezier(.32,1.12,.56,1)">
        <style>@keyframes glCfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} .glcinp{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .15s} .glcinp:focus{border-color:rgba(251,191,36,.5);background:rgba(251,191,36,.04)} .glcinp::placeholder{color:rgba(255,255,255,.3)}</style>

        <!-- header -->
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(251,191,36,.13);border:1px solid rgba(251,191,36,.28);display:flex;align-items:center;justify-content:center;font-size:18px">💡</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Luci</div>
            <div style="font-size:10px;color:rgba(255,255,255,.38)">${ents.length} luc${ents.length===1?'e':'i'} selezionate</div>
          </div>
          <button id="glcfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <!-- body scroll -->
        <div style="flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;padding:14px 14px 4px">

          <!-- chip settings -->
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Chip</div>
          <div style="display:flex;gap:7px;margin-bottom:10px">
            <div style="flex:1"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Etichetta</div><input id="glcfg-label" class="glcinp" placeholder="Luci" value="${eh(c.label||'Luci')}"></div>
            <div style="flex:0 0 56px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Icona</div><input id="glcfg-icon" class="glcinp" placeholder="💡" value="${eh(c.icon||'💡')}" style="text-align:center;font-size:15px;padding:6px 4px"></div>
            <div style="flex:0 0 50px"><div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Colore</div><input type="color" id="glcfg-color" value="${(c.color||'#fbbf24').match(/^#[0-9a-f]{6}$/i)?c.color:'#fbbf24'}" style="width:100%;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:none;cursor:pointer;padding:2px"></div>
          </div>

          <!-- sensore opzionale -->
          <div style="font-size:9px;color:rgba(255,255,255,.4);margin-bottom:3px">Entità sensore (opzionale — sostituisce il contatore N/M)</div>
          <input id="glcfg-sensor" class="glcinp" placeholder="sensor.luci_accese oppure light.gruppo_luci" value="${eh(c.sensorEntity||'')}" style="margin-bottom:12px">

          <!-- luci selezionate -->
          ${ents.length ? `
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px">Luci selezionate (${ents.length})</div>
            <div id="glcfg-sel">${selRows}</div>
          ` : ''}

          <!-- picker -->
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin:${ents.length?'10px':0} 0 6px">Seleziona luci (${allLights.length} disponibili)</div>
          <input id="glcfg-search" class="glcinp" placeholder="🔍 Cerca luce…" value="${eh(filterQ)}" style="margin-bottom:7px">
          <div id="glcfg-list" style="border-radius:10px;border:1px solid rgba(255,255,255,.07);padding:6px;background:rgba(0,0,0,.25);max-height:260px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent">${lightRows}</div>
          <div style="height:14px"></div>
        </div>

        <!-- footer -->
        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="glcfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#fbbf24;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="glcfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;
    }

    function attach() {
      ov.innerHTML = renderForm();

      ov.querySelector('#glcfg-close').onclick = closeOv;
      ov.querySelector('#glcfg-cancel').onclick = closeOv;
      ov.addEventListener('click', ev => { if (ev.target === ov) closeOv(); });

      // search filter
      const srch = ov.querySelector('#glcfg-search');
      srch && srch.addEventListener('input', () => { filterQ = srch.value; attach(); });

      // toggle luce
      ov.querySelectorAll('[data-light-id]').forEach(lbl => {
        lbl.addEventListener('click', ev => {
          ev.preventDefault();
          const lid = lbl.dataset.lightId;
          const idx = ents.findIndex(e => e.entity === lid);
          if (idx >= 0) {
            ents.splice(idx, 1);
            expandedAuto.delete(idx);
          } else {
            ents.push({ entity: lid, label: '', automation: '' });
          }
          attach();
        });
      });

      // rimuovi luce selezionata
      ov.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.del);
          ents.splice(i, 1);
          expandedAuto.delete(i);
          attach();
        });
      });

      // apri input automazione
      ov.querySelectorAll('[data-addauto]').forEach(btn => {
        btn.addEventListener('click', () => {
          expandedAuto.add(parseInt(btn.dataset.addauto));
          attach();
          // focus sull'input dopo re-render
          setTimeout(() => {
            const inp = ov.querySelector('#gl-auto-inp-' + btn.dataset.addauto);
            if (inp) inp.focus();
          }, 30);
        });
      });

      // salva automazione
      ov.querySelectorAll('[data-saveauto]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.saveauto);
          const inp = ov.querySelector('#gl-auto-inp-' + i);
          if (inp) ents[i].automation = inp.value.trim();
          expandedAuto.delete(i);
          attach();
        });
      });

      // rimuovi automazione
      ov.querySelectorAll('[data-rmauto]').forEach(btn => {
        btn.addEventListener('click', () => {
          ents[parseInt(btn.dataset.rmauto)].automation = '';
          attach();
        });
      });

      // salva config
      ov.querySelector('#glcfg-save').addEventListener('click', () => {
        const newCfg = {
          label: (ov.querySelector('#glcfg-label')?.value || 'Luci').trim(),
          icon: (ov.querySelector('#glcfg-icon')?.value || '💡').trim(),
          color: ov.querySelector('#glcfg-color')?.value || '#fbbf24',
          sensorEntity: (ov.querySelector('#glcfg-sensor')?.value || '').trim(),
          entities: ents.filter(e => e.entity).map(e => ({
            entity: e.entity.trim(),
            label: e.label || '',
            automation: e.automation || '',
          })),
        };
        closeOv();
        if (typeof onSave === 'function') onSave(newCfg);
      });
    }

    attach();
    document.body.appendChild(ov);
  }

  /* ── registrazione ── */
  const CARD = {
    id: ID,
    name: 'Gruppo Luci',
    icon: '💡',
    desc: 'Chip con contatore luci accese. Clic → pannello toggle + Accendi/Spegni tutte.',
    version: '1.1',
    isDistintivo: true,
    defaultCfg: { label: 'Luci', icon: '💡', color: '#fbbf24', sensorEntity: '', entities: [] },
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
  try { console.log('[FratechStore] Distintivo registrato: gruppo-luci v1.1'); } catch(e){}
})();
