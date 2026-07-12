# Catalogo card del repo (auto-generato)

> ⚠️ **File generato automaticamente** da `scripts/build-card-catalog.mjs` — non modificarlo a mano.
> Rigenera con: `node scripts/build-card-catalog.mjs`
> Ultima generazione: 2026-07-12 · Card trovate: 36

Questo catalogo elenca le card realmente presenti nel repo e i pattern/API che usano.
Serve come **riferimento vivo**: quando si crea una nuova card si possono leggere quelle
esistenti (in `card-js/`, `card-chips/`, `card-distintivi/`) per riusarne stile e tecniche.

## Riepilogo

| Cartella | File | ID | Nome | Versione | Formato |
|---|---|---|---|---|---|
| card-distintivi | `GruppoAllarme.js` | `GruppoAllarme` | 🔒 Gruppo Allarme | 2.2 | FratechStore |
| card-distintivi | `GruppoBatterie.js` | `GruppoBatterie` | 🔋 Gruppo Batterie | 1.7 | FratechStore |
| card-distintivi | `GruppoClima.js` | `GruppoClima` | 📡 Gruppo Clima | 1.4 | FratechStore |
| card-distintivi | `GruppoEnergia.js` | `GruppoEnergia` | ⚡ Gruppo Energia | 4.0 | FratechStore |
| card-distintivi | `GruppoFinestre.js` | `GruppoFinestre` | 🤖 Gruppo Finestre | 2.2 | FratechStore |
| card-distintivi | `GruppoLuci.js` | `GruppoLuci` | 🤖 Gruppo Luci | 1.8 | FratechStore |
| card-distintivi | `GruppoPorte.js` | `GruppoPorte` | 🤖 Gruppo Porte | 2.2 | FratechStore |
| card-distintivi | `GruppoPrese.js` | `GruppoPrese` | 📡 Gruppo Prese | 1.22 | FratechStore |
| card-distintivi | `GruppoTapparelle.js` | `GruppoTapparelle` | 🤖 Gruppo Tapparelle | 2.0 | FratechStore |
| card-distintivi | `GruppoTemperatura.js` | `GruppoTemperatura` | 🌡️ Gruppo Temperatura | 1.9.2 | FratechStore |
| card-js | `Clima.js` | `__clmprev__` | ❄️ Climatizzatore | 2.21 | FratechStore |
| card-js | `Camera.js` | `__prev__` | 📷 Telecamere | 1.10 | FratechStore |
| card-js | `DoorsWindows.js` | `__prev__` | 🚪 Porte e Finestre | 1.1 | FratechStore |
| card-js | `person-card.js` | `__prev__` | 👤 Persona | 1.11 | FratechStore |
| card-js | `Antizanzare.js` | `antizanzare` | 🦟 Anti Zanzare Lunedì | 2.34 | FratechStore |
| card-js | `Asciugatrice.js` | `asciugatrice` | 💨 frarik/frarik_asciugatrice.yaml | 2.2 | FratechStore |
| card-js | `Bolletta.js` | `bolletta` | ⚡ frarik/frarik_bolletta.yaml | 5.3 | FratechStore |
| card-js | `database-card.js` | `database-card` | 🗄️ Database HA | 2.3 | FratechStore |
| card-js | `Forno.js` | `forno` | 🥘 frarik/frarik_forno.yaml | 2.2 | FratechStore |
| card-js | `Friggitrice.js` | `friggitrice` | 🍟 frarik/frarik_friggitrice.yaml | 2.2 | FratechStore |
| card-js | `Frigorifero.js` | `frigorifero` | 🧊 frarik/frarik_frigorifero.yaml | 2.2 | FratechStore |
| card-js | `Induzione.js` | `induzione` | 🍳 frarik/frarik_induzione.yaml | 2.2 | FratechStore |
| card-js | `Irrigazione.js` | `irrigazione` | 💧 Irrigazione Smart | 1.0 | FratechStore |
| card-js | `Lavastoviglie.js` | `lavastoviglie` | 🍽 frarik/frarik_lavastoviglie.yaml | 2.2 | FratechStore |
| card-js | `Lavatrice.js` | `lavatrice` | 🫧 frarik/frarik_lavatrice.yaml | 2.2 | FratechStore |
| card-js | `Meteo.js` | `meteo-card` | 🌧️ Meteo + Previsioni | — | Lovelace |
| card-js | `Microonde.js` | `microonde` | 📡 frarik/frarik_microonde.yaml | 2.2 | FratechStore |
| card-js | `Montalatte.js` | `montalatte` | 🥛 frarik/frarik_montalatte.yaml | 2.3 | FratechStore |
| card-js | `system-card.js` | `notif` | 🖥️ Server — Soglia Temperatura Alert | 2.8 | FratechStore |
| card-js | `posta-card.js` | `posta-card` | {{ Posta — Consegne Oggi | 2.0 | Lovelace |
| card-js | `Scaldabagno.js` | `scaldabagno` | 🛁 frarik/frarik_scaldabagno.yaml | 2.2 | FratechStore |
| card-js | `speedtest-card.js` | `speedtest-card` | 🌐 Speedtest | 1.0 | FratechStore |
| card-js | `Tapparella.js` | `tapparella` | 🪟 Tapparella | 4.4 | FratechStore |
| card-js | `Tostapane.js` | `tostapane` | 🍞 frarik/frarik_tostapane.yaml | 2.3 | FratechStore |
| card-js | `Differenziata.js` | `umido` | mdi:recycle Differenziata — Rifiuto Lunedì | 2.0 | FratechStore |
| card-js | `ups-card.js` | `ups-card` | 🔋 UPS | 1.2 | FratechStore |

## Dettaglio

### 🔒 Gruppo Allarme  ·  `GruppoAllarme.js`
- **ID:** `GruppoAllarme` · **versione:** 2.2 · **formato:** FratechStore
- **Hooks:** mount, update · **righe:** 719
- **Pattern/API usati:** callSvc (chiama servizi HA) · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🔋 Gruppo Batterie  ·  `GruppoBatterie.js`
- **ID:** `GruppoBatterie` · **versione:** 1.7 · **formato:** FratechStore
- **Hooks:** mount, update · **righe:** 360
- **Pattern/API usati:** timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 📡 Gruppo Clima  ·  `GruppoClima.js`
- **ID:** `GruppoClima` · **versione:** 1.4 · **formato:** FratechStore
- **Descrizione:** Chip climi attivi. Clic → temp/umidità da sensore, ±1°, ON/OFF, modalità HVAC, ventola, alette per ogni clima.
- **Hooks:** mount, update · **righe:** 809
- **Pattern/API usati:** callSvc (chiama servizi HA) · timer · interazione (listener) · popup/overlay

### ⚡ Gruppo Energia  ·  `GruppoEnergia.js`
- **ID:** `GruppoEnergia` · **versione:** 4.0 · **formato:** FratechStore
- **Hooks:** mount, update · **righe:** 716
- **Pattern/API usati:** grafica SVG inline · timer · interazione (listener) · popup/overlay

### 🤖 Gruppo Finestre  ·  `GruppoFinestre.js`
- **ID:** `GruppoFinestre` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Chip con contatore finestre aperte. Clic → stato Aperta/Chiusa per ogni finestra.
- **Hooks:** mount, update · **righe:** 544
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · popup/overlay

### 🤖 Gruppo Luci  ·  `GruppoLuci.js`
- **ID:** `GruppoLuci` · **versione:** 1.8 · **formato:** FratechStore
- **Descrizione:** Chip con contatore luci accese. Clic → pannello toggle + Accendi/Spegni tutte.
- **Hooks:** mount, update · **righe:** 548
- **Pattern/API usati:** callSvc (chiama servizi HA) · timer · interazione (listener) · popup/overlay

### 🤖 Gruppo Porte  ·  `GruppoPorte.js`
- **ID:** `GruppoPorte` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Chip con contatore porte aperte. Clic → stato Aperta/Chiusa per ogni porta.
- **Hooks:** mount, update · **righe:** 537
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · popup/overlay

### 📡 Gruppo Prese  ·  `GruppoPrese.js`
- **ID:** `GruppoPrese` · **versione:** 1.22 · **formato:** FratechStore
- **Descrizione:** Chip prese on/off · popup con stato, consumo W real-time, flusso animato e indicatori unavailable.
- **Hooks:** mount, update · **righe:** 844
- **Pattern/API usati:** callSvc (chiama servizi HA) · timer · interazione (listener) · popup/overlay

### 🤖 Gruppo Tapparelle  ·  `GruppoTapparelle.js`
- **ID:** `GruppoTapparelle` · **versione:** 2.0 · **formato:** FratechStore
- **Descrizione:** Chip con contatore + posizione media. Popup: Apri/Stop/Chiudi, preset 25/50/75%, slider posizione per entità.
- **Hooks:** mount, update · **righe:** 554
- **Pattern/API usati:** callSvc (chiama servizi HA) · timer · interazione (listener) · popup/overlay

### 🌡️ Gruppo Temperatura  ·  `GruppoTemperatura.js`
- **ID:** `GruppoTemperatura` · **versione:** 1.9.2 · **formato:** FratechStore
- **Descrizione:** Chip con media temp/umidità; popup weather-style con hero, consigli e righe stanza.
- **Hooks:** mount, update · **righe:** 861
- **Pattern/API usati:** grafica SVG inline · timer · interazione (listener) · popup/overlay

### ❄️ Climatizzatore  ·  `Clima.js`
- **ID:** `__clmprev__` · **versione:** 2.21 · **formato:** FratechStore
- **Descrizione:** Split — tema visivo selezionabile (Moderno/Futuristico/Classico/Minimal), aletta RAF, glow modalità.
- **Hooks:** mount, update · **righe:** 1250
- **Pattern/API usati:** callSvc (chiama servizi HA) · Chart.js · grafica SVG inline · timer · interazione (listener) · popup/overlay

### 📷 Telecamere  ·  `Camera.js`
- **ID:** `__prev__` · **versione:** 1.10 · **formato:** FratechStore
- **Descrizione:** WebRTC (go2rtc) + MJPEG in parallelo. Click istantaneo, fallback snapshot 2s.
- **Hooks:** mount, update · **righe:** 643
- **Pattern/API usati:** timer · interazione (listener) · popup/overlay

### 🚪 Porte e Finestre  ·  `DoorsWindows.js`
- **ID:** `__prev__` · **versione:** 1.1 · **formato:** FratechStore
- **Descrizione:** Sensori apertura (porte/finestre/garage) auto-rilevati: quanti aperti, da quanto,
- **Hooks:** mount, update · **righe:** 216
- **Pattern/API usati:** timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 👤 Persona  ·  `person-card.js`
- **ID:** `__prev__` · **versione:** 1.11 · **formato:** FratechStore
- **Descrizione:** Foto persona + tracker, sfondo Google Maps live, stato zona colorato e storico 24h. Contenuto che scala con la dimensione della card.
- **Hooks:** mount, update · **righe:** 485
- **Pattern/API usati:** timer · interazione (listener) · mappa Leaflet · popup/overlay

### 🦟 Anti Zanzare Lunedì  ·  `Antizanzare.js`
- **ID:** `antizanzare` · **versione:** 2.34 · **formato:** FratechStore
- **Descrizione:** Controllo sistema anti zanzare: schedule settimanale, timer, statistiche mensili, blocco meteo, sensori sicurezza.
- **Hooks:** — · **righe:** 5042
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · popup/overlay

### 💨 frarik/frarik_asciugatrice.yaml  ·  `Asciugatrice.js`
- **ID:** `asciugatrice` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Monitoraggio resistenza, cicli, energia e costi. Richiede PKG Centro Controllo Asciugatrice.
- **Hooks:** mount, update · **righe:** 1675
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### ⚡ frarik/frarik_bolletta.yaml  ·  `Bolletta.js`
- **ID:** `bolletta` · **versione:** 5.3 · **formato:** FratechStore
- **Descrizione:** Monitoraggio consumi, costi e previsioni bolletta elettrica. Richiede PKG Frarik Bolletta.
- **Hooks:** mount, update · **righe:** 878
- **Pattern/API usati:** callSvc (chiama servizi HA) · timer · interazione (listener) · popup/overlay

### 🗄️ Database HA  ·  `database-card.js`
- **ID:** `database-card` · **versione:** 2.3 · **formato:** FratechStore
- **Descrizione:** Monitoraggio database HA: dimensione, repack automatico, statistiche.
- **Hooks:** mount, update · **righe:** 451
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · popup/overlay

### 🥘 frarik/frarik_forno.yaml  ·  `Forno.js`
- **ID:** `forno` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Monitoraggio resistenza, cicli, energia e costi. Richiede PKG Centro Controllo Forno.
- **Hooks:** mount, update · **righe:** 1628
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🍟 frarik/frarik_friggitrice.yaml  ·  `Friggitrice.js`
- **ID:** `friggitrice` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Monitoraggio resistenza, cicli, energia e costi. Richiede PKG Centro Controllo Friggitrice.
- **Hooks:** mount, update · **righe:** 1637
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🧊 frarik/frarik_frigorifero.yaml  ·  `Frigorifero.js`
- **ID:** `frigorifero` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Monitoraggio compressore, cicli, energia e costi. Richiede PKG Centro Controllo Frigorifero.
- **Hooks:** mount, update · **righe:** 1629
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🍳 frarik/frarik_induzione.yaml  ·  `Induzione.js`
- **ID:** `induzione` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Monitoraggio piano induzione, cicli, energia e costi. Richiede PKG Centro Controllo Induzione.
- **Hooks:** mount, update · **righe:** 1642
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 💧 Irrigazione Smart  ·  `Irrigazione.js`
- **ID:** `irrigazione` · **versione:** 1.0 · **formato:** FratechStore
- **Descrizione:** Controllo irrigazione: schedule, timer animato, meteo e storico settimanale.
- **Hooks:** — · **righe:** 2386
- **Pattern/API usati:** callSvc (chiama servizi HA) · hass completo (Lovelace) · grafica SVG inline · timer · interazione (listener) · popup/overlay

### 🍽 frarik/frarik_lavastoviglie.yaml  ·  `Lavastoviglie.js`
- **ID:** `lavastoviglie` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Monitoraggio pompa, cicli, energia e costi. Richiede PKG Centro Controllo Lavastoviglie.
- **Hooks:** mount, update · **righe:** 1632
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🫧 frarik/frarik_lavatrice.yaml  ·  `Lavatrice.js`
- **ID:** `lavatrice` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Monitoraggio motore, cicli, energia e costi. Richiede PKG Centro Controllo Lavatrice.
- **Hooks:** mount, update · **righe:** 1677
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🌧️ Meteo + Previsioni  ·  `Meteo.js`
- **ID:** `meteo-card` · **versione:** — · **formato:** Lovelace
- **Descrizione:** Card meteo con cielo animato, sole/luna in tempo reale, fasi lunari, pioggia, neve, fulmini.
- **Hooks:** — · **righe:** 2269
- **Pattern/API usati:** Chart.js · grafica SVG inline · timer · interazione (listener) · popup/overlay

### 📡 frarik/frarik_microonde.yaml  ·  `Microonde.js`
- **ID:** `microonde` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Monitoraggio magnetron, cicli, energia e costi. Richiede PKG Centro Controllo Microonde.
- **Hooks:** mount, update · **righe:** 1660
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🥛 frarik/frarik_montalatte.yaml  ·  `Montalatte.js`
- **ID:** `montalatte` · **versione:** 2.3 · **formato:** FratechStore
- **Descrizione:** Monitoraggio riscaldatore, cicli, energia e costi. Richiede PKG Centro Controllo Montalatte.
- **Hooks:** mount, update · **righe:** 1349
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🖥️ Server — Soglia Temperatura Alert  ·  `system-card.js`
- **ID:** `notif` · **versione:** 2.8 · **formato:** FratechStore
- **Descrizione:** Gestisce tutti gli eventi del Centro Controllo Server
- **Hooks:** mount, update · **righe:** 2314
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### {{ Posta — Consegne Oggi  ·  `posta-card.js`
- **ID:** `posta-card` · **versione:** 2.0 · **formato:** Lovelace
- **Descrizione:** Rileva arrivo posta, aggiorna contatori e invia notifiche
- **Hooks:** — · **righe:** 1308
- **Pattern/API usati:** grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🛁 frarik/frarik_scaldabagno.yaml  ·  `Scaldabagno.js`
- **ID:** `scaldabagno` · **versione:** 2.2 · **formato:** FratechStore
- **Descrizione:** Scaldabagno elettrico — temperatura acqua, riscaldamento, consumo, energia e costi.
- **Hooks:** mount, update · **righe:** 1553
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### 🌐 Speedtest  ·  `speedtest-card.js`
- **ID:** `speedtest-card` · **versione:** 1.0 · **formato:** FratechStore
- **Descrizione:** Monitoraggio connessione internet: download, upload, ping, jitter e bufferbloat. Richiede integrazione Ookla Speedtest.
- **Hooks:** mount, update · **righe:** 436
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · popup/overlay

### 🪟 Tapparella  ·  `Tapparella.js`
- **ID:** `tapparella` · **versione:** 4.4 · **formato:** FratechStore
- **Descrizione:** Tapparella finestra a stecche
- **Hooks:** mount, update · **righe:** 778
- **Pattern/API usati:** callSvc (chiama servizi HA) · timer · interazione (listener) · popup/overlay

### 🍞 frarik/frarik_tostapane.yaml  ·  `Tostapane.js`
- **ID:** `tostapane` · **versione:** 2.3 · **formato:** FratechStore
- **Descrizione:** Monitoraggio resistenza, cicli tostatura, energia e costi. Richiede PKG Centro Controllo Tostapane.
- **Hooks:** mount, update · **righe:** 1198
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · auto-scoperta device_class · popup/overlay

### mdi:recycle Differenziata — Rifiuto Lunedì  ·  `Differenziata.js`
- **ID:** `umido` · **versione:** 2.0 · **formato:** FratechStore
- **Descrizione:** Notifica giornaliera rifiuti da buttare
- **Hooks:** mount, update · **righe:** 981
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · popup/overlay

### 🔋 UPS  ·  `ups-card.js`
- **ID:** `ups-card` · **versione:** 1.2 · **formato:** FratechStore
- **Descrizione:** Monitoraggio UPS: batteria, carico, tensioni, storico blackout e notifiche push. Richiede PKG UPS Tecnoware.
- **Hooks:** mount, update · **righe:** 549
- **Pattern/API usati:** callSvc (chiama servizi HA) · grafica SVG inline · timer · interazione (listener) · popup/overlay

---
_Per le regole e i template di creazione vedi `CREAZIONE-CARD.md` in questa cartella._
