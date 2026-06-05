# Changelog

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
