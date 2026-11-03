// Sports: tennis, basketball, badminton, the running track, and swimming.
// Timing windows are wide and there is always another ball.

function courtBackdrop(ctx, color = '#7ccf8e', lines = true) {
  Sky.draw(ctx, 0, 0, W, 300, { seed: 71, clouds: 3, scale: 0.7, sunX: 0.9 });
  ctx.fillStyle = grassPattern(ctx, '#9fd981');
  ctx.fillRect(0, 260, W, H);
  ctx.beginPath();
  ctx.moveTo(420, 280); ctx.lineTo(1180, 280); ctx.lineTo(1560, 900); ctx.lineTo(40, 900); ctx.closePath();
  paint(ctx, color, 280, 900, { lw: 4 });
  if (!lines) return;
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(450, 295); ctx.lineTo(1150, 295); ctx.lineTo(1500, 880); ctx.lineTo(100, 880); ctx.closePath();
  ctx.moveTo(800, 295); ctx.lineTo(800, 880);
  ctx.stroke();
}

// ------------------------------------------------------------------ tennis

defineGame('tennis', {
  music: 'outdoor',
  init() {
    this.goal = 6;
    this.targets = [{ x: 560, y: 360, c: COLORS.pink }, { x: 800, y: 340, c: COLORS.yellow }, { x: 1040, y: 360, c: COLORS.blue }];
    this.ham = { x: 800, swing: 0 };
    this.newBall(1.2);
    this.say('The ball is coming! Tap when the ring turns green!');
  },
  newBall(delay = 0.8) {
    const side = Math.random() < 0.5 ? -1 : 1;
    this.ball = { t: -delay, dur: 1.6, side, hx: 800 + side * 170, state: 'in' };
    this.aim = 1;
  },
  ballPos(b) {
    const p = clamp(b.t / b.dur, 0, 1.3), x = lerp(800, b.hx, Math.min(1, p)), y = lerp(330, 720, p);
    const h = Math.sin(Math.min(1, p) * Math.PI) * 120 + (p < 0.55 ? 0 : Math.sin((p - 0.55) / 0.45 * Math.PI) * 60);
    return { x, y: y - h, shadowY: y, s: lerp(0.5, 1.2, Math.min(1, p)) };
  },
  tick(dt) {
    const b = this.ball;
    b.t += dt;
    this.ham.swing = Math.max(0, this.ham.swing - dt * 3);
    if (b.state === 'in') {
      this.ham.x += (b.hx - b.side * 90 - this.ham.x) * Math.min(1, dt * 4);
      if (b.t > b.dur + 0.45) {
        b.state = 'miss';
        FX.text(800, 600, pick(['Almost!', 'Next one!', 'Try again!']), '#7cc6ff', 44);
        setTimeout(() => this.newBall(), 700);
      }
    }
    if (b.state === 'out') {
      b.ot += dt;
      const tgt = this.targets[b.aim], p = Math.min(1, b.ot / 0.9);
      b.x = lerp(b.sx, tgt.x, p);
      b.y = lerp(b.sy, tgt.y, p) - Math.sin(p * Math.PI) * 160;
      if (p >= 1 && !b.landed) {
        b.landed = true;
        this.good(tgt.x, tgt.y, pick(['Great shot!', 'Bullseye!', 'Wow!']));
        if (this.score >= this.goal) this.finish(1, 'Tennis star! 🎾');
        else setTimeout(() => this.newBall(), 600);
      }
    }
  },
  hit(aim = null) {
    const b = this.ball;
    if (b.state !== 'in') return;
    const off = Math.abs(b.t - b.dur);
    this.ham.swing = 1;
    Snd.swish();
    if (off < 0.38) {
      const p = this.ballPos(b);
      b.state = 'out';
      b.ot = 0;
      b.sx = p.x;
      b.sy = p.y;
      b.aim = aim ?? randi(0, 2);
      Snd.kick();
      Speech.say(b.side > 0 ? 'Forehand!' : 'Backhand!');
    }
  },
  render(ctx) {
    courtBackdrop(ctx, '#7ccf8e');
    // Net
    rr(ctx, 380, 470, 840, 70, 6);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 28; i++) { ctx.beginPath(); ctx.moveTo(380 + i * 30, 470); ctx.lineTo(380 + i * 30, 540); ctx.stroke(); }
    for (let j = 0; j <= 3; j++) { ctx.beginPath(); ctx.moveTo(380, 470 + j * 23); ctx.lineTo(1220, 470 + j * 23); ctx.stroke(); }
    box(ctx, 376, 462, 848, 12, 6, '#ffffff', { lw: 2 });
    for (const t of this.targets) {
      for (const [r, c] of [[56, '#ffffff'], [40, t.c], [20, '#ffffff']]) { ellipse(ctx, t.x, t.y, r, r * 0.4); ctx.fillStyle = c; ctx.fill(); }
    }
    drawEmoji(ctx, '🤖', 800, 300, 80);
    const b = this.ball;
    if (b.state === 'in' && b.t > 0) {
      const p = this.ballPos(b);
      ellipse(ctx, p.x, p.shadowY, 16 * p.s, 6 * p.s);
      ctx.fillStyle = 'rgba(0,0,0,.15)';
      ctx.fill();
      const off = b.dur - b.t, ring = 30 + Math.max(0, off) * 90;
      circle(ctx, p.x, p.y, ring);
      ctx.strokeStyle = Math.abs(off) < 0.38 ? '#69db7c' : '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();
      circle(ctx, p.x, p.y, 15 * p.s);
      paint(ctx, '#e8f75a', p.y - 15, p.y + 15, { lw: 2 });
    } else if (b.state === 'out' && b.x) {
      circle(ctx, b.x, b.y, 12);
      paint(ctx, '#e8f75a', b.y - 12, b.y + 12, { lw: 2 });
    }
    const h = this.ham;
    drawHamster(ctx, h.x, 860, 220, { pose: h.swing > 0 ? 'play' : 'idle', mood: 'excited', facing: b.side || 1 });
    ctx.save();
    ctx.translate(h.x + (b.side || 1) * 70, 700);
    ctx.rotate((b.side || 1) * (0.6 - h.swing * 1.6));
    box(ctx, -5, 0, 10, 70, 4, '#7c6a96', { lw: 1.5 });
    ellipse(ctx, 0, -30, 30, 38);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ff8fb8';
    ctx.stroke();
    ctx.restore();
    drawText(ctx, `🎾 ${this.score} / ${this.goal}`, W - 150, 200, 42, { color: '#ff7fb0', stroke: '#fff' });
    drawText(ctx, 'Tap left, middle or right to aim!', 800, 890, 22, { color: '#ffffff', stroke: 'rgba(0,0,0,.25)' });
  },
  down(p) { this.hit(p.x < 640 ? 0 : p.x > 960 ? 2 : 1); },
  keyDown(e) {
    if (e.code === 'ArrowLeft') this.hit(0);
    else if (e.code === 'ArrowRight') this.hit(2);
    else if (['Space', 'Enter', 'ArrowUp'].includes(e.code)) this.hit(1);
  },
  hammyAt() { return { x: this.ham.x, y: 700 }; },
});

