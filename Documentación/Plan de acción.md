# Plan de acción · DF · Decisión Final

**Objetivo:** que el proyecto final llegue a su mejor versión — jugable de principio a fin, con todos los recursos visuales y sonoros propios del juego (botones, marcos, avatar, música, tutorial) y verificado automáticamente.

Estado al 2026-11-02. Leyenda: ✅ hecho y verificado · 🔶 hecho, falta reverificar · ⬜ pendiente.

---

## 1. Base del juego (arquitectura y pantallas)

- ✅ Estructura separada: `index.html` (contenedor con la música) + `pages/*.html` (una pantalla por archivo) + `js/core` / `js/data` / `js/pages` / `css` / `tools` / `tests`.
- ✅ Módulos core: `store` (cuentas), `progress` (desbloqueos), `run` (partida en curso), `boot`/`DF.nav` (mapa único de flechas), `music`, `shell`, `timer`, `sprites`, `i18n`, `audio`, `stage`, `scrollbar`.
- ✅ 17 pantallas: portada, registro, menú, configuración, soporte, ranking, manual, vestuario, selección de nivel, título, descripción, expediente (3 carpetas), juicio, preguntas, desafío de palabras, resultado y pantalla final.
- ✅ Flujo completo jugable: `Portada → Registro → Menú → Nivel → Título → Descripción → Carpetas → Juicio → 10 preguntas → 3 palabras → Resultado → Selección de nivel`.
- ✅ Cuentas separadas por correo, sesión por pestaña, ajustes por dispositivo y migración desde `df_decision_final_v1`.

## 2. Contenido educativo

- ✅ 10 casos con denuncia, testimonios, pruebas y devolución (art. 43 CN, derecho de petición, audiencia pública, Defensoría del Pueblo, amparo).
- ✅ 100 preguntas (10 por nivel), la 1.ª de cada nivel es la oficial del PDF y conserva su orden A-D; las otras 9 se barajan en cada partida.
- ✅ 30 palabras del desafío final (3 por nivel) con su pista.
- ✅ Pipeline de contenido: `tools/content/casos-*.json` → `node tools/build_content.js` → `js/data/niveles.js`, con validación del JSON y **relectura del archivo generado**.
- ✅ **Bug crítico corregido:** el generador escribía la clave correcta como `"\"A\""` y el flag como `"\"false\""` (doble `JSON.stringify`). Resultado: **ninguna respuesta se tomaba como correcta** y las 100 preguntas parecían "oficiales" → el juego era injugable y nadie podía ganar un nivel. Regenerado y con guard automático que falla la build si la clave no es `A-D` o `oficial` no es booleano.
- 🔶 Texto de los 10 casos y 100 preguntas: corregido por máquina (tildes, concordancia) pero falta **una lectura humana final** antes de entregar.

## 3. Recursos gráficos propios (pixel-art generado por código)

- ✅ Personaje: 12 categorías y 40 prendas + 5 tonos de piel, en pixel-art (`tools/build_sprites.py` → `js/data/vestuario.js`, dibujado por `js/core/sprites.js`).
- ✅ Escenas del juicio: juez, fiscal y tribunal en SVG pixel-art.
- ✅ 8 íconos/botones PNG (`assets/icons/`): flecha, flecha de registro, jugar, manual, perfil, configuración, ranking, soporte.
- ✅ Marcos 9-slice nuevos (`assets/img/`): `marco-doc.png` (madera + oro del expediente), `speech-box.png` (bocadillo del juicio), `sello.png` (sello judicial), `fondo.png`, `logo.png` y las 3 carpetas.
- ✅ Generador determinístico: `tools/pixel.js` + `tools/build_assets.js` (`npm run assets`).
- ✅ Áreas de clic medidas **sobre el arte real** (`tools/check_hit_areas.js`): elipse para los íconos redondos, placa completa para los rectangulares (`--hit-r`).
- ✅ Plaquitas A/B/C/D en las opciones del cuestionario y tarjeta de nivel con `NIVEL n` + subtítulo del caso.
- 🔶 `assets/img/barra.png` se genera pero **no se usa** en ninguna pantalla: decidir si se usa o se saca del generador.

## 4. Audio

- ✅ Música de fondo: composición original del proyecto (chiptune de quiz, loop 64 s, CC0) generada por `tools/build_music.py` (WAV) y `tools/build_audio.mjs` (MP3) → `assets/audio/musica-quiz.mp3` + `.wav` + `LICENCIA.txt`.
- ✅ Efectos de sonido (acierto, error, tecla, botón) y volumen regulado desde Configuración, con soporte de iPhone/iPad vía Web Audio.
- ✅ La música no se corta al cambiar de pantalla (vive en `index.html`) y se pausa si la pestaña queda atrás.

