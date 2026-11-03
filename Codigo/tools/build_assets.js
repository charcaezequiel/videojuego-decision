/* =========================================================
   build_assets.js · Genera los PNG del juego desde pixel-art
   Salidas:
     assets/icons/  flecha · flecha-registro · jugar · config
                    perfil · ranking · manual · soporte
     assets/img/    logo.png · fondo.png · marcos.png
   Regenerar:  node tools/build_assets.js
   ========================================================= */
const fs = require('fs');
const path = require('path');
const { Canvas, PAL } = require('./pixel');

const ROOT = path.join(__dirname, '..');
const ICONS = path.join(ROOT, 'assets', 'icons');
const IMG = path.join(ROOT, 'assets', 'img');
for(const d of [ICONS, IMG]) fs.mkdirSync(d, { recursive: true });

/* ------------------------------------------------------------------ */
/* Piezas reutilizables                                                */
/* ------------------------------------------------------------------ */

/* Martillo de juez: cabeza horizontal con tapas, mango diagonal y bloque de golpe */
function gavelSprite(c, x, y, head, shaft, band){
  const h = head || PAL.brownMid, s = shaft || PAL.brownLite, b = band || PAL.gold;
  /* cabeza */
  c.rect(x + 2, y, 8, 3, h);
  c.rect(x, y, 2, 3, PAL.brown);            // tapa izquierda
  c.rect(x + 10, y, 2, 3, PAL.brown);       // tapa derecha
  c.rect(x + 2, y, 8, 1, PAL.brownLite);    // luz
  c.rect(x + 2, y + 2, 8, 1, PAL.brown);    // sombra
  /* mango diagonal hacia abajo a la izquierda */
  c.rect(x + 5, y + 3, 2, 1, s);
  c.rect(x + 4, y + 4, 2, 1, s);
  c.rect(x + 3, y + 5, 2, 1, s);
  c.rect(x + 2, y + 6, 2, 1, s);
  /* bloque donde golpea */
  c.rect(x + 6, y + 6, 6, 1, b);
  c.rect(x + 6, y + 7, 6, 1, PAL.brown);
  return c;
}

/* Balanza de la justicia (17x19) */
function scaleSprite(c, x, y, metal, dark){
  const m = metal || PAL.gold, d = dark || PAL.goldDark;
  c.rect(x + 8, y + 3, 1, 13, m);
  c.rect(x + 2, y + 3, 13, 1, m);
  c.rect(x + 6, y + 16, 5, 2, m);
  c.set(x + 8, y, m); c.set(x + 7, y + 1, m); c.set(x + 8, y + 1, m); c.set(x + 9, y + 1, m); c.set(x + 8, y + 2, m);
  for(const px of [x + 2, x + 14]){
    c.line(px, y + 4, px - 2, y + 9, d);
    c.line(px, y + 4, px + 2, y + 9, d);
    c.poly([[px - 3, y + 9], [px + 3, y + 9], [px + 2, y + 12], [px - 2, y + 12]], m);
    c.line(px - 3, y + 9, px + 3, y + 9, d);
  }
  return c;
}

/* Flecha gruesa apuntando a la derecha */
function arrowGlyph(c, x, y, face, edge){
  const f = face || PAL.cream, e = edge || PAL.ink;
  c.rect(x, y + 5, 11, 6, f);                 // caña
  c.poly([[x + 9, y], [x + 18, y + 8], [x + 9, y + 16]], f);   // punta
  /* contorno */
  const pts = [[x, y + 5], [x + 9, y + 5], [x + 9, y], [x + 18, y + 8], [x + 9, y + 16], [x + 9, y + 11], [x, y + 11]];
  for(let i = 0; i < pts.length; i++){
    const a = pts[i], b = pts[(i + 1) % pts.length];
    c.line(a[0], a[1], b[0], b[1], e);
  }
  return c;
}

