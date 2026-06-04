ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest
FROM $BUILD_FROM

# Install Node.js 20 (Alpine-based HA images)
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Install production dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --only=production

# Copy server and panel files
COPY server.js ./
COPY panel/ ./panel/

# Registra run.sh come servizio s6-overlay (non sovrascrivere CMD/ENTRYPOINT del base image)
RUN mkdir -p /etc/services.d/frarik
COPY run.sh /etc/services.d/frarik/run
RUN chmod a+x /etc/services.d/frarik/run
