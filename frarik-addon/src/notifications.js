/* ═══ CENTRO NOTIFICHE — modulo indipendente ═══ */

let _ntfLog = [];
try{ _ntfLog = JSON.parse(localStorage.getItem('frarik_ntflog')||'[]'); }catch(e){ _ntfLog = []; }

function _ntfSaveLog(){
  try{ localStorage.setItem('frarik_ntflog', JSON.stringify(_ntfLog.slice(0,60))); }catch(e){}
}

export function _ntfPushLog(title, msg, icon, action, extra){
  extra = extra||{};
  if(action){
    const ex = _ntfLog.find(n=>n.action===action);
    if(ex){ ex.ts=Date.now(); ex.title=title; ex.msg=msg; ex.icon=icon; ex.read=false;
      _ntfSaveLog(); _ntfUpdateBell(); _ntfRenderIfOpen(); return; }
  }
  _ntfLog.unshift({ id:'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
    ts:Date.now(), title:title||'', msg:msg||'', icon:icon||'🔔', read:false, action:action||null });
  _ntfLog = _ntfLog.slice(0,60);
  _ntfSaveLog(); _ntfUpdateBell(); _ntfRenderIfOpen();
}

export function _ntfDismissById(id){
  _ntfLog = _ntfLog.filter(n=>n.id!==id);
  _ntfSaveLog(); _ntfUpdateBell(); renderNotifCenter();
}

/* Rimuove le notifiche PKG.
   - senza argomenti: tutte le 'pkg:...'
   - con fileName: solo quella specifica */
export function _ntfClearPkg(fileName){
  _ntfLog = _ntfLog.filter(n=>{
    if(!n.action) return true;
    if(fileName) return n.action !== 'pkg:'+fileName;
    return n.action.indexOf('pkg:') !== 0;
  });
  _ntfSaveLog(); _ntfUpdateBell(); _ntfRenderIfOpen();
}

/* Helper: estrae il path dal campo action (gestisce tutti i prefissi: gh:, gh-new:, gh-upd:) */
function _ghActionPath(a){
  if(!a) return null;
  if(a.indexOf('gh-new:')===0) return a.slice(7);
  if(a.indexOf('gh-upd:')===0) return a.slice(7);
  if(a.indexOf('gh:')===0)     return a.slice(3);
  return null;
}
function _isGhAction(a){ return a==='gh'||a.indexOf('gh:')===0||a.indexOf('gh-new:')===0||a.indexOf('gh-upd:')===0; }

/* Rimuove le notifiche relative alle card GitHub.
   - senza argomenti: tutte le notifiche gh
   - con filePath: solo quella voce (gestisce tutti i prefissi e il vecchio formato solo-filename) */
export function _ntfClearGh(filePath){
  _ntfLog = _ntfLog.filter(n=>{
    if(!n.action) return true;
    if(!_isGhAction(n.action)) return true;
    if(n.action==='gh') return false;
    if(filePath){
      const _np = _ghActionPath(n.action);
      if(_np === filePath) return false;                        // match esatto (path completo)
      const _base = filePath.includes('/') ? filePath.split('/').pop() : filePath;
      if(_np === _base || _np === filePath) return false;       // match filename legacy
      return true;
    }
    return false; // senza arg: rimuovi tutte
  });
  _ntfSaveLog(); _ntfUpdateBell(); _ntfRenderIfOpen();
}

/* Tiene SOLO le notifiche card relative ai file ancora in sospeso; rimuove tutte
   le altre (card ormai installate/aggiornate). Una sola passata, niente flicker.
   keepFiles può contenere path completi ('card-js/Lavatrice.js') o solo filename (legacy). */
export function _ntfClearGhExcept(keepFiles){
  // set di tutti i path/filename da conservare
  const keepPaths = new Set(keepFiles||[]);
  const keepBase  = new Set((keepFiles||[]).map(p=>{ const s=String(p); return s.includes('/')?s.split('/').pop():s; }));
  let changed=false;
  const next = _ntfLog.filter(n=>{
    if(!n.action) return true;
    if(!_isGhAction(n.action)) return true;
    if(n.action==='gh'){ changed=true; return false; }   // formato legacy senza file
    const _np = _ghActionPath(n.action);
    if(_np && (keepPaths.has(_np) || keepBase.has(_np))) return true;
    changed=true; return false;
  });
  if(changed){ _ntfLog=next; _ntfSaveLog(); _ntfUpdateBell(); _ntfRenderIfOpen(); }
}

function _ntfUnread(){ return _ntfLog.filter(n=>!n.read).length; }

export function _ntfUpdateBell(){
  const b = document.getElementById('notif-bell-badge'); if(!b) return;
  const n = _ntfUnread(); b.textContent = n>9?'9+':String(n); b.classList.toggle('on', n>0);
}

