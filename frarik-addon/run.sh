#!/usr/bin/env bash
set -e

CONFIG_DIR=/config
WWW_DIR=$CONFIG_DIR/www
FRARIK_WWW=$WWW_DIR/frarik

echo "[Frarik] Avvio add-on versione $(cat /app/panel/manifest.json | grep -o '"version":"[^"]*"' | cut -d'"' -f4)..."

# Crea www/frarik/ e copia i file statici
mkdir -p "$FRARIK_WWW"
cp -r /app/panel/. "$FRARIK_WWW/"
echo "[Frarik] File panel copiati in $FRARIK_WWW"

# Avvia il server Node.js
echo "[Frarik] Server avviato su porta 3000"
exec node /app/server.js
