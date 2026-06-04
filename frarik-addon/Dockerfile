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

# Startup script
COPY run.sh /run.sh
RUN chmod a+x /run.sh

CMD ["/run.sh"]
