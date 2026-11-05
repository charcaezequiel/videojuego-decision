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
| `npm test` | 20 pruebas funcionales |
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

## PARTE 1 · Bug cero: que las pruebas vuelvan a decir la verdad ✅

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

## PARTE 2 · Pantallas: lo único que falta codear ✅

**Objetivo:** las dos funciones que faltan y el ajuste de teclado. Cerrada el 03/11 con `npm test` **20 ok / 0 fallan**, `npm run audit` OK (9 tamaños × 17 pantallas), `npm run i18n` 0 diferencias, `npm run hit` ok.
**Tiempo estimado:** 2-3 h.

- ✅ **2.1 · "Borrar mi progreso" en Configuración.**
  - `js/core/store.js`: se agregó `resetProgress()` (no `resetAccount(email)` como proponía el plan: el store **solo** trabaja sobre la cuenta logueada — `state.email` — y exponer un borrado por correo arbitrario invites a borrar la cuenta equivocada). Limpia `progress`, deja el avatar en el default de `blankAccount()`, persiste, cierra la partida (`saveRun(null)`) y **no toca** `df_decision_final_v2:ajustes` (es del dispositivo, regla de la sección 4 del Readme). `summary()` ahora también devuelve `best`.
  - UI en `pages/config.html`: `.btn.cfg-borrar` + modal que reutiliza `.modal-backdrop/.modal` de `components.css` (el mismo patrón de `soporte.js`). El foco arranca en **CERRAR**, así Enter no borra nada por accidente. Escape y clic en el fondo cierran.
  - 4 claves nuevas en `js/core/i18n.js` (ES y EN): `borrarProgreso`, `borrarAdj`, `borrarYa`, `borradoOk`.
  - **Caso 20** en `tests/e2e.js`: verifica que se vacíe `progress`, que la cuenta siga abierta, que el avatar custom vuelva a `media`, que la música (ajuste del dispositivo) no se toque y que **la otra cuenta conserve su progreso**. Ojo con el helper `login()` del archivo: reescribe la cuenta de cero, así que la cuenta que se borra tiene que ser la **última** en loguearse (por eso el caso usa `veinte`, la última del listado).
- ✅ **2.2 · Ranking con estrellas y mejor puntaje por nivel.** `summary()` calcula `best = {n, score, stars}` (el mayor puntaje entre los niveles jugados) y `ranking.js` lo muestra como `NIVEL 3 · 2.450` bajo las estrellas, con el detalle completo en `title`. Ajustes de caja: `.rank-pts` 120→150 px (los "3.250 pts" se partían en dos renglones en horizontal), `.rank-stars` con `line-height:1` + `small` en la fuente de texto, y la grilla vertical pasó a `64px 58px`. Verificado con capturas en horizontal y vertical (`tools/out/ranking-*.png`).
- ✅ **2.3 · Foco en el cuestionario.** **El plan estaba mal en los dos puntos:**
  - `desafio.js` **no necesita autofocus inicial**: la selección es virtual (flechas + Enter); si la opción 1 queda enfocada sin estar seleccionada, Tab/flechas y Enter apuntarían a cosas distintas. Se hizo **sincronización bidireccional**: `pick(k, fromFocus)` mueve el foco a la opción seleccionada, y el `focusin` en `.q-opts` selecciona la opción enfocada (así Tab no "salta" selección). Con el `focus()` programático el anillo `:focus-visible` **no** aparece en el camino de mouse (verificado con clic real, no con `.click()` sintético, que no mueve el foco).
  - En `palabra.js` **no hay `<input>`**: el desafío de palabras usa teclado de pantalla + un handler global de `keydown`, así que no hay nada que enfocar al entrar. Lo que sí estaba roto: cada `refresh()` reconstruye `#kb` con `innerHTML` y el foco de la tecla usada caía al `BODY`. Ahora `drawKeys()` devuelve el foco a la misma tecla (`data-key`), con `preventScroll` para no mover el escenario.
  - Dato para el que lee el código después: al responder, `answer()` pone `disabled` en las 4 opciones y **el navegador mueve el foco al `BODY`** (comportamiento estándar al deshabilitar el elemento enfocado). No rompe nada: el `Enter` que salta la devolución está escuchado en `document`, y `#q-text` tiene `aria-live="polite"`.
