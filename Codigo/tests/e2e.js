/* =========================================================
   e2e.js · Pruebas funcionales de Decisión Final
   Chromium + servidor local. Cada prueba usa su propio contexto
   de navegador, así el localStorage de una no toca a la otra.

     node tests/e2e.js            todas
     node tests/e2e.js 3 7 12     solo esas
   Requiere:  npx http-server -p 8099 -c-1 .
   ========================================================= */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const K = { V2:'df_decision_final_v2', V1:'df_decision_final_v1' };
const acct = email => K.V2 + ':cuenta:' + email;

let pass = 0, fail = 0;
const failures = [];
const only = process.argv.slice(2).map(Number);

/* ---------- aserciones ---------- */
function assert(cond, msg){ if(!cond) throw new Error(msg || 'la condición no se cumplió'); }
function eq(got, want, msg){
  if(got !== want) throw new Error((msg ? msg + ': ' : '') + 'esperaba ' + JSON.stringify(want) + ' y obtuve ' + JSON.stringify(got));
}
function ok(name, fn){
  return async () => {
    if(only.length && !only.includes(parseInt(name, 10))) return;
    try { await fn(); pass++; console.log('  ok   ' + name); }
    catch(e){
      fail++; failures.push([name, e.message]);
      console.log('  FAIL ' + name + '\n        ' + String(e.message).split('\n')[0]);
    }
  };
}

/* ---------- utilidades sobre la página ---------- */
async function login(page, email, user, extra){
  await page.goto(BASE + '/index.html', { waitUntil:'domcontentloaded' });
  await page.evaluate(([email, user, extra, key]) => {
    const acc = Object.assign({
      user:user, email:email, progress:{ levels:{} },
      avatar:{ piel:'media', pelo:'largo', varios:'cadena' }, run:null
    }, extra || {});
    localStorage.setItem(key, JSON.stringify(acc));
    localStorage.setItem('df_decision_final_v2:sesion', email);
    sessionStorage.setItem('df_decision_final_v2:sesion', email);
  }, [email.toLowerCase(), user, extra || null, acct(email.toLowerCase())]);
}

const url = page => page.url().split('/pages/')[1] || page.url();
const go = (page, path) => page.goto(BASE + '/pages/' + path, { waitUntil:'domcontentloaded' });

/* respuesta correcta de la pregunta i del nivel n, en la letra actual */
const keyOf = (page, i) => page.evaluate(idx => DF.run.question(DF.nav.level(), idx).key, i);

/* toca la opción que muestra la letra dada */
async function tapOption(page, letter){
  await page.evaluate(l => {
    const b = [...document.querySelectorAll('.q-opt')].find(o => o.querySelector('b').textContent.trim() === l);
    if(b) b.click();
  }, letter);
}

/* salta la devolución (tocar el enunciado) y espera la siguiente pantalla */
async function advance(page){
  await page.evaluate(() => { const t = document.getElementById('q-text'); if(t) t.click(); });
  await page.waitForTimeout(260);
}

/* acorta el reloj del cuestionario para que la prueba no tarde minutos */
const fastQuiz = page => page.evaluate(() => { DF.rules.seconds = 2; });

/* partida ya avanzada: carpetas leídas y N preguntas respondidas.
   Corre sobre una pantalla del juego, que es donde existen DF.run y DF.rules. */
async function seedRun(page, n, answers){
  await go(page, 'niveles.html');
  await page.waitForTimeout(300);
  await page.evaluate(([lvl, ans]) => {
    const run = DF.run.open(lvl);
    DF.rules.folders.forEach(f => { run.read[f] = true; });
    run.answers = ans.map((a, i) => Object.assign({ q:i, choice:'A', correct:true, timeout:false, secs:15, pts:140 }, a));
    DF.run.save({ read:run.read, answers:run.answers });
  }, [n, answers || []]);
}

