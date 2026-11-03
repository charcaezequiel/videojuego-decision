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

/* el manual vive en js/data/manual.js con pares [espanol, ingles]: se evalua
   con las reglas reales para comparar los dos idiomas bloque por bloque */
function cargarManual(){
  const js = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
  const DF = {};
  const window = { DF };
  new Function('window', 'DF', js('js/data/niveles.js'))(window, DF);
  new Function('window', 'DF', js('js/data/manual.js'))(window, DF);
  return DF;
}
let manualInfo = 'manual sin revisar';
try{
  const DF = cargarManual();
  const manEs = DF.manualPara('es'), manEn = DF.manualPara('en');
  const reviso = (l, m) => m.secciones.forEach((b, i) => {
    const texto = (txt, q) => {
      if(!txt || !String(txt).trim()) console.log('  manual vacio [' + l + '] bloque ' + i + ' (' + q + ')');
      if(String(txt).indexOf('—') >= 0) console.log('  manual sin numero [' + l + '] bloque ' + i + ' (' + q + '): "' + txt + '"');
    };
    texto(b.h2, 'titulo');
    b.p.forEach(p => texto(p, 'parrafo'));
  });
  reviso('es', manEs);
  reviso('en', manEn);
  if(manEs.secciones.length !== manEn.secciones.length)
    console.log('  manual: ' + manEs.secciones.length + ' bloques en ES y ' + manEn.secciones.length + ' en EN');
  manEs.secciones.forEach((b, i) => {
    const o = manEn.secciones[i];
    if(!o) return console.log('  manual EN: falta el bloque ' + i);
    if(o.p.length !== b.p.length)
      console.log('  manual bloque ' + i + ': ' + b.p.length + ' parrafos en ES y ' + o.p.length + ' en EN');
  });
  if(manEs.creditos.length !== manEn.creditos.length)
    console.log('  creditos: ' + manEs.creditos.length + ' en ES y ' + manEn.creditos.length + ' en EN');
  const parrafos = manEs.secciones.reduce((a, b) => a + b.p.length, 0);
  manualInfo = manEs.secciones.length + ' bloques y ' + parrafos + ' parrafos en ES y EN';
}catch(e){
  console.log('  manual: no se pudo evaluar js/data/manual.js -> ' + e.message);
}

for(const b of bad) console.log('  ' + b[0].padEnd(18) + b[1].padEnd(20) + '"' + b[2] + '"  !=  "' + b[3] + '"');
if(missing.length) console.log('  sin traduccion EN: ' + missing.join(', '));
if(extra.length) console.log('  clave EN sin ES:   ' + extra.join(', '));
console.log('\n' + bad.length + ' diferencias de texto, ' + (missing.length + extra.length) + ' claves desalineadas');
console.log('manual: ' + manualInfo);
