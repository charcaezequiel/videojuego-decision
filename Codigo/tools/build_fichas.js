/* =========================================================
   build_fichas.js · genera las fichas imprimibles de los 10 casos
   a partir de js/data/niveles.js, o sea del texto que el juego
   efectivamente muestra. Si se cambia un caso, se cambia primero
   tools/content/casos-*.json, se corre `npm run content` y después
   `npm run fichas`.
   Uso: node tools/build_fichas.js
   ========================================================= */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const OUT = path.join(RAIZ, '..', 'Documentación', 'Casos para imprimir.md');

/* niveles.js se carga sin navegador, igual que en check_i18n.js */
function cargarNiveles(){
  const DF = {};
  const window = { DF };
  new Function('window', 'DF', fs.readFileSync(path.join(RAIZ, 'js', 'data', 'niveles.js'), 'utf8'))(window, DF);
  if(!DF.levels || !DF.levels.length) throw new Error('niveles.js no expuso DF.levels');
  return DF.levels;
}

/* el expediente se lee en papel: párrafos sueltos, sin markdown dentro del texto */
const parrafo = t => String(t).replace(/\s+/g, ' ').trim();

function ficha(l){
  const o = [];
  o.push('## Caso ' + l.n + ' · ' + parrafo(l.titulo));
  o.push('*' + parrafo(l.subtitulo) + '*');
  o.push('');
  o.push('**De qué se trata.** ' + parrafo(l.resumen));
  o.push('');
  o.push('### La denuncia');
  o.push('', parrafo(l.caso.denuncia), '');
  o.push('### Los testimonios del juicio');
  l.caso.testimonios.forEach(t => {
    o.push('**' + parrafo(t.autor) + '.** ' + parrafo(t.texto), '');
  });
  o.push('### Las pruebas que se presentan');
  l.caso.pruebas.forEach(p => {
    o.push('**' + parrafo(p.titulo) + '.** ' + parrafo(p.texto), '');
  });
  o.push('### Lo que enseña el caso');
  o.push('', parrafo(l.caso.devolucion), '');

  /* la pregunta oficial: es la del expediente y el juego la muestra primero,
     con las opciones en el mismo orden A-D del papel */
  const q = l.preguntas.find(x => x.oficial) || l.preguntas[0];
  o.push('### Pregunta oficial del expediente');
  o.push('', parrafo(q.q), '');
  q.opts.forEach((op, i) => {
    const letra = 'ABCD'[i];
    o.push((letra === q.key ? '- **' + letra + '.** ' : '- ' + letra + '. ') + parrafo(op));
  });
  o.push('', 'La respuesta correcta es la **' + q.key + '**.', '');
  o.push('**Palabras del desafío:** ' + l.palabras.join(' · '));
  o.push('**Pista del juego:** ' + parrafo(l.pista));
  o.push('');
  return o.join('\n');
}

const niveles = cargarNiveles();
const L = [];
L.push('# Casos para imprimir · DF · Decisión Final');
L.push('');
L.push('> **Generado: no editar a mano.** Este archivo sale de `js/data/niveles.js` con');
L.push('> `npm run fichas` (desde `Codigo/`), así que dice exactamente lo que muestra el');
L.push('> juego. Cualquier ficha impresa —la de papel que se reparte en el aula— tiene que');
L.push('> coincidir con esta versión. Si hay que cambiar un texto, se cambia en');
L.push('> `Codigo/tools/content/casos-*.json`, se corre `npm run content` y después otra vez');
L.push('> `npm run fichas`.');
L.push('');
L.push('Son los 10 casos del juego: el expediente completo (denuncia, testimonios, pruebas y');
L.push('devolución) más la **pregunta oficial**, que es la primera que se juega en cada nivel y');
L.push('conserva el orden de opciones A-D del papel. Las otras 9 preguntas de cada nivel se');
L.push('redactaron solo con los hechos del propio caso y se ven en el juego, no en la ficha.');
L.push('');
L.push('## Aviso legal de la versión impresa');
L.push('');
L.push('* **El derecho de peticionar a las autoridades está en el artículo 14** de la');
L.push('  Constitución Nacional. El **artículo 43 no es el derecho de petición**: es el');
L.push('  amparo, y sirve contra los actos **u omisiones** de la autoridad —entre ellas, el');
L.push('  silencio—, por eso en el caso 1 aparece nombrado recién al final, como el remedio');
L.push('  contra la falta de respuesta.');
L.push('* En los **casos 2, 3 y 4**, dentro del juego (no en esta ficha, que solo lleva la');
L.push('  pregunta oficial) hay opciones incorrectas que dicen "art. 43 = derecho de');
L.push('  petición". Están así a propósito: son falsas justamente por el error que se corrigió');
L.push('  en el caso 1. No "arreglarlas" —si se corrigen, esas preguntas quedan con dos');
L.push('  respuestas válidas.');
L.push('* El art. 43 sí aparece correctamente en el caso 7 (el amparo por los derechos de');
L.push('  incidencia colectiva, que es ambiental) y como opción descartada en el caso 8.');
L.push('');
L.push('---');
L.push('');
niveles.forEach(l => { L.push(ficha(l)); L.push('---'); L.push(''); });

fs.writeFileSync(OUT, L.join('\n'), 'utf8');
console.log('Casos para imprimir.md · ' + niveles.length + ' fichas · ' +
  (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB → ' + OUT);
