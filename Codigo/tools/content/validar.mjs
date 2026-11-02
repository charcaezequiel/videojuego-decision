// Validador de casos 1-5 de DF - Decision Final
// Uso: node tools/content/validar.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const dir = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(dir, "casos-1-5.json"), "utf8"));

const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const chars = (s) => [...s].length;

let errors = [];
const fail = (msg) => errors.push(msg);

// Secuencia de claves planeada al redactar cada caso (posicion de la opcion correcta)
const EXPECTED_KEYS = {
  1: ["A", "C", "B", "D", "C", "A", "D", "B", "C", "A"],
  2: ["B", "C", "A", "D", "D", "A", "B", "C", "D", "B"],
  3: ["C", "A", "B", "D", "A", "A", "B", "C", "C", "D"],
  4: ["C", "B", "C", "A", "D", "B", "A", "C", "B", "D"],
  5: ["B", "D", "C", "A", "D", "C", "B", "D", "B", "A"],
};

if (data.length !== 5) fail(`Se esperaban 5 casos, hay ${data.length}`);

for (const c of data) {
  const tag = `Caso ${c.n}`;
  if (chars(c.titulo) > 34) fail(`${tag}: titulo de ${chars(c.titulo)} chars`);
  if (/\.$/.test(c.titulo.trim())) fail(`${tag}: titulo termina en punto`);
  if (chars(c.subtitulo) > 60) fail(`${tag}: subtitulo de ${chars(c.subtitulo)} chars`);
  if (chars(c.pista) > 110) fail(`${tag}: pista de ${chars(c.pista)} chars`);

  const wDen = words(c.caso.denuncia);
  if (wDen < 120 || wDen > 190) fail(`${tag}: denuncia ${wDen} palabras (120-190)`);
  if (c.caso.testimonios.length !== 3) fail(`${tag}: ${c.caso.testimonios.length} testimonios`);
  c.caso.testimonios.forEach((t, i) => {
    const w = words(t.texto);
    if (w < 70 || w > 120) fail(`${tag} test.${i + 1}: ${w} palabras (70-120)`);
  });
  if (c.caso.pruebas.length !== 3) fail(`${tag}: ${c.caso.pruebas.length} pruebas`);
  c.caso.pruebas.forEach((p, i) => {
    const w = words(p.texto);
    if (w < 50 || w > 90) fail(`${tag} prue.${i + 1}: ${w} palabras (50-90)`);
  });
  const wDev = words(c.caso.devolucion);
  if (wDev < 80 || wDev > 140) fail(`${tag}: devolucion ${wDev} palabras (80-140)`);

  // palabras: mayusculas, sin tildes, 5-10 letras, formables con el texto del caso
  const body = [
    c.titulo, c.subtitulo, c.resumen, c.pista,
    c.caso.denuncia,
    ...c.caso.testimonios.map((t) => t.texto),
    ...c.caso.pruebas.map((p) => `${p.titulo} ${p.texto}`),
    c.caso.devolucion,
    ...c.preguntas.flatMap((q) => [q.q, ...q.opts]),
  ].join(" ");
  const tokens = new Set(norm(body).split(/[^A-Z0-9]+/));
  const letterPool = {};
  for (const ch of norm(body)) if (/[A-Z]/.test(ch)) letterPool[ch] = (letterPool[ch] || 0) + 1;
  for (const p of c.palabras) {
    if (!/^[A-Z]{5,10}$/.test(p)) fail(`${tag}: palabra "${p}" no cumple [A-Z] 5-10 letras`);
    if (!tokens.has(p)) fail(`${tag}: palabra "${p}" no aparece textualmente en el caso`);
    const need = {};
    for (const ch of p) need[ch] = (need[ch] || 0) + 1;
    for (const ch in need) if ((letterPool[ch] || 0) < need[ch]) fail(`${tag}: "${p}" no se forma con las letras del caso (falta ${ch})`);
  }

  // preguntas
  if (c.preguntas.length !== 10) fail(`${tag}: ${c.preguntas.length} preguntas`);
  const keys = [];
  c.preguntas.forEach((q, i) => {
    if (chars(q.q) > 190) fail(`${tag} P${i + 1}: enunciado de ${chars(q.q)} chars`);
    if (q.opts.length !== 4) fail(`${tag} P${i + 1}: ${q.opts.length} opciones`);
    if (!["A", "B", "C", "D"].includes(q.key)) fail(`${tag} P${i + 1}: key "${q.key}" fuera de A-D`);
    const official = (i === 0);
    if (!!q.oficial !== official) fail(`${tag} P${i + 1}: oficial=${q.oficial} (esperaba ${official})`);
    const expected = EXPECTED_KEYS[c.n][i];
    if (q.key !== expected) fail(`${tag} P${i + 1}: key ${q.key} no coincide con la planeada ${expected}`);
    keys.push(q.key);
  });
  // todas las letras usadas
  for (const L of ["A", "B", "C", "D"]) if (!keys.includes(L)) fail(`${tag}: no usa la clave ${L}`);
  // no mas de 2 seguidas iguales
  for (let i = 2; i < keys.length; i++)
    if (keys[i] === keys[i - 1] && keys[i] === keys[i - 2]) fail(`${tag}: 3 claves seguidas ${keys[i]} en P${i + 1}`);
}

if (errors.length) {
  console.log("ERRORES (" + errors.length + "):");
  errors.forEach((e) => console.log(" - " + e));
  process.exit(1);
} else {
  console.log("VALIDACION COMPLETA OK");
  console.log(data.map((c) => `Caso ${c.n} "${c.titulo}" keys: ${c.preguntas.map((q) => q.key).join("")}`).join("\n"));
}
