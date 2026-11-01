// Picture books (illustrated pages, narration, page turns, tap a word to
// hear it, a question at the end) and family storytelling.

// Little scene painters used for book pictures.
const Pic = {
  sky(ctx, a, night = false) {
    const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h);
    g.addColorStop(0, night ? '#2b2f6e' : '#8fd3ff');
    g.addColorStop(1, night ? '#6a5aa8' : '#e6f7ff');
    ctx.fillStyle = g;
    ctx.fillRect(a.x, a.y, a.w, a.h);
  },
  ground(ctx, a, color = '#a6e08a') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + a.h * 0.72);
    ctx.quadraticCurveTo(a.x + a.w / 2, a.y + a.h * 0.62, a.x + a.w, a.y + a.h * 0.72);
    ctx.lineTo(a.x + a.w, a.y + a.h);
    ctx.lineTo(a.x, a.y + a.h);
    ctx.fill();
  },
  garden(ctx, a) {
    Pic.sky(ctx, a);
    Art.sun(ctx, a.x + a.w * 0.82, a.y + a.h * 0.2, a.h * 0.08);
    Art.cloud(ctx, a.x + a.w * 0.3, a.y + a.h * 0.18, a.h / 500);
    Pic.ground(ctx, a);
    for (let i = 0; i < 6; i++) Art.flower(ctx, a.x + a.w * (0.08 + i * 0.17), a.y + a.h * 0.95, a.h / 380, Object.values(COLORS)[i], ['tulip', 'daisy', 'rose'][i % 3], i);
  },
  night(ctx, a) {
    Pic.sky(ctx, a, true);
    ctx.fillStyle = '#fff';
    const rnd = seeded(5);
    for (let i = 0; i < 26; i++) { circle(ctx, a.x + rnd() * a.w, a.y + rnd() * a.h * 0.6, 2 + rnd() * 2); ctx.fill(); }
    Art.moon(ctx, a.x + a.w * 0.78, a.y + a.h * 0.22, a.h * 0.1);
  },
  room(ctx, a, wall = '#ffe9f2') {
    ctx.fillStyle = wall;
    ctx.fillRect(a.x, a.y, a.w, a.h);
    ctx.fillStyle = woodPattern(ctx, '#e9bd8c');
    ctx.fillRect(a.x, a.y + a.h * 0.72, a.w, a.h * 0.28);
  },
  ham(ctx, a, fx, opts = {}) { drawHamster(ctx, a.x + a.w * fx, a.y + a.h * 0.93, a.h * (opts.size || 0.5), { mood: 'happy', ...opts }); },
};

