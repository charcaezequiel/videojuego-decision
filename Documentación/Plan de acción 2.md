# Plan de acción 2 · DF · Decisión Final

**Objetivo:** cerrar el proyecto por partes pequeñas y verificables, sin rediseñar nada que ya funciona.
**Estado al 2026-11-03.** Este plan reemplaza al `Plan de acción.md` del 02/11: algunas cosas que ese documento marcaba pendientes **ya están hechas** (ver "No hace falta revisar") y aparecieron **3 bugs nuevos** que no estaban listados.

Leyenda: ⬜ pendiente · 🔶 hecho parcial, reverificar · ✅ hecho y verificado.

---

## Cómo usar este plan

1. **Una parte por sesión.** No saltees a la siguiente si la anterior no cerró con sus pruebas en verde.
2. Al terminar cada parte, **commit** con el mensaje sugerido. Así cualquier sesión arranca sabiendo dónde quedó.
3. Antes de tocar nada, levantá el servidor (esto vale para todo el plan):

```bash
cd Codigo
npm install                          # primera vez (node_modules NO está en este checkout)
npx playwright install chromium      # solo la primera vez
npx http-server -p 8099 -c-1 .       # en otra terminal
```

4. Los comandos de verificación son siempre los mismos:

| Comando | Qué revisa |
|---|---|
| `npm test` | 19 pruebas funcionales |
| `npm run audit` | diseño en 9 tamaños × 17 pantallas |
| `npm run i18n` | textos de pantalla vs. diccionario ES/EN |
| `npm run hit` | área de clic sobre el arte real de cada ícono |
| `npm run shots` | 17 capturas + montajes en `tools/out/` |

---

## No hace falta revisar (el plan viejo las marcaba pendientes y ya están)

- ✅ `package.json`: los 13 scripts ya existen (`content`, `sprites`, `music`, `mp3`, `assets`, `tutorial`, `shots`, `i18n`, `hit`, `test`, `audit`, `start`, `serve`).
- ✅ `decision-final (2).zip` ya no está en la carpeta y figura en `.gitignore:13`.
- ✅ Accesibilidad base: `:focus-visible` en botones, rangos y selects (`css/components.css:59,94,130,140`, `css/game.css:39`, `css/screens.css:160`) y `aria-label` dinámico en las 22 flechas (`js/core/i18n.js:116`); `boot.js:93-94` deja focusable la flecha solo cuando tiene destino.
- ✅ Contenido completo: 100 preguntas (10 oficiales + 90), 10 niveles con `palabras` y `pista`, reglas en `DF.rules`.
- ✅ Las opciones del cuestionario ya son `<button type="button">` reales (`js/pages/desafio.js:55`) → son operables por teclado.

---

## PARTE 1 · Bug cero: que las pruebas vuelvan a decir la verdad

**Objetivo:** antes de codear nada nuevo, que `npm test` no pueda esconder un recurso roto. Es la parte más corta y la que sostiene a las otras cuatro.
**Tiempo estimado:** 1 h.

- ✅ **1.1 · Audio `.ogg` fantasma.** Resuelto con la opción **(a)**: se borró el `<source>` de `index.html`, la rama `audio/ogg` de `js/core/music.js:92-94` y el comentario de la cabecera. **Además**, el texto de la licencia no se edita a mano: lo genera `tools/build_music.py` (bloque `LICENCIA`, línea ~759), así que se corrigió ahí y en el `.txt` para que `npm run music` no lo revierta.
- ✅ **1.2 · El test 13 está ciego.** Resuelto, y era peor de lo que parecía: el filtro `!/tutorial|404/` no distinguía el tutorial porque **el texto del error de consola de Chromium no trae la URL** (va en `message.location()`). Se agregó la URL al recolector (`tests/e2e.js`, `withPage`) y el filtro ahora solo perdona `tutorial.webm|.mp4|-poster`. El mismo punto ciego estaba en `tests/smoke.js:18`, que exceptuaba `.ogg$`; también quedó acotado al tutorial.
- ✅ **1.3 · Guard contra recursos huérfanos.** Al inicio del test 13 se leen los `<source>` de `#df-music` en `index.html` y cada uno se pide con `page.request.get()`: si alguno no existe, la prueba falla nombrando el archivo y el código de estado. **Verificado rompiéndolo a propósito**: con el `.ogg` reintroducido, el test reporta `fuentes de audio declaradas que no existen: assets/audio/musica-quiz.ogg -> 404`.
- ✅ **1.4 · `barra.png` se genera y no se usa.** Resuelto con la opción **(a)**: se sacó el bloque de `tools/build_assets.js` (el `Canvas(160,14)` y su `save`), el `return` de `imgMarcos` quedó en `[m, s, w]` y se actualizó la etiqueta del listado. PNG borrado de `assets/img/`. `node tools/build_assets.js` corre y **los demás PNG regenerados salen byte a byte idénticos** a los commiteados → el generador es determinístico, se puede correr sin miedo.
- ✅ **1.5 · Línea base real.** Instalado `npm install` (59 paquetes) y `npx playwright install chromium` (118 MB). Con el servidor en 8099: `npm test` **19 ok / 0 fallan** · `npm run audit` **OK en 9 tamaños × 17 pantallas** · `npm run i18n` **0 diferencias, 0 claves desalineadas** · `npm run hit` **ok en los 6 seletores medidos**.
- ✅ **1.6 (derivado) · La prueba 6 era flaky.** En la segunda corrida completa del día falló `06 · palabras + redirección automática`: esperaba con `waitForTimeout(1700)` un `setTimeout(advance, 1300)` del juego (`js/pages/palabra.js:125`), o sea 400 ms de margen. Se cambió a esperar la condición real (el contador `PALABRA n/3` de `#clue-meta`, y la URL `resultado` en la última) con 8 s de techo. **Confirmado: 19 ok en dos corridas completas consecutivas.**

