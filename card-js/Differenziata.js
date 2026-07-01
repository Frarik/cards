/**
 * differenziata-card.js — Raccolta Differenziata v4
 * Multi-selezione rifiuti, bidoni realistici, colori personalizzabili
 */

const _DD_DAYS = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica']
const _DD_LBL  = ['Lu','Ma','Me','Gi','Ve','Sa','Do']
const _DD_FULL = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica']

const _TIPI = [
  { id:'umido',    label:'Umido',    icon:'🟤', defColor:'#92400e' },
  { id:'secco',    label:'Secco',    icon:'⚫', defColor:'#4b5563' },
  { id:'carta',    label:'Carta',    icon:'🔵', defColor:'#1d4ed8' },
  { id:'plastica', label:'Plastica', icon:'🟡', defColor:'#d97706' },
  { id:'vetro',    label:'Vetro',    icon:'🟢', defColor:'#15803d' },
]
const _DD_CLRS_KEY = 'frarik_diff_v4_colors'

function _ddClrs() { try { return JSON.parse(localStorage.getItem(_DD_CLRS_KEY)||'{}') } catch(e) { return {} } }
function _ddClr(id) { const c=_ddClrs(), t=_TIPI.find(x=>x.id===id); return c[id]||(t?t.defColor:'#6b7280') }
function _ddSaveClr(id, val) { const c=_ddClrs(); c[id]=val; try{localStorage.setItem(_DD_CLRS_KEY,JSON.stringify(c))}catch(e){} }
function _ddShade(hex, n) {
  const x=parseInt(hex.slice(1),16)||0
  const r=Math.max(0,Math.min(255,((x>>16)&255)+n))
  const g=Math.max(0,Math.min(255,((x>>8)&255)+n))
  const b=Math.max(0,Math.min(255,(x&255)+n))
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')
}
function _parseWastes(str) {
  if (!str||!str.trim()) return []
  return str.split(',').map(s=>s.trim().toLowerCase()).filter(s=>_TIPI.some(t=>t.id===s))
}

