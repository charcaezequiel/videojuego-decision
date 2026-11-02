/* =========================================================
   build_content.js · junta tools/content/casos-*.json y
   genera js/data/niveles.js (casos, preguntas y DF.rules)
   Uso: node tools/build_content.js
   ========================================================= */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(__dirname, 'content');
const OUT = path.join(ROOT, 'js', 'data', 'niveles.js');

function loadCases(){
  const files = fs.readdirSync(SRC).filter(f => /^casos-.*\.json$/.test(f)).sort();
  if(!files.length) throw new Error('No hay archivos tools/content/casos-*.json');
  const all = [];
  files.forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
    (Array.isArray(data) ? data : data.casos || []).forEach(c => all.push(c));
  });
  return all.sort((a, b) => a.n - b.n);
}

/* Q(enunciado, A, B, C, D, 'letraCorrecta', oficial) */
function qFactory(q, opts, key, oficial){
  return { q:q, opts:[opts[0], opts[1], opts[2], opts[3]], key:key, oficial:!!oficial };
}

function validate(cases){
  const errors = [];
  if(cases.length !== 10) errors.push('hay ' + cases.length + ' casos (se esperan 10)');
  cases.forEach((c, i) => {
    const n = i + 1;
    if(c.n !== n) errors.push('caso ' + n + ': trae n=' + c.n);
    ['titulo', 'subtitulo', 'resumen', 'pista'].forEach(k => { if(!c[k]) errors.push('caso ' + n + ': falta ' + k); });
    if(!c.caso || !c.caso.denuncia) errors.push('caso ' + n + ': falta la denuncia');
    if(!c.caso || !Array.isArray(c.caso.testimonios) || c.caso.testimonios.length < 1) errors.push('caso ' + n + ': faltan testimonios');
    if(!c.caso || !Array.isArray(c.caso.pruebas) || c.caso.pruebas.length < 1) errors.push('caso ' + n + ': faltan pruebas');
    if(!c.caso || !c.caso.devolucion) errors.push('caso ' + n + ': falta la devolución');
    if(!Array.isArray(c.palabras) || c.palabras.length !== 3) errors.push('caso ' + n + ': se esperan 3 palabras');
    else c.palabras.forEach(w => { if(!/^[A-ZÑÜ]{4,10}$/.test(w)) errors.push('caso ' + n + ': palabra inválida "' + w + '"'); });
    if(!Array.isArray(c.preguntas) || c.preguntas.length !== 10) errors.push('caso ' + n + ': se esperan 10 preguntas');
    (c.preguntas || []).forEach((q, j) => {
      if(!q.q || !Array.isArray(q.opts) || q.opts.length !== 4) errors.push('caso ' + n + ' pregunta ' + (j + 1) + ': formato inválido');
      const idx = 'ABCD'.indexOf(q.key);
      if(idx < 0) errors.push('caso ' + n + ' pregunta ' + (j + 1) + ': clave "' + q.key + '" no es A-D');
      else if(!q.opts[idx]) errors.push('caso ' + n + ' pregunta ' + (j + 1) + ': la opción correcta está vacía');
      if(j === 0 && !q.oficial) errors.push('caso ' + n + ': la 1.ª pregunta debe ser la oficial');
      if(j > 0 && q.oficial) errors.push('caso ' + n + ' pregunta ' + (j + 1) + ': solo la 1.ª es oficial');
    });
  });
  return errors;
}

const pad = (s, n) => ' '.repeat(Math.max(0, n - s.length));

