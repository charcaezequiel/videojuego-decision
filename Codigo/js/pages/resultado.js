/* =========================================================
   resultado.js · Nota del nivel terminado
   - guarda el resultado (se conserva el mejor puntaje)
   - avisa qué se desbloqueó
   - si no se toca nada, vuelve solo a Selección de nivel a los 8 s
   ========================================================= */
DF.boot(() => {
  const n = DF.nav.level();
  const R = DF.rules;
  const el = id => document.getElementById(id);

  const run = DF.run.current(n);
  let g;

  if(run){
    g = DF.run.grade(run);
    /* solo la primera vez de esta partida cuenta como intento nuevo */
    if(!run.result){
      run.result = g;
      DF.run.save({ result:g });
      g.unlock = DF.progress.finishLevel(n, g);
    } else {
      g.unlock = { firstTime:false, unlockedLevel:null };
    }
    DF.run.clear();
  } else {
    /* recarga después de guardar: se muestra lo que ya está registrado */
    const last = (DF.progress.result(n) || {}).last;
    if(!last){ DF.nav.replace('niveles.html'); return; }
    g = Object.assign({ level:n, unlock:{ firstTime:false, unlockedLevel:null } }, last);
  }

  const prev = DF.progress.result(n) || {};
  document.title = DF.i18n.t('resultado');
  el('res-titulo').textContent = g.passed ? DF.i18n.t('aprobado') : DF.i18n.t('fallido');
  el('res-stars').innerHTML = [0, 1, 2].map(i =>
    '<span' + (i < g.stars ? '' : ' class="off"') + '>★</span>').join('');
  el('res-score').innerHTML = g.score + ' <small>' + DF.esc(DF.i18n.t('puntos')) + '</small>' +
    (prev.score && prev.score > g.score ? ' <small>· ' + prev.score + '</small>' : '');

  const chip = (key, vars, cls) => '<span class="' + cls + '">' + DF.esc(DF.i18n.t(key, vars)) + '</span>';
  el('res-stats').innerHTML =
    chip('correctas', { n:g.correct }, 'ok') +
    chip('incorrectas', { n:g.wrong }, 'bad') +
    chip('sinResponder', { n:g.timeout + g.unanswered }, 'na') +
    chip('aciertos', { a:g.correct, b:R.questionCount }, g.correct >= R.minCorrect ? 'ok' : 'bad') +
    chip('desafioFinal', { a:g.words, b:g.wordsTotal }, g.words >= R.minWords ? 'ok' : 'bad');

  el('res-note').innerHTML = notas(g);
  botones(g);

  /* ---------- textos ---------- */
  function notas(g){
    const out = [];
    if(g.unlock && g.unlock.unlockedLevel) out.push(DF.i18n.t('desbloqueoNivel', { n:g.unlock.unlockedLevel }));
    if(g.unlock && g.unlock.firstTime) out.push(DF.i18n.t('desbloqueoPrendas'));
    if(g.passed) out.push(DF.esc(DF.levels[n - 1].caso.devolucion.split('.')[0] + '.'));
    else out.push(DF.esc(DF.i18n.t('nivelPerdido')) + ' · ' + DF.esc(DF.i18n.t('reintentarNivel')));
    return out.join(' ');
  }

  /* ---------- botones ---------- */
  function botones(g){
    const pending = DF.progress.nextPending();
    const b = [];
    if(pending) b.push('<a class="btn" id="btn-sig" href="nivel-titulo.html?n=' + pending + '">' + DF.esc(DF.i18n.t('sigNivel')) + '</a>');
    else if(DF.progress.allPlayed()) b.push('<a class="btn" id="btn-sig" href="fin.html">' + DF.esc(DF.i18n.t('verFinal')) + '</a>');
    b.push('<a class="btn dark" id="btn-reint" href="nivel-titulo.html?n=' + n + '">' + DF.esc(DF.i18n.t('reintentarNivel')) + '</a>');
    b.push('<a class="btn dark" id="btn-niv" href="niveles.html">' + DF.esc(DF.i18n.t('alNiveles')) + '</a>');
    el('res-btns').innerHTML = b.join('');

    /* Reintentar descarta la partida y vuelve a empezar el nivel */
    document.getElementById('btn-reint').addEventListener('click', () => DF.run.restart(n));

    el('res-btns').querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => { stopCountdown(); }));
  }

  /* ---------- cuenta regresiva ---------- */
  let left = R.redirectSeconds;
  const cd = el('res-countdown');
  cd.textContent = DF.i18n.t('redirect', { s:left });
  const t = setInterval(() => {
    left--;
    if(left <= 0){ stopCountdown(); DF.nav.go('niveles.html'); return; }
    cd.textContent = DF.i18n.t('redirect', { s:left });
  }, 1000);
  function stopCountdown(){ clearInterval(t); cd.textContent = ''; }
  window.addEventListener('pagehide', stopCountdown);

  DF.audio.play(g.passed ? 'win' : 'lose');
}, { level:true, requiresUser:true });
