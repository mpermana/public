// Outdoor games: swing, trampoline, sandcastle, ball pit, toy cars,
// gardening, apple picking, the bug hunt, and the barbecue / table / picnic.

function parkBackdrop(ctx, ground = '#a6e08a', horizon = 620) {
  Sky.draw(ctx, 0, 0, W, horizon + 40, { seed: 91, clouds: 4, scale: 0.65, sunX: 0.9 });
  ctx.fillStyle = '#c4ecaa';
  ellipse(ctx, 400, horizon + 20, 600, 110);
  ctx.fill();
  ctx.fillStyle = grassPattern(ctx, ground);
  ctx.fillRect(0, horizon, W, H - horizon);
}

// -------------------------------------------------------------------- swing

defineGame('swing', {
  music: 'outdoor',
  init() {
    this.amp = 0.25;
    this.goal = 1.1;
    this.pushes = 0;
    this.say('Tap when the swing comes back to you, to push it higher!');
  },
  angle() { return Math.sin(this.t * 2.4) * this.amp; },
  tick(dt) {
    this.amp = Math.max(0.2, this.amp - dt * 0.03);
    if (this.amp >= this.goal && !this.won) {
      this.won = true;
      Speech.say('Wheee! So high!');
      this.finish(1, 'Up to the sky! 🎠');
    }
  },
  push() {
    // Best right at the back of the swing (angle near its lowest).
    const a = this.angle(), back = a < -this.amp * 0.6 && Math.cos(this.t * 2.4) > -0.6;
    if (back) {
      this.amp = Math.min(1.25, this.amp + 0.14);
      this.pushes++;
      this.score++;
      Snd.whoosh();
      FX.text(560, 300, pick(['Push!', 'Higher!', 'Wheee!']), '#ff6f9c', 44);
    } else Snd.soft();
  },
  render(ctx) {
    parkBackdrop(ctx);
    const px = 800, py = 250, len = 400, a = this.angle();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ff8fb8';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(px - 340, 880); ctx.lineTo(px - 300, py); ctx.lineTo(px + 300, py); ctx.lineTo(px + 340, 880);
    ctx.stroke();
    const sx = px + Math.sin(a) * len, sy = py + Math.cos(a) * len;
    ctx.strokeStyle = '#a8a2b8';
    ctx.lineWidth = 5;
    for (const o of [-46, 46]) {
      ctx.beginPath();
      ctx.moveTo(px + o, py);
      ctx.lineTo(sx + o * Math.cos(a), sy - o * Math.sin(a) * 0.1);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-a);
    box(ctx, -70, -10, 140, 22, 10, '#ffd43b', { lw: 3 });
    drawHamster(ctx, 0, -6, 210, { pose: 'ride', mood: this.amp > 0.8 ? 'excited' : 'happy', shadow: false });
    ctx.restore();
    const ready = a < -this.amp * 0.6;
    circle(ctx, px - Math.sin(this.amp) * len, py + Math.cos(this.amp) * len, 60);
    ctx.strokeStyle = ready ? '#69db7c' : 'rgba(255,255,255,.6)';
    ctx.lineWidth = 6;
    ctx.stroke();
    drawText(ctx, 'Push here!', px - Math.sin(this.amp) * len, py + Math.cos(this.amp) * len + 90, 24, { color: '#ffffff', stroke: 'rgba(0,0,0,.25)' });
    rr(ctx, 1460, 300, 50, 420, 25);
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fill();
    const f = clamp(this.amp / this.goal, 0, 1);
    rr(ctx, 1460, 300 + 420 * (1 - f), 50, 420 * f, 25);
    ctx.fillStyle = '#ff8fb8';
    ctx.fill();
    drawEmoji(ctx, '☁️', 1485, 270, 50);
  },
  down() { this.push(); },
  keyDown(e) { if (['Space', 'Enter', 'ArrowUp'].includes(e.code)) this.push(); },
  hammyAt() { return { x: 800, y: 500 }; },
});

// --------------------------------------------------------------- trampoline

