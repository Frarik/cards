# Creazione card JS per Frarik Dashboard / FratechStore

Guida unica e autorevole per creare card JavaScript per la **Frarik Dashboard**.
Questo file è la **base di riferimento**: quando si chiede all'assistente «creami una card»,
deve leggere questo documento e seguirne le regole e i template.

> ℹ️ Le sezioni «Altre soluzioni» in fondo raccolgono pattern aggiuntivi: vanno
> aggiornate man mano (incollare qui i contenuti del file esterno con le soluzioni).

---

## 1. I due formati supportati

La dashboard sa eseguire **due** tipi di file `.js`:

| Formato | Quando usarlo | Come si registra |
|---|---|---|
| **FratechStore** (consigliato) | Card semplici/medie: display di stato, mini-grafici, pulsanti, layout custom. È il formato nativo, più leggero e veloce. | `window.FratechCardRegistry[CARD.id] = CARD` |
| **Lovelace** (avanzato) | Card complesse che servono l'oggetto `hass` completo di Home Assistant (chiamate servizi ricche, attributi, websocket, mappe meteo, ecc.). | `customElements.define('tag', Classe)` + `window.customCards.push(...)` |

Regola pratica: **parti sempre dal formato FratechStore.** Passa al Lovelace solo se
ti serve l'`hass` completo (attributi entità, `callService`, websocket).

---

## 2. Formato FratechStore — template ufficiale

Salva il file con lo **stesso nome dell'`id`** (es. `id: 'bolletta-card'` → file `bolletta-card.js`).

```js
/**
 * FratechCard — Template
 * Nome file = id della card (es: bolletta-card.js)
 */
(function () {
  'use strict';

  const CARD = {
    id:      'mia-card',      // ID univoco: solo a-z, 0-9, trattino. = nome file
    name:    'La Mia Card',   // Nome mostrato nello store
    icon:    '🎯',            // Emoji o 'mdi:nome-icona'
    version: '1.0.0',         // Versione (vedi §6: la dashboard la incrementa da sola)
    desc:    'Descrizione breve mostrata nello store',

    /**
     * render(card, hass) → STRINGA HTML
     * Chiamata al primo inserimento e ad ogni rebuild della dashboard.
     *   card  = configurazione dell'istanza (card.entity, card.color, card.label, …)
     *   hass  = { states: { 'sensor.x': '42', 'light.y': 'on', … } }   (può essere null)
     *           ATTENZIONE: hass.states[id] è una STRINGA (lo stato), non un oggetto.
     */
    render(card, hass) {
      const val = (hass && hass.states && hass.states[card.entity]) ?? '—';
      return `
        <div style="display:flex;flex-direction:column;align-items:center;
                    justify-content:center;height:100%;gap:8px">
          <div style="font-size:40px">${this.icon}</div>
          <div style="font-size:28px;font-weight:900;color:${card.color || '#818cf8'}">${val}</div>
          <div style="font-size:11px;opacity:.5">${card.label || this.name}</div>
        </div>`;
    },

    /**
     * mount(card, hass, el)  — OPZIONALE
     * Chiamata UNA volta dopo che render() è stato inserito nel DOM.
     * Usala per: attaccare event listener, inizializzare mappe/grafici, timer.
     *   el = elemento contenitore (l'HTML di render() è già dentro).
     */
    mount(card, hass, el) {
      el.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          const act = btn.getAttribute('data-act');
          // esempio: toggle di una luce (vedi §4 per le interazioni)
          if (act === 'toggle' && card.entity) frarikCallService('homeassistant', 'toggle', { entity_id: card.entity });
        });
      });
    },

    /**
     * update(card, hass, el)  — OPZIONALE
     * Chiamata periodicamente e ad ogni cambio stato. Aggiornamento "live".
     * Se NON la implementi, la dashboard richiama render() e sostituisce l'innerHTML.
     * Implementala per aggiornare solo le parti che cambiano (più fluido, niente flicker).
     */
    update(card, hass, el) {
      const val = (hass && hass.states && hass.states[card.entity]) ?? '—';
      const out = el.querySelector('.val');
      if (out) out.textContent = val; else el.innerHTML = this.render(card, hass);
    }
  };

  /* ── Registrazione (NON modificare) ── */
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
  try { console.log('[FratechStore] Card registrata:', CARD.id, 'v' + CARD.version); } catch (e) {}
})();
```

### API FratechStore in breve
- **`render(card, hass)`** → ritorna una **stringa HTML**. Obbligatoria.
- **`mount(card, hass, el)`** → opzionale, listener/init dopo il primo render.
- **`update(card, hass, el)`** → opzionale, refresh live. Senza, viene rifatto `render()`.
- **`hass.states['entity_id']`** = **stringa** dello stato (`'on'`, `'23.5'`, `'locked'`).
  Per leggere gli **attributi** di un'entità usa `frarikEntity('sensor.x')` (vedi §4).
