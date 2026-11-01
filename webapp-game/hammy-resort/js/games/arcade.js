// Games Zone: memory cards, bowling, shape and color sorting, a jigsaw
// puzzle and air hockey.

function arcadeBackdrop(ctx) {
  gameBackdrop(ctx, '#5b4a8a', '#3e3270');
  Props.beams(ctx, Game.time, 0.07);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 197) % W, y = (i * 131) % H;
    starPath(ctx, x, y, 6);
    ctx.fill();
  }
}

// ------------------------------------------------------------------ memory

const MEMORY_FACES = [['🐶', 'puppy'], ['🐱', 'kitty'], ['🐰', 'bunny'], ['🐸', 'frog'], ['🦊', 'fox'], ['🐼', 'panda'], ['🍓', 'strawberry'], ['🍌', 'banana'], ['🌈', 'rainbow'], ['⭐', 'star'], ['🚗', 'car'], ['🎈', 'balloon']];

defineGame('memory', {
  music: 'games',
  init() {
    const faces = shuffle(MEMORY_FACES).slice(0, 6);
    this.cards = shuffle([...faces, ...faces]).map((f, i) => ({ f, i, up: false, done: false, flip: 0 }));
    this.open = [];
    this.flips = 0;
    this.lock = 0;
    this.focus = 0;
    this.say('Find the matching pairs! Tap two cards.');
  },
  cardRect(i) {
    const c = i % 4, r = Math.floor(i / 4), w = 210, h = 200;
    return { x: 340 + c * (w + 30), y: 200 + r * (h + 26), w, h };
  },
  tick(dt) {
    for (const c of this.cards) c.flip += ((c.up || c.done ? 1 : 0) - c.flip) * Math.min(1, dt * 10);
    if (this.lock > 0 && (this.lock -= dt) <= 0) {
      for (const c of this.open) c.up = false;
      this.open = [];
    }
  },
  render(ctx) {
    arcadeBackdrop(ctx);
    for (const c of this.cards) {
      const R = this.cardRect(c.i), sx = Math.abs(Math.cos(c.flip * Math.PI)), front = c.flip > 0.5;
      ctx.save();
      ctx.translate(R.x + R.w / 2, R.y + R.h / 2);
      ctx.scale(Math.max(0.02, sx), 1);
      const focus = Input.lastDevice === 'key' && c.i === this.focus;
      card(ctx, -R.w / 2, -R.h / 2, R.w, R.h, { color: front ? (c.done ? '#d9f8e1' : '#ffffff') : '#ff8fb8', glow: focus });
      if (front) {
        drawEmoji(ctx, c.f[0], 0, -14, 110);
        drawText(ctx, c.f[1], 0, R.h / 2 - 30, 24);
      } else {
        drawStar(ctx, 0, 0, 44, '#ffe48a');
        drawText(ctx, '?', 0, 4, 40, { color: '#ff6f9c' });
      }
      ctx.restore();
    }
    drawText(ctx, `🃏 ${this.cards.filter(c => c.done).length / 2} / 6 pairs`, 170, 200, 30, { color: '#ffe066' });
    this.drawCheer(ctx, 160, H - 20, 170);
  },
  pick(i) {
    const c = this.cards[i];
    if (!c || c.up || c.done || this.lock > 0 || this.open.length >= 2) return;
    c.up = true;
    this.open.push(c);
    this.flips++;
    Snd.page();
    Speech.say(c.f[1]);
    if (this.open.length === 2) {
      const [a, b] = this.open;
      if (a.f === b.f) {
        a.done = b.done = true;
        this.open = [];
        const R = this.cardRect(b.i);
        this.good(R.x + R.w / 2, R.y, `Two ${a.f[1]}s!`);
        if (this.cards.every(x => x.done)) setTimeout(() => this.finish(this.flips <= 20 ? 1 : 0, 'Super memory! 🧠'), 600);
      } else this.lock = 1.1;
    }
  },
  down(p) {
    const i = this.cards.findIndex(c => { const R = this.cardRect(c.i); return p.x >= R.x && p.x <= R.x + R.w && p.y >= R.y && p.y <= R.y + R.h; });
    if (i >= 0) this.pick(i);
  },
  keyDown(e) {
    const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[e.code];
    if (mv) this.focus = (this.focus + mv + 12) % 12;
    if (e.code === 'Enter' || e.code === 'Space') this.pick(this.focus);
  },
});

