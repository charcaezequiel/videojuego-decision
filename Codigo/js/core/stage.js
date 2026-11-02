/* =========================================================
   stage.js · Escala del escenario y orientación
   - Horizontal: 1280x720 (el diseño original, en css/*.css)
   - Vertical:   720 de ancho y 1280 a 1560 de alto (css/responsive.css)
   El stage se dibuja siempre en sus píxeles de diseño y se escala
   con transform: scale(), así toda la hoja de estilos funciona igual
   en cualquier dispositivo.
   - .portrait  -> escenario vertical
   - .compact   -> celular acostado: textos chicos más grandes
   - Brillo y Gráficos (Configuración) se aplican acá.
   ========================================================= */
window.DF = window.DF || {};

DF.stage = (function(){
  const LAND = [1280, 720];
  const PORT_W = 720, PORT_MIN = 1280, PORT_MAX = 1560;
  const BG_BASE = 1306.2;                 // tile de fondo para un stage de 1280 de ancho
  const COMPACT_BELOW = 0.62;             // escala por debajo de la cual el stage se ve chico
  const MAX_SCALE = { '1920': 1.5, '1280': 1 };

  let shade = null;
  let current = null;

  const root = () => document.documentElement;
  const viewport = () => document.querySelector('.viewport');
  const stage = () => document.querySelector('.stage');

  function portrait(){
    return window.innerWidth / window.innerHeight < 1.02;
  }

  function size(isPortrait){
    if(!isPortrait) return LAND;
    const ratio = window.innerWidth / window.innerHeight;
    const h = Math.round(Math.min(PORT_MAX, Math.max(PORT_MIN, PORT_W / ratio)));
    return [PORT_W, h];
  }

  /* El tile de fondo se mantiene en la misma proporción que el escenario,
     así el patrón continúa por los costados sin cortes ni franjas. */
  function paint(scaleOut, w){
    const stageBg = (BG_BASE * w / LAND[0]).toFixed(2) + 'px auto';
    const viewBg = (BG_BASE * w / LAND[0] * scaleOut).toFixed(2) + 'px auto';
    const st = stage(), vp = viewport();
    if(st) st.style.backgroundSize = stageBg;
    if(vp) vp.style.backgroundSize = viewBg;
  }

  function apply(){
    const st = stage(), vp = viewport();
    if(!st || !vp) return;
    const isPortrait = portrait();
    const [w, h] = size(isPortrait);
    const cap = MAX_SCALE[state().graphics] || MAX_SCALE['1920'];

    st.style.width = w + 'px';
    st.style.height = h + 'px';
    root().style.setProperty('--sh', h + 'px');
    root().classList.toggle('portrait', isPortrait);
    root().classList.toggle('landscape', !isPortrait);

    const scale = Math.min(cap, Math.min(window.innerWidth / w, window.innerHeight / h));
    st.style.transform = 'scale(' + scale + ')';
    root().classList.toggle('compact', !isPortrait && scale < COMPACT_BELOW);
    paint(scale, w);
    brightness();
    current = { w, h, scale, portrait: isPortrait };
  }

  function state(){
    const s = DF.store && DF.store.state.settings;
    return s || { brightness: 55, graphics: '1920' };
  }

  /* Capa oscura sobre todo el ventanal (Configuración → Brillo) */
  function brightness(){
    const vp = viewport();
    if(!vp) return;
    if(!shade){
      shade = document.createElement('div');
      shade.className = 'stage-shade';
      shade.setAttribute('aria-hidden', 'true');
      vp.appendChild(shade);
    }
    const b = Math.max(0, Math.min(100, +state().brightness));
    shade.style.opacity = ((100 - b) / 100 * 0.6).toFixed(3);
  }

  function init(){
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', () => setTimeout(apply, 120));
  }

  return { init, apply, get info(){ return current; }, portrait };
})();
