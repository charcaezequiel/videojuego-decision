/* =========================================================
   config.js · Volumen, música, brillo, idioma y gráficos
   Todo se aplica al toque (sin recargar) y se guarda en los
   ajustes del dispositivo, compartidos por todas las cuentas.
   ========================================================= */
DF.boot(() => {
  const S = DF.store.state.settings;
  const el = id => document.getElementById(id);
  const volumen = el('volumen'), brillo = el('brillo'), musica = el('musica');
  const idioma = el('idioma'), graficos = el('graficos');

  volumen.value = S.volume;
  brillo.value = S.brightness;
  musica.value = S.music;
  idioma.value = S.lang;
  graficos.value = S.graphics;

  /* Numerito al lado de cada slider para que se vea el valor real */
  function readout(input){
    const v = document.createElement('span');
    v.className = 'val';
    input.parentNode.appendChild(v);
    const place = () => {
      v.style.left = (input.offsetLeft + input.offsetWidth + 14) + 'px';
      v.style.top = (input.offsetTop + 4) + 'px';
      v.textContent = input.value;
    };
    input.addEventListener('input', place);
    place();
    return place;
  }

  function on(input, key, after){
    input.addEventListener('input', () => {
      DF.store.setSetting(key, +input.value);
      if(after) after(+input.value);
    });
  }

  const rv = readout(volumen), rb = readout(brillo), rm = readout(musica);
  on(volumen, 'volume');                 // el volumen se lee del ajuste en cada sonido
  on(brillo, 'brightness', () => DF.stage.apply());
  on(musica, 'music', () => DF.music.sync(true));

  idioma.addEventListener('change', () => {
    DF.store.setSetting('lang', idioma.value);
    DF.i18n.apply();
    rv(); rb(); rm();
  });

  graficos.addEventListener('change', () => {
    DF.store.setSetting('graphics', graficos.value);
    DF.stage.apply();
  });
});
