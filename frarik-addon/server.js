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
try { const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')); manifest.version = pkg.version; } catch {}
try { const cfg = fs.readFileSync(path.join(__dirname, 'config.yaml'), 'utf8'); const m = cfg.match(/^version:\s*"?([^"\n]+)"?/m); if(m) manifest.version = m[1].trim(); } catch {}

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

// Fornisce un token HA valido al browser — usa il token Supervisor iniettato da HA OS
app.get('/api/frarik/token', async (_req, res) => {
  try {
    const supToken = process.env.SUPERVISOR_TOKEN;
    if (!supToken) { res.json({ token: null }); return; }
    // Chiede a HA Core un token a lunga durata via Supervisor
    const resp = await fetch('http://supervisor/core/api/config', {
      headers: { Authorization: 'Bearer ' + supToken }
    });
    if (!resp.ok) { res.json({ token: null }); return; }
    // Il supervisor token è già valido per le API HA, lo passiamo direttamente
    res.json({ token: supToken });
  } catch(e) {
    res.json({ token: null });
  }
});

app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(PANEL, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Frarik] Server su porta ${PORT} — v${manifest.version}`);
});
