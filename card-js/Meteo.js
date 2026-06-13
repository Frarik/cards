/* frarik-version: 1.20 */

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
.tic{font-size:64px;line-height:1;filter:drop-shadow(0 2px 12px rgba(0,0,0,.3));}
.ts{display:flex;flex-direction:column;}
.tn{font-size:70px;font-weight:900;line-height:1;letter-spacing:-4px;display:flex;align-items:flex-start;text-shadow:0 2px 24px rgba(0,0,0,.4);}
.tdeg{font-size:34px;font-weight:600;margin-top:10px;letter-spacing:0;}
.tl{font-size:12px;color:#fff;margin-top:5px;font-weight:500;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:10px 0 10px;}
.stl{border-radius:12px;padding:10px 7px 9px;display:flex;flex-direction:column;align-items:center;gap:4px;backdrop-filter:blur(6px);}
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
.fi{font-size:28px;line-height:1;margin:3px 0 2px;}
.fm{font-size:18px;font-weight:800;letter-spacing:-.5px;line-height:1;color:#fff;}
.fb{width:75%;height:3px;border-radius:99px;margin:2px 0 2px;}
.fmi{font-size:11px;color:#fff;font-weight:600;}
.fr{font-size:8px;color:#fff;margin-top:1px;}
/* settings */
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
.inp-grp{position:relative;}
.sft{padding:12px 16px;border-top:1px solid rgba(255,255,255,.08);flex-shrink:0;}
.sav{width:100%;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;}
.sav:hover{opacity:.88;}
.ph{padding:32px 20px;text-align:center;color:rgba(255,255,255,.35);font-size:12px;display:flex;flex-direction:column;align-items:center;gap:10px;}
.phi{font-size:38px;opacity:.3;}
`

// ── MeteoCard ─────────────────────────────────────────────────────────────────
class MeteoCard extends HTMLElement {
  static getStubConfig(){ return { entityId:'weather.forecast_home', cityName:'' } }

  constructor(){
    super()
    this.attachShadow({mode:'open'})
    this._h   = null
    this._c   = { entityId:'',cityName:'',humEntity:'',presEntity:'',windEntity:'',windDirEntity:'',wfDays:5 }
    this._fc  = []
    this._fch = []
    this._fcs = null
    this._fo  = false
    this._so  = false
    this._se  = false
    this._te  = ''; this._tc = ''; this._th = ''; this._tp = ''; this._tw = ''; this._twd = ''; this._tdays = 5
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
    this._click = this._onClick.bind(this)
    this._inp   = this._onInput.bind(this)
    this._focus = this._onFocus.bind(this)
  }

  // ── localStorage ─────────────────────────────────────────────────────────
  _lsKey(){ return 'meteocard:'+this._sk }
  _loadStore(){ try{ return JSON.parse(localStorage.getItem(this._lsKey())||'null') }catch{ return null } }
  _saveStore(){
    try{
      localStorage.setItem(this._lsKey(), JSON.stringify({
        entityId:this._c.entityId, cityName:this._c.cityName,
        humEntity:this._c.humEntity||'', presEntity:this._c.presEntity||'',
        windEntity:this._c.windEntity||'', windDirEntity:this._c.windDirEntity||'',
        wfDays:this._c.wfDays||5,
      }))
    }catch{}
  }

  setConfig(cfg){
    cfg=cfg||{}
    this._sk=cfg.storageKey||cfg.entityId||'default'
    const stored=this._loadStore()||{}
    const prev=this._c?.entityId
    this._c={
      entityId:     stored.entityId     ||cfg.entityId     ||'',
      cityName:     stored.cityName     !=null?stored.cityName    :(cfg.cityName    ||''),
      humEntity:    stored.humEntity    ||cfg.humEntity    ||'',
      presEntity:   stored.presEntity   ||cfg.presEntity   ||'',
      windEntity:   stored.windEntity   ||cfg.windEntity   ||'',
      windDirEntity:stored.windDirEntity||cfg.windDirEntity||'',
      wfDays:       stored.wfDays       ||cfg.wfDays       ||5,
    }
    this._te=this._c.entityId; this._tc=this._c.cityName
    this._th=this._c.humEntity; this._tp=this._c.presEntity
    this._tw=this._c.windEntity; this._twd=this._c.windDirEntity
    this._tdays=this._c.wfDays
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
    this._destroyModal(); this._destroyDayModal()
    this._unsub(); this._unsubHourly()
    if(this._skyTimer){ clearInterval(this._skyTimer); this._skyTimer=null }
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
    const label=this._selDay===0?'Oggi':`${_DI[d.getDay()]} ${d.getDate()} ${_MI[d.getMonth()]}`
    const _dKey=dt=>{ const x=new Date(dt); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}` }
    const dayKey=_dKey(day.datetime)
    const hourly=this._fch.filter(h=>h.datetime&&_dKey(h.datetime)===dayKey)
    const fmtTime=dt=>{ try{ return new Date(dt).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}) }catch{ return dt.split('T')[1]?.slice(0,5)||'--' } }
    const rowsHTML=hourly.length
      ?hourly.map(h=>{
          const time=fmtTime(h.datetime),ico=_WI[h.condition]||'🌡️',temp=_n(h.temperature)
          const rn=h.precipitation!=null?h.precipitation.toFixed(1)+'mm':'—'
          const rp=h.precipitation_probability!=null?h.precipitation_probability+'%':''
          const ws=h.wind_speed!=null?Math.round(h.wind_speed)+'k/h':'—'
          const wd=_windDir(h.wind_bearing)
          return `<div class="hr-row"><div class="hr-t">${time}</div><div class="hr-i">${ico}</div><div class="hr-tp">${temp}°</div><div class="hr-r">${rn}${rp?' · '+rp:''}</div><div class="hr-w">${ws} ${wd}</div></div>`
        }).join('')
      :`<div class="hr-load">Previsioni orarie in caricamento…</div>`
    const dmCSS=`.dov{position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);font-family:var(--primary-font-family,system-ui,sans-serif);}.dov-modal{width:100%;max-height:85vh;display:flex;flex-direction:column;background:#0a0816;border:1px solid rgba(56,189,248,.25);border-bottom:none;border-radius:20px 20px 0 0;box-shadow:0 -12px 60px rgba(0,0,0,.7);animation:slideUp .22s cubic-bezier(.32,1.12,.56,1);}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}.hr-list{flex:1;overflow-y:auto;padding:6px 0 env(safe-area-inset-bottom,8px);}.hr-row{display:grid;grid-template-columns:46px 30px 46px 1fr auto;align-items:center;gap:8px;padding:10px 20px;border-bottom:1px solid rgba(255,255,255,.05);color:#e2e8f0;}.hr-row:last-child{border-bottom:none;}.hr-t{font-size:13px;font-weight:700;color:#94a3b8;}.hr-i{font-size:22px;text-align:center;}.hr-tp{font-size:15px;font-weight:800;letter-spacing:-.3px;}.hr-r{font-size:11px;color:#60a5fa;}.hr-w{font-size:11px;color:#94a3b8;text-align:right;white-space:nowrap;}.hr-load{padding:40px;text-align:center;color:rgba(255,255,255,.3);font-size:12px;}`
    this._dayModalHost.shadowRoot.innerHTML=`<style>${_CSS}${dmCSS}</style>
<div class="dov"><div class="dov-modal">
  <div class="shdr" style="border-radius:20px 20px 0 0;">
    <div class="sico" style="font-size:18px;background:rgba(56,189,248,.12);border-color:rgba(56,189,248,.25);color:#38bdf8;">📅</div>
    <div><div class="stit">${label}</div><div class="ssub">Previsioni ora per ora</div></div>
    <button class="scls" data-a="closedm">${_IC.x}</button>
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
    if(e.target.classList?.contains('sov')){ this._closeSettings(); return }
    if(e.target.classList?.contains('dov')){ this._destroyDayModal(); return }
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
        if(sf==='hum') this._th=sid
        else if(sf==='pres') this._tp=sid
        else if(sf==='wind') this._tw=sid
        else if(sf==='wdir') this._twd=sid
        const sr2=this._modalHost?.shadowRoot
        if(sr2){
          const inp=sr2.querySelector(`input[data-f="${sf}"]`); if(inp) inp.value=sid
          const drop=sr2.querySelector(`[data-dropdown="${sf}"]`); if(drop) drop.classList.remove('open')
        }
        break
      }
      case 'save':
        this._c={ entityId:this._te,cityName:this._tc,
                  humEntity:this._th,presEntity:this._tp,
                  windEntity:this._tw,windDirEntity:this._twd,
                  wfDays:Math.min(10,Math.max(1,parseInt(this._tdays)||5)) }
        this._saveStore()
        this._fc=[]; this._getForecast()
        this._fch=[]; this._unsubHourly()
        this._closeSettings()
        this.dispatchEvent(new CustomEvent('config-changed',{
          detail:{config:{entityId:this._c.entityId,cityName:this._c.cityName,
            humEntity:this._c.humEntity,presEntity:this._c.presEntity,
            windEntity:this._c.windEntity,windDirEntity:this._c.windDirEntity,
            wfDays:this._c.wfDays}},bubbles:true,composed:true}))
        break
      case 'day':    this._openDayDetail(parseInt(t.dataset.idx||'0')); break
      case 'closedm':this._destroyDayModal(); break
    }
  }

  _onInput(e){
    const f=e.target.dataset.f,v=e.target.value
    if     (f==='city') this._tc=v
    else if(f==='hum') { this._th=v; this._updateDropdown('hum') }
    else if(f==='pres'){ this._tp=v; this._updateDropdown('pres') }
    else if(f==='wind'){ this._tw=v; this._updateDropdown('wind') }
    else if(f==='wdir'){ this._twd=v; this._updateDropdown('wdir') }
    else if(f==='days') this._tdays=parseInt(v)||5
  }

  _onFocus(e){
    const f=e.target?.dataset?.f
    const sr=this._modalHost?.shadowRoot; if(!sr) return
    if(['hum','pres','wind','wdir'].includes(f)){
      sr.querySelectorAll('.esr[data-dropdown]').forEach(d=>{ if(d.dataset.dropdown!==f) d.classList.remove('open') })
      this._updateDropdown(f)
    } else {
      sr.querySelectorAll('.esr[data-dropdown]').forEach(d=>d.classList.remove('open'))
    }
  }

  _updateDropdown(field){
    const sr=this._modalHost?.shadowRoot; if(!sr) return
    const dropdown=sr.querySelector(`[data-dropdown="${field}"]`); if(!dropdown) return
    const val={hum:this._th,pres:this._tp,wind:this._tw,wdir:this._twd}[field]||''
    const filter=val.toLowerCase()
    const allIds=Object.keys(this._h?.states||{})
    const filtered=filter
      ?allIds.filter(id=>id.toLowerCase().includes(filter)||(this._h.states[id]?.attributes?.friendly_name||'').toLowerCase().includes(filter))
      :allIds
    const listEl=dropdown.querySelector('.el'); if(!listEl) return
    listEl.innerHTML=filtered.length
      ?filtered.slice(0,80).map(id=>{
          const nm=this._h.states[id]?.attributes?.friendly_name||id
          return `<div class="eo${id===val?' sel':''}" data-a="sel-sensor" data-f="${field}" data-id="${id}">${nm}<span style="font-size:9px;color:#374151;margin-left:6px;">${id}</span></div>`
        }).join('')
      :'<div style="padding:8px 12px;font-size:11px;color:#64748b;">Nessuna entità trovata</div>'
    dropdown.classList.add('open')
  }

  configure(){ this._openSettings() }

  // ── Settings modal ────────────────────────────────────────────────────────
  _openSettings(){
    this._so=true; this._se=false
    this._te=this._c.entityId; this._tc=this._c.cityName
    this._th=this._c.humEntity; this._tp=this._c.presEntity
    this._tw=this._c.windEntity; this._twd=this._c.windDirEntity
    this._tdays=this._c.wfDays||5
    this._renderModal(); this._bk=null; this._build()
  }

  _closeSettings(){
    this._so=false; this._te=this._c.entityId; this._tc=this._c.cityName
    this._destroyModal(); this._bk=null; this._build()
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
    const ico=_WI[cond]||'🌡️'
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
        const fi=_WI[f.condition]||'🌡️'
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

    this.shadowRoot.innerHTML=`<style>${_CSS}</style>
<div class="card" style="border:1px solid ${border};">
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
    <div class="stats">
      <div class="stl" style="background:${tb};border:1px solid ${tbr};">
        <div class="sic">${_IC.hu}</div>
        <div class="sv">${hum}</div><div class="sl">Umidità</div>
      </div>
      <div class="stl" style="background:${tb};border:1px solid ${tbr};">
        <div class="sic">${_IC.pr}</div>
        <div class="sv">${pres}</div><div class="sl">Pressione</div>
      </div>
      <div class="stl" style="background:${tb};border:1px solid ${tbr};">
        <div class="sic">${_IC.wi}</div>
        <div class="sv">${wsp}</div><div class="sl">Vento</div>
      </div>
      <div class="stl" style="background:${tb};border:1px solid ${tbr};">
        <div class="sic">${_IC.co}</div>
        <div class="sv">${wdir}</div><div class="sl">Direzione</div>
      </div>
    </div>
    <div class="fct" data-a="fc">
      <span>Prossimi giorni — Tocca per i dettagli</span>
      <span>${this._fo?_IC.cd:_IC.cr}</span>
    </div>
    <div class="fcg ${this._fo?'open':''}">${fcH}</div>
  </div>
</div>`
  }

  _sovHTML(){
    const eid=this._te||this._c.entityId||''
    const ent=this._h?.states?.[eid]
    const enm=ent?.attributes?.friendly_name||eid||'—'
    const city=this._tc
    const wents=Object.keys(this._h?.states||{}).filter(k=>k.startsWith('weather.'))
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
        <div class="ei"><div class="en">${enm}</div><div class="eid">${eid}</div></div>
        <button class="cbtn" data-a="srch">Cambia</button>
      </div>
      <div class="esr ${this._se?'open':''}">
        <div class="el">
          ${wents.length
            ?wents.map(id=>`<div class="eo ${id===eid?'sel':''}" data-a="sel" data-id="${id}">${this._h.states[id]?.attributes?.friendly_name||id}<span style="font-size:9px;color:#374151;margin-left:4px;">${id}</span></div>`).join('')
            :'<div style="padding:8px 12px;font-size:11px;color:#64748b;">Nessuna entità weather.* trovata</div>'}
        </div>
      </div>
      <div class="fl" style="margin-top:14px;">Nome città</div>
      <input class="ci" type="text" value="${city}" placeholder="Es: Selargius" data-f="city"/>
      <div class="ht">Se vuoto usa il nome dell'entità HA</div>

      <div class="fl" style="margin-top:16px;">Umidità — entità sensor (opzionale)</div>
      <div class="inp-grp">
        <input class="ci" type="text" value="${this._th}" placeholder="Es: sensor.umidita_esterna" data-f="hum" autocomplete="off"/>
        <div class="esr" data-dropdown="hum"><div class="el"></div></div>
      </div>
      <div class="ht">Lascia vuoto per usare l'attributo humidity dell'entità meteo</div>

      <div class="fl" style="margin-top:10px;">Pressione — entità sensor (opzionale)</div>
      <div class="inp-grp">
        <input class="ci" type="text" value="${this._tp}" placeholder="Es: sensor.pressione_barometrica" data-f="pres" autocomplete="off"/>
        <div class="esr" data-dropdown="pres"><div class="el"></div></div>
      </div>
      <div class="ht">Lascia vuoto per usare l'attributo pressure dell'entità meteo</div>

      <div class="fl" style="margin-top:10px;">Velocità vento — entità sensor (opzionale)</div>
      <div class="inp-grp">
        <input class="ci" type="text" value="${this._tw}" placeholder="Es: sensor.vento_velocita" data-f="wind" autocomplete="off"/>
        <div class="esr" data-dropdown="wind"><div class="el"></div></div>
      </div>
      <div class="ht">Lascia vuoto per usare l'attributo wind_speed dell'entità meteo</div>

      <div class="fl" style="margin-top:10px;">Direzione vento — entità sensor (opzionale)</div>
      <div class="inp-grp">
        <input class="ci" type="text" value="${this._twd}" placeholder="Es: sensor.vento_direzione" data-f="wdir" autocomplete="off"/>
        <div class="esr" data-dropdown="wdir"><div class="el"></div></div>
      </div>
      <div class="ht">Lascia vuoto per usare l'attributo wind_bearing dell'entità meteo</div>

      <div class="fl" style="margin-top:16px;">Giorni previsioni (1–10)</div>
      <input class="ci" type="number" min="1" max="10" value="${this._tdays}" data-f="days"/>
      <div class="ht">Quanti giorni mostrare nel pannello previsioni</div>
    </div>
    <div class="sft"><button class="sav" data-a="save">${_IC.ok} Salva</button></div>
  </div>
</div>`
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
