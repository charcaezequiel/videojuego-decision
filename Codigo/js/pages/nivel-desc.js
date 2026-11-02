/* Descripción del caso: de qué se trata y qué se juega */
DF.boot(() => {
  const n = DF.nav.level();
  const level = DF.levels[n - 1];
  document.getElementById('nv-tag').textContent = DF.i18n.t('nivel', { n:n });
  document.getElementById('nv-desc').innerHTML =
    '<p>' + DF.esc(level.subtitulo) + '</p>' +
    '<p>' + DF.esc(level.resumen) + '</p>';
  document.getElementById('nv-desc').addEventListener('click', () => DF.nav.follow('next'));
}, { level:true });