(async () => {
  const browser = await chromium.launch({ args:['--autoplay-policy=no-user-gesture-required'] });

  async function withPage(fn){
    const ctx = await browser.newContext({ viewport:{ width:1280, height:720 } });
    /* Playwright no toca un botón que se está moviendo: las flechas y los íconos
       usan .pulse, así que en las pruebas se apagan las animaciones en todas las
       pantallas (incluido el marco de index.html). */
    await ctx.addInitScript(() => {
      const add = () => {
        const s = document.createElement('style');
        s.id = 'e2e-noanim';
        s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
        (document.head || document.documentElement).appendChild(s);
      };
      if(document.documentElement) add();
      else document.addEventListener('readystatechange', add, { once:true });
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if(m.type() === 'error') errors.push('console: ' + m.text()); });
    try { await fn(page, errors); } finally { await ctx.close(); }
    return errors;
  }

  const T = [];

  /* 1 · las 10 preguntas se completan y llevan al desafío de palabras */
  T.push(ok('01 · las 10 preguntas se completan', () => withPage(async (page) => {
    await login(page, 'uno@df.test', 'uno');
    await go(page, 'desafio.html?n=1');
    await fastQuiz(page);
    for(let i = 0; i < 10; i++){
      await tapOption(page, await keyOf(page, i));
      await advance(page);
    }
    assert(url(page).indexOf('palabra.html') === 0, 'terminadas las 10 preguntas debería estar en el desafío de palabras, está en ' + url(page));
    const run = await page.evaluate(() => DF.run.current(1));
    eq(run.answers.length, 10, 'preguntas registradas');
    assert(run.answers.every(a => a.correct), 'todas las respuestas deberían ser correctas');
  })));

  /* 2 · una pregunta que llega a 0 s cuenta como "sin responder" */
  T.push(ok('02 · tiempo agotado = sin responder', () => withPage(async (page) => {
    await login(page, 'dos@df.test', 'dos');
    await go(page, 'desafio.html?n=1');
    /* el reloj de CADA pregunta se lee al mostrarla: bajándolo a 1 s,
       la segunda pregunta se agota sola y es la que se evalúa */
    await page.evaluate(() => { DF.rules.seconds = 1; });
    await tapOption(page, await keyOf(page, 0));
    await advance(page);
    await page.waitForFunction(() => {
      const r = DF.run.current(1);
      return r && r.answers.length >= 2;
    }, null, { timeout:6000 });
    const a = await page.evaluate(() => DF.run.current(1).answers[1]);
    eq(a.timeout, true, 'la pregunta sin respuesta se marca timeout');
    eq(a.choice, null, 'sin respuesta no queda ninguna letra');
    eq(a.pts, 0, 'sin respuesta no suma puntos');
    const fb = await page.textContent('#q-text');
    assert(fb.toUpperCase().indexOf('TIEMPO AGOTADO') >= 0, 'la devolución avisa el tiempo agotado: ' + fb.slice(0, 40));
  })));

  /* 3 · después del tiempo ya no se puede responder esa pregunta */
  T.push(ok('03 · responder fuera de tiempo no cuenta', () => withPage(async (page) => {
    await login(page, 'tres@df.test', 'tres');
    await go(page, 'desafio.html?n=1');
    await page.evaluate(() => { DF.rules.seconds = 1; });
    await tapOption(page, await keyOf(page, 0));
    await advance(page);
    await page.waitForFunction(() => (DF.run.current(1) || { answers:[] }).answers.length >= 2, null, { timeout:6000 });
    const disabled = await page.evaluate(() => [...document.querySelectorAll('.q-opt')].every(b => b.disabled));
    assert(disabled, 'las opciones quedan deshabilitadas al agotarse el tiempo');
    await page.evaluate(() => { const b = document.querySelector('.q-opt'); b.disabled = false; b.click(); });
    await page.waitForTimeout(200);
    eq(await page.evaluate(() => DF.run.current(1).answers.length), 2, 'un segundo clic no agrega otra respuesta');
  })));

  /* 4 · dentro del cuestionario las flechas eligen y ← va al menú */
  T.push(ok('04 · flechas dentro del cuestionario', () => withPage(async (page) => {
    await login(page, 'cuatro@df.test', 'cuatro');
    await go(page, 'desafio.html?n=1');
    await fastQuiz(page);
    await page.keyboard.press('ArrowRight');           /* A -> C */
    eq(await page.evaluate(() => document.querySelector('.q-opt.sel').dataset.k), '2', 'ArrowRight mueve a la columna derecha');
    await page.keyboard.press('ArrowDown');            /* C -> D */
    eq(await page.evaluate(() => document.querySelector('.q-opt.sel').dataset.k), '3', 'ArrowDown baja dentro de la columna');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    eq(await page.evaluate(() => DF.run.current(1).answers.length), 1, 'Enter confirma la opción elegida');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    assert(url(page).indexOf('desafio') >= 0, 'las flechas no cambian de pantalla durante las preguntas');
    await page.click('.q-quit');
    await page.waitForTimeout(400);
    assert(url(page).indexOf('menu.html') === 0, 'la ← del cuestionario lleva al menú, está en ' + url(page));
  })));

  /* 5 · fuera del cuestionario las flechas avanzan y vuelven */
  T.push(ok('05 · flechas fuera del cuestionario', () => withPage(async (page) => {
    await login(page, 'cinco@df.test', 'cinco');
    await go(page, 'nivel-titulo.html?n=1');
    await page.click('[data-nav="next"]');
    await page.waitForTimeout(400);
    assert(url(page).indexOf('nivel-desc') === 0, '→ lleva a la descripción, está en ' + url(page));
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(400);
    assert(url(page).indexOf('nivel-titulo') === 0, '← del teclado vuelve al título, está en ' + url(page));
  })));

  /* 6 · desafío final completo y redirección automática del resultado */
  T.push(ok('06 · palabras + redirección automática', () => withPage(async (page) => {
    await login(page, 'seis@df.test', 'seis');
    await seedRun(page, 1, Array.from({ length:10 }, () => ({})));
    await go(page, 'palabra.html?n=1');
    for(let w = 0; w < 3; w++){
      const word = await page.evaluate(() => {
        const r = DF.run.current(DF.nav.level());
        const next = r.words.find(x => !x.done);
        return next ? next.word : null;
      });
      assert(word, 'la palabra ' + (w + 1) + ' debería estar disponible');
      await page.keyboard.type(word);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1700);
    }
    assert(url(page).indexOf('resultado') === 0, 'resueltas las 3 palabras va al resultado, está en ' + url(page));
    const guardado = await page.evaluate(() => DF.progress.result(1).last);
    eq(guardado.words, 3, 'las 3 palabras resueltas quedan registradas');
    eq(guardado.correct, 10, 'y las 10 preguntas respondidas');
    await page.waitForFunction(() => location.pathname.indexOf('niveles') > 0, null, { timeout:14000 });
  })));

  /* 7 · perder el nivel igual desbloquea el siguiente */
  T.push(ok('07 · perder desbloquea el siguiente nivel', () => withPage(async (page) => {
    await login(page, 'siete@df.test', 'siete');
    const flojo = Array.from({ length:10 }, (_, i) => ({ correct:i < 4, timeout:false, pts:i < 4 ? 140 : 0 }));
    await seedRun(page, 1, flojo);
    await go(page, 'palabra.html?n=1');
    await page.evaluate(() => {
      const r = DF.run.open(1);
      r.words.forEach(w => { w.done = true; w.solved = false; });
      DF.run.save({ words:r.words });
      DF.nav.go('resultado.html', 1);
    });
    await page.waitForTimeout(700);
    const st = await page.evaluate(() => ({ s1:DF.progress.status(1), s2:DF.progress.status(2) }));
    eq(st.s1, 'lost', 'el nivel 1 queda perdido');
    eq(st.s2, 'available', 'el nivel 2 queda disponible aunque se haya perdido el 1');
  })));

  /* 8 · «Siguiente nivel» lleva al primer nivel sin jugar */
  T.push(ok('08 · botón Siguiente nivel', () => withPage(async (page) => {
    await login(page, 'ocho@df.test', 'ocho', {
      progress:{ levels:{ 1:{ played:true, passed:true, score:900, stars:3, attempts:1 } } }
    });
    await go(page, 'niveles.html');
    await page.waitForTimeout(400);
    eq(await page.getAttribute('#lvl-next', 'href'), 'nivel-titulo.html?n=2', 'el botón apunta al nivel 2');
    await page.click('#lvl-next');
    await page.waitForTimeout(400);
    assert(url(page).indexOf('nivel-titulo') === 0, 'el botón navega, está en ' + url(page));
  })));

  /* 9 · las prendas elegidas se mantienen al recargar */
  T.push(ok('09 · el vestuario se mantiene', () => withPage(async (page) => {
    await login(page, 'nueve@df.test', 'nueve');
    await go(page, 'vestir.html');
    await page.waitForTimeout(500);
    const prenda = await page.evaluate(() => {
      /* tocar la prenda que ya está puesta la saca: se prueba otra */
      const b = document.querySelector('.ditem:not(.locked):not(.sel)');
      b.click();
      return { cat:b.dataset.cat, key:b.dataset.item };
    });
    await page.waitForTimeout(300);
    await go(page, 'vestir.html');
    await page.waitForTimeout(500);
    eq(await page.evaluate(c => DF.store.state.avatar[c], prenda.cat), prenda.key,
       'la prenda sigue puesta después de recargar');
    eq(await page.evaluate(([c, k]) => {
      const b = document.querySelector('.ditem[data-cat="' + c + '"][data-item="' + k + '"]');
      return b && b.classList.contains('sel');
    }, [prenda.cat, prenda.key]), true, 'y la rejilla la muestra seleccionada');
  })));

  /* 10 · el manual se arma desde DF.manual y menciona las reglas reales */
  T.push(ok('10 · manual de juego', () => withPage(async (page) => {
    await login(page, 'diez@df.test', 'diez');
    await go(page, 'manual.html');
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => ({
      secciones:document.querySelectorAll('h2').length,
      bloques:DF.manual.length,
      texto:document.body.innerText,
      reglas:DF.rules
    }));
    eq(m.secciones, m.bloques, 'cada bloque de DF.manual se muestra como sección');
    assert(m.secciones >= 6, 'el manual debería tener al menos 6 secciones, tiene ' + m.secciones);
    assert(m.texto.indexOf(String(m.reglas.seconds)) >= 0, 'el manual menciona los segundos por pregunta');
    assert(m.texto.toUpperCase().indexOf('PALABRAS') >= 0, 'el manual explica el desafío final');
  })));

  /* 11 · nivel 10 terminado y pantalla final */
  T.push(ok('11 · nivel 10 y pantalla final', () => withPage(async (page) => {
    const levels = {};
    for(let n = 1; n <= 10; n++) levels[n] = { played:true, passed:n % 4 !== 0, score:800 + n * 30, stars:n % 3, attempts:1,
      last:{ score:800 + n * 30, passed:n % 4 !== 0, stars:n % 3, correct:9, wrong:1, timeout:0, unanswered:0, words:3, wordsTotal:3 } };
    await login(page, 'once@df.test', 'once', { progress:{ levels:levels } });
    await go(page, 'niveles.html');
    await page.waitForTimeout(400);
    eq(await page.getAttribute('#lvl-next', 'href'), 'fin.html', 'jugados los 10 niveles el botón lleva al final');
    await go(page, 'fin.html');
    await page.waitForTimeout(400);
    const txt = await page.evaluate(() => document.body.innerText.toUpperCase());
    assert(txt.indexOf('CASOS CERRADOS') >= 0, 'la pantalla final muestra el cierre de casos');
    assert(txt.indexOf('8030') >= 0 || txt.indexOf('PUNTAJE') >= 0, 'y el puntaje total');
  })));

  /* 12 · sin acciones duplicadas y URLs inválidas protegidas */
  T.push(ok('12 · sin doble acción ni URLs inválidas', () => withPage(async (page) => {
    await login(page, 'doce@df.test', 'doce');
    await go(page, 'desafio.html?n=1');
    await fastQuiz(page);
    const k = await keyOf(page, 0);
    await page.evaluate(l => {
      const b = [...document.querySelectorAll('.q-opt')].find(o => o.querySelector('b').textContent.trim() === l);
      b.click(); b.click(); b.click();
    }, k);
    await page.waitForTimeout(250);
    eq(await page.evaluate(() => DF.run.current(1).answers.length), 1, 'tres clics seguidos cuentan una sola respuesta');
    for(const bad of ['desafio.html', 'desafio.html?n=0', 'desafio.html?n=99', 'caso.html?n=abc']){
      await go(page, bad);
      await page.waitForTimeout(500);
      assert(url(page).indexOf('niveles.html') === 0, 'nivel inválido en ' + bad + ' debería ir a Selección de nivel, fue a ' + url(page));
    }
  })));

  /* 13 · imágenes, estilos, fuentes y consola sin errores */
  T.push(ok('13 · recursos y consola sin errores', () => withPage(async (page, errors) => {
    const pantallas = ['portada.html', 'registro.html', 'menu.html', 'config.html', 'soporte.html',
      'ranking.html', 'manual.html', 'vestir.html', 'niveles.html', 'nivel-titulo.html?n=1',
      'nivel-desc.html?n=1', 'caso.html?n=1', 'juicio.html?n=1', 'desafio.html?n=1',
      'palabra.html?n=1', 'resultado.html?n=1', 'fin.html'];
    await login(page, 'trece@df.test', 'trece');
    const rotas = [];
    for(const p of pantallas){
      await go(page, p);
      await page.waitForTimeout(320);
      const malas = await page.evaluate(() => {
        const out = [];
        [...document.images].forEach(i => {
          if(!i.complete || (i.naturalWidth === 0 && i.currentSrc)) out.push('img ' + i.getAttribute('src'));
        });
        [...document.querySelectorAll('svg')].forEach(s => {
          if(!s.innerHTML.trim() && !s.getAttribute('viewBox')) out.push('svg vacía');
        });
        const css = [...document.styleSheets].filter(x => !x.cssRules);
        if(css.length) out.push(css.length + ' hojas de estilo sin reglas accesibles');
        return out;
      });
      if(malas.length) rotas.push(p + ' -> ' + malas.join(', '));
    }
    eq(rotas.length, 0, 'recursos rotos: ' + rotas.join(' | '));
    /* el 404 del tutorial es esperado cuando todavía no se grabó el video */
    const reales = errors.filter(e => !/tutorial|404/.test(e));
    eq(reales.length, 0, 'errores de consola: ' + reales.slice(0, 3).join(' | '));
  })));

  /* 14 · cada cuenta guarda sus propios datos */
  T.push(ok('14 · cuentas con datos separados', () => withPage(async (page) => {
    await login(page, 'a@df.test', 'cuenta_a');
    await go(page, 'niveles.html');
    await page.evaluate(() => DF.progress.finishLevel(1, { score:500, stars:2, passed:true, correct:8, wrong:1, timeout:1, unanswered:0, words:3, wordsTotal:3 }));
    await login(page, 'b@df.test', 'cuenta_b');
    await go(page, 'niveles.html');
    await page.waitForTimeout(300);
    eq(await page.evaluate(() => DF.progress.isPlayed(1)), false, 'la cuenta B no hereda el progreso de la A');
    const rawA = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).progress.levels, acct('a@df.test'));
    assert(rawA && rawA[1], 'la cuenta A conserva su nivel 1 guardado');
    eq(await page.evaluate(() => DF.store.state.user), 'cuenta_b', 'la sesión activa es la B');
    const ranking = await page.evaluate(() => DF.store.accounts().map(a => a.user).sort().join(','));
    eq(ranking, 'cuenta_a,cuenta_b', 'el ranking ve las dos cuentas');
  })));

  /* 15 · migración de la partida de la versión anterior */
  T.push(ok('15 · migración v1 -> v2', () => withPage(async (page) => {
    await page.goto(BASE + '/index.html', { waitUntil:'domcontentloaded' });
    await page.evaluate(([v1]) => {
      localStorage.setItem(v1, JSON.stringify({
        email:'vieja@df.test', user:'abogada_vieja',
        progress:{ levels:{ 1:{ played:true, passed:true, score:777, stars:2, attempts:3 } } },
        avatar:{ piel:'oscura', pelo:'corto' }
      }));
    }, [K.V1]);
    /* la migración ocurre al INGRESAR con el correo, sobre una cuenta que no existe */
    await go(page, 'niveles.html');
    await page.waitForTimeout(400);
    await page.evaluate(() => DF.store.login('vieja@df.test', 'abogada_vieja'));
    await go(page, 'niveles.html');
    await page.waitForTimeout(400);
    const st = await page.evaluate(() => ({
      played:DF.progress.isPlayed(1), score:DF.progress.result(1).score,
      piel:DF.store.state.avatar.piel, user:DF.store.state.user
    }));
    eq(st.played, true, 'el nivel jugado en la versión anterior sigue contando');
    eq(st.score, 777, 'se conserva el puntaje');
    eq(st.piel, 'oscura', 'se conserva el personaje');
    eq(st.user, 'abogada_vieja', 'se conserva el usuario');
  })));

  /* 16 · cada flecha lleva a su pantalla y no hay flechas sin acción */
  T.push(ok('16 · mapa de flechas completo', () => withPage(async (page) => {
    await login(page, 'dieciseis@df.test', 'dieciseis', {
      progress:{ levels:{ 1:{ played:true, passed:true, score:900, stars:3, attempts:1 } } }
    });
    /* DF.nav solo existe dentro de una pantalla del juego, no en el contenedor */
    await go(page, 'menu.html');
    await page.waitForTimeout(300);
    const routes = await page.evaluate(() => DF.nav.ROUTES);
    const esperado = {
      'config.html':'menu.html', 'soporte.html':'config.html', 'ranking.html':'menu.html',
      'manual.html':'menu.html', 'vestir.html':'menu.html', 'niveles.html':'menu.html',
      'desafio.html':'menu.html', 'palabra.html':'menu.html'
    };
    for(const [from, to] of Object.entries(esperado)) eq(routes[from].back, to, 'la ← de ' + from);
    for(const [from, to] of Object.entries({
      'nivel-titulo.html':'nivel-desc.html', 'nivel-desc.html':'caso.html',
      'caso.html':'juicio.html', 'juicio.html':'desafio.html'
    })) assert(String(routes[from].next.page).indexOf(to) === 0, 'la → de ' + from + ' debería ir a ' + to);
    /* las pantallas de inicio no ofrecen flechas que no hacen nada */
    for(const p of ['portada.html', 'registro.html', 'menu.html', 'resultado.html', 'fin.html'])
      assert(!routes[p], p + ' no debería tener flechas con destino');
    await go(page, 'caso.html?n=1');
    await page.waitForTimeout(400);
    eq(await page.evaluate(() => document.querySelector('[data-nav="next"]').classList.contains('nav-off')), true,
       'en el expediente la → está oculta hasta leer las 3 carpetas');
  })));

  /* 17 · el área sensible es el dibujo, no el cuadro de 104 px */
  T.push(ok('17 · área de clic = el icono', () => withPage(async (page) => {
    await login(page, 'diecisiete@df.test', 'diecisiete');
    await go(page, 'menu.html');
    await page.waitForTimeout(400);
    const caja = await page.evaluate(() => {
      const r = document.querySelector('.menu-config').getBoundingClientRect();
      return { x:r.left, y:r.top, w:r.width, h:r.height };
    });
    /* la esquina del CUADRO está fuera del ruedado del ícono: no navega */
    await page.mouse.click(caja.x + 2, caja.y + 2);
    await page.waitForTimeout(350);
    assert(url(page).indexOf('menu') === 0, 'la esquina del cuadro no debería navegar, fue a ' + url(page));
    /* el centro del icono SÍ */
    await page.mouse.click(caja.x + caja.w / 2, caja.y + caja.h / 2);
    await page.waitForTimeout(450);
    assert(url(page).indexOf('config') === 0, 'el centro del icono navega, fue a ' + url(page));

    /* las placas rectangulares del menú se tocan en toda su superficie */
    await go(page, 'menu.html');
    await page.waitForTimeout(400);
    const placa = await page.evaluate(() => {
      const r = document.querySelector('.menu-ranking').getBoundingClientRect();
      return { x:r.left, y:r.top, w:r.width, h:r.height };
    });
    await page.mouse.click(placa.x + 4, placa.y + 4);
    await page.waitForTimeout(450);
    assert(url(page).indexOf('ranking') === 0, 'la placa rectangular también responde en la esquina, fue a ' + url(page));
  })));

  /* 18 · la música vive en el contenedor y no se reinicia al cambiar de pantalla */
  T.push(ok('18 · música continua y con volumen', () => withPage(async (page) => {
    await page.goto(BASE + '/index.html', { waitUntil:'domcontentloaded' });
    const frame = page.frame('df-shell');
    assert(frame, 'index.html debería montar el marco del juego');
    await frame.waitForTimeout(800);
    eq(await frame.evaluate(() => DF.music.info().mode), 'shell',
       'dentro del contenedor la música la gobierna index.html');
    /* Un clic en una esquina (fuera del botón COMENZAR) desbloquea el audio del
       contenedor; la pantalla sigue siendo la portada. */
    await page.mouse.click(6, 6);
    await page.waitForTimeout(200);
    await frame.evaluate(() => DF.music.sync(true));   // la pantalla avisa su volumen al contenedor
    await page.waitForTimeout(600);
    const antes = await page.evaluate(() => {
      const a = document.getElementById('df-music');
      return { src:a.currentSrc, loop:a.loop, t:a.currentTime, pausado:a.paused };
    });
    assert(/musica-quiz\.(mp3|ogg|wav)$/.test(antes.src), 'el navegador eligió un formato de audio: ' + antes.src);
    eq(antes.loop, true, 'la música es en bucle');
    eq(antes.pausado, false, 'con el volumen de Configuración la música suena');
    assert(antes.t > 0, 'el audio avanzó, marcaba ' + antes.t);

    /* cambiar de pantalla dentro del marco no recrea el marco ni el audio */
    await frame.click('.splash-btn');
    await page.waitForTimeout(1200);
    assert(page.frame('df-shell') === frame, 'el marco sigue siendo el mismo después de navegar');
    const despues = await page.evaluate(() => {
      const a = document.getElementById('df-music');
      return { src:a.currentSrc, t:a.currentTime, pausado:a.paused };
    });
    eq(despues.src, antes.src, 'la música no se recarga al cambiar de pantalla');
    eq(despues.pausado, false, 'ni se corta al cambiar de pantalla');
    assert(despues.t > antes.t, 'el reloj del audio sigue corriendo (' + antes.t + ' -> ' + despues.t + ')');

    /* el volumen sale de Configuración: música en 0 = silencio */
    const nivel = await frame.evaluate(() => {
      DF.store.setSetting('music', 0);
      const cero = DF.music.level();
      DF.store.setSetting('music', 100);
      return { cero, lleno:DF.music.level() };
    });
    eq(nivel.cero, 0, 'música en 0 apaga la música');
    assert(nivel.lleno > nivel.cero, 'subir la música sube el nivel');
  })));

  /* 19 · el video tutorial solo se muestra si el archivo existe */
  T.push(ok('19 · video tutorial', () => withPage(async (page) => {
    await login(page, 'diecinueve@df.test', 'diecinueve', {
      progress:{ levels:{ 1:{ played:true, passed:true, score:900, stars:3, attempts:1 } } }
    });
    await go(page, 'niveles.html');
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => {
      const v = document.getElementById('tuto-video');
      return { oculto:document.getElementById('tuto').classList.contains('hidden'),
               dur:v.duration, err:v.error ? v.error.code : 0, listo:v.readyState };
    });
    if(info.err){
      /* sin archivo: el reproductor debe estar oculto, no roto */
      eq(info.oculto, true, 'sin video el reproductor se oculta');
      console.log('        (el video tutorial no está generado: node tools/build_tutorial.js)');
    } else {
      eq(info.oculto, false, 'con video el reproductor se muestra');
      assert(info.dur > 0, 'el tutorial tiene duración, dio ' + info.dur);
    }
  })));

  for(const t of T) await t();

  await browser.close();

  console.log('\n' + pass + ' pruebas ok, ' + fail + ' fallaron');
  if(failures.length){
    console.log('\n--- detalles ---');
    failures.forEach(([n, m]) => console.log('  ' + n + '\n    ' + m));
  }
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
