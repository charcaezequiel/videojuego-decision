/* =========================================================
   i18n.js · Traducción de la interfaz (ES / EN)
   Uso en HTML: data-i18n="clave"  |  data-i18n-ph="clave" (placeholder)
   ========================================================= */
window.DF = window.DF || {};

DF.i18n = (function(){
  const dict = {
    es: {
      docTitle:'DF · Defendiendo la Justicia',
      comenzar:'COMENZAR', registro:'REGISTRO', correo:'Correo electrónico:', usuario:'Tu usuario:',
      phCorreo:'tuemail@correo.com', phUsuario:'Ej: abogado_pixel',
      errCorreo:'Ingresá un correo válido.', errUsuario:'El usuario debe tener entre 3 y 16 caracteres.',
      menu:'MENÚ', ranking:'RANKING', manual:'MANUAL DE JUEGO', config:'CONFIGURACIÓN', soporte:'SOPORTE',
      volumen:'Volumen:', brillo:'Brillo:', idioma:'Idioma:', graficos:'Gráficos:',
      vestir:'¡VESTÍ A TU PERSONAJE!', piel:'PIEL', pelo:'PELO', ropa:'ROPA', acc:'ACCESORIOS',
      vestirHint:'Con cada nivel vas a ir desbloqueando accesorios',
      nivelReq:'Nivel {n}', seleccionNivel:'SELECCIÓN DE NIVEL', nivel:'NIVEL {n}', nivelBloq:'Terminá el nivel {n} para desbloquear.',
      continuar:'CONTINUAR', siguiente:'SIGUIENTE',
      infoCaso:'INFORMACIÓN DEL CASO',
      carpetaHint:'En cada carpeta habrá información acerca del juicio. Cuando hayas leído todos los documentos tocá el botón con la flechita para empezar.',
      carpetaFalta:'Te falta leer {n} carpetas.',
      carpetaFalta1:'Te falta leer {n} carpeta.',
      testimonios:'Testimonios', denuncia:'Denuncia', pruebas:'Pruebas',
      empezarDesafio:'EMPEZAR DESAFÍO', desafio:'DESAFÍO DE NIVEL',
      intento:'Intento {a} de {b}', palabra:'Palabra {a} de {b}', letras:'{n} letras',
      correcto:'¡CORRECTO!', incorrecto:'INCORRECTO', pocasLetras:'Faltan letras.',
      resultado:'RESULTADO', aprobado:'¡CASO GANADO!', fallido:'CASO PERDIDO', puntos:'Puntos', reintentar:'REINTENTAR', sigNivel:'SIGUIENTE NIVEL', alMenu:'MENÚ', alNiveles:'NIVELES', reintentarPalabras:'REINTENTAR DESAFÍO', palabrasRes:'Palabras: {a} de {b}', respuestaEra:'LA RESPUESTA ERA: {w}', aciertos:'Aciertos: {a} de {b}', tiempoAgotado:'¡TIEMPO AGOTADO!', preguntaN:'Pregunta {a} de {b}',
      desbloqueo:'¡Desbloqueaste prendas nuevas! Pasá por "Vestí a tu personaje".',
      faq1q:'¿Qué debo hacer durante el juicio?', faq1a:'Analizá las pruebas, escuchá los testimonios y tomá decisiones para intentar resolver el caso correctamente.',
      faq2q:'¿Qué pasa si presento una prueba incorrecta?', faq2a:'Podés perder una parte de tu puntuación o avanzar hacia una resolución desfavorable del caso.',
      contactanos:'CONTÁCTANOS', mensaje:'Tu mensaje:', phMensaje:'Contanos qué pasó…', enviar:'ENVIAR', cerrar:'CERRAR', enviado:'¡Mensaje enviado!',
      tuNombre:'Vos', manualTxt1:'1. Vestí a tu personaje.', manualTxt2:'2. Seleccioná con el mouse las prendas que tengas disponibles.',
      manualTxt3:'3. Volvé para atrás y jugá para obtener más recompensas.',
      manualTxt4:'Usá el mouse para tocar los botones y las teclas (flechas o WASD, Enter para confirmar; también 1-4) para responder las preguntas. Tenés 20 segundos por pregunta.',
      borrar:'BORRAR', enter:'ENTER', jugador:'Jugador', pts:'pts', leer:'Leído', pistaLabel:'Pista',
      reproducir:'REPRODUCIR', pausar:'PAUSAR', volver:'Volver',
      nivelDisp:'Disponible', nivelGanado:'Ganado', nivelPerdido:'Perdido · podés reintentar',
      correctas:'Correctas: {n}', incorrectas:'Incorrectas: {n}', sinResponder:'Sin responder: {n}', desafioFinal:'Desafío final: {a} de {b} palabras',
      redirect:'Volviendo a la Selección de nivel en {s} s…', verFinal:'VER FINAL', reintentarNivel:'REINTENTAR NIVEL',
      desbloqueoNivel:'¡Se desbloqueó el nivel {n}!', desbloqueoPrendas:'¡Nuevos accesorios en "Vestí a tu personaje"!',
      prendaBloq:'Terminá el nivel {n} para desbloquearlo.', excluye:'La bufanda y el collar no se pueden usar juntos: se cambió uno por otro.',
      devolucion:'DEVOLUCIÓN', fiscal:'FISCAL', juez:'JUEZ', segundos:'segundos',
      finTitulo:'¡CASOS CERRADOS!', finSub:'Terminaste los {n} casos de Decisión Final.', finGanados:'Casos ganados: {a} de {b}', finPuntos:'Puntaje total: {p}',
      finTexto:'Podés volver a jugar cualquier nivel para mejorar tu puntaje y seguir vistiendo a tu personaje.',
      manualTit:'MANUAL DE JUEGO', manualTeclas:'Usá el mouse para tocar los botones y las teclas para responder las preguntas.',
      seguir:'Tocá para continuar',
      cambiarCuenta:'CAMBIAR DE CUENTA', musica:'Música:',
      tutorial:'TUTORIAL', tutoVer:'Ver tutorial', tutoAmpliar:'Ampliar video', tutoAchicar:'Achicar video', tutoCerrar:'Cerrar tutorial',
      sinCuentas:'Todavía no hay cuentas en esta computadora. Registrá la primera.',
      tutoNoVideo:'El video tutorial no está cargado. El manual alcanza para jugar.',
      leerTodo:'Leé las tres carpetas para empezar.', audioDoc:'Escuchá el audio', palabraEra:'Era: {w}'
    },
    en: {
      docTitle:'DF · Defending Justice',
      comenzar:'START', registro:'SIGN UP', correo:'Email:', usuario:'Player username:',
      phCorreo:'youremail@mail.com', phUsuario:'E.g.: pixel_lawyer',
      errCorreo:'Enter a valid email.', errUsuario:'Username must be 3 to 16 characters long.',
      menu:'MENU', ranking:'RANKING', manual:'GAME MANUAL', config:'SETTINGS', soporte:'SUPPORT',
      volumen:'Volume:', brillo:'Brightness:', idioma:'Language:', graficos:'Graphics:',
      vestir:'DRESS YOUR CHARACTER!', piel:'SKIN', pelo:'HAIR', ropa:'CLOTHES', acc:'ACCESSORIES',
      vestirHint:'Each level you finish unlocks new accessories',
      nivelReq:'Level {n}', seleccionNivel:'LEVEL SELECT', nivel:'LEVEL {n}', nivelBloq:'Finish level {n} to unlock.',
      continuar:'CONTINUE', siguiente:'NEXT',
      infoCaso:'CASE FILE',
      carpetaHint:'Each folder holds information about the trial. When you have read every document, press the little arrow to begin.',
      carpetaFalta:'You still have {n} folders to read.',
      carpetaFalta1:'You still have {n} folder to read.',
      testimonios:'Testimonies', denuncia:'Complaint', pruebas:'Evidence',
      empezarDesafio:'START CHALLENGE', desafio:'LEVEL CHALLENGE',
      intento:'Try {a} of {b}', palabra:'Word {a} of {b}', letras:'{n} letters',
      correcto:'CORRECT!', incorrecto:'INCORRECT', pocasLetras:'Not enough letters.',
      resultado:'RESULT', aprobado:'CASE WON!', fallido:'CASE LOST', puntos:'Points', reintentar:'TRY AGAIN', sigNivel:'NEXT LEVEL', alMenu:'MENU', alNiveles:'LEVELS', reintentarPalabras:'RETRY CHALLENGE', palabrasRes:'Words: {a} of {b}', respuestaEra:'THE ANSWER WAS: {w}', aciertos:'Correct: {a} of {b}', tiempoAgotado:'TIME IS UP!', preguntaN:'Question {a} of {b}',
      desbloqueo:'You unlocked new items! Visit "Dress your character".',
      faq1q:'What should I do during the trial?', faq1a:'Analyze the evidence, listen to the testimonies and make decisions to try to solve the case correctly.',
      faq2q:'What happens if I present the wrong evidence?', faq2a:'You may lose part of your score or head toward an unfavorable ruling.',
      contactanos:'CONTACT US', mensaje:'Your message:', phMensaje:'Tell us what happened…', enviar:'SEND', cerrar:'CLOSE', enviado:'Message sent!',
      tuNombre:'You', manualTxt1:'1. Dress your character.', manualTxt2:'2. Pick with the mouse the items you have available.',
      manualTxt3:'3. Go back and play to earn more rewards.',
      manualTxt4:'Use the mouse to press buttons and the keys (arrows or WASD, Enter to confirm; also 1-4) to answer questions. You have 20 seconds per question.',
      borrar:'DELETE', enter:'ENTER', jugador:'Player', pts:'pts', leer:'Read', pistaLabel:'Clue',
      reproducir:'PLAY', pausar:'PAUSE', volver:'Back',
      nivelDisp:'Available', nivelGanado:'Won', nivelPerdido:'Lost · you can retry',
      correctas:'Correct: {n}', incorrectas:'Wrong: {n}', sinResponder:'Unanswered: {n}', desafioFinal:'Final challenge: {a} of {b} words',
      redirect:'Back to Level select in {s} s…', verFinal:'SEE ENDING', reintentarNivel:'RETRY LEVEL',
      desbloqueoNivel:'Level {n} unlocked!', desbloqueoPrendas:'New accessories in "Dress your character"!',
      prendaBloq:'Finish level {n} to unlock it.', excluye:'Scarf and necklace can\'t be worn together: one replaced the other.',
      devolucion:'FEEDBACK', fiscal:'PROSECUTOR', juez:'JUDGE', segundos:'seconds',
      finTitulo:'CASES CLOSED!', finSub:'You finished all {n} cases of Decisión Final.', finGanados:'Cases won: {a} of {b}', finPuntos:'Total score: {p}',
      finTexto:'You can replay any level to improve your score and keep dressing your character.',
      manualTit:'GAME MANUAL', manualTeclas:'Use the mouse to press buttons and the keys to answer questions.',
      seguir:'Tap to continue',
      cambiarCuenta:'SWITCH ACCOUNT', musica:'Music:',
      tutorial:'TUTORIAL', tutoVer:'Watch tutorial', tutoAmpliar:'Enlarge video', tutoAchicar:'Shrink video', tutoCerrar:'Close tutorial',
      sinCuentas:'No accounts on this computer yet. Create the first one.',
      tutoNoVideo:'The tutorial video isn’t loaded. The manual covers everything.',
      leerTodo:'Read all three folders to start.', audioDoc:'Play the audio', palabraEra:'It was: {w}'
    }
  };

  function lang(){ return (DF.store.state.settings.lang in dict) ? DF.store.state.settings.lang : 'es'; }

  function t(key, vars){
    let s = (dict[lang()][key] !== undefined ? dict[lang()][key] : dict.es[key]);
    if(s === undefined) return key;
    if(vars) for(const k in vars) s = s.split('{'+k+'}').join(vars[k]);
    return s;
  }

  function apply(root){
    root = root || document;
    document.documentElement.lang = lang();
    document.title = t('docTitle');
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); el.title = t(el.dataset.i18nAria); });
  }

  return { t, apply, lang };
})();
