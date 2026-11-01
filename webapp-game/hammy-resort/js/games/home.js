// Everyday games at home: meals, cooking with Mom, washing up, brushing
// teeth, bubbles with Mom, catch with Dad, block towers, tidying toys, a
// teddy tea party and drawing.

const FOOD_NAMES = {
  '🥞': 'pancakes', '🍳': 'egg', '🥛': 'milk', '🍌': 'banana', '🍓': 'strawberry', '🥣': 'cereal', '🍞': 'toast',
  '🥪': 'sandwich', '🍚': 'rice', '🥦': 'broccoli', '🥕': 'carrot', '🍎': 'apple', '🧀': 'cheese', '🍝': 'pasta',
  '🍲': 'soup', '🥗': 'salad', '🌽': 'corn', '🍠': 'sweet potato', '🍅': 'tomato', '🍇': 'grapes', '🍪': 'cookie',
  '🌻': 'sunflower seeds', '🍉': 'watermelon', '🍐': 'pear', '🥒': 'cucumber', '🍊': 'orange', '🫐': 'blueberries',
};
const MEALS = {
  breakfast: { title: 'Breakfast', foods: ['🥞', '🍳', '🥛', '🍌', '🍓', '🥣'], need: 3, wall: '#e6f8ef' },
  lunch: { title: 'Lunch', foods: ['🥪', '🍚', '🥦', '🥕', '🍎', '🧀'], need: 3, wall: '#fff5dc' },
  dinner: { title: 'Dinner', foods: ['🍲', '🍝', '🥗', '🌽', '🍠', '🍇'], need: 3, wall: '#ffeef3' },
  snack: { title: 'Snack', foods: ['🍪', '🍎', '🧀', '🍇', '🥕', '🌻'], need: 2, wall: '#eef3ff' },
};

// A close-up of a table, with Hammy (and family) sitting behind it.
function tableScene(ctx, wall, who = []) {
  gameBackdrop(ctx, wall, shade(wall, -0.05), { pattern: 'stripes', accent: shade(wall, -0.04) });
  Props.window(ctx, 1120, 120, 260, 190, { curtain: '#ffd6e5', seed: 41 });
  for (const w of who) drawHamster(ctx, w.x, 690, w.h, { kind: w.kind, pose: w.pose || 'sit', mood: 'happy', facing: w.facing || 1, seed: w.seed || 0 });
}
function tableFront(ctx, cloth = '#ffd6e5') {
  rr(ctx, 60, 600, W - 120, 330, 40);
  paint(ctx, '#e0b07c', 600, 930, { lw: 4 });
  rr(ctx, 50, 590, W - 100, 70, 30);
  paint(ctx, cloth, 590, 660, { lw: 3 });
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  for (let i = 0; i < 18; i++) { circle(ctx, 110 + i * 80, 625, 6); ctx.fill(); }
}

