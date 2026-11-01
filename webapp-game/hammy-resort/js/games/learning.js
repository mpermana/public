// Learning games in the study room and garden: letters, numbers, adding,
// colors, shapes, big & small letters, counting veggies and naming flowers.
// Every answer is read aloud; wrong taps just fade that card.

const ABC = [
  ['A', 'apple', '🍎'], ['B', 'banana', '🍌'], ['C', 'cat', '🐱'], ['D', 'dog', '🐶'], ['E', 'egg', '🥚'], ['F', 'fish', '🐟'],
  ['G', 'grapes', '🍇'], ['H', 'hamster', '🐹'], ['I', 'ice cream', '🍦'], ['J', 'juice', '🧃'], ['K', 'kite', '🪁'], ['L', 'lion', '🦁'],
  ['M', 'moon', '🌙'], ['N', 'nest', '🪺'], ['O', 'orange', '🍊'], ['P', 'pig', '🐷'], ['Q', 'queen', '👑'], ['R', 'rainbow', '🌈'],
  ['S', 'sun', '☀️'], ['T', 'tree', '🌳'], ['U', 'umbrella', '☂️'], ['V', 'violin', '🎻'], ['W', 'watermelon', '🍉'], ['X', 'xylophone', '🎶'],
  ['Y', 'yo-yo', '🪀'], ['Z', 'zebra', '🦓'],
];
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const COUNT_THINGS = [['🦆', 'ducks'], ['🍎', 'apples'], ['⭐', 'stars'], ['🐞', 'ladybugs'], ['🌸', 'flowers'], ['🎈', 'balloons'], ['🐟', 'fish'], ['🍓', 'strawberries']];

function letterCard(l, color) {
  return { label: l, big: 110, ink: color || PAL.ink };
}

// Close numbers to choose from, always including the right one.
function numberChoices(n, max = 20, count = 3) {
  const set = new Set([n]);
  for (const d of shuffle([-2, -1, 1, 2, 3])) if (set.size < count && n + d >= 0 && n + d <= max) set.add(n + d);
  return [...set].map(v => ({ label: String(v), big: 110, correct: v === n, color: v === n ? '#ffffff' : '#ffffff' }));
}

quizGame('letters', {
  rounds: 5,
  make(i) {
    const learned = S.learned.letters, fresh = ABC.filter(a => !learned.includes(a[0]));
    const [L, wordName, emoji] = i < 3 && fresh.length ? fresh[Math.min(i, fresh.length - 1)] : pick(ABC);
    if (!learned.includes(L)) learned.push(L);
    const others = shuffle(ABC.filter(a => a[0] !== L)).slice(0, 2).map(a => a[0]);
    const kind = i % 3; // 0: find the letter, 1: what does the picture start with, 2: lowercase
    const col = Object.values(COLORS)[ABC.findIndex(a => a[0] === L) % 7];
    if (kind === 1) {
      return {
        prompt: `${wordName[0].toUpperCase() + wordName.slice(1)}! Which letter does ${wordName} start with?`,
        show(ctx, a) { drawEmoji(ctx, emoji, a.x + a.w / 2, a.y + a.h / 2, 220); },
        choices: [L, ...others].map(x => ({ ...letterCard(x), correct: x === L })),
        after: `${L}! ${L} is for ${wordName}.`,
      };
    }
    if (kind === 2) {
      return {
        prompt: `This is big ${L}. Can you find little ${L.toLowerCase()}?`,
        show(ctx, a) { drawText(ctx, L, a.x + a.w / 2, a.y + a.h / 2, 230, { color: col, stroke: '#fff', sw: 0.06 }); },
        choices: [L, ...others].map(x => ({ ...letterCard(x.toLowerCase()), correct: x === L })),
        after: `Little ${L.toLowerCase()}!`,
      };
    }
    return {
      prompt: `This is ${L}. ${L} is for ${wordName}. Can you find ${L}?`,
      show(ctx, a) {
        drawText(ctx, `${L} ${L.toLowerCase()}`, a.x + a.w * 0.38, a.y + a.h / 2, 200, { color: col, stroke: '#fff', sw: 0.06 });
        drawEmoji(ctx, emoji, a.x + a.w * 0.76, a.y + a.h / 2, 190);
        drawText(ctx, wordName, a.x + a.w * 0.76, a.y + a.h - 34, 34, { color: '#7b6a8f' });
      },
      choices: [L, ...others].map(x => ({ ...letterCard(x), correct: x === L })),
      after: `${L}! You found it!`,
    };
  },
});