function emit(cases){
  const L = [];
  L.push('/* =========================================================');
  L.push('   niveles.js · GENERADO por tools/build_content.js — no editar a mano');
  L.push('   10 casos · 10 preguntas por caso · desafío final de 3 palabras');
  L.push('   Para cambiar el contenido: tools/content/casos-*.json y `npm run content`');
  L.push('   ========================================================= */');
  L.push('window.DF = window.DF || {};');
  L.push('');
  L.push('/* Todas las reglas del juego viven acá. */');
  L.push('DF.rules = {');
  L.push('  seconds: 20,            // segundos por pregunta');
  L.push('  correctPoints: 100,     // puntos por respuesta correcta');
  L.push('  maxSpeedBonus: 40,      // bonus máximo por responder rápido');
  L.push('  wordPoints: 50,         // puntos por palabra acertada en el desafío final');
  L.push('  questionCount: 10,      // preguntas por nivel');
  L.push('  wordsPerLevel: 3,       // palabras del desafío final');
  L.push('  attemptsPerWord: 3,     // intentos por palabra');
  L.push('  minCorrect: 7,          // correctas mínimas para ganar el nivel');
  L.push('  minWords: 2,            // palabras mínimas para ganar el nivel');
  L.push('  redirectSeconds: 8,     // espera del resultado antes de volver a Selección de nivel');
  L.push('  starRatios: [0.60, 0.75, 0.90],   // proporción del puntaje máximo para 1 / 2 / 3 estrellas');
  L.push('  folders: [\'denuncia\', \'testimonios\', \'pruebas\']');
  L.push('};');
  L.push('DF.rules.maxScore = DF.rules.questionCount * (DF.rules.correctPoints + DF.rules.maxSpeedBonus)');
  L.push('                     + DF.rules.wordsPerLevel * DF.rules.wordPoints;');
  L.push('');
  L.push('/* Pregunta: enunciado + 4 opciones + letra correcta + si es la del PDF */');
  L.push('function Q(q, a, b, c, d, key, oficial){ return { q:q, opts:[a, b, c, d], key:key, oficial:!!oficial }; }');
  L.push('DF.Q = Q;');
  L.push('');
  L.push('DF.levels = [');
  cases.forEach((c, i) => {
    L.push('  {');
    L.push('    n: ' + c.n + ',');
    L.push('    titulo: ' + JSON.stringify(c.titulo) + ',');
    L.push('    subtitulo: ' + JSON.stringify(c.subtitulo) + ',');
    L.push('    resumen: ' + JSON.stringify(c.resumen) + ',');
    L.push('    caso: {');
    L.push('      denuncia: ' + JSON.stringify(c.caso.denuncia) + ',');
    L.push('      testimonios: ' + JSON.stringify(c.caso.testimonios) + ',');
    L.push('      pruebas: ' + JSON.stringify(c.caso.pruebas) + ',');
    L.push('      devolucion: ' + JSON.stringify(c.caso.devolucion));
    L.push('    },');
    L.push('    pista: ' + JSON.stringify(c.pista) + ',');
    L.push('    palabras: ' + JSON.stringify(c.palabras) + ',');
    L.push('    preguntas: [');
    c.preguntas.forEach((q, j) => {
      /* la letra y el flag van fuera del map: JSON.stringify duplicaría las comillas
         de la clave ("A" -> "\"A\"") y volvería verdad a "false" */
      const args = [q.q].concat(q.opts).map(x => JSON.stringify(x));
      args.push(JSON.stringify(q.key), q.oficial ? 'true' : 'false');
      L.push('      ' + pad('', 0) + 'Q(' + args.join(', ') + ')' + (j < c.preguntas.length - 1 ? ',' : ''));
    });
    L.push('    ]');
    L.push('  }' + (i < cases.length - 1 ? ',' : ''));
  });
  L.push('];');
  L.push('');
  L.push('/* Palabras del desafío final, por nivel (para editar el contenido, usar este mapa) */');
  L.push('DF.palabras = DF.levels.map(l => ({ n:l.n, words:l.palabras, clue:l.pista }));');
  L.push('');
  L.push('/* Denuncia / testimonios / pruebas de cada nivel (las 3 carpetas del caso) */');
  L.push('DF.carpetas = DF.levels.map(l => ({ n:l.n, denuncia:l.caso.denuncia, testimonios:l.caso.testimonios, pruebas:l.caso.pruebas, devolucion:l.caso.devolucion }));');
  return L.join('\n') + '\n';
}

const cases = loadCases();
const errors = validate(cases);
if(errors.length){
  console.error('CONTENIDO INVÁLIDO:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, emit(cases), 'utf8');

/* Relectura del archivo generado: así un error de comillas o de tipo
   (clave "\"A\"", oficial "false" como texto) se detecta acá y no en el juego. */
(function checkGenerated(){
  /* el archivo usa "window.DF" y luego "DF" a secas: en Node funciona si window es el global */
  global.window = global;
  delete require.cache[require.resolve(OUT)];
  require(OUT);
  const bad = [];
  DF.levels.forEach((lv, i) => {
    lv.preguntas.forEach((q, j) => {
      if(!/^[A-D]$/.test(q.key)) bad.push('nivel ' + (i + 1) + ' pregunta ' + (j + 1) + ': key=' + JSON.stringify(q.key));
      if(typeof q.oficial !== 'boolean') bad.push('nivel ' + (i + 1) + ' pregunta ' + (j + 1) + ': oficial=' + JSON.stringify(q.oficial));
      if(q.opts.length !== 4 || q.opts.some(o => typeof o !== 'string' || !o)) bad.push('nivel ' + (i + 1) + ' pregunta ' + (j + 1) + ': opciones mal');
    });
    if(lv.palabras.length !== 3) bad.push('nivel ' + (i + 1) + ': palabras=' + JSON.stringify(lv.palabras));
  });
  if(bad.length){
    console.error('ARCHIVO GENERADO INVÁLIDO:');
    bad.slice(0, 10).forEach(b => console.error('  - ' + b));
    process.exit(1);
  }
})();

console.log('js/data/niveles.js generado: ' + cases.length + ' casos, ' +
  cases.reduce((a, c) => a + c.preguntas.length, 0) + ' preguntas, ' +
  (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
