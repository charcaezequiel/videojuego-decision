/* =========================================================
   build_tutorial.js · Graba el video tutorial con Chromium
   Recorre el juego real y guarda:
     assets/video/tutorial.webm   (el reproductor de Selección de nivel)
     assets/video/tutorial-poster.jpg
   Uso:  node tools/build_tutorial.js   (necesita el servidor en :8099)
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

  const step = async (label, ms, fn) => {
    console.log('  ' + label);
    if(fn) await fn();
    await hold(ms);
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

  await step('menú principal', 1800, () => tap('.menu-play'));
  await step('selección de nivel', 1600, () => tap('.lvl-row[data-n="1"]'));
  await step('título del caso', 2200, () => tap('[data-nav="next"]'));
  await step('consigna del caso', 2600, () => tap('[data-nav="next"]'));

  await step('expediente: las 3 carpetas', 400, async () => {
    for(const i of [0, 1, 2]){
      await tap('.folder >> nth=' + i);
      await hold(1500);
      await tap('#doc-back');
      await hold(400);
    }
    await hold(600);
    await tap('#btn-empezar');
  }, 800);

  await step('juicio: el juez habla', 500, async () => {
    for(let i = 0; i < 24; i++){
      if(await ready('#juicio-next')) break;
      await tap('.speech');
      await hold(650);
    }
    await hold(900);
    await tap('#juicio-next');
  }, 600);

  await step('desafío de preguntas', 500, async () => {
    for(let q = 0; q < 3; q++){
      const key = await page.evaluate(() => {
        const n = DF.nav.level(), i = DF.run.answered(n);
        return i < DF.rules.questionCount ? DF.run.question(n, i).key : null;
      });
      if(!key) break;
      await hold(1400);
      await page.evaluate(k => {
        const b = [...document.querySelectorAll('.q-opt')].find(o => o.querySelector('b').textContent.trim() === k);
        if(b) b.click();
      }, key);
      await hold(2400);
    }
  }, 400);

  await step('desafío de palabras', 500, async () => {
    for(let w = 0; w < 3; w++){
      const word = await page.evaluate(() => {
        const r = DF.run.current(DF.nav.level());
        const next = r && r.words.find(x => !x.done);
        return next ? next.word : null;
      });
      if(!word) break;
      await hold(1500);
      await page.keyboard.type(word, { delay:110 });
      await hold(500);
      await page.keyboard.press('Enter');
      await hold(2200);
    }
  });

  await step('resultado del nivel', 3000);

  await ctx.close();
  const raw = await page.video().path();
  const dest = path.join(OUT, 'tutorial.webm');
  fs.copyFileSync(raw, dest);
  await browser.close();

  const kb = n => (n / 1024).toFixed(0) + ' KB';
  console.log('\n' + dest + '  ' + kb(fs.statSync(dest).size));
  console.log(poster + '  ' + kb(fs.statSync(poster).size));
})().catch(e => { console.error(e.message); process.exit(1); });