**Criterio para cerrar:** 404 en consola = 0 en las 17 pantallas con el filtro nuevo; `barra.png` decidido; las 4 suites verde.
**Commit:** `P1 · recursos y pruebas: audio coherente y test 13 sin filtro ciego`.

> **Ojo con el entorno (afecta a las Partes 3 y 4):** en esta máquina **no hay Python**, así que `npm run sprites` (`tools/build_sprites.py`) y `npm run music` (`tools/build_music.py`) **no se pueden correr acá**. El pixel-art y el WAV ya están generados y commiteados, así que la Parte 3 (que edita JSON, no Python) no se resiente; pero si hay que regenerar prendas o música, hace falta instalar Python 3 primero. `node`, `npm` (11.13), Playwright + Chromium y `sharp` sí quedaron funcionando.

---

## PARTE 2 · Pantallas: lo único que falta codear

**Objetivo:** las dos funciones que faltan y el ajuste de teclado. Nada de esto está en el código hoy (verificado con búsqueda en `config`, `store`, `progress` y `ranking`).
**Tiempo estimado:** 2-3 h.

- ⬜ **2.1 · "Borrar mi progreso" en Configuración.** Hoy hay que borrar los datos del sitio desde el navegador.
  - API nueva en `js/core/store.js`: el objeto público (`línea 218-222`) tiene `state, update, persist, login, logout, isLoggedIn, accounts, summary, setSetting, saveSettings, saveRun, getRun, updateRun` — **no hay ningún método de borrado**. Agregar `resetAccount(email)` que limpie `progress` y `run` de ESA cuenta (clave `df_decision_final_v2:cuenta:<correo>`), mantenga `user`/`email` y **no toque** `df_decision_final_v2:ajustes` (es del dispositivo, regla de la sección 4 del Readme).
  - UI en `pages/config.html`: un `.btn` de texto (la pantalla ya usa `.img-btn` solo para volver y soporte, línea 17 y 29) + **modal de confirmación**, reutilizando el patrón de `js/pages/soporte.js:13` (`setTimeout(() => area.focus(), 60)` y `Escape` en la línea 19).
  - Claves nuevas en `js/core/i18n.js` (ES y EN) → por eso `npm run i18n` tiene que correr al final.
  - Test nuevo: **caso 20** en `tests/e2e.js` ("borrar el progreso deja la cuenta abierta y no afecta a las otras cuentas"). Pasar de 19 a 20 casos hay que actualizarlo también en el Readme (Parte 5).
- ⬜ **2.2 · Ranking con estrellas y mejor puntaje por nivel.** `js/pages/ranking.js:22-31` hoy muestra puntos totales y un promedio de estrellas (`r.stars / r.played * 3`). Los datos **ya existen** (`DF.progress.result(n)` guarda `score`, `stars`, `passed` por nivel): falta solo el render. Recién ahí el ítem del plan viejo ("estrellas y mejor puntaje por nivel") se puede marcar ✅.
- ⬜ **2.3 · Foco al entrar una pregunta.** Al renderizar, nada mueve el foco: un usuario de teclado tiene que hacer Tab desde el inicio de la pantalla para llegar a las 4 opciones. Agregar en `js/pages/desafio.js` (después del `innerHTML` de la línea 55) un `qOpts.querySelector('.q-opt').focus()`, y lo mismo en `palabra.js` sobre el input. **Verificar que no robe el foco del video tutorial ni haga sonar nada.**
- ⬜ **2.4 · Recorrido por teclado, completo ( reverificar, no asumir).** Recorrer con solo teclado: `portada → registro → menú → niveles → caso (3 carpetas) → juicio → 10 preguntas → palabras → resultado`, más `config` y `soporte`. Anotar dónde se pierde el orden de Tab. Ya está resuelto y **no** hay que repetir: `Enter` en registro (es `<button type="submit">`), rangos y selects nativos en config, y `Enter`/`Espacio` en `desafio.js:159,170`, `juicio.js:66`, `palabra.js:165`.
- ⬜ **2.5 · `aria-live` en el aviso de respuesta.** El HUD del timer usa `aria-live="off"` (`pages/desafio.html:20`) a propósito; falta que el feedback "era correcta / la respuesta era X" (`desafio.js:136,142`) se anuncie. Región `aria-live="polite"` sobre el `speech-box`, sin doble anuncio.

