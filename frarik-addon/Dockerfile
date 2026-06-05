# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Installa dipendenze (incluso Vite)
COPY package*.json ./
RUN npm ci

# Copia sorgenti e compila
COPY vite.config.js ./
COPY src/ ./src/

RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Solo dipendenze di produzione (no Vite)
COPY package*.json ./
RUN npm ci --only=production

# Server e configurazione
COPY server.js ./
COPY config.yaml ./
COPY CHANGELOG.md ./

# Output del build
COPY --from=builder /build/panel ./panel

EXPOSE 3000
CMD ["node", "server.js"]
