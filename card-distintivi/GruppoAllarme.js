/* frarik-version: 2.8 */
/**
 * GruppoAllarme.js — Distintivo FratechStore v2.8
 * Chip stato allarme Alarmo + popup sensori/bypass + overlay triggered automatico
 *
 * v2.3: fix bypass — azzera solo sulla transizione armato→disarmato, non mentre è già disarmato
 * v2.4: bypass disponibile anche quando l'allarme è già armato; ri-arma Alarmo con il nuovo set
 * v2.5: chip e popup con testo maiuscolo e in grassetto (label, stato, sensori, sirena, pulsanti)
 * v2.6: fix chip — l'aggiornamento live usa textContent (non innerHTML), quindi il valore del
 *       chip non può contenere tag HTML: ora è testo semplice già in maiuscolo
 * v2.7: chip con icona a scudo (cambia forma/colore per stato) al posto dell'emoji, rimossa la
 *       label fissa "Allarme:" — richiede l'aggiornamento live dell'icona aggiunto in main.js
 * v2.8: popup — restyle hero (medaglione scudo con alone), sensori con icona in badge
 *       circolare, testo rimanente maiuscolo/grassetto; fix bug bypass: il ri-arm dopo
 *       un'esclusione scattava anche durante pending/arming/triggered (rischio di
 *       silenziare la sirena/disarmare per errore) — ora solo se davvero armato; la
 *       modalità "armed_custom_bypass" non viene più assunta sempre come "away" ma usa
 *       l'ultima modalità scelta; ritardata la chiamata bypass all'armamento per evitare
 *       che la chiamata standard (senza bypass) sovrascriva quella con l'esclusione
 */
