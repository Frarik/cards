# Changelog

## 1.1.59 — 2026-06-05

### Migliorato — Impostazioni Plancia riorganizzate
- La sezione Plancia è suddivisa in sotto-menù separati, ognuno apribile per conto suo: 🎨 Aspetto, 📄 Pagina & Griglia, ⚙️ Sistema, 🔝 Icone barra in alto, ▭ Barra inferiore. Niente più tutto impilato in un unico blocco.

## 1.1.58 — 2026-06-05

### Passo 6/16 — Icone barra in alto personalizzabili
- Nuova sezione in Impostazioni (Plancia → "🎨 Icone barra in alto"): per ogni icona (sidebar, modifica, impostazioni, campanella, viste, kiosk) si può scegliere l'icona (mdi o emoji) e il colore, con anteprima e ripristino. Si sincronizza tra dispositivi (cfg.topbar).

## 1.1.57 — 2026-06-05

### Passo 5/16 — Riordino icone barra in alto
- Nuovo ordine (da destra): barra laterale HA, ✏️ modifica, ⚙️ impostazioni, 🔔 campanella, stato connessione, viste, e per ultima Kiosk (solo se attiva). Pulsante "Ricarica" spostato nel menu ⋮. Undo/Redo (solo in edit) restano a sinistra.

## 1.1.56 — 2026-06-05

### Passo 4/16 — Kiosk come scelta
- Nuovo toggle "⛶ Modalità Kiosk" nelle impostazioni (Plancia → Sistema). Se attivo, mostra l'icona schermo intero in alto; se disattivo, l'icona è nascosta (e se eri in kiosk, esce). Default: disattivato.

## 1.1.55 — 2026-06-05

### Passo 3/16 — Orologi
- Aggiunti 6 nuovi stili di orologio: Mono, Elegant, Glow, 3D, Outline, Gradient (totale 12). Selezionabili dall'editor del chip orologio con anteprima.

## 1.1.54 — 2026-06-05

### Passo 2/16 — Header: chip entità "smart"
- I chip entità dell'header ora scelgono **da soli** il controllo giusto leggendo il dominio: toggle (luci/switch/fan/input_boolean…), apri/chiudi (cover), blocca/sblocca (lock), premi/attiva (button/scene/script), popup (allarme), info (sensori e tutto il resto). Cliccabili-smart di default.
- Corretto bug runtime: `_hbSmartClick` aveva i parametri invertiti → l'azione toggle non funzionava.
- Editor header: riconoscimento dominio esteso a tutti i tipi di entità.

## 1.1.53 — 2026-06-05

