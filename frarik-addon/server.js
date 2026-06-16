import express from 'express';
import path    from 'path';
import fs      from 'fs';
import http    from 'http';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app     = express();
const PORT    = 3000;
const PANEL   = path.join(__dirname, 'panel');
const HA_WWW  = '/config/www/frarik';
const CFG_DIR  = '/config/frarik';
const CFG_FILE = path.join(CFG_DIR, 'cfg.json');

const SUP_TOKEN = process.env.SUPERVISOR_TOKEN || '';
const CORE_HTTP = 'http://supervisor/core';        // proxy REST verso HA core
const CORE_WS   = 'ws://supervisor/core/websocket'; // proxy WebSocket verso HA core

const LICENSE_API = 'https://frarik-license.frarik.workers.dev/api/validate';

/* ═══════════════════════════════════════════════════════════════════════════
   LICENZA — il backend è il vero gatekeeper.
   Nessun token HA arriva mai al browser: il client manda solo la chiave licenza
   (cookie frarik_lic o header/param), il backend valida col Worker e fa da proxy
   verso HA usando il SUPERVISOR_TOKEN. Revoca ~istantanea: cache 30s + ricontrollo
   periodico sulle connessioni WebSocket aperte.
   ═══════════════════════════════════════════════════════════════════════════ */
const LIC_TTL = 5 * 60 * 60 * 1000; // 5 ore (era 30s) — riduce KV writes di 600x
const _licCache = new Map();          // key → { ts, valid, data }

async function checkLicense(key) {
  if (!key) return { valid: false };
  const c = _licCache.get(key);
  if (c && Date.now() - c.ts < LIC_TTL) return c.data;
  try {
    const r = await fetch(LICENSE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    // Risposta HTTP non-200 (429 rate-limit, 500 KV esaurito, ecc.) = Worker
    // temporaneamente non disponibile. Riusa cache precedente di qualsiasi età,
    // o marca offline. NON aggiornare la cache con { valid:false } in questo caso.
    if (!r.ok) {
      if (c) return c.data;
      return { valid: false, offline: true };
    }
    const d = await r.json().catch(() => ({}));
    const data = { valid: !!d.valid, name: d.name, note: d.note, expires: d.expires };
    _licCache.set(key, { ts: Date.now(), data });
    return data;
  } catch (e) {
    // Worker irraggiungibile (errore rete): riusa l'ultimo esito noto di qualsiasi età.
    if (c) return c.data;
    return { valid: false, offline: true };
  }
}

function keyFromCookie(cookieHeader) {
  const m = (cookieHeader || '').match(/(?:^|;\s*)frarik_lic=([^;]+)/);
  return m ? decodeURIComponent(m[1]).trim().toUpperCase() : '';
}
function keyFromReq(req) {
  return keyFromCookie(req.headers.cookie)
      || (req.headers['x-frarik-key'] ? String(req.headers['x-frarik-key']).trim().toUpperCase() : '')
      || '';
}

/* ── Copia build in /config/www (modalità Lovelace legacy, non bloccante) ── */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
try { copyDir(PANEL, HA_WWW); console.log('[Frarik] File copiati in', HA_WWW); }
catch (e) { console.warn('[Frarik] Copia www non riuscita (non bloccante):', e.message); }

let manifest = { version: '1.0.0' };
try { const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')); manifest.version = pkg.version; } catch {}
try { const cfg = fs.readFileSync(path.join(__dirname, 'config.yaml'), 'utf8'); const m = cfg.match(/^version:\s*"?([^"\n]+)"?/m); if (m) manifest.version = m[1].trim(); } catch {}

/* ═══════════════════════════════════════════════════════════════════════════
   ENDPOINT LOCALI DELL'ADD-ON (devono precedere il proxy /api/*)
   ═══════════════════════════════════════════════════════════════════════════ */
app.get('/api/frarik/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    const cfg = fs.readFileSync(path.join(__dirname, 'config.yaml'), 'utf8');
    const m = cfg.match(/^version:\s*"?([^"\n]+)"?/m);
    if (m) manifest.version = m[1].trim();
  } catch {}
  res.json({ version: manifest.version, ok: true });
});

// Stato licenza per il frontend (UX): valida la chiave fornita lato server.
app.get('/api/frarik/license', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const lic = await checkLicense(keyFromReq(req));
  res.json(lic);
});

/* ── Plancia (configurazione dashboard) salvata in un file dell'add-on ──
   Persiste in /config/frarik/cfg.json (volume config:rw). Indipendente dall'utente
   HA: una plancia per istanza, gestita dall'add-on. Gated da licenza. */
app.get('/api/frarik/config', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const lic = await checkLicense(keyFromReq(req));
  if (!lic.valid) { res.status(403).json({ error: 'Licenza non valida o revocata' }); return; }
  try {
    const txt = fs.readFileSync(CFG_FILE, 'utf8');
    res.type('application/json').send(txt);
  } catch (e) {
    res.json(null); // nessuna plancia salvata ancora
  }
});

