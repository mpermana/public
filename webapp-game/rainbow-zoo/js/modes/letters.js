// Letter Balloons: balloons float up carrying letters (or numbers). Press the
// matching key to pop them. The on-screen keyboard lights up where each key is.

const KEY_ROWS = { abc: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'], num: ['1234567890'] };
const ROW_SHIFT = [-0.3, 0, 0.5]; // keyboard rows are staggered, in key widths

Modes.push({
  id: 'letters', emoji: '🎈', title: 'mode_letters', inputs: '⌨️', color: '#f2b705',
  set: 'abc',

  start() {
    this.flash = {};
    this.setButtons = {
      abc: UI.button('ABC', () => this.useSet('abc'), { cls: 'text' }),
      num: UI.button('123', () => this.useSet('num'), { cls: 'text' }),
    };
    UI.setExtra(this.setButtons.abc, this.setButtons.num);
    this.useSet(this.set);
  },

  useSet(set) {
    this.set = set;
    this.balloons = [];
    this.spawnT = 1;
    for (const [id, b] of Object.entries(this.setButtons)) b.classList.toggle('selected', id === set);
  },

  spawn() {
    const onScreen = new Set(this.balloons.map(b => b.ch));
    const ch = pick([...KEY_ROWS[this.set].join('')].filter(c => !onScreen.has(c)));
    const k = Stage.k, r = 58 * k;
    let x = 0, gap = -1;
    for (let i = 0; i < 12; i++) {
      const cx = rand(0.12, 0.88) * Stage.w, g = Math.min(...this.balloons.map(b => Math.abs(b.x - cx)));
      if (g > gap) { gap = g; x = cx; }
    }
    this.balloons.push({ ch, color: pick(RAINBOW), x, y: Stage.h + r * 1.2, r, vy: rand(55, 75) * k, t: rand(0, 6) });
  },

  update(dt) {
    if (this.balloons.length < 3 && (this.spawnT += dt) > 1.4) {
      this.spawnT = 0;
      this.spawn();
    }
    for (const b of this.balloons) {
      b.t += dt;
      b.y -= b.vy * dt;
      b.x += Math.sin(b.t * 1.3) * 12 * Stage.k * dt;
    }
    this.balloons = this.balloons.filter(b => b.y > -b.r * 3);
    for (const ch in this.flash) if ((this.flash[ch] -= dt) <= 0) delete this.flash[ch];
  },

  pop(b) {
    this.balloons.splice(this.balloons.indexOf(b), 1);
    Sfx.pop();
    FX.burst(b.x, b.y, { colors: [b.color.hex, '#fff'], n: 26, speed: 380 });
    if (this.set === 'abc') {
      const emoji = LETTER_EMOJI[b.ch];
      FX.add({ kind: 'emoji', text: emoji, x: b.x, y: b.y, vy: -120 * Stage.k, life: 1.6, size: 100 * Stage.k });
      Speech.speak(b.ch);
      UI.showWord({ emoji, text: `${b.ch} ${b.ch.toLowerCase()}` });
    } else {
      UI.say('n' + b.ch, '🎈');
    }
  },

  draw(ctx) {
    for (const b of this.balloons) this.drawBalloon(ctx, b);
    this.drawKeyboard(ctx);
  },

  drawBalloon(ctx, b) {
    const r = b.r;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.sin(b.t * 1.3) * 0.08);
    ctx.strokeStyle = 'rgba(80,60,100,.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * 1.15);
    ctx.quadraticCurveTo(Math.sin(b.t * 2) * r * 0.3, r * 1.7, 0, r * 2.3);
    ctx.stroke();
    ctx.fillStyle = b.color.dark;
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, r * 1.22);
    ctx.lineTo(r * 0.12, r * 1.22);
    ctx.lineTo(0, r * 1.08);
    ctx.fill();
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.2);
    g.addColorStop(0, 'rgba(255,255,255,.95)');
    g.addColorStop(0.3, b.color.hex);
    g.addColorStop(1, b.color.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 1.18, 0, 0, TAU);
    ctx.fill();
    drawLabel(ctx, b.ch, 0, r * 0.05, r * 1.1, { stroke: 'rgba(0,0,0,.25)' });
    ctx.restore();
  },

  // Keys on a balloon glow in its color; pressed keys flash white.
  drawKeyboard(ctx) {
    const rows = KEY_ROWS[this.set], key = Math.min(Stage.w / 11.5, 64), gap = key * 0.12;
    const bottom = Stage.h - 96, top = bottom - rows.length * (key + gap) + gap;
    const panelW = 10 * (key + gap) + key;
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.roundRect((Stage.w - panelW) / 2, top - gap * 2, panelW, bottom - top + gap * 4, gap * 3);
    ctx.fill();
    rows.forEach((row, ri) => {
      const rowW = row.length * (key + gap) - gap, x0 = (Stage.w - rowW) / 2 + (rows.length > 1 ? ROW_SHIFT[ri] * key : 0);
      [...row].forEach((ch, ci) => {
        const x = x0 + ci * (key + gap), y = top + ri * (key + gap);
        const balloon = this.balloons.find(b => b.ch === ch), pressed = this.flash[ch] > 0;
        const grow = balloon ? 1 + Math.sin(Stage.time * 6) * 0.05 : 1, s = key * grow * (pressed ? 0.9 : 1);
        ctx.fillStyle = pressed ? '#fff' : balloon ? balloon.color.hex : 'rgba(255,255,255,.9)';
        ctx.beginPath();
        ctx.roundRect(x + (key - s) / 2, y + (key - s) / 2, s, s, key * 0.22);
        ctx.fill();
        drawLabel(ctx, ch, x + key / 2, y + key / 2, key * 0.5, balloon && !pressed
          ? { color: '#fff', stroke: 'rgba(0,0,0,.2)' }
          : { color: '#5b4a7a', stroke: 'rgba(255,255,255,.6)' });
      });
    });
  },

  onKey(e) {
    const ch = keyChar(e.code);
    if (!ch) return false;
    this.flash[ch] = 0.35;
    const matches = this.balloons.filter(b => b.ch === ch);
    if (matches.length) this.pop(matches.reduce((hi, b) => (b.y < hi.y ? b : hi)));
    else Sfx.soft();
    return true;
  },

  onPointerDown(p) {
    const b = this.balloons.find(b => dist(p.x, p.y, b.x, b.y) < b.r * 1.15);
    if (b) this.pop(b);
  },
});
