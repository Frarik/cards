/**
 * bolletta-card-fratech.js v2.5.0
 * Octopus Energy Monitor V3 — pkg oct_24
 * Architettura identica ad antizanzare-card
 *
 * v2.5.0:
 *  - Mese: rimosso "Costo oggi" duplicato (ora: Consumo mese / Consumo oggi / Consumo ora),
 *    box allineati (tutti con sottoetichetta).
 *  - Anno: totale € e kWh calcolati LIVE col mese corrente, così salgono in sync con oggi.
 *    Storico "anno corrente" usa gli stessi totali live.
 *  - (pkg) Aggiunta automazione reset settimana ogni Lunedì 00:00:30.
 *
 * v2.4.0:
 *  - Pagina Test: riepilogo dettagliato (energia, fissi, imponibile, IVA, canone, bonus, TOTALE),
 *    ogni riga torna fino al totale. Rimossa la riga "Formula" errata/fuorviante.
 *  - Corretta etichetta prezzo €/kWh: è IVA ESCLUSA (era scritto "IVA incl.").
 *
 * v2.3.0:
 *  - Consumo istantaneo (sensor.consumo_istantaneo) con sigla "W" e colore dinamico
 *    in base alla potenza impegnata (verde/giallo/arancio/rosso).
 *  - Sottotitolo header semplificato in "Octopus".
 *
 * v2.2.0:
 *  - "Consumo ora" ora mostra sensor.consumo_istantaneo.
 *  - Tutti i parametri sono campi di testo editabili (scrivi il valore e premi Invio/esci),
 *    al posto dei pulsanti +/−. Rebuild sospeso mentre un campo è in editing (non perde il focus).
 *
 * v2.1.0 fix:
 *  - Refresh: la build key ora include TUTTE le entità mostrate
 *    (prima modificando prezzi/IVA/soglia/autoconsumo la card non si aggiornava).
 *  - Risparmio FV calcolato sull'autoconsumo reale (FV+batteria), non sulla produzione totale.
 *  - "Mensile rete" nello storico ora mostra sempre i kWh di rete (non il totale casa).
 *  - Formula simulatore: IVA reale sui fissi (non più *1.1 fisso).
 *  - Grafico storico etichettato correttamente (kWh).
 */

const EB = {
  /* Sensori calcolati */
  prezzoVar:     'sensor.oct_24_prezzo_unico_variabile',
  bolMese:       'sensor.oct_24_bolletta_mese_corrente',
  prevMese:      'sensor.oct_24_previsione_costo_mese',
  costoGiorno:   'sensor.oct_24_costo_giornaliero',
  testBolletta:  'sensor.oct_24_test_bolletta',
  mediaKwh:      'sensor.oct_24_media_settimanale_kwh',
  mediaEur:      'sensor.oct_24_media_settimanale_eur',
  totaleFissi:   'sensor.oct_24_totale_fissi_mese',
  totAnnoKwh:    'sensor.totale_anno_kwh',
  totAnnoEur:    'sensor.totale_anno_euro',
  /* Utility meter */
  kwhGiorno:     'sensor.oct_24_consumo_giornaliero',
  kwhMese:       'sensor.oct_24_consumo_mensile',
  kwhAnno:       'sensor.oct_24_consumo_annuale',
  totCasaReale:  'sensor.oct_24_consumo_totale_casa_reale',
  /* Parametri tariffari */
  energiaBase:   'input_number.oct_24_prezzo_energia_base',
  dispacciamento:'input_number.oct_24_prezzo_dispacciamento',
  mercatoCap:    'input_number.oct_24_prezzo_mercato_capacita',
  fattorePerdite:'input_number.oct_24_fattore_perdite',
  traspEnergia:  'input_number.oct_24_prezzo_trasporto_energia',
  oneriSistema:  'input_number.oct_24_prezzo_oneri_sistema',
  uc3uc6:        'input_number.oct_24_prezzo_uc3_uc6',
  accise:        'input_number.oct_24_prezzo_accise',
  commVendita:   'input_number.oct_24_quota_comm_vendita',
  traspFisso:    'input_number.oct_24_quota_trasporto_fisso',
  potenzaImp:    'input_number.oct_24_potenza_impegnata',
  quotaPotenza:  'input_number.oct_24_prezzo_quota_potenza',
  iva:           'input_number.oct_24_iva_perc',
  canoneRai:     'input_number.oct_24_canone_rai',
  bonus:         'input_number.oct_24_bonus_bolletta',
  testKwh:       'input_number.oct_24_test_kwh',
  sogliaPower:   'input_number.oct_24_soglia_power',
  /* Input boolean */
  includeCanone: 'input_boolean.oct_24_include_canone',
  haFv:          'input_boolean.oct_24_ha_fotovoltaico',
  haBatt:        'input_boolean.oct_24_ha_batteria',
  notifyDaily:   'input_boolean.oct_24_notify_daily',
  notifyMonthly: 'input_boolean.oct_24_notify_monthly',
  notifyYearly:  'input_boolean.oct_24_notify_yearly',
  notifyOverload:'input_boolean.oct_24_notify_overload',
  notifyPush:    'input_boolean.oct_24_notify_push_active',
  notifyAlexa:   'input_boolean.oct_24_notify_alexa_active',
  /* Storico settimana */
  lunKwh:'input_number.oct_24_lunedi_kwh',   lunEur:'input_number.oct_24_lunedi_eur',
  marKwh:'input_number.oct_24_martedi_kwh',  marEur:'input_number.oct_24_martedi_eur',
  merKwh:'input_number.oct_24_mercoledi_kwh',merEur:'input_number.oct_24_mercoledi_eur',
  gioKwh:'input_number.oct_24_giovedi_kwh',  gioEur:'input_number.oct_24_giovedi_eur',
  venKwh:'input_number.oct_24_venerdi_kwh',  venEur:'input_number.oct_24_venerdi_eur',
  sabKwh:'input_number.oct_24_sabato_kwh',   sabEur:'input_number.oct_24_sabato_eur',
  domKwh:'input_number.oct_24_domenica_kwh', domEur:'input_number.oct_24_domenica_eur',
  /* Archivio mensile anno corrente */
  a01:'sensor.archivio_gennaio_euro',  a02:'sensor.archivio_febbraio_euro',
  a03:'sensor.archivio_marzo_euro',    a04:'sensor.archivio_aprile_euro',
  a05:'sensor.archivio_maggio_euro',   a06:'sensor.archivio_giugno_euro',
  a07:'sensor.archivio_luglio_euro',   a08:'sensor.archivio_agosto_euro',
  a09:'sensor.archivio_settembre_euro',a10:'sensor.archivio_ottobre_euro',
  a11:'sensor.archivio_novembre_euro', a12:'sensor.archivio_dicembre_euro',
  /* Anno precedente */
  p01:'input_number.storico_prec_gennaio_eur',  p02:'input_number.storico_prec_febbraio_eur',
  p03:'input_number.storico_prec_marzo_eur',    p04:'input_number.storico_prec_aprile_eur',
  p05:'input_number.storico_prec_maggio_eur',   p06:'input_number.storico_prec_giugno_eur',
  p07:'input_number.storico_prec_luglio_eur',   p08:'input_number.storico_prec_agosto_eur',
  p09:'input_number.storico_prec_settembre_eur',p10:'input_number.storico_prec_ottobre_eur',
  p11:'input_number.storico_prec_novembre_eur', p12:'input_number.storico_prec_dicembre_eur',
  /* Sensori extra */
  octopus:         'sensor.octopus',
  fvMese:          'sensor.inverter_r5s1152j2118e25819_energy_month',
  consumoIst:      'sensor.consumo_solo_positivo',
  consumoReal:     'sensor.consumo_istantaneo',
  prodIst:         'sensor.inverter_r5s1152j2118e25819_peak_power',
  totCasaReale:    'sensor.oct_24_consumo_totale_casa_reale',
  /* Input datetime notifiche */
  notifInizio:     'input_datetime.oct_24_notifica_inizio',
  notifFine:       'input_datetime.oct_24_notifica_fine',
  pushInizio:      'input_datetime.oct_24_push_inizio',
  pushFine:        'input_datetime.oct_24_push_fine',
  /* Ritardo soglia */
  ritardoSoglia:   'input_number.oct_24_ritardo_soglia',
  /* Autoconsumo */
  autoFv:          'input_number.oct_24_autoconsumo_fv',
  autoBatt:        'input_number.oct_24_autoconsumo_batt',
  /* Script */
  resetContratto: 'script.oct_24_reset_valori_contratto',
  resetSettimana: 'script.oct_24_reset_settimana',
}

