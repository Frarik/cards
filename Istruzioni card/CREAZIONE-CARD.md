---
name: frarik-card-skill
description: >
  Guida unica e autorevole per creare card JS per la Frarik Dashboard / FratechStore.
  Le card sono script vanilla JS registrati in window.FratechCardRegistry.
  Quando l'utente chiede "creami una card per Frarik", leggere PRIMA questo file e seguirlo.
---

# Creazione card JS — Frarik Dashboard / FratechStore

Guida di riferimento. Quando si chiede all'assistente «creami una card», deve
**leggere questo documento** e seguirne regole, API e design system.

> Sintesi delle fonti unite qui: template ufficiale dell'add-on, API reali della
> dashboard (verificate nel codice `frarik-addon/src/main.js`), il design system
> Frarik e alcuni pattern grafici riutilizzabili (grafici/icone SVG inline).

---

## 0. Regole fondamentali

1. Produci **un singolo file `.js`** — niente build, niente npm, niente React.
2. Solo **vanilla JS + HTML inline + CSS inline**.
3. Wrappa sempre in IIFE: `(function(){ 'use strict'; … })();`
4. Registra con `window.FratechCardRegistry[CARD.id] = CARD;`
5. **Niente `<style>` globale** — solo CSS inline sugli elementi (le card condividono il DOM).
6. **Nome file = `id`** della card (es. `id:'bolletta-card'` → `bolletta-card.js`), minuscolo, solo `a-z 0-9 -`.
7. Per le card complesse **replica il design system §4** — non inventare palette/spaziature diverse.
8. Le card girano in scope **globale**: usano solo ciò che è su `window` (vedi §3 API).

---

## 1. I due formati

| Formato | Quando | Registrazione |
|---|---|---|
| **FratechStore** (consigliato) | Display, pannelli, controlli, grafici: il 95% dei casi. | `window.FratechCardRegistry[CARD.id] = CARD` |
| **Lovelace** (avanzato) | Serve l'`hass` completo di HA (oggetti stato con attributi, websocket). | `customElements.define('tag', Classe)` + `window.customCards.push(...)` |

### 1a. Template FratechStore

```js
(function () {
  'use strict';

  const CARD = {
    id:      'mia-card',      // = nome file, solo a-z 0-9 -
    name:    'La Mia Card',   // nome nello store
    icon:    '🎯',            // emoji o 'mdi:nome'
    version: '1.0.0',         // la dashboard la incrementa da sola (vedi §6)
    desc:    'Descrizione breve mostrata nello store',

    // render(card, hass) → STRINGA HTML.  hass = { states: { 'sensor.x':'42', ... } }
    //   ATTENZIONE: hass.states[id] è una STRINGA. Per gli attributi usa window.ha[id].
    render(card, hass) {
      const v = hass?.states?.[card.entity] ?? '—';
      return `<div style="height:100%;display:flex;align-items:center;justify-content:center;
                          color:${card.color||'#38bdf8'};font-size:28px;font-weight:800">${v}</div>`;
    },

    // update(card, hass, el) — refresh live ad ogni cambio stato. el = container nel DOM.
    update(card, hass, el) { el.innerHTML = this.render(card, hass); this.mount?.(card, hass, el); },

    // mount(card, hass, el) — dopo render(): event listener, Chart.js, timer.
    mount(card, hass, el) {}
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
})();
```

### 1b. Template Lovelace (avanzato)

```js
class MiaCard extends HTMLElement {
  setConfig(config){ this._config = config; }
  set hass(hass){                                   // hass.states[id] = OGGETTO {state, attributes}
    const st = hass.states[this._config.entity];
    this.innerHTML = `<div style="padding:12px">${this._config.entity}: <b>${st?st.state:'—'}</b></div>`;
  }
  getCardSize(){ return 2; }
}
if (!customElements.get('mia-card')) customElements.define('mia-card', MiaCard);  // guardia (vedi §7)
window.customCards = window.customCards || [];
window.customCards = window.customCards.filter(c => c && c.type !== 'mia-card');  // push SINCRONO, non deferito
window.customCards.push({ type:'mia-card', name:'Mia Card', description:'…', version:'1.0.0' });
```

---

## 2. Oggetto `card` — campi configurabili dall'utente (pannello ✏️)

| Campo | Tipo | Descrizione |
|---|---|---|
| `card.id` | string | ID istanza nella dashboard |
| `card.label` | string | Etichetta/titolo |
| `card.icon` | string | Emoji o `mdi:` icona |
| `card.entity` | string | Entità HA principale (`sensor.x`) |
| `card.entity2`, `card.entity3` | string | Entità aggiuntive |
| `card.color` | string | Colore hex accento (`#6366f1`) |
| `card.unit` | string | Unità di misura |
| `card.sub` | string | Testo secondario / sottotitolo |
| `card.hours` | number | Ore di storia (default 24) |
| `card.max`, `card.min` | number | Valori massimo/minimo |
| `card.bgColor`, `card.textColor` | string | Sfondo/testo personalizzati |

