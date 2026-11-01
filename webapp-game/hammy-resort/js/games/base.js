// Mini-game scaffolding: every game is a scene "game:<id>" with the same
// frame (prompt banner, Done button, companion, finish celebration), plus
// reusable patterns: quiz cards, drag-and-drop, scrubbing, tapping moving
// targets, and steering Hammy to collect things. Games are forgiving:
// wrong answers just say "try again", and stopping early is always fine.

const Games = {};

function defineGame(id, def) {
  const scene = {
    sim: true,
    back: 'stop',
    music: def.music,
    ...def,
    enter(params = {}) {
      this.act = params.act || Object.values(ACTS).find(a => a.game === id) || { id, name: def.title || id, icon: '⭐', effects: {}, stars: 1 };
      this.params = { ...(this.act.params || {}), ...(params.params || {}) };
      this.t = 0;
      this.finished = false;
      this.score = 0;
      this.tries = 0;
      this.buttons = [];
      this.prompt = '';
      this.reaction = null;
      this.doneBtn = { x: W - 214, y: H - 108, w: 190, h: 78, color: '#7ed99a', emoji: '✅', label: 'Done', size: 30, onClick: () => this.finish(0, null, true) };
      if (def.music === 'quiet') Music.duck(true);
      else if (def.music) Music.play(def.music);
      def.init.call(this, this.params);
    },
    exit() {
      Music.duck(false);
      Snd.water(false);
      def.cleanup?.call(this);
    },
    update(dt) {
      this.t += dt;
      if (this.reaction && (this.reaction.t -= dt) <= 0) this.reaction = null;
      if (!this.finished) def.tick?.call(this, dt);
    },
    draw(ctx) {
      def.render.call(this, ctx);
      Btn.drawAll(ctx, this.buttons, 1 / 60);
      if (!this.finished && def.doneButton !== false && (this.score > 0 || this.t > 20)) Btn.draw(ctx, this.doneBtn);
      if (this.prompt) this.drawPrompt(ctx);
      if (this.finished) this.drawFinish(ctx);
    },
    drawPrompt(ctx) {
      const lines = wrapLines(ctx, this.prompt, 900, 32);
      const w = Math.min(1000, Math.max(...lines.map(l => { ctx.font = `700 32px ${FONT}`; return ctx.measureText(l).width; })) + 70), h = lines.length * 40 + 26;
      ctx.save();
      ctx.shadowColor = 'rgba(74,58,92,.25)';
      ctx.shadowBlur = 12;
      rr(ctx, W / 2 - w / 2, 86, w, h, 28);
      ctx.fillStyle = 'rgba(255,252,245,.96)';
      ctx.fill();
      ctx.restore();
      lines.forEach((l, i) => drawText(ctx, l, W / 2, 86 + 33 + i * 40, 32));
    },
    drawFinish(ctx) {
      const p = clamp((this.t - this.finishedAt) * 2, 0, 1);
      ctx.fillStyle = `rgba(255,250,235,${0.35 * p})`;
      ctx.fillRect(0, 0, W, H);
      drawText(ctx, this.finishText || 'Hooray!', W / 2, H / 2 - 30, 90 * Ease.back(p), { color: '#ff7fb0', stroke: '#fff', sw: 0.16 });
    },
    pointerDown(p) {
      if (this.finished) return;
      if (def.doneButton !== false && (this.score > 0 || this.t > 20) && Btn.press([this.doneBtn], p)) return;
      if (Btn.press(this.buttons, p)) return;
      def.down?.call(this, p);
    },
    pointerMove(p) { if (!this.finished) def.move?.call(this, p); },
    pointerUp(p) { if (!this.finished) def.up?.call(this, p); },
    key(e) {
      if (this.finished) return;
      def.keyDown?.call(this, e);
    },
    hammyPos() { return def.hammyAt ? def.hammyAt.call(this) : { x: W / 2, y: H / 2 }; },

    say(text, speak = true) {
      this.prompt = text;
      if (speak) Speech.say(text);
    },
    react(kind) { this.reaction = { kind, t: 1.3 }; },
    good(x, y, text = pick(['Yay!', 'Great!', 'Super!', 'Well done!', 'Wow!'])) {
      this.score++;
      Snd.ding(this.score % 8);
      FX.stars(x, y, 10);
      FX.text(x, y - 40, text, '#ff6f9c', 44);
      this.react('good');
    },
    oops(x, y) {
      this.tries++;
      Snd.hmm();
      FX.text(x, y - 30, 'Try again!', '#7cc6ff', 38);
      this.react('oops');
    },

    // End the game: a short celebration, then the reward card.
    // `early` is the Done button: still rewarded once the child has tried.
    finish(bonus = 0, text = null, early = false) {
      if (this.finished) return;
      if (early && this.score === 0 && this.t < 20) return;
      this.finished = true;
      this.finishedAt = this.t;
      this.finishText = text || (early ? 'Good try!' : pick(['Hooray!', 'You did it!', 'Amazing!']));
      Snd.cheer();
      FX.confetti(60);
      setTimeout(() => {
        if (Activity.current) Activity.complete({ bonus: early ? 0 : bonus, text: this.finishText });
        else Game.go(S.scene && Scenes[S.scene] && !S.scene.startsWith('game:') ? S.scene : 'map');
      }, 1100);
    },
    quit() { Activity.current ? Activity.cancel() : Game.go('map'); },

    // Who is playing along (Mom, Dad, a friend) for this activity.
    buddy() {
      const w = this.act.with;
      if (w === 'mom' || w === 'dad') return w;
      if (w === 'family') return 'mom';
      if (w === 'friend') return this.params.friend || Friends.invited()?.id || Friends.birthday()?.id || FRIENDS[S.time.day % FRIENDS.length].id;
      return null;
    },

    // Hammy (and the buddy) cheering in a corner of the game.
    drawCheer(ctx, x = 150, y = H - 30, size = 190) {
      const r = this.reaction?.kind;
      drawHamster(ctx, x, y, size, { pose: r === 'good' ? 'celebrate' : r === 'oops' ? 'think' : this.cheerPose || 'idle', mood: r === 'oops' ? 'curious' : 'happy' });
      const b = this.buddy();
      if (b) drawHamster(ctx, x + size * 0.85, y, size * (FAMILY[b] ? FAMILY[b].h * 0.85 : 0.95), { kind: b, pose: r === 'good' ? 'celebrate' : 'idle', mood: 'happy', facing: -1, seed: 2 });
    },
  };
  Games[id] = scene;
  return defineScene(`game:${id}`, scene);
}

