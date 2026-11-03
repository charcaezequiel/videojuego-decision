/* =========================================================
   ranking.js · Cuenta por cuenta, ordenadas por puntaje
   Cada fila muestra el total, y a la derecha las estrellas y el puntaje
   del MEJOR nivel jugado por esa cuenta.
   Se muestra el usuario, no el correo. La cuenta abierta resalta.
   ========================================================= */
DF.boot(() => {
  const list = document.getElementById('rank-list');
  const rows = DF.store.accounts();
  const max = Math.max(1, rows.reduce((m, r) => Math.max(m, r.score), 0));

  if(!rows.length){
    list.innerHTML = '<p class="body-text">' + DF.i18n.t('sinCuentas') + '</p>';
    return;
  }

  const starRow = n => {
    let out = '';
    for(let i = 0; i < 3; i++) out += i < n ? '★' : '<span class="off">★</span>';
    return out;
  };

  list.innerHTML = rows.map((r, i) => {
    const me = r.email === DF.store.state.email;
    const best = r.best;
    const label = best ? DF.i18n.t('rankBest', { n:best.n, p:best.score }) : '';
    const tit = best ? DF.i18n.t('rankBestTit', { n:best.n, p:best.score, s:best.stars }) : '';
    return '<div class="rank-row' + (me ? ' me' : '') + '">' +
      '<div class="rank-pos">' + (i + 1) + '</div>' +
      '<div class="rank-avatar">' + DF.sprites.avatar(r.avatar, 2.6, { crop:'face' }) + '</div>' +
      '<div class="rank-bar"><i class="fill" data-w="' + Math.round(r.score / max * 100) + '"></i>' +
        '<span class="name">' + DF.esc(r.user) + '</span></div>' +
      '<div class="rank-pts">' + r.score + ' ' + DF.i18n.t('pts') + '</div>' +
      '<div class="rank-stars" title="' + DF.esc(tit) + '">' + starRow(best ? best.stars : 0) +
        (label ? '<small>' + DF.esc(label) + '</small>' : '') + '</div>' +
      '</div>';
  }).join('');

  // las barras crecen con la transición que ya define el CSS
  requestAnimationFrame(() => {
    list.querySelectorAll('.rank-bar .fill').forEach(f => { f.style.width = f.dataset.w + '%'; });
  });
}, { requiresUser:true });