// ----------------------------------------------------------------- bowling

defineGame('bowling', {
  music: 'games',
  init() {
    this.frame = 0;
    this.frames = 3;
    this.total = 0;
    this.setPins();
    this.ball = null;
    this.aim = 0;
    this.say('Tap to roll the ball when the arrow points where you want!');
  },
  setPins() {
    this.pins = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) this.pins.push({ x: (c - r / 2) * 0.16, d: 0.86 + r * 0.04, down: false, vx: 0, vd: 0, fall: 0 });
    this.roll = 0;
  },
  // Lane coordinates (x in -0.5..0.5, depth d 0..1) to screen.
  toScreen(x, d) {
    const w = lerp(700, 240, d), y = lerp(860, 300, d);
    return { x: 800 + x * w, y, s: lerp(1, 0.38, d) };
  },
  tick(dt) {
    if (!this.ball) { this.aim = Math.sin(Game.time * 1.6) * 0.38; return; }
    const b = this.ball;
    b.d += 0.55 * dt;
    b.x += b.vx * dt;
    if (Math.abs(b.x) > 0.42) { b.x = Math.sign(b.x) * 0.42; b.vx *= -0.6; Snd.thud(); }
    for (const p of this.pins) {
      if (!p.down && Math.abs(p.x - b.x) < 0.09 && Math.abs(p.d - b.d) < 0.03) this.knock(p, Math.sign(p.x - b.x || rand(-1, 1)) * 0.3, 0.3);
      if (p.down && p.fall < 1) {
        p.fall += dt * 3;
        p.x += p.vx * dt;
        p.d += p.vd * dt;
        for (const q of this.pins) if (!q.down && Math.abs(q.x - p.x) < 0.07 && Math.abs(q.d - p.d) < 0.03) this.knock(q, p.vx * 0.8 + rand(-0.1, 0.1), p.vd * 0.7);
      }
    }
    if (b.d > 1.08 && !b.done) {
      b.done = true;
      setTimeout(() => this.afterRoll(), 900);
    }
  },
  knock(p, vx, vd) {
    p.down = true;
    p.vx = vx;
    p.vd = vd;
    Snd.kick();
    FX.burst(this.toScreen(p.x, p.d).x, this.toScreen(p.x, p.d).y - 30, { n: 6, kind: 'star', size: 8, speed: 200, colors: ['#ffe48a'] });
  },
  afterRoll() {
    const down = this.pins.filter(p => p.down).length;
    this.ball = null;
    this.roll++;
    if (down === 10 && this.roll === 1) {
      this.say('STRIKE! All the pins!');
      this.good(800, 300, 'Strike!');
      FX.confetti(60);
    } else FX.text(800, 300, `${down} pins!`, '#ffe066', 52);
    if (this.roll >= 2 || down === 10) {
      this.total += down;
      this.score++;
      this.frame++;
      if (this.frame >= this.frames) return this.finish(this.total >= 20 ? 1 : 0, `${this.total} pins! 🎳`);
      setTimeout(() => { this.setPins(); this.say(`Roll ${this.frame + 1}! Knock them down!`); }, 600);
    } else this.say(`${down} down! Roll again!`);
  },
  release() {
    if (this.ball) return;
    this.ball = { x: 0, d: 0, vx: this.aim * 0.4 };
    Snd.whoosh();
  },
  render(ctx) {
    arcadeBackdrop(ctx);
    // Lane with bumpers so the ball never falls in the gutter.
    const a = this.toScreen(-0.5, 0), b = this.toScreen(0.5, 0), c = this.toScreen(0.5, 1.1), d = this.toScreen(-0.5, 1.1);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
    ctx.fillStyle = woodPattern(ctx, '#f0c890');
    ctx.fill();
    for (const side of [-1, 1]) {
      const p1 = this.toScreen(side * 0.5, 0), p2 = this.toScreen(side * 0.5, 1.1);
      ctx.strokeStyle = side < 0 ? '#ff8fb8' : '#7cc6ff';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let i = 0; i < 7; i++) { const p = this.toScreen((i - 3) * 0.1, 0.25); drawText(ctx, '▲', p.x, p.y, 20 * p.s + 6, { color: '#ffb3cf' }); }
    const items = [];
    for (const p of this.pins) items.push({ d: p.d, draw: () => {
      const s = this.toScreen(p.x, p.d), h = 80 * s.s;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(p.down ? Math.min(1, p.fall) * 1.4 * Math.sign(p.vx || 1) : 0);
      ellipse(ctx, 0, -h * 0.45, h * 0.18, h * 0.45);
      paint(ctx, '#ffffff', -h, 0, { lw: 2 });
      circle(ctx, 0, -h * 0.95, h * 0.13);
      paint(ctx, '#ffffff', -h * 1.1, -h * 0.8, { lw: 2 });
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(-h * 0.14, -h * 0.78, h * 0.28, h * 0.08);
      ctx.restore();
    } });
    if (this.ball) items.push({ d: this.ball.d, draw: () => { const s = this.toScreen(this.ball.x, this.ball.d); circle(ctx, s.x, s.y - 40 * s.s, 40 * s.s); paint(ctx, '#b197fc', s.y - 80 * s.s, s.y, { lw: 3 }); } });
    items.sort((x, y) => y.d - x.d);
    for (const it of items) it.draw();
    if (!this.ball) {
      const s = this.toScreen(0, 0.02);
      ctx.save();
      ctx.translate(s.x, s.y - 40);
      ctx.rotate(this.aim * 1.4);
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.moveTo(0, -170); ctx.lineTo(26, -120); ctx.lineTo(9, -120); ctx.lineTo(9, -40); ctx.lineTo(-9, -40); ctx.lineTo(-9, -120); ctx.lineTo(-26, -120); ctx.closePath();
      ctx.fill();
      ctx.restore();
      circle(ctx, s.x, s.y - 40, 40);
      paint(ctx, '#b197fc', s.y - 80, s.y, { lw: 3 });
    }
    drawHamster(ctx, 1320, 860, 220, { pose: this.ball ? 'celebrate' : 'play', mood: 'excited', facing: -1 });
    box(ctx, 80, 160, 300, 150, 20, '#2b2550', { lw: 3, line: '#8d7ae0' });
    drawText(ctx, `🎳 Roll ${Math.min(this.frame + 1, this.frames)} / ${this.frames}`, 230, 205, 26, { color: '#ffffff' });
    drawText(ctx, `${this.total} pins`, 230, 260, 40, { color: '#ffe066' });
  },
  down() { this.release(); },
  keyDown(e) { if (e.code === 'Space' || e.code === 'Enter') this.release(); },
  hammyAt() { return { x: 1320, y: 700 }; },
});