quizGame('numbers', {
  rounds: 5,
  make(i) {
    const level = S.learned.numbers.length, max = level < 5 ? 5 : level < 12 ? 10 : 20;
    const n = randi(i < 2 ? 1 : 3, max), [emoji, things] = pick(COUNT_THINGS);
    if (!S.learned.numbers.includes(n)) S.learned.numbers.push(n);
    if (i === 4) {
      return {
        prompt: `Can you find the number ${NUMBER_WORDS[n]}?`,
        show(ctx, a) { drawText(ctx, NUMBER_WORDS[n], a.x + a.w / 2, a.y + a.h / 2, 110, { color: '#b197fc', stroke: '#fff', sw: 0.08 }); },
        choices: numberChoices(n, max),
        after: `${n}! ${NUMBER_WORDS[n]}!`,
      };
    }
    return {
      prompt: `How many ${things} are there? Let's count!`,
      show(ctx, a) { drawCountables(ctx, a, emoji, n, n > 10 ? 58 : 80); },
      choices: numberChoices(n, max),
      after: `${NUMBER_WORDS[n]} ${things}!`,
    };
  },
});

quizGame('addition', {
  rounds: 5,
  make(i) {
    const a = randi(1, i < 2 ? 3 : 5), b = randi(1, i < 2 ? 2 : 5), [emoji, things] = pick(COUNT_THINGS);
    return {
      prompt: `${NUMBER_WORDS[a]} ${things} and ${NUMBER_WORDS[b]} more. How many altogether?`,
      show(ctx, ar) {
        drawCountables(ctx, { x: ar.x, y: ar.y, w: ar.w * 0.42, h: ar.h }, emoji, a, 70);
        drawText(ctx, '+', ar.x + ar.w * 0.5, ar.y + ar.h / 2, 110, { color: '#ff8fb8' });
        drawCountables(ctx, { x: ar.x + ar.w * 0.58, y: ar.y, w: ar.w * 0.42, h: ar.h }, emoji, b, 70);
        drawText(ctx, `${a} + ${b} = ?`, ar.x + ar.w / 2, ar.y + ar.h - 30, 40, { color: '#7b6a8f' });
      },
      choices: numberChoices(a + b, 10),
      after: `${a} plus ${b} is ${a + b}!`,
    };
  },
});

// A balloon in a color, for the colors quiz.
function drawBalloon(ctx, x, y, r, color) {
  ctx.strokeStyle = 'rgba(80,60,100,.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y + r * 1.1);
  ctx.quadraticCurveTo(x + r * 0.3, y + r * 1.6, x, y + r * 2);
  ctx.stroke();
  ellipse(ctx, x, y, r, r * 1.15);
  paint(ctx, color, y - r, y + r, { lw: 3 });
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ellipse(ctx, x - r * 0.35, y - r * 0.4, r * 0.2, r * 0.3, -0.5);
  ctx.fill();
}