- ✅ **2.4 · Recorrido por teclado completo.** Recorrido real con Playwright usando solo Tab/Enter/flechas (`tools/out/walk-keyboard.js`): `portada → registro → menú → niveles → nivel-titulo → nivel-desc → caso (3 carpetas) → juicio → 10 preguntas → 3 palabras → resultado`, más `config` y `soporte`. Resultado: **el flujo completo se hace sin mouse**. Orden medido (Tabs hasta la acción principal): portada 1 · registro 1 (entra con el foco puesto en el correo) · menú 4 (Jugar) · niveles 2 (primer nivel desbloqueado) · título/descripción 2 (flecha →) · caso 2 (carpeta) · resultado 1.
  - Tres focos que se perdían y se arreglaron devolviéndolos al disparador: **`caso.js`** (al cerrar una carpeta con Escape el foco caía al `BODY`; ahora vuelve a la carpeta leída, y de ahí la flecha → queda a 1 Tab), **`config.js`** y **`soporte.js`** (al cerrar el modal con Escape o con Enter, el foco vuelve a `#btn-borrar` / `#btn-contacto`).
  - Dos cosas que **son a propósito** y no hay que "arreglar": en `juicio.html` la flecha → está `nav-off` (`tabindex="-1"`, `aria-hidden="true"`) hasta la última línea del diálogo, por eso el Tab solo encuentra la ← — el avance por teclado es `Enter`/`Espacio` global (10 pulsos para las 5 líneas tipeadas). En `niveles.html` los niveles bloqueados siguen en el orden de Tab con `aria-disabled="true"`: al activarlos no navegan y aparece un `toast` (que vive en un `role="status"`) explicando qué nivel falta.
- ✅ **2.5 · `aria-live` en la devolución.** **Ya estaba**: `pages/desafio.html:22` tiene `<div class="q-text" id="q-text" aria-live="polite">` y toda la devolución (`showFeedback()`) se escribe ahí, así que se anuncia sola y sin doble anuncio (el HUD del timer es `aria-live="off"` a propósito). Verificado en runtime: las 10 preguntas reportan `q-text feedback` con `ariaLive=polite`. **No hubo que codear nada.**

**Criterio para cerrar:** ✅ cumplido — `npm test` = 20 ok (con el caso 20 nuevo), `npm run audit` sin problemas en las pantallas tocadas, `npm run i18n` con 0 diferencias.
**Commit:** `P2 · pantallas: borrar progreso, ranking por nivel y foco de teclado`.

> **Pasos a la Parte 3 (contraste):** el recorrido visual del ranking y del desafío de palabras dejó dos problemas de legibilidad **preexistentes**, para el ítem 3.4: (1) el `.name` color marrón sobre la parte vacía (oscura) de `.rank-bar` deja "juez_pixel" y "sin_jugar" casi ilegibles; (2) los textos chicos de plaquetas/`small` del ranking no llegan al contraste recomendado sobre `fondo.png`.

---

## PARTE 3 · Contenido y traducción ✅

**Objetivo:** que el texto sea presentable y que el inglés no quede a medias. Es la parte más larga en tiempo de lectura y la más chica en código.
**Tiempo estimado:** 2 h (más la lectura humana, que es la que no se puede automatizar).
**Cerrada el 03/11** con `node tools/content/validar.mjs` = `VALIDACION COMPLETA OK`, `node tools/out/check-casos.mjs` = `LOS 10 CASOS OK`, `npm run content` (10 casos · 100 preguntas · 97,9 KB), `npm test` 20 ok, `npm run audit` OK, `npm run i18n` 0 diferencias + manual alineado, `npm run hit` ok y contraste **0 de 97 mediciones bajo el umbral WCAG**.

