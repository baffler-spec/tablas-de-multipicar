/*
 * Motor de sonido: música rítmica generada en tiempo real con Web Audio,
 * efectos de sonido y voz (síntesis de voz del navegador).
 *
 * La música tiene 4 niveles de intensidad que se van sumando capas
 * (bombo, palmas, platillos, bajo, arpegio y melodía) conforme el niño
 * encadena respuestas correctas.
 */
const Sound = (() => {
  'use strict';

  let ctx = null;
  let master, musicBus, sfxBus, noiseBuf;
  let musicOn = true;
  let sfxOn = true;
  let voiceOn = true;

  let running = false;
  let intensity = 0;
  let boost = 0; // BPM extra (Nivel 2)
  let step = 0;
  let nextTime = 0;
  let timer = null;
  const LOOKAHEAD = 0.12;

  const beatListeners = [];
  const barListeners = [];

  // Progresión alegre: Do - Sol - Lam - Fa
  const PROG = [
    { root: 48, tones: [60, 64, 67] },
    { root: 43, tones: [59, 62, 67] },
    { root: 45, tones: [60, 64, 69] },
    { root: 41, tones: [60, 65, 69] },
  ];
  // Melodía pegajosa (una por compás), en pasos de semicorchea
  const MELODY = [
    { 0: 72, 3: 76, 6: 79, 10: 76, 12: 79, 14: 81 },
    { 0: 79, 3: 74, 6: 71, 10: 74, 12: 79 },
    { 0: 76, 3: 72, 6: 69, 10: 72, 12: 76, 14: 79 },
    { 0: 77, 3: 81, 6: 84, 8: 81, 10: 79, 12: 77 },
  ];
  const BASS_STEPS = [0, 3, 6, 8, 10, 11, 14];
  const TEMPOS = [96, 108, 116, 126];
  const tempo = () => TEMPOS[intensity] + boost;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(comp);
    comp.connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = musicOn ? 0.5 : 0;
    musicBus.connect(master);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = sfxOn ? 0.9 : 0;
    sfxBus.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    });
    return true;
  }

  // ---------- Instrumentos ----------
  function kick(t, v = 1) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g);
    g.connect(musicBus);
    o.start(t);
    o.stop(t + 0.3);
  }

  function noise(t, v, dur, freq, type = 'highpass', bus = musicBus) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(bus);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  function clap(t, v = 0.55) {
    noise(t, v, 0.16, 1400, 'bandpass');
    noise(t + 0.012, v * 0.6, 0.12, 1800, 'bandpass');
  }

  function hat(t, v = 0.2, d = 0.04) {
    noise(t, v, d, 7500);
  }

  function tone(freq, t, dur, opts = {}) {
    const { type = 'triangle', vol = 0.2, bus = musicBus, attack = 0.005, cutoff = null, slideTo = null } = opts;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // ---------- Secuenciador ----------
  function scheduleStep(s, t) {
    const bar = Math.floor(s / 16);
    const st = s % 16;
    const ch = PROG[bar % 4];
    const sixteenth = 60 / tempo() / 4;

    if (intensity === 0) {
      // Ambiente tranquilo para menús
      if (st === 0 || st === 8) kick(t, 0.6);
      if (st % 4 === 2) hat(t, 0.1, 0.03);
      if (st % 2 === 0) tone(mtof(ch.tones[(st / 2) % 3] + 12), t, 0.25, { type: 'sine', vol: 0.07 });
      if (st === 0 || st === 10) tone(mtof(ch.root), t, 0.4, { type: 'sawtooth', vol: 0.12, cutoff: 500 });
    } else {
      // Batería
      if (st % 4 === 0) kick(t, 0.9);
      if (st === 4 || st === 12) clap(t);
      if (st % 4 === 2) hat(t, 0.22, 0.06);
      if (intensity >= 2 && st % 2 === 1) hat(t, 0.09, 0.025);
      if (intensity >= 3 && st === 15) clap(t, 0.3);
      // Bajo funky
      if (BASS_STEPS.includes(st)) {
        const oct = st === 6 || st === 14 ? 12 : 0;
        tone(mtof(ch.root + oct), t, sixteenth * 1.6, { type: 'sawtooth', vol: 0.16, cutoff: 700 });
      }
      // Arpegio
      if (intensity >= 2) {
        const n = ch.tones[st % 3] + (st % 6 >= 3 ? 12 : 0);
        tone(mtof(n), t, sixteenth * 0.9, { type: 'square', vol: 0.035, cutoff: 2600 });
      }
      // Melodía
      if (intensity >= 3) {
        const m = MELODY[bar % 4][st];
        if (m) tone(mtof(m), t, sixteenth * 2.4, { type: 'triangle', vol: 0.12 });
      } else if (intensity === 1 && st % 4 === 0) {
        tone(mtof(ch.tones[(st / 4) % 3] + 12), t, sixteenth * 3, { type: 'sine', vol: 0.06 });
      }
    }

    if (st % 4 === 0) {
      const delay = Math.max(0, (t - ctx.currentTime) * 1000);
      const beat = st / 4;
      setTimeout(() => {
        beatListeners.forEach((fn) => fn(beat));
        if (beat === 0) barListeners.forEach((fn) => fn(bar));
      }, delay);
    }
  }

  function tick() {
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      scheduleStep(step, nextTime);
      nextTime += 60 / tempo() / 4;
      step++;
    }
  }

  function start() {
    if (!init() || running) return;
    running = true;
    step = 0;
    nextTime = ctx.currentTime + 0.06;
    timer = setInterval(tick, 25);
  }

  function setIntensity(level) {
    intensity = Math.max(0, Math.min(3, level));
  }

  function setBoost(bpm) {
    boost = bpm;
  }

  // ---------- Efectos ----------
  function sfx(fn) {
    if (!ctx || !sfxOn) return;
    fn(ctx.currentTime + 0.005);
  }

  const PENTA = [0, 2, 4, 7, 9];
  const fx = {
    click() {
      sfx((t) => tone(880, t, 0.06, { type: 'square', vol: 0.06, bus: sfxBus }));
    },
    correct(combo = 0) {
      sfx((t) => {
        const base = 72 + PENTA[combo % 5] + 12 * Math.floor(Math.min(combo, 9) / 5);
        [0, 4, 7, 12].forEach((iv, i) =>
          tone(mtof(base + iv), t + i * 0.055, 0.22, { type: 'triangle', vol: 0.22, bus: sfxBus })
        );
        tone(mtof(base + 24), t + 0.22, 0.3, { type: 'sine', vol: 0.08, bus: sfxBus });
      });
    },
    wrong() {
      sfx((t) => {
        tone(330, t, 0.18, { type: 'sine', vol: 0.2, bus: sfxBus, slideTo: 220 });
        tone(262, t + 0.16, 0.3, { type: 'sine', vol: 0.18, bus: sfxBus, slideTo: 180 });
      });
    },
    hit() {
      sfx((t) => {
        noise(t, 0.35, 0.12, 900, 'lowpass', sfxBus);
        tone(160, t, 0.15, { type: 'sine', vol: 0.3, bus: sfxBus, slideTo: 60 });
      });
    },
    coin() {
      sfx((t) => {
        tone(988, t, 0.08, { type: 'square', vol: 0.07, bus: sfxBus });
        tone(1319, t + 0.07, 0.2, { type: 'square', vol: 0.07, bus: sfxBus });
      });
    },
    power() {
      sfx((t) => {
        tone(300, t, 0.45, { type: 'sawtooth', vol: 0.12, bus: sfxBus, slideTo: 1400, cutoff: 3000 });
        [84, 88, 91, 96].forEach((n, i) => tone(mtof(n), t + 0.1 + i * 0.06, 0.2, { type: 'sine', vol: 0.1, bus: sfxBus }));
      });
    },
    unlock() {
      sfx((t) => {
        [72, 76, 79, 84, 88, 91, 96].forEach((n, i) =>
          tone(mtof(n), t + i * 0.06, 0.3, { type: 'triangle', vol: 0.14, bus: sfxBus })
        );
      });
    },
    fire() {
      sfx((t) => {
        noise(t, 0.3, 0.6, 600, 'bandpass', sfxBus);
        tone(200, t, 0.6, { type: 'sawtooth', vol: 0.1, bus: sfxBus, slideTo: 800, cutoff: 2000 });
      });
    },
    win() {
      sfx((t) => {
        const seq = [[72, 0], [72, 0.12], [72, 0.24], [76, 0.36], [79, 0.6], [76, 0.78], [79, 0.9]];
        seq.forEach(([n, d]) => tone(mtof(n), t + d, 0.2, { type: 'square', vol: 0.09, bus: sfxBus, cutoff: 3000 }));
        [72, 76, 79, 84].forEach((n) => tone(mtof(n), t + 1.1, 1.1, { type: 'triangle', vol: 0.12, bus: sfxBus }));
      });
    },
    lose() {
      sfx((t) => {
        [67, 65, 64, 60].forEach((n, i) => tone(mtof(n), t + i * 0.22, 0.3, { type: 'triangle', vol: 0.15, bus: sfxBus }));
      });
    },
    attack() {
      sfx((t) => {
        tone(90, t, 0.5, { type: 'sawtooth', vol: 0.18, bus: sfxBus, slideTo: 45, cutoff: 800 });
        noise(t, 0.3, 0.4, 400, 'lowpass', sfxBus);
        [76, 75, 74].forEach((n, i) => tone(mtof(n), t + 0.1 + i * 0.1, 0.12, { type: 'square', vol: 0.05, bus: sfxBus }));
      });
    },
    fanfare() {
      sfx((t) => {
        const seq = [[67, 0, 0.15], [72, 0.15, 0.15], [76, 0.3, 0.15], [79, 0.45, 0.4], [76, 0.85, 0.15], [79, 1.0, 0.7]];
        seq.forEach(([n, d, len]) => {
          tone(mtof(n), t + d, len, { type: 'square', vol: 0.08, bus: sfxBus, cutoff: 3200 });
          tone(mtof(n - 12), t + d, len, { type: 'triangle', vol: 0.12, bus: sfxBus });
        });
        [72, 76, 79, 84, 88].forEach((n) => tone(mtof(n), t + 1.7, 2.2, { type: 'triangle', vol: 0.09, bus: sfxBus, attack: 0.05 }));
        [0, 0.35, 0.7, 1.05, 1.4].forEach((d) => noise(t + 1.7 + d, 0.25, 0.5, 5000, 'highpass', sfxBus));
      });
    },
    star(i = 0) {
      sfx((t) => tone(mtof(84 + i * 4), t, 0.35, { type: 'triangle', vol: 0.18, bus: sfxBus }));
    },
  };

  // ---------- Voz ----------
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices();
    voice =
      voices.find((v) => /es[-_](MX|US|419)/i.test(v.lang)) ||
      voices.find((v) => /^es/i.test(v.lang)) ||
      null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  function say(text, rate = 1.05) {
    if (!voiceOn || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice ? voice.lang : 'es-MX';
      if (voice) u.voice = voice;
      u.rate = rate;
      u.pitch = 1.25;
      speechSynthesis.speak(u);
    } catch (e) {
      /* sin voz disponible */
    }
  }

  function setMusic(on) {
    musicOn = on;
    if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.05);
  }
  function setSfx(on) {
    sfxOn = on;
    if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.05);
  }
  function setVoice(on) {
    voiceOn = on;
    if (!on && 'speechSynthesis' in window) speechSynthesis.cancel();
  }

  return {
    init,
    start,
    setIntensity,
    setBoost,
    get intensity() {
      return intensity;
    },
    onBeat: (fn) => beatListeners.push(fn),
    onBar: (fn) => barListeners.push(fn),
    fx,
    say,
    setMusic,
    setSfx,
    setVoice,
  };
})();
