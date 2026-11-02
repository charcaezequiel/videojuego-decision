/* =========================================================
   progress.js · Progresión de niveles y desbloqueos
   Regla principal: TERMINAR un nivel (ganado o perdido)
   desbloquea el siguiente. Un nivel desbloqueado nunca
   vuelve a bloquearse. También desbloquea las prendas del nivel.
   ========================================================= */
window.DF = window.DF || {};

DF.progress = (function(){
  const levels = () => DF.store.state.progress.levels;
  const total = () => (DF.levels ? DF.levels.length : 10);

  function result(n){ return levels()[n] || null; }
  function isPlayed(n){ const r = result(n); return !!(r && r.played); }
  function isPassed(n){ const r = result(n); return !!(r && r.passed); }
  function isUnlocked(n){ return n === 1 || isPlayed(n - 1) || isPlayed(n); }

  /* 'locked' | 'available' | 'won' | 'lost' */
  function status(n){
    if(!isUnlocked(n)) return 'locked';
    if(!isPlayed(n)) return 'available';
    return isPassed(n) ? 'won' : 'lost';
  }

  /* Una prenda de nivel N se desbloquea al terminar el nivel N (lvl 0 = desde el inicio) */
  function itemUnlocked(lvl){ return lvl === 0 || isPlayed(lvl); }

  /* Guarda el resultado de un nivel terminado. Se conserva el mejor puntaje
     y "ganado" no se pierde si después se juega de nuevo y se pierde. */
  function finishLevel(n, r){
    const firstTime = !isPlayed(n);
    DF.store.update(s => {
      const prev = s.progress.levels[n] || { score:0, stars:0, attempts:0, passed:false };
      s.progress.levels[n] = {
        played: true,
        passed: prev.passed || !!r.passed,
        score: Math.max(prev.score || 0, r.score || 0),
        stars: Math.max(prev.stars || 0, r.stars || 0),
        attempts: (prev.attempts || 0) + 1,
        last: { score:r.score, passed:!!r.passed, stars:r.stars, correct:r.correct, wrong:r.wrong, timeout:r.timeout, unanswered:r.unanswered, words:r.words, wordsTotal:r.wordsTotal }
      };
    });
    return { firstTime, unlockedLevel: (firstTime && n < total()) ? n + 1 : null };
  }

  function totalScore(){ return Object.values(levels()).reduce((a, r) => a + (r.score || 0), 0); }
  function playedCount(){ return Object.values(levels()).filter(r => r.played).length; }
  function wonCount(){ return Object.values(levels()).filter(r => r.passed).length; }
  function allPlayed(){ for(let n = 1; n <= total(); n++) if(!isPlayed(n)) return false; return true; }

  /* Primer nivel desbloqueado que todavía no se jugó (para el botón "Siguiente nivel") */
  function nextPending(){
    for(let n = 1; n <= total(); n++) if(isUnlocked(n) && !isPlayed(n)) return n;
    return null;
  }

  return { result, isPlayed, isPassed, isUnlocked, status, itemUnlocked, finishLevel, totalScore, playedCount, wonCount, allPlayed, nextPending, total };
})();
