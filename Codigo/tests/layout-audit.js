/* =========================================================
   layout-audit.js · Revisión automática del diseño
   Abre todas las pantallas en 9 tamaños de pantalla y busca:
     · elementos que se salen del escenario
     · texto cortado dentro de una caja que no se puede deslizar
     · barras de scroll horizontales/verticales en la página
     · botones sin tamaño o fuera de la pantalla
     node tests/layout-audit.js            todas las pantallas
     node tests/layout-audit.js caso.html  solo esas pantallas
   Requiere:  npx http-server -p 8099 -c-1 .
   ========================================================= */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';

/* 9 tamaños reales: escritorio, notebook, tablet y teléfono (vertical y horizontal) */
const SIZES = [
  ['escritorio 720p',   1280, 720],
  ['full HD',           1920, 1080],
  ['2560 x 1440',       2560, 1440],
  ['notebook 1366',     1366, 768],
  ['tablet apaisada',   1024, 768],
  ['celular apaisado',  812, 375],
  ['celular chico',     390, 844],
  ['celular grande',    414, 896],
  ['tablet vertical',   768, 1024]
];

const PAGES = [
  'portada.html', 'registro.html', 'menu.html', 'config.html', 'soporte.html',
  'ranking.html', 'manual.html', 'vestir.html', 'niveles.html', 'nivel-titulo.html?n=1',
  'nivel-desc.html?n=1', 'caso.html?n=1', 'juicio.html?n=1', 'desafio.html?n=1',
  'palabra.html?n=1', 'resultado.html?n=1', 'fin.html'
];

/* Cajas de texto con altura fija: si el contenido no entra, se corta */
const TEXT_BOXES = [
  '.q-text', '.banner h1', '.nv-sub', '.desc-panel', '.speech', '.ch-clue .txt',
  '.lvl-row .name', '.folder .lbl', '.btn', '.chip', '.stat', '.tuto-title'
];

const only = process.argv.slice(2);
const pages = only.length ? PAGES.filter(p => only.some(o => p.indexOf(o) === 0)) : PAGES;

