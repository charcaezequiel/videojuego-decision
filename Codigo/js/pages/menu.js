/* =========================================================
   menu.js · pantalla de acceso
   Muestra la cuenta abierta y su puntaje; "cambiar de cuenta"
   cierra la sesión (los datos quedan guardados en su clave).
   ========================================================= */
DF.boot(() => {
  const s = DF.store.state;
  const user = document.getElementById('menu-user');
  const score = DF.progress.totalScore();
  const played = DF.progress.playedCount();
  user.innerHTML = '<span class="name">' + DF.esc(s.user) + '</span>' +
    (score ? ' · ' + score + ' ' + DF.i18n.t('pts') + ' · ' + played + '/' + DF.progress.total() : '');

  document.getElementById('btn-cuenta').addEventListener('click', () => {
    DF.store.logout();
    DF.nav.go('registro.html');
  });
}, { requiresUser:true });