quizGame('colors', {
  rounds: 6,
  make(i) {
    const names = Object.keys(COLORS), target = names[i % names.length === 0 ? randi(0, 6) : (S.time.day + i * 3) % 7];
    const opts = [target, ...shuffle(names.filter(n => n !== target)).slice(0, 2)];
    const things = pick([['balloon', drawBalloon], ['paint pot', null]]);
    return {
      prompt: `Can you find the ${target} ${things[0]}?`,
      show(ctx, a) {
        drawText(ctx, target.toUpperCase(), a.x + a.w / 2, a.y + a.h / 2 - 20, 110, { color: COLORS[target], stroke: '#fff', sw: 0.1 });
        drawText(ctx, '🎨', a.x + a.w / 2, a.y + a.h - 60, 60);
      },
      choices: opts.map(n => ({
        correct: n === target,
        draw(ctx, x, y, s) {
          if (things[1]) drawBalloon(ctx, x, y - s * 0.12, s * 0.34, COLORS[n]);
          else {
            rr(ctx, x - s * 0.36, y - s * 0.2, s * 0.72, s * 0.5, s * 0.12);
            paint(ctx, '#f3ecf8', y - s * 0.2, y + s * 0.3, { lw: 3 });
            ellipse(ctx, x, y - s * 0.2, s * 0.36, s * 0.1);
            paint(ctx, COLORS[n], y - s * 0.3, y - s * 0.1, { lw: 2 });
          }
        },
      })),
      after: `${target}! That's ${target}!`,
    };
  },
});

const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart'];
function drawShape(ctx, kind, x, y, s, color) {
  ctx.beginPath();
  switch (kind) {
    case 'circle': ctx.arc(x, y, s * 0.42, 0, TAU); break;
    case 'square': ctx.roundRect(x - s * 0.38, y - s * 0.38, s * 0.76, s * 0.76, s * 0.06); break;
    case 'triangle': ctx.moveTo(x, y - s * 0.44); ctx.lineTo(x + s * 0.46, y + s * 0.36); ctx.lineTo(x - s * 0.46, y + s * 0.36); ctx.closePath(); break;
    case 'rectangle': ctx.roundRect(x - s * 0.48, y - s * 0.28, s * 0.96, s * 0.56, s * 0.06); break;
    case 'star': starPath(ctx, x, y, s * 0.48, 0.45); break;
    case 'heart': heartPath(ctx, x, y + s * 0.14, s * 0.62); break;
  }
  paint(ctx, color, y - s * 0.45, y + s * 0.45, { lw: 4 });
}

quizGame('shapes', {
  rounds: 6,
  make(i) {
    const target = SHAPES[(i + S.time.day) % SHAPES.length], opts = [target, ...shuffle(SHAPES.filter(s => s !== target)).slice(0, 2)];
    const cols = shuffle(Object.values(COLORS));
    return {
      prompt: `Can you find the ${target}?`,
      show(ctx, a) {
        drawText(ctx, target, a.x + a.w / 2, a.y + 70, 64, { color: '#7b6a8f' });
        drawShape(ctx, target, a.x + a.w / 2, a.y + a.h / 2 + 40, 200, '#f3ecf8');
        ctx.setLineDash([12, 10]);
        ctx.strokeStyle = '#c9b6e8';
        ctx.stroke();
        ctx.setLineDash([]);
      },
      choices: opts.map((s, k) => ({ correct: s === target, draw(ctx, x, y, sz) { drawShape(ctx, s, x, y, sz * 0.9, cols[k]); } })),
      after: `A ${target}! Well done!`,
    };
  },
});

// Big and small letters: drag each little letter onto its big letter.
dragGame('matching', {
  prompt: 'Help the little letters find their big letters!',
  setup() {
    const start = (S.counts.matching || 0) * 5 % 26, letters = Array.from({ length: 5 }, (_, i) => ABC[(start + i * 2) % 26][0]);
    const cols = Object.values(COLORS);
    return {
      items: shuffle(letters).map((l, i) => ({ key: l, x: 260 + i * 270, y: 760, size: 110, draw(ctx, x, y, s) { card(ctx, x - s / 2, y - s / 2, s, s, { r: 22 }); drawText(ctx, l.toLowerCase(), x, y - 4, s * 0.7, { color: cols[l.charCodeAt(0) % 7] }); } })),
      slots: letters.map((l, i) => ({ key: l, x: 175 + i * 270, y: 260, w: 170, h: 220, draw(ctx, sl, hover) {
        card(ctx, sl.x, sl.y, sl.w, sl.h, { color: hover ? '#fff3b8' : '#ffffff' });
        drawText(ctx, l, sl.x + sl.w / 2, sl.y + 78, 110, { color: cols[l.charCodeAt(0) % 7] });
        if (!sl.filled.length) { rr(ctx, sl.x + 30, sl.y + 140, sl.w - 60, 66, 14); ctx.setLineDash([8, 8]); ctx.strokeStyle = '#c9b6e8'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]); }
      } })),
    };
  },
  place(it, sl) { return { x: sl.x + sl.w / 2, y: sl.y + 174 }; },
  onPlace(it) { Speech.say(`Big ${it.key}, little ${it.key.toLowerCase()}!`); },
  render(ctx) { gameBackdrop(ctx, '#fff8d9', '#fff0b3', { pattern: 'checks', accent: '#fff4c4' }); },
  onPick(it) { Speech.say(it.key.toLowerCase()); },
});

