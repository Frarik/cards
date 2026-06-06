# Catalogo card del repo (auto-generato)

> ⚠️ **File generato automaticamente** da `scripts/build-card-catalog.mjs` — non modificarlo a mano.
> Rigenera con: `node scripts/build-card-catalog.mjs`
> Ultima generazione: 2026-06-06 · Card trovate: 6

Questo catalogo elenca le card realmente presenti nel repo e i pattern/API che usano.
Serve come **riferimento vivo**: quando si crea una nuova card si possono leggere quelle
esistenti (in `card-js/`, `card-chips/`, `card-distintivi/`) per riusarne stile e tecniche.

## Riepilogo

| Cartella | File | ID | Nome | Versione | Formato |
|---|---|---|---|---|---|
| card-js | `antizanzare-card.js` | `antizanzare-card` | Anti Zanzare | — | Lovelace |
| card-js | `differenziata-card.js` | `differenziata-card` | Raccolta Differenziata | — | Lovelace |
| card-js | `irrigazione-card.js` | `irrigazione-card` | Irrigazione Smart | — | Lovelace |
| card-js | `macchina-card.js` | `macchina-card` | Centro Controllo Ford Puma | — | Lovelace |
| card-js | `meteo-card.js` | `meteo-card` | Meteo + Previsioni | — | Lovelace |
| card-js | `person-card.js` | `person-card` | 👤 Persona | 1.0.0 | FratechStore |

## Dettaglio

### Anti Zanzare  ·  `antizanzare-card.js`
- **ID:** `antizanzare-card` · **versione:** — · **formato:** Lovelace
- **Descrizione:** Controllo sistema anti zanzare: schedule, timer, statistiche mensili.
- **Hooks:** — · **righe:** 734
- **Pattern/API usati:** hass completo (Lovelace) · grafica SVG inline · timer · interazione (listener)

### Raccolta Differenziata  ·  `differenziata-card.js`
- **ID:** `differenziata-card` · **versione:** — · **formato:** Lovelace
- **Descrizione:** Bidoni, programmazione settimanale, notifiche push e Alexa.
- **Hooks:** — · **righe:** 433
- **Pattern/API usati:** hass completo (Lovelace) · grafica SVG inline · interazione (listener)

### Irrigazione Smart  ·  `irrigazione-card.js`
- **ID:** `irrigazione-card` · **versione:** — · **formato:** Lovelace
- **Descrizione:** Controllo irrigazione: schedule, timer animato, meteo e storico settimanale.
- **Hooks:** — · **righe:** 902
- **Pattern/API usati:** hass completo (Lovelace) · grafica SVG inline · timer · interazione (listener)

### Centro Controllo Ford Puma  ·  `macchina-card.js`
- **ID:** `macchina-card` · **versione:** — · **formato:** Lovelace
- **Descrizione:** Controllo completo Ford Puma con Wallbox.
- **Hooks:** — · **righe:** 844
- **Pattern/API usati:** hass completo (Lovelace) · grafica SVG inline · interazione (listener)

### Meteo + Previsioni  ·  `meteo-card.js`
- **ID:** `meteo-card` · **versione:** — · **formato:** Lovelace
- **Descrizione:** Card meteo con previsioni 5 giorni, tema notte/giorno e impostazioni inline.
- **Hooks:** — · **righe:** 609
- **Pattern/API usati:** grafica SVG inline · timer · interazione (listener) · popup/overlay

### 👤 Persona  ·  `person-card.js`
- **ID:** `person-card` · **versione:** 1.0.0 · **formato:** FratechStore
- **Descrizione:** Foto persona, stato zona colorato, mappa live e storico spostamenti 24h. Entità configurabili.
- **Hooks:** mount, update · **righe:** 388
- **Pattern/API usati:** timer · interazione (listener) · mappa Leaflet · popup/overlay

---
_Per le regole e i template di creazione vedi `CREAZIONE-CARD.md` in questa cartella._
