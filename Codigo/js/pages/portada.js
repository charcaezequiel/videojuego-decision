/* Portada: solo arranque. Si ya hay una cuenta abierta, COMENZAR
   lleva al menú en vez de pedir de nuevo el correo. */
DF.boot(() => {
  const btn = document.querySelector('.splash-btn');
  if(DF.store.isLoggedIn() && btn) btn.href = 'menu.html';
});
