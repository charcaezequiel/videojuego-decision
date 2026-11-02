# DF · Decisión Final (Defendiendo la justicia. Un píxel a la vez.)

Juego educativo de Educación Ciudadana: 10 casos, 10 preguntas por caso (100 en total), 20 segundos por pregunta, un desafío final por nivel, personaje personalizable, manual integrado, música de fondo y video tutorial.
HTML + CSS + JavaScript puro, sin dependencias para jugar. Se adapta a computadoras, tablets y celulares (horizontal y vertical).

---

## 1. Cómo ejecutarlo

**Opción rápida:** abrí `index.html` con doble clic (Chrome / Edge).

**Recomendado (cualquier navegador, también en el celular):** serví la carpeta con un servidor local:

```bash
npx http-server -p 8080 -c-1 .      # o:  python3 -m http.server 8080
```
y abrí <http://localhost:8080>.

Entrá siempre por `index.html`: es el contenedor del juego y mantiene la música sonando sin cortes entre pantallas. Si se recarga la página, el juego vuelve a la misma pantalla.

El progreso, el personaje y la configuración se guardan en el navegador (`localStorage`), **separados por cuenta** (ver sección 4).
Para empezar de cero: borrá los datos del sitio en el navegador.

## 2. Cómo probarlo

Pruebas automáticas (Chromium, ~4 min). Levantá primero el servidor en el puerto 8099:

```bash
npm install
npx playwright install chromium     # solo la primera vez
npx http-server -p 8099 -c-1 .      # en otra terminal (o: npm run serve)
npm test                            # 19 pruebas funcionales
npm run audit                       # diseño revisado en 9 tamaños de pantalla
```

Podés correr pruebas sueltas: `node tests/e2e.js 3 7 12` o `node tests/layout-audit.js caso.html`.

**`npm test` — 19 casos:** 1) las 10 preguntas se completan · 2) tiempo agotado cuenta como «sin responder» · 3) después del tiempo no se puede responder ni se duplica la respuesta · 4) las flechas eligen opciones y ← lleva al menú · 5) fuera del cuestionario las flechas navegan · 6) las 3 palabras + redirección automática · 7) perder desbloquea el siguiente nivel · 8) botón *Siguiente nivel* · 9) el vestuario se mantiene al recargar · 10) el manual se arma desde `DF.manual` y cita las reglas reales · 11) nivel 10 y pantalla final · 12) sin doble acción y URLs inválidas protegidas · 13) imágenes, estilos y consola sin errores en las 17 pantallas · 14) cuentas con datos separados · 15) migración de la versión anterior · 16) mapa de flechas completo y sin flechas sin acción · 17) el área de clic es el dibujo, no el cuadro · 18) la música vive en el contenedor y no se reinicia · 19) el video tutorial se muestra solo si existe.

**`npm run audit` — 9 tamaños × 17 pantallas:** nada fuera del escenario, sin scroll de la página, sin texto cortado (incluido el enunciado más largo del juego) y todos los botones tocables.

Otros controles: `npm run i18n` (textos de las pantallas vs. diccionario español/inglés), `npm run hit` (las áreas de clic medidas sobre el arte real de cada ícono) y `npm run shots` (17 capturas + montajes en `tools/out/` para revisar a ojo).

## 3. Cómo se juega (resumen)

`Portada → Registro → Menú → Selección de nivel → Título → Descripción → Información del caso (3 carpetas) → Juicio → 10 preguntas (20 s c/u) → Desafío final (3 palabras) → Resultado → (8 s) → Selección de nivel`

