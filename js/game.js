/* Héroes de las Tablas — lógica principal */
(() => {
  'use strict';

  const {
    WORLDS, BOSS2, LEVELS, AVATARS, HATS, PETS, AURAS, TITLES, POWERS, TROPHIES, CHEERS, ENCOURAGE, DEFAULT_SAVE,
  } = DATA;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const rand = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rand(arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // ================= Guardado =================
  const SAVE_KEY = 'heroesTablas_v1';

  function merge(base, extra) {
    for (const k of Object.keys(extra || {})) {
      const v = extra[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        merge(base[k], v);
      } else {
        base[k] = v;
      }
    }
    return base;
  }

  function load() {
    let data = clone(DEFAULT_SAVE);
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) data = merge(data, JSON.parse(raw));
    } catch (e) {
      /* almacenamiento no disponible */
    }
    // Partidas guardadas antes de que existieran los finales
    if ((data.stars.boss || 0) > 0 && !data.finals.includes(1)) data.finals.push(1);
    if (data.level === 2 && !data.finals.includes(1)) data.level = 1;
    return data;
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    } catch (e) {
      /* almacenamiento no disponible */
    }
  }

  let S = load();

  // ================= Utilidades de progreso =================
  const starsMap = (lvl) => (lvl === 2 ? S.stars2 : S.stars);
  const starsOf = (key, lvl = S.level) => starsMap(lvl)[key] || 0;
  const totalStars = (lvl = S.level) => Object.values(starsMap(lvl)).reduce((a, b) => a + b, 0);
  const totalStarsAll = () => totalStars(1) + totalStars(2);
  const tablesDone = (lvl = 1) => TABLES.filter((t) => starsOf(t, lvl) > 0).length;
  const level2Open = () => S.finals.includes(1);
  const isUnlocked = (key, lvl = S.level) => {
    if (lvl === 2 && !level2Open()) return false;
    return key === 'boss' ? tablesDone(lvl) === 10 : key === 1 || starsOf(key - 1, lvl) > 0;
  };
  const powerUnlocked = (id) => tablesDone(1) >= POWERS[id].unlock;
  const avatarUnlocked = (a) => (a.final ? S.finals.includes(a.final) : totalStarsAll() >= a.need);
  const worldName = (key) => (key === 'boss' ? 'Jefe final' : `Tabla del ${key}`);

  function worldInfo(key, lvl = S.level) {
    if (key === 'boss') return lvl === 2 ? BOSS2 : WORLDS.boss;
    const w = WORLDS[key];
    return lvl === 2 ? { ...w, name: `Mega ${w.name}` } : w;
  }

  // ---- Artículos de personalización (gorros, mascotas, auras) ----
  const ITEM_KINDS = {
    hat: { list: HATS, owned: 'hats' },
    pet: { list: PETS, owned: 'pets' },
    aura: { list: AURAS, owned: 'auras' },
  };
  const itemSpecialMet = (it) => (it.final ? S.finals.includes(it.final) : it.half2 ? tablesDone(2) >= 5 : false);
  const isSpecial = (it) => Boolean(it.final || it.half2);
  const ownsItem = (kind, it) => S[ITEM_KINDS[kind].owned].includes(it.id) || (isSpecial(it) && itemSpecialMet(it));
  const itemById = (kind, id) => ITEM_KINDS[kind].list.find((x) => x.id === id) || ITEM_KINDS[kind].list[0];
  const specialHint = (it) => (it.final === 1 ? 'Termina el Nivel 1' : it.final === 2 ? 'Termina el Nivel 2' : 'Completa 5 tablas del Nivel 2');

  function avatarHTML(size = '') {
    const hat = itemById('hat', S.hat).e;
    const pet = itemById('pet', S.pet).e;
    return `<div class="avatar ${size} aura-${S.aura}">
      <span class="aura-fx"></span>
      <span class="avatar-face">${S.avatar}</span>
      ${hat ? `<span class="avatar-hat">${hat}</span>` : ''}
      ${pet ? `<span class="avatar-pet">${pet}</span>` : ''}
    </div>`;
  }

  function titleHTML() {
    const lvl = S.finals.includes(2) ? 2 : S.finals.includes(1) ? 1 : 0;
    if (!lvl) return '';
    return `<div class="title-badge t${lvl}">${TITLES[lvl].e} ${TITLES[lvl].name}</div>`;
  }

  function starsHTML(n, max = 3) {
    let s = '';
    for (let i = 0; i < max; i++) s += `<span class="${i < n ? 'on' : 'off'}">★</span>`;
    return s;
  }

  function awardTrophy(id) {
    if (S.trophies.includes(id)) return false;
    S.trophies.push(id);
    const t = TROPHIES.find((x) => x.id === id);
    toast(`${t.e} ¡Trofeo nuevo! <b>${t.name}</b>`, 'gold');
    Sound.fx.unlock();
    save();
    return true;
  }

  function checkGlobalTrophies() {
    if (tablesDone(1) >= 5) awardTrophy('half');
    if (tablesDone(1) >= 10) awardTrophy('all');
    if (tablesDone(2) >= 5) awardTrophy('half2');
    if (totalStars(1) >= 30) awardTrophy('stars30');
    if (totalStarsAll() >= 66) awardTrophy('stars66');
    if (S.coins >= 300) awardTrophy('rich');
    if (S.stats.powersUsed >= 10) awardTrophy('wizard');
    if (S.stats.intruders >= 10) awardTrophy('dodger');
  }

  function applyLevelTheme() {
    document.body.classList.toggle('lvl2', S.level === 2);
    Sound.setBoost(S.level === 2 ? 10 : 0);
  }

  // ================= Pantallas =================
  let current = null;
  function show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${id}`));
    current = id;
    document.body.dataset.screen = id;
    window.scrollTo(0, 0);
  }

  function toast(html, kind = '') {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.innerHTML = html;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 2400);
    setTimeout(() => el.remove(), 2900);
  }

  function openModal(html, cls = '') {
    $('#modal-card').innerHTML = html;
    $('#modal-card').className = `modal-card ${cls}`;
    $('#modal').classList.remove('hidden');
  }
  function closeModal() {
    $('#modal').classList.add('hidden');
  }

  // ================= Inicio =================
  function renderHome() {
    const done1 = tablesDone(1);
    const done2 = tablesDone(2);
    $('#screen-home').innerHTML = `
      <div class="topbar">
        <button class="icon-btn" data-action="settings" aria-label="Ajustes">⚙️</button>
        <div class="pill coins">🪙 <b>${S.coins}</b></div>
        <div class="pill">⭐ <b>${totalStarsAll()}</b></div>
      </div>
      <div class="home">
        <h1 class="logo" aria-label="Héroes de las Tablas">
          <span class="l1">${'HÉROES'.split('').map((c, i) => `<i style="--i:${i}">${c}</i>`).join('')}</span>
          <span class="l2">de las</span>
          <span class="l3">${'TABLAS'.split('').map((c, i) => `<i style="--i:${i + 6}">${c}</i>`).join('')}</span>
        </h1>
        <div class="hero-stage">
          <span class="orbit o1">×</span><span class="orbit o2">7</span><span class="orbit o3">★</span><span class="orbit o4">5</span>
          <div class="beat-target">${avatarHTML('xl')}</div>
        </div>
        ${titleHTML()}
        <p class="tagline">¡Vence a los monstruos con el poder de multiplicar! 🎵</p>
        <button class="btn big primary beat-target" data-action="map">▶ ¡JUGAR!</button>
        <div class="btn-row">
          <button class="btn secondary" data-action="treasure">🎁 Tesoros y tienda</button>
          ${S.finals.length ? '<button class="btn secondary" data-action="diplomas">📜 Mis diplomas</button>' : ''}
        </div>
        <div class="progress-note">
          <div>🌞 Nivel 1: <b>${done1} / 10</b> tablas ${S.finals.includes(1) ? '✅' : ''}</div>
          <div>${level2Open() ? `🌋 Nivel 2: <b>${done2} / 10</b> tablas ${S.finals.includes(2) ? '✅' : ''}` : '🔒 Nivel 2: vence al Dragón Olvidón'}</div>
        </div>
      </div>`;
  }

  // ================= Mapa =================
  function renderMap() {
    const lvl = S.level;
    const keys = [...TABLES, 'boss'];
    const ROW = 128;
    const xs = [22, 50, 78, 50];
    const pts = keys.map((k, i) => ({ k, x: xs[i % 4], y: i * ROW + 80 }));
    const height = keys.length * ROW + 60;
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
    const nextKey = keys.find((k) => isUnlocked(k) && starsOf(k) === 0);

    $('#screen-map').innerHTML = `
      <div class="topbar">
        <button class="icon-btn" data-action="home" aria-label="Inicio">🏠</button>
        <div class="pill coins">🪙 <b>${S.coins}</b></div>
        <div class="pill">⭐ <b>${totalStars()}</b>/33</div>
        <button class="icon-btn" data-action="treasure" aria-label="Tesoros">🎁</button>
      </div>
      <div class="level-switch" role="tablist">
        <button class="${lvl === 1 ? 'active' : ''}" data-action="level" data-lvl="1">🌞 Nivel 1</button>
        <button class="${lvl === 2 ? 'active' : ''} ${level2Open() ? '' : 'locked'}" data-action="level" data-lvl="2">
          ${level2Open() ? '🌋' : '🔒'} Nivel 2 · Leyenda</button>
      </div>
      <h2 class="screen-title">${lvl === 2 ? 'Mapa de leyenda' : 'Mapa de aventuras'}</h2>
      ${lvl === 2 ? '<p class="map-note">⚡ Menos tiempo · ⚠️ Ataques sorpresa · 🧩 Preguntas nuevas · 💰 Premios dobles</p>' : ''}
      <div class="map" style="height:${height}px">
        <svg class="map-path" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">
          <path d="${path}" />
        </svg>
        ${pts
          .map((p) => {
            const w = worldInfo(p.k);
            const unlocked = isUnlocked(p.k);
            const cls = ['node', `w-${p.k}`, unlocked ? '' : 'locked', p.k === nextKey ? 'next' : ''].join(' ');
            return `
            <button class="${cls}" style="left:${p.x}%;top:${p.y}px" data-action="open" data-key="${p.k}"
              aria-label="${worldName(p.k)}${unlocked ? '' : ' (bloqueada)'}">
              <span class="planet">${p.k === 'boss' ? '🌋' : p.k}</span>
              <span class="node-monster">${unlocked ? w.monster : '🔒'}</span>
              <span class="node-label">${p.k === 'boss' ? 'Jefe final' : w.place}</span>
              <span class="node-stars">${starsHTML(starsOf(p.k))}</span>
              ${p.k === nextKey ? `<span class="you">${avatarHTML('sm')}</span>` : ''}
            </button>`;
          })
          .join('')}
      </div>`;

    requestAnimationFrame(() => {
      const target = $('#screen-map .node.next');
      if (target) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  // ================= Estudio (aprender y cantar) =================
  let sing = null;

  function renderStudy(key) {
    stopSing();
    const w = worldInfo(key);
    const isBoss = key === 'boss';
    const lvl2 = S.level === 2;
    const rows = isBoss
      ? ''
      : TABLES.map(
          (b) => `
        <button class="row" data-action="dots" data-a="${key}" data-b="${b}" id="row-${b}">
          <span class="eq">${key} × ${b}</span><span class="eq-eq">=</span><span class="res">${key * b}</span>
        </button>`
        ).join('');

    const intro = isBoss
      ? lvl2
        ? '¡El <b>Rey Dragón Olvidón</b> es el reto final! Mezcla todas las tablas, todos los tipos de pregunta y ataca muy rápido.'
        : '¡El <b>Dragón Olvidón</b> mezcla todas las tablas! Demuestra todo lo que aprendiste.'
      : `¡<b>${w.name}</b> te reta! Repasa la tabla, cántala con el ritmo y luego ¡a la batalla!`;

    $('#screen-study').innerHTML = `
      <div class="topbar">
        <button class="icon-btn" data-action="map" aria-label="Volver al mapa">⬅</button>
        <div class="pill">${lvl2 ? '🌋' : '🌞'} ${worldName(key)}</div>
        <div class="pill">${starsHTML(starsOf(key))}</div>
      </div>
      <div class="study w-${key}">
        <div class="study-head">
          <div class="big-monster float ${lvl2 && !isBoss ? 'mega' : ''}">${w.monster}</div>
          <div>
            <h2>${w.place}</h2>
            <p>${intro}</p>
          </div>
        </div>
        ${lvl2 ? `
        <div class="legend-box">
          <h3>🌋 Modo Leyenda</h3>
          <ul>
            <li>⏱️ <b>Menos tiempo</b> para responder</li>
            <li>⚠️ <b>Ataques sorpresa</b> con preguntas de otras tablas</li>
            <li>🧩 Nuevas preguntas: <b>5 × ? = 25</b>, <b>? × 4 = 12</b> y <b>¿Qué multiplicación da 24?</b></li>
            <li>💰 <b>Premios dobles</b> y un poder cada 4 aciertos seguidos</li>
          </ul>
        </div>` : ''}
        ${isBoss ? '' : `
        <div class="study-actions">
          <button class="btn secondary" data-action="sing" data-key="${key}" id="singBtn">🎤 Cantar con ritmo</button>
        </div>
        <div class="table-grid">${rows}</div>
        <div class="dots-panel" id="dotsPanel"><p>👆 Toca una multiplicación para verla con puntitos</p></div>`}
        <button class="btn big primary beat-target" data-action="play" data-key="${key}">⚔️ ¡A la batalla!</button>
      </div>`;
    show('study');
    Sound.setIntensity(1);
  }

  function dotsHTML(a, b) {
    const groups = [];
    for (let i = 0; i < a; i++) {
      groups.push(`<div class="dot-row" style="--d:${i}">${'<i></i>'.repeat(b)}<span class="count">${b * (i + 1)}</span></div>`);
    }
    return `<div class="dots-title">${a} ${a === 1 ? 'grupo' : 'grupos'} de ${b} = <b>${a * b}</b></div><div class="dots">${groups.join('')}</div>`;
  }

  function showDots(a, b) {
    const panel = $('#dotsPanel');
    if (!panel) return;
    panel.innerHTML = dotsHTML(a, b);
    $$('.table-grid .row').forEach((r) => r.classList.toggle('sel', r.id === `row-${b}`));
  }

  function startSing(key) {
    if (sing) return stopSing();
    sing = { key, row: 0 };
    const btn = $('#singBtn');
    if (btn) btn.textContent = '⏹ Detener';
    toast('🎶 ¡Canta conmigo al ritmo de la música!');
  }

  function stopSing() {
    sing = null;
    const btn = $('#singBtn');
    if (btn) btn.textContent = '🎤 Cantar con ritmo';
    $$('.table-grid .row').forEach((r) => r.classList.remove('singing'));
  }

  Sound.onBar(() => {
    if (!sing || current !== 'study') return;
    if (sing.row >= 10) {
      stopSing();
      toast('🎉 ¡Muy bien cantado!', 'gold');
      Sound.fx.unlock();
      return;
    }
    const b = sing.row + 1;
    const a = sing.key;
    $$('.table-grid .row').forEach((r) => r.classList.toggle('singing', r.id === `row-${b}`));
    const row = $(`#row-${b}`);
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    showDots(a, b);
    Sound.say(`${a} por ${b}, ${a * b}`, 1.1);
    Sound.fx.star(b % 3);
    sing.row++;
  });

  // ================= Preguntas =================
  // Tipos: prod (a × b = ?), missR (a × ? = p), missL (? × b = p), which (¿qué multiplicación da p?)
  function makeQuestions(key, lvl) {
    const mk = (a, b, type, extra = {}) => ({ a, b, type, swap: type === 'prod' && Math.random() < 0.5, ...extra });

    if (lvl === 2) {
      const types = ['prod', 'missR', 'missL', 'which'];
      if (key === 'boss') {
        const all = [];
        for (let a = 2; a <= 10; a++) for (let b = 2; b <= 10; b++) all.push([a, b]);
        return shuffle(all).slice(0, 20).map(([a, b], i) => mk(a, b, types[i % 4]));
      }
      const own = shuffle(TABLES).slice(0, 8).map((b, i) => mk(key, b, i < 2 ? 'prod' : pick(types)));
      const others = TABLES.filter((t) => t !== key && t > 1);
      const intruders = [0, 1, 2, 3].map(() => mk(pick(others), rand(9) + 2, pick(['prod', 'missR']), { intruder: true }));
      const queue = own;
      // los ataques sorpresa nunca son la primera pregunta
      intruders.forEach((q) => queue.splice(1 + rand(queue.length), 0, q));
      return queue;
    }

    if (key === 'boss') {
      const all = [];
      for (let a = 2; a <= 10; a++) for (let b = 2; b <= 10; b++) all.push([a, b]);
      return shuffle(all).slice(0, 15).map(([a, b]) => mk(a, b, Math.random() < 0.25 ? 'missR' : 'prod'));
    }
    const allowMissing = starsOf(key, 1) >= 2;
    return shuffle(TABLES).map((b) => {
      const q = mk(key, b, allowMissing && Math.random() < 0.25 ? 'missR' : 'prod');
      if (q.type === 'prod') q.swap = starsOf(key, 1) >= 1 && Math.random() < 0.4;
      return q;
    });
  }

  function answerOf(q) {
    if (q.type === 'missR') return String(q.b);
    if (q.type === 'missL') return String(q.a);
    if (q.type === 'which') return `${q.a} × ${q.b}`;
    return String(q.a * q.b);
  }

  function makeOptions(q) {
    const ans = q.answer;
    const p = q.a * q.b;
    let pool = [];
    if (q.type === 'which') {
      const cands = [];
      const add = (x, y) => {
        if (x >= 1 && y >= 1 && x <= 10 && y <= 10 && x * y !== p) cands.push(`${x} × ${y}`);
      };
      add(q.a, q.b + 1); add(q.a, q.b - 1); add(q.a + 1, q.b); add(q.a - 1, q.b);
      add(q.a + 1, q.b + 1); add(q.a - 1, q.b + 1); add(q.a + 2, q.b); add(q.a, q.b + 2);
      pool = shuffle([...new Set(cands)]);
      while (pool.length < 3) {
        const x = rand(10) + 1;
        const y = rand(10) + 1;
        const e = `${x} × ${y}`;
        if (x * y !== p && !pool.includes(e)) pool.push(e);
      }
    } else {
      const n = Number(ans);
      const cand = new Set();
      if (q.type === 'prod') {
        const { a, b } = q;
        [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, n + 1, n - 1, n + 2, n + 10, n - 10].forEach((v) => cand.add(v));
      } else {
        [n + 1, n - 1, n + 2, n - 2, rand(10) + 1, rand(10) + 1].forEach((v) => cand.add(v));
      }
      const factor = q.type !== 'prod';
      pool = shuffle([...cand].filter((v) => v > 0 && v !== n && (!factor || v <= 10)));
      while (pool.length < 3) {
        const v = factor ? rand(10) + 1 : n + rand(20) + 1;
        if (v !== n && !pool.includes(v)) pool.push(v);
      }
      pool = pool.map(String);
    }
    return shuffle([ans, ...pool.slice(0, 3)]);
  }

  function questionText(q) {
    const p = q.a * q.b;
    const Q = '<span class="qmark">?</span>';
    if (q.type === 'missR') return `${q.a} × ${Q} = ${p}`;
    if (q.type === 'missL') return `${Q} × ${q.b} = ${p}`;
    if (q.type === 'which') return `<span class="q-small">¿Qué multiplicación da</span> ${p}<span class="q-small">?</span>`;
    const [x, y] = q.swap ? [q.b, q.a] : [q.a, q.b];
    return `${x} × ${y} = ${Q}`;
  }

  function questionSpeech(q) {
    const p = q.a * q.b;
    if (q.type === 'missR') return `${q.a} por cuánto es ${p}`;
    if (q.type === 'missL') return `cuánto por ${q.b} es ${p}`;
    if (q.type === 'which') return `¿Qué multiplicación da ${p}?`;
    const [x, y] = q.swap ? [q.b, q.a] : [q.a, q.b];
    return `${x} por ${y}`;
  }

  // ================= Juego =================
  let G = null;

  function startGame(key) {
    stopSing();
    closeModal();
    const lvl = S.level;
    const L = LEVELS[lvl];
    const queue = makeQuestions(key, lvl);
    G = {
      key,
      lvl,
      L,
      isBoss: key === 'boss',
      queue,
      hp: queue.length,
      maxHp: queue.length,
      hearts: 3,
      mistakes: 0,
      correct: 0,
      combo: 0,
      maxCombo: 0,
      score: 0,
      coins: 0,
      fire: false,
      shield: false,
      locked: true,
      paused: false,
      frozen: false,
      over: false,
      timeMax: L.speeds[S.settings.speed] || L.speeds.normal,
      timeLeft: 0,
      last: performance.now(),
      q: null,
    };
    S.stats.played++;
    save();
    renderGame();
    show('game');
    updateIntensity();
    setTimeout(() => {
      if (G && !G.over) nextQuestion();
    }, 600);
    G.raf = requestAnimationFrame(loop);
  }

  function renderGame() {
    const w = worldInfo(G.key, G.lvl);
    $('#screen-game').innerHTML = `
      <div class="hud">
        <button class="icon-btn" data-action="quit" aria-label="Salir">✖</button>
        <div class="hearts" id="hearts"></div>
        <div class="pill score">⭐ <b id="score">0</b></div>
        <div class="pill coins">🪙 <b id="gcoins">0</b></div>
      </div>
      <div class="arena w-${G.key}">
        <div class="fighter player" id="player">${avatarHTML('lg')}<div class="shield-bubble" id="shieldBubble"></div></div>
        <div class="combo-box" id="combo"></div>
        <div class="fighter monster" id="monsterBox">
          <div class="monster-emoji ${G.lvl === 2 && !G.isBoss ? 'mega' : ''}" id="monster">${w.monster}</div>
          <div class="hpbar"><div id="hp"></div></div>
          <div class="mname">${w.name}</div>
        </div>
      </div>
      <div class="fire-banner" id="fireBanner">🔥 ¡MODO FUEGO! Puntos ×2 🔥</div>
      <div class="question-card" id="qcard">
        <div class="attack-banner hidden" id="attackBanner"></div>
        <div class="question" id="question">¿Listo?</div>
        <div class="timer ${isFinite(G.timeMax) ? '' : 'hidden'}"><div id="timerBar"></div></div>
        <div class="feedback" id="feedback"></div>
      </div>
      <div class="answers" id="answers"></div>
      <div class="powers" id="powers"></div>
      <div class="hint-layer hidden" id="hintLayer"></div>`;
    updateHUD();
    renderPowers();
  }

  function updateHUD() {
    if (!G) return;
    let h = '';
    for (let i = 0; i < 3; i++) h += `<span class="${i < G.hearts ? 'heart' : 'heart lost'}">${i < G.hearts ? '❤️' : '🤍'}</span>`;
    $('#hearts').innerHTML = h;
    $('#score').textContent = G.score;
    $('#gcoins').textContent = G.coins;
    $('#hp').style.width = `${(G.hp / G.maxHp) * 100}%`;
    $('#shieldBubble').classList.toggle('on', G.shield);
    const c = $('#combo');
    c.innerHTML = G.combo >= 2 ? `<span class="combo-num">${G.combo}</span><span class="combo-lbl">racha</span>` : '<span class="vs">VS</span>';
    c.classList.toggle('hot', G.combo >= 5);
    document.body.classList.toggle('fire', G.fire);
  }

  function renderPowers() {
    const box = $('#powers');
    if (!box) return;
    box.innerHTML = Object.entries(POWERS)
      .map(([id, p]) => {
        const unlocked = powerUnlocked(id);
        const n = S.powers[id] || 0;
        const disabled = !unlocked || n <= 0 || !G || G.locked || (id === 'shield' && G.shield) || (id === 'freeze' && G.frozen);
        return `<button class="power ${unlocked ? '' : 'locked'}" data-action="power" data-id="${id}" ${disabled ? 'disabled' : ''}
          title="${p.name}: ${p.desc}" aria-label="${p.name}">
          <span class="p-icon">${unlocked ? p.e : '🔒'}</span>
          <span class="p-name">${p.name}</span>
          ${unlocked ? `<span class="p-count">${n}</span>` : ''}
        </button>`;
      })
      .join('');
  }

  function updateIntensity() {
    if (!G) return;
    let lvl = G.combo >= 5 || G.fire ? 3 : G.combo >= 2 ? 2 : 1;
    if (G.isBoss || G.lvl === 2) lvl = Math.max(lvl, 2);
    Sound.setIntensity(lvl);
  }

  function nextQuestion() {
    if (!G || G.over) return;
    if (G.hp <= 0) return win();
    if (!G.queue.length) G.queue = makeQuestions(G.key, G.lvl);
    const q = G.queue.shift();
    q.answer = answerOf(q);
    q.options = makeOptions(q);
    G.q = q;
    G.frozen = false;
    G.timeLeft = G.timeMax;
    G.qStart = performance.now();
    G.last = performance.now();

    const qEl = $('#question');
    qEl.innerHTML = questionText(q);
    qEl.classList.remove('pop');
    void qEl.offsetWidth;
    qEl.classList.add('pop');
    $('#feedback').textContent = '';
    $('#feedback').className = 'feedback';
    $('#qcard').classList.remove('frozen', 'good', 'bad');
    $('#qcard').classList.toggle('attack', Boolean(q.intruder));

    const banner = $('#attackBanner');
    if (q.intruder) {
      banner.innerHTML = `⚠️ ¡Ataque sorpresa! Pregunta de la <b>tabla del ${q.a}</b>`;
      banner.classList.remove('hidden');
      Sound.fx.attack();
      const m = $('#monster');
      m.classList.remove('attacking');
      void m.offsetWidth;
      m.classList.add('attacking');
    } else {
      banner.classList.add('hidden');
    }

    $('#answers').innerHTML = q.options
      .map((v, i) => `<button class="answer c${i} beat-target ${q.type === 'which' ? 'expr' : ''}" data-action="answer" data-val="${v}" style="--i:${i}"><small>${i + 1}</small>${v}</button>`)
      .join('');
    G.locked = false;
    renderPowers();
    Sound.say(q.intruder ? `¡Ataque sorpresa! ${questionSpeech(q)}` : questionSpeech(q), 1.1);
  }

  function loop() {
    if (!G || G.over) return;
    const now = performance.now();
    const dt = (now - G.last) / 1000;
    G.last = now;
    if (!G.locked && !G.paused && !G.frozen && isFinite(G.timeMax)) {
      G.timeLeft -= dt;
      if (G.timeLeft <= 0) {
        G.timeLeft = 0;
        answer(null);
      }
    }
    const bar = $('#timerBar');
    if (bar && isFinite(G.timeMax)) {
      const f = Math.max(0, G.timeLeft / G.timeMax);
      bar.style.width = `${f * 100}%`;
      bar.className = f < 0.25 ? 'danger' : f < 0.5 ? 'warn' : '';
    }
    G.raf = requestAnimationFrame(loop);
  }

  function flyStar(fromEl, toEl, glyph = '⭐') {
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const s = document.createElement('div');
    s.className = 'projectile';
    s.textContent = glyph;
    document.body.appendChild(s);
    const x0 = a.left + a.width / 2;
    const y0 = a.top + a.height / 2;
    const x1 = b.left + b.width / 2;
    const y1 = b.top + b.height / 2;
    const anim = s.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(.6) rotate(0deg)` },
        { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 80}px) scale(1.4) rotate(200deg)`, offset: 0.5 },
        { transform: `translate(${x1}px, ${y1}px) scale(1) rotate(400deg)` },
      ],
      { duration: 420, easing: 'ease-in' }
    );
    anim.onfinish = () => s.remove();
    return anim;
  }

  function popText(el, text, cls = '') {
    const r = el.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = `pop-text ${cls}`;
    p.textContent = text;
    p.style.left = `${r.left + r.width / 2}px`;
    p.style.top = `${r.top}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }

  function answer(val, btn) {
    if (!G || G.locked || G.over) return;
    G.locked = true;
    const q = G.q;
    const ok = val !== null && String(val) === q.answer;
    const elapsed = (performance.now() - G.qStart) / 1000;
    $$('#answers .answer').forEach((b) => {
      b.disabled = true;
      if (b.dataset.val === q.answer) b.classList.add('right');
    });
    renderPowers();
    const fact = `${q.a} × ${q.b} = ${q.a * q.b}`;

    if (ok) {
      G.combo++;
      G.correct++;
      G.maxCombo = Math.max(G.maxCombo, G.combo);
      S.stats.correct++;
      S.stats.bestCombo = Math.max(S.stats.bestCombo, G.combo);
      if (q.intruder) S.stats.intruders++;
      const timeBonus = isFinite(G.timeMax) ? Math.round((G.timeLeft / G.timeMax) * 50) : 25;
      const pts = (100 + timeBonus + Math.min(G.combo, 10) * 10 + (q.intruder ? 50 : 0)) * (G.fire ? 2 : 1) * G.lvl;
      G.score += pts;
      G.coins += G.L.coinsPerHit * (G.fire ? 2 : 1);
      G.hp--;
      $('#qcard').classList.add('good');
      const fb = $('#feedback');
      fb.innerHTML = q.intruder ? '🛡️ ¡Ataque bloqueado!' : q.type === 'prod' ? pick(CHEERS) : `${pick(CHEERS)} <b>${fact}</b>`;
      fb.className = 'feedback good';
      Sound.fx.correct(G.combo);
      setTimeout(() => Sound.fx.coin(), 150);
      const player = $('#player');
      const monster = $('#monster');
      flyStar(player, monster, G.fire ? '🔥' : '⭐').finished.then(() => {
        if (!G) return;
        Sound.fx.hit();
        monster.classList.remove('hit', 'attacking');
        void monster.offsetWidth;
        monster.classList.add('hit');
        popText(monster, `+${pts}`, G.fire ? 'fire' : '');
        updateHUD();
      });
      if (elapsed < 2) awardTrophy('fast');
      if (G.combo >= 10) awardTrophy('combo10');
      checkGlobalTrophies();

      // Recompensas por racha
      if (G.combo % G.L.powerEvery === 0) grantRandomPower();
      if (G.combo === 8 && !G.fire) {
        G.fire = true;
        Sound.fx.fire();
        toast('🔥 ¡MODO FUEGO! Tus puntos valen doble', 'fire');
        confetti(60);
      }
      updateIntensity();
      updateHUD();
      setTimeout(nextQuestion, G.hp <= 0 ? 700 : 950);
    } else {
      if (btn) btn.classList.add('wrong');
      const fb = $('#feedback');
      $('#qcard').classList.add('bad');
      // la pregunta regresa más adelante para practicarla
      G.queue.splice(Math.min(2, G.queue.length), 0, { a: q.a, b: q.b, type: 'prod', swap: false });
      G.combo = 0;
      if (G.fire) {
        G.fire = false;
        toast('El fuego se apagó… ¡vuelve a encenderlo!');
      }
      if (G.shield) {
        G.shield = false;
        fb.innerHTML = `🛡️ ¡El escudo te protegió! <b>${fact}</b>`;
        fb.className = 'feedback shielded';
        Sound.fx.power();
      } else {
        G.hearts--;
        G.mistakes++;
        fb.innerHTML = `${val === null ? '⏰ ¡Se acabó el tiempo!' : pick(ENCOURAGE)} <b>${fact}</b>`;
        fb.className = 'feedback bad';
        Sound.fx.wrong();
        $('#monster').classList.add('laugh');
        setTimeout(() => $('#monster') && $('#monster').classList.remove('laugh'), 900);
        $('#screen-game').classList.add('shake');
        setTimeout(() => $('#screen-game').classList.remove('shake'), 400);
      }
      Sound.say(`${q.a} por ${q.b} es ${q.a * q.b}`, 1);
      updateIntensity();
      updateHUD();
      setTimeout(() => (G.hearts <= 0 ? lose() : nextQuestion()), 2200);
    }
    save();
  }

  function grantRandomPower() {
    const ids = Object.keys(POWERS).filter(powerUnlocked);
    const id = pick(ids);
    S.powers[id] = (S.powers[id] || 0) + 1;
    Sound.fx.power();
    toast(`${POWERS[id].e} ¡Racha de ${G.combo}! Ganaste <b>${POWERS[id].name}</b>`, 'power');
    renderPowers();
    save();
  }

  function usePower(id) {
    if (!G || G.locked || G.over || !powerUnlocked(id) || (S.powers[id] || 0) <= 0) return;
    const q = G.q;
    if (id === 'shield' && G.shield) return;
    if (id === 'freeze' && G.frozen) return;
    S.powers[id]--;
    S.stats.powersUsed++;
    Sound.fx.power();

    if (id === 'hint') {
      G.paused = true;
      const layer = $('#hintLayer');
      const skip = [];
      const big = Math.max(q.a, q.b);
      const small = Math.min(q.a, q.b);
      for (let i = 1; i <= small; i++) skip.push(big * i);
      layer.innerHTML = `
        <div class="hint-card">
          <h3>💡 Pista</h3>
          ${dotsHTML(small, big)}
          <p class="skip">${small === 1
            ? '¡Truco! Cualquier número por 1 es el mismo número.'
            : `Cuenta de ${big} en ${big}: <b>${skip.slice(0, -1).join(', ')}, …</b>`}</p>
          <button class="btn primary" data-action="closeHint">¡Ya entendí!</button>
        </div>`;
      layer.classList.remove('hidden');
    } else if (id === 'fifty') {
      const wrong = shuffle($$('#answers .answer').filter((b) => b.dataset.val !== q.answer && !b.disabled));
      wrong.slice(0, 2).forEach((b) => {
        b.disabled = true;
        b.classList.add('gone');
      });
    } else if (id === 'freeze') {
      G.frozen = true;
      $('#qcard').classList.add('frozen');
      toast('❄️ ¡Reloj congelado! Piensa con calma');
    } else if (id === 'shield') {
      G.shield = true;
      toast('🛡️ ¡Escudo activado!');
    }
    checkGlobalTrophies();
    updateHUD();
    renderPowers();
    save();
  }

  function closeHint() {
    if (!G) return;
    G.paused = false;
    G.last = performance.now();
    $('#hintLayer').classList.add('hidden');
  }

  function endGame() {
    if (!G) return;
    G.over = true;
    G.locked = true;
    cancelAnimationFrame(G.raf);
    document.body.classList.remove('fire');
  }

  function win() {
    const g = G;
    endGame();
    $('#monster').classList.add('defeated');
    Sound.fx.win();
    confetti(160);
    Sound.say('¡Ganaste!', 1);
    setTimeout(() => showResults(g, true), 1500);
  }

  function lose() {
    const g = G;
    endGame();
    Sound.fx.lose();
    setTimeout(() => showResults(g, false), 900);
  }

  // ================= Resultados =================
  function snapshotUnlocks() {
    return {
      avatars: AVATARS.filter(avatarUnlocked).map((a) => a.e),
      powers: Object.keys(POWERS).filter(powerUnlocked),
      items: Object.keys(ITEM_KINDS).flatMap((k) => ITEM_KINDS[k].list.filter((it) => isSpecial(it) && itemSpecialMet(it)).map((it) => `${k}:${it.id}`)),
      boss: isUnlocked('boss', 1),
      boss2: isUnlocked('boss', 2),
    };
  }

  function itemPreview(kind, it) {
    if (kind === 'aura') return `<span class="aura-chip aura-${it.id}"></span>`;
    return it.e;
  }

  function showResults(g, won) {
    const before = snapshotUnlocks();
    const { key, lvl, L } = g;
    const sMap = starsMap(lvl);
    const firstClear = won && !sMap[key];
    const stars = won ? (g.mistakes === 0 ? 3 : g.mistakes <= 2 ? 2 : 1) : 0;
    let bonus = 0;
    if (won) {
      bonus = stars * L.starBonus + (firstClear ? L.firstBonus : 0);
      sMap[key] = Math.max(sMap[key] || 0, stars);
      const best = lvl === 2 ? S.best2 : S.best;
      best[key] = Math.max(best[key] || 0, g.score);
      const stickers = lvl === 2 ? S.stickers2 : S.stickers;
      if (!stickers.includes(key)) stickers.push(key);
    }
    const coinsTotal = g.coins + bonus;
    S.coins += coinsTotal;

    // ¿Es la primera vez que se vence al jefe de este nivel? → final
    const isFinale = won && key === 'boss' && !S.finals.includes(lvl);
    if (isFinale) S.finals.push(lvl);

    const after = snapshotUnlocks();
    const news = [];
    const w = worldInfo(key, lvl);
    if (firstClear) news.push(`<div class="unlock">${w.sticker}<span>¡Sticker ${lvl === 2 ? '<b>dorado</b> ' : ''}nuevo para tu álbum!</span></div>`);
    after.powers
      .filter((p) => !before.powers.includes(p))
      .forEach((p) => {
        S.powers[p] = (S.powers[p] || 0) + 2;
        news.push(`<div class="unlock power">${POWERS[p].e}<span>¡Nuevo poder: <b>${POWERS[p].name}</b>! ${POWERS[p].desc}. Te regalamos 2.</span></div>`);
      });
    after.avatars
      .filter((a) => !before.avatars.includes(a))
      .forEach((a) => news.push(`<div class="unlock">${a}<span>¡Nuevo personaje desbloqueado!</span></div>`));
    after.items
      .filter((i) => !before.items.includes(i))
      .forEach((i) => {
        const [kind, id] = i.split(':');
        const it = itemById(kind, id);
        const label = { hat: 'Nuevo gorro', pet: 'Nueva mascota', aura: 'Nueva aura' }[kind];
        news.push(`<div class="unlock">${itemPreview(kind, it)}<span>¡${label}: <b>${it.name}</b>!</span></div>`);
      });
    if (after.boss && !before.boss) news.push('<div class="unlock boss">🐲<span>¡Se abrió el <b>Volcán Final</b>! El Dragón Olvidón te espera.</span></div>');
    if (after.boss2 && !before.boss2) news.push('<div class="unlock boss">🐉<span>¡Se abrió el <b>Volcán Eterno</b>! El Rey Dragón te espera.</span></div>');
    if (won && key !== 'boss' && key < 10 && firstClear) news.push(`<div class="unlock">🗺️<span>¡Desbloqueaste la <b>Tabla del ${key + 1}</b>!</span></div>`);

    if (won) {
      awardTrophy('first');
      if (g.mistakes === 0) awardTrophy('perfect');
      if (key === 'boss' && lvl === 1) awardTrophy('boss');
      if (isFinale) awardTrophy(lvl === 1 ? 'hero' : 'legend');
    }
    checkGlobalTrophies();
    save();
    G = null;

    if (isFinale) {
      showFinale(lvl, { score: g.score, stars, coins: coinsTotal });
      return;
    }

    const nextKey = key === 'boss' ? null : key < 10 ? key + 1 : isUnlocked('boss') ? 'boss' : null;
    $('#screen-results').innerHTML = `
      <div class="results ${won ? 'won' : 'lost'}">
        <div class="res-hero">${won ? avatarHTML('xl') : `<div class="big-monster float">${w.monster}</div>`}</div>
        <h2>${won ? '¡VICTORIA!' : '¡Uy! El monstruo escapó'}</h2>
        <p class="res-sub">${won
          ? `Venciste a <b>${w.name}</b>${lvl === 2 ? ' en el <b>Modo Leyenda</b>' : ''}`
          : `No pasa nada, ¡cada intento te hace más fuerte! Repasa la <b>${worldName(key).toLowerCase()}</b> y vuelve a intentarlo.`}</p>
        ${won ? `<div class="big-stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : 'off'}" style="--i:${i}">★</span>`).join('')}</div>` : ''}
        <div class="res-stats">
          <div><span>Puntos</span><b>${g.score}</b></div>
          <div><span>Aciertos</span><b>${g.correct}</b></div>
          <div><span>Mejor racha</span><b>${g.maxCombo}</b></div>
          <div class="coins"><span>Monedas</span><b>+${coinsTotal} 🪙</b></div>
        </div>
        ${news.length ? `<div class="unlocks"><h3>🎁 ¡Recompensas!</h3>${news.join('')}</div>` : ''}
        <div class="btn-col">
          ${won && nextKey ? `<button class="btn big primary" data-action="open" data-key="${nextKey}">➡ Siguiente: ${worldName(nextKey)}</button>` : ''}
          ${!won ? `<button class="btn big primary" data-action="open" data-key="${key}">📖 Repasar y reintentar</button>` : ''}
          <div class="btn-row">
            <button class="btn secondary" data-action="play" data-key="${key}">🔁 Jugar otra vez</button>
            <button class="btn secondary" data-action="map">🗺️ Mapa</button>
          </div>
        </div>
      </div>`;
    show('results');
    Sound.setIntensity(won ? 2 : 0);
    if (won) {
      $$('.big-stars .on').forEach((el, i) => setTimeout(() => Sound.fx.star(i), 350 + i * 300));
      if (news.length) setTimeout(() => Sound.fx.unlock(), 1400);
    }
  }

  // ================= Finales =================
  const finaleTimers = [];
  function clearFinaleTimers() {
    while (finaleTimers.length) clearTimeout(finaleTimers.pop());
  }
  const later = (ms, fn) => finaleTimers.push(setTimeout(fn, ms));

  const FINALES = {
    1: {
      theme: 'finale-1',
      villain: '🐲',
      friend: '🐲',
      story: [
        '¡El Dragón Olvidón ha sido vencido!',
        'Con cada multiplicación, el dragón fue recordando todo lo que había olvidado…',
        '…¡y ahora es tu amigo! 💖',
        'Los diez mundos están a salvo gracias a ti.',
      ],
      headline: '¡FELICIDADES!',
      title: 'Eres un HÉROE DE LAS TABLAS',
      voice: '¡Felicidades! ¡Eres un Héroe de las Tablas! Dominaste las tablas del uno al diez.',
      rewards: [
        ['🦸', 'Nuevo personaje: <b>Súper Héroe</b>'],
        ['🐲', 'Mascota: <b>Dragón amigo</b>'],
        ['<span class="aura-chip aura-rainbow"></span>', 'Aura: <b>Arcoíris</b>'],
        ['🏅', 'Gorro: <b>Medalla de héroe</b>'],
        ['📜', 'Tu <b>diploma</b> de Héroe de las Tablas'],
        ['🌋', '¡Se abrió el <b>NIVEL 2 · Modo Leyenda</b>! Menos tiempo, ataques sorpresa y premios dobles.'],
      ],
    },
    2: {
      theme: 'finale-2',
      villain: '🐉',
      friend: '🐉',
      story: [
        '¡El Rey Dragón Olvidón se inclina ante ti!',
        'Resististe los ataques sorpresa, el reloj veloz y las preguntas más difíciles.',
        'Ya no hay multiplicación del 1 al 10 que te pueda vencer.',
        'Tu nombre brillará para siempre en el Salón de las Leyendas. ✨',
      ],
      headline: '¡ERES UNA LEYENDA!',
      title: 'LEYENDA DE LAS TABLAS',
      voice: '¡Increíble! ¡Eres una Leyenda de las Tablas! Terminaste el juego completo.',
      rewards: [
        ['🧙', 'Nuevo personaje: <b>Gran Mago</b>'],
        ['🐉', 'Mascota: <b>Dragón dorado</b>'],
        ['<span class="aura-chip aura-gold"></span>', 'Aura: <b>Dorada</b>'],
        ['🌟', 'Gorro: <b>Estrella legendaria</b>'],
        ['📜', 'Tu <b>diploma dorado</b> de Leyenda'],
      ],
    },
  };

  function showFinale(lvl, res) {
    clearFinaleTimers();
    const F = FINALES[lvl];
    const complete = lvl === 2;
    $('#screen-results').innerHTML = `
      <div class="finale ${F.theme}">
        <div class="finale-story" id="finaleStory">
          <div class="finale-dragon" id="finaleDragon">${F.villain}</div>
          ${F.story.map((l, i) => `<p class="story-line" id="story-${i}">${l}</p>`).join('')}
        </div>
        <div class="finale-reveal hidden" id="finaleReveal">
          <div class="finale-rays"></div>
          <div class="finale-trophy">${lvl === 2 ? '👑' : '🏆'}</div>
          <h2 class="finale-headline">${F.headline}</h2>
          <div class="finale-hero">${avatarHTML('xl')}<span class="finale-friend">${F.friend}</span></div>
          <p class="finale-title">${F.title}</p>
          ${complete ? `
          <div class="complete-box">
            <div class="complete-pct">100%</div>
            <p>🎮 ¡Terminaste <b>Héroes de las Tablas</b>!</p>
            <div class="res-stats">
              <div><span>Estrellas</span><b>${totalStarsAll()}/66</b></div>
              <div><span>Aciertos totales</span><b>${S.stats.correct}</b></div>
              <div><span>Mejor racha</span><b>${S.stats.bestCombo}</b></div>
              <div><span>Trofeos</span><b>${S.trophies.length}/${TROPHIES.length}</b></div>
            </div>
            <p class="small">Puedes seguir jugando para conseguir las 66 estrellas y todos los trofeos.</p>
          </div>` : ''}
          <div class="unlocks">
            <h3>🎁 ¡Premios de ${complete ? 'leyenda' : 'héroe'}!</h3>
            ${F.rewards.map(([ic, txt], i) => `<div class="unlock" style="animation-delay:${0.6 + i * 0.35}s">${ic}<span>${txt}</span></div>`).join('')}
            <div class="unlock" style="animation-delay:${0.6 + F.rewards.length * 0.35}s">🪙<span>+${res.coins} monedas</span></div>
          </div>
          <div class="btn-col">
            <button class="btn big primary" data-action="diploma" data-lvl="${lvl}">📜 Ver mi diploma</button>
            <div class="btn-row">
              ${lvl === 1 ? '<button class="btn secondary" data-action="goLevel2">🌋 ¡Ir al Nivel 2!</button>' : ''}
              <button class="btn secondary" data-action="treasure">🎨 Personalizar</button>
              <button class="btn secondary" data-action="home">🏠 Inicio</button>
            </div>
          </div>
        </div>
        <button class="skip-btn" id="skipFinale" data-action="skipFinale">Saltar ⏩</button>
      </div>`;
    show('results');
    Sound.setIntensity(1);

    // Historia: una línea cada ~2.4 s
    F.story.forEach((_, i) =>
      later(400 + i * 2400, () => {
        const el = $(`#story-${i}`);
        if (el) el.classList.add('show');
        Sound.say(F.story[i].replace(/[💖✨]/g, ''), 1.05);
        Sound.fx.star(i);
        if (i === 2) {
          const d = $('#finaleDragon');
          if (d) d.classList.add('friendly');
          Sound.fx.unlock();
        }
      })
    );
    later(400 + F.story.length * 2400, () => revealFinale(lvl));
  }

  function revealFinale(lvl) {
    clearFinaleTimers();
    const F = FINALES[lvl];
    const story = $('#finaleStory');
    const reveal = $('#finaleReveal');
    if (!story || !reveal) return;
    story.classList.add('hidden');
    $('#skipFinale').classList.add('hidden');
    reveal.classList.remove('hidden');
    Sound.setIntensity(3);
    Sound.fx.fanfare();
    confetti(220);
    later(1200, () => confetti(140));
    later(2600, () => confetti(180));
    later(4200, () => confetti(120));
    later(1800, () => Sound.say(F.voice, 1));
  }

  // ---- Diplomas ----
  function diplomaHTML(lvl) {
    const date = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    const name = S.name.trim() || 'Héroe sin nombre';
    return `
      <div class="diploma d${lvl}" id="diploma">
        <div class="dip-corner tl">★</div><div class="dip-corner tr">★</div><div class="dip-corner bl">★</div><div class="dip-corner br">★</div>
        <div class="dip-top">${lvl === 2 ? '👑 DIPLOMA DE LEYENDA 👑' : '🏆 DIPLOMA DE HÉROE 🏆'}</div>
        <p>Este diploma se entrega con mucho orgullo a</p>
        <h2 class="dip-name" id="dipName">${esc(name)}</h2>
        <div class="dip-avatar">${avatarHTML('lg')}</div>
        <p>${lvl === 2
          ? 'por dominar las tablas de multiplicar del 1 al 10 en el <b>Modo Leyenda</b> y vencer al <b>Rey Dragón Olvidón</b>.'
          : 'por aprender las tablas de multiplicar del 1 al 10 y vencer al <b>Dragón Olvidón</b>.'}</p>
        <div class="dip-title">${TITLES[lvl].e} ${TITLES[lvl].name}</div>
        <div class="dip-foot"><span>⭐ ${totalStars(lvl)} / 33 estrellas</span><span>${date}</span></div>
      </div>`;
  }

  function openDiploma(lvl) {
    openModal(`
      <label class="name-field">✏️ Escribe tu nombre:
        <input id="nameInput" type="text" maxlength="24" autocomplete="off" value="${esc(S.name)}" placeholder="Tu nombre">
      </label>
      ${diplomaHTML(lvl)}
      <div class="btn-row no-print">
        <button class="btn secondary" data-action="print">🖨️ Imprimir</button>
        <button class="btn primary" data-action="closeModal">¡Listo!</button>
      </div>`, 'wide');
  }

  function openDiplomas() {
    if (S.finals.length === 1) return openDiploma(S.finals[0]);
    openModal(`
      <h3>📜 Mis diplomas</h3>
      <div class="btn-col">
        <button class="btn big secondary" data-action="diploma" data-lvl="1">🏆 Héroe de las Tablas</button>
        <button class="btn big primary" data-action="diploma" data-lvl="2">👑 Leyenda de las Tablas</button>
      </div>
      <div class="btn-row"><button class="btn secondary" data-action="closeModal">Cerrar</button></div>`);
  }

  function quitGame() {
    if (!G) return show('map');
    G.paused = true;
    openModal(`
      <h3>¿Salir de la batalla?</h3>
      <p>Perderás el progreso de este nivel.</p>
      <div class="btn-row">
        <button class="btn secondary" data-action="resume">Seguir jugando</button>
        <button class="btn danger" data-action="confirmQuit">Salir</button>
      </div>`);
  }

  // ================= Tesoros y tienda =================
  let treasureTab = 'avatars';

  function itemsTabHTML(kind, intro) {
    const K = ITEM_KINDS[kind];
    const selected = S[kind];
    return `<p class="hint-text">${intro}</p><div class="grid">${K.list.map((it) => {
      const owned = ownsItem(kind, it);
      const special = isSpecial(it);
      const locked = special && !owned;
      const icon = kind === 'aura' ? `<span class="aura-chip aura-${it.id}"></span>` : it.e || '🙂';
      let label;
      if (owned) label = selected === it.id ? 'Puesto' : 'Usar';
      else if (special) label = `🔒 ${specialHint(it)}`;
      else label = `🪙 ${it.price}`;
      return `<button class="card ${selected === it.id ? 'selected' : ''} ${locked ? 'locked' : ''} ${special ? 'special' : ''}"
        data-action="item" data-kind="${kind}" data-id="${it.id}" ${locked ? 'disabled' : ''}>
        <span class="card-icon">${locked ? '🎁' : icon}</span><span class="card-name">${it.name}</span>
        <span class="card-price">${label}</span></button>`;
    }).join('')}</div>`;
  }

  function stickerGrid(lvl) {
    const list = lvl === 2 ? S.stickers2 : S.stickers;
    return `<div class="grid">${[...TABLES, 'boss'].map((k) => {
      const has = list.includes(k);
      const w = worldInfo(k, lvl);
      return `<div class="card sticker ${has ? '' : 'locked'} ${lvl === 2 && has ? 'gold' : ''}">
        <span class="card-icon">${has ? w.sticker : '❔'}</span><span class="card-name">${k === 'boss' ? 'Jefe' : `Tabla ${k}`}</span>
        <span class="card-stars">${starsHTML(starsOf(k, lvl))}</span></div>`;
    }).join('')}</div>`;
  }

  function renderTreasure() {
    const tabs = [
      ['avatars', '🐾 Personajes'],
      ['hats', '🎩 Gorros'],
      ['pets', '🐣 Mascotas'],
      ['auras', '✨ Auras'],
      ['powers', '⚡ Poderes'],
      ['stickers', '📒 Álbum'],
      ['trophies', '🏆 Trofeos'],
    ];
    let body = '';
    if (treasureTab === 'avatars') {
      body = `<p class="hint-text">Gana estrellas ⭐ (de los dos niveles) para desbloquear nuevos héroes. ¡Algunos solo aparecen al terminar un nivel!</p><div class="grid">${AVATARS.map((a) => {
        const ok = avatarUnlocked(a);
        const req = a.final ? `🔒 Termina el Nivel ${a.final}` : `⭐ ${a.need}`;
        return `<button class="card ${ok ? '' : 'locked'} ${a.final ? 'special' : ''} ${S.avatar === a.e ? 'selected' : ''}" data-action="avatar" data-e="${a.e}" ${ok ? '' : 'disabled'}>
          <span class="card-icon">${ok ? a.e : a.final ? '🎁' : '🔒'}</span><span class="card-name">${ok ? a.name : req}</span></button>`;
      }).join('')}</div>`;
    } else if (treasureTab === 'hats') {
      body = itemsTabHTML('hat', 'Compra gorros con tus monedas 🪙 y ponle estilo a tu héroe.');
    } else if (treasureTab === 'pets') {
      body = itemsTabHTML('pet', 'Una mascota te acompaña en todas tus batallas.');
    } else if (treasureTab === 'auras') {
      body = itemsTabHTML('aura', 'Las auras hacen brillar a tu héroe. ¡Las más especiales se ganan terminando niveles!');
    } else if (treasureTab === 'powers') {
      body = `<p class="hint-text">Los poderes te ayudan en las batallas. ¡También los ganas con rachas de aciertos!</p><div class="list">${Object.entries(POWERS).map(([id, p]) => {
        const ok = powerUnlocked(id);
        return `<div class="list-item ${ok ? '' : 'locked'}">
          <span class="li-icon">${ok ? p.e : '🔒'}</span>
          <div class="li-text"><b>${p.name}</b> <span class="li-count">× ${S.powers[id] || 0}</span><br><small>${ok ? p.desc : `Se desbloquea al completar ${p.unlock} tablas`}</small></div>
          <button class="btn small primary" data-action="buyPower" data-id="${id}" ${ok ? '' : 'disabled'}>🪙 ${p.price}</button>
        </div>`;
      }).join('')}</div>`;
    } else if (treasureTab === 'stickers') {
      body = `<p class="hint-text">Gana un sticker por cada monstruo que venzas.</p>
        <h3 class="album-title">🌞 Nivel 1</h3>${stickerGrid(1)}
        <h3 class="album-title">🌋 Nivel 2 · Stickers dorados</h3>${level2Open() ? stickerGrid(2) : '<p class="hint-text">🔒 Vence al Dragón Olvidón para abrir el Nivel 2.</p>'}`;
    } else {
      body = `${S.finals.length ? '<div class="btn-row" style="margin:0 0 12px"><button class="btn primary" data-action="diplomas">📜 Ver mis diplomas</button></div>' : ''}
        <div class="list">${TROPHIES.map((t) => {
          const has = S.trophies.includes(t.id);
          return `<div class="list-item ${has ? 'gold' : 'locked'}"><span class="li-icon">${has ? t.e : '🔒'}</span>
            <div class="li-text"><b>${t.name}</b><br><small>${t.desc}</small></div>${has ? '<span class="check">✔</span>' : ''}</div>`;
        }).join('')}</div>`;
    }

    $('#screen-treasure').innerHTML = `
      <div class="topbar">
        <button class="icon-btn" data-action="back" aria-label="Volver">⬅</button>
        <div class="pill coins">🪙 <b>${S.coins}</b></div>
        <div class="pill">⭐ <b>${totalStarsAll()}</b></div>
      </div>
      <h2 class="screen-title">Tesoros y tienda</h2>
      <div class="treasure-hero">${avatarHTML('lg')}${titleHTML()}</div>
      <div class="tabs">${tabs.map(([id, label]) => `<button class="tab ${treasureTab === id ? 'active' : ''}" data-action="tab" data-id="${id}">${label}</button>`).join('')}</div>
      <div class="tab-body">${body}</div>`;
  }

  let treasureFrom = 'home';
  function openTreasure() {
    clearFinaleTimers();
    closeModal();
    treasureFrom = current === 'map' ? 'map' : 'home';
    renderTreasure();
    show('treasure');
    Sound.setIntensity(0);
  }

  function buy(price) {
    if (S.coins < price) {
      Sound.fx.wrong();
      toast('🪙 ¡Te faltan monedas! Juega más batallas para ganar.');
      return false;
    }
    S.coins -= price;
    Sound.fx.coin();
    return true;
  }

  // ================= Ajustes =================
  function openSettings() {
    const st = S.settings;
    const toggle = (id, label, on) =>
      `<button class="toggle ${on ? 'on' : ''}" data-action="toggle" data-id="${id}"><span>${label}</span><i></i></button>`;
    openModal(`
      <h3>⚙️ Ajustes</h3>
      ${toggle('music', '🎵 Música', st.music)}
      ${toggle('sfx', '🔔 Efectos de sonido', st.sfx)}
      ${toggle('voice', '🗣️ Voz que lee las preguntas', st.voice)}
      <p class="label">⏱️ Tiempo para responder</p>
      <div class="seg">
        ${[['relax', '🐢 Sin prisa'], ['normal', '🐇 Normal'], ['fast', '🚀 Rápido']]
          .map(([id, l]) => `<button class="${st.speed === id ? 'active' : ''}" data-action="speed" data-id="${id}">${l}</button>`)
          .join('')}
      </div>
      <p class="small">En el Nivel 2 el tiempo siempre es más corto.</p>
      <div class="btn-row">
        <button class="btn danger small" data-action="reset">Borrar progreso</button>
        <button class="btn primary" data-action="closeModal">Listo</button>
      </div>`);
  }

  function applySettings() {
    Sound.setMusic(S.settings.music);
    Sound.setSfx(S.settings.sfx);
    Sound.setVoice(S.settings.voice);
  }

  // ================= Confeti =================
  const cv = $('#confetti');
  const cx = cv.getContext('2d');
  let parts = [];
  let confettiRunning = false;
  function resize() {
    cv.width = window.innerWidth * devicePixelRatio;
    cv.height = window.innerHeight * devicePixelRatio;
  }
  window.addEventListener('resize', resize);
  resize();

  function confetti(n = 120) {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3', '#a55eea', '#fff'];
    for (let i = 0; i < n; i++) {
      parts.push({
        x: cv.width / 2 + (Math.random() - 0.5) * cv.width * 0.3,
        y: cv.height * 0.45,
        vx: (Math.random() - 0.5) * 22 * devicePixelRatio,
        vy: (-Math.random() * 20 - 6) * devicePixelRatio,
        s: (6 + Math.random() * 8) * devicePixelRatio,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: pick(colors),
        life: 120 + rand(60),
      });
    }
    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(drawConfetti);
    }
  }

  function drawConfetti() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life > 0 && p.y < cv.height + 40);
    for (const p of parts) {
      p.vy += 0.6 * devicePixelRatio;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.life--;
      cx.save();
      cx.translate(p.x, p.y);
      cx.rotate(p.r);
      cx.fillStyle = p.c;
      cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      cx.restore();
    }
    if (parts.length) requestAnimationFrame(drawConfetti);
    else {
      confettiRunning = false;
      cx.clearRect(0, 0, cv.width, cv.height);
    }
  }

  // ================= Pulso al ritmo =================
  Sound.onBeat((beat) => {
    document.body.classList.add('beat');
    if (beat === 0) document.body.classList.add('downbeat');
    setTimeout(() => document.body.classList.remove('beat', 'downbeat'), 120);
  });

  // ================= Eventos =================
  function goHome() {
    clearFinaleTimers();
    closeModal();
    renderHome();
    show('home');
    Sound.setIntensity(0);
  }
  function goMap() {
    clearFinaleTimers();
    stopSing();
    renderMap();
    show('map');
    Sound.setIntensity(0);
  }
  function setLevel(lvl) {
    S.level = lvl;
    save();
    applyLevelTheme();
  }

  const actions = {
    home: goHome,
    map: goMap,
    treasure: openTreasure,
    back: () => (treasureFrom === 'map' ? goMap() : goHome()),
    settings: openSettings,
    closeModal,
    level: (el) => {
      const lvl = Number(el.dataset.lvl);
      if (lvl === 2 && !level2Open()) {
        Sound.fx.wrong();
        toast('🔒 Vence al Dragón Olvidón del Nivel 1 para abrir el Modo Leyenda');
        return;
      }
      setLevel(lvl);
      goMap();
      if (lvl === 2) toast('🌋 ¡Modo Leyenda! Menos tiempo, ataques sorpresa y premios dobles', 'fire');
    },
    goLevel2: () => {
      setLevel(2);
      goMap();
      toast('🌋 ¡Bienvenido al Modo Leyenda!', 'fire');
    },
    open: (el) => {
      closeModal();
      const key = el.dataset.key === 'boss' ? 'boss' : Number(el.dataset.key);
      if (!isUnlocked(key)) {
        Sound.fx.wrong();
        toast(key === 'boss' ? '🔒 Completa las 10 tablas para enfrentar al dragón' : `🔒 Primero vence la tabla del ${key - 1}`);
        return;
      }
      renderStudy(key);
    },
    play: (el) => startGame(el.dataset.key === 'boss' ? 'boss' : Number(el.dataset.key)),
    sing: (el) => startSing(Number(el.dataset.key)),
    dots: (el) => {
      showDots(Number(el.dataset.a), Number(el.dataset.b));
      Sound.say(`${el.dataset.a} por ${el.dataset.b}, ${el.dataset.a * el.dataset.b}`);
    },
    answer: (el) => answer(el.dataset.val, el),
    power: (el) => usePower(el.dataset.id),
    closeHint,
    quit: quitGame,
    resume: () => {
      closeModal();
      if (G) {
        G.paused = false;
        G.last = performance.now();
      }
    },
    confirmQuit: () => {
      closeModal();
      endGame();
      G = null;
      goMap();
    },
    skipFinale: () => {
      const lvl = S.finals[S.finals.length - 1];
      Sound.say('', 1);
      revealFinale(lvl);
    },
    diploma: (el) => openDiploma(Number(el.dataset.lvl)),
    diplomas: openDiplomas,
    print: () => window.print(),
    tab: (el) => {
      treasureTab = el.dataset.id;
      renderTreasure();
    },
    avatar: (el) => {
      S.avatar = el.dataset.e;
      save();
      renderTreasure();
      Sound.fx.unlock();
    },
    item: (el) => {
      const kind = el.dataset.kind;
      const it = itemById(kind, el.dataset.id);
      if (!ownsItem(kind, it)) {
        if (isSpecial(it) || !buy(it.price)) return;
        S[ITEM_KINDS[kind].owned].push(it.id);
        toast(`${kind === 'aura' ? '✨' : it.e} ¡Conseguiste ${it.name}!`, 'gold');
      } else {
        Sound.fx.unlock();
      }
      S[kind] = it.id;
      save();
      renderTreasure();
    },
    buyPower: (el) => {
      const id = el.dataset.id;
      if (!powerUnlocked(id) || !buy(POWERS[id].price)) return;
      S.powers[id] = (S.powers[id] || 0) + 1;
      toast(`${POWERS[id].e} +1 ${POWERS[id].name}`, 'power');
      save();
      renderTreasure();
    },
    toggle: (el) => {
      const id = el.dataset.id;
      S.settings[id] = !S.settings[id];
      applySettings();
      save();
      el.classList.toggle('on', S.settings[id]);
    },
    speed: (el) => {
      S.settings.speed = el.dataset.id;
      save();
      $$('.seg button').forEach((b) => b.classList.toggle('active', b === el));
    },
    reset: () => {
      openModal(`
        <h3>¿Borrar todo el progreso?</h3>
        <p>Se perderán estrellas, monedas, stickers, trofeos y diplomas.</p>
        <div class="btn-row">
          <button class="btn secondary" data-action="settings">Cancelar</button>
          <button class="btn danger" data-action="confirmReset">Sí, borrar</button>
        </div>`);
    },
    confirmReset: () => {
      S = clone(DEFAULT_SAVE);
      save();
      applySettings();
      applyLevelTheme();
      closeModal();
      goHome();
    },
  };

  document.addEventListener('click', (e) => {
    // El navegador solo permite audio después de una interacción
    Sound.start();
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = actions[el.dataset.action];
    if (!fn) return;
    if (!['answer', 'power'].includes(el.dataset.action)) Sound.fx.click();
    fn(el);
  });

  document.addEventListener('input', (e) => {
    if (e.target.id !== 'nameInput') return;
    S.name = e.target.value.slice(0, 24);
    save();
    const n = $('#dipName');
    if (n) n.textContent = S.name.trim() || 'Héroe sin nombre';
  });

  document.addEventListener('keydown', (e) => {
    if (current !== 'game' || !G || G.locked || e.target.tagName === 'INPUT') return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      const btn = $$('#answers .answer')[n - 1];
      if (btn && !btn.disabled) answer(btn.dataset.val, btn);
    }
  });

  $('#modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
      if (G && !G.over) actions.resume();
      else closeModal();
    }
  });

  // ================= Arranque =================
  applySettings();
  applyLevelTheme();
  goHome();
})();
