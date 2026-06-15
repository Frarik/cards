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