// ------------------------------------------------------- shapes and colors

dragGame('shapematch', {
  prompt: 'Put each shape in its matching hole!',
  music: 'games',
  setup() {
    const cols = shuffle(Object.values(COLORS));
    return {
      items: shuffle(SHAPES).map((s, i) => ({ key: s, c: cols[i], x: 200 + i * 240, y: 780, size: 140, draw(ctx, x, y, sz, it) { drawShape(ctx, it.key, x, y, sz * 0.9, it.c); } })),
      slots: SHAPES.map((s, i) => ({ key: s, x: 260 + (i % 3) * 380, y: 200 + Math.floor(i / 3) * 230, w: 320, h: 200, draw(ctx, sl, hover) {
        card(ctx, sl.x, sl.y, sl.w, sl.h, { color: hover ? '#fff3b8' : '#f3ecf8' });
        ctx.save();
        drawShape(ctx, s, sl.x + sl.w / 2, sl.y + sl.h / 2, 150, '#d8cfe6');
        ctx.restore();
        if (!sl.filled.length) drawText(ctx, s, sl.x + sl.w / 2, sl.y + sl.h - 18, 20, { color: '#9a8fb3' });
      } })),
    };
  },
  render(ctx) { arcadeBackdrop(ctx); },
  onPick(it) { Speech.say(it.key); },
  onPlace(it) { Speech.say(`The ${it.key}!`); },
});

