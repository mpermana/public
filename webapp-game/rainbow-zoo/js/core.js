// Shared runtime: settings, the canvas stage, emoji sprites, particles, the
// player's animal and small DOM helpers. Game modes register in `Modes`.

const Modes = [];
const TAU = Math.PI * 2;

const Settings = {
  lang: 'en',
  animal: 'rabbit',
  sound: true,
  pad: null, // chosen controller { id, index }, or null for any controller

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem('rainbowZoo.settings') || '{}');
      if (saved.lang in LANG_COLUMN) this.lang = saved.lang;
      if (ANIMALS.some(a => a.id === saved.animal)) this.animal = saved.animal;
      if (typeof saved.sound === 'boolean') this.sound = saved.sound;
      if (typeof saved.pad?.id === 'string' && Number.isInteger(saved.pad.index)) this.pad = { id: saved.pad.id, index: saved.pad.index };
    } catch { /* storage blocked: keep defaults */ }
  },

  save() {
    try {
      localStorage.setItem('rainbowZoo.settings', JSON.stringify({ lang: this.lang, animal: this.animal, sound: this.sound, pad: this.pad }));
    } catch { /* storage blocked */ }
  },
};

const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const pick = list => list[Math.floor(Math.random() * list.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

const FONT = '"Fredoka", "Comic Sans MS", "Yu Gothic UI", "Microsoft YaHei UI", sans-serif';
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

// ----------------------------------------------------------------- drawing

const emojiSprites = new Map();

// Emoji are rendered once to an offscreen canvas and scaled from there.
function emojiSprite(emoji) {
  let sprite = emojiSprites.get(emoji);
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 256;
    const g = sprite.getContext('2d');
    g.font = `200px ${EMOJI_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(emoji, 128, 140);
    emojiSprites.set(emoji, sprite);
  }
  return sprite;
}

function drawEmoji(ctx, emoji, x, y, size, { rot = 0, flip = false, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(emojiSprite(emoji), -size / 2, -size / 2, size, size);
  ctx.restore();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, TAU);
  ctx.fill();
}

function drawLabel(ctx, text, x, y, size, { color = '#fff', stroke = 'rgba(59,42,90,.55)', align = 'center' } = {}) {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.18;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// Row of stars under the HUD, e.g. 3 of 10 collected.
function drawStarMeter(ctx, filled, total) {
  const s = Math.min(34 * Stage.k + 6, (Stage.w - 40) / total), x0 = (Stage.w - s * total) / 2 + s / 2, y = 104;
  ctx.fillStyle = 'rgba(91,74,122,.35)';
  ctx.beginPath();
  ctx.roundRect(x0 - s * 0.6, y - s * 0.55, s * total + s * 0.2, s * 1.1, s * 0.55);
  ctx.fill();
  for (let i = 0; i < total; i++) {
    const x = x0 + i * s;
    if (i < filled) drawEmoji(ctx, '⭐', x, y, s * 1.15);
    else {
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      circle(ctx, x, y, s * 0.18);
    }
  }
}

// ------------------------------------------------------------------- stage

const Stage = {
  canvas: null, ctx: null, w: 0, h: 0, dpr: 1,
  background: null, clouds: [], stars: [],
  night: 0, shake: 0, time: 0,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    for (let i = 0; i < 5; i++) this.clouds.push({ x: rand(0, 1), y: rand(0.1, 0.38), s: rand(0.6, 1.2), v: rand(0.004, 0.012) });
    for (let i = 0; i < 70; i++) this.stars.push({ x: rand(0, 1), y: rand(0, 0.6), r: rand(1, 2.6), p: rand(0, 6) });
    addEventListener('resize', () => this.resize());
    this.resize();
  },

  get unit() { return Math.min(this.w, this.h); },
  // Scale factor relative to an 800px screen, for sizes and speeds.
  get k() { return this.unit / 800; },

  resize() {
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = innerWidth;
    this.h = innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.background = this.paintBackground();
  },

  paintBackground() {
    const { w, h } = this, u = this.unit;
    const c = document.createElement('canvas');
    c.width = Math.round(w * this.dpr);
    c.height = Math.round(h * this.dpr);
    const g = c.getContext('2d');
    g.scale(this.dpr, this.dpr);

    const sky = g.createLinearGradient(0, 0, 0, h * 0.65);
    sky.addColorStop(0, '#7fcfff');
    sky.addColorStop(1, '#e3f6ff');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    const sx = w * 0.88, sy = h * 0.2, sr = u * 0.07;
    g.strokeStyle = '#ffd23f';
    g.lineWidth = sr * 0.18;
    g.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      g.beginPath();
      g.moveTo(sx + Math.cos(a) * sr * 1.3, sy + Math.sin(a) * sr * 1.3);
      g.lineTo(sx + Math.cos(a) * sr * 1.7, sy + Math.sin(a) * sr * 1.7);
      g.stroke();
    }
    g.fillStyle = '#ffe066';
    circle(g, sx, sy, sr);

    const band = u * 0.035, outer = Math.min(w * 0.46, h * 0.62);
    g.globalAlpha = 0.6;
    g.lineWidth = band + 1;
    g.lineCap = 'butt';
    RAINBOW.forEach((color, i) => {
      g.strokeStyle = color.hex;
      g.beginPath();
      g.arc(w / 2, h * 0.66, outer - i * band, Math.PI, TAU);
      g.stroke();
    });
    g.globalAlpha = 1;

    g.fillStyle = '#a8e88a';
    g.beginPath();
    g.ellipse(w * 0.18, h * 0.68, w * 0.45, h * 0.2, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#93df74';
    g.beginPath();
    g.ellipse(w * 0.85, h * 0.7, w * 0.5, h * 0.22, 0, 0, TAU);
    g.fill();
    const grass = g.createLinearGradient(0, h * 0.64, 0, h);
    grass.addColorStop(0, '#86d860');
    grass.addColorStop(1, '#5fbf45');
    g.fillStyle = grass;
    g.fillRect(0, h * 0.64, w, h * 0.36);

    // Flowers, seeded so they stay put across redraws.
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) {
      const x = rnd() * w, y = h * 0.66 + rnd() * h * 0.34, r = u * (0.006 + rnd() * 0.006);
      g.fillStyle = RAINBOW[i % RAINBOW.length].hex;
      for (let p = 0; p < 5; p++) {
        const a = p / 5 * TAU;
        circle(g, x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 1.4, r);
      }
      g.fillStyle = '#fff6a8';
      circle(g, x, y, r * 0.9);
    }
    return c;
  },

  // Starts a frame: clears to the meadow, clouds and (in clock mode) night sky.
  begin(dt) {
    this.time += dt;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.shake = Math.max(0, this.shake - dt * 40);
    if (this.shake) ctx.translate(rand(-1, 1) * this.shake, rand(-1, 1) * this.shake);
    ctx.fillStyle = '#7fcfff';
    ctx.fillRect(-30, -30, this.w + 60, this.h + 60);
    ctx.drawImage(this.background, 0, 0, this.w, this.h);
    this.drawClouds(dt);
    if (this.night > 0.01) this.drawNight();
  },

  drawClouds(dt) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    for (const c of this.clouds) {
      c.x += c.v * dt;
      if (c.x > 1.15) c.x = -0.15;
      const x = c.x * this.w, y = c.y * this.h, s = c.s * 60 * this.k;
      circle(ctx, x, y, s);
      circle(ctx, x - s * 0.9, y + s * 0.25, s * 0.7);
      circle(ctx, x + s * 0.95, y + s * 0.2, s * 0.75);
      circle(ctx, x + s * 0.3, y - s * 0.45, s * 0.65);
    }
  },

  drawNight() {
    const ctx = this.ctx, n = this.night;
    ctx.fillStyle = `rgba(25,20,80,${0.6 * n})`;
    ctx.fillRect(-30, -30, this.w + 60, this.h + 60);
    ctx.fillStyle = '#fff';
    for (const s of this.stars) {
      ctx.globalAlpha = n * (0.6 + 0.4 * Math.sin(this.time * 2 + s.p));
      circle(ctx, s.x * this.w, s.y * this.h, s.r);
    }
    ctx.globalAlpha = 1;
    drawEmoji(ctx, '🌙', this.w * 0.88, this.h * 0.2, this.unit * 0.16, { alpha: n });
  },
};

// --------------------------------------------------------------- particles

const FX = {
  list: [],

  clear() { this.list.length = 0; },

  // kind: 'dot' (colored circle), 'emoji' or 'text'.
  add(p) {
    this.list.push({ kind: 'dot', x: 0, y: 0, vx: 0, vy: 0, g: 0, age: 0, life: 1, size: 10, color: '#fff', rot: 0, spin: 0, ...p });
  },

  burst(x, y, { n = 18, speed = 320, colors = RAINBOW.map(c => c.hex), emojis = null, size = 12, g = 500, life = 1 } = {}) {
    const k = Stage.k;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(0.4, 1) * speed * k;
      this.add({
        kind: emojis ? 'emoji' : 'dot', text: emojis && pick(emojis), color: pick(colors),
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * k * 0.3, g: g * k,
        life: life * rand(0.7, 1.2), size: size * k * rand(0.7, 1.4) * (emojis ? 2.6 : 1), spin: rand(-6, 6),
      });
    }
  },

  text(x, y, text, color = '#ff4d6d', size = 56) {
    this.add({ kind: 'text', text, color, x, y, vy: -90 * Stage.k, life: 1.4, size: size * Stage.k });
  },

  update(dt) {
    for (const p of this.list) {
      p.age += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
    this.list = this.list.filter(p => p.age < p.life);
  },

  draw(ctx) {
    for (const p of this.list) {
      const alpha = Math.min(1, (1 - p.age / p.life) * 1.5);
      ctx.globalAlpha = alpha;
      if (p.kind === 'dot') {
        ctx.fillStyle = p.color;
        circle(ctx, p.x, p.y, p.size);
      } else if (p.kind === 'emoji') {
        drawEmoji(ctx, p.text, p.x, p.y, p.size, { rot: p.rot });
      } else {
        drawLabel(ctx, p.text, p.x, p.y, p.size, { color: p.color, stroke: '#fff' });
      }
    }
    ctx.globalAlpha = 1;
  },
};

// ------------------------------------------------------------------ animal

// Special moves: how long they last and what happens when they start.
const ACTIONS = {
  hop:     { time: 0.7, start: () => Sfx.boing() },
  spin:    { time: 0.6, start: () => Sfx.whoosh() },
  roar:    { time: 0.9, start: a => { Sfx.roar(); FX.text(a.x, a.y - a.size * 0.7, word('roar').text, '#ff9f1c', 60); } },
  stomp:   { time: 0.8, start: () => Sfx.boing() },
  breath:  { time: 1.0, start: () => Sfx.whoosh() },
  stretch: { time: 1.0, start: () => Sfx.boing() },
  spray:   { time: 1.0, start: () => Sfx.splash() },
  gallop:  { time: 0.9, start: () => Sfx.clipclop() },
  pounce:  { time: 0.8, start: a => { Sfx.meow(); FX.text(a.x, a.y - a.size * 0.7, word('meow').text, '#ff70a6', 60); } },
  fly:     { time: 1.6, start: () => Sfx.buzz() },
};

class Animal {
  constructor(id, x = Stage.w / 2, y = Stage.h * 0.7) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.scale = 1;      // target size; `shown` eases toward it
    this.shown = 1;
    this.dirX = -1;      // last horizontal direction, -1 = left
    this.walk = 0;       // walk-cycle phase
    this.stride = 0;     // 0..1 how much the walk bob shows
    this.squish = 0;     // seconds of munch squash left
    this.action = null;
    this.actionT = 0;
    this.lastActionAt = Stage.time; // for "press Space" hints when idle
    this.bounds = null;  // optional { top, bottom } in px
    this.setKind(id);
  }

  setKind(id) { this.kind = ANIMALS.find(a => a.id === id) || ANIMALS[0]; }

  get size() { return Stage.unit * 0.17 * this.shown; }
  get radius() { return this.size * 0.4; }

  // Direction toward a point, slowing down on arrival.
  steer(tx, ty) {
    const d = dist(this.x, this.y, tx, ty);
    if (d < this.radius * 0.3) return [0, 0];
    const k = Math.min(1, d / this.radius);
    return [(tx - this.x) / d * k, (ty - this.y) / d * k];
  }

  update(dt, dx = 0, dy = 0) {
    const speed = Stage.unit * 0.6 / Math.sqrt(this.shown), ease = Math.min(1, dt * 10);
    this.vx += (dx * speed - this.vx) * ease;
    this.vy += (dy * speed - this.vy) * ease;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const r = this.radius, top = this.bounds?.top ?? 90, bottom = this.bounds?.bottom ?? Stage.h;
    this.x = clamp(this.x, r, Stage.w - r);
    this.y = clamp(this.y, top + r, Math.max(top + r, bottom - r * 0.9));
    if (Math.abs(this.vx) > 8) this.dirX = Math.sign(this.vx);
    const moving = Math.hypot(this.vx, this.vy) > 20;
    this.stride += ((moving ? 1 : 0) - this.stride) * Math.min(1, dt * 8);
    if (moving) this.walk += dt * 12;
    this.shown += (this.scale - this.shown) * Math.min(1, dt * 5);
    this.squish = Math.max(0, this.squish - dt);
    if (this.action) {
      this.actionT += dt;
      this.tickAction();
      if (this.actionT >= ACTIONS[this.action].time) this.action = null;
    }
  }

  doAction() {
    if (this.action) return;
    this.action = this.kind.special;
    this.actionT = 0;
    this.lastActionAt = Stage.time;
    this.landed = false;
    ACTIONS[this.action].start(this);
  }

  mouth() { return { x: this.x + this.dirX * this.size * 0.35, y: this.y - this.size * 0.1 }; }

  tickAction() {
    const p = this.actionT / ACTIONS[this.action].time, k = Stage.k, m = this.mouth();
    if (this.action === 'stomp' && !this.landed && p >= 0.4) {
      this.landed = true;
      Stage.shake = 14;
      Sfx.thud();
      FX.burst(this.x, this.y + this.size * 0.4, { n: 14, colors: ['#c8a27a', '#e0c9a6'], speed: 260, g: 600, size: 8 });
    }
    if (this.action === 'breath' && p < 0.8) {
      FX.add({ x: m.x, y: m.y, vx: this.dirX * rand(500, 700) * k, vy: rand(-80, 40) * k, life: 0.7, size: rand(8, 16) * k, color: RAINBOW[Math.floor(this.actionT * 30) % RAINBOW.length].hex });
    }
    if (this.action === 'spray' && p < 0.6 && Math.random() < 0.5) {
      FX.add({ kind: 'emoji', text: '💧', x: m.x, y: this.y - this.size * 0.3, vx: this.dirX * rand(100, 260) * k, vy: rand(-650, -450) * k, g: 900 * k, life: 1.2, size: 30 * k });
    }
    if (this.action === 'fly' && Math.random() < 0.4) {
      FX.add({ kind: 'emoji', text: pick(['✨', '💖']), x: this.x + rand(-0.3, 0.3) * this.size, y: this.y - this.pose().lift + this.size * 0.3, vy: 40 * k, life: 0.8, size: 26 * k });
    }
  }

  pose() {
    const s = this.size, p = this.action ? Math.min(1, this.actionT / ACTIONS[this.action].time) : 0;
    const wave = Math.sin(Math.PI * p);
    let lift = Math.abs(Math.sin(this.walk)) * s * 0.08 * this.stride;
    let rot = Math.sin(this.walk) * 0.08 * this.stride;
    let sx = 1, sy = 1 + Math.sin(Stage.time * 3) * 0.02, shift = 0;
    switch (this.action) {
      case 'hop': lift += wave * s * 1.1; break;
      case 'spin': rot += p * TAU; break;
      case 'roar': sx = sy = 1 + wave * 0.3; break;
      case 'stomp': if (p < 0.4) lift += Math.sin(Math.PI * p / 0.4) * s * 0.5; break;
      case 'stretch': sy *= 1 + wave * 0.6; sx *= 1 - wave * 0.15; break;
      case 'gallop': lift += Math.abs(Math.sin(p * Math.PI * 3)) * s * 0.35; rot += Math.sin(p * Math.PI * 6) * 0.1; break;
      case 'fly': lift += wave * s * 1.6; rot += Math.sin(p * 30) * 0.15; break;
      case 'pounce':
        if (p < 0.3) {
          const crouch = Math.sin(Math.PI * p / 0.3);
          sy *= 1 - crouch * 0.25;
          sx *= 1 + crouch * 0.15;
        } else {
          const leap = Math.sin(Math.PI * (p - 0.3) / 0.7);
          lift += leap * s * 0.8;
          shift = this.dirX * leap * s * 0.5;
        }
        break;
    }
    if (this.squish) {
      const q = Math.sin(this.squish / 0.35 * Math.PI);
      sx *= 1 + q * 0.18;
      sy *= 1 - q * 0.14;
    }
    return { lift, rot, sx, sy, shift };
  }

  draw(ctx) {
    const s = this.size, { lift, rot, sx, sy, shift } = this.pose(), feet = this.y + s * 0.4;
    ctx.save();
    ctx.fillStyle = 'rgba(40,60,20,.22)';
    ctx.beginPath();
    ctx.ellipse(this.x + shift, feet, s * 0.36 * (1 - Math.min(lift / s, 0.6) * 0.5), s * 0.08, 0, 0, TAU);
    ctx.fill();
    // Scale from the feet so stretching grows upward; rotate around the middle.
    ctx.translate(this.x + shift, feet - lift);
    ctx.scale(sx * (this.kind.flip && this.dirX > 0 ? -1 : 1), sy);
    ctx.translate(0, -s * 0.45);
    ctx.rotate(rot);
    drawAnimalSprite(ctx, this.kind, s);
    ctx.restore();
  }
}

// The animal's picture and its hat, centered on the current origin.
function drawAnimalSprite(ctx, kind, s) {
  ctx.drawImage(emojiSprite(kind.emoji), -s / 2, -s / 2, s, s);
  const hat = HATS.find(h => h.id === Progress.hat);
  if (!hat) return;
  const [x, y, scale, tilt] = kind.hat, size = s * hat.size * scale;
  ctx.save();
  ctx.translate((x + hat.dx * scale) * s, (y + hat.dy * scale) * s);
  ctx.rotate(tilt + hat.rot);
  ctx.drawImage(emojiSprite(hat.emoji), -size / 2, -size / 2, size, size);
  ctx.restore();
}

// ------------------------------------------------------------------- hints

// How to act right now, for the device the child last used:
// "🖱️ Click!", "⌨️ Press Space" or "🎮 Press A". `pad` is a button index or a label.
function hintFor({ click = 'click', key = 'Space', pad = 0 } = {}) {
  const dev = Input.lastDevice;
  if (dev === 'pad' && pad !== null) return `🎮 ${pressPhrase(typeof pad === 'number' ? padStyle()[pad].label : pad)}`;
  if (dev === 'key' && key !== null) return `⌨️ ${pressPhrase(key)}`;
  if (!click) return null;
  return dev === 'touch' ? `👆 ${word('tap').text}` : `🖱️ ${word(click).text}`;
}

// Hovering the animal says "Click!"; idling on keyboard / controller nudges "Press Space / A".
function animalHint(a, { idle = true } = {}) {
  const p = Input.pointer, ring = { x: a.x, y: a.y - a.size * 0.05, r: a.radius * 1.5 };
  if (Input.lastDevice === 'mouse' && p.inside && dist(p.x, p.y, a.x, a.y) < a.radius * 1.2) return { ...ring, text: hintFor(), cursor: 'pointer' };
  const idling = !a.action && Stage.time - a.lastActionAt > 6;
  if (idle && idling && (Input.lastDevice === 'key' || Input.lastDevice === 'pad')) return { ...ring, text: hintFor() };
  return null;
}

// Modes return a target from `hint()`: { x, y, r, text?, cursor? }. It gets a
// spinning rainbow ring, a "what to press" bubble, and the mouse cursor changes.
const Hint = {
  cursor: '',

  draw(ctx, target) {
    const cursor = target?.cursor || '';
    if (cursor !== this.cursor) Stage.canvas.style.cursor = this.cursor = cursor;
    if (!target) return;
    const k = Stage.k, t = Stage.time, r = target.r * (1 + Math.sin(t * 6) * 0.05);
    ctx.save();
    ctx.lineWidth = 8 * k;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    ctx.arc(target.x, target.y, r, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 5 * k;
    ctx.setLineDash([16 * k, 10 * k]);
    ctx.lineDashOffset = -t * 60 * k;
    ctx.strokeStyle = `hsl(${(t * 120) % 360}, 90%, 58%)`;
    ctx.stroke();
    ctx.restore();
    if (target.text) this.bubble(ctx, target.text, target.x, target.y, r);
  },

  bubble(ctx, text, x, y, r) {
    const k = Stage.k, size = Math.max(18, 26 * k);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + size * 1.2, h = size * 1.7;
    let by = y - r - h * 0.7 - Math.abs(Math.sin(Stage.time * 4)) * 6 * k;
    if (by - h / 2 < 84) by = y + r + h * 0.7; // no room above: go below
    const bx = clamp(x, w / 2 + 8, Stage.w - w / 2 - 8);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#9d4edd';
    ctx.lineWidth = Math.max(2, 3 * k);
    ctx.beginPath();
    ctx.roundRect(bx - w / 2, by - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.stroke();
    drawLabel(ctx, text, bx, by, size, { color: '#3b2a5a', stroke: '#fff' });
  },
};

// --------------------------------------------------------------------- DOM

const UI = {
  init() {
    this.card = document.getElementById('word-card');
    this.toastEl = document.getElementById('toast');
    this.extra = document.getElementById('hud-extra');
  },

  // Big card with the word in the current language, its reading and English.
  showWord({ emoji = '', text, roman = '', en = '' }) {
    if (performance.now() < this.hushUntil) return;
    const parts = [['wc-emoji', emoji], ['wc-text', text], ['wc-roman', roman]];
    if (Settings.lang !== 'en' && en && en !== text) parts.push(['wc-en', en]);
    this.card.replaceChildren(...parts.filter(([, v]) => v).map(([cls, v]) => {
      const d = document.createElement('div');
      d.className = cls;
      d.textContent = v;
      return d;
    }));
    this.card.classList.remove('show');
    void this.card.offsetWidth; // restart the pop-in transition
    this.card.classList.add('show');
    clearTimeout(this.cardTimer);
    this.cardTimer = setTimeout(() => this.card.classList.remove('show'), 2600);
  },

  // Keep word cards away for a while (the level-up card uses their spot).
  hush(ms) {
    this.hushUntil = performance.now() + ms;
    this.card.classList.remove('show');
  },

  // Speak a word and show its card.
  say(key, emoji = '') {
    const w = word(key);
    Speech.speak(w.text);
    this.showWord({ ...w, emoji });
    return w;
  },

  toast(text, ms = 2500) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), ms);
  },

  button(label, onClick, { title = '', cls = '' } = {}) {
    const b = document.createElement('button');
    b.className = `dock-btn ${cls}`;
    b.textContent = label;
    b.title = title;
    b.tabIndex = -1;
    b.addEventListener('click', () => { b.blur(); Sfx.click(); onClick(b); });
    return b;
  },

  // Mode-specific buttons in the bottom dock.
  setExtra(...nodes) {
    this.extra.replaceChildren(...nodes);
    this.extra.hidden = nodes.length === 0;
  },

  // A row of animal buttons; `mark()` refreshes which one is selected.
  animalDock(onPick) {
    const mark = () => buttons.forEach(b => b.classList.toggle('selected', b.dataset.id === Settings.animal));
    const buttons = ANIMALS.map(a => {
      const b = this.button(a.emoji, () => {
        Settings.animal = a.id;
        Settings.save();
        mark();
        onPick(a.id);
        this.say(a.id, a.emoji);
      }, { title: a.id });
      b.dataset.id = a.id;
      return b;
    });
    mark();
    return { nodes: buttons, mark };
  },
};