- ✅ **3.1 · Lectura humana de los 10 casos y las 100 preguntas.** Se leyó completo `tools/content/casos-1-5.json` y `tools/content/casos-6-10.json` y se corrigieron **40 cosas** (29 en 1-5, 11 en 6-10 más el pase de coherencia numérica). Las que cambian el contenido que se enseña:
  - **Caso 1 — error legal en la pregunta oficial.** Decía "el derecho de petición del artículo 43". El derecho de peticionar está en el **art. 14**; el art. 43 es el **amparo** (y no contiene ningún plazo razonable). Se corrigió la denuncia, la devolución y la pregunta oficial, verificado contra el texto oficial. **⚠️ Si el PDF del caso 1 cita el art. 43, hay que alinearlo**: el juego ahora dice art. 14 y el art. 43 queda citado como amparo.
  - **05/11 · se buscó el PDF y no está en este repositorio.** El único PDF del repo es `LPC-Sprint 7_ Definición del sistema de diseño del producto.pdf`; extraído el texto (`pdftotext`), es documentación de UX/UI y **no trae ni los casos ni los artículos** (buscado en los 8 `.docx` también: 0 coincidencias). El papel vive afuera del repo, así que lo que se hizo fue meter adentro la **fuente autoritativa**: `Documentación/Casos para imprimir.md`, generada por `tools/build_fichas.js` (`npm run fichas`) leyendo `js/data/niveles.js`, o sea el texto que el juego efectivamente muestra — no se puede desalinear solo. Trae los 10 expedientes completos (denuncia, testimonios, pruebas y devolución) y la **pregunta oficial con su orden A-D**, que es la que el juego muestra primero y conserva el orden del papel (`js/core/run.js:54-63`: solo la oficial no se mezcla). Encabezado con el aviso legal: art. 14 = petición, art. 43 = amparo por omisión/silencio, y la advertencia de **no "corregir"** los distractores de art. 43 de los casos 2, 3 y 4 (si se arreglan, esas preguntas quedan con dos respuestas válidas).
  - La cita se volvió a verificar contra el texto oficial de la reforma de 1994 antes de escribir la ficha: el art. 14 reconoce "peticionar a las autoridades" y el art. 43 da la acción de amparo "contra todo acto u omisión" de las autoridades — que es justo el silencio del municipio del caso 1.
  - **Caso 4 — PIDES art. 13.4 → art. 13.2.b** (el inciso de la denuncia ante la CIDH).
  - **Caso 5 — "ART" → "obra social"** en denuncia, resumen, autor del testimonio y dos preguntas: ART es el seguro de accidentes de trabajo, y acá lo que negaba la cobertura era la obra social. Además "Debió" → "Debía" (3 veces) y el distractor de P1 reescrito para que la clave siga siendo la única correcta.
  - **Caso 10 — la aritmética no cerraba.** El recargo es 3 % y la factura decía $4.500 de más sobre un plan de $22.400 (3 % = $672). Como el 3 % no se puede tocar, se subió la **base**: la casa gasta $150.000 por mes en compras y servicios por internet (entre ellos el plan de $22.400) → 3 % = **$4.500 exactos**, total $154.500. Ajustadas denuncia, testimonio de Zapata, la prueba de las facturas y el distractor de P3.
  - **Caso 10 y 9 — los días de la semana contra el calendario 2026.** El 6/5/2026 es **miércoles** (el decreto decía "publicado un viernes a la noche y el miércoles siguiente ya estaban los recargos", y encima el cobro arrancaba el 1.° de junio): ahora "publicado un miércoles a las 21:40 y recargo ya cobrado en la primera factura de junio". El 14/5/2026 es **jueves** (el mensaje de Balbi decía "viernes"): resumen, prueba y cronología ahora dicen jueves, y el cartel de "se vende" del 20/5 pasó de "tres días después" a **seis días después**.
  - **Caso 6 — "ocho semanas" → "siete semanas"**: del 3/3 al 19/4 hay 47 días, y la prueba habla de 7 semanas de difusión diaria. Y "más de dos semanas" → "casi dos semanas" (22/4 → 5/5 = 13 días).
  - **Caso 7 — "por una denuncia de puntería" → "por una demanda puntual"**: era la única ocurrencia de la palabra **DEMANDA** del desafío de palabras, y estaba escrita mal, así que el juego nunca la podía formar.
  - **Caso 2 — contradicción interna**: la denuncia decía que Sergio compró "con su tarjeta de débito del trabajo" y el testimonio de Sergio decía otra cosa; se alineó con el resumen. El cartel de garantía ahora aclara "obligatorio para los comercios de mayor facturación" y la devolución habla del "plazo de garantía de 6 meses que el propio local entregó" (la garantía legal es de 3).
  - **Caso 3** — "Juzgado Nacional del Trabajo" → juzgado del trabajo **del fuero provincial** (donde queda el supermercado), "firma al puño y letra" y "plus por daño" → "daño moral".
  - **Caso 8** — P3: "A quien se atribuye" (agrega el pronombre que faltaba para que la clave siga siendo correcta) y la prueba del acta ahora dice "le negaron **a Morena** el libro de reclamaciones", coherente con la denuncia.
  - **Caso 9** — la devolución citaba el art. 14 bis con "la distribución razonable de la **vivienda**"; el texto real es distribución razonable de las **oportunidades y los beneficios** y **acceso a una vivienda digna**.
  - **Distractores que NO se corrigieron a propósito:** los casos 2, 3 y 4 tienen opciones incorrectas que dicen "art. 43 = derecho de petición". Son falsas justamente por el error que se arregló en el caso 1; "corregirlas" las volvería verdaderas y crearía **doble respuesta correcta**.
- ✅ **3.2 · Validar el contenido regenerado.** `node tools/content/validar.mjs` sigue siendo el que congela `EXPECTED_KEYS` de los casos 1-5, así que **no se puede reordenar opciones ni cambiar una `key`**: cuando la clave congelada quedaba sobre el distractor (caso 2 P10 y caso 5 P8) se **swapearon los textos** dejando la letra donde estaba. Como 6-10 no estaba cubierto, se agregó `tools/out/check-casos.mjs`, que aplica las mismas cotas a los **10 casos** (título ≤34, subtítulo ≤60, pista ≤110, enunciado ≤190, denuncia 120-190 palabras, testimonios 70-120, pruebas 50-90, devolución 80-140; palabras sin tilde que aparecen textualmente y son formables con su pool; 10 preguntas, solo la 1.ª oficial; 4 letras usadas; nunca 3 claves seguidas). Detectó y arregló el `DEMANDA` del caso 7. Después del build: **100 `Q(`** (101 si se cuenta la definición de la función), **10 `true`**, **90 `false`**.
  - Ojo: con `core.autocrlf=true` y sin `.gitattributes`, cada `npm run content` puede dejar un **diff fantasma de fines de línea** en `niveles.js`; conviene revisar `git diff --stat` y `git checkout --` si el diff es solo CRLF.
