/* =========================================================
   audio.js · Sonidos sintetizados (sin archivos externos)
   El volumen sale de Configuración.
   ========================================================= */
window.DF = window.DF || {};

DF.audio = (function(){
  let ctx = null;
  function ensure(){
    // Los navegadores no permiten audio antes de un clic/tecla en la página
    const ua = navigator.userActivation;
    if(ua && !ua.hasBeenActive) return null;
    if(!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      ctx = new AC();
    }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol){
    const c = ensure(); if(!c) return;
    const master = DF.store.state.settings.volume / 100;
    if(master <= 0) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    const t0 = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (vol || .12) * master), t0 + .01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + .02);
  }

  const sounds = {
    click(){ tone(520, 0, .07, 'square', .08); },
    key(){ tone(330, 0, .05, 'square', .06); },
    ok(){ tone(523, 0, .1); tone(659, .1, .1); tone(784, .2, .18); },
    bad(){ tone(196, 0, .16, 'sawtooth', .1); tone(147, .15, .24, 'sawtooth', .1); },
    win(){ [523,659,784,1047].forEach((f,i)=>tone(f, i*.12, .16)); tone(1047,.5,.4); },
    lose(){ [392,330,262,196].forEach((f,i)=>tone(f, i*.16, .2, 'triangle', .12)); },
    gavel(){ tone(110, 0, .1, 'square', .2); tone(90, .02, .14, 'triangle', .2); }
  };

  return {
    play(name){ try { (sounds[name] || sounds.click)(); } catch(e){} },
    /* Un solo handler global: cualquier elemento con data-sfx suena al hacer click */
    bindGlobalClicks(){
      document.addEventListener('click', e => {
        const el = e.target.closest('[data-sfx], .img-btn, .btn, a');
        if(el) sounds.click();
      }, true);
    }
  };
})();
