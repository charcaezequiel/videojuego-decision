/* Capturas de cada pantalla para revisarlas a ojo.
   node tools/shots.js  ->  tools/out/shots/*.png  */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const OUT = path.join(__dirname, 'out', 'shots');
const SHOTS = [
  ['registro', 'pages/registro.html', null, { anon:true }],
  ['portada', 'pages/portada.html', null, { seed:true }],
  ['menu', 'pages/menu.html'],
  ['config', 'pages/config.html'],
  ['vestir', 'pages/vestir.html'],
  ['manual', 'pages/manual.html'],
  ['ranking', 'pages/ranking.html'],
  ['niveles', 'pages/niveles.html'],
  ['nivel-titulo', 'pages/nivel-titulo.html?n=1'],
  ['nivel-desc', 'pages/nivel-desc.html?n=1'],
  ['caso', 'pages/caso.html?n=1'],
  ['caso-doc', 'pages/caso.html?n=1', async (p) => { await p.click('.folder'); await p.waitForTimeout(400); }],
  ['juicio', 'pages/juicio.html?n=1'],
  ['desafio', 'pages/desafio.html?n=1'],
  ['palabra', 'pages/palabra.html?n=1', async (p) => {
    for(const k of 'PET'.split('')) await p.keyboard.press(k);
    await p.waitForTimeout(200);
  }],
  ['resultado', 'pages/resultado.html?n=1'],
  ['fin', 'pages/fin.html', null, { done:true }]
];

(async () => {
  fs.mkdirSync(OUT, { recursive:true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{ width:1280, height:720 }, deviceScaleFactor:1 });
  const page = await ctx.newPage();

  /* sembrar una cuenta con progreso, para que las pantallas tengan datos */
  async function seed(){
    await page.goto(BASE + '/index.html');
    await page.evaluate(() => {
      const acc = { user:'abogado_pixel', email:'proueba@df.test',
        progress:{ levels:{ 1:{ played:true, passed:true, score:980, stars:3, attempts:1,
                               last:{ score:980, passed:true, stars:3, correct:8, wrong:1, timeout:1, unanswered:0, words:3, wordsTotal:3 } },
                             2:{ played:true, passed:false, score:410, stars:0, attempts:1,
                               last:{ score:410, passed:false, stars:0, correct:5, wrong:3, timeout:2, unanswered:0, words:1, wordsTotal:3 } },
                             3:{ played:true, passed:true, score:1290, stars:3, attempts:2,
                               last:{ score:1290, passed:true, stars:3, correct:10, wrong:0, timeout:0, unanswered:0, words:3, wordsTotal:3 } } } },
        avatar:{ piel:'media', pelo:'largo', varios:'cadena', gafas:'pasta', pins:'balanza' }, run:null };
      localStorage.setItem('df_decision_final_v2:cuenta:proueba@df.test', JSON.stringify(acc));
      const otra = JSON.parse(JSON.stringify(acc)); otra.user = 'otra_cuenta'; otra.email = 'otra@df.test';
      otra.progress.levels = { 1:{ played:true, passed:true, score:1500, stars:3, attempts:1 } };
      localStorage.setItem('df_decision_final_v2:cuenta:otra@df.test', JSON.stringify(otra));
      localStorage.setItem('df_decision_final_v2:sesion', 'proueba@df.test');
      sessionStorage.setItem('df_decision_final_v2:sesion', 'proueba@df.test');
    });
  }

  /* todas las cuentas con el registro completo: para ver la pantalla FINAL */
  async function seedDone(){
    await page.evaluate(() => {
      const raw = localStorage.getItem('df_decision_final_v2:cuenta:proueba@df.test');
      const acc = JSON.parse(raw);
      for(let n = 1; n <= 10; n++) acc.progress.levels[n] = {
        played:true, passed:true, score:1000 + n * 40, stars:(n % 3), attempts:1,
        last:{ score:1000 + n * 40, passed:true, stars:(n % 3), correct:9, wrong:1, timeout:0, unanswered:0, words:3, wordsTotal:3 }
      };
      localStorage.setItem('df_decision_final_v2:cuenta:proueba@df.test', JSON.stringify(acc));
    });
  }

  for(const [name, url, act, opts] of SHOTS){
    if(opts && opts.seed) await seed();
    if(opts && opts.done) await seedDone();
    await page.goto(BASE + '/' + url, { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(700);
    if(act) await act(page).catch(e => console.log('  (' + name + ': ' + e.message.split('\n')[0] + ')'));
    await page.waitForTimeout(300);
    await page.screenshot({ path:path.join(OUT, name + '.png') });
    console.log('  ' + name);
  }
  await browser.close();
  console.log('tools/out/shots/');
})();