// -------------------------------------------------------------- basketball

defineGame('basketball', {
  music: 'outdoor',
  init() {
    this.goal = 5;
    this.hoop = { x: 1240, y: 330, r: 58 };
    this.home = { x: 420, y: 640 };
    this.resetBall();
    this.angle = -0.9;
    this.power = 0.6;
    this.say(this.act.with === 'dad' ? 'Shoot hoops with Dad! Pull back and let go!' : 'Pull the ball back and let go to shoot!');
  },
  resetBall() { this.ball = { x: this.home.x, y: this.home.y, vx: 0, vy: 0, flying: false, scored: false, t: 0 }; this.aiming = null; },
  tick(dt) {
    const b = this.ball, hp = this.hoop;
    if (!b.flying) return;
    b.t += dt;
    b.vy += 1300 * dt;
    // A gentle helper: balls that come close are guided into the hoop.
    if (!b.scored && b.vy > 0 && dist(b.x, b.y, hp.x, hp.y - 20) < 150) {
      b.vx += (hp.x - b.x) * dt * 6;
      b.x += (hp.x - b.x) * dt * 2;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (!b.scored && b.vy > 0 && Math.abs(b.x - hp.x) < hp.r * 0.8 && b.y > hp.y - 10 && b.y < hp.y + 30) {
      b.scored = true;
      b.vx *= 0.2;
      this.good(hp.x, hp.y - 40, pick(['Swish!', 'Basket!', 'Two points!']));
      Snd.cheer();
      FX.confetti(25);
      if (this.score >= this.goal) setTimeout(() => this.finish(1, 'Slam dunk star! 🏀'), 500);
    }
    if (b.y > 820) {
      b.y = 820;
      b.vy *= -0.45;
      b.vx *= 0.7;
      Snd.bounce();
    }
    if (b.t > 3 || b.x > W + 80 || b.x < -80) {
      if (!b.scored) FX.text(800, 500, pick(['So close!', 'Try again!', 'Almost!']), '#7cc6ff', 42);
      this.resetBall();
    }
  },
  shoot(vx, vy) {
    Object.assign(this.ball, { vx, vy, flying: true, t: 0 });
    Snd.whoosh();
  },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 480, { seed: 73 });
    for (let i = 0; i < 9; i++) Art.bush(ctx, 90 + i * 190, 500, 1.1, { seed: i, flowers: i % 2 ? '#ff9ec4' : null });
    ctx.fillStyle = woodPattern(ctx, '#f0c890');
    ctx.fillRect(0, 480, W, H);
    const fg = ctx.createLinearGradient(0, 480, 0, 600);
    fg.addColorStop(0, 'rgba(90,60,40,.18)');
    fg.addColorStop(1, 'rgba(90,60,40,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, 480, W, 120);
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 6;
    ellipse(ctx, 1240, 880, 420, 130);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 560);
    ctx.lineTo(W, 560);
    ctx.stroke();
    const hp = this.hoop;
    box(ctx, hp.x + 70, hp.y - 120, 18, 700, 6, '#8d84a3', { lw: 2 });
    box(ctx, hp.x - 20, hp.y - 150, 130, 170, 12, '#ffffff', { lw: 3 });
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 5;
    ctx.strokeRect(hp.x + 10, hp.y - 110, 70, 60);
    // Scoreboard
    box(ctx, 110, 180, 330, 100, 18, '#5d5470', { lw: 4 });
    drawText(ctx, `🏀 ${this.score * 2} points`, 275, 230, 36, { color: '#ffe066' });
    const buddy = this.buddy();
    if (buddy) drawHamster(ctx, 1450, 840, FAMILY[buddy] ? 330 : 240, { kind: buddy, pose: this.reaction?.kind === 'good' ? 'celebrate' : 'idle', facing: -1, mood: 'happy' });
    drawHamster(ctx, this.home.x - 110, 840, 240, { pose: this.ball.flying ? (this.ball.scored ? 'celebrate' : 'idle') : 'play', mood: 'excited' });
    // Aiming guide
    if (this.aiming) {
      const v = this.aimVel();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      let x = this.ball.x, y = this.ball.y, vx = v.vx, vy = v.vy;
      for (let i = 0; i < 18; i++) {
        vx *= 1;
        vy += 1300 * 0.05;
        x += vx * 0.05;
        y += vy * 0.05;
        circle(ctx, x, y, 7 - i * 0.25);
        ctx.fill();
      }
    }
    const b = this.ball;
    circle(ctx, b.x, b.y, 34);
    paint(ctx, '#ff922b', b.y - 34, b.y + 34, { lw: 3, line: '#c45f12' });
    ctx.strokeStyle = '#a8510f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x - 34, b.y); ctx.lineTo(b.x + 34, b.y);
    ctx.moveTo(b.x, b.y - 34); ctx.quadraticCurveTo(b.x + 18, b.y, b.x, b.y + 34);
    ctx.stroke();
    Props.hoopFront(ctx, hp.x, hp.y, hp.r);
    if (!b.flying && !this.aiming) drawText(ctx, '👆 Pull back, then let go!', this.home.x + 60, 520, 26, { color: '#7b6a8f', stroke: '#fff' });
  },
  aimVel() {
    const a = this.aiming;
    if (a.key) return { vx: Math.cos(this.angle) * 1400 * this.power, vy: Math.sin(this.angle) * 1400 * this.power };
    const dx = a.sx - a.x, dy = a.sy - a.y;
    return { vx: clamp(dx * 5, -200, 1500), vy: clamp(dy * 5, -1600, 200) };
  },
  down(p) {
    if (this.ball.flying) return;
    if (dist(p.x, p.y, this.ball.x, this.ball.y) < 160) this.aiming = { sx: p.x, sy: p.y, x: p.x, y: p.y };
  },
  move(p) { if (this.aiming && !this.aiming.key) { this.aiming.x = p.x; this.aiming.y = p.y; } },
  up() {
    const a = this.aiming;
    if (!a || a.key) return;
    const v = this.aimVel();
    this.aiming = null;
    // A tap (no pull) shoots a nice arc toward the hoop.
    if (dist(a.sx, a.sy, a.x, a.y) < 25) this.shoot(820 + rand(-60, 60), -1060 + rand(-60, 60));
    else this.shoot(v.vx, v.vy);
  },
  keyDown(e) {
    if (this.ball.flying) return;
    this.aiming = { key: true };
    if (e.code === 'ArrowUp') this.angle = clamp(this.angle - 0.06, -1.4, -0.4);
    if (e.code === 'ArrowDown') this.angle = clamp(this.angle + 0.06, -1.4, -0.4);
    if (e.code === 'ArrowRight') this.power = clamp(this.power + 0.04, 0.4, 1);
    if (e.code === 'ArrowLeft') this.power = clamp(this.power - 0.04, 0.4, 1);
    if (e.code === 'Space' || e.code === 'Enter') { const v = this.aimVel(); this.aiming = null; this.shoot(v.vx, v.vy); }
  },
  hammyAt() { return { x: this.home.x - 110, y: 650 }; },
});