defineGame('trampoline', {
  music: 'outdoor',
  init() {
    this.y = 0;
    this.vy = 900;
    this.power = 900;
    this.goal = 8;
    this.stars = [];
    this.makeStars();
    this.say('Boing! Tap each time Hammy lands to bounce higher!');
  },
  makeStars() {
    while (this.stars.length < 3) this.stars.push({ x: 800 + rand(-60, 60), h: rand(220, 620), got: false });
  },
  tick(dt) {
    this.vy -= 1500 * dt;
    this.y += this.vy * dt;
    if (this.y <= 0) {
      this.y = 0;
      const boost = this.tapT && this.t - this.tapT < 0.3;
      this.power = clamp(this.power * (boost ? 1.12 : 0.92), 700, 1450);
      this.vy = this.power;
      Snd.bounce();
      if (boost) FX.text(800, 640, pick(['Boing!', 'Higher!', 'Super bounce!']), '#ff6f9c', 40);
      this.tapT = null;
    }
    for (const s of this.stars) if (!s.got && Math.abs(this.y - s.h) < 60) { s.got = true; this.score++; Snd.ding(this.score); FX.stars(s.x, 700 - s.h, 8); }
    this.stars = this.stars.filter(s => !s.got);
    this.makeStars();
    if (this.score >= this.goal) this.finish(1, 'Bouncy star! 🤸');
  },
  tap() { this.tapT = this.t; },
  render(ctx) {
    parkBackdrop(ctx);
    for (const s of this.stars) drawStar(ctx, s.x + Math.sin(Game.time * 2 + s.h) * 30, 700 - s.h, 30);
    Props.trampoline(ctx, 800, 860, 1.4, this.y < 30 ? 1 : 0);
    drawHamster(ctx, 800, 770 - this.y, 200, { pose: this.y > 40 ? 'jump' : 'idle', mood: 'excited', t: this.y > 40 ? 0.38 : Game.time });
    drawText(ctx, `⭐ ${this.score} / ${this.goal}`, W - 150, 200, 42, { color: '#ff7fb0', stroke: '#fff' });
    if (this.y < 120) drawText(ctx, 'TAP!', 1020, 760, 40, { color: '#69db7c', stroke: '#fff' });
  },
  down() { this.tap(); },
  keyDown(e) { if (['Space', 'Enter', 'ArrowUp'].includes(e.code)) this.tap(); },
  hammyAt() { return { x: 800, y: 620 - this.y }; },
});

// --------------------------------------------------------------- sandcastle

const SAND_PIECES = [['tower', '🏰', 'Tower'], ['wall', '🧱', 'Wall'], ['flag', '🚩', 'Flag'], ['shell', '🐚', 'Shell'], ['star', '⭐', 'Starfish']];

defineGame('sandcastle', {
  music: 'outdoor',
  init() {
    this.tool = 'tower';
    this.parts = [];
    this.buttons = SAND_PIECES.map(([id, e, label], i) => ({ id, x: 1380, y: 140 + i * 100, w: 200, h: 84, emoji: e, label, size: 22, color: '#fff3b8', onClick: b => { this.tool = id; for (const x of this.buttons) x.selected = x === b; Speech.say(label); } }));
    this.buttons[0].selected = true;
    this.say('Build a sandcastle! Pick a piece, then tap the sand.');
  },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 360, { seed: 93 });
    Art.water(ctx, 0, 300, W, 120, 0);
    ctx.fillStyle = sandPattern(ctx);
    ctx.fillRect(0, 400, W, 500);
    for (const p of [...this.parts].sort((a, b) => a.y - b.y)) this.drawPart(ctx, p);
    drawHamster(ctx, 150, 860, 200, { pose: this.reaction ? 'celebrate' : 'play', mood: 'happy' });
    drawEmoji(ctx, '🪣', 300, 840, 70);
    drawText(ctx, `🏰 ${this.parts.length} pieces`, 800, 200, 30, { color: '#7b6a8f' });
  },
  drawPart(ctx, p) {
    const s = 0.7 + (p.y - 400) / 500 * 0.6;
    switch (p.kind) {
      case 'tower':
        rr(ctx, p.x - 50 * s, p.y - 140 * s, 100 * s, 140 * s, 8);
        paint(ctx, '#e8c983', p.y - 140 * s, p.y, { lw: 3 });
        for (let i = 0; i < 3; i++) box(ctx, p.x - 50 * s + i * 36 * s, p.y - 164 * s, 28 * s, 28 * s, 4, '#e8c983', { lw: 2.5 });
        box(ctx, p.x - 14 * s, p.y - 60 * s, 28 * s, 60 * s, 14 * s, '#c9a35c', { lw: 2 });
        break;
      case 'wall':
        rr(ctx, p.x - 90 * s, p.y - 60 * s, 180 * s, 60 * s, 6);
        paint(ctx, '#e8c983', p.y - 60 * s, p.y, { lw: 3 });
        for (let i = 0; i < 5; i++) box(ctx, p.x - 90 * s + i * 38 * s, p.y - 78 * s, 28 * s, 22 * s, 4, '#e8c983', { lw: 2 });
        break;
      case 'flag':
        ctx.strokeStyle = '#7c6a96';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 120 * s); ctx.stroke();
        ctx.fillStyle = PARTY[Math.floor(p.x) % 6];
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 120 * s); ctx.lineTo(p.x + 50 * s, p.y - 104 * s + Math.sin(Game.time * 4) * 4); ctx.lineTo(p.x, p.y - 88 * s); ctx.fill();
        break;
      default:
        drawEmoji(ctx, p.kind === 'shell' ? '🐚' : '⭐', p.x, p.y - 20 * s, 60 * s);
    }
  },
  down(p) {
    if (p.y < 420 || p.x > 1360) return;
    this.parts.push({ kind: this.tool, x: p.x, y: p.y });
    this.score++;
    Snd.thud();
    FX.burst(p.x, p.y, { n: 8, colors: ['#e8c983', '#f7e2aa'], size: 6, speed: 200 });
    if (this.score === 8) { this.say('What a beautiful castle! Keep building, or tap Done!'); this.react('good'); Snd.cheer(); }
  },
  hammyAt() { return { x: 150, y: 700 }; },
});

