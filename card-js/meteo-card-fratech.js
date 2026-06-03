/**
 * meteo-card-fratech.js v1.4.1
 * Stazione Meteo — Ecowitt GW1100A + Pirate Weather + entità weather.*
 * Stesso formato di bolletta-card-fratech (FratechCardRegistry, vanilla JS).
 *
 * v1.4.1: nome località configurabile; previsioni 7 giorni; orologio live a
 *         destra della temperatura; popup reso robusto (sfondo sul contenitore
 *         esterno + try/catch + tasto Esc) per evitare overlay invisibile che
 *         bloccava la pagina.
 *
 * v1.3.0: card principale ridisegnata (località, data, glifo meteo ANIMATO,
 *         temp grande, 4 chip animate, "Prossimi giorni" a tendina con barre).
 *         Icona ingranaggio in alto a dx → popup IMPOSTAZIONI per scegliere le
 *         entità (weather/temp/umidità/pressione/vento/direzione), salvate in
 *         localStorage. Click sulla card → popup stazione completa (portale body).
 *
 * v1.2.0: usa l'entità weather.* (auto-detect o config.weatherEntity) per
 *         condizione e previsioni multi-giorno; striscia "prossimi giorni"
 *         anche nella card compatta; popup agganciato al <body> (non più
 *         tagliato da overflow/transform → ora si apre correttamente).
 * v1.1.0: vista esterna COMPATTA; al click apre un POPUP con la stazione completa.
 *
 * - Rileva automaticamente i sensori con prefisso (default gw1100a) e li
 *   raggruppa per categoria: una card per Temperature, Umidità, Vento,
 *   Pressione, Pioggia, Sole/Luce, Batterie.
 * - Hero immersivo stile Apple Weather: cielo dinamico (alba/giorno/tramonto/
 *   notte via sun.sun + condizione Pirate Weather) con sole/luna/stelle/nuvole/
 *   pioggia/neve/lampo animati, temperatura grande locale (Ecowitt), min/max e
 *   condizione da Pirate Weather, chip vetro vento/umidità/pressione/pioggia.
 * - Previsioni Pirate Weather (oggi/domani).
 *
 * Config opzionale (setConfig): { prefix:'gw1100a', forecastPrefix:'pirateweather' }
 */

const MW = {
  prefix: 'gw1100a',
  forecastPrefix: 'pirateweather',
  weatherEntity: '',   // es. weather.pirateweather (vuoto = auto-detect)
}

const GIORNI3 = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

/* ---------- helpers ---------- */
function isUn(st) {
  if (!st) return true
  const s = String(st.state || '').toLowerCase()
  return s === 'unavailable' || s === 'unknown' || s === ''
}
function num(v) { const n = Number(v); return Number.isNaN(n) ? null : n }
function fmt(st) {
  if (!st || isUn(st)) return { v: '—', u: '' }
  const raw = st.state
  const u = st.attributes?.unit_of_measurement || ''
  const n = Number(raw)
  if (Number.isNaN(n)) return { v: String(raw), u: '' }
  let d = 1
  const ul = u.toLowerCase()
  if (u === '%' || ul === 'lx' || ul === 'lux' || /w\/m/.test(ul)) d = 0
  if (u === 'mm' || u === 'mm/h') d = 1
  if (Math.abs(n) >= 100) d = 0
  return { v: n.toFixed(d), u }
}
function degToCard(deg) {
  const n = Number(deg); if (Number.isNaN(n)) return null
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']
  return dirs[Math.round(((n % 360) / 22.5)) % 16]
}

