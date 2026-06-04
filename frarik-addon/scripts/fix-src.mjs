/**
 * Re-estrae src/ da panel/index.html (UTF-8 puro) e applica tutti i fix
 * Uso: node scripts/fix-src.mjs
 */
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir  = path.dirname(fileURLToPath(import.meta.url));
const root   = path.join(__dir, '..');
const srcDir = path.join(root, 'src');
// Leggi dal sorgente originale (non dal panel/ già processato da Vite)
const html   = fs.readFileSync(path.join(root, '..', 'frarik.html'), 'utf8');

fs.mkdirSync(path.join(srcDir, 'core'),  { recursive: true });
fs.mkdirSync(path.join(srcDir, 'cards'), { recursive: true });
fs.mkdirSync(path.join(srcDir, 'ui'),    { recursive: true });

// ── 1. Estrai CSS ────────────────────────────────────────────────────────────
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!cssMatch) { console.error('❌ CSS non trovato'); process.exit(1); }
fs.writeFileSync(path.join(srcDir, 'style.css'), cssMatch[1].trim() + '\n', 'utf8');
console.log(`✓ style.css  (${Math.round(cssMatch[1].length/1024)} KB)`);

// ── 2. Estrai script con state machine ───────────────────────────────────────
function extractScripts(src) {
  const blocks = [];
  let pos = 0;
  while (pos < src.length) {
    const open = src.indexOf('<script', pos);
    if (open === -1) break;
    const tagEnd = src.indexOf('>', open);
    if (tagEnd === -1) break;
    const openTag = src.slice(open, tagEnd + 1);
    if (/\bsrc\s*=/.test(openTag)) { pos = tagEnd + 1; continue; }
    let depth = 1, cur = tagEnd + 1, inner = '';
    while (cur < src.length && depth > 0) {
      if (src.startsWith('<script', cur) && /[\s>]/.test(src[cur+7]||'>')) {
        depth++; inner += src[cur]; cur++;
      } else if (src.startsWith('</script>', cur)) {
        depth--; if (depth === 0) { cur += 9; break; }
        inner += src[cur]; cur++;
      } else { inner += src[cur]; cur++; }
    }
    const t = inner.trim();
    if (t) blocks.push(t);
    pos = cur;
  }
  return blocks;
}

let js = extractScripts(html).join('\n\n');

// ── 3. Fix duplicati ─────────────────────────────────────────────────────────
// _updatePasteBtn: rinomina la prima (sezioni) → _updateSectionPasteBtn
let count = 0;
js = js.replace(/\b_updatePasteBtn\b/g, match => {
  count++;
  if (count <= 4) return '_updateSectionPasteBtn'; // prima dichiarazione + 3 chiamate
  return match;
});
console.log('✓ fix: _updateSectionPasteBtn');

// _ntfDismiss(id): la seconda dichiarazione → _ntfDismissById
js = js.replace(
  /function _ntfDismiss\(id\)/,
  'function _ntfDismissById(id)'
);
js = js.replace(
  /_ntfDismiss\('(\$\{n\.id\})'\)/g,
  "_ntfDismissById('$1')"
);
console.log('✓ fix: _ntfDismissById');

// _haLocalCheck: rimuovi la PRIMA dichiarazione (legacy localStorage)
// Trova le due posizioni e rimuovi la prima funzione completa
{
  const sig = 'async function _haLocalCheck()';
  const first = js.indexOf(sig);
  const second = js.indexOf(sig, first + sig.length);
  if (first !== -1 && second !== -1) {
    // Trova l'inizio del blocco (va indietro fino al commento precedente)
    let blockStart = first;
    // cerca /* ... */ che precede immediatamente
    const before = js.slice(Math.max(0, first - 400), first);
    const cmtIdx = before.lastIndexOf('/*');
    if (cmtIdx !== -1) blockStart = first - (before.length - cmtIdx);
    // Trova la fine della funzione (prima riga che inizia con "}" dopo l'apertura)
    let depth = 0, i = first;
    while (i < second) {
      if (js[i] === '{') depth++;
      else if (js[i] === '}') { depth--; if (depth === 0) { i++; break; } }
      i++;
    }
    js = js.slice(0, blockStart) + js.slice(i);
    console.log('✓ fix: _haLocalCheck legacy rimossa');
  } else {
    console.log('⚠ _haLocalCheck: solo 1 dichiarazione trovata, skip');
  }
}

// ── 4. Prepend import npm ─────────────────────────────────────────────────────
const imports =
`// ── Dipendenze npm ───────────────────────────────────────────────────────────
import './style.css';
import Chart  from 'chart.js/auto';
import jsyaml from 'js-yaml';
window.Chart  = Chart;
window.jsyaml = jsyaml;

`;
js = imports + js;

// ── 5. Append window.assign per inline handlers ───────────────────────────────
const reserved = new Set(['if','else','for','while','do','return','var','let','const',
  'function','class','new','delete','typeof','void','throw','try','catch','finally',
  'switch','case','break','continue','import','export','default','true','false','null',
  'undefined','this','super','yield','await','async','document','event','window',
  'setTimeout','setInterval','clearTimeout','clearInterval','console','Math','Object',
  'Array','String','Number','Boolean','JSON','Promise','Error','Date']);

// Scansiona SIA l'HTML statico SIA i template string nel JS
// Cerca TUTTE le funzioni in ogni valore on*="..." (anche dopo ; o &&)
const allHandlerFns = new Set();
const attrRe = /on\w+="([^"]+)"/g;
for (const source of [html, js]) {
  for (const m of source.matchAll(attrRe)) {
    for (const call of m[1].matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g)) {
      allHandlerFns.add(call[1]);
    }
  }
}
const inlineFns = [...allHandlerFns].filter(n => !reserved.has(n)).sort();

js += `\n\n// ── Esponi funzioni per handler HTML inline ──────────────────────────────────
Object.assign(window, {\n${inlineFns.map(f => `  ${f},`).join('\n')}\n});\n`;
console.log(`✓ window.assign (${inlineFns.length} funzioni)`);

fs.writeFileSync(path.join(srcDir, 'main.js'), js, 'utf8');
console.log(`✓ main.js  (${Math.round(js.length/1024)} KB)`);

// ── 6. Crea index.html con CDN fonts/icons ripristinati ──────────────────────
const bodyOpen  = html.indexOf('<body');
const bodyClose = html.lastIndexOf('</body>');
let body = html.slice(bodyOpen, bodyClose + 7);
body = body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style>[\s\S]*?<\/style>/gi, '');
body = body.replace(/\n{3,}/g, '\n\n').trim();

const indexHtml =
`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>Frarik</title>
<!-- MDI icons (Material Design Icons) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Poppins:wght@400;600;700;800;900&family=Nunito:wght@400;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head>
${body.replace('</body>', '<script type="module" src="./main.js"></script>\n</body>')}
`;
fs.writeFileSync(path.join(srcDir, 'index.html'), indexHtml, 'utf8');
console.log(`✓ index.html (${Math.round(indexHtml.length/1024)} KB)`);

console.log('\n✅ Done — esegui: npm run build');
