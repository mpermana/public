// Bubble Pop: bubbles with animals and foods drift up. Click them (or, in
// "touch" mode, just move the mouse over them) to pop and hear the word.
// A controller or the arrow keys drive a magic cursor; A / Space pops.

Modes.push({
  id: 'bubbles', emoji: '🫧', title: 'mode_bubbles', inputs: '🖱️ 🎮', color: '#2ec27e',
  touchPop: false,

  start() {
    this.bubbles = [];
    this.spawnT = 0;
    this.cursor = { x: Stage.w / 2, y: Stage.h / 2, visible: false };
    this.lastSpark = { x: 0, y: 0 };
    this.popButtons = [
      UI.button('🖱️ Click', () => this.setTouch(false), { cls: 'text', title: 'Pop by clicking' }),
      UI.button('👆 Touch', () => this.setTouch(true), { cls: 'text', title: 'Pop by moving over' }),
    ];
    UI.setExtra(...this.popButtons);
    this.setTouch(this.touchPop);
  },

  setTouch(on) {
    this.touchPop = on;
    this.popButtons.forEach((b, i) => b.classList.toggle('selected', (i === 1) === on));
  },

  spawn() {
    const k = Stage.k, r = rand(62, 92) * k;
    this.bubbles.push({
      item: pick([...ANIMALS, ...FOODS]), r, hue: rand(0, 360), t: rand(0, 6),
      x: rand(r, Stage.w - r), y: Stage.h + r, vx: rand(-20, 20) * k, vy: rand(45, 80) * k,
    });
  },

  update(dt) {
    const k = Stage.k;
    if (this.bubbles.length < 7 && (this.spawnT += dt) > 0.9) {
      this.spawnT = 0;
      this.spawn();
    }
    for (const b of this.bubbles) {
      b.t += dt;
      b.y -= b.vy * dt;
      b.x += (b.vx + Math.sin(b.t * 1.5) * 25 * k) * dt;
      if (b.x < b.r || b.x > Stage.w - b.r) {
        b.vx = -b.vx;
        b.x = clamp(b.x, b.r, Stage.w - b.r);
      }
    }
    this.bubbles = this.bubbles.filter(b => b.y > -b.r * 1.2);

    const [dx, dy] = Input.dir(), c = this.cursor;
    if (dx || dy) {
      c.visible = true;
      c.x = clamp(c.x + dx * 700 * k * dt, 0, Stage.w);
      c.y = clamp(c.y + dy * 700 * k * dt, 0, Stage.h);
    }
    if (this.touchPop) {
      const p = Input.pointer;
      if (p.down || (p.inside && p.type === 'mouse')) this.popAt(p.x, p.y);
      if (c.visible) this.popAt(c.x, c.y);
    }
  },

  bubbleAt(x, y) {
    return this.bubbles.find(b => dist(x, y, b.x, b.y) < b.r);
  },

  popAt(x, y) {
    const b = this.bubbleAt(x, y);
    if (b) this.pop(b);
    return !!b;
  },

  // A bubble under the controller cursor says "Press A"; under the mouse, "Click!".
  // Touch mode needs no hint: the bubble pops as soon as you reach it.
  hint() {
    const c = this.cursor, p = Input.pointer;
    if (c.visible) {
      const b = this.bubbleAt(c.x, c.y);
      return b && { x: b.x, y: b.y, r: b.r * 1.12, text: hintFor({ click: null }) };
    }
    if (this.touchPop || Input.lastDevice !== 'mouse' || !p.inside) return null;
    const b = this.bubbleAt(p.x, p.y);
    return b && { x: b.x, y: b.y, r: b.r * 1.12, text: hintFor(), cursor: 'pointer' };
  },

  pop(b) {
    this.bubbles.splice(this.bubbles.indexOf(b), 1);
    Progress.earn(1, b.x, b.y);
    Sfx.pop();
    FX.burst(b.x, b.y, { colors: ['#bfe9ff', '#ffffff', '#d7c6ff'], n: 18 });
    FX.add({ kind: 'emoji', text: b.item.emoji, x: b.x, y: b.y, vy: -60 * Stage.k, life: 1.3, size: b.r * 1.4 });
    UI.say(b.item.id, b.item.emoji);
  },

  draw(ctx) {
    for (const b of this.bubbles) this.drawBubble(ctx, b);
    const c = this.cursor;
    if (c.visible) {
      const k = Stage.k;
      ctx.lineWidth = 6 * k;
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 26 * k, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 3 * k;
      ctx.strokeStyle = `hsl(${(Stage.time * 200) % 360}, 90%, 60%)`;
      ctx.stroke();
      drawEmoji(ctx, '✨', c.x + 22 * k, c.y - 22 * k, 34 * k);
    }
  },

  drawBubble(ctx, b) {
    const wob = 1 + Math.sin(b.t * 3) * 0.03;
    drawEmoji(ctx, b.item.emoji, b.x, b.y, b.r * 1.25, { rot: Math.sin(b.t) * 0.2 });
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(wob, 2 - wob);
    const g = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, b.r * 0.05, 0, 0, b.r);
    g.addColorStop(0, 'rgba(255,255,255,.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,.08)');
    g.addColorStop(0.9, 'rgba(160,210,255,.35)');
    g.addColorStop(1, 'rgba(255,255,255,.8)');
    ctx.fillStyle = g;
    circle(ctx, 0, 0, b.r);
    ctx.lineWidth = 3 * Stage.k;
    ctx.strokeStyle = `hsla(${(b.t * 60 + b.hue) % 360}, 90%, 70%, .75)`;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.ellipse(-b.r * 0.4, -b.r * 0.45, b.r * 0.16, b.r * 0.09, -0.7, 0, TAU);
    ctx.fill();
    ctx.restore();
  },

  onPointerMove(p) {
    this.cursor.visible = false;
    if (dist(p.x, p.y, this.lastSpark.x, this.lastSpark.y) > 14) {
      this.lastSpark = { x: p.x, y: p.y };
      const k = Stage.k;
      FX.add({ x: p.x, y: p.y, vx: rand(-30, 30) * k, vy: rand(-30, 30) * k, life: 0.6, size: 6 * k, color: `hsl(${(Stage.time * 200) % 360}, 90%, 65%)` });
    }
  },

  onPointerDown(p) { this.popAt(p.x, p.y); },

  onAction() {
    const c = this.cursor;
    if (!c.visible) c.visible = true;
    else this.popAt(c.x, c.y);
  },
});
