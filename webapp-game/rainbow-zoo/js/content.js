// Game content: animals, foods, rainbow colors and the daily schedule.
// Names live in i18n.js under the same ids.

// `special` is the move the animal does on Space / A / click.
// `flip` marks side-view emoji (they face left) so they turn when walking right.
const ANIMALS = [
  { id: 'rabbit',   emoji: '🐰', special: 'hop' },
  { id: 'hamster',  emoji: '🐹', special: 'spin' },
  { id: 'lion',     emoji: '🦁', special: 'roar' },
  { id: 'dinosaur', emoji: '🦕', special: 'stomp', flip: true },
  { id: 'godzilla', emoji: '🦖', special: 'breath', flip: true },
  { id: 'giraffe',  emoji: '🦒', special: 'stretch' },
  { id: 'elephant', emoji: '🐘', special: 'spray', flip: true },
];

const FOODS = [
  { id: 'apple',      emoji: '🍎', kind: 'fruit' },
  { id: 'banana',     emoji: '🍌', kind: 'fruit' },
  { id: 'strawberry', emoji: '🍓', kind: 'fruit' },
  { id: 'grapes',     emoji: '🍇', kind: 'fruit' },
  { id: 'watermelon', emoji: '🍉', kind: 'fruit' },
  { id: 'orange',     emoji: '🍊', kind: 'fruit' },
  { id: 'peach',      emoji: '🍑', kind: 'fruit' },
  { id: 'cherry',     emoji: '🍒', kind: 'fruit' },
  { id: 'carrot',     emoji: '🥕', kind: 'vegetable' },
  { id: 'broccoli',   emoji: '🥦', kind: 'vegetable' },
  { id: 'corn',       emoji: '🌽', kind: 'vegetable' },
  { id: 'tomato',     emoji: '🍅', kind: 'vegetable' },
  { id: 'cucumber',   emoji: '🥒', kind: 'vegetable' },
  { id: 'potato',     emoji: '🥔', kind: 'vegetable' },
];

const RAINBOW = [
  { id: 'c_red',    hex: '#ff4d6d', dark: '#d62e50' },
  { id: 'c_orange', hex: '#ff9f1c', dark: '#e07b00' },
  { id: 'c_yellow', hex: '#ffd60a', dark: '#d9a900' },
  { id: 'c_green',  hex: '#3ddc84', dark: '#1fae5f' },
  { id: 'c_blue',   hex: '#3a86ff', dark: '#1d5fd1' },
  { id: 'c_purple', hex: '#9d4edd', dark: '#7426b5' },
  { id: 'c_pink',   hex: '#ff70a6', dark: '#e0447f' },
];
const COLOR = Object.fromEntries(RAINBOW.map(c => [c.id.slice(2), c]));

// A picture for each letter in Letter Balloons.
const LETTER_EMOJI = {
  A: '🍎', B: '🍌', C: '🥕', D: '🦕', E: '🐘', F: '🐟', G: '🦒', H: '🐹', I: '🍦',
  J: '🧃', K: '🪁', L: '🦁', M: '🐒', N: '🥜', O: '🍊', P: '🍑', Q: '👑', R: '🐰',
  S: '🍓', T: '🍅', U: '☂️', V: '🎻', W: '🍉', X: '🎄', Y: '🪀', Z: '🦓',
};

// A day in the zoo, in minutes since midnight.
const SCHEDULE = [
  { at: 7 * 60,  id: 'wakeup',    emoji: '🌅' },
  { at: 8 * 60,  id: 'breakfast', emoji: '🥣' },
  { at: 10 * 60, id: 'play',      emoji: '⚽' },
  { at: 12 * 60, id: 'lunch',     emoji: '🍱' },
  { at: 13 * 60, id: 'nap',       emoji: '💤' },
  { at: 15 * 60, id: 'snack',     emoji: '🍪' },
  { at: 18 * 60, id: 'dinner',    emoji: '🍲' },
  { at: 19 * 60, id: 'bath',      emoji: '🛁' },
  { at: 20 * 60, id: 'bedtime',   emoji: '🌙' },
];