defineGame('meal', {
  init(params) {
    this.meal = MEALS[params.meal] || MEALS.snack;
    this.need = this.meal.need;
    this.tray = this.meal.foods.map((f, i) => ({ f, x: 260 + i * 216, y: 790, used: false }));
    this.eating = null;
    this.focus = 0;
    this.family = this.act.with === 'family';
    this.say(`${this.meal.title} time! Tap a food to give it to ${S.hamster.name}.`);
  },
  tick(dt) {
    const e = this.eating;
    if (!e) return;
    e.t += dt;
    if (e.t > 0.5 && !e.bit && e.t % 0.45 < dt) {
      Snd.munch();
      FX.add({ kind: 'dot', x: 800 + rand(-20, 20), y: 430, vy: rand(40, 120), vx: rand(-80, 80), g: 400, life: 0.6, size: 5, color: '#f6c26b' });
    }
    if (e.t > 2) {
      this.eating = null;
      this.good(800, 380, 'Yummy!');
      Speech.say(pick(['Yummy!', 'Delicious!', 'Mmm, so good!', 'Nom nom nom!']), { interrupt: false });
      if (this.score >= this.need) setTimeout(() => this.finish(1, 'All finished! Yummy!'), 600);
    }
  },
  render(ctx) {
    const who = this.family ? [{ kind: 'mom', x: 360, h: 330, facing: 1 }, { kind: 'dad', x: 1240, h: 350, facing: -1, seed: 2 }] : [];
    tableScene(ctx, this.meal.wall, who);
    const e = this.eating;
    drawHamster(ctx, 800, 700, 360, { pose: e ? 'eat' : 'sit', holding: e ? e.f : null, mood: e ? 'happy' : this.score ? 'happy' : 'hungry', t: Game.time });
    tableFront(ctx);
    ellipse(ctx, 800, 680, 190, 46);
    paint(ctx, '#ffffff', 634, 726, { lw: 3, line: '#d8d2e6' });
    ellipse(ctx, 800, 676, 140, 30);
    ctx.strokeStyle = '#ffd6e5';
    ctx.lineWidth = 4;
    ctx.stroke();
    if (e && e.t < 0.5) {
      const p = Ease.out(e.t / 0.5);
      drawEmoji(ctx, e.f, lerp(e.x, 800, p), lerp(e.y, 500, p) - Math.sin(p * Math.PI) * 120, 100);
    }
    for (const [i, it] of this.tray.entries()) {
      if (it.used) continue;
      const focus = Input.lastDevice === 'key' && i === this.focus;
      card(ctx, it.x - 90, it.y - 80, 180, 160, { color: focus ? '#fff3b8' : '#ffffff', glow: focus });
      drawEmoji(ctx, it.f, it.x, it.y - 12 + Math.sin(Game.time * 2 + i) * 3, 100);
      drawText(ctx, FOOD_NAMES[it.f], it.x, it.y + 58, 22);
    }
    drawText(ctx, `${'🍽️'.repeat(this.score)}${'⚪'.repeat(Math.max(0, this.need - this.score))}`, W / 2, 210, 40);
  },
  pick(i) {
    const it = this.tray[i];
    if (!it || it.used || this.eating) return;
    it.used = true;
    this.eating = { f: it.f, x: it.x, y: it.y, t: 0 };
    Snd.pop();
    Speech.say(`${FOOD_NAMES[it.f]}!`);
  },
  down(p) {
    const i = this.tray.findIndex(it => !it.used && Math.abs(p.x - it.x) < 90 && Math.abs(p.y - it.y) < 80);
    if (i >= 0) this.pick(i);
  },
  keyDown(e) {
    const n = this.tray.length;
    if (e.code === 'ArrowLeft') this.focus = (this.focus + n - 1) % n;
    if (e.code === 'ArrowRight') this.focus = (this.focus + 1) % n;
    if (e.code === 'Enter' || e.code === 'Space') this.pick(this.focus);
  },
  hammyAt() { return { x: 800, y: 400 }; },
});

// Cooking with Mom: add what the picture recipe shows, then stir.
const RECIPES = [
  { name: 'Fruit salad', icon: '🥗', steps: ['🍓', '🍌', '🍇', '🍎'] },
  { name: 'Pancakes', icon: '🥞', steps: ['🥚', '🥛', '🌾', '🍯'] },
  { name: 'Veggie soup', icon: '🍲', steps: ['🥕', '🥔', '🌽', '🥦'] },
];
const ING_NAMES = { '🥚': 'egg', '🌾': 'flour', '🍯': 'honey', '🥔': 'potato', ...FOOD_NAMES };

