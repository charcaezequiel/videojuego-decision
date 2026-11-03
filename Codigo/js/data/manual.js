/* =========================================================
   manual.js · Texto del manual (solo datos, sin lógica)
   Los números del juego se leen de DF.rules (niveles.js),
   así el manual nunca queda desactualizado.
   Cada texto es un par [español, inglés]: DF.manualPara(lang)
   arma el bloque del idioma activo.
   ========================================================= */
window.DF = window.DF || {};

(function(){
  const R = DF.rules || {};
  const s = n => (n === undefined ? '—' : String(n));

  const M = [
    {
      h2: ['QUÉ ES DECISIÓN FINAL', 'WHAT DECISIÓN FINAL IS'],
      p: [
        ['Decisión Final es un juego de Educación Ciudadana: vos sos la abogada o el abogado que defiende un caso ' +
         'en un tribunal. Hay ' + s(R.levels || 10) + ' casos, cada uno con ' + s(R.questionCount) + ' preguntas y un desafío final de ' +
         s(R.wordsPerLevel) + ' palabras.',
         'Decisión Final is a Civic Education game: you are the lawyer who defends a case in a courtroom. There are ' +
         s(R.levels || 10) + ' cases, each with ' + s(R.questionCount) + ' questions and a final challenge of ' + s(R.wordsPerLevel) + ' words.'],
        ['Cada caso está basado en derechos reales de la Constitución Nacional y las leyes argentinas. Antes de ' +
         'jugar podés leer las tres carpetas del expediente: la denuncia, los testimonios y las pruebas.',
         'Every case is based on real rights from the National Constitution and Argentine laws. Before playing you can ' +
         'read the three folders of the case file: the complaint, the testimonies and the evidence.']
      ]
    },
    {
      h2: ['CÓMO SE JUEGA', 'HOW THE GAME WORKS'],
      p: [
        ['1. Registrás tu correo y tu usuario de jugador.', '1. Register your email and your player username.'],
        ['2. Elegís un nivel en "Selección de nivel". El nivel 1 está siempre abierto; cada nivel que terminás ' +
         '(ganado o perdido) desbloquea el siguiente.',
         '2. Pick a level in "Level select". Level 1 is always open; every level you finish, won or lost, unlocks the next one.'],
        ['3. Leés las tres carpetas del caso. La flecha → aparece recién cuando las leíste todas.',
         '3. Read the three folders of the case. The → arrow only appears once you have read them all.'],
        ['4. Escuchás la introducción del juez y tocás la flecha → para entrar al cuestionario.',
         '4. Listen to the judge’s introduction and press the → arrow to enter the quiz.'],
        ['5. Respondés ' + s(R.questionCount) + ' preguntas. Después llega el desafío de palabras y, al final, el resultado.',
         '5. Answer ' + s(R.questionCount) + ' questions. Then the word challenge arrives and, at the end, the result.']
      ]
    },
    {
      h2: ['LAS PREGUNTAS', 'THE QUESTIONS'],
      p: [
        ['Cada pregunta tiene ' + s(R.seconds) + ' segundos y cuatro opciones. Se puede responder con el mouse o el ' +
         'dedo, con las flechas o WASD más Enter, o con las teclas 1 a 4.',
         'Each question lasts ' + s(R.seconds) + ' seconds and has four options. You can answer with the mouse or your finger, ' +
         'with the arrows or WASD plus Enter, or with the keys 1 to 4.'],
        ['Solo hay una respuesta por pregunta: una vez que elegís, no se puede volver atrás en esa pregunta.',
         'There is only one answer per question: once you choose, you cannot go back to that question.'],
        ['Respuesta correcta: ' + s(R.correctPoints) + ' puntos más un bonus de rapidez de hasta ' + s(R.maxSpeedBonus) + ' puntos ' +
         '(si te queda poco tiempo, el bonus es chico).',
         'Correct answer: ' + s(R.correctPoints) + ' points plus a speed bonus of up to ' + s(R.maxSpeedBonus) + ' points ' +
         '(if little time is left, the bonus is small).'],
        ['Si llega a cero el reloj, la pregunta queda "sin responder" y se muestra la devolución del caso.',
         'If the clock reaches zero, the question counts as unanswered and the case feedback is shown.'],
        ['La primera pregunta de cada nivel es la pregunta oficial del caso; al responderla aparece la devolución ' +
         'completa del juez, que explica qué derecho estaba en juego.',
         'The first question of each level is the official question of the case; answering it shows the judge’s full feedback, ' +
         'which explains what right was at stake.']
      ]
    },
    {
      h2: ['EL DESAFÍO DE PALABRAS', 'THE WORD CHALLENGE'],
      p: [
        ['Terminadas las preguntas, el juez te propone ' + s(R.wordsPerLevel) + ' palabras relacionadas con el caso.',
         'Once the questions are done, the judge proposes ' + s(R.wordsPerLevel) + ' words related to the case.'],
        ['Cada palabra se adivina escribiendo una palabra completa del mismo largo, con el teclado de pantalla o el ' +
         'teclado físico. Tenés ' + s(R.attemptsPerWord) + ' intentos por palabra.',
         'Each word is guessed by writing a whole word of the same length, with the on-screen keyboard or the physical one. ' +
         'You have ' + s(R.attemptsPerWord) + ' tries per word.'],
        ['Verde: la letra está y va en ese lugar. Amarillo: la letra está pero en otro lugar. Gris: esa letra no está ' +
         'en la palabra.',
         'Green: the letter is in the word and in that spot. Yellow: the letter is in the word but somewhere else. ' +
         'Grey: that letter is not in the word.'],
        ['Cada palabra acertada suma ' + s(R.wordPoints) + ' puntos.',
         'Every word you solve adds ' + s(R.wordPoints) + ' points.']
      ]
    },
    {
      h2: ['GANAR, PERDER Y ESTRELLAS', 'WINNING, LOSING AND STARS'],
      p: [
        ['Para ganar un nivel necesitás por lo menos ' + s(R.minCorrect) + ' respuestas correctas ' +
         'y ' + s(R.minWords) + ' de las ' + s(R.wordsPerLevel) + ' palabras del desafío.',
         'To win a level you need at least ' + s(R.minCorrect) + ' correct answers and ' + s(R.minWords) + ' of the ' +
         s(R.wordsPerLevel) + ' words of the challenge.'],
        ['El puntaje máximo de un nivel es ' + s(R.maxScore) + ' puntos. Con las estrellas se mira qué tanto de ese ' +
         'máximo alcanzaste.',
         'The highest score of a level is ' + s(R.maxScore) + ' points. The stars measure how much of that maximum you reached.'],
        ['Perder un nivel no bloquea nada: podés reintentarlo cuantas veces quieras y se guarda tu mejor resultado.',
         'Losing a level blocks nothing: you can retry it as many times as you want and your best result is kept.'],
        ['En la pantalla de Resultado, si no tocás nada el juego vuelve solo a Selección de nivel en ' +
         s(R.redirectSeconds) + ' segundos.',
         'On the Result screen, if you touch nothing the game goes back to Level select on its own in ' +
         s(R.redirectSeconds) + ' seconds.']
      ]
    },
    {
      h2: ['VESTÍ A TU PERSONAJE', 'DRESS YOUR CHARACTER'],
      p: [
        ['Con cada nivel que terminás se desbloquean prendas nuevas. Hay doce categorías: pelo, gorros, auriculares, ' +
         'bufandas, varios, barbijos, gafas, collares, pins, bolsos, mano y mascotas.',
         'Every level you finish unlocks new items. There are twelve categories: hair, hats, headphones, scarves, ' +
         'misc, masks, glasses, necklaces, pins, bags, hand and pets.'],
        ['Se usa una sola prenda por categoría: tocás una para ponérsela y la tocás de nuevo para sacársela.',
         'Only one item per category: tap one to put it on, tap it again to take it off.'],
        ['La bufanda y el collar no se pueden usar juntos: si cambiás uno, el otro se saca solo.',
         'The scarf and the necklace cannot be worn together: if you change one, the other comes off by itself.'],
        ['El tono de piel se elige con los circulitos de abajo del personaje.',
         'The skin tone is picked with the little circles under the character.']
      ]
    },
    {
      h2: ['LAS FLECHAS Y LOS CONTROLES', 'THE ARROWS AND THE CONTROLS'],
      p: [
        ['La flecha ← vuelve a la pantalla anterior y la flecha → avanza. También funcionan las teclas ← y →.',
         'The ← arrow goes back to the previous screen and the → arrow moves forward. The ← and → keys work too.'],
        ['Una flecha solo aparece si tiene a dónde ir: no hay flechas grises que no hagan nada.',
         'An arrow only appears if it has somewhere to go: there are no grey arrows that do nothing.'],
        ['En las preguntas y en el desafío de palabras las flechas del teclado sirven para elegir, no para salir; ahí ' +
         'la flecha ← te lleva directo al menú principal y se descarta el intento del nivel.',
         'In the questions and in the word challenge the keyboard arrows are for choosing, not for leaving; there the ' +
         '← arrow takes you straight to the main menu and the level attempt is discarded.'],
        ['En Configuración podés cambiar el volumen, la música, el brillo, el idioma (español / inglés) y los gráficos.',
         'In Settings you can change the volume, the music, the brightness, the language (Spanish / English) and the graphics.']
      ]
    },
    {
      h2: ['TU PROGRESO', 'YOUR PROGRESS'],
      p: [
        ['Todo se guarda en este navegador, separado por cuenta: tus puntos, los niveles jugados y ganados, tus ' +
         'mejores resultados y tu personaje.',
         'Everything is saved in this browser, separated by account: your points, the levels played and won, your best ' +
         'results and your character.'],
        ['Si escribís el mismo correo otra vez, recuperás tu progreso. Si escribís un correo nuevo, empezás de cero.',
         'If you type the same email again you get your progress back. If you type a new email you start from zero.'],
        ['"Cambiar de cuenta" cierra la sesión: los datos siguen guardados, pero la partida en curso se borra para ' +
         'que otra persona no pueda terminarla en tu lugar.',
         '"Switch account" closes the session: the data stays saved, but the run in progress is erased so another person ' +
         'cannot finish it in your place.'],
        ['No hay contraseñas: cuidá el correo que usás si jugás en una computadora compartida.',
         'There are no passwords: be careful with the email you use if you play on a shared computer.']
      ]
    }
  ];

  /* Créditos de los recursos originales del proyecto */
  const C = [
    ['Decisión Final — Defendiendo la justicia. Un píxel a la vez.',
     'Decisión Final — Defending justice. One pixel at a time.'],
    ['Proyecto final de Educación Ciudadana · grupo LPC.',
     'Final project for Civic Education · LPC group.'],
    ['Contenido: casos de la Constitución Nacional y las leyes argentinas.',
     'Content: cases from the National Constitution and Argentine laws.'],
    ['Arte pixel, música y generadores: hechos por el propio proyecto (herramientas en /tools).',
     'Pixel art, music and generators: made by the project itself (tools in /tools).'],
    ['Fuentes: Bebas Neue, Instrument Serif y Quicksand (SIL Open Font License).',
     'Fonts: Bebas Neue, Instrument Serif and Quicksand (SIL Open Font License).']
  ];

  const pick = (pair, i) => pair[i ? 1 : 0];

  /* Devuelve el manual en el idioma pedido (0 = es, 1 = en) */
  DF.manualPara = lang => {
    const i = lang === 'en' ? 1 : 0;
    return {
      secciones: M.map(b => ({ h2: pick(b.h2, i), p: b.p.map(x => pick(x, i)) })),
      creditos: C.map(x => pick(x, i))
    };
  };

  const activo = DF.i18n ? DF.i18n.lang() : 'es';
  DF.manual = DF.manualPara(activo).secciones;
  DF.creditos = DF.manualPara(activo).creditos;
})();
