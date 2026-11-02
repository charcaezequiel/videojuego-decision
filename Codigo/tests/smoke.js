/* Recorrido rápido de humo: abre cada pantalla y reporta errores. */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const PAGES = ['portada', 'registro', 'menu', 'config', 'soporte', 'ranking', 'manual', 'vestir',
  'niveles', 'nivel-titulo?n=1', 'nivel-desc?n=1', 'caso?n=1', 'juicio?n=1', 'desafio?n=1',
  'palabra?n=1', 'resultado?n=1', 'fin'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{ width:1440, height:900 } });
  const page = await ctx.newPage();
  const bad = [];
  page.on('console', m => { if(m.type() === 'error') bad.push('[console] ' + m.text()); });
  page.on('pageerror', e => bad.push('[pageerror] ' + e.message));
  page.on('requestfailed', r => {
    const u = r.url();
    if(/tutorial|\.ogg$/.test(u)) return;                 // opcionales a propósito
    bad.push('[404/failed] ' + u + ' · ' + (r.failure() || {}).errorText);
  });
  page.on('response', r => { if(r.status() >= 400) bad.push('[' + r.status() + '] ' + r.url()); });

  await page.goto(BASE + '/index.html', { waitUntil:'networkidle' });
  await page.frameLocator('#df-frame').locator('.splash-btn').click();
  await page.waitForTimeout(400);
  const f = page.frameLocator('#df-frame');
  await f.locator('#correo').fill('proueba@df.test');
  await f.locator('#usuario').fill('abogado_pixel');
  await f.locator('#btn-registro').click();
  await page.waitForTimeout(600);

  for(const p of PAGES){
    await page.goto(BASE + '/pages/' + p, { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(450);
    const title = await page.evaluate(() => document.querySelector('.stage') ? 'ok' : 'SIN .stage');
    console.log((title === 'ok' ? '  ok  ' : ' FAIL ') + p);
  }

  console.log('\n--- problemas (' + bad.length + ') ---');
  [...new Set(bad)].slice(0, 40).forEach(b => console.log(b));
  await browser.close();
})();