- ✅ **3.3 · Manual en inglés.** Mecanismo elegido: **pares `[español, inglés]`** por título y por párrafo dentro de la misma estructura, con `DF.manualPara(lang)` que resuelve el idioma y devuelve `{ secciones, creditos }`. `DF.rules` se sigue usando en el armado, así que los números (20 s, 100 pts, bonus 40, 3 palabras, 3 intentos, 8 s de cuenta regresiva) siguen saliendo del contenido y no de la prosa. `DF.manual` y `DF.creditos` se conservan (resueltos al idioma activo) porque el test 10 del e2e lee `DF.manual.length`. `js/pages/manual.js` ahora pide `DF.manualPara(DF.i18n.lang())`.
  - 8 bloques · 32 párrafos · 5 créditos, los dos idiomas. Verificado con `tools/out/check-manual.js` (estructura y sin huecos) y con capturas reales (`tools/out/shot-manual.js` → `manual-es.png` / `manual-en.png`): **0 desbordes horizontales** y altura de scroll casi igual (3559 px ES / 3468 px EN).
  - `tools/check_i18n.js` ahora **también revisa el manual**: evalúa `niveles.js` + `manual.js` en un contexto sin navegador y compara ES vs EN bloque por bloque (párrafos vacíos, paragrafos desalineados y el marcador `—` que aparece si a `DF.rules` le falta una clave). Imprime `manual: 8 bloques y 32 parrafos en ES y EN`.
- ✅ **3.4 · Contraste de los textos chicos.** El método del plan (tomar el cluster de color dominante de la captura) **medía mal**: el "fondo" que elegía era el halo de antialiasing del propio texto (`rgb(183,171,154)` = mezcla 66 % crema/púrpura), y daba 32 falsos fallos de 46. El método nuevo (`tools/out/check-contrast.js`) captura el recorte del elemento **dos veces**: una normal y otra con el texto invisible (`.df-medir{color:transparent}` en todo el subárbol), así el segundo PNG es el fondo real píxel a píxel — cuenta `fondo.png`, capas, `rgba` y opacidades acumuladas. El ratio se calcula con el color declarado compuesto sobre ese fondo, en el **peor núcleo de glifo** (cobertura ≥ 0,85 del máximo), y el umbral es el de WCAG: 3:1 si ≥24 px o ≥18,66 px en negrita, 4,5:1 si no. Animaciones y transiciones se congelan con `addInitScript`, si no la opacidad se mide a mitad del fade.
  - Los dos casos heredados de la Parte 2 quedaron resueltos en `css/screens.css`:
    - **`.rank-bar .name`**: el nombre (marrón) sobre la parte vacía (oscura) de la barra no llegaba ni a 1,1:1. Ahora el nombre lleva **su propia placa crema** (`background:var(--cream-field)`, `border-radius:0 28px 28px 0`, `z-index:1`) → ratio 8,5:1.
    - **`.lvl-row.locked .tag` / `.dot`**: bajarle la opacidad a la fila completa dejaba el marrón sobre el arte en 1,7:1. Se sacó la opacidad de la fila y se aplica **`filter:grayscale()` + `brightness()`** solo a la plaqueta y al ícono: el candado se sigue viendo bloqueado y el texto queda en 4,6:1.
  - Detalles que hacían fallar la medición (y no la pantalla): los rectángulos recortados por un ancestro con `overflow` no pintan glifos (hay que intersectar el rect con esos ancestros), `page.evaluate` **acepta un solo argumento** (pasar dos silenciaba el segundo y daba "SIN GLIFOS" en toda la pantalla), y en `vestir.html` hay que medir `.ditem .lock` porque el SVG del ícono usa `currentColor`.
  - Resultado final: **0 de 97 mediciones bajo el umbral**, con 12 pantallas y 33 selectores cubiertos, y verificación visual en `tools/out/contraste-niveles.png` y `contraste-ranking.png`.

**Criterio para cerrar:** ✅ cumplido — `npm run content` sin errores, `npm run i18n` con 0 diferencias, los 10 casos leídos a mano y las 30 palabras del desafío validadas por script.
**Commit:** `P3 · contenido: lectura humana de los 10 casos y manual en inglés`.

