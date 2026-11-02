/* =========================================================
   manual.js · Texto del manual (solo datos, sin lógica)
   Los números del juego se leen de DF.rules (niveles.js),
   así el manual nunca queda desactualizado.
   ========================================================= */
window.DF = window.DF || {};

(function(){
  const R = DF.rules || {};
  const s = n => (n === undefined ? '—' : String(n));

  DF.manual = [
    {
      h2: 'QUÉ ES DECISIÓN FINAL',
      p: [
        'Decisión Final es un juego de Educación Ciudadana: vos sos la abogada o el abogado que defiende un caso ' +
        'en un tribunal. Hay ' + s(R.levels || 10) + ' casos, cada uno con ' + s(R.questionCount) + ' preguntas y un desafío final de ' +
        s(R.wordsPerLevel) + ' palabras.',
        'Cada caso está basado en derechos reales de la Constitución Nacional y las leyes argentinas. Antes de ' +
        'jugar podés leer las tres carpetas del expediente: la denuncia, los testimonios y las pruebas.'
      ]
    },
    {
      h2: 'CÓMO SE JUEGA',
      p: [
        '1. Registrás tu correo y tu usuario de jugador.',
        '2. Elegís un nivel en "Selección de nivel". El nivel 1 está siempre abierto; cada nivel que terminás ' +
        '(ganado o perdido) desbloquea el siguiente.',
        '3. Leés las tres carpetas del caso. La flecha → aparece recién cuando las leíste todas.',
        '4. Escuchás la introducción del juez y tocás la flecha → para entrar al cuestionario.',
        '5. Respondés ' + s(R.questionCount) + ' preguntas. Después llega el desafío de palabras y, al final, el resultado.'
      ]
    },
    {
      h2: 'LAS PREGUNTAS',
      p: [
        'Cada pregunta tiene ' + s(R.seconds) + ' segundos y cuatro opciones. Se puede responder con el mouse o el ' +
        'dedo, con las flechas o WASD más Enter, o con las teclas 1 a 4.',
        'Solo hay una respuesta por pregunta: una vez que elegís, no se puede volver atrás en esa pregunta.',
        'Respuesta correcta: ' + s(R.correctPoints) + ' puntos más un bonus de rapidez de hasta ' + s(R.maxSpeedBonus) + ' puntos ' +
        '(si te queda poco tiempo, el bonus es chico).',
        'Si llega a cero el reloj, la pregunta queda "sin responder" y se muestra la devolución del caso.',
        'La primera pregunta de cada nivel es la pregunta oficial del caso; al responderla aparece la devolución ' +
        'completa del juez, que explica qué derecho estaba en juego.'
      ]
    },
    {
      h2: 'EL DESAFÍO DE PALABRAS',
      p: [
        'Terminadas las preguntas, el juez te propone ' + s(R.wordsPerLevel) + ' palabras relacionadas con el caso.',
        'Cada palabra se adivina escribiendo una palabra completa del mismo largo, con el teclado de pantalla o el ' +
        'teclado físico. Tenés ' + s(R.attemptsPerWord) + ' intentos por palabra.',
        'Verde: la letra está y va en ese lugar. Amarillo: la letra está pero en otro lugar. Gris: esa letra no está ' +
        'en la palabra.',
        'Cada palabra acertada suma ' + s(R.wordPoints) + ' puntos.'
      ]
    },
    {
      h2: 'GANAR, PERDER Y ESTRELLAS',
      p: [
        'Para ganar un nivel necesitás por lo menos ' + s(R.minCorrect) + ' respuestas correctas ' +
        'y ' + s(R.minWords) + ' de las ' + s(R.wordsPerLevel) + ' palabras del desafío.',
        'El puntaje máximo de un nivel es ' + s(R.maxScore) + ' puntos. Con las estrellas se mira qué tanto de ese ' +
        'máximo alcanzaste.',
        'Perder un nivel no bloquea nada: podés reintentarlo cuantas veces quieras y se guarda tu mejor resultado.',
        'En la pantalla de Resultado, si no tocás nada el juego vuelve solo a Selección de nivel en ' +
        s(R.redirectSeconds) + ' segundos.'
      ]
    },
    {
      h2: 'VESTÍ A TU PERSONAJE',
      p: [
        'Con cada nivel que terminás se desbloquean prendas nuevas. Hay doce categorías: pelo, gorros, auriculares, ' +
        'bufandas, varios, barbijos, gafas, collares, pins, bolsos, mano y mascotas.',
        'Se usa una sola prenda por categoría: tocás una para ponérsela y la tocás de nuevo para sacársela.',
        'La bufanda y el collar no se pueden usar juntos: si cambiás uno, el otro se saca solo.',
        'El tono de piel se elige con los circulitos de abajo del personaje.'
      ]
    },
    {
      h2: 'LAS FLECHAS Y LOS CONTROLES',
      p: [
        'La flecha ← vuelve a la pantalla anterior y la flecha → avanza. También funcionan las teclas ← y →.',
        'Una flecha solo aparece si tiene a dónde ir: no hay flechas grises que no hagan nada.',
        'En las preguntas y en el desafío de palabras las flechas del teclado sirven para elegir, no para salir; ahí ' +
        'la flecha ← te lleva directo al menú principal y se descarta el intento del nivel.',
        'En Configuración podés cambiar el volumen, la música, el brillo, el idioma (español / inglés) y los gráficos.'
      ]
    },
    {
      h2: 'TU PROGRESO',
      p: [
        'Todo se guarda en este navegador, separado por cuenta: tus puntos, los niveles jugados y ganados, tus ' +
        'mejores resultados y tu personaje.',
        'Si escribís el mismo correo otra vez, recuperás tu progreso. Si escribís un correo nuevo, empezás de cero.',
        '"Cambiar de cuenta" cierra la sesión: los datos siguen guardados, pero la partida en curso se borra para ' +
        'que otra persona no pueda terminarla en tu lugar.',
        'No hay contraseñas: cuidá el correo que usás si jugás en una computadora compartida.'
      ]
    }
  ];

  /* Créditos de los recursos originales del proyecto */
  DF.creditos = [
    'Decisión Final — Defendiendo la justicia. Un píxel a la vez.',
    'Proyecto final de Educación Ciudadana · grupo LPC.',
    'Contenido: casos de la Constitución Nacional y las leyes argentinas.',
    'Arte pixel, música y generadores: hechos por el propio proyecto (herramientas en /tools).',
    'Fuentes: Bebas Neue, Instrument Serif y Quicksand (SIL Open Font License).'
  ];
})();
