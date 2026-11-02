/* =========================================================
   sprites.js · Dibuja el pixel-art del juego como SVG
   Los datos (filas de píxeles) vienen de js/data/vestuario.js.
   - avatar(a, escala, {crop})  personaje con sus accesorios
   - item(cat, key, escala)     vista previa de una prenda
   - judge / prosecutor          personajes del tribunal
   - courtroom                   fondo del tribunal
   ========================================================= */
window.DF = window.DF || {};

DF.sprites = (function(){
  const V = () => DF.vestuario;

  /* Tonos de piel (se reemplazan los caracteres S y s de la paleta) */
  const SKINS = {
    clara:  { name:{ es:'Clara',    en:'Light'  }, S:'#f6d8bd', s:'#ddb08c' },
    media:  { name:{ es:'Media',    en:'Medium' }, S:'#f2c9a0', s:'#d9a47c' },
    trigo:  { name:{ es:'Trigueña', en:'Tan'    }, S:'#d6a072', s:'#b47f54' },
    oscura: { name:{ es:'Oscura',   en:'Dark'   }, S:'#a8704a', s:'#86553a' },
    ebano:  { name:{ es:'Ébano',    en:'Deep'   }, S:'#704530', s:'#553222' }
  };

  /* Avatar por defecto = el personaje del prototipo (pelo largo y cadena) */
  const DEFAULT_AVATAR = { piel:'media', pelo:'largo', varios:'cadena' };

  /* ---------- render genérico: filas de caracteres -> rects SVG ---------- */
  function rectsFor(parts, skin){
    const pal = V().pal;
    const col = ch => (skin && (ch === 'S' || ch === 's')) ? skin[ch] : pal[ch];
    let out = '';
    parts.slice().sort((a, b) => a.z - b.z).forEach(p => {
      p.rows.forEach((row, j) => {
        let i = 0;
        while(i < row.length){
          const ch = row[i];
          if(ch === '.'){ i++; continue; }
          let k = i; while(k < row.length && row[k] === ch) k++;
          out += '<rect x="' + (p.x + i) + '" y="' + (p.y + j) + '" width="' + (k - i) + '" height="1" fill="' + col(ch) + '"/>';
          i = k;
        }
      });
    });
    return out;
  }

  function svg(inner, vb, scale, cls){
    return '<svg xmlns="http://www.w3.org/2000/svg" class="' + (cls || 'pix') + '" viewBox="' + vb.join(' ') + '" width="' + (vb[2] * scale) + '" height="' + (vb[3] * scale) + '" shape-rendering="crispEdges" aria-hidden="true">' + inner + '</svg>';
  }

  function bbox(parts){
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    parts.forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + p.rows[0].length); y1 = Math.max(y1, p.y + p.rows.length); });
    return [x0, y0, x1 - x0, y1 - y0];
  }

  /* ---------- catálogo ---------- */
  function categories(){ return V().categories; }
  function category(key){ return V().categories.find(c => c.key === key) || null; }
  function item(cat, key){ const c = category(cat); return c ? (c.items.find(i => i.key === key) || null) : null; }

  /* Normaliza un avatar guardado (versiones viejas tenían pelo/ropa/acc distintos) */
  function normalize(a){
    const out = { piel: (a && SKINS[a.piel]) ? a.piel : DEFAULT_AVATAR.piel };
    categories().forEach(c => {
      const k = a && a[c.key];
      if(k && item(c.key, k)) out[c.key] = k;
    });
    if(!out.pelo) out.pelo = DEFAULT_AVATAR.pelo;
    return out;
  }

  /* ---------- personaje ---------- */
  function avatar(a, scale, opts){
    a = normalize(a || (DF.store && DF.store.state.avatar));
    opts = opts || {};
    let parts = V().body.slice();
    categories().forEach(c => {
      if(opts.noPet && c.key === 'mascotas') return;
      const it = a[c.key] && item(c.key, a[c.key]);
      if(it) parts = parts.concat(it.parts);
    });
    const size = V().size;
    const vb = opts.crop === 'face' ? [6, -1, 24, 24]
             : opts.noPet ? [3, -1, 31, size[1] + 1]
             : [0, -1, size[0], size[1] + 1];
    return svg(rectsFor(parts, SKINS[a.piel]), vb, scale || 6, 'pix avatar');
  }

  /* Vista previa de una prenda sola (como en el panel del prototipo) */
  function itemPreview(cat, key, scale){
    const it = item(cat, key); if(!it) return '';
    const b = bbox(it.parts);
    const pad = 1;
    return svg(rectsFor(it.parts, SKINS.media), [b[0] - pad, b[1] - pad, b[2] + pad * 2, b[3] + pad * 2], scale || 3, 'pix item');
  }

  function skinSwatch(key){ return SKINS[key]; }

  function figure(f, scale){ return svg(rectsFor(f.parts, SKINS.media), [0, 0, f.w, f.h], scale || 6, 'pix'); }
  function judge(scale){ return figure(V().judge, scale); }
  function prosecutor(scale){ return figure(V().prosecutor, scale); }

  /* ---------- tribunal (fondo) · 320x180 como las capturas del prototipo ---------- */
  function courtroom(){
    const gavel = x => '<g transform="translate(' + x + ',3)"><rect x="0" y="2" width="6" height="3" fill="#3c1525"/><rect x="2" y="5" width="2" height="4" fill="#3c1525"/></g>';
    let top = '';
    for(let x = 6; x < 320; x += 26) top += gavel(x);
    const pillar = x => '<rect x="' + x + '" y="20" width="20" height="98" fill="#f0dcb0"/><rect x="' + (x - 3) + '" y="20" width="26" height="6" fill="#d9c08e"/><rect x="' + (x - 3) + '" y="112" width="26" height="6" fill="#d9c08e"/><rect x="' + (x + 4) + '" y="28" width="3" height="82" fill="#fbedcc"/><rect x="' + (x + 13) + '" y="28" width="2" height="82" fill="#d9c08e"/>';
    const banner = x => '<rect x="' + (x - 3) + '" y="34" width="34" height="3" fill="#3c1525"/><path d="M' + x + ' 37h28v68l-14-10-14 10z" fill="#5f2d47"/><path d="M' + (x + 2) + ' 39h24v61l-12-8-12 8z" fill="none" stroke="#c89a5a" stroke-width="1"/>'
      + '<g fill="#e7c48a"><rect x="' + (x + 13) + '" y="50" width="2" height="20"/><rect x="' + (x + 6) + '" y="54" width="16" height="2"/><rect x="' + (x + 10) + '" y="70" width="8" height="2"/><path d="M' + (x + 4) + ' 62h8l-4-7z"/><path d="M' + (x + 16) + ' 62h8l-4-7z"/></g>';
    const lamp = x => '<rect x="' + (x + 2) + '" y="66" width="3" height="10" fill="#4a2410"/><path d="M' + x + ' 66h7l-1-6h-5z" fill="#f6e2a8"/><rect x="' + (x - 1) + '" y="76" width="9" height="2" fill="#4a2410"/>';
    const door = x => '<rect x="' + x + '" y="44" width="30" height="64" fill="#f5e4bd" stroke="#d9c08e" stroke-width="2"/><rect x="' + (x + 6) + '" y="52" width="18" height="48" fill="none" stroke="#e0caa0" stroke-width="1"/>';
    let rail = '';
    for(let x = 4; x < 320; x += 10) rail += '<rect x="' + x + '" y="134" width="4" height="22" fill="#5a2c12"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" class="court-bg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">'
      + '<rect width="320" height="180" fill="#f7e7c2"/>'
      + '<rect width="320" height="16" fill="#5f2d47"/>' + top
      + '<rect y="16" width="320" height="2" fill="#c89a5a"/><rect y="18" width="320" height="2" fill="#3c1525"/>'
      + pillar(52) + pillar(248) + banner(14) + banner(278)
      + door(82) + door(208) + lamp(70) + lamp(243)
      /* estrado del juez con frontón */
      + '<path d="M96 40l64-22 64 22z" fill="#6b3a1f"/><path d="M104 40l56-18 56 18z" fill="#8c5330"/><rect x="96" y="40" width="128" height="6" fill="#4a2410"/>'
      + '<rect x="104" y="46" width="10" height="70" fill="#e9d2a2"/><rect x="206" y="46" width="10" height="70" fill="#e9d2a2"/>'
      + '<g fill="#3c1525"><rect x="159" y="26" width="2" height="12"/><rect x="152" y="28" width="16" height="2"/><path d="M149 35h8l-4-6z"/><path d="M163 35h8l-4-6z"/></g>'
      + '<rect y="118" width="320" height="62" fill="#4a2410"/><rect y="118" width="320" height="4" fill="#7a4424"/>'
      + '<rect y="130" width="320" height="4" fill="#6b3a1f"/>' + rail + '<rect y="156" width="320" height="5" fill="#6b3a1f"/>'
      + '<rect y="161" width="320" height="19" fill="#3a1a07"/>'
      + '</svg>';
  }

  /* ---------- escena del tribunal: fondo + estrado + personajes ----------
     Escenas (como en el prototipo):
       'judge'   → el juez en el estrado (presentación del caso)
       'ask'     → el fiscal hace la pregunta
       'answer'  → tu personaje elige la respuesta
       'verdict' → el juez al centro, vos a la izquierda y el fiscal a la derecha */
  function courtScene(){
    const gavel = '<svg class="gavel" viewBox="0 0 21 12" shape-rendering="crispEdges"><rect x="1" y="1" width="9" height="5" fill="#6b3a1f"/><rect x="1" y="1" width="9" height="1" fill="#a8683a"/><rect x="9" y="3" width="11" height="2" fill="#8c5330"/><rect x="0" y="9" width="12" height="3" fill="#3a1a07"/></svg>';
    const books = '<svg class="books" viewBox="0 0 16 10" shape-rendering="crispEdges"><rect x="0" y="0" width="14" height="3" fill="#6d1f30"/><rect x="1" y="3" width="15" height="3" fill="#3f6e3a"/><rect x="0" y="6" width="14" height="4" fill="#8c5330"/><rect x="1" y="1" width="12" height="1" fill="#e0b070"/></svg>';
    // .court-room agrupa la sala (en vertical ocupa la parte de arriba de la pantalla)
    return '<div class="court-room">' + courtroom()
      + '<div class="who c-center" data-role="judge">' + judge(8) + '</div>'
      + '<div class="who c-center" data-role="pros">' + prosecutor(8) + '</div>'
      + '<div class="who c-center" data-role="player">' + avatar(null, 5, { noPet:true }) + '</div>'
      + '<div class="who c-left" data-role="player-side">' + avatar(null, 4.6, { noPet:true }) + '</div>'
      + '<div class="who c-right" data-role="pros-side">' + prosecutor(7) + '</div>'
      + '<div class="desk">' + gavel + books + '</div></div>';
  }
  const SCENES = {
    judge:   ['judge'],
    ask:     ['pros'],
    answer:  ['player'],
    verdict: ['judge', 'player-side', 'pros-side']
  };
  function setScene(court, name){
    const on = SCENES[name] || [];
    court.dataset.scene = name;
    court.querySelectorAll('.who').forEach(el => el.classList.toggle('on', on.includes(el.dataset.role)));
  }

  return { SKINS, DEFAULT_AVATAR, categories, category, item, normalize, avatar, itemPreview, skinSwatch, judge, prosecutor, courtroom, courtScene, setScene };
})();