/* Botón redondo de madera con aro dorado */
function roundButton(c, cx, cy, r, opts){
  opts = opts || {};
  const face = opts.face || PAL.wineDark;
  const rim = opts.rim || PAL.gold;
  const wood = opts.wood || PAL.brownSoft;
  c.disc(cx, cy, r, PAL.ink);
  c.disc(cx, cy, r - 1, wood);
  if(opts.doubleRim){
    c.ring(cx, cy, r - 2, rim, 2);
    c.ring(cx, cy, r - 5, rim, 1);
    c.disc(cx, cy, r - 7, face);
  } else {
    c.ring(cx, cy, r - 2, rim, 2);
    c.disc(cx, cy, r - 4, face);
  }
  /* brillo superior izquierdo */
  for(let i = 0; i < 4; i++) c.set(cx - r + 5 + i, cy - r + 6 + (i > 1 ? 1 : 0), PAL.creamSoft, 120);
  /* remaches */
  if(opts.rivets){
    for(const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){
      c.rect(cx + dx * (r - 3) - (dx < 0 ? 0 : 0), cy + dy * (r - 3), 1, 1, PAL.goldLite);
    }
  }
  return c;
}

/* Placa rectangular de tribunal: marco dorado sobre madera */
function plaque(c, x, y, w, h, opts){
  opts = opts || {};
  const field = opts.field || PAL.wineDark;
  c.rect(x, y, w, h, PAL.ink);
  c.bevel(x + 1, y + 1, w - 2, h - 2, opts.wood || PAL.brownSoft, PAL.brownLite, PAL.brown);
  c.rect(x + 3, y + 3, w - 6, h - 6, opts.rim || PAL.gold);
  c.rect(x + 4, y + 4, w - 8, h - 8, field);
  if(opts.innerFrame){
    c.frame(x + 6, y + 6, w - 12, h - 12, opts.rim || PAL.gold);
  }
  /* remaches en las esquinas */
  if(opts.rivets !== false){
    for(const [rx, ry] of [[x + 2, y + 2], [x + w - 3, y + 2], [x + 2, y + h - 3], [x + w - 3, y + h - 3]]){
      c.rect(rx, ry, 1, 1, PAL.goldLite);
    }
  }
  return c;
}

/* ------------------------------------------------------------------ */
/* 1 · FLECHA (botón volver/avanzar) — apunta a la derecha,            */
/*     css lo espeja con scaleX(-1) para la de volver                 */
/* ------------------------------------------------------------------ */
async function iconFlecha(){
  const c = new Canvas(40, 40);
  roundButton(c, 20, 20, 19, { rivets: true });
  arrowGlyph(c, 11, 12, PAL.cream, PAL.ink);
  return c.save(path.join(ICONS, 'flecha.png'), 6);
}

/* 1b · FLECHA DE REGISTRO — más ornamentada, dorada */
async function iconFlechaRegistro(){
  const c = new Canvas(40, 40);
  roundButton(c, 20, 20, 19, { doubleRim: true, face: PAL.deepWine, rim: PAL.gold, wood: PAL.brown, rivets: true });
  /* laurel mínimo a los costados */
  for(let i = 0; i < 4; i++){
    c.set(5, 14 + i * 3, PAL.goldDark); c.set(35 - 1, 14 + i * 3, PAL.goldDark);
  }
  arrowGlyph(c, 11, 12, PAL.gold, PAL.brown);
  c.rect(13, 17, 7, 1, PAL.goldLite);       // brillo de la caña
  return c.save(path.join(ICONS, 'flecha-registro.png'), 6);
}

/* ------------------------------------------------------------------ */
/* 2 · JUGAR — placa con martillo y triángulo de play                 */
/* ------------------------------------------------------------------ */
async function iconJugar(){
  const c = new Canvas(64, 40);
  plaque(c, 0, 0, 64, 40, { innerFrame: true });
  gavelSprite(c, 12, 10);
  /* triángulo de play */
  c.poly([[40, 10], [40, 30], [56, 20]], PAL.cream);
  c.stroke([[40, 10], [40, 30], [56, 20]], PAL.ink);
  c.poly([[42, 14], [42, 26], [52, 20]], PAL.goldLite);
  return c.save(path.join(ICONS, 'jugar.png'), 6);
}