const TR = [
  [/outdoor.*temp|temp.*outdoor|esterna.*temp/i, 'Temperatura esterna'],
  [/indoor.*temp|temp.*indoor/i, 'Temperatura interna'],
  [/feels.*like/i, 'Percepita'],
  [/wind.?chill/i, 'Wind chill'],
  [/dew.*point/i, 'Punto di rugiada'],
  [/indoor.*dew/i, 'Rugiada interna'],
  [/outdoor.*humid|humid.*outdoor/i, 'Umidità esterna'],
  [/indoor.*humid/i, 'Umidità interna'],
  [/max.*daily.*gust|daily.*gust/i, 'Raffica max giorno'],
  [/wind.*gust|gust/i, 'Raffica'],
  [/wind.*dir.*10|dir.*10m/i, 'Direzione media 10m'],
  [/wind.*dir|bearing/i, 'Direzione vento'],
  [/wind.*speed/i, 'Velocità vento'],
  [/relative.*press/i, 'Pressione relativa'],
  [/absolute.*press/i, 'Pressione assoluta'],
  [/rain.*rate/i, 'Intensità pioggia'],
  [/event.*rain/i, 'Pioggia evento'],
  [/hourly.*rain/i, 'Pioggia oraria'],
  [/24h.*rain/i, 'Pioggia 24h'],
  [/daily.*rain/i, 'Pioggia oggi'],
  [/weekly.*rain/i, 'Pioggia settimana'],
  [/monthly.*rain/i, 'Pioggia mese'],
  [/yearly.*rain/i, 'Pioggia anno'],
  [/total.*rain/i, 'Pioggia totale'],
  [/solar.*rad/i, 'Radiazione solare'],
  [/solar.*lux/i, 'Luminosità'],
  [/uv.*index|^uv$/i, 'Indice UV'],
  [/vapou?r.*press.*deficit/i, 'Deficit vapore'],
  // --- Pirate Weather / extra ---
  [/nearest.*storm.*dist/i, 'Distanza temporale'],
  [/nearest.*storm.*bear/i, 'Direzione temporale'],
  [/storm.*dist/i, 'Distanza temporale'],
  [/storm.*bear|storm.*dir/i, 'Direzione temporale'],
  [/lightning|fulmin/i, 'Fulmini'],
  [/cloud.*cover|copertura/i, 'Copertura nuvolosa'],
  [/visibility|visibilit/i, 'Visibilità'],
  [/ozone|ozono/i, 'Ozono'],
  [/precip.*probab/i, 'Prob. pioggia'],
  [/precip.*intens/i, 'Intensità pioggia'],
  [/precip.*accum/i, 'Accumulo pioggia'],
  [/precip.*type|tipo.*precip/i, 'Tipo precipitazione'],
  [/apparent.*temp|feels.*like/i, 'Temperatura percepita'],
  [/heat.*index/i, 'Indice di calore'],
  [/temperature$|^temp/i, 'Temperatura'],
  [/humidity$|umidit/i, 'Umidità'],
  [/pressure$|press/i, 'Pressione'],
  [/summary|riepilog/i, 'Riepilogo'],
  [/battery/i, 'Batteria'],
]
function friendly(st, eid, prefix) {
  let n = st?.attributes?.friendly_name || eid
  const re = new RegExp('^' + prefix + '[\\s_-]*', 'i')
  let cleaned = String(n).replace(/^sensor\./, '').replace(re, '').trim() || eid
  for (const [r, rep] of TR) if (r.test(cleaned)) return rep
  // fallback: capitalizza
  return cleaned.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function classify(eid, st) {
  const id = eid.toLowerCase()
  const dc = String(st?.attributes?.device_class || '').toLowerCase()
  const unit = String(st?.attributes?.unit_of_measurement || '').toLowerCase()
  if (/batt/.test(id) || dc === 'battery') return 'battery'
  if (/storm|lightning|nearest/.test(id)) return 'lightning'
  if (/wind|gust|bearing/.test(id)) return 'wind'
  if (/rain|precip/.test(id)) return 'rain'
  if (/uv|solar|radiation/.test(id)) return 'light'
  if (/illumin|lux|brightness/.test(id) || unit === 'lx') return 'light'
  if (/pressure|baro/.test(id) || dc === 'pressure' || unit === 'hpa' || unit === 'mbar') return 'pressure'
  if (/humid/.test(id) || dc === 'humidity') return 'humidity'
  if (/temp|feels|apparent|dew|chill/.test(id) || dc === 'temperature') return 'thermal'
  return 'other'
}
function subType(eid) {
  const id = eid.toLowerCase()
  if (/feels.?like|apparent/.test(id)) return 'feels'
  if (/dew.?point|rugiada/.test(id)) return 'dew'
  if (/wind.?dir|bearing/.test(id)) return 'wind_dir'
  if (/gust/.test(id)) return 'gust'
  if (/wind.?speed|wind$/.test(id)) return 'wind_speed'
  if (/rain.?rate/.test(id)) return 'rain_rate'
  if (/daily.?rain|rain.?daily/.test(id)) return 'rain_daily'
  if (/(out|esterno|external)/.test(id) && /temp/.test(id)) return 'temp_out'
  if (/(in|interno)/.test(id) && /temp/.test(id)) return 'temp_in'
  return 'x'
}

const CATS = {
  thermal:  { order: 1, label: 'Temperatura', emoji: '🌡️', color: '#fb923c', g1: '#fb923c', g2: '#f97316' },
  humidity: { order: 2, label: 'Umidità',     emoji: '💧', color: '#38bdf8', g1: '#38bdf8', g2: '#0ea5e9' },
  wind:     { order: 3, label: 'Vento',       emoji: '💨', color: '#22d3ee', g1: '#22d3ee', g2: '#06b6d4' },
  pressure: { order: 4, label: 'Pressione',   emoji: '🧭', color: '#a78bfa', g1: '#a78bfa', g2: '#8b5cf6' },
  rain:     { order: 5, label: 'Pioggia',     emoji: '🌧️', color: '#60a5fa', g1: '#60a5fa', g2: '#3b82f6' },
  light:    { order: 6, label: 'Sole e Luce', emoji: '☀️', color: '#facc15', g1: '#facc15', g2: '#eab308' },
  lightning:{ order: 7, label: 'Fulmini',     emoji: '⚡', color: '#a855f7', g1: '#a855f7', g2: '#7c3aed' },
  battery:  { order: 9, label: 'Batterie',    emoji: '🔋', color: '#94a3b8', g1: '#94a3b8', g2: '#64748b' },
  other:    { order: 8, label: 'Altri',       emoji: '📊', color: '#a1a1aa', g1: '#a1a1aa', g2: '#71717a' },
}

/* Pirate Weather condition → emoji/label/gruppo cielo */
const COND = {
  'clear-day':          { e: '☀️', l: 'Sereno',         g: 'clear' },
  'clear-night':        { e: '🌙', l: 'Sereno',         g: 'clear' },
  'partly-cloudy-day':  { e: '⛅', l: 'Parz. nuvoloso', g: 'partly' },
  'partly-cloudy-night':{ e: '☁️', l: 'Parz. nuvoloso', g: 'partly' },
  'cloudy':             { e: '☁️', l: 'Nuvoloso',       g: 'cloudy' },
  'rain':               { e: '🌧️', l: 'Pioggia',        g: 'rain' },
  'snow':               { e: '❄️', l: 'Neve',           g: 'snow' },
  'sleet':              { e: '🌨️', l: 'Nevischio',      g: 'rain' },
  'wind':               { e: '💨', l: 'Ventoso',        g: 'partly' },
  'fog':                { e: '🌫️', l: 'Nebbia',         g: 'fog' },
  'thunderstorm':       { e: '⛈️', l: 'Temporali',      g: 'thunder' },
  'hail':               { e: '🌨️', l: 'Grandine',       g: 'snow' },
  'tornado':            { e: '🌪️', l: 'Tornado',        g: 'thunder' },
}

/* condizioni del dominio weather.* (vocabolario Home Assistant) */
const HACOND = {
  'sunny':          { e: '☀️', l: 'Sereno',         g: 'clear' },
  'clear-night':    { e: '🌙', l: 'Sereno',         g: 'clear' },
  'partlycloudy':   { e: '⛅', l: 'Parz. nuvoloso', g: 'partly' },
  'cloudy':         { e: '☁️', l: 'Nuvoloso',       g: 'cloudy' },
  'rainy':          { e: '🌧️', l: 'Pioggia',        g: 'rain' },
  'pouring':        { e: '🌧️', l: 'Pioggia forte',  g: 'rain' },
  'lightning':      { e: '⛈️', l: 'Temporali',      g: 'thunder' },
  'lightning-rainy':{ e: '⛈️', l: 'Temporali',      g: 'thunder' },
  'snowy':          { e: '❄️', l: 'Neve',           g: 'snow' },
  'snowy-rainy':    { e: '🌨️', l: 'Nevischio',      g: 'rain' },
  'hail':           { e: '🌨️', l: 'Grandine',       g: 'snow' },
  'fog':            { e: '🌫️', l: 'Nebbia',         g: 'fog' },
  'windy':          { e: '💨', l: 'Ventoso',        g: 'partly' },
  'windy-variant':  { e: '💨', l: 'Ventoso',        g: 'partly' },
  'exceptional':    { e: '⚠️', l: 'Estremo',        g: 'cloudy' },
}
function condInfo(c) { if (!c) return null; return COND[c] || HACOND[String(c).toLowerCase()] || null }

function skyTheme(cond, sunSt) {
  const grp = (condInfo(cond)?.g) || 'clear'
  const elev = num(sunSt?.attributes?.elevation)
  const below = String(sunSt?.state || '').toLowerCase().includes('below')
  let phase = 'day'
  if (elev != null) { phase = elev < -6 ? 'night' : (elev <= 8 ? 'golden' : 'day') }
  else if (below) phase = 'night'
  const G = {
    clear:   { day: 'linear-gradient(170deg,#2476e6,#4f9bf0 45%,#9fccf6)', golden: 'linear-gradient(170deg,#1e3a8a,#9333ea 28%,#f97316 72%,#fbbf24)', night: 'linear-gradient(170deg,#070b1e,#152554 55%,#243b6b)' },
    partly:  { day: 'linear-gradient(170deg,#3a82e6,#76aeea 55%,#c7e0f6)', golden: 'linear-gradient(170deg,#312e81,#a855f7 35%,#fb923c 80%,#fcd34d)', night: 'linear-gradient(170deg,#0c1226,#1e293b 60%,#334155)' },
    cloudy:  { day: 'linear-gradient(170deg,#516378,#6b7d92 55%,#9aa9bb)', golden: 'linear-gradient(170deg,#475569,#b45309 80%,#f59e0b)', night: 'linear-gradient(170deg,#1a2230,#2b3647)' },
    rain:    { day: 'linear-gradient(170deg,#2f3e52,#445064 55%,#5b6b80)', golden: 'linear-gradient(170deg,#283548,#475569)', night: 'linear-gradient(170deg,#10151f,#1f2937)' },
    thunder: { day: 'linear-gradient(170deg,#241f4d,#3730a3 55%,#4c1d95)', golden: 'linear-gradient(170deg,#1e1b4b,#4c1d95)', night: 'linear-gradient(170deg,#0a081f,#1e1b4b)' },
    snow:    { day: 'linear-gradient(170deg,#64748b,#94a3b8 55%,#d7dee8)', golden: 'linear-gradient(170deg,#475569,#94a3b8)', night: 'linear-gradient(170deg,#1e293b,#475569)' },
    fog:     { day: 'linear-gradient(170deg,#6b7686,#94a3b8 55%,#c2cad6)', golden: 'linear-gradient(170deg,#57534e,#a8a29e)', night: 'linear-gradient(170deg,#262d39,#475569)' },
  }
  return { gradient: (G[grp] || G.clear)[phase], phase, grp }
}

const CSS_M = `
:host{display:block}
*{box-sizing:border-box;margin:0;padding:0}
.card{background:var(--ha-card-background,#0e0e12);border-radius:20px;overflow:hidden;
  font-family:var(--primary-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif);
  box-shadow:0 8px 40px rgba(0,0,0,.35);padding:14px;display:flex;flex-direction:column;gap:12px}
/* HERO */
.hero{position:relative;overflow:hidden;border-radius:24px;min-height:214px;box-shadow:0 12px 34px rgba(0,0,0,.28)}
.sky{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.hov{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,0) 32%,rgba(0,0,0,.30))}
.hc{position:relative;z-index:2;padding:15px 18px 14px;color:#fff}
.hloc{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:700;letter-spacing:.3px;text-shadow:0 1px 8px rgba(0,0,0,.35);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hcond{font-size:46px;line-height:1;filter:drop-shadow(0 3px 10px rgba(0,0,0,.4));animation:wxFloat 5s ease-in-out infinite}
.htop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.htemp{font-size:70px;font-weight:300;line-height:.95;letter-spacing:-2px;text-shadow:0 2px 20px rgba(0,0,0,.3)}
.htu{font-size:30px;font-weight:300}
.hmeta{display:flex;align-items:center;gap:12px;margin-top:3px;flex-wrap:wrap}
.hlbl{font-size:14px;font-weight:600;text-shadow:0 1px 8px rgba(0,0,0,.35)}
.hhl{font-size:13px;font-weight:700;opacity:.95}
.hfeel{font-size:12px;opacity:.85}
.chips{display:flex;gap:7px;margin-top:14px}
.chip{flex:1;min-width:0;border:none;cursor:default;background:rgba(255,255,255,.14);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-radius:14px;padding:9px 6px;
  display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
.chip .cv{font-size:15px;font-weight:800;color:#fff;line-height:1;white-space:nowrap}
.chip .cu{font-size:9px;font-weight:600;opacity:.8;margin-left:1px}
.chip .cl{font-size:8.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.72)}
.chip .ce{font-size:14px;line-height:1}
/* sky elements */
.sun{position:absolute;top:-16px;right:-4px;width:72px;height:72px;border-radius:50%;
  background:radial-gradient(circle,#fff6c2,#fde047 55%,#fbbf24);animation:wxSun 4s ease-in-out infinite}
.moon{position:absolute;top:-4px;right:8px;width:54px;height:54px;border-radius:50%;
  background:radial-gradient(circle at 36% 34%,#f8fafc,#e2e8f0 60%,#cbd5e1);box-shadow:0 0 30px 6px rgba(226,232,240,.5)}
.star{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;animation:wxTwinkle 2.5s ease-in-out infinite}
.cloud{position:absolute;left:0;border-radius:999px;background:rgba(255,255,255,.6);filter:blur(7px);animation:wxDrift linear infinite}
.drop{position:absolute;top:-30px;width:1.5px;height:17px;border-radius:2px;background:rgba(255,255,255,.55);animation:wxFall linear infinite}
.flake{position:absolute;top:-20px;border-radius:50%;background:rgba(255,255,255,.9);animation:wxSnow linear infinite}
.flash{position:absolute;inset:0;background:rgba(255,255,255,.9);animation:wxFlash 7s ease-in-out infinite}
@keyframes wxDrift{from{transform:translateX(-35%)}to{transform:translateX(135%)}}
@keyframes wxFall{0%{transform:translateY(-30px);opacity:0}12%{opacity:.7}100%{transform:translateY(260px);opacity:0}}
@keyframes wxSnow{0%{transform:translateY(-20px) translateX(0);opacity:0}12%{opacity:.95}100%{transform:translateY(260px) translateX(26px);opacity:0}}
@keyframes wxTwinkle{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes wxSun{0%,100%{box-shadow:0 0 44px 12px rgba(253,224,71,.55)}50%{box-shadow:0 0 72px 22px rgba(253,224,71,.85)}}
@keyframes wxFlash{0%,88%,100%{opacity:0}90%,94%{opacity:.85}}
@keyframes wxFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes spin{to{transform:rotate(360deg)}}
/* FORECAST */
.fcrow{display:flex;gap:8px}
.fcday{flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:10px 8px;text-align:center}
.fcd-l{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:#94a3b8}
.fcd-e{font-size:30px;line-height:1.1;margin:2px 0}
.fcd-c{font-size:10px;color:#cbd5e1;font-weight:600;min-height:13px}
.fcd-t{font-size:13px;font-weight:800;color:#f1f5f9;margin-top:3px}
.fcd-p{font-size:10px;color:#60a5fa;font-weight:700;margin-top:2px}
/* GRID categorie */
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
@media(max-width:640px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.cat{border-radius:18px;padding:1px;background:linear-gradient(140deg,var(--c1),var(--c2));position:relative}
.cat-in{background:var(--ha-card-background,#16161b);border-radius:17px;padding:12px;display:flex;flex-direction:column;gap:8px;height:100%}
.cat-hd{display:flex;align-items:center;gap:9px}
.cat-ic{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;
  background:linear-gradient(140deg,var(--c1),var(--c2));box-shadow:0 4px 12px rgba(0,0,0,.25)}
.cat-tt{flex:1;min-width:0}
.cat-nm{font-size:13px;font-weight:800;color:#f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cat-ct{font-size:9px;color:#8b8b96;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.cat-big{font-size:20px;font-weight:900;letter-spacing:-.5px}
.cat-bu{font-size:11px;font-weight:600;opacity:.6;margin-left:1px}
.rows{display:flex;flex-direction:column}
.row{display:flex;align-items:center;gap:8px;padding:6px 2px;border-bottom:1px solid rgba(255,255,255,.05)}
.row:last-child{border-bottom:none}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.rl{font-size:11.5px;color:#cbd5e1;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rv{font-size:13px;font-weight:800;color:#f8fafc;white-space:nowrap}
.ru{font-size:10px;font-weight:600;color:#8b8b96;margin-left:2px}
.hdr{display:flex;align-items:center;gap:10px;padding:2px 2px 0}
.hdr .hi{width:38px;height:38px;border-radius:12px;background:linear-gradient(140deg,#38bdf8,#818cf8);display:flex;align-items:center;justify-content:center;font-size:20px}
.hdr .ht{font-size:15px;font-weight:800;color:#f1f5f9}
.hdr .hs{font-size:10px;font-weight:600;color:#8b8b96;text-transform:uppercase;letter-spacing:.5px}
.empty{padding:30px;text-align:center;color:#8b8b96;font-size:13px}
/* BADGE compatto (vista esterna) */
.badge{display:flex;flex-direction:column;gap:10px;padding:12px 14px;cursor:pointer;border-radius:18px;
  background:linear-gradient(135deg,#1b1b24,#141419);border:1px solid rgba(255,255,255,.08);
  box-shadow:0 8px 30px rgba(0,0,0,.35);transition:transform .15s,box-shadow .15s}
.badge:hover{transform:translateY(-1px);box-shadow:0 12px 36px rgba(0,0,0,.45)}
.b-main{display:flex;align-items:center;gap:12px}
.b-ico{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;
  background:linear-gradient(135deg,#38bdf8,#6366f1);box-shadow:0 6px 16px rgba(56,189,248,.3)}
.b-tt{min-width:0}
.b-nm{font-size:14px;font-weight:800;color:#f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.b-sb{font-size:10px;font-weight:700;color:#8b8b96;text-transform:uppercase;letter-spacing:.5px;margin-top:1px}
.b-stats{margin-left:auto;display:flex;align-items:center;gap:13px;flex-shrink:0}
.b-st{display:flex;align-items:center;gap:5px}
.b-se{font-size:15px;line-height:1}
.b-sv{font-size:16px;font-weight:800;color:#f8fafc;line-height:1;white-space:nowrap}
.b-su{font-size:10px;color:#8b8b96;font-weight:600;margin-left:1px}
.b-chev{font-size:14px;color:#5b5b66;margin-left:2px}
@media(max-width:430px){.b-st .b-su{display:none}.b-stats{gap:9px}}
/* striscia previsioni prossimi giorni */
.days{display:flex;gap:6px}
.day{flex:1;min-width:0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06);border-radius:12px;
  padding:7px 4px;display:flex;flex-direction:column;align-items:center;gap:1px}
.day.t0{background:rgba(99,102,241,.16);border-color:rgba(129,140,248,.3)}
.day-l{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#9aa0ac}
.day-e{font-size:21px;line-height:1.25}
.day-h{font-size:12px;font-weight:800;color:#f1f5f9}
.day-c{font-size:10px;font-weight:600;color:#7f8794}
.day-p{font-size:9px;font-weight:700;color:#60a5fa}
.days-bd{display:flex;gap:8px}
.days-bd .day{padding:10px 6px;gap:2px}
.days-bd .day-e{font-size:28px}
.days-bd .day-h{font-size:13px}
/* POPUP */
.ov{position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  display:flex;align-items:flex-end;justify-content:center;animation:ovIn .2s ease}
.sheet{width:97vw;max-width:1380px;max-height:96vh;overflow-y:auto;-webkit-overflow-scrolling:touch;
  background:#0c0c10;border-radius:22px;box-shadow:0 20px 70px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.08);
  padding:8px 16px 28px;display:flex;flex-direction:column;gap:12px;animation:sheetIn .32s cubic-bezier(.22,1,.36,1);
  scrollbar-width:none}
.sheet::-webkit-scrollbar{display:none}
.grab{width:40px;height:4px;border-radius:2px;background:#3f3f46;margin:4px auto 2px;flex-shrink:0}
.close{position:absolute;top:14px;right:16px;width:32px;height:32px;border-radius:50%;border:none;cursor:pointer;z-index:5;
  background:rgba(255,255,255,.1);color:#fafafa;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center}
@keyframes ovIn{from{opacity:0}to{opacity:1}}
@keyframes sheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}}
.pop-t{font-size:12px;font-weight:800;letter-spacing:.4px;color:#cfe0e6;margin:8px 2px -2px}
.cat-scene{display:flex;align-items:center;justify-content:center;padding:8px 0 10px}
.cat-scene svg{max-width:100%;width:100%;height:auto;max-height:230px}
/* keyframes/classi scene (fedeli all'Oikos) */
@keyframes wx-fall{0%{transform:translateY(-6px);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(18px);opacity:0}}
@keyframes wx-wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
@keyframes wx-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes wx-driftx{0%,100%{transform:translateX(-7px)}50%{transform:translateX(7px)}}
.wx-sun-rays{animation:wx-spin 22s linear infinite;transform-box:fill-box;transform-origin:50% 50%}
.wx-cups{transform-box:fill-box;transform-origin:50% 50%;will-change:transform}
.wx-mercury{transition:y 1s cubic-bezier(.4,0,.2,1),height 1s cubic-bezier(.4,0,.2,1)}
.windy-wrap{display:flex;flex-direction:column;gap:7px}
.windy-ov{display:flex;gap:6px;flex-wrap:wrap}
.wov{padding:5px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#9fb2bb;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}
.wov.on{background:linear-gradient(135deg,#38bdf8,#6366f1);color:#fff;border-color:transparent}
.windy{width:100%;height:440px;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.08);box-shadow:0 6px 18px rgba(0,0,0,.3)}
.windy iframe{width:100%;height:100%;display:block;border:none}
/* ===== MAIN CARD (vista principale, stile Apple/iOS) ===== */
.wcard{position:relative;overflow:hidden;border-radius:22px;padding:16px 16px 14px;cursor:pointer;
  background:linear-gradient(160deg,#16262d,#1b2d34 55%,#15232a);
  border:1px solid rgba(255,255,255,.06);box-shadow:0 10px 34px rgba(0,0,0,.4)}
.wc-tint{position:absolute;inset:0;pointer-events:none;z-index:0;background:linear-gradient(180deg,rgba(10,16,22,.42) 0%,rgba(10,16,22,.6) 55%,rgba(10,16,22,.8) 100%)}
.w-sky{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1}
.wc-cloud{position:absolute;border-radius:999px;background:rgba(255,255,255,.05);filter:blur(11px);pointer-events:none;animation:wxDrift 40s linear infinite}
.w-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;position:relative;z-index:2}
.w-loc{font-size:22px;font-weight:800;color:#fff;letter-spacing:.4px;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.w-sub{font-size:12px;color:#9fb2bb;margin-top:2px}
.w-sub b{color:#dbe7ec;font-style:italic;font-weight:700}
.gear{flex-shrink:0;width:32px;height:32px;border-radius:10px;border:none;cursor:pointer;background:rgba(255,255,255,.07);color:#cfe0e6;display:flex;align-items:center;justify-content:center}
.gear:hover{background:rgba(255,255,255,.15)}
.w-cur{display:flex;align-items:center;gap:14px;margin:8px 0 14px;position:relative;z-index:2}
.w-glyph{width:72px;height:72px;flex-shrink:0;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))}
.w-temp{font-size:50px;font-weight:800;color:#fff;line-height:1;letter-spacing:-1px}
.w-temp .deg{font-size:26px;font-weight:700;opacity:.85;margin-left:1px}
.w-curl{font-size:11px;color:#9fb2bb;font-weight:600;margin-top:3px}
.w-clock{margin-left:auto;text-align:right;flex-shrink:0;align-self:flex-start;padding-top:4px;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.wk-t{font-size:30px;font-weight:800;color:#fff;letter-spacing:-.5px;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.wk-s{font-size:15px;font-weight:700;color:#9fb2bb;margin-left:1px;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.wk-l{font-size:9px;font-weight:700;letter-spacing:.6px;color:#8aa0a9;text-transform:uppercase;margin-top:1px}
.w-chips{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;position:relative;z-index:2}
.wchip{background:rgba(56,189,248,.07);border:1px solid rgba(56,189,248,.18);border-radius:14px;padding:11px 6px;display:flex;flex-direction:column;align-items:center;gap:6px}
.wci{width:20px;height:20px;color:#7dd3fc}
.wcv{font-size:15px;font-weight:800;color:#fff;line-height:1}
.wcl{font-size:8.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#8aa0a9}
.w-dhd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:16px 2px 9px;cursor:pointer;position:relative;z-index:2}
.w-dhl{font-size:10px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#8aa0a9}
.w-chev{color:#8aa0a9;transition:transform .25s;font-size:13px;font-weight:900}
.w-chev.op{transform:rotate(180deg)}
.w-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;position:relative;z-index:2;overflow:hidden;transition:max-height .35s ease,opacity .25s}
.wday{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:8px 2px;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}
.wday.t0{background:linear-gradient(180deg,rgba(56,189,248,.16),rgba(56,189,248,.04));border-color:rgba(56,189,248,.4)}
.wd-l{font-size:8px;font-weight:800;letter-spacing:.2px;color:#9fb2bb}
.wday.t0 .wd-l{color:#7dd3fc}
.wd-g{font-size:19px;line-height:1.1;animation:wxFloat 4s ease-in-out infinite}
.wd-h{font-size:12px;font-weight:800;color:#fff}
.wd-bar{width:86%;height:4px;border-radius:3px;background:rgba(255,255,255,.13);position:relative;margin:2px 0}
.wd-fill{position:absolute;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,#38bdf8,#f59e0b)}
.wd-lo{font-size:10px;color:#8aa0a9;font-weight:600}
.wd-p{font-size:8px;color:#60a5fa;font-weight:700;white-space:nowrap}
/* animazioni icone */
.an-spin{animation:spin 16s linear infinite}
.an-pulse{animation:wxPulse 3s ease-in-out infinite}
.an-slide{animation:wxSlide 2.4s ease-in-out infinite}
.an-drop2{animation:wxFall2 1.1s linear infinite}
@keyframes wxPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.13)}}
@keyframes wxSlide{0%,100%{transform:translateX(-2px);opacity:.55}50%{transform:translateX(2px);opacity:1}}
@keyframes wxFall2{0%{transform:translateY(-4px);opacity:0}30%{opacity:1}100%{transform:translateY(10px);opacity:0}}
/* ===== SETTINGS popup ===== */
.sov{position:fixed;inset:0;z-index:99992;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:18px;animation:ovIn .2s ease}
.spanel{width:100%;max-width:430px;max-height:88vh;overflow-y:auto;background:#12141a;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.6);scrollbar-width:none}
.spanel::-webkit-scrollbar{display:none}
.sp-t{font-size:16px;font-weight:800;color:#f1f5f9}
.sp-s{font-size:11px;color:#8aa0a9;margin-bottom:14px}
.sp-f{margin-bottom:11px}
.sp-l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#8aa0a9;margin-bottom:4px;display:block}
.sp-sel{width:100%;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#1b1e26;color:#f1f5f9;font-size:13px;font-family:inherit;padding:0 10px}
.sp-row{display:flex;gap:8px;margin-top:16px}
.sp-btn{flex:1;height:38px;border-radius:11px;border:none;cursor:pointer;font-size:13px;font-weight:800;font-family:inherit}
.sp-save{background:linear-gradient(135deg,#38bdf8,#6366f1);color:#fff}
.sp-cancel{background:rgba(255,255,255,.08);color:#cfe0e6}
`

/* genera elementi cielo come HTML */
function skyHTML(grp, phase) {
  let h = ''
  const clear = grp === 'clear' || grp === 'partly'
  if (clear && phase !== 'night') h += `<div class="sun"></div>`
  if (clear && phase === 'night') h += `<div class="moon"></div>`
  if (phase === 'night') {
    for (let i = 0; i < 22; i++) {
      const x = (i * 53) % 100, y = (i * 31) % 58, dur = 2 + (i % 3), del = (i % 5) * 0.4
      h += `<div class="star" style="left:${x}%;top:${y}%;animation-duration:${dur}s;animation-delay:${del}s"></div>`
    }
  }
  if (['partly', 'cloudy', 'rain', 'thunder', 'fog'].includes(grp)) {
    const op = (grp === 'cloudy' || grp === 'fog') ? 0.82 : 0.55
    const tops = [6, 30, 50], durs = [28, 36, 32], dels = [0, -14, -24], ws = [120, 92, 150]
    for (let i = 0; i < 3; i++) {
      h += `<div class="cloud" style="top:${tops[i]}%;width:${ws[i]}px;height:${ws[i] * 0.36}px;background:rgba(255,255,255,${op});animation-duration:${durs[i]}s;animation-delay:${dels[i]}s"></div>`
    }
  }
  if (grp === 'rain' || grp === 'thunder') {
    for (let i = 0; i < 28; i++) {
      const x = (i * 3.6) % 100, dur = 0.55 + (i % 4) * 0.12, del = -(i % 10) * 0.16
      h += `<div class="drop" style="left:${x}%;animation-duration:${dur}s;animation-delay:${del}s"></div>`
    }
  }
  if (grp === 'snow') {
    for (let i = 0; i < 22; i++) {
      const x = (i * 4.7) % 100, dur = 3 + (i % 4) * 0.8, del = -(i % 8) * 0.5, sz = 3 + (i % 3)
      h += `<div class="flake" style="left:${x}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${del}s"></div>`
    }
  }
  if (grp === 'thunder') h += `<div class="flash"></div>`
  return h
}

/* ---------- icone animate (SVG + CSS) ---------- */
const SVG_GEAR = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
const ST = 'fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round'
function svgHum() { return `<svg class="wci" viewBox="0 0 24 24" style="${ST}"><path class="an-pulse" style="transform-origin:12px 13px" d="M12 2.7s6 6.3 6 10.3a6 6 0 0 1-12 0c0-4 6-10.3 6-10.3z"/></svg>` }
function svgPress() { return `<svg class="wci" viewBox="0 0 24 24" style="${ST}"><path d="M4 13a8 8 0 1 1 16 0"/><line class="an-slide" x1="12" y1="13" x2="15.5" y2="9.5"/></svg>` }
function svgWind() { return `<svg class="wci" viewBox="0 0 24 24" style="${ST}"><path class="an-slide" d="M3 8h10a2.4 2.4 0 1 0-2.4-2.4"/><path class="an-slide" style="animation-delay:.3s" d="M3 12h14a2.4 2.4 0 1 1-2.4 2.4"/><path class="an-slide" style="animation-delay:.6s" d="M3 16h8"/></svg>` }
function svgDir(deg) { const d = Number(deg) || 0; return `<svg class="wci" viewBox="0 0 24 24" style="${ST};transform:rotate(${d}deg);transition:transform .6s ease"><line x1="12" y1="20" x2="12" y2="5"/><polyline points="6 11 12 5 18 11"/></svg>` }

function wxGlyph(grp) {
  const cloud = (col) => `<g class="an-float" fill="${col}"><circle cx="26" cy="43" r="11"/><circle cx="40" cy="39" r="14"/><circle cx="52" cy="44" r="9"/><rect x="24" y="45" width="33" height="13" rx="6.5"/></g>`
  const sun = (cx, cy, r) => {
    let ry = ''
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ry += `<line x1="${(cx + (r + 4) * Math.cos(a)).toFixed(1)}" y1="${(cy + (r + 4) * Math.sin(a)).toFixed(1)}" x2="${(cx + (r + 9) * Math.cos(a)).toFixed(1)}" y2="${(cy + (r + 9) * Math.sin(a)).toFixed(1)}"/>` }
    return `<g class="an-spin" style="transform-origin:${cx}px ${cy}px" stroke="#fcd34d" stroke-width="3" stroke-linecap="round">${ry}</g><circle class="an-pulse" style="transform-origin:${cx}px ${cy}px" cx="${cx}" cy="${cy}" r="${r}" fill="#fcd34d"/>`
  }
  const drops = (col) => { let d = ''; for (let i = 0; i < 3; i++) { const x = 29 + i * 9; d += `<line class="an-drop2" style="animation-delay:${(i * 0.25).toFixed(2)}s" x1="${x}" y1="54" x2="${x - 2}" y2="61" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>` } return d }
  const o = `<svg viewBox="0 0 72 72" width="72" height="72" fill="none">`
  if (grp === 'clear') return `${o}${sun(36, 34, 13)}</svg>`
  if (grp === 'partly') return `${o}${sun(24, 24, 9)}${cloud('#dbe4ec')}</svg>`
  if (grp === 'cloudy') return `${o}${cloud('#c3cdd8')}</svg>`
  if (grp === 'fog') return `${o}${cloud('#c3cdd8')}<g class="an-slide" stroke="#9fb2bb" stroke-width="2.4" stroke-linecap="round"><line x1="22" y1="63" x2="50" y2="63"/></g></svg>`
  if (grp === 'rain') return `${o}${cloud('#aebccb')}${drops('#7dd3fc')}</svg>`
  if (grp === 'snow') { let f = ''; for (let i = 0; i < 3; i++) { const x = 29 + i * 9; f += `<circle class="an-pulse" style="animation-delay:${(i * 0.3).toFixed(2)}s" cx="${x}" cy="57" r="2.4" fill="#e0f2fe"/>` } return `${o}${cloud('#c3cdd8')}${f}</svg>` }
  if (grp === 'thunder') return `${o}${cloud('#9aa6b4')}<polygon class="an-pulse" style="transform-origin:36px 58px" points="34,49 41,49 36,58 42,58 31,68 34,59 30,59" fill="#fde047"/></svg>`
  return `${o}${sun(24, 24, 9)}${cloud('#dbe4ec')}</svg>`
}