dragGame('colormatch', {
  prompt: 'Sort the balls! Each ball goes in the bucket of the same color.',
  music: 'games',
  setup() {
    const names = shuffle(Object.keys(COLORS)).slice(0, 4);
    this.names = names;
    const balls = shuffle(names.flatMap(n => [n, n]));
    return {
      items: balls.map((n, i) => ({ key: n, x: 180 + i * 160, y: 330 + (i % 2) * 90, size: 100, draw(ctx, x, y, s) { circle(ctx, x, y, s * 0.4); paint(ctx, COLORS[n], y - s * 0.4, y + s * 0.4, { lw: 3 }); ctx.fillStyle = 'rgba(255,255,255,.55)'; circle(ctx, x - s * 0.13, y - s * 0.14, s * 0.1); ctx.fill(); } })),
      slots: names.map((n, i) => ({ key: n, x: 190 + i * 320, y: 580, w: 260, h: 250, draw(ctx, sl, hover) {
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y + 40);
        ctx.lineTo(sl.x + sl.w, sl.y + 40);
        ctx.lineTo(sl.x + sl.w - 30, sl.y + sl.h);
        ctx.lineTo(sl.x + 30, sl.y + sl.h);
        ctx.closePath();
        paint(ctx, hover ? shade(COLORS[n], 0.3) : COLORS[n], sl.y, sl.y + sl.h, { lw: 4 });
        ellipse(ctx, sl.x + sl.w / 2, sl.y + 40, sl.w / 2, 24);
        paint(ctx, shade(COLORS[n], -0.15), sl.y + 16, sl.y + 64, { lw: 4 });
        drawText(ctx, n, sl.x + sl.w / 2, sl.y + 160, 34, { color: '#ffffff', stroke: shade(COLORS[n], -0.35), sw: 0.15 });
      } })),
    };
  },
  place(it, sl) { const k = sl.filled.length - 1; return { x: sl.x + sl.w / 2 + (k ? 40 : -40), y: sl.y + 60 }; },
  render(ctx) { arcadeBackdrop(ctx); },
  onPick(it) { Speech.say(it.key); },
  praise: (it) => `${it.key}!`,
});

// ------------------------------------------------------------------ jigsaw

