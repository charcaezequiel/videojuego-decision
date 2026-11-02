/* =========================================================
   music.js · Música de fondo del juego
   Archivo: assets/audio/musica-quiz.ogg / .mp3 (composición
   original del proyecto, CC0 · ver assets/audio/LICENCIA.txt).

   - Volumen moderado: Configuración → Música (0 = apagada) y
     también respeta el Volumen general.
   - Respeta el bloqueo de reproducción automática: empieza con
     la primera interacción (clic, toque o tecla) del jugador.
   - No se reinicia al cambiar de pantalla:
       · Jugando desde index.html, las pantallas se cargan dentro
         de un contenedor (index.html) que tiene el reproductor:
         la música sigue sonando sin cortes (DF.shell).
       · Si se abre una pantalla suelta (pages/xxx.html), cada
         pantalla retoma la música en el punto donde iba.
   - Se pausa sola si la pestaña queda en segundo plano.
   ========================================================= */
window.DF = window.DF || {};

/* Control de volumen de un <audio>.
   En iPhone/iPad el volumen del elemento es de solo lectura (siempre suena al
   máximo): ahí el volumen se aplica con Web Audio (GainNode). Lo usan el
   contenedor (shell.js) y el reproductor propio de las pantallas sueltas. */
DF.volumeControl = function(audio){
  let ctx = null, gain = null;
  let native = true;
  try { const old = audio.volume; audio.volume = 0.5; native = Math.abs(audio.volume - 0.5) < 0.01; audio.volume = old; } catch(e){}
  return function(v){
    if(native){ audio.volume = v; return; }
    try {
      if(!ctx){
        const AC = window.AudioContext || window.webkitAudioContext;
        if(!AC) return;
        ctx = new AC();
        gain = ctx.createGain();
        ctx.createMediaElementSource(audio).connect(gain);
        gain.connect(ctx.destination);
      }
      if(ctx.state === 'suspended') ctx.resume();
      gain.gain.value = v;
    } catch(e){}
  };
};

/* Comunicación con el contenedor index.html (si el juego corre adentro) */
DF.shell = (function(){
  let inShell = false;
  try { inShell = window.name === 'df-shell' && window.parent !== window; } catch(e){}

  function send(type, msg){
    if(!inShell) return;
    msg = Object.assign({ df: type }, msg);
    // Mismo origen (servidor http/https): llamada directa → cuenta como gesto del usuario (Safari / iOS)
    try { if(window.parent.DFShell){ window.parent.DFShell.receive(msg); return; } } catch(e){}
    // Archivo abierto con doble clic (file://): mensaje entre ventanas
    try { window.parent.postMessage(msg, '*'); } catch(e){}
  }
  /* Avisa qué pantalla se está viendo (título de la pestaña y recarga en la misma pantalla) */
  function announce(){
    send('page', { path: 'pages/' + DF.nav.page() + location.search, title: document.title });   // page() siempre termina en .html
  }
  return { get inShell(){ return inShell; }, send, announce };
})();

DF.music = (function(){
  const MAX = 0.5;                                  // techo: la música nunca tapa los efectos
  const POS_KEY = 'df_music_pos';
  const here = document.currentScript ? document.currentScript.src : location.href;
  const base = new URL('../../assets/audio/', here).href;
  let local = null;
  let setLocalVolume = null;
  let started = false;

  /* 0..1 según Configuración (Música × Volumen general) */
  function level(){
    const s = DF.store.state.settings;
    const music = s.music === undefined ? 40 : +s.music;
    return Math.max(0, Math.min(1, (music / 100) * (+s.volume / 100) * MAX));
  }

  /* ---- modo sin contenedor: reproductor propio que retoma la posición ---- */
  function savePos(){
    if(!local) return;
    try { sessionStorage.setItem(POS_KEY, JSON.stringify({ t: local.currentTime || 0, playing: !local.paused, at: Date.now() })); } catch(e){}
  }
  function ensureLocal(){
    if(local) return local;
    local = new Audio();
    local.loop = true;
    local.preload = 'auto';
    const ok = t => local.canPlayType(t) ? t : null;
    local.src = base + (ok('audio/mpeg') ? 'musica-quiz.mp3'
                      : ok('audio/ogg; codecs="vorbis"') ? 'musica-quiz.ogg'
                      : 'musica-quiz.wav');
    setLocalVolume = DF.volumeControl(local);
    let pos = null;
    try { pos = JSON.parse(sessionStorage.getItem(POS_KEY)); } catch(e){}
    if(pos && pos.t >= 0){
      local.addEventListener('loadedmetadata', () => {
        const extra = pos.playing ? Math.min((Date.now() - pos.at) / 1000, 5) : 0;
        try { local.currentTime = (pos.t + extra) % (local.duration || 1e9); } catch(e){}
      }, { once: true });
    }
    window.addEventListener('pagehide', savePos);
    return local;
  }
  function playLocal(v){
    const a = ensureLocal();
    setLocalVolume(v);
    if(v <= 0 || document.hidden){ a.pause(); return; }
    if(a.paused){ const p = a.play(); if(p && p.catch) p.catch(() => {}); }
  }

  /* Aplica el volumen actual y arranca la música si se puede. gesture = viene de un clic/toque/tecla */
  function sync(gesture){
    const v = level();
    if(DF.shell.inShell) DF.shell.send('music', { volume: v, gesture: !!gesture });
    else playLocal(v);
  }

  function onGesture(){ sync(true); }

  function init(){
    if(started) return;
    started = true;
    sync(false);
    // La primera interacción habilita el audio (política de reproducción automática de los navegadores)
    ['pointerdown', 'keydown', 'touchend'].forEach(t => document.addEventListener(t, onGesture, true));
    if(!DF.shell.inShell){
      document.addEventListener('visibilitychange', () => { if(document.hidden){ if(local) local.pause(); } else sync(false); });
    }
  }

  /* Estado (para pruebas y diagnóstico): dónde suena, si está sonando y por dónde va */
  function info(){
    if(DF.shell.inShell) return { mode: 'shell', level: level() };
    return { mode: 'local', level: level(), playing: !!local && !local.paused, time: local ? local.currentTime : 0 };
  }

  return { init, sync, level, info };
})();