> **Pasos a la Parte 4:** el tutorial (`assets/video/tutorial.webm`) se grabó con las plaquetas viejas y hay que regrabarlo (`npm run tutorial`), pero **primero conviene revisar a ojo las capturas nuevas** (`npm run shots`), porque el cambio de la placa del ranking y de las plaquetas bloqueadas modifica la interfaz que el video tiene que mostrar. El contraste ya no es deuda: quedó medido con un método reutilizable.

---

## PARTE 4 · Recursos (video, música y arte) ✅

**Objetivo:** que los recursos mostrados sean la interfaz final, y que lo entregado sea reproducible en el aula.
**Tiempo estimado:** 1-2 h, con descargas de dependencias incluidas.

- ✅ **4.1 · Regrabar el tutorial.** El video viejo (59,8 s) **estaba roto y nadie lo había visto**: `tools/build_tutorial.js` respondía solo 3 de las 10 preguntas y sus `hold()` fijos caían dentro de la ventana de devolución de 5200 ms, donde las opciones están `disabled` → los clics no ocurrían y el video terminaba en "Pregunta 3 de 10", sin mostrar nunca el desafío de palabras ni el resultado. Se comprobó extrayendo el frame de los 58 s del `.webm` ya commiteado (`git show 6cef8ec:…`), así que el defecto venía de antes, no de esta parte.
  - El script ahora está **manejado por eventos**: una ayuda `esperar(qué, fn, arg, ms)` hace `waitForFunction` y **corta con error** si la pantalla no avanza (antes se tragaba el silencio). El lazo de preguntas espera `.q-opt:not([disabled])` antes de leer la clave (si no, se leía la clave de la pregunta siguiente con la devolución de la anterior todavía en pantalla y el clic pegaba en un botón deshabilitado), y el de palabras espera `x.done` palabra por palabra.
  - Video nuevo: **1:13.52 · 21 931 KB · VP9 1280×720 a 25 fps** + `tutorial-poster.jpg` (101 KB) regenerado. Recorre portada → registro → menú → selección → título → consigna → 3 carpetas → juicio → **las 10 preguntas** → **las 3 palabras** → resultado.
  - Revisar los frames del video encontró **dos defectos reales de interfaz** que las capturas fijas no mostraban:
    - **La nota del resultado chocaba contra los botones** en el estado "ganado". `resultado.js` resumía la devolución con `split('.')[0]`, y como la Parte 3 escribió "artículo 14" en vez de "art. 14", la primera frase pasó de ~60 a **255 caracteres** → 4 líneas en una banda de 122 px (`.res-stats` baja a 464, `.res-btns` sube a 588). Medido con `tools/out/check-nota.js`: el peor caso (mensaje de desbloqueo + frase) terminaba en 632, **44 px encima** de los botones.
      Fix: `resumen()` en `js/pages/resultado.js:48-60` corta la primera frase en **150 caracteres** al último espacio (con `…`), y pide **mayúscula después del punto** para no romperse en "art." ni en "inc." — así el caso 4 dejó de decir "…los artículos 14 y 75 inc.". Más `css/game.css:176`: `.res-note` de 24/1.35 a **22/1.3** (sigue siendo texto grande a 700: umbral 3:1, el color no cambió). Peor caso medido ahora: **556 vs 588** en horizontal y **869 vs 942** en vertical.
    - **Las plaquetas de nivel bloqueado volvieron a confundirse** con las disponibles: el `filter:grayscale(.4) brightness(.94)` de la 3.4 se veía casi igual en el video. Se cambió por la plaqueta **crema apagada `#c3b096`** (contraste 4,1:1 con el marrón del texto, grande) y el candado queda en el círculo. Verificado en el frame de los 7 s del video nuevo.