defineGame('cook', {
  init() {
    this.recipe = RECIPES[S.time.day % RECIPES.length];
    this.added = 0;
    const extra = ['🧀', '🍅', '🥒', '🍊'].filter(x => !this.recipe.steps.includes(x)).slice(0, 2);
    this.shelf = shuffle([...this.recipe.steps, ...extra]).map((f, i) => ({ f, x: 200 + i * 200, y: 800, used: false }));
    this.stir = 0;
    this.lastAngle = null;
    this.phase = 'add';
    this.say(`Let's make ${this.recipe.name.toLowerCase()} with Mom! Add the ${ING_NAMES[this.recipe.steps[0]]}.`);
  },
  render(ctx) {
    gameBackdrop(ctx, '#e6f8ef', '#d4f1e2', { pattern: 'stripes', accent: '#dcf4e8' });
    drawHamster(ctx, 1380, 690, 330, { kind: 'mom', pose: this.phase === 'stir' ? 'cook' : this.reaction?.kind === 'good' ? 'celebrate' : 'idle', mood: 'happy', facing: -1 });
    rr(ctx, 0, 600, W, 300, 0);
    paint(ctx, '#fff8ee', 600, 900, { lw: 0 });
    box(ctx, -10, 590, W + 20, 30, 0, '#a8dcc8', { lw: 3 });
    // Recipe card
    box(ctx, 80, 190, 320, 300, 24, '#ffffff', { lw: 3, line: '#e8d4bc' });
    drawText(ctx, `${this.recipe.icon} ${this.recipe.name}`, 240, 230, 28);
    this.recipe.steps.forEach((s, i) => {
      const y = 280 + i * 52, done = i < this.added;
      drawEmoji(ctx, s, 150, y, 44, { alpha: done ? 0.4 : 1 });
      drawText(ctx, done ? '✅' : i === this.added ? '👉' : `${i + 1}`, 220, y, 30);
      drawText(ctx, ING_NAMES[s], 300, y, 22, { color: done ? '#aaa' : PAL.ink });
    });
    // Bowl
    const bob = this.phase === 'stir' ? Math.sin(this.stir * 2) * 3 : 0;
    ellipse(ctx, 800, 520 + bob, 230, 50);
    paint(ctx, '#ffffff', 470, 570, { lw: 3 });
    ctx.beginPath();
    ctx.moveTo(570, 520);
    ctx.quadraticCurveTo(580, 700, 800, 700);
    ctx.quadraticCurveTo(1020, 700, 1030, 520);
    ctx.closePath();
    paint(ctx, '#ffb3cf', 520, 700, { lw: 3 });
    ellipse(ctx, 800, 520 + bob, 210, 40);
    ctx.fillStyle = this.added ? ['#ffe0b3', '#fff0c2', '#ffd9a8'][S.time.day % 3] : '#f3ecf8';
    ctx.fill();
    for (let i = 0; i < this.added; i++) {
      const a = i * 1.7 + this.stir;
      drawEmoji(ctx, this.recipe.steps[i], 800 + Math.cos(a) * 110, 518 + Math.sin(a) * 18, 54);
    }
    if (this.phase === 'stir') {
      const a = this.stir * 3;
      drawEmoji(ctx, '🥄', 800 + Math.cos(a) * 90, 470 + Math.sin(a) * 16, 90, { rot: -0.6 });
      rr(ctx, 600, 740, 400, 28, 14);
      ctx.fillStyle = '#eee3f3';
      ctx.fill();
      rr(ctx, 600, 740, 400 * clamp(this.stir / 12, 0, 1), 28, 14);
      ctx.fillStyle = '#7ed99a';
      ctx.fill();
      drawText(ctx, 'Stir in circles! (or press ← →)', 800, 810, 26);
    } else {
      for (const it of this.shelf) {
        if (it.used) continue;
        card(ctx, it.x - 80, it.y - 70, 160, 140);
        drawEmoji(ctx, it.f, it.x, it.y - 10, 84);
        drawText(ctx, ING_NAMES[it.f], it.x, it.y + 48, 20);
      }
    }
    drawHamster(ctx, 1150, 700, 220, { pose: this.reaction?.kind === 'good' ? 'celebrate' : this.phase === 'stir' ? 'cook' : 'idle', mood: 'happy', facing: -1 });
  },
  down(p) {
    if (this.phase === 'stir') { this.stirAt(p); return; }
    const it = this.shelf.find(s => !s.used && Math.abs(p.x - s.x) < 80 && Math.abs(p.y - s.y) < 70);
    if (!it) return;
    const want = this.recipe.steps[this.added];
    if (it.f === want) {
      it.used = true;
      this.added++;
      this.good(800, 450, pick(['Plop!', 'In it goes!', 'Yummy!']));
      if (this.added === this.recipe.steps.length) {
        this.phase = 'stir';
        this.say('Now stir, stir, stir!');
      } else this.say(`Great! Next, the ${ING_NAMES[this.recipe.steps[this.added]]}.`);
    } else {
      this.oops(it.x, it.y - 60);
      Speech.say(`Not yet! We need the ${ING_NAMES[want]}.`);
    }
  },
  move(p) { if (this.phase === 'stir' && Input.pointer.down) this.stirAt(p); },
  stirAt(p) {
    const a = Math.atan2(p.y - 520, p.x - 800);
    if (this.lastAngle !== null) {
      let d = Math.abs(a - this.lastAngle);
      if (d > Math.PI) d = TAU - d;
      this.addStir(d * 0.8);
    }
    this.lastAngle = a;
  },
  addStir(v) {
    this.stir += v;
    if (Math.random() < 0.2) Snd.tone(300 + Math.random() * 100, 0.06, { vol: 0.04 });
    if (this.stir >= 12) this.finish(1, `${this.recipe.name}! Yum!`);
  },
  keyDown(e) {
    if (this.phase === 'stir' && ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'].includes(e.code)) this.addStir(0.7);
  },
  up() { this.lastAngle = null; },
  hammyAt() { return { x: 1150, y: 520 }; },
});

// Shower, bath, washing hands, washing dishes: rub, then rinse.
scrubGame('scrub', {
  prompt() {
    return { shower: 'Scrub-a-dub! Rub the bubbles all over!', bath: 'Bubble bath! Rub away the dirty spots!', hands: 'Wash your hands! Rub the soap on the dirty spots.', dishes: 'Scrub the dishes clean!' }[this.kind] || 'Scrub scrub!';
  },
  init() {
    this.rinseLabel = this.kind === 'dishes' ? 'Rinse!' : 'Rinse off!';
    if (this.kind === 'shower' || this.kind === 'bath') Snd.water(true);
  },
  blobs() {
    const rnd = seeded(S.time.day + 3), out = [];
    if (this.kind === 'dishes') {
      for (let p = 0; p < 3; p++) for (let i = 0; i < 3; i++) out.push({ x: 450 + p * 350 + (rnd() - 0.5) * 140, y: 520 + (rnd() - 0.5) * 100, r: 30, hp: 1, seed: rnd() * 6 });
    } else if (this.kind === 'hands') {
      for (let i = 0; i < 7; i++) out.push({ x: 560 + (i % 2) * 480 + (rnd() - 0.5) * 160, y: 450 + (rnd() - 0.5) * 220, r: 28, hp: 1, seed: rnd() * 6 });
    } else {
      const pts = [[0, -470], [-120, -380], [120, -380], [-130, -230], [130, -230], [0, -260], [-60, -120], [60, -110]];
      for (const [dx, dy] of pts.slice(0, this.kind === 'bath' ? 6 : 8)) out.push({ x: 800 + dx, y: 840 + dy * (this.kind === 'bath' ? 0.85 : 1) + (this.kind === 'bath' ? -60 : 0), r: 34, hp: 1, seed: rnd() * 6 });
    }
    return out;
  },
  drawBlob(ctx, b) { (this.kind === 'dishes' || this.kind === 'hands' ? drawDirtBlob : drawFoamBlob)(ctx, b); },
  render(ctx) {
    const k = this.kind;
    if (k === 'dishes') {
      gameBackdrop(ctx, '#e6f8ef', '#d4f1e2', { pattern: 'stripes', accent: '#dcf4e8' });
      box(ctx, 200, 380, 1200, 420, 40, '#d8e4ee', { lw: 4 });
      Art.water(ctx, 240, 420, 1120, 340, 30, { color: '#a9dcff' });
      for (let p = 0; p < 3; p++) {
        ellipse(ctx, 450 + p * 350, 540, 150, 120);
        paint(ctx, '#ffffff', 420, 660, { lw: 3, line: '#c9c1d6' });
        ellipse(ctx, 450 + p * 350, 540, 100, 78);
        ctx.strokeStyle = ['#ffb3cf', '#a9dcff', '#ffe48a'][p];
        ctx.lineWidth = 6;
        ctx.stroke();
      }
      this.drawCheer(ctx, 120, H - 10, 160);
    } else if (k === 'hands') {
      gameBackdrop(ctx, '#e4f6ff', '#cdeeff', { pattern: 'checks', accent: '#d8f0ff' });
      const fur = FURS[S.hamster.fur] || FURS.golden;
      for (const side of [-1, 1]) {
        const cx = 800 + side * 240;
        ellipse(ctx, cx, 460, 190, 230);
        paint(ctx, shade(fur.main, 0.08), 230, 690, { lw: 5, line: fur.dark });
        ellipse(ctx, cx, 500, 110, 120);
        ctx.fillStyle = fur.ear;
        ctx.fill();
        for (let f = 0; f < 4; f++) {
          ellipse(ctx, cx + (f - 1.5) * 80, 260, 36, 44);
          ctx.fillStyle = fur.ear;
          ctx.fill();
        }
      }
      this.drawCheer(ctx, 140, H - 10, 160);
    } else {
      gameBackdrop(ctx, '#e4f6ff', '#d3efff', { pattern: 'checks', accent: '#ffffff' });
      if (k === 'shower') {
        ctx.strokeStyle = '#a9b9c8';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(1100, 0); ctx.lineTo(1100, 100); ctx.quadraticCurveTo(1100, 130, 900, 130);
        ctx.stroke();
        ellipse(ctx, 830, 140, 90, 26);
        paint(ctx, '#d8e4ee', 114, 166, { lw: 3 });
        ctx.strokeStyle = 'rgba(140,200,255,.6)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 24; i++) {
          const ph = (Game.time * 2 + i * 0.29) % 1, x = 770 + (i % 12) * 11 + (i - 12) * ph * 9;
          ctx.beginPath();
          ctx.moveTo(x, 170 + ph * 600);
          ctx.lineTo(x - 2, 190 + ph * 600);
          ctx.stroke();
        }
        drawHamster(ctx, 800, 860, 500, { pose: 'wash', mood: 'happy', outfit: { hat: 'none', top: 'none' } });
      } else {
        drawHamster(ctx, 800, 900, 520, { pose: 'swim', mood: 'happy', outfit: { hat: 'none', top: 'none' }, shadow: false });
        Props.bathtub(ctx, 800, 900, 1200, { bubbles: true });
        drawEmoji(ctx, '🦆', 1240 + Math.sin(Game.time) * 20, 735, 90);
      }
    }
  },
  tool: '🧽',
  cleanup() { Snd.water(false); },
});

