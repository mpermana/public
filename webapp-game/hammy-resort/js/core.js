// Core runtime: a fixed 1600x900 design view scaled to fit the window, input
// (mouse, touch, keyboard, pinch), scenes with fade / zoom transitions, cached
// static layers, particles, and small canvas drawing helpers.

const W = 1600, H = 900, TAU = Math.PI * 2;
const FONT = '"Fredoka", "Nunito", "Varela Round", "Arial Rounded MT Bold", "Comic Sans MS", "Segoe UI", sans-serif';
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const randi = (lo, hi) => Math.floor(rand(lo, hi + 1));
const pick = list => list[Math.floor(Math.random() * list.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Repeatable random numbers, so decorations stay put between frames.
function seeded(seed) {
  let s = Math.abs(Math.floor(seed)) % 2147483647 || 1;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}
const Ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  bounce: t => Math.abs(Math.sin(t * Math.PI)),
};

// -------------------------------------------------------------------- view

const View = {
  canvas: null, ctx: null, dpr: 1, scale: 1, ox: 0, oy: 0, cw: 0, ch: 0, version: 0,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    addEventListener('resize', () => this.resize());
    this.resize();
  },

  resize() {
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.cw = innerWidth;
    this.ch = innerHeight;
    this.canvas.width = Math.round(this.cw * this.dpr);
    this.canvas.height = Math.round(this.ch * this.dpr);
    this.scale = Math.min(this.cw / W, this.ch / H);
    this.ox = (this.cw - W * this.scale) / 2;
    this.oy = (this.ch - H * this.scale) / 2;
    this.version++;
  },

  // Real canvas pixels per design unit.
  get px() { return this.scale * this.dpr; },

  toDesign(cx, cy) { return { x: (cx - this.ox) / this.scale, y: (cy - this.oy) / this.scale }; },
  toScreen(x, y) { return { x: this.ox + x * this.scale, y: this.oy + y * this.scale }; },

  begin() {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(this.px, 0, 0, this.px, this.ox * this.dpr, this.oy * this.dpr);
  },
};

// Static layers (room walls, the map's grass...) are painted once per window
// size into offscreen canvases and then just copied each frame.
const Cache = {
  map: new Map(),
  get(key, w, h, paint, extraScale = 1) {
    const k = `${key}|${View.version}|${extraScale}`;
    let c = this.map.get(k);
    if (!c) {
      for (const old of this.map.keys()) if (old.startsWith(`${key}|`)) this.map.delete(old);
      const s = View.px * extraScale;
      c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w * s));
      c.height = Math.max(1, Math.ceil(h * s));
      const g = c.getContext('2d');
      g.scale(s, s);
      paint(g, w, h);
      this.map.set(k, c);
    }
    return c;
  },
  draw(ctx, key, x, y, w, h, paint, extraScale) {
    ctx.drawImage(this.get(key, w, h, paint, extraScale), x, y, w, h);
  },
  drop(prefix) {
    for (const k of this.map.keys()) if (k.startsWith(prefix)) this.map.delete(k);
  },
};

// ----------------------------------------------------------------- drawing

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, TAU);
}

function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU);
}

function drawText(ctx, str, x, y, size, { color = '#4a3a5c', align = 'center', base = 'middle', weight = 700, stroke = null, sw = 0.2, maxW } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  if (stroke) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * sw;
    ctx.strokeStyle = stroke;
    ctx.strokeText(str, x, y, maxW);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y, maxW);
}

