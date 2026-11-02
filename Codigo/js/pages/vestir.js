/* =========================================================
   vestir.js · 12 categorías, una prenda por categoría
   - tocar una prenda la pone; tocarla de nuevo la saca
   - bufanda y collar se excluyen entre sí
   - las prendas se desbloquean al TERMINAR el nivel indicado
   ========================================================= */
DF.boot(() => {
  const box = document.getElementById('avatar-box');
  const skins = document.getElementById('skins');
  const panel = document.getElementById('dress-panel');
  const EXCLUSIVE = ['bufandas', 'collares'];

  const label = o => {
    if(!o) return '';
    if(typeof o === 'string') return o;
    return o[DF.i18n.lang()] || o.es || '';
  };

  function avatar(){ return DF.sprites.normalize(DF.store.state.avatar); }

  function drawAvatar(){
    box.innerHTML = DF.sprites.avatar(avatar(), 7);
  }

  /* ---------- tonos de piel ---------- */
  function drawSkins(){
    const a = avatar();
    skins.innerHTML = Object.keys(DF.sprites.SKINS).map(k =>
      '<button type="button" class="skin' + (a.piel === k ? ' sel' : '') + '" data-skin="' + k + '"' +
      ' style="background:' + DF.sprites.SKINS[k].S + '" aria-label="' + DF.esc(label(DF.sprites.SKINS[k].name)) + '"></button>'
    ).join('');
    skins.querySelectorAll('[data-skin]').forEach(b => b.addEventListener('click', () => {
      DF.store.update(s => { s.avatar.piel = b.dataset.skin; });
      drawAvatar(); drawSkins();
    }));
  }

  /* ---------- panel de prendas ---------- */
  function drawPanel(){
    const a = avatar();
    panel.innerHTML = DF.sprites.categories().map(c => {
      const items = c.items.map(it => {
        const unlocked = DF.progress.itemUnlocked(it.lvl || 0);
        const sel = a[c.key] === it.key;
        return '<button type="button" class="ditem' + (sel ? ' sel' : '') + (unlocked ? '' : ' locked') + '"' +
          ' data-cat="' + c.key + '" data-item="' + it.key + '"' +
          ' aria-pressed="' + sel + '"' +
          ' title="' + DF.esc(label(it.name)) + (unlocked ? '' : ' · ' + DF.esc(DF.i18n.t('prendaBloq', { n:it.lvl }))) + '">' +
          DF.sprites.itemPreview(c.key, it.key, 8) +
          (unlocked ? '' : '<span class="lock">' + it.lvl + '</span>') +
          '</button>';
      }).join('');
      return '<div class="dbox c-' + c.key + '" data-cat="' + c.key + '">' +
        '<span class="lbl">' + DF.esc(label(c.name)) + '</span>' + items + '</div>';
    }).join('');

    panel.querySelectorAll('.ditem').forEach(b => b.addEventListener('click', () => {
      const cat = b.dataset.cat, key = b.dataset.item;
      const item = DF.sprites.item(cat, key);
      if(!item || !DF.progress.itemUnlocked(item.lvl || 0)){
        DF.toast(DF.i18n.t('prendaBloq', { n:item ? item.lvl : 1 }));
        b.classList.add('shake');
        setTimeout(() => b.classList.remove('shake'), 400);
        return;
      }
      pick(cat, key);
    }));
  }

  function pick(cat, key){
    let excluido = false;
    DF.store.update(s => {
      const a = DF.sprites.normalize(s.avatar);
      const mismo = a[cat] === key;
      a[cat] = mismo ? undefined : key;
      if(!mismo && EXCLUSIVE.indexOf(cat) >= 0){
        const otro = cat === 'bufandas' ? 'collares' : 'bufandas';
        if(a[otro]){ delete a[otro]; excluido = true; }
      }
      s.avatar = a;
    });
    if(excluido) DF.toast(DF.i18n.t('excluye'));
    drawAvatar(); drawPanel();
  }

  drawAvatar(); drawSkins(); drawPanel();
}, { requiresUser:true });
