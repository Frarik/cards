# Changelog

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
