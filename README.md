# DF · Decisión Final

*Defendiendo la justicia. Un píxel a la vez.*

Juego web educativo de **Educación Ciudadana** (grupo LPC · 5°2). El estudiante
lee el expediente de un caso argentino, declara pruebas en un juicio, responde
10 preguntas con base legal y cierra el nivel con un desafío de palabras.
Son **10 niveles** —derechos y garantías constitucionales, consumo, trabajo,
ambiente, educación y vivienda— con 100 preguntas en total, 20 segundos por
pregunta, personaje personalizable, manual bilingüe (español/inglés), música de
fondo y un video tutorial.

Todo el juego es **HTML + CSS + JavaScript puro**: no hay framework, no hay
build y no pide nada a internet para funcionar. Las fuentes están autoalojadas.

---

## Dónde está cada cosa

| Carpeta | Qué es |
|---|---|
| **`Codigo/`** | **El juego.** Se abre `Codigo/index.html`; es el contenedor que mantiene la música entre pantallas. Toda la documentación técnica está en [`Codigo/Readme.md`](Codigo/Readme.md). |
| `Documentación/` | Los entregables del curso (sprints, actividades, diagramas), el plan de acción en curso, [`Pendiente.md`](Documentación/Pendiente.md) con lo que falta antes de entregar y [`Casos para imprimir.md`](Documentación/Casos%20para%20imprimir.md) — los 10 expedientes en su versión autoritativa, generada desde el propio juego con `npm run fichas`. |
| `Recursos graficos/` | 36 PNG del prototipo original: bocetos de botones, fondos, personajes y capturas de la pista de audio. **El juego no lee esta carpeta**: el arte definitivo está generado en `Codigo/assets/` y `Codigo/js/data/`. |

## Arrancarlo

```bash
cd Codigo
npx http-server -p 8080 -c-1 .     # y abrir http://localhost:8080
```

También funciona abriendo `Codigo/index.html` con doble clic en Chrome o Edge.
Para el celular o la tablet del aula, serví la carpeta en la red local y entrá
por la IP del equipo; las pruebas y las herramientas usan el puerto **8099**
(`npm run serve`).

## Probarlo

```bash
cd Codigo
npm install
npx playwright install chromium    # solo la primera vez
npm run serve                      # deja el servidor en 8099
npm test                           # 20 pruebas funcionales, ~4 min
```

`npm test` recorre las 17 pantallas, las reglas de puntaje, el desbloqueo de
niveles, las cuentas separadas y el acceso por teclado. Hay auditorías aparte:
`npm run audit` (layout en 9 tamaños × 17 pantallas), `npm run i18n` (textos sin
traducir) y `npm run hit` (que el área sensible de cada dibujo sea el dibujo).

## Licencias

| Asset | Licencia | Dónde está el aviso |
|---|---|---|
| Código, arte pixel, textos de los casos | Propio del grupo LPC | — |
| Música `musica-quiz` | CC0 1.0 (dominio público) | `Codigo/assets/audio/LICENCIA.txt` |
| Bebas Neue, Instrument Serif, Quicksand | SIL Open Font License 1.1 | `Codigo/assets/fonts/LICENCIA.txt` |
| Video tutorial | Grabación propia del juego (mudo) | `Codigo/assets/video/LICENCIA.txt` |

Los créditos también se ven dentro del juego, en *Manual → Créditos*.

## Estado de esta entrega

Las **5 partes del plan de acción están cerradas** (`Documentación/Plan de acción 2.md`),
excepto la 5.2, que no se puede hacer desde este equipo. Lo que sigue abierto está
detallado en [`Documentación/Pendiente.md`](Documentación/Pendiente.md):

* **Probarlo en dispositivos físicos** (celular, tablet, proyector y audio del aula).
  Nunca se hizo: todo —pruebas, auditorías y el playthrough con cuenta nueva— corrió
  en Chromium de escritorio. Es el riesgo real de la entrega.
* **Verificar el tutorial en la PC y el proyector del aula.** Ya está medido en cuatro
  motores: Chromium, Edge y Firefox lo reproducen en tiempo real (por red y con doble
  clic); **WebKit —el motor de Safari y los iPad— no carga el VP9**. Para ese caso la
  pantalla de selección acepta un `Codigo/assets/video/tutorial.mp4` generado por
  alguien con un ffmpeg completo (el comando está en el `LICENCIA.txt` del video; en
  esta máquina no se puede convertir). Si nada carga, aparece una nota en el lugar del
  reproductor y el juego se usa igual.
* **Alinear el papel de los casos.** El PDF "Casos definitivos" no está en este
  repositorio y el del caso 1 puede seguir citando el art. 43 como derecho de petición;
  el juego enseña art. 14 (verificado contra el texto de la Constitución). La ficha de
  papel correcta es `Documentación/Casos para imprimir.md`.
* **Los casos legales siguen en español.** El manual se tradujo, el expediente no.
* **No se entrega ningún `.zip`** por decisión del equipo: la entrega es este
  repositorio y `Codigo/` ya es portable por sí sola.

Las dependencias (`playwright`, `http-server`, `sharp`, `lamejs`) son solo de
herramientas y pruebas: **el juego no usa ninguna**, así que pueden faltar y el
juego igual funciona.