scrubGame('brush', {
  prompt: 'Brush, brush, brush your teeth! Brush away the bits.',
  tool: '🪥',
  rinseIcon: '🥤',
  rinseLabel: 'Rinse!',
  doneText: 'Sparkly teeth!',
  blobs() {
    const rnd = seeded(S.time.day + 9), out = [];
    for (let i = 0; i < 8; i++) out.push({ x: 560 + (i % 4) * 160 + rnd() * 30, y: i < 4 ? 430 : 610, r: 26, hp: 1, seed: rnd() * 6 });
    return out;
  },
  drawBlob(ctx, b) {
    ctx.fillStyle = '#f6c26b';
    for (let i = 0; i < 3; i++) { circle(ctx, b.x + (i - 1) * 12, b.y + Math.sin(i + b.seed) * 6, 12); ctx.fill(); }
  },
  render(ctx) {
    gameBackdrop(ctx, '#ffe9f2', '#ffd6e6');
    const fur = FURS[S.hamster.fur] || FURS.golden;
    ellipse(ctx, 800, 520, 560, 380);
    paint(ctx, fur.main, 140, 900, { lw: 6, line: fur.dark });
    ellipse(ctx, 800, 600, 420, 260);
    ctx.fillStyle = fur.light;
    ctx.fill();
    ellipse(ctx, 800, 520, 330, 210);
    ctx.fillStyle = '#8a3b4a';
    ctx.fill();
    ellipse(ctx, 800, 660, 220, 70);
    ctx.fillStyle = '#ff8fa3';
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      box(ctx, 500 + i * 160, 350, 130, 140, 30, '#ffffff', { lw: 3, line: '#e6dfea' });
      box(ctx, 500 + i * 160, 560, 130, 110, 30, '#ffffff', { lw: 3, line: '#e6dfea' });
    }
    ellipse(ctx, 800, 250, 50, 34);
    ctx.fillStyle = '#f58aa0';
    ctx.fill();
    // Eyes, blush and whiskers so it reads as Hammy's happy face.
    for (const side of [-1, 1]) {
      const ex = 800 + side * 300, ey = 230;
      ellipse(ctx, ex, ey, 46, 54);
      ctx.fillStyle = '#2b1b17';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      circle(ctx, ex - 14, ey - 20, 18);
      ctx.fill();
      circle(ctx, ex + 16, ey + 18, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,128,150,.45)';
      ellipse(ctx, 800 + side * 420, 420, 70, 44);
      ctx.fill();
      ctx.strokeStyle = shade(fur.dark, -0.1);
      ctx.lineWidth = 5;
      for (const a of [-0.15, 0.05, 0.25]) {
        ctx.beginPath();
        ctx.moveTo(800 + side * 380, 320);
        ctx.lineTo(800 + side * (380 + Math.cos(a) * 170), 320 + Math.sin(a) * 170);
        ctx.stroke();
      }
    }
    if (this.blobs.every(b => b.hp <= 0)) for (let i = 0; i < 4; i++) drawStar(ctx, 560 + i * 160, 380 + Math.sin(Game.time * 4 + i) * 6, 14, '#fffbe0');
  },
});

