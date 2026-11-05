# DF · Decisión Final — qué falta hacer

Estado al **05/11/2026**. Las Partes 1 a 5 del `Plan de acción 2.md` están cerradas y commiteadas:

| Commit | Parte |
|---|---|
| `4298fb2` | P1 · recursos y pruebas: audio coherente y test 13 sin filtro ciego |
| `c65d8bf` | P2 · pantallas: borrar progreso, ranking por nivel y foco de teclado |
| `a503dfd` | P3 · contenido: lectura humana de los 10 casos y manual en inglés |
| `8b7641e` | P4 · recursos: tutorial regrabado y arte coherente |
| `ef42cc3` | P5 · entrega: Readme verificado, playthrough horizontal y vertical y licencias (sin ZIP) |

**La única parte que no se pudo cerrar es la 5.2** (probar en dispositivos físicos), y no es un
tema de código: hace falta el celular, la tablet y el proyector del aula.

Después de la entrega se cerraron los dos puntos que no dependían del equipo del aula: **el video
tutorial medido en 4 motores** (§2) y **la versión de papel de los casos dentro del repositorio**
(§5, `Casos para imprimir.md`).

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
- [~] **El video tutorial en el aula — medido, queda la verificación física.** Se probó el
      `tutorial.webm` real en 4 motores (4 motores × 3 formas de cargarlo):
      *Chromium, Edge y Firefox 157 lo reproducen en tiempo real* — por http, por `file://` (doble
      clic) y hasta con el MIME mal puesto—, sin descartar cuadros y buscando en la barra en
      35–280 ms. *WebKit (el motor de Safari) no lo carga* (dice que puede, pero no trae metadatos),
      así que en iPad/Mac el tutorial no va a verse. Para eso la pantalla de selección ahora pide
      el WebM y, si falla, prueba `assets/video/tutorial.mp4`: **ese archivo no está en el repo** y
      hay que generarlo con un ffmpeg completo en otra máquina (el comando y los dos flags que
      Safari exige están en `Codigo/assets/video/LICENCIA.txt`). Lo que sigue necesitando el aula:
      abrirlo en la PC y el proyector reales.
- [x] **Si el video no se puede reproducir, el juego avisa** (estaba oculto a secas). Ahora, en
      lugar del reproductor, aparece una nota en el mismo rincón y en los dos idiomas: *"El video
      tutorial no está cargado. El manual alcanza para jugar."* Se agregó además una espera de 6 s
      porque WebKit no dispara ni `error` ni `loadedmetadata`: sin esa espera el tutorial fingía que
      nunca existió. Medido con `tools/out/check-tuto-nota.js` (5 casos: video bueno, 404, vertical,
      WebKit español, WebKit inglés).
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
- **El PDF "Casos definitivos" del caso 1** (papel, afuera de este repositorio) puede seguir citando
  el **art. 43** como el derecho de petición. El juego enseña **art. 14** y deja el 43 solo como el
  amparo por silencio — verificado contra el texto oficial de la Constitución (art. 14: "peticionar a
  las autoridades"; art. 43: amparo contra todo acto **u omisión**). Como el PDF no está en el repo,
  lo que sí está ahora es la fuente autoritativa para copiar y pegar:
  **`Documentación/Casos para imprimir.md`**, generada de `js/data/niveles.js` con `npm run fichas`.
  Trae los 10 expedientes completos y la **pregunta oficial** de cada caso con su orden A-D (es la
  que el juego muestra primero y la que el papel tiene que coincidir). **Falta:** que quien es el
  PDF lo actualice con esa ficha.
- **Un `.webm` copiado a medias no se detecta:** si el archivo está truncado o dañado, el navegador
  lo acepta y muestra el tutorial cortado en vez de ocultarlo (medido con
  `tools/out/check-video-falla.js`). El archivo completo pesa **22.993.851 bytes**: es lo que hay que
  mirar si se copia la carpeta a un pendrive.
- Las herramientas de verificación propias viven en `Codigo/tools/out/` (gitignoreado, no se entrega):
  `check-casos.mjs` (cotas de los 10 casos), `check-contrast.js` (contraste WCAG medido),
  `check-manual.js`, `check-nota.js` (banda de la nota del resultado) y `playthrough.js`.
  Para el video se agregaron `check-video.js` (los 4 motores × 3 cargas, con `MOTOR=webkit` para
  correr uno solo), `check-video-falla.js` (404 / truncado / dañado) y `check-tuto-nota.js`
  (cuándo aparece el aviso, en los dos idiomas). Usan Playwright Chromium, Edge (instalado),
  Firefox y WebKit (`npx playwright install firefox webkit`).

## 6 · Antes de entregar, correr todo esto desde `Codigo/`

```bash
npm install
npx playwright install chromium
npm run serve &            # puerto 8099
npm run content && npm run i18n   # 0 diferencias, manual 8 bloques / 32 párrafos ES y EN
npm run fichas                    # regenera Documentación/Casos para imprimir.md (el papel)
npm test                   # 20 pruebas
npm run audit              # 9 tamaños × 17 pantallas
npm run hit                # 6 áreas de clic
npm run assets && npm run mp3     # no deben cambiar nada: los PNG y el MP3 tienen que quedar idénticos
npm run shots              # revisar los 3 montajes a ojo
node tools/out/playthrough.js     # el playthrough de la sección 1
```

Si además se tocaron pantallas, volver a grabar el tutorial con `npm run tutorial` (el script falla
ruidosamente si el juego no avanza, así que un video cortado no pasa desapercibido).
