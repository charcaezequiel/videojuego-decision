# DF · Decisión Final — qué falta hacer

Estado al **03/11/2026**. Las Partes 1 a 4 del `Plan de acción 2.md` están cerradas y commiteadas:

| Commit | Parte |
|---|---|
| `4298fb2` | P1 · recursos y pruebas: audio coherente y test 13 sin filtro ciego |
| `c65d8bf` | P2 · pantallas: borrar progreso, ranking por nivel y foco de teclado |
| `a503dfd` | P3 · contenido: lectura humana de los 10 casos y manual en inglés |
| `8b7641e` | P4 · recursos: tutorial regrabado y arte coherente |

La **Parte 5 está empezada**: 5.1 terminada, 5.3 a medias, 5.2 / 5.4 / 5.5 sin empezar.

---

## 1 · Playthrough manual: qué falta cerrar (5.3)

Ya está **verificado jugando de verdad** (cuenta nueva `charca.5.3@df.test`, entrando por `index.html`,
sin sembrar `localStorage`, con el script `Codigo/tools/out/playthrough.js`):

`portada → registro → menú → selección → nivel 1 → consigna → 3 carpetas leídas → juicio →
10 preguntas → 3 palabras → resultado "CASO GANADO" → a los 8 s vuelve solo a Selección de nivel`
con las plaquetas 2-4 todavía bloqueadas y NIVEL 1 pasado.

Falta verificar del mismo script (los pasos están escritos, no ejecutados hasta el final):

- [ ] **Perder el nivel 2 desbloquea el 3** (y el 2 queda marcado "Perdido · podés reintentar").
      *Por qué se cortó:* el desafío de palabras **rechaza un intento que no tenga el largo exacto de la
      palabra** (`js/pages/palabra.js:118`) sin consumir intento. El script escribía `QWZX` y quedaba
      trabado para siempre. Ya está corregido para escribir `Q` repetido `largo` veces; hay que correrlo.
- [ ] **Tocar un nivel bloqueado no navega** a ninguna pantalla.
- [ ] **El vestuario se mantiene al recargar** (cambiar dos prendas, recargar `index.html`, seguir en la
      misma pantalla con las prendas puestas).
- [ ] **Sin errores de consola** en todo el recorrido (el script los acumula y los imprime al final).
- [ ] Correrlo también **en vertical** (720×1280), que es donde el layout se reacomoda.

```bash
cd Codigo && npm run serve        # otra terminal, puerto 8099
node tools/out/playthrough.js
```

## 2 · Prueba física en dispositivos (5.2) — nada de esto está hecho

El `npm run audit` simula el viewport, **no simula dedos**. Hay que probar con el equipo real:

- [ ] **Celular y tablet**, en horizontal y vertical: tamaño de los botones, teclado del desafío de
      palabras (las teclas son de 32 px en el stage; en un celular chico se escala, no se agranda).
- [ ] **Safari / iOS:** la música arranca con el primer gesto (el navegador bloquea el autoplay).
      El volumen en iPhone/iPad se aplica con Web Audio (`js/core/music.js:21-35`) porque Safari ignora
      `video.volume`; verificar que se escuche y que el slider funcione.
- [ ] **El video tutorial en el aula:** abrir `assets/video/tutorial.webm` en la PC y el proyector donde
      se va a mostrar. Es **WebM/VP9 y mudo**; si el equipo del aula no lo reproduce, la alternativa es
      descargar un ffmpeg completo y convertir a MP4 (el ffmpeg de Playwright no puede: no tiene
      `libx264`, ni muxer MP4, ni codificador de audio). Si el archivo no carga, el reproductor se oculta
      solo y el juego sigue funcionando.
- [ ] **Proyección real:** el ajuste de brillo atenúa todo el escenario; verificar la legibilidad de los
      textos chicos (preguntas y nota del resultado) sobre el proyector, no solo sobre el monitor.

## 3 · Empaquetar la entrega (5.4)

- [ ] Generar el ZIP con **`Codigo/` sin `node_modules/` ni `tools/out/`** (los dos ya están en
      `.gitignore`) **más `Documentación/`**.
- [ ] Abrir el ZIP **en otra máquina** y verificar que `index.html` funcione con doble clic y que el
      juego termine un nivel sin red (todas las fuentes y el video son locales).
- [ ] Licencias: la música está documentada en `Codigo/assets/audio/LICENCIA.txt` (CC0, obra del grupo)
      y las **3 fuentes** en `Codigo/assets/fonts/LICENCIA.txt` (SIL OFL 1.1, autalojadas, sin CDN).
      Los créditos de las fuentes también se ven dentro del juego (manual → créditos, en los dos idiomas).
      [ ] Si la cátedra pide el texto legal **completo** de cada fuente, hay que descargar el `OFL.txt`
      de cada familia y ponerlo junto al `.woff2`.

## 4 · Cierre de documentación (5.5)

- [ ] El `README.md` de la raíz son 3 líneas ("VIDEOJUEGO-DECISI-N-FINAL- / Grupo LPC: 5°2"). Debe decir
      qué versión del juego se entrega, cómo ejecutarla y dónde está cada cosa.
- [ ] Decidir si `Plan de acción 2.md` pasa a llamarse `Plan de acción.md` o se deja el "2" con el estado
      final, y que el Readme lo aclare.
- [ ] `Recursos graficos/` (9,1 MB de PNG del prototipo original) está versionada pero **no forma parte
      del juego**: aclarar en el Readme de la raíz que es material de referencia, o sacarla del ZIP.

## 5 · Deuda conocida que no bloquea la entrega

- **No hay Python en esta máquina**, así que `npm run sprites` y `npm run music` no se pueden correr acá.
  Los artefactos (`js/data/vestuario.js` y `musica-quiz.wav`) están commiteados y el MP3 se regenera
  desde el WAV con `npm run mp3` (verificado: sale **byte a byte** igual).
- **`core.autocrlf=true` sin `.gitattributes`:** cada `npm run content` puede dejar un diff fantasma de
  fines de línea sobre `js/data/niveles.js`. Conviene agregar un `.gitattributes` (`* text=auto`,
  `*.js text eol=lf`) antes de la entrega o asumir que hay que revisar `git diff --stat`.
- **El PDF "Casos definitivos" del caso 1** puede estar desalineado con el contenido corregido en la
  Parte 3 (la pregunta oficial se reescribió y el juego cita "artículo 14" completo). **Revisar a ojo el
  PDF contra el juego** antes de entregar: es lo único que la cátedra puede comparar.
- Las herramientas de verificación propias viven en `Codigo/tools/out/` (gitignoreado, no se entrega):
  `check-casos.mjs` (cotas de los 10 casos), `check-contrast.js` (contraste WCAG medido),
  `check-manual.js`, `check-nota.js` (banda de la nota del resultado) y `playthrough.js`.

## 6 · Antes de entregar, correr todo esto desde `Codigo/`

```bash
npm install
npx playwright install chromium
npm run serve &            # puerto 8099
npm run content && npm run i18n   # 0 diferencias, manual 8 bloques / 32 párrafos ES y EN
npm test                   # 20 pruebas
npm run audit              # 9 tamaños × 17 pantallas
npm run hit                # 6 áreas de clic
npm run assets && npm run mp3     # no deben cambiar nada: los PNG y el MP3 tienen que quedar idénticos
npm run shots              # revisar los 3 montajes a ojo
node tools/out/playthrough.js     # el playthrough de la sección 1
```

Si además se tocaron pantallas, volver a grabar el tutorial con `npm run tutorial` (el script falla
ruidosamente si el juego no avanza, así que un video cortado no pasa desapercibido).