// A soft full-screen backdrop for a game.
function gameBackdrop(ctx, top = '#fff3e6', bottom = '#ffe1ec', { pattern = null, accent = '#ffffff' } = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (pattern) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = wallPattern(ctx, pattern, top, accent);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

// A big rounded card (for quiz choices, cards, slots).
function card(ctx, x, y, w, h, { color = '#ffffff', glow = false, lift = 0, alpha = 1, r = 28 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow) {
    ctx.shadowColor = '#ffd34d';
    ctx.shadowBlur = 26 + Math.sin(Game.time * 6) * 8;
  }
  rr(ctx, x, y + 7 - lift, w, h, r);
  ctx.fillStyle = shade(color === '#ffffff' ? '#e9e0f2' : color, -0.15);
  ctx.fill();
  ctx.shadowBlur = 0;
  rr(ctx, x, y - lift, w, h, r);
  const g = ctx.createLinearGradient(0, y - lift, 0, y + h - lift);
  g.addColorStop(0, shade(color, 0.12));
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ quiz

// def: { title, rounds, music, backdrop(ctx), make(i) -> round }
// round: { prompt, show(ctx) (the picture), choices: [{ label | emoji | draw(ctx, cx, cy, size), correct }], praise }
function quizGame(id, def) {
  return defineGame(id, {
    music: def.music,
    init() {
      this.round = 0;
      this.total = def.rounds || 5;
      this.focus = 0;
      this.next();
    },
    next() {
      const r = def.make.call(this, this.round);
      this.cur = { ...r, choices: shuffle(r.choices).map(c => ({ ...c, out: false, pop: 0 })), solved: false, t: 0 };
      this.focus = 0;
      this.say(r.prompt);
    },
    tick(dt) {
      this.cur.t += dt;
      for (const c of this.cur.choices) c.pop = Math.max(0, c.pop - dt * 3);
      if (this.cur.solved && this.cur.t > this.cur.solvedAt + 1.3) {
        this.round++;
        if (this.round >= this.total) this.finish(this.tries === 0 ? 1 : 0, this.tries === 0 ? 'Perfect!' : null);
        else this.next();
      }
    },
    layout() {
      const n = this.cur.choices.length, cw = n > 3 ? 230 : 260, gap = 40, total = n * cw + (n - 1) * gap, x0 = (W - total) / 2 + 80;
      return this.cur.choices.map((c, i) => ({ c, x: x0 + i * (cw + gap), y: 600, w: cw, h: 210 }));
    },
    render(ctx) {
      if (def.backdrop) def.backdrop.call(this, ctx);
      else gameBackdrop(ctx, '#fff7e8', '#ffe6f0', { pattern: 'dots', accent: '#ffe0ea' });
      box(ctx, 220, 180, W - 440, 360, 40, '#ffffff', { lw: 0 });
      ctx.save();
      rr(ctx, 220, 180, W - 440, 360, 40);
      ctx.clip();
      this.cur.show?.call(this, ctx, { x: 220, y: 180, w: W - 440, h: 360 });
      ctx.restore();
      for (const [i, L] of this.layout().entries()) {
        const { c } = L, good = this.cur.solved && c.correct;
        card(ctx, L.x, L.y, L.w, L.h, { color: good ? '#d9f8e1' : c.color || '#ffffff', glow: good || (Input.lastDevice === 'key' && i === this.focus && !this.cur.solved), lift: c.pop * 10, alpha: c.out ? 0.35 : 1 });
        const cx = L.x + L.w / 2, cy = L.y + L.h / 2 - c.pop * 10;
        if (c.draw) c.draw(ctx, cx, cy, Math.min(L.w, L.h) * 0.7);
        else if (c.emoji) drawEmoji(ctx, c.emoji, cx, cy - (c.label ? 20 : 0), 110);
        if (c.label) drawText(ctx, c.label, cx, c.emoji || c.draw ? L.y + L.h - 34 : cy, c.emoji || c.draw ? 30 : c.big || 90, { color: c.ink || PAL.ink });
      }
      drawText(ctx, `${'⭐'.repeat(this.round)}${'☆'.repeat(this.total - this.round)}`, W / 2, 562, 30, { color: '#ffb300' });
      this.drawCheer(ctx, 130, H - 20, 170);
    },
    choose(i) {
      const L = this.layout()[i];
      if (!L || this.cur.solved || L.c.out) return;
      L.c.pop = 1;
      if (L.c.correct) {
        this.cur.solved = true;
        this.cur.solvedAt = this.cur.t;
        this.good(L.x + L.w / 2, L.y, this.cur.praise);
        if (this.cur.after) Speech.say(this.cur.after, { interrupt: false });
        def.onCorrect?.call(this, L.c);
      } else {
        L.c.out = true;
        this.oops(L.x + L.w / 2, L.y);
        Speech.say(pick(['Try again!', 'Not that one. Try another!', 'Almost! Try again!']));
      }
    },
    down(p) {
      const i = this.layout().findIndex(L => p.x >= L.x && p.x <= L.x + L.w && p.y >= L.y && p.y <= L.y + L.h);
      if (i >= 0) this.choose(i);
      else if (p.y > 180 && p.y < 540) Speech.say(this.cur.prompt);
    },
    keyDown(e) {
      const n = this.cur.choices.length;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.focus = (this.focus + n - 1) % n;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.focus = (this.focus + 1) % n;
      if (e.code === 'Enter' || e.code === 'Space') this.choose(this.focus);
      const d = Number(e.key);
      if (d >= 1 && d <= n) this.choose(d - 1);
    },
  });
}

// Draw `n` copies of an emoji in tidy rows inside an area (for counting).
function drawCountables(ctx, area, emoji, n, size = 70) {
  const cols = Math.min(n, n > 10 ? 7 : 5), rows = Math.ceil(n / cols);
  const gx = Math.min(size * 1.25, (area.w - 60) / cols), gy = Math.min(size * 1.15, (area.h - 40) / rows);
  const s = Math.min(size, gx * 0.9, gy * 0.9);
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols, inRow = Math.min(cols, n - r * cols);
    const x = area.x + area.w / 2 + (c - (inRow - 1) / 2) * gx, y = area.y + area.h / 2 + (r - (rows - 1) / 2) * gy;
    drawEmoji(ctx, emoji, x, y + Math.sin(Game.time * 2 + i) * 3, s);
  }
}

// ------------------------------------------------------------ drag & drop

// def.setup.call(this) returns { items: [{ x, y, key, draw(ctx, x, y, s), size }], slots: [{ x, y, w, h, key, draw(ctx, slot) }] }
// def.fits(item, slot) (default: same key); def.onPlace; def.render (backdrop).
function dragGame(id, def) {
  return defineGame(id, {
    music: def.music,
    init() {
      const s = def.setup.call(this);
      this.items = s.items.map(it => ({ size: 90, ...it, hx: it.x, hy: it.y, placed: null }));
      this.slots = s.slots.map(sl => ({ ...sl, filled: [] }));
      this.drag = null;
      this.say(def.prompt);
    },
    tick(dt) {
      for (const it of this.items) {
        if (it === this.drag || it.placed) continue;
        it.x += (it.hx - it.x) * Math.min(1, dt * 8);
        it.y += (it.hy - it.y) * Math.min(1, dt * 8);
      }
      def.tick?.call(this, dt);
    },
    render(ctx) {
      def.render.call(this, ctx);
      for (const sl of this.slots) {
        const hover = this.drag && this.slotAt(this.drag) === sl;
        if (sl.draw) sl.draw.call(this, ctx, sl, hover);
        else {
          card(ctx, sl.x, sl.y, sl.w, sl.h, { color: hover ? '#fff3b8' : '#ffffff', r: 24 });
        }
      }
      const order = [...this.items].sort((a, b) => (a === this.drag) - (b === this.drag));
      for (const it of order) {
        const s = it === this.drag ? 1.15 : 1;
        if (it === this.drag) groundShadow(ctx, it.x, it.y + it.size * 0.55, it.size * 0.4, 10, 0.15);
        it.draw.call(this, ctx, it.x, it.y + (it.placed ? 0 : Math.sin(Game.time * 2 + it.hx) * 3), it.size * s, it);
      }
      def.renderTop?.call(this, ctx);
    },
    slotAt(it) {
      return this.slots.find(sl => it.x >= sl.x && it.x <= sl.x + sl.w && it.y >= sl.y - 20 && it.y <= sl.y + sl.h + 20);
    },
    down(p) {
      const it = [...this.items].reverse().find(i => !i.placed && dist(p.x, p.y, i.x, i.y) < i.size * 0.65);
      if (it) {
        this.drag = it;
        it.dx = it.x - p.x;
        it.dy = it.y - p.y;
        Snd.tap();
        def.onPick?.call(this, it);
      } else def.down?.call(this, p);
    },
    move(p) {
      if (this.drag) {
        this.drag.x = p.x + this.drag.dx;
        this.drag.y = p.y + this.drag.dy;
      }
    },
    up() {
      const it = this.drag;
      if (!it) return;
      this.drag = null;
      const sl = this.slotAt(it);
      if (sl && (def.fits ? def.fits.call(this, it, sl) : it.key === sl.key) && (!sl.cap || sl.filled.length < sl.cap)) {
        it.placed = sl;
        sl.filled.push(it);
        const spot = def.place ? def.place.call(this, it, sl) : { x: sl.x + sl.w / 2, y: sl.y + sl.h / 2 };
        it.x = spot.x;
        it.y = spot.y;
        this.good(it.x, it.y - 30, def.praise?.(it, sl));
        def.onPlace?.call(this, it, sl);
        if (this.items.every(i => i.placed) || def.isDone?.call(this)) setTimeout(() => this.finish(this.tries === 0 ? 1 : 0), 500);
      } else if (sl) {
        this.oops(it.x, it.y);
        def.onWrong?.call(this, it, sl);
      }
    },
  });
}

// ------------------------------------------------------------ scrubbing

// Rub away "dirt" blobs with the pointer (or move the sponge with arrows
// and hold Space). def: { prompt, blobs(), render(ctx), tool, after }
function scrubGame(id, def) {
  return defineGame(id, {
    music: def.music || 'home',
    init(params) {
      this.kind = params.kind;
      this.blobs = def.blobs.call(this);
      this.total = this.blobs.length;
      this.tool = { x: W / 2, y: H / 2, down: false };
      this.phase = 'scrub';
      this.rinse = 0;
      def.init?.call(this);
      this.say(def.prompt.call ? def.prompt.call(this) : def.prompt);
    },
    tick(dt) {
      const [dx, dy] = Input.dir();
      if (dx || dy) {
        this.tool.x = clamp(this.tool.x + dx * 600 * dt, 0, W);
        this.tool.y = clamp(this.tool.y + dy * 600 * dt, 0, H);
        this.tool.key = true;
      }
      const rubbing = (this.tool.down || Input.held.has('Space')) && this.phase === 'scrub';
      if (rubbing) {
        for (const b of this.blobs) {
          if (b.hp <= 0) continue;
          if (dist(this.tool.x, this.tool.y, b.x, b.y) < b.r + 40) {
            b.hp -= dt * 2.2;
            if (Math.random() < dt * 14) FX.bubbles(b.x, b.y, 1, b.r);
            if (b.hp <= 0) {
              this.score++;
              Snd.pop();
              FX.sparkle(b.x, b.y, 4);
            }
          }
        }
        if (Math.random() < dt * 8) Snd.noise(0.06, { freq: 3000, type: 'bandpass', vol: 0.08 });
      }
      if (this.phase === 'scrub' && this.blobs.every(b => b.hp <= 0)) {
        this.phase = def.rinse === false ? 'done' : 'rinse';
        this.say(def.after || 'Now rinse! Tap the water!');
        if (this.phase === 'done') this.finish(1, 'Squeaky clean!');
      }
      def.tick?.call(this, dt);
    },
    render(ctx) {
      def.render.call(this, ctx);
      for (const b of this.blobs) {
        if (b.hp <= 0) continue;
        ctx.save();
        ctx.globalAlpha = clamp(b.hp, 0.15, 1);
        (def.drawBlob || drawFoamBlob).call(this, ctx, b);
        ctx.restore();
      }
      if (this.phase === 'rinse') {
        this.drawRinseButton(ctx);
      }
      const t = this.tool;
      if (Input.pointer.inside || t.key) {
        drawEmoji(ctx, def.tool || '🧽', t.x, t.y, 90, { rot: Math.sin(Game.time * 12) * (t.down ? 0.3 : 0.05) });
      }
      const left = this.blobs.filter(b => b.hp > 0).length;
      if (this.phase === 'scrub') drawText(ctx, `${'🫧'.repeat(Math.min(left, 12))}`, W / 2, H - 40, 34);
    },
    drawRinseButton(ctx) {
      const b = { x: W / 2 - 160, y: H - 150, w: 320, h: 96, color: '#7cc6ff', emoji: def.rinseIcon || '🚿', label: def.rinseLabel || 'Rinse!', size: 36, glow: true };
      this.rinseBtn = b;
      Btn.draw(ctx, b);
      if (this.rinsing) {
        ctx.fillStyle = 'rgba(160,215,255,.25)';
        ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 30; i++) {
          const x = (i * 53 + Game.time * 200) % W, y = (i * 97 + Game.time * 700) % H;
          ctx.strokeStyle = 'rgba(120,190,255,.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 4, y + 22);
          ctx.stroke();
        }
      }
    },
    down(p) {
      if (this.phase === 'rinse' && this.rinseBtn && p.x >= this.rinseBtn.x && p.x <= this.rinseBtn.x + this.rinseBtn.w && p.y >= this.rinseBtn.y && p.y <= this.rinseBtn.y + this.rinseBtn.h + 6) {
        this.startRinse();
        return;
      }
      this.tool.down = true;
      this.tool.key = false;
      this.tool.x = p.x;
      this.tool.y = p.y;
    },
    move(p) {
      this.tool.x = p.x;
      this.tool.y = p.y;
      this.tool.key = false;
    },
    up() { this.tool.down = false; },
    keyDown(e) {
      if (this.phase === 'rinse' && (e.code === 'Enter' || e.code === 'Space')) this.startRinse();
    },
    startRinse() {
      if (this.rinsing) return;
      this.rinsing = true;
      Snd.water(true);
      setTimeout(() => {
        Snd.water(false);
        this.rinsing = false;
        this.finish(1, def.doneText || 'Squeaky clean!');
      }, 1800);
    },
    hammyAt() { return { x: W / 2, y: 400 }; },
  });
}

