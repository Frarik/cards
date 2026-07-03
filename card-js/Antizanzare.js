/**
 * antizanzare-card.js v2.1
 */

const E = {
  stato:         'sensor.frarik_antizanzare_stato_sistema',
  autoAttiva:    'input_boolean.frarik_antizanzare_automazione_attiva',
  timerCiclo:    'timer.frarik_antizanzare_ciclo_timer',
  timerManuale:  'timer.frarik_antizanzare_manuale_timer',
  pioggia:       'sensor.frarik_antizanzare_probabilita_pioggia',
  pioggiaCors:   'binary_sensor.frarik_antizanzare_pioggia_corso',
  consumoAcqua:  'sensor.frarik_antizanzare_consumo_acqua',
  durataManuale: 'input_number.frarik_antizanzare_durata_manuale',
  cicliMensili:  'counter.frarik_antizanzare_cicli_mensili',
  cicliTarget:   'input_number.frarik_antizanzare_cicli_target_mensili',
  sogliaPioggia: 'input_number.frarik_antizanzare_soglia_pioggia',
  bloccoMeteo:   'binary_sensor.frarik_antizanzare_blocco_meteo',
  btnStart:      'input_button.frarik_antizanzare_start_manuale',
  btnStop:       'input_button.frarik_antizanzare_stop_manuale',
}

const DAYS     = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica']
const DAY_LBL  = ['LU','MA','ME','GI','VE','SA','DO']
const DAY_FULL = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']

