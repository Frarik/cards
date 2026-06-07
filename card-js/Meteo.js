/* frarik-version: 1.7 */
/**
 * meteo+previsioni.js v1.3
 * type: custom:meteo-card
 * Novità v1.3: clic su un giorno → foglio dettaglio con previsione ORARIA
 *              (ora, icona, temperatura, pioggia, vento).
 *
 * Installazione:
 *   1. Copia in /config/www/meteo+previsioni.js
 *   2. Aggiungi risorsa: /local/meteo+previsioni.js  (tipo: Modulo)
 *   3. Dashboard YAML:  type: custom:meteo-card
 *   4. Clicca ⚙ nella card per configurare entità e nome cittàa
 */

// ── Icone meteo (emoji) ───────────────────────────────────────────────────────
const _WI = {
  'clear-night':'🌙','sunny':'☀️','partlycloudy':'⛅',
  'partly-cloudy-day':'🌤️','partly-cloudy-night':'🌙',
  'cloudy':'☁️','fog':'🌫️','hail':'🌨️','lightning':'⚡',
  'lightning-rainy':'⛈️','pouring':'🌧️','rainy':'🌦️',
  'snowy':'❄️','snowy-rainy':'🌨️','windy':'💨','windy-variant':'💨','exceptional':'⚠️',
}

const _CI = {
  'clear-night':'Clear-Night','sunny':'Soleggiato','partlycloudy':'Parz. Nuvoloso',
  'partly-cloudy-day':'Parz. Nuvoloso','partly-cloudy-night':'Notte Nuvolosa',
  'cloudy':'Nuvoloso','fog':'Nebbia','hail':'Grandine','lightning':'Temporale',
  'lightning-rainy':'Temp. con Pioggia','pouring':'Pioggia Intensa','rainy':'Pioggia',
  'snowy':'Neve','snowy-rainy':'Neve e Pioggia','windy':'Ventoso',
  'windy-variant':'Ventoso Nuvoloso','exceptional':'Eccezionale',
}

const _DI = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato']
const _DS = ['DOM','LUN','MAR','MER','GIO','VEN','SAB']
const _MI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

// ── Helpers ───────────────────────────────────────────────────────────────────
function _theme(cond) {
  if (typeof cond === 'string' && cond.includes('night')) return {
    bg:'linear-gradient(150deg,#1e1448 0%,#0f0728 55%,#1a1040 100%)',
    border:'rgba(139,92,246,.35)', accent:'#a78bfa',
    tb:'rgba(139,92,246,.14)', tbr:'rgba(139,92,246,.22)',
  }
  const day = ['sunny','partlycloudy','partly-cloudy-day'].includes(cond)
  return {
    bg: day ? 'linear-gradient(150deg,#0d2e62 0%,#061630 55%,#0a2044 100%)'
            : 'linear-gradient(150deg,#0a2040 0%,#051020 55%,#081828 100%)',
    border:'rgba(56,189,248,.35)', accent:'#38bdf8',
    tb:'rgba(56,189,248,.12)', tbr:'rgba(56,189,248,.22)',
  }
}

function _fmtDate(d = new Date()) {
  return `${_DI[d.getDay()]} ${d.getDate()} ${_MI[d.getMonth()]}`
}

function _fmtDay(dt) {
  const d = typeof dt === 'string' ? new Date(dt) : dt
  return _DS[d.getDay()]
}

function _windDir(b) {
  if (b == null || b === '') return 'N/D'
  if (typeof b === 'string' && isNaN(Number(b))) return b.toUpperCase()
  return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'][Math.round(Number(b)/22.5)%16]
}

function _tempCol(t) {
  const n = parseFloat(t)
  if (n >= 28) return '#fbbf24'
  if (n >= 22) return '#f97316'
  if (n >= 14) return '#94a3b8'
  return '#60a5fa'
}