// ----------------------------------------------------------------- ball pit

defineGame('ballpit', {
  music: 'outdoor',
  init() {
    const toys = shuffle([['🦆', 'duck'], ['🧸', 'teddy'], ['🚗', 'car'], ['🦕', 'dinosaur'], ['⭐', 'star'], ['🎁', 'present'], ['🐸', 'frog']]).slice(0, 5);
    this.toys = toys.map(([e, n], i) => ({ e, n, x: 300 + (i % 5) * 250 + rand(-40, 40), y: 520 + (i % 2) * 140 + rand(-20, 20), found: false }));
    const rnd = seeded(S.time.day + 7), cols = Object.values(COLORS);
    this.balls = [];
    for (let i = 0; i < 160; i++) this.balls.push({ x: 200 + rnd() * 1200, y: 420 + rnd() * 380, c: cols[i % 7], vx: 0, vy: 0, away: false });
    this.want = 0;
    this.say(`Find the ${this.toys[0].n} in the ball pit! Tap the balls to move them.`);
  },
  tick(dt) {
    for (const b of this.balls) if (b.away) { b.vy += 1200 * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
    this.balls = this.balls.filter(b => b.y < 1000);
  },
  render(ctx) {
    parkBackdrop(ctx, '#a6e08a', 320);
    box(ctx, 160, 380, 1280, 470, 60, '#ffffff', { lw: 4 });
    ctx.save();
    rr(ctx, 180, 396, 1240, 440, 50);
    ctx.clip();
    ctx.fillStyle = '#f3ecf8';
    ctx.fillRect(180, 396, 1240, 440);
    for (const t of this.toys) drawEmoji(ctx, t.e, t.x, t.y, 120, { alpha: t.found ? 1 : 0.95 });
    for (const b of this.balls) if (!b.away) { circle(ctx, b.x, b.y, 34); paint(ctx, b.c, b.y - 34, b.y + 34, { lw: 2 }); }
    ctx.restore();
    for (const b of this.balls) if (b.away) { circle(ctx, b.x, b.y, 34); paint(ctx, b.c, b.y - 34, b.y + 34, { lw: 2 }); }
    const t = this.toys[this.want];
    if (t) speechBubble(ctx, `Find the ${t.n}!`, 1300, 300, { icon: t.e, size: 30 });
    drawHamster(ctx, 120, 880, 190, { pose: this.reaction ? 'celebrate' : 'think', mood: 'curious' });
    drawText(ctx, `${this.toys.filter(x => x.found).map(x => x.e).join(' ')}`, 800, 200, 50);
  },
  down(p) {
    let moved = 0;
    for (const b of this.balls) if (!b.away && dist(p.x, p.y, b.x, b.y) < 80) { b.away = true; b.vx = (b.x - p.x) * 6 + rand(-100, 100); b.vy = -rand(500, 800); moved++; }
    if (moved) Snd.pop();
    const t = this.toys[this.want];
    if (t && !t.found && dist(p.x, p.y, t.x, t.y) < 80 && !this.balls.some(b => !b.away && dist(b.x, b.y, t.x, t.y) < 40)) {
      t.found = true;
      this.good(t.x, t.y - 60, `The ${t.n}!`);
      this.want++;
      if (this.want >= this.toys.length) this.finish(1, 'You found them all!');
      else this.say(`You found the ${t.n}! Now find the ${this.toys[this.want].n}!`);
    }
  },
  move(p) { if (Input.pointer.down) this.down(p); },
  hammyAt() { return { x: 120, y: 720 }; },
});

// ------------------------------------------------------------------ toy cars

steerGame('cars', {
  music: 'outdoor',
  area: { x: 140, y: 230, w: 1320, h: 600 },
  speed: 440,
  reach: 40,
  reachY: 20,
  goal: 12,
  prompt: 'Vroom vroom! Drive the car and collect the stars!',
  init() {
    this.color = pick(['#ff6b6b', '#4dabf7', '#ffd43b']);
    this.spawnT = 0;
  },
  tick(dt) {
    if ((this.spawnT -= dt) <= 0 && this.items.length < 4) {
      this.spawnT = 0.8;
      const a = rand(0, TAU);
      this.items.push({ x: 800 + Math.cos(a) * 560, y: 530 + Math.sin(a) * 230, r: 30 });
    }
    if (this.me.moving && Math.random() < dt * 3) Snd.tone(110 + Math.random() * 20, 0.1, { type: 'sawtooth', vol: 0.03 });
  },
  collect(it) {
    this.score++;
    Snd.ding(this.score % 8);
    FX.stars(it.x, it.y, 6);
  },
  render(ctx) {
    parkBackdrop(ctx, '#a6e08a', 200);
    ellipse(ctx, 800, 530, 660, 300);
    ctx.fillStyle = '#9aa0b5';
    ctx.fill();
    ellipse(ctx, 800, 530, 460, 150);
    ctx.fillStyle = grassPattern(ctx, '#a6e08a');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.setLineDash([30, 26]);
    ellipse(ctx, 800, 530, 560, 225);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 6; i++) Art.tree(ctx, 560 + i * 100, 560, 0.5, { seed: i, kind: i % 2 ? 'blossom' : 'round' });
    for (const it of this.items) drawStar(ctx, it.x, it.y + Math.sin(Game.time * 3 + it.x) * 5, 26);
    const m = this.me;
    Props.toyCar(ctx, m.x, m.y + 30, 0.9, this.color, m.facing);
    drawHamster(ctx, m.x - m.facing * 6, m.y - 6, 90, { pose: 'ride', facing: m.facing, mood: 'excited', shadow: false, fx: false });
    drawText(ctx, `⭐ ${this.score} / ${this.goal}`, W - 150, 200, 42, { color: '#ff7fb0', stroke: '#fff' });
  },
});

