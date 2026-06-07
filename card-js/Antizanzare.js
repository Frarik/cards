/**
 * antizanzare-card.js v2.1
 */

const E = {
  stato:         'sensor.stato_anti_zanzare',
  autoAttiva:    'input_boolean.anti_zanzare_automazione_attiva',
  timerCiclo:    'timer.anti_zanzare_ciclo_timer',
  timerManuale:  'timer.anti_zanzare_manuale_timer',
  pioggia:       'sensor.probabilita_pioggia',
  pioggiaCors:   'binary_sensor.pioggia_in_corso',
  durataManuale: 'input_number.anti_zanzare_durata_manuale',
  cicliMensili:  'counter.anti_zanzare_cicli_mensili',
  cicliTarget:   'input_number.anti_zanzare_cicli_target_mensili',
  sogliaPioggia: 'input_number.anti_zanzare_soglia_pioggia',
  bloccoMeteo:   'binary_sensor.blocco_meteo_attivo',
  btnStart:      'input_button.anti_zanzare_start_manuale',
  btnStop:       'input_button.anti_zanzare_stop_manuale',
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
.sched-toggle { display:flex;align-items:center;justify-content:space-between;padding:8px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04); }
.sched-toggle:hover { background:rgba(255,255,255,.02); }
.sched-chevron { color:var(--secondary-text-color,#64748b);display:inline-flex;transition:transform .2s; }
.sched-chevron.open { transform:rotate(180deg); }
.sched-body { padding:8px 14px 12px;border-bottom:1px solid rgba(255,255,255,.04); }
.sched-tabs { display:flex;gap:3px;margin-bottom:10px; }
.sched-tab { flex:1;height:26px;border-radius:6px;font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);color:var(--secondary-text-color,#64748b);transition:all .15s; }
.sched-tab.active { background:rgba(6,182,212,.18);color:#06b6d4;border-color:rgba(6,182,212,.4); }
.sched-tab.day-on { border-color:rgba(6,182,212,.2); }
.sched-num-row { display:flex;align-items:center;justify-content:space-between;padding:4px 0 8px;border-bottom:1px solid rgba(255,255,255,.05);margin-bottom:6px; }
.sched-lbl { font-size:11px;font-weight:600;color:var(--secondary-text-color,#64748b); }
.sched-val { font-size:13px;font-weight:700;color:var(--primary-text-color,#f1f5f9);min-width:18px;text-align:center; }
.cycle-row { display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.03); }
.cycle-row:last-child { border-bottom:none; }
.cycle-num { font-size:10px;font-weight:600;color:var(--secondary-text-color,#64748b);min-width:40px;flex-shrink:0; }
.time-input { height:26px;padding:0 6px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--primary-text-color,#f1f5f9);font-size:12px;font-weight:600;font-family:inherit;flex:1;min-width:0; }
.time-input:focus { outline:none;border-color:rgba(6,182,212,.5); }
.sched-dur { font-size:11px;font-weight:700;color:var(--primary-text-color,#f1f5f9);min-width:34px;text-align:center; }
.no-cycles { text-align:center;font-size:11px;color:var(--secondary-text-color,#64748b);padding:8px 0; }
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
      if (this._g(`input_boolean.anti_zanzare_${d}`) !== 'on') continue

      const numC = Math.round(parseFloat(this._g(`input_number.anti_zanzare_${d}_num_cicli`, '0')))
      if (!numC) continue

      const dt   = new Date(today)
      dt.setDate(today.getDate() + off)
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`

      for (let c = 1; c <= numC; c++) {
        const t = this._g(`input_datetime.anti_zanzare_${d}_orario_ciclo${c}`, null)
        if (!t || t === 'unknown' || t === 'unavailable') continue
        const ts = new Date(`${dateStr}T${t.slice(0,5)}:00`).getTime()
        if (off === 0 && ts <= now) continue
        const dur = Math.round(parseFloat(this._g(`input_number.anti_zanzare_${d}_durata_ciclo${c}`, '0')))
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
      const n = Math.round(parseFloat(this._g(`input_number.anti_zanzare_${d}_num_cicli`,'0')))
      if (!n) return `${d}:0`
      return `${d}:${n}:` + Array.from({length:n},(_,i)=>
        `${this._g(`input_datetime.anti_zanzare_${d}_orario_ciclo${i+1}`,'')}`
      ).join(',')
    }).join('|')

    const d = DAYS[this._schedDay]
    const numC = this._schedOpen
      ? Math.round(parseFloat(this._g(`input_number.anti_zanzare_${d}_num_cicli`,'0')))
      : 0
    const schedDur = this._schedOpen
      ? Array.from({length:numC},(_,i)=>
          Math.round(parseFloat(this._g(`input_number.anti_zanzare_${d}_durata_ciclo${i+1}`,'0')))
        ).join(';')
      : ''

    return [
      this._g(E.stato),
      this._g(E.autoAttiva),
      this._g(E.timerCiclo),
      this._g(E.timerManuale),
      this._g(E.bloccoMeteo),
      this._g(E.pioggiaCors),
      Math.round(parseFloat(this._g(E.cicliMensili,'0'))),
      Math.round(parseFloat(this._g(E.cicliTarget,'20'))),
      Math.round(parseFloat(this._g(E.sogliaPioggia,'50'))),
      this._dur(),
      DAYS.map(day => this._g(`input_boolean.anti_zanzare_${day}`)==='on'?'1':'0').join(''),
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
        const id = `input_number.anti_zanzare_${d}_num_cicli`
        const cur = Math.round(parseFloat(this._g(id,'0')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.max(0,cur-1)}); break
      }
      case 'numCicliPlus': {
        const d = DAYS[this._schedDay]
        const id = `input_number.anti_zanzare_${d}_num_cicli`
        const cur = Math.round(parseFloat(this._g(id,'0')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.min(5,cur+1)}); break
      }
      case 'durCicloMinus': {
        const id = `input_number.anti_zanzare_${btn.dataset.day}_durata_ciclo${btn.dataset.ciclo}`
        const cur = Math.round(parseFloat(this._g(id,'60')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.max(10,cur-10)}); break
      }
      case 'durCicloPlus': {
        const id = `input_number.anti_zanzare_${btn.dataset.day}_durata_ciclo${btn.dataset.ciclo}`
        const cur = Math.round(parseFloat(this._g(id,'60')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.min(3600,cur+10)}); break
      }
      case 'toggleDay':
        this._svc('input_boolean','toggle',{entity_id:`input_boolean.anti_zanzare_${btn.dataset.day}`}); break
    }
  }

  _handleChange(e) {
    const input = e.target.closest('[data-action="timeChange"]')
    if (!input || !this._hass) return
    const { day, ciclo } = input.dataset
    if (!input.value) return
    this._svc('input_datetime','set_datetime',{
      entity_id: `input_datetime.anti_zanzare_${day}_orario_ciclo${ciclo}`,
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
    const days       = DAYS.map(d => this._g(`input_boolean.anti_zanzare_${d}`) === 'on')
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
      const numCicli = Math.round(parseFloat(this._g(`input_number.anti_zanzare_${d}_num_cicli`,'0')))
      const tabs = DAYS.map((day,i) =>
        `<button class="sched-tab ${i===this._schedDay?'active':''} ${days[i]?'day-on':''}"
          data-action="selectSchedDay" data-day-idx="${i}">${DAY_LBL[i]}</button>`
      ).join('')
      const cycles = numCicli > 0
        ? Array.from({length:numCicli},(_,ci)=>{
            const c = ci+1
            const orario = (this._g(`input_datetime.anti_zanzare_${d}_orario_ciclo${c}`,'08:00:00')||'08:00:00').slice(0,5)
            const durC = Math.round(parseFloat(this._g(`input_number.anti_zanzare_${d}_durata_ciclo${c}`,'60')))
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
      schedHTML = `<div class="sched-body">
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
        <div class="sched-toggle" data-action="toggleSchedule">
          <div><div class="set-lbl">Programmazione cicli</div><div class="set-sub">Orari e durate per ogni giorno</div></div>
          <span class="sched-chevron ${this._schedOpen?'open':''}">${I.chevron}</span>
        </div>
        ${schedHTML}
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
      <div class="stat-foot">${isActive?'Rimanente':'Nessun timer'}</div>
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
window.customCards.push({ version: '1.0',
  type:        'antizanzare-card',
  name:        'Anti Zanzare',
  description: 'Controllo sistema anti zanzare: schedule, timer, statistiche mensili.',
})
