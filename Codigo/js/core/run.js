/* =========================================================
   run.js · La partida en curso de UN nivel
   Vive dentro del registro de la cuenta (DF.store.saveRun), así:
   - si se recarga la página, la pregunta y las carpetas siguen igual
   - al cambiar de cuenta se borra: nadie termina la partida de otra
   Guarda: carpetas leídas, preguntas respondidas y palabras del desafío.
   ========================================================= */
window.DF = window.DF || {};

DF.run = (function(){
  const FOLDERS = () => (DF.rules && DF.rules.folders) || ['denuncia', 'testimonios', 'pruebas'];

  function blank(n){
    const read = {};
    FOLDERS().forEach(f => { read[f] = false; });
    /* las 3 palabras del desafío vienen ya armadas: así se puede retomar
       el desafío a mitad si se recarga la página */
    const palabras = (DF.levels && DF.levels[n - 1] && DF.levels[n - 1].palabras) || [];
    const words = palabras.map(w => ({ word:w, attempts:[], solved:false, done:false }));
    return { level:n, read:read, order:null, answers:[], words:words, result:null, started:Date.now() };
  }

  /* Partida guardada del nivel indicado (o null si es de otro nivel) */
  function current(n){
    const r = DF.store.getRun();
    return (r && r.level === n) ? r : null;
  }

  /* Devuelve la partida del nivel: la retoma si existe, la crea si no */
  function open(n){
    let r = current(n);
    if(!r){ r = blank(n); DF.store.saveRun(r); }
    return r;
  }

  /* Empieza de cero (reintentar el nivel) */
  function restart(n){
    const r = blank(n);
    DF.store.saveRun(r);
    return r;
  }

  function save(patch){
    const r = DF.store.getRun();
    if(!r) return null;
    Object.keys(patch).forEach(k => { r[k] = patch[k]; });
    DF.store.saveRun(r);
    return r;
  }

  function clear(){ DF.store.saveRun(null); }

  /* Orden de las opciones: fijo durante toda la partida.
     La pregunta oficial conserva el orden A-D del PDF. */
  function optionOrder(n){
    const r = open(n);
    if(r.order && r.order.length === DF.levels[n - 1].preguntas.length) return r.order;
    const level = DF.levels[n - 1];
    const order = level.preguntas.map((q, i) => {
      const idx = [0, 1, 2, 3];
      if(q.oficial) return idx;
      for(let j = idx.length - 1; j > 0; j--){
        const k = Math.floor(Math.random() * (j + 1));
        const t = idx[j]; idx[j] = idx[k]; idx[k] = t;
      }
      return idx;
    });
    save({ order:order });
    return order;
  }

  /* Opciones ya ordenadas de una pregunta + letra correcta en ese orden */
  function question(n, i){
    const q = DF.levels[n - 1].preguntas[i];
    const ord = optionOrder(n)[i];
    const opts = ord.map(j => q.opts[j]);
    const key = 'ABCD'[ord.indexOf('ABCD'.indexOf(q.key))];
    return { q:q.q, opts:opts, key:key, oficial:q.oficial };
  }

  const answered = n => (current(n) || { answers:[] }).answers.length;

  /* Puntos de una respuesta: correctPoints + bonus por rapidez */
  function pointsFor(correct, secsLeft){
    const R = DF.rules;
    if(!correct) return 0;
    const ratio = Math.max(0, Math.min(1, secsLeft / R.seconds));
    return R.correctPoints + Math.round(R.maxSpeedBonus * ratio);
  }

  /* Nota final de la partida: aciertos, palabras, puntaje, estrellas y si se ganó */
  function grade(run){
    const R = DF.rules;
    const a = run.answers || [];
    const correct = a.filter(x => x.correct).length;
    const timeout = a.filter(x => !x.correct && x.timeout).length;
    const wrong = a.length - correct - timeout;
    const unanswered = Math.max(0, R.questionCount - a.length);
    const words = (run.words || []).filter(x => x.solved).length;
    const score = a.reduce((s, x) => s + (x.pts || 0), 0) + words * R.wordPoints;
    const passed = correct >= R.minCorrect && words >= R.minWords;
    const ratio = score / R.maxScore;
    let stars = 0;
    if(passed){
      stars = 1;
      if(ratio >= R.starRatios[1]) stars = 2;
      if(ratio >= R.starRatios[2]) stars = 3;
    }
    return {
      level:run.level, correct:correct, wrong:wrong, timeout:timeout, unanswered:unanswered,
      words:words, wordsTotal:R.wordsPerLevel, score:score, stars:stars, passed:passed, ratio:ratio
    };
  }

  return { open, current, restart, save, clear, blank, optionOrder, question, answered, pointsFor, grade, FOLDERS };
})();
