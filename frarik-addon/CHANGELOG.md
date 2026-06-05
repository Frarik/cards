# Changelog

## 1.1.18 — 2026-06-05

### Corretto
- Ripristinato il renderer YAML interno (la 1.1.17 con il motore di HA via cross-realm rompeva anche l'anteprima delle card semplici). Le card semplici tornano a vedersi; per le card HACS complesse serve l'approccio iframe (in valutazione).

## 1.1.17 — 2026-06-05

### Corretto
- Card YAML: ora vengono renderizzate con il **motore ufficiale di Home Assistant** (`createCardElement`) sia in anteprima sia in dashboard, quindi appaiono **identiche a HA** incluse le custom card HACS (button-card, bar-card, multiple-entity-row, swipe-card, ecc.). Prima si usava solo un renderer interno leggero che mostrava solo le card semplici. Fallback automatico al renderer interno se la plancia non gira dentro HA.

## 1.1.16 — 2026-06-05

### Aggiunto
- Store, scheda 📄 YAML: pulsante **➕ Aggiungi** che scarica la card YAML dal repo, ne mostra l'anteprima e la inserisce nella dashboard come `yaml-card` (rende qualsiasi card Lovelace/HACS via `createCardElement`). Le card YAML si mettono nella cartella `card-yaml/` del repo. Aggiunto un esempio.

## 1.1.15 — 2026-06-05

### Modificato
- Logo/icona dell'add-on sostituiti con il marchio ufficiale "DOMOTICA FR" (emblema esagonale con casa smart, wi-fi e iniziali FR).

## 1.1.14 — 2026-06-05

### Modificato
- Nuovo logo/icona dell'add-on: casa "smart home" con onde wi-fi e le iniziali **FR**, su gradiente indaco→viola.

## 1.1.13 — 2026-06-05

### Aggiunto
- Pulsante 🧹 "Rimuovi card orfane" nello Store: cancella le card installate da GitHub diventate orfane (id non più presente nel repo, invisibili nelle schede) che gonfiavano il conteggio. Reinstalla prima le card attuali del repo; le card locali non vengono toccate.

## 1.1.12 — 2026-06-05

### Aggiunto
- Icona e logo dell'add-on (`icon.png` 256×256, `logo.png` 250×100): fulmine ⚡ su gradiente indaco→viola. Sostituiscono il quadratino generico nello store HA.

## 1.1.11 — 2026-06-05

### Corretto
- Badge "Contatti SOS": non conta più i contatti vuoti (riga aggiunta e mai compilata). Alla chiusura del pannello SOS i contatti completamente vuoti vengono rimossi. Corretto anche singolare/plurale (1 contatto / N contatti).

## 1.1.10 — 2026-06-05

### Corretto
- Il toast "Sincronizzato su Home Assistant" non compare più a ogni modifica: solo quando premi tu "Sincronizza su tutti i dispositivi". Gli auto-salvataggi sono silenziosi.
- Conteggio Store gonfiato: le card eliminate non "risorgono" più tramite la sincronizzazione tra dispositivi (riconciliazione con lo stato remoto). Scartate/rimosse le voci corrotte dal localStorage.

## 1.1.9 — 2026-06-05

### Modificato
- Impostazioni riorganizzate: "Impostazioni Pagina", "Sistema · Plancia" e "Barra inferiore" unite in un unico menù a fisarmonica **Plancia** (sotto-sezioni: Aspetto, Pagina, Sistema, Barra inferiore). Store, Notifiche Smart e Contatti SOS raccolti sotto la categoria **Altro**.

## 1.1.8 — 2026-06-05

### Modificato
- Centro notifiche (campanella) ora **solo informativo**: niente clic/azioni, ogni notifica ha la "✕" per eliminarla
- Rimosse le 3 icone in alto nel pannello notifiche (segna lette / svuota / regole)
- **Disaccoppiato** il centro notifiche dalle notifiche smart: le regole smart restano un sistema a sé (popup) e non finiscono più nella campanella

## 1.1.7 — 2026-06-05

### Modificato
- "Sincronizza su tutti i dispositivi": rimosso il toast iniziale "Invio…"; ora compare solo la conferma finale di HA (o l'avviso se non connesso)

## 1.1.6 — 2026-06-05

### Rimosso
- Pulsante "Salva configurazione" dalle impostazioni: ridondante perché la config si salva e sincronizza su HA automaticamente a ogni modifica. Rimossi anche `oikSaveConfig`, il footer e il CSS orfano (`.ep-footer`, `.oik-save`, `.ep-logout-btn`).

## 1.1.5 — 2026-06-05

### Pulizia
- Rimosso tutto il codice login/credenziali ormai inutilizzato: overlay `#lov`, funzioni `doLogin`/`doLogout`/`setLoginMode`/`toggleLoginAdv`, listener, CSS login e relativi export. La connessione (token/host, overlay `#cov`) resta invariata.

## 1.1.4 — 2026-06-05

### Rimosso
- Pulsante "Esci dalla Dashboard" dalle impostazioni (il login iniziale non esiste più)

## 1.1.3 — 2026-06-05

### Rimosso
- Login iniziale: la dashboard si apre direttamente senza schermata di accesso

## 1.1.2 — 2026-06-05

### Rimosso
- Scheda "Speciali" (card built-in) dallo store

## 1.1.1 — 2026-06-05

### Rimosso
- Pulsanti "Esporta backup" e "Ripristina backup" dal pannello impostazioni

## 1.0.0 — 2026-06-04

### Aggiunto
- Prima versione come add-on Home Assistant ufficiale
- Server Node.js/Express con cache headers intelligenti
- Supporto ingress HA (accesso sicuro via Nabu Casa senza porte aperte)
- Copia automatica dei file panel in `/config/www/frarik/`
- API versione: `GET /api/frarik/version`
- Build multi-architettura (amd64, aarch64, armv7, armhf, i386)

### Migrato da
- `frarik.html` monolitico (~788 KB) → struttura modulare