/* ─── Bidone SVG realistico ─────────────────────────────────────────────── */
function _binSvg(color, sz) {
  const gid = 'dg'+Math.abs(color.split('').reduce((a,c)=>a+c.charCodeAt(0),0))
  const light  = _ddShade(color, 45)
  const dark   = _ddShade(color,-40)
  const darker = _ddShade(color,-55)
  const lid    = _ddShade(color, 20)
  return `<svg width="${sz}" height="${Math.round(sz*1.18)}" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${gid}b" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="${light}"/>
      <stop offset="38%"  stop-color="${color}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <linearGradient id="${gid}l" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="${lid}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <linearGradient id="${gid}tb" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="rgba(255,255,255,.05)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,.18)"/>
    </linearGradient>
  </defs>
  <!-- Ground shadow -->
  <ellipse cx="40" cy="93" rx="28" ry="4" fill="rgba(0,0,0,.22)"/>
  <!-- Axle -->
  <rect x="18" y="83" width="44" height="5" rx="2.5" fill="${darker}"/>
  <!-- Wheels -->
  <circle cx="22" cy="87" r="7" fill="${darker}"/>
  <circle cx="58" cy="87" r="7" fill="${darker}"/>
  <circle cx="22" cy="87" r="4" fill="#0f172a"/>
  <circle cx="58" cy="87" r="4" fill="#0f172a"/>
  <circle cx="21" cy="86" r="1.4" fill="rgba(255,255,255,.3)"/>
  <circle cx="57" cy="86" r="1.4" fill="rgba(255,255,255,.3)"/>
  <!-- Body -->
  <path d="M13 30 L16 79 Q16 83 23 83 H57 Q64 83 64 79 L67 30 Z" fill="url(#${gid}b)"/>
  <path d="M13 30 L16 79 Q16 83 23 83 H57 Q64 83 64 79 L67 30 Z" fill="url(#${gid}tb)"/>
  <!-- Left highlight -->
  <path d="M13 30 L16 79 Q16 83 23 83 H25 L22 30 Z" fill="rgba(255,255,255,.18)"/>
  <!-- Right shadow -->
  <path d="M67 30 L64 79 Q64 83 57 83 H55 L58 30 Z" fill="rgba(0,0,0,.18)"/>
  <!-- Ribs -->
  <path d="M14 43 Q40 41 66 43" stroke="rgba(0,0,0,.13)" stroke-width="1.5" fill="none"/>
  <path d="M14 42 Q40 40 66 42" stroke="rgba(255,255,255,.07)" stroke-width="1" fill="none"/>
  <path d="M14 55 Q40 53 66 55" stroke="rgba(0,0,0,.13)" stroke-width="1.5" fill="none"/>
  <path d="M14 54 Q40 52 66 54" stroke="rgba(255,255,255,.07)" stroke-width="1" fill="none"/>
  <path d="M15 67 Q40 65 65 67" stroke="rgba(0,0,0,.13)" stroke-width="1.5" fill="none"/>
  <path d="M15 66 Q40 64 65 66" stroke="rgba(255,255,255,.07)" stroke-width="1" fill="none"/>
  <!-- Front label panel -->
  <rect x="24" y="45" width="32" height="20" rx="3" fill="rgba(255,255,255,.1)"/>
  <rect x="24" y="45" width="32" height="3" rx="3" fill="rgba(255,255,255,.18)"/>
  <!-- Lid ledge -->
  <rect x="10" y="21" width="60" height="11" rx="4" fill="${dark}"/>
  <rect x="10" y="21" width="60" height="4" rx="4" fill="rgba(255,255,255,.12)"/>
  <!-- Lid -->
  <rect x="8" y="9" width="64" height="14" rx="5" fill="url(#${gid}l)"/>
  <!-- Lid top shine -->
  <rect x="8" y="9" width="64" height="5" rx="5" fill="rgba(255,255,255,.28)"/>
  <!-- Lid right shadow -->
  <rect x="56" y="9" width="16" height="14" rx="5" fill="rgba(0,0,0,.1)"/>
  <!-- Handle -->
  <path d="M28 2 Q40 -2 52 2 L52 9 Q40 5 28 9 Z" fill="${darker}"/>
  <path d="M28 2 Q40 -2 52 2 L52 4.5 Q40 .5 28 4.5 Z" fill="rgba(255,255,255,.22)"/>
</svg>`
}

