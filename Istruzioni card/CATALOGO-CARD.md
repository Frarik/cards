# Catalogo card del repo (auto-generato)

> ⚠️ **File generato automaticamente** da `scripts/build-card-catalog.mjs` — non modificarlo a mano.
> Rigenera con: `node scripts/build-card-catalog.mjs`
> Ultima generazione: 2026-06-12 · Card trovate: 10

Questo catalogo elenca le card realmente presenti nel repo e i pattern/API che usano.
Serve come **riferimento vivo**: quando si crea una nuova card si possono leggere quelle
esistenti (in `card-js/`, `card-chips/`, `card-distintivi/`) per riusarne stile e tecniche.

## Riepilogo

| Cartella | File | ID | Nome | Versione | Formato |
|---|---|---|---|---|---|
| card-js | `Antizanzare.js` | `antizanzare-card` | Anti Zanzare | 1.5 | Lovelace |
| card-js | `Camera.js` | `camera-card` | 📷 Telecamere | 1.6 | FratechStore |
| card-js | `Clima.js` | `clima-card` | ❄️ Climatizzatore | 2.14 | FratechStore |
| card-js | `Differenziata.js` | `differenziata-card` | Raccolta Differenziata | 1.0 | Lovelace |
| card-js | `DoorsWindows.js` | `doors-windows` | 🚪 Porte e Finestre | 1.1 | FratechStore |
| card-js | `Irrigazione.js` | `irrigazione-card` | Irrigazione Smart | 1.0 | Lovelace |
| card-js | `Meteo.js` | `meteo-card` | Meteo + Previsioni | — | Lovelace |
| card-js | `person-card.js` | `person-card` | 👤 Persona | 1.19 | FratechStore |
| card-js | `System.js` | `system-card` | 🖥️ Sistema | 4.1 | FratechStore |
| card-js | `Tapparella.js` | `tapparella` | 🪟 Tapparella | 4.4 | FratechStore |

## Dettaglio

### Anti Zanzare  ·  `Antizanzare.js`
- **ID:** `antizanzare-card` · **versione:** 1.5 · **formato:** Lovelace
- **Descrizione:** Controllo sistema anti zanzare: schedule, timer, statistiche mensili.
- **Hooks:** — · **righe:** 734
- **Pattern/API usati:** hass completo (Lovelace) · grafica SVG inline · timer · interazione (listener)

### 📷 Telecamere  ·  `Camera.js`
- **ID:** `camera-card` · **versione:** 1.6 · **formato:** FratechStore
- **Descrizione:** WebRTC (go2rtc) + MJPEG in parallelo. Click istantaneo, fallback snapshot 2s.
- **Hooks:** mount, update · **righe:** 576
- **Pattern/API usati:** timer · interazione (listener) · popup/overlay

### ❄️ Climatizzatore  ·  `Clima.js`
- **ID:** `clima-card` · **versione:** 2.14 · **formato:** FratechStore
- **Descrizione:** Split — look scuro, SVG loghi reali, aletta RAF, glow modalità.
- **Hooks:** mount, update · **righe:** 716
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · popup/overlay

### Raccolta Differenziata  ·  `Differenziata.js`
- **ID:** `differenziata-card` · **versione:** 1.0 · **formato:** Lovelace
- **Descrizione:** Bidoni, programmazione settimanale, notifiche push e Alexa.
- **Hooks:** — · **righe:** 433
- **Pattern/API usati:** hass completo (Lovelace) · grafica SVG inline · interazione (listener)

### 🚪 Porte e Finestre  ·  `DoorsWindows.js`
- **ID:** `doors-windows` · **versione:** 1.1 · **formato:** FratechStore
- **Descrizione:** Sensori apertura (porte/finestre/garage) auto-rilevati: quanti aperti, da quanto,
- **Hooks:** mount, update · **righe:** 180
- **Pattern/API usati:** timer · interazione (listener) · auto-scoperta device_class · popup/overlay

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
- **ID:** `person-card` · **versione:** 1.19 · **formato:** FratechStore
- **Descrizione:** Foto persona + tracker, sfondo Google Maps live, stato zona colorato e storico 24h. Contenuto che scala con la dimensione della card.
- **Hooks:** mount, update · **righe:** 445
- **Pattern/API usati:** timer · interazione (listener) · mappa Leaflet · popup/overlay

### 🖥️ Sistema  ·  `System.js`
- **ID:** `system-card` · **versione:** 4.1 · **formato:** FratechStore
- **Descrizione:** Mini PC / Server: ring con glow, barra salute, badge stato, valori assoluti GB, sparkline EKG, rete doppia linea, I/O disco, temp con indicatore.
- **Hooks:** mount, update · **righe:** 457
- **Pattern/API usati:** grafica SVG inline · timer · interazione (listener) · popup/overlay

### 🪟 Tapparella  ·  `Tapparella.js`
- **ID:** `tapparella` · **versione:** 4.4 · **formato:** FratechStore
- **Descrizione:** Tapparella finestra a stecche
- **Hooks:** mount, update · **righe:** 722
- **Pattern/API usati:** callSvc (chiama servizi HA) · timer · interazione (listener) · popup/overlay

---
_Per le regole e i template di creazione vedi `CREAZIONE-CARD.md` in questa cartella._
