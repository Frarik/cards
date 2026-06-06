#!/usr/bin/env node
/**
 * build-card-catalog.mjs
 * Genera "Istruzioni card/CATALOGO-CARD.md" leggendo le card .js nelle cartelle dello store
 * (card-js, card-chips, card-distintivi). È un'ESTRAZIONE deterministica (non "AI"):
 * elenca id, nome, versione, formato e i pattern/API usati da ogni card, così la
 * documentazione resta sempre allineata alle card realmente presenti nel repo.
 *
 * Uso:   node scripts/build-card-catalog.mjs
 * (oppure aggiungi un alias npm / un git hook — vedi guida)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FOLDERS = [
  { dir: 'card-js',          label: '⚡ Card JS' },
  { dir: 'card-chips',       label: '🔹 Chips' },
  { dir: 'card-distintivi',  label: '🏷️ Distintivi' },
];
const OUT = join(ROOT, 'Istruzioni card', 'CATALOGO-CARD.md');

const grab = (re, code) => { const m = code.match(re); return m ? m[1].trim() : null; };

// pattern/API rilevati per dare "spunti" su cosa sanno fare le card esistenti
const FEATURES = [
  [/\bcallSvc\s*\(/,            'callSvc (chiama servizi HA)'],
  [/\bfetchHistory\s*\(/,      'fetchHistory (storia entità)'],
  [/window\.hs\b/,             'window.hs (stati)'],
  [/window\.ha\b/,             'window.ha (attributi)'],
  [/this\._hass|hass\.callService/, 'hass completo (Lovelace)'],
  [/Chart\s*\(|new Chart/,     'Chart.js'],
  [/<svg|createElementNS/,     'grafica SVG inline'],
  [/setInterval|setTimeout/,   'timer'],
  [/addEventListener/,         'interazione (listener)'],
  [/device_class/,             'auto-scoperta device_class'],
  [/leaflet|L\.map|__pcLeaflet/i, 'mappa Leaflet'],
  [/createPortal|appendChild\(document\.body|position:\s*fixed/, 'popup/overlay'],
];

function analyze(code, file) {
  const isFratech  = /FratechCardRegistry\s*\[/.test(code);
  const isLovelace = /customElements\.define\s*\(/.test(code);
  const format = isFratech ? 'FratechStore' : isLovelace ? 'Lovelace' : '—';

  // metadati: prima prova il blocco CARD (FratechStore), poi customCards (Lovelace), poi nome file
  let id   = grab(/\bid\s*:\s*['"]([^'"]+)['"]/, code)
          || grab(/customElements\.define\s*\(\s*['"]([^'"]+)['"]/, code)
          || file.replace(/\.js$/i, '');
  const name    = grab(/\bname\s*:\s*['"]([^'"]+)['"]/, code) || id;
  const version = grab(/\bversion\s*:\s*['"]([^'"]+)['"]/, code) || '—';
  const icon    = grab(/\bicon\s*:\s*['"]([^'"]+)['"]/, code) || '';
  const desc    = grab(/\bdesc(?:ription)?\s*:\s*['"]([^'"]+)['"]/, code) || '';

  const feats = FEATURES.filter(([re]) => re.test(code)).map(([, lbl]) => lbl);
  const hasMount  = /\bmount\s*\(/.test(code);
  const hasUpdate = /\bupdate\s*\(/.test(code);
  const lines = code.split('\n').length;

  return { file, id, name, version, icon, desc, format, feats, hasMount, hasUpdate, lines };
}

const cards = [];
for (const { dir, label } of FOLDERS) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) continue;
  for (const f of readdirSync(full)) {
    if (!/\.js$/i.test(f)) continue;
    if (/^frarik[-.]/i.test(f)) continue;        // file dell'app, non card
    let code = '';
    try { code = readFileSync(join(full, f), 'utf8'); } catch { continue; }
    cards.push({ folder: dir, folderLabel: label, ...analyze(code, f) });
  }
}
cards.sort((a, b) => (a.folder + a.id).localeCompare(b.folder + b.id));

const now = new Date().toISOString().slice(0, 10);
let md = `# Catalogo card del repo (auto-generato)

> ⚠️ **File generato automaticamente** da \`scripts/build-card-catalog.mjs\` — non modificarlo a mano.
> Rigenera con: \`node scripts/build-card-catalog.mjs\`
> Ultima generazione: ${now} · Card trovate: ${cards.length}

Questo catalogo elenca le card realmente presenti nel repo e i pattern/API che usano.
Serve come **riferimento vivo**: quando si crea una nuova card si possono leggere quelle
esistenti (in \`card-js/\`, \`card-chips/\`, \`card-distintivi/\`) per riusarne stile e tecniche.

## Riepilogo

| Cartella | File | ID | Nome | Versione | Formato |
|---|---|---|---|---|---|
`;
for (const c of cards) {
  md += `| ${c.folder} | \`${c.file}\` | \`${c.id}\` | ${c.icon ? c.icon + ' ' : ''}${c.name} | ${c.version} | ${c.format} |\n`;
}

md += `\n## Dettaglio\n`;
for (const c of cards) {
  md += `\n### ${c.icon ? c.icon + ' ' : ''}${c.name}  ·  \`${c.file}\`\n`;
  md += `- **ID:** \`${c.id}\` · **versione:** ${c.version} · **formato:** ${c.format}\n`;
  if (c.desc) md += `- **Descrizione:** ${c.desc}\n`;
  md += `- **Hooks:** ${[c.hasMount && 'mount', c.hasUpdate && 'update'].filter(Boolean).join(', ') || '—'} · **righe:** ${c.lines}\n`;
  md += `- **Pattern/API usati:** ${c.feats.length ? c.feats.join(' · ') : '—'}\n`;
}

md += `\n---\n_Per le regole e i template di creazione vedi \`CREAZIONE-CARD.md\` in questa cartella._\n`;

writeFileSync(OUT, md, 'utf8');
console.log(`✅ CATALOGO-CARD.md aggiornato — ${cards.length} card da ${FOLDERS.map(f => f.dir).join(', ')}`);