function wrapLines(ctx, str, maxW, size, weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const lines = [];
  let line = '';
  for (const word of str.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const emojiSprites = new Map();
function emojiSprite(emoji) {
  let s = emojiSprites.get(emoji);
  if (!s) {
    s = document.createElement('canvas');
    s.width = s.height = 160;
    const g = s.getContext('2d');
    g.font = `124px ${EMOJI_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(emoji, 80, 88);
    emojiSprites.set(emoji, s);
  }
  return s;
}
function drawEmoji(ctx, emoji, x, y, size, { rot = 0, alpha = 1, flip = false } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(emojiSprite(emoji), -size / 2, -size / 2, size, size);
  ctx.restore();
}

function starPath(ctx, x, y, r, inner = 0.48, points = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = rot + i * Math.PI / points, rad = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
}
function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.45, y - s * 0.95, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 0.95, x + s * 0.9, y - s * 0.25, x, y + s * 0.35);
  ctx.closePath();
}
function drawStar(ctx, x, y, r, color = '#ffd34d', rot) {
  starPath(ctx, x, y, r, 0.5, 5, rot);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = r * 0.14;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(214,150,20,.55)';
  ctx.stroke();
  starPath(ctx, x - r * 0.12, y - r * 0.14, r * 0.42, 0.5, 5, rot);
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.fill();
}

// --------------------------------------------------------------- particles

const PARTY = ['#ff8fb8', '#ffd34d', '#7ed99a', '#7cc6ff', '#b69cff', '#ffb27a'];

const FX = {
  list: [],
  clear() { this.list.length = 0; },

  add(p) {
    this.list.push({ kind: 'dot', x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0, age: 0, life: 1, size: 10, color: '#fff', rot: 0, spin: 0, ...p });
  },

  // kinds: dot, confetti, star, heart, note, bubble, emoji (text), word
  burst(x, y, { n = 18, speed = 380, kind = 'confetti', colors = PARTY, size = 10, g = 700, life = 1.3, text = null } = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(0.35, 1) * speed;
      this.add({
        kind, text: Array.isArray(text) ? pick(text) : text, color: pick(colors),
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.45, g, drag: 0.6,
        life: life * rand(0.7, 1.2), size: size * rand(0.7, 1.4), rot: rand(0, TAU), spin: rand(-8, 8),
      });
    }
  },
  confetti(n = 80) {
    for (let i = 0; i < n; i++) {
      this.add({ kind: 'confetti', x: rand(0, W), y: rand(-200, -10), vx: rand(-60, 60), vy: rand(120, 320), g: 40, life: rand(2.5, 4), size: rand(8, 14), color: pick(PARTY), rot: rand(0, TAU), spin: rand(-6, 6) });
    }
  },
  hearts(x, y, n = 6) {
    for (let i = 0; i < n; i++) this.add({ kind: 'heart', x: x + rand(-30, 30), y: y + rand(-10, 10), vx: rand(-40, 40), vy: rand(-160, -90), life: rand(1.2, 1.8), size: rand(14, 24), color: pick(['#ff7fa8', '#ff9ec4', '#ff6f9c']) });
  },
  stars(x, y, n = 8) { this.burst(x, y, { n, kind: 'star', colors: ['#ffd34d', '#ffe680', '#fff1a8'], size: 16, speed: 420 }); },
  sparkle(x, y, n = 6) {
    for (let i = 0; i < n; i++) this.add({ kind: 'star', x: x + rand(-40, 40), y: y + rand(-40, 20), vy: rand(-60, -20), life: rand(0.5, 0.9), size: rand(6, 12), color: pick(['#fff', '#fff6b0', '#ffe0f0']), spin: rand(-3, 3) });
  },
  notes(x, y, n = 1) {
    for (let i = 0; i < n; i++) this.add({ kind: 'note', text: pick(['♪', '♫', '♬']), x: x + rand(-20, 20), y, vx: rand(-50, 50), vy: rand(-130, -80), life: 1.6, size: rand(26, 38), color: pick(PARTY) });
  },
  bubbles(x, y, n = 5, spread = 40) {
    for (let i = 0; i < n; i++) this.add({ kind: 'bubble', x: x + rand(-spread, spread), y: y + rand(-spread / 2, spread / 2), vx: rand(-20, 20), vy: rand(-70, -25), life: rand(1, 2), size: rand(6, 16) });
  },
  text(x, y, str, color = '#ff6f9c', size = 44) {
    this.add({ kind: 'word', text: str, x, y, vy: -70, life: 1.4, size, color });
  },
  emoji(x, y, e, { size = 50, vy = -80, life = 1.4, vx = 0, g = 0 } = {}) {
    this.add({ kind: 'emoji', text: e, x, y, vx, vy, g, life, size });
  },

  update(dt) {
    for (const p of this.list) {
      p.age += dt;
      p.vy += p.g * dt;
      if (p.drag) {
        p.vx *= 1 - p.drag * dt;
        p.vy *= 1 - p.drag * dt * 0.3;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
    this.list = this.list.filter(p => p.age < p.life);
  },

  draw(ctx) {
    for (const p of this.list) {
      const fade = Math.min(1, (1 - p.age / p.life) * 2.5);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      switch (p.kind) {
        case 'dot': ctx.fillStyle = p.color; circle(ctx, 0, 0, p.size); ctx.fill(); break;
        case 'confetti':
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.age * 9 + p.spin));
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          break;
        case 'star': ctx.rotate(p.rot); drawStar(ctx, 0, 0, p.size, p.color, 0); break;
        case 'heart': heartPath(ctx, 0, 0, p.size); ctx.fillStyle = p.color; ctx.fill(); break;
        case 'note': drawText(ctx, p.text, 0, 0, p.size, { color: p.color, stroke: '#fff', sw: 0.18 }); break;
        case 'bubble':
          circle(ctx, 0, 0, p.size);
          ctx.fillStyle = 'rgba(255,255,255,.35)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(160,210,255,.9)';
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.9)';
          circle(ctx, -p.size * 0.35, -p.size * 0.35, p.size * 0.22);
          ctx.fill();
          break;
        case 'emoji': drawEmoji(ctx, p.text, 0, 0, p.size); break;
        case 'word': drawText(ctx, p.text, 0, 0, p.size, { color: p.color, stroke: '#fff' }); break;
      }
      ctx.restore();
    }
  },
};

// ------------------------------------------------------------------- input

const Input = {
  pointer: { x: W / 2, y: H / 2, down: false, inside: false, type: 'mouse' },
  pointers: new Map(),   // active touches, for pinch zoom
  pinchDist: 0,
  held: new Set(),
  dpad: { x: 0, y: 0 },
  lastDevice: 'mouse',

  init(canvas) {
    canvas.addEventListener('pointerdown', e => {
      canvas.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.move(e);
      if (this.pointers.size === 2) {
        this.pinchDist = this.spread();
        if (this.pointer.down) {
          this.pointer.down = false;
          Game.pointer('cancel', this.pointer);
        }
        return;
      }
      this.pointer.down = true;
      Game.pointer('down', this.pointer);
    });
    canvas.addEventListener('pointermove', e => {
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) {
        const d = this.spread();
        if (this.pinchDist) Game.pinch(d / this.pinchDist, this.center());
        this.pinchDist = d;
        return;
      }
      this.move(e);
      Game.pointer('move', this.pointer);
    });
    const up = e => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinchDist = 0;
      if (!this.pointer.down) return;
      this.move(e);
      this.pointer.down = false;
      Game.pointer('up', this.pointer);
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', () => { this.pointer.inside = false; });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.move(e);
      Game.wheel(e.deltaY, this.pointer);
    }, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    addEventListener('keydown', e => {
      if (e.target.closest?.('input, textarea')) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
      this.held.add(e.code);
      this.lastDevice = 'key';
      if (!e.repeat) Game.key(e);
    });
    addEventListener('keyup', e => this.held.delete(e.code));
    addEventListener('blur', () => this.held.clear());
  },

  move(e) {
    const p = View.toDesign(e.clientX, e.clientY);
    Object.assign(this.pointer, p, { inside: true, type: e.pointerType || 'mouse' });
    this.lastDevice = e.pointerType === 'touch' ? 'touch' : 'mouse';
  },
  spread() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  },
  center() {
    const [a, b] = [...this.pointers.values()];
    return View.toDesign((a.x + b.x) / 2, (a.y + b.y) / 2);
  },

  // Arrow keys / WASD / on-screen pad as a direction, length <= 1.
  dir() {
    const h = code => (this.held.has(code) ? 1 : 0);
    const x = clamp(h('ArrowRight') + h('KeyD') - h('ArrowLeft') - h('KeyA') + this.dpad.x, -1, 1);
    const y = clamp(h('ArrowDown') + h('KeyS') - h('ArrowUp') - h('KeyW') + this.dpad.y, -1, 1);
    const m = Math.hypot(x, y);
    return m > 1 ? [x / m, y / m] : [x, y];
  },
};

// ------------------------------------------------------------------ scenes

const Scenes = {};
function defineScene(id, scene) {
  scene.id = id;
  Scenes[id] = scene;
  return scene;
}

const Game = {
  scene: null,
  id: null,
  params: null,
  time: 0,
  trans: null,
  paused: false,
  errors: 0,

  // Switch scenes with a soft fade; `zoom` ({x, y, w, h} in design units)
  // zooms the old scene into that rectangle first, like walking in.
  go(id, params = {}, { zoom = null, instant = false } = {}) {
    if (!Scenes[id]) {
      console.warn('Unknown scene', id);
      return;
    }
    if (instant || !this.scene) {
      this.trans = null;
      this.switchTo(id, params);
      return;
    }
    this.trans = { phase: 'out', t: 0, dur: zoom ? 0.45 : 0.28, to: id, params, zoom };
  },

  switchTo(id, params) {
    const prev = this.id;
    try { this.scene?.exit?.(id); } catch (e) { console.error(e); }
    this.id = id;
    this.params = params;
    this.scene = Scenes[id];
    FX.clear();
    try { this.scene.enter?.(params, prev); } catch (e) { console.error(e); }
    UI.onScene(this.scene);
  },

  tick(dt) {
    this.time += dt;
    const tr = this.trans;
    if (tr) {
      tr.t += dt;
      if (tr.t >= tr.dur) {
        if (tr.phase === 'out') {
          // Set the fade-in first: entering the scene may start another go().
          this.trans = { phase: 'in', t: 0, dur: 0.3 };
          this.switchTo(tr.to, tr.params);
        } else this.trans = null;
      }
    }
    if (!this.paused) {
      try {
        State.tick(dt);
        this.scene?.update?.(dt);
      } catch (e) { this.report(e); }
      FX.update(dt);
    }
    this.draw();
    UI.tick(dt);
  },

  draw() {
    const ctx = View.ctx;
    View.begin();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    const tr = this.trans;
    if (tr?.phase === 'out' && tr.zoom) {
      const p = Ease.inOut(tr.t / tr.dur), z = tr.zoom, s = lerp(1, Math.min(W / z.w, H / z.h), p);
      const cx = z.x + z.w / 2, cy = z.y + z.h / 2;
      ctx.translate(W / 2, H / 2);
      ctx.scale(s, s);
      ctx.translate(-lerp(W / 2, cx, p), -lerp(H / 2, cy, p));
    }
    try {
      this.scene?.draw?.(ctx);
      FX.draw(ctx);
    } catch (e) { this.report(e); }
    ctx.restore();
    if (tr) {
      const p = tr.phase === 'out' ? tr.t / tr.dur : 1 - tr.t / tr.dur;
      ctx.fillStyle = `rgba(255,248,236,${clamp(p, 0, 1)})`;
      ctx.fillRect(0, 0, W, H);
    }
  },

  // A scene error is logged, not fatal: the game keeps running.
  report(e) {
    if (this.errors++ < 5) console.error(e);
  },

  pointer(type, p) {
    if (this.trans || this.paused) return;
    if (type === 'down') UI.closePopover();
    const s = this.scene, fn = { down: s?.pointerDown, move: s?.pointerMove, up: s?.pointerUp, cancel: s?.pointerUp }[type];
    try { fn?.call(s, p); } catch (e) { this.report(e); }
  },
  key(e) {
    if (UI.key(e)) return;
    if (this.trans || this.paused) return;
    try { this.scene?.key?.(e); } catch (err) { this.report(err); }
  },
  wheel(dy, p) { this.scene?.wheel?.(dy, p); },
  pinch(factor, center) { this.scene?.pinch?.(factor, center); },
};

// ---------------------------------------------------------- canvas buttons

// Big rounded buttons drawn on the canvas, for mini-games.
// b: { x, y, w, h, color, label, emoji, size, draw(ctx, b), disabled, glow }
const Btn = {
  draw(ctx, b) {
    const press = b.pressT > 0 ? 4 : 0, r = b.r ?? Math.min(b.h / 2, 28), c = b.color || '#ffffff';
    const y = b.y + press;
    ctx.save();
    if (b.disabled) ctx.globalAlpha *= 0.45;
    if (b.glow) {
      ctx.shadowColor = b.glowColor || '#ffe066';
      ctx.shadowBlur = 24 + Math.sin(Game.time * 6) * 10;
    }
    rr(ctx, b.x, b.y + 6, b.w, b.h, r);
    ctx.fillStyle = shade(c, -0.22);
    ctx.fill();
    ctx.shadowBlur = 0;
    rr(ctx, b.x, y, b.w, b.h, r);
    const g = ctx.createLinearGradient(0, y, 0, y + b.h);
    g.addColorStop(0, shade(c, 0.18));
    g.addColorStop(1, c);
    ctx.fillStyle = g;
    ctx.fill();
    if (b.selected) {
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffd34d';
      ctx.stroke();
    }
    const dark = isLight(c);
    if (b.draw) b.draw(ctx, { ...b, y });
    else {
      const size = b.size || Math.min(b.h * 0.42, 34);
      if (b.emoji && b.label) {
        drawEmoji(ctx, b.emoji, b.x + b.h * 0.5, y + b.h / 2, b.h * 0.62);
        drawText(ctx, b.label, b.x + b.h * 0.95, y + b.h / 2 + 1, size, { align: 'left', color: dark ? '#4a3a5c' : '#fff', maxW: b.w - b.h });
      } else if (b.emoji) {
        drawEmoji(ctx, b.emoji, b.x + b.w / 2, y + b.h / 2, Math.min(b.w, b.h) * 0.66);
      } else if (b.label) {
        drawText(ctx, b.label, b.x + b.w / 2, y + b.h / 2 + 1, size, { color: dark ? '#4a3a5c' : '#fff', maxW: b.w - 16 });
      }
    }
    ctx.restore();
  },
  drawAll(ctx, list, dt = 0) {
    for (const b of list) {
      if (b.hidden) continue;
      if (b.pressT > 0) b.pressT -= dt;
      this.draw(ctx, b);
    }
  },
  hit(list, p) {
    return [...list].reverse().find(b => !b.hidden && !b.disabled && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h + 6);
  },
  // Press the button under p and run its action; returns true if one was hit.
  press(list, p) {
    const b = this.hit(list, p);
    if (!b) return false;
    b.pressT = 0.12;
    Snd.click();
    b.onClick?.(b);
    return true;
  },
};

// Colors -------------------------------------------------------------------

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
// Lighten (amt > 0) or darken (amt < 0) a hex color.
function shade(hex, amt) {
  if (!hex.startsWith('#')) return hex;
  const [r, g, b] = hexToRgb(hex);
  return amt >= 0
    ? rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt)
    : rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
function mix(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}
function isLight(hex) {
  if (!hex.startsWith('#')) return true;
  const [r, g, b] = hexToRgb(hex);
  return r * 0.299 + g * 0.587 + b * 0.114 > 190;
}