// ---------------------------------------------------------------- gardening

const GARDEN_TOOLS = [
  ['carrot', '🥕', 'Carrot seeds'], ['tomato', '🍅', 'Tomato seeds'], ['strawberry', '🍓', 'Strawberry seeds'], ['sunflower', '🌻', 'Sunflower seeds'], ['lettuce', '🥬', 'Lettuce seeds'],
  ['water', '💧', 'Water'], ['weed', '🖐️', 'Pull weeds'], ['harvest', '🧺', 'Harvest'],
];
const STAGE_NAMES = ['Seed', 'Sprout', 'Growing', 'Flowers', 'Ready!'];

defineGame('garden', {
  music: 'outdoor',
  init() {
    this.tool = 'carrot';
    this.harvested = 0;
    // Weeds pop up a little while you're away.
    for (const p of S.garden.plots) if (p.crop && Math.random() < 0.6) p.weeds = Math.min(3, (p.weeds || 0) + randi(1, 2));
    this.buttons = GARDEN_TOOLS.map(([id, e, label], i) => ({ id, x: 24, y: 160 + i * 84, w: 220, h: 72, emoji: e, label: label.replace(' seeds', ''), size: 20, color: i < 5 ? '#fff3b8' : '#d8efff', onClick: b => this.pickTool(id, b, label) }));
    this.buttons[0].selected = true;
    this.say('Let\'s garden! Pick seeds and tap a bed to plant. Water helps them grow!');
  },
  pickTool(id, b, label) {
    this.tool = id;
    for (const x of this.buttons) x.selected = x === b;
    Speech.say(label);
  },
  plotRect(i) { return { x: 290 + (i % 3) * 372, y: 240 + Math.floor(i / 3) * 315, w: 342, h: 275 }; },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 260, { seed: 95 });
    ctx.fillStyle = grassPattern(ctx, '#a9e28c');
    ctx.fillRect(0, 230, W, H);
    S.garden.plots.forEach((p, i) => {
      const R = this.plotRect(i), st = cropStage(p);
      Props.plot(ctx, R.x + R.w / 2, R.y + R.h, R.w, R.h - 40);
      if (st >= 0) {
        for (const dx of [-100, 0, 100]) Props.crop(ctx, R.x + R.w / 2 + dx, R.y + R.h - 70, p.crop, st, 1.2);
        for (let w = 0; w < (p.weeds || 0); w++) Props.weed(ctx, R.x + 60 + w * 110, R.y + R.h - 40, 1.3);
        box(ctx, R.x + R.w / 2 - 110, R.y + 4, 220, 42, 21, st === 4 ? '#d9f8e1' : '#ffffff', { lw: 2 });
        drawText(ctx, `${CROPS[p.crop].icon} ${STAGE_NAMES[st]}`, R.x + R.w / 2, R.y + 26, 24);
        if (p.wetT && Game.time - p.wetT < 1.2) for (let k = 0; k < 6; k++) drawEmoji(ctx, '💧', R.x + 60 + k * 50, R.y + 60 + ((Game.time - p.wetT) * 300 + k * 30) % 160, 30);
      } else drawText(ctx, 'Tap to plant 🌱', R.x + R.w / 2, R.y + R.h / 2 + 30, 26, { color: '#fff3e0' });
    });
    drawHamster(ctx, 1490, 860, 160, { pose: this.reaction ? 'celebrate' : 'idle', mood: 'happy', facing: -1, outfit: { hat: 'sunhat', top: 'overalls' } });
    drawText(ctx, '☀️ + 💧 = 🌱', 1475, 290, 28);
    if (this.harvested) drawText(ctx, `🧺 ${this.harvested}`, 1475, 350, 36);
  },
  down(p) {
    const i = S.garden.plots.findIndex((_, k) => { const R = this.plotRect(k); return p.x >= R.x && p.x <= R.x + R.w && p.y >= R.y && p.y <= R.y + R.h; });
    if (i < 0) return;
    const plot = S.garden.plots[i], R = this.plotRect(i), st = cropStage(plot), cx = R.x + R.w / 2, cy = R.y + R.h / 2;
    const tool = this.tool;
    if (CROPS[tool]) {
      if (plot.crop) return Speech.say(st === 4 ? 'This one is ready! Use the basket!' : 'Something is already growing here!');
      Object.assign(plot, { crop: tool, planted: Clock.total(), water: 0, weeds: 0 });
      this.good(cx, cy, 'Planted!');
      Speech.say(`We planted ${CROPS[tool].name.toLowerCase()} seeds! Now let's water them.`);
    } else if (tool === 'water') {
      if (!plot.crop) return Speech.say('Plant some seeds first!');
      plot.water = 1;
      plot.wetT = Game.time;
      Snd.splash();
      if (st < 4) {
        plot.planted -= CROPS[plot.crop].grow / 1.5 / 4 + 1; // one stage
        this.good(cx, cy, pick(['Grow, grow!', 'Splash!', 'Yummy water!']));
        Speech.say(`Now it is ${['a seed', 'a sprout', 'growing', 'flowering', 'ready to pick'][cropStage(plot)]}!`);
      }
    } else if (tool === 'weed') {
      if (!plot.weeds) return Speech.say('No weeds here!');
      plot.weeds--;
      this.good(cx, cy, 'Pulled!');
      Snd.pop();
    } else if (tool === 'harvest') {
      if (st !== 4) return Speech.say(plot.crop ? 'Not ready yet. Give it some water!' : 'Nothing to pick here.');
      const c = CROPS[plot.crop];
      this.harvested++;
      S.garden.harvest = S.garden.harvest || {};
      S.garden.harvest[plot.crop] = (S.garden.harvest[plot.crop] || 0) + 3;
      Object.assign(plot, { crop: null, planted: 0, water: 0, weeds: 0 });
      this.good(cx, cy, `Three ${c.name.toLowerCase()}!`);
      FX.emoji(cx, cy, c.icon, { size: 90, vy: -120 });
      Rewards.sticker('gardener');
      Speech.say(`We picked three ${c.name.toLowerCase()}! One, two, three!`);
      if (this.harvested >= 2) setTimeout(() => this.finish(1, 'Green paws! 🌻'), 900);
    }
    Save.mark();
  },
});