- **`card`** = oggetto configurazione dell'istanza. Campi tipici: `card.entity`,
  `card.label`, `card.color`, `card.icon`, più qualunque campo custom impostato
  dall'editor della card.

---

## 3. Formato Lovelace — per card avanzate

Usalo solo se ti serve l'`hass` completo di Home Assistant. La dashboard imposta
`element.hass = <hass completo>` ad ogni aggiornamento, e con `hass.states[id]` ottieni
l'**oggetto** `{ state, attributes, … }` (non la sola stringa).

```js
class MiaCardAvanzata extends HTMLElement {
  setConfig(config) { this._config = config; }           // chiamata con la config YAML/oggetto
  set hass(hass) {                                       // chiamata ad ogni aggiornamento stato
    this._hass = hass;
    const eid = this._config.entity;
    const st  = hass.states[eid];                        // OGGETTO: st.state, st.attributes
    this.innerHTML = `<div style="padding:12px">
      ${this._config.title || eid}: <b>${st ? st.state : '—'}</b>
      ${st && st.attributes.unit_of_measurement || ''}
    </div>`;
  }
  // chiamare un servizio: this._hass.callService('light','toggle',{ entity_id: eid })
  getCardSize() { return 2; }
}

// Guardia anti-doppia-registrazione (IMPORTANTE, vedi §7)
if (!customElements.get('mia-card-avanzata')) {
  customElements.define('mia-card-avanzata', MiaCardAvanzata);
}

// Metadati per lo store (push semplice, NON deferito — vedi §7)
window.customCards = window.customCards || [];
window.customCards = window.customCards.filter(c => c && c.type !== 'mia-card-avanzata');
window.customCards.push({
  type:        'mia-card-avanzata',
  name:        'Mia Card Avanzata',
  description: 'Descrizione per lo store',
  version:     '1.0.0',     // se presente, lo store la mostra
});
```

---

## 4. Interazioni: chiamare servizi e leggere attributi

Per evitare differenze tra i due formati, la dashboard espone alcuni **helper globali**
utilizzabili da qualunque card (sia FratechStore sia Lovelace):

```js
// chiamare un servizio HA
frarikCallService('light', 'turn_on', { entity_id: 'light.salotto', brightness: 200 });
frarikCallService('homeassistant', 'toggle', { entity_id: card.entity });

// leggere stato + attributi di un'entità (oggetto { entity_id, state, attributes })
const e = frarikEntity('sensor.temperatura');   // { state:'21.4', attributes:{ unit_of_measurement:'°C', … } }
const unita = e?.attributes?.unit_of_measurement || '';

// solo lo stato (stringa) di un'entità
const stato = frarikState('binary_sensor.porta');   // 'on' | 'off' | null
```

Questi tre helper — `frarikCallService(domain, service, data, target)`, `frarikEntity(id)`,
`frarikState(id)` — sono **globali** e disponibili a qualunque card, sia FratechStore sia
Lovelace. Sono il modo consigliato per interagire.

> In alternativa, nel formato **Lovelace** puoi usare `this._hass.callService(...)` e
> `this._hass.states[id]` (oggetto con `state` e `attributes`).

### Pattern click consigliato (delega eventi)
Nel render usa attributi `data-…`, nel `mount` un solo listener delegato:
```js
render(card){ return `<button data-act="toggle">Accendi/Spegni</button>`; },
mount(card, hass, el){
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'toggle') frarikCallService('homeassistant','toggle',{entity_id:card.entity});
  });
}
```

---

## 5. Regole di naming e cartelle dello store

- **Nome file = `id`** della card, in minuscolo, solo `a-z 0-9 -` (es. `meteo-card.js`).
- L'`id` deve essere **univoco** in tutto lo store.
- Le card vanno caricate su GitHub in **una** di queste cartelle (lo store le legge da lì):

| Cartella | Scheda nello store | Uso |
|---|---|---|
| `card-js/` | ⚡ Card JS | Card generiche (display, grafici, pannelli) |
| `card-chips/` | 🔹 Chips | Chip piccoli per la barra header |
| `card-distintivi/` | 🏷️ Distintivi | Badge/distintivi |
| `card-yaml/` | 📄 YAML | Config YAML (solo copia, non card JS) |
| `pkg/` | 📦 Pacchetti | Package YAML di backend |

> I file il cui nome inizia con `frarik` (es. `frarik-panel.js`) sono **esclusi**:
> sono file dell'app, non card.

