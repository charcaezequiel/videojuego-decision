/* tools/check_i18n.js · compara el texto de reserva de cada HTML con el diccionario ES
   node tools/check_i18n.js  -> lista de diferencias (0 = todo alineado)            */
const fs = require('fs');
const path = require('path');

const PAGES = path.join(__dirname, '..', 'pages');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'i18n.js'), 'utf8');

function dictOf(lang, next){
  const from = src.indexOf('\n    ' + lang + ': {');
  const to = next ? src.indexOf('\n    ' + next + ': {', from) : -1;
  const body = src.slice(from, to < 0 ? src.length : to);
  const out = {};
  const re = /([A-Za-z0-9_]+):\s*'((?:[^'\\]|\\.)*)'/g;
  for(const m of body.matchAll(re)) out[m[1]] = m[2].replace(/\\'/g, "'");
  return out;
}

const es = dictOf('es', 'en');
const en = dictOf('en', null);

const bad = [];
for(const f of fs.readdirSync(PAGES).filter(x => x.endsWith('.html'))){
  const s = fs.readFileSync(path.join(PAGES, f), 'utf8');
  for(const m of s.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]+)</g)){
    const key = m[1], html = m[2].trim();
    if(!(key in es)){ bad.push([f, key, html, '<<clave inexistente>>']); continue; }
    if(es[key].indexOf('{') >= 0) continue;              /* plantilla con variables */
    if(es[key] !== html) bad.push([f, key, html, es[key]]);
  }
}

/* claves ES y EN desalineadas */
const missing = Object.keys(es).filter(k => !(k in en));
const extra = Object.keys(en).filter(k => !(k in es));

for(const b of bad) console.log('  ' + b[0].padEnd(18) + b[1].padEnd(20) + '"' + b[2] + '"  !=  "' + b[3] + '"');
if(missing.length) console.log('  sin traduccion EN: ' + missing.join(', '));
if(extra.length) console.log('  clave EN sin ES:   ' + extra.join(', '));
console.log('\n' + bad.length + ' diferencias de texto, ' + (missing.length + extra.length) + ' claves desalineadas');