- ✅ **4.2 · Decisión: se entrega WebM.** El ffmpeg que trae Playwright (`%LOCALAPPDATA%/ms-playwright/ffmpeg-1013`) solo tiene codificadores `png` y `libvpx-vp9` y muxers `webm` e `image2`: **no hay `libx264`, no hay contenedor MP4 y no hay ningún codificador de audio**, así que el tutorial es mudo por construcción y convertir a MP4 implicaría descargar un ffmpeg completo. Se queda WebM/VP9 (es lo que el `<video>` de `pages/niveles.html` ya declara).
  - **Riesgo abierto, es de presentación y no técnico:** hay que **abrir `assets/video/tutorial.webm` en la PC y el proyector del aula** antes de la entrega. Si no reproduce, el plan B es descargar ffmpeg y generar el MP4; el reproductor ya se oculta solo si el archivo no carga, así que no rompe nada.
  - El audio del juego no depende de esto: `index.html` usa MP3/WAV, que cualquier navegador actual reproduce.
  - **05/11 · el riesgo se midió en vez de suponerse** (`Codigo/tools/out/check-video.js`, 4 motores × 3 cargas,
    más `check-video-falla.js` y `check-tuto-nota.js`):
    * El archivo está sano: **VP9 Profile 0, yuv420p, 1280×720, 25 fps, un solo stream, sin audio**; la
      decodificación completa dio **1837 frames** (73,48 s exactos) sin un solo error.
    * **Chromium, Edge y Firefox 157 lo reproducen en tiempo real** (3,01 s de video en 3,01 s de reloj),
      por http **y por `file://`** (abrir el juego con doble clic), con descartes de 0 a 3 cuadros sobre
      ~80 y saltos de la barra de 21 a 292 ms. Hasta con el `Content-Type` puesto como
      `application/octet-stream` suena bien: lo que importa es que el servidor mande `Accept-Ranges`
      (`http-server` manda `206 Partial Content`, está cubierto).
    * **WebKit —el motor de Safari y los iPad— no lo carga**: `canPlayType()` dice "probably" pero no trae
      metadatos, y no dispara `error` ni `loadedmetadata`. Es el único agujero real, y no se puede cerrar
      desde esta máquina (no hay `libx264` ni muxer MP4).
    * **Fix 1 — la pantalla acepta el MP4 sin tocar código:** `pages/niveles.html` ahora declara dos
      `<source>` (WebM primero, `tutorial.mp4` después). Si alguien con un ffmpeg completo genera ese
      archivo y lo deja en `assets/video/`, Safari lo toma solo; si no existe, no se pide (medido: a
      Chromium no le llega ni un pedido de `tutorial.mp4`).
    * **Fix 2 — el aviso reemplaza al reproductor:** antes, si el video no cargaba, la caja desaparecía a
      secas (y en WebKit desaparecía igual sin disparar ningún evento). Ahora `js/pages/niveles.js` pone
      un watchdog de 6 s y muestra `DF.i18n.t('tutoNoVideo')` — un texto que ya estaba traducido en los
      dos idiomas y **nunca se había usado** — en el mismo rincón. Verificado en los 5 escenarios: video
      bueno (aviso oculto), 404, 404 vertical, WebKit español y WebKit inglés; la caja queda dentro del
      stage y no pisa la lista de niveles.
    * **Lo que NO detecta el juego:** un `.webm` **truncado o dañado**. Chromium lo acepta igual
      (`readyState=4`, sin error) y muestra el tutorial cortado; solo se oculta si el archivo falta o si
      el códec no soporta. Si se copia la carpeta a un pendrive, hay que revisar que
      `tutorial.webm` pese **22.993.851 bytes**.
    * Después de los dos cambios: `npm test` **20/20**, `npm run audit` **9 tamaños × 17 pantallas OK**,
      `npm run i18n` **0 diferencias**. El tutorial no se regrabó: el aviso solo aparece cuando el video
      falla, y en el entorno de grabación el video carga.
- ✅ **4.3 · Música y licencia.** `assets/audio/` quedó exactamente como resolvió la 1.1: `musica-quiz.mp3` (0,98 MB) + `musica-quiz.wav` (10,77 MB) de respaldo, **sin `.ogg`**. `npm run mp3` **reproduce el MP3 byte a byte** (mismo MD5 antes y después), así que el artefacto entregado es derivable del WAV. `LICENCIA.txt` describe el mix final y es correcto: obra original del grupo, CC0, 64,000 s de loop perfecto a 120 BPM en Re menor, pico 0,72, y ya avisa que el `.ogg` se puede agregar con el mismo nombre base si alguien lo consigue.
  - Único paso no reproducible en esta máquina: el WAV lo genera `tools/build_music.py` y **acá no hay Python**. No bloquea nada (el WAV está commiteado y el MP3 se regenera desde él), pero hay que anotar que la cadena completa necesita Python.
- ✅ **4.4 · Arte regenerado.** `npm run assets` volvió a producir los 12 PNG **idénticos** (ningún `git status` en `assets/icons` ni `assets/img`), así que la Parte 1 no tocó el generador y no hubo que rehacer arte. `npm run hit`: **6 de 6 ok**, las áreas de clic calzan con el arte (mismos porcentajes de `clip-path` que el alpha del PNG).
- ✅ **4.5 · Revisión visual.** `npm run shots` → 17 capturas + 3 montajes revisados a ojo, sin desbordes ni textos cortados; `npm run audit` cierra **9 tamaños × 17 pantallas**. Los dos únicos hallazgos visuales de esta parte (la nota del resultado y las plaquetas bloqueadas) venían de los **frames del video**, no de las capturas: las capturas siembran una cuenta con niveles ya jugados y por eso nunca mostraban el mensaje de desbloqueo que empuja la nota a 4 líneas. Método que queda: revisar el video frame a frame, no solo las capturas.

