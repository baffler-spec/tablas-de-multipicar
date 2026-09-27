/* Héroes de las Tablas — lógica principal */
(() => {
  'use strict';

  const { WORLDS, AVATARS, HATS, POWERS, TROPHIES, CHEERS, ENCOURAGE, DEFAULT_SAVE } = DATA;
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
  const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const SPEEDS = { relax: Infinity, normal: 15, fast: 8 };

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
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return merge(clone(DEFAULT_SAVE), JSON.parse(raw));
    } catch (e) {
      /* almacenamiento no disponible */
    }
    return clone(DEFAULT_SAVE);
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
  const starsOf = (key) => S.stars[key] || 0;
  const totalStars = () => Object.values(S.stars).reduce((a, b) => a + b, 0);
  const tablesDone = () => TABLES.filter((t) => starsOf(t) > 0).length;
  const isUnlocked = (key) => (key === 'boss' ? tablesDone() === 10 : key === 1 || starsOf(key - 1) > 0);
  const powerUnlocked = (id) => tablesDone() >= POWERS[id].unlock;
  const avatarUnlocked = (a) => totalStars() >= a.need;
  const hatEmoji = () => (HATS.find((h) => h.id === S.hat) || HATS[0]).e;
  const worldName = (key) => (key === 'boss' ? 'Jefe final' : `Tabla del ${key}`);

  function avatarHTML(size = '') {
    const hat = hatEmoji();
    return `<div class="avatar ${size}"><span class="avatar-face">${S.avatar}</span>${hat ? `<span class="avatar-hat">${hat}</span>` : ''}</div>`;
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
    if (tablesDone() >= 5) awardTrophy('half');
    if (tablesDone() >= 10) awardTrophy('all');
    if (totalStars() >= 30) awardTrophy('stars30');
    if (S.coins >= 300) awardTrophy('rich');
    if (S.stats.powersUsed >= 10) awardTrophy('wizard');
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

  function openModal(html) {
    $('#modal-card').innerHTML = html;
    $('#modal').classList.remove('hidden');
  }
  function closeModal() {
    $('#modal').classList.add('hidden');
  }

  // ================= Inicio =================
  function renderHome() {
    $('#screen-home').innerHTML = `
      <div class="topbar">
        <button class="icon-btn" data-action="settings" aria-label="Ajustes">⚙️</button>
        <div class="pill coins">🪙 <b>${S.coins}</b></div>
        <div class="pill">⭐ <b>${totalStars()}</b></div>
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
        <p class="tagline">¡Vence a los monstruos con el poder de multiplicar! 🎵</p>
        <button class="btn big primary beat-target" data-action="map">▶ ¡JUGAR!</button>
        <div class="btn-row">
          <button class="btn secondary" data-action="treasure">🎁 Tesoros y tienda</button>
        </div>
        <p class="progress-note">Tablas completadas: <b>${tablesDone()} / 10</b></p>
      </div>`;
  }

  // ================= Mapa =================
  function renderMap() {
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
      <h2 class="screen-title">Mapa de aventuras</h2>
      <div class="map" style="height:${height}px">
        <svg class="map-path" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">
          <path d="${path}" />
        </svg>
        ${pts
          .map((p) => {
            const w = WORLDS[p.k];
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
    const w = WORLDS[key];
    const isBoss = key === 'boss';
    const rows = isBoss
      ? ''
      : TABLES.map(
          (b) => `
        <button class="row" data-action="dots" data-a="${key}" data-b="${b}" id="row-${b}">
          <span class="eq">${key} × ${b}</span><span class="eq-eq">=</span><span class="res">${key * b}</span>
        </button>`
        ).join('');

    $('#screen-study').innerHTML = `
      <div class="topbar">
        <button class="icon-btn" data-action="map" aria-label="Volver al mapa">⬅</button>
        <div class="pill">${worldName(key)}</div>
        <div class="pill">${starsHTML(starsOf(key))}</div>
      </div>
      <div class="study w-${key}">
        <div class="study-head">
          <div class="big-monster float">${w.monster}</div>
          <div>
            <h2>${w.place}</h2>
            <p>${isBoss
              ? '¡El <b>Dragón Olvidón</b> mezcla todas las tablas! Demuestra todo lo que aprendiste.'
              : `¡<b>${w.name}</b> te reta! Repasa la tabla, cántala con el ritmo y luego ¡a la batalla!`}</p>
          </div>
        </div>
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

  // ================= Juego =================
  let G = null;

  function makeQuestions(key) {
    if (key === 'boss') {
      const all = [];
      for (let a = 2; a <= 10; a++) for (let b = 2; b <= 10; b++) all.push({ a, b });
      return shuffle(all).slice(0, 15).map((q) => ({ ...q, type: Math.random() < 0.25 ? 'missing' : 'prod', swap: Math.random() < 0.5 }));
    }
    const allowMissing = starsOf(key) >= 2;
    return shuffle(TABLES).map((b) => ({
      a: key,
      b,
      type: allowMissing && Math.random() < 0.25 ? 'missing' : 'prod',
      swap: starsOf(key) >= 1 && Math.random() < 0.4,
    }));
  }

  function makeOptions(q) {
    const ans = q.answer;
    const cand = new Set();
    if (q.type === 'prod') {
      const { a, b } = q;
      [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, ans + 1, ans - 1, ans + 2, ans + 10, ans - 10].forEach((v) => cand.add(v));
    } else {
      [ans + 1, ans - 1, ans + 2, ans - 2, rand(10) + 1, rand(10) + 1].forEach((v) => cand.add(v));
    }
    const pool = shuffle([...cand].filter((v) => v > 0 && v !== ans && (q.type === 'prod' || v <= 10)));
    while (pool.length < 3) {
      const v = q.type === 'prod' ? ans + rand(20) + 1 : rand(10) + 1;
      if (v !== ans && !pool.includes(v)) pool.push(v);
    }
    return shuffle([ans, ...pool.slice(0, 3)]);
  }

  function startGame(key) {
    stopSing();
    closeModal();
    const queue = makeQuestions(key);
    const hp = queue.length;
    G = {
      key,
      isBoss: key === 'boss',
      queue,
      hp,
      maxHp: hp,
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
      timeMax: SPEEDS[S.settings.speed] || 15,
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
    const w = WORLDS[G.key];
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
          <div class="monster-emoji" id="monster">${w.monster}</div>
          <div class="hpbar"><div id="hp"></div></div>
          <div class="mname">${w.name}</div>
        </div>
      </div>
      <div class="fire-banner" id="fireBanner">🔥 ¡MODO FUEGO! Puntos ×2 🔥</div>
      <div class="question-card" id="qcard">
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
    if (G.isBoss) lvl = Math.max(lvl, 2);
    Sound.setIntensity(lvl);
  }

  function questionText(q) {
    if (q.type === 'missing') return `${q.a} × <span class="qmark">?</span> = ${q.a * q.b}`;
    const [x, y] = q.swap ? [q.b, q.a] : [q.a, q.b];
    return `${x} × ${y} = <span class="qmark">?</span>`;
  }

  function questionSpeech(q) {
    if (q.type === 'missing') return `${q.a} por cuánto es ${q.a * q.b}`;
    const [x, y] = q.swap ? [q.b, q.a] : [q.a, q.b];
    return `${x} por ${y}`;
  }

  function nextQuestion() {
    if (!G || G.over) return;
    if (G.hp <= 0) return win();
    if (!G.queue.length) G.queue = makeQuestions(G.key);
    const q = G.queue.shift();
    q.answer = q.type === 'missing' ? q.b : q.a * q.b;
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

    $('#answers').innerHTML = q.options
      .map((v, i) => `<button class="answer c${i} beat-target" data-action="answer" data-val="${v}" style="--i:${i}"><small>${i + 1}</small>${v}</button>`)
      .join('');
    G.locked = false;
    renderPowers();
    Sound.say(questionSpeech(q), 1.1);
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
    const ok = val === q.answer;
    const elapsed = (performance.now() - G.qStart) / 1000;
    $$('#answers .answer').forEach((b) => {
      b.disabled = true;
      if (Number(b.dataset.val) === q.answer) b.classList.add('right');
    });
    renderPowers();

    if (ok) {
      G.combo++;
      G.correct++;
      G.maxCombo = Math.max(G.maxCombo, G.combo);
      S.stats.correct++;
      S.stats.bestCombo = Math.max(S.stats.bestCombo, G.combo);
      const timeBonus = isFinite(G.timeMax) ? Math.round((G.timeLeft / G.timeMax) * 50) : 25;
      const pts = (100 + timeBonus + Math.min(G.combo, 10) * 10) * (G.fire ? 2 : 1);
      G.score += pts;
      G.coins += G.fire ? 4 : 2;
      G.hp--;
      $('#qcard').classList.add('good');
      const fb = $('#feedback');
      fb.textContent = pick(CHEERS);
      fb.className = 'feedback good';
      Sound.fx.correct(G.combo);
      setTimeout(() => Sound.fx.coin(), 150);
      const player = $('#player');
      const monster = $('#monster');
      flyStar(player, monster, G.fire ? '🔥' : '⭐').finished.then(() => {
        if (!G) return;
        Sound.fx.hit();
        monster.classList.remove('hit');
        void monster.offsetWidth;
        monster.classList.add('hit');
        popText(monster, `+${pts}`, G.fire ? 'fire' : '');
        updateHUD();
      });
      if (elapsed < 2) awardTrophy('fast');
      if (G.combo >= 10) awardTrophy('combo10');

      // Recompensas por racha
      if (G.combo % 5 === 0) grantRandomPower();
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
      const fact = `${q.a} × ${q.b} = ${q.a * q.b}`;
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
            ? `¡Truco! Cualquier número por 1 es el mismo número.`
            : `Cuenta de ${big} en ${big}: <b>${skip.slice(0, -1).join(', ')}, …</b>`}</p>
          <button class="btn primary" data-action="closeHint">¡Ya entendí!</button>
        </div>`;
      layer.classList.remove('hidden');
    } else if (id === 'fifty') {
      const wrong = shuffle($$('#answers .answer').filter((b) => Number(b.dataset.val) !== q.answer && !b.disabled));
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
    const monster = $('#monster');
    monster.classList.add('defeated');
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

  function snapshotUnlocks() {
    return {
      avatars: AVATARS.filter(avatarUnlocked).map((a) => a.e),
      powers: Object.keys(POWERS).filter(powerUnlocked),
      boss: isUnlocked('boss'),
    };
  }

  function showResults(g, won) {
    const before = snapshotUnlocks();
    const key = g.key;
    const firstClear = won && starsOf(key) === 0;
    const stars = won ? (g.mistakes === 0 ? 3 : g.mistakes <= 2 ? 2 : 1) : 0;
    let bonus = 0;
    if (won) {
      bonus = stars * 10 + (firstClear ? 20 : 0);
      S.stars[key] = Math.max(starsOf(key), stars);
      S.best[key] = Math.max(S.best[key] || 0, g.score);
      if (!S.stickers.includes(key)) S.stickers.push(key);
    }
    const coinsTotal = g.coins + bonus;
    S.coins += coinsTotal;

    const after = snapshotUnlocks();
    const news = [];
    if (firstClear) news.push(`<div class="unlock">${WORLDS[key].sticker}<span>¡Sticker nuevo para tu álbum!</span></div>`);
    after.powers
      .filter((p) => !before.powers.includes(p))
      .forEach((p) => {
        S.powers[p] = (S.powers[p] || 0) + 2;
        news.push(`<div class="unlock power">${POWERS[p].e}<span>¡Nuevo poder: <b>${POWERS[p].name}</b>! ${POWERS[p].desc}. Te regalamos 2.</span></div>`);
      });
    after.avatars
      .filter((a) => !before.avatars.includes(a))
      .forEach((a) => news.push(`<div class="unlock">${a}<span>¡Nuevo personaje desbloqueado!</span></div>`));
    if (after.boss && !before.boss) news.push(`<div class="unlock boss">🐲<span>¡Se abrió el <b>Volcán Final</b>! El Dragón Olvidón te espera.</span></div>`);
    if (won && key !== 'boss' && key < 10 && firstClear) news.push(`<div class="unlock">🗺️<span>¡Desbloqueaste la <b>Tabla del ${key + 1}</b>!</span></div>`);

    if (won) {
      awardTrophy('first');
      if (g.mistakes === 0) awardTrophy('perfect');
      if (key === 'boss') awardTrophy('boss');
    }
    checkGlobalTrophies();
    save();

    const nextKey = key === 'boss' ? null : key < 10 ? key + 1 : isUnlocked('boss') ? 'boss' : null;
    const w = WORLDS[key];
    $('#screen-results').innerHTML = `
      <div class="results ${won ? 'won' : 'lost'}">
        <div class="res-hero">${won ? avatarHTML('xl') : `<div class="big-monster float">${w.monster}</div>`}</div>
        <h2>${won ? '¡VICTORIA!' : '¡Uy! El monstruo escapó'}</h2>
        <p class="res-sub">${won
          ? `Venciste a <b>${w.name}</b>`
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
    G = null;
    if (won) {
      $$('.big-stars .on').forEach((el, i) => setTimeout(() => Sound.fx.star(i), 350 + i * 300));
      if (news.length) setTimeout(() => Sound.fx.unlock(), 1400);
    }
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
  function renderTreasure() {
    const tabs = [
      ['avatars', '🐾 Personajes'],
      ['hats', '🎩 Gorros'],
      ['powers', '⚡ Poderes'],
      ['stickers', '📒 Álbum'],
      ['trophies', '🏆 Trofeos'],
    ];
    let body = '';
    if (treasureTab === 'avatars') {
      body = `<p class="hint-text">Gana estrellas ⭐ para desbloquear nuevos héroes.</p><div class="grid">${AVATARS.map((a) => {
        const ok = avatarUnlocked(a);
        return `<button class="card ${ok ? '' : 'locked'} ${S.avatar === a.e ? 'selected' : ''}" data-action="avatar" data-e="${a.e}" ${ok ? '' : 'disabled'}>
          <span class="card-icon">${ok ? a.e : '🔒'}</span><span class="card-name">${ok ? a.name : `⭐ ${a.need}`}</span></button>`;
      }).join('')}</div>`;
    } else if (treasureTab === 'hats') {
      body = `<p class="hint-text">Compra gorros con tus monedas 🪙 y ponle estilo a tu héroe.</p><div class="grid">${HATS.map((h) => {
        const owned = S.hats.includes(h.id);
        return `<button class="card ${S.hat === h.id ? 'selected' : ''}" data-action="hat" data-id="${h.id}">
          <span class="card-icon">${h.e || '🙂'}</span><span class="card-name">${h.name}</span>
          <span class="card-price">${owned ? (S.hat === h.id ? 'Puesto' : 'Usar') : `🪙 ${h.price}`}</span></button>`;
      }).join('')}</div>`;
    } else if (treasureTab === 'powers') {
      body = `<p class="hint-text">Los poderes te ayudan en las batallas. ¡También los ganas con rachas de 5!</p><div class="list">${Object.entries(POWERS).map(([id, p]) => {
        const ok = powerUnlocked(id);
        return `<div class="list-item ${ok ? '' : 'locked'}">
          <span class="li-icon">${ok ? p.e : '🔒'}</span>
          <div class="li-text"><b>${p.name}</b> <span class="li-count">× ${S.powers[id] || 0}</span><br><small>${ok ? p.desc : `Se desbloquea al completar ${p.unlock} tablas`}</small></div>
          <button class="btn small primary" data-action="buyPower" data-id="${id}" ${ok ? '' : 'disabled'}>🪙 ${p.price}</button>
        </div>`;
      }).join('')}</div>`;
    } else if (treasureTab === 'stickers') {
      body = `<p class="hint-text">Gana un sticker por cada monstruo que venzas.</p><div class="grid">${[...TABLES, 'boss'].map((k) => {
        const has = S.stickers.includes(k);
        const gold = starsOf(k) === 3;
        return `<div class="card sticker ${has ? '' : 'locked'} ${gold ? 'gold' : ''}">
          <span class="card-icon">${has ? WORLDS[k].sticker : '❔'}</span><span class="card-name">${k === 'boss' ? 'Jefe' : `Tabla ${k}`}</span>
          <span class="card-stars">${starsHTML(starsOf(k))}</span></div>`;
      }).join('')}</div>`;
    } else {
      body = `<div class="list">${TROPHIES.map((t) => {
        const has = S.trophies.includes(t.id);
        return `<div class="list-item ${has ? 'gold' : 'locked'}"><span class="li-icon">${has ? t.e : '🔒'}</span>
          <div class="li-text"><b>${t.name}</b><br><small>${t.desc}</small></div>${has ? '<span class="check">✔</span>' : ''}</div>`;
      }).join('')}</div>`;
    }

    $('#screen-treasure').innerHTML = `
      <div class="topbar">
        <button class="icon-btn" data-action="back" aria-label="Volver">⬅</button>
        <div class="pill coins">🪙 <b>${S.coins}</b></div>
        <div class="pill">⭐ <b>${totalStars()}</b></div>
      </div>
      <h2 class="screen-title">Tesoros y tienda</h2>
      <div class="treasure-hero">${avatarHTML('lg')}</div>
      <div class="tabs">${tabs.map(([id, label]) => `<button class="tab ${treasureTab === id ? 'active' : ''}" data-action="tab" data-id="${id}">${label}</button>`).join('')}</div>
      <div class="tab-body">${body}</div>`;
  }

  let treasureFrom = 'home';
  function openTreasure() {
    treasureFrom = current === 'map' ? 'map' : 'home';
    renderTreasure();
    show('treasure');
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
    renderHome();
    show('home');
    Sound.setIntensity(0);
  }
  function goMap() {
    stopSing();
    renderMap();
    show('map');
    Sound.setIntensity(0);
  }

  const actions = {
    home: goHome,
    map: goMap,
    treasure: openTreasure,
    back: () => (treasureFrom === 'map' ? goMap() : goHome()),
    settings: openSettings,
    closeModal,
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
    answer: (el) => answer(Number(el.dataset.val), el),
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
    hat: (el) => {
      const h = HATS.find((x) => x.id === el.dataset.id);
      if (!S.hats.includes(h.id)) {
        if (!buy(h.price)) return;
        S.hats.push(h.id);
        toast(`${h.e} ¡Compraste ${h.name}!`, 'gold');
      }
      S.hat = h.id;
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
        <p>Se perderán estrellas, monedas, stickers y trofeos.</p>
        <div class="btn-row">
          <button class="btn secondary" data-action="settings">Cancelar</button>
          <button class="btn danger" data-action="confirmReset">Sí, borrar</button>
        </div>`);
    },
    confirmReset: () => {
      S = clone(DEFAULT_SAVE);
      save();
      applySettings();
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

  document.addEventListener('keydown', (e) => {
    if (current !== 'game' || !G || G.locked) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      const btn = $$('#answers .answer')[n - 1];
      if (btn && !btn.disabled) answer(Number(btn.dataset.val), btn);
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
  goHome();
})();