// ------------------------------------------------------------------- apples

defineGame('apples', {
  music: 'outdoor',
  init() {
    const rnd = seeded(S.time.day + 2);
    this.apples = Array.from({ length: 10 }, () => ({ x: 560 + (rnd() - 0.5) * 520, y: 260 + rnd() * 240, picked: false, vy: 0, inBasket: false }));
    this.goal = 8;
    this.say('Tap the apples to pick them. Let\'s count them into the basket!');
  },
  tick(dt) {
    for (const a of this.apples) {
      if (!a.picked || a.inBasket) continue;
      a.vy += 1400 * dt;
      a.y += a.vy * dt;
      a.x += (1150 - a.x) * Math.min(1, dt * 3);
      if (a.y > 720) { a.inBasket = true; a.y = 700 + rand(-10, 10); a.x = 1150 + rand(-60, 60); Snd.thud(); }
    }
  },
  render(ctx) {
    parkBackdrop(ctx);
    Art.tree(ctx, 560, 860, 3.6, { seed: 5 });
    for (const a of this.apples) {
      if (a.inBasket) continue;
      circle(ctx, a.x, a.y, 30);
      paint(ctx, '#ff5c5c', a.y - 30, a.y + 30, { lw: 3 });
      ctx.fillStyle = '#7fcf6a';
      ellipse(ctx, a.x + 8, a.y - 32, 10, 5, -0.5);
      ctx.fill();
    }
    for (const a of this.apples) if (a.inBasket) { circle(ctx, a.x, a.y, 26); paint(ctx, '#ff5c5c', a.y - 26, a.y + 26, { lw: 2 }); }
    drawEmoji(ctx, '🧺', 1150, 760, 260);
    drawHamster(ctx, 1380, 860, 200, { pose: this.reaction ? 'celebrate' : 'idle', mood: 'happy', facing: -1 });
    drawText(ctx, `🍎 ${this.score}`, 1150, 600, 56, { color: '#ff5c5c', stroke: '#fff' });
  },
  down(p) {
    const a = this.apples.find(a => !a.picked && dist(p.x, p.y, a.x, a.y) < 50);
    if (!a) return;
    a.picked = true;
    this.score++;
    Snd.pop();
    FX.text(a.x, a.y - 40, NUMBER_WORDS[this.score], PARTY[this.score % 6], 48);
    Speech.say(`${NUMBER_WORDS[this.score]}!`);
    S.garden.apples = (S.garden.apples || 0) + 1;
    if (this.score >= this.goal) {
      setTimeout(() => Speech.say(`We picked ${NUMBER_WORDS[this.score]} apples!`), 700);
      this.finish(1, `${this.score} apples! 🍎`);
    }
  },
  hammyAt() { return { x: 1380, y: 700 }; },
});

