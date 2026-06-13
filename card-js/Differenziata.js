/**
 * differenziata-card.js — Raccolta Differenziata Lovelace Card
 * Entità: input_text x7, input_datetime, input_boolean x2, sensor
 */

const DD_DAYS  = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica']
const DD_LBL   = ['LU','MA','ME','GI','VE','SA','DO']
const DD_FULL  = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']
const DD_MONTH = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

const PRESETS = [
  { val:'Organico',        short:'U', color:'#92400e', bg:'rgba(180,83,9,.85)'  },
  { val:'Carta',           short:'C', color:'#1e40af', bg:'rgba(37,99,235,.85)' },
  { val:'Plastica',        short:'P', color:'#b45309', bg:'rgba(217,119,6,.85)' },
  { val:'Vetro',           short:'V', color:'#15803d', bg:'rgba(22,163,74,.85)' },
  { val:'Indifferenziato', short:'I', color:'#4b5563', bg:'rgba(75,85,99,.85)'  },
  { val:'Nessun Ritiro',   short:'✕', color:'#374151', bg:'rgba(55,65,81,.75)'  },
]

function wasteInfo(text) {
  const t = (text || '').toLowerCase().trim()
  if (!t) return { label:'—', short:'?', color:'#374151', glow:'none', hasPickup:false }
  if (t.includes('nessun') || t.includes('niente') || t === 'no')
    return { label:'Nessun Ritiro', short:'—', color:'#4b5563', glow:'none', hasPickup:false }
  if (t.includes('organ') || t.includes('umido'))
    return { label:text, short:'Org', color:'#b45309', glow:'rgba(180,83,9,.4)',   hasPickup:true }
  if (t.includes('carta') || t.includes('carton'))
    return { label:text, short:'Car', color:'#3b82f6', glow:'rgba(59,130,246,.4)', hasPickup:true }
  if (t.includes('plastic') || t.includes('metall') || t.includes('latt'))
    return { label:text, short:'Pla', color:'#eab308', glow:'rgba(234,179,8,.4)',  hasPickup:true }
  if (t.includes('vetro'))
    return { label:text, short:'Vet', color:'#22c55e', glow:'rgba(34,197,94,.4)',  hasPickup:true }
  if (t.includes('indiff') || t.includes('secco'))
    return { label:text, short:'Ind', color:'#6b7280', glow:'rgba(107,114,128,.3)',hasPickup:true }
  if (t.includes('multi') || t.includes('misto'))
    return { label:text, short:'Mul', color:'#a78bfa', glow:'rgba(167,139,250,.4)',hasPickup:true }
  return { label:text, short:text.slice(0,3), color:'#06b6d4', glow:'rgba(6,182,212,.4)', hasPickup:true }
}

// Bidone a ruote SVG — colore personalizzato
function binSvg(color, sz) {
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="17" y="0" width="14" height="7" rx="3.5" fill="${color}" opacity="0.55"/>
    <rect x="3" y="6" width="42" height="10" rx="3" fill="${color}"/>
    <path d="M7 18 L9.5 47.5 Q9.5 52 14 52 H34 Q38.5 52 38.5 47.5 L41 18 Z" fill="${color}" opacity="0.88"/>
    <rect x="15.5" y="21" width="2.5" height="25" rx="1.3" fill="rgba(255,255,255,.22)"/>
    <rect x="23" y="21" width="2.5" height="25" rx="1.3" fill="rgba(255,255,255,.22)"/>
    <circle cx="13.5" cy="56" r="4.2" fill="${color}" opacity="0.65"/>
    <circle cx="34.5" cy="56" r="4.2" fill="${color}" opacity="0.65"/>
  </svg>`
}

// Bidone vuoto per "Nessun Ritiro"
function emptyBinSvg(sz) {
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="17" y="0" width="14" height="7" rx="3.5" fill="rgba(255,255,255,.08)"/>
    <rect x="3" y="6" width="42" height="10" rx="3" fill="rgba(255,255,255,.1)"/>
    <path d="M7 18 L9.5 47.5 Q9.5 52 14 52 H34 Q38.5 52 38.5 47.5 L41 18 Z" fill="rgba(255,255,255,.05)"/>
    <rect x="15.5" y="21" width="2.5" height="25" rx="1.3" fill="rgba(255,255,255,.05)"/>
    <rect x="23" y="21" width="2.5" height="25" rx="1.3" fill="rgba(255,255,255,.05)"/>
    <circle cx="13.5" cy="56" r="4.2" fill="rgba(255,255,255,.08)"/>
    <circle cx="34.5" cy="56" r="4.2" fill="rgba(255,255,255,.08)"/>
    <line x1="17" y1="25" x2="31" y2="39" stroke="rgba(255,255,255,.2)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="31" y1="25" x2="17" y2="39" stroke="rgba(255,255,255,.2)" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`
}

