// Game content: animals, foods, rainbow colors and the daily schedule.
// Names live in i18n.js under the same ids.

// `special` is the move the animal does on Space / A / click.
// `flip` marks side-view emoji (they face left) so they turn when walking right.
// `hat` is where a hat sits: [x, y, scale, tilt], x / y in emoji sizes from its center.
const ANIMALS = [
  { id: 'rabbit',   emoji: '🐰', special: 'hop', hat: [0, -0.24, 0.9, 0] },
  { id: 'hamster',  emoji: '🐹', special: 'spin', hat: [0, -0.3, 1, 0] },
  { id: 'lion',     emoji: '🦁', special: 'roar', hat: [0, -0.33, 1, 0] },
  { id: 'dinosaur', emoji: '🦕', special: 'stomp', flip: true, hat: [-0.25, -0.34, 0.6, -0.2] },
  { id: 'godzilla', emoji: '🦖', special: 'breath', flip: true, hat: [-0.18, -0.32, 0.7, -0.2] },
  { id: 'giraffe',  emoji: '🦒', special: 'stretch', hat: [-0.22, -0.37, 0.65, -0.15] },
  { id: 'elephant', emoji: '🐘', special: 'spray', flip: true, hat: [-0.22, -0.22, 0.8, -0.15] },
  { id: 'horse',    emoji: '🐴', special: 'gallop', flip: true, hat: [-0.02, -0.3, 0.85, 0] },
  { id: 'cat',      emoji: '🐱', special: 'pounce', hat: [0, -0.28, 1, 0] },
  { id: 'ladybug',  emoji: '🐞', special: 'fly', flip: true, hat: [0, -0.3, 0.75, 0] },
];

// Rewards for levelling up, worn by every animal. `size`, `dx`, `dy` (in emoji
// sizes) and `rot` place the hat relative to the animal's `hat` spot.
const HATS = [
  { id: 'bow',        emoji: '🎀', level: 2,  size: 0.42, dx: 0.14,  dy: 0.04,  rot: 0.35 },
  { id: 'flower',     emoji: '🌸', level: 3,  size: 0.38, dx: -0.14, dy: 0.04,  rot: -0.2 },
  { id: 'cap',        emoji: '🧢', level: 4,  size: 0.56, dx: 0,     dy: -0.04, rot: -0.1 },
  { id: 'sunhat',     emoji: '👒', level: 5,  size: 0.62, dx: 0,     dy: -0.06, rot: 0 },
  { id: 'headphones', emoji: '🎧', level: 6,  size: 0.7,  dx: 0,     dy: 0.12,  rot: 0 },
  { id: 'tophat',     emoji: '🎩', level: 7,  size: 0.56, dx: 0,     dy: -0.1,  rot: 0 },
  { id: 'gradcap',    emoji: '🎓', level: 8,  size: 0.6,  dx: 0,     dy: -0.06, rot: 0 },
  { id: 'star',       emoji: '🌟', level: 9,  size: 0.4,  dx: 0,     dy: -0.16, rot: 0 },
  { id: 'crown',      emoji: '👑', level: 10, size: 0.52, dx: 0,     dy: -0.06, rot: 0 },
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