---

## 6. Versionamento

- Dichiara sempre `version: '1.0.0'` nel codice (formato `x.y.z`).
- La dashboard tiene una **versione automatica per nome-file**, persistente:
  - **Caricamento manuale** (carico un `.js` dal PC): la prima volta usa la versione
    dichiarata, poi **ad ogni ricaricamento dello stesso file la patch sale**
    (1.0.0 → 1.0.1 → …).
  - **GitHub**: quando sostituisci il file sul repo (lo `sha` cambia), la patch sale
    automaticamente e arriva la notifica «Card aggiornata da vX a vY».
- Quindi **non sei obbligato** ad aggiornare a mano `version` ad ogni modifica: serve
  solo come valore di partenza/etichetta.

---

## 7. Errori comuni da evitare (checklist)

- ✅ **Guardia anti-doppia-registrazione** (solo formato Lovelace):
  `if (!customElements.get('tag')) customElements.define('tag', Classe)`.
  Ridefinire un custom element già definito lancia un errore.
- ✅ **`window.customCards.push` NON deferito**: fai il push **sincrono** subito dopo
  `define`. Evita `setTimeout(...)`: la dashboard legge `customCards`
  immediatamente dopo l'`eval`, un push ritardato può non essere visto.
- ✅ **`render()` ritorna una stringa**, non manipolare il DOM dentro `render`
  (fallo in `mount`/`update`).
- ✅ **`hass` può essere `null`**: proteggi sempre gli accessi
  (`hass && hass.states && hass.states[id]`).
- ✅ **FratechStore: `hass.states[id]` è una STRINGA.** Per gli attributi usa
  `frarikEntity(id)` (o il formato Lovelace).
- ✅ **CSS inline o `<style>` scoping**: dai classi con prefisso (es. `.mc-…`) per non
  collidere con altre card.
- ✅ **Niente dipendenze esterne** se non strettamente necessarie; se servono (es. una
  libreria mappe), caricala on-demand e una sola volta (cache su `window`).
- ✅ **Pulizia**: in `mount` salva timer/handler e ricreali in modo idempotente
  (la card può essere montata più volte).

---

## 8. Esempio completo: card «Temperatura» (FratechStore)

`temperatura-card.js`
```js
(function () {
  'use strict';
  const CARD = {
    id: 'temperatura-card',
    name: 'Temperatura',
    icon: 'mdi:thermometer',
    version: '1.0.0',
    desc: 'Mostra la temperatura di un sensore con colore dinamico.',

    render(card, hass) {
      const v = parseFloat((hass && hass.states && hass.states[card.entity]) ?? 'NaN');
      const col = isNaN(v) ? '#94a3b8' : v >= 26 ? '#f87171' : v <= 18 ? '#38bdf8' : '#4ade80';
      const txt = isNaN(v) ? '—' : v.toFixed(1) + '°';
      return `<div class="tc-wrap" style="height:100%;display:flex;flex-direction:column;
                  align-items:center;justify-content:center;gap:6px">
        <div class="tc-val" style="font-size:34px;font-weight:900;color:${col}">${txt}</div>
        <div style="font-size:11px;opacity:.6">${card.label || 'Temperatura'}</div>
      </div>`;
    },

    update(card, hass, el) {
      const v = parseFloat((hass && hass.states && hass.states[card.entity]) ?? 'NaN');
      const out = el.querySelector('.tc-val'); if (!out) return el.innerHTML = this.render(card, hass);
      const col = isNaN(v) ? '#94a3b8' : v >= 26 ? '#f87171' : v <= 18 ? '#38bdf8' : '#4ade80';
      out.textContent = isNaN(v) ? '—' : v.toFixed(1) + '°';
      out.style.color = col;
    }
  };
  window.FratechCardRegistry = window.FratechCardRegistry || {};
  window.FratechCardRegistry[CARD.id] = CARD;
})();
```

---

## 9. Flusso di pubblicazione

1. Crea/modifica il file `.js` (nome = id).
2. Caricalo nello store (Card locali → trascina/seleziona) per **provarlo** in dashboard.
3. **Pubblica** dallo store nella cartella giusta (`card-js`/`card-chips`/`card-distintivi`)
   — oppure fai `git push` del file nella cartella su GitHub.
4. Le altre dashboard riceveranno la notifica «Nuova card / Card aggiornata».

---

## 10. Altre soluzioni / pattern aggiuntivi

> *(Sezione da completare: incollare qui i contenuti del file esterno con le altre
> soluzioni. Mantenere lo stesso stile: titolo del pattern → quando usarlo → snippet.)*

- _… (da aggiungere)_
