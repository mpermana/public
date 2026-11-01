// Snack Time: walk to fruits and vegetables (or drag them with the mouse) to
// eat them and grow bigger. The thought bubble shows a favorite food for bonus
// love. Fully grown -> party, then back to baby size.

const MAX_GROWTH = 2.6;

Modes.push({
  id: 'feed', emoji: '🍎', title: 'mode_feed', inputs: '⌨️ 🖱️ 🎮', color: '#ff9f1c',

  start() {
    this.animal = new Animal(Settings.animal);
    this.foods = [];
    this.drag = null;
    this.steering = false;
    this.party = 0;
    this.spawnT = 0;
    this.wish = pick(FOODS);
    for (let i = 0; i < 5; i++) this.foods.push(this.newFood());
    this.dock = UI.animalDock(id => this.animal.setKind(id));
    UI.setExtra(...this.dock.nodes);
    UI.say(this.animal.kind.id, this.animal.kind.emoji);
  },

  newFood() {
    const a = this.animal, kind = this.foods.some(f => f.id === this.wish.id) ? pick(FOODS) : this.wish;
    for (let tries = 0; ; tries++) {
      const f = { ...kind, x: rand(0.08, 0.92) * Stage.w, y: rand(Math.max(150, Stage.h * 0.35), Stage.h * 0.88), r: 40 * Stage.k, t: rand(0, 6), born: 0 };
      if (tries > 20 || dist(f.x, f.y, a.x, a.y) > a.radius * 2.5) return f;
    }
  },

  update(dt) {
    const a = this.animal, p = Input.pointer;
    let [dx, dy] = Input.dir();
    if (p.down && this.steering && !dx && !dy) [dx, dy] = a.steer(p.x, p.y);
    a.update(dt, dx, dy);

    if (this.drag) {
      this.drag.x = p.x;
      this.drag.y = p.y;
    }
    for (const f of this.foods) {
      f.t += dt;
      f.born = Math.min(1, f.born + dt * 3);
    }
    const reach = a.radius + 20 * Stage.k, food = this.foods.find(f => dist(f.x, f.y, a.x, a.y) < reach);
    if (food) this.eat(food);

    if (this.foods.length < 5 && (this.spawnT += dt) > 0.8) {
      this.spawnT = 0;
      this.foods.push(this.newFood());
    }
    if (this.party > 0) {
      this.party -= dt;
      if (Math.random() < dt * 20) FX.burst(rand(0, Stage.w), rand(0, Stage.h * 0.5), { n: 6 });
      if (this.party <= 0) this.shrink();
    }
  },

  eat(f) {
    const a = this.animal;
    this.foods.splice(this.foods.indexOf(f), 1);
    if (this.drag === f) this.drag = null;
    Sfx.chomp();
    a.squish = 0.35;
    FX.burst(f.x, f.y, { n: 10, colors: ['#fff', '#ffd60a'] });
    UI.say(f.id, f.emoji);
    Progress.earn(f.id === this.wish.id && this.party <= 0 ? 2 : 1, f.x, f.y);
    if (this.party > 0) return;

    a.scale = Math.min(MAX_GROWTH, a.scale + 0.14);
    if (f.id === this.wish.id) {
      a.scale = Math.min(MAX_GROWTH, a.scale + 0.1);
      Sfx.ding(7);
      FX.burst(a.x, a.y - a.size * 0.5, { emojis: ['💖'], n: 6 });
      Speech.speak(word('yummy').text, Settings.lang, { interrupt: false });
      this.wish = pick(FOODS.filter(x => x.id !== f.id));
    }
    if (a.scale >= MAX_GROWTH) {
      Progress.earn(3, a.x, a.y);
      this.party = 3;
      Sfx.tada();
      a.doAction();
      Speech.speak(word('big').text, Settings.lang, { interrupt: false });
      FX.text(a.x, a.y - a.size * 0.7, word('big').text, '#ff70a6', 72);
      FX.burst(a.x, a.y, { n: 40, speed: 500 });
    }
  },

  shrink() {
    const a = this.animal;
    a.scale = 1;
    Sfx.pop();
    FX.burst(a.x, a.y, { emojis: ['✨'], n: 12 });
  },

  draw(ctx) {
    const k = Stage.k;
    for (const f of this.foods) {
      if (f === this.drag) continue;
      const pop = 1 - Math.pow(1 - f.born, 3);
      drawEmoji(ctx, f.emoji, f.x, f.y + Math.sin(f.t * 2.5) * 5 * k, f.r * 2.4 * pop, { rot: Math.sin(f.t * 1.7) * 0.12 });
    }
    this.animal.draw(ctx);
    this.drawWish(ctx);
    if (this.drag) drawEmoji(ctx, this.drag.emoji, this.drag.x, this.drag.y, this.drag.r * 2.9);
    this.drawGrowth(ctx);
  },

  drawWish(ctx) {
    if (this.party > 0) return;
    const a = this.animal, s = a.size, r = 42 * Stage.k;
    const x = clamp(a.x + s * 0.6, r + 8, Stage.w - r - 8), y = Math.max(a.y - s * 0.8, r + 130);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    circle(ctx, a.x + s * 0.3, a.y - s * 0.4, r * 0.15);
    circle(ctx, (a.x + s * 0.3 + x) / 2, (a.y - s * 0.4 + y) / 2, r * 0.25);
    circle(ctx, x, y, r);
    drawEmoji(ctx, this.wish.emoji, x, y, r * 1.6);
  },

  // Rainbow bar: how close the animal is to fully grown.
  drawGrowth(ctx) {
    const w = Math.min(Stage.w * 0.5, 460), h = 22 * Stage.k + 6, x = (Stage.w - w) / 2, y = 92;
    const fill = clamp((this.animal.shown - 1) / (MAX_GROWTH - 1), 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.strokeStyle = 'rgba(91,74,122,.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.stroke();
    if (fill > 0.01) {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c.hex));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, Math.max(h - 6, (w - 6) * fill), h - 6, (h - 6) / 2);
      ctx.fill();
    }
    drawEmoji(ctx, this.animal.kind.emoji, x - h * 0.9, y + h / 2, h * 1.3);
    drawEmoji(ctx, this.animal.kind.emoji, x + w + h * 1.3, y + h / 2, h * 2.4);
  },

  foodAt(x, y) {
    return [...this.foods].reverse().find(f => dist(x, y, f.x, f.y) < f.r * 1.3);
  },

  // Food under the mouse says "Drag!"; while dragging, the animal glows as the drop target.
  hint() {
    const a = this.animal, p = Input.pointer;
    if (this.drag) return { x: a.x, y: a.y - a.size * 0.05, r: a.radius * 1.5, cursor: 'grabbing' };
    const f = Input.lastDevice === 'mouse' && p.inside && this.foodAt(p.x, p.y);
    if (f) return { x: f.x, y: f.y, r: f.r * 1.3, text: `🖱️ ${word('drag').text}`, cursor: 'grab' };
    return animalHint(a);
  },

  onAction() {
    this.animal.doAction();
    UI.say(this.animal.kind.id, this.animal.kind.emoji);
  },

  onPointerDown(p) {
    const f = this.foodAt(p.x, p.y);
    if (f) {
      this.drag = f;
      this.steering = false;
      Sfx.click();
      return;
    }
    const a = this.animal;
    if (dist(p.x, p.y, a.x, a.y) < a.radius * 1.2) {
      this.steering = false;
      this.onAction();
      return;
    }
    this.steering = true;
  },

  onPointerUp() {
    this.drag = null;
    this.steering = false;
  },
});
