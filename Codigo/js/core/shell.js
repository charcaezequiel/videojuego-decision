/* =========================================================
   shell.js · Contenedor del juego (index.html)
   Las pantallas (pages/*.html) se cargan dentro de un <iframe>
   y este contenedor queda fijo: así la música de fondo sigue
   sonando sin reiniciarse al cambiar de pantalla.
   - Recibe de las pantallas: volumen de la música y la pantalla actual.
   - La dirección (#pages/...) permite recargar en la misma pantalla.
   - Pausa la música si la pestaña queda en segundo plano.
   ========================================================= */
(function(){
  const frame = document.getElementById('df-frame');
  const audio = document.getElementById('df-music');
  const setVolume = DF.volumeControl(audio);                      // (iPhone/iPad: ver music.js)
  const PAGE = /^pages\/[a-z0-9-]+(\.html)?(\?n=\d{1,2})?$/;    // solo pantallas del juego
  let volume = 0;
  let unlocked = false;          // el jugador ya interactuó (clic / toque / tecla)

  function activated(){
    const ua = navigator.userActivation;
    return unlocked || !ua || ua.hasBeenActive;
  }

  function apply(){
    setVolume(Math.max(0, Math.min(1, volume)));
    if(volume <= 0 || document.hidden){ if(!audio.paused) audio.pause(); return; }
    if(audio.paused && activated()){
      const p = audio.play();
      if(p && p.catch) p.catch(() => {});
    }
  }

  function receive(msg){
    if(!msg || typeof msg !== 'object') return;
    if(msg.df === 'music'){
      if(typeof msg.volume === 'number' && isFinite(msg.volume)) volume = msg.volume;
      if(msg.gesture) unlocked = true;
      apply();
    } else if(msg.df === 'page'){
      if(typeof msg.title === 'string') document.title = msg.title;
      if(typeof msg.path === 'string' && PAGE.test(msg.path)){
        try { history.replaceState(null, '', '#' + msg.path); } catch(e){}
      }
    }
  }
  window.DFShell = { receive };

  window.addEventListener('message', e => {
    if(e.source === frame.contentWindow) receive(e.data);   // solo mensajes del juego
  });
  document.addEventListener('visibilitychange', apply);

  // Recargar la página vuelve a la pantalla donde estaba el jugador
  let start = '';
  try { start = decodeURIComponent(location.hash.slice(1)); } catch(e){}   // dirección mal escrita: portada
  frame.src = PAGE.test(start) ? start : 'pages/portada.html';

  // El teclado (flechas, 1-4, letras) va directo al juego
  frame.addEventListener('load', () => { try { frame.contentWindow.focus(); } catch(e){} });
})();