/* ---------- SCENE realistiche animate per categoria (SVG + CSS) ---------- */
let _scU = 0
const scUid = () => 's' + (++_scU)

function scThermo(items) {
  const stroke = '#3f3f46'
  const vis = items.slice(0, 4), n = Math.max(1, vis.length)
  const slotW = 74, W = slotW * n, H = 208, id = scUid()
  const min = -10, max = 45, tubeTop = 16, tubeBottom = 150, bulbY = 168, bulbR = 15
  let body = ''
  vis.forEach((it, idx) => {
    const cx = slotW * idx + slotW / 2, t = Number(it.value), valid = !isNaN(t)
    const pct = valid ? Math.max(2, Math.min(99, ((t - min) / (max - min)) * 100)) : 50
    const fillTop = tubeBottom - (pct / 100) * (tubeBottom - tubeTop)
    const isHot = valid && t >= 26, isCold = valid && t <= 6
    const grad = !valid ? id + 'g' : (isHot ? id + 'r' : isCold ? id + 'b' : id + 'o')
    const txtCol = !valid ? '#94a3b8' : (isHot ? '#f87171' : isCold ? '#60a5fa' : '#fb923c')
    let ticks = ''
    ;[-10, 0, 10, 20, 30, 40].forEach(deg => {
      const y = tubeBottom - ((deg - min) / (max - min)) * (tubeBottom - tubeTop)
      const big = deg % 20 === 0
      ticks += `<line x1="${cx + 9}" y1="${y.toFixed(1)}" x2="${cx + (big ? 15 : 12)}" y2="${y.toFixed(1)}" stroke="${stroke}" stroke-width="${big ? 1 : 0.6}" opacity="0.7"/>`
      if (big) ticks += `<text x="${cx + 17}" y="${(y + 2.4).toFixed(1)}" font-size="6.5" fill="#71717a" font-weight="700">${deg}</text>`
    })
    body += `<g>
      <rect x="${cx - 10}" y="${tubeTop - 6}" width="20" height="${bulbY - tubeTop + 6}" rx="10" fill="url(#${id}frame)" stroke="${stroke}" stroke-width="0.6"/>
      <rect x="${cx - 6}" y="${tubeTop}" width="12" height="${bulbY - tubeTop}" rx="6" fill="#0c0c10"/>
      <rect class="wx-mercury" x="${cx - 4}" y="${fillTop.toFixed(1)}" width="8" height="${(bulbY - fillTop).toFixed(1)}" rx="4" fill="url(#${grad}m)"/>
      <circle cx="${cx}" cy="${bulbY}" r="${bulbR}" fill="url(#${grad})" stroke="${stroke}" stroke-width="0.8"/>
      <ellipse cx="${cx - 4.5}" cy="${bulbY - 5}" rx="3.5" ry="4.5" fill="#fff" opacity="0.5"/>
      <rect x="${cx - 5}" y="${tubeTop + 2}" width="2" height="${bulbY - tubeTop - 8}" rx="1" fill="#fff" opacity="0.18"/>${ticks}
      <text x="${cx}" y="190" text-anchor="middle" font-size="9" font-weight="700" fill="#9aa0ac" letter-spacing="0.3">${(it.label || '').toUpperCase().slice(0, 9)}</text>
      <text x="${cx}" y="204" text-anchor="middle" font-size="14" font-weight="800" fill="${txtCol}">${valid ? t.toFixed(1) + '°' : 'n/d'}</text>
    </g>`
  })
  const bg = (gid, c1, c2) => `<radialGradient id="${gid}" cx="0.35" cy="0.32" r="0.8"><stop offset="0%" stop-color="#fff" stop-opacity="0.7"/><stop offset="45%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></radialGradient><linearGradient id="${gid}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${c2}"/><stop offset="45%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient>`
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" fill="none" style="display:block">
    <defs>
      <linearGradient id="${id}frame" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#3f3f46"/><stop offset="45%" stop-color="#71717a"/><stop offset="55%" stop-color="#52525b"/><stop offset="100%" stop-color="#18181b"/></linearGradient>
      ${bg(id + 'r', '#ef4444', '#b91c1c')}${bg(id + 'o', '#fb923c', '#c2410c')}${bg(id + 'b', '#3b82f6', '#1d4ed8')}${bg(id + 'g', '#a1a1aa', '#52525b')}
    </defs>${body}</svg>`
}

function scHygro(items) {
  const vis = items.slice(0, 4), W = 200, H = 150, slotW = W / Math.max(1, vis.length)
  const dropTop = 12, dropBottom = 115, dhw = 28, gid = scUid()
  let defs = `<linearGradient id="${gid}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0284c7"/></linearGradient>`
  let body = ''
  vis.forEach((it, idx) => {
    const cx = slotW * idx + slotW / 2, v = Math.max(0, Math.min(100, Number(it.value) || 0))
    const valid = !isNaN(Number(it.value)), fy = dropBottom - (v / 100) * (dropBottom - dropTop)
    const path = `M ${cx} ${dropTop} C ${cx - dhw * 0.8} 48 ${cx - dhw} 70 ${cx - dhw} 90 a ${dhw} ${dhw * 0.85} 0 0 0 ${dhw * 2} 0 C ${cx + dhw} 70 ${cx + dhw * 0.8} 48 ${cx} ${dropTop} Z`
    const cid = gid + 'c' + idx
    defs += `<clipPath id="${cid}"><path d="${path}"/></clipPath>`
    body += `<g>
      <path d="${path}" fill="none" stroke="#0ea5e9" stroke-width="2"/>
      <g clip-path="url(#${cid})"><rect class="wx-mercury" x="${cx - dhw - 5}" y="${fy.toFixed(1)}" width="${dhw * 2 + 10}" height="200" fill="url(#${gid}w)" opacity="0.85"/><ellipse cx="${cx}" cy="${fy.toFixed(1)}" rx="${dhw}" ry="2" fill="#7dd3fc" opacity="0.9" style="animation:wx-wave 3s ease-in-out infinite"/></g>
      <ellipse cx="${cx - 8}" cy="40" rx="3" ry="9" fill="#fff" opacity="0.55"/>
      <text x="${cx}" y="88" text-anchor="middle" font-size="16" font-weight="800" fill="${v > 60 ? '#fff' : '#fafafa'}">${valid ? Math.round(v) : '—'}<tspan font-size="10">%</tspan></text>
      <text x="${cx}" y="138" text-anchor="middle" font-size="8.5" font-weight="700" fill="#a1a1aa" letter-spacing="0.4">${(it.label || '').toUpperCase().slice(0, 12)}</text>
    </g>`
  })
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" fill="none" style="display:block"><defs>${defs}</defs>${body}</svg>`
}

