# Frarik Cards — Standard di Sviluppo

Questo file contiene le regole che OGNI nuova card JS per frarik deve rispettare.
La **MeteoCard** (Meteo.js, frarik-version 1.25) è il riferimento principale.

---

## 1. Struttura di ogni card JS

Ogni card è un `HTMLElement` con shadow DOM registrato in `window.FratechCardRegistry`:

```javascript
/* frarik-version: X.Y */
class MiaCard extends HTMLElement {
  static getStubConfig(){ return { entityId: '' } }
  constructor(){
    super()
    this.attachShadow({mode:'open'})
    this._h   = null
    this._c   = { entityId:'', cardScale:100, cardW:100, /* altri campi */ }
    this._frarikCard = null   // oggetto card frarik (passato da configure)
    this._modalHost  = null   // host shadow DOM per le impostazioni
    this._histModalHost = null // host shadow DOM per popup grafici
    this._click = this._onClick.bind(this)
    this._inp   = this._onInput.bind(this)
  }
  set hass(h){ this._h=h; this._build() }
  setConfig(cfg){ /* carica da localStorage, popola _c */ this._build() }
  configure(card){ if(card?.id) this._frarikCard=card; this._openSettings() }
  connectedCallback(){ /* addEventListener shadow DOM */ }
  disconnectedCallback(){ /* removeEventListener, destroyModal, destroyHistModal */ }
}
if(!customElements.get('mia-card')) customElements.define('mia-card', MiaCard)
_registerLovelaceCard('mia-card', { name:'...', icon:'📦', description:'...' })
```

---

## 2. Slider dimensioni card (OBBLIGATORI in ogni settings popup)

Ogni card DEVE avere due slider nelle impostazioni:

### Altezza — CSS zoom (scala proporzionale)
- Slider `data-f="cardscale"`, range **20–100**, step 5
- Applica `zoom: X%` su `#card-{id}` via evento `frarik-card-layout`
- 100% = Auto (dimensione piena). Sotto 100% scala TUTTO proporzionalmente senza clipping.
- Salva in `_c.cardScale`, persiste via `card.cardScale` in frarik cfg.
- **main.js** restore: `if(card.cardScale>0&&card.cardScale<100) el.style.zoom=card.cardScale+'%'`

### Larghezza — width percentuale
- Slider `data-f="cardw"`, range **20–100**, step 5
- Applica `width: X%; max-width: X%` su `#card-{id}` via evento `frarik-card-layout`
- 100% = Auto (occupa tutta la colonna). Sotto 100% stringe la card.
- Salva in `_c.cardW`, persiste via `card.cardW` in frarik cfg.
- **main.js** restore: `if(card.cardW>0&&card.cardW<100){ el.style.width=...; el.style.maxWidth=...; }`

### Dispatch dell'evento
```javascript
this.dispatchEvent(new CustomEvent('frarik-card-layout', {
  bubbles:true, composed:true,
  detail:{ cardId:this._frarikCard.id, cardScale:X, cardW:Y }
}))
```

---

## 3. Settings popup — layout e colori

- **max-width: 900px**, layout **2 colonne**:
  - Sinistra (400px): form di configurazione con tutti i campi
  - Destra: **anteprima live** della card + slider Altezza/Larghezza
- Background: `rgba(10,8,20,.98)`, border: `rgba(139,92,246,.32)`, border-radius: 18px
- Tutti i testi **#fff** (100% opacità, zero rgba ridotti)
- Accento: **#fbbf24** (giallo amber)
- Pulsante salva: fondo giallo-amber, testo scuro
- Header popup: `.shdr` con icona `.sico` + titolo `.stit` + sottotitolo `.ssub` + X `.scls`

### Anteprima live
- `<card-tag id="preview-card" style="--fgear:none;display:block;">` nel pannello destro
- `_updatePreview()` con debounce 180ms su ogni `input`
- `_schedPrev()` chiamato da tutti gli handler `_onInput`
- Aggiorna con `setConfig({storageKey:'__prev__', ...tempValues})` + `pc.hass = this._h`

---

## 4. Popup "bottom sheet" (grafici, dettagli giornalieri, ecc.)

Tutti i popup devono seguire questo pattern:

