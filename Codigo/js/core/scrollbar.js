/* =========================================================
   scrollbar.js · Barra de desplazamiento del prototipo
   (riel crema con indicador marrón) sincronizada con un
   contenedor con overflow. Se puede arrastrar o tocar el riel.
   Uso: DF.scrollbar(contenedor, riel)
   ========================================================= */
window.DF = window.DF || {};

DF.scrollbar = function(box, track){
  if(!box || !track) return;
  let thumb = track.querySelector('.sb-thumb');
  if(!thumb){ thumb = document.createElement('div'); thumb.className = 'sb-thumb'; track.appendChild(thumb); }

  function update(){
    const max = box.scrollHeight - box.clientHeight;
    track.classList.toggle('sb-off', max <= 1);
    const th = track.clientHeight;
    const h = Math.max(44, th * box.clientHeight / Math.max(box.scrollHeight, 1));
    thumb.style.height = h + 'px';
    thumb.style.transform = 'translateY(' + (max > 0 ? (th - h) * box.scrollTop / max : 0) + 'px)';
  }

  /* El escenario está escalado con transform: se corrige el movimiento del mouse */
  const scale = () => track.getBoundingClientRect().height / track.clientHeight || 1;

  let drag = null;
  thumb.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    drag = { y:e.clientY, top:box.scrollTop };
    thumb.setPointerCapture(e.pointerId);
  });
  thumb.addEventListener('pointermove', e => {
    if(!drag) return;
    const max = box.scrollHeight - box.clientHeight;
    const free = track.clientHeight - thumb.clientHeight;
    box.scrollTop = drag.top + (e.clientY - drag.y) / scale() * (max / Math.max(free, 1));
  });
  thumb.addEventListener('pointerup', () => { drag = null; });
  track.addEventListener('pointerdown', e => {
    if(e.target === thumb) return;
    const r = track.getBoundingClientRect();
    const pos = (e.clientY - r.top) / r.height;
    box.scrollTop = pos * (box.scrollHeight - box.clientHeight);
  });

  box.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
  update();
  return { update };
};
