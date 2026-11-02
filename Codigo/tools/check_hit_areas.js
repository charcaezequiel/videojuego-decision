/* =========================================================
   check_hit_areas.js · Área sensible de los botones-icono
   El .img-btn es un cuadro grande; lo que se toca es el dibujo.
   El CSS recorta esa zona con --hit-l / --hit-t / --hit-w / --hit-h
   y --hit-r (50% = elipse para los íconos redondos, 0 = la placa entera).

   Este tool mide el arte real de cada PNG:
     · si las 4 esquinas del archivo están pintadas  → es una placa rectangular
     · si no                                        → es un ícono redondo
   y calcula la elipse (o el rectángulo) centrada más grande que queda
   enteramente sobre píxeles pintados. Así no quedan zonas invisibles
   que responden al toque ni partes visibles que no responden.

     node tools/check_hit_areas.js          comparar
     node tools/check_hit_areas.js --fix    reescribir components.css
   ========================================================= */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const CSS = path.join(ROOT, 'css', 'components.css');

/* clase del CSS -> archivo del icono (las mismas rutas que usan las pantallas) */
const MAP = [
  ['.btn-back, .btn-next', 'assets/icons/flecha.png'],
  ['.menu-play', 'assets/icons/jugar.png'],
  ['.menu-manual', 'assets/icons/manual.png'],
  ['.menu-perfil', 'assets/icons/perfil.png'],
  ['.menu-config', 'assets/icons/config.png'],
  ['.menu-ranking', 'assets/icons/ranking.png']
];

const pct = v => (Math.round(v * 1000) / 10).toFixed(1);

async function artBox(file){
  const { data, info } = await sharp(path.join(ROOT, file)).raw().toBuffer({ resolveWithObject:true });
  const { width:w, height:h, channels:c } = info;
  const op = (x, y) => data[(y * w + x) * c + (c - 1)] > 24;
  const cx = w >> 1, cy = h >> 1;
  if(!op(cx, cy)) return null;
  const rectangular = op(1, 1) && op(w - 2, 1) && op(1, h - 2) && op(w - 2, h - 2);

  /* mitad del ancho pintado alrededor del centro, en cada fila */
  const half = [];
  for(let y = 0; y < h; y++){
    let l = cx, r = cx;
    while(l > 0 && op(l - 1, y)) l--;
    while(r < w - 1 && op(r + 1, y)) r++;
    half.push(Math.min(cx - l, r - cx));
  }

  if(rectangular){
    /* el arte llega de borde a borde: se toca toda la placa, menos el margen transparente */
    const count = [], rows = [];
    for(let y = 0; y < h; y++){ let n = 0; for(let x = 0; x < w; x++) if(op(x, y)) n++; rows.push(n); }
    for(let x = 0; x < w; x++){ let n = 0; for(let y = 0; y < h; y++) if(op(x, y)) n++; count.push(n); }
    const first = a => a.findIndex(v => v > 2);
    const last = a => a.length - 1 - [...a].reverse().findIndex(v => v > 2);
    const t = first(rows), b = last(rows), l = first(count), rr = last(count);
    return { shape:'rect', l:pct(l / w) + '%', t:pct(t / h) + '%', w:pct((rr - l + 1) / w) + '%', h:pct((b - t + 1) / h) + '%' };
  }

  /* la elipse centrada de mayor área que no pisa ningún píxel transparente */
  let best = { hw:0, hh:0, area:0 };
  for(let hh = 1; hh <= cy; hh++){
    let hw = Infinity;
    for(let dy = 0; dy <= hh; dy++){
      const need = hh === 0 ? 0 : Math.sqrt(Math.max(0, 1 - (dy / hh) * (dy / hh)));
      if(need === 0) continue;
      hw = Math.min(hw, half[cy - dy] / need);
      if(cy + dy < h) hw = Math.min(hw, half[cy + dy] / need);
    }
    if(!isFinite(hw) || hw < 1) continue;
    const area = hw * hh;
    if(area > best.area) best = { hw:Math.floor(hw), hh, area };
  }
  const l = cx - best.hw, t = cy - best.hh;
  return { shape:'ellipse', l:pct(l / w) + '%', t:pct(t / h) + '%', w:pct((best.hw * 2 + 1) / w) + '%', h:pct((best.hh * 2 + 1) / h) + '%' };
}

function currentRules(){
  const css = fs.readFileSync(CSS, 'utf8');
  const out = {};
  const re = /([^\n{]*\.[a-z-]+[^\n{]*)\{([^{}]*)\}/g;
  for(const m of css.matchAll(re)){
    const body = m[2];
    if(body.indexOf('--hit-l') < 0) continue;
    const g = k => { const v = new RegExp('--hit-' + k + ':\\s*([\\d.]+%)').exec(body); return v ? v[1] : null; };
    out[m[1].trim()] = { l:g('l'), t:g('t'), w:g('w'), h:g('h'), r:g('r') };
  }
  return out;
}

(async () => {
  const fix = process.argv.includes('--fix');
  const cur = currentRules();
  let css = fs.readFileSync(CSS, 'utf8');
  let changed = 0;

  for(const [sel, file] of MAP){
    const box = await artBox(file);
    const now = cur[sel];
    if(!box){ console.log(sel + ' → sin pintura en ' + file); continue; }
    const near = (a, b) => a && Math.abs(parseFloat(a) - parseFloat(b)) <= 1.5;
    const radius = box.shape === 'rect' ? '0%' : '50%';
    const same = near(now && now.l, box.l) && near(now && now.t, box.t) &&
                 near(now && now.w, box.w) && near(now && now.h, box.h) &&
                 (!now || !now.r || now.r === radius);
    console.log((same ? 'ok   ' : 'DISTINTO ') + sel.padEnd(24) + ' css: ' +
      [now && now.l, now && now.t, now && now.w, now && now.h, (now && now.r) || radius].join(' ') +
      ' | arte: ' + [box.l, box.t, box.w, box.h, radius].join(' ') + '   (' + box.shape + ', ' + file + ')');
    if(same) continue;
    changed++;
    if(fix && now){
      const line = sel + '{ --hit-l:' + box.l + '; --hit-t:' + box.t + '; --hit-w:' + box.w +
        '; --hit-h:' + box.h + '; --hit-r:' + radius + '; }';
      const re = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{[^{}]*\\}');
      css = css.replace(re, line);
      fs.writeFileSync(CSS, css, 'utf8');
    }
  }
  if(fix){
    console.log('\ncomponents.css actualizado con las áreas medidas sobre el arte.');
    return;
  }
  if(changed){
    console.log('\n' + changed + ' reglas no coinciden con el dibujo. Aplicar: node tools/check_hit_areas.js --fix');
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(1); });