// Pop the bubbles Mom blows, counting each one.
tapGame('bubbles', {
  prompt: 'Mom is blowing bubbles! Pop them and count!',
  goal: 12,
  every: 0.55,
  maxOnScreen: 9,
  spawn() {
    return { x: 380 + rand(-20, 40), y: 470, vx: rand(80, 260), vy: rand(-140, -60), r: rand(36, 60), wobble: 60, seed: rand(0, 6), hue: rand(0, 360) };
  },
  drawObj(ctx, o) {
    circle(ctx, o.x, o.y, o.r);
    const g = ctx.createRadialGradient(o.x - o.r * 0.3, o.y - o.r * 0.3, o.r * 0.1, o.x, o.y, o.r);
    g.addColorStop(0, 'rgba(255,255,255,.7)');
    g.addColorStop(0.7, 'rgba(255,255,255,.1)');
    g.addColorStop(1, `hsla(${(o.hue + Game.time * 60) % 360},90%,75%,.8)`);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = `hsla(${(o.hue + Game.time * 60) % 360},90%,70%,.9)`;
    ctx.lineWidth = 3;
    ctx.stroke();
  },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 600, { seed: 51, clouds: 3 });
    ctx.fillStyle = grassPattern(ctx);
    ctx.fillRect(0, 560, W, 340);
    drawHamster(ctx, 300, 760, 330, { kind: 'mom', pose: 'wave', mood: 'happy' });
    drawEmoji(ctx, '🫧', 380, 490, 70);
    drawHamster(ctx, 1150, 800, 230, { pose: this.reaction ? 'jump' : 'play', mood: 'excited' });
  },
  onTap(o) {
    this.score++;
    Snd.pop();
    FX.bubbles(o.x, o.y, 6, o.r);
    FX.text(o.x, o.y, String(this.score), PARTY[this.score % 6], 56);
    Speech.say(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][this.score - 1] || String(this.score));
    this.react('good');
  },
  hammyAt() { return { x: 1150, y: 600 }; },
});

