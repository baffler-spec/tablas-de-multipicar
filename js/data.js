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
  ];

  const HATS = [
    { id: 'none', e: '', price: 0, name: 'Sin gorro' },
    { id: 'cap', e: '🧢', price: 40, name: 'Gorra' },
    { id: 'bow', e: '🎀', price: 60, name: 'Moño' },
    { id: 'party', e: '🥳', price: 80, name: 'Fiesta' },
    { id: 'top', e: '🎩', price: 120, name: 'Sombrero' },
    { id: 'grad', e: '🎓', price: 160, name: 'Birrete' },
    { id: 'crown', e: '👑', price: 250, name: 'Corona' },
  ];

  // unlock = número de tablas completadas para desbloquear el poder
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
    { id: 'stars30', e: '💫', name: 'Súper estrella', desc: 'Consigue 30 estrellas' },
    { id: 'rich', e: '💰', name: 'Ahorrador', desc: 'Junta 300 monedas' },
    { id: 'wizard', e: '🧙', name: 'Mago', desc: 'Usa 10 poderes' },
  ];

  const CHEERS = ['¡Genial!', '¡Súper!', '¡Bravo!', '¡Increíble!', '¡Eso es!', '¡Wow!', '¡Excelente!', '¡Muy bien!', '¡Crack!'];
  const ENCOURAGE = ['¡Casi!', '¡Tú puedes!', '¡Sigue intentando!', '¡Ánimo!'];

  const DEFAULT_SAVE = {
    coins: 20,
    stars: {},
    best: {},
    powers: { hint: 3, fifty: 0, freeze: 0, shield: 0 },
    avatar: '🐱',
    hats: ['none'],
    hat: 'none',
    stickers: [],
    trophies: [],
    settings: { music: true, sfx: true, voice: true, speed: 'normal' },
    stats: { correct: 0, bestCombo: 0, played: 0, powersUsed: 0 },
  };

  return { WORLDS, AVATARS, HATS, POWERS, TROPHIES, CHEERS, ENCOURAGE, DEFAULT_SAVE };
})();
