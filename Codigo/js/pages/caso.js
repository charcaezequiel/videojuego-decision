/* =========================================================
   caso.js · Las 3 carpetas del expediente
   - cada carpeta abre un documento a pantalla completa
   - la flecha → aparece recién cuando se leyeron las tres
   - lo leído se guarda en la partida, así una recarga no lo pierde
   ========================================================= */
DF.boot(() => {
  const n = DF.nav.level();
  const level = DF.levels[n - 1];
  const run = DF.run.open(n);
  const folders = document.getElementById('folders');
  const falta = document.getElementById('caso-falta');
  const overlay = document.getElementById('doc-overlay');
  const tab = document.getElementById('doc-tab');
  const sub = document.getElementById('doc-sub');
  const body = document.getElementById('doc-body');
  const track = document.getElementById('doc-track');

  const CARPETA = {
    denuncia:    { img:'folder-denuncia.png',    label:'denuncia' },
    testimonios: { img:'folder-testimonios.png', label:'testimonios' },
    pruebas:     { img:'folder-pruebas.png',     label:'pruebas' }
  };

  function marcarLeida(key){
    if(run.read[key]) return;
    run.read[key] = true;
    DF.run.save({ read:run.read });
    refresh();
  }

  function refresh(){
    const pendientes = DF.run.FOLDERS().filter(k => !run.read[k]).length;
    folders.querySelectorAll('.folder').forEach(b => {
      b.classList.toggle('read', !!run.read[b.dataset.doc]);
    });
    falta.textContent = pendientes
      ? DF.i18n.t(pendientes === 1 ? 'carpetaFalta1' : 'carpetaFalta', { n:pendientes })
      : '';
    DF.nav.enable('next', pendientes === 0);
  }

  /* ---------- contenido de cada documento ---------- */
  function paragraphs(list){
    return list.map(p => '<p>' + DF.esc(p) + '</p>').join('');
  }

  function content(key){
    if(key === 'denuncia') return paragraphs([level.caso.denuncia]);
    if(key === 'pruebas') return level.caso.pruebas.map(p =>
      '<p><b>' + DF.esc(p.titulo) + '</b><br>' + DF.esc(p.texto) + '</p>').join('');
    /* testimonios: se pueden "escuchar" si el navegador tiene voz */
    return level.caso.testimonios.map((t, i) => {
      const id = 'ts-' + i;
      return '<p><b>' + DF.esc(t.autor) + '</b><br>' +
        '<span id="' + id + '">' + DF.esc(t.texto) + '</span>' +
        (voiceOK() ? '<span class="wave" aria-hidden="true">' + '<span></span>'.repeat(28) + '</span>' +
          '<button type="button" class="btn play-audio" data-say="' + id + '">' + DF.i18n.t('audioDoc') + '</button>' : '') +
        '</p>';
    }).join('');
  }

  const voiceOK = () => 'speechSynthesis' in window;
  let waveTimer = null;

  function stopSpeak(){
    if(voiceOK()) window.speechSynthesis.cancel();
    clearInterval(waveTimer);
    waveTimer = null;
    overlay.querySelectorAll('.wave').forEach(w => w.classList.remove('playing'));
  }

  function speak(btn){
    const wave = btn.parentNode.querySelector('.wave');
    if(waveTimer){ stopSpeak(); return; }
    const text = document.getElementById(btn.dataset.say).textContent;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = DF.i18n.lang() === 'en' ? 'en-US' : 'es-AR';
    u.rate = 1.05;
    u.onend = stopSpeak;
    wave.classList.add('playing');
    let up = false;
    waveTimer = setInterval(() => {
      wave.querySelectorAll('span').forEach(s => {
        s.style.height = (up ? 12 : 4) + Math.round(Math.random() * (up ? 54 : 20)) + 'px';
      });
      up = !up;
    }, 130);
    window.speechSynthesis.speak(u);
  }

  /* ---------- abrir / cerrar ----------
     Una carpeta cuenta como leída cuando se cierra su documento. */
  let abierta = null;

  const bar = DF.scrollbar(body, track);

  function open(key){
    const meta = CARPETA[key];
    abierta = key;
    tab.innerHTML = '<img src="../assets/img/' + meta.img + '" alt="">' + DF.esc(DF.i18n.t(meta.label));
    sub.textContent = DF.i18n.t('nivel', { n:n }) + ' · ' + level.titulo;
    body.innerHTML = content(key);
    body.scrollTop = 0;
    overlay.classList.remove('hidden');
    body.querySelectorAll('.play-audio').forEach(b => b.addEventListener('click', () => speak(b)));
    requestAnimationFrame(() => { bar.update(); body.focus(); });
  }

  function close(){
    stopSpeak();
    overlay.classList.add('hidden');
    if(abierta) marcarLeida(abierta);
    abierta = null;
  }

  folders.innerHTML = DF.run.FOLDERS().map(k =>
    '<button type="button" class="folder" data-doc="' + k + '">' +
      '<img src="../assets/img/' + CARPETA[k].img + '" alt="">' +
      '<span class="nm">' + DF.esc(DF.i18n.t(CARPETA[k].label)) + '</span>' +
      '<span class="chk">✓ ' + DF.esc(DF.i18n.t('leer')) + '</span>' +
    '</button>').join('');
  folders.querySelectorAll('.folder').forEach(b => b.addEventListener('click', () => open(b.dataset.doc)));

  body.addEventListener('scroll', bar.update);
  document.getElementById('doc-back').addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !overlay.classList.contains('hidden')) close(); });

  refresh();
}, { level:true, requiresUser:true });