function _emptyBinSvg(sz) {
  return `<svg width="${sz}" height="${Math.round(sz*1.18)}" viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="40" cy="93" rx="28" ry="4" fill="rgba(255,255,255,.03)"/>
  <rect x="18" y="83" width="44" height="5" rx="2.5" fill="rgba(255,255,255,.05)"/>
  <circle cx="22" cy="87" r="7" fill="rgba(255,255,255,.05)"/>
  <circle cx="58" cy="87" r="7" fill="rgba(255,255,255,.05)"/>
  <path d="M13 30 L16 79 Q16 83 23 83 H57 Q64 83 64 79 L67 30 Z" fill="rgba(255,255,255,.04)"/>
  <path d="M10 21 H70 Q70 32 10 32 Z" fill="rgba(255,255,255,.04)"/>
  <rect x="8" y="9" width="64" height="14" rx="5" fill="rgba(255,255,255,.05)"/>
  <path d="M22 38 L58 74 M58 38 L22 74" stroke="rgba(255,255,255,.12)" stroke-width="3" stroke-linecap="round"/>
</svg>`
}

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const _DD_CSS = `
:host{display:block}
*{box-sizing:border-box;margin:0;padding:0}
.card{background:var(--ha-card-background,#111827);border-radius:var(--ha-card-border-radius,16px);border:1px solid rgba(255,255,255,.08);overflow:hidden;font-family:var(--primary-font-family,system-ui,sans-serif);box-shadow:0 8px 32px rgba(0,0,0,.3)}
.hdr{display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid rgba(255,255,255,.06)}
.hdr-ico{width:40px;height:40px;border-radius:11px;flex-shrink:0;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);display:flex;align-items:center;justify-content:center;font-size:20px}
.hdr-txt{flex:1;min-width:0}
.hdr-title{font-size:15px;font-weight:700;color:#fff}
.hdr-date{font-size:10px;color:rgba(255,255,255,.45);margin-top:2px}
.hdr-btn{width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);transition:background .15s;flex-shrink:0}
.hdr-btn:hover{background:rgba(255,255,255,.1);color:#fff}
button[data-a="settings"]{display:var(--fgear,none)}
.body{display:flex;min-height:170px;border-bottom:1px solid rgba(255,255,255,.06)}
/* ── Colonna sinistra ── */
.col-l{width:44%;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px 6px;position:relative;overflow:hidden}
.col-l-glow{position:absolute;width:160px;height:160px;border-radius:50%;filter:blur(60px);opacity:.15;pointer-events:none;top:50%;left:50%;transform:translate(-50%,-50%)}
.col-l-tag{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;padding:2px 8px;border-radius:20px;border:1px solid currentColor;position:relative;z-index:1}
.bins-row{display:flex;align-items:flex-end;justify-content:center;gap:4px;position:relative;z-index:1}
.bins-labels{display:flex;flex-direction:column;align-items:center;gap:2px;position:relative;z-index:1}
.bins-lbl{font-size:11px;font-weight:700;color:#fff;display:flex;align-items:center;gap:5px}
.bins-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.bins-sub{font-size:9px;color:rgba(255,255,255,.4);position:relative;z-index:1}
/* ── Colonna destra ── */
.col-r{flex:1;display:flex;flex-direction:column;min-width:0}
.next-row{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);background:rgba(255,255,255,.02)}
.next-tag{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.4);margin-bottom:3px}
.next-items{display:flex;flex-direction:column;gap:2px}
.next-item{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#fff}
.next-none{font-size:11px;color:rgba(255,255,255,.3)}
/* ── Week ── */
.week{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;padding:7px 5px 9px}
.wday{display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 1px 4px;border-radius:7px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02)}
.wday.today{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.06)}
.wday-lbl{font-size:7px;font-weight:700;color:rgba(255,255,255,.4)}
.wday.today .wday-lbl{color:#fff}
.wday-dots{display:flex;flex-direction:column;align-items:center;gap:1px}
.wday-dot{width:7px;height:7px;border-radius:50%}
.wday-none{width:7px;height:2px;border-radius:1px;background:rgba(255,255,255,.1);margin:3px 0}
`

