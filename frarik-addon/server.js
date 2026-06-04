const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = 3000;
const PANEL_DIR = path.join(__dirname, 'panel');

// ── Leggi il manifest per la versione corrente ──
let manifest = { version: '1.0.0', build: 'dev' };
try {
  manifest = JSON.parse(fs.readFileSync(path.join(PANEL_DIR, 'manifest.json'), 'utf8'));
} catch {}

// ── Cache headers intelligenti ──
app.use(express.static(PANEL_DIR, {
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    const base = path.basename(filePath);
    if (base === 'index.html') {
      // HTML: no cache (sempre aggiornato)
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    } else if (/\.\w{8,}\.(js|css)$/.test(base)) {
      // File con hash nel nome (es. frarik.abc12345.js) → cache 1 anno
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // Altri statici (immagini, fonts) → cache 7 giorni
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

// ── Health check / info versione ──
app.get('/api/frarik/version', (_req, res) => {
  res.json({ version: manifest.version, build: manifest.build, ok: true });
});

// ── Fallback: serve index.html per SPA routing ──
app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(PANEL_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Frarik] Server in ascolto su porta ${PORT} — v${manifest.version}`);
});