## 5. Video tutorial

- ✅ Grabado jugando el juego real con Playwright (`tools/build_tutorial.js`): 59,8 s, 1280×720, `assets/video/tutorial.webm` + `tutorial-poster.jpg`.
- ✅ Reproductor en *Selección de nivel* (play/pausa, barra, ampliar) que se oculta si el archivo no existe.
- ⬜ **Regrabar** después de los últimos cambios de CSS (plaquetas A/B/C/D y área de clic), para que el video muestre la interfaz final.
- 🔶 MP4 no es posible con el ffmpeg que trae Playwright (sin libx264 ni muxer mp4); se entrega WebM. Si se necesita MP4 para proyectarlo, hay que conseguir un ffmpeg completo.

## 6. Pruebas y verificación

- ✅ `tests/e2e.js` — 19 casos funcionales: **19 ok / 0 fallan**. Cubre las 10 preguntas, tiempo agotado, bloqueo de respuesta, flechas dentro/fuera del cuestionario, palabras y redirección, desbloqueos, botón siguiente nivel, vestuario persistente, manual, nivel 10 + pantalla final, URLs inválidas y doble clic, recursos/consola limpios, cuentas separadas, migración v1→v2, mapa de flechas, área de clic, música en el contenedor y video tutorial.
- ✅ `tests/layout-audit.js` — **9 tamaños de pantalla × 17 pantallas: sin problemas** (nada fuera del escenario, sin scroll de página, sin texto cortado, botones tocables). Incluye una prueba de estrés con el enunciado más largo del juego (137 caracteres).
- ✅ `tools/check_i18n.js` — diccionario ES/EN contra los `data-i18n` de las pantallas: 0 diferencias, 0 claves desalineadas.
- ✅ Revisión visual: `tools/shots.js` (17 capturas) + `tools/montage.js` (montajes para revisar).
- ✅ Ajuste automático del enunciado (`fitText` en `js/pages/desafio.js`) para que nunca se corte en vertical.
- 🔶 **Volver a correr** `npm test` y `npm run audit` después del último cambio de CSS (hover/presión sobre el `<img>`), que además arregla un toque perdido cerca del borde de un botón.
- ⬜ Probar con **tacto real** en un celular y una tablet (el audit simula viewport, no dedos) y verificar el bloqueo de autoplay en Safari/iOS.

## 7. Entrega y documentación

- 🔶 `Readme.md`: actualizar estructura de `tools/` nuevas (`build_content.js`, `build_audio.mjs`, `pixel.js`, `build_assets.js`, `shots.js`, `montage.js`, `check_i18n.js`, `check_hit_areas.js`, `build_tutorial.js`), `js/core/run.js`, formatos reales (`.mp3`/`.wav`, `tutorial.webm`) y la lista de casos de prueba.
- 🔶 `package.json`: faltan los scripts `content`, `audio`, `assets`, `shots`, `i18n`, `hit`, `tutorial` (`test` y `audit` ya existen).
- ⬜ Empaquetar la entrega: ZIP limpio de `Codigo/` (sin `node_modules` ni `tools/out`), carpeta de documentación y confirmación de licencias de fuentes (Bebas Neue, Instrument Serif, Quicksand) y música.
- ⬜ Archivo suelto `Codigo/decision-final (2).zip`: confirmar si es un residuo y sacarlo del proyecto.

## 8. Mejoras opcionales (si da tiempo el sprint)

- ⬜ Accesibilidad: foco visible en todos los botones, `role`/`aria-label` en flechas y placas, contraste de los textos chicos y navegación completa por teclado en registro, configuración y soporte.
- ⬜ Botón *Borrar mi progreso* dentro de Configuración (hoy hay que borrar los datos del sitio desde el navegador).
- ⬜ Mostrar estrellas y mejor puntaje por nivel en el ranking.
- ⬜ Traducir el texto largo del manual al inglés (hoy la interfaz se traduce y el manual queda en español).

---

## Cómo verificar todo

```bash
cd Codigo
npx http-server -p 8099 -c-1 .        # servidor local
npm test                              # 19 pruebas funcionales
npm run audit                         # 9 tamaños × 17 pantallas
node tools/check_i18n.js              # textos e idiomas alineados
node tools/check_hit_areas.js         # áreas de clic vs. el arte
node tools/shots.js && node tools/montage.js   # capturas de revisión
node tools/build_tutorial.js          # regrabar el video tutorial
```

## Orden sugerido para cerrar

1. Re-verificar pruebas tras el último CSS (6).
2. Regrabar el tutorial (5).
3. Actualizar `Readme.md` y `package.json` (7).
4. Limpieza del ZIP de entrega y licencias (7).
5. Lectura humana de los 10 casos (2) y prueba en celular real (6).