// ------------------------------------------------------------------ bug hunt

const BUGS = [
  { id: 'butterfly', name: 'butterfly', fact: 'Butterflies taste with their feet!' },
  { id: 'ladybug', name: 'ladybug', icon: '🐞', fact: 'A ladybug has spots on its wings.' },
  { id: 'bee', name: 'bee', icon: '🐝', fact: 'Bees make honey and help flowers grow.' },
  { id: 'caterpillar', name: 'caterpillar', icon: '🐛', fact: 'A caterpillar turns into a butterfly!' },
  { id: 'snail', name: 'snail', icon: '🐌', fact: 'A snail carries its house on its back.' },
  { id: 'ant', name: 'ant', icon: '🐜', fact: 'Ants are tiny but very strong.' },
  { id: 'cricket', name: 'cricket', icon: '🦗', fact: 'Crickets sing by rubbing their legs.' },
];

tapGame('bugs', {
  prompt: 'Look closely! Tap the little garden bugs to meet them.',
  goal: 6,
  every: 1.4,
  maxOnScreen: 3,
  spawn() {
    const b = pick(BUGS), fly = b.id === 'butterfly' || b.id === 'bee';
    return { bug: b, x: rand(250, 1350), y: fly ? rand(260, 560) : rand(640, 820), vx: fly ? rand(-70, 70) : rand(-25, 25), vy: fly ? rand(-20, 20) : 0, r: 60, life: 7, seed: rand(0, 6), color: pick(Object.values(COLORS)) };
  },
  drawObj(ctx, o) {
    const fade = Math.min(1, o.t * 2, (o.life - o.t) * 2);
    ctx.save();
    ctx.globalAlpha = fade;
    if (o.bug.id === 'butterfly') Art.butterfly(ctx, o.x, o.y + Math.sin(o.t * 3) * 12, 2.2, o.color, o.t);
    else drawEmoji(ctx, o.bug.icon, o.x, o.y + (o.bug.id === 'bee' ? Math.sin(o.t * 8) * 6 : 0), 90, { flip: o.vx > 0 });
    ctx.restore();
  },
  render(ctx) {
    parkBackdrop(ctx, '#a9e28c', 560);
    for (let i = 0; i < 16; i++) Art.flower(ctx, 60 + i * 100, 900, 1.4, Object.values(COLORS)[i % 7], ['tulip', 'daisy', 'rose', 'sunflower'][i % 4], i);
    drawHamster(ctx, 1450, 660, 180, { pose: this.reaction ? 'celebrate' : 'think', mood: 'curious', facing: -1 });
    if (this.card) {
      const c = this.card;
      box(ctx, 420, 140, 760, 150, 30, '#ffffff', { lw: 0 });
      if (c.bug.id === 'butterfly') Art.butterfly(ctx, 500, 215, 1.6, c.color);
      else drawEmoji(ctx, c.bug.icon, 500, 215, 90);
      drawText(ctx, `A ${c.bug.name}!`, 580, 190, 38, { align: 'left' });
      drawText(ctx, c.bug.fact, 580, 245, 26, { align: 'left', color: '#7b6a8f' });
    }
    drawText(ctx, `🔍 ${S.garden.insects.length} / ${BUGS.length} kinds found`, 260, 200, 26, { color: '#5a8a4a' });
  },
  onTap(o) {
    this.score++;
    this.card = o;
    Snd.sparkle();
    FX.stars(o.x, o.y, 8);
    const isNew = !S.garden.insects.includes(o.bug.id);
    if (isNew) S.garden.insects.push(o.bug.id);
    Speech.say(`${isNew ? 'New bug! ' : ''}A ${o.bug.name}! ${o.bug.fact}`);
    this.react('good');
    Rewards.check(null);
  },
  hammyAt() { return { x: 1450, y: 520 }; },
});