/* ─── Popup impostazioni ─────────────────────────────────────────────────── */
const _POPUP_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
.ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(6px)}
.mo{width:100%;max-height:90vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(34,197,94,.22);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -16px 60px rgba(0,0,0,.8);animation:su .22s cubic-bezier(.32,1.12,.56,1)}
@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
.mhdr{display:flex;align-items:center;gap:12px;padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
.mico{width:40px;height:40px;border-radius:12px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.28);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.mtit{font-size:15px;font-weight:900;color:#fff;font-family:system-ui,sans-serif}
.msub{font-size:11px;color:rgba(255,255,255,.4);font-family:system-ui,sans-serif;margin-top:2px}
.mxbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:6px 12px;color:#fff;font-size:13px;cursor:pointer;font-family:system-ui,sans-serif}
.mbody{flex:1;overflow-y:auto;padding:0 0 4px;scrollbar-width:none}
.mbody::-webkit-scrollbar{display:none}
.sec{padding:14px 18px 4px}
.sec-ttl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.4);margin-bottom:10px;font-family:system-ui,sans-serif}
/* giorni */
.drow{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.drow:last-child{border-bottom:none}
.dlbl{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);width:26px;flex-shrink:0;font-family:system-ui,sans-serif}
.dpills{display:flex;gap:4px;flex-wrap:wrap;flex:1}
.dpill{padding:4px 9px;border-radius:20px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.55);font-size:11px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;transition:all .15s;white-space:nowrap}
.dpill.sel{color:#fff;border-color:transparent}
/* colori */
.crow{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.crow:last-child{border-bottom:none}
.clbl{font-size:13px;font-weight:600;color:#fff;flex:1;font-family:system-ui,sans-serif}
.cpalette{display:flex;gap:4px;flex-wrap:wrap}
.cswatch{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .12s,border-color .12s;flex-shrink:0}
.cswatch.active{border-color:#fff;transform:scale(1.18)}
.cinput{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.15);cursor:pointer;padding:0;overflow:hidden;background:none;flex-shrink:0}
/* notifiche */
.nrow{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.nrow:last-child{border-bottom:none}
.nlbl{font-size:13px;font-weight:600;color:#fff;font-family:system-ui,sans-serif}
.nsub{font-size:10px;color:rgba(255,255,255,.4);font-family:system-ui,sans-serif;margin-top:1px}
.tog{width:42px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
.tog.on{background:#22c55e}.tog.off{background:rgba(255,255,255,.15)}
.tog::after{content:'';position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s}
.tog.on::after{left:21px}.tog.off::after{left:3px}
.tinp{height:32px;padding:0 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:13px;font-weight:600;font-family:system-ui,sans-serif}
.tinp:focus{outline:none;border-color:rgba(34,197,94,.5)}
/* footer */
.mftr{padding:12px 18px 28px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:8px}
.sbtn{width:100%;padding:14px;border-radius:13px;background:#22c55e;border:none;color:#0a0816;font-size:14px;font-weight:900;cursor:pointer;font-family:system-ui,sans-serif}
.sbtn:active{filter:brightness(.9)}
`

const _PALETTE = ['#92400e','#b45309','#d97706','#16a34a','#15803d','#1d4ed8','#2563eb','#4b5563','#374151','#7c3aed','#db2777','#e11d48']

/* ─── Card Class ──────────────────────────────────────────────────────────── */
class DifferenziataCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode:'open'})
    this._hass = null
    this._bk   = null
  }

  static getStubConfig() { return {} }
  setConfig(c) { this._cfg = c||{} }
  getCardSize() { return 5 }
  configure() { this._openImpostazioni() }

  set hass(h) {
    this._hass = h
    const bk = this._bk_()
    if (bk !== this._bk) { this._bk = bk; this._buildDOM() }
  }

  _s(id, fb='') { return this._hass?.states?.[id]?.state ?? fb }
  _svc(d, s, data) { this._hass?.callService(d, s, data) }
  _todayIdx() { return new Date().getDay()===0 ? 6 : new Date().getDay()-1 }

  _bk_() {
    if (!this._hass) return null
    return _DD_DAYS.map(d=>this._s(`input_text.frarik_differenziata_rifiuto_${d}`,'')).join('|')
      + '|' + this._s('input_boolean.frarik_differenziata_notifica_push','')
      + '|' + JSON.stringify(_ddClrs())
  }

  _todayWastes() {
    const idx = this._todayIdx()
    return _parseWastes(this._s(`input_text.frarik_differenziata_rifiuto_${_DD_DAYS[idx]}`,''))
  }

  _buildDOM() {
    const today = this._todayIdx()
    const tmrIdx = (today+1) % 7
    const now = new Date()
    const months = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
    const dateStr = `${_DD_FULL[today]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

    const todayWastes = _parseWastes(this._s(`input_text.frarik_differenziata_rifiuto_${_DD_DAYS[today]}`,''))
    const tmrWastes   = _parseWastes(this._s(`input_text.frarik_differenziata_rifiuto_${_DD_DAYS[tmrIdx]}`,''))

    /* ── Colonna sinistra: bidoni oggi ── */
    const hasPickup = todayWastes.length > 0
    const glowColor = hasPickup ? _ddClr(todayWastes[0]) : 'transparent'

    let binsHtml = ''
    if (!hasPickup) {
      binsHtml = `<div class="bins-row">${_emptyBinSvg(62)}</div>`
    } else if (todayWastes.length === 1) {
      binsHtml = `<div class="bins-row">${_binSvg(_ddClr(todayWastes[0]), 72)}</div>`
    } else if (todayWastes.length === 2) {
      binsHtml = `<div class="bins-row">${_binSvg(_ddClr(todayWastes[0]),58)}${_binSvg(_ddClr(todayWastes[1]),58)}</div>`
    } else {
      const mid = todayWastes.slice(1)
      binsHtml = `<div class="bins-row">${_binSvg(_ddClr(todayWastes[0]),48)}` +
        mid.map(id=>`${_binSvg(_ddClr(id),42)}`).join('') + `</div>`
    }

    const labelsHtml = hasPickup
      ? todayWastes.map(id=>{
          const t = _TIPI.find(x=>x.id===id)
          return `<div class="bins-lbl"><span class="bins-dot" style="background:${_ddClr(id)}"></span>${t?t.label:id}</div>`
        }).join('')
      : `<div class="bins-lbl" style="color:rgba(255,255,255,.35)">Nessun ritiro</div>`

    /* ── Colonna destra: domani ── */
    let tmrHtml
    if (tmrWastes.length === 0) {
      tmrHtml = `<div class="next-none">Nessun ritiro domani</div>`
    } else {
      tmrHtml = `<div class="next-items">${tmrWastes.map(id=>{
        const t=_TIPI.find(x=>x.id===id)
        return `<div class="next-item"><span class="bins-dot" style="background:${_ddClr(id)}"></span>${t?t.label:id}</div>`
      }).join('')}</div>`
    }

    /* ── Settimana ── */
    const weekHtml = _DD_DAYS.map((d,i)=>{
      const ws = _parseWastes(this._s(`input_text.frarik_differenziata_rifiuto_${d}`,''))
      const isToday = i===today
      const dotsHtml = ws.length
        ? ws.map(id=>`<div class="wday-dot" style="background:${_ddClr(id)}"></div>`).join('')
        : `<div class="wday-none"></div>`
      return `<div class="wday${isToday?' today':''}">
        <div class="wday-lbl">${_DD_LBL[i]}</div>
        <div class="wday-dots">${dotsHtml}</div>
      </div>`
    }).join('')

    /* ── DOM ── */
    this.shadowRoot.innerHTML = `<style>${_DD_CSS}</style>
<div class="card">
  <div class="hdr">
    <div class="hdr-ico">🗑️</div>
    <div class="hdr-txt">
      <div class="hdr-title">Raccolta Differenziata</div>
      <div class="hdr-date">${dateStr}</div>
    </div>
    <button class="hdr-btn" data-a="settings" title="Impostazioni">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  </div>
  <div class="body">
    <div class="col-l">
      <div class="col-l-glow" style="background:${glowColor}"></div>
      <div class="col-l-tag" style="color:${hasPickup?_ddClr(todayWastes[0]):'rgba(255,255,255,.3)'}">Oggi</div>
      ${binsHtml}
      <div class="bins-labels">${labelsHtml}</div>
      <div class="bins-sub">${hasPickup?'Esponi il bidone':'Nessun ritiro oggi'}</div>
    </div>
    <div class="col-r">
      <div class="next-row">
        <div class="next-tag">Domani · ${_DD_FULL[tmrIdx]}</div>
        ${tmrHtml}
      </div>
      <div class="week">${weekHtml}</div>
    </div>
  </div>
</div>`

    this.shadowRoot.querySelector('[data-a="settings"]')
      ?.addEventListener('click', ()=>this._openImpostazioni())
  }

  /* ─── Popup Impostazioni ─────────────────────────────────────────── */
  _openImpostazioni() {
    document.getElementById('__frk_diff_imp__')?.remove()
    const host = document.createElement('div')
    host.id = '__frk_diff_imp__'
    host.attachShadow({mode:'open'})
    document.body.appendChild(host)

    /* stato locale toggle: giorno → Set of waste IDs */
    const dayState = {}
    _DD_DAYS.forEach(d=>{
      dayState[d] = new Set(_parseWastes(this._s(`input_text.frarik_differenziata_rifiuto_${d}`,'')))
    })
    /* notifiche */
    const pushOn   = this._s('input_boolean.frarik_differenziata_notifica_push') === 'on'
    const alexaOn  = this._s('input_boolean.frarik_differenziata_notifica_alexa') === 'on'
    const googleOn = this._s('input_boolean.frarik_differenziata_notifica_google') === 'on'
    const notifT   = (this._s('input_datetime.frarik_differenziata_orario_notifica','00:00:00')||'00:00:00').slice(0,5)

    const renderGiorni = () => _DD_DAYS.map((d,i)=>{
      const pills = _TIPI.map(t=>{
        const sel = dayState[d].has(t.id)
        const style = sel ? `background:${_ddClr(t.id)};border-color:${_ddClr(t.id)}` : ''
        return `<button class="dpill${sel?' sel':''}" data-d="${d}" data-tid="${t.id}" style="${style}">${t.label}</button>`
      }).join('')
      return `<div class="drow"><div class="dlbl">${_DD_LBL[i]}</div><div class="dpills">${pills}</div></div>`
    }).join('')

    const renderColori = () => _TIPI.map(t=>{
      const cur = _ddClr(t.id)
      const swatches = _PALETTE.map(c=>`<div class="cswatch${c===cur?' active':''}" data-tid="${t.id}" data-c="${c}" style="background:${c}"></div>`).join('')
      return `<div class="crow">
        <div class="clbl">${t.label}</div>
        <div class="cpalette">${swatches}<input type="color" class="cinput" data-tid="${t.id}" value="${cur}" title="Colore personalizzato"></div>
      </div>`
    }).join('')

    const togHtml = (id, on, lbl, sub) =>
      `<div class="nrow"><div><div class="nlbl">${lbl}</div><div class="nsub">${sub}</div></div><button class="tog ${on?'on':'off'}" data-tid="${id}"></button></div>`

    host.shadowRoot.innerHTML = `<style>${_POPUP_CSS}</style>
<div class="ov">
  <div class="mo">
    <div class="mhdr">
      <div class="mico">🗑️</div>
      <div class="mtxt">
        <div class="mtit">Impostazioni Differenziata</div>
        <div class="msub">Giorni, colori e notifiche</div>
      </div>
      <button class="mxbtn" id="pclose">✕</button>
    </div>
    <div class="mbody">
      <div class="sec">
        <div class="sec-ttl">🗓 Giorni — scegli i rifiuti (multiplo)</div>
        <div id="giorni-list">${renderGiorni()}</div>
      </div>
      <div class="sec" style="padding-top:12px">
        <div class="sec-ttl">🎨 Colori per tipo di rifiuto</div>
        <div id="colori-list">${renderColori()}</div>
      </div>
      <div class="sec" style="padding-top:12px">
        <div class="sec-ttl">🔔 Notifiche</div>
        ${togHtml('push',  pushOn,  '📱 Push',  'Notifica app mobile')}
        ${togHtml('alexa', alexaOn, '🗣 Alexa', 'Annuncio vocale Alexa')}
        ${togHtml('google',googleOn,'🔊 Google','Annuncio vocale Google')}
        <div class="nrow">
          <div><div class="nlbl">⏰ Orario notifica</div><div class="nsub">Il giorno della raccolta</div></div>
          <input type="time" class="tinp" id="p-time" value="${notifT}">
        </div>
      </div>
    </div>
    <div class="mftr">
      <button class="sbtn" id="p-save">💾 Salva impostazioni</button>
    </div>
  </div>
</div>`

    const sr = host.shadowRoot

    /* Pill toggle (giorno/tipo) */
    sr.getElementById('giorni-list').addEventListener('click', e=>{
      const p = e.target.closest('.dpill'); if (!p) return
      const {d, tid} = p.dataset
      if (dayState[d].has(tid)) dayState[d].delete(tid)
      else dayState[d].add(tid)
      sr.getElementById('giorni-list').innerHTML = renderGiorni()
      /* ri-attach listener non serve: event delegation */
    })

    /* Swatch color */
    sr.getElementById('colori-list').addEventListener('click', e=>{
      const sw = e.target.closest('.cswatch'); if (!sw) return
      _ddSaveClr(sw.dataset.tid, sw.dataset.c)
      sr.getElementById('colori-list').innerHTML = renderColori()
      sr.getElementById('giorni-list').innerHTML = renderGiorni()
    })
    sr.getElementById('colori-list').addEventListener('input', e=>{
      const inp = e.target.closest('.cinput'); if (!inp) return
      _ddSaveClr(inp.dataset.tid, inp.value)
      sr.getElementById('giorni-list').innerHTML = renderGiorni()
    })

    /* Toggle notifiche */
    sr.querySelector('.mbody').addEventListener('click', e=>{
      const tog = e.target.closest('.tog[data-tid]'); if (!tog) return
      tog.classList.toggle('on'); tog.classList.toggle('off')
    })

    /* Chiudi */
    const destroy = ()=>host.remove()
    sr.getElementById('pclose').addEventListener('click', destroy)
    sr.querySelector('.ov').addEventListener('click', e=>{ if(e.target===sr.querySelector('.ov')) destroy() })

    /* Salva */
    sr.getElementById('p-save').addEventListener('click', ()=>{
      /* giorni → HA */
      _DD_DAYS.forEach(d=>{
        const val = [...dayState[d]].join(',')
        this._svc('input_text','set_value',{entity_id:`input_text.frarik_differenziata_rifiuto_${d}`,value:val})
      })
      /* notifiche push/alexa/google */
      const togEls = sr.querySelectorAll('.tog[data-tid]')
      togEls.forEach(t=>{
        const on = t.classList.contains('on')
        const id = t.dataset.tid
        const entity = `input_boolean.frarik_differenziata_notifica_${id}`
        this._svc('input_boolean', on?'turn_on':'turn_off', {entity_id:entity})
      })
      /* orario */
      const tv = sr.getElementById('p-time')?.value
      if (tv) this._svc('input_datetime','set_datetime',{entity_id:'input_datetime.frarik_differenziata_orario_notifica',time:tv+':00'})
      /* feedback */
      const sb = sr.getElementById('p-save')
      sb.textContent='✅ Salvato!'; sb.style.background='rgba(34,197,94,.7)'
      setTimeout(()=>{sb.textContent='💾 Salva impostazioni'; sb.style.background=''},2000)
      /* aggiorna card */
      this._bk = null
    })
  }
}

if (!customElements.get('differenziata-card'))
  customElements.define('differenziata-card', DifferenziataCard)

;(function () {
  const _CARD = {
    id:'differenziata-card', name:'Raccolta Differenziata',
    description:'Card rifiuti con multi-selezione per giorno, bidoni realistici e colori personalizzabili.',
    icon:'mdi:recycle', version:'4.0',
    frarik_pkg_check:'sensor.frarik_differenziata_versione',
    frarik_pkg_id:'frarik_differenziata',
    frarik_pkg_version:'2.0'
  }

  var _DIFF_PKG = `homeassistant:
  customize:
    package.node_anchors:
      customize: &customize
        package: 'Frarik — Raccolta Differenziata 2.0'

notify:
  - name: frarik_differenziata
    platform: group
    services:
      - service: IL_TUO_MOBILE_APP_1

input_text:
  frarik_differenziata_rifiuto_lunedi:    {name: "Differenziata — Lunedì",    icon: mdi:recycle}
  frarik_differenziata_rifiuto_martedi:   {name: "Differenziata — Martedì",   icon: mdi:recycle}
  frarik_differenziata_rifiuto_mercoledi: {name: "Differenziata — Mercoledì", icon: mdi:recycle}
  frarik_differenziata_rifiuto_giovedi:   {name: "Differenziata — Giovedì",   icon: mdi:recycle}
  frarik_differenziata_rifiuto_venerdi:   {name: "Differenziata — Venerdì",   icon: mdi:recycle}
  frarik_differenziata_rifiuto_sabato:    {name: "Differenziata — Sabato",    icon: mdi:recycle}
  frarik_differenziata_rifiuto_domenica:  {name: "Differenziata — Domenica",  icon: mdi:recycle}

input_datetime:
  frarik_differenziata_orario_notifica:
    name: "Orario Notifica Differenziata"
    has_date: false
    has_time: true

input_boolean:
  frarik_differenziata_notifica_push:   {name: "Differenziata — Push",   icon: mdi:cellphone-message}
  frarik_differenziata_notifica_google: {name: "Differenziata — Google", icon: mdi:google-assistant}
  frarik_differenziata_notifica_alexa:  {name: "Differenziata — Alexa",  icon: mdi:amazon-alexa}

template:
  - sensor:
      - name: frarik_differenziata_versione
        state: "2.0"
        unique_id: frarik_differenziata_versione
      - name: frarik_differenziata_raccolta
        unique_id: frarik_differenziata_raccolta
        state: >
          {% set wd = now().weekday() %}
          {% set giorni = ['lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica'] %}
          {{ states('input_text.frarik_differenziata_rifiuto_' + giorni[wd]) }}

automation:
  - id: frarik_differenziata_notifiche
    alias: "Frarik — Differenziata (notifiche)"
    trigger:
      - platform: time
        at: input_datetime.frarik_differenziata_orario_notifica
    condition:
      - condition: template
        value_template: "{{ states('sensor.frarik_differenziata_raccolta') not in ['','nessun rifiuto'] }}"
    action:
      - choose:
        - conditions:
          - condition: state
            entity_id: input_boolean.frarik_differenziata_notifica_push
            state: 'on'
          sequence:
          - service: notify.frarik_differenziata
            continue_on_error: true
            data:
              title: "🗑️ Raccolta differenziata"
              message: "Oggi esponi: {{ states('sensor.frarik_differenziata_raccolta') }}"
      - choose:
        - conditions:
          - condition: state
            entity_id: input_boolean.frarik_differenziata_notifica_google
            state: 'on'
          sequence:
          - service: tts.google_translate_say
            continue_on_error: true
            data:
              entity_id: IL_TUO_MEDIA_PLAYER_GOOGLE_1
              message: "Oggi devi esporre {{ states('sensor.frarik_differenziata_raccolta') }}"
      - choose:
        - conditions:
          - condition: state
            entity_id: input_boolean.frarik_differenziata_notifica_alexa
            state: 'on'
          sequence:
          - service: notify.alexa_media
            continue_on_error: true
            data:
              target: IL_TUO_MEDIA_PLAYER_ALEXA_1
              data:
                type: announce
              message: "Oggi devi esporre {{ states('sensor.frarik_differenziata_raccolta') }}"
`

  if (window.FratechStore) window.FratechStore.register(_CARD, {
    render(card) {
      return `<differenziata-card style="display:block;width:100%;height:100%"></differenziata-card>`
    },
    mount(card, hass, el) {
      const c = el.querySelector('differenziata-card')
      if (c) { try { c.setConfig(card||{}) } catch(e){} ; c.hass = hass }
    },
    update(card, hass, el) {
      const c = el.querySelector('differenziata-card')
      if (c) c.hass = hass
    },
    pkgYaml() { return _DIFF_PKG }
  })
})()