function scWind(o) {
  const stroke = '#3f3f46', metal = '#52525b', metalLight = '#71717a'
  const spd = Math.max(0, Math.min(80, Number(o.speed) || 0)), dir = Number(o.dir) || 0, gust = Number(o.gust) || 0
  const dur = spd < 0.1 ? 600 : Math.max(0.3, 3 - spd * 0.08)
  const HX = 110, HY = 45, RX = 42, RY = 9, VY = 105, id = scUid()
  let arms = '', cups = ''
  for (let i = 0; i < 3; i++) {
    const a = i * 2 * Math.PI / 3, x = Math.cos(a) * RX, y = Math.sin(a) * RY
    arms += `<line class="wx-arm" data-i="${i}" x1="${HX}" y1="${HY}" x2="${(HX + x).toFixed(1)}" y2="${(HY + y).toFixed(1)}" stroke="${metal}" stroke-width="2.4" stroke-linecap="round"/>`
    cups += `<g class="wx-cup" data-i="${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><ellipse rx="7.5" ry="6" fill="url(#${id}rim)" stroke="${stroke}" stroke-width="0.5"/><ellipse cy="0.6" rx="4.8" ry="3.8" fill="url(#${id}ins)"/><ellipse cx="-2" cy="-1.5" rx="1.6" ry="1.2" fill="#fff" opacity="0.55"/></g>`
  }
  return `<svg width="100%" viewBox="0 0 220 180" fill="none" style="display:block">
    <defs>
      <linearGradient id="${id}pole" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#27272a"/><stop offset="40%" stop-color="#71717a"/><stop offset="60%" stop-color="#71717a"/><stop offset="100%" stop-color="#18181b"/></linearGradient>
      <radialGradient id="${id}rim" cx="0.35" cy="0.3" r="0.85"><stop offset="0%" stop-color="#fff"/><stop offset="60%" stop-color="#d4d4d8"/><stop offset="100%" stop-color="#52525b"/></radialGradient>
      <radialGradient id="${id}ins" cx="0.4" cy="0.4" r="0.6"><stop offset="0%" stop-color="#3f3f46"/><stop offset="100%" stop-color="#0a0a0c"/></radialGradient>
      <radialGradient id="${id}hub" cx="0.35" cy="0.35" r="0.7"><stop offset="0%" stop-color="${metalLight}"/><stop offset="100%" stop-color="#0e0e10"/></radialGradient>
      <linearGradient id="${id}vt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3f3f46"/><stop offset="100%" stop-color="#0a0a0c"/></linearGradient>
      <linearGradient id="${id}va" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#52525b"/><stop offset="100%" stop-color="#18181b"/></linearGradient>
      <linearGradient id="${id}hou" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3f3f46"/><stop offset="100%" stop-color="#18181b"/></linearGradient>
    </defs>
    <text x="110" y="13" text-anchor="middle" font-size="10" font-weight="800" fill="#ef4444">N</text>
    <rect x="106" y="52" width="8" height="100" fill="url(#${id}pole)"/>
    <ellipse cx="110" cy="53" rx="14" ry="3.5" fill="rgba(0,0,0,0.4)"/>
    <ellipse cx="110" cy="50" rx="12" ry="3" fill="url(#${id}hub)" stroke="${stroke}" stroke-width="0.4"/>
    ${arms}
    <g transform="translate(${HX} ${HY})">${cups}</g>
    <ellipse cx="110" cy="46" rx="8" ry="2.2" fill="url(#${id}hub)" stroke="${stroke}" stroke-width="0.4"/>
    <circle cx="110" cy="46" r="1.6" fill="#fff"/>
    <g transform="rotate(${dir} 110 ${VY})">
      <rect x="80" y="${VY - 2}" width="60" height="4" rx="1.5" fill="url(#${id}va)"/>
      <polygon points="148,${VY} 132,${VY - 8} 132,${VY + 8}" fill="#dc2626"/>
      <polygon points="136,${VY} 132,${VY - 5} 132,${VY + 5}" fill="#7f1d1d"/>
      <polygon points="82,${VY - 11} 92,${VY} 82,${VY + 11} 72,${VY + 11} 72,${VY - 11}" fill="url(#${id}vt)" stroke="${stroke}" stroke-width="0.5"/>
      <circle cx="110" cy="${VY}" r="4" fill="url(#${id}hub)" stroke="${stroke}" stroke-width="0.5"/>
      <circle cx="110" cy="${VY}" r="1.5" fill="#fff"/>
    </g>
    <rect x="6" y="156" width="142" height="20" rx="5" fill="#000" stroke="${stroke}" stroke-width="0.7" opacity="0.95"/>
    <text x="32" y="170" text-anchor="middle" font-size="11" font-weight="800" fill="#fafafa">${spd.toFixed(1)}<tspan font-size="6" fill="#a1a1aa"> km/h</tspan></text>
    <text x="80" y="170" text-anchor="middle" font-size="11" font-weight="800" fill="#ef4444">${Math.round(dir)}°</text>
    <text x="124" y="170" text-anchor="middle" font-size="11" font-weight="800" fill="#facc15">${gust.toFixed(1)}<tspan font-size="6" fill="#a1a1aa"> raff.</tspan></text>
    <rect x="153" y="156" width="60" height="20" rx="4" fill="url(#${id}hou)" stroke="${stroke}" stroke-width="0.5"/>
    <text x="183" y="169" text-anchor="middle" font-size="9" font-weight="800" fill="#22c55e">GW1100A</text>
  </svg>`
}

function scBaro(v) {
  const stroke = '#52525b', p = Number(v) || 1013, min = 970, max = 1050
  const angle = ((p - min) / (max - min)) * 270 - 135
  let weather = 'VARIABILE', wColor = '#059669'
  if (p < 985) { weather = 'TEMPESTA'; wColor = '#7c2d12' }
  else if (p < 1000) { weather = 'PIOGGIA'; wColor = '#1d4ed8' }
  else if (p < 1015) { weather = 'VARIABILE'; wColor = '#059669' }
  else if (p < 1030) { weather = 'BEL TEMPO'; wColor = '#d97706' }
  else { weather = 'SERENO'; wColor = '#b45309' }
  const id = scUid()
  let ticks = ''
  for (let i = 0; i < 41; i++) { const ang = -135 + (i * 270 / 40), a = ang * Math.PI / 180, big = i % 5 === 0, r1 = big ? 46 : 50; ticks += `<line x1="${(110 + Math.cos(a) * r1).toFixed(1)}" y1="${(72 + Math.sin(a) * r1).toFixed(1)}" x2="${(110 + Math.cos(a) * 54).toFixed(1)}" y2="${(72 + Math.sin(a) * 54).toFixed(1)}" stroke="${stroke}" stroke-width="${big ? 1.4 : 0.7}" opacity="0.8"/>` }
  let nums = ''
  ;[980, 1000, 1020, 1040].forEach(val => { const a = (((val - min) / (max - min)) * 270 - 135) * Math.PI / 180; nums += `<text x="${(110 + Math.cos(a) * 39).toFixed(1)}" y="${(72 + Math.sin(a) * 39 + 3).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="${stroke}">${val}</text>` })
  return `<svg width="100%" viewBox="0 0 220 180" fill="none" style="display:block">
    <defs>
      <radialGradient id="${id}bg" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="#27272a"/><stop offset="70%" stop-color="#1a1a1d"/><stop offset="100%" stop-color="#0e0e10"/></radialGradient>
      <radialGradient id="${id}fr" cx="0.3" cy="0.3" r="0.7"><stop offset="0%" stop-color="#a1a1aa"/><stop offset="50%" stop-color="#71717a"/><stop offset="100%" stop-color="#27272a"/></radialGradient>
      <radialGradient id="${id}gl" cx="0.3" cy="0.2" r="0.5"><stop offset="0%" stop-color="#fff" stop-opacity="0.35"/><stop offset="60%" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <circle cx="110" cy="72" r="68" fill="url(#${id}fr)"/>
    <circle cx="110" cy="72" r="63" fill="#18181b" opacity="0.4"/>
    <circle cx="110" cy="72" r="58" fill="url(#${id}bg)"/>${ticks}${nums}
    <g transform="rotate(${(angle + 90).toFixed(1)} 110 72)"><polygon points="110,18 113,72 107,72" fill="#facc15"/><polygon points="110,86 112,72 108,72" fill="${stroke}" opacity="0.5"/></g>
    <circle cx="110" cy="72" r="5" fill="${stroke}"/><circle cx="110" cy="72" r="2" fill="#fde047"/>
    <ellipse cx="88" cy="48" rx="26" ry="14" fill="url(#${id}gl)"/>
    <rect x="10" y="148" width="200" height="26" rx="6" fill="#000" stroke="${stroke}" stroke-width="0.7" opacity="0.95"/>
    <text x="60" y="164" text-anchor="middle" font-size="13" font-weight="800" fill="#fafafa">${p.toFixed(1)}<tspan font-size="7" fill="${stroke}"> hPa</tspan></text>
    <text x="158" y="164" text-anchor="middle" font-size="12" font-weight="800" fill="${wColor}" letter-spacing="0.5">${weather}</text>
  </svg>`
}

function scRain(o) {
  const stroke = '#52525b', r = Math.max(0, Math.min(50, Number(o.rate) || 0)), dayMm = Math.max(0, Number(o.daily) || 0), maxMm = 50
  const cylTop = 50, cylBottom = 140, fillTop = cylBottom - Math.min(1, dayMm / maxMm) * (cylBottom - cylTop)
  const dropCount = r === 0 ? 0 : Math.max(4, Math.min(12, Math.round(4 + r * 0.5))), dur = Math.max(0.4, 1.4 - r * 0.03), id = scUid()
  let drops = ''
  for (let i = 0; i < dropCount; i++) { const x = 80 + (i * 9) % 60 + (i * 7) % 5, delay = -(i * dur / dropCount); drops += `<line x1="${x}" y1="35" x2="${x - 3}" y2="48" stroke="#60a5fa" stroke-width="1.6" stroke-linecap="round" style="animation:wx-fall ${dur}s linear infinite;animation-delay:${delay.toFixed(2)}s"/>` }
  let scale = ''
  ;[0, 10, 20, 30, 40, 50].forEach(mm => { const y = cylBottom - (mm / maxMm) * (cylBottom - cylTop); scale += `<line x1="130" y1="${y.toFixed(1)}" x2="136" y2="${y.toFixed(1)}" stroke="${stroke}" stroke-width="0.8"/><text x="140" y="${(y + 2.5).toFixed(1)}" font-size="6.5" font-weight="600" fill="${stroke}">${mm}</text>` })
  return `<svg width="100%" viewBox="0 0 220 175" fill="none" style="display:block">
    <defs><linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60a5fa" stop-opacity="0.7"/><stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.95"/></linearGradient>
    <clipPath id="${id}c"><path d="M 90 ${cylTop} L 90 ${cylBottom} a 20 6 0 0 0 40 0 L 130 ${cylTop} Z"/></clipPath></defs>
    <g><ellipse cx="110" cy="32" rx="42" ry="12" fill="#3f3f46" opacity="0.85"/><circle cx="90" cy="28" r="13" fill="#52525b"/><circle cx="112" cy="22" r="16" fill="#71717a"/><circle cx="132" cy="29" r="12" fill="#3f3f46"/></g>${drops}
    <path d="M 72 ${cylTop} L 90 ${cylTop + 14} L 130 ${cylTop + 14} L 148 ${cylTop} Z" fill="#52525b" stroke="${stroke}" stroke-width="1"/>
    <path d="M 90 ${cylTop} L 90 ${cylBottom} a 20 6 0 0 0 40 0 L 130 ${cylTop}" fill="#1a1a1d" stroke="${stroke}" stroke-width="1.2"/>
    <ellipse cx="110" cy="${cylTop}" rx="20" ry="6" fill="#27272a" stroke="${stroke}" stroke-width="1.2"/>
    <g clip-path="url(#${id}c)"><rect class="wx-mercury" x="88" y="${fillTop.toFixed(1)}" width="44" height="${cylBottom - cylTop + 10}" fill="url(#${id}w)"/><ellipse cx="110" cy="${fillTop.toFixed(1)}" rx="20" ry="2.5" fill="#3b82f6" opacity="0.85" style="animation:wx-wave 2.6s ease-in-out infinite"/></g>${scale}
    <text x="155" y="93" font-size="7" font-weight="700" fill="${stroke}" transform="rotate(90 155 93)">mm</text>
    <ellipse cx="110" cy="${cylBottom + 8}" rx="28" ry="4" fill="#52525b" opacity="0.6"/>
    <rect x="12" y="153" width="196" height="20" rx="5" fill="#000" stroke="${stroke}" stroke-width="0.8" opacity="0.95"/>
    <text x="60" y="168" text-anchor="middle" font-size="11" font-weight="800" fill="#fafafa">${r.toFixed(1)} <tspan font-size="7" fill="${stroke}">mm/h</tspan></text>
    <text x="160" y="168" text-anchor="middle" font-size="11" font-weight="800" fill="#3b82f6">${dayMm.toFixed(1)} <tspan font-size="7" fill="${stroke}">mm oggi</tspan></text>
  </svg>`
}