// ------------------------------------------------------------------ barbecue

// Hammy makes veggie skewers; Dad does the grilling. Then everyone eats.
defineGame('bbq', {
  music: 'outdoor',
  init() {
    this.phase = 'skewer';
    this.veg = shuffle(['🌽', '🍅', '🫑', '🍄', '🧅', '🥔', '🍅', '🌽', '🫑']).map((e, i) => ({ e, x: 260 + i * 130, y: 800, used: false }));
    this.skewers = [[], [], []];
    this.flips = 0;
    this.drag = null;
    this.say('Let\'s make veggie skewers! Drag the veggies onto the sticks.');
  },
  skewerRect(i) { return { x: 380 + i * 300, y: 330, w: 240, h: 330 }; },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 330, { seed: 97 });
    for (let i = 0; i < 9; i++) Art.bush(ctx, 90 + i * 190, 330, 1, { seed: i + 3, flowers: i % 2 ? '#ffd43b' : null });
    ctx.fillStyle = woodPattern(ctx, '#e9bd8c');
    ctx.fillRect(0, 320, W, H);
    Props.stringLights(ctx, 0, 120, W, 120, 40);
    if (this.phase === 'skewer') {
      box(ctx, 330, 300, 960, 400, 30, '#ffffff', { lw: 4 });
      this.skewers.forEach((s, i) => {
        const R = this.skewerRect(i);
        box(ctx, R.x + R.w / 2 - 6, R.y + 10, 12, R.h - 20, 6, '#d39a63', { lw: 2 });
        s.forEach((e, k) => drawEmoji(ctx, e, R.x + R.w / 2, R.y + R.h - 60 - k * 90, 90));
        drawText(ctx, `${s.length} / 3`, R.x + R.w / 2, R.y + R.h + 26, 24, { color: '#7b6a8f' });
      });
      for (const v of this.veg) if (!v.used && v !== this.drag) drawEmoji(ctx, v.e, v.x, v.y, 100);
      if (this.drag) drawEmoji(ctx, this.drag.e, this.drag.x, this.drag.y, 120);
      drawHamster(ctx, 160, 700, 200, { pose: 'idle', mood: 'happy' });
      drawHamster(ctx, 1460, 700, 280, { kind: 'dad', pose: 'wave', facing: -1, mood: 'happy' });
    } else if (this.phase === 'grill') {
      Props.grill(ctx, 800, 760, 2.2, { on: true });
      this.skewers.forEach((s, i) => {
        const x = 650 + i * 150, y = 430, flip = this.flips % 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 2 + (flip ? 0.08 : -0.08));
        box(ctx, -110, -5, 220, 10, 5, '#d39a63', { lw: 1.5 });
        s.forEach((e, k) => drawEmoji(ctx, e, -60 + k * 60, 0, 60, { alpha: 0.95 }));
        ctx.restore();
      });
      drawHamster(ctx, 1150, 840, 340, { kind: 'dad', pose: 'cook', facing: -1, mood: 'happy' });
      drawHamster(ctx, 260, 840, 220, { pose: this.reaction ? 'celebrate' : 'idle', mood: 'excited' });
      drawText(ctx, '🔥 Only grown-ups touch the grill!', 800, 210, 26, { color: '#7b6a8f' });
    } else {
      Props.picnicTable(ctx, 800, 820, 900);
      for (const [x, k, h] of [[440, 'mom', 330], [1160, 'dad', 350]]) drawHamster(ctx, x, 700, h, { kind: k, pose: 'eat', holding: '🍢', mood: 'happy' });
      drawHamster(ctx, 800, 720, 250, { pose: 'eat', holding: '🍢', mood: 'happy' });
    }
  },
  down(p) {
    if (this.phase !== 'skewer') return;
    const v = this.veg.find(v => !v.used && dist(p.x, p.y, v.x, v.y) < 60);
    if (v) { this.drag = v; Snd.tap(); }
  },
  move(p) { if (this.drag) { this.drag.x = p.x; this.drag.y = p.y; } },
  up() {
    const v = this.drag;
    if (!v) return;
    this.drag = null;
    const i = this.skewers.findIndex((s, k) => { const R = this.skewerRect(k); return v.x > R.x && v.x < R.x + R.w && v.y > R.y - 40 && v.y < R.y + R.h + 40; });
    if (i >= 0 && this.skewers[i].length < 3) {
      this.skewers[i].push(v.e);
      v.used = true;
      this.good(v.x, v.y - 40, pick(['On it goes!', 'Yummy!', 'Great!']));
      if (this.skewers.every(s => s.length === 3)) this.startGrill();
    } else {
      v.x = 260 + this.veg.indexOf(v) * 130;
      v.y = 800;
    }
  },
  startGrill() {
    this.phase = 'grill';
    this.say('Dad will grill them. Tap "Flip!" to tell Dad when to turn them!');
    this.buttons = [{ x: 680, y: 790, w: 240, h: 90, emoji: '🔄', label: 'Flip!', size: 30, color: '#ffa94d', glow: true, onClick: () => this.flip() }];
  },
  flip() {
    this.flips++;
    Snd.swish();
    FX.burst(800, 420, { n: 8, colors: ['#ffd43b', '#ff922b'], size: 6, speed: 200 });
    Speech.say(pick(['Flip!', 'Sizzle sizzle!', 'Good job, Dad!']));
    if (this.flips >= 4) {
      this.buttons = [];
      this.phase = 'eat';
      this.say('Dinner is ready! Everyone eats together. Yum!');
      setTimeout(() => this.finish(1, 'Family barbecue! 🍢'), 3000);
    }
  },
  hammyAt() { return { x: 800, y: 520 }; },
});

