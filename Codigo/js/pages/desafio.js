/* =========================================================
   desafio.js · Las 10 preguntas del nivel (20 s cada una)
   - un temporizador por pregunta
   - una sola respuesta: después de elegir no se vuelve atrás
   - mouse/toque, flechas o WASD + Enter, o teclas 1-4
   - la pregunta oficial muestra la devolución del caso
   - la flecha ← de esta pantalla lleva al menú (ver DF.nav.ROUTES)
   ========================================================= */
DF.boot(() => {
  const n = DF.nav.level();
  const R = DF.rules;
  const level = DF.levels[n - 1];
  const run = DF.run.open(n);

  const court = document.getElementById('court');
  const barFill = document.getElementById('qt-fill');
  const meta = document.getElementById('q-meta');
  const timerEl = document.getElementById('q-timer');
  const secsEl = document.getElementById('q-secs');
  const qText = document.getElementById('q-text');
  const qOpts = document.getElementById('q-opts');

  court.innerHTML = DF.sprites.courtScene();
  DF.nav.keys(false);              // acá las flechas eligen, no cambian de pantalla

  const LETTER = ['A', 'B', 'C', 'D'];
  let i = Math.min(run.answers.length, R.questionCount - 1);
  let current = null;              // pregunta en pantalla
  let picked = null;               // opción resaltada con el teclado
  let locked = false;              // ya se respondió
  let timer = null;
  let advanceT = null;
  let nextStep = null;             // qué hacer cuando termina la devolución

  function renderCourt(scene){ DF.sprites.setScene(court, scene); }

  /* El enunciado tiene que entrar entero: el caja es de alto fijo y en vertical
     la letra es más grande. Si desborda, se baja el tamaño de a 2 px. */
  function fitText(el, min){
    el.style.fontSize = '';
    let size = parseFloat(getComputedStyle(el).fontSize) || 26;
    while(size > min && el.scrollHeight > el.clientHeight + 2){
      size -= 2;
      el.style.fontSize = size + 'px';
    }
  }

  function showQuestion(){
    current = DF.run.question(n, i);
    picked = null;
    locked = false;
    qText.className = 'q-text';
    qText.innerHTML = DF.esc(current.q);
    fitText(qText, 18);
    qOpts.innerHTML = current.opts.map((o, k) =>
      '<button type="button" class="q-opt" data-k="' + k + '"><b>' + LETTER[k] + '</b><span>' + DF.esc(o) + '</span></button>'
    ).join('');
    qOpts.querySelectorAll('.q-opt').forEach(b =>
      b.addEventListener('click', () => { pick(+b.dataset.k); if(!locked) answer(+b.dataset.k); }));
    meta.textContent = DF.i18n.t('preguntaN', { a:i + 1, b:R.questionCount });
    timerEl.classList.remove('low', 'stopped');
    barFill.classList.remove('low');
    renderCourt('ask');
    timer.reset(R.seconds);
    timer.start();
  }

  /* El foco sigue a la selección: así Tab, las flechas y Enter no apuntan a
     opciones distintas. preventScroll evita que el escenario se mueva. */
  function pick(k, fromFocus){
    picked = k;
    qOpts.querySelectorAll('.q-opt').forEach(b => {
      const on = +b.dataset.k === k;
      b.classList.toggle('sel', on);
      if(on && !fromFocus && document.activeElement !== b) b.focus({ preventScroll:true });
    });
  }

  qOpts.addEventListener('focusin', e => {
    const b = e.target.closest('.q-opt');
    if(!b) return;
    const k = +b.dataset.k;
    if(k !== picked) pick(k, true);
  });

  function setBar(ratio){
    barFill.style.width = (ratio * 100).toFixed(1) + '%';
  }

  timer = DF.timer({
    seconds: R.seconds,
    onTick(secs, ratio){
      secsEl.textContent = secs;
      setBar(ratio);
      const low = ratio <= 0.25;
      timerEl.classList.toggle('low', low && !locked);
      barFill.classList.toggle('low', low && !locked);
    },
    onEnd(){ if(!locked) answer(null); }
  });

  function answer(k){
    if(locked) return;
    locked = true;
    timer.stop();
    timerEl.classList.add('stopped');
    const correct = k !== null && LETTER[k] === current.key;
    const secsLeft = timer.seconds;
    const pts = DF.run.pointsFor(correct, secsLeft);

    qOpts.querySelectorAll('.q-opt').forEach(b => {
      b.disabled = true;
      const kk = +b.dataset.k;
      if(LETTER[kk] === current.key) b.classList.add('right');
      else if(kk === k) b.classList.add('wrong');
    });

    const timeout = k === null;
    run.answers = run.answers.slice(0, i);
    run.answers.push({ q:i, choice:timeout ? null : LETTER[k], correct:correct, timeout:timeout, secs:secsLeft, pts:pts });
    DF.run.save({ answers:run.answers });

    DF.audio.play(correct ? 'ok' : 'bad');
    showFeedback(correct, timeout, pts);

    const last = i >= R.questionCount - 1;
    nextStep = last ? () => DF.nav.go('palabra.html', n) : () => { i++; showQuestion(); };
    advanceT = setTimeout(go, feedbackMs(correct, timeout));
  }

  /* Entrar o tocar durante la devolución no espera el temporizador */
  function go(){ if(nextStep){ const f = nextStep; nextStep = null; clearTimeout(advanceT); f(); } }

  /* La pregunta oficial trae la devolución completa del caso */
  const feedbackMs = (correct, timeout) =>
    (current.oficial || timeout || !correct) ? 5200 : 1500;

  function showFeedback(correct, timeout, pts){
    qText.style.fontSize = '';        // la devolución usa su propio tamaño
    if(current.oficial){
      qText.className = 'q-text feedback';
      qText.innerHTML = '<b>' + DF.esc(DF.i18n.t('devolucion')) + '</b>' + DF.esc(level.caso.devolucion);
      renderCourt('verdict');
      return;
    }
    if(timeout){
      qText.className = 'q-text feedback';
      qText.innerHTML = '<b>' + DF.esc(DF.i18n.t('tiempoAgotado')) + '</b>' +
        DF.esc(DF.i18n.t('respuestaEra', { w:current.opts[LETTER.indexOf(current.key)] }));
      return;
    }
    if(!correct){
      qText.className = 'q-text feedback';
      qText.innerHTML = '<b>' + DF.esc(DF.i18n.t('incorrecto')) + '</b>' +
        DF.esc(DF.i18n.t('respuestaEra', { w:current.opts[LETTER.indexOf(current.key)] }));
      return;
    }
    qText.className = 'q-text feedback';
    qText.innerHTML = '<b>' + DF.esc(DF.i18n.t('correcto')) + '</b>' + '+' + pts + ' ' + DF.esc(DF.i18n.t('puntos'));
  }

  /* ---------- teclado ---------- */
  /* .q-opts va en columnas: A/B a la izquierda, C/D a la derecha */
  const MOVE = {
    ArrowUp: k => k ^ 1, ArrowDown: k => k ^ 1, KeyS: k => k ^ 1, KeyW: k => k ^ 1,
    ArrowRight: k => Math.min(3, k + 2), KeyD: k => Math.min(3, k + 2),
    ArrowLeft: k => Math.max(0, k - 2), KeyA: k => Math.max(0, k - 2)
  };

  document.addEventListener('keydown', e => {
    if(locked){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); }
      return;
    }
    if(MOVE[e.code]){
      e.preventDefault();
      const base = picked === null ? (e.code === 'ArrowLeft' || e.code === 'KeyA' ? 2 : 0) : picked;
      pick(MOVE[e.code](base));
      DF.audio.play('key');
      return;
    }
    if(e.key >= '1' && e.key <= '4'){ e.preventDefault(); const k = +e.key - 1; pick(k); answer(k); return; }
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); if(picked !== null) answer(picked); }
  });

  /* Al salir de la pantalla se corta el reloj (volver al menú descarta el intento) */
  qText.addEventListener('click', () => { if(locked) go(); });

  window.addEventListener('pagehide', () => { timer.stop(); clearTimeout(advanceT); });

  secsEl.textContent = R.seconds;
  showQuestion();
}, { level:true, requiresUser:true });
