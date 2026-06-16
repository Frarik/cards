# Changelog

## 1.5.07 — 2026-06-16

### fix: barra countdown sincronizzata, tile emergenza rimisurare, log servizio notify

- **Barra countdown**: ora usa `requestAnimationFrame` ancorato al tempo reale — barra e numero scorrono perfettamente in sincronia. Rimossa `transition:width 1s linear` dal CSS che causava il ritardo visivo.
- **Tile emergenza**: misura intermedia (icon 22px, padding 10×5px, gap 6px) — più grandi delle "mini" precedenti ma più compatte dell'originale.
- **Log active**: nella schermata "Allarme inviato" ora mostra il nome persona E il servizio `notify.xxx` chiamato — utile per verificare che venga chiamato il servizio corretto.

## 1.5.06 — 2026-06-16

### fix: notifiche iOS — payload ripulito, solo push wrapper (formato ufficiale HA companion)

- Rimossi `sound`/`interruption-level`/`badge` dal top-level di `notifData`: non sono campi HA standard e avere `sound:{...}` (oggetto) al top confondeva il backend Android che si aspetta una stringa
- Rimosso `url` dall'interno di `push{}`: l'URL da aprire al tap va solo al top-level di `data` (`url`+`clickAction`), non dentro il wrapper APNs
- Il payload iOS ora è esattamente il formato documentato da HA companion: `push:{sound:{name:'default',critical:1,volume:1.0},'interruption-level':'critical',badge:1}`

## 1.5.05 — 2026-06-16

### feat: SOS card — click immediato, countdown 3s, tile emergenza più piccole

- **"CHIEDI AIUTO"** ora è un click immediato — rimosso il meccanismo hold-3-secondi. Click → avvio countdown diretto.
- **Countdown ridotto a 3 secondi** (era 5). Più rapido ma ancora annullabile.
- **Tile emergenza (step3) dimezzate**: gap 5px, padding 7×4px, icona 18px, label 9px, rimosso `aspect-ratio:1`. La card mantiene la stessa altezza della griglia persone.

## 1.5.04 — 2026-06-16

### fix: notifiche iOS — dual format (push wrapper + top-level) per compatibilità tutte le versioni companion

- La companion iOS < 2021.1 legge da `data.push.sound` (formato documentazione ufficiale HA); la companion ≥ 2021.1 legge da `data.sound` direttamente
- Ora entrambi i formati sono presenti in `notifData`: `sound`/`interruption-level`/`badge` al top-level E dentro `push{}`
- `critical:1` + `interruption-level:critical` per massima priorità (richiede "Avvisi Critici" abilitati in iOS Impostazioni → Notifiche → Home Assistant)

## 1.5.03 — 2026-06-16

### fix: notifiche iOS — rimosso wrapper push{}, campi al livello corretto

- La companion app iOS ≥ 2021.1 ignora il vecchio formato `data.push.sound` e legge `data.sound` direttamente. Con il wrapper `push:{}` le notifiche venivano silenziosamente scartate dall'app iOS.
- `sound`, `interruption-level`, `badge` ora sono al primo livello di `data` (come richiesto dalla companion moderna) — sia Android che iOS ricevono correttamente.
- `interruption-level: critical` richiede "Avvisi Critici" abilitati in iOS Impostazioni → Notifiche → Home Assistant. Se non abilitati, la notifica arriva comunque come normale alert.

## 1.5.02 — 2026-06-16

### fix: popup SOS header — dimensioni corrette, centrato, idle forzato

- Popup SOS dall'header ora centrato orizzontalmente con `max-width:420px` — rimane stretto come su mobile anche su schermi desktop, le tile 3×2 non si allargano a dismisura
- Altezza card fissa a 380px, overflow:hidden, nessun contenuto tagliato
- Card forzata a stato `idle` ad ogni apertura del popup (indipendente dallo stato della card in dashboard)

## 1.5.01 — 2026-06-16

### fix: dashboard delete senza licenza, popup SOS header altezza, colori zona persone

- **Dashboard delete**: rimossa anche la protezione dentro `delCard()` — la card SOS si elimina normalmente dalla dashboard con normale confirm dialog, senza inserire alcuna chiave
- **Popup SOS header**: altezza area card fissata a 400px — la card SOS appare per intero nel popup
- **Colori stato persone**: `home` → verde, `not_home` → rosso, zona custom (lavoro, ufficio, ecc.) → azzurro/blu `#38bdf8`, `unknown`/`unavailable` → grigio

## 1.5.00 — 2026-06-16

### fix: SOS — 6 fix su picker, preview, popup licenza, dashboard, stato persone, bottone header

- **Picker notify**: rimosso filtro `mobile_app_` (le entità in HA non hanno quel prefisso); picker mostra tutti i `notify.*`; quando si seleziona dal picker il prefisso `notify.` viene strippato automaticamente così si memorizza solo lo slug del servizio (es. `iphone_giulia`)
- **Preview card impostazioni**: stato forzato a `idle` (non eredita più lo stato della card dashboard); storageKey dedicato `__sos_preview__`; altezza container 320×320px
- **Popup rimozione Store**: rimpiazzato `window.prompt()` con popup Frarik bottom-sheet personalizzato — input password, tasti Annulla/Rimuovi, validazione SHA-256 inline, chiusura su backdrop click o tasto ✕
- **Dashboard — eliminazione normale**: rimossa la protezione "Protetta (richiede licenza)" dal menu contestuale della card SOS sulla dashboard; la card si elimina normalmente come qualsiasi altra card
- **Stato presenza persone**: `_stLbl`/`_stCol` aggiornati — mostra la posizione per TUTTE le persone: `home` → "In casa" 🟢, `not_home` → "Fuori casa" 🔴, zona custom (es. `lavoro`) → nome zona 🟡, `unknown`/`unavailable` → testo grigio
- **Bottone SOS header**: `openSOS()` riscritta — apre un popup bottom-sheet Frarik con la card SOS completa (stesso stile degli altri bottom-sheet); si chiude con ✕ o tap sul backdrop

## 1.4.99 — 2026-06-16

### fix: SOS card — barra hold, preview impostazioni, picker mobile_app, Store cestino licenziato

- **Barra hold fix**: la barra di avanzamento ora si anima correttamente al press di "CHIEDI AIUTO" — rimosso il `_build()` durante il pointer-down che detachava il DOM e perdeva il pointer-capture; la barra cresce sul DOM esistente via RAF; rilasciando si resetta
- **CSS variables hold-bar**: `--mc-rgb` spostato su `.hold-wrap` invece del solo bottone, così la `hold-bar` (elemento fratello) eredita correttamente il colore
- **Preview card impostazioni**: la card SOS nella sezione Impostazioni → SOS è ora centrata in un riquadro 320×260px fisso — non più a larghezza piena del pannello
- **Picker mobile_app**: il bottone 🔍 nella configurazione "Nucleo familiare" ora apre il picker filtrato per `mobile_app_*` (non per tutti i servizi notify); il badge del picker mostra `mobile_app_*`
- **Store Predefinite — cestino con licenza**: il 🗑 sulla card SOS è ora cliccabile; chiede la chiave amministratore (SHA-256); se valida rimuove la card dallo Store locale (non da GitHub); sincronizzando il tab Predefinite la card riappare

## 1.4.98 — 2026-06-16

### feat: SOS card v1.4 — wizard aggiornato, config famiglia unificata, notifiche interattive, Store fix

- **Step 2**: bottoni "Seleziona tutti" e "Continua" appaiono solo se >1 altra persona; con 1 sola persona il tap avanza direttamente a step 3
- **Step 3**: 6 quadrati in griglia 3×2 (`aspect-ratio:1`) invece di rettangoli verticali — card più compatta
- **Step 4**: riepilogo tutto su una sola riga (chips inline: 👤 chi · 🆘 tipo · 📱 chi avvisare); tasto "CHIEDI AIUTO" con barra di caricamento che appare al press
- **Auto-reset**: dopo l'invio dell'allarme la card torna al passo 1 automaticamente dopo 5 secondi
- **Config accordion unificato**: unico menù "Nucleo familiare & Contatti" — ogni riga = `person.*` + `mobile_app_*` notify service; rimossi campi telefono e messaggio personalizzato
- **Store → Predefinite**: fix robusto `_jsStoreList()` — splica sempre la versione obsoleta e ri-inserisce builtin SOS card; visibile e aggiungibile come le card JS
- **Notifiche interattive**: messaggio semplificato; `url`/`clickAction`/`actions` per Android, `push.url` per iOS — toccare la notifica apre la posizione GPS (non HA)
- **Nuove funzioni esportate**: `sosFamilyAdd`, `sosFamilyRemove`, `sosFamilyUpdate`, `_sosPickFamilyNotify`

## 1.4.97 — 2026-06-16

### fix: SOS card — stop flash/rerender su ogni update HA

- `set hass` ora confronta una signature delle persone (`eid|state|picture`) prima di ridisegnare: la card si aggiorna solo se i dati cambiano davvero, non ad ogni tick HA (che arriva ogni 1-2 secondi)
- Eliminati il lampeggio e il blocco ai click causati dai re-render continui

## 1.4.96 — 2026-06-16

### fix: SOS card v1.3 — flusso 4 step, testo bianco 100%, angoli card, store Predefinite

- **sos-card v1.3**: flusso completamente ridisegnato in 4 step chiari: (1) griglia "CHI CHIEDE AIUTO?" → (2) griglia identica "CHI VUOI AVVISARE?" con le altre persone → (3) tipo emergenza (6 tipi: SOS, medica, incendio, allagamento, gas, intrusione) → (4) tasto "CHIEDI AIUTO" grande da tenere premuto 3s
- **Testo bianco 100%**: tutti i testi nella card e nel pannello SOS sono `#fff` puro, rimossi tutti i `rgba(255,255,255,0.X)` per testi principali
- **Angoli card**: fix `border-radius:16px` su `:host` e `.wrap` — niente più angoli tagliati nel pannello SOS
- **Store → Predefinite**: fix `_jsStoreList()` — la card SOS ora appare sempre nel tab Predefinite senza dipendere dal timing del registry
- **Pannello SOS**: riquadro guida grande con font 14-20px tutto bianco, card sotto, menù a tendina accordion (persone + contatti) sotto la card
- **Nuovi tipi emergenza**: aggiunto Allagamento 🌊 e Perdita Gas 💨 alla lista

## 1.4.95 — 2026-06-16

### feat: SOS card — griglia persone come stato idle, rimozione configurazione in-card