```css
.nome-overlay {
  position:fixed; inset:0; z-index:99999;
  display:flex; align-items:flex-end;
  background:rgba(0,0,0,.6); backdrop-filter:blur(4px);
}
.nome-modal {
  width:100%; max-height:72vh;
  display:flex; flex-direction:column;
  background:#0a0816;
  border:1px solid rgba(COLOR,.25); border-bottom:none;
  border-radius:20px 20px 0 0;
  box-shadow:0 -12px 60px rgba(0,0,0,.7);
  animation:slideUp .22s cubic-bezier(.32,1.12,.56,1);
}
@keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
```

- Header: **identico** agli altri popup (`shdr`, `sico`, `stit`, `ssub`, `scls`)
- Bottone **X** di chiusura (`.scls`) SEMPRE presente nell'header
- Popup montato su `document.body` in un host shadow DOM separato (`_histModalHost`, `_dayModalHost`)
- **Scrollbar SEMPRE nascosta** nel contenuto scorrevole:
  ```css
  .nome-content { overflow-y:auto; scrollbar-width:none; -ms-overflow-style:none; }
  .nome-content::-webkit-scrollbar { display:none; }
  ```

---

## 5. Grafici storici (click su entità sensore)

Ogni valore/sensore cliccabile nella card DEVE aprire un popup con il grafico delle ultime 24 ore.

Pattern HTML per i "tile" cliccabili:
```html
<div class="tile" data-a="stat"
     data-eid="${sensorEntity||weatherEntity}"
     data-attr="${sensorEntity?'':'nomeAttributo'}"
     data-lbl="Etichetta">
```

Pattern nel click handler:
```javascript
case 'stat': {
  const el = e.target.closest('[data-a="stat"]')
  if(el) this._openHistPopup(el.dataset.eid, el.dataset.attr||'', el.dataset.lbl||'Dato')
  break
}
case 'closehist': this._destroyHistModal(); break
```

`_openHistPopup(entityId, attrName, label)`:
1. Crea `_histModalHost` su `document.body`
2. Mostra "Caricamento dati…"
3. Chiama `await this._h.callApi('GET', 'history/period/...')`
4. Renderizza SVG chart (`_buildHistChart(pts, minV, maxV)`)
5. Mostra Min / Max / Attuale sopra il grafico

Stile del grafico:
- Linea: **#fbbf24** (giallo), stroke-width 1.8
- Fill: gradiente verticale giallo→trasparente
- Assi: rgba(255,255,255,.4), font-size 8-9px
- Nessuna libreria esterna — solo SVG puro

Tiles cliccabili:
```css
.tile { cursor:pointer; transition:filter .12s, transform .1s; }
.tile:hover { filter:brightness(1.25); }
.tile:active { transform:scale(.95); }
```

---

## 6. Colori e stili ricorrenti

| Elemento | Valore |
|---|---|
| Background popup | `#0a0816` |
| Border popup principale | `rgba(139,92,246,.32)` (viola) |
| Border bottom sheet | `rgba(251,191,36,.25)` (giallo) o `rgba(56,189,248,.25)` (azzurro) |
| Accento primario | `#fbbf24` |
| Testo | `#fff` (100%, sempre) |
| Placeholder input | `rgba(255,255,255,.35)` |
| Sfondo input | `rgba(255,255,255,.06)` |
| Icona `.sico` | `rgba(251,191,36,.15)` bg, `rgba(251,191,36,.3)` border, `#fbbf24` color |

---

## 7. Versioning

Ad ogni modifica significativa:
- Bumpa `/* frarik-version: X.Y */` in cima al file JS della card
- Bumpa `version: "X.Y.Z"` in `frarik-addon/config.yaml`
- Aggiungi voce in `frarik-addon/CHANGELOG.md` (il pre-push hook la verifica)
- Fai build con `npm run build` dentro `frarik-addon/`

---

## 8. Entità e configurazione

- Ogni card ha `storageKey` per localStorage: `nomecardtype:${storageKey}`
- `_saveStore()` / `_loadStore()` — pattern già in MeteoCard
- Preview card usa `storageKey:'__prev__'` per non sovrascrivere i dati reali
- Slider Altezza/Larghezza salvati in `_c.cardScale` e `_c.cardW`

---

## 9. main.js — handler frarik-card-layout

Il listener in main.js gestisce `{cardId, cardScale, cardW}`:
- `cardScale`: applica `zoom: X%` su `#card-{cardId}`
- `cardW`: applica `width: X%; max-width: X%` su `#card-{cardId}`
- Salva in `card.cardScale` / `card.cardW` e chiama `saveCfg()`
- `buildCard()` ripristina entrambi al reload

La funzione corretta per salvare è **`saveCfg()`** (NON `saveData` che non esiste).