defineGame('jigsaw', {
  music: 'games',
  init() {
    this.cols = 3;
    this.rows = 2;
    this.pw = 220;
    this.ph = 200;
    this.ox = 470;
    this.oy = 240;
    this.img = document.createElement('canvas');
    this.img.width = this.pw * this.cols;
    this.img.height = this.ph * this.rows;
    const g = this.img.getContext('2d'), a = { x: 0, y: 0, w: this.img.width, h: this.img.height };
    const pics = [
      () => { Pic.garden(g, a); Art.rainbow(g, a.w / 2, a.h * 0.95, a.h * 0.8, 0.7); drawHamster(g, a.w / 2, a.h * 0.95, a.h * 0.55, { pose: 'wave', mood: 'happy' }); },
      () => { Pic.sky(g, a); Art.water(g, 0, a.h * 0.55, a.w, a.h * 0.45, 0); Props.duck(g, a.w * 0.25, a.h * 0.75, 1.3); drawHamster(g, a.w * 0.62, a.h * 0.95, a.h * 0.5, { pose: 'swim', mood: 'happy' }); },
      () => { Pic.night(g, a); Pic.ground(g, a, '#5f8f5a'); drawHamster(g, a.w * 0.35, a.h * 0.93, a.h * 0.5, { kind: 'mom', mood: 'happy' }); drawHamster(g, a.w * 0.62, a.h * 0.93, a.h * 0.55, { kind: 'dad', mood: 'happy' }); drawHamster(g, a.w * 0.49, a.h * 0.95, a.h * 0.38, { mood: 'happy' }); },
    ];
    pics[(S.counts.jigsaw || 0) % pics.length]();
    // Tabs: each inside edge bumps out (+1) or in (-1).
    this.tabsR = Array.from({ length: this.rows }, () => Array.from({ length: this.cols - 1 }, () => (Math.random() < 0.5 ? 1 : -1)));
    this.tabsB = Array.from({ length: this.rows - 1 }, () => Array.from({ length: this.cols }, () => (Math.random() < 0.5 ? 1 : -1)));
    this.pieces = [];
    const spots = shuffle([[160, 330], [160, 590], [1440, 330], [1440, 590], [330, 770], [1270, 770]]);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const [x, y] = spots[this.pieces.length];
      this.pieces.push({ r, c, x, y, placed: false });
    }
    this.drag = null;
    this.say('Put the puzzle pieces in the frame!');
  },
  // The outline of one piece, centered on its own middle.
  piecePath(ctx, pc) {
    const { pw, ph } = this, x0 = -pw / 2, y0 = -ph / 2, k = 0.18;
    const top = pc.r > 0 ? -this.tabsB[pc.r - 1][pc.c] : 0, bottom = pc.r < this.rows - 1 ? this.tabsB[pc.r][pc.c] : 0;
    const left = pc.c > 0 ? -this.tabsR[pc.r][pc.c - 1] : 0, right = pc.c < this.cols - 1 ? this.tabsR[pc.r][pc.c] : 0;
    const edge = (ax, ay, bx, by, t, nx, ny) => {
      const mx = (ax + bx) / 2, my = (ay + by) / 2, len = Math.hypot(bx - ax, by - ay), r = len * k;
      if (!t) return ctx.lineTo(bx, by);
      const ux = (bx - ax) / len, uy = (by - ay) / len;
      ctx.lineTo(mx - ux * r, my - uy * r);
      ctx.arc(mx + nx * t * r * 0.2, my + ny * t * r * 0.2, r, Math.atan2(-uy, -ux), Math.atan2(uy, ux), t * (nx * uy - ny * ux) < 0);
      ctx.lineTo(bx, by);
    };
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    edge(x0, y0, x0 + pw, y0, top, 0, -1);
    edge(x0 + pw, y0, x0 + pw, y0 + ph, right, 1, 0);
    edge(x0 + pw, y0 + ph, x0, y0 + ph, bottom, 0, 1);
    edge(x0, y0 + ph, x0, y0, left, -1, 0);
    ctx.closePath();
  },
  home(pc) { return { x: this.ox + pc.c * this.pw + this.pw / 2, y: this.oy + pc.r * this.ph + this.ph / 2 }; },
  drawPiece(ctx, pc, lift = 0) {
    ctx.save();
    ctx.translate(pc.x, pc.y - lift);
    if (lift) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10; }
    this.piecePath(ctx, pc);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.clip();
    ctx.drawImage(this.img, -this.pw / 2 - pc.c * this.pw, -this.ph / 2 - pc.r * this.ph);
    ctx.restore();
    ctx.save();
    ctx.translate(pc.x, pc.y - lift);
    this.piecePath(ctx, pc);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.stroke();
    ctx.restore();
  },
  render(ctx) {
    arcadeBackdrop(ctx);
    const fw = this.pw * this.cols, fh = this.ph * this.rows;
    box(ctx, this.ox - 24, this.oy - 24, fw + 48, fh + 48, 20, '#e0b07c', { lw: 4 });
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.drawImage(this.img, this.ox, this.oy);
    ctx.restore();
    for (const pc of this.pieces) if (pc.placed) this.drawPiece(ctx, pc);
    for (const pc of this.pieces) if (!pc.placed && pc !== this.drag) this.drawPiece(ctx, pc);
    if (this.drag) this.drawPiece(ctx, this.drag, 8);
    drawText(ctx, `🧩 ${this.pieces.filter(p => p.placed).length} / ${this.pieces.length}`, 800, 200, 30, { color: '#ffe066' });
  },
  down(p) {
    const pc = [...this.pieces].reverse().find(q => !q.placed && Math.abs(p.x - q.x) < this.pw * 0.55 && Math.abs(p.y - q.y) < this.ph * 0.55);
    if (!pc) return;
    this.drag = pc;
    pc.dx = pc.x - p.x;
    pc.dy = pc.y - p.y;
    Snd.tap();
  },
  move(p) { if (this.drag) { this.drag.x = p.x + this.drag.dx; this.drag.y = p.y + this.drag.dy; } },
  up() {
    const pc = this.drag;
    if (!pc) return;
    this.drag = null;
    const h = this.home(pc);
    if (dist(pc.x, pc.y, h.x, h.y) < 70) {
      pc.x = h.x;
      pc.y = h.y;
      pc.placed = true;
      this.good(h.x, h.y - 60, 'Click!');
      if (this.pieces.every(q => q.placed)) setTimeout(() => this.finish(1, 'Puzzle done! 🧩'), 500);
    }
  },
});

