/* =========================================================
   boot.js · Arranque común de todas las pantallas
   - aplica idioma, escala, brillo, sonidos y música
   - protege pantallas que requieren registro o un nivel válido
   - NAVEGACIÓN con las flechas del diseño (y teclas ← →),
     centralizada en un único mapa de rutas (DF.nav.ROUTES)
   - evita navegaciones duplicadas (doble clic)
   ========================================================= */
window.DF = window.DF || {};

DF.nav = (function(){
  let leaving = false;     // ya se pidió cambiar de pantalla
  let keysOn = true;       // atajos ← → del teclado (se apagan en las pantallas que usan las flechas para jugar)
  const enabled = { back: true, next: true };   // condiciones propias de la pantalla (ej.: leer las carpetas)

  /* ---------------------------------------------------------
     MAPA ÚNICO DE LAS FLECHAS
     pantalla → a dónde lleva la flecha ← (back) y la flecha → (next).
     L('pagina.html') = lleva el nivel actual (?n=).
     Si una pantalla no tiene destino para una flecha, la flecha
     NO se muestra (no queda una "sombra" sin acción).
     --------------------------------------------------------- */
  const L = page => ({ page, level: true });
  const ROUTES = {
    'config.html':       { back: 'menu.html' },
    'soporte.html':      { back: 'config.html' },
    'ranking.html':      { back: 'menu.html' },
    'manual.html':       { back: 'menu.html' },
    'vestir.html':       { back: 'menu.html' },
    'niveles.html':      { back: 'menu.html' },
    'nivel-titulo.html': { back: 'niveles.html',         next: L('nivel-desc.html') },
    'nivel-desc.html':   { back: L('nivel-titulo.html'), next: L('caso.html') },
    'caso.html':         { back: L('nivel-desc.html'),   next: L('juicio.html') },
    'juicio.html':       { back: L('caso.html'),         next: L('desafio.html') },
    'desafio.html':      { back: 'menu.html' },          // preguntas: ← va DIRECTO al menú principal
    'palabra.html':      { back: 'menu.html' }           // desafío final del nivel: ídem
  };

  /* Archivo de la pantalla actual (ej.: "caso.html"). Funciona también en servidores
     con "URLs limpias" que muestran /pages/caso en lugar de /pages/caso.html */
  function page(){
    let p = location.pathname.split('/').pop() || 'index';
    try { p = decodeURIComponent(p); } catch(e){}
    return p.replace(/\.html?$/i, '') + '.html';
  }

  /* Nivel actual (?n=). Devuelve null si falta o no existe. */
  function level(){
    const n = parseInt(new URLSearchParams(location.search).get('n'), 10);
    const total = DF.levels ? DF.levels.length : 10;
    return (n >= 1 && n <= total) ? n : null;
  }

  function withLevel(p, n){ return p + (n ? '?n=' + n : ''); }

  /* Destino de una flecha en esta pantalla (o null si no tiene) */
  function route(dir){
    const r = ROUTES[page()];
    const to = r && r[dir];
    if(!to) return null;
    if(typeof to === 'string') return to;
    const n = level();
    return n ? withLevel(to.page, n) : null;      // una ruta de nivel sin nivel válido no se ofrece
  }

  /* Navega UNA sola vez aunque se llame varias veces */
  function go(p, n){
    if(leaving) return false;
    leaving = true;
    location.href = withLevel(p, n);
    return true;
  }
  function replace(p, n){ leaving = true; location.replace(withLevel(p, n)); }

  /* Sigue la flecha indicada si tiene una acción disponible */
  function follow(dir){
    const to = route(dir);
    if(!to || !enabled[dir]) return false;
    return go(to);
  }

  const arrows = () => document.querySelectorAll('[data-nav]');

  /* Muestra cada flecha SOLO si tiene a dónde ir (y la pantalla la habilitó).
     Sin acción: se oculta del todo, no se puede enfocar ni tocar. */
  function refresh(){
    arrows().forEach(a => {
      const dir = a.dataset.nav;
      const to = route(dir);
      const on = !!to && enabled[dir] !== false;
      a.classList.toggle('nav-off', !on);
      a.setAttribute('aria-hidden', on ? 'false' : 'true');
      if(on){ a.setAttribute('href', to); a.removeAttribute('tabindex'); }
      else { a.removeAttribute('href'); a.setAttribute('tabindex', '-1'); }
    });
  }

  /* La pantalla habilita / deshabilita una flecha (ej.: caso.html hasta leer las carpetas) */
  function enable(dir, on){ enabled[dir] = !!on; refresh(); }
  /* Atajos ← → del teclado (en el cuestionario las flechas del teclado eligen opciones) */
  function keys(on){ keysOn = !!on; }

  const usable = el => el && !el.classList.contains('nav-off') && !el.classList.contains('disabled') && el.offsetParent !== null;

  function bindArrows(){
    refresh();
    // Teclado: ← = flecha volver, → = flecha avanzar (si están disponibles)
    document.addEventListener('keydown', e => {
      if(e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || !keysOn) return;
      if(/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
      if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const overlay = document.querySelector('.doc-overlay:not(.hidden)');
      let el = null;
      if(overlay) el = e.key === 'ArrowLeft' ? overlay.querySelector('.btn-back') : null;
      else el = document.querySelector(e.key === 'ArrowLeft' ? '[data-nav="back"]' : '[data-nav="next"]');
      if(usable(el)){ e.preventDefault(); el.click(); }
    });
    // Un solo cambio de pantalla por clic (evita duplicar acciones)
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if(!a) return;
      if(a.classList.contains('nav-off') || a.classList.contains('disabled') || !a.getAttribute('href')){ e.preventDefault(); return; }
      if(e.button || e.ctrlKey || e.metaKey || e.shiftKey) return;   // abrir en otra pestaña: esta sigue activa
      if(leaving){ e.preventDefault(); return; }
      leaving = true;
    }, true);
    // Si el navegador restaura la página desde la caché (botón atrás), se reactiva
    window.addEventListener('pageshow', ev => { if(ev.persisted) leaving = false; });
  }

  return { ROUTES, page, level, route, go, replace, follow, enable, keys, refresh, bindArrows, get leaving(){ return leaving; } };
})();

DF.toast = function(msg, ms){
  const stage = document.querySelector('.stage');
  let el = stage.querySelector('.toast');
  if(!el){ el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); stage.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(DF._toastT);
  DF._toastT = setTimeout(() => el.classList.remove('show'), ms || 2200);
};

DF.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

/* opts.requiresUser: exige registro · opts.level: exige ?n= válido y desbloqueado */
DF.boot = function(fn, opts){
  opts = opts || {};
  document.addEventListener('DOMContentLoaded', () => {
    if(opts.requiresUser && !DF.store.state.user){ DF.nav.replace('registro.html'); return; }
    if(opts.level){
      const n = DF.nav.level();
      if(!n || !DF.progress.isUnlocked(n)){ DF.nav.replace('niveles.html'); return; }
    }
    DF.stage.init();
    DF.i18n.apply();
    DF.nav.bindArrows();
    DF.audio.bindGlobalClicks();
    if(DF.music) DF.music.init();
    if(DF.shell) DF.shell.announce();
    if(fn) fn();
  });
};
