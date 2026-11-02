/* =========================================================
   preview_avatars.js · Hoja de contacto PNG de los avatares
   Renderiza el SVG de js/data/vestuario.js con sharp, para ver
   el pixel-art con los ojos y no a ciegas.
   Uso:  node tools/preview_avatars.js   -> tools/out/avatares.png
   ========================================================= */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

global.window = {};
require(path.join(__dirname, '..', 'js', 'data', 'vestuario.js'));
const V = global.window.DF.vestuario;

const SKINS = {
  clara:['#f6d8bd','#ddb08c'], media:['#f2c9a0','#d9a47c'], trigo:['#d6a072','#b47f54'],
  oscura:['#a8704a','#86553a'], ebano:['#704530','#553222']
};

function rectsFor(parts, skin, shade){
  let out = '';
  parts.slice().sort((a, b) => a.z - b.z).forEach(p => {
    p.rows.forEach((row, j) => {
      let i = 0;
      while(i < row.length){
        const ch = row[i];
        if(ch === '.'){ i++; continue; }
        let k = i; while(k < row.length && row[k] === ch) k++;
        const fill = ch === 'S' ? skin : ch === 's' ? shade : V.pal[ch];
        if(!fill) throw new Error('color desconocido "' + ch + '" en ' + (p.tag || '?'));
        out += '<rect x="' + (p.x + i) + '" y="' + (p.y + j) + '" width="' + (k - i) + '" height="1" fill="' + fill + '"/>';
        i = k;
      }
    });
  });
  return out;
}

const cat = k => V.categories.find(c => c.key === k);
const itemOf = (c, k) => (cat(c).items || []).find(i => i.key === k);

/* cuerpo + las prendas que se pasen */
function figure(wear, skinKey){
  const [S, s] = SKINS[skinKey];
  let parts = V.body.slice();
  Object.keys(wear).forEach(c => {
    const it = itemOf(c, wear[c]);
    if(it) parts = parts.concat(it.parts);
  });
  return rectsFor(parts, S, s);
}

function bbox(parts){
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  parts.forEach(p => {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x + p.rows[0].length); y1 = Math.max(y1, p.y + p.rows.length);
  });
  return [x0, y0, x1 - x0, y1 - y0];
}

const SCALE = 5, CELL_W = V.size[0] * SCALE + 24, CELL_H = (V.size[1] + 6) * SCALE + 34;

function tile(x, y, inner, label){
  const boxH = CELL_H - 34;
  const innerW = V.size[0] * SCALE;
  return '<g transform="translate(' + x + ',' + y + ')">' +
    '<rect x="6" y="6" width="' + (CELL_W - 12) + '" height="' + boxH + '" rx="8" fill="#fbeeda"/>' +
    '<g transform="translate(' + (6 + (CELL_W - 12 - innerW) / 2) + ',12) scale(' + SCALE + ')">' + inner + '</g>' +
    '<text x="' + (CELL_W / 2) + '" y="' + (CELL_H - 10) + '" font-family="monospace" font-size="15" fill="#fbebd3" text-anchor="middle">' + label + '</text>' +
    '</g>';
}

/* ---------- 5 tonos de piel, con el avatar por defecto ---------- */
const out = [];
Object.keys(SKINS).forEach(k => {
  out.push({ label:'piel ' + k, inner:figure({ pelo:'largo', varios:'cadena' }, k) });
});
/* ---------- muestra de outfits ---------- */
const OUTFITS = [
  { pelo:'corto',   gorros:'gorra',    gafas:'pasta',    mano:'martillo',         skin:'media' },
  { pelo:'coleta',  collares:'fino',   bolsos:'mochila',  mascotas:'perro',        skin:'clara' },
  { pelo:'rizado',  barbijos:'negro',  pins:'balanza',    auriculares:'gamer',     skin:'trigo' },
  { pelo:'trenzas', bufandas:'capa',   varios:'reloj',    gorros:'sombrero',       skin:'oscura' },
  { pelo:'largo',   gafas:'aviador',    bolsos:'cartera',  mascotas:'loro',        skin:'ebano' }
];
OUTFITS.forEach((o, i) => {
  const wear = Object.assign({}, o); delete wear.skin;
  out.push({ label:'look ' + (i + 1), inner:figure(wear, o.skin) });
});
/* ---------- juez y fiscal ---------- */
out.push({ label:'juez', inner:rectsFor(V.judge.parts, SKINS.media[0], SKINS.media[1]) });
out.push({ label:'fiscal', inner:rectsFor(V.prosecutor.parts, SKINS.media[0], SKINS.media[1]) });
/* ---------- cada prenda sola ---------- */
V.categories.forEach(c => c.items.forEach(it => {
  out.push({ label:c.key + '/' + it.key + ' L' + it.lvl, inner:rectsFor(it.parts, SKINS.media[0], SKINS.media[1]) });
}));

const COLS = 8, ROWS = Math.ceil(out.length / COLS);
const W = COLS * CELL_W, H = ROWS * CELL_H;
let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" shape-rendering="crispEdges">' +
  '<rect width="100%" height="100%" fill="#4a1f37"/>';
out.forEach((t, i) => { svg += tile((i % COLS) * CELL_W, Math.floor(i / COLS) * CELL_H, t.inner, t.label); });
svg += '</svg>';

const dir = path.join(__dirname, 'out');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'avatares.svg'), svg);
sharp(Buffer.from(svg), { density: 96 }).png().toFile(path.join(dir, 'avatares.png'))
  .then(() => console.log('tools/out/avatares.png · ' + W + 'x' + H + ' · ' + out.length + ' celdas'))
  .catch(e => { console.error(e.message); process.exit(1); });