app.post('/api/frarik/config', async (req, res) => {
  const lic = await checkLicense(keyFromReq(req));
  if (!lic.valid) { res.status(403).json({ error: 'Licenza non valida o revocata' }); return; }
  try {
    const txt = (await readBody(req)).toString('utf8');
    JSON.parse(txt); // valida: se non è JSON valido → 400 (non sovrascrive il file buono)
    fs.mkdirSync(CFG_DIR, { recursive: true });
    fs.writeFileSync(CFG_FILE, txt);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e && e.message || e) });
  }
});

async function reloadHaStore() {
  if (!SUP_TOKEN) return false;
  try {
    const r = await fetch('http://supervisor/store/reload', {
      method: 'POST', headers: { Authorization: 'Bearer ' + SUP_TOKEN }
    });
    return r.ok;
  } catch { return false; }
}
app.post('/api/frarik/reload-store', async (_req, res) => {
  const ok = await reloadHaStore();
  res.json({ ok });
});

/* Aggiorna l'add-on dalla repository GitHub e riavvia automaticamente */
app.post('/api/frarik/self-update', async (_req, res) => {
  if (!SUP_TOKEN) return res.json({ ok: false, err: 'no_supervisor' });
  try {
    await reloadHaStore();
    const r = await fetch('http://supervisor/addons/self/update', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + SUP_TOKEN, 'Content-Type': 'application/json' }
    });
    const body = await r.json().catch(() => ({}));
    res.json({ ok: r.ok, result: body.result });
  } catch (e) {
    res.json({ ok: false, err: String(e) });
  }
});

/* ── Gestione Pacchetti HA (PKG YAML in /config/packages/) ── */
const PKG_DIR = '/config/packages';
const CARD_JS_DIR = path.join(__dirname, '..', 'card-js');

/* Serve i file .js da card-js/ in modo che possano essere reinstallati localmente */
app.get('/api/frarik/card-js/:file', (req, res) => {
  const file = path.basename(req.params.file || '');
  if (!file || !/\.js$/i.test(file)) return res.status(400).end();
  const filePath = path.join(CARD_JS_DIR, file);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(filePath);
});

app.get('/api/frarik/pkg/list', (_req, res) => {
  try {
    fs.mkdirSync(PKG_DIR, { recursive: true });
    const files = fs.readdirSync(PKG_DIR).filter(f => /\.ya?ml$/i.test(f));
    res.json({ ok: true, files });
  } catch (e) { res.json({ ok: false, files: [], error: String(e.message) }); }
});

app.get('/api/frarik/pkg/read', (req, res) => {
  const name = String(req.query.name || '');
  if (!name || !/\.ya?ml$/i.test(name) || name.includes('/') || name.includes('..'))
    return res.status(400).json({ ok: false, error: 'Nome non valido' });
  try {
    const content = fs.readFileSync(path.join(PKG_DIR, name), 'utf8');
    res.type('text/plain').send(content);
  } catch (e) { res.status(404).json({ ok: false, error: String(e.message) }); }
});

app.post('/api/frarik/pkg/install', async (req, res) => {
  try {
    const { name, content } = JSON.parse((await readBody(req)).toString('utf8'));
    const parts = (name || '').replace(/\\/g, '/').split('/').filter(Boolean);
    if (!parts.length || parts.length > 2 || parts.some(p => p === '..' || p === '.') || !/\.ya?ml$/i.test(parts[parts.length - 1]))
      return res.status(400).json({ ok: false, error: 'Nome non valido' });
    const filePath = path.join(PKG_DIR, ...parts);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    // rimuovi eventuale copia legacy nella root di packages/ (stesso nome file, senza sottocartella)
    if (parts.length === 2) {
      const legacy = path.join(PKG_DIR, parts[1]);
      if (legacy !== filePath) { try { fs.unlinkSync(legacy); } catch(_){} }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: String(e.message) }); }
});

app.delete('/api/frarik/pkg/uninstall', async (req, res) => {
  try {
    const { name } = JSON.parse((await readBody(req)).toString('utf8'));
    if (!name || !/\.ya?ml$/i.test(name) || name.includes('/') || name.includes('..'))
      return res.status(400).json({ ok: false, error: 'Nome non valido' });
    const p = path.join(PKG_DIR, name);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: String(e.message) }); }
});

/* ═══════════════════════════════════════════════════════════════════════════
   PROXY REST → HA core  (tutto /api/* tranne /api/frarik/* e /api/websocket)
   Gated da licenza. Il token HA non transita mai dal browser.
   ═══════════════════════════════════════════════════════════════════════════ */
function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.alloc(0)));
  });
}

