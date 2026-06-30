/**
 * irrigazione-card.js v2.1
 */

// ── Entity IDs ───────────────────────────────────────────────────────────────
const E = {
  stato:         'sensor.stato_irrigazione',
  autoAttiva:    'input_boolean.irrigazione_automazione_attiva',
  manualeAttiva: 'input_boolean.irrigazione_manuale_attiva',
  timerCiclo:    'timer.irrigazione_ciclo_timer',
  timerManuale:  'timer.irrigazione_manuale_timer',
  rubinetto:     'switch.rubinetto_esterno_interruttore',
  flusso:        'sensor.consumo_acqua_irrigazione',
  pioggia:       'sensor.probabilita_pioggia',
  pioggiaCors:   'binary_sensor.pioggia_in_corso',
  durataManuale: 'input_number.irrigazione_durata_manuale',
  cicliOggi:     'counter.irrigazione_cicli_giornalieri',
  sogliaPioggia: 'input_number.irrigazione_soglia_pioggia',
  bloccoMeteo:   'binary_sensor.blocco_meteo_attivo',
  btnAutoStart:  'input_button.irrigazione_start_automazione',
  btnAutoStop:   'input_button.irrigazione_stop_automazione',
  btnManStart:   'input_button.irrigazione_start_manuale',
  btnManStop:    'input_button.irrigazione_stop_manuale',
}

const DAYS     = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica']
const DAY_LBL  = ['LU','MA','ME','GI','VE','SA','DO']
const DAY_FULL = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']
const HIST_KEY = 'irrigazione_card_history_v1'

// ── Utility ───────────────────────────────────────────────────────────────────
function fmtDuration(secs) {
  const s = parseInt(secs) || 0
  if (s <= 0)   return '0s'
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s/60)}min`
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60)
  return m ? `${h}h ${m}m` : `${h}h`
}

function fmtCountdown(sec) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

function parseDuration(durStr) {
  if (!durStr) return 0
  const p = String(durStr).split(':').map(Number)
  if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2]
  if (p.length === 2) return p[0]*60 + p[1]
  return p[0] || 0
}

// Anello piccolo (stat tile)
function circProgress(pct, size, color) {
  const p  = Math.max(0, Math.min(100, parseFloat(pct) || 0))
  const cx = size/2, cy = size/2, r = (size-8)/2
  const c  = 2*Math.PI*r, d = (p/100)*c
  return `<svg width="${size}" height="${size}" style="display:block;transform:rotate(-90deg)">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3.5"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="3.5"
      stroke-dasharray="${d.toFixed(2)} ${(c-d).toFixed(2)}" stroke-linecap="round"/>
  </svg>`
}

// Anello grande per pannello attivo
function bigRing(pct, size, color) {
  const p  = Math.max(0, Math.min(100, parseFloat(pct) || 0))
  const cx = size/2, cy = size/2, r = (size-20)/2
  const c  = 2*Math.PI*r, d = (p/100)*c
  return `<svg width="${size}" height="${size}" style="display:block;filter:drop-shadow(0 0 10px ${color}88);">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="rgba(255,255,255,0.06)" stroke-width="5"
      transform="rotate(-90,${cx},${cy})"/>
    <circle cx="${cx}" cy="${cy}" r="${r+6}" fill="none"
      stroke="${color}18" stroke-width="1"
      transform="rotate(-90,${cx},${cy})"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${color}" stroke-width="5"
      stroke-dasharray="${d.toFixed(2)} ${(c-d).toFixed(2)}"
      stroke-linecap="round"
      transform="rotate(-90,${cx},${cy})"/>
  </svg>`
}

function statusInfo(stato, blocco) {
  if (blocco) return { label:'BLOCCATO',    color:'#f59e0b', pulse:false }
  switch (stato) {
    case 'Ciclo in Corso':     return { label:'CICLO ATTIVO', color:'#22c55e', pulse:true  }
    case 'Manuale Attiva':     return { label:'MANUALE',      color:'#f97316', pulse:true  }
    case 'Automazione Attiva': return { label:'IN ATTESA',    color:'#3b82f6', pulse:false }
    default:                   return { label:'SPENTA',       color:'#6b7280', pulse:false }
  }
}

function getMondayKey() {
  const d   = new Date()
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return `${mon.getFullYear()}-${mon.getMonth()+1}-${mon.getDate()}`
}

function histLoad() {
  try {
    const raw = JSON.parse(localStorage.getItem(HIST_KEY) || '{}')
    const wk  = getMondayKey()
    if (raw.weekKey !== wk) return { weekKey: wk, entries: [] }
    return { weekKey: wk, entries: raw.entries || [] }
  } catch { return { weekKey: getMondayKey(), entries: [] } }
}

function histSave(data) {
  try { localStorage.setItem(HIST_KEY, JSON.stringify(data)) } catch {}
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const I = {
  gear:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  history:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 16 14"/></svg>`,
  trash:     `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  play:      `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  stop:      `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  chevron:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  calend:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  sprinkler: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="21"/><line x1="9" y1="21" x2="15" y2="21"/><path d="M8 17h8"/><path d="M12 14v-2"/><path d="M5 10 Q7 7 9 6"/><path d="M8 8 Q10 5 12 4"/><path d="M12 8 Q14 5 16 6"/><path d="M16 10 Q18 7 20 8"/></svg>`,
  drop:      `<svg width="28" height="28" viewBox="0 0 24 24" fill="FILL" stroke="STROKE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  // icona "sistema spento" — power off
  power:     `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