// --------------------------------------------------------------- badminton

// The shuttlecock floats across slowly and counts as hit over a wide slice of
// its flight, so there is plenty of time to see it coming and swing.
const SHUTTLE = { from: 0.55, to: 1.12, gone: 1.22, ring: 104, size: 2.4 };

defineGame('badminton', {
  music: 'outdoor',
  init() {
    this.goal = 8;
    this.serve(true);
    this.say('Tap when the shuttlecock comes to you! Keep the rally going!');
  },
  serve(fromPartner) {
    // Coming to Hammy: a slow, floaty lob. Going back to the partner: nobody
    // is waiting on a tap, so it travels at a livelier speed.
    this.sh = { side: fromPartner ? 1 : -1, t: -0.7, dur: fromPartner ? 2.8 : 1.3, missed: false };
  },
  shPos() {
    const s = this.sh, p = clamp(s.t / s.dur, 0, 1.25), x0 = s.side > 0 ? 1220 : 380, x1 = s.side > 0 ? 380 : 1220;
    return { x: lerp(x0, x1, p), y: 560 - Math.sin(Math.min(1, p) * Math.PI) * 330 + Math.max(0, p - 1) * 600, p };
  },
  tick(dt) {
    const s = this.sh;
    s.t += dt;
    const pos = this.shPos();
    // The partner always returns it.
    if (s.side < 0 && pos.p >= 1) {
      Snd.swish();
      this.serve(true);
      return;
    }
    if (s.side > 0 && pos.p > SHUTTLE.gone && !s.missed) {
      s.missed = true;
      FX.text(380, 600, pick(['Oops!', 'Next one!', 'Almost!']), '#7cc6ff', 42);
      setTimeout(() => this.serve(true), 800);
    }
  },
  hit() {
    const s = this.sh, pos = this.shPos();
    if (s.side < 0 || s.missed) return;
    this.swing = 0.4;
    if (pos.p > SHUTTLE.from && pos.p < SHUTTLE.to) {
      this.good(pos.x, pos.y, pick(['Nice hit!', 'Rally!', 'Whoosh!']));
      Snd.kick();
      if (this.score >= this.goal) this.finish(1, 'Badminton champ! 🏸');
      else {
        this.serve(false);
        this.sh.t = 0;
      }
    } else Snd.swish();
  },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 420, { seed: 77 });
    ctx.fillStyle = grassPattern(ctx, '#9fd981');
    ctx.fillRect(0, 400, W, H);
    rr(ctx, 120, 600, 1360, 260, 20);
    paint(ctx, '#8cc8ff', 600, 860, { lw: 4 });
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 5;
    ctx.strokeRect(150, 620, 1300, 220);
    box(ctx, 794, 380, 12, 380, 4, '#8d84a3', { lw: 2 });
    rr(ctx, 690, 400, 220, 150, 4);
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 11; i++) { ctx.beginPath(); ctx.moveTo(690 + i * 20, 400); ctx.lineTo(690 + i * 20, 550); ctx.stroke(); }
    const b = this.buddy() || 'dad';
    drawHamster(ctx, 1260, 820, FAMILY[b] ? 300 : 230, { kind: b, pose: this.sh.side < 0 && this.shPos().p > 0.8 ? 'play' : 'idle', facing: -1, mood: 'happy' });
    this.swing = Math.max(0, (this.swing || 0) - 1 / 60);
    drawHamster(ctx, 340, 820, 230, { pose: this.swing > 0 ? 'play' : 'idle', mood: 'excited' });
    const pos = this.shPos();
    if (this.sh.t > 0) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(this.sh.side > 0 ? -0.6 : 0.6);
      ctx.scale(SHUTTLE.size, SHUTTLE.size);
      ctx.beginPath();
      ctx.moveTo(-14, -22); ctx.lineTo(14, -22); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath();
      paint(ctx, '#ffffff', -22, 6, { lw: 2, line: '#c9c1d6' });
      circle(ctx, 0, 10, 8);
      ctx.fillStyle = '#ff6b6b';
      ctx.fill();
      ctx.restore();
      if (this.sh.side > 0 && pos.p > 0.28) {
        const on = pos.p > SHUTTLE.from && pos.p < SHUTTLE.to;
        circle(ctx, pos.x, pos.y, SHUTTLE.ring * (on ? 1 : 0.6));
        ctx.strokeStyle = on ? '#69db7c' : 'rgba(255,255,255,.7)';
        ctx.lineWidth = on ? 10 : 6;
        ctx.stroke();
      }
    }
    drawText(ctx, `🏸 ${this.score} / ${this.goal}`, W - 150, 200, 42, { color: '#ff7fb0', stroke: '#fff' });
  },
  down() { this.hit(); },
  keyDown(e) { if (['Space', 'Enter', 'ArrowUp'].includes(e.code)) this.hit(); },
  hammyAt() { return { x: 340, y: 650 }; },
});