**Criterio para cerrar:** `npm test` = 20 ok (con el caso 20 nuevo), `npm run audit` sin problemas en las pantallas tocadas, `npm run i18n` con 0 diferencias.
**Commit:** `P2 · pantallas: borrar progreso, ranking por nivel y foco de teclado`.

---

## PARTE 3 · Contenido y traducción

**Objetivo:** que el texto sea presentable y que el inglés no quede a medias. Es la parte más larga en tiempo de lectura y la más chica en código.
**Tiempo estimado:** 2 h (más la lectura humana, que es la que no se puede automatizar).

- ⬜ **3.1 · Lectura humana de los 10 casos y las 100 preguntas.** El plan viejo la dejó 🔶: pasó por corrector automático (tildes, concordancia) pero nadie lo leyó de punta a punta. Se edita **en el JSON, nunca en el generado**:
  - `tools/content/casos-1-5.json` y `tools/content/casos-6-10.json` → `node tools/build_content.js` (`npm run content`).
  - Aprovechar para revisar coherencia legal de las devoluciones (art. 43 CN, derecho de petición, audiencia pública, Defensoría del Pueblo, amparo) y que ninguna de las 90 no oficiales agregue datos que no estén en el propio caso.
  - **Trampa a evitar:** `niveles.js` dice "GENERADO · no editar a mano" (`js/data/niveles.js:2`). Si se edita ahí, el cambio se pisa en la próxima build.
- ⬜ **3.2 · Validar el contenido regenerado.** `node tools/content/validar.mjs` + la build ya falla si la clave no es `A-D` o `oficial` no es booleano (el bug que hacía injugable el juego). Confirmar después de editar: 100 llamadas a `Q(`, 10 `, true)` y 90 `, false)`.
- ⬜ **3.3 · Manual en inglés.** `js/data/manual.js` es 100 % español y no tiene bloque de idioma; hoy, con idioma EN, la interfaz se traduce y el manual queda en español (sección 8 del Readme). Definir el mecanismo **antes** de escribir (el manual arma sus números desde `DF.rules`, así que cualquier estructura tiene que conservar eso): array paralelo `[es, en]` por párrafo o `DF.manual_en`. Es la tarea más grande de esta parte.
- ⬜ **3.4 · Contraste de los textos chicos.** El único ítem de accesibilidad que el plan viejo pedía y que no aparece resuelto (el foco y el `aria-label` ya están, sección "No hace falta revisar"). Revisar `--cream`/texto sobre `fondo.png` en `.label`, plaquetas A/B/C/D y tarjetas de nivel con `npm run shots`.

**Criterio para cerrar:** `npm run content` sin errores, `npm run i18n` con 0 diferencias, los 10 casos leídos a mano y las 30 palabras sin errores de tipeo.
**Commit:** `P3 · contenido: lectura humana de los 10 casos y manual en inglés`.

---

## PARTE 4 · Recursos (video, música y arte)

**Objetivo:** que los recursos mostrados sean la interfaz final, y que lo entregado sea reproducible en el aula.
**Tiempo estimado:** 1-2 h, con descargas de dependencias incluidas.

- ⬜ **4.1 · Regrabar el tutorial.** `assets/video/tutorial.webm` (59,8 s, 1280×720) se grabó **antes** de las plaquetas A/B/C/D y del área de clic medida sobre el arte. Con el servidor en 8099: `npm run tutorial` (necesita Playwright y ffmpeg). Después revisar el resultado con `npm run shots`. El reproductor ya se oculta si el archivo no carga (`pages/niveles.html:29` apunta a `.webm`, correcto) → nada de lógica que cambiar.
- ⬜ **4.2 · Decidir WebM vs. MP4.** El ffmpeg que trae Playwright no tiene `libx264` ni muxer MP4. O se entrega WebM y se prueba en el proyector/PC del aula **antes** de la entrega, o se consigue un ffmpeg completo y se convierte. **Esto es un riesgo de presentación, no un detalle técnico: verificarlo con el equipo real.**
- ⬜ **4.3 · Música y licencia.** Confirmar que `assets/audio/` queda en los formatos reales (`musica-quiz.mp3` + `.wav`) según lo resuelto en 1.1, que `LICENCIA.txt` describa el mix final, y que la composición original CC0 siga documentada como está.
- ⬜ **4.4 · Regenerar arte si se tocó el generador.** Si la Parte 1 optó por sacar/usar `barra.png`: `npm run assets`. Verificar con `npm run hit` que las áreas de clic sigan calzando con el arte.
- ⬜ **4.5 · Revisión visual.** `npm run shots` (17 capturas + montajes) y revisar a ojo las pantallas tocadas en las Partes 1 y 2. `tools/out/` está gitignoreado, así que no ensucia la entrega.

