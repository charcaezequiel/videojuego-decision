/* =========================================================
   timer.js · Cuenta regresiva de una pregunta
   Un temporizador por pregunta: se crea, se arranca y se descarta.
   Usa performance.now() para que el ritmo no se corra si la
   pestaña se congela un momento.
   ========================================================= */
window.DF = window.DF || {};

DF.timer = function(opts){
  opts = opts || {};
  const total = Math.max(1, opts.seconds || 20);
  let left = total;
  let raf = null;
  let last = 0;
  let running = false;

  function render(){
    const secs = Math.max(0, Math.ceil(left));
    if(opts.onTick) opts.onTick(secs, left / total);
  }

  function frame(now){
    if(!running) return;
    if(last) left -= (now - last) / 1000;
    last = now;
    if(left <= 0){
      left = 0;
      running = false;
      render();
      if(opts.onEnd) opts.onEnd();
      return;
    }
    render();
    raf = requestAnimationFrame(frame);
  }

  return {
    start(){
      if(running) return;
      running = true; last = 0;
      raf = requestAnimationFrame(frame);
    },
    stop(){ running = false; if(raf) cancelAnimationFrame(raf); raf = null; },
    reset(seconds){ this.stop(); left = Math.max(1, seconds || total); last = 0; render(); },
    get remaining(){ return left; },
    get seconds(){ return Math.max(0, Math.ceil(left)); },
    get progress(){ return left / total; },
    get running(){ return running; },
    get total(){ return total; }
  };
};
