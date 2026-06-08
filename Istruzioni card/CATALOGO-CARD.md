# Catalogo card del repo (auto-generato)

> ⚠️ **File generato automaticamente** da `scripts/build-card-catalog.mjs` — non modificarlo a mano.
> Rigenera con: `node scripts/build-card-catalog.mjs`
> Ultima generazione: 2026-06-08 · Card trovate: 5

Questo catalogo elenca le card realmente presenti nel repo e i pattern/API che usano.
Serve come **riferimento vivo**: quando si crea una nuova card si possono leggere quelle
esistenti (in `card-js/`, `card-chips/`, `card-distintivi/`) per riusarne stile e tecniche.

## Riepilogo

| Cartella | File | ID | Nome | Versione | Formato |
|---|---|---|---|---|---|
| card-js | `Antizanzare.js` | `antizanzare-card` | Anti Zanzare | 1.5 | Lovelace |
| card-js | `Differenziata.js` | `differenziata-card` | Raccolta Differenziata | 1.0 | Lovelace |
| card-js | `Irrigazione.js` | `irrigazione-card` | Irrigazione Smart | 1.0 | Lovelace |
| card-js | `Meteo.js` | `meteo-card` | Meteo + Previsioni | — | Lovelace |
| card-js | `person-card.js` | `person-card` | 👤 Persona | 1.15 | FratechStore |

## Dettaglio

### Anti Zanzare  ·  `Antizanzare.js`
- **ID:** `antizanzare-card` · **versione:** 1.5 · **formato:** Lovelace
- **Descrizione:** Controllo sistema anti zanzare: schedule, timer, statistiche mensili.
- **Hooks:** — · **righe:** 734
- **Pattern/API usati:** hass completo (Lovelace) · grafica SVG inline · timer · interazione (listener)

### Raccolta Differenziata  ·  `Differenziata.js`
- **ID:** `differenziata-card` · **versione:** 1.0 · **formato:** Lovelace
- **Descrizione:** Bidoni, programmazione settimanale, notifiche push e Alexa.
- **Hooks:** — · **righe:** 433
- **Pattern/API usati:** hass completo (Lovelace) · grafica SVG inline · interazione (listener)

### Irrigazione Smart  ·  `Irrigazione.js`
- **ID:** `irrigazione-card` · **versione:** 1.0 · **formato:** Lovelace
- **Descrizione:** Controllo irrigazione: schedule, timer animato, meteo e storico settimanale.
- **Hooks:** — · **righe:** 902
- **Pattern/API usati:** hass completo (Lovelace) · grafica SVG inline · timer · interazione (listener)

### Meteo + Previsioni  ·  `Meteo.js`
- **ID:** `meteo-card` · **versione:** — · **formato:** Lovelace
- **Descrizione:** Card meteo con previsioni 5 giorni, tema notte/giorno e impostazioni inline.
- **Hooks:** — · **righe:** 610
- **Pattern/API usati:** grafica SVG inline · timer · interazione (listener) · popup/overlay

### 👤 Persona  ·  `person-card.js`
- **ID:** `person-card` · **versione:** 1.15 · **formato:** FratechStore
- **Descrizione:** Foto persona + tracker, sfondo Google Maps live, stato zona colorato e storico 24h. Contenuto che scala con la dimensione della card.
- **Hooks:** mount, update · **righe:** 387
- **Pattern/API usati:** timer · interazione (listener) · mappa Leaflet · popup/overlay

---
_Per le regole e i template di creazione vedi `CREAZIONE-CARD.md` in questa cartella._