dragGame('settable', {
  prompt: 'Set the table! A plate, a cup and a spoon for everyone.',
  setup() {
    const kinds = [['plate', '🍽️'], ['cup', '🥤'], ['spoon', '🥄']];
    const items = [];
    kinds.forEach(([k, e]) => { for (let i = 0; i < 3; i++) items.push({ key: k, e }); });
    return {
      items: shuffle(items).map((it, i) => ({ ...it, x: 200 + i * 150, y: 820, size: 90, draw(ctx, x, y, s) { drawEmoji(ctx, it.e, x, y, s); } })),
      slots: [0, 1, 2].flatMap(p => kinds.map(([k, e], j) => ({ key: k, cap: 1, x: 270 + p * 380 + j * 100, y: 380, w: 96, h: 110, e, draw(ctx, sl, hover) {
        rr(ctx, sl.x, sl.y, sl.w, sl.h, 18);
        ctx.fillStyle = hover ? 'rgba(255,243,184,.9)' : 'rgba(255,255,255,.5)';
        ctx.fill();
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = '#c9a77a';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
        if (!sl.filled.length) drawEmoji(ctx, e, sl.x + sl.w / 2, sl.y + sl.h / 2, 60, { alpha: 0.25 });
      } }))),
    };
  },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 300, { seed: 99 });
    ctx.fillStyle = woodPattern(ctx, '#e9bd8c');
    ctx.fillRect(0, 280, W, H);
    rr(ctx, 200, 330, 1200, 220, 40);
    paint(ctx, '#ffd6e5', 330, 550, { lw: 4 });
    for (const [x, k, h] of [[370, 'mom', 220], [800, null, 170], [1230, 'dad', 230]]) drawHamster(ctx, x, 320, h, { kind: k || 'hammy', mood: 'happy', fx: false });
  },
  praise: it => `The ${it.key}!`,
});

dragGame('picnic', {
  prompt: 'Picnic time! Give everyone a sandwich, an apple and some juice.',
  setup() {
    const kinds = [['sandwich', '🥪'], ['apple', '🍎'], ['juice', '🧃']];
    const items = [];
    kinds.forEach(([k, e]) => { for (let i = 0; i < 3; i++) items.push({ key: k, e }); });
    return {
      items: shuffle(items).map((it, i) => ({ ...it, x: 240 + (i % 9) * 140, y: 330, size: 90, draw(ctx, x, y, s) { drawEmoji(ctx, it.e, x, y, s); } })),
      slots: [0, 1, 2].map(p => ({ key: 'person', who: p, x: 220 + p * 400, y: 560, w: 360, h: 220 })),
    };
  },
  fits(it, sl) { return !sl.filled.some(f => f.key === it.key); },
  place(it, sl) { const k = sl.filled.length - 1; return { x: sl.x + 70 + k * 110, y: sl.y + 150 }; },
  render(ctx) {
    parkBackdrop(ctx, '#a6e08a', 420);
    Props.blanket(ctx, 800, 700, 1300, 300, '#ff8a8a');
    drawEmoji(ctx, '🧺', 120, 330, 120);
  },
  renderTop(ctx) {
    this.slots.forEach((sl, i) => {
      const [k, h] = [['mom', 250], ['hammy', 190], ['dad', 270]][i];
      drawHamster(ctx, sl.x + sl.w / 2, sl.y + 90, h, { kind: k, pose: sl.filled.length === 3 ? 'eat' : 'idle', holding: '🥪', mood: 'happy', fx: false });
    });
  },
  praise: it => `A ${it.key}!`,
});
