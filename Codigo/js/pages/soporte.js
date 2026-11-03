/* =========================================================
   soporte.js · FAQ estática (en el HTML) + contacto por modal
   Los mensajes quedan en el navegador del dispositivo: no hay
   servidor ni datos personales en juego.
   ========================================================= */
DF.boot(() => {
  const KEY = 'df_decision_final_v2:mensajes';
  const modal = document.getElementById('modal-contacto');
  const area = document.getElementById('mensaje');
  const disparador = document.getElementById('btn-contacto');

  function open(on){
    modal.classList.toggle('hidden', !on);
    if(on) setTimeout(() => area.focus(), 60);
    else disparador.focus();      // el foco vuelve a donde estaba el usuario
  }

  disparador.addEventListener('click', () => open(true));
  document.getElementById('cerrar-contacto').addEventListener('click', () => open(false));
  modal.addEventListener('click', e => { if(e.target === modal) open(false); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !modal.classList.contains('hidden')) open(false); });

  function stored(){
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch(e){ return []; }
  }

  document.getElementById('enviar-contacto').addEventListener('click', () => {
    const text = area.value.trim();
    if(!text){ area.focus(); return; }
    try {
      const list = stored();
      list.push({ at:new Date().toISOString(), user:DF.store.state.user || null, text:text });
      localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
    } catch(e){}
    area.value = '';
    open(false);
    DF.toast(DF.i18n.t('enviado'));
  });
}, { requiresUser:true });
