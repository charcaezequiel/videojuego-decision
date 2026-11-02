/* =========================================================
   juicio.js · Escena del tribunal antes del cuestionario
   El juez presenta el caso; se avanza tocando el diálogo.
   La flecha → aparece con la última línea.
   ========================================================= */
DF.boot(() => {
  const n = DF.nav.level();
  const level = DF.levels[n - 1];
  const court = document.getElementById('court');
  const speech = document.getElementById('speech');
  const txt = document.getElementById('speech-txt');
  const next = document.getElementById('juicio-next');

  court.innerHTML = DF.sprites.courtScene();

  const yo = DF.store.state.user || DF.i18n.t('jugador');
  const lines = [
    { scene:'judge',   who:DF.i18n.t('juez'),     text:'Buenos días. Sala ' + n + ', ' + level.titulo + '. ' + level.subtitulo + '.' },
    { scene:'judge',   who:DF.i18n.t('juez'),     text:'Las tres carpetas del expediente fueron leídas. Esta sala pasa a escuchar la defensa.' },
    { scene:'answer',  who:DF.i18n.t('jugador'),  text:yo + ': asumí la defensa de este caso y estoy listo para responder.' },
    { scene:'ask',     who:DF.i18n.t('fiscal'),   text:'Fiscalía: ' + level.caso.testimonios[0].autor + ' sostiene su versión de los hechos.' },
    { scene:'verdict', who:DF.i18n.t('juez'),     text:'Comienza el desafío: ' + DF.rules.questionCount + ' preguntas, ' + DF.rules.seconds + ' segundos cada una. Toque la flecha para empezar.' }
  ];

  let i = -1, typing = null, done = false;

  function type(text){
    clearInterval(typing);
    txt.textContent = '';
    speech.classList.remove('done');
    let k = 0;
    typing = setInterval(() => {
      k += 2;
      txt.textContent = text.slice(0, k);
      if(k >= text.length){ clearInterval(typing); typing = null; speech.classList.add('done'); }
    }, 18);
  }

  function show(line){
    DF.sprites.setScene(court, line.scene);
    DF.audio.play(line.scene === 'verdict' ? 'gavel' : 'click');
    type(line.text);
  }

  function advance(){
    if(typing){                     // el primer toque termina la línea
      clearInterval(typing); typing = null;
      txt.textContent = lines[i].text;
      speech.classList.add('done');
      return;
    }
    if(i >= lines.length - 1){ DF.nav.follow('next'); return; }
    i++;
    show(lines[i]);
    if(i === lines.length - 1){
      done = true;
      DF.nav.enable('next', true);
    } else {
      DF.nav.enable('next', false);
    }
  }

  DF.nav.enable('next', false);
  speech.addEventListener('click', advance);
  document.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); advance(); }
  });

  i = 0;
  show(lines[0]);
}, { level:true, requiresUser:true });
