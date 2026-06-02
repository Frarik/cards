// macchina-card.js — Centro Controllo Ford Puma

const MC = {
  soc:        'sensor.fordpass_wf02xxerk1sb53885_soc',
  battery:    'sensor.fordpass_wf02xxerk1sb53885_battery',
  range:      'sensor.fordpass_wf02xxerk1sb53885_elveh',
  charging:   'sensor.fordpass_wf02xxerk1sb53885_elvehcharging',
  tracker:    'device_tracker.fordpass_wf02xxerk1sb53885_tracker',
  doorlock:   'lock.fordpass_wf02xxerk1sb53885_doorlock',
  windows:    'sensor.fordpass_wf02xxerk1sb53885_windowposition',
  gear:       'sensor.fordpass_wf02xxerk1sb53885_gearleverposition',
  odometer:   'sensor.fordpass_wf02xxerk1sb53885_odometer',
  ignition:   'switch.fordpass_wf02xxerk1sb53885_ignition',
  cabinTemp:  'sensor.fordpass_wf02xxerk1sb53885_cabintemperature',
  wbState:    'sensor.walbox_state',
  wbTime:     'sensor.walbox_charging_time',
  wbEnergy:   'sensor.walbox_energia',
  wbPower:    'sensor.walbox_potenza',
  wbLifetime: 'sensor.walbox_lifetime_energy',
  wbInstA:    'sensor.walbox_installation_current',
  wbTemp:     'sensor.walbox_temperatura',
  wbLock:     'switch.walbox_blocca',
  wbAuth:     'switch.walbox_autenticazione',
  wbLed:      'number.walbox_led_brightness',
  wbLimit:    'number.walbox_limite_dinamico',
  wbRestart:  'button.walbox_riavvia',
  wbStart:    'button.walbox_avvia_ricarica',
  wbStop:     'button.walbox_arresta_ricarica',
}

const WB_LABELS = {
  available:'Avviabile', charging:'In Ricarica', connected:'Connessa',
  error:'Errore', locked:'Bloccato', paused:'Pausa',
  paused_by_scheduler:'Pausa Schedulata', updating_firmware:'Aggiornamento',
}
const WB_COLORS = {
  available:'#5AC8FA', charging:'#5AC8FA', connected:'#2DD4BF',
  error:'#FF6B6B', locked:'#C084FC', paused:'#FB923C',
  paused_by_scheduler:'#F59E0B', updating_firmware:'#818CF8', unknown:'#6B7280',
}
const GEAR_MAP = { p:'P', park:'P', parking:'P', r:'R', reverse:'R', n:'N', neutral:'N', d:'D', drive:'D', l:'L', low:'L' }

// Data visualization colours — hardcoded intentionally (scala dati, non UI)
function evColor(v)  { return v >= 61 ? '#5AC8FA' : v >= 30 ? '#FB923C' : '#FF6B6B' }
function evGlow(v)   { return v >= 61 ? 'rgba(90,200,250,.5)' : v >= 30 ? 'rgba(251,146,60,.5)' : 'rgba(255,107,107,.5)' }

// Lucide-style SVG helpers
const ico = {
  bolt:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  battery: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="11" x2="23" y2="13"/></svg>`,
  mapPin:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  lock:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  unlock:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
  key:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>`,
  refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  play:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  stop:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  chevron: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
}

// ─────────────────────────────────────────────────────────────────────────────

class MacchinaCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._hass     = null
    this._config   = {}
    this._buildKey = null
    this._tab      = 'stato'
    this._open     = false
  }

  static getStubConfig() { return {} }
  setConfig(c) { this._config = { ...c } }
  getCardSize()  { return 5 }

  set hass(h) { this._hass = h; this._render() }

  connectedCallback() {
    this.shadowRoot.addEventListener('click',  e => this._onClick(e))
    this.shadowRoot.addEventListener('change', e => this._onChange(e))
  }
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click',  e => this._onClick(e))
    this.shadowRoot.removeEventListener('change', e => this._onChange(e))
  }

  _g(id, def = '--') { return this._hass?.states?.[id]?.state ?? def }
  _a(id, attr, def = null) { return this._hass?.states?.[id]?.attributes?.[attr] ?? def }
  _soc()  { return Math.max(0, Math.min(100, parseFloat(this._g(MC.soc))     || 0)) }
  _bat()  { return Math.max(0, Math.min(100, parseFloat(this._g(MC.battery)) || 0)) }
  _evKm() { return Math.round(parseFloat(this._g(MC.range)) || 0) }
  _charging() { return this._g(MC.charging) === 'IN_PROGRESS' }

  // Structural build key
  _bk() {
    return [
      this._charging(), this._g(MC.wbState), this._g(MC.wbLock),
      this._g(MC.wbAuth), this._g(MC.doorlock), this._g(MC.ignition),
      this._open, this._tab,
    ].join('|')
  }

  _render() {
    if (!this._hass) return
    const bk = this._bk()
    if (bk !== this._buildKey) { this._buildKey = bk; this._buildDOM(); return }
    this._patch()
  }

  // Patch live values without DOM rebuild
  _patch() {
    const soc  = this._soc()
    const bat  = this._bat()
    const km   = this._evKm()
    const c    = evColor(soc)
    const g    = evGlow(soc)
    const rKm  = parseFloat(this._g(MC.range)) || 0

    const q  = f => this.shadowRoot.querySelector(`[data-field="${f}"]`)
    const st = (f, p, v) => { const e = q(f); if (e) e.style[p] = v }
    const tx = (f, v)    => { const e = q(f); if (e) e.textContent = v }
    const at = (f, a, v) => { const e = q(f); if (e) e.setAttribute(a, v) }

    // Hero — SOC
    if (this._charging()) {
      const r = 32, circ = +(2 * Math.PI * r).toFixed(2)
      at('arc',     'stroke-dashoffset', (circ * (1 - soc / 100)).toFixed(2))
      at('arc',     'stroke', c)
      tx('arc-pct', soc + '%'); st('arc-pct', 'color', c)
    } else {
      tx('soc-val', soc); st('soc-row', 'color', c); st('soc-row', 'textShadow', `0 0 22px ${g}`)
    }

    // Hero — range pill
    tx('rp-km', km)
    st('rp-km', 'color', this._charging() ? '#5AA0FF' : '#5AC8FA')

    // Strip — chips + bar
    tx('chip-soc', soc + '%');    st('chip-soc', 'color', c)
    tx('chip-bat', bat + '%');    st('chip-bat', 'color', evColor(bat))
    const rPctPatch = Math.min(rKm / 300 * 100, 100)
    st('rng-fill', 'width', rPctPatch + '%')
    st('rng-dot',  'left',  rPctPatch + '%')

    if (!this._open || this._tab !== 'stato') return

    // Detail — Stato tab live values
    const wbRaw = this._g(MC.wbState, 'unknown')
    const pow   = parseFloat(this._g(MC.wbPower)) || 0
    const powU  = this._a(MC.wbPower, 'unit_of_measurement') ?? 'kW'
    const enV   = (parseFloat(this._g(MC.wbEnergy)) || 0).toFixed(1)
    const enU   = this._a(MC.wbEnergy, 'unit_of_measurement') ?? 'kWh'
    const chV   = Math.round(parseFloat(this._g(MC.wbTime)) || 0)
    const chU   = this._a(MC.wbTime, 'unit_of_measurement') ?? ''
    const ranU  = this._a(MC.range, 'unit_of_measurement') ?? 'km'
    const pwPct = Math.min(pow / 5.5 * 100, 100)
    const pwCol = pow <= 1 ? '#FF6B6B' : pow <= 3 ? '#FB923C' : '#5AC8FA'

    tx('d-wb',    WB_LABELS[wbRaw] ?? 'Sconosciuto'); st('d-wb', 'color', WB_COLORS[wbRaw] ?? '#6B7280')
    tx('d-km',    km + ' ' + ranU)
    tx('d-time',  chV + ' ' + chU)
    tx('d-en',    enV + ' ' + enU)
    tx('d-pow',   pow.toFixed(1) + ' ' + powU)
    tx('d-pwv',   pow.toFixed(1) + ' ' + powU);  st('d-pwv', 'color', pwCol)
    st('d-pwfill','width', pwPct + '%')
    st('d-pwfill','background', pow <= 1 ? 'linear-gradient(90deg,#FF6B6B,#FF9466)' : pow <= 3 ? 'linear-gradient(90deg,#FB923C,#FBBF24)' : 'linear-gradient(90deg,#5AA0FF,#5AC8FA)')
    tx('d-socpct', soc + '%'); st('d-socpct', 'color', c)
    st('d-socfill','width', soc + '%')
  }

  // ── Full DOM rebuild ───────────────────────────────────────────────────────

  _buildDOM() {
    const soc    = this._soc()
    const bat    = this._bat()
    const km     = this._evKm()
    const rKm    = parseFloat(this._g(MC.range)) || 0
    const c      = evColor(soc)
    const g      = evGlow(soc)
    const charge = this._charging()
    const wbRaw  = this._g(MC.wbState, 'unknown')
    const pow    = parseFloat(this._g(MC.wbPower)) || 0
    const powU   = this._a(MC.wbPower, 'unit_of_measurement') ?? 'kW'
    const enV    = (parseFloat(this._g(MC.wbEnergy)) || 0).toFixed(1)
    const enU    = this._a(MC.wbEnergy, 'unit_of_measurement') ?? 'kWh'
    const chV    = Math.round(parseFloat(this._g(MC.wbTime)) || 0)
    const chU    = this._a(MC.wbTime, 'unit_of_measurement') ?? ''
    const ranU   = this._a(MC.range, 'unit_of_measurement') ?? 'km'
    const rPct   = Math.min(rKm / 300 * 100, 100)
    const pwPct  = Math.min(pow / 5.5 * 100, 100)
    const pwCol  = pow <= 1 ? '#FF6B6B' : pow <= 3 ? '#FB923C' : '#5AC8FA'
    const pwGrad = pow <= 1 ? 'linear-gradient(90deg,#FF6B6B,#FF9466)' : pow <= 3 ? 'linear-gradient(90deg,#FB923C,#FBBF24)' : 'linear-gradient(90deg,#5AA0FF,#5AC8FA)'
    const rCol   = charge ? '#5AA0FF' : '#5AC8FA'

    // ── Hero elements ──────────────────────────────────────────────────────

    // Badge — hardcoded overlay on image (data viz, not UI chrome)
    const badge = charge
      ? `<div class="badge badge-on"><span class="bdot"></span>${ico.bolt} In Carica</div>`
      : `<div class="badge badge-off">P&nbsp; Parcheggiata</div>`

    // Range pill
    const rangePill = `
      <div class="rp">
        <span class="rp-lbl">RANGE</span>
        <span class="rp-num" data-field="rp-km" style="color:${rCol}">${km}</span>
        <span class="rp-unit">km</span>
      </div>`

    // SOC display — arc while charging, big italic number while parked
    let socEl
    if (charge) {
      const r = 32, circ = +(2 * Math.PI * r).toFixed(2)
      const offset = +(circ * (1 - soc / 100)).toFixed(2)
      socEl = `
        <div class="soc-arc">
          <svg width="80" height="80" viewBox="0 0 80 80" style="overflow:visible">
            <circle cx="40" cy="40" r="${r}" fill="none"
              stroke="rgba(255,255,255,.09)" stroke-width="4.5"/>
            <circle cx="40" cy="40" r="${r}" fill="none"
              data-field="arc"
              stroke="${c}" stroke-width="4.5" stroke-linecap="round"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
              transform="rotate(-90 40 40)"
              style="filter:drop-shadow(0 0 5px ${g})"/>
          </svg>
          <div class="arc-inner">
            <span class="arc-pct" data-field="arc-pct" style="color:${c}">${soc}%</span>
            <span class="arc-lbl">SOC</span>
          </div>
        </div>`
    } else {
      socEl = `
        <div class="soc-num">
          <div class="soc-row" data-field="soc-row"
            style="color:${c};text-shadow:0 0 22px ${g}">
            <span class="soc-val" data-field="soc-val">${soc}</span><span class="soc-pct">%</span>
          </div>
          <span class="soc-lbl">Carica</span>
        </div>`
    }

    // ── Charge glow animation on card ──────────────────────────────────────
    const animCss = charge ? `
      @keyframes charge-pulse {
        0%,100%{ box-shadow: 0 0 0 1.5px rgba(90,160,255,.18), var(--ha-card-box-shadow, none) }
        50%    { box-shadow: 0 0 0 2.5px rgba(90,160,255,.65), 0 0 28px rgba(90,160,255,.18), var(--ha-card-box-shadow, none) }
      }
      .card { animation: charge-pulse 2.8s ease-in-out infinite; }` : ''

    // ── Detail panel ───────────────────────────────────────────────────────
    let detailHtml = ''
    if (this._open) {
      const tab = (id, lbl) =>
        `<div class="dtab${this._tab === id ? ' active' : ''}" data-action="tab" data-tab="${id}">${lbl}</div>`

      let tabContent = ''
      if (this._tab === 'stato')   tabContent = this._htmlStato(charge, wbRaw, pow, powU, enV, enU, chV, chU, ranU, km, soc, c, pwPct, pwGrad, pwCol)
      if (this._tab === 'wallbox') tabContent = this._htmlWallbox(wbRaw)
      if (this._tab === 'veicolo') tabContent = this._htmlVeicolo()

      detailHtml = `
        <div class="detail">
          <div class="tabs">
            ${tab('stato','Stato')} ${tab('wallbox','Wallbox')} ${tab('veicolo','Veicolo')}
          </div>
          ${tabContent}
        </div>`
    }

    // ── Full HTML ──────────────────────────────────────────────────────────
    this.shadowRoot.innerHTML = `
<style>
  :host { display: block; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Card shell — skill.md CSS variables ── */
  .card {
    background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
    border-radius: var(--ha-card-border-radius, 14px);
    border: 1px solid var(--divider-color, rgba(255,255,255,.08));
    font-family: var(--primary-font-family, system-ui, sans-serif);
    color: var(--primary-text-color);
    overflow: hidden;
  }

  /* ── Hero image — overlays use hardcoded dark (data viz on photo) ── */
  .hero {
    position: relative;
    width: 100%; aspect-ratio: 16 / 9;
    background: url('/local/foto-pkg/puma.jpg') center / cover no-repeat;
    cursor: pointer;
    overflow: hidden;
  }
  .vig {
    position: absolute; inset: 0; pointer-events: none;
    background:
      linear-gradient(to top,  rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 45%, transparent 65%),
      linear-gradient(to right,rgba(0,0,0,.4)  0%, transparent 40%),
      linear-gradient(to left, rgba(0,0,0,.15) 0%, transparent 35%);
  }

  /* Badge */
  .badge {
    position: absolute; top: 14px; left: 14px;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 16px; border-radius: 999px;
    font-size: 13px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;
    backdrop-filter: blur(10px);
  }
  .badge-on {
    background: linear-gradient(105deg, rgba(90,160,255,.82), rgba(90,200,250,.75));
    border: 1px solid rgba(255,255,255,.22); color: #fff;
    box-shadow: 0 2px 14px rgba(90,160,255,.4);
  }
  .badge-off {
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.12);
    color: rgba(255,255,255,.55); font-weight: 600;
  }
  .bdot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #fff; box-shadow: 0 0 6px #fff; flex-shrink: 0;
  }

  /* Range pill — top-right, isolated from chips */
  .rp {
    position: absolute; top: 14px; right: 14px;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 16px; border-radius: 12px;
    background: rgba(0,0,0,.55); border: 1px solid rgba(255,255,255,.1);
    backdrop-filter: blur(12px);
  }
  .rp-lbl {
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(255,255,255,.38);
  }
  .rp-num {
    font-size: 30px; font-weight: 800; letter-spacing: -1px; line-height: 1;
    font-family: 'Arial Narrow', Arial, sans-serif;
  }
  .rp-unit { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.4); }

  /* SOC arc — charging */
  .soc-arc {
    position: absolute; bottom: 14px; right: 14px;
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(0,0,0,.55); border: 1px solid rgba(255,255,255,.1);
    backdrop-filter: blur(12px);
  }
  .soc-arc svg { position: absolute; top: 0; left: 0; }
  .arc-inner {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
  }
  .arc-pct {
    font-family: 'Arial Narrow', Arial, sans-serif;
    font-size: 20px; font-weight: 800; font-style: italic; line-height: 1;
  }
  .arc-lbl {
    font-size: 8px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(255,255,255,.32);
  }

  /* SOC number — parked */
  .soc-num {
    position: absolute; bottom: 16px; right: 14px;
    display: flex; flex-direction: column; align-items: flex-end;
    pointer-events: none;
  }
  .soc-row {
    display: flex; align-items: flex-start; line-height: 1;
    font-family: 'Arial Narrow', Arial, sans-serif;
  }
  .soc-val  { font-size: 58px; font-weight: 800; font-style: italic; letter-spacing: -2px; }
  .soc-pct  { font-size: 20px; font-weight: 700; font-style: italic; opacity: .65; margin-top: 9px; }
  .soc-lbl  {
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(255,255,255,.38); margin-top: 3px;
  }

  /* ── Stats strip — skill.md HA variables ── */
  .strip {
    padding: 11px 16px 14px;
    background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
    border-top: 1px solid var(--divider-color, rgba(255,255,255,.08));
    cursor: pointer;
  }

  /* Row 1 */
  .strip-top {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 11px;
  }
  .chips { display: flex; gap: 8px; }
  .chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 11px 5px 8px; border-radius: 999px;
    border: 1px solid var(--divider-color, rgba(255,255,255,.1));
    font-size: 13px; font-weight: 700;
    color: var(--primary-text-color);
  }
  .chip svg { flex-shrink: 0; }
  .chev-btn {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--divider-color, rgba(255,255,255,.1));
    color: var(--secondary-text-color);
    transition: transform .25s, background .15s, color .15s;
  }
  .chev-btn.open {
    transform: rotate(180deg);
    background: rgba(90,200,250,.12);
    border-color: rgba(90,200,250,.3);
    color: #5AC8FA;
  }

  /* Row 2 — fancy autonomia bar */
  .auto-wrap { width: 100%; }
  .auto-track {
    position: relative;
    height: 10px; border-radius: 999px;
    background: var(--divider-color, rgba(255,255,255,.07));
    box-shadow: inset 0 1px 3px rgba(0,0,0,.3);
  }
  .auto-fill {
    position: absolute; top: 0; left: 0; bottom: 0;
    border-radius: 999px; min-width: 10px; overflow: hidden;
    background: linear-gradient(90deg, #1a56ff 0%, #3b8bff 50%, #5AC8FA 100%);
    box-shadow: 0 0 14px rgba(90,200,250,.45), 0 2px 6px rgba(90,160,255,.3);
    transition: width .6s cubic-bezier(.4,0,.2,1);
  }
  /* glass shine on top half */
  .auto-shine {
    position: absolute; inset: 0 0 50% 0;
    border-radius: 999px 999px 0 0;
    background: linear-gradient(to bottom, rgba(255,255,255,.22), rgba(255,255,255,.04));
    pointer-events: none;
  }
  /* moving shimmer when charging */
  @keyframes shimmer {
    0%   { transform: translateX(-180%); }
    100% { transform: translateX(300%); }
  }
  .auto-shimmer {
    position: absolute; top: 0; bottom: 0; width: 45%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
    animation: shimmer 1.8s ease-in-out infinite;
  }
  /* glow dot at fill endpoint */
  @keyframes dot-pulse {
    0%,100% { box-shadow: 0 0 0 3px rgba(90,200,250,.15), 0 0 10px rgba(90,200,250,.6); transform: translate(-50%,-50%) scale(1); }
    50%     { box-shadow: 0 0 0 5px rgba(90,200,250,.25), 0 0 18px rgba(90,200,250,.9); transform: translate(-50%,-50%) scale(1.15); }
  }
  .auto-dot {
    position: absolute; top: 50%;
    transform: translate(-50%,-50%);
    width: 16px; height: 16px; border-radius: 50%;
    background: #5AC8FA;
    box-shadow: 0 0 0 3px rgba(90,200,250,.15), 0 0 10px rgba(90,200,250,.6);
    transition: left .6s cubic-bezier(.4,0,.2,1);
    pointer-events: none;
  }

  /* ── Detail panel — skill.md HA variables ── */
  .detail {
    border-top: 1px solid var(--divider-color, rgba(255,255,255,.08));
  }
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--divider-color, rgba(255,255,255,.08));
  }
  .dtab {
    flex: 1; padding: 11px 0; text-align: center;
    font-size: 12px; font-weight: 600; letter-spacing: .4px;
    color: var(--secondary-text-color); cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color .15s, border-color .15s;
  }
  .dtab.active {
    color: var(--primary-text-color);
    border-bottom-color: var(--primary-color, #5AC8FA);
  }
  .dbody { padding: 14px; }

  /* Sections */
  .section {
    background: rgba(255,255,255,.04);
    border: 1px solid var(--divider-color, rgba(255,255,255,.07));
    border-radius: 13px; margin-bottom: 10px; overflow: hidden;
  }

  /* Power bar */
  .pw-head { display: flex; justify-content: space-between; align-items: center; padding: 11px 13px 7px; }
  .pw-lbl {
    font-size: 11px; font-weight: 600; letter-spacing: 1px;
    text-transform: uppercase; color: var(--secondary-text-color);
  }
  .pw-val { font-size: 14px; font-weight: 800; }
  .pw-track { height: 7px; margin: 0 13px 12px; border-radius: 999px; background: var(--divider-color, rgba(255,255,255,.08)); overflow: hidden; }
  .pw-fill  { height: 100%; border-radius: 999px; transition: width .3s; }

  /* Status box */
  .sbox-accent { height: 3px; }
  .sbox-title {
    padding: 9px 13px; font-size: 10px; font-weight: 700;
    letter-spacing: 1.8px; text-transform: uppercase;
    color: var(--secondary-text-color); text-align: center;
  }
  .sbox-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 0 8px 8px; }
  .scell {
    background: rgba(255,255,255,.04); border-radius: 10px;
    padding: 10px 10px; display: grid;
    grid-template-columns: 22px 1fr; grid-template-rows: auto auto;
    column-gap: 7px; align-items: center;
  }
  .scell-ico { font-size: 15px; text-align: center; grid-row: 1/3; align-self: center; }
  .scell-lbl { font-size: 10px; color: var(--secondary-text-color); letter-spacing: .3px; }
  .scell-val { font-size: 13px; font-weight: 700; }

  /* SOC bar */
  .socbar { padding: 10px 13px 12px; }
  .socbar-h { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 7px; }
  .socbar-l { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--secondary-text-color); }
  .socbar-n { font-size: 16px; font-weight: 800; }
  .socbar-track { height: 7px; border-radius: 999px; background: var(--divider-color, rgba(255,255,255,.08)); overflow: hidden; }
  .socbar-fill  { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#5AA0FF,#5AC8FA); transition: width .5s; }

  /* Wallbox buttons */
  .wb-btns { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .wb-btn {
    padding: 13px 6px; border-radius: 13px; text-align: center;
    cursor: pointer; border: 1px solid;
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    transition: opacity .15s, transform .1s;
  }
  .wb-btn:active { transform: scale(.96); }
  .wb-btn-ico { font-size: 20px; }
  .wb-btn-lbl { font-size: 11px; font-weight: 700; letter-spacing: .3px; }

  /* Settings rows */
  .srow {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid var(--divider-color, rgba(255,255,255,.06));
  }
  .srow:last-child { border-bottom: none; }
  .srow-l { font-size: 13px; color: var(--primary-text-color); }
  .srow-v { font-size: 13px; font-weight: 700; color: var(--primary-text-color); }

  /* Toggle */
  .tog { position: relative; display: inline-block; width: 40px; height: 23px; cursor: pointer; }
  .tog input { opacity: 0; width: 0; height: 0; }
  .tog-t { position: absolute; inset: 0; background: var(--divider-color, rgba(255,255,255,.15)); border-radius: 12px; transition: background .2s; }
  .tog input:checked + .tog-t { background: var(--primary-color, #5AC8FA); }
  .tog-k { position: absolute; width: 17px; height: 17px; background: #fff; border-radius: 50%; top: 3px; left: 3px; transition: transform .2s; pointer-events: none; }
  .tog input:checked ~ .tog-k { transform: translateX(17px); }

  /* Restart button */
  .restart-btn {
    width: 100%; margin-top: 8px; padding: 10px; border-radius: 12px; cursor: pointer;
    font-size: 13px; font-weight: 700; text-align: center;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    background: rgba(255,255,255,.04);
    border: 1px solid var(--divider-color, rgba(255,255,255,.1));
    color: var(--secondary-text-color); transition: opacity .15s;
  }
  .restart-btn:hover { opacity: .75; }

  /* Veicolo */
  .act-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .act-btn {
    padding: 11px 8px; border-radius: 12px; text-align: center;
    cursor: pointer; border: 1px solid;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 13px; font-weight: 700;
    transition: opacity .15s, transform .1s;
  }
  .act-btn:active { transform: scale(.96); }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 10px; }
  .itile {
    background: rgba(255,255,255,.04); border-radius: 12px;
    padding: 11px 12px; border: 1px solid var(--divider-color, rgba(255,255,255,.07));
  }
  .itile-l { font-size: 10px; color: var(--secondary-text-color); margin-bottom: 4px; letter-spacing: .3px; }
  .itile-v { font-size: 14px; font-weight: 700; color: var(--primary-text-color); }
  .map-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 11px; border-radius: 12px; cursor: pointer;
    background: rgba(90,200,250,.1); border: 1px solid rgba(90,200,250,.25);
    color: #5AC8FA; font-size: 13px; font-weight: 700; text-decoration: none;
    transition: opacity .15s;
  }
  .map-btn:hover { opacity: .8; }

  ${animCss}
</style>

<div class="card">

  <!-- HERO: ONLY 3 elements, zero overlaps -->
  <div class="hero" data-action="toggle">
    <div class="vig"></div>
    ${badge}
    ${rangePill}
    ${socEl}
  </div>

  <!-- STATS STRIP -->
  <div class="strip" data-action="toggle">

    <!-- Row 1: chips + chevron -->
    <div class="strip-top">
      <div class="chips">
        <div class="chip">
          <span style="color:${evColor(soc)}">${ico.bolt}</span>
          <span data-field="chip-soc" style="color:${c}">${soc}%</span>
        </div>
        <div class="chip">
          <span style="color:${evColor(bat)}">${ico.battery}</span>
          <span data-field="chip-bat" style="color:${evColor(bat)}">${bat}%</span>
        </div>
      </div>
      <div class="chev-btn${this._open ? ' open' : ''}">${ico.chevron}</div>
    </div>

    <!-- Row 2: autonomia bar — niente testo, solo la barra -->
    <div class="auto-wrap">
      <div class="auto-track">
        <div class="auto-fill" data-field="rng-fill" style="width:${rPct}%">
          <div class="auto-shine"></div>
          ${charge ? '<div class="auto-shimmer"></div>' : ''}
        </div>
        <div class="auto-dot" data-field="rng-dot" style="left:${rPct}%;${charge ? 'animation:dot-pulse 1.6s ease-in-out infinite' : ''}"></div>
      </div>
    </div>

  </div>

  <!-- DETAIL PANEL -->
  ${detailHtml}

</div>`
  }

  // ── Stato tab ──────────────────────────────────────────────────────────────

  _htmlStato(charge, wbRaw, pow, powU, enV, enU, chV, chU, ranU, km, soc, c, pwPct, pwGrad, pwCol) {
    const accent = charge
      ? 'linear-gradient(90deg,rgba(90,160,255,.8),rgba(90,200,250,.6))'
      : 'linear-gradient(90deg,rgba(90,160,255,.45),rgba(90,200,250,.28))'
    const title  = charge ? '⚡ In Ricarica' : '🚗 Stato Veicolo'
    const wbCol  = WB_COLORS[wbRaw] ?? '#6B7280'
    const wbLbl  = WB_LABELS[wbRaw] ?? 'Sconosciuto'

    const cell = (ico, lbl, val, vc, f) => `
      <div class="scell">
        <span class="scell-ico">${ico}</span>
        <span class="scell-lbl">${lbl}</span>
        <span class="scell-val" data-field="${f}" style="color:${vc}">${val}</span>
      </div>`

    const common = `
      ${cell('🔌','Wallbox',      wbLbl,          wbCol,     'd-wb')}
      ${cell('🛣️','Autonomia',   km+' '+ranU,     '#5AC8FA', 'd-km')}`

    const extra = charge ? `
      ${cell('⏱️','Tempo ricarica',  chV+' '+chU,  'var(--primary-text-color)', 'd-time')}
      ${cell('⚡','Energia caricata', enV+' '+enU,  '#FB923C', 'd-en')}
      ${cell('🔋','Potenza',          pow.toFixed(1)+' '+powU, '#5AC8FA', 'd-pow')}` : `
      ${cell('⏱️','Ultima ricarica',  chV+' '+chU,  'var(--primary-text-color)', 'd-time')}
      ${cell('⚡','Energia sessione',  enV+' '+enU,  '#FB923C', 'd-en')}`

    return `<div class="dbody">

      <!-- Potenza Wallbox -->
      <div class="section">
        <div class="pw-head">
          <span class="pw-lbl">Potenza Wallbox</span>
          <span class="pw-val" data-field="d-pwv" style="color:${pwCol}">${pow.toFixed(1)} ${powU}</span>
        </div>
        <div class="pw-track">
          <div class="pw-fill" data-field="d-pwfill" style="width:${pwPct}%;background:${pwGrad}"></div>
        </div>
      </div>

      <!-- Status cells -->
      <div class="section">
        <div class="sbox-accent" style="background:${accent}"></div>
        <div class="sbox-title">${title}</div>
        <div class="sbox-grid">${common}${extra}</div>
        <div class="socbar">
          <div class="socbar-h">
            <span class="socbar-l">Carica Batteria</span>
            <span class="socbar-n" data-field="d-socpct" style="color:${c}">${soc}%</span>
          </div>
          <div class="socbar-track">
            <div class="socbar-fill" data-field="d-socfill" style="width:${soc}%"></div>
          </div>
        </div>
      </div>

    </div>`
  }

  // ── Wallbox tab ────────────────────────────────────────────────────────────

  _htmlWallbox(wbRaw) {
    const locked  = this._g(MC.wbLock) === 'on'
    const authOn  = this._g(MC.wbAuth) === 'on'
    const isC     = wbRaw === 'charging'

    const startSt = `background:rgba(90,200,250,${isC?'.14':'.06'});border-color:rgba(90,200,250,.28);color:#5AC8FA`
    const stopSt  = `background:rgba(255,107,107,.1);border-color:rgba(255,107,107,.28);color:#FF6B6B;${isC?'':'opacity:.35'}`
    const lockSt  = `background:rgba(192,132,252,${locked?'.14':'.07'});border-color:rgba(192,132,252,.28);color:#C084FC`

    return `<div class="dbody">
      <div class="wb-btns">
        <div class="wb-btn" style="${startSt}" data-action="wb-start">
          <span class="wb-btn-ico" style="color:#5AC8FA">${ico.play}</span>
          <span class="wb-btn-lbl">${isC?'In corso':'Avvia'}</span>
        </div>
        <div class="wb-btn" style="${stopSt}" data-action="wb-stop">
          <span class="wb-btn-ico" style="color:#FF6B6B">${ico.stop}</span>
          <span class="wb-btn-lbl">${isC?'Arresta':'Inattivo'}</span>
        </div>
        <div class="wb-btn" style="${lockSt}" data-action="wb-lock">
          <span style="color:#C084FC">${locked ? ico.lock : ico.unlock}</span>
          <span class="wb-btn-lbl">${locked?'Bloccata':'Sbloccata'}</span>
        </div>
      </div>
      <div class="section" style="padding:0 13px">
        <div class="srow">
          <span class="srow-l">Richiedi Autenticazione</span>
          <label class="tog">
            <input type="checkbox" ${authOn?'checked':''} data-action="wb-auth"/>
            <div class="tog-t"></div><div class="tog-k"></div>
          </label>
        </div>
        <div class="srow"><span class="srow-l">Luminosità LED</span><span class="srow-v">${this._g(MC.wbLed,'--')}</span></div>
        <div class="srow"><span class="srow-l">Limite Dinamico</span><span class="srow-v">${this._g(MC.wbLimit,'--')} A</span></div>
        <div class="srow"><span class="srow-l">Temperatura Wallbox</span><span class="srow-v">${this._g(MC.wbTemp,'--')} °C</span></div>
        <div class="srow"><span class="srow-l">Energia Totale</span><span class="srow-v">${this._g(MC.wbLifetime,'--')} kWh</span></div>
        <div class="srow"><span class="srow-l">Corrente Installazione</span><span class="srow-v">${this._g(MC.wbInstA,'--')} A</span></div>
      </div>
      <div class="restart-btn" data-action="wb-restart">
        <span style="color:var(--secondary-text-color)">${ico.refresh}</span>Riavvia Wallbox
      </div>
    </div>`
  }

  // ── Veicolo tab ────────────────────────────────────────────────────────────

  _htmlVeicolo() {
    const locked  = this._g(MC.doorlock,'unknown') === 'locked'
    const ignOn   = this._g(MC.ignition) === 'on'
    const winRaw  = this._g(MC.windows,'unknown')
    const winLbl  = winRaw === 'closed' ? 'Chiusi' : winRaw === 'open' ? 'Aperti' : winRaw
    const gearR   = this._g(MC.gear,'--').toLowerCase()
    const gearLbl = GEAR_MAP[gearR] ? `(${GEAR_MAP[gearR]}) ${this._g(MC.gear,'--')}` : this._g(MC.gear,'--')
    const odo     = this._g(MC.odometer,'--')
    const cabin   = this._g(MC.cabinTemp,'--')
    const lat     = this._a(MC.tracker,'latitude')
    const lon     = this._a(MC.tracker,'longitude')
    const mapsUrl = lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : null

    const lkBg  = locked ? 'rgba(90,200,250,.12)' : 'rgba(251,146,60,.1)'
    const lkBd  = locked ? 'rgba(90,200,250,.28)'  : 'rgba(251,146,60,.28)'
    const lkCol = locked ? '#5AC8FA' : '#FB923C'
    const igBg  = ignOn  ? 'rgba(255,107,107,.12)' : 'rgba(255,255,255,.04)'
    const igBd  = ignOn  ? 'rgba(255,107,107,.28)'  : 'var(--divider-color,rgba(255,255,255,.1))'
    const igCol = ignOn  ? '#FF6B6B' : 'var(--secondary-text-color)'

    return `<div class="dbody">
      <div class="act-row">
        <div class="act-btn" style="background:${lkBg};border-color:${lkBd};color:${lkCol}" data-action="toggle-lock">
          <span>${locked ? ico.lock : ico.unlock}</span>
          ${locked?'Bloccata':'Sblocca'}
        </div>
        <div class="act-btn" style="background:${igBg};border-color:${igBd};color:${igCol}" data-action="toggle-ignition">
          <span>${ico.key}</span>
          ${ignOn?'Motore ON':'Spenta'}
        </div>
      </div>
      <div class="info-grid">
        <div class="itile"><div class="itile-l">Finestrini</div><div class="itile-v">${winLbl}</div></div>
        <div class="itile"><div class="itile-l">Cambio</div><div class="itile-v">${gearLbl}</div></div>
        <div class="itile"><div class="itile-l">Chilometraggio</div><div class="itile-v">${odo} km</div></div>
        <div class="itile"><div class="itile-l">Abitacolo</div><div class="itile-v">${cabin} °C</div></div>
      </div>
      ${mapsUrl
        ? `<a href="${mapsUrl}" target="_blank" class="map-btn"><span>${ico.mapPin}</span>Apri posizione in Maps</a>`
        : `<div class="map-btn" style="opacity:.38;cursor:default"><span>${ico.mapPin}</span>Posizione non disponibile</div>`}
    </div>`
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  _onClick(e) {
    const el = e.target.closest('[data-action]')
    if (!el) return
    const a = el.dataset.action

    if (a === 'toggle') { this._open = !this._open; this._buildKey = null; this._render(); return }
    if (a === 'tab')    { this._tab = el.dataset.tab; this._buildKey = null; this._render(); return }

    if (a === 'wb-start')   { this._hass.callService('button','press',{entity_id:MC.wbStart}); return }
    if (a === 'wb-stop')    { this._hass.callService('button','press',{entity_id:MC.wbStop});  return }
    if (a === 'wb-restart') { this._hass.callService('button','press',{entity_id:MC.wbRestart}); return }
    if (a === 'wb-lock') {
      const on = this._g(MC.wbLock) === 'on'
      this._hass.callService('switch', on?'turn_off':'turn_on', {entity_id:MC.wbLock})
      return
    }
    if (a === 'toggle-lock') {
      const locked = this._g(MC.doorlock) === 'locked'
      this._hass.callService('lock', locked?'unlock':'lock', {entity_id:MC.doorlock})
      return
    }
    if (a === 'toggle-ignition') {
      const on = this._g(MC.ignition) === 'on'
      this._hass.callService('switch', on?'turn_off':'turn_on', {entity_id:MC.ignition})
      return
    }
  }

  _onChange(e) {
    const el = e.target
    if (el?.dataset?.action === 'wb-auth') {
      this._hass.callService('switch', el.checked?'turn_on':'turn_off', {entity_id:MC.wbAuth})
    }
  }
}

customElements.define('macchina-card', MacchinaCard)

window.customCards = window.customCards || []
window.customCards.push({
  type:        'macchina-card',
  name:        'Centro Controllo Ford Puma',
  description: 'Controllo completo Ford Puma con Wallbox.',
})