function _n(v) {
  const n = parseFloat(v)
  return (v == null || isNaN(n)) ? '--' : String(Math.round(n))
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const _IC = {
  gear:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  x:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  ok:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  cr:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  cd:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  hu:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  pr:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
  wi:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`,
  co:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity=".6"/></svg>`,
  cl:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const _CSS = `
:host{display:block;height:100%;overflow:hidden;}
*{box-sizing:border-box;margin:0;padding:0;}
.card{border-radius:20px;overflow:hidden;font-family:var(--primary-font-family,system-ui,sans-serif);color:#fff;position:relative;box-shadow:0 12px 48px rgba(0,0,0,.55);height:100%;display:flex;align-items:center;justify-content:center;}
.dots{position:absolute;inset:0;pointer-events:none;z-index:0;}
.dot{position:absolute;border-radius:50%;background:rgba(255,255,255,.55);}
.d1{width:2.5px;height:2.5px;top:10%;left:52%;}.d2{width:1.5px;height:1.5px;top:7%;right:28%;}
.d3{width:2px;height:2px;top:25%;right:14%;}.d4{width:1.5px;height:1.5px;top:40%;left:38%;}
.d5{width:2px;height:2px;top:18%;left:25%;}.d6{width:1.5px;height:1.5px;bottom:38%;right:22%;}
.body{position:relative;z-index:1;padding:16px 16px;flex:0 0 auto;transform-origin:center center;will-change:transform;}
/* header */
.hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;}
.city{font-size:32px;font-weight:900;letter-spacing:-.5px;line-height:1.1;text-shadow:0 2px 12px rgba(0,0,0,.3);}
.sub{display:flex;align-items:center;gap:7px;margin-top:5px;}
.cond{font-size:13px;font-weight:700;}
.dot-sep{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.4);}
.dt{font-size:13px;color:rgba(255,255,255,.55);font-weight:500;}
.gbtn{width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.55);flex-shrink:0;transition:background .15s;margin-top:2px;}
.gbtn:hover{background:rgba(255,255,255,.16);}
.gbtn.on{background:rgba(255,255,255,.2);color:#fff;}
/* temperatura */
.tz{display:flex;align-items:center;gap:18px;padding:6px 0 4px;}
.tic{font-size:64px;line-height:1;filter:drop-shadow(0 2px 12px rgba(0,0,0,.25));}
.ts{display:flex;flex-direction:column;}
.tn{font-size:70px;font-weight:900;line-height:1;letter-spacing:-4px;display:flex;align-items:flex-start;text-shadow:0 2px 20px rgba(0,0,0,.2);}
.tdeg{font-size:34px;font-weight:600;margin-top:10px;letter-spacing:0;opacity:.85;}
.tl{font-size:12px;color:rgba(255,255,255,.5);margin-top:5px;font-weight:500;}
/* stats */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:10px 0 10px;}
.stl{border-radius:12px;padding:10px 7px 9px;display:flex;flex-direction:column;align-items:center;gap:4px;}
.sic{opacity:.8;}
.sv{font-size:14px;font-weight:800;letter-spacing:-.3px;line-height:1;}
.sl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.5;}
/* forecast */
.fct{display:flex;align-items:center;justify-content:space-between;padding:11px 2px;border-top:1px solid rgba(255,255,255,.09);cursor:pointer;user-select:none;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;transition:opacity .15s;}
.fct:hover{opacity:.75;}
.fcg{display:none;grid-template-columns:repeat(5,1fr);gap:6px;padding-bottom:14px;}
.fcg.open{display:grid;}
.fcc{border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;transition:background .15s,border-color .15s;}
.fcc:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.18);}
.fdn{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;}
.fi{font-size:28px;line-height:1;margin:3px 0 2px;}
.fm{font-size:18px;font-weight:800;letter-spacing:-.5px;line-height:1;}
.fb{width:75%;height:3px;border-radius:99px;margin:2px 0 2px;}
.fmi{font-size:11px;color:rgba(255,255,255,.45);font-weight:600;}
.fr{font-size:8px;color:rgba(255,255,255,.35);margin-top:1px;}
/* settings overlay — modal fixed centrato a schermo */
.sov{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.62);backdrop-filter:blur(4px);padding:24px;color:#f1f5f9;font-family:var(--primary-font-family,system-ui,sans-serif);}
.sov.open{display:flex;}
.sov-modal{width:100%;max-width:440px;max-height:86vh;display:flex;flex-direction:column;background:rgba(12,9,24,.99);border:1px solid rgba(139,92,246,.32);border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7);}
.shdr{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0;}
.sico{width:34px;height:34px;border-radius:9px;flex-shrink:0;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;color:#fbbf24;}
.stit{font-size:14px;font-weight:700;}
.ssub{font-size:10px;color:#64748b;margin-top:1px;}
.scls{margin-left:auto;width:28px;height:28px;border-radius:7px;border:none;background:rgba(255,255,255,.06);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;flex-shrink:0;}
.scls:hover{background:rgba(255,255,255,.12);}
.sbdy{flex:1;overflow-y:auto;padding:14px 16px;min-height:140px;}
.fl{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;margin-top:12px;}
.fl:first-child{margin-top:0;}
.er{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);}
.ei{flex:1;min-width:0;}
.en{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.eid{font-size:10px;color:#64748b;margin-top:1px;}
.cbtn{padding:5px 12px;border-radius:7px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#f1f5f9;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;}
.cbtn:hover{background:rgba(255,255,255,.13);}
.esr{display:none;margin-top:6px;border-radius:10px;border:1px solid rgba(255,255,255,.12);overflow:hidden;background:rgba(10,8,22,1);}
.esr.open{display:block;}
.el{max-height:160px;overflow-y:auto;}
.eo{padding:8px 12px;cursor:pointer;font-size:12px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.04);}
.eo:hover{background:rgba(255,255,255,.06);color:#f1f5f9;}
.eo.sel{color:#a78bfa;font-weight:700;}
.ci{width:100%;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#f1f5f9;font-size:13px;font-family:inherit;outline:none;}
.ci:focus{border-color:rgba(167,139,250,.5);}
.ci::placeholder{color:#374151;}
.ht{font-size:10px;color:#374151;margin-top:4px;}
.sft{padding:12px 16px;border-top:1px solid rgba(255,255,255,.08);flex-shrink:0;}
.sav{width:100%;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;}
.sav:hover{opacity:.88;}
/* placeholder */
.ph{padding:32px 20px;text-align:center;color:rgba(255,255,255,.35);font-size:12px;display:flex;flex-direction:column;align-items:center;gap:10px;}
.phi{font-size:38px;opacity:.3;}
/* foglio dettaglio giorno (orario) — montato su document.body */
.dov{position:fixed;inset:0;z-index:99998;display:none;flex-direction:column;background:rgba(8,10,18,.985);color:#e8ebf5;font-family:var(--primary-font-family,system-ui,sans-serif);}
.dov.open{display:flex;}
.dhdr{display:flex;align-items:flex-start;gap:14px;padding:18px 20px 16px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0;}
.dhl{flex:1;min-width:0;}
.ddate{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;}
.dcond{font-size:24px;font-weight:900;letter-spacing:-.5px;margin-top:3px;}
.dmm{font-size:13px;font-weight:700;color:rgba(255,255,255,.6);margin-top:5px;}
.dico{font-size:52px;line-height:1;flex-shrink:0;}
.dcls{flex-shrink:0;width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.08);color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.dcls:hover{background:rgba(255,255,255,.16);color:#fff;}
.dcolh{display:grid;grid-template-columns:60px 1fr 92px 96px;gap:8px;padding:8px 20px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.35);border-bottom:1px solid rgba(255,255,255,.06);}
.dlist{flex:1;overflow-y:auto;padding:2px 0 14px;}
.dr{display:grid;grid-template-columns:60px 1fr 92px 96px;gap:8px;align-items:center;padding:9px 20px;border-bottom:1px solid rgba(255,255,255,.04);}
.dr-t{font-size:13px;font-weight:700;color:rgba(255,255,255,.75);}
.dr-w{display:flex;align-items:center;gap:7px;}
.dr-ic{font-size:18px;line-height:1;}
.dr-tp{font-size:14px;font-weight:800;letter-spacing:-.3px;}
.dr-bar{height:3px;border-radius:99px;margin-top:3px;}
.dr-rn{font-size:11px;color:rgba(255,255,255,.5);}
.dr-wd{font-size:11px;color:rgba(255,255,255,.55);text-align:right;white-space:nowrap;}
.dempty{padding:40px 20px;text-align:center;color:rgba(255,255,255,.35);font-size:12px;line-height:1.5;}
`

// ── MeteoCard ─────────────────────────────────────────────────────────────────
class MeteoCard extends HTMLElement {

  // HA chiama questo per il config stub (usato quando si aggiunge la card via UI)
  static getStubConfig() { return { entityId:'weather.forecast_home', cityName:'' } }

  constructor() {
    super()
    this.attachShadow({ mode:'open' })
    this._h  = null          // hass
    this._c  = { entityId:'', cityName:'' }  // config
    this._fc = []            // forecast data
    this._fo = false         // forecast open
    this._so = false         // settings open
    this._se = false         // search open
    this._te = ''            // temp entityId in settings
    this._tc = ''            // temp cityName in settings
    this._ts = {}            // temp override entità delle 4 stat in settings ({hum,pres,wind,dir})
    this._fs = null          // forecast subscription
    this._bk = null          // build key (per evitare rebuild inutili)
    this._nh = true          // flag primo hass
    this._sk = 'default'      // storage key per localStorage
    this._modalHost = null    // host del modal impostazioni (montato su document.body)
    this._fch = []            // forecast ORARIO (per il dettaglio giorno)
    this._fhs = null          // sottoscrizione forecast orario
    this._dh  = null          // host del foglio dettaglio (montato su document.body)
    this._dday = -1           // indice giorno aperto nel dettaglio (-1 = chiuso)
    this._click = this._onClick.bind(this)
    this._inp   = this._onInput.bind(this)
  }

  // ── Persistenza config in localStorage ──────────────────────────────────────
  // HA non salva config-changed fuori dall'edit-mode, quindi persistiamo qui.
  _lsKey() { return 'meteocard:' + this._sk }

  _loadStore() {
    try { return JSON.parse(localStorage.getItem(this._lsKey()) || 'null') }
    catch { return null }
  }

  _saveStore() {
    try {
      localStorage.setItem(this._lsKey(),
        JSON.stringify({ entityId: this._c.entityId, cityName: this._c.cityName, statEnts: this._c.statEnts || {} }))
    } catch {}
  }

  setConfig(cfg) {
    cfg = cfg || {}
    // chiave di storage: usa storageKey dal YAML, altrimenti l'entità del YAML, altrimenti 'default'
    this._sk = cfg.storageKey || cfg.entityId || 'default'

    // localStorage ha priorità (è l'ultima scelta dell'utente via UI),
    // poi il YAML, poi i default
    const stored = this._loadStore() || {}
    const prev = this._c?.entityId
    this._c = {
      entityId: stored.entityId || cfg.entityId || '',
      cityName: (stored.cityName != null ? stored.cityName : (cfg.cityName || '')),
      statEnts: stored.statEnts || cfg.statEnts || {},
    }
    this._te = this._c.entityId
    this._tc = this._c.cityName
    this._ts = Object.assign({}, this._c.statEnts)
    if (prev !== this._c.entityId && this._h) this._getForecast()
    this._bk = null; this._build()
  }

  getCardSize() { return this._fo ? 8 : 5 }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', this._click)
    this.shadowRoot.addEventListener('input', this._inp)
    if (this._h && this._c.entityId) this._getForecast()
    try { if (!this._frkRO && 'ResizeObserver' in window) { this._frkRO = new ResizeObserver(() => this._frkFit()); this._frkRO.observe(this) } } catch (e) {}
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._click)
    this.shadowRoot.removeEventListener('input', this._inp)
    this._destroyModal()
    this._destroyDetail()
    this._unsub()
    try { if (this._frkRO) this._frkRO.disconnect() } catch (e) {}
  }

  /* Adatta il contenuto alla dimensione della card (zoom-to-fit, posizioni invariate),
     come la person-card. Misura la dimensione base una volta e scala con transform. */
  _frkFit() {
    try {
      const card = this.shadowRoot && this.shadowRoot.querySelector('.card')
      const body = card && card.querySelector('.body')
      if (!body) return
      const HW = this.clientWidth, HH = this.clientHeight
      if (!HW || !HH) return
      // lo SFONDO (.card) riempie il contenitore; scaliamo SOLO il contenuto (.body),
      // così non compare riquadro dietro. Larghezza di DESIGN fissa (come la person-card):
      // così il contenuto si INGRANDISCE sulle card grandi e si rimpicciolisce su quelle piccole.
      const BW = 340
      body.style.transform = 'none'
      body.style.width = BW + 'px'
      const BH = body.offsetHeight || HH
      // scala UNIFORME (zoom-to-fit): il contenuto si adatta SENZA deformarsi;
      // lo sfondo gradiente della .card riempie eventuali bordi.
      const s = Math.min(HW / BW, HH / BH)
      body.style.transform = 'scale(' + s + ')'
    } catch (e) {}
  }

  set hass(h) {
    const first = this._nh; this._nh = false
    this._h = h
    if (this._fc.length === 0 && this._c.entityId) this._getForecast()
    // se il pannello impostazioni è aperto, non ridisegnare:
    // eviterebbe di cancellare l'input mentre l'utente digita
    if (this._so) return
    const k = this._key()
    if (first || k !== this._bk) { this._bk = k; this._build() }
  }

  // ── Forecast ───────────────────────────────────────────────────────────────
  async _getForecast() {
    this._unsub()
    const eid = this._c?.entityId
    if (!this._h || !eid) return

    const onFc = fc => {
      if (!Array.isArray(fc) || fc.length === 0) return false
      this._fc = fc; this._bk = null; this._build(); return true
    }

    // estrae l'array forecast da qualunque formato di risposta
    const extract = r =>
      r?.response?.[eid]?.forecast ??
      r?.[eid]?.forecast ??
      r?.forecast ??
      (Array.isArray(r) ? r : null)

    // 1. attributes.forecast (HA < 2023.9)
    const legacy = this._h.states?.[eid]?.attributes?.forecast
    if (Array.isArray(legacy) && legacy.length > 0) { onFc(legacy); }

    const conn = this._h.connection

    // 2. subscribeMessage — aggiornamenti real-time (HA 2023.9+)
    if (conn?.subscribeMessage) {
      try {
        this._fs = conn.subscribeMessage(
          ev => onFc(ev?.forecast ?? ev?.event?.forecast ?? []),
          { type:'weather/subscribe_forecast', forecast_type:'daily', entity_id:eid }
        )
      } catch (e) { console.warn('[meteo-card] subscribe:', e?.message || e) }
    }

    if (this._fc.length > 0) return

    // 3. weather.get_forecasts (PLURALE — servizio attuale HA 2024+)
    try {
      const r = await conn?.sendMessagePromise?.({
        type:'execute_script',
        sequence:[{
          service:'weather.get_forecasts',
          data:{ type:'daily' },
          target:{ entity_id:eid },
          response_variable:'r',
        }, { stop:'done', response_variable:'r' }],
      }).catch(() => null)
      if (onFc(extract(r))) return
    } catch (e) { console.warn('[meteo-card] get_forecasts script:', e?.message || e) }

    // 4. call_service get_forecasts (plurale) diretto
    try {
      const r = await conn?.sendMessagePromise?.({
        type:'call_service', domain:'weather', service:'get_forecasts',
        service_data:{ entity_id:eid, type:'daily' }, return_response:true,
      }).catch(() => null)
      if (onFc(extract(r))) return
    } catch (e) { console.warn('[meteo-card] get_forecasts:', e?.message || e) }

    // 5. call_service get_forecast (SINGOLARE — HA 2023.x)
    try {
      const r = await conn?.sendMessagePromise?.({
        type:'call_service', domain:'weather', service:'get_forecast',
        service_data:{ entity_id:eid, type:'daily' }, return_response:true,
      }).catch(() => null)
      if (onFc(extract(r))) return
    } catch (e) { console.warn('[meteo-card] get_forecast:', e?.message || e) }
  }

  _unsub() {
    if (this._fs) { Promise.resolve(this._fs).then(u => { if (typeof u === 'function') u() }).catch(() => {}); this._fs = null }
    if (this._fhs) { Promise.resolve(this._fhs).then(u => { if (typeof u === 'function') u() }).catch(() => {}); this._fhs = null }
  }

  // ── Forecast ORARIO (per il dettaglio del giorno) ───────────────────────────
  async _getHourly() {
    const eid = this._c?.entityId
    if (!this._h || !eid) return
    const onH = fc => { if (!Array.isArray(fc) || fc.length === 0) return false; this._fch = fc; if (this._dday >= 0) this._renderDetail(); return true }
    const extract = r => r?.response?.[eid]?.forecast ?? r?.[eid]?.forecast ?? r?.forecast ?? (Array.isArray(r) ? r : null)
    const conn = this._h.connection
    // 1. subscribe orario (real-time)
    if (conn?.subscribeMessage) {
      try {
        this._fhs = conn.subscribeMessage(
          ev => onH(ev?.forecast ?? ev?.event?.forecast ?? []),
          { type:'weather/subscribe_forecast', forecast_type:'hourly', entity_id:eid })
      } catch (e) {}
    }
    if (this._fch.length > 0) return
    // 2. get_forecasts (plurale)
    try { const r = await conn?.sendMessagePromise?.({ type:'call_service', domain:'weather', service:'get_forecasts', service_data:{ entity_id:eid, type:'hourly' }, return_response:true }).catch(() => null); if (onH(extract(r))) return } catch (e) {}
    // 3. get_forecast (singolare)
    try { const r = await conn?.sendMessagePromise?.({ type:'call_service', domain:'weather', service:'get_forecast', service_data:{ entity_id:eid, type:'hourly' }, return_response:true }).catch(() => null); if (onH(extract(r))) return } catch (e) {}
  }

  // ── Dettaglio giorno (foglio orario, montato su document.body) ──────────────
  _openDay(i) {
    if (!this._fc[i]) return
    this._dday = i
    this._renderDetail()
    if (!this._fch.length) this._getHourly()
  }
  _closeDay() { this._dday = -1; this._destroyDetail() }
  _renderDetail() {
    if (this._dday < 0) return
    if (!this._dh) {
      this._dh = document.createElement('div')
      this._dh.attachShadow({ mode:'open' })
      this._dh.shadowRoot.addEventListener('click', this._click)
      document.body.appendChild(this._dh)
    }
    this._dh.shadowRoot.innerHTML = this._detailHTML()
  }
  _destroyDetail() {
    if (!this._dh) return
    this._dh.shadowRoot.removeEventListener('click', this._click)
    this._dh.remove()
    this._dh = null
  }
  _detailHTML() {
    const d = this._fc[this._dday]
    if (!d) return ''
    const date = new Date(d.datetime)
    const th   = _theme(d.condition)
    const cond = _CI[d.condition] || String(d.condition || '').replace(/-/g, ' ')
    const ico  = _WI[d.condition] || '🌡️'
    const mx   = _n(d.temperature)
    const mn   = _n(d.templow ?? (parseFloat(d.temperature) - 4))
    const dayKey = date.toDateString()
    const hours = (this._fch || []).filter(h => new Date(h.datetime).toDateString() === dayKey)
    let rows
    if (!hours.length) {
      rows = `<div class="dempty">${(this._fch && this._fch.length)
        ? 'Nessun dato orario per questo giorno.<br>Le previsioni orarie coprono di solito solo le prossime 24–48 ore.'
        : 'Dati orari in caricamento…'}</div>`
    } else {
      const temps = hours.map(h => parseFloat(h.temperature) || 0)
      const mxT = Math.max(...temps), mnT = Math.min(...temps), rng = (mxT - mnT) || 1
      rows = hours.map(h => {
        const t  = new Date(h.datetime)
        const hh = String(t.getHours()).padStart(2, '0') + ':00'
        const hi = _WI[h.condition] || ico
        const tp = _n(h.temperature)
        const col = _tempCol(h.temperature)
        const bw = Math.round(((parseFloat(h.temperature) || 0) - mnT) / rng * 70 + 30)
        const rn = (parseFloat(h.precipitation) || 0).toFixed(1)
        const ws = h.wind_speed != null ? Math.round(parseFloat(h.wind_speed)) : '--'
        const wd = _windDir(h.wind_bearing)
        return `<div class="dr">
          <div class="dr-t">${hh}</div>
          <div>
            <div class="dr-w"><span class="dr-ic">${hi}</span><span class="dr-tp" style="color:${col};">${tp}°</span></div>
            <div class="dr-bar" style="background:${col};width:${bw}%;"></div>
          </div>
          <div class="dr-rn">💧 ${rn}mm</div>
          <div class="dr-wd">${ws}km/h ${wd}</div>
        </div>`
      }).join('')
    }
    return `<style>${_CSS}</style>
<div class="dov open">
  <div class="dhdr" style="background:linear-gradient(135deg,${th.tb},transparent);">
    <div class="dhl">
      <div class="ddate" style="color:${th.accent};">${_fmtDate(date).toUpperCase()}</div>
      <div class="dcond">${cond}</div>
      <div class="dmm">↑ ${mx}°&nbsp;&nbsp;↓ ${mn}°</div>
    </div>
    <div class="dico">${ico}</div>
    <button class="dcls" data-a="dayclose">${_IC.x}</button>
  </div>
  <div class="dcolh"><div>Ora</div><div>Temp</div><div>Pioggia</div><div style="text-align:right;">Vento</div></div>
  <div class="dlist">${rows}</div>
</div>`
  }

  _key() {
    if (!this._h) return 'NO_HASS'
    if (!this._c.entityId) return 'NO_EID'
    const st = this._h.states?.[this._c.entityId]
    if (!st) return 'NOT_FOUND:' + this._c.entityId
    const a = st.attributes
    const se = this._c.statEnts||{}
    const ex = Object.keys(se).map(k=>k+'='+se[k]+':'+(this._h.states?.[se[k]]?.state??'')).join(',')
    return [st.state, a.temperature, a.humidity, a.pressure,
            a.wind_speed, a.wind_bearing, this._fo, this._so,
            this._se, this._fc.length, this._c.cityName, ex].join('|')
  }

  // ── Click ──────────────────────────────────────────────────────────────────
  _onClick(e) {
    // click sul backdrop scuro (fuori dal modal/foglio) → chiude
    if (e.target.classList?.contains('sov')) { this._closeSettings(); return }
    if (e.target.classList?.contains('dov')) { this._closeDay(); return }
    const t = e.target.closest('[data-a]')
    if (!t) return
    switch (t.dataset.a) {
      case 'gear':  this._openSettings(); break
      case 'close': this._closeSettings(); break
      case 'day':   this._openDay(parseInt(t.dataset.i,10)||0); break
      case 'dayclose': this._closeDay(); break
      case 'fc':
        this._fo=!this._fo; this._bk=null; this._build(); break
      case 'srch':
        this._se=!this._se; this._renderModal(); break
      case 'sel':
        this._te=t.dataset.id; this._se=false; this._renderModal(); break
      case 'save': {
        const se={}; ['hum','pres','wind','dir'].forEach(k=>{ if(this._ts[k]) se[k]=this._ts[k] })
        this._c={ entityId:this._te, cityName:this._tc, statEnts:se }
        this._saveStore()       // persiste in localStorage → sopravvive a refresh/cache
        this._fc=[]; this._getForecast()
        this._closeSettings()
        this.dispatchEvent(new CustomEvent('config-changed',
          { detail:{ config:{ entityId:this._c.entityId, cityName:this._c.cityName, statEnts:this._c.statEnts } },
            bubbles:true, composed:true }))
        break
      }
    }
  }

  _onInput(e) {
    const f = e.target.dataset.f
    if (f === 'city') this._tc = e.target.value
    else if (f && f.indexOf('st_') === 0) this._ts[f.slice(3)] = e.target.value
  }

  // ── Modal impostazioni (montato su document.body, fuori dalla card) ─────────
  _openSettings() {
    this._so = true; this._se = false
    this._te = this._c.entityId; this._tc = this._c.cityName
    this._ts = Object.assign({}, this._c.statEnts)
    this._renderModal()
    this._bk = null; this._build()   // aggiorna stato attivo del gear
  }

  _closeSettings() {
    this._so = false
    this._te = this._c.entityId; this._tc = this._c.cityName
    this._ts = Object.assign({}, this._c.statEnts)
    this._destroyModal()
    this._bk = null; this._build()
  }

  _renderModal() {
    if (!this._modalHost) {
      this._modalHost = document.createElement('div')
      this._modalHost.attachShadow({ mode:'open' })
      this._modalHost.shadowRoot.addEventListener('click', this._click)
      this._modalHost.shadowRoot.addEventListener('input', this._inp)
      document.body.appendChild(this._modalHost)
    }
    this._modalHost.shadowRoot.innerHTML = `<style>${_CSS}</style>${this._sovHTML()}`
  }

  _destroyModal() {
    if (!this._modalHost) return
    this._modalHost.shadowRoot.removeEventListener('click', this._click)
    this._modalHost.shadowRoot.removeEventListener('input', this._inp)
    this._modalHost.remove()
    this._modalHost = null
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  _build() {
    if (!this._h) return
    const eid = this._c.entityId
    if (!eid) { this._renderEmpty('Clicca ⚙ per configurare l\'entità meteo') }
    else {
      const st = this._h.states?.[eid]
      if (!st) { this._renderEmpty('Entità non trovata: ' + eid) }
      else { this._renderCard(st) }
    }
    try { requestAnimationFrame(() => this._frkFit()) } catch (e) {}
  }

  _renderEmpty(msg) {
    this.shadowRoot.innerHTML = `<style>${_CSS}</style>
<div class="card" style="background:#0f0820;border:1px solid rgba(139,92,246,.25);">
  <div class="body">
    <div class="hdr">
      <div></div>
      <button class="gbtn ${this._so?'on':''}" data-a="gear">${_IC.gear}</button>
    </div>
    <div class="ph"><div class="phi">⛅</div><div>${msg}</div></div>
  </div>
</div>`
  }

  _renderCard(st) {
    const cond  = st.state
    const a     = st.attributes
    const th    = _theme(cond)
    const ico   = _WI[cond]  || '🌡️'
    const cit   = _CI[cond]  || cond.replace(/-/g,' ')
    const temp  = _n(a.temperature)
    const hum   = a.humidity   != null ? a.humidity  : '--'
    const pres  = _n(a.pressure)
    const wsp   = a.wind_speed != null ? a.wind_speed : '--'
    const wdir  = _windDir(a.wind_bearing)
    const city  = this._c.cityName || a.friendly_name || this._c.entityId
    const today = _fmtDate()

    // override delle 4 statistiche: se l'utente ha scelto un'entità, usa quella al posto del dato meteo
    const se = this._c.statEnts || {}
    const ov = (k, def) => {
      const id = se[k]; if (!id) return def
      const s = this._h.states?.[id]; if (!s) return def
      const u = (s.attributes && s.attributes.unit_of_measurement) || ''
      const raw = s.state
      const v = (raw==null||raw===''||isNaN(parseFloat(raw))) ? (raw||'--') : _n(raw)
      return v + (u ? ('<span style="font-size:11px;opacity:.7"> ' + u + '</span>') : '')
    }

    // forecast HTML
    let fcH = ''
    if (this._fo && this._fc.length) {
      const days = this._fc.slice(0,5)
      const maxT = Math.max(...days.map(f=>parseFloat(f.temperature)||0))
      const minT = Math.min(...days.map(f=>parseFloat(f.templow??f.temperature)||0))
      const rng  = maxT - minT || 1
      fcH = days.map((f,i)=>{
        const nm  = i===0 ? 'OGGI' : _fmtDay(new Date(f.datetime))
        const fi  = _WI[f.condition] || '🌡️'
        const mx  = _n(f.temperature)
        const mn  = _n(f.templow ?? (parseFloat(f.temperature)-4))
        const rn  = (parseFloat(f.precipitation)||0).toFixed(1)
        const col = _tempCol(f.temperature)
        const bw  = Math.round(((parseFloat(f.temperature)||0)-minT)/rng*75+25)
        const nc  = i===0 ? th.accent : 'rgba(255,255,255,.65)'
        return `<div class="fcc" data-a="day" data-i="${i}">
          <div class="fdn" style="color:${nc};">${nm}</div>
          <div class="fi">${fi}</div>
          <div class="fm">${mx}°</div>
          <div class="fb" style="background:${col};width:${bw}%;"></div>
          <div class="fmi">${mn}°</div>
          <div class="fr">${rn}mm</div>
        </div>`
      }).join('')
    } else if (this._fo) {
      fcH = `<div style="grid-column:span 5;text-align:center;padding:14px;color:rgba(255,255,255,.25);font-size:11px;">Previsioni in caricamento…</div>`
    }

    this.shadowRoot.innerHTML = `<style>${_CSS}</style>
<div class="card" style="background:${th.bg};border:1px solid ${th.border};">

  <div class="dots">
    <span class="dot d1"></span><span class="dot d2"></span>
    <span class="dot d3"></span><span class="dot d4"></span>
    <span class="dot d5"></span><span class="dot d6"></span>
  </div>

  <div class="body">
    <div class="hdr">
      <div>
        <div class="city">${city}</div>
        <div class="sub">
          <span class="cond" style="color:${th.accent};">${cit}</span>
          <span class="dot-sep"></span>
          <span class="dt">${today}</span>
        </div>
      </div>
      <button class="gbtn ${this._so?'on':''}" data-a="gear">${_IC.gear}</button>
    </div>

    <div class="tz">
      <div class="tic">${ico}</div>
      <div class="ts">
        <div class="tn">${temp}<span class="tdeg">°C</span></div>
        <div class="tl">Temperatura attuale</div>
      </div>
    </div>

    <div class="stats">
      <div class="stl" style="background:${th.tb};border:1px solid ${th.tbr};">
        <div class="sic" style="color:${th.accent};">${_IC.hu}</div>
        <div class="sv">${ov('hum', hum+'%')}</div><div class="sl">Umidità</div>
      </div>
      <div class="stl" style="background:${th.tb};border:1px solid ${th.tbr};">
        <div class="sic" style="color:${th.accent};">${_IC.pr}</div>
        <div class="sv">${ov('pres', pres)}</div><div class="sl">Pressione</div>
      </div>
      <div class="stl" style="background:${th.tb};border:1px solid ${th.tbr};">
        <div class="sic" style="color:${th.accent};">${_IC.wi}</div>
        <div class="sv">${ov('wind', wsp+'k/h')}</div><div class="sl">Vento</div>
      </div>
      <div class="stl" style="background:${th.tb};border:1px solid ${th.tbr};">
        <div class="sic" style="color:${th.accent};">${_IC.co}</div>
        <div class="sv">${ov('dir', wdir)}</div><div class="sl">Direzione</div>
      </div>
    </div>

    <div class="fct" data-a="fc" style="color:${th.accent};">
      <span>Prossimi giorni — Tocca per i dettagli</span>
      <span>${this._fo ? _IC.cd : _IC.cr}</span>
    </div>

    <div class="fcg ${this._fo?'open':''}">${fcH}</div>
  </div>
</div>`
  }

  _sovHTML() {
    const eid   = this._te || this._c.entityId || ''
    const ent   = this._h?.states?.[eid]
    const enm   = ent?.attributes?.friendly_name || eid || '—'
    const city  = this._tc
    const wents = Object.keys(this._h?.states||{}).filter(k=>k.startsWith('weather.'))
    const exEnts = Object.keys(this._h?.states||{}).filter(k=>/^(sensor|binary_sensor|number|input_number)\./.test(k)).sort()
    // datalist condivisa: campo di testo con filtro mentre si scrive (autocomplete nativo)
    const exDatalist = `<datalist id="meteo-ent-list">${exEnts.map(id=>`<option value="${id}">${(this._h.states[id].attributes&&this._h.states[id].attributes.friendly_name)||id}</option>`).join('')}</datalist>`
    const statRows = [['hum','Umidità'],['pres','Pressione'],['wind','Vento'],['dir','Direzione']].map(([k,lbl])=>`<div style="display:flex;gap:8px;margin-top:7px;align-items:center">
        <span style="width:80px;flex-shrink:0;font-size:11px;color:#94a3b8">${lbl}</span>
        <input data-f="st_${k}" list="meteo-ent-list" value="${(this._ts[k]||'').replace(/"/g,'&quot;')}" placeholder="— dal meteo — (scrivi per filtrare)"
          style="flex:1;min-width:0;height:34px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:#0f1830;color:#fff;font-size:12px;padding:0 10px;font-family:inherit"/>
      </div>`).join('')

    return `
<div class="sov open">
  <div class="sov-modal">
    <div class="shdr">
      <div class="sico">${_IC.gear}</div>
      <div><div class="stit">Meteo + Previsioni</div><div class="ssub">Impostazioni card</div></div>
      <button class="scls" data-a="close">${_IC.x}</button>
    </div>
    <div class="sbdy">
      <div class="fl">Entità meteo HA</div>
      <div class="er">
        <span style="color:#64748b;display:flex;flex-shrink:0;margin-right:4px;">${_IC.cl}</span>
        <div class="ei">
          <div class="en">${enm}</div>
          <div class="eid">${eid}</div>
        </div>
        <button class="cbtn" data-a="srch">Cambia</button>
      </div>
      <div class="esr ${this._se?'open':''}">
        <div class="el">
          ${wents.length
            ? wents.map(id=>`<div class="eo ${id===eid?'sel':''}" data-a="sel" data-id="${id}">
                ${this._h.states[id]?.attributes?.friendly_name||id}
                <span style="font-size:9px;color:#374151;margin-left:4px;">${id}</span>
              </div>`).join('')
            : '<div style="padding:8px 12px;font-size:11px;color:#64748b;">Nessuna entità weather.* trovata</div>'
          }
        </div>
      </div>
      <div class="fl" style="margin-top:14px;">Nome città</div>
      <input class="ci" type="text" value="${city}" placeholder="Es: Selargius" data-f="city"/>
      <div class="ht">Se vuoto, usa il nome dell'entità HA</div>

      <div class="fl" style="margin-top:16px;">Entità delle statistiche</div>
      <div class="ht">Scrivi nel campo per filtrare le entità; lascia vuoto per usare il dato del meteo.</div>
      ${exDatalist}
      ${statRows}
    </div>
    <div class="sft">
      <button class="sav" data-a="save">${_IC.ok} Salva</button>
    </div>
  </div>
</div>`
  }
}

// Protezione anti double-registration
if (!customElements.get('meteo-card')) {
  customElements.define('meteo-card', MeteoCard)
}

// Registrazione metadati: usa setTimeout per evitare interferenze con
// il meccanismo _installCardCode di Frarik che legge window.customCards
// subito dopo l'eval, prima che questa riga sia eseguita.
// Il defer garantisce che la voce venga aggiunta solo DOPO che Frarik
// ha già completato il suo ciclo di registrazione interno.
setTimeout(function() {
  try {
    window.customCards = window.customCards || []
    // Rimuove eventuali duplicati
    window.customCards = window.customCards.filter(function(c) { return c && c.type !== 'meteo-card' })
    window.customCards.push({
      type:        'meteo-card',
      name:        'Meteo + Previsioni',
      description: 'Card meteo con previsioni 5 giorni, tema notte/giorno e impostazioni inline.',
      preview:     false,
    })
  } catch(e) {}
}, 0)