// Dad tosses soft balls; move left and right to catch them.
steerGame('catch', {
  prompt: 'Dad is throwing balls! Move left and right to catch them!',
  area: { x: 200, y: 800, w: 1000, h: 0 },
  lockY: true,
  speed: 520,
  goal: 8,
  reachY: 150,
  reach: 70,
  init() { this.throwT = 1; this.balls = 0; },
  tick(dt) {
    if ((this.throwT -= dt) <= 0 && this.items.length < 2) {
      this.throwT = 1.8;
      const tx = rand(260, 1150), t = 1.6;
      this.items.push({ x: 1400, y: 520, vx: (tx - 1400) / t, vy: -560, g: 700, r: 34, rot: 0, color: pick(PARTY) });
      Snd.whoosh();
    }
    for (const b of this.items) {
      b.vy += b.g * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += dt * 5;
      if (b.y > 860) {
        b.y = 860;
        b.vy *= -0.5;
        b.vx *= 0.6;
        if (Math.abs(b.vy) < 80) { b.gone = true; FX.text(b.x, 780, 'Oops!', '#7cc6ff', 34); }
      }
    }
  },
  collect(b) {
    this.score++;
    Snd.boing();
    FX.stars(b.x, b.y, 8);
    FX.text(b.x, b.y - 40, pick(['Caught it!', 'Great catch!', 'Yes!']), '#ff6f9c', 40);
    this.react('good');
  },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 560, { seed: 53, clouds: 3 });
    ctx.fillStyle = grassPattern(ctx);
    ctx.fillRect(0, 520, W, 380);
    Props.rug(ctx, 700, 830, 600, 60, '#ffc6dc');
    drawHamster(ctx, 1420, 820, 360, { kind: 'dad', pose: this.throwT > 1.5 ? 'wave' : 'idle', facing: -1, mood: 'happy' });
    for (const b of this.items) Props.beachBall(ctx, b.x, b.y, b.r, b.rot);
    const m = this.me;
    drawHamster(ctx, m.x, m.y + 30, 220, { pose: this.reaction ? 'celebrate' : m.moving ? 'run' : 'play', facing: m.facing, mood: 'excited' });
    drawText(ctx, `⚽ ${this.score} / ${this.goal}`, W - 140, 200, 44, { color: '#ff7fb0', stroke: '#fff' });
    drawText(ctx, '← → or drag', 700, 880, 24, { color: '#5a8a4a' });
  },
});