app.use(async (req, res, next) => {
  const p = req.path;
  if (!/^\/api\//.test(p)) return next();
  if (/^\/api\/frarik\//.test(p)) return next();
  if (p === '/api/websocket') return next(); // gestito dall'upgrade WS

  const lic = await checkLicense(keyFromReq(req));
  if (!lic.valid) { res.status(403).json({ error: 'Licenza non valida o revocata' }); return; }
  if (!SUP_TOKEN) { res.status(503).json({ error: 'Supervisor non disponibile' }); return; }

  try {
    const body = (req.method === 'GET' || req.method === 'HEAD') ? undefined : await readBody(req);
    const headers = { Authorization: 'Bearer ' + SUP_TOKEN };
    const ct = req.headers['content-type'];
    if (ct && body && body.length) headers['Content-Type'] = ct;

    const up = await fetch(CORE_HTTP + req.originalUrl, { method: req.method, headers, body });
    res.status(up.status);
    const upCt = up.headers.get('content-type');
    if (upCt) res.setHeader('Content-Type', upCt);
    res.setHeader('Cache-Control', 'no-store');
    const buf = Buffer.from(await up.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(502).json({ error: 'core non raggiungibile', detail: String(e && e.message || e) });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   FILE STATICI + fallback index.html
   ═══════════════════════════════════════════════════════════════════════════ */
app.use(express.static(PANEL, {
  etag: true, lastModified: true,
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
app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(PANEL, 'index.html'));
});

/* ═══════════════════════════════════════════════════════════════════════════
   PROXY WEBSOCKET → HA core
   Il browser non riceve mai il token: il backend autentica verso HA con il
   SUPERVISOR_TOKEN ed emula l'handshake auth lato browser. Revoca istantanea:
   ricontrollo licenza ogni 30s, alla revoca la socket viene chiusa.
   ═══════════════════════════════════════════════════════════════════════════ */
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  let pathname = '/';
  try { pathname = new URL(req.url, 'http://x').pathname; } catch {}
  if (!pathname.endsWith('/api/websocket')) { socket.destroy(); return; }

  let key = keyFromCookie(req.headers.cookie);
  if (!key) { try { key = (new URL(req.url, 'http://x').searchParams.get('lic') || '').trim().toUpperCase(); } catch {} }

  checkLicense(key).then((lic) => {
    if (!lic.valid) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, (client) => proxyWs(client, key));
  }).catch(() => { try { socket.destroy(); } catch {} });
});

function proxyWs(client, key) {
  if (!SUP_TOKEN) { try { client.close(); } catch {} return; }
  const upstream = new WebSocket(CORE_WS);
  let upAuthed = false;
  const pending = [];

  // Emula l'handshake HA verso il browser
  try { client.send(JSON.stringify({ type: 'auth_required', ha_version: 'frarik' })); } catch {}

  upstream.on('message', (buf) => {
    const txt = buf.toString();
    let m; try { m = JSON.parse(txt); } catch { try { client.send(txt); } catch {} return; }
    if (m.type === 'auth_required') { try { upstream.send(JSON.stringify({ type: 'auth', access_token: SUP_TOKEN })); } catch {} return; }
    if (m.type === 'auth_ok')      { upAuthed = true; while (pending.length) { try { upstream.send(pending.shift()); } catch {} } return; }
    if (m.type === 'auth_invalid') { try { client.close(); } catch {} try { upstream.close(); } catch {} return; }
    try { client.send(txt); } catch {}
  });

  client.on('message', (buf) => {
    const txt = buf.toString();
    let m; try { m = JSON.parse(txt); } catch { return; }
    if (m.type === 'auth') { try { client.send(JSON.stringify({ type: 'auth_ok', ha_version: 'frarik' })); } catch {} return; }
    if (upAuthed) { try { upstream.send(txt); } catch {} } else pending.push(txt);
  });

  upstream.on('close', () => { try { client.close(); } catch {} });
  upstream.on('error', () => { try { client.close(); } catch {} });
  client.on('close', () => { try { upstream.close(); } catch {} clearInterval(iv); });

  // Ricontrollo periodico licenza sulle socket vive (ogni 2h, allineato al LIC_TTL)
  const iv = setInterval(async () => {
    const l = await checkLicense(key);
    if (!l.valid && !l.offline) { try { client.close(4003, 'licenza revocata'); } catch {} try { upstream.close(); } catch {} clearInterval(iv); }
  }, 5 * 60 * 60 * 1000);
}

reloadHaStore().then((ok) => console.log('[Frarik] Store reload avvio:', ok ? 'OK' : 'skip'));
setInterval(() => reloadHaStore(), 5 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`[Frarik] Server su porta ${PORT} — v${manifest.version} — proxy licenza ${SUP_TOKEN ? 'ATTIVO' : 'NO SUPERVISOR_TOKEN'}`);
});
