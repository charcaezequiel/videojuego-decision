/* =========================================================
   pixel.js · Motor mínimo de pixel-art (RGBA sin suavizado)
   Se dibuja a baja resolución y se amplía con vecino más cercano,
   así los bordes quedan duros de verdad (nada de anti-aliasing).
   ========================================================= */
const sharp = require('sharp');

const PAL = {
  wine:      '#5f2d47',
  wineDark:  '#4a1f37',
  deepWine:  '#3c1525',
  cream:     '#fbebd3',
  creamField:'#fbeeda',
  creamDim:  '#e9d2a2',
  creamSoft: '#f0dcb0',
  brown:     '#3a1a07',
  brownSoft: '#5a2c12',
  brownMid:  '#6b3a1f',
  brownLite: '#8c5330',
  ink:       '#1e0f08',
  gold:      '#e0b070',
  goldDark:  '#c89a5a',
  goldLite:  '#f6d8a0',
  yellow:    '#c9a24a',
  green:     '#4f8a56',
  greenDark: '#3f6e3a',
  red:       '#b23b3b',
  redDark:   '#6d1f30',
  gray:      '#8a7a80',
  grayDark:  '#5a4a52',
  white:     '#ffffff',
  black:     '#0d0705',
  skin:      '#f2c9a0',
  skinShade: '#d9a47c',
  hair:      '#6b3a1f',
  hairLite:  '#8c5330',
  denim:     '#2b2b31',
  denimLite: '#3d3d45'
};

function parse(hex){
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255];
}

class Canvas{
  constructor(w, h){
    this.w = w; this.h = h;
    this.data = Buffer.alloc(w * h * 4);      // todo transparente al empezar
  }

