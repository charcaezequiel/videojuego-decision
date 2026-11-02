/* =========================================================
   fin.js · Pantalla final: se jugaron los 10 casos
   Resumen del recorrido, estrellas por nivel y el personaje.
   ========================================================= */
DF.boot(() => {
  const total = DF.progress.total();
  const av = document.getElementById('fin-av');
  const box = document.getElementById('fin-box');

  av.innerHTML = DF.sprites.avatar(null, 8);

  const won = DF.progress.wonCount();
  const score = DF.progress.totalScore();
  const stars = DF.levels.reduce((s, l) => s + ((DF.progress.result(l.n) || {}).stars || 0), 0);

  const perLevel = DF.levels.map(l => {
    const r = DF.progress.result(l.n) || {};
    const n = r.stars || 0;
    let out = '';
    for(let i = 0; i < 3; i++) out += i < n ? '★' : '<span class="off">★</span>';
    return '<span>' + DF.esc(DF.i18n.t('nivel', { n:l.n })) + ' ' + out + '</span>';
  }).join('');

  box.innerHTML =
    '<div class="sub">' + DF.esc(DF.i18n.t('finSub', { n:total })) + '</div>' +
    '<div class="stat">' + DF.esc(DF.i18n.t('finGanados', { a:won, b:total })) + '</div>' +
    '<div class="stat">' + DF.esc(DF.i18n.t('finPuntos', { p:score })) + '</div>' +
    '<div class="stat">★ ' + stars + '/' + total * 3 + '</div>' +
    '<div class="fin-stars">' + perLevel + '</div>' +
    '<p>' + DF.esc(DF.i18n.t('finTexto')) + '</p>';

  DF.audio.play('win');
}, { requiresUser:true });