**Criterio para cerrar:** ✅ cumplido — tutorial nuevo mostrando la interfaz final (1:13.52), `npm run assets` idéntico, `npm run hit` 6/6, `npm run audit` 9×17, `npm test` 20/20, `npm run i18n` 0 diferencias. **Queda afuera lo que no se puede hacer desde este checkout:** validar el WebM en el equipo del aula (4.2) y regenerar el WAV con Python (4.3).
**Commit:** `P4 · recursos: tutorial regrabado y arte coherente`.

> **Pasos a la Parte 5:** el Readme sigue diciendo `tutorial.mp4` y `musica-quiz.ogg` (5.1) — ahora que la 4 cerró, el formato real es WebM mudo y MP3+WAV. Conviene que la 5.2 lleve el `.webm` en la prueba física: es el mismo riesgo que quedó abierto acá.

---

## PARTE 5 · Prueba real, documentación y licencias

**Objetivo:** que el Readme no prometa nada que el juego no haga y que la entrega esté documentada y licenciada.
**Cambio de alcance pedido:** **no se arma ningún ZIP.** La entrega es el repositorio; `Codigo/` ya es portable.
**Tiempo estimado:** 1-2 h + la prueba en dispositivos.

- ✅ **5.1 · Readme verificado** (`Codigo/Readme.md`). Cada afirmación se chequeó contra el repo, no contra la memoria:
  - Sacado `js/data/niveles-previos.js` (no existe); agregado `js/core/run.js` y la marca de **GENERADO** en `niveles.js`.
  - Formatos reales: música **MP3 + WAV** (sin `.ogg`) y tutorial **WebM/VP9 mudo** (no MP4).
  - Sección 2: la lista llegó a **20 casos** con el de *Borrar mi progreso*, que se describe.
  - Sección 4: documentados *Borrar mi progreso* (limpia solo la cuenta abierta) y el **mejor puntaje por nivel** del ranking.
  - Sección 6: lista completa de `tools/` (content, `build_content.js`, `build_audio.mjs`, `build_assets.js`, `build_tutorial.js`, `pixel.js`, `shots.js`, `montage.js`, `check_i18n.js`, `check_hit_areas.js`, `preview_avatars`, `out/` gitignoreado) y `tests/smoke.js`.
  - Sección 7: el contenido se edita en `tools/content/casos-*.json` + `npm run content`; `DF.rules` (reglas y puntaje máximo) vive en `tools/build_content.js`.
  - Verificación: un script recorrió todas las rutas y nombres entre backticks del Readme y confirmó que **existen** (el único falso negativo fue `index.html`, por cómo el script armaba las carpetas).
- 🔶 **5.2 · Probar con tacto real — NO SE PUDO HACER DESDE ACÁ.** Requiere el celular, la tablet y el proyector del aula: tacto, autoplay de Safari/iOS, el WebM en el equipo de la clase y la legibilidad proyectada. Queda escrito como riesgo en `Documentación/Pendiente.md` (sección 2). Todo lo que se corrió acá fue **Chromium de escritorio**.
- ✅ **5.3 · Playthrough completo con cuenta nueva** (`Codigo/tools/out/playthrough.js`, gitignoreado). Juega **por el contenedor** —el juego vive en el iframe `df-shell`—, escribe el registro a mano y usa el teclado del desafío de palabras. Cuenta nueva `charca.5.3@df.test`, sin sembrar `localStorage`.
  - **Recorrido horizontal (1280×720), 26 capturas:** portada → registro → menú → selección (2-4 bloqueadas) → nivel 1 → consigna → 3 carpetas leídas (0→3) → juicio → **10 preguntas** (con la oficial fotografiada) → **3 palabras resueltas escribiéndolas** → `¡CASO GANADO!` 1548 pts, 3 estrellas → a los 8 s vuelve solo a Selección de nivel.
  - **Perder también desbloquea:** el nivel 2 jugado a propósito en falso da `CASO PERDIDO` 0 pts y deja las plaquetas `1:won · 2:lost · 3:next · 4:locked`. Tocar un nivel con candado **no navega** (se queda en `niveles.html` y muestra "Terminá el nivel 3 para desbloquear.").
  - **Vestuario persistente:** se cambian prendas, se recarga la página del juego y sigue en `vestir.html` con las prendas puestas (la sesión vive en `sessionStorage`, las cuentas en `localStorage`).
  - **Ranking:** una sola fila, `1548 pts ★★★ NIVEL 1 · 1548` (suma el mejor por nivel).
  - **`errores: []`** — ni `pageerror` ni errores de consola en las 26 pantallas del recorrido.
  - **Segunda pasada en vertical (720×1280), 24 capturas:** mismo recorrido completo y también sin errores de consola.
  - **Dos defectos reales encontró la pasada vertical** (las pruebas automáticas no los veían porque el `audit` chequea desbordes y scroll, **no superposición entre hermanos**):
    1. El desafío de palabras **montaba la grilla sobre la pista** en vertical (`tablet vertical` +14 px, `720×1280` +18 px) y en `celular apaisado` (+9 px). La caja de la pista mide lo que ocupa su texto más las dos líneas del meta, y el CSS le daba a la grilla un `top` fijo. Se arregló en `js/pages/palabra.js` apoyando la grilla **debajo de la caja cuando el `top` del CSS no alcanza** (donde alcanza, manda el CSS). Verificado con `tools/out/check-palabra-v.js`: **30 combinaciones** (10 tamaños × 3 pistas largas) dan `caja/grilla` negativo, la grilla no toca el teclado y nada se sale del escenario. Costado: en horizontal la grilla baja de 188 a 208 px, así que **el tutorial se regrabó**.
    2. La nota del resultado perdido repetía el botón: `… Perdido · podés reintentar · REINTENTAR NIVEL`. En `js/pages/resultado.js` la nota usa `nivelPerdido`, que ya dice "Perdido · podés reintentar"; se sacó el `reintentarNivel` concatenado. Medido tras el cambio: la nota termina 61 px antes del botón en horizontal y 174 px en vertical.
  - **Después de los dos cambios se volvió a verificar todo:** `npm test` **20/20**, `npm run audit` **9 tamaños × 17 pantallas OK**, `npm run i18n` **0 diferencias** (manual 8 bloques / 32 párrafos ES y EN), `npm run hit` **6/6**, la pasada vertical del playthrough **recorrída de nuevo** (24 capturas, `errores: []`) y el tutorial **regrabado** (1:13.48, VP9 1280×720 mudo, 22.455 KB) con el frame del desafío de palabras revisado a ojo.
  - **Trampa que hay que recordar** (rompía el script): las opciones del cuestionario están `disabled` durante los 5,2 s de la devolución oficial, y `js/pages/palabra.js` **rechaza un intento que no tenga el largo exacto** sin consumir intento. Un playthrough ingenuo se corta o se queda trabado para siempre.
