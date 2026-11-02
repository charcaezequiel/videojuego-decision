/* =========================================================
   palabra.js · Desafío final: 3 palabras del caso
   - se escribe una palabra completa del mismo largo
   - verde = letra y lugar · amarillo = letra en otro lugar · gris = no está
   - 3 intentos por palabra; se pasa con 2 palabras
   - teclado de pantalla y teclado físico
   ========================================================= */
DF.boot(() => {
  const n = DF.nav.level();
  const R = DF.rules;
  const level = DF.levels[n - 1];
  const run = DF.run.open(n);

  const judgeBox = document.getElementById('clue-judge');
  const clueTxt = document.getElementById('clue-txt');
  const clueMeta = document.getElementById('clue-meta');
  const grid = document.getElementById('grid');
  const kb = document.getElementById('kb');

  judgeBox.innerHTML = DF.sprites.judge(2.2);
  clueTxt.textContent = level.pista;

  const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  const ROWS = [
    'QWERTYUIOP'.split(''),
    'ASDFGHJKLÑ'.split(''),
    ['enter'].concat('ZXCVBNM'.split(''), ['borrar'])
  ];

  /* palabra que falta: se retoma si la página se recargó a mitad del desafío */
  let wi = run.words.findIndex(w => !w.done);
  if(wi < 0){ DF.nav.go('resultado.html', n); return; }

  const answer = () => run.words[wi].word;
  const len = () => answer().length;
  const tries = () => run.words[wi].attempts.length;

  let guess = '';

  /* ---------- celdas ---------- */
  function cellSize(){
    const w = DF.stage.info ? DF.stage.info.w : 1280;
    return Math.max(30, Math.min(64, Math.floor((w * 0.78) / len()) - 6));
  }

  function drawGrid(){
    const cs = cellSize();
    grid.style.setProperty('--cs', cs + 'px');
    let html = '';
    for(let r = 0; r < R.attemptsPerWord; r++){
      const attempt = run.words[wi].attempts[r];
      const active = r === tries();
      let cells = '';
      for(let c = 0; c < len(); c++){
        let cls = 'cell', ch = '';
        if(attempt){
          ch = attempt.guess[c];
          cls += ' ' + attempt.states[c] + ' flip';
        } else if(active){
          ch = guess[c] || '';
          cls += ch ? ' active pop' : ' active';
        }
        cells += '<span class="' + cls + '"' + (attempt ? ' style="animation-delay:' + (c * 90) + 'ms"' : '') + '>' + ch + '</span>';
      }
      html += '<div class="row" data-r="' + r + '">' + cells + '</div>';
    }
    grid.innerHTML = html;
  }

  /* ---------- teclado ---------- */
  function drawKeys(){
    const used = {};
    run.words[wi].attempts.forEach(a => a.states.forEach((s, i) => {
      const rank = { good:3, near:2, miss:1 };
      const ch = a.guess[i];
      if(!used[ch] || rank[s] > rank[used[ch]]) used[ch] = s;
    }));
    kb.innerHTML = ROWS.map(row => '<div class="krow">' + row.map(k => {
      if(k === 'enter') return '<button type="button" class="key wide" data-key="enter">' + DF.i18n.t('enter') + '</button>';
      if(k === 'borrar') return '<button type="button" class="key wide" data-key="back">' + DF.i18n.t('borrar') + '</button>';
      return '<button type="button" class="key' + (used[k] ? ' ' + used[k] : '') + '" data-key="' + k + '">' + k + '</button>';
    }).join('') + '</div>').join('');
    kb.querySelectorAll('[data-key]').forEach(b => b.addEventListener('click', () => press(b.dataset.key)));
  }

  function drawMeta(){
    clueMeta.innerHTML = DF.esc(DF.i18n.t('palabra', { a:wi + 1, b:R.wordsPerLevel })) +
      ' · ' + DF.esc(DF.i18n.t('letras', { n:len() })) +
      '<br>' + DF.esc(DF.i18n.t('intento', { a:Math.min(tries() + 1, R.attemptsPerWord), b:R.attemptsPerWord }));
  }

  function refresh(){ drawGrid(); drawKeys(); drawMeta(); }

  /* ---------- evaluar un intento ---------- */
  function statesOf(text){
    const a = answer(), out = new Array(a.length).fill('miss');
    const pool = a.split('');
    text.split('').forEach((ch, i) => {
      if(a[i] === ch){ out[i] = 'good'; pool[i] = null; }
    });
    text.split('').forEach((ch, i) => {
      if(out[i] === 'good') return;
      const j = pool.indexOf(ch);
      if(j >= 0){ out[i] = 'near'; pool[j] = null; }
    });
    return out;
  }

  function submit(){
    if(guess.length !== len()){
      DF.toast(guess.length < len() ? DF.i18n.t('pocasLetras') : DF.i18n.t('letras', { n:len() }));
      const row = grid.querySelector('.row[data-r="' + tries() + '"]');
      if(row){ row.classList.add('shake'); setTimeout(() => row.classList.remove('shake'), 400); }
      return;
    }
    const solved = guess.toUpperCase() === answer();
    run.words[wi].attempts.push({ guess:guess.toUpperCase(), states:statesOf(guess.toUpperCase()) });
    DF.audio.play(solved ? 'ok' : 'bad');
    guess = '';
    if(solved){
      run.words[wi].solved = true;
      run.words[wi].done = true;
      DF.run.save({ words:run.words });
      refresh();
      setTimeout(advance, 1300);
      return;
    }
    if(tries() >= R.attemptsPerWord){
      run.words[wi].done = true;
      DF.run.save({ words:run.words });
      reveal();
      setTimeout(advance, 2200);
      return;
    }
    DF.run.save({ words:run.words });
    refresh();
  }

  /* Palabra fallada: se muestra cuál era, letra por letra */
  function reveal(){
    const row = grid.querySelector('.row[data-r="' + (R.attemptsPerWord - 1) + '"]');
    if(!row) return;
    row.querySelectorAll('.cell').forEach((c, i) => {
      c.textContent = answer()[i];
      c.className = 'cell good flip';
      c.style.animationDelay = (i * 90) + 'ms';
    });
  }

  function advance(){
    if(wi >= R.wordsPerLevel - 1){ DF.nav.go('resultado.html', n); return; }
    wi++;
    guess = '';
    refresh();
  }

  function press(k){
    if(k === 'enter'){ submit(); return; }
    if(k === 'back'){ guess = guess.slice(0, -1); DF.audio.play('key'); drawGrid(); drawMeta(); return; }
    if(guess.length < len()){ guess += k; DF.audio.play('key'); drawGrid(); }
  }

  document.addEventListener('keydown', e => {
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    if(e.key === 'Enter'){ e.preventDefault(); submit(); return; }
    if(e.key === 'Backspace'){ e.preventDefault(); press('back'); return; }
    const ch = e.key.toUpperCase();
    if(ALPHABET.indexOf(ch) >= 0){ e.preventDefault(); press(ch); }
  });

  /* el color del teclado se apaga al cambiar de palabra */
  refresh();
}, { level:true, requiresUser:true });
