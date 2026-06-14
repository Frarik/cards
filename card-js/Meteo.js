/* frarik-version: 1.39 */

// ── Lookup tables ─────────────────────────────────────────────────────────────
const _WI = {
  'clear-night':'🌙','sunny':'☀️','partlycloudy':'⛅',
  'partly-cloudy-day':'🌤️','partly-cloudy-night':'🌙',
  'cloudy':'☁️','fog':'🌫️','hail':'🌨️','lightning':'⚡',
  'lightning-rainy':'⛈️','pouring':'🌧️','rainy':'🌦️',
  'snowy':'❄️','snowy-rainy':'🌨️','windy':'💨','windy-variant':'💨','exceptional':'⚠️',
}
const _CI = {
  'clear-night':'Sereno','sunny':'Soleggiato','partlycloudy':'Parz. Nuvoloso',
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
function _fmtDate(d=new Date()){ return `${_DI[d.getDay()]} ${d.getDate()} ${_MI[d.getMonth()]}` }
function _fmtDay(dt){ const d=typeof dt==='string'?new Date(dt):dt; return _DS[d.getDay()] }
function _windDir(b){
  if(b==null||b==='') return 'N/D'
  if(typeof b==='string'&&isNaN(Number(b))) return b.toUpperCase()
  return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'][Math.round(Number(b)/22.5)%16]
}
function _tempCol(t){ const n=parseFloat(t); return n>=28?'#fbbf24':n>=22?'#f97316':n>=14?'#94a3b8':'#60a5fa' }
function _n(v){ const n=parseFloat(v); return(v==null||isNaN(n))?'--':String(Math.round(n)) }

// ── Sky helpers ───────────────────────────────────────────────────────────────
function _moonPhaseNum(date){
  return(((date-new Date('2000-01-06T18:14:00Z'))/86400000)%29.530588868+29.530588868)%29.530588868
}

function _lerpHex(h1,h2,t){
  const p=h=>[parseInt(h.slice(1,3),16)||0,parseInt(h.slice(3,5),16)||0,parseInt(h.slice(5,7),16)||0]
  const [r1,g1,b1]=p(h1),[r2,g2,b2]=p(h2)
  return '#'+[r1+(r2-r1)*t,g1+(g2-g1)*t,b1+(b2-b1)*t].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')
}

function _isNightNow(sunState,cond){
  if(sunState==='below_horizon') return true
  if(cond&&cond.includes('night')) return true
  return false
}

function _condCoverage(cond){
  if(['cloudy','fog'].includes(cond)) return 95
  if(['rainy','pouring','lightning','lightning-rainy','snowy-rainy'].includes(cond)) return 88
  if(['snowy'].includes(cond)) return 72
  if(['partlycloudy','partly-cloudy-day','partly-cloudy-night'].includes(cond)) return 52
  if(['windy-variant'].includes(cond)) return 28
  return 5
}

function _sunSVG(){
  const R=30, rays=[0,45,90,135,180,225,270,315].map(a=>{
    const rd=a*Math.PI/180
    const x1=(R+Math.cos(rd)*19).toFixed(1),y1=(R+Math.sin(rd)*19).toFixed(1)
    const x2=(R+Math.cos(rd)*27).toFixed(1),y2=(R+Math.sin(rd)*27).toFixed(1)
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffd54f" stroke-width="3" stroke-linecap="round"/>`
  }).join('')
  return `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sg" cx="50%" cy="50%">
        <stop offset="0%" stop-color="rgba(255,253,230,.9)"/>
        <stop offset="50%" stop-color="rgba(255,220,80,.15)"/>
        <stop offset="100%" stop-color="rgba(255,180,0,0)"/>
      </radialGradient>
    </defs>
    <circle cx="${R}" cy="${R}" r="28" fill="url(#sg)"/>
    ${rays}
    <circle cx="${R}" cy="${R}" r="13" fill="#fffde7"/>
    <circle cx="${R}" cy="${R}" r="10.5" fill="#fff9e0"/>
    <circle cx="${R}" cy="${R}" r="7.5" fill="#fffce8"/>
  </svg>`
}

function _moonSVG(phase){
  const norm=phase/29.530588868
  const R=22,D=R*2,uid=(norm*1000|0)
  const f=(1-Math.cos(norm*2*Math.PI))/2
  if(f<0.015){
    return `<svg width="${D}" height="${D}" viewBox="0 0 ${D} ${D}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${R}" cy="${R}" r="${R}" fill="rgba(8,6,18,.5)" stroke="rgba(255,255,255,.06)" stroke-width=".8"/>
    </svg>`
  }
  const waxing=norm<=0.5
  const k=Math.max(0,(f<0.5?R*(1-2*f):R*(2*f-1))).toFixed(2)
  const so=waxing?1:0
  const si=f<0.5?(waxing?0:1):(waxing?1:0)
  const gOp=(f*0.18).toFixed(3)
  return `<svg width="${D+14}" height="${D+14}" viewBox="-7 -7 ${D+14} ${D+14}" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="mc${uid}"><circle cx="${R}" cy="${R}" r="${R}"/></clipPath></defs>
    <circle cx="${R}" cy="${R}" r="${R+6}" fill="rgba(230,225,195,${gOp})"/>
    <circle cx="${R}" cy="${R}" r="${R}" fill="#05070f"/>
    <path d="M${R} 0 A${R} ${R} 0 0 ${so} ${R} ${D} A${k} ${R} 0 0 ${si} ${R} 0 Z" fill="rgba(242,237,210,.95)" clip-path="url(#mc${uid})"/>
    <circle cx="${R-6}" cy="${R-5}" r="3.5" fill="#000" opacity=".065" clip-path="url(#mc${uid})"/>
    <circle cx="${R+4}" cy="${R+5}" r="2.5" fill="#000" opacity=".05" clip-path="url(#mc${uid})"/>
    <circle cx="${R+1}" cy="${R-3}" r="1.5" fill="#000" opacity=".04" clip-path="url(#mc${uid})"/>
    <circle cx="${R-3}" cy="${R+7}" r="1.2" fill="#000" opacity=".035" clip-path="url(#mc${uid})"/>
  </svg>`
}

function _starsHTML(){
  return Array.from({length:58},(_,i)=>{
    const x=(((i*137+31)%97)/97*100).toFixed(1)
    const y=(((i*97+13)%70)/70*80).toFixed(1)
    const s=i%7===0?2.2:i%3===0?1.6:1
    const op=(0.4+(i%5)*0.12).toFixed(2)
    const td=(2+i%4)
    const dl=((i*0.37)%3).toFixed(1)
    return `<div class="star" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;--op:${op};--td:${td}s;--dl:${dl}s;"></div>`
  }).join('')
}

function _cloudShapeSVG(w,h,op){
  const cx=w/2,cy=h*0.62
  const c=`rgba(215,222,228,${op})`,c2=`rgba(230,235,240,${Math.min(.99,op*1.06).toFixed(2)})`
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <ellipse cx="${cx}" cy="${cy+4}" rx="${(w*.44).toFixed(1)}" ry="${(h*.28).toFixed(1)}" fill="${c}"/>
    <ellipse cx="${(cx-w*.22).toFixed(1)}" cy="${(cy-h*.1).toFixed(1)}" rx="${(w*.24).toFixed(1)}" ry="${(h*.35).toFixed(1)}" fill="${c2}"/>
    <ellipse cx="${(cx+w*.18).toFixed(1)}" cy="${(cy-h*.08).toFixed(1)}" rx="${(w*.28).toFixed(1)}" ry="${(h*.32).toFixed(1)}" fill="${c2}"/>
    <ellipse cx="${cx}" cy="${(cy-h*.18).toFixed(1)}" rx="${(w*.22).toFixed(1)}" ry="${(h*.38).toFixed(1)}" fill="${c2}"/>
    <ellipse cx="${(cx-w*.08).toFixed(1)}" cy="${(cy+2).toFixed(1)}" rx="${(w*.42).toFixed(1)}" ry="${(h*.24).toFixed(1)}" fill="${c}"/>
  </svg>`
}

function _cloudsHTML(coverage){
  if(coverage<8) return ''
  const op=Math.min(.97,coverage/100*1.08)
  const defs=[
    {top:'6%', w:162,h:72,spd:128,dl:0},
    {top:'15%',w:122,h:55,spd:98, dl:-38},
    {top:'2%', w:192,h:84,spd:165,dl:-72},
    {top:'22%',w:102,h:48,spd:84, dl:-55},
  ]
  const count=coverage>70?4:coverage>40?3:coverage>20?2:1
  return defs.slice(0,count).map((l,i)=>
    `<div class="cloud" style="top:${l.top};--spd:${l.spd}s;--dl:${l.dl}s;">${_cloudShapeSVG(l.w,l.h,op*(1-.06*i))}</div>`
  ).join('')
}

function _rainHTML(heavy){
  const n=heavy?65:38
  return '<div class="rain">'+Array.from({length:n},(_,i)=>{
    const l=((i*73+11)%97)
    const dur=(0.48+((i*37)%10)*.052).toFixed(2)
    const dl=((i*.19)%1.4).toFixed(2)
    const op=(0.3+((i*7)%5)*.07).toFixed(2)
    const h=heavy?10+i%7:7+i%5,w=heavy?1.8:1.4
    return `<div class="rdrop" style="left:${l}%;width:${w}px;height:${h}px;--dur:${dur}s;--dl:-${dl}s;opacity:${op};"></div>`
  }).join('')+'</div>'
}

function _snowHTML(){
  return '<div class="snow">'+Array.from({length:28},(_,i)=>{
    const l=((i*83+7)%97)
    const dur=(2.2+((i*43)%12)*.22).toFixed(1)
    const dl=((i*.41)%3.5).toFixed(2)
    const s=3+i%4,dx=((i*31)%30)-15
    return `<div class="sflake" style="left:${l}%;width:${s}px;height:${s}px;--dur:${dur}s;--dl:-${dl}s;--dx:${dx}px;"></div>`
  }).join('')+'</div>'
}

function _lightningHTML(){
  return `<div class="ltg-wrap">
    <svg class="ltg l1" viewBox="0 0 72 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="lg1"><feGaussianBlur stdDeviation="2.2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter></defs>
      <polyline points="46,0 23,78 40,78 8,200" stroke="#fffde0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" filter="url(#lg1)"/>
      <polyline points="46,0 23,78 40,78 8,200" stroke="#fff" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>
    </svg>
    <svg class="ltg l2" viewBox="0 0 58 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="38,0 19,60 33,60 7,160" stroke="#fffde0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>`
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
const _TILE_EMOJIS=['💧','📊','🌡️','💨','🧭','☀️','🌤️','⛅','🌥️','☁️','🌧️','⛈️','❄️','🔥','💡','🏠','🔌','🔋','⚡','📡','📶','🌿','🌱','🌊','🌬️','🌪️','🌈','🌙','⭐','💫','✨','🎯','✅','🔔','⏱️','⏰','📌','🏔️','🌅','🌃','🎭','🌺','🍃','🌾','🍂','💎','🚀','✈️','🚗','🔊','📏','⚖️','🧪']
const _TILE_DEF_ICO={hum:'💧',pres:'📊',wind:'💨',wdir:'🧭'}
const _MDI_ICONS=['thermometer','thermometer-high','thermometer-low','temperature-celsius','water-percent','water','water-outline','water-check','raindrop','weather-sunny','weather-night','weather-partly-cloudy','weather-cloudy','weather-rainy','weather-pouring','weather-snowy','weather-snowy-rainy','weather-lightning','weather-lightning-rainy','weather-fog','weather-windy','weather-tornado','weather-hurricane','weather-dust','weather-hail','fan','air-filter','gauge','compass','compass-rose','wind-turbine','waves','snowflake','cloud','cloud-outline','lightning-bolt','lightning-bolt-outline','home','home-outline','home-thermometer','power-plug','battery','battery-charging','battery-high','solar-panel','solar-power','radiator','radiator-off','air-conditioner','heat-wave','fire','lightbulb','lightbulb-outline','lightbulb-on','chart-line','chart-bar','chart-areaspline','chart-pie','trending-up','trending-down','bell','bell-ring','bell-outline','alert','alert-circle','check-circle','information','timer','timer-outline','clock','clock-outline','calendar','alarm','leaf','flower','flower-outline','tree','grass','mountain','earth','globe-model','recycle','car','bicycle','walk','run','robot','heart','star','star-outline','eye','lock','key','shield','wifi','signal','cellphone','laptop','television','cpu-64-bit','memory','harddisk','cog','wrench','tools','magnify']

// ── CSS ───────────────────────────────────────────────────────────────────────
const _CSS = `
:host{display:block;}
*{box-sizing:border-box;margin:0;padding:0;}
.card{border-radius:20px;overflow:hidden;font-family:var(--primary-font-family,system-ui,sans-serif);color:#fff;position:relative;box-shadow:0 12px 48px rgba(0,0,0,.6);}
/* ── Sky ── */
.sky{position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:inherit;transition:background 90s linear;}
.sky-stars{position:absolute;inset:0;pointer-events:none;transition:opacity 3s;}
.star{position:absolute;border-radius:50%;background:#fff;animation:twinkle var(--td,3s) ease-in-out infinite var(--dl,0s);}
@keyframes twinkle{0%,100%{opacity:var(--op,.6)}50%{opacity:calc(var(--op,.6)*.2)}}
.sky-horizon{position:absolute;inset:0;pointer-events:none;}
.celestial{position:absolute;pointer-events:none;transform:translate(-50%,-50%);z-index:1;transition:left 60s linear,top 60s linear;}
.sky-clouds{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2;}
.cloud{position:absolute;animation:cldmv var(--spd,120s) linear infinite var(--dl,0s);}
@keyframes cldmv{from{transform:translateX(-210px)}to{transform:translateX(115vw)}}
.sky-fx{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:3;}
.rain{position:absolute;inset:0;}
.rdrop{position:absolute;top:-20px;background:linear-gradient(transparent,rgba(150,192,232,.68));border-radius:1px;animation:rdfall var(--dur,.7s) linear infinite var(--dl,0s);}
@keyframes rdfall{0%{transform:rotate(12deg) translateY(-10px);opacity:0}8%{opacity:1}88%{opacity:.7}100%{transform:rotate(12deg) translateY(110vh);opacity:0}}
.snow{position:absolute;inset:0;}
.sflake{position:absolute;top:-12px;border-radius:50%;background:rgba(255,255,255,.88);animation:sfall var(--dur,3s) linear infinite var(--dl,0s);}
@keyframes sfall{0%{transform:translateX(0) translateY(-5px) rotate(0);opacity:0}8%{opacity:.9}88%{opacity:.75}100%{transform:translateX(var(--dx,8px)) translateY(110vh) rotate(360deg);opacity:0}}
.ltg-wrap{position:absolute;inset:0;}
.ltg{position:absolute;opacity:0;}
.ltg.l1{left:24%;top:0;width:72px;height:56%;animation:fl1 4.2s linear infinite;}
.ltg.l2{left:62%;top:4%;width:58px;height:46%;animation:fl2 4.2s 1.7s linear infinite;}
@keyframes fl1{0%,85%,88%,91%,100%{opacity:0}86%,87%{opacity:1}89%,90%{opacity:.65}}
@keyframes fl2{0%,82%,85%,88%,100%{opacity:0}83%,84%{opacity:.9}86%,87%{opacity:.45}}
@keyframes wxSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes wxBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
@keyframes wxRain{0%{opacity:0;transform:translateY(0)}15%{opacity:.85}85%{opacity:.85}100%{opacity:0;transform:translateY(14px)}}
@keyframes wxSnow{0%{opacity:0;transform:translateY(0) rotate(0deg)}15%{opacity:.9}85%{opacity:.9}100%{opacity:0;transform:translateY(12px) rotate(90deg)}}
@keyframes wxFlash{0%,72%,100%{opacity:.2}77%,87%{opacity:1}80%,90%{opacity:.3}}
@keyframes wxDrift{0%{transform:translateX(-3px)}100%{transform:translateX(3px)}}
@keyframes wxMoon{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes wxTwink{0%,100%{opacity:.2}50%{opacity:.9}}
@keyframes wxWarn{0%,100%{opacity:.8}50%{opacity:1}}
.fog-layer{position:absolute;inset:0;background:rgba(175,190,200,.3);backdrop-filter:blur(3px);}
/* ── Body ── */
.body{position:relative;z-index:4;padding:16px 16px 0;}
.hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;}
.city{font-size:32px;font-weight:900;letter-spacing:-.5px;line-height:1.1;text-shadow:0 2px 14px rgba(0,0,0,.5);}
.sub{display:flex;align-items:center;gap:7px;margin-top:5px;}
.cond{font-size:13px;font-weight:700;color:#fff;}
.dot-sep{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.4);}
.dt{font-size:13px;color:#fff;font-weight:500;}
.gbtn{width:30px;height:30px;border-radius:8px;border:none;background:rgba(0,0,0,.18);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;transition:background .15s;margin-top:2px;backdrop-filter:blur(4px);}
.gbtn:hover{background:rgba(0,0,0,.3);}
.gbtn.on{background:rgba(255,255,255,.15);color:#fff;}
button[data-a="gear"]{display:var(--fgear,none);}
.tz{display:flex;align-items:center;gap:18px;padding:6px 0 4px;}
.tic{line-height:0;filter:drop-shadow(0 2px 12px rgba(0,0,0,.3));}
.ts{display:flex;flex-direction:column;}
.tn{font-size:70px;font-weight:900;line-height:1;letter-spacing:-4px;display:flex;align-items:flex-start;text-shadow:0 2px 24px rgba(0,0,0,.4);}
.tdeg{font-size:34px;font-weight:600;margin-top:10px;letter-spacing:0;}
.tl{font-size:12px;color:#fff;margin-top:5px;font-weight:500;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:10px 0 10px;}
.stats-wrap{overflow:hidden;position:relative;padding:10px 0 4px;touch-action:pan-y;user-select:none;cursor:grab;}
.stats-wrap:active{cursor:grabbing;}
.stats-track{display:flex;will-change:transform;}
.stats-page{display:flex;gap:7px;min-width:100%;flex-shrink:0;}
.stats-page .stl{flex:1;min-width:0;}
.stl{border-radius:12px;padding:10px 7px 9px;display:flex;flex-direction:column;align-items:center;gap:4px;backdrop-filter:blur(6px);cursor:pointer;transition:filter .12s,transform .1s;}
.stl:hover{filter:brightness(1.25);}
.stl:active{transform:scale(.95);}
.sic{color:#fff;}
.sv{font-size:14px;font-weight:800;letter-spacing:-.3px;line-height:1;color:#fff;}
.sl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#fff;}
.fct{display:flex;align-items:center;justify-content:space-between;padding:11px 2px;border-top:1px solid rgba(255,255,255,.1);cursor:pointer;user-select:none;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;transition:opacity .15s;color:#fff;}
.fct:hover{opacity:.75;}
.fcg{display:none;grid-template-columns:repeat(auto-fit,minmax(52px,1fr));gap:6px;padding-bottom:14px;}
.fcg.open{display:grid;}
.fcc{border-radius:12px;border:1px solid rgba(255,255,255,.09);background:rgba(0,0,0,.18);padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;transition:background .12s;backdrop-filter:blur(4px);}
.fcc:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);}
.fdn{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#fff;}
.fi{line-height:0;margin:3px 0 2px;display:flex;align-items:center;justify-content:center;}
.fm{font-size:18px;font-weight:800;letter-spacing:-.5px;line-height:1;color:#fff;}
.fb{width:75%;height:3px;border-radius:99px;margin:2px 0 2px;}
.fmi{font-size:11px;color:#fff;font-weight:600;}
.fr{font-size:8px;color:#fff;margin-top:1px;}
/* settings */
.sov{position:fixed;inset:0;z-index:99999;display:none;align-items:flex-end;background:rgba(0,0,0,.68);backdrop-filter:blur(6px);color:#f1f5f9;font-family:var(--primary-font-family,system-ui,sans-serif);}
.sov.open{display:flex;}
@keyframes slideUpSov{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sov-modal{width:100%;max-height:92vh;display:flex;flex-direction:column;background:rgba(10,8,20,.98);border:1px solid rgba(139,92,246,.32);border-bottom:none;border-radius:20px 20px 0 0;overflow:hidden;box-shadow:0 -12px 60px rgba(0,0,0,.8);animation:slideUpSov .22s cubic-bezier(.32,1.12,.56,1);}
.shdr{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0;}
.sico{width:34px;height:34px;border-radius:9px;flex-shrink:0;background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);display:flex;align-items:center;justify-content:center;color:#fbbf24;}
.stit{font-size:14px;font-weight:700;}
.ssub{font-size:10px;color:#fff;margin-top:1px;}
.scls{margin-left:auto;width:28px;height:28px;border-radius:7px;border:none;background:rgba(255,255,255,.06);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;}
.scls:hover{background:rgba(255,255,255,.12);}
.sov-2col{display:flex;flex:1;overflow:hidden;min-height:0;}
.sbdy{width:400px;flex-shrink:0;overflow-y:auto;padding:14px 16px;border-right:1px solid rgba(255,255,255,.07);}
.sov-prev{flex:1;min-width:240px;display:flex;flex-direction:column;gap:10px;padding:14px 16px;overflow-y:auto;background:rgba(0,0,0,.15);}
.prev-ttl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.5);}
.prev-wrap{border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.08);}
.lsect{padding-top:12px;border-top:1px solid rgba(255,255,255,.08);}
.layout-row{display:flex;align-items:center;gap:8px;margin-top:10px;}
.layout-lbl{font-size:11px;font-weight:700;color:#fff;width:72px;flex-shrink:0;}
.layout-val{font-size:12px;font-weight:800;color:#fbbf24;width:54px;text-align:right;flex-shrink:0;}
input[type=range].lslider{flex:1;cursor:pointer;accent-color:#fbbf24;height:4px;}
@media(max-width:620px){.sov-2col{flex-direction:column!important;overflow-y:auto!important;overflow-x:hidden!important}.sbdy{width:100%!important;border-right:none!important;border-bottom:1px solid rgba(255,255,255,.07)!important;overflow-y:visible!important;flex-shrink:0!important}.sov-prev{min-width:0!important;overflow-y:visible!important}}
.fl{font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;margin-top:12px;}
.fl:first-child{margin-top:0;}
.er{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);}
.ei{flex:1;min-width:0;}
.en{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;}
.eid{font-size:10px;color:#fff;margin-top:1px;}
.cbtn{padding:5px 12px;border-radius:7px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;}
.cbtn:hover{background:rgba(255,255,255,.18);}
.esr{display:none;margin-top:6px;border-radius:10px;border:1px solid rgba(255,255,255,.12);overflow:hidden;background:rgba(10,8,22,1);}
.esr.open{display:block;}
.el{max-height:160px;overflow-y:auto;}
.eo{padding:8px 12px;cursor:pointer;font-size:12px;color:#fff;border-bottom:1px solid rgba(255,255,255,.06);}
.eo:hover{background:rgba(255,255,255,.08);color:#fff;}
.eo.sel{color:#fbbf24;font-weight:700;}
.ci{width:100%;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#fff;font-size:13px;font-family:inherit;outline:none;}
.ci:focus{border-color:rgba(255,255,255,.4);}
.ci::placeholder{color:rgba(255,255,255,.35);}
.ht{font-size:10px;color:rgba(255,255,255,.55);margin-top:4px;}
.inp-grp{position:relative;}
.sft{padding:12px 16px;border-top:1px solid rgba(255,255,255,.08);flex-shrink:0;}
.sav{width:100%;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;}
.sav:hover{opacity:.88;}
.ph{padding:32px 20px;text-align:center;color:rgba(255,255,255,.35);font-size:12px;display:flex;flex-direction:column;align-items:center;gap:10px;}
.phi{font-size:38px;opacity:.3;}
`

// ── Station categories ────────────────────────────────────────────────────────
const _STATION_CATS=[
  {key:'rain',     icon:'🌧️', label:'Pioggia',     color:'#38bdf8',
   sensors:[
     {f:'sRainRate',       lbl:'Intensità Pioggia'},
     {f:'sHourlyRain',     lbl:'Pioggia Oraria'},
     {f:'sDailyRain',      lbl:'Pioggia Giornaliera'},
     {f:'sEventRain',      lbl:'Pioggia Evento'},
     {f:'s24hRain',        lbl:'Pioggia 24h'},
     {f:'sWeeklyRain',     lbl:'Pioggia Settimanale'},
     {f:'sMonthlyRain',    lbl:'Pioggia Mensile'},
     {f:'sYearlyRain',     lbl:'Pioggia Annuale'},
     {f:'sTotalRain',      lbl:'Pioggia Totale'},
     {f:'sPwPrecip0d',     lbl:'PW Max Precipit. Oggi'},
     {f:'sPwPrecip1d',     lbl:'PW Max Precipit. Domani'},
     {f:'sPwPrecipProb0d', lbl:'PW Prob. Pioggia Oggi'},
   ]},
  {key:'wind',     icon:'💨', label:'Vento',       color:'#a78bfa',
   sensors:[
     {f:'sWindSpeed',  lbl:'Velocità Vento'},
     {f:'sWindGust',   lbl:'Raffica Vento'},
     {f:'sWindDir',    lbl:'Direzione Vento'},
     {f:'sWindDir10m', lbl:'Direzione 10m'},
     {f:'sMaxGust',    lbl:'Raffica Max Giorn.'},
     {f:'sWindchill',  lbl:'Windchill'},
   ]},
  {key:'temp',     icon:'🌡️', label:'Temperatura', color:'#f97316',
   sensors:[
     {f:'sOutdoorTemp', lbl:'Temperatura Esterna'},
     {f:'sFeelsLike',   lbl:'Temperatura Percepita'},
     {f:'sIndoorTemp',  lbl:'Temperatura Interna'},
     {f:'sDewpoint',    lbl:'Punto di Rugiada'},
     {f:'sIndoorDew',   lbl:'Rugiada Interna'},
     {f:'sPwDew0d',     lbl:'PW Rugiada Oggi'},
     {f:'sPwDew1d',     lbl:'PW Rugiada Domani'},
     {f:'sPwHighTemp0d',lbl:'PW Max Temp Oggi'},
     {f:'sPwHighTemp1d',lbl:'PW Max Temp Domani'},
     {f:'sPwHighApp0d', lbl:'PW Percepita Oggi'},
     {f:'sPwHighApp1d', lbl:'PW Percepita Domani'},
   ]},
  {key:'pressure', icon:'📊', label:'Pressione',   color:'#fbbf24',
   sensors:[
     {f:'sRelPres',      lbl:'Pressione Relativa'},
     {f:'sAbsPres',      lbl:'Pressione Assoluta'},
     {f:'sPwPressure',   lbl:'PW Pressione Corrente'},
     {f:'sPwPressure0d', lbl:'PW Pressione Oggi'},
   ]},
  {key:'humidity', icon:'💧', label:'Umidità',     color:'#34d399',
   sensors:[
     {f:'sHumidity',   lbl:'Umidità Esterna'},
     {f:'sIndoorHum',  lbl:'Umidità Interna'},
     {f:'sVpd',        lbl:'Deficit Press. Vapore'},
   ]},
  {key:'solar',    icon:'☀️', label:'Sole & UV',   color:'#fb923c',
   sensors:[
     {f:'sSolarRad',    lbl:'Radiazione Solare'},
     {f:'sSolarLux',    lbl:'Luminosità Solare'},
     {f:'sUvIndex',     lbl:'Indice UV (Stazione)'},
     {f:'sPwUvNow',     lbl:'PW UV Index Corrente'},
     {f:'sPwUvIndex0d', lbl:'PW UV Index Oggi'},
     {f:'sPwCloud',     lbl:'Copertura Nuvolosa'},
     {f:'sPwCloud0d',   lbl:'Nuvole Oggi'},
     {f:'sPwCloud1d',   lbl:'Nuvole Domani'},
     {f:'sCape',        lbl:'Energia Convettiva (CAPE)'},
   ]},
  {key:'pwinfo',   icon:'🌐', label:'PirateWeather',color:'#c084fc',
   sensors:[
     {f:'sPwSummary',   lbl:'Condizioni Ora'},
     {f:'sPwSummary0d', lbl:'Previsione Oggi'},
   ]},
]
const _STATION_SPECIALS=[
  {f:'sGhiaccio',icon:'❄️',label:'Ghiaccio Notturno',color:'#67e8f9'},
  {f:'sAlerts',  icon:'⚠️',label:'Allerte Meteo',     color:'#fca5a5'},
]

// ── Animated weather SVG icons ────────────────────────────────────────────────
function _wxSVG(cond,sz=64){
  const C='rgba(180,195,210,.96)',CD='rgba(130,148,168,.92)'
  const cld=(cx,cy,col=C)=>
    `<ellipse cx="${cx-9}" cy="${cy+5}" rx="10" ry="8" fill="${col}"/>`+
    `<ellipse cx="${cx+9}" cy="${cy+5}" rx="10" ry="8" fill="${col}"/>`+
    `<ellipse cx="${cx}" cy="${cy}" rx="13" ry="11" fill="${col}"/>`+
    `<ellipse cx="${cx}" cy="${cy+9}" rx="16" ry="7" fill="${col}"/>`
  const drop=(x,y,dl,sp=.9)=>
    `<line x1="${x}" y1="${y}" x2="${x-2}" y2="${y+9}" stroke="#60a5fa" stroke-width="1.8" stroke-linecap="round" style="animation:wxRain ${sp}s linear ${dl}s infinite;opacity:0"/>`
  const flake=(x,y,dl)=>
    `<g transform="translate(${x},${y})" style="animation:wxSnow 2.2s linear ${dl}s infinite;opacity:0">`+
    `<line x1="-4" y1="0" x2="4" y2="0" stroke="rgba(210,235,255,.95)" stroke-width="1.5" stroke-linecap="round"/>`+
    `<line x1="0" y1="-4" x2="0" y2="4" stroke="rgba(210,235,255,.95)" stroke-width="1.5" stroke-linecap="round"/>`+
    `<line x1="-2.8" y1="-2.8" x2="2.8" y2="2.8" stroke="rgba(210,235,255,.95)" stroke-width="1.2" stroke-linecap="round"/>`+
    `<line x1="2.8" y1="-2.8" x2="-2.8" y2="2.8" stroke="rgba(210,235,255,.95)" stroke-width="1.2" stroke-linecap="round"/></g>`
  const rayz=(cx,cy,r1,r2,col='#FFD700')=>
    [0,45,90,135,180,225,270,315].map(a=>{
      const r=a*Math.PI/180
      return `<line x1="${(cx+Math.cos(r)*r1).toFixed(1)}" y1="${(cy+Math.sin(r)*r1).toFixed(1)}" x2="${(cx+Math.cos(r)*r2).toFixed(1)}" y2="${(cy+Math.sin(r)*r2).toFixed(1)}" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>`
    }).join('')
  const bolt=`<polygon points="34,30 28,42 33,42 27,56 40,39 34,39 38,30" fill="#fde047" style="animation:wxFlash 2.5s ease-in-out infinite"/>`
  const S=b=>`<svg viewBox="0 0 64 64" width="${sz}" height="${sz}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">${b}</svg>`
  switch(cond){
    case 'sunny':
      return S(`<g style="animation:wxSpin 12s linear infinite;transform-box:fill-box;transform-origin:center">${rayz(32,32,16,24)}</g>`+
        `<circle cx="32" cy="32" r="11.5" fill="#FFD700"/><circle cx="32" cy="32" r="8.5" fill="#ffe57f"/>`)
    case 'clear-night':
      return S(`<g style="animation:wxMoon 4s ease-in-out infinite">`+
        `<circle cx="32" cy="30" r="15" fill="#e0cf88"/><circle cx="40" cy="24" r="12.5" fill="#040a18"/></g>`+
        `<circle cx="14" cy="12" r="1.4" fill="white" style="animation:wxTwink 1.6s ease-in-out 0s infinite"/>`+
        `<circle cx="52" cy="16" r="1.2" fill="white" style="animation:wxTwink 2s ease-in-out .4s infinite"/>`+
        `<circle cx="10" cy="46" r="1.3" fill="white" style="animation:wxTwink 1.8s ease-in-out .2s infinite"/>`+
        `<circle cx="54" cy="50" r="1.1" fill="white" style="animation:wxTwink 2.2s ease-in-out .7s infinite"/>`)
    case 'partlycloudy':
    case 'partly-cloudy-day':
      return S(`<g style="animation:wxSpin 16s linear infinite;transform-box:fill-box;transform-origin:center">${rayz(20,18,10,16,'#FFD700')}</g>`+
        `<circle cx="20" cy="18" r="8.5" fill="#FFD700"/><circle cx="20" cy="18" r="6.5" fill="#ffe57f"/>`+
        `<g style="animation:wxBob 4s ease-in-out infinite">${cld(36,33)}</g>`)
    case 'partly-cloudy-night':
      return S(`<g style="animation:wxMoon 4s ease-in-out infinite">`+
        `<circle cx="20" cy="18" r="12" fill="#e0cf88"/><circle cx="27" cy="12" r="9.5" fill="#040a18"/></g>`+
        `<g style="animation:wxBob 4.5s ease-in-out infinite">${cld(36,34)}</g>`)
    case 'cloudy':
      return S(`<g style="animation:wxBob 3.5s ease-in-out infinite">${cld(32,28)}</g>`)
    case 'fog':
      return S([22,32,42].map((y,i)=>
        `<line x1="${12+i*2}" y1="${y}" x2="${52-i*2}" y2="${y}" stroke="rgba(200,215,225,.78)" stroke-width="3.5" stroke-linecap="round" style="animation:wxDrift 2.5s ease-in-out ${i*.4}s infinite alternate"/>`
      ).join(''))
    case 'rainy':
      return S(`<g style="animation:wxBob 4s ease-in-out infinite">${cld(32,24)}</g>`+
        [22,30,38,26,34].map((x,i)=>drop(x,37+i%2*5,i*.2)).join(''))
    case 'pouring':
      return S(`<g style="animation:wxBob 3s ease-in-out infinite">${cld(32,22,CD)}</g>`+
        [18,25,32,39,46,22,29,36,43].map((x,i)=>drop(x,35+i%3*5,i*.12,.65)).join(''))
    case 'hail':
      return S(`<g style="animation:wxBob 4s ease-in-out infinite">${cld(32,22,CD)}</g>`+
        [[22,37],[30,42],[38,37],[26,47],[34,47]].map(([x,y],i)=>
          `<circle cx="${x}" cy="${y}" r="3.2" fill="rgba(160,220,245,.9)" style="animation:wxRain .7s linear ${i*.2}s infinite;opacity:0"/>`
        ).join(''))
    case 'snowy':
      return S(`<g style="animation:wxBob 5s ease-in-out infinite">${cld(32,24,'rgba(200,218,236,.92)')}</g>`+
        [[22,38],[30,44],[38,38],[26,50],[34,50]].map(([x,y],i)=>flake(x,y,i*.38)).join(''))
    case 'snowy-rainy':
      return S(`<g style="animation:wxBob 4s ease-in-out infinite">${cld(32,24,CD)}</g>`+
        [drop(20,37,0),flake(28,41,.35),drop(35,37,.2),flake(42,43,.6),drop(26,48,.5)].join(''))
    case 'lightning':
      return S(`<g style="animation:wxBob 4s ease-in-out infinite">${cld(32,20,CD)}</g>${bolt}`)
    case 'lightning-rainy':
      return S(`<g style="animation:wxBob 4s ease-in-out infinite">${cld(32,20,CD)}</g>`+
        [drop(18,34,0,.75),drop(27,38,.25,.75),drop(44,34,.5,.75)].join('')+bolt)
    case 'windy':
      return S([22,32,42].map((y,i)=>
        `<path d="M${12+i*2},${y} C28,${y-7} 36,${y-5} ${52-i*2},${y}" fill="none" stroke="rgba(148,163,184,.82)" stroke-width="3.2" stroke-linecap="round" style="animation:wxDrift 2s ease-in-out ${i*.3}s infinite alternate"/>`
      ).join(''))
    case 'windy-variant':
      return S(`<g style="animation:wxBob 4s ease-in-out infinite">${cld(26,22)}</g>`+
        [40,50].map((y,i)=>
          `<path d="M28,${y} C40,${y-5} 44,${y-3} 54,${y}" fill="none" stroke="rgba(148,163,184,.82)" stroke-width="3" stroke-linecap="round" style="animation:wxDrift 2s ease-in-out ${i*.3}s infinite alternate"/>`
        ).join(''))
    case 'exceptional':
      return S(`<polygon points="32,6 60,56 4,56" fill="rgba(239,68,68,.85)" stroke="rgba(252,165,165,.4)" stroke-width="1.5" stroke-linejoin="round" style="animation:wxWarn 1.5s ease-in-out infinite"/>`+
        `<text x="32" y="48" text-anchor="middle" font-size="26" font-weight="900" fill="white" style="font-family:system-ui,sans-serif;">!</text>`)
    default:
      return S(`<g style="animation:wxBob 4s ease-in-out infinite">${cld(32,28)}</g>`)
  }
}

// ── MeteoCard ─────────────────────────────────────────────────────────────────
class MeteoCard extends HTMLElement {
  static getStubConfig(){ return { entityId:'weather.forecast_home', cityName:'' } }

  constructor(){
    super()
    this.attachShadow({mode:'open'})
    this._h   = null
    this._c   = { entityId:'',cityName:'',humEntity:'',presEntity:'',windEntity:'',windDirEntity:'',wfDays:5,cardScale:100,cardW:100 }
    this._fc  = []
    this._fch = []
    this._fcs = null
    this._fo  = false
    this._so  = false
    this._se  = false
    this._te  = ''; this._tc = ''; this._th = ''; this._tp = ''; this._tw = ''; this._twd = ''; this._tdays = 5; this._tCardScale = 100; this._tCardW = 100
    this._histModalHost = null
    this._stationModalHost = null
    this._tSt = {}
    this._fs  = null
    this._bk  = null
    this._nh  = true
    this._sk  = 'default'
    this._selDay     = -1
    this._modalHost  = null
    this._dayModalHost = null
    this._skyFx      = null
    this._skyFxKey   = ''
    this._skyTimer   = null
    this._frarikCard = null
    this._click = this._onClick.bind(this)
    this._inp   = this._onInput.bind(this)
    this._focus = this._onFocus.bind(this)
  }

  // ── localStorage ─────────────────────────────────────────────────────────
  _lsKey(){ return 'meteocard:'+this._sk }
  _loadStore(){ try{ return JSON.parse(localStorage.getItem(this._lsKey())||'null') }catch{ return null } }
  _saveStore(){
    try{
      const stObj={}
      _STATION_CATS.forEach(cat=>cat.sensors.forEach(s=>{ stObj[s.f]=this._c[s.f]||'' }))
      _STATION_SPECIALS.forEach(s=>{ stObj[s.f]=this._c[s.f]||'' })
      localStorage.setItem(this._lsKey(), JSON.stringify({
        entityId:this._c.entityId, cityName:this._c.cityName,
        humEntity:this._c.humEntity||'', presEntity:this._c.presEntity||'',
        windEntity:this._c.windEntity||'', windDirEntity:this._c.windDirEntity||'',
        wfDays:this._c.wfDays||5,
        cardScale:this._c.cardScale??100,
        cardW:this._c.cardW??100,
        extraStats:this._c.extraStats||[],
        tileCustom:this._c.tileCustom||{},
        staticBg:this._c.staticBg||false,
        swipeInterval:this._c.swipeInterval||5,
        swipeTransition:this._c.swipeTransition||0.38,
        swipeThreshold:this._c.swipeThreshold||40,
        stationEnabled:this._c.stationEnabled||false,
        stationLat:this._c.stationLat||'',
        stationLon:this._c.stationLon||'',
        ...stObj,
      }))
    }catch{}
  }

  setConfig(cfg){
    cfg=cfg||{}
    this._sk=cfg.storageKey||cfg.entityId||'default'
    const stored=this._loadStore()||{}
    const prev=this._c?.entityId
    const stCfgObj={}
    _STATION_CATS.forEach(cat=>cat.sensors.forEach(s=>{ stCfgObj[s.f]=stored[s.f]||cfg[s.f]||'' }))
    _STATION_SPECIALS.forEach(s=>{ stCfgObj[s.f]=stored[s.f]||cfg[s.f]||'' })
    this._c={
      entityId:     stored.entityId     ||cfg.entityId     ||'',
      cityName:     stored.cityName     !=null?stored.cityName    :(cfg.cityName    ||''),
      humEntity:    stored.humEntity    ||cfg.humEntity    ||'',
      presEntity:   stored.presEntity   ||cfg.presEntity   ||'',
      windEntity:   stored.windEntity   ||cfg.windEntity   ||'',
      windDirEntity:stored.windDirEntity||cfg.windDirEntity||'',
      wfDays:       stored.wfDays       ||cfg.wfDays       ||5,
      cardScale:    stored.cardScale!=null?stored.cardScale:(cfg.cardScale!=null?cfg.cardScale:100),
      cardW:        stored.cardW    !=null?stored.cardW    :(cfg.cardW    !=null?cfg.cardW    :100),
      extraStats:   Array.isArray(stored.extraStats)?stored.extraStats:(Array.isArray(cfg.extraStats)?cfg.extraStats:[]),
      tileCustom:   stored.tileCustom||cfg.tileCustom||{},
      staticBg:     stored.staticBg!=null?stored.staticBg:(cfg.staticBg||false),
      swipeInterval: stored.swipeInterval||cfg.swipeInterval||5,
      swipeTransition: parseFloat(stored.swipeTransition||cfg.swipeTransition)||0.38,
      swipeThreshold: stored.swipeThreshold||cfg.swipeThreshold||40,
      stationEnabled: stored.stationEnabled!=null?stored.stationEnabled:(cfg.stationEnabled||false),
      stationLat:   stored.stationLat   ||cfg.stationLat   ||'',
      stationLon:   stored.stationLon   ||cfg.stationLon   ||'',
      ...stCfgObj,
    }
    this._te=this._c.entityId; this._tc=this._c.cityName
    this._th=this._c.humEntity; this._tp=this._c.presEntity
    this._tw=this._c.windEntity; this._twd=this._c.windDirEntity
    this._tdays=this._c.wfDays; this._tCardScale=this._c.cardScale??100; this._tCardW=this._c.cardW??100
    if(prev!==this._c.entityId&&this._h) this._getForecast()
    this._bk=null; this._build()
  }

  getCardSize(){ return this._fo?8:5 }

  connectedCallback(){
    this.shadowRoot.addEventListener('click',this._click)
    this.shadowRoot.addEventListener('input',this._inp)
    if(this._h&&this._c.entityId) this._getForecast()
    this._skyTimer=setInterval(()=>this._updateSky(),60000)
  }

  disconnectedCallback(){
    this.shadowRoot.removeEventListener('click',this._click)
    this.shadowRoot.removeEventListener('input',this._inp)
    this._destroyModal(); this._destroyDayModal(); this._destroyHistModal(); this._destroyStationPopup()
    this._unsub(); this._unsubHourly()
    if(this._skyTimer){ clearInterval(this._skyTimer); this._skyTimer=null }
    if(this._statsTimer){ clearInterval(this._statsTimer); this._statsTimer=null }
  }

  set hass(h){
    const first=this._nh; this._nh=false; this._h=h
    if(this._fc.length===0&&this._c.entityId) this._getForecast()
    if(this._so) return
    const k=this._key()
    if(first||k!==this._bk){ this._bk=k; this._build() }
  }

  // ── Forecast ──────────────────────────────────────────────────────────────
  async _getForecast(){
    this._unsub()
    const eid=this._c?.entityId
    if(!this._h||!eid) return
    const onFc=fc=>{ if(!Array.isArray(fc)||!fc.length) return false; this._fc=fc; this._bk=null; this._build(); return true }
    const extract=r=>r?.response?.[eid]?.forecast??r?.[eid]?.forecast??r?.forecast??(Array.isArray(r)?r:null)
    const legacy=this._h.states?.[eid]?.attributes?.forecast
    if(Array.isArray(legacy)&&legacy.length) onFc(legacy)
    const conn=this._h.connection
    if(conn?.subscribeMessage){
      try{ this._fs=conn.subscribeMessage(ev=>onFc(ev?.forecast??ev?.event?.forecast??[]),{type:'weather/subscribe_forecast',forecast_type:'daily',entity_id:eid}) }catch(e){}
    }
    if(this._fc.length) return
    for(const svc of['get_forecasts','get_forecast']){
      try{ const r=await conn?.sendMessagePromise?.({type:'call_service',domain:'weather',service:svc,service_data:{entity_id:eid,type:'daily'},return_response:true}).catch(()=>null); if(onFc(extract(r))) return }catch(e){}
    }
  }

  _unsub(){ if(!this._fs) return; Promise.resolve(this._fs).then(u=>{if(typeof u==='function')u()}).catch(()=>{}); this._fs=null }

  _key(){
    if(!this._h) return 'NO_HASS'
    if(!this._c.entityId) return 'NO_EID'
    const st=this._h.states?.[this._c.entityId]
    if(!st) return 'NOT_FOUND:'+this._c.entityId
    const a=st.attributes,c=this._c
    return [st.state,a.temperature,a.humidity,a.pressure,a.wind_speed,a.wind_bearing,
            this._fo,this._so,this._se,this._fc.length,c.cityName,
            this._h.states?.[c.humEntity]?.state,this._h.states?.[c.presEntity]?.state,
            this._h.states?.[c.windEntity]?.state,this._h.states?.[c.windDirEntity]?.state].join('|')
  }

  // ── Hourly forecast ───────────────────────────────────────────────────────
  _unsubHourly(){ if(!this._fcs) return; Promise.resolve(this._fcs).then(u=>{if(typeof u==='function')u()}).catch(()=>{}); this._fcs=null }

  async _getHourlyForecast(){
    const eid=this._c?.entityId
    if(!this._h||!eid) return
    const onFc=fc=>{ if(!Array.isArray(fc)||!fc.length) return false; this._fch=fc; this._renderDayModal(); return true }
    const extract=r=>r?.response?.[eid]?.forecast??r?.[eid]?.forecast??r?.forecast??(Array.isArray(r)?r:null)
    const conn=this._h.connection
    if(conn?.subscribeMessage){
      try{ this._fcs=conn.subscribeMessage(ev=>onFc(ev?.forecast??ev?.event?.forecast??[]),{type:'weather/subscribe_forecast',forecast_type:'hourly',entity_id:eid}) }catch(e){}
    }
    if(this._fch.length) return
    for(const svc of['get_forecasts','get_forecast']){
      try{ const r=await conn?.sendMessagePromise?.({type:'call_service',domain:'weather',service:svc,service_data:{entity_id:eid,type:'hourly'},return_response:true}).catch(()=>null); if(onFc(extract(r))) return }catch(e){}
    }
  }

  _openDayDetail(idx){ this._selDay=idx; if(!this._fch.length) this._getHourlyForecast(); this._renderDayModal() }
  _destroyDayModal(){
    if(!this._dayModalHost) return
    this._dayModalHost.shadowRoot.removeEventListener('click',this._click)
    this._dayModalHost.remove(); this._dayModalHost=null
  }

  _destroyHistModal(){
    if(!this._histModalHost) return
    this._histModalHost.shadowRoot.removeEventListener('click',this._click)
    this._histModalHost.remove(); this._histModalHost=null
  }

  async _openHistPopup(entityId, attrName, label){
    this._destroyHistModal()
    this._histModalHost=document.createElement('div')
    this._histModalHost.attachShadow({mode:'open'})
    this._histModalHost.shadowRoot.addEventListener('click',this._click)
    document.body.appendChild(this._histModalHost)
    const histCSS=`.hov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);font-family:var(--primary-font-family,system-ui,sans-serif);}.hov-modal{width:100%;max-height:72vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(251,191,36,.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:slideUp .22s cubic-bezier(.32,1.12,.56,1);}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}.hw{flex:1;overflow-y:auto;padding:16px 20px 24px;scrollbar-width:none;-ms-overflow-style:none;}.hw::-webkit-scrollbar{display:none;}.hs-row{display:flex;gap:0;justify-content:space-around;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.07);}.hs-item{text-align:center;}.hs-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#fff;opacity:.65;}.hs-val{font-size:20px;font-weight:800;color:#fff;margin-top:3px;}.hs-unit{font-size:11px;font-weight:400;color:#fff;margin-left:2px;}.hload{padding:40px;text-align:center;color:rgba(255,255,255,.5);font-size:12px;}`
    this._histModalHost.shadowRoot.innerHTML=`<style>${_CSS}${histCSS}</style>
<div class="hov"><div class="hov-modal">
  <div class="shdr" style="border-radius:20px 20px 0 0;">
    <div class="sico" style="font-size:18px;background:rgba(251,191,36,.12);border-color:rgba(251,191,36,.3);color:#fbbf24;">📈</div>
    <div><div class="stit">${label||'Andamento'}</div><div class="ssub">Ultime 24 ore · ${entityId}</div></div>
    <button class="scls" data-a="closehist">${_IC.x}</button>
  </div>
  <div class="hw"><div class="hload">Caricamento dati…</div></div>
</div></div>`
    if(!entityId||!this._h) return
    try{
      const end=new Date(), start=new Date(end-86400000)
      let raw=[]
      if(this._h.callWS){
        const wsData=await this._h.callWS({
          type:'history/history_during_period',
          start_time:start.toISOString(),
          end_time:end.toISOString(),
          entity_ids:[entityId],
          include_start_time_state:true,
          significant_changes_only:false,
          minimal_response:true,
          no_attributes:!attrName
        })
        raw=(wsData&&wsData[entityId])||[]
      } else if(this._h.callApi){
        const noAttr=!attrName
        const path=`history/period/${start.toISOString()}?filter_entity_id=${entityId}&end_time=${end.toISOString()}&minimal_response=${noAttr?'true':'false'}${noAttr?'&no_attributes=true':''}`
        const data=await this._h.callApi('GET',path)
        raw=Array.isArray(data)&&data.length?data[0]:[]
      }
      const unit=this._h?.states?.[entityId]?.attributes?.unit_of_measurement||''
      const pts=raw.map(s=>{
        // HA history/history_during_period: compressed format usa s/lc/a, full usa state/last_changed/attributes
        // Il timestamp lc può essere Unix float (secondi) o stringa ISO a seconda della versione HA
        const stateVal=s.s??s.state
        const v=attrName?parseFloat((s.a??s.attributes)?.[attrName]??''):parseFloat(stateVal)
        if(isNaN(v)) return null
        const rawTs=s.lc??s.last_changed??s.lu??s.last_updated
        if(!rawTs) return null
        const tsN=Number(rawTs)
        const t=!isNaN(tsN)&&tsN<1e12?tsN*1000:new Date(rawTs).getTime()
        return isNaN(t)?null:{t,v}
      }).filter(Boolean)
      const sr=this._histModalHost?.shadowRoot; if(!sr) return
      const hw=sr.querySelector('.hw'); if(!hw) return
      if(!pts.length){ hw.innerHTML=`<div class="hload">Nessun dato nelle ultime 24 ore</div>`; return }
      const vals=pts.map(p=>p.v)
      const minV=Math.min(...vals), maxV=Math.max(...vals)
      const cur=this._h?.states?.[entityId]
      const curVal=attrName?(cur?.attributes?.[attrName]??'—'):(cur?.state??'—')
      const fmt=v=>typeof v==='number'?v.toFixed(1):String(v)
      hw.innerHTML=`
        <div class="hs-row">
          <div class="hs-item"><div class="hs-lbl">Minimo</div><div class="hs-val">${fmt(minV)}<span class="hs-unit">${unit}</span></div></div>
          <div class="hs-item"><div class="hs-lbl">Massimo</div><div class="hs-val">${fmt(maxV)}<span class="hs-unit">${unit}</span></div></div>
          <div class="hs-item"><div class="hs-lbl">Attuale</div><div class="hs-val">${curVal}<span class="hs-unit">${unit}</span></div></div>
        </div>
        ${this._buildHistChart(pts,minV,maxV)}`
    }catch(err){
      const hw=this._histModalHost?.shadowRoot?.querySelector('.hw')
      if(hw) hw.innerHTML=`<div class="hload">Errore: ${err?.message||'impossibile caricare i dati'}</div>`
    }
  }

  _buildHistChart(pts,minV,maxV){
    const W=460,H=130,PL=42,PR=12,PT=8,PB=22
    const cW=W-PL-PR, cH=H-PT-PB
    const rngV=(maxV-minV)||1
    const minT=pts[0].t, maxT=pts[pts.length-1].t
    const rngT=(maxT-minT)||1
    const gx=p=>PL+((p.t-minT)/rngT*cW)
    const gy=p=>PT+cH-((p.v-minV)/rngV*cH)
    const poly=pts.map(p=>`${gx(p).toFixed(1)},${gy(p).toFixed(1)}`).join(' ')
    const fill=`M${PL},${PT+cH} ${pts.map(p=>`L${gx(p).toFixed(1)},${gy(p).toFixed(1)}`).join(' ')} L${PL+cW},${PT+cH} Z`
    const yLbls=[0,.5,1].map(t=>{
      const v=minV+rngV*t, y=PT+cH-t*cH
      return `<text x="${PL-5}" y="${y+3.5}" text-anchor="end" fill="rgba(255,255,255,.4)" font-size="9" font-family="system-ui">${v%1===0?v.toFixed(0):v.toFixed(1)}</text>
      <line x1="${PL}" y1="${y}" x2="${PL+cW}" y2="${y}" stroke="rgba(255,255,255,.05)" stroke-width="1"/>`
    }).join('')
    const xLbls=[0,6,12,18,24].map(h=>{
      const t=minT+(h/24)*rngT
      if(t<minT||t>maxT+1800000) return ''
      const x=PL+((t-minT)/rngT*cW)
      const d=new Date(t)
      return `<text x="${x.toFixed(1)}" y="${H-4}" text-anchor="middle" fill="rgba(255,255,255,.4)" font-size="8" font-family="system-ui">${d.getHours().toString().padStart(2,'0')}:00</text>`
    }).join('')
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible;">
  <defs><linearGradient id="hgf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24" stop-opacity=".3"/><stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/></linearGradient></defs>
  ${yLbls}
  <path d="${fill}" fill="url(#hgf)"/>
  <polyline points="${poly}" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
  ${xLbls}
</svg>`
  }

  _renderDayModal(){
    if(this._selDay<0) return
    const day=this._fc[this._selDay]; if(!day) return
    if(!this._dayModalHost){
      this._dayModalHost=document.createElement('div')
      this._dayModalHost.attachShadow({mode:'open'})
      this._dayModalHost.shadowRoot.addEventListener('click',this._click)
      document.body.appendChild(this._dayModalHost)
    }
    const d=new Date(day.datetime)
    const dow=_DI[d.getDay()].toUpperCase()
    const dateStr=`${dow} ${d.getDate()} ${_MI[d.getMonth()].toUpperCase()}`
    const cond=day.condition||'cloudy'
    const citLabel=_CI[cond]||cond.replace(/-/g,' ')
    const maxT=_n(day.temperature)
    const minT=_n(day.templow??(parseFloat(day.temperature)-4))
    const dayIco=_wxSVG(cond,58)
    const _dKey=dt=>{ const x=new Date(dt); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}` }
    const dayKey=_dKey(day.datetime)
    const hourly=this._fch.filter(h=>h.datetime&&_dKey(h.datetime)===dayKey)
    const fmtTime=dt=>{ try{ return new Date(dt).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}) }catch{ return dt.split('T')[1]?.slice(0,5)||'--' } }
    const rowsHTML=hourly.length
      ?hourly.map(h=>{
          const time=fmtTime(h.datetime),ico=_wxSVG(h.condition,30),temp=_n(h.temperature)
          const tc=_tempCol(h.temperature)
          const bw=Math.max(12,Math.min(100,((parseFloat(h.temperature)||0)+10)/50*100))
          const rn=h.precipitation!=null?h.precipitation.toFixed(1):'—'
          const ws=h.wind_speed!=null?Math.round(h.wind_speed):'—'
          const wd=_windDir(h.wind_bearing)
          return `<div class="hr-row"><div class="hr-t">${time}</div><div class="hr-i">${ico}</div><div class="hr-tp"><span style="color:${tc};font-size:14px;font-weight:800;">${temp}°</span><div class="hr-bar" style="background:${tc};width:${bw}%"></div></div><div class="hr-r">☂ ${rn}mm</div><div class="hr-w">⇒ ${ws}km/h<span class="hr-wd"> ${wd}</span></div></div>`
        }).join('')
      :`<div class="hr-load">Previsioni orarie in caricamento…</div>`
    const dmCSS=`.dov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);font-family:var(--primary-font-family,system-ui,sans-serif);}.dov-modal{width:100%;max-height:85vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(251,191,36,.2);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:slideUp .22s cubic-bezier(.32,1.12,.56,1);}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}.dm-hdr{padding:18px 20px 16px;background:linear-gradient(135deg,rgba(80,50,8,.95),rgba(50,30,5,.98));border-radius:20px 20px 0 0;display:flex;align-items:flex-start;justify-content:space-between;}.dm-left{flex:1;}.dm-date{font-size:10px;font-weight:800;color:rgba(255,200,80,.8);letter-spacing:1.4px;margin-bottom:5px;}.dm-cond{font-size:24px;font-weight:900;color:#fff;letter-spacing:-.3px;line-height:1.1;}.dm-temps{font-size:14px;font-weight:700;color:rgba(255,215,100,.9);margin-top:6px;}.dm-ico{flex-shrink:0;margin-left:12px;display:flex;align-items:center;margin-top:-4px;}.dm-cls{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.12);border:none;color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:10px;line-height:1;transition:background .15s;}.dm-cls:hover{background:rgba(248,113,113,.4);}.hr-thead{display:grid;grid-template-columns:48px 34px 1fr 80px 88px;gap:6px;padding:7px 20px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.4);border-bottom:1px solid rgba(255,255,255,.08);}.hr-thead-w{text-align:right;}.hr-list{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent;}.hr-row{display:grid;grid-template-columns:48px 34px 1fr 80px 88px;align-items:center;gap:6px;padding:8px 20px;border-bottom:1px solid rgba(255,255,255,.04);}.hr-row:last-child{border-bottom:none;}.hr-t{font-size:12px;font-weight:700;color:#fff;}.hr-i{display:flex;align-items:center;justify-content:center;}.hr-tp{display:flex;flex-direction:column;gap:3px;}.hr-bar{height:2px;border-radius:1px;}.hr-r{font-size:11px;color:#94d3f7;white-space:nowrap;}.hr-w{font-size:11px;color:#fff;text-align:right;white-space:nowrap;}.hr-wd{color:rgba(255,255,255,.5);font-size:10px;}.hr-load{padding:40px;text-align:center;color:rgba(255,255,255,.5);font-size:12px;}`
    this._dayModalHost.shadowRoot.innerHTML=`<style>${_CSS}${dmCSS}</style>
<div class="dov"><div class="dov-modal">
  <div class="dm-hdr">
    <div class="dm-left">
      <div class="dm-date">${dateStr}</div>
      <div class="dm-cond">${citLabel}</div>
      <div class="dm-temps">↑ ${maxT}° &nbsp;&nbsp; ↓ ${minT}°</div>
    </div>
    <div class="dm-ico">${dayIco}</div>
    <button class="dm-cls" data-a="closedm">✕</button>
  </div>
  <div class="hr-thead">
    <div>ORA</div><div></div><div>TEMP</div><div>PIOGGIA</div><div class="hr-thead-w">VENTO</div>
  </div>
  <div class="hr-list">${rowsHTML}</div>
</div></div>`
  }

  // ── Sky system ────────────────────────────────────────────────────────────
  // Uses sun.sun entity: elevation (-90..+90°) and azimuth (0..360°, 0=N,90=E)
  _skyGrad(el, az){
    if(el==null) return 'linear-gradient(to bottom,#0a1020,#040818)'
    const eve=az!=null&&az>180
    // [elevation, topHex, botHex]
    const segs=[
      [-90,'#010206','#030714'],
      [-18,'#040710','#08061a'],
      [-8, '#070a22','#110918'],
      [-3, '#0a0e30','#3a1008'],
      [0,  '#152060', eve?'#a03815':'#b04818'],
      [4,  '#1850a8', eve?'#d87040':'#c07840'],
      [10, '#1a62b8','#5ab8e8'],
      [30, '#1565b5','#42b0e8'],
      [70, '#1060b0','#38aae2'],
      [90, '#0e58a8','#34a5de'],
    ]
    let a=segs[0],b=segs[segs.length-1]
    for(let i=0;i<segs.length-1;i++){ if(el>=segs[i][0]&&el<=segs[i+1][0]){a=segs[i];b=segs[i+1];break} }
    const t=Math.max(0,Math.min(1,(el-a[0])/(b[0]-a[0])||0))
    return `linear-gradient(to bottom,${_lerpHex(a[1],b[1],t)},${_lerpHex(a[2],b[2],t)})`
  }

  _horizonStyle(el){
    if(el==null||Math.abs(el)>=8) return ''
    const t=1-Math.abs(el)/8
    const col=`rgba(200,75,10,${(t*.55).toFixed(2)})`
    return `background:radial-gradient(ellipse 90% 36% at 50% 100%,${col},transparent 72%)`
  }

  _sunPos(az, el){
    if(az==null||el==null||el<-4) return null
    // Azimuth 70°(E)→180°(S)→290°(W) maps to left 6%→50%→94%
    const prog=Math.max(0,Math.min(1,(az-70)/220))
    const x=6+prog*88
    // Arc: top 38% at horizon, top 18% at zenith — stays in visible sky strip
    const top=38-Math.sin(prog*Math.PI)*20
    return {x, top}
  }

  _moonPos(){
    const sun=this._h?.states?.['sun.sun']
    const now=Date.now()
    const nr=sun?.attributes?.next_rising?new Date(sun.attributes.next_rising):null
    const ns=sun?.attributes?.next_setting?new Date(sun.attributes.next_setting):null
    let prog=0.5
    if(nr&&ns){
      const msUntilRise=nr.getTime()-now
      if(msUntilRise>0&&msUntilRise<16*3600000){
        const nightStart=ns.getTime()-86400000
        const nightDur=nr.getTime()-nightStart
        prog=Math.max(0,Math.min(1,(now-nightStart)/nightDur))
      }
    } else {
      // Fallback: time-based (20:00=start, 06:00=end)
      const hr=new Date().getHours()+new Date().getMinutes()/60
      prog=Math.min(1,(hr>=20?hr-20:(hr+4))/10)
    }
    const x=6+prog*88
    const top=38-Math.sin(prog*Math.PI)*20
    return {x, top}
  }

  _skyHTML(st){
    const cond=st.state,a=st.attributes
    const sunE=this._h?.states?.['sun.sun']
    const el=sunE!=null?parseFloat(sunE.attributes?.elevation??0):null
    const az=sunE!=null?parseFloat(sunE.attributes?.azimuth??180):null
    const isNight=_isNightNow(sunE?.state,cond)
    const coverage=a.cloud_coverage??_condCoverage(cond)
    const fxKey=`${cond}-${Math.round(coverage/10)}`
    if(fxKey!==this._skyFxKey){
      this._skyFxKey=fxKey
      const hasRain=['rainy','pouring','lightning-rainy','snowy-rainy'].includes(cond)
      const hasSnow=['snowy','snowy-rainy'].includes(cond)
      const hasLtg =['lightning','lightning-rainy'].includes(cond)
      const hasFog =cond==='fog'
      this._skyFx={
        stars:_starsHTML(),
        clouds:_cloudsHTML(coverage),
        rain:hasRain?_rainHTML(cond==='pouring'):'',
        snow:hasSnow?_snowHTML():'',
        ltg:hasLtg?_lightningHTML():'',
        fog:hasFog?'<div class="fog-layer"></div>':'',
      }
    }
    const fx=this._skyFx
    const skyBg=this._skyGrad(el,az)
    const hStyle=this._horizonStyle(el)
    const pos=isNight?this._moonPos():this._sunPos(az,el)
    const starsOp=isNight&&coverage<75?1:0
    const hideBody=coverage>82
    let celHTML=''
    if(pos&&!hideBody){
      if(!isNight){
        celHTML=`<div class="celestial" style="left:${pos.x.toFixed(1)}%;top:${pos.top.toFixed(1)}%;">${_sunSVG()}</div>`
      } else {
        const phase=_moonPhaseNum(new Date())
        const f=(1-Math.cos(phase/29.53*2*Math.PI))/2
        if(f>0.015){
          celHTML=`<div class="celestial" style="left:${pos.x.toFixed(1)}%;top:${pos.top.toFixed(1)}%;">${_moonSVG(phase)}</div>`
        }
      }
    }
    if(this._c.staticBg){
      const staticGrad=isNight
        ?'linear-gradient(to bottom,#060818,#0d0f22)'
        :'linear-gradient(to bottom,#5ab8e0,#a8d8f0)'
      return `<div class="sky" style="background:${staticGrad};">
        <div class="sky-horizon" style="${hStyle}"></div>
      </div>`
    }
    return `<div class="sky" style="background:${skyBg};">
      <div class="sky-stars" style="opacity:${starsOp};">${fx.stars}</div>
      <div class="sky-horizon" style="${hStyle}"></div>
      ${celHTML}
      <div class="sky-clouds">${fx.clouds}</div>
      <div class="sky-fx">${fx.rain}${fx.snow}${fx.ltg}${fx.fog}</div>
    </div>`
  }

  _updateSky(){
    const sr=this.shadowRoot
    const skyEl=sr?.querySelector('.sky'); if(!skyEl) return
    const st=this._h?.states?.[this._c.entityId]; if(!st) return
    const sunE=this._h?.states?.['sun.sun']
    const el=sunE!=null?parseFloat(sunE.attributes?.elevation??0):null
    const az=sunE!=null?parseFloat(sunE.attributes?.azimuth??180):null
    const isNight=_isNightNow(sunE?.state,st.state)
    skyEl.style.background=this._skyGrad(el,az)
    const hEl=sr.querySelector('.sky-horizon')
    if(hEl) hEl.setAttribute('style',this._horizonStyle(el))
    const a=st.attributes
    const coverage=a.cloud_coverage??_condCoverage(st.state)
    const pos=isNight?this._moonPos():this._sunPos(az,el)
    const celEl=sr.querySelector('.celestial')
    if(celEl&&pos){
      celEl.style.left=pos.x.toFixed(1)+'%'
      celEl.style.top=pos.top.toFixed(1)+'%'
    }
    const starsEl=sr.querySelector('.sky-stars')
    if(starsEl) starsEl.style.opacity=String(isNight&&coverage<75?1:0)
  }

  // ── Click ─────────────────────────────────────────────────────────────────
  _onClick(e){
    if(this._modalHost){
      const sr=this._modalHost.shadowRoot
      const inDrop=e.target.closest('.esr[data-dropdown]')||e.target.closest('input[data-f]')
      if(!inDrop) sr.querySelectorAll('.esr[data-dropdown]').forEach(d=>d.classList.remove('open'))
    }
    const t=e.target.closest('[data-a]'); if(!t) return
    switch(t.dataset.a){
      case 'gear':  this._openSettings(); break
      case 'close': this._closeSettings(); break
      case 'fc':    this._fo=!this._fo; this._bk=null; this._build(); break
      case 'srch':  this._se=!this._se; this._renderModal(); break
      case 'sel':   this._te=t.dataset.id; this._se=false; this._renderModal(); break
      case 'sel-sensor':{
        const sf=t.dataset.f,sid=t.dataset.id
        if(sf.startsWith('tile-eid-')){
          const i=parseInt(sf.replace('tile-eid-',''))
          if(this._tAllTiles[i]!=null) this._tAllTiles[i].eid=sid
        }
        else {
          const allStFs=_STATION_CATS.flatMap(c=>c.sensors.map(s=>s.f)).concat(_STATION_SPECIALS.map(s=>s.f))
          if(allStFs.includes(sf)) this._tSt[sf]=sid
        }
        const sr2=this._modalHost?.shadowRoot
        if(sr2){
          const inp=sr2.querySelector(`input[data-f="${sf}"]`); if(inp) inp.value=sid
          const drop=sr2.querySelector(`[data-dropdown="${sf}"]`); if(drop) drop.classList.remove('open')
        }
        this._schedPrev()
        break
      }
      case 'station':
        if(this._c.stationEnabled) this._openStationPopup()
        break
      case 'closestov':
        this._destroyStationPopup()
        break
      case 'ststat':{
        const el2=e.target.closest('[data-a="ststat"]')
        if(el2) this._openHistPopup(el2.dataset.eid||'',el2.dataset.attr||'',el2.dataset.lbl||'Dato')
        break
      }
      case 'windylayer':{
        const btn2=e.target.closest('[data-a="windylayer"]'); if(!btn2) break
        const layer=btn2.dataset.layer
        const sr2=this._stationModalHost?.shadowRoot; if(!sr2) break
        const ifr=sr2.querySelector('#stov-windy-frame'); if(!ifr) break
        const zoom=ifr.dataset.zoom||'9'
        const lat=this._c.stationLat||'45.0',lon=this._c.stationLon||'10.0'
        ifr.dataset.layer=layer
        ifr.src=`https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&zoom=${zoom}&level=surface&overlay=${layer}&product=ecmwf&menu=false&message=false&marker=true&calendar=now&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`
        sr2.querySelectorAll('[data-a="windylayer"]').forEach(b=>b.classList.toggle('wba',b.dataset.layer===layer))
        break
      }
      case 'windyzoom':{
        const zbtn=e.target.closest('[data-a="windyzoom"]'); if(!zbtn) break
        const sr2=this._stationModalHost?.shadowRoot; if(!sr2) break
        const ifr=sr2.querySelector('#stov-windy-frame'); if(!ifr) break
        let zoom=parseInt(ifr.dataset.zoom||'9')+(zbtn.dataset.dir==='in'?1:-1)
        zoom=Math.max(3,Math.min(14,zoom))
        const layer=ifr.dataset.layer||'radar'
        const lat=this._c.stationLat||'45.0',lon=this._c.stationLon||'10.0'
        ifr.dataset.zoom=String(zoom)
        ifr.src=`https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&zoom=${zoom}&level=surface&overlay=${layer}&product=ecmwf&menu=false&message=false&marker=true&calendar=now&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`
        const zd=sr2.querySelector('.windy-zoom-val')
        if(zd) zd.textContent=String(zoom)
        break
      }
      case 'windyfull':{
        const sr2=this._stationModalHost?.shadowRoot; if(!sr2) break
        const mapEl=sr2.querySelector('.stov-map')
        if(!mapEl) break
        const isFs=mapEl.classList.toggle('stov-map-fs')
        const fbtn=sr2.querySelector('[data-a="windyfull"]')
        if(fbtn) fbtn.textContent=isFs?'⊠ Riduci':'⛶ Espandi'
        break
      }
      case 'tile-add':
        if(this._tAllTiles.filter(t=>!t.isFixed).length<8){
          this._tAllTiles.push({key:null,eid:'',lbl:'',ico:'📊',icoColor:'#ffffff',colorRules:[],isFixed:false,_open:false,_pickerOpen:false,_mdiSearch:''})
          this._updateAllTilesSection()
        }
        break
      case 'tile-rm':{
        const rmBtn=e.target.closest('[data-a="tile-rm"]'); if(!rmBtn) break
        const ri0=parseInt(rmBtn.dataset.idx||'0')
        if(!this._tAllTiles[ri0]?.isFixed) this._tAllTiles.splice(ri0,1)
        this._updateAllTilesSection(); this._schedPrev()
        break
      }
      case 'tile-open':{
        const ob=e.target.closest('[data-a="tile-open"]'); if(!ob) break
        const oi=parseInt(ob.dataset.idx||'0')
        if(this._tAllTiles[oi]){
          this._tAllTiles[oi]._open=!this._tAllTiles[oi]._open
          if(!this._tAllTiles[oi]._open) this._tAllTiles[oi]._pickerOpen=false
        }
        this._updateAllTilesSection()
        break
      }
      case 'tile-picker':{
        const pb=e.target.closest('[data-a="tile-picker"]'); if(!pb) break
        const pi=parseInt(pb.dataset.idx||'0')
        if(this._tAllTiles[pi]) this._tAllTiles[pi]._pickerOpen=!this._tAllTiles[pi]._pickerOpen
        // Close MDI dropdown when emoji picker opens
        const sr_pk=this._modalHost?.shadowRoot
        if(sr_pk){ const d=sr_pk.querySelector(`[data-dropdown="tile-mdi-${pi}"]`); if(d) d.classList.remove('open') }
        this._updateAllTilesSection()
        break
      }
      case 'tile-pick-emoji':{
        const eb=e.target.closest('[data-a="tile-pick-emoji"]'); if(!eb) break
        const ei=parseInt(eb.dataset.idx||'0'),em=eb.dataset.em||''
        if(this._tAllTiles[ei]){ this._tAllTiles[ei].ico=em; this._tAllTiles[ei]._pickerOpen=false; this._tAllTiles[ei]._mdiSearch='' }
        this._updateAllTilesSection()
        // Clear MDI input
        const sr_pe=this._modalHost?.shadowRoot
        if(sr_pe){ const inp=sr_pe.querySelector(`[data-f="tile-mdi-search-${ei}"]`); if(inp) inp.value='' }
        this._schedPrev()
        break
      }
      case 'tile-mdi-sel':{
        const mb=e.target.closest('[data-a="tile-mdi-sel"]'); if(!mb) break
        const mi=parseInt(mb.dataset.idx||'0'),mn=mb.dataset.mdi||''
        if(this._tAllTiles[mi]){ this._tAllTiles[mi].ico='mdi:'+mn; this._tAllTiles[mi]._mdiSearch=mn; this._tAllTiles[mi]._pickerOpen=false }
        const sr_ms=this._modalHost?.shadowRoot
        if(sr_ms){ const d=sr_ms.querySelector(`[data-dropdown="tile-mdi-${mi}"]`); if(d) d.classList.remove('open') }
        this._updateAllTilesSection(); this._schedPrev()
        break
      }
      case 'tile-addrule':{
        const ab=e.target.closest('[data-a="tile-addrule"]'); if(!ab) break
        const ai=parseInt(ab.dataset.idx||'0')
        if(!this._tAllTiles[ai]) break
        if(!this._tAllTiles[ai].colorRules) this._tAllTiles[ai].colorRules=[]
        this._tAllTiles[ai].colorRules.push({threshold:0,color:'#ffffff'})
        this._updateAllTilesSection()
        break
      }
      case 'tile-rmrule':{
        const rb=e.target.closest('[data-a="tile-rmrule"]'); if(!rb) break
        const ri2=parseInt(rb.dataset.idx||'0'),rri=parseInt(rb.dataset.ridx||'0')
        if(this._tAllTiles[ri2]?.colorRules) this._tAllTiles[ri2].colorRules.splice(rri,1)
        this._updateAllTilesSection()
        break
      }
      case 'staticbg':{
        this._tStaticBg=!this._tStaticBg
        const sbgBtn=this._modalHost?.shadowRoot?.querySelector('#sbg-tog')
        if(sbgBtn){
          sbgBtn.textContent=this._tStaticBg?'Statico':'Animato'
          sbgBtn.style.background=`rgba(251,191,36,${this._tStaticBg?.15:.06})`
          sbgBtn.style.borderColor=`rgba(251,191,36,${this._tStaticBg?.4:.12})`
          sbgBtn.style.color=this._tStaticBg?'#fbbf24':'rgba(255,255,255,.4)'
        }
        this._schedPrev()
        break
      }
      case 'sttoggle':
        this._tSt.stationEnabled=!this._tSt.stationEnabled
        const stSect=this._modalHost?.shadowRoot?.querySelector('.st-sect')
        if(stSect) stSect.style.display=this._tSt.stationEnabled?'block':'none'
        const tog=this._modalHost?.shadowRoot?.querySelector('#st-tog')
        if(tog){
          tog.classList.toggle('on',this._tSt.stationEnabled)
          tog.textContent=this._tSt.stationEnabled?'Attiva':'Non attiva'
          tog.style.background=`rgba(251,191,36,${this._tSt.stationEnabled?.15:.06})`
          tog.style.borderColor=`rgba(251,191,36,${this._tSt.stationEnabled?.4:.12})`
          tog.style.color=this._tSt.stationEnabled?'#fbbf24':'rgba(255,255,255,.4)'
        }
        break
      case 'save':{
        const stSaveObj={}
        _STATION_CATS.forEach(cat=>cat.sensors.forEach(s=>{ stSaveObj[s.f]=this._tSt[s.f]||'' }))
        _STATION_SPECIALS.forEach(s=>{ stSaveObj[s.f]=this._tSt[s.f]||'' })
        const _fixedTiles=this._tAllTiles.filter(t=>t.isFixed)
        const _extraTiles=this._tAllTiles.filter(t=>!t.isFixed&&t.eid)
        const _tileCustom={}
        _fixedTiles.forEach(t=>{
          const rules=(t.colorRules||[]).filter(r=>r.color)
          if(t.ico||t.icoColor!=='#ffffff'||rules.length)
            _tileCustom[t.key]={ico:t.ico||'',icoColor:t.icoColor||'#ffffff',colorRules:rules}
        })
        this._c={ entityId:this._te,cityName:this._tc,
                  humEntity:_fixedTiles.find(t=>t.key==='hum')?.eid||'',
                  presEntity:_fixedTiles.find(t=>t.key==='pres')?.eid||'',
                  windEntity:_fixedTiles.find(t=>t.key==='wind')?.eid||'',
                  windDirEntity:_fixedTiles.find(t=>t.key==='wdir')?.eid||'',
                  tileCustom:_tileCustom,
                  wfDays:Math.min(10,Math.max(1,parseInt(this._tdays)||5)),
                  cardScale:Math.max(20,Math.min(100,parseInt(this._tCardScale)||100)),
                  cardW:Math.max(20,Math.min(100,parseInt(this._tCardW)||100)),
                  extraStats:_extraTiles.map(e=>({eid:e.eid,lbl:e.lbl||'',ico:e.ico||'📊',icoColor:e.icoColor||'#ffffff',colorRules:(e.colorRules||[]).filter(r=>r.color)})),
                  staticBg:!!this._tStaticBg,
                  swipeInterval:parseInt(this._tSwipeInterval)||5,
                  swipeTransition:parseFloat(this._tSwipeTransition)||0.38,
                  swipeThreshold:parseInt(this._tSwipeThreshold)||40,
                  stationEnabled:!!this._tSt.stationEnabled,
                  stationLat:this._tSt.stationLat||'',
                  stationLon:this._tSt.stationLon||'',
                  ...stSaveObj }
        this._saveStore()
        if(this._frarikCard?.id){
          this.dispatchEvent(new CustomEvent('frarik-card-layout',{
            bubbles:true,composed:true,
            detail:{cardId:this._frarikCard.id,cardScale:this._c.cardScale,cardW:this._c.cardW}
          }))
        }
        this._fc=[]; this._getForecast()
        this._fch=[]; this._unsubHourly()
        this._closeSettings()
        this.dispatchEvent(new CustomEvent('config-changed',{
          detail:{config:{entityId:this._c.entityId,cityName:this._c.cityName,
            humEntity:this._c.humEntity,presEntity:this._c.presEntity,
            windEntity:this._c.windEntity,windDirEntity:this._c.windDirEntity,
            wfDays:this._c.wfDays}},bubbles:true,composed:true}))
        break
      }
      case 'day':    this._openDayDetail(parseInt(t.dataset.idx||'0')); break
      case 'closedm':this._destroyDayModal(); break
      case 'stat':{
        const el=e.target.closest('[data-a="stat"]')
        if(el) this._openHistPopup(el.dataset.eid||'',el.dataset.attr||'',el.dataset.lbl||'Dato')
        break
      }
      case 'closehist':this._destroyHistModal(); break
    }
  }

  _onInput(e){
    const f=e.target.dataset.f,v=e.target.value
    const sr=this._modalHost?.shadowRoot
    if     (f==='city') { this._tc=v; this._schedPrev() }
    else if(f==='days'){ this._tdays=parseInt(v)||5; this._schedPrev() }
    else if(f==='cardscale'){
      this._tCardScale=Math.max(20,Math.min(100,parseInt(v)||100))
      const lbl=sr?.querySelector('#cardscale-lbl')
      if(lbl) lbl.textContent=this._tCardScale>=100?'Auto (100%)':this._tCardScale+'%'
      this._schedPrev()
    }
    else if(f==='cardw'){
      this._tCardW=Math.max(20,Math.min(100,parseInt(v)||100))
      const lbl=sr?.querySelector('#cardw-lbl')
      if(lbl) lbl.textContent=this._tCardW>=100?'Auto (100%)':this._tCardW+'%'
      this._schedPrev()
    }
    else if(f==='stlat'){ this._tSt.stationLat=v }
    else if(f==='stlon'){ this._tSt.stationLon=v }
    else if(f?.startsWith('tile-eid-')){
      const i=parseInt(f.replace('tile-eid-',''))
      if(this._tAllTiles[i]!=null){ this._tAllTiles[i].eid=v; this._updateDropdown(f) }
      this._schedPrev()
    }
    else if(f?.startsWith('tile-lbl-')){
      const i=parseInt(f.replace('tile-lbl-',''))
      if(this._tAllTiles[i]!=null) this._tAllTiles[i].lbl=v
      this._schedPrev()
    }
    else if(f?.startsWith('tile-ico-color-')){
      const i=parseInt(f.replace('tile-ico-color-',''))
      if(this._tAllTiles[i]){ this._tAllTiles[i].icoColor=v; this._updateAllTilesSection() }
      this._schedPrev()
    }
    else if(f?.startsWith('tile-mdi-search-')){
      const i=parseInt(f.replace('tile-mdi-search-',''))
      if(this._tAllTiles[i]) this._tAllTiles[i]._mdiSearch=v
      this._updateMdiDropdown(i)
    }
    else if(f?.startsWith('tile-ico-')){
      const i=parseInt(f.replace('tile-ico-',''))
      if(this._tAllTiles[i]){ this._tAllTiles[i].ico=v; this._updateAllTilesSection() }
      this._schedPrev()
    }
    else if(f?.startsWith('tile-rule-thr-')){
      const pts=f.split('-'); const ii=parseInt(pts[pts.length-2]); const ri=parseInt(pts[pts.length-1])
      if(this._tAllTiles[ii]?.colorRules?.[ri]) this._tAllTiles[ii].colorRules[ri].threshold=parseFloat(v)||0
      this._schedPrev()
    }
    else if(f?.startsWith('tile-rule-col-')){
      const pts=f.split('-'); const ii=parseInt(pts[pts.length-2]); const ri=parseInt(pts[pts.length-1])
      if(this._tAllTiles[ii]?.colorRules?.[ri]){ this._tAllTiles[ii].colorRules[ri].color=v; this._updateAllTilesSection() }
      this._schedPrev()
    }
    else if(f==='swipe-interval'){ this._tSwipeInterval=Math.max(2,Math.min(60,parseInt(v)||5)) }
    else if(f==='swipe-transition'){ this._tSwipeTransition=Math.max(0.05,Math.min(5,parseFloat(v)||0.38)) }
    else if(f==='swipe-threshold'){ this._tSwipeThreshold=Math.max(10,Math.min(150,parseInt(v)||40)) }
    else {
      const allStFs=_STATION_CATS.flatMap(c=>c.sensors.map(s=>s.f)).concat(_STATION_SPECIALS.map(s=>s.f))
      if(allStFs.includes(f)){
        this._tSt[f]=v
        this._updateDropdown(f)
      }
    }
  }

  _schedPrev(){
    if(this._prevTimer) clearTimeout(this._prevTimer)
    this._prevTimer=setTimeout(()=>this._updatePreview(),180)
  }

  _updatePreview(){
    const sr=this._modalHost?.shadowRoot
    const pc=sr?.querySelector('#meteo-preview-card')
    if(!pc) return
    try{
      const _fprev=this._tAllTiles.filter(t=>t.isFixed)
      const _tcprev={}
      _fprev.forEach(t=>{ const r=(t.colorRules||[]).filter(x=>x.color); if(t.ico||t.icoColor!=='#ffffff'||r.length) _tcprev[t.key]={ico:t.ico||'',icoColor:t.icoColor||'#ffffff',colorRules:r} })
      pc.setConfig({
        storageKey:'__prev__',
        entityId:this._te||this._c.entityId,
        cityName:this._tc,
        humEntity:_fprev.find(t=>t.key==='hum')?.eid||'',
        presEntity:_fprev.find(t=>t.key==='pres')?.eid||'',
        windEntity:_fprev.find(t=>t.key==='wind')?.eid||'',
        windDirEntity:_fprev.find(t=>t.key==='wdir')?.eid||'',
        tileCustom:_tcprev,
        wfDays:parseInt(this._tdays)||5,
        cardScale:100, cardMinH:0,
        staticBg:!!this._tStaticBg,
        extraStats:this._tAllTiles.filter(t=>!t.isFixed&&t.eid).map(e=>({eid:e.eid,lbl:e.lbl||'',ico:e.ico||'📊',icoColor:e.icoColor||'#ffffff',colorRules:(e.colorRules||[]).filter(r=>r.color)})),
      })
      if(this._h) pc.hass=this._h
      const sc=this._tCardScale??100
      pc.style.display='block'
      pc.style.zoom=sc<100?sc+'%':''
      pc.style.width=this._tCardW<100?this._tCardW+'%':''
    }catch(err){}
  }

  _onFocus(e){
    const f=e.target?.dataset?.f
    const sr=this._modalHost?.shadowRoot; if(!sr) return
    const allStFs=_STATION_CATS.flatMap(c=>c.sensors.map(s=>s.f)).concat(_STATION_SPECIALS.map(s=>s.f))
    if(f?.startsWith('tile-eid-')||allStFs.includes(f)){
      sr.querySelectorAll('.esr[data-dropdown]').forEach(d=>{ if(d.dataset.dropdown!==f) d.classList.remove('open') })
      this._updateDropdown(f)
    } else if(f?.startsWith('tile-mdi-search-')){
      const i=parseInt(f.replace('tile-mdi-search-',''))
      sr.querySelectorAll('.esr[data-dropdown]').forEach(d=>{ if(d.dataset.dropdown!==`tile-mdi-${i}`) d.classList.remove('open') })
      this._updateMdiDropdown(i)
    } else {
      sr.querySelectorAll('.esr[data-dropdown]').forEach(d=>d.classList.remove('open'))
    }
  }

  _updateDropdown(field){
    const sr=this._modalHost?.shadowRoot; if(!sr) return
    const dropdown=sr.querySelector(`[data-dropdown="${field}"]`); if(!dropdown) return
    const val=(field.startsWith('tile-eid-')?this._tAllTiles[parseInt(field.replace('tile-eid-',''))]?.eid||'':this._tSt[field]||'')
    const filter=val.toLowerCase()
    const allIds=Object.keys(this._h?.states||{})
    const filtered=filter
      ?allIds.filter(id=>id.toLowerCase().includes(filter)||(this._h.states[id]?.attributes?.friendly_name||'').toLowerCase().includes(filter))
      :allIds
    const listEl=dropdown.querySelector('.el'); if(!listEl) return
    listEl.innerHTML=filtered.length
      ?filtered.slice(0,80).map(id=>{
          const nm=this._h.states[id]?.attributes?.friendly_name||id
          return `<div class="eo${id===val?' sel':''}" data-a="sel-sensor" data-f="${field}" data-id="${id}">${nm}<span style="font-size:9px;color:rgba(255,255,255,.55);margin-left:6px;">${id}</span></div>`
        }).join('')
      :'<div style="padding:8px 12px;font-size:11px;color:rgba(255,255,255,.6);">Nessuna entità trovata</div>'
    dropdown.classList.add('open')
  }

  configure(card){ if(card&&card.id) this._frarikCard=card; this._openSettings() }

  // ── Settings modal ────────────────────────────────────────────────────────
  _openSettings(){
    this._so=true; this._se=false
    this._te=this._c.entityId; this._tc=this._c.cityName
    this._tdays=this._c.wfDays||5
    const _mll=JSON.parse(localStorage.getItem('_frk_layout_'+(this._frarikCard?.id||''))||'{}')
    this._tCardScale=_mll.cardScale??this._c.cardScale??100; this._tCardW=_mll.cardW??this._c.cardW??100
    this._tStaticBg=this._c.staticBg||false
    this._tSwipeInterval=this._c.swipeInterval||5
    this._tSwipeThreshold=this._c.swipeThreshold||40
    this._tSwipeTransition=parseFloat(this._c.swipeTransition)||0.38
    const _tc=this._c.tileCustom||{}
    const _ms=ico=>ico?.startsWith('mdi:')?ico.replace('mdi:',''):''
    this._tAllTiles=[
      {key:'hum', eid:this._c.humEntity||'',    lbl:'Umidità',   ico:_tc.hum?.ico||'',  icoColor:_tc.hum?.icoColor||'#ffffff',  colorRules:[...((_tc.hum?.colorRules)||[])], isFixed:true,_open:false,_pickerOpen:false,_mdiSearch:_ms(_tc.hum?.ico)},
      {key:'pres',eid:this._c.presEntity||'',   lbl:'Pressione', ico:_tc.pres?.ico||'', icoColor:_tc.pres?.icoColor||'#ffffff', colorRules:[...((_tc.pres?.colorRules)||[])],isFixed:true,_open:false,_pickerOpen:false,_mdiSearch:_ms(_tc.pres?.ico)},
      {key:'wind',eid:this._c.windEntity||'',   lbl:'Vento',     ico:_tc.wind?.ico||'', icoColor:_tc.wind?.icoColor||'#ffffff', colorRules:[...((_tc.wind?.colorRules)||[])],isFixed:true,_open:false,_pickerOpen:false,_mdiSearch:_ms(_tc.wind?.ico)},
      {key:'wdir',eid:this._c.windDirEntity||'',lbl:'Direzione', ico:_tc.wdir?.ico||'', icoColor:_tc.wdir?.icoColor||'#ffffff', colorRules:[...((_tc.wdir?.colorRules)||[])],isFixed:true,_open:false,_pickerOpen:false,_mdiSearch:_ms(_tc.wdir?.ico)},
      ...(this._c.extraStats||[]).map(e=>({key:null,eid:e.eid||'',lbl:e.lbl||'',ico:e.ico||'📊',icoColor:e.icoColor||'#ffffff',colorRules:[...(e.colorRules||[])],isFixed:false,_open:false,_pickerOpen:false,_mdiSearch:_ms(e.ico)}))
    ]
    this._tSt={ stationEnabled:this._c.stationEnabled||false, stationLat:this._c.stationLat||'', stationLon:this._c.stationLon||'' }
    _STATION_CATS.forEach(cat=>cat.sensors.forEach(s=>{ this._tSt[s.f]=this._c[s.f]||'' }))
    _STATION_SPECIALS.forEach(s=>{ this._tSt[s.f]=this._c[s.f]||'' })
    this._renderModal(); this._bk=null; this._build()
  }

  _closeSettings(){
    this._so=false; this._te=this._c.entityId; this._tc=this._c.cityName
    this._destroyModal(); this._bk=null; this._build()
    if(this._frarikCard?.id){
      this.dispatchEvent(new CustomEvent('frarik-card-layout',{
        bubbles:true,composed:true,
        detail:{cardId:this._frarikCard.id,cardScale:this._c.cardScale??100,cardW:this._c.cardW??100}
      }))
    }
  }

  _allTilesHTML(){
    return this._tAllTiles.map((tile,i)=>{
      const isFixed=tile.isFixed
      const icoIsMdi=tile.ico?.startsWith('mdi:')
      const mdiName=tile._mdiSearch||(icoIsMdi?tile.ico.replace('mdi:',''):'')
      const emojiDisplay=(!icoIsMdi&&tile.ico)||''
      const icoPreview=emojiDisplay||(icoIsMdi?'':_TILE_DEF_ICO[tile.key]||'📊')
      const subPanel=tile._open?`
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.07);">
          <div class="fl" style="margin:0 0 6px;font-size:10px;">Icona tile</div>
          <div style="display:flex;gap:8px;margin-bottom:10px;">
            <!-- Emoji -->
            <div style="flex:1;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px;">
              <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Emoji</div>
              <button data-a="tile-picker" data-idx="${i}" style="font-size:${emojiDisplay?'22':'14'}px;width:100%;min-height:36px;background:rgba(255,255,255,${emojiDisplay?.07:.04});border:1px solid rgba(255,255,255,${emojiDisplay?.18:.1});border-radius:7px;cursor:pointer;line-height:1;padding:5px 6px;display:flex;align-items:center;justify-content:center;gap:5px;color:${emojiDisplay?'#fff':'rgba(255,255,255,.35)'};">
                <span>${emojiDisplay||'scegli ▼'}</span>
              </button>
              ${tile._pickerOpen?`
                <div style="margin-top:6px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px;max-height:118px;overflow-y:auto;scrollbar-width:none;">
                  <div style="display:flex;flex-wrap:wrap;gap:2px;">
                    ${_TILE_EMOJIS.map(em=>`<button data-a="tile-pick-emoji" data-idx="${i}" data-em="${em}" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:5px;padding:3px 4px;font-size:15px;cursor:pointer;line-height:1;">${em}</button>`).join('')}
                  </div>
                </div>`:''}
            </div>
            <!-- MDI -->
            <div style="flex:1;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px;">
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;">
                <span style="font-size:9px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;">Icona MDI</span>
                ${icoIsMdi?`<ha-icon icon="${tile.ico}" style="color:${tile.icoColor||'#fff'};--mdc-icon-size:15px;pointer-events:none;"></ha-icon>`:''}
              </div>
              <div class="inp-grp" style="margin:0;">
                <input class="ci" type="text" value="${mdiName}" placeholder="es: thermometer" data-f="tile-mdi-search-${i}" autocomplete="off" style="font-size:11px;"/>
                <div class="esr" data-dropdown="tile-mdi-${i}" style="overflow-y:auto;max-height:188px;"><div class="el"></div></div>
              </div>
              <div class="ht" style="margin-top:4px;">Scrivi per cercare, clicca per selezionare</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <div class="fl" style="margin:0;font-size:10px;flex:1;">Colore icona</div>
            <input class="ci" type="color" value="${tile.icoColor||'#ffffff'}" data-f="tile-ico-color-${i}" style="padding:3px;height:32px;width:52px;"/>
          </div>
          <div>
            <div class="fl" style="margin-bottom:2px;font-size:10px;">🎨 Colori per soglia valore</div>
            <div class="ht" style="margin-bottom:6px;">Il colore con la soglia più alta raggiunta viene applicato al valore</div>
            ${(tile.colorRules||[]).map((r,ri)=>`
              <div style="display:flex;align-items:center;gap:5px;margin-top:5px;background:rgba(255,255,255,.03);border-radius:8px;padding:5px 7px;">
                <span style="font-size:10px;color:rgba(255,255,255,.4);white-space:nowrap;flex-shrink:0;">val ≥</span>
                <input class="ci" type="number" value="${r.threshold}" data-f="tile-rule-thr-${i}-${ri}" style="width:60px;padding:4px 7px;font-size:11px;flex-shrink:0;"/>
                <input class="ci" type="color" value="${r.color||'#ffffff'}" data-f="tile-rule-col-${i}-${ri}" style="padding:3px;height:30px;width:46px;flex-shrink:0;"/>
                <span style="font-size:10px;color:rgba(255,255,255,.3);flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${r.color||''}</span>
                <button data-a="tile-rmrule" data-idx="${i}" data-ridx="${ri}" style="background:rgba(255,80,80,.1);border:1px solid rgba(255,80,80,.22);color:rgba(255,120,120,.85);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;flex-shrink:0;">✕</button>
              </div>`).join('')}
            <button data-a="tile-addrule" data-idx="${i}" style="margin-top:7px;width:100%;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18);color:#4ade80;border-radius:8px;padding:5px 10px;font-size:10px;font-weight:700;cursor:pointer;">＋ Aggiungi soglia colore</button>
          </div>
        </div>`:''
      return `<div style="border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:8px 10px;margin-top:8px;background:rgba(255,255,255,.02);">
        <div style="display:flex;align-items:flex-end;gap:6px;">
          ${isFixed?`<div style="padding:2px 0 6px;min-width:58px;"><div class="fl" style="margin:0 0 1px;">${tile.lbl}</div><div style="font-size:9px;color:rgba(255,255,255,.35);">tile fissa</div></div>`:''}
          <div style="flex:${isFixed?2:3};">
            <div class="fl" style="margin:0 0 3px;font-size:10px;">${isFixed?'Sensore personalizzato (opzionale)':'Entità'}</div>
            <div class="inp-grp">
              <input class="ci" type="text" value="${tile.eid||''}" placeholder="${isFixed?'sensor.xyz → auto se vuoto':'sensor.xyz'}" data-f="tile-eid-${i}" autocomplete="off"/>
              <div class="esr" data-dropdown="tile-eid-${i}"><div class="el"></div></div>
            </div>
          </div>
          ${!isFixed?`<div style="flex:1.5;"><div class="fl" style="margin:0 0 3px;font-size:10px;">Etichetta</div><input class="ci" type="text" value="${tile.lbl||''}" placeholder="Nome" data-f="tile-lbl-${i}"/></div>`:''}
          <div style="display:flex;gap:4px;padding-bottom:1px;">
            <button data-a="tile-open" data-idx="${i}" style="background:rgba(251,191,36,${tile._open?.12:.06});border:1px solid rgba(251,191,36,${tile._open?.35:.15});color:${tile._open?'#fbbf24':'rgba(255,255,255,.45)'};border-radius:8px;padding:6px 8px;font-size:13px;cursor:pointer;flex-shrink:0;line-height:1;" title="Personalizza">
              ${icoIsMdi?`<ha-icon icon="${tile.ico}" style="color:inherit;--mdc-icon-size:15px;pointer-events:none;"></ha-icon>`:emojiDisplay||icoPreview} ⚙</button>
            ${!isFixed?`<button data-a="tile-rm" data-idx="${i}" style="background:rgba(255,80,80,.1);border:1px solid rgba(255,80,80,.22);color:rgba(255,120,120,.85);border-radius:8px;padding:6px 9px;font-size:13px;cursor:pointer;flex-shrink:0;line-height:1;">✕</button>`:''}
          </div>
        </div>
        ${subPanel}
      </div>`
    }).join('')+
    (this._tAllTiles.filter(t=>!t.isFixed).length<8
      ?`<button data-a="tile-add" style="margin-top:10px;width:100%;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.22);color:#fbbf24;border-radius:10px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;">＋ Aggiungi statistica</button>`:'')
  }

  _updateAllTilesSection(){
    const sr=this._modalHost?.shadowRoot; if(!sr) return
    const c=sr.querySelector('#all-tiles-container'); if(!c) return
    c.innerHTML=this._allTilesHTML()
  }

  _updateMdiDropdown(i){
    const sr=this._modalHost?.shadowRoot; if(!sr) return
    const drop=sr.querySelector(`[data-dropdown="tile-mdi-${i}"]`); if(!drop) return
    const q=(this._tAllTiles[i]?._mdiSearch||'').toLowerCase()
    const icons=q?_MDI_ICONS.filter(n=>n.includes(q)):_MDI_ICONS
    const listEl=drop.querySelector('.el'); if(!listEl) return
    listEl.innerHTML=icons.length
      ?icons.slice(0,60).map(name=>`<div class="eo" data-a="tile-mdi-sel" data-idx="${i}" data-mdi="${name}" style="display:flex;align-items:center;gap:8px;padding:6px 10px;">
          <ha-icon icon="mdi:${name}" style="color:#fff;--mdc-icon-size:16px;flex-shrink:0;pointer-events:none;"></ha-icon>
          <span>${name}</span></div>`).join('')
      :'<div style="padding:8px 12px;font-size:11px;color:rgba(255,255,255,.5);">Nessuna icona trovata</div>'
    drop.classList.add('open')
  }

  _renderModal(){
    if(!this._modalHost){
      this._modalHost=document.createElement('div')
      this._modalHost.attachShadow({mode:'open'})
      this._modalHost.shadowRoot.addEventListener('click',this._click)
      this._modalHost.shadowRoot.addEventListener('input',this._inp)
      this._modalHost.shadowRoot.addEventListener('focusin',this._focus)
      document.body.appendChild(this._modalHost)
    }
    this._modalHost.shadowRoot.innerHTML=`<style>${_CSS}</style>${this._sovHTML()}`
    setTimeout(()=>this._updatePreview(),60)
  }

  _destroyModal(){
    if(!this._modalHost) return
    this._modalHost.shadowRoot.removeEventListener('click',this._click)
    this._modalHost.shadowRoot.removeEventListener('input',this._inp)
    this._modalHost.shadowRoot.removeEventListener('focusin',this._focus)
    this._modalHost.remove(); this._modalHost=null
  }

  // ── Hourly sub ────────────────────────────────────────────────────────────
  _unsubHourly(){ if(!this._fcs) return; Promise.resolve(this._fcs).then(u=>{if(typeof u==='function')u()}).catch(()=>{}); this._fcs=null }

  async _getHourlyForecast(){
    const eid=this._c?.entityId
    if(!this._h||!eid) return
    const onFc=fc=>{ if(!Array.isArray(fc)||!fc.length) return false; this._fch=fc; this._renderDayModal(); return true }
    const extract=r=>r?.response?.[eid]?.forecast??r?.[eid]?.forecast??r?.forecast??(Array.isArray(r)?r:null)
    const conn=this._h.connection
    if(conn?.subscribeMessage){
      try{ this._fcs=conn.subscribeMessage(ev=>onFc(ev?.forecast??ev?.event?.forecast??[]),{type:'weather/subscribe_forecast',forecast_type:'hourly',entity_id:eid}) }catch(e){}
    }
    if(this._fch.length) return
    for(const svc of['get_forecasts','get_forecast']){
      try{ const r=await conn?.sendMessagePromise?.({type:'call_service',domain:'weather',service:svc,service_data:{entity_id:eid,type:'hourly'},return_response:true}).catch(()=>null); if(onFc(extract(r))) return }catch(e){}
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  _build(){
    if(!this._h) return
    const eid=this._c.entityId
    if(!eid){ this._renderEmpty('Attiva modifica → ✏️ per configurare'); return }
    const st=this._h.states?.[eid]
    if(!st){ this._renderEmpty('Entità non trovata: '+eid); return }
    this._renderCard(st)
  }

  _renderEmpty(msg){
    this.shadowRoot.innerHTML=`<style>${_CSS}</style>
<div class="card" style="background:#0f0820;border:1px solid rgba(139,92,246,.25);min-height:180px;">
  <div class="body">
    <div class="hdr"><div></div><button class="gbtn ${this._so?'on':''}" data-a="gear">${_IC.gear}</button></div>
    <div class="ph"><div class="phi">⛅</div><div>${msg}</div></div>
  </div>
</div>`
  }

  _renderCard(st){
    const cond=st.state,a=st.attributes
    const sunE=this._h?.states?.['sun.sun']
    const isNight=_isNightNow(sunE?.state,cond)
    const accent=isNight?'#a78bfa':'#38bdf8'
    const tb=isNight?'rgba(139,92,246,.12)':'rgba(56,189,248,.10)'
    const tbr=isNight?'rgba(139,92,246,.22)':'rgba(56,189,248,.18)'
    const border=isNight?'rgba(139,92,246,.28)':'rgba(56,189,248,.22)'
    const ico=_wxSVG(cond,82)
    const cit=_CI[cond]||cond.replace(/-/g,' ')
    const temp=_n(a.temperature)
    const _sv=id=>{ const s=this._h?.states?.[id]; return s?s.state+(s.attributes?.unit_of_measurement?' '+s.attributes.unit_of_measurement:''):null }
    const c=this._c
    const hum =_sv(c.humEntity) ??(a.humidity   !=null?a.humidity+'%':'--')
    const pres=_sv(c.presEntity)??(a.pressure!=null?_n(a.pressure)+' hPa':'--')
    const wsp =_sv(c.windEntity)??(a.wind_speed!=null?a.wind_speed+' k/h':'--')
    const wdir=_sv(c.windDirEntity)??_windDir(a.wind_bearing)
    const city=c.cityName||a.friendly_name||c.entityId
    const today=_fmtDate()
    const _nDays=Math.min(10,Math.max(1,c.wfDays||5))
    let fcH=''
    if(this._fo&&this._fc.length){
      const days=this._fc.slice(0,_nDays)
      const maxT=Math.max(...days.map(f=>parseFloat(f.temperature)||0))
      const minT=Math.min(...days.map(f=>parseFloat(f.templow??f.temperature)||0))
      const rng=maxT-minT||1
      fcH=days.map((f,i)=>{
        const nm=i===0?'OGGI':_fmtDay(new Date(f.datetime))
        const fi=_wxSVG(f.condition,36)
        const mx=_n(f.temperature),mn=_n(f.templow??(parseFloat(f.temperature)-4))
        const rn=(parseFloat(f.precipitation)||0).toFixed(1)
        const col=_tempCol(f.temperature)
        const bw=Math.round(((parseFloat(f.temperature)||0)-minT)/rng*75+25)
        const nc=i===0?'#fff':'rgba(255,255,255,.7)'
        return `<div class="fcc" data-a="day" data-idx="${i}">
          <div class="fdn" style="color:${nc};">${nm}</div>
          <div class="fi">${fi}</div><div class="fm">${mx}°</div>
          <div class="fb" style="background:${col};width:${bw}%;"></div>
          <div class="fmi">${mn}°</div><div class="fr">${rn}mm</div>
        </div>`
      }).join('')
    } else if(this._fo){
      fcH=`<div style="grid-column:span ${_nDays};text-align:center;padding:14px;color:rgba(255,255,255,.25);font-size:11px;">Previsioni in caricamento…</div>`
    }

    const _tcust=c.tileCustom||{}
    const _applyColor=(rules,sv)=>{
      if(!rules?.length||sv==null) return null
      const n=parseFloat(sv); if(isNaN(n)) return null
      const s=[...rules].sort((a,b)=>b.threshold-a.threshold)
      for(const r of s){ if(n>=r.threshold) return r.color }
      return null
    }
    const _icoHTML=(ico,color,defSvg)=>{
      if(!ico) return defSvg?`<span style="color:${color||'#fff'}">${defSvg}</span>`:`<span style="color:${color||'#fff'};font-size:1.1em">📊</span>`
      if(ico.startsWith('mdi:')) return `<ha-icon icon="${ico}" style="color:${color||'#fff'};--mdc-icon-size:1.4em;display:inline-flex;vertical-align:middle;"></ha-icon>`
      return `<span style="color:${color||'#fff'};font-size:1.1em">${ico}</span>`
    }
    const _tileIco=(key,cust)=>_icoHTML(cust?.ico, cust?.icoColor, _IC[key])
    const _wrapVal=(v,rules)=>{const cl=_applyColor(rules,v);return cl?`<span style="color:${cl}">${v}</span>`:v}
    const _allTiles=[
      {eid:c.humEntity||c.entityId,    attr:c.humEntity?'':'humidity',      lbl:'Umidità',   ico:_tileIco('hu',_tcust.hum),  val:_wrapVal(hum, _tcust.hum?.colorRules)},
      {eid:c.presEntity||c.entityId,   attr:c.presEntity?'':'pressure',     lbl:'Pressione', ico:_tileIco('pr',_tcust.pres), val:_wrapVal(pres,_tcust.pres?.colorRules)},
      {eid:c.windEntity||c.entityId,   attr:c.windEntity?'':'wind_speed',   lbl:'Vento',     ico:_tileIco('wi',_tcust.wind), val:_wrapVal(wsp, _tcust.wind?.colorRules)},
      {eid:c.windDirEntity||c.entityId,attr:c.windDirEntity?'':'wind_bearing',lbl:'Direzione',ico:_tileIco('co',_tcust.wdir),val:_wrapVal(wdir,_tcust.wdir?.colorRules)},
      ...(c.extraStats||[]).filter(x=>x.eid).map(ex=>{
        const sv=_sv(ex.eid)
        const valColor=_applyColor(ex.colorRules,sv)
        return {eid:ex.eid,attr:'',lbl:ex.lbl||ex.eid.split('.').pop(),
          ico:_icoHTML(ex.ico, ex.icoColor, null),
          val:valColor?`<span style="color:${valColor}">${sv||'--'}</span>`:sv||'--'}
      })
    ]
    const _pages=[]; for(let i=0;i<_allTiles.length;i+=4) _pages.push(_allTiles.slice(i,i+4))
    const _mkTile=t=>`<div class="stl" data-a="stat" data-eid="${t.eid}" data-attr="${t.attr}" data-lbl="${t.lbl}" style="background:${tb};border:1px solid ${tbr};"><div class="sic">${t.ico}</div><div class="sv">${t.val}</div><div class="sl">${t.lbl}</div></div>`
    const _statsHTML=_pages.length<=1
      ?`<div class="stats">${(_pages[0]||[]).map(_mkTile).join('')}</div>`
      :`<div class="stats-wrap">
          <div class="stats-track">${_pages.map(pg=>`<div class="stats-page">${pg.map(_mkTile).join('')}</div>`).join('')}</div>
        </div>`

    this.shadowRoot.innerHTML=`<style>${_CSS}</style>
<div class="card" data-a="station" style="border:1px solid ${border};cursor:${this._c.stationEnabled?'pointer':'default'};">
  ${this._skyHTML(st)}
  <div class="body">
    <div class="hdr">
      <div>
        <div class="city">${city}</div>
        <div class="sub">
          <span class="cond">${cit}</span>
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
    ${_statsHTML}
    <div class="fct" data-a="fc">
      <span>Prossimi giorni — Tocca per i dettagli</span>
      <span>${this._fo?_IC.cd:_IC.cr}</span>
    </div>
    <div class="fcg ${this._fo?'open':''}">${fcH}</div>
  </div>
</div>`
    this._initStatsCarousel()
  }

  _goCarousel(idx){
    const sr=this.shadowRoot
    const track=sr?.querySelector('.stats-track'); if(!track) return
    const n=track.querySelectorAll('.stats-page').length; if(!n) return
    this._carCur=((idx%n)+n)%n
    track.style.transform=`translateX(-${this._carCur*100}%)`
  }

  _initStatsCarousel(){
    const sr=this.shadowRoot
    const track=sr?.querySelector('.stats-track'); if(!track) return
    const n=track.querySelectorAll('.stats-page').length; if(n<=1) return
    if(this._statsTimer) clearInterval(this._statsTimer)
    this._carCur=0
    const _si=(this._c.swipeInterval||5)*1000
    const _st=this._c.swipeThreshold||40
    const _dur=parseFloat(this._c.swipeTransition)||0.38
    track.style.transition=`transform ${_dur}s cubic-bezier(.4,0,.2,1)`
    this._statsTimer=setInterval(()=>this._goCarousel((this._carCur||0)+1),_si)
    const wrap=sr.querySelector('.stats-wrap'); if(!wrap) return
    const _restart=()=>{ clearInterval(this._statsTimer); this._statsTimer=setInterval(()=>this._goCarousel((this._carCur||0)+1),_si) }
    // touch
    let tx=0,dragging=false
    wrap.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;dragging=false},{passive:true})
    wrap.addEventListener('touchmove',e=>{if(Math.abs(e.touches[0].clientX-tx)>8)dragging=true},{passive:true})
    wrap.addEventListener('touchend',e=>{
      if(!dragging){dragging=false;return}
      const dx=e.changedTouches[0].clientX-tx
      if(Math.abs(dx)>_st){this._goCarousel((this._carCur||0)+(dx<0?1:-1));_restart()}
      dragging=false
    },{passive:true})
    // pointer/mouse drag
    let px=0,pdrag=false,pdown=false
    wrap.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch') return
      px=e.clientX;pdown=true;pdrag=false
      try{wrap.setPointerCapture(e.pointerId)}catch(_){}
    })
    wrap.addEventListener('pointermove',e=>{
      if(!pdown||e.pointerType==='touch') return
      if(Math.abs(e.clientX-px)>8) pdrag=true
    })
    wrap.addEventListener('pointerup',e=>{
      if(!pdown||e.pointerType==='touch') return
      pdown=false
      if(!pdrag){pdrag=false;return}
      const dx=e.clientX-px
      if(Math.abs(dx)>_st){this._goCarousel((this._carCur||0)+(dx<0?1:-1));_restart()}
      pdrag=false
    })
    wrap.addEventListener('pointercancel',()=>{pdown=false;pdrag=false})
  }

  _sovHTML(){
    const eid=this._te||this._c.entityId||''
    const ent=this._h?.states?.[eid]
    const enm=ent?.attributes?.friendly_name||eid||'—'
    const wents=Object.keys(this._h?.states||{}).filter(k=>k.startsWith('weather.'))
    const cardScaleV=this._tCardScale??100
    const cardWV=this._tCardW??100
    return `
<div class="sov open">
  <div class="sov-modal">
    <div class="shdr">
      <div class="sico">${_IC.gear}</div>
      <div><div class="stit">Meteo + Previsioni</div><div class="ssub">Impostazioni card</div></div>
      <button class="scls" data-a="close">${_IC.x}</button>
    </div>
    <div class="sov-2col">

      <!-- COLONNA SX: form configurazione -->
      <div class="sbdy">
        <div class="fl">Entità meteo HA</div>
        <div class="er">
          <span style="color:rgba(255,255,255,.7);display:flex;flex-shrink:0;margin-right:4px;">${_IC.cl}</span>
          <div class="ei"><div class="en">${enm}</div><div class="eid">${eid}</div></div>
          <button class="cbtn" data-a="srch">Cambia</button>
        </div>
        <div class="esr ${this._se?'open':''}">
          <div class="el">
            ${wents.length
              ?wents.map(id=>`<div class="eo ${id===eid?'sel':''}" data-a="sel" data-id="${id}">${this._h.states[id]?.attributes?.friendly_name||id}<span style="font-size:9px;color:rgba(255,255,255,.45);margin-left:4px;">${id}</span></div>`).join('')
              :'<div style="padding:8px 12px;font-size:11px;color:rgba(255,255,255,.7);">Nessuna entità weather.* trovata</div>'}
          </div>
        </div>

        <div class="fl" style="margin-top:14px;">Nome città</div>
        <input class="ci" type="text" value="${this._tc}" placeholder="Es: Selargius" data-f="city"/>
        <div class="ht">Se vuoto usa il nome dell'entità HA</div>

        <div class="fl" style="margin-top:14px;">Giorni previsioni (1–10)</div>
        <input class="ci" type="number" min="1" max="10" value="${this._tdays}" data-f="days"/>
        <div class="ht">Quanti giorni mostrare nel pannello previsioni</div>

        <div style="margin-top:16px;border-top:1px solid rgba(255,255,255,.08);padding-top:14px;">
          <div class="fl" style="margin:0 0 2px;">📊 Tutte le tile swipe</div>
          <div class="ht" style="margin-bottom:8px;">Le prime 4 sono fisse (usano attributo auto se il sensore è vuoto). Aggiungi fino a 8 statistiche extra. ⚙ per icona, colore e soglie.</div>
          <div id="all-tiles-container">${this._allTilesHTML()}</div>
        </div>

        <div style="margin-top:14px;border-top:1px solid rgba(255,255,255,.08);padding-top:14px;">
          <div class="fl" style="margin:0 0 8px;">🔄 Scorrimento automatico</div>
          <div style="display:flex;gap:8px;">
            <div style="flex:1;">
              <div class="fl" style="margin:0 0 3px;font-size:10px;">Intervallo (s)</div>
              <input class="ci" type="number" min="2" max="60" value="${this._tSwipeInterval}" data-f="swipe-interval"/>
            </div>
            <div style="flex:1;">
              <div class="fl" style="margin:0 0 3px;font-size:10px;">Transizione (s)</div>
              <input class="ci" type="number" min="0.05" max="5" step="0.05" value="${this._tSwipeTransition}" data-f="swipe-transition"/>
            </div>
          </div>
          <div class="ht" style="margin-top:5px;">Intervallo: secondi tra auto-scroll · Transizione: durata animazione slide (es. 0.38 veloce, 1 lento)</div>
        </div>

        <div style="margin-top:14px;border-top:1px solid rgba(255,255,255,.08);padding-top:14px;display:flex;align-items:center;gap:10px;">
          <div class="fl" style="margin:0;flex:1;">🎨 Sfondo della card</div>
          <button id="sbg-tog" data-a="staticbg" style="background:rgba(251,191,36,${this._tStaticBg?.15:.06});border:1px solid rgba(251,191,36,${this._tStaticBg?.4:.12});color:${this._tStaticBg?'#fbbf24':'rgba(255,255,255,.4)'};border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;">${this._tStaticBg?'Statico':'Animato'}</button>
        </div>
        <div class="ht">Statico: solo gradiente colore, senza animazioni né sole/luna</div>

        <div style="margin-top:20px;border-top:1px solid rgba(255,255,255,.08);padding-top:16px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
            <div class="fl" style="margin:0;flex:1;">🌡️ Stazione Meteo</div>
            <button id="st-tog" data-a="sttoggle" style="background:rgba(251,191,36,${this._tSt.stationEnabled?.15:.06});border:1px solid rgba(251,191,36,${this._tSt.stationEnabled?.4:.12});color:${this._tSt.stationEnabled?'#fbbf24':'rgba(255,255,255,.4)'};border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;">${this._tSt.stationEnabled?'Attiva':'Non attiva'}</button>
          </div>
          <div class="ht">Abilita popup completo cliccando sullo sfondo della card</div>

          <div class="st-sect" style="display:${this._tSt.stationEnabled?'block':'none'};">
            <div style="display:flex;gap:8px;margin-top:12px;">
              <div style="flex:1;">
                <div class="fl">Latitudine</div>
                <input class="ci" type="text" value="${this._tSt.stationLat}" placeholder="Es: 45.467" data-f="stlat"/>
              </div>
              <div style="flex:1;">
                <div class="fl">Longitudine</div>
                <input class="ci" type="text" value="${this._tSt.stationLon}" placeholder="Es: 10.295" data-f="stlon"/>
              </div>
            </div>
            <div class="ht">Coordinate per la mappa radar Windy</div>

            ${_STATION_CATS.map(cat=>`
              <div style="margin-top:14px;font-size:11px;font-weight:800;color:${cat.color};text-transform:uppercase;letter-spacing:.07em;">${cat.icon} ${cat.label}</div>
              ${cat.sensors.map(s=>`
                <div class="fl" style="margin-top:6px;font-size:10px;color:rgba(255,255,255,.6);">${s.lbl}</div>
                <div class="inp-grp">
                  <input class="ci" type="text" value="${this._tSt[s.f]||''}" placeholder="entità..." data-f="${s.f}" autocomplete="off"/>
                  <div class="esr" data-dropdown="${s.f}"><div class="el"></div></div>
                </div>
              `).join('')}
            `).join('')}

            <div style="margin-top:14px;font-size:11px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.07em;">Card Speciali</div>
            ${_STATION_SPECIALS.map(s=>`
              <div class="fl" style="margin-top:6px;font-size:10px;color:rgba(255,255,255,.6);">${s.icon} ${s.label}</div>
              <div class="inp-grp">
                <input class="ci" type="text" value="${this._tSt[s.f]||''}" placeholder="entità..." data-f="${s.f}" autocomplete="off"/>
                <div class="esr" data-dropdown="${s.f}"><div class="el"></div></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- COLONNA DX: anteprima live + slider dimensioni -->
      <div class="sov-prev">
        <div class="prev-ttl">Anteprima live</div>
        <div class="prev-wrap">
          <meteo-card id="meteo-preview-card" style="--fgear:none;display:block;"></meteo-card>
        </div>

        <div class="lsect">
          <div class="fl" style="margin:0 0 4px;">Dimensioni card</div>

          <div class="layout-row">
            <span class="layout-lbl">Altezza</span>
            <input type="range" class="lslider" data-f="cardscale" min="20" max="100" step="5" value="${cardScaleV}">
            <span class="layout-val" id="cardscale-lbl">${cardScaleV>=100?'Auto (100%)':cardScaleV+'%'}</span>
          </div>

          <div class="layout-row">
            <span class="layout-lbl">Larghezza</span>
            <input type="range" class="lslider" data-f="cardw" min="20" max="100" step="5" value="${cardWV}">
            <span class="layout-val" id="cardw-lbl">${cardWV>=100?'Auto (100%)':cardWV+'%'}</span>
          </div>
          <div class="ht" style="margin-top:6px;">Altezza: zoom proporzionale sull'intera card</div>
          <div class="ht">Larghezza: stringe la card nella colonna (il contenuto si adatta)</div>
        </div>
      </div>

    </div>
    <div class="sft"><button class="sav" data-a="save">${_IC.ok} Salva</button></div>
  </div>
</div>`
  }

  // ── Station popup ─────────────────────────────────────────────────────────
  _destroyStationPopup(){
    if(!this._stationModalHost) return
    this._stationModalHost.shadowRoot.removeEventListener('click',this._click)
    this._stationModalHost.remove(); this._stationModalHost=null
  }

  _openStationPopup(){
    this._destroyStationPopup()
    this._stationModalHost=document.createElement('div')
    this._stationModalHost.attachShadow({mode:'open'})
    this._stationModalHost.shadowRoot.addEventListener('click',this._click)
    document.body.appendChild(this._stationModalHost)
    this._stationModalHost.shadowRoot.innerHTML=`<style>${_CSS}${this._stationCSS()}</style>${this._stationHTML()}`
  }

  _stationCSS(){
    return `
.stov{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.9);backdrop-filter:blur(12px);display:flex;flex-direction:column;font-family:var(--primary-font-family,system-ui,sans-serif);overflow:hidden;}
.stov-modal{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;}
.stov-scroll{flex:1;overflow-y:auto;padding:16px;scrollbar-width:none;-ms-overflow-style:none;}
.stov-scroll::-webkit-scrollbar{display:none;}
.stov-map-wrap{width:100%;margin-bottom:18px;}
.windy-bar{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;align-items:center;}
.windy-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:20px;padding:4px 11px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;flex-shrink:0;outline:none;}
.windy-btn:hover{background:rgba(255,255,255,.13);}
.windy-btn.wba{background:rgba(56,189,248,.18);border-color:rgba(56,189,248,.5);color:#38bdf8;}
.windy-expand{margin-left:auto;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);color:#fbbf24;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px;flex-shrink:0;white-space:nowrap;}
.windy-expand:hover{background:rgba(251,191,36,.2);}
.stov-map{width:100%;height:430px;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#0a0816;transition:height .25s ease;}
.stov-map.stov-map-fs{height:calc(100vh - 170px);border-radius:10px;}
.stov-map iframe{width:100%;height:100%;border:none;}
.windy-zoom{display:flex;align-items:center;gap:4px;margin-left:4px;}
.windy-zbtn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:8px;width:28px;height:26px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;outline:none;}
.windy-zbtn:hover{background:rgba(255,255,255,.18);}
.windy-zoom-val{font-size:11px;color:rgba(255,255,255,.5);min-width:14px;text-align:center;}
.stov-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
@media(max-width:700px){.stov-grid{grid-template-columns:1fr;}}
.scat{border-radius:16px;padding:0;overflow:hidden;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;}
.scat-anim{position:relative;height:130px;overflow:hidden;display:flex;align-items:center;justify-content:center;}
.scat-body{padding:12px 14px 16px;flex:1;}
.scat-title{font-size:13px;font-weight:800;color:#fff;margin-bottom:10px;letter-spacing:.04em;}
.ssel{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:8px;cursor:pointer;transition:background .12s;margin-bottom:3px;}
.ssel:hover{background:rgba(255,255,255,.07);}
.ssel-lbl{font-size:10px;color:#fff;font-weight:500;flex:1;opacity:.72;}
.ssel-val{font-size:13px;font-weight:700;color:#fff;text-align:right;}
@keyframes stRainFall{0%{transform:translateY(-20px);opacity:0}15%{opacity:.85}80%{opacity:.8}100%{transform:translateY(100px);opacity:0}}
.st-rdrop{position:absolute;border-radius:2px;background:linear-gradient(to bottom,transparent,#38bdf8);animation:stRainFall linear infinite;}
@keyframes stAnemSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes stSunRays{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.st-sun-rays{animation:stSunRays 8s linear infinite;transform-origin:40px 40px;}
@keyframes stBubble{0%{transform:translateY(70px);opacity:0}15%{opacity:.5}80%{opacity:.45}100%{transform:translateY(-20px);opacity:0}}
.st-bubble{position:absolute;border-radius:50%;animation:stBubble ease-in infinite;}
@keyframes stIceSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.st-ice{animation:stIceSpin 12s linear infinite;display:block;}
@keyframes stAlert{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.25;transform:scale(1.25)}}
.st-alert{animation:stAlert .9s ease-in-out infinite;display:block;}
`
  }

  _stationHTML(){
    const c=this._c
    const lat=c.stationLat||'45.0', lon=c.stationLon||'10.0'
    const initZoom=9
    const windyUrl=`https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&zoom=${initZoom}&level=surface&overlay=radar&product=ecmwf&menu=false&message=false&marker=true&calendar=now&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`
    const windyOpen=`https://www.windy.com/?radar,${lat},${lon},${initZoom}`
    const layers=[
      {l:'radar',n:'📡 Radar'},
      {l:'wind',n:'💨 Vento'},
      {l:'temp',n:'🌡️ Temp'},
      {l:'rh',n:'💧 Umidità'},
      {l:'pressure',n:'📊 Press.'},
      {l:'clouds',n:'☁️ Nuvole'},
      {l:'rain',n:'🌧️ Pioggia'},
      {l:'snowcover',n:'❄️ Neve'},
      {l:'gustAccu',n:'🌀 Raffiche'},
    ]
    const layerBtns=layers.map(({l,n})=>`<button class="windy-btn${l==='radar'?' wba':''}" data-a="windylayer" data-layer="${l}">${n}</button>`).join('')
    const sv=eid=>{
      if(!eid) return null
      const st=this._h?.states?.[eid]; if(!st) return null
      const u=st.attributes?.unit_of_measurement||''; return st.state+(u?' '+u:'')
    }
    const tile=(eid,lbl,color)=>{
      if(!eid) return ''
      const st=this._h?.states?.[eid]
      const u=st?.attributes?.unit_of_measurement||''
      const raw=st?.state||''
      const isNum=raw&&!isNaN(parseFloat(raw))&&raw!=='unknown'&&raw!=='unavailable'
      const disp=raw?(raw+(u?' '+u:'')):'--'
      if(isNum){
        return `<div class="ssel" data-a="ststat" data-eid="${eid}" data-lbl="${lbl}">
          <span class="ssel-lbl">${lbl}</span>
          <span class="ssel-val" style="color:${color}">${disp}</span>
        </div>`
      }
      // Entità testuale (es. summary): mostro il testo, non apre grafico
      return `<div class="ssel" style="cursor:default;align-items:flex-start;flex-wrap:wrap;gap:4px;">
        <span class="ssel-lbl" style="flex-basis:100%;">${lbl}</span>
        <span style="font-size:11px;color:${color};line-height:1.4;font-style:italic;">${raw||'--'}</span>
      </div>`
    }
    const catHTML=(cat)=>{
      const tiles=cat.sensors.map(s=>tile(c[s.f],s.lbl,cat.color)).filter(Boolean).join('')
      if(!tiles) return ''
      return `<div class="scat">
        <div class="scat-anim" style="background:linear-gradient(160deg,${cat.color}14,transparent 70%);">
          ${this._catAnimHTML(cat)}
        </div>
        <div class="scat-body">
          <div class="scat-title" style="color:${cat.color}">${cat.icon} ${cat.label}</div>
          ${tiles}
        </div>
      </div>`
    }
    const specialHTML=(sp)=>{
      const eid=c[sp.f]; if(!eid) return ''
      const st=this._h?.states?.[eid]
      const val=st?st.state:null
      const isOn=val&&val!=='unknown'&&val!=='unavailable'&&val!=='0'&&val.toLowerCase()!=='none'&&val.toLowerCase()!=='false'
      return `<div class="scat">
        <div class="scat-anim" style="background:linear-gradient(160deg,${sp.color}14,transparent 70%);">
          <span class="${sp.f==='sGhiaccio'?'st-ice':'st-alert'}" style="font-size:52px;">${sp.icon}</span>
        </div>
        <div class="scat-body">
          <div class="scat-title" style="color:${sp.color}">${sp.icon} ${sp.label}</div>
          <div class="ssel">
            <span class="ssel-lbl">Stato</span>
            <span class="ssel-val" style="color:${isOn?sp.color:'#fff'}">${val||'--'}</span>
          </div>
        </div>
      </div>`
    }
    const catCards=_STATION_CATS.map(cat=>catHTML(cat)).filter(Boolean)
    const spCards=_STATION_SPECIALS.map(sp=>specialHTML(sp)).filter(Boolean)
    const allCards=[...catCards,...spCards].join('')
    return `
<div class="stov">
  <div class="stov-modal">
    <div class="shdr" style="flex-shrink:0;border-radius:0;border-bottom:1px solid rgba(255,255,255,.07);">
      <div class="sico" style="font-size:18px;">🌡️</div>
      <div><div class="stit">Stazione Meteo</div><div class="ssub">Dati in tempo reale · ${c.cityName||'Casa'}</div></div>
      <button class="scls" data-a="closestov">${_IC.x}</button>
    </div>
    <div class="stov-scroll">
      <div class="stov-map-wrap">
        <div class="windy-bar">
          ${layerBtns}
          <div class="windy-zoom">
            <button class="windy-zbtn" data-a="windyzoom" data-dir="out" title="Zoom out">−</button>
            <span class="windy-zoom-val">${initZoom}</span>
            <button class="windy-zbtn" data-a="windyzoom" data-dir="in" title="Zoom in">+</button>
          </div>
          <button class="windy-expand" data-a="windyfull">⛶ Espandi</button>
          <a href="${windyOpen}" target="_blank" class="windy-expand">↗ Windy.com</a>
        </div>
        <div class="stov-map">
          <iframe id="stov-windy-frame" src="${windyUrl}" data-zoom="${initZoom}" data-layer="radar" frameborder="0" allowfullscreen></iframe>
        </div>
      </div>
      <div class="stov-grid">${allCards}</div>
    </div>
  </div>
</div>`
  }

  _windDirLabel(deg){
    const dirs=['N','NE','E','SE','S','SO','O','NO']
    return dirs[Math.round((((deg%360)+360)%360)/45)%8]
  }

  _catAnimHTML(cat){
    switch(cat.key){
      case 'rain':{
        const rr=parseFloat(this._h?.states?.[this._c.sRainRate]?.state)||0
        const n=rr>15?22:rr>5?15:rr>0?10:6
        const spd=rr>15?0.35:rr>5?0.55:0.85
        const drops=Array.from({length:n},(_,i)=>{
          const left=((i*43+7)%88)+2
          const h=9+((i*37+13)%100)/100*11
          const w=rr>10?2:1.5
          const dur=(spd*(0.45+((i*23+11)%100)/100*0.45)).toFixed(2)
          const del=(-(i*0.065+((i*13)%10)/100)).toFixed(2)
          return `<div class="st-rdrop" style="left:${left}%;height:${h.toFixed(0)}px;width:${w}px;animation-duration:${dur}s;animation-delay:${del}s;"></div>`
        }).join('')
        return `${drops}<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;">
          <span style="font-size:34px;filter:drop-shadow(0 0 10px #38bdf8)">🌧️</span>
          ${rr>0?`<span style="font-size:13px;font-weight:800;color:#38bdf8;">${rr.toFixed(1)} mm/h</span>`:''}
        </div>`
      }
      case 'wind':{
        const ws=parseFloat(this._h?.states?.[this._c.sWindSpeed]?.state)||0
        const wd=parseFloat(this._h?.states?.[this._c.sWindDir]?.state)||0
        const dur=ws>0?Math.max(0.12,4.5/ws).toFixed(2):'99'
        const lbl=ws>0?`${ws.toFixed(1)} km/h`:'Calma'
        const dlbl=this._windDirLabel(wd)
        return `<svg viewBox="0 0 110 130" width="95" height="112" xmlns="http://www.w3.org/2000/svg">
          <circle cx="55" cy="65" r="50" fill="rgba(167,139,250,.03)" stroke="rgba(167,139,250,.1)" stroke-width="1"/>
          <circle cx="55" cy="65" r="42" fill="none" stroke="rgba(167,139,250,.05)" stroke-width="1" stroke-dasharray="5 7"/>
          <text x="55" y="13" text-anchor="middle" fill="#a78bfa" font-size="10" font-family="system-ui" font-weight="800">N</text>
          <text x="55" y="122" text-anchor="middle" fill="rgba(167,139,250,.35)" font-size="9" font-family="system-ui">S</text>
          <text x="106" y="69" text-anchor="middle" fill="rgba(167,139,250,.35)" font-size="9" font-family="system-ui">E</text>
          <text x="4" y="69" text-anchor="middle" fill="rgba(167,139,250,.35)" font-size="9" font-family="system-ui">O</text>
          <rect x="52.5" y="38" width="5" height="30" rx="2.5" fill="#555"/>
          <rect x="52.5" y="68" width="5" height="36" rx="2.5" fill="#555"/>
          <rect x="43" y="100" width="24" height="8" rx="4" fill="#444" stroke="#555" stroke-width="1"/>
          <ellipse cx="55" cy="108" rx="16" ry="4.5" fill="#333" stroke="#444" stroke-width="1"/>
          <g style="transform-origin:55px 65px;transform:rotate(${wd}deg)">
            <line x1="55" y1="24" x2="55" y2="64" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" opacity=".75"/>
            <polygon points="55,16 49,28 61,28" fill="#a78bfa" opacity=".95"/>
            <polygon points="55,94 50,84 60,84" fill="rgba(167,139,250,.22)"/>
          </g>
          <circle cx="55" cy="65" r="7.5" fill="#2a2a2a" stroke="#666" stroke-width="1.5"/>
          <circle cx="55" cy="65" r="3.5" fill="#111"/>
          <circle cx="55" cy="65" r="1.5" fill="#999"/>
          <g style="transform-origin:55px 38px;animation:stAnemSpin ${dur}s linear infinite">
            <line x1="55" y1="38" x2="55" y2="18" stroke="#777" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="55" cy="11" r="8" fill="#2a2a2a" stroke="#aaa" stroke-width="1.5"/>
            <circle cx="53" cy="9" r="3" fill="rgba(255,255,255,.22)"/>
            <line x1="55" y1="38" x2="72" y2="48" stroke="#777" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="76" cy="51" r="8" fill="#2a2a2a" stroke="#aaa" stroke-width="1.5"/>
            <circle cx="74" cy="49" r="3" fill="rgba(255,255,255,.22)"/>
            <line x1="55" y1="38" x2="38" y2="48" stroke="#777" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="34" cy="51" r="8" fill="#2a2a2a" stroke="#aaa" stroke-width="1.5"/>
            <circle cx="32" cy="49" r="3" fill="rgba(255,255,255,.22)"/>
            <circle cx="55" cy="38" r="6" fill="#444" stroke="#777" stroke-width="1.5"/>
            <circle cx="55" cy="38" r="3" fill="#222"/>
            <circle cx="55" cy="38" r="1.5" fill="#888"/>
          </g>
          <text x="55" y="127" text-anchor="middle" fill="#fff" font-size="9.5" font-weight="700" font-family="system-ui">${lbl} · ${dlbl}</text>
        </svg>`
      }
      case 'temp':{
        const tv=parseFloat(this._h?.states?.[this._c.sOutdoorTemp]?.state)
        const ok=!isNaN(tv)
        const t=ok?tv:20
        const minT=-10,maxT=45,tubeH=50
        const norm=Math.max(0,Math.min(1,(t-minT)/(maxT-minT)))
        const fh=Math.round(norm*tubeH)
        const fy=12+(tubeH-fh)
        const col=t<0?'#38bdf8':t<10?'#7dd3fc':t<20?'#4ade80':t<30?'#f97316':'#ef4444'
        const ticks=[-10,0,10,20,30,40]
        return `<svg viewBox="0 0 60 120" width="52" height="104" xmlns="http://www.w3.org/2000/svg">
          ${ticks.map(v=>{const n2=(v-minT)/(maxT-minT);const y=12+(1-n2)*tubeH;return `<line x1="24" y1="${y.toFixed(1)}" x2="28" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.3)" stroke-width="1"/>
<text x="22" y="${(y+3).toFixed(1)}" text-anchor="end" fill="rgba(255,255,255,.45)" font-size="6.5" font-family="system-ui">${v}°</text>`}).join('')}
          <rect x="26" y="10" width="11" height="${tubeH+8}" rx="5.5" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.2)" stroke-width="1.5"/>
          ${ok?`<rect x="28.5" y="${fy}" width="6" height="${fh+8}" rx="3" fill="${col}" style="filter:drop-shadow(0 0 4px ${col})"/>`:``}
          <circle cx="31.5" cy="${12+tubeH+11}" r="12.5" fill="${ok?col:'#333'}" stroke="${ok?col:'#444'}" stroke-width="1.5" style="${ok?`filter:drop-shadow(0 0 10px ${col})`:''}"/>
          ${ok?`<circle cx="28.5" cy="${12+tubeH+8}" r="4.5" fill="rgba(255,255,255,.22)"/>`:``}
          <text x="31.5" y="113" text-anchor="middle" fill="#fff" font-size="11" font-weight="800" font-family="system-ui">${ok?`${t.toFixed(1)}°`:'--'}</text>
        </svg>`
      }
      case 'pressure':{
        const pv=parseFloat(this._h?.states?.[this._c.sRelPres]?.state)
        const ok=!isNaN(pv)
        const p=ok?pv:1013
        const minP=950,maxP=1050
        const norm=Math.max(0,Math.min(1,(p-minP)/(maxP-minP)))
        const C=289.03,arc300=240.86
        const active=norm*arc300
        const na=(210+norm*300)*Math.PI/180
        const nx=(60+40*Math.sin(na)).toFixed(1)
        const ny=(72-40*Math.cos(na)).toFixed(1)
        const col=p<990?'#38bdf8':p<1020?'#4ade80':'#f97316'
        const tmarks=[950,975,1000,1013,1025,1050]
        const tickSvg=tmarks.map(pmark=>{
          const n2=(pmark-minP)/(maxP-minP)
          const a=(210+n2*300)*Math.PI/180
          const r1=46,r2=39
          const ox=(60+r1*Math.sin(a)).toFixed(1),oy=(72-r1*Math.cos(a)).toFixed(1)
          const ix=(60+r2*Math.sin(a)).toFixed(1),iy=(72-r2*Math.cos(a)).toFixed(1)
          const maj=[950,1013,1050].includes(pmark)
          return `<line x1="${ox}" y1="${oy}" x2="${ix}" y2="${iy}" stroke="${maj?'rgba(255,255,255,.55)':'rgba(255,255,255,.2)'}" stroke-width="${maj?1.5:1}" stroke-linecap="round"/>`
        }).join('')
        const lblSvg=[[950,'LOW'],[1013,'Norm'],[1050,'HIGH']].map(([pmark,lv])=>{
          const n2=(pmark-minP)/(maxP-minP)
          const a=(210+n2*300)*Math.PI/180
          const lx=(60+28*Math.sin(a)).toFixed(1),ly=(72-28*Math.cos(a)+3).toFixed(1)
          return `<text x="${lx}" y="${ly}" text-anchor="middle" fill="rgba(255,255,255,.35)" font-size="5.5" font-family="system-ui">${lv}</text>`
        }).join('')
        return `<svg viewBox="0 0 120 90" width="120" height="90" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="72" r="46" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="9"
            stroke-dasharray="${arc300} ${C-arc300}" stroke-linecap="round" transform="rotate(120 60 72)"/>
          ${ok?`<circle cx="60" cy="72" r="46" fill="none" stroke="${col}" stroke-width="9"
            stroke-dasharray="${active} ${C-active}" stroke-linecap="round"
            transform="rotate(120 60 72)" opacity=".7"/>`:''}
          ${tickSvg}${lblSvg}
          <line x1="60" y1="72" x2="${nx}" y2="${ny}" stroke="${ok?'#fbbf24':'rgba(255,255,255,.2)'}" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="60" cy="72" r="6.5" fill="#1a1a2e" stroke="#555" stroke-width="1.5"/>
          <circle cx="60" cy="72" r="3" fill="${ok?'#fbbf24':'#444'}"/>
          <text x="60" y="60" text-anchor="middle" fill="#fff" font-size="12" font-weight="800" font-family="system-ui">${ok?`${p.toFixed(0)}`:'--'}</text>
          <text x="60" y="70" text-anchor="middle" fill="rgba(255,255,255,.5)" font-size="7" font-family="system-ui">hPa</text>
        </svg>`
      }
      case 'humidity':{
        const hv=parseFloat(this._h?.states?.[this._c.sHumidity]?.state)
        const ok=!isNaN(hv)
        const hum=ok?hv:50
        const bcnt=Math.max(3,Math.round(hum/100*9)+2)
        const bubbles=Array.from({length:bcnt},(_,i)=>{
          const size=8+((i*19+11)%100)/100*22
          const left=((i*41+9)%80)+5
          const bc=hum>70?'#34d399':hum>40?'#6ee7b7':'#a7f3d0'
          const dur=(1.0+((i*29+7)%100)/100*1.8).toFixed(2)
          const del=(-(i*0.28)).toFixed(2)
          const op=(0.1+((i*17+9)%100)/100*0.18).toFixed(2)
          return `<div class="st-bubble" style="width:${size}px;height:${size}px;left:${left}%;background:${bc};opacity:${op};animation-duration:${dur}s;animation-delay:${del}s;"></div>`
        }).join('')
        return `${bubbles}<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;">
          <span style="font-size:34px;filter:drop-shadow(0 0 10px #34d399)">💧</span>
          <span style="font-size:15px;font-weight:800;color:#34d399;">${ok?`${hum.toFixed(0)}%`:'--'}</span>
        </div>`
      }
      case 'solar':{
        const uv=parseFloat(this._h?.states?.[this._c.sUvIndex]?.state)
        const sr=parseFloat(this._h?.states?.[this._c.sSolarRad]?.state)||0
        const ok=!isNaN(uv)
        const inten=Math.min(1,sr/900)
        const iR=13
        const uvCol=!ok||uv<3?'#4ade80':uv<6?'#fbbf24':uv<8?'#f97316':'#ef4444'
        const rays=Array.from({length:12},(_,i)=>{
          const a=(i*30)*Math.PI/180
          const r1=iR+4,r2=iR+4+(i%2?5:8)+inten*10
          return `<line x1="${(40+r1*Math.cos(a)).toFixed(1)}" y1="${(40+r1*Math.sin(a)).toFixed(1)}" x2="${(40+r2*Math.cos(a)).toFixed(1)}" y2="${(40+r2*Math.sin(a)).toFixed(1)}" stroke="#fbbf24" stroke-width="${i%2?1.5:2.2}" stroke-linecap="round" opacity="${(0.35+inten*0.65).toFixed(2)}"/>`
        }).join('')
        return `<svg viewBox="0 0 80 95" width="80" height="95" xmlns="http://www.w3.org/2000/svg">
          <defs><radialGradient id="sgr${cat.key}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fffbeb"/><stop offset="45%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f97316"/></radialGradient></defs>
          <circle cx="40" cy="40" r="${iR+18+inten*12}" fill="none" stroke="rgba(251,191,36,.05)" stroke-width="${5+inten*9}"/>
          <g class="st-sun-rays">${rays}</g>
          <circle cx="40" cy="40" r="${iR}" fill="url(#sgr${cat.key})" style="filter:drop-shadow(0 0 ${(5+inten*14).toFixed(0)}px #fbbf24)"/>
          <rect x="12" y="66" width="56" height="24" rx="9" fill="rgba(0,0,0,.35)"/>
          <text x="40" y="75" text-anchor="middle" fill="rgba(255,255,255,.55)" font-size="7" font-family="system-ui">UV Index</text>
          <text x="40" y="87" text-anchor="middle" fill="${uvCol}" font-size="13" font-weight="800" font-family="system-ui">${ok?uv.toFixed(0):'--'}</text>
        </svg>`
      }
      case 'pwinfo':{
        const summ=this._h?.states?.[this._c.sPwSummary0d]?.state||this._h?.states?.[this._c.sPwSummary]?.state||''
        const cond=summ.toLowerCase()
        const ico=cond.includes('pioggi')||cond.includes('precipit')?'🌧️':cond.includes('sereno')||cond.includes('sole')?'☀️':cond.includes('nuvolos')||cond.includes('nuvole')?'☁️':cond.includes('temp')||cond.includes('fulmin')?'⛈️':cond.includes('neve')?'❄️':cond.includes('nebbia')?'🌫️':'🌐'
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:4px;">
          <span style="font-size:42px;filter:drop-shadow(0 0 12px #c084fc);animation:stAlert 3s ease-in-out infinite;">${ico}</span>
          <span style="font-size:9px;font-weight:800;color:#c084fc;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">Pirate Weather</span>
        </div>`
      }
      default: return `<span style="font-size:44px;filter:drop-shadow(0 0 12px currentColor)">${cat.icon}</span>`
    }
  }
}

if(!customElements.get('meteo-card')) customElements.define('meteo-card',MeteoCard)

setTimeout(function(){
  try{
    window.customCards=window.customCards||[]
    window.customCards=window.customCards.filter(function(c){return c&&c.type!=='meteo-card'})
    window.customCards.push({type:'meteo-card',name:'Meteo + Previsioni',description:'Card meteo con cielo animato, sole/luna in tempo reale, fasi lunari, pioggia, neve, fulmini.',preview:false})
  }catch(e){}
},0)