// Build a tower: tap to drop the swinging block.
defineGame('tower', {
  init() {
    this.stack = [{ x: 800, w: 220, c: COLORS.blue }];
    this.goal = 8;
    this.newBlock();
    this.cam = 0;
    this.say('Tap to drop the block. Build a tall tower!');
  },
  newBlock() {
    const cols = Object.values(COLORS);
    this.block = { x: 400, w: 200, c: cols[this.stack.length % cols.length], dir: 1, y: null, vy: 0, falling: false, letter: String(this.stack.length) };
  },
  tick(dt) {
    const b = this.block, top = this.stack.length;
    this.cam += (Math.max(0, top - 4) * 80 - this.cam) * Math.min(1, dt * 3);
    if (!b.falling) {
      b.x += b.dir * (240 + top * 18) * dt;
      if (b.x > 1250 || b.x < 350) b.dir *= -1;
      return;
    }
    b.vy += 2400 * dt;
    b.y += b.vy * dt;
    const land = 800 - top * 80;
    if (b.y >= land && !b.slide) {
      const under = this.stack[top - 1], overlap = Math.min(b.x + b.w / 2, under.x + under.w / 2) - Math.max(b.x - b.w / 2, under.x - under.w / 2);
      if (overlap > b.w * 0.35) {
        this.stack.push({ x: b.x, w: b.w, c: b.c });
        this.good(b.x, land - 60, ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][this.stack.length - 2] || 'Yay!');
        Speech.say(['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!'][this.stack.length - 2] || 'Wow!');
        Snd.thud();
        if (this.stack.length - 1 >= this.goal) this.finish(1, 'What a tall tower!');
        else this.newBlock();
      } else {
        b.slide = Math.sign(b.x - under.x) || 1;
        this.oops(b.x, land - 40);
      }
    }
    if (b.slide) {
      b.x += b.slide * 500 * dt;
      b.rot = (b.rot || 0) + b.slide * dt * 4;
      if (b.y > 1000) this.newBlock();
    }
  },
  render(ctx) {
    gameBackdrop(ctx, '#ffeaf3', '#ffd6e8', { pattern: 'stars', accent: '#ffe2ef' });
    ctx.save();
    ctx.translate(0, this.cam);
    ctx.fillStyle = carpetPattern(ctx, '#d8f2c8');
    ctx.fillRect(0, 840, W, 400);
    this.stack.forEach((s, i) => {
      if (i === 0) { box(ctx, s.x - s.w / 2 - 20, 800, s.w + 40, 40, 10, '#e0b07c', { lw: 3 }); return; }
      box(ctx, s.x - s.w / 2, 800 - i * 80, s.w, 78, 14, s.c, { lw: 3 });
      drawStar(ctx, s.x, 800 - i * 80 + 39, 16, 'rgba(255,255,255,.75)');
    });
    const b = this.block, by = b.falling ? b.y : 800 - this.stack.length * 80 - 260 - Math.max(0, this.stack.length - 4) * 0;
    ctx.save();
    ctx.translate(b.x, (b.falling ? b.y : by) + 39);
    ctx.rotate(b.rot || 0);
    box(ctx, -b.w / 2, -39, b.w, 78, 14, b.c, { lw: 3 });
    ctx.restore();
    if (!b.falling) {
      ctx.strokeStyle = '#a9a2b8';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.moveTo(b.x, by + 80);
      ctx.lineTo(b.x, 800 - this.stack.length * 80);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    this.drawCheer(ctx, 170, H - 20, 200);
    drawText(ctx, `🧱 ${this.stack.length - 1} / ${this.goal}`, W - 140, 200, 44, { color: '#ff7fb0', stroke: '#fff' });
  },
  drop() {
    const b = this.block;
    if (b.falling) return;
    b.falling = true;
    b.y = 800 - this.stack.length * 80 - 260;
    b.vy = 0;
    Snd.whoosh();
  },
  down() { this.drop(); },
  keyDown(e) { if (e.code === 'Space' || e.code === 'Enter') this.drop(); },
  hammyAt() { return { x: 170, y: 700 }; },
});

// Tidy up: toys go into the right box.
dragGame('sort', {
  prompt: 'Tidy up! Put each toy in its box.',
  setup() {
    const groups = [['🧸', '🐰', '🐻'], ['🚗', '🚂', '🚀'], ['⚽', '🏀', '🎾']], labels = ['Cuddly toys', 'Things that go', 'Balls'];
    this.labels = labels;
    const items = [];
    groups.forEach((g, gi) => g.forEach(e => items.push({ key: gi, e })));
    return {
      items: shuffle(items).map((it, i) => ({ ...it, x: 180 + (i % 9) * 155, y: 300 + (i % 2) * 120, size: 100, draw(ctx, x, y, s) { drawEmoji(ctx, it.e, x, y, s); } })),
      slots: groups.map((g, gi) => ({ key: gi, x: 220 + gi * 420, y: 560, w: 340, h: 260 })),
    };
  },
  render(ctx) { gameBackdrop(ctx, '#ffeaf3', '#ffd6e8', { pattern: 'stars', accent: '#ffe2ef' }); },
  place(it, sl) { const n = sl.filled.length - 1; return { x: sl.x + 70 + (n % 3) * 100, y: sl.y + 170 }; },
  renderTop(ctx) {
    this.slots.forEach((sl, i) => {
      drawText(ctx, this.labels[i], sl.x + sl.w / 2, sl.y + 40, 26);
      drawEmoji(ctx, ['🧸', '🚗', '⚽'][i], sl.x + sl.w / 2, sl.y + 95, 50, { alpha: 0.35 });
    });
  },
  praise: () => pick(['Tidy!', 'In the box!', 'Great!']),
});