const BOOKS = {
  butterfly: { title: 'Hammy and the Blue Butterfly', cover: '#a9dcff', icon: '🦋', pages: [
    ['Hammy goes to the garden.', (c, a) => { Pic.garden(c, a); Pic.ham(c, a, 0.35, { pose: 'walk' }); }],
    ['Hammy sees a butterfly.', (c, a) => { Pic.garden(c, a); Pic.ham(c, a, 0.3, { pose: 'think', mood: 'curious' }); Art.butterfly(c, a.x + a.w * 0.68, a.y + a.h * 0.38, a.h / 180, COLORS.blue); }],
    ['The butterfly is blue!', (c, a) => { Pic.garden(c, a); Art.butterfly(c, a.x + a.w / 2, a.y + a.h * 0.42, a.h / 70, COLORS.blue); }],
    ['It flies to a red flower.', (c, a) => { Pic.garden(c, a); Art.flower(c, a.x + a.w * 0.55, a.y + a.h * 0.95, a.h / 110, COLORS.red, 'tulip', 3); Art.butterfly(c, a.x + a.w * 0.55, a.y + a.h * 0.42, a.h / 200, COLORS.blue); }],
    ['Bye-bye, butterfly! Hammy waves.', (c, a) => { Pic.garden(c, a); Pic.ham(c, a, 0.4, { pose: 'wave' }); Art.butterfly(c, a.x + a.w * 0.8, a.y + a.h * 0.2, a.h / 260, COLORS.blue); }],
  ], question: ['What color is the butterfly?', [['blue', true], ['red', false], ['yellow', false]].map(([c, ok]) => ({ correct: ok, label: c, draw(ctx, x, y, s) { Art.butterfly(ctx, x, y - 10, s / 60, COLORS[c]); } }))] },

  apples: { title: 'Five Little Apples', cover: '#ffb3b3', icon: '🍎', pages: [
    ['Look! An apple tree.', (c, a) => { Pic.garden(c, a); Art.tree(c, a.x + a.w / 2, a.y + a.h * 0.9, a.h / 300, { fruit: '#ff5c5c', seed: 7 }); }],
    ['One, two, three, four, five apples!', (c, a) => { Pic.sky(c, a); for (let i = 0; i < 5; i++) { drawEmoji(c, '🍎', a.x + a.w * (0.15 + i * 0.175), a.y + a.h * 0.45, a.h * 0.2); drawText(c, String(i + 1), a.x + a.w * (0.15 + i * 0.175), a.y + a.h * 0.7, a.h * 0.12, { color: PARTY[i] }); } }],
    ['Hammy picks the apples.', (c, a) => { Pic.garden(c, a); Pic.ham(c, a, 0.4, { pose: 'play' }); drawEmoji(c, '🧺', a.x + a.w * 0.72, a.y + a.h * 0.78, a.h * 0.25); }],
    ['Mom makes an apple pie.', (c, a) => { Pic.room(c, a, '#e6f8ef'); Pic.ham(c, a, 0.35, { kind: 'mom', pose: 'cook', size: 0.62 }); drawEmoji(c, '🥧', a.x + a.w * 0.72, a.y + a.h * 0.62, a.h * 0.25); }],
    ['Yum! Hammy shares with Dad.', (c, a) => { Pic.room(c, a, '#fff5dc'); Pic.ham(c, a, 0.3, { pose: 'eat', holding: '🥧' }); Pic.ham(c, a, 0.68, { kind: 'dad', size: 0.66 }); }],
  ], question: ['How many apples were on the tree?', [3, 5, 2].map(n => ({ correct: n === 5, label: String(n), big: 100 }))] },

  night: { title: 'Goodnight, Hammy', cover: '#c9b6ff', icon: '🌙', pages: [
    ['The sun goes down. It is evening.', (c, a) => { const g = c.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#ff9fb4'); g.addColorStop(1, '#ffd9a0'); c.fillStyle = g; c.fillRect(a.x, a.y, a.w, a.h); Art.sun(c, a.x + a.w / 2, a.y + a.h * 0.62, a.h * 0.12); Pic.ground(c, a, '#8fcf75'); }],
    ['Hammy has a warm bath.', (c, a) => { Pic.room(c, a, '#e4f6ff'); Pic.ham(c, a, 0.5, { pose: 'swim', size: 0.55, outfit: { hat: 'none', top: 'none' } }); Props.bathtub(c, a.x + a.w / 2, a.y + a.h * 0.98, a.w * 0.6, { bubbles: true }); }],
    ['Hammy brushes its teeth. Brush, brush!', (c, a) => { Pic.room(c, a, '#e4f6ff'); Pic.ham(c, a, 0.5, { pose: 'brush', size: 0.6 }); }],
    ['Mom reads a story in bed.', (c, a) => { Pic.room(c, a, '#e8f0ff'); Pic.ham(c, a, 0.32, { kind: 'mom', size: 0.62, pose: 'read' }); Pic.ham(c, a, 0.68, { pose: 'sleepy', size: 0.45 }); }],
    ['The moon and stars say goodnight.', (c, a) => { Pic.night(c, a); Pic.ham(c, a, 0.5, { pose: 'sleep', size: 0.45 }); }],
  ], question: ['Who reads the story?', [['mom', 'Mom', true], ['dad', 'Dad', false], ['pip', 'Pip', false]].map(([k, l, ok]) => ({ correct: ok, label: l, draw(ctx, x, y, s) { drawHamster(ctx, x, y + s * 0.45, s * 0.85, { kind: k, mood: 'happy' }); } }))] },

  rain: { title: 'Rainy Day', cover: '#b8e0ff', icon: '☔', pages: [
    ['Drip, drop! It is raining.', (c, a) => { Pic.sky(c, a); Art.cloud(c, a.x + a.w * 0.5, a.y + a.h * 0.2, a.h / 250, '#dfe6f0'); Pic.ground(c, a); Art.rain(c, a.x, a.y, a.w, a.h, 2); }],
    ['Hammy wears a yellow raincoat.', (c, a) => { Pic.sky(c, a); Pic.ground(c, a); Pic.ham(c, a, 0.5, { outfit: { hat: 'raincoat', top: 'tshirt' }, size: 0.6 }); }],
    ['Splash! Hammy jumps in a puddle.', (c, a) => { Pic.sky(c, a); Pic.ground(c, a); ellipse(c, a.x + a.w / 2, a.y + a.h * 0.9, a.w * 0.25, a.h * 0.06); c.fillStyle = '#7cc6ff'; c.fill(); Pic.ham(c, a, 0.5, { pose: 'jump', outfit: { hat: 'raincoat', top: 'none' } }); }],
    ['The rain stops. Look, a rainbow!', (c, a) => { Pic.sky(c, a); Art.rainbow(c, a.x + a.w / 2, a.y + a.h * 0.9, a.h * 0.7, 0.8); Pic.ground(c, a); Pic.ham(c, a, 0.3, { pose: 'celebrate', size: 0.4 }); }],
  ], question: ['What do we use when it rains?', [['☂️', 'umbrella', true], ['🕶️', 'sunglasses', false], ['🍦', 'ice cream', false]].map(([e, l, ok]) => ({ correct: ok, emoji: e, label: l }))] },

  swim: { title: 'Splash Time', cover: '#9fe6ff', icon: '🏊', pages: [
    ['Dad and Hammy go to the pool.', (c, a) => { Pic.sky(c, a); c.fillStyle = '#6fcdf2'; c.fillRect(a.x, a.y + a.h * 0.65, a.w, a.h * 0.35); Pic.ham(c, a, 0.3, { kind: 'dad', size: 0.6 }); Pic.ham(c, a, 0.62, { pose: 'walk' }); }],
    ['Hammy wears a float ring.', (c, a) => { Pic.sky(c, a); Pic.ham(c, a, 0.5, { pose: 'swim', size: 0.6 }); }],
    ['Kick, kick, kick! Hammy swims with Dad.', (c, a) => { Pic.sky(c, a); Art.water(c, a.x, a.y + a.h * 0.55, a.w, a.h * 0.45, 0); Pic.ham(c, a, 0.4, { pose: 'swim', size: 0.5 }); Pic.ham(c, a, 0.72, { kind: 'dad', pose: 'swim', size: 0.6 }); }],
    ['A yellow duck floats by. Quack!', (c, a) => { Pic.sky(c, a); Art.water(c, a.x, a.y + a.h * 0.5, a.w, a.h * 0.5, 0); Props.duck(c, a.x + a.w / 2, a.y + a.h * 0.7, a.h / 120); }],
  ], question: ['Who swims with Hammy?', [['dad', 'Dad', true], ['🐟', 'A fish', false], ['pip', 'Pip', false]].map(([k, l, ok]) => ({ correct: ok, label: l, draw(ctx, x, y, s) { if (k.length > 2) drawHamster(ctx, x, y + s * 0.45, s * 0.85, { kind: k }); else drawEmoji(ctx, k, x, y, s * 0.8); } }))] },

  stars: { title: 'Counting Stars', cover: '#6a5aa8', icon: '⭐', pages: [
    ['It is night. Look up at the sky!', (c, a) => { Pic.night(c, a); Pic.ham(c, a, 0.25, { pose: 'think', size: 0.4 }); }],
    ['One star.', (c, a) => { Pic.night(c, a); drawStar(c, a.x + a.w / 2, a.y + a.h * 0.45, a.h * 0.16); }],
    ['Two stars, three stars!', (c, a) => { Pic.night(c, a); for (let i = 0; i < 3; i++) drawStar(c, a.x + a.w * (0.25 + i * 0.25), a.y + a.h * (0.35 + (i % 2) * 0.2), a.h * 0.12); }],
    ['The sky is full of stars. Goodnight!', (c, a) => { Pic.night(c, a); for (let i = 0; i < 10; i++) drawStar(c, a.x + a.w * (0.08 + (i % 5) * 0.2), a.y + a.h * (0.2 + Math.floor(i / 5) * 0.3), a.h * 0.07); Pic.ham(c, a, 0.5, { pose: 'sleep', size: 0.4 }); }],
  ], question: ['When do we see the stars?', [['🌙', 'at night', true], ['☀️', 'at lunch', false], ['🛁', 'in the bath', false]].map(([e, l, ok]) => ({ correct: ok, emoji: e, label: l }))] },
};

defineGame('reading', {
  music: 'home',
  init(params) {
    this.book = null;
    this.page = 0;
    this.turn = 0;
    this.q = null;
    if (params.book && BOOKS[params.book]) this.open(params.book);
    else this.shelf();
  },
  shelf() {
    this.book = null;
    const ids = Object.keys(BOOKS);
    this.buttons = ids.map((id, i) => {
      const b = BOOKS[id], open = Rewards.unlocked('book', id), need = UNLOCKS.find(u => u.kind === 'book' && u.id === id);
      return { x: 160 + (i % 3) * 440, y: 230 + Math.floor(i / 3) * 290, w: 400, h: 250, color: open ? b.cover : '#e9e3f2', disabled: false,
        draw: (ctx, bb) => {
          drawEmoji(ctx, open ? b.icon : '🔒', bb.x + bb.w / 2, bb.y + 90, 100, { alpha: open ? 1 : 0.6 });
          const lines = wrapLines(ctx, b.title, bb.w - 40, 26);
          lines.forEach((l, j) => drawText(ctx, l, bb.x + bb.w / 2, bb.y + 170 + j * 30, 26, { color: open ? PAL.ink : '#9a8fb3' }));
          if (!open) drawText(ctx, `⭐ ${need?.stars}`, bb.x + bb.w - 50, bb.y + 30, 24, { color: '#9a8fb3' });
          if (S.books[id]?.done) drawText(ctx, '✅', bb.x + 34, bb.y + 34, 30);
        },
        onClick: () => { if (open) this.open(id); else { Snd.hmm(); this.say(`Collect ${need.stars} stars to unlock this book!`); } } };
    });
    this.say('Pick a book to read!');
  },
  open(id) {
    this.bookId = id;
    this.book = BOOKS[id];
    this.page = 0;
    this.q = null;
    S.books[id] = S.books[id] || { page: 0, done: false };
    this.buttons = [
      { x: 60, y: 420, w: 110, h: 110, emoji: '◀', color: '#ffffff', onClick: () => this.flip(-1) },
      { x: W - 170, y: 420, w: 110, h: 110, emoji: '▶', color: '#7ed99a', glow: true, onClick: () => this.flip(1) },
      { x: W - 170, y: 560, w: 110, h: 90, emoji: '🔊', color: '#fff3b8', onClick: () => this.read() },
    ];
    this.say(this.book.title, false);
    Speech.say(`${this.book.title}.`);
    setTimeout(() => this.read(), 1600);
  },
  read() {
    if (!this.book) return;
    if (this.q) return Speech.say(this.q.prompt);
    const who = this.act.with ? `${FAMILY[this.buddy()]?.name || ''} reads: ` : '';
    Speech.say(this.book.pages[this.page][0], { force: true });
    this.prompt = `${who}📖 Page ${this.page + 1} of ${this.book.pages.length}`;
  },
  flip(dir) {
    if (!this.book || this.q || this.turn) return;
    const next = this.page + dir;
    if (next < 0) return;
    if (next >= this.book.pages.length) return this.ask();
    this.turn = dir;
    this.turnT = 0;
    Snd.page();
    this.score++;
    setTimeout(() => { this.page = next; S.books[this.bookId].page = next; this.read(); }, 260);
  },
  ask() {
    const [prompt, choices] = this.book.question;
    this.q = { prompt, choices: shuffle(choices).map(c => ({ ...c, out: false })), solved: false };
    this.buttons = [];
    this.say(prompt);
  },
  tick(dt) {
    if (this.turn) {
      this.turnT += dt;
      if (this.turnT > 0.5) this.turn = 0;
    }
  },
  render(ctx) {
    gameBackdrop(ctx, '#e3f3ff', '#d2ebff', { pattern: 'leaves', accent: '#d8efff' });
    if (!this.book) {
      drawText(ctx, '📚 Hammy\'s Bookshelf', W / 2, 180, 44, { color: '#5b8fd0' });
      this.drawCheer(ctx, 130, H - 10, 160);
      return;
    }
    if (this.q) return this.renderQuestion(ctx);
    // An open book: picture on the left, words on the right.
    const bx = 200, by = 190, bw = 1200, bh = 600;
    groundShadow(ctx, W / 2, by + bh + 20, 640, 30);
    box(ctx, bx - 16, by - 12, bw + 32, bh + 28, 26, this.book.cover, { lw: 4 });
    box(ctx, bx, by, bw / 2, bh, 14, '#fffdf6', { lw: 2, line: '#e8dcc8' });
    box(ctx, bx + bw / 2, by, bw / 2, bh, 14, '#fffdf6', { lw: 2, line: '#e8dcc8' });
    const [text, pic] = this.book.pages[this.page];
    const a = { x: bx + 30, y: by + 30, w: bw / 2 - 60, h: bh - 60 };
    ctx.save();
    rr(ctx, a.x, a.y, a.w, a.h, 18);
    ctx.clip();
    pic(ctx, a);
    ctx.restore();
    const lines = wrapLines(ctx, text, bw / 2 - 120, 52);
    this.words = [];
    ctx.font = `700 52px ${FONT}`;
    lines.forEach((l, i) => {
      let x = bx + bw / 2 + 60;
      const y = by + bh / 2 - (lines.length - 1) * 38 + i * 76;
      for (const w of l.split(' ')) {
        const ww = ctx.measureText(w + ' ').width;
        drawText(ctx, w, x, y, 52, { align: 'left' });
        this.words.push({ w: w.replace(/[^A-Za-z'-]/g, ''), x, y, ww });
        x += ww;
      }
    });
    drawText(ctx, `${this.page + 1}`, bx + bw * 0.75, by + bh - 34, 26, { color: '#b8aec8' });
    drawText(ctx, '👆 Tap a word to hear it', bx + bw * 0.75, by + bh - 80, 22, { color: '#9a8fb3' });
    if (this.turn) {
      const p = this.turnT / 0.5, sx = Math.cos(p * Math.PI);
      ctx.save();
      ctx.translate(bx + bw / 2, by);
      ctx.scale(this.turn > 0 ? sx : -sx, 1);
      box(ctx, 0, 0, bw / 2, bh, 14, '#f6efe0', { lw: 2, line: '#e8dcc8' });
      ctx.restore();
    }
    const b = this.buddy();
    if (b) drawHamster(ctx, 110, H - 20, 230, { kind: b, pose: 'read', mood: 'happy' });
    drawHamster(ctx, b ? 250 : 130, H - 10, 160, { pose: 'sit', mood: 'happy' });
  },
  renderQuestion(ctx) {
    drawText(ctx, '🤔', W / 2, 260, 100);
    drawText(ctx, this.q.prompt, W / 2, 380, 46);
    this.q.choices.forEach((c, i) => {
      const x = 260 + i * 400, y = 470, good = this.q.solved && c.correct;
      card(ctx, x, y, 320, 280, { color: good ? '#d9f8e1' : '#ffffff', alpha: c.out ? 0.35 : 1, glow: good });
      if (c.draw) c.draw(ctx, x + 160, y + 120, 180);
      else if (c.emoji) drawEmoji(ctx, c.emoji, x + 160, y + 110, 130);
      drawText(ctx, c.label, x + 160, c.big ? y + 140 : y + 240, c.big || 32);
    });
    this.drawCheer(ctx, 130, H - 10, 160);
  },
  down(p) {
    if (this.q) {
      if (this.q.solved) return;
      const i = this.q.choices.findIndex((c, i) => p.x >= 260 + i * 400 && p.x <= 580 + i * 400 && p.y >= 470 && p.y <= 750);
      const c = this.q.choices[i];
      if (!c || c.out) return;
      if (c.correct) {
        this.q.solved = true;
        S.books[this.bookId].done = true;
        this.good(420 + i * 400, 470, 'Right!');
        Speech.say(`Yes! ${c.label}! What a good reader!`);
        Rewards.check(null);
        setTimeout(() => this.finish(1, 'Great reading! 📚'), 1200);
      } else {
        c.out = true;
        this.oops(420 + i * 400, 470);
      }
      return;
    }
    if (!this.book) return;
    const w = this.words?.find(w => p.x >= w.x && p.x <= w.x + w.ww && Math.abs(p.y - w.y) < 34);
    if (w?.w) {
      Speech.say(w.w, { force: true });
      FX.sparkle(w.x + w.ww / 2, w.y, 3);
      Snd.sparkle();
    } else if (p.x > W / 2) this.flip(1);
  },
  keyDown(e) {
    if (e.code === 'ArrowRight' || e.code === 'Space') this.flip(1);
    if (e.code === 'ArrowLeft') this.flip(-1);
    if (this.q) {
      const n = Number(e.key);
      if (n >= 1 && n <= 3) this.down({ x: 420 + (n - 1) * 400, y: 600 });
    }
  },
  hammyAt() { return { x: 800, y: 400 }; },
});

// ----------------------------------------------------- family storytelling

const STORY_PARTS = [
  { ask: 'Who is in our story?', opts: [['🐹', 'hammy', 'Hammy'], ['🦕', '🦕', 'a friendly dinosaur'], ['🐰', '🐰', 'a little bunny'], ['🤖', '🤖', 'a silly robot']] },
  { ask: 'Where do they go?', opts: [['🏖️', 'beach', 'to the beach'], ['🌲', 'forest', 'into the forest'], ['🚀', 'space', 'up to space'], ['🏰', 'castle', 'to a castle']] },
  { ask: 'What happens?', opts: [['💎', '💎', 'they find a shiny treasure'], ['🎂', '🎂', 'they bake a giant cake'], ['🪁', '🪁', 'they fly a rainbow kite'], ['🐉', '🐉', 'they meet a kind dragon']] },
];

defineGame('story', {
  init() {
    this.step = 0;
    this.picks = [];
    this.telling = false;
    this.setChoices();
  },
  setChoices() {
    const part = STORY_PARTS[this.step];
    this.buttons = part.opts.map(([e, , label], i) => ({ x: 170 + i * 330, y: 560, w: 300, h: 220, emoji: e, color: ['#ffd6e5', '#d8efff', '#fff3b8', '#e2f8e7'][i], onClick: () => this.choose(i) }));
    this.say(part.ask);
  },
  choose(i) {
    this.picks.push(STORY_PARTS[this.step].opts[i]);
    this.score++;
    Snd.pop();
    this.step++;
    if (this.step < STORY_PARTS.length) this.setChoices();
    else this.tell();
  },
  tell() {
    this.buttons = [];
    this.telling = true;
    const [who, where, what] = this.picks;
    this.lines = [`Once upon a time, ${who[1] === 'hammy' ? S.hamster.name : who[2]} went ${where[2]}.`, `And guess what? ${what[2][0].toUpperCase() + what[2].slice(1)}!`, `Everyone laughed and hugged. The end!`];
    this.panel = 0;
    this.say(this.lines[0]);
    this.timer = 0;
  },
  tick(dt) {
    if (!this.telling) return;
    this.timer += dt;
    if (this.timer > 4.5) {
      this.timer = 0;
      this.panel++;
      if (this.panel >= this.lines.length) {
        this.telling = false;
        this.finish(1, 'What a great story!');
      } else this.say(this.lines[this.panel]);
    }
  },
  render(ctx) {
    gameBackdrop(ctx, '#f1e8ff', '#e6d9ff', { pattern: 'hearts', accent: '#e9dcff' });
    drawHamster(ctx, 1300, 520, 250, { kind: 'mom', mood: 'happy', facing: -1, pose: this.telling ? 'read' : 'idle' });
    drawHamster(ctx, 1460, 520, 270, { kind: 'dad', mood: 'happy', facing: -1, pose: this.telling && this.panel === 2 ? 'celebrate' : 'idle' });
    drawHamster(ctx, 1130, 520, 180, { pose: this.telling ? 'sit' : 'think', mood: 'excited' });
    // Story panels so far
    for (let i = 0; i < 3; i++) {
      const x = 120 + i * 320, y = 190, p = this.picks[i];
      card(ctx, x, y, 290, 300, { color: p ? '#ffffff' : '#f3ecf8', glow: this.telling && this.panel === i });
      if (!p) { drawText(ctx, ['Who?', 'Where?', 'What?'][i], x + 145, y + 150, 40, { color: '#c9b6e8' }); continue; }
      const a = { x: x + 15, y: y + 15, w: 260, h: 270 };
      ctx.save();
      rr(ctx, a.x, a.y, a.w, a.h, 20);
      ctx.clip();
      if (i === 1) {
        const bg = { beach: ['#9fdcff', '#f7e2aa'], forest: ['#bfe9a8', '#78c25e'], space: ['#2b2f6e', '#6a5aa8'], castle: ['#ffd6e5', '#c9b6ff'] }[p[1]];
        const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h);
        g.addColorStop(0, bg[0]);
        g.addColorStop(1, bg[1]);
        ctx.fillStyle = g;
        ctx.fillRect(a.x, a.y, a.w, a.h);
      }
      if (p[1] === 'hammy') drawHamster(ctx, a.x + a.w / 2, a.y + a.h - 20, 200, { mood: 'happy', pose: 'wave' });
      else drawEmoji(ctx, p[0], a.x + a.w / 2, a.y + a.h / 2, 150);
      ctx.restore();
    }
  },
  hammyAt() { return { x: 1130, y: 400 }; },
});
