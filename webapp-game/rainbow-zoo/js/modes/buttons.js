// Button Party: learn the game controller. A big controller is drawn on
// screen; press the glowing button and your animal celebrates. Every other
// button says its color, the d-pad says its direction, sticks move the animal.
// No controller? Keyboard A B X Y and clicks work too.

// Colors by physical position (standard mapping: 0 bottom, 1 right, 2 left, 3 top).
const PAD_STYLES = {
  xbox: {
    0: { label: 'A', color: 'green' }, 1: { label: 'B', color: 'red' },
    2: { label: 'X', color: 'blue' }, 3: { label: 'Y', color: 'yellow' },
    4: { label: 'LB', color: 'orange' }, 5: { label: 'RB', color: 'purple' },
  },
  playstation: {
    0: { label: '✕', color: 'blue' }, 1: { label: '○', color: 'red' },
    2: { label: '□', color: 'pink' }, 3: { label: '△', color: 'green' },
    4: { label: 'L1', color: 'orange' }, 5: { label: 'R1', color: 'purple' },
  },
};
const ARROWS = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };
const DPAD_BUTTON = { up: 12, down: 13, left: 14, right: 15 };

Modes.push({
  id: 'buttons', emoji: '🎮', title: 'mode_buttons', inputs: '🎮 ⌨️', color: '#3a86ff',

  start() {
    this.L = this.layout();
    this.animal = new Animal(Settings.animal, Stage.w / 2, (90 + this.L.top) / 2);
    this.flash = {};
    this.target = null;
    this.last = null;
    this.nextT = 0.8;
    this.streak = 0;
  },

  style() {
    return /054c|playstation|dualshock|dualsense|wireless controller/i.test(Input.padId) ? PAD_STYLES.playstation : PAD_STYLES.xbox;
  },

  layout() {
    const w = Math.min(Stage.w * 0.8, Stage.h * 0.9, 720), h = w * 0.46, br = w * 0.055;
    const cx = Stage.w / 2, cy = Stage.h - h * 0.64 - 56, sp = br * 1.75;
    const face = { x: cx + w * 0.3, y: cy + h * 0.02 }, pad = { x: cx - w * 0.3, y: cy + h * 0.02 };
    const bw = w * 0.2, bh = h * 0.16;
    return {
      cx, cy, w, h, br, top: cy - h / 2 - bh,
      buttons: {
        3: { x: face.x, y: face.y - sp }, 1: { x: face.x + sp, y: face.y },
        0: { x: face.x, y: face.y + sp }, 2: { x: face.x - sp, y: face.y },
      },
      dpad: {
        center: pad,
        up: { x: pad.x, y: pad.y - sp }, down: { x: pad.x, y: pad.y + sp },
        left: { x: pad.x - sp, y: pad.y }, right: { x: pad.x + sp, y: pad.y },
      },
      bumpers: {
        4: { x: cx - w * 0.3, y: cy - h / 2 - bh * 0.2, w: bw, h: bh },
        5: { x: cx + w * 0.3, y: cy - h / 2 - bh * 0.2, w: bw, h: bh },
      },
      sticks: [{ x: cx - w * 0.12, y: cy + h * 0.3 }, { x: cx + w * 0.12, y: cy + h * 0.3 }],
    };
  },

  update(dt) {
    this.L = this.layout();
    this.animal.bounds = { top: 90, bottom: this.L.top - 10 };
    this.animal.update(dt, ...Input.dir());
    for (const i in this.flash) if ((this.flash[i] -= dt) <= 0) delete this.flash[i];
    if (this.target === null && (this.nextT -= dt) <= 0) this.newTarget();
  },

  newTarget() {
    this.target = pick([0, 1, 2, 3].filter(i => i !== this.last));
    this.last = this.target;
    UI.say('c_' + this.style()[this.target].color, '🎮');
  },

  buttonPos(i) {
    return this.L.buttons[i] || this.L.bumpers[i];
  },

  press(i) {
    const info = this.style()[i], pos = this.buttonPos(i);
    this.flash[i] = 0.4;
    FX.burst(pos.x, pos.y, { colors: [COLOR[info.color].hex, '#fff'], n: 12 });
    if (i === this.target) {
      this.target = null;
      this.nextT = 1.4;
      this.streak++;
      if (this.streak % 5 === 0) Sfx.tada(); else Sfx.ding(this.streak % 8);
      this.animal.doAction();
      FX.burst(this.animal.x, this.animal.y, { emojis: ['⭐', '✨'], n: 10 });
      UI.say('great', '🌟');
    } else {
      Sfx.click();
      UI.say('c_' + info.color, info.label);
    }
  },

  draw(ctx) {
    const L = this.L, style = this.style(), k = Stage.k;
    this.animal.draw(ctx);
    if (this.target !== null) this.drawPrompt(ctx, style[this.target]);

    for (const i of [4, 5]) {
      const b = L.bumpers[i], down = this.flash[i] > 0;
      ctx.fillStyle = down ? '#fff' : COLOR[style[i].color].hex;
      ctx.beginPath();
      ctx.roundRect(b.x - b.w / 2, b.y - b.h / 2 + (down ? 4 : 0), b.w, b.h, b.h / 2);
      ctx.fill();
      drawLabel(ctx, style[i].label, b.x, b.y - b.h * 0.1, b.h * 0.5);
    }

    // Body and grips as one shape so it fills without seams.
    ctx.save();
    ctx.shadowColor = 'rgba(80,50,140,.35)';
    ctx.shadowBlur = 24 * k;
    ctx.shadowOffsetY = 8 * k;
    ctx.fillStyle = '#f7f1ff';
    ctx.beginPath();
    ctx.roundRect(L.cx - L.w / 2, L.cy - L.h / 2, L.w, L.h, L.h * 0.42);
    for (const side of [-1, 1]) {
      ctx.moveTo(L.cx + side * L.w * 0.34 + L.h * 0.36, L.cy + L.h * 0.28);
      ctx.arc(L.cx + side * L.w * 0.34, L.cy + L.h * 0.28, L.h * 0.36, 0, TAU);
    }
    ctx.fill();
    ctx.restore();

    this.drawDpad(ctx);

    [Input.stick, Input.stick2].forEach(([ax, ay], i) => {
      const s = L.sticks[i];
      ctx.fillStyle = '#ddd2f5';
      circle(ctx, s.x, s.y, L.br * 1.05);
      ctx.fillStyle = '#6b5a8f';
      circle(ctx, s.x + ax * L.br * 0.5, s.y + ay * L.br * 0.5, L.br * 0.72);
    });

    for (const i of [0, 1, 2, 3]) {
      const b = L.buttons[i], c = COLOR[style[i].color], down = this.flash[i] > 0, target = i === this.target;
      const r = L.br * (target ? 1.12 + Math.sin(Stage.time * 8) * 0.08 : 1);
      if (target) {
        ctx.strokeStyle = c.hex;
        ctx.lineWidth = 6 * k;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r * 1.35, 0, TAU);
        ctx.stroke();
      }
      ctx.fillStyle = c.dark;
      circle(ctx, b.x, b.y + 4 * k, r);
      ctx.fillStyle = down ? '#fff' : c.hex;
      circle(ctx, b.x, b.y + (down ? 3 * k : 0), r);
      drawLabel(ctx, style[i].label, b.x, b.y + (down ? 3 * k : 0), r * 1.05, { stroke: 'rgba(0,0,0,.25)' });
    }

    const status = Input.pad
      ? `🎮 ${padName(Input.padId).slice(0, 40)}`
      : Settings.pad
        ? `🎮 ${padName(Settings.pad.id)} is not connected — pick another with the 🎮 button`
        : '🎮 Plug in a controller and press a button — or press A B X Y on the keyboard';
    drawLabel(ctx, status, Stage.w / 2, Stage.h - 28, Math.max(14, 18 * k), { color: '#5b4a7a', stroke: 'rgba(255,255,255,.8)' });
  },

  drawDpad(ctx) {
    const d = this.L.dpad, s = this.L.br * 1.75;
    ctx.fillStyle = '#5b4a7a';
    ctx.beginPath();
    ctx.roundRect(d.center.x - s / 2, d.center.y - s / 2, s, s, s * 0.15);
    ctx.fill();
    for (const dir of ['up', 'down', 'left', 'right']) {
      const p = d[dir], down = this.flash[DPAD_BUTTON[dir]] > 0;
      ctx.fillStyle = down ? '#ffd60a' : '#5b4a7a';
      ctx.beginPath();
      ctx.roundRect(p.x - s / 2, p.y - s / 2, s, s, s * 0.25);
      ctx.fill();
      ctx.fillStyle = down ? '#5b4a7a' : 'rgba(255,255,255,.85)';
      const ang = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[dir], t = s * 0.28;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(ang) * t, p.y + Math.sin(ang) * t);
      ctx.lineTo(p.x + Math.cos(ang + 2.3) * t, p.y + Math.sin(ang + 2.3) * t);
      ctx.lineTo(p.x + Math.cos(ang - 2.3) * t, p.y + Math.sin(ang - 2.3) * t);
      ctx.fill();
    }
  },

  // Persistent reminder of which color to press, at the left of the play area.
  drawPrompt(ctx, info) {
    const k = Stage.k, c = COLOR[info.color], w = word('c_' + info.color);
    const x = Math.max(80 * k, Stage.w * 0.12), y = (90 + this.L.top) / 2, r = 46 * k;
    ctx.fillStyle = c.dark;
    circle(ctx, x, y + 5 * k, r);
    ctx.fillStyle = c.hex;
    circle(ctx, x, y, r * (1 + Math.sin(Stage.time * 6) * 0.05));
    drawLabel(ctx, info.label, x, y, r, { stroke: 'rgba(0,0,0,.25)' });
    drawLabel(ctx, w.text, x, y + r + 30 * k, 34 * k, { color: c.dark, stroke: '#fff' });
  },

  onPad(i) {
    if (i <= 5) this.press(i);
    // Swallow everything else too (Start/Back), so button mashing stays in the game.
    return true;
  },

  onNav(dir) {
    this.flash[DPAD_BUTTON[dir]] = 0.3;
    Sfx.click();
    UI.say(dir, ARROWS[dir]);
  },

  onKey(e) {
    const i = { KeyA: 0, KeyB: 1, KeyX: 2, KeyY: 3, KeyQ: 4, KeyE: 5 }[e.code];
    if (i === undefined) return false;
    this.press(i);
    return true;
  },

  onPointerDown(p) {
    const L = this.L;
    for (const i of [0, 1, 2, 3]) if (dist(p.x, p.y, L.buttons[i].x, L.buttons[i].y) < L.br * 1.25) return this.press(i);
    for (const i of [4, 5]) {
      const b = L.bumpers[i];
      if (Math.abs(p.x - b.x) < b.w / 2 && Math.abs(p.y - b.y) < b.h / 2) return this.press(i);
    }
    for (const dir of ['up', 'down', 'left', 'right']) if (dist(p.x, p.y, L.dpad[dir].x, L.dpad[dir].y) < L.br) return this.onNav(dir);
    const a = this.animal;
    if (dist(p.x, p.y, a.x, a.y) < a.radius * 1.3) {
      a.doAction();
      UI.say(a.kind.id, a.kind.emoji);
    }
  },
});