const MESI  = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
const GIORNI = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
const AK = ['a01','a02','a03','a04','a05','a06','a07','a08','a09','a10','a11','a12']
const PK = ['p01','p02','p03','p04','p05','p06','p07','p08','p09','p10','p11','p12']
const SETTK_KWH = ['lunKwh','marKwh','merKwh','gioKwh','venKwh','sabKwh','domKwh']
const SETTK_EUR = ['lunEur','marEur','merEur','gioEur','venEur','sabEur','domEur']

const I_B = {
  gear: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
}

const CSS_B = `
:host { display:block; }
* { box-sizing:border-box; margin:0; padding:0; }
button, input, label { font-family:inherit; }
.card {
  background:var(--ha-card-background,#111827);
  border-radius:var(--ha-card-border-radius,16px);
  border:1px solid rgba(250,204,21,.2);
  overflow:hidden;
  font-family:var(--primary-font-family,system-ui,sans-serif);
  box-shadow:0 8px 40px rgba(0,0,0,.35);
  transition:border-color .3s,box-shadow .3s;
}
.card.ok  { border-color:rgba(74,222,128,.35); box-shadow:0 8px 40px rgba(74,222,128,.08); }
.card.med { border-color:rgba(250,204,21,.4);  box-shadow:0 8px 40px rgba(250,204,21,.1); }
.card.hi  { border-color:rgba(249,115,22,.4);  box-shadow:0 8px 40px rgba(249,115,22,.12); }
.hdr { display:flex;align-items:center;gap:10px;padding:14px 14px 12px;border-bottom:1px solid rgba(255,255,255,.06); }
.hico { width:40px;height:40px;border-radius:11px;flex-shrink:0;background:rgba(250,204,21,.1);border:1px solid rgba(250,204,21,.25);display:flex;align-items:center;justify-content:center;font-size:20px; }
.htxt { flex:1;min-width:0; }
.htitle { font-size:15px;font-weight:700;color:var(--primary-text-color,#f1f5f9); }
.hsub { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);margin-top:2px; }
.hright { display:flex;align-items:center;gap:7px;flex-shrink:0; }
.ibtn { width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--secondary-text-color,#64748b);transition:background .15s; }
.ibtn:hover { background:rgba(255,255,255,.1); }
.badge { display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.05em;border:1px solid currentColor; }
/* TABS */
.tabs { display:flex;gap:2px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.06); }
.tab { flex:1;padding:6px 4px;border-radius:8px;border:1px solid transparent;font-size:10px;font-weight:700;cursor:pointer;background:rgba(255,255,255,.04);color:var(--secondary-text-color,#64748b);transition:all .15s;letter-spacing:.03em;text-transform:uppercase; }
.tab.on { background:rgba(250,204,21,.15);color:#facc15;border-color:rgba(250,204,21,.3); }
.tab:hover:not(.on) { background:rgba(255,255,255,.08);color:#fff; }
/* PANNELLO */
.pnl { padding:12px 14px; }
.hero { display:flex;align-items:baseline;gap:4px;margin-bottom:4px; }
.hval { font-size:44px;font-weight:900;letter-spacing:-2px;line-height:1;text-shadow:0 0 30px currentColor; }
.heur { font-size:18px;font-weight:400;opacity:.4;margin-right:2px; }
.hmeta { font-size:11px;color:var(--secondary-text-color,#64748b);margin-bottom:12px; }
.hmeta b { color:var(--primary-text-color,#f1f5f9); }
.srow { display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px; }
.sbox { background:rgba(255,255,255,.04);border-radius:10px;padding:10px 8px;text-align:center; }
.slbl { font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--secondary-text-color,#64748b);margin-bottom:4px; }
.sval { font-size:18px;font-weight:800;line-height:1;letter-spacing:-.5px; }
.ssub { font-size:9px;color:var(--secondary-text-color,#64748b);margin-top:2px; }
.prev-row { display:flex;gap:8px;margin-bottom:12px; }
.prev-box { flex:1;background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:10px;padding:10px;text-align:center; }
.prev-lbl { font-size:8px;font-weight:700;text-transform:uppercase;color:rgba(165,180,252,.7);margin-bottom:4px; }
.prev-val { font-size:20px;font-weight:800;color:#a5b4fc; }
.prev-sub { font-size:9px;color:rgba(165,180,252,.5);margin-top:2px; }
/* BARRE */
.chart-lbl { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--secondary-text-color,#64748b);margin-bottom:6px; }
.bars { display:flex;align-items:flex-end;gap:3px;height:70px;margin-bottom:4px; }
.bcol { flex:1;display:flex;flex-direction:column;align-items:center;gap:2px; }
.bval { font-size:7px;font-weight:700;color:var(--primary-text-color,#f1f5f9);white-space:nowrap; }
.btrack { flex:1;width:100%;border-radius:3px;background:rgba(255,255,255,.06);position:relative;overflow:hidden;min-height:3px; }
.bfill { position:absolute;bottom:0;left:0;right:0;border-radius:3px;transition:height .5s; }
.blbl { font-size:7px;color:var(--secondary-text-color,#64748b);white-space:nowrap; }
.leg { display:flex;gap:10px;margin-bottom:10px;font-size:9px;color:var(--secondary-text-color,#64748b); }
.leg-dot { width:8px;height:8px;border-radius:2px;display:inline-block;margin-right:3px;vertical-align:middle; }
/* SIMULATORE */
.sim-box { background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px; }
.sim-title { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--secondary-text-color,#64748b);margin-bottom:10px; }
.sim-result { text-align:center;margin-bottom:12px; }
.sim-val { font-size:36px;font-weight:900;color:#a5b4fc;letter-spacing:-1px; }
.sim-sub { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:2px; }
.sim-row { display:flex;align-items:center;justify-content:space-between;margin-bottom:8px; }
.sim-lbl { font-size:11px;color:var(--primary-text-color,#f1f5f9);font-weight:600; }
.sim-lbl2 { font-size:10px;color:var(--secondary-text-color,#64748b); }
.nctrl { display:flex;align-items:center;gap:5px; }
.adj { width:28px;height:28px;border-radius:8px;border:none;background:rgba(255,255,255,.08);color:var(--primary-text-color,#f1f5f9);font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0; }
.adj:hover { background:rgba(255,255,255,.18); }
.adj-val { font-size:13px;font-weight:700;color:#a5b4fc;min-width:54px;text-align:center; }
/* SETTINGS */
.settings { display:none;border-top:1px solid rgba(255,255,255,.06); }
.settings.open { display:block; }
.set-sec { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--secondary-text-color,#64748b);padding:8px 14px 4px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02); }
.set-row { display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.04); }
.set-row:last-child { border-bottom:none; }
.set-lbl { font-size:12px;font-weight:600;color:var(--primary-text-color,#f1f5f9); }
.set-sub { font-size:10px;color:var(--secondary-text-color,#64748b);margin-top:1px; }
.set-val { font-size:13px;font-weight:700;color:#facc15;min-width:60px;text-align:right; }
.num-ctrl { display:flex;align-items:center;gap:4px; }
.adj-sm { width:26px;height:26px;border-radius:7px;border:none;background:rgba(255,255,255,.08);color:var(--primary-text-color,#f1f5f9);font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s; }
.adj-sm:hover { background:rgba(255,255,255,.15); }
/* CAMPI EDITABILI (scrivi direttamente il valore) */
.num-edit { display:flex;align-items:center;gap:6px; }
.num-in { width:96px;height:30px;padding:0 9px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#facc15;font-size:13px;font-weight:700;text-align:right;font-family:inherit;-moz-appearance:textfield; }
.num-in::-webkit-outer-spin-button,.num-in::-webkit-inner-spin-button { -webkit-appearance:none;margin:0; }
.num-in:focus { outline:none;border-color:rgba(250,204,21,.55);background:rgba(250,204,21,.08); }
.num-in.acc { color:#a5b4fc; }
.num-in.acc:focus { border-color:rgba(165,180,252,.55);background:rgba(99,102,241,.1); }
.num-unit { font-size:10px;font-weight:600;color:var(--secondary-text-color,#64748b);min-width:34px; }
/* RIEPILOGO SIMULATORE (ogni riga torna fino al totale) */
.sim-break { margin-top:10px;background:rgba(255,255,255,.03);border-radius:10px;padding:4px 12px; }
.sbk { display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--secondary-text-color,#64748b);padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04); }
.sbk span:last-child { color:var(--primary-text-color,#f1f5f9);font-weight:700;white-space:nowrap; }
.sbk-sub { border-top:1px solid rgba(255,255,255,.1); }
.sbk-sub span { font-weight:700; }
.sbk-tot { border-bottom:none;border-top:1px solid rgba(255,255,255,.12); }
.sbk-tot span:first-child { color:var(--primary-text-color,#f1f5f9);font-weight:800;font-size:12px; }
.sbk-tot span:last-child { font-size:15px;color:#a5b4fc;font-weight:900; }
.toggle { width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0; }
.toggle.on  { background:#facc15; }
.toggle.off { background:rgba(255,255,255,.15); }
.toggle::after { content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s; }
.toggle.on::after  { left:21px; }
.toggle.off::after { left:3px; }
.set-rst { margin:8px 14px 12px;padding:8px;width:calc(100% - 28px);border-radius:9px;border:1px solid rgba(250,204,21,.3);background:rgba(250,204,21,.08);color:#facc15;font-size:11px;font-weight:700;cursor:pointer;transition:background .15s; }
.set-rst:hover { background:rgba(250,204,21,.18); }
`

