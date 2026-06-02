/**
 * posta-card-fratech.js v6.0.0
 * Centro Controllo Posta — DomHouse pkg v1.4
 * Architettura identica ad antizanzare-card (che funziona)
 */

/* ── Entity IDs ── */
const EP = {
  binary:      'binary_sensor.posta',
  sensore:     'sensor.sensore_posta',
  counter:     'counter.conta_posta',
  notifyPush:  'input_boolean.notify_push_posta',
  notifyAlexa: 'input_boolean.notify_alexa_posta',
  notifyGoogle:'input_boolean.notify_google_posta',
  orarioInizio:'input_datetime.orario_inizio_notifiche_posta',
  orarioFine:  'input_datetime.orario_fine_notifiche_posta',
}

/* ── SVG Icons ── */
const PI = {
  gear: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  chart: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  mail: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  bell: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  chevron: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
}

/* ── CSS ── */
const CSS = `
:host { display:block; }
* { box-sizing:border-box; margin:0; padding:0; }
button, input, label { font-family:inherit; }

.card {
  background:var(--ha-card-background,#111827);
  border-radius:var(--ha-card-border-radius,16px);
  border:1px solid rgba(250,204,21,.18);
  overflow:hidden;
  font-family:var(--primary-font-family,system-ui,sans-serif);
  box-shadow:0 8px 40px rgba(0,0,0,.35);
  transition:border-color .3s,box-shadow .3s;
}
.card.has-mail {
  border-color:rgba(239,68,68,.4);
  box-shadow:0 8px 40px rgba(239,68,68,.15);
}

/* Header */
.hdr { display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid rgba(255,255,255,.06); }
.hdr-icon {
  width:40px;height:40px;border-radius:11px;flex-shrink:0;
  background:rgba(250,204,21,.1);border:1px solid rgba(250,204,21,.25);
  display:flex;align-items:center;justify-content:center;color:#facc15;
  transition:all .3s;
}
.hdr-icon.mail { background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);color:#ef4444; }
.hdr-text { flex:1;min-width:0; }
.hdr-title { font-size:15px;font-weight:700;color:var(--primary-text-color,#f1f5f9); }
.hdr-sub   { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);margin-top:2px; }
.hdr-right { display:flex;align-items:center;gap:7px;flex-shrink:0; }
.icon-btn { width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--secondary-text-color,#64748b);transition:background .15s; }
.icon-btn:hover { background:rgba(255,255,255,.1); }
.badge { display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.05em;border:1px solid currentColor;white-space:nowrap; }
.dot { width:6px;height:6px;border-radius:50%;background:currentColor; }
.dot.pulse { animation:blink 1.4s infinite; }
@keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.4)} }

/* Main stats */
.main-stats { display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,.06); }
.mstat { background:var(--ha-card-background,#111827);padding:14px 12px 12px;display:flex;flex-direction:column;gap:3px; }
.mstat-lbl { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b); }
.mstat-val { font-size:44px;font-weight:900;line-height:1;letter-spacing:-2px; }
.mstat-sub { font-size:10px;color:var(--secondary-text-color,#64748b);display:flex;align-items:center;gap:4px;margin-top:2px; }

/* Info row */
.info-row { display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,.06); }
.info-panel { background:var(--ha-card-background,#111827);padding:10px 12px; }
.info-lbl { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);margin-bottom:4px; }
.info-val { font-size:13px;font-weight:700;color:var(--primary-text-color,#f1f5f9);line-height:1.3; }
.info-sub { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:2px; }

/* Ritira button */
.ritira-wrap { padding:10px 14px;border-top:1px solid rgba(255,255,255,.06); }
.btn-ritira {
  width:100%;height:38px;border-radius:11px;border:none;cursor:pointer;
  font-size:12px;font-weight:700;letter-spacing:.03em;
  display:flex;align-items:center;justify-content:center;gap:6px;
  transition:opacity .15s;
}
.btn-ritira.active {
  background:linear-gradient(135deg,rgba(239,68,68,.8),rgba(239,68,68,.6));
  color:#fff;
}
.btn-ritira.active:hover { opacity:.85; }
.btn-ritira.idle { background:rgba(255,255,255,.05);color:var(--secondary-text-color,#64748b);cursor:default; }

/* Settings panel */
.settings { display:none;border-top:1px solid rgba(255,255,255,.06); }
.settings.open { display:block; }
.set-row { display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.04); }
.set-row:last-child { border-bottom:none; }
.set-lbl { font-size:12px;font-weight:600;color:var(--primary-text-color,#f1f5f9); }
.set-sub { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:1px; }
.set-val { font-size:13px;font-weight:700;color:#facc15;min-width:36px;text-align:right; }
.toggle { width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0; }
.toggle.on  { background:#facc15; }
.toggle.off { background:rgba(255,255,255,.15); }
.toggle::after { content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s; }
.toggle.on::after  { left:21px; }
.toggle.off::after { left:3px; }
.num-ctrl { display:flex;align-items:center;gap:4px; }
.adj-sm { width:26px;height:26px;border-radius:7px;border:none;background:rgba(255,255,255,.08);color:var(--primary-text-color,#f1f5f9);font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s; }
.adj-sm:hover { background:rgba(255,255,255,.15); }
.time-input { height:28px;padding:0 8px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--primary-text-color,#f1f5f9);font-size:12px;font-weight:600;font-family:inherit; }
.time-input:focus { outline:none;border-color:rgba(250,204,21,.5); }

/* Settings CFG section */
.set-section { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--secondary-text-color,#64748b);padding:8px 14px 4px;border-bottom:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02); }
.set-inp { height:28px;padding:0 8px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--primary-text-color,#f1f5f9);font-size:11px;font-family:monospace;width:160px;text-align:right; }
.set-inp:focus { outline:none;border-color:rgba(250,204,21,.5); }
.set-save { margin:8px 14px 12px;padding:8px;width:calc(100% - 28px);border-radius:9px;border:1px solid rgba(250,204,21,.3);background:rgba(250,204,21,.08);color:#facc15;font-size:11px;font-weight:700;cursor:pointer;transition:background .15s; }
.set-save:hover { background:rgba(250,204,21,.18); }

/* Stats popup */
.popup-overlay { display:none;position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9999;align-items:center;justify-content:center;padding:20px; }
.popup-overlay.open { display:flex; }
.popup-box { background:#1a2234;border-radius:16px;width:100%;max-width:400px;max-height:calc(100vh - 40px);overflow-y:auto;box-shadow:0 8px 60px rgba(0,0,0,.8); }
.pp-hdr { display:flex;align-items:center;gap:10px;padding:16px 16px 12px;border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;background:#1a2234;z-index:1; }
.pp-ico { width:36px;height:36px;border-radius:10px;background:rgba(250,204,21,.1);border:1px solid rgba(250,204,21,.25);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0; }
.pp-title { font-size:14px;font-weight:700;color:var(--primary-text-color,#f1f5f9); }
.pp-sub { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:1px; }
.pp-close { width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.07);color:#94a3b8;cursor:pointer;font-size:18px;margin-left:auto;display:flex;align-items:center;justify-content:center; }
.pp-close:hover { background:rgba(255,255,255,.12); }
.sg-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.07);margin-bottom:1px; }
.sg { background:#1a2234;padding:14px 8px;text-align:center; }
.sg-lbl { font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--secondary-text-color,#64748b);margin-bottom:5px; }
.sg-val { font-size:26px;font-weight:900;letter-spacing:-1px;line-height:1; }
.chart-wrap { padding:14px; }
.chart-lbl { font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);margin-bottom:10px; }
.bars { display:flex;align-items:flex-end;gap:5px;height:60px;margin-bottom:6px; }
.bcol { flex:1;display:flex;flex-direction:column;align-items:center;gap:3px; }
.bval { font-size:9px;font-weight:700;color:var(--primary-text-color,#f1f5f9); }
.btrack { flex:1;width:100%;border-radius:3px;background:rgba(255,255,255,.06);position:relative;overflow:hidden;min-height:3px; }
.bfill { position:absolute;bottom:0;left:0;right:0;border-radius:3px;background:rgba(250,204,21,.4);transition:height .5s; }
.blbl { font-size:8px;color:var(--secondary-text-color,#64748b); }
.rst-lbl { font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);padding:0 14px 6px; }
.rst-grid { display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 14px 16px; }
.rst { padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:rgba(255,255,255,.5);font-size:10px;font-weight:700;cursor:pointer;transition:all .15s; }
.rst:hover { background:rgba(255,255,255,.08);color:#fff; }
.rst.dng { border-color:rgba(239,68,68,.25);color:rgba(239,68,68,.6); }
.rst.dng:hover { background:rgba(239,68,68,.1);color:#f87171; }
`