(async () => {
  const browser = await chromium.launch();
  const problems = [];

  for(const [label, width, height] of SIZES){
    const ctx = await browser.newContext({ viewport:{ width, height } });
    await ctx.addInitScript(() => {
      const s = document.createElement('style');
      s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
      (document.head || document.documentElement).appendChild(s);
    });
    const page = await ctx.newPage();
    /* cuenta ya registrada y con el nivel 1 empezado: así todas las pantallas se renderizan */
    await page.goto(BASE + '/index.html', { waitUntil:'domcontentloaded' });
    await page.evaluate(() => {
      const acc = { user:'auditor', email:'auditor@df.test',
        progress:{ levels:{ 1:{ played:true, passed:true, score:900, stars:3, attempts:1,
          last:{ score:900, passed:true, stars:3, correct:8, wrong:1, timeout:1, unanswered:0, words:3, wordsTotal:3 } } } },
        avatar:{ piel:'media', pelo:'largo', varios:'cadena' }, run:null };
      localStorage.setItem('df_decision_final_v2:cuenta:auditor@df.test', JSON.stringify(acc));
      sessionStorage.setItem('df_decision_final_v2:sesion', 'auditor@df.test');
    });

    for(const p of pages){
      await page.goto(BASE + '/pages/' + p, { waitUntil:'load' });
      await page.waitForTimeout(420);
      const found = await page.evaluate((boxes) => {
        const out = [];
        const stage = document.querySelector('.stage');
        if(!stage) return ['sin escenario .stage'];
        const sr = stage.getBoundingClientRect();
        const name = el => el.id || el.getAttribute('class') || el.tagName;
        const skip = el => {
          const cs = getComputedStyle(el);
          if(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return true;
          if(el.classList.contains('nav-off') || el.classList.contains('tuto-backdrop')) return true;
          return false;
        };
        const cut = (a, b) => {
          const l = Math.max(a.left, b.left), t = Math.max(a.top, b.top);
          const r = Math.min(a.right, b.right), bo = Math.min(a.bottom, b.bottom);
          return { left:l, top:t, right:r, bottom:bo, width:Math.max(0, r - l), height:Math.max(0, bo - t) };
        };
        /* lo que realmente se ve: la caja recortada por los contenedores con overflow */
        const visibleRect = el => {
          let r = el.getBoundingClientRect();
          for(let n = el.parentElement; n && n !== document.body; n = n.parentElement){
            const cs = getComputedStyle(n);
            if(cs.overflowX !== 'visible' || cs.overflowY !== 'visible') r = cut(r, n.getBoundingClientRect());
          }
          return r;
        };
        /* 1 · nada visible puede quedar fuera del escenario */
        [...stage.querySelectorAll('*')].forEach(el => {
          if(skip(el)) return;
          const r = visibleRect(el);
          if(r.width === 0 || r.height === 0) return;
          const over = Math.max(sr.left - r.left, sr.top - r.top, r.right - sr.right, r.bottom - sr.bottom);
          if(over > 4) out.push('se sale del escenario (' + Math.round(over) + 'px): ' + name(el).slice(0, 46));
        });
        /* 2 · la página no puede scrollear */
        const de = document.documentElement;
        if(de.scrollWidth - de.clientWidth > 2) out.push('scroll horizontal de ' + (de.scrollWidth - de.clientWidth) + 'px');
        if(de.scrollHeight - de.clientHeight > 2) out.push('scroll vertical de ' + (de.scrollHeight - de.clientHeight) + 'px');
        /* 3 · texto cortado en cajas de alto fijo */
        boxes.forEach(sel => {
          [...document.querySelectorAll(sel)].forEach(el => {
            if(skip(el) || !el.textContent.trim()) return;
            const cs = getComputedStyle(el);
            if(cs.overflow === 'visible' || cs.overflowY === 'auto' || cs.overflowY === 'scroll') return;
            if(el.scrollHeight - el.clientHeight > 3)
              out.push('texto cortado en ' + sel + ' (' + (el.scrollHeight - el.clientHeight) + 'px): «' + el.textContent.trim().slice(0, 28) + '»');
          });
        });
        /* 4 · todo botón o enlace tiene que ser tocable */
        [...document.querySelectorAll('a[href], button')].forEach(el => {
          if(skip(el)) return;
          const r = visibleRect(el);
          if(r.width < 8 || r.height < 8) return;      // no se ve: la pantalla lo muestra u oculta a propósito
          if(r.bottom < sr.top + 4 || r.top > sr.bottom - 4 || r.right < sr.left + 4 || r.left > sr.right - 4)
            out.push('botón fuera de pantalla: ' + name(el).slice(0, 40));
        });
        return out;
      }, TEXT_BOXES);

      /* la pantalla de preguntas se prueba además con el enunciado más largo del juego */
      if(p.indexOf('desafio') === 0){
        const stress = await page.evaluate(() => {
          let longest = '';
          DF.levels.forEach(l => l.preguntas.forEach(q => { if(q.q.length > longest.length) longest = q.q; }));
          const el = document.getElementById('q-text');
          const before = { cls:el.className, html:el.innerHTML, fs:el.style.fontSize };
          el.className = 'q-text'; el.style.fontSize = ''; el.textContent = longest;
          let size = parseFloat(getComputedStyle(el).fontSize) || 26;
          while(size > 18 && el.scrollHeight > el.clientHeight + 2){ size -= 2; el.style.fontSize = size + 'px'; }
          const clipped = el.scrollHeight - el.clientHeight;
          const r = el.getBoundingClientRect(), sr = document.querySelector('.stage').getBoundingClientRect();
          el.className = before.cls; el.innerHTML = before.html; el.style.fontSize = before.fs;
          return { len:longest.length, size:size, clipped:clipped, fuera:Math.max(0, r.bottom - sr.bottom) };
        });
        if(stress.clipped > 3) found.push('.q-text con la pregunta más larga (' + stress.len + ' letras) se corta en ' + stress.clipped + 'px aun a ' + stress.size + 'px');
        if(stress.fuera > 4) found.push('.q-text con la pregunta más larga se sale del escenario en ' + Math.round(stress.fuera) + 'px');
      }

      found.forEach(f => problems.push(label + ' · ' + p + ' → ' + f));
    }
    await ctx.close();
    console.log('  ' + label + ' (' + width + 'x' + height + ') revisado');
  }

  await browser.close();

  if(!problems.length){
    console.log('\nDiseño OK en ' + SIZES.length + ' tamaños × ' + pages.length + ' pantallas.');
    return;
  }
  /* un mismo problema en varias pantallas se agrupa para no repetir 15 líneas */
  const uniq = [...new Set(problems)];
  console.log('\n' + uniq.length + ' problemas de diseño (' + problems.length + ' apariciones):');
  uniq.slice(0, 60).forEach(x => console.log('  - ' + x));
  process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
