// Clock Time: a big rainbow clock. Turn the time with arrows / d-pad
// (left-right = half hour, up-down = hour), number keys, the dock buttons or by
// dragging the long hand. The animal shows what happens at that time of day,
// and the sky turns to night. 🎯 asks the child to set a given time.

function nightAmount(minutes) {
  const h = minutes / 60;
  if (h < 5.5 || h >= 20.5) return 1;
  if (h < 7) return (7 - h) / 1.5;
  if (h < 18) return 0;
  return (h - 18) / 2.5;
}

function currentActivity(minutes) {
  let cur = SCHEDULE[SCHEDULE.length - 1];
  for (const s of SCHEDULE) if (s.at <= minutes + 0.5) cur = s;
  return cur;
}

function digitalTime(minutes) {
  const h = Math.floor(minutes / 60) % 12 || 12, m = Math.floor(minutes % 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function isDaytime(minutes) {
  return minutes >= 6 * 60 && minutes < 18 * 60;
}

function drawHand(ctx, angle, len, width, color) {
  ctx.save();
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(-len * 0.12, 0);
  ctx.lineTo(len, 0);
  ctx.stroke();
  ctx.restore();
}

function drawClock(ctx, cx, cy, R, minutes) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  circle(ctx, 0, R * 0.04, R * 1.02);
  // One rainbow wedge per hour around the rim.
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `hsl(${i * 30}, 90%, 66%)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, (i - 3.5) / 12 * TAU, (i - 2.5) / 12 * TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#fffdf6';
  circle(ctx, 0, 0, R * 0.86);
  ctx.strokeStyle = '#b9adc9';
  ctx.lineCap = 'round';
  for (let m = 0; m < 60; m++) {
    const a = m / 60 * TAU, big = m % 5 === 0, inner = R * (big ? 0.76 : 0.8);
    ctx.lineWidth = R * (big ? 0.018 : 0.008);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * R * 0.83, Math.sin(a) * R * 0.83);
    ctx.stroke();
  }
  for (let h = 1; h <= 12; h++) {
    const a = h / 12 * TAU - Math.PI / 2;
    drawLabel(ctx, String(h), Math.cos(a) * R * 0.64, Math.sin(a) * R * 0.64, R * 0.17, { color: `hsl(${(h % 12) * 30}, 80%, 42%)`, stroke: '#fff' });
  }
  drawHand(ctx, (minutes / 60 % 12) / 12 * TAU - Math.PI / 2, R * 0.42, R * 0.085, '#5b3fa0');
  drawHand(ctx, (minutes % 60) / 60 * TAU - Math.PI / 2, R * 0.7, R * 0.05, '#ff5c8a');
  ctx.fillStyle = '#ffd60a';
  circle(ctx, 0, 0, R * 0.07);
  ctx.restore();
}

Modes.push({
  id: 'clock', emoji: '🕐', title: 'mode_clock', inputs: '⌨️ 🖱️ 🎮', color: '#9d4edd',

  start() {
    this.t = 7 * 60;       // the time we're set to, minutes since midnight
    this.shown = this.t;   // what the hands show while they glide
    this.quiz = null;      // target minutes (0..719) or null
    this.quizOn = false;
    this.dragging = false;
    this.announceT = 0;
    this.wonT = 0;
    this.slots = [];
    this.visited = new Set([currentActivity(this.t).id]); // routine times found this visit, one ⭐ each
    this.L = this.layout();
    this.animal = new Animal(Settings.animal);
    this.quizBtn = UI.button('🎯', () => this.toggleQuiz(), { title: 'Quiz: set the clock' });
    UI.setExtra(
      UI.button('⏪', () => this.step(-60), { title: '1 hour back' }),
      UI.button('◀', () => this.step(-30), { title: '30 minutes back' }),
      UI.button('▶', () => this.step(30), { title: '30 minutes forward' }),
      UI.button('⏩', () => this.step(60), { title: '1 hour forward' }),
      UI.button('🕐', () => this.setNow(), { title: 'What time is it now?' }),
      this.quizBtn,
    );
    this.announce();
  },

  stop() { Stage.night = 0; },

  layout() {
    const w = Stage.w, h = Stage.h, slotH = Math.min(84 * Stage.k + 10, (Math.min(w - 32, 940)) / SCHEDULE.length);
    const ty = h - 100 - slotH / 2;
    if (w > h * 1.1) {
      const cy = (90 + ty - slotH / 2) / 2, R = Math.max(20, Math.min((ty - slotH / 2 - 110) / 2, w * 0.24)), cx = w * 0.36;
      return { cx, cy, R, px: (cx + R + w) / 2, py: cy, ty, slotH };
    }
    const R = Math.max(20, Math.min(w * 0.4, (ty - 120) * 0.3)), cy = 100 + R;
    return { cx: w / 2, cy, R, px: w / 2, py: (cy + R + ty - slotH / 2) / 2, ty, slotH };
  },

  // Snap to the next multiple of |delta| in its direction.
  step(delta) {
    const n = Math.abs(delta);
    const t = delta > 0 ? Math.floor(this.t / n) * n + n : Math.ceil(this.t / n) * n - n;
    this.t = (t + 1440) % 1440;
    this.lastInput = Stage.time;
    Sfx.click();
    this.announceT = 0.5; // wait for mashing to stop before talking
  },

  setTime(minutes) {
    this.t = (minutes + 1440) % 1440;
    this.announce();
  },

  setNow() {
    const d = new Date();
    this.setTime(d.getHours() * 60 + d.getMinutes());
  },

  toggleQuiz() {
    this.quizOn = !this.quizOn;
    this.quizBtn.classList.toggle('selected', this.quizOn);
    if (this.quizOn) this.newQuiz();
    else this.quiz = null;
  },

  newQuiz() {
    let q;
    do q = (Math.floor(rand(1, 13)) * 60 + (Math.random() < 0.3 ? 30 : 0)) % 720;
    while (q === this.t % 720);
    this.quiz = q;
    const p = timePhrase(q);
    Speech.speak(clockPrompt(p));
    UI.showWord({ ...p, emoji: '🎯' });
  },

  announce() {
    this.announceT = 0;
    this.lastInput = Stage.time;
    const p = timePhrase(this.t), act = SCHEDULE.find(s => s.at === this.t);
    Speech.speak(p.text);
    UI.showWord({ ...p, emoji: act ? act.emoji : isDaytime(this.t) ? '☀️' : '🌙' });
    if (act) {
      Speech.speak(word(act.id).text, Settings.lang, { interrupt: false });
      this.animal.doAction();
      if (!this.visited.has(act.id)) {
        this.visited.add(act.id);
        Progress.earn(1, this.animal.x, this.animal.y);
      }
    }
    if (this.quiz !== null && this.t % 720 === this.quiz) this.win();
  },

  win() {
    this.quiz = null;
    this.wonT = 2.5;
    Progress.earn(5, this.L.cx, this.L.cy);
    Sfx.tada();
    Speech.speak(word('great').text, Settings.lang, { interrupt: false });
    this.animal.doAction();
    for (let i = 0; i < 3; i++) FX.burst(rand(0.2, 0.8) * Stage.w, rand(0.2, 0.5) * Stage.h, { n: 30, speed: 500 });
  },

  update(dt) {
    this.L = this.layout();
    if (this.dragging) {
      this.dragTo(Input.pointer);
      this.shown = this.t;
    } else {
      const diff = ((this.t - this.shown) % 1440 + 2160) % 1440 - 720;
      this.shown = Math.abs(diff) < 0.05 ? this.t : (this.shown + diff * Math.min(1, dt * 8) + 1440) % 1440;
    }
    Stage.night = nightAmount(this.shown);
    if (this.announceT > 0 && (this.announceT -= dt) <= 0) this.announce();
    if (this.wonT > 0 && (this.wonT -= dt) <= 0 && this.quizOn) this.newQuiz();
    const a = this.animal;
    a.x = this.L.px - Stage.unit * 0.1;
    a.y = this.L.py;
    a.update(dt);
  },

  // Dragging moves the minute hand; going past 12 changes the hour.
  dragTo(p) {
    const L = this.L;
    let angle = Math.atan2(p.y - L.cy, p.x - L.cx) + Math.PI / 2;
    if (angle < 0) angle += TAU;
    const m = Math.round(angle / TAU * 12) * 5 % 60;
    let d = m - this.t % 60;
    if (d > 30) d -= 60;
    if (d < -30) d += 60;
    if (d) {
      this.t = (this.t + d + 1440) % 1440;
      Sfx.click();
    }
  },

  draw(ctx) {
    const L = this.L, k = Stage.k;
    drawClock(ctx, L.cx, L.cy, L.R, this.shown);

    const act = currentActivity(this.shown), w = word(act.id), s = Stage.unit * 0.17;
    const pillW = 190 * k, pillH = 64 * k, pillY = L.py - s * 1.05;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    ctx.roundRect(L.px - pillW / 2, pillY - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fill();
    drawEmoji(ctx, isDaytime(this.t) ? '☀️' : '🌙', L.px - pillW * 0.3, pillY, pillH * 0.8);
    drawLabel(ctx, digitalTime(this.t), L.px + pillW * 0.12, pillY, pillH * 0.6, { color: '#5b3fa0', stroke: '#fff' });
    this.animal.draw(ctx);
    drawEmoji(ctx, act.emoji, L.px + Stage.unit * 0.1, L.py, s * 0.9, { rot: Math.sin(Stage.time * 2) * 0.1 });
    drawLabel(ctx, w.text, L.px, L.py + s * 0.85, 40 * k, { color: '#5b3fa0', stroke: '#fff' });
    if (w.roman) drawLabel(ctx, w.roman, L.px, L.py + s * 0.85 + 40 * k, 22 * k, { color: '#7a68a6', stroke: '#fff' });

    this.drawTimeline(ctx, act);
    if (this.quiz !== null) this.drawQuiz(ctx);
  },

  // The day's routine; click an icon to jump to that time.
  drawTimeline(ctx, current) {
    const L = this.L, n = SCHEDULE.length, tw = Math.min(Stage.w - 32, 940), slot = tw / n, sh = L.slotH;
    const x0 = (Stage.w - tw) / 2, y = L.ty;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath();
    ctx.roundRect(x0, y - sh / 2, tw, sh, sh / 2);
    ctx.fill();
    this.slots = SCHEDULE.map((s, i) => {
      const x = x0 + slot * (i + 0.5);
      if (s === current) {
        ctx.fillStyle = RAINBOW[i % RAINBOW.length].hex;
        circle(ctx, x, y, sh * 0.48);
      }
      drawEmoji(ctx, s.emoji, x, y - sh * 0.1, sh * 0.6);
      drawLabel(ctx, digitalTime(s.at), x, y + sh * 0.3, sh * 0.2, { color: '#5b4a7a', stroke: '#fff' });
      return { x, y, r: sh / 2, at: s.at };
    });
  },

  drawQuiz(ctx) {
    const k = Stage.k, r = 62 * k, x = 24 + r, y = 100 + r, p = timePhrase(this.quiz);
    ctx.fillStyle = `rgba(255,255,255,${0.6 + Math.sin(Stage.time * 5) * 0.2})`;
    circle(ctx, x, y, r * 1.18);
    drawClock(ctx, x, y, r, this.quiz);
    drawEmoji(ctx, '🎯', x + r * 0.85, y - r * 0.85, r * 0.6);
    ctx.font = `700 ${24 * k}px ${FONT}`;
    const half = ctx.measureText(p.text).width / 2;
    drawLabel(ctx, p.text, Math.max(x, half + 16), y + r * 1.18 + 22 * k, 24 * k, { color: '#ff4d6d', stroke: '#fff' });
  },

  onNav(dir) {
    this.step({ right: 30, left: -30, up: 60, down: -60 }[dir]);
  },

  onAction() { this.announce(); },

  // Number keys jump to that hour (1-6 = afternoon, 7-0 = morning).
  onKey(e) {
    const ch = keyChar(e.code);
    if (!ch || !/\d/.test(ch)) return false;
    const h = Number(ch) || 10;
    this.setTime((h < 7 ? h + 12 : h) * 60);
    return true;
  },

  onPad(i) {
    if (i === 2) { this.toggleQuiz(); return true; }
    if (i === 3) { this.setNow(); return true; }
    return false;
  },

  slotAt(x, y) {
    return this.slots.find(s => dist(x, y, s.x, s.y) < s.r);
  },

  // The long hand's tip is the cue: "Drag!" for the mouse, and after a quiet
  // spell on keyboard / controller, "Press ← →" / "Press ✚".
  hint() {
    const L = this.L, p = Input.pointer, ang = (this.shown % 60) / 60 * TAU - Math.PI / 2;
    const tip = { x: L.cx + Math.cos(ang) * L.R * 0.7, y: L.cy + Math.sin(ang) * L.R * 0.7, r: L.R * 0.14 };
    if (this.dragging) return { ...tip, cursor: 'grabbing' };
    if (Input.lastDevice === 'mouse' && p.inside) {
      const slot = this.slotAt(p.x, p.y);
      if (slot) return { x: slot.x, y: slot.y, r: slot.r * 1.05, text: hintFor(), cursor: 'pointer' };
      if (dist(p.x, p.y, L.cx, L.cy) < L.R) return { ...tip, text: `🖱️ ${word('drag').text}`, cursor: 'grab' };
      return animalHint(this.animal, { idle: false });
    }
    const keyOrPad = Input.lastDevice === 'key' || Input.lastDevice === 'pad';
    if (keyOrPad && Stage.time - this.lastInput > 6) return { ...tip, text: hintFor({ key: '← →', pad: '✚' }) };
    return null;
  },

  onPointerDown(p) {
    const slot = this.slotAt(p.x, p.y);
    if (slot) return this.setTime(slot.at);
    const L = this.L;
    if (dist(p.x, p.y, L.cx, L.cy) < L.R) {
      this.dragging = true;
      this.dragTo(p);
      return;
    }
    const a = this.animal;
    if (dist(p.x, p.y, a.x, a.y) < a.radius * 1.3) {
      a.doAction();
      UI.say(a.kind.id, a.kind.emoji);
    }
  },

  onPointerUp() {
    if (!this.dragging) return;
    this.dragging = false;
    this.announce();
  },
});