### Aggiunto (passo 1/16)
- Controllo automatico nuova versione: la plancia confronta la versione installata con quella nel repo GitHub. Se è disponibile una versione più recente → notifica in campanella "⬆️ Disponibile nuova versione dashboard vX.Y.Z" e forza HA a rileggere subito lo store (l'aggiornamento compare immediatamente). Check al boot e ogni 5 minuti.

## 1.1.52 — 2026-06-05

### Corretto
- Controllo generale post-refactor: corretto pulsante "opzioni" dei chip header-bar (data-action `_hbOptionsPopupEl` non esisteva → non apriva il popup). Aggiunto wrapper + `data-action-el`.

## 1.1.44 — 2026-06-05

### Corretto
- Barra HA ingress nascosta tramite shadow DOM ricorsivo (query multi-livello)

## 1.1.43 — 2026-06-05

### Rimosso / Corretto
- Primo tentativo nascondere barra HA ingress
- Rimosso pulsante "Controlla aggiornamenti" dalle impostazioni

## 1.1.42 — 2026-06-05

### Corretto
- Rimosso pulsante "Controlla aggiornamenti" dalle impostazioni Frarik
- CHANGELOG.md aggiornato e visibile nel tab Changelog dell'add-on in HA

## 1.1.40 — 2026-06-05

### Aggiunto
- CHANGELOG.md completo dalla versione 1.0.0 → visibile nel tab Changelog dell'add-on in HA

## 1.1.39 — 2026-06-05

### Corretto
- Tutti i wrapper del refactor ora esposti su `window` (preview store, picker icone, SOS, editor libero ora funzionano)
- Guard `localeCompare` su `entity_id` null nel WebSocket handler e nel render store

## 1.1.38 — 2026-06-05

### Corretto
- Preview card nello Store (occhio 👁): risolto mancato passaggio dell'elemento al delegation
- Menu viste: navigando una pagina il menu ora si chiude correttamente (eliminati i doppi "refresh")
- `window.onerror`: aggiunto anti-cascata e rate limit (max 3 notifiche di errore ogni 10s)

## 1.1.37 — 2026-06-05

### Refactor
- **Zero handler inline** in tutto il codebase: `onclick`, `oninput`, `onchange` rimossi da tutti i template JS dinamici
- Aggiunto delegation `data-input` per tutti gli input/change nei template (badge rules, FE editor, SOS, notifiche smart)
- Creati oltre 40 wrapper JS per i casi complessi (picker icone con callback, multi-statement)

## 1.1.36 — 2026-06-05

### Refactor
- Estratti i moduli `src/utils.js` (uid, eh, ea, showToast, showConfirm) e `src/notifications.js` (intero centro notifiche) da `main.js`
- Aggiunto error feedback visibile: errori JS non gestiti e promise rejection appaiono nella campanella 🔔

## 1.1.35 — 2026-06-05

### Refactor
- Script splash screen spostato da `index.html` a `main.js`
- Aggiunto `.gitattributes`: i file HTML non contano nelle statistiche linguaggio GitHub

## 1.1.34 — 2026-06-05

### Refactor
- Tutti i `onchange` e `oninput` rimossi da `index.html`: gestiti via `addEventListener` in `_initInputHandlers()`

## 1.1.33 — 2026-06-05

### Refactor
- Tutti i `onclick` rimossi da `index.html`: zero handler inline, tutto via `data-action` delegation e `addEventListener`

## 1.1.32 — 2026-06-05

### Refactor
- Pulsanti close/cancel dei modal convertiti a `data-action` delegation

## 1.1.31 — 2026-06-05

### Refactor
- Pulsanti header (campanella, impostazioni, modifica, undo, redo…) convertiti da `onclick` a `addEventListener`

## 1.1.30 — 2026-06-05

### Corretto
- Dockerfile: `config.yaml` ora copiato nel container Docker → versione mostrata nelle impostazioni corretta

## 1.1.29 — 2026-06-05

### Aggiunto / Corretto
- Funzione `ntfClearAll` aggiunta (mancante)
- Pulsanti ✓ e 🗑 dell'header notifiche generati via JS (no onclick inline)

## 1.1.28 — 2026-06-05

### Corretto
- Endpoint `/api/frarik/version` ora con header `no-cache` e rilegge `config.yaml` ad ogni richiesta
- Fetch versione con cache-buster `?t=...`

## 1.1.27 — 2026-06-05

### Refactor
- Sistema notifiche riscritto completamente in JS puro: niente `innerHTML` con `onclick`, tutto via `createElement` + `addEventListener`

## 1.1.26 — 2026-06-05

### Corretto
- Notifica versione: appare sempre alla prima apertura dopo un aggiornamento (fix condizione `prev && prev!==cur`)

## 1.1.25 — 2026-06-05

### Corretto
- Pulsante ✕ nelle notifiche: sostituito `onclick` inline (bloccabile da CSP) con event delegation
- Notifica aggiornamento versione ora usa l'API del server invece di `window.FRARIK_APP_VERSION`

## 1.1.24 — 2026-06-05

### Corretto
- Store HA: ricarica automatica ogni 5 minuti tramite `POST /supervisor/store/reload`
- Server rilegge `config.yaml` all'avvio per versione corretta

## 1.1.23 — 2026-06-05

### Aggiunto
- Ricarica automatica dello store HA ogni 5 minuti: gli aggiornamenti dell'add-on compaiono senza aspettare
- Pulsante "Controlla aggiornamenti" nelle impostazioni

## 1.1.22 — 2026-06-05

### Sperimentale
- Secondo tentativo iniezione logo nella sidebar HA (non risolto, sospeso)

## 1.1.21 — 2026-06-05

### Sperimentale
- Primo tentativo iniezione logo nella sidebar HA tramite shadow DOM

## 1.1.20 — 2026-06-05

### Aggiunto
- Schermata di avvio (splash): logo grande con barra di caricamento per ~3,5 secondi

## 1.1.19 — 2026-06-05

### Aggiunto (sperimentale)
- Card YAML rese in modo fedele come in Home Assistant via `<iframe>`

## 1.1.18 — 2026-06-05

### Corretto
- Ripristinato il renderer YAML interno

## 1.1.17 — 2026-06-05

### Corretto
- Card YAML renderizzate con il motore ufficiale di HA (`createCardElement`)

## 1.1.16 — 2026-06-05

### Aggiunto
- Store, scheda YAML: pulsante ➕ Aggiungi

## 1.1.15 — 2026-06-05

### Modificato
- Logo/icona aggiornati con marchio "DOMOTICA FR"

## 1.1.14 — 2026-06-05

### Modificato
- Nuovo logo/icona casa smart con iniziali FR

## 1.1.13 — 2026-06-05

### Aggiunto
- Pulsante 🧹 "Rimuovi card orfane" nello Store

## 1.1.12 — 2026-06-05

### Aggiunto
- Icona e logo ufficiali dell'add-on (`icon.png`, `logo.png`)

## 1.1.11 — 2026-06-05

### Corretto
- Badge contatti SOS: non conta più contatti vuoti

## 1.1.10 — 2026-06-05

### Corretto
- Toast "Sincronizzato" solo su azione manuale
- Conteggio Store: card eliminate non risorgono più

## 1.1.9 — 2026-06-05

### Modificato
- Impostazioni riorganizzate in menu a fisarmonica

## 1.1.8 — 2026-06-05

### Modificato
- Centro notifiche solo informativo, X per eliminare

## 1.1.7 — 2026-06-05

### Modificato
- Toast sincronizzazione semplificato

## 1.1.6 — 2026-06-05

### Rimosso
- Pulsante "Salva configurazione" ridondante

## 1.1.5 — 2026-06-05

### Pulizia
- Rimosso tutto il codice login/credenziali

## 1.1.4 — 2026-06-05

### Rimosso
- Pulsante "Esci dalla Dashboard"

## 1.1.3 — 2026-06-05

### Rimosso
- Login iniziale: la dashboard si apre direttamente

## 1.1.2 — 2026-06-05

### Rimosso
- Scheda "Speciali" dallo store

## 1.1.1 — 2026-06-05

### Rimosso
- Pulsanti "Esporta backup" e "Ripristina backup"

## 1.0.0 — 2026-06-04

### Aggiunto
- Prima versione come add-on Home Assistant ufficiale
- Server Node.js/Express con cache headers intelligenti
- Supporto ingress HA (accesso sicuro via Nabu Casa)
- Copia automatica dei file panel in `/config/www/frarik/`
- API versione: `GET /api/frarik/version`
- Build multi-architettura (amd64, aarch64, armv7, armhf, i386)