// Pretend tea party: a cup and a cookie for every teddy.
dragGame('teaparty', {
  prompt: 'Tea party time! Give every friend a cup of tea.',
  setup() {
    const guests = [['#d9a066', 'Teddy'], ['#ffb3cf', 'Bunny'], ['#a9dcff', 'Blue Bear'], ['#c9b6ff', 'Lulu']];
    this.guests = guests;
    return {
      items: guests.map((g, i) => ({ key: 'cup', x: 300 + i * 120, y: 800, size: 90, draw(ctx, x, y, s) { drawEmoji(ctx, '🍵', x, y, s); } }))
        .concat(guests.map((g, i) => ({ key: 'cookie', x: 900 + i * 120, y: 800, size: 80, draw(ctx, x, y, s) { drawEmoji(ctx, '🍪', x, y, s); } }))),
      slots: guests.flatMap((g, i) => [{ key: 'cup', guest: i, cap: 1, x: 210 + i * 320, y: 470, w: 130, h: 120 }, { key: 'cookie', guest: i, cap: 1, x: 340 + i * 320, y: 470, w: 110, h: 120 }]),
    };
  },
  render(ctx) {
    gameBackdrop(ctx, '#ffeaf3', '#ffd6e8', { pattern: 'hearts', accent: '#ffe0ec' });
    this.guests.forEach(([c], i) => Props.teddy(ctx, 330 + i * 320, 430, 1.6, c));
    rr(ctx, 120, 440, W - 240, 190, 50);
    paint(ctx, '#fff6e8', 440, 630, { lw: 4 });
  },
  renderTop(ctx) {
    this.slots.forEach(sl => { if (!sl.filled.length) drawText(ctx, sl.key === 'cup' ? '☕?' : '🍪?', sl.x + sl.w / 2, sl.y + sl.h / 2, 30, { color: 'rgba(120,100,140,.4)' }); });
    this.guests.forEach(([, name], i) => drawText(ctx, name, 330 + i * 320, 660, 24));
  },
  praise: () => pick(['Thank you!', 'Yummy tea!', 'How kind!']),
  isDone() { return this.items.every(i => i.placed); },
});

// Free drawing on the chalkboard, with colors, sizes and stamps.
defineGame('drawing', {
  init() {
    this.paper = document.createElement('canvas');
    this.paper.width = 1200;
    this.paper.height = 620;
    this.pg = this.paper.getContext('2d');
    this.pg.fillStyle = '#4f7a63';
    this.pg.fillRect(0, 0, 1200, 620);
    this.color = '#ffffff';
    this.size = 14;
    this.stamp = null;
    this.last = null;
    const cols = ['#ffffff', ...Object.values(COLORS)];
    this.buttons = cols.map((c, i) => ({ x: 1440, y: 130 + i * 74, w: 120, h: 62, color: c, onClick: b => { this.color = c; this.stamp = null; this.mark(b); } }));
    [['🖍️', 8], ['🖌️', 20], ['🧽', 44]].forEach(([e, s], i) => this.buttons.push({ x: 40, y: 140 + i * 100, w: 120, h: 86, emoji: e, color: '#ffffff', onClick: b => { this.size = s; this.eraser = e === '🧽'; this.stamp = null; this.mark(b); } }));
    ['⭐', '❤️', '🌸', '🦋'].forEach((e, i) => this.buttons.push({ x: 40, y: 460 + i * 86, w: 120, h: 74, emoji: e, color: '#fff3b8', onClick: b => { this.stamp = e; this.mark(b); } }));
    this.buttons.push({ x: 1440, y: 740, w: 120, h: 66, label: 'Clear', color: '#ffd6e5', size: 22, onClick: () => { this.pg.fillStyle = '#4f7a63'; this.pg.fillRect(0, 0, 1200, 620); Snd.whoosh(); } });
    this.mark(this.buttons[0]);
    this.say('Draw anything you like! Tap ✅ when you are done.');
  },
  mark(b) { for (const x of this.buttons) x.selected = x === b; },
  toPaper(p) { return { x: p.x - 200, y: p.y - 190 }; },
  render(ctx) {
    gameBackdrop(ctx, '#fff8d9', '#fff0b3', { pattern: 'checks', accent: '#fff4c4' });
    box(ctx, 186, 176, 1228, 648, 18, '#c98f5b', { lw: 4 });
    ctx.drawImage(this.paper, 200, 190, 1200, 620);
    if (this.stamp && Input.pointer.inside) drawEmoji(ctx, this.stamp, Input.pointer.x, Input.pointer.y, 80, { alpha: 0.5 });
    drawText(ctx, '🎨', 100, 110, 40);
  },
  paint(p) {
    const q = this.toPaper(p);
    if (q.x < 0 || q.y < 0 || q.x > 1200 || q.y > 620) { this.last = null; return; }
    const g = this.pg;
    if (this.stamp) {
      g.save();
      g.font = `90px ${EMOJI_FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(this.stamp, q.x, q.y);
      g.restore();
      Snd.pop();
      this.score++;
      return;
    }
    g.strokeStyle = this.eraser ? '#4f7a63' : this.color;
    g.lineWidth = this.size;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    if (this.last) g.moveTo(this.last.x, this.last.y);
    else g.moveTo(q.x - 0.1, q.y);
    g.lineTo(q.x, q.y);
    g.stroke();
    this.last = q;
    this.score++;
  },
  down(p) { this.last = null; this.paint(p); },
  move(p) { if (Input.pointer.down && !this.stamp) this.paint(p); },
  up() { this.last = null; },
  hammyAt() { return { x: 800, y: 500 }; },
});
