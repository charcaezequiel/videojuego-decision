/* Título del nivel: cartel grande y la flecha → hacia la descripción */
DF.boot(() => {
  const n = DF.nav.level();
  const level = DF.levels[n - 1];
  document.getElementById('nv-tag').textContent = DF.i18n.t('nivel', { n:n });
  document.getElementById('nv-titulo').textContent = level.titulo;
  document.getElementById('nv-sub').textContent = level.subtitulo;
  document.getElementById('banner').addEventListener('click', () => DF.nav.follow('next'));
}, { level:true });