**Criterio para cerrar:** tutorial nuevo mostrando la interfaz final, formato de video validado en el equipo donde se va a proyectar, `npm run hit` y `npm run assets` en verde.
**Commit:** `P4 · recursos: tutorial regrabado y arte coherente`.

---

## PARTE 5 · Prueba real, documentación y empaque

**Objetivo:** que el Readme no prometa nada que el juego no haga y que la entrega sea un ZIP limpio.
**Tiempo estimado:** 1-2 h + la prueba en dispositivos.

- ⬜ **5.1 · Readme: corregir lo que el plan viejo dejó 🔶** (`Codigo/Readme.md`):
  - `línea 104`: menciona `js/data/niveles-previos.js`, que **no existe** en `js/data/` (solo `manual.js`, `niveles.js`, `vestuario.js`).
  - `línea 108` y `126`: dicen `musica-quiz.ogg` → formatos reales `.mp3`/`.wav`.
  - `línea 109` y `127`: dicen `tutorial.mp4` (MP4 H.264) → el archivo real es `tutorial.webm`.
  - Sección 6 (estructura): faltan `js/core/run.js` y las herramientas `build_content.js`, `build_audio.mjs`, `pixel.js`, `build_assets.js`, `shots.js`, `montage.js`, `check_i18n.js`, `check_hit_areas.js`.
  - Sección 2: la lista de casos de prueba queda en **20** si se agregó el caso 20 (Parte 2) y hay que describirlo.
  - Sección 3/4: documentar "Borrar mi progreso" (antes decía "borrá los datos del sitio en el navegador" como única vía) y el mejor puntaje por nivel en el ranking.
- ⬜ **5.2 · Probar con tacto real** en un celular y una tablet (el `audit` simula viewport, no dedos) en horizontal y vertical, y verificar el bloqueo de autoplay en Safari/iOS (la música arranca con el primer gesto). **Nada de esto está probado: este checkout no tiene `node_modules` instalado y ningún "19 ok" está verificado acá.**
- ⬜ **5.3 · Playthrough completo con cuenta nueva** (jugando, no con las pruebas): `portada → registro → menú → nivel 1 → 3 carpetas → juicio → 10 preguntas → 3 palabras → resultado → 8 s → selección`. Después perder un nivel, comprobar que desbloquea el siguiente, vestir al personaje, recargar y verificar que el vestuario sigue.
- ⬜ **5.4 · Empaquetar la entrega.** ZIP de `Codigo/` **sin** `node_modules/` ni `tools/out/`, más la carpeta `Documentación/`. Confirmar licencias de las 3 fuentes (Bebas Neue, Instrument Serif, Quicksand — ya citadas en `js/data/manual.js:109`) y de la música (`assets/audio/LICENCIA.txt`).
- ⬜ **5.5 · Cierre de documentación.** Este plan pasa a `Plan de acción.md` (o se deja este como "2" con el estado final) y el Readme de la raíz dice qué versión del juego se entrega.

**Criterio para cerrar:** Readme sin una sola referencia a archivo inexistente, `npm test` / `npm run audit` / `npm run i18n` / `npm run hit` en verde desde un `npm install` limpio, playthrough manual completo y ZIP probado en otro equipo.
**Commit:** `P5 · entrega: Readme verificado, prueba en dispositivo y ZIP limpio`.

---

## Orden sugerido

| # | Parte | Cuándo sabés que terminó |
|---|---|---|
| 1 | Bug cero y línea base | 404 = 0 con el filtro nuevo; 4 suites verde |
| 2 | Lo que falta codear | `npm test` = 20 ok, `i18n` 0 diferencias |
| 3 | Contenido y traducción | casos leídos a mano + manual EN |
| 4 | Recursos | tutorial nuevo y formato validado en el aula |
| 5 | Prueba real y empaque | Readme honesto + ZIP probado en otro equipo |

Dependencias: **la Parte 1 va primero sí o sí** (si el test 13 sigue perdonando 404, las partes 2 a 5 se verifican sobre una base que miente). Las Partes 2 y 3 se pueden invertir sin problema. La 4 después de la 2 (el tutorial graba la interfaz, así que conviene grabarlo con las pantallas ya terminadas). La 5 siempre al final.
