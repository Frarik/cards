#!/usr/bin/with-contenv bashio
# shellcheck shell=bash

CONFIG_DIR=/config
WWW_DIR=$CONFIG_DIR/www
FRARIK_WWW=$WWW_DIR/frarik

bashio::log.info "Avvio Frarik Dashboard..."

# Crea www/frarik/ e copia i file statici
mkdir -p "${FRARIK_WWW}"
cp -r /app/panel/. "${FRARIK_WWW}/"
bashio::log.info "File panel copiati in ${FRARIK_WWW}"

bashio::log.info "Server Node.js in ascolto su porta 3000"
exec node /app/server.js