export function ntfMarkAllRead(){ _ntfLog.forEach(n=>n.read=true); _ntfSaveLog(); _ntfUpdateBell(); }
export function ntfClearAll(){ _ntfLog=[]; _ntfSaveLog(); _ntfUpdateBell(); renderNotifCenter(); }

function _ntfRelTime(ts){
  const s = Math.floor((Date.now()-ts)/1000);
  if(s<60) return 'adesso';
  if(s<3600) return Math.floor(s/60)+' min fa';
  if(s<86400) return Math.floor(s/3600)+' h fa';
  return new Date(ts).toLocaleDateString('it-IT',{day:'numeric',month:'short'});
}

function _ntfRenderIfOpen(){
  const c = document.getElementById('notif-center');
  if(c && c.classList.contains('on')) renderNotifCenter();
}

export function renderNotifCenter(){
  const el = document.getElementById('notif-center-list'); if(!el) return;
  const hdr = document.getElementById('ntfc-hdr-btns');
  if(hdr && !hdr.dataset.ready){
    hdr.dataset.ready = '1';
    const bRead = document.createElement('button');
    bRead.className='ntfc-act'; bRead.title='Segna tutte lette'; bRead.textContent='✓';
    bRead.addEventListener('click', ev=>{ ev.stopPropagation(); ntfMarkAllRead(); renderNotifCenter(); });
    const bClear = document.createElement('button');
    bClear.className='ntfc-act'; bClear.title='Svuota tutto'; bClear.textContent='🗑';
    bClear.addEventListener('click', ev=>{ ev.stopPropagation(); ntfClearAll(); });
    hdr.appendChild(bRead); hdr.appendChild(bClear);
  }
  while(el.firstChild) el.removeChild(el.firstChild);
  if(!_ntfLog.length){
    const empty = document.createElement('div');
    empty.className='ntfc-empty'; empty.textContent='Nessuna notifica';
    el.appendChild(empty); return;
  }
  _ntfLog.forEach(function(n){
    const item = document.createElement('div'); item.className='ntfc-item'+(n.read?'':' unread');
    const ico  = document.createElement('div'); ico.className='ntfc-ico'; ico.textContent=n.icon||'🔔';
    const body = document.createElement('div'); body.className='ntfc-body';
    const t    = document.createElement('div'); t.className='ntfc-title'; t.textContent=n.title||'';
    const time = document.createElement('div'); time.className='ntfc-time'; time.textContent=_ntfRelTime(n.ts);
    body.appendChild(t);
    if(n.msg){ const m=document.createElement('div'); m.className='ntfc-msg'; m.textContent=n.msg; body.appendChild(m); }
    body.appendChild(time);
    item.appendChild(ico); item.appendChild(body);
    // colonna pulsanti a destra: ✓ (apri store) quando c'è un'azione, ✕ (elimina) sempre
    const btns = document.createElement('div'); btns.className='ntfc-btns';
    if(n.action){
      const go = document.createElement('button'); go.className='ntfc-go'; go.title='Apri lo store'; go.textContent='✓';
      go.addEventListener('click', ev=>{ ev.stopPropagation(); try{ if(typeof window._ntfHandleAction==='function') window._ntfHandleAction(n.action, n); }catch(e){} });
      btns.appendChild(go);
    }
    const btn = document.createElement('button'); btn.className='ntfc-x'; btn.title='Elimina'; btn.textContent='✕';
    btn.addEventListener('click', ev=>{ ev.stopPropagation(); _ntfDismissById(n.id); });
    btns.appendChild(btn);
    item.appendChild(btns);
    // tutta la riga è cliccabile: instrada l'azione (es. apri store)
    if(n.action){
      item.style.cursor='pointer';
      item.addEventListener('click', ()=>{ try{ if(typeof window._ntfHandleAction==='function') window._ntfHandleAction(n.action, n); }catch(e){} });
    }
    el.appendChild(item);
  });
}

export function toggleNotifCenter(ev){
  if(ev) ev.stopPropagation();
  const c = document.getElementById('notif-center');
  if(c.classList.toggle('on')){
    renderNotifCenter(); ntfMarkAllRead();
    setTimeout(()=>document.addEventListener('click', _ntfOutside), 0);
  } else {
    document.removeEventListener('click', _ntfOutside);
  }
}

export function closeNotifCenter(){
  const c = document.getElementById('notif-center'); if(c) c.classList.remove('on');
  document.removeEventListener('click', _ntfOutside);
}

function _ntfOutside(e){
  const c = document.getElementById('notif-center');
  const b = document.getElementById('notif-bell');
  if(c && !c.contains(e.target) && b && !b.contains(e.target)) closeNotifCenter();
}