/* ── Helper: formato ora da stato input_datetime ── */
function fmtDT(raw) {
  if (!raw || raw === 'unknown' || raw === 'unavailable') return '—'
  // può essere '08:00:00' o ISO
  const t = raw.slice(0, 5)
  return t || '—'
}

/* ── Classe principale ── */
class PostaCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._hass        = null
    this._config      = {}
    this._settingsOpen = false
    this._buildKey    = null
    this._onClick     = this._handleClick.bind(this)
    this._onChange    = this._handleChange.bind(this)
  }

  static getStubConfig() { return {} }
  setConfig(c) { this._config = c || {} }
  getCardSize() { return 5 }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', this._onClick)
    this.shadowRoot.addEventListener('change', this._onChange)
  }
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._onClick)
    this.shadowRoot.removeEventListener('change', this._onChange)
  }

  set hass(h) {
    this._hass = h
    const bk = this._bk()
    if (bk !== this._buildKey) {
      this._buildKey = bk
      this._buildDOM()
    } else {
      this._patch()
    }
  }

  _g(id, fb) {
    const s = this._hass?.states?.[id]
    return s ? s.state : (fb !== undefined ? fb : '—')
  }

  _svc(domain, svc, data) {
    if (this._hass?.callService) this._hass.callService(domain, svc, data)
  }

  _bk() {
    return [
      this._g(EP.binary,'off'),
      this._g(EP.sensore,''),
      this._g(EP.counter,'0'),
      this._g(EP.notifyPush,'off'),
      this._g(EP.notifyAlexa,'off'),
      this._g(EP.notifyGoogle,'off'),
      this._g(EP.orarioInizio,''),
      this._g(EP.orarioFine,''),
      this._settingsOpen ? '1' : '0',
    ].join('|')
  }

  _handleChange(e) {
    const inp = e.target.closest('[data-time-entity]')
    if (!inp || !this._hass) return
    if (!inp.value) return
    this._svc('input_datetime', 'set_datetime', {
      entity_id: inp.dataset.timeEntity,
      time: inp.value + ':00',
    })
  }

  _handleClick(e) {
    const btn = e.target.closest('[data-action]')
    if (!btn || !this._hass) return
    const { action } = btn.dataset

    switch (action) {
      case 'toggleSettings':
        this._settingsOpen = !this._settingsOpen
        this._buildKey = null; this._buildDOM(); break

      case 'ritira':
        this._svc('script', 'turn_on', { entity_id: 'script.reset_posta' }); break

      case 'togglePush':
        this._svc('input_boolean', 'toggle', { entity_id: EP.notifyPush }); break
      case 'toggleAlexa':
        this._svc('input_boolean', 'toggle', { entity_id: EP.notifyAlexa }); break
      case 'toggleGoogle':
        this._svc('input_boolean', 'toggle', { entity_id: EP.notifyGoogle }); break

      case 'resetCounter':
        this._svc('script', 'turn_on', { entity_id: 'script.reset_posta' }); break

      case 'saveCfg': {
        const sensorInp = this.shadowRoot.querySelector('[data-cfg="sensor"]')
        if (sensorInp && sensorInp.value.trim()) {
          // Nota: il sensore è hardcoded nel yaml, qui salviamo solo il riferimento locale
          // Per ora mostriamo solo un toast
        }
        break
      }
    }
  }

  _buildDOM() {
    if (!this._hass) return

    const hasMail   = this._g(EP.binary, 'off') === 'on'
    const stato     = this._g(EP.sensore, 'Chiusa').trim()
    const count     = parseInt(this._g(EP.counter, '0')) || 0
    const pushOn    = this._g(EP.notifyPush,  'off') === 'on'
    const alexaOn   = this._g(EP.notifyAlexa, 'off') === 'on'
    const googleOn  = this._g(EP.notifyGoogle,'off') === 'on'
    const tInizio   = fmtDT(this._g(EP.orarioInizio, '08:00:00'))
    const tFine     = fmtDT(this._g(EP.orarioFine,   '21:00:00'))

    const cardClass = hasMail ? 'has-mail' : ''
    const iconClass = hasMail ? 'mail' : ''
    const badgeColor = hasMail ? '#ef4444' : '#64748b'
    const badgeLabel = hasMail ? 'IN CASSETTA' : 'VUOTA'
    const countColor = hasMail ? '#ef4444' : 'var(--secondary-text-color,#64748b)'

    /* Settings panel */
    const settingsHTML = this._settingsOpen ? `
      <div class="settings open">
        <div class="set-section">Notifiche</div>

        <div class="set-row">
          <div>
            <div class="set-lbl">📱 Notifica Push</div>
            <div class="set-sub">Invio su app mobile</div>
          </div>
          <button class="toggle ${pushOn ? 'on' : 'off'}" data-action="togglePush"></button>
        </div>

        <div class="set-row">
          <div>
            <div class="set-lbl">🔊 Annuncio Alexa</div>
            <div class="set-sub">Voce su Alexa cameretta</div>
          </div>
          <button class="toggle ${alexaOn ? 'on' : 'off'}" data-action="toggleAlexa"></button>
        </div>

        <div class="set-row">
          <div>
            <div class="set-lbl">🔵 Annuncio Google</div>
            <div class="set-sub">TTS su Google Home</div>
          </div>
          <button class="toggle ${googleOn ? 'on' : 'off'}" data-action="toggleGoogle"></button>
        </div>

        <div class="set-section">Orari notifiche</div>

        <div class="set-row">
          <div>
            <div class="set-lbl">Inizio notifiche</div>
            <div class="set-sub">Nessuna notifica prima di questo orario</div>
          </div>
          <input class="time-input" type="time" value="${tInizio}" data-time-entity="${EP.orarioInizio}">
        </div>

        <div class="set-row">
          <div>
            <div class="set-lbl">Fine notifiche</div>
            <div class="set-sub">Nessuna notifica dopo questo orario</div>
          </div>
          <input class="time-input" type="time" value="${tFine}" data-time-entity="${EP.orarioFine}">
        </div>

        <div class="set-section">Azioni</div>

        <div class="set-row">
          <div>
            <div class="set-lbl">Reset contatore</div>
            <div class="set-sub">Azzera il conteggio posta di oggi</div>
          </div>
          <button class="toggle off" style="width:auto;padding:0 10px;border-radius:8px;font-size:10px;font-weight:700;color:#facc15;background:rgba(250,204,21,.1);border:1px solid rgba(250,204,21,.25)" data-action="resetCounter">Reset</button>
        </div>

      </div>` : `<div class="settings"></div>`

    const popupHTML = ''

    this.shadowRoot.innerHTML = `<style>${CSS}</style>
<div class="card ${cardClass}">

  <div class="hdr">
    <div class="hdr-icon ${iconClass}">${PI.mail}</div>
    <div class="hdr-text">
      <div class="hdr-title">Cassetta della Posta</div>
      <div class="hdr-sub">Centro Controllo Posta</div>
    </div>
    <div class="hdr-right">
      <button class="icon-btn" data-action="toggleSettings" title="Impostazioni">${PI.gear}</button>
      <div class="badge" style="color:${badgeColor}">
        <span class="dot ${hasMail ? 'pulse' : ''}"></span>
        ${badgeLabel}
      </div>
    </div>
  </div>

  <div class="main-stats">
    <div class="mstat">
      <div class="mstat-lbl">Posta ricevuta oggi</div>
      <div class="mstat-val" style="color:${countColor}" data-field="count">${count}</div>
      <div class="mstat-sub">consegne</div>
    </div>
    <div class="mstat">
      <div class="mstat-lbl">Stato cassetta</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
        <div style="width:12px;height:12px;border-radius:50%;background:${hasMail ? '#ef4444' : '#64748b'};box-shadow:${hasMail ? '0 0 8px rgba(239,68,68,.6)' : 'none'};flex-shrink:0;${hasMail ? 'animation:blink 1.4s infinite' : ''}"></div>
        <div style="font-size:18px;font-weight:800;color:${hasMail ? '#ef4444' : 'var(--secondary-text-color,#64748b)'}" data-field="stato">${stato}</div>
      </div>

    </div>
  </div>

  <div class="info-row">
    <div class="info-panel">
      <div class="info-lbl">⏰ Inizio notifiche</div>
      <div class="info-val" data-field="tInizio">${tInizio}</div>
    </div>
    <div class="info-panel">
      <div class="info-lbl">🔕 Fine notifiche</div>
      <div class="info-val" data-field="tFine">${tFine}</div>
    </div>
  </div>

  <div class="ritira-wrap">
    ${hasMail
      ? `<button class="btn-ritira active" data-action="ritira">✓ Segna come ritirata — Reset contatore</button>`
      : `<button class="btn-ritira idle" disabled>Nessuna posta da ritirare</button>`
    }
  </div>

  ${settingsHTML}
  ${popupHTML}

</div>`
  }

  _patch() {
    const f = (sel, txt) => {
      const el = this.shadowRoot.querySelector(`[data-field="${sel}"]`)
      if (el) el.textContent = txt
    }
    f('count', parseInt(this._g(EP.counter, '0')) || 0)
    f('stato', this._g(EP.sensore, 'Chiusa').trim())
    f('tInizio', fmtDT(this._g(EP.orarioInizio, '08:00:00')))
    f('tFine',   fmtDT(this._g(EP.orarioFine,   '21:00:00')))
  }
}