/* ------------------------------------------------------------------ */
/* 3 · CONFIG — engranaje de madera y latón con martillo adentro      */
/* ------------------------------------------------------------------ */
async function iconConfig(){
  const c = new Canvas(40, 40);
  const cx = 20, cy = 20;
  /* 8 dientes */
  for(let i = 0; i < 8; i++){
    const a = i * Math.PI / 4;
    const dx = Math.round(Math.cos(a) * 16), dy = Math.round(Math.sin(a) * 16);
    c.rect(cx + dx - 2, cy + dy - 2, 5, 5, PAL.brownMid);
    c.frame(cx + dx - 2, cy + dy - 2, 5, 5, PAL.ink);
  }
  c.disc(cx, cy, 13, PAL.ink);
  c.disc(cx, cy, 12, PAL.gold);
  c.disc(cx, cy, 10, PAL.brownSoft);
  c.ring(cx, cy, 11, PAL.goldLite, 1);
  c.disc(cx, cy, 5, PAL.deepWine);
  /* mini martillo en el centro */
  c.rect(cx - 3, cy - 3, 6, 2, PAL.gold);
  c.rect(cx - 4, cy - 3, 1, 2, PAL.goldDark);
  c.rect(cx + 3, cy - 3, 1, 2, PAL.goldDark);
  c.rect(cx - 1, cy - 1, 1, 3, PAL.goldLite);
  c.rect(cx - 2, cy + 2, 4, 1, PAL.cream);
  return c.save(path.join(ICONS, 'config.png'), 6);
}

/* ------------------------------------------------------------------ */
/* 4 · PERFIL — retrato oficial en marco ovalado                      */
/* ------------------------------------------------------------------ */
async function iconPerfil(){
  const c = new Canvas(44, 44);
  c.disc(22, 22, 21, PAL.ink);
  c.disc(22, 22, 20, PAL.gold);
  c.disc(22, 22, 18, PAL.brownSoft);
  c.disc(22, 22, 16, PAL.wineDark);
  /* busto silhouette */
  c.disc(22, 17, 6, PAL.creamDim);                 // cabeza
  c.rect(19, 17, 6, 5, PAL.creamDim);
  c.poly([[11, 36], [33, 36], [29, 24], [15, 24]], PAL.creamDim);   // hombros
  c.rect(20, 26, 4, 8, PAL.wine);                  // cuello/solapa
  /* base del marco */
  c.rect(14, 40, 16, 2, PAL.goldDark);
  return c.save(path.join(ICONS, 'perfil.png'), 6);
}

/* ------------------------------------------------------------------ */
/* 5 · RANKING — trofeo con balanza grabada                           */
/* ------------------------------------------------------------------ */
async function iconRanking(){
  const c = new Canvas(64, 40);
  plaque(c, 0, 0, 64, 40, { field: PAL.wine });
  const cx = 32;
  /* copa */
  c.poly([[cx - 9, 8], [cx + 9, 8], [cx + 6, 22], [cx - 6, 22]], PAL.gold);
  c.poly([[cx - 7, 10], [cx + 7, 10], [cx + 4, 20], [cx - 4, 20]], PAL.goldLite);
  c.stroke([[cx - 9, 8], [cx + 9, 8], [cx + 6, 22], [cx - 6, 22]], PAL.ink);
  /* asas */
  c.ring(cx - 12, 14, 4, PAL.goldDark, 2);
  c.ring(cx + 12, 14, 4, PAL.goldDark, 2);
  /* pie */
  c.rect(cx - 2, 22, 5, 4, PAL.goldDark);
  c.rect(cx - 7, 26, 15, 3, PAL.gold);
  c.frame(cx - 7, 26, 15, 3, PAL.ink);
  /* balanza grabada */
  c.rect(cx - 1, 12, 1, 6, PAL.brown);
  c.rect(cx - 4, 13, 8, 1, PAL.brown);
  /* estrellitas */
  for(const sx of [12, 52]) for(const sy of [10, 14]){
    c.set(sx, sy, PAL.cream); c.set(sx - 1, sy + 2, PAL.cream); c.set(sx + 1, sy + 2, PAL.cream);
  }
  return c.save(path.join(ICONS, 'ranking.png'), 6);
}

