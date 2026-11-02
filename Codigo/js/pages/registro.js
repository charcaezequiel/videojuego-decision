/* =========================================================
   registro.js · correo + usuario de jugador
   - valida antes de guardar
   - un correo que ya existe recupera sus datos
   ========================================================= */
DF.boot(() => {
  const form = document.getElementById('form-registro');
  const correo = document.getElementById('correo');
  const usuario = document.getElementById('usuario');
  const msgCorreo = document.getElementById('msg-correo');
  const msgUsuario = document.getElementById('msg-usuario');

  const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function fail(el, input, msg){
    el.textContent = msg;
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }
  function ok(el, input){
    el.textContent = '';
    input.classList.remove('error');
    input.removeAttribute('aria-invalid');
  }

  correo.addEventListener('input', () => ok(msgCorreo, correo));
  usuario.addEventListener('input', () => ok(msgUsuario, usuario));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = DF.store.normalEmail(correo.value);
    const user = usuario.value.trim();

    if(!EMAIL.test(email)){ fail(msgCorreo, correo, DF.i18n.t('errCorreo')); return; }
    ok(msgCorreo, correo);
    if(user.length < 3 || user.length > 16){ fail(msgUsuario, usuario, DF.i18n.t('errUsuario')); return; }
    ok(msgUsuario, usuario);

    DF.store.login(email, user);
    DF.nav.go('menu.html');
  });

  // Si llegó alguien que ya está registrado en esta pestaña, pasa directo
  if(DF.store.isLoggedIn()) DF.nav.go('menu.html');
  else correo.focus();
});
