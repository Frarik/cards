# Changelog

## 1.2.0 — 2026-06-06

### Correzioni caricamento manuale
- **Riselezionando lo stesso file non si caricava.** Il campo file ora si azzera dopo ogni scelta, quindi puoi selezionare di nuovo lo stesso file (es. `bolletta.js`) e viene ricaricato (prima funzionava solo trascinandolo).
- **Versione coerente tra "Seleziona file" e "Trascina".** La versione è ora tracciata in modo persistente per nome-file e non torna più a 1.0.0 dopo un'eliminazione. La patch si incrementa **solo se il contenuto del file è cambiato** (come lo sha su GitHub): ricaricare lo stesso identico file mantiene la versione, modificarlo la incrementa.

## 1.1.99 — 2026-06-06

### Correzioni notifiche
- **La notifica «Nuova card» ora appare una sola volta.** Prima riappariva ad ogni refresh e dopo i cicli pubblica → elimina → reinserisci → rielimina, perché l'anti-doppione era solo in memoria e l'eliminazione rendeva la card di nuovo «in sospeso». Ora la coppia (file, versione) già notificata viene **salvata in modo permanente**: niente più ricomparse. Una versione davvero nuova sul repo (sha diverso) genera invece una nuova notifica, come dev'essere. Installare una card la segna subito come «conosciuta», così non genera notifiche se poi la elimini.

## 1.1.98 — 2026-06-06

### Correzioni store
- **Dopo l'eliminazione di una card** il tasto «Installa» riappariva ma non faceva nulla finché non si premeva ↻. Ora l'installazione ricarica da sola la lista del repo se la cache è vuota/scaduta, quindi funziona subito.
- **Caricamento manuale di una card**: la sincronizzazione è ora **immediata e automatica** — la card compare subito tra le «Card locali» e nella dashboard, senza dover premere ↻ (la rotellina resta comunque per ricaricare a mano quando vuoi).

## 1.1.97 — 2026-06-06

### Correzioni
- **Caricamento manuale di una card già presente su GitHub**: ora si carica correttamente. Le card Lovelace con guardia anti-doppia-registrazione (`if (!customElements.get('x'))`, es. meteo-card) al re-caricamento saltavano il `define`, così la card non veniva riconosciuta e l'upload falliva. Ora il tag viene individuato anche tramite la guardia, quindi puoi ricaricare la card per testarla e ripubblicarla su GitHub.

## 1.1.96 — 2026-06-06

### Notifiche card
- La notifica di una **nuova card** ora chiede «È presente una nuova card «X» — vuoi installarla?»: **non installa più da sola** (in futuro saranno centinaia di card).
- **✓ apre lo store** della dashboard (sulla scheda giusta: Card JS / Chips / Distintivi); **✕ elimina** la notifica. Tutta la riga è cliccabile.
- **Auto-versioning anche per i caricamenti locali**: ricaricando lo stesso file la versione si incrementa da sola (1.0.0 → 1.0.1 …). I caricamenti locali **non** generano notifiche (le notifiche servono solo per le novità dal repo GitHub).

## 1.1.95 — 2026-06-06

### Correzioni
- **La notifica "Nuova card" non spariva più**: ora si rimuove automaticamente appena la card viene installata (da store, da GitHub o cliccando la notifica) e il centro notifiche si auto-pulisce dalle card non più in sospeso ad ogni controllo.
- **Store › Card locali**: corretto il bug per cui al **secondo caricamento** veniva salvata una card a caso. Ora viene riconosciuta sempre la card definita nel file caricato (anche al re-upload dello stesso id), eliminato il ripiego pericoloso su "l'ultima del registro".

## 1.1.94 — 2026-06-06

### Notifiche card GitHub
- **Eliminato il pop-up flottante** di aggiornamento card (la barra viola in alto): le novità arrivano ora **solo** nel centro notifiche (campanella).
- **Distinzione nuova card / aggiornamento**: una card mai installata mostra «➕ Nuova card», una card già presente che cambia mostra «🔄 Card aggiornata».
- **Versione automatica**: ogni volta che un file viene sostituito sul repo (es. `bolletta.js`), la versione si incrementa da sola (1.0.0 → 1.0.1 → …) e la notifica indica «aggiornata dalla vX alla vY».
- Le notifiche sono ora **cliccabili**: un clic installa/aggiorna direttamente quella card (con conferma).
- Una notifica **per ogni card**, così si vede il dettaglio di ciascuna.

## 1.1.93 — 2026-06-06

### Migliorato
- **Logo**: sfondo completamente trasparente fuori dal cerchio (rimosso il "bagliore" esterno in alto a destra), partendo dal file sorgente originale in alta qualità. Stesso identico logo su splash, icona add-on, header impostazioni e sidebar.
- Reinserita l'icona **Ricarica** (svuota cache) nella barra in alto.
- Il changelog dell'add-on viene ora aggiornato a ogni versione.

## 1.1.92 — 2026-06-06
- Logo ricostruito dal file originale pulito con trasparenza reale (niente più scacchiera).

## 1.1.91 — 2026-06-06
- Logo: eliminata la scacchiera residua nella zona alta e sopra il testo.

## 1.1.90 — 2026-06-06
- Logo: rimozione completa della scacchiera (erosione aloni) + cache-busting.

## 1.1.89 — 2026-06-06
- Logo: rimozione scacchiera con rilevatore di pattern (testo preservato); loghi unificati.

## 1.1.88 — 2026-06-06
- Logo splash: primo tentativo di rimozione della scacchiera con trasparenza.

