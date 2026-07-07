# Changelog

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
