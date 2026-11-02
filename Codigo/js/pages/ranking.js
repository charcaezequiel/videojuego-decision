/* =========================================================
   ranking.js · Cuenta por cuenta, ordenadas por puntaje
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
    const avg = r.played ? Math.round(r.stars / r.played * 3) : 0;
    return '<div class="rank-row' + (me ? ' me' : '') + '">' +
      '<div class="rank-pos">' + (i + 1) + '</div>' +
      '<div class="rank-avatar">' + DF.sprites.avatar(r.avatar, 2.6, { crop:'face' }) + '</div>' +
      '<div class="rank-bar"><i class="fill" data-w="' + Math.round(r.score / max * 100) + '"></i>' +
        '<span class="name">' + DF.esc(r.user) + '</span></div>' +
      '<div class="rank-pts">' + r.score + ' ' + DF.i18n.t('pts') + '</div>' +
      '<div class="rank-stars" title="' + r.stars + '">' + starRow(avg) + '</div>' +
      '</div>';
  }).join('');

  // las barras crecen con la transición que ya define el CSS
  requestAnimationFrame(() => {
    list.querySelectorAll('.rank-bar .fill').forEach(f => { f.style.width = f.dataset.w + '%'; });
  });
}, { requiresUser:true });
