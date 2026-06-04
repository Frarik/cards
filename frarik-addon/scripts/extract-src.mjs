/**
 * Estrae CSS e JS da panel/index.html → src/
 * Approccio robusto: state-machine invece di regex per gli script grandi
 */
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir  = path.dirname(fileURLToPath(import.meta.url));
const root   = path.join(__dir, '..');
const srcDir = path.join(root, 'src');
const html   = fs.readFileSync(path.join(root, 'panel', 'index.html'), 'utf8');

fs.mkdirSync(path.join(srcDir, 'core'),  { recursive: true });
fs.mkdirSync(path.join(srcDir, 'cards'), { recursive: true });
fs.mkdirSync(path.join(srcDir, 'ui'),    { recursive: true });

// ── Estrai CSS ───────────────────────────────────────────────────────────────
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!cssMatch) { console.error('❌ CSS non trovato'); process.exit(1); }
fs.writeFileSync(path.join(srcDir, 'style.css'), cssMatch[1].trim() + '\n');
console.log(`✓ src/style.css  (${Math.round(cssMatch[1].length/1024)} KB)`);

// ── Estrai blocchi <script> con state machine ────────────────────────────────
// Non usiamo regex per il corpo (contiene '</'+'"script">' come stringa letterale)
function extractScripts(src) {
  const blocks = [];
  let pos = 0;
  while (pos < src.length) {
    const open = src.indexOf('<script', pos);
    if (open === -1) break;

    // Trova la fine del tag di apertura
    const tagEnd = src.indexOf('>', open);
    if (tagEnd === -1) break;
    const openTag = src.slice(open, tagEnd + 1);

    // Salta script con src= (CDN esterni)
    if (/\bsrc\s*=/.test(openTag)) {
      pos = tagEnd + 1;
      continue;
    }

    // Trova </script> corrispondente scorrendo carattere per carattere
    // per evitare il problema con '</'+'script>' dentro stringhe
    let depth = 1;
    let cur   = tagEnd + 1;
    let inner = '';
    while (cur < src.length && depth > 0) {
      if (src.startsWith('<script', cur) && /[\s>]/.test(src[cur+7]||'>')) {
        depth++;
        inner += src[cur];
        cur++;
      } else if (src.startsWith('</script>', cur)) {
        depth--;
        if (depth === 0) { cur += '</script>'.length; break; }
        inner += src[cur];
        cur++;
      } else {
        inner += src[cur];
        cur++;
      }
    }
    const trimmed = inner.trim();
    if (trimmed) blocks.push(trimmed);
    pos = cur;
  }
  return blocks;
}

const blocks = extractScripts(html);
const mainJs = blocks.join('\n\n') + '\n';
fs.writeFileSync(path.join(srcDir, 'main.js'), mainJs);
console.log(`✓ src/main.js    (${Math.round(mainJs.length/1024)} KB, ${blocks.length} blocchi)`);

// ── Crea src/index.html pulita (solo struttura HTML, no script/style inline) ─
// Trova l'inizio e la fine del body
const bodyOpen  = html.indexOf('<body');
const bodyClose = html.lastIndexOf('</body>');
if (bodyOpen === -1 || bodyClose === -1) {
  console.error('❌ <body> non trovato'); process.exit(1);
}

let body = html.slice(bodyOpen, bodyClose + '</body>'.length);

// Rimuovi tutti i blocchi <script> dal body (inline e src=)
body = body.replace(/<script[\s\S]*?<\/script>/gi, '');

// Rimuovi eventuali <style> nel body
body = body.replace(/<style>[\s\S]*?<\/style>/gi, '');

// Pulisci righe vuote multiple
body = body.replace(/\n{3,}/g, '\n\n').trim();

const indexHtml =
`<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Frarik</title>
</head>
${body}
`;
fs.writeFileSync(path.join(srcDir, 'index.html'), indexHtml);
console.log(`✓ src/index.html (${Math.round(indexHtml.length/1024)} KB)`);

console.log('\nDone. Esegui: npm run build');