quizGame('countveg', {
  rounds: 4,
  backdrop(ctx) {
    Sky.draw(ctx, 0, 0, W, 420, { seed: 61 });
    ctx.fillStyle = grassPattern(ctx, '#a9e28c');
    ctx.fillRect(0, 400, W, 500);
  },
  make() {
    const [emoji, name] = pick([['🥕', 'carrots'], ['🍅', 'tomatoes'], ['🌽', 'corn cobs'], ['🥦', 'broccoli'], ['🍓', 'strawberries'], ['🥒', 'cucumbers']]);
    const n = randi(2, 10);
    return {
      prompt: `How many ${name} did we pick?`,
      show(ctx, a) {
        ctx.fillStyle = '#f6e3c3';
        ctx.fillRect(a.x, a.y, a.w, a.h);
        drawCountables(ctx, { x: a.x + 40, y: a.y + 10, w: a.w - 80, h: a.h - 60 }, emoji, n, 74);
        drawEmoji(ctx, '🧺', a.x + a.w - 90, a.y + a.h - 70, 110);
      },
      choices: numberChoices(n, 10),
      after: `${NUMBER_WORDS[n]} ${name}!`,
    };
  },
});

const FLOWER_TYPES = [['tulip', 'tulip'], ['daisy', 'daisy'], ['rose', 'rose'], ['sunflower', 'sunflower']];
quizGame('flowers', {
  rounds: 5,
  backdrop(ctx) {
    Sky.draw(ctx, 0, 0, W, 420, { seed: 63 });
    ctx.fillStyle = grassPattern(ctx, '#a9e28c');
    ctx.fillRect(0, 400, W, 500);
    for (let i = 0; i < 12; i++) Art.flower(ctx, 60 + i * 135, 900, 1, Object.values(COLORS)[i % 7], ['tulip', 'daisy', 'rose'][i % 3], i);
  },
  make(i) {
    const names = Object.keys(COLORS);
    const opts = shuffle(FLOWER_TYPES).slice(0, 3).map(([k, n]) => ({ k, n, c: k === 'sunflower' ? 'yellow' : pick(names) }));
    const ask = i % 2 ? 'color' : 'kind', target = opts[0];
    if (ask === 'color') opts.forEach((o, j) => { if (j && o.c === target.c) o.c = names[(names.indexOf(target.c) + j * 2) % 7]; });
    S.garden.flowers = (S.garden.flowers || 0) + 1;
    return {
      prompt: ask === 'kind' ? `Can you find the ${target.n}?` : `Which flower is ${target.c}?`,
      show(ctx, a) {
        drawText(ctx, ask === 'kind' ? `🌷 ${target.n}` : `🎨 ${target.c}`, a.x + a.w / 2, a.y + a.h / 2 - 20, 90, { color: ask === 'kind' ? '#7b6a8f' : COLORS[target.c], stroke: '#fff', sw: 0.1 });
        drawText(ctx, 'Flowers need sun and water to grow!', a.x + a.w / 2, a.y + a.h - 50, 28, { color: '#7b6a8f' });
      },
      choices: opts.map(o => ({ correct: o === target, draw(ctx, x, y, s) { Art.flower(ctx, x, y + s * 0.5, s / 60, COLORS[o.c], o.k, x); } })),
      after: ask === 'kind' ? `A ${target.n}! So pretty!` : `The ${target.c} ${target.n}!`,
    };
  },
});
