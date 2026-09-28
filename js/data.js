/* Datos del juego: mundos, monstruos, recompensas y poderes. */
const DATA = (() => {
  'use strict';

  const WORLDS = {
    1: { monster: '🐛', name: 'Gusanito Uno', place: 'Jardín Uno', sticker: '🍎' },
    2: { monster: '🐸', name: 'Rana Doble', place: 'Laguna Doble', sticker: '🚲' },
    3: { monster: '🦀', name: 'Cangrejo Tri', place: 'Playa Triple', sticker: '🎈' },
    4: { monster: '🐙', name: 'Pulpo Cuatro', place: 'Mar Cuádruple', sticker: '🌈' },
    5: { monster: '🦔', name: 'Erizo Cinco', place: 'Bosque de Cinco', sticker: '⚽' },
    6: { monster: '🦇', name: 'Murciélago Seis', place: 'Cueva Seis', sticker: '🎸' },
    7: { monster: '👻', name: 'Fantasma Siete', place: 'Castillo Siete', sticker: '🍦' },
    8: { monster: '🤖', name: 'Robot Ocho', place: 'Fábrica Ocho', sticker: '🚀' },
    9: { monster: '👽', name: 'Alien Nueve', place: 'Planeta Nueve', sticker: '🛸' },
    10: { monster: '👾', name: 'Invasor Diez', place: 'Galaxia Diez', sticker: '💎' },
    boss: { monster: '🐲', name: 'Dragón Olvidón', place: 'Volcán Final', sticker: '🏆' },
  };

  // Jefe del Nivel 2
  const BOSS2 = { monster: '🐉', name: 'Rey Dragón Olvidón', place: 'Volcán Eterno', sticker: '👑' };

  // Configuración de cada nivel de dificultad
  const LEVELS = {
    1: {
      name: 'Nivel 1',
      icon: '🌞',
      speeds: { relax: Infinity, normal: 15, fast: 8 },
      coinsPerHit: 2,
      starBonus: 10,
      firstBonus: 20,
      powerEvery: 5,
    },
    2: {
      name: 'Nivel 2 · Modo Leyenda',
      icon: '🌋',
      speeds: { relax: 20, normal: 9, fast: 6 },
      coinsPerHit: 4,
      starBonus: 20,
      firstBonus: 50,
      powerEvery: 4,
    },
  };

  // need = estrellas totales (de ambos niveles); final = se gana al ver ese final
  const AVATARS = [
    { e: '🐱', need: 0, name: 'Michi' },
    { e: '🐶', need: 3, name: 'Firulais' },
    { e: '🐰', need: 6, name: 'Saltarín' },
    { e: '🦊', need: 9, name: 'Zorrito' },
    { e: '🐼', need: 12, name: 'Pandi' },
    { e: '🐯', need: 16, name: 'Tigrito' },
    { e: '🦁', need: 20, name: 'Leoncio' },
    { e: '🦄', need: 24, name: 'Unicornia' },
    { e: '🐉', need: 30, name: 'Dragoncito' },
    { e: '🦸', final: 1, name: 'Súper Héroe' },
    { e: '🦖', need: 42, name: 'Dino Rex' },
    { e: '🐳', need: 54, name: 'Ballenota' },
    { e: '🧙', final: 2, name: 'Gran Mago' },
  ];

  // Artículos de personalización. price = se compran; final / half2 = premios especiales
  const HATS = [
    { id: 'none', e: '', price: 0, name: 'Sin gorro' },
    { id: 'cap', e: '🧢', price: 40, name: 'Gorra' },
    { id: 'bow', e: '🎀', price: 60, name: 'Moño' },
    { id: 'party', e: '🥳', price: 80, name: 'Fiesta' },
    { id: 'top', e: '🎩', price: 120, name: 'Sombrero' },
    { id: 'grad', e: '🎓', price: 160, name: 'Birrete' },
    { id: 'crown', e: '👑', price: 250, name: 'Corona' },
    { id: 'medal', e: '🏅', final: 1, name: 'Medalla de héroe' },
    { id: 'star', e: '🌟', final: 2, name: 'Estrella legendaria' },
  ];

  const PETS = [
    { id: 'none', e: '', price: 0, name: 'Sin mascota' },
    { id: 'chick', e: '🐣', price: 80, name: 'Pollito' },
    { id: 'turtle', e: '🐢', price: 120, name: 'Tortuguita' },
    { id: 'butterfly', e: '🦋', price: 150, name: 'Mariposa' },
    { id: 'owl', e: '🦉', price: 220, name: 'Búho sabio' },
    { id: 'dragon', e: '🐲', final: 1, name: 'Dragón amigo' },
    { id: 'unicorn', e: '🦄', half2: true, name: 'Unicornio veloz' },
    { id: 'golden', e: '🐉', final: 2, name: 'Dragón dorado' },
  ];

  const AURAS = [
    { id: 'none', price: 0, name: 'Sin aura' },
    { id: 'sparkle', price: 120, name: 'Destellos' },
    { id: 'bubbles', price: 180, name: 'Burbujas' },
    { id: 'rainbow', final: 1, name: 'Arcoíris' },
    { id: 'fire', half2: true, name: 'Fuego' },
    { id: 'gold', final: 2, name: 'Dorada' },
  ];

  const TITLES = {
    1: { e: '🦸', name: 'Héroe de las Tablas' },
    2: { e: '👑', name: 'Leyenda de las Tablas' },
  };

  // unlock = número de tablas completadas (Nivel 1) para desbloquear el poder
  const POWERS = {
    hint: { e: '💡', name: 'Pista', desc: 'Muestra los puntitos para contar y pausa el reloj', price: 15, unlock: 0 },
    fifty: { e: '✂️', name: '50 / 50', desc: 'Quita dos respuestas incorrectas', price: 25, unlock: 2 },
    freeze: { e: '❄️', name: 'Congelar', desc: 'Congela el reloj en esta pregunta', price: 30, unlock: 4 },
    shield: { e: '🛡️', name: 'Escudo', desc: 'Te protege de tu siguiente error', price: 40, unlock: 6 },
  };

  const TROPHIES = [
    { id: 'first', e: '🥉', name: '¡Primera victoria!', desc: 'Gana tu primer nivel' },
    { id: 'perfect', e: '🌟', name: '¡Perfecto!', desc: 'Gana un nivel sin errores' },
    { id: 'combo10', e: '🔥', name: 'En llamas', desc: 'Racha de 10 respuestas seguidas' },
    { id: 'fast', e: '⚡', name: 'Rayo veloz', desc: 'Responde bien en menos de 2 segundos' },
    { id: 'half', e: '🥈', name: 'A la mitad', desc: 'Completa 5 tablas' },
    { id: 'all', e: '🥇', name: 'Maestro de las tablas', desc: 'Completa las 10 tablas' },
    { id: 'boss', e: '🐲', name: 'Cazadragones', desc: 'Vence al Dragón Olvidón' },
    { id: 'stars30', e: '💫', name: 'Súper estrella', desc: 'Consigue 30 estrellas en el Nivel 1' },
    { id: 'rich', e: '💰', name: 'Ahorrador', desc: 'Junta 300 monedas' },
    { id: 'wizard', e: '🧙', name: 'Mago', desc: 'Usa 10 poderes' },
    { id: 'hero', e: '🦸', name: 'Héroe de las Tablas', desc: 'Termina el Nivel 1' },
    { id: 'dodger', e: '⚔️', name: 'Esquivador', desc: 'Contesta bien 10 ataques sorpresa' },
    { id: 'half2', e: '🌋', name: 'Corazón de lava', desc: 'Completa 5 tablas del Nivel 2' },
    { id: 'legend', e: '👑', name: 'Leyenda de las Tablas', desc: 'Vence al Rey Dragón en el Nivel 2' },
    { id: 'stars66', e: '🌈', name: 'Todas las estrellas', desc: 'Consigue las 66 estrellas del juego' },
  ];

  const CHEERS = ['¡Genial!', '¡Súper!', '¡Bravo!', '¡Increíble!', '¡Eso es!', '¡Wow!', '¡Excelente!', '¡Muy bien!', '¡Crack!'];
  const ENCOURAGE = ['¡Casi!', '¡Tú puedes!', '¡Sigue intentando!', '¡Ánimo!'];

  const DEFAULT_SAVE = {
    name: '',
    level: 1,
    coins: 20,
    stars: {},
    stars2: {},
    best: {},
    best2: {},
    finals: [],
    powers: { hint: 3, fifty: 0, freeze: 0, shield: 0 },
    avatar: '🐱',
    hats: ['none'],
    hat: 'none',
    pets: ['none'],
    pet: 'none',
    auras: ['none'],
    aura: 'none',
    stickers: [],
    stickers2: [],
    trophies: [],
    settings: { music: true, sfx: true, voice: true, speed: 'normal' },
    stats: { correct: 0, bestCombo: 0, played: 0, powersUsed: 0, intruders: 0 },
  };

  return {
    WORLDS, BOSS2, LEVELS, AVATARS, HATS, PETS, AURAS, TITLES, POWERS, TROPHIES, CHEERS, ENCOURAGE, DEFAULT_SAVE,
  };
})();