// ----------------------------------------------------------------- running

defineGame('running', {
  music: 'outdoor',
  init() {
    this.lane = 1;
    this.y = this.laneY(1);
    this.dist = 0;
    this.goal = 15;
    this.lapLen = 3000;
    this.laps = 2;
    this.stars = [];
    const rnd = seeded(S.time.day + 4);
    for (let d = 700; d < this.lapLen * this.laps - 200; d += 220) this.stars.push({ d, lane: Math.floor(rnd() * 3), got: false });
    this.say('Run! Move up and down to collect the stars!');
  },
  laneY(i) { return 620 + i * 100; },
  tick(dt) {
    this.dist += 520 * dt;
    this.y += (this.laneY(this.lane) - this.y) * Math.min(1, dt * 10);
    for (const s of this.stars) {
      if (s.got) continue;
      const x = 380 + (s.d - this.dist);
      if (Math.abs(x - 380) < 60 && s.lane === this.lane) {
        s.got = true;
        this.score++;
        Snd.ding(this.score % 8);
        FX.stars(x, this.y - 80, 6);
      }
    }
    if (Math.floor((this.dist - 520 * dt) / this.lapLen) < Math.floor(this.dist / this.lapLen)) {
      const lap = Math.floor(this.dist / this.lapLen);
      if (lap < this.laps) { Speech.say(`Lap ${lap}!`); FX.text(800, 400, `Lap ${lap}! 🏁`, '#ff7fb0', 60); }
    }
    if (this.dist >= this.lapLen * this.laps) this.finish(this.score >= this.goal ? 1 : 0, 'You ran so fast! 🏃');
  },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 480, { seed: 79, clouds: 5 });
    const off = this.dist;
    for (let i = 0; i < 6; i++) Art.tree(ctx, ((i * 330 - off * 0.3) % 1980 + 1980) % 1980 - 190, 470, 0.8, { seed: i });
    ctx.fillStyle = grassPattern(ctx, '#9fd981');
    ctx.fillRect(0, 460, W, H);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) box(ctx, ((i * 220 - off * 0.6 + r * 60) % 1980 + 1980) % 1980 - 190, 470 + r * 6, 200, 14, 4, ['#ff8fb8', '#ffd43b', '#7cc6ff', '#7ed99a'][r], { lw: 0 });
    rr(ctx, -20, 560, W + 40, 320, 0);
    ctx.fillStyle = '#ff9a8a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 5;
    for (let i = 0; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(0, 570 + i * 100); ctx.lineTo(W, 570 + i * 100); ctx.stroke(); }
    for (let i = 0; i < 10; i++) Props.cone(ctx, ((i * 400 - off) % 4000 + 4000) % 4000 - 200, 570, 0.6, i % 2 ? '#ffd43b' : '#ff9f43');
    const finishX = 380 + this.lapLen * this.laps - off;
    if (finishX < W + 100) {
      for (let j = 0; j < 10; j++) { ctx.fillStyle = j % 2 ? '#fff' : '#4a3a5c'; ctx.fillRect(finishX, 570 + j * 30, 30, 30); }
      drawText(ctx, '🏁 FINISH', finishX + 15, 530, 34);
    }
    for (const s of this.stars) {
      if (s.got) continue;
      const x = 380 + (s.d - off);
      if (x < -60 || x > W + 60) continue;
      drawStar(ctx, x, this.laneY(s.lane) - 70 + Math.sin(Game.time * 4 + s.d) * 6, 26);
    }
    drawHamster(ctx, 380, this.y, 160, { pose: 'run', facing: 1, mood: 'excited' });
    const lap = Math.min(this.laps, Math.floor(this.dist / this.lapLen) + 1);
    drawText(ctx, `⭐ ${this.score}   🏁 Lap ${lap} / ${this.laps}`, W - 280, 200, 38, { color: '#ff7fb0', stroke: '#fff' });
    drawText(ctx, '▲ ▼ or tap above / below Hammy', 800, 890, 22, { color: '#ffffff', stroke: 'rgba(0,0,0,.25)' });
  },
  down(p) { this.lane = clamp(this.lane + (p.y < this.y - 60 ? -1 : 1), 0, 2); Snd.tap(); },
  keyDown(e) {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.lane = Math.max(0, this.lane - 1);
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.lane = Math.min(2, this.lane + 1);
  },
  hammyAt() { return { x: 380, y: this.y - 80 }; },
});