if (!customElements.get('posta-card')) {
  customElements.define('posta-card', PostaCard)
}

/* ── Fratech Store Registration ── */
window.FratechCardRegistry = window.FratechCardRegistry || {}
window.FratechCardRegistry['posta-card'] = {
  id: 'posta-card', name: 'Cassetta della Posta', icon: '📬', version: '6.0.0',
  desc: 'Centro Controllo Posta DomHouse v1.4 — counter, notifiche push/alexa/google, orari',

  _makeHass() {
    const s = {}, h = (typeof hs !== 'undefined') ? hs : {}, a = (typeof ha !== 'undefined') ? ha : {}
    Object.keys(h).forEach(id => { s[id] = { state: h[id], attributes: a[id] || {}, entity_id: id } })
    return {
      states: s,
      callService(d, sv, dt) {
        if (typeof send === 'function') send({ type: 'call_service', domain: d, service: sv, service_data: dt || {} })
        else if (typeof callSvc === 'function') {
          const e = dt?.entity_id || '', x = {}
          if (dt) Object.keys(dt).forEach(k => { if (k !== 'entity_id') x[k] = dt[k] })
          callSvc(d, sv, e, x)
        }
      }
    }
  },

  render(c, h)     { return '<posta-card style="display:block;width:100%;height:100%"></posta-card>' },
  mount(c, h, el)  { const x = el.querySelector('posta-card'); if (!x) return; x.setConfig(c); try { x.hass = this._makeHass() } catch(e) {} },
  update(c, h, el) { const x = el.querySelector('posta-card'); if (!x) return; try { x.hass = this._makeHass() } catch(e) {} }
}

