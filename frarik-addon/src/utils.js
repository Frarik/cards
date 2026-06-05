/* ═══ UTILS — funzioni pure senza dipendenze dallo stato app ═══ */

export function uid(){ return 'c'+Math.random().toString(36).slice(2,9); }

/** Escape HTML — previene XSS nell'interpolazione di stringhe utente */
export function eh(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/** Escape attributo JS (virgolette singole) */
export function ea(s){ return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

/** Schiarisce un colore hex di pct% */
export function _lightenHex(hex, pct){
  try{
    const n = parseInt(hex.replace('#',''), 16);
    const r = Math.min(255, ((n>>16)&0xff) + Math.round(2.55*pct));
    const g = Math.min(255, ((n>>8)&0xff)  + Math.round(2.55*pct));
    const b = Math.min(255, (n&0xff)        + Math.round(2.55*pct));
    return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
  }catch(e){ return hex; }
}

/* ── Toast ──────────────────────────────────────────────────────────────── */
let _toastT = null;
export function showToast(msg, ms=2200){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg; t.classList.add('show');
  if(_toastT) clearTimeout(_toastT);
  _toastT = setTimeout(()=>t.classList.remove('show'), ms);
}

/* ── Confirm dialog ─────────────────────────────────────────────────────── */
export function showConfirm(msg, onOk, okLabel='Elimina', cancelLabel='Annulla', onCancel=null){
  const ov = document.getElementById('confirm-overlay');
  if(!ov) return;
  document.getElementById('confirm-msg').innerHTML = msg;
  const okBtn     = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');
  okBtn.textContent     = okLabel;
  cancelBtn.textContent = cancelLabel;
  ov.style.display = 'flex';
  const close = ()=>{ ov.style.display='none'; okBtn.onclick=null; cancelBtn.onclick=null; cancelBtn.textContent='Annulla'; };
  okBtn.onclick     = ()=>{ close(); onOk(); };
  cancelBtn.onclick = ()=>{ close(); if(onCancel) onCancel(); };
  ov.onclick        = e=>{ if(e.target===ov){ close(); if(onCancel) onCancel(); } };
}
