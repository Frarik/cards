# Changelog

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
