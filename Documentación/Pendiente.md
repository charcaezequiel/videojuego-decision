# DF · Decisión Final — qué falta hacer

Estado al **04/11/2026**. Las Partes 1 a 5 del `Plan de acción 2.md` están cerradas y commiteadas:

| Commit | Parte |
|---|---|
| `4298fb2` | P1 · recursos y pruebas: audio coherente y test 13 sin filtro ciego |
| `c65d8bf` | P2 · pantallas: borrar progreso, ranking por nivel y foco de teclado |
| `a503dfd` | P3 · contenido: lectura humana de los 10 casos y manual en inglés |
| `8b7641e` | P4 · recursos: tutorial regrabado y arte coherente |
| `HEAD` | P5 · entrega: Readme verificado, playthrough horizontal y vertical y licencias (sin ZIP) |

**La única parte que no se pudo cerrar es la 5.2** (probar en dispositivos físicos), y no es un
tema de código: hace falta el celular, la tablet y el proyector del aula.

---

## 1 · Playthrough con cuenta nueva (5.3) — cerrado, y encontraron dos defectos

Corrido **dos veces** con el script `Codigo/tools/out/playthrough.js` (cuenta nueva
`charca.5.3@df.test`, entrando por `index.html`, sin sembrar `localStorage`):

- **Horizontal 1280×720 · 26 capturas:** `portada → registro → menú → selección → nivel 1 → consigna →
  3 carpetas (0→3 leídas) → juicio → 10 preguntas → 3 palabras escritas → ¡CASO GANADO! 1548 pts · 3 estrellas →
  a los 8 s vuelve solo`. Después: perder el nivel 2 a propósito deja `1:won · 2:lost · 3:next · 4:locked`,
  tocar un nivel con candado **no navega**, el vestuario **sobrevive a la recarga**, el ranking muestra
  `1548 pts ★★★ NIVEL 1 · 1548` y **`errores: []`**.
- **Vertical 720×1280 · 24 capturas:** el mismo recorrido completo, también sin errores de consola.

Los dos defectos que aparecieron en la pasada vertical ya están corregidos (detalle en la Parte 5 del plan):
la grilla del desafío de palabras se montaba sobre la pista (`js/pages/palabra.js`) y la nota del nivel
perdido repetía el texto del botón (`js/pages/resultado.js`). Como el desafío de palabras se movió 20 px
en horizontal, **el tutorial se regrabó**.

**Lo que queda de la 5.3, si alguien quiere seguir apretando botones:**

- [ ] Recorrer los **10 niveles** jugando (el script juega 1 completo y 2 perdido; el resto lo cubren las pruebas).
- [ ] Abrir el juego en **modo avión** y verificar que no pida nada a internet (fuentes, música y video son locales).
- [ ] Probar el **recorrido por teclado** con un teclado físico de celular/tablet (las flechas ya están cubiertas por `npm test`).

```bash
cd Codigo && npm run serve        # otra terminal, puerto 8099
node tools/out/playthrough.js     # horizontal
V=1 node tools/out/playthrough.js # vertical (juega el nivel 1 y saltea el nivel 2 perdido)
node tools/out/check-palabra-v.js # 10 tamaños × 3 pistas largas: caja de la pista vs grilla vs teclado
```

> **Trampas conocidas del playthrough** (por si se reescribe): el juego vive en el iframe
> `df-shell` del contenedor, las opciones están `disabled` durante los 5,2 s de la devolución
> oficial, y `js/pages/palabra.js` rechaza un intento que no tenga el largo exacto de la palabra
> sin consumir intento.

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

## 3 · Licencias de la entrega (5.4) — **sin ZIP**

Se decidió **no comprimir nada**: la entrega es el repositorio, y `Codigo/` ya es
portable por sí sola (no pide nada a internet). Lo que sí queda es el papel de
licencias, que está escrito y verificado contra el código:

- [x] `Codigo/assets/audio/LICENCIA.txt` — música del grupo, **CC0 1.0**; el MP3 se
      regenera byte a byte desde el WAV con `npm run mp3`.
- [x] `Codigo/assets/fonts/LICENCIA.txt` — Bebas Neue, Instrument Serif y Quicksand,
      **SIL OFL 1.1**, autoalojadas (5 `.woff2`, sin CDN). Las variables reales son
      `--font-title` / `--font-text` / `--font-body` (`css/base.css:46-48`); no existe
      `--font-serif`.
- [x] `Codigo/assets/video/LICENCIA.txt` — el tutorial es una grabación propia, mudo
      por construcción (el ffmpeg de Playwright no codifica audio).
- [x] Los créditos de las fuentes también se ven dentro del juego (`js/data/manual.js:159`,
      en los dos idiomas).
- [ ] Si la cátedra pide el texto legal **completo** de cada fuente, hay que descargar el
      `OFL.txt` de cada familia y ponerlo junto al `.woff2`.
- [ ] Si algún día se pide un archivo único, armar el ZIP con `Codigo/` **sin**
      `node_modules/` ni `tools/out/` (los dos ya están en `.gitignore`) más `Documentación/`,
      y abrirlo en otra máquina para verificar que el nivel 1 se termina sin red.

## 4 · Cierre de documentación (5.5)

- [x] El `README.md` de la raíz ya no son 3 líneas: dice qué es el juego, dónde está
      cada carpeta (`Codigo/` es el juego, `Recursos graficos/` **no** se usa), cómo
      ejecutarlo, cómo probarlo, las licencias y qué queda pendiente.
- [ ] Decidir si `Plan de acción 2.md` pasa a llamarse `Plan de acción.md` o se deja el "2"
      con el estado final, y que el Readme de la raíz lo aclare.
- [ ] `Documentación/Readme.md` y `Recursos graficos/Readme.md` están **vacíos** (2 bytes):
      o se llenan con una línea de índice o se borran.

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
