// ── Dipendenze npm ───────────────────────────────────────────────────────────
import './style.css';
import Chart  from 'chart.js/auto';
import jsyaml from 'js-yaml';
import { uid, eh, ea, _lightenHex, showToast, showConfirm } from './utils.js';
import { _ntfPushLog, _ntfDismissById, _ntfUpdateBell, ntfMarkAllRead, ntfClearAll,
         renderNotifCenter, toggleNotifCenter, closeNotifCenter } from './notifications.js';
window.Chart  = Chart;
window.jsyaml = jsyaml;

// ── License key check ────────────────────────────────────────────────────────
const LICENSE_API = 'https://frarik-license.frarik.workers.dev/api/validate';
const LIC_KEY     = 'frarik_license';
const LIC_TS_KEY  = 'frarik_license_ts';
const LIC_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24h

(function _initLicenseCheck(){
  const overlay = document.getElementById('lic-overlay');
  const input   = document.getElementById('lic-input');
  const btn     = document.getElementById('lic-btn');
  const err     = document.getElementById('lic-err');
  if(!overlay) return;

  function showOverlay(){ overlay.style.cssText+=';display:flex!important'; if(input) setTimeout(()=>input.focus(),50); }
  function hideOverlay(){ overlay.style.display='none'; }

  async function validate(key){
    err.style.display='none';
    btn.textContent='Verifica…'; btn.disabled=true;
    try{
      const r = await fetch(LICENSE_API, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({key: key.toUpperCase().trim()})
      });
      const d = await r.json();
      if(d.valid){
        localStorage.setItem(LIC_KEY, key.toUpperCase().trim());
        localStorage.setItem(LIC_TS_KEY, Date.now().toString());
        localStorage.setItem('frarik_lic_name', d.name||'');
        localStorage.setItem('frarik_lic_note', d.note||'');
        localStorage.setItem('frarik_lic_expires', d.expires||'');
        hideOverlay();
      } else {
        err.textContent = d.error || 'Chiave non valida.';
        err.style.display = 'block';
      }
    } catch(e){
      err.textContent = 'Errore di connessione. Riprova.';
      err.style.display = 'block';
    }
    btn.textContent='Attiva'; btn.disabled=false;
  }

  btn.addEventListener('click', ()=> validate(input.value));
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') validate(input.value); });
  input.addEventListener('input', ()=>{ input.value=input.value.toUpperCase().replace(/[^A-Z0-9-]/g,''); });

  // Controlla chiave salvata
  const saved  = localStorage.getItem(LIC_KEY);
  const savedTs= parseInt(localStorage.getItem(LIC_TS_KEY)||'0');
  const needsCheck = !savedTs || (Date.now()-savedTs > LIC_CHECK_INTERVAL);

  if(!saved){
    showOverlay();
  } else if(needsCheck){
    // Ri-valida silenziosamente, se fallisce mostra overlay
    fetch(LICENSE_API, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key: saved})})
      .then(r=>r.json())
      .then(d=>{
        if(d.valid){
          localStorage.setItem(LIC_TS_KEY, Date.now().toString());
          localStorage.setItem('frarik_lic_name', d.name||'');
          localStorage.setItem('frarik_lic_note', d.note||'');
          localStorage.setItem('frarik_lic_expires', d.expires||'');
        } else {
          localStorage.removeItem(LIC_KEY);
          localStorage.removeItem(LIC_TS_KEY);
          showOverlay();
        }
      })
      .catch(()=>{ /* se offline, lascia passare */ });
  }
  // Se salvata e non scaduta il controllo non blocca l'avvio
})();

// ── Nasconde la barra HA ingress (ha-panel-app) ──────────────────────────────
(function(){
  if(window.parent===window) return;

  function shadowQuery(root, sel){
    try{
      const d=root.querySelector(sel); if(d) return d;
      for(const el of root.querySelectorAll('*')){
        if(el.shadowRoot){ const f=shadowQuery(el.shadowRoot,sel); if(f) return f; }
      }
    }catch(e){}
    return null;
  }

  function hideInShadow(sr){
    if(!sr) return false;
    // Inietta CSS nella shadow root (penetra l'encapsulation)
    try{
      const sheet=new window.parent.CSSStyleSheet();
      sheet.replaceSync(`
        app-header,app-toolbar,ha-top-app-bar-fixed,
        [slot="header"],.header,header{display:none!important;height:0!important}
        app-header-layout,app-drawer-layout,:host{padding-top:0!important;--header-height:0px}
        iframe{top:0!important;height:100%!important}
      `);
      sr.adoptedStyleSheets=[...sr.adoptedStyleSheets, sheet];
    }catch(e){}
    // Rimozione diretta come backup
    for(const s of ['app-header','ha-top-app-bar-fixed','[slot="header"]','header']){
      const el=sr.querySelector(s); if(el){ el.remove(); break; }
    }
    return true;
  }

  function tryHide(){
    try{
      const pd=window.parent.document;
      // HA 2024+: ha-panel-app è il wrapper ingress
      // HA precedente: hassio-addon-ingress-view o ha-panel-hassio
      for(const tag of ['ha-panel-app','hassio-addon-ingress-view','hassio-ingress-view','ha-panel-hassio']){
        const el=shadowQuery(pd, tag);
        if(el?.shadowRoot){ hideInShadow(el.shadowRoot); return true; }
      }
      return false;
    }catch(e){ return false; }
  }

  let done=false;
  [0,50,150,400,900,2000].forEach(d=>setTimeout(()=>{ if(!done) done=tryHide(); },d));
})();

// ── Splash screen (ex script inline in index.html) ────────────────────────
(function(){
  const s = document.getElementById('frk-splash'); if(!s) return;
  setTimeout(function(){
    s.classList.add('hide');
    setTimeout(function(){ if(s && s.parentNode) s.parentNode.removeChild(s); }, 650);
  }, 3500);
})();

/* Frarik Dashboard — add-on per Home Assistant
   Sorgente: frarik-addon/src/main.js */

/* ═══════════════════════════════════════════════════════════════════════════
   ⚙️  PROFILI MULTI-UTENTE — rilevamento automatico in base all'URL
   Ogni utente usa il proprio Nabu Casa → il profilo giusto viene scelto in automatico.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  var PROFILES = {
    // ── Profilo 1 (utente originale) ──
    'cvkvlnpaokb2r0pedlqjlq06f5zsd3fl.ui.nabu.casa': {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjOTg4OGRlYmJmNmQ0NjNiODdkNDg1OTlmZjc1ZTRjZiIsImlhdCI6MTc4MDQ0MzQ4MCwiZXhwIjoyMDk1ODAzNDgwfQ.hyz6GFhQvycih8cn2oG7djSwXWMAg6Vthd_VyX8KPcY',
      remoteUrl: 'https://cvkvlnpaokb2r0pedlqjlq06f5zsd3fl.ui.nabu.casa',
      localFallback: '192.168.1.189:8123'
    },
    // ── Profilo 2 (secondo utente) ──
    'mzlej5bjgutlujw3go5vsanafnf1bom1.ui.nabu.casa': {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwYWU3ZTgxMWI5YWQ0Y2I0YmI4ZDViNGFkMzM4YWI2OSIsImlhdCI6MTc4MDQ0MDMwNiwiZXhwIjoyMDk1ODAwMzA2fQ.MtPfpfm2_Vo1rBinnvnN-g-pkbZRc1-qrmsSU-2W6KI',
      remoteUrl: 'https://mzlej5bjgutlujw3go5vsanafnf1bom1.ui.nabu.casa',
      localFallback: '192.168.1.64:8123'
    }
  };
  var host = location.hostname;
  var key = Object.keys(PROFILES).find(function(k){ return host.indexOf(k) !== -1; });
  window.FRARIK_CFG = key ? PROFILES[key] : PROFILES['cvkvlnpaokb2r0pedlqjlq06f5zsd3fl.ui.nabu.casa'];
})();
/* ── Redirect automatico se aperto come file locale ── */
if(location.protocol==='file:'){
  location.replace(window.FRARIK_CFG.remoteUrl.replace(/\/$/,'') + '/local/frarik.html');
}

/* ═══════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════ */
/* Token e host sono variabili: vengono aggiornati al login */
/* Token e indirizzi presi dal blocco IMPOSTAZIONI PERSONALI in cima al file (window.FRARIK_CFG) */
const TOKEN_DEFAULT = (window.FRARIK_CFG&&window.FRARIK_CFG.token) || '';
const REMOTE_URL_DEFAULT = (window.FRARIK_CFG&&window.FRARIK_CFG.remoteUrl) || '';
const LOCAL_FALLBACK = (window.FRARIK_CFG&&window.FRARIK_CFG.localFallback) || '192.168.1.189:8123';
let TOKEN   = localStorage.getItem('hadb_token') || TOKEN_DEFAULT;
let HA_HOST, BASE;
/* ACCESSO LOCALE + REMOTO:
   la pagina è servita da Home Assistant (/local/...), quindi ci si connette alla STESSA origine
   da cui viene aperta. Così:
     • apri http://192.168.1.189:8123/local/...  → si connette in LOCALE
     • apri https://tuo-dominio/local/...        → si connette da REMOTO
   automaticamente, senza configurare nulla. Un URL fisso salvato si usa SOLO se la pagina è aperta
   come file locale (file://) dove non c'è un'origine HA valida. */
(function(){
  const isHttp = (location.protocol==='http:'||location.protocol==='https:') && location.host;
  const saved = localStorage.getItem('hadb_haurl');
  if(isHttp){
    HA_HOST = location.host;     // es. 192.168.1.189:8123  oppure  tuo-dominio.ui.nabu.casa
    BASE    = location.origin;   // protocollo+host (http/https coerente)
  } else if(saved){
    try{ const u=new URL(saved.startsWith('http')?saved:'https://'+saved); HA_HOST=u.host; BASE=u.origin; }
    catch(e){ HA_HOST=saved.replace(/^https?:\/\//,''); BASE='https://'+HA_HOST; }
  } else {
    HA_HOST=LOCAL_FALLBACK; BASE='http://'+HA_HOST;
  }
})();

/* ═══ COLORS ═══ */
const COLORS = [
  '#f59e0b','#fb923c','#f87171','#4ade80','#22d3ee',
  '#60a5fa','#818cf8','#a78bfa','#c084fc','#f472b6',
  '#facc15','#2dd4bf','#34d399','#38bdf8','#fb7185','#e2e8f0'
];

/* ═══ WEATHER ICONS ═══ */
const WI = {
  sunny:'☀️','clear-night':'🌙',cloudy:'☁️',partlycloudy:'⛅',fog:'🌫️',
  rainy:'🌧️',pouring:'⛈️',lightning:'⚡','lightning-rainy':'🌩️',
  snowy:'❄️','snowy-rainy':'🌨️',windy:'💨','windy-variant':'🌬️',
  hail:'🌨️',exceptional:'⚠️'
};
// MDI icons per weather-compact
const WI_MDI={
  sunny:'mdi:weather-sunny',
  'clear-night':'mdi:weather-night',
  cloudy:'mdi:weather-cloudy',
  partlycloudy:'mdi:weather-partly-cloudy',
  'partlycloudy-night':'mdi:weather-night-partly-cloudy',
  fog:'mdi:weather-fog',
  rainy:'mdi:weather-rainy',
  pouring:'mdi:weather-pouring',
  lightning:'mdi:weather-lightning',
  'lightning-rainy':'mdi:weather-lightning-rainy',
  snowy:'mdi:weather-snowy',
  'snowy-rainy':'mdi:weather-snowy-rainy',
  windy:'mdi:weather-windy',
  'windy-variant':'mdi:weather-windy-variant',
  hail:'mdi:weather-hail',
  exceptional:'mdi:alert-circle-outline',
};

/* ═══ DEFAULT CONFIG ═══ */
const DEF = {
  columns:4, rowH:150,
  cards:[
    {id:uid(),entity:'sensor.inverter_r5s1152j2118e25819_power',label:'Fotovoltaico',icon:'☀️',unit:'W',type:'big',color:'#fbbf24',colSpan:1,rowSpan:1,max:3000,min:0,sub:'Produzione solare',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'sensor.consumo_solo_positivo',label:'Carico Casa',icon:'🏠',unit:'W',type:'big',color:'#818cf8',colSpan:1,rowSpan:1,max:6000,min:0,sub:'Consumo attuale',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'sensor.fascia_energetica_attuale',label:'Fascia',icon:'⚡',unit:'',type:'text',color:'#fbbf24',colSpan:1,rowSpan:1,max:0,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'sensor.costo_consumo_mensile_casa',label:'Bolletta',icon:'💰',unit:'€',type:'compact',color:'#4ade80',colSpan:1,rowSpan:1,max:300,min:0,sub:'Mese corrente',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    // Flow bars card
    {id:uid(),entity:'sensor.inverter_r5s1152j2118e25819_power',label:'Flusso Energia',icon:'⚡',unit:'W',type:'flowbars',color:'#fbbf24',colSpan:2,rowSpan:2,max:6000,min:0,sub:'',hours:24,
     solar:'sensor.inverter_r5s1152j2118e25819_power',
     load:'sensor.consumo_solo_positivo',
     grid:'sensor.inverter_r5s1152j2118e25819_grid_power',
     battery:'',entity2:'',entity3:'',refresh:5},
    {id:uid(),entity:'sensor.consumo_solo_positivo',label:'Carico Indicatore',icon:'🏠',unit:'W',type:'gauge',color:'#818cf8',colSpan:1,rowSpan:2,max:6000,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'sensor.fordpass_wf02xxerk1sb53885_soc',label:'Ford EV',icon:'🚗',unit:'%',type:'gauge',color:'#4ade80',colSpan:1,rowSpan:2,max:100,min:0,sub:'Batteria',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    // History chart
    {id:uid(),entity:'sensor.inverter_r5s1152j2118e25819_power',label:'FV Storico',icon:'📈',unit:'W',type:'history',color:'#fbbf24',colSpan:2,rowSpan:2,max:3000,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    // Camera
    {id:uid(),entity:'camera.telecamera_interna_scorrevole',label:'Camera Interna',icon:'📷',unit:'',type:'camera',color:'#818cf8',colSpan:1,rowSpan:2,max:0,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    // Weather
    {id:uid(),entity:'weather.home',label:'Meteo',icon:'🌤️',unit:'',type:'weather',color:'#22d3ee',colSpan:1,rowSpan:1,max:0,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    // Energy today
    {id:uid(),entity:'sensor.energia_oggi_consumo',label:'Oggi',icon:'📅',unit:'kWh',type:'compact',color:'#c084fc',colSpan:1,rowSpan:1,max:30,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'sensor.energia_mese_consumo',label:'Questo Mese',icon:'📆',unit:'kWh',type:'compact',color:'#c084fc',colSpan:1,rowSpan:1,max:500,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'sensor.costo_consumo_giornaliero_casa',label:'Spesa Oggi',icon:'💳',unit:'€',type:'compact',color:'#4ade80',colSpan:1,rowSpan:1,max:15,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'sensor.costo_consumo_annuale_casa',label:'Spesa Anno',icon:'📈',unit:'€',type:'compact',color:'#4ade80',colSpan:1,rowSpan:1,max:2000,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    // Appliances
    {id:uid(),entity:'sensor.0xbc026efffee1d33b_power',label:'Frigorifero',icon:'❄️',unit:'W',type:'compact',color:'#22d3ee',colSpan:1,rowSpan:1,max:200,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'sensor.scaldabagno_mss310_power_w_main_channel',label:'Scaldabagno',icon:'🚿',unit:'W',type:'compact',color:'#fb923c',colSpan:1,rowSpan:1,max:2500,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'sensor.lavatrice_consumo_di_corrente',label:'Lavatrice',icon:'👕',unit:'W',type:'compact',color:'#818cf8',colSpan:1,rowSpan:1,max:2200,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
    {id:uid(),entity:'media_player.sfera_piano_terra',label:'Sfera Piano Terra',icon:'🔊',unit:'',type:'media',color:'#f472b6',colSpan:2,rowSpan:1,max:0,min:0,sub:'',hours:24,entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5},
  ]
};

/* ═══ STATE ═══ */
const hs = {};        // entity_id → state string
const ha = {};        // entity_id → attributes object
let allE = [];
let cfg  = loadCfg();
let editMode = false;

/* ═══ PAGE HELPER ═══ */
function curPage(){ return cfg.pages[cfg.activePage]||cfg.pages[0]; }
let editingId = null;
let ws, mid=1, reconn;
const charts = {};
let dragSrc = null;
let _pendingDropSec = null, _pendingDropCol = 0;
let emTarget = null;  // browse field target
const camTimers = {}; // cardId → intervalId
let wizardTpl = null;
let wizardEditing = false;

/* ═══ PERSIST ═══ */
// uid, eh, ea → utils.js

function _mkCard(overrides){
  return {id:uid(),type:'compact',entity:'',label:'',icon:'📦',unit:'',color:'#818cf8',
    colSpan:1,rowSpan:1,max:0,min:0,sub:'',hours:24,content:'',imageUrl:'',elements:[],threshold:5,items:[],groups:[],
    entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5,clickAction:'info',clickUrl:'',
    secId:'',secCol:0,secOrder:0,height:150,
    ...overrides};
}

/* ═══ SECTIONS ═══ */
function _secUid(){ return 'sec_'+uid(); }

function _ensureSections(page){
  if(page.sections && page.sections.length>0){
    // ensure all non-header cards have a valid secId
    const ids=page.sections.map(s=>s.id);
    const normal=page.cards.filter(c=>c.type!=='header-bar');
    normal.forEach((c,i)=>{
      if(!c.secId||!ids.includes(c.secId)){
        c.secId=page.sections[0].id; c.secCol=0; c.secOrder=i*10;
      }
      if(!c.height) c.height=(c.rowSpan||1)*(page.sections.find(s=>s.id===c.secId)?.rowH||150);
      if(!c.colSpan) c.colSpan=1;
    });
    return;
  }
  // First time: migrate from grid layout
  const cols=page.columns||4, rowH=page.rowH||150;
  const secId=_secUid();
  page.sections=[{id:secId,cols,rowH,label:''}];
  const normal=page.cards.filter(c=>c.type!=='header-bar');
  // Simple greedy column fill
  const colH=Array(cols).fill(0);
  normal.forEach(c=>{
    const col=colH.indexOf(Math.min(...colH));
    c.secId=secId; c.secCol=col; c.secOrder=colH[col];
    c.colSpan=Math.min(c.colSpan||1, cols-col);  // clamp colSpan
    c.height=(c.rowSpan||1)*rowH;
    colH[col]+=c.height+10;
  });
}

function addSection(){
  const page=curPage(); _ensureSections(page);
  page.sections.push({id:_secUid(),cols:2,rowH:150,label:''});
  saveCfg(); renderDash(); renderSectionsList();
  _pgMarkDirty(true);
}
/* Elimina davvero la riga (e, con conferma, le card al suo interno) — usato dal tasto "✕ riga" in modifica */
function delSectionRow(secId){
  const page=curPage();
  if(!page.sections||page.sections.length<=1){ showToast('⚠️ Deve restare almeno una riga'); return; }
  const cards=page.cards.filter(c=>c.secId===secId);
  const doDel=()=>{
    cards.forEach(c=>{ try{destroyChart(c.id);}catch(e){} try{stopCamTimer(c.id);}catch(e){} });
    page.cards=page.cards.filter(c=>c.secId!==secId);
    page.sections=page.sections.filter(s=>s.id!==secId);
    saveCfg(); renderDash(); renderSectionsList(); _pgMarkDirty(true);
  };
  if(cards.length) showConfirm('Eliminare la riga e le <b>'+cards.length+' card</b> al suo interno?', doDel);
  else doDel();
}
function delSection(secId){
  const page=curPage();
  if(!page.sections||page.sections.length<=1){showToast('⚠️ Almeno una sezione richiesta');return;}
  const keep=page.sections.filter(s=>s.id!==secId);
  const target=keep[0];
  page.cards.filter(c=>c.secId===secId).forEach((c,i)=>{c.secId=target.id;c.secCol=0;c.secOrder=i*10;});
  page.sections=keep;
  saveCfg(); renderDash(); renderSectionsList();
  _pgMarkDirty(true);
}
function setSectionCols(secId,n){
  const page=curPage();
  const sec=(page.sections||[]).find(s=>s.id===secId); if(!sec) return;
  const oldN=sec.cols||4;
  if(n===oldN){ renderSectionsList(); return; }

  sec.cols=n;
  if(sec.colWidths){
    Object.keys(sec.colWidths).forEach(k=>{ if(parseInt(k)>=n) delete sec.colWidths[k]; });
  }

  page.cards.filter(c=>c.secId===secId).forEach(c=>{
    if(n<oldN){
      // Reducing: save original position the first time we move the card
      if(c._origSecCol===undefined) c._origSecCol=c.secCol||0;
      if((c.secCol||0)>=n) c.secCol=n-1;
      c.colSpan=Math.min(c.colSpan||1, n-(c.secCol||0));
    } else {
      // Expanding: restore original position if it fits in the new count
      if(c._origSecCol!==undefined && c._origSecCol<n){
        c.secCol=c._origSecCol;
        c.colSpan=Math.min(c.colSpan||1, n-c.secCol);
      } else {
        if((c.secCol||0)>=n) c.secCol=n-1;
        c.colSpan=Math.min(c.colSpan||1, n-(c.secCol||0));
      }
    }
  });
  saveCfg(); renderDash(); renderSectionsList();
  _pgMarkDirty(true);
}
function setSectionRowH(secId,h){
  const page=curPage();
  const sec=(page.sections||[]).find(s=>s.id===secId); if(!sec) return;
  const old=sec.rowH||150; sec.rowH=h;
  page.cards.filter(c=>c.secId===secId).forEach(c=>{ if(c.height===old||(c.rowSpan||1)*old===c.height) c.height=h; });
  saveCfg(); renderDash(); renderSectionsList();
  _pgMarkDirty(true);
}
let _sectionClipboard=null; // {type:'copy'|'cut', sec, cards}
// ── Per-column actions ──
let _colDragSrc=null;      // {secId, col} — column being dragged
let _colClipboard=null;    // {cards:[...]} — copied column

function setColWidth(secId, col, w){
  const page=curPage();
  const sec=(page.sections||[]).find(s=>s.id===secId); if(!sec) return;
  if(!sec.colWidths) sec.colWidths={};
  sec.colWidths[col]=Math.max(1,Math.min(4,w));
  saveCfg(); renderDash();
  _pgMarkDirty(true);
}
function moveColTo(secId, fromCol, toCol){
  if(fromCol===toCol) return;
  const page=curPage();
  const sec=(page.sections||[]).find(s=>s.id===secId);
  // Shift cards and keep _origSecCol in sync
  page.cards.filter(c=>c.secId===secId).forEach(c=>{
    const curr=c.secCol||0;
    if(curr===fromCol){ c.secCol=toCol; c._origSecCol=toCol; }
    else if(fromCol<toCol && curr>fromCol && curr<=toCol){ c.secCol=curr-1; c._origSecCol=curr-1; }
    else if(fromCol>toCol && curr>=toCol && curr<fromCol){ c.secCol=curr+1; c._origSecCol=curr+1; }
  });
  // Also shift colWidths to match new order
  if(sec&&sec.colWidths){
    const cols=sec.cols||4;
    const oldW=Array.from({length:cols},(_,i)=>sec.colWidths[i]||1);
    const moved=oldW.splice(fromCol,1)[0];
    oldW.splice(toCol,0,moved);
    sec.colWidths={};
    oldW.forEach((w,i)=>{ if(w!==1) sec.colWidths[i]=w; });
  }
  saveCfg(); renderDash();
  _pgMarkDirty(true);
}
function copyCol(secId, col){
  const page=curPage();
  const cards=page.cards.filter(c=>c.secId===secId&&(c.secCol||0)===col);
  _colClipboard=JSON.parse(JSON.stringify(cards));
  showToast('📋 Colonna copiata — clicca 📋 su un\'altra colonna per incollarla');
  // Re-render to show paste buttons
  renderDash();
}
function pasteCol(secId, toCol){
  if(!_colClipboard||!_colClipboard.length){ showToast('Nessuna colonna copiata'); return; }
  const page=curPage();
  const sec=(page.sections||[]).find(s=>s.id===secId); if(!sec) return;
  // Move existing cards in target col to make room (shift right)
  page.cards.filter(c=>c.secId===secId&&(c.secCol||0)>=toCol).forEach(c=>c.secCol=(c.secCol||0)+1);
  // Clamp overflow
  const maxCol=sec.cols-1;
  page.cards.filter(c=>c.secId===secId&&(c.secCol||0)>maxCol).forEach(c=>c.secCol=maxCol);
  // Insert cloned cards
  const maxOrder=page.cards.filter(c=>c.secId===secId&&(c.secCol||0)===toCol).reduce((m,c)=>Math.max(m,c.secOrder||0),0);
  _colClipboard.forEach((src,i)=>{
    const nc=Object.assign({},src,{id:'c'+Date.now()+Math.random().toString(36).slice(2,6),secId,secCol:toCol,secOrder:maxOrder+(i+1)*10});
    page.cards.push(nc);
  });
  _colClipboard=null;
  saveCfg(); renderDash();
  showToast('✅ Colonna incollata');
}
function deleteCol(secId, col){
  const page=curPage();
  const sec=(page.sections||[]).find(s=>s.id===secId); if(!sec) return;
  const colCards=page.cards.filter(c=>c.secId===secId&&(c.secCol||0)===col);
  const cardCount=colCards.length;
  const msg=cardCount>0
    ? `Eliminare la colonna e le <b>${cardCount} card</b> al suo interno?`
    : 'Eliminare questa colonna?';
  showConfirm(msg, ()=>{
    // Delete cards in this column
    const idsToDelete=colCards.map(c=>c.id);
    idsToDelete.forEach(id=>{ destroyChart(id); stopCamTimer(id); });
    page.cards=page.cards.filter(c=>!(c.secId===secId&&(c.secCol||0)===col));
    // Shift remaining cols down
    page.cards.filter(c=>c.secId===secId&&(c.secCol||0)>col).forEach(c=>c.secCol=(c.secCol||0)-1);
    // Shift colWidths
    {
      const cols=sec.cols||4;
      const oldW=Array.from({length:cols},(_,i)=>(sec.colWidths&&sec.colWidths[i])||1);
      oldW.splice(col,1);
      sec.colWidths={};
      oldW.forEach((w,i)=>{ if(w!==1) sec.colWidths[i]=w; });
    }
    // Riduci effettivamente il numero di colonne della riga (altrimenti ricompare vuota)
    sec.cols=Math.max(1,(sec.cols||4)-1);
    saveCfg(); renderDash();
    _pgMarkDirty(true);
  });
}
function addCardToCol(secId, col, triggerEl){
  _pendingDropSec=secId; _pendingDropCol=col;
  document.getElementById('add-col-menu')?.remove();
  // Niente negli appunti → vai DRITTO allo Store
  if(!_cardClipboard){ openGhStore(); return; }
  // Appunti presenti → piccolo menu: apri lo Store oppure Incolla la card copiata
  const menu=document.createElement('div');
  menu.id='add-col-menu';
  menu.style.cssText='position:fixed;z-index:15000;background:#1a1f35;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:8px;box-shadow:0 12px 40px rgba(0,0,0,.75);display:flex;flex-direction:column;gap:6px;min-width:200px;animation:popIn .12s ease';
  const btnStyle='background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:rgba(255,255,255,.8);font-size:12px;padding:9px 12px;cursor:pointer;text-align:left;transition:background .12s';
  menu.innerHTML=`
    <div style="font-size:9px;color:rgba(255,255,255,.3);padding:2px 4px 4px;letter-spacing:.5px;text-transform:uppercase">Aggiungi card</div>
    <button style="${btnStyle};background:rgba(74,222,128,.1);border-color:rgba(74,222,128,.3);color:#86efac" onmouseover="this.style.background='rgba(74,222,128,.22)'" onmouseout="this.style.background='rgba(74,222,128,.1)'" data-action="_openGhStoreClean">🛒 Apri lo Store</button>
    <button style="${btnStyle};background:rgba(99,102,241,.12);border-color:rgba(99,102,241,.3);color:#a5b4fc" onmouseover="this.style.background='rgba(99,102,241,.25)'" onmouseout="this.style.background='rgba(99,102,241,.12)'" data-action="_pasteCardToClean" data-action-args='["${secId}",${col}]'>📋 Incolla "${eh(_cardClipboard.label||_cardClipboard.type||'Card')}"</button>
  `;
  // Position near the trigger element
  const rect=triggerEl?triggerEl.getBoundingClientRect():{left:window.innerWidth/2-95,bottom:window.innerHeight/2};
  let left=rect.left;
  let top=rect.bottom+6;
  // Keep inside viewport
  if(left+200>window.innerWidth) left=window.innerWidth-208;
  if(top+130>window.innerHeight) top=rect.top-136;
  menu.style.left=left+'px';
  menu.style.top=top+'px';
  document.body.appendChild(menu);
  // Close on outside click
  setTimeout(()=>document.addEventListener('click',function _h(e){
    if(!menu.contains(e.target)){menu.remove();document.removeEventListener('click',_h);}
  }),80);
}
function moveSectionUp(secId){
  const page=curPage(); _ensureSections(page);
  const idx=page.sections.findIndex(s=>s.id===secId); if(idx<=0) return;
  const tmp=page.sections[idx-1]; page.sections[idx-1]=page.sections[idx]; page.sections[idx]=tmp;
  saveCfg(); renderDash(); renderSectionsList();
}
function moveSectionDown(secId){
  const page=curPage(); _ensureSections(page);
  const idx=page.sections.findIndex(s=>s.id===secId); if(idx<0||idx>=page.sections.length-1) return;
  const tmp=page.sections[idx+1]; page.sections[idx+1]=page.sections[idx]; page.sections[idx]=tmp;
  saveCfg(); renderDash(); renderSectionsList();
}
function copySection(secId){
  const page=curPage();
  const sec=page.sections.find(s=>s.id===secId); if(!sec) return;
  const cards=page.cards.filter(c=>c.secId===secId);
  _sectionClipboard={type:'copy', sec:JSON.parse(JSON.stringify(sec)), cards:JSON.parse(JSON.stringify(cards))};
  showToast('📋 Sezione copiata — usa Incolla sezione per aggiungerla');
  _updateSectionPasteBtn();
}
function cutSection(secId){
  const page=curPage();
  const sec=page.sections.find(s=>s.id===secId); if(!sec) return;
  const cards=page.cards.filter(c=>c.secId===secId);
  _sectionClipboard={type:'cut', sec:JSON.parse(JSON.stringify(sec)), cards:JSON.parse(JSON.stringify(cards)), srcId:secId};
  showToast('✂️ Sezione tagliata — usa Incolla sezione per inserirla');
  _updateSectionPasteBtn();
}
function pasteSection(){
  if(!_sectionClipboard) return;
  const page=curPage(); _ensureSections(page);
  const {type, sec, cards, srcId}=_sectionClipboard;
  // Assign fresh IDs
  const newSecId=_secUid();
  const newSec=Object.assign({},sec,{id:newSecId,label:(sec.label?sec.label+' (copia)':'')});
  page.sections.push(newSec);
  cards.forEach(c=>{
    const nc=Object.assign({},c,{id:'c'+Date.now()+Math.random().toString(36).slice(2),secId:newSecId});
    page.cards.push(nc);
  });
  if(type==='cut'){
    // Remove source section and its cards
    page.sections=page.sections.filter(s=>s.id!==srcId);
    page.cards=page.cards.filter(c=>c.secId!==srcId);
    _sectionClipboard=null;
    _updateSectionPasteBtn();
  }
  saveCfg(); renderDash(); renderSectionsList();
  showToast(type==='cut'?'✅ Sezione spostata':'✅ Sezione incollata');
}
function _updateSectionPasteBtn(){
  const btn=document.getElementById('paste-sec-btn');
  if(btn) btn.style.display=_sectionClipboard?'':'none';
}
function _epRenderJsStore(){
  const items = _jsStoreList();
  const countEl = document.getElementById('ep-jsstore-count');
  if(countEl) countEl.textContent = items.length ? items.length+' card' : '';
  const listEl  = document.getElementById('ep-jsstore-list');
  if(!listEl) return;

  if(!items.length){
    listEl.innerHTML='<div style="padding:12px 4px;text-align:center;font-size:11px;color:var(--muted)">Nessuna card installata.<br>Usa "Gestisci Store" per caricare.</div>';
    return;
  }

  // Quali card sono già in dashboard
  const usedIds = new Set();
  (cfg.pages||[]).forEach(pg=>(pg.cards||[]).forEach(c=>{ if(c.type==='js-custom'&&c.jsCardId) usedIds.add(c.jsCardId); }));

  listEl.innerHTML = items.map(item=>{
    const m = item.meta||{};
    const inUse = usedIds.has(m.id);
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 6px;border-bottom:1px solid rgba(255,255,255,.04)">
      <span style="font-size:18px;flex-shrink:0">${m.icon||'📦'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.name||m.id}</div>
        <div style="font-size:9px;color:var(--muted)">v${m.version||'?'} · ${m.id}</div>
      </div>
      ${inUse
        ? '<span style="font-size:9px;font-weight:700;color:#4ade80;flex-shrink:0">✓ In uso</span>'
        : `<button data-action="jsStoreAddCard" data-action-arg="${m.id||''}" style="flex-shrink:0;padding:4px 9px;border-radius:7px;background:rgba(99,102,241,.2);border:1px solid rgba(99,102,241,.4);color:#a5b4fc;font-size:10px;font-weight:700;cursor:pointer">➕</button>`
      }
    </div>`;
  }).join('');
}

function renderSectionsList(){
  const page=curPage(); _ensureSections(page);
  const el=document.getElementById('sections-list'); if(!el) return;
  el.innerHTML=(page.sections||[]).map((sec,i)=>`
    <div class="sec-item">
      <div class="sec-item-title">
        <span style="flex:1;font-size:10px;font-weight:700;color:rgba(255,255,255,.5)">${page.sections.length>1?`Riga ${i+1}`:'Layout griglia'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:4px">
        <span style="font-size:8px;color:var(--muted);min-width:46px">Colonne</span>
        ${[1,2,3,4].map(n=>`<button class="col-o${(sec.cols||4)===n?' on':''}" data-action="setSectionCols" data-action-args='["${sec.id}",${n}]'>${n}</button>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap">
        <span style="font-size:8px;color:var(--muted);min-width:46px">Altezza</span>
        ${[100,130,150,180,200].map(h=>`<button class="col-o${(sec.rowH||150)===h?' on':''}" style="font-size:8px;padding:2px 4px;min-width:28px" data-action="setSectionRowH" data-action-args='["${sec.id}",${h}]'>${h}</button>`).join('')}
      </div>
    </div>`).join('');
}
function moveToCol(cardId,secId,col){
  const page=curPage();
  const card=page.cards.find(c=>c.id===cardId); if(!card) return;
  const siblings=page.cards.filter(c=>c.secId===secId&&(c.secCol||0)===col&&c.id!==cardId);
  const maxOrd=siblings.length>0?Math.max(...siblings.map(c=>c.secOrder||0))+10:0;
  card.secId=secId; card.secCol=col; card.secOrder=maxOrd;
  card._origSecCol=col; // User intentionally moved it — update home position
  const sec=(page.sections||[]).find(s=>s.id===secId);
  if(sec) card.colSpan=Math.min(card.colSpan||1, sec.cols-col);
  saveCfg(); renderDash();
}
function adjH(cardId,delta){
  const page=curPage();
  const card=page.cards.find(c=>c.id===cardId); if(!card) return;
  const newH=Math.max(80,(card.height||150)+delta);
  card.height=newH;
  const wrap=document.getElementById('card-'+cardId)?.closest('.dash-card-wrap');
  if(wrap) wrap.style.height=newH+'px';
  const rs=document.getElementById('rs-'+cardId);
  if(rs) rs.textContent=newH+'px';
  saveCfg();
}
function adjSecSpan(cardId,delta){
  const page=curPage();
  const card=page.cards.find(c=>c.id===cardId); if(!card) return;
  const sec=(page.sections||[]).find(s=>s.id===card.secId);
  const maxCols=(sec?.cols||4)-(card.secCol||0);
  const newSpan=Math.max(1,Math.min(maxCols,(card.colSpan||1)+delta));
  // Apply span to all cards in the same column (they share the wrapper width)
  page.cards.filter(c=>c.secId===card.secId&&(c.secCol||0)===(card.secCol||0))
    .forEach(c=>c.colSpan=newSpan);
  const colWrap=document.getElementById('card-'+cardId)?.closest('.dash-col-outer');
  if(colWrap) colWrap.style.gridColumn=`${(card.secCol||0)+1} / span ${newSpan}`;
  const cs=document.getElementById('cs-'+cardId);
  if(cs) cs.textContent='S:'+newSpan;
  saveCfg();
}

function _migrateRichPageToCards(pg){
  if(!pg.pageType) return; // already regular page
  const t=pg.pageType;
  pg.cards=pg.cards||[];
  if(pg.cards.length===0){
    // Build cards from the stored entity fields
    if(t==='meteo'){
      const wEnt=pg.weatherEntity||'weather.home';
      const hrs=pg.hours||24;
      pg.cards.push(_mkCard({type:'weather-hero',label:pg.name||'Meteo',icon:'🌅',entity:wEnt,entity2:pg.entityTemp||'',entity3:pg.entityHum||'',color:'#22d3ee',colSpan:2,rowSpan:2}));
      if(pg.entityWind)  pg.cards.push(_mkCard({type:'compact',label:'Vento',icon:'💨',entity:pg.entityWind,unit:'km/h',color:'#4ade80',max:100}));
      if(pg.entityRain)  pg.cards.push(_mkCard({type:'compact',label:'Pioggia',icon:'🌧️',entity:pg.entityRain,unit:'mm',color:'#60a5fa',max:50}));
      if(pg.entityUV)    pg.cards.push(_mkCard({type:'compact',label:'UV',icon:'☀️',entity:pg.entityUV,unit:'',color:'#fbbf24',max:11}));
      if(pg.entityPres)  pg.cards.push(_mkCard({type:'compact',label:'Pressione',icon:'🌡️',entity:pg.entityPres,unit:'hPa',color:'#a78bfa',max:1050}));
      pg.cards.push(_mkCard({type:'weather-forecast',label:'Previsioni',icon:'📅',entity:wEnt,color:'#818cf8',colSpan:4,rowSpan:1}));
      if(pg.entityTemp)  pg.cards.push(_mkCard({type:'history',label:'Temperatura',icon:'🌡️',entity:pg.entityTemp,unit:'°C',color:'#f97316',hours:hrs,colSpan:2,rowSpan:2}));
      if(pg.entityHum)   pg.cards.push(_mkCard({type:'history',label:'Umidità',icon:'💧',entity:pg.entityHum,unit:'%',color:'#38bdf8',hours:hrs,colSpan:2,rowSpan:2}));
    } else if(t==='energia'){
      const hrs=pg.hours||24;
      pg.cards.push(_mkCard({type:'flowmap',label:'Flusso Energia',icon:'🗺️',solar:pg.solar||'',load:pg.load||'',grid:pg.grid||'',battery:pg.battery||'',color:'#818cf8',colSpan:2,rowSpan:2}));
      if(pg.solar)  pg.cards.push(_mkCard({type:'compact',label:'Solare',icon:'☀️',entity:pg.solar,unit:'W',color:'#fbbf24',max:6000}));
      if(pg.load)   pg.cards.push(_mkCard({type:'compact',label:'Consumo',icon:'🏠',entity:pg.load,unit:'W',color:'#f87171',max:6000}));
      if(pg.grid)   pg.cards.push(_mkCard({type:'compact',label:'Rete',icon:'⚡',entity:pg.grid,unit:'W',color:'#60a5fa',max:6000}));
      if(pg.battery)pg.cards.push(_mkCard({type:'gauge',label:'Batteria',icon:'🔋',entity:pg.battery,unit:'%',color:'#4ade80',max:100,colSpan:1,rowSpan:2}));
      if(pg.entityEsolar) pg.cards.push(_mkCard({type:'big',label:'Energia Solare',icon:'☀️',entity:pg.entityEsolar,unit:'kWh',color:'#fbbf24'}));
      if(pg.entityEload)  pg.cards.push(_mkCard({type:'big',label:'Energia Casa',icon:'🏠',entity:pg.entityEload,unit:'kWh',color:'#f87171'}));
      if(pg.entityBill)   pg.cards.push(_mkCard({type:'big',label:'Bolletta',icon:'💶',entity:pg.entityBill,unit:'€',color:'#a78bfa'}));
      if(pg.solar)  pg.cards.push(_mkCard({type:'history',label:'Solare',icon:'☀️',entity:pg.solar,unit:'W',color:'#fbbf24',hours:hrs,colSpan:2,rowSpan:2}));
      if(pg.load)   pg.cards.push(_mkCard({type:'history',label:'Consumo',icon:'🏠',entity:pg.load,unit:'W',color:'#f87171',hours:hrs,colSpan:2,rowSpan:2}));
    } else if(t==='veicoli'){
      const hrs=pg.hours||72;
      if(pg.entitySOC)    pg.cards.push(_mkCard({type:'gauge',label:'SOC Batteria',icon:'🔋',entity:pg.entitySOC,unit:'%',color:'#4ade80',max:100,colSpan:1,rowSpan:2}));
      if(pg.entityRange)  pg.cards.push(_mkCard({type:'big',label:'Autonomia',icon:'🛣️',entity:pg.entityRange,unit:'km',color:'#60a5fa',colSpan:1,rowSpan:2}));
      if(pg.entityPower)  pg.cards.push(_mkCard({type:'compact',label:'Potenza Carica',icon:'⚡',entity:pg.entityPower,unit:'kW',color:'#fbbf24',max:22,colSpan:2,rowSpan:1}));
      if(pg.entityCharge) pg.cards.push(_mkCard({type:'text',label:'Stato Carica',icon:'🔌',entity:pg.entityCharge,color:'#a78bfa'}));
      if(pg.entityOdo)    pg.cards.push(_mkCard({type:'big',label:'Odometro',icon:'📍',entity:pg.entityOdo,unit:'km',color:'#94a3b8'}));
      if(pg.entitySOC)    pg.cards.push(_mkCard({type:'history',label:'SOC',icon:'🔋',entity:pg.entitySOC,unit:'%',color:'#4ade80',hours:hrs,colSpan:2,rowSpan:2}));
      if(pg.entityRange)  pg.cards.push(_mkCard({type:'history',label:'Autonomia',icon:'🛣️',entity:pg.entityRange,unit:'km',color:'#60a5fa',hours:hrs,colSpan:2,rowSpan:2}));
    }
  }
  delete pg.pageType;
  // Clean up rich-page-specific fields
  delete pg.weatherEntity; delete pg.entityTemp; delete pg.entityHum;
  delete pg.entityWind; delete pg.entityRain; delete pg.entityUV; delete pg.entityPres;
  delete pg.solar; delete pg.load; delete pg.grid; delete pg.battery;
  delete pg.entityEsolar; delete pg.entityEload; delete pg.entityBill;
  delete pg.entitySOC; delete pg.entityRange; delete pg.entityCharge; delete pg.entityPower; delete pg.entityOdo;
  delete pg.metricOrder; delete pg.hours;
}

function loadCfg(){
  try{
    const s=localStorage.getItem('hadb_cfg');
    if(s){
      const p=JSON.parse(s);
      // Migrate old single-page format (has .cards but no .pages)
      if(p.cards&&!p.pages){
        return {activePage:0,savedCards:p.savedCards||[],theme:p.theme||'dark',font:p.font||'Inter',pages:[{id:'p'+Math.random().toString(36).slice(2,7),name:'Dashboard',icon:'🏠',columns:p.columns||4,rowH:p.rowH||150,cards:p.cards}]};
      }
      // Migrate rich pages (pageType) to regular card pages
      if(p.pages) p.pages.forEach(pg=>_migrateRichPageToCards(pg));
      if(!p.savedCards) p.savedCards=[];
      if(!p.theme) p.theme='dark';
      if(!p.font)  p.font='Inter';
      if(!p.footerBar) p.footerBar={enabled:false,buttons:[]};
      if(!p.hdrBar) p.hdrBar={left:[{id:uid(),type:'clock'}],center:[],right:[]};
      return p;
    }
  }catch(e){}
  return {activePage:0,savedCards:[],theme:'dark',font:'Inter',pages:[{id:'p'+Math.random().toString(36).slice(2,7),name:'Dashboard',icon:'🏠',columns:DEF.columns,rowH:DEF.rowH,cards:JSON.parse(JSON.stringify(DEF.cards))}]};
}
/* ── Salvataggio config + SINCRONIZZAZIONE su Home Assistant (dati utente, condivisi tra dispositivi) ── */
let _cfgGetId=-1, _cfgSetId=-1, _haSaveTimer=null, _cfgSyncing=false, _cfgSynced=false, _lastPull=0;
let _cfgManualSyncId=-1;   // id del salvataggio avviato dal pulsante "Sincronizza" → mostra il toast SOLO per quello
function saveCfg(){
  if(!_cfgSyncing) cfg._ts=Date.now();      // timestamp ultima modifica (per "vince il più recente")
  localStorage.setItem('hadb_cfg',JSON.stringify(cfg));
  // AUTO-PUSH su HA: solo dopo il primo caricamento da HA (_cfgSynced) → un dispositivo appena aperto
  // prima SCARICA la versione su HA, poi può inviare le sue modifiche (evita di sovrascrivere da vuoto).
  if(!_cfgSyncing && _cfgSynced) _haSaveCfgDebounced();
  if(!_cfgSyncing) _histPush();             // cronologia Annulla/Ripeti
}
/* ═══ CRONOLOGIA ANNULLA / RIPETI (snapshot della configurazione) ═══ */
let _history=[], _histIdx=-1, _histTimer=null, _histRestoring=false;
const _HIST_KEEP=['githubSync','savedCards','_ts','_foldersMigrated'];  // chiavi NON soggette a undo/redo (token, librerie, metadati)
function _histSnap(){ try{ const c={}; for(const k in cfg){ if(_HIST_KEEP.indexOf(k)<0) c[k]=cfg[k]; } return JSON.stringify(c); }catch(e){ return ''; } }
function _histInit(){ _history=[_histSnap()]; _histIdx=0; _updateUndoBtns(); }
function _histPush(){
  if(_histRestoring) return;
  if(!_history.length){ _history=[_histSnap()]; _histIdx=0; return; }
  clearTimeout(_histTimer);
  _histTimer=setTimeout(()=>{
    const snap=_histSnap();
    if(snap===_history[_histIdx]) return;        // nessun cambiamento reale
    _history=_history.slice(0,_histIdx+1);        // dopo un undo, taglia il "futuro"
    _history.push(snap);
    if(_history.length>60) _history.shift();      // limite memoria
    _histIdx=_history.length-1;
    _updateUndoBtns();
  },350);
}
function _histApply(){
  _histRestoring=true;
  try{
    const restored=JSON.parse(_history[_histIdx]||'{}');
    const keep={}; _HIST_KEEP.forEach(k=>{ if(k in cfg) keep[k]=cfg[k]; });   // preserva token/librerie
    Object.keys(cfg).forEach(k=>{ delete cfg[k]; });
    Object.assign(cfg, restored, keep);
    cfg.activePage=Math.min(cfg.activePage||0,((cfg.pages&&cfg.pages.length)||1)-1);
    _saveCfgLocalOnly();
    if(typeof _cfgSynced!=='undefined'&&_cfgSynced) _haSaveCfgDebounced();
    // riapplica tema/font/colore (sono variabili CSS inline, non le tocca renderDash)
    try{
      const rs=document.documentElement.style, light=(cfg.theme==='light');
      document.documentElement.dataset.theme=light?'light':'';
      if(cfg.font) rs.setProperty('--font-family',`'${cfg.font}',system-ui,sans-serif`);
      const ct=(typeof COLOR_THEMES!=='undefined')&&COLOR_THEMES.find(x=>x.id===(cfg.colorTheme||'indaco'));
      if(ct){ rs.setProperty('--acc',ct.acc); rs.setProperty('--acc2',ct.acc2); rs.setProperty('--glow1',ct.g[0]); rs.setProperty('--glow2',ct.g[1]); rs.setProperty('--glow3',ct.g[2]);
        if(light){ rs.removeProperty('--bg'); rs.removeProperty('--panel'); rs.removeProperty('--panel2'); }
        else { rs.setProperty('--bg',ct.bg); rs.setProperty('--panel',ct.panel); rs.setProperty('--panel2',ct.panel2); } }
    }catch(e){}
    renderDash(); try{ renderPageTabs(); }catch(e){} try{ renderBadgesAll(); }catch(e){}
  }catch(e){}
  _histRestoring=false;
  _updateUndoBtns();
}
function undoEdit(){ if(_histIdx<=0){ showToast('Niente da annullare'); return; } clearTimeout(_histTimer); _histIdx--; _histApply(); showToast('↶ Annullato'); }
function redoEdit(){ if(_histIdx>=_history.length-1){ showToast('Niente da ripetere'); return; } clearTimeout(_histTimer); _histIdx++; _histApply(); showToast('↷ Ripetuto'); }
function _updateUndoBtns(){
  const u=document.getElementById('undo-btn'), r=document.getElementById('redo-btn');
  if(u) u.classList.toggle('hbtn-off', _histIdx<=0);
  if(r) r.classList.toggle('hbtn-off', _histIdx>=_history.length-1);
}
document.addEventListener('keydown',e=>{
  if(!(e.ctrlKey||e.metaKey)) return;
  const tag=(e.target&&e.target.tagName)||''; if(/INPUT|TEXTAREA|SELECT/.test(tag)||e.target?.isContentEditable) return;
  const k=(e.key||'').toLowerCase();
  if(k==='z'&&!e.shiftKey){ e.preventDefault(); undoEdit(); }
  else if(k==='y'||(k==='z'&&e.shiftKey)){ e.preventDefault(); redoEdit(); }
});
function _saveCfgLocalOnly(){ localStorage.setItem('hadb_cfg',JSON.stringify(cfg)); }
function _haSaveCfgDebounced(){ clearTimeout(_haSaveTimer); _haSaveTimer=setTimeout(_haSaveCfg,400); }
/* da chiamare quando si aggiunge/aggiorna/elimina una card JS → propaga su HA */
function _cfgTouchAndPush(){ if(_cfgSyncing) return; cfg._ts=Date.now(); _saveCfgLocalOnly(); if(_cfgSynced) _haSaveCfgDebounced(); }
function _haSaveCfg(){
  try{
    if(ws&&ws.readyState===1){
      const payload={_ts:cfg._ts||Date.now(), cfg:cfg, js:(typeof _jsStoreList==='function'?_jsStoreList():[])};
      _cfgSetId=mid;
      send({type:'frontend/set_user_data',key:'frarik_cfg',value:payload});
      return true;
    }
  }catch(e){}
  return false;
}
function _haLoadCfg(force){
  try{
    if(!(ws&&ws.readyState===1)) return;
    const now=Date.now();
    if(!force && now-_lastPull<1500) return;   // throttle
    _lastPull=now; _cfgGetId=mid;
    send({type:'frontend/get_user_data',key:'frarik_cfg'});
  }catch(e){}
}
/* Quando torni sulla pagina/pannello: se la connessione è caduta (es. cambio plancia e ritorno) RICONNETTI,
   altrimenti ricontrolla la config. Evita di dover ricaricare a mano. */
function _onResume(){
  if(document.hidden) return;
  // riconnetti SOLO se il WS è davvero CHIUSO (3) o assente — non se sta connettendo/chiudendo,
  // così evitiamo riconnessioni spurie (e lo "scatto" della pagina).
  if(!ws || ws.readyState===3){
    _connTargets=[]; _connIdx=0; _connBusy=false; clearTimeout(reconn);
    connect();
  } else if(ws.readyState===1){
    _haLoadCfg();
  }
}
document.addEventListener('visibilitychange',_onResume);
window.addEventListener('focus',_onResume);
window.addEventListener('pageshow',_onResume);
/* poll leggero: NON forza riconnessioni (ci pensa ws.onclose). Solo refresh config se connesso. */
setInterval(()=>{ if(!document.hidden && ws && ws.readyState===1) _haLoadCfg(); }, 3000);
/* Forza il push della config di QUESTO dispositivo su HA (per "seminare" da quello giusto) */
function syncCfgToHA(){
  cfg._ts=Date.now(); _saveCfgLocalOnly();
  const ok=_haSaveCfg();
  // Segna QUESTO salvataggio come "manuale": solo per lui mostriamo la conferma (vedi handler _cfgSetId).
  // Gli auto-salvataggi a ogni modifica restano silenziosi.
  if(ok){ _cfgManualSyncId=_cfgSetId; }
  else showToast('⚠️ Non connesso a Home Assistant');
}

/* ── BACKUP: esporta/ripristina TUTTO (layout + card JS) in un file .json ── */
function exportBackup(){
  try{
    const payload={ app:'frarik', exportedAt:new Date().toISOString(), _ts:cfg._ts||Date.now(),
      cfg:cfg, js:(typeof _jsStoreList==='function'?_jsStoreList():[]) };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='frarik-backup-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),3000);
    showToast('⬇️ Backup esportato ('+(cfg.pages||[]).length+' pagine, '+(_jsStoreList().length)+' card JS)');
  }catch(e){ showToast('⚠️ Errore export: '+(e.message||e)); }
}
function importBackupFile(file){
  if(!file) return;
  const r=new FileReader();
  r.onload=e=>{
    let p; try{ p=JSON.parse(e.target.result); }catch(err){ showToast('⚠️ File di backup non valido'); return; }
    const c = (p.cfg&&p.cfg.pages) ? p.cfg : (p.pages ? p : null);
    if(!c){ showToast('⚠️ Backup non valido (nessuna configurazione)'); return; }
    showConfirm('Ripristinare questo backup?<br><span style="font-size:11px;opacity:.7">La configurazione attuale verrà sostituita ('+ (c.pages||[]).length +' pagine, '+ (Array.isArray(p.js)?p.js.length:0) +' card JS).</span>', ()=>{
      // 1) ripristina le card JS
      if(Array.isArray(p.js)){
        p.js.forEach(it=>{ try{ if(it&&it.meta&&it.meta.id){ _jsStoreSave(it.meta.id,it.meta,it.code,it.origin); if(!window.FratechCardRegistry[it.meta.id]) try{ _installCardCode(it.code); }catch(_){} } }catch(_){} });
      }
      // 2) ripristina il layout
      cfg=c; cfg._ts=Date.now();
      if(!cfg.savedCards) cfg.savedCards=[];
      cfg.activePage=Math.min(cfg.activePage||0,(cfg.pages.length||1)-1);
      _saveCfgLocalOnly();
      try{ applyTheme(cfg.theme); }catch(_){}
      renderDash(); renderPageTabs(); renderBadgesAll();
      _haSaveCfg();   // propaga su HA / altri dispositivi
      showToast('✅ Backup ripristinato');
    });
  };
  r.onerror=()=>showToast('⚠️ Impossibile leggere il file');
  r.readAsText(file);
}

/* ════════════════════ SINCRONIZZAZIONE CARD DA GITHUB ════════════════════
   Controlla un repo GitHub; quando una card cambia (SHA diverso) mostra una notifica
   in alto che, cliccata, scarica e aggiorna la card (e la sincronizza su tutti i dispositivi). */
let _ghPending=[], _ghDismissedSig='', _ghTimer=null, _ghLastSig='';
function _ghCfg(){
  if(!cfg.githubSync) cfg.githubSync={owner:'Frarik',repo:'cards',path:'card-js',branch:'main',auto:true,shas:{}};
  if(!cfg.githubSync.shas) cfg.githubSync.shas={};
  // migrazione una-tantum: il repo ora usa cartelle → le card .js stanno in card-js/
  if(!cfg.githubSync._foldersMigrated){
    if(!cfg.githubSync.path) cfg.githubSync.path='card-js';
    cfg.githubSync._foldersMigrated=true;
  }
  return cfg.githubSync;
}
function openGitHubCfg(){
  const g=_ghCfg();
  document.getElementById('gh-owner').value=g.owner||'';
  document.getElementById('gh-repo').value=g.repo||'';
  document.getElementById('gh-path').value=g.path||'';
  document.getElementById('gh-branch').value=g.branch||'main';
  document.getElementById('gh-token').value=g.token||'';
  document.getElementById('gh-auto').checked=g.auto!==false;
  document.getElementById('gh-status').textContent='';
  document.getElementById('ghmod').classList.remove('off');
}
function closeGitHubCfg(){ document.getElementById('ghmod').classList.add('off'); }
function saveGitHubCfg(){
  const g=_ghCfg();
  g.owner=(document.getElementById('gh-owner').value||'').trim();
  g.repo=(document.getElementById('gh-repo').value||'').trim();
  g.path=(document.getElementById('gh-path').value||'').trim().replace(/^\/|\/$/g,'');
  g.branch=(document.getElementById('gh-branch').value||'main').trim()||'main';
  g.token=(document.getElementById('gh-token').value||'').trim();
  g.auto=document.getElementById('gh-auto').checked;
  saveCfg(); _haSaveCfg();
  _ghSchedule();
  closeGitHubCfg();           // chiude il popup automaticamente
  showToast('💾 GitHub salvato — controllo aggiornamenti…');
  _ghCheck(true);
}
function _ghStatus(t){ const e=document.getElementById('gh-status'); if(e) e.textContent=t; }
async function _ghApiList(){
  const g=_ghCfg(); if(!g.owner||!g.repo) throw new Error('Configura proprietario e repository');
  const url=`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${g.path?encodeURIComponent(g.path).replace(/%2F/g,'/'):''}?ref=${encodeURIComponent(g.branch||'main')}`;
  const r=await fetch(url,{headers:{'Accept':'application/vnd.github.v3+json'}});
  if(r.status===403) throw new Error('Limite richieste GitHub raggiunto, riprova tra poco');
  if(r.status===404) throw new Error('Repo o cartella non trovati (controlla nome/branch)');
  if(!r.ok) throw new Error('GitHub HTTP '+r.status);
  const j=await r.json();
  if(!Array.isArray(j)) throw new Error('Percorso non valido');
  // solo file .js, ESCLUSI i file dell'app (non sono card): frarik-panel.js, frarik-app.js, ecc.
  return j.filter(f=>f.type==='file'&&/\.js$/i.test(f.name)&&!/^frarik[-.]/i.test(f.name));
}
/* Lista TUTTE le card .js da tutte le cartelle installabili (card-js, card-chips, card-distintivi)
   con UNA sola richiesta (git tree), così il controllo automatico copre ogni cartella senza esaurire il limite. */
async function _ghApiListAll(){
  const g=_ghCfg(); if(!g.owner||!g.repo) throw new Error('Configura proprietario e repository');
  const branch=g.branch||'main';
  const H={'Accept':'application/vnd.github.v3+json'}; if(g.token) H['Authorization']='token '+g.token;
  const r=await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,{headers:H});
  if(r.status===403) throw new Error('Limite richieste GitHub raggiunto, riprova tra poco');
  if(r.status===404) throw new Error('Repo o branch non trovati');
  if(!r.ok) throw new Error('GitHub HTTP '+r.status);
  const j=await r.json();
  const folders=Object.values(_GHS_FOLDERS).filter(f=>f.kind==='install').map(f=>f.path);
  return ((j&&j.tree)||[]).filter(t=>t.type==='blob' && /\.js$/i.test(t.path) && folders.some(p=>t.path.startsWith(p+'/')) && !/^frarik[-.]/i.test(t.path.split('/').pop()))
    .map(t=>({ name:t.path.split('/').pop(), sha:t.sha, path:t.path,
      download_url:`https://raw.githubusercontent.com/${g.owner}/${g.repo}/${branch}/${t.path.split('/').map(encodeURIComponent).join('/')}` }));
}
async function _ghDownload(file){
  const r=await fetch(file.download_url);
  if(!r.ok) throw new Error('download '+r.status);
  return await r.text();
}
/* installa/aggiorna una singola card dal repo */
async function _ghInstallFile(file){
  const code=await _ghDownload(file);
  const res=_installCardCode(code);
  if(res.err) throw res.err;
  const id=(res.newCards&&res.newCards[0])||(res.tags&&res.tags[0]);
  const card=id?window.FratechCardRegistry[id]:null;
  if(card&&card.id){
    _jsStoreSave(card.id,{id:card.id,name:card.name||card.id,icon:card.icon||'📦',version:card.version||'1.0',desc:card.desc||''},code,'github');
    try{ const g=_ghCfg(); g.idFile=g.idFile||{}; g.idFile[card.id]=file.name; }catch(e){}   // mappa id↔file per liberare lo sha all'eliminazione
  }
  _ghCfg().shas[file.name]=file.sha;
  return card;
}
/* controllo: confronta gli SHA e mostra la notifica se ci sono cambiamenti */
async function _ghCheck(force){
  const g=_ghCfg(); if(!g.owner||!g.repo){ if(force) _ghStatus('Configura proprietario e repository'); return; }
  let files;
  try{ files=await _ghApiListAll(); }
  catch(e){ if(force){ _ghStatus('⚠️ '+e.message); showToast('⚠️ GitHub: '+e.message);} return; }
  _ghPending = files.filter(f=> !g.shas[f.name] || g.shas[f.name]!==f.sha);
  if(force) _ghStatus(files.length+' card nel repo · '+_ghPending.length+' da aggiornare');
  const sig=_ghPending.map(f=>f.name+':'+f.sha).sort().join('|');
  if(_ghPending.length && sig!==_ghDismissedSig){
    const txt=_ghPending.length===1?('Card aggiornata: '+_ghPending[0].name.replace(/\.js$/,'')+' — clicca per aggiornare')
                                    :(_ghPending.length+' card aggiornate — clicca per aggiornare');
    document.getElementById('gh-notif-txt').textContent=txt;
    document.getElementById('gh-notif').classList.add('on');
    if(sig!==_ghLastSig){ try{ _ntfPushLog('🔄 Aggiornamento card', txt, '🔄', 'gh'); _ntfUpdateBell(); }catch(e){} _ghLastSig=sig; }   // anche nel centro notifiche (cliccabile)
  } else if(!_ghPending.length){
    document.getElementById('gh-notif').classList.remove('on');
  }
}
function _ghDismiss(){
  _ghDismissedSig=_ghPending.map(f=>f.name+':'+f.sha).sort().join('|');
  document.getElementById('gh-notif').classList.remove('on');
}
async function _ghInstallAll(){
  if(!_ghPending.length){ document.getElementById('gh-notif').classList.remove('on'); return; }
  showToast('⬇️ Aggiorno '+_ghPending.length+' card…');
  let ok=0,err=0;
  for(const f of _ghPending.slice()){ try{ await _ghInstallFile(f); ok++; }catch(e){ err++; console.warn('[GitHub]',f.name,e.message); try{ _ntfPushLog('⚠️ Errore installazione', f.name+': '+e.message, '🐙', null, {}); }catch(_){} } }
  _ghPending=[]; _ghDismissedSig='';
  document.getElementById('gh-notif').classList.remove('on');
  saveCfg(); _haSaveCfg();
  renderDash();
  if(typeof _jsStoreRenderList==='function') _jsStoreRenderList();
  if(typeof _epRenderJsStore==='function') _epRenderJsStore();
  showToast('✅ '+ok+' card aggiornate'+(err?(' · '+err+' errori'):''));
}
/* Chiede CONFERMA prima di aggiornare le card JS, poi installa (aggiorna anche le card già in plancia). */
function _ghAskInstall(){
  const run=()=>{ _ntfLog=_ntfLog.filter(n=>n.action!=='gh'); _ntfSaveLog(); _ntfUpdateBell(); if(typeof renderNotifCenter==='function') renderNotifCenter(); closeNotifCenter(); _ghInstallAll(); };
  if(_ghPending&&_ghPending.length){
    const names=_ghPending.map(f=>f.name.replace(/\.js$/,'')).join(', ');
    const q=_ghPending.length===1 ? ('Vuoi aggiornare la card <b>'+names+'</b>?') : ('Vuoi aggiornare <b>'+_ghPending.length+' card</b>?<br><span style="font-size:11px;opacity:.7">'+names+'</span>');
    showConfirm(q+'<br><span style="font-size:11px;opacity:.7">Si aggiorneranno subito, anche se già presenti nella plancia.</span>', run, 'Aggiorna');
  } else {
    showToast('🔄 Controllo aggiornamenti card…');
    _ghCheck(true).then(()=>{ if(_ghPending.length) _ghAskInstall(); else showToast('✅ Card già aggiornate'); });
  }
}
/* 🧹 Rimuove le card installate da GitHub diventate "orfane" (id non più prodotto da alcun file del
   repo): vecchie versioni/duplicati che non compaiono in nessuna scheda e gonfiano il conteggio.
   Reinstalla prima le card attuali del repo per conoscerne gli id correnti. Le card LOCALI non si toccano. */
async function _ghCleanOrphans(){
  showToast('🧹 Controllo card orfane…');
  let files;
  try{ files=await _ghApiListAll(); }
  catch(e){ showToast('⚠️ GitHub: '+(e.message||e)); return; }
  const repoIds=new Set();
  for(const f of files){ try{ const card=await _ghInstallFile(f); if(card&&card.id) repoIds.add(card.id); }catch(e){} }
  let removed=0;
  _jsStoreList().forEach(i=>{
    const id=i&&i.meta&&i.meta.id; const org=(i&&i.origin)||'github';
    if(id && org==='github' && !repoIds.has(id)){
      _jsStoreDelete(id); try{ delete window.FratechCardRegistry[id]; }catch(e){}
      try{ const g=_ghCfg(); if(g.idFile&&g.idFile[id]){ delete g.shas[g.idFile[id]]; delete g.idFile[id]; } }catch(e){}
      removed++;
    }
  });
  saveCfg(); _haSaveCfg();
  renderDash();
  if(typeof _epRenderJsStore==='function') _epRenderJsStore();
  try{ _ghStoreRender(); }catch(e){}
  showToast(removed ? ('🧹 Rimosse '+removed+' card orfane — restano '+repoIds.size) : '✅ Nessuna card orfana');
}
async function _ghImportAll(){
  let files;
  try{ files=await _ghApiListAll(); }
  catch(e){ _ghStatus('⚠️ '+e.message); showToast('⚠️ '+e.message); return; }
  if(!files.length){ _ghStatus('Nessun file .js nel repo'); return; }
  _ghStatus('Importazione di '+files.length+' card…');
  let ok=0,err=0;
  for(const f of files){ try{ await _ghInstallFile(f); ok++; }catch(e){ err++; } }
  saveCfg(); _haSaveCfg();
  renderDash();
  if(typeof _jsStoreRenderList==='function') _jsStoreRenderList();
  if(typeof _epRenderJsStore==='function') _epRenderJsStore();
  _ghPending=[]; document.getElementById('gh-notif').classList.remove('on');
  _ghStatus('✅ '+ok+' card importate'+(err?(' · '+err+' errori'):''));
  showToast('✅ '+ok+' card importate da GitHub');
}

/* ════════ STORE da GitHub (sfoglia le cartelle del repo, con ricerca per sezione) ════════ */
const _GHS_FOLDERS={
  js:        {path:'card-js',         ext:/\.js$/i,    ico:'⚡',  kind:'install', exclude:/^frarik[-.]/i},
  chips:     {path:'card-chips',      ext:/\.js$/i,    ico:'🔹',  kind:'install'},
  distintivi:{path:'card-distintivi', ext:/\.js$/i,    ico:'🏷️', kind:'install'},
  yaml:      {path:'card-yaml',       ext:/\.ya?ml$/i, ico:'📄',  kind:'copy'},
  pkg:       {path:'pkg',             ext:/\.ya?ml$/i, ico:'📦',  kind:'copy'},
};
let _ghsTab='js', _ghsCache={};
async function _ghListFolder(path){
  const g=_ghCfg(); if(!g.owner||!g.repo) throw new Error('Configura GitHub (proprietario/repository)');
  const p=path?path.split('/').map(encodeURIComponent).join('/'):'';
  const url=`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${p}?ref=${encodeURIComponent(g.branch||'main')}`;
  const H={'Accept':'application/vnd.github.v3+json'}; if(g.token) H['Authorization']='token '+g.token;
  const r=await fetch(url,{headers:H});
  if(r.status===404) return [];   // cartella non ancora creata su GitHub
  if(r.status===403) throw new Error('Limite richieste GitHub raggiunto, riprova tra poco');
  if(!r.ok) throw new Error('GitHub HTTP '+r.status);
  const j=await r.json();
  return Array.isArray(j) ? j.filter(f=>f.type==='file') : [];
}
function _ghsReloadTab(){
  delete _ghsCache[_ghsTab];
  ghStoreTab(_ghsTab);
  showToast('🔄 Sincronizzazione con GitHub…');
}
function openGhStore(){
  try{ closeJsStore(); }catch(e){}
  document.getElementById('gh-store-modal').classList.remove('off');
  _ghsCache={}; ghStoreTab('js');
}
function closeGhStore(){ document.getElementById('gh-store-modal').classList.add('off'); }
function closeGhsPreview(){
  document.getElementById('ghs-prev-modal').classList.add('off');
  document.getElementById('ghs-prev-card').innerHTML='';
  document.getElementById('ghs-prev-note').textContent='';
}
async function _ghsPreview(enc, nm, cardId){
  const modal=document.getElementById('ghs-prev-modal');
  const container=document.getElementById('ghs-prev-card');
  const note=document.getElementById('ghs-prev-note');
  document.getElementById('ghs-prev-title').textContent='👁 '+nm;
  container.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:160px;color:var(--muted);font-size:12px">⏳ Carico anteprima…</div>';
  note.textContent='';
  modal.classList.remove('off');
  let regCard=cardId?window.FratechCardRegistry[cardId]:null;
  let isTemp=false;
  if(!regCard){
    // Prima prova localStorage (card locali o installate ma non ancora nel registry)
    if(cardId){
      try{
        const stored=_jsStoreList().find(i=>(i.meta||{}).id===cardId);
        if(stored&&stored.code){
          const res=_installCardCode(stored.code);
          const rid=(res.newCards&&res.newCards[0])||(res.tags&&res.tags[0])||cardId;
          regCard=window.FratechCardRegistry[rid]||window.FratechCardRegistry[cardId];
        }
      }catch(e){}
    }
    // Poi prova GitHub (card non installate con enc valido)
    if(!regCard&&enc){
      try{
        const f=_ghsFind(enc); if(!f) throw new Error('File non trovato in cache');
        const code=await _ghDownload(f);
        const res=_installCardCode(code);
        const id=(res.newCards&&res.newCards[0])||(res.tags&&res.tags[0]);
        regCard=id?window.FratechCardRegistry[id]:null;
        isTemp=true;
      }catch(e){
        container.innerHTML=`<div style="padding:16px;color:#f87171;font-size:12px;text-align:center">⚠️ Impossibile caricare l'anteprima:<br>${eh(e.message)}</div>`;
        return;
      }
    }
  }
  if(!regCard){
    container.innerHTML='<div style="padding:16px;color:var(--muted);font-size:12px;text-align:center">Nessuna card trovata nel file</div>';
    return;
  }
  const dummyCard={id:'__preview__',type:'js-custom',jsCardId:regCard.id,label:regCard.name||nm,icon:regCard.icon||'📦',color:'#818cf8',entity:'',colSpan:2,rowSpan:2};
  container.innerHTML='';
  container.style.minHeight='160px';
  try{
    if(regCard._lovelace){
      const tag=regCard._tag||regCard.id;
      const cel=document.createElement(tag);
      try{ cel.setConfig({type:'custom:'+tag}); }catch(e){}
      cel.classList.add('frarik-lovel');
      try{ cel.hass=_haHassObj(); }catch(e){}
      cel.style.cssText='display:block;width:100%;min-height:160px';
      container.appendChild(cel);
    } else {
      const html=regCard.render?regCard.render(dummyCard,_haHassObj()):'';
      container.innerHTML=`<div style="position:relative;width:100%;min-height:160px">${html}</div>`;
      if(typeof regCard.mount==='function') try{ regCard.mount(dummyCard,_haHassObj(),container); }catch(e){}
    }
  }catch(e){
    container.innerHTML=`<div style="padding:16px;color:#f87171;font-size:12px;text-align:center">Errore render: ${eh(e.message)}</div>`;
  }
  note.textContent=isTemp?'Anteprima temporanea — non ancora installata':'';
}
function ghStoreTab(tab){
  _ghsTab=tab;
  ['js','chips','distintivi','yaml','pkg','local'].forEach(t=>{ const b=document.getElementById('ghs-tab-'+t); if(b) b.classList.toggle('on',t===tab); });
  const s=document.getElementById('ghs-search'); if(s) s.value='';
  const loadEl=document.getElementById('ghs-load'); if(loadEl) loadEl.style.display=(tab==='local')?'':'none';
  if(tab==='local'){ _ghStoreRender(); _ghStoreInitDropzone(); return; }
  if(_ghsCache[tab]){ _ghStoreRender(); return; }
  document.getElementById('ghs-status').textContent='⏳ Carico da GitHub…';
  document.getElementById('ghs-list').innerHTML='';
  const f=_GHS_FOLDERS[tab];
  _ghListFolder(f.path).then(files=>{
    _ghsCache[tab]=files.filter(x=>f.ext.test(x.name)&&!(f.exclude&&f.exclude.test(x.name)));
    if(_ghsTab===tab) _ghStoreRender();
  }).catch(e=>{ document.getElementById('ghs-status').textContent='⚠️ '+e.message; });
}
function _ghStoreRender(){
  const tab=_ghsTab, list=document.getElementById('ghs-list'), status=document.getElementById('ghs-status');
  const q=(document.getElementById('ghs-search').value||'').toLowerCase().trim();
  if(tab==='local'){ _ghStoreRenderInstalled(q,'local'); return; }
  const folder=_GHS_FOLDERS[tab]; const g=_ghCfg();
  let files=(_ghsCache[tab]||[]).slice();
  if(q) files=files.filter(f=>f.name.toLowerCase().includes(q));
  status.textContent=(_ghsCache[tab]||[]).length+' file'+(q?(' · '+files.length+' trovati'):'');
  if(!files.length){ list.innerHTML=`<div class="ghs-empty">${q?'Nessun risultato per "'+eh(q)+'"':'Nessun file in questa cartella su GitHub'}</div>`; return; }
  const ico=folder.ico;
  const usedIds=new Set(); (cfg.pages||[]).forEach(pg=>(pg.cards||[]).forEach(c=>{ if(c.type==='js-custom'&&c.jsCardId) usedIds.add(c.jsCardId); }));
  list.innerHTML=files.filter(f=>f&&f.name).sort((a,b)=>a.name.localeCompare(b.name)).map(f=>{
    const nm=f.name.replace(/\.(js|ya?ml)$/i,'');
    const enc=encodeURIComponent(f.name);
    let acts;
    const prevEnc=enc.replace(/'/g,"\\'");
    const prevNm=nm.replace(/'/g,"\\'");
    const eyeBtn=(cid)=>`<button class="ghs-ibtn ghs-ibtn-eye" data-action="_ghsPreviewEl" data-penc="${prevEnc}" data-pnm="${prevNm}" data-pcid="${cid||''}" title="Anteprima"><i class="mdi mdi-eye-outline"></i></button>`;
    if(folder.kind==='install'){
      const known=g.shas[f.name];
      const idFile=g.idFile||{};
      const cardId=Object.keys(idFile).find(k=>idFile[k]===f.name)||null;
      const inDash=!!(cardId&&usedIds.has(cardId));
      if(!known){
        acts=`${eyeBtn(null)}<button class="ghs-btn ghs-btn-inst" data-action="_ghsInstall" data-action-arg="${enc}"><i class="mdi mdi-download"></i> Installa</button>`;
      } else {
        const updateBtn=(known!==f.sha)?`<button class="ghs-btn ghs-btn-upd" data-action="_ghsInstall" data-action-arg="${enc}"><i class="mdi mdi-update"></i> Aggiorna</button>`:'';
        const addBtn=cardId?(inDash?`<span class="ghs-badge ghs-badge-dash"><i class="mdi mdi-check-circle-outline"></i> In dashboard</span>`:`<button class="ghs-btn ghs-btn-inst" data-action="_jsStoreAddAndRefresh" data-action-args='["${cardId}"]'><i class="mdi mdi-plus"></i> Aggiungi</button>`)
          :`<button class="ghs-btn ghs-btn-inst" data-action="_ghsInstall" data-action-arg="${enc}"><i class="mdi mdi-download"></i> Installa</button>`;
        const delBtn=cardId?`<button class="ghs-ibtn ghs-ibtn-del" data-action="_ghsDeleteInstalled" data-action-arg="${cardId}" title="Disinstalla"><i class="mdi mdi-delete-outline"></i></button>`:'';
        acts=`${eyeBtn(cardId)}${updateBtn}${addBtn}${delBtn}`;
      }
    } else {
      // Scheda YAML: oltre a Copia/Download, "Aggiungi" crea una card YAML e la mette in dashboard.
      // (La scheda Pacchetti resta solo Copia/Download: sono config di backend, non card.)
      const addYaml = (tab==='yaml') ? `<button class="ghs-btn ghs-btn-inst" data-action="_ghsYamlAdd" data-action-arg="${enc}"><i class="mdi mdi-plus"></i> Aggiungi</button>` : '';
      acts=`${eyeBtn(null)}${addYaml}<button class="ghs-btn ghs-btn-cp" data-action="_ghsCopy" data-action-arg="${enc}"><i class="mdi mdi-content-copy"></i> Copia</button><button class="ghs-btn ghs-btn-cp" data-action="_ghsDownload" data-action-arg="${enc}"><i class="mdi mdi-download"></i></button>`;
    }
    return `<div class="ghs-row"><div class="ghs-ico">${ico}</div><div class="ghs-info"><div class="ghs-name">${eh(nm)}</div><div class="ghs-sub">${eh(f.name)}</div></div><div class="ghs-acts">${acts}</div></div>`;
  }).join('');
}
/* Schede "Installate" (origine github) e "Card locali" (origine local): gestisci le card installate */
function _ghStoreRenderInstalled(q, originFilter){
  const list=document.getElementById('ghs-list'), status=document.getElementById('ghs-status');
  // origine: 'github' = installata dallo store · 'local' = caricata da PC · vecchie senza tag → 'github'
  let items=_jsStoreList().filter(i=>((i.origin||'github')===originFilter));
  const all=items.length;
  if(q) items=items.filter(i=>((i.meta||{}).name||(i.meta||{}).id||'').toLowerCase().includes(q));
  const lbl=originFilter==='local'?'card locali':'card da GitHub';
  status.textContent=all+' '+lbl+(q?(' · '+items.length+' trovate'):'');
  if(!items.length){
    const msg = originFilter==='local'
      ? (q?'Nessun risultato':'Nessuna card locale.<br>Usa la zona qui sotto per caricare un file <code>.js</code> dal PC.')
      : (q?'Nessun risultato':'Nessuna card installata da GitHub.<br>Installale dalle schede ⚡ Card JS · 🔹 Chips · 🏷️ Distintivi.');
    list.innerHTML=`<div class="ghs-empty">${msg}</div>`; return;
  }
  const usedIds=new Set(); (cfg.pages||[]).forEach(pg=>(pg.cards||[]).forEach(c=>{ if(c.type==='js-custom'&&c.jsCardId) usedIds.add(c.jsCardId); }));
  list.innerHTML=items.sort((a,b)=>((a.meta||{}).name||'').localeCompare((b.meta||{}).name||'')).map(i=>{
    const m=i.meta||{}; const inUse=usedIds.has(m.id); const id=m.id||'';
    const act = inUse ? `<span class="ghs-badge ghs-badge-dash"><i class="mdi mdi-check-circle-outline"></i> In dashboard</span>`
                      : `<button class="ghs-btn ghs-btn-inst" data-action="_jsStoreAddAndRefresh" data-action-args='["${id}"]'><i class="mdi mdi-plus"></i> Aggiungi</button>`;
    const pub = originFilter==='local' ? `<button class="ghs-btn ghs-btn-upd" data-action="_ghsPublish" data-action-arg="${id}" title="Pubblica su GitHub"><i class="mdi mdi-upload"></i> Pubblica</button>` : '';
    const safePrevNm=(m.name||id).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const previewBtn=`<button class="ghs-ibtn ghs-ibtn-eye" data-action="_ghsPreview" data-action-args='["","${safePrevNm}","${id}"]' title="Anteprima"><i class="mdi mdi-eye-outline"></i></button>`;
    return `<div class="ghs-row"><div class="ghs-ico">${m.icon||'📦'}</div>
      <div class="ghs-info"><div class="ghs-name">${eh(m.name||id||'Card')}</div><div class="ghs-sub">ID: ${eh(id||'?')} · v${eh(m.version||'?')}</div></div>
      <div class="ghs-acts">${previewBtn}${pub}${act}<button class="ghs-ibtn ghs-ibtn-del" data-action="_ghsDeleteInstalled" data-action-arg="${id}" title="Disinstalla"><i class="mdi mdi-delete-outline"></i></button></div></div>`;
  }).join('');
}
function _ghsDeleteInstalled(id){
  if(!id) return;
  const it=_jsStoreList().find(i=>(i.meta||{}).id===id); const nm=(it&&it.meta&&it.meta.name)||id;
  showConfirm(`Eliminare la card <b>${eh(nm)}</b> dalle installate?<br><span style="font-size:11px;opacity:.7">Le card di questo tipo già messe in dashboard mostreranno un errore.</span>`, ()=>{
    _jsStoreDelete(id);
    try{ delete window.FratechCardRegistry[id]; }catch(e){}
    // libera lo sha del file corrispondente, così ricompare come "Installa" nello store
    try{ const g=_ghCfg(); if(g.idFile&&g.idFile[id]){ delete g.shas[g.idFile[id]]; delete g.idFile[id]; } saveCfg(); _haSaveCfg(); }catch(e){}
    if(typeof _epRenderJsStore==='function') _epRenderJsStore();
    // NON svuotiamo _ghsCache: la lista GitHub è già in cache, la card riappare con "Installa"
    renderDash(); _ghStoreRender(); showToast('🗑 Card disinstallata');
  }, 'Elimina');
}
function _ghStoreInitDropzone(){
  const dz=document.getElementById('ghs-dropzone'); if(!dz||dz._init) return; dz._init=true;
  dz.ondragover=e=>{ e.preventDefault(); dz.classList.add('drag-over'); };
  dz.ondragleave=()=>dz.classList.remove('drag-over');
  dz.ondrop=e=>{ e.preventDefault(); dz.classList.remove('drag-over'); if(e.dataTransfer.files[0]) jsStoreLoadFile(e.dataTransfer.files[0]); };
}

/* ════════ PUBBLICA una card locale su GitHub (richiede token con scrittura) ════════ */
let _ghPubId=null;
function _ghsPublish(id){
  const it=_jsStoreList().find(i=>(i.meta||{}).id===id);
  if(!it){ showToast('⚠️ Card non trovata'); return; }
  if(!_ghCfg().token){ showToast('🔑 Manca il token GitHub — aprilo con l\'⚙️ e incollalo'); openGitHubCfg(); return; }
  _ghPubId=id;
  document.getElementById('ghpub-name').value=(it.meta||{}).name||id;
  const base=(id||(it.meta||{}).name||'card').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'');
  document.getElementById('ghpub-file').value=/\.js$/i.test(base)?base:base+'.js';
  document.getElementById('ghpub-folder').value='card-js';
  document.getElementById('ghpub-status').textContent='';
  document.getElementById('ghpub').classList.remove('off');
}
function closeGhPub(){ document.getElementById('ghpub').classList.add('off'); }
async function _ghPublishDo(){
  const id=_ghPubId; if(!id) return;
  const it=_jsStoreList().find(i=>(i.meta||{}).id===id); if(!it){ showToast('⚠️ Card non trovata'); return; }
  const st=document.getElementById('ghpub-status');
  if(!_ghCfg().token){ st.innerHTML='<span style="color:#f87171">Manca il token GitHub (⚙️)</span>'; return; }
  const folder=document.getElementById('ghpub-folder').value;
  let file=(document.getElementById('ghpub-file').value||'').trim();
  if(!file){ st.innerHTML='<span style="color:#f87171">Inserisci il nome del file</span>'; return; }
  if(!/\.js$/i.test(file)) file+='.js';
  file=file.replace(/\s+/g,'-');
  const path=folder+'/'+file;
  st.innerHTML='<span style="color:#fbbf24">⏳ Pubblico su GitHub…</span>';
  try{
    await _ghPut(path, it.code, 'Pubblica '+file+' da Frarik');
    // ora è su GitHub → diventa una card "github" (esce da Card locali, entra in Installate)
    try{
      _jsStoreSave(id, it.meta, it.code, 'github');
      const g=_ghCfg(); g.idFile=g.idFile||{}; g.idFile[id]=file; saveCfg(); _haSaveCfg();
    }catch(e){}
    _ghsCache={};
    st.innerHTML='<span style="color:#4ade80">✅ Pubblicata in '+folder+'/'+file+'</span>';
    showToast('📤 Card pubblicata su GitHub!');
    setTimeout(()=>{ closeGhPub(); if(!document.getElementById('gh-store-modal').classList.contains('off')) ghStoreTab('local'); }, 1000);
  }catch(e){ st.innerHTML='<span style="color:#f87171">⚠️ '+e.message+'</span>'; }
}
/* Crea o aggiorna un file nel repo via GitHub API (PUT). Serve il token in g.token. */
async function _ghPut(path, content, message){
  const g=_ghCfg();
  if(!g.owner||!g.repo) throw new Error('Configura proprietario/repository');
  if(!g.token) throw new Error('Manca il token GitHub');
  const branch=g.branch||'main';
  const base=`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const H={'Authorization':'token '+g.token,'Accept':'application/vnd.github.v3+json'};
  // se il file esiste già serve il suo sha per aggiornarlo
  let sha=null;
  try{ const gr=await fetch(base+'?ref='+encodeURIComponent(branch),{headers:H}); if(gr.ok){ const gj=await gr.json(); sha=gj.sha||null; } }catch(e){}
  const body={ message:message||('Aggiorna '+path), content:_b64utf8(content), branch };
  if(sha) body.sha=sha;
  const r=await fetch(base,{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},H),body:JSON.stringify(body)});
  if(r.status===401||r.status===403) throw new Error('GitHub ha rifiutato (403). Serve un token "classic" con permesso "repo" E aver accettato l\'invito come collaboratore.');
  if(r.status===404) throw new Error('Repo non raggiungibile (404): probabilmente l\'invito come collaboratore non è stato accettato, o il token non ha accesso al repo.');
  if(!r.ok){ let m=''; try{ m=(await r.json()).message; }catch(e){} throw new Error('GitHub HTTP '+r.status+(m?' — '+m:'')); }
  return await r.json();
}
function _b64utf8(str){ return btoa(unescape(encodeURIComponent(str))); }   // base64 UTF-8 per l'API GitHub
function _ghsFind(name){ name=decodeURIComponent(name); return (_ghsCache[_ghsTab]||[]).find(f=>f.name===name); }
async function _ghsInstall(name){
  const f=_ghsFind(name); if(!f) return;
  showToast('⬇️ Installo '+f.name+'…');
  try{
    await _ghInstallFile(f); saveCfg(); _haSaveCfg();
    if(typeof _jsStoreRenderList==='function') _jsStoreRenderList();
    if(typeof _epRenderJsStore==='function') _epRenderJsStore();
    showToast('✅ '+f.name+' installata — usa ➕ Aggiungi per metterla in dashboard'); _ghStoreRender();
  }catch(e){ showToast('⚠️ Errore: '+e.message); }
}
async function _ghsCopy(name){
  const f=_ghsFind(name); if(!f) return;
  let txt; try{ txt=await _ghDownload(f); }catch(e){ showToast('⚠️ '+e.message); return; }
  if(navigator.clipboard && window.isSecureContext){
    try{ await navigator.clipboard.writeText(txt); showToast('📋 "'+f.name+'" copiata negli appunti'); return; }catch(e){}
  }
  // fallback per HTTP locale (contesto non sicuro): textarea + execCommand
  try{
    const ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.top='-1000px'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('📋 "'+f.name+'" copiata negli appunti');
  }catch(e){ showToast('⚠️ Copia non riuscita — usa ⬇️ per scaricare il file'); }
}
async function _ghsDownload(name){
  const f=_ghsFind(name); if(!f) return;
  try{ const txt=await _ghDownload(f); const b=new Blob([txt],{type:'text/plain'}); const u=URL.createObjectURL(b);
    const a=document.createElement('a'); a.href=u; a.download=f.name; a.click(); setTimeout(()=>URL.revokeObjectURL(u),1000);
    showToast('⬇️ Scarico '+f.name);
  }catch(e){ showToast('⚠️ Download non riuscito: '+e.message); }
}
/* Scheda YAML dello store → "Aggiungi alla dashboard": scarica il file YAML dal repo, apre l'import
   precompilato e genera l'anteprima. L'utente conferma con "Aggiungi" (riusa il flusso yaml-card). */
async function _ghsYamlAdd(name){
  const f=_ghsFind(name); if(!f){ showToast('⚠️ File non trovato'); return; }
  showToast('⬇️ Carico '+f.name+'…');
  let txt; try{ txt=await _ghDownload(f); }catch(e){ showToast('⚠️ '+(e.message||e)); return; }
  try{ closeGhStore(); }catch(e){}
  openYamlImport();
  const inp=document.getElementById('yaml-inp'); if(inp) inp.value=txt;
  try{ await yamlImportParse(); }catch(e){}   // genera l'anteprima; poi l'utente preme "Aggiungi"
}
function _ghSchedule(){
  clearInterval(_ghTimer);
  const g=_ghCfg();
  if(g.owner&&g.repo&&g.auto!==false){
    _ghTimer=setInterval(()=>{ if(!document.hidden) _ghCheck(false); }, 5*60*1000);
  }
}



/* ═══ WEBSOCKET ═══ */
let covTimer=null;
/* ── Connessione con fallback LOCALE → REMOTO ──
   Prova prima l'origine da cui apri la pagina (locale). Se non risponde, prova l'indirizzo remoto
   salvato (es. Nabu Casa). Così la stessa pagina/bookmark funziona a casa (WiFi) e fuori (dati). */
let _connTargets=[], _connIdx=0, _connBusy=false, _connOk=false, _lastTriedHost='', _everConnected=false, _dashBuilt=false;
function _buildConnTargets(){
  const t=[];
  if((location.protocol==='http:'||location.protocol==='https:')&&location.host) t.push({host:location.host,base:location.origin});
  const rem=((localStorage.getItem('hadb_remote')||'').trim())||REMOTE_URL_DEFAULT;
  if(rem){ try{ const u=new URL(rem.startsWith('http')?rem:'https://'+rem); if(!t.some(x=>x.host===u.host)) t.push({host:u.host,base:u.origin}); }catch(e){} }
  if(!t.length) t.push({host:HA_HOST,base:BASE});
  return t;
}
function connect(){
  clearTimeout(covTimer); clearTimeout(reconn);
  if(_connIdx===0) _connTargets=_buildConnTargets();
  if(_connIdx>=_connTargets.length) _connIdx=0;
  _connBusy=true; _connOk=false;
  const tgt=_connTargets[_connIdx]; HA_HOST=tgt.host; BASE=tgt.base; _lastTriedHost=tgt.host;
  const cm=document.getElementById('cmsg'); if(cm) cm.textContent='Connessione a '+tgt.host+'…';
  covTimer=setTimeout(_connFail,12000);
  try{
    const proto=BASE.startsWith('https')?'wss':'ws';
    ws=new WebSocket(`${proto}://${HA_HOST}/api/websocket`);
    ws.onopen=()=>setC('wait');
    ws.onmessage=e=>onMsg(JSON.parse(e.data));
    ws.onclose=()=>{
      if(_connOk){ _connOk=false; setC('off'); clearTimeout(covTimer); Object.keys(_fcSubMap).forEach(k=>delete _fcSubMap[k]); reconn=setTimeout(connect,5000); }
      else _connFail();
    };
    ws.onerror=()=>{ try{ws.close();}catch(e){} };
  }catch(e){ _connFail(); }
}
function _connFail(){
  if(!_connBusy) return; _connBusy=false;
  clearTimeout(covTimer); setC('off');
  try{ ws.close(); }catch(e){}
  if(_connIdx<_connTargets.length-1){ _connIdx++; reconn=setTimeout(connect,300); return; }
  // tutti i target falliti
  _connIdx=0;
  if(_everConnected){
    // già connesso almeno una volta → riconnessione SILENZIOSA in background (solo pallino),
    // NON copriamo la plancia/header con l'overlay (così il tasto ☰ resta sempre visibile)
    reconn=setTimeout(connect,3000);
    return;
  }
  // prima connessione mai riuscita → mostra overlay con campo indirizzo/token
  const cm=document.getElementById('cmsg'); if(cm) cm.innerHTML='⚠️ Home Assistant non raggiungibile<br><span style="font-size:10px;opacity:.6">ultimo tentativo: '+(_lastTriedHost||'?')+'</span>';
  const skip=document.getElementById('cov-skip'); if(skip) skip.style.display='';
  const rbox=document.getElementById('cov-remote-box'); if(rbox) rbox.style.display='';
  const cov=document.getElementById('cov'); if(cov) cov.classList.remove('off');
  reconn=setTimeout(connect,8000);
}
function saveRemoteAndRetry(){
  const v=(document.getElementById('cov-remote-url')?.value||'').trim();
  if(v) localStorage.setItem('hadb_remote',v); else localStorage.removeItem('hadb_remote');
  const tk=(document.getElementById('cov-token')?.value||'').trim();
  if(tk){ TOKEN=tk; localStorage.setItem('hadb_token',tk); }
  const rbox=document.getElementById('cov-remote-box'); if(rbox) rbox.style.display='none';
  const cm=document.getElementById('cmsg'); if(cm) cm.textContent='Connessione…';
  const cov=document.getElementById('cov'); if(cov) cov.classList.remove('off');
  _connTargets=[]; _connIdx=0; _connBusy=false; clearTimeout(reconn);
  connect();
}
function send(p){ p.id=mid++; ws.send(JSON.stringify(p)); }
/* Promise-based WS request — usato per lovelace/resources, entity_registry, ecc. */
const _wsCbs={};
function sendAndWait(p,timeout=10000){
  return new Promise(resolve=>{
    const id=mid++; const msg=Object.assign({},p,{id});
    _wsCbs[id]=resolve;
    try{ ws.send(JSON.stringify(msg)); }catch(e){ delete _wsCbs[id]; resolve(null); return; }
    setTimeout(()=>{ if(_wsCbs[id]){ delete _wsCbs[id]; resolve(null); } },timeout);
  });
}

/* ═══ FORECAST SUBSCRIPTION (HA 2023.9+) ═══ */
const _fcData={}; // entityId → forecast array
const _fcSubMap={}; // subscriptionId → entityId

function _subscribeForecast(entityId){
  if(!entityId||!ws||ws.readyState!==1) return;
  if(Object.values(_fcSubMap).includes(entityId)) return; // already subscribed
  const id=mid++;
  _fcSubMap[id]=entityId;
  ws.send(JSON.stringify({id,type:'weather/subscribe_forecast',forecast_type:'daily',entity_id:entityId}));
}
function _subscribeAllForecasts(){
  if(!cfg) return;
  cfg.pages.forEach(p=>(p.cards||[]).forEach(c=>{
    if((c.type==='weather'||c.type==='weather-forecast'||c.type==='weather-hero')&&c.entity)
      _subscribeForecast(c.entity);
  }));
}
function _refreshWeatherCards(entityId){
  curPage()?.cards?.filter(c=>c.entity===entityId&&(c.type==='weather'||c.type==='weather-forecast')).forEach(c=>{
    const w=document.getElementById('v-'+c.id); if(!w) return;
    if(_wtTimers[c.id]){ clearTimeout(_wtTimers[c.id]); delete _wtTimers[c.id]; }
    w.innerHTML=c.type==='weather-forecast'?weatherForecastInner(c):weatherCompactInner(c);
    _initWeatherBG(c.id, hs[entityId]||'unknown');
  });
}

function onMsg(m){
  if(m.type==='auth_required') ws.send(JSON.stringify({type:'auth',access_token:TOKEN}));
  else if(m.type==='auth_ok'){
    clearTimeout(covTimer);
    _connBusy=false; _connOk=true; _everConnected=true;   // connessione attiva → riconnessioni future in background
    setC('on');
    document.getElementById('cov').classList.add('off');
    const rbox=document.getElementById('cov-remote-box'); if(rbox) rbox.style.display='none';
    send({type:'get_states'});
    send({type:'subscribe_events',event_type:'state_changed'});
    _haLoadCfg(true);   // sincronizza la configurazione dai dati utente di HA
  }
  else if(m.type==='auth_invalid'){
    _connBusy=false; _connOk=false;          // ferma fallback/auto-retry (col token sbagliato è inutile)
    clearTimeout(covTimer); clearTimeout(reconn);
    // Auto-recupero: se stavamo usando un token SALVATO (magari vecchio/non valido), scartalo e
    // riprova col token predefinito valido → evita le notifiche "Login attempt failed" ripetute.
    if(TOKEN!==TOKEN_DEFAULT){
      try{ localStorage.removeItem('hadb_token'); }catch(e){}
      TOKEN=TOKEN_DEFAULT; setC('wait');
      reconn=setTimeout(connect,400);
      return;
    }
    setC('off');
    const cm=document.getElementById('cmsg'); if(cm) cm.innerHTML='🔑 Token di accesso non valido<br><span style="font-size:10px;opacity:.6">Crea un token in Profilo HA → Token a lunga durata e incollalo qui sotto</span>';
    const skip=document.getElementById('cov-skip'); if(skip) skip.style.display='';
    const rbox=document.getElementById('cov-remote-box'); if(rbox) rbox.style.display='';
    const cov=document.getElementById('cov'); if(cov) cov.classList.remove('off');
  }
  // Esito salvataggio config su HA (frontend/set_user_data)
  else if(m.type==='result'&&m.id===_cfgSetId){
    _cfgSetId=-1;
    const isManual=(m.id===_cfgManualSyncId); if(isManual) _cfgManualSyncId=-1;
    if(m.success){
      // Conferma SOLO per la sincronizzazione manuale; gli auto-salvataggi sono silenziosi.
      if(isManual){
        const np=(cfg.pages||[]).length, nj=(typeof _jsStoreList==='function'?_jsStoreList().length:0);
        showToast('☁️ Sincronizzato su Home Assistant — '+np+' pagine, '+nj+' card');
      }
    } else {
      showToast('⚠️ Sincronizzazione fallita: '+((m.error&&m.error.message)||'dati troppo grandi'));
    }
  }
  // Risposta sincronizzazione config (frontend/get_user_data)
  else if(m.type==='result'&&m.id===_cfgGetId){
    _cfgGetId=-1; _cfgSynced=true;   // d'ora in poi le modifiche locali si auto-salvano su HA
    const v=(m.success&&m.result&&m.result.value)?m.result.value:null;
    // formati: nuovo {_ts,cfg,js} · vecchio = cfg diretto (con .pages)
    const remoteCfg = v ? (v.cfg&&v.cfg.pages ? v.cfg : (v.pages ? v : null)) : null;
    const remoteTs  = v ? (v._ts || (remoteCfg&&remoteCfg._ts) || 0) : 0;
    const remoteJs  = (v&&Array.isArray(v.js)) ? v.js : null;
    if(remoteCfg && remoteCfg.pages && remoteTs>(cfg._ts||0)){
      // HA ha una versione più recente → adottala su questo dispositivo
      _cfgSyncing=true;
      // 1) RICONCILIA le card allo stato remoto. Stiamo adottando la versione più recente "per
      //    intero", quindi oltre ad aggiungere/aggiornare le card remote rimuoviamo anche quelle
      //    locali che NON esistono più nel set remoto: così una card eliminata su un dispositivo
      //    non "risorge" sugli altri (causa principale del conteggio gonfiato). Lo facciamo SOLO se
      //    il remoto porta davvero la lista js (Array): col formato vecchio (js assente) non si tocca nulla.
      if(Array.isArray(remoteJs) && typeof _jsStoreSave==='function'){
        remoteJs.forEach(it=>{ try{ if(it&&it.meta&&it.meta.id){ _jsStoreSave(it.meta.id,it.meta,it.code,it.origin); if(!window.FratechCardRegistry[it.meta.id]) try{ _installCardCode(it.code); }catch(e){} } }catch(e){} });
        const remoteIds=new Set(remoteJs.map(it=>it&&it.meta&&it.meta.id).filter(Boolean));
        try{ _jsStoreList().forEach(it=>{ const id=it&&it.meta&&it.meta.id; if(id && !remoteIds.has(id)){ _jsStoreDelete(id); try{ delete window.FratechCardRegistry[id]; }catch(e){} } }); }catch(e){}
      }
      // 2) adotta il layout
      cfg=remoteCfg; cfg._ts=remoteTs;
      if(!cfg.savedCards) cfg.savedCards=[];
      cfg.activePage=Math.min(cfg.activePage||0,(cfg.pages.length||1)-1);
      _saveCfgLocalOnly();
      try{ applyTheme(cfg.theme); }catch(e){}
      renderDash(); renderPageTabs();
      _cfgSyncing=false;
      try{ _histInit(); }catch(e){}   // reset cronologia sullo stato sincronizzato
      showToast('☁️ Configurazione e card sincronizzate da Home Assistant');
      try{ _ghSchedule(); }catch(e){}   // la config GitHub potrebbe essere arrivata dalla sync
    }
    // se il locale è più recente o HA è vuoto NON si fa nulla in automatico:
    // l'invio su HA avviene solo col pulsante "Sincronizza" (evita sovrascritture accidentali).
  }
  else if(m.type==='result'&&Array.isArray(m.result)){
    m.result.forEach(e=>{ if(e&&e.entity_id){ hs[e.entity_id]=e.state; ha[e.entity_id]=e.attributes||{}; }});
    allE=m.result.filter(e=>e&&e.entity_id).sort((a,b)=>a.entity_id.localeCompare(b.entity_id));
    if(!_dashBuilt){
      // PRIMA costruzione della dashboard
      _dashBuilt=true;
      renderDash();
      try{ renderHdrChips(); }catch(e){}
      _restoreUIState();
      try{ _histInit(); }catch(e){}   // inizializza la cronologia Annulla/Ripeti
      try{ _ghSchedule(); setTimeout(()=>{ try{ _ghCheck(false); }catch(e){} }, 1000); }catch(e){}  // controllo aggiornamenti card GitHub
      setTimeout(()=>{ try{ _loadLovelaceResources(); }catch(e){} }, 2000);  // carica risorse HACS
      try{ _ntfUpdateBell(); }catch(e){}
    } else {
      // RICONNESSIONE: la dashboard è già costruita → aggiorna i VALORI in posto, niente rebuild (niente "scatto")
      try{ (curPage().cards||[]).forEach(c=>{ try{ updateCardEl(c); }catch(e){} }); }catch(e){}
      try{ renderBadgesAll(); }catch(e){}
    }
    _subscribeAllForecasts(); // subscribe after cfg+entities are loaded
  }
  // Forecast subscription event (HA 2023.9+)
  else if(m.type==='event'&&_fcSubMap[m.id]){
    const eid=_fcSubMap[m.id];
    const fc=m.event?.forecast;
    if(Array.isArray(fc)){ _fcData[eid]=fc; _refreshWeatherCards(eid); }
  }
  else if(m.type==='event'&&m.event?.event_type==='state_changed'){
    const d=m.event.data;
    const prevState=hs[d.entity_id];
    hs[d.entity_id]=d.new_state?.state;
    ha[d.entity_id]=d.new_state?.attributes||{};
    liveUpdate(d.entity_id);
    _notifCheck(d.entity_id, prevState, d.new_state?.state);
  }
  // Risposta generica per sendAndWait()
  else if(m.id!=null && _wsCbs[m.id]){ const cb=_wsCbs[m.id]; delete _wsCbs[m.id]; cb(m); }
}
function setC(s){
  const dot=document.getElementById('conn-dot');
  const lbl=document.getElementById('conn-lbl');
  if(dot) dot.className='';
  if(s==='on'){dot?.classList.add('ok');if(lbl){lbl.textContent='Connesso';lbl.style.color='#4ade80';}}
  else if(s==='wait'){dot?.classList.add('wait');if(lbl){lbl.textContent='…';lbl.style.color='#fbbf24';}}
  else{if(lbl){lbl.textContent='Disconnesso';lbl.style.color='#f87171';}}
  // aggiorna chip conn nell'header bar
  document.querySelectorAll('.hbar-inner[data-id]').forEach(el=>{
    const card=curPage()?.cards?.find(c=>c.id===el.dataset.id);
    if(card&&(card.left||[]).concat(card.center||[],card.right||[]).some(ch=>ch?.type==='conn'))
      el.innerHTML=hbarInner(card);
  });
}
function callSvc(domain,svc,entityId,data={}){
  send({type:'call_service',domain,service:svc,service_data:{entity_id:entityId,...data}});
}

/* ═══ HISTORY API ═══ */
async function fetchHistory(entityId,hours=24){
  try{
    const start=new Date(Date.now()-hours*3600000).toISOString();
    const r=await fetch(`${BASE}/api/history/period/${start}?filter_entity_id=${entityId}&minimal_response=true&significant_changes_only=false`,
      {headers:{Authorization:`Bearer ${TOKEN}`}});
    const data=await r.json();
    return (data[0]||[]).map(p=>({t:new Date(p.last_changed),v:parseFloat(p.state)})).filter(p=>!isNaN(p.v));
  }catch(e){return[];}
}

/* ═══ CAMERA ═══ */
async function refreshCamera(cardId,entityId){
  try{
    const r=await fetch(`${BASE}/api/camera_proxy/${entityId}?_=${Date.now()}`,{headers:{Authorization:`Bearer ${TOKEN}`}});
    if(!r.ok) return;
    const blob=await r.blob();
    const img=document.getElementById('cam-'+cardId);
    if(!img) return;
    if(img._burl) URL.revokeObjectURL(img._burl);
    img._burl=URL.createObjectURL(blob);
    img.src=img._burl;
    img.style.display='block';
    const err=document.getElementById('camer-'+cardId);
    if(err) err.style.display='none';
  }catch(e){
    const err=document.getElementById('camer-'+cardId);
    if(err) err.style.display='flex';
  }
}
function startCamTimer(card){
  stopCamTimer(card.id);
  refreshCamera(card.id,card.entity);
  camTimers[card.id]=setInterval(()=>refreshCamera(card.id,card.entity),(card.refresh||5)*1000);
}
function stopCamTimer(id){ if(camTimers[id]){ clearInterval(camTimers[id]); delete camTimers[id]; } }

/* ═══ GAUGE SVG ═══ */
function gaugeSVG(value,min,max,color,unit){
  const pct=Math.min(1,Math.max(0,(parseFloat(value)-min)/(max-min)));
  const R=42,cx=60,cy=64;
  const startA=135,sweepA=270;
  function pt(a){ const r=a*Math.PI/180; return [cx+R*Math.cos(r),cy+R*Math.sin(r)]; }
  function arc(a1,a2,col,sw=8){
    const [x1,y1]=pt(a1),[x2,y2]=pt(a2);
    const large=(a2-a1)>180?1:0;
    return `<path d="M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
  }
  const endA=startA+sweepA*pct;
  const dispV=isNaN(parseFloat(value))?'—':(parseFloat(value)%1===0?parseFloat(value):parseFloat(value).toFixed(1));
  const isLight=cfg.theme==='light';
  const arcBg=isLight?'rgba(15,23,42,0.1)':'rgba(255,255,255,0.07)';
  const fillMain=isLight?'#0f172a':'white';
  const fillSub=isLight?'rgba(15,23,42,0.35)':'rgba(255,255,255,0.3)';
  const fillMin=isLight?'rgba(15,23,42,0.2)':'rgba(255,255,255,0.18)';
  const ff=`'${cfg.font||'Inter'}',sans-serif`;
  return `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    ${arc(startA,startA+sweepA,arcBg)}
    ${pct>0?arc(startA,endA,color):''}
    <text x="${cx}" y="${cy-4}" text-anchor="middle" dominant-baseline="middle" fill="${fillMain}" font-size="19" font-weight="900" font-family="${ff}">${dispV}</text>
    <text x="${cx}" y="${cy+13}" text-anchor="middle" fill="${fillSub}" font-size="9" font-family="${ff}">${unit}</text>
    <text x="${cx}" y="94" text-anchor="middle" fill="${fillMin}" font-size="7" font-family="${ff}">${min} — ${max}</text>
  </svg>`;
}

/* ═══ FLOW BARS (stile app screenshot) ═══ */
function buildFlowBarsRows(card){
  const sVal=parseFloat(hs[card.solar]||0);
  const lVal=parseFloat(hs[card.load]||0);
  const gVal=parseFloat(hs[card.grid]||0);
  const bVal=card.battery?parseFloat(hs[card.battery]||0):null;
  const mx=card.max||6000;

  const rows=[];
  if(card.solar){
    const v=Math.max(0,sVal);
    rows.push({ico:'☀️',lbl:'Solare',sub:'',val:v,color:'#fbbf24',pct:Math.min(100,(v/mx)*100)});
  }
  if(card.grid){
    // positive = esportazione (inverter convention), negative = prelievo
    const isExp=gVal>=0;
    const v=Math.abs(gVal);
    rows.push({ico:isExp?'↑':'↓',lbl:isExp?'Immissione':'Prelievo',sub:isExp?'In rete':'Dalla rete',val:v,color:isExp?'#4ade80':'#f87171',pct:Math.min(100,(v/mx)*100)});
  }
  if(card.battery&&bVal!==null){
    const isCh=bVal>=0;
    const v=Math.abs(bVal);
    rows.push({ico:'🔋',lbl:'Batteria',sub:isCh?'In carica':'In scarica',val:v,color:isCh?'#60a5fa':'#fb923c',pct:Math.min(100,(v/mx)*100)});
  }
  if(card.load){
    const v=Math.max(0,lVal);
    rows.push({ico:'🏠',lbl:'Consumo',sub:'',val:v,color:'#818cf8',pct:Math.min(100,(v/mx)*100)});
  }

  return rows.map(r=>`
    <div class="fb-row">
      <div class="fb-top">
        <span class="fb-ico">${r.ico}</span>
        <span class="fb-lbl">${eh(r.lbl)}</span>
        ${r.sub?`<span class="fb-sub">${r.sub}</span>`:''}
        <span class="fb-val" style="color:${r.color}">${Math.round(r.val)}<span class="fb-u">W</span></span>
      </div>
      <div class="fb-track">
        <div class="fb-fill" style="width:${r.pct.toFixed(1)}%;background:${r.color}">
          <div class="fb-shim"></div>
        </div>
      </div>
    </div>`).join('');
}

/* ═══ FLOW MAP SVG (nodi animati) ═══ */
function flowMapSVG(card){
  const solar=Math.max(0,parseFloat(hs[card.solar]||0));
  const load=Math.max(0,parseFloat(hs[card.load]||0));
  const grid=parseFloat(hs[card.grid]||0);
  const bat=card.battery?parseFloat(hs[card.battery]||0):null;
  const fid='f'+card.id.slice(1,5);

  // Positions: solar(150,28) house(150,108) grid(38,108) bat(150,180)
  const nd={
    solar:{x:150,y:28,r:22,ico:'☀️',col:'#fbbf24',val:solar>0?Math.round(solar)+'W':''},
    house:{x:150,y:108,r:26,ico:'🏠',col:'#818cf8',val:load>0?Math.round(load)+'W':''},
    grid: {x:38,y:108,r:22,ico:'⚡',col:grid>=0?'#4ade80':'#f87171',val:Math.abs(grid)>5?Math.round(Math.abs(grid))+'W':''},
    ...(bat!==null?{bat:{x:150,y:180,r:22,ico:'🔋',col:bat>=0?'#60a5fa':'#fb923c',val:Math.round(Math.abs(bat))+'W'}}:{})
  };

  const makeDur=p=>Math.max(0.45,2.4-p/2000).toFixed(2);

  // Flows
  const flows=[];
  if(solar>0) flows.push({x1:150,y1:50,dx:0,dy:32,p:solar,col:'#fbbf24'});
  if(Math.abs(grid)>5){
    if(grid>=0) flows.push({x1:124,y1:108,dx:-64,dy:0,p:grid,col:'#4ade80'});   // export
    else        flows.push({x1:60,y1:108,dx:64,dy:0,p:-grid,col:'#f87171'});     // import
  }
  if(bat!==null&&Math.abs(bat)>5){
    if(bat>=0) flows.push({x1:150,y1:134,dx:0,dy:22,p:bat,col:'#60a5fa'});
    else       flows.push({x1:150,y1:158,dx:0,dy:-24,p:-bat,col:'#fb923c'});
  }

  let s=`<svg viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">`;
  s+=`<defs><filter id="${fid}"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;

  // Background connection lines
  const _fmLine=cfg.theme==='light'?'rgba(15,23,42,0.1)':'rgba(255,255,255,0.06)';
  s+=`<line x1="150" y1="50" x2="150" y2="82" stroke="${_fmLine}" stroke-width="8" stroke-linecap="round"/>`;
  s+=`<line x1="60" y1="108" x2="124" y2="108" stroke="${_fmLine}" stroke-width="8" stroke-linecap="round"/>`;
  if(bat!==null) s+=`<line x1="150" y1="134" x2="150" y2="158" stroke="${_fmLine}" stroke-width="8" stroke-linecap="round"/>`;

  // Animated dots
  flows.forEach(f=>{
    const dur=makeDur(f.p);
    for(let i=0;i<3;i++){
      const del=(i*parseFloat(dur)/3).toFixed(2);
      s+=`<circle cx="${f.x1}" cy="${f.y1}" r="4.5" fill="${f.col}" opacity="0" filter="url(#${fid})">
        <animateMotion dur="${dur}s" begin="${del}s" repeatCount="indefinite" path="M0,0 L${f.dx},${f.dy}"/>
        <animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.08;0.88;1" dur="${dur}s" begin="${del}s" repeatCount="indefinite"/>
      </circle>`;
    }
  });

  // Node circles + icons + values
  Object.values(nd).forEach(n=>{
    s+=`<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.col}1c" stroke="${n.col}" stroke-width="1.5"/>`;
    s+=`<text x="${n.x}" y="${n.y+1}" text-anchor="middle" dominant-baseline="middle" font-size="${n.r>22?16:14}">${n.ico}</text>`;
    if(n.val) s+=`<text x="${n.x}" y="${n.y+n.r+9}" text-anchor="middle" fill="${n.col}" font-size="8.5" font-weight="700" font-family="Inter,sans-serif">${n.val}</text>`;
  });

  s+=`</svg>`;
  return s;
}

/* ═══ WEATHER HTML ═══ */
function weatherInner(entityId,color){
  const st=hs[entityId]||'unknown';
  const at=ha[entityId]||{};
  const ico=WI[st]||'🌡️';
  const temp=at.temperature!==undefined?at.temperature+'°':'?°';
  const hum=at.humidity!==undefined?at.humidity+'%':'';
  const wind=at.wind_speed!==undefined?Math.round(at.wind_speed)+' km/h':'';
  const cond=_stateIt(st);
  return `<div class="wth-ico" style="color:${color}">${ico}</div>
    <div class="wth-temp" style="color:${color}">${temp}</div>
    <div class="wth-cond">${cond}</div>
    <div class="wth-row">
      ${hum?`<span class="wth-chip">💧 ${hum}</span>`:''}
      ${wind?`<span class="wth-chip">💨 ${wind}</span>`:''}
      ${at.pressure?`<span class="wth-chip">🌡 ${at.pressure} hPa</span>`:''}
    </div>`;
}

/* ═══ WEATHER-HERO HTML ═══ */
function weatherHeroInner(card){
  const eid=card.entity;
  const st=hs[eid]||'unknown';
  const at=ha[eid]||{};
  const color=card.color||wColor(st);
  const ico=WI[st]||'🌡️';
  const temp=card.entity2&&hs[card.entity2]!==undefined?hs[card.entity2]+'°':(at.temperature!==undefined?at.temperature+'°':'?°');
  const hum=card.entity3&&hs[card.entity3]!==undefined?hs[card.entity3]+'%':(at.humidity!==undefined?at.humidity+'%':'');
  const wind=at.wind_speed!==undefined?Math.round(at.wind_speed)+' km/h':'';
  const cond=_stateIt(st);
  const wc=wClass(st);
  return `<div class="wth-hero-inner mp-wico ${wc}" style="color:${color}">
    <span class="wth-hero-ico">${ico}</span>
    <div class="wth-hero-temp" style="color:${color}">${temp}</div>
    <div class="wth-hero-cond">${cond}</div>
    <div class="wth-row">
      ${hum?`<span class="wth-chip">💧 ${hum}</span>`:''}
      ${wind?`<span class="wth-chip">💨 ${wind}</span>`:''}
      ${at.pressure?`<span class="wth-chip">🌡 ${Math.round(at.pressure)} hPa</span>`:''}
    </div>
  </div>`;
}

/* ═══ WEATHER-COMPACT HTML ═══ */
function weatherCompactInner(card){
  const eid=card.entity;
  const st=hs[eid]||'unknown';
  const at=ha[eid]||{};
  const rawFc=_fcData[eid]||at.forecast||[];
  const maxDays=Math.min(parseInt(card.wfDays)||7, rawFc.length||7);
  const fc=rawFc.slice(0,maxDays);
  const cond=_stateIt(st);
  const city=(card.label||'Meteo').toUpperCase();
  const grad=_wtGrad(st);
  const dayNames=['dom','lun','mar','mer','gio','ven','sab'];
  function _fmtT(v){ const n=parseFloat(v); return isNaN(n)?null:n.toFixed(1).replace('.',',')+'°C'; }
  const temp = card.wfTemp&&hs[card.wfTemp]!==undefined ? _fmtT(hs[card.wfTemp])
              : at.temperature!==undefined ? _fmtT(at.temperature) : null;
  const hum  = card.wfHum&&hs[card.wfHum]!==undefined  ? Math.round(parseFloat(hs[card.wfHum]))+'%'
              : at.humidity!==undefined ? Math.round(at.humidity)+'%' : null;
  const wind = card.wfWind&&hs[card.wfWind]!==undefined ? Math.round(parseFloat(hs[card.wfWind]))+' km/h'
              : at.wind_speed!==undefined ? Math.round(at.wind_speed)+' km/h' : null;
  const fcHTML=fc.length?fc.map(d=>{
    const dt=new Date(d.datetime);
    const ico=WI[d.condition||'unknown']||'🌡️';
    const hi=d.temperature!==undefined?Math.round(d.temperature)+'°C':'';
    const lo=d.templow!==undefined?Math.round(d.templow)+'°C':'';
    return `<div class="wtc-fc-day">
      <div class="wtc-fc-dname">${dayNames[dt.getDay()]}</div>
      <div class="wtc-fc-ico">${ico}</div>
      <div class="wtc-fc-hi">${hi}</div>
      <div class="wtc-fc-lo">${lo}</div>
    </div>`;
  }).join(''):'';
  return `<div class="wtc-inner" id="wtci-${card.id}" style="background:${grad}">
    <div class="wtc-bg" id="wtcbg-${card.id}"></div>
    <div class="wtc-content">
      <div class="wtc-hdr">
        <div class="wtc-title-block">
          <div class="wtc-city">${eh(city)}</div>
          <div class="wtc-cond-lbl">${eh(cond)}</div>
        </div>
        <div class="wtc-stats-row">
          ${temp?`<span class="wtc-stat-chip">🌡️ ${temp}</span>`:''}
          ${hum ?`<span class="wtc-stat-chip">💧 ${hum}</span>`:''}
          ${wind?`<span class="wtc-stat-chip">💨 ${wind}</span>`:''}
        </div>
      </div>
      ${fcHTML?`<div class="wtc-sep"></div><div class="wtc-forecast">${fcHTML}</div>`:''}
    </div>
  </div>`;
}

/* ═══ WEATHER-FORECAST HTML ═══ */
function weatherForecastInner(card){
  const eid=card.entity;
  const st=hs[eid]||'unknown';
  const at=ha[eid]||{};
  const rawFc=_fcData[eid]||at.forecast||[];
  const maxDays=Math.min(parseInt(card.wfDays)||7,rawFc.length||7);
  const fc=rawFc.slice(0,maxDays);
  if(!fc.length) return `<div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:.35;font-size:12px;gap:6px;color:#fff">📅 Previsioni non disponibili</div>`;
  const dayNames=['dom','lun','mar','mer','gio','ven','sab'];
  const city=(card.label||'Meteo').toUpperCase();
  const cond=_stateIt(st);
  function _fmtTemp(v){ const n=parseFloat(v); return isNaN(n)?null:n.toFixed(1).replace('.',',')+'°C'; }
  const temp= card.wfTemp&&hs[card.wfTemp]!==undefined ? _fmtTemp(hs[card.wfTemp])
             : at.temperature!==undefined ? _fmtTemp(at.temperature) : null;
  const hum = card.wfHum&&hs[card.wfHum]!==undefined  ? Math.round(parseFloat(hs[card.wfHum]))+'%'
             : at.humidity!==undefined ? Math.round(at.humidity)+'%' : null;
  const wind= card.wfWind&&hs[card.wfWind]!==undefined ? Math.round(parseFloat(hs[card.wfWind]))+' km/h'
             : at.wind_speed!==undefined ? Math.round(at.wind_speed)+' km/h' : null;
  return `<div class="wfc-wrap">
    <div class="wfc-header">
      <div>
        <div class="wfc-city">${eh(city)}</div>
        <div class="wfc-sub">${eh(cond)}</div>
      </div>
      <div class="wfc-hstats">
        ${temp?`<span class="wfc-hstat"><span class="wfc-hstat-ico">🌡️</span>${temp}</span>`:''}
        ${hum ?`<span class="wfc-hstat"><span class="wfc-hstat-ico">💧</span>${hum}</span>`:''}
        ${wind?`<span class="wfc-hstat"><span class="wfc-hstat-ico">💨</span>${wind}</span>`:''}
      </div>
    </div>
    <div class="wfc-sep"></div>
    <div class="wfc-days">`+fc.map(d=>{
      const dt=new Date(d.datetime);
      const ico=WI[d.condition||'unknown']||'🌡️';
      const hi=d.temperature!==undefined?Math.round(d.temperature)+'°C':'';
      const lo=d.templow!==undefined?Math.round(d.templow)+'°C':'';
      return `<div class="wfc-day">
        <div class="wfc-dname">${dayNames[dt.getDay()]}</div>
        <div class="wfc-ico">${ico}</div>
        <div class="wfc-hi">${hi}</div>
        <div class="wfc-lo">${lo}</div>
      </div>`;
    }).join('')+`</div>
  </div>`;
}

/* ═══ APPLIANCES HTML ═══ */
const APP_PALETTE=['#f97316','#60a5fa','#4ade80','#a78bfa','#fbbf24','#f472b6','#34d399','#22d3ee','#fb923c','#818cf8'];
function _hex2rgba(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;}

const APP_STATE_IT={
  /* generici on/off */
  on:'Acceso', off:'Spento', true:'Sì', false:'No',
  open:'Aperta', closed:'Chiusa', opening:'In apertura', closing:'In chiusura',
  locked:'Bloccata', unlocked:'Sbloccata', locking:'Bloccaggio', unlocking:'Sblocco',
  /* clima HVAC */
  heat:'Riscaldamento', cool:'Raffrescamento', auto:'Automatico', fan_only:'Ventilazione',
  heat_cool:'Riscald./Raffresc.', dry:'Deumidifica',
  /* azione HVAC (hvac_action) */
  heating:'Riscaldamento in corso', cooling:'Raffrescamento in corso',
  drying:'Deumidifica in corso', preheating:'Preriscaldamento',
  defrosting:'Sbrinamento',
  /* connettività */
  unavailable:'Non disponibile', unknown:'Sconosciuto', idle:'Inattivo', none:'Nessuno',
  /* media */
  playing:'In riproduzione', paused:'In pausa', standby:'In attesa', buffering:'Caricamento',
  /* media_content_type */
  music:'Musica', tvshow:'Serie TV', movie:'Film', video:'Video',
  episode:'Episodio', channel:'Canale', playlist:'Playlist',
  image:'Immagine', url:'URL', game:'Gioco', app:'Applicazione',
  /* presenza */
  home:'In casa', not_home:'Fuori casa',
  detected:'Rilevato', clear:'Nessuna presenza',
  /* astronomia */
  above_horizon:'Sopra orizzonte', below_horizon:'Sotto orizzonte',
  /* binario */
  active:'Attivo', inactive:'Inattivo', problem:'Problema', ok:'Ok',
  /* batteria */
  charging:'In carica', discharging:'In scarica', full:'Carica piena', not_charging:'Non in carica',
  /* allarme */
  armed_home:'Armato — Casa', armed_away:'Armato — Assenza', armed_night:'Armato — Notte',
  armed_vacation:'Armato — Vacanza', armed_custom_bypass:'Armato — Personalizzato',
  disarmed:'Disarmato', triggered:'Allarme attivato', pending:'In attesa', arming:'Armamento in corso',
  /* condizioni meteo */
  sunny:'Soleggiato', 'clear-night':'Notte serena', partlycloudy:'Parzialmente nuvoloso',
  cloudy:'Nuvoloso', overcast:'Coperto', fog:'Nebbia', hazy:'Foschia', hail:'Grandine',
  rainy:'Pioggia', 'chance-rain':'Possibile pioggia', pouring:'Pioggia intensa',
  lightning:'Temporale', 'lightning-rainy':'Temporale con pioggia',
  snowy:'Neve', 'snowy-rainy':'Pioggia mista a neve', 'chance-snow':'Possibile neve',
  windy:'Ventoso', 'windy-variant':'Molto ventoso', exceptional:'Condizioni eccezionali',
  /* lock */
  jammed:'Inceppato', unlocking_failed:'Sblocco fallito',
  /* cover */
  stopped:'Fermo',
  /* vacuum */
  cleaning:'In pulizia', returning:'In rientro', docked:'In base', error:'Errore',
  pausing:'In pausa', going_home:'Ritorno alla base', error_state:'Errore',
  /* update */
  installing:'In installazione',
  /* device tracker / source_type */
  not_set:'Non impostato', gps:'GPS', router:'Router',
  bluetooth:'Bluetooth', bluetooth_le:'Bluetooth LE',
  /* ── device_class (sensori numerici) ── */
  apparent_power:'Potenza apparente', aqi:'Indice qualità aria',
  atmospheric_pressure:'Pressione atmosferica', battery:'Batteria',
  carbon_dioxide:'Anidride carbonica (CO₂)', carbon_monoxide:'Monossido di carbonio (CO)',
  current:'Corrente', data_rate:'Velocità dati', data_size:'Dimensione dati',
  distance:'Distanza', duration:'Durata', energy:'Energia', energy_storage:'Accumulo energia',
  frequency:'Frequenza', gas:'Gas', humidity:'Umidità', illuminance:'Luminosità',
  irradiance:'Irraggiamento', moisture:'Umidità suolo', monetary:'Importo',
  nitrogen_dioxide:'Biossido di azoto (NO₂)', nitrogen_monoxide:'Monossido di azoto (NO)',
  nitrous_oxide:'Protossido di azoto (N₂O)', ozone:'Ozono (O₃)',
  ph:'pH', pm1:'Polveri PM1', pm10:'Polveri PM10', pm25:'Polveri PM2.5',
  power:'Potenza', power_factor:'Fattore di potenza', precipitation:'Precipitazioni',
  precipitation_intensity:'Intensità precipitazioni', pressure:'Pressione',
  reactive_power:'Potenza reattiva', signal_strength:'Qualità segnale',
  sound_pressure:'Pressione sonora', speed:'Velocità', sulphur_dioxide:'Biossido di zolfo (SO₂)',
  temperature:'Temperatura', timestamp:'Data/Ora', volatile_organic_compounds:'COV',
  volatile_organic_compounds_parts:'COV (ppm)', voltage:'Tensione', volume:'Volume',
  volume_flow_rate:'Portata volumetrica', volume_storage:'Volume serbatorio',
  water:'Acqua', weight:'Peso', wind_speed:'Velocità vento',
  /* ── device_class (sensori binari) ── */
  door:'Porta', garage_door:'Portone garage', window:'Finestra',
  motion:'Movimento', occupancy:'Presenza', presence:'Presenza',
  smoke:'Fumo', gas_sensor:'Gas', heat_sensor:'Calore', cold:'Freddo',
  light:'Luce', lock:'Serratura', plug:'Presa', safety:'Sicurezza',
  sound:'Suono', vibration:'Vibrazione', moisture_binary:'Umidità',
  connectivity:'Connettività', moving:'In movimento', opening:'Apertura',
  running:'In funzione', tamper:'Manomissione', update:'Aggiornamento disponibile',
  /* ── state_class ── */
  measurement:'Misurazione', total:'Totale', total_increasing:'Totale crescente',
  /* ── preset_mode comuni ── */
  boost:'Potenziamento', comfort:'Comfort', eco:'Risparmio', sleep:'Notte',
  activity:'Attività', away:'Assenza', home_preset:'Casa',
  /* ── fan_mode comuni ── */
  low:'Bassa', medium:'Media', high:'Alta', turbo:'Turbo', silent:'Silenziosa',
  diffuse:'Diffusa', middle:'Media', focus:'Concentrata',
  /* ── swing_mode comuni ── */
  both:'Entrambi', horizontal:'Orizzontale', vertical:'Verticale', off_swing:'Spento',
  /* ── update state ── */
  up_to_date:'Aggiornato', available:'Disponibile',
  /* ── numero / input ── */
  slider:'Cursore', box:'Casella',
  /* ── cover ── */
  tilt:'Inclinazione',
  /* ── sensori comuni ── */
  normal:'Normale', low_battery:'Batteria scarica', tampered:'Manomesso',
  triggered_sensor:'Attivato', no_motion:'Nessun movimento', motion_detected:'Movimento rilevato'
};

/* mappa nomi attributi HA → italiano (ordinata per categoria) */
const _ATTR_KEY_IT={
  /* generici */
  state:'Stato', last_changed:'Ultima modifica', last_updated:'Ultimo aggiornamento',
  restored:'Ripristinato', reachable:'Raggiungibile', tampered:'Manomesso',
  friendly_name:'Nome', icon:'Icona', unit_of_measurement:'Unità',
  device_class:'Classe dispositivo', state_class:'Classe stato',
  platform:'Piattaforma', integration:'Integrazione', attribution:'Fonte',
  editable:'Modificabile', initial:'Valore iniziale', options:'Opzioni',
  step:'Incremento', min:'Minimo', max:'Massimo', value:'Valore',
  pattern:'Schema', unit:'Unità',
  /* sensori ambientali */
  temperature:'Temperatura', current_temperature:'Temp. attuale',
  target_temperature:'Temp. impostata', target_temp_high:'Temp. max', target_temp_low:'Temp. min',
  humidity:'Umidità', pressure:'Pressione hPa', dew_point:'Punto di rugiada',
  apparent_temperature:'Temp. percepita', feels_like:'Temp. percepita',
  /* vento */
  wind_speed:'Velocità vento', wind_bearing:'Direzione vento °',
  wind_gust_speed:'Raffiche vento', wind_speed_unit:'Unità vento',
  /* precipitazioni */
  precipitation:'Precipitazioni', precipitation_unit:'Unità precipitazioni',
  precipitation_probability:'Prob. pioggia %', rain_rate:'Intensità pioggia',
  /* visibilità, nuvole, UV */
  visibility:'Visibilità', visibility_unit:'Unità visibilità',
  cloud_cover:'Copertura nuvolosa %', cloud_cover_low:'Nuvole basse %',
  cloud_cover_mid:'Nuvole medie %', cloud_cover_high:'Nuvole alte %',
  uv_index:'Indice UV', ozone:'Ozono', cape:'Energia temporali J/kg',
  /* meteo altro */
  condition:'Condizione', templow:'Temp. minima °C', temperature_unit:'Unità temperatura',
  pressure_unit:'Unità pressione', forecast:'Previsioni',
  next_rising:'Alba', next_setting:'Tramonto', elevation:'Elevazione °',
  thunderstorm_probability:'Prob. temporale %', snowfall_probability:'Prob. neve %',
  snowfall:'Neve cm', snow_depth:'Spessore neve cm', freezinglevel_height:'Quota gelo m',
  /* batteria */
  battery_level:'Batteria %', battery:'Batteria %',
  is_charging:'In carica', is_plugged_in:'Collegato alla presa',
  charging:'In carica',
  /* segnale */
  signal_strength:'Segnale dBm', linkquality:'Qualità segnale', lqi:'Qualità link',
  rssi:'RSSI dBm', snr:'SNR dB',
  /* elettrico */
  voltage:'Tensione V', current:'Corrente A', power:'Potenza W', energy:'Energia kWh',
  power_factor:'Fattore di potenza', frequency:'Frequenza Hz',
  total_increasing:'Totale crescente', total:'Totale',
  power_on_behavior:'Comportamento all\'accensione',
  /* clima / HVAC */
  mode:'Modalità', hvac_action:'Azione HVAC', hvac_modes:'Modalità disponibili',
  preset_mode:'Preset', preset_modes:'Preset disponibili',
  fan_mode:'Ventilazione', fan_modes:'Velocità disponibili',
  swing_mode:'Oscillazione', swing_modes:'Oscillazioni disponibili',
  away_mode:'Modalità assenza', operation_list:'Modalità disponibili',
  target_humidity:'Umidità target %', min_temp:'Temp. min', max_temp:'Temp. max',
  min_humidity:'Umidità min %', max_humidity:'Umidità max %',
  /* media player */
  volume_level:'Volume', is_volume_muted:'Silenzioso',
  source:'Sorgente', source_list:'Sorgenti disponibili',
  media_title:'Titolo', media_artist:'Artista', media_album_name:'Album',
  media_content_type:'Tipo contenuto', media_duration:'Durata s',
  media_position:'Posizione s', media_position_updated_at:'Aggiornamento posizione',
  app_name:'Applicazione',
  /* luci */
  brightness:'Luminosità', color_temp:'Temp. colore K',
  color_temp_kelvin:'Temp. colore K', color_mode:'Modalità colore',
  hs_color:'Colore HS', rgb_color:'Colore RGB', rgbw_color:'Colore RGBW',
  xy_color:'Colore XY', effect:'Effetto', effect_list:'Effetti disponibili',
  min_color_temp_kelvin:'Temp. colore min K', max_color_temp_kelvin:'Temp. colore max K',
  supported_color_modes:'Modalità colore', supported_features:'Funzioni supportate',
  /* posizione */
  latitude:'Latitudine', longitude:'Longitudine', altitude:'Altitudine m',
  speed:'Velocità', direction:'Direzione', gps_accuracy:'Precisione GPS m',
  /* sensori binari */
  occupancy:'Presenza', motion:'Movimento', contact:'Contatto', vibration:'Vibrazione',
  smoke:'Fumo', gas:'Gas', moisture:'Umidità', cold:'Freddo', heat:'Caldo',
  sound:'Suono', light:'Luce', plug:'Presa', door:'Porta', window:'Finestra',
  garage_door:'Portone garage', safety:'Sicurezza', power:'Alimentazione',
  /* coperture */
  position:'Posizione %', current_position:'Posizione attuale %',
  tilt_position:'Inclinazione %', tilt:'Inclinazione',
  /* serratura */
  lock:'Serratura', is_locked:'Bloccata', code_format:'Formato codice',
  /* tracker */
  source_type:'Tipo sorgente',
  /* auto / EV */
  charge_cable:'Cavo di ricarica', charge_current_request:'Corrente ricarica A',
  charge_current_request_max:'Corrente max A', charge_start_time:'Inizio ricarica',
  charge_stop_time:'Fine ricarica', charge_added:'Energia aggiunta kWh',
  charge_state:'Stato ricarica', charge_limit:'Limite carica %',
  odometer:'Odometro km', range:'Autonomia km', range_by_fuel_type:'Autonomia per tipo',
  outside_temperature:'Temp. esterna', inside_temperature:'Temp. interna',
  tire_pressure_front_left:'Press. ant. sx', tire_pressure_front_right:'Press. ant. dx',
  tire_pressure_rear_left:'Press. post. sx', tire_pressure_rear_right:'Press. post. dx',
  oil_life:'Vita olio %', alarm:'Allarme', windows:'Finestre', doors:'Porte',
  started:'Avviato', remote_start:'Avvio remoto', deep_sleep:'Sonno profondo',
  running:'In esecuzione', locked:'Bloccato', windowsopen:'Finestre aperte',
  is_plugged_in:'Collegato', model:'Modello', manufacturer:'Produttore',
  sw_version:'Versione firmware', hw_version:'Versione hardware',
  serial_number:'Numero seriale', mac_address:'Indirizzo MAC', ip_address:'Indirizzo IP',
  /* sistema */
  uptime:'Tempo attività', load_1m:'Carico 1 min', load_5m:'Carico 5 min',
  load_15m:'Carico 15 min', memory_use_percent:'RAM %', processor_use:'CPU %',
  disk_use_percent:'Disco %', network_in:'Rete ingresso', network_out:'Rete uscita',
  /* pioggia / stazione meteo */
  rain_rate_in:'Intensità pioggia', rain_total:'Pioggia totale mm',
  event_rain:'Pioggia evento mm', hourly_rain:'Pioggia oraria mm',
  daily_rain:'Pioggia giornaliera mm', weekly_rain:'Pioggia settimanale mm',
  monthly_rain:'Pioggia mensile mm', yearly_rain:'Pioggia annuale mm',
  dewpoint:'Punto rugiada', winddir:'Direzione vento °',
  windspeedmph:'Velocità vento mph', windgustmph:'Raffiche mph',
  /* azione Zigbee */
  action:'Azione', action_rate:'Frequenza azione',
  occupancy_timeout:'Timeout presenza s', sensitivity:'Sensibilità',
  /* allarme */
  code_arm_required:'Codice richiesto', changed_by:'Modificato da',
  open_sensors:'Sensori aperti',
  /* caldaia */
  setpoint:'Setpoint', water_temperature:'Temp. acqua',
  boiler_status:'Stato caldaia', error_code:'Codice errore',
  /* irrigazione */
  duration:'Durata', remaining_time:'Tempo rimanente s',
  /* input */
  min_value:'Valore minimo', max_value:'Valore massimo'
};

/* traduce uno stato HA in italiano */
function _stateIt(s){
  if(s===null||s===undefined||s==='') return '—';
  const key=String(s).trim();
  return APP_STATE_IT[key]??APP_STATE_IT[key.toLowerCase()]??key;
}

/* traduce un nome attributo HA in italiano */
function _attrKeyIt(k){
  if(_ATTR_KEY_IT[k]) return _ATTR_KEY_IT[k];
  /* prova con underscore → spazio, tutto minuscolo */
  const normalized=k.toLowerCase().replace(/_/g,' ');
  /* parti comuni in fondo alla chiave */
  const suffixMap={' unit':'Unità',' units':'Unità',' list':'Elenco',' mode':'Modalità',
    ' state':'Stato',' status':'Stato',' level':'Livello',' rate':'Velocità',
    ' time':'Orario',' timeout':'Timeout',' count':'Contatore',' total':'Totale',
    ' percent':'%',' percentage':'%',' angle':'Angolo',' type':'Tipo',
    ' temp':'Temp.',' temperature':'Temperatura',' pressure':'Pressione',
    ' humidity':'Umidità',' speed':'Velocità',' direction':'Direzione',
    ' power':'Potenza',' energy':'Energia',' voltage':'Tensione',' current':'Corrente'};
  for(const[sfx,it] of Object.entries(suffixMap)){
    if(normalized.endsWith(sfx)){
      const prefix=k.slice(0,k.length-sfx.replace(' ','_').length).replace(/_/g,' ');
      if(prefix) return prefix+' — '+it;
      return it;
    }
  }
  return k.replace(/_/g,' ');
}

/* traduce un valore attributo in italiano (stati, boolean, device_class, state_class, ecc.) */
function _attrValIt(v){
  if(v===null||v===undefined) return '—';
  if(typeof v==='boolean') return v?'Sì':'No';
  if(typeof v==='number') return v;
  const s=String(v).trim();
  if(s==='') return '—';
  /* ricerca diretta nella mappa (chiave esatta, poi lowercase, poi con underscore→spazio) */
  const kl=s.toLowerCase();
  if(APP_STATE_IT[s]!==undefined) return APP_STATE_IT[s];
  if(APP_STATE_IT[kl]!==undefined) return APP_STATE_IT[kl];
  /* molti device_class arrivano come "wind_speed" o "wind speed" */
  const ku=kl.replace(/[\s-]/g,'_');
  if(APP_STATE_IT[ku]!==undefined) return APP_STATE_IT[ku];
  /* parole inglesi singole comuni che appaiono come valori HA */
  const wordMap={
    measurement:'Misurazione',total:'Totale',wind:'Vento',temperature:'Temperatura',
    humidity:'Umidità',pressure:'Pressione',precipitation:'Precipitazioni',
    battery:'Batteria',power:'Potenza',energy:'Energia',current:'Corrente',
    voltage:'Tensione',frequency:'Frequenza',signal:'Segnale',
    motion:'Movimento',occupancy:'Presenza',smoke:'Fumo',gas:'Gas',
    door:'Porta',window:'Finestra',lock:'Serratura',light:'Luce',
    sound:'Suono',vibration:'Vibrazione',moisture:'Umidità suolo',
    connectivity:'Connettività',safety:'Sicurezza',heat:'Calore',cold:'Freddo',
    speed:'Velocità',distance:'Distanza',weight:'Peso',volume:'Volume',
    illuminance:'Luminosità',aqi:'Qualità aria',ozone:'Ozono',
    running:'In funzione',update:'Aggiornamento',tamper:'Manomissione',
    opening:'Apertura',moving:'In movimento',plug:'Presa',
    carbon:'Carbonio',nitrogen:'Azoto',sulphur:'Zolfo',
    heating:'Riscaldamento',cooling:'Raffrescamento',drying:'Deumidifica',
    idle:'Inattivo',off:'Spento',on:'Acceso',
    /* state_class */
    'total increasing':'Totale crescente','total_increasing':'Totale crescente'
  };
  if(wordMap[kl]!==undefined) return wordMap[kl];
  /* se contiene underscore, sostituisci e riprova */
  const spaced=kl.replace(/_/g,' ');
  if(wordMap[spaced]!==undefined) return wordMap[spaced];
  /* restituisce il valore originale invariato */
  return s;
}

function _friendlyName(entity){
  const attr=ha[entity]||{};
  return attr.friendly_name||entity.split('.')[1]?.replace(/_/g,' ')||entity;
}

function appliancesInner(card){
  const items=card.items||[];
  const groups=card.groups||[];
  const thr=card.threshold??5;
  const fmt=v=>v>=1000?(v/1000).toFixed(2)+' kW':Math.round(v)+' W';
  const cardColor=card.color||'#fbbf24';
  const cardLabel=card.label||'Elettrodomestici';
  const cardIcon=card.icon||'⚡';

  const ON_STATES=new Set(['on','open','opening','playing','heat','cool','auto','fan_only','dry','home','true']);

  /* ── active consuming items ── */
  const active=items.map((item,i)=>({
    ...item,
    val:parseFloat(hs[item.entity]??0)||0,
    color:item.color||APP_PALETTE[i%APP_PALETTE.length]
  })).filter(d=>d.val>=thr).sort((a,b)=>b.val-a.val);

  const total=active.reduce((s,d)=>s+d.val,0);

  /* ── chips: count active per group ── */
  const chipHtml=groups.map((g,gi)=>{
    const color=g.color||'#818cf8';
    const ents=g.entities||[];
    const cnt=ents.filter(e=>ON_STATES.has(String(hs[e]||'').toLowerCase())).length;
    const dotCls='app-chip-dot'+(cnt>0?' on':'');
    const clickable=ents.length>0;
    const label=_pluralizeGroup(g.name, cnt);
    return `<span class="app-chip" style="color:${color};border-color:${_hex2rgba(color,.3)};background:${_hex2rgba(color,.1)};${clickable?'cursor:pointer':''}"
      ${clickable?`data-action="_appChipPopupAt" data-action-args='["${card.id}",${gi}]'`:''}><span class="${dotCls}"></span>${cnt} ${label}</span>`;
  }).join('');

  /* ── power device rows ── */
  const powerRows=active.map(item=>{
    const c=item.color;
    return `<div class="app-row" style="--ac:${c}">
      <span class="app-dot"></span>
      <span class="app-ico">${_renderIcon(item.icon||'⚡',18,item.color)}</span>
      <span class="app-name">${item.name||_friendlyName(item.entity)}</span>
      <span class="app-val-badge" style="color:${c};background:${_hex2rgba(c,.15)};border-color:${_hex2rgba(c,.35)}">${fmt(item.val)} ▼</span>
    </div>`;
  }).join('');

  /* ── state rows: groups with showList=true ── */
  const stateGroups=groups.filter(g=>g.showList&&(g.entities||[]).length);
  const stateRows=stateGroups.map(g=>{
    const color=g.color||'#818cf8';
    return (g.entities||[]).map(e=>{
      const st=String(hs[e]||'').toLowerCase();
      const isOn=ON_STATES.has(st);
      const dotCls='app-state-dot'+(isOn?' on':'');
      const badgeColor=isOn?color:'rgba(255,255,255,0.2)';
      const badgeBg=isOn?_hex2rgba(color,.15):'rgba(255,255,255,0.04)';
      const badgeBorder=isOn?_hex2rgba(color,.35):'rgba(255,255,255,0.1)';
      return `<div class="app-state-row" style="--gc:${color}">
        <span class="${dotCls}"></span>
        <span class="app-state-name">${_friendlyName(e)}</span>
        <span class="app-state-badge" style="color:${badgeColor};background:${badgeBg};border-color:${badgeBorder}">${_stateIt(hs[e]||'—')}</span>
      </div>`;
    }).join('');
  }).join('');

  const hasPower=active.length>0;
  const hasState=stateRows.length>0;
  const emptyPower=(!items.length)
    ?`<div class="app-empty" style="flex:none;padding:8px 0">🔌 Aggiungi sensori watt dal ✏️ editor</div>`
    :'';

  const bodyHtml=`
    ${hasPower?`<div class="app-list" style="${hasState?'flex:none':'flex:1'}">${powerRows}</div>`:emptyPower}
    ${hasPower&&hasState?`<div class="app-sec-sep"></div>`:''}
    ${hasState?`<div class="app-list" style="flex:1">${stateRows}</div>`:''}
    ${!hasPower&&!hasState&&items.length?`<div class="app-empty">💤 Tutti spenti<br><span style="font-size:9px">Soglia: ${thr}W</span></div>`:''}
  `;

  return `<div class="app-wrap">
    <div class="app-hdr">
      <span class="app-hdr-ico" style="color:${cardColor}">${_renderIcon(cardIcon,20,cardColor)}</span>
      <span class="app-hdr-title">${cardLabel}</span>
      ${total>0?`<span class="app-total-badge">${fmt(total)} ▼</span>`:''}
    </div>
    ${chipHtml?`<div class="app-chips">${chipHtml}</div>`:''}
    <div class="app-divider"></div>
    ${bodyHtml}
  </div>`;
}

/* ═══ PICTURE-ELEMENTS HTML ═══ */
/* parti dinamiche dell'orologio header (ora + data) — usate sia al render che per l'update sul posto */
function _clkParts(item){
  const now=new Date();
  const fmt=(item&&item.clockFormat)||'24h';
  let hh,ampm='';
  if(fmt==='12h'){ let h=now.getHours(); ampm=h>=12?' PM':' AM'; h=h%12||12; hh=String(h).padStart(2,'0'); }
  else hh=String(now.getHours()).padStart(2,'0');
  const mm=String(now.getMinutes()).padStart(2,'0');
  const ss=String(now.getSeconds()).padStart(2,'0');
  const days=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  const months=['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  const d=now.getDate(),mo=months[now.getMonth()],dy=days[now.getDay()];
  const blink=`<span style="animation:hbarBlink 1s step-start infinite">:</span>`;
  const secPart=(item&&item.clockShowSeconds===true)?`${blink}${ss}`:'';
  const ampmHtml=ampm?`<span style="font-size:.55em;font-weight:600;margin-left:3px;opacity:.7">${ampm.trim()}</span>`:'';
  return { timeHTML:`${hh}${blink}${mm}${secPart}${ampmHtml}`, dateText:`${dy} ${d} ${mo}` };
}
function hbarInner(card){
  function chipHTML(item){
    if(!item) return '';
    if(item.hidden) return '';
    if(item.type==='store'){
      const meta=(window.FratechCardRegistry?.[item.cardId]?.meta)||{};
      const ico=item.icon||meta.icon||'📦';
      const lbl=item.label||meta.name||item.cardId||'Card';
      return `<span class="hbar-chip" style="background:rgba(251,191,36,.12);border-color:rgba(251,191,36,.35);color:#fbbf24">${_renderIcon(ico,11,'#fbbf24')} <span style="font-weight:700">${eh(lbl)}</span></span>`;
    }
    if(item.type==='clock'){
      const style=item.clockStyle||'default';
      const sz=item.clockSizeName||'md';
      const clr=item.clockColor||'#ffffff';
      const showDate=item.clockShowDate!==false;
      const sizeMap={sm:'16px',md:'24px',lg:'32px',xl:'44px'};
      const fs=sizeMap[sz]||'24px';
      const styleProps={
        default:{ff:"inherit",fw:900,ls:'-1.5px',ts:`0 0 20px rgba(255,255,255,.3)`},
        bold:{ff:"'Poppins','Nunito',sans-serif",fw:900,ls:'-2px',ts:`0 2px 12px rgba(0,0,0,.4)`},
        minimal:{ff:"inherit",fw:300,ls:'2px',ts:'none'},
        digital:{ff:"'Orbitron','Oxanium',monospace",fw:700,ls:'3px',ts:'none'},
        neon:{ff:"'Orbitron',monospace",fw:700,ls:'3px',ts:`0 0 8px ${clr},0 0 20px ${clr},0 0 40px ${clr}`},
        slim:{ff:"'Josefin Sans','Raleway',sans-serif",fw:300,ls:'5px',ts:'none'},
        mono:{ff:"'Oxanium',ui-monospace,monospace",fw:600,ls:'2px',ts:'none'},
        elegant:{ff:"Georgia,'Times New Roman',serif",fw:700,ls:'0',ts:'0 2px 10px rgba(0,0,0,.35)'},
        glow:{ff:'inherit',fw:800,ls:'0',ts:`0 0 10px ${clr},0 0 22px ${clr}99`},
        shadow3d:{ff:"'Poppins','Nunito',sans-serif",fw:900,ls:'-1px',ts:'1px 1px 0 rgba(0,0,0,.35),2px 2px 0 rgba(0,0,0,.3),3px 3px 0 rgba(0,0,0,.25),4px 5px 8px rgba(0,0,0,.35)'},
        outline:{ff:"'Poppins','Outfit',sans-serif",fw:900,ls:'0',ts:'none',ex:`-webkit-text-stroke:1.4px ${clr};-webkit-text-fill-color:transparent`},
        gradient:{ff:"'Poppins','Outfit',sans-serif",fw:900,ls:'-1px',ts:'none',ex:`background:linear-gradient(90deg,${clr},#22d3ee);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent`},
      };
      const sp=styleProps[style]||styleProps.default;
      const timeStyle=`font-size:${fs};font-weight:${sp.fw};font-family:${sp.ff};letter-spacing:${sp.ls};color:${clr};text-shadow:${sp.ts};line-height:1${sp.ex?';'+sp.ex:''}`;
      const p=_clkParts(item);
      const cfgAttr=encodeURIComponent(JSON.stringify({clockFormat:item.clockFormat||'24h',clockShowSeconds:item.clockShowSeconds===true}));
      return `<div class="hbar-clk" data-clk="${cfgAttr}"><span class="hbar-clk-time" style="${timeStyle}">${p.timeHTML}</span>${showDate?`<span class="hbar-clk-date">${p.dateText}</span>`:''}</div>`;
    }
    if(item.type==='sep') return `<div class="hbar-sep"></div>`;
    if(item.type==='sos'){
      const lbl=item.label||'SOS';
      const ic=item.icon||'mdi:alarm-light';
      const shapeR={pill:'20px',rounded:'10px',square:'6px'}[item.shape||'pill']||'20px';
      return `<span class="hbar-chip hbar-sos-chip tap" style="--hbr:${shapeR}" data-action="openSOS">${_renderIcon(ic,13,'#fff')} <span style="font-weight:900;letter-spacing:.5px">${eh(lbl)}</span></span>`;
    }
    if(item.type==='kiosk'){
      const isK=document.body.classList.contains('kiosk');
      const lbl=item.label||(isK?'Esci Kiosk':'Kiosk');
      const ic=item.icon||(isK?'mdi:fullscreen-exit':'mdi:fullscreen');
      return `<span class="hbar-chip hbar-kiosk-chip tap" data-action="toggleKiosk">${_renderIcon(ic,13,'#a5b4fc')} <span style="font-weight:800">${eh(lbl)}</span></span>`;
    }
    if(item.type==='conn'){
      const dot=document.getElementById('conn-dot');
      const isOk=dot?.classList.contains('ok');
      const isWait=dot?.classList.contains('wait');
      const connColor=isOk?'#4ade80':isWait?'#fbbf24':'#f87171';
      const connIcon=isOk?'mdi:wifi':'mdi:wifi-off';
      const connTxt=isOk?(item.label||'Connesso'):isWait?'Connessione…':'Disconnesso';
      return `<span class="hbar-chip" style="--hbbg:${_hex2rgba(connColor,.18)};--hbc:${_hex2rgba(connColor,.6)};background:var(--hbbg);border-color:var(--hbc);color:${connColor}">${_renderIcon(connIcon,12,connColor)} <span style="font-weight:700">${connTxt}</span></span>`;
    }
    const col=item.color||'#fff';
    // ── colore: colorMap manuale > bg fisso > auto HA ──
    // N.B. 'rgba(255,255,255,0.12)' è il vecchio default → trattalo come "nessun colore"
    const _isDefaultBg=v=>!v||v==='rgba(255,255,255,0.12)'||v==='rgba(255,255,255,.12)';
    let baseColor;
    if(item.type==='entity'&&item.entity){
      const st=String(hs[item.entity]||'');
      if(item.colorMap&&item.colorMap[st]) baseColor=item.colorMap[st];        // override manuale per stato
      else if(!_isDefaultBg(item.bg)) baseColor=item.bg;                       // colore fisso impostato dall'utente
      else baseColor=_haAutoColor(item.entity);                                 // AUTO come HA
    } else {
      baseColor=(!_isDefaultBg(item.bg)?item.bg:null)||'#818cf8';
    }
    // shape → border-radius
    const shapeR={pill:'20px',rounded:'10px',square:'6px',circle:'50%'}[item.shape||'pill']||'20px';
    // size → padding + font
    const sizeMap={sm:'3px 8px|9px',md:'4px 11px|10px',lg:'7px 16px|12px'};
    const [sp,sf]=(sizeMap[item.size||'md']||'4px 11px|10px').split('|');
    const [spy,spx]=sp.split(' ');
    const customBg=item.bg&&!_isDefaultBg(item.bg)?`background:${item.bg};`:'';
    const customBorder=item.borderColor?`border-color:${item.borderColor};`:'';
    const customText=item.color&&item.color!=='#ffffff'?`color:${item.color};`:'';
    const bgStyle=(customBg||customBorder||customText)
      ? `${customBg||`--hbbg:${_hex2rgba(baseColor,.18)};background:var(--hbbg);`}${customBorder||`--hbc:${_hex2rgba(baseColor,.6)};border-color:var(--hbc);`}--hbr:${shapeR};--hbpy:${spy};--hbpx:${spx};--hbfs:${sf}`
      : (baseColor.startsWith('rgba')||baseColor.startsWith('rgb'))
        ? `background:${baseColor};border-color:rgba(255,255,255,.2);--hbr:${shapeR};--hbpy:${spy};--hbpx:${spx};--hbfs:${sf}`
        : `--hbbg:${_hex2rgba(baseColor,.18)};--hbc:${_hex2rgba(baseColor,.6)};background:var(--hbbg);border-color:var(--hbc);--hbr:${shapeR};--hbpy:${spy};--hbpx:${spx};--hbfs:${sf}`;
    let val='';
    if(item.type==='entity'&&item.entity){
      const raw=hs[item.entity]!==undefined?String(hs[item.entity]):'—';
      const unit=item.showUnit!==false?(ha[item.entity]?.unit_of_measurement||''):'';
      const translated=_stateIt(raw);
      val=item.showState!==false?(translated+(unit?' '+unit:'')):'';
    } else if(item.type==='text'){
      val=item.text||'';
    }
    // ── icona: iconMap manuale > icona fissa > auto HA ──
    let icon=item.icon||'';
    if(item.type==='entity'&&item.entity){
      const st=String(hs[item.entity]||'');
      if(item.iconMap&&item.iconMap[st]){
        const mapVal=item.iconMap[st];
        if(typeof mapVal==='object'){ icon=mapVal.icon; if(mapVal.color) col=mapVal.color; }
        else icon=mapVal;
      } // override manuale per stato
      else if(!icon) icon=_haAutoIcon(item.entity);                             // AUTO come HA
    }
    const icoCol=item.iconColor&&item.iconColor!=='#ffffff'?item.iconColor:col;
    const iconHtml=icon?_renderIcon(icon,11,icoCol):'';
    const labelHtml=item.label?`<span style="opacity:.65">${eh(item.label)}</span>`:'';
    const valHtml=val?`<span style="font-weight:800">${eh(val)}</span>`:'';
    const parts=[iconHtml,labelHtml,valHtml].filter(Boolean).join(' ');
    // azione al click — per le entità, default "auto" (smart per dominio); 'none' resta non cliccabile
    const clickAct=item.clickAction || (item.type==='entity'&&item.entity ? 'auto' : 'none');
    let tapAttr='';
    if(clickAct==='more_info'&&item.entity){
      const e=String(item.entity).replace(/'/g,"\\'");
      tapAttr=`data-action="openIM" data-action-arg="${e}"`;
    } else if((clickAct==='toggle'||clickAct==='auto')&&item.entity){
      // router smart: legge il dominio e fa toggle / premi / apri-chiudi / blocca-sblocca / info
      tapAttr=`data-action="_hbSmartClick" data-action-el="true" data-action-args='["${item.entity}"]'`;
    } else if(clickAct==='navigate'){
      const pi=parseInt(item.navPage||0);
      tapAttr=`data-action="setActivePage" data-action-args='[${pi}]'`;
    } else if(clickAct==='service'&&item.tapDomain&&item.tapService){
      const d=String(item.tapDomain).replace(/'/g,"\\'");
      const s=String(item.tapService).replace(/'/g,"\\'");
      const e=String(item.tapEntity||item.entity||'').replace(/'/g,"\\'");
      tapAttr=`data-action="_sendCallSvc" data-action-args='["${d}","${s}","${e}"]'`;
    } else if(clickAct==='options'&&item.options&&item.options.length){
      tapAttr=`data-action="_hbOptionsPopupEl" data-action-el="true" data-action-args='[${JSON.stringify(item.options||[]).replace(/"/g,'&quot;')}]'`;
    }
    const isClickable=!!tapAttr;
    // Entità secondaria
    let ent2Html='';
    if(item.entity2){
      const st2=String(hs[item.entity2]??'—');
      const unit2=item.entity2showUnit!==false?(ha[item.entity2]?.unit_of_measurement||''):'';
      const ico2=item.entity2icon||_haAutoIcon(item.entity2)||'';
      const v2=_stateIt(st2)+(unit2?' '+unit2:'');
      ent2Html=`<span style="border-left:1px solid rgba(255,255,255,.22);margin-left:6px;padding-left:6px;white-space:nowrap">${ico2?_renderIcon(ico2,10,col)+' ':''}<span style="font-weight:700">${eh(v2)}</span></span>`;
    }
    const mainChip=item.entity2pos==='left'
      ? ent2Html+parts
      : parts+ent2Html;
    return `<span class="hbar-chip${isClickable?' tap':''}" style="${bgStyle};color:${col}" ${tapAttr}>${mainChip}</span>`;
  }
  // kiosk e conn vanno SEMPRE a destra, ovunque siano stati messi
  const _pin=it=>it&&(it.type==='kiosk'||it.type==='conn');
  const _pinned=[...(card.left||[]),...(card.center||[]),...(card.right||[])].filter(_pin);
  const L=(card.left||[]).filter(x=>!_pin(x)).map(chipHTML).join('');
  const C=(card.center||[]).filter(x=>!_pin(x)).map(chipHTML).join('');
  const R=[...(card.right||[]).filter(x=>!_pin(x)),..._pinned].map(chipHTML).join('');
  return `<div class="hbar-wrap">
    <div class="hbar-sect hbar-left">${L}</div>
    ${C?`<div class="hbar-sect hbar-center">${C}</div>`:''}
    <div class="hbar-sect hbar-right">${R}</div>
  </div>`;
}

function pictureElementsInner(card){
  const imgUrl=card.imageUrl||'';
  const elements=card.elements||[];
  if(!imgUrl) return `<div class="pe-empty">🖼️ Imposta URL immagine nel card editor</div>`;
  const overlays=elements.map(el=>{
    const val=el.entity?(hs[el.entity]??'—'):(el.text||'');
    const color=el.color||'#fff';
    const sz=el.size||12;
    return `<div class="pe-el" style="left:${el.x||50}%;top:${el.y||50}%;color:${color};font-size:${sz}px;border-color:${color}44">
      ${el.icon?`<span class="pe-el-ico" style="font-size:${sz+2}px">${el.icon}</span>`:''}
      <span>${el.prefix||''}${val}${el.suffix||''}</span>
    </div>`;
  }).join('');
  return `<div class="pe-wrap">
    <img class="pe-bg" src="${imgUrl}" alt="" onerror="this.style.opacity='.2'">
    <div class="pe-overlay">${overlays}</div>
  </div>`;
}

/* ═══ CLOCK HTML ═══ */
function clockInner(card){
  const now=new Date();
  const timeStr=now.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const dateStr=now.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const color=card.color||'#818cf8';
  return `<div class="clk-inner" style="color:${color}">
    <div class="clk-time">${timeStr}</div>
    <div class="clk-date">${dateStr}</div>
    ${card.sub?`<div class="clk-tz">${card.sub}</div>`:''}
  </div>`;
}

/* ═══ MARKDOWN HTML ═══ */
function markdownInner(card){
  const content=card.content||'';
  if(!content) return `<div class="md-empty">✏️ Apri modifica per aggiungere testo o HTML</div>`;
  return `<div class="md-inner">${content}</div>`;
}

/* ═══ MEDIA PLAYER HTML ═══ */
function mediaInner(card){
  const st=hs[card.entity]||'off';
  const at=ha[card.entity]||{};
  const isPlay=st==='playing';
  const title=at.media_title||_stateIt(st);
  const artist=at.media_artist||'';
  const vol=Math.round((at.volume_level||0)*100);
  const pic=at.entity_picture;
  const col=card.color||'#6366f1';
  const eid=ea(card.entity);
  return `<div class="med-top">
    ${pic?`<img class="med-art" src="${BASE}${pic}" onerror="this.style.display='none'">`:'<div class="med-art" style="display:flex;align-items:center;justify-content:center;font-size:20px">🎵</div>'}
    <div class="med-info">
      <div class="med-title" style="color:${col}">${eh(title)}</div>
      ${artist?`<div class="med-artist">${eh(artist)}</div>`:''}
      <div class="med-state">${_stateIt(st)}</div>
    </div>
  </div>
  <div class="med-ctrl">
    <button class="mctrl-btn" data-action="callSvc" data-action-args='["media_player","media_previous_track","${eid}"]'>⏮</button>
    <button class="mctrl-btn mctrl-pp" data-action="callSvc" data-action-args='["media_player","media_play_pause","${eid}"]' style="background:${col}22;color:${col};border:1px solid ${col}44">${isPlay?'⏸':'▶'}</button>
    <button class="mctrl-btn" data-action="callSvc" data-action-args='["media_player","media_next_track","${eid}"]'>⏭</button>
  </div>
  <div class="med-vol">
    <span class="med-vol-ico">🔉</span>
    <div class="med-vol-track"><div class="med-vol-fill" style="width:${vol}%;background:${col}"></div></div>
    <span class="med-vol-pct">${vol}%</span>
  </div>`;
}

/* ═══ CLIMATE HTML ═══ */
function climateInner(card){
  const st=hs[card.entity]||'off';
  const at=ha[card.entity]||{};
  const curT=at.current_temperature!==undefined?at.current_temperature:'?';
  const tarT=at.temperature!==undefined?at.temperature:'?';
  const col=card.color||'#6366f1';
  const modeCol={heat:'#fb923c',cool:'#22d3ee',off:'#6b7280',auto:'#4ade80','heat_cool':'#f59e0b'}[st]||col;
  const modeIco={heat:'🔥',cool:'❄️',off:'⏻',auto:'♻️','heat_cool':'⚡'}[st]||'🌡️';
  const eid=ea(card.entity);
  const cid=card.id;
  return `<div class="clm-cur">
    <span class="clm-cur-val" style="color:${col}">${curT}°</span>
    <span class="clm-cur-lbl">Temperatura attuale</span>
  </div>
  <div class="clm-mode" style="color:${modeCol};border:1px solid ${modeCol}33">${modeIco} ${_stateIt(st)}</div>
  <div class="clm-ctrl">
    <button class="clm-btn" data-action="adjustClimate" data-action-args='["${eid}",-0.5,"${cid}"]'>−</button>
    <div class="clm-target">
      <span class="clm-tar-val" id="ctar-${cid}" style="color:${col}">${tarT}</span>°
      <span class="clm-tar-lbl">Imposta</span>
    </div>
    <button class="clm-btn" data-action="adjustClimate" data-action-args='["${eid}",0.5,"${cid}"]'>+</button>
  </div>`;
}

/* ═══ ENTITIES LIST HTML ═══ */
function entitiesInner(card){
  const ents=[card.entity,card.entity2,card.entity3].filter(Boolean);
  return ents.map(eid=>{
    const val=hs[eid]??'—';
    const at=ha[eid]||{};
    const name=at.friendly_name||eid.split('.').pop().replace(/_/g,' ');
    const unit=at.unit_of_measurement||'';
    const dom=eid.split('.')[0];
    const ico=guessIcon(eid,dom);
    const isOn=val==='on'||val==='true';
    const col=isOn?card.color||'#6366f1':'rgba(255,255,255,0.5)';
    return `<div class="ent-row">
      <span class="ent-ico">${ico}</span>
      <span class="ent-lbl">${eh(name)}</span>
      <span class="ent-val" style="color:${col}">${eh(isNaN(parseFloat(val))?_stateIt(val):val)} ${eh(unit)}</span>
    </div>`;
  }).join('');
}

/* ═══ CLIMATE CONTROL ═══ */
function adjustClimate(entityId,delta,cardId){
  const cur=ha[entityId]?.temperature;
  if(cur===undefined) return;
  const newT=Math.round((parseFloat(cur)+delta)*2)/2;
  const el=document.getElementById('ctar-'+cardId);
  if(el) el.textContent=newT;
  callSvc('climate','set_temperature',entityId,{temperature:newT});
}

/* ═══ CHARTS ═══ */
function destroyChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }
function _cTick(){ return cfg.theme==='light'?'rgba(15,23,42,0.3)':'rgba(255,255,255,0.2)'; }
function _cGrid(){ return cfg.theme==='light'?'rgba(15,23,42,0.07)':'rgba(255,255,255,0.04)'; }
function _cLegend(){ return cfg.theme==='light'?'rgba(15,23,42,0.45)':'rgba(255,255,255,0.4)'; }
function _cTooltipBg(){ return cfg.theme==='light'?'rgba(240,243,250,0.97)':'rgba(10,12,24,0.9)'; }
function _cTooltipText(){ return cfg.theme==='light'?'#0f172a':'#fff'; }

async function initHistoryChart(card){
  destroyChart(card.id);
  const canvas=document.getElementById('ch-'+card.id);
  if(!canvas) return;
  const pts=await fetchHistory(card.entity,card.hours||24);
  if(!pts.length) return;
  const color=card.color||'#6366f1';
  const ctx=canvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,canvas.offsetHeight||150);
  grad.addColorStop(0,color+'55');grad.addColorStop(1,color+'00');
  charts[card.id]=new Chart(ctx,{
    type:'line',
    data:{labels:pts.map(p=>p.t),datasets:[{data:pts.map(p=>p.v),borderColor:color,borderWidth:1.5,backgroundColor:grad,fill:true,tension:0.3,pointRadius:0,pointHoverRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,animation:{duration:600},
      plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false,backgroundColor:_cTooltipBg(),titleColor:_cTooltipText(),bodyColor:_cTooltipText(),titleFont:{size:10},bodyFont:{size:11},
        callbacks:{title:items=>{const d=new Date(items[0].label);return d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});},label:i=>` ${i.raw.toFixed(1)} ${card.unit}`}}},
      scales:{x:{display:false},y:{display:true,grid:{color:_cGrid(),drawBorder:false},ticks:{color:_cTick(),font:{size:8},maxTicksLimit:4,callback:v=>v+(card.unit?card.unit.slice(0,3):'')},border:{display:false}}}}
  });
}

async function initMultilineChart(card){
  destroyChart(card.id);
  const canvas=document.getElementById('ch-'+card.id);
  if(!canvas) return;
  const hours=card.hours||24;
  const ents=[
    {id:card.entity,col:card.color||'#6366f1'},
    {id:card.entity2,col:'#4ade80'},
    {id:card.entity3,col:'#fbbf24'}
  ].filter(e=>e.id);
  const allPts=await Promise.all(ents.map(e=>fetchHistory(e.id,hours)));
  const N=80;
  const allT=allPts.flatMap(pts=>pts.map(p=>p.t.getTime()));
  if(!allT.length) return;
  const startT=Math.min(...allT),endT=Math.max(...allT);
  const labels=Array.from({length:N},(_,i)=>{
    const t=new Date(startT+(i/(N-1))*(endT-startT));
    return t.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
  });
  const datasets=ents.map((e,i)=>{
    const pts=allPts[i];
    const data=Array.from({length:N},(_,j)=>{
      const t=startT+(j/(N-1))*(endT-startT);
      const near=pts.reduce((b,p)=>Math.abs(p.t.getTime()-t)<Math.abs((b?.t.getTime()||Infinity)-t)?p:b,null);
      return near?near.v:null;
    });
    const ctx=canvas.getContext('2d');
    const grad=ctx.createLinearGradient(0,0,0,canvas.offsetHeight||150);
    grad.addColorStop(0,e.col+'44');grad.addColorStop(1,e.col+'00');
    return {label:e.id.split('.').pop(),data,borderColor:e.col,backgroundColor:i===0?grad:'transparent',fill:i===0,borderWidth:1.5,tension:0.3,pointRadius:0};
  });
  charts[card.id]=new Chart(canvas.getContext('2d'),{
    type:'line',data:{labels,datasets},
    options:{responsive:true,maintainAspectRatio:false,animation:{duration:600},
      plugins:{legend:{display:ents.length>1,labels:{color:_cLegend(),font:{size:8},boxWidth:10}},
        tooltip:{backgroundColor:_cTooltipBg(),titleColor:_cTooltipText(),bodyColor:_cTooltipText(),callbacks:{label:i=>` ${i.raw?.toFixed(1)||'?'} ${card.unit||''}`}}},
      scales:{x:{display:false},y:{display:true,grid:{color:_cGrid(),drawBorder:false},ticks:{color:_cTick(),font:{size:8},maxTicksLimit:4},border:{display:false}}}}
  });
}

async function initBarChart(card){
  destroyChart(card.id);
  const canvas=document.getElementById('ch-'+card.id);
  if(!canvas) return;
  const pts=await fetchHistory(card.entity,card.hours||24);
  if(!pts.length) return;
  const buckets={};
  pts.forEach(p=>{const h=p.t.getHours();if(!buckets[h])buckets[h]=[];buckets[h].push(p.v);});
  const labels=Object.keys(buckets).sort((a,b)=>a-b).map(h=>h+'h');
  const data=Object.keys(buckets).sort((a,b)=>a-b).map(h=>buckets[h].reduce((s,v)=>s+v,0)/buckets[h].length);
  const color=card.color||'#6366f1';
  charts[card.id]=new Chart(canvas.getContext('2d'),{
    type:'bar',
    data:{labels,datasets:[{data,backgroundColor:color+'88',borderColor:color,borderWidth:1,borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,animation:{duration:600},
      plugins:{legend:{display:false},tooltip:{backgroundColor:_cTooltipBg(),titleColor:_cTooltipText(),bodyColor:_cTooltipText(),callbacks:{label:i=>` ${i.raw.toFixed(1)} ${card.unit||''}`}}},
      scales:{x:{grid:{color:_cGrid(),drawBorder:false},ticks:{color:_cTick(),font:{size:8}},border:{display:false}},
        y:{grid:{color:_cGrid(),drawBorder:false},ticks:{color:_cTick(),font:{size:8},maxTicksLimit:4,callback:v=>v+(card.unit||'').slice(0,3)},border:{display:false}}}}
  });
}

/* ═══ RENDER DASHBOARD ═══ */
function renderDash(){
  try{ _applyKioskAvail(); }catch(e){}   // icona kiosk visibile solo se cfg.kioskEnabled
  try{ _applyTopbarStyle(); }catch(e){}  // icone/colori barra in alto personalizzati
  const page=curPage();
  _ensureSections(page);
  const dash=document.getElementById('dash');
  const sectionsEl=document.getElementById('dash-sections');
  // Clean up previous cards
  _cleanupWeatherTimers();
  [...sectionsEl.querySelectorAll('.card')].forEach(c=>{ destroyChart(c.dataset.id); stopCamTimer(c.dataset.id); _stopYamlCard(c.dataset.id); });
  [...sectionsEl.querySelectorAll('.sect-wrap,.dash-section,.sect-add-row,.sect-hint,.fbar-edit-box')].forEach(s=>s.remove());
  document.getElementById('page-header-row')?.remove();
  document.getElementById('page-view-header')?.remove();
  document.getElementById('page-view-footer')?.remove();
  document.getElementById('hbar-zone')?.remove();

  const empty=document.getElementById('empty');

  // UNA sola barra header: orologio/kiosk (header-bar) + distintivi (page-view-header) sovrapposti
  const hbarCards=page.cards.filter(c=>c.type==='header-bar');
  const headerRow=document.createElement('div');
  headerRow.id='page-header-row';
  // has-hbar (overlay distintivi sull'orologio) SOLO in vista: in modifica l'header scorre impilato (niente sovrapposizioni)
  if(hbarCards.length && !editMode) headerRow.classList.add('has-hbar');
  dash.insertBefore(headerRow, sectionsEl);
  const hbarZone=document.createElement('div');
  hbarZone.id='hbar-zone';
  const viewHdr=document.createElement('div');
  viewHdr.id='page-view-header';
  headerRow.appendChild(hbarZone);
  headerRow.appendChild(viewHdr);

  const normalCards=page.cards.filter(c=>c.type!=='header-bar');
  hbarCards.forEach(c=>hbarZone.appendChild(_safeBuildCard(c)));

  // Mostra sempre le sezioni (con placeholder "Trascina qui") — nasconde empty solo se non ci sono sezioni
  if(page.sections&&page.sections.length){
    empty.style.display='none';
    page.sections.forEach(sec=>{
      const secEl=_buildSectionEl(sec,page);
      sectionsEl.appendChild(secEl);
    });
    // "+ Aggiungi riga" (stile Oikos) — visibile solo in modifica via CSS
    const addRow=document.createElement('button');
    addRow.className='sect-add-row';
    addRow.innerHTML='<span style="font-size:16px;line-height:1">+</span> Aggiungi riga';
    addRow.addEventListener('click',()=>addSection());
    sectionsEl.appendChild(addRow);
  } else {
    empty.style.display='flex';
  }

  // IN MODIFICA: sposta l'intestazione (titolo/distintivi/pulsanti) DENTRO #dash-sections come primo
  // elemento, nello STESSO flusso del banner e delle righe → impossibile che si sovrappongano.
  if(editMode){
    sectionsEl.insertBefore(viewHdr, sectionsEl.firstChild);
    // Riquadro dedicato "Barra inferiore" (come il riquadro distintivi in alto)
    const fb=cfg.footerBar||{}; const fbtns=fb.buttons||[];
    const prev=fbtns.length
      ? fbtns.map(b=>b.type==='sep'?'<span class="febx-sep"></span>':`<span class="febx-chip">${_renderIcon(b.icon||'mdi:circle-outline',18,b.color||'#cbd5e1')}${b.label?`<i>${eh(b.label)}</i>`:''}</span>`).join('')
      : '<span class="febx-empty">Nessun pulsante — premi Modifica per aggiungerne</span>';
    const fbarBox=document.createElement('div');
    fbarBox.className='fbar-edit-box';
    fbarBox.innerHTML=`<div class="febx-head"><span class="febx-lbl">▭ Barra inferiore</span>
      <button class="febx-mod" data-action="openFBM">✏️ Modifica barra inferiore</button></div>
      <div class="febx-preview">${prev}</div>`;
    sectionsEl.appendChild(fbarBox);
  }

  const viewFtr=document.createElement('div');
  viewFtr.id='page-view-footer';
  dash.appendChild(viewFtr);
  setTimeout(()=>{
    page.cards.forEach(c=>{
      if(c.type==='history') initHistoryChart(c);
      else if(c.type==='multiline') initMultilineChart(c);
      else if(c.type==='bar') initBarChart(c);
      else if(c.type==='camera') startCamTimer(c);
      else if(c.type==='weather'||c.type==='weather-forecast') _initWeatherBG(c.id, hs[c.entity||'']||'unknown');
    });
  },60);
  startClockTick();
  renderCList();
  renderPageTabs();
  renderBadgesAll();
  renderFbarZone();
}

function _buildSectionEl(sec,page){
  const wrap=document.createElement('div');
  wrap.className='sect-wrap'; wrap.dataset.secId=sec.id;

  // ── Oikos-style row header (visibile solo in modifica via CSS) ──
  const secIdx=(page.sections||[]).findIndex(s=>s.id===sec.id);
  const head=document.createElement('div');
  head.className='sect-head';
  head.innerHTML=`<span class="sh-lbl">≡ RIGA ${secIdx+1}${sec.label?' · '+eh(sec.label):''}</span>
    <button class="sh-btn sh-add" title="Aggiungi colonna">+ colonne</button>
    <button class="sh-btn sh-del" title="Elimina riga">✕ riga</button>`;
  head.querySelector('.sh-add').addEventListener('click',()=>setSectionCols(sec.id,(sec.cols||4)+1));
  head.querySelector('.sh-del').addEventListener('click',()=>delSectionRow(sec.id));
  wrap.appendChild(head);

  const el=document.createElement('div');
  el.className='dash-section'; el.dataset.secId=sec.id;
  const cols=sec.cols||4;
  // Fixed base grid of `cols` equal columns; each column outer uses span W to widen
  const colWidths=Array.from({length:cols},(_,i)=>(sec.colWidths&&sec.colWidths[i])||1);
  el.style.gridTemplateColumns=`repeat(${cols},1fr)`;
  el.style.gridAutoRows='auto'; // allow rows to wrap naturally

  // Sort cards: by starting column, then by order within column
  const secCards=page.cards
    .filter(c=>c.type!=='header-bar'&&c.secId===sec.id)
    .sort((a,b)=>{
      const ca=a.secCol||0, cb=b.secCol||0;
      if(ca!==cb) return ca-cb;
      return (a.secOrder||0)-(b.secOrder||0);
    });

  // Group cards by secCol
  const colMap={};
  secCards.forEach(c=>{
    const col=c.secCol||0;
    if(!colMap[col]) colMap[col]=[];
    colMap[col].push(c);
  });

  // Build one element per logical column (auto-placed, wraps when total span > cols)
  for(let col=0;col<cols;col++){
    {
      const isOccupied=!!colMap[col];
      const cards=isOccupied?colMap[col]:[];

      // Outer column: toolbar above + content box
      // Width in base grid units; auto-placed so columns wrap naturally
      const outer=document.createElement('div');
      outer.className='dash-col-outer';
      const cSpan=colWidths[col]||1;
      outer.style.gridColumn=`span ${cSpan}`;

      // Per-column toolbar (edit mode only, via CSS)
      const tb=document.createElement('div');
      tb.className='col-toolbar';
      // "Col X/N" label (stile Oikos)
      const colLbl=document.createElement('span');
      colLbl.className='col-tb-lbl';
      colLbl.textContent=`Col ${col+1}/${cols}`;
      tb.appendChild(colLbl);
      // Drag handle
      const dragHandle=document.createElement('button');
      dragHandle.className='col-tb-btn col-drag-handle';
      dragHandle.title='Trascina per spostare';
      dragHandle.innerHTML=`<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><rect x="5" y="5" width="10" height="2" rx="1"/><rect x="5" y="9" width="10" height="2" rx="1"/><rect x="5" y="13" width="10" height="2" rx="1"/></svg>`;
      dragHandle.style.cursor='grab';
      dragHandle.setAttribute('draggable','true');
      dragHandle.addEventListener('dragstart',e=>{
        _colDragSrc={secId:sec.id,col};
        e.dataTransfer.effectAllowed='move';
        e.dataTransfer.setData('text/plain','col');
        outer.classList.add('col-dragging');
        e.stopPropagation();
      });
      dragHandle.addEventListener('dragend',()=>{
        outer.classList.remove('col-dragging');
        document.querySelectorAll('.dash-col-outer').forEach(o=>o.classList.remove('col-drop-left','col-drop-right'));
        _colDragSrc=null;
      });
      tb.appendChild(dragHandle);
      // Sposta colonna ‹ › (stile Oikos)
      const mvL=document.createElement('button');
      mvL.className='col-tb-btn'; mvL.title='Sposta a sinistra'; mvL.textContent='‹';
      mvL.style.fontSize='15px';
      if(col<=0){ mvL.disabled=true; mvL.style.opacity='.25'; }
      else mvL.addEventListener('click',()=>moveColTo(sec.id,col,col-1));
      tb.appendChild(mvL);
      const mvR=document.createElement('button');
      mvR.className='col-tb-btn'; mvR.title='Sposta a destra'; mvR.textContent='›';
      mvR.style.fontSize='15px';
      if(col>=cols-1){ mvR.disabled=true; mvR.style.opacity='.25'; }
      else mvR.addEventListener('click',()=>moveColTo(sec.id,col,col+1));
      tb.appendChild(mvR);
      // Width control: ◀ Nfr ▶
      const cw=colWidths[col]||1;
      const totalUsed=colWidths.reduce((s,v)=>s+v,0);
      const wWrap=document.createElement('div');
      wWrap.style.cssText='display:flex;align-items:center;gap:1px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;overflow:hidden';
      const wDec=document.createElement('button');
      wDec.style.cssText='background:none;border:none;color:rgba(255,255,255,.55);font-size:11px;width:20px;height:26px;cursor:pointer;padding:0;line-height:1;transition:color .12s';
      wDec.textContent='◀';
      wDec.title='Riduci larghezza';
      wDec.disabled=cw<=1;
      if(cw<=1) wDec.style.opacity='.25';
      wDec.addEventListener('click',()=>setColWidth(sec.id,col,cw-1));
      const wLbl=document.createElement('span');
      wLbl.style.cssText='font-size:9px;color:rgba(255,255,255,.55);min-width:18px;text-align:center;padding:0 1px;font-weight:600';
      wLbl.textContent=cw+'×';
      const wInc=document.createElement('button');
      wInc.style.cssText='background:none;border:none;color:rgba(255,255,255,.55);font-size:11px;width:20px;height:26px;cursor:pointer;padding:0;line-height:1;transition:color .12s';
      wInc.textContent='▶';
      wInc.title='Aumenta larghezza';
      wInc.disabled=cw>=4||(totalUsed>=cols*2&&cw===1);
      if(wInc.disabled) wInc.style.opacity='.25';
      wInc.addEventListener('click',()=>setColWidth(sec.id,col,cw+1));
      wWrap.appendChild(wDec); wWrap.appendChild(wLbl); wWrap.appendChild(wInc);
      tb.appendChild(wWrap);
      // Copy button
      const copyBtn=document.createElement('button');
      copyBtn.className='col-tb-btn';
      copyBtn.title='Copia colonna';
      copyBtn.innerHTML=`<svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path d="M7 2h7a2 2 0 012 2v10a2 2 0 01-2 2h-1v-1h1a1 1 0 001-1V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1H5V4a2 2 0 012-2zm-3 4h7a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm0 1a1 1 0 00-1 1v10a1 1 0 001 1h7a1 1 0 001-1V8a1 1 0 00-1-1H4z"/></svg>`;
      copyBtn.addEventListener('click',()=>copyCol(sec.id,col));
      tb.appendChild(copyBtn);
      // Paste button (only when clipboard has content)
      if(_colClipboard&&_colClipboard.length){
        const pasteBtn=document.createElement('button');
        pasteBtn.className='col-tb-btn';
        pasteBtn.title='Incolla colonna qui';
        pasteBtn.style.color='rgba(99,102,241,.9)';
        pasteBtn.innerHTML=`<svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path d="M8 2a1 1 0 00-1 1H5a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2a1 1 0 00-1-1H8zm0 2h4v1H8V4zM5 7h10v9H5V7z"/></svg>`;
        pasteBtn.addEventListener('click',()=>pasteCol(sec.id,col));
        tb.appendChild(pasteBtn);
      }
      // Delete button
      const delBtn=document.createElement('button');
      delBtn.className='col-tb-btn danger';
      delBtn.title='Elimina colonna';
      delBtn.innerHTML=`<svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor"><path d="M6 4v1H3v1.5h1l.8 9.5a1 1 0 001 .9h8.4a1 1 0 001-.9l.8-9.5H17V5h-3V4a1 1 0 00-1-1H7a1 1 0 00-1 1zm2 0h4v1H8V4zm-2.2 7.5.2-5h8l.2 5H5.8z"/></svg>`;
      delBtn.addEventListener('click',()=>deleteCol(sec.id,col));
      tb.appendChild(delBtn);
      outer.appendChild(tb);

      // Column drag-over / drop for reordering columns
      outer.addEventListener('dragover',e=>{
        if(_colDragSrc&&_colDragSrc.secId===sec.id&&_colDragSrc.col!==col){
          e.preventDefault(); e.stopPropagation();
          document.querySelectorAll('.dash-col-outer').forEach(o=>o.classList.remove('col-drop-left','col-drop-right'));
          const rect=outer.getBoundingClientRect();
          outer.classList.add(e.clientX<rect.left+rect.width/2?'col-drop-left':'col-drop-right');
          return;
        }
        // Card drag-over handled on the box below
      });
      outer.addEventListener('dragleave',e=>{
        if(_colDragSrc&&!outer.contains(e.relatedTarget)){
          outer.classList.remove('col-drop-left','col-drop-right');
        }
      });
      outer.addEventListener('drop',e=>{
        if(_colDragSrc&&_colDragSrc.secId===sec.id&&_colDragSrc.col!==col){
          e.preventDefault(); e.stopPropagation();
          outer.classList.remove('col-drop-left','col-drop-right');
          const rect=outer.getBoundingClientRect();
          let toCol=col;
          if(e.clientX>=rect.left+rect.width/2&&col>_colDragSrc.col) toCol=col;
          else if(e.clientX<rect.left+rect.width/2&&col<_colDragSrc.col) toCol=col;
          moveColTo(sec.id,_colDragSrc.col,toCol);
          _colDragSrc=null;
        }
      });

      // Dashed content box
      const box=document.createElement('div');
      box.className='dash-col-box';
      // Drop onto box = drop to this column
      box.addEventListener('dragover',e=>{ if(dragSrc){e.preventDefault();box.classList.add('drop-col-target');}});
      box.addEventListener('dragleave',e=>{ if(!box.contains(e.relatedTarget)) box.classList.remove('drop-col-target');});
      box.addEventListener('drop',e=>{ e.preventDefault(); box.classList.remove('drop-col-target'); if(dragSrc) moveToCol(dragSrc,sec.id,col); });

      if(isOccupied){
        // Card stack
        const wrapper=document.createElement('div');
        wrapper.className='dash-col-wrap';
        wrapper.dataset.secId=sec.id; wrapper.dataset.col=col;
        cards.forEach(c=>{
          const vis=_cardVisible(c);
          if(!vis && !editMode) return;   // nascosta dalla condizione → in vista non si mostra
          const cw=document.createElement('div');
          cw.className='dash-card-wrap'+(!vis?' card-cond-hidden':'');
          cw.style.height=(c.height||sec.rowH||150)+'px';
          cw.dataset.cardId=c.id; cw.dataset.secId=sec.id; cw.dataset.col=col;
          cw.addEventListener('dragover',e=>{ if(dragSrc&&dragSrc!==c.id){e.preventDefault();cw.classList.add('dov');}});
          cw.addEventListener('dragleave',()=>cw.classList.remove('dov'));
          cw.addEventListener('drop',e=>{ e.preventDefault(); cw.classList.remove('dov'); if(dragSrc&&dragSrc!==c.id) swapC(dragSrc,c.id); });
          cw.appendChild(_safeBuildCard(c));
          if(!vis){ const m=document.createElement('div'); m.className='cond-hidden-mark'; m.textContent='👁 nascosta dalla condizione'; cw.appendChild(m); }
          wrapper.appendChild(cw);
        });
        box.appendChild(wrapper);
      } else {
        // Empty placeholder (only shown in edit mode)
        const ph=document.createElement('div');
        ph.className='dash-col-empty';
        ph.textContent='Colonna vuota';
        ph.addEventListener('dragover',e=>{ if(dragSrc){e.preventDefault();ph.classList.add('drop-target');}});
        ph.addEventListener('dragleave',()=>ph.classList.remove('drop-target'));
        ph.addEventListener('drop',e=>{ e.preventDefault(); ph.classList.remove('drop-target'); if(dragSrc) moveToCol(dragSrc,sec.id,col); });
        box.appendChild(ph);
      }

      // Add-card button at the bottom of the box
      const addBtn=document.createElement('div');
      addBtn.className='col-add-btn';
      addBtn.title='Aggiungi card';
      addBtn.innerHTML='<span style="font-size:17px;line-height:1">+</span> Card';
      addBtn.addEventListener('click',e=>addCardToCol(sec.id,col,addBtn));
      box.appendChild(addBtn);

      outer.appendChild(box);
      el.appendChild(outer);
    }
  }

  wrap.appendChild(el);
  return wrap;
}

let _clockInt=null;
function startClockTick(){
  if(_clockInt) clearInterval(_clockInt);
  _clockInt=setInterval(()=>{
    document.querySelectorAll('.clk-card').forEach(el=>{
      const cid=el.dataset.id;
      const card=curPage().cards?.find(c=>c.id===cid)||{};
      el.innerHTML=clockInner(card);
    });
    // header bar + barre header-bar: aggiorna SOLO gli orologi sul posto (niente re-render → niente flash dei chip)
    document.querySelectorAll('.hbar-clk').forEach(clk=>{
      let item={}; try{ item=JSON.parse(decodeURIComponent(clk.dataset.clk||'')); }catch(e){}
      const p=_clkParts(item);
      const t=clk.querySelector('.hbar-clk-time'); if(t) t.innerHTML=p.timeHTML;
      const dt=clk.querySelector('.hbar-clk-date'); if(dt) dt.textContent=p.dateText;
    });
  },1000);
}

/* ═══ BUILD CARD ═══ */
/* Card a prova di errore: se buildCard va in errore, mostra un riquadrino invece di rompere tutta la vista */
function _safeBuildCard(card){
  try{ return buildCard(card); }
  catch(e){
    try{ console.warn('[Frarik] errore card', card&&card.id, e&&e.message); }catch(_){}
    const el=document.createElement('div');
    el.className='card card-err';
    el.style.cssText='height:100%;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px;text-align:center;border:1px solid rgba(248,113,113,.3)';
    el.innerHTML=`<span style="font-size:26px">⚠️</span><div style="font-size:11px;color:#f87171;font-weight:800">Errore nella card</div><div style="font-size:10px;color:var(--muted);max-width:94%;word-break:break-word;line-height:1.4">${eh((card&&(card.label||card.type))||'')}${e&&e.message?(': '+eh(e.message)):''}</div>`;
    return el;
  }
}
function buildCard(card){
  const color=card.color||'#6366f1';
  const val=hs[card.entity]??'—';
  const numV=parseFloat(val);
  const dispV=isNaN(numV)?_stateIt(val):(numV%1===0?numV:numV.toFixed(numV<10?2:1));
  const barPct=card.max>0?Math.min(100,Math.round(numV/card.max*100)):0;
  const isOn=(val==='on'||val==='true');

  const el=document.createElement('div');
  const t=card.type;
  el.className='card'+(t==='picture-elements'?' card-pe':t==='appliances'?' card-app':t==='header-bar'?' card-hbar':t==='footer-bar'?' card-fbar':(t==='weather'||t==='weather-forecast')?' card-wtc':'');
  el.id='card-'+card.id;
  el.dataset.id=card.id;
  if(t!=='weather'){
    el.style.background=t==='picture-elements'?'transparent':(card.bgColor||color+'0d');
    el.style.border=`1px solid ${card.bgColor?'transparent':color+'28'}`;
    el.style.boxShadow=`0 8px 32px rgba(0,0,0,0.28),0 0 0 1px ${color}18,inset 0 1px 0 rgba(255,255,255,0.05)`;
  }
  // Sections mode: height is controlled by the wrap; no grid spans needed
  const inSections=!!curPage().sections;
  if(!inSections){
    el.style.gridColumn=`span ${card.colSpan||1}`;
    el.style.gridRow=`span ${card.rowSpan||1}`;
  }
  const radius=_shapeRadius(card.shape||'rounded');
  el.style.borderRadius=radius;
  el.style.setProperty('--card-r', radius);
  // Weather/forecast: override height to fill wrap
  if(t==='weather'||t==='weather-forecast') el.style.height='100%';

  const txtSt=card.textColor?`style="color:${card.textColor}"` :'';
  let inner='';

  if(t==='big'){
    inner=`<div class="c-val-wrap"><div class="v-big" id="v-${card.id}" style="color:${color}">${dispV}<span class="vunit"${txtSt?` ${txtSt}`:''}>${eh(card.unit)}</span></div>${card.sub?`<div class="vsub" id="s-${card.id}"${txtSt?` ${txtSt}`:''}>${eh(card.sub)}</div>`:''}</div>`;
  } else if(t==='compact'){
    inner=`<div class="c-val-wrap"><div class="v-compact" id="v-${card.id}" style="color:${color}">${dispV}<span class="vunit"${txtSt?` ${txtSt}`:''}>${eh(card.unit)}</span></div>${card.sub?`<div class="vsub"${txtSt?` ${txtSt}`:''}>${eh(card.sub)}</div>`:''}<div class="cbar"><div class="cbar-f" id="b-${card.id}" style="background:${color};width:${barPct}%"></div></div></div>`;
  } else if(t==='text'){
    inner=`<div class="c-val-wrap"><div class="v-text" id="v-${card.id}" style="color:${color};text-shadow:0 0 20px ${color}44">${_stateIt(val)}</div>${card.sub?`<div class="vsub"${txtSt?` ${txtSt}`:''}>${eh(card.sub)}</div>`:''}</div>`;
  } else if(t==='gauge'){
    inner=`<div class="gauge-wrap" id="v-${card.id}">${gaugeSVG(val,card.min||0,card.max||100,color,card.unit||'')}</div>`;
  } else if(t==='history'||t==='multiline'||t==='bar'){
    inner=`<div class="chart-wrap"><canvas id="ch-${card.id}"></canvas></div>`;
  } else if(t==='toggle'){
    const ts=isOn?`background:${color}`:'background:rgba(255,255,255,0.1)';
    inner=`<div class="toggle-wrap" id="v-${card.id}"><div style="text-align:center"><div class="toggle-track${isOn?' on':''}" id="tt-${card.id}" style="${ts}" data-action="doToggle" data-action-args='["${ea(card.entity)}","${card.id}"]'><div class="toggle-thumb"></div></div><div class="toggle-lbl" id="tl-${card.id}" style="color:${isOn?color:'rgba(255,255,255,0.25)'}">${isOn?'Acceso':'Spento'}</div></div></div>`;
  } else if(t==='flowbars'){
    inner=`<div class="fb-wrap" id="v-${card.id}">${buildFlowBarsRows(card)}</div>`;
  } else if(t==='flowmap'){
    inner=`<div class="fm-wrap" id="v-${card.id}">${flowMapSVG(card)}</div>`;
  } else if(t==='camera'){
    inner=`<div class="cam-wrap">
      <img id="cam-${card.id}" alt="Camera" class="cam-img" style="display:none">
      <div class="cam-badge">⏺ LIVE</div>
      <div class="cam-err" id="camer-${card.id}" style="display:none">📷 Nessun segnale</div>
    </div>`;
  } else if(t==='weather'){
    inner=`<div class="wtc" id="v-${card.id}" style="height:100%">${weatherCompactInner(card)}</div>`;
  } else if(t==='weather-hero'){
    inner=`<div class="wth-wrap wth-hero" id="v-${card.id}">${weatherHeroInner(card)}</div>`;
  } else if(t==='weather-forecast'){
    inner=`<div id="v-${card.id}" style="height:100%">${weatherForecastInner(card)}</div>`;
  } else if(t==='appliances'){
    inner=`<div id="v-${card.id}" style="height:100%">${appliancesInner(card)}</div>`;
  } else if(t==='picture-elements'){
    inner=`<div id="v-${card.id}" style="height:100%;padding:0">${pictureElementsInner(card)}</div>`;
  } else if(t==='clock'){
    inner=`<div id="v-${card.id}" class="clk-card" data-id="${card.id}" style="height:100%">${clockInner(card)}</div>`;
  } else if(t==='markdown'){
    inner=`<div id="v-${card.id}" style="height:100%;display:flex;flex-direction:column">${markdownInner(card)}</div>`;
  } else if(t==='media'){
    inner=`<div class="med-wrap" id="v-${card.id}">${mediaInner(card)}</div>`;
  } else if(t==='climate'){
    inner=`<div class="clm-wrap" id="v-${card.id}">${climateInner(card)}</div>`;
  } else if(t==='entities'){
    inner=`<div class="ents-wrap" id="v-${card.id}">${entitiesInner(card)}</div>`;
  } else if(t==='yaml-card'){
    inner=`<div id="v-${card.id}" class="jsc-wrap" style="height:100%;width:100%"></div>`;
    setTimeout(()=>{ const _w=document.getElementById('v-'+card.id); if(_w) _mountYamlCard(card,_w); },200);
  } else if(t==='js-custom'){
    const _jcReg=window.FratechCardRegistry||{};
    const _jcDef=_jcReg[card.jsCardId];
    if(_jcDef){
      try{
        inner=`<div id="v-${card.id}" class="jsc-wrap" style="height:100%;width:100%">${_jcDef.render(card,{states:hs})}</div>`;
        setTimeout(()=>{
          const _w=document.getElementById('v-'+card.id);
          if(_w&&typeof _jcDef.mount==='function') _jcDef.mount(card,{states:hs},_w);
        },0);
      }
      catch(e){ inner=`<div id="v-${card.id}" class="jsc-wrap jsc-err" style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px"><span style="font-size:24px">⚠️</span><span style="font-size:10px;color:#f87171">${e.message}</span></div>`; }
    } else {
      inner=`<div id="v-${card.id}" class="jsc-wrap jsc-err" style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px"><span style="font-size:22px">📦</span><span style="font-size:10px;color:var(--muted)">Card JS non trovata:<br>${card.jsCardId||'?'}</span></div>`;
    }
  } else if(t==='free'){
    inner=`<div id="v-${card.id}" class="free-canvas">${_freeCanvasViewInner(card)}</div>`;
  } else if(t==='header-bar'){
    inner=`<div id="v-${card.id}" class="hbar-inner" data-id="${card.id}">${hbarInner(card)}</div>`;
  } else if(t==='footer-bar'){
    inner=`<div id="v-${card.id}" class="fbar-inner-wrap" data-id="${card.id}">${fbarInner(card)}</div>`;
  }

  if(t==='free') el.classList.add('card-free');

  // Build size control row
  const _ovSize=inSections
    ?`<button class="ovb-sm" data-action="adjSecSpan" data-action-args='["${card.id}",-1]'>◀</button><span id="cs-${card.id}" style="min-width:28px;text-align:center">S:${card.colSpan||1}</span><button class="ovb-sm" data-action="adjSecSpan" data-action-args='["${card.id}",1]'>▶</button>&nbsp;<button class="ovb-sm" data-action="adjH" data-action-args='["${card.id}",-20]'>▲</button><span id="rs-${card.id}" style="min-width:36px;text-align:center">${card.height||150}px</span><button class="ovb-sm" data-action="adjH" data-action-args='["${card.id}",20]'>▼</button>`
    :`<button class="ovb-sm" data-action="adjSpan" data-action-args='["${card.id}","col",-1]'>◀</button><span id="cs-${card.id}">L:${card.colSpan||1}</span><button class="ovb-sm" data-action="adjSpan" data-action-args='["${card.id}","col",1]'>▶</button>&nbsp;<button class="ovb-sm" data-action="adjSpan" data-action-args='["${card.id}","row",-1]'>▲</button><span id="rs-${card.id}">A:${card.rowSpan||1}</span><button class="ovb-sm" data-action="adjSpan" data-action-args='["${card.id}","row",1]'>▼</button>`;

  // Header-bar / Footer-bar: template semplificato senza c-top/cglow
  if(t==='header-bar'||t==='footer-bar'){
    el.innerHTML=`
      <div class="card-inner">${inner}</div>
      <div class="hbar-ctrl">
        <button class="ovb ovb-edit" data-action="openCM" data-action-arg="${card.id}" title="Modifica">✏️</button>
        <button class="ovb ovb-dup"  data-action="dupCard" data-action-arg="${card.id}" title="Duplica">⧉</button>
        <button class="ovb ovb-cpy"  data-action="copyCard" data-action-arg="${card.id}" title="Copia">📋</button>
        <button class="ovb ovb-cut"  data-action="cutCard" data-action-arg="${card.id}" title="Taglia">✂️</button>
        <button class="ovb ovb-del"  data-action="delCard" data-action-arg="${card.id}" title="Elimina">🗑</button>
      </div>
      <div class="resize-handle" id="rh-${card.id}"></div>`;
    el.draggable=true;
    el.addEventListener('dragstart',e=>{ if(e.target.closest('.hbar-ctrl')){ e.preventDefault(); return; } if(!editMode){ e.preventDefault(); showToast('✏️ Abilita la modalità modifica per spostare le card'); return; } dragSrc=card.id; el.style.opacity='.4'; e.dataTransfer.effectAllowed='move'; });
    el.addEventListener('dragend',()=>{ el.style.opacity='1'; dragSrc=null; });
    el.addEventListener('dragover',e=>{ if(dragSrc&&dragSrc!==card.id){ e.preventDefault(); el.classList.add('dov'); }});
    el.addEventListener('dragleave',()=>el.classList.remove('dov'));
    el.addEventListener('drop',e=>{ e.preventDefault(); el.classList.remove('dov'); swapC(dragSrc,card.id); });
    setTimeout(()=>initResize(card.id),0);
    return el;
  }

  // yaml-card e js-custom: full-bleed, niente c-top, cursor default
  if(t==='yaml-card'||t==='js-custom'){
    el.classList.add('card-jsc');
    el.style.cssText+='padding:0;cursor:default;';
    el.innerHTML=`
      ${inner}
      <div class="card-ov" style="z-index:30">
        <div class="ov-row">
          <button class="ovb ovb-dup"  data-action="dupCard" data-action-arg="${card.id}" title="Duplica">⧉</button>
          <button class="ovb ovb-cpy"  data-action="copyCard" data-action-arg="${card.id}" title="Copia">📋</button>
          <button class="ovb ovb-cut"  data-action="cutCard" data-action-arg="${card.id}" title="Taglia">✂️</button>
          <button class="ovb ovb-del"  data-action="delCard" data-action-arg="${card.id}" title="Elimina">🗑</button>
        </div>
        <div class="ov-row" style="margin-top:2px"><div class="ov-size">${_ovSize}</div></div>
      </div>
      <div class="resize-handle" id="rh-${card.id}"></div>`;
    el.draggable=true;
    el.addEventListener('dragstart',e=>{ if(!editMode){ e.preventDefault(); return; } dragSrc=card.id; el.style.opacity='.4'; e.dataTransfer.effectAllowed='move'; });
    el.addEventListener('dragend',()=>{ el.style.opacity='1'; dragSrc=null; });
    el.addEventListener('dragover',e=>{ if(dragSrc&&dragSrc!==card.id){ e.preventDefault(); el.classList.add('dov'); }});
    el.addEventListener('dragleave',()=>el.classList.remove('dov'));
    el.addEventListener('drop',e=>{ e.preventDefault(); el.classList.remove('dov'); swapC(dragSrc,card.id); });
    setTimeout(()=>initResize(card.id),0);
    return el;
  }

  // Weather / weather-forecast: full-bleed — no cglow or c-top header
  if(t==='weather'||t==='weather-forecast'){
    el.innerHTML=`
      ${inner}${_renderCardBadgesHTML(card)}
      <div class="card-ov" style="z-index:30">
        <div class="ov-row">
          <button class="ovb ovb-edit" data-action="openCM" data-action-arg="${card.id}" title="Modifica">✏️</button>
          <button class="ovb ovb-dup"  data-action="dupCard" data-action-arg="${card.id}" title="Duplica">⧉</button>
          <button class="ovb ovb-cpy"  data-action="copyCard" data-action-arg="${card.id}" title="Copia">📋</button>
          <button class="ovb ovb-cut"  data-action="cutCard" data-action-arg="${card.id}" title="Taglia">✂️</button>
          <button class="ovb ovb-del"  data-action="delCard" data-action-arg="${card.id}" title="Elimina">🗑</button>
        </div>
        <div class="ov-row" style="margin-top:2px"><div class="ov-size">${_ovSize}</div></div>
      </div>
      <div class="resize-handle" id="rh-${card.id}"></div>`;
    el.draggable=true;
    el.addEventListener('dragstart',e=>{ if(!editMode){ e.preventDefault(); showToast('✏️ Abilita la modalità modifica per spostare le card'); return; } dragSrc=card.id; el.style.opacity='.4'; e.dataTransfer.effectAllowed='move'; });
    el.addEventListener('dragend',()=>{ el.style.opacity='1'; dragSrc=null; });
    el.addEventListener('dragover',e=>{ if(dragSrc&&dragSrc!==card.id){ e.preventDefault(); el.classList.add('dov'); }});
    el.addEventListener('dragleave',()=>el.classList.remove('dov'));
    el.addEventListener('drop',e=>{ e.preventDefault(); el.classList.remove('dov'); swapC(dragSrc,card.id); });
    el.addEventListener('click',e=>handleCardClick(card,e));
    setTimeout(()=>initResize(card.id),0);
    return el;
  }

  el.innerHTML=`
    <div class="cglow" style="background:${color}"></div>
    <div class="c-top">
      <div class="c-lbl" ${txtSt}><span class="c-ico">${card.icon?_renderIcon(card.icon,18,'var(--acc2)'):''}</span>${eh(card.label)}</div>
    </div>
    <div class="card-inner">${inner}${_renderCardBadgesHTML(card)}</div>
    <div class="card-ov">
      <div class="ov-row">
        <button class="ovb ovb-edit" data-action="openCM" data-action-arg="${card.id}" title="${t==='free'?'Modifica Canvas':'Modifica'}">${t==='free'?'🎨':'✏️'}</button>
        <button class="ovb ovb-dup"  data-action="dupCard" data-action-arg="${card.id}" title="Duplica">⧉</button>
        <button class="ovb ovb-cpy"  data-action="copyCard" data-action-arg="${card.id}" title="Copia">📋</button>
        <button class="ovb ovb-cut"  data-action="cutCard" data-action-arg="${card.id}" title="Taglia">✂️</button>
        <button class="ovb ovb-del"  data-action="delCard" data-action-arg="${card.id}" title="Elimina">🗑</button>
      </div>
      <div class="ov-row" style="margin-top:2px"><div class="ov-size">${_ovSize}</div></div>
    </div>
    <div class="resize-handle" id="rh-${card.id}"></div>`;

  el.draggable=true;
  el.addEventListener('dragstart',e=>{ if(!editMode){ e.preventDefault(); showToast('✏️ Abilita la modalità modifica per spostare le card'); return; } dragSrc=card.id; el.style.opacity='.4'; e.dataTransfer.effectAllowed='move'; });
  el.addEventListener('dragend',()=>{ el.style.opacity='1'; dragSrc=null; });
  el.addEventListener('dragover',e=>{ if(dragSrc&&dragSrc!==card.id){ e.preventDefault(); el.classList.add('dov'); }});
  el.addEventListener('dragleave',()=>el.classList.remove('dov'));
  el.addEventListener('drop',e=>{ e.preventDefault(); el.classList.remove('dov'); swapC(dragSrc,card.id); });
  el.addEventListener('click',e=>handleCardClick(card,e));
  setTimeout(()=>initResize(card.id),0);
  return el;
}

/* ═══ RESIZE ═══ */
function initResize(cardId){
  const rh=document.getElementById('rh-'+cardId);
  const ce=document.getElementById('card-'+cardId);
  if(!rh||!ce) return;
  rh.onmousedown=e=>{
    e.preventDefault(); e.stopPropagation();
    const page=curPage();
    const card=page.cards.find(c=>c.id===cardId);
    if(!card) return;
    if(page.sections){
      // Sections mode: resize height only
      const wrap=ce.closest('.dash-card-wrap');
      const sy=e.clientY, sh=wrap?wrap.offsetHeight:ce.offsetHeight;
      const mm=ev=>{
        const nh=Math.max(80,sh+ev.clientY-sy);
        card.height=nh;
        if(wrap) wrap.style.height=nh+'px';
        const rs=document.getElementById('rs-'+cardId); if(rs) rs.textContent=nh+'px';
      };
      const mu=()=>{ document.removeEventListener('mousemove',mm); document.removeEventListener('mouseup',mu); saveCfg(); };
      document.addEventListener('mousemove',mm); document.addEventListener('mouseup',mu);
    } else {
      // Legacy grid mode
      const sx=e.clientX,sy=e.clientY,sw=ce.offsetWidth,sh=ce.offsetHeight;
      const colW=sw/(card.colSpan||1),rowH=sh/(card.rowSpan||1);
      const mm=ev=>{
        const nc=Math.max(1,Math.min(page.columns,Math.round((sw+ev.clientX-sx)/colW)));
        const nr=Math.max(1,Math.min(6,Math.round((sh+ev.clientY-sy)/rowH)));
        if(nc!==card.colSpan||nr!==card.rowSpan){
          card.colSpan=nc; card.rowSpan=nr;
          ce.style.gridColumn=`span ${nc}`; ce.style.gridRow=`span ${nr}`;
          const cs=document.getElementById('cs-'+cardId); if(cs) cs.textContent='L:'+nc;
          const rs=document.getElementById('rs-'+cardId); if(rs) rs.textContent='A:'+nr;
        }
      };
      const mu=()=>{ document.removeEventListener('mousemove',mm); document.removeEventListener('mouseup',mu); saveCfg(); };
      document.addEventListener('mousemove',mm); document.addEventListener('mouseup',mu);
    }
  };
}

/* ═══ LIVE UPDATE ═══ */
function liveUpdate(entityId){
  // Aggiorna il raw store per le card JS (serve a buildHass)
  if(!window._fratechHassRaw) window._fratechHassRaw={};
  // lo stato raw arriva tramite hs, ma gli attributi sono in _hsAttrs se presente
  window._fratechHassRaw[entityId] = {state: String(hs[entityId]??''), attributes: (window._hsAttrs?.[entityId])||{}};
  const page=curPage();
  page.cards.forEach(card=>{
    if(card.type==='js-custom'){
      updateCardEl(card);
      return;
    }
    const uses=[card.entity,card.entity2,card.entity3,card.solar,card.load,card.grid,card.battery,...(card.items||[]).map(i=>i.entity),...(card.groups||[]).flatMap(g=>g.entities||[])].filter(Boolean);
    if(!uses.includes(entityId)) return;
    updateCardEl(card);
  });
  _refreshChipPopup();
  _liveUpdateBadges(entityId);
  // Aggiorna header bar chips che usano questa entità
  const hdrAllChips=[...(cfg.hdrBar?.left||[]),...(cfg.hdrBar?.center||[]),...(cfg.hdrBar?.right||[])];
  if(hdrAllChips.some(ch=>ch?.entity===entityId)) try{ renderHdrChips(); }catch(e){}
  // Aggiorna header-bar card chips nella dashboard
  document.querySelectorAll('.hbar-inner[data-id]').forEach(el=>{
    const card=curPage()?.cards?.find(c=>c.id===el.dataset.id);
    if(!card) return;
    const chips=[...(card.left||[]),...(card.center||[]),...(card.right||[])];
    if(chips.some(ch=>ch?.entity===entityId)) el.innerHTML=hbarInner(card);
  });
  // visibilità condizionale card: se una card deve apparire/sparire per questa entità → ridisegna
  try{ if(_cardVisChanged(entityId)) renderDash(); }catch(e){}
  // Update footer bar zone if a button uses this entity
  if((cfg.footerBar?.buttons||[]).some(b=>b.entity===entityId)) renderFbarZone();
}

/* ═══════════════════════════════════════════════════════
   BADGE SYSTEM
═══════════════════════════════════════════════════════ */
let _badgeZone='header';
let _badgeType='entity';
let _badgeSelColor=COLORS[0];
let _badgeDisp='full';
let _badgeColMode='fixed';
let _badgeRules=[];          // [{op,val,val2,color}]
let _badgeAction='none';
let _badgeVisMode='always';
let _editBadgeIdx=null;      // null = nuovo, altrimenti indice in modifica

function _getBadgeArr(){
  if(_badgeZone==='header') return curPage().headerBadges||(curPage().headerBadges=[]);
  if(_badgeZone==='footer') return curPage().footerBadges||(curPage().footerBadges=[]);
  const cid=_badgeZone.replace('card:','');
  const card=curPage().cards.find(c=>c.id===cid);
  if(!card) return [];
  return card.cardBadges||(card.cardBadges=[]);
}

let _bmMode='manage';   // 'manage' = lista distintivi esistenti · 'new' = solo form nuovo distintivo
function openBM(zone, mode){
  _badgeZone=zone; _bmMode=mode||'manage';
  const listEl=document.getElementById('badge-list');
  const addRow=document.getElementById('bm-addrow');
  const modal=document.getElementById('bmod');
  modal.classList.toggle('bmod-new',_bmMode==='new');
  const alignRow=document.getElementById('bm-align');
  if(_bmMode==='new'){
    document.getElementById('bmod-title').textContent='🏷️ Nuovo distintivo';
    if(listEl) listEl.style.display='none';
    if(addRow) addRow.style.display='none';
    if(alignRow) alignRow.style.display='none';
    modal.classList.remove('off');
    showBadgeForm();
  } else {
    const titles={header:'Intestazione',footer:'Piè di pagina'};
    document.getElementById('bmod-title').textContent='🏷️ Gestione · '+(titles[zone]||(zone.startsWith('card:')?'Card':''));
    if(listEl) listEl.style.display='';
    if(addRow) addRow.style.display='';
    // allineamento solo per intestazione/piè (non per i badge nelle card)
    if(alignRow){
      const showAlign=(zone==='header'||zone==='footer');
      alignRow.style.display=showAlign?'flex':'none';
      if(showAlign){
        const cur=(zone==='header'?(curPage().headerBadgesStyle||{}):(curPage().footerStyle||{})).align||'center';
        alignRow.querySelectorAll('.bf-chip').forEach(b=>b.classList.toggle('on',b.dataset.al===cur));
      }
    }
    hideBadgeForm();
    renderBadgeList();
    modal.classList.remove('off');
  }
}
function _bmSetAlign(a){
  const p=curPage();
  if(_badgeZone==='header')(p.headerBadgesStyle||(p.headerBadgesStyle={})).align=a;
  else if(_badgeZone==='footer')(p.footerStyle||(p.footerStyle={})).align=a;
  document.querySelectorAll('#bm-align .bf-chip').forEach(b=>b.classList.toggle('on',b.dataset.al===a));
  saveCfg(); renderBadgesAll();
}
function closeBM(){
  document.getElementById('bmod').classList.add('off');
  saveCfg(); renderBadgesAll();
  if(editingId) _updateCMBadgePreview();
  // If section editor is open, refresh its badge list
  if(!document.getElementById('sectmod').classList.contains('off')){
    renderSectBadgeList();
    const pb=document.getElementById('sect-paste-btn');
    if(pb) pb.style.display=_badgeClipboard?'':'none';
  }
}

function renderBadgeList(){
  const arr=_getBadgeArr();
  const el=document.getElementById('badge-list');
  if(!arr.length){
    el.innerHTML=`<div style="padding:14px 0;font-size:11px;opacity:.3;text-align:center">Nessun badge — clicca ➕ per aggiungerne uno</div>`;
    return;
  }
  el.innerHTML=arr.map((b,i)=>{
    const typeMap={entity:'Entità',text:'Testo fisso',sep:'Separatore'};
    const col=b.color||'rgba(255,255,255,.7)';
    let desc='';
    if(b.type==='entity') desc=(b.icon?b.icon+' ':'')+(b.label?b.label+': ':'')+eh(b.entity||'')+(b.suffix?' ('+b.suffix+')':'');
    else if(b.type==='text') desc=(b.icon?b.icon+' ':'')+eh(b.text||b.label||'');
    else desc='───';
    const tags=[];
    if(b.colorMode&&b.colorMode!=='fixed') tags.push('🎨auto');
    if(b.action&&b.action!=='none') tags.push('▸azione');
    if(b.vis&&b.vis.mode==='cond') tags.push('👁condizione');
    return `<div class="badge-row">
      <div class="badge-row-ico">${b.type==='sep'?'│':b.icon||'🏷️'}</div>
      <div class="badge-row-info" data-action="editBadgeAt" data-action-args='[${i}]' style="cursor:pointer">
        <div class="badge-row-type">${typeMap[b.type]||b.type}${tags.length?' · <span style="color:var(--muted);font-weight:600">'+tags.join(' ')+'</span>':''}</div>
        <div class="badge-row-desc" style="color:${col}">${desc}</div>
      </div>
      <button class="brow-btn" data-action="editBadgeAt" data-action-args='[${i}]' title="Modifica">✏️</button>
      <button class="brow-btn brow-mv" data-action="moveBadge" data-action-args='[${i},-1]' title="Su">▲</button>
      <button class="brow-btn brow-mv" data-action="moveBadge" data-action-args='[${i},1]' title="Giù">▼</button>
      <button class="brow-btn brow-del" data-action="delBadge" data-action-args='[${i}]'>✕</button>
    </div>`;
  }).join('');
}
function moveBadge(i,dir){
  const arr=_getBadgeArr(); const j=i+dir;
  if(j<0||j>=arr.length) return;
  [arr[i],arr[j]]=[arr[j],arr[i]];
  renderBadgeList();
}
function delBadge(i){ _getBadgeArr().splice(i,1); saveCfg(); renderBadgeList(); }

function _fillNavPageSelect(sel){
  const s=document.getElementById('bf-navpage'); if(!s) return;
  s.innerHTML=(cfg.pages||[]).map((p,i)=>`<option value="${i}"${i===sel?' selected':''}>${(p.icon||'📄')+' '+eh(p.name||('Pagina '+(i+1)))}</option>`).join('');
}
/* reset completo del form a "nuovo" */
function showBadgeForm(){
  _editBadgeIdx=null;
  document.getElementById('bf-form-title').textContent='Nuovo distintivo';
  document.getElementById('bf-save-btn').innerHTML='➕ Aggiungi';
  document.getElementById('badge-form').style.display='';
  ['bf-entity','bf-suffix','bf-text','bf-icon','bf-label','bf-actentity','bf-url','bf-svc-domain','bf-svc-service','bf-svc-entity','bf-vis-entity','bf-vis-val'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  _badgeSelColor=COLORS[0]; _renderBFColors();
  _badgeDisp='full'; _setDispUI('full');
  _badgeColMode='fixed'; _badgeRules=[]; _setColModeUI('fixed'); _renderColorRules();
  _fillPopupCardSelect(''); _fillNavPageSelect(0);
  _badgeAction='none'; document.getElementById('bf-action').value='none'; _selBAction('none');
  _badgeVisMode='always'; _setVisUI('always');
  document.getElementById('bf-vis-op').value='eq';
  selBT('entity');
}
/* carica un distintivo esistente nel form (modifica) */
function editBadgeAt(i){
  const arr=_getBadgeArr(); const b=arr[i]; if(!b) return;
  _editBadgeIdx=i;
  document.getElementById('badge-form').style.display='';
  document.getElementById('bf-form-title').textContent='Modifica distintivo';
  document.getElementById('bf-save-btn').innerHTML='💾 Salva modifiche';
  selBT(b.type||'entity');
  document.getElementById('bf-entity').value=b.entity||'';
  document.getElementById('bf-suffix').value=b.suffix||'';
  document.getElementById('bf-text').value=b.text||'';
  document.getElementById('bf-icon').value=b.icon||'';
  document.getElementById('bf-label').value=b.label||'';
  _badgeDisp=b.display||'full'; _setDispUI(_badgeDisp);
  _badgeSelColor=b.color||COLORS[0]; _renderBFColors();
  _badgeColMode=b.colorMode||'fixed'; _setColModeUI(_badgeColMode);
  _badgeRules=Array.isArray(b.colorRules)?JSON.parse(JSON.stringify(b.colorRules)):[]; _renderColorRules();
  _badgeAction=b.action||(b.popupCard?'popup':'none');
  document.getElementById('bf-action').value=_badgeAction;
  _fillPopupCardSelect(b.popupCard||''); _fillNavPageSelect(b.navPage||0);
  document.getElementById('bf-actentity').value=b.actionEntity||'';
  document.getElementById('bf-url').value=b.url||'';
  document.getElementById('bf-svc-domain').value=b.svcDomain||'';
  document.getElementById('bf-svc-service').value=b.svcService||'';
  document.getElementById('bf-svc-entity').value=b.svcEntity||'';
  _selBAction(_badgeAction);
  const v=b.vis||{}; _badgeVisMode=v.mode==='cond'?'cond':'always'; _setVisUI(_badgeVisMode);
  document.getElementById('bf-vis-entity').value=v.entity||'';
  document.getElementById('bf-vis-op').value=v.op||'eq';
  document.getElementById('bf-vis-val').value=v.val||'';
  document.getElementById('badge-form').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function _fillPopupCardSelect(sel){
  const s=document.getElementById('bf-popupcard'); if(!s) return;
  const reg=window.FratechCardRegistry||{};
  const opts=Object.values(reg).map(c=>`<option value="${c.id}"${c.id===sel?' selected':''}>${(c.icon||'📦')+' '+(c.name||c.id)}</option>`).join('');
  s.innerHTML='<option value="">— nessuna —</option>'+opts;
}
function hideBadgeForm(){
  document.getElementById('badge-form').style.display='none'; _editBadgeIdx=null;
  if(_bmMode==='new'){ closeBM(); }   // in "Nuovo distintivo" non c'è lista: chiudi il popup
}

function selBT(t){
  _badgeType=t;
  ['entity','text','sep'].forEach(x=>document.getElementById('bft-'+x)?.classList.toggle('on',x===t));
  document.getElementById('bf-entity-row').style.display=t==='entity'?'':'none';
  document.getElementById('bf-text-row').style.display=t==='text'?'':'none';
  document.getElementById('bf-details-row').style.display=t==='sep'?'none':'';
}
/* ── Visualizzazione ── */
function _selDisp(d){ _badgeDisp=d; _setDispUI(d); }
function _setDispUI(d){ document.querySelectorAll('#bf-disp .bf-chip').forEach(b=>b.classList.toggle('on',b.dataset.disp===d)); }
/* ── Colore: modalità + regole ── */
function _selColMode(m){ _badgeColMode=m; _setColModeUI(m); }
function _setColModeUI(m){
  ['fixed','auto','rules'].forEach(x=>document.getElementById('bcm-'+x)?.classList.toggle('on',x===m));
  document.getElementById('bf-rules-wrap').style.display=(m==='rules')?'':'none';
}
function _addColorRule(){ _badgeRules.push({op:'eq',val:'',color:COLORS[0]}); _renderColorRules(); }
function _delColorRule(i){ _badgeRules.splice(i,1); _renderColorRules(); }
function _renderColorRules(){
  const el=document.getElementById('bf-rules-list'); if(!el) return;
  const ops=[['eq','='],['ne','≠'],['gt','>'],['lt','<'],['gte','≥'],['lte','≤'],['between','tra'],['contains','contiene']];
  el.innerHTML=_badgeRules.map((r,i)=>`<div class="bf-rule">
    <span class="bf-rule-if">se</span>
    <select class="finp bf-rule-op" data-input="_setRule" data-input-args='[${i},"op",true]'>${ops.map(o=>`<option value="${o[0]}"${r.op===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select>
    <input class="finp" style="flex:1;min-width:0" placeholder="valore" value="${eh(r.val||'')}" data-input="_setRule" data-input-args='[${i},"val"]'>
    ${r.op==='between'?`<input class="finp" style="flex:0 0 56px" placeholder="e" value="${eh(r.val2||'')}" data-input="_setRule" data-input-args='[${i},"val2"]'>`:''}
    <input type="color" class="bf-rule-col" value="${_hexOf(r.color)}" data-input="_setRule" data-input-args='[${i},"color"]'>
    <button class="brow-btn brow-del" data-action="_delColorRule" data-action-args='[${i}]'>✕</button>
  </div>`).join('')||'<div style="font-size:10px;color:var(--muted);padding:2px">Nessuna regola</div>';
}
function _setRule(i,field,val,rerender){ if(_badgeRules[i]){ _badgeRules[i][field]=val; if(rerender) _renderColorRules(); } }
function _hexOf(c){ if(!c) return '#6366f1'; if(/^#[0-9a-f]{6}$/i.test(c)) return c; const m=document.createElement('div'); m.style.color=c; document.body.appendChild(m); const rgb=getComputedStyle(m).color; m.remove(); const n=rgb.match(/\d+/g); if(!n) return '#6366f1'; return '#'+n.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join(''); }
/* ── Azione al clic ── */
function _selBAction(a){
  _badgeAction=a;
  const map={popup:'bfa-popup',more_info:'bfa-entity',toggle:'bfa-entity',navigate:'bfa-nav',service:'bfa-service',url:'bfa-url'};
  ['bfa-popup','bfa-entity','bfa-nav','bfa-service','bfa-url'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  const show=map[a]; if(show){const e=document.getElementById(show);if(e)e.style.display='';}
}
/* ── Visibilità ── */
function _selVis(m){ _badgeVisMode=m; _setVisUI(m); }
function _setVisUI(m){
  document.getElementById('bvis-always')?.classList.toggle('on',m==='always');
  document.getElementById('bvis-cond')?.classList.toggle('on',m==='cond');
  document.getElementById('bf-vis-cond').style.display=(m==='cond')?'':'none';
}
function _renderBFColors(){
  document.getElementById('bf-colors').innerHTML=COLORS.map(h=>
    `<div class="csw${h===_badgeSelColor?' on':''}" style="background:${h}" data-action="_selBC" data-action-arg="${h}"></div>`).join('');
}
function _selBC(h){
  _badgeSelColor=h;
  document.getElementById('bf-colors').querySelectorAll('.csw').forEach(el=>
    el.classList.toggle('on',el.style.background===h||el.style.backgroundColor===h));
}
function saveBadgeForm(){
  const prev=(_editBadgeIdx!=null)?_getBadgeArr()[_editBadgeIdx]:null;
  const b={id:prev?prev.id:uid(),type:_badgeType,color:_badgeSelColor||COLORS[0]};
  const G=id=>(document.getElementById(id)?.value||'').trim();
  if(_badgeType==='entity'){
    b.entity=G('bf-entity');
    if(!b.entity){ showToast('⚠️ Inserisci un\'entità HA'); return; }
    b.suffix=G('bf-suffix'); b.icon=G('bf-icon'); b.label=G('bf-label');
  } else if(_badgeType==='text'){
    b.text=G('bf-text'); b.icon=G('bf-icon'); b.label=G('bf-label');
    if(!b.text&&!b.icon&&!b.label){ showToast('⚠️ Inserisci del testo'); return; }
  }
  if(_badgeType!=='sep'){
    // visualizzazione
    b.display=_badgeDisp||'full';
    // colore
    b.colorMode=_badgeColMode||'fixed';
    if(_badgeColMode==='rules') b.colorRules=_badgeRules.filter(r=>r.color&&(r.val!==''||r.op==='contains'));
    // azione
    b.action=_badgeAction||'none';
    if(_badgeAction==='popup'){ const pc=G('bf-popupcard'); if(pc) b.popupCard=pc; }
    else if(_badgeAction==='more_info'||_badgeAction==='toggle'){ const ae=G('bf-actentity'); if(ae) b.actionEntity=ae; }
    else if(_badgeAction==='navigate'){ b.navPage=parseInt(document.getElementById('bf-navpage')?.value||0)||0; }
    else if(_badgeAction==='service'){ b.svcDomain=G('bf-svc-domain'); b.svcService=G('bf-svc-service'); b.svcEntity=G('bf-svc-entity'); }
    else if(_badgeAction==='url'){ b.url=G('bf-url'); }
    // visibilità
    if(_badgeVisMode==='cond'){
      const ve=G('bf-vis-entity');
      if(ve) b.vis={mode:'cond',entity:ve,op:document.getElementById('bf-vis-op').value,val:G('bf-vis-val')};
    }
  }
  const arr=_getBadgeArr();
  if(_editBadgeIdx!=null && arr[_editBadgeIdx]) arr[_editBadgeIdx]=b;
  else arr.push(b);
  _editBadgeIdx=null;
  hideBadgeForm();
  renderBadgeList();
  saveCfg();
  renderBadgesAll();
}

/* ── Distintivi: helper colore / visibilità / azioni ── */
const _BADGE_ON=['on','home','open','aperto','acceso','true','heat','cool','heat_cool','auto','playing','active','detected','wet','unlocked','sbloccato','presente','present','running','charging'];
const _BADGE_OFF=['off','away','closed','chiuso','spento','false','idle','standby','locked','bloccato','clear','not_home','assente','paused','disconnected','unavailable','unknown'];
function _badgeRuleMatch(st, r){
  if(!r) return false;
  const op=r.op||'eq';
  const a=String(st??'').trim(), av=String(r.val??'').trim();
  const na=parseFloat(a), nv=parseFloat(av), nv2=parseFloat(r.val2);
  switch(op){
    case 'eq': return a.toLowerCase()===av.toLowerCase();
    case 'ne': return a.toLowerCase()!==av.toLowerCase();
    case 'gt': return !isNaN(na)&&!isNaN(nv)&&na>nv;
    case 'lt': return !isNaN(na)&&!isNaN(nv)&&na<nv;
    case 'gte': return !isNaN(na)&&!isNaN(nv)&&na>=nv;
    case 'lte': return !isNaN(na)&&!isNaN(nv)&&na<=nv;
    case 'between': return !isNaN(na)&&!isNaN(nv)&&!isNaN(nv2)&&na>=Math.min(nv,nv2)&&na<=Math.max(nv,nv2);
    case 'contains': return a.toLowerCase().includes(av.toLowerCase());
    default: return false;
  }
}
function _badgeColor(b){
  const fixed=b.color||'rgba(255,255,255,0.85)';
  const mode=b.colorMode||'fixed';
  if(mode==='fixed') return fixed;
  const st=b.entity?String(hs[b.entity]??''):'';
  // 1) regole personalizzate (priorità)
  if(b.colorRules&&b.colorRules.length){
    for(const r of b.colorRules){ if(_badgeRuleMatch(st,r)) return r.color||fixed; }
  }
  // 2) acceso/spento smart
  if(mode==='auto'||mode==='rules'){
    const s=st.toLowerCase();
    if(_BADGE_ON.includes(s)) return '#4ade80';
    if(_BADGE_OFF.includes(s)) return '#f87171';
  }
  return fixed;
}
function _badgeVisible(b){
  const v=b.vis;
  if(!v||v.mode!=='cond'||!v.entity) return true;
  const st=String(hs[v.entity]??'');
  return _badgeRuleMatch(st,{op:v.op||'eq',val:v.val,val2:v.val2});
}
/* visibilità condizionale delle CARD (stessa logica dei distintivi: legge card.vis) */
function _cardVisible(card){ try{ return _badgeVisible(card); }catch(e){ return true; } }
/* true se la visibilità condizionale di QUALCHE card legata a entityId è cambiata (per ridisegnare) */
function _cardVisChanged(entityId){
  if(typeof editMode!=='undefined'&&editMode) return false;
  const page=curPage(); if(!page) return false;
  return (page.cards||[]).some(c=>{
    if(!(c.vis&&c.vis.mode==='cond'&&c.vis.entity===entityId)) return false;
    const shouldShow=_cardVisible(c);
    const isShown=!!document.querySelector('.dash-card-wrap[data-card-id="'+c.id+'"]');
    return shouldShow!==isShown;
  });
}
function _findBadge(id){
  const p=curPage(); if(!p) return null;
  let arr=(p.headerBadges||[]).concat(p.footerBadges||[]);
  (p.cards||[]).forEach(c=>{ if(c.cardBadges) arr=arr.concat(c.cardBadges); });
  return arr.find(x=>x&&x.id===id)||null;
}
function _badgeClick(id, ev){
  if(ev) ev.stopPropagation();
  if(typeof editMode!=='undefined' && editMode) return;
  const b=_findBadge(id); if(!b) return;
  const act=b.action||(b.popupCard?'popup':'none');
  const ent=b.actionEntity||b.entity||'';
  if(act==='popup'&&b.popupCard) openBadgePopup(b.popupCard,ev);
  else if(act==='more_info'&&ent) openIM(ent);
  else if(act==='toggle'&&ent) callSvc(ent.split('.')[0],'toggle',ent);
  else if(act==='navigate') setActivePage(b.navPage||0);
  else if(act==='service'&&b.svcDomain&&b.svcService) send({type:'call_service',domain:b.svcDomain,service:b.svcService,service_data:b.svcEntity?{entity_id:b.svcEntity}:{}});
  else if(act==='url'&&b.url) window.open(b.url,'_blank','noopener');
}
/* quali parti mostrare in base alla modalità di visualizzazione */
function _badgeShow(disp,part){
  disp=disp||'full';
  switch(disp){
    case 'full': return true;                                  // icona + nome + valore
    case 'iconval': return part==='icon'||part==='value';
    case 'labelval': return part==='label'||part==='value';
    case 'val': return part==='value';
    case 'icon': return part==='icon';
    case 'label': return part==='label';
    case 'iconlabel': return part==='icon'||part==='label';
    default: return true;
  }
}
/* ── Render badge HTML ── */
function _badgeItemHTML(b, cls='hbadge', sepCls='badge-sep'){
  if(b.type==='sep') return `<div class="${sepCls}"></div>`;
  const col=_badgeColor(b);
  const act=b.action||(b.popupCard?'popup':'none');
  const clickable=act&&act!=='none';
  const oc=clickable?` data-action="_badgeClick" data-action-arg="${b.id}"`:'';
  const cur=clickable?'cursor:pointer;':'';
  const ind=clickable?'<span style="opacity:.5;margin-left:4px;font-size:.8em">▸</span>':'';
  const disp=b.display||'full';
  const icoTxt=(_badgeShow(disp,'icon')&&b.icon)?b.icon:'';
  if(b.type==='text'){
    const txt=b.text||b.label||'';
    const showTxt=(_badgeShow(disp,'value')||_badgeShow(disp,'label'));
    const inner=`${icoTxt?icoTxt+' ':''}${showTxt&&txt?eh(txt):''}`.trim()||icoTxt||eh(txt);
    return `<span class="badge-title" id="bchip-${b.id}" style="${cur}--bc:${col}"${oc}>${inner}${ind}</span>`;
  }
  // entity
  const rawVal=b.entity?(hs[b.entity]??'—'):'';
  const val=isNaN(parseFloat(rawVal))?_stateIt(rawVal):rawVal;
  const ico=icoTxt?`${icoTxt} `:'';
  const showVal=_badgeShow(disp,'value');
  const lbl=(_badgeShow(disp,'label')&&b.label)?`<span class="badge-lbl">${eh(b.label)}${showVal?': ':''}</span>`:'';
  const valHtml=showVal?`<span class="badge-val" id="bv-${b.id}">${val}</span>`:'';
  const sfx=(showVal&&b.suffix)?`<span class="badge-sfx"> ${eh(b.suffix)}</span>`:'';
  return `<span class="${cls}" id="bchip-${b.id}" style="${cur}--bc:${col}"${oc}>${ico}${lbl}${valHtml}${sfx}${ind}</span>`;
}

/* Popup badge → mostra una card dello Store JS */
function openBadgePopup(jsCardId, ev){
  if(ev) ev.stopPropagation();
  if(typeof editMode!=='undefined' && editMode) return; // in modifica non aprire
  const reg=window.FratechCardRegistry||{};
  const def=reg[jsCardId];
  const cardCfg={id:'bp-'+jsCardId,type:'js-custom',jsCardId};
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:99997;background:rgba(6,8,16,.7);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:3vh 2vw';
  const panel=document.createElement('div');
  panel.style.cssText='position:relative;width:min(96vw,840px);max-height:94vh;overflow:auto;border-radius:20px;background:var(--panel);border:1px solid var(--bd2);box-shadow:0 30px 80px rgba(0,0,0,.6)';
  const close=document.createElement('button');
  close.textContent='✕';
  close.style.cssText='position:absolute;top:10px;right:12px;z-index:5;width:32px;height:32px;border-radius:50%;border:none;cursor:pointer;background:rgba(255,255,255,.12);color:#fff;font-size:15px';
  const body=document.createElement('div');
  body.style.cssText='padding:14px';
  if(def){
    try{
      body.innerHTML=def.render(cardCfg,{states:hs});
      if(def.mount) def.mount(cardCfg,{states:hs},body);
      if(def.update) ov._iv=setInterval(()=>{ try{ def.update(cardCfg,{states:hs},body); }catch(e){} }, 4000);
    }catch(e){ body.innerHTML='<div style="padding:30px;color:#f87171">Errore card: '+(e.message||e)+'</div>'; }
  } else {
    body.innerHTML='<div style="padding:30px;color:var(--muted);text-align:center">Card non trovata: <b>'+jsCardId+'</b><br>Caricala nello Store JS.</div>';
  }
  const closeFn=()=>{ if(ov._iv) clearInterval(ov._iv); ov.remove(); document.removeEventListener('keydown',esc); };
  function esc(e){ if(e.key==='Escape') closeFn(); }
  close.onclick=closeFn;
  ov.onclick=(e)=>{ if(e.target===ov) closeFn(); };
  document.addEventListener('keydown',esc);
  panel.appendChild(close); panel.appendChild(body); ov.appendChild(panel); document.body.appendChild(ov);
}

function renderBadgesAll(){
  _renderViewHeader();
  _renderViewFooter();
}

function _renderViewHeader(){
  const page=curPage();
  const el=document.getElementById('page-view-header'); if(!el) return;
  const title=page.viewTitle||'';
  const badges=page.headerBadges||[];
  const titleStyle=page.viewTitleStyle||{align:'center',size:'large',color:'',weight:'800',italic:false};
  const badgesAlign=(page.headerBadgesStyle||{}).align||'center';
  const hasContent=title||badges.length;

  if(!hasContent && !editMode){ el.style.display='none'; return; }
  el.style.display='';
  el.className='view-section';
  el.style.alignItems='stretch'; // children manage own alignment

  // IN MODIFICA: forziamo l'header a scorrere IMPILATO con stili inline (battono la regola .has-hbar assoluta),
  // così titolo/distintivi/pulsanti non si accavallano col banner sotto. In vista, reset.
  const hdrRow=document.getElementById('page-header-row');
  if(editMode){
    el.style.position='relative'; el.style.top='auto'; el.style.left='auto'; el.style.right='auto'; el.style.bottom='auto';
    el.style.flexDirection='column'; el.style.justifyContent='flex-start';
    el.style.padding='8px 10px'; el.style.margin='0'; el.style.gap='8px';
    el.style.borderRadius='12px'; el.style.background='rgba(99,102,241,0.06)';
    el.style.outline='1px dashed rgba(99,102,241,0.28)'; el.style.pointerEvents='auto';
    if(hdrRow){ hdrRow.style.position='relative'; hdrRow.style.display='block'; hdrRow.style.minHeight='0'; hdrRow.style.marginBottom='14px'; }
  } else {
    ['position','top','left','right','bottom','flexDirection','justifyContent','padding','margin','gap','borderRadius','background','outline','pointerEvents'].forEach(p=>el.style[p]='');
    if(hdrRow){ ['position','display','minHeight','marginBottom'].forEach(p=>hdrRow.style[p]=''); }
  }

  const alignMap={left:'flex-start',center:'center',right:'flex-end'};
  const textAlignMap={left:'left',center:'center',right:'right'};

  let html='';

  /* ── Title row ── */
  if(title){
    const sizeMap={small:'13px',medium:'18px',large:'24px',xlarge:'34px'};
    const fs=sizeMap[titleStyle.size||'large']||'24px';
    const fw=titleStyle.weight||'800';
    const fi=titleStyle.italic?'italic':'normal';
    const fc=titleStyle.color||'inherit';
    const ta=textAlignMap[titleStyle.align||'center']||'center';
    const selfAlign=alignMap[titleStyle.align||'center']||'center';
    const fullW=(!titleStyle.align||titleStyle.align==='center')?'width:100%':'';
    if(editMode){
      html+=`<div class="view-title-wrap" style="align-self:${selfAlign};${fullW}">
        <div class="view-title-text" style="font-size:${fs};font-weight:${fw};font-style:${fi};color:${fc};text-align:${ta}">${eh(title)}</div>
        <div class="view-title-edit-ov">
          <button class="hba-btn hba-edit" data-action="openSectMod" data-action-args='["header","title"]' title="Modifica titolo">✏️</button>
          <button class="hba-btn hba-del" data-action="delSectTitle" title="Elimina titolo">✕</button>
        </div>
      </div>`;
    } else {
      html+=`<div class="view-title-text" style="font-size:${fs};font-weight:${fw};font-style:${fi};color:${fc};text-align:${ta};align-self:${selfAlign};${fullW}">${eh(title)}</div>`;
    }
  }

  /* ── Badges row ── */
  if(badges.length){
    const just=alignMap[badgesAlign]||'center';
    const badgesHtml=editMode
      ? badges.map((b,i)=>{
          const condCls=(b.vis&&b.vis.mode==='cond')?' badge-cond':'';
          const dimCls=(b.vis&&b.vis.mode==='cond'&&!_badgeVisible(b))?' badge-dim':'';
          return `<div class="hbadge-wrap${condCls}${dimCls}" draggable="true"
            ondragstart="_badgeDragStart(event,${i})" ondragover="_badgeDragOver(event)" ondrop="_badgeDrop(event,${i})" ondragend="_badgeDragEnd(event)">
            ${_badgeItemHTML(b,'hbadge','badge-sep')}
            <div class="hbadge-actions"><div class="hbadge-actions-inner">
              <button class="hba-btn hba-edit" data-action="_inViewEditBadge" data-action-args='[${i},"header"]' title="Modifica">✏️</button>
              <button class="hba-btn hba-cpy" data-action="_inViewCopyBadge" data-action-args='[${i},"header"]' title="Copia">📋</button>
              <button class="hba-btn hba-cut" data-action="_inViewCutBadge" data-action-args='[${i},"header"]' title="Taglia">✂️</button>
              <button class="hba-btn hba-del" data-action="_inViewDelBadge" data-action-args='[${i},"header"]' title="Elimina">✕</button>
            </div></div>
          </div>`;
        }).join('')
      : badges.filter(_badgeVisible).map(b=>_badgeItemHTML(b,'hbadge','badge-sep')).join('');
    html+=`<div class="view-badges-row" style="justify-content:${just}">${badgesHtml}</div>`;
  }

  /* ── Edit controls ── */
  if(editMode){
    html+=`<div class="view-edit-row">`;
    html+=title
      ? `<button class="view-add-btn" data-action="openSectMod" data-action-args='["header","title"]'>✏️ Modifica titolo</button>`
      : `<button class="view-add-btn" data-action="openSectMod" data-action-args='["header","title"]'>＋ Aggiungi titolo</button>`;
    html+=badges.length
      ? `<button class="view-add-btn" data-action="openBM" data-action-args='["header","manage"]'>🏷️ Gestione distintivi</button><button class="view-add-btn" data-action="openBM" data-action-args='["header","new"]'>＋ Nuovo distintivo</button>`
      : `<button class="view-add-btn" data-action="openBM" data-action-args='["header","new"]'>＋ Aggiungi distintivo</button>`;
    if(badges.length && _badgeClipboard){
      html+=`<button class="view-add-btn" data-action="_inViewPasteBadge" data-action-arg="header">📋 Incolla</button>`;
    }
    html+=`</div>`;
  }
  el.innerHTML=html;
}

function _renderViewFooter(){
  // I distintivi / piè di pagina vanno SOLO in alto (richiesta utente): nessuna zona distintivi in basso.
  const el=document.getElementById('page-view-footer');
  if(el){ el.style.display='none'; el.innerHTML=''; }
}

function focusViewTitle(){ openSectMod('header'); }

function updateViewTitle(){
  const _vt=document.getElementById('ep-view-title'); if(!_vt) return;
  const val=_vt.value;
  curPage().viewTitle=val;
  saveCfg();
  _renderViewHeader();
}

/* ── Section editor ── */
let _sectZone='header';
let _sectColor='';
let _sectBadgesAlign='center';
let _badgeClipboard=null; // clipboard for badge copy/cut

function openSectMod(zone, mode){
  _sectZone=zone;
  const page=curPage();
  const isHeader=zone==='header';
  // mode: 'title' = solo titolo, 'badge' = solo distintivi, undefined/'both' = entrambi
  const showTitle=isHeader && mode!=='badge';
  const showBadge=mode!=='title';
  const titleEl=document.getElementById('sect-title-tab');
  const badgeEl=document.getElementById('sect-badge-tab');
  if(titleEl) titleEl.style.display=showTitle?'':'none';
  if(badgeEl) badgeEl.style.display=showBadge?'':'none';
  const modalTitle=mode==='title'?'✏️ Titolo':mode==='badge'?'🏷️ Distintivi':(isHeader?'✏️ Intestazione':'✏️ Piè di Pagina');
  document.getElementById('sectmod-title').textContent=modalTitle;

  if(isHeader){
    const style=page.viewTitleStyle||{};
    document.getElementById('sect-title-text').value=page.viewTitle||'';
    _sectColor=style.color||'';
    _setSectTitleAlignUI(style.align||'center');
    _setSectSizeUI(style.size||'large');
    _setSectBoldUI(style.weight==='800'||style.weight==='bold'||style.weight===undefined);
    _setSectItalicUI(!!style.italic);
    _sectBadgesAlign=(page.headerBadgesStyle||{}).align||'center';
  } else {
    _sectBadgesAlign=(page.footerStyle||{}).align||'center';
  }
  _setSectBadgesAlignUI(_sectBadgesAlign);

  document.getElementById('sect-colors').innerHTML=COLORS.map(h=>
    `<div class="csw${h===_sectColor?' on':''}" style="background:${h}" data-action="_selSectColor" data-action-arg="${h}"></div>`).join('');

  renderSectBadgeList();
  const pb=document.getElementById('sect-paste-btn');
  if(pb) pb.style.display=_badgeClipboard?'':'none';

  document.getElementById('sectmod').classList.remove('off');
}

function closeSectMod(){ document.getElementById('sectmod').classList.add('off'); }

function saveSectMod(){
  const page=curPage();
  const isHeader=_sectZone==='header';
  if(isHeader){
    page.viewTitle=document.getElementById('sect-title-text').value.trim();
    if(!page.viewTitleStyle) page.viewTitleStyle={};
    page.viewTitleStyle.color=_sectColor;
    { const _e=document.getElementById('ep-view-title'); if(_e) _e.value=page.viewTitle; }
    if(!page.headerBadgesStyle) page.headerBadgesStyle={};
    page.headerBadgesStyle.align=_sectBadgesAlign;
  } else {
    if(!page.footerStyle) page.footerStyle={};
    page.footerStyle.align=_sectBadgesAlign;
  }
  saveCfg(); closeSectMod(); renderBadgesAll();
}

function openSectBadges(){
  // Keep sectmod open behind bmod (bmod has higher z-index via #bmod{z-index:300})
  openBM(_sectZone==='header'?'header':'footer');
}
function _sectEditBadge(i){
  openBM(_sectZone==='header'?'header':'footer');
  setTimeout(()=>editBadgeAt(i),0);
}

function previewSect(){}

/* ── Section badge list (inline in sectmod) ── */
function renderSectBadgeList(){
  const page=curPage();
  const arr=_sectZone==='header'?(page.headerBadges||[]):(page.footerBadges||[]);
  const el=document.getElementById('sect-badge-list'); if(!el) return;
  if(!arr.length){
    el.innerHTML=`<div style="font-size:10px;opacity:.28;padding:4px 0 2px">Nessun distintivo — clicca ➕ per aggiungerne uno</div>`;
    return;
  }
  el.innerHTML=arr.map((b,i)=>{
    const col=b.color||'rgba(255,255,255,.7)';
    let desc=b.type==='sep'?'───':((b.icon?b.icon+' ':'')+(b.label?b.label+': ':'')+(b.type==='entity'?eh(b.entity||''):eh(b.text||''))+(b.suffix?' '+b.suffix:''));
    return `<div class="sect-badge-row">
      <div class="sect-badge-row-info" style="color:${col};cursor:pointer" data-action="_sectEditBadge" data-action-args='[${i}]'>${desc}</div>
      <button class="sbrow-btn" data-action="_sectEditBadge" data-action-args='[${i}]' title="Modifica">✏️</button>
      <button class="sbrow-btn sbrow-mv" data-action="moveSectBadge" data-action-args='[${i},-1]' title="Su">▲</button>
      <button class="sbrow-btn sbrow-mv" data-action="moveSectBadge" data-action-args='[${i},1]' title="Giù">▼</button>
      <button class="sbrow-btn sbrow-cpy" data-action="copySectBadge" data-action-args='[${i}]' title="Copia">📋</button>
      <button class="sbrow-btn sbrow-cut" data-action="cutSectBadge" data-action-args='[${i}]' title="Taglia">✂️</button>
      <button class="sbrow-btn sbrow-del" data-action="delSectBadge" data-action-args='[${i}]' title="Elimina">✕</button>
    </div>`;
  }).join('');
}
function _getSectArr(){
  const page=curPage();
  return _sectZone==='header'?(page.headerBadges||(page.headerBadges=[])):(page.footerBadges||(page.footerBadges=[]));
}
function moveSectBadge(i,dir){
  const arr=_getSectArr(); const j=i+dir; if(j<0||j>=arr.length) return;
  [arr[i],arr[j]]=[arr[j],arr[i]]; renderSectBadgeList(); saveCfg(); renderBadgesAll();
}
function copySectBadge(i){
  const arr=_getSectArr(); if(!arr[i]) return;
  _badgeClipboard=JSON.parse(JSON.stringify(arr[i]));
  const pb=document.getElementById('sect-paste-btn'); if(pb) pb.style.display='';
  showToast('📋 Distintivo copiato');
}
function cutSectBadge(i){
  const arr=_getSectArr(); if(!arr[i]) return;
  _badgeClipboard=JSON.parse(JSON.stringify(arr[i]));
  arr.splice(i,1);
  const pb=document.getElementById('sect-paste-btn'); if(pb) pb.style.display='';
  renderSectBadgeList(); saveCfg(); renderBadgesAll();
  showToast('✂️ Distintivo tagliato');
}
function pasteSectBadge(){
  if(!_badgeClipboard) return;
  _getSectArr().push({...JSON.parse(JSON.stringify(_badgeClipboard)),id:uid()});
  renderSectBadgeList(); saveCfg(); renderBadgesAll();
  showToast('📋 Distintivo incollato');
}
function delSectBadge(i){
  const arr=_getSectArr(); arr.splice(i,1);
  renderSectBadgeList(); saveCfg(); renderBadgesAll();
}

/* ── Title alignment (separate from badges) ── */
function setSectTitleAlign(a){
  const page=curPage(); if(!page.viewTitleStyle) page.viewTitleStyle={};
  page.viewTitleStyle.align=a; _setSectTitleAlignUI(a);
}
function _setSectTitleAlignUI(a){
  ['left','center','right'].forEach(x=>document.getElementById('sta-'+x)?.classList.toggle('on',x===a));
}
/* ── Badges alignment ── */
function setSectBadgesAlign(a){
  _sectBadgesAlign=a; _setSectBadgesAlignUI(a);
}
function _setSectBadgesAlignUI(a){
  ['left','center','right'].forEach(x=>document.getElementById('sba-'+x)?.classList.toggle('on',x===a));
}
/* ── Size, bold, italic, color ── */
function setSectSize(s){
  const page=curPage(); if(!page.viewTitleStyle) page.viewTitleStyle={}; page.viewTitleStyle.size=s; _setSectSizeUI(s);
}
function _setSectSizeUI(s){
  ['small','medium','large','xlarge'].forEach(x=>document.getElementById('ss-'+x)?.classList.toggle('on',x===s));
}
function toggleSectBold(){
  const page=curPage(); if(!page.viewTitleStyle) page.viewTitleStyle={};
  const cur=page.viewTitleStyle.weight==='800'||page.viewTitleStyle.weight===undefined;
  page.viewTitleStyle.weight=cur?'400':'800'; _setSectBoldUI(!cur);
}
function _setSectBoldUI(on){
  const btn=document.getElementById('sect-bold-btn');
  if(btn){ btn.style.background=on?'rgba(99,102,241,0.2)':''; btn.style.borderColor=on?'var(--acc)':''; }
}
function toggleSectItalic(){
  const page=curPage(); if(!page.viewTitleStyle) page.viewTitleStyle={};
  page.viewTitleStyle.italic=!page.viewTitleStyle.italic; _setSectItalicUI(page.viewTitleStyle.italic);
}
function _setSectItalicUI(on){
  const btn=document.getElementById('sect-italic-btn');
  if(btn){ btn.style.background=on?'rgba(99,102,241,0.2)':''; btn.style.borderColor=on?'var(--acc)':''; }
}
function setSectColor(h){ _sectColor=h; document.getElementById('sect-colors').querySelectorAll('.csw').forEach(el=>el.classList.remove('on')); }
function _selSectColor(h){ _sectColor=h; document.getElementById('sect-colors').querySelectorAll('.csw').forEach(el=>el.classList.toggle('on',el.style.background===h||el.style.backgroundColor===h)); }

/* ── In-view badge actions (hover overlay) ── */
function _inViewCopyBadge(i,zone){
  const page=curPage();
  const arr=zone==='header'?(page.headerBadges||[]):(page.footerBadges||[]);
  if(!arr[i]) return;
  _badgeClipboard=JSON.parse(JSON.stringify(arr[i]));
  showToast('📋 Distintivo copiato');
}
function _inViewCutBadge(i,zone){
  const page=curPage();
  const arr=zone==='header'?(page.headerBadges||(page.headerBadges=[])):(page.footerBadges||(page.footerBadges=[]));
  if(!arr[i]) return;
  _badgeClipboard=JSON.parse(JSON.stringify(arr[i]));
  arr.splice(i,1); saveCfg(); renderBadgesAll();
  showToast('✂️ Distintivo tagliato');
}
function _inViewDelBadge(i,zone){
  const page=curPage();
  const arr=zone==='header'?(page.headerBadges||(page.headerBadges=[])):(page.footerBadges||(page.footerBadges=[]));
  arr.splice(i,1); saveCfg(); renderBadgesAll();
}
function _inViewPasteBadge(zone){
  if(!_badgeClipboard) return;
  const page=curPage();
  const arr=zone==='header'?(page.headerBadges||(page.headerBadges=[])):(page.footerBadges||(page.footerBadges=[]));
  arr.push({...JSON.parse(JSON.stringify(_badgeClipboard)),id:uid()});
  saveCfg(); renderBadgesAll();
  showToast('📋 Distintivo incollato');
}
/* Modifica un distintivo direttamente dalla plancia (apre l'editor su quel distintivo) */
function _inViewEditBadge(i,zone){
  _badgeZone=zone||'header';
  openBM(_badgeZone);
  setTimeout(()=>editBadgeAt(i),0);
}
/* Riordino distintivi con trascinamento (zona intestazione) */
let _badgeDragIdx=null;
function _badgeDragStart(e,i){ _badgeDragIdx=i; try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','b');}catch(_){} const w=e.currentTarget; if(w) w.style.opacity='.35'; }
function _badgeDragOver(e){ e.preventDefault(); try{e.dataTransfer.dropEffect='move';}catch(_){}}
function _badgeDrop(e,i){
  e.preventDefault();
  if(_badgeDragIdx==null||_badgeDragIdx===i){ _badgeDragIdx=null; return; }
  const arr=curPage().headerBadges||[];
  const [m]=arr.splice(_badgeDragIdx,1);
  arr.splice(i,0,m);
  _badgeDragIdx=null; saveCfg(); renderBadgesAll();
}
function _badgeDragEnd(e){ _badgeDragIdx=null; document.querySelectorAll('.hbadge-wrap').forEach(w=>w.style.opacity=''); }
function delSectTitle(){
  curPage().viewTitle='';
  const el=document.getElementById('ep-view-title'); if(el) el.value='';
  saveCfg(); renderBadgesAll();
}

function _renderCardBadgesHTML(card){
  const arr=card.cardBadges||[];
  if(!arr.length) return '';
  return `<div class="card-badges">${arr.map(b=>_badgeItemHTML(b,'cbadge','cbadge-sep')).join('')}</div>`;
}

function _liveUpdateBadges(entityId){
  const page=curPage();
  const allB=[...(page.headerBadges||[]),...(page.footerBadges||[]),...page.cards.flatMap(c=>c.cardBadges||[])];
  const editing=(typeof editMode!=='undefined'&&editMode);
  let visChanged=false;
  allB.forEach(b=>{
    // valore aggiornato SUL POSTO
    if(b.type==='entity'&&b.entity===entityId){
      const el=document.getElementById('bv-'+b.id);
      if(el){ const rv=hs[entityId]??'—'; el.textContent=isNaN(parseFloat(rv))?_stateIt(rv):rv; }
    }
    // COLORE-auto aggiornato SUL POSTO (niente re-render → niente flash ogni secondo)
    if(b.colorMode&&b.colorMode!=='fixed'&&b.entity===entityId){
      const chip=document.getElementById('bchip-'+b.id);
      if(chip){ try{ chip.style.setProperty('--bc',_badgeColor(b)); }catch(e){} }
    }
    // VISIBILITÀ condizionale: ridisegna SOLO se è cambiata davvero (raro), non a ogni secondo
    if(!editing && b.vis&&b.vis.mode==='cond'&&b.vis.entity===entityId){
      const shouldShow=_badgeVisible(b);
      const isShown=!!document.getElementById('bchip-'+b.id);
      if(shouldShow!==isShown) visChanged=true;
    }
  });
  if(visChanged) renderBadgesAll();
}

function _updateCMBadgePreview(){
  const card=curPage().cards.find(c=>c.id===editingId); if(!card) return;
  const arr=card.cardBadges||[];
  const el=document.getElementById('cm-badges-preview'); if(!el) return;
  el.innerHTML=arr.length
    ? arr.map(b=>_badgeItemHTML(b,'cbadge','cbadge-sep')).join('')
    : `<span style="font-size:10px;opacity:.3">Nessun badge</span>`;
}

function updateCardEl(card){
  const t=card.type;
  const val=hs[card.entity]??'—';
  const numV=parseFloat(val);
  const dispV=isNaN(numV)?_stateIt(val):(numV%1===0?numV:numV.toFixed(numV<10?2:1));
  const barPct=card.max>0?Math.min(100,Math.round(numV/card.max*100)):0;

  if(t==='big'||t==='compact'){
    const vEl=document.getElementById('v-'+card.id);
    if(vEl) vEl.childNodes[0].textContent=dispV;
    const bEl=document.getElementById('b-'+card.id);
    if(bEl) bEl.style.width=barPct+'%';
  } else if(t==='text'){
    const vEl=document.getElementById('v-'+card.id);
    if(vEl) vEl.textContent=_stateIt(val);
  } else if(t==='gauge'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=gaugeSVG(val,card.min||0,card.max||100,card.color||'#6366f1',card.unit||'');
  } else if(t==='toggle'){
    const isOn=val==='on'||val==='true';
    const color=card.color||'#6366f1';
    const tt=document.getElementById('tt-'+card.id);
    const tl=document.getElementById('tl-'+card.id);
    if(tt){ tt.classList.toggle('on',isOn); tt.style.background=isOn?color:'rgba(255,255,255,0.1)'; }
    if(tl){ tl.textContent=isOn?'Acceso':'Spento'; tl.style.color=isOn?color:'rgba(255,255,255,0.25)'; }
  } else if(t==='flowbars'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=buildFlowBarsRows(card);
  } else if(t==='flowmap'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=flowMapSVG(card);
  } else if(t==='weather'){
    const w=document.getElementById('v-'+card.id);
    if(w){
      if(_wtTimers[card.id]){ clearTimeout(_wtTimers[card.id]); delete _wtTimers[card.id]; }
      w.innerHTML=weatherCompactInner(card);
      _initWeatherBG(card.id, hs[card.entity||'']||'unknown');
    }
  } else if(t==='weather-hero'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=weatherHeroInner(card);
  } else if(t==='weather-forecast'){
    const w=document.getElementById('v-'+card.id);
    if(w){
      if(_wtTimers[card.id]){ clearTimeout(_wtTimers[card.id]); delete _wtTimers[card.id]; }
      w.innerHTML=weatherForecastInner(card);
      _initWeatherBG(card.id, hs[card.entity||'']||'unknown');
    }
  } else if(t==='appliances'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=appliancesInner(card);
  } else if(t==='header-bar'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=hbarInner(card);
  } else if(t==='footer-bar'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=fbarInner(card);
  } else if(t==='picture-elements'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=pictureElementsInner(card);
  } else if(t==='clock'){
    // clock is updated by clockTick(), not by entity changes
  } else if(t==='markdown'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=markdownInner(card);
  } else if(t==='media'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=mediaInner(card);
  } else if(t==='climate'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=climateInner(card);
  } else if(t==='entities'){
    const w=document.getElementById('v-'+card.id);
    if(w) w.innerHTML=entitiesInner(card);
  } else if(t==='yaml-card'){
    // Il timer interno in _mountYamlCard aggiorna hass — niente da fare qui
  } else if(t==='js-custom'){
    const w=document.getElementById('v-'+card.id);
    if(w){
      const _jcReg=window.FratechCardRegistry||{};
      const _jcDef=_jcReg[card.jsCardId];
      if(_jcDef){
        try{
          if(typeof _jcDef.update==='function'){ _jcDef.update(card,{states:hs},w); }
          else { w.innerHTML=_jcDef.render(card,{states:hs}); }
        }catch(e){ w.innerHTML=`<div class="jsc-err" style="display:flex;align-items:center;justify-content:center;height:100%"><span style="font-size:10px;color:#f87171">⚠️ ${e.message}</span></div>`; }
      }
    }
  }
}

function doToggle(entityId,cardId){
  const domain=entityId.split('.')[0];
  callSvc(domain,'toggle',entityId);
}

/* ═══ EDIT MODE ═══ */
function _exitEditMode(){
  editMode=false;
  try{ sessionStorage.removeItem('dash_edit'); sessionStorage.removeItem('dash_settings'); }catch(e){}
  document.body.classList.remove('editing');
  document.body.classList.remove('oik-settings-open');
  const ep=document.getElementById('epanel');
  if(ep){
    ep.style.transition='none';
    ep.classList.remove('open');
    ep.classList.remove('closing');
    requestAnimationFrame(()=>{ ep.style.transition=''; });
  }
  document.getElementById('edit-btn')?.classList.remove('on');
  renderDash(); renderPageTabs(); renderBadgesAll(); renderFbarZone();
}

function toggleEdit(){
  if(editMode){
    _pgCheckDirtyAndProceed(()=>{
      showConfirm(
        '✏️ Sei sicuro di voler uscire dalla modifica?<br><span style="font-size:12px;color:rgba(255,255,255,.5)">Tutte le modifiche sono già state salvate automaticamente.</span>',
        ()=> _exitEditMode(),
        'Chiudi modifica',
        'Continua a modificare'
      );
    });
    return;
  }
  editMode=true;
  try{ sessionStorage.setItem('dash_edit','1'); }catch(e){}
  document.body.classList.add('editing');
  document.getElementById('edit-btn')?.classList.add('on');
  _clipboardLoad(); _updatePasteBtn();
  renderDash(); // ricostruisce l'header IMPILATO (senza has-hbar) così non si sovrappone
  renderFbarZone();
  renderPageTabs();
  renderBadgesAll();
  // La plancia resta visibile/modificabile; le impostazioni si aprono a tutto schermo on-demand (stile Oikos)
}

/* ── Riavvio completo di Home Assistant (dal pallino connessione) ── */
async function frarikCheckUpdate(){
  showToast('🔄 Controllo aggiornamenti in corso…');
  try{
    const r=await fetch('./api/frarik/reload-store',{method:'POST'});
    const d=await r.json();
    if(d&&d.ok) showToast('✅ Registro aggiornato — controlla Impostazioni → Add-on in HA');
    else showToast('⚠️ Reload non disponibile fuori dall\'add-on');
  }catch(e){ showToast('⚠️ Errore: '+e.message); }
}
function confirmRestartHA(){
  showConfirm('🔄 Vuoi <b>riavviare completamente Home Assistant</b>?<br><span style="font-size:11px;opacity:.7">La dashboard si disconnetterà per qualche minuto, poi si riconnetterà da sola.</span>', ()=>{
    try{ send({type:'call_service',domain:'homeassistant',service:'restart'}); }catch(e){}
    showToast('🔄 Riavvio di Home Assistant in corso…');
    try{ setC('wait'); }catch(e){}
  });
}

/* ── Ricarica pagina + svuota cache ── */
async function hardReload(){
  try{ showToast('🔄 Ricarico e svuoto la cache…'); }catch(e){}
  try{
    if('caches' in window){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); }
    if('serviceWorker' in navigator){ const rs=await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r=>r.unregister())); }
  }catch(e){}
  try{ localStorage.removeItem('frarik_app_html'); localStorage.removeItem('frarik_app_ver'); localStorage.removeItem('frarik_app_notified'); }catch(e){}
  try{ sessionStorage.removeItem('dash_settings'); sessionStorage.removeItem('dash_edit'); }catch(e){}
  try{ const u=new URL(location.href); u.searchParams.set('_cb',Date.now().toString()); location.replace(u.toString()); }
  catch(e){ location.reload(); }
}

/* ── Apre/chiude la barra laterale nativa di Home Assistant (la plancia è dentro l'iframe del pannello) ── */
function _injectSidebarLogo(){
  try{
    const p=window.parent; if(!p||p===window) return;
    const ha=p.document.querySelector('home-assistant'); if(!ha||!ha.shadowRoot) return;
    // Trova ha-sidebar provando più percorsi (struttura HA varia per versione)
    let sidebar=null;
    const haMain=ha.shadowRoot.querySelector('home-assistant-main');
    if(haMain&&haMain.shadowRoot){
      // Percorso diretto
      sidebar=haMain.shadowRoot.querySelector('ha-sidebar');
      // Attraverso ha-drawer (alcune versioni HA)
      if(!sidebar){
        const drawer=haMain.shadowRoot.querySelector('ha-drawer');
        if(drawer) sidebar=drawer.querySelector('ha-sidebar')||(drawer.shadowRoot&&drawer.shadowRoot.querySelector('ha-sidebar'));
      }
    }
    if(!sidebar||!sidebar.shadowRoot) return;
    // Cerca la voce Frarik con vari selettori
    const sr=sidebar.shadowRoot;
    const link=sr.querySelector('a[data-panel="frarik_dashboard"]')||
               sr.querySelector('a[href="/frarik_dashboard"]')||
               sr.querySelector('a[href*="frarik"]')||
               sr.querySelector('[data-panel*="frarik"]');
    if(!link||link.querySelector('.frk-sidebar-logo')) return;
    const logoUrl=window.location.href.replace(/[?#].*/,'').replace(/\/+$/,'')+'/logo.png';
    const icon=link.querySelector('ha-icon,ha-svg-icon');
    const img=p.document.createElement('img');
    img.className='frk-sidebar-logo';
    img.src=logoUrl;
    img.style.cssText='width:24px;height:24px;object-fit:contain;border-radius:4px;flex-shrink:0;display:block;';
    if(icon){ icon.style.display='none'; icon.parentElement.insertBefore(img,icon); }
    else { link.insertBefore(img,link.firstChild); }
  }catch(e){}
}
(function _sidebarLogoLoop(attempt){
  if(attempt>30) return;
  try{
    const p=window.parent; if(!p||p===window) return;
    const ha=p.document.querySelector('home-assistant');
    const haMain=ha&&ha.shadowRoot&&ha.shadowRoot.querySelector('home-assistant-main');
    let sb=haMain&&haMain.shadowRoot&&(haMain.shadowRoot.querySelector('ha-sidebar')||(haMain.shadowRoot.querySelector('ha-drawer')&&(haMain.shadowRoot.querySelector('ha-drawer').querySelector('ha-sidebar'))));
    const link=sb&&sb.shadowRoot&&(sb.shadowRoot.querySelector('a[data-panel="frarik_dashboard"]')||sb.shadowRoot.querySelector('a[href*="frarik"]'));
    if(link){ _injectSidebarLogo(); return; }
  }catch(e){}
  setTimeout(()=>_sidebarLogoLoop(attempt+1),500);
})(0);

function toggleHASidebar(){
  // 1) via elemento iframe nel documento padre (stesso dominio): l'evento risale a home-assistant-main
  try{
    const fe=window.frameElement;
    if(fe){ fe.dispatchEvent(new CustomEvent('hass-toggle-menu',{bubbles:true,composed:true})); return; }
  }catch(e){}
  // 2) fallback: dispatch diretto su home-assistant-main nel parent
  try{
    const p=window.parent; if(p===window) { showToast('Apri la plancia dalla sidebar di Home Assistant'); return; }
    const ha=p.document.querySelector('home-assistant');
    const main=ha&&ha.shadowRoot&&ha.shadowRoot.querySelector('home-assistant-main');
    (main||p.document.body).dispatchEvent(new CustomEvent('hass-toggle-menu',{bubbles:true,composed:true}));
  }catch(e){ showToast('Impossibile aprire la sidebar di Home Assistant'); }
}

/* ── Ripristino stato UI dopo reload (modalità modifica / impostazioni) ── */
let _uiRestored=false;
function _restoreUIState(){
  if(_uiRestored) return; _uiRestored=true;
  try{
    if(sessionStorage.getItem('dash_edit')==='1' && !editMode) toggleEdit();
    // le impostazioni si possono aprire anche fuori dalla modifica (icona ⚙️ in alto)
    if(sessionStorage.getItem('dash_settings')==='1'){
      setTimeout(()=>{ try{ openOikSettings(); }catch(e){} },80);
    }
  }catch(e){}
}

/* ── Schermata impostazioni a tutto schermo (stile Oikos) — accessibile sempre dall'icona ⚙️ in alto ── */
function openOikSettings(){
  try{ sessionStorage.setItem('dash_settings','1'); }catch(e){}
  document.body.classList.add('oik-settings-open'); // nasconde la barra inferiore mentre le impostazioni sono aperte
  const panel=document.getElementById('epanel');
  panel.classList.add('open');
  _clipboardLoad(); _updatePasteBtn();
  renderSectionsList(); renderCList(); _epRenderJsStore(); renderFontPick();
  try{ _renderColorThemes(); }catch(e){}
  _ntfUpdateSidebarBadges();
  renderFbarZone();
  const p=curPage();
  document.getElementById('ep-page-ico').value=p.icon||'📄';
  document.getElementById('ep-page-name').value=p.name||'Pagina';
  { const _e=document.getElementById('ep-view-title'); if(_e) _e.value=p.viewTitle||''; }
  document.getElementById('ep-del-page').style.display=cfg.pages.length>1?'block':'none';
  _updateEditPanelForPage(p);
  _pgSnapshot();
  if(window._sysLoad) try{_sysLoad();}catch(e){}
  try{ _renderTopbarIconsList(); }catch(e){}
}
function closeOikSettings(){
  _pgCheckDirtyAndProceed(()=>{
    try{ sessionStorage.removeItem('dash_settings'); }catch(e){}
    const ep=document.getElementById('epanel');
    const finish=()=>{
      document.body.classList.remove('oik-settings-open');
      if(ep){
        ep.style.transition='none'; // blocca la transizione width (evita slide destra→sinistra)
        ep.classList.remove('open');
        ep.classList.remove('closing');
        requestAnimationFrame(()=>{ ep.style.transition=''; }); // ripristina dopo il reflow
      }
      renderFbarZone();
    };
    if(ep && ep.classList.contains('open')){ ep.classList.add('closing'); setTimeout(finish,270); }
    else finish();
  });
}
/* ── Collapsible groups in edit panel ── */
const _epGroupState={pg:false,saved:false};
function _epToggleGroup(id){
  _epGroupState[id]=!_epGroupState[id];
  const open=_epGroupState[id];
  const group=document.getElementById('ep-'+id+'-group');
  const arrow=document.getElementById('ep-'+id+'-arrow');
  if(group){
    group.style.display=open?'block':'none';
    // In fullscreen il gruppo si apre TUTTO: niente altezza max / scroll interno
    if(open){
      group.style.maxHeight='none';
      group.style.overflow='visible';
      group.querySelectorAll('*').forEach(n=>{
        if(n.style){ if(n.style.maxHeight) n.style.maxHeight='none'; if(/auto|scroll/.test(n.style.overflowY)) n.style.overflowY='visible'; if(n.style.overflow==='auto'||n.style.overflow==='scroll') n.style.overflow='visible'; }
      });
    }
  }
  if(arrow) arrow.style.transform=open?'rotate(180deg)':'';
}

function renderColPick(){ renderSectionsList(); }
function setCol(n){ const s=(curPage().sections||[])[0]; if(s) setSectionCols(s.id,n); }
function setRowH(h){ const s=(curPage().sections||[])[0]; if(s) setSectionRowH(s.id,h); }
function renderCList(){
  const page=curPage();
  const clistEl=document.getElementById('clist'); if(!clistEl) return;
  clistEl.innerHTML=page.cards.map(c=>{
    const secIdx=page.sections?(page.sections.findIndex(s=>s.id===c.secId)+1||'?'):'-';
    const colLbl=c.type!=='header-bar'&&page.sections?` S${secIdx}C${(c.secCol||0)+1}`:'';
    return `<div class="cli">
      <span class="cli-drag">⠿</span>
      <span class="cli-ico">${c.icon||'📦'}</span>
      <div class="cli-info">
        <div class="cli-name">${eh(c.label)}</div>
        <div class="cli-ent">${eh(c.entity||c.type)}${colLbl?`<span style="opacity:.4;font-size:9px"> ${colLbl}</span>`:''}</div>
      </div>
      <button class="cli-e" data-action="openCM" data-action-arg="${c.id}">✏️</button>
      <button class="cli-d" data-action="delCard" data-action-arg="${c.id}">✕</button>
    </div>`;
  }).join('');
}
function adjSpan(cardId,axis,delta){
  const card=curPage().cards.find(c=>c.id===cardId); if(!card) return;
  if(axis==='col') card.colSpan=Math.max(1,Math.min(curPage().columns,(card.colSpan||1)+delta));
  else             card.rowSpan=Math.max(1,Math.min(6,(card.rowSpan||1)+delta));
  saveCfg();
  const ce=document.getElementById('card-'+cardId);
  if(ce){ ce.style.gridColumn=`span ${card.colSpan}`; ce.style.gridRow=`span ${card.rowSpan}`; }
  document.getElementById('cs-'+cardId).textContent='L:'+card.colSpan;
  document.getElementById('rs-'+cardId).textContent='A:'+card.rowSpan;
  if(['history','multiline','bar'].includes(card.type)) setTimeout(()=>{ if(card.type==='history') initHistoryChart(card); else if(card.type==='multiline') initMultilineChart(card); else initBarChart(card); },100);
}

/* ═══ ENTITY MODAL ═══ */
function openEM(browseMode=false){
  emTarget=browseMode?emTarget:null;
  document.getElementById('emod-title').textContent=browseMode?'🔍 Seleziona Entità':'➕ Aggiungi Sensore';
  document.getElementById('emod').classList.remove('off');
  document.getElementById('esearch').value='';
  renderEL('');
  setTimeout(()=>document.getElementById('esearch').focus(),80);
}
function closeEM(){ document.getElementById('emod').classList.add('off'); }
function filterE(){ renderEL(document.getElementById('esearch').value); }
function renderEL(q){
  const lq=q.toLowerCase();
  const filtered=allE.filter(e=>e.entity_id.toLowerCase().includes(lq)||(e.attributes?.friendly_name||'').toLowerCase().includes(lq)).slice(0,120);
  document.getElementById('elist').innerHTML=filtered.length
    ? filtered.map(e=>`<div class="eit" data-action="_eitClickFromEl" data-eid="${e.entity_id}" data-efn="${eh(e.attributes?.friendly_name||e.entity_id)}" data-eunit="${eh(e.attributes?.unit_of_measurement||'')}" data-edom="${e.entity_id.split('.')[0]}">
        <span class="edom">${eh(e.entity_id.split('.')[0])}</span>
        <span class="ename">${eh(e.attributes?.friendly_name||e.entity_id)}</span>
        <span class="estate">${eh(e.state)} ${eh(e.attributes?.unit_of_measurement||'')}</span>
      </div>`).join('')
    : '<div style="padding:20px;text-align:center;font-size:11px;color:rgba(255,255,255,0.25)">Nessun risultato</div>';
}
function eitClick(entityId,name,unit,domain){
  if(emTarget){
    document.getElementById(emTarget).value=entityId;
    emTarget=null;
    closeEM();
  } else {
    addFromE(entityId,name,unit,domain);
  }
}
function addFromE(entityId,name,unit,domain){
  closeEM();
  const page=curPage();
  const newCard={
    id:uid(),entity:entityId,label:name,icon:guessIcon(entityId,domain),unit,
    type:guessType(entityId,domain,unit),color:'#60a5fa',colSpan:1,rowSpan:1,
    max:guessMax(unit),min:0,sub:'',hours:24,
    entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5
  };
  _assignSection(page,newCard);
  page.cards.push(newCard);
  saveCfg(); renderDash(); openCM(newCard.id);
}
function browseField(fieldId){
  emTarget=fieldId;
  openEM(true);
}

/* ═══ CARD EDITOR ═══ */
function _cmVisToggle(){
  const mode=document.getElementById('cm-vis-mode')?.value||'always';
  const cond=document.getElementById('cm-vis-cond'); if(cond) cond.style.display=mode==='cond'?'':'none';
  const op=document.getElementById('cm-vis-op')?.value; const v2=document.getElementById('cm-vis-val2');
  if(v2) v2.style.display=(mode==='cond'&&op==='between')?'':'none';
}
function openCM(cardId){
  editingId=cardId;
  const c=curPage().cards.find(x=>x.id===cardId); if(!c) return;
  /* per le card canvas libero apre direttamente l'editor del canvas */
  if(c.type==='free'){ openFE(cardId); return; }
  if(c.type==='header-bar'){ openHBM(cardId); return; }
  if(c.type==='footer-bar'){ openFBM(); return; }
  if(c.type==='yaml-card'){
    // Apre l'editor YAML con la config attuale
    _yamlCurrentConfig=null;
    document.getElementById('yaml-inp').value=c.lovelaceConfig||'';
    document.getElementById('yaml-status').textContent='';
    document.getElementById('yaml-status').className='';
    document.getElementById('yaml-preview').className='';
    document.getElementById('yaml-preview').innerHTML='';
    // Override "Aggiungi" per salvare le modifiche
    document.getElementById('yaml-add-btn').className='yaml-act-btn success show';
    document.getElementById('yaml-add-btn').textContent='💾 Aggiorna card';
    document.getElementById('yaml-add-btn').onclick=function(){
      const txt=(document.getElementById('yaml-inp').value||'').trim();
      if(!txt) return;
      c.lovelaceConfig=txt;
      try{ const cfg2=jsyaml.load(txt); c.label=(cfg2.name||cfg2.title||cfg2.type||c.label).toString(); }catch(e){}
      saveCfg(); renderDash(); closeYamlImport();
      document.getElementById('yaml-add-btn').onclick=yamlImportAdd;
      document.getElementById('yaml-add-btn').textContent='';
      document.getElementById('yaml-add-btn').innerHTML='<i class="mdi mdi-plus-circle-outline"></i> Aggiungi alla dashboard';
      showToast('✅ Card YAML aggiornata');
    };
    document.getElementById('yaml-modal').classList.remove('off');
    return;
  }
  document.getElementById('cmod-title').textContent='✏️ '+c.label;
  document.getElementById('cm-lbl').value=c.label;
  document.getElementById('cm-ico').value=c.icon||'';
  document.getElementById('cm-entity').value=c.entity||'';
  document.getElementById('cm-unit').value=c.unit||'';
  document.getElementById('cm-type').value=c.type||'big';
  document.getElementById('cm-max').value=c.max||'';
  document.getElementById('cm-min').value=c.min||'';
  document.getElementById('cm-hours').value=c.hours||24;
  document.getElementById('cm-solar').value=c.solar||'';
  document.getElementById('cm-load').value=c.load||'';
  document.getElementById('cm-grid').value=c.grid||'';
  document.getElementById('cm-battery').value=c.battery||'';
  document.getElementById('cm-ent2').value=c.entity2||'';
  document.getElementById('cm-ent3').value=c.entity3||'';
  document.getElementById('cm-wf-temp').value=c.wfTemp||'';
  document.getElementById('cm-wf-hum').value=c.wfHum||'';
  document.getElementById('cm-wf-wind').value=c.wfWind||'';
  document.getElementById('cm-wf-days').value=c.wfDays||7;
  document.getElementById('cm-refresh').value=c.refresh||5;
  document.getElementById('cm-sub').value=c.sub||'';
  document.getElementById('cm-content').value=c.content||'';
  document.getElementById('cm-imageurl').value=c.imageUrl||'';
  document.getElementById('cm-threshold').value=c.threshold??5;
  _appItems=JSON.parse(JSON.stringify(c.items||[]));
  _appGroups=JSON.parse(JSON.stringify(c.groups||[]));
  renderAppItems();
  renderAppGroups();
  document.getElementById('cm-clickaction').value=c.clickAction||'info';
  document.getElementById('cm-clickurl').value=c.clickUrl||'';
  // visibilità condizionale
  const _v=c.vis||{};
  document.getElementById('cm-vis-mode').value=_v.mode==='cond'?'cond':'always';
  document.getElementById('cm-vis-entity').value=_v.entity||'';
  document.getElementById('cm-vis-op').value=_v.op||'eq';
  document.getElementById('cm-vis-val').value=_v.val!=null?_v.val:'';
  document.getElementById('cm-vis-val2').value=_v.val2!=null?_v.val2:'';
  _cmVisToggle();
  renderSwatches(c.color);
  document.getElementById('cm-bgOn').checked = !!c.bgColor;
  document.getElementById('cm-bgColor').value = c.bgColor||'#0c0e1c';
  document.getElementById('cm-textOn').checked = !!c.textColor;
  document.getElementById('cm-textColor').value = c.textColor||'#ffffff';
  renderShapePick(c.shape||'rounded');
  onTypeChange(); onClickActionChange(); onCustomColorToggle();
  _updateCMBadgePreview();
  document.getElementById('cmod').classList.remove('off');
}
function closeCM(){ document.getElementById('cmod').classList.add('off'); editingId=null; }

function onTypeChange(){
  const t=document.getElementById('cm-type').value;
  const isFlow=t==='flowbars'||t==='flowmap';
  const noEntity=['clock','markdown','picture-elements','appliances','header-bar'];
  const noUnit=['flowbars','flowmap','camera','weather','weather-hero','weather-forecast','media','entities','clock','markdown','picture-elements','appliances','header-bar'];
  const noSub=['flowbars','flowmap','camera','weather','weather-hero','weather-forecast','media','climate','clock','picture-elements','appliances','header-bar'];
  sf('fr-entity',!isFlow&&!noEntity.includes(t));
  sf('fr-unit',!noUnit.includes(t));
  sf('fr-max',['gauge','compact','flowbars'].includes(t));
  sf('fr-min',t==='gauge');
  sf('fr-hours',['history','multiline','bar'].includes(t));
  sf('fr-solar',isFlow); sf('fr-load',isFlow); sf('fr-grid',isFlow); sf('fr-battery',isFlow);
  sf('fr-ent2',t==='multiline'||t==='entities'||t==='weather-hero');
  sf('fr-ent3',t==='multiline'||t==='entities'||t==='weather-hero');
  sf('fr-refresh',t==='camera');
  sf('fr-sub',!noSub.includes(t));
  sf('fr-content',t==='markdown');
  sf('fr-imageurl',t==='picture-elements');
  sf('fr-pelements',t==='picture-elements');
  sf('fr-threshold',t==='appliances');
  sf('fr-groups',t==='appliances');
  sf('fr-items',t==='appliances');
  sf('fr-wf-temp',t==='weather'||t==='weather-forecast');
  sf('fr-wf-hum', t==='weather'||t==='weather-forecast');
  sf('fr-wf-wind',t==='weather'||t==='weather-forecast');
  sf('fr-wf-days',t==='weather'||t==='weather-forecast');
  const e2=document.querySelector('#fr-ent2 .flbl');
  const e3=document.querySelector('#fr-ent3 .flbl');
  if(e2) e2.textContent=t==='weather-hero'?'Sensore Temperatura (opz.)':'Entità 2';
  if(e3) e3.textContent=t==='weather-hero'?'Sensore Umidità (opz.)':'Entità 3';
}
function sf(id,v){ const el=document.getElementById(id); if(el) el.style.display=v?'block':'none'; }
function onClickActionChange(){ sf('fr-clickurl',document.getElementById('cm-clickaction').value==='link'); }
function onCustomColorToggle(){
  /* Abilita/disabilita visivamente il color picker in base al checkbox */
  const bgOn=document.getElementById('cm-bgOn').checked;
  const txtOn=document.getElementById('cm-textOn').checked;
  document.getElementById('cm-bgColor').style.opacity=bgOn?'1':'0.3';
  document.getElementById('cm-textColor').style.opacity=txtOn?'1':'0.3';
}

function renderSwatches(sel){
  document.getElementById('cm-colors').innerHTML=COLORS.map(h=>`
    <div class="csw${h===sel?' on':''}" style="background:${h}" data-action="selColor" data-action-arg="${h}"></div>`).join('');
}
function selColor(hex){
  const c=curPage().cards.find(x=>x.id===editingId); if(c) c.color=hex;
  renderSwatches(hex);
}

/* ═══ SHAPE PICKER ═══ */
const CARD_SHAPES=[
  {id:'rounded', label:'Arrotondata', r:'20px'},
  {id:'soft',    label:'Morbida',     r:'12px'},
  {id:'square',  label:'Quadrata',    r:'4px'},
  {id:'extra',   label:'Molto tonda', r:'36px'},
  {id:'pill',    label:'Pillola',     r:'999px'},
  {id:'circle',  label:'Cerchio',     r:'50%'},
];
function _shapeRadius(shape){ return (CARD_SHAPES.find(s=>s.id===shape)||CARD_SHAPES[0]).r; }
function renderShapePick(sel){
  const wrap=document.getElementById('cm-shapes'); if(!wrap) return;
  wrap.innerHTML=CARD_SHAPES.map(s=>`
    <button type="button" class="shp-btn${(sel||'rounded')===s.id?' on':''}" data-action="selShape" data-action-arg="${s.id}">
      <div class="shp-prev" style="border-radius:${s.r}"></div>
      ${s.label}
    </button>`).join('');
}
function selShape(shapeId){
  const c=curPage().cards.find(x=>x.id===editingId); if(c) c.shape=shapeId;
  renderShapePick(shapeId);
}
function saveCard(){
  const c=curPage().cards.find(x=>x.id===editingId); if(!c) return;
  c.label  = document.getElementById('cm-lbl').value.trim()||c.label;
  c.icon   = document.getElementById('cm-ico').value.trim();
  c.entity = document.getElementById('cm-entity').value.trim()||c.entity;
  c.unit   = document.getElementById('cm-unit').value.trim();
  c.type   = document.getElementById('cm-type').value;
  c.max    = parseFloat(document.getElementById('cm-max').value)||0;
  c.min    = parseFloat(document.getElementById('cm-min').value)||0;
  c.hours  = parseInt(document.getElementById('cm-hours').value)||24;
  c.solar  = document.getElementById('cm-solar').value.trim();
  c.load   = document.getElementById('cm-load').value.trim();
  c.grid   = document.getElementById('cm-grid').value.trim();
  c.battery= document.getElementById('cm-battery').value.trim();
  c.entity2= document.getElementById('cm-ent2').value.trim();
  c.entity3= document.getElementById('cm-ent3').value.trim();
  c.wfTemp = document.getElementById('cm-wf-temp').value.trim();
  c.wfHum  = document.getElementById('cm-wf-hum').value.trim();
  c.wfWind = document.getElementById('cm-wf-wind').value.trim();
  c.wfDays = parseInt(document.getElementById('cm-wf-days').value)||7;
  c.refresh     = parseInt(document.getElementById('cm-refresh').value)||5;
  c.sub         = document.getElementById('cm-sub').value.trim();
  c.content     = document.getElementById('cm-content').value;
  c.imageUrl    = document.getElementById('cm-imageurl').value.trim();
  c.threshold   = parseFloat(document.getElementById('cm-threshold').value)||5;
  c.items       = _appItems.filter(i=>i.entity);
  c.groups      = _appGroups.filter(g=>g.name);
  c.clickAction = document.getElementById('cm-clickaction').value;
  c.clickUrl    = document.getElementById('cm-clickurl').value.trim();
  c.bgColor     = document.getElementById('cm-bgOn').checked ? document.getElementById('cm-bgColor').value : '';
  c.textColor   = document.getElementById('cm-textOn').checked ? document.getElementById('cm-textColor').value : '';
  // visibilità condizionale
  const _vm=document.getElementById('cm-vis-mode').value;
  if(_vm==='cond'){
    c.vis={mode:'cond', entity:document.getElementById('cm-vis-entity').value.trim(), op:document.getElementById('cm-vis-op').value, val:document.getElementById('cm-vis-val').value.trim(), val2:document.getElementById('cm-vis-val2').value.trim()};
  } else { delete c.vis; }
  /* shape è già salvato live da selShape() */
  saveCfg(); closeCM(); renderDash();
  if(c.type==='weather'||c.type==='weather-forecast') _subscribeForecast(c.entity);
}

/* ═══ EMOJI PICKER ═══ */
const APP_EMOJIS=[
  '─casa─',  '🏠','🏡','🏢','🚪','🪟','🛋️','🛏️','🚿','🛁','🚽','🧹','🧺','🪣',
  '─luce─',  '💡','🔆','🕯️','🔦','🪔','🌟','✨','💫',
  '─calore/freddo─','🔥','❄️','🌡️','♨️','🌬️','💨','🌀','☀️','🌙',
  '─acqua/gas─','💧','🚰','⛽','🌊','🫧',
  '─cucina─', '🍳','☕','🧃','🍶','🫙','🥤','🧊','🍽️','🥄','🔪',
  '─energia─','⚡','🔌','🔋','🔋','🪫','📡','🔧','⚙️','🔩',
  '─veicoli─','🚗','🚙','🏎️','🚐','🛻','🚲','🛵','✈️','🚢',
  '─media─',  '📺','🖥️','🎵','🔊','📻','📷','🎮','💻','🖨️','📞',
  '─sicurezza─','🔒','🔑','🚨','🔔','📳','🛎️',
  '─sensori─', '🌡️','💧','🌿','☁️','🌧️','🌪️','❓','📊','📈',
];
let _emojiTargetCb=null;
function openEmojiPicker(cb, anchorEl, evt){
  if(evt) evt.stopPropagation();
  const pop=document.getElementById('app-emoji-pop');
  if(pop.classList.contains('show')){ pop.classList.remove('show'); _emojiTargetCb=null; return; }
  _emojiTargetCb=cb;
  let html='<div class="app-emoji-grid">';
  APP_EMOJIS.forEach(e=>{
    if(e.startsWith('─')){ html+=`<span class="app-emoji-cat">${e.replace(/─/g,'').trim()}</span>`; }
    else { html+=`<button class="app-emoji-btn" data-action="_pickEmoji" data-action-arg="${e}">${e}</button>`; }
  });
  html+='</div>';
  pop.innerHTML=html;
  _positionPop(pop, anchorEl);
}
function _pickEmoji(e){
  if(_emojiTargetCb) _emojiTargetCb(e);
  document.getElementById('app-emoji-pop').classList.remove('show');
  _emojiTargetCb=null;
}

/* ═══ ICON PICKER (Emoji + MDI) ═══ */
const _ICON_EMOJIS=[
  '──Casa e stanze──','🏠','🏡','🏘️','🏗️','🏢','🚪','🪟','🛋️','🛏️','🚿','🛁','🚽','🪑','🪞','🖼️','🪴','🧸','🪆','🎎','🧺','🪣','🗄️','🗑️','📦','📫','📬','🔦','🕯️','🪔',
  '──Sicurezza──','🔒','🔓','🔑','🗝️','🔐','🛡️','🚨','📷','📹','🎥','🔭','🚦','🚧','⚠️','🚫','⛔','🔇','📵','🔕','💂','👮','🚒','🚑','🚓',
  '──Energia──','⚡','🔌','🔋','🪫','🔆','🌑','☀️','🌙','💫','✨','🌤️','⛅','🌥️','🌦️','🌧️','⛈️','🌩️','🌨️','🌪️','🌊','💥','🔥','☄️',
  '──Clima e temperatura──','🌡️','♨️','❄️','💧','💨','🌬️','🌀','🌈','🌫️','🧊','🫧','🌂','☂️','☔','⛱️','🏔️','🗻','🌋',
  '──Luci e illuminazione──','💡','🔦','🕯️','🪔','🔆','🔅','🌟','⭐','🌠','🎇','🎆','🪄','✨','🌟','💥',
  '──Cucina e cibo──','🍳','☕','🍵','🧃','🥤','🍺','🍻','🥂','🍷','🧋','🫖','🍵','🥛','🧉','🍽️','🥄','🍴','🔪','🫙','🧊','🥘','🫕','🥗','🍱','🥡','🧁','🎂','🍰','🍫','🍭','🍬','🍦','🍨','🍧',
  '──Elettrodomestici──','📺','🖥️','💻','⌨️','🖨️','📱','☎️','📞','📠','📻','🎙️','🎚️','🎛️','📡','🔌','🔋','💾','💿','📀','🎮','🕹️','📷','📸','📹','🎞️','📽️','🎬','🔬','🔭','🔊','📢','📣','🔔','🔕',
  '──Lavatrice e pulizie──','👕','👗','👔','🧥','👘','🧤','🧹','🪣','🧺','🧻','🧽','🪥','🧼','🫧','🪒','🧴','🧷','🪡','🧵','🧶',
  '──Persone e famiglia──','👤','👥','🏃','🚶','🧑','👶','🧒','👦','👧','👨','👩','🧔','👴','👵','👪','👨‍👩‍👦','👩‍👧','🤰','🍼','🎒','🏫',
  '──Animali──','🐕','🐈','🐾','🐠','🐟','🐬','🐳','🦜','🦚','🦩','🦋','🐝','🌸','🪲','🐢','🦎','🐍','🦎',
  '──Veicoli e trasporti──','🚗','🚙','🏎️','🚐','🛻','🚌','🚎','🚑','🚒','🚓','🚕','🛺','🚲','🛵','🏍️','🛴','🛹','🛼','🚁','✈️','🛩️','🚀','🛸','🚢','⛵','🛥️','🚞','🚂','🚆','🚇','🚃','🚋',
  '──Natura──','🌿','🌱','🌲','🌳','🌴','🎋','🎍','🍃','🍂','🍁','🍄','🌾','🌵','🌸','🌺','🌻','🌹','💐','🌼','🌷','🌏','🌍','🌎','🏔️','🗻','🏝️','🌊','🌅','🌄','🌠','🌌','🌃','🏙️',
  '──Salute e medicina──','💊','💉','🩺','🩻','🩹','🩼','🦽','🦼','🩸','🧬','🔬','🧪','🧫','⚕️','🏥','🚑',
  '──Sport e attività──','⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🎮','🕹️','🎯','🏹','🎿','⛷️','🏂','🤿','🏊','🚴','🧘','🤸','🏋️','🤼','🤺','🥋','🤼','🏇','🧗',
  '──Lavoro e ufficio──','💼','📁','📂','🗂️','📋','📌','📎','🖇️','✂️','🖊️','✏️','🖋️','🖊️','📝','📒','📔','📕','📗','📘','📙','📚','📖','🔖','🏷️','💰','💳','🏧','🤑','💵','💶','💷','💴',
  '──Simboli──','✅','❌','❓','❕','❗','⁉️','ℹ️','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔲','🔳','▶️','⏩','⏭️','⏯️','🔼','⏫','⏪','⏮️','⏬','🔽','⏸️','⏹️','⏺️','🔁','🔂','🔃','🔄',
  '──Frecce e navigazione──','➡️','⬅️','⬆️','⬇️','↩️','↪️','🔙','🔚','🔛','🔜','🔝','↕️','↔️','🔀','♻️','🔃','🔄','⏩','⏪','📍','📌','🗺️','🧭','🗺️',
  '──Numeri e matematica──','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','#️⃣','*️⃣','➕','➖','✖️','➗','♾️','💯','📊','📈','📉','🔢','🔣','🔤','🔡','🔠',
  '──Tempo e calendario──','⏰','⌚','⏱️','⏲️','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛','📅','📆','🗓️','📇','🗒️','⌛','⏳','⌛',
  '──Celebrazioni──','🎉','🎊','🎈','🎁','🎀','🎗️','🎟️','🏆','🥇','🥈','🥉','🎖️','🏅','🎯','🎪','🎠','🎡','🎢','🎭','🎨','🖌️','🎬','🎤','🎧','🎼','🎹','🎸','🎺','🎻','🥁','🪘',
  '──Cuori e emozioni──','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💝','💘','💟','☮️','✌️','🙏','👍','👎','👊','✊','🤜','🤛','🙌','👏','🤲',
  '──Varie──','⚙️','🔧','🔩','🛠️','🪛','🔨','⛏️','🪚','🔬','🧲','🔭','📡','💎','💍','👑','🏺','🪬','🪩','🎭','🎪','🎨','🖼️','🧩','🎲','🎰','🃏','🀄','🎴',
];
const _ICON_MDI_CATS=[
  {cat:'Generale',     icons:['bell','bell-outline','bell-ring','bell-off','alert','alert-circle','alert-outline','information','information-outline','check','check-circle','check-circle-outline','close-circle','home','home-outline','account','account-circle','account-group','star','star-outline','heart','heart-outline','thumb-up','clock','clock-outline','calendar','calendar-outline','cog','cog-outline','wrench','tools','refresh','sync']},
  {cat:'Luci',         icons:['lightbulb','lightbulb-outline','lightbulb-on','lightbulb-on-outline','lightbulb-off','lightbulb-off-outline','lamp','lamp-outline','ceiling-light','ceiling-light-outline','floor-lamp','floor-lamp-outline','string-lights','string-lights-off','track-light','led-strip','led-strip-variant','light-switch','light-switch-off','wall-sconce','wall-sconce-flat','flashlight','flashlight-off','candle','lantern']},
  {cat:'Clima',        icons:['thermometer','thermometer-high','thermometer-low','thermometer-plus','thermometer-minus','fan','fan-off','fan-speed-1','fan-speed-2','fan-speed-3','snowflake','snowflake-melt','fire','radiator','radiator-off','air-conditioner','air-filter','air-humidifier','air-humidifier-off','air-purifier','heat-wave','coolant-temperature','water-thermometer','wind-turbine','hvac','hvac-off']},
  {cat:'Sicurezza',    icons:['lock','lock-outline','lock-open','lock-open-outline','lock-alert','shield','shield-outline','shield-check','shield-check-outline','security','camera','camera-outline','camera-off','motion-sensor','motion-sensor-off','alarm-light','alarm-light-outline','alarm-bell','door','door-closed','door-open','window-open','window-closed','window-open-variant','garage','garage-open','garage-alert','gate','gate-open','intercom','video-doorbell','doorbell','cctv','eye','eye-off']},
  {cat:'Energia',      icons:['flash','flash-off','flash-outline','battery','battery-outline','battery-charging','battery-charging-outline','battery-80','battery-50','battery-20','battery-alert','solar-panel','solar-panel-large','meter-electric','meter-electric-outline','power-plug','power-plug-off','power-plug-outline','power-socket','power-socket-eu','power-socket-uk','electric-switch','electric-switch-closed','transmission-tower','home-lightning-bolt','lightning-bolt','lightning-bolt-outline','ev-plug-type2','ev-station','gas-station','oil-lamp','barrel']},
  {cat:'Media',        icons:['television','television-outline','television-off','television-play','speaker','speaker-wireless','speaker-off','speaker-outline','music','music-note','music-off','radio','radio-off','microphone','microphone-off','cast','cast-off','headphones','headphones-off','volume-high','volume-medium','volume-low','volume-mute','volume-off','remote','remote-tv','play','pause','stop','skip-next','skip-previous','rewind','fast-forward','shuffle','repeat']},
  {cat:'Elettrodomestici',icons:['washing-machine','washing-machine-off','dishwasher','dishwasher-off','dishwasher-alert','oven','oven-off','refrigerator','refrigerator-outline','refrigerator-off','coffee-maker','coffee-maker-outline','coffee-outline','toaster','toaster-oven','iron','iron-outline','hair-dryer','hair-dryer-outline','vacuum','robot-vacuum','robot-vacuum-off','kettle','kettle-outline','microwave','microwave-off','blender','blender-outline','grill','grill-off']},
  {cat:'Acqua/Sensori', icons:['water','water-off','water-outline','water-pump','water-pump-off','water-boiler','water-boiler-off','water-boiler-alert','waves','water-percent','humidity','humidity-low','humidity-high','smoke-detector','smoke-detector-outline','smoke-detector-off','smoke','fire-alert','gas-cylinder','leak','pipe','pipe-leak','pipe-disconnected','sewer','rain','water-check','water-alert','water-sync']},
  {cat:'Presenza/Persone',icons:['account','account-outline','account-circle','account-circle-outline','account-group','account-multiple','account-child','account-child-outline','baby','baby-face','human-male','human-female','human-greeting','human-greeting-variant','walk','run','sleep','sleep-off','home-account','account-clock','account-check','account-remove','location-enter','location-exit','map-marker','map-marker-off','car-key','key-chain']},
  {cat:'Veicoli',       icons:['car','car-outline','car-electric','car-electric-outline','car-door','car-key','car-off','car-connected','motorcycle','bicycle','scooter','bus','truck','airplane','airplane-off','boat','garage','garage-open','garage-lock','ev-station','fuel','gas-station','parking','road-variant']},
  {cat:'Casa',          icons:['sofa','sofa-outline','bed','bed-outline','bed-double','bathtub','bathtub-outline','shower','shower-head','toilet','toilet-outline','table-furniture','chair-rolling','curtains','curtains-closed','blinds','blinds-open','window-shutter','window-shutter-open','door-sliding','door-sliding-open','stairs','stairs-up','stairs-down','pool','shed','greenhouse','mailbox','mailbox-open','mailbox-up','mailbox-outline','trash-can','trash-can-outline','recycle','wardrobe','hanger','desk','baby-carriage','dog','dog-service','cat','paw']},
  {cat:'Sistema/Rete',  icons:['chart-line','chart-bar','chart-pie','counter','numeric','database','server','nas','router-wireless','router-wireless-off','wifi','wifi-off','wifi-strength-4','bluetooth','bluetooth-off','zigbee','z-wave','cellphone','cellphone-off','tablet','laptop','desktop-classic','cpu-64-bit','memory','harddisk','cloud','cloud-upload','cloud-download','cloud-check','api','code-json','console','terminal']},
];
let _iconPickerCb=null;
let _mdiAllIcons=null; // cache completa MDI
let _mdiLoadPromise=null; // evita fetch paralleli

function _loadMdiAll(){
  if(_mdiAllIcons!==null) return Promise.resolve(_mdiAllIcons);
  if(_mdiLoadPromise) return _mdiLoadPromise;
  _mdiLoadPromise=(async()=>{
    const urls=[
      'https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/meta.json',
      'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/meta.json',
      'https://cdn.jsdelivr.net/npm/@mdi/font/meta.json',
      'https://cdn.jsdelivr.net/npm/@mdi/svg/meta.json',
    ];
    for(const url of urls){
      try{
        const r=await fetch(url);
        if(!r.ok) continue;
        const data=await r.json();
        if(!Array.isArray(data)||data.length<100) continue;
        _mdiAllIcons=data.map(d=>(typeof d==='string'?d:d.name)).filter(Boolean).sort();
        return _mdiAllIcons;
      }catch(e){}
    }
    _mdiAllIcons=[]; // segna come tentato anche se fallito
    return _mdiAllIcons;
  })();
  return _mdiLoadPromise;
}

function openIconPicker(cb, anchorEl, evt){
  if(evt) evt.stopPropagation();
  _iconPickerCb=cb;
  const m=document.getElementById('ntf-icon-modal');
  const s=document.getElementById('ipm-search');
  if(s){ s.value=''; s.style.display='none'; }
  if(m){ m.style.display='flex'; _iconPickerRenderTab('emoji'); }
}
function _iconPickerClose(){
  const m=document.getElementById('ntf-icon-modal');
  if(m) m.style.display='none';
  _iconPickerCb=null;
}
function _iconPickerPick(val){
  if(_iconPickerCb) _iconPickerCb(val);
  _iconPickerClose();
}
async function _iconPickerRenderTab(tab){
  const m=document.getElementById('ntf-icon-modal');
  if(!m) return;
  const et=m.querySelector('[data-tab="emoji"]'), mt=m.querySelector('[data-tab="mdi"]');
  if(et) et.classList.toggle('active',tab==='emoji');
  if(mt) mt.classList.toggle('active',tab==='mdi');
  const s=document.getElementById('ipm-search');
  if(s) s.style.display=tab==='mdi'?'block':'none';
  const body=m.querySelector('.ipm-body');
  if(!body) return;
  if(tab==='emoji'){
    let h='<div class="ipm-grid">';
    _ICON_EMOJIS.forEach(e=>{
      if(e.startsWith('──')){ h+=`</div><div class="ipm-cat">${e.replace(/─/g,'').trim()}</div><div class="ipm-grid">`; }
      else { h+=`<button class="ipm-btn" data-action="_iconPickerPick" data-action-arg="${e}" title="${e}">${e}</button>`; }
    });
    h+='</div>';
    body.innerHTML=h;
  } else {
    const q=(document.getElementById('ipm-search')?.value||'').toLowerCase().trim();
    // Carica la libreria se non ancora disponibile
    if(_mdiAllIcons===null){
      body.innerHTML='<div style="color:var(--muted);padding:30px;text-align:center">⏳ Caricamento libreria MDI…</div>';
      await _loadMdiAll();
    }
    const allIcons=_mdiAllIcons||[];
    if(!q){
      // Senza ricerca: mostra le categorie curate + conteggio totale
      const tot=allIcons.length;
      let h=`<div style="font-size:10px;color:rgba(255,255,255,.3);padding:0 2px 8px">${tot>0?tot+' icone disponibili — cerca per filtrare':'Categorie suggerite (libreria non caricata)'}</div>`;
      _ICON_MDI_CATS.forEach(({cat,icons:catIcons})=>{
        h+=`<div class="ipm-cat">${cat}</div><div class="ipm-grid">`;
        catIcons.forEach(i=>{
          h+=`<button class="ipm-btn ipm-mdi" data-action="_iconPickerPick" data-action-arg="mdi:${i}" title="mdi:${i}"><span class="mdi mdi-${i}"></span><span class="ipm-mdi-lbl">${i}</span></button>`;
        });
        h+='</div>';
      });
      body.innerHTML=h;
      return;
    }
    // Con ricerca: filtra su tutta la libreria
    const icons=allIcons.filter(n=>n.includes(q));
    if(!icons.length){
      body.innerHTML=`<div style="color:var(--muted);padding:20px;text-align:center">Nessun risultato per "<b>${q}</b>"${allIcons.length===0?' — libreria non caricata':''}</div>`;
      return;
    }
    // Risultati ricerca: grid piatta con max 500 risultati
    const shown=icons.slice(0,500);
    let h=`<div style="font-size:10px;color:rgba(255,255,255,.3);padding:0 2px 8px">${icons.length} icone trovate${icons.length>500?' (prime 500)':''}</div>`;
    h+='<div class="ipm-grid">';
    shown.forEach(i=>{
      h+=`<button class="ipm-btn ipm-mdi" data-action="_iconPickerPick" data-action-arg="mdi:${i}" title="mdi:${i}"><span class="mdi mdi-${i}"></span><span class="ipm-mdi-lbl">${i}</span></button>`;
    });
    h+='</div>';
    body.innerHTML=h;
  }
}

/* ── Render icon universale: emoji o mdi:xxx ── */
function _renderIcon(icon, size, color){
  if(!icon) return '';
  if(icon.startsWith('mdi:')){
    const c=color||'currentColor';
    return `<span class="mdi mdi-${icon.slice(4)}" style="font-size:${size}px;color:${c};line-height:1;vertical-align:middle;display:inline-block"></span>`;
  }
  return `<span style="font-size:${size}px;line-height:1;vertical-align:middle">${icon}</span>`;
}
function _ntfIconHtml(icon,size){ return _renderIcon(icon,size,'var(--nc,#818cf8)')||`<span style="font-size:${size}px">🔔</span>`; }

/* ═══ COLOR PICKER ═══ */
const APP_CPALS=[
  '#ffffff','#f8fafc','#94a3b8','#64748b','#374151','#1e293b',
  '#fbbf24','#f59e0b','#d97706','#facc15','#eab308','#ca8a04',
  '#f97316','#ea580c','#fb923c','#fdba74','#c2410c','#9a3412',
  '#ef4444','#dc2626','#b91c1c','#f87171','#fca5a5','#fecaca',
  '#f472b6','#ec4899','#db2777','#f9a8d4','#e879f9','#d946ef',
  '#c084fc','#a855f7','#9333ea','#a78bfa','#8b5cf6','#7c3aed',
  '#818cf8','#6366f1','#4f46e5','#60a5fa','#3b82f6','#2563eb',
  '#38bdf8','#0ea5e9','#0284c7','#22d3ee','#06b6d4','#0891b2',
  '#2dd4bf','#14b8a6','#0d9488','#4ade80','#22c55e','#16a34a',
  '#84cc16','#65a30d','#4d7c0f','#34d399','#10b981','#059669',
];
let _colorTargetCb=null, _colorCurSel=null;
function openColorPicker(currentColor, cb, anchorEl, evt){
  if(evt) evt.stopPropagation();
  const pop=document.getElementById('app-color-pop');
  if(pop.classList.contains('show')){ pop.classList.remove('show'); _colorTargetCb=null; return; }
  _colorTargetCb=cb;
  _colorCurSel=currentColor||'';
  pop.innerHTML=`<div class="app-color-grid">${APP_CPALS.map(c=>`<span class="app-csw${c===_colorCurSel?' sel':''}" style="background:${c}" data-action="_pickColor" data-action-arg="${c}"></span>`).join('')}</div>`;
  _positionPop(pop, anchorEl);
}
function _pickColor(c){
  if(_colorTargetCb) _colorTargetCb(c);
  document.getElementById('app-color-pop').classList.remove('show');
  _colorTargetCb=null;
}

function _positionPop(pop, anchorEl){
  pop.classList.add('show');
  const br=anchorEl.getBoundingClientRect();
  const pw=pop.offsetWidth, ph=pop.offsetHeight;
  let left=br.left, top=br.bottom+6;
  if(left+pw>window.innerWidth-8) left=window.innerWidth-pw-8;
  if(top+ph>window.innerHeight-8) top=br.top-ph-6;
  pop.style.left=Math.max(6,left)+'px';
  pop.style.top=Math.max(6,top)+'px';
}

/* ═══ PLURALIZZAZIONE ITALIANA ═══ */
const APP_PLURAL_MAP={
  luci:         {s:'Luce',       p:'Luci'},
  luce:         {s:'Luce',       p:'Luci'},
  elettrodomestici:{s:'Elettrodomestico',p:'Elettrodomestici'},
  elettrodomestico:{s:'Elettrodomestico',p:'Elettrodomestici'},
  climatizzatori:{s:'Climatizzatore',p:'Climatizzatori'},
  climatizzatore:{s:'Climatizzatore',p:'Climatizzatori'},
  clima:        {s:'Clima',      p:'Clima'},
  tapparelle:   {s:'Tapparella', p:'Tapparelle'},
  tapparella:   {s:'Tapparella', p:'Tapparelle'},
  porte:        {s:'Porta',      p:'Porte'},
  porta:        {s:'Porta',      p:'Porte'},
  serrande:     {s:'Serranda',   p:'Serrande'},
  serranda:     {s:'Serranda',   p:'Serrande'},
  interruttori: {s:'Interruttore',p:'Interruttori'},
  sensori:      {s:'Sensore',    p:'Sensori'},
  finestre:     {s:'Finestra',   p:'Finestre'},
  ventilatori:  {s:'Ventilatore',p:'Ventilatori'},
};
function _pluralizeGroup(name, cnt){
  const key=(name||'').toLowerCase().trim();
  const m=APP_PLURAL_MAP[key];
  if(m) return cnt===1?m.s:m.p;
  /* fallback generico: capitalizza */
  const cap=name.charAt(0).toUpperCase()+name.slice(1);
  return cap;
}

/* ═══ TOGGLE ENTITÀ HA ═══ */
const TOGGLE_DOMAINS=new Set(['light','switch','fan','input_boolean','automation','script','cover','climate','lock']);
function toggleEntity(entityId){
  const domain=entityId.split('.')[0];
  if(!TOGGLE_DOMAINS.has(domain)) return;
  const svc=domain==='cover'?'toggle':domain==='lock'?(String(hs[entityId]||'').toLowerCase()==='locked'?'unlock':'lock'):'toggle';
  send({type:'call_service',domain,service:svc,service_data:{entity_id:entityId}});
}

/* ═══ CHIP DETAIL POPUP ═══ */
function _chipPopHtml(cardId, gIdx){
  const card=curPage().cards.find(c=>c.id===cardId);
  if(!card) return '';
  const g=(card.groups||[])[gIdx];
  if(!g) return '';
  const ON_STATES=new Set(['on','open','opening','playing','heat','cool','auto','fan_only','dry','home','true']);
  const color=g.color||'#818cf8';
  const ents=g.entities||[];
  const cnt=ents.filter(e=>ON_STATES.has(String(hs[e]||'').toLowerCase())).length;
  const canToggle=ents.some(e=>TOGGLE_DOMAINS.has(e.split('.')[0]));
  const rows=ents.map(e=>{
    const st=String(hs[e]||'').toLowerCase();
    const isOn=ON_STATES.has(st);
    const tgl=TOGGLE_DOMAINS.has(e.split('.')[0]);
    const bc=isOn?color:'rgba(255,255,255,0.25)';
    const bbg=isOn?_hex2rgba(color,.15):'rgba(255,255,255,0.04)';
    const bbd=isOn?_hex2rgba(color,.35):'rgba(255,255,255,0.1)';
    return `<div class="acp-row${tgl?'':' readonly'}" data-action-cond="toggleEntity" data-action-arg="${e}" title="${tgl?'Tocca per accendere/spegnere':''}">
      <span class="acp-name">${_friendlyName(e)}</span>
      <span class="acp-state" style="color:${bc};background:${bbg};border-color:${bbd}">${_stateIt(hs[e]||'—')}</span>
    </div>`;
  }).join('');
  return `
    <div class="acp-hdr">
      <span class="acp-dot" style="background:${color}"></span>
      <span class="acp-title">${_pluralizeGroup(g.name,2)}</span>
      <span class="acp-cnt" style="color:${color};background:${_hex2rgba(color,.15)};border-color:${_hex2rgba(color,.35)}">${cnt} / ${ents.length}</span>
    </div>
    ${canToggle?`<div style="font-size:8px;opacity:.28;text-align:center;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.06)">click per accendere / spegnere</div>`:''}
    <div class="acp-list">${rows||'<div style="font-size:10px;opacity:.3;padding:8px 4px">Nessuna entità configurata</div>'}</div>`;
}

function _refreshChipPopup(){
  const pop=document.getElementById('app-chip-pop');
  if(!pop||!pop.classList.contains('show')||pop._cid==null) return;
  const list=pop.querySelector('.acp-list');
  const st=list?list.scrollTop:0;
  pop.innerHTML=_chipPopHtml(pop._cid, pop._gi);
  const newList=pop.querySelector('.acp-list');
  if(newList&&st>0) newList.scrollTop=st;
}

/* ══════════════════════════════════════════════════════
   HEADER BAR EDITOR
══════════════════════════════════════════════════════ */
const _HB_BG_PRESETS=['#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#ffffff','#64748b'];
const _HB_TXT_PRESETS=['#ffffff','#000000','#fbbf24','#34d399','#f87171','#60a5fa','#c084fc','#fb923c'];
let _hbCardId=null;
let _hbChips={left:[],center:[],right:[]};
let _hbEditZone=null;
let _hbEditIdx=-1;
let _hbBg='rgba(255,255,255,0.12)';
let _hbTxt='#ffffff';

/* ── Genera il modal #hbmod al primo utilizzo ── */
function _hbCreateModal(){
  if(document.getElementById('hbmod')) return;
  const el=document.createElement('div');
  el.className='mbg off'; el.id='hbmod';
  el.innerHTML=`
  <div class="mbox" style="width:min(700px,97vw)">
    <div class="mhdr"><span class="mtitle" id="hbmod-title">⊞ Header Personalizzato</span><button class="mx" data-action="closeHBM">✕</button></div>
    <div class="fscroll" style="padding:0">

      <!-- Impostazioni card (nascosto per __hdrbar__) -->
      <div class="sect-section" id="hb-card-settings">
        <div style="display:flex;gap:8px">
          <div style="flex:1"><div class="flbl">Etichetta card</div><input class="finp" id="hb-label" type="text" placeholder="Header Personalizzato" style="margin-bottom:0"></div>
          <div style="flex:0 0 80px"><div class="flbl">Colonne</div><input class="finp" id="hb-colspan" type="number" min="1" max="12" value="4" style="margin-bottom:0"></div>
          <div style="flex:0 0 70px"><div class="flbl">Righe</div><input class="finp" id="hb-rowspan" type="number" min="1" max="6" value="1" style="margin-bottom:0"></div>
        </div>
      </div>

      <!-- Tre zone side-by-side -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;min-height:120px">
        <div class="hbz-col" style="border-right:1px solid var(--bd)">
          <div class="hbz-hdr">⬅ Sinistra</div>
          <div class="hbz-drop" id="hb-list-left" data-zone="left"></div>
          <button class="hbz-add" data-action="hbAddChip" data-action-arg="left">+ Aggiungi</button>
        </div>
        <div class="hbz-col" style="border-right:1px solid var(--bd)">
          <div class="hbz-hdr">↔ Centro</div>
          <div class="hbz-drop" id="hb-list-center" data-zone="center"></div>
          <button class="hbz-add" data-action="hbAddChip" data-action-arg="center">+ Aggiungi</button>
        </div>
        <div class="hbz-col">
          <div class="hbz-hdr">➡ Destra</div>
          <div class="hbz-drop" id="hb-list-right" data-zone="right"></div>
          <button class="hbz-add" data-action="hbAddChip" data-action-arg="right">+ Aggiungi</button>
        </div>
      </div>

      <!-- Form editor chip -->
      <div id="hb-chip-form" style="display:none;padding:0 14px 14px;border-top:1px solid var(--bd)">
        <div style="padding:10px 0 6px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--muted)" id="hb-form-title">Nuovo elemento</div>

        <!-- TIPO -->
        <div class="flbl">Tipo</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:12px">
          <button class="sect-align-btn on" id="hbft-entity" data-action="hbSelType" data-action-arg="entity" style="font-size:11px;padding:10px 4px">📦<br><span style="font-size:8px">Entità HA</span></button>
          <button class="sect-align-btn"    id="hbft-clock"  data-action="hbSelType" data-action-arg="clock"  style="font-size:11px;padding:10px 4px">⏰<br><span style="font-size:8px">Orologio</span></button>
          <button class="sect-align-btn"    id="hbft-sos"    data-action="hbSelType" data-action-arg="sos"    style="font-size:11px;padding:10px 4px;color:#f87171;border-color:rgba(248,113,113,.4)">🆘<br><span style="font-size:8px">SOS</span></button>
          <button class="sect-align-btn"    id="hbft-store"  data-action="hbSelType" data-action-arg="store"  style="font-size:11px;padding:10px 4px;color:#fbbf24;border-color:rgba(251,191,36,.4)">📦<br><span style="font-size:8px">Store</span></button>
        </div>
        <!-- Campi nascosti per compatibilità con tipi rimossi -->
        <input type="hidden" id="hbft-text-val">
        <input type="hidden" id="hbft-sep-val">
        <input type="hidden" id="hbft-kiosk-val">
        <input type="hidden" id="hbft-conn-val">

        <!-- ENTITÀ -->
        <div id="hbf-entity-row">
          <div class="flbl">Entità Home Assistant</div>
          <div class="finp-row" style="margin-bottom:6px">
            <input class="finp entac" id="hbf-entity" type="text" placeholder="es. lock.porta, light.salotto" data-input="_hbEntityChanged">
            <button class="fbtn" data-action="_hbBrowseEntity" data-action-el="true" title="Cerca entità">🔍</button>
          </div>
          <div id="hbf-action-hint" style="display:none;font-size:9px;padding:5px 8px;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);border-radius:7px;color:#a5b4fc;margin-bottom:6px;line-height:1.4"></div>
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <label style="font-size:10px;display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" id="hbf-showstate" checked> Mostra stato</label>
            <label style="font-size:10px;display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" id="hbf-showunit" checked> Unità misura</label>
          </div>
        </div>

        <!-- SOS semplificato -->
        <div id="hbf-sos-row" style="display:none">
          <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:12px;margin-bottom:10px">
            <div style="font-size:12px;font-weight:700;color:#f87171;margin-bottom:10px">🆘 Chip SOS</div>
            <div class="flbl">Nascondi persone dal SOS</div>
            <div id="hbf-sos-persons" style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;max-height:120px;overflow-y:auto"></div>
            <button class="btn2" style="width:100%;font-size:11px" data-action="openSOSCfgModal">⚙️ Configura SOS nelle impostazioni</button>
          </div>
        </div>

        <!-- STORE -->
        <div id="hbf-store-row" style="display:none">
          <div class="flbl">Card dallo Store</div>
          <div id="hbf-store-list" style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;margin-bottom:8px"></div>
          <div id="hbf-store-empty" style="display:none;font-size:10px;color:rgba(148,163,184,.5);padding:8px 0">Nessuna card installata nello store</div>
        </div>

        <!-- TESTO FISSO -->
        <div id="hbf-text-row" style="display:none">
          <div class="flbl">Testo</div>
          <input class="finp" id="hbf-text" type="text" placeholder="es. Casa, Allarme, Benvenuto…" style="margin-bottom:10px">
        </div>

        <!-- OROLOGIO -->
        <div id="hbf-clock-row" style="display:none">
          <div class="flbl">Stile</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:11px">
            <button class="hbclk-style-btn on" id="hbclks-default"  data-action="hbSelClockStyle" data-action-arg="default"><span style="font-size:14px;font-weight:900;letter-spacing:-1px;font-family:'Inter',sans-serif">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Default</span></button>
            <button class="hbclk-style-btn"    id="hbclks-bold"     data-action="hbSelClockStyle" data-action-arg="bold"><span style="font-size:15px;font-weight:900;letter-spacing:-2px;font-family:'Poppins',sans-serif">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Bold</span></button>
            <button class="hbclk-style-btn"    id="hbclks-minimal"  data-action="hbSelClockStyle" data-action-arg="minimal"><span style="font-size:13px;font-weight:300;letter-spacing:2px">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Minimal</span></button>
            <button class="hbclk-style-btn"    id="hbclks-digital"  data-action="hbSelClockStyle" data-action-arg="digital"><span style="font-size:12px;font-weight:700;letter-spacing:3px;font-family:monospace">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Digital</span></button>
            <button class="hbclk-style-btn"    id="hbclks-neon"     data-action="hbSelClockStyle" data-action-arg="neon" style="color:#4ade80"><span style="font-size:12px;font-weight:700;letter-spacing:3px;font-family:monospace;text-shadow:0 0 8px #4ade80">12:34</span><span style="font-size:7px;opacity:.6;font-weight:600">Neon</span></button>
            <button class="hbclk-style-btn"    id="hbclks-slim"     data-action="hbSelClockStyle" data-action-arg="slim"><span style="font-size:13px;font-weight:300;letter-spacing:5px">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Slim</span></button>
            <button class="hbclk-style-btn"    id="hbclks-mono"     data-action="hbSelClockStyle" data-action-arg="mono"><span style="font-size:13px;font-weight:600;letter-spacing:2px;font-family:monospace">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Mono</span></button>
            <button class="hbclk-style-btn"    id="hbclks-elegant"  data-action="hbSelClockStyle" data-action-arg="elegant"><span style="font-size:14px;font-weight:700;font-family:Georgia,serif">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Elegant</span></button>
            <button class="hbclk-style-btn"    id="hbclks-glow"     data-action="hbSelClockStyle" data-action-arg="glow"><span style="font-size:13px;font-weight:800;text-shadow:0 0 8px #fff,0 0 16px rgba(255,255,255,.6)">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Glow</span></button>
            <button class="hbclk-style-btn"    id="hbclks-shadow3d" data-action="hbSelClockStyle" data-action-arg="shadow3d"><span style="font-size:14px;font-weight:900;font-family:'Poppins',sans-serif;text-shadow:1px 1px 0 #0006,2px 2px 0 #0005">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">3D</span></button>
            <button class="hbclk-style-btn"    id="hbclks-outline"  data-action="hbSelClockStyle" data-action-arg="outline"><span style="font-size:14px;font-weight:900;font-family:'Poppins',sans-serif;-webkit-text-stroke:1px #fff;-webkit-text-fill-color:transparent">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Outline</span></button>
            <button class="hbclk-style-btn"    id="hbclks-gradient" data-action="hbSelClockStyle" data-action-arg="gradient"><span style="font-size:14px;font-weight:900;font-family:'Poppins',sans-serif;background:linear-gradient(90deg,#818cf8,#22d3ee);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">12:34</span><span style="font-size:7px;opacity:.45;font-weight:600">Gradient</span></button>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:9px">
            <div style="flex:1"><div class="flbl">Formato</div><div style="display:flex;gap:3px">
              <button class="sect-size-btn on" id="hbclkf-24h" data-action="hbSelClockFormat" data-action-arg="24h" style="flex:1;font-size:9px">24h</button>
              <button class="sect-size-btn"    id="hbclkf-12h" data-action="hbSelClockFormat" data-action-arg="12h" style="flex:1;font-size:9px">12h</button>
            </div></div>
            <div style="flex:1"><div class="flbl">Dimensione</div><div style="display:flex;gap:3px">
              <button class="sect-size-btn"    id="hbclksz-sm" data-action="hbSelClockSize" data-action-arg="sm" style="flex:1;font-size:9px">S</button>
              <button class="sect-size-btn on" id="hbclksz-md" data-action="hbSelClockSize" data-action-arg="md" style="flex:1;font-size:9px">M</button>
              <button class="sect-size-btn"    id="hbclksz-lg" data-action="hbSelClockSize" data-action-arg="lg" style="flex:1;font-size:9px">L</button>
              <button class="sect-size-btn"    id="hbclksz-xl" data-action="hbSelClockSize" data-action-arg="xl" style="flex:1;font-size:9px">XL</button>
            </div></div>
          </div>
          <div style="display:flex;gap:14px;margin-bottom:9px">
            <label style="font-size:10px;display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" id="hbclk-showdate" checked> Mostra data</label>
            <label style="font-size:10px;display:flex;align-items:center;gap:5px;cursor:pointer"><input type="checkbox" id="hbclk-showsec"> Secondi</label>
          </div>
          <div class="flbl">Colore</div>
          <div id="hbclk-colors" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px;align-items:center"></div>
          <input type="hidden" id="hbclk-color" value="">
        </div>

        <!-- CHIP ASPETTO -->
        <div id="hbf-chip-row">
          <div style="display:flex;gap:8px;margin-bottom:8px;align-items:end">
            <div style="flex:1"><div class="flbl">Etichetta <span style="font-weight:400;opacity:.5">(opz.)</span></div>
              <input class="finp" id="hbf-label" type="text" placeholder="es. Porta, Allarme"></div>
            <div><div class="flbl">Icona <span style="font-weight:400;opacity:.5">(auto)</span></div>
              <div style="display:flex;gap:3px;align-items:center">
                <!-- Anteprima icona live -->
                <span id="hbf-icon-prev" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(255,255,255,.06);border:1px solid var(--bd);border-radius:6px;flex-shrink:0;cursor:pointer" title="Anteprima icona" data-action="_hbPickChipIcon" data-action-el="true">?</span>
                <!-- Colore icona -->
                <input type="color" id="hbf-icon-color" value="#ffffff" title="Colore icona" style="width:26px;height:28px;border:none;background:none;padding:0;cursor:pointer;border-radius:5px;flex-shrink:0">
                <!-- Reset -->
                <button class="hbc-btn" title="Reset auto" data-action="_hbResetIcon" style="flex-shrink:0">↺</button>
              </div>
              <input type="hidden" id="hbf-icon">
            </div>
          </div>
          <!-- ICONE CONDIZIONALI PER STATO -->
          <div id="hbf-iconmap-section" style="margin-bottom:10px">
            <div class="flbl">Icone condizionali <span style="font-weight:400;opacity:.5">— cambia icona in base allo stato</span></div>
            <div id="hbf-imap-list" style="margin-bottom:6px"></div>
            <div style="background:rgba(255,255,255,.03);border:1px solid var(--bd);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px">
              <div style="font-size:9px;color:var(--muted);font-weight:700;letter-spacing:.5px">+ AGGIUNGI REGOLA</div>
              <div style="display:flex;gap:4px;align-items:center">
                <input class="finp" id="hbf-imap-state" type="text" placeholder="stato (es. on, locked, playing…)" style="flex:1;font-size:11px">
                <span id="hbf-imap-icon-prev" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;background:rgba(255,255,255,.06);border:1px solid var(--bd);border-radius:6px;flex-shrink:0;cursor:pointer" title="Scegli icona" data-action="_hbPickImapIcon" data-action-el="true">?</span>
                <input type="color" id="hbf-imap-color" value="#ffffff" title="Colore icona" style="width:26px;height:28px;border:none;background:none;padding:0;cursor:pointer;border-radius:5px;flex-shrink:0">
                <input type="hidden" id="hbf-imap-icon">
                <button class="fbtn" data-action="hbAddIconMap" title="Aggiungi regola" style="flex-shrink:0">+</button>
              </div>
              <div style="font-size:9px;color:rgba(148,163,184,.45);line-height:1.6">
                💡 Es.: stato <span style="color:#4ade80">on</span> → 💡 giallo · stato <span style="color:#94a3b8">off</span> → 💡 grigio
              </div>
            </div>
          </div>
          <div style="display:flex;gap:6px;margin-bottom:10px">
            <div style="flex:1"><div class="flbl">Forma</div><div style="display:flex;gap:3px">
              <button class="sect-size-btn on" id="hbsh-pill"    data-action="hbSelShape" data-action-arg="pill"    style="flex:1;font-size:9px">Pill</button>
              <button class="sect-size-btn"    id="hbsh-rounded" data-action="hbSelShape" data-action-arg="rounded" style="flex:1;font-size:9px">Tondo</button>
              <button class="sect-size-btn"    id="hbsh-square"  data-action="hbSelShape" data-action-arg="square"  style="flex:1;font-size:9px">Quadro</button>
            </div></div>
            <div style="flex:0 0 80px"><div class="flbl">Dim.</div><div style="display:flex;gap:3px">
              <button class="sect-size-btn"    id="hbsz-sm" data-action="hbSelSize" data-action-arg="sm" style="flex:1">S</button>
              <button class="sect-size-btn on" id="hbsz-md" data-action="hbSelSize" data-action-arg="md" style="flex:1">M</button>
              <button class="sect-size-btn"    id="hbsz-lg" data-action="hbSelSize" data-action-arg="lg" style="flex:1">L</button>
            </div></div>
          </div>
          <!-- ENTITÀ SECONDARIA -->
          <div style="border-top:1px solid var(--bd);margin:10px 0 10px;padding-top:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <div class="flbl" style="margin:0">Entità secondaria <span style="font-weight:400;opacity:.5">(opzionale)</span></div>
              <label style="font-size:10px;display:flex;align-items:center;gap:5px;cursor:pointer;color:rgba(255,255,255,.6)">
                <input type="checkbox" id="hbf-entity2-on"> Abilita
              </label>
            </div>
            <div id="hbf-entity2-fields" style="display:none">
              <div style="display:flex;gap:6px;margin-bottom:6px">
                <div style="flex:1">
                  <div class="flbl">Entità</div>
                  <div class="finp-row" style="gap:2px">
                    <input class="finp entac" id="hbf-entity2" type="text" placeholder="es. sensor.batteria">
                    <button class="fbtn" data-action="browseField" data-action-arg="hbf-entity2" title="Cerca">🔍</button>
                  </div>
                </div>
                <div style="flex:0 0 60px">
                  <div class="flbl">Icona</div>
                  <div class="finp-row" style="gap:2px">
                    <input class="finp" id="hbf-icon2" type="text" placeholder="auto" style="text-align:center;font-size:11px;min-width:0" data-input="_hbIcon2Input">
                    <button class="fbtn" data-action="_hbPickChipIcon2" data-action-el="true" title="Scegli icona">🎨</button>
                  </div>
                </div>
              </div>
              <div class="flbl">Posizione</div>
              <div style="display:flex;gap:4px;margin-bottom:8px">
                <button class="sect-size-btn on" id="hbent2-left"  data-action="_hbSelEnt2Pos" data-action-arg="left"  style="flex:1;font-size:10px">◀ Sinistra</button>
                <button class="sect-size-btn"    id="hbent2-right" data-action="_hbSelEnt2Pos" data-action-arg="right" style="flex:1;font-size:10px">Destra ▶</button>
              </div>
              <label style="font-size:10px;display:flex;align-items:center;gap:5px;cursor:pointer;margin-bottom:8px">
                <input type="checkbox" id="hbf-entity2-showunit" checked> Mostra unità
              </label>
            </div>
          </div>

          <!-- Azione al click — solo le principali -->
          <div class="flbl">Al click…</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:10px">
            <button class="sect-align-btn on" id="hbca-none"      data-action="hbSelClickAct" data-action-arg="none"      style="font-size:11px;padding:10px 6px">🚫<br><span style="font-size:9px">Niente</span></button>
            <button class="sect-align-btn"    id="hbca-more_info" data-action="hbSelClickAct" data-action-arg="more_info" style="font-size:11px;padding:10px 6px">ℹ️<br><span style="font-size:9px">Più info</span></button>
            <button class="sect-align-btn"    id="hbca-toggle"    data-action="hbSelClickAct" data-action-arg="toggle"    style="font-size:11px;padding:10px 6px">🔀<br><span style="font-size:9px">Toggle</span></button>
            <button class="sect-align-btn"    id="hbca-options"   data-action="hbSelClickAct" data-action-arg="options"   style="font-size:11px;padding:10px 6px">☰<br><span style="font-size:9px">Opzioni</span></button>
          </div>
          <!-- Navigate e Service nascosti per compatibilità -->
          <div id="hbf-navigate-row" style="display:none">
            <div class="flbl">Pagina</div><select class="finp" id="hbf-navpage" style="margin-bottom:8px"></select>
          </div>
          <div id="hbf-service-row" style="display:none">
            <div style="display:flex;gap:6px;margin-bottom:6px">
              <div style="flex:1"><div class="flbl">Dominio</div><input class="finp" id="hbf-tapdom" type="text" placeholder="es. light"></div>
              <div style="flex:1"><div class="flbl">Servizio</div><input class="finp" id="hbf-tapsvc" type="text" placeholder="es. turn_on"></div>
            </div>
            <div class="finp-row" style="margin-bottom:8px">
              <input class="finp" id="hbf-tapent" type="text" placeholder="Entità target (vuoto = stessa entità)">
              <button class="fbtn" data-action="browseField" data-action-arg="hbf-tapent">🔍</button>
            </div>
          </div>
          <div id="hbf-options-row" style="display:none">
            <div id="hbf-opts-list" style="margin-bottom:5px"></div>
            <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:7px 8px;border:1px solid var(--bd)">
              <div style="font-size:9px;color:var(--muted);margin-bottom:5px;font-weight:700">+ AGGIUNGI VOCE MENU</div>
              <div style="display:flex;gap:4px;margin-bottom:4px">
                <input class="finp" id="hbf-opt-lbl"  type="text" placeholder="Nome (es. Disinserisci)" style="flex:2">
                <input class="finp" id="hbf-opt-icon" type="text" placeholder="icona" style="flex:0 0 46px;text-align:center">
                <button class="fbtn" id="hbf-opt-icon-picker">🎨</button>
              </div>
              <div style="display:flex;gap:4px">
                <input class="finp" id="hbf-opt-dom" type="text" placeholder="dominio" style="flex:1">
                <input class="finp" id="hbf-opt-svc" type="text" placeholder="servizio" style="flex:1">
                <button class="ep-add" data-action="hbAddOption">+</button>
              </div>
            </div>
          </div>
          <!-- COLORI -->
          <div class="flbl">Colori</div>
          <div class="hb-color-row" style="margin-bottom:10px">
            <div class="hb-color-cell">
              <label>SFONDO</label>
              <div class="hb-color-wrap">
                <input type="color" id="hbf-col-bg-pick" value="#1e293b">
                <input class="finp" type="text" id="hbf-bg-custom" placeholder="auto" style="font-size:9px;padding:4px 6px">
                <button class="hbc-btn" title="Reset auto" data-action="_hbResetColor" data-action-arg="bg" style="flex-shrink:0">↺</button>
              </div>
            </div>
            <div class="hb-color-cell">
              <label>BORDO</label>
              <div class="hb-color-wrap">
                <input type="color" id="hbf-col-border-pick" value="#334155">
                <input class="finp" type="text" id="hbf-border-color" placeholder="auto" style="font-size:9px;padding:4px 6px">
                <button class="hbc-btn" title="Reset auto" data-action="_hbResetColor" data-action-arg="border" style="flex-shrink:0">↺</button>
              </div>
            </div>
            <div class="hb-color-cell">
              <label>TESTO</label>
              <div class="hb-color-wrap">
                <input type="color" id="hbf-col-text-pick" value="#ffffff">
                <input class="finp" type="text" id="hbf-text-custom" placeholder="auto" style="font-size:9px;padding:4px 6px">
                <button class="hbc-btn" title="Reset auto" data-action="_hbResetColor" data-action-arg="text" style="flex-shrink:0">↺</button>
              </div>
            </div>
          </div>

          <!-- COLORI PER STATO -->
          <div class="flbl" style="margin-top:10px">Colore per stato <span style="opacity:.5;font-weight:400">(sovrascrive il colore base)</span></div>
          <div id="hbf-cmap-list" style="margin-bottom:5px"></div>
          <div style="display:flex;gap:4px;margin-bottom:10px;align-items:center">
            <input class="finp" id="hbf-cmap-state" type="text" placeholder="stato (es. locked, on, armed_away…)" style="flex:2;font-size:11px">
            <input type="color" id="hbf-cmap-color-pick" value="#4ade80" style="width:32px;height:32px;border:none;background:none;padding:0;cursor:pointer;border-radius:6px;flex-shrink:0">
            <input class="finp" id="hbf-cmap-color" type="text" placeholder="#4ade80" style="flex:1;font-size:11px">
            <button class="fbtn" data-action="hbAddColorMapEntry" title="Aggiungi">+</button>
          </div>
          <!-- Hint stati comuni -->
          <div style="font-size:9px;color:rgba(148,163,184,.5);margin-bottom:8px;line-height:1.7">
            💡 Stati comuni: <span style="color:#4ade80">locked / on / armed_away / home / closed</span> →
            <span style="color:#f87171">unlocked / off / disarmed / away / open</span> →
            <span style="color:#a78bfa">armed_night / armed_home</span>
          </div>
          <!-- Campi hidden compat -->
          <div id="hbf-colormap-row" style="display:none"><div id="hbf-cmap-preview" style="display:none"></div><div id="hbf-cmap-swatches" style="display:none"></div></div>
          <div id="hbf-iconmap-row" style="display:none"></div>
          <div id="hbf-bg-colors"  style="display:none"></div>
          <div id="hbf-auto-badge" style="display:none"></div>
        </div>

        <!-- ANTEPRIMA LIVE -->
        <div style="padding:0 14px 4px">
          <div class="flbl" style="margin-bottom:6px">👁 Anteprima</div>
          <div id="hb-chip-preview-box"><span style="font-size:10px;opacity:.35">Seleziona un tipo per vedere l'anteprima</span></div>
        </div>

        <div style="display:flex;gap:6px;margin:0 14px 14px">
          <button class="btn1" id="hbf-save-btn" data-action="hbSaveChip" style="flex:1">✅ Salva elemento</button>
          <button class="btn2" data-action="hbCancelChip" style="flex:0 0 90px">Chiudi</button>
        </div>
      </div>
    </div>
    <div class="mfoot">
      <button class="btn2" data-action="closeHBM">Annulla</button>
      <button class="btn1" data-action="saveHBM">💾 Salva</button>
    </div>
  </div>`;
  document.body.appendChild(el);
}

function openHBM(cardId){
  _hbCreateModal(); // genera il modal la prima volta
  const card=curPage().cards.find(c=>c.id===cardId); if(!card) return;
  _hbCardId=cardId;
  _hbChips={left:JSON.parse(JSON.stringify(card.left||[])),center:JSON.parse(JSON.stringify(card.center||[])),right:JSON.parse(JSON.stringify(card.right||[]))};
  document.getElementById('hbmod-title').textContent='⊞ '+card.label;
  document.getElementById('hb-label').value=card.label||'Header Personalizzato';
  document.getElementById('hb-colspan').value=card.colSpan||4;
  document.getElementById('hb-rowspan').value=card.rowSpan||1;
  hbRenderAllLists();
  hbCancelChip();
  document.getElementById('hbmod').classList.remove('off');
}
function closeHBM(){
  document.getElementById('hbmod').classList.add('off');
  const cardSect=document.getElementById('hb-card-settings');
  if(cardSect) cardSect.style.display='';
  _hbCardId=null;
}

function saveHBM(){
  if(_hbCardId==='__hdrbar__'){
    cfg.hdrBar={left:_hbChips.left,center:_hbChips.center,right:_hbChips.right};
    saveCfg(); renderHdrChips(); closeHBM(); return;
  }
  const card=curPage().cards.find(c=>c.id===_hbCardId); if(!card) return;
  card.label=document.getElementById('hb-label').value.trim()||'Header Personalizzato';
  card.colSpan=parseInt(document.getElementById('hb-colspan').value)||4;
  card.rowSpan=parseInt(document.getElementById('hb-rowspan').value)||1;
  card.left=_hbChips.left;
  card.center=_hbChips.center;
  card.right=_hbChips.right;
  saveCfg(); renderDash(); closeHBM();
}

function hbRenderAllLists(){
  hbRenderList('left'); hbRenderList('center'); hbRenderList('right');
  _hbInitDnD();
}

function hbRenderList(zone){
  const el=document.getElementById('hb-list-'+zone); if(!el) return;
  const arr=_hbChips[zone]||[];
  el.innerHTML='';
  if(!arr.length){
    const emp=document.createElement('div'); emp.className='hbz-empty'; emp.textContent='Trascina qui o aggiungi';
    el.appendChild(emp); return;
  }
  arr.forEach((item,i)=>{
    const wrap=document.createElement('div');
    wrap.className='hbc-item'+(item.hidden?' hidden-chip':'');
    wrap.draggable=true;
    wrap.dataset.zone=zone; wrap.dataset.idx=i;
    // Drag handle
    const dh=document.createElement('div'); dh.className='hbc-drag'; dh.textContent='⋮⋮';
    // Preview visivo reale
    const pv=document.createElement('div'); pv.className='hbc-preview';
    pv.innerHTML=_hbRenderOneChip(item);
    // Toggle visibilità
    const bt=document.createElement('button'); bt.className='hbc-btn'+(item.hidden?' active':'');
    bt.title=item.hidden?'Mostra':'Nascondi'; bt.textContent=item.hidden?'🙈':'👁';
    bt.addEventListener('click',()=>{ item.hidden=!item.hidden; hbRenderList(zone); });
    // Edit
    const be=document.createElement('button'); be.className='hbc-btn'; be.title='Modifica'; be.textContent='✏️';
    be.addEventListener('click',()=>hbEditChip(zone,i));
    // Delete
    const bd=document.createElement('button'); bd.className='hbc-btn'; bd.title='Elimina'; bd.textContent='✕';
    bd.style.cssText='background:rgba(239,68,68,.1);color:#f87171;border-color:rgba(239,68,68,.25)';
    bd.addEventListener('click',()=>{ _hbChips[zone].splice(i,1); hbRenderAllLists(); });
    wrap.append(dh,pv,bt,be,bd);
    el.appendChild(wrap);
  });
}

/* ── Drag & Drop tra zone ── */
let _hbDragZone=null, _hbDragIdx=null, _hbDragEl=null;
function _hbInitDnD(){
  document.querySelectorAll('#hbmod .hbc-item').forEach(el=>{
    el.addEventListener('dragstart',e=>{
      _hbDragZone=el.dataset.zone; _hbDragIdx=parseInt(el.dataset.idx);
      _hbDragEl=el; el.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
    });
    el.addEventListener('dragend',()=>{
      el.classList.remove('dragging');
      document.querySelectorAll('.hbc-item').forEach(x=>x.classList.remove('drag-target-above','drag-target-below'));
    });
    el.addEventListener('dragover',e=>{
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.hbc-item').forEach(x=>x.classList.remove('drag-target-above','drag-target-below'));
      const mid=el.getBoundingClientRect().top+el.getBoundingClientRect().height/2;
      el.classList.add(e.clientY<mid?'drag-target-above':'drag-target-below');
    });
    el.addEventListener('drop',e=>{
      e.preventDefault(); e.stopPropagation();
      if(_hbDragZone===null) return;
      const tgtZone=el.dataset.zone; const tgtIdx=parseInt(el.dataset.idx);
      const mid=el.getBoundingClientRect().top+el.getBoundingClientRect().height/2;
      const insertAfter=e.clientY>=mid;
      _hbDnDMove(tgtZone, insertAfter?tgtIdx+1:tgtIdx);
    });
  });
  document.querySelectorAll('#hbmod .hbz-drop').forEach(zone=>{
    zone.addEventListener('dragover',e=>{ e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
    zone.addEventListener('drop',e=>{
      e.preventDefault(); zone.classList.remove('drag-over');
      if(_hbDragZone===null) return;
      const tgtZone=zone.dataset.zone;
      // Se drop sulla zona (non su un chip) → metti in fondo
      if(!e.target.closest('.hbc-item')) _hbDnDMove(tgtZone, _hbChips[tgtZone].length);
    });
  });
}
function _hbDnDMove(tgtZone, tgtIdx){
  if(_hbDragZone===null) return;
  const src=_hbChips[_hbDragZone]; const tgt=_hbChips[tgtZone];
  const [item]=src.splice(_hbDragIdx,1);
  // Se stessa zona e l'idx di destinazione è dopo la rimozione, aggiusta
  const adj=(_hbDragZone===tgtZone && tgtIdx>_hbDragIdx)?tgtIdx-1:tgtIdx;
  tgt.splice(Math.min(adj,tgt.length),0,item);
  _hbDragZone=null; _hbDragIdx=null;
  hbRenderAllLists();
}

function _hbChipPreview(item){
  if(item.type==='clock') return `<span class="hb-chip-prev" style="background:rgba(255,255,255,.1);color:#fff">⏰ Orologio</span>`;
  if(item.type==='sep') return `<span style="font-size:10px;opacity:.5">│ Separatore</span>`;
  if(item.type==='sos')   return `<span class="hb-chip-prev" style="background:rgba(239,68,68,.3);border-color:rgba(248,113,113,.6);color:#fff">🆘 ${item.label||'SOS'}</span>`;
  if(item.type==='kiosk') return `<span class="hb-chip-prev" style="background:rgba(99,102,241,.25);border-color:rgba(129,140,248,.5);color:#a5b4fc">⛶ ${item.label||'Kiosk'}</span>`;
  if(item.type==='conn')  return `<span class="hb-chip-prev" style="background:rgba(74,222,128,.2);border-color:rgba(74,222,128,.4);color:#4ade80">📶 Stato connessione</span>`;
  const bg=item.bg||'rgba(255,255,255,0.12)';
  const col=item.color||'#fff';
  const iconH=item.icon?_renderIcon(item.icon,10,col):'';
  const lbl=item.label?`<span style="opacity:.7">${eh(item.label)}</span> `:'';
  const val=item.type==='text'?(item.text||''):(item.entity||'');
  return `<span class="hb-chip-prev" style="background:${bg};color:${col}">${iconH} ${lbl}<span>${eh(val)}</span></span>`;
}

function hbMoveChip(zone,i,dir){
  const arr=_hbChips[zone]; const j=i+dir; if(j<0||j>=arr.length) return;
  [arr[i],arr[j]]=[arr[j],arr[i]]; hbRenderList(zone);
}
function hbDelChip(zone,i){ _hbChips[zone].splice(i,1); hbRenderAllLists(); }

function hbAddChip(zone){
  _hbEditZone=zone; _hbEditIdx=-1;
  _hbBg=''; _hbTxt='#ffffff';
  document.getElementById('hb-form-title').textContent='Nuovo elemento — '+({left:'Sinistra',center:'Centro',right:'Destra'}[zone]||zone);
  document.getElementById('hbf-save-btn').textContent='➕ Aggiungi';
  hbSelType('entity');
  document.getElementById('hbf-entity').value='';
  document.getElementById('hbf-text').value='';
  document.getElementById('hbf-icon').value='';
  document.getElementById('hbf-label').value='';
  document.getElementById('hbf-bg-custom').value=_hbBg;
  document.getElementById('hbf-text-custom')?.value!=null&&(document.getElementById('hbf-text-custom').value=_hbTxt);
  document.getElementById('hbf-showstate').checked=true;
  document.getElementById('hbf-showunit').checked=true;
  hbSelShape('pill'); hbSelSize('md');
  hbSelClickAct('more_info');
  document.getElementById('hbf-tapdom').value='';
  document.getElementById('hbf-tapsvc').value='';
  document.getElementById('hbf-tapent').value='';
  _hbIconMap={}; _hbColorMap={}; _hbOptions=[];
  _hbRenderIconMap(); _hbRenderColorMap(); _hbRenderColorMapSwatches(); _hbRenderOptions();
  _hbRenderColorPickers();
  document.getElementById('hb-chip-form').style.display='';
  _hbInitColorPickers(); _hbUpdatePreview();
}

function hbEditChip(zone,i){
  _hbEditZone=zone; _hbEditIdx=i;
  const item=_hbChips[zone][i]; if(!item) return;
  _hbBg=item.bg||''; _hbTxt=item.color||'#ffffff';
  document.getElementById('hb-form-title').textContent='Modifica elemento';
  document.getElementById('hbf-save-btn').textContent='✅ Salva elemento';
  hbSelType(item.type||'entity');
  document.getElementById('hbf-entity').value=item.entity||'';
  document.getElementById('hbf-text').value=item.text||'';
  document.getElementById('hbf-icon').value=item.icon||'';
  const icoPick=document.getElementById('hbf-icon-color'); if(icoPick) icoPick.value=item.iconColor||'#ffffff';
  document.getElementById('hbf-label').value=item.label||'';
  document.getElementById('hbf-bg-custom').value=_hbBg;
  document.getElementById('hbf-text-custom')?.value!=null&&(document.getElementById('hbf-text-custom').value=_hbTxt);
  const bdEl=document.getElementById('hbf-border-color'); if(bdEl) bdEl.value=item.borderColor||'';
  // Entità secondaria
  const ent2On=document.getElementById('hbf-entity2-on');
  const ent2Fields=document.getElementById('hbf-entity2-fields');
  if(ent2On){ ent2On.checked=!!(item.entity2); if(ent2Fields) ent2Fields.style.display=item.entity2?'':'none'; }
  const ent2El=document.getElementById('hbf-entity2'); if(ent2El) ent2El.value=item.entity2||'';
  const ico2El=document.getElementById('hbf-icon2'); if(ico2El) ico2El.value=item.entity2icon||'';
  const su2El=document.getElementById('hbf-entity2-showunit'); if(su2El) su2El.checked=item.entity2showUnit!==false;
  _hbSelEnt2Pos(item.entity2pos||'right');
  document.getElementById('hbf-showstate').checked=item.showState!==false;
  document.getElementById('hbf-showunit').checked=item.showUnit!==false;
  hbSelShape(item.shape||'pill'); hbSelSize(item.size||'md');
  hbSelClickAct(item.clickAction||'more_info');
  document.getElementById('hbf-tapdom').value=item.tapDomain||'';
  document.getElementById('hbf-tapsvc').value=item.tapService||'';
  document.getElementById('hbf-tapent').value=item.tapEntity||'';
  _hbIconMap=JSON.parse(JSON.stringify(item.iconMap||{}));
  _hbColorMap=JSON.parse(JSON.stringify(item.colorMap||{}));
  _hbOptions=JSON.parse(JSON.stringify(item.options||[]));
  _hbRenderIconMap(); _hbRenderColorMap(); _hbRenderColorMapSwatches(); _hbRenderOptions();
  _hbRenderColorPickers();
  // clock options
  if(item.type==='clock'){
    hbSelClockStyle(item.clockStyle||'default');
    hbSelClockFormat(item.clockFormat||'24h');
    hbSelClockSize(item.clockSizeName||'md');
    const sd=document.getElementById('hbclk-showdate'); if(sd) sd.checked=item.clockShowDate!==false;
    const ss=document.getElementById('hbclk-showsec');  if(ss) ss.checked=item.clockShowSeconds===true;
    const ci=document.getElementById('hbclk-color');    if(ci) ci.value=item.clockColor||'#ffffff';
    _hbRenderClockColors();
  }
  // Carica i colori nei picker
  const bgTxt=document.getElementById('hbf-bg-custom'); if(bgTxt) { const pick=document.getElementById('hbf-col-bg-pick'); if(pick&&bgTxt.value&&/^#/.test(bgTxt.value)) pick.value=bgTxt.value; }
  const bdTxt=document.getElementById('hbf-border-color'); if(bdTxt) { const pick=document.getElementById('hbf-col-border-pick'); if(pick&&bdTxt.value&&/^#/.test(bdTxt.value)) pick.value=bdTxt.value; }
  const txTxt=document.getElementById('hbf-text-custom'); if(txTxt) { const pick=document.getElementById('hbf-col-text-pick'); if(pick&&txTxt.value&&/^#/.test(txTxt.value)) pick.value=txTxt.value; }
  // Toggle entity2 fields
  const ent2ChkAdd=document.getElementById('hbf-entity2-on');
  const ent2FldAdd=document.getElementById('hbf-entity2-fields');
  if(ent2ChkAdd && ent2FldAdd && !ent2ChkAdd._bound){
    ent2ChkAdd._bound=true;
    ent2ChkAdd.addEventListener('change',()=>{ ent2FldAdd.style.display=ent2ChkAdd.checked?'':'none'; _hbUpdatePreview(); });
  }
  document.getElementById('hb-chip-form').style.display='';
  _hbInitColorPickers(); _hbUpdatePreview();
}

function hbSelType(t){
  ['entity','text','clock','sep','sos','kiosk','conn','store'].forEach(x=>document.getElementById('hbft-'+x)?.classList.toggle('on',x===t));
  const sf=(id,v)=>{const e=document.getElementById(id);if(e)e.style.display=v?'':'none';};
  const isStore=t==='store', isSos=t==='sos', isSimple=isStore||isSos||t==='clock'||t==='sep';
  sf('hbf-entity-row',       t==='entity');
  sf('hbf-text-row',         t==='text');
  sf('hbf-clock-row',        t==='clock');
  sf('hbf-store-row',        isStore);
  sf('hbf-sos-row',          isSos);
  if(isSos) _hbRenderSosPersons();
  if(t==='clock') _hbRenderClockColors();
  if(isStore) _hbRenderStoreList();
  // Chip row visibile solo per entity/text
  sf('hbf-chip-row',         t==='entity'||t==='text');
  sf('hbf-iconmap-section',  t==='entity');
  // Colori solo per entity/text
  const colorRow=document.getElementById('hbf-col-bg-pick')?.closest('.hb-color-row');
  if(colorRow) colorRow.parentElement && (colorRow.style.display=(t==='entity'||t==='text')?'':'none');
  document.querySelectorAll('#hbf-chip-form .flbl').forEach(lbl=>{
    if(lbl.textContent.startsWith('Colori')) lbl.style.display=(t==='entity'||t==='text')?'':'none';
  });
  // Entità secondaria
  const ent2Sec=document.getElementById('hbf-entity2-on')?.closest('[style*="border-top"]');
  if(ent2Sec) ent2Sec.style.display=t==='entity'?'':'none';
  // Azioni
  sf('hbf-navigate-row', false); sf('hbf-service-row', false); sf('hbf-options-row', false);
  const actGrid=document.getElementById('hbca-none')?.closest('div[style*="grid"]');
  const actLbl=actGrid?.previousElementSibling;
  if(actGrid) actGrid.style.display=t==='entity'?'':'none';
  if(actLbl)  actLbl.style.display=t==='entity'?'':'none';
  _hbUpdatePreview();
}
function hbSelShape(s){
  ['pill','rounded','square'].forEach(x=>document.getElementById('hbsh-'+x)?.classList.toggle('on',x===s));
  _hbUpdatePreview();
}
function hbSelSize(s){
  ['sm','md','lg'].forEach(x=>document.getElementById('hbsz-'+x)?.classList.toggle('on',x===s));
  _hbUpdatePreview();
}
function _hbGetShape(){ return ['pill','rounded','square'].find(x=>document.getElementById('hbsh-'+x)?.classList.contains('on'))||'pill'; }
function _hbGetSize(){  return ['sm','md','lg'].find(x=>document.getElementById('hbsz-'+x)?.classList.contains('on'))||'md'; }

/* ── Clock style helpers ── */
function hbSelClockStyle(s){
  ['default','bold','minimal','digital','neon','slim','mono','elegant','glow','shadow3d','outline','gradient'].forEach(x=>document.getElementById('hbclks-'+x)?.classList.toggle('on',x===s));
  _hbUpdatePreview();
}
function hbSelClockFormat(f){
  ['24h','12h'].forEach(x=>document.getElementById('hbclkf-'+x)?.classList.toggle('on',x===f));
}
function hbSelClockSize(s){
  ['sm','md','lg','xl'].forEach(x=>document.getElementById('hbclksz-'+x)?.classList.toggle('on',x===s));
}
function _hbGetClockStyle(){ return ['default','bold','minimal','digital','neon','slim','mono','elegant','glow','shadow3d','outline','gradient'].find(x=>document.getElementById('hbclks-'+x)?.classList.contains('on'))||'default'; }
function _hbGetClockFormat(){ return ['24h','12h'].find(x=>document.getElementById('hbclkf-'+x)?.classList.contains('on'))||'24h'; }
function _hbGetClockSizeName(){ return ['sm','md','lg','xl'].find(x=>document.getElementById('hbclksz-'+x)?.classList.contains('on'))||'md'; }
const _HB_CLK_PALETTE=['#ffffff','#f0f9ff','#fbbf24','#4ade80','#22d3ee','#818cf8','#f87171','#e879f9','#fb923c'];
function _hbRenderClockColors(){
  const wrap=document.getElementById('hbclk-colors'); if(!wrap) return;
  const cur=document.getElementById('hbclk-color')?.value||'#ffffff';
  wrap.innerHTML=_HB_CLK_PALETTE.map(c=>`<div class="hbclk-color-sw${c===cur?' on':''}" style="background:${c}" data-action="_hbPickClockColor" data-action-arg="${c}" title="${c}"></div>`).join('')
    +`<input type="text" class="finp" id="hbclk-color-txt" value="${cur}" placeholder="#ffffff" style="width:70px;font-size:10px;padding:3px 6px;margin-left:2px" data-input="_hbPickClockColor">`;
}
function _hbPickClockColor(c){
  const inp=document.getElementById('hbclk-color'); if(inp) inp.value=c;
  const txt=document.getElementById('hbclk-color-txt'); if(txt&&txt!==document.activeElement) txt.value=c;
  document.querySelectorAll('.hbclk-color-sw').forEach(el=>el.classList.toggle('on',el.style.background===c||el.style.backgroundColor===c));
  // update neon button glow preview live
  const neonBtn=document.getElementById('hbclks-neon');
  if(neonBtn){ const sp=neonBtn.querySelector('span'); if(sp) sp.style.textShadow=`0 0 8px ${c}`; }
}

function hbSelClickAct(a){
  ['none','more_info','toggle','navigate','service','options'].forEach(x=>document.getElementById('hbca-'+x)?.classList.toggle('on',x===a));
  const sf2=(id,v)=>{const e=document.getElementById(id);if(e)e.style.display=v?'':'none';};
  sf2('hbf-navigate-row',a==='navigate');
  sf2('hbf-service-row',a==='service');
  sf2('hbf-options-row',a==='options');
  // popola pagine nel select naviga
  if(a==='navigate'){
    const sel=document.getElementById('hbf-navpage');
    if(sel){ sel.innerHTML=cfg.pages.map((p,i)=>`<option value="${i}">${p.icon||''} ${p.name}</option>`).join(''); }
  }
}
function _hbGetClickAct(){ return ['none','more_info','toggle','navigate','service','options'].find(x=>document.getElementById('hbca-'+x)?.classList.contains('on'))||'none'; }

// auto-riempie icona/etichetta + azione consigliata dall'entità selezionata
function hbAutoFill(){
  const eid=document.getElementById('hbf-entity').value.trim();
  if(!eid) return;
  const at=ha[eid]||{};
  if(at.friendly_name&&!document.getElementById('hbf-label').value){
    document.getElementById('hbf-label').value=at.friendly_name;
  }
  // auto-imposta azione in base al dominio (il runtime _hbSmartClick fa la scelta vera)
  const dom=eid.split('.')[0];
  const hint=document.getElementById('hbf-action-hint');
  const STATE={cover:'aprirà/chiuderà',lock:'bloccherà/sbloccherà',alarm_control_panel:'inserirà/disinserirà'};
  const PRESS={button:'eseguirà',input_button:'eseguirà',scene:'attiverà la scena',script:'eseguirà lo script'};
  const TOGGLE=['light','switch','input_boolean','fan','siren','humidifier','remote','automation','group'];
  let def;
  if(PRESS[dom])        def={act:'toggle',msg:'💡 Il click '+PRESS[dom]};
  else if(STATE[dom])   def={act:'toggle',msg:'💡 Il click '+STATE[dom]+' in base allo stato'};
  else if(TOGGLE.includes(dom)) def={act:'toggle',msg:'💡 Il click accenderà/spegnerà'};
  else                  def={act:'more_info',msg:'💡 Il click mostrerà le informazioni'};
  // suggerisci solo se l'azione attuale è "none" (non sovrascrivere scelte manuali)
  const curAct=_hbGetClickAct();
  if(curAct==='none') hbSelClickAct(def.act);
  if(hint){ hint.textContent=def.msg; hint.style.display='block'; }
  _hbRefreshIconPrev();
}

// apri info modale per entityId diretto
function openIM(eid){
  const at=ha[eid]||{};
  openInfoModal({entity:eid,icon:at.icon||'',label:at.friendly_name||eid,color:'#818cf8',unit:at.unit_of_measurement||''});
}

/* ══════════════════════════════════════════════
   AUTO COLORE + ICONA  —  replica logica HA
   ══════════════════════════════════════════════ */
function _haAutoColor(eid){
  if(!eid) return '#818cf8';
  const dom=eid.split('.')[0];
  const state=String(hs[eid]||'');
  const dc=(ha[eid]?.device_class)||'';
  switch(dom){
    case 'light':         return state==='on'?'#fbbf24':'#64748b';
    case 'switch':
    case 'input_boolean':
    case 'automation':    return state==='on'?'#22c55e':'#64748b';
    case 'fan':           return state==='on'?'#38bdf8':'#64748b';
    case 'lock':          return state==='locked'?'#22c55e':'#ef4444';
    case 'cover':
      if(state==='open')    return '#38bdf8';   // blu = aperto
      if(state==='opening'||state==='closing') return '#f59e0b'; // arancione = in movimento
      return '#64748b';   // grigio = chiuso
    case 'alarm_control_panel':
      if(state==='disarmed')    return '#ef4444';  // ROSSO  = disinserito (non protetto)
      if(state==='triggered')   return '#ef4444';  // ROSSO  = allarme scattato
      if(state==='pending')     return '#f59e0b';  // arancione = conto alla rovescia
      if(state==='armed_night') return '#a78bfa';  // VIOLA  = inserito notte
      if(state==='armed_home')  return '#22c55e';  // verde  = inserito casa
      if(state==='armed_vacation') return '#22d3ee'; // azzurro = vacanza
      return '#22c55e';   // VERDE = inserito (armed_away, armed_custom…)
    case 'binary_sensor':
      // stati pericolosi → rosso ON, verde OFF
      if(['moisture','smoke','gas','tamper','safety','carbon_monoxide','carbon_dioxide'].includes(dc))
        return state==='on'?'#ef4444':'#22c55e';
      if(dc==='battery') return state==='on'?'#f59e0b':'#22c55e';
      if(['door','window','opening'].includes(dc)) return state==='on'?'#f59e0b':'#22c55e';
      if(dc==='connectivity') return state==='on'?'#22c55e':'#ef4444';
      if(dc==='lock') return state==='on'?'#ef4444':'#22c55e';
      if(['motion','occupancy','presence'].includes(dc)) return state==='on'?'#fbbf24':'#64748b';
      return state==='on'?'#818cf8':'#64748b';
    case 'person':
    case 'device_tracker': return state==='home'?'#22c55e':'#64748b';
    case 'climate':
      if(state==='heat'||state==='heat_cool') return '#fb923c';
      if(state==='cool') return '#38bdf8';
      if(state==='dry')  return '#fbbf24';
      if(state==='fan_only') return '#38bdf8';
      return '#818cf8';
    case 'media_player':   return state==='playing'?'#818cf8':'#64748b';
    case 'vacuum':         return state==='cleaning'?'#818cf8':'#64748b';
    case 'update':         return state==='on'?'#f59e0b':'#22c55e';
    case 'input_number':
    case 'number':
    case 'sensor':
      if(dc==='battery')      return '#22c55e';
      if(dc==='temperature')  return '#fb923c';
      if(dc==='humidity')     return '#38bdf8';
      if(dc==='power'||dc==='energy') return '#fbbf24';
      return '#818cf8';
    default:               return '#818cf8';
  }
}

function _haAutoIcon(eid){
  if(!eid) return 'mdi:help-circle-outline';
  const dom=eid.split('.')[0];
  const state=String(hs[eid]||'');
  const attr=ha[eid]||{};
  if(attr.icon) return attr.icon;       // usa l'icona impostata in HA
  const dc=attr.device_class||'';
  const on=state==='on';
  switch(dom){
    case 'light':   return on?'mdi:lightbulb':'mdi:lightbulb-outline';
    case 'switch':  return on?'mdi:toggle-switch':'mdi:toggle-switch-off-outline';
    case 'input_boolean': return on?'mdi:toggle-switch':'mdi:toggle-switch-off-outline';
    case 'fan':     return on?'mdi:fan':'mdi:fan-off';
    case 'lock':    return state==='locked'?'mdi:lock':'mdi:lock-open-outline';
    case 'cover': {
      const cIcons={open:'mdi:window-open',closed:'mdi:window-closed',opening:'mdi:arrow-up-box',closing:'mdi:arrow-down-box'};
      return cIcons[state]||'mdi:window-closed';
    }
    case 'alarm_control_panel':
      if(state==='disarmed') return 'mdi:shield-off-outline';
      if(state==='triggered') return 'mdi:shield-alert';
      if(state==='pending') return 'mdi:shield-outline';
      if(state==='armed_night') return 'mdi:shield-moon';
      if(state==='armed_home') return 'mdi:shield-home';
      if(state==='armed_vacation') return 'mdi:shield-airplane';
      return 'mdi:shield-lock';   // armed_away, armed_custom
    case 'binary_sensor': {
      const bsMap={
        motion:     [on?'mdi:motion-sensor':'mdi:motion-sensor-off'],
        door:       [on?'mdi:door-open':'mdi:door-closed'],
        window:     [on?'mdi:window-open':'mdi:window-closed'],
        opening:    [on?'mdi:open-in-app':'mdi:window-closed'],
        presence:   [on?'mdi:home-account':'mdi:home-outline'],
        occupancy:  [on?'mdi:home-account':'mdi:home-outline'],
        smoke:      [on?'mdi:smoke-detector-alert':'mdi:smoke-detector'],
        carbon_monoxide:[on?'mdi:molecule-co':'mdi:molecule-co'],
        gas:        [on?'mdi:gas-cylinder':'mdi:gas-cylinder'],
        moisture:   [on?'mdi:water-alert':'mdi:water-off'],
        sound:      [on?'mdi:volume-high':'mdi:volume-off'],
        vibration:  [on?'mdi:vibrate':'mdi:vibrate-off'],
        power:      [on?'mdi:power-plug':'mdi:power-plug-off'],
        plug:       [on?'mdi:power-plug':'mdi:power-plug-off'],
        battery:    [on?'mdi:battery-alert':'mdi:battery'],
        battery_charging:[on?'mdi:battery-charging':'mdi:battery'],
        connectivity:[on?'mdi:wifi':'mdi:wifi-off'],
        light:      [on?'mdi:brightness-7':'mdi:brightness-5'],
        lock:       [on?'mdi:lock-open':'mdi:lock'],
        cold:       [on?'mdi:snowflake':'mdi:thermometer'],
        heat:       [on?'mdi:fire':'mdi:thermometer'],
        running:    [on?'mdi:run':'mdi:stop'],
        safety:     [on?'mdi:alert-circle':'mdi:check-circle'],
        tamper:     [on?'mdi:alert-circle':'mdi:check-circle'],
        update:     [on?'mdi:update':'mdi:check-network'],
        problem:    [on?'mdi:alert-circle':'mdi:check-circle'],
      };
      return (bsMap[dc]||[on?'mdi:toggle-switch':'mdi:toggle-switch-off-outline'])[0];
    }
    case 'sensor': {
      const sMap={
        temperature:'mdi:thermometer', humidity:'mdi:water-percent',
        battery:'mdi:battery', power:'mdi:flash', energy:'mdi:flash',
        voltage:'mdi:sine-wave', current:'mdi:current-ac',
        pressure:'mdi:gauge', illuminance:'mdi:brightness-5',
        co2:'mdi:molecule-co2', pm25:'mdi:air-filter', pm10:'mdi:air-filter',
        signal_strength:'mdi:wifi',timestamp:'mdi:clock',
        monetary:'mdi:currency-eur', distance:'mdi:ruler',
        speed:'mdi:speedometer', volume:'mdi:water', weight:'mdi:weight',
        gas:'mdi:gas-cylinder', data_rate:'mdi:upload-network',
      };
      return sMap[dc]||'mdi:gauge';
    }
    case 'climate': return 'mdi:thermostat';
    case 'person': return state==='home'?'mdi:home-account':'mdi:walk';
    case 'device_tracker': return state==='home'?'mdi:home':'mdi:map-marker';
    case 'media_player': return state==='playing'?'mdi:cast-connected':'mdi:cast';
    case 'vacuum':  return state==='cleaning'?'mdi:robot-vacuum':'mdi:robot-vacuum-off';
    case 'camera':  return 'mdi:camera';
    case 'weather': return 'mdi:weather-partly-cloudy';
    case 'sun':     return state==='above_horizon'?'mdi:white-balance-sunny':'mdi:moon-waning-crescent';
    case 'automation': return on?'mdi:robot':'mdi:robot-off';
    case 'script':  return 'mdi:script-text';
    case 'scene':   return 'mdi:palette';
    case 'timer':   return 'mdi:timer';
    case 'counter': return 'mdi:counter';
    case 'input_number':
    case 'number':  return 'mdi:ray-vertex';
    case 'input_select':
    case 'select':  return 'mdi:format-list-bulleted';
    case 'input_text': return 'mdi:form-textbox';
    case 'update':  return on?'mdi:package-up':'mdi:package-check';
    case 'button':  return 'mdi:gesture-tap-button';
    case 'water_heater': return 'mdi:water-boiler';
    case 'humidifier': return on?'mdi:air-humidifier':'mdi:air-humidifier-off';
    default: return 'mdi:help-circle-outline';
  }
}

// toggle intelligente per dominio
function _hbToggle(eid){
  if(!eid) return;
  const dom=eid.split('.')[0];
  const domMap={
    light:'light',switch:'switch',fan:'fan',cover:'cover',
    media_player:'media_player',vacuum:'vacuum',
    lock:'lock',siren:'siren',
  };
  if(domMap[dom]) send({type:'call_service',domain:domMap[dom],service:'toggle',service_data:{entity_id:eid}});
  else send({type:'call_service',domain:'homeassistant',service:'toggle',service_data:{entity_id:eid}});
}

// click smart per dominio — alarm mostra popup, lock togola stato, altri usano _hbToggle
/* Router "auto": sceglie il controllo giusto leggendo il dominio dell'entità.
   Firma (eid, el): il dispatcher chiama window[fn](...args, el, e) con data-action-el. */
function _hbSmartClick(eid, el){
  if(!eid) return;
  const dom=String(eid).split('.')[0];
  const state=String(hs[eid]||'');
  // ── PREMI / ATTIVA (azioni one-shot) ──
  if(dom==='button'||dom==='input_button'){ send({type:'call_service',domain:dom,service:'press',service_data:{entity_id:eid}}); return; }
  if(dom==='scene'){ send({type:'call_service',domain:'scene',service:'turn_on',service_data:{entity_id:eid}}); return; }
  if(dom==='script'){ send({type:'call_service',domain:'script',service:'turn_on',service_data:{entity_id:eid}}); return; }
  // ── CONTROLLI A STATO ──
  if(dom==='alarm_control_panel'){ _hbAlarmPopup(el, eid); return; }
  if(dom==='lock'){ const svc=state==='locked'?'unlock':'lock'; send({type:'call_service',domain:'lock',service:svc,service_data:{entity_id:eid}}); return; }
  if(dom==='cover'){ const svc=(state==='closed'||state==='closing')?'open_cover':'close_cover'; send({type:'call_service',domain:'cover',service:svc,service_data:{entity_id:eid}}); return; }
  // ── ACCENDI / SPEGNI (toggle) ──
  const toggleable=['light','switch','input_boolean','fan','siren','humidifier','remote','automation','group'];
  if(toggleable.includes(dom)){ _hbToggle(eid); return; }
  // ── RESTO (sensor, binary_sensor, climate, media_player, vacuum, weather, person, number, select…) → INFO ──
  try{ openIM(eid); }catch(e){}
}

// popup modale allarme con opzioni inserimento/disinserimento
function _hbAlarmPopup(el, eid){
  document.getElementById('_hb_opt_pop')?.remove();
  const curState=String(hs[eid]||'unknown');
  const stateLabel=_stateIt(curState);
  // colore stato: disinserito=rosso (non protetto), inserito=verde, notte=viola
  const stColor=_haAutoColor(eid);
  const alarmOpts=[
    {label:'Disinserisci',        icon:'mdi:shield-off-outline',     service:'alarm_disarm',       color:'#ef4444'},
    {label:'Inserisci — Casa',    icon:'mdi:shield-home',            service:'alarm_arm_home',      color:'#22c55e'},
    {label:'Inserisci — Notte',   icon:'mdi:shield-moon',            service:'alarm_arm_night',     color:'#a78bfa'},
    {label:'Inserisci — Assenza', icon:'mdi:shield-lock',            service:'alarm_arm_away',      color:'#22c55e'},
    {label:'Inserisci — Vacanza', icon:'mdi:shield-airplane',        service:'alarm_arm_vacation',  color:'#22d3ee'},
  ];
  const pop=document.createElement('div');
  pop.id='_hb_opt_pop';
  pop.style.cssText='position:fixed;z-index:15000;background:#0c0e1c;border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:8px;box-shadow:0 12px 40px rgba(0,0,0,.8);display:flex;flex-direction:column;gap:4px;min-width:180px';
  // header con stato attuale
  const hdr=document.createElement('div');
  hdr.style.cssText=`display:flex;align-items:center;gap:7px;padding:6px 8px 8px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:2px`;
  hdr.innerHTML=`${_renderIcon('mdi:shield-outline',16,stColor)}<span style="font-size:10px;font-weight:700;color:${stColor}">${stateLabel}</span>`;
  pop.appendChild(hdr);
  alarmOpts.forEach(o=>{
    const btn=document.createElement('button');
    btn.style.cssText=`display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;background:transparent;border:none;color:#fff;font-size:11px;font-weight:600;cursor:pointer;text-align:left;transition:background .12s`;
    btn.onmouseenter=()=>btn.style.background='rgba(255,255,255,.07)';
    btn.onmouseleave=()=>btn.style.background='transparent';
    btn.innerHTML=`${_renderIcon(o.icon,14,o.color)}<span style="color:${o.color}">${o.label}</span>`;
    btn.onclick=()=>{
      send({type:'call_service',domain:'alarm_control_panel',service:o.service,service_data:{entity_id:eid}});
      pop.remove();
    };
    pop.appendChild(btn);
  });
  const closeBtn=document.createElement('button');
  closeBtn.style.cssText='padding:5px 10px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);font-size:10px;font-weight:700;cursor:pointer;margin-top:3px';
  closeBtn.textContent='✕ Annulla';
  closeBtn.onclick=()=>pop.remove();
  pop.appendChild(closeBtn);
  // posizionamento popup
  const rect=el.getBoundingClientRect();
  const left=Math.min(rect.left, window.innerWidth-200);
  const top=rect.bottom+6;
  pop.style.left=left+'px';
  pop.style.top=(top+window.scrollY)+'px';
  document.body.appendChild(pop);
  setTimeout(()=>document.addEventListener('click',()=>pop.remove(),{once:true}),50);
}

/* ── iconMap + colorMap helpers ── */
let _hbIconMap={};
let _hbColorMap={};
let _hbOptions=[];

// preset colori per colorMap (stato → colore)
const _HB_CMAP_PRESETS=['#4ade80','#f87171','#facc15','#818cf8','#22d3ee','#fb923c','#e879f9','#94a3b8','#ffffff'];

function hbAddColorMap(){
  const stEl=document.getElementById('hbf-cmap-state');
  const coEl=document.getElementById('hbf-cmap-color');
  const pickEl=document.getElementById('hbf-cmap-color-pick');
  if(!stEl) return;
  const st=stEl.value.trim();
  if(!st){ stEl.style.borderColor='#f87171'; setTimeout(()=>stEl.style.borderColor='',1500); return; }
  const co=(coEl?.value||'').trim()||pickEl?.value||'#4ade80';
  _hbColorMap[st]=co;
  stEl.value=''; if(coEl) coEl.value='';
  _hbRenderColorMap(); _hbUpdatePreview();
}
function hbAddColorMapEntry(){ hbAddColorMap(); }

/* ── Icon picker per il form chip ── */
function _hbEntityChanged(val){
  hbAutoFill();
  _hbRefreshIconPrev();
  _hbUpdatePreview();
}
function _hbBrowseEntity(e, btn){
  _epPickerOpen(v=>{
    const el=document.getElementById('hbf-entity'); if(el){ el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); }
    hbAutoFill(); _hbRefreshIconPrev(); _hbUpdatePreview();
  });
}
function _hbSetIcon(v){
  const el=document.getElementById('hbf-icon'); if(el) el.value=v;
  _hbRefreshIconPrev();
  _hbUpdatePreview();
}
function _hbPickChipIcon(e, btn){
  openIconPicker(v=>{ _hbSetIcon(v); }, btn, e);
}
function _hbPickChipIcon2(e, btn){
  openIconPicker(v=>{
    const el=document.getElementById('hbf-icon2'); if(el) el.value=v;
    _hbRefreshIcon2Prev();
    _hbUpdatePreview();
  }, btn, e);
}
function _hbPickImapIcon(e, btn){
  openIconPicker(v=>{
    const el=document.getElementById('hbf-imap-icon'); if(el) el.value=v;
    const prev=document.getElementById('hbf-imap-icon-prev');
    if(prev) prev.innerHTML=_renderIcon(v,14,'#a5b4fc')||v;
  }, btn, e);
}
function _hbIconInput(v){ _hbRefreshIconPrev(); _hbUpdatePreview(); }
function _hbIcon2Input(v){ _hbRefreshIcon2Prev(); _hbUpdatePreview(); }
function _hbResetIcon(){
  const el=document.getElementById('hbf-icon'); if(el) el.value='';
  const col=document.getElementById('hbf-icon-color'); if(col) col.value='#ffffff';
  _hbRefreshIconPrev(); _hbUpdatePreview();
}
function _hbRefreshIconPrev(){
  const iconEl=document.getElementById('hbf-icon');
  const prev=document.getElementById('hbf-icon-prev');
  if(!prev) return;
  const icon=(iconEl?.value||'').trim();
  const col=document.getElementById('hbf-icon-color')?.value||'#ffffff';
  const entity=document.getElementById('hbf-entity')?.value?.trim()||'';
  const autoIcon=entity?_haAutoIcon(entity):'';
  const displayIcon=icon||autoIcon||'';
  prev.innerHTML=displayIcon?_renderIcon(displayIcon,14,col):'?';
  prev.title=displayIcon||'Clicca per scegliere icona';
}
function _hbRefreshIcon2Prev(){
  const ico=document.getElementById('hbf-icon2')?.value?.trim()||'';
  const prev=document.getElementById('hbf-icon2-prev');
  if(prev) prev.innerHTML=ico?_renderIcon(ico,12,'#94a3b8'):'?';
}

/* ── SOS: mostra persone configurabili nel chip ──
   Usa la whitelist cfg.sos.persons: se vuota = mostra tutte.
   Nascondere una persona = rimuoverla dalla whitelist (dopo aver inizializzato la lista con tutti tranne quella).
── */
function _hbRenderSosPersons(){
  const el=document.getElementById('hbf-sos-persons'); if(!el) return;
  const allPersons=Object.keys(ha||{}).filter(e=>e.startsWith('person.'));
  if(!allPersons.length){ el.innerHTML='<div style="font-size:10px;color:var(--muted)">Nessuna persona trovata in HA</div>'; return; }
  const sc=_sosCfg();
  // Se whitelist vuota, tutti visibili
  const visibles=sc.persons&&sc.persons.length?sc.persons:allPersons.slice();
  el.innerHTML='';
  allPersons.forEach(p=>{
    const nm=(ha[p]?.friendly_name)||p.split('.')[1];
    const isVisible=visibles.includes(p);
    const lbl=document.createElement('label');
    lbl.style.cssText='font-size:11px;display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 0';
    lbl.innerHTML=`<input type="checkbox" ${isVisible?'checked':''}> <span>${eh(nm)}</span> <span style="font-size:9px;color:var(--muted)">${p}</span>`;
    lbl.querySelector('input').addEventListener('change',e=>{
      // Inizializza whitelist con tutti se era vuota
      if(!sc.persons||!sc.persons.length) sc.persons=allPersons.slice();
      if(e.target.checked){ if(!sc.persons.includes(p)) sc.persons.push(p); }
      else { sc.persons=sc.persons.filter(x=>x!==p); }
      saveCfg();
    });
    el.appendChild(lbl);
  });
}

function openSOSCfgModal(){ closeHBM(); setTimeout(()=>{ try{ openOikSettings(); const btn=document.getElementById('ep-sos-btn'); if(btn) btn.click(); }catch(e){} },100); }

/* ── Entità secondaria: toggle e posizione ── */
function _hbSelEnt2Pos(pos){
  ['left','right'].forEach(x=>document.getElementById('hbent2-'+x)?.classList.toggle('on',x===pos));
  _hbUpdatePreview();
}
function _hbGetEnt2Pos(){ return ['left','right'].find(x=>document.getElementById('hbent2-'+x)?.classList.contains('on'))||'right'; }

/* ── Reset colore → auto ── */
function _hbResetColor(field){
  const map={bg:'hbf-bg-custom', border:'hbf-border-color', text:'hbf-text-custom'};
  const el=document.getElementById(map[field]); if(el) el.value='';
  _hbUpdatePreview();
}

/* ── Render singolo chip (visivo, uguale a hbarInner) ── */
function _hbRenderOneChip(item){
  try{
    const tmp=document.createElement('div');
    tmp.innerHTML=hbarInner({left:[item],center:[],right:[]});
    const chip=tmp.querySelector('.hbar-chip,.hbar-clk,.hbar-sep');
    return chip?chip.outerHTML:_hbChipPreview(item);
  }catch(e){ return _hbChipPreview(item); }
}

/* ── Store browser nel form: fetcha card-chips e card-distintivi da GitHub ── */
let _hbStoreTab='chips'; // 'chips' | 'distintivi'

function _hbRenderStoreList(){
  const row=document.getElementById('hbf-store-row'); if(!row) return;
  // Costruisci UI tab se non esiste
  if(!row.querySelector('.hbstore-tabs')){
    const tabs=document.createElement('div'); tabs.className='hbstore-tabs';
    tabs.style.cssText='display:flex;gap:4px;margin-bottom:8px';
    ['chips','distintivi'].forEach(t=>{
      const b=document.createElement('button');
      b.className='sect-size-btn'+(t===_hbStoreTab?' on':'');
      b.style.cssText='flex:1;font-size:10px;padding:7px';
      b.textContent=t==='chips'?'🔹 Chip':'🏷️ Distintivi';
      b.addEventListener('click',()=>{ _hbStoreTab=t; row.querySelectorAll('.hbstore-tabs .sect-size-btn').forEach(x=>x.classList.remove('on')); b.classList.add('on'); _hbFetchStoreTab(); });
      tabs.appendChild(b);
    });
    const list=document.getElementById('hbf-store-list');
    row.insertBefore(tabs, list);
  }
  _hbFetchStoreTab();
}

async function _hbFetchStoreTab(){
  const list=document.getElementById('hbf-store-list');
  const empty=document.getElementById('hbf-store-empty');
  if(!list) return;
  list.innerHTML='<div style="font-size:10px;color:var(--muted);padding:8px 0;text-align:center">Carico…</div>';
  if(empty) empty.style.display='none';
  try{
    const folderKey=_hbStoreTab==='chips'?'chips':'distintivi';
    const folder=_GHS_FOLDERS[folderKey];
    const files=await _ghListFolder(folder.path);
    list.innerHTML='';
    if(!files.length){ list.innerHTML='<div style="font-size:10px;color:var(--muted);padding:8px 0;text-align:center">Nessuna card trovata</div>'; return; }
    // Mostra installate + store
    const installed=new Map(_jsStoreList().map(c=>[c.meta?.id,c]));
    files.forEach(f=>{
      const name=f.name.replace(/\.js$/i,'');
      const isInst=installed.has(name);
      const meta=installed.get(name)?.meta||{};
      const row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--panel2);border:1px solid '+(isInst?'rgba(74,222,128,.3)':'var(--bd)')+';cursor:pointer;transition:border-color .15s;margin-bottom:4px';
      row.innerHTML=`<span style="font-size:15px">${meta.icon||(_hbStoreTab==='chips'?'🔹':'🏷️')}</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${eh(meta.name||name)}</div><div style="font-size:9px;color:var(--muted)">${name}</div></div>${isInst?'<span style="font-size:9px;color:#4ade80;font-weight:700">✓</span>':'<span style="font-size:9px;color:var(--muted)">Non installata</span>'}`;
      row.addEventListener('mouseenter',()=>{ if(!row._sel) row.style.borderColor='rgba(99,102,241,.5)'; });
      row.addEventListener('mouseleave',()=>{ if(!row._sel) row.style.borderColor=isInst?'rgba(74,222,128,.3)':'var(--bd)'; });
      row.addEventListener('click',async ()=>{
        document.querySelectorAll('#hbf-store-list > div').forEach(r=>{ r._sel=false; r.style.background='var(--panel2)'; });
        row._sel=true; row.style.background='rgba(99,102,241,.15)'; row.style.borderColor='rgba(99,102,241,.5)';
        // Se non installata, installa prima
        let cardId=name; let cardIcon=meta.icon||(_hbStoreTab==='chips'?'🔹':'🏷️'); let cardName=meta.name||name;
        if(!isInst){
          row.lastElementChild.textContent='⬇️…';
          try{
            const card=await _ghInstallFile(f);
            if(card){ cardId=card.id||name; cardIcon=card.icon||cardIcon; cardName=card.name||cardName; }
            row.lastElementChild.textContent='✓'; row.lastElementChild.style.color='#4ade80';
          }catch(e){ row.lastElementChild.textContent='❌'; return; }
        }
        let sel=document.getElementById('hbf-store-selected');
        if(!sel){ sel=document.createElement('input'); sel.type='hidden'; sel.id='hbf-store-selected'; list.parentElement.appendChild(sel); }
        sel.value=cardId; sel.dataset.name=cardName; sel.dataset.icon=cardIcon;
        _hbUpdatePreview();
      });
      list.appendChild(row);
    });
  }catch(e){
    list.innerHTML=`<div style="font-size:10px;color:#f87171;padding:8px 0">Errore: ${eh(e.message||String(e))}<br><span style="opacity:.6">Configura GitHub nelle impostazioni</span></div>`;
  }
}
function _hbRenderColorMap(){
  const el=document.getElementById('hbf-cmap-list'); if(!el) return;
  const entries=Object.entries(_hbColorMap);
  if(!entries.length){ el.innerHTML=`<div style="font-size:9px;opacity:.35;padding:2px 0">Nessun colore dinamico</div>`; return; }
  el.innerHTML=entries.map(([st,co])=>`<div class="hb-row" style="padding:3px 6px">
    <div style="width:12px;height:12px;border-radius:3px;background:${co};flex-shrink:0;border:1px solid rgba(255,255,255,.2)"></div>
    <span style="font-size:9px;flex:1">${eh(st)} → <span style="color:${co};font-weight:700">${co}</span></span>
    <button class="sbrow-btn sbrow-del" data-action="_hbDelColorMapEntry" data-action-arg="${st}">✕</button>
  </div>`).join('');
}
function _hbRenderColorMapSwatches(){
  const el=document.getElementById('hbf-cmap-swatches'); if(!el) return;
  el.innerHTML=_HB_CMAP_PRESETS.map(c=>`<div style="width:18px;height:18px;border-radius:4px;background:${c};cursor:pointer;border:2px solid transparent;transition:border-color .1s" data-action="_hbPickCmapColor" data-action-arg="${c}" title="${c}"></div>`).join('');
}
function _hbPickCmapColor(c){
  const el=document.getElementById('hbf-cmap-color'); if(el) el.value=c;
  const pr=document.getElementById('hbf-cmap-preview'); if(pr) pr.style.background=c;
}
// aggiorna preview colore mentre si digita
function _hbCmapColorInput(){
  const v=document.getElementById('hbf-cmap-color')?.value||'';
  const pr=document.getElementById('hbf-cmap-preview'); if(pr) pr.style.background=v;
}

function hbAddIconMap(){
  const stEl=document.getElementById('hbf-imap-state');
  const icEl=document.getElementById('hbf-imap-icon');
  if(!stEl) return;
  const st=stEl.value.trim();
  if(!st){ stEl.style.borderColor='#f87171'; setTimeout(()=>stEl.style.borderColor='',1500); return; }
  const ic=icEl?.value?.trim()||'';
  const col=document.getElementById('hbf-imap-color')?.value||'#ffffff';
  if(!ic){ document.getElementById('hbf-imap-icon-prev')?.animate([{transform:'scale(1)'},{transform:'scale(1.2)'},{transform:'scale(1)'}],200); return; }
  // Salva come {icon, color} se c'è un colore personalizzato
  _hbIconMap[st]=col&&col!=='#ffffff'?{icon:ic,color:col}:ic;
  stEl.value=''; if(icEl) icEl.value='';
  const prev=document.getElementById('hbf-imap-icon-prev'); if(prev) prev.innerHTML='?';
  _hbRenderIconMap(); _hbUpdatePreview();
}
function _hbRenderIconMap(){
  const el=document.getElementById('hbf-imap-list'); if(!el) return;
  const entries=Object.entries(_hbIconMap);
  if(!entries.length){ el.innerHTML='<div style="font-size:9px;opacity:.3;padding:2px 0">Nessuna regola</div>'; return; }
  el.innerHTML=entries.map(([st,val])=>{
    const ic=typeof val==='object'?val.icon:val;
    const col=typeof val==='object'?val.color:'#818cf8';
    return `<div class="hb-row" style="padding:4px 8px;gap:6px">
      <div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);border-radius:5px">${_renderIcon(ic,13,col)}</div>
      <span style="font-size:10px;flex:1;color:rgba(255,255,255,.7)"><span style="color:#a5b4fc;font-weight:700">${eh(st)}</span> → ${ic}</span>
      <button class="hbc-btn" data-action="_hbDelIconMapEntry" data-action-arg="${st}" title="Elimina">✕</button>
    </div>`;
  }).join('');
}

function hbAddOption(){
  const lbl=document.getElementById('hbf-opt-lbl').value.trim();
  const ic=document.getElementById('hbf-opt-icon').value.trim();
  const dom=document.getElementById('hbf-opt-dom').value.trim();
  const svc=document.getElementById('hbf-opt-svc').value.trim();
  if(!lbl) return;
  _hbOptions.push({label:lbl,icon:ic,tapDomain:dom,tapService:svc});
  document.getElementById('hbf-opt-lbl').value='';
  document.getElementById('hbf-opt-icon').value='';
  document.getElementById('hbf-opt-dom').value='';
  document.getElementById('hbf-opt-svc').value='';
  _hbRenderOptions();
}
function _hbRenderOptions(){
  const el=document.getElementById('hbf-opts-list'); if(!el) return;
  if(!_hbOptions.length){ el.innerHTML=`<div style="font-size:9px;opacity:.35;padding:2px 0">Nessuna opzione</div>`; return; }
  el.innerHTML=_hbOptions.map((o,i)=>`<div class="hb-row" style="padding:3px 6px">
    <span style="font-size:9px;flex:1">${o.icon?_renderIcon(o.icon,10,'#818cf8'):''} ${eh(o.label)} → ${o.tapDomain||''}.${o.tapService||''}</span>
    <button class="sbrow-btn sbrow-del" data-action="_hbDelOption" data-action-args='[${i}]'>✕</button>
  </div>`).join('');
}

/* popup opzioni al click su chip */
/* Wrapper per il dispatcher data-action (riceve args poi (el,e) grazie a data-action-el="true") */
function _hbOptionsPopupEl(options, el){ _hbOptionsPopup(el, options); }
function _hbOptionsPopup(el, options){
  // Rimuovi popup esistente
  document.getElementById('_hb_opt_pop')?.remove();
  if(!options||!options.length) return;
  const pop=document.createElement('div');
  pop.id='_hb_opt_pop';
  pop.style.cssText='position:fixed;z-index:15000;background:#12152a;border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:6px;box-shadow:0 8px 30px rgba(0,0,0,.7);display:flex;flex-direction:column;gap:3px;min-width:150px';
  options.forEach(o=>{
    const btn=document.createElement('button');
    btn.style.cssText='display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;background:transparent;border:none;color:#fff;font-size:11px;font-weight:600;cursor:pointer;text-align:left;transition:background .1s';
    btn.onmouseenter=()=>btn.style.background='rgba(255,255,255,.08)';
    btn.onmouseleave=()=>btn.style.background='transparent';
    btn.innerHTML=(o.icon?`${_renderIcon(o.icon,12,'#818cf8')} `:'')+(o.label||'');
    btn.onclick=()=>{
      if(o.tapDomain&&o.tapService){
        const sd=o.entity_id?{entity_id:o.entity_id}:{};
        send({type:'call_service',domain:o.tapDomain,service:o.tapService,service_data:sd});
      }
      pop.remove();
    };
    pop.appendChild(btn);
  });
  const closeBtn=document.createElement('button');
  closeBtn.textContent='✕ Chiudi';
  closeBtn.style.cssText='padding:5px 10px;border-radius:8px;background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.3);color:#f87171;font-size:10px;font-weight:700;cursor:pointer;margin-top:2px';
  closeBtn.onclick=()=>pop.remove();
  pop.appendChild(closeBtn);
  const rect=el.getBoundingClientRect();
  pop.style.left=Math.min(rect.left,window.innerWidth-160)+'px';
  pop.style.top=(rect.bottom+5)+'px';
  document.body.appendChild(pop);
  setTimeout(()=>document.addEventListener('click',()=>pop.remove(),{once:true}),50);
}

function _hbRenderColorPickers(){
  const bgEl=document.getElementById('hbf-bg-colors');
  const txtEl=document.getElementById('hbf-text-colors');
  if(bgEl) bgEl.innerHTML=_HB_BG_PRESETS.map(c=>`<div class="csw${c===_hbBg?' on':''}" style="background:${c}" data-action="_hbSelBg" data-action-arg="${c}"></div>`).join('');
  if(txtEl) txtEl.innerHTML=_HB_TXT_PRESETS.map(c=>`<div class="csw${c===_hbTxt?' on':''}" style="background:${c}" data-action="_hbSelTxt" data-action-arg="${c}"></div>`).join('');
}
function _hbSelBg(c){ _hbBg=c; document.getElementById('hbf-bg-custom').value=c; _hbRenderColorPickers(); }
function _hbSelTxt(c){ _hbTxt=c; const el=document.getElementById('hbf-text-custom'); if(el) el.value=c; _hbRenderColorPickers(); }

function hbSaveChip(){
  const t=['entity','text','clock','sep','sos','kiosk','conn','store'].find(x=>document.getElementById('hbft-'+x)?.classList.contains('on'))||'entity';
  // Tipo store: salva la card selezionata
  if(t==='store'){
    const sel=document.getElementById('hbf-store-selected');
    if(!sel?.value){ showToast('Seleziona una card dallo store'); return; }
    const item={id:(_hbEditIdx>=0?_hbChips[_hbEditZone][_hbEditIdx]?.id:null)||uid(), type:'store', cardId:sel.value, label:sel.dataset.name||sel.value, icon:sel.dataset.icon||'📦', hidden:false};
    if(_hbEditIdx>=0) _hbChips[_hbEditZone][_hbEditIdx]=item;
    else _hbChips[_hbEditZone].push(item);
    hbRenderAllLists(); hbCancelChip(); return;
  }
  const bg=document.getElementById('hbf-bg-custom').value||_hbBg;
  const col=document.getElementById('hbf-text-custom')?.value||_hbTxt;
  const item={
    id:(_hbEditIdx>=0?_hbChips[_hbEditZone][_hbEditIdx]?.id:null)||uid(),
    type:t,
    entity:document.getElementById('hbf-entity').value.trim(),
    text:document.getElementById('hbf-text').value.trim(),
    icon:document.getElementById('hbf-icon').value.trim(),
    iconColor:document.getElementById('hbf-icon-color')?.value||'',
    label:document.getElementById('hbf-label').value.trim(),
    bg, color:col, borderColor:document.getElementById('hbf-border-color')?.value.trim()||'',
    entity2: document.getElementById('hbf-entity2-on')?.checked ? (document.getElementById('hbf-entity2')?.value.trim()||'') : '',
    entity2pos: _hbGetEnt2Pos(),
    entity2icon: document.getElementById('hbf-icon2')?.value.trim()||'',
    entity2showUnit: document.getElementById('hbf-entity2-showunit')?.checked!==false,
    showState:document.getElementById('hbf-showstate').checked,
    showUnit:document.getElementById('hbf-showunit').checked,
    shape:_hbGetShape(),
    size:_hbGetSize(),
    clickAction:_hbGetClickAct(),
    navPage:parseInt(document.getElementById('hbf-navpage')?.value||0),
    tapDomain:document.getElementById('hbf-tapdom').value.trim(),
    tapService:document.getElementById('hbf-tapsvc').value.trim(),
    tapEntity:document.getElementById('hbf-tapent').value.trim(),
    iconMap:{..._hbIconMap},
    colorMap:{..._hbColorMap},
    options:[..._hbOptions],
    // clock-specific
    clockStyle:_hbGetClockStyle(),
    clockFormat:_hbGetClockFormat(),
    clockSizeName:_hbGetClockSizeName(),
    clockShowDate:document.getElementById('hbclk-showdate')?.checked!==false,
    clockShowSeconds:document.getElementById('hbclk-showsec')?.checked===true,
    clockColor:document.getElementById('hbclk-color')?.value||'#ffffff',
  };
  // preserva il flag hidden se stiamo modificando un chip esistente
  if(_hbEditIdx>=0){
    item.hidden = _hbChips[_hbEditZone][_hbEditIdx]?.hidden || false;
    _hbChips[_hbEditZone][_hbEditIdx]=item;
    _hbEditIdx=_hbChips[_hbEditZone].indexOf(item); // aggiorna idx
  } else {
    _hbChips[_hbEditZone].push(item);
    _hbEditIdx=_hbChips[_hbEditZone].length-1;
  }
  hbRenderAllLists();
  // Non chiude il form — mostra feedback
  const btn=document.getElementById('hbf-save-btn');
  if(btn){ const orig=btn.textContent; btn.textContent='✓ Aggiornato'; btn.disabled=true; setTimeout(()=>{ btn.textContent=orig; btn.disabled=false; },1200); }
  _hbUpdatePreview();
}
function hbCancelChip(){ document.getElementById('hb-chip-form').style.display='none'; _hbEditZone=null; _hbEditIdx=-1; }

/* ── Anteprima live chip nel form — usa lo stesso render di hbarInner ── */
function _hbUpdatePreview(){
  const box=document.getElementById('hb-chip-preview-box'); if(!box) return;
  const t=['entity','clock','sos'].find(x=>document.getElementById('hbft-'+x)?.classList.contains('on'))||'entity';
  const fakeItem={
    type:t,
    bg:document.getElementById('hbf-bg-custom')?.value||'',
    color:document.getElementById('hbf-text-custom')?.value||'#ffffff',
    borderColor:document.getElementById('hbf-border-color')?.value||'',
    icon:document.getElementById('hbf-icon')?.value||'',
    iconColor:document.getElementById('hbf-icon-color')?.value||'',
    label:document.getElementById('hbf-label')?.value||'',
    entity:document.getElementById('hbf-entity')?.value?.trim()||'',
    shape:_hbGetShape(), size:_hbGetSize(),
    showState:document.getElementById('hbf-showstate')?.checked!==false,
    showUnit:document.getElementById('hbf-showunit')?.checked!==false,
    clockStyle:_hbGetClockStyle(), clockFormat:_hbGetClockFormat(),
    clockSizeName:_hbGetClockSizeName(),
    clockShowDate:document.getElementById('hbclk-showdate')?.checked!==false,
    clockShowSeconds:document.getElementById('hbclk-showsec')?.checked===true,
    clockColor:document.getElementById('hbclk-color')?.value||'#ffffff',
    iconMap:{}, colorMap:{}, options:[],
    entity2: (document.getElementById('hbf-entity2-on')?.checked && document.getElementById('hbf-entity2')?.value?.trim()) || '',
    entity2pos: _hbGetEnt2Pos(),
    entity2icon: document.getElementById('hbf-icon2')?.value?.trim()||'',
    entity2showUnit: document.getElementById('hbf-entity2-showunit')?.checked!==false,
  };
  // Usa hbarInner su un oggetto finto con solo questo chip nella sinistra
  const fakeCard={left:[fakeItem],center:[],right:[]};
  const html=hbarInner(fakeCard);
  // Estrae solo la parte sinistra (il chip) dal risultato
  const tmp=document.createElement('div'); tmp.innerHTML=html;
  const chipEl=tmp.querySelector('.hbar-chip,.hbar-clk,.hbar-sep,.hbar-chip.sos');
  box.innerHTML=chipEl?chipEl.outerHTML:'<span style="font-size:10px;opacity:.35">Configura i campi per vedere l\'anteprima</span>';
}

/* ── Sync color pickers (picker↔text input) ── */
function _hbInitColorPickers(){
  // Sync colore icona → preview
  document.getElementById('hbf-icon-color')?.addEventListener('input', ()=>{ _hbRefreshIconPrev(); _hbUpdatePreview(); });
  // Sync color picker stato
  const cmapPick=document.getElementById('hbf-cmap-color-pick');
  const cmapTxt=document.getElementById('hbf-cmap-color');
  if(cmapPick&&cmapTxt){
    cmapPick.addEventListener('input',()=>{ cmapTxt.value=cmapPick.value; });
    cmapTxt.addEventListener('input',()=>{ if(/^#[0-9a-fA-F]{6}$/.test(cmapTxt.value)) cmapPick.value=cmapTxt.value; });
  }
  [['hbf-col-bg-pick','hbf-bg-custom'],['hbf-col-border-pick','hbf-border-color'],['hbf-col-text-pick','hbf-text-custom']].forEach(([pickId,txtId])=>{
    const pick=document.getElementById(pickId);
    const txt=document.getElementById(txtId);
    if(!pick||!txt) return;
    pick.addEventListener('input',()=>{ txt.value=pick.value; _hbUpdatePreview(); });
    txt.addEventListener('input',()=>{ if(/^#[0-9a-fA-F]{6}$/.test(txt.value)) pick.value=txt.value; _hbUpdatePreview(); });
  });
  // Tutti i campi che cambiano l'anteprima
  ['hbf-entity','hbf-label','hbf-icon','hbf-text','hbclk-color'].forEach(id=>{
    document.getElementById(id)?.addEventListener('input', _hbUpdatePreview);
  });
  ['hbf-showstate','hbf-showunit','hbclk-showdate','hbclk-showsec'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change', _hbUpdatePreview);
  });
}

function appChipPopup(cardId, gIdx, evt){
  evt.stopPropagation();
  const pop=document.getElementById('app-chip-pop');
  /* toggle: riclicca lo stesso chip → chiude */
  if(pop.classList.contains('show')&&pop._cid===cardId&&pop._gi===gIdx){
    pop.classList.remove('show'); pop._cid=null; pop._gi=null; return;
  }
  pop._cid=cardId; pop._gi=gIdx;
  pop.innerHTML=_chipPopHtml(cardId, gIdx);
  pop.classList.add('show');
  const br=evt.currentTarget.getBoundingClientRect();
  const pw=pop.offsetWidth, ph=pop.offsetHeight;
  let left=br.left, top=br.bottom+6;
  if(left+pw>window.innerWidth-8) left=window.innerWidth-pw-8;
  if(top+ph>window.innerHeight-8) top=br.top-ph-6;
  pop.style.left=Math.max(6,left)+'px';
  pop.style.top=Math.max(6,top)+'px';
}

/* chiudi picker/popup cliccando altrove — azzera sempre _cid/_gi */
document.addEventListener('click',e=>{
  ['app-emoji-pop','app-color-pop','font-pop'].forEach(id=>{
    const el=document.getElementById(id);
    if(el&&el.classList.contains('show')&&!el.contains(e.target)) el.classList.remove('show');
  });
  const cp=document.getElementById('app-chip-pop');
  if(cp&&cp.classList.contains('show')&&!cp.contains(e.target)){
    cp.classList.remove('show'); cp._cid=null; cp._gi=null;
  }
});

/* ═══ APPLIANCES EDITOR HELPERS ═══ */
let _appItems=[];
let _appGroups=[];

function renderAppItems(){
  const list=document.getElementById('cm-items-list'); if(!list) return;
  if(!_appItems.length){
    list.innerHTML=`<div style="font-size:10px;opacity:.35;padding:6px 2px">Nessun elemento. Clicca "+ Aggiungi".</div>`;
    return;
  }
  list.innerHTML=_appItems.map((item,i)=>{
    const effColor=item.color||APP_PALETTE[i%APP_PALETTE.length];
    return `<div class="app-ed-row">
      <div style="display:flex;gap:4px;align-items:center">
        <input class="finp" id="app-ent-${i}" style="flex:1;font-size:10px" value="${item.entity||''}" placeholder="sensor.xxx_power" data-input="_appSetItemEntity" data-input-args='[${i}]'>
        <button class="fbtn" data-action="browseField" data-action-arg="app-ent-${i}">🔍</button>
        <button class="fbtn" id="app-ico-btn-${i}" title="Scegli icona"
          style="font-size:16px;width:30px;min-width:30px;padding:2px"
          data-action="_appItemPickIcon" data-action-args='[${i}]' data-action-el="true">${_renderIcon(item.icon||'⚡',16)}</button>
        <button class="fbtn" id="app-col-btn-${i}" title="Scegli colore"
          style="width:20px;min-width:20px;height:20px;border-radius:50%;background:${effColor};border:2px solid rgba(255,255,255,0.25);padding:0"
          data-action="_appItemPickColor" data-action-args='["${effColor}",${i}]' data-action-el="true"></button>
        <button class="fbtn" data-action="_appDelItem" data-action-args='[${i}]' style="color:#f87171;padding:0 7px">✕</button>
      </div>
      <input class="finp" style="margin-top:4px;font-size:10px" value="${item.name||''}" placeholder="Nome visualizzato (es. Pompa Calore)" data-input="_appSetItemName" data-input-args='[${i}]'>
    </div>`;
  }).join('');
}

function appAddRow(){
  _appItems.push({entity:'',name:'',icon:'⚡',color:''});
  renderAppItems();
  setTimeout(()=>{ const el=document.getElementById('app-ent-'+(_appItems.length-1)); if(el) el.focus(); },50);
}

function renderAppGroups(){
  const list=document.getElementById('cm-groups-list'); if(!list) return;
  if(!_appGroups.length){
    list.innerHTML=`<div style="font-size:10px;opacity:.35;padding:6px 2px">Nessun gruppo. Clicca "+ Gruppo".</div>`;
    return;
  }
  list.innerHTML=_appGroups.map((g,i)=>{
    const gc=g.color||'#818cf8';
    return `<div class="app-grp-row">
      <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
        <button class="fbtn" title="Scegli colore"
          style="width:20px;min-width:20px;height:20px;border-radius:50%;background:${gc};border:2px solid rgba(255,255,255,0.25);padding:0;flex-shrink:0"
          data-action="_appGroupPickColor" data-action-args='["${gc}",${i}]' data-action-el="true"></button>
        <input class="finp" style="flex:1;font-size:10px" value="${g.name||''}" placeholder="Nome gruppo (es. luci)" data-input="_appSetGroupName" data-input-args='[${i}]'>
        <label style="display:flex;align-items:center;gap:3px;font-size:9px;opacity:.7;white-space:nowrap;cursor:pointer" title="Mostra ogni entità del gruppo nella lista sotto, con il suo stato">
          <input type="checkbox" ${g.showList?'checked':''} data-input="_appSetGroupShowList" data-input-args='[${i}]'> lista
        </label>
        <button class="fbtn" data-action="_appDelGroup" data-action-args='[${i}]' style="color:#f87171;padding:0 7px">✕</button>
      </div>
      <textarea class="finp" rows="2" style="font-size:9px;font-family:monospace;resize:vertical" placeholder="Un'entità per riga (light.xxx, cover.yyy, climate.zzz...)" data-input="_appSetGroupEntities" data-input-args='[${i}]'>${(g.entities||[]).join('\n')}</textarea>
    </div>`;
  }).join('');
}

function appGroupAdd(){
  const defaults=[
    {name:'luci',color:'#fbbf24',showList:false},{name:'elettrodomestici',color:'#f97316',showList:false},
    {name:'climatizzatori',color:'#60a5fa',showList:true},{name:'tapparelle',color:'#818cf8',showList:true},{name:'porte',color:'#4ade80',showList:true}
  ];
  const used=_appGroups.map(g=>g.name);
  const next=defaults.find(d=>!used.includes(d.name))||{name:'',color:'#818cf8',showList:false};
  _appGroups.push({name:next.name,color:next.color,entities:[],showList:next.showList});
  renderAppGroups();
}

/* ═══ CARD CLIPBOARD ═══ */
let _cardClipboard=null;
function _clipboardLoad(){
  try{ const s=localStorage.getItem('hadb_clip'); if(s) _cardClipboard=JSON.parse(s); }catch(e){}
}
function _clipboardSave(card){
  const tpl=JSON.parse(JSON.stringify(card));
  delete tpl.id;
  _cardClipboard=tpl;
  try{ localStorage.setItem('hadb_clip',JSON.stringify(tpl)); }catch(e){}
  _updatePasteBtn();
}
function _updatePasteBtn(){
  const btn=document.getElementById('ep-btn-paste');
  const clr=document.getElementById('ep-btn-paste-clr');
  if(!btn) return;
  const label=_cardClipboard?.label||_cardClipboard?.type||'Card';
  btn.classList.toggle('has-clip',!!_cardClipboard);
  if(clr) clr.classList.toggle('has-clip',!!_cardClipboard);
  if(_cardClipboard) btn.textContent=`📋 Incolla "${label}"`;
}
function clearClipboard(){
  _cardClipboard=null;
  try{ localStorage.removeItem('hadb_clip'); }catch(e){}
  _updatePasteBtn();
  showToast('🗑 Appunti svuotati');
}
function copyCard(id){
  const card=curPage().cards.find(c=>c.id===id);
  if(!card) return;
  _clipboardSave(card);
  showToast(`📋 "${card.label||card.type}" copiata!`);
}
function cutCard(id){
  const card=curPage().cards.find(c=>c.id===id);
  if(!card) return;
  _clipboardSave(card);
  const cards=curPage().cards;
  cards.splice(cards.findIndex(c=>c.id===id),1);
  saveCfg(); renderDash();
  showToast(`✂️ "${card.label||card.type}" tagliata!`);
}
function _assignSection(page,card){
  if(card.type==='header-bar') return;
  _ensureSections(page);
  if(!card.secId||!page.sections.find(s=>s.id===card.secId)){
    // Use pending col target if set (from addCardToCol)
    const targetSecId=_pendingDropSec||page.sections[0].id;
    const targetCol=_pendingDropSec?_pendingDropCol:0;
    _pendingDropSec=null; _pendingDropCol=0;
    const sec=page.sections.find(s=>s.id===targetSecId)||page.sections[0];
    const siblings=page.cards.filter(c=>c.secId===sec.id&&(c.secCol||0)===targetCol);
    card.secId=sec.id; card.secCol=targetCol;
    card.secOrder=siblings.length>0?Math.max(...siblings.map(c=>c.secOrder||0))+10:0;
    if(!card.height){
      const baseH=(card.rowSpan||1)*(sec.rowH||150);
      // Weather cards with forecast need more height
      const isWF=card.type==='weather'||card.type==='weather-forecast';
      card.height=isWF?Math.max(baseH,200):baseH;
    }
  }
}
function pasteCard(){
  if(!_cardClipboard) return;
  const page=curPage();
  const newCard=JSON.parse(JSON.stringify(_cardClipboard));
  newCard.id=uid();
  delete newCard.secId; delete newCard.secCol; delete newCard.secOrder;
  _assignSection(page,newCard);
  page.cards.push(newCard);
  saveCfg(); renderDash(); openCM(newCard.id);
}
/* Incolla la card degli appunti in una colonna PRECISA (dal menu "+ Card"). Non riapre la config. */
function pasteCardTo(secId, col){
  if(!_cardClipboard){ showToast('📋 Nessuna card negli appunti'); return; }
  const page=curPage();
  const newCard=JSON.parse(JSON.stringify(_cardClipboard));
  newCard.id=uid();
  // azzera la posizione vecchia, altrimenti _assignSection la rimette nella colonna originale
  delete newCard.secId; delete newCard.secCol; delete newCard.secOrder;
  _pendingDropSec=secId; _pendingDropCol=col;
  _assignSection(page,newCard);
  page.cards.push(newCard);
  saveCfg(); renderDash();
  showToast(`📋 "${newCard.label||newCard.type}" incollata!`);
}

/* ═══ TOAST + CONFIRM → utils.js ═══ */

/* ═══ SAVED CARDS ═══ */
function saveCardTemplate(id){
  const card=curPage().cards.find(c=>c.id===id);
  if(!card) return;
  if(!cfg.savedCards) cfg.savedCards=[];
  const tpl=JSON.parse(JSON.stringify(card));
  delete tpl.id;          // verrà rigenerato all'uso
  tpl._savedAt=Date.now();
  cfg.savedCards.push(tpl);
  saveCfg(); renderSavedCards();
  showToast(`💾 "${card.label||card.type}" salvata!`);
}

function renderSavedCards(){
  const saved=cfg.savedCards||[];
  const badge=document.getElementById('ep-saved-count');
  if(badge) badge.textContent=saved.length?`${saved.length} template`:'';

  /* ── pannello laterale ── */
  const panel=document.getElementById('ep-saved-list');
  if(panel){
    if(!saved.length){
      panel.innerHTML=`<div class="saved-empty">Nessuna card salvata.<br>Clicca 💾 su una card per salvarla.</div>`;
    } else {
      panel.innerHTML=saved.map((t,i)=>`
        <div class="ep-saved-chip" data-action="addSaved" data-action-args='[${i}]' title="Clicca per aggiungere">
          <span class="ep-saved-chip-name">${t.label||'Card'}</span>
          <button class="ep-saved-chip-del" data-action="_deleteSavedAt" data-action-args='[${i}]' title="Elimina">✕</button>
        </div>`).join('');
    }
  }

  /* ── modal speciale ── */
  const modal=document.getElementById('saved-cards-grid');
  if(modal){
    if(!saved.length){
      modal.innerHTML=`<div class="saved-empty">Nessuna card salvata. Clicca 💾 su una card per salvarla come template.</div>`;
    } else {
      modal.innerHTML=`<div class="saved-grid">${saved.map((t,i)=>`
        <button class="saved-btn" data-action="addSaved" data-action-args='[${i}]'>
          <button class="saved-btn-del" data-action="_deleteSavedAt" data-action-args='[${i}]' title="Elimina template">✕</button>
          <span class="saved-btn-ico">${t.icon||'📦'}</span>
          <span class="saved-btn-name">${t.label||'Card'}</span>
          <span class="saved-btn-type">${t.type||''}</span>
        </button>`).join('')}</div>`;
    }
  }
}

function addSaved(idx){
  const saved=cfg.savedCards||[];
  const tpl=saved[idx];
  if(!tpl) return;
  const page=curPage();
  const newCard=JSON.parse(JSON.stringify(tpl));
  newCard.id=uid(); delete newCard._savedAt; _assignSection(page,newCard);
  page.cards.push(newCard);
  saveCfg();
  const smOpen=!document.getElementById('smod').classList.contains('off');
  if(smOpen) closeSM();
  renderDash(); openCM(newCard.id);
}

function deleteSaved(idx, evt){
  evt.stopPropagation();
  if(!cfg.savedCards) return;
  const name=cfg.savedCards[idx]?.label||'Card';
  cfg.savedCards.splice(idx,1);
  saveCfg(); renderSavedCards();
  showToast(`🗑 "${name}" eliminata dai template`);
}

/* ═══ SPECIAL CARD MODAL ═══ */

/* ═══════════════════════════════════════════════
   JS CARD STORE — carica card .js custom
═══════════════════════════════════════════════ */

/* Registry globale: id → { meta, code } */
window.FratechCardRegistry = {};

/* ═══════════════════════════════════════════════════════════════
   ADATTATORE CARD LOVELACE (Home Assistant standard)
   Permette di usare card scritte nel formato ufficiale HA
   (class extends HTMLElement + setConfig + set hass + customElements.define),
   non solo quelle FratechStore. Così funzionano le card dell'amico e quelle HACS.
═══════════════════════════════════════════════════════════════ */
window.customCards = window.customCards || [];

/* ════════════════════════════════════════════════════════════════════
   YAML CARD RENDERER — renderer ricorsivo HA/HACS
   • custom:xxx  → usa customElements dopo _loadLovelaceResources()
   • entities, stack, section, ecc. → reimplementazione HTML leggera
   • hass passato ad ogni custom element (dal parent HA o simulato)
   ════════════════════════════════════════════════════════════════════ */

function _getBestHass(){
  try{
    const wins=[window.parent,window.top].filter(w=>{ try{return w&&w!==window;}catch(e){return false;} });
    for(const w of wins){ const ha=w.document.querySelector('home-assistant'); if(ha&&ha.hass) return ha.hass; }
  }catch(e){}
  return _haHassObj();
}

/* ════════ MOTORE UFFICIALE HA: loadCardHelpers().createCardElement() ════════
   Costruisce QUALSIASI card Lovelace (nativa, HACS, stack, hui-element…) usando lo
   stesso motore di Home Assistant, preso dal frontend di HA (window.parent). */
let _cardHelpersPromise=null, _cardHelpersWin=null;
function _loadCardHelpers(){
  if(_cardHelpersPromise) return _cardHelpersPromise;
  _cardHelpersPromise=(async()=>{
    const tryWin=async(w)=>{ try{ if(w&&typeof w.loadCardHelpers==='function'){ const h=await w.loadCardHelpers(); if(h){ _cardHelpersWin=w; return h; } } }catch(e){} return null; };
    return (await tryWin(window)) || (await tryWin(window.parent)) || (await tryWin(window.top)) || null;
  })();
  return _cardHelpersPromise;
}
async function _createHACard(config){
  try{
    const helpers=await _loadCardHelpers();
    if(!helpers||typeof helpers.createCardElement!=='function') return null;
    const w=_cardHelpersWin||window;
    let cfg; try{ cfg=w.JSON.parse(JSON.stringify(config)); }catch(e){ cfg=config; }   // oggetto nel realm di HA
    const el=helpers.createCardElement(cfg);
    if(!el) return null;
    try{ el.hass=_getBestHass(); }catch(e){}
    el.classList.add('fycel');
    el.style.display='block'; el.style.width='100%';
    return el;
  }catch(e){ console.warn('[Frarik] createCardElement:',e&&e.message); return null; }
}

/* ════════ RENDER FEDELE "alla Oikos": dashboard HA dedicata + iframe ════════
   Per ogni card YAML scriviamo una VISTA in una dashboard HA nascosta (frarik-yaml) e la
   mostriamo in un <iframe>: così è Home Assistant stesso a disegnare la card → identica,
   con TUTTI i plugin HACS. Se la dashboard/WS non è disponibile → fallback renderer interno. */
const _FY_DASH='frarik-yaml';
let _fyDashEnsured=false, _fyLock=Promise.resolve();
function _fyPath(cardId){ return 'c'+String(cardId||'').toLowerCase().replace(/[^a-z0-9_-]/g,''); }
async function _fyWS(msg,timeout){ try{ return await sendAndWait(msg,timeout||10000); }catch(e){ return null; } }
async function _fyEnsureDashboard(){
  if(_fyDashEnsured) return true;
  const list=await _fyWS({type:'lovelace/dashboards/list'});
  if(!list||!list.success) return false;
  const ex=Array.isArray(list.result)&&list.result.find(d=>d.url_path===_FY_DASH);
  if(!ex){
    const cr=await _fyWS({type:'lovelace/dashboards/create',url_path:_FY_DASH,mode:'storage',title:'Frarik YAML',icon:'mdi:code-braces',show_in_sidebar:false,require_admin:false});
    if(!cr||!cr.success) return false;
  }
  _fyDashEnsured=true; return true;
}
async function _fyGetConfig(){
  const r=await _fyWS({type:'lovelace/config',url_path:_FY_DASH});
  return (r&&r.success&&r.result&&typeof r.result==='object') ? r.result : {views:[]};
}
/* scrive/aggiorna la vista (path=cardId) con dentro la card YAML — serializzato per evitare race */
function _fyUpsertView(cardId, cardCfg){
  const job=_fyLock.then(async()=>{
    if(!(ws&&ws.readyState===1)) return false;
    if(!await _fyEnsureDashboard()) return false;
    const cfg=await _fyGetConfig(); cfg.views=cfg.views||[];
    const path=_fyPath(cardId);
    const view={path, title:path, cards:[cardCfg]};
    const i=cfg.views.findIndex(v=>v&&v.path===path);
    if(i>=0) cfg.views[i]=view; else cfg.views.push(view);
    const sv=await _fyWS({type:'lovelace/config/save',url_path:_FY_DASH,config:cfg});
    return !!(sv&&sv.success);
  });
  _fyLock=job.catch(()=>{});
  return job;
}
async function _mountYamlCard(card, container){
  container.innerHTML='<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px">⏳ Carico…</div>';
  let cfg;
  try{ cfg=jsyaml.load(card.lovelaceConfig); }
  catch(e){ container.innerHTML='<div style="padding:12px;color:#f87171;font-size:11px">YAML: '+eh(e.message)+'</div>'; return; }
  // 1) Tentativo FEDELE: dashboard HA dedicata + iframe (render nativo di HA)
  let iframed=false;
  try{
    if(await _fyUpsertView(card.id, cfg)){
      if(!container.isConnected) return;
      container.innerHTML='';
      container.style.cssText='display:block;width:100%;height:100%';
      const f=document.createElement('iframe');
      // root-relative → risolve sull'origine di HA (la plancia gira sotto il dominio HA via ingress).
      // ?kiosk nasconde header/sidebar se è installato kiosk-mode (HACS).
      f.src='/'+_FY_DASH+'/'+encodeURIComponent(_fyPath(card.id))+'?kiosk';
      f.setAttribute('allow','fullscreen; autoplay; camera; microphone; clipboard-write');
      f.style.cssText='display:block;width:100%;height:100%;min-height:200px;border:0;border-radius:10px;background:transparent';
      container.appendChild(f);
      iframed=true;
    }
  }catch(e){ console.warn('[Frarik] yaml iframe:',e&&e.message); }
  if(iframed) return;
  // 2) Fallback: renderer interno leggero (card semplici)
  if(!_lovelaceResourcesLoaded){ try{ await _loadLovelaceResources(); }catch(e){} await new Promise(r=>setTimeout(r,700)); }
  if(!container.isConnected) return;
  container.innerHTML='';
  container.style.cssText='display:block;width:100%;height:100%;overflow:auto';
  const el=await _yamlCreateEl(cfg);
  container.appendChild(el);
  if(container._yamlTimer) clearInterval(container._yamlTimer);
  container._yamlTimer=setInterval(()=>_yamlRefreshHass(container),1000);
}

function _yamlRefreshHass(root){
  const h=_getBestHass();
  root.querySelectorAll('.fycel').forEach(el=>{ try{ el.hass=h; }catch(e){} });
}

async function _yamlCreateEl(cfg){
  if(!cfg||typeof cfg!=='object') return _yamlText(String(cfg||''));
  const type=(cfg.type||'').trim();
  const isCustom=type.startsWith('custom:');
  if(isCustom){
    const tag=type.replace('custom:','').trim();
    // hui-element = wrapper HA per card native dentro entities
    if(tag==='hui-element'){ return _yamlCreateEl({type:cfg.card_type,...cfg,type:cfg.card_type}); }
    return _yamlCustomEl(tag,cfg);
  }
  switch(type){
    case 'entities':          return _yamlEntitiesCard(cfg);
    case 'horizontal-stack':  return _yamlHStack(cfg);
    case 'vertical-stack':    return _yamlVStack(cfg);
    case 'grid':              return _yamlGrid(cfg);
    case 'section':           return _yamlSectionEl(cfg);
    case 'divider':           return _yamlDivider();
    case 'markdown':          return _yamlMarkdown(cfg);
    case 'picture-entity':    return _yamlPictureEntity(cfg);
    case 'iframe':            return _yamlIframe(cfg);
    case 'button':            return _yamlCustomEl('hui-button-card',cfg);
    default:{
      const tag='hui-'+type+'-card';
      if(customElements.get(tag)) return _yamlCustomEl(tag,cfg);
      return _yamlFallback(type);
    }
  }
}

function _yamlCustomEl(tag,cfg){
  let parentKnown=false;
  try{ parentKnown=!!(window.parent&&window.parent!==window&&window.parent.customElements&&window.parent.customElements.get(tag)); }catch(e){}
  let el;
  if(customElements.get(tag)||parentKnown){
    el=_createLovelaceEl(tag);   // prova locale, poi adotta dal frontend HA (parent)
    try{ el.hass=_getBestHass(); }catch(e){}
    try{ if(typeof el.setConfig==='function') el.setConfig(cfg); }catch(e){}
  } else {
    el=document.createElement('div');
    el.style.cssText='padding:6px 10px;font-size:10px;color:#fbbf24;border:1px dashed rgba(251,191,36,.3);border-radius:6px;margin:2px 0';
    el.textContent='⚠️ '+tag+' non installata su HACS';
  }
  el.classList.add('fycel');
  el.style.setProperty('display','block');
  el.style.setProperty('width','100%');
  return el;
}

/* type: iframe → incorpora una pagina/dashboard HA reale (la card complessa funziona al 100% qui dentro) */
function _yamlIframe(cfg){
  const f=document.createElement('iframe');
  f.src=cfg.url||'';
  f.setAttribute('allow','fullscreen; autoplay; camera; microphone; geolocation; clipboard-write');
  f.setAttribute('allowfullscreen','true');
  const ar=(cfg.aspect_ratio||'').toString();
  const h=/px$/.test(ar)?ar:(cfg.height?(cfg.height+'px'):'100%');
  f.style.cssText='display:block;width:100%;height:'+h+';min-height:200px;border:0;border-radius:10px;background:#0d1020';
  return f;
}

async function _yamlEntitiesCard(cfg){
  const wrap=document.createElement('div');
  // applica card_mod style base se presente
  const cmStyle=(cfg.card_mod&&cfg.card_mod.style)||'';
  if(cmStyle){ const s=document.createElement('style'); s.textContent=cmStyle; wrap.appendChild(s); }
  wrap.style.cssText='display:block;width:100%;border-radius:12px;overflow:visible';
  if(cfg.name||cfg.title){
    const h=document.createElement('div');
    h.style.cssText='padding:12px 16px 6px;font-size:14px;font-weight:700;color:#e2e8f0';
    h.textContent=cfg.name||cfg.title; wrap.appendChild(h);
  }
  const list=document.createElement('div');
  list.style.cssText='padding:0 4px 4px';
  for(const entry of (cfg.entities||[])){
    if(!entry) continue;
    let item;
    if(typeof entry==='string') item=_yamlEntityRow({entity:entry});
    else if(entry.type==='section') item=_yamlSectionEl(entry);
    else if(entry.type==='divider') item=_yamlDivider();
    else if(entry.type) item=await _yamlCreateEl(entry);   // custom:, hui-element, stack… → renderer principale (gestisce l'unwrap)
    else if(entry.entity) item=_yamlEntityRow(entry);
    else continue;
    list.appendChild(item);
  }
  wrap.appendChild(list);
  return wrap;
}

async function _yamlHStack(cfg){
  const w=document.createElement('div');
  w.style.cssText='display:flex;flex-direction:row;gap:4px;width:100%;align-items:stretch';
  for(const c of (cfg.cards||[])){ const el=await _yamlCreateEl(c); el.style.flex='1 1 0'; w.appendChild(el); }
  return w;
}

async function _yamlVStack(cfg){
  const w=document.createElement('div');
  w.style.cssText='display:flex;flex-direction:column;gap:4px;width:100%';
  for(const c of (cfg.cards||[])){ w.appendChild(await _yamlCreateEl(c)); }
  return w;
}

async function _yamlGrid(cfg){
  const w=document.createElement('div');
  const cols=cfg.columns||2;
  w.style.cssText=`display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;width:100%`;
  for(const c of (cfg.cards||[])){ w.appendChild(await _yamlCreateEl(c)); }
  return w;
}

function _yamlSectionEl(cfg){
  const el=document.createElement('div');
  el.style.cssText='padding:8px 6px 4px;font-size:10px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.7px';
  el.textContent=cfg.label||'';
  return el;
}

function _yamlDivider(){
  const el=document.createElement('div');
  el.style.cssText='height:1px;background:rgba(255,255,255,.08);margin:6px 0';
  return el;
}

function _yamlMarkdown(cfg){
  const el=document.createElement('div');
  el.style.cssText='padding:12px;font-size:12px;color:#e2e8f0;line-height:1.5';
  el.innerHTML=cfg.content||cfg.text||'';
  return el;
}

function _yamlEntityRow(cfg){
  const eid=cfg.entity||'';
  const state=hs[eid]??'—';
  const name=cfg.name||ha[eid]?.friendly_name||eid.split('.').pop().replace(/_/g,' ');
  const unit=ha[eid]?.unit_of_measurement||'';
  const el=document.createElement('div');
  el.style.cssText='display:flex;align-items:center;padding:8px 6px;gap:8px;border-radius:6px;transition:background .1s';
  el.innerHTML=`<span style="font-size:12px;flex:1;color:#e2e8f0">${eh(name)}</span><span style="font-size:12px;color:#94a3b8">${eh(isNaN(parseFloat(state))?_stateIt(state):state)} ${eh(unit)}</span>`;
  return el;
}

function _yamlPictureEntity(cfg){
  const eid=cfg.entity||'';
  const stateKey=hs[eid]||'off';
  const img=(cfg.state_image&&cfg.state_image[stateKey])||cfg.image||'';
  const el=document.createElement('div');
  el.style.cssText='width:100%;overflow:hidden;background:none';
  if(img) el.innerHTML=`<img src="${eh(img)}" style="width:100%;height:100%;object-fit:${cfg.fit_mode||'contain'};display:block" onerror="this.style.opacity='.3'">`;
  return el;
}

function _yamlText(str){ const el=document.createElement('div'); el.style.cssText='padding:4px;font-size:11px;color:#94a3b8'; el.textContent=str; return el; }
function _yamlFallback(type){ const el=document.createElement('div'); el.style.cssText='padding:6px;font-size:10px;color:#94a3b8;border:1px dashed rgba(255,255,255,.1);border-radius:6px'; el.textContent='type: '+type; return el; }

function _stopYamlCard(cardId){
  const w=document.getElementById('v-'+cardId);
  if(!w) return;
  if(w._yamlTimer) clearInterval(w._yamlTimer);
}
/* ── Carica le risorse Lovelace (HACS custom cards) dal server HA ── */
let _lovelaceResourcesLoaded=false, _lovelaceResCount=0;
async function _loadLovelaceResources(){
  if(_lovelaceResourcesLoaded||!ws||ws.readyState!==1) return;
  try{
    const res=await sendAndWait({type:'lovelace/resources'},12000);
    if(!res||!res.success||!Array.isArray(res.result)) return;
    _lovelaceResourcesLoaded=true;
    let loaded=0;
    for(const r of res.result){
      if(!r.url) continue;
      const url=r.url.startsWith('http')?r.url:BASE+r.url;
      try{ await _loadHAScript(url,r.type); loaded++; }catch(e){}
    }
    // registra le card che si sono auto-annunciate via window.customCards
    (window.customCards||[]).forEach(c=>{
      if(c&&c.type&&!window.FratechCardRegistry[c.type]) _registerLovelaceCard(c.type,c);
    });
    _lovelaceResCount=(window.customCards||[]).length;
    console.info('[Frarik] Lovelace resources: '+loaded+' script caricati, '+_lovelaceResCount+' card custom disponibili');
  }catch(e){ console.warn('[Frarik] _loadLovelaceResources:',e.message); }
}
function _loadHAScript(url,rtype){
  return new Promise(resolve=>{
    if(document.querySelector('script[data-haurl="'+CSS.escape(url)+'"]')){ resolve(); return; }
    const s=document.createElement('script');
    if(rtype!=='js') s.type='module';   // HACS 'module' (default) o 'js' (script classico)
    s.src=url; s.dataset.haurl=url;
    s.onload=resolve; s.onerror=resolve;
    document.head.appendChild(s);
  });
}

/* Oggetto hass completo passato alle card Lovelace/HACS */
function _haHassObj(){
  const states={};
  for(const id in hs){ states[id]={entity_id:id,state:hs[id],attributes:(ha[id]||{}),last_changed:'',last_updated:'',context:{id:'frarik'}}; }
  return {
    states,
    callService(domain,service,data,target){
      try{ send({type:'call_service',domain,service,service_data:data||{},target:target||{}}); }catch(e){}
      return Promise.resolve({context:{id:'frarik'}});
    },
    callApi(method,path,data){
      return fetch(BASE+'/api/'+path,{method:method||'GET',headers:{'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined}).then(r=>r.json()).catch(()=>null);
    },
    sendWS(msg){ return sendAndWait(Object.assign({},msg)); },
    callWS(msg){ return sendAndWait(Object.assign({},msg)); },
    language:'it', selectedLanguage:'it',
    locale:{language:'it',number_format:'language',time_format:'24',date_format:'DMY',first_weekday:'monday'},
    themes:{darkMode:true,default_theme:'default',themes:{}},
    selectedTheme:{theme:'default',dark:true},
    user:{id:'frarik',name:'Frarik',is_admin:true,is_owner:true,credentials:[],mfa_modules:[]},
    config:{
      version:'2024.12.0',state:'RUNNING',
      latitude:0,longitude:0,elevation:0,
      unit_system:{length:'km',mass:'kg',pressure:'Pa',temperature:'°C',volume:'L',wind_speed:'m/s'},
      location_name:'Frarik',time_zone:'Europe/Rome',
      components:[],config_dir:'/config',
      whitelist_external_dirs:[],allowlist_external_dirs:[],
      currency:'EUR',country:'IT',language:'it',
      external_url:BASE,internal_url:BASE
    },
    hassUrl:(path)=>BASE+(path||''),
    auth:{accessToken:TOKEN,expired:false,refreshToken:'frarik',clientId:'frarik',haVersion:'2024.12.0'},
    connection:{
      haVersion:'2024.12.0',
      subscribeEvents(cb,eventType){ return Promise.resolve(()=>{}); },
      subscribeMessage(cb,msg){ return Promise.resolve(()=>{}); },
      sendMessagePromise:(msg)=>sendAndWait(Object.assign({},msg)),
    },
    services:{}, areas:{}, devices:{}, entities:{},
    panels:{lovelace:{component_name:'lovelace',icon:null,title:null,config:null,url_path:'lovelace',require_admin:false}},
    localize:(k,...args)=>{ const p=k.split('.'); return p[p.length-1]||k; },
    formatEntityState:(stateObj)=>stateObj?stateObj.state:'',
    formatEntityAttributeValue:(stateObj,attr)=>stateObj&&stateObj.attributes?stateObj.attributes[attr]:'',
    loadBackendTranslation:()=>Promise.resolve({}),
    loadFragmentTranslation:()=>Promise.resolve({}),
    fireEvent:(node,type,detail)=>{ try{ node.dispatchEvent(new CustomEvent(type,{bubbles:true,composed:true,detail:detail||{}})); }catch(e){} }
  };
}
/* ════════ YAML IMPORT ════════ */
let _yamlCurrentConfig=null;
function openYamlImport(){
  _yamlCurrentConfig=null;
  document.getElementById('yaml-inp').value='';
  document.getElementById('yaml-status').textContent='';
  document.getElementById('yaml-status').className='';
  document.getElementById('yaml-preview').className='';
  document.getElementById('yaml-preview').innerHTML='';
  document.getElementById('yaml-add-btn').className='yaml-act-btn success';
  document.getElementById('yaml-modal').classList.remove('off');
  setTimeout(()=>document.getElementById('yaml-inp').focus(),80);
}
function closeYamlImport(){ document.getElementById('yaml-modal').classList.add('off'); }
function _yamlStatus(msg,type){
  const el=document.getElementById('yaml-status');
  el.textContent=msg; el.className=type||'';
}
async function yamlImportParse(){
  const txt=(document.getElementById('yaml-inp').value||'').trim();
  if(!txt){ _yamlStatus('Incolla il codice YAML della card','warn'); return; }
  let config;
  try{ config=jsyaml.load(txt); }catch(e){ _yamlStatus('❌ YAML non valido: '+e.message,'error'); return; }
  if(!config||typeof config!=='object'){ _yamlStatus('❌ YAML vuoto o non riconosciuto','error'); return; }
  const type=(config.type||'').trim();
  if(!type){ _yamlStatus('❌ Manca il campo "type:" nel YAML','error'); return; }
  _yamlStatus('⏳ Carico risorse e genero anteprima…','loading');
  document.getElementById('yaml-add-btn').className='yaml-act-btn success';
  _yamlCurrentConfig={config,yamlStr:jsyaml.dump(config)};
  // ANTEPRIMA con LO STESSO renderer della dashboard (_yamlCreateEl) → quello che vedi qui è ciò che otterrai
  const prev=document.getElementById('yaml-preview');
  prev.innerHTML='';
  prev.className='show';
  try{
    if(!_lovelaceResourcesLoaded){ await _loadLovelaceResources(); await new Promise(r=>setTimeout(r,500)); }
    const el=await _yamlCreateEl(config);
    el.style.cssText='display:block;width:100%';
    prev.appendChild(el);
    _yamlRefreshHass(prev);
    _yamlStatus('✅ Anteprima generata · '+((window.customCards||[]).length)+' card HACS rilevate. Le card semplici si vedono; quelle molto complesse no (limite tecnico, vedi sotto).','ok');
  }catch(e){
    prev.innerHTML='<div style="padding:12px;color:#f87171;font-size:11px">Errore anteprima: '+eh(e.message)+'</div>';
    _yamlStatus('⚠️ '+e.message,'warn');
  }
  document.getElementById('yaml-add-btn').className='yaml-act-btn success show';
}
function yamlImportAdd(){
  if(!_yamlCurrentConfig){ _yamlStatus('Prima fai "Carica anteprima"','warn'); return; }
  const {config,yamlStr}=_yamlCurrentConfig;
  const page=curPage();
  const newCard={
    id:uid(),
    type:'yaml-card',          // tipo dedicato — niente conversione JS
    lovelaceConfig:yamlStr,    // YAML originale conservato intatto
    label:(config.name||config.title||config.type||'YAML Card').toString(),
    icon:'🧩',color:'#818cf8',
    colSpan:2,rowSpan:2
  };
  _assignSection(page,newCard);
  page.cards.push(newCard);
  saveCfg(); renderDash();
  closeYamlImport();
  showToast('✅ Card YAML aggiunta alla dashboard');
}
/* Registra una card Lovelace (tag custom element) come card FratechStore (wrapper) */
/* Crea un custom element: prova prima nel documento corrente,
   poi nel parent (HA ha già caricato tutto il suo frontend + HACS) */
function _createLovelaceEl(tag){
  // Prova nel documento corrente
  let cel=document.createElement(tag);
  if(cel.constructor!==HTMLElement||customElements.get(tag)) return cel;
  // Fallback: parent window (quando Frarik gira come panel dentro HA)
  try{
    if(window.parent&&window.parent!==window){
      const pce=window.parent.customElements;
      if(pce&&pce.get(tag)){
        const pEl=window.parent.document.createElement(tag);
        return document.adoptNode(pEl);
      }
    }
  }catch(e){}
  return cel; // unknown element — tentar non nuoce
}
function _registerLovelaceCard(tag, meta){
  if(!tag) return;
  // Le card native HA (hui-*-card) vogliono il tipo originale nel config; le custom vogliono "custom:tag"
  const isNative=tag.startsWith('hui-')&&tag.endsWith('-card');
  window.FratechCardRegistry[tag] = {
    id:tag, name:(meta&&meta.name)||tag, icon:(meta&&meta.icon)||'🧩',
    version:(meta&&meta.version)||'1.0', desc:(meta&&meta.description)||'Card Lovelace (Home Assistant)',
    _lovelace:true, _tag:tag,
    render(){ return '<div class="lovel-wrap" style="height:100%;width:100%"></div>'; },
    mount(card, _hassIgnored, el){
      const host=el.querySelector('.lovel-wrap')||el;
      host.innerHTML='';
      const cel=_createLovelaceEl(tag);
      // Costruisce il config corretto
      let cfgObj=isNative?{}:{type:'custom:'+tag};
      try{
        if(card.lovelaceConfig){
          const y=(typeof jsyaml!=='undefined')?jsyaml.load(card.lovelaceConfig):JSON.parse(card.lovelaceConfig);
          if(y&&typeof y==='object') cfgObj=isNative?y:Object.assign({},y,{type:'custom:'+tag});
        } else if(card.entity){ cfgObj.entity=card.entity; }
      }catch(e){}
      try{ if(typeof cel.setConfig==='function') cel.setConfig(cfgObj); }
      catch(e){ host.innerHTML='<div style="padding:10px;color:#f87171;font-size:11px">setConfig: '+(e.message||e)+'</div>'; return; }
      cel.classList.add('frarik-lovel');
      try{ cel.hass=_haHassObj(); }catch(e){}
      cel.style.cssText='display:block;width:100%';
      host.appendChild(cel);
    },
    update(card, _h, el){
      const cel=el.querySelector('.frarik-lovel');
      if(cel){ try{ cel.hass=_haHassObj(); }catch(e){} }
      else this.mount(card,_h,el);
    }
  };
}
/* Esegue il codice di una card .js gestendo SIA il formato FratechStore SIA quello Lovelace */
function _installCardCode(code){
  const before=new Set(Object.keys(window.FratechCardRegistry));
  const tags=[];
  const orig=customElements.define.bind(customElements);
  customElements.define=function(name,ctor,opts){ try{ if(!customElements.get(name)) orig(name,ctor,opts); }catch(e){} tags.push(name); };
  let err=null;
  try{ (0,eval)(code); }catch(e){ err=e; }
  customElements.define=orig;
  // per ogni custom element definito che NON è già una card FratechStore → wrapper Lovelace
  tags.forEach(tag=>{
    if(window.FratechCardRegistry[tag]&&!window.FratechCardRegistry[tag]._lovelace) return;
    const meta=(window.customCards||[]).find(c=>c&&c.type===tag);
    _registerLovelaceCard(tag, meta);
  });
  return {err, tags, newCards:Object.keys(window.FratechCardRegistry).filter(k=>!before.has(k))};
}
/* Refresh periodico delle card Lovelace montate (ricevono hass su qualsiasi cambio stato) */
setInterval(()=>{
  const els=document.querySelectorAll('.frarik-lovel');
  if(!els.length) return;
  const h=_haHassObj();
  els.forEach(cel=>{ try{ cel.hass=h; }catch(e){} });
}, 2000);

const JS_TEMPLATE = `/**
 * FratechCard — Template
 * Rinomina questo file con l'ID della tua card (es: mia-card.js)
 */
(function(){
  'use strict';

  const CARD = {
    id:      'mia-card',        // ID univoco, solo a-z, 0-9, trattino
    name:    'La Mia Card',     // Nome mostrato nello store
    icon:    '🎯',              // Emoji icona
    version: '1.0.0',           // Versione
    desc:    'Descrizione breve della card',

    /**
     * render(card, hass) → stringa HTML
     * Chiamato al primo inserimento e a ogni rebuild della dashboard.
     *   card  = oggetto configurazione (card.entity, card.color, ecc.)
     *   hass  = { states: { 'sensor.xxx': '42', ... } }  (può essere null)
     */
    render(card, hass) {
      const val = hass?.states?.[card.entity] ?? '—';
      return \`
        <div style="display:flex;flex-direction:column;align-items:center;
                    justify-content:center;height:100%;gap:8px">
          <div style="font-size:40px">\${this.icon}</div>
          <div style="font-size:28px;font-weight:900;color:\${card.color||'#818cf8'}">\${val}</div>
          <div style="font-size:11px;opacity:.5">\${card.label||this.name}</div>
        </div>
      \`;
    },

    /**
     * update(card, hass, containerEl) — aggiornamento live
     * Chiamato ad ogni cambio di stato di un'entità usata dalla card.
     * Se non lo implementi, viene chiamato render() e sostituito l'innerHTML.
     */
    update(card, hass, el) {
      el.innerHTML = this.render(card, hass);
    }
  };

  /* ── Registrazione (non modificare) ── */
  window.FratechCardRegistry[CARD.id] = CARD;
  console.log('[FratechStore] Card registrata:', CARD.id, 'v'+CARD.version);
})();
`;

function _jsStoreKey(id){ return 'fratech_jscard_' + id; }

function _jsStoreSave(id, meta, code, origin){
  try {
    let prev=null; try{ prev=JSON.parse(localStorage.getItem(_jsStoreKey(id))||'null'); }catch(e){}
    const org = origin || (prev&&prev.origin) || 'github';   // 'github' = installata dallo store · 'local' = caricata da PC
    localStorage.setItem(_jsStoreKey(id), JSON.stringify({meta, code, ts: Date.now(), origin: org}));
  } catch(e){}
  if(typeof _cfgTouchAndPush==='function') _cfgTouchAndPush();   // propaga la card su HA (auto-sync)
}
function _jsStoreDelete(id){
  try { localStorage.removeItem(_jsStoreKey(id)); } catch(e){}
  if(typeof _cfgTouchAndPush==='function') _cfgTouchAndPush();
}
function _jsStoreList(){
  const out = [];
  for(let i=0; i<localStorage.length; i++){
    const k = localStorage.key(i);
    if(!k || !k.startsWith('fratech_jscard_')) continue;
    let v=null; try { v=JSON.parse(localStorage.getItem(k)); } catch(e){}
    // scarta voci corrotte/vuote: una card valida ha sempre meta.id e codice
    if(v && v.meta && v.meta.id && v.code) out.push(v);
  }
  return out;
}

/* Carica tutti i .js salvati al boot */
function _jsStoreBootAll(){
  // pulizia: rimuovi dal localStorage eventuali chiavi corrotte/vuote (senza meta.id o codice),
  // così non restano a gonfiare il conteggio dello Store.
  try{
    const bad=[];
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(!k||!k.startsWith('fratech_jscard_')) continue; let v=null; try{ v=JSON.parse(localStorage.getItem(k)); }catch(e){} if(!(v&&v.meta&&v.meta.id&&v.code)) bad.push(k); }
    bad.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
  }catch(e){}
  _jsStoreList().forEach(item => {
    try { _installCardCode(item.code); } catch(e){
      console.warn('[FratechStore] Errore boot card:', e.message);
      try{ _ntfPushLog('⚠️ Card JS rotta', (item.meta&&item.meta.id||'?')+': '+e.message, '🧩', null, {}); }catch(_){}
    }
  });
}

function openJsStore(){
  document.getElementById('js-store-modal').classList.remove('off');
  jsStoreTab('installed');
  document.getElementById('jsst-template-pre').textContent = JS_TEMPLATE;
  // drag & drop sulla dropzone
  const dz = document.getElementById('jsst-dropzone');
  dz.ondragover  = e => { e.preventDefault(); dz.classList.add('drag-over'); };
  dz.ondragleave = () => dz.classList.remove('drag-over');
  dz.ondrop      = e => { e.preventDefault(); dz.classList.remove('drag-over'); jsStoreLoadFile(e.dataTransfer.files[0]); };
}
function closeJsStore(){ document.getElementById('js-store-modal').classList.add('off'); }

function jsStoreTab(t){
  ['installed','load'].forEach(x=>{
    document.getElementById('jsst-tab-'+x).classList.toggle('on', x===t);
    document.getElementById('jsst-panel-'+x).style.display = x===t ? '' : 'none';
  });
  if(t==='installed') _jsStoreRenderList();
}

function _jsStoreRenderList(){
  const items = _jsStoreList();
  const listEl = document.getElementById('jsst-list');
  const emptyEl = document.getElementById('jsst-empty');
  document.getElementById('jsst-count').textContent = items.length;
  if(!items.length){ listEl.innerHTML=''; emptyEl.style.display=''; return; }
  emptyEl.style.display='none';

  // Calcola quali card sono già in dashboard (su tutte le pagine)
  const usedIds = new Set();
  (cfg.pages||[]).forEach(pg => (pg.cards||[]).forEach(c => { if(c.type==='js-custom'&&c.jsCardId) usedIds.add(c.jsCardId); }));

  const inDash = items.filter(i => usedIds.has((i.meta||{}).id));
  const avail  = items.filter(i => !usedIds.has((i.meta||{}).id));

  function rowHTML(item){
    const m = item.meta || {};
    const inUse = usedIds.has(m.id);
    return `<div class="jsst-card-row">
      <div class="jsst-card-ico">${m.icon||'📦'}</div>
      <div class="jsst-card-info">
        <div class="jsst-card-name">${m.name||m.id||'Card'}</div>
        <div class="jsst-card-id">ID: ${m.id||'?'} &nbsp;·&nbsp; v${m.version||'?'}</div>
        <div class="jsst-card-desc">${m.desc||''}</div>
      </div>
      <div class="jsst-card-actions">
        ${inUse ? '<span style="font-size:10px;color:#4ade80;font-weight:700;">✓ In dashboard</span>' : `<button class="jsst-btn-add" data-action="jsStoreAddCard" data-action-arg="${m.id||''}">➕ Aggiungi</button>`}
        <button class="jsst-btn-del" data-action="jsStoreDeleteCard" data-action-arg="${m.id||''}">🗑</button>
      </div>
    </div>`;
  }

  const secStyle = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.3);margin:12px 0 6px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.06)';

  let html = '';
  if(avail.length){
    html += `<div style="${secStyle}">📦 Disponibili (${avail.length})</div>`;
    html += avail.map(rowHTML).join('');
  }
  if(inDash.length){
    html += `<div style="${secStyle};margin-top:${avail.length?'18px':'12px'}">✅ In dashboard (${inDash.length})</div>`;
    html += inDash.map(rowHTML).join('');
  }
  listEl.innerHTML = html;
}

function jsStoreLoadFile(file){
  if(!file) return;
  const status = document.getElementById('jsst-load-status');
  if(!file.name.endsWith('.js')){ status.innerHTML='<span style="color:#f87171">⚠️ Seleziona un file .js</span>'; return; }
  if(file.size > 2*1024*1024){ status.innerHTML='<span style="color:#f87171">⚠️ File troppo grande (max 2 MB)</span>'; return; }
  status.innerHTML='<span style="color:#fbbf24">⏳ Lettura...</span>';
  const reader = new FileReader();
  reader.onload = e => {
    const code = e.target.result;
    // esegue il codice gestendo SIA formato FratechStore SIA Lovelace standard
    const res = _installCardCode(code);
    if(res.err){
      status.innerHTML=`<span style="color:#f87171">⚠️ Errore nel file: ${res.err.message}</span>`;
      return;
    }
    // id della card appena registrata (nuova in registry), altrimenti l'ultima
    let cardId = (res.newCards&&res.newCards[0]) || (res.tags&&res.tags[0]);
    let card = cardId ? window.FratechCardRegistry[cardId] : null;
    if(!card){ const all=Object.values(window.FratechCardRegistry); card=all[all.length-1]; }
    if(!card || !card.id){ status.innerHTML='<span style="color:#f87171">⚠️ Nessuna card valida trovata nel file (né FratechStore né Lovelace).</span>'; return; }
    _jsStoreSave(card.id, {id:card.id, name:card.name||card.id, icon:card.icon||'📦', version:card.version||'1.0', desc:card.desc||''}, code, 'local');
    status.innerHTML=`<span style="color:#4ade80">✅ Card <b>${card.name||card.id}</b> installata!${card._lovelace?' <span style="opacity:.6">(Lovelace)</span>':''} (v${card.version||'?'})</span>`;
    document.getElementById('jsst-count').textContent = _jsStoreList().length;
    setTimeout(()=>{ jsStoreTab('installed'); }, 900);
    // se è aperto il nuovo "Store da GitHub", aggiorna la scheda Card locali (lì finiscono i file caricati da PC)
    try{ if(!document.getElementById('gh-store-modal').classList.contains('off')){ showToast('✅ Card locale caricata'); _ghsTab='local'; ghStoreTab('local'); } }catch(e){}
  };
  reader.onerror = () => { status.innerHTML='<span style="color:#f87171">⚠️ Impossibile leggere il file.</span>'; };
  reader.readAsText(file);
}

function jsStoreAddCard(id){
  if(!id) return;
  const regCard = window.FratechCardRegistry[id];
  if(!regCard){ showToast('⚠️ Card non trovata nel registry. Ricarica la pagina.'); return; }
  const page = curPage();
  const newCard = {
    id: uid(), type: 'js-custom', jsCardId: id,
    label: regCard.name||id, icon: regCard.icon||'📦',
    color: '#818cf8', entity: '',
    colSpan: 2, rowSpan: 2
  };
  _assignSection(page, newCard);
  page.cards.push(newCard);
  saveCfg(); renderDash();
  closeJsStore();
  showToast('✅ Card aggiunta!');
  if(typeof _epRenderJsStore==='function') _epRenderJsStore();
  if(typeof _jsStoreRenderList==='function') _jsStoreRenderList();
}

function jsStoreDeleteCard(id){
  if(!confirm('Rimuovere la card "'+id+'" dallo store? Le card già aggiunte alla dashboard rimarranno ma mostreranno un errore.')) return;
  _jsStoreDelete(id);
  delete window.FratechCardRegistry[id];
  _jsStoreRenderList();
  if(typeof _epRenderJsStore==='function') _epRenderJsStore();
  showToast('🗑 Card rimossa');
}

function jsStoreDownloadTemplate(){
  const blob = new Blob([JS_TEMPLATE], {type:'text/javascript'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='fratech-card-template.js'; a.click();
}

function openSM(){ document.getElementById('smod').classList.remove('off'); }
function closeSM(){ document.getElementById('smod').classList.add('off'); }
function addSpecial(type){
  closeSM();
  const defs={
    flowbars:{label:'Flusso Energia',icon:'⚡',solar:'sensor.inverter_r5s1152j2118e25819_power',load:'sensor.consumo_solo_positivo',grid:'sensor.inverter_r5s1152j2118e25819_grid_power',colSpan:2,rowSpan:2,max:6000,color:'#fbbf24'},
    flowmap: {label:'Flusso Mappa',icon:'🗺️',solar:'sensor.inverter_r5s1152j2118e25819_power',load:'sensor.consumo_solo_positivo',grid:'sensor.inverter_r5s1152j2118e25819_grid_power',colSpan:2,rowSpan:2,color:'#818cf8'},
    camera:  {label:'Telecamera',icon:'📷',entity:'camera.telecamera_interna_scorrevole',colSpan:2,rowSpan:2,refresh:5,color:'#818cf8'},
    weather: {label:'Meteo',icon:'🌤️',entity:'weather.home',colSpan:2,rowSpan:1,color:'#22d3ee'},
    'weather-forecast':{label:'Previsioni',icon:'📅',entity:'weather.home',colSpan:4,rowSpan:1,color:'#818cf8'},
    media:   {label:'Lettore Multimediale',icon:'🎵',entity:'media_player.sfera_piano_terra',colSpan:2,rowSpan:1,color:'#f472b6'},
    climate: {label:'Termostato',icon:'🌡️',colSpan:1,rowSpan:2,color:'#fb923c'},
    multiline:{label:'Multi-Linea',icon:'📈',hours:24,colSpan:2,rowSpan:2,color:'#60a5fa'},
    bar:     {label:'Grafico Barre',icon:'📊',hours:24,colSpan:2,rowSpan:1,color:'#818cf8'},
    entities:{label:'Lista Entità',icon:'📋',colSpan:2,rowSpan:1,color:'#4ade80'},
    gauge:   {label:'Indicatore',icon:'🕐',colSpan:1,rowSpan:2,max:100,color:'#c084fc'},
    clock:   {label:'Orologio',icon:'⏰',colSpan:2,rowSpan:1,color:'#818cf8'},
    markdown:{label:'Testo',icon:'📝',colSpan:2,rowSpan:1,color:'#a78bfa',content:'<b>Titolo</b><br>Testo libero…'},
    appliances:{label:'Elettrodomestici',icon:'⚡',colSpan:2,rowSpan:2,color:'#fbbf24',threshold:5,items:[],groups:[
      {name:'luci',color:'#fbbf24',entities:[],showList:false},
      {name:'elettrodomestici',color:'#f97316',entities:[],showList:false},
      {name:'climatizzatori',color:'#60a5fa',entities:[],showList:true},
      {name:'tapparelle',color:'#818cf8',entities:[],showList:true},
      {name:'porte',color:'#4ade80',entities:[],showList:true}
    ]},
    'picture-elements':{label:'Casa',icon:'🏠',imageUrl:'casa.png',colSpan:3,rowSpan:2,color:'#818cf8',elements:[]},
    'free':{label:'Canvas',icon:'🎨',colSpan:2,rowSpan:2,color:'#818cf8',canvasW:360,canvasH:200,canvasBg:'var(--card)',canvasBorderRadius:'16px',canvasBorderStr:'1px solid var(--bd)',canvasPadding:'0px',canvasElements:[]},
    'header-bar':{label:'Header Personalizzato',icon:'⊞',colSpan:4,rowSpan:1,color:'#818cf8',left:[{id:uid(),type:'clock'}],center:[],right:[]},
    'footer-bar':{label:'Footer Bar',icon:'⊟',colSpan:4,rowSpan:1,color:'#2dd4bf',buttons:[
      {id:'__fb1',type:'climate',icon:'mdi:thermometer',label:'Clima',color:'#f87171',entity:'',clmMin:16,clmMax:36},
      {id:'__fb2',type:'navigate',icon:'mdi:home',label:'Casa',color:'#818cf8',navPage:0},
      {id:'__fb3',type:'link',icon:'mdi:lightning-bolt',label:'Energia',color:'#fbbf24',url:''},
    ]},
  }[type]||{};
  const page=curPage();
  const newCard={
    id:uid(),type,entity:'',label:'Nuova Card',icon:'📦',unit:'',color:'#818cf8',
    colSpan:1,rowSpan:1,max:0,min:0,sub:'',hours:24,content:'',imageUrl:'',elements:[],
    threshold:5,items:[],entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5,
    ...defs
  };
  _assignSection(page,newCard);
  page.cards.push(newCard);
  saveCfg(); renderDash(); openCM(newCard.id);
}


/* ═══ CARD ACTIONS ═══ */
function delCard(id){
  const card=curPage().cards.find(c=>c.id===id);
  const name=card?.label||card?.type||'questa card';
  showConfirm(`Eliminare <b>${name}</b>?`, ()=>{
    destroyChart(id); stopCamTimer(id);
    curPage().cards=curPage().cards.filter(c=>c.id!==id);
    saveCfg(); renderDash();
  });
}
function dupCard(id){
  const page=curPage();
  const cards=page.cards;
  const src=cards.find(c=>c.id===id); if(!src) return;
  const copy=JSON.parse(JSON.stringify(src));
  copy.id=uid();
  // Place copy at end of same section/column
  if(page.sections&&copy.secId){
    const siblings=page.cards.filter(c=>c.secId===copy.secId&&(c.secCol||0)===(copy.secCol||0));
    copy.secOrder=siblings.length>0?Math.max(...siblings.map(c=>c.secOrder||0))+10:(copy.secOrder||0)+10;
  }
  const idx=cards.findIndex(c=>c.id===id);
  cards.splice(idx+1,0,copy);
  saveCfg(); renderDash();
}
function swapC(fromId,toId){
  const page=curPage();
  const from=page.cards.find(c=>c.id===fromId);
  const to=page.cards.find(c=>c.id===toId);
  if(!from||!to) return;
  if(page.sections){
    // In sections: swap position only (secId, secCol, secOrder) — keep each card's own colSpan
    const fSec=from.secId,fCol=from.secCol||0,fOrd=from.secOrder||0;
    from.secId=to.secId; from.secCol=to.secCol||0; from.secOrder=to.secOrder||0;
    to.secId=fSec; to.secCol=fCol; to.secOrder=fOrd;
  } else {
    const cards=page.cards;
    const fi=cards.findIndex(c=>c.id===fromId);
    const ti=cards.findIndex(c=>c.id===toId);
    if(fi<0||ti<0) return;
    [cards[fi],cards[ti]]=[cards[ti],cards[fi]];
  }
  saveCfg(); renderDash();
}

/* ═══ GUESSERS ═══ */
function guessIcon(id,domain){
  if(domain==='weather') return '🌤️';
  if(domain==='camera') return '📷';
  if(domain==='media_player') return '🎵';
  if(domain==='climate') return '🌡️';
  if(id.includes('solar')||id.includes('inverter')||id.includes('pv')) return '☀️';
  if(id.includes('battery')||id.includes('soc')) return '🔋';
  if(id.includes('ford')||id.includes('elveh')) return '🚗';
  if(id.includes('frigo')||id.includes('fridge')) return '❄️';
  if(id.includes('scaldabagno')||id.includes('boiler')) return '🚿';
  if(id.includes('lavatrice')||id.includes('wash')) return '👕';
  if(domain==='light'||id.includes('light')) return '💡';
  if(id.includes('temp')) return '🌡️';
  if(id.includes('humid')||id.includes('umid')) return '💧';
  if(id.includes('power')||id.includes('consumo')) return '⚡';
  if(id.includes('cost')||id.includes('costo')||id.includes('bolletta')) return '💰';
  if(id.includes('door')||id.includes('porta')) return '🚪';
  if(id.includes('window')||id.includes('finestra')) return '🪟';
  if(domain==='switch'||domain==='input_boolean') return '🔘';
  return '📦';
}
function guessType(id,domain,unit){
  if(domain==='weather') return 'weather';
  if(domain==='camera') return 'camera';
  if(domain==='media_player') return 'media';
  if(domain==='climate') return 'climate';
  if(domain==='switch'||domain==='light'||domain==='input_boolean') return 'toggle';
  if(unit==='%') return 'gauge';
  if(unit==='W'||unit==='kWh'||unit==='€') return 'compact';
  return 'compact';
}
function guessMax(unit){
  if(unit==='W') return 3000; if(unit==='kWh') return 500;
  if(unit==='€') return 200;  if(unit==='%') return 100;
  if(unit==='°C') return 40;  return 0;
}

/* ═══ THEME + FONT ═══ */
const FONTS=[
  {id:'Inter',              label:'Inter'},
  {id:'Poppins',            label:'Poppins'},
  {id:'Nunito',             label:'Nunito'},
  {id:'Outfit',             label:'Outfit'},
  {id:'DM Sans',            label:'DM Sans'},
  {id:'Roboto',             label:'Roboto'},
  {id:'Open Sans',          label:'Open Sans'},
  {id:'Lato',               label:'Lato'},
  {id:'Montserrat',         label:'Montserrat'},
  {id:'Raleway',            label:'Raleway'},
  {id:'Ubuntu',             label:'Ubuntu'},
  {id:'Josefin Sans',       label:'Josefin Sans'},
  {id:'Quicksand',          label:'Quicksand'},
  {id:'Mulish',             label:'Mulish'},
  {id:'Jost',               label:'Jost'},
  {id:'Lexend',             label:'Lexend'},
  {id:'Figtree',            label:'Figtree'},
  {id:'Plus Jakarta Sans',  label:'Plus Jakarta Sans'},
  {id:'Space Grotesk',      label:'Space Grotesk'},
  {id:'Manrope',            label:'Manrope'},
  {id:'Barlow',             label:'Barlow'},
  {id:'Cabin',              label:'Cabin'},
  {id:'Karla',              label:'Karla'},
  {id:'Rubik',              label:'Rubik'},
  {id:'Work Sans',          label:'Work Sans'},
  {id:'Exo 2',              label:'Exo 2'},
  {id:'Oxanium',            label:'Oxanium'},
  {id:'Orbitron',           label:'Orbitron'},
  {id:'Rajdhani',           label:'Rajdhani'},
  {id:'Syne',               label:'Syne'},
];
/* ═══ TEMI COLORATI (accento + sfondo luminoso) — funzionano sia su base scura che chiara ═══ */
const COLOR_THEMES=[
  {id:'indaco',  name:'Indaco',   acc:'#6366f1', acc2:'#818cf8', bg:'#060810', panel:'#0c0e1c', panel2:'#12152a', g:['rgba(99,102,241,.30)','rgba(34,211,238,.16)','rgba(168,85,247,.18)']},
  {id:'oceano',  name:'Oceano',   acc:'#0ea5e9', acc2:'#38bdf8', bg:'#04090f', panel:'#0a1420', panel2:'#0e1d2e', g:['rgba(14,165,233,.34)','rgba(34,211,238,.20)','rgba(59,130,246,.18)']},
  {id:'menta',   name:'Menta',    acc:'#14b8a6', acc2:'#2dd4bf', bg:'#041010', panel:'#0a1c1a', panel2:'#0e2826', g:['rgba(20,184,166,.32)','rgba(45,212,191,.18)','rgba(56,189,248,.16)']},
  {id:'smeraldo',name:'Smeraldo', acc:'#10b981', acc2:'#34d399', bg:'#05100b', panel:'#0a1c15', panel2:'#0e281e', g:['rgba(16,185,129,.32)','rgba(52,211,153,.18)','rgba(20,184,166,.16)']},
  {id:'oro',     name:'Oro',      acc:'#f59e0b', acc2:'#fbbf24', bg:'#100d05', panel:'#1c170a', panel2:'#28210e', g:['rgba(245,158,11,.30)','rgba(251,191,36,.18)','rgba(249,115,22,.16)']},
  {id:'tramonto',name:'Tramonto', acc:'#f97316', acc2:'#fb923c', bg:'#100805', panel:'#1c110a', panel2:'#28180e', g:['rgba(249,115,22,.32)','rgba(251,146,60,.18)','rgba(244,63,94,.16)']},
  {id:'cremisi', name:'Cremisi',  acc:'#ef4444', acc2:'#f87171', bg:'#100507', panel:'#1c0b0f', panel2:'#280f15', g:['rgba(239,68,68,.32)','rgba(248,113,113,.18)','rgba(244,63,94,.16)']},
  {id:'rosa',    name:'Rosa',     acc:'#ec4899', acc2:'#f472b6', bg:'#100510', panel:'#1c0b1c', panel2:'#280f28', g:['rgba(236,72,153,.32)','rgba(244,114,182,.18)','rgba(168,85,247,.16)']},
  {id:'viola',   name:'Viola',    acc:'#a855f7', acc2:'#c084fc', bg:'#0b0510', panel:'#150b1c', panel2:'#1e0f28', g:['rgba(168,85,247,.34)','rgba(192,132,252,.18)','rgba(99,102,241,.16)']},
];
function applyColorTheme(id){
  const t=COLOR_THEMES.find(x=>x.id===id)||COLOR_THEMES[0];
  cfg.colorTheme=t.id;
  const r=document.documentElement.style;
  r.setProperty('--acc',t.acc); r.setProperty('--acc2',t.acc2);
  r.setProperty('--glow1',t.g[0]); r.setProperty('--glow2',t.g[1]); r.setProperty('--glow3',t.g[2]);
  // sfondo/pannelli tinti SOLO in modalità scura (in chiaro lascio i colori chiari)
  if(cfg.theme==='light'){ r.removeProperty('--bg'); r.removeProperty('--panel'); r.removeProperty('--panel2'); }
  else { r.setProperty('--bg',t.bg); r.setProperty('--panel',t.panel); r.setProperty('--panel2',t.panel2); }
  document.querySelectorAll('.ep-ctheme').forEach(b=>b.classList.toggle('on',b.dataset.theme===t.id));
  saveCfg(); renderDash();
}
function _renderColorThemes(){
  const el=document.getElementById('ep-ctheme-row'); if(!el) return;
  const cur=cfg.colorTheme||'indaco';
  el.innerHTML=COLOR_THEMES.map(t=>`<button class="ep-ctheme${t.id===cur?' on':''}" data-theme="${t.id}" title="${t.name}" data-action="applyColorTheme" data-action-arg="${t.id}" style="background:linear-gradient(135deg,${t.acc},${t.acc2})"></button>`).join('');
}
function applyTheme(t){
  cfg.theme=t;
  document.documentElement.dataset.theme=t==='light'?'light':'';
  document.getElementById('ep-theme-dark').classList.toggle('on',t!=='light');
  document.getElementById('ep-theme-light').classList.toggle('on',t==='light');
  try{ applyColorTheme(cfg.colorTheme||'indaco'); }catch(e){}   // riadatta sfondo tinto alla nuova modalità
  saveCfg();
  renderDash();
}
function applyFont(fid){
  cfg.font=fid;
  document.documentElement.style.setProperty('--font-family',`'${fid}',system-ui,sans-serif`);
  const lbl=document.getElementById('ep-font-lbl');
  if(lbl) lbl.style.fontFamily=`'${fid}',system-ui`;
  if(lbl) lbl.textContent=fid;
  document.getElementById('font-pop').classList.remove('show');
  _renderFontItems();
  saveCfg();
}
function _renderFontItems(){
  const cur=cfg.font||'Inter';
  document.getElementById('font-pop').innerHTML=FONTS.map(f=>
    `<div class="font-item${f.id===cur?' on':''}" data-action="applyFont" data-action-arg="${f.id}">
      <span style="font-family:'${f.id}',system-ui;font-size:12px">${f.label}</span>
      ${f.id===cur?'<span style="font-size:10px;opacity:.6">✓</span>':''}
    </div>`
  ).join('');
}
function toggleFontPop(evt){
  evt.stopPropagation();
  const pop=document.getElementById('font-pop');
  if(pop.classList.contains('show')){ pop.classList.remove('show'); return; }
  _renderFontItems();
  _positionPop(pop, evt.currentTarget);
  pop.classList.add('show');
}
function renderFontPick(){
  /* sync the button label with saved font */
  const lbl=document.getElementById('ep-font-lbl');
  const cur=cfg.font||'Inter';
  if(lbl){ lbl.textContent=cur; lbl.style.fontFamily=`'${cur}',system-ui`; }
}

/* ═══ UTILS → utils.js ═══ */

/* Close modals on outside click */
['emod','cmod','smod','imod','tmod','wmod'].forEach(id=>{
  document.getElementById(id).addEventListener('click',e=>{ if(e.target===e.currentTarget) document.getElementById(id).classList.add('off'); });
});

/* ═══ CARD CLICK ACTION ═══ */
function handleCardClick(card, e){
  if(editMode) return;
  if(e.target.closest('button,input,select,.toggle-track,.clm-btn,.mctrl-btn,.resize-handle')) return;
  if(card.type==='js-custom') return; // eventi gestiti internamente dalla Web Component
  const action=card.clickAction||'info';
  if(action==='none') return;
  if(action==='toggle')       doToggle(card.entity,card.id);
  else if(action==='link'&&card.clickUrl) window.open(card.clickUrl,'_blank');
  else {
    /* info: apri popup solo se c'è un'entità associata */
    if(card.entity) openInfoModal(card);
  }
}

/* ═══ INFO MODAL ═══ */
let _imChart=null;
function openInfoModal(card){
  const eid=card.entity;
  const val=hs[eid]??'—';
  const at=ha[eid]||{};
  const unit=at.unit_of_measurement||card.unit||'';
  const name=at.friendly_name||eid;
  const color=card.color||'#6366f1';
  const numV=parseFloat(val);
  const dispV=isNaN(numV)?_stateIt(val):(numV%1===0?numV:parseFloat(numV.toFixed(2)));

  document.getElementById('imod-title').textContent=(card.icon||'📦')+' '+name;

  const skip=['friendly_name','unit_of_measurement','icon','entity_picture','attribution','forecast','supported_features','supported_color_modes','hs_color','rgb_color','rgbw_color','xy_color','effect_list','source_list','preset_modes','fan_modes','swing_modes','hvac_modes','options'];
  const atRows=Object.entries(at)
    .filter(([k])=>!skip.includes(k))
    .map(([k,v])=>{
      let disp;
      if(Array.isArray(v)) disp=v.map(i=>_attrValIt(i)).join(', ');
      else if(typeof v==='object'&&v!==null) disp=JSON.stringify(v);
      else disp=_attrValIt(v);
      return `<tr><td class="at-key">${eh(_attrKeyIt(k))}</td><td class="at-val">${eh(String(disp))}</td></tr>`;
    }).join('');

  document.getElementById('imod-body').innerHTML=`
    <div class="im-hero">
      <span class="im-val" style="color:${color}">${dispV}</span>
      <span class="im-unit">${eh(unit)}</span>
    </div>
    <div class="im-eid">${eh(eid)}</div>
    ${atRows?`<table class="im-attr">${atRows}</table>`:''}
    <div class="im-mini"><canvas id="im-chart" width="380" height="80"></canvas></div>`;

  document.getElementById('imod').classList.remove('off');

  if(_imChart){ _imChart.destroy(); _imChart=null; }
  fetchHistory(eid,24).then(pts=>{
    const canvas=document.getElementById('im-chart');
    if(!canvas||!pts.length) return;
    const ctx=canvas.getContext('2d');
    const grad=ctx.createLinearGradient(0,0,0,80);
    grad.addColorStop(0,color+'55'); grad.addColorStop(1,color+'00');
    _imChart=new Chart(ctx,{
      type:'line',
      data:{labels:pts.map(p=>p.t),datasets:[{data:pts.map(p=>p.v),borderColor:color,borderWidth:1.5,backgroundColor:grad,fill:true,tension:0.3,pointRadius:0}]},
      options:{responsive:false,maintainAspectRatio:false,animation:{duration:400},
        plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false,backgroundColor:'rgba(10,12,24,0.9)',
          callbacks:{title:i=>{const d=new Date(i[0].label);return d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});},label:i=>` ${i.raw.toFixed(1)} ${unit}`}}},
        scales:{x:{display:false},y:{display:false}}}
    });
  });
}
function closeIM(){ document.getElementById('imod').classList.add('off'); }

/* ═══ WIZARD ═══ */
const WIZARD_DEFS = {
  meteo:{
    title:'🌤️ Configura Pagina Meteo',
    info:'La pagina meteo mostra icona animata in base alle condizioni, metriche in tempo reale, previsioni a 7 giorni e grafici storici.',
    fields:[
      {id:'wz-name',  label:'Nome pagina',                     type:'text',   ph:'Meteo Casa',              def:'Meteo'},
      {id:'wz-loc',   label:'Posizione (es. Milano · Italia)',  type:'text',   ph:'Casa · Italia'},
      {id:'wz-weather',label:'Entità Meteo (weather.*) ★',     type:'entity', ph:'weather.home'},
      {id:'wz-temp',  label:'Sensore Temperatura °C (opz.)',    type:'entity', ph:'sensor.temperatura_esterna'},
      {id:'wz-hum',   label:'Sensore Umidità % (opz.)',         type:'entity', ph:'sensor.umidita_esterna'},
      {id:'wz-wind',  label:'Sensore Vento km/h (opz.)',        type:'entity', ph:'sensor.vento_velocita'},
      {id:'wz-rain',  label:'Sensore Pioggia mm (opz.)',        type:'entity', ph:'sensor.pioggia_mm'},
      {id:'wz-uv',    label:'Sensore Indice UV (opz.)',         type:'entity', ph:'sensor.uv_index'},
      {id:'wz-pres',  label:'Sensore Pressione hPa (opz.)',     type:'entity', ph:'sensor.pressione_barometrica'},
      {id:'wz-hours', label:'Ore storico grafici',              type:'sel',    opts:[['6','6 ore'],['12','12 ore'],['24','24 ore',true],['48','48 ore'],['72','72 ore']]},
    ]
  },
  energia:{
    title:'⚡ Configura Pagina Energia',
    info:'La pagina energia mostra il flusso di potenza (solare→rete→casa), metriche di produzione/consumo e grafici storici.',
    fields:[
      {id:'wz-name',    label:'Nome pagina',                   type:'text',   ph:'Energia',              def:'Energia'},
      {id:'wz-solar',   label:'Sensore Solare W ★',            type:'entity', ph:'sensor.inverter_power'},
      {id:'wz-load',    label:'Sensore Carico Casa W ★',       type:'entity', ph:'sensor.consumo_power'},
      {id:'wz-grid',    label:'Sensore Rete W (opz., + esporta)',type:'entity',ph:'sensor.grid_power'},
      {id:'wz-battery', label:'Sensore Batteria W (opz.)',      type:'entity', ph:'sensor.battery_power'},
      {id:'wz-esolar',  label:'Energia FV oggi kWh (opz.)',     type:'entity', ph:'sensor.energia_solare_oggi'},
      {id:'wz-eload',   label:'Energia consumo oggi kWh (opz.)',type:'entity', ph:'sensor.energia_consumo_oggi'},
      {id:'wz-ebill',   label:'Spesa mensile € (opz.)',         type:'entity', ph:'sensor.costo_mensile'},
      {id:'wz-hours',   label:'Ore storico grafici',            type:'sel',    opts:[['6','6 ore'],['12','12 ore'],['24','24 ore',true],['48','48 ore']]},
    ]
  },
  veicoli:{
    title:'🚗 Configura Pagina Veicoli',
    info:'La pagina veicoli mostra stato batteria auto elettrica, autonomia, stato ricarica e storico.',
    fields:[
      {id:'wz-name',    label:'Nome pagina',                   type:'text',   ph:'Veicoli',              def:'Veicoli'},
      {id:'wz-soc',     label:'Sensore Batteria % ★',          type:'entity', ph:'sensor.ev_soc'},
      {id:'wz-range',   label:'Sensore Autonomia km (opz.)',    type:'entity', ph:'sensor.ev_range'},
      {id:'wz-charge',  label:'Sensore Stato Ricarica (opz.)', type:'entity', ph:'sensor.ev_charge_status'},
      {id:'wz-power',   label:'Sensore Potenza Ricarica W (opz.)',type:'entity',ph:'sensor.ev_charge_power'},
      {id:'wz-odo',     label:'Sensore Odometro km (opz.)',     type:'entity', ph:'sensor.ev_odometer'},
      {id:'wz-hours',   label:'Ore storico grafici',            type:'sel',    opts:[['24','24 ore'],['48','48 ore'],['72','72 ore',true],['168','7 giorni']]},
    ]
  },
  casa:{
    title:'🏠 Casa Overview — Immagine 3D',
    info:'Pagina principale con la casa 3D al centro: sensori sovrapposti sull\'immagine, meteo, energia e previsioni.',
    fields:[
      {id:'wz-name',    label:'Nome pagina',                    type:'text',   ph:'Casa',                 def:'Casa'},
      {id:'wz-weather', label:'Entità Meteo (weather.*) ★',    type:'entity', ph:'weather.home'},
      {id:'wz-loc',     label:'Posizione (opz.)',               type:'text',   ph:'Milano · Italia'},
      {id:'wz-solar',   label:'Solare / FV (W, opz.)',          type:'entity', ph:'sensor.inverter_power'},
      {id:'wz-load',    label:'Consumo Casa (W, opz.)',         type:'entity', ph:'sensor.consumo_power'},
      {id:'wz-grid',    label:'Rete Elettrica (W, opz.)',       type:'entity', ph:'sensor.grid_power'},
      {id:'wz-batt',    label:'Batteria % (opz.)',              type:'entity', ph:'sensor.battery_soc'},
      {id:'wz-car1',    label:'Auto 1 — Ricarica W (opz.)',     type:'entity', ph:'sensor.ev_charge_power'},
      {id:'wz-car2',    label:'Auto 2 — Ricarica W (opz.)',     type:'entity', ph:'sensor.ev2_charge_power'},
      {id:'wz-temp',    label:'Temperatura esterna (opz.)',     type:'entity', ph:'sensor.temperatura_esterna'},
      {id:'wz-hum',     label:'Umidità esterna (opz.)',         type:'entity', ph:'sensor.umidita_esterna'},
    ]
  }
};

function openWizard(tpl){
  closeTM();
  const def=WIZARD_DEFS[tpl];
  if(!def){ createPageFromTpl(tpl); return; }
  wizardTpl=tpl;
  document.getElementById('wmod-title').textContent=def.title;
  const info=document.getElementById('wmod-info');
  if(def.info){ info.style.display='block'; info.textContent=def.info; } else { info.style.display='none'; }
  document.getElementById('wmod-body').innerHTML=def.fields.map(f=>{
    let inp='';
    if(f.type==='entity'){
      inp=`<div class="finp-row"><input class="finp" id="${f.id}" type="text" placeholder="${f.ph||''}"><button class="fbtn" data-action="browseField" data-action-arg="${f.id}">🔍</button></div>`;
    } else if(f.type==='sel'){
      inp=`<select class="finp" id="${f.id}">${f.opts.map(o=>`<option value="${o[0]}"${o[2]?' selected':''}>${o[1]}</option>`).join('')}</select>`;
    } else {
      inp=`<input class="finp" id="${f.id}" type="text" placeholder="${f.ph||''}" value="${f.def||''}">`;
    }
    return `<div class="fr"><div class="flbl">${f.label}</div>${inp}</div>`;
  }).join('');
  document.getElementById('wmod').classList.remove('off');
}
function closeWM(){
  document.getElementById('wmod').classList.add('off');
  document.getElementById('wmod-btn').textContent='✨ Crea Pagina';
  wizardTpl=null; wizardEditing=false;
}

function saveWizard(){
  if(!wizardTpl) return;
  const isNew=!wizardEditing;
  if(wizardTpl==='meteo')         _saveMeteoWizard();
  else if(wizardTpl==='energia')  _saveEnergiaWizard();
  else if(wizardTpl==='veicoli')  _saveVeicoliWizard();
  else if(wizardTpl==='casa')     _saveCasaWizard();
  if(isNew) _postPageCreate();
  closeWM();
}

function _wizardVal(id){ const el=document.getElementById(id); return el?el.value.trim():''; }

function _updateEditPanelForPage(p){
  sf('ep-grid-sec',true);
  renderSectionsList();
}

function _saveMeteoWizard(){
  const wEnt  = _wizardVal('wz-weather')||'weather.home';
  const eTemp = _wizardVal('wz-temp');
  const eHum  = _wizardVal('wz-hum');
  const eWind = _wizardVal('wz-wind');
  const eRain = _wizardVal('wz-rain');
  const eUV   = _wizardVal('wz-uv');
  const ePres = _wizardVal('wz-pres');
  const hrs   = parseInt(_wizardVal('wz-hours'))||24;
  const cards=[];
  cards.push(_mkCard({type:'weather-hero',label:'Meteo',icon:'🌅',entity:wEnt,entity2:eTemp,entity3:eHum,color:'#22d3ee',colSpan:2,rowSpan:2}));
  if(eWind)  cards.push(_mkCard({type:'compact',label:'Vento',icon:'💨',entity:eWind,unit:'km/h',color:'#4ade80',max:100}));
  if(eRain)  cards.push(_mkCard({type:'compact',label:'Pioggia',icon:'🌧️',entity:eRain,unit:'mm',color:'#60a5fa',max:50}));
  if(eUV)    cards.push(_mkCard({type:'compact',label:'Indice UV',icon:'☀️',entity:eUV,unit:'',color:'#fbbf24',max:11}));
  if(ePres)  cards.push(_mkCard({type:'compact',label:'Pressione',icon:'🌡️',entity:ePres,unit:'hPa',color:'#a78bfa',max:1050}));
  cards.push(_mkCard({type:'weather-forecast',label:'Previsioni 7 giorni',icon:'📅',entity:wEnt,color:'#818cf8',colSpan:4,rowSpan:1}));
  if(eTemp)  cards.push(_mkCard({type:'history',label:'Temperatura',icon:'🌡️',entity:eTemp,unit:'°C',color:'#f97316',hours:hrs,colSpan:2,rowSpan:2}));
  if(eHum)   cards.push(_mkCard({type:'history',label:'Umidità',icon:'💧',entity:eHum,unit:'%',color:'#38bdf8',hours:hrs,colSpan:2,rowSpan:2}));
  if(!wizardEditing){
    const p={id:'p'+Math.random().toString(36).slice(2,7),name:_wizardVal('wz-name')||'Meteo',icon:'🌤️',columns:4,rowH:150,cards};
    _applyWizardCols(p);
    cfg.pages.push(p); cfg.activePage=cfg.pages.length-1;
  } else {
    const p=curPage(); p.name=_wizardVal('wz-name')||p.name; p.cards=cards;
  }
  wizardEditing=false; saveCfg(); closeWM(); renderDash();
}

function _saveEnergiaWizard(){
  const eSolar  = _wizardVal('wz-solar');
  const eLoad   = _wizardVal('wz-load');
  const eGrid   = _wizardVal('wz-grid');
  const eBatt   = _wizardVal('wz-battery');
  const eEsolar = _wizardVal('wz-esolar');
  const eEload  = _wizardVal('wz-eload');
  const eBill   = _wizardVal('wz-ebill');
  const hrs     = parseInt(_wizardVal('wz-hours'))||24;
  const cards=[];
  cards.push(_mkCard({type:'flowmap',label:'Flusso Energia',icon:'🗺️',solar:eSolar,load:eLoad,grid:eGrid,battery:eBatt,color:'#818cf8',colSpan:2,rowSpan:2}));
  if(eSolar) cards.push(_mkCard({type:'compact',label:'Potenza Solare',icon:'☀️',entity:eSolar,unit:'W',color:'#fbbf24',max:6000}));
  if(eLoad)  cards.push(_mkCard({type:'compact',label:'Consumo Casa',icon:'🏠',entity:eLoad,unit:'W',color:'#f87171',max:6000}));
  if(eGrid)  cards.push(_mkCard({type:'compact',label:'Rete Elettrica',icon:'⚡',entity:eGrid,unit:'W',color:'#60a5fa',max:6000}));
  if(eBatt)  cards.push(_mkCard({type:'gauge',label:'Batteria',icon:'🔋',entity:eBatt,unit:'%',color:'#4ade80',max:100,colSpan:1,rowSpan:2}));
  if(eEsolar)cards.push(_mkCard({type:'big',label:'Energia Solare',icon:'☀️',entity:eEsolar,unit:'kWh',color:'#fbbf24'}));
  if(eEload) cards.push(_mkCard({type:'big',label:'Energia Casa',icon:'🏠',entity:eEload,unit:'kWh',color:'#f87171'}));
  if(eBill)  cards.push(_mkCard({type:'big',label:'Bolletta Est.',icon:'💶',entity:eBill,unit:'€',color:'#a78bfa'}));
  if(eSolar) cards.push(_mkCard({type:'history',label:'Solare',icon:'☀️',entity:eSolar,unit:'W',color:'#fbbf24',hours:hrs,colSpan:2,rowSpan:2}));
  if(eLoad)  cards.push(_mkCard({type:'history',label:'Consumo',icon:'🏠',entity:eLoad,unit:'W',color:'#f87171',hours:hrs,colSpan:2,rowSpan:2}));
  if(eGrid)  cards.push(_mkCard({type:'history',label:'Rete',icon:'⚡',entity:eGrid,unit:'W',color:'#60a5fa',hours:hrs,colSpan:2,rowSpan:2}));
  if(!wizardEditing){
    const p={id:'p'+Math.random().toString(36).slice(2,7),name:_wizardVal('wz-name')||'Energia',icon:'⚡',columns:4,rowH:150,cards};
    _applyWizardCols(p);
    cfg.pages.push(p); cfg.activePage=cfg.pages.length-1;
  } else {
    const p=curPage(); p.name=_wizardVal('wz-name')||p.name; p.cards=cards;
  }
  wizardEditing=false; saveCfg(); closeWM(); renderDash();
}

function _saveVeicoliWizard(){
  const eSOC    = _wizardVal('wz-soc');
  const eRange  = _wizardVal('wz-range');
  const eCharge = _wizardVal('wz-charge');
  const ePower  = _wizardVal('wz-power');
  const eOdo    = _wizardVal('wz-odo');
  const hrs     = parseInt(_wizardVal('wz-hours'))||72;
  const cards=[];
  if(eSOC)    cards.push(_mkCard({type:'gauge',label:'Batteria',icon:'🔋',entity:eSOC,unit:'%',color:'#4ade80',max:100,colSpan:1,rowSpan:2}));
  if(eRange)  cards.push(_mkCard({type:'big',label:'Autonomia',icon:'🛣️',entity:eRange,unit:'km',color:'#60a5fa',colSpan:1,rowSpan:2}));
  if(ePower)  cards.push(_mkCard({type:'compact',label:'Potenza Carica',icon:'⚡',entity:ePower,unit:'kW',color:'#fbbf24',max:22,colSpan:2,rowSpan:1}));
  if(eCharge) cards.push(_mkCard({type:'text',label:'Stato Carica',icon:'🔌',entity:eCharge,color:'#a78bfa',colSpan:1,rowSpan:1}));
  if(eOdo)    cards.push(_mkCard({type:'big',label:'Odometro',icon:'📍',entity:eOdo,unit:'km',color:'#94a3b8',colSpan:1,rowSpan:1}));
  if(eSOC)    cards.push(_mkCard({type:'history',label:'SOC Batteria',icon:'🔋',entity:eSOC,unit:'%',color:'#4ade80',hours:hrs,colSpan:2,rowSpan:2}));
  if(eRange)  cards.push(_mkCard({type:'history',label:'Autonomia',icon:'🛣️',entity:eRange,unit:'km',color:'#60a5fa',hours:hrs,colSpan:2,rowSpan:2}));
  if(!wizardEditing){
    const p={id:'p'+Math.random().toString(36).slice(2,7),name:_wizardVal('wz-name')||'Veicoli',icon:'🚗',columns:4,rowH:150,cards};
    _applyWizardCols(p);
    cfg.pages.push(p); cfg.activePage=cfg.pages.length-1;
  } else {
    const p=curPage(); p.name=_wizardVal('wz-name')||p.name; p.cards=cards;
  }
  wizardEditing=false; saveCfg(); closeWM(); renderDash();
}

function _saveCasaWizard(){
  const wEnt  = _wizardVal('wz-weather')||'weather.home';
  const eSolar= _wizardVal('wz-solar');
  const eLoad = _wizardVal('wz-load');
  const eGrid = _wizardVal('wz-grid');
  const eBatt = _wizardVal('wz-batt');
  const eCar1 = _wizardVal('wz-car1');
  const eCar2 = _wizardVal('wz-car2');
  const eTemp = _wizardVal('wz-temp');
  const eHum  = _wizardVal('wz-hum');

  // Build picture-elements overlays for the house image
  const elements=[];
  if(eSolar) elements.push({entity:eSolar, x:62, y:10, icon:'☀️', suffix:' W',  color:'#FCD34D', size:13});
  if(eBatt)  elements.push({entity:eBatt,  x:86, y:38, icon:'🔋', suffix:'%',   color:'#4ade80', size:13});
  if(eGrid)  elements.push({entity:eGrid,  x:86, y:58, icon:'⚡', suffix:' W',  color:'#818cf8', size:12});
  if(eLoad)  elements.push({entity:eLoad,  x:44, y:70, icon:'🏠', suffix:' W',  color:'#f472b6', size:12});
  if(eCar1)  elements.push({entity:eCar1,  x:22, y:60, icon:'🚗', suffix:' W',  color:'#22d3ee', size:12});
  if(eCar2)  elements.push({entity:eCar2,  x:40, y:56, icon:'🚗', suffix:' W',  color:'#60a5fa', size:12});

  const cards=[];
  // Row 1-2, Col 1-2: Weather hero
  cards.push(_mkCard({type:'weather-hero',label:'Meteo',icon:'🌤️',entity:wEnt,entity2:eTemp,entity3:eHum,color:'#22d3ee',colSpan:2,rowSpan:2}));
  // Row 1-3, Col 3-5: House picture-elements
  cards.push(_mkCard({type:'picture-elements',label:'Casa',icon:'🏠',imageUrl:'casa.png',elements,color:'#818cf8',colSpan:3,rowSpan:3}));
  // Row 1-3, Col 6: Energy flowbars (if solar+load configured)
  if(eSolar||eLoad){
    cards.push(_mkCard({type:'flowbars',label:'Flusso Energia',icon:'⚡',solar:eSolar,load:eLoad,grid:eGrid,battery:eBatt?'':undefined,color:'#fbbf24',colSpan:1,rowSpan:3}));
  }
  // Row 3, Col 1: Solar compact
  if(eSolar) cards.push(_mkCard({type:'compact',label:'Solare',icon:'☀️',entity:eSolar,unit:'W',color:'#FCD34D',max:6000,colSpan:1,rowSpan:1}));
  // Row 3, Col 2: Load compact
  if(eLoad)  cards.push(_mkCard({type:'compact',label:'Consumo',icon:'🏠',entity:eLoad,unit:'W',color:'#f472b6',max:6000,colSpan:1,rowSpan:1}));
  // Row 4: Forecast strip
  cards.push(_mkCard({type:'weather-forecast',label:'Previsioni',icon:'📅',entity:wEnt,color:'#818cf8',colSpan:6,rowSpan:1}));

  if(!wizardEditing){
    const p={id:'p'+Math.random().toString(36).slice(2,7),name:_wizardVal('wz-name')||'Casa',icon:'🏠',columns:6,rowH:160,cards};
    _applyWizardCols(p);
    cfg.pages.push(p); cfg.activePage=cfg.pages.length-1;
  } else {
    const p=curPage(); p.name=_wizardVal('wz-name')||p.name; p.cards=cards; p.columns=6; p.rowH=160;
  }
  wizardEditing=false; saveCfg(); closeWM(); renderDash();
}

/* ═══ WEATHER HELPERS ═══ */
const WC={  // weather colors
  sunny:'#FCD34D','clear-night':'#A78BFA',cloudy:'#94A3B8',partlycloudy:'#7DD3FC',
  fog:'#94A3B8',rainy:'#60A5FA',pouring:'#3B82F6',lightning:'#FCD34D',
  'lightning-rainy':'#F59E0B',snowy:'#BAE6FD','snowy-rainy':'#7DD3FC',
  windy:'#4ADE80','windy-variant':'#34D399',hail:'#94A3B8',exceptional:'#F87171'
};
function wColor(c){ return WC[c]||'#6366f1'; }
function wClass(c){ return (c||'unknown').replace(/[^a-zA-Z]/g,'').toLowerCase(); }

/* ═══ WEATHER ANIMATED BACKGROUND ═══ */
const WT_GRADIENTS={
  'sunny':           'linear-gradient(160deg,#0d47a1 0%,#1976d2 30%,#e65100 75%,#f57c00 100%)',
  'clear-night':     'linear-gradient(160deg,#050518 0%,#0a1045 45%,#15063a 100%)',
  'partlycloudy':    'linear-gradient(160deg,#0d47a1 0%,#1976d2 45%,#546e7a 100%)',
  'cloudy':          'linear-gradient(160deg,#263238 0%,#37474f 50%,#546e7a 100%)',
  'overcast':        'linear-gradient(160deg,#1a1a2a 0%,#263238 55%,#37474f 100%)',
  'fog':             'linear-gradient(160deg,#37474f 0%,#607d8b 50%,#90a4ae 100%)',
  'rainy':           'linear-gradient(160deg,#0d1b5e 0%,#1a237e 40%,#1565c0 100%)',
  'pouring':         'linear-gradient(160deg,#050d2e 0%,#0d1b5e 45%,#1a237e 100%)',
  'lightning':       'linear-gradient(160deg,#12122a 0%,#1a1a35 45%,#0f3060 100%)',
  'lightning-rainy': 'linear-gradient(160deg,#12122a 0%,#16213e 45%,#0f3060 100%)',
  'snowy':           'linear-gradient(160deg,#1565c0 0%,#42a5f5 40%,#cfe8fa 100%)',
  'snowy-rainy':     'linear-gradient(160deg,#0d47a1 0%,#1565c0 40%,#607d8b 100%)',
  'hail':            'linear-gradient(160deg,#1a237e 0%,#283593 40%,#546e7a 100%)',
  'windy':           'linear-gradient(160deg,#004d40 0%,#00695c 40%,#0097a7 100%)',
  'windy-variant':   'linear-gradient(160deg,#003d33 0%,#00574a 40%,#006064 100%)',
  'exceptional':     'linear-gradient(160deg,#4a0060 0%,#6a1b9a 45%,#880e4f 100%)',
};
function _wtGrad(cond){ return WT_GRADIENTS[cond]||'linear-gradient(160deg,#1a3fa8 0%,#2055cc 100%)'; }

const _wtTimers={};
function _cleanupWeatherTimers(){
  Object.keys(_wtTimers).forEach(id=>{ clearTimeout(_wtTimers[id]); delete _wtTimers[id]; });
}

function _initWeatherBG(cardId,cond){
  const bg=document.getElementById('wtcbg-'+cardId);
  if(!bg) return;
  if(_wtTimers[cardId]){ clearTimeout(_wtTimers[cardId]); delete _wtTimers[cardId]; }
  bg.innerHTML='';
  const R=(a,b)=>a+Math.random()*(b-a);
  const N=(n,fn)=>{ for(let i=0;i<n;i++) fn(i); };

  function mkP(style){
    const d=document.createElement('div');
    d.className='wt-p';
    Object.assign(d.style,style);
    bg.appendChild(d);
  }

  // ── Sunny: light rays ──
  if(cond==='sunny'){
    for(let i=0;i<4;i++){
      const ray=document.createElement('div');
      ray.className='wt-ray';
      ray.style.left=(15+i*20)+'%';
      ray.style.animation=`wt-shine ${(3.5+i*0.8).toFixed(1)}s ${(i*1.1).toFixed(1)}s ease-in-out infinite`;
      ray.style.transform=`rotate(30deg)`;
      bg.appendChild(ray);
    }
    // warm glow at bottom-right
    const glow=document.createElement('div');
    glow.className='wt-cloud';
    Object.assign(glow.style,{width:'80%',height:'80%',right:'-20%',bottom:'-20%',background:'rgba(240,130,0,.18)',filter:'blur(30px)'});
    bg.appendChild(glow);
  }

  // ── Clear night: stars ──
  if(cond==='clear-night'){
    N(32,()=>{
      mkP({width:'2px',height:'2px',left:R(2,96)+'%',top:R(3,78)+'%',
        background:'#fff',borderRadius:'50%',
        animation:`wt-star ${R(1.4,3.2).toFixed(1)}s ${R(0,3.5).toFixed(1)}s ease-in-out infinite`,opacity:0});
    });
    // a couple of larger "bright" stars
    N(4,()=>{
      mkP({width:'3px',height:'3px',left:R(5,90)+'%',top:R(5,55)+'%',
        background:'rgba(200,215,255,.9)',borderRadius:'50%',
        animation:`wt-star ${R(2,4).toFixed(1)}s ${R(0,4).toFixed(1)}s ease-in-out infinite`,opacity:0,
        boxShadow:'0 0 4px 1px rgba(180,200,255,.5)'});
    });
  }

  // ── Cloud shapes for cloudy conditions ──
  const cloudyConds=['partlycloudy','cloudy','overcast','fog','windy','windy-variant','snowy-rainy'];
  if(cloudyConds.includes(cond)){
    const count=cond==='partlycloudy'?2:cond==='overcast'||cond==='fog'?5:3;
    const speed=cond.includes('windy')?5:14;
    const alpha=cond==='overcast'?0.12:cond==='fog'?0.22:0.08;
    for(let i=0;i<count;i++){
      const c=document.createElement('div');
      c.className='wt-cloud';
      Object.assign(c.style,{
        width:R(55,110)+'%',height:R(28,55)+'%',
        left:R(-15,55)+'%',top:R(i%2===0?-15:18,55)+'%',
        background:cond==='fog'?`rgba(195,215,230,${(alpha+0.08).toFixed(2)})`:`rgba(255,255,255,${alpha.toFixed(2)})`,
        animation:`wt-cld ${(speed+i*2.5).toFixed(0)}s ${(i*3).toFixed(0)}s ease-in-out infinite`,
      });
      bg.appendChild(c);
    }
  }

  // ── Rain ──
  if(cond==='rainy'||cond==='snowy-rainy'){
    N(36,()=>{ mkP({
      width:'1.5px',height:R(7,13)+'px',
      left:R(0,100)+'%',top:R(-8,88)+'%',
      background:'rgba(130,185,255,.55)',borderRadius:'2px',
      animation:`wt-rain ${R(0.75,1.4).toFixed(2)}s ${R(0,3.5).toFixed(2)}s linear infinite`
    }); });
  }

  // ── Pouring ──
  if(cond==='pouring'){
    N(60,()=>{ mkP({
      width:'2px',height:R(10,18)+'px',
      left:R(0,100)+'%',top:R(-8,88)+'%',
      background:'rgba(100,155,255,.65)',borderRadius:'2px',
      animation:`wt-rain ${R(0.4,0.8).toFixed(2)}s ${R(0,2).toFixed(2)}s linear infinite`
    }); });
  }

  // ── Lightning-rainy: rain + flash ──
  if(cond==='lightning-rainy'){
    N(32,()=>{ mkP({
      width:'1.5px',height:R(8,14)+'px',
      left:R(0,100)+'%',top:R(-8,88)+'%',
      background:'rgba(140,180,255,.55)',borderRadius:'2px',
      animation:`wt-rain ${R(0.65,1.2).toFixed(2)}s ${R(0,3).toFixed(2)}s linear infinite`
    }); });
  }

  // ── Lightning flash overlay ──
  if(cond==='lightning'||cond==='lightning-rainy'){
    const flash=document.createElement('div');
    flash.className='wt-ltn-flash';
    flash.id='wtlf-'+cardId;
    bg.appendChild(flash);
    function doFlash(){
      const el=document.getElementById('wtlf-'+cardId);
      if(!el) return;
      el.style.transition='none';
      el.style.background='rgba(180,220,255,.72)';
      setTimeout(()=>{ if(!el) return; el.style.transition='background .14s'; el.style.background='rgba(180,220,255,0)'; },55+Math.random()*60);
      if(Math.random()<0.45){
        setTimeout(()=>{ if(!el) return; el.style.transition='none'; el.style.background='rgba(180,220,255,.5)';
          setTimeout(()=>{ if(!el) return; el.style.transition='background .18s'; el.style.background='rgba(180,220,255,0)'; },40);
        },120+Math.random()*55);
      }
    }
    function sched(){
      if(!document.getElementById('wtlf-'+cardId)) return;
      _wtTimers[cardId]=setTimeout(()=>{ doFlash(); sched(); }, 2800+Math.random()*7000);
    }
    sched();
  }

  // ── Snow ──
  if(cond==='snowy'){
    N(30,()=>{
      const sz=R(3,7);
      mkP({width:sz+'px',height:sz+'px',
        left:R(0,100)+'%',top:R(-6,88)+'%',
        background:'rgba(220,238,255,.88)',borderRadius:'50%',
        animation:`wt-snow ${R(2.8,5.5).toFixed(2)}s ${R(0,4.5).toFixed(2)}s linear infinite`,opacity:0
      });
    });
  }

  // ── Hail ──
  if(cond==='hail'){
    N(24,()=>{
      const sz=R(4,8);
      mkP({width:sz+'px',height:sz+'px',
        left:R(0,100)+'%',top:R(-6,88)+'%',
        background:'rgba(195,225,255,.85)',borderRadius:'50%',
        boxShadow:'0 0 2px rgba(255,255,255,.4)',
        animation:`wt-hail ${R(0.3,0.65).toFixed(2)}s ${R(0,2.5).toFixed(2)}s linear infinite`,opacity:0
      });
    });
  }

  // ── Fog shimmer ──
  if(cond==='fog'){
    for(let i=0;i<4;i++){
      const c=document.createElement('div');
      c.className='wt-cloud';
      Object.assign(c.style,{
        width:R(70,130)+'%',height:R(32,60)+'%',
        left:R(-20,35)+'%',top:(i*18-10)+'%',
        background:'rgba(195,215,228,.28)',
        filter:'blur(20px)',
        animation:`wt-cld ${(9+i*3).toFixed(0)}s ${(i*2.5).toFixed(0)}s ease-in-out infinite`,
      });
      bg.appendChild(c);
    }
  }

  // ── Windy: fast cloud streaks ──
  if(cond==='windy'||cond==='windy-variant'){
    for(let i=0;i<3;i++){
      const c=document.createElement('div');
      c.className='wt-cloud';
      Object.assign(c.style,{
        width:R(60,100)+'%',height:R(12,24)+'%',
        left:R(-10,50)+'%',top:R(10+i*18,25+i*18)+'%',
        background:'rgba(255,255,255,.06)',
        filter:'blur(8px)',
        animation:`wt-cld ${(4+i*1.5).toFixed(1)}s ${(i*1.2).toFixed(1)}s ease-in-out infinite`,
      });
      bg.appendChild(c);
    }
  }
}

/* ═══ PAGE MANAGEMENT ═══ */
function renderPageTabs(){
  const tabs=document.getElementById('page-tabs');
  if(!tabs) return;
  tabs.innerHTML=cfg.pages.map((p,i)=>`
    <button class="ptab${i===cfg.activePage?' on':''}" data-action="setActivePage" data-action-args='[${i}]'>
      <span>${_renderIcon(p.icon||'📄',15)}</span>${p.name?`&nbsp;<span>${eh(p.name)}</span>`:''}
      ${editMode&&cfg.pages.length>1?`<span class="ptab-del" data-action="delPageByIdx" data-action-args='[${i}]' title="Elimina pagina">✕</span>`:''}
    </button>`).join('');
  if(editMode) tabs.innerHTML+=`<button class="ptab-add" data-action="openTM" title="Nuova pagina">＋</button>`;
}

function setActivePage(idx){
  if(idx===cfg.activePage) return;
  function _doSetActivePage(){
    cfg.activePage=idx;
    saveCfg();
    renderDash(); // also calls renderPageTabs
    if(editMode){
      const p=curPage();
      document.getElementById('ep-page-ico').value=p.icon||'📄';
      document.getElementById('ep-page-name').value=p.name||'Pagina';
      { const _e=document.getElementById('ep-view-title'); if(_e) _e.value=p.viewTitle||''; }
      document.getElementById('ep-del-page').style.display=cfg.pages.length>1?'block':'none';
      renderSectionsList();
      _updateEditPanelForPage(p);
      _pgSnapshot();
    }
  }
  if(editMode){
    _pgCheckDirtyAndProceed(_doSetActivePage);
  } else {
    _doSetActivePage();
  }
}

/* ═══ MENÙ A TENDINA VISTE (icona header, disponibile in tutte le viste) ═══ */
function toggleViewsMenu(ev){
  if(ev) ev.stopPropagation();
  if(document.getElementById('views-menu')){ closeViewsMenu(); return; }
  const menu=document.createElement('div');
  menu.id='views-menu'; menu.className='views-menu';
  const items=(cfg.pages||[]).map((p,i)=>`<div class="vm-item${i===cfg.activePage?' on':''}">
      <div class="vm-go" data-action="_closeViewsAndSetPage" data-action-args='[${i}]'
        <span class="vm-ico">${_renderIcon(p.icon||'📄',16)}</span>
        <span class="vm-name">${eh(p.name||('Vista '+(i+1)))}</span>
        ${i===cfg.activePage?'<span class="vm-chk">✓</span>':''}
      </div>
      <button class="vm-edit" data-action="editView" data-action-args='[${i}]' title="Rinomina / icona / elimina">✏️</button>
    </div>`).join('');
  menu.innerHTML=`<div class="vm-hdr">Viste (${(cfg.pages||[]).length})</div>${items}<div class="vm-sep"></div>`+
    `<button class="vm-add" data-action="_closeViewsAndOpenTM"><i class="mdi mdi-plus"></i> Aggiungi vista</button>`;
  document.body.appendChild(menu);
  const btn=document.getElementById('views-btn');
  if(btn && btn.offsetParent!==null){   // bottone visibile (desktop): posiziona sotto di esso
    const r=btn.getBoundingClientRect();
    menu.style.top=(r.bottom+6)+'px';
    menu.style.right=Math.max(8,(window.innerWidth-r.right))+'px';
  } else {                               // bottone nascosto (mobile, aperto dal FAB): posiziona a destra in alto
    menu.style.top='60px'; menu.style.right='14px';
  }
  setTimeout(()=>document.addEventListener('click',_viewsOutside),0);
}
function closeViewsMenu(){ const m=document.getElementById('views-menu'); if(m) m.remove(); document.removeEventListener('click',_viewsOutside); }
function _viewsOutside(e){ const m=document.getElementById('views-menu'),b=document.getElementById('views-btn'); if(m&&!m.contains(e.target)&&b&&!b.contains(e.target)) closeViewsMenu(); }
/* ═══ FAB MOBILE: un'unica icona a destra con dentro tutte le azioni dell'header ═══ */
function toggleMobileMenu(ev){
  if(ev) ev.stopPropagation();
  if(document.getElementById('mfab-menu')){ closeMobileMenu(); return; }
  closeViewsMenu(); closeNotifCenter && closeNotifCenter();
  const menu=document.createElement('div');
  menu.id='mfab-menu'; menu.className='mfab-menu';
  const it=(ico,lbl,fn,cls='')=>`<button class="mfab-item ${cls}" data-action="closeMobileMenu" data-action2="${fn.replace(/\(\)$/,'')}"><span class="mfab-ic">${ico}</span><span>${lbl}</span></button>`;
  const editing=document.body.classList.contains('editing');
  const kioskOn=document.body.classList.contains('kiosk');
  menu.innerHTML=
    (editing?it('<i class="mdi mdi-undo-variant"></i>','Annulla','undoEdit()')+it('<i class="mdi mdi-redo-variant"></i>','Ripeti','redoEdit()'):'')+
    it('<i class="mdi mdi-view-dashboard"></i>','Viste','_mfabViews()')+
    it('<i class="mdi mdi-bell"></i>','Notifiche','toggleNotifCenter()')+
    it('<i class="mdi mdi-pencil"></i>',editing?'Esci da modifica':'Modifica','toggleEdit()')+
    it('<i class="mdi mdi-fullscreen"></i>',kioskOn?'Esci da Kiosk':'Kiosk','toggleKiosk()')+
    it('<i class="mdi mdi-refresh"></i>','Ricarica','hardReload()')+
    it('<i class="mdi mdi-cog"></i>','Impostazioni','openOikSettings()')+
    it('<i class="mdi mdi-menu"></i>','Barra laterale HA','toggleHASidebar()')+
    it('<i class="mdi mdi-restart"></i>','Riavvia Home Assistant','confirmRestartHA()','danger');
  document.body.appendChild(menu);
  const b=document.getElementById('mfab');
  if(b){ const r=b.getBoundingClientRect(); menu.style.top=(r.bottom+6)+'px'; menu.style.right=Math.max(8,(window.innerWidth-r.right))+'px'; }
  else { menu.style.top='56px'; menu.style.right='10px'; }
  setTimeout(()=>document.addEventListener('click',_mfabOutside),0);
}
function closeMobileMenu(){ const m=document.getElementById('mfab-menu'); if(m) m.remove(); document.removeEventListener('click',_mfabOutside); }
function _mfabOutside(e){ const m=document.getElementById('mfab-menu'),b=document.getElementById('mfab'); if(m&&!m.contains(e.target)&&b&&!b.contains(e.target)) closeMobileMenu(); }
function _mfabViews(){ setTimeout(()=>toggleViewsMenu(),10); }
/* Editor di una vista: nome, icona, elimina */
let _vmodIdx=null;
function editView(idx){
  closeViewsMenu();
  const p=cfg.pages[idx]; if(!p) return;
  _vmodIdx=idx;
  document.getElementById('vmod-name').value=p.name||'';
  document.getElementById('vmod-ico').value=p.icon||'';
  document.getElementById('vmod-del').style.display=cfg.pages.length>1?'':'none';
  document.getElementById('vmod').classList.remove('off');
  setTimeout(()=>{ const n=document.getElementById('vmod-name'); if(n){ n.focus(); n.select(); } },80);
}
function closeViewEdit(){ document.getElementById('vmod').classList.add('off'); _vmodIdx=null; }
function saveViewEdit(){
  const p=cfg.pages[_vmodIdx]; if(!p){ closeViewEdit(); return; }
  const nm=(document.getElementById('vmod-name').value||'').trim();
  const ic=(document.getElementById('vmod-ico').value||'').trim();
  p.name=nm||p.name||'Vista';
  p.icon=ic||p.icon||'📄';
  saveCfg(); renderDash(); try{ renderPageTabs(); }catch(e){}
  // aggiorna i campi del pannello modifica se è la pagina corrente
  if(_vmodIdx===cfg.activePage && editMode){ try{ document.getElementById('ep-page-name').value=p.name; document.getElementById('ep-page-ico').value=p.icon; }catch(e){} }
  closeViewEdit(); showToast('✅ Vista aggiornata');
}
function deleteViewFromEdit(){
  if(cfg.pages.length<=1){ showToast('⚠️ Non puoi eliminare l\'unica vista'); return; }
  const idx=_vmodIdx, p=cfg.pages[idx]; if(!p) return;
  showConfirm(`Eliminare la vista <b>${eh(p.name||'senza nome')}</b>?<br><span style="font-size:11px;opacity:.7">Verranno eliminate anche le card al suo interno.</span>`, ()=>{
    cfg.pages.splice(idx,1);
    cfg.activePage=Math.min(cfg.activePage,cfg.pages.length-1);
    saveCfg(); renderDash(); try{ renderPageTabs(); }catch(e){}
    closeViewEdit(); showToast('🗑 Vista eliminata');
  }, 'Elimina');
}
/* "Aggiungi vista" crea DIRETTAMENTE una vista vuota (niente più scelta template) e ci entra in modifica */
function addEmptyView(){
  _createPageWithCols('vuota','Nuova vista',1);   // 1 colonna / 1 riga — poi l'utente aumenta come vuole
  if(!editMode) toggleEdit();
  setTimeout(()=>editView(cfg.activePage), 60);   // apri subito l'editor per nome/icona
}
function openTM(){ addEmptyView(); }   // alias: ogni "aggiungi vista" ora crea una vista vuota
function closeTM(){
  document.getElementById('tmod').classList.add('off');
  // Resetta sempre allo step 1
  document.getElementById('tmod-step1').style.display='block';
  document.getElementById('tmod-step2').style.display='none';
  document.getElementById('tmod-title').textContent='📄 Nuova Pagina — scegli template';
}

let _newPageCols=4;
let _pendingTpl='vuota';
let _pendingWizardCols=4;

function openPageCfg(tplName){
  _pendingTpl=tplName;
  _newPageCols=4;
  document.getElementById('tmod-step1').style.display='none';
  document.getElementById('tmod-step2').style.display='block';
  document.getElementById('tmod-title').textContent='📄 Configura Nuova Pagina';
  const tpl=PAGE_TEMPLATES[tplName]||PAGE_TEMPLATES.vuota;
  document.getElementById('epw-name').value=tpl.name||'Nuova Pagina';
  _renderColCountBtns();
  _renderColPreview();
}
function closeTModStep2(){
  document.getElementById('tmod-step1').style.display='block';
  document.getElementById('tmod-step2').style.display='none';
  document.getElementById('tmod-title').textContent='📄 Nuova Pagina — scegli template';
}
function _renderColCountBtns(){
  const wrap=document.getElementById('epw-sec-btns'); if(!wrap) return;
  wrap.innerHTML=[1,2,3,4].map(n=>
    `<button class="epw-scnt${n===_newPageCols?' on':''}" data-action="_setNewPageCols" data-action-args='[${n}]'>${n}</button>`
  ).join('');
}
function _setNewPageCols(n){ _newPageCols=n; _renderColCountBtns(); _renderColPreview(); }
function _renderColPreview(){
  const wrap=document.getElementById('epw-preview'); if(!wrap) return;
  let cols='';
  for(let i=0;i<_newPageCols;i++) cols+=`<div class="tmod-col-ph">Trascina qui</div>`;
  wrap.innerHTML=`<div class="tmod-col-preview" style="grid-template-columns:repeat(${_newPageCols},1fr)">${cols}</div>`;
}
function confirmPage(){
  const name=document.getElementById('epw-name').value.trim()||'Nuova Pagina';
  _pendingWizardCols=_newPageCols;
  closeTM();
  const wizardTpls=['energia','meteo','veicoli','casa'];
  if(wizardTpls.includes(_pendingTpl)){
    openWizard(_pendingTpl);
    const wn=document.getElementById('wz-name');
    if(wn) wn.value=name;
  } else {
    _createPageWithCols(_pendingTpl, name, _newPageCols);
  }
}
function _createPageWithCols(tplName, name, cols){
  const tpl=PAGE_TEMPLATES[tplName]||PAGE_TEMPLATES.vuota;
  const secId=_secUid();
  const newPage={
    id:'p'+Math.random().toString(36).slice(2,7),
    name:name||tpl.name, icon:tpl.icon, columns:cols, rowH:tpl.rowH||150,
    sections:[{id:secId,cols:cols,rowH:tpl.rowH||150,label:''}],
    cards:tpl.cards.map((c,i)=>{
      const card={
        entity:'',sub:'',hours:24,min:0,max:0,
        entity2:'',entity3:'',solar:'',load:'',grid:'',battery:'',refresh:5,
        clickAction:'info',clickUrl:'',
        ...c, id:uid()
      };
      if(card.type!=='header-bar'){
        card.secId=secId;
        card.secCol=(c.secCol||0)%cols;
        card.secOrder=i*10;
      }
      return card;
    })
  };
  cfg.pages.push(newPage);
  cfg.activePage=cfg.pages.length-1;
  saveCfg(); renderDash(); _postPageCreate();
}
function _applyWizardCols(page){
  const cols=_pendingWizardCols||4;
  const secId=_secUid();
  page.sections=[{id:secId,cols:cols,rowH:150,label:''}];
  page.cards.filter(c=>c.type!=='header-bar').forEach((c,i)=>{
    c.secId=secId; c.secCol=(c.secCol||0)%cols; c.secOrder=i*10;
  });
  _pendingWizardCols=4;
}
function _postPageCreate(){
  if(!editMode) return;
  const p=curPage();
  document.getElementById('ep-page-ico').value=p.icon||'📄';
  document.getElementById('ep-page-name').value=p.name;
  document.getElementById('ep-del-page').style.display=cfg.pages.length>1?'block':'none';
  renderSectionsList();
  if(!_epGroupState.pgpage) _epToggleGroup('pgpage');
  _pgSnapshot();
}

const PAGE_TEMPLATES={
  energia:{name:'Energia',icon:'⚡',columns:4,rowH:150,cards:[
    {type:'flowmap',label:'Flusso Energia',icon:'🗺️',solar:'',load:'',grid:'',battery:'',color:'#fbbf24',colSpan:2,rowSpan:2,max:6000,unit:'W'},
    {type:'big',label:'Fotovoltaico',icon:'☀️',unit:'W',color:'#fbbf24',colSpan:1,rowSpan:1,max:3000},
    {type:'big',label:'Carico Casa',icon:'🏠',unit:'W',color:'#818cf8',colSpan:1,rowSpan:1,max:6000},
    {type:'compact',label:'Energia Oggi',icon:'📅',unit:'kWh',color:'#c084fc',colSpan:1,rowSpan:1,max:30},
    {type:'compact',label:'Bolletta Mese',icon:'💰',unit:'€',color:'#4ade80',colSpan:1,rowSpan:1,max:300},
    {type:'history',label:'Produzione Storico',icon:'📈',unit:'W',color:'#fbbf24',colSpan:4,rowSpan:2,hours:24},
  ]},
  luci:{name:'Luci',icon:'💡',columns:4,rowH:150,cards:[
    {type:'toggle',label:'Luce Soggiorno',icon:'💡',color:'#fbbf24',colSpan:1,rowSpan:1},
    {type:'toggle',label:'Luce Camera da Letto',icon:'💡',color:'#fbbf24',colSpan:1,rowSpan:1},
    {type:'toggle',label:'Luce Cucina',icon:'💡',color:'#fbbf24',colSpan:1,rowSpan:1},
    {type:'toggle',label:'Luce Bagno',icon:'💡',color:'#60a5fa',colSpan:1,rowSpan:1},
    {type:'toggle',label:'Luce Esterno',icon:'🔦',color:'#fb923c',colSpan:1,rowSpan:1},
    {type:'toggle',label:'Presa Smart',icon:'🔌',color:'#4ade80',colSpan:1,rowSpan:1},
    {type:'entities',label:'Stato Luci',icon:'💡',color:'#fbbf24',colSpan:2,rowSpan:1},
  ]},
  clima:{name:'Clima',icon:'🌡️',columns:4,rowH:150,cards:[
    {type:'climate',label:'Termostato',icon:'🌡️',color:'#fb923c',colSpan:2,rowSpan:2,unit:'°C'},
    {type:'gauge',label:'Temperatura',icon:'🌡️',unit:'°C',color:'#fb923c',colSpan:1,rowSpan:2,max:40,min:0},
    {type:'gauge',label:'Umidità',icon:'💧',unit:'%',color:'#22d3ee',colSpan:1,rowSpan:2,max:100,min:0},
    {type:'history',label:'Storico Temperatura',icon:'📈',unit:'°C',color:'#fb923c',colSpan:2,rowSpan:2,hours:24},
    {type:'history',label:'Storico Umidità',icon:'📈',unit:'%',color:'#22d3ee',colSpan:2,rowSpan:2,hours:24},
  ]},
  sicurezza:{name:'Sicurezza',icon:'📷',columns:4,rowH:150,cards:[
    {type:'camera',label:'Camera 1',icon:'📷',color:'#818cf8',colSpan:2,rowSpan:2,refresh:5},
    {type:'camera',label:'Camera 2',icon:'📷',color:'#818cf8',colSpan:2,rowSpan:2,refresh:5},
    {type:'entities',label:'Sensori Porta/Finestra',icon:'🚪',color:'#4ade80',colSpan:2,rowSpan:1},
    {type:'entities',label:'Sensori Movimento',icon:'🚶',color:'#f59e0b',colSpan:2,rowSpan:1},
  ]},
  media:{name:'Media',icon:'🎵',columns:4,rowH:150,cards:[
    {type:'media',label:'Soggiorno',icon:'🔊',color:'#f472b6',colSpan:4,rowSpan:2},
    {type:'media',label:'Camera da Letto',icon:'🔊',color:'#a78bfa',colSpan:4,rowSpan:2},
  ]},
  meteo:{name:'Meteo',icon:'🌤️',columns:4,rowH:150,cards:[
    {type:'weather',label:'Meteo Casa',icon:'🌤️',color:'#22d3ee',colSpan:2,rowSpan:2},
    {type:'gauge',label:'Temperatura Esterna',icon:'🌡️',unit:'°C',color:'#fb923c',colSpan:1,rowSpan:2,max:45,min:-10},
    {type:'gauge',label:'Umidità Esterna',icon:'💧',unit:'%',color:'#22d3ee',colSpan:1,rowSpan:2,max:100,min:0},
    {type:'history',label:'Temperatura Storico',icon:'📈',unit:'°C',color:'#fb923c',colSpan:4,rowSpan:2,hours:48},
  ]},
  veicoli:{name:'Veicoli',icon:'🚗',columns:4,rowH:150,cards:[
    {type:'gauge',label:'Batteria EV',icon:'🔋',unit:'%',color:'#4ade80',colSpan:1,rowSpan:2,max:100,min:0},
    {type:'compact',label:'Autonomia',icon:'🛣️',unit:'km',color:'#60a5fa',colSpan:1,rowSpan:1,max:500},
    {type:'text',label:'Stato Ricarica',icon:'⚡',unit:'',color:'#fbbf24',colSpan:1,rowSpan:1},
    {type:'compact',label:'Energia Ricarica Oggi',icon:'⚡',unit:'kWh',color:'#4ade80',colSpan:1,rowSpan:1,max:80},
    {type:'history',label:'Storico Batteria',icon:'📈',unit:'%',color:'#4ade80',colSpan:3,rowSpan:2,hours:72},
  ]},
  vuota:{name:'Nuova Pagina',icon:'📄',columns:4,rowH:150,cards:[]}
};

function createPageFromTpl(tplName){
  closeTM();
  const tpl=PAGE_TEMPLATES[tplName]||PAGE_TEMPLATES.vuota;
  const newPage={
    id:'p'+Math.random().toString(36).slice(2,7),
    name:tpl.name, icon:tpl.icon,
    columns:tpl.columns||4, rowH:tpl.rowH||150,
    cards:tpl.cards.map(c=>({
      id:uid(), entity:'', sub:'', hours:24, min:0, max:0,
      entity2:'', entity3:'', solar:'', load:'', grid:'', battery:'', refresh:5,
      clickAction:'info', clickUrl:'',
      ...c
    }))
  };
  cfg.pages.push(newPage);
  cfg.activePage=cfg.pages.length-1;
  saveCfg(); renderDash();
  if(editMode){
    const p=curPage();
    document.getElementById('ep-page-ico').value=p.icon||'📄';
    document.getElementById('ep-page-name').value=p.name;
    document.getElementById('ep-del-page').style.display=cfg.pages.length>1?'block':'none';
    renderSectionsList();
    // Auto-apre "Pagina & Griglia" così l'utente vede subito le sezioni
    if(!_epGroupState.pgpage) _epToggleGroup('pgpage');
  }
}

function delPage(){
  if(cfg.pages.length<=1){ alert('Non puoi eliminare l\'unica pagina presente.'); return; }
  if(!confirm(`Eliminare la pagina "${curPage().name}"? Tutte le card verranno cancellate.`)) return;
  curPage().cards.forEach(c=>{ destroyChart(c.id); stopCamTimer(c.id); });
  cfg.pages.splice(cfg.activePage,1);
  cfg.activePage=Math.min(cfg.activePage,cfg.pages.length-1);
  saveCfg(); renderDash();
  if(editMode){
    const p=curPage();
    document.getElementById('ep-page-ico').value=p.icon||'📄';
    document.getElementById('ep-page-name').value=p.name;
    document.getElementById('ep-del-page').style.display=cfg.pages.length>1?'block':'none';
    renderSectionsList();
  }
}

function delPageByIdx(idx,e){
  e.stopPropagation();
  if(cfg.pages.length<=1){ alert('Non puoi eliminare l\'unica pagina presente.'); return; }
  const pageName=cfg.pages[idx].name;
  if(!confirm(`Eliminare la pagina "${pageName}"? Tutte le card verranno cancellate.`)) return;
  cfg.pages[idx].cards.forEach(c=>{ destroyChart(c.id); stopCamTimer(c.id); });
  cfg.pages.splice(idx,1);
  cfg.activePage=Math.min(cfg.activePage,cfg.pages.length-1);
  saveCfg(); renderDash();
  if(editMode){
    const p=curPage();
    document.getElementById('ep-page-ico').value=p.icon||'📄';
    document.getElementById('ep-page-name').value=p.name;
    document.getElementById('ep-del-page').style.display=cfg.pages.length>1?'block':'none';
    renderSectionsList();
    _pgSnapshot();
  }
}

/* ═══ PAGE SETTINGS DIRTY TRACKING ═══ */
let _pgDirty=false;
let _pgOriginal={};

function _pgSnapshot(){
  const p=curPage();
  _pgOriginal={
    icon:p.icon||'📄',
    name:p.name||'',
    viewTitle:p.viewTitle||'',
    sections:JSON.parse(JSON.stringify(p.sections||[]))
  };
  _pgDirty=false;
  _pgUpdateConfirmBtn();
}
function _pgMarkDirty(fromLayout){
  _pgDirty=true;
  _pgUpdateConfirmBtn();
  if(!fromLayout){
    // live preview nel tab solo per campi testo (non da layout)
    const p=curPage();
    const ico=document.getElementById('ep-page-ico')?.value.trim();
    const nm=document.getElementById('ep-page-name')?.value;
    if(ico) p.icon=ico;
    if(nm!=null) p.name=nm.trim();
    renderPageTabs();
  }
}
function _pgUpdateConfirmBtn(){
  const btn=document.getElementById('ep-pg-confirm');
  if(!btn) return;
  btn.classList.toggle('dirty',_pgDirty);
  btn.disabled=!_pgDirty;
}
function confirmPageSettings(){
  if(!_pgDirty) return;
  const p=curPage();
  const ico=document.getElementById('ep-page-ico').value.trim();
  const nm=document.getElementById('ep-page-name').value.trim();
  const _vtEl=document.getElementById('ep-view-title');
  if(ico) p.icon=ico;
  p.name=nm;
  if(_vtEl) p.viewTitle=_vtEl.value.trim();
  saveCfg(); renderPageTabs();
  _pgSnapshot();
  showToast('✓ Impostazioni pagina salvate');
}
function cancelPageSettings(){
  const p=curPage();
  p.icon=_pgOriginal.icon;
  p.name=_pgOriginal.name;
  p.viewTitle=_pgOriginal.viewTitle;
  // ripristina sezioni dal snapshot
  if(_pgOriginal.sections){
    p.sections=JSON.parse(JSON.stringify(_pgOriginal.sections));
    saveCfg(); renderDash(); renderSectionsList();
  }
  document.getElementById('ep-page-ico').value=_pgOriginal.icon||'📄';
  document.getElementById('ep-page-name').value=_pgOriginal.name||'';
  { const _e=document.getElementById('ep-view-title'); if(_e) _e.value=_pgOriginal.viewTitle||''; }
  _pgDirty=false;
  _pgUpdateConfirmBtn();
  renderPageTabs();
}
let _pgProceedCb=null;
function _pgCheckDirtyAndProceed(proceed){
  if(!_pgDirty){ proceed(); return; }
  _pgProceedCb=proceed;
  const overlay=document.createElement('div');
  overlay.className='pg-warn-ov';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
  overlay.innerHTML=`<div style="background:var(--panel);border:1px solid var(--bd);border-radius:16px;padding:24px 22px;max-width:300px;width:90%;text-align:center">
    <div style="font-size:22px;margin-bottom:10px">⚠️</div>
    <div style="font-size:13px;font-weight:700;margin-bottom:6px">Modifiche non salvate</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:18px">Hai modificato le impostazioni della pagina senza salvare.</div>
    <div style="display:flex;flex-direction:column;gap:7px">
      <button data-action="_pgWarnSaveAndProceed" style="padding:9px;border-radius:9px;background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.4);color:#4ade80;font-size:12px;font-weight:700">✓ Salva e continua</button>
      <button data-action="_pgWarnCancelAndProceed" style="padding:9px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid var(--bd2);color:var(--muted);font-size:12px;font-weight:700">↩ Annulla modifiche e continua</button>
      <button data-action="_pgWarnClose" style="padding:9px;border-radius:9px;background:transparent;border:none;color:var(--muted);font-size:11px">✕ Resta qui</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}
function _pgWarnSaveAndProceed(){
  confirmPageSettings();
  document.querySelector('.pg-warn-ov')?.remove();
  const cb=_pgProceedCb; _pgProceedCb=null; if(cb) cb();
}
function _pgWarnCancelAndProceed(){
  cancelPageSettings();
  document.querySelector('.pg-warn-ov')?.remove();
  const cb=_pgProceedCb; _pgProceedCb=null; if(cb) cb();
}

function updatePageMeta(){
  // legacy – mantenuto per compatibilità con chiamate esterne
  _pgMarkDirty();
}

/* ═══ FOOTER BAR ═══ */
function fbarInner(card){
  const btns=card.buttons||[];
  if(!btns.length) return `<div class="fbar-bar"><div style="font-size:10px;opacity:.3">Clicca ✏️ per aggiungere pulsanti</div></div>`;
  const html=btns.map(b=>{
    if(b.type==='sep') return `<div class="fbar-sep-v"></div>`;
    const col=b.color||'rgba(255,255,255,.5)';
    // compute CSS vars for active glow
    const colRgb=_hexToRgbStr(col)||'255,255,255';
    const style=`--fbi-col:${col};--fbi-bg:${col}1e;--fbi-sh:${col}4d`;
    // check active state for climate (current entity on or heating)
    let active=false;
    if(b.type==='climate'&&b.entity){
      const st=hs[b.entity]||'';
      active=st==='heat'||st==='cool'||st==='auto'||st==='heat_cool';
    }
    return `<div class="fbar-ibtn${active?' fbar-active':''}" style="${style}" data-action="fbarBtnClick" data-action-args='["${card.id}","${b.id}"]' data-cid="${card.id}" data-bid="${b.id}">
      <div class="fbar-ibtn-ring">${_renderIcon(b.icon||'mdi:circle-outline',22,col)}</div>
      ${b.label?`<div class="fbar-ibtn-lbl">${eh(b.label)}</div>`:''}
    </div>`;
  }).join('');
  return `<div class="fbar-bar"><div class="fbar-btns-row">${html}</div></div>`;
}

function _hexToRgbStr(hex){
  if(!hex||!hex.startsWith('#')) return null;
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  if(isNaN(r)||isNaN(g)||isNaN(b)) return null;
  return `${r},${g},${b}`;
}

function fbarBtnClick(cardId,btnId,e){
  if(editMode) return;
  const card=curPage().cards.find(c=>c.id===cardId); if(!card) return;
  const btn=(card.buttons||[]).find(b=>b.id===btnId); if(!btn) return;
  const btnEl=e.currentTarget;
  if(btn.type==='climate') _openClimatePopup(btn,btnEl);
  else if(btn.type==='link'&&btn.url) window.open(btn.url,'_blank','noopener');
  else if(btn.type==='navigate') setActivePage(btn.navPage||0);
  else if(btn.type==='popup') _openFbarTextPopup(btn,btnEl);
}

/* ── Footer Bar Modal ── */
let _fbCardId=null, _fbBtns=[], _fbEditIdx=-1;

const _FB_ICON_PRESETS=[
  {icon:'mdi:home',label:'Casa',color:'#818cf8'},
  {icon:'mdi:lightning-bolt',label:'Energia',color:'#fbbf24'},
  {icon:'mdi:thermometer',label:'Clima',color:'#f87171'},
  {icon:'mdi:car-electric',label:'Auto',color:'#4ade80'},
  {icon:'mdi:lightbulb',label:'Luci',color:'#fbbf24'},
  {icon:'mdi:wifi',label:'Rete',color:'#22d3ee'},
  {icon:'mdi:security',label:'Allarme',color:'#f87171'},
  {icon:'mdi:cog',label:'Config',color:'#94a3b8'},
  {icon:'mdi:weather-sunny',label:'Meteo',color:'#fbbf24'},
  {icon:'mdi:camera',label:'Camera',color:'#818cf8'},
  {icon:'mdi:music',label:'Media',color:'#a78bfa'},
  {icon:'mdi:phone',label:'SOS',color:'#f87171'},
  {icon:'mdi:television',label:'TV',color:'#60a5fa'},
  {icon:'mdi:robot-vacuum',label:'Robot',color:'#4ade80'},
  {icon:'mdi:solar-power',label:'Solare',color:'#fbbf24'},
  {icon:'mdi:battery-charging',label:'Batteria',color:'#4ade80'},
  {icon:'mdi:water',label:'Acqua',color:'#22d3ee'},
  {icon:'mdi:fire',label:'Gas',color:'#f97316'},
  {icon:'mdi:door',label:'Porta',color:'#94a3b8'},
  {icon:'mdi:window-closed',label:'Finestre',color:'#94a3b8'},
  {icon:'mdi:motion-sensor',label:'Sensori',color:'#818cf8'},
  {icon:'mdi:fan',label:'Ventil.',color:'#22d3ee'},
  {icon:'mdi:power',label:'On/Off',color:'#f87171'},
  {icon:'mdi:dots-horizontal',label:'Altro',color:'#94a3b8'},
];
function _fbInitPresets(){
  const wrap=document.getElementById('fb-icon-preset'); if(!wrap) return;
  const cur=document.getElementById('fbf-icon')?.value||'';
  wrap.innerHTML=_FB_ICON_PRESETS.map(p=>`
    <button class="fb-icon-btn${p.icon===cur?' on':''}" title="${p.label}" data-action="_fbPickPreset" data-action-args='["${p.icon}","${p.color}"]' style="${p.icon===cur?'--fbi-col:'+p.color:''}">
      ${_renderIcon(p.icon,18)}
    </button>`).join('');
}
function _fbPickPreset(icon,color){
  document.getElementById('fbf-icon').value=icon;
  document.getElementById('fbf-color').value=color||'#818cf8';
  _fbInitPresets();
}
function _fbPreviewIcon(){ _fbInitPresets(); }

/* ── Footer Bar Zone render ── */
function renderFbarZone(){
  if(!cfg.footerBar) cfg.footerBar={enabled:false,buttons:[]};
  const fb=cfg.footerBar;
  const zone=document.getElementById('fbar-zone'); if(!zone) return;
  const btns=fb.buttons||[];
  // Il dock fisso si mostra SOLO in vista; in modifica si usa il riquadro dedicato (come i distintivi in alto)
  const show=(fb.enabled&&btns.length>0)&&!editMode;
  zone.classList.toggle('fbar-on',show);
  document.body.classList.toggle('has-fbar',show);
  // Update epanel status badge
  const badge=document.getElementById('ep-fbar-status');
  if(badge) badge.textContent=btns.length?`${btns.length} pulsanti`:'Disattivata';
  // (navigazione pagine rimossa dalla barra: non serve — si naviga dalle tab in alto)
  const nc=document.getElementById('fbar-navchips'); if(nc){ nc.remove(); }
  if(!show) return;
  const container=document.getElementById('fbar-zone-btns'); if(!container) return;
  if(!btns.length){ container.innerHTML=''; return; }
  container.innerHTML=btns.map(b=>{
    if(b.type==='sep') return `<div class="fbar-sep-v"></div>`;
    const col=b.color||'rgba(255,255,255,.5)';
    const style=`--fbi-col:${col};--fbi-bg:${col}1e;--fbi-sh:${col}4d`;
    let active=false;
    if(b.type==='climate'&&b.entity){
      const st=hs[b.entity]||'';
      active=st==='heat'||st==='cool'||st==='auto'||st==='heat_cool';
    }
    return `<div class="fbar-ibtn${active?' fbar-active':''}" style="${style}" data-action="fbarZoneBtnClick" data-action-arg="${b.id}">
      <div class="fbar-ibtn-ring">${_renderIcon(b.icon||'mdi:circle-outline',22)}</div>
      ${b.label?`<div class="fbar-ibtn-lbl">${eh(b.label)}</div>`:''}
    </div>`;
  }).join('');
}

function fbarZoneBtnClick(btnId,e){
  if(editMode){ openFBM(); return; }
  const btn=(cfg.footerBar?.buttons||[]).find(b=>b.id===btnId); if(!btn) return;
  const btnEl=e.currentTarget;
  if(btn.type==='climate') _openClimatePopup(btn,btnEl);
  else if(btn.type==='link'&&btn.url) window.open(btn.url,'_blank','noopener');
  else if(btn.type==='navigate') setActivePage(btn.navPage||0);
  else if(btn.type==='popup') _openFbarTextPopup(btn,btnEl);
}

function openFBM(){
  if(!cfg.footerBar) cfg.footerBar={enabled:false,buttons:[]};
  _fbBtns=JSON.parse(JSON.stringify(cfg.footerBar.buttons||[]));
  document.getElementById('fbmod-title').textContent='▭ Barra inferiore';
  // toggle enabled state in label row
  const enCb=document.getElementById('fb-enabled-cb');
  if(enCb) enCb.checked=!!cfg.footerBar.enabled;
  document.getElementById('fb-btn-form').style.display='none';
  _fbRenderList();
  document.getElementById('fbmod').classList.remove('off');
}
function closeFBM(){ document.getElementById('fbmod').classList.add('off'); }
function saveFBM(){
  if(!cfg.footerBar) cfg.footerBar={};
  const enCb=document.getElementById('fb-enabled-cb');
  cfg.footerBar.enabled=enCb?enCb.checked:true;
  cfg.footerBar.buttons=JSON.parse(JSON.stringify(_fbBtns));
  saveCfg();
  renderFbarZone();
  closeFBM();
  showToast('✅ Footer Bar salvata');
}
function toggleFbarEnabled(cb){
  if(!cfg.footerBar) cfg.footerBar={enabled:false,buttons:[]};
  cfg.footerBar.enabled=cb.checked;
  cfg.footerBar.buttons=JSON.parse(JSON.stringify(_fbBtns));
  saveCfg(); renderFbarZone();
}

function _fbRenderList(){
  const el=document.getElementById('fb-list'); if(!el) return;
  if(!_fbBtns.length){ el.innerHTML=`<div style="font-size:10px;opacity:.3;padding:4px 0">Nessun pulsante</div>`; return; }
  el.innerHTML=_fbBtns.map((b,i)=>{
    const col=b.color||'#fff';
    const typeLabel={climate:'Termostato',link:'Link',navigate:'Naviga',popup:'Popup'}[b.type]||b.type;
    return `<div class="fb-btn-row" data-action="fbEditBtn" data-action-args='[${i}]'>
      <div class="fb-btn-ico" style="color:${col};border-color:${col}55;background:${col}14">${_renderIcon(b.icon||'⚙️',16)}</div>
      <div class="fb-btn-info">
        <div class="fb-btn-lbl">${eh(b.label||b.entity||'Pulsante')}</div>
        <div class="fb-btn-type">${typeLabel}${b.entity?' · '+b.entity:''}</div>
      </div>
      <button class="ovb ovb-del" data-action="fbDelBtn" data-action-args='[${i}]' style="font-size:11px;width:22px;height:22px">🗑</button>
      ${i>0?`<button class="ovb" data-action="fbMoveBtn" data-action-args='[${i},-1]' style="font-size:10px;width:20px;height:20px">▲</button>`:''}
      ${i<_fbBtns.length-1?`<button class="ovb" data-action="fbMoveBtn" data-action-args='[${i},+1]' style="font-size:10px;width:20px;height:20px">▼</button>`:''}
    </div>`;
  }).join('');
}
function fbDelBtn(i){ _fbBtns.splice(i,1); _fbRenderList(); }
function fbMoveBtn(i,dir){ const t=_fbBtns.splice(i,1)[0]; _fbBtns.splice(i+dir,0,t); _fbRenderList(); }

function fbAddBtn(){
  _fbEditIdx=-1;
  document.getElementById('fb-form-title').textContent='Nuovo pulsante';
  document.getElementById('fbf-save-btn').textContent='➕ Aggiungi';
  document.getElementById('fbf-icon').value='🌡️';
  document.getElementById('fbf-label').value='';
  document.getElementById('fbf-color').value='#f87171';
  document.getElementById('fbf-entity').value='';
  document.getElementById('fbf-clmmin').value=16;
  document.getElementById('fbf-clmmax').value=36;
  document.getElementById('fbf-url').value='';
  document.getElementById('fbf-poptext').value='';
  fbSelType('climate');
  _fbInitPresets();
  document.getElementById('fb-btn-form').style.display='';
}
function fbEditBtn(i){
  _fbEditIdx=i;
  const b=_fbBtns[i]; if(!b) return;
  document.getElementById('fb-form-title').textContent='Modifica pulsante';
  document.getElementById('fbf-save-btn').textContent='💾 Aggiorna';
  document.getElementById('fbf-icon').value=b.icon||'';
  document.getElementById('fbf-label').value=b.label||'';
  document.getElementById('fbf-color').value=b.color||'#f87171';
  document.getElementById('fbf-entity').value=b.entity||'';
  document.getElementById('fbf-clmmin').value=b.clmMin??16;
  document.getElementById('fbf-clmmax').value=b.clmMax??36;
  document.getElementById('fbf-url').value=b.url||'';
  document.getElementById('fbf-poptext').value=b.popText||'';
  const np=document.getElementById('fbf-navpage');
  if(np){ cfg.pages.forEach((p,idx)=>{ const o=np.options[np.options.length-1]; }); }
  fbSelType(b.type||'climate');
  // populate navpage select
  _fbPopulateNav(b.navPage||0);
  _fbInitPresets();
  document.getElementById('fb-btn-form').style.display='';
}
function _fbPopulateNav(selected){
  const sel=document.getElementById('fbf-navpage'); if(!sel) return;
  sel.innerHTML=cfg.pages.map((p,i)=>`<option value="${i}"${i===selected?' selected':''}>${eh(p.icon||'📄')} ${eh(p.name||'Pagina '+(i+1))}</option>`).join('');
}
function fbSelType(t){
  ['climate','link','navigate','popup'].forEach(x=>document.getElementById('fbft-'+x)?.classList.toggle('on',x===t));
  const sf2=(id,v)=>{const e=document.getElementById(id);if(e)e.style.display=v?'':'none';};
  sf2('fbf-climate-row',t==='climate');
  sf2('fbf-link-row',t==='link');
  sf2('fbf-navigate-row',t==='navigate');
  sf2('fbf-popup-row',t==='popup');
  if(t==='navigate') _fbPopulateNav(0);
}
function fbCancelBtn(){ document.getElementById('fb-btn-form').style.display='none'; _fbEditIdx=-1; }
function fbSaveBtn(){
  const t=['climate','link','navigate','popup'].find(x=>document.getElementById('fbft-'+x)?.classList.contains('on'))||'climate';
  const btn={
    id:_fbEditIdx>=0?(_fbBtns[_fbEditIdx]?.id||uid()):uid(),
    type:t,
    icon:document.getElementById('fbf-icon').value.trim()||'⚙️',
    label:document.getElementById('fbf-label').value.trim(),
    color:document.getElementById('fbf-color').value||'#f87171',
    entity:document.getElementById('fbf-entity').value.trim(),
    clmMin:parseFloat(document.getElementById('fbf-clmmin').value)||16,
    clmMax:parseFloat(document.getElementById('fbf-clmmax').value)||36,
    url:document.getElementById('fbf-url').value.trim(),
    navPage:parseInt(document.getElementById('fbf-navpage')?.value||0),
    popText:document.getElementById('fbf-poptext').value,
  };
  if(_fbEditIdx>=0) _fbBtns[_fbEditIdx]=btn;
  else _fbBtns.push(btn);
  _fbRenderList();
  fbCancelBtn();
}

/* ── Climate Popup ── */
let _fclmEntity=null, _fclmMin=16, _fclmMax=36, _fclmTarget=22, _fclmDragging=false;

function _openClimatePopup(btn,btnEl){
  const pop=document.getElementById('fbar-clm-pop'); if(!pop) return;
  const entity=btn.entity||'';
  _fclmEntity=entity;
  _fclmMin=btn.clmMin??16;
  _fclmMax=btn.clmMax??36;
  // Get state from HS
  const attrs=ha[entity]?.attributes||{};
  const cur=attrs.current_temperature??hs[entity]??'—';
  const tgt=attrs.temperature??attrs.target_temp_high??cur;
  const mode=attrs.hvac_action||attrs.preset_mode||attrs.fan_mode||'';
  const name=attrs.friendly_name||entity.split('.').pop().replace(/_/g,' ').toUpperCase();
  _fclmTarget=parseFloat(tgt)||22;
  // Populate popup
  document.getElementById('fcp-name').textContent=name;
  document.getElementById('fcp-cur').textContent=cur!=='—'?`${cur}°`:'—°';
  document.getElementById('fcp-mode').textContent=(mode||'').toUpperCase();
  // Build scale
  const scale=document.getElementById('fcp-scale');
  const steps=5;
  const tickVals=Array.from({length:steps+1},(_,i)=>Math.round(_fclmMin+(_fclmMax-_fclmMin)/steps*(steps-i)));
  scale.innerHTML=tickVals.map(v=>`<span class="fbar-therm-tick">${v}</span>`).join('');
  _fclmSetVisual(_fclmTarget,false);
  // Setup drag
  _fclmSetupDrag();
  // Position above button
  const rect=btnEl.getBoundingClientRect();
  const centerX=rect.left+rect.width/2;
  const popH=290; // estimated popup height
  let top=rect.top-popH-12;
  if(top<8) top=rect.bottom+12;
  pop.style.left=centerX+'px';
  pop.style.top=top+'px';
  // Show
  pop.classList.add('show');
  // Close on outside click
  setTimeout(()=>{
    document.addEventListener('click',_fclmOutsideClose,{once:true,capture:true});
  },50);
}
function _fclmOutsideClose(e){
  const pop=document.getElementById('fbar-clm-pop');
  if(pop&&!pop.contains(e.target)) pop.classList.remove('show');
  else document.addEventListener('click',_fclmOutsideClose,{once:true,capture:true});
}
function _fclmPct(t){ return Math.max(0,Math.min(100,(t-_fclmMin)/(_fclmMax-_fclmMin)*100)); }
function _fclmSetVisual(t,animate){
  const pct=_fclmPct(t);
  const fill=document.getElementById('fcp-fill');
  const handle=document.getElementById('fcp-handle');
  const tval=document.getElementById('fcp-hval');
  const tgt=document.getElementById('fcp-target');
  if(fill){ if(!animate) fill.style.transition='none'; fill.style.height=pct+'%'; if(!animate) requestAnimationFrame(()=>fill.style.transition=''); }
  if(handle){ if(!animate) handle.style.transition='none'; handle.style.bottom=`calc(${pct}% - 17px)`; if(!animate) requestAnimationFrame(()=>handle.style.transition=''); }
  if(tval) tval.textContent=t.toFixed(1);
  if(tgt) tgt.textContent=t.toFixed(1);
}
function _fclmSetupDrag(){
  const track=document.getElementById('fcp-track'); if(!track) return;
  // remove old listeners by cloning
  const newTrack=track.cloneNode(true);
  track.parentNode.replaceChild(newTrack,track);
  function tempFrom(clientY){
    const rect=newTrack.getBoundingClientRect();
    const ratio=1-Math.max(0,Math.min(1,(clientY-rect.top)/rect.height));
    const raw=_fclmMin+ratio*(_fclmMax-_fclmMin);
    return Math.round(raw*2)/2;
  }
  newTrack.addEventListener('pointerdown',e=>{
    _fclmDragging=true; newTrack.setPointerCapture(e.pointerId);
    _fclmTarget=tempFrom(e.clientY); _fclmSetVisual(_fclmTarget,false);
  });
  newTrack.addEventListener('pointermove',e=>{
    if(!_fclmDragging) return;
    _fclmTarget=tempFrom(e.clientY); _fclmSetVisual(_fclmTarget,false);
  });
  newTrack.addEventListener('pointerup',e=>{
    if(!_fclmDragging) return;
    _fclmDragging=false;
    _fclmTarget=tempFrom(e.clientY); _fclmSetVisual(_fclmTarget,true);
    if(_fclmEntity) callSvc('climate','set_temperature',_fclmEntity,{temperature:_fclmTarget});
    showToast(`🌡️ Target: ${_fclmTarget.toFixed(1)}°C`);
  });
}

function _openFbarTextPopup(btn,btnEl){
  // Simple text popup above button
  document.querySelectorAll('.fbar-text-pop').forEach(p=>p.remove());
  const pop=document.createElement('div');
  pop.className='fbar-text-pop';
  pop.style.cssText='position:fixed;z-index:9500;max-width:220px;background:rgba(6,8,16,.97);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px 16px;box-shadow:0 16px 48px rgba(0,0,0,.6);font-size:12px;line-height:1.5;color:#e2e8f0';
  pop.innerHTML=btn.popText||'';
  document.body.appendChild(pop);
  const rect=btnEl.getBoundingClientRect();
  const centerX=rect.left+rect.width/2;
  pop.style.left=Math.max(8,centerX-pop.offsetWidth/2)+'px';
  pop.style.top=(rect.top-pop.offsetHeight-12)+'px';
  setTimeout(()=>document.addEventListener('click',()=>pop.remove(),{once:true,capture:true}),50);
}

/* ═══ YAML IMPORT — reindirizza al nuovo modal HACS-compatibile ═══ */
/* openYamlImport / closeYamlImport sono definite più sopra (versione che azzera _yamlCurrentConfig). */

const _HA_MDI_EMOJI={
  'mdi:thermometer':'🌡️','mdi:thermometer-low':'🌡️','mdi:thermometer-high':'🌡️',
  'mdi:lightning-bolt':'⚡','mdi:flash':'⚡','mdi:solar-power':'☀️','mdi:solar-panel':'☀️',
  'mdi:home':'🏠','mdi:home-outline':'🏠','mdi:lightbulb':'💡','mdi:lightbulb-outline':'💡',
  'mdi:water':'💧','mdi:water-percent':'💧','mdi:fire':'🔥','mdi:gas-burner':'🔥',
  'mdi:weather-sunny':'☀️','mdi:weather-cloudy':'☁️','mdi:weather-rainy':'🌧️','mdi:weather-snowy':'❄️',
  'mdi:weather-windy':'🌬️','mdi:weather-fog':'🌫️','mdi:weather-night':'🌙',
  'mdi:car':'🚗','mdi:car-electric':'🔋','mdi:battery':'🔋','mdi:battery-charging':'⚡',
  'mdi:wifi':'📶','mdi:lock':'🔒','mdi:lock-open':'🔓','mdi:door':'🚪','mdi:door-open':'🚪',
  'mdi:window-closed':'🪟','mdi:window-open':'🪟','mdi:motion-sensor':'👁️',
  'mdi:fan':'🌀','mdi:air-conditioner':'❄️','mdi:snowflake':'❄️',
  'mdi:music':'🎵','mdi:television':'📺','mdi:speaker':'🔊','mdi:volume-high':'🔊',
  'mdi:phone':'📞','mdi:alarm':'🚨','mdi:alarm-light':'🚨','mdi:security':'🔐',
  'mdi:power':'⏻','mdi:power-plug':'🔌','mdi:power-socket':'🔌',
  'mdi:gauge':'📊','mdi:chart-line':'📈','mdi:chart-bar':'📊',
  'mdi:coffee':'☕','mdi:robot-vacuum':'🤖','mdi:dishwasher':'🍽️','mdi:washing-machine':'👕',
  'mdi:cloud':'☁️','mdi:sunrise':'🌅','mdi:sunset':'🌇','mdi:clock':'🕐',
};
function _haIconToEmoji(icon){
  if(!icon) return '';
  return _HA_MDI_EMOJI[icon] || '';
}

const _HA_TYPE_LABELS={
  'compact':'Sensore','big':'Valore Grande','toggle':'Interruttore','gauge':'Gauge',
  'history':'Storico','climate':'Clima','weather-forecast':'Meteo','media':'Media Player',
  'entities':'Lista Entità','markdown':'Testo Markdown','camera':'Camera'
};

function _haEntityLabel(entity){
  if(!entity) return '';
  return entity.split('.').pop().replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}

function _haYamlToCards(obj){
  // Handles both single card and views array
  const cards=[];
  const type=(obj.type||'').toLowerCase().replace('custom:','custom:');
  const name=obj.name||obj.title||'';
  const entity=obj.entity||'';
  const entities=obj.entities||[];
  const icon=_haIconToEmoji(obj.icon||'');

  function lbl(fb){ return name||_haEntityLabel(entity)||fb; }

  // ── single entity types ──
  if(['sensor','entity','plant-status','input_number','input_text','input_datetime'].includes(type)){
    cards.push({type:'compact',label:lbl('Sensore'),icon:icon||'📊',entity,unit:obj.unit_of_measurement||obj.unit||'',color:'#818cf8',colSpan:1,rowSpan:1});
  }
  else if(['button','input_button'].includes(type)){
    cards.push({type:'toggle',label:lbl('Pulsante'),icon:icon||'🔘',entity,color:'#818cf8',colSpan:1,rowSpan:1});
  }
  else if(['switch','input_boolean'].includes(type)){
    cards.push({type:'toggle',label:lbl('Interruttore'),icon:icon||'🔌',entity,color:'#4ade80',colSpan:1,rowSpan:1});
  }
  else if(['cover'].includes(type)){
    cards.push({type:'toggle',label:lbl('Tapparella'),icon:icon||'🪟',entity,color:'#94a3b8',colSpan:1,rowSpan:1});
  }
  else if(type==='light'){
    cards.push({type:'toggle',label:lbl('Luce'),icon:icon||'💡',entity,color:'#fbbf24',colSpan:1,rowSpan:1});
  }
  else if(type==='gauge'){
    cards.push({type:'gauge',label:lbl('Gauge'),icon:icon||'📊',entity,
      unit:obj.unit||'',min:obj.min??0,max:obj.max??100,
      color:obj.needle?'#818cf8':'#22d3ee',colSpan:1,rowSpan:1});
  }
  else if(['history-graph','statistics-graph'].includes(type)){
    const ents=(entities||[]).map(e=>typeof e==='string'?e:(e.entity||'')).filter(Boolean);
    if(!ents.length&&entity) ents.push(entity);
    cards.push({type:'history',label:lbl('Storico'),icon:icon||'📈',
      entity:ents[0]||'',unit:'',color:'#818cf8',colSpan:2,rowSpan:2,hours:obj.hours_to_show||24});
  }
  else if(['thermostat','climate','humidifier'].includes(type)){
    cards.push({type:'climate',label:lbl('Clima'),icon:icon||'🌡️',entity,unit:'°C',color:'#fb923c',colSpan:2,rowSpan:2});
  }
  else if(type==='weather-forecast'){
    cards.push({type:'weather-forecast',label:lbl('Meteo'),icon:'🌤️',entity,color:'#60a5fa',colSpan:2,rowSpan:2});
  }
  else if(type==='media-player'){
    cards.push({type:'media',label:lbl('Media'),icon:icon||'🎵',entity,color:'#a78bfa',colSpan:2,rowSpan:1});
  }
  else if(type==='markdown'){
    cards.push({type:'markdown',label:lbl('Testo'),icon:'📝',content:obj.content||obj.text||'',color:'#818cf8',colSpan:1,rowSpan:1});
  }
  else if(['alarm-panel','alarm-control-panel'].includes(type)){
    cards.push({type:'compact',label:lbl('Allarme'),icon:'🚨',entity,color:'#f87171',colSpan:1,rowSpan:1});
  }
  else if(type==='camera'){
    cards.push({type:'camera',label:lbl('Camera'),icon:'📷',entity,color:'#475569',colSpan:2,rowSpan:2});
  }
  // ── entities list → one card per entity if single, or entities card ──
  else if(type==='entities'){
    const ents=(entities||[]).map(e=>{
      if(typeof e==='string') return {entity:e,label:_haEntityLabel(e)};
      if(e&&e.entity) return {entity:e.entity,label:e.name||_haEntityLabel(e.entity)};
      return null;
    }).filter(Boolean);
    if(ents.length===1){
      cards.push({type:'compact',label:ents[0].label||lbl('Sensore'),icon:icon||'📦',entity:ents[0].entity,unit:'',color:'#818cf8',colSpan:1,rowSpan:1});
    } else if(ents.length>1){
      cards.push({type:'entities',label:lbl('Lista'),icon:icon||'📋',entities:ents,color:'#818cf8',colSpan:1,rowSpan:Math.min(ents.length,3)});
    }
  }
  // ── views: extract nested cards ──
  else if(type==='custom:vertical-stack-in-card'||type==='vertical-stack'){
    (obj.cards||[]).forEach(c=>{ _haYamlToCards(c).forEach(r=>cards.push(r)); });
  }
  else if(type==='horizontal-stack'){
    (obj.cards||[]).forEach(c=>{ _haYamlToCards(c).forEach(r=>cards.push(r)); });
  }
  // ── unknown with entity → generic compact ──
  else if(entity){
    cards.push({type:'compact',label:lbl(type||'Card'),icon:icon||'📦',entity,unit:'',color:'#818cf8',colSpan:1,rowSpan:1,_fallback:true,_originalHAType:type});
  }
  else if(entities&&entities.length){
    const ents=(entities||[]).map(e=>typeof e==='string'?{entity:e,label:_haEntityLabel(e)}:(e&&e.entity?{entity:e.entity,label:e.name||_haEntityLabel(e.entity)}:null)).filter(Boolean);
    if(ents.length) cards.push({type:'entities',label:lbl('Lista'),icon:'📋',entities:ents,color:'#818cf8',colSpan:1,rowSpan:2,_fallback:true,_originalHAType:type});
  }

  return cards;
}

function _yamlLivePreview(){
  const txt=document.getElementById('yaml-import-txt').value.trim();
  const prev=document.getElementById('yaml-import-preview');
  const errEl=document.getElementById('yaml-import-error');
  const btn=document.getElementById('yaml-import-btn');
  prev.style.display='none'; errEl.style.display='none'; btn.disabled=true;
  if(!txt) return;
  try{
    if(typeof jsyaml==='undefined') throw new Error('Parser YAML non disponibile (controlla la connessione)');
    const obj=jsyaml.load(txt);
    if(!obj||typeof obj!=='object') throw new Error('YAML non valido o vuoto');
    const cards=_haYamlToCards(obj);
    if(!cards.length){
      errEl.innerHTML=`<div class="yaml-map-err">⚠️ Tipo card "<code>${eh(obj.type||'sconosciuto')}</code>" non supportato o nessuna entità trovata.</div>`;
      errEl.style.display='';
      return;
    }
    const content=document.getElementById('yaml-import-preview-content');
    content.innerHTML=cards.map(c=>{
      const typeLbl=_HA_TYPE_LABELS[c.type]||c.type;
      const fallbackNote=c._fallback?` <span class="yaml-map-warn" style="font-size:9px;padding:2px 6px;border-radius:10px;border:1px solid rgba(251,191,36,.3);background:rgba(251,191,36,.08);color:#fbbf24">approssimato</span>`:'';
      return `<div class="yaml-preview-row">
        <div class="yaml-preview-icon">${c.icon||'📦'}</div>
        <div class="yaml-preview-info">
          <div style="display:flex;align-items:center;gap:6px">
            <div class="yaml-preview-label">${eh(c.label)}</div>
            <span class="yaml-map-ok" style="font-size:8px;padding:1px 6px;border-radius:10px">${typeLbl}</span>${fallbackNote}
          </div>
          ${c.entity?`<div class="yaml-preview-entity">${eh(c.entity)}</div>`:''}
          ${c.entities?`<div class="yaml-preview-entity">${c.entities.map(e=>eh(e.entity)).join(', ')}</div>`:''}
        </div>
        <div style="font-size:9px;color:var(--muted);white-space:nowrap">${c.colSpan}×${c.rowSpan}</div>
      </div>`;
    }).join('');
    prev.style.display='';
    btn.disabled=false;
    btn.textContent=cards.length>1?`📥 Importa ${cards.length} card`:'📥 Importa Card';
  }catch(err){
    errEl.innerHTML=`<div class="yaml-map-err">❌ Errore YAML: ${eh(err.message)}</div>`;
    errEl.style.display='';
  }
}

function importYamlCard(){
  const txt=document.getElementById('yaml-import-txt').value.trim();
  if(!txt) return;
  try{
    const obj=jsyaml.load(txt);
    const cards=_haYamlToCards(obj);
    if(!cards.length){ showToast('⚠️ Nessuna card importabile'); return; }
    const page=curPage(); _ensureSections(page);
    const sec=page.sections[0];
    let count=0;
    cards.forEach(tpl=>{
      const c={...tpl, id:uid(), secId:sec.id, secCol:0, secOrder:(page.cards.length+count)*10, height:sec.rowH||150};
      delete c._fallback; delete c._originalHAType;
      page.cards.push(c);
      count++;
    });
    saveCfg(); renderDash();
    closeYamlImport();
    closeTM();
    showToast(`✅ ${count} card${count>1?' importate':' importata'} con successo`);
  }catch(err){
    showToast('❌ Errore importazione: '+err.message);
  }
}

/* ═══ CLOCK ═══ */
const DY=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
const MO=['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
function tick(){
  const n=new Date();
  const _clkEl=document.getElementById('clock'); if(_clkEl) _clkEl.textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
  const _datEl=document.getElementById('datel'); if(_datEl) _datEl.textContent=DY[n.getDay()]+' '+n.getDate()+' '+MO[n.getMonth()];
}
tick(); setInterval(tick,30000);

/* ═══ HEADER BAR (left section) ═══ */

function renderHdrChips(){
  const el=document.getElementById('hdr-bar-inner'); if(!el) return;
  el.innerHTML=hbarInner(cfg.hdrBar||{left:[],center:[],right:[]});
}
function openHBM_HDR(){
  _hbCreateModal(); // genera il modal la prima volta
  if(!cfg.hdrBar) cfg.hdrBar={left:[{id:uid(),type:'clock'}],center:[],right:[]};
  _hbCardId='__hdrbar__';
  _hbChips=JSON.parse(JSON.stringify(cfg.hdrBar));
  document.getElementById('hbmod-title').textContent='⊞ Configurazione Header';
  const cardSect=document.getElementById('hb-card-settings');
  if(cardSect) cardSect.style.display='none';
  hbRenderAllLists();
  hbCancelChip();
  document.getElementById('hbmod').classList.remove('off');
}

/* ═══ INIT ═══ */
/* Apply saved theme and font before first render to avoid flash */
(function(){
  const t=cfg.theme||'dark';
  const f=cfg.font||'Inter';
  document.documentElement.dataset.theme=t==='light'?'light':'';
  document.documentElement.style.setProperty('--font-family',`'${f}',system-ui,sans-serif`);
  // tema colorato salvato (accento + sfondo) — applica le sole variabili, senza ridisegnare
  try{
    const ct=(typeof COLOR_THEMES!=='undefined')&&COLOR_THEMES.find(x=>x.id===(cfg.colorTheme||'indaco'));
    if(ct){ const r=document.documentElement.style; r.setProperty('--acc',ct.acc); r.setProperty('--acc2',ct.acc2); r.setProperty('--glow1',ct.g[0]); r.setProperty('--glow2',ct.g[1]); r.setProperty('--glow3',ct.g[2]); if(t!=='light'){ r.setProperty('--bg',ct.bg); r.setProperty('--panel',ct.panel); r.setProperty('--panel2',ct.panel2); } }
  }catch(e){}
})();
/* Ripristina l'indirizzo remoto salvato nell'overlay di connessione */
(function(){
  const savedRemote = localStorage.getItem('hadb_remote')||REMOTE_URL_DEFAULT;
  const cre=document.getElementById('cov-remote-url'); if(cre) cre.value=savedRemote;
})();

/* Login rimosso: si entra sempre direttamente nella dashboard */
_jsStoreBootAll();
renderDash();
connect();

/* ── Error feedback visibile all'utente ─────────────────────────────────── */
(function _initErrorFeedback(){
  let _errBusy=false, _errCount=0, _errReset=0;
  function _pushErr(title, msg){
    if(_errBusy) return;
    const now=Date.now();
    if(now-_errReset>10000){ _errCount=0; _errReset=now; }
    if(_errCount++>3) return; // max 3 errori ogni 10s
    _errBusy=true;
    try{ _ntfPushLog(title, msg, '🔴', null, {}); }catch(_){}
    _errBusy=false;
  }
  // Ignora errori da script esterni (HACS cards, HA components, ecc.)
  function isExternal(src){
    const f=(src||'').toLowerCase();
    // Solo errori dal bundle Frarik (index-*.js) o senza sorgente
    return f && !f.includes('index-') && !f.includes('frarik');
  }
  window.onerror = function(msg, src, line){
    if(isExternal(src)) return false; // errore da script terzo — ignora
    const file=(src||'').split('/').pop();
    _pushErr('⚠️ Errore JS', (file?file+':'+line+' — ':'')+msg);
    return false;
  };
  window.addEventListener('unhandledrejection', function(e){
    const msg=e.reason instanceof Error?e.reason.message:String(e.reason||'Promise rejection');
    // Ignora errori comuni da componenti HA (CustomElementRegistry, exitfullscreen, ecc.)
    if(/CustomElementRegistry|exitFullscreen|exitfullscreen|already been used/i.test(msg)) return;
    _pushErr('⚠️ Errore asincrono', msg);
  });
})();

/* ── Delegation input/change (ex oninput/onchange nei template) ────────────── */
(function(){
  function _inputDelegate(e){
    const el = e.target;
    const fn  = el.dataset.input;   if(!fn) return;
    const arg = el.dataset.inputArgs;
    const num = el.dataset.inputNum;
    const val = el.type==='checkbox' ? el.checked : (num ? +el.value : el.value);
    if(typeof window[fn]==='function'){
      arg ? window[fn](...JSON.parse(arg), val) : window[fn](val);
    }
  }
  document.addEventListener('input',  _inputDelegate);
  document.addEventListener('change', _inputDelegate);
})();

/* ── Wrapper per input/change con this.value nei template ──────────────────── */
function _appSetItemEntity(i,v){ _appItems[i].entity=v; }
function _appSetItemName(i,v){ _appItems[i].name=v; }
function _appSetGroupName(i,v){ _appGroups[i].name=v; }
function _appSetGroupShowList(i,v){ _appGroups[i].showList=v; }
function _appSetGroupEntities(i,v){ _appGroups[i].entities=v.split('\n').map(s=>s.trim()).filter(Boolean); }
function _ntfSetAndSuggest(i,dropId,v){ _ntfSet(i,'entity',v); _ntfEntitySuggest(i,document.getElementById('ntf-ent-inp-'+i),dropId); }
function _ntfSetIcon(i,v){ _ntfSet(i,'icon',v); const p=document.getElementById('ntf-ico-prev-'+i); if(p) p.innerHTML=_ntfIconHtml(v||'🔔',20); }

/* ── Sistema data-action: gestisce onclick rimossi dall'HTML e dai template ─ */
document.addEventListener('click', function(e){
  const el = e.target.closest('[data-action]');
  if(!el) return;
  const fn  = el.dataset.action;
  const fn2 = el.dataset.action2;
  const arg      = el.dataset.actionArg;   // singolo arg stringa
  const argsJson = el.dataset.actionArgs;  // array arg JSON (tipi preservati)
  if(typeof window[fn]==='function'){
    e.stopPropagation();
    if(argsJson !== undefined){
      try{
        const args = JSON.parse(argsJson);
        // data-action-el="true" → aggiunge (el, event) dopo gli args per i picker
        el.dataset.actionEl ? window[fn](...args, el, e) : window[fn](...args);
      }catch(_){}
    } else if(arg !== undefined){
      window[fn](arg);
    } else {
      window[fn](e, el);  // el disponibile per funzioni che leggono dataset
    }
  }
  if(fn2 && typeof window[fn2]==='function') window[fn2](e);
});

/* ── Funzioni helper per handler ex-inline ──────────────────────────────── */
function _covSkip(){ const c=document.getElementById('cov'); if(c) c.classList.add('off'); }

/* Wrapper per handler multi-statement nei template dinamici */
function _hbDelOption(i){ _hbOptions.splice(i,1); _hbRenderOptions(); }
function _appDelItem(i){ _appItems.splice(i,1); renderAppItems(); }
function _appDelGroup(i){ _appGroups.splice(i,1); renderAppGroups(); }
function _openGhStoreClean(){ document.getElementById('add-col-menu')?.remove(); openGhStore(); }
function _pasteCardToClean(secId,col){ document.getElementById('add-col-menu')?.remove(); pasteCardTo(secId,col); }
function _closeViewsAndOpenTM(){ closeViewsMenu(); openTM(); }
function _closeViewsAndSetPage(i){ closeViewsMenu(); setActivePage(i); }
function _jsStoreAddAndRefresh(id){ jsStoreAddCard(id); setTimeout(_ghStoreRender,50); }
function _deleteSavedAt(i){ deleteSaved(i, null); }
function _appChipPopupAt(cardId, gi){ appChipPopup(cardId, gi, null); }
function _setActivePageAndSync(i){ setActivePage(i); setTimeout(window._navbarSync,30); }
function _pgWarnClose(){ document.querySelector('.pg-warn-ov')?.remove(); _pgProceedCb=null; }
function _sendCallSvc(d,s,e){ send({type:'call_service',domain:d,service:s,service_data:e?{entity_id:e}:{}}); }
/* Wrapper picker con elemento trigger (btn = elemento cliccato passato dal delegation) */
function _appItemPickIcon(i,btn,ev){ openIconPicker(v=>{_appItems[i].icon=v;renderAppItems();},btn,ev); }
function _appItemPickColor(effColor,i,btn,ev){ openColorPicker(effColor,c=>{_appItems[i].color=c;renderAppItems();},btn,ev); }
function _appGroupPickColor(gc,i,btn,ev){ openColorPicker(gc,c=>{_appGroups[i].color=c;renderAppGroups();},btn,ev); }
function _sosPickIcon(i,btn,ev){ openIconPicker(v=>{sosUpdateContact(i,'icon',v);renderSOSCfgList();},btn,ev); }
function _sosPickService(i){ _epPickerOpen(v=>{sosUpdateContact(i,'notifyService',v);const el=document.getElementById('sos-svc-inp-'+i);if(el)el.value=v;},'notify','Seleziona servizio notify'); }
function _fePickIconBtn(btn,ev){ openIconPicker(v=>{feUp('icon',v);const el=document.getElementById('fe-ico-btn-inp');if(el)el.value=v;},btn,ev); }
function _fePickIconEl(btn,ev){ openIconPicker(v=>{feUp('icon',v);const el=document.getElementById('fe-ico-el-inp');if(el)el.value=v;},btn,ev); }
function _ntfPickEntityFor(i){ _epPickerOpen(v=>{_ntfSet(i,'entity',v);const el=document.getElementById('ntf-ent-inp-'+i);if(el)el.value=v;}); }
function _ntfPickIcon(i,btn,ev){ openIconPicker(v=>{_ntfSet(i,'icon',v);const inp=document.getElementById('ntf-ico-inp-'+i);if(inp)inp.value=v;const p=document.getElementById('ntf-ico-prev-'+i);if(p)p.innerHTML=_ntfIconHtml(v,20);},btn,ev); }
function _ntfPickDuration(i){ _epPickerOpen(v=>{_ntfSet(i,'durationEntity',v);const el=document.getElementById('ntf-dur-inp-'+i);if(el)el.value=v;}); }
function _ntfPickCam(i){ _epPickerOpen(v=>{_ntfSet(i,'camEntity',v);const el=document.getElementById('ntf-cam-inp-'+i);if(el)el.value=v;},'camera','Seleziona camera'); }
function _ntfPickAlexa(i){ _epPickerOpen(v=>{_ntfSet(i,'alexaEntity',v);const el=document.getElementById('ntf-ax-inp-'+i);if(el)el.value=v;},'notify','Seleziona servizio Alexa/notify'); }
function _ntfPickCond(i){ _epPickerOpen(v=>{_ntfSet(i,'condEntity',v);const el=document.getElementById('ntf-cond-inp-'+i);if(el)el.value=v;}); }
function _ntfPickMobile(i){ _epPickerOpen(v=>{_ntfSet(i,'mobileService',v);const el=document.getElementById('ntf-mob-inp-'+i);if(el)el.value=v;},'notify','Seleziona servizio notify (app cellulare)'); }
function _hbDelColorMapEntry(key){ delete _hbColorMap[key]; _hbRenderColorMap(); }
function _hbDelIconMapEntry(key){ delete _hbIconMap[key]; _hbRenderIconMap(); }
/* eitClick da elemento: legge i dati dai data-* attribute */
function _eitClickFromEl(e, el){ if(!el) el=e.target.closest('[data-eid]'); if(!el) return; eitClick(el.dataset.eid,el.dataset.efn,el.dataset.eunit,el.dataset.edom); }
/* ghsPreview da elemento: legge enc/nm/cid dai data-* */
function _ghsPreviewEl(e, el){ if(!el) el=e.target.closest('[data-penc]'); if(!el) return; _ghsPreview(el.dataset.penc,el.dataset.pnm,el.dataset.pcid||null); }
function _feEpClose(){ const el=document.getElementById('fe-ep'); if(el) el.style.display='none'; }
function _ntfSaveRules(){ saveCfg(); showToast('✅ Regole salvate'); }
function _jsDropzoneClick(){ document.getElementById('jsst-file-inp')?.click(); }
function _ghsDropzoneClick(){ document.getElementById('ghs-file-inp')?.click(); }
function _ghCheckForce(){ _ghCheck(true); }

function _epToggleLicense(){
  const box   = document.getElementById('ep-lic-box');
  const arrow = document.getElementById('ep-lic-arrow');
  if(!box) return;
  const open = box.style.display === 'none';
  box.style.display   = open ? 'block' : 'none';
  if(arrow) arrow.className = 'mdi mdi-chevron-' + (open ? 'up' : 'down');
  if(open) _epLicFill();
}

function _epLicFill(){
  const key = localStorage.getItem('frarik_license') || '';
  if(!key) return;
  const masked = key.slice(0,5) + '****-****-' + key.slice(-4);
  const el = id => document.getElementById(id);
  if(el('ep-lic-key')) el('ep-lic-key').textContent = masked;

  // Fetch live per dati sempre aggiornati
  fetch(LICENSE_API, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key})})
    .then(r => r.json())
    .then(d => {
      if(!d.valid){ if(el('ep-lic-status')){ el('ep-lic-status').textContent='● REVOCATO'; el('ep-lic-status').style.cssText='font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;background:rgba(248,113,113,.1);color:#f87171'; } return; }
      // Salva dati aggiornati
      localStorage.setItem('frarik_lic_name', d.name||'');
      localStorage.setItem('frarik_lic_note', d.note||'');
      localStorage.setItem('frarik_lic_expires', d.expires||'');
      const note    = d.note || '';
      const expires = d.expires;
      const expFmt  = expires ? new Date(expires).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}) : 'Nessuna scadenza';
      const level   = note ? ('👑 ' + note.charAt(0).toUpperCase() + note.slice(1)) : '⭐ Standard';
      if(el('ep-lic-name'))    el('ep-lic-name').textContent    = d.name || '—';
      if(el('ep-lic-expires')) el('ep-lic-expires').textContent = expFmt;
      if(el('ep-lic-level'))   el('ep-lic-level').textContent   = level;
    })
    .catch(() => {
      // Offline: usa dati salvati
      const name    = localStorage.getItem('frarik_lic_name') || '—';
      const note    = localStorage.getItem('frarik_lic_note') || '';
      const expires = localStorage.getItem('frarik_lic_expires');
      const expFmt  = expires && expires !== 'null' ? new Date(parseInt(expires)).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}) : 'Nessuna scadenza';
      const level   = note ? ('👑 ' + note.charAt(0).toUpperCase() + note.slice(1)) : '⭐ Standard';
      if(el('ep-lic-name'))    el('ep-lic-name').textContent    = name;
      if(el('ep-lic-expires')) el('ep-lic-expires').textContent = expFmt;
      if(el('ep-lic-level'))   el('ep-lic-level').textContent   = level;
    });
}

function _epLicLogout(){
  if(!confirm('Vuoi cambiare la chiave di licenza?\nDovrai reinserirla al prossimo accesso.')) return;
  localStorage.removeItem('frarik_license');
  localStorage.removeItem('frarik_license_ts');
  localStorage.removeItem('frarik_lic_name');
  localStorage.removeItem('frarik_lic_expires');
  location.reload();
}

/* ── Listener icona picker (ex lambda inline) ────────────────────────────── */
(function _initIconPickers(){
  const picks=[
    ['cm-ico-picker',   'cm-ico',       null],
    ['bf-icon-picker',  'bf-icon',       null],
    ['hbf-icon-picker', 'hbf-icon',      null],
    ['hbf-opt-icon-picker','hbf-opt-icon',null],
    ['fbf-icon-picker', 'fbf-icon',      '_fbPreviewIcon'],
    ['ep-page-ico-picker','ep-page-ico', '_pgMarkDirty'],
    ['vmod-ico-picker', 'vmod-ico',      null],
  ];
  picks.forEach(function([btnId, targetId, afterFn]){
    const btn=document.getElementById(btnId); if(!btn) return;
    btn.addEventListener('click',function(e){
      openIconPicker(function(v){
        const t=document.getElementById(targetId); if(t) t.value=v;
        if(afterFn && typeof window[afterFn]==='function') window[afterFn]();
      }, btn, e);
    });
  });
})();

/* ── Badge btn nel CM modal (usa variabile editingId) ────────────────────── */
(function(){
  const btn=document.getElementById('cm-badge-btn'); if(!btn) return;
  btn.addEventListener('click',function(){
    if(typeof editingId!=='undefined') openBM('card:'+editingId);
  });
})();

/* ── Backdrop click per icon picker modal ────────────────────────────────── */
(function(){
  const m=document.getElementById('ntf-icon-modal'); if(!m) return;
  m.addEventListener('click',function(e){ if(e.target===m) _iconPickerClose(); });
})();

/* ── Handler input/change (ex onchange/oninput inline) ──────────────────── */
(function _initInputHandlers(){
  function on(id, ev, fn){ const el=document.getElementById(id); if(el) el.addEventListener(ev,fn); }

  // Ricerca entità modal
  on('esearch',       'input',  ()=>filterE());
  // Config card
  on('cm-type',       'change', ()=>onTypeChange());
  on('cm-clickaction','change', ()=>onClickActionChange());
  on('cm-bgOn',       'change', ()=>onCustomColorToggle());
  on('cm-bgColor',    'change', ()=>onCustomColorToggle());
  on('cm-textOn',     'change', ()=>onCustomColorToggle());
  on('cm-textColor',  'change', ()=>onCustomColorToggle());
  on('cm-vis-mode',   'change', ()=>_cmVisToggle());
  on('cm-vis-op',     'change', ()=>_cmVisToggle());
  // Sezione
  on('sect-title-text','input', ()=>previewSect());
  // Badge form
  on('bf-action',     'change', function(){ _selBAction(this.value); });
  // Header bar
  on('hbf-entity',    'input',  ()=>hbAutoFill());
  // Footer bar
  on('fb-enabled-cb', 'change', function(){ toggleFbarEnabled(this); });
  on('fbf-icon',      'input',  ()=>_fbPreviewIcon());
  // YAML import
  on('yaml-import-txt','input', ()=>_yamlLivePreview());
  // Impostazioni pagina
  on('ep-page-ico',   'input',  ()=>_pgMarkDirty());
  on('ep-page-name',  'input',  ()=>_pgMarkDirty());
  on('ep-view-title', 'input',  ()=>_pgMarkDirty());
  // Sistema
  on('sys-ss-min',    'input',  ()=>_sysSaveSS());
  on('sys-ss-sec',    'input',  ()=>_sysSaveSS());
  on('sys-th-mode',   'change', ()=>_sysSaveTH());
  on('sys-th-light',  'change', ()=>_sysSaveTH());
  on('sys-th-dark',   'change', ()=>_sysSaveTH());
  on('sys-mob',       'change', ()=>_sysSaveMob());
  // Store GitHub
  on('ghs-search',    'input',  ()=>_ghStoreRender());
  // Icon picker search
  on('ipm-search',    'input',  ()=>_iconPickerRenderTab('mdi'));
  // Free editor (canvas)
  on('fe-ep-q',       'input',  function(){ _feEpSearch(this.value); });
  on('fe-inp-w',      'input',  function(){ feUpdCard('canvasW', +this.value); });
  on('fe-inp-h',      'input',  function(){ feUpdCard('canvasH', +this.value); });
  on('fe-inp-bg',     'input',  function(){ feUpdCard('canvasBg', this.value); });
  on('fe-inp-br',     'input',  function(){ feUpdCard('canvasBorderRadius', this.value); });
  on('fe-inp-bord',   'input',  function(){ feUpdCard('canvasBorderStr', this.value); });
  on('fe-inp-snap',   'input',  function(){ _feSnap = +this.value||5; });
  // File upload card JS
  on('jsst-file-inp', 'change', function(){ jsStoreLoadFile(this.files[0]); });
  on('ghs-file-inp',  'change', function(){ jsStoreLoadFile(this.files[0]); });
  // Entity picker search
  on('ep-picker-q',   'input',  function(){ _epPickerSearch(this.value); });
})();

/* ── Handler header (ex onclick inline) ─────────────────────────────────── */
(function _initHeaderHandlers(){
  function on(id, ev, fn){ const el=document.getElementById(id); if(el) el.addEventListener(ev,fn); }
  on('conn-wrap',   'click', ()=>confirmRestartHA());
  on('views-btn',   'click', e=>toggleViewsMenu(e));
  on('notif-bell',  'click', e=>toggleNotifCenter(e));
  on('kiosk-btn',   'click', ()=>toggleKiosk());
  on('reload-btn',  'click', ()=>hardReload());
  on('settings-btn','click', ()=>openOikSettings());
  on('hasidebar-btn','click',()=>toggleHASidebar());
  on('undo-btn',    'click', ()=>undoEdit());
  on('redo-btn',    'click', ()=>redoEdit());
  on('edit-btn',    'click', ()=>toggleEdit());
  on('mfab',        'click', e=>toggleMobileMenu(e));
})();

/* Notifica aggiornamento add-on: mostra una volta per ogni nuova versione */
(async function(){
  try{
    const r=await fetch('./api/frarik/version?t='+Date.now());
    const d=await r.json();
    const cur=d&&d.version; if(!cur) return;
    const prev=localStorage.getItem('frarik_last_version');
    localStorage.setItem('frarik_last_version',cur);
    if(cur===prev) return; // stessa versione, nessuna notifica
    const msg=prev?'Aggiornato dalla v'+prev+' alla v'+cur+'.':'Versione v'+cur+' in esecuzione.';
    setTimeout(()=>{
      try{ _ntfPushLog('✅ Frarik Dashboard v'+cur, msg,'📦','app',{}); _ntfUpdateBell(); }catch(e){}
    },2000);
  }catch(e){}
})();
try{
  var _vl=document.getElementById('ep-ver-label');
  // Mostra versione add-on dal server (config.yaml), fallback al numero interno
  fetch('./api/frarik/version?t='+Date.now()).then(r=>r.json()).then(d=>{
    if(_vl) _vl.textContent='v'+d.version+' (add-on)';
  }).catch(()=>{ if(_vl) _vl.textContent=(window.FRARIK_APP_VERSION||'?'); });
}catch(e){}

/* ── Controllo "nuova versione dashboard disponibile" sul repo GitHub ──────────
   Confronta la versione INSTALLATA (config.yaml via server) con quella nel repo.
   Se il repo è più avanti: 1) notifica in campanella con la nuova versione,
   2) forza HA a rileggere subito lo store (l'aggiornamento compare immediatamente). */
function _verCmp(a,b){
  const pa=String(a).split('.').map(n=>parseInt(n,10)||0), pb=String(b).split('.').map(n=>parseInt(n,10)||0);
  for(let i=0;i<3;i++){ if((pa[i]||0)>(pb[i]||0)) return 1; if((pa[i]||0)<(pb[i]||0)) return -1; }
  return 0;
}
let _appUpdNotified='';
async function _checkDashboardUpdate(){
  try{
    const vr=await fetch('./api/frarik/version?t='+Date.now()).then(r=>r.json()).catch(()=>null);
    const installed=vr&&vr.version; if(!installed) return;
    const g=(typeof _ghCfg==='function')?_ghCfg():{};
    const owner=g.owner||'Frarik', repo=g.repo||'cards', branch=g.branch||'main';
    const url='https://raw.githubusercontent.com/'+owner+'/'+repo+'/'+branch+'/frarik-addon/config.yaml?t='+Date.now();
    const txt=await fetch(url,{cache:'no-store'}).then(r=>r.ok?r.text():null).catch(()=>null); if(!txt) return;
    const m=txt.match(/^version:\s*"?([^"\n]+)"?/m); const latest=m&&m[1].trim(); if(!latest) return;
    if(_verCmp(latest, installed)>0){
      if(_appUpdNotified!==latest){
        _appUpdNotified=latest;
        try{ _ntfPushLog('⬆️ Disponibile nuova versione dashboard',
          'Versione v'+latest+' (installata v'+installed+') — aggiornala da Impostazioni → Add-on di Home Assistant.',
          '⬆️', 'app_avail'); _ntfUpdateBell(); }catch(e){}
      }
      // forza il Supervisor a rileggere il repo → l'update appare subito in HA
      try{ fetch('./api/frarik/reload-store',{method:'POST'}); }catch(e){}
    }
  }catch(e){}
}
setTimeout(_checkDashboardUpdate, 4000);
setInterval(_checkDashboardUpdate, 5*60*1000);

/* ══════════════════════════════════════════════════════════════
   SOS
══════════════════════════════════════════════════════════════ */
let _sosPerson=null;   // persona selezionata nello step 1
let _sosPeopleArr=[];  // array persone caricato all'apertura (evita JSON inline in onclick)

/* helper config */
function _sosCfg(){
  if(!cfg.sos) cfg.sos={contacts:[],persons:[]};
  if(!cfg.sos.contacts) cfg.sos.contacts=[];
  if(!cfg.sos.persons) cfg.sos.persons=[];
  return cfg.sos;
}

/* ── legge le persone da HA (person.*), filtrate per cfg.sos.persons ── */
function _sosGetPeople(){
  const configured=(_sosCfg().persons||[]);
  const all=Object.keys(ha)
    .filter(eid=>eid.startsWith('person.'))
    .map(eid=>({
      entity_id: eid,
      name: ha[eid]?.friendly_name || eid.split('.')[1].replace(/_/g,' '),
      picture: ha[eid]?.entity_picture||null,
      state: hs[eid]||'unknown'
    }));
  // se nessuna persona configurata → mostra tutte quelle di HA
  if(!configured.length) return all;
  return configured.map(eid=>
    all.find(p=>p.entity_id===eid) || {entity_id:eid, name:eid.split('.')[1].replace(/_/g,' '), picture:null, state:'unknown'}
  );
}

/* ── STEP 1: apri — chi sei? ── */
function openSOS(){
  if(_sosCfg().quickMode){ _sosPerson={name:'SOS',entity_id:null}; openSOS2(); return; }  // SOS rapido
  _sosPeopleArr=_sosGetPeople();
  const grid=document.getElementById('sos-people-grid');
  const noP=document.getElementById('sos-no-people');
  if(_sosPeopleArr.length===0){
    grid.innerHTML=''; noP.style.display='';
  } else {
    noP.style.display='none';
    grid.innerHTML=_sosPeopleArr.map((p,idx)=>{
      const stateLabel=_stateIt(p.state);
      const picHTML=p.picture
        ? `<img class="sos-person-pic" src="${BASE}${p.picture}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`+
          `<div class="sos-person-ico" style="display:none">👤</div>`
        : `<div class="sos-person-ico">👤</div>`;
      return `<div class="sos-person-card" data-action="_sosPickPerson" data-action-args='[${idx}]'>
        ${picHTML}
        <div class="sos-person-name">${eh(p.name)}</div>
        <div class="sos-person-state">${stateLabel}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('sos-mod1').classList.remove('off');
}

function _sosPickPerson(idx){
  _sosPerson=_sosPeopleArr[idx];
  closeSOS();
  openSOS2();
}

function closeSOS(){
  document.getElementById('sos-mod1').classList.add('off');
}

/* ── STEP 2: apri — contatta ── */
function openSOS2(){
  const p=_sosPerson;
  /* badge identità */
  const badge=document.getElementById('sos-who-badge');
  badge.innerHTML=`<span style="font-size:18px">👤</span> SOS inviato come: <b>${eh(p.name)}</b>`;

  /* lista contatti — escludi la persona che ha fatto la richiesta */
  const allContacts=_sosCfg().contacts;
  const personName=(p.name||'').trim().toLowerCase();
  const personFirst=personName.split(/\s+/)[0]; // primo nome
  function _nameMatch(contactName){
    const cn=(contactName||'').trim().toLowerCase();
    if(!cn||!personName) return false;
    if(cn===personName) return true;                         // match esatto
    if(cn.startsWith(personFirst+' ')) return true;         // es. "Mario Rossi" → "mario"
    if(personName.startsWith(cn.split(/\s+/)[0]+' ')) return true;
    if(cn.includes(personFirst) || personName.includes(cn.split(/\s+/)[0])) return true;
    return false;
  }
  /* filtra per indice originale così sosCall/sosNotify usano sempre l'indice corretto */
  const visible=allContacts
    .map((c,i)=>({c,i}))
    .filter(({c})=>!_nameMatch(c.name));
  const list=document.getElementById('sos-contacts-list');
  if(!visible.length){
    list.innerHTML=`<div class="sos-no-contacts">${allContacts.length?'Nessun altro contatto disponibile.':'Nessun contatto configurato.'}<br><span style="font-size:10px">${allContacts.length?'':'Aggiungili nel pannello Modifica → sezione SOS.'}</span></div>`;
  } else {
    const anyService=visible.some(({c})=>c.notifyService);
    const allBtn=anyService?`<button class="sos-act-btn sos-act-call" style="width:100%;margin-bottom:10px;justify-content:center;font-weight:800" data-action="sosAlertAll">📢 Avvisa TUTTI i contatti</button>`:'';
    list.innerHTML=allBtn+visible.map(({c,i})=>{
      const hasService=!!c.notifyService;
      const callBtn=hasService
        ? `<button class="sos-act-btn sos-act-call" data-action="sosCall" data-action-args='[${i}]'>🔔 Avvisa</button>` : '';
      const telBtn=c.phone
        ? `<a class="sos-act-btn sos-act-call" href="tel:${eh(c.phone)}" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center">📞 Chiama</a>` : '';
      const msgBtn=hasService
        ? `<button class="sos-act-btn sos-act-notify" data-action="sosNotify" data-action-args='[${i}]'>💬 Messaggio</button>` : '';
      const noSvc=(!hasService&&!c.phone)
        ? `<span style="font-size:10px;color:rgba(255,255,255,.3)">Nessun servizio/numero</span>` : '';
      return `<div class="sos-contact-row">
        <div class="sos-contact-ico">${c.icon||'👤'}</div>
        <div class="sos-contact-name">${eh(c.name||'—')}</div>
        <div class="sos-contact-acts" style="flex-wrap:wrap;gap:6px">${telBtn}${callBtn}${msgBtn}${noSvc}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('sos-mod2').classList.remove('off');
}

function closeSOS2(){
  document.getElementById('sos-mod2').classList.add('off');
  _sosPerson=null;
}

/* ── CHIAMA — alarm stream (bypassa silenzioso, volume massimo) ── */
function sosCall(idx){
  const c=_sosCfg().contacts[idx]; if(!c?.notifyService) return;
  const p=_sosPerson;
  const now=new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
  send({
    type:'call_service',
    domain:'notify',
    service:c.notifyService.replace(/^notify\./,''),
    service_data:{
      title:'📞 CHIAMATA SOS',
      message:(c.message||`${p.name} ti sta chiamando! Rispondi subito.`)+` (${now})`+(_sosLocLink()?`\n📍 ${_sosLocLink()}`:''),
      data:{
        /* Android companion app — usa lo stream ALLARME (bypassa silenzioso/DND) */
        channel:'alarm_stream',
        importance:'high',
        ttl:0,
        priority:'high',
        color:'#ef4444',
        persistent:true,
        sticky:true,
        tag:'sos_call',
        notification_icon:'mdi:phone-alert',
        vibrationPattern:[0,400,200,400,200,400],
        ledColor:'#ef4444',
        /* iOS — critical alert bypassa silenzioso (attiva "Avvisi critici" in Impostazioni → HA → Notifiche) */
        push:{
          sound:{name:'default',critical:1,volume:1.0},
          'interruption-level':'critical',
          badge:1
        }
      }
    }
  });
  showToast(`📞 Chiamata SOS inviata a ${c.name}!`,3000);
  document.getElementById('sos-mod2').classList.add('off');
}

/* ── MESSAGGIO — notifica normale ad alta priorità ── */
function sosNotify(idx){
  const c=_sosCfg().contacts[idx]; if(!c?.notifyService) return;
  const p=_sosPerson;
  const now=new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
  send({
    type:'call_service',
    domain:'notify',
    service:c.notifyService.replace(/^notify\./,''),
    service_data:{
      title:'🆘 Messaggio SOS',
      message:(c.message||`${p.name} ha bisogno di aiuto!`)+` (${now})`+(_sosLocLink()?`\n📍 ${_sosLocLink()}`:''),
      data:{
        /* Android — notifica normale alta priorità, suono notifica standard */
        channel:'sos_message',
        importance:'high',
        ttl:0,
        priority:'high',
        color:'#f59e0b',
        notification_icon:'mdi:message-alert',
        vibrationPattern:[0,250,100,250],
        /* iOS — suono notifica normale */
        push:{
          sound:'default',
          'interruption-level':'time-sensitive',
          badge:1
        }
      }
    }
  });
  showToast(`💬 Messaggio SOS inviato a ${c.name}`);
  document.getElementById('sos-mod2').classList.add('off');
}

/* ── Avvisa TUTTI ── */
function sosAlertAll(){
  const contacts=_sosCfg().contacts;
  if(!contacts.length){ showToast('⚠️ Nessun contatto configurato'); return; }
  let sent=0;
  contacts.forEach((_,i)=>{ sosCall(i); sent++; });
  showToast(`📞 Chiamata SOS inviata a ${sent} contatt${sent===1?'o':'i'}!`,3000);
  document.getElementById('sos-mod2').classList.add('off');
}

/* ── Config contatti SOS nel pannello edit ── */
function renderSOSCfgList(){
  const el=document.getElementById('sos-cfg-list'); if(!el) return;
  const sc=_sosCfg();
  const contacts=sc.contacts;
  const persons=sc.persons||[];

  // ── sezione PERSONE ──
  const allPeople=Object.keys(ha)
    .filter(eid=>eid.startsWith('person.'))
    .map(eid=>({eid, name:ha[eid]?.friendly_name||eid.split('.')[1].replace(/_/g,' ')}));

  // opzioni select: solo quelle non ancora aggiunte
  const availOpts=allPeople
    .filter(p=>!persons.includes(p.eid))
    .map(p=>`<option value="${eh(p.eid)}">${eh(p.name)}</option>`)
    .join('');

  const personRows=persons.map((eid,i)=>{
    const inf=allPeople.find(p=>p.eid===eid);
    const name=inf?inf.name:eid;
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
      <span style="font-size:11px;flex:1;color:var(--fg)">👤 ${eh(name)}</span>
      <button class="sos-cfg-del" data-action="sosRemovePerson" data-action-args='[${i}]' title="Rimuovi">✕</button>
    </div>`;
  }).join('');

  const personSec=`
    <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Persone visibili nel popup SOS</div>
    ${personRows||'<div style="font-size:10px;color:var(--dim);padding:4px 0">Nessuna selezionata — verranno mostrate tutte quelle di HA</div>'}
    ${availOpts?`<div style="display:flex;gap:6px;margin-top:6px;align-items:center">
      <select id="sos-person-sel" class="sos-cfg-inp" style="flex:1">
        <option value="">— Seleziona persona —</option>${availOpts}
      </select>
      <button class="sos-cfg-add" style="padding:4px 10px;margin:0" data-action="sosAddPerson">➕</button>
    </div>`:'<div style="font-size:10px;color:var(--dim);margin-top:4px">Tutte le persone HA sono già incluse</div>'}
    <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);cursor:pointer;margin:8px 0">
      <input type="checkbox" ${sc.quickMode?'checked':''} data-input="_sosSetQuick"> ⚡ SOS rapido (salta la scelta "chi sei", vai diretto ai contatti)
    </label>
    <div style="height:12px;border-bottom:1px solid rgba(255,255,255,.06);margin:6px 0 10px"></div>
    <div style="font-size:10px;font-weight:700;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Contatti di emergenza</div>`;

  // ── sezione CONTATTI ──
  const contactRows=contacts.length
    ? contacts.map((c,i)=>`
      <div class="sos-cfg-contact">
        <div style="display:flex;flex-direction:column;gap:1px">
          <button class="sos-cfg-del" data-action="sosMoveContact" data-action-args='[${i},-1]' title="Su" style="font-size:10px;padding:0 4px;${i===0?'opacity:.25;pointer-events:none':''}">▲</button>
          <button class="sos-cfg-del" data-action="sosMoveContact" data-action-args='[${i},1]' title="Giù" style="font-size:10px;padding:0 4px;${i===contacts.length-1?'opacity:.25;pointer-events:none':''}">▼</button>
        </div>
        <div style="display:flex;gap:3px;align-items:center">
          <input class="sos-cfg-ico-inp" type="text" value="${eh(c.icon||'👤')}" placeholder="👤"
            data-input="sosUpdateContact" data-input-args='[${i},"icon"]'>
          <button class="ntf-pick-btn" style="width:26px;height:26px;border-radius:6px;font-size:12px" title="Scegli icona"
            data-action="_sosPickIcon" data-action-args='[${i}]' data-action-el="true">🎨</button>
        </div>
        <div class="sos-cfg-fields">
          <input class="sos-cfg-inp" type="text" value="${eh(c.name||'')}" placeholder="Nome contatto"
            data-input="sosUpdateContact" data-input-args='[${i},"name"]'>
          <div style="display:flex;gap:5px;align-items:center">
            <input id="sos-svc-inp-${i}" class="sos-cfg-inp" type="text" value="${eh(c.notifyService||'')}" placeholder="Servizio HA notify (es. mobile_app_pixel_7)"
              data-input="sosUpdateContact" data-input-args='[${i},"notifyService"]' style="flex:1">
            <button class="ntf-pick-btn" style="width:28px;height:28px;border-radius:7px;font-size:13px" title="Sfoglia servizi notify"
              data-action="_sosPickService" data-action-args='[${i}]'>🔍</button>
          </div>
          <input class="sos-cfg-inp" type="tel" value="${eh(c.phone||'')}" placeholder="📞 Numero di telefono (opzionale)"
            data-input="sosUpdateContact" data-input-args='[${i},"phone"]'>
          <input class="sos-cfg-inp" type="text" value="${eh(c.message||'')}" placeholder="💬 Messaggio personalizzato (opzionale)"
            data-input="sosUpdateContact" data-input-args='[${i},"message"]'>
        </div>
        <button class="sos-cfg-del" data-action="sosDeleteContact" data-action-args='[${i}]' title="Elimina">🗑</button>
      </div>`).join('')
    : '<div style="font-size:10px;color:var(--dim);text-align:center;padding:6px 0">Nessun contatto</div>';

  el.innerHTML=personSec+contactRows;
}

function sosAddPerson(){
  const sel=document.getElementById('sos-person-sel'); if(!sel||!sel.value) return;
  const sc=_sosCfg();
  if(!sc.persons) sc.persons=[];
  if(!sc.persons.includes(sel.value)) sc.persons.push(sel.value);
  saveCfg(); renderSOSCfgList();
}

function sosRemovePerson(i){
  const sc=_sosCfg();
  if(!sc.persons) return;
  sc.persons.splice(i,1);
  saveCfg(); renderSOSCfgList();
}

function sosAddContact(){
  _sosCfg().contacts.push({id:uid(),name:'',icon:'👤',phone:'',message:'',notifyService:''});
  saveCfg(); renderSOSCfgList();
}

function sosUpdateContact(i,field,val){
  const c=_sosCfg().contacts[i]; if(!c) return;
  c[field]=val; saveCfg();
}

function sosDeleteContact(i){
  _sosCfg().contacts.splice(i,1);
  saveCfg(); renderSOSCfgList();
}

function sosMoveContact(i,dir){
  const arr=_sosCfg().contacts, j=i+dir;
  if(j<0||j>=arr.length) return;
  [arr[i],arr[j]]=[arr[j],arr[i]];
  saveCfg(); renderSOSCfgList();
}
function _sosSetQuick(val){ _sosCfg().quickMode=!!val; saveCfg(); }

/* link Google Maps dalla posizione GPS della persona che ha lanciato l'SOS (se disponibile) */
function _sosLocLink(){
  try{ const eid=_sosPerson&&_sosPerson.entity_id; const a=eid?(ha[eid]||{}):{};
    if(a.latitude!=null&&a.longitude!=null) return 'https://maps.google.com/?q='+a.latitude+','+a.longitude;
  }catch(e){} return '';
}


/* hook: renderizza lista SOS quando si apre il pannello edit */
const _origToggleEdit=toggleEdit;
// (viene chiamata renderSOSCfgList in toggleEdit tramite patch qui sotto)

/* ══════════════════════════════════════════════════════════════
   FREE CANVAS CARD EDITOR
══════════════════════════════════════════════════════════════ */
let _feCardId=null, _feSelIdx=null, _feDrag=null, _feResize=null, _feSnap=5;

function _feGetCard(){
  for(const p of cfg.pages||[]){ const c=p.cards.find(c=>c.id===_feCardId); if(c) return c; }
  return null;
}

function openFE(cardId){
  _feCardId=cardId; _feSelIdx=null; _feDrag=null; _feResize=null;
  document.getElementById('fe-modal').classList.remove('off');
  const card=_feGetCard(); if(!card) return;
  const s=id=>document.getElementById(id);
  s('fe-inp-w').value=card.canvasW||360;
  s('fe-inp-h').value=card.canvasH||200;
  s('fe-inp-bg').value=card.canvasBg||'';
  s('fe-inp-br').value=card.canvasBorderRadius||'16px';
  s('fe-inp-bord').value=card.canvasBorderStr||'';
  s('fe-inp-snap').value=_feSnap;
  _feRenderCanvas();
  _feRenderProps();
}

function closeFE(){
  document.getElementById('fe-modal').classList.add('off');
  _feCardId=null; _feSelIdx=null;
  renderDash();
}

/* ── Render canvas nel editor ── */
function _feRenderCanvas(){
  const card=_feGetCard(); if(!card) return;
  const frame=document.getElementById('fe-canvas-frame'); if(!frame) return;
  const w=+(card.canvasW||360), h=+(card.canvasH||200);
  frame.style.cssText=`width:${w}px;height:${h}px;background:${card.canvasBg||'var(--card)'};border-radius:${card.canvasBorderRadius||'16px'};border:${card.canvasBorderStr||'1px solid var(--bd)'};position:relative;overflow:hidden;flex-shrink:0;box-shadow:0 12px 48px rgba(0,0,0,.7)`;
  frame.innerHTML=(card.canvasElements||[]).map((el,idx)=>_feElHTML(el,idx)).join('');
  (card.canvasElements||[]).forEach((_,idx)=>{
    const div=document.getElementById('fe-el-'+idx); if(!div) return;
    div.addEventListener('mousedown',e=>{
      if(e.target.classList.contains('fe-el-resize')||e.target.classList.contains('fe-el-del')) return;
      e.preventDefault(); e.stopPropagation();
      if(_feSelIdx!==idx){ _feSelIdx=idx; _feRenderCanvas(); _feRenderProps(); }
      const el=(card.canvasElements||[])[idx];
      _feDrag={idx,startX:e.clientX,startY:e.clientY,origX:el.x,origY:el.y};
    });
    const rh=div.querySelector('.fe-el-resize');
    if(rh) rh.addEventListener('mousedown',e=>{
      e.preventDefault(); e.stopPropagation();
      if(_feSelIdx!==idx){ _feSelIdx=idx; _feRenderCanvas(); _feRenderProps(); }
      const el=(card.canvasElements||[])[idx];
      _feResize={idx,startX:e.clientX,startY:e.clientY,origW:el.w,origH:el.h};
    });
  });
  frame.addEventListener('mousedown',e=>{
    if(e.target===frame){ _feSelIdx=null; _feRenderCanvas(); _feRenderProps(); }
  });
}

/* ── HTML di un singolo elemento nell'editor ── */
function _feElHTML(el,idx){
  const sel=idx===_feSelIdx;
  const s=`left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px`;
  return `<div id="fe-el-${idx}" class="fe-canvas-el${sel?' fe-sel':''}" style="${s}">
    ${_feElContent(el)}
    <button class="fe-el-del" data-action="feDelEl" data-action-args='[${idx}]'>✕</button>
    <div class="fe-el-resize"></div>
  </div>`;
}

/* ── Contenuto elemento (editor + view) ── */
function _feElContent(el){
  switch(el.type){
    case 'text':
      return `<div style="font-size:${el.fontSize||16}px;color:${el.color||'#e2e8f0'};font-weight:${el.fontWeight||'600'};text-align:${el.textAlign||'left'};width:100%;height:100%;display:flex;align-items:center;padding:0 4px;box-sizing:border-box;overflow:hidden;line-height:1.3;pointer-events:none">${(el.text||'Testo').replace(/\n/g,'<br>')}</div>`;
    case 'sensor':{
      const v=hs[el.entity]; const a=ha[el.entity]||{};
      const unit=(el.showUnit!==false)?(a.unit_of_measurement||el.unit||''):'';
      const name=(el.showName!==false)?(a.friendly_name||el.entity||''):'';
      const val=v!==undefined?_stateIt(String(v)):'—';
      return `<div style="display:flex;flex-direction:column;justify-content:center;height:100%;padding:2px 6px;overflow:hidden;box-sizing:border-box;pointer-events:none">
        <div style="font-size:${el.valueFontSize||24}px;color:${el.valueColor||'var(--fg)'};font-weight:700;line-height:1.1;white-space:nowrap">${val}${unit?`<span style="font-size:.55em;opacity:.7"> ${unit}</span>`:''}</div>
        ${name?`<div style="font-size:${el.labelFontSize||11}px;color:${el.labelColor||'var(--muted)'};margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(name)}</div>`:''}
      </div>`;
    }
    case 'button':
      return `<button style="width:100%;height:100%;background:${el.bg||'rgba(99,102,241,0.2)'};border:${el.border||'1px solid rgba(99,102,241,0.4)'};border-radius:${el.borderRadius||'10px'};color:${el.color||'#a5b4fc'};font-size:${el.fontSize||13}px;font-weight:700;cursor:pointer;overflow:hidden;box-sizing:border-box">${el.icon?`${_renderIcon(el.icon,el.fontSize||13,el.color||'#a5b4fc')} `:''}${eh(el.label||'Bottone')}</button>`;
    case 'icon':
      return `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;pointer-events:none">${_renderIcon(el.icon||'🏠',el.size||32,el.color||'currentColor')}</div>`;
    case 'shape':
      return `<div style="width:100%;height:100%;background:${el.bg||'rgba(255,255,255,0.1)'};border:${el.border||'none'};border-radius:${el.borderRadius||'0'};opacity:${el.opacity||1};pointer-events:none"></div>`;
    case 'image':
      return el.src?`<img src="${el.src}" style="width:100%;height:100%;object-fit:${el.objectFit||'cover'};border-radius:${el.borderRadius||'0'};opacity:${el.opacity||1};display:block;pointer-events:none">`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:11px;pointer-events:none">🖼️</div>`;
    default:
      return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:9px">${el.type}</div>`;
  }
}

/* ── Render pannello proprietà ── */
function _feRenderProps(){
  const body=document.getElementById('fe-props-body'); if(!body) return;
  const card=_feGetCard(); if(!card){body.innerHTML='';return;}
  if(_feSelIdx===null){
    body.innerHTML='<div class="fe-no-sel">Seleziona un elemento<br>per modificarlo,<br>oppure aggiungine uno<br>dalla barra in alto.</div>';
    return;
  }
  const el=(card.canvasElements||[])[_feSelIdx]; if(!el) return;
  const typeLabel={text:'Testo',sensor:'Sensore',button:'Bottone',icon:'Icona',shape:'Forma',image:'Immagine'}[el.type]||el.type;

  let h=`<div style="font-size:11px;font-weight:700;color:var(--fg);margin-bottom:10px">${typeLabel}</div>`;

  // Posizione e dimensioni
  h+=`<div class="fe-sec-lbl">Posizione e dimensioni</div>
  <div class="fe-prop-2">
    <div><div class="fe-prop-lbl">X</div><input class="fe-prop-inp" type="number" value="${el.x}" data-input="feUp" data-input-args='["x"]' data-input-num="true"></div>
    <div><div class="fe-prop-lbl">Y</div><input class="fe-prop-inp" type="number" value="${el.y}" data-input="feUp" data-input-args='["y"]' data-input-num="true"></div>
  </div>
  <div class="fe-prop-2">
    <div><div class="fe-prop-lbl">Larghezza</div><input class="fe-prop-inp" type="number" value="${el.w}" data-input="feUp" data-input-args='["w"]' data-input-num="true"></div>
    <div><div class="fe-prop-lbl">Altezza</div><input class="fe-prop-inp" type="number" value="${el.h}" data-input="feUp" data-input-args='["h"]' data-input-num="true"></div>
  </div>`;

  // Proprietà specifiche per tipo
  switch(el.type){
    case 'text':
      h+=`<div class="fe-sec-lbl">Testo</div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Contenuto</div><textarea class="fe-prop-inp" rows="3" data-input="feUp" data-input-args='["text"]'>${eh(el.text||'')}</textarea></div>
      <div class="fe-prop-2">
        <div><div class="fe-prop-lbl">Dimensione</div><input class="fe-prop-inp" type="number" value="${el.fontSize||16}" data-input="feUp" data-input-args='["fontSize"]' data-input-num="true"></div>
        <div><div class="fe-prop-lbl">Peso</div><select class="fe-prop-inp" data-input="feUp" data-input-args='["fontWeight"]'>
          <option value="400"${el.fontWeight==='400'?' selected':''}>Normale</option>
          <option value="600"${(el.fontWeight||'600')==='600'?' selected':''}>Semibold</option>
          <option value="700"${el.fontWeight==='700'?' selected':''}>Bold</option>
          <option value="900"${el.fontWeight==='900'?' selected':''}>Black</option>
        </select></div>
      </div>
      <div class="fe-prop-2">
        <div><div class="fe-prop-lbl">Colore</div><input class="fe-prop-inp" type="color" value="${el.color||'#e2e8f0'}" data-input="feUp" data-input-args='["color"]' style="height:32px;padding:2px"></div>
        <div><div class="fe-prop-lbl">Allineamento</div><select class="fe-prop-inp" data-input="feUp" data-input-args='["textAlign"]'>
          <option value="left"${!el.textAlign||el.textAlign==='left'?' selected':''}>Sin</option>
          <option value="center"${el.textAlign==='center'?' selected':''}>Centro</option>
          <option value="right"${el.textAlign==='right'?' selected':''}>Des</option>
        </select></div>
      </div>`;
      break;
    case 'sensor':
      h+=`<div class="fe-sec-lbl">Sensore</div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Entità (entity_id)</div><input class="fe-prop-inp" type="text" value="${eh(el.entity||'')}" placeholder="sensor.temperatura" data-input="feUp" data-input-args='["entity"]'></div>
      <div class="fe-prop-2">
        <div><div class="fe-prop-lbl">Font valore</div><input class="fe-prop-inp" type="number" value="${el.valueFontSize||24}" data-input="feUp" data-input-args='["valueFontSize"]' data-input-num="true"></div>
        <div><div class="fe-prop-lbl">Font etichetta</div><input class="fe-prop-inp" type="number" value="${el.labelFontSize||11}" data-input="feUp" data-input-args='["labelFontSize"]' data-input-num="true"></div>
      </div>
      <div class="fe-prop-2">
        <div><div class="fe-prop-lbl">Colore valore</div><input class="fe-prop-inp" type="color" value="${el.valueColor||'#f1f5f9'}" data-input="feUp" data-input-args='["valueColor"]' style="height:32px;padding:2px"></div>
        <div><div class="fe-prop-lbl">Colore etichetta</div><input class="fe-prop-inp" type="color" value="${el.labelColor||'#94a3b8'}" data-input="feUp" data-input-args='["labelColor"]' style="height:32px;padding:2px"></div>
      </div>
      <label class="fe-prop-check"><input type="checkbox" ${el.showName!==false?'checked':''} data-input="feUp" data-input-args='["showName"]'> Mostra nome entità</label>
      <label class="fe-prop-check"><input type="checkbox" ${el.showUnit!==false?'checked':''} data-input="feUp" data-input-args='["showUnit"]'> Mostra unità di misura</label>`;
      break;
    case 'button':
      h+=`<div class="fe-sec-lbl">Bottone</div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Etichetta</div><input class="fe-prop-inp" type="text" value="${eh(el.label||'')}" placeholder="Bottone" data-input="feUp" data-input-args='["label"]'></div>
      <div class="fe-prop-2">
        <div><div class="fe-prop-lbl">Icona</div><div style="display:flex;gap:4px"><input class="fe-prop-inp" id="fe-ico-btn-inp" type="text" value="${eh(el.icon||'')}" placeholder="💡 o mdi:home" data-input="feUp" data-input-args='["icon"]'><button class="ntf-pick-btn" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;font-size:12px" data-action="_fePickIconBtn" data-action-el="true">🎨</button></div></div>
        <div><div class="fe-prop-lbl">Font (px)</div><input class="fe-prop-inp" type="number" value="${el.fontSize||13}" data-input="feUp" data-input-args='["fontSize"]' data-input-num="true"></div>
      </div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Azione al clic</div><select class="fe-prop-inp" data-input="feUp" data-input-args='["action"]'>
        <option value="toggle"${!el.action||el.action==='toggle'?' selected':''}>Toggle entità</option>
        <option value="service"${el.action==='service'?' selected':''}>Chiama servizio HA</option>
        <option value="popup"${el.action==='popup'?' selected':''}>Apri popup info</option>
        <option value="navigate"${el.action==='navigate'?' selected':''}>Naviga URL</option>
      </select></div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Entità / Servizio / URL</div><input class="fe-prop-inp" type="text" value="${eh(el.entity||el.url||el.service||'')}" placeholder="light.soggiorno" data-input="feUp" data-input-args='["entity"]'></div>
      <div class="fe-sec-lbl">Stile</div>
      <div class="fe-prop-2">
        <div><div class="fe-prop-lbl">Colore testo</div><input class="fe-prop-inp" type="color" value="${el.color||'#a5b4fc'}" data-input="feUp" data-input-args='["color"]' style="height:32px;padding:2px"></div>
        <div><div class="fe-prop-lbl">Bordo-raggio</div><input class="fe-prop-inp" type="text" value="${eh(el.borderRadius||'10px')}" data-input="feUp" data-input-args='["borderRadius"]'></div>
      </div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Sfondo</div><input class="fe-prop-inp" type="text" value="${eh(el.bg||'rgba(99,102,241,0.2)')}" placeholder="rgba(…)" data-input="feUp" data-input-args='["bg"]'></div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Bordo CSS</div><input class="fe-prop-inp" type="text" value="${eh(el.border||'1px solid rgba(99,102,241,0.4)')}" placeholder="1px solid …" data-input="feUp" data-input-args='["border"]'></div>`;
      break;
    case 'icon':
      h+=`<div class="fe-sec-lbl">Icona</div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Icona</div><div style="display:flex;gap:4px;align-items:center"><input class="fe-prop-inp" id="fe-ico-el-inp" type="text" value="${eh(el.icon||'🏠')}" data-input="feUp" data-input-args='["icon"]' placeholder="🏠 o mdi:home"><button class="ntf-pick-btn" style="width:28px;height:28px;border-radius:7px;flex-shrink:0;font-size:12px" data-action="_fePickIconEl" data-action-el="true">🎨</button></div></div>
      <div class="fe-prop-2">
        <div><div class="fe-prop-lbl">Dimensione (px)</div><input class="fe-prop-inp" type="number" value="${el.size||32}" data-input="feUp" data-input-args='["size"]' data-input-num="true"></div>
        <div><div class="fe-prop-lbl">Colore</div><input class="fe-prop-inp" type="color" value="${el.color||'#818cf8'}" data-input="feUp" data-input-args='["color"]' style="height:32px;padding:2px"></div>
      </div>`;
      break;
    case 'shape':
      h+=`<div class="fe-sec-lbl">Forma</div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Sfondo</div><input class="fe-prop-inp" type="text" value="${eh(el.bg||'rgba(255,255,255,0.1)')}" placeholder="rgba(…) o #hex" data-input="feUp" data-input-args='["bg"]'></div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Bordo CSS</div><input class="fe-prop-inp" type="text" value="${eh(el.border||'none')}" placeholder="1px solid #fff" data-input="feUp" data-input-args='["border"]'></div>
      <div class="fe-prop-2">
        <div><div class="fe-prop-lbl">Bordo-raggio</div><input class="fe-prop-inp" type="text" value="${eh(el.borderRadius||'0')}" data-input="feUp" data-input-args='["borderRadius"]'></div>
        <div><div class="fe-prop-lbl">Opacità</div><input class="fe-prop-inp" type="number" min="0" max="1" step=".05" value="${el.opacity||1}" data-input="feUp" data-input-args='["opacity"]' data-input-num="true"></div>
      </div>`;
      break;
    case 'image':
      h+=`<div class="fe-sec-lbl">Immagine</div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">URL (es. /local/img.png)</div><input class="fe-prop-inp" type="text" value="${eh(el.src||'')}" placeholder="/local/immagine.png" data-input="feUp" data-input-args='["src"]'></div>
      <div class="fe-prop-2">
        <div><div class="fe-prop-lbl">Bordo-raggio</div><input class="fe-prop-inp" type="text" value="${eh(el.borderRadius||'0')}" data-input="feUp" data-input-args='["borderRadius"]'></div>
        <div><div class="fe-prop-lbl">Opacità</div><input class="fe-prop-inp" type="number" min="0" max="1" step=".05" value="${el.opacity||1}" data-input="feUp" data-input-args='["opacity"]' data-input-num="true"></div>
      </div>
      <div class="fe-prop-row"><div class="fe-prop-lbl">Adattamento</div><select class="fe-prop-inp" data-input="feUp" data-input-args='["objectFit"]'>
        <option value="cover"${!el.objectFit||el.objectFit==='cover'?' selected':''}>Cover (riempi)</option>
        <option value="contain"${el.objectFit==='contain'?' selected':''}>Contain (adatta)</option>
        <option value="fill"${el.objectFit==='fill'?' selected':''}>Fill (stira)</option>
      </select></div>`;
      break;
  }

  h+=`<div style="margin-top:14px"><button data-action="feDelEl" data-action-args='[${_feSelIdx}]' style="width:100%;padding:7px;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:#f87171;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer">🗑 Elimina elemento</button></div>`;
  body.innerHTML=h;
}

/* ── Aggiorna campo elemento ── */
function feUp(field, val){
  const card=_feGetCard(); if(!card||_feSelIdx===null) return;
  const el=(card.canvasElements||[])[_feSelIdx]; if(!el) return;
  el[field]=val; saveCfg();
  const div=document.getElementById('fe-el-'+_feSelIdx); if(!div) return;
  if(field==='x'){div.style.left=val+'px';return;}
  if(field==='y'){div.style.top=val+'px';return;}
  if(field==='w'){div.style.width=val+'px';return;}
  if(field==='h'){div.style.height=val+'px';return;}
  // ricrea solo il contenuto
  const rh=div.querySelector('.fe-el-resize');
  const db=div.querySelector('.fe-el-del');
  div.innerHTML=_feElContent(el);
  if(db) div.appendChild(db);
  if(rh) div.appendChild(rh);
}

/* ── Aggiorna impostazioni canvas ── */
function feUpdCard(field, val){
  const card=_feGetCard(); if(!card) return;
  card[field]=val; saveCfg();
  const frame=document.getElementById('fe-canvas-frame'); if(!frame) return;
  if(field==='canvasW') frame.style.width=val+'px';
  else if(field==='canvasH') frame.style.height=val+'px';
  else if(field==='canvasBg') frame.style.background=val||'var(--card)';
  else if(field==='canvasBorderRadius') frame.style.borderRadius=val||'16px';
  else if(field==='canvasBorderStr') frame.style.border=val||'1px solid var(--bd)';
}

/* ── Aggiungi elemento ── */
function feAddEl(type){
  const card=_feGetCard(); if(!card) return;
  if(!card.canvasElements) card.canvasElements=[];
  const w=+(card.canvasW||360), h=+(card.canvasH||200);
  const defs={
    text:  {type:'text',  w:160,h:38, text:'Testo',fontSize:16,color:'#e2e8f0',fontWeight:'600',textAlign:'left'},
    sensor:{type:'sensor',w:175,h:62, entity:'',showName:true,showUnit:true,valueFontSize:28,labelFontSize:11,valueColor:'#f1f5f9',labelColor:'#94a3b8'},
    button:{type:'button',w:135,h:44, label:'Bottone',icon:'',action:'toggle',entity:'',bg:'rgba(99,102,241,0.2)',color:'#a5b4fc',borderRadius:'10px',fontSize:13,border:'1px solid rgba(99,102,241,0.4)'},
    icon:  {type:'icon',  w:52, h:52, icon:'🏠',color:'#818cf8',size:36},
    shape: {type:'shape', w:200,h:4,  bg:'rgba(255,255,255,0.12)',border:'none',borderRadius:'3px',opacity:1},
    image: {type:'image', w:120,h:100,src:'',objectFit:'cover',borderRadius:'8px',opacity:1},
  };
  const def=defs[type]||defs.text;
  const newEl={...def,id:uid(),x:Math.round((w/2-def.w/2)/_feSnap)*_feSnap,y:Math.round((h/2-def.h/2)/_feSnap)*_feSnap};
  card.canvasElements.push(newEl);
  _feSelIdx=card.canvasElements.length-1;
  saveCfg(); _feRenderCanvas(); _feRenderProps();
}

/* ── Elimina elemento ── */
function feDelEl(idx){
  const card=_feGetCard(); if(!card) return;
  (card.canvasElements||[]).splice(idx,1);
  if(_feSelIdx>=((card.canvasElements||[]).length)) _feSelIdx=(card.canvasElements||[]).length-1;
  if(_feSelIdx<0) _feSelIdx=null;
  saveCfg(); _feRenderCanvas(); _feRenderProps();
}

/* ── Entity Picker ── */
function feOpenEP(){
  const ep=document.getElementById('fe-ep');
  ep.style.display='flex';
  const q=document.getElementById('fe-ep-q');
  q.value=''; q.focus();
  _feEpSearch('');
}

function _feEpSearch(q){
  const list=document.getElementById('fe-ep-list'); if(!list) return;
  const lq=(q||'').toLowerCase().trim();
  const entries=Object.keys(ha)
    .filter(eid=>!lq||eid.includes(lq)||(ha[eid]?.friendly_name||'').toLowerCase().includes(lq))
    .slice(0,60);
  if(!entries.length){
    list.innerHTML='<div style="padding:16px;text-align:center;font-size:12px;color:var(--muted)">Nessuna entità trovata</div>';
    return;
  }
  list.innerHTML=entries.map(eid=>{
    const a=ha[eid]||{};
    const name=a.friendly_name||eid;
    const val=hs[eid]!==undefined?hs[eid]:'—';
    const unit=a.unit_of_measurement||'';
    const domain=eid.split('.')[0];
    const domainColors={sensor:'#60a5fa',binary_sensor:'#34d399',light:'#fbbf24',switch:'#a78bfa',climate:'#fb923c',media_player:'#f472b6',person:'#4ade80',weather:'#22d3ee',cover:'#94a3b8',automation:'#c084fc',script:'#f87171'};
    const col=domainColors[domain]||'#818cf8';
    return `<div data-action="feAddEntity" data-action-arg="${eid}" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:background .12s" onmouseover="this.style.background='rgba(99,102,241,.12)'" onmouseout="this.style.background=''">
      <div style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${eh(name)}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:1px">${eid}</div>
      </div>
      <div style="font-size:12px;font-weight:700;color:${col};white-space:nowrap">${_stateIt(String(val))}${unit?' '+unit:''}</div>
    </div>`;
  }).join('');
}

function feAddEntity(eid){
  document.getElementById('fe-ep').style.display='none';
  const a=ha[eid]||{};
  const name=a.friendly_name||eid;
  const card=_feGetCard(); if(!card) return;
  if(!card.canvasElements) card.canvasElements=[];
  const w=+(card.canvasW||360), h=+(card.canvasH||200);
  // determina tipo di display in base al domain
  const domain=eid.split('.')[0];
  let newEl;
  if(domain==='light'||domain==='switch'||domain==='input_boolean'){
    // Toggle button
    newEl={type:'button',w:140,h:46,label:name,icon:'💡',action:'toggle',entity:eid,
      bg:'rgba(251,191,36,0.15)',color:'#fbbf24',borderRadius:'12px',fontSize:13,border:'1px solid rgba(251,191,36,0.35)'};
  } else if(domain==='cover'){
    newEl={type:'button',w:140,h:46,label:name,icon:'🪟',action:'toggle',entity:eid,
      bg:'rgba(148,163,184,0.15)',color:'#94a3b8',borderRadius:'12px',fontSize:13,border:'1px solid rgba(148,163,184,0.3)'};
  } else {
    // Sensor (valore + nome)
    newEl={type:'sensor',w:160,h:60,entity:eid,showName:true,showUnit:true,
      valueFontSize:24,labelFontSize:11,valueColor:'#f1f5f9',labelColor:'#94a3b8'};
  }
  newEl.id=uid();
  // posiziona con leggero offset per non sovrapporsi
  const offset=(card.canvasElements.length%5)*10;
  newEl.x=Math.min(w-newEl.w, 20+offset);
  newEl.y=Math.min(h-newEl.h, 20+offset);
  card.canvasElements.push(newEl);
  _feSelIdx=card.canvasElements.length-1;
  saveCfg(); _feRenderCanvas(); _feRenderProps();
}

/* ── Mouse drag / resize globali ── */
document.addEventListener('mousemove',e=>{
  if(_feDrag){
    const card=_feGetCard(); if(!card) return;
    const el=(card.canvasElements||[])[_feDrag.idx]; if(!el) return;
    const cw=+(card.canvasW||360), ch=+(card.canvasH||200);
    const dx=e.clientX-_feDrag.startX, dy=e.clientY-_feDrag.startY;
    el.x=Math.max(0,Math.min(cw-el.w, Math.round((_feDrag.origX+dx)/_feSnap)*_feSnap));
    el.y=Math.max(0,Math.min(ch-el.h, Math.round((_feDrag.origY+dy)/_feSnap)*_feSnap));
    const div=document.getElementById('fe-el-'+_feDrag.idx);
    if(div){div.style.left=el.x+'px';div.style.top=el.y+'px';}
  }
  if(_feResize){
    const card=_feGetCard(); if(!card) return;
    const el=(card.canvasElements||[])[_feResize.idx]; if(!el) return;
    const dx=e.clientX-_feResize.startX, dy=e.clientY-_feResize.startY;
    el.w=Math.max(20,Math.round((_feResize.origW+dx)/_feSnap)*_feSnap);
    el.h=Math.max(10,Math.round((_feResize.origH+dy)/_feSnap)*_feSnap);
    const div=document.getElementById('fe-el-'+_feResize.idx);
    if(div){div.style.width=el.w+'px';div.style.height=el.h+'px';}
  }
});
document.addEventListener('mouseup',()=>{
  if(_feDrag||_feResize){_feDrag=null;_feResize=null;saveCfg();}
});

/* ── Render card in dashboard (view mode) ── */
function _freeCanvasViewInner(card){
  const els=card.canvasElements||[];
  if(!els.length) return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:11px;flex-direction:column;gap:6px"><div style="font-size:24px">🎨</div>Canvas vuoto<br><span style="font-size:9px">Attiva modifica → 🎨 per aggiungere elementi</span></div>`;
  const frame=`width:${+(card.canvasW||360)}px;height:${+(card.canvasH||200)}px;background:${card.canvasBg||'transparent'};border-radius:${card.canvasBorderRadius||'0'};`;
  return `<div style="position:relative;${frame}overflow:hidden">` +
    els.map((el,idx)=>{
      const style=`position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;box-sizing:border-box;overflow:hidden`;
      const onclick=el.type==='button'?` data-action="_feClick" data-action-args='["${card.id}",${idx}]'` : '';
      return `<div style="${style}" class="free-el-v"${onclick}>${_feElContent(el)}</div>`;
    }).join('') + '</div>';
}

/* ── Gestione clic sui bottoni in view mode ── */
function _feClick(cardId,elIdx){
  if(editMode) return;
  let card=null;
  for(const p of cfg.pages||[]){ const c=p.cards.find(c=>c.id===cardId); if(c){card=c;break;} }
  if(!card) return;
  const el=(card.canvasElements||[])[elIdx]; if(!el) return;
  switch(el.action){
    case 'toggle': if(el.entity) send({type:'call_service',domain:'homeassistant',service:'toggle',service_data:{entity_id:el.entity}}); break;
    case 'service': if(el.entity){const parts=el.entity.split('.'); send({type:'call_service',domain:parts[0],service:parts.slice(1).join('.'),service_data:{entity_id:el.entity}});} break;
    case 'popup': if(el.entity) openInfoModal(el.entity); break;
    case 'navigate': if(el.entity) window.location.href=el.entity; break;
  }
}

/* ═══════════════════════════════════════════════════════
   SMART NOTIFICATION SYSTEM
═══════════════════════════════════════════════════════ */

/* ── Config accessor ── */
function _ntfCfg(){
  if(!cfg.notifRules) cfg.notifRules=[];
  return cfg.notifRules;
}

/* ── Runtime state ── */
let _ntfQueue=[];
let _ntfActive=null;
let _ntfStartTimes={};    // entity_id → timestamp when turned on (for duration calc)
let _ntfDailyCount={};    // ruleId → {date:'YYYY-MM-DD', count:N} — incrementi odierni
let _ntfAutoCloseTimer=null; // timer auto-chiusura quando nessuno è in casa
let _ntfOnForTimers={};      // ruleId → timeout (trigger "acceso da più di X minuti")

/* Guardie comuni: condizione "solo se" (un'altra entità in un dato stato) + fascia oraria */
function _ntfPassesGuards(rule){
  // Condizione "solo se"
  if(rule.condEntity){
    const cs=String((typeof hs!=='undefined'&&hs[rule.condEntity])??'');
    const cv=String(rule.condValue??'');
    const ok=(rule.condOp==='is_not')?(cs!==cv):(cs===cv);
    if(!ok) return false;
  }
  // Fascia oraria
  if(rule.timeFrom && rule.timeTo){
    const now=new Date(), mins=now.getHours()*60+now.getMinutes();
    const toM=t=>{const a=String(t||'0:0').split(':').map(Number);return (a[0]||0)*60+(a[1]||0);};
    const f=toM(rule.timeFrom), t=toM(rule.timeTo);
    const inWin = f<=t ? (mins>=f&&mins<=t) : (mins>=f||mins<=t);
    if(!inWin) return false;
  }
  return true;
}

/* ── Check rule triggers on every state_changed ── */
function _notifCheck(eid, prevState, newState){
  if(prevState===undefined) return;
  if(prevState===newState) return;
  // Track appliance start time (for duration display)
  const isOn=(newState==='on'||newState==='true');
  const wasOn=(prevState==='on'||prevState==='true');
  if(isOn&&!wasOn) _ntfStartTimes[eid]=Date.now();
  const rules=_ntfCfg();
  for(const rule of rules){
    if(!rule.enabled) continue;
    if(rule.entity!==eid) continue;
    const trigger=rule.trigger||'any_change';
    // "Acceso da più di X minuti": timer dedicato, fuori dal flusso a cambio-stato
    if(trigger==='on_for'){
      if(isOn && !wasOn){
        const mins=Math.max(0.1, parseFloat(rule.onForMin||0)||0);
        clearTimeout(_ntfOnForTimers[rule.id]);
        _ntfOnForTimers[rule.id]=setTimeout(()=>{
          const cur=String((typeof hs!=='undefined'&&hs[eid])||'');
          if((cur==='on'||cur==='true') && _ntfPassesGuards(rule)){
            const ctx=_ntfBuildContext(rule, cur, 'on', Date.now()-(_ntfStartTimes[eid]||Date.now()));
            _ntfQueue.push({rule, ctx}); if(!_ntfActive) _ntfShowNext();
          }
        }, mins*60000);
      } else if(wasOn && !isOn){ clearTimeout(_ntfOnForTimers[rule.id]); }
      continue;
    }
    let triggered=false;
    if(trigger==='any_change') triggered=true;
    else if(trigger==='turns_on') triggered=(newState==='on'||newState==='true'||newState==='home');
    else if(trigger==='turns_off') triggered=(newState==='off'||newState==='false'||newState==='not_home');
    else if(trigger==='unavailable') triggered=(newState==='unavailable'||newState==='unknown'||newState==='none');
    else if(trigger==='changed_to'){
      const okFrom=!rule.fromValue||prevState===rule.fromValue;
      const okTo=!rule.toValue||newState===rule.toValue;
      triggered=okFrom&&okTo;
    }
    else if(trigger==='above'){
      const v=parseFloat(newState),prev=parseFloat(prevState),th=parseFloat(rule.threshold||0);
      triggered=(!isNaN(v)&&!isNaN(prev)&&v>th&&prev<=th);
    }
    else if(trigger==='below'){
      const v=parseFloat(newState),prev=parseFloat(prevState),th=parseFloat(rule.threshold||0);
      triggered=(!isNaN(v)&&!isNaN(prev)&&v<th&&prev>=th);
    }
    else if(trigger==='specific_value') triggered=(newState===rule.triggerValue);
    else if(trigger==='counter_increment'){
      const vN=parseFloat(newState),vP=parseFloat(prevState);
      triggered=(!isNaN(vN)&&!isNaN(vP)&&vN>vP);
    }
    if(!triggered) continue;
    if(!_ntfPassesGuards(rule)) continue;   // condizione "solo se" + fascia oraria
    // Aggiorna conteggio giornaliero per counter_increment
    if(trigger==='counter_increment'){
      const today=new Date().toISOString().slice(0,10);
      if(!_ntfDailyCount[rule.id]||_ntfDailyCount[rule.id].date!==today)
        _ntfDailyCount[rule.id]={date:today,count:0};
      _ntfDailyCount[rule.id].count++;
    }
    // Calculate runtime duration for appliances
    let durationMs=0;
    if(trigger==='turns_off'&&_ntfStartTimes[eid]){
      durationMs=Date.now()-_ntfStartTimes[eid];
      delete _ntfStartTimes[eid];
    }
    const ctx=_ntfBuildContext(rule, newState, prevState, durationMs);
    // counter_increment: aggiorna popup/coda esistente invece di accodarne uno nuovo
    if(trigger==='counter_increment'){
      if(_ntfActive&&_ntfActive.rule.id===rule.id){
        _ntfActive.ctx=ctx;
        _ntfRender(rule,ctx,true); // true = aggiornamento in-place
        continue;
      }
      const qi=_ntfQueue.findIndex(it=>it.rule.id===rule.id);
      if(qi!==-1){ _ntfQueue[qi]={rule,ctx}; continue; }
    }
    _ntfQueue.push({rule, ctx});
    // Le notifiche smart restano un sistema a sé (popup a regole): NON finiscono nel centro notifiche,
    // che è riservato alle notifiche informative (aggiornamenti, nuove card, ecc.).
    if(!_ntfActive) _ntfShowNext();
  }
}

/* ── Format duration ── */
function _ntfFmtDuration(ms){
  if(!ms||ms<1000) return '';
  const tot=Math.round(ms/1000);
  const h=Math.floor(tot/3600), m=Math.floor((tot%3600)/60), s=tot%60;
  if(h>0) return `${h}h ${m}min`;
  if(m>0) return `${m}min ${s>0?s+'s':''}`.trim();
  return `${s}s`;
}

/* ── Build context-aware message ── */
function _ntfBuildContext(rule, newState, prevState, durationMs=0){
  const now=new Date();
  const h=now.getHours();
  let timeCtx='';
  if(h>=5&&h<12) timeCtx='🌅 Buongiorno';
  else if(h>=12&&h<15) timeCtx='☀️ Mezzogiorno';
  else if(h>=15&&h<19) timeCtx='🌤️ Pomeriggio';
  else if(h>=19&&h<23) timeCtx='🌙 Sera';
  else timeCtx='🌃 Notte';

  const weatherState=hs['weather.casa']||'';
  const WM={'sunny':'☀️ Soleggiato','clear-night':'🌙 Sereno','cloudy':'☁️ Nuvoloso','partlycloudy':'⛅ Parziale','rainy':'🌧️ Pioggia','pouring':'⛈️ Temporale','lightning-rainy':'🌩️ Temporale','snowy':'❄️ Neve','fog':'🌫️ Nebbia'};
  const weatherCtx=WM[weatherState]||'';

  const personEntities=Object.keys(hs).filter(k=>k.startsWith('person.'));
  const home=personEntities.filter(k=>hs[k]==='home').map(k=>(ha[k]?.friendly_name||k.replace('person.','')));
  const presenceCtx=home.length>0?'🏠 '+home.join(', ')+' in casa':'';

  const friendly=ha[rule.entity]?.friendly_name||rule.entity||'';
  // Durata da sensore HA (ha priorità sul calcolo automatico)
  let durationStr=_ntfFmtDuration(durationMs);
  // Sensore aggiuntivo: legge il valore attuale da HA
  let extraSensorVal='';
  if(rule.durationEntity&&hs[rule.durationEntity]!==undefined){
    const sv=String(hs[rule.durationEntity]);
    const unit=ha[rule.durationEntity]?.unit_of_measurement||'';
    extraSensorVal=sv+(unit?' '+unit:'');
    // {duration} usa il sensore aggiuntivo se disponibile, altrimenti il calcolo automatico
    if(extraSensorVal) durationStr=extraSensorVal;
  }

  // Conteggio giornaliero incrementi (per trigger counter_increment)
  const today=new Date().toISOString().slice(0,10);
  const dailyRec=_ntfDailyCount[rule.id];
  const dailyCount=(dailyRec&&dailyRec.date===today)?dailyRec.count:1;

  let title=rule.title||rule.name||'Notifica';
  let msg=rule.message||'Valore: {state}';
  const replacements={'{state}':newState,'{prev}':prevState||'','{entity}':friendly,'{time}':timeCtx,'{weather}':weatherCtx,'{presence}':presenceCtx,'{duration}':durationStr||'—','{sensor}':extraSensorVal||'—','{count}':String(dailyCount)};
  for(const [k,v] of Object.entries(replacements)){
    msg=msg.replaceAll(k,v); title=title.replaceAll(k,v);
  }

  // Smart auto-messages for appliances (usa {duration} nel messaggio per la durata)
  if(rule.autoMsg&&rule.trigger==='turns_off'){
    const low=(friendly||rule.entity||'').toLowerCase();
    if(low.includes('lavatrice')) msg='🧺 Il bucato è pronto! Ricordati di stendere'+(durationStr?' — {duration}':'')+'.';
    else if(low.includes('lavastoviglie')) msg='🍽️ I piatti sono pronti. Svuota la lavastoviglie'+(durationStr?' — {duration}':'')+'.';
    else if(low.includes('asciugatrice')) msg='👕 Asciugatrice terminata. Ritira i vestiti'+(durationStr?' — {duration}':'')+'.';
    else if(low.includes('forno')) msg='🍕 Il forno si è spento'+(durationStr?' — {duration}':'')+'.';
    else if(low.includes('friggitrice')) msg='🍟 Frittura completata'+(durationStr?' — {duration}':'')+'.';
  }

  return {title, msg, timeCtx, weatherCtx, presenceCtx, newState, prevState, friendly, durationStr};
}

/* ── Show next in queue ── */
function _ntfShowNext(){
  if(!_ntfQueue.length){ _ntfActive=null; return; }
  const item=_ntfQueue.shift();
  _ntfActive=item;
  _ntfRender(item.rule, item.ctx);
}

/* ── Render popup (centered, square, animated image) ── */
function _ntfRender(rule, ctx, update=false){
  const wrap=document.getElementById('ntf-wrap');
  if(!wrap) return;
  wrap.classList.add('ntf-active');
  const color=rule.color||'#818cf8';
  const icon=rule.icon||'🔔';
  const anim=(rule.anim&&rule.anim!=='none')?rule.anim:'bounce';
  const showQueue=_ntfQueue.length>0;

  // Animation zone
  const animZoneHtml=`<div class="ntf-anim-zone" style="--nc:${color}">
    <div class="ntf-anim-bg"></div>
    <div class="ntf-rings">
      <div class="ntf-ring"></div><div class="ntf-ring"></div><div class="ntf-ring"></div>
    </div>
    <div class="ntf-icon-big anim-${anim}">${_ntfIconHtml(icon,72)}</div>
  </div>`;

  // Camera
  const camHtml=rule.camEntity
    ?`<img class="ntf-cam" src="${BASE}/api/camera_proxy/${rule.camEntity}?_=${Date.now()}" onerror="this.style.display='none'" alt="">`
    :'';

  // Context badges
  const badges=[ctx.timeCtx,ctx.weatherCtx,ctx.presenceCtx].filter(Boolean)
    .map(b=>`<span class="ntf-context-badge">${b}</span>`).join('');
  const ctxRow=badges?`<div class="ntf-ctx-row">${badges}</div>`:'';

  const durHtml='';

  // Dismiss label — custom or smart default
  let dismissLabel=rule.dismissLabel||'';
  if(!dismissLabel){
    const low=(ctx.friendly||rule.entity||'').toLowerCase();
    if(low.includes('posta')||low.includes('mail')||low.includes('postale')) dismissLabel='✉️ Ho ritirato la posta!';
    else if(low.includes('lavatrice')) dismissLabel='🧺 Vado a stendere!';
    else if(low.includes('lavastoviglie')) dismissLabel='🍽️ Svuoto subito!';
    else if(low.includes('asciugatrice')) dismissLabel='👕 Ritiro i vestiti!';
    else if(low.includes('forno')||low.includes('pizza')) dismissLabel='🍕 Arrivo!';
    else if(low.includes('campanello')||low.includes('doorbell')) dismissLabel='🚪 Arrivo!';
    else if(low.includes('temperatura')||low.includes('temp')) dismissLabel='🌡️ Ho visto!';
    else dismissLabel='✓ Ho capito!';
  }

  // Extra action buttons + snooze
  let extraBtns='';
  for(const act of (rule.actions||[])){
    extraBtns+=`<button class="ntf-act-btn ntf-act-row ${act.primary?'ntf-act-primary':''}" data-action="_ntfDoAction" data-action-args='["${act.domain||''}","${act.service||''}","${act.entity||''}"]'>${act.label||'Azione'}</button>`;
  }
  const rowBtns=extraBtns?`<div class="ntf-act-row">${extraBtns}</div>`:'';

  wrap.innerHTML=`<div class="ntf-popup${update?' ntf-update':''}" id="ntf-pop" style="--nc:${color}">
    <button class="ntf-close" data-action="_ntfDismiss" title="Chiudi">✕</button>
    ${showQueue?`<div class="ntf-queue-badge">+${_ntfQueue.length} in coda</div>`:''}
    ${animZoneHtml}
    <div class="ntf-body">
      <div class="ntf-rule-name">${rule.name||'Notifica'}</div>
      <div class="ntf-title">${ctx.title}</div>
      <div class="ntf-msg">${ctx.msg.replace(/\n/g,'<br>')}</div>
      ${durHtml}
      ${camHtml}
      ${ctxRow}
    </div>
    <div class="ntf-footer">
      ${rowBtns}
      <button class="ntf-act-btn ntf-act-primary" data-action="_ntfDismiss">${dismissLabel}</button>
    </div>
  </div>`;

  if(rule.confetti) _ntfConfetti(wrap);

  // Alexa TTS
  if(rule.alexaEntity&&rule.alexaTts){
    const svc=rule.alexaEntity.includes('.')?rule.alexaEntity.split('.').slice(1).join('.'):rule.alexaEntity;
    const dom=rule.alexaEntity.includes('.')?rule.alexaEntity.split('.')[0]:'notify';
    const ttsMsg=rule.alexaTts.replace('{state}',ctx.newState).replace('{entity}',ctx.friendly).replace('{duration}',ctx.durationStr||'');
    send({type:'call_service',domain:dom,service:svc,service_data:{message:ttsMsg}});
  }

  // Push su app HA del cellulare (notify.mobile_app_*)
  if(rule.mobileService && !update){
    const svc=rule.mobileService.includes('.')?rule.mobileService.split('.').slice(1).join('.'):rule.mobileService;
    const dom=rule.mobileService.includes('.')?rule.mobileService.split('.')[0]:'notify';
    send({type:'call_service',domain:dom,service:svc,service_data:{title:(ctx.title||rule.name||'Notifica'), message:(ctx.msg||' ')}});
  }

  // Auto-chiusura quando nessuno è in casa (solo counter_increment) — soft dismiss, nessun reset
  clearTimeout(_ntfAutoCloseTimer); _ntfAutoCloseTimer=null;
  if(rule.trigger==='counter_increment'){
    const anyoneHome=Object.keys(hs).some(k=>k.startsWith('person.')&&hs[k]==='home');
    if(!anyoneHome){
      _ntfAutoCloseTimer=setTimeout(()=>{ if(_ntfActive) _ntfDismiss(true); },8000);
    }
  }
}

/* ── Confetti burst ── */
function _ntfConfetti(container){
  const colors=['#818cf8','#4ade80','#fbbf24','#f472b6','#22d3ee','#fb923c'];
  for(let i=0;i<28;i++){
    const p=document.createElement('div');
    p.className='ntf-conf-particle';
    p.style.cssText=`left:${10+Math.random()*80}%;top:10px;background:${colors[i%colors.length]};animation-delay:${Math.random()*0.5}s;animation-duration:${1+Math.random()*0.7}s;border-radius:${Math.random()>0.5?'50%':'3px'};width:${5+Math.random()*7}px;height:${5+Math.random()*7}px;position:absolute`;
    container.appendChild(p);
    setTimeout(()=>{ try{container.removeChild(p);}catch(e){} }, 1800);
  }
}

/* ── Dismiss — soft=true chiude senza eseguire l'azione (es. auto-chiusura quando fuori casa) ── */
function _ntfDismiss(soft=false){
  clearTimeout(_ntfAutoCloseTimer); _ntfAutoCloseTimer=null;
  const rule=_ntfActive?.rule;
  const pop=document.getElementById('ntf-pop');
  if(pop) pop.classList.add('ntf-out');

  if(rule&&!soft){
    // Execute dismiss action (e.g. counter.reset)
    if(rule.dismissDomain&&rule.dismissService){
      send({type:'call_service',domain:rule.dismissDomain,service:rule.dismissService,
        service_data:rule.dismissEntity?{entity_id:rule.dismissEntity}:{}});
    }
  }

  setTimeout(()=>{
    const wrap=document.getElementById('ntf-wrap');
    if(wrap){ wrap.innerHTML=''; wrap.classList.remove('ntf-active'); }
    _ntfActive=null;
    _ntfShowNext();
  }, pop?320:0);
}

/* ── Action button handler ── */
function _ntfDoAction(domain, service, entityId){
  if(domain&&service) send({type:'call_service',domain,service,service_data:entityId?{entity_id:entityId}:{}});
  _ntfDismiss();
}

/* ═══ MODAL OPEN/CLOSE ═══ */
function openNotifCfg(){
  document.getElementById('ntf-cfg-modal').classList.add('open');
  renderNotifRules();
  _ntfUpdateSidebarBadges();
}
function closeNotifCfg(){
  document.getElementById('ntf-cfg-modal').classList.remove('open');
}

/* ═══ CENTRO NOTIFICHE → notifications.js ═══ */
function openSOSCfg(){
  document.getElementById('sos-cfg-modal').classList.add('open');
  renderSOSCfgList();
}
function closeSOSCfg(){
  // rimuovi i contatti rimasti completamente vuoti (es. riga aggiunta e mai compilata):
  // non devono contare nel badge né restare salvati.
  try{
    const sc=_sosCfg();
    const before=sc.contacts.length;
    sc.contacts=sc.contacts.filter(c=>c&&((c.name||'').trim()||(c.notifyService||'').trim()||(c.phone||'').trim()));
    if(sc.contacts.length!==before){ saveCfg(); _ntfUpdateSidebarBadges(); }
  }catch(e){}
  document.getElementById('sos-cfg-modal').classList.remove('open');
}
function _ntfUpdateSidebarBadges(){
  const rules=_ntfCfg();
  const el=document.getElementById('ntf-ep-count');
  if(el){ const on=rules.filter(r=>r.enabled).length; el.textContent=rules.length?`${on}/${rules.length} attive`:''; }
  const sos=document.getElementById('sos-ep-count');
  if(sos){ const n=(_sosCfg().contacts||[]).filter(c=>c&&((c.name||'').trim()||(c.notifyService||'').trim()||(c.phone||'').trim())).length; sos.textContent=n?`${n} contatt${n===1?'o':'i'}`:''; }
}

/* ═══ UNIVERSAL ENTITY PICKER ═══ */
let _epPickerCb=null, _epPickerDomains=[];  // array — empty = all
const _epDomIco={
  sensor:'📊',binary_sensor:'🔘',switch:'🔌',light:'💡',cover:'🪟',
  climate:'🌡️',media_player:'🔊',camera:'📷',person:'👤',
  input_boolean:'✅',input_number:'🔢',input_text:'✏️',input_select:'📋',
  timer:'⏱️',counter:'🔢',weather:'⛅',notify:'📲',automation:'⚙️',
  script:'📜',scene:'🎬',device_tracker:'📍',group:'👥',number:'🔢',
  select:'📋',button:'🔲',text:'✏️',lock:'🔒',alarm_control_panel:'🚨',
  fan:'💨',vacuum:'🤖',water_heater:'🚿',remote:'📡',sun:'🌞',
  zone:'📍',calendar:'📅',todo:'✔️'
};

function _epPickerOpen(cb, domainFilter='', title='Seleziona entità'){
  _epPickerCb=cb;
  // domainFilter can be a string ('camera') or array (['counter','input_number'])
  _epPickerDomains=Array.isArray(domainFilter)?domainFilter:(domainFilter?[domainFilter]:[]);
  const titleEl=document.getElementById('ep-picker-title');
  if(titleEl) titleEl.textContent=title;
  const badge=document.getElementById('ep-picker-domain-badge');
  if(badge){
    if(_epPickerDomains.length){badge.textContent=_epPickerDomains.join(', ')+'.*';badge.style.display='';}
    else badge.style.display='none';
  }
  const qEl=document.getElementById('ep-picker-q');
  if(qEl) qEl.value='';
  _epPickerSearch('');
  document.getElementById('ep-picker').classList.add('open');
  setTimeout(()=>{ const q=document.getElementById('ep-picker-q'); if(q) q.focus(); },80);
}

function _epPickerClose(){
  document.getElementById('ep-picker').classList.remove('open');
  _epPickerCb=null;
}

function _epPickerSearch(q){
  const list=document.getElementById('ep-picker-list');
  if(!list) return;
  const query=(q||'').toLowerCase().trim();
  let entities=Object.keys(hs);
  if(_epPickerDomains.length) entities=entities.filter(e=>_epPickerDomains.some(d=>e.startsWith(d+'.')));
  if(query) entities=entities.filter(e=>{
    const name=(ha[e]?.friendly_name||'').toLowerCase();
    return e.includes(query)||name.includes(query);
  });
  entities.sort((a,b)=>{
    const na=ha[a]?.friendly_name||a, nb=ha[b]?.friendly_name||b;
    return na.localeCompare(nb,'it');
  });
  if(!entities.length){
    list.innerHTML=`<div style="text-align:center;padding:40px 0;color:var(--muted)"><div style="font-size:32px;margin-bottom:8px">🔍</div>Nessuna entità trovata${query?' per "'+query+'"':''}</div>`;
    return;
  }
  // Group by domain
  const groups={};
  for(const eid of entities){
    const dom=eid.split('.')[0];
    if(!groups[dom]) groups[dom]=[];
    groups[dom].push(eid);
  }
  let html=`<div class="ep-picker-count">${entities.length} entit${entities.length===1?'à':'à'} trovate</div>`;
  for(const [dom, eids] of Object.entries(groups).sort(([a],[b])=>a.localeCompare(b))){
    const ico=_epDomIco[dom]||'🔹';
    if(!query) html+=`<div class="ep-picker-group-lbl">${ico} ${dom} (${eids.length})</div>`;
    for(const eid of eids){
      const name=ha[eid]?.friendly_name||eid.split('.').slice(1).join('.').replace(/_/g,' ');
      const state=hs[eid]??'';
      html+=`<div class="ep-picker-item" tabindex="0" data-action="_epPickerSelect" data-action-arg="${eid}">
        <div class="ep-picker-ico">${ico}</div>
        <div class="ep-picker-info">
          <div class="ep-picker-name">${name}</div>
          <div class="ep-picker-eid">${eid}</div>
        </div>
        <div class="ep-picker-state">${state}</div>
      </div>`;
    }
  }
  list.innerHTML=html;
}

function _epPickerSelect(eid){
  if(_epPickerCb) _epPickerCb(eid);
  _epPickerClose();
}

/* ═══ AUTOCOMPLETAMENTO ENTITÀ INLINE (su tutti i campi entità delle config) ═══
   Scrivi nel campo → sotto compare la lista filtrata di tutte le entità; clicchi e si compila.
   Si attiva sui campi col bottone 🔍 (browseField) o con classe "entac". */
let _entacBox=null, _entacInput=null;
function _entacEnsure(){
  if(_entacBox) return _entacBox;
  _entacBox=document.createElement('div');
  _entacBox.id='entac-box';
  _entacBox.style.cssText='position:fixed;z-index:30000;display:none;max-height:240px;overflow-y:auto;background:#1a1f35;border:1px solid rgba(255,255,255,.15);border-radius:10px;box-shadow:0 14px 44px rgba(0,0,0,.75);min-width:220px;padding:4px;scrollbar-width:thin';
  document.body.appendChild(_entacBox);
  return _entacBox;
}
function _isEntInput(el){
  if(!el||el.tagName!=='INPUT'||el.type==='checkbox'||el.type==='color'||el.type==='number') return false;
  if(el.classList.contains('entac')) return true;
  const row=el.closest('.finp-row');
  return !!(row && row.querySelector('button[onclick*="browseField"]'));
}
function _entacRender(){
  const input=_entacInput; if(!input) return;
  const box=_entacEnsure();
  const q=(input.value||'').toLowerCase().trim();
  let ents=Object.keys(hs||{});
  if(q) ents=ents.filter(e=>e.toLowerCase().includes(q)||(((ha[e]||{}).friendly_name||'').toLowerCase().includes(q)));
  ents.sort((a,b)=>(((ha[a]||{}).friendly_name)||a).localeCompare(((ha[b]||{}).friendly_name)||b,'it'));
  const tot=ents.length; ents=ents.slice(0,50);
  if(!ents.length){ box.style.display='none'; return; }
  box.innerHTML=ents.map(e=>{
    const nm=(ha[e]||{}).friendly_name||e;
    const dom=e.split('.')[0]; const ico=(_epDomIco&&_epDomIco[dom])||'🔹';
    return `<div class="entac-it" onmousedown="event.preventDefault();_entacPick('${e}')"><span style="flex-shrink:0">${ico}</span><span style="flex:1;min-width:0"><span class="entac-nm">${eh(nm)}</span><span class="entac-eid">${e}</span></span></div>`;
  }).join('') + (tot>50?`<div style="padding:6px 9px;font-size:10px;color:var(--muted);text-align:center">…e altre ${tot-50}. Scrivi per filtrare.</div>`:'');
  const r=input.getBoundingClientRect();
  box.style.left=r.left+'px'; box.style.width=Math.max(r.width,220)+'px';
  // se non c'è spazio sotto, aprila sopra
  const below=window.innerHeight-r.bottom;
  if(below<180 && r.top>below){ box.style.top=''; box.style.bottom=(window.innerHeight-r.top+4)+'px'; }
  else { box.style.bottom=''; box.style.top=(r.bottom+4)+'px'; }
  box.style.display='block';
}
function _entacPick(e){
  if(_entacInput){ _entacInput.value=e; _entacInput.dispatchEvent(new Event('input',{bubbles:true})); _entacInput.dispatchEvent(new Event('change',{bubbles:true})); }
  _entacHide();
}
function _entacHide(){ if(_entacBox) _entacBox.style.display='none'; _entacInput=null; }
document.addEventListener('focusin',e=>{ if(_isEntInput(e.target)){ _entacInput=e.target; _entacRender(); } });
document.addEventListener('input',e=>{ if(e.target===_entacInput) _entacRender(); });
document.addEventListener('click',e=>{ if(_entacInput && e.target!==_entacInput && !(_entacBox&&_entacBox.contains(e.target))) _entacHide(); });
document.addEventListener('scroll',e=>{ if(_entacInput && !(_entacBox&&_entacBox.contains(e.target))) _entacHide(); }, true);

/* Close picker on Escape */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&document.getElementById('ep-picker')?.classList.contains('open')) _epPickerClose();
});

/* ═══ ENTITY AUTOCOMPLETE ═══ */
function _ntfEntitySuggest(idx, inputEl, dropId){
  const q=(inputEl.value||'').toLowerCase().trim();
  const drop=document.getElementById(dropId);
  if(!drop) return;
  const matches=Object.keys(hs).filter(eid=>{
    if(!q) return true;
    const name=(ha[eid]?.friendly_name||'').toLowerCase();
    return eid.includes(q)||name.includes(q);
  }).slice(0,40);
  if(!matches.length||(!q&&Object.keys(hs).length===0)){drop.classList.remove('show');return;}
  drop.innerHTML=matches.map(eid=>{
    const name=ha[eid]?.friendly_name||'';
    const state=hs[eid]||'';
    return `<div class="ntf-ent-opt" onmousedown="_ntfPickEntity(${idx},'${eid}','${dropId}')">
      <div class="ntf-ent-name">${name||eid} <span style="color:rgba(255,255,255,.3);font-size:9px">${state}</span></div>
      <div class="ntf-ent-id">${eid}</div>
    </div>`;
  }).join('');
  drop.classList.add('show');
}
function _ntfPickEntity(idx, eid, dropId){
  const rules=_ntfCfg();
  if(!rules[idx]) return;
  rules[idx].entity=eid;
  saveCfg();
  const drop=document.getElementById(dropId);
  if(drop) drop.classList.remove('show');
  // update the input value
  const inp=document.getElementById('ntf-ent-inp-'+idx);
  if(inp) inp.value=eid;
}

/* ═══ ACTION TYPE PRESETS ═══ */
const _ntfActPresets=[
  {id:'none',     icon:'🚫', label:'Nessuna',        desc:'',                   domains:[],                                           domainSvc:(e)=>({domain:'',service:''})},
  {id:'reset',    icon:'🔄', label:'Reset',           desc:'Azzera contatore, timer o numero',  domains:['counter','input_number','timer'],
    domainSvc:(e)=>{ const d=(e||'').split('.')[0]; return {domain:d||'counter',service:d==='timer'?'cancel':'reset'}; }},
  {id:'toggle',   icon:'🔀', label:'Toggle',          desc:'Alterna ON/OFF',     domains:['light','switch','input_boolean','cover','fan','climate','lock'],
    domainSvc:()=>({domain:'homeassistant',service:'toggle'})},
  {id:'turn_on',  icon:'💡', label:'Accendi',         desc:'Accende / attiva',   domains:['light','switch','input_boolean','cover','fan','climate'],
    domainSvc:()=>({domain:'homeassistant',service:'turn_on'})},
  {id:'turn_off', icon:'🌑', label:'Spegni',          desc:'Spegne / disattiva', domains:['light','switch','input_boolean','cover','fan','climate'],
    domainSvc:()=>({domain:'homeassistant',service:'turn_off'})},
  {id:'script',   icon:'📜', label:'Script',          desc:'Esegui uno script',  domains:['script'],
    domainSvc:()=>({domain:'script',service:'turn_on'})},
  {id:'scene',    icon:'🎬', label:'Scena',           desc:'Attiva una scena',   domains:['scene'],
    domainSvc:()=>({domain:'scene',service:'turn_on'})},
  {id:'automation',icon:'⚙️',label:'Automazione',    desc:'Avvia automazione',  domains:['automation'],
    domainSvc:()=>({domain:'automation',service:'trigger'})},
  {id:'input_select',icon:'📋',label:'Opzione',       desc:'Cambia input_select',domains:['input_select'],
    domainSvc:()=>({domain:'input_select',service:'select_option'})},
  {id:'notify',   icon:'📲', label:'Notifica',        desc:'Manda una notifica', domains:['notify'],
    domainSvc:(e)=>{ const parts=(e||'').split('.'); return {domain:'notify',service:parts.slice(1).join('_')||''}; }},
  {id:'custom',   icon:'✏️', label:'Custom',          desc:'Dominio/Servizio libero', domains:[],
    domainSvc:()=>({domain:'',service:''})}
];

function _ntfSetActionType(idx, presetId){
  const rules=_ntfCfg(); if(!rules[idx]) return;
  rules[idx].dismissActionType=presetId;
  // If there's already an entity, auto-fill domain/service
  const preset=_ntfActPresets.find(p=>p.id===presetId);
  if(preset&&presetId!=='custom'&&presetId!=='none'){
    const eid=rules[idx].dismissEntity||'';
    const ds=preset.domainSvc(eid);
    rules[idx].dismissDomain=ds.domain;
    rules[idx].dismissService=ds.service;
  }
  if(presetId==='none'){ rules[idx].dismissDomain=''; rules[idx].dismissService=''; rules[idx].dismissEntity=''; }
  saveCfg(); renderNotifRules();
}

function _ntfSetActionEntity(idx, eid){
  const rules=_ntfCfg(); if(!rules[idx]) return;
  rules[idx].dismissEntity=eid;
  const preset=_ntfActPresets.find(p=>p.id===(rules[idx].dismissActionType||'none'));
  if(preset&&preset.id!=='custom'&&preset.id!=='none'){
    const ds=preset.domainSvc(eid);
    rules[idx].dismissDomain=ds.domain;
    rules[idx].dismissService=ds.service;
  }
  saveCfg();
}

/* Apre il picker filtrato per tipo di azione */
function _ntfOpenActionPicker(idx, inputId){
  const rules=_ntfCfg(); if(!rules[idx]) return;
  const preset=_ntfActPresets.find(p=>p.id===(rules[idx].dismissActionType||'none'));
  if(!preset||preset.id==='none') return;
  const domains=preset.domains||[];
  const titleMap={reset:'Seleziona contatore / timer / numero',toggle:'Seleziona dispositivo da alternare',
    turn_on:'Seleziona dispositivo da accendere',turn_off:'Seleziona dispositivo da spegnere',
    script:'Seleziona script',scene:'Seleziona scena',automation:'Seleziona automazione',
    notify:'Seleziona servizio di notifica',input_select:'Seleziona input_select',custom:'Seleziona entità'};
  const title=titleMap[preset.id]||'Seleziona entità';
  _epPickerOpen(v=>{
    _ntfSetActionEntity(idx,v);
    const el=document.getElementById(inputId);
    if(el) el.value=v;
  }, domains, title);
}

/* ═══ RENDER NOTIFICATION RULES (modal UI) ═══ */
function renderNotifRules(){
  const list=document.getElementById('ntf-rules-list');
  if(!list) return;
  const rules=_ntfCfg();
  _ntfUpdateSidebarBadges();
  if(!rules.length){
    list.innerHTML=`<div style="text-align:center;padding:30px 0;color:var(--muted)">
      <div style="font-size:36px;margin-bottom:8px">🔔</div>
      <div style="font-size:13px;font-weight:600">Nessuna regola ancora</div>
      <div style="font-size:11px;margin-top:4px">Clicca ➕ qui sotto per creare la prima notifica automatica</div>
    </div>`;
    return;
  }
  list.innerHTML=rules.map((r,i)=>{
    const trigLabels={any_change:'Qualsiasi cambiamento',turns_on:'Diventa ON / home',turns_off:'Diventa OFF / away',on_for:'Acceso da più di X min ⏱',above:'Supera soglia ▲',below:'Scende sotto soglia ▼',specific_value:'Valore specifico',changed_to:'Cambia da → a',unavailable:'Diventa non disponibile',counter_increment:'Incremento counter ▲ (ignora cooldown)'};
    const animOpts=['bounce','pulse','wiggle','shake','spin','glow','none'].map(a=>`<option value="${a}"${r.anim===a?' selected':''}>${a}</option>`).join('');
    const trigOpts=Object.entries(trigLabels).map(([v,l])=>`<option value="${v}"${r.trigger===v?' selected':''}>${l}</option>`).join('');
    const friendly=ha[r.entity]?.friendly_name||r.entity||'(nessuna entità)';
    const stateNow=r.entity?` · ${hs[r.entity]??'?'}`:'';
    const dropId=`ntf-drop-${i}`;
    return `<div class="ntf-rule-card${r._expanded?' expanded':''}" id="ntf-card-${i}">
      <div class="ntf-rule-card-hdr" data-action="_ntfToggleCard" data-action-args='[${i}]'>
        <div style="font-size:22px;line-height:1;width:28px;text-align:center">${_ntfIconHtml(r.icon||'🔔',22)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.name||'Regola '+(i+1)}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:1px">${friendly}${stateNow}</div>
        </div>
        <button class="ntf-rule-toggle${r.enabled?' on':''}" data-action="_ntfToggle" data-action-args='[${i}]'></button>
        <button data-action="_ntfDelRule" data-action-args='[${i}]' style="background:none;border:none;color:rgba(248,113,113,.4);cursor:pointer;font-size:16px;padding:2px 6px">🗑</button>
        <div style="color:var(--muted);font-size:14px;transition:transform .2s;${r._expanded?'transform:rotate(180deg)':''}">▾</div>
      </div>
      <div class="ntf-rule-card-body">

        <div class="ntf-section-sep">📍 Entità & Trigger</div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Entità</div>
          <div class="ntf-ent-wrap" style="flex:1">
            <input id="ntf-ent-inp-${i}" class="ntf-field-inp" value="${r.entity||''}" placeholder="Cerca o usa 🔍 per sfogliare…"
              data-input="_ntfSetAndSuggest" data-input-args='[${i},"${dropId}"]'
              onfocus="_ntfEntitySuggest(${i},this,'${dropId}')" onblur="setTimeout(()=>{ const d=document.getElementById('${dropId}'); if(d) d.classList.remove('show'); },200)">
            <div class="ntf-ent-drop" id="${dropId}"></div>
          </div>
          <button class="ntf-pick-btn" title="Sfoglia tutte le entità"
            data-action="_ntfPickEntityFor" data-action-args='[${i}]'>🔍</button>
        </div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Condizione</div>
          <select class="ntf-field-inp" data-input="_ntfSet" data-input-args='[${i},"trigger"]'>${trigOpts}</select>
        </div>
        ${(r.trigger==='above'||r.trigger==='below')?`<div class="ntf-field-row">
          <div class="ntf-field-lbl">Soglia</div>
          <input class="ntf-field-inp" type="number" value="${r.threshold||0}" data-input="_ntfSet" data-input-args='[${i},"threshold"]'>
        </div>`:''}
        ${r.trigger==='specific_value'?`<div class="ntf-field-row">
          <div class="ntf-field-lbl">Valore</div>
          <input class="ntf-field-inp" value="${r.triggerValue||''}" placeholder="es. unavailable" data-input="_ntfSet" data-input-args='[${i},"triggerValue"]'>
        </div>`:''}
        ${r.trigger==='changed_to'?`<div class="ntf-field-row">
          <div class="ntf-field-lbl">Da → A</div>
          <input class="ntf-field-inp" value="${r.fromValue||''}" placeholder="da (vuoto=qualsiasi)" data-input="_ntfSet" data-input-args='[${i},"fromValue"]' style="flex:1">
          <input class="ntf-field-inp" value="${r.toValue||''}" placeholder="a (es. playing)" data-input="_ntfSet" data-input-args='[${i},"toValue"]' style="flex:1">
        </div>`:''}
        ${r.trigger==='on_for'?`<div class="ntf-field-row">
          <div class="ntf-field-lbl">Minuti</div>
          <input class="ntf-field-inp" type="number" min="0" step="1" value="${r.onForMin||5}" data-input="_ntfSet" data-input-args='[${i},"onForMin"]'>
        </div>`:''}

        <div class="ntf-section-sep">🔒 Solo se (condizione)</div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Entità</div>
          <input id="ntf-cond-inp-${i}" class="ntf-field-inp" value="${r.condEntity||''}" placeholder="opzionale — es. person.tu" data-input="_ntfSet" data-input-args='[${i},"condEntity"]'>
          <button class="ntf-pick-btn" title="Sfoglia entità" data-action="_ntfPickCond" data-action-args='[${i}]'>🔍</button>
        </div>
        ${r.condEntity?`<div class="ntf-field-row">
          <div class="ntf-field-lbl">Stato</div>
          <select class="ntf-field-inp" style="width:80px;flex:none" data-input="_ntfSet" data-input-args='[${i},"condOp"]'>
            <option value="is"${(r.condOp||'is')==='is'?' selected':''}>è</option>
            <option value="is_not"${r.condOp==='is_not'?' selected':''}>non è</option>
          </select>
          <input class="ntf-field-inp" value="${r.condValue||''}" placeholder="es. home" data-input="_ntfSet" data-input-args='[${i},"condValue"]'>
        </div>`:''}

        <div class="ntf-section-sep">🕒 Fascia oraria (opzionale)</div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Dalle / Alle</div>
          <input class="ntf-field-inp" type="time" value="${r.timeFrom||''}" data-input="_ntfSet" data-input-args='[${i},"timeFrom"]'>
          <input class="ntf-field-inp" type="time" value="${r.timeTo||''}" data-input="_ntfSet" data-input-args='[${i},"timeTo"]'>
        </div>
        <div style="font-size:10px;color:rgba(255,255,255,.25);margin:-2px 0 6px 88px">Vuoto = sempre. Altrimenti notifica solo in questa fascia.</div>

        <div class="ntf-section-sep">💬 Contenuto popup</div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Nome regola</div>
          <input class="ntf-field-inp" value="${r.name||''}" placeholder="Es. Lavatrice finita" data-input="_ntfSet" data-input-args='[${i},"name"]'>
        </div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Titolo popup</div>
          <input class="ntf-field-inp" value="${r.title||''}" placeholder="{entity} — usa {entity},{state}" data-input="_ntfSet" data-input-args='[${i},"title"]'>
        </div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Messaggio</div>
          <input class="ntf-field-inp" value="${r.message||''}" placeholder="Usa {state},{entity},{time},{sensor},{duration},{count}" data-input="_ntfSet" data-input-args='[${i},"message"]'>
        </div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Icona</div>
          <div style="display:flex;align-items:center;gap:6px;flex:none">
            <div id="ntf-ico-prev-${i}" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);border-radius:8px;font-size:18px">${_ntfIconHtml(r.icon||'🔔',20)}</div>
            <input class="ntf-field-inp" id="ntf-ico-inp-${i}" value="${r.icon||''}" placeholder="🔔 o mdi:bell"
              data-input="_ntfSetIcon" data-input-args='[${i}]'
              style="width:110px">
            <button class="ntf-pick-btn" title="Scegli emoji o icona MDI"
              data-action="_ntfPickIcon" data-action-args='[${i}]' data-action-el="true">🎨</button>
          </div>
          <div style="width:12px"></div>
          <div class="ntf-field-lbl" style="width:auto">Colore</div>
          <input type="color" value="${r.color||'#818cf8'}" data-input="_ntfSet" data-input-args='[${i},"color"]' style="width:40px;height:32px;border:none;background:none;cursor:pointer;padding:0;flex:none">
          <div style="width:12px"></div>
          <div class="ntf-field-lbl" style="width:auto">Anim.</div>
          <select class="ntf-field-inp" style="width:90px;flex:none" data-input="_ntfSet" data-input-args='[${i},"anim"]'>${animOpts}</select>
        </div>

        <div class="ntf-section-sep">⚡ Azione al click "Ho capito"</div>
        <div class="ntf-act-grid">
          ${_ntfActPresets.map(p=>`
            <div class="ntf-act-type${(r.dismissActionType||'none')===p.id?' sel':''}" data-action="_ntfSetActionType" data-action-args='[${i},"${p.id}"]' title="${p.desc}">
              <div class="ntf-act-type-ico">${p.icon}</div>
              <div class="ntf-act-type-lbl">${p.label}</div>
            </div>`).join('')}
        </div>
        ${(()=>{
          const preset=_ntfActPresets.find(p=>p.id===(r.dismissActionType||'none'));
          if(!preset||preset.id==='none') return '<div style="font-size:10px;color:rgba(255,255,255,.22);margin-bottom:12px;padding:0 2px">Nessuna azione — il popup si chiude senza fare nulla.</div>';
          const isCustom=preset.id==='custom';
          const domainsFilter=preset.domains;
          const entityLabel=preset.id==='notify'?'Destinatario':'Entità';
          const entityPlaceholder=preset.id==='reset'?'counter.posta':preset.id==='script'?'script.nome':preset.id==='scene'?'scene.nome':preset.id==='notify'?'notify.alexa_sala':'light.soggiorno';
          const pickerTitle=preset.id==='reset'?'Seleziona contatore / timer':preset.id==='toggle'?'Seleziona dispositivo':preset.id==='turn_on'||preset.id==='turn_off'?'Seleziona dispositivo':preset.id==='script'?'Seleziona script':preset.id==='scene'?'Seleziona scena':preset.id==='automation'?'Seleziona automazione':preset.id==='notify'?'Seleziona servizio notify':preset.id==='input_select'?'Seleziona input_select':'Seleziona entità';
          const friendly=r.dismissEntity?ha[r.dismissEntity]?.friendly_name||r.dismissEntity:'';
          return `<div class="ntf-act-entity-row">
            <div style="font-size:10px;font-weight:600;color:rgba(255,255,255,.45);margin-bottom:8px">${preset.icon} ${preset.desc||preset.label}</div>
            <div class="ntf-field-row" style="margin-bottom:0">
              <div class="ntf-field-lbl">${entityLabel}</div>
              <input id="ntf-da-inp-${i}" class="ntf-field-inp" value="${r.dismissEntity||''}" placeholder="${entityPlaceholder}"
                data-input="_ntfSetActionEntity" data-input-args='[${i}]'>
              <button class="ntf-pick-btn" title="Sfoglia entità"
                data-action="_ntfOpenActionPicker" data-action-args='[${i},"ntf-da-inp-${i}"]'>🔍</button>
            </div>
            ${friendly?`<div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:5px;padding-left:88px">${friendly}</div>`:''}
            ${isCustom?`<div class="ntf-field-row" style="margin-top:8px">
              <div class="ntf-field-lbl">Dominio</div>
              <input class="ntf-field-inp" value="${r.dismissDomain||''}" placeholder="es. counter" data-input="_ntfSet" data-input-args='[${i},"dismissDomain"]' style="width:110px;flex:none">
              <div class="ntf-field-lbl" style="width:auto;margin:0 6px">Servizio</div>
              <input class="ntf-field-inp" value="${r.dismissService||''}" placeholder="es. reset" data-input="_ntfSet" data-input-args='[${i},"dismissService"]'>
            </div>`:''}
            ${(!isCustom&&r.dismissDomain)?`<div style="font-size:10px;color:rgba(255,255,255,.22);margin-top:6px;padding-left:88px">→ ${r.dismissDomain}.${r.dismissService}</div>`:''}
          </div>`;
        })()}

        <div class="ntf-section-sep">⚙️ Opzioni</div>
        <div class="ntf-field-row" style="flex-wrap:wrap;gap:14px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);cursor:pointer">
            <input type="checkbox" ${r.autoMsg?'checked':''} data-input="_ntfSet" data-input-args='[${i},"autoMsg"]'> Auto-messaggio elettrodomestici
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);cursor:pointer">
            <input type="checkbox" ${r.confetti?'checked':''} data-input="_ntfSet" data-input-args='[${i},"confetti"]'> 🎉 Coriandoli
          </label>
        </div>

        <div class="ntf-section-sep">📡 Sensore aggiuntivo nel messaggio (opzionale)</div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Sensore extra</div>
          <input id="ntf-dur-inp-${i}" class="ntf-field-inp" value="${r.durationEntity||''}" placeholder="es. sensor.lavatrice_durata_ciclo"
            data-input="_ntfSet" data-input-args='[${i},"durationEntity"]'>
          <button class="ntf-pick-btn" title="Sfoglia entità"
            data-action="_ntfPickDuration" data-action-args='[${i}]'>🔍</button>
        </div>
        <div style="font-size:10px;color:rgba(255,255,255,.25);margin:-4px 0 8px 88px">
          Usa <b>{sensor}</b> nel messaggio per mostrare il valore di questo sensore (valore + unità).<br>
          Es: <i>Panni pronti per essere ritirati, Durata ciclo: {sensor}</i>
        </div>

        <div class="ntf-section-sep">🔘 Testo pulsante conferma</div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Tasto "Ok"</div>
          <input class="ntf-field-inp" value="${r.dismissLabel||''}" placeholder="Lascia vuoto = auto (es. ✉️ Ho ritirato la posta!)" data-input="_ntfSet" data-input-args='[${i},"dismissLabel"]'>
        </div>

        <div class="ntf-section-sep">📷 Camera · 🔊 Alexa · 📲 Push (opzionale)</div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">📲 Push cell.</div>
          <input id="ntf-mob-inp-${i}" class="ntf-field-inp" value="${r.mobileService||''}" placeholder="notify.mobile_app_pixel_7" data-input="_ntfSet" data-input-args='[${i},"mobileService"]'>
          <button class="ntf-pick-btn" title="Sfoglia servizi notify (app cellulare)" data-action="_ntfPickMobile" data-action-args='[${i}]'>🔍</button>
        </div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Camera</div>
          <input id="ntf-cam-inp-${i}" class="ntf-field-inp" value="${r.camEntity||''}" placeholder="camera.ingresso" data-input="_ntfSet" data-input-args='[${i},"camEntity"]'>
          <button class="ntf-pick-btn" title="Sfoglia camere"
            data-action="_ntfPickCam" data-action-args='[${i}]'>🔍</button>
        </div>
        <div class="ntf-field-row">
          <div class="ntf-field-lbl">Alexa notify</div>
          <input id="ntf-ax-inp-${i}" class="ntf-field-inp" value="${r.alexaEntity||''}" placeholder="notify.alexa_sala" data-input="_ntfSet" data-input-args='[${i},"alexaEntity"]'>
          <button class="ntf-pick-btn" title="Sfoglia servizi notify"
            data-action="_ntfPickAlexa" data-action-args='[${i}]'>🔍</button>
        </div>
        ${r.alexaEntity?`<div class="ntf-field-row">
          <div class="ntf-field-lbl">Testo TTS</div>
          <input class="ntf-field-inp" value="${r.alexaTts||''}" placeholder="Es. La lavatrice ha finito, durata {duration}" data-input="_ntfSet" data-input-args='[${i},"alexaTts"]'>
        </div>`:''}

      </div>
    </div>`;
  }).join('');
}

function _ntfToggleCard(i){
  const rules=_ntfCfg();
  if(!rules[i]) return;
  rules[i]._expanded=!rules[i]._expanded;
  renderNotifRules();
}

function ntfAddRule(){
  const rules=_ntfCfg();
  rules.push({id:'ntf_'+Date.now(),name:'Nuova regola',entity:'',trigger:'turns_off',
    title:'{entity}',message:'Stato: {state}',icon:'🔔',color:'#818cf8',anim:'bounce',
    enabled:true,autoMsg:false,confetti:false,actions:[],
    camEntity:'',alexaEntity:'',alexaTts:'',
    dismissActionType:'none',dismissDomain:'',dismissService:'',dismissEntity:'',
    dismissLabel:'',durationEntity:'',_expanded:true});
  saveCfg();
  renderNotifRules();
  // scroll to bottom of modal
  setTimeout(()=>{const b=document.querySelector('#ntf-cfg-modal .cfg-modal-body');if(b)b.scrollTop=b.scrollHeight;},50);
}

function _ntfDelRule(idx){
  const rules=_ntfCfg();
  rules.splice(idx,1);
  saveCfg(); renderNotifRules();
}

function _ntfToggle(idx){
  const rules=_ntfCfg();
  rules[idx].enabled=!rules[idx].enabled;
  saveCfg(); renderNotifRules();
}

function _ntfSet(idx, key, val){
  const rules=_ntfCfg();
  if(!rules[idx]) return;
  rules[idx][key]=val;
  saveCfg();
  if(key==='trigger'||key==='alexaEntity'||key==='condEntity') renderNotifRules();
}

/* ── KIOSK MODE ─────────────────────────────────────────────── */
let _kioskOn=false;
function _applyKioskUI(){
  document.body.classList.toggle('kiosk',_kioskOn);
  const btn=document.getElementById('kiosk-btn');
  if(btn) btn.title=_kioskOn?'Esci da Kiosk':'Modalità Kiosk (schermo intero)';
  try{ _applyTopbarStyle(); }catch(e){}   // l'icona kiosk (custom/default, on↔off) la gestisce _applyTopbarStyle
}
/* Modalità kiosk come scelta: l'icona in alto compare solo se cfg.kioskEnabled è attivo. */
function _applyKioskAvail(){
  const on=!!(typeof cfg!=='undefined'&&cfg&&cfg.kioskEnabled);
  const btn=document.getElementById('kiosk-btn');
  if(btn) btn.style.display=on?'':'none';
  if(!on&&_kioskOn){ try{ toggleKiosk(); }catch(e){} }   // se disattivata mentre sei in kiosk → esci
}

/* ── PERSONALIZZAZIONE ICONE BARRA IN ALTO (icona mdi/emoji + colore) ── */
const _TOPBAR_ICONS=[
  {key:'sidebar', id:'hasidebar-btn', def:'mdi:menu',           label:'Barra laterale'},
  {key:'edit',    id:'edit-btn',      def:'mdi:pencil',         label:'Modifica (matita)'},
  {key:'settings',id:'settings-btn',  def:'mdi:cog',            label:'Impostazioni'},
  {key:'bell',    id:'notif-bell',    def:'mdi:bell',           label:'Notifiche'},
  {key:'views',   id:'views-btn',     def:'mdi:view-dashboard', label:'Viste'},
  {key:'kiosk',   id:'kiosk-btn',     def:'mdi:fullscreen',     label:'Kiosk'},
];
function _applyTopbarStyle(){
  const tb=(typeof cfg!=='undefined'&&cfg&&cfg.topbar)||{};
  _TOPBAR_ICONS.forEach(it=>{
    const btn=document.getElementById(it.id); if(!btn) return;
    const o=tb[it.key]||{};
    let icon=o.icon||it.def;
    let color=o.color||'';
    if(it.key==='kiosk' && _kioskOn && !o.icon) icon='mdi:fullscreen-exit';
    // In edit mode: il bottone edit diventa una X rossa
    if(it.key==='edit' && typeof editMode!=='undefined' && editMode){
      icon='mdi:close'; color='#f87171';
    }
    const iconHtml=_renderIcon(icon,16,color||'currentColor');
    if(it.key==='bell'){
      btn.innerHTML=iconHtml+'<span id="notif-bell-badge"></span>';
      try{ _ntfUpdateBell(); }catch(e){}
    } else {
      btn.innerHTML=iconHtml;
    }
    if(color) btn.style.color=color; else btn.style.removeProperty('color');
  });
}
function _renderTopbarIconsList(){
  const el=document.getElementById('topbar-icons-list'); if(!el) return;
  const tb=(typeof cfg!=='undefined'&&cfg&&cfg.topbar)||{};
  el.innerHTML=_TOPBAR_ICONS.map(it=>{
    const o=tb[it.key]||{};
    const icon=o.icon||it.def;
    const colVal=/^#([0-9a-f]{6})$/i.test(o.color||'')?o.color:'#9aa3b2';
    return `<div class="sys-row" style="margin-top:7px;gap:8px">
      <span style="display:flex;align-items:center;gap:9px;flex:1;min-width:0">
        <span style="width:22px;text-align:center;flex-shrink:0">${_renderIcon(icon,18,o.color||'#cbd5e1')}</span>
        <span class="sys-lbl2" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.label}</span>
      </span>
      <button class="fbtn" style="flex-shrink:0" title="Scegli icona (mdi o emoji)" data-action="_topbarPickIcon" data-action-el="true" data-action-args='["${it.key}"]'>🎨</button>
      <input type="color" value="${colVal}" title="Colore" data-input="_topbarSetColor" data-input-args='["${it.key}"]' style="width:30px;height:26px;border:none;background:none;cursor:pointer;padding:0;flex-shrink:0">
      <button class="fbtn" style="flex-shrink:0" title="Ripristina default" data-action="_topbarResetIcon" data-action-arg="${it.key}">↺</button>
    </div>`;
  }).join('');
}
function toggleKiosk(){
  _kioskOn=!_kioskOn;
  try{ localStorage.setItem('frarik_kiosk', _kioskOn?'1':'0'); }catch(e){}  // persiste tra i ricaricamenti
  _applyKioskUI();
  if(_kioskOn){
    if(editMode) toggleEdit();
    const el=document.documentElement;
    try{(el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen).call(el);}catch(e){}
  } else {
    try{(document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen).call(document);}catch(e){}
  }
}
/* Ripristina la modalità kiosk dopo un ricaricamento (il fullscreen richiede un gesto, ma il layout kiosk resta) */
(function(){ try{ if(localStorage.getItem('frarik_kiosk')==='1'){ _kioskOn=true; _applyKioskUI(); } }catch(e){} try{ _applyKioskAvail(); }catch(e){} try{ _applyTopbarStyle(); }catch(e){} })();
function togglePageTabs(){
  const wrap=document.getElementById('page-tabs-wrap');
  const btn=document.getElementById('tabs-toggle');
  if(!wrap) return;
  const hidden=wrap.classList.toggle('tabs-hidden');
  if(btn) btn.textContent=hidden?'▼':'▲';
  if(btn) btn.title=hidden?'Mostra barra pagine':'Nascondi barra pagine';
}
function _syncKioskFromFS(){
  if(!(document.fullscreenElement||document.webkitFullscreenElement)&&_kioskOn){
    _kioskOn=false;
    document.body.classList.remove('kiosk');
    const btn=document.getElementById('kiosk-btn');
    if(btn){btn.innerHTML='⛶';btn.title='Modalità Kiosk (schermo intero)';}
  }
}
document.addEventListener('fullscreenchange',_syncKioskFromFS);
document.addEventListener('webkitfullscreenchange',_syncKioskFromFS);

(function(){
  const LS='dash_screensaver';
  function cfg(){ try{return Object.assign({on:true,sec:300,weather:'',temp:'',imgDay:'',imgNight:'',dayFrom:'07:00',nightFrom:'20:00',ssEnt1:'',ssEnt2:'',ssEnt3:'',ssCardId:''}, JSON.parse(localStorage.getItem(LS)||'{}'));}catch(e){return {on:true,sec:300};} }
  function save(o){ localStorage.setItem(LS, JSON.stringify(Object.assign(cfg(),o||{}))); }
  window.screensaverCfg=function(o){ if(o) save(o); reset(); return cfg(); };
  const COND={'sunny':'☀️','clear-day':'☀️','clear-night':'🌙','partlycloudy':'⛅','partly-cloudy-day':'⛅','partly-cloudy-night':'☁️','cloudy':'☁️','rainy':'🌧️','rain':'🌧️','pouring':'🌧️','lightning':'⛈️','lightning-rainy':'⛈️','thunderstorm':'⛈️','snowy':'❄️','snow':'❄️','snowy-rainy':'🌨️','hail':'🌨️','fog':'🌫️','windy':'💨','windy-variant':'💨','exceptional':'⚠️'};
  function gv(id){ return (typeof hs!=='undefined'&&hs&&hs[id]!=null)?hs[id]:null; }
  function pickTemp(){ const c=cfg(); if(c.temp&&gv(c.temp)!=null) return gv(c.temp); if(typeof hs==='undefined') return null;
    const k=Object.keys(hs).find(x=>/sensor\..*gw1100a.*outdoor.*temp/i.test(x))||Object.keys(hs).find(x=>/sensor\..*gw1100a.*temperature/i.test(x)); return k?gv(k):null; }
  function pickWeather(){ const c=cfg(); if(c.weather&&gv(c.weather)!=null) return gv(c.weather); if(typeof hs==='undefined') return null;
    const w=Object.keys(hs).find(x=>x.startsWith('weather.')); return w?gv(w):null; }
  let ov,started=false,idleTimer=null,tickTimer=null,active=false;
  function build(){
    const st=document.createElement('style'); st.textContent=`
    #screensaver{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
      background:radial-gradient(1200px 820px at 50% -12%,rgba(99,102,241,.20),transparent 60%),radial-gradient(900px 720px at 50% 122%,rgba(168,85,247,.15),transparent 55%),#05070f;
      color:#fff;font-family:'Inter',system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .6s ease;cursor:none;text-align:center}
    #screensaver.on{opacity:1;pointer-events:auto}
    #ss-clock{font-size:clamp(72px,16vw,210px);font-weight:800;letter-spacing:-4px;line-height:1;text-shadow:0 0 60px rgba(99,102,241,.4)}
    #ss-clock .s{font-size:.38em;font-weight:600;opacity:.5;vertical-align:top;margin-left:4px}
    #ss-card{display:none;width:min(92vw,680px);max-height:62vh;overflow:hidden}
    #ss-card .card{margin:0 auto}
    #ss-date{font-size:clamp(16px,3vw,30px);font-weight:600;color:rgba(255,255,255,.6);text-transform:capitalize}
    #ss-wx{display:flex;align-items:center;gap:14px;font-size:clamp(22px,4.4vw,42px);font-weight:700;margin-top:8px}
    #ss-wx .e{font-size:1.25em}
    #ss-entities{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(20px,5vw,52px);margin-top:22px}
    .ss-ent{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:90px}
    .ss-ent .ic{font-size:clamp(26px,4vw,40px);line-height:1}
    .ss-ent .vl{font-size:clamp(20px,2.8vw,32px);font-weight:800;line-height:1.1}
    .ss-ent .nm{font-size:clamp(11px,1.5vw,15px);font-weight:600;color:rgba(255,255,255,.55)}
    #ss-hint{position:absolute;bottom:32px;font-size:11px;letter-spacing:1.5px;color:rgba(255,255,255,.22);text-transform:uppercase}`;
    document.head.appendChild(st);
    ov=document.createElement('div'); ov.id='screensaver';
    ov.innerHTML='<div id="ss-card"></div><div id="ss-clock"></div><div id="ss-date"></div><div id="ss-wx"></div><div id="ss-entities"></div><div id="ss-hint">tocca per uscire</div>';
    document.body.appendChild(ov);
  }
  const G=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
  const M=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  function tick(){
    if(!ov) return; const d=new Date(),p=n=>String(n).padStart(2,'0');
    ov.querySelector('#ss-clock').innerHTML=p(d.getHours())+':'+p(d.getMinutes())+'<span class="s">'+p(d.getSeconds())+'</span>';
    ov.querySelector('#ss-date').textContent=G[d.getDay()]+' '+d.getDate()+' '+M[d.getMonth()];
    const t=pickTemp(),w=pickWeather();
    const e=(w&&COND[String(w).toLowerCase()])||'⛅';
    const tv=(t!=null&&!isNaN(parseFloat(t)))?parseFloat(t).toFixed(1)+'°':'';
    ov.querySelector('#ss-wx').innerHTML=(tv||w)?('<span class="e">'+e+'</span><span>'+tv+'</span>'):'';
    _ssRenderEntities();
    _ssApplyBg();
  }
  /* Fino a 3 entità centrate sotto l'orologio (icona + valore + nome) */
  function _ssRenderEntities(){
    const el=ov&&ov.querySelector('#ss-entities'); if(!el) return;
    const c=cfg(); const ids=[c.ssEnt1,c.ssEnt2,c.ssEnt3].map(x=>(x||'').trim()).filter(Boolean).slice(0,3);
    if(!ids.length){ el.innerHTML=''; return; }
    el.innerHTML=ids.map(eid=>{
      const a=(typeof ha!=='undefined'&&ha[eid])||{};
      const stRaw=(typeof hs!=='undefined'&&hs[eid]!=null)?hs[eid]:'—';
      const unit=a.unit_of_measurement||'';
      const name=a.friendly_name||eid.split('.').slice(1).join('.').replace(/_/g,' ');
      let icHtml=''; try{ icHtml=_renderIcon(a.icon||(typeof _haAutoIcon==='function'?_haAutoIcon(eid):''),34,'#fff'); }catch(e){}
      const val=(typeof _stateIt==='function'?_stateIt(stRaw):stRaw)+(unit?' '+unit:'');
      return `<div class="ss-ent">${icHtml?`<div class="ic">${icHtml}</div>`:''}<div class="vl">${eh(val)}</div><div class="nm">${eh(name)}</div></div>`;
    }).join('');
  }
  /* Trova una card della dashboard per id (per "card al posto dell'orologio") */
  function _ssFindCard(id){ if(!id) return null; try{ for(const pg of (cfg.pages||[])){ const c=(pg.cards||[]).find(x=>x.id===id); if(c) return c; } }catch(e){} return null; }
  function _ssClearCard(){ const ce=ov&&ov.querySelector('#ss-card'); if(!ce) return; try{ const cur=cfg().ssCardId; if(cur) _stopYamlCard(cur+'_ss'); }catch(e){} ce.innerHTML=''; ce.style.display='none'; }
  function _ssApplyCard(){
    const ce=ov&&ov.querySelector('#ss-card'), clk=ov&&ov.querySelector('#ss-clock'); if(!ce||!clk) return;
    const card=_ssFindCard(cfg().ssCardId);
    if(card && typeof buildCard==='function'){
      try{
        ce.innerHTML='';
        const el=buildCard(Object.assign({}, card, {id:card.id+'_ss', colSpan:1, rowSpan:1}));
        ce.appendChild(el); ce.style.display=''; clk.style.display='none'; return;
      }catch(e){ console.warn('[Frarik] screensaver card:',e&&e.message); }
    }
    ce.style.display='none'; clk.style.display='';   // fallback: orologio
  }
  /* ── Immagine di sfondo screensaver con fasce giorno/notte ── */
  let _ssCurImg=null;
  function _ssPickImg(){
    const c=cfg();
    const day=(c.imgDay||'').trim(), night=(c.imgNight||'').trim();
    if(!day && !night) return '';
    if(!night) return day;
    if(!day) return night;
    // entrambe → scegli in base alla fascia oraria
    const now=new Date(), mins=now.getHours()*60+now.getMinutes();
    const toM=t=>{const a=String(t||'0:0').split(':').map(Number);return (a[0]||0)*60+(a[1]||0);};
    const dF=toM(c.dayFrom||'07:00'), nF=toM(c.nightFrom||'20:00');
    const isDay = dF<nF ? (mins>=dF&&mins<nF) : (mins>=dF||mins<nF);
    return isDay?day:night;
  }
  function _ssApplyBg(){
    if(!ov) return;
    const url=_ssPickImg();
    if(url===_ssCurImg) return;       // niente da fare (evita reload/flicker)
    _ssCurImg=url;
    if(url){ ov.style.backgroundImage='linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.5)), url("'+encodeURI(url)+'")'; ov.style.backgroundSize='cover'; ov.style.backgroundPosition='center'; }
    else { ov.style.backgroundImage=''; }
  }
  function _open(){ if(!ov) build(); active=true; _ssCurImg=null; _ssApplyBg(); _ssApplyCard(); tick(); ov.classList.add('on'); clearInterval(tickTimer); tickTimer=setInterval(tick,1000); }
  function show(){ if(active) return; if(typeof editMode!=='undefined'&&editMode) return; _open(); }
  function hide(){ if(!active) return; active=false; if(ov) ov.classList.remove('on'); clearInterval(tickTimer); tickTimer=null; _ssClearCard(); }
  function reset(){ if(active) hide(); clearTimeout(idleTimer); const c=cfg(); if(!c.on) return; idleTimer=setTimeout(show, Math.max(10,c.sec|0)*1000); }
  ['mousemove','mousedown','keydown','touchstart','wheel','scroll'].forEach(ev=>document.addEventListener(ev,reset,{passive:true,capture:true}));
  if(document.readyState!=='loading') reset(); else document.addEventListener('DOMContentLoaded',reset);
  window.screensaverNow=function(){ active=false; _open(); };  // test forzato (anche in modifica)
})();

(function(){
  const LS='dash_theme_sched';
  function c(){ try{return Object.assign({on:false,mode:'time',light:'07:00',dark:'20:00'},JSON.parse(localStorage.getItem(LS)||'{}'));}catch(e){return{on:false};} }
  window.themeScheduleCfg=function(o){ if(o) localStorage.setItem(LS,JSON.stringify(Object.assign(c(),o))); apply(); return c(); };
  function desired(){
    const s=c(); if(!s.on) return null;
    if(s.mode==='sun'){ const sun=(typeof hs!=='undefined'&&hs&&hs['sun.sun'])||''; return String(sun).toLowerCase().includes('below')?'':'light'; }
    const now=new Date(), mins=now.getHours()*60+now.getMinutes();
    const toM=t=>{const a=String(t||'0:0').split(':').map(Number);return (a[0]||0)*60+(a[1]||0);};
    const l=toM(s.light), d=toM(s.dark);
    const isLight = l<d ? (mins>=l&&mins<d) : (mins>=l||mins<d);
    return isLight?'light':'';
  }
  function apply(){ const want=desired(); if(want===null) return; if(typeof cfg==='undefined'||typeof applyTheme!=='function') return; const cur=cfg.theme==='light'?'light':''; if(want!==cur) applyTheme(want); }
  setInterval(apply,60000);
  (function boot(){ if(typeof cfg!=='undefined'&&typeof applyTheme==='function'){ apply(); } else setTimeout(boot,800); })();
})();

(function(){
  const LS='dash_navbar';
  function c(){ try{return Object.assign({on:false,pos:'bottom'},JSON.parse(localStorage.getItem(LS)||'{}'));}catch(e){return{on:false};} }
  window._navbarState=c;
  window.navbarCfg=function(o){ if(o) localStorage.setItem(LS,JSON.stringify(Object.assign(c(),o))); render(); if(typeof renderFbarZone==='function')try{renderFbarZone();}catch(e){} return c(); };
  let bar;
  function ensureStyle(){ if(document.getElementById('navbar-style'))return; const s=document.createElement('style'); s.id='navbar-style'; s.textContent=`
    /* navbar standalone (quando NON c'è la footer bar): stesso vetro del dock inferiore / plancia */
    #app-navbar{position:fixed;left:50%;transform:translateX(-50%);z-index:480;display:flex;gap:6px;padding:8px 12px;
      background:linear-gradient(135deg,rgba(99,102,241,.10),rgba(12,14,28,.55));-webkit-backdrop-filter:blur(26px) saturate(170%);backdrop-filter:blur(26px) saturate(170%);
      border:1px solid rgba(255,255,255,.10);border-radius:26px;
      box-shadow:0 18px 50px -14px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.07);max-width:calc(100% - 28px);overflow-x:auto;scrollbar-width:none}
    #app-navbar::-webkit-scrollbar{display:none}
    #app-navbar.bottom{bottom:14px} #app-navbar.top{top:64px}
    /* navbar pagine integrata DENTRO la barra inferiore = un'unica barra */
    #fbar-navchips{display:flex;gap:4px;align-items:center;overflow-x:auto;scrollbar-width:none;max-width:40vw}
    #fbar-navchips::-webkit-scrollbar{display:none}
    .nv-chip{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:50px;padding:6px 10px;border-radius:16px;cursor:pointer;
      color:rgba(255,255,255,.6);font-size:9px;font-weight:700;border:1px solid transparent;background:transparent;white-space:nowrap;transition:all .15s}
    .nv-chip .nv-ic{font-size:18px;line-height:1}
    .nv-chip:hover{color:#fff;background:rgba(255,255,255,.07)}
    .nv-chip.on{color:#a5b4fc;background:rgba(99,102,241,.18);border-color:rgba(129,140,248,.35)}
    body.has-navbar-bottom #dash{padding-bottom:100px}
    [data-theme="light"] #app-navbar{background:linear-gradient(135deg,rgba(99,102,241,.10),rgba(240,243,250,.7));border-color:rgba(15,23,42,.1)}
    [data-theme="light"] .nv-chip{color:#64748b}[data-theme="light"] .nv-chip.on{color:var(--acc)}`;
    document.head.appendChild(s); }
  window._navChipsHTML=function(){
    if(typeof cfg==='undefined'||!cfg.pages) return '';
    return cfg.pages.map((p,i)=>'<button class="nv-chip'+(i===cfg.activePage?' on':'')+'" data-action="_setActivePageAndSync" data-action-args="['+i+']"><span class="nv-ic">'+(p.icon||'📄')+'</span><span>'+String(p.name||('Pag '+(i+1))).slice(0,12)+'</span></button>').join('');
  };
  function render(){
    ensureStyle();
    // navigazione pagine nella navbar disattivata (non serve: si naviga dalle tab in alto)
    if(bar){ bar.remove(); bar=null; }
    document.body.classList.remove('has-navbar-bottom');
  }
  window._navbarSync=render;
  setInterval(()=>{ if(c().on&&bar){ bar.querySelectorAll('.nv-chip').forEach((b,i)=>b.classList.toggle('on',i===cfg.activePage)); } },1500);
  (function boot(){ if(typeof cfg!=='undefined'){ render(); } else setTimeout(boot,600); })();
})();

(function(){
  function $(id){return document.getElementById(id);}
  function _setTog(id,on){ const e=$(id); if(e) e.classList.toggle('on',!!on); }
  window._sysLoad=function(){
    try{
      const ss=screensaverCfg(); _setTog('sys-ss-tog',ss.on);
      if($('sys-ss-min')) $('sys-ss-min').value=Math.floor((ss.sec||0)/60);
      if($('sys-ss-sec')) $('sys-ss-sec').value=(ss.sec||0)%60;
      if($('sys-ss-img-day')) $('sys-ss-img-day').value=ss.imgDay||'';
      if($('sys-ss-img-night')) $('sys-ss-img-night').value=ss.imgNight||'';
      if($('sys-ss-day-from')) $('sys-ss-day-from').value=ss.dayFrom||'07:00';
      if($('sys-ss-night-from')) $('sys-ss-night-from').value=ss.nightFrom||'20:00';
      if($('sys-ss-e1')) $('sys-ss-e1').value=ss.ssEnt1||'';
      if($('sys-ss-e2')) $('sys-ss-e2').value=ss.ssEnt2||'';
      if($('sys-ss-e3')) $('sys-ss-e3').value=ss.ssEnt3||'';
      const _scard=$('sys-ss-card');
      if(_scard){ const o=['<option value="">— Orologio (default) —</option>'];
        (cfg.pages||[]).forEach(pg=>(pg.cards||[]).forEach(c=>{ if(c.type==='header-bar'||c.type==='footer-bar') return; o.push('<option value="'+c.id+'"'+(ss.ssCardId===c.id?' selected':'')+'>'+eh(c.label||c.type||c.id)+'</option>'); }));
        _scard.innerHTML=o.join(''); }
      const th=themeScheduleCfg(); _setTog('sys-th-tog',th.on);
      if($('sys-th-mode')) $('sys-th-mode').value=th.mode||'time';
      if($('sys-th-light')) $('sys-th-light').value=th.light||'07:00';
      if($('sys-th-dark')) $('sys-th-dark').value=th.dark||'20:00';
      if($('sys-th-times')) $('sys-th-times').style.display=(th.mode==='sun')?'none':'';
      const nv=navbarCfg(); _setTog('sys-nv-tog',nv.on);
      if($('sys-nv-pos')) $('sys-nv-pos').value=nv.pos||'bottom';
      if($('sys-mob')) $('sys-mob').value=localStorage.getItem('dash_mobcol')||'auto';
      _setTog('sys-kiosk-tog', !!(cfg&&cfg.kioskEnabled));
    }catch(e){}
  };
  window._sysToggle=function(w){
    if(w==='ss') screensaverCfg({on:!screensaverCfg().on});
    else if(w==='th') themeScheduleCfg({on:!themeScheduleCfg().on});
    else if(w==='nv') navbarCfg({on:!navbarCfg().on});
    else if(w==='kiosk'){ cfg.kioskEnabled=!cfg.kioskEnabled; saveCfg(); try{_applyKioskAvail();}catch(e){} }
    _sysLoad();
  };
  window._sysSaveSS=function(){ const m=+(($('sys-ss-min')||{}).value)||0, s=+(($('sys-ss-sec')||{}).value)||0; screensaverCfg({sec:m*60+s}); };
  window._ssSaveImg=function(){ screensaverCfg({
    imgDay:(($('sys-ss-img-day')||{}).value||'').trim(),
    imgNight:(($('sys-ss-img-night')||{}).value||'').trim(),
    dayFrom:($('sys-ss-day-from')||{}).value||'07:00',
    nightFrom:($('sys-ss-night-from')||{}).value||'20:00'
  }); };
  window._ssSaveEnt=function(){ screensaverCfg({
    ssEnt1:(($('sys-ss-e1')||{}).value||'').trim(),
    ssEnt2:(($('sys-ss-e2')||{}).value||'').trim(),
    ssEnt3:(($('sys-ss-e3')||{}).value||'').trim()
  }); };
  window._ssSaveCard=function(){ screensaverCfg({ ssCardId:($('sys-ss-card')||{}).value||'' }); };
  window._ssPickEnt=function(n){ _epPickerOpen(function(v){ const inp=document.getElementById('sys-ss-e'+n); if(inp) inp.value=v; window._ssSaveEnt(); }); };
  window._sysSaveTH=function(){ const mode=$('sys-th-mode').value; if($('sys-th-times'))$('sys-th-times').style.display=(mode==='sun')?'none':''; themeScheduleCfg({mode:mode,light:$('sys-th-light').value,dark:$('sys-th-dark').value}); };
  window._sysSaveNV=function(){ navbarCfg({pos:$('sys-nv-pos').value}); };
  window._applyMobCol=function(mode){ mode=mode||'auto'; localStorage.setItem('dash_mobcol',mode); document.body.classList.toggle('mobcol-off',mode==='off'); document.body.classList.toggle('mobcol-always',mode==='always'); };
  window._sysSaveMob=function(){ _applyMobCol($('sys-mob').value); };
  // ── Icone barra in alto: icona + colore ──
  window._topbarPickIcon=function(key, el){
    openIconPicker(function(v){ if(!cfg.topbar)cfg.topbar={}; cfg.topbar[key]=Object.assign({},cfg.topbar[key],{icon:v}); saveCfg(); _applyTopbarStyle(); _renderTopbarIconsList(); }, el);
  };
  window._topbarSetColor=function(key, hex){ if(!cfg.topbar)cfg.topbar={}; cfg.topbar[key]=Object.assign({},cfg.topbar[key],{color:hex}); saveCfg(); _applyTopbarStyle(); _renderTopbarIconsList(); };
  window._topbarResetIcon=function(key){ if(cfg.topbar&&cfg.topbar[key]){ delete cfg.topbar[key]; saveCfg(); _applyTopbarStyle(); _renderTopbarIconsList(); } };
  // ── Filtro ricerca galleria card ──
  window._smFilter=function(q){
    q=(q||'').trim().toLowerCase();
    document.querySelectorAll('#smod .sc-btn').forEach(b=>{ b.style.display=(!q||b.textContent.toLowerCase().includes(q))?'':'none'; });
    document.querySelectorAll('#smod .sc-cat').forEach(cat=>{ const grid=cat.nextElementSibling; const any=grid&&[...grid.querySelectorAll('.sc-btn')].some(b=>b.style.display!=='none'); cat.style.display=any?'':'none'; if(grid&&grid.classList.contains('scard-grid')) grid.style.display=any?'':'none'; });
  };
  (function boot(){ try{ _applyMobCol(localStorage.getItem('dash_mobcol')||'auto'); }catch(e){} })();
})();

// ── Esponi funzioni per handler HTML inline ──────────────────────────────────
Object.assign(window, {
  _addColorRule,
  _badgeClick,
  _badgeDragEnd,
  _badgeDragOver,
  _badgeDragStart,
  _badgeDrop,
  _bmSetAlign,
  _cmVisToggle,
  _delColorRule,
  _entacPick,
  _epPickerClose,
  _epPickerOpen,
  _epPickerSearch,
  _epPickerSelect,
  _epToggleGroup,
  _fbPickPreset,
  _fbPreviewIcon,
  _feClick,
  _feEpSearch,
  _ghAskInstall,
  _ghCleanOrphans,
  _ghCheck,
  _ghDismiss,
  _ghImportAll,
  _ghPublishDo,
  _ghStoreRender,
  _ghsCopy,
  _ghsDeleteInstalled,
  _ghsDownload,
  _ghsInstall,
  _ghsPreview,
  _ghsPublish,
  _ghsReloadTab,
  _ghsYamlAdd,
  _hbOptionsPopup,
  _hbOptionsPopupEl,
  _hbPickClockColor,
  _hbPickCmapColor,
  _hbRenderOptions,
  _hbSelBg,
  _hbSelTxt,
  _hbSmartClick,
  _iconPickerClose,
  _iconPickerPick,
  _iconPickerRenderTab,
  _inViewCopyBadge,
  _inViewCutBadge,
  _inViewDelBadge,
  _inViewEditBadge,
  _inViewPasteBadge,
  _ntfDelRule,
  _ntfDismiss,
  _ntfDismissById,
  _ntfDoAction,
  _ntfEntitySuggest,
  _ntfIconHtml,
  _ntfOpenActionPicker,
  _ntfPickEntity,
  _ntfSet,
  _ntfSetActionEntity,
  _ntfSetActionType,
  _ntfToggle,
  _ntfToggleCard,
  _pgMarkDirty,
  _pgWarnCancelAndProceed,
  _pgWarnSaveAndProceed,
  _pickColor,
  _pickEmoji,
  _sectEditBadge,
  _selBAction,
  _selBC,
  _selColMode,
  _selDisp,
  _selSectColor,
  _selVis,
  _setNewPageCols,
  _setRule,
  _sosPickPerson,
  _yamlLivePreview,
  addSaved,
  addSpecial,
  adjH,
  adjSecSpan,
  adjSpan,
  adjustClimate,
  appAddRow,
  appChipPopup,
  appGroupAdd,
  applyColorTheme,
  applyFont,
  applyTheme,
  browseField,
  callSvc,
  cancelPageSettings,
  clearClipboard,
  closeBM,
  closeCM,
  closeEM,
  closeFBM,
  closeFE,
  closeGhPub,
  closeGhStore,
  closeGhsPreview,
  closeGitHubCfg,
  closeHBM,
  closeIM,
  closeJsStore,
  closeMobileMenu,
  closeNotifCenter,
  closeNotifCfg,
  closeOikSettings,
  closeSM,
  closeSOS,
  closeSOS2,
  closeSOSCfg,
  closeSectMod,
  closeTM,
  closeTModStep2,
  closeViewEdit,
  closeViewsMenu,
  closeWM,
  closeYamlImport,
  confirmPage,
  confirmPageSettings,
  confirmRestartHA,
  copyCard,
  copySectBadge,
  cutCard,
  cutSectBadge,
  delBadge,
  delCard,
  delPage,
  delPageByIdx,
  delSectBadge,
  delSectTitle,
  deleteSaved,
  deleteViewFromEdit,
  doToggle,
  dupCard,
  ea,
  editBadgeAt,
  editView,
  eitClick,
  exportBackup,
  fbAddBtn,
  fbCancelBtn,
  fbDelBtn,
  fbEditBtn,
  fbMoveBtn,
  fbSaveBtn,
  fbSelType,
  fbarBtnClick,
  fbarZoneBtnClick,
  feAddEl,
  feAddEntity,
  feDelEl,
  feOpenEP,
  feUp,
  feUpdCard,
  filterE,
  ghStoreTab,
  hardReload,
  hbAddChip,
  hbAddOption,
  hbAutoFill,
  hbCancelChip,
  hbDelChip,
  hbEditChip,
  hbMoveChip,
  hbSaveChip,
  hbSelClickAct,
  hbSelClockFormat,
  hbSelClockSize,
  hbSelClockStyle,
  hbSelShape,
  hbSelSize,
  hbSelType,
  hideBadgeForm,
  importBackupFile,
  importYamlCard,
  jsStoreAddCard,
  jsStoreDeleteCard,
  jsStoreDownloadTemplate,
  jsStoreLoadFile,
  jsStoreTab,
  moveBadge,
  moveSectBadge,
  ntfAddRule,
  ntfMarkAllRead,
  onClickActionChange,
  onCustomColorToggle,
  onTypeChange,
  openBM,
  openCM,
  openColorPicker,
  openFBM,
  openGhStore,
  openGitHubCfg,
  openHBM_HDR,
  openIM,
  openIconPicker,
  openNotifCfg,
  openOikSettings,
  openPageCfg,
  openSOS,
  openSOSCfg,
  openSectBadges,
  openSectMod,
  openTM,
  openYamlImport,
  pasteCard,
  pasteCardTo,
  pasteSectBadge,
  previewSect,
  redoEdit,
  renderAppGroups,
  renderAppItems,
  renderSOSCfgList,
  saveBadgeForm,
  saveCard,
  saveCfg,
  saveFBM,
  saveGitHubCfg,
  saveHBM,
  saveRemoteAndRetry,
  saveSectMod,
  saveViewEdit,
  saveWizard,
  selBT,
  selColor,
  selShape,
  send,
  setActivePage,
  setSectBadgesAlign,
  setSectColor,
  setSectSize,
  setSectTitleAlign,
  setSectionCols,
  setSectionRowH,
  showBadgeForm,
  showToast,
  sosAddContact,
  sosAddPerson,
  sosAlertAll,
  sosCall,
  sosDeleteContact,
  sosMoveContact,
  sosNotify,
  sosRemovePerson,
  sosUpdateContact,
  syncCfgToHA,
  toggleEdit,
  toggleEntity,
  toggleFbarEnabled,
  toggleFontPop,
  toggleHASidebar,
  toggleKiosk,
  toggleMobileMenu,
  toggleNotifCenter,
  toggleSectBold,
  toggleSectItalic,
  toggleViewsMenu,
  undoEdit,
  yamlImportAdd,
  yamlImportParse,
  // ── Wrapper aggiunti nel refactor handler ──
  _covSkip, _feEpClose, _ntfSaveRules, _jsDropzoneClick, _ghsDropzoneClick,
  _ghCheckForce, _epToggleLicense, _epLicLogout, hbAddColorMapEntry, _hbResetColor,
  _hbPickChipIcon, _hbPickChipIcon2, _hbPickImapIcon, _hbIconInput, _hbIcon2Input,
  _hbSelEnt2Pos, _hbResetIcon, openSOSCfgModal, _hbEntityChanged, _hbBrowseEntity, _hbDelOption, _appDelItem, _appDelGroup,
  _openGhStoreClean, _pasteCardToClean, _closeViewsAndOpenTM, _closeViewsAndSetPage,
  _jsStoreAddAndRefresh, _deleteSavedAt, _appChipPopupAt, _setActivePageAndSync,
  _pgWarnClose, _sendCallSvc,
  _appItemPickIcon, _appItemPickColor, _appGroupPickColor,
  _sosPickIcon, _sosPickService, _sosSetQuick,
  _fePickIconBtn, _fePickIconEl,
  _ntfPickEntityFor, _ntfPickIcon, _ntfPickDuration, _ntfPickCam, _ntfPickAlexa, _ntfPickCond, _ntfPickMobile,
  _hbDelColorMapEntry, _hbDelIconMapEntry,
  _eitClickFromEl, _ghsPreviewEl,
  _appSetItemEntity, _appSetItemName, _appSetGroupName,
  _appSetGroupShowList, _appSetGroupEntities,
  _ntfSetAndSuggest, _ntfSetIcon,
});