Accesso allo stato: **`hass?.states?.[card.entity] ?? '—'`** (mai accesso non protetto).

---

## 3. API globali disponibili nelle card (verificate nel codice)

```js
window.hs            // { 'entity_id': 'stato_stringa', ... }  — tutti gli stati HA (live)
window.ha            // { 'entity_id': { attributi... } }      — attributi HA (live)

// Chiamare un servizio HA
callSvc(domain, service, entityId, data = {})
//   callSvc('light', 'turn_on', 'light.salotto', { brightness: 200 })
//   callSvc('switch', 'toggle', 'switch.x')
//   callSvc('input_boolean', 'turn_on', 'input_boolean.x')

// Storia di un'entità → Promise<[{ t: Date, v: number }]>
fetchHistory(entityId, hours = 24)

// Alias espliciti equivalenti
frarikCallService(domain, service, data, target)   // data = { entity_id, ... }
frarikEntity(id)    // → { entity_id, state, attributes }
frarikState(id)     // → stringa stato | null
```

> 🔒 **Sicurezza:** `BASE`/`TOKEN` (URL e token HA) **non** sono esposti alle card di
> proposito — un token non deve mai essere accessibile al codice di una card. Per la
> cronologia usa `fetchHistory()`, che usa il token internamente senza esporlo.
> Per leggere gli **attributi** di un'entità: `window.ha['sensor.x'].unit_of_measurement`.

---

## 4. Design System Frarik — replicare questo stile

Le card complesse Frarik seguono uno stile coerente. Usa **questi valori esatti**.

### 4a. Palette

```
Sfondo card:        rgba(10,14,26,1)         oppure rgba(255,255,255,.04)
Pannelli interni:   rgba(255,255,255,.04)  + bordo rgba(255,255,255,.08)
Pannelli hover:     rgba(255,255,255,.07)
Bordo card:         rgba(255,255,255,.08)  /  rgba(255,255,255,.12)

Accento blu:        #38bdf8   — sensori, info, stato attivo
Accento indigo:     #6366f1   — azioni primarie
Accento viola:      #a78bfa   — secondary accent
Accento verde:      #4ade80   — stato ON/ok
Accento arancio:    #fb923c   — warning, timer
Accento rosso:      #f87171   — errore, allarme, OFF

Testo primario:     #ffffff
Testo secondario:   rgba(255,255,255,.55)
Testo muted:        rgba(255,255,255,.28)   — label uppercase
Font:               var(--primary-font-family, 'Inter', system-ui, sans-serif)
```

### 4b. Container principale (wrapper di ogni card)

```js
`<div style="height:100%;width:100%;box-sizing:border-box;display:flex;flex-direction:column;
  background:rgba(10,14,26,1);border-radius:inherit;
  font-family:var(--primary-font-family,'Inter',system-ui,sans-serif);
  color:#fff;overflow:hidden;">…</div>`