function f2(v) { return (parseFloat(v)||0).toFixed(2) }
function f4(v) { return (parseFloat(v)||0).toFixed(4) }
function f6(v) { return (parseFloat(v)||0).toFixed(6) }
function fi(v) { return Math.round(parseFloat(v)||0) }
function f1(v) { return (parseFloat(v)||0).toFixed(1) }

class BollettaCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._hass         = null
    this._config       = {}
    this._tab          = 'mese'
    this._storicoAnno = 'curr'  // 'curr' o 'prev'
    this._settingsOpen = false
    this._buildKey     = null
    this._onClick      = this._handleClick.bind(this)
    this._onChange     = this._onChangeInput.bind(this)
  }

  static getStubConfig() { return {} }
  setConfig(c) { this._config = c || {} }
  getCardSize() { return 8 }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', this._onClick)
    this.shadowRoot.addEventListener('change', this._onChange)
  }
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._onClick)
    this.shadowRoot.removeEventListener('change', this._onChange)
  }

  _onChangeInput(e) {
    if (!this._hass) return
    const t = e.target
    /* Orari (input type=time) */
    const timeEl = t.closest && t.closest('[data-time-entity]')
    if (timeEl && timeEl.value) {
      this._svc('input_datetime', 'set_datetime', { entity_id: timeEl.dataset.timeEntity, time: timeEl.value + ':00' })
      return
    }
    /* Campi numerici editabili (input type=number) */
    const numEl = t.closest && t.closest('[data-num-entity]')
    if (numEl) {
      const v = parseFloat(numEl.value)
      if (!isNaN(v)) this._svc('input_number', 'set_value', { entity_id: numEl.dataset.numEntity, value: v })
      return
    }
  }

  set hass(h) {
    this._hass = h
    /* Non ridisegnare mentre l'utente sta scrivendo in un campo:
       il rebuild azzererebbe il focus e il testo digitato. */
    const ae = this.shadowRoot && this.shadowRoot.activeElement
    if (ae && ae.tagName === 'INPUT') return
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
    return s ? s.state : (fb !== undefined ? fb : '0')
  }

  _svc(domain, svc, data) {
    if (this._hass?.callService) this._hass.callService(domain, svc, data)
  }

  _adj(entity, step, min, max) {
    const cur = parseFloat(this._g(entity, 0))
    const v = Math.round(Math.max(min, Math.min(max, cur + step)) * 1000000) / 1000000
    this._svc('input_number', 'set_value', { entity_id: entity, value: v })
  }

  _bk() {
    /* La build key deve includere OGNI entità che la card mostra:
       altrimenti modificando un parametro (prezzi, IVA, soglia, autoconsumo,
       toggle, ecc.) la card non si ridisegna e il valore non si aggiorna. */
    const vals = Object.values(EB).map(id => this._g(id, '')).join('|')
    return [
      this._tab,
      this._settingsOpen ? '1' : '0',
      this._storicoAnno,
      vals,
    ].join('|')
  }

  _handleClick(e) {
    const btn = e.target.closest('[data-action]')
    if (!btn || !this._hass) return
    const { action } = btn.dataset

    switch (action) {
      case 'tab':
        this._tab = btn.dataset.tab; this._buildKey = null; this._buildDOM(); break

      case 'toggleSettings':
        this._settingsOpen = !this._settingsOpen; this._buildKey = null; this._buildDOM(); break

      /* Simulatore */
      case 'tkwh+': this._adj(EB.testKwh, 10, 0, 5000); break
      case 'tkwh-': this._adj(EB.testKwh, -10, 0, 5000); break
      case 'bonus+': this._adj(EB.bonus, 1, 0, 500); break
      case 'bonus-': this._adj(EB.bonus, -1, 0, 500); break

      /* Tariffe variabili */
      case 'en+':  this._adj(EB.energiaBase,    +0.000001, 0, 1); break
      case 'en-':  this._adj(EB.energiaBase,    -0.000001, 0, 1); break
      case 'dis+': this._adj(EB.dispacciamento, +0.000001, 0, 1); break
      case 'dis-': this._adj(EB.dispacciamento, -0.000001, 0, 1); break
      case 'cap+': this._adj(EB.mercatoCap,     +0.000001, 0, 1); break
      case 'cap-': this._adj(EB.mercatoCap,     -0.000001, 0, 1); break
      case 'tra+': this._adj(EB.traspEnergia,   +0.000001, 0, 1); break
      case 'tra-': this._adj(EB.traspEnergia,   -0.000001, 0, 1); break
      case 'one+': this._adj(EB.oneriSistema,   +0.000001, 0, 1); break
      case 'one-': this._adj(EB.oneriSistema,   -0.000001, 0, 1); break
      case 'uc+':  this._adj(EB.uc3uc6,         +0.000001, 0, 1); break
      case 'uc-':  this._adj(EB.uc3uc6,         -0.000001, 0, 1); break
      case 'acc+': this._adj(EB.accise,          +0.000001, 0, 1); break
      case 'acc-': this._adj(EB.accise,          -0.000001, 0, 1); break
      case 'per+': this._adj(EB.fattorePerdite,  +0.000001, 1, 1.2); break
      case 'per-': this._adj(EB.fattorePerdite,  -0.000001, 1, 1.2); break

      /* Quote fisse */
      case 'com+': this._adj(EB.commVendita,  +0.01, 0, 20); break
      case 'com-': this._adj(EB.commVendita,  -0.01, 0, 20); break
      case 'tf+':  this._adj(EB.traspFisso,   +0.1, 0, 20); break
      case 'tf-':  this._adj(EB.traspFisso,   -0.1, 0, 20); break
      case 'kw+':  this._adj(EB.potenzaImp,   +0.5, 1, 10); break
      case 'kw-':  this._adj(EB.potenzaImp,   -0.5, 1, 10); break
      case 'qkw+': this._adj(EB.quotaPotenza, +0.01, 0, 10); break
      case 'qkw-': this._adj(EB.quotaPotenza, -0.01, 0, 10); break

      /* IVA / canone / soglia */
      case 'iva+': this._adj(EB.iva, +1, 0, 22); break
      case 'iva-': this._adj(EB.iva, -1, 0, 22); break
      case 'rai+': this._adj(EB.canoneRai, +1, 0, 20); break
      case 'rai-': this._adj(EB.canoneRai, -1, 0, 20); break
      case 'sgp+': this._adj(EB.sogliaPower, +100, 3000, 6000); break
      case 'sgp-': this._adj(EB.sogliaPower, -100, 3000, 6000); break

      /* Toggle boolean */
      case 'toggleFv':       this._svc('input_boolean','toggle',{entity_id:EB.haFv}); break
      case 'toggleBatt':     this._svc('input_boolean','toggle',{entity_id:EB.haBatt}); break
      case 'toggleCanone':   this._svc('input_boolean','toggle',{entity_id:EB.includeCanone}); break
      case 'togglePush':     this._svc('input_boolean','toggle',{entity_id:EB.notifyPush}); break
      case 'toggleAlexa':    this._svc('input_boolean','toggle',{entity_id:EB.notifyAlexa}); break
      case 'toggleOverload': this._svc('input_boolean','toggle',{entity_id:EB.notifyOverload}); break
      case 'toggleDaily':    this._svc('input_boolean','toggle',{entity_id:EB.notifyDaily}); break
      case 'toggleMonthly':  this._svc('input_boolean','toggle',{entity_id:EB.notifyMonthly}); break
      case 'toggleYearly':   this._svc('input_boolean','toggle',{entity_id:EB.notifyYearly}); break

      /* Script */
      case 'resetContratto':
        if (confirm('Ripristinare tutti i valori del contratto ai default?'))
          this._svc('script','turn_on',{entity_id:EB.resetContratto}); break
      case 'resetSettimana':
        if (confirm('Azzerare tutti i dati settimanali?'))
          this._svc('script','turn_on',{entity_id:EB.resetSettimana}); break

      case 'storicoAnno':
        this._storicoAnno = btn.dataset.anno; this._buildKey = null; this._buildDOM(); break

      case 'autoFv+':   this._adj(EB.autoFv,   +1, 0, 1000); break
      case 'autoFv-':   this._adj(EB.autoFv,   -1, 0, 1000); break
      case 'autoBatt+': this._adj(EB.autoBatt, +1, 0, 1000); break
      case 'autoBatt-': this._adj(EB.autoBatt, -1, 0, 1000); break
      case 'sgr+': this._adj(EB.ritardoSoglia, +5, 0, 120); break
      case 'sgr-': this._adj(EB.ritardoSoglia, -5, 0, 120); break
    }
  }

  _buildDOM() {
    if (!this._hass) return

    const haFvOn    = this._g(EB.haFv,'off') === 'on'
    const haBattOn  = this._g(EB.haBatt,'off') === 'on'
    const bolMese    = parseFloat(this._g(EB.bolMese,0))
    const prevMese   = parseFloat(this._g(EB.prevMese,0))
    const costoGiorn = parseFloat(this._g(EB.costoGiorno,0))
    /* Con FV ON usiamo consumo totale casa reale (rete+FV+batt), senza FV solo rete */
    const kwhMeseRete = parseFloat(this._g(EB.kwhMese,0))
    const kwhMeseTot  = parseFloat(this._g(EB.totCasaReale,0))
    const kwhMese     = haFvOn ? kwhMeseTot : kwhMeseRete
    const kwhAnno    = parseFloat(this._g(EB.kwhAnno,0))
    const kwhGiorno  = parseFloat(this._g(EB.kwhGiorno,0))
    const prezzoVar  = parseFloat(this._g(EB.prezzoVar,0))
    const totaleFissi= parseFloat(this._g(EB.totaleFissi,0))
    const testBoll   = parseFloat(this._g(EB.testBolletta,0))
    const testKwh    = parseFloat(this._g(EB.testKwh,0))
    const bonus      = parseFloat(this._g(EB.bonus,0))
    /* Dati FV */
    const fvMeseKwh  = parseFloat(this._g(EB.fvMese,0)) || 0
    const prodIstW   = this._g(EB.prodIst,'0')
    const consumoIstW= this._g(EB.consumoIst,'0')
    /* Consumo istantaneo (W) con colore in base alla potenza impegnata (kW dal pkg).
       verde < 50% · giallo 50-75% · arancio 75-100% · rosso > 100% della potenza */
    const consumoRealNum = parseFloat(this._g(EB.consumoReal,0)) || 0
    const potImpW   = (parseFloat(this._g(EB.potenzaImp,4.5)) || 4.5) * 1000
    const consPct   = potImpW > 0 ? consumoRealNum / potImpW : 0
    const consColor = consPct < 0.5 ? '#4ade80' : consPct < 0.75 ? '#facc15' : consPct < 1 ? '#fb923c' : '#ef4444'
    const consText  = fi(consumoRealNum) + ' W'
    const autoFvKwh  = parseFloat(this._g(EB.autoFv,0))
    const autoBattKwh= parseFloat(this._g(EB.autoBatt,0))
    /* Risparmio reale = energia autoconsumata (NON comprata dalla rete) × prezzo.
       Coerente con consumo_totale_casa_reale = rete + autoFv + autoBatt.
       La produzione totale include l'export, che non fa risparmiare al prezzo d'acquisto. */
    const autoTotKwh = (haFvOn ? autoFvKwh : 0) + (haBattOn ? autoBattKwh : 0)
    const risparmioFv= parseFloat((autoTotKwh * prezzoVar).toFixed(2))

    const cardCls = bolMese < 50 ? 'ok' : bolMese < 150 ? 'med' : 'hi'
    const costoColor = bolMese < 50 ? '#4ade80' : bolMese < 150 ? '#facc15' : '#f97316'
    const meseNome = MESI[new Date().getMonth()]
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

    const mese0 = new Date().getMonth()

    /* Storico settimana (il giorno di OGGI è sempre live tramite max) */
    const settKwh = SETTK_KWH.map(k => parseFloat(this._g(EB[k],0)))
    settKwh[todayIdx] = Math.max(settKwh[todayIdx], kwhGiorno)
    const settEur = SETTK_EUR.map(k => parseFloat(this._g(EB[k],0)))
    settEur[todayIdx] = Math.max(settEur[todayIdx], costoGiorn)

    /* Archivio mensile — il MESE CORRENTE è sempre LIVE (cresce con oggi) */
    const archCurr = AK.map(k => parseFloat(this._g(EB[k],0)))   // € per mese
    archCurr[mese0] = bolMese
    const archPrev = PK.map(k => parseFloat(this._g(EB[k],0)))
    const ARCH_KWH = ['sensor.archivio_gennaio_kwh','sensor.archivio_febbraio_kwh','sensor.archivio_marzo_kwh','sensor.archivio_aprile_kwh','sensor.archivio_maggio_kwh','sensor.archivio_giugno_kwh','sensor.archivio_luglio_kwh','sensor.archivio_agosto_kwh','sensor.archivio_settembre_kwh','sensor.archivio_ottobre_kwh','sensor.archivio_novembre_kwh','sensor.archivio_dicembre_kwh']
    const ARCH_PREV_KWH = ['storico_prec_gennaio_kwh','storico_prec_febbraio_kwh','storico_prec_marzo_kwh','storico_prec_aprile_kwh','storico_prec_maggio_kwh','storico_prec_giugno_kwh','storico_prec_luglio_kwh','storico_prec_agosto_kwh','storico_prec_settembre_kwh','storico_prec_ottobre_kwh','storico_prec_novembre_kwh','storico_prec_dicembre_kwh']
    const archCurrKwh = ARCH_KWH.map(e => parseFloat(this._g(e,0)))
    archCurrKwh[mese0] = kwhMeseTot                               // kWh mese corrente live
    const archPrevKwh = ARCH_PREV_KWH.map(e => parseFloat(this._g('input_number.'+e,0)))

    /* Totali ANNO live (mese corrente incluso, quindi salgono con oggi) */
    const annoEur = archCurr.reduce((a,b)=>a+b,0)
    const annoKwh = archCurrKwh.reduce((a,b)=>a+b,0)

    function makeBars(dataA, dataB, colorA, colorB) {
      const maxV = Math.max(...dataA, ...dataB, 1)
      return dataA.map((v, i) => {
        const pA = Math.max(2, Math.round((v / maxV) * 100))
        const pB = dataB ? Math.max(2, Math.round((dataB[i] / maxV) * 100)) : 0
        return `<div class="bcol">
          <div class="bval">${v > 0 ? (v < 10 ? f2(v) : fi(v)) : '—'}</div>
          <div class="btrack">
            <div class="bfill" style="height:${pA}%;background:${colorA}"></div>
            ${dataB ? `<div style="position:absolute;bottom:0;left:50%;right:0;border-radius:3px;height:${pB}%;background:${colorB};transition:height .5s"></div>` : ''}
          </div>
          <div class="blbl">${MESI[i]}</div>
        </div>`
      }).join('')
    }

    function makeBarsSett(dataK, dataE, todayIdx) {
      const maxV = Math.max(...dataK, 1)
      return dataK.map((v, i) => {
        const pct = Math.max(2, Math.round((v / maxV) * 100))
        const isT = i === todayIdx
        return `<div class="bcol">
          <div class="bval">${v > 0 ? f1(v) : '—'}</div>
          <div class="btrack"><div class="bfill" style="height:${pct}%;background:${isT ? 'linear-gradient(0deg,#facc15,#fde68a)' : 'rgba(250,204,21,.3)'}"></div></div>
          <div class="blbl">${GIORNI[i]}</div>
        </div>`
      }).join('')
    }

    /* Settings params */
    const en  = f6(this._g(EB.energiaBase,0))
    const dis = f6(this._g(EB.dispacciamento,0))
    const cap = f6(this._g(EB.mercatoCap,0))
    const per = f6(this._g(EB.fattorePerdite,1))
    const tra = f6(this._g(EB.traspEnergia,0))
    const one = f6(this._g(EB.oneriSistema,0))
    const uc  = f6(this._g(EB.uc3uc6,0))
    const acc = f6(this._g(EB.accise,0))
    const com = f4(this._g(EB.commVendita,0))
    const tf  = f2(this._g(EB.traspFisso,0))
    const kw  = f1(this._g(EB.potenzaImp,0))
    const qkw = f4(this._g(EB.quotaPotenza,0))
    const iva = this._g(EB.iva,'10')
    const rai = f2(this._g(EB.canoneRai,0))
    const sgp = fi(this._g(EB.sogliaPower,3500))
    const haFv   = this._g(EB.haFv,'off')==='on'
    const haBatt = this._g(EB.haBatt,'off')==='on'
    const incCan = this._g(EB.includeCanone,'off')==='on'
    const ntPush = this._g(EB.notifyPush,'off')==='on'
    const ntAlexa= this._g(EB.notifyAlexa,'off')==='on'
    const ntOvld = this._g(EB.notifyOverload,'off')==='on'
    const ntDay  = this._g(EB.notifyDaily,'off')==='on'
    const ntMon  = this._g(EB.notifyMonthly,'off')==='on'
    const ntYr   = this._g(EB.notifyYearly,'off')==='on'

    function setRow(lbl, sub, entity, val, step, unit, cls) {
      return `<div class="set-row">
        <div><div class="set-lbl">${lbl}</div><div class="set-sub">${sub}</div></div>
        <div class="num-edit">
          <input class="num-in ${cls||''}" type="number" inputmode="decimal" step="${step}" value="${val}" data-num-entity="${entity}">
          ${unit?`<span class="num-unit">${unit}</span>`:''}
        </div>
      </div>`
    }
    function togRow(lbl, sub, checked, action) {
      return `<div class="set-row">
        <div><div class="set-lbl">${lbl}</div><div class="set-sub">${sub}</div></div>
        <button class="toggle ${checked?'on':'off'}" data-action="${action}"></button>
      </div>`
    }

    const tab = this._tab

    /* Pannello MESE */
    const fvBlock = haFvOn ? `
      <div class="srow" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">
        <div class="sbox" style="border:1px solid rgba(74,222,128,.2)">
          <div class="slbl">☀️ FV mese</div>
          <div class="sval" style="color:#4ade80">${f1(fvMeseKwh)}</div>
          <div class="ssub">kWh prodotti</div>
        </div>
        <div class="sbox" style="border:1px solid rgba(74,222,128,.2)">
          <div class="slbl">💰 Risparmio FV</div>
          <div class="sval" style="color:#4ade80">${f2(risparmioFv)}</div>
          <div class="ssub">€ stimati</div>
        </div>
        <div class="sbox">
          <div class="slbl">⚡ Totale casa</div>
          <div class="sval" style="color:#a5b4fc">${f1(kwhMeseTot)}</div>
          <div class="ssub">kWh reali</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div style="flex:1;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.15);border-radius:10px;padding:8px 10px;text-align:center">
          <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:rgba(74,222,128,.6);margin-bottom:3px">Produzione ora</div>
          <div style="font-size:16px;font-weight:800;color:#4ade80">${prodIstW}</div>
        </div>
        <div style="flex:1;background:rgba(96,165,250,.06);border:1px solid rgba(96,165,250,.15);border-radius:10px;padding:8px 10px;text-align:center">
          <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:rgba(96,165,250,.6);margin-bottom:3px">Consumo ora</div>
          <div style="font-size:16px;font-weight:800;color:${consColor}">${consText}</div>
        </div>
      </div>` : `
      <div class="srow" style="margin-bottom:12px">
        <div class="sbox"><div class="slbl">Consumo mese</div><div class="sval" style="color:#facc15">${f1(kwhMeseRete)}</div><div class="ssub">kWh rete</div></div>
        <div class="sbox"><div class="slbl">Consumo oggi</div><div class="sval" style="color:#60a5fa">${f1(kwhGiorno)}</div><div class="ssub">kWh</div></div>
        <div class="sbox"><div class="slbl">Consumo ora</div><div class="sval" style="color:${consColor};font-size:15px">${consText}</div><div class="ssub">potenza</div></div>
      </div>`

    const pnlMese = tab === 'mese' ? `<div class="pnl">
      <div class="hero"><span class="heur">€</span><span class="hval" style="color:${costoColor}">${f2(bolMese)}</span></div>
      <div class="hmeta">Bolletta stimata <b>${meseNome}</b> · <b>${f1(haFvOn?kwhMeseRete:kwhMese)}</b> kWh rete · <b>€ ${f4(prezzoVar)}</b>/kWh (IVA escl.)</div>
      ${fvBlock}
      <div class="prev-row">
        <div class="prev-box"><div class="prev-lbl">Previsione fine mese</div><div class="prev-val">€ ${f2(prevMese)}</div><div class="prev-sub">base consumo attuale</div></div>
        <div class="prev-box"><div class="prev-lbl">Costo oggi</div><div class="prev-val">€ ${f2(costoGiorn)}</div><div class="prev-sub">${f1(kwhGiorno)} kWh</div></div>
      </div>
      <div class="chart-lbl">Bollette mensili €</div>
      <div class="bars">${makeBars(archCurr, archPrev, 'linear-gradient(0deg,#facc15,#fde68a)', 'rgba(250,204,21,.25)')}</div>
      <div class="leg"><span><span class="leg-dot" style="background:#facc15"></span>Anno corrente</span><span><span class="leg-dot" style="background:rgba(250,204,21,.3)"></span>Anno precedente</span></div>
    </div>` : ''

    /* Pannello SETTIMANA */
    const pnlSett = tab === 'sett' ? `<div class="pnl">
      <div class="hero"><span class="heur">€</span><span class="hval" style="color:#60a5fa">${f2(settEur.reduce((a,b)=>a+b,0))}</span></div>
      <div class="hmeta">Settimana corrente · <b>${f1(settKwh.reduce((a,b)=>a+b,0))}</b> kWh totali</div>
      <div class="srow">
        <div class="sbox"><div class="slbl">Media kWh/g</div><div class="sval" style="color:#60a5fa">${f1(this._g(EB.mediaKwh,0))}</div><div class="ssub">settimana</div></div>
        <div class="sbox"><div class="slbl">Media €/g</div><div class="sval" style="color:#facc15">${f2(this._g(EB.mediaEur,0))}</div><div class="ssub">settimana</div></div>
        <div class="sbox"><div class="slbl">Oggi kWh</div><div class="sval" style="color:#a5b4fc">${f1(kwhGiorno)}</div><div class="ssub">live</div></div>
      </div>
      <div class="chart-lbl">kWh per giorno</div>
      <div class="bars">${makeBarsSett(settKwh, settEur, todayIdx)}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:6px">
        <button style="padding:6px 12px;border-radius:8px;border:1px solid rgba(239,68,68,.25);background:rgba(239,68,68,.06);color:rgba(239,68,68,.7);font-size:10px;font-weight:700;cursor:pointer" data-action="resetSettimana">↺ Reset settimana</button>
      </div>
    </div>` : ''

    /* Pannello ANNO */
    const pnlAnno = tab === 'anno' ? `<div class="pnl">
      <div class="hero"><span class="heur">€</span><span class="hval" style="color:#34d399">${f2(annoEur)}</span></div>
      <div class="hmeta">Anno corrente · <b>${fi(annoKwh)}</b> kWh totali${haFvOn?' · ☀️ FV attivo':''}</div>
      <div class="srow">
        <div class="sbox"><div class="slbl">Media mensile €</div><div class="sval" style="color:#facc15">${f2(annoEur/(mese0+1))}</div><div class="ssub">su ${mese0+1} mesi</div></div>
        <div class="sbox"><div class="slbl">kWh totali</div><div class="sval" style="color:#60a5fa">${fi(annoKwh)}</div><div class="ssub">anno</div></div>
        <div class="sbox"><div class="slbl">Mese corrente €</div><div class="sval" style="color:#34d399">${f2(bolMese)}</div><div class="ssub">${meseNome}</div></div>
      </div>
      <div class="chart-lbl">Bollette mensili anno corrente (€)</div>
      <div class="bars">${archCurr.map((v,i) => {
        const pct = Math.max(2, Math.round((v/Math.max(...archCurr,1))*100))
        const isCurr = i === new Date().getMonth()
        return `<div class="bcol"><div class="bval">${v>0?fi(v):'—'}</div><div class="btrack"><div class="bfill" style="height:${pct}%;background:${isCurr?'linear-gradient(0deg,#34d399,#6ee7b7)':'rgba(52,211,153,.3)'}"></div></div><div class="blbl">${MESI[i]}</div></div>`
      }).join('')}</div>
    </div>` : ''

    /* Pannello STORICO */
    const octopus      = this._g(EB.octopus,'—')
    const fvMese       = this._g(EB.fvMese,'—')
    const consumoIst   = this._g(EB.consumoIst,'—')
    const prodIst      = this._g(EB.prodIst,'—')
    const totCasa      = this._g(EB.totCasaReale,'—')
    /* Usa gli array LIVE definiti sopra (mese corrente incluso) */
    const totCurrKwh   = annoKwh
    const totCurrEur   = annoEur
    const totPrevKwh   = archPrevKwh.reduce((a,b)=>a+b,0)
    const totPrevEur   = archPrev.reduce((a,b)=>a+b,0)
    const isCurr       = this._storicoAnno === 'curr'
    const settKwhThisWeek = SETTK_KWH.map((k,i) => {const v=parseFloat(this._g(EB[k],0)); return i===todayIdx?Math.max(v,kwhGiorno):v})

    const pnlStorico = tab === 'storico' ? `<div class="pnl">
      <div class="srow" style="grid-template-columns:repeat(2,1fr);margin-bottom:8px">
        <div class="sbox"><div class="slbl">Mensile rete</div><div class="sval" style="color:#facc15">${f1(kwhMeseRete)} kWh</div></div>
        <div class="sbox"><div class="slbl">FV mese</div><div class="sval" style="color:#4ade80">${fvMese}</div></div>
        <div class="sbox"><div class="slbl">Consumo ist.</div><div class="sval" style="color:#60a5fa;font-size:14px">${consumoIst}</div></div>
        <div class="sbox"><div class="slbl">Produzione ist.</div><div class="sval" style="color:#4ade80;font-size:14px">${prodIst}</div></div>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:10px;background:rgba(255,255,255,.04);border-radius:10px;padding:4px">
        <button style="flex:1;padding:6px;border-radius:7px;border:none;font-size:10px;font-weight:700;cursor:pointer;transition:all .15s;${!isCurr?'background:rgba(250,204,21,.15);color:#facc15':'background:none;color:rgba(255,255,255,.4)'}" data-action="storicoAnno" data-anno="prev">Anno precedente</button>
        <button style="flex:1;padding:6px;border-radius:7px;border:none;font-size:10px;font-weight:700;cursor:pointer;transition:all .15s;${isCurr?'background:rgba(74,222,128,.15);color:#4ade80':'background:none;color:rgba(255,255,255,.4)'}" data-action="storicoAnno" data-anno="curr">Anno corrente</button>
      </div>
      <div class="chart-lbl">${isCurr?'Anno corrente '+new Date().getFullYear()+' (kWh)':'Anno precedente '+(new Date().getFullYear()-1)+' (kWh)'}</div>
      <div class="bars">${(isCurr?archCurrKwh:archPrevKwh).map((v,i) => {
        const maxV = Math.max(...(isCurr?archCurrKwh:archPrevKwh), 1)
        const pct = Math.max(2, Math.round((v/maxV)*100))
        return `<div class="bcol"><div class="bval">${v>0?fi(v):'—'}</div><div class="btrack"><div class="bfill" style="height:${pct}%;background:${i===new Date().getMonth()&&isCurr?'linear-gradient(0deg,#facc15,#fde68a)':'rgba(250,204,21,.3)'}"></div></div><div class="blbl">${MESI[i]}</div></div>`
      }).join('')}</div>
      <div style="margin-top:8px;padding:10px;background:${isCurr?'rgba(0,255,0,.08)':'rgba(255,0,128,.08)'};border-radius:10px;border:1px solid ${isCurr?'rgba(0,255,0,.2)':'rgba(255,0,128,.2)'}">
        <div style="font-size:10px;color:rgba(255,255,255,.5);margin-bottom:4px">TOTALE ANNO</div>
        <div style="font-size:16px;font-weight:900;color:${isCurr?'#4ade80':'#f472b6'}">${fi(isCurr?totCurrKwh:totPrevKwh)} kWh · € ${f2(isCurr?totCurrEur:totPrevEur)}</div>
      </div>
      <div style="margin-top:8px">
        <div class="chart-lbl">Settimana corrente (kWh)</div>
        <div class="bars">${settKwhThisWeek.map((v,i)=>{
          const maxV=Math.max(...settKwhThisWeek,1)
          const pct=Math.max(2,Math.round((v/maxV)*100))
          return `<div class="bcol"><div class="bval">${v>0?f1(v):'—'}</div><div class="btrack"><div class="bfill" style="height:${pct}%;background:${i===todayIdx?'linear-gradient(0deg,#60a5fa,#93c5fd)':'rgba(96,165,250,.3)'}"></div></div><div class="blbl">${GIORNI[i]}</div></div>`
        }).join('')}</div>
      </div>
    </div>` : ''

    /* Pannello SETUP */
    const notifInizio  = this._g(EB.notifInizio,'').slice(0,5)
    const notifFine    = this._g(EB.notifFine,'').slice(0,5)
    const pushInizio   = this._g(EB.pushInizio,'').slice(0,5)
    const pushFine     = this._g(EB.pushFine,'').slice(0,5)
    const ritardo      = fi(this._g(EB.ritardoSoglia,5))
    const autoFv       = fi(this._g(EB.autoFv,0))
    const autoBatt     = fi(this._g(EB.autoBatt,0))

    const pnlSetup = tab === 'setup' ? `<div class="pnl">
      <div class="set-sec">Fascia oraria notifiche Alexa</div>
      <div class="set-row">
        <div><div class="set-lbl">Inizio</div></div>
        <input class="time-input" type="time" value="${notifInizio}" data-time-entity="${EB.notifInizio}" style="height:28px;padding:0 8px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--primary-text-color,#f1f5f9);font-size:12px;font-weight:600;font-family:inherit">
      </div>
      <div class="set-row">
        <div><div class="set-lbl">Fine</div></div>
        <input class="time-input" type="time" value="${notifFine}" data-time-entity="${EB.notifFine}" style="height:28px;padding:0 8px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--primary-text-color,#f1f5f9);font-size:12px;font-weight:600;font-family:inherit">
      </div>
      <div class="set-sec">Fascia oraria Push</div>
      <div class="set-row">
        <div><div class="set-lbl">Inizio Push</div></div>
        <input class="time-input" type="time" value="${pushInizio}" data-time-entity="${EB.pushInizio}" style="height:28px;padding:0 8px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--primary-text-color,#f1f5f9);font-size:12px;font-weight:600;font-family:inherit">
      </div>
      <div class="set-row">
        <div><div class="set-lbl">Fine Push</div></div>
        <input class="time-input" type="time" value="${pushFine}" data-time-entity="${EB.pushFine}" style="height:28px;padding:0 8px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--primary-text-color,#f1f5f9);font-size:12px;font-weight:600;font-family:inherit">
      </div>
      <div class="set-sec">Report consumi</div>
      ${togRow('Report giornaliero','',ntDay,'toggleDaily')}
      ${togRow('Report mensile','Fine mese',ntMon,'toggleMonthly')}
      ${togRow('Report annuale','31 dicembre',ntYr,'toggleYearly')}
      <div class="set-sec">Sovraccarico</div>
      ${setRow('Soglia power','Watt',EB.sogliaPower,sgp,'100','W')}
      ${setRow('Ritardo innesco','Secondi',EB.ritardoSoglia,ritardo,'5','s')}
      ${togRow('Allarme sovraccarico','',ntOvld,'toggleOverload')}
      <div class="set-sec">Impianto FV / Batteria</div>
      ${togRow('Includi pannelli FV','',haFv,'toggleFv')}
      ${setRow('Autoconsumo FV','kWh da pannelli (mensile)',EB.autoFv,autoFv,'1','kWh')}
      ${togRow('Includi batteria','',haBatt,'toggleBatt')}
      ${setRow('Autoconsumo Batteria','kWh da batteria (mensile)',EB.autoBatt,autoBatt,'1','kWh')}
      <div class="set-sec">Azioni</div>
      <button class="set-rst" data-action="resetSettimana">↺ Reset dati settimanali</button>
    </div>` : ''

    /* Pannello SIMULATORE — calcolo identico al sensor.oct_24_test_bolletta:
       (kWh × prezzo_unico + fissi) × (1+IVA) + canone − bonus.
       prezzo_unico e fissi sono IVA ESCLUSA; l'IVA si applica all'imponibile. */
    const ivaPerc   = parseFloat(iva) || 0
    const canoneVal = parseFloat(this._g(EB.canoneRai,9)) || 0
    /* Arrotondo OGNI riga al centesimo come fa la bolletta vera:
       così ogni riga mostrata torna nella somma e il totale combacia col PDF. */
    const r2        = v => Math.round((v + Number.EPSILON) * 100) / 100
    const simEner   = r2(testKwh * prezzoVar)      // imponibile energia (IVA escl.)
    const simFissi  = r2(totaleFissi)              // imponibile fissi (IVA escl.)
    const simImp    = r2(simEner + simFissi)       // imponibile totale
    const simIva    = r2(simImp * ivaPerc / 100)
    const simCan    = incCan ? r2(canoneVal) : 0
    const simBonus  = r2(bonus)
    const simTot    = r2(simImp + simIva + simCan - simBonus)

    const pnlSim = tab === 'sim' ? `<div class="pnl">
      <div class="sim-box">
        <div class="sim-title">🧮 Simulatore Bolletta</div>
        <div class="sim-result">
          <div class="sim-val">€ ${f2(simTot)}</div>
          <div class="sim-sub">${incCan?'Canone RAI incluso':'Senza canone RAI'}${bonus>0?' · bonus € '+f2(bonus):''}</div>
        </div>
        <div class="sim-row">
          <div><div class="sim-lbl">Consumo da simulare</div><div class="sim-lbl2">kWh inseriti manualmente</div></div>
          <div class="num-edit">
            <input class="num-in acc" type="number" inputmode="decimal" step="1" value="${fi(testKwh)}" data-num-entity="${EB.testKwh}">
            <span class="num-unit">kWh</span>
          </div>
        </div>
        <div class="sim-row">
          <div><div class="sim-lbl">Bonus / Sconto</div><div class="sim-lbl2">sottratto al totale</div></div>
          <div class="num-edit">
            <input class="num-in acc" type="number" inputmode="decimal" step="0.01" value="${f2(bonus)}" data-num-entity="${EB.bonus}">
            <span class="num-unit">€</span>
          </div>
        </div>
        <div class="sim-row">
          <div><div class="sim-lbl">Canone RAI</div><div class="sim-lbl2">solo gen→ott in bolletta</div></div>
          <button class="toggle ${incCan?'on':'off'}" data-action="toggleCanone"></button>
        </div>
      </div>
      <div class="sim-break">
        <div class="sbk"><span>Energia · ${fi(testKwh)} kWh × € ${f6(prezzoVar)}</span><span>€ ${f2(simEner)}</span></div>
        <div class="sbk"><span>Costi fissi mensili</span><span>€ ${f2(simFissi)}</span></div>
        <div class="sbk sbk-sub"><span>Imponibile (IVA escl.)</span><span>€ ${f2(simImp)}</span></div>
        <div class="sbk"><span>IVA ${ivaPerc}%</span><span>+ € ${f2(simIva)}</span></div>
        ${simCan>0?`<div class="sbk"><span>Canone RAI</span><span>+ € ${f2(simCan)}</span></div>`:''}
        ${bonus>0?`<div class="sbk"><span>Bonus / Sconto</span><span>− € ${f2(bonus)}</span></div>`:''}
        <div class="sbk sbk-tot"><span>TOTALE</span><span>€ ${f2(simTot)}</span></div>
      </div>
    </div>` : ''

    /* Settings panel */
    const settingsHTML = this._settingsOpen ? `<div class="settings open">
      <div class="set-sec">Tariffe energia (€/kWh)</div>
      ${setRow('Prezzo energia base','Quota energia contratto',EB.energiaBase,en,'0.000001','€')}
      ${setRow('Dispacciamento','',EB.dispacciamento,dis,'0.000001','€')}
      ${setRow('Mercato capacità','',EB.mercatoCap,cap,'0.000001','€')}
      ${setRow('Fattore perdite','Moltiplicatore (es. 1.103261)',EB.fattorePerdite,per,'0.000001','×')}
      ${setRow('Trasporto energia','',EB.traspEnergia,tra,'0.000001','€')}
      ${setRow('Oneri sistema (ASOS+ARIM)','',EB.oneriSistema,one,'0.000001','€')}
      ${setRow('Oneri variabili UC3+UC6','',EB.uc3uc6,uc,'0.000001','€')}
      ${setRow('Accise','',EB.accise,acc,'0.000001','€')}
      <div class="set-sec">Quote fisse mensili</div>
      ${setRow('Commercializzazione + DISPbt','',EB.commVendita,com,'0.01','€')}
      ${setRow('Trasporto fisso','',EB.traspFisso,tf,'0.01','€')}
      ${setRow('Potenza impegnata','kW',EB.potenzaImp,kw,'0.1','kW')}
      ${setRow('Quota potenza','€/kW mese',EB.quotaPotenza,qkw,'0.01','€')}
      <div class="set-sec">Fiscalità e canone</div>
      ${setRow('IVA','%',EB.iva,iva,'1','%')}
      ${setRow('Canone RAI mensile','Gen→Ott automatico',EB.canoneRai,rai,'0.5','€')}
      <div class="set-sec">Fonti energetiche</div>
      ${togRow('Includi pannelli FV','Aggiunge autoconsumo FV al totale',haFv,'toggleFv')}
      ${togRow('Includi batteria','Aggiunge autoconsumo batteria',haBatt,'toggleBatt')}
      <div class="set-sec">Notifiche</div>
      ${togRow('Notifica Push','App mobile',ntPush,'togglePush')}
      ${togRow('Voce Alexa','Annuncio vocale',ntAlexa,'toggleAlexa')}
      ${togRow('Allarme sovraccarico','',ntOvld,'toggleOverload')}
      ${setRow('Soglia sovraccarico','Watt',EB.sogliaPower,sgp,'100','W')}
      ${togRow('Report giornaliero','Notifica serale consumi',ntDay,'toggleDaily')}
      ${togRow('Report mensile','Fine mese',ntMon,'toggleMonthly')}
      ${togRow('Report annuale','31 dicembre',ntYr,'toggleYearly')}
      <div class="set-sec">Azioni</div>
      <button class="set-rst" data-action="resetContratto">↺ Ripristina valori contratto (Nov 2025)</button>
    </div>` : '<div class="settings"></div>'

    this.shadowRoot.innerHTML = `<style>${CSS_B}</style>
<div class="card ${cardCls}">

  <div class="hdr">
    <div class="hico">⚡</div>
    <div class="htxt">
      <div class="htitle">Bolletta Elettrica</div>
      <div class="hsub">Octopus</div>
    </div>
    <div class="hright">
      <button class="ibtn" data-action="toggleSettings">${I_B.gear}</button>
      <button style="display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:14px;border:1px solid ${haFvOn?'rgba(74,222,128,.35)':'rgba(100,116,139,.2)'};background:${haFvOn?'rgba(74,222,128,.08)':'rgba(255,255,255,.03)'};color:${haFvOn?'#4ade80':'rgba(100,116,139,.5)'};font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap" data-action="toggleFv">☀️ FV ${haFvOn?'ON':'OFF'}</button>
      <div class="badge" style="color:${costoColor}">€ ${f2(bolMese)}</div>
    </div>
  </div>

  <div class="tabs">
    ${[['mese','Mese'],['sett','Sett.'],['anno','Anno'],['storico','Storico'],['sim','Sim.'],['setup','Setup']].map(([t,l]) =>
      `<button class="tab ${this._tab===t?'on':''}" data-action="tab" data-tab="${t}">${l}</button>`
    ).join('')}
  </div>

  ${pnlMese}${pnlSett}${pnlAnno}${pnlStorico}${pnlSim}${pnlSetup}
  ${settingsHTML}

</div>`
  }

  _patch() {
    const upd = (sel, txt) => {
      const el = this.shadowRoot.querySelector(`[data-patch="${sel}"]`)
      if (el) el.textContent = txt
    }
    upd('bolMese',  f2(this._g(EB.bolMese,0)))
    upd('kwhMese',  f1(this._g(EB.kwhMese,0)))
    upd('costoG',   f2(this._g(EB.costoGiorno,0)))
    upd('kwhG',     f1(this._g(EB.kwhGiorno,0)))
    upd('prevMese', f2(this._g(EB.prevMese,0)))
  }
}