function fmtDuration(secs) {
  const s = parseInt(secs) || 0
  if (s <= 0) return '0s'
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s/60)}min`
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60)
  return m ? `${h}h ${m}m` : `${h}h`
}

function parseDuration(durStr) {
  if (!durStr) return 0
  const p = String(durStr).split(':').map(Number)
  if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2]
  if (p.length === 2) return p[0]*60 + p[1]
  return p[0] || 0
}

function circProgress(pct, size, color) {
  const p = Math.max(0, Math.min(100, parseFloat(pct) || 0))
  const cx = size/2, cy = size/2, r = (size-8)/2
  const c = 2*Math.PI*r, d = (p/100)*c
  return `<svg width="${size}" height="${size}" style="display:block;transform:rotate(-90deg)">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3.5"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="3.5"
      stroke-dasharray="${d.toFixed(2)} ${(c-d).toFixed(2)}" stroke-linecap="round"/>
  </svg>`
}

function statusInfo(stato, blocco) {
  if (blocco) return { label:'BLOCCATO', color:'#f59e0b', pulse:false }
  switch(stato) {
    case 'Ciclo in Corso':     return { label:'CICLO ATTIVO', color:'#22c55e', pulse:true  }
    case 'Manuale Attiva':     return { label:'MANUALE',      color:'#f97316', pulse:true  }
    case 'Automazione Attiva': return { label:'IN ATTESA',    color:'#06b6d4', pulse:false }
    default:                   return { label:'SPENTA',       color:'#6b7280', pulse:false }
  }
}

const I = {
  gear:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  clock:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  play:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  stop:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  warn:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  bug:     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2l1.5 1.5"/><path d="M14.5 3.5L16 2"/><path d="M9 7.4a5 5 0 0 0-1 3V16a5 5 0 0 0 10 0v-5.6a5 5 0 0 0-1-3"/><path d="M12 7a3 3 0 0 1 3-3H9a3 3 0 0 1 3 3z"/><path d="M6.5 11H4"/><path d="M6.5 14H4"/><path d="M17.5 11H20"/><path d="M17.5 14H20"/><path d="M9 19l-2 2"/><path d="M15 19l2 2"/></svg>`,
  chevron: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  calend:  `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
}

const CSS = `
:host { display:block; }
* { box-sizing:border-box; margin:0; padding:0; }
.card {
  background:var(--ha-card-background,#111827);
  border-radius:var(--ha-card-border-radius,16px);
  border:1px solid rgba(6,182,212,.18);
  overflow:hidden;
  font-family:var(--primary-font-family,system-ui,sans-serif);
  box-shadow:0 8px 40px rgba(0,0,0,.35);
  transition:border-color .3s,box-shadow .3s;
}
.card.st-ciclo  { border-color:rgba(34,197,94,.4);  box-shadow:0 8px 40px rgba(34,197,94,.12); }
.card.st-manual { border-color:rgba(249,115,22,.4);  box-shadow:0 8px 40px rgba(249,115,22,.12); }
.card.st-wait   { border-color:rgba(6,182,212,.3);   box-shadow:0 8px 40px rgba(6,182,212,.08); }
.card.st-block  { border-color:rgba(245,158,11,.4);  box-shadow:0 8px 40px rgba(245,158,11,.1); }

/* ─ Header ─ */
.hdr { display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid rgba(255,255,255,.06); }
.hdr-icon { width:40px;height:40px;border-radius:11px;flex-shrink:0;background:rgba(6,182,212,.12);border:1px solid rgba(6,182,212,.25);display:flex;align-items:center;justify-content:center;color:#06b6d4; }
.hdr-text { flex:1;min-width:0; }
.hdr-title { font-size:15px;font-weight:700;color:var(--primary-text-color,#f1f5f9);line-height:1.2; }
.hdr-sub   { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);margin-top:2px; }
.hdr-right { display:flex;align-items:center;gap:7px;flex-shrink:0; }
.icon-btn { width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--secondary-text-color,#64748b);transition:background .15s; }
.icon-btn:hover { background:rgba(255,255,255,.1); }
button[data-action="toggleSettings"] { display: var(--fgear, none); }
.badge { display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.05em;border:1px solid currentColor;white-space:nowrap; }
.dot { width:6px;height:6px;border-radius:50%;background:currentColor; }
.dot.pulse { animation:blink 1.4s infinite; }
@keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.4)} }

/* ─ Stats ─ */
.stats { display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.06); }
.stat {
  border-radius:14px;
  border:1px solid rgba(255,255,255,.07);
  background:rgba(255,255,255,.04);
  padding:11px 8px 9px;
  display:flex;flex-direction:column;align-items:center;
  gap:0;
  min-height:100px;
  justify-content:space-between;
  transition:border-color .3s;
}
.stat-lbl {
  font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:var(--secondary-text-color,#64748b);
  margin-bottom:4px;
  white-space:nowrap;
}
.stat-body { display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;justify-content:center; }
.stat-num { font-size:28px;font-weight:900;line-height:1;letter-spacing:-1px;font-variant-numeric:tabular-nums; }
.stat-unit { font-size:13px;font-weight:600; }
.stat-foot { font-size:9px;font-weight:600;color:var(--secondary-text-color,#64748b);margin-top:4px;white-space:nowrap;text-align:center; }
.stat-foot.warn { color:#f59e0b; }
/* pioggia in corso */
.drop-icon { display:flex;align-items:center;justify-content:center;transition:filter .3s; }
.drop-icon.active { filter:drop-shadow(0 0 6px rgba(96,165,250,.6)); }
.state-pill {
  padding:3px 10px;border-radius:20px;
  font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  border:1px solid currentColor;
}
/* timer */
.timer-wrap { position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center; }
.timer-ring { position:absolute;inset:0;display:flex;align-items:center;justify-content:center; }
.timer-cd { position:absolute;font-size:11px;font-weight:800;font-variant-numeric:tabular-nums; }
.timer-idle { font-size:24px;font-weight:900;color:var(--secondary-text-color,#4b5563);letter-spacing:-1px; }

/* ─ Info row ─ */
.info-row { display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,.06);border-top:1px solid rgba(255,255,255,.06); }
.info-panel { background:var(--ha-card-background,#111827);padding:10px 12px; }
.info-lbl  { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);margin-bottom:5px; }
.info-main { font-size:14px;font-weight:700;color:var(--primary-text-color,#f1f5f9);line-height:1.3; }
.info-sub  { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:2px;line-height:1.4; }
.progress-track { height:5px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;margin:5px 0 3px; }
.progress-fill  { height:100%;border-radius:3px;background:linear-gradient(90deg,#0891b2,#06b6d4);transition:width .5s; }
.progress-fill.warn { background:linear-gradient(90deg,#d97706,#f59e0b); }
.progress-fill.done { background:linear-gradient(90deg,#15803d,#22c55e); }
.next-row { display:flex;align-items:center;gap:5px;margin-bottom:2px; }

/* ─ Days ─ */
.days { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid rgba(255,255,255,.06); }
.days-label { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--secondary-text-color,#64748b); }
.days-chips { display:flex;gap:4px; }
.day { width:28px;height:24px;border-radius:6px;border:none;cursor:pointer;font-size:9px;font-weight:700;transition:all .15s;display:flex;align-items:center;justify-content:center; }
.day.on  { background:rgba(6,182,212,.18);color:#06b6d4;border:1px solid rgba(6,182,212,.35); }
.day.off { background:rgba(255,255,255,.04);color:var(--secondary-text-color,#64748b);border:1px solid rgba(255,255,255,.07); }
.day.on:hover  { background:rgba(6,182,212,.28); }
.day.off:hover { background:rgba(255,255,255,.09); }

/* ─ Controls ─ */
.controls { display:flex;align-items:center;gap:6px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.06); }
.adj-btn { width:32px;height:34px;border-radius:9px;border:none;background:rgba(255,255,255,.07);cursor:pointer;color:var(--primary-text-color,#f1f5f9);font-size:17px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:background .15s; }
.adj-btn:hover { background:rgba(255,255,255,.13); }
.dur-disp { height:34px;padding:0 10px;border-radius:9px;background:rgba(255,255,255,.07);min-width:52px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--primary-text-color,#f1f5f9); }
.btn-start { flex:1;height:38px;border-radius:11px;border:none;cursor:pointer;background:linear-gradient(135deg,#0e7490,#06b6d4);color:#fff;font-size:12px;font-weight:700;letter-spacing:.03em;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .15s,transform .1s; }
.btn-start:hover { opacity:.88; }
.btn-start:active { transform:scale(.97); }
.btn-start:disabled { opacity:.35;cursor:default; }
.btn-stop { height:38px;padding:0 14px;border-radius:11px;border:none;cursor:pointer;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-size:12px;font-weight:700;display:none;align-items:center;justify-content:center;gap:5px;transition:background .15s; }
.btn-stop.show { display:flex; }
.btn-stop:hover { background:rgba(239,68,68,.22); }

/* ─ Settings ─ */
.settings { display:none;border-top:1px solid rgba(255,255,255,.06); }
.settings.open { display:block; }
.set-row { display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.04); }
.set-row:last-child { border-bottom:none; }
.set-lbl { font-size:12px;font-weight:600;color:var(--primary-text-color,#f1f5f9); }
.set-sub { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:1px; }
.toggle { width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0; }
.toggle.on  { background:#06b6d4; }
.toggle.off { background:rgba(255,255,255,.15); }
.toggle::after { content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s; }
.toggle.on::after  { left:21px; }
.toggle.off::after { left:3px; }
.num-ctrl { display:flex;align-items:center;gap:4px; }
.adj-sm { width:24px;height:24px;border-radius:6px;border:none;background:rgba(255,255,255,.08);color:var(--primary-text-color,#f1f5f9);font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0; }
.adj-sm:hover { background:rgba(255,255,255,.15); }
.set-val { font-size:13px;font-weight:700;color:#06b6d4;min-width:36px;text-align:center; }
.sched-panel { display:none;border-top:1px solid rgba(255,255,255,.06); }
.sched-panel.open { display:block; }
.sched-panel-hdr { display:flex;align-items:center;padding:9px 12px 4px; }
.sched-panel-lbl { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#06b6d4;display:flex;align-items:center;gap:5px; }
.sched-body { padding:0 12px 12px; }
.sched-tabs { display:flex;gap:3px;margin-bottom:10px; }
.sched-tab { flex:1;height:28px;border-radius:7px;font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);color:var(--secondary-text-color,#64748b);transition:all .15s; }
.sched-tab.active { background:rgba(6,182,212,.18);color:#06b6d4;border-color:rgba(6,182,212,.4); }
.sched-tab.day-on { border-color:rgba(6,182,212,.2); }
.sched-num-row { display:flex;align-items:center;justify-content:space-between;padding:4px 0 8px;border-bottom:1px solid rgba(255,255,255,.05);margin-bottom:8px; }
.sched-lbl { font-size:11px;font-weight:600;color:var(--secondary-text-color,#64748b); }
.sched-val { font-size:13px;font-weight:700;color:var(--primary-text-color,#f1f5f9);min-width:18px;text-align:center; }
.cycle-row { display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(6,182,212,.1);margin-bottom:6px;transition:border-color .2s; }
.cycle-row:last-child { margin-bottom:0; }
.cycle-row:hover { border-color:rgba(6,182,212,.25); }
.cycle-num { font-size:10px;font-weight:800;color:#06b6d4;background:rgba(6,182,212,.12);border:1px solid rgba(6,182,212,.2);border-radius:6px;padding:2px 6px;min-width:40px;text-align:center;flex-shrink:0; }
.time-input { height:28px;padding:0 7px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--primary-text-color,#f1f5f9);font-size:12px;font-weight:600;font-family:inherit;flex:1;min-width:0; }
.time-input:focus { outline:none;border-color:rgba(6,182,212,.5); }
.sched-dur { font-size:11px;font-weight:700;color:var(--primary-text-color,#f1f5f9);min-width:36px;text-align:center; }
.no-cycles { text-align:center;font-size:11px;color:var(--secondary-text-color,#64748b);padding:10px 0; }
.btn-sched { height:24px;padding:0 8px;border-radius:7px;border:1px solid rgba(6,182,212,.2);background:rgba(6,182,212,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;color:#06b6d4;font-size:9px;font-weight:700;transition:all .15s;flex-shrink:0;letter-spacing:.04em; }
.btn-sched:hover,.btn-sched.open { background:rgba(6,182,212,.18);border-color:rgba(6,182,212,.4); }
`

class AntiZanzareCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode:'open' })
    this._hass         = null
    this._config       = {}
    this._settingsOpen = false
    this._schedOpen    = false
    this._schedDay     = (new Date().getDay() + 6) % 7
    this._localDur     = null
    this._buildKey     = null
    this._tickInterval = null
    this._onClick      = this._handleClick.bind(this)
    this._onChange     = this._handleChange.bind(this)
  }

  static getStubConfig() { return {} }
  setConfig(config) { this._config = config || {} }
  getCardSize() { return 6 }

  configure() { this._settingsOpen = true; this._buildKey = null; this._buildDOM(); }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', this._onClick)
    this.shadowRoot.addEventListener('change', this._onChange)
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._onClick)
    this.shadowRoot.removeEventListener('change', this._onChange)
    this._stopTick()
  }

  set hass(hass) {
    this._hass = hass
    if (this._localDur !== null) {
      const haVal = Math.round(parseFloat(hass?.states[E.durataManuale]?.state) || 0)
      if (Math.abs(haVal - this._localDur) < 5) this._localDur = null
    }
    const cycleOn = hass?.states[E.timerCiclo]?.state === 'active'
    const manOn   = hass?.states[E.timerManuale]?.state === 'active'
    if (cycleOn || manOn) this._startTick()
    else this._stopTick()

    const bk = this._buildKey_()
    if (bk !== this._buildKey) {
      this._buildKey = bk
      this._buildDOM()
    } else {
      this._patch()
    }
  }

  _startTick() {
    if (this._tickInterval) return
    this._tickInterval = setInterval(() => this._tickTimer(), 1000)
  }

  _stopTick() {
    if (!this._tickInterval) return
    clearInterval(this._tickInterval)
    this._tickInterval = null
  }

  _tickTimer() {
    if (!this._hass) return
    const cycleOn = this._g(E.timerCiclo) === 'active'
    const manOn   = this._g(E.timerManuale) === 'active'
    if (!cycleOn && !manOn) { this._stopTick(); return }

    const key        = manOn ? E.timerManuale : E.timerCiclo
    const finishesAt = this._a(key, 'finishes_at')
    if (!finishesAt) return

    const durStr    = this._a(key, 'duration') || '0:00:00'
    const total     = parseDuration(durStr)
    const remaining = Math.max(0, (new Date(finishesAt).getTime() - Date.now()) / 1000)
    const pct       = total > 0 ? (remaining / total) * 100 : 0
    const m = Math.floor(remaining / 60), s = Math.floor(remaining % 60)
    const cd  = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    const col = manOn ? '#f97316' : '#22c55e'

    const cdEl   = this.shadowRoot?.querySelector('.timer-cd')
    const ringEl = this.shadowRoot?.querySelector('.timer-ring')
    if (cdEl)   cdEl.textContent = cd
    if (ringEl) ringEl.innerHTML = circProgress(pct, 48, col)
  }

  _g(id, fb = null)          { return this._hass?.states?.[id]?.state ?? fb }
  _a(id, key, fb = null)     { return this._hass?.states?.[id]?.attributes?.[key] ?? fb }
  _svc(domain, svc, data={}) { return this._hass?.callService(domain, svc, data) }
  _dur() {
    if (this._localDur !== null) return this._localDur
    return Math.round(parseFloat(this._g(E.durataManuale, '60')) || 60)
  }

  // Calcola il prossimo ciclo direttamente dagli input entity (non dal sensor)
  _computeNextCycle() {
    if (!this._hass) return null
    if (this._g(E.autoAttiva) !== 'on') return { label:'Automazione disattiva', timeLabel:'', dur:0 }

    const now      = Date.now()
    const today    = new Date()
    const todayIdx = (today.getDay() + 6) % 7  // 0=lun, 6=dom

    const cands = []
    for (let off = 0; off < 8; off++) {
      const idx  = (todayIdx + off) % 7
      const d    = DAYS[idx]
      if (this._g(`input_boolean.frarik_antizanzare_${d}`) !== 'on') continue

      const numC = Math.round(parseFloat(this._g(`input_number.frarik_antizanzare_${d}_num_cicli`, '0')))
      if (!numC) continue

      const dt   = new Date(today)
      dt.setDate(today.getDate() + off)
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`

      for (let c = 1; c <= numC; c++) {
        const t = this._g(`input_datetime.frarik_antizanzare_${d}_orario_ciclo${c}`, null)
        if (!t || t === 'unknown' || t === 'unavailable') continue
        const ts = new Date(`${dateStr}T${t.slice(0,5)}:00`).getTime()
        if (off === 0 && ts <= now) continue
        const dur = Math.round(parseFloat(this._g(`input_number.frarik_antizanzare_${d}_durata_ciclo${c}`, '0')))
        cands.push({ ts, off, idx, time: t.slice(0,5), ciclo: c, dur })
      }
    }

    if (!cands.length) return { label:'Nessun ciclo programmato', timeLabel:'', dur:0 }

    cands.sort((a,b) => a.ts - b.ts)
    const nx = cands[0]

    let label
    if (nx.off === 0)      label = `Oggi ${nx.time}`
    else if (nx.off === 1) label = `Domani ${nx.time}`
    else                   label = `${DAY_FULL[nx.idx]} ${nx.time}`

    const remMs = nx.ts - now
    const remH  = Math.floor(remMs / 3600000)
    const remM  = Math.floor((remMs % 3600000) / 60000)
    let timeLabel
    if (remH >= 24) {
      const d2 = Math.floor(remH/24), h2 = remH%24
      timeLabel = h2 ? `${d2}g ${h2}h` : `${d2}g`
    } else if (remH >= 1) {
      timeLabel = remM ? `${remH}h ${remM}m` : `${remH}h`
    } else {
      timeLabel = `${remM}min`
    }

    return { label, timeLabel, ciclo: nx.ciclo, dur: nx.dur }
  }

  _buildKey_() {
    if (!this._hass) return null

    // Include tutto lo schedule (tutti i giorni) per rilevare cambi orari/durate
    const allSched = DAYS.map(d => {
      const n = Math.round(parseFloat(this._g(`input_number.frarik_antizanzare_${d}_num_cicli`,'0')))
      if (!n) return `${d}:0`
      return `${d}:${n}:` + Array.from({length:n},(_,i)=>
        `${this._g(`input_datetime.frarik_antizanzare_${d}_orario_ciclo${i+1}`,'')}`
      ).join(',')
    }).join('|')

    const d = DAYS[this._schedDay]
    const numC = this._schedOpen
      ? Math.round(parseFloat(this._g(`input_number.frarik_antizanzare_${d}_num_cicli`,'0')))
      : 0
    const schedDur = this._schedOpen
      ? Array.from({length:numC},(_,i)=>
          Math.round(parseFloat(this._g(`input_number.frarik_antizanzare_${d}_durata_ciclo${i+1}`,'0')))
        ).join(';')
      : ''

    return [
      this._g(E.stato),
      this._g(E.autoAttiva),
      this._g(E.timerCiclo),
      this._g(E.timerManuale),
      this._g(E.bloccoMeteo),
      this._g(E.pioggiaCors),
      this._g(E.consumoAcqua),
      Math.round(parseFloat(this._g(E.cicliMensili,'0'))),
      Math.round(parseFloat(this._g(E.cicliTarget,'20'))),
      Math.round(parseFloat(this._g(E.sogliaPioggia,'50'))),
      this._dur(),
      DAYS.map(day => this._g(`input_boolean.frarik_antizanzare_${day}`)==='on'?'1':'0').join(''),
      allSched,
      this._settingsOpen?'1':'0',
      this._schedOpen?'1':'0',
      this._schedDay,
      schedDur,
    ].join('|')
  }

  _handleClick(e) {
    const btn = e.target.closest('[data-action]')
    if (!btn || !this._hass) return
    const { action } = btn.dataset
    switch(action) {
      case 'toggleSettings':
        this._settingsOpen = !this._settingsOpen
        this._buildKey = null; this._buildDOM(); break
      case 'toggleSchedule':
        this._schedOpen = !this._schedOpen
        this._buildKey = null; this._buildDOM(); break
      case 'selectSchedDay':
        this._schedDay = parseInt(btn.dataset.dayIdx)
        this._buildKey = null; this._buildDOM(); break
      case 'startManuale':
        this._svc('input_button','press',{entity_id:E.btnStart}); break
      case 'stopManuale':
        this._svc('input_button','press',{entity_id:E.btnStop}); break
      case 'toggleAuto':
        this._svc('input_boolean','toggle',{entity_id:E.autoAttiva}); break
      case 'durMinus': {
        const v = Math.max(10, this._dur()-30)
        this._localDur = v
        this._svc('input_number','set_value',{entity_id:E.durataManuale,value:v})
        this._buildKey = null; this._buildDOM(); break
      }
      case 'durPlus': {
        const v = Math.min(3600, this._dur()+30)
        this._localDur = v
        this._svc('input_number','set_value',{entity_id:E.durataManuale,value:v})
        this._buildKey = null; this._buildDOM(); break
      }
      case 'sogliaMinus': {
        const cur = Math.round(parseFloat(this._g(E.sogliaPioggia,'50')))
        this._svc('input_number','set_value',{entity_id:E.sogliaPioggia,value:Math.max(0,cur-5)}); break
      }
      case 'sogliaPlus': {
        const cur = Math.round(parseFloat(this._g(E.sogliaPioggia,'50')))
        this._svc('input_number','set_value',{entity_id:E.sogliaPioggia,value:Math.min(100,cur+5)}); break
      }
      case 'targetMinus': {
        const cur = Math.round(parseFloat(this._g(E.cicliTarget,'20')))
        this._svc('input_number','set_value',{entity_id:E.cicliTarget,value:Math.max(1,cur-1)}); break
      }
      case 'targetPlus': {
        const cur = Math.round(parseFloat(this._g(E.cicliTarget,'20')))
        this._svc('input_number','set_value',{entity_id:E.cicliTarget,value:Math.min(200,cur+1)}); break
      }
      case 'numCicliMinus': {
        const d = DAYS[this._schedDay]
        const id = `input_number.frarik_antizanzare_${d}_num_cicli`
        const cur = Math.round(parseFloat(this._g(id,'0')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.max(0,cur-1)}); break
      }
      case 'numCicliPlus': {
        const d = DAYS[this._schedDay]
        const id = `input_number.frarik_antizanzare_${d}_num_cicli`
        const cur = Math.round(parseFloat(this._g(id,'0')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.min(5,cur+1)}); break
      }
      case 'durCicloMinus': {
        const id = `input_number.frarik_antizanzare_${btn.dataset.day}_durata_ciclo${btn.dataset.ciclo}`
        const cur = Math.round(parseFloat(this._g(id,'60')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.max(10,cur-10)}); break
      }
      case 'durCicloPlus': {
        const id = `input_number.frarik_antizanzare_${btn.dataset.day}_durata_ciclo${btn.dataset.ciclo}`
        const cur = Math.round(parseFloat(this._g(id,'60')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.min(3600,cur+10)}); break
      }
      case 'toggleDay':
        this._svc('input_boolean','toggle',{entity_id:`input_boolean.frarik_antizanzare_${btn.dataset.day}`}); break
    }
  }

  _handleChange(e) {
    const input = e.target.closest('[data-action="timeChange"]')
    if (!input || !this._hass) return
    const { day, ciclo } = input.dataset
    if (!input.value) return
    this._svc('input_datetime','set_datetime',{
      entity_id: `input_datetime.frarik_antizanzare_${day}_orario_ciclo${ciclo}`,
      time: `${input.value}:00`,
    })
  }

  _buildDOM() {
    if (!this._hass) return

    const stato      = this._g(E.stato,'Spenta')
    const autoOn     = this._g(E.autoAttiva) === 'on'
    const cycleOn    = this._g(E.timerCiclo) === 'active'
    const manOn      = this._g(E.timerManuale) === 'active'
    const blocco     = this._g(E.bloccoMeteo) === 'on'
    const pioggiaCOn = this._g(E.pioggiaCors) === 'on'
    const isActive   = cycleOn || manOn
    const status     = statusInfo(stato, blocco)
    const pioggia    = parseInt(this._g(E.pioggia,'0'))
    const soglia     = Math.round(parseFloat(this._g(E.sogliaPioggia,'50')))
    const cicliM     = parseInt(this._g(E.cicliMensili,'0'))
    const target     = Math.round(parseFloat(this._g(E.cicliTarget,'20')))
    const pctM       = target > 0 ? Math.min(100, cicliM/target*100) : 0
    const dur        = this._dur()
    const days       = DAYS.map(d => this._g(`input_boolean.frarik_antizanzare_${d}`) === 'on')
    const consumoRaw  = parseFloat(this._g(E.consumoAcqua, '0')) || 0
    const consumoUnit = this._a(E.consumoAcqua, 'unit_of_measurement') || 'L/min'
    const rainWarn   = pioggia >= soglia
    const cardClass  = cycleOn?'st-ciclo':manOn?'st-manual':autoOn?'st-wait':blocco?'st-block':''

    // Prossimo ciclo calcolato in JS
    const nx = this._computeNextCycle()

    // Stat 1: rain probability colors
    const rainColor = rainWarn ? '#f59e0b' : '#60a5fa'

    // Stat 2: pioggia in corso
    const pcColor  = pioggiaCOn ? '#60a5fa' : '#374151'
    const pcFill   = pioggiaCOn ? 'rgba(96,165,250,.25)' : 'rgba(255,255,255,.04)'
    const dropSvg  = `<svg width="30" height="30" viewBox="0 0 24 24"
      fill="${pcFill}" stroke="${pcColor}" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>`

    // Stat 3: timer
    const timerCol  = manOn ? '#f97316' : '#22c55e'
    const timerKey  = manOn ? E.timerManuale : E.timerCiclo
    const finishAt  = isActive ? this._a(timerKey,'finishes_at') : null
    const durStr    = isActive ? (this._a(timerKey,'duration')||'0:00:00') : '0:00:00'
    const total     = parseDuration(durStr)
    const remaining = finishAt ? Math.max(0,(new Date(finishAt).getTime()-Date.now())/1000) : 0
    const initPct   = total > 0 ? (remaining/total)*100 : 0
    const im = Math.floor(remaining/60), is2 = Math.floor(remaining%60)
    const initCd    = finishAt ? `${String(im).padStart(2,'0')}:${String(is2).padStart(2,'0')}` : '--:--'

    const timerBodyHTML = isActive
      ? `<div class="timer-wrap">
           <div class="timer-ring">${circProgress(initPct,48,timerCol)}</div>
           <span class="timer-cd" style="color:${timerCol}">${initCd}</span>
         </div>`
      : `<div class="timer-idle">--</div>`

    // Progress class
    const pCls = pctM>=100?'done':pctM>=80?'warn':''

    // Day chips
    const dayChips = DAYS.map((d,i) =>
      `<button class="day ${days[i]?'on':'off'}" data-action="toggleDay" data-day="${d}">${DAY_LBL[i]}</button>`
    ).join('')

    // Schedule editor
    let schedHTML = ''
    if (this._schedOpen) {
      const d = DAYS[this._schedDay]
      const numCicli = Math.round(parseFloat(this._g(`input_number.frarik_antizanzare_${d}_num_cicli`,'0')))
      const tabs = DAYS.map((day,i) =>
        `<button class="sched-tab ${i===this._schedDay?'active':''} ${days[i]?'day-on':''}"
          data-action="selectSchedDay" data-day-idx="${i}">${DAY_LBL[i]}</button>`
      ).join('')
      const cycles = numCicli > 0
        ? Array.from({length:numCicli},(_,ci)=>{
            const c = ci+1
            const orario = (this._g(`input_datetime.frarik_antizanzare_${d}_orario_ciclo${c}`,'08:00:00')||'08:00:00').slice(0,5)
            const durC = Math.round(parseFloat(this._g(`input_number.frarik_antizanzare_${d}_durata_ciclo${c}`,'60')))
            return `<div class="cycle-row">
              <span class="cycle-num">Ciclo ${c}</span>
              <input class="time-input" type="time" value="${orario}"
                data-action="timeChange" data-day="${d}" data-ciclo="${c}">
              <div class="num-ctrl">
                <button class="adj-sm" data-action="durCicloMinus" data-day="${d}" data-ciclo="${c}">−</button>
                <span class="sched-dur">${fmtDuration(durC)}</span>
                <button class="adj-sm" data-action="durCicloPlus" data-day="${d}" data-ciclo="${c}">+</button>
              </div>
            </div>`
          }).join('')
        : `<div class="no-cycles">Nessun ciclo — aumenta il numero sopra</div>`
      schedHTML = `
        <div class="sched-panel-hdr">
          <span class="sched-panel-lbl">${I.calend} Programma Cicli</span>
        </div>
        <div class="sched-body">
          <div class="sched-tabs">${tabs}</div>
          <div class="sched-num-row">
            <span class="sched-lbl">Numero cicli</span>
            <div class="num-ctrl">
              <button class="adj-sm" data-action="numCicliMinus">−</button>
              <span class="sched-val">${numCicli}</span>
              <button class="adj-sm" data-action="numCicliPlus">+</button>
            </div>
          </div>
          ${cycles}
        </div>`
    }

    const settingsHTML = this._settingsOpen ? `
      <div class="settings open">
        <div class="set-row">
          <div><div class="set-lbl">Automazione</div><div class="set-sub">Pianificazione automatica settimanale</div></div>
          <button class="toggle ${autoOn?'on':'off'}" data-action="toggleAuto"></button>
        </div>
        <div class="set-row">
          <div><div class="set-lbl">Soglia pioggia</div><div class="set-sub">Salta ciclo se probabilità &gt; soglia</div></div>
          <div class="num-ctrl">
            <button class="adj-sm" data-action="sogliaMinus">−</button>
            <span class="set-val">${soglia}%</span>
            <button class="adj-sm" data-action="sogliaPlus">+</button>
          </div>
        </div>
        <div class="set-row">
          <div><div class="set-lbl">Obiettivo mensile</div><div class="set-sub">${cicliM} cicli completati questo mese</div></div>
          <div class="num-ctrl">
            <button class="adj-sm" data-action="targetMinus">−</button>
            <span class="set-val">${target}</span>
            <button class="adj-sm" data-action="targetPlus">+</button>
          </div>
        </div>
      </div>` : `<div class="settings"></div>`

    this.shadowRoot.innerHTML = `<style>${CSS}</style>
<div class="card ${cardClass}">

  <div class="hdr">
    <div class="hdr-icon">${I.bug}</div>
    <div class="hdr-text">
      <div class="hdr-title">Anti Zanzare</div>
      <div class="hdr-sub">Protezione Automatica</div>
    </div>
    <div class="hdr-right">
      <button class="icon-btn" data-action="toggleSettings">${I.gear}</button>
      <div class="badge" style="color:${status.color}">
        <span class="dot ${status.pulse?'pulse':''}"></span>
        ${status.label}
      </div>
    </div>
  </div>

  <!-- Stats — 3 tile uniformi -->
  <div class="stats">

    <div class="stat" style="border-color:${rainWarn?'rgba(245,158,11,.35)':'rgba(96,165,250,.2)'}">
      <div class="stat-lbl" style="color:${rainColor}">Probabilità</div>
      <div class="stat-body">
        <div style="display:flex;align-items:baseline;gap:2px;color:${rainColor}">
          <span class="stat-num" data-field="pioggia">${pioggia}</span>
          <span class="stat-unit">%</span>
        </div>
      </div>
      <div class="stat-foot ${rainWarn?'warn':''}">${rainWarn?'⚠ Sopra soglia':'Prob. pioggia'}</div>
    </div>

    <div class="stat" style="border-color:${pioggiaCOn?'rgba(96,165,250,.35)':'rgba(255,255,255,.07)'}">
      <div class="stat-lbl" style="color:${pioggiaCOn?'#60a5fa':'var(--secondary-text-color,#64748b)'}">Pioggia</div>
      <div class="stat-body">
        <div class="drop-icon ${pioggiaCOn?'active':''}">${dropSvg}</div>
        <div class="state-pill" style="color:${pioggiaCOn?'#60a5fa':'#4b5563'};border-color:${pioggiaCOn?'rgba(96,165,250,.4)':'rgba(255,255,255,.1)'}">
          ${pioggiaCOn?'IN CORSO':'ASSENTE'}
        </div>
      </div>
      <div class="stat-foot" style="${pioggiaCOn?'color:#ef4444':''}">${pioggiaCOn?'ciclo bloccato':'nessuna pioggia'}</div>
    </div>

    <div class="stat" style="border-color:${isActive?timerCol+'55':'rgba(255,255,255,.07)'}">
      <div class="stat-lbl" style="color:${isActive?timerCol:'var(--secondary-text-color,#64748b)'}">${manOn?'Manuale':'Timer ciclo'}</div>
      <div class="stat-body">
        ${timerBodyHTML}
      </div>
      <div class="stat-foot">${isActive ? (consumoRaw > 0 ? `${consumoRaw.toFixed(1)} ${consumoUnit}` : 'Rimanente') : 'Nessun timer'}</div>
    </div>

  </div>

  <div class="info-row">
    <div class="info-panel">
      <div class="info-lbl">Cicli questo mese</div>
      <div class="info-main">${cicliM}<span style="font-weight:400;font-size:12px;color:var(--secondary-text-color)"> / ${target}</span></div>
      <div class="progress-track"><div class="progress-fill ${pCls}" style="width:${pctM.toFixed(1)}%"></div></div>
      <div class="info-sub">${Math.round(pctM)}% obiettivo${pctM>=100?' ✓ Raggiunto!':''}</div>
    </div>
    <div class="info-panel">
      <div class="info-lbl">Prossimo ciclo</div>
      <div class="next-row">${I.calend}
        <span style="font-weight:700;font-size:13px;color:var(--primary-text-color)">${nx?.label??'—'}</span>
      </div>
      <div class="info-sub">${nx?.timeLabel?`Tra: ${nx.timeLabel}`:''}${nx?.dur&&nx.dur>0?` · ${fmtDuration(nx.dur)}`:''}</div>
    </div>
  </div>

  <div class="days">
    <span class="days-label">Giorni attivi</span>
    <div class="days-chips">${dayChips}</div>
    <button class="btn-sched ${this._schedOpen?'open':''}" data-action="toggleSchedule">
      ${I.calend} Programma
    </button>
  </div>

  <div class="sched-panel ${this._schedOpen?'open':''}">
    ${schedHTML}
  </div>

  <div class="controls">
    <button class="adj-btn" data-action="durMinus">−</button>
    <button class="adj-btn" data-action="durPlus">+</button>
    <div class="dur-disp">${fmtDuration(dur)}</div>
    <button class="btn-start" data-action="startManuale" ${isActive?'disabled':''}>
      ${I.play} Avvia Manuale
    </button>
    <button class="btn-stop ${isActive?'show':''}" data-action="stopManuale">
      ${I.stop} Stop
    </button>
  </div>

  ${settingsHTML}

</div>`
  }

  _patch() {
    const root = this.shadowRoot
    if (!root?.querySelector('.card')) return
    const pEl = root.querySelector('[data-field="pioggia"]')
    if (pEl) pEl.textContent = parseInt(this._g(E.pioggia,'0'))
  }
}

customElements.define('antizanzare-card', AntiZanzareCard)

window.customCards = window.customCards || []
window.customCards.push({ version: '1.5',
  type:        'antizanzare-card',
  name:        'Anti Zanzare',
  description: 'Controllo sistema anti zanzare: schedule, timer, statistiche mensili.',
})

// ─── FratechStore Integration ────────────────────────────────────────────────
;(function () {
  'use strict';

  var _AZ_WIZ_KEY = 'frarik_pkg_wizard_antizanzare';

  var _AZ_PKG_YAML = 'input_boolean:\n'
    + '  frarik_antizanzare_lunedi: {name: "Anti Zanzare Lunedì", icon: mdi:calendar}\n'
    + '  frarik_antizanzare_martedi: {name: "Anti Zanzare Martedì", icon: mdi:calendar}\n'
    + '  frarik_antizanzare_mercoledi: {name: "Anti Zanzare Mercoledì", icon: mdi:calendar}\n'
    + '  frarik_antizanzare_giovedi: {name: "Anti Zanzare Giovedì", icon: mdi:calendar}\n'
    + '  frarik_antizanzare_venerdi: {name: "Anti Zanzare Venerdì", icon: mdi:calendar}\n'
    + '  frarik_antizanzare_sabato: {name: "Anti Zanzare Sabato", icon: mdi:calendar}\n'
    + '  frarik_antizanzare_domenica: {name: "Anti Zanzare Domenica", icon: mdi:calendar}\n'
    + '  frarik_antizanzare_automazione_attiva: {name: "Automazione Anti Zanzare Attiva", icon: mdi:autorenew}\n'
    + '  frarik_antizanzare_manuale_attiva: {name: "Anti Zanzare Manuale Attiva", icon: mdi:hand-back-right}\n'
    + 'input_number:\n'
    + '  frarik_antizanzare_lunedi_num_cicli: {name: "Lun N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  frarik_antizanzare_lunedi_durata_ciclo1: {name: "Lun C1 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_lunedi_durata_ciclo2: {name: "Lun C2 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_lunedi_durata_ciclo3: {name: "Lun C3 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_lunedi_durata_ciclo4: {name: "Lun C4 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_lunedi_durata_ciclo5: {name: "Lun C5 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_martedi_num_cicli: {name: "Mar N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  frarik_antizanzare_martedi_durata_ciclo1: {name: "Mar C1 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_martedi_durata_ciclo2: {name: "Mar C2 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_martedi_durata_ciclo3: {name: "Mar C3 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_martedi_durata_ciclo4: {name: "Mar C4 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_martedi_durata_ciclo5: {name: "Mar C5 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_mercoledi_num_cicli: {name: "Mer N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  frarik_antizanzare_mercoledi_durata_ciclo1: {name: "Mer C1 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_mercoledi_durata_ciclo2: {name: "Mer C2 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_mercoledi_durata_ciclo3: {name: "Mer C3 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_mercoledi_durata_ciclo4: {name: "Mer C4 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_mercoledi_durata_ciclo5: {name: "Mer C5 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_giovedi_num_cicli: {name: "Gio N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  frarik_antizanzare_giovedi_durata_ciclo1: {name: "Gio C1 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_giovedi_durata_ciclo2: {name: "Gio C2 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_giovedi_durata_ciclo3: {name: "Gio C3 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_giovedi_durata_ciclo4: {name: "Gio C4 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_giovedi_durata_ciclo5: {name: "Gio C5 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_venerdi_num_cicli: {name: "Ven N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  frarik_antizanzare_venerdi_durata_ciclo1: {name: "Ven C1 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_venerdi_durata_ciclo2: {name: "Ven C2 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_venerdi_durata_ciclo3: {name: "Ven C3 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_venerdi_durata_ciclo4: {name: "Ven C4 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_venerdi_durata_ciclo5: {name: "Ven C5 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_sabato_num_cicli: {name: "Sab N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  frarik_antizanzare_sabato_durata_ciclo1: {name: "Sab C1 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_sabato_durata_ciclo2: {name: "Sab C2 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_sabato_durata_ciclo3: {name: "Sab C3 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_sabato_durata_ciclo4: {name: "Sab C4 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_sabato_durata_ciclo5: {name: "Sab C5 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_domenica_num_cicli: {name: "Dom N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  frarik_antizanzare_domenica_durata_ciclo1: {name: "Dom C1 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_domenica_durata_ciclo2: {name: "Dom C2 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_domenica_durata_ciclo3: {name: "Dom C3 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_domenica_durata_ciclo4: {name: "Dom C4 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_domenica_durata_ciclo5: {name: "Dom C5 Durata", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  frarik_antizanzare_durata_manuale: {name: "Durata Manuale", min: 10, max: 3600, step: 10, mode: box, unit_of_measurement: sec, icon: mdi:timer-cog}\n'
    + '  frarik_antizanzare_soglia_pioggia: {name: "Soglia Pioggia %", min: 0, max: 100, step: 5, mode: slider, unit_of_measurement: "%", icon: mdi:weather-rainy}\n'
    + '  frarik_antizanzare_cicli_target_mensili: {name: "Cicli Target Mensili", min: 1, max: 200, step: 1, mode: box, unit_of_measurement: cicli, icon: mdi:target}\n'
    + 'input_datetime:\n'
    + '  frarik_antizanzare_lunedi_orario_ciclo1: {name: "Lun C1 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_lunedi_orario_ciclo2: {name: "Lun C2 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_lunedi_orario_ciclo3: {name: "Lun C3 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_lunedi_orario_ciclo4: {name: "Lun C4 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_lunedi_orario_ciclo5: {name: "Lun C5 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_martedi_orario_ciclo1: {name: "Mar C1 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_martedi_orario_ciclo2: {name: "Mar C2 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_martedi_orario_ciclo3: {name: "Mar C3 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_martedi_orario_ciclo4: {name: "Mar C4 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_martedi_orario_ciclo5: {name: "Mar C5 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_mercoledi_orario_ciclo1: {name: "Mer C1 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_mercoledi_orario_ciclo2: {name: "Mer C2 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_mercoledi_orario_ciclo3: {name: "Mer C3 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_mercoledi_orario_ciclo4: {name: "Mer C4 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_mercoledi_orario_ciclo5: {name: "Mer C5 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_giovedi_orario_ciclo1: {name: "Gio C1 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_giovedi_orario_ciclo2: {name: "Gio C2 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_giovedi_orario_ciclo3: {name: "Gio C3 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_giovedi_orario_ciclo4: {name: "Gio C4 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_giovedi_orario_ciclo5: {name: "Gio C5 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_venerdi_orario_ciclo1: {name: "Ven C1 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_venerdi_orario_ciclo2: {name: "Ven C2 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_venerdi_orario_ciclo3: {name: "Ven C3 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_venerdi_orario_ciclo4: {name: "Ven C4 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_venerdi_orario_ciclo5: {name: "Ven C5 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_sabato_orario_ciclo1: {name: "Sab C1 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_sabato_orario_ciclo2: {name: "Sab C2 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_sabato_orario_ciclo3: {name: "Sab C3 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_sabato_orario_ciclo4: {name: "Sab C4 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_sabato_orario_ciclo5: {name: "Sab C5 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_domenica_orario_ciclo1: {name: "Dom C1 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_domenica_orario_ciclo2: {name: "Dom C2 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_domenica_orario_ciclo3: {name: "Dom C3 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_domenica_orario_ciclo4: {name: "Dom C4 Orario", has_date: false, has_time: true}\n'
    + '  frarik_antizanzare_domenica_orario_ciclo5: {name: "Dom C5 Orario", has_date: false, has_time: true}\n'
    + 'input_button:\n'
    + '  frarik_antizanzare_start_automazione: {name: "Avvia Automazione Anti Zanzare", icon: mdi:play-circle}\n'
    + '  frarik_antizanzare_stop_automazione: {name: "Ferma Automazione Anti Zanzare", icon: mdi:stop-circle}\n'
    + '  frarik_antizanzare_start_manuale: {name: "Avvia Anti Zanzare Manuale", icon: mdi:play-circle-outline}\n'
    + '  frarik_antizanzare_stop_manuale: {name: "Ferma Anti Zanzare Manuale", icon: mdi:stop-circle-outline}\n'
    + 'timer:\n'
    + '  frarik_antizanzare_ciclo_timer: {name: "Timer Ciclo Anti Zanzare", icon: mdi:clock, restore: true}\n'
    + '  frarik_antizanzare_manuale_timer: {name: "Timer Anti Zanzare Manuale", icon: mdi:hand-back-right, restore: true}\n'
    + 'counter:\n'
    + '  frarik_antizanzare_cicli_mensili: {name: "Cicli Anti Zanzare Questo Mese", step: 1, icon: mdi:counter}\n'
    + '  frarik_antizanzare_cicli_rimanenti: {name: "Cicli Anti Zanzare Rimanenti", step: 1, icon: mdi:counter-outline}\n'
    + 'template:\n'
    + '  - sensor:\n'
    + '      - name: "Stato Anti Zanzare"\n'
    + '        unique_id: frarik_antizanzare_stato_sistema\n'
    + '        state: >\n'
    + '          {% if is_state(\'input_boolean.frarik_antizanzare_manuale_attiva\', \'on\') %}\n'
    + '            Manuale Attiva\n'
    + '          {% elif is_state(\'timer.frarik_antizanzare_ciclo_timer\', \'active\') %}\n'
    + '            Ciclo in Corso\n'
    + '          {% elif is_state(\'input_boolean.frarik_antizanzare_automazione_attiva\', \'on\') %}\n'
    + '            Automazione Attiva\n'
    + '          {% else %}\n'
    + '            Spenta\n'
    + '          {% endif %}\n'
    + '        icon: mdi:sprinkler-variant\n'
    + '  - binary_sensor:\n'
    + '      - name: "Blocco Meteo Attivo"\n'
    + '        unique_id: frarik_antizanzare_blocco_meteo\n'
    + '        state: >\n'
    + '          {{ states(\'sensor.probabilita_pioggia\') | float(0) >= states(\'input_number.frarik_antizanzare_soglia_pioggia\') | float(50) or\n'
    + '             is_state(\'binary_sensor.pioggia_in_corso\', \'on\') }}\n'
    + '        icon: mdi:weather-rainy\n'
    + 'automation:\n'
    + '  - id: frarik_antizanzare_avvio_automazione\n'
    + '    alias: "Anti Zanzare - Avvio Automazione"\n'
    + '    trigger:\n'
    + '      - platform: state\n'
    + '        entity_id: input_button.frarik_antizanzare_start_automazione\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_on\n'
    + '        target: {entity_id: input_boolean.frarik_antizanzare_automazione_attiva}\n'
    + '  - id: frarik_antizanzare_stop_automazione_handler\n'
    + '    alias: "Anti Zanzare - Stop Automazione"\n'
    + '    trigger:\n'
    + '      - platform: state\n'
    + '        entity_id: input_button.frarik_antizanzare_stop_automazione\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_off\n'
    + '        target: {entity_id: input_boolean.frarik_antizanzare_automazione_attiva}\n'
    + '      - service: timer.cancel\n'
    + '        target: {entity_id: timer.frarik_antizanzare_ciclo_timer}\n'
    + '  - id: frarik_antizanzare_avvio_manuale\n'
    + '    alias: "Anti Zanzare - Avvio Manuale"\n'
    + '    trigger:\n'
    + '      - platform: state\n'
    + '        entity_id: input_button.frarik_antizanzare_start_manuale\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_on\n'
    + '        target: {entity_id: input_boolean.frarik_antizanzare_manuale_attiva}\n'
    + '      - service: timer.start\n'
    + '        target: {entity_id: timer.frarik_antizanzare_manuale_timer}\n'
    + '        data:\n'
    + '          duration: "{{ states(\'input_number.frarik_antizanzare_durata_manuale\') | int(60) }}"\n'
    + '      - service: switch.turn_on\n'
    + '        target: {entity_id: IL_TUO_SWITCH_AZ}\n'
    + '  - id: frarik_antizanzare_stop_manuale_handler\n'
    + '    alias: "Anti Zanzare - Stop Manuale"\n'
    + '    trigger:\n'
    + '      - platform: state\n'
    + '        entity_id: input_button.frarik_antizanzare_stop_manuale\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_off\n'
    + '        target: {entity_id: input_boolean.frarik_antizanzare_manuale_attiva}\n'
    + '      - service: timer.cancel\n'
    + '        target: {entity_id: timer.frarik_antizanzare_manuale_timer}\n'
    + '      - service: switch.turn_off\n'
    + '        target: {entity_id: IL_TUO_SWITCH_AZ}\n'
    + '  - id: frarik_antizanzare_timer_ciclo_finito\n'
    + '    alias: "Anti Zanzare - Timer Ciclo Finito"\n'
    + '    trigger:\n'
    + '      - platform: event\n'
    + '        event_type: timer.finished\n'
    + '        event_data: {entity_id: timer.frarik_antizanzare_ciclo_timer}\n'
    + '    action:\n'
    + '      - service: switch.turn_off\n'
    + '        target: {entity_id: IL_TUO_SWITCH_AZ}\n'
    + '  - id: frarik_antizanzare_timer_manuale_finito\n'
    + '    alias: "Anti Zanzare - Timer Manuale Finito"\n'
    + '    trigger:\n'
    + '      - platform: event\n'
    + '        event_type: timer.finished\n'
    + '        event_data: {entity_id: timer.frarik_antizanzare_manuale_timer}\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_off\n'
    + '        target: {entity_id: input_boolean.frarik_antizanzare_manuale_attiva}\n'
    + '      - service: switch.turn_off\n'
    + '        target: {entity_id: IL_TUO_SWITCH_AZ}\n'
    + '  - id: frarik_antizanzare_reset_mensile\n'
    + '    alias: "Anti Zanzare - Reset Cicli Mensili"\n'
    + '    trigger:\n'
    + '      - platform: time\n'
    + '        at: "00:00:00"\n'
    + '    condition:\n'
    + '      - condition: template\n'
    + '        value_template: "{{ now().day == 1 }}"\n'
    + '    action:\n'
    + '      - service: counter.reset\n'
    + '        target: {entity_id: counter.frarik_antizanzare_cicli_mensili}\n';

  function _buildPkgAZ(sw, push) {
    var ind = '          ';
    var pushLines = (push && push.length)
      ? push.map(function(p) { return ind + '- service: ' + p; }).join('\n')
      : ind + '- service: mobile_app_smartphone';
    return _AZ_PKG_YAML.split('IL_TUO_SWITCH_AZ').join(sw || 'switch.presa_anti_zanzare');
  }

  function _openWizardAZ(hass, onDone) {
    var states = (hass && hass.states) || {};
    var switchIds = Object.keys(states).filter(function(id) { return /^switch\./.test(id); }).sort();
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(_AZ_WIZ_KEY) || 'null'); } catch(e) {}
    var pushRows = (saved && saved.push && saved.push.length) ? saved.push.slice() : [''];

    var host = document.createElement('div');
    var sr = host.attachShadow({mode: 'open'});
    document.body.appendChild(host);
    function destroy() { try { document.body.removeChild(host); } catch(e) {} }

    function setupAC(inp, drop, ids) {
      if (!inp || !drop) return;
      function show() {
        var q = inp.value.toLowerCase().trim();
        var hits = (q ? ids.filter(function(id) { return id.toLowerCase().includes(q); }) : ids).slice(0, 50);
        if (!hits.length) { drop.style.display = 'none'; return; }
        drop.innerHTML = hits.map(function(id) { return '<div class="wd-item" data-pick="' + id + '">' + id + '</div>'; }).join('');
        drop.style.display = 'block';
        drop.querySelectorAll('[data-pick]').forEach(function(row) {
          row.addEventListener('mousedown', function(ev) { ev.preventDefault(); inp.value = row.getAttribute('data-pick'); drop.style.display = 'none'; });
          row.addEventListener('mouseover', function() { row.style.background = 'rgba(255,255,255,.08)'; });
          row.addEventListener('mouseout', function() { row.style.background = ''; });
        });
      }
      inp.addEventListener('focus', show);
      inp.addEventListener('input', show);
      inp.addEventListener('blur', function() { setTimeout(function() { drop.style.display = 'none'; }, 200); });
    }

    function multiRows(rows, cls, placeholder) {
      return rows.map(function(v, i) {
        return '<div class="wd-push-row"><div style="position:relative;flex:1"><input class="wd-inp ' + cls + '" type="text" autocomplete="off" placeholder="' + placeholder + '" value="' + (v || '').replace(/"/g, '&quot;') + '"><div class="wd-drop"></div></div><button class="wd-rm" data-rm="' + i + '">✕</button></div>';
      }).join('');
    }

    function renderWiz() {
      var swVal = (saved && saved.sw) || '';
      sr.innerHTML = '<style>'
        + ':host{all:initial;font-family:system-ui,sans-serif}'
        + '.wd-bd{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:flex-end}'
        + '.wd-panel{width:100%;max-height:88vh;display:flex;flex-direction:column;background:#080f18;border:1px solid rgba(56,189,248,.3);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.8);color:#fff;overflow:hidden;animation:wUp .22s cubic-bezier(.32,1.12,.56,1)}'
        + '@keyframes wUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'
        + '.wd-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}'
        + '.wd-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.3);flex-shrink:0}'
        + '.wd-tit{font-size:14px;font-weight:800}.wd-sub{font-size:11px;color:rgba(255,255,255,.45);margin-top:1px}'
        + '.wd-x{margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none}'
        + '.wd-body{flex:1;overflow-y:auto;padding:16px;scrollbar-width:none;display:flex;flex-direction:column;gap:14px}'
        + '.wd-body::-webkit-scrollbar{display:none}'
        + '.wd-sec{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding-bottom:5px;border-bottom:1px solid rgba(56,189,248,.18);margin-bottom:10px}'
        + '.wd-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px}'
        + '.wd-frow{position:relative;margin-bottom:10px}'
        + '.wd-inp{width:100%;padding:9px 11px;border-radius:10px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.18);font-size:12px;font-family:monospace;box-sizing:border-box;outline:none}'
        + '.wd-inp:focus{border-color:rgba(56,189,248,.5)}'
        + '.wd-drop{position:absolute;left:0;right:0;top:100%;z-index:10;max-height:150px;overflow-y:auto;background:#0d1627;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 9px 9px;display:none}'
        + '.wd-item{padding:5px 10px;cursor:pointer;font-size:11px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0}'
        + '.wd-push-row{display:flex;gap:6px;margin-bottom:6px}'
        + '.wd-rm{width:30px;height:38px;border-radius:8px;background:rgba(255,255,255,.07);border:none;color:#fff;cursor:pointer;font-size:14px;flex-shrink:0}'
        + '.wd-add{padding:6px 12px;border-radius:8px;background:rgba(56,189,248,.1);border:1px solid rgba(56,189,248,.25);color:#38bdf8;font-size:11px;font-weight:700;cursor:pointer}'
        + '.wd-note{font-size:11px;color:rgba(255,255,255,.4);line-height:1.5;margin:0 0 10px}'
        + '.wd-foot{padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);display:flex;gap:8px;flex-shrink:0}'
        + '.wd-cancel{flex:1;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:700;font-size:13px;background:rgba(255,255,255,.1);color:#fff}'
        + '.wd-install{flex:2;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#38bdf8;color:#060d14}'
        + '.wd-loading{opacity:.6;pointer-events:none}'
        + '</style>'
        + '<div class="wd-bd" id="wd-bd"><div class="wd-panel">'
        + '<div class="wd-hdr"><div class="wd-ico">🦟</div>'
        + '<div><div class="wd-tit">Installa PKG Anti Zanzare</div><div class="wd-sub">frarik_antizanzare.yaml → config/packages/</div></div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'
        + '<div><div class="wd-sec">Switch Anti Zanzare</div>'
        + '<p class="wd-note">Switch/presa che controlla il dispositivo antizanzare (es. nebulizzatore, diffusore).</p>'
        + '<div class="wd-lbl">Entity Switch</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-switch" type="text" autocomplete="off" placeholder="switch.presa_anti_zanzare" value="' + swVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-switch"></div></div>'
        + '</div>'
        + '<div><div class="wd-sec">Notifiche Push</div>'
        + '<p class="wd-note">mobile_app dei dispositivi che ricevono le notifiche (es. <code>mobile_app_iphone</code>). Lascia vuoto per saltare.</p>'
        + '<div id="push-rows">' + multiRows(pushRows, 'push-inp', 'mobile_app_...') + '</div>'
        + '<button class="wd-add" id="push-add">+ Aggiungi dispositivo</button>'
        + '</div>'
        + '</div>'
        + '<div class="wd-foot">'
        + '<button class="wd-cancel" id="wd-cancel">Annulla</button>'
        + '<button class="wd-install" id="wd-install">📦 Installa PKG</button>'
        + '</div></div></div>';

      sr.getElementById('wd-x').addEventListener('click', destroy);
      sr.getElementById('wd-cancel').addEventListener('click', destroy);
      sr.getElementById('wd-bd').addEventListener('click', function(e) { if (e.target === sr.getElementById('wd-bd')) destroy(); });

      sr.getElementById('push-rows').addEventListener('click', function(e) {
        var btn = e.target.closest('[data-rm]'); if (!btn) return;
        pushRows.length = 0;
        Array.from(sr.querySelectorAll('.push-inp')).forEach(function(i) { pushRows.push(i.value); });
        pushRows.splice(+btn.dataset.rm, 1);
        if (!pushRows.length) pushRows.push('');
        renderWiz();
      });
      sr.getElementById('push-add').addEventListener('click', function() {
        Array.from(sr.querySelectorAll('.push-inp')).forEach(function(i, idx) { pushRows[idx] = i.value; });
        pushRows.push('');
        renderWiz();
      });

      setupAC(sr.getElementById('f-switch'), sr.getElementById('d-switch'), switchIds);

      sr.getElementById('wd-install').addEventListener('click', function() {
        var sw   = sr.getElementById('f-switch').value.trim();
        var push = Array.from(sr.querySelectorAll('.push-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        try { localStorage.setItem(_AZ_WIZ_KEY, JSON.stringify({sw: sw, push: push})); } catch(e) {}
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading'); btn.textContent = 'Installazione…';
        var yaml = _buildPkgAZ(sw, push);
        btn.textContent = 'Installazione…';
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_antizanzare.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Anti Zanzare installato! Riavvia HA.'); } catch(e) {}
              if (typeof onDone === 'function') onDone();
            } else {
              try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore installazione PKG: ' + ((res.j && res.j.error) || '')); } catch(e) {}
            }
          }).catch(function() {
            destroy();
            try { if (typeof window.showToast === 'function') window.showToast('⚠️ Errore connessione al PKG install'); } catch(e) {}
          });
      });
    }
    renderWiz();
  }

  // ── Store helpers v2.1 ───────────────────────────────────────────────
  function _azH() { try { return (typeof window.frarikHass === 'function' && window.frarikHass()) || {}; } catch(e) { return {}; } }
  function _azKey(c) { return 'frarik_azcard_' + (c.id || 'x'); }
  function _azLoad(c) { try { return JSON.parse(localStorage.getItem(_azKey(c)) || '{}') || {}; } catch(e) { return {}; } }
  function _azSave(c, o) { try { localStorage.setItem(_azKey(c), JSON.stringify(o)); } catch(e) {} }
  function _azS(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || null; }
  function _azAttr(h, id, a) { var s = h && h.states && h.states[id]; return (s && s.attributes && s.attributes[a] != null) ? s.attributes[a] : null; }
  function _azNum(v) { var x = parseFloat(String(v != null ? v : '').replace(',','.')); return isNaN(x) ? null : x; }
  function _azIsOn(h, id) { return !!(h && h.states && h.states[id] && h.states[id].state === 'on'); }

  function _azFmtTimer(h, tid) {
    if (_azS(h, tid) !== 'active') return {rem:'--:--', pct:0, active:false};
    var fa = _azAttr(h, tid, 'finishes_at'), dur = _azAttr(h, tid, 'duration');
    var remSec = fa ? Math.max(0, Math.floor((new Date(fa).getTime() - Date.now()) / 1000)) : 0;
    var durSec = 0;
    if (dur) { var p = String(dur).split(':').map(Number); durSec = (p[0]||0)*3600+(p[1]||0)*60+(p[2]||0); }
    var pct = durSec > 0 ? Math.max(0, Math.min(100, (remSec / durSec) * 100)) : 0;
    return {rem:('0'+Math.floor(remSec/60)).slice(-2)+':'+('0'+(remSec%60)).slice(-2), pct:pct, active:true, remSec:remSec, durSec:durSec};
  }

  function _azFmtProssimo(raw) {
    if (!raw || raw === 'N/D' || raw === '--') return null;
    var now = new Date(), target = null;
    var m = String(raw).match(/(\d{1,2}):(\d{2})/);
    if (m) {
      target = new Date(now);
      target.setHours(+m[1], +m[2], 0, 0);
      if (target.getTime() - now.getTime() < -60000) target.setDate(target.getDate() + 1);
    }
    if (!target) { try { var d = new Date(raw); if (!isNaN(d.getTime())) target = d; } catch(ex){} }
    if (!target) return { str: raw, pct: 0 };
    var diffMs = target.getTime() - now.getTime();
    if (diffMs < 0) return { str: raw, pct: 100 };
    var diffMin = Math.round(diffMs / 60000);
    var hr = Math.floor(diffMin / 60), mn = diffMin % 60;
    var str = hr > 0 ? 'tra ' + hr + 'h ' + (mn > 0 ? mn + 'm' : '') : 'tra ' + mn + 'm';
    var pct = Math.max(0, Math.min(100, 100 - (diffMin / (24 * 60)) * 100));
    return { str: str.trim(), pct: pct };
  }

  function _azPkgDef() {
    return {
      pk_prefix:          'frarik_antizanzare',
      pk_stato:           'sensor.frarik_antizanzare_stato_sistema',
      pk_auto:            'input_boolean.frarik_antizanzare_automazione_attiva',
      pk_manuale:         'input_boolean.frarik_antizanzare_manuale_attiva',
      pk_timer_ciclo:     'timer.frarik_antizanzare_ciclo_timer',
      pk_timer_manuale:   'timer.frarik_antizanzare_manuale_timer',
      pk_cicli_mensili:   'counter.frarik_antizanzare_cicli_mensili',
      pk_cicli_target:    'input_number.frarik_antizanzare_cicli_target_mensili',
      pk_pioggia:         'sensor.frarik_antizanzare_probabilita_pioggia',
      pk_pioggia_corso:   'binary_sensor.frarik_antizanzare_pioggia_corso',
      pk_blocco_meteo:    'binary_sensor.frarik_antizanzare_blocco_meteo',
      pk_consumo_acqua:   'sensor.frarik_antizanzare_consumo_acqua',
      pk_durata_manuale:  'input_number.frarik_antizanzare_durata_manuale',
      pk_soglia_pioggia:  'input_number.frarik_antizanzare_soglia_pioggia',
      pk_btn_auto_on:     'input_button.frarik_antizanzare_start_automazione',
      pk_btn_auto_off:    'input_button.frarik_antizanzare_stop_automazione',
      pk_btn_man_on:      'input_button.frarik_antizanzare_start_manuale',
      pk_btn_man_off:     'input_button.frarik_antizanzare_stop_manuale',
      pk_persona:         'binary_sensor.telecamera_giardino_dx_persona',
      pk_perdita:         'binary_sensor.sensore_perdita_cassetta_ant_zanzare',
      pk_prossimo:        'sensor.frarik_antizanzare_prossimo_ciclo_completo',
      pk_cicli_rim:       'sensor.frarik_antizanzare_cicli_rimanenti_mensili',
      pk_avanzamento:     'sensor.frarik_antizanzare_avanzamento_mensile',
      pk_auto_sic:        'automation.frarik_antizanzare_sicurezza_persona_rilevata',
      pk_vento:           '',
      pk_tanica:          '',
      pk_consumo_pompa:   '',
      pk_notifiche:       '',
    };
  }

  function _azCfgFor(card) {
    var st = _azLoad(card), pk = _azPkgDef(), r = {};
    Object.keys(pk).forEach(function(k) { r[k] = (st[k] !== undefined && st[k] !== '') ? st[k] : pk[k]; });
    r.name = st.name || 'Anti Zanzare';
    return r;
  }

  function _azDevSVG(stato, col, colRgb, timerRem, blocco) {
    var active = timerRem !== null;
    var glow = active
      ? 'drop-shadow(0 0 4px rgba(' + colRgb + ',1)) drop-shadow(0 0 16px rgba(' + colRgb + ',.65)) drop-shadow(0 0 40px rgba(' + colRgb + ',.28))'
      : (blocco ? 'drop-shadow(0 0 8px rgba(96,165,250,.5))' : 'drop-shadow(0 0 6px rgba(' + colRgb + ',.18))');
    var remTxt = active ? (timerRem || 'ATTIVO') : 'STAND';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 108" overflow="hidden" style="display:block;width:100%;height:100%;filter:' + glow + '">'
      + '<rect x="8" y="96" width="48" height="7" rx="3.5" fill="#090f1e" stroke="' + col + '" stroke-width=".5" opacity="' + (active ? '.85' : '.5') + '"/>'
      + '<rect x="14" y="24" width="34" height="72" rx="16" fill="' + (active ? 'rgba(' + colRgb + ',.06)' : '#0b1929') + '" stroke="' + col + '" stroke-width="' + (active ? '1.3' : '.85') + '"/>'
      + '<rect x="16" y="30" width="6" height="60" rx="3" fill="rgba(255,255,255,' + (active ? '.1' : '.04') + ')"/>'
      + (active ? '<rect x="15" y="40" width="32" height="56" rx="4" fill="rgba(' + colRgb + ',.22)"><animate attributeName="opacity" values=".22;.55;.22" dur="2.2s" repeatCount="indefinite"/></rect>' : '')
      + '<ellipse cx="31" cy="32" rx="15.5" ry="5" fill="' + (active ? 'rgba(' + colRgb + ',.22)' : '#0d2040') + '" stroke="rgba(' + colRgb + ',' + (active ? '.6' : '.12') + ')" stroke-width="' + (active ? '.9' : '.5') + '"/>'
      + '<ellipse cx="31" cy="88" rx="15.5" ry="4.5" fill="#090f1e" stroke="rgba(' + colRgb + ',' + (active ? '.35' : '.08') + ')" stroke-width=".5"/>'
      + '<text x="31" y="46" text-anchor="middle" font-size="5.5" fill="rgba(255,255,255,' + (active ? '.18' : '.07') + ')" font-family="system-ui,sans-serif" font-weight="800">4L</text>'
      + '<rect x="18" y="50" width="26" height="30" rx="4" fill="#060e1c" stroke="rgba(' + colRgb + ',' + (active ? '.5' : '.2') + ')" stroke-width="' + (active ? '.9' : '.6') + '"/>'
      + (active ? '<circle cx="31" cy="58" r="10" fill="none" stroke="' + col + '" stroke-width="1.5"><animate attributeName="r" values="7.5;14;7.5" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0;.6" dur="1.8s" repeatCount="indefinite"/></circle>' : '')
      + '<circle cx="31" cy="58" r="7.5" fill="#091526" stroke="' + col + '" stroke-width="' + (active ? '1.3' : '.85') + '"/>'
      + '<circle cx="31" cy="58" r="4.5" fill="#040a12"/>'
      + '<circle cx="31" cy="58" r="2.8" fill="' + col + '" opacity="' + (active ? '1' : '.35') + '">'
      + (active ? '<animate attributeName="r" values="2.8;4;2.8" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;1;.7" dur="1.4s" repeatCount="indefinite"/>' : '')
      + '</circle>'
      + '<rect x="19.5" y="68.5" width="23" height="6.5" rx="1.8" fill="#02060e" stroke="rgba(' + colRgb + ',' + (active ? '.55' : '.3') + ')" stroke-width=".5"/>'
      + '<text x="31" y="73.5" text-anchor="middle" font-size="4" font-weight="bold" font-family="monospace,system-ui" fill="' + col + '">' + remTxt + '</text>'
      + '<circle cx="31" cy="82" r="3" fill="#060e1c" stroke="rgba(' + colRgb + ',.15)" stroke-width=".6"/>'
      + '<circle cx="31" cy="82" r="1" fill="' + col + '" opacity=".4"/>'
      + '<rect x="43" y="22" width="5" height="10" rx="2.5" fill="#0b1929" stroke="' + (active ? col : '#1e3a5f') + '" stroke-width=".55"/>'
      + '<rect x="43" y="16" width="16" height="5.5" rx="2.75" fill="#0b1929" stroke="' + (active ? col : '#1e3a5f') + '" stroke-width=".55"/>'
      + '<ellipse cx="57" cy="18.75" rx="3" ry="6" fill="#0a1525" stroke="rgba(' + colRgb + ',' + (active ? '.75' : '.3') + ')" stroke-width="' + (active ? '1' : '.6') + '"/>'
      + '<line x1="45" y1="22" x2="45" y2="27" stroke="' + (active ? col : '#1e3a5f') + '" stroke-width="2" stroke-linecap="round"/>'
      + (active ? (
          '<g>'
        + '<line x1="59" y1="9" x2="64" y2="3" stroke="' + col + '" stroke-width="2.2" stroke-linecap="round"><animate attributeName="opacity" values="1;.05;1" dur="0.8s" repeatCount="indefinite"/></line>'
        + '<line x1="60.5" y1="17" x2="66" y2="14" stroke="' + col + '" stroke-width="1.8" stroke-linecap="round"><animate attributeName="opacity" values="1;.05;1" dur="1.0s" begin=".22s" repeatCount="indefinite"/></line>'
        + '<line x1="59" y1="25" x2="64" y2="30" stroke="' + col + '" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="1;.05;1" dur="0.75s" begin=".48s" repeatCount="indefinite"/></line>'
        + '<circle cx="63" cy="6" r="2.2" fill="' + col + '"><animate attributeName="r" values="1;3.5;1" dur="1.0s" begin=".08s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="1.0s" begin=".08s" repeatCount="indefinite"/></circle>'
        + '<circle cx="65" cy="16" r="1.8" fill="' + col + '"><animate attributeName="r" values="1;2.8;1" dur="1.2s" begin=".35s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0;.9" dur="1.2s" begin=".35s" repeatCount="indefinite"/></circle>'
        + '</g>'
      ) : '')
      + (blocco ? (
          '<g opacity=".85">'
        + '<line x1="7" y1="5" x2="5" y2="16" stroke="#60a5fa" stroke-width="1.6" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.88s" begin="0s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.85;.85;0" dur="0.88s" begin="0s" repeatCount="indefinite"/></line>'
        + '<line x1="19" y1="5" x2="17" y2="15" stroke="#93c5fd" stroke-width="1.2" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.76s" begin="0.18s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.75;.75;0" dur="0.76s" begin="0.18s" repeatCount="indefinite"/></line>'
        + '<line x1="31" y1="5" x2="29" y2="16" stroke="#60a5fa" stroke-width="1.4" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.95s" begin="0.38s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;.8;0" dur="0.95s" begin="0.38s" repeatCount="indefinite"/></line>'
        + '<line x1="44" y1="5" x2="42" y2="15" stroke="#bfdbfe" stroke-width="1.1" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.82s" begin="0.55s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.7;.7;0" dur="0.82s" begin="0.55s" repeatCount="indefinite"/></line>'
        + '<line x1="57" y1="5" x2="55" y2="16" stroke="#93c5fd" stroke-width="1.5" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="0.9s" begin="0.72s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;.8;0" dur="0.9s" begin="0.72s" repeatCount="indefinite"/></line>'
        + '<line x1="13" y1="5" x2="11" y2="14" stroke="#60a5fa" stroke-width="1" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="0,-20;0,115" dur="1.0s" begin="0.08s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.6;.6;0" dur="1.0s" begin="0.08s" repeatCount="indefinite"/></line>'
        + '</g>'
      ) : '')
      + '</svg>';
  }

  function _azRender(card) {
    var h = _azH(), c = _azCfgFor(card);
    var rid = 'fraz' + (card.id || 'az');
    var stato = _azS(h, c.pk_stato) || 'Spenta';
    var autoOn = _azIsOn(h, c.pk_auto), manOn = _azIsOn(h, c.pk_manuale);
    var blocco = _azIsOn(h, c.pk_blocco_meteo);
    var pioggiaCorsoBool = _azIsOn(h, c.pk_pioggia_corso);
    var timerC = _azFmtTimer(h, c.pk_timer_ciclo), timerM = _azFmtTimer(h, c.pk_timer_manuale);
    var cicliM = _azNum(_azS(h, c.pk_cicli_mensili)) || 0;
    var target = _azNum(_azS(h, c.pk_cicli_target)) || 100;
    var pioggia = _azNum(_azS(h, c.pk_pioggia)) || 0;
    var perdita = _azIsOn(h, c.pk_perdita);
    var prossimo = _azS(h, c.pk_prossimo) || '';
    var cicliRim = _azNum(_azS(h, c.pk_cicli_rim));
    var consumo = _azNum(_azS(h, c.pk_consumo_acqua));
    var vento = c.pk_vento ? _azNum(_azS(h, c.pk_vento)) : null;
    var tanica = c.pk_tanica ? _azNum(_azS(h, c.pk_tanica)) : null;
    var consumoPompa = c.pk_consumo_pompa ? _azNum(_azS(h, c.pk_consumo_pompa)) : consumo;
    var activeTimer = timerC.active ? timerC : timerM;
    var timerActive = timerC.active || timerM.active;
    var timerLabel = timerC.active ? 'CICLO' : 'MANUALE';
    var col = '#64748b', colRgb = '100,116,139', statusLabel = 'SPENTA';
    if (blocco)                              { col = '#f59e0b'; colRgb = '245,158,11';  statusLabel = 'METEO'; }
    else if (stato === 'Manuale Attiva')     { col = '#f97316'; colRgb = '249,115,22';  statusLabel = 'ACCESA'; }
    else if (stato === 'Ciclo in Corso')     { col = '#22c55e'; colRgb = '34,197,94';   statusLabel = 'ACCESA'; }
    else if (stato === 'Automazione Attiva') { col = '#06b6d4'; colRgb = '6,182,212';   statusLabel = 'ACCESA'; }
    var isAccesa = (autoOn || manOn || timerActive);
    var bgOpacity = isAccesa ? '.15' : '.07';

    var prossimoHtml = '';
    if (prossimo && !timerActive) {
      var fp = _azFmtProssimo(prossimo);
      if (fp) {
        prossimoHtml = '<div class="fc-met"><span class="fc-met-lbl">Prossimo</span><span class="fc-met-v" style="font-size:11px;color:' + col + '">' + fp.str + '</span></div>'
          + '<div style="height:3px;margin:1px 0 2px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden">'
          + '<div style="height:100%;width:' + fp.pct.toFixed(1) + '%;background:' + col + ';border-radius:2px"></div></div>';
      }
    } else if (!timerActive) {
      prossimoHtml = '<div class="fc-met"><span class="fc-met-lbl">Prob. pioggia</span><span class="fc-met-v" style="color:' + (pioggia > 50 ? '#f59e0b' : '#fff') + '">' + pioggia.toFixed(0) + '%</span></div>';
    }

    var css = '<style>'
      + '@keyframes azPulse{0%,100%{opacity:.6}50%{opacity:1}}'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:260px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#08101a 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:180px;background:radial-gradient(ellipse at 20% 0%,rgba(' + colRgb + ',' + bgOpacity + ') 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:10px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.28);color:' + col + '}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + col + (timerActive ? ';animation:azPulse 1.5s ease-in-out infinite' : '') + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:9px 14px 7px}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;max-height:120px}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:5px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px}'
      + '#' + rid + ' .fc-met{display:flex;align-items:center;justify-content:space-between;gap:4px}'
      + '#' + rid + ' .fc-met-lbl{font-size:11px;font-weight:700;color:#fff;flex-shrink:0}'
      + '#' + rid + ' .fc-met-v{font-size:14px;font-weight:800;color:#fff;text-align:right}'
      + '#' + rid + ' .fc-tmr-v{font-size:22px;font-weight:900;color:' + col + ';font-variant-numeric:tabular-nums;letter-spacing:-.02em;text-align:right}'
      + '#' + rid + ' .fc-tmr-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#fff;text-align:right}'
      + '#' + rid + ' .fc-grid{display:flex;margin:0 10px 7px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden}'
      + '#' + rid + ' .fc-gc{flex:1;display:flex;flex-direction:column;align-items:center;padding:7px 2px;gap:2px;min-width:0}'
      + '#' + rid + ' .fc-gc-sep{width:1px;background:rgba(255,255,255,.07);flex-shrink:0}'
      + '#' + rid + ' .fc-gc-ico{font-size:14px;line-height:1}'
      + '#' + rid + ' .fc-gc-v{font-size:11px;font-weight:800;color:#fff;text-align:center;white-space:nowrap}'
      + '#' + rid + ' .fc-gc-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.03em;text-align:center}'
      + '#' + rid + ' .fc-row{display:flex;gap:5px;padding:0 10px 7px}'
      + '#' + rid + ' .fc-pill{flex:1;display:flex;align-items:center;gap:5px;padding:5px 7px;border-radius:8px;min-width:0}'
      + '#' + rid + ' .fc-pill-ico{font-size:13px;flex-shrink:0}'
      + '#' + rid + ' .fc-pill-lbl{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase}'
      + '#' + rid + ' .fc-pill-v{font-size:11px;font-weight:800;color:#fff}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 11px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:3px}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(' + colRgb + ',.12);border-color:rgba(' + colRgb + ',.3);color:' + col + '}'
      + '#' + rid + ' .fc-btn-act{background:rgba(' + colRgb + ',.15);border-color:rgba(' + colRgb + ',.35);color:' + col + '}'
      + '</style>';

    // Hero right column — no duplicate status (already in header pill)
    var heroR = '<div class="fc-hero-r">'
      + (timerActive
          ? '<div class="fc-tmr-lbl">' + timerLabel + ' IN CORSO</div><div id="' + rid + '-tt2" class="fc-tmr-v">' + activeTimer.rem + '</div>'
          : '')
      + '<div class="fc-met"><span class="fc-met-lbl">Cicli mese</span><span class="fc-met-v">' + cicliM + ' / ' + target + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Rimanenti</span><span class="fc-met-v" style="color:' + (cicliRim !== null && cicliRim <= 5 ? '#f59e0b' : '#fff') + '">' + (cicliRim !== null ? cicliRim : Math.max(0, target - cicliM)) + '</span></div>'
      + prossimoHtml
      + '</div>';

    var heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img">' + _azDevSVG(stato, col, colRgb, timerActive ? activeTimer.rem : null, blocco) + '</div>'
      + heroR + '</div>';

    // Timer countdown bar — aggiornata via DOM tick (no CSS animation, no re-render jitter)
    var timerBarHtml = '';
    if (timerActive && activeTimer.durSec > 0) {
      var initPct = activeTimer.pct.toFixed(2);
      timerBarHtml = '<div style="padding:0 14px 8px">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'
        + '<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#fff">' + timerLabel + ' in corso</span>'
        + '<span id="' + rid + '-tt" style="font-size:13px;font-weight:900;color:#00b4ff;font-variant-numeric:tabular-nums">' + activeTimer.rem + '</span>'
        + '</div>'
        + '<div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">'
        + '<div id="' + rid + '-tb" style="height:100%;background:#00b4ff;border-radius:3px;box-shadow:0 0 10px #00b4ff99;width:' + initPct + '%;transition:width .25s linear"></div>'
        + '</div></div>';
    }

    // Sensor grid: Vento / Tanica / Consumo / Pioggia
    function gc(ico, val, lbl, vc) {
      return '<div class="fc-gc">'
        + '<div class="fc-gc-ico">' + ico + '</div>'
        + '<div class="fc-gc-v" style="color:' + (vc||'#fff') + '">' + val + '</div>'
        + '<div class="fc-gc-l">' + lbl + '</div>'
        + '</div>';
    }
    var ventoDsp = vento !== null ? vento.toFixed(0) + ' m/s' : (c.pk_vento ? '--' : 'N/D');
    var pioggiaCol = pioggiaCorsoBool ? '#f59e0b' : '#22c55e';
    var meteoCol = blocco ? '#f59e0b' : '#22c55e';
    var sensorGrid = '<div class="fc-grid">'
      + gc('💨', ventoDsp, 'Vento', vento !== null && vento > 10 ? '#f59e0b' : '#fff')
      + '<div class="fc-gc-sep"></div>'
      + gc('🌧', pioggiaCorsoBool ? 'Sì' : 'No', 'Pioggia', pioggiaCol)
      + '<div class="fc-gc-sep"></div>'
      + gc('🌂', pioggia.toFixed(0) + '%', 'Prob.pioggia', pioggia > 50 ? '#f59e0b' : '#fff')
      + '<div class="fc-gc-sep"></div>'
      + gc(blocco ? '⛈' : '☀️', blocco ? 'Bloccato' : 'OK', 'Meteo', meteoCol)
      + '</div>';

    // Status pills row: prob. pioggia / blocco meteo / perdita cassetta
    function pill(ico, lbl, val, bg, bd, vc, sya) {
      return '<div class="fc-pill" style="background:' + bg + ';border:1px solid ' + bd + ';' + (sya?'cursor:pointer':'') + '"'
        + (sya?' data-sya="'+sya+'"':'') + '>'
        + '<div class="fc-pill-ico">' + ico + '</div>'
        + '<div style="min-width:0"><div class="fc-pill-lbl">' + lbl + '</div><div class="fc-pill-v" style="color:' + vc + '">' + val + '</div></div>'
        + '</div>';
    }
    var pompaDsp = consumoPompa !== null ? consumoPompa.toFixed(0) + ' W' : (c.pk_consumo_pompa ? '--' : 'N/D');
    var tanicaDsp = tanica !== null ? tanica.toFixed(0) + '%' : (c.pk_tanica ? '--' : 'N/D');
    var tanicaCol = tanica !== null && tanica < 20 ? '#ef4444' : (tanica !== null && tanica < 40 ? '#f59e0b' : '#fff');
    var statusRow = '<div class="fc-row">'
      + pill(perdita ? '🚨' : '💧', 'Allagamento', perdita ? '⚠ Perdita' : 'OK',
          perdita ? 'rgba(239,68,68,.08)' : 'rgba(255,255,255,.03)',
          perdita ? 'rgba(239,68,68,.25)' : 'rgba(255,255,255,.07)',
          perdita ? '#ef4444' : '#22c55e')
      + pill('⚡', 'Pompa', pompaDsp, 'rgba(255,255,255,.03)', 'rgba(255,255,255,.07)', col)
      + pill('🪣', 'Livello acqua', tanicaDsp, 'rgba(255,255,255,.03)', 'rgba(255,255,255,.07)', tanicaCol)
      + '</div>';

    var manStyle = manOn
      ? 'background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.4);color:#ef4444'
      : 'background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.3);color:#22c55e';
    var autoStyle = autoOn
      ? 'background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.4);color:#ef4444'
      : 'background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.3);color:#22c55e';
    var btnsHtml = '<div class="fc-btns">'
      + '<div class="fc-btn" style="' + manStyle + '" data-sya="' + (manOn?'man-off':'man-on') + '">' + (manOn?'⏹ Ferma':'▶ Manuale') + '</div>'
      + '<div class="fc-btn" style="' + autoStyle + '" data-sya="' + (autoOn?'auto-off':'auto-on') + '">' + (autoOn?'⏹ Ferma Auto':'▶ Auto') + '</div>'
      + '<div class="fc-btn" data-sya="popup-cfg" style="flex:0.55">⚙</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '"><div class="fc-card">'
      + '<div class="fc-hdr"><div class="fc-hdr-iw">🦟</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'Anti Zanzare') + '</div>'
      + '<div class="fc-hdr-pill"><div class="fc-dot"></div>' + statusLabel + '</div></div>'
      + '<div class="fc-scroll">' + heroHtml + timerBarHtml + sensorGrid + statusRow + btnsHtml + '</div>'
      + '</div></div>';
  }

  function _azMkOv(html, closeId) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px)';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    var close = function() { try { document.body.removeChild(ov); } catch(e) {} };
    var btn = ov.querySelector('#' + closeId); if (btn) btn.addEventListener('click', close);
    ov.addEventListener('click', function(e) { if (e.target === ov) close(); });
    ov._close = close;
    return ov;
  }

  function _azPopShell(icon, rgb, title, sub, closeId, content) {
    return '<style>@keyframes azUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.azpc{overflow-y:auto;scrollbar-width:none}.azpc::-webkit-scrollbar{display:none}</style>'
      + '<div style="width:100%;max-height:78vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + rgb + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:azUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.3)">' + icon + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#fff">' + title + '</div><div style="font-size:11px;color:#fff;margin-top:1px">' + sub + '</div></div>'
      + '<button id="' + closeId + '" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      + '</div>'
      + '<div class="azpc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }

  function _azOpenProgramma(card, el) {
    var h = _azH(), c = _azCfgFor(card);
    var prefix = c.pk_prefix || 'anti_zanzare';
    var dayIds = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dayLabels = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
    var col = '#22c55e', rgb = '34,197,94';
    var dayRows = dayIds.map(function(d, i) {
      var isOn = _azIsOn(h, 'input_boolean.' + prefix + '_' + d);
      var nC = Math.round(_azNum(_azS(h, 'input_number.' + prefix + '_' + d + '_num_cicli')) || 0);
      var times = [];
      for (var ci = 1; ci <= Math.min(nC, 5); ci++) {
        var t = _azS(h, 'input_datetime.' + prefix + '_' + d + '_orario_ciclo' + ci) || '';
        if (t) times.push(t.slice(0, 5));
      }
      var pillBg = isOn && nC > 0 ? 'rgba(' + rgb + ',.07)' : 'rgba(255,255,255,.03)';
      var pillBd = isOn && nC > 0 ? 'rgba(' + rgb + ',.22)' : 'rgba(255,255,255,.07)';
      var badge = nC > 0
        ? '<span style="background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.3);border-radius:10px;padding:2px 8px;font-size:10px;font-weight:800;color:' + col + '">' + nC + ' cicl' + (nC===1?'o':'i') + '</span>'
        : '<span style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:2px 8px;font-size:10px;font-weight:600;color:#475569">nessuno</span>';
      return '<div style="background:' + pillBg + ';border:1px solid ' + pillBd + ';border-radius:14px;padding:10px 12px;margin-bottom:7px">'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<span style="font-size:12px;font-weight:700;color:#fff;flex:1">' + dayLabels[i] + '</span>'
        + badge
        + '<div class="az-dtog" data-eid="input_boolean.' + prefix + '_' + d + '" data-on="' + (isOn?'1':'0') + '" '
        + 'style="width:36px;height:20px;border-radius:10px;flex-shrink:0;cursor:pointer;background:' + (isOn?col:'rgba(255,255,255,.15)') + ';position:relative;transition:background .2s">'
        + '<div style="position:absolute;top:2px;' + (isOn?'right:2px':'left:2px') + ';width:16px;height:16px;border-radius:50%;background:#fff;transition:all .2s"></div>'
        + '</div>'
        + '</div>'
        + (isOn ? '<div style="display:flex;align-items:center;gap:6px;margin-top:7px">'
          + (times.length ? '<span style="font-size:10px;color:rgba(255,255,255,.45);flex:1">' + times.join(' · ') + '</span>' : '<span style="flex:1"></span>')
          + '<button class="az-dedit" data-day="' + d + '" style="padding:4px 10px;border-radius:8px;border:1px solid rgba(' + rgb + ',.3);background:rgba(' + rgb + ',.1);font-size:10px;font-weight:700;color:' + col + ';cursor:pointer">✏ Modifica cicli</button>'
          + '</div>' : '')
        + '</div>';
    }).join('');
    var content = dayRows
      + '<button id="azpm-ok" style="width:100%;padding:10px;border-radius:11px;border:1px solid rgba(255,255,255,.12);cursor:pointer;font-weight:700;font-size:13px;background:rgba(255,255,255,.07);color:#fff;margin-top:4px">Chiudi</button>';
    var ov = _azMkOv(_azPopShell('📅',rgb,'Programma Settimanale','Attiva giorni e configura orari cicli','az-pm-cl',content),'az-pm-cl');
    ov.querySelector('#azpm-ok').addEventListener('click', function() { ov._close(); if (el) el._fcSig = null; });
    ov.querySelectorAll('.az-dtog').forEach(function(tog) {
      tog.addEventListener('click', function() {
        var wasOn = tog.dataset.on === '1';
        _azCallSvc('input_boolean', wasOn?'turn_off':'turn_on', {entity_id:tog.dataset.eid});
        tog.dataset.on = wasOn ? '0' : '1';
        tog.style.background = wasOn ? 'rgba(255,255,255,.15)' : col;
        var k = tog.querySelector('div'); if (k) { k.style.right = wasOn?'':'2px'; k.style.left = wasOn?'2px':''; }
      });
    });
    ov.querySelectorAll('.az-dedit').forEach(function(btn) {
      btn.addEventListener('click', function() { _azOpenDayDetail(card, btn.dataset.day, prefix, el); });
    });
  }

  function _azOpenDayDetail(card, day, prefix, el) {
    var h = _azH();
    var lbl = {lunedi:'Lunedì',martedi:'Martedì',mercoledi:'Mercoledì',giovedi:'Giovedì',venerdi:'Venerdì',sabato:'Sabato',domenica:'Domenica'}[day]||day;
    var nC = Math.round(_azNum(_azS(h,'input_number.'+prefix+'_'+day+'_num_cicli'))||0);
    var col = '#22c55e', rgb = '34,197,94';
    function fmtDv(v) { var m=Math.floor(v/60),s=v%60; return v>=60?(m+'min'+(s?' '+s+'s':'')):(v+'s'); }
    var rows = '';
    for (var i = 1; i <= 5; i++) {
      var tv = (_azS(h,'input_datetime.'+prefix+'_'+day+'_orario_ciclo'+i)||'07:00:00').slice(0,5);
      var dv = Math.round(_azNum(_azS(h,'input_number.'+prefix+'_'+day+'_durata_ciclo'+i))||60);
      var active = i <= nC;
      var pillBg = active ? 'rgba('+rgb+',.06)' : 'rgba(255,255,255,.03)';
      var pillBd = active ? 'rgba('+rgb+',.2)' : 'rgba(255,255,255,.06)';
      var badgeBg = active ? 'rgba('+rgb+',.15)' : 'rgba(255,255,255,.06)';
      var badgeBd = active ? 'rgba('+rgb+',.3)' : 'rgba(255,255,255,.1)';
      var cycleCol = active ? col : '#374151';
      var dim = active ? '' : 'opacity:0.28;pointer-events:none;';
      rows += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:'+pillBg+';border:1px solid '+pillBd+';margin-bottom:6px;'+dim+'">'
        + '<span style="font-size:10px;font-weight:800;color:'+cycleCol+';background:'+badgeBg+';border:1px solid '+badgeBd+';border-radius:6px;padding:2px 7px;flex-shrink:0">C'+i+'</span>'
        + '<input type="time" value="'+tv+'" id="azdd-t'+i+'" style="flex:1;padding:5px 7px;border-radius:8px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:13px;outline:none;min-width:0">'
        + '<div style="display:flex;align-items:center;gap:3px;flex-shrink:0">'
        + '<button id="azdd-dm'+i+'" style="width:24px;height:24px;border-radius:6px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>'
        + '<span id="azdd-dv'+i+'" style="font-size:10px;font-weight:700;color:#f1f5f9;min-width:42px;text-align:center">'+fmtDv(dv)+'</span>'
        + '<button id="azdd-dp'+i+'" style="width:24px;height:24px;border-radius:6px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>'
        + '<input type="hidden" id="azdd-d'+i+'" value="'+dv+'">'
        + '</div>'
        + '</div>';
    }
    var content = '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 12px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:10px">'
      + '<span style="font-size:12px;font-weight:600;color:#fff">Cicli attivi (0–5)</span>'
      + '<div style="display:flex;align-items:center;gap:7px">'
      + '<button id="azdd-ncm" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:17px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>'
      + '<span id="azdd-ncv" style="font-size:20px;font-weight:800;color:'+col+';min-width:28px;text-align:center">'+nC+'</span>'
      + '<input type="hidden" id="azdd-nc" value="'+nC+'">'
      + '<button id="azdd-ncp" style="width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:17px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>'
      + '</div>'
      + '</div>'
      + rows
      + '<button id="azdd-save" style="width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:'+col+';color:#022c1b;margin-top:8px">💾 Salva '+lbl+'</button>';
    var ov2 = _azMkOv(_azPopShell('📅',rgb,lbl,'Orari e durate cicli','azdd-cl',content),'azdd-cl');
    var ncInput = ov2.querySelector('#azdd-nc'), ncDisp = ov2.querySelector('#azdd-ncv');
    ov2.querySelector('#azdd-ncm').addEventListener('click', function() {
      var v = Math.max(0, parseInt(ncInput.value)-1); ncInput.value=v; ncDisp.textContent=v;
    });
    ov2.querySelector('#azdd-ncp').addEventListener('click', function() {
      var v = Math.min(5, parseInt(ncInput.value)+1); ncInput.value=v; ncDisp.textContent=v;
    });
    for (var j = 1; j <= 5; j++) {
      (function(ci) {
        var dHid = ov2.querySelector('#azdd-d'+ci), dDisp = ov2.querySelector('#azdd-dv'+ci);
        var dmBtn = ov2.querySelector('#azdd-dm'+ci), dpBtn = ov2.querySelector('#azdd-dp'+ci);
        if (dmBtn) dmBtn.addEventListener('click', function() {
          var v = Math.max(10, parseInt(dHid.value)-10); dHid.value=v; dDisp.textContent=fmtDv(v);
        });
        if (dpBtn) dpBtn.addEventListener('click', function() {
          var v = Math.min(3600, parseInt(dHid.value)+10); dHid.value=v; dDisp.textContent=fmtDv(v);
        });
      })(j);
    }
    ov2.querySelector('#azdd-save').addEventListener('click', function() {
      var h2 = _azH();
      var ncv = parseInt(ncInput.value)||0;
      if (h2&&h2.callService) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_'+day+'_num_cicli',value:ncv});
      for (var k = 1; k <= 5; k++) {
        var ti = ov2.querySelector('#azdd-t'+k), di = ov2.querySelector('#azdd-d'+k);
        if (ti&&ti.value&&h2&&h2.callService) h2.callService('input_datetime','set_datetime',{entity_id:'input_datetime.'+prefix+'_'+day+'_orario_ciclo'+k,time:ti.value+':00'});
        if (di&&di.value&&h2&&h2.callService) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_'+day+'_durata_ciclo'+k,value:parseFloat(di.value)});
      }
      ov2._close();
      if (el) el._fcSig = null;
    });
  }

  function _azOpenUserCfg(card, el) {
    var h = _azH(), c = _azCfgFor(card);
    var prefix = c.pk_prefix || 'frarik_antizanzare';
    var autoOn  = _azIsOn(h, c.pk_auto);
    var sicOn   = !c.pk_auto_sic || _azS(h, c.pk_auto_sic) !== 'off';
    var notifEntity = c.pk_notifiche || 'input_boolean.frarik_antizanzare_notifiche';
    var notifOn = _azIsOn(h, notifEntity);
    var durM    = Math.round(_azNum(_azS(h, c.pk_durata_manuale)) || 60);
    var soglia  = Math.round(_azNum(_azS(h, c.pk_soglia_pioggia)) || 50);
    var tarMens = Math.round(_azNum(_azS(h, c.pk_cicli_target)) || 100);
    var dayIds  = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dayLbls = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
    var dayShrt = ['LUN','MAR','MER','GIO','VEN','SAB','DOM'];

    function sec(t) { return '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#22c55e;padding-bottom:5px;border-bottom:1px solid rgba(34,197,94,.18);margin:14px 0 10px">' + t + '</div>'; }
    function numRow(id, label, val, unit, min, max, step) {
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
        + '<span style="font-size:11px;color:#fff;flex:1">' + label + '</span>'
        + '<input id="azuc-' + id + '" type="number" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" style="width:80px;padding:6px 9px;border-radius:7px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:13px;outline:none;text-align:right">'
        + '<span style="font-size:10px;color:rgba(255,255,255,.4);width:32px;flex-shrink:0">' + unit + '</span>'
        + '</div>';
    }
    function togBtn(id, label, isOn, col) {
      var onC = col || '34,197,94';
      return '<div id="' + id + '" data-on="' + (isOn?'1':'0') + '" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:8px 4px;border-radius:9px;'
        + 'background:rgba(' + (isOn?onC:'100,116,139') + ',.1);border:1px solid rgba(' + (isOn?onC:'100,116,139') + ',' + (isOn?'.35':'.15') + ');transition:all .2s">'
        + '<div style="font-size:18px">' + (isOn ? '✅' : '⭕') + '</div>'
        + '<div style="font-size:10px;font-weight:800;color:' + (isOn?'rgb('+onC+')':'rgba(255,255,255,.35)') + '">' + label + '</div>'
        + '<div class="azuc-tov" style="font-size:9px;font-weight:700;color:' + (isOn?'#fff':'rgba(255,255,255,.25)') + '">' + (isOn?'ON':'OFF') + '</div>'
        + '</div>';
    }

    // Schedule section — one row per day
    var schedHtml = dayIds.map(function(d, i) {
      var isOn = _azIsOn(h, 'input_boolean.' + prefix + '_' + d);
      var nc = Math.round(_azNum(_azS(h, 'input_number.' + prefix + '_' + d + '_num_cicli')) || 0);
      var times = [];
      for (var ci = 1; ci <= 5; ci++) {
        times.push((_azS(h, 'input_datetime.' + prefix + '_' + d + '_orario_ciclo' + ci) || '07:00:00').slice(0,5));
      }
      var timeInputs = '';
      for (var ti2 = 0; ti2 < 5; ti2++) {
        var active = ti2 < nc;
        timeInputs += '<input type="time" id="azs-t-' + d + '-' + (ti2+1) + '" value="' + times[ti2] + '"'
          + ' style="flex:1;min-width:0;padding:4px 4px;border-radius:6px;background:#0b1422;color:' + (active?'#f1f5f9':'rgba(255,255,255,.2)') + ';'
          + 'border:1px solid rgba(255,255,255,' + (active?'.15':'.06') + ');font-size:11px;outline:none"'
          + (active ? '' : ' disabled') + '>';
      }
      return '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:8px 10px;margin-bottom:7px">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'
        + '<div id="azs-tog-' + d + '" data-on="' + (isOn?'1':'0') + '" data-day="' + d + '"'
        + ' style="width:34px;height:19px;border-radius:10px;flex-shrink:0;cursor:pointer;background:' + (isOn?'#22c55e':'rgba(255,255,255,.15)') + ';position:relative;transition:background .2s">'
        + '<div style="position:absolute;top:2px;' + (isOn?'right:2px':'left:2px') + ';width:15px;height:15px;border-radius:50%;background:#fff;transition:all .2s"></div>'
        + '</div>'
        + '<span style="font-size:12px;font-weight:700;color:#fff;flex:1">' + dayLbls[i] + '</span>'
        + '<div style="display:flex;align-items:center;gap:4px">'
        + '<button id="azs-ncm-' + d + '" style="width:22px;height:22px;border-radius:6px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700">−</button>'
        + '<span id="azs-ncv-' + d + '" style="font-size:14px;font-weight:800;color:#22c55e;min-width:18px;text-align:center">' + nc + '</span>'
        + '<input type="hidden" id="azs-nc-' + d + '" value="' + nc + '">'
        + '<button id="azs-ncp-' + d + '" style="width:22px;height:22px;border-radius:6px;border:none;background:rgba(255,255,255,.08);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700">+</button>'
        + '<span style="font-size:10px;color:rgba(255,255,255,.35);margin-left:2px">cicli</span>'
        + '</div></div>'
        + '<div id="azs-times-' + d + '" style="display:flex;gap:4px;' + (nc===0?'display:none':'') + '">' + timeInputs + '</div>'
        + '</div>';
    }).join('');

    function sensorFld(id, label, ph, val) {
      return '<div style="position:relative;margin-bottom:8px">'
        + '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.4);margin-bottom:3px">' + label + '</div>'
        + '<input id="' + id + '" type="text" autocomplete="off" placeholder="' + ph + '" value="' + (val||'').replace(/"/g,'&quot;') + '"'
        + ' style="width:100%;padding:7px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:11px;font-family:monospace;box-sizing:border-box;outline:none">'
        + '<div id="' + id + '-drop" style="display:none;position:absolute;top:100%;left:0;right:0;background:#0b1422;border:1px solid rgba(255,255,255,.18);border-top:none;border-radius:0 0 9px 9px;z-index:300;max-height:140px;overflow-y:auto"></div>'
        + '</div>';
    }

    var content = sec('Automazione & Sicurezza')
      + '<div style="display:flex;gap:8px;margin-bottom:6px">'
      + togBtn('azuc-tog-auto', 'Automazione', autoOn)
      + togBtn('azuc-tog-sic', 'Sicurezza', sicOn, '6,182,212')
      + togBtn('azuc-tog-ntf', 'Notifiche', notifOn, '168,85,247')
      + '</div>'
      + sec('Programma Settimanale')
      + schedHtml
      + sec('Soglie & Durate')
      + numRow('sog', 'Soglia blocco pioggia', soglia, '%', 0, 100, 5)
      + numRow('dur', 'Durata avvio manuale', durM, 'sec', 10, 7200, 10)
      + numRow('tar', 'Target cicli mensili', tarMens, 'cicli', 1, 999, 1)
      + sec('Sensori Opzionali')
      + sensorFld('azuc-vento-id',  'Velocità vento (m/s)',  'sensor.velocita_vento',         c.pk_vento||'')
      + sensorFld('azuc-tanica-id', 'Livello tanica (%)',    'sensor.livello_tanica',          c.pk_tanica||'')
      + sensorFld('azuc-pompa-id',  'Consumo pompa (L)',     'sensor.consumo_pompa',           c.pk_consumo_pompa||'')
      + '<button id="azuc-save" style="width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#22c55e;color:#022c1b;margin-top:4px">💾 Salva tutto</button>';

    var ov = _azMkOv(_azPopShell('⚙','34,197,94','Impostazioni',c.name||'Anti Zanzare','azuc-cl',content),'azuc-cl');

    // Toggle buttons (auto, sicurezza, notifiche)
    ['azuc-tog-auto','azuc-tog-sic','azuc-tog-ntf'].forEach(function(tid) {
      var tb = ov.querySelector('#' + tid); if (!tb) return;
      tb.addEventListener('click', function() {
        var wasOn = tb.dataset.on === '1';
        var nowOn = !wasOn;
        tb.dataset.on = nowOn ? '1' : '0';
        var onC = tid === 'azuc-tog-sic' ? '6,182,212' : tid === 'azuc-tog-ntf' ? '168,85,247' : '34,197,94';
        tb.style.background = 'rgba(' + (nowOn?onC:'100,116,139') + ',.1)';
        tb.style.borderColor = 'rgba(' + (nowOn?onC:'100,116,139') + ',' + (nowOn?'.35':'.15') + ')';
        tb.querySelector('div:first-child').textContent = nowOn ? '✅' : '⭕';
        tb.querySelector('div:nth-child(2)').style.color = nowOn ? 'rgb('+onC+')' : 'rgba(255,255,255,.35)';
        var tv2 = tb.querySelector('.azuc-tov'); if(tv2){ tv2.textContent = nowOn?'ON':'OFF'; tv2.style.color = nowOn?'#fff':'rgba(255,255,255,.25)'; }
      });
    });

    // Schedule toggles (day on/off)
    ov.querySelectorAll('[id^="azs-tog-"]').forEach(function(tog) {
      tog.addEventListener('click', function() {
        var wasOn = tog.dataset.on === '1';
        tog.dataset.on = wasOn ? '0' : '1';
        tog.style.background = wasOn ? 'rgba(255,255,255,.15)' : '#22c55e';
        var k2 = tog.querySelector('div'); if(k2){ k2.style.right=wasOn?'':' 2px'; k2.style.left=wasOn?'2px':''; }
      });
    });

    // Schedule num cicli +/-
    dayIds.forEach(function(d) {
      var ncH = ov.querySelector('#azs-nc-' + d);
      var ncV = ov.querySelector('#azs-ncv-' + d);
      var timesDiv = ov.querySelector('#azs-times-' + d);
      function updateTimes(nc) {
        if (!timesDiv) return;
        timesDiv.style.display = nc === 0 ? 'none' : 'flex';
        for (var i2 = 1; i2 <= 5; i2++) {
          var ti3 = ov.querySelector('#azs-t-' + d + '-' + i2); if(!ti3) continue;
          var act = i2 <= nc;
          ti3.disabled = !act;
          ti3.style.color = act ? '#f1f5f9' : 'rgba(255,255,255,.2)';
          ti3.style.borderColor = 'rgba(255,255,255,' + (act?'.15':'.06') + ')';
        }
      }
      var ncmBtn = ov.querySelector('#azs-ncm-' + d), ncpBtn = ov.querySelector('#azs-ncp-' + d);
      if (ncmBtn) ncmBtn.addEventListener('click', function() { var v=Math.max(0,parseInt(ncH.value)-1); ncH.value=v; if(ncV) ncV.textContent=v; updateTimes(v); });
      if (ncpBtn) ncpBtn.addEventListener('click', function() { var v=Math.min(5,parseInt(ncH.value)+1); ncH.value=v; if(ncV) ncV.textContent=v; updateTimes(v); });
    });

    // Autocomplete sensori
    function azAC(inpId) {
      var inp = ov.querySelector('#' + inpId);
      var drop = ov.querySelector('#' + inpId + '-drop');
      if (!inp || !drop) return;
      inp.addEventListener('input', function() {
        var q = inp.value.toLowerCase().trim();
        drop.innerHTML = '';
        if (q.length < 2) { drop.style.display = 'none'; return; }
        var sts = (_azH().states) || {};
        var matches = Object.keys(sts).filter(function(k) { return k.toLowerCase().indexOf(q) !== -1; }).sort().slice(0, 8);
        if (!matches.length) { drop.style.display = 'none'; return; }
        matches.forEach(function(m) {
          var row = document.createElement('div');
          row.textContent = m;
          row.style.cssText = 'padding:6px 10px;font-size:11px;font-family:monospace;color:#94a3b8;cursor:pointer';
          row.addEventListener('mouseover', function() { row.style.background='rgba(255,255,255,.07)'; row.style.color='#f1f5f9'; });
          row.addEventListener('mouseout',  function() { row.style.background=''; row.style.color='#94a3b8'; });
          row.addEventListener('mousedown', function(e) { e.preventDefault(); inp.value=m; drop.style.display='none'; });
          drop.appendChild(row);
        });
        drop.style.display = 'block';
      });
      inp.addEventListener('blur', function() { setTimeout(function() { drop.style.display = 'none'; }, 200); });
    }
    azAC('azuc-vento-id');
    azAC('azuc-tanica-id');
    azAC('azuc-pompa-id');
    // Save
    ov.querySelector('#azuc-save').addEventListener('click', function() {
      var h2 = _azH();
      // Soglie → HA
      var sv = (ov.querySelector('#azuc-sog')||{}).value;
      var dv = (ov.querySelector('#azuc-dur')||{}).value;
      var tv = (ov.querySelector('#azuc-tar')||{}).value;
      if (sv && h2 && h2.callService) h2.callService('input_number','set_value',{entity_id:c.pk_soglia_pioggia,value:parseFloat(sv)});
      if (dv && h2 && h2.callService) h2.callService('input_number','set_value',{entity_id:c.pk_durata_manuale,value:parseFloat(dv)});
      if (tv && h2 && h2.callService) h2.callService('input_number','set_value',{entity_id:c.pk_cicli_target,value:parseFloat(tv)});
      // Schedule → HA
      dayIds.forEach(function(d) {
        var togEl = ov.querySelector('#azs-tog-' + d);
        var ncEl = ov.querySelector('#azs-nc-' + d);
        var isOn = togEl ? togEl.dataset.on === '1' : false;
        var nc = parseInt(ncEl ? ncEl.value : 0) || 0;
        if (h2 && h2.callService) {
          h2.callService('input_boolean', isOn?'turn_on':'turn_off', {entity_id:'input_boolean.'+prefix+'_'+d});
          h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_'+d+'_num_cicli',value:nc});
          for (var ci2 = 1; ci2 <= 5; ci2++) {
            var tEl = ov.querySelector('#azs-t-' + d + '-' + ci2);
            if (tEl && tEl.value) h2.callService('input_datetime','set_datetime',{entity_id:'input_datetime.'+prefix+'_'+d+'_orario_ciclo'+ci2,time:tEl.value+':00'});
          }
        }
      });
      // Toggle → HA (tutti e tre inviati al salva, evita race condition)
      var autoBtn = ov.querySelector('#azuc-tog-auto');
      if (autoBtn && c.pk_auto) _azCallSvc('input_boolean', autoBtn.dataset.on==='1'?'turn_on':'turn_off', {entity_id:c.pk_auto});
      var sicBtn = ov.querySelector('#azuc-tog-sic');
      if (sicBtn && c.pk_auto_sic) _azCallSvc('automation', sicBtn.dataset.on==='1'?'turn_on':'turn_off', {entity_id:c.pk_auto_sic});
      var ntfBtn = ov.querySelector('#azuc-tog-ntf');
      if (ntfBtn && notifEntity) _azCallSvc('input_boolean', ntfBtn.dataset.on==='1'?'turn_on':'turn_off', {entity_id:notifEntity});
      // Sensori opzionali → localStorage
      var savedCfg = _azLoad(card);
      var ve = (ov.querySelector('#azuc-vento-id')||{}).value||'';
      var ta = (ov.querySelector('#azuc-tanica-id')||{}).value||'';
      var po = (ov.querySelector('#azuc-pompa-id')||{}).value||'';
      savedCfg.pk_vento = ve; savedCfg.pk_tanica = ta; savedCfg.pk_consumo_pompa = po;
      _azSave(card, savedCfg);
      ov._close();
      if (el) el._fcSig = null;
    });
  }

  function _azOpenEntCfg(card, el) { _azOpenUserCfg(card, el); }

  function _azCallSvc(domain, svc, data) {
    try { var h = _azH(); if (h && h.callService) { h.callService(domain, svc, data); return; } if (window.callSvc) window.callSvc(domain, svc, data); } catch(e) {}
  }

  function _azComputeSig(h, c) {
    var px = c.pk_prefix||'anti_zanzare';
    var dk = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dsg = dk.map(function(d){return _azIsOn(h,'input_boolean.'+px+'_'+d)?'1':'0';}).join('');
    var ncsg = dk.map(function(d){return Math.round(_azNum(_azS(h,'input_number.'+px+'_'+d+'_num_cicli'))||0);}).join('');
    var tc = _azS(h,c.pk_timer_ciclo), tm = _azS(h,c.pk_timer_manuale);
    return ['2.5az',_azS(h,c.pk_stato),_azS(h,c.pk_auto),_azS(h,c.pk_manuale),tc,tm,
            _azS(h,c.pk_cicli_mensili),_azS(h,c.pk_cicli_target),
            _azS(h,c.pk_blocco_meteo),_azS(h,c.pk_pioggia),_azS(h,c.pk_pioggia_corso),
            _azS(h,c.pk_durata_manuale),_azS(h,c.pk_soglia_pioggia),
            _azS(h,c.pk_persona),_azS(h,c.pk_perdita),_azS(h,c.pk_prossimo),
            _azS(h,c.pk_cicli_rim),_azS(h,c.pk_consumo_acqua),_azS(h,c.pk_auto_sic),
            c.pk_vento?_azS(h,c.pk_vento):'',c.pk_tanica?_azS(h,c.pk_tanica):'',
            c.pk_consumo_pompa?_azS(h,c.pk_consumo_pompa):'',
            dsg,ncsg].join('|');
  }

  function _azMount(card, hass, el) {
    if (el._fcBound === '2.6az') return;
    el._fcBound = '2.6az';
    // Rimuove la matita se renderizzata prima del caricamento del registry
    var _azPencil = el.querySelector('.ovb-edit');
    if (_azPencil) _azPencil.remove();
    var rid = 'fraz' + (card.id || 'az');
    if (el._fcHandler) el.removeEventListener('click', el._fcHandler);
    el._fcHandler = function(e) {
      var t = e.target.closest('[data-sya]'); if (!t) return;
      var a = t.dataset.sya, c = _azCfgFor(card);
      if (a === 'man-on')    _azCallSvc('input_button','press',{entity_id:c.pk_btn_man_on});
      if (a === 'man-off')   _azCallSvc('input_button','press',{entity_id:c.pk_btn_man_off});
      if (a === 'auto-on')   _azCallSvc('input_button','press',{entity_id:c.pk_btn_auto_on});
      if (a === 'auto-off')  _azCallSvc('input_button','press',{entity_id:c.pk_btn_auto_off});
      if (a === 'programma') _azOpenProgramma(card, el);
      if (a === 'popup-cfg') _azOpenUserCfg(card, el);
      if (a === 'sic-toggle') {
        var sc = _azCfgFor(card);
        if (sc.pk_auto_sic) { var sH=_azH(), sOn=_azS(sH,sc.pk_auto_sic)!=='off'; _azCallSvc('automation',sOn?'turn_off':'turn_on',{entity_id:sc.pk_auto_sic}); if(el) el._fcSig=null; }
      }
      if (a.length > 4 && a.slice(0,4) === 'ncp-') {
        var _azNcpPx = (_azCfgFor(card).pk_prefix||'anti_zanzare'), _azNcpH = _azH(), _azNcpD = a.slice(4);
        var _azNcpId = 'input_number.' + _azNcpPx + '_' + _azNcpD + '_num_cicli';
        var _azNcpCur = Math.round(_azNum(_azS(_azNcpH, _azNcpId)) || 0);
        _azCallSvc('input_number','set_value',{entity_id:_azNcpId,value:Math.min(5,_azNcpCur+1)});
        if (!_azIsOn(_azNcpH, 'input_boolean.' + _azNcpPx + '_' + _azNcpD))
          _azCallSvc('input_boolean','turn_on',{entity_id:'input_boolean.' + _azNcpPx + '_' + _azNcpD});
      }
      if (a.length > 4 && a.slice(0,4) === 'ncm-') {
        var _azNcmPx = (_azCfgFor(card).pk_prefix||'anti_zanzare'), _azNcmH = _azH(), _azNcmD = a.slice(4);
        var _azNcmId = 'input_number.' + _azNcmPx + '_' + _azNcmD + '_num_cicli';
        var _azNcmCur = Math.round(_azNum(_azS(_azNcmH, _azNcmId)) || 0);
        var _azNcmNv = Math.max(0, _azNcmCur - 1);
        _azCallSvc('input_number','set_value',{entity_id:_azNcmId,value:_azNcmNv});
        if (_azNcmNv === 0) _azCallSvc('input_boolean','turn_off',{entity_id:'input_boolean.' + _azNcmPx + '_' + _azNcmD});
      }
      if (a.length > 4 && a.slice(0,4) === 'day-') _azOpenDayDetail(card, a.slice(4), _azCfgFor(card).pk_prefix||'anti_zanzare', el);
    };
    el.addEventListener('click', el._fcHandler);
    // Live polling — aggiorna la card ogni 2s solo se lo stato HA è cambiato
    clearInterval(el._azPoll);
    el._azPoll = setInterval(function() {
      try {
        if (!el._fcBound) { clearInterval(el._azPoll); return; }
        var h = _azH(), c2 = _azCfgFor(card);
        var sig = _azComputeSig(h, c2);
        if (el._fcSig !== sig) { el._fcSig = sig; el.innerHTML = _azRender(card); }
      } catch(e) {}
    }, 2000);
    // Timer tick — aggiorna barra e conto alla rovescia ogni 200ms senza re-render
    clearInterval(el._azTimerTick);
    el._azTimerTick = setInterval(function() {
      try {
        if (!el._fcBound) { clearInterval(el._azTimerTick); return; }
        var h2 = _azH(), c2 = _azCfgFor(card);
        var tc2 = _azS(h2, c2.pk_timer_ciclo), tm2 = _azS(h2, c2.pk_timer_manuale);
        var tKey = tc2 === 'active' ? c2.pk_timer_ciclo : (tm2 === 'active' ? c2.pk_timer_manuale : null);
        if (!tKey) return;
        var fmt = _azFmtTimer(h2, tKey);
        var tb = el.querySelector('#' + rid + '-tb');
        var tt = el.querySelector('#' + rid + '-tt');
        var tt2 = el.querySelector('#' + rid + '-tt2');
        if (tb) tb.style.width = fmt.pct.toFixed(2) + '%';
        if (tt) tt.textContent = fmt.rem;
        if (tt2) tt2.textContent = fmt.rem;
      } catch(e) {}
    }, 200);
  }

  function _azUpdate(card, hass, el) {
    var h = _azH(), c = _azCfgFor(card);
    var sig = _azComputeSig(h, c);
    if (!el.querySelector('.fc-card') || el._fcSig !== sig) { el._fcSig = sig; el.innerHTML = _azRender(card); }
    _azMount(card, hass, el);
  }

  var _AZ_CARD = {
    id: 'antizanzare', name: 'Anti Zanzare', icon: '🦟', version: '2.13', frarik_no_edit: true,
    desc: 'Controllo sistema anti zanzare: schedule settimanale, timer, statistiche mensili, blocco meteo, sensori sicurezza.',
    render:    function(card) { return _azRender(card); },
    mount:     function(card, hass, el) { _azMount(card, hass, el); },
    update:    function(card, hass, el) { _azUpdate(card, hass, el); },
    configure: function(card, el) {},
    frarik_pkg_check:   'sensor.stato_anti_zanzare',
    frarik_pkg_id:      'frarik_antizanzare',
    frarik_pkg_version: '1.0',
    openWizard: _openWizardAZ,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[_AZ_CARD.id] = _AZ_CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[_AZ_CARD.id] = _AZ_CARD;
  try { console.log('[FratechStore] Card registrata: antizanzare v' + _AZ_CARD.version); } catch(e) {}
})();