- ✅ **5.4 · Licencias (sin ZIP).** Los tres avisos están escritos y verificados contra el código: `assets/audio/LICENCIA.txt` (obra del grupo, CC0), `assets/fonts/LICENCIA.txt` (SIL OFL 1.1, 5 `.woff2` autoalojados, sin CDN; las variables reales son `--font-title`/`--font-text`/`--font-body` — **no existe `--font-serif`**) y `assets/video/LICENCIA.txt` (grabación propia, mudo por construcción). El juego también muestra los créditos en *Manual → Créditos*, en los dos idiomas. **El ZIP queda explícitamente afuera.**
- ✅ **5.5 · Cierre de documentación.** El `README.md` de la raíz pasó de 3 líneas a decir qué es el juego, dónde está cada carpeta (`Recursos graficos/` es material de referencia y **no** lo lee el juego), cómo ejecutarlo, cómo probarlo, las licencias y qué falta. La Parte 5 de este plan queda con el estado real y `Documentación/Pendiente.md` lista lo que sigue.

**Criterio para cerrar:** ✅ cumplido **salvo 5.2**, que necesita equipo físico. Readme sin referencias a archivos inexistentes, `npm test` 20/20, playthrough horizontal **y vertical** con cuenta nueva y `errores: []`, licencias documentadas y tutorial regrabado con la interfaz final.
**Commit:** `P5 · entrega: Readme verificado, playthrough horizontal y vertical y licencias (sin ZIP)`.

---

## Orden sugerido

| # | Parte | Cuándo sabés que terminó |
|---|---|---|
| 1 | Bug cero y línea base | ✅ cerrada el 03/11: 404 = 0 con el filtro nuevo; 4 suites verde |
| 2 | Lo que falta codear | ✅ cerrada el 03/11: `npm test` = 20 ok, `i18n` 0 diferencias |
| 3 | Contenido y traducción | ✅ cerrada el 03/11: 10 casos leídos a mano + manual EN + contraste medido |
| 4 | Recursos | ✅ cerrada el 03/11: tutorial regrabado (y el viejo estaba roto), WebM decidido, arte idéntico |
| 5 | Prueba real y licencias | ✅ cerrada el 04/11 (menos 5.2): Readme honesto + playthrough horizontal y vertical sin errores de consola + licencias. **Sin ZIP, por decisión del equipo** |

Dependencias: **la Parte 1 va primero sí o sí** (si el test 13 sigue perdonando 404, las partes 2 a 5 se verifican sobre una base que miente). Las Partes 2 y 3 se pueden invertir sin problema. La 4 después de la 2 (el tutorial graba la interfaz, así que conviene grabarlo con las pantallas ya terminadas). La 5 siempre al final.