if (!customElements.get('bolletta-card')) {
  customElements.define('bolletta-card', BollettaCard)
}

window.FratechCardRegistry = window.FratechCardRegistry || {}
window.FratechCardRegistry['bolletta-card'] = {
  id: 'bolletta-card', name: 'Bolletta Elettrica', icon: '⚡', version: '2.5.0',
  desc: 'Octopus Energy Monitor V3 — mese, settimana, anno, simulatore',
  _makeHass() {
    const s={}, h=(typeof hs!=='undefined')?hs:{}, a=(typeof ha!=='undefined')?ha:{}
    Object.keys(h).forEach(id => { s[id]={state:h[id],attributes:a[id]||{},entity_id:id} })
    return {
      states: s,
      callService(d,sv,dt) {
        if (typeof send==='function') send({type:'call_service',domain:d,service:sv,service_data:dt||{}})
        else if (typeof callSvc==='function') { const e=dt?.entity_id||'',x={}; if(dt) Object.keys(dt).forEach(k=>{if(k!=='entity_id')x[k]=dt[k]}); callSvc(d,sv,e,x) }
      }
    }
  },
  render(c,h)  { return '<bolletta-card style="display:block;width:100%;height:100%"></bolletta-card>' },
  mount(c,h,el)  { const x=el.querySelector('bolletta-card'); if(!x)return; x.setConfig(c); try{x.hass=this._makeHass()}catch(e){} },
  update(c,h,el) { const x=el.querySelector('bolletta-card'); if(!x)return; try{x.hass=this._makeHass()}catch(e){} }
}