// ─── Icone SVG ────────────────────────────────────────────────────────────────
const IC = {
  trash:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  pencil: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  gear:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  bell:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  phone:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  alexa:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
  arrow:  `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
:host { display:block; }
* { box-sizing:border-box; margin:0; padding:0; }
.card {
  background:var(--ha-card-background,#111827);
  border-radius:var(--ha-card-border-radius,16px);
  border:1px solid rgba(255,255,255,.08);
  overflow:hidden;
  font-family:var(--primary-font-family,system-ui,sans-serif);
  box-shadow:0 8px 32px rgba(0,0,0,.3);
  transition:border-color .4s, box-shadow .4s;
}

/* Header */
.hdr { display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid rgba(255,255,255,.06); }
.hdr-icon { width:40px;height:40px;border-radius:11px;flex-shrink:0;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);display:flex;align-items:center;justify-content:center;color:#22c55e; }
.hdr-text { flex:1;min-width:0; }
.hdr-title { font-size:15px;font-weight:700;color:var(--primary-text-color,#f1f5f9); }
.hdr-date  { font-size:10px;font-weight:500;color:var(--secondary-text-color,#64748b);margin-top:2px; }
.hdr-right { display:flex;align-items:center;gap:6px;flex-shrink:0; }
.icon-btn { width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--secondary-text-color,#64748b);transition:background .15s; }
.icon-btn:hover { background:rgba(255,255,255,.1); }
.icon-btn.on { background:rgba(255,255,255,.12);color:var(--primary-text-color,#f1f5f9); }
button[data-action="toggleSettings"] { display: var(--fgear, none); }

/* Hero */
.hero {
  position:relative;
  padding:22px 16px 16px;
  display:flex;flex-direction:column;align-items:center;gap:8px;
  border-bottom:1px solid rgba(255,255,255,.06);
  overflow:hidden;
}
.hero-glow {
  position:absolute;width:200px;height:200px;border-radius:50%;
  filter:blur(60px);opacity:.15;pointer-events:none;
  top:0;left:50%;transform:translateX(-50%);
}
.hero-today-tag {
  font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;
  padding:3px 10px;border-radius:20px;border:1px solid currentColor;
  position:relative;z-index:1;
}
.hero-bin { position:relative;z-index:1;display:flex;align-items:center;justify-content:center; }
.hero-label { font-size:24px;font-weight:900;letter-spacing:-.5px;text-align:center;line-height:1.2;position:relative;z-index:1; }
.hero-sub { font-size:11px;color:var(--secondary-text-color,#64748b);font-weight:500;position:relative;z-index:1; }

/* Tomorrow strip */
.tomorrow {
  display:flex;align-items:center;gap:8px;
  padding:8px 16px;
  border-bottom:1px solid rgba(255,255,255,.05);
  background:rgba(255,255,255,.025);
}
.tmr-tag {
  display:flex;align-items:center;gap:4px;
  font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
  color:var(--secondary-text-color,#64748b);min-width:58px;
}
.tmr-bin { display:flex;align-items:center;flex-shrink:0; }
.tmr-waste { font-size:13px;font-weight:600;color:var(--primary-text-color,#f1f5f9); }
.tmr-none  { font-size:13px;font-weight:500;color:var(--secondary-text-color,#64748b); }

/* Week grid */
.week {
  display:grid;grid-template-columns:repeat(7,1fr);
  gap:5px;padding:10px 10px 8px;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.day-chip {
  display:flex;flex-direction:column;align-items:center;gap:3px;
  padding:7px 2px 6px;border-radius:10px;
  border:1px solid rgba(255,255,255,.05);
  background:rgba(255,255,255,.02);
}
.day-chip.today { border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.07); }
.day-chip-lbl { font-size:9px;font-weight:700;color:var(--secondary-text-color,#64748b); }
.day-chip.today .day-chip-lbl { color:var(--primary-text-color,#f1f5f9); }
.day-chip-bin { display:flex;align-items:center;justify-content:center; }
.day-chip-short { font-size:8px;font-weight:800; }

/* Edit panel */
.edit-panel { display:none;padding:10px 14px 12px;border-top:1px solid rgba(255,255,255,.06); }
.edit-panel.open { display:block; }
.panel-title { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);margin-bottom:8px; }
.edit-row { display:flex;align-items:center;gap:5px;margin-bottom:5px; }
.edit-row:last-of-type { margin-bottom:0; }
.edit-day-lbl { font-size:10px;font-weight:700;color:var(--secondary-text-color,#64748b);min-width:18px;text-align:center;flex-shrink:0; }
.edit-input {
  flex:1;height:27px;padding:0 8px;
  border-radius:7px;border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.05);color:var(--primary-text-color,#f1f5f9);
  font-size:11px;font-weight:500;font-family:inherit;
}
.edit-input:focus { outline:none;border-color:rgba(34,197,94,.45); }
.presets { display:flex;gap:2px;flex-shrink:0; }
.preset-btn {
  width:19px;height:19px;border-radius:4px;border:none;
  font-size:8px;font-weight:800;cursor:pointer;color:rgba(255,255,255,.9);
  display:flex;align-items:center;justify-content:center;
  transition:opacity .12s,transform .1s;flex-shrink:0;
}
.preset-btn:hover { opacity:.85;transform:scale(1.12); }

/* Settings panel */
.set-panel { display:none;border-top:1px solid rgba(255,255,255,.06); }
.set-panel.open { display:block; }
.set-row { display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.04); }
.set-row:last-child { border-bottom:none; }
.set-lbl { font-size:12px;font-weight:600;color:var(--primary-text-color,#f1f5f9); }
.set-sub { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:1px; }
.set-icon { display:flex;align-items:center;gap:7px; }
.toggle { width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0; }
.toggle.on  { background:#22c55e; }
.toggle.off { background:rgba(255,255,255,.15); }
.toggle::after { content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s; }
.toggle.on::after  { left:21px; }
.toggle.off::after { left:3px; }
.time-input {
  height:30px;padding:0 10px;border-radius:8px;
  border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);
  color:var(--primary-text-color,#f1f5f9);font-size:13px;font-weight:600;font-family:inherit;
}
.time-input:focus { outline:none;border-color:rgba(34,197,94,.5); }
`

// ─── Card Class ───────────────────────────────────────────────────────────────
class DifferenziataCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode:'open' })
    this._hass         = null
    this._config       = {}
    this._settingsOpen = false
    this._editOpen     = false
    this._buildKey     = null
    this._onClick      = this._handleClick.bind(this)
    this._onChange     = this._handleChange.bind(this)
  }

  static getStubConfig() { return {} }
  setConfig(config) { this._config = config || {} }
  getCardSize() { return 5 }

  configure() { this._settingsOpen = true; this._buildKey = null; this._buildDOM(); }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', this._onClick)
    this.shadowRoot.addEventListener('change', this._onChange)
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._onClick)
    this.shadowRoot.removeEventListener('change', this._onChange)
  }

  set hass(hass) {
    this._hass = hass
    const bk = this._buildKey_()
    if (bk !== this._buildKey) {
      this._buildKey = bk
      this._buildDOM()
    }
  }

  _g(id, fb = null)          { return this._hass?.states?.[id]?.state ?? fb }
  _svc(domain, svc, data={}) { return this._hass?.callService(domain, svc, data) }

  _buildKey_() {
    if (!this._hass) return null
    const texts = DD_DAYS.map(d => this._g(`input_text.rifiuto_${d}`,'')).join('|')
    return [
      texts,
      this._g('input_datetime.orario_notifica_differenziata',''),
      this._g('input_boolean.notify_push_raccolta_differenziata',''),
      this._g('input_boolean.notify_alexa_raccolta_differenziata',''),
      this._settingsOpen?'1':'0',
      this._editOpen?'1':'0',
    ].join('||')
  }

  _handleClick(e) {
    const btn = e.target.closest('[data-action]')
    if (!btn || !this._hass) return
    switch(btn.dataset.action) {
      case 'toggleSettings':
        this._settingsOpen = !this._settingsOpen
        this._buildKey = null; this._buildDOM(); break
      case 'toggleEdit':
        this._editOpen = !this._editOpen
        this._buildKey = null; this._buildDOM(); break
      case 'togglePush':
        this._svc('input_boolean','toggle',{entity_id:'input_boolean.notify_push_raccolta_differenziata'}); break
      case 'toggleAlexa':
        this._svc('input_boolean','toggle',{entity_id:'input_boolean.notify_alexa_raccolta_differenziata'}); break
      case 'preset':
        this._svc('input_text','set_value',{
          entity_id: `input_text.rifiuto_${btn.dataset.day}`,
          value: btn.dataset.val,
        }); break
    }
  }

  _handleChange(e) {
    if (!this._hass) return
    const el = e.target
    if (el.dataset.action === 'setWaste') {
      this._svc('input_text','set_value',{
        entity_id: `input_text.rifiuto_${el.dataset.day}`,
        value: el.value,
      })
    }
    if (el.dataset.action === 'setTime') {
      if (!el.value) return
      this._svc('input_datetime','set_datetime',{
        entity_id: 'input_datetime.orario_notifica_differenziata',
        time: `${el.value}:00`,
      })
    }
  }

  _buildDOM() {
    if (!this._hass) return

    const now      = new Date()
    const todayIdx = (now.getDay() + 6) % 7  // 0 = lunedì
    const tmrIdx   = (todayIdx + 1) % 7
    const dateStr  = `${DD_FULL[todayIdx]}, ${now.getDate()} ${DD_MONTH[now.getMonth()]} ${now.getFullYear()}`

    const wastes  = DD_DAYS.map(d => this._g(`input_text.rifiuto_${d}`,''))
    const todayW  = wasteInfo(wastes[todayIdx])
    const tmrW    = wasteInfo(wastes[tmrIdx])

    const pushOn  = this._g('input_boolean.notify_push_raccolta_differenziata') === 'on'
    const alexaOn = this._g('input_boolean.notify_alexa_raccolta_differenziata') === 'on'
    const notifT  = (this._g('input_datetime.orario_notifica_differenziata','00:00:00') || '00:00:00').slice(0,5)

    // Card border glow by today's waste
    const cardStyle = todayW.hasPickup && todayW.glow !== 'none'
      ? `style="border-color:${todayW.color}44;box-shadow:0 8px 32px ${todayW.color}18"`
      : ''

    // Hero section
    const heroGlow = todayW.hasPickup && todayW.glow !== 'none'
      ? `<div class="hero-glow" style="background:${todayW.color}"></div>` : ''
    const heroBin = todayW.hasPickup ? binSvg(todayW.color, 84) : emptyBinSvg(84)

    // Tomorrow
    const tmrBin = tmrW.hasPickup ? binSvg(tmrW.color, 22) : emptyBinSvg(22)

    // Week chips
    const weekChips = DD_DAYS.map((d, i) => {
      const info = wasteInfo(wastes[i])
      const isToday = i === todayIdx
      const mb = info.hasPickup ? binSvg(info.color, 28) : emptyBinSvg(28)
      return `<div class="day-chip ${isToday?'today':''}">
        <span class="day-chip-lbl">${DD_LBL[i]}</span>
        <div class="day-chip-bin">${mb}</div>
        <span class="day-chip-short" style="${info.hasPickup?'color:'+info.color:'color:var(--secondary-text-color,#4b5563)'}">${info.hasPickup?info.short:'—'}</span>
      </div>`
    }).join('')

    // Edit panel
    const editHTML = this._editOpen ? `
      <div class="edit-panel open">
        <div class="panel-title">Configura raccolta settimanale</div>
        ${DD_DAYS.map((d,i) => {
          const presets = PRESETS.map(p =>
            `<button class="preset-btn" style="background:${p.bg}" data-action="preset" data-day="${d}" data-val="${p.val}" title="${p.val}">${p.short}</button>`
          ).join('')
          return `<div class="edit-row">
            <span class="edit-day-lbl">${DD_LBL[i]}</span>
            <input class="edit-input" type="text" value="${wastes[i]||''}" placeholder="es. Organico"
              data-action="setWaste" data-day="${d}">
            <div class="presets">${presets}</div>
          </div>`
        }).join('')}
      </div>` : `<div class="edit-panel"></div>`

    // Settings panel
    const settingsHTML = this._settingsOpen ? `
      <div class="set-panel open">
        <div class="set-row">
          <div class="set-icon">
            ${IC.bell}
            <div><div class="set-lbl">Orario notifica</div><div class="set-sub">Promemoria giornaliero</div></div>
          </div>
          <input class="time-input" type="time" value="${notifT}" data-action="setTime">
        </div>
        <div class="set-row">
          <div class="set-icon">
            ${IC.phone}
            <div><div class="set-lbl">Notifica Push</div><div class="set-sub">Invia notifica su app</div></div>
          </div>
          <button class="toggle ${pushOn?'on':'off'}" data-action="togglePush"></button>
        </div>
        <div class="set-row">
          <div class="set-icon">
            ${IC.alexa}
            <div><div class="set-lbl">Notifica Alexa</div><div class="set-sub">Annuncio tramite Amazon Echo</div></div>
          </div>
          <button class="toggle ${alexaOn?'on':'off'}" data-action="toggleAlexa"></button>
        </div>
      </div>` : `<div class="set-panel"></div>`

    this.shadowRoot.innerHTML = `<style>${CSS}</style>
<div class="card" ${cardStyle}>

  <div class="hdr">
    <div class="hdr-icon">${IC.trash}</div>
    <div class="hdr-text">
      <div class="hdr-title">Raccolta Differenziata</div>
      <div class="hdr-date">${dateStr}</div>
    </div>
    <div class="hdr-right">
      <button class="icon-btn ${this._editOpen?'on':''}" data-action="toggleEdit" title="Modifica">${IC.pencil}</button>
      <button class="icon-btn ${this._settingsOpen?'on':''}" data-action="toggleSettings" title="Impostazioni">${IC.gear}</button>
    </div>
  </div>

  <!-- Hero: oggi -->
  <div class="hero">
    ${heroGlow}
    <div class="hero-today-tag" style="color:${todayW.hasPickup?todayW.color:'var(--secondary-text-color)'}">OGGI</div>
    <div class="hero-bin">${heroBin}</div>
    <div class="hero-label" style="${todayW.hasPickup?'color:'+todayW.color:''}">${todayW.label}</div>
    <div class="hero-sub">${todayW.hasPickup ? 'Esponi il bidone oggi' : 'Nessun ritiro oggi'}</div>
  </div>

  <!-- Domani -->
  <div class="tomorrow">
    <span class="tmr-tag">${IC.arrow} Domani</span>
    <div class="tmr-bin">${tmrBin}</div>
    ${tmrW.hasPickup
      ? `<span class="tmr-waste" style="color:${tmrW.color}">${tmrW.label}</span>`
      : `<span class="tmr-none">Nessun ritiro</span>`}
  </div>

  <!-- Settimana -->
  <div class="week">${weekChips}</div>

  ${editHTML}
  ${settingsHTML}

</div>`
  }
}

customElements.define('differenziata-card', DifferenziataCard)

window.customCards = window.customCards || []
window.customCards.push({ version: '1.0',
  type:        'differenziata-card',
  name:        'Raccolta Differenziata',
  description: 'Bidoni, programmazione settimanale, notifiche push e Alexa.',
})