function drawFoamBlob(ctx, b) {
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + b.seed, r = b.r * (0.45 + (i % 2) * 0.2);
    circle(ctx, b.x + Math.cos(a) * b.r * 0.45, b.y + Math.sin(a) * b.r * 0.4, r);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(170,210,255,.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawDirtBlob(ctx, b) {
  ctx.fillStyle = 'rgba(160,120,85,.75)';
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + b.seed;
    circle(ctx, b.x + Math.cos(a) * b.r * 0.4, b.y + Math.sin(a) * b.r * 0.35, b.r * 0.5);
    ctx.fill();
  }
}

// ------------------------------------------------------- tap the targets

// Things appear and drift; tap them before they float away. Used for
// bubbles with Mom, the bug hunt, catching apples and the ball pit.
// def: { prompt, goal, spawn() -> {x, y, vx, vy, r, kind, draw}, render, onTap(o), maxOnScreen }
function tapGame(id, def) {
  return defineGame(id, {
    music: def.music,
    init(params) {
      this.objs = [];
      this.spawnT = 0;
      this.goal = def.goal || 10;
      def.init?.call(this, params);
      this.say(def.prompt);
    },
    tick(dt) {
      if ((this.spawnT -= dt) <= 0 && this.objs.length < (def.maxOnScreen || 6)) {
        this.spawnT = def.every || 0.9;
        this.objs.push({ t: 0, ...def.spawn.call(this) });
      }
      for (const o of this.objs) {
        o.t += dt;
        o.x += (o.vx || 0) * dt;
        o.y += (o.vy || 0) * dt;
        if (o.wobble) o.x += Math.sin(o.t * 2 + o.seed) * o.wobble * dt;
      }
      this.objs = this.objs.filter(o => o.gone !== true && o.x > -150 && o.x < W + 150 && o.y > -150 && o.y < H + 150 && (!o.life || o.t < o.life));
      def.tick?.call(this, dt);
    },
    render(ctx) {
      def.render.call(this, ctx);
      for (const o of this.objs) (o.draw || def.drawObj).call(this, ctx, o);
      def.renderTop?.call(this, ctx);
      drawText(ctx, `${Math.min(this.score, this.goal)} / ${this.goal}`, W - 120, 200, 44, { color: '#ff7fb0', stroke: '#fff' });
    },
    down(p) {
      const o = [...this.objs].reverse().find(o => dist(p.x, p.y, o.x, o.y) < o.r * 1.25 && !o.done);
      if (!o) return def.miss?.call(this, p);
      o.done = true;
      o.gone = true;
      def.onTap.call(this, o);
      if (this.score >= this.goal) setTimeout(() => this.finish(1), 400);
    },
    keyDown(e) {
      if (e.code === 'Space' || e.code === 'Enter') {
        const o = this.objs.find(o => !o.done);
        if (o) this.down({ x: o.x, y: o.y });
      }
    },
  });
}

// ------------------------------------------------------ steer & collect

// Hammy moves with arrows / WASD, or follows the finger / mouse while it's
// held. def: { prompt, area: {x,y,w,h}, speed, init, spawn, render, collect(o), goal }
function steerGame(id, def) {
  return defineGame(id, {
    music: def.music,
    init(params) {
      const a = def.area;
      this.area = a;
      this.me = { x: a.x + a.w / 2, y: a.y + a.h * 0.7, vx: 0, vy: 0, facing: 1 };
      this.items = [];
      this.goal = def.goal || 10;
      this.target = null;
      def.init?.call(this, params);
      this.say(typeof def.prompt === 'function' ? def.prompt.call(this) : def.prompt);
    },
    tick(dt) {
      const a = this.area, m = this.me, sp = def.speed || 420;
      let [dx, dy] = Input.dir();
      if (!dx && !dy && Input.pointer.down && Input.pointer.inside) {
        const d = dist(m.x, m.y, Input.pointer.x, Input.pointer.y);
        if (d > 12) {
          dx = (Input.pointer.x - m.x) / d;
          dy = (Input.pointer.y - m.y) / d;
        }
      }
      if (def.lockY) dy = 0;
      m.vx += (dx * sp - m.vx) * Math.min(1, dt * 8);
      m.vy += (dy * sp - m.vy) * Math.min(1, dt * 8);
      m.x = clamp(m.x + m.vx * dt, a.x, a.x + a.w);
      m.y = clamp(m.y + m.vy * dt, a.y, a.y + a.h);
      if (Math.abs(m.vx) > 20) m.facing = Math.sign(m.vx);
      m.moving = Math.hypot(m.vx, m.vy) > 40;
      def.tick?.call(this, dt);
      for (const it of this.items) {
        if (!it.got && dist(m.x, m.y - (def.reachY || 40), it.x, it.y) < (it.r || 40) + (def.reach || 50)) {
          it.got = true;
          def.collect.call(this, it);
          if (this.score >= this.goal) setTimeout(() => this.finish(1), 500);
        }
      }
      this.items = this.items.filter(it => !it.got && !it.gone);
    },
    render(ctx) { def.render.call(this, ctx); },
    hammyAt() { return { x: this.me.x, y: this.me.y - 60 }; },
  });
}
