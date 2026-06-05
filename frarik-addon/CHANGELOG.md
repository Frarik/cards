# Changelog

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