/* ------------------------------------------------------------------ */
/* 6 · MANUAL — libro abierto con martillo encima                     */
/* ------------------------------------------------------------------ */
async function iconManual(){
  const c = new Canvas(64, 40);
  plaque(c, 0, 0, 64, 40, { field: PAL.deepWine });
  const cx = 32;
  /* tapas */
  c.poly([[cx - 20, 12], [cx, 16], [cx, 32], [cx - 20, 28]], PAL.redDark);
  c.poly([[cx + 20, 12], [cx, 16], [cx, 32], [cx + 20, 28]], PAL.redDark);
  /* páginas */
  c.poly([[cx - 18, 11], [cx, 15], [cx, 30], [cx - 18, 26]], PAL.cream);
  c.poly([[cx + 18, 11], [cx, 15], [cx, 30], [cx + 18, 26]], PAL.creamField);
  /* renglones */
  for(let i = 0; i < 3; i++){
    c.line(cx - 15, 16 + i * 3, cx - 3, 18 + i * 3, PAL.grayDark);
    c.line(cx + 15, 16 + i * 3, cx + 3, 18 + i * 3, PAL.grayDark);
  }
  /* cinta dorada */
  c.rect(cx + 8, 15, 2, 14, PAL.gold);
  c.poly([[cx + 8, 29], [cx + 10, 29], [cx + 9, 33]], PAL.goldDark);
  /* mart apoyado */
  gavelSprite(c, cx - 6, 4, PAL.brownMid, PAL.brownLite, PAL.gold);
  return c.save(path.join(ICONS, 'manual.png'), 6);
}

/* ------------------------------------------------------------------ */
/* 7 · SOPORTE — salvavidas con auriculares                           */
/* ------------------------------------------------------------------ */
async function iconSoporte(){
  const c = new Canvas(40, 40);
  c.disc(20, 21, 15, PAL.ink);
  c.disc(20, 21, 14, PAL.red);
  c.disc(20, 21, 7, PAL.wineDark);
  /* franjas crema */
  for(const a of [0, 90, 180, 270]){
    const rad = a * Math.PI / 180;
    for(let t = 8; t <= 13; t++){
      c.set(Math.round(20 + Math.cos(rad) * t), Math.round(21 + Math.sin(rad) * t), PAL.cream);
      c.set(Math.round(20 + Math.cos(rad) * t) + 1, Math.round(21 + Math.sin(rad) * t), PAL.cream);
    }
  }
  c.ring(20, 21, 14, PAL.redDark, 1);
  /* auriculares */
  c.line(7, 14, 9, 8, PAL.gold);
  c.line(33, 14, 31, 8, PAL.gold);
  c.line(9, 8, 31, 8, PAL.goldLite);
  c.rect(5, 13, 4, 7, PAL.creamDim);
  c.rect(31, 13, 4, 7, PAL.creamDim);
  c.frame(5, 13, 4, 7, PAL.ink); c.frame(31, 13, 4, 7, PAL.ink);
  return c.save(path.join(ICONS, 'soporte.png'), 6);
}

/* ------------------------------------------------------------------ */
/* 8 · LOGO — escudo con balanza y las letras DF                      */
/* ------------------------------------------------------------------ */
const FONT = {
  D: ['XXXX.', 'X..X.', 'X...X', 'X...X', 'X...X', 'X..X.', 'XXXX.'],
  F: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'X....']
};
function pixelText(c, text, x, y, scale, color){
  let cx = x;
  for(const ch of text){
    const g = FONT[ch];
    if(g){
      for(let j = 0; j < g.length; j++) for(let i = 0; i < g[j].length; i++){
        if(g[j][i] === 'X') c.rect(cx + i * scale, y + j * scale, scale, scale, color);
      }
      cx += (g[0].length + 1) * scale;
    } else cx += 3 * scale;
  }
  return cx;
}