console.log('[FratechStore] Card registrata: bolletta-card v2.5.0')

;(function(){
  function patch(){
    if(typeof saveCard!=='function'||typeof openCM!=='function'||typeof jsStoreAddCard!=='function'){setTimeout(patch,200);return}
    const _oCM=openCM
    window.openCM=function(id){
      _oCM(id)
      const page=typeof curPage==='function'?curPage():null; if(!page)return
      const c=page.cards.find(x=>x.id===id); if(!c||c.type!=='js-custom')return
      const sel=document.getElementById('cm-type'); if(!sel)return
      if(!sel.querySelector('option[value="js-custom"]')){const o=document.createElement('option');o.value='js-custom';o.textContent='📦 Card JS';sel.appendChild(o)}
      sel.value='js-custom'
      ;['fr-entity','fr-unit','fr-max','fr-min','fr-hours','fr-solar','fr-load','fr-grid','fr-battery','fr-ent2','fr-ent3','fr-refresh','fr-sub','fr-content','fr-imageurl','fr-pelements','fr-threshold','fr-groups','fr-items','fr-wf-temp','fr-wf-hum','fr-wf-wind','fr-wf-days'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none'})
    }
    const _oSC=saveCard
    window.saveCard=function(){
      const page=typeof curPage==='function'?curPage():null; if(!page)return _oSC()
      const eid=typeof editingId!=='undefined'?editingId:null; if(!eid)return _oSC()
      const c=page.cards.find(x=>x.id===eid); if(!c||c.type!=='js-custom')return _oSC()
      const t=c.type,j=c.jsCardId; _oSC()
      const c2=page.cards.find(x=>x.id===eid)
      if(c2){c2.type=t;c2.jsCardId=j;if(typeof saveCfg==='function')saveCfg();if(typeof renderDash==='function')renderDash()}
    }
  }
  patch()
})()