  get(x, y){
    if(x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.data[(y * this.w + x) * 4 + 3] > 0;
  }

  set(x, y, color, alpha){
    x |= 0; y |= 0;
    if(x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    const c = typeof color === 'string' ? parse(color) : color;
    const i = (y * this.w + x) * 4;
    const a = alpha === undefined ? 255 : alpha;
    if(a >= 255){
      this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = 255;
    } else {
      const t = a / 255;
      if(this.data[i + 3] === 0){
        this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = a;
      } else {
        this.data[i] = Math.round(this.data[i] * (1 - t) + c[0] * t);
        this.data[i + 1] = Math.round(this.data[i + 1] * (1 - t) + c[1] * t);
        this.data[i + 2] = Math.round(this.data[i + 2] * (1 - t) + c[2] * t);
        this.data[i + 3] = Math.max(this.data[i + 3], a);
      }
    }
    return this;
  }

  color(name){ return PAL[name] || name; }

  rect(x, y, w, h, color, alpha){
    const c = this.color(color);
    for(let j = y; j < y + h; j++) for(let i = x; i < x + w; i++) this.set(i, j, c, alpha);
    return this;
  }

  /* Borde de 1 píxel */
  frame(x, y, w, h, color){
    const c = this.color(color);
    for(let i = x; i < x + w; i++){ this.set(i, y, c); this.set(i, y + h - 1, c); }
    for(let j = y; j < y + h; j++){ this.set(x, j, c); this.set(x + w - 1, j, c); }
    return this;
  }

  /* Marco biselado: luz arriba/izquierda, sombra abajo/derecha (botón retro) */
  bevel(x, y, w, h, base, hi, lo){
    this.rect(x, y, w, h, base);
    for(let i = x; i < x + w - 1; i++) this.set(i, y, hi);
    for(let j = y; j < y + h - 1; j++) this.set(x, j, hi);
    for(let i = x + 1; i < x + w; i++) this.set(i, y + h - 1, lo);
    for(let j = y + 1; j < y + h; j++) this.set(x + w - 1, j, lo);
    return this;
  }

  fill(color){ return this.rect(0, 0, this.w, this.h, color); }

  /* deja transparente un rectángulo: hace el hueco central de los marcos 9-slice */
  clear(x, y, w, h){
    for(let j = y; j < y + h; j++) for(let i = x; i < x + w; i++){
      if(i < 0 || j < 0 || i >= this.w || j >= this.h) continue;
      this.data[(j * this.w + i) * 4 + 3] = 0;
    }
    return this;
  }

  line(x0, y0, x1, y1, color){
    const c = this.color(color);
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for(;;){
      this.set(x0, y0, c);
      if(x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if(e2 > -dy){ err -= dy; x0 += sx; }
      if(e2 < dx){ err += dx; y0 += sy; }
    }
    return this;
  }

  /* Círculo/relleno por ecuación de punto medio */
  disc(cx, cy, r, color){
    const c = this.color(color);
    for(let j = -r; j <= r; j++) for(let i = -r; i <= r; i++){
      if(i * i + j * j <= r * r + r * 0.4) this.set(cx + i, cy + j, c);
    }
    return this;
  }

  ring(cx, cy, r, color, thickness){
    const c = this.color(color), t = thickness || 1, ri = (r - t) * (r - t);
    for(let j = -r; j <= r; j++) for(let i = -r; i <= r; i++){
      const d = i * i + j * j;
      if(d <= r * r + r * 0.4 && d >= ri) this.set(cx + i, cy + j, c);
    }
    return this;
  }

  /* Relleno de polígono por scanline */
  poly(points, color){
    const c = this.color(color);
    let minY = Infinity, maxY = -Infinity;
    points.forEach(p => { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    for(let y = Math.ceil(minY); y <= Math.floor(maxY); y++){
      const xs = [];
      for(let k = 0; k < points.length; k++){
        const a = points[k], b = points[(k + 1) % points.length];
        if((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)){
          xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
        }
      }
      xs.sort((p, q) => p - q);
      for(let k = 0; k + 1 < xs.length; k += 2){
        for(let x = Math.round(xs[k]); x <= Math.round(xs[k + 1]); x++) this.set(x, y, c);
      }
    }
    return this;
  }

  /* Contorno de un polígono */
  stroke(points, color){
    const c = this.color(color);
    for(let k = 0; k < points.length; k++) this.line(points[k][0], points[k][1], points[(k + 1) % points.length][0], points[(k + 1) % points.length][1], c);
    return this;
  }

  /* Dither 50% entre dos colores (trama ordenada) */
  dither(x, y, w, h, a, b, pattern){
    const ca = this.color(a), cb = this.color(b);
    const p = pattern || 2;
    for(let j = 0; j < h; j++) for(let i = 0; i < w; i++){
      this.set(x + i, y + j, ((i + j) % p === 0) ? ca : cb);
    }
    return this;
  }

  /* Sprite desde filas de texto: '.' = transparente, demás = mapa de colores */
  sprite(rows, map, ox, oy){
    rows.forEach((row, j) => {
      for(let i = 0; i < row.length; i++){
        const ch = row[i];
        if(ch === '.' || ch === ' ') continue;
        const col = map[ch];
        if(col) this.set(ox + i, oy + j, this.color(col));
      }
    });
    return this;
  }

  /* Contorno exterior de 1px alrededor de lo ya pintado */
  outline(color){
    const c = this.color(color);
    const snapshot = Buffer.from(this.data);
    const opaqueAt = (x, y) => x >= 0 && y >= 0 && x < this.w && y < this.h && snapshot[(y * this.w + x) * 4 + 3] > 0;
    for(let y = 0; y < this.h; y++) for(let x = 0; x < this.w; x++){
      if(opaqueAt(x, y)) continue;
      if(opaqueAt(x - 1, y) || opaqueAt(x + 1, y) || opaqueAt(x, y - 1) || opaqueAt(x, y + 1)){
        this.set(x, y, c);
      }
    }
    return this;
  }

  /* Sello que envuelve en los bordes (para patrones tileables) */
  stamp(draw, x, y){
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
      draw(this, x + dx * this.w, y + dy * this.h);
    }
    return this;
  }

  async save(path, scale){
    const s = scale || 1;
    let img = sharp(this.data, { raw: { width: this.w, height: this.h, channels: 4 } });
    if(s !== 1) img = img.resize(this.w * s, this.h * s, { kernel: 'nearest' });
    await img.png().toFile(path);
    return { path, width: this.w * s, height: this.h * s };
  }
}

module.exports = { Canvas, PAL, parse };
