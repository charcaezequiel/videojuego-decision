/* =========================================================
   niveles.js · Selección de nivel + mini video tutorial
   - una fila por caso: bloqueado / disponible / ganado / perdido
   - "Siguiente nivel" lleva al primer nivel desbloqueado sin jugar
   - el tutorial solo se muestra si el video realmente carga
   ========================================================= */
DF.boot(() => {
  const list = document.getElementById('lvl-list');
  const next = document.getElementById('lvl-next');
  const total = DF.levels.length;

  /* ▶ dibujada con bloques de 2px, coherente con el resto del pixel art */
  const PLAY = 'M0 0h3v2H0zM0 2h7v2H0zM0 4h10v2H0zM0 6h12v2H0zM0 8h10v2H0zM0 10h7v2H0zM0 12h3v2H0z';
  const tri = '<svg viewBox="0 0 12 14" shape-rendering="crispEdges" aria-hidden="true"><path d="' + PLAY + '" fill="currentColor"/></svg>';
  const starRow = n => {
    let out = '';
    for(let i = 0; i < 3; i++) out += i < n ? '★' : '<span class="off">★</span>';
    return out;
  };

  function rows(){
    list.innerHTML = DF.levels.map(l => {
      const st = DF.progress.status(l.n);
      const r = DF.progress.result(l.n);
      const stateText = st === 'locked' ? DF.i18n.t('nivelBloq', { n:l.n - 1 })
                      : st === 'available' ? DF.i18n.t('nivelDisp')
                      : st === 'won' ? DF.i18n.t('nivelGanado')
                      : DF.i18n.t('nivelPerdido');
      const cls = st === 'locked' ? ' locked' : st === 'won' ? ' won' : st === 'lost' ? ' lost' : '';
      const isNext = st === 'available';
      return '<a class="lvl-row' + cls + (isNext ? ' next' : '') + '"' +
        (st === 'locked' ? ' href="#" aria-disabled="true"' : ' href="nivel-titulo.html?n=' + l.n + '"') +
        ' data-n="' + l.n + '">' +
        '<span class="dot">' + tri + '</span>' +
        '<span class="tag">' + DF.esc(DF.i18n.t('nivel', { n:l.n })) + '</span>' +
        '<span class="info"><span class="stars">' + starRow(r ? r.stars : 0) + '</span>' +
        '<span class="state">' + DF.esc(stateText) + '</span></span></a>';
    }).join('');

    list.querySelectorAll('.lvl-row').forEach(a => {
      if(a.getAttribute('aria-disabled')) a.addEventListener('click', e => {
        e.preventDefault();
        DF.toast(DF.i18n.t('nivelBloq', { n:+a.dataset.n - 1 }));
      });
    });

    const pending = DF.progress.nextPending();
    let goTo = null;
    if(pending) goTo = { href:'nivel-titulo.html?n=' + pending, label:DF.i18n.t('sigNivel') };
    else if(DF.progress.allPlayed()) goTo = { href:'fin.html', label:DF.i18n.t('verFinal') };
    next.classList.toggle('hidden', !goTo);
    if(goTo){ next.href = goTo.href; next.textContent = goTo.label; }
    /* el tutorial baja hasta el borde solo cuando no hay botón debajo */
    document.getElementById('tuto').classList.toggle('solo', !goTo);
    document.getElementById('tuto-nota').classList.toggle('solo', !goTo);
  }

  rows();

  const bar = DF.scrollbar(list, document.getElementById('lvl-track'));
  list.addEventListener('scroll', bar.update);
  window.addEventListener('resize', () => requestAnimationFrame(bar.update));
  requestAnimationFrame(bar.update);

  /* scroll con la rueda sobre la lista */
  list.addEventListener('wheel', e => { e.preventDefault(); list.scrollTop += e.deltaY; bar.update(); }, { passive:false });

  /* ---------- mini video tutorial ---------- */
  const tuto = document.getElementById('tuto');
  const video = document.getElementById('tuto-video');
  const play = document.getElementById('tuto-play');
  const sizeBtn = document.getElementById('tuto-size');
  const prog = document.getElementById('tuto-prog');
  const fill = document.getElementById('tuto-fill');
  const time = document.getElementById('tuto-time');
  const backdrop = document.getElementById('tuto-backdrop');

  const ICON = {
    play:'<svg viewBox="0 0 12 14"><path d="' + PLAY + '" fill="currentColor"/></svg>',
    pause:'<svg viewBox="0 0 12 14"><path d="M1 0h3v14H1zM8 0h3v14H8z" fill="currentColor"/></svg>',
    expand:'<svg viewBox="0 0 14 14"><path d="M0 0h6v2H2v4H0zM8 0h6v6h-2V2H8zM0 8h2v4h4v2H0zM12 8h2v6H8v-2h4z" fill="currentColor"/></svg>',
    shrink:'<svg viewBox="0 0 14 14"><path d="M6 0h2v6h6v2H8v6H6V8H0V6h6z" fill="currentColor"/></svg>'
  };

  function fmt(t){
    if(!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function show(on){
    tuto.classList.toggle('hidden', !on);
    /* el aviso aparece justo donde estaba el reproductor, y desaparece si
       al final el video llega (una red lenta manda los metadatos más tarde) */
    document.getElementById('tuto-nota').classList.toggle('hidden', on);
    if(!on) video.pause();
  }

  play.innerHTML = ICON.play;
  sizeBtn.innerHTML = ICON.expand;

  video.addEventListener('loadedmetadata', () => {
    if(video.duration > 0){ show(true); time.textContent = fmt(video.duration); }
  });
  video.addEventListener('error', () => show(false));

  /* el navegador puede tener el video en caché y haber cargado los datos
     antes de que este script se conectara al elemento */
  if(video.error) show(false);
  else if(video.readyState > 0 && video.duration > 0){
    show(true); time.textContent = fmt(video.duration);
  }

  /* Hay motores que no soportan el códec y no disparan ni `error` ni
     `loadedmetadata`: simplemente no cargan (así se comporta WebKit con este
     WebM/VP9). Sin esta espera el tutorial finge que nunca existió. */
  setTimeout(() => { if(video.readyState < 1 && !video.error) show(false); }, 6000);

  play.addEventListener('click', () => { video.paused ? video.play() : video.pause(); });
  video.addEventListener('click', () => { video.paused ? video.play() : video.pause(); });
  video.addEventListener('play', () => { play.innerHTML = ICON.pause; });
  video.addEventListener('pause', () => { play.innerHTML = ICON.play; });
  video.addEventListener('timeupdate', () => {
    const r = video.duration ? video.currentTime / video.duration : 0;
    fill.style.width = (r * 100) + '%';
    prog.setAttribute('aria-valuenow', Math.round(r * 100));
    time.textContent = fmt(video.currentTime);
  });

  function seek(clientX){
    const r = prog.getBoundingClientRect();
    const k = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    if(video.duration) video.currentTime = k * video.duration;
  }
  let scrubbing = false;
  prog.addEventListener('pointerdown', e => { scrubbing = true; prog.setPointerCapture(e.pointerId); seek(e.clientX); });
  prog.addEventListener('pointermove', e => { if(scrubbing) seek(e.clientX); });
  prog.addEventListener('pointerup', () => { scrubbing = false; });
  prog.addEventListener('keydown', e => {
    const step = (video.duration || 0) * 0.05;
    if(e.key === 'ArrowRight') video.currentTime = Math.min(video.duration, video.currentTime + step);
    else if(e.key === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - step);
    else return;
    e.preventDefault(); e.stopPropagation();
  });

  function big(on){
    tuto.classList.toggle('big', on);
    backdrop.classList.toggle('hidden', !on);
    sizeBtn.innerHTML = on ? ICON.shrink : ICON.expand;
    const label = DF.i18n.t(on ? 'tutoAchicar' : 'tutoAmpliar');
    sizeBtn.setAttribute('aria-label', label);
    sizeBtn.title = label;
  }
  sizeBtn.addEventListener('click', () => big(!tuto.classList.contains('big')));
  backdrop.addEventListener('click', () => big(false));
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && tuto.classList.contains('big')) big(false); });
}, { requiresUser:true });