function scUV(o) {
  const stroke = '#52525b', uvVal = Math.max(0, Math.min(11, Number(o.uv) || 0))
  const levels = [{ max: 2, color: '#10b981', label: 'BASSO' }, { max: 5, color: '#facc15', label: 'MODERATO' }, { max: 7, color: '#f97316', label: 'ALTO' }, { max: 10, color: '#ef4444', label: 'MOLTO ALTO' }, { max: 11, color: '#7c3aed', label: 'ESTREMO' }]
  const cur = levels.find(l => uvVal <= l.max) || levels[4], segH = 22, id = scUid()
  let rays = ''
  for (let i = 0; i < 14; i++) { const a = (i * 360 / 14) * Math.PI / 180, r1 = 28, r2 = uvVal > 7 ? 44 : uvVal > 3 ? 40 : 36; rays += `<line x1="${(60 + Math.cos(a) * r1).toFixed(1)}" y1="${(55 + Math.sin(a) * r1).toFixed(1)}" x2="${(60 + Math.cos(a) * r2).toFixed(1)}" y2="${(55 + Math.sin(a) * r2).toFixed(1)}" stroke="${cur.color}" stroke-width="2.4" stroke-linecap="round" opacity="${(0.4 + (uvVal / 11) * 0.55).toFixed(2)}"/>` }
  let scale = ''
  levels.forEach((lv, i) => { const y = i * segH, act = lv === cur; scale += `<rect x="0" y="${y}" width="72" height="${segH - 2}" rx="3" fill="${lv.color}" opacity="${act ? 1 : 0.28}" ${act ? 'stroke="#fff" stroke-width="1.5"' : ''}/><text x="36" y="${y + segH / 2 + 2.5}" text-anchor="middle" font-size="7" font-weight="${act ? '800' : '600'}" fill="${act ? '#fff' : '#a1a1aa'}">${lv.label}</text>` })
  let bottom = ''
  if (o.solar != null) bottom += `<text font-size="10" font-weight="700"><tspan fill="${cur.color}">☀ </tspan><tspan fill="#fafafa" font-weight="800">${Number(o.solar).toFixed(0)}</tspan><tspan fill="${stroke}"> W/m²</tspan></text>`
  if (o.illuminance != null) { const lx = Number(o.illuminance); bottom += `<text y="14" font-size="10" font-weight="700"><tspan fill="${cur.color}">✦ </tspan><tspan fill="#fafafa" font-weight="800">${lx >= 1000 ? (lx / 1000).toFixed(1) + 'k' : lx.toFixed(0)}</tspan><tspan fill="${stroke}"> lx</tspan></text>` }
  return `<svg width="100%" viewBox="0 0 220 180" fill="none" style="display:block">
    <defs>
      <radialGradient id="${id}core" cx="0.4" cy="0.4" r="0.6"><stop offset="0%" stop-color="#fff" stop-opacity="0.95"/><stop offset="100%" stop-color="${cur.color}"/></radialGradient>
      <radialGradient id="${id}halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="${cur.color}" stop-opacity="0.45"/><stop offset="100%" stop-color="${cur.color}" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="wx-sun-rays">${rays}</g>
    <circle cx="60" cy="55" r="32" fill="url(#${id}halo)"/>
    <circle cx="60" cy="55" r="22" fill="url(#${id}core)"/>
    <text x="60" y="61" text-anchor="middle" font-size="20" font-weight="800" fill="#0e0e10">${uvVal.toFixed(uvVal < 10 ? 1 : 0)}</text>
    <text x="60" y="118" text-anchor="middle" font-size="9" font-weight="700" fill="${stroke}" letter-spacing="0.6">INDICE UV</text>
    <text x="60" y="132" text-anchor="middle" font-size="10" font-weight="800" fill="${cur.color}">${cur.label}</text>
    <g transform="translate(135,14)">${scale}</g>
    <g transform="translate(12,152)">${bottom}</g>
  </svg>`
}

function scBatt(v) {
  const pv = Number(v), pct = isNaN(pv) ? 0.5 : Math.max(0.04, Math.min(1, pv / 100))
  const col = pct > 0.5 ? '#22c55e' : pct > 0.2 ? '#eab308' : '#ef4444'
  return `<svg viewBox="0 0 90 50" width="100" height="56"><rect x="10" y="12" width="60" height="28" rx="6" fill="none" stroke="${col}" stroke-width="3"/><rect x="70" y="20" width="6" height="12" rx="2" fill="${col}"/><rect x="14" y="16" width="${(52 * pct).toFixed(1)}" height="20" rx="3" fill="${col}" class="an-pulse" style="transform-origin:14px 26px"/></svg>`
}

function scLightning(dist, unit) {
  const has = dist != null && !isNaN(Number(dist))
  const u = unit || 'km'
  return `<svg width="100%" viewBox="0 0 200 130" fill="none" style="display:block">
    <g fill="#52525b"><ellipse cx="100" cy="40" rx="52" ry="16" opacity="0.85"/><circle cx="74" cy="36" r="17"/><circle cx="104" cy="28" r="22"/><circle cx="130" cy="38" r="15"/></g>
    <polygon class="an-pulse" style="transform-origin:96px 86px" points="90,58 112,58 98,84 116,84 80,118 90,90 78,90" fill="#fde047"/>
    <polygon class="an-pulse" style="transform-origin:140px 80px;animation-delay:.4s" points="138,56 150,56 142,72 152,72 132,96 138,78 130,78" fill="#facc15" opacity="0.8"/>
    ${has ? `<text x="100" y="128" text-anchor="middle" font-size="13" font-weight="800" fill="#a855f7">${Number(dist).toFixed(0)} <tspan font-size="8" fill="#9aa0ac">${u} dist.</tspan></text>` : ''}
  </svg>`
}

function scGeneric(col) {
  const c = col || '#a1a1aa', id = scUid()
  return `<svg width="100%" viewBox="0 0 140 112" fill="none" style="display:block;max-height:150px">
    <defs><radialGradient id="${id}g" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="${c}" stop-opacity="0.35"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="70" cy="54" r="48" fill="url(#${id}g)"/>
    <circle cx="70" cy="54" r="46" fill="none" stroke="${c}" stroke-width="1" opacity="0.22" stroke-dasharray="3 6"/>
    <circle cx="70" cy="54" r="32" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.35" class="an-pulse" style="transform-origin:70px 54px;animation-delay:.3s"/>
    <circle cx="70" cy="54" r="17" fill="none" stroke="${c}" stroke-width="2" opacity="0.6" class="an-pulse" style="transform-origin:70px 54px"/>
    <circle cx="70" cy="54" r="6" fill="${c}" class="an-pulse" style="transform-origin:70px 54px"/>
    <g style="transform-box:view-box;transform-origin:70px 54px;animation:wx-spin 18s linear infinite"><line x1="70" y1="54" x2="70" y2="8" stroke="${c}" stroke-width="1.5" opacity="0.75"/><path d="M70 54 L70 8 A46 46 0 0 1 96 18 Z" fill="${c}" opacity="0.12"/></g>
  </svg>`
}

function scRing(pct, col) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0)), r = 34, c = 2 * Math.PI * r, off = c * (1 - p / 100)
  const k = col || '#38bdf8'
  return `<svg width="100%" viewBox="0 0 100 100" style="display:block;max-height:130px">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="8"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${k}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 50 50)" style="transition:stroke-dashoffset 1s"/>
    <text x="50" y="56" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">${Math.round(p)}<tspan font-size="11">%</tspan></text>
  </svg>`
}

function scCloud(pct) {
  const p = isNaN(Number(pct)) ? '—' : Math.round(Number(pct))
  const cloud = (x, y, s, o, dur, d) => `<g style="animation:wx-driftx ${dur}s ease-in-out ${d}s infinite"><ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.5}" fill="#cbd5e1" opacity="${o}"/><circle cx="${x - s * 0.5}" cy="${y - 2}" r="${s * 0.5}" fill="#cbd5e1" opacity="${o}"/><circle cx="${x + s * 0.4}" cy="${y - 3}" r="${s * 0.6}" fill="#cbd5e1" opacity="${o}"/></g>`
  return `<svg width="100%" viewBox="0 0 160 112" fill="none" style="display:block;max-height:150px">
    ${cloud(44, 28, 16, 0.45, 6, 0)}${cloud(112, 24, 20, 0.7, 8, -2)}${cloud(82, 50, 13, 0.4, 7, -3)}
    <text x="80" y="92" text-anchor="middle" font-size="30" font-weight="900" fill="#fff">${p}<tspan font-size="15">%</tspan></text>
  </svg>`
}

function scEnergy(val) {
  const v = isNaN(Number(val)) ? null : Math.round(Number(val))
  return `<svg width="100%" viewBox="0 0 140 112" fill="none" style="display:block;max-height:150px">
    <circle cx="70" cy="56" r="46" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.22" stroke-dasharray="3 6"/>
    <circle cx="70" cy="56" r="30" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.3" class="an-pulse" style="transform-origin:70px 56px;animation-delay:.3s"/>
    <polygon class="an-pulse" style="transform-origin:70px 58px" points="80,22 56,60 71,60 60,96 90,52 74,52 86,22" fill="#f59e0b" stroke="#fde68a" stroke-width="0.6"/>
    ${v != null ? `<text x="70" y="108" text-anchor="middle" font-size="9" font-weight="700" fill="#9aa0ac">${v} J/kg</text>` : ''}
  </svg>`
}

function scLayers(col) {
  const c = col || '#22d3ee'
  let l = ''
  for (let i = 0; i < 5; i++) { const y = 26 + i * 15; l += `<path d="M12 ${y} Q 50 ${y - 7} 86 ${y} T 150 ${y}" fill="none" stroke="${c}" stroke-width="2.5" opacity="${(0.3 + i * 0.13).toFixed(2)}" style="animation:wx-wave ${(2 + i * 0.3).toFixed(1)}s ease-in-out infinite;animation-delay:${(-i * 0.2).toFixed(1)}s"/>` }
  return `<svg width="100%" viewBox="0 0 160 112" fill="none" style="display:block;max-height:150px">${l}</svg>`
}

function windyUrl(lat, lon, overlay) {
  const p = new URLSearchParams({ lat: String(lat), lon: String(lon), detailLat: String(lat), detailLon: String(lon), zoom: '8', level: 'surface', overlay: overlay || 'radar', product: 'ecmwf', menu: '', message: 'true', marker: 'true', calendar: '', pressure: '', type: 'map', location: 'coordinates', detail: '', metricWind: 'km/h', metricTemp: '°C', radarRange: '-1' })
  return 'https://embed.windy.com/embed2.html?' + p.toString()
}

class MeteoCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._hass = null
    this._config = {}
    this._buildKey = null
    this._open = false
    this._daysOpen = true
    this._portal = null
    this._settingsPortal = null
    this._clockTimer = null
    this._windyOverlay = 'radar'
    this._anemRaf = null
    this._anemSpeed = 0
    this._onClick = this._handleClick.bind(this)
  }
  setConfig(c) { this._config = Object.assign({}, MW, c || {}, this._loadCfg()) }
  getCardSize() { return 5 }

  _loadCfg() { try { return JSON.parse(localStorage.getItem('meteo_card_cfg')) || {} } catch (e) { return {} } }
  _saveCfg(patch) {
    const next = Object.assign({}, this._loadCfg(), patch)
    try { localStorage.setItem('meteo_card_cfg', JSON.stringify(next)) } catch (e) {}
    this._config = Object.assign({}, this._config, patch)
    this._buildKey = null; this._build()
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', this._onClick)
    if (!this._clockTimer) this._clockTimer = setInterval(() => this._tickClock(), 1000)
  }
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._onClick)
    if (this._clockTimer) { clearInterval(this._clockTimer); this._clockTimer = null }
    this._closePopup(); this._closeSettings()
  }

  _clockInner() {
    const d = new Date()
    const p = n => String(n).padStart(2, '0')
    return `<span class="wk-t">${p(d.getHours())}:${p(d.getMinutes())}</span><span class="wk-s">:${p(d.getSeconds())}</span><div class="wk-l">Ora</div>`
  }
  _tickClock() {
    const el = this.shadowRoot && this.shadowRoot.querySelector('.w-clock')
    if (el) el.innerHTML = this._clockInner()
  }

  _handleClick(e) {
    if (e.target.closest('[data-act="settings"]')) { this._openSettings(); return }
    if (e.target.closest('[data-act="days"]')) { this._daysOpen = !this._daysOpen; this._buildKey = null; this._build(); return }
    if (e.target.closest('[data-act="open"]')) { this._open = true; this._syncPortal() }
  }

  set hass(h) {
    this._hass = h
    const bk = this._bk()
    if (bk !== this._buildKey) {
      this._buildKey = bk
      // se il popup è aperto NON ricostruisco (il popup è uno snapshot: niente sfarfallio)
      if (!this._open) this._build()
    }
  }

  /* ---- popup agganciato al <body>: lo sfondo scuro è sul contenitore esterno
         (sempre visibile anche se il contenuto va in errore) ---- */
  _syncPortal() {
    if (!this._open) { this._closePopup(); return }
    if (!this._portal) {
      const d = document.createElement('div')
      d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:2vh 0;overscroll-behavior:contain'
      d.attachShadow({ mode: 'open' })
      d.addEventListener('click', (e) => {
        const path = e.composedPath ? e.composedPath() : []
        const wb = path.find(n => n && n.dataset && n.dataset.windy)
        if (wb) {
          this._windyOverlay = wb.dataset.windy
          const sh = d.shadowRoot
          const { lat, lon } = this._windyCoords()
          const fr = sh.querySelector('#windy-frame'); if (fr) fr.src = windyUrl(lat, lon, this._windyOverlay)
          sh.querySelectorAll('.wov').forEach(b => b.classList.toggle('on', b.dataset.windy === this._windyOverlay))
          return
        }
        const onSheet = path.some(n => n && n.classList && n.classList.contains('sheet'))
        const onClose = path.some(n => n && n.classList && n.classList.contains('close'))
        if (onClose || !onSheet) this._closePopup()
      })
      this._escH = (e) => { if (e.key === 'Escape') this._closePopup() }
      window.addEventListener('keydown', this._escH)
      document.body.appendChild(d)
      this._portal = d
    }
    this._fillPortal()
  }
  _fillPortal() {
    if (!this._portal || !this._hass) return
    const sh = this._portal.shadowRoot
    const prev = sh.querySelector('.sheet'); const ps = prev ? prev.scrollTop : 0
    let content = ''
    try {
      const list = this._collect(), fc = this._forecast()
      content = this._stationHTML(list, fc)
    } catch (err) {
      content = `<div style="padding:30px;color:#fca5a5;font-size:13px">Errore nel popup: ${String((err && err.message) || err)}</div>`
    }
    sh.innerHTML = `<style>${CSS_M}</style>
      <div class="sheet">
        <button class="close" title="Chiudi">✕</button>
        <div class="grab"></div>
        ${content}
      </div>`
    if (ps) { const ns = sh.querySelector('.sheet'); if (ns) ns.scrollTop = ps }
    this._startAnem()
  }
  /* orbita ellittica delle coppette anemometro (come l'Oikos, via requestAnimationFrame) */
  _startAnem() {
    if (this._anemRaf) { cancelAnimationFrame(this._anemRaf); this._anemRaf = null }
    const sh = this._portal && this._portal.shadowRoot
    if (!sh) return
    const cups = [...sh.querySelectorAll('.wx-cup')], arms = [...sh.querySelectorAll('.wx-arm')]
    if (!cups.length) return
    const HX = 110, HY = 45, RX = 42, RY = 9
    const spd = this._anemSpeed || 0
    const cupDur = spd < 0.1 ? 999 : Math.max(0.3, 3 - spd * 0.08)
    let phase = 0, last = performance.now()
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now
      if (cupDur < 50) phase = (phase + (2 * Math.PI / cupDur) * dt) % (2 * Math.PI)
      for (let i = 0; i < cups.length; i++) {
        const a = phase + i * (2 * Math.PI / 3), x = Math.cos(a) * RX, y = Math.sin(a) * RY
        cups[i].setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`)
        if (arms[i]) { arms[i].setAttribute('x2', (HX + x).toFixed(2)); arms[i].setAttribute('y2', (HY + y).toFixed(2)) }
      }
      this._anemRaf = requestAnimationFrame(tick)
    }
    this._anemRaf = requestAnimationFrame(tick)
  }
  _closePopup() {
    this._open = false
    if (this._anemRaf) { cancelAnimationFrame(this._anemRaf); this._anemRaf = null }
    if (this._escH) { window.removeEventListener('keydown', this._escH); this._escH = null }
    if (this._portal) { this._portal.remove(); this._portal = null }
  }

  _g(id) { return this._hass?.states?.[id] }
  _state(id, fb) { const s = this._g(id); return s ? s.state : (fb !== undefined ? fb : '0') }

  _collect() {
    const prefix = (this._config.prefix || 'gw1100a').toLowerCase()
    const out = []
    const states = this._hass?.states || {}
    for (const eid in states) {
      if (!eid.startsWith('sensor.')) continue
      if (!eid.slice(7).toLowerCase().startsWith(prefix)) continue
      const st = states[eid]
      out.push({ eid, st, cat: classify(eid, st), sub: subType(eid), name: friendly(st, eid, prefix) })
    }
    out.sort((a, b) => {
      const oa = CATS[a.cat]?.order ?? 50, ob = CATS[b.cat]?.order ?? 50
      return oa !== ob ? oa - ob : a.name.localeCompare(b.name)
    })
    return out
  }

  /* Tutte le entità per il popup: Ecowitt + Pirate Weather (escluse previsioni per-giorno) */
  _collectAll() {
    const states = this._hass?.states || {}
    const pre = (this._config.prefix || 'gw1100a').toLowerCase()
    const fpre = (this._config.forecastPrefix || 'pirateweather').toLowerCase()
    const out = []
    for (const eid in states) {
      if (!eid.startsWith('sensor.')) continue
      const slug = eid.slice(7).toLowerCase()
      const isEco = slug.startsWith(pre)
      const isPw = slug.includes(fpre)
      if (!isEco && !isPw) continue
      if (isPw && !isEco) {
        if (/_\dd$/.test(slug)) continue                 // previsioni per-giorno → vanno nella striscia, non qui
        if (/icon|summary|alert|daily_summary|hourly_summary/.test(slug)) continue
      }
      const st = states[eid]
      out.push({ eid, st, cat: classify(eid, st), sub: subType(eid), name: friendly(st, eid, isEco ? pre : fpre) })
    }
    out.sort((a, b) => {
      const oa = CATS[a.cat]?.order ?? 50, ob = CATS[b.cat]?.order ?? 50
      return oa !== ob ? oa - ob : a.name.localeCompare(b.name)
    })
    return out
  }

  /* Pirate Weather: current/today/tomorrow */
  _forecast() {
    const pre = (this._config.forecastPrefix || 'pirateweather').toLowerCase()
    const fc = { current: {}, today: {}, tomorrow: {} }
    const states = this._hass?.states || {}
    const re = new RegExp(pre, 'i')
    const set = (b, k, v) => { if (fc[b][k] == null) fc[b][k] = v }
    for (const eid in states) {
      if (!eid.startsWith('sensor.') && !eid.startsWith('weather.')) continue
      const id = eid.toLowerCase()
      if (!re.test(id)) continue
      const v = states[eid].state
      let b = 'current'
      if (/_1d$/i.test(eid)) b = 'tomorrow'
      else if (/_0d$/i.test(eid)) b = 'today'
      if (/icon/.test(id) && !/alert/.test(id)) set(b, 'icon', v)
      else if (/summary/.test(id) && !/alert/.test(id)) set(b, 'summary', v)
      else if (/(high|max).*temp|daytime.*high.*temp/i.test(id)) set(b, 'high', v)
      else if (/(low|min).*temp|overnight.*low.*temp/i.test(id)) set(b, 'low', v)
      else if (/precip.*probability/i.test(id)) set(b, 'precipProb', v)
    }
    return fc
  }

  _pick(list, pred) { return list.find(pred) }

  _windyCoords() {
    const z = this._g('zone.home')
    const lat = parseFloat(this._config.lat) || z?.attributes?.latitude
    const lon = parseFloat(this._config.lon) || z?.attributes?.longitude
    // fallback Castenedolo (BS) se non disponibili
    return { lat: (lat != null && !isNaN(lat)) ? lat : 45.4906, lon: (lon != null && !isNaN(lon)) ? lon : 10.292 }
  }

  _weatherEntity() {
    const cfg = this._config.weatherEntity
    if (cfg && this._g(cfg)) return cfg
    const states = this._hass?.states || {}
    const cands = Object.keys(states).filter(e => e.startsWith('weather.'))
    return cands.find(e => /pirate/i.test(e)) || cands[0] || null
  }

  /* risolve l'entità per un ruolo: config (da impostazioni) o auto-detect */
  _resolve(role) {
    const map = { weather: 'weatherEntity', temp: 'tempEntity', hum: 'humEntity', wind: 'windEntity', press: 'pressEntity', dir: 'dirEntity' }
    const cfgV = this._config[map[role]]
    if (cfgV && this._g(cfgV)) return cfgV
    if (role === 'weather') return this._weatherEntity()
    const list = this._collect()
    const f = pred => (list.find(pred) || {}).eid || null
    if (role === 'temp') return f(s => s.cat === 'thermal' && s.sub === 'temp_out') || f(s => s.cat === 'thermal' && /out|esterno|external/i.test(s.eid)) || f(s => s.cat === 'thermal' && s.sub !== 'feels' && s.sub !== 'dew')
    if (role === 'hum') return f(s => s.cat === 'humidity' && /out|esterno/i.test(s.eid)) || f(s => s.cat === 'humidity')
    if (role === 'wind') return f(s => s.cat === 'wind' && s.sub === 'wind_speed') || f(s => s.cat === 'wind' && s.sub !== 'wind_dir')
    if (role === 'press') return f(s => s.cat === 'pressure' && /rel/i.test(s.eid)) || f(s => s.cat === 'pressure')
    if (role === 'dir') return f(s => s.sub === 'wind_dir')
    return null
  }

  _dateLabel() {
    const G = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    const M = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
    const d = new Date()
    return `${G[d.getDay()]} ${d.getDate()} ${M[d.getMonth()]}`
  }

  _dayLabel(date, idx) {
    if (idx === 0) return 'Oggi'
    let d = null
    if (date) { const dt = new Date(date); if (!isNaN(dt)) d = dt }
    if (!d) { d = new Date(); d.setDate(d.getDate() + idx) }
    return GIORNI3[d.getDay()]
  }

  /* Previsioni multi-giorno: prima da weather.* (attributo forecast), poi dai sensori pirate _Nd */
  _days() {
    const weid = this._weatherEntity()
    const w = weid ? this._g(weid) : null
    const fcAttr = w?.attributes?.forecast
    if (Array.isArray(fcAttr) && fcAttr.length) {
      // una voce per giorno di calendario (gestisce sia forecast giornalieri che orari)
      const seen = new Set(); const out = []
      for (const f of fcAttr) {
        if (!f) continue
        const dt = f.datetime ? new Date(f.datetime) : null
        const key = (dt && !isNaN(dt)) ? dt.toISOString().slice(0, 10) : 'k' + out.length
        if (seen.has(key)) continue
        seen.add(key)
        out.push({
          label: this._dayLabel(f.datetime, out.length),
          cond: f.condition,
          hi: f.temperature != null ? Math.round(Number(f.temperature)) : null,
          lo: f.templow != null ? Math.round(Number(f.templow)) : null,
          pp: f.precipitation_probability != null ? Math.round(Number(f.precipitation_probability)) : null,
          pmm: f.precipitation != null ? Number(f.precipitation) : null,
        })
        if (out.length >= 7) break
      }
      if (out.length) return out
    }
    // fallback: sensori pirate _0d.._6d
    const pre = (this._config.forecastPrefix || 'pirateweather').toLowerCase()
    const states = this._hass?.states || {}
    const re = new RegExp(pre, 'i')
    const days = {}
    for (const eid in states) {
      if (!eid.startsWith('sensor.')) continue
      const id = eid.toLowerCase()
      if (!re.test(id)) continue
      const m = id.match(/_(\d)d$/)
      if (!m) continue
      const n = Number(m[1])
      const v = states[eid].state
      const d = days[n] || (days[n] = { n })
      if (/icon/.test(id) && !/alert/.test(id)) d.cond = d.cond ?? v
      else if (/(high|max).*temp|daytime.*high.*temp/i.test(id)) d.hi = d.hi ?? v
      else if (/(low|min).*temp|overnight.*low.*temp/i.test(id)) d.lo = d.lo ?? v
      else if (/precip.*probability/i.test(id)) d.pp = d.pp ?? v
    }
    return Object.values(days).sort((a, b) => a.n - b.n).slice(0, 7).map(d => ({
      label: this._dayLabel(null, d.n),
      cond: d.cond,
      hi: d.hi != null ? Math.round(Number(d.hi)) : null,
      lo: d.lo != null ? Math.round(Number(d.lo)) : null,
      pp: d.pp != null ? Math.round(Number(d.pp) * (Number(d.pp) <= 1 ? 100 : 1)) : null,
    }))
  }

  _daysHTML(days, big) {
    if (!days || !days.length) return ''
    return `<div class="${big ? 'days days-bd' : 'days'}">${days.map((d, i) => {
      const ci = condInfo(d.cond) || { e: '⛅' }
      const hi = d.hi != null ? d.hi + '°' : '—'
      const lo = d.lo != null ? d.lo + '°' : ''
      return `<div class="day${i === 0 ? ' t0' : ''}">
        <div class="day-l">${d.label}</div>
        <div class="day-e">${ci.e}</div>
        <div class="day-h">${hi}</div>
        ${lo ? `<div class="day-c">${lo}</div>` : ''}
        ${d.pp != null && d.pp > 0 ? `<div class="day-p">💧${d.pp}%</div>` : ''}
      </div>`
    }).join('')}</div>`
  }

  _bk() {
    if (!this._hass) return null
    const list = this._collect()
    const parts = [this._open ? 'O' : 'C', this._daysOpen ? 'D1' : 'D0']
    list.forEach(s => parts.push(s.eid + '=' + fmt(s.st).v))
    const fc = this._forecast()
    parts.push('c:' + (fc.current.icon || fc.today.icon || '') + '|' + (fc.current.summary || ''))
    const weid = this._weatherEntity(); const w = weid ? this._g(weid) : null
    parts.push('w:' + (w ? w.state : ''))
    parts.push('d:' + this._days().map(d => d.cond + d.hi + d.lo + d.pp).join(','))
    const sun = this._g('sun.sun')
    parts.push('s:' + (sun?.state || '') + Math.round(num(sun?.attributes?.elevation) ?? 0))
    return parts.join('|')
  }

  _heroHTML(list, fc) {
    const tOut = this._pick(list, s => s.cat === 'thermal' && s.sub === 'temp_out')
      || this._pick(list, s => s.cat === 'thermal' && /out|esterno|external/i.test(s.eid))
      || this._pick(list, s => s.cat === 'thermal' && s.sub !== 'feels' && s.sub !== 'dew')
    const feels = this._pick(list, s => s.sub === 'feels')
    const hum = this._pick(list, s => s.cat === 'humidity')
    const wind = this._pick(list, s => s.cat === 'wind' && s.sub === 'wind_speed') || this._pick(list, s => s.cat === 'wind' && s.sub !== 'wind_dir')
    const press = this._pick(list, s => s.cat === 'pressure')
    const rain = this._pick(list, s => s.sub === 'rain_daily') || this._pick(list, s => s.sub === 'rain_rate') || this._pick(list, s => s.cat === 'rain')

    const weid = this._weatherEntity()
    const w = weid ? this._g(weid) : null
    const cond = (w && !isUn(w) ? w.state : null) || fc.current.icon || fc.today.icon
    const ci = condInfo(cond) || { e: '⛅', l: fc.current.summary || '—' }
    const sun = this._g('sun.sun')
    const { gradient, phase, grp } = skyTheme(cond, sun)

    const days = this._days()
    const t = fmt(tOut?.st)
    const feelsV = feels && !isUn(feels.st) ? fmt(feels.st) : null
    const hi = days[0]?.hi != null ? days[0].hi : (fc.today.high != null ? Math.round(Number(fc.today.high)) : null)
    const lo = days[0]?.lo != null ? days[0].lo : (fc.today.low != null ? Math.round(Number(fc.today.low)) : null)
    const loc = this._config.locationName || (w?.attributes?.friendly_name) || this._g('zone.home')?.attributes?.friendly_name ||'Stazione Meteo'

    const chip = (e, lbl, s) => {
      if (!s || !s.st) return ''
      const f = fmt(s.st)
      const hint = (s.sub === 'wind_dir') ? (degToCard(s.st.state) || f.u) : f.u
      return `<div class="chip"><span class="ce">${e}</span><span class="cv">${f.v}<span class="cu">${hint}</span></span><span class="cl">${lbl}</span></div>`
    }

    return `<div class="hero" style="background:${gradient}">
      <div class="sky">${skyHTML(grp, phase)}</div>
      <div class="hov"></div>
      <div class="hc">
        <div class="htop">
          <div class="hloc">📍 ${loc}</div>
          <div class="hcond">${ci.e}</div>
        </div>
        <div class="htemp">${t.v}<span class="htu">${t.u}</span></div>
        <div class="hmeta">
          <span class="hlbl">${fc.current.summary || ci.l}</span>
          ${(hi != null || lo != null) ? `<span class="hhl">${hi != null ? '↑ ' + hi + '°' : ''}${hi != null && lo != null ? '  ' : ''}${lo != null ? '↓ ' + lo + '°' : ''}</span>` : ''}
          ${feelsV ? `<span class="hfeel">Percepita ${feelsV.v}${feelsV.u}</span>` : ''}
        </div>
        <div class="chips">
          ${chip('💨', 'Vento', wind)}
          ${chip('💧', 'Umidità', hum)}
          ${chip('🧭', 'Pressione', press)}
          ${chip('🌧️', 'Pioggia', rain)}
        </div>
      </div>
    </div>`
  }

  _forecastHTML(fc) {
    const day = (label, d) => {
      if (!d || (!d.icon && !d.high && !d.summary)) return ''
      const ci = COND[d.icon] || { e: '⛅', l: d.summary || '—' }
      const hi = d.high != null ? Math.round(Number(d.high)) + '°' : '—'
      const lo = d.low != null ? Math.round(Number(d.low)) + '°' : '—'
      const pp = d.precipProb != null ? Math.round(Number(d.precipProb) * (Number(d.precipProb) <= 1 ? 100 : 1)) : null
      return `<div class="fcday">
        <div class="fcd-l">${label}</div>
        <div class="fcd-e">${ci.e}</div>
        <div class="fcd-c">${ci.l}</div>
        <div class="fcd-t">${hi} / ${lo}</div>
        ${pp != null ? `<div class="fcd-p">💧 ${pp}%</div>` : ''}
      </div>`
    }
    const today = day('Oggi', fc.today)
    const tomorrow = day('Domani', fc.tomorrow)
    if (!today && !tomorrow) return ''
    return `<div class="fcrow">${today}${tomorrow}</div>`
  }

  /* scena animata realistica per categoria (usa i sensori del gruppo) */
  _catScene(cat, sensors) {
    if (cat === 'thermal') {
      const lbl = { temp_out: 'Esterna', temp_in: 'Interna', feels: 'Percepita', dew: 'Rugiada' }
      const order = ['temp_out', 'temp_in', 'feels', 'dew']
      const items = []
      for (const sub of order) { const s = this._pick(sensors, x => x.sub === sub); if (s) items.push({ label: lbl[sub], value: s.st.state, accent: sub === 'dew' ? '#f59e0b' : '#ef4444' }) }
      for (const s of sensors) { if (items.length >= 4) break; if (!order.includes(s.sub)) items.push({ label: (s.name || '').slice(0, 8), value: s.st.state, accent: '#ef4444' }) }
      return items.length ? scThermo(items) : ''
    }
    if (cat === 'humidity') {
      // una goccia per OGNI entità (max 4), etichettata col nome reale
      const lbl = (s) => /out|esterno/i.test(s.eid) ? 'Esterna' : /in|interno/i.test(s.eid) ? 'Interna' : (s.name || '').replace(/umidit[àa]\s*/i, '').trim() || 'Umidità'
      const items = sensors.slice(0, 4).map(s => ({ label: lbl(s), pct: s.st.state }))
      return scHygro(items)
    }
    if (cat === 'wind') {
      const sp = this._pick(sensors, s => s.sub === 'wind_speed'), g = this._pick(sensors, s => s.sub === 'gust'), dr = this._pick(sensors, s => s.sub === 'wind_dir')
      this._anemSpeed = Number(sp?.st?.state) || 0
      return scWind({ speed: sp?.st?.state, gust: g?.st?.state, dir: dr?.st?.state })
    }
    if (cat === 'pressure') { const p = this._pick(sensors, s => /rel/i.test(s.eid)) || sensors[0]; return scBaro(p?.st?.state) }
    if (cat === 'rain') { const rate = this._pick(sensors, s => s.sub === 'rain_rate'), daily = this._pick(sensors, s => s.sub === 'rain_daily'); return scRain({ rate: rate?.st?.state, daily: daily?.st?.state }) }
    if (cat === 'light') {
      const uv = this._pick(sensors, s => /uv/i.test(s.eid))
      const sol = this._pick(sensors, s => /solar.*rad|radiation|w\/m/i.test(s.eid) || (s.st?.attributes?.unit_of_measurement || '').toLowerCase().includes('w/m'))
      const lux = this._pick(sensors, s => /lux|illumin/i.test(s.eid) || (s.st?.attributes?.unit_of_measurement || '').toLowerCase() === 'lx')
      return scUV({ uv: uv?.st?.state, solar: sol && !isUn(sol.st) ? sol.st.state : null, illuminance: lux && !isUn(lux.st) ? lux.st.state : null })
    }
    if (cat === 'lightning') { const d = this._pick(sensors, s => /dist/i.test(s.eid)) || sensors[0]; return scLightning(d?.st?.state, d?.st?.attributes?.unit_of_measurement) }
    if (cat === 'battery') return scBatt(sensors[0]?.st?.state)
    if (cat === 'other') return scGeneric()
    return ''
  }

  _catHTML(cat, sensors) {
    const C = CATS[cat] || CATS.other
    // valore principale (grande) per la categoria
    let principal = null
    if (cat === 'thermal') principal = this._pick(sensors, s => s.sub === 'temp_out') || sensors[0]
    else if (cat === 'wind') principal = this._pick(sensors, s => s.sub === 'wind_speed') || sensors[0]
    else if (cat === 'humidity') principal = this._pick(sensors, s => /out|esterno/i.test(s.eid)) || sensors[0]
    else if (cat === 'pressure') principal = this._pick(sensors, s => /rel/i.test(s.eid)) || sensors[0]
    else if (cat === 'rain') principal = this._pick(sensors, s => s.sub === 'rain_daily') || this._pick(sensors, s => s.sub === 'rain_rate') || sensors[0]
    else if (cat === 'light') principal = this._pick(sensors, s => /uv/i.test(s.eid)) || sensors[0]
    else principal = sensors[0]
    const pf = principal ? fmt(principal.st) : null
    const spin = cat === 'wind' ? 'animation:spin 4s linear infinite;display:inline-block' : ''

    // Termometri e gocce mostrano già nome+valore: niente righe duplicate sotto
    const hideRows = cat === 'thermal' || cat === 'humidity'
    const rows = hideRows ? '' : sensors.map(s => {
      const f = fmt(s.st)
      const dir = s.sub === 'wind_dir' && !isUn(s.st) ? degToCard(s.st.state) : null
      const lbl = sensors.length > 1 ? friendly(s.st, s.eid, this._config.prefix || 'gw1100a') : C.label
      return `<div class="row">
        <span class="dot" style="background:${C.color}"></span>
        <span class="rl">${lbl}</span>
        <span class="rv">${f.v}<span class="ru">${dir || f.u}</span></span>
      </div>`
    }).join('')

    return `<div class="cat" style="--c1:${C.g1};--c2:${C.g2}">
      <div class="cat-in">
        <div class="cat-hd">
          <div class="cat-ic"><span style="${spin}">${C.emoji}</span></div>
          <div class="cat-tt">
            <div class="cat-nm">${C.label}</div>
            <div class="cat-ct">${sensors.length} sensor${sensors.length === 1 ? 'e' : 'i'}</div>
          </div>
          ${pf ? `<div class="cat-big" style="color:${C.color}">${pf.v}<span class="cat-bu">${pf.u}</span></div>` : ''}
        </div>
        <div class="cat-scene">${this._catScene(cat, sensors)}</div>
        <div class="rows">${rows}</div>
      </div>
    </div>`
  }

  /* card singola per un'entità "Altri" (anello % o radar + valore grande) */
  _miscCard(s) {
    const f = fmt(s.st), id = (s.eid || '').toLowerCase()
    let emoji = '📊', col = '#38bdf8'
    if (/cloud|nuvol/.test(id)) { emoji = '☁️'; col = '#94a3b8' }
    else if (/ozone|ozono/.test(id)) { emoji = '🌫️'; col = '#22d3ee' }
    else if (/visib/.test(id)) { emoji = '👁️'; col = '#60a5fa' }
    else if (/cape|convective|potential/.test(id)) { emoji = '🌩️'; col = '#f59e0b' }
    else if (/uv|solar/.test(id)) { emoji = '☀️'; col = '#facc15' }
    let scene
    if (/cloud|nuvol/.test(id)) scene = scCloud(s.st.state)
    else if (/cape|convective|potential/.test(id)) scene = scEnergy(s.st.state)
    else if (/ozone|ozono|visib/.test(id)) scene = scLayers(col)
    else if (f.u === '%') scene = scRing(s.st.state, col)
    else scene = scGeneric(col)
    return `<div class="cat" style="--c1:${col};--c2:${col}99"><div class="cat-in">
      <div class="cat-hd">
        <div class="cat-ic" style="background:linear-gradient(140deg,${col},${col}99)">${emoji}</div>
        <div class="cat-tt"><div class="cat-nm">${s.name}</div><div class="cat-ct">${s.eid.split('.')[1].slice(0, 22)}</div></div>
        <div class="cat-big" style="color:${col}">${f.v}<span class="cat-bu">${f.u}</span></div>
      </div>
      <div class="cat-scene">${scene}</div>
    </div></div>`
  }

  /* card Fulmini dedicata: bussola direzione + radar polare + contatori */
  _lightningCard(sensors) {
    const C = CATS.lightning
    const find = re => this._pick(sensors, s => re.test(s.eid.toLowerCase()))
    const dist = find(/dist/), az = find(/azimuth|bear|dir/), cnt = find(/counter|count|strike|num/)
    const dv = dist && !isUn(dist.st) ? Number(dist.st.state) : null
    const av = az && !isUn(az.st) ? Number(az.st.state) : null
    const cv = cnt && !isUn(cnt.st) ? Number(cnt.st.state) : null
    const active = cv != null && cv > 0
    const accent = active ? '#dc2626' : '#a855f7'
    const status = (cv == null || cv === 0) ? { l: 'Nessuna scarica', c: '#10b981' }
      : (dv != null && dv < 30) ? { l: 'Pericolo zona', c: '#dc2626' } : { l: 'Attività distante', c: '#f59e0b' }
    const card = degToCard(av)
    // bussola (sx)
    const compass = `<svg viewBox="0 0 120 120" width="100%" style="max-width:175px">
      <circle cx="60" cy="60" r="52" fill="#0f1420" stroke="#3a3a42" stroke-width="1.5"/>
      <circle cx="60" cy="60" r="38" fill="none" stroke="#3a3a42" stroke-width="0.8" opacity="0.6"/>
      <text x="60" y="16" text-anchor="middle" font-size="9" font-weight="800" fill="#ef4444">N</text>
      <text x="110" y="63" text-anchor="middle" font-size="8" font-weight="700" fill="#7f8794">E</text>
      <text x="60" y="112" text-anchor="middle" font-size="8" font-weight="700" fill="#7f8794">S</text>
      <text x="11" y="63" text-anchor="middle" font-size="8" font-weight="700" fill="#7f8794">O</text>
      ${av != null ? `<g transform="rotate(${av} 60 60)"><polygon points="60,18 54,40 66,40" fill="#ef4444"/></g>` : ''}
      <text x="60" y="58" text-anchor="middle" font-size="14" font-weight="800" fill="#fafafa">${av != null ? Math.round(av) + '°' : '—'}</text>
      <text x="60" y="72" text-anchor="middle" font-size="9" font-weight="700" fill="${accent}">${card || ''}</text>
      <text x="60" y="90" text-anchor="middle" font-size="10" font-weight="800" fill="#a1a1aa">${dv != null ? dv.toFixed(1) + ' km' : ''}</text>
    </svg>`
    // radar polare (dx)
    let marker = ''
    if (av != null && dv != null) { const a = (av - 90) * Math.PI / 180, r = Math.min(46, 6 + (dv / 150) * 42), x = 60 + Math.cos(a) * r, y = 60 + Math.sin(a) * r; marker = `<line x1="60" y1="60" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#fbbf24" stroke-width="1" opacity="0.6"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#ef4444" class="an-pulse" style="transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px"/>` }
    const radar = `<svg viewBox="0 0 120 120" width="100%" style="max-width:175px">
      <circle cx="60" cy="60" r="52" fill="#0f1420" stroke="${accent}" stroke-width="1.5" opacity="0.9"/>
      <circle cx="60" cy="60" r="36" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.4"/>
      <circle cx="60" cy="60" r="20" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.4"/>
      <text x="63" y="11" font-size="6" fill="#7f8794">150 km</text>
      <text x="63" y="27" font-size="6" fill="#7f8794">100</text>
      <text x="63" y="43" font-size="6" fill="#7f8794">50</text>
      <text x="60" y="15" text-anchor="middle" font-size="8" font-weight="800" fill="#ef4444">N</text>
      <text x="111" y="63" text-anchor="middle" font-size="7" fill="#7f8794">E</text>
      <text x="60" y="116" text-anchor="middle" font-size="7" fill="#7f8794">S</text>
      <text x="9" y="63" text-anchor="middle" font-size="7" fill="#7f8794">O</text>
      <line style="transform-box:view-box;transform-origin:60px 60px;animation:wx-spin 4s linear infinite" x1="60" y1="60" x2="60" y2="10" stroke="${accent}" stroke-width="1.2" opacity="0.6"/>
      ${marker}
      <circle cx="60" cy="60" r="3" fill="#10b981"/>
    </svg>`
    const rows = sensors.map(s => { const f = fmt(s.st); return `<div class="row"><span class="dot" style="background:${C.color}"></span><span class="rl">${s.name}</span><span class="rv">${f.v}<span class="ru">${f.u}</span></span></div>` }).join('')
    return `<div class="cat" style="--c1:${C.g1};--c2:${C.g2};grid-column:span 2"><div class="cat-in">
      <div class="cat-hd"><div class="cat-ic">⚡</div><div class="cat-tt"><div class="cat-nm">Fulmini</div><div class="cat-ct">${sensors.length} sensori</div></div>
        <div class="cat-big" style="color:${accent}">${cv != null ? cv : '—'}<span class="cat-bu">scariche</span></div></div>
      <div style="display:flex;gap:8px;justify-content:center;align-items:center;padding:6px 0">${compass}${radar}</div>
      <div style="text-align:center;padding:6px;border-radius:8px;font-size:11px;font-weight:800;letter-spacing:.4px;color:${status.c};background:${status.c}1a;text-transform:uppercase">${status.l}</div>
      <div class="rows">${rows}</div>
    </div></div>`
  }

  /* Vista esterna compatta: condizione + temp/umidità/vento a destra */
  _badgeHTML(list, fc) {
    const tOut = this._pick(list, s => s.cat === 'thermal' && s.sub === 'temp_out')
      || this._pick(list, s => s.cat === 'thermal' && /out|esterno|external/i.test(s.eid))
      || this._pick(list, s => s.cat === 'thermal' && s.sub !== 'feels' && s.sub !== 'dew')
    const hum = this._pick(list, s => s.cat === 'humidity' && /out|esterno/i.test(s.eid)) || this._pick(list, s => s.cat === 'humidity')
    const wind = this._pick(list, s => s.cat === 'wind' && s.sub === 'wind_speed') || this._pick(list, s => s.cat === 'wind' && s.sub !== 'wind_dir')
    const weid = this._weatherEntity()
    const w = weid ? this._g(weid) : null
    const cond = (w && !isUn(w) ? w.state : null) || fc.current.icon || fc.today.icon
    const ci = condInfo(cond) || { e: '⛅', l: fc.current.summary || 'Meteo' }
    const loc = this._config.locationName || (w?.attributes?.friendly_name) || this._g('zone.home')?.attributes?.friendly_name ||'Stazione Meteo'
    const stat = (e, st, forceU) => {
      if (!st) return ''
      const f = fmt(st)
      return `<div class="b-st"><span class="b-se">${e}</span><span class="b-sv">${f.v}<span class="b-su">${forceU || f.u}</span></span></div>`
    }
    const daysRow = this._daysHTML(this._days())
    return `<div class="badge" data-act="open">
      <div class="b-main">
        <div class="b-ico">${ci.e}</div>
        <div class="b-tt"><div class="b-nm">${loc}</div><div class="b-sb">${fc.current.summary || ci.l}</div></div>
        <div class="b-stats">
          ${stat('🌡️', tOut?.st)}
          ${stat('💧', hum?.st, '%')}
          ${stat('💨', wind?.st)}
          <span class="b-chev">›</span>
        </div>
      </div>
      ${daysRow}
    </div>`
  }

  /* Contenuto del popup: NIENTE hero (è già la card principale) — solo
     previsioni 7 giorni grandi + card per categoria con scene animate */
  _stationHTML(list, fc) {
    const all = this._collectAll()
    const byCat = {}
    for (const s of all) (byCat[s.cat] = byCat[s.cat] || []).push(s)
    const cats = Object.keys(byCat).sort((a, b) => (CATS[a]?.order ?? 50) - (CATS[b]?.order ?? 50))
    const daysHTML = this._daysHTML(this._days(), true)
    const cards = []
    for (const c of cats) {
      if (c === 'other') byCat[c].forEach(s => cards.push(this._miscCard(s)))       // una card per entità
      else if (c === 'lightning') cards.push(this._lightningCard(byCat[c]))         // card fulmini dedicata
      else cards.push(this._catHTML(c, byCat[c]))
    }
    const gridHTML = cards.length
      ? `<div class="grid">${cards.join('')}</div>`
      : `<div class="empty">Nessun sensore trovato (prefisso <b>${this._config.prefix || 'gw1100a'}</b> / <b>${this._config.forecastPrefix || 'pirateweather'}</b>).</div>`
    // mappa Windy (coordinate da config o zone.home, con fallback)
    const { lat, lon } = this._windyCoords()
    const ov = this._windyOverlay || 'radar'
    const ovs = [['radar', 'Radar'], ['rain', 'Pioggia'], ['wind', 'Vento'], ['temp', 'Temp'], ['clouds', 'Nuvole'], ['satellite', 'Satellite']]
    const windyHTML = `<div class="windy-wrap">
      <div class="windy-ov">${ovs.map(o => `<button class="wov ${o[0] === ov ? 'on' : ''}" data-windy="${o[0]}">${o[1]}</button>`).join('')}</div>
      <div class="windy"><iframe id="windy-frame" src="${windyUrl(lat, lon, ov)}" frameborder="0" allow="geolocation"></iframe></div>
    </div>`
    return `${windyHTML}<div class="pop-t">📅 Prossimi giorni</div>${daysHTML}<div class="pop-t">📊 Tutti i sensori</div>${gridHTML}`
  }

  _mainHTML(list, fc) {
    const weid = this._resolve('weather')
    const w = weid ? this._g(weid) : null
    const cond = (w && !isUn(w) ? w.state : null) || fc.current.icon || fc.today.icon
    const ci = condInfo(cond) || { e: '⛅', l: fc.current.summary || 'Meteo', g: 'partly' }
    const sky = skyTheme(cond, this._g('sun.sun'))
    const grp = sky.grp
    const loc = this._config.locationName || (w?.attributes?.friendly_name) || this._g('zone.home')?.attributes?.friendly_name ||'Meteo'
    const t = fmt(this._g(this._resolve('temp')))
    const fH = fmt(this._g(this._resolve('hum')))
    const fP = fmt(this._g(this._resolve('press')))
    const fW = fmt(this._g(this._resolve('wind')))
    const dirSt = this._g(this._resolve('dir'))
    const dirDeg = dirSt && !isUn(dirSt) ? Number(dirSt.state) : null
    const dirCard = dirDeg != null ? (degToCard(dirDeg) || '—') : '—'

    const chip = (svg, val, lbl) => `<div class="wchip">${svg}<span class="wcv">${val}</span><span class="wcl">${lbl}</span></div>`
    const un = u => u ? `<span style="font-size:9px;opacity:.7;margin-left:1px">${u}</span>` : ''

    const days = this._days()
    let lo = Infinity, hi = -Infinity
    days.forEach(d => { if (d.lo != null) lo = Math.min(lo, d.lo); if (d.hi != null) hi = Math.max(hi, d.hi) })
    if (!isFinite(lo)) lo = 0; if (!isFinite(hi)) hi = 1
    const span = hi > lo ? hi - lo : 1
    const daysHTML = days.map((d, i) => {
      const ci2 = condInfo(d.cond) || { e: '⛅' }
      const L = d.lo != null ? d.lo : lo, H = d.hi != null ? d.hi : hi
      const left = ((L - lo) / span) * 100, width = Math.max(14, ((H - L) / span) * 100)
      const pTxt = d.pmm != null ? d.pmm.toFixed(1) + 'mm' : (d.pp != null && d.pp > 0 ? d.pp + '%' : '')
      return `<div class="wday${i === 0 ? ' t0' : ''}">
        <div class="wd-l">${i === 0 ? 'OGGI' : (d.label || '').toUpperCase()}</div>
        <div class="wd-g">${ci2.e}</div>
        <div class="wd-h">${d.hi != null ? d.hi + '°' : '—'}</div>
        <div class="wd-bar"><div class="wd-fill" style="left:${left}%;width:${width}%"></div></div>
        <div class="wd-lo">${d.lo != null ? d.lo + '°' : ''}</div>
        ${pTxt ? `<div class="wd-p">${pTxt}</div>` : ''}
      </div>`
    }).join('')
    const op = this._daysOpen

    return `<div class="wcard" data-act="open" style="background:${sky.gradient}">
      <div class="wc-tint"></div>
      <div class="w-sky">${skyHTML(sky.grp, sky.phase)}</div>
      <div class="w-hd">
        <div style="min-width:0"><div class="w-loc">${loc}</div><div class="w-sub"><b>${fc.current.summary || ci.l}</b> &nbsp;·&nbsp; ${this._dateLabel()}</div></div>
        <button class="gear" data-act="settings" title="Impostazioni">${SVG_GEAR}</button>
      </div>
      <div class="w-cur">
        <div class="w-glyph">${wxGlyph(grp)}</div>
        <div><div class="w-temp">${t.v}<span class="deg">${t.u || '°'}</span></div><div class="w-curl">Temperatura attuale</div></div>
        <div class="w-clock">${this._clockInner()}</div>
      </div>
      <div class="w-chips">
        ${chip(svgHum(), fH.v + un('%'), 'Umidità')}
        ${chip(svgPress(), fP.v + un(fP.u), 'Pressione')}
        ${chip(svgWind(), fW.v + un(fW.u), 'Vento')}
        ${chip(svgDir(dirDeg), dirCard, 'Direzione')}
      </div>
      ${daysHTML ? `
      <div class="w-dhd" data-act="days"><span class="w-dhl">Prossimi giorni — tocca per i dettagli</span><span class="w-chev ${op ? 'op' : ''}">⌄</span></div>
      <div class="w-days" style="${op ? '' : 'max-height:0;opacity:0;margin:0'}">${daysHTML}</div>` : ''}
    </div>`
  }

  _settingsHTML() {
    const states = this._hass?.states || {}
    const optList = (pred, sel) => {
      const arr = Object.keys(states).filter(pred).sort()
      return '<option value="">— automatico —</option>' + arr.map(e => `<option value="${e}"${e === (sel || '') ? ' selected' : ''}>${e}</option>`).join('')
    }
    const wsel = optList(e => e.startsWith('weather.'), this._config.weatherEntity)
    const ssel = sel => optList(e => e.startsWith('sensor.'), sel)
    const field = (lbl, key, opts) => `<div class="sp-f"><label class="sp-l">${lbl}</label><select class="sp-sel" data-k="${key}">${opts}</select></div>`
    return `<div class="sov"><div class="spanel">
      <div class="sp-t">⛅ Impostazioni Meteo</div>
      <div class="sp-s">Scegli le entità (vuoto = rilevamento automatico)</div>
      <div class="sp-f"><label class="sp-l">Nome località</label><input class="sp-sel" type="text" data-k="locationName" value="${(this._config.locationName || '').replace(/"/g, '&quot;')}" placeholder="es. Castenedolo"></div>
      <div class="sp-f" style="display:flex;gap:8px">
        <div style="flex:1"><label class="sp-l">Latitudine (mappa)</label><input class="sp-sel" type="text" data-k="lat" value="${this._config.lat || ''}" placeholder="45.49"></div>
        <div style="flex:1"><label class="sp-l">Longitudine (mappa)</label><input class="sp-sel" type="text" data-k="lon" value="${this._config.lon || ''}" placeholder="10.29"></div>
      </div>
      ${field('Entità Weather (condizione + previsioni)', 'weatherEntity', wsel)}
      ${field('Temperatura', 'tempEntity', ssel(this._config.tempEntity))}
      ${field('Umidità', 'humEntity', ssel(this._config.humEntity))}
      ${field('Pressione', 'pressEntity', ssel(this._config.pressEntity))}
      ${field('Vento', 'windEntity', ssel(this._config.windEntity))}
      ${field('Direzione vento', 'dirEntity', ssel(this._config.dirEntity))}
      <div class="sp-row">
        <button class="sp-btn sp-cancel" data-act="scancel">Annulla</button>
        <button class="sp-btn sp-save" data-act="ssave">Salva</button>
      </div>
    </div></div>`
  }

  _openSettings() {
    this._closeSettings()
    const d = document.createElement('div')
    d.style.cssText = 'position:fixed;inset:0;z-index:99992'
    d.attachShadow({ mode: 'open' })
    d.shadowRoot.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="ssave"]')) {
        const patch = {}
        d.shadowRoot.querySelectorAll('select[data-k],input[data-k]').forEach(s => { patch[s.dataset.k] = s.value.trim ? s.value.trim() : s.value })
        this._closeSettings(); this._saveCfg(patch); return
      }
      if (e.target.closest('[data-act="scancel"]') || (e.target.closest('.sov') && !e.target.closest('.spanel'))) this._closeSettings()
    })
    document.body.appendChild(d)
    this._settingsPortal = d
    d.shadowRoot.innerHTML = `<style>${CSS_M}</style>${this._settingsHTML()}`
  }
  _closeSettings() { if (this._settingsPortal) { this._settingsPortal.remove(); this._settingsPortal = null } }

  _build() {
    if (!this._hass) return
    const list = this._collect()
    const fc = this._forecast()
    this.shadowRoot.innerHTML = `<style>${CSS_M}</style>${this._mainHTML(list, fc)}`
  }
}

