import {readFileSync, writeFileSync} from 'fs';

const sysPath = 'card-js/System.js';
const yamlPath = 'frarik-addon/pkgs/frarik_statistiche_minipc.yaml';

let js = readFileSync(sysPath, 'utf8');
let yaml = readFileSync(yamlPath, 'utf8');

const escaped = yaml
  .split('\\').join('\\\\')
  .split('`').join('\\`')
  .split('${').join('\\${');

const yamlVar = '  var _SRV_PKG_YAML=`' + escaped + '`;\n\n';

const marker = '  /* ═══════════════════════════════════════════════════════\n     PKG — Centro Controllo Server v2.8';

if (!js.includes(marker)) {
  const idx = js.indexOf('  /* ══');
  console.error('MARKER NOT FOUND, indexOf result:', idx);
  console.error('Looking for:', JSON.stringify(marker.slice(0,60)));
  process.exit(1);
}

js = js.replace(marker, yamlVar + marker);
writeFileSync(sysPath, js, 'utf8');
console.log('OK - System.js updated, new size:', js.length);
