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
.day-chip.today { border-color:#fff;background:rgba(255,255,255,.07); }
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
  font-size:8px;font-weight:800;cursor:pointer;color:#fff;
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

// ─── FratechStore Integration ────────────────────────────────────────────────
;(function () {
  'use strict';

  var _DIFF_WIZ_KEY = 'frarik_pkg_wizard_differenziata';
  var _IND = '          ';

  var _DIFF_PKG_YAML = 'homeassistant:\n'
    + '  customize:\n'
    + '    package.node_anchors:\n'
    + '      customize: &customize\n'
    + '        package: \'Centro Controllo Raccolta Differenziata 1.0\'\n'
    + '      setting:\n'
    + '        Lista MediaPlayer Google: &google\n'
    + _IND + 'IL_TUO_MEDIA_PLAYER_GOOGLE_1\n'
    + '        Lista mediaplayer alexa: &alexa\n'
    + _IND + 'IL_TUO_MEDIA_PLAYER_ALEXA_1\n'
    + '        Device per notifica push: &push\n'
    + _IND + '- service: IL_TUO_MOBILE_APP_1\n'
    + 'notify:\n'
    + '  - name: Gruppo Centro Raccolta Differenziata\n'
    + '    platform: group\n'
    + '    services: *push\n'
    + 'input_select:\n'
    + '  inserimento_rifiuti:\n'
    + '    name: Inserimento Rifiuti\n'
    + '    options:\n'
    + '      - Rifiuti\n'
    + 'input_text:\n'
    + '  rifiuto_lunedi: {name: "Rifiuto Lunedì", icon: mdi:delete-variant}\n'
    + '  rifiuto_martedi: {name: "Rifiuto Martedì", icon: mdi:delete-variant}\n'
    + '  rifiuto_mercoledi: {name: "Rifiuto Mercoledì", icon: mdi:delete-variant}\n'
    + '  rifiuto_giovedi: {name: "Rifiuto Giovedì", icon: mdi:delete-variant}\n'
    + '  rifiuto_venerdi: {name: "Rifiuto Venerdì", icon: mdi:delete-variant}\n'
    + '  rifiuto_sabato: {name: "Rifiuto Sabato", icon: mdi:delete-variant}\n'
    + '  rifiuto_domenica: {name: "Rifiuto Domenica", icon: mdi:delete-variant}\n'
    + 'input_datetime:\n'
    + '  orario_notifica_differenziata:\n'
    + '    name: Orario Notifica Raccolta Differenziata\n'
    + '    has_date: false\n'
    + '    has_time: true\n'
    + 'input_boolean:\n'
    + '  notify_push_raccolta_differenziata: {name: "Notifica Push", icon: mdi:bell}\n'
    + '  notify_google_raccolta_differenziata: {name: "Notifica Google", icon: mdi:google-home}\n'
    + '  notify_alexa_raccolta_differenziata: {name: "Notifica Alexa", icon: mdi:amazon-alexa}\n'
    + '  aggiornamento_pkg_raccolta_differenziata: {name: "Aggiornamento PKG Differenziata"}\n'
    + 'template:\n'
    + '  - sensor:\n'
    + '      - name: Raccolta Differenziata\n'
    + '        state: >-\n'
    + '          {% if now().weekday() == 0 %}{{ states(\'input_text.rifiuto_lunedi\') }}\n'
    + '          {% elif now().weekday() == 1 %}{{ states(\'input_text.rifiuto_martedi\') }}\n'
    + '          {% elif now().weekday() == 2 %}{{ states(\'input_text.rifiuto_mercoledi\') }}\n'
    + '          {% elif now().weekday() == 3 %}{{ states(\'input_text.rifiuto_giovedi\') }}\n'
    + '          {% elif now().weekday() == 4 %}{{ states(\'input_text.rifiuto_venerdi\') }}\n'
    + '          {% elif now().weekday() == 5 %}{{ states(\'input_text.rifiuto_sabato\') }}\n'
    + '          {% elif now().weekday() == 6 %}{{ states(\'input_text.rifiuto_domenica\') }}\n'
    + '          {% endif %}\n'
    + 'automation:\n'
    + '  - id: raccolta_differenziata_notifica\n'
    + '    alias: "Raccolta Differenziata - Notifica"\n'
    + '    trigger:\n'
    + '      - platform: time\n'
    + '        at: input_datetime.orario_notifica_differenziata\n'
    + '    action:\n'
    + '      - choose:\n'
    + '        - conditions:\n'
    + '          - condition: state\n'
    + '            entity_id: input_boolean.notify_google_raccolta_differenziata\n'
    + '            state: \'on\'\n'
    + '          - condition: not\n'
    + '            conditions:\n'
    + '              - condition: state\n'
    + '                entity_id: sensor.raccolta_differenziata\n'
    + '                state: "Nessun Ritiro"\n'
    + '          sequence:\n'
    + '          - service: tts.google_translate_say\n'
    + '            entity_id: *google\n'
    + '            data:\n'
    + '              message: "Ricordati di buttare {{ states(\'sensor.raccolta_differenziata\') }}"\n'
    + '      - choose:\n'
    + '        - conditions:\n'
    + '          - condition: state\n'
    + '            entity_id: input_boolean.notify_push_raccolta_differenziata\n'
    + '            state: \'on\'\n'
    + '          sequence:\n'
    + '          - data_template:\n'
    + '              message: "{{ states(\'sensor.raccolta_differenziata\') }}"\n'
    + '              title: "Raccolta Differenziata ♻"\n'
    + '            service: notify.gruppo_centro_raccolta_differenziata\n'
    + '      - choose:\n'
    + '        - conditions:\n'
    + '          - condition: state\n'
    + '            entity_id: input_boolean.notify_alexa_raccolta_differenziata\n'
    + '            state: \'on\'\n'
    + '          sequence:\n'
    + '          - service: notify.alexa_media\n'
    + '            data:\n'
    + '              target: *alexa\n'
    + '              data: {type: announce, method: spoken}\n'
    + '              message: "Oggi ricordati di buttare {{ states(\'sensor.raccolta_differenziata\') }}"\n';

  function _buildPkgDIFF(push, google, alexa) {
    var pushLines = (push && push.length)
      ? push.map(function(p) { return _IND + '- service: ' + p; }).join('\n')
      : _IND + '- service: mobile_app_smartphone';
    var googleLines = (google && google.length)
      ? google.map(function(p) { return _IND + '- ' + p; }).join('\n')
      : _IND + '- media_player.google_home';
    var alexaLines = (alexa && alexa.length)
      ? alexa.map(function(p) { return _IND + '- ' + p; }).join('\n')
      : _IND + '- media_player.alexa_casa';
    return _DIFF_PKG_YAML
      .replace(_IND + '- service: IL_TUO_MOBILE_APP_1', pushLines)
      .replace(_IND + 'IL_TUO_MEDIA_PLAYER_GOOGLE_1', googleLines)
      .replace(_IND + 'IL_TUO_MEDIA_PLAYER_ALEXA_1', alexaLines);
  }

  function _openWizardDIFF(hass, onDone) {
    var states = (hass && hass.states) || {};
    var mediaIds = Object.keys(states).filter(function(id) { return /^media_player\./.test(id); }).sort();
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(_DIFF_WIZ_KEY) || 'null'); } catch(e) {}
    var pushRows   = (saved && saved.push   && saved.push.length)   ? saved.push.slice()   : [''];
    var googleRows = (saved && saved.google && saved.google.length) ? saved.google.slice() : [''];
    var alexaRows  = (saved && saved.alexa  && saved.alexa.length)  ? saved.alexa.slice()  : [''];

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
        + '<div class="wd-hdr"><div class="wd-ico">♻️</div>'
        + '<div><div class="wd-tit">Installa PKG Raccolta Differenziata</div><div class="wd-sub">frarik_differenziata.yaml → config/packages/</div></div>'
        + '<button class="wd-x" id="wd-x">✕</button></div>'
        + '<div class="wd-body">'
        + '<div><div class="wd-sec">Notifiche Push</div>'
        + '<p class="wd-note">mobile_app dei dispositivi per notifiche push (es. <code>mobile_app_iphone</code>).</p>'
        + '<div id="push-rows">' + multiRows(pushRows, 'push-inp', 'mobile_app_...') + '</div>'
        + '<button class="wd-add" id="push-add">+ Aggiungi dispositivo</button>'
        + '</div>'
        + '<div><div class="wd-sec">Notifiche Google / Chromecast</div>'
        + '<p class="wd-note">media_player Google Home (es. <code>media_player.google_cucina</code>). Lascia vuoto per non usare.</p>'
        + '<div id="google-rows">' + multiRows(googleRows, 'google-inp', 'media_player.google_...') + '</div>'
        + '<button class="wd-add" id="google-add">+ Aggiungi Google</button>'
        + '</div>'
        + '<div><div class="wd-sec">Notifiche Alexa</div>'
        + '<p class="wd-note">media_player Alexa (es. <code>media_player.echo_cucina</code>). Lascia vuoto per non usare.</p>'
        + '<div id="alexa-rows">' + multiRows(alexaRows, 'alexa-inp', 'media_player.echo_...') + '</div>'
        + '<button class="wd-add" id="alexa-add">+ Aggiungi Echo</button>'
        + '</div>'
        + '</div>'
        + '<div class="wd-foot">'
        + '<button class="wd-cancel" id="wd-cancel">Annulla</button>'
        + '<button class="wd-install" id="wd-install">📦 Installa PKG</button>'
        + '</div></div></div>';

      sr.getElementById('wd-x').addEventListener('click', destroy);
      sr.getElementById('wd-cancel').addEventListener('click', destroy);
      sr.getElementById('wd-bd').addEventListener('click', function(e) { if (e.target === sr.getElementById('wd-bd')) destroy(); });

      function bindMulti(containerId, rows, cls, addId) {
        sr.getElementById(containerId).addEventListener('click', function(e) {
          var btn = e.target.closest('[data-rm]'); if (!btn) return;
          rows.length = 0;
          Array.from(sr.querySelectorAll('.' + cls)).forEach(function(i) { rows.push(i.value); });
          rows.splice(+btn.dataset.rm, 1);
          if (!rows.length) rows.push('');
          renderWiz();
        });
        sr.getElementById(addId).addEventListener('click', function() {
          Array.from(sr.querySelectorAll('.' + cls)).forEach(function(i, idx) { rows[idx] = i.value; });
          rows.push('');
          renderWiz();
        });
      }
      bindMulti('push-rows',   pushRows,   'push-inp',   'push-add');
      bindMulti('google-rows', googleRows, 'google-inp', 'google-add');
      bindMulti('alexa-rows',  alexaRows,  'alexa-inp',  'alexa-add');

      sr.querySelectorAll('.google-inp').forEach(function(inp) { setupAC(inp, inp.parentElement.querySelector('.wd-drop'), mediaIds); });
      sr.querySelectorAll('.alexa-inp').forEach(function(inp)  { setupAC(inp, inp.parentElement.querySelector('.wd-drop'), mediaIds); });

      sr.getElementById('wd-install').addEventListener('click', function() {
        var push   = Array.from(sr.querySelectorAll('.push-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        var google = Array.from(sr.querySelectorAll('.google-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        var alexa  = Array.from(sr.querySelectorAll('.alexa-inp')).map(function(i) { return i.value.trim(); }).filter(Boolean);
        try { localStorage.setItem(_DIFF_WIZ_KEY, JSON.stringify({push: push, google: google, alexa: alexa})); } catch(e) {}
        var yaml = _buildPkgDIFF(push, google, alexa);
        var m = location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)/);
        var base = location.origin + (m ? m[1] : '');
        var btn = sr.getElementById('wd-install');
        btn.classList.add('wd-loading'); btn.textContent = 'Installazione…';
        fetch(base + '/api/frarik/pkg/install', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: 'frarik/frarik_differenziata.yaml', content: yaml})
        }).then(function(r) { return r.json().then(function(j) { return {r: r, j: j}; }); })
          .then(function(res) {
            destroy();
            if (res.r.ok && res.j.ok) {
              try { if (typeof window.showToast === 'function') window.showToast('📦 PKG Raccolta Differenziata installato! Riavvia HA.'); } catch(e) {}
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
  function _dH() { try { return (typeof window.frarikHass === 'function' && window.frarikHass()) || {}; } catch(e) { return {}; } }
  function _dKey(c) { return 'frarik_diffcard_' + (c.id || 'x'); }
  function _dLoad(c) { try { return JSON.parse(localStorage.getItem(_dKey(c)) || '{}') || {}; } catch(e) { return {}; } }
  function _dSave(c, o) { try { localStorage.setItem(_dKey(c), JSON.stringify(o)); } catch(e) {} }
  function _dS(h, id) { return (h && h.states && h.states[id] && h.states[id].state) || null; }
  function _dIsOn(h, id) { return !!(h && h.states && h.states[id] && h.states[id].state === 'on'); }

  function _dPkgDef() {
    return {
      pk_lunedi:    'input_text.rifiuto_lunedi',
      pk_martedi:   'input_text.rifiuto_martedi',
      pk_mercoledi: 'input_text.rifiuto_mercoledi',
      pk_giovedi:   'input_text.rifiuto_giovedi',
      pk_venerdi:   'input_text.rifiuto_venerdi',
      pk_sabato:    'input_text.rifiuto_sabato',
      pk_domenica:  'input_text.rifiuto_domenica',
      pk_orario:    'input_datetime.orario_notifica_differenziata',
      pk_npush:     'input_boolean.notify_push_raccolta_differenziata',
      pk_ngoogle:   'input_boolean.notify_google_raccolta_differenziata',
      pk_nalexa:    'input_boolean.notify_alexa_raccolta_differenziata',
    };
  }

  function _dCfgFor(card) {
    var st = _dLoad(card), pk = _dPkgDef(), r = {};
    Object.keys(pk).forEach(function(k) { r[k] = (st[k] !== undefined && st[k] !== '') ? st[k] : pk[k]; });
    r.name = st.name || 'Raccolta Differenziata';
    r.custom_colors = (st.custom_colors && typeof st.custom_colors === 'object') ? st.custom_colors : {};
    return r;
  }

  var _dWASTE = {
    organico:        {col:'#b45309', rgb:'180,83,9',   abbr:'ORG', label:'Organico',        icon:'🍃'},
    umido:           {col:'#b45309', rgb:'180,83,9',   abbr:'UMI', label:'Umido',           icon:'🍃'},
    carta:           {col:'#2563eb', rgb:'37,99,235',  abbr:'CAR', label:'Carta/Cartone',   icon:'📄'},
    cartone:         {col:'#2563eb', rgb:'37,99,235',  abbr:'CAR', label:'Carta/Cartone',   icon:'📄'},
    plastica:        {col:'#ca8a04', rgb:'202,138,4',  abbr:'PLA', label:'Plastica',        icon:'♻️'},
    lattine:         {col:'#ca8a04', rgb:'202,138,4',  abbr:'LAT', label:'Lattine',         icon:'🥫'},
    multimateriale:  {col:'#ca8a04', rgb:'202,138,4',  abbr:'MLT', label:'Multimateriale',  icon:'♻️'},
    vetro:           {col:'#15803d', rgb:'21,128,61',  abbr:'VET', label:'Vetro',           icon:'🍾'},
    indifferenziato: {col:'#4b5563', rgb:'75,85,99',   abbr:'IND', label:'Indifferenziato', icon:'🗑️'},
    secco:           {col:'#4b5563', rgb:'75,85,99',   abbr:'SEC', label:'Secco',           icon:'🗑️'},
    ingombranti:     {col:'#7c3aed', rgb:'124,58,237', abbr:'ING', label:'Ingombranti',     icon:'📦'},
    nessuno:         {col:'#1e293b', rgb:'30,41,59',   abbr:'—',   label:'Nessun ritiro',   icon:''},
  };

  function _dWasteInfo(raw, cc) {
    if (!raw || !raw.trim()) return _dWASTE.nessuno;
    var key = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
    var base = _dWASTE[key] || {col:'#475569', rgb:'71,85,105', abbr:raw.slice(0,3).toUpperCase(), label:raw, icon:'♻️'};
    if (cc && cc[key]) {
      var hex = cc[key];
      var r2 = parseInt(hex.slice(1,3),16)||0, g2 = parseInt(hex.slice(3,5),16)||0, b2 = parseInt(hex.slice(5,7),16)||0;
      return {col:hex, rgb:r2+','+g2+','+b2, abbr:base.abbr, label:base.label, icon:base.icon};
    }
    return base;
  }

  function _dBinSVG(col, colRgb, abbr, size) {
    size = size || 64;
    var scale = size / 64;
    var glow = 'drop-shadow(0 0 10px rgba(' + colRgb + ',.35))';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 108" style="display:block;width:' + size + 'px;height:auto;filter:' + glow + '">'
      + '<defs><linearGradient id="dBg' + abbr + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + col + '" stop-opacity=".9"/><stop offset="100%" stop-color="' + col + '" stop-opacity=".4"/></linearGradient></defs>'
      + '<rect x="5" y="8" width="54" height="12" rx="4" fill="url(#dBg' + abbr + ')"/>'
      + '<rect x="22" y="3" width="20" height="8" rx="3" fill="' + col + '" opacity=".85"/>'
      + '<rect x="28" y="1" width="8" height="6" rx="2" fill="#060e1c" stroke="' + col + '" stroke-width=".6"/>'
      + '<path d="M 8 20 L 12 92 H 52 L 56 20 Z" fill="#0b1929" stroke="' + col + '" stroke-width="1"/>'
      + '<path d="M 12 22 L 15 86" stroke="rgba(255,255,255,.05)" stroke-width="8" stroke-linecap="round" fill="none"/>'
      + '<rect x="18" y="32" width="28" height="44" rx="6" fill="rgba(' + colRgb + ',.12)" stroke="rgba(' + colRgb + ',.3)" stroke-width=".7"/>'
      + '<circle cx="16" cy="96" r="7" fill="#060e1c" stroke="#1e3a5f" stroke-width=".7"/>'
      + '<circle cx="16" cy="96" r="3" fill="#0c1929" stroke="#1e3a5f" stroke-width=".4"/>'
      + '<circle cx="48" cy="96" r="7" fill="#060e1c" stroke="#1e3a5f" stroke-width=".7"/>'
      + '<circle cx="48" cy="96" r="3" fill="#0c1929" stroke="#1e3a5f" stroke-width=".4"/>'
      + '<rect x="13" y="88" width="38" height="5" rx="2.5" fill="#090f1e" stroke="#1e3a5f" stroke-width=".4"/>'
      + '</svg>';
  }

  function _dRender(card) {
    var h = _dH(), c = _dCfgFor(card);
    var rid = 'frdiff' + (card.id || 'diff');
    var days = ['pk_lunedi','pk_martedi','pk_mercoledi','pk_giovedi','pk_venerdi','pk_sabato','pk_domenica'];
    var dayNames = ['LU','MA','ME','GI','VE','SA','DO'];
    var todayIdx = (new Date().getDay() + 6) % 7;
    var tmrIdx = (todayIdx + 1) % 7;
    var todayRaw = _dS(h, c[days[todayIdx]]) || '';
    var tmrRaw = _dS(h, c[days[tmrIdx]]) || '';
    var cc = c.custom_colors || {};
    var todayW = _dWasteInfo(todayRaw, cc), tmrW = _dWasteInfo(tmrRaw, cc);
    var hasPickup = todayW !== _dWASTE.nessuno && todayRaw.trim();
    var orario = _dS(h, c.pk_orario) || '--:--';
    var orarioStr = orario.length >= 5 ? orario.slice(0,5) : orario;
    var col = hasPickup ? todayW.col : '#1e293b';
    var colRgb = hasPickup ? todayW.rgb : '30,41,59';
    var statusLabel = hasPickup ? 'RITIRO OGGI' : 'NESSUN RITIRO';

    var weekChips = dayNames.map(function(dn, i) {
      var raw = _dS(h, c[days[i]]) || '';
      var w = _dWasteInfo(raw, cc);
      var isToday = i === todayIdx;
      var hasPk = !!raw.trim() && w !== _dWASTE.nessuno;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">'
        + '<div style="font-size:8px;font-weight:800;color:' + (isToday ? '#fff' : 'rgba(255,255,255,.4)') + ';text-transform:uppercase">' + dn + '</div>'
        + '<div style="width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;'
        + 'background:rgba(' + (hasPk ? w.rgb : '100,116,139') + ',.15);'
        + 'border:1px solid rgba(' + (hasPk ? w.rgb : '100,116,139') + ',' + (isToday ? '.6' : '.25') + ');'
        + 'color:' + (hasPk ? w.col : '#4b5563') + ';'
        + (isToday ? 'box-shadow:0 0 8px rgba(' + (hasPk ? w.rgb : '100,116,139') + ',.3);' : '')
        + '">' + (hasPk ? w.abbr : '—') + '</div>'
        + '</div>';
    }).join('');

    var css = '<style>'
      + '#' + rid + '{position:relative;width:100%;height:100%;min-height:280px;font-family:system-ui,sans-serif;display:block}'
      + '#' + rid + ' .fc-card{display:flex;flex-direction:column;height:100%;background:linear-gradient(155deg,#060d14 0%,#08101a 55%,#060d14 100%);border-radius:18px;overflow:hidden;position:relative}'
      + '#' + rid + ' .fc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:200px;background:radial-gradient(ellipse at 20% 0%,rgba(' + colRgb + ',.08) 0%,transparent 65%);pointer-events:none}'
      + '#' + rid + ' .fc-hdr{display:flex;align-items:center;gap:9px;padding:11px 14px 9px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;position:relative;z-index:1}'
      + '#' + rid + ' .fc-hdr-iw{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.2)}'
      + '#' + rid + ' .fc-hdr-tit{flex:1;font-size:13px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#' + rid + ' .fc-hdr-pill{font-size:9px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;display:flex;align-items:center;gap:4px;background:rgba(' + colRgb + ',.1);border:1px solid rgba(' + colRgb + ',.28);color:' + col + '}'
      + '#' + rid + ' .fc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:' + col + (hasPickup?';animation:dPulse 2s ease-in-out infinite':'') + '}'
      + '#' + rid + ' .fc-scroll{flex:1;overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;position:relative;z-index:1}'
      + '#' + rid + ' .fc-scroll::-webkit-scrollbar{display:none}'
      + '#' + rid + ' .fc-hero{display:flex;align-items:center;padding:14px 14px 10px;gap:14px;flex:1}'
      + '#' + rid + ' .fc-hero-bin{flex-shrink:0;display:flex;align-items:center;justify-content:center}'
      + '#' + rid + ' .fc-hero-r{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}'
      + '#' + rid + ' .fc-waste-main{font-size:28px;font-weight:900;line-height:1.1;word-break:break-word;color:#fff}'
      + '#' + rid + ' .fc-waste-sub{font-size:13px;color:#fff;margin-top:2px;font-weight:600}'
      + '#' + rid + ' .fc-tmr-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06)}'
      + '#' + rid + ' .fc-tmr-lbl{font-size:12px;font-weight:700;color:#fff;white-space:nowrap}'
      + '#' + rid + ' .fc-week{display:flex;padding:0 10px 12px;gap:3px;border-top:1px solid rgba(255,255,255,.06);padding-top:10px}'
      + '#' + rid + ' .fc-btns{display:flex;gap:6px;padding:0 14px 12px}'
      + '#' + rid + ' .fc-btn{flex:1;padding:8px 4px;border-radius:9px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#fff;text-align:center;cursor:pointer;transition:all .15s}'
      + '#' + rid + ' .fc-btn:hover{background:rgba(' + colRgb + ',.12);border-color:rgba(' + colRgb + ',.3);color:' + col + '}'
      + (hasPickup ? '@keyframes dPulse{0%,100%{opacity:.6}50%{opacity:1}}' : '')
      + '</style>';

    var heroHtml = '<div class="fc-hero">'
      + '<div class="fc-hero-bin">' + _dBinSVG(col, colRgb, hasPickup ? todayW.abbr : '—', 64) + '</div>'
      + '<div class="fc-hero-r">'
      + '<div class="fc-waste-main">' + (hasPickup ? todayW.label : 'Nessun ritiro') + '</div>'
      + '<div class="fc-waste-sub">' + (hasPickup ? '🗓 Esponi il bidone oggi' : '✓ Giornata libera') + '</div>'
      + '<div class="fc-tmr-row">'
      + '<span class="fc-tmr-lbl">Domani:</span>'
      + '<span style="font-size:13px;font-weight:700;color:#fff">' + (tmrRaw.trim() ? tmrW.label : 'Nessun ritiro') + '</span>'
      + '</div>'
      + '<div class="fc-tmr-row">'
      + '<span class="fc-tmr-lbl">Notifica:</span>'
      + '<span style="font-size:13px;font-weight:700;color:#fff">' + orarioStr + '</span>'
      + '</div>'
      + '</div></div>';

    var weekHtml = '<div class="fc-week">' + weekChips + '</div>';

    var btnsHtml = '<div class="fc-btns">'
      + '<div class="fc-btn" data-sya="popup-cfg">⚙ Impostazioni</div>'
      + '</div>';

    return css
      + '<div id="' + rid + '"><div class="fc-card">'
      + '<div class="fc-hdr">'
      + '<div class="fc-hdr-iw">♻️</div>'
      + '<div class="fc-hdr-tit">' + (c.name || 'Raccolta Differenziata') + '</div>'
      + '<div class="fc-hdr-pill"><div class="fc-dot"></div>' + statusLabel + '</div>'
      + '</div>'
      + '<div class="fc-scroll">' + heroHtml + weekHtml + btnsHtml + '</div>'
      + '</div></div>';
  }

  function _dMkOv(html, closeId) {
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

  function _dPopShell(icon, rgb, title, sub, closeId, content) {
    return '<style>@keyframes dUP{from{transform:translateY(100%)}to{transform:translateY(0)}}.dpc{overflow-y:auto;scrollbar-width:none}.dpc::-webkit-scrollbar{display:none}</style>'
      + '<div style="width:100%;max-height:78vh;display:flex;flex-direction:column;background:#060d14;border:1px solid rgba(' + rgb + ',.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:dUP .22s cubic-bezier(.32,1.12,.56,1);overflow:hidden">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'
      + '<div style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(' + rgb + ',.15);border:1px solid rgba(' + rgb + ',.3)">' + icon + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#fff">' + title + '</div><div style="font-size:11px;color:#fff;margin-top:1px">' + sub + '</div></div>'
      + '<button id="' + closeId + '" style="margin-left:auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:none">✕</button>'
      + '</div>'
      + '<div class="dpc" style="flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:0">' + content + '</div>'
      + '</div>';
  }

  function _dOpenEdit(card, el) {
    var h = _dH(), c = _dCfgFor(card);
    var days = ['pk_lunedi','pk_martedi','pk_mercoledi','pk_giovedi','pk_venerdi','pk_sabato','pk_domenica'];
    var dayLabels = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
    var suggestions = ['Organico','Carta','Cartone','Plastica','Vetro','Indifferenziato','Multimateriale','Ingombranti'];
    function fld(key, label) {
      var val = (_dS(h, c[key]) || '').replace(/"/g,'&quot;');
      var opts = suggestions.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');
      return '<div style="margin-bottom:8px;display:flex;align-items:center;gap:8px">'
        + '<div style="font-size:10px;font-weight:800;color:#94a3b8;width:80px;flex-shrink:0">' + label + '</div>'
        + '<input id="df-' + key + '" type="text" list="df-datalist" placeholder="es. Organico" value="' + val + '" style="flex:1;padding:7px 9px;border-radius:8px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;box-sizing:border-box;outline:none">'
        + '</div>';
    }
    var content = '<datalist id="df-datalist">' + suggestions.map(function(s){return '<option value="'+s+'">';}).join('') + '</datalist>'
      + days.map(function(k,i) { return fld(k, dayLabels[i]); }).join('')
      + '<button id="d-edit-save" style="width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#22c55e;color:#022c1b;margin-top:8px">💾 Salva programmazione</button>';
    var ov = _dMkOv(_dPopShell('📅','34,197,94','Programmazione settimanale','Modifica i rifiuti per ogni giorno','d-edit-cl',content),'d-edit-cl');
    ov.querySelector('#d-edit-save').addEventListener('click', function() {
      var h2 = _dH();
      days.forEach(function(k) {
        var inp = ov.querySelector('#df-'+k);
        if (!inp) return;
        var val = inp.value.trim();
        var eid = c[k];
        if (eid && h2 && h2.callService) h2.callService('input_text','set_value',{entity_id:eid,value:val});
      });
      ov._close();
      if (el) el._fcSig = null;
    });
  }

  function _dOpenCfg(card, el) {
    var h = _dH(), c = _dCfgFor(card);
    var cc = c.custom_colors || {};
    var days = ['pk_lunedi','pk_martedi','pk_mercoledi','pk_giovedi','pk_venerdi','pk_sabato','pk_domenica'];
    var dayLabels = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
    var suggestions = ['Organico','Carta','Cartone','Plastica','Vetro','Indifferenziato','Multimateriale','Ingombranti','Nessuno'];
    var stdWastes = ['Organico','Umido','Carta','Cartone','Plastica','Vetro','Indifferenziato','Multimateriale','Ingombranti','Lattine','Secco'];
    var nPush   = _dIsOn(h, c.pk_npush);
    var nGoogle = _dIsOn(h, c.pk_ngoogle);
    var nAlexa  = _dIsOn(h, c.pk_nalexa);
    var orario  = _dS(h, c.pk_orario) || '08:00:00';
    function ntog(label, sya, isOn) {
      return '<div data-sya="' + sya + '" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:8px 4px;border-radius:9px;background:rgba(' + (isOn?'34,197,94':'100,116,139') + ',.1);border:1px solid rgba(' + (isOn?'34,197,94':'100,116,139') + ',' + (isOn?'.35':'.15') + ');transition:all .2s">'
        + '<div style="font-size:15px">' + (isOn ? '🔔' : '🔕') + '</div>'
        + '<div style="font-size:10px;font-weight:800;color:' + (isOn ? '#22c55e' : 'rgba(255,255,255,.35)') + '">' + label + '</div>'
        + '<div style="font-size:9px;font-weight:700;color:' + (isOn ? '#fff' : 'rgba(255,255,255,.25)') + '">' + (isOn ? 'ON' : 'OFF') + '</div>'
        + '</div>';
    }
    var dayFlds = days.map(function(k, i) {
      var val = (_dS(h, c[k]) || '').replace(/"/g,'&quot;');
      var w = _dWasteInfo(_dS(h, c[k]) || '', cc);
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
        + '<div style="font-size:10px;font-weight:800;color:#94a3b8;width:82px;flex-shrink:0">' + dayLabels[i] + '</div>'
        + '<div style="width:10px;height:10px;border-radius:50%;background:' + w.col + ';flex-shrink:0"></div>'
        + '<input id="dcf-' + k + '" type="text" list="dcf-datalist" placeholder="es. Organico" value="' + val + '" style="flex:1;padding:7px 9px;border-radius:8px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:12px;box-sizing:border-box;outline:none">'
        + '</div>';
    }).join('');
    var colorFlds = stdWastes.map(function(wl) {
      var key = wl.toLowerCase().replace(/[^a-z]/g, '');
      var defCol = (_dWASTE[key] && _dWASTE[key].col) ? _dWASTE[key].col : '#475569';
      var curCol = cc[key] || defCol;
      return '<div style="display:flex;align-items:center;gap:9px;margin-bottom:7px">'
        + '<div style="width:12px;height:12px;border-radius:50%;background:' + curCol + ';flex-shrink:0;border:1px solid rgba(255,255,255,.12)"></div>'
        + '<div style="font-size:11px;color:#fff;flex:1">' + wl + '</div>'
        + '<input type="color" id="dcc-' + key + '" value="' + curCol + '" style="width:44px;height:30px;border:1px solid rgba(255,255,255,.15);border-radius:7px;background:#0b1422;cursor:pointer;padding:2px 3px">'
        + '</div>';
    }).join('');
    function sec(t) { return '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#22c55e;padding-bottom:4px;border-bottom:1px solid rgba(34,197,94,.18);margin:14px 0 10px">' + t + '</div>'; }
    var content = '<datalist id="dcf-datalist">' + suggestions.map(function(s){return '<option value="'+s+'">';}).join('') + '</datalist>'
      + sec('Programmazione giorni')
      + dayFlds
      + sec('Colori per tipo di rifiuto')
      + colorFlds
      + sec('Notifiche')
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'
      + '<span style="font-size:11px;color:#fff;flex:1">Orario notifica</span>'
      + '<input id="dcf-orario" type="time" value="' + orario.slice(0,5) + '" style="width:110px;padding:6px 9px;border-radius:7px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:13px;outline:none">'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-bottom:14px">'
      + ntog('Push', 'ncfg-push', nPush) + ntog('Google', 'ncfg-google', nGoogle) + ntog('Alexa', 'ncfg-alexa', nAlexa)
      + '</div>'
      + '<button id="d-cfg-save" style="width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#22c55e;color:#022c1b">💾 Salva</button>';
    var ov = _dMkOv(_dPopShell('⚙','34,197,94','Impostazioni',c.name||'Raccolta Differenziata','d-cfg-cl',content),'d-cfg-cl');
    ov.querySelectorAll('[data-sya^="ncfg-"]').forEach(function(tog) {
      tog.addEventListener('click', function() {
        var sya = tog.dataset.sya;
        var eid = sya === 'ncfg-push' ? c.pk_npush : sya === 'ncfg-google' ? c.pk_ngoogle : c.pk_nalexa;
        var wasOn = tog.querySelector('div:last-child').textContent === 'ON';
        _dCallSvc('input_boolean', wasOn ? 'turn_off' : 'turn_on', {entity_id: eid});
        tog.style.background = 'rgba(' + (wasOn?'100,116,139':'34,197,94') + ',.1)';
        tog.style.borderColor = 'rgba(' + (wasOn?'100,116,139':'34,197,94') + ',' + (wasOn?'.15':'.35') + ')';
        tog.querySelector('div:first-child').textContent = wasOn ? '🔕' : '🔔';
        tog.querySelector('div:nth-child(2)').style.color = wasOn ? 'rgba(255,255,255,.35)' : '#22c55e';
        var lv = tog.querySelector('div:last-child'); lv.textContent = wasOn ? 'OFF' : 'ON'; lv.style.color = wasOn ? 'rgba(255,255,255,.25)' : '#fff';
      });
    });
    ov.querySelector('#d-cfg-save').addEventListener('click', function() {
      var h2 = _dH();
      days.forEach(function(k) {
        var inp = ov.querySelector('#dcf-'+k);
        if (!inp) return;
        var eid = c[k];
        if (eid && h2 && h2.callService) h2.callService('input_text','set_value',{entity_id:eid, value:inp.value.trim()});
      });
      var ori = ov.querySelector('#dcf-orario');
      if (ori && ori.value && h2 && h2.callService) h2.callService('input_datetime','set_datetime',{entity_id:c.pk_orario, time:ori.value+':00'});
      // Save custom colors
      var newCc = {};
      stdWastes.forEach(function(wl) {
        var key = wl.toLowerCase().replace(/[^a-z]/g, '');
        var inp = ov.querySelector('#dcc-' + key);
        if (inp) newCc[key] = inp.value;
      });
      var st = _dLoad(card); st.custom_colors = newCc; _dSave(card, st);
      ov._close();
      if (el) el._fcSig = null;
    });
  }

  function _dOpenEntCfg(card, el) {
    var c = _dCfgFor(card);
    function fld(key, label, ph) {
      return '<div style="margin-bottom:10px">'
        + '<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px">' + label + '</div>'
        + '<input id="dent-' + key + '" type="text" autocomplete="off" placeholder="' + ph + '" value="' + (c[key]||'').replace(/"/g,'&quot;') + '" style="width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:11px;font-family:monospace;box-sizing:border-box;outline:none">'
        + '</div>';
    }
    function sec(t) { return '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#22c55e;padding-bottom:4px;border-bottom:1px solid rgba(34,197,94,.18);margin:14px 0 10px">' + t + '</div>'; }
    var days = ['pk_lunedi','pk_martedi','pk_mercoledi','pk_giovedi','pk_venerdi','pk_sabato','pk_domenica'];
    var dayLabels = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
    var content = '<div style="margin-bottom:10px"><div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:3px">Nome card</div>'
      + '<input id="dent-name" type="text" placeholder="Raccolta Differenziata" value="' + (c.name||'').replace(/"/g,'&quot;') + '" style="width:100%;padding:8px 10px;border-radius:9px;background:#0b1422;color:#f1f5f9;border:1px solid rgba(255,255,255,.15);font-size:11px;box-sizing:border-box;outline:none"></div>'
      + sec('Entità giorni (input_text)')
      + days.map(function(k,i){ return fld(k, dayLabels[i], 'input_text.rifiuto_'+['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'][i]); }).join('')
      + sec('Entità notifiche')
      + fld('pk_orario','Orario notifica','input_datetime.orario_notifica_differenziata')
      + fld('pk_npush','Boolean push','input_boolean.notify_push_raccolta_differenziata')
      + fld('pk_ngoogle','Boolean Google','input_boolean.notify_google_raccolta_differenziata')
      + fld('pk_nalexa','Boolean Alexa','input_boolean.notify_alexa_raccolta_differenziata')
      + '<button id="dent-save" style="width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-weight:800;font-size:13px;background:#22c55e;color:#022c1b;margin-top:8px">💾 Salva</button>';
    var ov = _dMkOv(_dPopShell('🔧','34,197,94','Entità',c.name||'Raccolta Differenziata','dent-cl',content),'dent-cl');
    ov.querySelector('#dent-save').addEventListener('click', function() {
      var pk = _dPkgDef(), saved = {};
      Object.keys(pk).forEach(function(k) { var i = ov.querySelector('#dent-'+k); if (i) saved[k] = i.value.trim(); });
      var ni = ov.querySelector('#dent-name'); if (ni) saved.name = ni.value.trim();
      _dSave(card, saved);
      ov._close();
      if (el) el._fcSig = null;
    });
  }

  function _dCallSvc(domain, svc, data) {
    try { var h = _dH(); if (h && h.callService) { h.callService(domain, svc, data); return; } if (window.callSvc) window.callSvc(domain, svc, data); } catch(e) {}
  }

  function _dMount(card, hass, el) {
    if (el._fcBound === '2.1diff') return;
    el._fcBound = '2.1diff';
    if (el._fcHandler) el.removeEventListener('click', el._fcHandler);
    el._fcHandler = function(e) {
      var t = e.target.closest('[data-sya]'); if (!t) return;
      var a = t.dataset.sya;
      if (a === 'popup-cfg') _dOpenCfg(card, el);
    };
    el.addEventListener('click', el._fcHandler);
    clearInterval(el._dPoll);
    el._dPoll = setInterval(function() {
      try {
        if (!el._fcBound) { clearInterval(el._dPoll); return; }
        var h = _dH(), c2 = _dCfgFor(card);
        var days2 = ['pk_lunedi','pk_martedi','pk_mercoledi','pk_giovedi','pk_venerdi','pk_sabato','pk_domenica'];
        var sig = ['2.1diff'].concat(days2.map(function(k){return _dS(h,c2[k])||'';})).concat([_dIsOn(h,c2.pk_npush)?'1':'0',_dIsOn(h,c2.pk_ngoogle)?'1':'0',_dIsOn(h,c2.pk_nalexa)?'1':'0']).join('|');
        if (el._fcSig !== sig) { el._fcSig = sig; el.innerHTML = _dRender(card); }
      } catch(e) {}
    }, 2000);
  }

  function _dUpdate(card, hass, el) {
    var h = _dH(), c = _dCfgFor(card);
    var days = ['pk_lunedi','pk_martedi','pk_mercoledi','pk_giovedi','pk_venerdi','pk_sabato','pk_domenica'];
    var sig = ['2.1diff'].concat(days.map(function(k){return _dS(h,c[k])||'';})).concat([_dIsOn(h,c.pk_npush)?'1':'0',_dIsOn(h,c.pk_ngoogle)?'1':'0',_dIsOn(h,c.pk_nalexa)?'1':'0']).join('|');
    if (!el.querySelector('.fc-card') || el._fcSig !== sig) { el._fcSig = sig; el.innerHTML = _dRender(card); }
    _dMount(card, hass, el);
  }

  var _DIFF_CARD = {
    id: 'differenziata', name: 'Raccolta Differenziata', icon: '♻️', version: '2.3',
    desc: 'Calendario raccolta differenziata settimanale con notifiche push, Google e Alexa.',
    render:    function(card) { return _dRender(card); },
    mount:     function(card, hass, el) { _dMount(card, hass, el); },
    update:    function(card, hass, el) { _dUpdate(card, hass, el); },
    configure: function(card, el) { _dOpenEntCfg(card, el); },
    frarik_pkg_check:   'sensor.raccolta_differenziata',
    frarik_pkg_id:      'frarik_differenziata',
    frarik_pkg_version: '1.0',
    openWizard: _openWizardDIFF,
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[_DIFF_CARD.id] = _DIFF_CARD;
  window.FratechCards = window.FratechCards || {};
  window.FratechCards[_DIFF_CARD.id] = _DIFF_CARD;
  try { console.log('[FratechStore] Card registrata: differenziata v' + _DIFF_CARD.version); } catch(e) {}
})();
