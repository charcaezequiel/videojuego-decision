/* =========================================================
   build_tutorial.js · Graba el video tutorial con Chromium
   Recorre el juego real y guarda:
     assets/video/tutorial.webm   (el reproductor de Selección de nivel)
     assets/video/tutorial-poster.jpg
   Uso:  node tools/build_tutorial.js   (necesita el servidor en :8099)

   Los tiempos se esperan sobre el estado real del juego, no con sleeps
   fijos: la devolucion de la pregunta oficial dura 5,2 s y las opciones
   quedan disabled mientras se muestra, asi que un sleep corto perdia
   preguntas y el video se cortaba a mitad del cuestionario.
   ========================================================= */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const RAW = path.join(__dirname, 'out', 'video');
const OUT = path.join(__dirname, '..', 'assets', 'video');

const hold = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(RAW, { recursive:true });
  fs.mkdirSync(OUT, { recursive:true });
  for(const f of fs.readdirSync(RAW)) fs.rmSync(path.join(RAW, f), { force:true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport:{ width:1280, height:720 },
    recordVideo:{ dir:RAW, size:{ width:1280, height:720 } }
  });
  const page = await ctx.newPage();

  /* force:true: las flechas con .pulse nunca están "estables" para Playwright */
  const tap = sel => page.click(sel, { force:true });

  /* una flecha está tocable cuando DF.nav no la ocultó (nav-off) */
  const ready = sel => page.evaluate(s => {
    const el = document.querySelector(s);
    return !!el && !el.classList.contains('nav-off') && !el.classList.contains('disabled');
  }, sel);

  /* espera de verdad: si la condicion no se cumple, el script falla en vez de
     grabar un video cortado */
  const esperar = async (que, fn, arg, ms) => {
    try{ await page.waitForFunction(fn, arg, { timeout: ms || 12000 }); }
    catch(e){ throw new Error('el tutorial se colgo esperando: ' + que); }
  };

  const step = async (label, ms, fn) => {
    console.log('  ' + label);
    if(fn) await fn();
    if(ms) await hold(ms);
  };

  await page.goto(BASE + '/pages/portada.html', { waitUntil:'domcontentloaded' });
  await hold(1200);
  const poster = path.join(OUT, 'tutorial-poster.jpg');
  await page.screenshot({ path:poster, type:'jpeg', quality:88 });

  await step('portada → comenzar', 600, () => tap('.splash-btn'));

  await step('registro', 900, async () => {
    await page.locator('#correo').pressSequentially('demo@df.test', { delay:55 });
    await hold(400);
    await page.locator('#usuario').pressSequentially('demo_pixel', { delay:55 });
    await hold(500);
    await tap('#btn-registro');
  });

  await step('menú principal', 1600, () => tap('.menu-play'));
  await step('selección de nivel', 1600, () => tap('.lvl-row[data-n="1"]'));
  await step('título del caso', 2200, () => tap('[data-nav="next"]'));
  await step('consigna del caso', 2400, () => tap('[data-nav="next"]'));

  await step('expediente: las 3 carpetas', 800, async () => {
    for(const i of [0, 1, 2]){
      await tap('.folder >> nth=' + i);
      await hold(1500);
      await tap('#doc-back');
      await hold(400);
    }
    await hold(600);
    await tap('#btn-empezar');
  });

  await step('juicio: el juez habla', 600, async () => {
    for(let i = 0; i < 30; i++){
      if(await ready('#juicio-next')) break;
      await tap('.speech');
      await hold(650);
    }
    await hold(900);
    await tap('#juicio-next');
  });

  /* las 10 preguntas: se responde la clave de cada una y se espera que el
     juego la registre (la oficial muestra la devolucion completa del caso).
     Antes de leer la clave hay que esperar a que las opciones vuelvan a estar
     habilitadas: durante la devolucion quedan disabled y el clic se pierde. */
  await step('desafío de preguntas', 400, async () => {
    const total = await page.evaluate(() => DF.rules.questionCount);
    for(let q = 0; q < total; q++){
      await esperar('la pregunta ' + (q + 1) + ' este habilitada',
        () => { const b = document.querySelector('.q-opt'); return !!b && !b.disabled; }, null, 14000);
      const dato = await page.evaluate(() => {
        const n = DF.nav.level(), i = DF.run.answered(n);
        const s = DF.run.question(n, i);
        return { i, key: s && s.key, oficial: !!(s && s.oficial) };
      });
      if(!dato.key) break;
      await hold(dato.oficial ? 1600 : 1000);
      await page.evaluate(k => {
        const b = [...document.querySelectorAll('.q-opt')].find(o => o.querySelector('b').textContent.trim() === k);
        if(b) b.click();
      }, dato.key);
      await esperar('la pregunta ' + (dato.i + 1) + ' quede respondida',
        i => DF.run.answered(DF.nav.level()) > i, dato.i, 14000);
      await hold(700);
    }
  });

  /* el desafio de palabras: se escribe la palabra real de cada intento */
  await step('desafío de palabras', 600, async () => {
    for(let w = 0; w < 6; w++){
      const pendiente = await page.evaluate(() => {
        const r = DF.run.current(DF.nav.level());
        const next = r && r.words.find(x => !x.done);
        return next ? next.word : null;
      });
      if(!pendiente) break;
      await hold(1400);
      await page.keyboard.type(pendiente, { delay:110 });
      await hold(400);
      await page.keyboard.press('Enter');
      await esperar('que "' + pendiente + '" quede resuelta',
        word => {
          const r = DF.run.current(DF.nav.level());
          const x = r && r.words.find(y => y.word === word);
          return !!x && x.done;
        }, pendiente, 12000);
      await hold(600);
    }
  });

  await step('resultado del nivel', 4000, async () => {
    await esperar('la pantalla de resultado', () => /resultado/.test(location.pathname), null, 12000);
  });

  await ctx.close();
  const raw = await page.video().path();
  const dest = path.join(OUT, 'tutorial.webm');
  fs.copyFileSync(raw, dest);
  await browser.close();

  const kb = n => (n / 1024).toFixed(0) + ' KB';
  console.log('\n' + dest + '  ' + kb(fs.statSync(dest).size));
  console.log(poster + '  ' + kb(fs.statSync(poster).size));
})().catch(e => { console.error(e.message); process.exit(1); });
