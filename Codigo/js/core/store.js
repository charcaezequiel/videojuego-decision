/* =========================================================
   store.js · Estado guardado en el navegador
   - Cada CUENTA (correo) vive en su propia clave:
       df_decision_final_v2:cuenta:<correo>  -> {user,email,progress,avatar,run}
   - Los AJUSTES son del dispositivo (todas las cuentas los comparten):
       df_decision_final_v2:ajustes
   - La sesión vive en sessionStorage: mientras la pestaña esté abierta.
     Al cerrarla hay que volver a escribir el correo.
   - Una cuenta nunca lee ni escribe la clave de otra.
   - Las partidas en curso (run) viajan dentro del registro de la cuenta
     y se borran al cambiar de cuenta.
   ========================================================= */
window.DF = window.DF || {};

DF.store = (function(){
  const V2 = 'df_decision_final_v2';
  const V1 = 'df_decision_final_v1';
  const SETTINGS_KEY = V2 + ':ajustes';
  const SESSION_KEY = V2 + ':sesion';
  const acctKey = email => V2 + ':cuenta:' + email;

  const DEFAULT_SETTINGS = { volume: 70, brightness: 55, music: 40, lang: 'es', graphics: '1920' };

  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch(e){ return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){} };

  const normalEmail = email => String(email || '').trim().toLowerCase();

  function blankAccount(email, user){
    return {
      user: user || null,
      email: normalEmail(email),
      progress: { levels: {} },
      avatar: { piel: 'media', pelo: 'largo', varios: 'cadena' },
      run: null
    };
  }

  /* El estado vivo: lo que leen todas las pantallas */
  const state = {
    user: null,
    email: null,
    progress: { levels: {} },
    avatar: {},
    settings: Object.assign({}, DEFAULT_SETTINGS)
  };

  function loadSettings(){
    const saved = read(SETTINGS_KEY);
    state.settings = Object.assign({}, DEFAULT_SETTINGS, saved && typeof saved === 'object' ? saved : {});
  }

  function saveSettings(){
    const out = {};
    Object.keys(DEFAULT_SETTINGS).forEach(k => { out[k] = state.settings[k]; });
    write(SETTINGS_KEY, out);
  }

  /* ---- sesión: qué cuenta está abierta en ESTA pestaña ---- */
  function sessionEmail(){
    try {
      const e = normalEmail(sessionStorage.getItem(SESSION_KEY));
      return e && read(acctKey(e)) ? e : null;
    } catch(e){ return null; }
  }
  function setSession(email){
    try { email ? sessionStorage.setItem(SESSION_KEY, normalEmail(email)) : sessionStorage.removeItem(SESSION_KEY); } catch(e){}
  }

  /* Aplica un registro de cuenta al estado vivo */
  function applyAccount(acc){
    state.user = acc.user;
    state.email = acc.email;
    state.progress = acc.progress && acc.progress.levels ? acc.progress : { levels: {} };
    state.avatar = acc.avatar || {};
  }

  function emptyOut(){
    state.user = null;
    state.email = null;
    state.progress = { levels: {} };
    state.avatar = {};
  }

  /* Escribe el estado vivo en la clave de su propia cuenta */
  function persist(){
    if(!state.email) return;
    const prev = read(acctKey(state.email)) || blankAccount(state.email, state.user);
    write(acctKey(state.email), {
      user: state.user,
      email: state.email,
      progress: state.progress,
      avatar: state.avatar,
      run: prev.run === undefined ? null : prev.run
    });
  }

  /* Mutación única: fn cambia el estado y se guarda */
  function update(fn){
    fn(state);
    persist();
  }

  /* ---- registro / cambio de cuenta ---- */
  function login(email, user){
    email = normalEmail(email);
    let acc = read(acctKey(email));
    if(!acc){
      acc = migrateInto(email, user);
      if(!acc) acc = blankAccount(email, user);
    }
    if(user && acc.user !== user){ acc.user = user; }
    acc.email = email;
    write(acctKey(email), acc);
    setSession(email);
    applyAccount(acc);
    return acc;
  }

  /* Cierra la sesión: los datos quedan guardados en su clave */
  function logout(){
    if(state.email) updateRun(null);
    setSession(null);
    emptyOut();
  }

  function isLoggedIn(){ return !!state.user; }

  function accounts(){
    const out = [];
    for(let i = 0; i < localStorage.length; i++){
      const key = localStorage.key(i);
      if(!key || key.indexOf(V2 + ':cuenta:') !== 0) continue;
      const acc = read(key);
      if(acc && acc.user) out.push(summary(acc));
    }
    return out.sort((a, b) => b.score - a.score);
  }
  /* Lo que muestra el ranking: nunca el correo */
  function summary(acc){
    const levels = (acc.progress && acc.progress.levels) || {};
    const played = Object.keys(levels).map(k => levels[k]).filter(r => r && r.played);
    return {
      email: acc.email,
      user: acc.user,
      avatar: acc.avatar || null,
      score: played.reduce((sum, r) => sum + (r.score || 0), 0),
      stars: played.reduce((sum, r) => sum + (r.stars || 0), 0),
      won: played.filter(r => r.passed).length,
      played: played.length
    };
  }
  function totalOf(acc){ return summary(acc).score; }

  /* ---- partida en curso (cuestionario / carpetas leídas / resultado) ---- */
  function saveRun(data){
    if(!state.email) return;
    const acc = read(acctKey(state.email)) || blankAccount(state.email, state.user);
    acc.run = data;
    write(acctKey(state.email), acc);
  }
  function getRun(){
    if(!state.email) return null;
    const acc = read(acctKey(state.email));
    return acc ? acc.run || null : null;
  }
  function updateRun(data){ saveRun(data); }

  /* ---- ajustes ---- */
  function setSetting(key, value){
    state.settings[key] = value;
    saveSettings();
  }

  /* ---- migración desde df_decision_final_v1 (una sola vez) ---- */
  function migrateInto(email, user){
    const legacy = read(V1);
    if(!legacy || typeof legacy !== 'object') return null;
    const same = normalEmail(legacy.email) === email;
    if(!same) return null;
    const acc = blankAccount(email, user || legacy.user);
    acc.progress = mergeLevels(read(acctKey(email)), legacy.progress);
    acc.avatar = legacy.avatar || acc.avatar;
    return acc;
  }

  /* Si la cuenta ya existe, se conserva el mejor resultado de cada nivel */
  function mergeLevels(existing, legacy){
    const src = (legacy && legacy.levels) || {};
    const out = (existing && existing.progress && existing.progress.levels) || {};
    Object.keys(src).forEach(n => {
      const a = out[n], b = src[n];
      if(!a){ out[n] = b; return; }
      out[n] = {
        played: true,
        passed: !!(a.passed || b.passed),
        score: Math.max(a.score || 0, b.score || 0),
        stars: Math.max(a.stars || 0, b.stars || 0),
        attempts: (a.attempts || 0) + (b.attempts || 0),
        last: a.last || b.last || null
      };
    });
    return { levels: out };
  }

  /* Un nivel jugado con la versión anterior sigue contando como "terminado" */
  function markLegacyMigrated(){
    const legacy = read(V1);
    if(!legacy || legacy.__migrated) return;
    write(V1, Object.assign({}, legacy, { __migrated: true }));
  }

  loadSettings();
  const active = sessionEmail();
  if(active) applyAccount(read(acctKey(active)));
  markLegacyMigrated();

  return {
    state, update, persist, login, logout, isLoggedIn, accounts, summary,
    setSetting, saveSettings, saveRun, getRun, updateRun,
    normalEmail, DEFAULT_SETTINGS, KEY: { V2, V1, SETTINGS_KEY, SESSION_KEY, acctKey }
  };
})();