async function imgLogo(){
  const S = 6, c = new Canvas(96 * 1, 96 * 1);
  /* campo vino a sangre completa (lo usa la portada como tarjeta) */
  c.fill(PAL.wine);
  const cx = 48, cy = 44;
  /* escudo */
  c.poly([[cx - 30, cy - 32], [cx + 30, cy - 32], [cx + 30, cy + 8], [cx, cy + 30], [cx - 30, cy + 8]], PAL.wineDark);
  c.stroke([[cx - 30, cy - 32], [cx + 30, cy - 32], [cx + 30, cy + 8], [cx, cy + 30], [cx - 30, cy + 8]], PAL.gold);
  c.poly([[cx - 26, cy - 28], [cx + 26, cy - 28], [cx + 26, cy + 7], [cx, cy + 26], [cx - 26, cy + 7]], PAL.deepWine);
  c.stroke([[cx - 26, cy - 28], [cx + 26, cy - 28], [cx + 26, cy + 7], [cx, cy + 26], [cx - 26, cy + 7]], PAL.goldDark);
  /* balanza */
  scaleSprite(c, cx - 8, cy - 24, PAL.gold, PAL.goldDark);
  /* laurel: dos ramas curvas abrazando el escudo */
  for(const side of [-1, 1]){
    for(let i = 0; i < 9; i++){
      const t = i / 8;
      const lx = Math.round(cx + side * (33 - 6 * t * t));
      const ly = Math.round(cy - 22 + t * 42);
      c.rect(lx, ly, 1, 2, PAL.greenDark);                 // tallo
      /* hoja hacia afuera */
      const leafX = side > 0 ? lx + 1 : lx - 4;
      c.rect(leafX, ly - 1, 4, 2, PAL.green);
      c.rect(leafX, ly - 1, 4, 1, PAL.greenDark);
    }
  }
  /* cinta DF */
  c.rect(cx - 22, cy + 32, 44, 18, PAL.brown);
  c.frame(cx - 22, cy + 32, 44, 18, PAL.gold);
  c.rect(cx - 21, cy + 33, 42, 1, PAL.goldLite);
  pixelText(c, 'DF', cx - 11, cy + 34, 2, PAL.cream);
  return c.save(path.join(IMG, 'logo.png'), S);
}

/* ------------------------------------------------------------------ */
/* 9 · FONDO — tile 1306x720 con martillos, sin cortes visibles       */
/* ------------------------------------------------------------------ */
async function imgFondo(){
  const W = 1306, H = 720;
  const c = new Canvas(W, H);
  c.fill(PAL.wine);
  /* trama ordenada muy sutil para que no sea un plano muerto */
  for(let y = 0; y < H; y += 2) for(let x = (y % 4 === 0 ? 0 : 1); x < W; x += 4) c.set(x, y, PAL.wineDark);

  /* el martillo del fondo apenas se nota: es textura, no decoración */
  const FAINT = '#562a41';
  const gavel = (cv, x, y, rot) => {
    const t = new Canvas(13, 9);
    t.rect(1, 0, 9, 4, FAINT);
    t.rect(5, 4, 2, 4, FAINT);
    t.rect(3, 8, 6, 1, FAINT);
    for(let j = 0; j < t.h; j++) for(let i = 0; i < t.w; i++){
      if(!t.get(i, j)) continue;
      let px = i, py = j;
      if(rot === 1){ px = j; py = t.w - 1 - i; }
      else if(rot === 2){ px = t.w - 1 - i; py = t.h - 1 - j; }
      else if(rot === 3){ px = t.h - 1 - j; py = i; }
      cv.set(x + px, y + py, FAINT);
    }
  };

  /* grilla diagonal: cada celda lleva un martillo con rotación variante */
  const stepX = 132, stepY = 104;
  let k = 0;
  for(let row = 0; row * stepY < H + stepY; row++){
    const offset = (row % 2) * (stepX / 2);
    for(let col = -1; col * stepX + offset < W + stepX; col++){
      const x = col * stepX + offset + ((row * 17) % 11) - 5;
      const y = row * stepY + ((col * 13) % 9) - 4;
      gavel(c, x, y, (k++) % 4);
    }
  }
  return c.save(path.join(IMG, 'fondo.png'), 1);
}