:host { display:block; }
* { box-sizing:border-box; margin:0; padding:0; }
.card {
  background:var(--ha-card-background,#111827);
  border-radius:var(--ha-card-border-radius,16px);
  border:1px solid rgba(59,130,246,.18);
  overflow:hidden;
  font-family:var(--primary-font-family,system-ui,sans-serif);
  box-shadow:0 8px 40px rgba(0,0,0,.35);
  transition:border-color .3s,box-shadow .3s;
}
.card.st-ciclo  { border-color:rgba(34,197,94,.4);   box-shadow:0 8px 40px rgba(34,197,94,.12); }
.card.st-manual { border-color:rgba(249,115,22,.4);  box-shadow:0 8px 40px rgba(249,115,22,.12); }
.card.st-wait   { border-color:rgba(59,130,246,.35); box-shadow:0 8px 40px rgba(59,130,246,.1); }
.card.st-block  { border-color:rgba(245,158,11,.4);  box-shadow:0 8px 40px rgba(245,158,11,.1); }

/* ─ Header ─ */
.hdr { display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid rgba(255,255,255,.06); }
.hdr-icon  { width:40px;height:40px;border-radius:11px;flex-shrink:0;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);display:flex;align-items:center;justify-content:center;color:#3b82f6; }
.hdr-text  { flex:1;min-width:0; }
.hdr-title { font-size:15px;font-weight:700;color:var(--primary-text-color,#f1f5f9);line-height:1.2; }
.hdr-sub   { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);margin-top:2px; }
.hdr-right { display:flex;align-items:center;gap:7px;flex-shrink:0; }
.icon-btn  { width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--secondary-text-color,#64748b);transition:background .15s; }
.icon-btn:hover  { background:rgba(255,255,255,.1); }
.icon-btn.active { background:rgba(59,130,246,.18);color:#3b82f6; }
button[data-action="toggleSettings"] { display: var(--fgear, none); }
.badge { display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.05em;border:1px solid currentColor;white-space:nowrap; }
.dot { width:6px;height:6px;border-radius:50%;background:currentColor; }
.dot.pulse { animation:blink 1.4s infinite; }
@keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.4)} }

/* ─ Stats (3 tile compatte) ─ */
.stats { display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px 12px; }
.stat {
  border-radius:12px;border:1px solid rgba(255,255,255,.07);
  background:rgba(255,255,255,.04);
  padding:8px 6px 7px;
  display:flex;flex-direction:column;align-items:center;
  min-height:74px;justify-content:space-between;
  transition:border-color .3s;
}
.stat-lbl  { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);white-space:nowrap; }
.stat-body { display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;justify-content:center; }
.stat-num  { font-size:22px;font-weight:900;line-height:1;letter-spacing:-1px;font-variant-numeric:tabular-nums; }
.stat-unit { font-size:12px;font-weight:600; }
.stat-foot { font-size:9px;font-weight:600;color:var(--secondary-text-color,#64748b);white-space:nowrap;text-align:center; }
.stat-foot.warn { color:#f59e0b; }
.drop-icon { display:flex;align-items:center;justify-content:center;transition:filter .3s; }
.drop-icon.active { filter:drop-shadow(0 0 6px rgba(59,130,246,.6)); }
.state-pill { padding:2px 8px;border-radius:20px;font-size:8px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border:1px solid currentColor; }
/* tile sistema disattivato */
.sys-off { display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--secondary-text-color,#4b5563); }
.sys-off-lbl { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-top:1px; }

/* ─ Pannello timer attivo (sostituisce le 3 tile) ─ */
.atp {
  border-top:1px solid rgba(255,255,255,.06);
  background:linear-gradient(180deg,#060e1c 0%,#0a1628 60%,#060e1c 100%);
  position:relative;overflow:hidden;
}
.atp-scene {
  position:relative;display:flex;align-items:center;justify-content:center;
  padding:18px 12px 14px;
}
/* punti decorativi */
.atp-dot { position:absolute;border-radius:50%;background:rgba(255,255,255,.1); }
.atp-dot.d1  { width:3px;height:3px;top:18%;left:12%; }
.atp-dot.d2  { width:2px;height:2px;top:38%;left:7%;  }
.atp-dot.d3  { width:3px;height:3px;top:68%;left:11%; }
.atp-dot.d4  { width:2px;height:2px;top:80%;left:25%; }
.atp-dot.d5  { width:3px;height:3px;top:22%;right:13%;}
.atp-dot.d6  { width:2px;height:2px;top:44%;right:7%; }
.atp-dot.d7  { width:3px;height:3px;top:72%;right:10%;}
.atp-dot.d8  { width:2px;height:2px;top:58%;right:22%;}
.atp-dot.d9  { width:2px;height:2px;top:55%;left:18%; }
.atp-dot.d10 { width:3px;height:3px;top:30%;right:28%;}
.atp-ring    { position:relative;z-index:1;flex-shrink:0; }
.atp-center  { position:absolute;z-index:2;text-align:center;pointer-events:none; }
.atp-cd      { font-size:38px;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:-2px;line-height:1; }
.atp-rimasti { font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;opacity:.55;margin-top:3px; }
.atp-total   { font-size:8px;opacity:.28;margin-top:2px;letter-spacing:.02em; }
/* barra info sotto la scena */
.atp-bar {
  display:grid;grid-template-columns:1fr 1fr 1fr;
  gap:1px;background:rgba(255,255,255,.07);
  border-top:1px solid rgba(255,255,255,.07);
}
.atp-cell { background:#060e1c;padding:9px 8px;text-align:center; }
.atp-val  { font-size:18px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.5px;line-height:1; }
.atp-lbl  { font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#fff;margin-top:3px; }

/* ─ Info row ─ */
.info-row   { display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,.06);border-top:1px solid rgba(255,255,255,.06); }
.info-panel { background:var(--ha-card-background,#111827);padding:10px 12px; }
.info-lbl   { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);margin-bottom:5px; }
.info-main  { font-size:14px;font-weight:700;color:var(--primary-text-color,#f1f5f9);line-height:1.3; }
.info-sub   { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:2px;line-height:1.4; }
.next-row { display:flex;align-items:center;gap:5px;margin-bottom:2px; }

/* ─ Days ─ */
.days       { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid rgba(255,255,255,.06); }
.days-label { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--secondary-text-color,#64748b); }
.days-chips { display:flex;gap:4px; }
.day        { width:28px;height:24px;border-radius:6px;border:none;cursor:pointer;font-size:9px;font-weight:700;transition:all .15s;display:flex;align-items:center;justify-content:center; }
.day.on     { background:rgba(59,130,246,.18);color:#3b82f6;border:1px solid rgba(59,130,246,.35); }
.day.off    { background:rgba(255,255,255,.04);color:var(--secondary-text-color,#64748b);border:1px solid rgba(255,255,255,.07); }
.day.on:hover  { background:rgba(59,130,246,.28); }
.day.off:hover { background:rgba(255,255,255,.09); }

/* ─ Auto row ─ */
.auto-row    { display:flex;gap:6px;padding:8px 12px 0;border-top:1px solid rgba(255,255,255,.06); }
.btn-auto    { flex:1;height:34px;border-radius:10px;border:none;cursor:pointer;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;transition:opacity .15s; }
.btn-auto-on  { background:linear-gradient(135deg,#15803d,#22c55e);color:#fff; }
.btn-auto-off { background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#ef4444; }
.btn-auto:disabled { opacity:.35;cursor:default; }

/* ─ Controls ─ */
.controls   { display:flex;align-items:center;gap:6px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.06); }
.adj-btn    { width:32px;height:34px;border-radius:9px;border:none;background:rgba(255,255,255,.07);cursor:pointer;color:var(--primary-text-color,#f1f5f9);font-size:17px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:background .15s; }
.adj-btn:hover { background:rgba(255,255,255,.13); }
.dur-disp   { height:34px;padding:0 10px;border-radius:9px;background:rgba(255,255,255,.07);min-width:52px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--primary-text-color,#f1f5f9); }
.btn-start  { flex:1;height:38px;border-radius:11px;border:none;cursor:pointer;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;font-size:12px;font-weight:700;letter-spacing:.03em;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .15s,transform .1s; }
.btn-start:hover  { opacity:.88; }
.btn-start:active { transform:scale(.97); }
.btn-start:disabled { opacity:.35;cursor:default; }
.btn-stop   { height:38px;padding:0 14px;border-radius:11px;border:none;cursor:pointer;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-size:12px;font-weight:700;display:none;align-items:center;justify-content:center;gap:5px;transition:background .15s; }
.btn-stop.show { display:flex; }
.btn-stop:hover { background:rgba(239,68,68,.22); }

/* ─ Settings ─ */
.settings    { display:none;border-top:1px solid rgba(255,255,255,.06); }
.settings.open { display:block; }
.set-row     { display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.04); }
.set-row:last-child { border-bottom:none; }
.set-lbl     { font-size:12px;font-weight:600;color:var(--primary-text-color,#f1f5f9); }
.set-sub     { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:1px; }
.toggle      { width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0; }
.toggle.on   { background:#3b82f6; }
.toggle.off  { background:rgba(255,255,255,.15); }
.toggle::after { content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s; }
.toggle.on::after  { left:21px; }
.toggle.off::after { left:3px; }
.num-ctrl    { display:flex;align-items:center;gap:4px; }
.adj-sm      { width:24px;height:24px;border-radius:6px;border:none;background:rgba(255,255,255,.08);color:var(--primary-text-color,#f1f5f9);font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0; }
.adj-sm:hover { background:rgba(255,255,255,.15); }
.set-val     { font-size:13px;font-weight:700;color:#3b82f6;min-width:36px;text-align:center; }
.sched-toggle { display:flex;align-items:center;justify-content:space-between;padding:8px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04); }
.sched-toggle:hover { background:rgba(255,255,255,.02); }
.sched-chevron { color:var(--secondary-text-color,#64748b);display:inline-flex;transition:transform .2s; }
.sched-chevron.open { transform:rotate(180deg); }
.sched-body  { padding:8px 14px 12px;border-bottom:1px solid rgba(255,255,255,.04); }
.sched-tabs  { display:flex;gap:3px;margin-bottom:10px; }
.sched-tab   { flex:1;height:26px;border-radius:6px;font-size:9px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);color:var(--secondary-text-color,#64748b);transition:all .15s; }
.sched-tab.active { background:rgba(59,130,246,.18);color:#3b82f6;border-color:rgba(59,130,246,.4); }
.sched-tab.day-on { border-color:rgba(59,130,246,.2); }
.sched-num-row { display:flex;align-items:center;justify-content:space-between;padding:4px 0 8px;border-bottom:1px solid rgba(255,255,255,.05);margin-bottom:6px; }
.sched-lbl   { font-size:11px;font-weight:600;color:var(--secondary-text-color,#64748b); }
.sched-val   { font-size:13px;font-weight:700;color:var(--primary-text-color,#f1f5f9);min-width:18px;text-align:center; }
.cycle-row   { display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.03); }
.cycle-row:last-child { border-bottom:none; }
.cycle-num   { font-size:10px;font-weight:600;color:var(--secondary-text-color,#64748b);min-width:40px;flex-shrink:0; }
.time-input  { height:26px;padding:0 6px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--primary-text-color,#f1f5f9);font-size:12px;font-weight:600;font-family:inherit;flex:1;min-width:0; }
.time-input:focus { outline:none;border-color:rgba(59,130,246,.5); }
.sched-dur   { font-size:11px;font-weight:700;color:var(--primary-text-color,#f1f5f9);min-width:34px;text-align:center; }
.no-cycles   { text-align:center;font-size:11px;color:var(--secondary-text-color,#64748b);padding:8px 0; }

/* ─ Storico ─ */
.hist-panel  { display:none;border-top:1px solid rgba(255,255,255,.06); }
.hist-panel.open { display:block; }
.hist-hdr    { display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.06); }
.hist-title  { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b); }
.hist-title span { color:#3b82f6;margin-left:5px; }
.hist-week   { font-size:9px;color:var(--secondary-text-color,#64748b);margin-top:1px; }
.hist-reset  { display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:7px;border:1px solid rgba(239,68,68,.25);background:rgba(239,68,68,.1);color:#ef4444;font-size:10px;font-weight:700;cursor:pointer;transition:background .15s; }
.hist-reset:hover { background:rgba(239,68,68,.2); }
.hist-list   { max-height:260px;overflow-y:auto;padding:4px 0; }
.hist-list::-webkit-scrollbar { width:3px; }
.hist-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12);border-radius:3px; }
.hist-item   { display:flex;align-items:center;gap:8px;padding:7px 14px;border-bottom:1px solid rgba(255,255,255,.03);transition:background .1s; }
.hist-item:last-child { border-bottom:none; }
.hist-item:hover { background:rgba(255,255,255,.02); }
.h-badge     { flex-shrink:0;padding:2px 7px;border-radius:4px;font-size:8px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;border:1px solid currentColor;min-width:42px;text-align:center; }
.h-badge.auto { color:#22c55e; }
.h-badge.man  { color:#f97316; }
.hist-info   { flex:1;min-width:0; }
.hist-date   { font-size:12px;font-weight:600;color:var(--primary-text-color,#f1f5f9); }
.hist-meta   { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:1px; }
.hist-dur    { font-size:11px;font-weight:700;color:var(--secondary-text-color,#64748b);flex-shrink:0; }
.hist-empty  { text-align:center;padding:22px 14px;font-size:11px;color:var(--secondary-text-color,#64748b);display:flex;flex-direction:column;align-items:center;gap:6px; }
.hist-empty-icon { font-size:26px;opacity:.3; }
.hist-summary { display:flex;gap:1px;background:rgba(255,255,255,.06);border-top:1px solid rgba(255,255,255,.06); }
.hist-sum-cell { flex:1;background:var(--ha-card-background,#111827);padding:7px 10px;text-align:center; }
.hist-sum-val  { font-size:14px;font-weight:800;color:var(--primary-text-color,#f1f5f9); }
.hist-sum-lbl  { font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--secondary-text-color,#64748b);margin-top:2px; }
`

// ── Card ──────────────────────────────────────────────────────────────────────
class IrrigazioneCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._hass            = null
    this._config          = {}
    this._settingsOpen    = false
    this._historyOpen     = false
    this._schedOpen       = false
    this._schedDay        = (new Date().getDay() + 6) % 7
    this._localDur        = null
    this._buildKey        = null
    this._tickInterval    = null
    this._prevCicloState  = null
    this._prevManState    = null
    this._lastCycleDurSec = 0
    this._lastManDurSec   = 0
    this._onClick         = this._handleClick.bind(this)
    this._onChange        = this._handleChange.bind(this)
  }

  static getStubConfig() { return {} }
  setConfig(config)      { this._config = config || {} }
  getCardSize()          { return 7 }

  configure() { this._settingsOpen = true; this._historyOpen = false; this._buildKey = null; this._buildDOM(); }

  connectedCallback() {
    this.shadowRoot.addEventListener('click',  this._onClick)
    this.shadowRoot.addEventListener('change', this._onChange)
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click',  this._onClick)
    this.shadowRoot.removeEventListener('change', this._onChange)
    this._stopTick()
  }

  set hass(hass) {
    this._hass = hass

    if (this._localDur !== null) {
      const haVal = Math.round(parseFloat(hass?.states[E.durataManuale]?.state) || 0)
      if (Math.abs(haVal - this._localDur) < 5) this._localDur = null
    }

    const cycleState = hass?.states[E.timerCiclo]?.state   ?? null
    const manState   = hass?.states[E.timerManuale]?.state ?? null

    // tracking transizioni per storico
    if (this._prevCicloState !== null) {
      if (this._prevCicloState !== 'active' && cycleState === 'active')
        this._lastCycleDurSec = parseDuration(hass?.states[E.timerCiclo]?.attributes?.duration || '0')
      if (this._prevCicloState === 'active' && cycleState !== 'active')
        this._recordCycle('automatico', this._lastCycleDurSec)
    }
    if (this._prevManState !== null) {
      if (this._prevManState !== 'active' && manState === 'active')
        this._lastManDurSec = parseDuration(hass?.states[E.timerManuale]?.attributes?.duration || '0')
      if (this._prevManState === 'active' && manState !== 'active')
        this._recordCycle('manuale', this._lastManDurSec)
    }
    this._prevCicloState = cycleState
    this._prevManState   = manState

    if (cycleState === 'active' || manState === 'active') this._startTick()
    else                                                   this._stopTick()

    const bk = this._buildKey_()
    if (bk !== this._buildKey) { this._buildKey = bk; this._buildDOM() }
    else                        this._patch()
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
    const cycleOn = this._g(E.timerCiclo)   === 'active'
    const manOn   = this._g(E.timerManuale) === 'active'
    if (!cycleOn && !manOn) { this._stopTick(); return }

    const key       = manOn ? E.timerManuale : E.timerCiclo
    const finishAt  = this._a(key, 'finishes_at')
    if (!finishAt) return

    const durStr    = this._a(key, 'duration') || '0:00:00'
    const total     = parseDuration(durStr)
    const remaining = Math.max(0, (new Date(finishAt).getTime() - Date.now()) / 1000)
    const elapsed   = Math.max(0, total - remaining)
    const pct       = total > 0 ? (remaining / total) * 100 : 0
    const pctEl     = total > 0 ? Math.round((elapsed / total) * 100) : 0
    const col       = manOn ? '#f97316' : '#22c55e'
    const root      = this.shadowRoot
    if (!root) return

    // aggiorna pannello ATP (quando attivo)
    const cdEl   = root.querySelector('.atp-cd')
    const ringEl = root.querySelector('.atp-ring')
    const elEl   = root.querySelector('.atp-elapsed')
    const pctElE = root.querySelector('.atp-pct')
    if (cdEl)   cdEl.style.color     = col
    if (cdEl)   cdEl.textContent     = fmtCountdown(remaining)
    if (elEl)   elEl.textContent     = fmtCountdown(elapsed)
    if (pctElE) pctElE.textContent   = `${pctEl}%`
    if (ringEl) ringEl.innerHTML     = bigRing(pct, 150, col)
  }

  _g(id, fb = null)          { return this._hass?.states?.[id]?.state ?? fb }
  _a(id, key, fb = null)     { return this._hass?.states?.[id]?.attributes?.[key] ?? fb }
  _svc(domain, svc, data={}) { return this._hass?.callService(domain, svc, data) }
  _dur() {
    if (this._localDur !== null) return this._localDur
    return Math.round(parseFloat(this._g(E.durataManuale, '120')) || 120)
  }

  _getHistory()   { return histLoad() }
  _saveHistory(d) { histSave(d) }

  _recordCycle(type, durSec) {
    const data = this._getHistory()
    const now  = new Date()
    const days = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
    data.entries.unshift({
      type, ts: now.getTime(),
      date: `${days[now.getDay()]} ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}`,
      time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
      dur:  parseInt(durSec) || 0,
    })
    if (data.entries.length > 100) data.entries = data.entries.slice(0, 100)
    this._saveHistory(data)
    if (this._historyOpen) { this._buildKey = null; this._buildDOM() }
  }

  _resetHistory() {
    histSave({ weekKey: getMondayKey(), entries: [] })
    this._buildKey = null; this._buildDOM()
  }

  _computeNextCycle() {
    if (!this._hass) return null
    if (this._g(E.autoAttiva) !== 'on') return { label:'Automazione disattiva', timeLabel:'', dur:0 }
    const now = Date.now(), today = new Date()
    const todayIdx = (today.getDay() + 6) % 7
    const cands = []
    for (let off = 0; off < 8; off++) {
      const idx = (todayIdx + off) % 7, d = DAYS[idx]
      if (this._g(`input_boolean.irrigazione_${d}`) !== 'on') continue
      const numC = Math.round(parseFloat(this._g(`input_number.irrigazione_${d}_num_cicli`, '0')))
      if (!numC) continue
      const dt = new Date(today); dt.setDate(today.getDate() + off)
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
      for (let c = 1; c <= numC; c++) {
        const t = this._g(`input_datetime.irrigazione_${d}_orario_ciclo${c}`, null)
        if (!t || t === 'unknown' || t === 'unavailable') continue
        const ts = new Date(`${dateStr}T${t.slice(0,5)}:00`).getTime()
        if (off === 0 && ts <= now) continue
        cands.push({ ts, off, idx, time: t.slice(0,5), dur: Math.round(parseFloat(this._g(`input_number.irrigazione_${d}_durata_ciclo${c}`, '0'))) })
      }
    }
    if (!cands.length) return { label:'Nessun ciclo programmato', timeLabel:'', dur:0 }
    cands.sort((a,b) => a.ts - b.ts)
    const nx = cands[0]
    const label = nx.off===0 ? `Oggi ${nx.time}` : nx.off===1 ? `Domani ${nx.time}` : `${DAY_FULL[nx.idx]} ${nx.time}`
    const remMs = nx.ts - now
    const remH  = Math.floor(remMs/3600000), remM = Math.floor((remMs%3600000)/60000)
    const timeLabel = remH>=24 ? `${Math.floor(remH/24)}g ${remH%24?remH%24+'h':''}`.trim()
      : remH>=1 ? `${remH}h${remM?' '+remM+'m':''}` : `${remM}min`
    return { label, timeLabel, dur: nx.dur }
  }

  _buildKey_() {
    if (!this._hass) return null
    const allSched = DAYS.map(d => {
      const n = Math.round(parseFloat(this._g(`input_number.irrigazione_${d}_num_cicli`, '0')))
      if (!n) return `${d}:0`
      return `${d}:${n}:` + Array.from({length:n},(_,i)=>this._g(`input_datetime.irrigazione_${d}_orario_ciclo${i+1}`,'')).join(',')
    }).join('|')
    const d    = DAYS[this._schedDay]
    const numC = this._schedOpen ? Math.round(parseFloat(this._g(`input_number.irrigazione_${d}_num_cicli`,'0'))) : 0
    const schedDur = this._schedOpen
      ? Array.from({length:numC},(_,i)=>Math.round(parseFloat(this._g(`input_number.irrigazione_${d}_durata_ciclo${i+1}`,'0')))).join(';') : ''
    return [
      this._g(E.stato), this._g(E.autoAttiva), this._g(E.timerCiclo), this._g(E.timerManuale),
      this._g(E.rubinetto), this._g(E.bloccoMeteo), this._g(E.pioggiaCors),
      Math.round(parseFloat(this._g(E.cicliOggi,'0'))),
      Math.round(parseFloat(this._g(E.sogliaPioggia,'50'))),
      this._dur(),
      DAYS.map(day=>this._g(`input_boolean.irrigazione_${day}`)==='on'?'1':'0').join(''),
      allSched,
      this._settingsOpen?'1':'0', this._historyOpen?'1':'0',
      this._schedOpen?'1':'0', this._schedDay, schedDur,
    ].join('|')
  }

  _handleClick(e) {
    const btn = e.target.closest('[data-action]')
    if (!btn || !this._hass) return
    const { action } = btn.dataset
    switch (action) {
      case 'toggleSettings':
        this._settingsOpen = !this._settingsOpen
        if (this._settingsOpen) this._historyOpen = false
        this._buildKey = null; this._buildDOM(); break
      case 'toggleHistory':
        this._historyOpen = !this._historyOpen
        if (this._historyOpen) this._settingsOpen = false
        this._buildKey = null; this._buildDOM(); break
      case 'resetHistory':  this._resetHistory(); break
      case 'toggleSchedule':
        this._schedOpen = !this._schedOpen
        this._buildKey = null; this._buildDOM(); break
      case 'selectSchedDay':
        this._schedDay = parseInt(btn.dataset.dayIdx)
        this._buildKey = null; this._buildDOM(); break
      case 'startManuale':  this._svc('input_button','press',{entity_id:E.btnManStart});   break
      case 'stopManuale':   this._svc('input_button','press',{entity_id:E.btnManStop});    break
      case 'startAuto':     this._svc('input_button','press',{entity_id:E.btnAutoStart}); break
      case 'stopAuto':      this._svc('input_button','press',{entity_id:E.btnAutoStop});  break
      case 'toggleDay':     this._svc('input_boolean','toggle',{entity_id:`input_boolean.irrigazione_${btn.dataset.day}`}); break
      case 'toggleAuto':    this._svc('input_boolean','toggle',{entity_id:E.autoAttiva}); break
      case 'durMinus': {
        const v = Math.max(10, this._dur()-30); this._localDur = v
        this._svc('input_number','set_value',{entity_id:E.durataManuale,value:v})
        this._buildKey=null; this._buildDOM(); break
      }
      case 'durPlus': {
        const v = Math.min(3600, this._dur()+30); this._localDur = v
        this._svc('input_number','set_value',{entity_id:E.durataManuale,value:v})
        this._buildKey=null; this._buildDOM(); break
      }
      case 'sogliaMinus': {
        const cur=Math.round(parseFloat(this._g(E.sogliaPioggia,'50')))
        this._svc('input_number','set_value',{entity_id:E.sogliaPioggia,value:Math.max(0,cur-5)}); break
      }
      case 'sogliaPlus': {
        const cur=Math.round(parseFloat(this._g(E.sogliaPioggia,'50')))
        this._svc('input_number','set_value',{entity_id:E.sogliaPioggia,value:Math.min(100,cur+5)}); break
      }
      case 'numCicliMinus': {
        const d=DAYS[this._schedDay], id=`input_number.irrigazione_${d}_num_cicli`
        const cur=Math.round(parseFloat(this._g(id,'0')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.max(0,cur-1)}); break
      }
      case 'numCicliPlus': {
        const d=DAYS[this._schedDay], id=`input_number.irrigazione_${d}_num_cicli`
        const cur=Math.round(parseFloat(this._g(id,'0')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.min(5,cur+1)}); break
      }
      case 'durCicloMinus': {
        const id=`input_number.irrigazione_${btn.dataset.day}_durata_ciclo${btn.dataset.ciclo}`
        const cur=Math.round(parseFloat(this._g(id,'60')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.max(10,cur-10)}); break
      }
      case 'durCicloPlus': {
        const id=`input_number.irrigazione_${btn.dataset.day}_durata_ciclo${btn.dataset.ciclo}`
        const cur=Math.round(parseFloat(this._g(id,'60')))
        this._svc('input_number','set_value',{entity_id:id,value:Math.min(3600,cur+10)}); break
      }
    }
  }

  _handleChange(e) {
    const input = e.target.closest('[data-action="timeChange"]')
    if (!input || !this._hass || !input.value) return
    this._svc('input_datetime','set_datetime',{
      entity_id:`input_datetime.irrigazione_${input.dataset.day}_orario_ciclo${input.dataset.ciclo}`,
      time:`${input.value}:00`,
    })
  }

  _buildDOM() {
    if (!this._hass) return

    const stato      = this._g(E.stato, 'Spenta')
    const autoOn     = this._g(E.autoAttiva) === 'on'
    const cycleOn    = this._g(E.timerCiclo) === 'active'
    const manOn      = this._g(E.timerManuale) === 'active'
    const rubOn      = this._g(E.rubinetto) === 'on'
    const blocco     = this._g(E.bloccoMeteo) === 'on'
    const pioggiaCOn = this._g(E.pioggiaCors) === 'on'
    const isActive   = cycleOn || manOn
    const status     = statusInfo(stato, blocco)
    const pioggia    = parseInt(this._g(E.pioggia, '0'))
    const soglia     = Math.round(parseFloat(this._g(E.sogliaPioggia, '50')))
    const cicliOggi  = parseInt(this._g(E.cicliOggi, '0'))
    const flusso     = parseFloat(this._g(E.flusso, '0')) || 0
    const dur        = this._dur()
    const days       = DAYS.map(d => this._g(`input_boolean.irrigazione_${d}`) === 'on')
    const rainWarn   = pioggia >= soglia
    const cardClass  = cycleOn?'st-ciclo':manOn?'st-manual':autoOn?'st-wait':blocco?'st-block':''
    const nx         = this._computeNextCycle()

    // ── Sezione centrale: 3 tile oppure pannello attivo ────────────────────
    let centerHTML = ''
    if (isActive) {
      // Pannello timer attivo (sostituisce le 3 tile)
      const col      = manOn ? '#f97316' : '#22c55e'
      const timerKey = manOn ? E.timerManuale : E.timerCiclo
      const finishAt = this._a(timerKey, 'finishes_at')
      const durStr   = this._a(timerKey, 'duration') || '0:00:00'
      const total    = parseDuration(durStr)
      const rem      = finishAt ? Math.max(0,(new Date(finishAt).getTime()-Date.now())/1000) : 0
      const elp      = Math.max(0, total - rem)
      const pct      = total > 0 ? (rem / total) * 100 : 0
      const pctElap  = total > 0 ? Math.round((elp / total) * 100) : 0
      const profilo  = manOn ? 'Manuale' : 'Automatico'

      centerHTML = `
        <div class="atp">
          <div class="atp-scene">
            <span class="atp-dot d1"></span><span class="atp-dot d2"></span>
            <span class="atp-dot d3"></span><span class="atp-dot d4"></span>
            <span class="atp-dot d5"></span><span class="atp-dot d6"></span>
            <span class="atp-dot d7"></span><span class="atp-dot d8"></span>
            <span class="atp-dot d9"></span><span class="atp-dot d10"></span>
            <div class="atp-ring">${bigRing(pct, 150, col)}</div>
            <div class="atp-center">
              <div class="atp-cd" style="color:${col};text-shadow:0 0 24px ${col}88;">${fmtCountdown(rem)}</div>
              <div class="atp-rimasti" style="color:${col};">RIMASTI</div>
              <div class="atp-total">di ${fmtDuration(total)}</div>
            </div>
          </div>
          <div class="atp-bar">
            <div class="atp-cell">
              <div class="atp-val atp-elapsed" style="color:${col};">${fmtCountdown(elp)}</div>
              <div class="atp-lbl">TRASCORSO</div>
            </div>
            <div class="atp-cell">
              <div class="atp-val atp-pct" style="color:var(--primary-text-color,#f1f5f9);">${pctElap}%</div>
              <div class="atp-lbl">AVANZAMENTO</div>
            </div>
            <div class="atp-cell">
              <div class="atp-val" style="color:${col};">${profilo}</div>
              <div class="atp-lbl">PROFILO</div>
            </div>
          </div>
        </div>`
    } else {
      // 3 tile normali
      const rainColor = rainWarn ? '#f59e0b' : '#60a5fa'
      const tapColor  = rubOn ? '#3b82f6' : '#374151'
      const tapFill   = rubOn ? 'rgba(59,130,246,.25)' : 'rgba(255,255,255,.04)'
      const tapSvg    = I.drop.replace('FILL', tapFill).replace('STROKE', tapColor)

      centerHTML = `
        <div class="stats">
          <!-- Tile 1: Meteo -->
          <div class="stat" style="border-color:${rainWarn?'rgba(245,158,11,.35)':'rgba(96,165,250,.2)'}">
            <div class="stat-lbl" style="color:${rainColor}">Meteo</div>
            <div class="stat-body">
              <div style="display:flex;align-items:baseline;gap:2px;color:${rainColor}">
                <span class="stat-num" data-field="pioggia">${pioggia}</span>
                <span class="stat-unit">%</span>
              </div>
              ${pioggiaCOn?`<div class="state-pill" style="color:#60a5fa;border-color:rgba(96,165,250,.4);font-size:7px;">PIOGGIA</div>`:''}
            </div>
            <div class="stat-foot ${rainWarn?'warn':''}">${rainWarn?'⚠ Sopra soglia':'Prob. pioggia'}</div>
          </div>
          <!-- Tile 2: Rubinetto -->
          <div class="stat" style="border-color:${rubOn?'rgba(59,130,246,.35)':'rgba(255,255,255,.07)'}">
            <div class="stat-lbl" style="color:${rubOn?'#3b82f6':'var(--secondary-text-color,#64748b)'}">Rubinetto</div>
            <div class="stat-body">
              <div class="drop-icon ${rubOn?'active':''}">${tapSvg}</div>
              <div class="state-pill" style="color:${rubOn?'#3b82f6':'#4b5563'};border-color:${rubOn?'rgba(59,130,246,.4)':'rgba(255,255,255,.1)'}">
                ${rubOn?'APERTO':'CHIUSO'}
              </div>
            </div>
            <div class="stat-foot" style="${rubOn?'color:#3b82f6':''}">${rubOn?`${flusso.toFixed(1)} L/min`:'nessun flusso'}</div>
          </div>
          <!-- Tile 3: Sistema disattivato -->
          <div class="stat" style="border-color:#fff">
            <div class="stat-lbl">Sistema</div>
            <div class="stat-body">
              <div class="sys-off">
                ${I.power}
                <span class="sys-off-lbl">Disattivato</span>
              </div>
            </div>
            <div class="stat-foot"></div>
          </div>
        </div>`
    }

    // Day chips
    const dayChips = DAYS.map((d,i) =>
      `<button class="day ${days[i]?'on':'off'}" data-action="toggleDay" data-day="${d}">${DAY_LBL[i]}</button>`
    ).join('')

    // Schedule editor
    let schedHTML = ''
    if (this._schedOpen) {
      const d      = DAYS[this._schedDay]
      const numCicli = Math.round(parseFloat(this._g(`input_number.irrigazione_${d}_num_cicli`,'0')))
      const tabs   = DAYS.map((day,i) =>
        `<button class="sched-tab ${i===this._schedDay?'active':''} ${days[i]?'day-on':''}"
          data-action="selectSchedDay" data-day-idx="${i}">${DAY_LBL[i]}</button>`
      ).join('')
      const cycles = numCicli > 0
        ? Array.from({length:numCicli},(_,ci) => {
            const c      = ci+1
            const orario = (this._g(`input_datetime.irrigazione_${d}_orario_ciclo${c}`,'08:00:00')||'08:00:00').slice(0,5)
            const durC   = Math.round(parseFloat(this._g(`input_number.irrigazione_${d}_durata_ciclo${c}`,'120')))
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
        </div>${cycles}</div>`
    }

    const settingsHTML = this._settingsOpen ? `
      <div class="settings open">
        <div class="set-row">
          <div><div class="set-lbl">Automazione</div><div class="set-sub">Avvia/ferma la pianificazione automatica</div></div>
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
        <div class="sched-toggle" data-action="toggleSchedule">
          <div><div class="set-lbl">Programmazione cicli</div><div class="set-sub">Orari e durate per ogni giorno</div></div>
          <span class="sched-chevron ${this._schedOpen?'open':''}">${I.chevron}</span>
        </div>
        ${schedHTML}
      </div>` : `<div class="settings"></div>`

    // Storico
    let histHTML = `<div class="hist-panel"></div>`
    if (this._historyOpen) {
      const histData  = this._getHistory()
      const entries   = histData.entries
      const wkDate    = histData.weekKey || getMondayKey()
      const totalSec  = entries.reduce((s,e) => s+(e.dur||0), 0)
      const autoCount = entries.filter(e => e.type==='automatico').length
      const manCount  = entries.filter(e => e.type==='manuale').length
      const listHTML  = entries.length === 0
        ? `<div class="hist-empty"><div class="hist-empty-icon">💧</div><div>Nessuna irrigazione questa settimana</div></div>`
        : entries.map(e=>`
          <div class="hist-item">
            <span class="h-badge ${e.type==='automatico'?'auto':'man'}">${e.type==='automatico'?'Auto':'Man'}</span>
            <div class="hist-info">
              <div class="hist-date">${e.date} · ${e.time}</div>
              <div class="hist-meta">${e.type==='automatico'?'Ciclo automatico':'Irrigazione manuale'}</div>
            </div>
            <span class="hist-dur">${e.dur>0?fmtDuration(e.dur):'—'}</span>
          </div>`).join('')
      histHTML = `
        <div class="hist-panel open">
          <div class="hist-hdr">
            <div>
              <div class="hist-title">Storico settimana<span>${entries.length}</span></div>
              <div class="hist-week">Lun ${wkDate.replace(/-/g,'/')} → Dom</div>
            </div>
            <button class="hist-reset" data-action="resetHistory">${I.trash} Reset</button>
          </div>
          <div class="hist-list">${listHTML}</div>
          <div class="hist-summary">
            <div class="hist-sum-cell"><div class="hist-sum-val">${entries.length}</div><div class="hist-sum-lbl">Totale</div></div>
            <div class="hist-sum-cell"><div class="hist-sum-val">${autoCount}</div><div class="hist-sum-lbl">Auto</div></div>
            <div class="hist-sum-cell"><div class="hist-sum-val">${manCount}</div><div class="hist-sum-lbl">Man</div></div>
            <div class="hist-sum-cell"><div class="hist-sum-val">${fmtDuration(totalSec)}</div><div class="hist-sum-lbl">Durata</div></div>
          </div>
        </div>`
    }

    this.shadowRoot.innerHTML = `<style>${CSS}</style>
<div class="card ${cardClass}">

  <div class="hdr">
    <div class="hdr-icon">${I.sprinkler}</div>
    <div class="hdr-text">
      <div class="hdr-title">Irrigazione Smart</div>
      <div class="hdr-sub">Sistema Automatico</div>
    </div>
    <div class="hdr-right">
      <button class="icon-btn ${this._historyOpen?'active':''}" data-action="toggleHistory" title="Storico">${I.history}</button>
      <button class="icon-btn ${this._settingsOpen?'active':''}" data-action="toggleSettings" title="Impostazioni">${I.gear}</button>
      <div class="badge" style="color:${status.color}">
        <span class="dot ${status.pulse?'pulse':''}"></span>
        ${status.label}
      </div>
    </div>
  </div>

  ${centerHTML}

  <div class="info-row">
    <div class="info-panel">
      <div class="info-lbl">Cicli oggi</div>
      <div class="info-main" data-field="cicliOggi">${cicliOggi}</div>
      <div class="info-sub">${autoOn?'Automazione attiva':'Automazione spenta'}</div>
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

  <div class="auto-row">
    <button class="btn-auto btn-auto-on"  data-action="startAuto" ${autoOn?'disabled':''}>${I.play} Avvia Auto</button>
    <button class="btn-auto btn-auto-off" data-action="stopAuto"  ${!autoOn?'disabled':''}>${I.stop} Stop Auto</button>
  </div>

  <div class="controls">
    <button class="adj-btn" data-action="durMinus">−</button>
    <button class="adj-btn" data-action="durPlus">+</button>
    <div class="dur-disp">${fmtDuration(dur)}</div>
    <button class="btn-start" data-action="startManuale" ${isActive||blocco?'disabled':''}>${I.play} Avvia Manuale</button>
    <button class="btn-stop ${isActive?'show':''}" data-action="stopManuale">${I.stop} Stop</button>
  </div>

  ${histHTML}
  ${settingsHTML}

</div>`
  }

  _patch() {
    const root = this.shadowRoot
    if (!root?.querySelector('.card')) return
    const pEl = root.querySelector('[data-field="pioggia"]')
    if (pEl) pEl.textContent = parseInt(this._g(E.pioggia,'0'))
    const cEl = root.querySelector('[data-field="cicliOggi"]')
    if (cEl) cEl.textContent = parseInt(this._g(E.cicliOggi,'0'))
  }
}

customElements.define('irrigazione-card', IrrigazioneCard)

window.customCards = window.customCards || []
window.customCards.push({ version: '1.0',
  type:        'irrigazione-card',
  name:        'Irrigazione Smart',
  description: 'Controllo irrigazione: schedule, timer animato, meteo e storico settimanale.',
})

// ─── FratechStore Integration ────────────────────────────────────────────────
;(function () {
  'use strict';

  var _IRR_WIZ_KEY = 'frarik_pkg_wizard_irrigazione';

  var _IRR_PKG_YAML = 'input_boolean:\n'
    + '  irrigazione_lunedi: {name: "Irrigazione Lunedì", icon: mdi:calendar}\n'
    + '  irrigazione_martedi: {name: "Irrigazione Martedì", icon: mdi:calendar}\n'
    + '  irrigazione_mercoledi: {name: "Irrigazione Mercoledì", icon: mdi:calendar}\n'
    + '  irrigazione_giovedi: {name: "Irrigazione Giovedì", icon: mdi:calendar}\n'
    + '  irrigazione_venerdi: {name: "Irrigazione Venerdì", icon: mdi:calendar}\n'
    + '  irrigazione_sabato: {name: "Irrigazione Sabato", icon: mdi:calendar}\n'
    + '  irrigazione_domenica: {name: "Irrigazione Domenica", icon: mdi:calendar}\n'
    + '  irrigazione_automazione_attiva: {name: "Automazione Irrigazione Attiva", icon: mdi:autorenew}\n'
    + '  irrigazione_manuale_attiva: {name: "Irrigazione Manuale Attiva", icon: mdi:hand-back-right}\n'
    + 'input_number:\n'
    + '  irrigazione_lunedi_num_cicli: {name: "Lun N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  irrigazione_lunedi_durata_ciclo1: {name: "Lun C1 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_lunedi_durata_ciclo2: {name: "Lun C2 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_lunedi_durata_ciclo3: {name: "Lun C3 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_lunedi_durata_ciclo4: {name: "Lun C4 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_lunedi_durata_ciclo5: {name: "Lun C5 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_martedi_num_cicli: {name: "Mar N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  irrigazione_martedi_durata_ciclo1: {name: "Mar C1 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_martedi_durata_ciclo2: {name: "Mar C2 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_martedi_durata_ciclo3: {name: "Mar C3 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_martedi_durata_ciclo4: {name: "Mar C4 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_martedi_durata_ciclo5: {name: "Mar C5 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_mercoledi_num_cicli: {name: "Mer N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  irrigazione_mercoledi_durata_ciclo1: {name: "Mer C1 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_mercoledi_durata_ciclo2: {name: "Mer C2 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_mercoledi_durata_ciclo3: {name: "Mer C3 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_mercoledi_durata_ciclo4: {name: "Mer C4 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_mercoledi_durata_ciclo5: {name: "Mer C5 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_giovedi_num_cicli: {name: "Gio N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  irrigazione_giovedi_durata_ciclo1: {name: "Gio C1 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_giovedi_durata_ciclo2: {name: "Gio C2 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_giovedi_durata_ciclo3: {name: "Gio C3 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_giovedi_durata_ciclo4: {name: "Gio C4 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_giovedi_durata_ciclo5: {name: "Gio C5 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_venerdi_num_cicli: {name: "Ven N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  irrigazione_venerdi_durata_ciclo1: {name: "Ven C1 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_venerdi_durata_ciclo2: {name: "Ven C2 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_venerdi_durata_ciclo3: {name: "Ven C3 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_venerdi_durata_ciclo4: {name: "Ven C4 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_venerdi_durata_ciclo5: {name: "Ven C5 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_sabato_num_cicli: {name: "Sab N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  irrigazione_sabato_durata_ciclo1: {name: "Sab C1 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_sabato_durata_ciclo2: {name: "Sab C2 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_sabato_durata_ciclo3: {name: "Sab C3 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_sabato_durata_ciclo4: {name: "Sab C4 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_sabato_durata_ciclo5: {name: "Sab C5 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_domenica_num_cicli: {name: "Dom N.Cicli", min: 0, max: 5, step: 1, mode: slider, icon: mdi:counter}\n'
    + '  irrigazione_domenica_durata_ciclo1: {name: "Dom C1 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_domenica_durata_ciclo2: {name: "Dom C2 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_domenica_durata_ciclo3: {name: "Dom C3 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_domenica_durata_ciclo4: {name: "Dom C4 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_domenica_durata_ciclo5: {name: "Dom C5 Durata", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec}\n'
    + '  irrigazione_durata_manuale: {name: "Durata Manuale Irrigazione", min: 10, max: 7200, step: 10, mode: box, unit_of_measurement: sec, icon: mdi:timer-cog}\n'
    + '  irrigazione_soglia_pioggia: {name: "Soglia Pioggia %", min: 0, max: 100, step: 5, mode: slider, unit_of_measurement: "%", icon: mdi:weather-rainy}\n'
    + 'input_datetime:\n'
    + '  irrigazione_lunedi_orario_ciclo1: {name: "Lun C1 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_lunedi_orario_ciclo2: {name: "Lun C2 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_lunedi_orario_ciclo3: {name: "Lun C3 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_lunedi_orario_ciclo4: {name: "Lun C4 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_lunedi_orario_ciclo5: {name: "Lun C5 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_martedi_orario_ciclo1: {name: "Mar C1 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_martedi_orario_ciclo2: {name: "Mar C2 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_martedi_orario_ciclo3: {name: "Mar C3 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_martedi_orario_ciclo4: {name: "Mar C4 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_martedi_orario_ciclo5: {name: "Mar C5 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_mercoledi_orario_ciclo1: {name: "Mer C1 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_mercoledi_orario_ciclo2: {name: "Mer C2 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_mercoledi_orario_ciclo3: {name: "Mer C3 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_mercoledi_orario_ciclo4: {name: "Mer C4 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_mercoledi_orario_ciclo5: {name: "Mer C5 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_giovedi_orario_ciclo1: {name: "Gio C1 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_giovedi_orario_ciclo2: {name: "Gio C2 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_giovedi_orario_ciclo3: {name: "Gio C3 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_giovedi_orario_ciclo4: {name: "Gio C4 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_giovedi_orario_ciclo5: {name: "Gio C5 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_venerdi_orario_ciclo1: {name: "Ven C1 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_venerdi_orario_ciclo2: {name: "Ven C2 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_venerdi_orario_ciclo3: {name: "Ven C3 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_venerdi_orario_ciclo4: {name: "Ven C4 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_venerdi_orario_ciclo5: {name: "Ven C5 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_sabato_orario_ciclo1: {name: "Sab C1 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_sabato_orario_ciclo2: {name: "Sab C2 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_sabato_orario_ciclo3: {name: "Sab C3 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_sabato_orario_ciclo4: {name: "Sab C4 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_sabato_orario_ciclo5: {name: "Sab C5 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_domenica_orario_ciclo1: {name: "Dom C1 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_domenica_orario_ciclo2: {name: "Dom C2 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_domenica_orario_ciclo3: {name: "Dom C3 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_domenica_orario_ciclo4: {name: "Dom C4 Orario", has_date: false, has_time: true}\n'
    + '  irrigazione_domenica_orario_ciclo5: {name: "Dom C5 Orario", has_date: false, has_time: true}\n'
    + 'input_button:\n'
    + '  irrigazione_start_automazione: {name: "Avvia Automazione Irrigazione", icon: mdi:play-circle}\n'
    + '  irrigazione_stop_automazione: {name: "Ferma Automazione Irrigazione", icon: mdi:stop-circle}\n'
    + '  irrigazione_start_manuale: {name: "Avvia Irrigazione Manuale", icon: mdi:play-circle-outline}\n'
    + '  irrigazione_stop_manuale: {name: "Ferma Irrigazione Manuale", icon: mdi:stop-circle-outline}\n'
    + 'timer:\n'
    + '  irrigazione_ciclo_timer: {name: "Timer Ciclo Irrigazione", icon: mdi:clock, restore: true}\n'
    + '  irrigazione_manuale_timer: {name: "Timer Irrigazione Manuale", icon: mdi:hand-back-right, restore: true}\n'
    + 'counter:\n'
    + '  irrigazione_cicli_giornalieri: {name: "Cicli Irrigazione Oggi", step: 1, icon: mdi:counter}\n'
    + 'template:\n'
    + '  - sensor:\n'
    + '      - name: "Stato Irrigazione"\n'
    + '        unique_id: irrigazione_stato_sistema\n'
    + '        state: >\n'
    + '          {% if is_state(\'input_boolean.irrigazione_manuale_attiva\', \'on\') %}\n'
    + '            Manuale Attiva\n'
    + '          {% elif is_state(\'timer.irrigazione_ciclo_timer\', \'active\') %}\n'
    + '            Ciclo in Corso\n'
    + '          {% elif is_state(\'input_boolean.irrigazione_automazione_attiva\', \'on\') %}\n'
    + '            Automazione Attiva\n'
    + '          {% else %}\n'
    + '            Spenta\n'
    + '          {% endif %}\n'
    + '        icon: mdi:sprinkler\n'
    + 'automation:\n'
    + '  - id: irrigazione_avvio_automazione\n'
    + '    alias: "Irrigazione - Avvio Automazione"\n'
    + '    trigger:\n'
    + '      - platform: state\n'
    + '        entity_id: input_button.irrigazione_start_automazione\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_on\n'
    + '        target: {entity_id: input_boolean.irrigazione_automazione_attiva}\n'
    + '  - id: irrigazione_stop_automazione_handler\n'
    + '    alias: "Irrigazione - Stop Automazione"\n'
    + '    trigger:\n'
    + '      - platform: state\n'
    + '        entity_id: input_button.irrigazione_stop_automazione\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_off\n'
    + '        target: {entity_id: input_boolean.irrigazione_automazione_attiva}\n'
    + '      - service: timer.cancel\n'
    + '        target: {entity_id: timer.irrigazione_ciclo_timer}\n'
    + '  - id: irrigazione_avvio_manuale\n'
    + '    alias: "Irrigazione - Avvio Manuale"\n'
    + '    trigger:\n'
    + '      - platform: state\n'
    + '        entity_id: input_button.irrigazione_start_manuale\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_on\n'
    + '        target: {entity_id: input_boolean.irrigazione_manuale_attiva}\n'
    + '      - service: timer.start\n'
    + '        target: {entity_id: timer.irrigazione_manuale_timer}\n'
    + '        data:\n'
    + '          duration: "{{ states(\'input_number.irrigazione_durata_manuale\') | int(60) }}"\n'
    + '      - service: switch.turn_on\n'
    + '        target: {entity_id: IL_TUO_SWITCH_IRR}\n'
    + '  - id: irrigazione_stop_manuale_handler\n'
    + '    alias: "Irrigazione - Stop Manuale"\n'
    + '    trigger:\n'
    + '      - platform: state\n'
    + '        entity_id: input_button.irrigazione_stop_manuale\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_off\n'
    + '        target: {entity_id: input_boolean.irrigazione_manuale_attiva}\n'
    + '      - service: timer.cancel\n'
    + '        target: {entity_id: timer.irrigazione_manuale_timer}\n'
    + '      - service: switch.turn_off\n'
    + '        target: {entity_id: IL_TUO_SWITCH_IRR}\n'
    + '  - id: irrigazione_timer_ciclo_finito\n'
    + '    alias: "Irrigazione - Timer Ciclo Finito"\n'
    + '    trigger:\n'
    + '      - platform: event\n'
    + '        event_type: timer.finished\n'
    + '        event_data: {entity_id: timer.irrigazione_ciclo_timer}\n'
    + '    action:\n'
    + '      - service: switch.turn_off\n'
    + '        target: {entity_id: IL_TUO_SWITCH_IRR}\n'
    + '  - id: irrigazione_timer_manuale_finito\n'
    + '    alias: "Irrigazione - Timer Manuale Finito"\n'
    + '    trigger:\n'
    + '      - platform: event\n'
    + '        event_type: timer.finished\n'
    + '        event_data: {entity_id: timer.irrigazione_manuale_timer}\n'
    + '    action:\n'
    + '      - service: input_boolean.turn_off\n'
    + '        target: {entity_id: input_boolean.irrigazione_manuale_attiva}\n'
    + '      - service: switch.turn_off\n'
    + '        target: {entity_id: IL_TUO_SWITCH_IRR}\n'
    + '  - id: irrigazione_reset_giornaliero\n'
    + '    alias: "Irrigazione - Reset Cicli Giornalieri"\n'
    + '    trigger:\n'
    + '      - platform: time\n'
    + '        at: "00:00:00"\n'
    + '    action:\n'
    + '      - service: counter.reset\n'
    + '        target: {entity_id: counter.irrigazione_cicli_giornalieri}\n';

  function _buildPkgIRR(sw, push) {
    return _IRR_PKG_YAML.split('IL_TUO_SWITCH_IRR').join(sw || 'switch.rubinetto_esterno_interruttore');
  }

  function _openWizardIRR(hass, onDone) {
    var states = (hass && hass.states) || {};
    var switchIds = Object.keys(states).filter(function(id) { return /^switch\./.test(id); }).sort();
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(_IRR_WIZ_KEY) || 'null'); } catch(e) {}
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
        + '<div class="wd-hdr"><div class="wd-ico">💧</div>'
        + '<div><div class="wd-tit">Installa PKG Irrigazione</div><div class="wd-sub">frarik_irrigazione.yaml → config/packages/</div></div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'
        + '<div><div class="wd-sec">Switch Rubinetto</div>'
        + '<p class="wd-note">Switch/valvola che controlla il rubinetto esterno per l\'irrigazione.</p>'
        + '<div class="wd-lbl">Entity Switch Rubinetto</div>'
        + '<div class="wd-frow"><input class="wd-inp" id="f-switch" type="text" autocomplete="off" placeholder="switch.rubinetto_esterno_interruttore" value="' + swVal.replace(/"/g, '&quot;') + '"><div class="wd-drop" id="d-switch"></div></div>'
        + '</div>'
        + '<div><div class="wd-sec">Notifiche Push</div>'
        + '<p class="wd-note">mobile_app dei dispositivi per le notifiche push (es. <code>mobile_app_iphone</code>). Lascia vuoto per saltare.</p>'
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

      sr.getElementById('wd-install').addEventListener('click', async function() {
        var sw   = sr.getElementById('f-switch').value.trim();
        var push = Array.from(sr.querySelectorAll('.push-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        try { localStorage.setItem(_IRR_WIZ_KEY, JSON.stringify({sw: sw, push: push})); } catch(e) {}
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading'); btn.textContent = 'Download PKG…';
        var yaml;
        try {
          var ghR = await fetch('https://raw.githubusercontent.com/Frarik/cards/main/pkg/centro_controllo_irrigazione.yaml');
          if (ghR.ok) {
            yaml = (await ghR.text()).split('IL_TUO_SWITCH_IRRIGAZIONE').join(sw || 'switch.rubinetto_esterno_interruttore');
          }
        } catch(e) {}
        if (!yaml) yaml = _buildPkgIRR(sw, push);
        btn.textContent = 'Installazione…';
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_irrigazione.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Irrigazione installato! Riavvia HA.'); } catch(e) {}
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

  // ── Store helpers ────────────────────────────────────────────────────
  function _iH() { try { return (typeof window.frarikHass === 'function' && window.frarikHass()) || {}; } catch(e) { return {}; } }
  function _iKey(c) { return 'frarik_irrcard_' + (c.id || 'x'); }
  function _iLoad(c) { try { return JSON.parse(localStorage.getItem(_iKey(c)) || '{}') || {}; } catch(e) { return {}; } }
  function _iSave(c, o) { try { localStorage.setItem(_iKey(c), JSON.stringify(o)); } catch(e) {} }
  function _iS(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || null; }
  function _iAttr(h, id, a) { var s = h && h.states && h.states[id]; return (s && s.attributes && s.attributes[a] != null) ? s.attributes[a] : null; }
  function _iNum(v) { var x = parseFloat(String(v != null ? v : '').replace(',','.')); return isNaN(x) ? null : x; }
  function _iIsOn(h, id) { return !!(h && h.states && h.states[id] && h.states[id].state === 'on'); }

  function _iFmtTimer(h, tid) {
    if (_iS(h, tid) !== 'active') return {rem:'--:--', pct:0, active:false};
    var fa = _iAttr(h, tid, 'finishes_at'), dur = _iAttr(h, tid, 'duration');
    var remSec = fa ? Math.max(0, Math.floor((new Date(fa).getTime() - Date.now()) / 1000)) : 0;
    var durSec = 0;
    if (dur) { var p = String(dur).split(':').map(Number); durSec = (p[0]||0)*3600+(p[1]||0)*60+(p[2]||0); }
    var pct = durSec > 0 ? Math.max(0, Math.min(100, (remSec / durSec) * 100)) : 0;
    return {rem:('0'+Math.floor(remSec/60)).slice(-2)+':'+('0'+(remSec%60)).slice(-2), pct:pct, active:true};
  }

  function _iPkgDef() {
    return {
      pk_prefix:        'irrigazione',
      pk_stato:         'sensor.stato_irrigazione',
      pk_auto:          'input_boolean.irrigazione_automazione_attiva',
      pk_manuale:       'input_boolean.irrigazione_manuale_attiva',
      pk_timer_ciclo:   'timer.irrigazione_ciclo_timer',
      pk_timer_manuale: 'timer.irrigazione_manuale_timer',
      pk_cicli_oggi:    'counter.irrigazione_cicli_giornalieri',
      pk_acqua:         'sensor.consumo_acqua_irrigazione',
      pk_pioggia:       'sensor.probabilita_pioggia',
      pk_blocco_meteo:  'binary_sensor.blocco_meteo_irrigazione',
      pk_rubinetto:     'switch.rubinetto_esterno_interruttore',
      pk_btn_auto_on:   'input_button.irrigazione_start_automazione',
      pk_btn_auto_off:  'input_button.irrigazione_stop_automazione',
      pk_btn_man_on:    'input_button.irrigazione_start_manuale',
      pk_btn_man_off:   'input_button.irrigazione_stop_manuale',
    };
  }

  function _iCfgFor(card) {
    var st = _iLoad(card), pk = _iPkgDef(), r = {};
    Object.keys(pk).forEach(function(k) { r[k] = (st[k] !== undefined && st[k] !== '') ? st[k] : pk[k]; });
    r.name = st.name || 'Irrigazione Smart';
    return r;
  }

  function _iSprinklerSVG(stato, col, colRgb) {
    var active = stato === 'Ciclo in Corso' || stato === 'Manuale Attiva';
    var glow = active ? 'drop-shadow(0 0 10px rgba(' + colRgb + ',.3))' : 'drop-shadow(0 0 6px rgba(' + colRgb + ',.12))';
    var kf = active ? '@keyframes iBled{0%,100%{opacity:.5}50%{opacity:1}}' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 108" style="display:block;width:100%;height:100%;filter:' + glow + '">'
      + (kf ? '<defs><style>' + kf + '</style></defs>' : '')
      // Pipe stem from ground up
      + '<rect x="29" y="62" width="6" height="34" rx="3" fill="#0b1929" stroke="#1e3a5f" stroke-width=".6"/>'
      // Ground plate
      + '<ellipse cx="32" cy="97" rx="16" ry="4" fill="#090f1e" stroke="#1e3a5f" stroke-width=".5"/>'
      // Coupling ring
      + '<rect x="25" y="57" width="14" height="9" rx="4.5" fill="#0b1929" stroke="#1e3a5f" stroke-width=".55"/>'
      // Main sprinkler body (horizontal disc)
      + '<ellipse cx="32" cy="52" rx="22" ry="8" fill="#0b1929" stroke="' + col + '" stroke-width=".85"/>'
      + '<ellipse cx="32" cy="50" rx="20" ry="7" fill="#060e1c" stroke="rgba(' + colRgb + ',.12)" stroke-width=".4"/>'
      // 3D highlight
      + '<ellipse cx="24" cy="48" rx="5" ry="3.5" fill="rgba(255,255,255,.04)"/>'
      // Top dome
      + '<ellipse cx="32" cy="44" rx="13" ry="8" fill="#0d2040" stroke="rgba(' + colRgb + ',.2)" stroke-width=".5"/>'
      // Center rotor
      + '<circle cx="32" cy="44" r="6" fill="#091526" stroke="' + col + '" stroke-width=".85"/>'
      + '<circle cx="32" cy="44" r="3.5" fill="#040a12"/>'
      + '<circle cx="32" cy="44" r="1.8" fill="' + col + '" opacity="' + (active?'.9':'.35') + '"' + (active?' style="animation:iBled 1.5s ease-in-out infinite"':'') + '/>'
      // Spray nozzle holes (4 around)
      + '<circle cx="39" cy="39" r="1.8" fill="rgba(' + colRgb + ',.3)" stroke="rgba(' + colRgb + ',.5)" stroke-width=".4"/>'
      + '<circle cx="25" cy="39" r="1.8" fill="rgba(' + colRgb + ',.3)" stroke="rgba(' + colRgb + ',.5)" stroke-width=".4"/>'
      + '<circle cx="32" cy="37" r="1.8" fill="rgba(' + colRgb + ',.3)" stroke="rgba(' + colRgb + ',.5)" stroke-width=".4"/>'
      + '<circle cx="38" cy="48" r="1.6" fill="rgba(' + colRgb + ',.2)" stroke="rgba(' + colRgb + ',.4)" stroke-width=".4"/>'
      // Flow valve on side
      + '<rect x="4" y="58" width="14" height="6" rx="3" fill="#0b1929" stroke="#1e3a5f" stroke-width=".55"/>'
      + '<rect x="3" y="54" width="4" height="14" rx="2" fill="#0c1d35" stroke="#1e3a5f" stroke-width=".4"/>'
      + '<text x="11" y="63" text-anchor="middle" font-size="4" fill="' + col + '" font-family="system-ui,sans-serif" font-weight="800">V</text>'
      // Water arcs when active
      + (active ? (
          '<g>'
        + '<path d="M 16 42 Q 6 25 2 14" fill="none" stroke="' + col + '" stroke-width="1.2" stroke-linecap="round" opacity=".65"><animate attributeName="opacity" values=".7;.15;.7" dur="1.2s" repeatCount="indefinite"/></path>'
        + '<path d="M 48 42 Q 58 25 62 14" fill="none" stroke="' + col + '" stroke-width="1.2" stroke-linecap="round" opacity=".55"><animate attributeName="opacity" values=".6;.1;.6" dur="1.4s" begin=".3s" repeatCount="indefinite"/></path>'
        + '<path d="M 32 37 Q 32 20 32 8" fill="none" stroke="' + col + '" stroke-width="1.2" stroke-linecap="round" opacity=".6"><animate attributeName="opacity" values=".65;.1;.65" dur="1s" begin=".6s" repeatCount="indefinite"/></path>'
        + '<circle cx="4" cy="12" r="1.8" fill="' + col + '"><animate attributeName="cy" values="12;22;12" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite"/></circle>'
        + '<circle cx="60" cy="12" r="1.6" fill="' + col + '"><animate attributeName="cy" values="12;20;12" dur="1.4s" begin=".4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="1.4s" begin=".4s" repeatCount="indefinite"/></circle>'
        + '<circle cx="32" cy="6" r="1.4" fill="' + col + '"><animate attributeName="cy" values="6;16;6" dur="1s" begin=".2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="1s" begin=".2s" repeatCount="indefinite"/></circle>'
        + '</g>'
      ) : '')
      + '</svg>';
  }

  function _iRender(card) {
    var h = _iH(), c = _iCfgFor(card);
    var rid = 'frirr' + (card.id || 'irr');
    var stato = _iS(h, c.pk_stato) || 'Spenta';
    var autoOn = _iIsOn(h, c.pk_auto), manOn = _iIsOn(h, c.pk_manuale);
    var blocco = _iIsOn(h, c.pk_blocco_meteo);
    var rubOn = _iIsOn(h, c.pk_rubinetto);
    var timerC = _iFmtTimer(h, c.pk_timer_ciclo), timerM = _iFmtTimer(h, c.pk_timer_manuale);
    var cicliOggi = _iNum(_iS(h, c.pk_cicli_oggi)) || 0;
    var acqua = _iNum(_iS(h, c.pk_acqua));
    var pioggia = _iNum(_iS(h, c.pk_pioggia)) || 0;
    var activeTimer = timerC.active ? timerC : timerM;
    var timerActive = timerC.active || timerM.active;
    var timerLabel = timerC.active ? 'CICLO' : 'MANUALE';
    var col = '#64748b', colRgb = '100,116,139', statusLabel = 'SPENTA', statusText = 'Spenta';
    if (blocco)                              { col = '#f59e0b'; colRgb = '245,158,11';  statusLabel = 'METEO';     statusText = 'Blocco meteo'; }
    else if (stato === 'Manuale Attiva')     { col = '#f97316'; colRgb = '249,115,22';  statusLabel = 'MANUALE';   statusText = 'Manuale attiva'; }
    else if (stato === 'Ciclo in Corso')     { col = '#38bdf8'; colRgb = '56,189,248';  statusLabel = 'CICLO';     statusText = 'Ciclo in corso'; }
    else if (stato === 'Automazione Attiva') { col = '#06b6d4'; colRgb = '6,182,212';   statusLabel = 'IN ATTESA'; statusText = 'Automazione attiva'; }

    var barPct = timerActive ? activeTimer.pct : 0;
    var barLbl = timerActive ? (timerLabel + ' in corso') : 'Cicli oggi';
    var barVal = timerActive ? activeTimer.rem : (cicliOggi + ' cicli');

    var css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#08101a 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(' + colRgb + ',.08) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.28);color:' + col + '}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + col + (timerActive?';animation:irrPulse 1.5s ease-in-out infinite':'') + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:stretch;padding:10px 14px 8px;flex:1}'
      + '#' + rid + ' .fc-hero-img{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;max-height:130px}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:6px;justify-content:center;min-width:0;border-left:1px solid rgba(255,255,255,.07);padding-left:10px;overflow:hidden}'
      + '#' + rid + ' .fc-st{display:flex;align-items:center;justify-content:flex-end;gap:7px;font-size:14px;font-weight:800;color:' + col + ';padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-stdot{width:8px;height:8px;border-radius:50%;background:' + col + ';flex-shrink:0' + (timerActive?';animation:irrPulse 1.5s ease-in-out infinite':'') + '}'
      + '#' + rid + ' .fc-met{display:flex;align-items:center;justify-content:space-between;gap:4px}'
      + '#' + rid + ' .fc-met-lbl{font-size:11px;font-weight:700;color:#fff;flex-shrink:0}'
      + '#' + rid + ' .fc-met-v{font-size:15px;font-weight:800;color:#fff;text-align:right}'
      + '#' + rid + ' .fc-tmr{display:flex;flex-direction:column;align-items:flex-end;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-tmr-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.4)}'
      + '#' + rid + ' .fc-tmr-v{font-size:22px;font-weight:900;color:' + col + ';font-variant-numeric:tabular-nums;letter-spacing:-.02em}'
      + '#' + rid + ' .fc-pwfull{margin:0 14px 10px}'
      + '#' + rid + ' .fc-pwfull-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:3px}'
      + '#' + rid + ' .fc-pwfull-lbl{font-size:10px;font-weight:700;color:#fff}'
      + '#' + rid + ' .fc-pwfull-v{font-size:18px;font-weight:900;color:' + col + ';line-height:1}'
      + '#' + rid + ' .fc-pw-bar{height:5px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden}'
      + '#' + rid + ' .fc-pw-fill{height:100%;border-radius:2px;transition:width .6s,background .4s}'
      + '#' + rid + ' .fc-stats{display:flex;margin:0 14px 8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden}'
      + '#' + rid + ' .fc-sb{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 3px;gap:2px}'
      + '#' + rid + ' .fc-sb-sep{width:1px;background:rgba(255,255,255,.08);flex-shrink:0}'
      + '#' + rid + ' .fc-sb-n{font-size:12px;font-weight:900;color:' + col + ';height:18px;display:flex;align-items:center;justify-content:center}'
      + '#' + rid + ' .fc-sb-l{font-size:8px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px;text-align:center}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 12px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:3px}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(' + colRgb + ',.12);border-color:rgba(' + colRgb + ',.3);color:' + col + '}'
      + '#' + rid + ' .fc-btn-act{background:rgba(' + colRgb + ',.15);border-color:rgba(' + colRgb + ',.35);color:' + col + '}'
      + (timerActive ? '@keyframes irrPulse{0%,100%{opacity:.6}50%{opacity:1}}' : '')
      + '</style>';

    var heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-img">' + _iSprinklerSVG(stato, col, colRgb) + '</div>'
      + '<div class="fc-hero-r">'
      + (timerActive
          ? '<div class="fc-tmr"><div class="fc-tmr-lbl">' + timerLabel + '</div><div class="fc-tmr-v">' + activeTimer.rem + '</div></div>'
          : '<div class="fc-st">' + statusText + '<div class="fc-stdot"></div></div>')
      + '<div class="fc-met"><span class="fc-met-lbl">Cicli oggi</span><span class="fc-met-v">' + cicliOggi + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Acqua</span><span class="fc-met-v">' + (acqua != null ? acqua.toFixed(1) + ' L' : '— L') + '</span></div>'
      + '<div class="fc-met"><span class="fc-met-lbl">Pioggia</span><span class="fc-met-v" style="color:' + (pioggia > 50 ? '#f59e0b' : '#fff') + '">' + pioggia.toFixed(0) + ' %</span></div>'
      + '</div></div>';

    var pwBarHtml = '<div class="fc-pwfull">'
      + '<div class="fc-pwfull-hd"><span class="fc-pwfull-lbl">' + barLbl + '</span><span class="fc-pwfull-v">' + barVal + '</span></div>'
      + '<div class="fc-pw-bar"><div class="fc-pw-fill" style="width:' + barPct.toFixed(1) + '%;background:' + col + ';box-shadow:0 0 6px ' + col + '88"></div></div>'
      + '</div>';

    var statsHtml = '<div class="fc-stats">'
      + '<div class="fc-sb"><div class="fc-sb-n">' + cicliOggi + '</div><div class="fc-sb-l">Cicli/giorno</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n">' + pioggia.toFixed(0) + '%</div><div class="fc-sb-l">Pioggia</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n" style="color:' + (blocco?'#f59e0b':'#22c55e') + '">' + (blocco?'⛈':'✓') + '</div><div class="fc-sb-l">Meteo</div></div>'
      + '<div class="fc-sb-sep"></div>'
      + '<div class="fc-sb"><div class="fc-sb-n" style="color:' + (rubOn?col:'#64748b') + '">' + (rubOn?'ON':'OFF') + '</div><div class="fc-sb-l">Rubinetto</div></div>'
      + '</div>';

    // Day chips
    var iPrefix = c.pk_prefix || 'irrigazione';
    var iDayIds = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var iDayShort = ['LU','MA','ME','GI','VE','SA','DO'];
    var iDayChipsInner = iDayShort.map(function(dn, i) {
      var isDay = _iIsOn(h, 'input_boolean.' + iPrefix + '_' + iDayIds[i]);
      return '<div data-sya="day-' + iDayIds[i] + '" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:4px 2px">'
        + '<div style="font-size:9px;font-weight:800;color:' + (isDay ? '#fff' : 'rgba(255,255,255,.28)') + '">' + dn + '</div>'
        + '<div style="width:100%;max-width:30px;height:30px;border-radius:8px;background:rgba(' + (isDay ? colRgb : '100,116,139') + ',.12);border:1px solid rgba(' + (isDay ? colRgb : '100,116,139') + ',' + (isDay ? '.45' : '.14') + ');display:flex;align-items:center;justify-content:center">'
        + '<div style="width:8px;height:8px;border-radius:50%;background:' + (isDay ? col : '#2d3748') + '"></div>'
        + '</div></div>';
    }).join('');
    var iDayChipsHtml = '<div style="display:flex;padding:4px 10px 10px;gap:1px;border-top:1px solid rgba(255,255,255,.06)">' + iDayChipsInner + '</div>';

    var btnsHtml = '<div class="fc-btns">'
      + '<div class="fc-btn' + (manOn?' fc-btn-act':'') + '" data-sya="' + (manOn?'man-off':'man-on') + '">' + (manOn?'⏹ Ferma Man.':'▶ Manuale') + '</div>'
      + '<div class="fc-btn' + (autoOn?' fc-btn-act':'') + '" data-sya="' + (autoOn?'auto-off':'auto-on') + '">' + (autoOn?'⏹ Stop Auto':'▶ Auto') + '</div>'
      + '<div class="fc-btn" data-sya="programma" style="flex:0.65;background:rgba(56,189,248,.07);border-color:rgba(56,189,248,.22)">📅</div>'
      + '<div class="fc-btn" data-sya="popup-cfg" style="flex:0.55">⚙</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '"><div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">💧</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'Irrigazione Smart') + '</div>'
      + '<div class="fc-hdr-pill"><div class="fc-dot"></div>' + statusLabel + '</div>'
      + '</div>'
      + '<div class="fc-scroll">' + heroHtml + pwBarHtml + statsHtml + iDayChipsHtml + btnsHtml + '</div>'
      + '</div></div>';
  }

  function _iMkOv(html, closeId) {
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

  function _iPopShell(icon, rgb, title, sub, closeId, content) {
    return '<style>@keyframes iUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.ipc{overflow-y:auto;scrollbar-width:none}.ipc::-webkit-scrollbar{display:none}</style>'
      + '<div style="width:100%;max-height:78vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + rgb + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:iUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.3)">' + icon + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#fff">' + title + '</div><div style="font-size:11px;color:#fff;margin-top:1px">' + sub + '</div></div>'
      + '<button id="' + closeId + '" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      + '</div>'
      + '<div class="ipc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }

  function _iOpenProgramma(card, el) {
    var h = _iH(), c = _iCfgFor(card);
    var prefix = c.pk_prefix || 'irrigazione';
    var dayIds = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dayLabels = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
    var dayRows = dayIds.map(function(d, i) {
      var isOn = _iIsOn(h, 'input_boolean.' + prefix + '_' + d);
      var nC = Math.round(_iNum(_iS(h, 'input_number.' + prefix + '_' + d + '_num_cicli')) || 0);
      var t1 = _iS(h, 'input_datetime.' + prefix + '_' + d + '_orario_ciclo1') || '';
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">'
        + '<div style="font-size:11px;font-weight:700;color:#fff;width:76px;flex-shrink:0">' + dayLabels[i] + '</div>'
        + '<div class="irr-dtog" data-eid="input_boolean.' + prefix + '_' + d + '" data-on="' + (isOn?'1':'0') + '" '
        + 'style="width:36px;height:20px;border-radius:10px;flex-shrink:0;cursor:pointer;background:' + (isOn?'#38bdf8':'rgba(255,255,255,.15)') + ';position:relative;transition:background .2s">'
        + '<div style="position:absolute;top:2px;' + (isOn?'right:2px':'left:2px') + ';width:16px;height:16px;border-radius:50%;background:#fff;transition:all .2s"></div>'
        + '</div>'
        + '<div style="flex:1;min-width:0">'
        + (isOn
          ? '<span style="font-size:11px;color:#38bdf8;font-weight:700">' + nC + ' cicli</span>'
          + (t1 ? '<span style="font-size:10px;color:rgba(255,255,255,.4)"> · ' + t1.slice(0,5) + '</span>' : '')
          : '<span style="font-size:10px;color:rgba(255,255,255,.28)">Disattivato</span>')
        + '</div>'
        + '<button class="irr-dedit" data-day="' + d + '" style="padding:4px 9px;border-radius:7px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);font-size:10px;color:#fff;cursor:pointer;flex-shrink:0">✏ Cicli</button>'
        + '</div>';
    }).join('');
    var durM    = Math.round(_iNum(_iS(h,'input_number.'+prefix+'_durata_manuale'))||60);
    var soglia  = Math.round(_iNum(_iS(h,'input_number.'+prefix+'_soglia_pioggia'))||50);
    var tarMens = Math.round(_iNum(_iS(h,'input_number.'+prefix+'_cicli_target_mensili'))||30);
    var content = '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding-bottom:5px;border-bottom:1px solid rgba(56,189,248,.2);margin-bottom:8px">Giorni e cicli</div>'
      + dayRows
      + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding-bottom:5px;border-bottom:1px solid rgba(56,189,248,.2);margin:16px 0 10px">Impostazioni globali</div>'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px"><span style="font-size:11px;color:#fff;flex:1">Durata manuale</span>'
      + '<input id="irrpm-dur" type="number" min="10" max="7200" step="10" value="' + durM + '" style="width:80px;padding:6px 9px;border-radius:7px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;outline:none;text-align:right">'
      + '<span style="font-size:10px;color:rgba(255,255,255,.4);flex-shrink:0">sec</span></div>'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px"><span style="font-size:11px;color:#fff;flex:1">Soglia blocco pioggia</span>'
      + '<input id="irrpm-sog" type="number" min="0" max="100" step="5" value="' + soglia + '" style="width:80px;padding:6px 9px;border-radius:7px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;outline:none;text-align:right">'
      + '<span style="font-size:10px;color:rgba(255,255,255,.4);flex-shrink:0">%</span></div>'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px"><span style="font-size:11px;color:#fff;flex:1">Target cicli mensili</span>'
      + '<input id="irrpm-tar" type="number" min="1" max="999" step="1" value="' + tarMens + '" style="width:80px;padding:6px 9px;border-radius:7px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;outline:none;text-align:right">'
      + '<span style="font-size:10px;color:rgba(255,255,255,.4);flex-shrink:0">cicli</span></div>'
      + '<button id="irrpm-save" style="width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#38bdf8;color:#04111a">💾 Salva impostazioni globali</button>';
    var ov = _iMkOv(_iPopShell('📅','56,189,248','Programma settimanale','Giorni attivi e impostazioni','irr-pm-cl',content),'irr-pm-cl');
    ov.querySelectorAll('.irr-dtog').forEach(function(tog) {
      tog.addEventListener('click', function() {
        var wasOn = tog.dataset.on === '1';
        _iCallSvc('input_boolean', wasOn?'turn_off':'turn_on', {entity_id:tog.dataset.eid});
        tog.dataset.on = wasOn ? '0' : '1';
        tog.style.background = wasOn ? 'rgba(255,255,255,.15)' : '#38bdf8';
        var k = tog.querySelector('div'); if (k) { k.style.right = wasOn?'':'2px'; k.style.left = wasOn?'2px':''; }
      });
    });
    ov.querySelectorAll('.irr-dedit').forEach(function(btn) {
      btn.addEventListener('click', function() { _iOpenDayDetail(card, btn.dataset.day, prefix); });
    });
    ov.querySelector('#irrpm-save').addEventListener('click', function() {
      var h2 = _iH();
      var dv = (ov.querySelector('#irrpm-dur')||{}).value;
      var sv = (ov.querySelector('#irrpm-sog')||{}).value;
      var tv = (ov.querySelector('#irrpm-tar')||{}).value;
      if (dv && h2 && h2.callService) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_durata_manuale',value:parseFloat(dv)});
      if (sv && h2 && h2.callService) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_soglia_pioggia',value:parseFloat(sv)});
      if (tv && h2 && h2.callService) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_cicli_target_mensili',value:parseFloat(tv)});
      ov._close(); if (el) el._fcSig = null;
    });
  }

  function _iOpenDayDetail(card, day, prefix) {
    var h = _iH();
    var lbl = {lunedi:'Lunedì',martedi:'Martedì',mercoledi:'Mercoledì',giovedi:'Giovedì',venerdi:'Venerdì',sabato:'Sabato',domenica:'Domenica'}[day]||day;
    var nC = Math.round(_iNum(_iS(h,'input_number.'+prefix+'_'+day+'_num_cicli'))||0);
    var rows = '';
    for (var i = 1; i <= 5; i++) {
      var tv = _iS(h,'input_datetime.'+prefix+'_'+day+'_orario_ciclo'+i) || '07:00:00';
      var dv = Math.round(_iNum(_iS(h,'input_number.'+prefix+'_'+day+'_durata_ciclo'+i))||60);
      var dim = i > nC ? 'opacity:0.33;' : '';
      rows += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;' + dim + '">'
        + '<div style="font-size:11px;font-weight:900;color:#38bdf8;width:22px;flex-shrink:0">C' + i + '</div>'
        + '<input type="time" value="' + tv.slice(0,5) + '" id="irrdd-t' + i + '" style="flex:1;padding:7px 9px;border-radius:8px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:13px;outline:none">'
        + '<input type="number" value="' + dv + '" id="irrdd-d' + i + '" min="10" max="7200" step="10" style="width:70px;padding:7px 8px;border-radius:8px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;outline:none;text-align:right">'
        + '<span style="font-size:9px;color:rgba(255,255,255,.4);flex-shrink:0">sec</span></div>';
    }
    var content = '<div style="display:flex;align-items:center;gap:10px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:12px">'
      + '<span style="font-size:12px;color:#fff;flex:1">Cicli attivi (0-5)</span>'
      + '<input id="irrdd-nc" type="number" min="0" max="5" step="1" value="' + nC + '" style="width:62px;padding:7px;border-radius:8px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(56,189,248,.35);font-size:17px;font-weight:800;outline:none;text-align:center">'
      + '</div>'
      + '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#38bdf8;margin-bottom:8px">Orario avvio · Durata per ciclo</div>'
      + rows
      + '<button id="irrdd-save" style="width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#38bdf8;color:#04111a;margin-top:4px">💾 Salva ' + lbl + '</button>';
    var ov2 = _iMkOv(_iPopShell('📅','56,189,248',lbl,'Orari e durate cicli','irrdd-cl',content),'irrdd-cl');
    ov2.querySelector('#irrdd-save').addEventListener('click', function() {
      var h2 = _iH();
      var ncv = parseInt((ov2.querySelector('#irrdd-nc')||{}).value)||0;
      if (h2&&h2.callService) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_'+day+'_num_cicli',value:ncv});
      for (var j = 1; j <= 5; j++) {
        var ti = ov2.querySelector('#irrdd-t'+j), di = ov2.querySelector('#irrdd-d'+j);
        if (ti&&ti.value&&h2&&h2.callService) h2.callService('input_datetime','set_datetime',{entity_id:'input_datetime.'+prefix+'_'+day+'_orario_ciclo'+j,time:ti.value+':00'});
        if (di&&di.value&&h2&&h2.callService) h2.callService('input_number','set_value',{entity_id:'input_number.'+prefix+'_'+day+'_durata_ciclo'+j,value:parseFloat(di.value)});
      }
      ov2._close();
    });
  }

  function _iOpenCfg(card, el) {
    var c = _iCfgFor(card);
    function fld(key, label, ph) {
      return '<div style="margin-bottom:10px">'
        + '<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px">' + label + '</div>'
        + '<input id="irrf-' + key + '" type="text" autocomplete="off" placeholder="' + ph + '" value="' + (c[key]||'').replace(/"/g,'&quot;') + '" style="width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:11px;font-family:monospace;box-sizing:border-box;outline:none">'
        + '</div>';
    }
    function sec(t) { return '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#38bdf8;padding-bottom:4px;border-bottom:1px solid rgba(56,189,248,.18);margin:14px 0 10px">' + t + '</div>'; }
    var content = '<div style="margin-bottom:10px"><div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px">Nome card</div>'
      + '<input id="irrf-name" type="text" placeholder="Irrigazione Smart" value="' + (c.name||'').replace(/"/g,'&quot;') + '" style="width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:11px;box-sizing:border-box;outline:none"></div>'
      + sec('Prefisso entità PKG')
      + fld('pk_prefix','Prefisso schedule','irrigazione')
      + sec('Sensori di stato')
      + fld('pk_stato','Sensore stato','sensor.stato_irrigazione')
      + fld('pk_pioggia','Probabilità pioggia','sensor.probabilita_pioggia')
      + fld('pk_blocco_meteo','Binary blocco meteo','binary_sensor.blocco_meteo_irrigazione')
      + fld('pk_cicli_oggi','Cicli giornalieri','counter.irrigazione_cicli_giornalieri')
      + fld('pk_acqua','Consumo acqua','sensor.consumo_acqua_irrigazione')
      + sec('Controllo')
      + fld('pk_auto','Automazione boolean','input_boolean.irrigazione_automazione_attiva')
      + fld('pk_manuale','Manuale boolean','input_boolean.irrigazione_manuale_attiva')
      + fld('pk_rubinetto','Switch rubinetto','switch.rubinetto_esterno_interruttore')
      + fld('pk_timer_ciclo','Timer ciclo','timer.irrigazione_ciclo_timer')
      + fld('pk_timer_manuale','Timer manuale','timer.irrigazione_manuale_timer')
      + sec('Pulsanti azione')
      + fld('pk_btn_auto_on','Avvia automazione','input_button.irrigazione_start_automazione')
      + fld('pk_btn_auto_off','Ferma automazione','input_button.irrigazione_stop_automazione')
      + fld('pk_btn_man_on','Avvia manuale','input_button.irrigazione_start_manuale')
      + fld('pk_btn_man_off','Ferma manuale','input_button.irrigazione_stop_manuale')
      + '<button id="irr-save" style="width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#38bdf8;color:#041622;margin-top:8px">💾 Salva</button>';
    var ov = _iMkOv(_iPopShell('💧','56,189,248','Impostazioni',c.name||'Irrigazione Smart','irr-cfg-cl',content),'irr-cfg-cl');
    ov.querySelector('#irr-save').addEventListener('click', function() {
      var pk = _iPkgDef(), saved = {};
      Object.keys(pk).forEach(function(k) { var i = ov.querySelector('#irrf-'+k); if (i) saved[k] = i.value.trim(); });
      var ni = ov.querySelector('#irrf-name'); if (ni) saved.name = ni.value.trim();
      _iSave(card, saved);
      ov._close();
      if (el) el._fcSig = null;
    });
  }

  function _iCallSvc(domain, svc, data) {
    try { var h = _iH(); if (h && h.callService) { h.callService(domain, svc, data); return; } if (window.callSvc) window.callSvc(domain, svc, data); } catch(e) {}
  }

  function _iComputeSig(h, c) {
    var px = c.pk_prefix||'irrigazione';
    var dk = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'];
    var dsg = dk.map(function(d){return _iIsOn(h,'input_boolean.'+px+'_'+d)?'1':'0';}).join('');
    var tc = _iS(h,c.pk_timer_ciclo), tm = _iS(h,c.pk_timer_manuale);
    return ['2.1irr',_iS(h,c.pk_stato),_iS(h,c.pk_auto),_iS(h,c.pk_manuale),tc,tm,_iS(h,c.pk_cicli_oggi),_iS(h,c.pk_blocco_meteo),_iS(h,c.pk_pioggia),_iS(h,c.pk_rubinetto),dsg].join('|');
  }

  function _iMount(card, hass, el) {
    if (el._fcBound === '2.1irr') return;
    el._fcBound = '2.1irr';
    if (el._fcHandler) el.removeEventListener('click', el._fcHandler);
    el._fcHandler = function(e) {
      var t = e.target.closest('[data-sya]'); if (!t) return;
      var a = t.dataset.sya, c = _iCfgFor(card);
      if (a === 'man-on')    _iCallSvc('input_button','press',{entity_id:c.pk_btn_man_on});
      if (a === 'man-off')   _iCallSvc('input_button','press',{entity_id:c.pk_btn_man_off});
      if (a === 'auto-on')   _iCallSvc('input_button','press',{entity_id:c.pk_btn_auto_on});
      if (a === 'auto-off')  _iCallSvc('input_button','press',{entity_id:c.pk_btn_auto_off});
      if (a === 'programma') _iOpenProgramma(card, el);
      if (a === 'popup-cfg') _iOpenCfg(card, el);
      if (a.length > 4 && a.slice(0,4) === 'day-') _iOpenDayDetail(card, a.slice(4), _iCfgFor(card).pk_prefix||'irrigazione');
    };
    el.addEventListener('click', el._fcHandler);
    clearInterval(el._irrPoll);
    el._irrPoll = setInterval(function() {
      try {
        if (!el._fcBound) { clearInterval(el._irrPoll); return; }
        var h = _iH(), c2 = _iCfgFor(card);
        var sig = _iComputeSig(h, c2);
        var tc2 = _iS(h,c2.pk_timer_ciclo), tm2 = _iS(h,c2.pk_timer_manuale);
        if (tc2 === 'active' || tm2 === 'active') sig += '|' + Date.now();
        if (el._fcSig !== sig) { el._fcSig = sig; el.innerHTML = _iRender(card); }
      } catch(e) {}
    }, 2000);
  }

  function _iUpdate(card, hass, el) {
    var h = _iH(), c = _iCfgFor(card);
    var tc = _iS(h,c.pk_timer_ciclo), tm = _iS(h,c.pk_timer_manuale);
    var sig = _iComputeSig(h, c);
    if (tc === 'active' || tm === 'active') sig += '|' + Math.floor(Date.now()/1000);
    if (tc === 'active' || tm === 'active') {
      clearTimeout(el._irrTick);
      el._irrTick = setTimeout(function() { el._fcSig = null; }, 1000);
    }
    if (!el.querySelector('.fc-card') || el._fcSig !== sig) { el._fcSig = sig; el.innerHTML = _iRender(card); }
    _iMount(card, hass, el);
  }

  var _IRR_CARD = {
    id: 'irrigazione', name: 'Irrigazione Smart', icon: '💧', version: '2.2',
    desc: 'Controllo irrigazione: schedule settimanale, timer animato, blocco meteo e storico.',
    render:    function(card) { return _iRender(card); },
    mount:     function(card, hass, el) { _iMount(card, hass, el); },
    update:    function(card, hass, el) { _iUpdate(card, hass, el); },
    configure: function(card, el) { _iOpenCfg(card, el); },
    frarik_pkg_check:   'sensor.stato_irrigazione',
    frarik_pkg_id:      'frarik_irrigazione',
    frarik_pkg_version: '1.0',
    openWizard: _openWizardIRR,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[_IRR_CARD.id] = _IRR_CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[_IRR_CARD.id] = _IRR_CARD;
  try { console.log('[FratechStore] Card registrata: irrigazione v' + _IRR_CARD.version); } catch(e) {}
})();