console.log('[FratechStore] Card registrata: posta-card v6.0.0')

;(function() {
  function patch() {
    if (typeof saveCard !== 'function' || typeof openCM !== 'function' || typeof jsStoreAddCard !== 'function') {
      setTimeout(patch, 200); return
    }
    const _oCM = openCM
    window.openCM = function(id) {
      _oCM(id)
      const page = typeof curPage === 'function' ? curPage() : null; if (!page) return
      const c = page.cards.find(x => x.id === id); if (!c || c.type !== 'js-custom') return
      const sel = document.getElementById('cm-type'); if (!sel) return
      if (!sel.querySelector('option[value="js-custom"]')) {
        const o = document.createElement('option'); o.value = 'js-custom'; o.textContent = '📦 Card JS'; sel.appendChild(o)
      }
      sel.value = 'js-custom'
      ;['fr-entity','fr-unit','fr-max','fr-min','fr-hours','fr-solar','fr-load','fr-grid','fr-battery',
        'fr-ent2','fr-ent3','fr-refresh','fr-sub','fr-content','fr-imageurl','fr-pelements',
        'fr-threshold','fr-groups','fr-items','fr-wf-temp','fr-wf-hum','fr-wf-wind','fr-wf-days'
      ].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none' })
    }
    const _oSC = saveCard
    window.saveCard = function() {
      const page = typeof curPage === 'function' ? curPage() : null; if (!page) return _oSC()
      const eid = typeof editingId !== 'undefined' ? editingId : null; if (!eid) return _oSC()
      const c = page.cards.find(x => x.id === eid); if (!c || c.type !== 'js-custom') return _oSC()
      const t = c.type, j = c.jsCardId; _oSC()
      const c2 = page.cards.find(x => x.id === eid)
      if (c2) { c2.type = t; c2.jsCardId = j; if (typeof saveCfg === 'function') saveCfg(); if (typeof renderDash === 'function') renderDash() }
    }
  }
  patch()
})()