## 1.1.87 — 2026-06-06
- Logo: flood-fill dai bordi per rimuovere la scacchiera.

## 1.1.86 — 2026-06-06
- Logo: sfondo trasparente (rimozione del pattern a scacchiera).

## 1.1.85 — 2026-06-06
- Logo aggiornato (sfondo trasparente).

## 1.1.84 — 2026-06-06
- Logo rinominato (logo-v2.png) per bypassare la cache del browser.

## 1.1.83 — 2026-06-06
- Nuovo logo nello splash, badge versione e icona add-on.

## 1.1.82 — 2026-06-06
- Nuovo logo "Frarik Dashboard — Smart Home Ecosystem".

## 1.1.81 — 2026-06-06
- Splash con sfondo scuro; icona X rossa in modalità modifica.

## 1.1.80 — 2026-06-06
- SOS persone, ricerca entità, icone condizionali e azione "al click", rinomina header.

## 1.1.79 — 2026-06-06
- Anteprima icona live, icona per stato, SOS semplificato, fix forma SOS.

## 1.1.78 — 2026-06-06
- Layout icona, catalogo emoji ampliato, colore icona MDI.

## 1.1.77 — 2026-06-06
- Scroll entità, anteprima entity2, allineamento chip secondario.

## 1.1.76 — 2026-06-06
- Icon picker, store chip/badge nel browser, entità secondaria.

## 1.1.75 — 2026-06-06
- Editor header: colori per stato, reset automatico, chip visivi, tipo store.

## 1.1.74 — 2026-06-06
- Aggiornamento real-time dei chip header, anteprima e colori per stato.

## 1.1.73 — 2026-06-06
- Editor header: tipi semplificati, azioni, colori, anteprima live.

## 1.1.72 — 2026-06-06
- Refactor: modale editor header completamente in JS.

## 1.1.71 — 2026-06-06
- Editor header ridisegnato: 3 colonne, drag&drop, toggle visibilità.

## 1.1.70 — 2026-06-06
- Icona X in modalità modifica + popup conferma uscita.

## 1.1.69 — 2026-06-06
- Chiusura impostazioni senza doppia animazione.

## 1.1.68 — 2026-06-05

### Migliorato
- Il pannello impostazioni ora si chiude con uno slide dall'alto verso il basso (coerente con l'apertura dal basso).

## 1.1.67 — 2026-06-05

### Passo 14/16 — Anteprima screensaver
- Aggiunto il pulsante "👁 Anteprima screensaver" nelle impostazioni (Sistema → Screensaver): mostra subito lo screensaver; tocca per uscire.

## 1.1.66 — 2026-06-05

### Passo 13/16 — Apertura impostazioni dal basso
- Il pannello impostazioni ora si apre con uno slide dal basso verso l'alto (oikUp) invece dell'espansione da sinistra a destra.

## 1.1.65 — 2026-06-05

### Passo 12/16 — Versione più visibile
- La versione a fine pannello impostazioni è ora un badge ben visibile (icona + nome + numero versione ingrandito, accento indaco), invece della scritta piccola e sbiadita.

## 1.1.64 — 2026-06-05

### Passo 11/16 — Configurazione SOS rifatta
- **Telefonata vera**: campo numero di telefono per contatto + pulsante "📞 Chiama" che apre il dialer (tel:).
- **Editor più ricco**: riordino contatti (▲▼), messaggio personalizzato per contatto, campo numero, picker icona.
- **Avvisa tutti / SOS rapido**: pulsante "📢 Avvisa TUTTI" nel popup; toggle "⚡ SOS rapido" che salta la scelta "chi sei".
- **Posizione**: le notifiche SOS allegano il link Google Maps della posizione della persona (se disponibile) e usano il messaggio personalizzato del contatto.

## 1.1.63 — 2026-06-05

### Passo 10/16 — Notifiche smart potenziate
- **Condizione "solo se"**: la regola scatta solo se un'altra entità è (o non è) in un certo stato.
- **Fascia oraria**: notifica solo nell'intervallo orario impostato (ore di silenzio).
- **Push app cellulare**: invio a `notify.mobile_app_*` oltre/invece dell'Alexa TTS.
- **Nuovi trigger**: "acceso da più di X minuti" (timer), "cambia da → a", "diventa non disponibile".

## 1.1.62 — 2026-06-05

### Passo 9/16 — Screensaver con immagine + fasce giorno/notte
- Lo screensaver può avere un'immagine di sfondo da URL (https o /local/). Con due immagini (giorno/notte) e gli orari "Giorno/Notte dalle", l'immagine cambia automaticamente all'ora impostata. Con una sola immagine, viene usata sempre.

## 1.1.61 — 2026-06-05

### Passo 8/16 — Viste
- Sotto-menù "Pagina" rinominato in "Viste"; "Pagina corrente" → "Vista corrente"; "Elimina pagina" → "Elimina vista".
- Rimosso il campo "Titolo nella dashboard" dalle impostazioni (il titolo si può mettere nell'header). Riferimenti JS resi null-safe.
- I campi della vista (icona/nome) seguono la vista corrente: si aggiornano all'apertura e quando cambi vista.

## 1.1.60 — 2026-06-05

### Passo 7/16 — Rimosso "Layout griglia"
- Tolto l'editor "Layout griglia" dal sotto-menù Pagina delle impostazioni (rinominato da "Pagina & Griglia" a "Pagina"). La configurazione righe/colonne resta disponibile inline in modalità modifica.

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
