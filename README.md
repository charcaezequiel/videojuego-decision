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
| `Documentación/` | Los entregables del curso (sprints, actividades, diagramas), el plan de acción en curso y [`Pendiente.md`](Documentación/Pendiente.md) con lo que falta antes de entregar. |
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
* **Verificar el WebM del tutorial en el equipo del aula.** Es VP9 y mudo; si no
  reproduce, hace falta un ffmpeg completo para pasarlo a MP4.
* **Los casos legales siguen en español.** El manual se tradujo, el expediente no.
* **No se entrega ningún `.zip`** por decisión del equipo: la entrega es este
  repositorio y `Codigo/` ya es portable por sí sola.

Las dependencias (`playwright`, `http-server`, `sharp`, `lamejs`) son solo de
herramientas y pruebas: **el juego no usa ninguna**, así que pueden faltar y el
juego igual funciona.
