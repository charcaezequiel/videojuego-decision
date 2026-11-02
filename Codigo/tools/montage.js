/* tools/montage.js · junta capturas en una grilla para revisarlas de una vez
   node tools/montage.js 1 2   -> herramientas/out/montaje-1.png, -2.png      */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SHOTS = path.join(__dirname, 'out', 'shots');
const OUT = path.join(__dirname, 'out');
const COLS = 4, TILE_W = 480;

/* Cada montaje agrupa pantallas que se leen juntas */
const GRUPOS = [
  ['registro', 'portada', 'menu', 'config', 'vestir', 'manual', 'ranking', 'niveles'],
  ['nivel-titulo', 'nivel-desc', 'caso', 'caso-doc', 'juicio', 'desafio', 'palabra', 'resultado'],
  ['fin']
];

(async () => {
  const wanted = process.argv.slice(2).map(Number).filter(n => n >= 1);
  const grupos = wanted.length ? GRUPOS.filter((_, i) => wanted.includes(i + 1)) : GRUPOS;

  for (const [idx, nombres] of grupos.entries()) {
    const tiles = [];
    for (const nombre of nombres) {
      const file = path.join(SHOTS, nombre + '.png');
      if (!fs.existsSync(file)) continue;
      const img = sharp(file);
      const meta = await img.metadata();
      tiles.push({
        nombre,
        buf: await img.resize({ width: TILE_W }).png().toBuffer(),
        h: Math.round(meta.height * (TILE_W / meta.width))
      });
    }
    const filas = Math.ceil(tiles.length / COLS);
    const LABEL = 26, GAP = 8;
    const rowH = Array.from({ length: filas }, (_, r) =>
      Math.max(...tiles.slice(r * COLS, (r + 1) * COLS).map(t => t.h)) + LABEL + GAP);
    const H = rowH.reduce((a, b) => a + b, 0);
    const W = COLS * TILE_W + (COLS + 1) * GAP;
    const base = sharp({
      create: { width: W, height: H, channels: 3, background: '#1b0d16' }
    });
    const yBase = rowH.map((_, r) => rowH.slice(0, r).reduce((a, b) => a + b, 0));
    const overlays = [];
    tiles.forEach((t, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = GAP + col * (TILE_W + GAP);
      const y = yBase[row];
      overlays.push({
        input: Buffer.from(
          `<svg width="${TILE_W}" height="${LABEL}"><text x="4" y="18" ` +
          `font-family="monospace" font-size="15" fill="#e8d5b5">${t.nombre}</text></svg>`
        ),
        top: y, left: x
      });
      overlays.push({ input: t.buf, top: y + LABEL, left: x });
    });
    const out = path.join(OUT, `montaje-${idx + 1}.png`);
    await base.composite(overlays).jpeg({ quality: 88 }).toFile(out.replace('.png', '.jpg'));
    await base.composite(overlays).png().toFile(out);
    console.log(out);
  }
})();