if (!customElements.get('meteo-card')) {
  customElements.define('meteo-card', MeteoCard)
}

window.FratechCardRegistry = window.FratechCardRegistry || {}
window.FratechCardRegistry['meteo-card'] = {
  id: 'meteo-card', name: 'Stazione Meteo', icon: '⛅', version: '2.4.0',
  desc: 'Ecowitt + Pirate Weather — hero cielo dinamico e card per categoria',
  _makeHass() {
    const s = {}, h = (typeof hs !== 'undefined') ? hs : {}, a = (typeof ha !== 'undefined') ? ha : {}
    Object.keys(h).forEach(id => { s[id] = { state: h[id], attributes: a[id] || {}, entity_id: id } })
    return {
      states: s,
      callService(d, sv, dt) {
        if (typeof send === 'function') send({ type: 'call_service', domain: d, service: sv, service_data: dt || {} })
        else if (typeof callSvc === 'function') { const e = dt?.entity_id || '', x = {}; if (dt) Object.keys(dt).forEach(k => { if (k !== 'entity_id') x[k] = dt[k] }); callSvc(d, sv, e, x) }
      }
    }
  },
  render(c, h) { return '<meteo-card style="display:block;width:100%;height:100%"></meteo-card>' },
  mount(c, h, el) { const x = el.querySelector('meteo-card'); if (!x) return; x.setConfig(c); try { x.hass = this._makeHass() } catch (e) {} },
  update(c, h, el) { const x = el.querySelector('meteo-card'); if (!x) return; try { x.hass = this._makeHass() } catch (e) {} },
}