(function () {
  'use strict';

  const ID = 'gruppo-allarme';

  /* bypass state persistente tra aperture del popup, per alarmEntity */
  const _bypassedState = {};
  /* ultima modalità di arm scelta dall'utente per ogni alarmEntity — serve per sapere
     quale modalità ri-applicare se si tocca il bypass mentre lo stato è
     "armed_custom_bypass" (quello stato da solo non dice qual era la modalità originale) */
  const _lastArmMode = {};

  /* icona = sempre uno scudo, la forma/colore cambia in base allo stato */
  const ALARM_DEF = {
    disarmed:            { lbl: 'Disarmato',        col: '#4ade80', ico: 'mdi:shield-off-outline', pulse: false },
    armed_away:          { lbl: 'Armato · Fuori',   col: '#ef4444', ico: 'mdi:shield-lock',        pulse: false },
    armed_home:          { lbl: 'Armato · Casa',    col: '#f97316', ico: 'mdi:shield-home',        pulse: false },
    armed_night:         { lbl: 'Armato · Notte',   col: '#a78bfa', ico: 'mdi:shield-moon',        pulse: false },
    armed_vacation:      { lbl: 'Armato · Vacanza', col: '#facc15', ico: 'mdi:shield-airplane',    pulse: false },
    armed_custom_bypass: { lbl: 'Armato · Bypass',  col: '#34d399', ico: 'mdi:shield-half-full',   pulse: false },
    pending:             { lbl: 'In ingresso…',     col: '#facc15', ico: 'mdi:shield-sync-outline',pulse: true  },
    arming:              { lbl: 'Attivazione…',     col: '#facc15', ico: 'mdi:shield-sync-outline',pulse: true  },
    triggered:           { lbl: 'ALLARME',          col: '#f87171', ico: 'mdi:shield-alert',       pulse: true  },
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
    opening:   { off: 'mdi:window-closed',       on: 'mdi:window-open'          },
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

  /* callEx — preferisce window.callSvc (firma nota: domain, svc, entityId, extraData) */
  function callEx(domain, svc, data) {
    if (typeof window.callSvc === 'function') {
      const { entity_id, ...rest } = data;
      window.callSvc(domain, svc, entity_id, rest);
      return;
    }
    const hh = H();
    if (hh?.callService) hh.callService(domain, svc, data);
  }

  function alarmDef(state) {
    return ALARM_DEF[state] || { lbl: state || 'Sconosciuto', col: '#fff', ico: 'mdi:help-circle', pulse: false };
  }
  function isArmed(state) {
    return !!state && state !== 'disarmed' && state !== 'unknown' && state !== 'unavailable';
  }
  function sensorDcIco(h, entityId, isOpen) {
    const dc = attrOf(h, entityId, 'device_class') || 'door';
    return (DC_ICO[dc] || DC_DEFAULT)[isOpen ? 'on' : 'off'];
  }

  /* ────────────────────────────────────────────
     CSS INJECTION — contorno colorato per tutti i .hbadge
     chip.color (--bc) controlla testo E bordo; sfondo trasparente
     ──────────────────────────────────────────── */
  (function injectBadgeStyle() {
    if (document.getElementById('cc-badge-border-fix')) return;
    const s = document.createElement('style');
    s.id = 'cc-badge-border-fix';
    s.textContent = '.hbadge{background:transparent!important;border-color:var(--bc,rgba(255,255,255,.35))!important;border-width:1.5px!important}';
    (document.head || document.documentElement).appendChild(s);
  })();

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

    if (ovl) return;

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
        <div style="font-size:12px;color:#fff;margin-bottom:28px">${eh(alarmName)}</div>
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
     chip.value contiene l'emoji di stato → si aggiorna live
     chip.icon = scudo MDI che cambia forma/colore in base allo stato (vedi ALARM_DEF),
     nessuna label fissa "Allarme:" — solo icona + stato
     ════════════════════════════════════════ */
  function chip(cfg, rawHass) {
    const c     = loadCfg(cfg);
    const h     = liveH(rawHass);
    const ae    = c.alarmEntity;
    const state = ae && h ? stateOf(h, ae) : 'unknown';
    const def   = alarmDef(state);
    const _fcr = window.FratechColorRules;
    const _cond = { triggered: state === 'triggered', armed: !!(state && state.startsWith('armed')), pending: state === 'pending', disarmed: state === 'disarmed' };
    return {
      icon: mdi(def.ico, 15),
      value: def.lbl.toUpperCase(),
      color: (_fcr && _fcr.evalColor(cfg, _cond)) || def.col,
      borderColor: _fcr && _fcr.evalBorderColor(cfg, _cond),
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
      return `<div style="padding:40px 20px;text-align:center;color:#fff;font-size:13px;font-weight:900;text-transform:uppercase;font-family:system-ui,sans-serif">
        Nessuna entità allarme configurata.<br>
        <span style="font-size:11px;">Clicca ✏️ sulla chip per configurare.</span>
      </div>`;
    }

    const ae      = c.alarmEntity;
    const state   = h ? stateOf(h, ae) : 'unknown';
    const def     = alarmDef(state);
    const col     = def.col;
    const armed   = isArmed(state);

    const enabledModes = c.modes || ['armed_away'];
    const visibleModes = ALL_MODES.filter(m => enabledModes.includes(m.key));

    /* sensori */
    const sensors    = Array.isArray(c.sensors) ? c.sensors : [];
    const openActive = sensors.filter(s => {
      const ss = h ? stateOf(h, s.entity) : 'unknown';
      return ss === 'on' && !bypassed.has(s.entity);
    }).length;
    const bypassedCount = bypassed.size;

    const secLbl = 'font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:8px';

    const sensorRows = sensors.map((s, i) => {
      if (!s.entity) return '';
      const ss          = h ? stateOf(h, s.entity) : 'unknown';
      const open        = ss === 'on';
      const isBypassed  = bypassed.has(s.entity);
      const sIco        = sensorDcIco(h, s.entity, open);
      const sLbl        = s.label || nameOf(h, s.entity);

      let rowBg = 'rgba(255,255,255,.04)', rowBdr = 'rgba(255,255,255,.08)', tag = '', bypassBtn = '';
      let sIcoCol = '#4ade80';

      if (isBypassed) {
        rowBg  = 'rgba(250,204,21,.07)';
        rowBdr = 'rgba(250,204,21,.24)';
        sIcoCol = '#facc15';
        tag    = `<span style="font-size:10px;padding:3px 10px;border-radius:6px;background:rgba(250,204,21,.2);color:#facc15;font-weight:900;text-transform:uppercase;flex-shrink:0">ESCLUSO</span>`;
      } else if (open) {
        rowBg  = 'rgba(248,113,113,.09)';
        rowBdr = 'rgba(248,113,113,.28)';
        sIcoCol = '#f87171';
        tag    = `<span style="font-size:10px;padding:3px 10px;border-radius:6px;background:rgba(248,113,113,.2);color:#f87171;font-weight:900;text-transform:uppercase;flex-shrink:0">APERTO</span>`;
      } else {
        tag = `<span style="font-size:10px;padding:3px 10px;border-radius:6px;background:rgba(74,222,128,.15);color:#4ade80;font-weight:900;text-transform:uppercase;flex-shrink:0">OK</span>`;
      }

      bypassBtn = isBypassed
        ? `<button data-ca-bypass="${i}" data-entity="${eh(s.entity)}" style="padding:5px 12px;border-radius:8px;border:1px solid rgba(250,204,21,.42);background:rgba(250,204,21,.14);color:#facc15;cursor:pointer;font-size:10px;font-weight:900;text-transform:uppercase;white-space:nowrap;outline:none;flex-shrink:0">✕ Includi</button>`
        : `<button data-ca-bypass="${i}" data-entity="${eh(s.entity)}" style="padding:5px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:10px;font-weight:900;text-transform:uppercase;white-space:nowrap;outline:none;flex-shrink:0">🛡 Escludi</button>`;

      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;background:${rowBg};border:1px solid ${rowBdr}">
        <span style="width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${hex2rgba(sIcoCol,.16)};border:1px solid ${hex2rgba(sIcoCol,.4)};color:${sIcoCol}">${mdi(sIco, 16)}</span>
        <span style="flex:1;font-size:13px;font-weight:900;text-transform:uppercase;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(sLbl)}</span>
        ${tag}
        ${bypassBtn}
      </div>`;
    }).join('');

    /* bottoni modalità */
    const modeBtns = visibleModes.map(m => {
      const isCur = state === m.key;
      const mCol  = ALARM_DEF[m.key]?.col || '#f97316';
      return `<button data-ca-arm="${m.svc}" style="flex:1;padding:13px 4px;border-radius:13px;border:1px solid ${isCur ? hex2rgba(mCol,.5) : 'rgba(255,255,255,.12)'};background:${isCur ? hex2rgba(mCol,.2) : 'rgba(255,255,255,.06)'};color:${isCur ? mCol : '#fff'};cursor:pointer;font-size:11px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:5px;outline:none;min-width:0;transition:background .15s${isCur ? `;box-shadow:0 0 14px ${hex2rgba(mCol,.3)}` : ''}">
        <span style="color:inherit">${mdi(m.ico, 24)}</span>
        <span style="white-space:nowrap;color:inherit;text-transform:uppercase;font-weight:900">${eh(m.lbl)}</span>
      </button>`;
    }).join('');

    const disarmBtn = `<button data-ca-disarm style="flex:1;padding:13px 4px;border-radius:13px;border:1px solid ${state==='disarmed'?'rgba(74,222,128,.5)':'rgba(255,255,255,.12)'};background:${state==='disarmed'?'rgba(74,222,128,.18)':'rgba(255,255,255,.06)'};color:${state==='disarmed'?'#4ade80':'#fff'};cursor:pointer;font-size:11px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:5px;outline:none;min-width:0${state==='disarmed'?';box-shadow:0 0 14px rgba(74,222,128,.3)':''}">
      <span style="color:inherit">${mdi('mdi:lock-open-variant', 24)}</span>
      <span style="white-space:nowrap;color:inherit;text-transform:uppercase;font-weight:900">Disarma</span>
    </button>`;

    /* warning sensori aperti */
    const openWarn = (openActive > 0 && !armed) ? `<div style="display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:11px;background:rgba(250,204,21,.08);border:1px solid rgba(250,204,21,.26);margin-bottom:12px">
      <span style="font-size:18px;flex-shrink:0">⚠️</span>
      <div style="flex:1">
        <div style="font-size:12px;color:#facc15;font-weight:900;text-transform:uppercase">${openActive} sensore${openActive > 1 ? 'i aperti' : ' aperto'}</div>
        <div style="font-size:10px;color:#fff;margin-top:1px;font-weight:900;text-transform:uppercase">Escludi i sensori che vuoi ignorare, poi premi un tasto di attivazione</div>
      </div>
    </div>` : '';

    /* sirena */
    let sirenRow = '';
    if (c.siren) {
      const ss      = h ? stateOf(h, c.siren) : 'unknown';
      const sirenOn = ss === 'on';
      const sName   = nameOf(h, c.siren);
      sirenRow = `<div style="margin-top:14px">
        <div style="${secLbl}">Sirena</div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:11px;background:${sirenOn ? 'rgba(248,113,113,.09)' : 'rgba(74,222,128,.06)'};border:1px solid ${sirenOn ? 'rgba(248,113,113,.28)' : 'rgba(74,222,128,.18)'}">
          <span style="color:${sirenOn ? '#f87171' : '#4ade80'}">${mdi('mdi:bullhorn', 20)}</span>
          <span style="flex:1;font-size:13px;font-weight:900;text-transform:uppercase;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${eh(sName)}</span>
          <span style="font-size:10px;padding:3px 10px;border-radius:6px;background:${sirenOn ? 'rgba(248,113,113,.2)' : 'rgba(74,222,128,.15)'};color:${sirenOn ? '#f87171' : '#4ade80'};font-weight:700;flex-shrink:0">${sirenOn ? 'ATTIVA' : 'SPENTA'}</span>
          ${sirenOn ? `<button data-ca-siren-off style="padding:5px 12px;border-radius:8px;border:1px solid rgba(248,113,113,.38);background:rgba(248,113,113,.12);color:#f87171;cursor:pointer;font-size:10px;font-weight:900;text-transform:uppercase;outline:none;flex-shrink:0">Spegni</button>` : ''}
        </div>
      </div>`;
    }

    return `<div style="padding:14px 14px 0;font-family:system-ui,sans-serif">
      <style>
        @keyframes ccAlmPulse { from{opacity:.7} to{opacity:1} }
        .cc-alm-pulse { animation: ccAlmPulse .85s ease-in-out infinite alternate }
      </style>

      <div class="${def.pulse ? 'cc-alm-pulse' : ''}" style="position:relative;overflow:hidden;display:flex;align-items:center;gap:14px;padding:16px;border-radius:18px;background:linear-gradient(155deg,${hex2rgba(col,.16)},${hex2rgba(col,.04)});border:1px solid ${hex2rgba(col,.32)};margin-bottom:14px">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 18% 15%,${hex2rgba(col,.22)},transparent 62%);pointer-events:none"></div>
        <div style="position:relative;width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${hex2rgba(col,.18)};border:1.5px solid ${hex2rgba(col,.45)};box-shadow:0 0 18px ${hex2rgba(col,.35)}">
          <span style="font-size:28px;color:${col}">${mdi(def.ico, 28)}</span>
        </div>
        <div style="position:relative;flex:1;min-width:0">
          <div style="font-size:20px;font-weight:900;color:${col};letter-spacing:.3px;text-transform:uppercase">${def.lbl}</div>
          ${bypassedCount > 0 && armed ? `<div style="font-size:11px;font-weight:900;text-transform:uppercase;color:#facc15;margin-top:3px">🛡 ${bypassedCount} sensore${bypassedCount>1?'i esclusi':' escluso'}</div>` : ''}
        </div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:14px">
        ${modeBtns}
        ${disarmBtn}
      </div>

      ${openWarn}

      ${sensors.length ? `<div style="${secLbl}">Sensori (${sensors.length})</div><div style="display:flex;flex-direction:column;gap:5px">${sensorRows}</div>` : ''}

      ${sirenRow}
      <div style="height:14px"></div>
    </div>`;
  }

  /* ════════════════════════════════════════
     HANDLERS
     ════════════════════════════════════════ */
  function _mountHandlers(cfg, el) {
    const c  = loadCfg(cfg);
    const ae = c.alarmEntity;
    if (el._caHandler) el.removeEventListener('click', el._caHandler);

    function handler(ev) {
      /* bypass toggle */
      const bypassBtn = ev.target.closest('[data-ca-bypass]');
      if (bypassBtn) {
        const entityId = bypassBtn.dataset.entity;
        if (!el._bypassed) el._bypassed = _bypassedState[ae] || (_bypassedState[ae] = new Set());
        if (el._bypassed.has(entityId)) el._bypassed.delete(entityId);
        else el._bypassed.add(entityId);
        /* se l'allarme è REALMENTE armato, aggiorna subito il bypass in Alarmo.
           IMPORTANTE: usare curState.startsWith('armed'), non isArmed() — isArmed()
           include anche 'pending'/'arming'/'triggered', e forzare qui un ri-arm mentre
           l'allarme sta scattando (sirena in corso) o sta contando alla rovescia lo
           disarmerebbe/cambierebbe modalità nel momento sbagliato. */
        const hNow = H();
        if (hNow && ae) {
          const curState = stateOf(hNow, ae);
          if (curState.startsWith('armed')) {
            const stateToMode = { armed_away:'away', armed_home:'home', armed_night:'night', armed_vacation:'vacation' };
            // armed_custom_bypass non dice da solo la modalità originale: usa l'ultima
            // modalità scelta dall'utente invece di assumere sempre 'away'
            const mode = stateToMode[curState] || _lastArmMode[ae] || 'away';
            const code = c.code ? String(c.code) : undefined;
            const p = { entity_id: ae, mode, force: true, bypassed_sensors: [...el._bypassed] };
            if (code) p.code = code;
            callEx('alarmo', 'arm', p);
          }
        }
        el.innerHTML = render(cfg, null, el._bypassed);
        _mountHandlers(cfg, el);
        ev.stopPropagation(); return;
      }

      /* arm */
      const armBtn = ev.target.closest('[data-ca-arm]');
      if (armBtn) {
        const svc    = armBtn.dataset.caArm;
        const code   = c.code ? String(c.code) : undefined;
        const bypSet = el._bypassed instanceof Set ? el._bypassed : new Set();
        const modeMap = { alarm_arm_away:'away', alarm_arm_home:'home', alarm_arm_night:'night', alarm_arm_vacation:'vacation' };
        const mode = modeMap[svc] || 'away';
        if (ae) _lastArmMode[ae] = mode;   // ricorda la modalità per un eventuale bypass successivo

        /* chiama SEMPRE il servizio standard HA — funziona nei casi normali */
        const stdPayload = { entity_id: ae };
        if (code) stdPayload.code = code;
        callEx('alarm_control_panel', svc, stdPayload);

        /* se ci sono sensori esclusi, chiama ANCHE alarmo.arm con force:true +
           bypassed_sensors → i sensori esclusi non triggerano mentre è armato.
           Ritardata leggermente rispetto alla chiamata standard qui sopra: le due
           chiamate sulla stessa entità in parallelo possono sovrapporsi ed è la
           standard (senza bypass) a "vincere", annullando di fatto l'esclusione. */
        if (bypSet.size > 0) {
          const alarmoPayload = { entity_id: ae, mode, force: true, bypassed_sensors: [...bypSet] };
          if (code) alarmoPayload.code = code;
          setTimeout(() => callEx('alarmo', 'arm', alarmoPayload), 700);
        }
        ev.stopPropagation(); return;
      }

      /* disarm */
      const disarmBtn = ev.target.closest('[data-ca-disarm]');
      if (disarmBtn) {
        const code    = c.code ? String(c.code) : undefined;
        const payload = { entity_id: ae };
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
    const c  = loadCfg(cfg);
    const ae = c.alarmEntity;

    /* collega el._bypassed al bypassedState globale (stessa reference Set) */
    if (ae) {
      if (!_bypassedState[ae]) _bypassedState[ae] = new Set();
      el._bypassed = _bypassedState[ae];
    } else {
      el._bypassed = new Set();
    }

    _mountHandlers(cfg, el);

    const h0 = liveH(rawHass);
    if (h0) _updateOverlay(cfg, h0);

    if (el._caPoll) return;
    el._prevAlarmState = ae ? stateOf(liveH(rawHass), ae) : 'unknown';
    el._caPoll = setInterval(() => {
      if (!el.isConnected) { clearInterval(el._caPoll); delete el._caPoll; return; }
      try {
        const h = H(); if (!h) return;
        _updateOverlay(cfg, h);
        /* azzera bypass SOLO al passaggio armato → disarmato (non mentre è già disarmato) */
        if (ae) {
          const cur = stateOf(h, ae);
          if (isArmed(el._prevAlarmState) && cur === 'disarmed' && el._bypassed?.size > 0) {
            el._bypassed.clear();
          }
          el._prevAlarmState = cur;
        }
        const _sp=el.parentElement, _st=_sp?_sp.scrollTop:0;
        el.innerHTML = render(cfg, h, el._bypassed);
        _mountHandlers(cfg, el);
        if(_sp&&_st>0) _sp.scrollTop=_st;
      } catch (e) {}
    }, 1500);
  }

  function update(cfg, rawHass, el) {
    try {
      const c  = loadCfg(cfg);
      const ae = c.alarmEntity;
      /* garantisce che el._bypassed sia sempre la reference globale */
      if (ae && (!el._bypassed || el._bypassed !== _bypassedState[ae])) {
        if (!_bypassedState[ae]) _bypassedState[ae] = new Set();
        el._bypassed = _bypassedState[ae];
      }
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
    let colorCfg = { mode: c.colorMode||'fixed', fixed: c.colorFixed||'#4ade80', rules: Array.isArray(c.colorRules)?JSON.parse(JSON.stringify(c.colorRules)):[], borderMode: c.borderMode||'none', borderFixed: c.borderFixed||'#ffffff', borderRules: Array.isArray(c.borderRules)?JSON.parse(JSON.stringify(c.borderRules)):[] };
    const presets = [
      { key: 'triggered', label: 'Allarme scattato' },
      { key: 'armed',     label: 'Allarme armato' },
      { key: 'pending',   label: 'Conto alla rovescia (pending)' },
      { key: 'disarmed',  label: 'Disarmato' },
      { key: 'fallback',  label: 'Sempre (fallback)' },
    ];
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
      _acDrop.style.cssText = `position:fixed;left:${rect.left}px;${pos};width:${rect.width}px;max-height:${MAXH}px;overflow-y:auto;z-index:100003;background:#1a1630;border:1px solid rgba(249,115,22,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.88);scrollbar-width:thin;scrollbar-color:#fff transparent`;
      matches.slice(0, 12).forEach(m => {
        const r = document.createElement('div');
        r.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .1s';
        r.innerHTML = `<div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(m.name)}</div><div style="font-size:9px;color:#fff;margin-top:1px">${eh(m.id)}</div>`;
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
      const secL = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#fff;margin-bottom:6px';

      const modeChecks = ALL_MODES.map(m => {
        const checked = modes.has(m.key);
        const mCol    = ALARM_DEF[m.key]?.col || '#f97316';
        return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 8px;border-radius:8px;border:1px solid ${checked ? hex2rgba(mCol,.3) : 'rgba(255,255,255,.07)'};background:${checked ? hex2rgba(mCol,.07) : 'rgba(255,255,255,.03)'};transition:background .15s">
          <input type="checkbox" data-ca-mode="${m.key}" ${checked ? 'checked' : ''} style="width:15px;height:15px;accent-color:${mCol};cursor:pointer;flex-shrink:0">
          <span style="font-size:13px;flex-shrink:0">${mdi(m.ico, 13)}</span>
          <span style="font-size:12px;font-weight:600;color:${checked ? mCol : '#fff'}">${eh(m.lbl)}</span>
        </label>`;
      }).join('');

      const sensorRows = sensors.map((s, i) => {
        const dc  = attrOf(h, s.entity, 'device_class') || 'door';
        const icoK = (DC_ICO[dc] || DC_DEFAULT).off;
        return `<div style="display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)">
          <span style="font-size:14px;flex-shrink:0;color:#fff">${mdi(icoK, 14)}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(s.label || nameOf(h, s.entity))}</div>
            <div style="font-size:9px;color:#fff">${eh(s.entity)}</div>
          </div>
          <button data-ca-delsensor="${i}" style="width:22px;height:22px;border:none;border-radius:5px;background:rgba(248,113,113,.15);color:#f87171;cursor:pointer;font-size:11px;flex-shrink:0">✕</button>
        </div>`;
      }).join('');

      const anim = _first ? 'animation:cacfgUp .22s cubic-bezier(.32,1.12,.56,1)' : '';

      ov.innerHTML = `<div style="width:100%;max-height:92vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(255,255,255,.12);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.9);color:#fff;${anim}">
        <style>@keyframes cacfgUp{from{transform:translateY(100%)}to{transform:translateY(0)}} #cacfg-body::-webkit-scrollbar{display:none}</style>

        <div style="display:flex;align-items:center;gap:10px;padding:14px 18px 12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(249,115,22,.13);border:1px solid rgba(249,115,22,.28);display:flex;align-items:center;justify-content:center;font-size:18px">🔒</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800">Configura — Gruppo Allarme</div>
            <div style="font-size:10px;color:#fff">${sensors.length} sensori · ${[...modes].length} modalità</div>
          </div>
          <button id="cacfg-close" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:14px">✕</button>
        </div>

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

          ${window.FratechColorRules ? window.FratechColorRules.html(colorCfg, presets) : ''}
          <div style="height:10px"></div>
        </div>

        <div style="display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0">
          <button id="cacfg-save" style="flex:1;padding:11px;border-radius:11px;border:none;background:#38bdf8;color:#fff;font-weight:800;cursor:pointer;font-size:13px">💾 Salva</button>
          <button id="cacfg-cancel" style="flex:0 0 80px;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:#fff;cursor:pointer;font-size:13px">Annulla</button>
        </div>
      </div>`;

      _first = false;
      const _fcr = window.FratechColorRules;
      if (_fcr) _fcr.attach(ov.querySelector('#fcr-section'), presets, () => { colorCfg = _fcr.read(ov.querySelector('#fcr-section')) || colorCfg; });
      if (prevScroll) { const b = ov.querySelector('#cacfg-body'); if (b) b.scrollTop = prevScroll; }
      if (curAlarm !== undefined) { const f = ov.querySelector('#cacfg-alarm'); if (f) f.value = curAlarm; }
      if (curCode  !== undefined) { const f = ov.querySelector('#cacfg-code');  if (f) f.value = curCode; }
      if (curSiren !== undefined) { const f = ov.querySelector('#cacfg-siren'); if (f) f.value = curSiren; }
      if (curLabel !== undefined) { const f = ov.querySelector('#cacfg-label'); if (f) f.value = curLabel; }

      ov.querySelectorAll('[data-ca-mode]').forEach(cb => {
        cb.addEventListener('change', () => {
          const k = cb.dataset.caMode;
          if (cb.checked) modes.add(k); else modes.delete(k);
          attach();
        });
      });

      ov.querySelectorAll('[data-ca-delsensor]').forEach(btn => {
        btn.addEventListener('click', () => { sensors.splice(parseInt(btn.dataset.caDelsensor), 1); attach(); });
      });

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

      if (ov._ovClick) ov.removeEventListener('click', ov._ovClick);
      ov._ovClick = ev => { if (ev.target === ov) closeOv(); };
      ov.addEventListener('click', ov._ovClick);

      ov.querySelector('#cacfg-close').onclick  = closeOv;
      ov.querySelector('#cacfg-cancel').onclick = closeOv;

      ov.querySelector('#cacfg-save').addEventListener('click', () => {
        const _fcrData = _fcr ? (_fcr.read(ov.querySelector('#fcr-section')) || {}) : {};
        const newCfg = {
          ..._fcrData,
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
    version: '2.8', isDistintivo: true,
    defaultCfg: { label: 'Allarme', alarmEntity: '', code: '', modes: ['armed_away'], sensors: [], siren: '', colorMode: 'auto', colorRules: [] },
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
  try { console.log('[FratechStore] Distintivo registrato: gruppo-allarme v2.8'); } catch (e) {}
})();