* **Preguntas:** 4 opciones; mouse/toque, flechas/WASD + Enter, o teclas 1-4. Una sola respuesta por pregunta. Correcta = 100 pts + bonus por rapidez (hasta 40). Tiempo agotado = «sin responder».
* **Pregunta oficial:** la 1.ª de cada nivel es la del PDF; al responderla se muestra la **devolución** del caso.
* **Flechas:** ← vuelve y → avanza (también con las teclas ← →). Cada flecha aparece **solo si tiene a dónde ir**: no quedan flechas grises o "sombras" sin acción (por ejemplo, la → de *Información del caso* aparece al leer las 3 carpetas).
* **Volver desde las preguntas:** en las preguntas y en el desafío final, la flecha ← lleva **directo al menú principal** (el intento del nivel se descarta; no se puede volver a una pregunta anterior). Ahí las teclas ← → se usan para elegir opciones, no para salir.
* **Ganar:** ≥ 7 correctas y ≥ 2 palabras. **Terminar** un nivel (ganado o perdido) **desbloquea el siguiente**; nunca se vuelve a bloquear.
* **Resultado:** botones *Siguiente nivel* (en el 10: *Ver final*), *Reintentar nivel* y *Niveles*; si no se toca nada, vuelve solo a *Selección de nivel* a los 8 s.
* **Vestí a tu personaje:** 12 categorías y 40 prendas del prototipo. Una prenda por categoría, tocar de nuevo para sacarla, bufanda y collar se excluyen. Se desbloquean al terminar niveles.
* **Video tutorial:** en *Selección de nivel*, abajo a la derecha. Botones para reproducir / pausar, barra de avance y ampliar.
* **Música:** suena desde el primer clic o toque (los navegadores no permiten audio antes). *Configuración → Música* regula su volumen (0 = apagada) y también respeta el *Volumen* general (en iPhone/iPad el volumen se aplica con Web Audio, porque Safari no permite cambiarlo de otra forma).

Todas las reglas se configuran en un solo lugar: `DF.rules` en `js/data/niveles.js` (segundos, puntajes, aciertos mínimos, espera de la redirección, etc.).

## 4. Cuentas y datos guardados

* Cada **correo electrónico es una cuenta**. Cada cuenta guarda **sus** puntos, estadísticas, niveles jugados/ganados, mejores resultados, intentos y su personaje. Si se registra un correo nuevo, empieza de cero; si se vuelve a usar un correo (sin importar mayúsculas), se recupera lo de esa cuenta.
* **Cambiar de cuenta:** botón *CAMBIAR DE CUENTA* en el menú (cierra la sesión; los datos quedan guardados).
* Las partidas en curso (cuestionario, resultado, carpetas leídas) se guardan por cuenta y se borran al cambiar de cuenta: una cuenta nunca puede terminar o ver la partida de otra.
* *Configuración* (volumen, música, brillo, idioma, gráficos) es del dispositivo y vale para todas las cuentas.
* La sesión dura mientras la pestaña está abierta: al cerrarla (o con *CAMBIAR DE CUENTA*) hay que volver a registrarse con el correo. Así, quien abra el juego después en la misma computadora nunca entra a la cuenta anterior ni ve su correo.
* Formato en `localStorage`: **cada cuenta en su propia clave** `df_decision_final_v2:cuenta:<correo>` → `{ user, email, progress, avatar }`, y los ajustes en `df_decision_final_v2:ajustes`. Una cuenta nunca lee ni escribe la clave de otra. Las partidas guardadas con la versión anterior (`df_decision_final_v1`) se pasan una sola vez a la cuenta de su correo (si esa cuenta ya existe, se conserva el mejor resultado de cada nivel).
* No hay contraseñas: los datos quedan en ese navegador y cualquiera que escriba el mismo correo en ese equipo entra a esa cuenta.

## 5. Pantallas en distintos dispositivos

* **Horizontal** (computadoras, tablets y celulares acostados): escenario de 1280x720, el diseño original sin cambios. En pantallas de otra proporción el fondo continúa a los costados (sin franjas negras). En celulares acostados se agrandan los textos más chicos.
* **Vertical** (celulares y tablets parados): escenario de 720 de ancho y 1280 a 1560 de alto; cada pantalla se reacomoda con los mismos componentes, colores, fuentes, imágenes y personajes (por ejemplo, en las preguntas la sala queda arriba y las 4 opciones en una columna).
* Lógica: `js/core/stage.js` (elige la orientación y escala). Estilos: `css/responsive.css` (solo reglas `.portrait` y `.compact`; el diseño horizontal está en los otros CSS y no se tocó).

## 6. Estructura