/* ------------------------------------------------------------------ */
/* 10 · MARCOS — set decorativo (marco de texto / caja de diálogo)    */
/* ------------------------------------------------------------------ */
async function imgMarcos(){
  /* marco de documento: madera + oro, hueco en el centro para usarlo de 9-slice.
     96 px de lienzo × 2 = 192 px; en CSS se corta con border-image-slice:16. */
  const m = new Canvas(96, 96);
  m.rect(0, 0, 96, 96, PAL.brown);
  m.frame(0, 0, 96, 96, PAL.ink);
  m.rect(3, 3, 90, 90, PAL.gold);
  m.rect(5, 5, 86, 86, PAL.creamField);
  m.rect(5, 5, 86, 1, PAL.cream);
  m.clear(8, 8, 80, 80);
  for(const [x, y] of [[2, 2], [93, 2], [2, 93], [93, 93]]) m.rect(x, y, 1, 1, PAL.goldLite);
  await m.save(path.join(IMG, 'marco-doc.png'), 2);

  /* caja de diálogo: marco de madera + interior vino, pensada como 9-slice
     (sin cola: la cola la dibuja el CSS, así el borde escala sin deformarse) */
  const s = new Canvas(160, 40);
  s.rect(0, 0, 160, 40, PAL.brown);
  s.frame(0, 0, 160, 40, PAL.ink);
  s.rect(2, 2, 156, 36, PAL.gold);
  s.rect(4, 4, 152, 32, PAL.wineDark);
  for(const [x, y] of [[1, 1], [158, 1], [1, 38], [158, 38]]) s.rect(x, y, 1, 1, PAL.goldLite);
  await s.save(path.join(IMG, 'speech-box.png'), 2);

  /* sello de lacre: adorno del pie de documento */
  const w = new Canvas(28, 28);
  w.disc(14, 14, 13, PAL.redDark);
  w.disc(14, 14, 11, PAL.red);
  w.ring(14, 14, 9, PAL.redDark, 1);
  w.rect(9, 12, 10, 1, PAL.cream);
  w.rect(13, 8, 2, 10, PAL.cream);
  w.rect(10, 18, 8, 1, PAL.cream);
  await w.save(path.join(IMG, 'sello.png'), 3);
  return [m, s, w];
}

/* ------------------------------------------------------------------ */
/* 11 · CARPETAS — iconos de las 3 carpetas del caso                  */
/* ------------------------------------------------------------------ */
async function imgCarpetas(){
  const defs = [
    ['folder-denuncia', PAL.red, PAL.redDark, 'sobre'],
    ['folder-testimonios', PAL.green, PAL.greenDark, 'pluma'],
    ['folder-pruebas', PAL.yellow, PAL.goldDark, 'lupa']
  ];
  const out = [];
  for(const [name, spine, dark, seal] of defs){
    const c = new Canvas(56, 44);
    /* cuerpo */
    c.rect(2, 8, 52, 34, PAL.brown);
    c.rect(3, 9, 50, 32, spine);
    c.rect(3, 9, 50, 2, PAL.goldLite, 90);
    /* solapa */
    c.rect(6, 3, 22, 6, dark);
    c.rect(6, 3, 22, 1, spine);
    /* etiqueta */
    c.rect(10, 16, 36, 18, PAL.creamField);
    c.frame(10, 16, 36, 18, dark);
    c.rect(13, 20, 26, 1, PAL.grayDark);
    c.rect(13, 23, 30, 1, PAL.grayDark);
    c.rect(13, 26, 20, 1, PAL.grayDark);
    /* sello con emblema */
    c.disc(42, 30, 6, dark);
    c.disc(42, 30, 5, PAL.cream);
    if(seal === 'sobre'){
      c.rect(38, 28, 8, 5, dark);
      c.line(38, 28, 42, 31, PAL.cream); c.line(46, 28, 42, 31, PAL.cream);
    } else if(seal === 'pluma'){
      c.line(39, 34, 45, 26, dark);
      c.rect(44, 25, 2, 2, dark);
    } else {
      c.ring(41, 29, 3, dark, 1);
      c.line(43, 32, 46, 34, dark);
    }
    c.frame(2, 8, 52, 34, PAL.ink);
    out.push(await c.save(path.join(IMG, name + '.png'), 6));
  }
  return out;
}

/* ------------------------------------------------------------------ */
(async function main(){
  const jobs = [
    ['icons/flecha.png', iconFlecha],
    ['icons/flecha-registro.png', iconFlechaRegistro],
    ['icons/jugar.png', iconJugar],
    ['icons/config.png', iconConfig],
    ['icons/perfil.png', iconPerfil],
    ['icons/ranking.png', iconRanking],
    ['icons/manual.png', iconManual],
    ['icons/soporte.png', iconSoporte],
    ['img/logo.png', imgLogo],
    ['img/fondo.png', imgFondo],
    ['img/marco-doc · speech-box · sello', imgMarcos],
    ['img/folder-*.png', imgCarpetas]
  ];
  for(const [label, fn] of jobs){
    const t0 = Date.now();
    await fn();
    console.log('  ok  ' + label.padEnd(26) + (Date.now() - t0) + 'ms');
  }
  console.log('\nAssets generados en assets/icons y assets/img');
})();