- **sos-card v1.2**: stato idle completamente ridisegnato — mostra direttamente la griglia del nucleo familiare con avatar circolari (foto da HA o iniziali), nome e stato presenza (In casa/Fuori casa) con colori verde/rosso
- **Flusso wizard**: idle (seleziona chi chiede aiuto) → step2 (scegli i contatti da avvisare, le altre persone del nucleo) → step3 (tipo emergenza) → confirm → hold → countdown → active
- **Nessuna configurazione in-card**: rimosso il pulsante ⚙️ e i metodi `_openCfg`, `_renderCfgInto`, `_destroyCfg`; il metodo `configure()` ora reindirizza a Impostazioni → SOS
- Card disponibile nel tab "Predefinite" dello store con possibilità di aggiunta in dashboard; nel pannello SOS è fissa (non modificabile dall'interno)

## 1.4.94 — 2026-06-16

### feat: SOS — tab Predefinite, ridisegno pannello impostazioni, GPS migliorato

- **Store → tab "Predefinite"** (🛡️): nuovo tab viola dedicato alle card di sistema integrate in Frarik; mostra la card SOS con badge 🔐 Sistema, pulsante Aggiungi, lucchetto (non eliminabile senza licenza)
- **openSOS()** ridiretta al pannello Impostazioni → SOS invece dell'obsoleto popup modale (sos-mod1/sos-mod2); chip SOS nella top-bar apre ora la guida di configurazione
- **Impostazioni → SOS** completamente ridisegnato: banner guida a 4 step con descrizione dettagliata, anteprima live della sos-card embeddada nel pannello, sezione Persone e Contatti con placeholder chiari
- **GPS SOS migliorato**: `_loc()` in SosCard usa l'`entity_id` della persona selezionata (`_wPersonEid`) per inviare la posizione GPS esatta; fallback al primo `person.*` se non trovata
- Aggiunto stile CSS `.ghc-tab-predef` per il nuovo tab con colori viola sistema

## 1.4.93 — 2026-06-16

### fix: Card YAML in dashboard — rimossa la "cornice" del wrapper Frarik

- La card YAML porta il proprio sfondo `ha-card` → il wrapper Frarik aggiungeva una seconda cornice (sfondo + bordo + ombra + blur) attorno
- Ora per le `yaml-card` il contenitore Frarik è **completamente trasparente** (niente background, bordo, box-shadow, backdrop-filter) → si vede solo la card nativa, identica a HA

## 1.4.92 — 2026-06-16

### fix: Card YAML in dashboard — rimosso offset e clipping dell'iframe

- **Anteprima store**: funziona al 100% (motore nativo HA, tutti i plugin HACS)
- **`_fyFitIframe`** (sostituisce `_fyHideNavInIframe`): oltre a nascondere sidebar/header, azzera il padding della vista HA (`#view`/`hui-view`) → la card non è più spostata in basso a destra ma in alto a sinistra
- **Auto-fit altezza** (solo dashboard): misura l'altezza reale della card e adatta iframe + container Frarik → niente più card tagliata
- `_fyDeepQuery`: ricerca attraverso i confini shadow DOM annidati di HA per trovare `hui-root`/`#view`
- Anteprima store mantiene altezza fissa (380px) con padding azzerato

## 1.4.91 — 2026-06-16

### fix: Card YAML — usa la connessione WS del frontend HA reale

- **Causa trovata**: il WebSocket proxied dell'add-on NON inoltra i comandi `lovelace/*` (timeout su `dashboards/list`) → l'iframe nativo non partiva mai
- **`_parentConn()`**: nuova funzione che recupera `window.parent.hass.connection` (Frarik gira come pannello ingress dentro HA → `window.parent` è il frontend HA reale, con la sessione admin dell'utente loggato)
- **`_fyWS`** ora instrada i comandi lovelace tramite la connessione del frontend HA reale → `dashboards/list`, `dashboards/create`, `config/save` funzionano → l'iframe nativo carica la dashboard `frarik-yaml` con il motore completo di HA (100% compatibile con tutti i plugin HACS)
- Fallback al WS proxied + renderer interno solo se `window.parent` non è accessibile (Frarik aperto standalone)

## 1.4.90 — 2026-06-16

### fix: Card YAML — diagnostica iframe nativo HA

- Il renderer interno non può rendere card HACS complesse/annidate (es. `custom:multiple-entity-row`, `custom:hui-element` nested) → solo il motore nativo HA garantisce il 100%
- **Diagnostica visibile**: se il rendering nativo HA (iframe su dashboard `frarik-yaml`) non parte, l'anteprima mostra il motivo esatto del fallimento (`dashboards/list`, `dashboards/create`, `config/save` con codice errore, oppure "WebSocket non connesso")
- `_fyLastErr`: nuova variabile che cattura l'errore WS specifico nei passi `_fyEnsureDashboard` / `_fyUpsertView`
- L'anteprima ora prova SEMPRE l'upgrade a iframe nativo e segnala se ricade sul renderer interno

## 1.4.89 — 2026-06-16

### fix: Card YAML — CSS vars HA + ordine setConfig/hass corretto

- **Bug critico risolto**: `_yamlCustomEl` impostava `hass` PRIMA di `setConfig` — le card HA richiedono l'ordine inverso; questo causava rendering blank per button-card, mushroom, bubble-card ecc.
- **`_injectHACSSVars(container)`**: nuova funzione che legge tutte le CSS custom properties dal `documentElement` di HA (window.parent) e le inietta nel container di anteprima. Le custom props cascadano attraverso i confini shadow DOM → card HACS vedono il tema corretto
- **`window.loadCardHelpers` definito in Frarik**: le card HACS che chiamano `window.loadCardHelpers()` internamente (per creare sub-elementi) usano ora il factory locale di Frarik invece di fallire
- **Store preview**: usa renderer interno con CSS vars come path principale (immediato, nessuna dipendenza WS); tenta upgrade a iframe HA in background se disponibile
- **Dashboard yaml-card fallback**: inietta CSS vars nel container prima di `_yamlCreateEl`

## 1.4.88 — 2026-06-16

### fix: Card YAML — anteprima e dashboard tramite iframe HA nativo

- **Anteprima Store (Card YAML tab)**: usa ora `_fyUpsertView` + iframe che punta alla dashboard HA dedicata `frarik-yaml` → compatibilità 100% con HACS (button-card, mushroom, bubble-card, entities, ecc.)
- **Dashboard yaml-card**: stessa pipeline iframe per TUTTE le card (non più solo native non-custom:) → nessun problema con card complesse o nested
- **`_fyHideNavInIframe`**: nuova funzione che traversa il shadow DOM di HA (same-origin) e nasconde sidebar + app-header in modo asincrono con retry; l'iframe parte con `opacity:0` e appare con fade-in quando la navigazione è rimossa
- **Eliminato "⏳ Carico…"**: `_mountYamlCard` non mostra più il messaggio di caricamento
- **Aggiornamenti automatici**: l'iframe riconosce `lovelace/updated` di HA e si aggiorna da solo quando la config YAML cambia, senza reload della pagina
- Fallback al renderer interno mantenuto se WebSocket non disponibile

## 1.4.87 — 2026-06-16

### fix: Card YAML tab — compatibilità HACS, anteprima e dashboard

- Preview ora usa `_createHACard` (motore ufficiale HA via `loadCardHelpers.createCardElement`) come metodo primario → piena compatibilità con button-card, mushroom, bubble-card, ecc.
- Aggiunto timer refresh hass ogni 800ms nell'anteprima (Lit/async cards si aggiornano dopo connessione DOM)
- `_yamlRefreshHass` ora imposta hass anche su elementi creati via motore HA (non solo `.fycel`)
- `_mountYamlCard` (dashboard): prova `_createHACard` per card `custom:` prima del fallback interno → card aggiunte funzionano ora in dashboard
- Aggiunto pulsante "↻ Anteprima" manuale per forzare il refresh senza ri-digitare
- Timer hass precedente fermato correttamente prima di ogni nuova anteprima

## 1.4.86 — 2026-06-15

### feat: Tab "Card YAML" nello Store — editor YAML con anteprima live HACS

- Nuovo tab **📝 Card YAML** nel gruppo principale dello store (accanto a JS, Chips, Distintivi, Premium)
- **Layout split-view**: editor YAML a sinistra (con numerazione righe), anteprima live a destra
- Anteprima si aggiorna automaticamente mentre si digita (debounce 600ms)
- Piena compatibilità HACS: carica le risorse Lovelace installate su HA (`custom:button-card`, `custom:mushroom-*`, `custom:bubble-card`, ecc.)
- Supporto card HA native: `entities`, `horizontal-stack`, `vertical-stack`, `grid`, ecc.
- Pulsante **"⇄ Formatta"** per riformattare/validare il YAML
- Pulsante **"Aggiungi alla Dashboard"** appare dopo la prima anteprima valida
- La barra di ricerca viene nascosta quando il tab è attivo (non rilevante)
- Il contenuto dell'editor viene preservato quando si cambia tab e si torna

## 1.4.85 — 2026-06-15

### feat: SOS Card — redesign completo con procedura guidata a step

- **Wizard a 3 step**: Chi chiede aiuto? → Tipo emergenza → A chi chiedi aiuto? → Conferma
- **Step 1 — Chi sei**: seleziona la tua persona da HA (entities person.*), con opzione "Non specificare"
- **Step 2 — Tipo emergenza**: 4 tipi con icona + descrizione (SOS Generico / Medica / Incendio / Intrusione)
- **Step 3 — Contatti**: lista contatti configurati con checkbox multi-selezione, "Seleziona tutti", badge check animato
- **Conferma**: riepilogo completo (chi / tipo / destinatari) + hold button 3s con barra di progresso
- **Countdown**: numero grande 5→0 con barra colorata + annulla visibile e urgente
- **Allarme attivo**: header colorato animato con nome tipo, "chi ha chiesto" e lista destinatari inviati
- **Impostazioni card (⚙️)**: pannello bottom-sheet con 4 sezioni — Persone (dropdown HA entities), Contatti (nome + notify service con hint), Trigger automazione, Dimensioni card
- Salvataggio SOS cfg via evento `frarik-sos-cfg-update` (shadow DOM → main.js)
- Wizard si resetta automaticamente a idle dopo reset allarme
- Aggiornato `_jsStoreList` per mostrare versione 1.1 SOS card nello store

## 1.4.84 — 2026-06-15

### feat: SOS Card — emergenza protetta da licenza

- Nuova card SOS embedded in main.js come custom element `sos-card` con shadow DOM completo
- 4 modalità: Generico 🆘, Medico 🏥, Incendio 🔥, Intrusione 🔒 — ognuna con colore dedicato
- Hold button 3 secondi → countdown 5 secondi → invio allarme a tutti i contatti configurati in Impostazioni → SOS
- Notifiche HA via `notify.*` con priorità critica (TTL 0, canale `alarm_stream`, vibrazione SOS)
- Trigger entità opzionale (script, input_button, automation) configurabile nelle impostazioni card
- Posizione GPS automatica dalla prima entità `person.*` con lat/lon (link Google Maps nel messaggio)
- Log ultimi 10 eventi in localStorage (`soscard:{storageKey}`)
- **Protezione eliminazione**: `delCard()` richiede la chiave di licenza (SHA-256 verificato via `crypto.subtle`) — la chiave in chiaro non è mai nel codice
- `cardDotMenu()`: voce "🔐 Protetta (richiede licenza)" viola al posto di "🗑 Elimina" per la sos-card
- `renderSOSCfgList()`: banner di stato (card presente/assente + pulsante "➕ Aggiungi") sopra la lista contatti SOS
- `window._addSosToDash()` / `_addSosToDash()` per aggiungere la card alla pagina corrente
- `window.frarikSosCfg()` exposto per accesso ai contatti dalla card
- `_registerLovelaceCard('sos-card', ...)` + override `mount` per passare `storageKey: card.id`

## 1.4.83 — 2026-06-15

### fix: store preview Meteo + fit card intera nel riquadro

- `_ghcLivePrev` lovelace: rimosso override `storageKey` — le card come Meteo usano `'default'` come chiave localStorage (il dashboard mount non passa mai `storageKey`), quindi il preview passava `existingCard.id` sbagliato → "Attiva modifica" invece della card configurata
- Aggiunto re-scale post-render (3° rAF): dopo `cel.hass`, misura `cel.scrollHeight` e ricalcola `fitScale = min(hw/PW, PH/wh)` così l'intera card è visibile nel riquadro
- `.ghc-prev` height: 165px → 200px per riquadro più generoso
- `PH=200` (virtual height reference) sincronizzato con la nuova altezza CSS

## 1.4.82 — 2026-06-15

### fix: store preview per card render/mount (Camera, Clima, DoorsWindows ecc.)

- `_ghcLivePrev`: corretta condizione routing `_lovelace!==false` → `_lovelace===true` — le card old-style (Camera, Clima, DoorsWindows) non chiamano `_registerLovelaceCard` quindi `_lovelace` è `undefined`, che passava erroneamente al ramo lovelace creando un elemento vuoto
- Ramo render+mount: usa l'istanza esistente dal dashboard (`existingCard`) come `previewCard.id` così la card carica la sua config reale da localStorage; fallback a `{id:'__prev__'}` se non trovata
- Aggiunta altezza virtuale `vH` proporzionale al contenitore preview (165px visualizzati / scale) così le card con `height:100%` hanno un riferimento valido
- Camera: `mount()` NON chiamato nel preview per evitare connessioni WebRTC/MJPEG inutili

## 1.4.81 — 2026-06-15

### fix: store preview usa storageKey istanza esistente per caricare config card

- `_ghcLivePrev`: cerca nella configurazione dashboard un'istanza già configurata dello stesso tipo di card e passa il suo `storageKey` al `setConfig` della preview — le card frarik caricano così la loro configurazione salvata (entity, soglie, ecc.) e renderizzano correttamente invece di mostrare uno stato vuoto

## 1.4.80 — 2026-06-15

### fix: colonne/layout rimossi da Viste (main.js) + store preview con fallback

- `renderSectionsList()` svuotata: rimosse sezioni "Colonne pagina" e "Layout griglia" dal tab Viste
- `_ghcLivePrev`: corretto bug `_ghcPlaceholder` → `_ghcPrevPh` (funzione inesistente causava area scura); ripristinato scaling; aggiunto supporto card render+mount
- `_ghcLivePrevBySha`: aggiunto fallback placeholder quando codice non in cache o rendering fallisce

## 1.4.79 — 2026-06-15

### fix: rimozione sezioni licenza/colonne da src/index.html (file corretto)

- Rimossa sezione "🔑 Licenza" da tab Dati in src/index.html (precedentemente rimossa solo da dom.js per errore)
- Rimossa sezione "Quante colonne?" da tab Viste in src/index.html (stesso motivo)

## 1.4.78 — 2026-06-15

### feat: pulizia pannello impostazioni + store preview migliorata

- Rimossa sezione "🔑 Licenza" dal tab Dati del pannello impostazioni
- Rimossa sezione "Quante colonne?" dal tab Viste del pannello impostazioni
- Store preview: `_ghcLivePrev` ora usa lo stesso pattern delle impostazioni card (render+mount per card JS, setConfig+hass per lovelace) senza scaling forzato — preview visibile per tutte le card

## 1.4.77 — 2026-06-15

### style: fix residui testo bianco + Premium popup bottom-sheet

- Premium popup convertito a bottom-sheet (slideUp dal basso, border-radius:20px 20px 0 0)
- Tab store (`jsst-tab`) ora esplicitamente `#fff` anziché `var(--muted)`
- Chips Copia/Download (`ghs-btn-cp`, `ghc-btn-cp`, `ghc-btn-pub`) → `color:#fff`
- Aggiunta regola `ghs-search::placeholder{color:#fff}`
- Rimossa `opacity:.7` da `.ghs-subempty`
- Sostituiti ulteriori grigi (#94a3b8, #64748b, #e2e8f0) in main.js e style.css

## 1.4.76 — 2026-06-15

### style: testo bianco 100% ovunque + popup uniformi bottom-sheet

- Tutti i `color:rgba(255,255,255,...)` sostituiti con `#fff` in main.js, dom.js, style.css, index.html e tutti i card-js (331 occorrenze totali)
- Variabili CSS `--muted` e `--dim` aggiornate a `#fff` per coerenza globale
- Convertiti a bottom-sheet standard (slideUp + border-radius:20px 20px 0 0 + align-items:flex-end) i popup: openPopupView, openEntityCleanup, openBadgePopup, _pgCheckDirtyAndProceed, confirm-overlay

## 1.4.75 — 2026-06-15

### fix(admin): endpoint Worker /api/admin/licenses + lista utenti reali funzionante

- Aggiunto endpoint `GET /api/admin/licenses` al Worker Cloudflare: autentica tramite `X-Frarik-Key` (la chiave-licenza admin), verifica che la nota contenga "admin"/"amministratore", poi restituisce la lista completa
- CORS aggiornato: aggiunto `X-Frarik-Key` e `X-Admin-Key` agli header permessi
- Dashboard: `userRow` aggiornato con stato attivo/revocato, data ultimo accesso, formattazione corretta
- Worker deployato a `https://frarik-license.frarik.workers.dev`

## 1.4.74 — 2026-06-15

### fix(licenza/admin): T-Rex per admin + badge Admin+Premium + utenti reali API

- **Admin → T-Rex sempre**: `_licDinoFor(name, note)` ora accetta la note come parametro; se contiene "admin"/"amministratore" restituisce sempre T-Rex indipendentemente dal nome
- **Badge livello corretto**: mostra "🛡️ Admin + Premium" (non solo "Admin") per gli utenti admin
- **Pannello Admin — utenti reali**: sezione "Utenti con licenza" ora fa fetch a `LICENSE_ADMIN_API` con la chiave admin in header; mostra due sezioni separate: "💎 Utenti Premium / Admin" e "⭐ Utenti Standard" con il nome reale di ogni utente
- Admin e Amministratore inclusi nella sezione Premium (poiché hanno accesso automatico)
- Ogni riga utente mostra: emoji dinosauro, nome, scadenza, badge livello colorato
- Se l'API non risponde: messaggio di errore invece di crash silenzioso

## 1.4.73 — 2026-06-15

### fix(settings/store): badge licenza grande + admin panel + preview card con stub config

- **Badge licenza più grande**: occupa tutta la larghezza del pannello, emoji dino 90px, nome utente in evidenza (26px), dino come soprannome decorativo secondario
- **Admin panel — nome utente**: le mini-preview mostrano il NOME dell'utente come testo principale, il nome del dinosauro come sottotitolo. Aggiunta terza card "Admin + Premium" che mostra il proprio nome
- **Admin panel — 3 anteprime**: Standard (Marco Rossi / T-Rex), Premium (Giulia Bianchi / Brontosauro), Admin+Premium (tuo nome / Spinosauro)
- **Admin = Premium**: la card Admin mostra "🛡️ Admin + Premium" per chiarire che Admin include l'accesso Premium
- **Preview card store con stub config**: `_ghcLivePrev` usa `getStubConfig(hass, entities)` se disponibile, poi inietta automaticamente un'entità reale (sensor/light/switch/weather) per mostrare dati reali nell'anteprima

## 1.4.72 — 2026-06-15

### feat(settings): tab Licenza + Pannello Admin + overlay primo accesso rinnovato

- **Tab "Licenza"**: nuovo pannello nelle impostazioni con badge membership colorato e dinosauro cartoon assegnato in modo deterministico dal nome utente (T-Rex, Brontosauro, Velociraptor ecc.)
- **Badge licenza**: mostra nome, tipo (Standard/Premium/Admin), scadenza, chiave mascherata, logo Frarik; bottone "Passa a Premium" solo per utenti Standard
- **Tab "Pannello Admin"**: visibile solo se `frarik_lic_note` contiene "Admin" o "Amministratore"; mostra info licenza, test rapidi, anteprime utente Standard vs Premium, lista email interesse, statistiche
- **Schermata primo accesso rinnovata**: logo Frarik grande, card viola con glow, bottone "Acquista Premium" che apre il portale licenze, background `#0a0816`
- `_adminShowFirstAccess()`: apre l'overlay primo accesso con tasto "Chiudi anteprima" per test da admin
- `_epLicBadgeLoad()`: legge localStorage, genera badge immediato, poi fa fetch live per aggiornarlo
- `_epAdminPanelLoad()`: compila il pannello admin con mini-preview utenti Standard/Premium, email, statistiche
- `_switchEpTab()`: mostra/nasconde tab Admin in base a `_isAdmin()`, carica hook `licenza` e `admin-panel`

## 1.4.71 — 2026-06-15

### fix(store): preview reale per tutte le card + pannello Admin

- **Preview reale per card non installate**: `_ghcLivePrevBySha()` carica dinamicamente il JS via `_installCardCode()` e renderizza il componente vero nella tile — niente più emoji o gradienti
- **Preview card installate**: rimosso il timeout che uccideva il render se il shadow DOM sembrava vuoto; il render ora rimane sempre visibile
- `_ghCodeCache`: nuova cache sha→codice sorgente; popolata in `_ghFetchVerLabels` per abilitare la preview dinamica
- **Admin separato da Premium**: `_isAdmin()` controlla "Admin"/"Amministratore" in `frarik_lic_note`; `_isPremiumLic()` aggiunto controllo "amministratore"
- **Pannello di Controllo Admin**: sezione rossa visibile solo agli Admin nella tab Premium, con info licenza, lista email interesse, tasti test rapidi
- "Testa pagina Premium": bottone nel pannello Admin per aprire la pagina marketing (utile per test senza essere non-premium)
- Mock card in schermata bloccata: tolte emoji, preview con sfondo opaco (non più placeholder con icon)

## 1.4.70 — 2026-06-15

### fix(store): anteprima nera + icona card non installate + Premium con licenza

- **Fix anteprima nera**: il placeholder viene mostrato subito; la preview live viene rimossa se dopo 600ms il shadow DOM è vuoto (<40 char)
- **Fix icona card non installate**: `_parseCardIcon()` estrae l'icona dal codice sorgente; `_ghcSmartIcon()` mappa 16 pattern di nomi a emoji; fallback su `folder.ico`
- **Premium — auto-sblocco**: `_isPremiumLic()` controlla `frarik_lic_note` per "Premium" o "Admin" → le card premium si sbloccano automaticamente con licenza valida
- **Pagina "Vuoi Diventare Premium?"**: modal dedicata con griglia feature (6 aree), placeholder prezzi, form registrazione interesse via email
- **Bottone "Ho già una licenza"**: rimanda alle impostazioni licenza con scroll+highlight automatico
- `_premSendInterest()`: salva email in localStorage (server-side configurabile in futuro)
- `_ghDescCache`, `_ghIconCache`: due nuove cache per SHA → descrizione e icona estratte dal codice

## 1.4.69 — 2026-06-15

### feat(store): anteprime grandi + smart description + tab revolution + sezione Premium

- **Anteprime più grandi**: preview 165px di altezza (da 118px)
- **Descrizione intelligente**: `_ghcSmartDesc()` genera automaticamente descrizioni italiane per qualsiasi card nuova, analizzando nome e codice (entità HA, feature, domini)
- **Tab bar rivoluzionata**: icona + label verticale, effetto glow amber sull'attivo, spring animation, tab utilities (YAML/PKG/Locali) più compatti, wrapper con background traslucido
- **Sezione 💎 Premium**: nuovo tab con hero screen, mock di card bloccate con overlay lock, CTA "Attiva licenza Premium". Quando la cartella `card-premium/` avrà card, le mostrerà con stile dorato
- `_ghcSmartDesc(name, code)`: 16 domini HA riconosciuti + rilevamento feature secondarie (grafici, notifiche, schedule)
- `_ghFetchVerLabels` usa smart desc come fallback se nessun campo desc/description trovato

## 1.4.68 — 2026-06-15

### feat(store): redesign completo UI Store — griglia moderna con preview live

- Nuovo layout a **griglia di card** (auto-fill minmax 182px) al posto delle righe piatte
- **Preview visiva immediata** per le card installate: il componente reale viene renderizzato in scala nella tile, senza cliccare nessun tasto
- **Placeholder grafico** con gradiente colorato + icona per le card non ancora installate
- **Descrizione automatica** visibile direttamente in ogni tile (estratta da `description:` o `desc:` nel codice)
- **Badge di stato** animati: ● Installata / ✓ In vista / ↑ Aggiornamento (pulsante animato) / ⬇ Disponibile
- **Striscia di colore** in cima a ogni tile: verde=installata, amber=aggiornamento, viola=disponibile
- Separatori di sezione "Installate / Da installare" con contatori in pillola
- Hover effect con elevazione e glow colorato per sezione
- `_parseCardDesc(code)` — estrae descrizione da `description:` o `desc:` nel codice sorgente
- `_ghcDesc(cardId, sha)` — best-effort description: registry → GitHub cache → store meta → codice installato
- `_ghcLivePrev(host, cardId)` — render inline del componente scalato (300px → larghezza tile)
- `_ghcPrevPh(icon, name)` — placeholder con gradiente deterministico basato sul nome
- `_ghDescCache` parallelo a `_ghVerCache` — popolato insieme durante `_ghFetchVerLabels`
- Tab YAML conserva il layout a righe (senza preview, corretto per file YAML)

## 1.4.67 — 2026-06-14

### feat(store): PKG — elimina da GitHub con chiave di accesso

- Bottone 🗑️ GitHub su ogni PKG (sia in "Locali" che in "Da GitHub")
- Stessa chiave di sicurezza delle card JS (`FRKD-HVEM-JJR7-5DAN`)
- Dopo eliminazione aggiorna la cache e il render del tab Pacchetti

---

## 1.4.66 — 2026-06-14

### fix(store): messaggio errore 403 GitHub più chiaro con istruzioni token

---

## 1.4.65 — 2026-06-14

### fix(store): PKG tab ridisegnato — store locale YAML senza "installazione" in HA

**Logica corretta:** il tab 📦 Pacchetti gestisce file YAML come lo store JS gestisce le card:
- **Locali** (caricati da disco): Pubblica su GitHub · Copia · Download · Rimuovi dallo store
- **Da GitHub** (non ancora salvati): Copia · Download · Salva locale
- **Carica PKG locale**: pulsante inline per caricare un .yaml da disco nello store locale
- **Pubblica su GitHub**: carica il PKG locale nella cartella `pkg/` del repo via GitHub API
- Storage: `localStorage` con chiave `fratech_pkg_*` (nessuna chiamata al server)
- Rimosso errore JSON che bloccava l'apertura del tab (chiamata a `/api/frarik/pkg/list` inesistente)

---

## 1.4.64 — 2026-06-14

### feat(store): PKG store completo — installa/disinstalla/pubblica pacchetti HA

**frarik-addon/server.js:**
- `GET /api/frarik/pkg/list` — elenca i file .yaml in `/config/packages/`
- `GET /api/frarik/pkg/read?name=X` — legge il contenuto di un PKG installato
- `POST /api/frarik/pkg/install` — scrive un PKG YAML in `/config/packages/`
- `DELETE /api/frarik/pkg/uninstall` — rimuove un PKG da `/config/packages/`

**frarik-addon/src/main.js:**
- Tab **📦 Pacchetti** nello store ora ha funzionalità complete (era solo Copia/Download)
- Sezione "Installati": PKG installati da GitHub con pulsanti Aggiorna + Disinstalla
- Sezione "Solo locali": PKG caricati da PC (non su GitHub) con Pubblica + Copia + Disinstalla
- Sezione "Da installare": PKG disponibili su GitHub non ancora installati
- Pulsante **Carica PKG locale** inline: drag-click su .yaml → installa direttamente in HA
- **Pubblica su GitHub**: legge il PKG da `/config/packages/` e fa PUT su `pkg/` del repo
- `_pkgLoadInstalled()`: fetch asincrono lista PKG installati dal server
- `_ghsPkgInstall/Uninstall/InstallLocal/CopyLocal/Publish`: nuove funzioni esposte su `window`

**pkg/statistiche_ha_2_8.yaml:**
- Aggiunto il pacchetto completo statistiche HA nella cartella `pkg/` del repo

---

## 1.4.63 — 2026-06-14

### feat(SystemCard): v4.8 — popup notifiche completo con tabs, soglie e orari editabili

**card-js/System.js (4.7 → 4.8):**
- **openNotifPopup()**: popup con 6 tab (Notifiche | Alert | Backup | Report | Riavvio | Update)
- **Alert tab**: toggle per ogni alert (RAM/Temp/CPU/Disco/DB) + campo numerico soglia editabile inline, sezione ventola con soglie rack on/off editabili
- **Backup/Report/Riavvio/Update tab**: toggle master + orario editabile (input time → `input_datetime.set_datetime`) + 7 chip giornalieri cliccabili (ha_backup_lunedi…domenica ecc.)
- **Riavvio tab**: gestisce sia HA (ha_riavvio_*) sia Server (server_riavvio_*)
- **Update tab**: on_off_aggiornamenti_ha + orario + notifica_aggiornamenti_* per Core/Supv/Addon/HACS + giorni ha_update_*
- **Soglie input_number editabili**: `input_number.set_value` chiamato on change con flash verde di conferma
- **Orari input_datetime editabili**: `input_datetime.set_datetime` chiamato on change con flash verde
- **openEntitaPopup()**: nuovo popup cliccando su "Entità" — mostra distribuzione per dominio (attributi di sensor.conteggio_entita)
- **haInfoSection**: mostra log avvio HA (sensor.homeassistant_start) come riga extra
- **openEnergiaPopup()**: aggiunto kWh ieri/mese prec/anno prec via `Attr(h, id, 'last_period')`
- **Attr()**: nuova funzione helper per leggere attributi di stato
- **8 toggle** in sezione Automazioni (aggiunto on_off_aggiornamenti_ha e switch ventola fisica se configurato)

---

## 1.4.62 — 2026-06-14

### feat(SystemCard): tutti i sensori PKG configurabili nelle impostazioni (v1.4.62 / SystemCard 4.7)

**card-js/System.js (4.6 → 4.7):**
- **`pkDefaults()`**: nuova funzione con tutti i default dei sensori PKG (24 entity ID)
- **`cfgFor()`**: esteso per includere i campi `pk_*` dal localStorage, unificato con autodetect
- **Sezione impostazioni — "PKG Energia"**: 10 campi configurabili (potenza, kWh oggi/mese/anno, costi oggi/ieri/mese/mese prec./anno/anno prec.)
- **Sezione impostazioni — "PKG Sistema HA"**: 7 campi (uptime HA, uptime server, entità, backup, avvio HA, RAM tot, disco tot)
- **Sezione impostazioni — "PKG Aggiornamenti"**: 6 campi (Core, Supervisor, Addon, HACS store, HACS count, SSL cert)
- **Sezione impostazioni — "PKG Switch"**: campo switch ventola fisica
- **Uptime Server**: nuova sezione `srv-uptime` in `haInfoSection` usando `pk_srv_uptime`
- **Badge SSL**: certificato SSL visibile in `aggSection` se `pk_cert` configurato
- **HACS count**: numero aggiornamenti HACS in `aggSection` da `pk_hacs`
- **Popup Notifiche**: nuovo `openNotifPopup()` — toggle per tutti i `notifica_*` e `alert_*` input_boolean, soglie input_number, orari input_datetime
- **Pulsante "notifiche ›"** nella sezione Automazioni che apre il popup Notifiche
- **Switch ventola fisica**: se `pk_ventola` configurato, appare toggle aggiuntivo nella sezione Automazioni
- Tutti i valori PKG in `render()` e `_patch()` usano `c.pk_*` invece di ID hardcoded
- Card funziona con entity ID diversi per ogni utente: ciascuno configura i propri una volta

---

## 1.4.61 — 2026-06-14

### feat(SystemCard): rinominata Mini-PC, aggiunto pkg statistiche_ha (v1.4.61 / SystemCard 4.6)

**card-js/System.js (4.5 → 4.6):**
- Card rinominata da "Sistema" a "Mini-PC"
- **Sezione Energia**: potenza attuale W, energia oggi kWh, costo oggi/mese € — cliccabile apre popup con dettaglio completo (oggi/ieri/mese/mese prec./anno/anno prec.)
- **Sezione HA Info**: uptime HA, conteggio entità totali, data ultimo backup
- **Sezione Aggiornamenti**: badge Core/Supervisor/Addon/HACS — cliccabile apre popup con stato dettagliato
- **Sezione Automazioni**: 6 toggle (Alert, Backup, Report, Riavvio HA, Riavvio Server, Ventola rack) — click chiama `homeassistant.turn_on/off` su `input_boolean.*`
- **Grafico storico**: click su temp CPU e HA uptime apre popup con grafico ultime 24h
- Tutti i sensori pkg sono nomi fissi (template creati dal pkg YAML) — card funziona uguale per tutti senza configurazione extra
- Aggiunti helpers: `callSvc`, `callApi`, `isOn`, `Attr`, `fmtEur`, `fmtKwh`

---

## 1.4.60 — 2026-06-14

### feat(ClimaCard): ridisegno temi Futuristico/Classico/Minimal con neumorfismo scuro (v1.4.60 / ClimaCard 2.21)

**card-js/Clima.js (2.20 → 2.21):**
- **Futuristico**: telecomando orizzontale neumorfismo scuro — grande pill arrotondata con pulsante power color-coded (rosso/verde), display LED `Courier New` con glow ciano quando acceso, flusso aria animato, ambient glow radiale al fondo, icone mode/fan/swing come pulsanti quadrati in alto a destra
- **Classico**: telecomando verticale — strip in cima con power circle + nome + sensori incastonati, grande display inset con `−  22.0°  +` e glow colorato per modalità, pulsanti modalità sempre visibili con icona+label e bordo colorato quando attivi
- **Minimal**: smart remote compatto — pill principale neumorfismo con power + sensore + display LED, indicatore dot pulsante per stato acceso/spento, strip info modalità/ventola sotto la pill, toggle collassabili per pannelli selezione
- Tutti e 3 i temi: sfondo `#18181b`/`#1a1a1e`, ombre neumorfiche realistiche, nessun bordo aggiuntivo (solo shadow per profondità)

---

## 1.4.59 — 2026-06-14

### feat(ClimaCard): 4 layout visivi completamente diversi (v1.4.59 / ClimaCard 2.20)

**card-js/Clima.js (2.19 → 2.20):**
- **Moderno**: split AC con corpo antracite, display LED verde, aletta RAF, flusso aria — layout invariato
- **Futuristico**: HUD ad anello SVG ciano (270°), scanlines overlay, arco attivo che avanza con la temperatura, punto luminoso al target, font monospace, temperatura grande nel centro dell'anello
- **Classico**: quadrante termostato rotondo SVG con tacche per ogni grado, arco ambra che cresce verso il target, logo marca in foreignObject, colori caldi marrone/ambra, bottoni arrotondati
- **Minimal**: layout tipografico puro — temperatura 72px centrata, nessuna grafica decorativa, pill di stato, pill sensori/ventola, bottoni flat con bordo sottile
- Ogni tema ha HTML/CSS completamente diverso (non semplici cambi di colore)
- Logica, entità, modalità, sensori, aletta sync rimangono identiche in tutti i temi

---

## 1.4.58 — 2026-06-14

### feat(ClimaCard): tema visivo selezionabile (v1.4.58 / ClimaCard 2.19)

**card-js/Clima.js (2.18 → 2.19):**
- **Tema visivo**: aggiunto selettore tema nelle impostazioni con 4 opzioni:
  - **Moderno** (default): look navy scuro con glow colorato in base alla modalità
  - **Futuristico**: sfondo quasi nero, accenti ciano neon (#00e5ff), scanlines overlay sul corpo AC
  - **Classico**: toni caldi marroni/ambra, display LED arancio (#ffa726)
  - **Minimal**: flat dark senza glow, essenziale
- Il tema cambia card background, bordi, corpo AC, display LED, pulsanti +/−, toggle Modalità/Ventola/Alette e aletta fisica — tutta l'estetica visiva. Logica, entità e funzionalità invariate
- Il tema scelto è salvato in localStorage e visibile in anteprima live nelle impostazioni
- `_tv(theme, isOn, mCol)` — nuova funzione interna che restituisce le proprietà visive per il tema selezionato

---

## 1.4.57 — 2026-06-14

### fix(MeteoCard): MDI icons, station popup animation, scrollbar (v1.4.57 / MeteoCard 1.41)

**card-js/Meteo.js (1.40 → 1.41):**
- **Icone MDI**: sostituito `<ha-icon>` (non disponibile nel contesto iframe frarik) con rendering
  tramite MDI webfont (@mdi/font CDN via @import in shadow DOM). Le icone MDI compaiono ora
  correttamente nelle tile della card, nel picker impostazioni e nell'anteprima
- **Stazione — aggiunta entità**: fix popup impostazioni che si chiudeva e riapreva ad ogni click
  su "+ Aggiungi entità" / ✕ elimina. Ora l'aggiornamento è locale alla sezione categorie
  (`#sov-st-cats`) senza rirendere l'intera modale (niente più slide-up animation al click)
- **Scrollbar nascosta**: rimossa la barra di scorrimento visibile in tutti i popup — colonna
  impostazioni (`.sbdy`), colonna anteprima (`.sov-prev`), dropdown entità (`.el`),
  lista oraria previsioni giornaliere (`.hr-list`)

---

## 1.4.56 — 2026-06-14

### feat(MeteoCard): dynamic station entities, sun/moon z-index fix (v1.4.56 / MeteoCard 1.40)

**card-js/Meteo.js (1.39 → 1.40):**
- **Stazione meteo — entità dinamiche**: ogni categoria (Pioggia, Vento, Temperatura, Pressione,
  Umidità) ora ha un'interfaccia dinamica add/remove; è possibile aggiungere quante entità si vuole
  per categoria, con campo entità (autocomplete) + campo nome personalizzabile + pulsante ✕ elimina
- **`stationSensors`**: nuovo campo config `{[catKey]: [{eid, lbl},...]}` in sostituzione dei campi
  piatti fissi; migrazione automatica dal vecchio formato alla prima apertura impostazioni
- **Stazione popup**: `_stationHTML` aggiornato per leggere da `stationSensors` anziché dai campi fissi
- **Sfondo animato — sole/luna**: fix z-index; `.body{z-index:4}` garantisce che testi e dati card
  siano sempre sopra gli elementi `.celestial` (sole/luna) contenuti in `.sky{z-index:0}`

---

## 1.4.55 — 2026-06-14

### feat(MeteoCard): MDI icon picker, emoji/MDI split UX, ha-icon rendering (v1.4.55 / MeteoCard 1.39)

**card-js/Meteo.js (1.38 → 1.39):**
- **Picker icona ridisegnato**: sezione Emoji (sinistra, griglia clickable) + sezione MDI (destra, input con autocomplete)
  - Digitare il nome di un'icona MDI (es. `thermometer`, `weather-sunny`) filtra la lista in tempo reale
  - Selezione chiude la lista e salva l'icona come `mdi:nome`
  - Lista include ~100 icone MDI comuni predefinite
- **Rendering `ha-icon`**: le icone `mdi:*` vengono renderizzate tramite `<ha-icon>` (componente HA nativo)
  sia nelle tile della card che nell'anteprima delle impostazioni
- **Transizione swipe**: range esteso da 0.05 a 5 secondi (era max 2s); rimosso campo "Soglia drag"
  non necessario per l'utente finale
- **`_updateMdiDropdown`**: metodo dedicato per aggiornare il dropdown MDI senza rirendere tutta la sezione

---

## 1.4.54 — 2026-06-14

### feat(MeteoCard): unified tile config, mouse drag, emoji picker, swipe transition fix (v1.4.54 / MeteoCard 1.38)

**card-js/Meteo.js (1.37 → 1.38):**
- **Tile swipe unificate**: le 4 tile fisse (Umidità/Pressione/Vento/Direzione) e le extra sono ora
  in un unico pannello "Tutte le tile swipe" con la stessa interfaccia di personalizzazione:
  sensore opzionale, icona (emoji picker), colore icona, regole colore per soglia
- **`tileCustom`**: nuovo campo config per icona/colore/colorRules delle 4 tile fisse
- **Emoji picker**: pulsante 🔍 nell'icona tile apre griglia di 50+ emoji selezionabili
- **Durata transizione swipe**: nuovo campo `swipeTransition` (default 0.38s), applicato dinamicamente
  via `track.style.transition`; rimozione del valore hardcoded in CSS
- **Drag mouse desktop**: eventi `pointerdown/pointermove/pointerup` per trascinamento con mouse
  oltre al touch esistente; `cursor:grab/grabbing` su `.stats-wrap`
- **Rimossi i pallini** (`.stats-dots`) sotto il carosello — non più necessari
- Fix `setConfig`/`_saveStore`: `tileCustom`, `swipeInterval`, `swipeTransition`, `swipeThreshold`
  ora persistono correttamente nel localStorage

---

## 1.4.53 — 2026-06-14

### feat(MeteoCard): popup redesign, entity colorRules, swipe config, icon sizes, static bg fix (v1.4.53 / MeteoCard 1.37)

**card-js/Meteo.js (1.36 → 1.37):**
- Sfondo statico (`staticBg`): rimuove sole/luna, usa gradiente chiaro di giorno e scuro di notte
- Icone animate più grandi: card principale 64→82px, previsioni 28→36px, popup orario 24→30px
- Popup giornaliero redesign: header con sfondo dorato (data, condizione, min/max, icona meteo 58px),
  colonne ORA/TEMP/PIOGGIA/VENTO con temperatura colorata + barra, precipitazioni con ☂, vento con ⇒
- Configurazione swipe: `swipeInterval` (secondi tra scorrimenti auto) e `swipeThreshold` (px minimi per swipe)
- Statistiche aggiuntive — per ogni entità:
  - Pulsante ⚙ apre sub-pannello inline (senza chiudere/riaprire il modal — bug fix)
  - Campo icona (emoji/testo) + colore icona
  - Regole colore per valore: lista soglia→colore, applica il colore più alto raggiunto
- Bug fix: `addexstat` e `rmexstat` usano `_updateExtraStatsSection()` che aggiorna solo il container,
  senza ricreare l'intero shadow DOM (eliminato il flash/chiusura del popup)

---

## 1.4.52 — 2026-06-14

### feat(Header): toggle icone PC + rimozione pulsante aggiornamento (v1.4.52)

**frarik-addon src/index.html:**
- Aggiunto `#hdr-icons-toggle` (chevron `‹/›`) prima delle icone header
- Tutti i pulsanti header destro racchiusi in `<div id="hdr-icons">` per il collapse
- Rimosso pulsante 🔄 dalla sidebar versione e dall'header mobile versione

**frarik-addon src/style.css:**
- `#hdr-icons`: `max-width` animato, `overflow:hidden`, transizione 0.28s
- `#hdr.icons-hidden #hdr-icons`: `max-width:0; opacity:0; pointer-events:none`
- `#hdr-icons-toggle i`: rotazione 180° con `#hdr.icons-hidden`
- Mobile: `#hdr-icons-toggle` nascosto, `#hdr-icons` sempre visibile con `max-width:none!important`
- Selettori `#hdr>` aggiornati a `#hdr-icons>` (mobile + kiosk mode)

**frarik-addon src/main.js:**
- `_toggleHdrIcons()`: aggiunge/rimuove classe `icons-hidden` su `#hdr`, salva in `localStorage`
- Init: ripristina stato collapse da `localStorage` (`frk_hdr_ico`)
- Rimossa `frarikCheckUpdate` dal window, sostituita con `_toggleHdrIcons`

---

## 1.4.51 — 2026-06-14

### fix(Settings): testo 100% bianco ovunque + versione mobile nell'header (v1.4.51)

**frarik-addon src/style.css:**
- `#epanel { --muted: #fff }` — azzera tutti i grigi/semitrasparenti basati su `var(--muted)`
- Override `#epanel` scoped per colori rgba hardcoded: `.ghs-subhdr`, `.jsst-card-desc`, `.ep-picker-eid`, `.ep-picker-state`, `.ntf-ent-id`, `.ntf-act-type-lbl`, `.brow-mv`, `.fbar-ibtn-lbl`, `.fbar-clm-cur`, `.hbz-add`, `.hbc-btn`, `.ipm-cat`, `.ipm-mdi-lbl`, `.sos-cancel-btn`
- `.ep-sidenav-lbl` e `.ep-content-area .sys-sub`: #fff (da rgba 50-65%)
- `.sos-hdr-sub`, `.sos-person-state`, `.sos-no-contacts`, `.sos-contact-name`: #fff !important
- Mobile: `.ep-sidebar-ver` nascosta, `.ep-hdr-ver` visibile affianco al titolo

**frarik-addon src/index.html:**
- Header subtitle: #fff (da rgba 35%)
- Sidebar version spans: colori inline rimossi (ereditano #fff dalla classe)
- Aggiunto `#ep-hdr-ver` (logo + versione + 🔄) nell'header, visibile solo su mobile

**frarik-addon src/main.js:**
- `#ep-hdr-ver-label` aggiornato con la versione assieme a `#ep-ver-label`

---

## 1.4.50 — 2026-06-14

### feat(Settings): auto-update add-on da GitHub + logo sidebar più grande + badge mobile (v1.4.50)

**frarik-addon server.js:**
- Aggiunto endpoint `POST /api/frarik/self-update` → chiama `http://supervisor/addons/self/update` e riavvia l'add-on automaticamente

**frarik-addon src/main.js:**
- `frarikCheckUpdate()`: ora chiama il nuovo endpoint e mostra progress toast; ricarica la pagina dopo il riavvio
- Rimosse le stringhe "(add-on)" dall'etichetta versione nella sidebar

**frarik-addon src/index.html:**
- Badge versione nella sidebar: logo più grande (42px), testo "Frarik Dashboard" visibile, versione 14px

**frarik-addon src/style.css:**
- Badge versione ripristinato su mobile (compatto: logo 24px, testo ridotto)
- Rimosso selettore CSS inesistente `#ep-sidebar-ver-name`

---

## 1.4.49 — 2026-06-14

### fix(Settings): testo bianco 100%, testi più grandi, mobile responsive (v1.4.49)

**frarik-addon src/style.css:**
- Sidebar tab: `color:#fff` (da 48% opacità), `font-size:14px` (da 12px), padding aumentato
- `.ep-layout { color:#fff }` → eredità bianco su tutti i figli
- `.ep-tab-content *` → color inherit per coerenza completa
- `.sys-lbl`, `.sys-lbl2`, `.sys-sub` → `color:#fff` / `rgba(255,255,255,.65)` (da var(--muted))
- `.ep-tab-hdr-title`: 22px (da 18px); `.ep-tab-hdr-ico`: 20px (da 18px)
- `.ep-tab-content`: padding 30px 36px; `.ep-sidetab`: padding 11px 14px
- Sidebar label `#64748b` → override con `.ep-content-area label { color:#fff }`
- **Mobile `@media(max-width:680px)`**: sidebar diventa barra orizzontale scrollabile in cima,
  tab come pill, scompaiono label/separatori, versione nascosta, contenuto sotto

---

## 1.4.48 — 2026-06-14

### feat(Settings): auto-apri primo tab + componenti inline (v1.4.48)

**frarik-addon src/index.html + src/main.js:**
- Apertura impostazioni → tab Aspetto già attivo (nessuna schermata vuota)
- Rimosso separatore "Componenti": tutti i 9 tab usano `_switchEpTab` uniformemente
- Bottom Bar, Store, Notifiche, SOS mostrano il contenuto direttamente nel pannello destra
  - Spostati `#fb-list`, `#fb-btn-form`, `#fb-enabled-row`, `#ghs-list`, `#ntf-rules-list`, `#sos-cfg-list`
    dai modal overlay ai nuovi pannelli inline (`ep-content-fbar/store/notif/sos`)
  - Modal originali (`#fbmod`, `#gh-store-modal`, `#ntf-cfg-modal`, `#sos-cfg-modal`) svuotati
- `openFBM/openGhStore/openNotifCfg/openSOSCfg` redirezionano alla sidebar invece di aprire overlay
- `closeFBM/closeGhStore/closeNotifCfg` → no-op (la navigazione è gestita dalla sidebar)
- `saveFBM` non chiude più nulla, resta sulla tab corrente

---

## 1.4.47 — 2026-06-14

### feat(Settings): layout sidebar + area contenuto (v1.4.47)

**frarik-addon src/index.html + src/style.css + src/main.js:**
- Sostituito tab bar orizzontale + bottom sheet con sidebar verticale a sinistra
- Sidebar (210px): paste bar, nav tab impilati verticalmente, badge versione in fondo
- Area contenuto a destra: occupa tutto lo spazio rimanente, scrollabile
- Tab Impostazioni (Aspetto/Viste/Sistema/Top Bar/Dati) mostrano contenuto inline a destra
- Tab Componenti (Bottom Bar/Store/Notifiche/SOS) aprono modal dedicati con `›` indicator
- Header per ogni sezione: icona amber + titolo, separato da bordo sottile
- Tab attivo: sfondo amber `rgba(251,191,36,.1)`, bordo amber, testo `#fbbf24`
- Nuovo `_switchEpTab(tab)` sostituisce `_openEpSheet`/`_closeEpSheet`

---

## 1.4.46 — 2026-06-14

### fix(Settings): applica redesign al sorgente corretto (src/index.html)

**frarik-addon src/index.html:**
- Sostituito il corpo `#ep-body` con la nuova struttura tab + sheet
- Tutto il contenuto accordion precedente ora è dentro i pannelli del bottom sheet
- Sezione Aspetto, Viste, Sistema, Top Bar, Dati nei rispettivi `ep-content-*`
- Sezioni Licenza spostata nel tab Dati, rimossi i vecchi `oik-cat` separatori

---

## 1.4.45 — 2026-06-14

### feat(Dashboard): redesign pagina impostazioni con tab + bottom sheet

**frarik-addon src/dom.js + src/style.css + src/main.js:**
- Sostituito il layout a fisarmonica (accordion) con una barra tab orizzontale scrollabile
- Ogni tab apre un bottom sheet (popup dal basso) con lo stile dei popup delle card:
  - Background `#0a0816`, bordo amber `rgba(251,191,36,.25)`, `border-radius:20px 20px 0 0`
  - Animazione `epSheetUp/epSheetDown` (slide da basso, 0.22s)
- Tab disponibili: 🎨 Aspetto, 📄 Viste, ⚙️ Sistema, 🔝 Top Bar, ▭ Bottom Bar,
  🛒 Store, 🔔 Notifiche, 🆘 SOS, ☁️ Dati
- Tab che aprono sheet interno (Aspetto/Viste/Sistema/Top Bar/Dati) vs tab che
  aprono modal dedicati esistenti (Bottom Bar/Store/Notifiche/SOS)
- Header ridisegnato con icona amber, titolo+sottotitolo, X di chiusura
- Centro: area logo/istruzioni + version badge + bottone aggiornamenti
- Nuovo `_openEpSheet(tab)` / `_closeEpSheet()` in main.js
- Corretti riferimenti a `_epToggleGroup('pgpage')` → `_openEpSheet('viste')`
- Aggiunto `frarikCheckUpdate` all'`Object.assign(window, {...})` (era mancante)
- Contenuto Sistema espanso: kiosk, screensaver completo (immagini, entità, card),
  tema automatico, colonna singola mobile
- Contenuto Dati: sync, backup/ripristina, reset layout, pulizia entità, licenza

## 1.4.44 — 2026-06-14

### feat(Meteo): icone meteo animate con SVG

**Meteo.js 1.35→1.36:**
- Nuova funzione `_wxSVG(cond, sz)` — genera SVG animati per tutte le condizioni meteo
- Icone animate: sole con raggi rotanti, luna con stelle tremolanti, nuvola bobbing,
  pioggia con gocce che cadono sfasate, neve con fiocchi rotanti, fulmini lampeggianti,
  nebbia con strisce ondulate, vento con curve oscillanti, grandine, temporale, ecc.
- Usata in: icona grande nella card principale (64px), icone nella griglia previsioni (28px),
  icone nel popup orario giornaliero (24px)
- Keyframes `wxSpin/wxBob/wxRain/wxSnow/wxFlash/wxDrift/wxMoon/wxTwink/wxWarn`
  aggiunti a `_CSS` — disponibili in tutti i shadow DOM che la includono

## 1.4.43 — 2026-06-14

### feat(Meteo): statistiche extra con carosello swipe automatico

**Meteo.js 1.34→1.35:**
- Nuova sezione "📊 Statistiche aggiuntive" nelle impostazioni (max 8 tile extra)
- Ogni tile ha entity ID con autocompletamento + etichetta personalizzata
- Quando ci sono più di 4 tile totali, le statistiche diventano un carosello:
  - Scorrimento automatico ogni 5 secondi
  - Swipe manuale touch (soglia 40px)
  - Dot-indicator cliccabili per navigare direttamente
  - Ultimo gruppo con tile < 4 si espande proporzionalmente (`flex:1`)
- Con 4 tile o meno: layout griglia classico invariato
- `_goCarousel()` / `_initStatsCarousel()` gestiscono timer e touch events
- Timer carousel pulito in `disconnectedCallback`

## 1.4.42 — 2026-06-14

### feat(Meteo): opzione sfondo statico nella card Meteo

**Meteo.js 1.33→1.34:**
- Aggiunto toggle "🎨 Sfondo della card" nelle impostazioni (Animato / Statico)
- Quando statico: lo sfondo mostra solo il gradiente giorno/notte + sole/luna,
  senza stelle animate, nuvole in movimento, pioggia, neve o fulmini
- Salva in `staticBg` nel localStorage; l'anteprima live aggiorna in tempo reale
- Default: Animato (comportamento invariato per card esistenti)

## 1.4.41 — 2026-06-14

### fix(Meteo): Windy embed — layer switching, tab duplicati, zoom esterno, espandi mappa

**Meteo.js 1.32→1.33:**
- Fix layer switching: URL ricostruita da zero ad ogni cambio layer (non modifica URL esistente)
  → elimina il bug "schermata bianca" quando si passa da radar ad altri layer
- Rimosso satellite dalla lista (overlay non disponibile nell'embed gratuito)
- `menu=false&message=false` nella URL Windy → nasconde i tab interni dell'embed
  che duplicavano i nostri bottoni personalizzati
- Bottoni − / + zoom esterni alla mappa (zoom da 3 a 14, ricarica l'iframe con nuovo livello)
- Bottone "⛶ Espandi" per ingrandire la mappa a schermo quasi pieno nel popup
  (toggle, con animazione CSS height transition)

## 1.4.40 — 2026-06-14

### feat(Meteo): nuove entità PirateWeather nella Stazione Meteo

**Meteo.js 1.31→1.32:**
- Pioggia: aggiunto `sPwPrecipProb0d` (sensor.pirateweather_precip_probability_0d)
- Pressione: aggiunti `sPwPressure` (base) + `sPwPressure0d`
- Sole & UV: aggiunti `sPwUvNow` (base) + `sPwUvIndex0d`
- Nuova categoria `🌐 PirateWeather`: `sPwSummary` (base) + `sPwSummary0d`
  con icona dinamica in base al testo della previsione
- Tile testuali (summary) mostrano il testo per intero senza aprire grafico storico
- Seguita regola "solo base + 0d" per entità day-indexed

## 1.4.39 — 2026-06-14

### fix(license): LIC_TTL 2h → 5h per maggiore margine sul piano gratuito KV

## 1.4.38 — 2026-06-14

### fix(license): KV daily limit — cache 2h, gestione errori HTTP Worker

**server.js:**
- `LIC_TTL` aumentato da 30s a 2 ore: riduce le chiamate al Worker da ~2.880/giorno
  a ~12/giorno per dispositivo connesso (240x meno KV writes)
- `checkLicense`: risposta HTTP non-200 dal Worker (429 rate-limit, 500 KV esaurito)
  ora trattata come "offline temporaneo" — si riusa la cache precedente anziché
  invalidare la sessione. Solo una risposta 200 con `valid:false` è una vera negazione.
- Intervallo WebSocket recheck aumentato da 30s a 2h (allineato al LIC_TTL)
- WebSocket revoca solo su `!l.valid && !l.offline` per evitare disconnessioni false
  durante outage Cloudflare

## 1.4.37 — 2026-06-14

### feat(Meteo): Stazione Meteo — animazioni realistiche + tab layer Windy

**Meteo.js 1.30→1.31:**
- Mappa Windy con 10 tab layer (Radar, Satellite, Vento, Temp, Umidità, Press., Nuvole, Pioggia, Neve, Raffiche)
- Pulsante "↗ Apri Windy" per aprire la mappa fullscreen nel browser
- Altezza mappa aumentata a 430px
- Anemometro SVG realistico con 3 coppe che girano a velocità proporzionale al vento
  + freccia direzione vento in tempo reale (dati da entità sWindSpeed/sWindDir)
- Manometro SVG con ago che indica pressione reale (arco 300°, zone colore bassa/normale/alta)
- Termometro con mercurio al livello della temperatura reale + colore dinamico
- Pioggia con densità/velocità gocce proporzionali all'intensità (sRainRate)
- Umidità con numero di bolle proporzionale al valore %
- Sole con raggi proporzionali all'irraggiamento + UV index con colore di rischio
- Tutti i testi del popup (etichette sensori, grafico storico) a bianco 100%

## 1.4.36 — 2026-06-14

### feat(Meteo): Stazione Meteo — popup completo con mappa Windy e sensori

**Meteo.js 1.29→1.30:**
- Aggiunta funzionalità "Stazione Meteo" con popup fullscreen attivabile cliccando sulla card
- 6 categorie di sensori configurabili: Pioggia (11), Vento (6), Temperatura (11), Pressione (2),
  Umidità (3), Sole & UV (7) — totale 40 sensori + 2 speciali (Ghiaccio, Allerte)
- Mappa radar Windy integrata (iframe) con coordinate lat/lon configurabili
- Animazioni CSS per ogni categoria: gocce di pioggia, bussola vento rotante, termometro,
  manometro con arc sweep, bolle umidità, sole con raggi rotanti
- Toggle "Abilita Stazione Meteo" nelle impostazioni con sezione espandibile
- Ogni tile è cliccabile e apre il popup grafico storico (`_openHistPopup`)
- `_stationCSS()`, `_stationHTML()`, `_catAnimHTML()` come metodi dedicati
- `_openStationPopup()` / `_destroyStationPopup()` — shadow DOM separato su document.body
- Tutti i campi stazione persistiti in localStorage (`_saveStore` / `setConfig`)

## 1.4.35 — 2026-06-13

### fix(Meteo): grafici storici 4 entità — parsing formato compresso HA

**Meteo.js 1.28→1.29:**
- Fix "Nessun dato nelle ultime 24 ore" nel popup grafici delle 4 tile stat (Umidità, Pressione,
  Vento, Direzione). Causa: `history/history_during_period` WS con `no_attributes:true` restituisce
  sempre formato compresso (`s.s`, `s.lc`, `s.a`) indipendentemente da `minimal_response`.
  Il parsing leggeva solo i campi del formato pieno (`s.state`, `s.last_changed`) → tutti NaN.
- Ora usa `minimal_response:true` sempre (formato uniforme) e parsing robusto che gestisce:
  - Chiavi compresse (`s`, `lc`, `lu`, `a`) e piene (`state`, `last_changed`, `attributes`)
  - Timestamp come Unix float in secondi (HA ≥2023.6) o come stringa ISO (HA < 2023.6)

## 1.4.34 — 2026-06-13

### fix(mobile): stop blink + dimensioni per-device + grafici meteo su mobile

**main.js:**
- Fix **blink/refresh continuo su mobile**: le preview di configurazione (chiavi `frarik_*___prev__`)
  non triggerano più il sync verso HA server — filtro `___` (triple underscore) nel hook `setItem`
  e nella funzione `_haSaveCfg`. Ogni apertura popup settings non provoca più re-render sul cell.
- Fix **dimensioni card per-device**: `frarik-card-layout` ora salva `cardScale`/`cardW` in
  `localStorage['_frk_layout_{cardId}']` (chiave NON sincronizzata, locale al device) invece di
  `card.cardScale/cardW` nel config HA condiviso. `buildCard()` legge da `_frk_layout_` al posto
  di `card.cardScale/cardW`. Ogni dispositivo ora mantiene le proprie dimensioni indipendenti.

**Meteo.js 1.27→1.28:**
- Fix **grafici storici su mobile**: `_openHistPopup` usa `callWS` (WebSocket già autenticato)
  invece di `callApi` HTTP. Risolve il problema dove su mobile il cookie licenza non veniva inviato
  con le richieste HTTP → la proxy server restituiva 403 → grafici non visibili.
- Slider impostazioni mostra la dimensione device-locale (`_frk_layout_`) invece di quella condivisa.

**Tutte le card JS (Clima 2.17→2.18, System 4.4→4.5, Tapparella 4.7→4.8, Camera 1.10→1.11,
DoorsWindows 1.4→1.5, person-card 1.11→1.12):**
- Slider Altezza/Larghezza nel popup impostazioni legge prima `_frk_layout_{cardId}` (preferenza
  device-locale) per mostrare la dimensione reale di QUEL dispositivo.

## 1.4.33 — 2026-06-13

### fix(Meteo): popup responsive + slider non modifica card senza salvataggio

**Meteo.js 1.26→1.27:**
- Corretto media query `@media(max-width:620px)`: aggiunto `overflow-y:auto` su `.sov-2col`
  e `overflow-y:visible` su `.sbdy`/`.sov-prev` — su mobile le due colonne ora si impilano
  correttamente senza essere tagliate da `overflow:hidden`.
- Rimosso dispatch `frarik-card-layout` dagli handler input di `cardscale`/`cardw`:
  lo slider non altera più la card reale senza salvare.
- `_closeSettings()` dispatcha `frarik-card-layout` con i valori SALVATI per ripristinare
  zoom/width applicati da main.js se l'utente aveva mosso i slider senza salvare.
- Rimosso click-outside per chiudere il popup impostazioni e il popup previsioni giornaliere.

## 1.4.32 — 2026-06-13

### fix(all cards): popup chiudibili solo dalla X, non cliccando fuori

Rimosso il listener `click` sull'overlay che chiudeva il popup al click fuori.
Tutti i popup (configurazione + storico) si chiudono esclusivamente con il pulsante ✕.
File aggiornati: Clima 2.17, DoorsWindows 1.4, System 4.4, Tapparella 4.7, Camera 1.10, person-card 1.11.

## 1.4.31 — 2026-06-13

### fix(all cards): popup 2 colonne responsive su mobile

Su schermi ≤ 600px le due colonne si impilano verticalmente (form sopra, anteprima sotto).
Aggiunta media query `@media(max-width:600px)` con classi `frk-cfg-cols`, `frk-form-col`, `frk-prev-col`
in tutti e 6 i popup con layout a 2 colonne: Clima 2.15→2.16, DoorsWindows 1.2→1.3,
System 4.2→4.3, Tapparella 4.5→4.6, Camera 1.8→1.9, person-card 1.9→1.10.

## 1.4.30 — 2026-06-13

### feat(Camera, person-card): anteprima live + slider Altezza/Larghezza nelle impostazioni

**Camera.js (1.7→1.8):**
- Popup impostazioni riscritto in layout 2 colonne: form telecamere (sinistra) + anteprima live + slider (destra).
- Anteprima usa `render({id:'__prev__'})` con chiave `frarik_cam___prev__`.
- Slider Altezza (zoom) e Larghezza (width%) con debounce 180ms.
- Salvataggio include `cardScale`, `cardW` e dispatcha `frarik-card-layout`.
- Pulsanti Aggiungi/Rimuovi telecamera aggiornano l'anteprima.

**person-card.js (1.8→1.9):**
- Popup impostazioni riscritto in layout 2 colonne: form entità (sinistra) + anteprima live + slider (destra).
- Anteprima usa `render({id:'__prev__'}, bestHass())` con chiave `fratech_personcard___prev__`.
- Rimossi i vecchi input px (larghezza/altezza numerici) → sostituiti dagli slider standard.
- Combobox person/GPS aggiorna l'anteprima in tempo reale.
- Salvataggio include `cardScale`, `cardW`, azzera `w`/`h`, dispatcha `frarik-card-layout`.

## 1.4.29 — 2026-06-13

### feat(all cards): tutti i popup aprono dal basso verso l'alto a schermo intero

Ogni popup di configurazione/impostazioni ora usa il pattern bottom sheet:
- Overlay `align-items:flex-end` invece di centrato
- Modal `width:100%`, `border-radius:20px 20px 0 0`, `border-bottom:none`
- Animazione `slideUp .22s cubic-bezier(.32,1.12,.56,1)` su ogni popup
- Scrollbar nascosta su tutti i contenitori scrollabili
- Colori allineati allo standard: sfondo `#0a0816`, bordo `rgba(139,92,246,.32)`
- Card aggiornate: Meteo 1.25→1.26, Clima 2.15 (già bump), Sistema 4.1→4.2,
  Tapparella 4.4→4.5, Camera 1.6→1.7, DoorsWindows 1.1→1.2, person-card 1.7→1.8

## 1.4.28 — 2026-06-13

### feat(Clima): popup impostazioni 2 colonne + anteprima live + slider dimensioni + grafici 24h

**Settings popup redesign (allineato a standard MeteoCard):**
- Layout 2 colonne: form sinistra (380px) + anteprima live destra.
- Colori standard: sfondo `#0a0816`, bordo `rgba(139,92,246,.32)`, accento `#fbbf24`.
- Toggle switch con colore amber invece di verde.

**Slider Altezza/Larghezza:**
- "Altezza" = CSS `zoom` (20–100%, step 5) via evento `frarik-card-layout`.
- "Larghezza" = `width: X%; max-width: X%` (20–100%, step 5) via evento `frarik-card-layout`.
- Valori persistiti in localStorage (`cardScale`, `cardW`).

**Anteprima live:**
- Preview aggiornata con debounce 180ms su ogni cambio form.
- Usa chiave localStorage `frarik_clima___clmprev__` per isolare dal dato reale.

**Grafici 24h su temperatura e umidità:**
- Click su pill 🌡 temperatura o 💧 umidità → bottom sheet SVG 24h.
- Pattern identico a MeteoCard: `_openHistPopup`, `_destroyHistModal`, `_buildHistChart`.
- Scrollbar nascosta, animazione slideUp, header con icona/titolo/X.
- Clima.js frarik-version 2.14→2.15, config 1.4.27→1.4.28

## 1.4.27 — 2026-06-13

### feat(Meteo): slider Altezza/Larghezza + popup grafico 24h su entità sensore

**Slider rinominati e ridefiniti:**
- "Scala" → "Altezza": CSS `zoom` sulla card, scala proporzionalmente tutto il contenuto in altezza.
- "Alt. min." → "Larghezza": `width: X%` sulla card, stringe la card nella colonna (20%–100%).
- Entrambi live durante il drag, persistiti e restaurati al reload.

**Grafico 24h per le 4 entità della card:**
- Click su Umidità / Pressione / Vento / Direzione → apre bottom sheet con grafico SVG delle ultime 24 ore.
- Usa HA history API (`/api/history/period/...`) con `callApi` del frontend hass.
- Se è configurata un'entità sensor dedicata, usa quella; se usa attributo dell'entità meteo, usa `?minimal_response=false` per leggere l'attributo dalla storia.
- Chart: linea gialla (`#fbbf24`) su sfondo gradiente, etichette Min/Max/Attuale, asse X con ore.
- `.stl { cursor:pointer; }` + hover brightness + active scale.
- Popup bottom sheet (`.hov`/`.hov-modal`) su `document.body` via `_histModalHost` in shadow DOM.
- Scrollbar popup nascosta (`scrollbar-width:none`).
- Meteo.js frarik-version 1.24→1.25, config 1.4.26→1.4.27

## 1.4.26 — 2026-06-13

### feat(Meteo): zoom proporzionale + scrollbar popup nascosta

**Slider "Scala" (CSS zoom proporzionale):**
- Sostituisce il precedente slider larghezza pixel.
- Range 20%–100%, step 5. Applica `zoom: X%` su `#card-{id}` via `frarik-card-layout`.
- A 100% = Auto (dimensione piena della colonna). A 50% = card dimezzata in larghezza E altezza, contenuto tutto visibile e proporzionalmente più piccolo. Nessun clipping.
- CSS `zoom` è supportato da tutti i browser moderni (Chrome, Safari, Firefox 126+).
- Salvato in `card.cardScale`, restaurato al reload via `buildCard`.

**Slider "Alt. min." (min-height via CSS custom property):**
- Range 0–600px. Aggiunge spazio verticale alla card (es. per mostrare più cielo).
- Usa `--card-min-h` custom property (penetra il shadow DOM) → `.card { min-height:var(--card-min-h,0px) }`.
- Salvato in `card.cardMinH`, restaurato al reload via `buildCard`.

**Fix scrollbar popup giornaliero:**
- `.hr-list { scrollbar-width:none; -ms-overflow-style:none; }` + `::webkit-scrollbar { display:none }`.
- La barra di scorrimento invisibile ma il popup rimane scorrevole.

- Meteo.js frarik-version 1.23→1.24, config 1.4.25→1.4.26

## 1.4.25 — 2026-06-13

### fix(Meteo): slider dimensioni in pixel liberi + fix ReferenceError saveData

**Fix critico main.js:**
- `saveData` non esiste → corretto in `saveCfg()` nel listener `frarik-card-layout`. Risolve decine di errori JS nel Centro Notifiche.

**Slider width/height ora in pixel liberi (niente colonne):**
- Rimosso concetto di `colSpan` (numero colonne) dallo slider.
- Slider Larghezza: 0–800px, step 10. 0 = Auto (occupa tutta la colonna).
- Slider Altezza: 0–700px, step 10. 0 = Auto (altezza naturale contenuto).
- La card nel dashboard si ridimensiona in tempo reale durante il drag (event `frarik-card-layout` con `cardW`/`cardH`).
- La preview nell'anteprima mostra le dimensioni corrette.
- main.js `buildCard`: applica `card.cardW`/`card.cardH` al reload pagina (restore persistente).
- MeteoCard: rename `_c.colSpan→cardW`, `_c.minHeight→cardH`, rimosso min-height interno da `_renderCard`.
- Meteo.js frarik-version 1.22→1.23, config 1.4.24→1.4.25

## 1.4.24 — 2026-06-13

### feat(Meteo): modal settings 2 colonne, slider layout live, anteprima card in tempo reale

**Modal più largo (max-width 900px) con layout 2 colonne:**
- Colonna sinistra (400px): tutti i campi di configurazione (entità, città, sensori, giorni).
- Colonna destra: anteprima live + slider dimensioni.
- CSS: aggiunto `.sov-2col`, `.sbdy` con `border-right`, `.sov-prev`, `.prev-wrap`, `.lsect`, `.layout-row`, `.layout-lbl`, `.layout-val`, `input[type=range].lslider`.
- Media query `@media(max-width:620px)` per collassare a colonna singola su schermi stretti.

**Slider dimensioni in tempo reale (no preset):**
- Sostituiti i `<select>` con `<input type="range">` nel pannello destro.
- Altezza: range 0–700px, step 10. Valore 0 = Auto.
- Larghezza: range 1–4, step 1 (colonne).
- Durante il drag (`input` event): label aggiornata live, preview aggiornata, `frarik-card-layout` dispatchato → card nel dashboard si ridimensiona in tempo reale.

**Anteprima live:**
- `<meteo-card id="meteo-preview-card">` istanziata nel pannello destro con `--fgear:none` (gear nascosto).
- `_updatePreview()`: chiama `setConfig()` + `hass=` sulla preview card con i valori temporanei correnti.
- `_schedPrev()`: debounce 180ms, chiamato su ogni `input` di qualsiasi campo.
- `_renderModal()`: setTimeout 60ms dopo il render per inizializzare la preview.
- Meteo.js: frarik-version 1.21 → 1.22

## 1.4.23 — 2026-06-13

### feat(Meteo) + fix: layout card configurabile + popup testi bianchi

**Layout card (Meteo.js + main.js):**
- Nuovo pannello "Layout — Dimensioni card" nelle impostazioni Meteo con 2 select:
  - **Altezza minima**: Auto / 180 / 220 / 260 / 300 / 360 / 420 px. Applicata come `min-height` sul `.card` (le card JS sono già `height:auto` nel container frarik).
  - **Larghezza (colonne)**: 1 / 2 / 3 / 4 colonne. Al salvataggio dispatchizza `frarik-card-layout` (bubbles+composed) che main.js intercetta e aggiorna `sec.colWidths[col]` (sezioni) o `card.colSpan` (legacy grid), poi chiama `saveData()`.
- main.js: `configure(card, el)` ora passa `card` a `cel.configure(card)` e al fallback `_ce.configure(c)`, così Meteo.js conosce il proprio frarik cardId.
- main.js: aggiunto listener `document.addEventListener('frarik-card-layout', ...)` che gestisce sia la modalità sections che la modalità grid legacy.

**Popup testi bianchi:**
- CSS settings modal: `.ssub`, `.fl`, `.eid`, `.eo`, `.ht`, `.scls`, `.en` → `color:#fff`.
- `.ci::placeholder` → `rgba(255,255,255,.35)`. `.eo.sel` → `#fbbf24` (giallo, per distinguere la selezione).
- Bottom sheet orario: `.hr-t`, `.hr-tp`, `.hr-r`, `.hr-w`, `.hr-load` → `#fff`.
- Inline styles: entity ID spans, "Nessuna entità trovata", icona search → bianco/semitrasparente.
- Meteo.js: frarik-version 1.20 → 1.21

## 1.4.22 — 2026-06-13

### fix(Meteo): testo/icone/numeri/simboli 100% bianchi

- Rimossi tutti i `rgba(255,255,255,X)` e `opacity` sui testi della card.
- `.dt`, `.tl`, `.sl`, `.sv`, `.fdn`, `.fm`, `.fmi`, `.fr`, `.sic`, `.gbtn` → `color:#fff` senza opacity.
- `.tdeg` → rimosso `opacity:.85`.
- Meteo.js: frarik-version 1.19 → 1.20

## 1.4.21 — 2026-06-13

### fix(Meteo): tutte le scritte diventano bianche — leggibili su sfondo cielo

- Rimossi tutti gli `style="color:${accent}"` inline dalla card HTML (condizione, icone stat, "Prossimi giorni", "OGGI").
- CSS: `.cond`, `.sic`, `.fct` ora hanno `color:#fff` di default.
- `nc` per il giorno "OGGI" nella griglia previsioni: da `accent` a `#fff` (bianco pieno) vs `rgba(255,255,255,.7)` per gli altri giorni.
- L'accent color (azzurro/viola) rimane solo per bordo card e sfumatura tile — non più per il testo.
- Meteo.js: frarik-version 1.18 → 1.19

## 1.4.20 — 2026-06-13

### fix(Meteo): sole/luna seguono arco visibile nella strip del cielo

- Root cause: `transform:translate(-50%, 50%)` con `bottom` spostava il sole SOTTO l'anchor point di metà SVG (30px), facendolo sforare fuori dalla card e venire clippato da `overflow:hidden`.
- Fix CSS `.celestial`: cambiato in `transform:translate(-50%,-50%)` + `top` invece di `bottom` → l'elemento è centrato esattamente sull'anchor.
- Transizione corretta: `transition:left 60s linear, top 60s linear` (non più `bottom`).
- `_sunPos(az, el)`: arco calcolato su azimuth 70°→290° (E→W), x da 6% a 94%, top da 38% (orizzonte) a 18% (zenith) con seno — rimane sempre nella strip di cielo visibile sopra il contenuto card.
- `_moonPos()`: stesso arco per la luna, calcolato da progressione notturna via `next_rising`/`next_setting` di sun.sun.
- Meteo.js: frarik-version 1.17 → 1.18

## 1.4.19 — 2026-06-13

### fix(Meteo): sky usava a.sunrise/a.sunset che non esistono sulle entità weather HA

- Root cause: le entità `weather.*` di HA non espongono `sunrise`/`sunset` come attributi → il gradiente cadeva sempre sul fallback scuro (`#0a1020→#040818`).
- Fix: tutto il sistema sky usa ora `hass.states['sun.sun']` (sempre disponibile in HA) con attributi `elevation` (gradi -90..+90) e `azimuth` (0..360°) aggiornati in tempo reale.
- `_skyGrad(el, az)`: gradiente in base all'elevazione solare reale (10 segmenti: notte fonda → pre-alba → alba → mattina → mezzogiorno). Toni arancio/oro per tramonto (az>180).
- `_horizonStyle(el)`: glow arancio sull'orizzonte solo quando `|el|<8°` (alba/tramonto reali).
- `_sunPos(az, el)`: posizione SVG sole da azimuth (az 70°-290° → left 6%-94%) e elevation (bottom%).
- `_moonPos()`: arco notturno calcolato da `sun.sun.next_rising`/`next_setting`; fallback orario se non disponibili.
- `_isNightNow(sunState, cond)`: ora usa `sun.state==='below_horizon'` invece di comparare timestamp rise/set.
- `_renderCard`: accento/bordo card ora legge `sun.sun` invece di attributi inesistenti.
- Meteo.js: frarik-version 1.16 → 1.17

## 1.4.18 — 2026-06-13

### feat(Meteo): cielo animato realistico — sole/luna, fasi lunari, meteo dinamico

- **Sky layer**: sfondo animato a tutta card con gradiente che cambia in 9 segmenti dal pre-alba alla notte fonda, calcolato in base a alba/tramonto reali dall'entità HA.
- **Sole**: SVG con raggi e corona radiale, si muove lungo un arco parabolico da E a O durante il giorno. Posizione aggiornata ogni 60s.
- **Luna**: arco opposto durante la notte. Disegnata via SVG con l'algoritmo delle fasi lunari (M luna nuova + A luna piena, archi variabili per crescente/calante/gibbosa ecc). Fase calcolata da data di luna nuova di riferimento 2000-01-06.
- **Stelle**: 58 stelle con posizioni deterministiche, animazione twinkling con opacità e timing variabili. Visibili solo di notte, nascoste quando c'è nuvola ≥75%.
- **Copertura nuvolosità**: nuvole SVG realistiche (ellissi stratificate), opacity e numero basati su `cloud_coverage` dell'attributo HA, con fallback per ogni condizione.
- **Pioggia**: drops diagonali animati via CSS (intensità normale/forte per `rainy`/`pouring`).
- **Neve**: fiocchi con deriva orizzontale e rotazione.
- **Fulmini**: 2 SVG polyline con flash asincroni animati via keyframes.
- **Nebbia**: layer con `backdrop-filter:blur` semi-trasparente.
- **Orizzonte**: glow radiale ambrato durante alba/tramonto, transizione morbida.
- **Timer 60s**: `_updateSky()` aggiorna solo il gradiente, posizione celestiale e opacità stelle — niente re-render completo.
- **Cache `_skyFx`**: effetti meteo (stelle, nuvole, pioggia, neve, fulmini) rigenerati solo quando cambia `condition + coverage`, non ogni minuto.
- **Accento dinamico**: colore accent, tile stats e bordo card cambiano da azzurro (giorno) a viola (notte/condizioni notturne).
- Meteo.js: frarik-version 1.15 → 1.16

## 1.4.17 — 2026-06-13

### feat(Meteo): autocomplete entità sensore nei 4 campi config

- Cliccando su uno dei 4 input (umidità, pressione, vento, direzione) si apre una lista con tutte le entità HA disponibili.
- Digitando si filtra in tempo reale per entity_id o friendly name (max 80 risultati).
- Cliccando un'entità dalla lista la popola nell'input e chiude il dropdown.
- Cliccando su un altro campo chiude il dropdown precedente e apre il nuovo.
- Cliccando fuori dai campi chiude tutti i dropdown.
- Meteo.js: frarik-version 1.14 → 1.15

## 1.4.16 — 2026-06-13

### fix: matita ✏️ apre config card corretta + Meteo giorni configurabili

- **main.js `_registerLovelaceCard`**: aggiunto hook `configure(card, el)` al wrapper lovelace — cerca `.frarik-lovel` nell'elemento container e chiama `cel.configure()`. Questo fa sì che la matita apra la config specifica di Meteo, Antizanzare, Differenziata, Irrigazione invece del popup generico frarik.
- **main.js `cardMenu`**: fallback migliorato — usa `_vEl.querySelector('.frarik-lovel')` invece di `firstElementChild` per trovare il custom element anche quando è wrappato in `.lovel-wrap`.
- **Meteo.js `wfDays`**: aggiunto campo "Giorni previsioni (1–10)" nel pannello config. Valore salvato in localStorage, rispettato in `setConfig`. La griglia previsioni ora usa `auto-fit` per adattarsi automaticamente al numero di giorni scelto.
- Meteo.js: frarik-version 1.13 → 1.14

## 1.4.15 — 2026-06-13

### fix: Meteo config via matita + popup orario bottom sheet + filtro oggi

- **main.js `_mountYamlCard`**: card `custom:` non usano più l'iframe HA (il modal settings usa `document.body` del documento principale — dentro iframe sarebbe inaccessibile). Queste card usano sempre il renderer interno. Dopo mount, se `el.configure` esiste viene salvato come `container._fConfigure`.
- **main.js `cardMenu`**: controlla `_vEl._fConfigure()` prima di `firstElementChild.configure()` prima di `openCM()`. La matita ✏️ ora apre la config specifica della card (Meteo settings) invece del popup generico frarik.
- **Meteo popup orario**: cambiato da modal centrato a **bottom sheet** — sale dal basso, border-radius in alto, occupa tutta la larghezza, max-height 85vh, animazione `slideUp`.
- **Meteo filtro "oggi"**: cambiato da `datetime.startsWith(dayStr)` a confronto via `Date.getFullYear/Month/Date()` (locale) — risolve il problema delle previsioni orarie di oggi che non comparivano per problemi di timezone.
- **Meteo orario**: ora formattata con `toLocaleTimeString` (HH:MM locale) invece di slice raw della stringa ISO.

## 1.4.14 — 2026-06-13

### feat(Meteo): config entità custom + popup orario giorni previsione

- **4 entità configurabili** nel pannello impostazioni (✏️ in edit mode): Umidità, Pressione, Velocità vento, Direzione vento. Se compilate, usano lo stato del sensor HA corrispondente con unità di misura; se vuote, cadono sull'attributo dell'entità meteo.
- **Popup orario per ogni giorno**: cliccando su un giorno nelle previsioni (aperte con il tasto "Prossimi giorni") si apre un modale fisso con le previsioni ora per ora del giorno selezionato — ora, icona condizione, temperatura, precipitazioni (mm + % probabilità), velocità e direzione vento.
- Previsioni orarie recuperate via `weather/subscribe_forecast` (hourly) → `get_forecasts` (hourly) → `get_forecast` (hourly), stesso pattern robusto delle previsioni giornaliere.
- `.fcc:hover` evidenziato per indicare che i giorni sono cliccabili.
- Meteo.js: frarik-version 1.11 → 1.12

## 1.4.13 — 2026-06-13

### fix: gear mai visibile + configurazione card via matita ✏️

- **Gear sempre nascosto** (anche in edit mode): rimosso `body.editing { --fgear: flex }` da style.css. La custom property `--fgear: none` è permanente — il bottone gear non compare mai.
- **Matita apre la config interna delle card**: `cardMenu()` ora cerca `_ce.configure()` sul primo figlio del container `#v-${cardId}` (custom element) prima di fallire su `openCM()`.
- **Meteo.js**: aggiunto `configure() { this._openSettings(); }` — la matita apre il pannello selezione entità meteo.
- **Antizanzare.js**: aggiunto `configure()` che imposta `_settingsOpen=true` e ri-renderizza.
- **Differenziata.js**: stesso pattern.
- **Irrigazione.js**: stesso pattern (chiude anche `_historyOpen`).

## 1.4.12 — 2026-06-13

### feat: rimozione icona ⚙️ da tutte le card — interfaccia pulita

- **Gear icon rimossa da tutte le card** in modalità normale. In edit mode la rotella rimane accessibile tramite la matita ✏️.
- **DoorsWindows.js**: rimosso `<div class="dwc-gear">⚙️</div>` dall'HTML, rimosso CSS `.dwc-gear`, rimosso click handler gear. Il configure è già disponibile tramite `configure: openCfg` nel registry (✏️ in edit mode).
- **person-card.js**: rimosso `<div class="pc-gear">⚙️</div>` da entrambe le view (normale + vuota), rimosso CSS `.pc-gear`, rimosso check `act === 'gear'`. Aggiunto `configure: (card, el) => openConfig(card, el)` al CARD object — ora ✏️ in edit mode apre la configurazione.
- **Antizanzare.js / Differenziata.js / Irrigazione.js** (shadow DOM): aggiunta regola CSS `button[data-action="toggleSettings"] { display: var(--fgear, none); }` nel CSS interno del componente. La custom property `--fgear` è `none` in modalità normale, `flex` in edit mode (definita in `style.css`).
- **Meteo.js** (shadow DOM): aggiunta regola CSS `button[data-a="gear"] { display: var(--fgear, none); }`.
- **style.css**: aggiunto `body { --fgear: none }` + `body.editing { --fgear: flex }` — la custom property attraversa il confine shadow DOM.
- **Camera.js / Tapparella.js**: aggiornati testi placeholder che riferivano a `⚙️` → ora puntano a `✏️` in edit mode.

## 1.4.11 — 2026-06-13

### feat: menù ⋮ sulla card + rimozione frecce ridimensionamento dal popup

- **Frecce ◀▶▲▼ rimosse definitivamente** dal popup di configurazione (erano in `_cfgActionsHTML`). Dead code `_ovSize` rimosso. Le frecce non compaiono più in nessun popup di configurazione.
- **Azioni (Duplica, Copia, Taglia, Copia su vista, Elimina) rimosse dal popup** config card: non vengono più iniettate tramite `_attachCfgActions` / `_injectActionsIntoLastOverlay` / `_injectActionsIntoYaml`. `cardMenu()` semplificato.
- **Nuovo bottone ⋮ (dots-vertical) su ogni card** in modalità modifica: appare nell'overlay (accanto alla matita ✏️) per tutti i tipi di card (standard, js-custom, yaml, weather, header-bar, footer-bar). Visibile SOLO in edit mode grazie ai container `.card-ov` / `.hbar-ctrl` che esistono già solo in quella modalità.
- **`cardDotMenu(cardId, el, e)`**: apre un dropdown posizionato vicino al bottone con le 5 azioni (Duplica, Copia, Taglia, Copia su vista, Elimina). Si chiude su click esterno. Animazione `popIn`. Usato da tutte le card presenti e future.

## 1.4.10 — 2026-06-13

### fix: menu mobile Android + loop sync + rimozione toast automatico

- **Menu lampeggia su Android**: il backdrop creato in 1.4.9 veniva chiuso dai ghost tap di Android perché il browser li instrada all'elemento visivamente sopra (il backdrop stesso). Fix: aggiunto debounce di 300ms sul click handler del backdrop — i ghost tap che arrivano entro 300ms dalla creazione vengono ignorati.
- **Loop sync card configs**: la patch `localStorage.setItem` introdotta in 1.4.9 triggherava il push al backend anche quando le card scrivevano lo stesso valore durante l'init (Android fa init diverso da iOS). Questo causava un push inutile → PC riceveva un `_ts` più nuovo → toast su PC → push PC → toast su Android → loop. Fix: aggiunto controllo `v !== old` (confronto prima/dopo) — sync solo se il valore cambia davvero.
- **Toast "Plancia e card sincronizzate" rimosso**: il toast automatico in `_applyRemoteCfg` compariva ad ogni sync in background (inutile e fastidioso, specialmente su Android). Rimosso. Il push manuale ("Sync to HA") mantiene il proprio feedback.

## 1.4.9 — 2026-06-12

### fix: flickering menu mobile (backdrop) + auto-sync config card al salvataggio

- **Flickering definitivamente risolto — approccio backdrop**: invece di `document addEventListener click` con delay/debounce (soggetto a ghost tap), ora viene creato un `<div id="mfab-backdrop">` trasparente `position:fixed; z-index:12000` SOTTO il menu (z-index 12001). Qualsiasi click fuori dal menu colpisce il backdrop → `closeMobileMenu()`. Il backdrop blocca i ghost tap in modo nativo: il secondo tap non può raggiungere il menu né riaprire tramite `toggleMobileMenu` perché `closeMobileMenu` setta `_mfabOpenTime=Date.now()` e il debounce da 300ms blocca la riapertura immediata.
- **Card configs sincronizzate automaticamente**: patch di `Storage.prototype.setItem` dentro la IIFE principale. Ogni volta che una card JS (Camera, Clima, ecc.) salva in `localStorage` con chiave `frarik_*`, la modifica trigghera `_haSaveCfgDebounced()` automaticamente. Questo risolve il caso in cui le card erano configurate su PC ma non comparivano su mobile perché il payload backend non veniva mai aggiornato (le card non chiamano `saveCfg()`). Il guard `!_cfgSyncing` evita il loop durante `_applyRemoteCfg`.

## 1.4.8 — 2026-06-12

### fix: flickering menu mobile + card configs sync + niente toast al cambio vista

- **Flickering menu mobile (3 livelli di protezione)**: i ghost tap iOS/Android arrivano entro ~200ms dal tap reale e triggheravano `_mfabOutside` chiudendo/riaprendo il menu più volte. Fix: (1) debounce unificato da 300ms su qualsiasi azione in `toggleMobileMenu`; (2) `_mfabOutside` aggiunto con delay 300ms (era 0ms); (3) time-guard in `_mfabOutside` come fallback.
- **Card non configurate su mobile**: le configurazioni delle card JS (Camera, Clima, ecc.) sono salvate in `localStorage` con chiavi `frarik_*`. Non facevano parte del payload di sync backend. Ora `_haSaveCfg` le raccoglie tutte e le include in `cardCfgs`, e `_applyRemoteCfg` le applica sul device ricevente.
- **Toast + refresh inutile al cambio vista**: `setActivePage` chiamava `saveCfg()` che bumpava `_ts` e pushava al backend → altri device pullavano, mostravano il toast e ri-renderizzavano. Cambiato in `_saveCfgLocalOnly()` → il cambio vista è puramente locale, zero impatto sugli altri device.

## 1.4.7 — 2026-06-12

### fix: menu mobile — Viste non funzionava + flickering apertura

- **`_mfabViews` non esposta su `window`**: il pulsante "Viste" usa `data-action2="_mfabViews"` che richiede `window._mfabViews`. La funzione non era nell'`Object.assign(window,{...})` → il sub-menu viste non si apriva mai. Aggiunta.
- **Flickering apertura menu**: su mobile il browser spara un ghost click sintetico entro ~300ms dopo il tap reale. Questo secondo evento trovava il menu già aperto e lo richiudeva immediatamente. Fix: `toggleMobileMenu` ignora le chiusure rapide entro 300ms dall'apertura (`_mfabOpenTime`).

## 1.4.6 — 2026-06-12

### fix: viste indipendenti per dispositivo + menu mobile viste

- **activePage isolato per dispositivo**: la vista attiva non viene più sincronizzata tra PC, tablet e cellulare. Ogni dispositivo mantiene la propria vista corrente indipendentemente.
  - `_applyRemoteCfg`: preserva l'`activePage` locale prima di applicare la config remota.
  - `_haSaveCfg`: non include `activePage` nel payload inviato al backend.
- **Fix menu viste da mobile**: il `<div class="vm-go">` nel menu viste aveva il `>` di chiusura mancante → cliccando sulle viste non succedeva niente. Corretto.
- **Fix chiusura menu viste su mobile**: `_viewsOutside` controllava `views-btn` (assente su mobile) con `&&b&&` → il menu non si chiudeva mai cliccando fuori. Corretto con `(!b||!b.contains(...))`.

## 1.4.5 — 2026-06-12

### style: Clima v2.14 — rimozione sfondo tempRow + fix centramento +/−

- Rimosso `background:rgba(255,255,255,.06)` e `border-radius` dal contenitore temperatura (nessun sfondo grigio visibile).
- Aggiunto `line-height:1` e `font-size:22px` ai bottoni +/− → simboli perfettamente centrati nel riquadro scavato.

## 1.4.4 — 2026-06-12

### style: Clima v2.13 — rimozione bordo tempRow + centramento contenuto tog

- Rimosso `border:1px solid` dal contenitore +/− temperatura.
- Aggiunto `justify-content:center` ai bottoni tog → icone e testo centrati verticalmente nel riquadro scavato.

## 1.4.3 — 2026-06-12

### style: Clima v2.12 — effetto scavato (neumorphic) su tog e pulsanti ±

- Bottoni Modalità / Ventola / Alette: rimosso il bordo, aggiunto `box-shadow: inset` per effetto scavato. Attivo = stesso scavato + outline bianca sottile.
- Pulsanti +/− temperatura: stesso trattamento. Sfondo `#060c18`, shadow inset, nessun bordo.

## 1.4.2 — 2026-06-12

### fix: Clima v2.11 — pallino sync aletta corretto + supporto cover

- **Logica pallino**: verde se clima ON + aletta APERTA oppure clima OFF + aletta CHIUSA (sincronizzati); rosso se clima ON + aletta CHIUSA o clima OFF + aletta APERTA (desincronizzati).
- **Supporto entità cover**: prima `flapPhys` controllava solo `state === 'on'` (binary_sensor/switch). Ora supporta anche le entità `cover` con stati `'open'` e `'opening'`, così il pallino funziona indipendentemente dal tipo di entità configurata.

## 1.4.1 — 2026-06-12

### fix: Camera v1.6 — snapshot refresh immediato, HLS, fix schermo grigio

## 1.4.0 — 2026-06-12

### Plancia salvata nell'add-on (file invece di user-data HA)
- La configurazione della dashboard (pagine, card, layout) ora si salva in un **file dell'add-on**: `/config/frarik/cfg.json`, tramite gli endpoint `/api/frarik/config` (gated da licenza). Prima usava gli user-data di HA via WebSocket.
- Vantaggio: **una plancia per istanza**, gestita dall'add-on e indipendente da quale utente HA la apre.
- **Migrazione automatica**: al primo avvio, se il file è ancora vuoto ma sul dispositivo c'è già una plancia (cache locale), viene scritta sul file in automatico. Nessuna azione manuale, nessuna perdita.
- La copia locale (`localStorage`) resta come cache rapida; il merge "vince il più recente" è invariato.

## 1.3.1 — 2026-06-12

### Pulizia legacy
- Rimosso il vecchio sistema multi-profilo (`PROFILES`): niente più URL Nabu Casa né IP locali hardcoded nel bundle, niente fallback `/local`. La dashboard funziona solo come add-on (pannello Frarik), via proxy gated da licenza.
- Rimossi token e box "URL/token" di connessione, ora inutili (il token lo gestisce il backend).

## 1.3.0 — 2026-06-12

### Licenza lato server + addio token (cambio architetturale)
- **Solo la chiave licenza**: l'utente installa l'add-on, apre il pannello Frarik e inserisce la chiave. Niente più URL Nabu Casa, niente token di lunga durata da creare.
- **Il token HA non esiste più nel browser**: il backend dell'add-on fa da **proxy** verso Home Assistant usando il `SUPERVISOR_TOKEN` interno (REST + WebSocket via `homeassistant_api`). Le credenziali HA non transitano mai lato client.
- **Revoca davvero istantanea e inaggirabile**: il backend è il gatekeeper. Valida la chiave col Worker (cache 30s) e ricontrolla ogni 30s anche sulle connessioni WebSocket aperte → alla revoca la dashboard smette di ricevere dati subito, anche senza ricaricare. Non è aggirabile lato client perché senza licenza valida il proxy non passa nulla.
- **Sicurezza**: rimossi dal bundle i token di lunga durata che vi erano hardcoded. ⚠️ I vecchi token vanno revocati manualmente da HA (profilo → token di lunga durata).
- Il controllo licenza lato client in modalità add-on passa ora dal backend same-origin (`/api/frarik/license`): elimina i problemi CORS/WebView dell'app mobile.

## 1.2.53 — 2026-06-12

### fix: Camera v1.6 — snapshot refresh immediato, HLS, fix schermo grigio

- **Fix schermo grigio**: nessun `<img>` senza src nel DOM. Per cam senza entity_picture mostra sfondo scuro + "CONNESSIONE STREAM..." invece del rettangolo grigio Chrome.
- **Snapshot refresh immediato**: parte subito come baseline (aggiorna ogni 2s). Niente più attesa prima di vedere qualcosa.
- **HLS via camera/stream**: tentativo parallelo tramite WS HA → URL HLS → `<video>` nativo (Safari) o HLS.js da CDN (Chrome). Utile per cam senza entity_picture (campanello).
- **Tre stream in parallelo**: HLS + WebRTC + MJPEG. Il primo che funziona vince e ferma il refresh snapshot.
- **Fix `_stopSnap` su win**: `onWin` chiama `_stopSnap` → il refresh non sovrascrive più il video live.

## 1.2.52 — 2026-06-12

### Licenze: revoca effettiva anche nell'app mobile
- L'app Home Assistant (e i WebView in genere) tengono la pagina **in memoria** senza ricaricarla e sospendono i timer in background: così una licenza revocata restava "attiva" finché non si ricaricava. Ora la validazione viene rilanciata anche al **ritorno in primo piano** (`visibilitychange`/`pageshow`/`focus`), così riaprendo la dashboard una chiave revocata viene bloccata subito. Intervallo periodico ridotto a 30 min.

## 1.2.51 — 2026-06-12

### Licenze: la revoca ora ha effetto
- La licenza veniva ri-controllata solo **ogni 24h** e lo stato era salvato nel **browser** del client (un riavvio di Home Assistant non lo cancella): perciò una chiave **revocata** continuava a funzionare fino a 24h. Ora la chiave salvata viene **ri-validata ad ogni avvio/refresh** e **ogni ora** mentre la dashboard è aperta: una chiave revocata o scaduta viene bloccata subito. In caso di server licenze irraggiungibile resta una tolleranza di 3 giorni (così un'interruzione temporanea non blocca le licenze valide).
- Allineate le versioni dell'add-on (package.json/config.yaml).

## 1.2.50 — 2026-06-12

### fix: Camera v1.5 — WebRTC e MJPEG in parallelo, fix race condition ontrack

- **Fix critico**: `pc.ontrack` ora viene settato PRIMA di `createOffer()`. Prima era settato dopo `setRemoteDescription()`, causando una race condition su reti veloci (il track arrivava prima che il listener fosse registrato → video mai montato).
- **WebRTC e MJPEG in parallelo**: entrambi partono contemporaneamente al click. Il primo che produce un frame vince. Nessun'attesa di 10s del fallback WebRTC prima di provare MJPEG.
- **Timeout WebRTC ridotto a 5s** + race interno con `Promise.race` sul WebSocket (camera/webrtc/offer). Se go2rtc non risponde entro 5s, la connessione viene chiusa senza aspettare il timeout globale sendAndWait (10s).
- **Click istantaneo**: usa `thumbEl.src` già in cache nel browser invece di rifare la richiesta snapshot all'apertura.
- **Generazione slot** (`_streamSlot`): tutte le callback async verificano la generazione corrente — zero conflitti su click rapidi tra telecamere.
- Rimossa subscription ICE candidate (go2rtc usa ICE completo nell'SDP answer, nessun trickle ICE necessario).

## 1.2.49 — 2026-06-12

### fix: Camera v1.4 — WebRTC live via go2rtc (come camera_view: live in HA)
- `_tryWebRTC()`: usa `camera/webrtc/offer` via WebSocket HA (identico a come fa la card nativa HA con camera_view: live). Latenza < 1s, vero real-time.
- Sequenza: WebRTC (go2rtc) → MJPEG → snapshot 2s. Ogni step tenta prima il precedente.
- Click su miniatura: snapshot istantaneo → WebRTC avvia in background → video `<video srcObject>` sostituisce il placeholder al primo frame.
- `_cancelPending()` chiude anche la RTCPeerConnection precedente per evitare leak.
- Timeout 10s su WebRTC per non bloccare il fallback MJPEG.

## 1.2.48 — 2026-06-12

### fix: Camera v1.3 — switch istantaneo + MJPEG live senza HLS
- Rimosso HLS (aggiungeva 2-5s di latenza, incompatibile con "live in tempo reale").
- Click su miniatura mostra subito lo snapshot cached (risposta istantanea), poi carica MJPEG in background: quando arriva il primo frame sostituisce il placeholder senza flash.
- `_cancelPending()` annulla il caricamento MJPEG precedente alla velocità del click successivo.
- Fallback snapshot ogni 2s per telecamere senza MJPEG (prima era 3s).
- Nessuna chiamata async bloccante nel percorso del click.

## 1.2.47 — 2026-06-12

### fix: Camera v1.2 — HLS live fluido + fallback gray screen
- **Stream principale ora tenta HLS via WebSocket HA** (`camera/stream`): se go2rtc è configurato, usa `<video>` con HLS (fluido, ~1-3s latenza). Su Safari nativamente; su Chrome/Firefox carica HLS.js da CDN.
- **Fallback a cascata**: HLS → MJPEG (`camera_proxy_stream`) → snapshot con refresh ogni 3s. Risolve il gray screen su telecamere che non supportano MJPEG.
- `camMjpegUrl()` ora ritorna stringa vuota se `entity_picture` non contiene `/api/camera_proxy/`, evitando URL non validi.
- `_applyMainStream()` gestisce il tutto in modo asincrono senza bloccare il render.
- Istanze HLS.js vengono distrutte correttamente al cambio telecamera.

## 1.2.46 — 2026-06-12

### fix: Camera — stream live e click senza re-render (v1.1)
- Vista principale usa `/api/camera_proxy_stream/` (MJPEG live) invece dello snapshot statico.
- Click su miniatura fa solo swap del `src` + aggiorna highlights — nessun re-render, nessun flash.
- `update()` aggiorna solo i badge batteria e l'overlay "non disponibile", non tocca lo stream.
- Miniature continuano a usare snapshot con refresh ogni 10s per non saturare la connessione.

## 1.2.45 — 2026-06-12

### feat: nuova card Telecamere (Camera.js v1.0)
- Vista principale grande con snapshot aggiornato ogni 8 secondi.
- Miniature cliccabili per tutte le altre telecamere configurate (con scorrimento orizzontale se >4).
- Indicatore batteria colorato (verde/giallo/arancio/rosso) + percentuale su ogni telecamera a batteria; icona 🔌 per quelle a corrente.
- Configurazione: aggiunta/rimozione telecamere con nome, entità e sensore batteria opzionale (autocomplete da stati HA).
- Gestione telecamera non disponibile, placeholder se snapshot mancante.
- Supporto `duplicate` per copiare la configurazione quando si duplica la card.

## 1.2.44 — 2026-06-12

### fix: Clima — aletta quasi invisibile quando AC spento
- Quando il clima è spento, l'aletta usa il colore del corpo (`#141c2c`) con solo una sottile linea di fessura scura, simulando il pannello chiuso che si fonde con la plastica.
- Quando acceso, l'aletta mostra il pannello blu completo come prima.
- Clima.js aggiornata a **v2.10**.

## 1.2.43 — 2026-06-12

### fix: Clima — animazione aletta sempre in esecuzione (swing)
- Sostituita l'animazione CSS (`@keyframes`) con un loop `requestAnimationFrame`: `cancelAnimationFrame()` ferma l'oscillazione istantaneamente, senza problemi di cascade CSS.
- Aggiunto `_swingIsActive()`: tratta `"stopped"`, `"off"`, `"none"`, `"fixed"` come swing fermo — supporto ai dispositivi che usano valori diversi da `"off"` (es. Daikin con `"stopped"/"rangefull"`).
- Clima.js aggiornata a **v2.9**.

### feat: duplica/copia card JS — copia anche la configurazione
- `dupCard` e `_copyCardToPageDo` chiamano ora `_cardDuplicateHook(src, copy)`, che invoca `card.duplicate(src, copy)` se definita nel registry.
- Clima.js implementa `duplicate()`: copia l'entry localStorage della card sorgente nella nuova card, così la card duplicata parte già configurata (entity, brand, sensori, ecc.).

## 1.2.42 — 2026-06-10

### fix: Tapparella — configurazione spostata nel popup ✏️
- Rimossa l'icona ⚙️ dall'interno della card Tapparella.
- Il popup "Configura" (✏️ → ⚙️) ora apre direttamente la configurazione interna della card (nome + entità).
- Le card JS custom che espongono `configure` nel loro oggetto usano d'ora in poi questa logica in automatico.

## 1.2.41 — 2026-06-10

### feat: modalità modifica — una sola icona ✏️ con popup azioni
- In modifica ogni card mostra ora **una sola icona ✏️**. Cliccandola si apre un popup con: **Configura, Duplica, Copia, Taglia, Copia su vista, Elimina** e i controlli di **dimensione**. Niente più fila di pulsantini sulla card.

## 1.2.40 — 2026-06-10

### feat: le card JS possono suggerire la dimensione
- Quando si aggiunge una card dallo store, ora rispetta `colSpan`/`rowSpan` dichiarati dalla card (default 2×2). Es. la card Tapparella nasce alta.

## 1.2.39 — 2026-06-09

### Fix: pulsante "mappa icona per stato" nell'editor header
- `hbAddIconMap` non era esposta su `window` → il pulsante "+" per aggiungere una regola icona-per-stato (editor chip dell'header) non faceva nulla. Ora è esposta e funziona.

## 1.2.38 — 2026-06-09

### Fix: auto-scale disattivato (loop / errore JS)
- L'auto-scale (1.2.33) entrava in loop con le card che hanno un proprio ResizeObserver (es. person card), causando re-render continui ed errori `getBoundingClientRect`. Disattivato. Le card tornano stabili.

## 1.2.37 — 2026-06-09

### Installa card da URL
- Dal menu "+ Card" → **🔗 Installa card da URL**: incolla l'URL (GitHub raw o blob) di un file `.js` in formato FratechStore e la card viene scaricata, registrata e installata nello store locale. Utile per le card community esterne.

## 1.2.36 — 2026-06-09

### Popup Panel
- Nuova card **🪟 Popup** (dal menu "+ Card"): è un pulsante che **apre una vista come finestra modale** con dentro tutte le card di quella vista. In modifica scegli quale vista apre (🪟), in vista normale il click la apre. Così "contieni" le card in una vista e le richiami in popup da qualsiasi pagina.

## 1.2.35 — 2026-06-09

### Temi: colore personalizzato + import/export
- Pannello → Aspetto → Tema colore: oltre ai preset, **colore personalizzato** (color picker, deriva accento/glow) e **Esporta/Importa tema** come file `.json`.

## 1.2.34 — 2026-06-09

### Pulizia entità (HA)
- Nuovo strumento (Pannello → Dati → 🧹 Pulizia entità): elenca le entità del registro HA, filtro per nome/id, toggle "solo non disponibili" (preselezionate), rimozione massiva via `config/entity_registry/remove` con **backup automatico** dell'elenco rimosso e conteggio di quelle non rimovibili.

## 1.2.33 — 2026-06-09

### Copia card su un'altra vista + Auto-scale
- **Copia card su un'altra vista**: nuovo pulsante 📑 nell'overlay della card (in modifica) → menu con le altre viste, clona la card lì.
- **Auto-scale**: se il contenuto di una card **sborda** in larghezza dal suo contenitore, viene rimpicciolito per rientrare (le card che ci stanno già non vengono toccate; disattivo in modalità modifica).

## 1.2.32 — 2026-06-09

### Dati: Reset layout + Backup/Ripristina esposti
- Nuova sezione "Dati" nel pannello: **Esporta backup**, **Ripristina backup** (prima erano funzioni non collegate a pulsanti) e **Reset layout (vista corrente)**.
- **Reset layout**: svuota la vista corrente riportandola a un layout vuoto di partenza (scarica prima un backup automatico). Altre viste, temi e impostazioni restano.

## 1.2.31 — 2026-06-09

### Annullati px su tutte le card e spostamento libero
- Rimossi i campi px nell'editor e il posizionamento libero delle card: si torna alle card a dimensione naturale/colonna (come 1.2.29). La person-card mantiene i suoi px.

## 1.2.30 — 2026-06-09

### Px su tutte le card + posizionamento libero nella colonna
- Nell'editor di **ogni card** ci sono i campi **Larghezza/Altezza in px** (vuoto = automatico).
- In modifica, ogni card ha una **maniglia ✥** in alto a sinistra: trascinala per **posizionare la card dove vuoi** nella colonna (senza vincoli, anche affiancate/sovrapposte). **Doppio clic** sulla maniglia = rimetti la card nella pila.

## 1.2.29 — 2026-06-08

### Rimossi i contenitori
- Tolte pila orizzontale/verticale e griglia: si torna alle colonne semplici (come 1.2.25).

## 1.2.28 — 2026-06-08

### Contenitori: comportamento corretto come HA
- **Griglia**: celle **quadrate** di default (square=true) e **colonne decise da te** (default 3); riempie da sinistra a destra andando a capo.
- **Pile (verticale/orizzontale)**: ogni card ha la **propria altezza** regolabile (campo px nella lista del popup); la verticale a larghezza piena, l'orizzontale a larghezza uguale.

## 1.2.27 — 2026-06-08

### Contenitori con editor a popup (come HA)
- Creando un contenitore (pila orizzontale/verticale/griglia) si apre un **popup di configurazione** in stile Home Assistant: **titolo**, (griglia) **colonne** + **schede quadrate**, e la **lista delle card** dentro.
- Dal popup: **+ Aggiungi card** (Store/incolla), **✏️ modifica**, **↑↓ riordina**, **🗑 elimina** ogni card; **Salva**.
- Sul contenitore nel dashboard l'icona **⚙️** riapre il popup.

## 1.2.26 — 2026-06-08

### Contenitori stile HA (fase B): pila orizzontale, verticale, griglia
- Dal pulsante **"+ Card"** di una colonna ora puoi aggiungere, oltre alle card normali, dei **contenitori**: **Pila orizzontale**, **Pila verticale**, **Griglia**.
- Dentro un contenitore premi **"+ card"** per aggiungere card (dallo Store o incollate): si dispongono affiancate / impilate / a griglia.
- La griglia ha un'icona **▦** per impostare il numero di colonne; il **🗑** elimina il contenitore (e le card dentro).
- Le card figlie restano modificabili come le altre (matita/duplica/elimina).

## 1.2.25 — 2026-06-08

### Colonne per pagina, fluide (verso il layout stile HA)
- Annullate le colonne a px fisso della 1.2.24: le colonne tornano **fluide** e si **distribuiscono sulla larghezza dello schermo**.
- Nel pannello configurazione c'è il selettore **"Colonne pagina" (1-4)** che imposta le colonne dell'intera pagina/vista; aggiungi/togli colonne e la larghezza si adatta.
- (Prossima fase: contenitori **pila verticale / orizzontale / griglia** dentro le colonne, come HA.)

## 1.2.24 — 2026-06-08

### Colonne a larghezza fissa (fase 1 layout)
- Le colonne delle sezioni ora hanno **larghezza fissa** (300px, regolabile via `--frk-colw`): la pagina **non si allarga né si stringe**.
- **Massimo 4 colonne** per sezione (anche dal pulsante "+ colonne").
- Una card più larga della colonna viene **tagliata**, così si vede il limite della colonna.
- (Prossima fase: contenitori griglia / pila orizzontale / verticale dentro le colonne.)

## 1.2.23 — 2026-06-08

### Card JS ad altezza automatica (niente più tagli)
- Le card JS (Meteo, Antizanzare, ecc.) ora vanno ad **altezza automatica del contenuto**: mostrano tutto senza essere tagliate.
- Quando si apre un **menù a tendina o una configurazione** sotto la card (es. "Prossimi giorni" del Meteo), la card **si allunga da sola**; richiudendolo **torna normale**.

## 1.2.22 — 2026-06-08

### Card originali + niente ridimensionamento manuale
- Le card tornano **100% originali** (person, Meteo v1.0.8, Antizanzare) senza nessuna delle aggiunte/scaling.
- **Rimossa la maniglia d'angolo**: le card non sono più trascinabili/ridimensionabili a mano.
- Le card vanno a **grandezza naturale dalla griglia** (colSpan × rowSpan): la dimensione si regola solo dall'editor con righe/colonne.

## 1.2.21 — 2026-06-08

### Ripristino ridimensionamento card
- Annullati tutti gli esperimenti di ridimensionamento/scaling di questa serie: le card tornano al comportamento precedente (v1.2.19). Rimossi i campi px nell'editor.
- Mantenuti: **person-card** mappe satellite + stato sotto il nome + popup con tutto il tracciato delle 2 entità (no limite 24h); **Meteo** scelta entità delle 4 statistiche; **Store** sottomenu installate/da installare + eliminazione definitiva da GitHub.

## 1.2.20 — 2026-06-07

### Dimensioni card manuali (px)
- Nell'editor della card ci sono due nuovi campi **Larghezza/Altezza in px** (vuoto = automatico), come una card YAML.
- Tolto il ridimensionamento/scaling automatico del contenuto dalle card (person, Meteo, Antizanzare): ora rendono al naturale dentro la dimensione impostata.

## 1.2.19 — 2026-06-07

### Store: doppio sottomenu + eliminazione da GitHub
- Le cartelle **Card JS / Chips / Distintivi** ora mostrano due sezioni: **Installate** e **Da installare**.
- Nello stato "Da installare" è comparso un **cestino "Elimina da GitHub"**: rimuove **definitivamente** il file dal repo. Richiede **conferma + chiave di accesso**.

## 1.2.18 — 2026-06-07

### Pulizia notifiche e impostazioni
- **Notifiche**: rimosse "Frarik Dashboard aggiornato alla vX" e "Disponibile nuova versione dashboard". Resta solo la notifica di **aggiornamento card** nello store.
- **Impostazioni**: rimossa la sezione **"Impostazioni Nomi Store"** (non più necessaria: il nome della card viene impostato automaticamente).

## 1.2.17 — 2026-06-07

### Resize: si ridimensiona la card, non una cornice
- Rimosso l'auto-fit sperimentale che creava un riquadro separato attorno alla card e tagliava il contenuto. Ora trascinando l'angolo si ridimensiona **direttamente la card** (il suo contenitore), dentro la colonna che resta fissa. Il contenuto delle card fluide (es. person-card) si adatta da solo.

## 1.2.16 — 2026-06-07

### Auto-fit del contenuto per le card JS (sperimentale)
- Quando ridimensioni una card JS dall'angolo, il suo **contenuto ora si adatta in scala** alla nuova dimensione (zoom-to-fit, posizioni invariate) — gestito dal **core**, senza codice per ogni card. Si attiva solo sulle card ridimensionate (le altre restano identiche) e una card può disattivarlo con `noAutoFit:true` (la person-card ha già il suo scaling, quindi è opt-out).

## 1.2.15 — 2026-06-07

### Resize larghezza: la colonna resta fissa
- Ridimensionando la larghezza dall'angolo ora cambia **solo la card** (allineata a sinistra) **dentro la sua colonna**, che resta fissa. Prima si "muoveva" anche la colonna perché la larghezza era applicata al contenitore di colonna; ora è applicata alla card stessa.

## 1.2.14 — 2026-06-07

### Resize altezza anche per le card JS
- Le card JS (FratechStore/Lovelace) avevano `height:auto` forzato → trascinando l'angolo si poteva cambiare solo la larghezza, non l'altezza. Ora, quando ridimensioni l'altezza dall'angolo, la card viene marcata ad **altezza fissa** e rispetta l'altezza impostata (alzare/abbassare funziona anche su queste card; il contenuto si adatta).

## 1.2.13 — 2026-06-07

### Resize larghezza dentro la colonna
- Trascinando l'angolo, la **larghezza ora ridimensiona la singola card DENTRO la sua colonna** (in pixel), invece di cambiare il numero di colonne (colSpan). Così puoi rendere una card più stretta/larga indipendentemente, senza toccare le altre card della colonna. L'altezza continua a regolarsi liberamente; lo span di colonne resta disponibile dai pulsanti ◀▶.

## 1.2.12 — 2026-06-07

### Ridimensionamento card dall'angolo
- Ogni card ha ora una **maniglia di resize sempre visibile** nell'angolo in basso a destra (prima compariva solo in modalità modifica): si afferra e si trascina per **allargare/stringere e alzare/abbassare** la card; il contenuto si adatta in automatico.
- In **modalità sezioni** il trascinamento dell'angolo ora cambia **sia larghezza (colonne) sia altezza** (prima solo l'altezza).
- Aggiunto il supporto **touch** (tablet/telefono) al ridimensionamento.

## 1.2.11 — 2026-06-07

### Store e card persona
- **Store**: sotto il nome della card ora compare **solo la versione** (rimosso il nome-file).
- **person-card**: risolto il bug per cui le impostazioni erano vuote e il gear faceva crashare. La card ora prende l'hass da Frarik (nuovo `window.frarikHass()`), così i menu entità (person / device_tracker), la foto, la mappa e lo storico funzionano dentro la dashboard. Aggiorna la card dallo store per ricevere il fix.
- **Robustezza**: un errore in `mount()` di una card non può più propagarsi e bloccare la dashboard (tutti i percorsi render/mount/update sono ora protetti).

## 1.2.10 — 2026-06-07

### Versione leggibile e coerente
- La versione impressa nel file è ora **sempre leggibile**: `_parseCardVersion` riconosce sia il campo `version:` sia un marcatore commento, e lo stamp aggiorna il campo (o un marcatore canonico) **senza accumulare commenti**. Risolve il caso in cui una card pubblicata mostrava sempre `v1.0` perché la versione era solo in un commento non interpretato.
- Tutte le card del repo riportate a una **baseline `1.0` leggibile** (campo `version: '1.0'`), così lo store mostra la versione corretta e i futuri "Aggiorna"/pubblicazioni partono puliti.

## 1.2.9 — 2026-06-07

### Sezione dedicata "Impostazioni Nomi Store"
- Nuova voce **✏️ Impostazioni Nomi Store** in **Impostazioni → Altro**: apre un pannello con l'elenco di tutte le card installate, ognuna con un **campo nome modificabile** + ✓ per salvare (o Invio).
- Rinominando: il nome si aggiorna ovunque all'istante e, per le card su GitHub (con token), viene propagato anche lì senza cambiare la versione.
- Rimossi i pulsanti rinomina sparsi (store modal / lista impostazioni): la rinomina è ora centralizzata in questo pannello.

## 1.2.8 — 2026-06-07

### Rinomina card
- Aggiunto il pulsante **✏️ Rinomina** alle card installate, sia in **Impostazioni → Store** sia nello **Store → Card locali/Installate**.
- Rinominando una card: il nuovo nome viene aggiornato **subito** in tutte le viste e impresso nel codice della card; se la card è su GitHub (e il token è configurato) viene **propagato anche su GitHub** in automatico, **senza cambiare la versione**. Le card locali non ancora pubblicate prendono il nuovo nome alla prossima pubblicazione.

## 1.2.7 — 2026-06-07

### Card Lovelace: previsioni meteo e sottoscrizioni
- L'oggetto `hass` fornito alle card Lovelace ora ha un `connection` **funzionante**: `subscribeMessage` sottoscrive davvero (es. `weather/subscribe_forecast`) e instrada gli eventi al callback; `sendMessagePromise`/`callWS`/`sendWS` restituiscono il solo `result` (e rifiutano in errore) come l'HA reale. Risolve le card meteo che restavano su «Previsioni in caricamento…» perché non ricevevano mai i dati del forecast.

## 1.2.6 — 2026-06-07

### Versioni: unica fonte di verità = il file
Riscritta la logica delle versioni per eliminare le incoerenze (es. la stessa card mostrata a 1.0.8 in una vista e 1.0 in un'altra). Ora:
- **Card in locale** (in prova): versione **sempre `1.0`** — ricaricarla quante volte vuoi non la cambia.
- **Pubblicazione su GitHub**: legge la versione **realmente presente su GitHub** e **incrementa il minore** (1.0 → 1.1 → 1.2 …); la versione viene impressa nel file. Prima pubblicazione di un file nuovo = `1.0`.
- **Store** (⚡ Card JS / 🔹 Chips / 🏷️ Distintivi): mostra la versione **letta dal file su GitHub** (non più un contatore locale che derivava).
- L'installazione adotta la versione dichiarata nel file (niente più incrementi "fantasma").

## 1.2.5 — 2026-06-07

### Pubblicazione e versioni
- **Risolto l'errore `GitHub HTTP 409 … does not match`** in ripubblicazione: l'API contents di GitHub poteva restituire uno SHA "stantio" subito dopo un commit. Ora la pubblicazione rilegge lo SHA aggiornato (cache-busting) e **riprova automaticamente** in caso di conflitto.
- **La versione sale SOLO quando pubblichi**, non più ad ogni caricamento locale: durante le prove puoi ricaricare lo stesso file quante volte vuoi senza farla salire. La prima pubblicazione mantiene la versione corrente (es. 1.0); ogni pubblicazione successiva dello stesso file incrementa la patch (1.0 → 1.0.1 → …).

## 1.2.4 — 2026-06-06

### Pubblicazione e store
- **«Pubblica» ora aggiorna davvero il file su GitHub.** Prima la versione incrementata viveva solo nei metadati della dashboard: ripubblicando lo stesso file il contenuto era identico → GitHub non cambiava nulla. Ora, in fase di pubblicazione, la **versione viene impressa nel codice** della card (campo `version:`), così il file cambia e GitHub registra l'aggiornamento; la versione «viaggia» col file anche per le altre dashboard.
- La pubblicazione **riusa il nome-file reale** della card (se già installata da GitHub) invece di `<id>.js`, evitando di creare un doppione e aggiornando il file giusto.
- Dopo la pubblicazione la card è subito riconosciuta come installata (niente notifica «nuova card» per la propria pubblicazione).
- **Store: la versione è ora mostrata sotto il nome** della card anche nelle schede ⚡ Card JS / 🔹 Chips / 🏷️ Distintivi (es. `nome-file.js · v1.2`).

## 1.2.3 — 2026-06-06

### API e guida card
- Esposte alle card altre **API globali** già usate internamente: `window.hs`, `window.ha`, `callSvc(domain, service, entityId, data)`, `fetchHistory(entityId, hours)` (oltre agli alias `frarikCallService/frarikEntity/frarikState`). `BASE`/`TOKEN` restano **non** esposti per sicurezza.
- Aggiornata e ampliata la guida `Istruzioni card/CREAZIONE-CARD.md`: aggiunto il **design system Frarik** completo (palette, header, pannelli, barre, pulsanti, chip, badge), i pattern grafici **SVG inline** (mini-grafico a barre, icone), le regole di layout fluido e un esempio completo di card complessa.

## 1.2.2 — 2026-06-06

### Strumenti per autori di card
- Aggiunti gli **helper globali** `frarikCallService(domain, service, data, target)`, `frarikEntity(id)` e `frarikState(id)`, utilizzabili da qualunque card (FratechStore o Lovelace) per chiamare servizi e leggere stato/attributi delle entità.
- Aggiunta la guida **`Istruzioni card/CREAZIONE-CARD.md`** nel repo: template ufficiali, API render/mount/update, regole di naming, cartelle dello store, versionamento ed errori comuni.

## 1.2.1 — 2026-06-06

### Versione card
- **Le card Lovelace (es. `meteo-card.js`) restavano bloccate a 1.0.** Non dichiarano una versione propria, e con la logica "incrementa solo se il contenuto cambia" non salivano mai. Ora il versionamento del caricamento manuale è semplice e prevedibile: la prima volta parte dalla versione dichiarata (o 1.0.0), poi **ogni ricaricamento dello stesso file incrementa la patch** (1.0.0 → 1.0.1 → …), per qualsiasi tipo di card. La versione resta persistente per nome-file (non torna a 1.0 dopo un'eliminazione) ed è identica selezionando o trascinando il file.

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
