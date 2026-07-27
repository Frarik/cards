# Changelog

## 2.1.31 — 2026-07-27

### fix: card YAML ancora sopra ad alcuni popup — verifica indipendente dal tipo di popup

- Le v2.1.29/30 elencavano manualmente le convenzioni con cui l'app
  mostra/nasconde i propri popup — approccio fragile: il popup di
  configurazione di alcune card JS (es. automazioni a programma) non
  rientrava in nessuna delle convenzioni note, e la card YAML restava
  visibile sopra.
- Sostituito con una verifica indipendente dall'implementazione: ad
  ogni aggiornamento di posizione si chiede al browser cosa c'è
  davvero disegnato sopra al punto dove dovrebbe apparire la card
  (dentro l'iframe) — se non è la card stessa, qualcosa la sta
  coprendo, qualunque popup sia e in qualunque modo sia mostrato, senza
  bisogno di elencarlo esplicitamente.

## 2.1.30 — 2026-07-22

### fix: card YAML ancora sopra ai popup — copertura molto più ampia

- La v2.1.29 copriva solo alcuni popup (Configura Card e simili con la
  classe condivisa, editor screensaver, selettore entità) — ma l'app usa
  **molte convenzioni diverse** per mostrare/nascondere i propri popup
  (classe `.off`, dissolvenza con opacity, `display` diretto, menu creati
  e distrutti al bisogno): mancavano ancora Store da GitHub/locale,
  editor YAML, Canvas Libero, popup SOS, selettore icone/notifiche,
  licenza, conferme, menù viste/mobile e altri.
- Centralizzata la verifica in un'unica funzione (`_anyFrarikPopupOpen`)
  che controlla tutte queste convenzioni insieme — copertura molto più
  completa di "qualcosa è aperto sopra la dashboard".

## 2.1.29 — 2026-07-22

### fix: card YAML sopra ai popup (z-index cross-realm)

- Le card YAML si disegnano come overlay nella finestra reale di Home
  Assistant (fuori dall'iframe di Frarik, per renderle fedeli), quindi
  il loro z-index non si confronta mai davvero con quello dei popup di
  Frarik — se non nascoste esplicitamente restano sempre sopra,
  qualsiasi z-index si dia al popup dentro l'iframe.
- Il codice nascondeva già l'overlay durante le Impostazioni e i popup
  dei soli custom element (shadow DOM) — mancava la copertura per la
  maggior parte degli altri popup (Configura Card e simili, tutti quelli
  con la classe condivisa `.mbg`, più l'editor screensaver e i suoi
  selettori, il selettore entità universale). Ora nascosta anche in
  questi casi — aggiornamento quasi istantaneo, il ciclo che sincronizza
  la posizione dell'overlay gira già ad ogni frame.

## 2.1.28 — 2026-07-21

### fix: resize Card non live nell'editor + secondi minimi forzati a 10

- **Editor screensaver**: ridimensionando il widget "Card" trascinando
  l'angolo, si muoveva/ridimensionava solo il riquadro esterno — il
  contenuto della card interna restava fermo alla dimensione dell'ultimo
  render completo e si aggiornava solo dopo aver selezionato un altro
  widget. Ora si aggiorna dal vivo durante il trascinamento, esattamente
  come il riquadro.
- **Attesa prima di attivarsi**: il tempo minimo era forzato a 10
  secondi qualsiasi valore si impostasse (bug storico, non un limite
  dichiarato da nessuna parte nell'interfaccia) — impostando "5" si
  attivava comunque dopo 10. Ora viene rispettato il valore configurato
  (minimo 1 secondo, solo per evitare un valore a zero).

## 2.1.27 — 2026-07-21

### fix: anteprima "Card" nell'editor screensaver diversa dal salvaschermo reale

- Nel salvaschermo reale il widget "Card" ora si adatta correttamente
  (v2.1.26), ma nell'editor delle Impostazioni la stessa card veniva
  renderizzata letteralmente alle poche decine di pixel della canvas in
  miniatura — troppo piccola perché il contenuto della card avesse
  senso, quindi appariva diversa da come si vede davvero una volta
  salvato.
- La canvas dell'editor è una miniatura in proporzione dell'intero
  schermo (non la dimensione reale). Ora la card viene renderizzata
  alla sua dimensione "vera" equivalente (proporzionale, come apparirebbe
  davvero) e poi mostrata rimpicciolita nella miniatura con una scala
  uniforme — l'anteprima nell'editor rispecchia fedelmente il risultato
  finale.

## 2.1.26 — 2026-07-21

### fix: widget "Card" — via del trucco a "scala finta", adattamento fluido vero

- Le due versioni precedenti (2.1.24/25) usavano un `transform:scale()`
  calcolato in JS per far sembrare la card più grande/piccola — un
  trucco "fotografico" che stirava o lasciava vuoti a seconda dei casi,
  perché non è così che il ridimensionamento funziona nel resto
  dell'app.
- Sul dashboard reale, ridimensionare una card dal suo angolo
  (`initResize`, modalità sezioni) non usa **nessuna** scala: imposta
  solo larghezza/altezza in pixel sul contenitore, e il contenuto
  della card (flessibile, in percentuale) si adatta da sé via CSS.
  Il widget "Card" del salvaschermo ora fa esattamente questo: niente
  più `transform`, solo `width:100%;height:100%` sul box del widget —
  il contenuto si adatta dal vivo anche mentre si trascina l'angolo di
  ridimensionamento, esattamente come sulla dashboard vera.

## 2.1.25 — 2026-07-21

### fix: widget "Card" del salvaschermo, la scala non uniforme stirava/schiacciava la card

- La v2.1.24 usava un fattore di scala **diverso per larghezza e
  altezza** per riempire esattamente qualsiasi box: se il widget aveva
  proporzioni molto diverse da quelle di riferimento (es. molto largo e
  basso), il risultato era una card visibilmente stirata in orizzontale
  e schiacciata in verticale, con testo e layout deformati.
- Ora la scala è **uniforme** (stesso fattore per entrambi gli assi):
  la card si ingrandisce/rimpicciolisce sempre mantenendo le sue
  proporzioni originali, senza distorsioni, centrata nel box scelto
  (può restare un margine vuoto ai lati se il box ha proporzioni molto
  diverse dalla card, ma il contenuto non viene mai né tagliato né
  stirato).

## 2.1.24 — 2026-07-21

### fix: widget "Card" del salvaschermo, allargandolo il contenuto non si ingrandiva

- La correzione precedente (v2.1.23) risolveva solo il caso "box più
  piccolo del contenuto" (tagliato → ora rimpicciolito). Mancava il
  caso opposto, visto subito dopo: **allargando** il widget, la card
  restava della sua dimensione originale con tutto lo spazio in più
  vuoto intorno (il testo di molte card usa `vw`/`clamp()` legati alla
  *finestra*, non al box del widget, quindi non si ingrandiva da solo).
- Ora la card viene sempre renderizzata alla stessa dimensione di
  riferimento (quella di default, 240×170) e poi scalata come
  un'unica unità sulla dimensione reale del widget — frame e contenuto
  si ingrandiscono o rimpiccioliscono sempre insieme, riempiendo
  esattamente il box scelto, in entrambe le direzioni.

## 2.1.23 — 2026-07-21

### fix: popup non a tutta larghezza + widget "Card" tagliato invece di rimpicciolito

- **Popup**: il selettore entità universale (`#ep-picker`, usato ovunque
  nell'app) si apriva centrato con una larghezza massima invece che dal
  basso a tutta larghezza come tutti gli altri popup — corretto. Tolto
  anche un residuo limite di larghezza (640px) dal popup immagini
  dell'editor screensaver.
- **Widget "Card"**: ridimensionandolo più piccolo, il contenuto della
  card (numeri/testo con dimensione minima, padding fissi) non si
  rimpiccioliva ma veniva **tagliato** dal bordo del widget. Ora, se il
  contenuto non entra nel box, la card viene scalata come un'unica unità
  (stessa tecnica già in uso per le card della dashboard reale quando
  sbordano in larghezza, `_autoScaleAll`, qui estesa anche all'altezza) —
  si vede rimpicciolita, non tagliata. Applicato sia nell'editor sia nel
  salvaschermo reale (anche dopo un ridimensionamento della finestra).

## 2.1.22 — 2026-07-21

### fix: lo Store impediva di aggiungere la stessa card più volte

- In tutti i tab dello Store (Card JS, Predefinite, Installate/Locali,
  ricerca) e nel vecchio modale "Store Card JS", una volta aggiunta una
  card alla vista corrente, il bottone "➕ Aggiungi" spariva e restava
  solo l'indicatore "✓ In vista" — **impossibile** aggiungere la stessa
  card una seconda volta o in un'altra sezione/colonna della stessa
  pagina (utile ad es. per due card meteo affiancate, o per collegare
  la stessa card a più widget dello screensaver).
- `_jsStoreAddToDashboard()` creava già correttamente un'istanza
  indipendente ad ogni chiamata (id nuovo): il limite era **solo**
  nell'interfaccia, che nascondeva il bottone. Ora il bottone "➕ Aggiungi"
  resta sempre disponibile per tutte le card — resta invece "singola"
  solo la card di sistema 🆘 SOS Emergenza (ha una configurazione unica
  e globale da Impostazioni → SOS, non ha senso duplicarla).

## 2.1.21 — 2026-07-21

### fix: widget "Card" apre lo Store vero, popup dal basso, testi bianchi/maiuscoli

- **Widget Card**: "🧩 Scegli" apriva un elenco delle sole card già
  presenti sulla dashboard — ora apre lo **Store vero** (stesso da cui
  si aggiungono le card alla dashboard normale): si sceglie/aggiunge
  qualunque card disponibile, che viene collegata subito al widget.
  L'editor screensaver si nasconde temporaneamente durante la scelta e
  riappare da solo appena la card è stata aggiunta (o se si chiudono le
  Impostazioni senza scegliere nulla, per non restare bloccati).
- **Popup**: il selettore card e quello immagini (introdotti in v2.1.20)
  si aprivano centrati invece che dal basso come tutti gli altri popup
  dell'app — corretto.
- **Testi**: etichette e titoli del pannello proprietà, delle sezioni
  ("Sfondo", "Layout widget…") e dei bottoni erano in parte grigio
  attenuato — ora bianco pieno, maiuscolo, grassetto ovunque.
- **Immagini**: l'elenco di "🖼️ Sfoglia" mostrava anche i file
  dell'add-on stesso (`/config/www/frarik/`, loghi interni copiati lì
  automaticamente) mescolati a quelli dell'utente — ora esclusi.

## 2.1.20 — 2026-07-21

### editor screensaver: selettori reali invece di digitare a mano + 3 nuovi widget

- **Entità**: il campo era testo libero — ora c'è un bottone "🔍 Scegli" che
  apre il selettore entità completo (lo stesso usato ovunque nell'app),
  con ricerca e raggruppamento per dominio.
- **Card**: la `<select>` (poteva mostrare solo le card già esistenti sulla
  dashboard, elencate in modo grezzo) è diventata un bottone "🧩 Scegli"
  che apre un vero selettore con ricerca — corretto anche un bug per cui
  `_ssFindCard` non trovava mai nessuna card (un `cfg` locale della IIFE
  del salvaschermo oscurava quello globale della dashboard: il widget
  "card" non aveva mai funzionato).
- **3 nuovi tipi di widget**: 🔶 Icona (emoji/mdi, colore fisso oppure
  che cambia in base allo stato di un'entità — stile Canvas Libero),
  🔤 Testo libero (testo statico + colore), 🖼️ Immagine (URL, con
  segnaposto se il link non carica).
- **Sfoglia immagini di HA**: sia i campi sfondo giorno/notte sia il nuovo
  widget Immagine hanno un bottone "🖼️ Sfoglia" che elenca le immagini già
  presenti in `/config/www` (nuovo endpoint add-on `/api/frarik/www/list`)
  invece di dover scrivere a mano il percorso `/local/...`.

## 2.1.19 — 2026-07-21

### fix: caricamento risorse HACS in parallelo, non una alla volta

- `_loadLovelaceResources()` caricava gli script delle card HACS installate
  **uno alla volta** (aspettava che ognuno finisse prima di iniziare il
  successivo): con molte card installate era lento, e una risorsa
  lenta/bloccata ritardava tutte quelle elencate dopo di lei — lo stesso
  problema descritto nel changelog di Oikos ("alcune installazioni ne
  vedevano solo 2-3").
- Ora tutte le risorse partono insieme (`Promise.all`), non più in coda.

## 2.1.18 — 2026-07-21

### fix: ripristinato il bottone "Card YAML" — era codice morto senza nessun pulsante

- Verificando come provare i tipi aggiunti in v2.1.17 (gauge/glance/
  picture-elements) è emerso che **non esisteva più nessun bottone** che
  aprisse un editor YAML vuoto per una card nuova: il repo aveva due
  sistemi di editor YAML completi ma orfani (`_acpRenderYaml`/
  `_acpSetTab` e `_ghStoreRenderYamlEditor`, mai richiamati da nessun
  elemento reale dell'interfaccia) più un terzo sistema (`openYamlImport`/
  `#yaml-modal`) realmente funzionante ma raggiungibile solo modificando
  una card YAML già esistente, non creandone una da zero.
- Aggiunto un bottone reale **"📋 Card YAML"** nella barra dello Store
  (Impostazioni → Store, o "+" per aggiungere una card) che apre
  `openYamlImport()` a vuoto — anteprima live, poi "Aggiungi alla
  Dashboard" per crearla come card vera sulla pagina corrente.

## 2.1.17 — 2026-07-21

### feat: Card YAML — supporto a gauge, glance e picture-elements native

- Colma il secondo gap con Oikos ("Native HA card"): incollando uno YAML
  Lovelace con `type: gauge`, `type: glance` o `type: picture-elements`
  ora si vede la card renderizzata invece del generico "tipo non
  supportato" — si aggiungono a `entities`/`markdown`/`picture-entity`/
  `horizontal-stack`/`vertical-stack`/`grid`/`iframe` già supportati.
- `gauge`: stessa lancetta SVG già usata dalla card gauge nativa di
  Frarik, incluse le soglie colorate `severity: {green,yellow,red}`.
- `glance`: griglia icona+stato+nome per più entità con titolo opzionale.
- `picture-elements`: immagine di sfondo con overlay posizionati in
  percentuale (`style.top`/`style.left`) — supporta `state-icon`, `icon`,
  `state-label`, `text`, `image`; `service-button` e altri tipi più rari
  restano nel fallback per ora.
- Vale sia per l'anteprima nello Store → Card YAML sia per le card YAML
  già piazzate su una pagina della dashboard (stesso motore `_yamlCreateEl`).

## 2.1.16 — 2026-07-21

### fix: Impostazioni — troppi bordi bianchi annidati

- Il bordo bianco introdotto in v2.1.15 era su troppi elementi insieme:
  singoli campi/bottoni E ANCHE la riga/contenitore che li racchiudeva,
  con l'effetto "bordo dentro il bordo" ovunque.
- Ridotto ai soli campi veri: input di testo/numero/url/orario e le
  select. Righe, bottoni e chip non hanno più un bordo forzato.

## 2.1.15 — 2026-07-21

### feat: pannello Impostazioni — testi bianchi/maiuscoli/grassetto + bordo su tutti i 13 tab

- Applicato a **tutto** il pannello Impostazioni, senza eccezioni (compresi
  Vanessa e Store): testo sempre bianco pieno, MAIUSCOLO, grassetto e più
  grande; bordo fine bianco su ogni riquadro (input, select, bottoni,
  righe impostazioni).
- Fatto estendendo le variabili CSS già usate da tutto il pannello
  (`--muted`/`--dim`/`--bd`/`--bd2` scoped su `#epanel`, tecnica già
  presente nel codice) invece di migliaia di override puntuali — un solo
  punto di manutenzione, copre automaticamente anche i tab renderizzati
  dinamicamente da JS (Vanessa, Store) essendo tutti dentro `#epanel`.
- Nota: eventuale testo di stato colorato (es. conferme verdi/errori
  rossi) diventa anch'esso bianco per coerenza con la richiesta "tutto
  bianco senza eccezioni" — segnalare se si preferisce mantenere quei
  colori semantici.

## 2.1.14 — 2026-07-21

### feat: tab Sistema semplificato + screensaver in un unico popup standard

- Il tab Impostazioni → Sistema era un unico elenco piatto di controlli
  senza vere sezioni. Ora è raggruppato in 4 sezioni con titolo (stesso
  stile `.ep-sec-title` già usato in Aspetto/Viste): Modalità Kiosk,
  Screensaver, Tema automatico, Layout mobile.
- Lo screensaver passa da 8 campi sparsi nel tab (attesa, 2 immagini,
  2 orari, editor separato) a **un solo bottone "🎨 Configura screensaver"**
  che apre un **unico popup** con tutto dentro.
- Quel popup ora è un vero **bottom sheet**, identico per stile/colori/
  comportamento allo standard già in uso in tutte le altre card (rif.
  `LetpotMax.js` `configure()`/`openSettings()`): apertura dal basso,
  sfondo `#0a0816`, header icona+titolo+✕, chiusura su click fuori/✕/Esc
  — prima usava una finestra centrata diversa da tutto il resto.
- Il canvas dei widget mostra ora **contenuto reale dal vivo** invece di
  etichette segnaposto: l'orologio ticchetta, meteo/entità mostrano i
  valori veri, le card sono le card vere — e si aggiorna subito quando si
  aggiunge/rimuove/modifica un widget (entità digitata, card scelta),
  non solo dopo il salvataggio.

## 2.1.13 — 2026-07-21

### feat: Salvaschermo — editor a widget multipli (ispirato a Oikos)

- Sostituito il vecchio salvaschermo fisso (orologio+data+meteo centrati,
  fino a 3 entità in riga, oppure UNA sola card al posto dell'orologio)
  con un **editor a widget liberamente posizionabili**: Orologio, Data,
  Meteo, Entità (una per widget, non più limitate a 3) e Card dashboard
  — quest'ultima ora aggiungibile **più volte contemporaneamente**, non
  solo una.
- Nuovo pannello "🎨 Modifica layout" (Impostazioni → Screensaver):
  trascina, ridimensiona (calamita a griglia) e disponi i widget su un
  canvas con due preset Orizzontale/Verticale, stessa tecnica di
  drag/resize già collaudata in Canvas Libero.
- **Migrazione automatica**: chi aveva già configurato entità/card nel
  vecchio formato le ritrova convertite in widget al primo avvio, senza
  perdere nulla.
- Posizioni salvate in percentuale (non pixel), quindi il layout si
  adatta automaticamente a schermi di dimensioni diverse.

## 2.1.12 — 2026-07-21

### remove: tab "Crea Card" di Vanessa

- Rimosso interamente il tab "✨ Crea Card" (editor YAML, anteprima live,
  generazione via AI e generazione deterministica gratis) introdotto
  nelle versioni 2.1.1-2.1.11: dopo vari tentativi il risultato non era
  soddisfacente e si è deciso di eliminarlo, non solo disattivarlo.
  Vanessa torna ai suoi 4 tab originali (Dispositivi/Live/Registro/Config).
- Mantenuti due fix indipendenti emersi nel frattempo, utili a prescindere
  da questa funzione: l'header CORS per le chiamate a Claude
  (`anthropic-dangerous-direct-browser-access`, altrimenti "Failed to
  fetch" su qualunque uso di Claude in Vanessa) e `autocomplete="new-password"`
  sul campo chiave API (evita che il browser suggerisca una password
  salvata al posto della chiave).

## 2.1.11 — 2026-07-20

### fix: Crea Card — card generata sempre "spenta" e il click sembrava non fare nulla

- Le card FratechStore reali ricevono da render(card,hass)/mount un hass
  SEMPLIFICATO dove `hass.states[entità]` è direttamente la stringa di
  stato ("on"/"off"), non un oggetto `{state, attributes}` (vedi
  `Istruzioni card/CREAZIONE-CARD.md` §3). Le funzioni di supporto erano
  state portate da Canvas Libero, che invece usa una fonte diversa
  (`window.frarikHass()`, hass "vero" con stati a oggetto) — nel codice
  generato leggevano quindi sempre `hass.states[entità].state`, che su
  una stringa vale sempre `undefined`: la card mostrava sempre lo stato
  "spento" indipendentemente da quello reale, e dopo un click il nuovo
  stato non veniva mai riconosciuto — sembrava che il tocco non facesse
  nulla, anche quando il comando HA veniva davvero eseguito.
- `_vnssCreaS`/`_vnssCreaAttr` ora riconoscono ENTRAMBE le forme (stringa
  diretta o oggetto con `.state`/`.attributes`), con fallback su
  `window.hs`/`window.ha` — corretto sia per l'anteprima sia per le card
  effettivamente generate e salvate.

## 2.1.10 — 2026-07-20

### fix: Crea Card — "Genera JS (gratis)" dava "... is not defined" nell'anteprima

- Le funzioni incorporate nel file generato tramite `.toString()` restano
  coerenti tra loro dopo la minificazione (il bundler rinomina gli
  identificatori, ma lo fa in modo coerente sia nella dichiarazione sia
  nelle chiamate interne). Il problema erano i punti in cui il nome della
  funzione da chiamare veniva scritto **a mano** come testo (nel wrapper
  `render`/`mount` del CARD generato): dopo la minificazione quel nome
  scritto a mano non corrispondeva più al nome reale della funzione
  incorporata, con errore "... is not defined" nell'anteprima JS.
- Corretto leggendo il nome vero a runtime con `fn.name` invece di
  scriverlo come stringa fissa, in entrambi i generatori (`elementi` e
  `button-card`). Aggiunto anche l'helper `eh` (escape HTML) alla lista
  delle funzioni incorporate nello schema `elementi`, per lo stesso
  motivo: prima veniva ridichiarato a mano nel file generato con un nome
  che poteva non corrispondere a quello effettivamente chiamato dal
  codice incorporato.

## 2.1.9 — 2026-07-20

### feat: Crea Card — nuovo bottone "⚡ Genera JS (gratis)", nessuna AI richiesta

- Aggiunta una generazione **deterministica**, senza chiamate AI, per i
  due casi già collaudati: schema `elementi` (100% noto, riusa esattamente
  le stesse funzioni già usate per l'anteprima) e YAML `custom:button-card`
  col pattern comune (entità + tap_action toggle + eventuale pulsante
  secondario in un custom_field annidato, es. un'automazione collegata).
  Il risultato usa la stessa card compatta a riga singola vista
  nell'esempio, con i colori Frarik.
- Il bottone "✨ Genera con Vanessa (AI)" resta disponibile come opzione
  per YAML più insoliti che il riconoscimento automatico non copre (in
  quel caso "Genera JS (gratis)" avvisa e suggerisce di provare l'AI).
- Aggiunto anche `autocomplete="new-password"` al campo chiave API di
  Vanessa: alcuni browser suggerivano di autocompilare una password
  salvata al posto della chiave vera.

## 2.1.8 — 2026-07-20

### fix: Vanessa — provider Claude dava sempre "Failed to fetch"

- Le chiamate dirette dal browser a `api.anthropic.com` (sia il test/
  validazione chiave sia la generazione vera e propria) venivano
  rifiutate dal CORS di Anthropic: manca l'header esplicito che
  Anthropic richiede per consentire l'accesso diretto da un sito web
  (`anthropic-dangerous-direct-browser-access: true`). Aggiunto a
  entrambe le chiamate (`_vanessaValidateKey`, `_vanessaCallAI`).

### feat: Crea Card — aggiunto un secondo esempio di riferimento compatto

- Oltre all'esempio "header + pannelli + bottone" per card ricche di
  dati, ora il prompt include anche un esempio a riga singola (icona +
  nome/stato + eventuale controllo secondario), pensato per interruttori
  semplici — così il modello ha un riferimento pronto invece di dover
  inventare la struttura compatta da zero.

## 2.1.7 — 2026-07-20

### fix: Crea Card — la card generata ingrandiva/ristrutturava card che nell'originale erano compatte

- Il prompt precedente diceva esplicitamente di sostituire anche il
  "layout" della configurazione originale, non solo colori/font. Risultato:
  una card button-card compatta (una riga, icona+nome+piccolo stato,
  intera card cliccabile, piccolo pulsante automazione a lato) veniva
  trasformata in un pannello grande con header separato, due riquadri
  dati e due bottoni — una card completamente diversa nella struttura,
  non solo nei colori.
- Corretto: ora il prompt separa esplicitamente cosa va cambiato (colori,
  font, raggi, spaziature — i "token" dello stile Frarik) da cosa va
  mantenuto identico (struttura, densità, quanti elementi, quanto è
  grande/piccola la card, stesso comportamento). L'esempio di codice
  Frarik nel prompt di sistema è ora presentato esplicitamente come un
  catalogo di componenti da usare solo quando servono davvero, non un
  template a blocchi da applicare sempre.

## 2.1.6 — 2026-07-20

### fix: Crea Card — la card generata non assomigliava alle altre card Frarik

- Il prompt di sistema descriveva lo stile Frarik solo a parole (colori,
  dimensioni). Risultato: header con colori sbagliati, pannelli piatti,
  poco somigliante alle card reali della dashboard.
- Sostituita la descrizione con il CODICE REALE di una card di riferimento
  (header con icon-box, pannelli dati, bottone gradiente — stesse funzioni
  `_header`/`_panel`/`_btnPrimary` della guida `Istruzioni card/CREAZIONE-CARD.md`),
  che Vanessa ora copia/adatta invece di reinterpretare una descrizione
  testuale. Stessa tecnica già raccomandata nella guida stessa per chi crea
  card a mano: mostrare codice esistente funziona meglio che descriverlo.

## 2.1.5 — 2026-07-20

### feat: Crea Card — dopo "Genera" l'anteprima mostra la card JS vera, non più lo YAML

- Dopo aver generato il codice, il riquadro "Anteprima Live" (dove prima
  c'era il render dello YAML) viene sostituito dal render REALE della
  card appena generata: il codice viene installato (senza salvarlo nello
  Store) e si chiama `render()`/`mount()`/`update()` come fa la dashboard
  vera, con aggiornamento periodico dallo stato live.
- Aggiunto un bottone "🔄 Aggiorna anteprima" accanto a "Copia"/"Salva in
  locale": se si modifica il codice a mano nella casella sotto, permette
  di rivedere l'anteprima con le modifiche prima di salvare.
- Tornando a modificare lo YAML l'anteprima torna automaticamente a
  quella YAML (nessuna anteprima "fantasma" della generazione precedente).

## 2.1.4 — 2026-07-20

### fix: Crea Card — i bottoni "Genera JS"/"Formatta"/"Copia"/"Salva in locale" non facevano nulla

- Il bundler (Rollup, via `vite build`) elimina come codice morto qualsiasi
  funzione top-level mai referenziata da un identificatore JS reale — le
  funzioni richiamate SOLO tramite l'attributo `data-action="..."` (stringa,
  non riferimento diretto) devono essere elencate esplicitamente nel blocco
  `Object.assign(window, {...})` in fondo al file perché restino
  raggiungibili. `_vnssCreaFormat`, `_vnssCreaGenerate`, `_vnssCreaCopyCode`,
  `_vnssCreaSaveLocal` non c'erano: il bottone premeva, ma la funzione (e
  tutto ciò che chiamava solo lei, incluso il prompt inviato a Vanessa)
  non esisteva più nel bundle pubblicato — nessun errore visibile, solo
  nessun effetto. Aggiunte alla lista.
- L'anteprima live (YAML → disegno) non era toccata da questo bug perché
  raggiunta tramite una catena di chiamate dirette, non tramite data-action.

### feat: Crea Card — la card generata ora usa lo stile Frarik, non quello originale

- Per lo YAML nativo Lovelace/HACS: prima veniva chiesto a Vanessa di
  clonare l'aspetto ESATTO della card originale. Ora viene ricostruita nel
  design system Frarik (stesso header con icona, pannelli, bottoni,
  palette delle altre card della dashboard) mantenendo solo il
  comportamento (entità, azioni, logica condizionale) — per uniformità con
  tutte le altre card create finora.
- Il prompt di sistema condiviso da entrambe le modalità ora include anche
  la struttura del design system (non solo i colori): pattern header con
  icon-box, pannelli dati, bottoni.

## 2.1.3 — 2026-07-20

### fix: Crea Card — anteprima Lovelace mostrava "non installata su HACS" per card in realtà installate

- La prima versione dell'anteprima YAML nativo creava l'elemento custom
  (es. `button-card`) direttamente nel documento di Frarik. Per card HACS
  complesse quell'elemento lì non risultava mai registrato (anche se
  installata davvero), risultando sempre nell'avviso "non installata".
- Ora l'anteprima prova prima a creare la card nel realm di
  `window.parent` (stessa tecnica già in uso, collaudata, nella tab
  "Card YAML" dello Store: `_createHACard` + overlay `position:fixed`
  sincronizzato alla posizione del riquadro anteprima) e usa il render
  diretto nel documento di Frarik solo come fallback quando il parent non
  è raggiungibile.

## 2.1.2 — 2026-07-20

### feat: Crea Card — accetta anche YAML nativo Home Assistant/Lovelace (HACS incluso)

- Il tab "✨ Crea Card" di Vanessa riconosce ora due schemi: la lista di
  `elementi` (Canvas Libero) oppure un YAML Lovelace vero e proprio con
  `type:` (es. `custom:button-card`, mushroom, ecc.). L'anteprima usa in
  questo caso lo stesso motore già in uso nella tab "Card YAML" dello Store
  (`_loadLovelaceResources`/`_yamlCreateEl`), quindi mostra il rendering
  reale della card HACS, non un'approssimazione.
- Il prompt inviato a Vanessa in questa modalità include lo YAML originale
  e istruisce di riprodurre fedelmente lo stile visivo già scelto
  dall'utente (niente sostituzione con la palette standard Frarik) più il
  comportamento di `tap_action`/`hold_action` e, per i template stile
  button-card (`[[[ ... ]]]`), la stessa logica tradotta in JS vanilla.

## 2.1.1 — 2026-07-20

### feat: Vanessa — nuovo tab "✨ Crea Card" (YAML → anteprima live → JS)

- Nuovo tab dentro Vanessa: si scrive la card come lista di elementi YAML
  (stesso modello di Canvas Libero — `testo`/`icona`/`forma`/`azione`, con
  binding a entità e rilevamento automatico dell'azione dal dominio),
  con anteprima live istantanea (nessuna chiamata AI finché non si genera).
- Bottone "✨ Genera JS con Vanessa": Vanessa (stesso motore AI già
  configurato per l'automazione) scrive una card FratechStore indipendente
  che replica esattamente gli stessi elementi/entità/comportamenti.
  Il codice generato resta editabile e sotto controllo dell'utente:
  "💾 Salva in locale" lo registra nello Store locale (nessuna pubblicazione
  automatica) da dove si può poi pubblicare con il flusso GitHub già esistente.
- `_vanessaCallAI` ora accetta un secondo parametro opzionale `opts`
  (`system`, `maxTokens`) per generare risposte più lunghe del solito JSON
  di automazione, restando invariata per tutte le chiamate esistenti.

## 2.1.0 — 2026-07-19

### feat: Montalatte e Tostapane ora classificate come Elettrodomestici nello Store

- Il tab "🔌 Elettrodomestici" dello Store filtra le card con un
  riconoscimento automatico sul nome file (`_isElettrCard`); le due card
  esistevano già in `card-js/` ma non comparivano nel tab perché il loro
  nome non era incluso nel pattern di riconoscimento. Aggiunte
  `montalatte` e `tostapane` al pattern.

## 2.0.99 — 2026-07-18

### fix: notifiche di aggiornamento card non arrivavano per file con un campo "version:" incorporato

- `_parseCardVersion()` cercava prima un campo generico `version: '...'`/`"..."`
  ovunque nel file, PRIMA di controllare il marcatore esplicito
  `/* frarik-version: X.X */`. Per card come `posta-card.js`, che incorpora
  un template YAML con una propria voce `version: '2.0'` (la versione del
  package HA, non della card), quella voce veniva letta per errore al posto
  della vera versione della card — il controllo "la versione è aumentata?"
  falliva sempre e l'aggiornamento veniva allineato in silenzio senza mai
  notificare.
- Il marcatore `frarik-version:` ha ora sempre la priorità quando presente,
  eliminando questa classe di falsi negativi per qualunque card con
  contenuti incorporati (YAML, config) che usano la parola "version" a
  loro volta.

## 2.0.98 — 2026-07-18

### feat: card normali — inizia il riallineamento allo standard, parte da Meteo

- Aggiunto un meccanismo generico (`frarik_no_edit` nell'annuncio
  `window.customCards`) perché una card Lovelace con una propria icona di
  configurazione interna possa nascondere la matita ✏️ esterna in modalità
  modifica — riutilizzabile per le prossime card, non solo Meteo.
- `Meteo.js` (v1.42): applicato il flag (resta solo l'ingranaggio interno);
  popup impostazioni riallineato allo standard dei distintivi — testi
  sempre bianchi, 12px/900 uniforme su etichette e nomi entità, riquadro
  con contorno neutro (non più viola), pulsante Salva blu invece
  dell'accento ambra. Anteprima live e controlli dimensione card invariati.

## 2.0.97 — 2026-07-18

### fix: chip distintivo nella barra orologio ora identico a quello nella riga distintivi

- Il tentativo precedente (v2.0.96) reimplementava lo stile a mano nella
  barra orologio invece di riusare quello della riga distintivi, quindi
  la resa restava diversa (sfondo colorato invece che neutro, dimensioni
  leggermente diverse). Ora il chip nella barra orologio chiama la
  stessa identica funzione di rendering (`_badgeItemHTML`, classe
  `.hbadge`) usata per la riga distintivi — nessuna differenza visiva
  possibile perché è letteralmente lo stesso codice.

## 2.0.96 — 2026-07-18

### fix: errore JS su "+ Header" al primo utilizzo + chip distintivo piccolo nella barra orologio

- `closeHBM()` leggeva `.classList` su `#hbmod` senza controllare che esistesse:
  quel modale viene creato solo al primo utilizzo del "Header Personalizzato",
  quindi cliccare "+ Header" su un distintivo (es. SOS) PRIMA di aver mai
  aperto quel modale lanciava `Cannot read properties of null (reading
  'classList')`. Aggiunto controllo null.
- Il chip di un distintivo nella barra orologio/SOS usava la dimensione
  font di default della barra (10px) invece di quella della riga
  distintivi (14px) — impostata esplicitamente per coerenza visiva.

## 2.0.95 — 2026-07-18

### feat: SOS ora compare anche nella tab "Distintivi" dello store, come gli altri

- SOS resta protetta da licenza (non disinstallabile senza chiave admin,
  come già in "Predefinite"), ma ora ha una voce anche nella tab
  **Distintivi → Installati**, iniettata accanto ai distintivi veri
  scaricati da GitHub — stessa card, stessi due pulsanti Dashboard/Header,
  stesso posto in cui si trovano e si aggiungono tutti gli altri.
  Il lucchetto 🔐 al posto del cestino segnala che resta protetta.

## 2.0.94 — 2026-07-18

### feat: SOS ora è un distintivo come gli altri (invece del vecchio chip statico)

- `sos-card` (il sistema SOS Emergenza, card di sistema protetta da licenza)
  è ora marcata `isDistintivo:true` con un `chip()` proprio (🆘 SOS, rosso
  fisso — non ha un'entità/condizione naturale da valutare, quindi niente
  sezione "Colore chip"). Passa quindi dagli stessi due pulsanti
  Dashboard/Header di tutti gli altri distintivi, sia nello store (tab
  Predefinite) sia nella lista rapida del pannello di modifica.
- **Rimosso del tutto il vecchio tipo "sos" hardcoded** nella barra
  orologio: niente più pulsante dedicato "🆘 SOS" nel form della barra,
  niente più chip statico non aggiornabile — al suo posto lo stesso
  distintivo live già usato per gli altri (badge icona/colore/click che
  aggiornano da soli).
- **Migrazione automatica**: qualsiasi item `type:'sos'` già presente nella
  barra orologio (`cfg.hdrBar`) viene convertito al volo nel nuovo item
  `type:'jsd'` legato a `sos-card` al primo caricamento — nessuna azione
  richiesta, il pulsante SOS esistente continua a funzionare.
- Il `configure()` del distintivo apre la schermata globale Impostazioni →
  SOS (famiglia/contatti/persone), dato che quei dati sono condivisi e non
  per-istanza come negli altri distintivi. Aggiornato anche il banner guida
  di quella schermata per riflettere le tre collocazioni possibili
  (dashboard/header/card griglia) invece della sola vecchia dashboard.

## 2.0.93 — 2026-07-18

### fix: le due destinazioni dei distintivi erano scambiate + nuova destinazione "barra orologio/SOS" live

- Corretta la terminologia: la riga distintivi esistente (quella sotto/sopra
  la griglia, dove sono già tutti i distintivi) è "**Dashboard**" — non
  "Header" come etichettato prima. Il pulsante che la popola resta lo
  stesso di prima (`page.headerBadges`), solo l'etichetta era sbagliata.
- **"Header" ora è la vera barra in alto con l'orologio/SOS** (`cfg.hdrBar`,
  globale): un distintivo aggiunto lì è **live** quanto in dashboard —
  valore che si aggiorna da solo, colore in base allo stato, click che apre
  il popup del distintivo — non la vecchia versione statica icona+etichetta
  del tipo "store" già esistente in quella barra.
- Estesi `_findBadge`, `_liveUpdateBadges` e il render della barra orologio
  (`hbarInner`) per gestire il nuovo tipo `jsd` al suo interno; il picker
  "aggiungi elemento" del form della barra (che ora mostra solo distintivi)
  crea item live invece dei vecchi item statici "store"; l'editor di un
  distintivo nella barra apre direttamente il suo `configure()` dedicato
  invece del form generico entità/testo.

## 2.0.92 — 2026-07-18

### feat: rimossa la categoria "Chips" dallo store + distintivi in header O dashboard

- Rimossa del tutto la categoria "Chips" (cartella `card-chips/`, mai popolata):
  tab e sotto-tab nello store GitHub, opzione nel picker "aggiungi all'header"
  del form `header-bar`, opzione nel selettore cartella di pubblicazione.
- **Novità**: un distintivo installato ora si può aggiungere sia all'**intestazione**
  sia alla **dashboard** (come card normale), in modo indipendente — nello store
  (tab Distintivi → Installati) e nella lista rapida del pannello di modifica
  compaiono due pulsanti distinti "Header" / "Dashboard" invece del singolo
  "Aggiungi" che forzava sempre l'intestazione. Rimossa la pulizia automatica
  che cancellava la card gemella in dashboard quando si aggiungeva all'header
  (ora le due collocazioni convivono).

## 2.0.91 — 2026-07-18

### feat: riquadro unico per i campi extra + contorno bianco sui riquadri

- `GruppoAllarme.js` (v4.2): tutti i campi extra del popup di configurazione
  (Chip, Entità allarme, PIN, Modalità, Sensori, Sirena) sono ora raggruppati
  in un unico riquadro con contorno bianco, suddiviso al suo interno per
  tipologia con sottili separatori — non più box annidati/separati.
- `main.js` (`FratechColorRules`): il riquadro "Colore chip" (condiviso da
  tutti i distintivi) ha ora anch'esso il contorno bianco, mantenendosi
  visivamente separato dal riquadro dei campi extra.

## 2.0.90 — 2026-07-18

### fix: rimossa del tutto la sezione "Bordo" dal colore chip + riquadro Sensori

- `main.js` (`FratechColorRules`): eliminata completamente la sezione "Bordo"
  dal popup "🎨 Colore chip" (condiviso da tutti i 14 distintivi) — resta solo
  "Contenuto (testo, icona, numeri)" a condizioni. `read()` ora forza sempre
  `borderMode:'none'` (il bordo non è più configurabile da nessuna card).
- `GruppoAllarme.js` (v4.1): la sezione "Sensori" nel popup di configurazione
  è ora in un riquadro separato (stesso stile della sezione "Colore chip"),
  invece di stare a contatto diretto con gli altri campi.

## 2.0.89 — 2026-07-18

### fix: rimosso "Nessuno/Fisso/Condizioni" anche dal colore del bordo chip

- `main.js` (`FratechColorRules`): come già fatto per il "Contenuto", anche la
  sezione "Bordo" del popup "🎨 Colore chip" (condivisa da tutti i 14
  distintivi) non mostra più i pulsanti "Nessuno"/"Fisso" — resta solo la
  logica a condizioni. Senza regole configurate il bordo non viene forzato
  (comportamento identico al precedente "Nessuno"); con regole cambia colore
  in base alla condizione.

## 2.0.88 — 2026-07-18

### fix: rimosso "Fisso" dal colore del contenuto chip in tutte le configurazioni

- `main.js` (`FratechColorRules`): la sezione "Contenuto (testo, icona, numeri)"
  del popup "🎨 Colore chip" — condivisa da tutti i 14 distintivi — non mostra
  più il pulsante "Fisso". Resta solo "Condizioni": senza regole configurate
  il chip usa il colore automatico/di default, con regole cambia colore in
  blocco su icona/numeri/testo insieme (nessuna distinzione tra i tre). La
  sezione "Bordo" mantiene invece Nessuno/Fisso/Condizioni invariati.

## 2.0.87 — 2026-07-18

### feat: valore dei chip più spesso (senza ingrandirlo)

- `style.css`: `.badge-val` (il valore del chip, es. "LUCI: 1", "ARMATO · FUORI")
  con `-webkit-text-stroke` portato da `.35px` a `.7px` — più spessore percepito
  a parità di font-size.

## 2.0.86 — 2026-07-18

### feat: testo dei chip ulteriormente ingrandito

- `style.css`: `.hbadge`/`.badge-title` da `font-size:12px` a `14px` (richiesta
  esplicita di testo ancora più grande, non solo la pillola nel complesso).

## 2.0.85 — 2026-07-18

### feat: chip dei distintivi ingranditi

- `style.css`: `.hbadge` (pillola del chip) portata da `font-size:10px` a `12px`,
  con padding/gap leggermente aumentati per accompagnare il testo più grande;
  `.badge-title` allineato a 12px. Riguarda tutti i 14 distintivi.

## 2.0.84 — 2026-07-18

### fix: alcuni chip sembravano meno "grassetto" di altri a parità di peso font

- `style.css`: non era un bug di font-weight (già a 900 ovunque da v2.0.83) ma un
  effetto ottico — stringhe corte con lettere/cifre sottili (es. "LUCI: 1": L, U,
  I, ":", "1" hanno poca massa) risultano visivamente più "magre" di stringhe con
  lettere larghe/tonde (es. "ARMATO · FUORI": A, R, M, O, U) anche a peso identico.
  Aggiunto un filo di `-webkit-text-stroke` (0.35px, stesso colore del testo) su
  `.badge-val`/`.badge-title`/`.badge-lbl` per ispessire uniformemente i glifi e
  ridurre questa differenza percepita tra chip diversi.

## 2.0.83 — 2026-07-18

### fix: chip dei distintivi ancora poco in grassetto nonostante il fix precedente

- `style.css`: il peso 700 di `.hbadge` (il contenitore del chip) restava comunque
  visibile a fianco di label/valore già a 900/800 — a font-size 10px la differenza
  tra 700 e 900 è troppo sottile per essere percepita come "grassetto". Portato
  l'intero chip (`.hbadge`, `.badge-title`, `.badge-val`) a `font-weight:900` così
  tutto il testo del badge (icona esclusa) risulta uniformemente in grassetto pieno.

## 2.0.82 — 2026-07-17

### fix: etichetta del chip distintivi non era in grassetto

- `style.css`: `.badge-lbl` (l'etichetta testuale mostrata prima del valore in tutti i chip
  dei distintivi, es. "Luci" in GruppoLuci) era a `font-weight:600` — visibilmente meno
  grassetto del valore accanto (`.badge-val`, peso 800). Portato a `font-weight:900` per
  coerenza con la richiesta di testo maiuscolo/grassetto in tutti i distintivi.

## 2.0.81 — 2026-07-17

### fix: popup distintivi allineato allo standard + GruppoAllarme restyle e fix bug bypass

- `main.js`: sfondo/backdrop del popup dei distintivi (`_openJsdPopup`, usato da tutti e 14)
  allineato allo standard degli altri popup (bg `#0a0d1a`, backdrop `rgba(0,0,0,.65)`).
- `GruppoAllarme.js` (v2.8): restyle del popup di stato (medaglione a scudo con alone nella
  card principale, sensori con icona in badge circolare colorato, tutto il testo rimanente
  in maiuscolo/grassetto). Corretti 3 bug nella logica di bypass/riarmo:
  1. Escludere un sensore mentre l'allarme è in "pending"/"arming"/"triggered" (non solo
     "armed") forzava comunque un ri-arm — rischiando di interferire con un allarme già
     scattato o col conto alla rovescia. Ora scatta solo se davvero armato.
  2. In stato "armed_custom_bypass" la modalità di riarmo veniva sempre assunta "away";
     ora si usa l'ultima modalità scelta dall'utente.
  3. All'armamento con sensori esclusi, la chiamata di bypass a volte veniva sovrascritta
     dalla chiamata standard (nessuna garanzia d'ordine tra le due) — ora la chiamata di
     bypass è ritardata di 700ms per evitare la sovrapposizione.

## 2.0.80 — 2026-07-17

### feat: aggiornamento live dell'icona dei distintivi (chip) + GruppoAllarme con scudo di stato

- `main.js`: il chip di un distintivo (`_badgeItemHTML`, ramo `jsd`) ora aggiorna anche l'icona
  dal vivo quando l'entità cambia stato, non solo il testo — prima l'icona veniva scritta solo
  al primo render. Cambiamento retrocompatibile: i distintivi che non impostano `chip.icon`
  dinamicamente non sono toccati.
- `GruppoAllarme.js` (v2.7): il chip ora mostra un'icona a scudo che cambia forma e colore in
  base allo stato (disarmato/armato fuori/casa/notte/vacanza/bypass/in ingresso/allarme), al
  posto dell'emoji fissa; rimossa la label fissa "Allarme:" — resta solo icona + stato.

## 2.0.79 — 2026-07-17

### fix: notifiche di aggiornamento card/distintivi solo se la versione cambia davvero

Il controllo automatico (`_ghCheck`) segnalava "aggiornamento disponibile" appena cambiava
lo sha (hash del contenuto) di un file su GitHub, anche se il campo `version:` dichiarato
nel file restava identico (es. un fix di stile senza bump di versione). Ora, per i file
già installati, prima di segnalarli come pending viene scaricato e confrontato il numero
di versione reale (`_verGt`) — se non è aumentato, lo sha noto viene allineato in silenzio
senza generare notifica ne' comparire nella lista "da aggiornare". I file nuovi (mai
installati) continuano a essere segnalati subito, senza bisogno di confronto versione.

## 2.0.78 — 2026-07-16

### feat(card): LetPot Max v4.8 — vista minimale, impostazioni a comparsa, luce per modalità, timer reale, onda corretta

- **Vista principale ridotta all'essenziale**: solo l'immagine animata del dispositivo + i 3 valori richiesti (acqua, temperatura, giorno pianta). Tutti i controlli (power, orari luce, luminosità, modalità, auto, ricircolo pompa) sono stati spostati in un nuovo pannello **Impostazioni** che si apre dal basso (⚙️ in header), con toggle in stile switch e collegamento diretto al setup entità
- **Luce che cambia tonalità in base alla modalità**: nuove palette per Frutti (rosso/rosa), Fiori (viola), Verdure/Erbe (blu vegetativo), Erbe aromatiche (verde acqua), Personalizzato (bianco neutro) — cambiano fascio, riga LED e riflessi sull'acqua in tempo reale quando il sensore modalità cambia
- **Timer pompa reale**: non più un countdown globale agganciato all'orologio, ma un countdown di 30 minuti che parte nel momento esatto in cui la pompa si attiva davvero (`pumpEntity`), e la barra è visibile solo mentre la pompa è accesa
- **Fix onda "sotto" il pelo dell'acqua**: la cresta dell'onda ora è disegnata ben sopra il livello (strip -14px/+14px, viewBox più alto), invece di restare quasi del tutto assorbita dal corpo d'acqua sottostante come nella v4.7
- **Vortice/bolle quando la pompa parte**: oltre alle bolle già presenti, ora compaiono anelli di ripple attorno alla pompa per dare la sensazione di ricircolo attivo
- **Luce sincronizzata anche senza push da HA**: aggiunto un controllo periodico (ogni 20s) che ricalcola l'accensione/spegnimento in base agli orari programmati, cosi la card reagisce all'orario anche se nessuna entità cambia stato nel momento esatto
- **Allarmi come badge sull'immagine**: acqua bassa / nutrienti bassi / errore ricarica non occupano più una riga fissa nella card, appaiono solo quando attivi come badge pulsanti sovrapposti alla vasca

## 2.0.77 — 2026-07-15

### fix(card): LetPot Max v4.7 — vaschetta collegata al sensore, onda in superficie

- **Rimossa la "sonda sensore" decorativa** con i fili tratteggiati introdotta per errore in v4.6: non era quello richiesto
- **Vaschetta nutrienti collegata al sensore reale**: `nutrientBox()` ora riceve `lowNutr` (dal `lowNutrientsEntity` configurato in ⚙️) invece dello stato della pompa — se il sensore segnala nutrienti bassi, la vaschetta si mostra scarica/spenta con bordo rosso e label "NUTR. BASSI"; la pompa era già correttamente pilotata dal `pumpEntity` configurato
- **Fix onda "sotto" l'acqua ferma**: lo sfondo del serbatoio era `#030c15`, quasi identico al colore dell'acqua, per cui la zona vuota sopra il livello (acciaio interno vasca) veniva scambiata per acqua ferma. Ora lo sfondo vuoto è grigio acciaio (`#1b1f27`→`#14171d`) nettamente diverso dal blu dell'acqua, e l'onda è disegnata con `z-index` sopra il corpo acqua così la superficie ondulata è sempre visibile in cima

---

## 2.0.76 — 2026-07-15

### fix(card): LetPot Max v4.6 — piu spazio sopra la vasca, niente riga nera, sensore collegato

- **Spazio raddoppiato** tra pannello luce e vasca: `plantAreaH` da [30,44,62,78,94,108] a [56,82,118,148,178,206]px
- **Fix riga nera sotto le onde**: il corpo dell'acqua ora è un `inset:0` pieno disegnato PRIMA dell'onda (che aveva altezza implicita/non dichiarata e lasciava un varco verso lo sfondo nero del contenitore); l'SVG dell'onda ha ora un'altezza esplicita (16px) e nessun gap è più possibile
- **Sonda sensore**: nuovo elemento centrale (asta + capsula con LED verde) che scende nell'acqua dal bordo vasca, con due fili tratteggiati che collegano pompa e vaschetta nutrienti alla sonda — non più elementi isolati/scollegati
- **Rimossa la scritta sotto il pannello luce** ("💜 36W Full Spectrum" / luminosità), ridondante con i controlli già presenti sopra

---

## 2.0.75 — 2026-07-15

### fix(card): LetPot Max v4.5 — vasca essenziale, piu spazio sotto la luce, angoli meno estremi

- **Più spazio tra pannello luce e vasca**: `plantAreaH` per fase alzato (da [12,26,44,60,76,90] a [30,44,62,78,94,108]px), il gambo continua ad attraversare tutta la zona e a toccare il bordo vasca
- **Vasca ridotta all'essenziale**: rimossi il rim scuro con i puntini pod (la "riga nera orizzontale"), le due label overlay acqua/temperatura dentro la vasca (duplicate con la griglia STATS) e il pulsante pompa con rotellina in alto — dentro la vasca restano solo acqua, pompa sommersa e vaschetta nutrienti
- **Angoli vasca meno estremi**: border-radius da `46px 46px 20px 20px` (oval flare) a `20px 20px 16px 16px` (rettangolo arrotondato, meno "a goccia")
- Pulita `update()` dai riferimenti a elementi rimossi (`wtext`, `temp`, `pump-side-gear`)

---

## 2.0.74 — 2026-07-15

### fix(card): LetPot Max v4.4 — rimosso pannello acciaio, serbatoio più alto, fascio luminoso più bello

- **Rimosso il pannello acciaio LCD+pompa** sopra il serbatoio (era ridondante: acqua/temp/fase/giorno sono già mostrati negli overlay del serbatoio e nella griglia STATS in basso). Il pulsante pompa è ora un piccolo overlay circolare in alto al centro del serbatoio (stesso `data-lp-action="pump"`, stesso `data-lp-update="pump-side-gear"`)
- **Serbatoio acqua più alto**: da 68px a 92px, formula `waterH` riscalata di conseguenza
- **Fascio luminoso volumetrico**: alone diffuso alla sorgente (blur), doppio strato di fascio con bordi sfumati (`filter:blur`) invece del trapezio a bordo netto, nuova animazione `lp-beam-pulse` (respiro leggero), raggi sottili più luminosi
- **Riga del pannello LED monocolore**: rimosso il gradiente arcobaleno (rosso/giallo/blu) sulla riga emettitrice, ora colore lilla pieno con glow

---

## 2.0.73 — 2026-07-15

### fix(card): LetPot Max v4.3 — pannello luce a taglio, palo a contatto, pompa sx/nutrienti dx

- **Pannello LED corretto**: da griglia di pallini colorati sempre visibili a una vista frontale realistica — si vede solo una sottile riga emettitrice sul bordo inferiore del pannello, dalla quale parte il fascio di luce verso le piante (rimossi `buildLeds`/`LED_MAP` inutilizzati)
- **Palo sempre a contatto**: il gambo non è più un blocco fisso da 18px seguito da uno spazio vuoto — ora è un elemento che attraversa in verticale tutta la zona piante (altezza variabile per fase di crescita) e tocca sempre il bordo della vasca, eliminando il "buco" visibile nelle fasi con poche piante
- **Pompa ridisegnata**: forma più simile a una pompa reale (corpo con griglia di aspirazione + impeller, non più un rettangolo con scritta "PUMP"), spostata a **sinistra** nel serbatoio
- **Vaschetta nutrienti ingrandita e spostata a destra**: da 20×13px a 34×24px, con striscia LED e indicatori, posizionata sul lato opposto alla pompa

---

## 2.0.72 — 2026-07-15

### feat(card): LetPot Max v4.2 — vasca ovale in acciaio, aspetto realistico

- **Vasca ovale in acciaio spazzolato**: il tank body passa da rettangolo scuro (radius 8px) a forma ovale in alto / arrotondata in basso (`border-radius:46px 46px 20px 20px`), gradiente acciaio spazzolato multi-banda invece del blu navy
- **Rim pod discreto**: la barra con 7 cerchi grandi "21 pod" diventa un rim sottile (11px) con 9 puntini appena accennati, fedele alle foto reali dove i pod si vedono a malapena sotto le piante
- **Pannello LCD+pompa su acciaio**: sfondo del pannello controlli da blu navy a gradiente acciaio; pulsante pompa ridisegnato (base scura/plastica, glow verde quando attiva) per restare leggibile sul nuovo sfondo chiaro
- **Pannello LED ovale**: da rettangolo con angoli smussati (10px) a forma "pill" ovale (50px), come il vero pannello sospeso LetPot
- **Vaschetta nutrienti**: nuova `nutrientBox()` — rettangolino nero con striscia LED multicolore, galleggiante accanto alla pompa nel serbatoio acqua, come nella foto della vasca aperta

---

## 2.0.71 — 2026-07-15

### feat(card): LetPot Max v4.1 — fascio luminoso reale, pompa dentro l'acqua con ricircolo, luce real-time

- **Fascio luminoso reale (light beam)**: cono trapezoidale `clip-path:polygon(22% 0%,78% 0%,98% 100%,2% 100%)` con gradiente viola/porpora che proietta dalla base del pannello LED verso le piante; 4 raggi sottili angolati (skewX) sovrapposti; alone ambientale radiale sulle piante; glow spesso 18px che si riversa dalla base del pannello verso il basso
- **Riflesso luce sull'acqua**: quando la luce è ON, 4 "shimmer spots" animati (`lp-shimmer`) sulla superficie dell'acqua con colori viola (`rgba(195,60,255,...)`)  
- **Pompa disegnata dentro l'acqua**: corpo pompa (`PUMP` label + impeller ⚙ rotante) posizionato `position:absolute;bottom:3px` dentro il serbatoio d'acqua; tubo di mandata da 5px sopra la pompa con gocce animate che salgono (`lp-flowUp`); inlet/outlet pipe laterali; glow quando attiva
- **Ricircolo acqua visivo**: lato DX = acqua che sale (pompa→pod) con 3 segmenti `lp-flowUp` a delay scaglionati; lato SX = acqua che scende (pod→serbatoio, ritorno per gravità) con 3 segmenti `lp-dropDown`
- **Nuovi keyframes**: `lp-flowUp` (sale da 14px→-2px, opacity 0→.75→0), `lp-dropDown` (scende da -2px→14px), `lp-shimmer` (opacity .55→1→.55 per riflessi)
- **Luce real-time**: `_lastOn` tracking in `update()` — quando `on` (lightActive&&power) cambia, re-render completo immediato; l'utente vede il pannello LED accendersi/spegnersi e il fascio apparire/scomparire senza delay
- **Re-render unificato**: `stageDiff||onDiff` → full re-render in un unico check, poi targeted updates per tutti gli altri stati

---

## 2.0.70 — 2026-07-15

### feat(card): LetPot Max v4.0 — layout fedele al device reale (palo telescopico + LCD + 21 pod)

- **Struttura device corretta**: pannello LED orizzontale in cima a un palo telescopico verticale centrale (come il vero LetPot Max LPH-MAX), non più bracci laterali
- **Palo telescopico**: colonna metallica (#bbb→#888→#bbb gradient) tra pannello LED e corpo del tank
- **21 pod sul coperchio**: 7 fori circolari visibili in prima fila sul coperchio superiore del tank, si "illuminano" leggermente quando la pompa è attiva
- **Display LCD 4.8"**: display scuro con bordo verde sul fronte del corpo in acciaio — mostra livello acqua con barra, temperatura, fase di crescita + giorno, modalità attiva, stato pompa con blink animato
- **Corpo tank scuro/acciaio**: `linear-gradient(#181a28,#121420)` con bordo sottile metallico e ombra perimetrale
- **Piante più dense e realistiche**: fino a 9 piante per la fase raccolta; stage 5 aggiunge frutti rossi (fragole/pomodori) con cerchi SVG su piante alternate
- **Serbatoio acqua separato**: finestra acqua nella parte bassa del tank body, con onda animata, bolle, ripple pompa
- **Pompa come pulsante rotondo** sul fianco del tank: cerchio con ⚙️ rotante + label ATTIVA/FERMA, cliccabile se pumpEntity è uno switch
- Mantenuti: timer 30min real-time (setInterval 1s), local state per luminosità e switch, controlli interattivi orari/mode/brightness

---

## 2.0.69 — 2026-07-14

### fix(card): LetPot Max — riscrittura layout, fix timer reale, fix luminosità, fix chips, testo bianco

- **Pannello LED riposizionato**: ora è un pannello piatto orizzontale con due bracci laterali che lo collegano al tank, visivamente identico alla foto del LetPot Max; non più barra in cima alla card
- **Bracci laterali**: due colonne metalliche (`#777→#444` gradient) collegano il pannello LED al corpo del tank, con le piante che crescono nello spazio centrale tra i bracci
- **Timer 30min in tempo reale**: `setInterval` di 1 secondo aggiorna la barra e il label MM:SS ogni secondo senza aspettare aggiornamenti HA
- **Luminosità fix**: local state `_localBr` per 5 secondi dopo ogni modifica; i bottoni [−] e [+] accumulano correttamente i valori senza swap; `update()` non sovrascrive il valore locale finché HA non ha confermato
- **Pompa basata sul sensore**: l'animazione (⚙️ rotante, ripple, bolle, testo POMPA ATTIVA/FERMA) è controllata dallo stato di `pumpEntity` in tempo reale; se `pumpEntity` è uno switch, l'area pompa è cliccabile
- **Chips Auto e Ciclo in tempo reale**: local state `_localSw` (5 secondi) per il feedback ottimistico istantaneo; update() usa lo stesso stato locale per evitare flip-flop visivi
- **`doToggle()` e `localSwState()`**: helper centralizzati per tutti i toggle switch con pending state tracking
- **Tutto il testo `#fff`**: rimossi TUTTI i `rgba(255,255,255,.X)` dai testi; label secondary con font-size ridotto ma colore pieno
- **`data-lp-update="xxx"`** su tutti gli elementi aggiornabili: selezione unambigua in `update()` separata dai selettori di click (`data-lp-action`)
- Ristrutturato `update()` per usare i nuovi selettori `data-lp-update` con funzioni helper `_updateChip()` e `_updateAlert()`

---

## 2.0.68 — 2026-07-14

### feat(card): LetPot Max — controlli interattivi diretti sulla card

- **Power toggle**: badge "● ATTIVO / ○ SPENTO" nell'header cliccabile → toggle `powerEntity` con aggiornamento ottimistico immediato
- **Pompa toggle**: area pompa nel tank cliccabile se `pumpEntity` è uno switch → turn_on/turn_off diretto
- **Auto mode** e **Pump cycling**: chip nella barra stato cliccabili → toggle con aggiornamento ottimistico
- **Orari luce**: input `<input type="time">` nativi per accensione (🌅) e spegnimento (🌙) nella strip sotto il pannello LED → `time.set_value` / `input_datetime.set_datetime`
- **Luminosità**: bottoni [−] e [+] a fianco del valore corrente → `number.set_value` / `input_number.set_value`; min/max/step letti dagli attributi dell'entità; aggiornamento ottimistico immediato
- **Modalità luce**: `<select>` nativo popolato con le opzioni reali da `attributes.options` dell'entità select → `select.select_option` / `input_select.select_option`
- **Helper `svc()`**: chiama `hass.callService(domain, service, data)` via `window.frarikHass()` con fallback silenzioso
- Tutti gli aggiornamenti ottimistici (prima che arrivi il nuovo stato da HA) per UX istantanea
- Feedback visivo su tutti i bottoni: `opacity + scale` sull'`:active` via CSS
- `update()` non sovrascrive i controlli mentre l'utente sta interagendo (check `document.activeElement`)

---

## 2.0.67 — 2026-07-14

### feat(card): LetPot Max — LED full-spectrum, fasi crescita piante, pompa animata, barra 30min

- **Pannello LED full-spectrum realistico**: griglia 8×4 LED con rosso (660nm), blu (450nm) e bianco caldo; glow animato per ogni LED quando acceso; cono di luce viola/porpora verso le piante
- **Luce on/off basata su orario**: il pannello si illumina automaticamente tra `lightOnEntity` e `lightOffEntity`; testo stato "💜 Full Spectrum ON" / "⬛ Luce spenta"
- **6 fasi di crescita automatiche** basate su `plantsAgeEntity` (giorni):
  - 0-3g: Germinazione (piccoli germogli con 2 cotiledoni)
  - 4-10g: Piantina (piantine con prime foglie)
  - 11-21g: Vegetativa (piante medie con più coppie di foglie)
  - 22-40g: Crescita (piante alte e rigogliose)
  - 41-60g: Pre-raccolta (piante grandi con testa formata)
  - 60+g: Raccolta (piante mature con testa lattuga completa, dettagli densi)
- **SVG piante parametrizzate**: altezza, numero foglie, colori e forma testa cambiano progressivamente per ogni fase; re-render completo automatico solo al cambio di fase
- **Pompa nel tank con ingranaggio**: ⚙️ rotante via CSS animation quando pompa attiva; frecce di circolazione ← ◆ → con glow; 3 cerchi ripple concentrici che si espandono
- **Barra countdown 30 minuti**: calcolata su `Date.now() % 1800000`, mostra il tempo rimanente al prossimo ciclo; verde > 60%, giallo 25-60%, arancione < 25%; visibile solo se `pumpCyclingEntity` è attivo
- **Effetto luce sulle piante**: quando la luce è attiva, overlay viola/porpora gradient su piante e superficie acqua
- **Tutto il testo a #fff**: rimossi tutti i `rgba(255,255,255,.X)` dal testo; solo colori solidi o bianchi puri
- `update()` gestisce barra ciclo pompa in tempo reale; se la fase di crescita cambia fa re-render completo automatico

---

## 2.0.66 — 2026-07-14

### feat(card): LetPot Max — bottone ⚙️ nell'header apre il popup impostazioni

- Aggiunto bottone ⚙️ nell'header della card (sempre visibile, senza entrare in modalità modifica)
- Click → apre direttamente il popup bottom-sheet con i campi entità e autocomplete live

---

## 2.0.65 — 2026-07-14

### fix(card): LetPot Max — configure come popup dal basso, rimosso tab interno

- `configure()` ora apre un popup bottom-sheet esattamente come le altre card
- Input di testo libero per ogni entità con dropdown autocomplete live
- Mentre si digita filtra le entità HA per dominio + testo (match parziale)
- Al focus sul campo mostra subito i suggerimenti del dominio corretto
- `mousedown` sul suggerimento evita il blur sull'input (niente chiusura prematura)
- Risultati ordinati: prima i match con prefisso, poi alfabetici, max 10
- Focus automatico sul primo campo vuoto all'apertura
- Rimosso completamente il tab interno dalla card (render pulito, solo dashboard)

---

## 2.0.64 — 2026-07-14

### feat(card): LetPot Max — autocomplete entità live negli input

- Sostituiti i `<select>` con `<input>` + dropdown autocomplete live
- Mentre si digita filtra le entità HA per dominio E per testo inserito (incluso testo a metà nome)
- Al focus mostra subito tutti i suggerimenti per quel dominio
- Click sul suggerimento compila l'input e chiude il dropdown
- Blur nasconde il dropdown con delay di 180ms (tempo per il click)
- Hover con highlight viola sui suggerimenti
- I suggerimenti si ordinano: prima i match con prefisso esatto, poi alfabetici

---

## 2.0.63 — 2026-07-14

### feat(card): LetPot Max — tab Impostazioni interno + fix re-render animazioni

- Tab interno alla card: 📊 Dashboard / ⚙️ Impostazioni (nessun popup esterno)
- Tab Impostazioni mostra select dropdown per ogni entità, popolati automaticamente dalle entità HA disponibili filtrate per dominio (switch, sensor, binary_sensor, time, number, select)
- Config salvata in localStorage (chiave `frarik_letpot_<cardId>`), sincronizzata tra dispositivi dal sistema Frarik come tutte le altre card
- `configure(card, el)` apre il tab Impostazioni direttamente dentro la card (accessibile anche dal menu modifica)
- Fix re-render: `update()` ora aggiorna i valori in modo mirato via `data-lp-*` senza ricreare il DOM — le animazioni (onda acqua, piante, LED, bolle) non si interrompono mai più
- Stili CSS `@keyframes` iniettati una volta sola nel `<head>` con id `lp-kf`
- Event delegation su `el` in `mount()` — i handler sopravvivono al cambio tab

---

## 2.0.62 — 2026-07-14

### refactor(card): LetPot Max convertita da distintivo a card dashboard completa

- `LetpotMax.js` riscritto come full JS dashboard card (`type: js-custom`)
- Rimossi `isDistintivo`, `chip()`, `watchEntities()` — non è più un badge
- `render(card, rawHass)` — primo argomento è ora il card object completo
- `configure(card, el, onSave)` — `onSave` riceve il card object aggiornato con le entity
- Entity ID ora memorizzati come proprietà del card object: `powerEntity`, `waterLevelEntity`, ecc.
- Registrazione con `colSpan: 2, rowSpan: 3` per il grid layout
- Tutte le animazioni originali mantenute: LED bar, 5 piante SVG sway, onda acqua, bolle pompa
- Layout flex verticale per riempire correttamente l'altezza della card

---

## 2.0.61 — 2026-07-14

### feat(card): nuovo distintivo LetPot Max — sistema idroponico animato

- Distintivo `letpot-max` con visualizzazione realistica del sistema idroponico
- LED grow light bar animata (pulsazione viola/rossa quando luce attiva)
- 5 piante SVG con animazione di ondeggiamento (sway) indipendente
- Tank dell'acqua con onda animata SVG e livello dinamico (riflette water level %)
- Bolle CSS animate quando la pompa è in funzione
- Stats in tempo reale: livello acqua, temperatura, età piante
- Diagnostica alert: nutrienti, acqua bassa, errore ricarica
- Stato pompa, auto mode, pump cycling
- Orario luce (accensione/spegnimento) con rilevamento automatico se luce è ON
- chip() per il badge bar con colore dinamico (verde/arancio/rosso in base agli alert)
- configure() con tutti i 15 entity ID configurabili
- preview() con dati mock per anteprima Store

---

## 2.0.60 — 2026-07-14

### fix(sync): timestamp canonico lato server — elimina clock skew tra dispositivi

**Causa radice del problema di sincronizzazione**: il timestamp `_ts` veniva assegnato da ogni
dispositivo con `Date.now()` locale. Se il cell aveva l'orologio anche solo qualche secondo avanti
rispetto al PC, i suoi `_ts` erano sempre più alti → le sue modifiche "vincevano" sempre nel
confronto, e il sistema continuava a sovrascrivere la config del PC con quella del cell.

**Fix lato server** (`server.js`):
- Il POST `/api/frarik/config` ora assegna `_ts = Date.now()` **server-side** prima di salvare
- Il `_ts` canonico viene restituito nella risposta `{ ok: true, _ts: ... }`

**Fix lato client** (`main.js`):
- `_haSaveCfg()` legge il `_ts` dalla risposta del server e aggiorna `cfg._ts` + localStorage
- Da questo momento tutti i confronti usano il clock del server, non quello del dispositivo → nessuno sfasamento possibile

---

## 2.0.59 — 2026-07-14

### fix(sync): protezione perdita config remota + refresh badge al sync + hint watt distintivo energia

- **Bug sync config**: aggiunto guard `v !== null` in `_haLoadCfg` — prima, se il server rispondeva con errore HTTP (`r.ok = false`), `v = null` veniva trattato come "server vuoto" e la config locale (del cell) veniva pushata al server sovrascrivendo le condizioni salvate da PC
- **Refresh badge mancante**: aggiunto `renderBadgesAll()` in `_applyRemoteCfg` — dopo aver applicato la config remota le badge ora si ridisegnano correttamente con le nuove condizioni
- **GruppoEnergia configure**: aggiunto pannello informativo con consumo attuale in W + suggerimento "aggiungi una regola Fallback" per evitare che il chip torni al colore automatico quando nessuna soglia watt è soddisfatta

---

## 2.0.58 — 2026-07-13

### fix(distintivi): riprogettazione colore chip — due sezioni separate Contenuto e Bordo

- Rimossa la sezione "Applica colore a" (confusionaria): sostituita da due controlli completamente indipendenti
- **Contenuto (testo, icona, numeri)**: Fisso | Condizioni — controlla `--bc` (colore testo/icona)
- **Bordo**: Nessuno | Fisso | Condizioni — controlla `--bbc` (colore bordo del chip via CSS var)
- Ogni sezione ha il proprio set di regole/condizioni con dropdown custom
- Tutti i 14 chip() aggiornati per calcolare e restituire `borderColor` separato tramite `evalBorderColor()`
- `evalBorderColor()` aggiunto al modulo FCR: legge `borderMode/borderFixed/borderRules` dal cfg

---

## 2.0.57 — 2026-07-13

### feat(distintivi): dropdown custom, rimozione "Automatico", opzione colorTarget

- Rimossa la modalità "Automatico" dal sistema FCR — rimangono solo "Fisso" e "Condizioni"
- Il menu a tendina delle condizioni è ora un dropdown custom con sfondo scuro, sostituisce il `<select>` nativo che mostrava sfondo bianco del sistema
- Aggiunta opzione "Applica colore a": scelta tra "Testo, icona e numero" (comportamento precedente) e "Solo bordo" (il bordo del chip segue la condizione/colore, testo e icona usano un colore fisso separato)
- CSS: variabile `--bbc` aggiunta a `.hbadge` per controllare il colore del bordo indipendentemente dal testo (`--bc`)
- Tutti i 14 distintivi aggiornati con `colorTarget` e `iconColor` nel configure

---

## 2.0.56 — 2026-07-13

### feat(distintivi): sistema condizioni automatico per ogni distintivo

- Sezione "Condizioni" completamente ridisegnata: non richiede più l'inserimento manuale di entity_id
- Ogni distintivo fornisce ora un menu di condizioni preimpostato, specifico per il suo tipo:
  - **Luci**: "Almeno una luce accesa" / "Tutte le luci spente"
  - **Porte / Finestre / Tapparelle**: "Almeno una aperta" / "Tutte chiuse"
  - **Presenza**: "Presenza rilevata" / "Nessuna presenza"
  - **Allagamento**: "Allarme attivo" / "Nessun allagamento"
  - **Prese**: stato on/off + soglie watt configurabili
  - **Clima**: "Almeno un clima acceso" / "Tutti spenti"
  - **Temperatura**: soglie °C (maggiore di / minore o uguale a)
  - **Calendario**: "Oggi/in corso", "Entro N giorni", "Nessun evento"
  - **Scadenze**: "Scaduto", "Urgente", "In avvicinamento", "OK"
  - **Allarme**: "Scattato", "Armato", "Pending", "Disarmato"
  - **Energia**: soglie watt (consumo >W / ≤W)
  - **Batterie**: "Offline", "Critica", "Bassa", "Tutte OK"
- L'utente sceglie solo la condizione dal menu e il colore, senza inserire nulla manualmente
- Rebuild panel v2.0.56

## 2.0.55 — 2026-07-13

### fix(core): FratechColorRules integrato nel panel addon

- Codice colore chip spostato da `_colorRules.js` (card-distintivi) a `src/main.js` (core)
- Eliminato `_colorRules.js`: non appare più nel tab Distintivi dello store
- Aggiunto filtro `exclude:/^_/` nello store: file con prefisso `_` non sono elencati
- Rebuild panel v2.0.55

## 2.0.54 — 2026-07-13

### feat(distintivi): sistema colore dinamico per tutti i 14 distintivi

- Aggiunto `_colorRules.js` — modulo condiviso `window.FratechColorRules` con 3 modalità colore:
  - **Automatico**: logica colore built-in (comportamento precedente invariato)
  - **Fisso**: colore hex fisso per il chip
  - **Condizioni**: regole multiple, prima condizione soddisfatta vince (supporta 2+ colori)
- Condizioni supportate: `any_on`, `all_on`, `any_off`, `all_off` (lista entità), `compare` (entità + attr opzionale + operatore + valore)
- Operatori compare: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`
- Regola senza condizione = fallback (sempre abbinata)
- Integrazione in tutti e 14 i file Gruppo*: `defaultCfg`, `chip()`, `configure()` (html sezione, attach, save)

## 2.0.53 — 2026-07-13

### fix(distintivi): UI popup calendario + scadenze — testi bianchi, layout migliorato

**GruppoCalendario:**
- Popup: rimosso badge nome calendario accanto agli orari
- Popup: font titolo evento 15px, orario 12px, padding righe più ampio (13px vs 9px)
- Header giorno: font 13px, contatore eventi bianco (#fff) invece di rgba
- Tutti i testi secondari (orario, location, nessun-evento) portati a #fff

**GruppoScadenze:**
- Chip: formato giorni separato — "tra 171 gg" invece di "171gg"
- Popup: mostra solo scadenze entro 90 giorni (3 mesi); se tutte > 3 mesi mostra messaggio positivo
- Popup: font nome scadenza 14px, tutti i testi secondari (costo) a #fff
- Empty state differenziato: "nessuna configurata" vs "nessuna nei 3 mesi"

## 2.0.52 — 2026-07-13

### feat(distintivi): GruppoCalendario v2.0 + GruppoScadenze v2.0 — redesign completo

**GruppoCalendario v2.0:**
- Chip: mostra eventi del giorno più vicino (conteggio + colore: verde/>5gg, arancio/≤4gg, rosso/oggi-attivo)
- Popup: fetch 7 giorni via `callApi GET /api/calendars/{id}?start=...&end=...`, raggruppamento per giorno con header colorato e contatore
- Ogni evento mostra: orario, titolo, nome calendario (colorato), location se presente
- mount() con spinner loading → fetch asincrona → risultati, poll ogni 5 minuti

**GruppoScadenze v2.0:**
- Chip: mostra giorni della scadenza più urgente ("SCADUTO", "OGGI", "DOMANI", "3gg") con colore dinamico
- Popup: clessidra animata per ogni voce, badge giorni, visualizzazione `costo_previsto` in EUR
- Soglie: ≤0gg=scaduto (rosso), 1-10gg=urgente (arancio), 11-30gg=in arrivo (arancio), >30gg=ok (verde)
- Priorità lettura giorni: `giorni_mancanti` (int diretto) → `date_attr` config → attributi standard → state
- Display name: usa `state` se testo leggibile (es. nome scadenza), altrimenti `friendly_name`

## 2.0.51 — 2026-07-13

### fix(notifiche): PKG nuovo → tab pkg, PKG aggiornato → tab updates

- `pkg-new:filename` per PKG mai installato → naviga a `pkg-non-installati`
- `pkg-upd:filename` per PKG aggiornato → naviga a `updates`
- `_ntfClearPkg` aggiornato con helper `_isPkgAction`/`_pkgActionFile` per gestire tutti i prefissi

## 2.0.50 — 2026-07-13

### fix(notifiche): nuovi → tab tipo specifico, aggiornamenti → tab "updates"

- Action string differenziata: `gh-new:folder/file.js` per nuovi, `gh-upd:folder/file.js` per aggiornamenti
- `_ntfHandleAction`: `gh-upd:*` → sempre tab `updates`; `gh-new:*` → tab specifico del tipo (card/chip/distintivi/…)
- `_ntfClearGh` e `_ntfClearGhExcept` refactored con helper `_ghActionPath`/`_isGhAction` per gestire tutti i prefissi (gh:, gh-new:, gh-upd:) + backward compat legacy

## 2.0.49 — 2026-07-13

### fix(notifiche): navigazione al tab corretto in base al tipo di contenuto

- **_ntfHandleAction**: invece di andare sempre su "updates", ora naviga al tab specifico del tipo:
  - `card-js/*` → tab **Card** (`cards-non-installate`)
  - `card-chips/*` → tab **Chip** (`chips-non-installate`)
  - `card-distintivi/*` → tab **Distintivi** (`distintivi-non-installate`)
  - `card-yaml/*` → tab yaml; `card-premium/*` → tab premium
  - `pkg:*` → tab **PKG** (`pkg-non-installati`)
- **Action string**: cambiata da `'gh:filename.js'` a `'gh:card-js/filename.js'` (include la cartella), così il router sa che tipo è senza ricerche aggiuntive
- **Titolo/icona notifica**: differenziati per tipo — ⚡ card, 🔹 chip, 🏷️ distintivo
- **_ntfClearGh**: gestisce sia il nuovo formato path sia il vecchio formato solo-filename (backward compat)
- **_ntfClearGhExcept**: stesso, usando `keepBase` per matching su vecchie notifiche in localStorage

## 2.0.48 — 2026-07-13

### feat: 2 nuovi distintivi — GruppoScadenze e GruppoCalendario

**GruppoScadenze v1.0** (`card-distintivi/GruppoScadenze.js`):
- Chip scadenze/date con clessidra animata per ogni voce
- Stato expired (rosso, clessidra vuota+pulsante), urgent (arancio, sabbia cadente), ok (verde, clessidra piena)
- Parsing automatico date: ISO (YYYY-MM-DD), DD/MM/YYYY, numero giorni rimanenti
- Ricerca attributo data: `expiry_date`, `due_date`, `end_date`, `valid_until`, `scadenza` + campo libero `date_attr`
- Soglia urgente configurabile (default 7gg), ordinamento popup expired→urgent→ok
- Configure con autocomplete sensori + hint utile

**GruppoCalendario v1.0** (`card-distintivi/GruppoCalendario.js`):
- Chip calendari HA — entità `calendar.*` (Google Calendar, locale, ecc.)
- Chip mostra eventi attivi ora (viola pulsante) o totale calendari configurati (blu)
- Popup: una riga per calendario con SVG pagina calendario animata, titolo evento, orario, durata, luogo
- Dot rosso pulsante su chip e SVG quando evento in corso
- Configure con autocomplete che mostra prima tutte le entità `calendar.*`
- `_hideSubtitle()` in mount(), polling 30s

## 2.0.47 — 2026-07-13

### fix(GruppoPresenza): v1.3 — omino profilo laterale, cammina avanti/indietro

- Redesign completo _presenceSvg: vista laterale (profilo verso destra) invece che frontale
- Gambe e braccia partono tutte dritte verso il basso dall'articolazione e oscillano sull'asse X (+rot=avanti, -rot=indietro)
- Gamba1/Braccio2 in fase, Gamba2/Braccio1 in controfase → gait bipede corretto
- Naso come indicatore direzione (triangolino verso destra)
- Torso: linea stretta laterale (non più trapezio frontale)
- Stato fermo: profilo grigio con gambe quasi unite

## 2.0.46 — 2026-07-13

### feat(GruppoPresenza): v1.2 — persona che cammina animata, rimossa scritta tempo

- **SVG persona che cammina**: gambe e braccia animate CSS con pivot sulle articolazioni (spalle e anche). Gamba sx/braccio dx in fase, gamba dx/braccio sx in controfase — ciclo 0.55s
- Stato libero: silhouette grigio-ardesia ferma, nessuna animazione
- Stato rilevato: silhouette ambra con gambe e braccia oscillanti + glow pulsante sulla testa
- Rimossa riga "Rilevato da / Libero da" sotto il nome del sensore

## 2.0.45 — 2026-07-13

### feat(GruppoPresenza): v1.1 — SVG persona ridisegnata, sottotitolo nascosto

- **SVG persona ridisegnata**: silhouette anatomica reale (testa+collo+torso+braccia+gambe) con gradiente
  - Stato libero: silhouette grigio-ardesia spenta, nessuna animazione
  - Stato rilevato: persona ambra (#f59e0b) luminosa + 3 anelli radar espandenti centrati sul corpo + 3 particelle di moto che si allontanano + glow drop-shadow pulsante
- **Popup**: rimossa sezione summary (badge conteggio); riga di sfondo ambra tenue quando rilevato
- **mount()**: aggiunto `_hideSubtitle()` — nasconde sottotitolo framework nel header popup

## 2.0.44 — 2026-07-13

### fix(GruppoAllagamento): v1.2 — nasconde sottotitolo popup

- Aggiunto `_hideSubtitle()` in mount(): nasconde `textWrap.children[1]` nel header popup del framework (stesso pattern di GruppoPorte)

## 2.0.43 — 2026-07-13

### feat(GruppoAllagamento): v1.1 — pk_group, SVG animati, chip dinamico

- **pk_group**: campo opzionale per sensore gruppo HA (es. `group.allagamento`) — il chip mostra "OK"/"ALLAGATO" basandosi sul gruppo; se assente usa conteggio sensori individuali
- **Chip icon dinamica**: SVG inline — goccia blu con checkmark verde se asciutto, goccia rossa pulsante con drop-shadow animato se allagamento
- **Popup**: rimossa sezione summary (pill badges sotto il titolo); sostituita con hero SVG del sensore gruppo
- **Hero SVG gruppo**: larghezza piena — scena acqua calma + casa + cerchio check se asciutto; acqua rossa alluvionale animata + anelli alert se allagamento
- **SVG singolo sensore**: ridisegnato — goccia con gradiente, onde animate clippate dentro la goccia, anello pulsante esterno, gocce cadenti, badge checkmark/alert
- **Configure**: aggiunto campo "Sensore gruppo principale" con autocomplete (mostra prima group.* poi binary_sensor.*)

## 2.0.42 — 2026-07-13

### feat(card-distintivi): GruppoPresenza e GruppoAllagamento v1.0

- **GruppoPresenza** (`gruppo-presenza`): chip sensori presenza/movimento — chip ambra (#f59e0b) se presenze rilevate, verde se tutto libero. SVG silhouette persona con anelli pulsanti. Mappa tutti gli stati attivi (on/home/present/detected/active/motion).
- **GruppoAllagamento** (`gruppo-allagamento`): chip sensori umidità/allagamento — chip verde se asciutto, rosso (#f87171) se qualsiasi sensore bagnato. SVG goccia d'acqua con animazione onde. Mappa stati (on/wet/detected/moisture).
- Entrambi: chip(), watchEntities(), render(), mount() con polling 1500ms, update(), configure() con autocomplete entità
- Entrambi: testo 100% bianco #fff, popup con X + click-outside, isDistintivo:true

## 2.0.41 — 2026-07-13

### feat(deumidificatore-card): entità companion reali v1.5

- Ventola: legge `fan.deumidificatore` (auto-derivata) → tasti Bassa(50%)/Alta(100%) → chiama `fan.turn_on` con percentage
- Timer: legge `select.*_conto_alla_rovescia` → tasti cancel/1h/2h/3h → chiama `select.select_option`
- Ionizzatore: legge/toggler `switch.*_ionizzatore` → pulsante illuminato se attivo
- Blocco bambini: legge/toggler `switch.*_blocco_bambini` → pulsante illuminato se attivo
- Tutte le entità auto-derivate dalla base del pk_device, sovrascrivibili in config
- Config popup aggiornato con tutti i campi entità

## 2.0.40 — 2026-07-13

### feat(deumidificatore-card): ventola, conto alla rovescia, tutte le modalità v1.4

- Aggiunto controllo **Ventola** (Bassa/Alta) da `attrs.fan_modes` + `attrs.fan_mode` → chiama `humidifier.set_fan_mode`
- Aggiunto display **Conto alla rovescia** da `attrs.timer_time_remaining`
- Rimosso limite a 4 modalità (`slice(0,4)` eliminato) — ora mostra tutte inclusa "Lavanderia"
- Ventola attiva mostrata anche nella sezione info hero (chip colorato)
- Aggiornata firma update() per includere `fan_mode` e `timer_time_remaining`

## 2.0.39 — 2026-07-13

### fix(vmc-card): aggiunto tasto portata "Max" 100% v1.4

- Aggiunto 4° preset velocità: Max (100%) — in precedenza hardcoded a soli 3 (Bassa/Media/Alta)

## 2.0.38 — 2026-07-12

### fix(cards): immagine non tagliata — hero fuori dal container scroll v1.3

- Tutti e 3: `.fc-hero` + primo `.fc-sep` spostati fuori da `.fc-scroll` (che aveva overflow-y:auto che clippava tutto)
- `.fc-card`: overflow:hidden → overflow:visible (per non tagliare i glow effects)
- `.fc-art`: dimensioni fisse 130×130px, overflow:visible garantito
- Struttura: hdr → hero → sep → [scroll con i soli controlli]

## 2.0.37 — 2026-07-12

### fix(cards): immagine non più tagliata — art box più grande v1.2

- Tutti e 3 (deumidificatore, purificatore, vmc): `overflow:hidden` → `overflow:visible` su `.fc-art` e `.fc-hero-img`
- `max-width` art box: 110px → 130px; `max-height` hero-img: 130px → 160px

## 2.0.36 — 2026-07-12

### fix(cards): pill stato sempre bianca + SVG deumidificatore migliorato v1.1

- **Tutti e 3** (deumidificatore, purificatore, vmc): pill "Acceso/Spento" → testo sempre `#fff`, il colore accent rimane solo su dot e bordo
- **deumidificatore v1.1**: SVG completamente ridisegnato — corpo più luminoso con gradiente vivace, pale ventilatore a opacità `.7` (ben visibili), gocce d'acqua più grandi (r=2), anello pulsante intorno alla ventola quando acceso, glow drop-shadow animato sull'involucro

## 2.0.35 — 2026-07-12

### feat(cards): 3 nuove card — deumidificatore, purificatore, VMC v1.0

- **deumidificatore-card.js** v1.0: card per `humidifier.*`, SVG animato con ventola rotante, gocce d'acqua, display umidità; controlli on/off, target umidità ±5%, modalità
- **purificatore-card.js** v1.0: card per `fan.*`, SVG torre purificatore con anello pulsante, particelle flottanti, display PM2.5; controlli on/off, presets velocità (10/25/50/75/100%), modalità
- **vmc-card.js** v1.0: card per `fan.*`, SVG VMC a recupero con griglia doppia, scambiatore HRV, frecce flusso aria animate; sensori CO₂ e umidità opzionali; controlli on/off, portata (bassa/media/alta), modalità
- Tutte le card: testi `#fff`, struttura hero uguale alle altre card, popup config con X + click-outside + autocomplete entità + color picker

## 2.0.34 — 2026-07-12

### fix(speedtest-card): tutte le scritte bianche al 100% v1.5

- SVG gauge: label 0/metà/max, "SCARICAMENTO", "CARICAMENTO", "Mbit/s" → `fill="#fff"`
- Box metriche: label (↓ Scaricamento, ↑ Caricamento, ⚡ Ping, 〜 Jitter) → `#fff`
- Unità (Mbit/s, ms) sotto i valori → `#fff`
- Footer: label ISP, Server, Grade → `#fff`; badge "—" quando nessun grade → `#fff`
- Popup configurazione: label campi `#94a3b8` → `#fff`, testo input `#f1f5f9` → `#fff`, hint/es. `#475569` → `#fff`, dropdown items `#e2e8f0` → `#fff`

## 2.0.33 — 2026-07-12

### fix(alexa-card): tutte le scritte bianche al 100% v2.2

- Artista, album, stato inattivo: `rgba(255,255,255,.65/.38/.28)` → `#fff`
- Timestamp progresso (pos/dur): `rgba(255,255,255,.3)` → `#fff`
- Label "SORGENTE" e freccia dropdown: `rgba(255,255,255,.35/.4)` → `#fff`
- Bottoni inattivi (bOff, timer): `rgba(255,255,255,.6)` → `#fff`
- Label "Timer in corso" e ✕ annulla: `rgba(255,255,255,.35/.3)` → `#fff`
- Preset timer (pill): `rgba(255,255,255,.7)` → `#fff`
- Preset volume inattivi: `rgba(255,255,255,.5)` → `#fff`
- Label percentuale volume: `rgba(255,255,255,.45)` → `#fff`
- Popup configurazione: label campi `#94a3b8` → `#fff`, testo input `#f1f5f9` → `#fff`, hint → `#fff`, dropdown items `#e2e8f0` → `#fff`
- Popup sorgente: footer e "Nessuna sorgente" → `#fff`

## 2.0.32 — 2026-07-12

### feat(tv-card): struttura hero identica alle altre card v2.8

- Hero section ristrutturata come Alexa/UPS/database card:
  - `fc-hero-img` wrapper + `fc-art` con `width:140px;aspect-ratio:5/4` (ratio SVG TV)
  - `fc-hero-r` (colonna info destra) con `border-left` e `padding-left:12px`
- Art box: glow `box-shadow` animato (`tvArtPls`) quando TV è accesa — uguale ad Alexa `alArtPls`
- Art box `overflow:visible` mantenuto per far uscire il drop-shadow SVG
- Radial gradient sfondo header allargato a 240px per più profondità
- Titolo principale 14px (era 13px), spaziatura info migliorata

## 2.0.31 — 2026-07-12

### feat(tv-card): TV SVG più grande e animazioni schermo vivide v2.7

- **Schermo ON molto più luminoso**: glow radiale accent (0.32 opacità) + centro bianco brillante (0.14) + punto focale (0.10) — effetto backlight reale
- **Riflesso vetro**: gradiente bianco superiore che simula il riflesso della superficie
- **Scan line visibile**: linea bianca 2.5px (opacity 0.85) quando in riproduzione
- **Linee CRT**: tre linee orizzontali sottili per effetto display TV
- **Cornice con glow forte**: drop-shadow doppio pulsante (8px → 18px, opacity 0.8 → 1.0)
- **Art box più grande**: 130x106px (era 106x86px) — TV non più schiacciata
- **Fix titolo package name**: se `media_title` è un package Java (`com.X.Y.Z`), usa `app_name` invece

## 2.0.30 — 2026-07-12

### feat(tv-card): illustrazione TV realistica con animazioni v2.6

- **Nuovo TVG SVG**: TV flat panel Philips con schermo, cornice, logo, LED, supporto — disegnato in SVG
- **Animazioni ON**: cornice con drop-shadow pulsante, LED che lampeggia, riflesso sullo schermo
- **Animazioni PLAYING**: scan line che scorre dall'alto verso il basso sulla schermata
- **OFF**: schermo spento scuro, logo grigio, LED spento
- Hero box allargato (106x86px) con bordo colorato accent
- Info hero migliorata: titolo principale + sorgente/stato + pill ingresso + chip soundbar

## 2.0.29 — 2026-07-12

### fix(tv-card): testo bianco 100% + rimossi watt soundbar v2.5

- Tutte le scritte bianche a #fff (niente rgba con opacità ridotta) — card e popup impostazioni
- Rimossi watt (W) ovunque — chip soundbar nell'hero ora mostra "Accesa"/"Spenta" col pallino colorato
- Sezione soundbar in basso senza chip stato ridondante

## 2.0.28 — 2026-07-12

### fix(tv-card): rimosso tasto power soundbar v2.4

- Rimosso pulsante "Accendi/Spegni Soundbar" — la soundbar è già gestita da un'automazione HA collegata alla TV
- Mantenuto chip stato (W) accanto al titolo sezione Soundbar
- Mantenuti VOL−, MUTE (toggle illuminato), VOL+

## 2.0.27 — 2026-07-12

### feat(tv-card): mute illuminato + tasto power soundbar + touchpad pulito v2.3

- **Mute toggle**: pulsante 🔇 MUTE si illumina rosso con ✓ quando attivo, grigio quando disattivo — stato locale (IR non ha feedback)
- **Power soundbar**: nuovo pulsante ⏻ che mostra stato reale da `sensor.presa_tv_sala_potenza` (verde=accesa, grigio=spenta). Invia comando Broadlink configurabile (default: `power`)
- **Touchpad**: rimossi frecce e testi, solo simbolo ⊙ al centro — interfaccia più pulita
- Config ⚙: aggiunto campo POWER per comando Broadlink accensione soundbar

## 2.0.26 — 2026-07-12

### fix(tv-card): tasto TV usa remote.send_command TV v2.2

- Pulsante "📡 TV" ora invia `remote.send_command` con `command: TV` (KEYCODE_TV) invece di `select_source` — torna ai canali TV dal vivo anche dalla home

## 2.0.25 — 2026-07-12

### fix(tv-card): default comandi navigazione DPAD_* v2.1

- Default comandi: `DPAD_UP`, `DPAD_DOWN`, `DPAD_LEFT`, `DPAD_RIGHT`, `DPAD_CENTER` (confermati funzionanti dall'utente con `androidtv_remote`)

## 2.0.24 — 2026-07-12

### feat(tv-card): riscrittura completa v2.0 — touchpad, numeri, comandi configurabili

- **Touchpad**: area swipe/tap. Scorri ↑↓←→ = navigazione, tocco = OK/ENTER. Effetto ripple visivo
- **Numeri 0-9**: tastierino numerico per cambio canale via `remote.send_command`
- **Comandi configurabili in ⚙**: tutti i comandi di navigazione (UP/DOWN/LEFT/RIGHT/ENTER/BACK/HOME/MENU) modificabili dall'utente — se UP non funziona puoi scrivere DPAD_UP senza toccare codice
- **Soundbar**: `remote.broadlink` + device `soundbar_lg` + comandi `volume_su/volume_giu/mute` (invariato)
- **App shortcuts**: `media_player.select_source` per Netflix/YouTube/Spotify/TV
- **Playback**: `MEDIA_PLAY_PAUSE`, `MEDIA_FAST_FORWARD`, `MEDIA_REWIND`, `CHANNEL_UP`, `CHANNEL_DOWN`
- **Default comandi**: `UP`, `DOWN`, `LEFT`, `RIGHT`, `ENTER`, `BACK`, `HOME`, `MENU`
- **Layout migliorato**: Hero, App, Touchpad, Sistema, Riproduzione+CH, Numeri, Soundbar
- `colSpan:2, rowSpan:5`

## 2.0.23 — 2026-07-12

### fix(tv-card): comandi navigazione corretti per androidtv_remote v1.2

- **Navigazione**: cambiati da lowercase (`up/down/left/right/center`) → Android key codes (`DPAD_UP/DPAD_DOWN/DPAD_LEFT/DPAD_RIGHT/DPAD_CENTER`)
- **Back/Home/Menu**: ora `BACK`, `HOME`, `MENU`, `INFO` (uppercase richiesto da androidtv_remote)
- **Riproduzione**: ora `MEDIA_PLAY_PAUSE`, `MEDIA_FAST_FORWARD`, `MEDIA_REWIND`, `CHANNEL_UP`, `CHANNEL_DOWN`
- **App shortcuts**: cambiati da `remote.send_command` → `media_player.select_source` (più affidabile per Android TV)

## 2.0.22 — 2026-07-12

### fix(tv-card): riscrittura completa servizi corretti v1.1

- **Navigazione TV**: usa `remote.send_command` → `remote.tv_sala` (Android TV Remote) con comandi `up/down/left/right/center/back/home/menu/info`
- **App shortcuts**: Netflix, YouTube, Spotify, TV via `remote.tv_sala` con comandi `netflix/youtube/spotify/tv`
- **Riproduzione**: `play_pause/rewind/fast_forward/channel_up/channel_down` via `remote.tv_sala`
- **Soundbar (LG via Broadlink IR)**: `remote.send_command` → `remote.broadlink` + `device: soundbar_lg` + comandi `volume_su/volume_giu/mute`
- **Stato soundbar**: da `sensor.presa_tv_sala_potenza` (soglia W configurabile, default 30W)
- **Config ⚙**: campi dedicati Broadlink (entity, device, cmd vol+/vol-/mute), sensore potenza soundbar, soglia
- Rimosso `media_player.volume_up/down` (non funzionante su questo setup)
- Default pre-compilati per la configurazione dell'utente (`remote.tv_sala`, `remote.broadlink`, `soundbar_lg`, `sensor.presa_tv_sala_potenza`)

## 2.0.21 — 2026-07-12

### feat(tv-card): nuova card TV con telecomando completo v1.0

- **Hero**: art/thumbnail del media corrente (con fallback SVG TV animato), stato, titolo, sorgente attiva, chip soundbar
- **Controlli rapidi**: Accendi/Spegni, Mute audio, selettore ingresso (popup)
- **D-pad navigazione**: ▲▼◀▶ + OK grande centrale + BACK/HOME/MENU. Usa `remote.send_command` (configurabile in ⚙)
- **Riproduzione**: ⏮ ⏸/▶ ⏭ ⏹ + CH+/CH-
- **Volume**: slider drag TV + bottoni +/- | slider soundbar opzionale
- **Config ⚙**: entity TV, entity remote (navigazione), entity soundbar, nome, colore, nomi comandi navigazione personalizzabili
- **Rinomina inline**: click sul titolo header
- `colSpan:2, rowSpan:4, min-height:490px`

## 2.0.20 — 2026-07-12

### fix(alexa-card): altezza card fissa indipendente dallo stato v2.1

- `min-height: 375px` su `#rid` e `.fc-card`: la card ha sempre la stessa altezza sia attiva che inattiva
- La sezione hero si espande con `flex:1` per riempire lo spazio extra quando non c'è contenuto multimediale

## 2.0.19 — 2026-07-12

### fix(alexa-card): timer card-side + annuncio scadenza v2.0

- Timer gestito interamente nella card (countdown visivo). Non richiede servizi Alexa speciali
- Allo scadere: Alexa annuncia via TTS "Timer di X minuti scaduto!"
- Rimosso tentativo sequence_command (non disponibile nell'integrazione)

## 2.0.18 — 2026-07-12

### fix(alexa-card): timer reale Alexa via sequence_command v1.9

- Sostituito `notify` TTS con `alexa_media_player.sequence_command` + `Alexa.DeviceControls.SetTimer`
- Alexa imposta ora il timer reale invece di leggerlo ad alta voce
- `sequence_value` passa i secondi (min × 60) come intero

## 2.0.17 — 2026-07-12

### feat(alexa-card): timer countdown + input personalizzato v1.8

- **Timer countdown**: cliccando un preset il timer parte subito. Barra di avanzamento animata + countdown live (Xm XXs) aggiornato ogni secondo via setInterval diretto sul DOM (no re-render)
- **Input personalizzato**: campo numerico accanto ai preset (1-240 min) + pulsante ▶. Invio con Enter. Rosso se valore non valido. Focus guard blocca re-render durante digitazione
- **Annullamento**: pulsante ✕ accanto al countdown per cancellare il timer
- **Timer stato**: persiste tra re-render tramite variabile di modulo `_timerState`; l'intervallo si riavvia correttamente dopo ogni re-render
- **Sorgente**: popup mostra lista da `source_list` dell'entità; nota informativa per quando c'è solo "Local Speaker"

## 2.0.16 — 2026-07-12

### feat(alexa-card): preset volume + selezione sorgente + timer opzionale v1.7

- **Preset volume**: row con 4 bottoni rapidi 25% / 50% / 75% / 100% tra volume slider e TTS. Il bottone attivo viene illuminato
- **Selezione sorgente**: pill cliccabile (SORGENTE ▾) nella colonna destra della hero. Apre popup slide-up con lista sorgenti da `source_list`. Chiama `media_player.select_source`
- **Timer opzionale**: bottone ⏱ nella riga controlli. Click → mostra/nasconde row con preset 5m / 10m / 15m / 30m / 1h. Ogni preset invia TTS Alexa per impostare il timer. Stato timer persiste tra re-render (variabile di modulo)

## 2.0.15 — 2026-07-12

### feat(alexa-card): rinomina inline cliccando sul titolo v1.6

- Clicca direttamente sul titolo "Alexa" nell'header → diventa input inline
- Enter o click fuori → salva e aggiorna la card
- Escape → annulla senza salvare
- Cursore `text` sull'header title come hint visivo

## 2.0.14 — 2026-07-12

### fix(alexa-card): shuffle/repeat sempre attivi v1.5

- Rimosso check `supported_features`: alexa_media_player non espone correttamente il bitmask → i tasti venivano disabilitati erroneamente
- Shuffle, repeat, stop, volume e mute sempre cliccabili

## 2.0.13 — 2026-07-12

### feat(alexa-card): TTS inline + fix shuffle/repeat + supported_features check v1.4

- **TTS inline**: campo testo in fondo alla card con pulsante "Parla" + invio con Enter. Chiama `notify.alexa_media` (configurabile in ⚙). Blocco re-render durante digitazione (`_axTtsFocus`)
- **Shuffle/Repeat**: controllo `supported_features` bitmask (SF_SHUFFLE=32768, SF_REPEAT=262144). Se non supportato: bottone visibile ma dimmed + `pointer-events:none`. Se `supported_features=0` (alexa_media_player non lo espone): tutti i tasti considerati supportati
- **Config**: nuovo campo `pk_notify` per il servizio TTS (default `alexa_media`)
- **Config save**: dopo salvataggio reset `_axBound` e re-render immediato

## 2.0.12 — 2026-07-12

### fix(alexa-card): tasti shuffle/repeat funzionanti + equalizzatore full-width v1.3

- **Bug fix critico**: `update()` resettava `_axBound` solo al primo render → dopo ogni re-render i click handler puntavano al DOM vecchio → tasti non rispondevano. Fix: reset `_axBound = null` prima di ogni re-render + `mount()` chiamato sempre
- **Bug fix shuffle/mute**: `attrs.shuffle` può essere stringa `'false'` → `!attrs.shuffle` = `false` (sempre disattivato). Fix: confronto esplicito `=== true || === 'true'` per shuffle, mute e repeat
- **Equalizzatore**: barre `flex:1` + container `width:100%` → occupano tutta la larghezza della colonna destra
- Barre con `box-shadow` glow potenziato a `99` durante riproduzione

## 2.0.11 — 2026-07-12

### fix(alexa-card): sfondo standard + equalizzatore esteso + glow attivi v1.2

- Sfondo card: `linear-gradient(155deg,#060d14,#080f18)` — identico a UPS/Speedtest/Database
- Equalizzatore: 9 barre (era 7), width 4px (era 3px), altezza max 22px (era 14px), glow sui singoli bar durante riproduzione
- Bottoni shuffle/repeat attivi: bordo pieno `col`, background 22%, `box-shadow` glow esterno + interno — visibile a colpo d'occhio
- Bottone play/pause: stesso glow potenziato

## 2.0.10 — 2026-07-12

### fix(alexa-card): layout 2 colonne + volume real-time v1.1

- Layout: album art a sinistra (fc-hero-img) / info a destra (fc-hero-r) — identico a UPS/Speedtest
- Vinile SVG fallback anch'esso nella colonna sinistra
- Volume: `el._axVolDragging` blocca i re-render durante il drag → niente più scatti
- Volume: `applyVolUI()` aggiorna fill/knob/label direttamente nel DOM senza re-render
- Volume: callSvc throttled 80ms durante il trascinamento + chiamata finale su mouseup/touchend
- Separatori 1px tra hero / controlli / volume (stile UPS)

## 2.0.9 — 2026-07-12

### feat(alexa-card): nuova card media player Alexa v1.0

- Album art animata con glow pulsante quando in riproduzione
- Vinile SVG rotante come fallback quando non c'è cover art
- Equalizzatore animato (7 barre) — attivo solo durante la riproduzione
- Controlli: ⏮ precedente, ⏹ stop, ▶/⏸ play-pausa, ⏭ successivo
- Shuffle e Repeat ciclico (off → all → one → off)
- Slider volume interattivo con drag mouse e touch
- Tasto mute
- Barra di progresso con tempi (se il media player fornisce durata)
- Badge stato animato nell'header (pulsante quando in riproduzione)
- Popup config con autocomplete media_player.*, scelta nome e 8 colori accent
- Popup standard: X di chiusura + click-outside

## 2.0.8 — 2026-07-12

### fix(speedtest-card): layout top-down — altezza card identica in tutti gli stati v1.4

- Bufferbloat rimosso dal corpo hero (era la causa del cambiamento: badge 24px vs span inline ~13px)
- Grade spostato nel footer con badge e "—" entrambi `height:20px` — footer sempre uguale
- Hero `flex:1` identico a ups-card/system-card/database-card
- Righe box: `flex:1;min-height:0;overflow:hidden` — si dividono lo spazio del hero in modo top-down, non crescono dal basso in base al contenuto
- Box: `min-height:0;overflow:hidden` — non può mai espandersi oltre il proprio slot
- Val(): `line-height:1` esplicito sul div valore — altezza riga deterministica in tutti gli stati

## 2.0.7 — 2026-07-12

### fix(speedtest-card): altezza costante tra running e completato + timer 10s v1.3

- `val()`: riga unità (Mbit/s / ms) sempre renderizzata, non solo quando v!=null → altezza box identica in tutti gli stati
- Bufferbloat row: sempre presente (con "—" se non disponibile), non aggiunta solo dopo il test → niente salto di altezza
- Timer fallback ridotto da 40s a 10s come richiesto

## 2.0.6 — 2026-07-12

### fix(speedtest-card): layout compatto + fix test bloccato + split hero 50/50
### fix(system-card): immagine hero flex:1 (da width:90px fisso) come UPS
### fix(database-card): immagine hero flex:1 (da width:90px fisso) come UPS

**speedtest-card v1.2:**
- Fix "test bloccato": rilevamento completamento tramite `last_updated !== _spInitLu` (snapshot pre-test), non confronto timestamp assoluti
- Fallback timer ridotto a 40s (da 120s)
- Layout hero rifatto: sinistra gauge 50%, destra 2x2 grid riquadri (Scaricamento/Caricamento/Ping/Jitter)
- Barra statistiche rimossa (redundante, dati già nei riquadri)
- Provider e Server: compact inline footer a 1 riga sotto l'hero
- `statusLbl` in pill header: IN CORSO / COMPLETATO / —
- Altezza card allineata alle altre (Mini-PC, Database, UPS)

**system-card v5.7 / database-card v2.4:**
- Hero image: da `width:90px;flex-shrink:0` a `flex:1;max-height:130px;overflow:hidden`
- Tutti i card ora split 50/50 nell'area hero, identici a UPS

## 2.0.5 — 2026-07-12

### feat(speedtest-card): animazione test + etichette italiane + reset 30s v1.1

- Etichette tutte in italiano: SCARICAMENTO / CARICAMENTO / Provider / Avvia Test / ecc.
- Animazione running: doppio anello CSS con stroke-dashoffset in movimento, puntini lampeggianti, ⏳ pulsante
- Barra statistiche mostra "…" durante il test (dati nascosti perché non aggiornati)
- Pill header mostra IN CORSO / COMPLETATO / OK con colore dinamico
- Rilevamento completamento test: confronto last_updated del sensore download con timestamp avvio
- Bordo verde + bottone "✅ Completato!" per 30s dopo il test, poi reset automatico ad IDLE
- Timeout automatico 120s se HA non aggiorna (fallback di sicurezza)
- Sensori già configurati rimangono intatti al bump di versione (localStorage key invariata)
- `el._fspBound = null` prima del re-render da click per forzare re-mount del handler

## 2.0.4 — 2026-07-12

### feat(speedtest-card): nuova card monitoraggio connessione internet

- Doppio anello gauge animato: anello esterno = download, anello interno = upload
- Colori dinamici: verde >70%, ciano/viola >35%, arancione sotto soglia
- Tick marks sull'anello esterno con label 0 / metà / max velocità
- Valori DL e UL visualizzati al centro del gauge SVG con glow filter
- Colonna destra: Ping grande colorato (verde <20ms, ciano <50ms, arancione+ sopra)
- Badge Bufferbloat Grade colorato A/B/C/D/F
- Barra riepilogativa: DL, UL, Ping, Jitter
- Righe ISP e Server
- Pulsante "⚡ Avvia Test" con feedback visivo (3 sec)
- Icona ⚙ in header per configurare tutti i sensori con autocomplete entità HA
- Velocità massima configurabile (default 500 Mbit/s)
- colSpan: 2, rowSpan: 3 — non richiede PKG (usa integrazione Ookla built-in HA)

## 2.0.3 — 2026-07-12

### feat(ups-card): nuovo SVG animato v1.3

- Corpo UPS con viewBox 64×96 e border che pulsa (stroke-opacity animation)
- 5 barre batteria orizzontali che appaiono una per una dal basso con fade-in sfalsato
- LED PWR (verde, OL) e BATT (arancione, OB) con animazione pulse a velocità diversa
- Display LCD in alto con stato (ON LINE / ON BATT / N/D) e percentuale batteria colorata
- Bolt di ricarica ⚡ animato (stroke-width + opacity) visibile solo quando ON LINE
- Linee AC IN / AC OUT con dashes animati (stroke-dashoffset) che mostrano flusso corrente
- Socket IEC C13 con 3 fori (2 rotondi + 1 rettangolare) in fondo al pannello

## 2.0.2 — 2026-07-12

### fix(pkg-bolletta): rimosso prefisso media_player. dal template (evitava media_player.media_player.xxx)

- frarik_bolletta.yaml: `media_player.IL_TUO_ALEXA` → `IL_TUO_ALEXA`
- Il template ora usa solo il placeholder puro; l'utente inserisce l'entity ID completo nel wizard

## 2.0.1 — 2026-07-12

### fix(pkg): correzione errori YAML UPS e Bolletta + wizard pre-fill valori precedenti

- **frarik_ups.yaml**: `- service:` → `- action:` nel notify.group (HA 2024+ richiede `action`)
- **frarik_ups.yaml**: indentazione template sensor corretta (`sensor:` → `  - name:` a rientro 6 spazi)
- **frarik_bolletta.yaml**: rimosso prefisso `sensor.` dal template del sensore potenza (causava `sensor.sensor.xxx`)
- **wizard**: pre-fill automatico dei valori inseriti in precedenza (salvati in localStorage per pkg)
- **wizard**: banner informativo "Valori precompilati" se sono disponibili valori precedenti

## 2.0.0 — 2026-07-12

### fix(ups-card): registrazione corretta + fix tasto aggiungi/cancella store

- **Bug critico**: `FratechCardRegistry.register()` non esiste → la card non si registrava mai → niente tasti Aggiungi/Cancella nello store
- Corretto con `window.FratechCardRegistry[CARD.id] = CARD` (stesso pattern di Lavatrice e tutte le altre card)
- Aggiunti `frarik_pkg_id: 'frarik_ups'`, `frarik_pkg_check`, `frarik_pkg_version` per il link PKG nello store
- Aggiunta `desc` visibile nello store
- ups-card v1.1 → v1.2

### fix(store): wizard PKG riaperto all'aggiornamento per card senza openWizard

- `_pkgGenericInstall`: se il YAML contiene placeholder `IL_TUO_*`, apre `_pkgShowWizard` prima di installare
- Prima il PKG veniva reinstallato raw senza chiedere i sensori all'utente
- bump 1.9.99 → 2.0.0

## 1.9.99 — 2026-07-12

### feat(ups): aggiunto tipo UPS e stato testuale

- `pkg/frarik_ups.yaml`: aggiunti `IL_TUO_SENSORE_TIPO_UPS` e `IL_TUO_SENSORE_STATO` come placeholder configurabili dal wizard
- Template sensor: nuovi attributi `tipo_ups` e `stato_ups` nell'entità aggregata
- `ups-card.js` v1.1: `pk_tipo` e `pk_stato_txt` in pkDefaults, mostrati nel popup Storico e nel config wizard
- bump 1.9.98 → 1.9.99

## 1.9.98 — 2026-07-12

### fix(pkg/ups): aggiunto placeholder IL_TUO_* per tutti i sensori UPS

- `IL_TUO_SENSORE_STATO_UPS` — sensore stato OL/OB/unknown
- `IL_TUO_SENSORE_BATTERIA_UPS` — sensore carica batteria %
- `IL_TUO_SENSORE_CARICO_UPS` — sensore carico UPS %
- `IL_TUO_SENSORE_VOLT_INGRESSO` — tensione ingresso V
- `IL_TUO_SENSORE_VOLT_USCITA` — tensione uscita V
- `IL_TUO_MOBILE_APP` — servizio notifiche push
- Il wizard dello store ora chiede tutti i sensori durante l'installazione
- bump 1.9.97 → 1.9.98

## 1.9.97 — 2026-07-12

### feat(pkg): aggiunto frarik_ups.yaml nel Frarik Store

- `pkg/frarik_ups.yaml` — package UPS Tecnoware ora disponibile nello store PKG
- Header Frarik corretto (author: Frarik, reference: github.com/Frarik/cards)
- Placeholder `IL_TUO_MOBILE_APP` per notifiche push
- bump 1.9.96 → 1.9.97

## 1.9.96 — 2026-07-12

### feat(ups-card): nuova card UPS Tecnoware v1.0

- SVG animato UPS con 5 segmenti batteria (riempimento dal basso, colore per livello: blu >40%, arancione 20-40%, rosso <20%)
- LED status pulsante: verde=ON LINE, arancione=ON BATTERY, grigio=N/D
- Hero destra: batteria % grande + barra + Carico / V-In / V-Out
- Stats bar: blackout oggi / mese / anno / durata ultimo
- Popup Storico: contatori blackout + dati ultimo evento
- Popup Notifiche: toggle per i 3 input_boolean push
- Popup Soglie: soglie avviso e spegnimento server + reset contatori + accesso config sensori
- Config wizard con autocomplete per tutti i sensori del pkg (18 entità)
- Catalogo card aggiornato (35 card totali)
- bump 1.9.95 → 1.9.96

## 1.9.95 — 2026-07-11

### fix(GruppoEnergia): storico, grafico e stats ora funzionanti

- `_fetchHist` usava `window.fetchHistory` che non esiste nel contesto Frarik → grafico e stats (kWh/costo/picco) bloccati a "Caricamento…" e "—"
- Riscritto per usare `h.callApi('GET', history/period/...)` come GruppoTemperatura, con cache 10min
- `_loadData`: passa `h` a `_fetchHist` e usa la stessa istanza hass anche per leggere il sensore kWhEntity
- bump GruppoEnergia 2.9 → 3.1 · addon 1.9.94 → 1.9.95

## 1.9.94 — 2026-07-11

### fix(Store): anteprime distintivi installati usano config reale dell'utente

- `_ghcLivePrev`: cerca la config anche in `headerBadges` (dove vivono i distintivi) oltre che in `cards` — prima passava sempre una config vuota e i distintivi mostravano "Nessuna entità configurata"
- bump 1.9.93 → 1.9.94

## 1.9.93 — 2026-07-11

### redesign(GruppoBatterie): popup colonna singola mobile-friendly

- Rimosso layout a 3 colonne affiancate (illeggibile su telefono)
- Ogni batteria è ora una riga: emoji status | nome | barra | percentuale
- Sezioni con header colorato: Offline · Critiche · Basse · OK
- Batterie "OK" con riga compatta, problematiche con sfondo/bordo evidenziato
- Counter pills sotto il summary (📴 🔴 🟡 ✅ con i conteggi)
- bump GruppoBatterie 1.5 → 1.6 · addon 1.9.92 → 1.9.93

## 1.9.92 — 2026-07-11

### feat(Store): anteprima simulata per GruppoTemperatura

- Aggiunta funzione `preview()` al CARD di GruppoTemperatura che renderizza con 3 stanze demo (Soggiorno/Camera/Cucina) e dati fittizi realistici
- `_ghsPreviewCard` usa `regCard.preview()` se disponibile, altrimenti fallback a `render()` — niente più mount che sovrascriveva il contenuto con hass reale e entità vuote
- bump 1.9.91 → 1.9.92

## 1.9.91 — 2026-07-11

### fix(Store): icona e anteprima per distintivi non installati

- `_parseCardIcon`: salta i valori icon che iniziano con `<` (HTML), evita di leggere l'icona HTML del chip invece di quella del CARD meta
- `_ghsPreviewCard`: gestisce i distinctivi Frarik-native (IIFE / FratechCardRegistry) usando render+mount invece di customElements — prima mostrava sempre "Anteprima non disponibile"
- bump 1.9.90 → 1.9.91

## 1.9.90 — 2026-07-11

### fix(GruppoTemperatura): hero — simboli ° e % in superscript (flex-start)

- Usato display:flex + align-items:flex-start per attaccare il simbolo in alto al numero
- Rimosso inline span dentro il numero da 58px (causava baseline drop)
- bump 1.9.89 → 1.9.90

## 1.9.89 — 2026-07-11

### fix(GruppoTemperatura): hero — rimosso testo badge comfort, umidità stessa grandezza temp

- Badge comfort: rimosso testo "Attenzione/Comfort/ecc.", rimane solo emoji (18px)
- Umidità hero portata a 58px come la temperatura (stesso font-size, stesso peso, stessa riga)
- Entrambi i valori con `flex:1` per occupare lo stesso spazio orizzontale

## 1.9.88 — 2026-07-11

### feat(GruppoTemperatura): popup v1.9 — sparkline history reale affianco ai valori

- `_getHistory(h, entityId)`: fetch asincrona HA history API (ultimi 24h, campionata a 80pt, cache 10 min)
- `_sparkline(pts, color, min, max)`: SVG polyline con area fill gradient + dot luminoso finale
- `_loadGraphs(cfg, el)`: carica history in background, aggiorna solo i div `#gte-g-xxx` senza re-render
- Al mount: render immediato con linea tratteggiata placeholder, poi grafico reale dopo fetch (~100-300ms)
- Su poll: usa cache se < 10min, nessuna chiamata aggiuntiva
- Rimosso `_miniArc` e CSS arc; rimane solo sparkline pura SVG
- bump 1.9.87 → 1.9.88

## 1.9.87 — 2026-07-11

### feat(GruppoTemperatura): popup v1.8 — numeri grandi + mini arco SVG affianco

- Numero (44px) e mini arco SVG 270° (70×70) affiancati in ogni pannello valore
- Numero resta il protagonista (a sinistra), arco è il contesto visivo (a destra)
- Arco: track grigio + zona comfort verde (19-25° per temp, 40-60% per umid) + arco colorato + dot luminoso alla punta
- Animazione fill arco al primo render (stroke-dashoffset), dot appare dopo con delay
- Rimossa `_scaleBar`, aggiunta `_miniArc`; `valPanel` helper compatto riutilizzato per temp e umidità
- bump 1.9.86 → 1.9.87

## 1.9.86 — 2026-07-11

### fix(GruppoTemperatura): popup v1.7 — ritorno card numeri grandi + scala sottile

- Rimossi i grafici ad arco SVG (v1.6), tornati ai numeri grandi affiancati (v1.5)
- Aggiunta barra scala sottile (4px) con marker dot colorato e animato per temp e umidità
- Gradiente temperatura: blu→verde→giallo→rosso (freddo→comfort→caldo)
- Gradiente umidità: rosso→verde→rosso (secco→ottimale→umido)
- Label "comfort 19–25°" / "ideale 40–60%" sotto la scala come riferimento visivo
- Rimosso `_svgGauge`, aggiunto `_scaleBar`; CSS semplificato
- bump 1.9.85 → 1.9.86

## 1.9.85 — 2026-07-11

### feat(GruppoTemperatura): popup v1.6 — grafici ad arco SVG nelle card stanze

- `_svgGauge()`: grafico circolare 270° con track, zona comfort verde, arco colorato, dot di punta con glow
- Animazione di "fill" al primo render: l'arco si disegna da 0 fino al valore (stroke-dashoffset CSS)
- Temperatura: scala 0–40°C, zona comfort verde 19–25°C evidenziata sul track
- Umidità: scala 0–100%, zona comfort verde 40–60% evidenziata sul track
- Valore e unità centrati dentro il cerchio, label min/max sugli estremi dell'arco
- Card uniformi, sfondo uguale per tutte, bordo comfort-colored
- bump 1.9.84 → 1.9.85

## 1.9.84 — 2026-07-11

### feat(GruppoTemperatura): popup v1.5 — card stanze completamente ridisegnate

- Temperatura e umidità alla stessa grandezza (42px, stessa posizione, stesso peso)
- Sfondo cards uniforme (rgba bianco.04) per tutte le stanze — solo il bordo cambia colore
- Icona stanza rilevata automaticamente dal nome (camera → 🛏, cucina → 🍴, bagno → 🚿, ecc.)
- Consiglio specifico per ogni stanza in base a tipo + condizioni (camera: soglia sonno, cucina: vapore, bagno: muffe, generico: afa/secco/freddo ecc.)
- `_roomIcon(label)` — mappa 12 tipi di stanza
- `_roomAdvice(label, temp, hum)` — 20+ casistiche dettagliate con testo descrittivo
- bump 1.9.83 → 1.9.84

## 1.9.83 — 2026-07-11

### feat(GruppoTemperatura): popup v1.4 — redesign completo stile weather widget

- Hero card: temperatura grande (58px), glow radiale comfort, badge situazione, umidità accanto
- Footer hero: min/max temp e min/max umidità come strip compatta (solo se >1 stanza)
- Consigli come testo plain senza box/bordi (max 2 righe)
- Stanze come righe orizzontali compatte con bordo sinistro colorato + badge comfort
- Niente più sub-pannelli doppi né barre progress — design pulito e leggibile
- Sensore singolo: hero mostra i valori diretti (non "media casa")

## 1.9.82 — 2026-07-11

### feat(GruppoTemperatura): popup v1.3 — niente refresh, min/max temp+umid, situazione+consigli

- Fix refresh ogni 3s: introdotto fingerprint `_gteKey()` — re-render SOLO se i dati cambiano
- Card stanze non re-animano su ogni poll (flag `noAnim=true` su aggiornamenti dati)
- Sezione cima ridisegnata: 4 stat (min temp, max temp, min umid, max umid) invece di 3
- Riquadro "Situazione" spostato IN CIMA al popup (prima delle card per stanza)
- Nuova funzione `_adviceLines()`: frasi situazionali per temperatura, umidità, combo afa/muffa, spread stanze
- Consigli contestuali: "Temperatura elevata, ventila", "Umidità alta, arieggia", "Differenza X° tra stanze"

## 1.9.81 — 2026-07-11

### feat(GruppoTemperatura): popup v1.2 — summary bar, animazioni, barre a gradiente

- Barra sommario MIN/MEDIA/MAX + umidità media + comfort globale (se >1 stanza)
- Barre temperatura e umidità a gradiente fisso con marcatore bianco animato
  (posizione indica dove sei nella scala, con spring animation)
- Animazione entrata staggered per ogni card (55ms di offset)
- Subtle glow pulse sui valori numerici (gte-pulse keyframe)
- Gradient overlay su ogni card basato sul colore temperatura
- Barra umidità a zone: secco→ottimale→umido (rosso-verde-rosso)
- Nascosto sottotitolo popup header via _syncTitle
- Corretto placeholder input configurazione a rgba(.55)

## 1.9.80 — 2026-07-11

### fix(white): tutti i testi al 100% bianco in tutti i distintivi

- Rimossi tutti i `rgba(255,255,255,X)` usati come colore testo (color, fill SVG)
- Rimossi tutti gli `opacity:.X` da span e div di testo
- Fix chip inactive color: tutti i distintivi ora mostrano il valore in bianco puro
- Fix stColor/stCol variabili off-state: Spenta/Chiusa/Off → #fff
- Fix ritorno colori da funzioni helper (GruppoClima, GruppoTemperatura)
- GruppoAllarme: colore alarm sconosciuto → #fff
- GruppoClima: bottoni modalità inattivi → #fff (render + handler ottimistico)

## 1.9.79 — 2026-07-11

### fix(card-audit): pulizia codice morto e bug fix su tutti i distintivi

- **GruppoPrese v1.21**: rimosso `hasPwr`/`totalW` mai usati in `_syncTitle`; rimossa
  variabile `dailyBadge` (sempre vuota); corretta versione in `console.log` (era v1.10)
- **GruppoBatterie**: rimossi const `STATUS_LABEL` e `STATUS_EMO` mai referenziati
- **GruppoEnergia**: rimosso `c.solarLabel` (campo non esiste in config)
- **GruppoLuci, GruppoTapparelle, GruppoFinestre, GruppoPorte**: fix toggle automazione
  ottimistico — mostrava stato CORRENTE invece dello stato SUCCESSIVO al click
- **GruppoPorte**: rinominato `id="gp-popup-body"` → `gpor-popup-body` (collisione con
  GruppoPrese); versione allineata a 1.1
- **GruppoTapparelle**: rinominato `id="gt-popup-body"` → `gta-popup-body` (collisione
  con GruppoTemperatura); console.log allineato a v1.1
- **GruppoTemperatura**: rinominato `id="gt-popup-body"` → `gte-popup-body`;
  aggiunto render iniziale in `mount()` (prima il contenuto appariva solo dopo 3s)
- **GruppoLuci**: console.log allineato a v1.7

## 1.9.78 — 2026-07-11

### fix(distintivi): scroll mobile su tutte le card — popup non salta più ogni 1.5s

- Applicato fix salva/ripristina `scrollTop` a tutti i poll loop delle card:
  GruppoLuci, GruppoClima, GruppoTapparelle, GruppoFinestre, GruppoPorte,
  GruppoAllarme, GruppoTemperatura
- GruppoBatterie aveva già il fix internamente (non modificata)
- GruppoPrese già fixata in v1.9.77

## 1.9.77 — 2026-07-11

### fix: icon picker perde focus + popup prese scorre da solo su mobile

- **Icon picker (main.js)**: il campo di ricerca scompariva dopo ogni lettera perché
  `_iconPickerRenderTab('mdi')` impostava `display:none` sulla search (condizione
  non includeva il tab 'mdi'). Fix: aggiunto 'mdi' alla condizione + handler usa
  `_ipmTab` (tab corrente) invece di hardcoded 'mdi'. Bug presente in tutte le
  librerie icone del progetto, risolto globalmente.
- **GruppoPrese popup (v1.20)**: su mobile il popup scorreva verso l'alto ogni 1.5s
  perché `el.innerHTML = render(...)` azzerava `scrollTop` del parent. Fix: salvo
  e ripristino `scrollTop` prima/dopo la sostituzione.

## 1.9.76 — 2026-07-11

### fix(distintivo): GruppoPrese v1.19 — timer e badge — a #fff (100% bianco)

## 1.9.75 — 2026-07-11

### fix(distintivo): GruppoPrese v1.18 — timer grande + kWh su tutte le prese con sensore

- Timer accensione ora a font-size:14px bold (stesso peso di W, kWh, €)
- Badge kWh ora visibile su tutte le prese che hanno almeno `power_entity` o `energy_entity`
  configurato: prima le prese con accumulo automatico a 0 kWh non mostravano nulla,
  ora mostrano `—` (sensore presente, nessun consumo registrato ancora)

## 1.9.74 — 2026-07-10

### fix(distintivo): GruppoPrese v1.17 — €/costo a font 14px bold come W e kWh

## 1.9.73 — 2026-07-10

### fix(distintivo): GruppoPrese v1.16 — kWh grande come W + timer via localStorage

- kWh giornalieri ora mostrati con lo stesso `font-size:14px bold` dei watt (non più 10px)
- Timer accensione: fallback su tracking localStorage (`_gpon_{entityId}`) quando
  `last_changed` non è disponibile nel wrapper hass di Frarik
- Tutto su un'unica riga: `● Accesa  58 W  📅 0.02 kWh  €0.01  2h 10m`

## 1.9.72 — 2026-07-10

### feat(distintivo): GruppoPrese v1.15 — sort, timer, costo, standby, cleanup

- **Ordine automatico**: prese ordinate per errori → watt decrescenti → standby → spente
- **Timer accensione**: mostra da quanto tempo ogni presa è accesa (es. "2h 10m")
- **Costo giornaliero**: campo €/kWh nel configuratore; appare accanto ai kWh (es. "€0.03")
- **Standby visuale**: prese accese a 0W mostrano cerchio sbiadito e label "Standby"
- **kWh a zero**: `0.00 kWh` sostituito con `—` (sensore pronto ma nessun consumo)
- **Cleanup**: rimosso `_GP_ANIM_T0` (non più usato dopo fix animazione v1.14)

## 1.9.71 — 2026-07-10

### fix(distintivo): GruppoPrese v1.14 — flusso senza scatti via background-position

- Rimosso il div `.gp-snake` mobile: era l'elemento che causava lo scatto a ogni re-render
- Sostituito con gradient animato via `background-position` direttamente sulla barra di carico
- `@keyframes gpflow` anima lo spostamento di un pattern ripetuto ogni 40px
- Restart dell'animazione invisibile: il tile è identico a ogni ciclo, nessun salto visivo
- Velocità proporzionale ai watt (stessa logica `flowSpeed`), applicata sia alla barra
  globale che a quella per singola presa

## 1.9.70 — 2026-07-10

### fix(distintivo): GruppoPrese v1.13 — rimozione kWh totale + ring solo offline

- Rimosso totale kWh dal riquadro statistiche (era sotto CONSUMO, non richiesto)
- Cerchio pulsante rimosso dalle prese accese: ora appare solo su prese offline/errore

## 1.9.69 — 2026-07-10

### fix(distintivo): GruppoPrese v1.12 — baseline corretta + layout kWh affianco consumo

- Fix baseline sbagliata: cambiato prefisso chiave localStorage da `_gpbase_` a `_gpbase2_`
  in modo che le vecchie baseline (primo-avvio, non mezzanotte) vengano ignorate
  e venga sempre eseguito il fetch via HA history API alla prima apertura del giorno
- Totale kWh giornaliero spostato affianco a CONSUMO (W), non più su riga separata
- Rimosso il watt (`· 341 W`) dal titolo del popup: era duplicato rispetto alla colonna CONSUMO

## 1.9.68 — 2026-07-10

### fix(distintivo): GruppoPrese v1.11 — baseline kWh dalla mezzanotte via HA history API

- Il consumo giornaliero ora usa il valore del sensore alla mezzanotte esatta come baseline,
  letto tramite `GET /api/history/period/{mezzanotte}?end_time={+1h}` al primo caricamento
- Eliminato il problema "21 kWh sbagliati": la baseline non è più il primo valore letto
  all'apertura del dashboard, ma il valore reale del sensore a mezzanotte
- Baseline memorizzata in localStorage (`_gpbase_{entity}_{yyyy-mm-dd}`) e non ricalcolata
  durante il giorno; si azzera automaticamente a mezzanotte (nuova chiave con nuova data)
- Fallback al valore corrente se l'API history non è raggiungibile
- Fix: `_todayKey()` ora usa la data locale (non UTC), corretto per fusi orari UTC+1/+2

## 1.9.67 — 2026-07-10

### fix(distintivo): GruppoPrese — totale kWh visibile anche con consumo = 0

- Il riquadro totale spariva quando tutti i delta-sensore erano 0 (primo avvio del giorno)
- Fix: se `energy_entity` è configurato, il valore 0 viene incluso nel totale
  (sensore presente ma ancora nessun consumo rilevato da mezzanotte)
- Senza sensore (accumulo automatico) il comportamento rimane invariato: include solo se >0

## 1.9.66 — 2026-07-10

### fix(distintivo): GruppoPrese v1.10 — energia giornaliera da sensore cumulativo

- Il campo `energy_entity` ora calcola il consumo di oggi come delta:
  `kWh_oggi = valore_attuale − valore_a_mezzanotte`
- Al primo avvio della giornata il valore corrente del sensore viene salvato
  come "baseline" in localStorage (`_gpbase_{entity}_{yyyy-mm-dd}`)
- A mezzanotte la chiave cambia data → baseline azzerata automaticamente
- Funziona con qualsiasi sensore cumulativo (non serve un utility_meter giornaliero)
- Stessa logica applicata al totale nel riquadro (somma dei delta di tutte le prese)

## 1.9.65 — 2026-07-10

### fix(distintivo): GruppoPrese — tutti i testi al 100% bianco

- Rimossi tutti i `rgba(255,255,255,X)` usati come colore testo nel popup e nel configuratore
- Etichette, valori, ID entità, badge kWh, hint, titoli sezione: tutti `#fff` (100%)
- Placeholder input mantenuto leggermente dimmed (55%) per distinguerlo dal testo reale

## 1.9.64 — 2026-07-10

### fix(distintivo): GruppoPrese v1.9 — snake fluido + energia sempre visibile senza ▾

- **Snake senza scatti**: ogni re-render (ogni 1.5s) ripartiva l'animazione da capo causando
  un salto visivo. Fix: `animation-delay` negativo calcolato da `_GP_ANIM_T0` (timestamp fisso
  al caricamento del modulo) → la barra riprende esattamente da dove era arrivata
- **Sensore energia visibile senza espandere ▾**: il campo `📅 Energia oggi` è ora affiancato
  al campo `⚡ Watt` e sempre visibile per ogni presa nel configuratore
  — il totale giornaliero nel riquadro si somma automaticamente da tutti i sensori configurati
  — il ▾ ora espande solo Icona e Automazione
- `watchEntities` ora include `energy_entity` tra le entità monitorate

## 1.9.63 — 2026-07-10

### feat(distintivo): GruppoPrese v1.8 — kWh automatici (senza sensore) + picker icona

- **kWh giornalieri automatici**: non serve più configurare un sensore `energy_entity`
  — il popup accumula W×Δt ogni 1.5s (metodo integrale di Riemann) e mostra i kWh di oggi
  per ogni presa e come totale nel riquadro, azzerandosi automaticamente a mezzanotte
  — se si configura un `energy_entity` (utility_meter HA), quel sensore ha la precedenza
- **Picker icona per presa**: nel pannello ▾ di ogni presa, il bottone icona apre il
  selettore grafico MDI (stessa libreria del resto della dashboard)
  — si può anche digitare direttamente emoji o `mdi:xxx` nell'input accanto al bottone
- L'icona personalizzata si aggiorna live nell'anteprima mentre si digita

## 1.9.62 — 2026-07-10

### feat(distintivo): GruppoPrese v1.7 — potenza kW configurabile, colori dinamici, kWh giornalieri, icone per presa

- **Potenza contrattuale in kW**: campo input nel configuratore (es. 4.5 → 4500W internamente)
  — la % di carico e i colori si calcolano automaticamente su questa base
- **Colori dinamici** verde→giallo→arancio→rosso basati su % del max configurato:
  - 0–40% verde · 40–65% giallo · 65–85% arancio · 85–100% rosso
  - Sia la barra totale che le barre delle singole prese usano questa scala
- **Icona personalizzata per presa**: campo nel pannello ▾ di ogni presa (emoji o mdi:xxx)
- **Energia giornaliera per presa**: campo `energy_entity` nel pannello ▾ (es. sensor.presa_energia_oggi)
  — mostra "📅 X.XX kWh" accanto allo stato di ogni presa
- **Totale kWh giornalieri** nel riquadro riassuntivo (somma di tutte le prese con sensore energia)
- La % nel terzo riquadro ora usa il colore dinamico (stesso della barra)

## 1.9.61 — 2026-07-10

### feat(distintivo): GruppoPrese v1.6 — riquadro riassuntivo in cima al popup

- Aggiunto riquadro sempre visibile in testa al popup con 3 statistiche:
  - Prese accese (es. "3 / 5") con colore verde/rosso + label stato ("Tutte spente" / "Tutte accese")
  - Watt totali (se almeno una presa ha sensore watt configurato)
  - % di carico sul massimo configurato
- Barra carico con animazione snake integrata nel riquadro
- Pulsanti "Accendi tutte / Spegni tutte" spostati dentro il riquadro riassuntivo
- Il riquadro è sempre presente (anche senza sensori watt)

## 1.9.60 — 2026-07-10

### fix(sync): al primo caricamento della sessione il server è sempre la fonte di verità

- `_haLoadCfg`: al primo caricamento (`_isFirstLoad=true`) chiama `_applyRemoteCfg(v, force=true)`
  — il timestamp locale non conta più: la config del server viene sempre applicata
- Questo risolve il caso in cui il tablet aveva un `cfg._ts` più recente del server (es. dopo
  qualsiasi interazione precedente) e quindi rifiutava la configurazione aggiornata del PC
- Comportamento sui poll successivi invariato: se locale è più recente → push al server

## 1.9.59 — 2026-07-10

### fix(sync): sincronizzazione cross-device — forza pull da server + no push al primo caricamento

- `_haLoadCfg`: il push locale→server (push-local-if-newer) ora è bloccato al primo caricamento
  della sessione — evita che un dispositivo con timestamp locale più recente sovrascriva la
  configurazione del server (es. tablet che sovrascriveva la config del PC)
- `_applyRemoteCfg(v, force)`: nuovo parametro `force` che bypassa il check sul timestamp —
  applica sempre la config remota se richiesto esplicitamente
- Aggiunta `syncCfgFromHA()`: forza il pull dal server ignorando i timestamp locali
- Nuovo bottone "Scarica da server (forza)" nel pannello Dati → da usare per allineare
  manualmente un dispositivo che ha perso la sincronizzazione

## 1.9.58 — 2026-07-10

### fix(distintivo): GruppoPrese v1.5 — velocità snake logaritmica + ring pulsante su tutte le prese accese

- Velocità snake: scala logaritmica invece di lineare — 9W e 97W ora percettibilmente diversi
  - 1W → 7000ms (lentissimo), 100W → ~3400ms, 500W → ~2100ms, 3600W → 600ms
- Ring pulsante: ora appare su TUTTE le prese accese, non solo su quelle con sensore watt >10W

## 1.9.57 — 2026-07-10

### fix(distintivo): GruppoPrese v1.4 — velocità snake proporzionale ai watt (0–3600W)

- Velocità animazione snake ora lineare: 0W = fermo, 3600W = massima velocità (340ms/ciclo)
- Rimossi scalini fissi (200W/800W/1500W), ora interpolazione continua su tutto il range

## 1.9.56 — 2026-07-10

### fix(distintivo): GruppoPrese v1.3 — animazione snake + testo stato più visibile

- Flusso animato: da 3 dot separati a un serpente unico (gradiente coda→testa che scorre)
- Rimosso valore W dal lato destro della barra — il consumo è visibile nella riga stato
- Testo "Accesa/Spenta" ingrandito (10px→13px, weight 700→800) e watt in grassetto 14px

## 1.9.55 — 2026-07-10

### fix(distintivo): GruppoPrese v1.2 — colori corretti e consumo/flusso visibili

- Cerchio stato: verde (#4ade80) se accesa, rosso (#ef4444) se spenta, rosso lampeggiante se unavailable/unknown
- Barra consumo W + flusso animato ora visibili per ogni presa accesa con sensore watt configurato
- Fix CSS animazione flusso: separati animation-name/timing-function/iteration-count dalla durata inline
- Toggle switch verde quando acceso (era arancio), rosso quando spento
- Pulsanti "Accendi tutte" verde, "Spegni tutte" rosso
- Titolo popup: verde se accese, rosso se spente

## 1.9.54 — 2026-07-10

### feat(distintivo): GruppoPrese.js v1.1 — redesign completo con stati, flussi e consumo W

- Stato on/off/unavailable/unknown con icona e colore dedicati per ogni presa
- Barra consumo W real-time per ogni presa (proporzionale a maxW, default 2300W IT)
- Flusso animato (CSS keyframes 3 dot paralleli) velocità e colore proporzionali ai watt
  - <200W → verde, >200W → colore badge, >800W → arancio, >1500W → rosso
  - Ring pulsante attorno all'icona quando la presa sta consumando
- Footer consumo totale con barra + percentuale del massimo
- Pulsanti "Accendi tutte" / "Spegni tutte" in cima al popup
- Badge automazione per ogni presa con toggle on/off inline
- Titolo popup dinamico: n prese accese · tot W aggiornato ogni 1.5s
- Campo maxW configurabile (default 2300W) nella form di configurazione
- Chip aggiornata: mostra contatore accese + consumo totale live

## 1.9.53 — 2026-07-10

### fix(sync): card e sensori ora si sincronizzano correttamente su cell/tablet

- Bug: all'avvio su un dispositivo nuovo (cell, tablet) saveCfg() veniva chiamata durante l'init
  impostando cfg._ts = adesso, rendendo la config locale "più recente" di quella del server.
  _applyRemoteCfg rifiutava la config del server (remoteTs < cfg._ts) → card non configurate.
- Fix: cfg._ts si aggiorna solo dopo il primo sync (_cfgSynced=true). Prima di quel momento
  l'init locale non produce un timestamp che blocca la config remota.
- Risultato: aprire la dashboard su un nuovo dispositivo carica immediatamente card,
  sensori e configurazioni esattamente come sul dispositivo principale.

## 1.9.52 — 2026-07-10

### fix(store): "Aggiorna" card non tocca più il PKG — i due bottoni sono completamente separati

- Fix: aggiornare una card JS non triggera più nessuna azione sul PKG (niente popup, niente wizard)
- "Aggiorna" → aggiorna solo il codice JS della card
- "Aggiorna PKG" → azione separata, apre il wizard pre-compilato con i valori precedenti
- I badge "PKG update" nello store continuano a indicare quando il PKG ha una versione più recente

## 1.9.51 — 2026-07-10

### fix(store): aggiorna card con PKG non apre più il wizard se config già salvata

- Fix: cliccare "Aggiorna" su una card che ha un PKG aggiornava il JS ma poi riapriva il wizard
- Ora: se il wizard è già stato configurato in precedenza, il PKG viene aggiornato in background silenziosamente con i valori salvati
- Il popup wizard appare solo se non esiste nessuna configurazione precedente (prima installazione)

## 1.9.50 — 2026-07-10

### fix(sync): persistenza e sincronizzazione cross-device della plancia

- Fix: GET/POST /api/frarik/config ora inviano sempre X-Frarik-Key header (prima usava solo il cookie, non ancora disponibile al primo caricamento → 403 silenzioso)
- Fix: se la config locale è più recente di quella sul server la si ricarica automaticamente (push-local-if-newer), risolvendo il caso in cui un salvataggio precedente fosse fallito
- Risultato: la dashboard sopravvive a riavvii, refresh e aggiornamenti dell'addon, e le modifiche da un dispositivo si propagano agli altri in ~3 secondi
- Antizanzare PKG v2.2: aggiunto debounce 10 sec e mode:single sull'automazione "Perdita acqua" per eliminare le notifiche ripetute da sensor flapping

## 1.9.49 — 2026-07-08

### fix(store): badge "Aggiorna (N)" ora sempre in sync col contenuto del tab

- Badge aggiornato all'inizio di _ghStoreRenderUpdates() per eliminare il contatore stale
- Risolto caso in cui badge mostrava (1) ma lista era vuota per race condition con _ghCheckPkg

## 1.9.48 — 2026-07-08

### fix(store): richiesta riavvio HA dopo aggiorna PKG + campo Alexa wizard (card v2.31)

- Fix: dopo "Aggiorna PKG" ora appare il popup di riavvio HA (mancava chiamata _pkgPostInstall)
- Aggiunto campo Alexa nel wizard: media_player.* con autocomplete tra i media_player di HA
- Alexa salvata in localStorage e pre-compilata ai successivi aggiornamenti
- _buildPkgAZ ora sostituisce IL_TUO_MEDIA_PLAYER_ALEXA con il valore inserito
- _buildPkgFromConfig aggiornato per includere cfg.alexa

## 1.9.47 — 2026-07-08

### feat(store): wizard pre-compilato su aggiornamento PKG (card v2.30)

- "Aggiorna PKG" nel tab Aggiornamenti ora apre il wizard con i sensori già inseriti
- Il titolo del wizard mostra "Aggiorna PKG" (invece di "Installa PKG") durante un update
- Il bottone mostra "🔄 Aggiorna PKG" invece di "📦 Installa PKG"
- Stesso comportamento anche per "Aggiorna PKG" dalla tile dello store
- Fallback silenzioso mantenuto per card senza openWizard()

## 1.9.46 — 2026-07-08

### feat(antizanzare): notifiche riscritte con condizioni e debounce (v2.29)

- Riscritte tutte le notifiche: ogni evento ha ora il suo trigger specifico
- Aggiunto controllo notify_push su tutte le notifiche
- Notifiche meteo/presenza: richiedono automazione_attiva + cicli configurati
- Ciclo manuale: notifica sempre (solo notify_push), ignora meteo/presenza
- Aggiunto debounce for: 5 min su vento/pioggia_prob, 3 min su pioggia_corso, 1-2 min su presenza
- Separati binary_sensor blocco_vento e blocco_pioggia_prob per trigger indipendenti
- Aggiunto input_number soglia_livello_tanica (default 20%) e notifica livello basso
- Messaggi notifiche riscritti con emoji e dettagli (velocità, percentuale, soglie)
- Card v2.29, addon v1.9.46

## 1.9.45 — 2026-07-07

### fix(antizanzare): blocco_pioggia_corso non rispettava toggle abilita_pioggia (v2.28)

- blocco_pioggia_corso bloccava tutto (anche manuale) quando il sensore pioggia era ON,
  indipendentemente dal toggle "Abilita Blocco Pioggia" — ignorava completamente abilita_pioggia
- Fix: aggiunto controllo abilita_pioggia prima di blocco_pioggia_corso
  (coerente col resto: pioggia_corso blocca solo se il toggle è attivo)
- Card v2.28, addon v1.9.45

## 1.9.44 — 2026-07-07

### fix(antizanzare): entità rinominate _2 dopo reinstall PKG (v2.27)

- Rimossi 22 unique_id dai template sensor del PKG
- unique_id causava conflitti nel registro entità HA → tutte le entità prendevano
  suffisso _2 dopo ogni reinstallazione, rompendo card e automazioni
- Senza unique_id, entity_id è assegnato dal nome (deterministico, nessun conflitto)
- Card v2.27, addon v1.9.44

## 1.9.43 — 2026-07-07

### fix(antizanzare): notifica pioggia senza dettaglio, rimosso tasto ON/OFF rapido presa (v3.0)

- Rimosso il tasto 🔌 ON/OFF affianco a Manuale/Ferma Auto: accendeva/spegneva la
  presa senza controllare vento/pioggia/presenza, bypassando tutti i blocchi
- Fix: la notifica "Cicli bloccati" per probabilità pioggia mostrava solo il
  titolo senza dettaglio (a differenza del vento, che mostrava valore e soglia).
  Causa: il controllo nella notifica usava il sensore derivato/arrotondato
  invece del sensore raw usato da `blocco_meteo`, potendo divergere vicino alla
  soglia. Allineato a leggere lo stesso identico valore, aggiunto anche il
  controllo dell'interruttore "Blocco per pioggia/vento attivo" mancante
- Risincronizzata la copia embedded del pkg nel wizard con questi fix

## 1.9.42 — 2026-07-07

### fix(antizanzare): tolta conversione vento errata, blocco pioggia/vento attivo di default (v2.9)

- Rimossa la conversione ×3.6 sul sensore vento: il sensore reale è già in km/h,
  l'errore era solo l'etichetta della card che segnava "m/s" (già corretta la
  volta scorsa) — la moltiplicazione era di troppo e falsava il valore
- "Abilita Blocco Pioggia" e "Abilita Blocco Vento" ora nascono attivi di default
  (`initial: true`, prima `false`). Vale solo per installazioni nuove: se gli
  input_boolean esistono già spenti, vanno accesi una volta da Impostazioni ⚙
- Risincronizzata la copia embedded del pkg nel wizard con questi fix

## 1.9.41 — 2026-07-07

### fix(antizanzare): blocco pioggia in corso mancante, avvio manuale non rispettava il blocco meteo (v2.8)

- Il sensore "pioggia in corso" (sta piovendo sì/no) era mostrato in card ma non
  bloccava MAI i cicli: aggiunto a `blocco_meteo` come condizione di blocco
  (nessuna soglia/toggle necessari, se piove blocca sempre)
- L'avvio manuale rispettava solo il blocco presenza, non vento/pioggia: ora
  controlla `binary_sensor.blocco_meteo` nel suo complesso (vento, pioggia,
  pioggia in corso, presenza) prima di partire
- Promemoria: il blocco per vento e per probabilità pioggia restano disattivati
  finché non si accendono i relativi interruttori in Impostazioni ⚙ → Soglie &
  Durate ("Blocco per pioggia attivo" / "Blocco per vento attivo") — di default
  sono spenti anche se si imposta una soglia
- Risincronizzata la copia embedded del pkg nel wizard con questi fix

## 1.9.40 — 2026-07-07

### fix(antizanzare): vento in km/h, presenza unificata, wizard risincronizzato, pulizia notifiche (v2.7)

- Rimossa l'automazione "Notifica Cicli Rimanenti - Unificata" (avvisi 10/5/2 cicli e
  "RIEMPIRE IMMEDIATAMENTE TANICA")
- Velocità vento ora convertita e mostrata in km/h (prima m/s senza conversione, e il
  confronto con la soglia — già in km/h — non tornava mai vero): sensore
  `frarik_antizanzare_velocita_vento` moltiplica per 3.6, `blocco_meteo` confronta
  sull'unità corretta, card e notifiche aggiornate di conseguenza
- Rimossa "Durata avvio manuale" dal popup Impostazioni: ora si regola solo dallo
  stepper +/- direttamente in card
- Unificati "Stop emergenza presenza" e "Blocco preventivo presenza" in un solo
  interruttore e comportamento: la presa si spegne SUBITO quando viene rilevata una
  persona (senza toccare timer/automazione), resta bloccata anche per gli avvii
  manuali finché l'area è occupata, e riprende da sola il ciclo interrotto quando
  l'area si libera — senza più disattivare l'intera automazione generale. Notifica
  singola alla rilevazione e singola al ritorno libero (prima nessuna, o duplicate)
- **Fix importante**: la copia del pkg YAML incollata dentro la card per il wizard
  (usata per generare il pacchetto personalizzato con i propri sensori) era ferma a
  una versione molto vecchia — motivo per cui vento e altri sensori restavano fermi
  anche dopo averli inseriti nel wizard. Risincronizzata con il pkg reale e aggiornato:
  chi ha già configurato i sensori tramite wizard deve ripassarci per rigenerare un
  pacchetto aggiornato

## 1.9.39 — 2026-07-07

### fix(antizanzare): reset cicli in impostazioni + notifiche false al riavvio HA (v2.6)

- Aggiunto tasto "🔄 Reset cicli mensili" in Impostazioni ⚙, vicino a "Target cicli mensili"
  (richiede doppio click di conferma). Azzera `counter.frarik_antizanzare_cicli_mensili` e
  riporta `counter.frarik_antizanzare_cicli_rimanenti` al target impostato
- Verificate le notifiche di blocco ciclo per meteo: esistono già ed elencano il motivo
  specifico (pioggia/vento/presenza) in un unico messaggio — nessuna nuova notifica necessaria
- Fix: la notifica "Automazioni Riattivate: condizioni meteo favorevoli" partiva ad ogni
  riavvio di Home Assistant. Causa: il sensore `binary_sensor.frarik_antizanzare_blocco_meteo`
  si inizializza sempre a "off" all'avvio (passando da stato sconosciuto), e il trigger della
  notifica non distingueva questa inizializzazione da un vero cambio di condizioni meteo
- Fix: aggiunto `from: 'on'` + `for: 1 minuto` al trigger di riattivazione (ora coerente con
  il ritardo reale con cui l'automazione si riattiva) e `from: 'off'` al trigger di blocco,
  per evitare lo stesso falso positivo speculare all'avvio con meteo già sfavorevole

## 1.9.38 — 2026-07-07

### feat(antizanzare): card e pkg — durata manuale in card, prossimo ciclo live, toggle in impostazioni, livello tanica asciutto/bagnato (v2.5)

- Riquadro in alto a destra: rimosso "Prossimo" (duplicava il box "📅 Prossimo ciclo" sotto),
  al suo posto "Durata manuale" con pulsanti −/+ (step 10s) per regolare la durata dell'avvio manuale
  direttamente dalla card
- "📅 Prossimo ciclo" ora si aggiorna da solo ogni minuto: prima restava fermo finché non
  cambiava qualche altro stato (serviva quasi un refresh della pagina)
- I due toggle "Attivo/Inattivo" per blocco vento/pioggia, prima cliccabili direttamente sulle
  celle Vento/Pioggia della card, sono stati spostati dentro Impostazioni ⚙ → Soglie & Durate,
  accanto alle rispettive soglie
- "Livello acqua" ora supporta anche sensori binari asciutto/bagnato (non solo sensori %):
  bagnato = tanica OK, asciutto = tanica vuota (avviso rosso). Il sensore template
  `frarik_antizanzare_livello_tanica` nel pkg ora passa il valore grezzo quando non è numerico
  invece di azzerarlo con `| float(0)`
- Card v2.5

## 1.9.37 — 2026-07-07

### fix(antizanzare): presa antizanzare mai collegata nelle automazioni

- Causa: 49 riferimenti a `entity_id: IL_TUO_PRESA_ANTIZANZARE` erano testo letterale
  invece dell'ancora YAML `*presa_az`, quindi non leggevano mai la presa configurata
  in cima al pkg — ogni ciclo comandava un'entità inesistente
- Fix: tutti i trigger/condition/target (cicli, stop, sicurezza persona, blocco perdita)
  ora usano `*presa_az`, come già avveniva per `*sensore_presenza`
- Anche il default dell'`input_text.frarik_antizanzare_entity_presa` ora riflette la presa configurata

## 1.9.36 — 2026-07-07

### fix(antizanzare): cicli non partono all'orario impostato (v2.26)

- Causa: `platform: time at: input_datetime.XXX` registra l'orario al caricamento di HA
  e non si aggiorna dinamicamente quando l'utente cambia l'orario dalla card
- Fix: tutte le 35 automazioni ciclo (7 giorni × 5 cicli) cambiate a `platform: time_pattern minutes: "/1"`
  con condizione template che legge l'entity in tempo reale ogni minuto
- Ora cambiare un orario dalla card è immediatamente efficace senza dover ricaricare HA
- Card bumped to v2.26, PKG aggiornato

## 1.9.35 — 2026-07-06

### feat(antizanzare): toggle blocco pioggia/vento visibili direttamente sulla card (v2.25)

- Celle Vento e Pioggia nella sensor grid ora mostrano badge "✓ Attivo / ✕ Inattivo"
- Click sulla cella Vento → abilita/disabilita blocco cicli per vento
- Click sulla cella Pioggia → abilita/disabilita blocco cicli per pioggia
- Aggiunti pk_abilita_pioggia / pk_abilita_vento alla config e alla firma di re-render
- Card bumped to v2.25

## 1.9.34 — 2026-07-06

### fix(panel): rebuild panel con fix wizard PKG e blocco_meteo sempre attivo

- Fix critico: `blocco_meteo` era sempre ON quando `soglia_pioggia=0` (default), bloccando tutti i cicli
- Fix: `sicOn` mostrava sempre il toggle "Stop emergenza" come attivo anche quando l'entità non esisteva
- Aggiunta durata per ogni slot ciclo nelle impostazioni programma settimanale
- Rebuild panel: il wizard si apre correttamente su "Aggiorna PKG"

## 1.9.33 — 2026-07-06

### fix(store): "Aggiorna PKG" apre sempre il wizard con valori pre-compilati

- Prima: se esisteva una config salvata, "Aggiorna PKG" installava silenziosamente senza mostrare il wizard
- Ora: clic manuale su "Aggiorna PKG" apre SEMPRE il wizard con i valori precedenti pre-compilati
- L'aggiornamento silenzioso (auto-update in background) rimane invariato
- Fix versione customCards: era '1.5', ora '2.20'

## 1.9.32 — 2026-07-06

### fix(antizanzare): v2.20 — avviso blocco, ciclo+automazione, notifiche specifiche

- Riquadro ciclo programmato diventa ambra con "⚠ Automazione disattivata" quando autoOn=off
- Avviso blocco ora mostra TUTTI i motivi anche combinati (presenza + pioggia/vento insieme)
- Riquadro avviso cambiato in rosso (più urgente) invece di ambra
- Notifica "cicli bloccati" ora include il motivo specifico (pioggia %, vento m/s, presenza)
- Fix: `binary_sensor.IL_TUO_SENSORE_PERDITA` → `IL_TUO_SENSORE_PERDITA` (prefix duplicato)

## 1.9.31 — 2026-07-06

### fix(antizanzare/pkg): separazione sensore pioggia e probabilità pioggia (v2.19)

- Aggiunto placeholder `IL_TUO_SENSORE_PROBABILITA_PIOGGIA` distinto da `IL_TUO_SENSORE_PIOGGIA`
- `Sensore Pioggia` = binary_sensor (sta piovendo? on/off), usato solo da `pioggia_corso`
- `Sensore Probabilità Pioggia` = sensor numerico 0-100%, usato da `probabilita_pioggia` e `blocco_meteo`
- `binary_sensor.pioggia_corso` ora usa `is_state(..., 'on')` invece di `float > 30`
- Wizard aggiornato con campo separato per i due sensori

## 1.9.30 — 2026-07-06

### feat(antizanzare): avviso blocco + prossimo ciclo programmato (v2.18)

- Riquadro arancione che appare quando `blocco_meteo = on`, con il motivo preciso: prob. pioggia ≥ soglia, vento ≥ soglia, o presenza rilevata
- Riquadro ciano con il prossimo ciclo programmato (giorno + orario) calcolato dinamicamente dalla settimana; mostra "Nessun ciclo programmato" se nessuna fascia è attiva
- Il box prossimo ciclo si nasconde automaticamente quando un timer è già in corso
- Aggiunto `pk_soglia_vento` al compute sig per ri-render immediato quando la soglia cambia

## 1.9.29 — 2026-07-06

### fix(wizard/pkg): dominio duplicato quando l'utente scrive l'entity ID completo

- Bug: YAML ha `sensor.IL_TUO_X`, utente scrive `sensor.consumo_istantaneo` → risultava `sensor.sensor.consumo_istantaneo`
- Fix: prima della sostituzione, se il YAML ha già `domain.PLACEHOLDER` e il valore inserito inizia con lo stesso dominio, il prefisso viene rimosso automaticamente dal valore
- Stesso fix per `media_player.`, `notify.`, `switch.`, e tutti gli altri domini

## 1.9.28 — 2026-07-06

### feat(card/bolletta): box Oggi ridisegnato + tab FV/Batt come pannello dedicato (v5.3)

- **Box "Oggi"**: kWh e € mostrati allo stesso peso visivo (14px bold) — prima € era grande e kWh era la piccola nota sotto
- **Tab FV/Batteria** (Impostazioni): completamente ridisegnato come pannello dedicato
  - Ogni fonte (pannelli, batteria) ha il proprio card container con header colorato
  - Toggle direttamente nell'header, non più come riga separata
  - Quando attivo: mini-stat con Autoconsumo kWh · Risparmio € · Copertura % + barra progresso
  - Quando non attivo: placeholder testuale dashed
  - Toggle click aggiorna dinamicamente stat/placeholder senza riaprire il popup
  - Input kWh manuale sempre accessibile sotto le stat

## 1.9.27 — 2026-07-05

### feat(card/bolletta): pannelli FV e Batteria nella schermata principale (v5.2)

- Se `input_boolean.frarik_bolletta_ha_fotovoltaico` è ON: appare un riquadro ☀️ Fotovoltaico con kWh autoconsumo, risparmio € stimato e % del consumo totale coperto
- Se `input_boolean.frarik_bolletta_ha_batteria` è ON: appare un riquadro 🔋 Batteria con kWh da batteria, risparmio € stimato e % coperta
- Layout: 2 colonne se entrambi attivi, piena larghezza se solo uno
- Barra progresso colorata (amber/verde) sotto ogni riquadro per visualizzare la % di copertura
- I riquadri appaiono tra la riga stats e la progress bar del mese
- Signature `update()` estesa con `input_number.frarik_bolletta_autoconsumo_fv/batt` per re-render al cambio dei valori

## 1.9.26 — 2026-07-05

### feat(card/bolletta): popup Simulatore Bolletta dedicato (v5.1)

- Nuovo popup `openSimulatore()` con calcolo live in tempo reale
- Input: kWh (slider + campo numerico), Bonus/Sconto, toggle Canone RAI (auto-rilevamento gen–ott), kWh FV/Batteria (se attivi)
- Risultato in tempo reale: totale in grande + breakdown (energia variabile, fissi, IVA, canone RAI, bonus, netto FV/batt)
- Costo effettivo per kWh (c€/kWh) calcolato sul totale simulato
- Bottone "🧮 Simula" aggiunto alla card (4 bottoni: Dettaglio · Simula · Storico · Imposta)
- Rimosso il mini-simulatore dalla tab FV delle Impostazioni

## 1.9.25 — 2026-07-05

### fix(store): popup "Aggiorna pkg" mostrava sempre frarik_posta.yaml

- `_ghsPkgUpdatePopup`: aggiunto parametro `pkgFile` (prima era hardcoded `frarik_posta.yaml`)
- Al call site (aggiornamento card), ora viene passato il file risolto da `_parsePkgInfo(code).file`
- Fallback: `frarik/frarik_${cardId}.yaml` se `_parsePkgInfo` non trova il campo `file`

## 1.9.24 — 2026-07-05

### feat(card/bolletta): nuova card Bolletta v5.0 per PKG frarik_bolletta v10

- Riscrittura completa `card-js/Bolletta.js` per il nuovo PKG `frarik_bolletta.yaml`
- Entità aggiornate al nuovo schema: `sensor.frarik_bolletta_*`, `input_number.frarik_bolletta_*`, `input_boolean.frarik_bolletta_*`
- Main card: dual-hero kWh/€ mese, barra potenza live vs soglia, stats (oggi/previsione/€ per kWh), progress bar mese
- Popup Dettaglio: breakdown calcolo bolletta (energia variabile, fissi, IVA, canone RAI, bonus), anno kWh/€
- Popup Storico: grafico 12 mesi corrente vs anno precedente, tabella dettaglio, grafico settimanale kWh per giorno
- Popup Impostazioni (3 tab): Notifiche (toggle tutti gli input_boolean), Prezzi (tutti i prezzi tariffari → scritti su HA via callService), FV/Batteria (toggle + autoconsumo + simulatore)
- Registrazione via `window.FratechCardRegistry` con `frarik_pkg_check: sensor.frarik_bolletta_versione`

## 1.9.23 — 2026-07-05

### fix(store): PKG "non trovato su GitHub" — cache vuoto non veniva aggiornato dal periodic check

- `_ghCheckPkg`: fix check `!_ghsCache.pkg || !_ghsCache.pkg.length` — un array vuoto `[]` è truthy in JS quindi il cache stale non veniva mai sovrascritto dai dati freschi del tree check
- `_ghsPkgUpdFromPending`: se il cache non ha il file, ora ritenta il fetch dalla cartella `pkg/` su GitHub prima di mostrare l'errore

## 1.9.22 — 2026-07-05

### fix(pkg/bolletta): corretto doppio prefisso sensor. nel trigger allarme, aggiunto sensor proxy potenza

- Trigger `entity_id` allarme sovraccarico: da stringa hardcoded `sensor.IL_TUO_SENSORE_POTENZA_CASA` (che il wizard duplicava in `sensor.sensor.*`) ad anchor YAML `*sensore_potenza_bolletta`
- Aggiunto template sensor `frarik_bolletta_potenza_casa` (trigger-based su `*sensore_potenza_bolletta`) per usare la potenza istantanea in Jinja2 senza hardcodare l'entity ID
- Notify services: da stringhe hardcoded `notify.IL_TUO_MOBILE_APP` ad anchor `*push`
- Alexa target: da stringa hardcoded `media_player.IL_TUO_ALEXA` ad anchor `*alexa`

## 1.9.21 — 2026-07-05

### fix(pkg): notifica aggiornamento PKG installati via wizard o apertura dashboard post-update

- Corretto bug in `_ghCheckPkg`: quando un PKG non aveva ancora una SHA baseline (installato via wizard o dashboard aperta dopo un update), il nuovo SHA veniva silenziosamente salvato come baseline senza notificare l'utente
- Ora se non è la prima sessione assoluta (`_isFirstPkgSync = false`) e il PKG è nuovo per `pkgShas`, viene inviata la notifica aggiornamento
- La prima sessione assoluta continua a non notificare (evita spam su primo avvio)

## 1.9.20 — 2026-07-05

### feat(pkg/bolletta): allineamento stile v10 come elettrodomestici

- Header rinnovato: rimosso ASCII art, aggiunto `author`, `reference`, `package: 'Frarik Bolletta 10'`
- Versione PKG aggiornata da `"2.0"` a `"10"` (`sensor.frarik_bolletta_versione`)
- Nome sensore versione normalizzato: `frarik_bolletta_versione` (minuscolo, come gli altri PKG)
- Rimossi anchor morti `&sensore_saldo_octopus` / `&sensore_scadenza_octopus`
- Placeholder potenza rinominato `IL_TUO_SENSORE_POTENZA_CASA` (coerente con il pattern degli altri PKG)
- Commenti sezioni uniformati al formato `####` con righe bianche

## 1.9.19 — 2026-07-05

### feat(cards/all): nasconde matita e configurazione in modalità modifica per tutti gli elettrodomestici

- **`frarik_no_edit: true`** aggiunto al CARD object di tutti gli 11 elettrodomestici
- In edit mode il pulsante ✏️ e il popup "Configura Card" non compaiono più sulle card elettrodomestici

## 1.9.18 — 2026-07-05

### feat(cards/all): barra potenza con scala realistica e colori verde/giallo/arancio/rosso

- **barMax per ogni elettrodomestico**: la barra ora scala sulla potenza massima reale (es. frigorifero 300W, induzione 7200W)
- **Colori corretti**: grigio = standby, verde = consumo basso, giallo = consumo medio, arancio = consumo alto, rosso = consumo massimo
- **Soglie per appliance**: Frigorifero 300W, Microonde 1500W, Montalatte 1000W, Tostapane 1500W, Friggitrice 2000W, Lavatrice/Lavastoviglie 2500W, Forno 3500W, Scaldabagno 3000W, Asciugatrice 4000W, Induzione 7200W

## 1.9.17 — 2026-07-05

### fix(cards/all): soglia lavoro salvata in localStorage, default frigorifero 30W

- **Soglia lavoro ora si salva**: il valore viene scritto in `localStorage` (`_fsg_` + entity) indipendentemente dal PKG HA — funziona anche senza l'entità `input_number.frarik_*_soglia_w`
- **Il popup mostra il valore salvato**: `dNum` legge da localStorage come override al valore HA
- **Render legge localStorage**: `soglia` calcolata da localStorage → stato HA → default — la card si aggiorna senza PKG
- **Frigorifero**: default soglia abbassato da 300W a 30W (compressore usa ~50-150W)

## 1.9.16 — 2026-07-05

### fix(cards/all): running fallback e soglia configurabile in tutte le card elettrodomestici

- **Tutte le card** (Lavatrice, Lavastoviglie, Induzione, Forno, Microonde, Friggitrice, Frigorifero, Scaldabagno, Montalatte, Asciugatrice): `running`/`heating` ora ha fallback diretto su `potenza >= soglia` quando il binary_sensor non è disponibile in HA
- **Impostazioni popup**: campo "Soglia lavoro" usa `c.pk_soglia` (entità configurata) invece del nome hardcoded — il valore ora si legge e salva correttamente
- `sogliaN` spostata prima di `running` nel render() così il fallback può usarla

## 1.9.15 — 2026-07-05

### fix(card/tostapane): animazione e soglia lavoro

- `running` ora ha fallback diretto: se `binary_sensor.frarik_tostapane_motore` non esiste, si calcola da `pk_power >= soglia` → animazione funziona anche senza PKG completo
- `openImpostazioniHAPopup`: campo "Soglia lavoro" ora usa `c.pk_soglia` (entità configurata dall'utente) invece del nome hardcoded

## 1.9.14 — 2026-07-05

### feat(card/tostapane): nuova card Tostapane con PKG embedded

- `Tostapane`: nuova card creata da zero con SVG animato (toast che si alza, resistenze animate), popup cicli/energia/impostazioni, griglia settimanale kWh+costo dal primo giorno e PKG embedded v2.0 completo. Versione 2.2
- Entità: `frarik_tostapane_*`, attributo `costo_oggi_tostapane`

## 1.9.13 — 2026-07-05

### fix(card/scaldabagno): aggiunta griglia settimanale kWh e costo nel popup energia
### feat(card/montalatte): nuova card Montalatte con PKG embedded

- `Scaldabagno`: `openEnergiaPopup` ora mostra griglia 7 giorni con `input_number.frarik_scaldabagno_consumo_[giorno]` e `input_number.frarik_scaldabagno_costo_[giorno]`. Card bumped 2.1 → 2.2
- `Montalatte`: nuova card creata da zero con SVG animato, popup cicli/energia/impostazioni, griglia settimanale kWh+costo e PKG embedded v2.0 completo. Versione 2.2

## 1.9.12 — 2026-07-05

### fix(card/frigorifero): aggiunto kWh e costo nella griglia settimanale

- `openCicliPopup`: griglia 7 giorni ora mostra anche kWh (`input_number.frarik_frigorifero_consumo_[giorno]`) e costo (`input_number.frarik_frigorifero_costo_[giorno]`) per ogni giorno
- Oggi: kWh da `c.pk_kwh_oggi`, costo da attributo `costo_oggi_frigorifero`
- Card bumped 2.1 → 2.2

## 1.9.11 — 2026-07-05

### fix(card/friggitrice): aggiunto kWh e costo nella griglia settimanale

- `openCicliPopup`: griglia 7 giorni ora mostra anche kWh (`input_number.frarik_friggitrice_consumo_[giorno]`) e costo (`input_number.frarik_friggitrice_costo_[giorno]`) per ogni giorno
- Oggi: kWh da `c.pk_kwh_oggi`, costo da attributo `costo_oggi_friggitrice`
- Card bumped 2.1 → 2.2

## 1.9.10 — 2026-07-05

### fix(card/microonde): aggiunto kWh e costo nella griglia settimanale

- `openCicliPopup`: griglia 7 giorni ora mostra anche kWh (`input_number.frarik_microonde_consumo_[giorno]`) e costo (`input_number.frarik_microonde_costo_[giorno]`) per ogni giorno
- Oggi: kWh da `c.pk_kwh_oggi`, costo da attributo `costo_oggi_microonde`
- Card bumped 2.1 → 2.2

## 1.9.9 — 2026-07-05

### fix(card/forno): aggiunto kWh e costo nella griglia settimanale

- `openCicliPopup`: griglia 7 giorni ora mostra anche kWh (`input_number.frarik_forno_consumo_[giorno]`) e costo (`input_number.frarik_forno_costo_[giorno]`) per ogni giorno
- Oggi: kWh da `c.pk_kwh_oggi`, costo da attributo `costo_oggi_forno`
- Card bumped 2.1 → 2.2

## 1.9.8 — 2026-07-05

### fix(card/induzione): aggiunto kWh e costo nella griglia settimanale

- `openCicliPopup`: griglia 7 giorni ora mostra anche kWh (`input_number.frarik_induzione_consumo_[giorno]`) e costo (`input_number.frarik_induzione_costo_[giorno]`) per ogni giorno
- Oggi: kWh da `c.pk_kwh_oggi`, costo da attributo `costo_oggi_induzione`
- Card bumped 2.1 → 2.2

## 1.9.7 — 2026-07-05

### fix(card/lavastoviglie): aggiunto kWh e costo nella griglia settimanale

- `openCicliPopup`: griglia 7 giorni ora mostra anche kWh (`input_number.frarik_lavastoviglie_consumo_[giorno]`) e costo (`input_number.frarik_lavastoviglie_costo_[giorno]`) per ogni giorno
- Oggi: kWh da `c.pk_kwh_oggi`, costo da attributo `costo_oggi_lavastoviglie`
- Card bumped 2.1 → 2.2

## 1.9.6 — 2026-07-05

### fix(card/lavatrice): aggiunto kWh e costo nella griglia settimanale

- `openCicliPopup`: griglia 7 giorni ora mostra anche kWh (`input_number.frarik_lavatrice_consumo_[giorno]`) e costo (`input_number.frarik_lavatrice_costo_[giorno]`) per ogni giorno
- Oggi: kWh da `c.pk_kwh_oggi`, costo da attributo `costo_oggi_lavatrice`
- Card bumped 2.1 → 2.2

## 1.9.5 — 2026-07-05

### fix(popup): grafica unificata per tutti i popup PKG

- `_pkgViewOnHA` (visualizzatore YAML): convertito da modal centrato a bottom sheet con slide-up, icona e bottone ✕ standard
- `_ghsPkgAskPopup`: aggiunto click-outside sull'overlay per chiudere il popup
- `_ghsPkgUpdatePopup`: aggiunto click-outside sull'overlay per chiudere il popup
- Tutti i popup PKG ora rispettano lo stesso pattern: `align-items:flex-end`, `border-radius:20px 20px 0 0`, animazione slide-up, bottone ✕ e chiusura cliccando fuori

## 1.9.4 — 2026-07-05

### feat(pkg): wizard PKG apre dal basso + autocomplete entità HA nei campi

- Il wizard di configurazione PKG è ora un bottom sheet (scorre dal basso) invece di un modal centrato
- Ogni campo input mostra automaticamente la lista di tutte le entità HA disponibili al click/focus (filtrata mentre si digita)
- `_frarikEntityAutocomplete`: funzione riutilizzabile per autocomplete entità su qualsiasi input
- Memorizzato come standard UX: tutti i popup futuri apriranno dal basso

## 1.9.3 — 2026-07-05

### feat(pkg): wizard configurazione entità al momento dell'installazione PKG

- Quando si installa un PKG dallo store, il frontend rileva automaticamente i placeholder `IL_TUO_*` nel YAML
- Appare una modale che chiede le entità HA da configurare (sensore potenza, switch, media player, ecc.)
- Le label dei campi vengono estratte dal contesto YAML (chiave sopra il placeholder)
- I valori inseriti vengono sostituiti nel YAML prima dell'installazione su HA
- Se il YAML non ha placeholder, il PKG viene installato direttamente senza wizard

### feat(card): installazione card non chiede più il PKG

- Rimosso il popup "Package richiesto" dall'installazione card
- Se il PKG è già su HA → la card viene installata direttamente e silenziosamente
- Se il PKG non è ancora su HA → toast che indica di installarlo prima dal tab PKG dello store

## 1.9.2 — 2026-07-05

### feat(pkg): installazione PKG da GitHub va sempre in /config/packages/frarik/

- `_ghsPkgInstallFromGH` ora installa con `name: 'frarik/' + filename` invece della root
- La cartella `frarik/` viene creata automaticamente dal server alla prima installazione
- I file legacy nella root vengono rimossi automaticamente dal server se presenti
- Gli aggiornamenti PKG (`_ghsPkgUpdFromPending`) usavano già il path `frarik/` — allineati

## 1.9.1 — 2026-07-05

### fix(store): contatore "N card" nel menu laterale esclude le card builtin

- Il badge "Store → N card" nel menu laterale contava anche la SOS card (builtin) che non è installata dall'utente
- Fix: il contatore mostra solo le card installate dall'utente (non `_builtin`)

## 1.9.0 — 2026-07-05

### fix(pkg): occhio - 404 su cartelle con spazi o lettere maiuscole nel nome

- Causa: `_loadHaInstalledPkgs` applicava `.toLowerCase()` ai path restituiti da `pkg/list`, ma Linux (HA) ha il filesystem case-sensitive. Se la cartella si chiama `Pkg Lentini` su disco, cercarlo come `pkg lentini` causava 404
- Fix: i path vengono ora salvati con il case esatto del filesystem
- `_pkgIsOnHA` aggiornato per fare confronto case-insensitive invece di usare il Set direttamente
- Tutti i filtri che usano `_pkgPending[bn]` ora lowercasano `bn` prima del confronto

## 1.8.9 — 2026-07-05

### debug(pkg): occhio mostra path esatto e HTTP status code nell'errore

- `_pkgViewOnHA`: il toast di errore mostra ora `/config/packages/<path>` e lo status HTTP per facilitare il debug

## 1.8.8 — 2026-07-05

### fix(pkg): auto-refresh lista installati, badge file corrotto, messaggio errore occhio migliorato

- `_ghStoreRenderPkgInstallati` ora chiama `_loadHaInstalledPkgs()` ad ogni render per evitare dati stale (es. file eliminati dal File Editor che comparivano ancora nella lista)
- Voci con nome vuoto (es. `frarik/.yaml`, file corrotto) mostrano il path completo e un badge ⚠️ "File corrotto" invece di un campo nome vuoto
- `_pkgViewOnHA`: quando il file non esiste su HA (404), il toast ora spiega che se si è eliminato il file dal File Editor bisogna premere ↻ per aggiornare la lista

## 1.8.7 — 2026-07-05

### fix(pkg): corretto "File non trovato" sul bottone occhio (visualizza YAML)

- `_pkgViewOnHA` riceveva il filename già percent-encoded dall'attributo HTML e lo ri-codificava con `encodeURIComponent`, producendo un doppio encoding che il server non riconosceva
- Fix: decode del filename prima di ri-encodarlo per la query string

## 1.8.6 — 2026-07-05

### fix(pkg): conferma + offerta riavvio HA prima di rimuovere un PKG installato

- Il tasto "Rimuovi" nei PKG installati ora mostra una dialog di conferma prima di procedere
- Dopo la rimozione, viene chiesto se riavviare Home Assistant

## 1.8.5 — 2026-07-05

### feat(store): ripristinati tab Chips e Distintivi con sotto-tab Non installate / Installate

- Tab Chips: Non installate | Installate (solo chips, cache separata)
- Tab Distintivi: Non installati | Installati (solo distintivi, cache separata)
- Tab Cards ora mostra solo le card JS
- Funzioni generiche `_ghStoreRenderFolderNonInstallate` e `_ghStoreRenderFolderInstallate` riutilizzabili per ogni folder

## 1.8.4 — 2026-07-05

### feat(store): redesign UI store con tab Cards/PKG e sotto-tab

- **Nuova struttura tab**: Cards (Non installate | Installate) · PKG (Non installati | Installati) · Da aggiornare · Premium · Locali · Salvate
- **Non installate**: mostra tutte le card disponibili da tutti i folder (js, chips, distintivi) non ancora installate
- **Installate**: card installate e aggiornate raggruppate per categoria (Elettrodomestici | Altre card)
- **PKG Non installati / Installati**: separati in sotto-tab dedicati
- **Da aggiornare**: unico tab dove appaiono card e PKG con update — esclusi da tutti gli altri tab (niente più chip "Aggiorna" fuori da questo tab)
- **Bottone "Già aggiornato"**: risolve falsi positivi per PKG installati manualmente senza passare dallo store
- **Fix SHA tracking**: dopo installazione PKG da store, SHA salvato correttamente → niente più falsi update al prossimo sync

## 1.8.3 — 2026-07-05

### fix(pkg+card): YAML embedded = PKG GitHub completo — Differenziata e Posta

- **Differenziata**: YAML embedded aggiornato a 318 righe (era 189) — ora corrisponde esattamente al PKG GitHub con intestazione ASCII, commenti sezione e tutti gli ancore `&google`, `&alexa`, `&push` con segnaposto `IL_TUO_*`; `_diffBuildPkg` invariata
- **Posta**: YAML embedded aggiornato a 457 righe (era 341); PKG GitHub aggiornato con segnaposto IL_TUO_* (`IL_TUO_SENSORE_CASSETTA`, `IL_TUO_MEDIA_PLAYER_GOOGLE`, `IL_TUO_MEDIA_PLAYER_ALEXA`, `IL_TUO_MOBILE_APP`); `_buildCustomPkg` riscritta con sostituzione IL_TUO_* (rimossi i vecchi marcatori `%%`); corretto bug `service: "{{ repeat.item.service }}"` → `notify.{{ repeat.item.service }}`

## 1.8.2 — 2026-07-04

### fix(pkg+card): PKG completi e struttura notifiche corretta — Antizanzare, Irrigazione, Bolletta, Differenziata, Posta

- **Antizanzare**: YAML embedded sostituito con PKG GitHub completo (3379 righe vs 206 precedenti); notify group usa `services: *push_az`; automazioni usano `notify.frarik_antizanzare_notify`; rimossi sensori hardcoded (pioggia, acqua → placeholder `IL_TUO_SENSORE_PIOGGIA`, `IL_TUO_SENSORE_ACQUA`)
- **Irrigazione**: YAML embedded sostituito con PKG GitHub completo (768 righe vs 194 precedenti); notify group usa `services: *push_irr`; `_buildPkgIRR` aggiornato per sostituire correttamente l'anchor push a 10 spazi con supporto multi-dispositivo
- **Bolletta**: versione sensore corretta da `1.0` a `2.0`; PKG GitHub anchor `&push` da `[]` a `- service: IL_TUO_MOBILE_APP`
- **Differenziata**: placeholder unificati (`IL_TUO_MEDIA_PLAYER_GOOGLE`, `IL_TUO_MEDIA_PLAYER_ALEXA`, `IL_TUO_MOBILE_APP` senza suffisso `_1`); PKG GitHub anchor corretto con liste valori
- **Posta, Differenziata, Irrigazione**: aggiunto `_buildPkgFromConfig` per reinstall silenziosi via `_pkgUpdateCard`
- Tutte le card ora installano il PKG completo e corretto sia dal wizard sia da reinstall automatico

## 1.8.1 — 2026-07-04

### fix(card-elettrodomestici): YAML embedded v2.0 + Jinja anchor sensore potenza

- **YAML embedded aggiornato**: tutte e 9 le card ora hanno lo YAML del PKG v2.0 incorporato — wizard e reinstall silenziosi installano lo stesso PKG di GitHub (non più la v1.0)
- **Jinja anchor corretto**: `&sensore_potenza` usa ora `{{ states('IL_TUO_SENSORE_POTENZA') | float(0) }}` — `state: *sensore_potenza` nel template sensor funziona correttamente in HA
- **Placeholder unificati**: `IL_TUO_MOBILE_APP`, `IL_TUO_MEDIA_PLAYER_GOOGLE`, `IL_TUO_MEDIA_PLAYER_ALEXA` (rimosso suffisso `_1`) — allineati tra YAML embedded e `_buildPkg`
- **PKG GitHub aggiornati**: stessa fix Jinja applicata ai 9 file `pkg/frarik_*.yaml` su GitHub

## 1.8.0 — 2026-07-04

### fix(card-elettrodomestici): aggiornamento entità e impostazioni tutte e 9 le card

- **Entity names allineate al nuovo PKG**: tutte le card (Lavatrice, Asciugatrice, Lavastoviglie, Forno, Microonde, Friggitrice, Induzione, Frigorifero, Scaldabagno) ora usano i nomi entità del PKG v2 (`orario_inizio_notifiche`, `orario_fine_notifiche`, `off_automatico`, `frarik_{id}_cicli_{day}`, `frarik_{id}_tempo_{day}`, `costo_mese_precedente`, `costo_anno_precedente`)
- **Impostazioni senza sensori PKG**: il popup ⚙ Impostazioni non mostra più i sensori creati dal PKG; mostra solo le opzioni modificabili dall'utente (notifiche, orari, soglie, nome, messaggio)
- **Persistenza HA**: tutte le impostazioni salvate nel popup vengono scritte sulle entità `input_*` di HA e restano anche dopo il riavvio
- **Nome card da HA**: il titolo della card legge `input_text.frarik_{id}_nome` direttamente da HA; così il nome rimane aggiornato tra sessioni e riavvii
- **configure: null**: rimosso il pulsante "Configura" dello store che apriva il popup dei sensori PKG
- **Scaldabagno**: aggiunto `openImpostazioniHAPopup` (mancava): mostra notifiche, orari, soglia W, delay riavvio, nome, messaggio; con tasto 💾 Salva
- **Frigorifero**: rinominati tutti gli attributi da `_frigo_` a `_frigorifero_` per allineamento col PKG v2
- Versioni card portate tutte a `2.1`

## 1.7.99 — 2026-07-04

### fix(store): aggiornamento card distintivi/chips dal tab "Aggiorna"

- **Bug**: cliccando "Aggiorna" nel tab "Aggiorna (N)" per card in `card-chips` o `card-distintivi` compariva "File non trovato su GitHub" perché lo store cercava solo nella cache di `card-js`
- **Fix**: `_ghsFind` e `_ghsEnsureFile` ora cercano in tutte le cartelle install quando il tab attivo è "updates" — così GruppoTemperatura, GruppoClima, chips e tutte le card non-js si aggiornano correttamente

## 1.7.98 — 2026-07-04

### fix+feat(GruppoTemperatura): v1.1 — testi bianchi + sensori media chip

- **Tutti i testi a #fff**: etichette "TEMPERATURA"/"UMIDITÀ", scale "0°"/"40°", "°C"/"%", "Non disponibile" e tutti i label del configuratore ora sono bianchi al 100%
- **Sensori media per il chip**: nuova sezione nel configuratore per impostare `sensor.media_temperatura` e `sensor.media_umidita`; la chip li mostra direttamente invece di calcolare min–max dai singoli sensori
- **Sensori stanza separati**: il popup continua a mostrare tutti i sensori individuali per stanza configurati
- Icone nei pannelli aumentate a 14px per maggiore leggibilità

## 1.7.97 — 2026-07-04

### feat(distintivi): nuovo badge Gruppo Temperatura

- **Distintivo Temperatura/Umidità**: nuovo `GruppoTemperatura.js` con design a card per ogni sensore
- Ogni card mostra temperatura e umidità come pannelli affiancati con valore grande, colore dinamico e barra scala (0°–40° / 0%–100%)
- **Colori dinamici**: azzurro (freddo) → verde (comfort 19-25°C) → giallo → arancio → rosso (caldo); umidità con scala analoga (40-60% = verde)
- **Badge comfort**: 🌿 Comfort / 😊 Buono / 🌡 Attenzione / ⚠️ Critico calcolato da temp+umidità combinati
- **Chip**: mostra range min–max°C tra tutti i sensori, colorato in base al valore più estremo
- **Configuratore**: aggiungi quanti sensori vuoi; per ciascuno: entità temperatura, entità umidità (opzionale), nome personalizzato; autocomplete sulle entità HA

## 1.7.96 — 2026-07-04

### fix(elettrodomestici): notifiche voce italiana, push e toggle persistenti

- **Push non arrivava**: `service: "{{ repeat.item.service }}"` mancava il prefisso `notify.` → fix su tutti gli elettrodomestici (Lavatrice, Asciugatrice, Lavastoviglie, Forno, Microonde, Friggitrice, Induzione, Frigorifero, Scaldabagno, Differenziata)
- **Alexa/Google messaggio sbagliato**: la durata "1h 10m" veniva letta lettera per lettera → ora genera testo italiano naturale ("un'ora e 10 minuti", "45 minuti", "2 ore e 5 minuti") con Jinja inline per tutti gli elettrodomestici con ciclo
- **Toggle notifiche si resettavano**: `initial: on` negli `input_boolean` causava il reset ad ogni riavvio HA → rimosso da tutti i toggle push/alexa/google in tutti i file PKG sorgente e installati

## 1.7.95 — 2026-07-04

### feat(bolletta): card v4.3 — Canone RAI gestito dall'utente

- **RAI escluso da tutti i totali automatici**: sensore `frarik_bolletta_mensile`, proiezione fine mese e calcolo JS non includono più il canone RAI nel totale
- **Toggle in Dettaglio Bolletta**: pulsante "+ Includi / Rimuovi" accanto alla voce RAI; aggiunge/rimuove i 9€ dal totale in tempo reale; preferenza salvata in localStorage
- **Toggle in Simulatore**: pulsante RAI nella form (stile pieno = incluso, trasparente = escluso); il calcolo si aggiorna istantaneamente al click senza premere "Calcola"; preferenza condivisa con il Dettaglio
- In luglio/agosto il RAI non appare nei comandi (non dovuto), il toggle è nascosto
- Fix anche per la proiezione: i 9€ RAI non vengono più proiettati automaticamente

## 1.7.94 — 2026-07-04

### fix(bolletta): card v4.2 — proiezione fine mese corretta

- **Bug critico rimosso**: la proiezione scalava i costi fissi (comm 6€, tr_fis 1.92€, tr_pot 8.82€) per i giorni rimanenti → risultato gonfiato (es. 148€ invece di ~55€)
- **Nuova formula**: proietta prima i kWh (`kWh_mensili / giorni_trascorsi × giorni_nel_mese`), poi calcola la bolletta completa con la stessa formula del Simulatore
- La proiezione ora è identica a "apri il simulatore e inserisci i kWh proiettati"
- Fix applicato sia nella card JS (calcolo inline, nessuna dipendenza dal sensore HA) che nei template PKG Jinja (repo e installato)

## 1.7.93 — 2026-07-04

### fix(bolletta): card v4.1 — aggiornamento valori ARERA e correzione formula

- **CdispD aggiornato** da 0.015531 → 0.019902 €/kWh (delibera ARERA 98/2026, in vigore da giugno 2026)
- **tr_pot aggiornato** da 2.22 → 1.96 €/kW (valore confermato da bolletta reale)
- **Perdite di rete** default aggiornato a 9.85% (8.73 e 10.3261 erano obsoleti)
- **Bug Jinja corretto**: CdispD e MC applicati ai kWh misurati, non a kWh+perdite
- Stessi fix applicati al PKG repo e al PKG installato (tutti i template giornalieri, mensili, test)
- Simulazione ora corrisponde alla bolletta reale (giugno 2026: 214 kWh → 62.38 € ± 0.02 €)

## 1.7.92 — 2026-07-04

### feat(bolletta): card v4.0 — UI principale ridisegnata

- **Hero split**: kWh mensili a sinistra + costo mensile a destra, entrambi 44px peso 900; etichette 100% bianche
- **Badge mese** in alto a destra (es. "Luglio") dove era il badge ARERA
- **Barra progresso illuminata**: sostituisce il mini-grafico degli ultimi 6 mesi — mostra giorno X/Y con barra gialla glowing e punto luminoso sul fronte
- **Grafico 6 mesi**: rimosso dalla card principale (rimane nel popup Storico)
- **Toggle Notifiche Push** nelle Impostazioni: ON/OFF salvato in localStorage
- **Matita rimossa** in modalità modifica: `frarik_no_edit: true` nel registry — rimangono solo i 3 pallini (⋯)

## 1.7.91 — 2026-07-04

### fix(bolletta): card v3.9 — UI principale e popup semplificati

- **ARERA badge rimosso** dall'header della card principale
- **Hero semplificato**: rimossi pill kWh e c€/kWh; giorno X/Y del mese integrato nella subtitle
- **Barra avanzamento mese rimossa**: info giorno ora inline nell'hero (es. "Luglio 2026 · 223 kWh · Giorno 4/31")
- **Testo 100% bianco** su tutta la card: etichette stat, valori mini-grafico, header chart
- **Popup Dettaglio**: rimossa sezione "Tariffe ARERA" con tariff/c€/kWh; rimangono solo componenti bolletta e info kWh/mese

## 1.7.90 — 2026-07-04

### fix(bolletta): card v3.8 — popup Dettaglio e Simulatore migliorati

- **Costo effettivo/kWh**: sostituisce "Costo All-in/kWh" — mostra `—` quando i kWh consumati sono < 30 (evita di mostrare la tariffa base come se fosse il costo reale all-in)
- **Tariffa energia**: rinominata da "Prezzo Energia" per distinguerla chiaramente dal costo effettivo/kWh (che include tutte le voci)
- **Canone RAI**: mostra `— (lug/ago escluso)` nei mesi di luglio e agosto invece di `0.00 €`
- **Simulatore**: risultato redesignato — lista leggibile con icone, stessa struttura del popup Dettaglio; "Costo effettivo/kWh" visibile solo se kWh ≥ 30

## 1.7.80 — 2026-07-04

### fix(bolletta): PKG — unique_id ripristinato su integration sensor

- **unique_id ripristinato**: `frarik_bolletta_energia_totale_casa` sull'integration sensor garantisce che HA crei `sensor.frarik_bolletta_energia_totale_casa` con entity_id stabile e corretto
- **Riparazioni Spook**: le riparazioni "Unknown source" degli utility_meter si risolvono perché l'entità sorgente viene creata correttamente al restart
- **Nota**: l'utente aveva già eliminato la vecchia entità con lo stesso unique_id dal registry — nessun conflitto

## 1.7.79 — 2026-07-04

### fix(bolletta): card v3.7 + PKG — entity ID con prefisso frarik_ garantito

- **Entity ID univoci**: tutti i sensori creati dal PKG ora hanno `sensor.frarik_bolletta_*` — aggiunto "Frarik " ai nomi di integration sensor, utility_meter e template sensor
- **Niente conflitti**: la rimozione del `unique_id` dai template sensor e dall'integration sensor forza HA a ricreare le entità con l'entity_id corretto dal nome, bypassando i vecchi valori nel registry
- **Utility_meter**: sorgenti corrette a `sensor.frarik_bolletta_energia_totale_casa`; l'utente deve eliminare le vecchie `sensor.bolletta_energia_*` dal registry prima del restart
- **Card v3.7**: pkDefaults aggiornati a `sensor.frarik_bolletta_*`

## 1.7.78 — 2026-07-04

### fix(bolletta): card v3.6 + PKG — entity ID sistematici corretti

- **Bug sistematico entity ID**: il PKG creava entità con `sensor.bolletta_*` (nome senza "Frarik") ma leggeva `sensor.frarik_bolletta_*` — tutti i valori erano zero perché la catena era spezzata
- **PKG installed** (`frarik_bolletta.yaml`): corrette 103 reference — `source:` degli utility_meter ora puntano a `sensor.bolletta_energia_totale_casa` (esistente); tutti i `states()` interni aggiornati a usare le entity ID effettive
- **PKG repo** (`cards/pkg/frarik_bolletta.yaml`): stesso fix applicato per coerenza nelle installazioni future
- **Card v3.6**: `pkDefaults()` aggiornati — tutti i `sensor.frarik_bolletta_*` → `sensor.bolletta_*` (esclusi ARERA, versione, Octopus che hanno già il prefisso corretto)

## 1.7.77 — 2026-07-04

### fix(antizanzare): card v2.13 — toggle persistenti + rimozione matita garantita

- **Toggle tutti persistenti**: i service call per Automazione, Sicurezza e Notifiche vengono ora inviati **al Save** leggendo `dataset.on` visuale — eliminato il click-immediato che poteva non propagarsi a HA prima del re-render; i toggle aggiornano solo la visuale al click, tutto va a HA premendo Salva
- **Matita rimossa garantita**: in `_azMount`, dopo il bind iniziale, rimuove esplicitamente `querySelector('.ovb-edit')` dal DOM — risolve il caso in cui `buildCardEl` viene eseguito prima che `FratechCardRegistry` sia popolato dal JS della card

## 1.7.76 — 2026-07-04

### fix(antizanzare): card v2.12 — notifiche persistenti, matita rimossa, sfondo ridotto

- **Notifiche**: il Save ri-invia esplicitamente lo stato del toggle `azuc-tog-ntf` a HA via `_azCallSvc` — elimina la race condition in cui HA non aveva aggiornato il websocket prima del re-render
- **Matita**: corretta posizione del check `frarik_no_edit` — si trovava nel blocco carte standard, non in quello `yaml-card||js-custom` (riga 5742) che le card JS usano effettivamente; il pulsante ✏️ è ora effettivamente omesso
- **Sfondo card**: rimosso il secondo radial-gradient; opacità ridotta da `.28` → `.15` (attivo) e `.09` → `.07` (spento) — l'alone colorato è appena percettibile, non più un blob bianco visibile

## 1.7.75 — 2026-07-04

### feat(antizanzare): card v2.11 — countdown prossimo ciclo, pioggia SVG, background dinamico, testi bianchi

- **Countdown prossimo ciclo**: il sensore `prossimo_ciclo_completo` viene parsato come orario (HH:MM o ISO); mostra "tra Xh Ym" al posto dell'orario grezzo + barra di avanzamento colorata verso il ciclo successivo (più è piena, più siamo vicini)
- **Pioggia SVG**: quando `blocco_meteo` è attivo, 6 gocce animate con `animateTransform` cadono sull'SVG (colore `#60a5fa`/`#93c5fd`, stagger di fase differente per effetto realistico); il glow del dispositivo diventa blu pioggia
- **Background dinamico**: quando il sistema è ACCESO (auto/manuale/timer attivo), `::before` passa da `.09` a `.28` di opacità + secondo radial-gradient in basso a destra — effetto "acceso" visibile su tutta la card
- **Testi bianchi**: rimosso `rgba(255,255,255,.4/.45)` da tutti i testi — `.fc-tmr-lbl`, `.fc-gc-l`, `.fc-pill-lbl` e label barra timer ora a `#fff` pieno

## 1.7.74 — 2026-07-04

### feat(antizanzare): card v2.10 — rimozione matita in modalità modifica

- Aggiunto `frarik_no_edit: true` a `_AZ_CARD`: segnala al FratechStore che la card gestisce internamente le proprie impostazioni (popup ⚙) e non ha bisogno dell'editor YAML generico
- In `main.js`: il pulsante ✏️ nell'overlay modalità modifica viene omesso per le card `js-custom` con `frarik_no_edit: true` — rimane solo il menu ⋮ (duplica, elimina, ecc.)

## 1.7.73 — 2026-07-04

### feat(antizanzare): card v2.9 — timer bar fluida, bottoni verde/rosso, SVG illuminazione

- **Timer bar fluida**: rimosso CSS `animation` che causava scatti ad ogni re-render; ora aggiornata via DOM tick 200ms (`el._azTimerTick`) che scrive direttamente `width:%` + `transition:.25s linear` — animazione continua senza jitter
- **Timer bar colore**: `#00b4ff` (blu elettrico) con glow `box-shadow`
- **Bottoni**: ▶ Manuale e ▶ Auto → sfondo/testo verde (`#22c55e`); ⏹ Ferma e ⏹ Ferma Auto → rosso (`#ef4444`); rinominato "Stop Auto" → "Ferma Auto"
- **SVG illuminazione**: triplo drop-shadow quando attivo (`0 0 4px` + `0 0 16px` + `0 0 40px`); tank body con fill colorato e pulse animato; outer ring pulsante sul motore; spray acqua più luminoso con glow circle animate; pipette e ugello illuminati dal colore attivo

## 1.7.72 — 2026-07-04

### feat(antizanzare): card v2.8 — animazione SVG fix, layout sensori aggiornato, notifiche toggle

- **Animazione SVG**: sostituiti @keyframes CSS con SVG native `<animate>` — funzionano correttamente anche con innerHTML; `active` ora basato su `timerRem !== null` (timer attivo) anziché string di stato
- **4 riquadri**: 💨 Vento / 🌧 Pioggia in corso / 🌂 Prob.pioggia / ☀️⛈ Meteo
- **3 pill**: 💧🚨 Allagamento / ⚡ Pompa (W, non L) / 🪣 Livello acqua
- **Notifiche**: sostituito campo testo con toggle ON/OFF; usa entity `c.pk_notifiche` o default `input_boolean.frarik_antizanzare_notifiche`; sempre visibile nel popup ⚙
- **Modalità modifica**: configure ora no-op (non apre nulla)

## 1.7.71 — 2026-07-03

### feat(antizanzare): card v2.7 — status ACCESA, sensori nel popup ⚙, autocomplete entità

- Status "ACCESA" (al posto di "MANUALE" / "IN ATTESA" / "CICLO") quando il sistema è attivo in qualsiasi modalità; "SPENTA" solo quando tutto è fermo; "METEO" se bloccato
- Sensori opzionali (vento, tanica, pompa, notifiche) spostati nel popup ⚙ nella sezione "Sensori Opzionali" — salvati in localStorage al "Salva tutto"
- Autocomplete live: digitando nelle caselle sensore appaiono i match delle entità HA disponibili (filtra da 2 caratteri, max 8 risultati, click per selezionare)
- Editor entità in modalità modifica eliminato — `configure` ora apre direttamente il popup ⚙

## 1.7.70 — 2026-07-03

### fix(pkg): rimozione `initial:` da tutti i PKG — impostazioni ora persistono al riavvio HA

- **Root cause**: `input_boolean` e `input_number` definiti in YAML con `initial:` vengono resettati al valore iniziale ad ogni riavvio di HA, ignorando le modifiche salvate dall'utente
- **Fix**: rimosso `initial:` da tutti i file PKG — senza `initial:`, HA ripristina l'ultimo stato da `.storage/core.restore_state`
- **File modificati**: frarik_lavatrice, frarik_asciugatrice, frarik_lavastoviglie, frarik_forno, frarik_microonde, frarik_induzione, frarik_friggitrice, frarik_frigorifero, frarik_scaldabagno, frarik_differenziata, frarik_bolletta
- In bolletta rimosso anche `initial: 0` dalle righe inline degli storico (impediva il ripristino dei dati storici)

## 1.7.69 — 2026-07-03

### feat(antizanzare): card v2.6 — redesign completo UI + impostazioni programma settimanale

- **Nuovo layout principale**: griglia 4 sensori (💨 Vento / 🪣 Tanica / ⚡ Pompa / 🌧 Pioggia), 3 pill stato (Prob. pioggia / Meteo / Cassetta), solo 3 pulsanti (Manuale / Auto / ⚙)
- **Timer bar**: barra countdown CSS animata (`azTimerBar`) con `animation-delay:-{elapsed}s` per scorrimento fluido in tempo reale; scompare a fine ciclo
- **Status unico**: "Spenta/METEO/MANUALE/CICLO/IN ATTESA" solo nel pill header, rimosso dal corpo card
- **Sensori opzionali**: `pk_vento`, `pk_tanica`, `pk_consumo_pompa` configurabili dall'editor entità; mostrano "N/D" se non configurati
- **Impostazioni (⚙) riscritte**: toggle Automazione + Sicurezza + Notifiche, programma L-D con toggle per giorno + num cicli (+/-) + 5 orari per ciclo, soglie e durate, save unico
- **Schedule live**: ogni modifica ai toggle/orari viene salvata su HA (`input_boolean`, `input_number`, `input_datetime`) con re-render immediato
- Firma sig aggiornata a `2.5az` per forzare re-mount sui client esistenti
- `_azOpenEntCfg`: aggiunti campi per pk_vento, pk_tanica, pk_consumo_pompa, pk_notifiche

## 1.7.68 — 2026-07-03

### fix(store): pulsante "Aggiorna" nel tab Aggiorna non funzionava

- `_ghsFolderTab` non mappava `'updates'` → `'js'`, quindi `_ghsEnsureFile` cercava in
  `_GHS_FOLDERS['updates']` (inesistente) e ritornava null → "File non trovato su GitHub"
- Fix: aggiunto `'updates'` alla mappa → ora risolve correttamente in `_ghsCache['js']`
  (o lo scarica da GitHub se la cache non è ancora caricata)

## 1.7.67 — 2026-07-03

### feat(antizanzare): card v2.5 — tutti i sensori PKG esposti + sicurezza + real-time fix

- **Nuove entità PKG** nella card: presenza (telecamera giardino), perdita cassetta, prossimo ciclo, cicli rimanenti (sensor), avanzamento mensile, automation sicurezza
- **Sezione sensori** nella card principale: 3 pill — 👤 Presenza, 💧 Cassetta, 🔒 Sicurezza (tappabile per toggle automation)
- **Hero**: "Rimanenti" ora usa il sensor PKG; 4° riga mostra prossimo ciclo (se disponibile) al posto di prob. pioggia
- **Stats**: 4° colonna cambiata da "Auto" a "Acqua L" (consumo_acqua)
- **Barra avanzamento mensile** aggiunta sotto barra cicli mensili (quando dati disponibili)
- **Settings popup (⚙)**: aggiunto toggle Sicurezza accanto ad Automazione; sezione "Sensori" con tutti i valori in tempo reale
- **Real-time fix**: tutti i popup (day detail, programma toggle) resettano `el._fcSig=null` al salvataggio per forzare re-render immediato
- `_azOpenEntCfg`: aggiunti campi configurazione per le 6 nuove entità
- Firma sig aggiornata a `2.4az` per forzare re-mount sui client esistenti

## 1.7.66 — 2026-07-03

### fix(store): badge tab Aggiorna non si azzerava dopo aggiornamento card/PKG

- `_ghAfterInstall` ora chiama `_ghsUpdBadge()` + re-render tab updates dopo ogni install card
- `doUpdate` PKG ora chiama `_ghsUpdBadge()` subito dopo la pulizia di `_pkgPending`

## 1.7.65 — 2026-07-03

### fix(store): label tab "Aggiorna" accorciata per evitare overflow del tab bar

## 1.7.64 — 2026-07-03

### feat: tab "Aggiornamenti" nello store

- Nuovo tab **🔄 Aggiornamenti** nel FratechStore, dopo "Installate"
- Mostra in un unico posto tutte le card JS installate con SHA diverso dalla versione GitHub (aggiornamenti disponibili) + tutti i PKG con aggiornamento disponibile
- Badge dinamico sul tab: conta totale aggiornamenti in evidenza con sfondo arancione (aggiornato dopo ogni check GitHub e PKG)
- Pulsante "Aggiorna" per ogni card, "Aggiorna PKG" per ogni package — stessi handler degli altri tab
- Stato empty state ✅ con invito a fare Sync se non ci sono aggiornamenti rilevati

## 1.7.63 — 2026-07-03

### fix: popup programma cicli Antizanzare — design glass pill + fix percorso rendering

- `_azOpenProgramma`: ogni giorno ora è una glass pill card (sfondo/bordo tematico, badge cicli, orari riassuntivi, pulsante "✏ Modifica cicli" visibile solo se giorno attivo)
- `_azOpenDayDetail`: cicli come glass pill (C1/C2/... con badge verde, pill scura se disattivo); numero cicli con +/− invece di campo numerico grezzo; durata mostrata come min/s con pulsanti +/−; legge orario da `input_datetime.*` (fix bug precedente che leggeva da `input_number.*`)
- Queste sono le funzioni usate dal rendering FratechStore (non il web component), quindi ora le modifiche sono visibili nel pannello

## 1.7.62 — 2026-07-03

### fix + miglioramento: card Antizanzare — entity ID corretti + gestione cicli grafica

- **Entity ID corretti** nella card (`E` object e `_azPkgDef`): `sensor.stato_anti_zanzare` → `sensor.frarik_antizanzare_stato_sistema`, `sensor.probabilita_pioggia` → `sensor.frarik_antizanzare_probabilita_pioggia`, `binary_sensor.pioggia_in_corso` → `binary_sensor.frarik_antizanzare_pioggia_corso`, `binary_sensor.blocco_meteo_attivo` → `binary_sensor.frarik_antizanzare_blocco_meteo`
- **Aggiunto `sensor.frarik_antizanzare_consumo_acqua`** (portata acqua durante ciclo) — mostrato nel tile timer come `X L/min` quando un ciclo è attivo
- **"Programma" spostato fuori dalle impostazioni**: il pulsante calendario ora appare direttamente nella riga giorni attivi, il pannello cicli si apre inline sotto i chip (non più nascosto dentro il ⚙)
- **Cicli come glass pill**: ogni riga ciclo ha bordo ciano, sfondo frosted, label `C1/C2/...` con badge colorato — stile glassmorphism in linea con card elettrodomestici
- `_azPkgDef` arricchito con `pk_pioggia_corso` e `pk_consumo_acqua`

## 1.7.61 — 2026-07-02

### chore: bump versione tutti i PKG (test badge store)

- Tutti i `pkg/frarik_*.yaml` bumped per testare il badge "📦 PKG update" sulle tile dello store

## 1.7.60 — 2026-07-02

### fix: badge PKG update appare correttamente sulle tile dello store

- `_ghCheckPkg`: dopo aver popolato `_pkgPending` chiama `_ghStoreRender()` se lo store è aperto — prima le tile non si aggiornavam mai
- `hasPkgUpd` rimosso il doppio blocco `&&pkgIsOnHANow&&!wizConfigOk` — il badge ora appare sempre quando c'è un update pendente, anche se il wizard era già configurato
- `_ntfHandleAction doUpdate`: cancella `_pkgPending[fileName]` dopo aggiornamento riuscito + ri-renderizza le tile per rimuovere il badge
- `hasPkgUpdPending` non richiede più `pkgIsOnHANow` (se è in `_pkgPending` è già installato per definizione)

## 1.7.59 — 2026-07-02

### chore: bump versione tutti i PKG

- Tutti i `pkg/frarik_*.yaml` bumped per inviare aggiornamento agli utenti installati

## 1.7.58 — 2026-07-02

### fix: badge PKG a sinistra (no sovrapposizione) + PKG update visibile su tile card

- Badge PKG (✓ / richiesto / update) spostati a sinistra dell'anteprima con `.ghc-bdgl` — non si sovrappongono più al badge di stato (Installata / Aggiornamento / In vista) che rimane a destra
- Tile card nel tab JS: `hasPkgUpd` ora include anche `_pkgPending` (SHA GitHub cambiato) — mostra badge "PKG update" e pulsante "Aggiorna PKG" anche quando rilevato dal controllo SHA, non solo dal confronto versioni

## 1.7.57 — 2026-07-02

### chore: bump versione tutti i PKG (test badge aggiornamento store)

- Tutti i `pkg/frarik_*.yaml` bumped alla versione successiva per testare il badge "📦 Aggiornamento" nella tab PKG dello store

## 1.7.56 — 2026-07-02

### feat: aggiornamenti PKG visibili nello Store (tab PKG)

- Nella tab PKG dello store, i package installati su HA con un aggiornamento disponibile mostrano ora un badge arancio "📦 Aggiornamento" accanto al nome
- Aggiunto pulsante "Aggiorna" arancio direttamente nella riga del PKG (stessa azione del clic ✓ nella campanella)
- Nessuna modifica al flusso di aggiornamento: conferma → reinstalla PKG con wizard config già salvata

## 1.7.55 — 2026-07-02

### chore: bump versione tutti i PKG (trigger notifica aggiornamento)

- Tutti i `pkg/frarik_*.yaml` bumped alla versione successiva per far scattare la notifica campanella "📦 PKG aggiornato" agli utenti che li hanno già installati

## 1.7.54 — 2026-07-02

### feat: notifica campanella quando un PKG installato viene aggiornato su GitHub

- Quando `_ghCheck()` gira (all'avvio e automaticamente), controlla anche i file `pkg/*.yaml` su GitHub con la stessa singola chiamata API del git tree
- Se un PKG è installato su HA e il suo SHA GitHub è cambiato rispetto all'ultima versione installata → notifica nella campanella "📦 PKG aggiornato"
- Clic ✓ sulla notifica: conferma e aggiorna il PKG automaticamente (usa config wizard salvata se disponibile, altrimenti reinstalla)
- Prima volta che un PKG viene visto installato: SHA salvato come baseline senza notifica (evita falsi positivi al primo avvio)
- SHA salvato dopo aggiornamento riuscito: la notifica non ricompare per la stessa versione

## 1.7.53 — 2026-07-02

### fix: elettrodomestici PKG — push abilitato + "unknown" in Alexa risolto

- `input_boolean frarik_XXX_notify_push/alexa/google`: aggiunto `initial: on` a tutti i PKG elettrodomestici (lavatrice, asciugatrice, lavastoviglie, forno, microonde, induzione, friggitrice, frigorifero, scaldabagno) — prima partivano disabilitati, le notifiche non arrivavano mai
- Messaggi Alexa/Google: `state_attr(...,'tempo_ciclo_XXX')` → `states('input_text.frarik_XXX_ultimo_ciclo') | trim` — elimina la race condition post `ciclo_attivo=off` che causava "lavaggio terminato in unknown"
- Notifica push: stessa correzione su "⏱ Ciclo durato"
- Save action (`input_text.set_value ultimo_ciclo`): aggiunto `| trim` per pulire spazi dal template
- Stesse fix nei file JS embedded (Lavatrice.js, Asciugatrice.js, Forno.js, Microonde.js, Induzione.js, Lavastoviglie.js, Friggitrice.js, Frigorifero.js, Scaldabagno.js)

## 1.7.52 — 2026-07-02

### fix: Differenziata PKG — push abilitato + annuncio in italiano con articoli

- `input_boolean frarik_differenziata_notifica_*`: aggiunto `initial: on` — prima partivano disabilitati, push e Google/Alexa non arrivavano mai
- Messaggio Alexa/Google/Push: da "Oggi devi esporre …" a "Stasera metti fuori la plastica e il vetro" / "Stasera metti fuori l'umido" ecc. — template Jinja2 con mappa articoli italiani (umido→l'umido, plastica→la plastica, vetro→il vetro…), gestisce liste multiple con virgola e "e" finale

## 1.7.51 — 2026-07-02

### fix: Differenziata — wizard non compariva (registry key errata)

- `FratechCardRegistry['differenziata-card']` → `['differenziata']`: il store cerca il wizard tramite `FratechCardRegistry[filename.toLowerCase()]` (= `'differenziata'`), il suffisso `-card` causava lookup fallito → nessun wizard, installazione diretta senza configurazione push/google/alexa

## 1.7.50 — 2026-07-02

### fix: wizard PKG — rimosso GitHub fetch, usa sempre YAML embedded

- **Bolletta.js**: `_BOLL_PKG_YAML` ora contiene il YAML completo (1344 righe) con placeholder `IL_TUO_*`; rimosso `fetch` a GitHub che scaricava il file con `sensor.non_configurato` ignorando le impostazioni utente
- **posta-card.js**, **Irrigazione.js**, **Antizanzare.js**: stesso fix — il wizard installa ora il YAML embedded tramite `_buildCustomPkg` / `_buildPkgIRR` / `_buildPkgAZ` senza passare per GitHub
- Risolve: gli input del wizard (sensore, switch, notifiche) venivano ignorati perché le sostituzioni `IL_TUO_*` non trovavano corrispondenza nel file GitHub aggiornato da v1.7.48

## 1.7.49 — 2026-07-02

### fix: Differenziata — wizard notifiche + YAML completo con automazioni

- Rimosso stub `_DIFF_PKG` (solo entità, nessuna automazione)
- Aggiunto `_DIFF_PKG_YAML` embedded con YAML completo (entità + automazioni notifiche)
- Aggiunto `_diffOpenWizard` che chiede push/google/alexa (Differenziata non ha sensori da configurare)
- CARD export: sostituito `pkgYaml` con `openWizard` — ora mostra il wizard prima di installare
- Il pkg installato include le automazioni notifica con i dispositivi scelti nel wizard

## 1.7.48 — 2026-07-02

### fix: anchor null nei pkg GitHub + wizard Scaldabagno + posta-card fallback vuoto

- **pkg/*.yaml** (13 file): ripristinati valori non-null a tutti gli anchor azzerati da v1.7.46 — `&push []`, `&google []`, `&alexa []`, entity anchor → `sensor.non_configurato` / `switch.non_configurato`, number anchor → `0.09` / `4.5`. Risolve errori HA: `for_each: null`, `entity_id: null`, `source: null`, `initial: null`
- **Scaldabagno.js**: aggiunto wizard completo (PKG YAML embedded, `_buildPkg`, `_openWizard`) + campi `frarik_pkg_*` nella registrazione CARD — risolve assenza popup installazione pkg
- **posta-card.js**: anchor `&google`, `&alexa`, `&push` ora inline con `[]` quando la lista è vuota (era: commento YAML → anchor null → `for_each: null`)
- **Differenziata.js**: corretta formattazione array `_DIFF_PKG` (due elementi su riga singola)

## 1.7.47 — 2026-07-02

### fix: card-js — rimosso notify.group deprecato dai template YAML embedded (12 card)

- Il wizard usa il template YAML embedded nel JS (non il file GitHub): la fix precedente sui pkg/*.yaml non era sufficiente
- Rimosso blocco `notify: platform: group` da: Lavatrice, Asciugatrice, Forno, Microonde, Induzione, Lavastoviglie, Friggitrice, Frigorifero, Bolletta, Differenziata, posta-card, system-card
- Le automazioni ora usano `repeat.for_each: *push` → `service: "{{ repeat.item.service }}"` (stesso pattern dei pkg/*.yaml)
- Rimossa riga `- service: IL_TUO_MOBILE_APP_2` attiva (non commentata) dalla sezione `&push` degli elettrodomestici
- Fixato typo `notify.frarik_frigoriferorifero` → `notify.frarik_frigorifero` in Frigorifero.js
- Risolve "group.notify: Invalid config" dopo installazione tramite wizard

## 1.7.46 — 2026-07-02

### fix: PKG — rimossi valori placeholder dalle sezioni IMPOSTAZIONI (13 package)

- Tutti gli anchor `&sensore_xxx`, `&switch_xxx`, `&google`, `&alexa`, `&push` ora partono vuoti nei file GitHub
- I valori `IL_TUO_*` / `IL_TUA_*` / `LA_TUA_*` rimossi: lavatrice, asciugatrice, forno, microonde, induzione, lavastoviglie, friggitrice, frigorifero, scaldabagno, bolletta, differenziata, posta, statistiche_minipc
- Il wizard inserisce le entità reali durante l'installazione — gli anchor vuoti su GitHub sono il comportamento corretto

## 1.7.45 — 2026-07-02

### fix: antizanzare — rimosso nome iPhone hardcoded

- Sostituito `notify.mobile_app_iphone_di_francesco` (nome reale dello sviluppatore) con il placeholder `IL_TUO_MOBILE_APP_1` in tutti i 12 punti — risolve Spook "Unknown actions" dopo reinstallazione

## 1.7.44 — 2026-07-02

### fix: PKG — IL_TUO_MOBILE_APP_2 commentato (7 pkg)

- Commentato `- service: IL_TUO_MOBILE_APP_2` nei pkg elettrodomestici (lavatrice, asciugatrice, forno, microonde, induzione, lavastoviglie, friggitrice) — era attivo come secondo device push ma deve restare placeholder disabilitato come negli altri pkg

## 1.7.43 — 2026-07-02

### fix: PKG — rimosso notify.group deprecato (13 package)

- Eliminato il blocco `notify: platform: group` da tutti i package (lavatrice, asciugatrice, forno, microonde, induzione, lavastoviglie, friggitrice, frigorifero, scaldabagno, differenziata, posta, bolletta, statistiche_minipc)
- Le automazioni ora chiamano i servizi push direttamente con `repeat.for_each: *push` → `service: "{{ repeat.item.service }}"` — nessuna modifica alla configurazione utente necessaria
- Risolve le 6+ notifiche di riparazione HA "uses an unknown action: notify.frarik_xxx"

## 1.7.42 — 2026-07-02

### fix: Differenziata v5.13 — bottoni separati dal contenuto

- fc-btns: margin-top:14px fisso + border-top separatore + padding-top:10px (la card è auto-height quindi margin-top:auto non funzionava)

## 1.7.41 — 2026-07-01

### fix: Differenziata v5.12 — bottoni ancorati al fondo della card

- fc-btns: aggiunto margin-top:auto per ancorare i bottoni al bordo inferiore indipendentemente dall'altezza del contenuto

## 1.7.40 — 2026-07-01

### fix: Differenziata v5.11 — rimosso glow parziale che scuriva zona bottoni

- Rimosso fc-card::before (radial gradient verde height:200px) — copriva solo la parte alta della card rendendo la zona bottoni più scura per contrasto

## 1.7.39 — 2026-07-01

### fix: Differenziata v5.10 — doppio sfondo eliminato alla radice

- Root cause: container esterno usa border-radius:20px (--card-r) mentre fc-card aveva 18px — quei 2px mostravano sfondo glass verde del wrapper
- Fix: #rid prende background:#070d18 + border-radius:var(--card-r,20px) + overflow:hidden; fc-card diventa trasparente con border-radius:0

## 1.7.38 — 2026-07-01

### fix: Differenziata v5.9 — sfondo uniforme, no zona scura sui bottoni

- fc-card background cambiato da linear-gradient 155° (che scuriva bordi top/bottom, zona bottoni visibilmente più scura) a #070d18 uniforme
- Ripristinati main.js e tutte le altre card JS al loro stato precedente

## 1.7.37 — 2026-07-01

### fix: doppio sfondo su tutte le card JS eliminato

- main.js: `js-custom` card ora trattate come `yaml-card` → container wrapper trasparente senza bordo/sfondo (il render della card porta il proprio background)
- Tutte le card JS (Lavatrice, Frigorifero, Differenziata e altre 9) ricevono `box-shadow` diretto su `fc-card` per mantenere la profondità

## 1.7.36 — 2026-07-01

### fix: Differenziata v5.8 — ripristino background identico a Lavatrice

- fc-card torna a background:linear-gradient(155deg,...) + border-radius:18px identico a Lavatrice/Frigorifero

## 1.7.35 — 2026-07-01

### fix: Differenziata v5.7 — ripristino sfondo card

- Rimosso overflow:hidden da #rid (rompeva il layout nella widget frame)
- fc-card usa background:#070d18 solido + border-radius:inherit (eredita dal container HA, no doppio sfondo)

## 1.7.34 — 2026-07-01

### fix: Differenziata v5.6 — doppio sfondo e prossima rimossi

- Rimossa riga "Prossima / Domani" dalla colonna destra
- Aggiunto `border-radius:18px;overflow:hidden` all'outer `#rid` per eliminare il doppio sfondo (i corner arrotondati di fc-card mostravano il layer del container HA)

## 1.7.33 — 2026-07-01

### feat: Differenziata v5.5 — bidone ridisegnato a livello lavatrice + colonna destra riscritta

- Bidone SVG completamente rifatto con ~40 elementi (uguale livello di dettaglio della lavatrice): ruote con 4 anelli concentrici + 6 raggi + highlight mozzo; corpo navy con gradiente L→R, bordo sinistro chiaro, bordo destro scuro, 2 righe texture, pannello frontale incassato, banda colorata al top del corpo; coperchio con gradiente colore rifiuto + radial gloss + 2 riflessi arco; maniglia con dettaglio interno — viewBox 64×100
- Colonna destra riscritta: "QUESTA SERA" header piccolo accent-color con pallino pulsante + items; separatore; "DOMANI — Gio" header grigio + items; "PROSSIMA / Domani" in fondo auto-posizionato — gerarchia visiva chiara
- Rimosso nextHtml separato (integrato nella colonna destra)

## 1.7.32 — 2026-07-01

### feat: Differenziata v5.4 — bidone stile prodotto + layout colonna destra migliorato

- Bidone SVG completamente ridisegnato: corpo navy scuro (#10203a→#060e1c) + coperchio colorato con gradiente (colore rifiuto), radial gradient speculare sul coperchio, drop-shadow inline, viewBox 64×82 — stile illustrazione prodotto come lavatrice
- Rimossi i 4 stat box (Questa sera / Domani / Settimana / Prossima) dalla card principale
- Colonna destra: nome rifiuto a sinistra + pallino colorato a destra (fc-met con justify-content:space-between)
- Hero img altezza massima aumentata da 130px a 160px per valorizzare il bidone

## 1.7.31 — 2026-07-01

### feat: Differenziata v5.3 — layout identico agli elettrodomestici

- Render completamente riscritto con le stesse classi CSS di Lavatrice/Frigorifero: `fc-card`, `fc-hdr`, `fc-hero`, `fc-st`, `fc-met`, `fc-stats`, `fc-sb`, `fc-btns`
- Header: icona ♻️ verde + pill "RACCOLTA"/"NESSUN RITIRO" con punto pulsante animato (come COMPRESSORE ON)
- Hero: colonna sinistra = bidoni SVG, colonna destra = "Questa sera" con dot pulsante + lista rifiuti + "Per domani (Giorno)"
- "Prossima raccolta" con la data (equivalente di "Consumo istantaneo 59W")
- Stat boxes (4): Questa sera / Domani / Settimana / Prossima — stessa struttura dei contatori elettrodomestici
- Bottoni: "📅 Settimana" (popup panoramica 7 giorni con colori per tipo) + "⚙ Impostazioni"
- Colore accento verde (#4ade80) coerente con tema raccolta

## 1.7.30 — 2026-07-01

### fix/feat: Differenziata v5.2 — bidone ridisegnato + update funzionante + 2 bidoni

- Bidone SVG completamente rifatto: viewBox 56×82, forme bold e pulite (5 elementi invece di 30+), gradiente corpo orizzontale L→D, lid con gradiente diagonale, gloss bianco, maniglia flat, ruote con highlight — scala bene da 58 a 96px
- Corretta funzione `update()` che era vuota: ora calcola una firma sullo stato (`input_text` oggi + domani + colori), se cambia rigenera il contenuto — i bidoni ora si aggiornano in tempo reale quando si salvano le impostazioni
- Corretta funzione `mount()` con guard anti-duplicati (`el._diffBound`) per evitare listener multipli sullo stesso elemento
- Con 2 rifiuti selezionati per il giorno corrente appaiono correttamente 2 bidoni affiancati colorati

## 1.7.29 — 2026-07-01

### fix: errore "Failed to construct HTMLElement" non appare più nelle notifiche

- Aggiunto filtro in `window.onerror` per errori noti di customElements ES5 (`Failed to construct HTMLElement`, `Please use the 'new' operator`, `CustomElementRegistry`, `already been used`, `ResizeObserver`, `exitFullscreen`) — questi errori vengono ignorati silenziosamente
- Stesso filtro applicato all'handler `unhandledrejection` (unificato con `_KNOWN_CARD_ERRS`)
- La causa originale dell'errore (card Differenziata con pattern ES5) è già rimossa in v5.1

## 1.7.28 — 2026-07-01

### feat: Differenziata v5.1 — bidone migliorato + popup rifatto

- Bidone SVG completamente ridisegnato: gradiente corpo più morbido, highlight bordo sinistro, shadow drop, ruote con highlight speculare, coperchio con radial gradient, proporzioni più pulite
- Rimossa la settimana mini con pallini in fondo alla card — lo spazio va ai bidoni hero (ora più grandi)
- Popup impostazioni: giorni con nome completo e pill con pallino colorato, sezione colori con quadrato di anteprima + palette ridisegnata con ring di selezione, toggle più grandi (44×26px) con transizione fluida, titolo popup aggiornato

## 1.7.27 — 2026-07-01

### fix: card Differenziata non appariva nella dashboard

- Corretto il meccanismo di registrazione: `window.FratechStore.register()` non esiste — le card scrivono direttamente in `window.FratechCardRegistry[id]` con render/mount/update inclusi
- Rimosso il fallback `customElements.define` ES5 (non necessario e potenzialmente confusionario)
- La card ora compare correttamente nella dashboard dopo l'aggiornamento JS dallo store

## 1.7.26 — 2026-07-01

### feat: card Differenziata v5 — stile elettrodomestici

- Riscritto completamente nello stile delle card elettrodomestici (IIFE, FratechStore, mkOv/popShell)
- Rimossa icona ⚙ dall'header; pulsante "⚙ Impostazioni" in fondo alla card come negli altri elettrodomestici
- Colonna destra: "Questa sera" + "Per domani (giorno)" con chip colorati per tipo rifiuto
- Bidoni SVG v2: versione ultra-realistica con gradienti multipli, filtro ombra SVG, speculare radiale sul coperchio, ribs curve, ruote con raggi, asimmetria 3D
- Settimana mini in basso con puntini colorati per giorno
- Popup impostazioni: pills multi-selezione per giorno + palette colori + notifiche con pulsante Salva
- Background gradient scuro + glow verde come elettrodomestici

## 1.7.25 — 2026-07-01

### fix: "Aggiorna PKG" non installava il YAML su HA

- `_pkgUpdateCard`: rimosso il ramo `openWizard` per gli aggiornamenti — il wizard è solo per l'installazione iniziale dove l'utente configura i placeholder; negli update si usa sempre `_pkgGenericInstall` che scarica e scrive il YAML da GitHub
- `_pkgGenericInstall`: guardia su `f`/`res` null (chiamata da update path) — evita crash TypeError `null.newCards` che impediva `_pkgPostInstall` e mostrava un errore fuorviante

## 1.7.24 — 2026-07-01

### fix: Differenziata — "Aggiorna PKG" non funzionava

- Rimosso `openWizard` dal registro FratechStore: la sua presenza faceva sì che `_pkgUpdateCard` aprisse il popup impostazioni invece di chiamare `_pkgGenericInstall`, che è l'unico che scarica e installa il YAML su HA
- Il bottone ⚙ nella card apre comunque le impostazioni direttamente

## 1.7.23 — 2026-07-01

### feat: card Raccolta Differenziata v4 — riscrittura completa

- Layout 2 colonne stile elettrodomestici: bidoni realistici a sinistra, dati a destra
- Multi-selezione rifiuti per ogni giorno (chips cliccabili): umido, secco, carta, plastica, vetro
- Colori personalizzabili per tipo di rifiuto (palette + color picker nativo), salvati in localStorage
- Bidoni SVG fotorealistici con gradienti 3D, ribs, ruote, manico e ombra
- Calendario settimanale con puntini colorati per tipo di rifiuto
- Popup impostazioni: sezione giorni + sezione colori + sezione notifiche con pulsante Salva
- PKG `frarik_differenziata.yaml` v2.0: rimosse entità `rifiuto2_*` (ora tutto in `rifiuto_GIORNO` come CSV), `max: 255` sulle input_text

## 1.7.22 — 2026-07-01

### fix: PKG posta doppio-prefisso + notify group nomi errati

- `frarik_posta.yaml`: rimosso `binary_sensor.` davanti al placeholder — il wizard ora incolla l'entity_id completo dell'utente senza duplicarlo
- PKG 8 elettrodomestici: `name: Lavatrice` → `name: frarik_lavatrice` (e così per tutti gli altri) — il gruppo notify ha ora lo stesso nome richiesto dall'automazione

## 1.7.21 — 2026-07-01

### fix: impostazioni elettrodomestici — entity names corretti + pulsante Salva

- Fix entità nel popup Impostazioni: tutti gli 8 elettrodomestici usavano nomi senza prefisso `frarik_` (es. `lavatrice_notify_push` invece di `frarik_lavatrice_notify_push`) → le chiamate HA non avevano effetto
- Aggiunto pulsante "💾 Salva impostazioni": i toggle e i campi ora applicano le modifiche solo al click Salva, con feedback visivo "✅ Salvato!"
- Frigorifero: fix speciale `frigo_*` → `frarik_frigorifero_*`

## 1.7.20 — 2026-07-01

### fix: wizard PKG non si apriva (openWizard non trovato)

- `_ghsPkgAskPopup` e `_pkgUpdateCard`: il lookup `CardClass` usava `FratechCardRegistry` (wrapper senza `openWizard`) e il `??` non scendeva a `customElements.get` — ora si controlla prima il costruttore custom element

## 1.7.19 — 2026-07-01

### fix: rimosse PKG duplicate + fix installazione PKG senza wizard

- Rimossi `pkg/centro_controllo_*.yaml` (11 file) e `pkg/posta.yaml` — rimangono solo i `frarik_*.yaml`
- Fix `_pkgGenericInstall`: non usava più `_ghsCache.pkg` (mai popolato) ma ora scarica il YAML direttamente da `raw.githubusercontent.com`

## 1.7.18 — 2026-07-01

### feat: PKG elettrodomestici rinominati in standard frarik_ + card JS allineate

- Creati 9 PKG `frarik_[nome].yaml` per tutti gli elettrodomestici (lavatrice, asciugatrice, lavastoviglie, friggitrice, forno, microonde, induzione, frigorifero, scaldabagno)
- Tutte le entità interne rinominate con prefisso `frarik_[nome]_*` (nessun più senza prefisso)
- Placeholder utente standardizzati: `IL_TUO_SENSORE_POTENZA`, `IL_TUO_SWITCH`, `IL_TUO_MEDIA_PLAYER_*`, `IL_TUO_MOBILE_APP_*`
- Creato `frarik_scaldabagno.yaml` da zero (nessun sorgente precedente)
- Card JS (8 elettrodomestici): `pkDefaults()` aggiornati con nomi entità `frarik_*`, template embedded sostituiti con PKG corretti, fix copy-paste "Frigo" in Lavatrice.js
- Card JS: Scaldabagno.js `pkDefaults()` aggiornato con entità `frarik_scaldabagno_*`
- Creati `frarik_differenziata.yaml`, `frarik_irrigazione.yaml`, `frarik_antizanzare.yaml`
- Aggiornati URL fetch GitHub in Differenziata.js, Irrigazione.js, Antizanzare.js → puntano a `frarik_*.yaml`

## 1.7.17 — 2026-06-30

### feat: Differenziata v3.0 — layout 2 colonne + doppio rifiuto

- Card ridisegnata: colonna sinistra con bidoni SVG, colonna destra con data/domani/settimana
- Supporto doppio rifiuto: nella modifica (✏️) ogni giorno ha due righe con preset colorati
- Quando configurato, la colonna sinistra mostra 2 bidoni affiancati
- PKG aggiornato con entità `frarik_differenziata_rifiuto2_*` per il secondo rifiuto

## 1.7.16 — 2026-06-30

### fix: PKG Posta — file rinominato in frarik_posta.yaml per compatibilità store

- Aggiunto `pkg/frarik_posta.yaml` (nome atteso dal wizard); il vecchio `posta.yaml` resta come alias

## 1.7.15 — 2026-06-30

### fix: Bolletta v3.5 + PKG antizanzare/differenziata — formula corretta + testi bianchi + prefissi frarik_

- Bolletta calcBill: costanti ARERA aggiornate ad aprile 2026 (perdite 10.3261%, CdispD 0.015531, mc=0, dispbt=0, UC6f 0.016567, RAI 9€)
- Bolletta calcBill: placeholder in impostazioni aggiornati con i valori corretti
- Bolletta: tutti i testi principali portati a #fff (rimosso rgba < 100% dal row(), label, simulator, wizard)
- PKG antizanzare: aggiunto header Frarik ASCII; tutte le entità rinominate a prefisso `frarik_antizanzare_`; aggiunto sensor.frarik_antizanzare_versione
- PKG differenziata: riscritto da zero con header Frarik, prefisso `frarik_differenziata_`, entità pulite e automazione semplificata

## 1.7.14 — 2026-06-30

### fix: Bolletta v3.4 — formula calcBill corretta + dettaglio con fallback calcolo

- calcBill: perdite di rete applicate SOLO alla materia energia (non a disp/mc)
- calcBill: canone RAI default 7€/mese (€70/anno) configurabile da impostazioni
- Impostazioni tab Tariffa: aggiunto campo "Canone RAI (€/mese)" — metti 0 se esente
- Dettaglio: se i sensori PKG sono 0 (PKG non installato), calcola le voci con calcBill
- Dettaglio: prezzo energia letto da localStorage, non solo da entità HA

## 1.7.13 — 2026-06-30

### fix: Bolletta v3.3 — salvataggio tariffe in localStorage + autocomplete sensori FV

- Tariffe salvate in localStorage (`_nums`): sopravvivono a rimozione card e assenza PKG
- calcBill usa _nums come fallback intermedio: ARERA REST → localStorage → HA entity → default
- Tab FV: sensori con dropdown autocomplete (lista entità HA come nel tab Sensori e wizard)
- Tab FV: toggle usa pointer-events invece di disabled per bloccare il container (non singoli input)
- Tab Sensori: stessa dropdown autocomplete aggiunta anche ai campi

## 1.7.12 — 2026-06-30

### fix: Bolletta v3.2 — impostazioni persistenti + fix FV toggle

- Impostazioni persistenti: chiave localStorage fissa (`frarik_bolletta_cfg_v1`); eliminare e reinserire la card non azzera le impostazioni
- FV toggle: stato ON/OFF salvato in localStorage → rimane ON dopo salva/esci/rientra
- FV toggle: campi di testo ora editabili dopo click ON (rimosso `pointer-events:none` dallo stile disabled)

## 1.7.11 — 2026-06-30

### fix: Bolletta v3.1 — impostazioni ristrutturate + sezione FV live

- Impostazioni: 3 tab (Tariffa, ☀️ FV, Sensori) — Contratto+ARERA uniti; Mensili rinominato FV
- Tab FV: campi sensori FV (potenza live, kWh oggi/mese) disabilitati se FV toggle OFF; abilitati se ON
- Card principale: sezione FV visibile quando fotovoltaico attivo (produzione W live, kWh oggi, kWh mese, credito GSE)
- Fix aggiornamento real-time: `update()` include sig FV sensori; `el._fcBound=null` prima del re-render
- Salvataggio impostazioni: re-render immediato della card senza uscire/rientrare
- Entità PKG: prefisso corretto `frarik_bolletta_` su tutti i sensori in `pkDefaults()`

## 1.7.10 — 2026-06-30

### fix: PKG bolletta rinominato in frarik_bolletta.yaml

- `pkg/centro_controllo_bolletta.yaml` → `pkg/frarik_bolletta.yaml`
- Bolletta.js: aggiornati `frarik_pkg_id` e path API install

## 1.7.09 — 2026-06-30

### fix: Bolletta — wizard diretto + toggle FV in impostazioni

- Wizard PKG: rimosso step "Genera YAML" — pulsante "⬇ Installa PKG" installa direttamente senza mostrare l'area testo
- Impostazioni → tab Mensili: aggiunto toggle "☀️ Ho il Fotovoltaico" (chiama `input_boolean.bolletta_ha_fotovoltaico` immediatamente); spostato Credito GSE prima dei bonus

## 1.7.08 — 2026-06-30

### fix: Bolletta.js — wizard PKG integrato nello store

- Aggiunti `frarik_pkg_check`, `frarik_pkg_id`, `frarik_pkg_version`, `openWizard` al registro
- Lo store ora riconosce che la card richiede un PKG e mostra il wizard all'installazione
- `openWizard(hass, onDone)`: firma corretta; aggiunto pulsante "⬇ Installa su Home Assistant" che chiama `/api/frarik/pkg/install` e chiude automaticamente la card store
- Mantenuto pulsante "Copia negli appunti" per install manuale

## 1.7.07 — 2026-06-30

### fix: PKG — consolidamento in pkg/ unica cartella

- Spostati tutti i PKG da `frarik-addon/pkgs/` → `pkg/` (cartella unica)
- `centro_controllo_frigorifero.yaml`: aggiornato a v1.3 (era v1.2 hardcoded) con placeholder wizard generici
- `frarik_statistiche_minipc.yaml` e `posta.yaml`: spostati in `pkg/`
- Cartella `frarik-addon/pkgs/` ora vuota e rimossa dal repo

## 1.7.06 — 2026-06-30

### feat: Card Bolletta v3.0 — riscrittura completa stile Frarik

**Bolletta.js v3.0** (riscrittura completa)
- Stile identico alle altre card Frarik: glass dark background, amber `#fbbf24`, popup slide-up con `mkOv`/`popShell`
- Card principale: importo mese in hero, pillole kWh/c€kWh/FV, 3 stat box (oggi/proiezione/live W), barra avanzamento mese, mini grafico 6 mesi
- Popup **Dettaglio**: voci bolletta (materia/trasporto/oneri/accise/IVA/RAI/bonus/GSE), totale, tariffe ARERA trimestre
- Popup **Simulatore**: input kWh+bonus+GSE, calcolo live JS (formula identica al PKG), breakdown completo; salva su `input_number` HA
- Popup **Storico**: grafico a barre 12 mesi curr/prev, legenda anni, tabella dettaglio con confronto
- Popup **Impostazioni** (4 tab): Contratto (tariffa/spread/kW/comm), ARERA (tutti i fallback), Mensili (bonus/GSE), Sensori (entity ID)
- Popup **Configura Sensori**: dropdown autocomplete entità HA
- Popup **Installa PKG**: wizard genera YAML personalizzato da copiare in `config/packages/`
- Tutti gli input: `type="text" inputmode="decimal"` — nessuno slider
- Supporto FV: `input_boolean.bolletta_ha_fotovoltaico` + `input_number.bolletta_credito_gse`
- `mount`/`update` pattern Frarik standard; sig-based re-render

**frarik_bolletta.yaml** (fix PKG)
- Canone RAI: `not in [7,8]` (era `in [1,2,4,7,10]`)
- Aggiunti `bolletta_ha_fotovoltaico` e `bolletta_credito_gse`

**pkg/centro_controllo_bolletta.yaml**: aggiornato con il PKG corretto

## 1.7.05 — 2026-06-30

### fix: store — popup centrato (BUG ROOT CAUSE) + anteprima con hass reale

- **Root cause centering**: in style.css era presente CSS legacy `#ghs-prev-modal{position:fixed;inset:0}` (da una versione precedente) che faceva sì che il modal fosse `position:fixed` a tutto schermo, ancorato in alto-sinistra — anche con inline styles sull'overlay il modal scappava dal flusso. Fix: rimosso tutto il CSS `ghs-prev-*` da style.css; iniettato via `<style>` tag in `document.head` (stesso pattern di `_openAddCardPopup` che funziona correttamente)
- `#ghs-prev-modal` ora ha `position:relative` esplicito nel CSS iniettato — immune da conflitti futuri
- **Anteprima**: ora usa `_haHassObj()` (hass reale di HA) invece del mock — bolletta, person e qualsiasi card funzionano perché ricevono i dati veri dell'installazione. Mock usato solo come fallback se HA non disponibile
- `setConfig` usa `storageKey:'__preview__'` (non `__prev__`) per non toccare la configurazione reale dell'utente
- Descrizione popup aggiornata: "Dati live dalla tua installazione"

## 1.7.04 — 2026-06-30

### fix: store — popup centrato + preview bolletta/person

- `_ghsShowPreviewModal`: riscritta con **inline styles** (non CSS class) — garantisce centratura `position:fixed` corretta indipendentemente dal stacking context HA
- `_ghsPreviewCard`: override `window.frarikHass = () => mockH` prima del render, ripristino su chiusura modal — card che chiamano `window.frarikHass?.()` (bolletta, person, ecc.) ora ricevono dati simulati
- `_ghsPreviewClose`: nuova funzione che rimuove il popup e ripristina `window.frarikHass` originale
- `_createMockHass`: aggiunte entità per bolletta/energia: `sensor.energia_mese/mensile/oggi`, `sensor.costo_mese/oggi/energia`, `input_number.costo_kwh/potenza_contratto`, `sensor.bolletta_mensile`, `sensor.fasce_orarie`, `sensor.potenza_attuale`
- `_createMockHass`: aggiunte entità person/device_tracker: `person.riccardo`, `device_tracker.iphone_francesco/riccardo`
- Proxy fallback esteso: gestisce `input_number`, `person`, `device_tracker` con stati appropriati
- `_ghsPreviewFillCfg`: aggiunti campi per bolletta (`costEntity`, `dailyCostEntity`, `billEntity`, ecc.) e person

## 1.7.03 — 2026-06-30

### fix: store — anteprima card robusta + popup quadrato

- `_ghsPreviewCard`: usa il valore di ritorno di `_installCardCode` (`res.tags[0]`) per il tag name — risolve il 90% dei fallimenti (prima si basava solo su regex che mancava molti pattern)
- `_ghsPreviewFillCfg`: ora applica i default per TUTTI i campi comuni (non solo quelli già presenti nello stub) — le card che richiedono configurazione ricevono entità fittizie appropriate
- Pulizia localStorage `__prev__` prima di ogni anteprima — evita dati residui da preview precedenti
- Fallback multipli per `setConfig`: prova 4 varianti di config in cascata
- Double-push `hass` dopo 120ms per card async
- CSS popup: dimensione fissa `min(500px,100%) × min(500px,90vh)` — quadrato e perfettamente centrato

## 1.7.02 — 2026-06-30

### fix: store — _ghsPreviewCard esposta su window

- Aggiunta `_ghsPreviewCard` al blocco `Object.assign(window, {...})` — senza questo, `data-action="_ghsPreviewCard"` non trovava la funzione e il bottone non faceva nulla

## 1.7.01 — 2026-06-30

### feat: store — anteprima card con dati simulati

- Bottone 👁 viola su ogni tile dello Store (Cards, Da installare, Elettrodomestici)
- `_ghsPreviewCard(enc)`: apre un popup che carica dinamicamente il JS della card, la istanzia come custom element e la renderizza con `hass` simulato
- `_createMockHass()`: oggetto `hass` completo con entità fittizie (sensori temp/umidità/consumo, weather con forecast 5 giorni, lavatrice, climate, lights) + `Proxy` per restituire dati plausibili per qualunque `entity_id` richiesto
- `_ghsPreviewFillCfg()`: pre-compila i campi vuoti in `getStubConfig()` con entity IDs fittizie appropriate per tipo
- Supporto `callApi` history: restituisce dati sintetici per i popup grafici delle card
- CSS: modale `#ghs-prev-ov` / `#ghs-prev-modal` con header, body scrollable, footer disclaimer

## 1.7.00 — 2026-06-30

### feat: store — redesign UI futuristico

- **Card tile**: `border-radius` 18→20px, `backdrop-filter:blur(6px)`, hover con lift+scale, strip 3→4px, preview 200→175px, bottoni 30% più alti (9px padding vs 6px), testo più leggibile (13px nome, 10.5px desc)
- **Grid**: min-width 182→215px, gap 12→14px; responsive: 160px su mobile `<620px`, 230px su schermi `>1100px`
- **Search bar**: wrap con icona 🔍 posizionata absolute, padding-left 40px, font-size 13px, border-radius 14px, placeholder semitrasparente; JS aggiorna `ghs-search-wrap` per hide/show
- **Section dots**: `.ghc-sec-dot.ok` verde con glow, `.ghc-sec-dot.new` viola con glow
- **Sub-tab bar**: i tab in `#ghs-subtabs-cards` diventano pill orizzontali (flex-direction:row, border-radius:20px) invece di stack verticali
- **Empty state**: font-size 12→13px, line-height 1.8, colore semitrasparente
- **Delete button**: 28→33px, border-radius 8→9px

## 1.6.99 — 2026-06-30

### fix: store — card SOS rimossa dal tab Locali

- `_ghStoreRenderInstalled`: rimossa la condizione che includeva le card `_builtin` nel tab Locali — la card SOS (predefinita di sistema) non compare più tra le card locali
- Le card builtin restano visibili solo nel tab Predefinite

## 1.6.98 — 2026-06-30

### feat: store — gerarchia tab a due livelli (Cards + sub-tab)

- **Tab Cards** diventa un tab parent nel menu principale; cliccandolo mostra una riga di sub-tab
- **Sub-tab di Cards**: Cards (js), Elettrodomestici, Chips, Distintivi, Predefinite, Card YAML
- **Tab standalone rimasti**: Installate, Premium, Locali, Salvate
- `ghStoreTab`: aggiunta logica per evidenziare il parent `ghs-tab-cards-grp` e mostrare/nascondere `#ghs-subtabs-cards` in base al tab attivo
- Sub-tab stilizzati con `ghc-tab-sm` (più compatti rispetto ai tab principali)

## 1.6.97 — 2026-06-30

### fix: store — Installa non funzionava da tab Elettrodomestici e Installate

- `_ghsFolderTab(tab)`: nuova funzione che mappa i tab virtuali (`elettrodomestici`, `installate`) al tab fisico `js` (stessa cartella GitHub)
- `_ghsFind`: usa `_ghsFolderTab` per cercare nella cache corretta (`_ghsCache['js']`)
- `_ghsEnsureFile`: usa `_ghsFolderTab` per ricaricare dalla cartella `card-js` quando il tab attivo è virtuale
- `_ghsDeleteFromGithub`: usa `_ghsFolderTab` per invalidare la cache corretta dopo eliminazione

## 1.6.96 — 2026-06-30

### fix+feat: store — 3 fix grafici/UX

- **Bug Aggiorna+In vista**: nel tab Installate, quando una card ha un aggiornamento disponibile, ora mostra solo "Aggiorna" senza sovrapporre anche "✓ In vista" (layout pulito)
- **Tab uniformi**: rimossi stili speciali (bordo dorato/viola/blu) dai tab Premium, Card YAML e Predefinite — ora hanno lo stesso aspetto degli altri tab
- **Popup "Aggiungi card"**: il popup in modifica plancia ora mostra lo stesso Store completo (tutti i tab: Cards, Elettrodomestici, Installate, Chips, Distintivi, Premium, Card YAML, Predefinite, Locali, Salvate) invece dei vecchi 4 tab limitati. Funziona tramite DOM-move di `#ep-content-store`; ogni "Aggiungi" aggiunge la card alla sezione/colonna corretta

## 1.6.95 — 2026-06-30

### fix: store — categorizzazione corretta Frigorifero/Induzione/Bolletta + rename tab Cards

- `_isElettrCard`: aggiunto `frigorif` e `induzion` alla regex → Frigorifero e Induzione ora riconosciuti come elettrodomestici
- `_isElettrCard`: rimosso `bolletta` dalla regex → Bolletta torna in tab Cards (non è un elettrodomestico)
- `index.html`: tab "Card JS" rinominato in "Cards"

## 1.6.94 — 2026-06-30

### feat: store — tab Installate, card JS e Elettrodomestici senza duplicati, spostamento manuale

- **Tab 🗂 Installate**: mostra tutte le card JS installate da GitHub, con badge del tab di appartenenza (⚡/🔌), bottoni Aggiungi/Aggiorna/Disinstalla e bottone ⤷ Sposta
- **Card JS**: ora mostra SOLO card non-installate e non-appliance — le installate vanno in Installate, le appliance in Elettrodomestici
- **Elettrodomestici**: ora mostra SOLO card non-installate — le installate scompaiono dal tab e vanno in Installate
- **Spostamento manuale** (⤷): ogni tile ha un bottone che apre un picker per assegnare manualmente la card a ⚡ Card JS, 🔌 Elettrodomestici o 🔄 Auto (torna al rilevamento automatico). La scelta viene salvata in localStorage e sopravvive ai refresh

## 1.6.93 — 2026-06-30

### feat: store — tab Elettrodomestici con auto-categorizzazione

- `index.html`: aggiunto bottone tab 🔌 Elettrodomestici tra Card JS e Chips
- `main.js`: `_isElettrCard()` — rileva automaticamente se una card è un elettrodomestico con 3 livelli: 1) `CARD.category='elettrodomestici'` nel registry; 2) commento `/* frarik-category: elettrodomestici */` nel codice; 3) smart-match sul nome file (Asciugatrice, Bolletta, Clima, Forno, ecc.)
- `main.js`: `_ghStoreRenderElettr()` — rendering filtrato identico alla tab Card JS ma solo card elettrodomestici; intestazione informativa con spiegazione auto-categorizzazione
- `main.js`: `ghStoreTab('elettrodomestici')` — riutilizza `_ghsCache['js']` se già caricato, altrimenti scarica card-js da GitHub

## 1.6.92 — 2026-06-29

### fix: frarik_bolletta — rename entità da `br_` a `bolletta_`

**frarik_bolletta.yaml + Bolletta.js**
- Tutti gli entity ID rinominati da prefisso `br_` → `bolletta_` (es. `sensor.bolletta_mensile`, `input_number.bolletta_tariffa_energia`)
- `_bDefs` card aggiornati con i nuovi ID
- Template `_BOLL_PKG_YAML` nel wizard aggiornato; wizard installa in `frarik/frarik_bolletta.yaml`
- Solo `sensor.frarik_bolletta_versione` rimane invariato (rilevamento pkg store)

## 1.6.91 — 2026-06-29

### feat: frarik_bolletta.yaml v1.0 — Package formato Frarik standard

**frarik_bolletta.yaml v1.0** (riscritto in formato frarik standard)
- Logo ASCII FRARIK, sezioni COSA FA / INSTALLAZIONE / ENTITÀ CREATE
- `homeassistant: customize:` con ancore YAML per sensore potenza, Octopus, notifiche push
- `notify.frarik_bolletta` gruppo push — `group.notifiche_bolletta` toggle
- Sensore `frarik_bolletta_versione` per rilevamento automatico pkg nella card
- Integration sensor W→kWh + 5 utility meter (giornaliero/settimanale/mensile/trimestrale/annuale)
- REST ARERA auto-aggiornamento (24h) con 16 tariffe regolatorie; fallback su `input_number.bolletta_fb_*`
- 14 sensori template di calcolo (perdite, dispacciamento, mercato capacità, DISPbt, PNO, commercializzazione, trasporto x3, UC3, UC6 x2, ARIM, ASOS, accise, IVA, canone RAI)
- Bolletta mensile, giornaliera, proiezione, costo al kWh, media giornaliera, media settimanale, simulatore sandbox
- Storico 12+12 mesi (€+kWh), archiviazione anno a fine dicembre, backup anti-reset ogni 15 min
- Toggle notifiche granulari, alert soglia potenza (W) con finestra oraria, report mattutino 08:00, alert scadenza Octopus
- Script `bolletta_reset_sensori_energia`, 8 automazioni

## 1.6.90 — 2026-06-29

### feat: Card Bolletta v1.0 — Package completo energia elettrica

**Bolletta.js v1.0** (nuova card)
- Hero con spesa mensile (€), badge kWh, badge costo al kWh tutto incluso, badge scadenza Octopus
- Stats live: costo oggi, kWh oggi, potenza istantanea in W
- Mini grafico a barre ultimi 6 mesi
- Barra avanzamento mese (gg passati vs totale)
- Popup **Dettaglio voci**: materia energia, trasporto, oneri, accise, IVA, canone RAI, bonus; badge ARERA trimestre
- Popup **Storico 12 mesi**: grafico a barre doppio (anno corrente vs precedente) + lista con delta €
- Popup **Impostazioni**: slider tariffa Octopus, bonus, soglia alert potenza, sandbox simulatore (inserisci kWh → calcola bolletta)
- Configuratore entity ID (⚙ in header o `configure()`)

**bolletta_riccardo.yaml v1.0** (package bolletta fusione 5 sorgenti — sostituito da frarik_bolletta.yaml)

## 1.6.89 — 2026-06-29

### feat: Antizanzare v2.4 + Differenziata v2.5 — cicli live + hero domani

**Antizanzare v2.4**
- Chip giorno redesign: mostra numero di cicli attivi + 5 puntini indicatori
- Pulsanti **−** e **+** direttamente sui chip: incrementano/decrementano `num_cicli`, accendono/spengono il giorno automaticamente (0 cicli = giorno OFF)
