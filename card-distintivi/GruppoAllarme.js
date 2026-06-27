/* frarik-version: 1.4 */
/**
 * GruppoAllarme.js — Distintivo FratechStore v1.4
 * Chip stato allarme Alarmo + popup sensori/bypass + overlay triggered automatico
 */
(function () {
  'use strict';

  const ID = 'gruppo-allarme';

  const ALARM_DEF = {
    disarmed:            { lbl: 'Disarmato',        col: '#4ade80', ico: 'mdi:lock-open-variant', pulse: false },
    armed_away:          { lbl: 'Armato · Fuori',   col: '#ef4444', ico: 'mdi:lock',              pulse: false },
    armed_home:          { lbl: 'Armato · Casa',    col: '#f97316', ico: 'mdi:home-lock',         pulse: false },
    armed_night:         { lbl: 'Armato · Notte',   col: '#a78bfa', ico: 'mdi:weather-night',     pulse: false },
    armed_vacation:      { lbl: 'Armato · Vacanza', col: '#facc15', ico: 'mdi:airplane',          pulse: false },
    armed_custom_bypass: { lbl: 'Armato · Bypass',  col: '#34d399', ico: 'mdi:shield-half-full',  pulse: false },
    pending:             { lbl: 'In ingresso…',     col: '#facc15', ico: 'mdi:timer-outline',     pulse: true  },
    arming:              { lbl: 'Attivazione…',     col: '#facc15', ico: 'mdi:timer-sand',        pulse: true  },
    triggered:           { lbl: '⚠ ALLARME',        col: '#f87171', ico: 'mdi:alarm-light',       pulse: true  },
  };

  const ALL_MODES = [
    { key: 'armed_away',     lbl: 'Fuori Casa', ico: 'mdi:car-outline',   svc: 'alarm_arm_away'     },
    { key: 'armed_home',     lbl: 'Casa',       ico: 'mdi:home-outline',  svc: 'alarm_arm_home'     },
    { key: 'armed_night',    lbl: 'Notte',      ico: 'mdi:weather-night', svc: 'alarm_arm_night'    },
    { key: 'armed_vacation', lbl: 'Vacanza',    ico: 'mdi:airplane',      svc: 'alarm_arm_vacation' },
  ];

  const DC_ICO = {
    door:      { off: 'mdi:door-closed',        on: 'mdi:door-open'            },
    window:    { off: 'mdi:window-closed',       on: 'mdi:window-open'          },
    opening:   { off: 'mdi:window-closed',       on: 'mdi:window-open'          }, // HA usa 'opening' per finestre
    motion:    { off: 'mdi:motion-sensor-off',   on: 'mdi:motion-sensor'        },
    smoke:     { off: 'mdi:smoke-detector',      on: 'mdi:smoke-detector-alert' },
    vibration: { off: 'mdi:vibrate-off',         on: 'mdi:vibrate'              },
    moisture:  { off: 'mdi:water-outline',       on: 'mdi:water-alert'          },
    gas:       { off: 'mdi:molecule-co2',        on: 'mdi:alert'                },
  };
  const DC_DEFAULT = { off: 'mdi:shield-outline', on: 'mdi:shield-alert' };

  /* ── helpers ── */
  function H() {
    try { const h = window.frarikHass?.(); if (h?.states) return h; } catch (e) {}
    return null;
  }
  function loadCfg(c) { return c && typeof c === 'object' ? c : {}; }
  function nameOf(h, id) {
    const s = h?.states?.[id];
    return s?.attributes?.friendly_name || (id?.includes('.') ? id.split('.')[1].replace(/_/g, ' ') : (id || ''));
  }
  function stateOf(h, id) { return h?.states?.[id]?.state || 'unknown'; }
  function attrOf(h, id, a) { return h?.states?.[id]?.attributes?.[a]; }
  function liveH(raw) { return H() || (raw?.states ? raw : null); }
  function eh(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function hex2rgba(hex, a) {
    let h = (hex || '').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6) return `rgba(255,255,255,${a})`;
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  }
  function mdi(name, sz) {
    sz = sz || 16;
    if (typeof name === 'string' && name.startsWith('mdi:'))
      return `<span class="mdi mdi-${name.slice(4)}" style="font-size:${sz}px;line-height:1;color:inherit"></span>`;
    return `<span style="font-size:${sz}px;line-height:1">${name || '🔒'}</span>`;
  }
  function callEx(domain, svc, data) {
    const hh = H();
    if (hh?.callService) { hh.callService(domain, svc, data); return; }
    if (typeof window.callSvc === 'function') {
      const { entity_id, ...rest } = data;
      window.callSvc(domain, svc, entity_id, rest);
    }
  }
  function alarmDef(state) {
    return ALARM_DEF[state] || { lbl: state || 'Sconosciuto', col: 'rgba(255,255,255,.3)', ico: 'mdi:help-circle', pulse: false };
  }
  function isArmed(state) {
    return !!state && state !== 'disarmed' && state !== 'unknown' && state !== 'unavailable';
  }
  function sensorDcIco(h, entityId, isOpen) {
    const dc = attrOf(h, entityId, 'device_class') || 'door';
    return (DC_ICO[dc] || DC_DEFAULT)[isOpen ? 'on' : 'off'];
  }

  /* ════════════════════════════════════════
     OVERLAY TRIGGERED — si apre automaticamente
     ════════════════════════════════════════ */
  const OVL_ID = 'cc-alarm-triggered-ovl';

  function _updateOverlay(cfg, h) {
    const c  = loadCfg(cfg);
    const ae = c.alarmEntity;
    if (!ae || !h) return;

    const state = stateOf(h, ae);
    let ovl = document.getElementById(OVL_ID);

    if (state !== 'triggered') {
      if (ovl) ovl.remove();
      return;
    }

    if (ovl) return; // già aperto

    const alarmName = nameOf(h, ae);
    const hasSiren  = !!c.siren;
    const sirenOn   = hasSiren ? (stateOf(h, c.siren) === 'on') : false;
    const code      = c.code ? String(c.code) : undefined;

    ovl = document.createElement('div');
    ovl.id = OVL_ID;
    ovl.style.cssText = 'position:fixed;inset:0;z-index:999998;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif';

    ovl.innerHTML = `
      <style>
        @keyframes ccAOvlBg   { from{background:rgba(185,28,28,.22)} to{background:rgba(239,68,68,.38)} }
        @keyframes ccAOvlCard { from{box-shadow:0 0 0 0 rgba(248,113,113,.8)} to{box-shadow:0 0 0 32px rgba(248,113,113,0)} }
        #${OVL_ID}          { animation: ccAOvlBg   1s ease-in-out infinite alternate }
        #cc-alarm-ovl-card  { animation: ccAOvlCard 1.4s ease-out   infinite         }
      </style>
      <div id="cc-alarm-ovl-card" style="background:#150505;border:2px solid #f87171;border-radius:24px;padding:36px 44px;text-align:center;max-width:340px;width:90%;color:#fff">
        <div style="font-size:56px;margin-bottom:10px">🚨</div>
        <div style="font-size:24px;font-weight:900;color:#f87171;letter-spacing:1.5px;margin-bottom:6px">ALLARME IN CORSO</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:28px">${eh(alarmName)}</div>
        <button id="cc-alarm-ovl-disarm" style="width:100%;padding:15px;border-radius:14px;border:none;background:#f87171;color:#0a0204;font-weight:900;font-size:17px;cursor:pointer;letter-spacing:.5px${hasSiren ? ';margin-bottom:10px' : ''}">🔓 DISARMA</button>
        ${hasSiren ? `<button id="cc-alarm-ovl-siren" style="width:100%;padding:12px;border-radius:14px;border:1px solid rgba(248,113,113,.4);background:rgba(248,113,113,.1);color:#f87171;font-weight:700;font-size:13px;cursor:pointer">${sirenOn ? '🔇 Spegni sirena' : '🔕 Sirena già spenta'}</button>` : ''}
      </div>`;

    document.body.appendChild(ovl);

    const payload = code ? { entity_id: ae, code } : { entity_id: ae };
    ovl.querySelector('#cc-alarm-ovl-disarm').addEventListener('click', () => {
      callEx('alarm_control_panel', 'alarm_disarm', payload);
    });
    if (hasSiren) {
      ovl.querySelector('#cc-alarm-ovl-siren')?.addEventListener('click', () => {
        if (sirenOn) callEx('homeassistant', 'turn_off', { entity_id: c.siren });
      });
    }
  }

  /* ════════════════════════════════════════
     CHIP
     ════════════════════════════════════════ */
  function chip(cfg, rawHass) {
    const c   = loadCfg(cfg);
    const h   = liveH(rawHass);
    const ae  = c.alarmEntity;
    const state = ae && h ? stateOf(h, ae) : 'unknown';
    const def   = alarmDef(state);
    return {
      icon:  mdi(def.ico, 16),
      label: c.label || 'Allarme',
      value: def.lbl,
      color: def.col,
      pulse: def.pulse,
    };
  }

  function watchEntities(cfg) {
    const c = loadCfg(cfg);
    const ids = [];
    if (c.alarmEntity) ids.push(c.alarmEntity);
    if (c.siren)       ids.push(c.siren);
    (c.sensors || []).forEach(s => { if (s.entity) ids.push(s.entity); });
    return ids;
  }

  /* ════════════════════════════════════════
     RENDER POPUP
     ════════════════════════════════════════ */
  function render(cfg, rawHass, bypassed) {
    const c = loadCfg(cfg);
    const h = liveH(rawHass);
    bypassed = bypassed instanceof Set ? bypassed : new Set();

    if (!c.alarmEntity) {
      return `<div style="padding:36px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:12px;font-family:system-ui,sans-serif">
        Nessuna entità allarme configurata.<br>
        <span style="font-size:10px;opacity:.6">Clicca ✏️ sulla chip per configurare.</span>
      </div>`;
    }

    const ae      = c.alarmEntity;
    const state   = h ? stateOf(h, ae) : 'unknown';
    const def     = alarmDef(state);
    const col     = def.col;
    const armed   = isArmed(state);
    const canDisarm = armed && state !== 'triggered';

    const enabledModes  = c.modes || ['armed_away'];
    const visibleModes  = ALL_MODES.filter(m => enabledModes.includes(m.key));

    /* ── sensori ── */
    const sensors    = Array.isArray(c.sensors) ? c.sensors : [];
    const openActive = sensors.filter(s => {
      const ss = h ? stateOf(h, s.entity) : 'unknown';
      return ss === 'on' && !bypassed.has(s.entity);
    }).length;

    const secLbl = 'font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.7px;color:rgba(255,255,255,.28);margin-bottom:5px';

    const sensorRows = sensors.map((s, i) => {
      if (!s.entity) return '';
      const ss          = h ? stateOf(h, s.entity) : 'unknown';
      const open        = ss === 'on';
      const isBypassed  = bypassed.has(s.entity);
      const sIco        = sensorDcIco(h, s.entity, open);
      const sLbl        = s.label || nameOf(h, s.entity);

      let rowBg = 'rgba(255,255,255,.04)', rowBdr = 'rgba(255,255,255,.08)', tag = '', bypassBtn = '';

      if (isBypassed) {
        rowBg  = 'rgba(250,204,21,.06)';
        rowBdr = 'rgba(250,204,21,.22)';
        tag    = `<span style="font-size:9px;padding:2px 7px;border-radius:4px;background:rgba(250,204,21,.18);color:#facc15;font-weight:700;flex-shrink:0">ESCLUSO</span>`;
      } else if (open) {
        rowBg  = 'rgba(248,113,113,.08)';
        rowBdr = 'rgba(248,113,113,.25)';
        tag    = `<span style="font-size:9px;padding:2px 7px;border-radius:4px;background:rgba(248,113,113,.18);color:#f87171;font-weight:700;flex-shrink:0">APERTO</span>`;
      } else {
        tag = `<span style="font-size:9px;padding:2px 7px;border-radius:4px;background:rgba(74,222,128,.13);color:#4ade80;font-weight:700;flex-shrink:0">OK</span>`;
      }

      // bypass toggle sempre visibile quando non armato
      if (!armed) {
        bypassBtn = isBypassed
          ? `<button data-ca-bypass="${i}" data-entity="${eh(s.entity)}" style="padding:3px 8px;border-radius:6px;border:1px solid rgba(250,204,21,.38);background:rgba(250,204,21,.1);color:#facc15;cursor:pointer;font-size:9px;font-weight:700;white-space:nowrap;outline:none;flex-shrink:0">✕ Includi</button>`
          : `<button data-ca-bypass="${i}" data-entity="${eh(s.entity)}" style="padding:3px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;font-size:9px;font-weight:700;white-space:nowrap;outline:none;flex-shrink:0">Escludi</button>`;
      }

      return `<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;background:${rowBg};border:1px solid ${rowBdr}">
        <span style="color:${open && !isBypassed ? '#f87171' : isBypassed ? '#facc15' : '#4ade80'};flex-shrink:0">${mdi(sIco, 16)}</span>
        <span style="flex:1;font-size:12px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(sLbl)}</span>
        ${tag}
        ${bypassBtn}
      </div>`;
    }).join('');

    /* ── bottoni modalità ── */
    const modeBtns = visibleModes.map(m => {
      const isCur = state === m.key;
      const mCol  = ALARM_DEF[m.key]?.col || '#f97316';
      return `<button data-ca-arm="${m.svc}" style="flex:1;padding:10px 4px;border-radius:11px;border:1px solid ${isCur ? hex2rgba(mCol,.4) : 'rgba(255,255,255,.12)'};background:${isCur ? hex2rgba(mCol,.18) : 'rgba(255,255,255,.06)'};color:${isCur ? mCol : '#fff'};cursor:pointer;font-size:10px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:4px;outline:none;min-width:0;transition:background .15s">
        <span style="color:inherit">${mdi(m.ico, 19)}</span>
        <span style="white-space:nowrap;color:inherit">${eh(m.lbl)}</span>
      </button>`;
    }).join('');

    const disarmBtn = `<button data-ca-disarm style="flex:1;padding:10px 4px;border-radius:11px;border:1px solid ${state==='disarmed'?'rgba(74,222,128,.38)':'rgba(255,255,255,.12)'};background:${state==='disarmed'?'rgba(74,222,128,.15)':'rgba(255,255,255,.06)'};color:${state==='disarmed'?'#4ade80':'#fff'};cursor:pointer;font-size:10px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:4px;outline:none;min-width:0">
      <span style="color:inherit">${mdi('mdi:lock-open-variant', 19)}</span>
      <span style="white-space:nowrap;color:inherit">Disarma</span>
    </button>`;

    /* ── warning sensori aperti ── */
    const openWarn = (openActive > 0 && !armed) ? `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;background:rgba(250,204,21,.07);border:1px solid rgba(250,204,21,.22);margin-bottom:10px">
      <span style="font-size:14px;flex-shrink:0">⚠️</span>
      <span style="font-size:11px;color:#facc15;font-weight:600">${openActive} sensore${openActive > 1 ? 'i' : ''} aper${openActive > 1 ? 'ti' : 'to'} — escludili per armare lo stesso</span>
    </div>` : '';

    /* ── sirena ── */
    let sirenRow = '';
    if (c.siren) {
      const ss     = h ? stateOf(h, c.siren) : 'unknown';
      const sirenOn = ss === 'on';
      const sName   = nameOf(h, c.siren);
      sirenRow = `<div style="margin-top:10px">
        <div style="${secLbl}">Sirena</div>
        <div style="display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;background:${sirenOn ? 'rgba(248,113,113,.08)' : 'rgba(74,222,128,.06)'};border:1px solid ${sirenOn ? 'rgba(248,113,113,.28)' : 'rgba(74,222,128,.18)'}">
          <span style="color:${sirenOn ? '#f87171' : '#4ade80'}">${mdi('mdi:bullhorn', 16)}</span>
          <span style="flex:1;font-size:12px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${eh(sName)}</span>
          <span style="font-size:9px;padding:2px 7px;border-radius:4px;background:${sirenOn ? 'rgba(248,113,113,.18)' : 'rgba(74,222,128,.13)'};color:${sirenOn ? '#f87171' : '#4ade80'};font-weight:700;flex-shrink:0">${sirenOn ? 'ATTIVA' : 'SPENTA'}</span>
          ${sirenOn ? `<button data-ca-siren-off style="padding:3px 8px;border-radius:6px;border:1px solid rgba(248,113,113,.38);background:rgba(248,113,113,.1);color:#f87171;cursor:pointer;font-size:9px;font-weight:700;outline:none;flex-shrink:0">Spegni</button>` : ''}
        </div>
      </div>`;
    }

    return `<div style="padding:12px 12px 0;font-family:system-ui,sans-serif">
      <style>
        @keyframes ccAlmPulse { from{opacity:.7} to{opacity:1} }
        .cc-alm-pulse { animation: ccAlmPulse .85s ease-in-out infinite alternate }
      </style>

      <!-- stato header -->
      <div class="${def.pulse ? 'cc-alm-pulse' : ''}" style="display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:13px;background:${hex2rgba(col,.1)};border:1px solid ${hex2rgba(col,.3)};margin-bottom:11px">
        <span style="font-size:30px;color:${col};flex-shrink:0">${mdi(def.ico, 30)}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:16px;font-weight:900;color:${col};letter-spacing:.3px">${def.lbl}</div>
        </div>
      </div>

      <!-- azioni -->
      <div style="display:flex;gap:5px;margin-bottom:11px">
        ${modeBtns}
        ${disarmBtn}
      </div>

      ${openWarn}

      <!-- sensori -->
      ${sensors.length ? `<div style="${secLbl}">Sensori</div><div style="display:flex;flex-direction:column;gap:4px">${sensorRows}</div>` : ''}

      ${sirenRow}
      <div style="height:12px"></div>
    </div>`;
  }

  /* ════════════════════════════════════════
     HANDLERS
     ════════════════════════════════════════ */
  function _mountHandlers(cfg, el) {
    const c = loadCfg(cfg);
    if (el._caHandler) el.removeEventListener('click', el._caHandler);

    function handler(ev) {
      /* bypass toggle */
      const bypassBtn = ev.target.closest('[data-ca-bypass]');
      if (bypassBtn) {
        const entityId = bypassBtn.dataset.entity;
        if (!el._bypassed) el._bypassed = new Set();
        if (el._bypassed.has(entityId)) el._bypassed.delete(entityId);
        else el._bypassed.add(entityId);
        el.innerHTML = render(cfg, null, el._bypassed);
        _mountHandlers(cfg, el);
        ev.stopPropagation(); return;
      }

      /* arm */
      const armBtn = ev.target.closest('[data-ca-arm]');
      if (armBtn) {
        const svc    = armBtn.dataset.caArm;
        const code   = c.code ? String(c.code) : undefined;
        const bypArr = el._bypassed ? [...el._bypassed] : [];

        if (bypArr.length) {
          // Usa alarmo.arm con force:true — unico modo affidabile per ignorare
          // sensori aperti senza dover abilitare il bypass nelle impostazioni Alarmo
          const modeMap = { alarm_arm_away:'away', alarm_arm_home:'home', alarm_arm_night:'night', alarm_arm_vacation:'vacation' };
          const payload = { entity_id: c.alarmEntity, mode: modeMap[svc] || 'away', force: true };
          if (code) payload.code = code;
          callEx('alarmo', 'arm', payload);
        } else {
          const payload = { entity_id: c.alarmEntity };
          if (code) payload.code = code;
          callEx('alarm_control_panel', svc, payload);
        }
        // el._bypassed NON viene pulito: sparisce da solo quando armed=true
        ev.stopPropagation(); return;
      }

      /* disarm */
      const disarmBtn = ev.target.closest('[data-ca-disarm]');
      if (disarmBtn) {
        const code    = c.code ? String(c.code) : undefined;
        const payload = { entity_id: c.alarmEntity };
        if (code) payload.code = code;
        callEx('alarm_control_panel', 'alarm_disarm', payload);
        ev.stopPropagation(); return;
      }

      /* siren off */
      const sirenOff = ev.target.closest('[data-ca-siren-off]');
      if (sirenOff && c.siren) {
        callEx('homeassistant', 'turn_off', { entity_id: c.siren });
        ev.stopPropagation(); return;
      }
    }

    el._caHandler = handler;
    el.addEventListener('click', handler);
  }

  /* ════════════════════════════════════════
     MOUNT / UPDATE
     ════════════════════════════════════════ */
  function mount(cfg, rawHass, el) {
    if (!el._bypassed) el._bypassed = new Set();
    _mountHandlers(cfg, el);

    const h0 = liveH(rawHass);
    if (h0) _updateOverlay(cfg, h0);

    if (el._caPoll) return;
    el._caPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._caPoll); delete el._caPoll; return; }
      try {
        const h = H(); if (!h) return;
        _updateOverlay(cfg, h);
        el.innerHTML = render(cfg, h, el._bypassed);
        _mountHandlers(cfg, el);
      } catch (e) {}
    }, 1500);
  }

  function update(cfg, rawHass, el) {
    try {
      const h = liveH(rawHass);
      _updateOverlay(cfg, h);
      el.innerHTML = render(cfg, rawHass, el._bypassed || new Set());
      _mountHandlers(cfg, el);
    } catch (e) {}
  }

  /* ════════════════════════════════════════
     CONFIGURE
     ════════════════════════════════════════ */
  function configure(cfg, _el, onSave) {
    const c       = loadCfg(cfg);
    const sensors = JSON.parse(JSON.stringify(Array.isArray(c.sensors) ? c.sensors : []));
    const modes   = new Set(c.modes || ['armed_away']);
    const h       = H();

    let _acDrop = null;
    function _closeAc() { try { _acDrop?.remove(); } catch (e) {} _acDrop = null; }

    function _openAc(inp, matches, onPick) {
      _closeAc();
      if (!matches.length) return;
      const rect = inp.getBoundingClientRect();
      const MAXH = 200;
      const useAbove = (window.innerHeight - rect.bottom - 6 < MAXH) && (rect.top - 6 > MAXH / 2);
      _acDrop = document.createElement('div');
      const pos = useAbove ? `bottom:${window.innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`;
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(249,115,22,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent`;
      matches.slice(0, 12).forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div><div style="font-size:9px;color:rgba(255,255,255,.38);margin-top:1px">${eh(m.id)}</div>`;
        r.addEventListener('mouseover', () => r.style.background = 'rgba(249,115,22,.08)');
        r.addEventListener('mouseout',  () => r.style.background = 'transparent');
        r.addEventListener('mousedown', ev => { ev.preventDefault(); onPick(m.id, m.name); _closeAc(); });
        _acDrop.appendChild(r);
      });
      document.body.appendChild(_acDrop);
      inp.focus();
    }

    function _setupAc(inp, filterFn, onPick) {
      inp.addEventListener('input', () => {
        const q = (inp.value || '').toLowerCase().trim();
        if (!q) { _closeAc(); return; }
        _openAc(inp, filterFn(q), onPick);
      });
      inp.addEventListener('focus', () => {
        const q = (inp.value || '').toLowerCase().trim();
        if (q) _openAc(inp, filterFn(q), onPick);
      });
      inp.addEventListener('blur', () => setTimeout(_closeAc, 160));
    }

    function _alarmMatches(q) {
      if (!h?.states) return [];
      return Object.keys(h.states)
        .filter(id => id.startsWith('alarm_control_panel.') && (id.toLowerCase().includes(q) || nameOf(h,id).toLowerCase().includes(q)))
        .map(id => ({ id, name: nameOf(h, id) }));
    }
    function _binaryMatches(q) {
      if (!h?.states) return [];
      return Object.keys(h.states)
        .filter(id => id.startsWith('binary_sensor.') && (id.toLowerCase().includes(q) || nameOf(h,id).toLowerCase().includes(q)))
        .map(id => ({ id, name: nameOf(h, id) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    function _sirenMatches(q) {
      if (!h?.states) return [];
      return Object.keys(h.states)
        .filter(id => (id.startsWith('switch.') || id.startsWith('siren.') || id.startsWith('input_boolean.')) && (id.toLowerCase().includes(q) || nameOf(h,id).toLowerCase().includes(q)))
        .map(id => ({ id, name: nameOf(h, id) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:flex-end;background:rgba(0,0,0,.78);backdrop-filter:blur(7px);font-family:system-ui,sans-serif';

    function closeOv() { _closeAc(); try { document.body.removeChild(ov); } catch (e) {} document.removeEventListener('keydown', escFn); }
    function escFn(ev) { if (ev.key === 'Escape') closeOv(); }
    document.addEventListener('keydown', escFn);

    let _first = true;

    function attach() {
      _closeAc();
      const prevScroll = ov.querySelector('#cacfg-body')?.scrollTop || 0;
      const curAlarm   = ov.querySelector('#cacfg-alarm')?.value;
      const curCode    = ov.querySelector('#cacfg-code')?.value;
      const curSiren   = ov.querySelector('#cacfg-siren')?.value;
      const curLabel   = ov.querySelector('#cacfg-label')?.value;

      const sinp = 'width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px;outline:none;font-family:inherit';
      const secL = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.35);margin-bottom:6px';

      const modeChecks = ALL_MODES.map(m => {
        const checked = modes.has(m.key);
        const mCol    = ALARM_DEF[m.key]?.col || '#f97316';
        return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 8px;border-radius:8px;border:1px solid ${checked ? hex2rgba(mCol,.3) : 'rgba(255,255,255,.07)'};background:${checked ? hex2rgba(mCol,.07) : 'rgba(255,255,255,.03)'};transition:background .15s">
          <input type="checkbox" data-ca-mode="${m.key}" ${checked ? 'checked' : ''} style="width:15px;height:15px;accent-color:${mCol};cursor:pointer;flex-shrink:0">
          <span style="font-size:13px;flex-shrink:0">${mdi(m.ico, 13)}</span>
          <span style="font-size:12px;font-weight:600;color:${checked ? mCol : 'rgba(255,255,255,.55)'}">${eh(m.lbl)}</span>
        </label>`;
      }).join('');

      const sensorRows = sensors.map((s, i) => {
        const dc  = attrOf(h, s.entity, 'device_class') || 'door';
        const icoK = (DC_ICO[dc] || DC_DEFAULT).off;
        return `<div style="display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)">
          <span style="font-size:14px;flex-shrink:0;color:rgba(255,255,255,.5)">${mdi(icoK, 14)}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(s.label || nameOf(h, s.entity))}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.35)">${eh(s.entity)}</div>
          </div>
          <button data-ca-delsensor="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
        </div>`;
      }).join('');

      const anim = _first ? 'animation:cacfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';

      ov.innerHTML = `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0f0d1a;border:1px solid rgba(249,115,22,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes cacfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} #cacfg-body::-webkit-scrollbar{display:none}</style>

        <!-- header -->
        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(249,115,22,.13);border:1px solid rgba(249,115,22,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🔒</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Allarme</div>
            <div style="font-size:10px;color:rgba(255,255,255,.38)">${sensors.length} sensori · ${[...modes].length} modalità</div>
          </div>
          <button id="cacfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

        <!-- body -->
        <div id="cacfg-body" style="flex:1;overflow-y:auto;scrollbar-width:none;padding:14px 14px 4px">

          <div style="${secL}">Chip</div>
          <input id="cacfg-label" style="${sinp};margin-bottom:14px" value="${eh(c.label || 'Allarme')}" placeholder="Nome chip">

          <div style="${secL}">Entità allarme</div>
          <input id="cacfg-alarm" style="${sinp};margin-bottom:8px" value="${eh(c.alarmEntity || '')}" placeholder="🔍 alarm_control_panel.alarmo…" autocomplete="off">

          <div style="${secL}">PIN code</div>
          <input id="cacfg-code" type="text" inputmode="numeric" style="${sinp};margin-bottom:14px" value="${eh(c.code || '')}" placeholder="Lascia vuoto se non richiesto">

          <div style="${secL}">Modalità da mostrare</div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px">${modeChecks}</div>

          <div style="${secL}">Sensori (${sensors.length})</div>
          ${sensors.length ? `<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px">${sensorRows}</div>` : ''}
          <input id="cacfg-add-sensor" style="${sinp};margin-bottom:14px" placeholder="🔍 Aggiungi binary_sensor…" autocomplete="off">

          <div style="${secL}">Sirena (opzionale)</div>
          <input id="cacfg-siren" style="${sinp};margin-bottom:14px" value="${eh(c.siren || '')}" placeholder="🔍 switch.sirena o siren.*…" autocomplete="off">

          <div style="height:10px"></div>
        </div>

        <!-- footer -->
        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="cacfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#f97316;color:#0a0816;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="cacfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;

      _first = false;
      if (prevScroll) { const b = ov.querySelector('#cacfg-body'); if (b) b.scrollTop = prevScroll; }
      if (curAlarm !== undefined) { const f = ov.querySelector('#cacfg-alarm'); if (f) f.value = curAlarm; }
      if (curCode  !== undefined) { const f = ov.querySelector('#cacfg-code');  if (f) f.value = curCode; }
      if (curSiren !== undefined) { const f = ov.querySelector('#cacfg-siren'); if (f) f.value = curSiren; }
      if (curLabel !== undefined) { const f = ov.querySelector('#cacfg-label'); if (f) f.value = curLabel; }

      /* mode checkboxes */
      ov.querySelectorAll('[data-ca-mode]').forEach(cb => {
        cb.addEventListener('change', () => {
          const k = cb.dataset.caMode;
          if (cb.checked) modes.add(k); else modes.delete(k);
          attach();
        });
      });

      /* sensor delete */
      ov.querySelectorAll('[data-ca-delsensor]').forEach(btn => {
        btn.addEventListener('click', () => { sensors.splice(parseInt(btn.dataset.caDelsensor), 1); attach(); });
      });

      /* autocomplete */
      const alarmInp = ov.querySelector('#cacfg-alarm');
      if (alarmInp) _setupAc(alarmInp, _alarmMatches, id => { alarmInp.value = id; });

      const addSensorInp = ov.querySelector('#cacfg-add-sensor');
      if (addSensorInp) {
        _setupAc(addSensorInp, _binaryMatches, (id, name) => {
          if (!sensors.find(s => s.entity === id)) sensors.push({ entity: id, label: name || '' });
          addSensorInp.value = '';
          attach();
        });
      }

      const sirenInp = ov.querySelector('#cacfg-siren');
      if (sirenInp) _setupAc(sirenInp, _sirenMatches, id => { sirenInp.value = id; });

      /* backdrop */
      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);

      ov.querySelector('#cacfg-close').onclick  = closeOv;
      ov.querySelector('#cacfg-cancel').onclick = closeOv;

      ov.querySelector('#cacfg-save').addEventListener('click', () => {
        const newCfg = {
          label:       (ov.querySelector('#cacfg-label')?.value || 'Allarme').trim(),
          alarmEntity: (ov.querySelector('#cacfg-alarm')?.value || '').trim(),
          code:        (ov.querySelector('#cacfg-code')?.value  || '').trim(),
          siren:       (ov.querySelector('#cacfg-siren')?.value || '').trim(),
          modes:       [...modes],
          sensors:     sensors.filter(s => s.entity).map(s => ({ entity: s.entity.trim(), label: (s.label || '').trim() })),
        };
        closeOv();
        if (typeof onSave === 'function') onSave(newCfg);
      });
    }

    attach();
    document.body.appendChild(ov);
  }

  /* ════════════════════════════════════════
     REGISTRAZIONE
     ════════════════════════════════════════ */
  const CARD = {
    id: ID, name: 'Gruppo Allarme', icon: '🔒',
    desc: '',
    version: '1.4', isDistintivo: true,
    defaultCfg: { label: 'Allarme', alarmEntity: '', code: '', modes: ['armed_away'], sensors: [], siren: '' },
    chip,
    watchEntities,
    render: (cfg, rawHass) => render(cfg, rawHass, null),
    mount,
    update,
    configure,
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[CARD.id] = CARD;
  try { console.log('[FratechStore] Distintivo registrato: gruppo-allarme v1.4'); } catch (e) {}
})();