```

### 4c. Header (icon-box + titolo + sottotitolo + badge stato)

```js
function _header(icon, title, subtitle, statusText, statusColor) {
  return `<div style="display:flex;align-items:center;gap:12px;padding:16px 18px 14px;
              border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;">
    <div style="width:42px;height:42px;border-radius:12px;flex-shrink:0;
                background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.3);
                display:flex;align-items:center;justify-content:center;font-size:20px;">${icon}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:15px;font-weight:700;color:#fff;overflow:hidden;
                  text-overflow:ellipsis;white-space:nowrap;">${title}</div>
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;
                  color:rgba(255,255,255,.35);margin-top:2px;">${subtitle}</div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;
                border:1px solid ${statusColor}55;background:${statusColor}18;flex-shrink:0;">
      <div style="width:7px;height:7px;border-radius:50%;background:${statusColor};
                  box-shadow:0 0 6px ${statusColor};"></div>
      <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;
                   color:${statusColor};">${statusText}</span>
    </div>
  </div>`;
}
```

### 4d. Pannello dati (griglia glassmorphism)

```js
// contenitore: <div style="display:grid;grid-template-columns:repeat(N,1fr);gap:8px;padding:14px 16px;">
function _panel(label, value, hint, accent) {
  return `<div style="background:rgba(255,255,255,.04);border-radius:12px;
              border:1px solid rgba(255,255,255,.08);padding:12px 14px;">
    <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
                color:${accent||'rgba(255,255,255,.35)'};margin-bottom:8px;">${label}</div>
    <div style="font-size:28px;font-weight:800;color:#fff;line-height:1;letter-spacing:-1px;">${value}</div>
    ${hint?`<div style="font-size:9px;color:rgba(255,255,255,.35);margin-top:4px;">${hint}</div>`:''}
  </div>`;
}
```

### 4e. Barra progresso

```js
function _progressBar(label, current, max, color) {
  const pct = Math.min(100, Math.round(current / max * 100));
  return `<div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);">
    <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
                color:rgba(255,255,255,.35);margin-bottom:6px;">${label}</div>
    <div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:8px;">
      ${current} <span style="font-size:11px;color:rgba(255,255,255,.35);">/ ${max}</span></div>
    <div style="height:4px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;transition:width .6s;"></div>
    </div>
  </div>`;
}
```

### 4f. Pulsanti

```js
function _btnPrimary(label, id, color='#6366f1') {
  return `<button id="${id}" style="width:100%;padding:14px;border-radius:12px;border:none;
    background:linear-gradient(135deg,${color},${color}cc);color:#fff;font-size:13px;font-weight:700;
    cursor:pointer;letter-spacing:.3px;display:flex;align-items:center;justify-content:center;gap:8px;
    box-shadow:0 6px 20px ${color}44;">${label}</button>`;
}
function _btnGhost(label, id) {
  return `<button id="${id}" style="padding:8px 16px;border-radius:10px;
    border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);
    color:rgba(255,255,255,.7);font-size:12px;font-weight:700;cursor:pointer;">${label}</button>`;
}
function _btnIcon(label, id) {
  return `<button id="${id}" style="width:34px;height:34px;border-radius:10px;
    border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#fff;
    font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;">${label}</button>`;
}
```

### 4g. Chip selezionabili e badge stato

```js
function _chips(items, active, idPrefix) {
  return items.map((item,i)=>`<button id="${idPrefix}-${i}" style="padding:5px 10px;border-radius:8px;
    font-size:10px;font-weight:700;cursor:pointer;
    ${active.includes(i)
      ? 'background:rgba(56,189,248,.2);border:1px solid rgba(56,189,248,.5);color:#38bdf8;'
      : 'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.4);'}
  ">${item}</button>`).join('');
}
function _badge(text, color) {  // ● Aperta / ● Chiusa
  return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:15px;font-weight:700;color:${color};">
    <span style="width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};"></span>
    ${text}</span>`;
}
```

---

## 5. Pattern grafici riutilizzabili (senza librerie)

### 5a. Icone SVG (stile lucide, `stroke="currentColor"`)

```js
const SVG_THERM = (sz=14) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`;
// Colore controllato dal parent: style="color:#38bdf8"
```

### 5b. Mini grafico a barre SVG inline (24h)

```js
function buildBarChart(hist, colorFn, n=48) {        // hist = [{t,v}] da fetchHistory()
  const bkts = Array.from({length:n}, () => ({s:0,c:0}));
  const now = Date.now(), start = now - 24*3600_000, size = (24*3600_000)/n;
  hist.forEach(({t,v}) => { const i = Math.floor((+t - start)/size); if(i>=0&&i<n){ bkts[i].s+=v; bkts[i].c++; } });
  const data = bkts.map(b => b.c ? b.s/b.c : null);
  const valid = data.filter(v => v!==null); if(!valid.length) return '';
  const minV = Math.min(...valid), maxV = Math.max(...valid), range = (maxV-minV)||1, H=56, bw=100/n;
  const bars = data.map((v,i)=> v==null ? '' : (() => {
    const h = Math.max(2, ((v-minV)/range)*(H-4));
    return `<rect x="${(i*bw).toFixed(2)}" y="${(H-h).toFixed(2)}" width="${(bw-0.4).toFixed(2)}"
      height="${h.toFixed(2)}" fill="${colorFn?colorFn(v):'#38bdf8'}" fill-opacity=".9" rx="1.5"/>`;
  })()).join('');
  return `<svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" style="width:100%;height:56px;display:block">${bars}</svg>`;
}
```

### 5c. Auto-scoperta sensori per device_class

```js
Object.entries(window.ha).forEach(([id, attrs]) => {
  if (attrs?.device_class === 'temperature') { /* … */ }
  if (attrs?.device_class === 'humidity')    { /* … */ }
});
```

### 5d. Rebuild vs patch (anti-flicker) — opzionale per card pesanti

In `update()` ricostruisci l'HTML solo se cambia la **struttura**; altrimenti aggiorna
i singoli nodi con `el.querySelector('[data-field="x"]').textContent = …`. Usa attributi
`data-field` come hook. Per la maggior parte delle card basta `update = render+mount`.

---

## 6. Versionamento

- Dichiara `version: '1.0.0'` nel codice (formato `x.y.z`).
- La dashboard tiene una **versione automatica persistente per nome-file**:
  - **Upload manuale**: prima volta = versione dichiarata, poi **ogni ricaricamento dello
    stesso file incrementa la patch** (1.0.0 → 1.0.1 → …); resta tale anche dopo
    un'eliminazione ed è identica sia selezionando sia trascinando il file.
  - **GitHub**: quando il file cambia sul repo (sha diverso) la patch sale e arriva la
    notifica «Card aggiornata da vX a vY».

---

## 7. Errori comuni (checklist)

- ✅ IIFE + `window.FratechCardRegistry[CARD.id] = CARD;` alla fine.
- ✅ `render()` ritorna **stringa HTML**; manipola il DOM solo in `mount`/`update`.
- ✅ Event listener **solo in `mount()`**, mai in `render()`.
- ✅ Accesso stati protetto: `hass?.states?.[eid] ?? '—'`. Attributi: `window.ha[eid]`.
- ✅ `hass` può essere `null`.
- ✅ **Lovelace**: guardia `if(!customElements.get('tag')) customElements.define(...)`;
  push su `window.customCards` **sincrono** (NON `setTimeout` — la dashboard legge subito
  dopo l'eval).
- ✅ **Chart.js / canvas / mappe**: distruggi prima di ricreare in `mount`
  (`if(el._chart) el._chart.destroy();`) — `mount` può essere chiamato più volte.
- ✅ Niente `<style>` globale; CSS inline. Classi con prefisso per non collidere.
- ✅ Fluido: contenitori `width:100%; min-width:0`, testo con
  `overflow:hidden;text-overflow:ellipsis;white-space:nowrap`, niente larghezze fisse in px.
- ✅ Nessuna libreria/CDN esterna se evitabile; se serve, caricala on-demand una sola volta
  (cache su `window`).

---

## 8. Esempio completo — card stile Frarik (header + griglia + azione)

```js
/**
 * frarik-example-card.js v1.0.0 — Card con header, griglia pannelli, stato e azione.
 * Installazione: Store → ⚡ Card JS → Carica File
 */
(function(){
  'use strict';

  function _header(icon, title, subtitle, statusText, statusColor){
    return `<div style="display:flex;align-items:center;gap:12px;padding:16px 18px 14px;
        border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;">
      <div style="width:42px;height:42px;border-radius:12px;flex-shrink:0;background:rgba(56,189,248,.15);
        border:1px solid rgba(56,189,248,.3);display:flex;align-items:center;justify-content:center;font-size:20px;">${icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:15px;font-weight:700;color:#fff;">${title}</div>
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;
          color:rgba(255,255,255,.35);margin-top:2px;">${subtitle}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;
        border:1px solid ${statusColor}55;background:${statusColor}18;">
        <div style="width:7px;height:7px;border-radius:50%;background:${statusColor};box-shadow:0 0 6px ${statusColor};"></div>
        <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:${statusColor};">${statusText}</span>
      </div></div>`;
  }
  function _panel(label, value, hint, accent){
    return `<div style="background:rgba(255,255,255,.04);border-radius:12px;border:1px solid rgba(255,255,255,.08);padding:12px 14px;">
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
        color:${accent||'rgba(255,255,255,.35)'};margin-bottom:8px;">${label}</div>
      <div style="font-size:28px;font-weight:800;color:#fff;line-height:1;letter-spacing:-1px;">${value}</div>
      ${hint?`<div style="font-size:9px;color:rgba(255,255,255,.35);margin-top:4px;">${hint}</div>`:''}</div>`;
  }

  const CARD = {
    id:'frarik-example-card', name:'Card Esempio', icon:'📊', version:'1.0.0',
    desc:'Esempio con header, griglia e azione',

    render(card, hass){
      const v1 = hass?.states?.[card.entity]  ?? '—';
      const v2 = hass?.states?.[card.entity2] ?? '—';
      const isOn = hass?.states?.[card.entity] === 'on';
      const statusColor = isOn ? '#4ade80' : 'rgba(255,255,255,.4)';
      const statusText  = isOn ? 'ATTIVO' : 'SPENTO';
      return `<div style="height:100%;width:100%;box-sizing:border-box;display:flex;flex-direction:column;
          background:rgba(10,14,26,1);border-radius:inherit;
          font-family:var(--primary-font-family,'Inter',system-ui);color:#fff;overflow:hidden;">
        ${_header(card.icon||'📊', card.label||'Card Esempio', card.sub||'SOTTOTITOLO', statusText, statusColor)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px 16px;flex:1;">
          ${_panel('VALORE PRINCIPALE', v1, card.unit||'', card.color||'#38bdf8')}
          ${_panel('SECONDO VALORE', v2, 'descrizione', '#a78bfa')}
        </div>
        <div style="padding:0 16px 16px;">
          <button id="act-${card.id}" style="width:100%;padding:14px;border-radius:12px;border:none;
            background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:13px;font-weight:700;
            cursor:pointer;box-shadow:0 6px 20px rgba(99,102,241,.4);">▶ Azione</button>
        </div></div>`;
    },

    update(card, hass, el){ el.innerHTML = this.render(card, hass); this.mount(card, hass, el); },

    mount(card, hass, el){
      el.querySelector('#act-'+card.id)?.addEventListener('click', ()=>{
        if(card.entity) callSvc(card.entity.split('.')[0], 'toggle', card.entity);
      });
    }
  };

  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
})();
```

---

## 9. Cartelle store e installazione

| Cartella repo | Scheda store | Uso |
|---|---|---|
| `card-js/` | ⚡ Card JS | card generiche |
| `card-chips/` | 🔹 Chips | chip header |
| `card-distintivi/` | 🏷️ Distintivi | badge |
| `card-yaml/` | 📄 YAML | config YAML (solo copia) |
| `pkg/` | 📦 Pacchetti | package YAML backend |

> I file che iniziano con `frarik` sono esclusi (sono file dell'app, non card).

**Flusso:** crea il `.js` → caricalo (Store → Card locali) per provarlo → **Pubblica**
nella cartella giusta (o `git push`). Le altre dashboard ricevono la notifica.

---

## 10. Note / fonti

- Card **belle graficamente** (riferimento estetico): la dashboard *Oikos* usa React+SDK
  con un design-system a token. Concetti riusati qui (non il codice): non hardcodare
  scala tipografica/spaziature, layout fluido per mobile (`width:100%`, `min-width:0`,
  niente larghezze fisse), grafici responsive. La realizzazione in Frarik è **vanilla JS**
  come sopra.
- Pattern vanilla riusati: grafici/icone **SVG inline**, rebuild-vs-patch anti-flicker,
  auto-scoperta per `device_class`.