```
index.html                 Contenedor del juego (marco + reproductor de música)
pages/                     Una pantalla por archivo
  portada, registro, menu, config, soporte, ranking, manual, vestir,
  niveles, nivel-titulo, nivel-desc, caso, juicio,
  desafio (preguntas), palabra (desafío final), resultado, fin (pantalla final)
css/
  base.css                 Fuentes, colores, escenario
  components.css           Botones, flechas (área de clic), campos, barra de scroll, toasts
  screens.css              Menú, niveles (+ mini video tutorial), título, caso, manual, ranking…
  game.css                 Vestuario, tribunal, preguntas, desafío, resultado, final
  responsive.css           Reacomodo para vertical (.portrait) y celular acostado (.compact)
js/core/                   Módulos reutilizables
  store.js                 Guardado por cuenta (una clave por cuenta) + sesión por pestaña + migración
  progress.js              Progresión: estados, desbloqueo, mejor puntaje, prendas
  boot.js                  Arranque, protección de pantallas y NAVEGACIÓN: mapa único de flechas (DF.nav.ROUTES)
  music.js                 Música de fondo (DF.music) y comunicación con el contenedor (DF.shell)
  shell.js                 Lógica del contenedor index.html
  timer.js                 Temporizador de cuenta regresiva (uno por pregunta)
  scrollbar.js             Barra de scroll del prototipo
  sprites.js               Dibuja personaje, prendas, juez, fiscal y tribunal (SVG)
  i18n.js, audio.js, stage.js   Idioma, efectos de sonido, escalado responsive/brillo
js/data/                   Solo datos (sin lógica)
  niveles.js               10 casos, 100 preguntas, palabras, devoluciones y DF.rules
  vestuario.js             Pixel-art (GENERADO por tools/build_sprites.py)
  manual.js                Texto del manual
  niveles-previos.js       Casos de la versión anterior (no se carga)
js/pages/                  Un script por pantalla
assets/
  icons/, img/, fonts/     Imágenes y fuentes del diseño
  audio/                   musica-quiz.ogg / .mp3 (+ LICENCIA.txt)
  video/                   tutorial.mp4 + tutorial-poster.jpg
tools/
  build_sprites.py         Generador del pixel-art (npm run sprites)
  build_music.py           Generador de la música (npm run music)
  build_tutorial.js        Graba el video tutorial jugando el juego (npm run tutorial)
tests/
  e2e.js                   Pruebas funcionales (npm test)
  layout-audit.js          Revisión automática del diseño responsive
```

## 7. Agregar o editar contenido

* **Preguntas:** `js/data/niveles.js` → `Q(enunciado, A, B, C, D, 'letraCorrecta', oficial)`.
* **Palabras del desafío final:** `DF.palabras` (mismo archivo).
* **Prendas:** editar `tools/build_sprites.py` y ejecutarlo (regenera `js/data/vestuario.js`).
* **Manual:** `js/data/manual.js` (los números se leen de `DF.rules`).
* **Flechas:** el destino de cada flecha está en un solo lugar, `DF.nav.ROUTES` (`js/core/boot.js`). En el HTML solo se marca `data-nav="back"` o `data-nav="next"`.
* **Música:** reemplazar `assets/audio/musica-quiz.ogg` y `.mp3` (mismo nombre) o regenerarla con `npm run music`.
* **Video tutorial:** reemplazar `assets/video/tutorial.mp4` y `tutorial-poster.jpg` (mismo nombre; MP4 H.264 para que funcione en todos los navegadores) o regenerarlo con `npm run tutorial` después de cambiar pantallas (requiere Playwright y ffmpeg). Si el archivo falta o no carga, el reproductor no se muestra.

## 8. Notas sobre el contenido

* El PDF «Casos definitivos» trae **una pregunta por caso** (10 en total). Para llegar a 10 por nivel, las otras 9 de cada nivel se redactaron **solo con los hechos del propio caso** (descripción, testimonios, pruebas, denuncia y devolución del PDF), sin agregar información externa. La pregunta oficial está marcada con `oficial:true` y mantiene su orden A-D; en las demás se mezclan las opciones en cada partida.
* El personaje, las prendas, el juez, el fiscal y el tribunal se recrearon en pixel-art a partir de las capturas del prototipo, porque el ZIP no traía esos archivos de imagen. Si se consiguen los PNG originales, se pueden reemplazar en `js/core/sprites.js` sin tocar la lógica.
* El texto largo del manual está en español; con el idioma en inglés, la interfaz se traduce y el manual se muestra en español.
* **Música:** composición original del proyecto (chiptune de quiz en Re menor, 120 BPM, loop de 64 s), licencia CC0 / dominio público. Ver `assets/audio/LICENCIA.txt`.
* **Video tutorial:** grabación real del juego con carteles explicativos (70 s, sin sonido), generada con `tools/build_tutorial.js`. El proyecto no traía ningún video ni recurso tutorial además del manual.