console.log('[FratechStore] Card registrata: meteo-card v2.4.0')

;(function () {
  if (window.__fratechJsCardPatch) return
  function patch() {
    if (typeof saveCard !== 'function' || typeof openCM !== 'function' || typeof jsStoreAddCard !== 'function') { setTimeout(patch, 200); return }
    window.__fratechJsCardPatch = true
    const _oCM = openCM
    window.openCM = function (id) {
      _oCM(id)
      const page = typeof curPage === 'function' ? curPage() : null; if (!page) return
      const c = page.cards.find(x => x.id === id); if (!c || c.type !== 'js-custom') return
      const sel = document.getElementById('cm-type'); if (!sel) return
      if (!sel.querySelector('option[value="js-custom"]')) { const o = document.createElement('option'); o.value = 'js-custom'; o.textContent = '📦 Card JS'; sel.appendChild(o) }
      sel.value = 'js-custom'
      ;['fr-entity', 'fr-unit', 'fr-max', 'fr-min', 'fr-hours', 'fr-solar', 'fr-load', 'fr-grid', 'fr-battery', 'fr-ent2', 'fr-ent3', 'fr-refresh', 'fr-sub', 'fr-content', 'fr-imageurl', 'fr-pelements', 'fr-threshold', 'fr-groups', 'fr-items', 'fr-wf-temp', 'fr-wf-hum', 'fr-wf-wind', 'fr-wf-days'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none' })
    }
    const _oSC = saveCard
    window.saveCard = function () {
      const page = typeof curPage === 'function' ? curPage() : null; if (!page) return _oSC()
      const eid = typeof editingId !== 'undefined' ? editingId : null; if (!eid) return _oSC()
      const c = page.cards.find(x => x.id === eid); if (!c || c.type !== 'js-custom') return _oSC()
      const t = c.type, j = c.jsCardId; _oSC()
      const c2 = page.cards.find(x => x.id === eid)
      if (c2) { c2.type = t; c2.jsCardId = j; if (typeof saveCfg === 'function') saveCfg(); if (typeof renderDash === 'function') renderDash() }
    }
  }
  patch()
})()
