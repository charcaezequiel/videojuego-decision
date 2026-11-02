/* =========================================================
   manual.js (pantalla) · copia del vestidor a la izquierda,
   texto con scroll propio a la derecha
   ========================================================= */
DF.boot(() => {
  const shot = document.getElementById('man-shot');
  const scroll = document.getElementById('man-scroll');
  const track = document.getElementById('man-track');

  /* Miniatura de "Vestí a tu personaje", con el personaje de la cuenta */
  const cats = DF.sprites.categories();
  const preview = cats.slice(0, 10).map(c => {
    const it = c.items[0];
    return it ? DF.sprites.itemPreview(c.key, it.key, 6) : '';
  }).join('');
  shot.innerHTML =
    '<div class="ms-title">' + DF.esc(DF.i18n.t('vestir')) + '</div>' +
    '<div class="ms-arrow"></div>' +
    '<div class="ms-av">' + DF.sprites.avatar(null, 3.4, { noPet:true }) + '</div>' +
    '<div class="ms-grid">' + preview + '</div>' +
    '<div class="ms-cap">' + DF.esc(DF.i18n.t('vestirHint')) + '</div>';

  scroll.innerHTML = DF.manual.map(b =>
    '<h2>' + DF.esc(b.h2) + '</h2>' + b.p.map(x => '<p>' + DF.esc(x) + '</p>').join('')
  ).join('') + '<p class="body-text" style="margin-top:22px;opacity:.7">' +
     DF.creditos.map(DF.esc).join('<br>') + '</p>';

  const bar = DF.scrollbar(scroll, track);
  scroll.addEventListener('scroll', bar.update);
  window.addEventListener('resize', () => requestAnimationFrame(bar.update));
  bar.update();
}, { requiresUser:true });