// ---------------------------------------------------------------- swimming

// Hammy always wears a float ring, and Dad (or Mom) is right there in the water.
steerGame('swim', {
  music: 'pool',
  area: { x: 160, y: 400, w: 1280, h: 420 },
  speed: 300,
  reach: 40,
  reachY: 40,
  prompt() {
    if (this.params.mode === 'toys') {
      this.want = pick(['yellow', 'pink', 'blue']);
      return `Collect the ${this.want} toys! Kick, kick, kick!`;
    }
    return 'Kick, kick! Swim to the bubbles and stars!';
  },
  init() {
    this.goal = this.params.mode === 'toys' ? 6 : 10;
    this.spawnT = 0;
    this.wantDone = 0;
  },
  tick(dt) {
    const a = this.area, toys = this.params.mode === 'toys';
    if ((this.spawnT -= dt) <= 0 && this.items.length < (toys ? 8 : 5)) {
      this.spawnT = toys ? 0.7 : 1;
      const c = toys ? pick(['yellow', 'pink', 'blue', this.want, this.want]) : null;
      this.items.push({ x: rand(a.x + 60, a.x + a.w - 60), y: rand(a.y + 40, a.y + a.h - 40), r: 40, c, kind: toys ? pick(['duck', 'ball', 'ring']) : pick(['star', 'bubble']), t: 0, drift: rand(-20, 20) });
    }
    for (const it of this.items) { it.t += dt; it.x += it.drift * dt; if (it.x < a.x || it.x > a.x + a.w) it.drift *= -1; }
    if (this.me.moving && Math.random() < dt * 8) FX.bubbles(this.me.x - this.me.facing * 60, this.me.y - 10, 1, 10);
    // Toys of other colors politely float out of the way.
    if (toys) for (const it of this.items) if (it.c !== this.want && dist(it.x, it.y, this.me.x, this.me.y - 40) < 100) { it.x += (it.x - this.me.x) * dt * 2; it.y += (it.y - this.me.y + 40) * dt * 2; if (!it.told) { it.told = true; FX.text(it.x, it.y - 50, `That's ${it.c}!`, COLORS[it.c], 30); } }
  },
  collect(it) {
    if (this.params.mode === 'toys' && it.c !== this.want) { it.got = false; return; }
    this.score++;
    Snd.splash();
    FX.stars(it.x, it.y, 6);
    FX.text(it.x, it.y - 50, this.params.mode === 'toys' ? `${this.want}!` : pick(['Splash!', 'Yay!', 'Bubbles!']), '#ff6f9c', 36);
    if (this.params.mode === 'toys' && this.score % 3 === 0 && this.score < this.goal) {
      this.want = pick(['yellow', 'pink', 'blue'].filter(c => c !== this.want));
      this.say(`Now the ${this.want} toys!`);
    }
  },
  render(ctx) {
    Sky.draw(ctx, 0, 0, W, 330, { seed: 81 });
    ctx.fillStyle = tilePattern(ctx, '#fff7ea', '#f6e9d4', 70);
    ctx.fillRect(0, 300, W, H);
    box(ctx, 120, 360, 1360, 500, 60, '#ffffff', { lw: 4, line: '#d8c8b0' });
    Art.water(ctx, 140, 380, 1320, 460, 46);
    const toys = this.params.mode === 'toys';
    for (const it of this.items) {
      const bob = Math.sin(Game.time * 2 + it.x) * 4;
      if (it.kind === 'star') drawStar(ctx, it.x, it.y + bob, 26);
      else if (it.kind === 'bubble') { circle(ctx, it.x, it.y + bob, 26); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke(); }
      else if (it.kind === 'duck') Props.duck(ctx, it.x, it.y, 0.9, { color: COLORS[it.c] });
      else if (it.kind === 'ball') Props.beachBall(ctx, it.x, it.y + bob, 26, Game.time);
      else Props.floatRing(ctx, it.x, it.y, 30, COLORS[it.c]);
      if (toys && it.kind === 'ball') { circle(ctx, it.x, it.y + bob, 12); ctx.fillStyle = COLORS[it.c]; ctx.fill(); }
    }
    const m = this.me, sup = this.act.with === 'mom' ? 'mom' : 'dad';
    // The grown-up stays close by in the water.
    const gx = clamp(m.x + 270 * (m.x < 800 ? 1 : -1), 260, 1340), gy = clamp(m.y + 30, 520, 820);
    drawHamster(ctx, gx, gy + 60, 300, { kind: sup, pose: 'wave', mood: 'happy', facing: m.x < gx ? -1 : 1 });
    ctx.save();
    ctx.globalAlpha = 0.6;
    Art.water(ctx, gx - 120, gy - 50, 240, 120, 40, { ripples: false });
    ctx.restore();
    drawHamster(ctx, m.x, m.y + 40, 190, { pose: 'swim', facing: m.facing, mood: 'excited', outfit: { hat: 'goggles', top: 'none' } });
    ctx.save();
    ctx.globalAlpha = 0.35;
    Art.water(ctx, 140, m.y + 10, 1320, 60, 0, { ripples: false });
    ctx.restore();
    drawText(ctx, toys ? `🦆 ${this.score} / ${this.goal}  ·  find ${this.want}` : `⭐ ${this.score} / ${this.goal}`, W - 260, 200, 36, { color: toys ? COLORS[this.want] : '#ff7fb0', stroke: '#fff' });
    drawText(ctx, '← ↑ → ↓ or hold and drag', 800, 890, 22, { color: '#7b6a8f' });
  },
});