// -------------------------------------------------------------- air hockey

defineGame('airhockey', {
  music: 'games',
  init() {
    this.t0 = { x: 400, y: 160, w: 800, h: 680 };
    const T = this.t0;
    this.me = { x: T.x + T.w / 2, y: T.y + T.h - 90, r: 44 };
    this.ai = { x: T.x + T.w / 2, y: T.y + 90, r: 44 };
    this.puck = { x: T.x + T.w / 2, y: T.y + T.h / 2, vx: 0, vy: 0, r: 26 };
    this.mine = 0;
    this.theirs = 0;
    this.goal = 5;
    this.say('Push the puck into the top goal! First to 5!');
  },
  tick(dt) {
    const T = this.t0, me = this.me, ai = this.ai, pk = this.puck;
    const [dx, dy] = Input.dir();
    if (dx || dy) { me.x += dx * 600 * dt; me.y += dy * 600 * dt; }
    else if (Input.pointer.inside && Input.lastDevice !== 'key') { me.x += (Input.pointer.x - me.x) * Math.min(1, dt * 14); me.y += (Input.pointer.y - me.y) * Math.min(1, dt * 14); }
    me.x = clamp(me.x, T.x + me.r, T.x + T.w - me.r);
    me.y = clamp(me.y, T.y + T.h / 2 + me.r, T.y + T.h - me.r);
    // A gentle opponent: slow, and often lets the puck through.
    const tx = pk.y < T.y + T.h / 2 ? pk.x : T.x + T.w / 2 + Math.sin(Game.time) * 120;
    ai.x += clamp(tx - ai.x, -230 * dt, 230 * dt);
    ai.y += ((pk.y < T.y + T.h / 2 ? pk.y - 50 : T.y + 90) - ai.y) * Math.min(1, dt * 1.5);
    ai.x = clamp(ai.x, T.x + ai.r, T.x + T.w - ai.r);
    ai.y = clamp(ai.y, T.y + ai.r, T.y + T.h / 2 - ai.r);
    pk.vx *= 1 - 0.35 * dt;
    pk.vy *= 1 - 0.35 * dt;
    pk.x += pk.vx * dt;
    pk.y += pk.vy * dt;
    for (const m of [me, ai]) {
      const d = dist(pk.x, pk.y, m.x, m.y);
      if (d < pk.r + m.r) {
        const nx = (pk.x - m.x) / (d || 1), ny = (pk.y - m.y) / (d || 1), sp = Math.max(520, Math.hypot(pk.vx, pk.vy) * 0.9) * (m === ai ? 0.75 : 1.1);
        pk.vx = nx * sp;
        pk.vy = ny * sp;
        pk.x = m.x + nx * (pk.r + m.r + 1);
        pk.y = m.y + ny * (pk.r + m.r + 1);
        Snd.kick();
      }
    }
    const gw = 260, inGoal = Math.abs(pk.x - (T.x + T.w / 2)) < gw / 2;
    if (pk.x < T.x + pk.r || pk.x > T.x + T.w - pk.r) { pk.vx *= -1; pk.x = clamp(pk.x, T.x + pk.r, T.x + T.w - pk.r); Snd.bounce(); }
    if (pk.y < T.y + pk.r) {
      if (inGoal) return this.scored(true);
      pk.vy *= -1; pk.y = T.y + pk.r; Snd.bounce();
    }
    if (pk.y > T.y + T.h - pk.r) {
      if (inGoal) return this.scored(false);
      pk.vy *= -1; pk.y = T.y + T.h - pk.r; Snd.bounce();
    }
  },
  scored(mine) {
    const T = this.t0, pk = this.puck;
    if (mine) {
      this.mine++;
      this.good(T.x + T.w / 2, T.y + 60, 'GOAL!');
      FX.confetti(30);
    } else {
      this.theirs++;
      FX.text(T.x + T.w / 2, T.y + T.h - 60, 'Their point! Keep going!', '#7cc6ff', 34);
    }
    Object.assign(pk, { x: T.x + T.w / 2, y: T.y + T.h / 2 + (mine ? -80 : 80), vx: 0, vy: 0 });
    if (this.mine >= this.goal) this.finish(1, 'Air hockey hero! 🏒');
  },
  render(ctx) {
    arcadeBackdrop(ctx);
    const T = this.t0;
    box(ctx, T.x - 30, T.y - 30, T.w + 60, T.h + 60, 50, '#7cc6ff', { lw: 4 });
    rr(ctx, T.x, T.y, T.w, T.h, 30);
    ctx.fillStyle = '#eef8ff';
    ctx.fill();
    ctx.fillStyle = 'rgba(124,198,255,.35)';
    for (let i = 0; i < 12; i++) for (let j = 0; j < 10; j++) { circle(ctx, T.x + 40 + i * 66, T.y + 40 + j * 66, 3); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,107,107,.5)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(T.x, T.y + T.h / 2); ctx.lineTo(T.x + T.w, T.y + T.h / 2); ctx.stroke();
    circle(ctx, T.x + T.w / 2, T.y + T.h / 2, 90);
    ctx.stroke();
    for (const [gy, c] of [[T.y, '#7ed99a'], [T.y + T.h, '#ffa94d']]) box(ctx, T.x + T.w / 2 - 130, gy - 14, 260, 28, 14, c, { lw: 3 });
    const pk = this.puck;
    circle(ctx, pk.x, pk.y, pk.r);
    paint(ctx, '#ff6b6b', pk.y - pk.r, pk.y + pk.r, { lw: 3 });
    for (const [m, c] of [[this.ai, '#ffa94d'], [this.me, '#7ed99a']]) {
      circle(ctx, m.x, m.y, m.r);
      paint(ctx, c, m.y - m.r, m.y + m.r, { lw: 4 });
      circle(ctx, m.x, m.y, m.r * 0.45);
      paint(ctx, shade(c, 0.25), m.y - m.r * 0.45, m.y + m.r * 0.45, { lw: 2 });
    }
    drawText(ctx, `${S.hamster.name}: ${this.mine}`, 220, 640, 34, { color: '#7ed99a', stroke: '#fff' });
    drawText(ctx, `Friend: ${this.theirs}`, 220, 260, 34, { color: '#ffa94d', stroke: '#fff' });
    drawHamster(ctx, 1390, 860, 220, { pose: this.reaction?.kind === 'good' ? 'celebrate' : 'play', mood: 'excited', facing: -1 });
    drawHamster(ctx, 1390, 330, 170, { kind: 'biscuit', pose: 'idle', mood: 'happy', facing: -1 });
  },
});
