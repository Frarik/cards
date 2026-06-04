import express from 'express';
import path    from 'path';
import fs      from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app     = express();
const PORT    = 3000;
const PANEL   = path.join(__dirname, 'panel');
const HA_WWW  = '/config/www/frarik';

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
try {
  copyDir(PANEL, HA_WWW);
  console.log('[Frarik] File copiati in', HA_WWW);
} catch (e) {
  console.warn('[Frarik] Copia www non riuscita (non bloccante):', e.message);
}

let manifest = { version: '1.0.0', build: 'dev' };
try { manifest = JSON.parse(fs.readFileSync(path.join(PANEL, 'manifest.json'), 'utf8')); } catch {}

app.use(express.static(PANEL, {
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    const base = path.basename(filePath);
    if (base === 'index.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    } else if (/\/assets\//.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

app.get('/api/frarik/version', (_req, res) => {
  res.json({ version: manifest.version, build: manifest.build, ok: true });
});

app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(PANEL, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Frarik] Server su porta ${PORT} — v${manifest.version}`);
});
