// Family and friends: the family board game and the birthday party.
// ("Play together" in the village opens the friend's favorite game; see
// Friends.game in location.js.)

const BOARD = (() => {
  const pts = [];
  for (let i = 0; i < 20; i++) {
    const row = Math.floor(i / 5), col = row % 2 ? 4 - (i % 5) : i % 5;
    pts.push({ x: 330 + col * 210, y: 760 - row * 150, kind: [3, 11, 16].includes(i) ? 'rainbow' : [6, 13].includes(i) ? 'star' : [8, 18].includes(i) ? 'hug' : 'plain' });
  }
  return pts;
})();

defineGame('boardgame', {
  init() {
    this.players = [{ kind: 'hammy', pos: 0, name: S.hamster.name }, { kind: 'mom', pos: 0, name: 'Mom' }, { kind: 'dad', pos: 0, name: 'Dad' }];
    this.turn = 0;
    this.die = { v: 1, rolling: 0 };
    this.moving = null;
    this.busy = false;
    this.buttons = [{ x: 1330, y: 640, w: 230, h: 120, emoji: '🎲', label: 'Roll!', size: 34, color: '#ffd43b', glow: true, onClick: () => this.roll() }];
    this.say(`Family game! Tap the dice to roll for ${S.hamster.name}!`);
  },
  roll() {
    if (this.busy || this.turn !== 0) return;
    this.doRoll();
  },
  doRoll() {
    this.busy = true;
    this.die.rolling = 0.9;
    Snd.noise(0.6, { freq: 1800, type: 'bandpass', vol: 0.2 });
  },
  tick(dt) {
    const d = this.die;
    if (d.rolling > 0) {
      d.rolling -= dt;
      if (Math.random() < 0.5) d.v = randi(1, 6);
      if (d.rolling <= 0) {
        d.v = this.turn === 0 ? randi(1, 6) : randi(1, 4);
        Speech.say(`${this.players[this.turn].name} rolled ${NUMBER_WORDS[d.v]}!`);
        this.moving = { left: d.v, t: 0.4, count: 0 };
      }
    }
    const m = this.moving;
    if (m && (m.t -= dt) <= 0) {
      const p = this.players[this.turn];
      if (m.left > 0 && p.pos < BOARD.length - 1) {
        p.pos++;
        m.left--;
        m.count++;
        m.t = 0.5;
        Snd.bounce();
        FX.text(BOARD[p.pos].x, BOARD[p.pos].y - 70, NUMBER_WORDS[m.count], PARTY[m.count % 6], 34);
        if (this.turn === 0) Speech.say(NUMBER_WORDS[m.count]);
      } else {
        this.moving = null;
        this.land(p);
      }
    }
  },
  land(p) {
    const sp = BOARD[p.pos];
    if (sp.kind === 'rainbow' && p.pos < BOARD.length - 3) {
      Speech.say('Rainbow! Slide ahead two!', { interrupt: false });
      p.pos += 2;
      FX.stars(BOARD[p.pos].x, BOARD[p.pos].y, 8);
    }
    if (sp.kind === 'star' && this.turn === 0) { this.score++; FX.stars(sp.x, sp.y, 10); Speech.say('A star space!', { interrupt: false }); }
    if (sp.kind === 'hug') { FX.hearts(sp.x, sp.y - 60, 6); Speech.say('Hug space! Everybody hug!', { interrupt: false }); Snd.heart(); }
    if (this.turn === 0) this.score++;
    if (p.pos >= BOARD.length - 1 && this.turn === 0) {
      this.say(`${S.hamster.name} reached the end! Everyone cheers!`);
      return this.finish(1, 'What a fun game! 🎲');
    }
    setTimeout(() => {
      this.turn = (this.turn + 1) % 3;
      this.busy = false;
      if (this.turn !== 0) {
        this.say(`${this.players[this.turn].name}'s turn!`);
        setTimeout(() => this.doRoll(), 700);
      } else this.say(`${S.hamster.name}'s turn! Tap the dice!`);
    }, 900);
  },
  render(ctx) {
    gameBackdrop(ctx, '#f1e8ff', '#e6d9ff', { pattern: 'hearts', accent: '#e9dcff' });
    box(ctx, 220, 150, 1080, 720, 40, '#7ed99a', { lw: 5 });
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 30;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    BOARD.forEach((b, i) => (i ? ctx.lineTo(b.x, b.y) : ctx.moveTo(b.x, b.y)));
    ctx.stroke();
    BOARD.forEach((b, i) => {
      circle(ctx, b.x, b.y, 50);
      paint(ctx, i === 0 ? '#ffffff' : i === BOARD.length - 1 ? '#ffd43b' : PARTY[i % 6], b.y - 50, b.y + 50, { lw: 4 });
      const icon = i === BOARD.length - 1 ? '🏆' : { rainbow: '🌈', star: '⭐', hug: '💗' }[b.kind];
      if (icon) drawEmoji(ctx, icon, b.x, b.y, 50);
      else drawText(ctx, String(i + 1), b.x, b.y, 30, { color: '#ffffff', stroke: 'rgba(0,0,0,.2)', sw: 0.12 });
    });
    this.players.forEach((p, i) => {
      const b = BOARD[p.pos], off = (i - 1) * 34, hop = this.turn === i && this.moving ? Math.abs(Math.sin(Game.time * 12)) * 20 : 0;
      drawHamster(ctx, b.x + off, b.y + 20 - hop, i ? 110 : 90, { kind: p.kind, pose: this.turn === i && this.moving ? 'jump' : 'idle', mood: 'happy', fx: false });
    });
    // Die
    const d = this.die, rot = d.rolling > 0 ? Game.time * 20 : 0;
    ctx.save();
    ctx.translate(1445, 520);
    ctx.rotate(rot);
    box(ctx, -60, -60, 120, 120, 22, '#ffffff', { lw: 4 });
    const pipPos = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[d.v];
    ctx.fillStyle = '#ff6b6b';
    for (const [px, py] of pipPos) { circle(ctx, px * 30, py * 30, 12); ctx.fill(); }
    ctx.restore();
    drawText(ctx, `${this.players[this.turn].name}'s turn`, 1445, 400, 30);
  },
  keyDown(e) { if (e.code === 'Space' || e.code === 'Enter') this.roll(); },
  hammyAt() { const b = BOARD[this.players[0].pos]; return { x: b.x, y: b.y - 60 }; },
});

// ------------------------------------------------------------ birthday

// "Happy Birthday to You" (public domain).
const BIRTHDAY_SONG = [['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2], ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2], ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2], ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]];

defineGame('birthday', {
  music: 'quiet',
  init() {
    this.friend = FRIEND[this.buddy()] || Friends.birthday() || FRIENDS[0];
    this.age = 5;
    this.candles = [];
    this.phase = 'candles';
    this.say(`It's ${this.friend.name}'s birthday! ${this.friend.name} is five. Tap the cake to put on five candles!`);
  },
  tick() {},
  render(ctx) {
    gameBackdrop(ctx, '#fff3f8', '#ffe1ec', { pattern: 'stars', accent: '#ffe7f1' });
    Props.stringLights(ctx, 0, 110, W, 110, 40);
    for (let i = 0; i < 7; i++) drawEmoji(ctx, '🎈', 120 + i * 230, 200 + Math.sin(Game.time * 2 + i) * 10, 90);
    // Friends behind the table; Hammy and the birthday friend in front.
    FRIENDS.filter(f => f !== this.friend).forEach((f, i) => {
      drawHamster(ctx, 520 + i * 140, 610, 150, { kind: f.id, pose: this.phase === 'sing' ? 'dance' : this.phase === 'gift' && this.opened ? 'celebrate' : 'idle', mood: 'happy', seed: i, fx: false });
    });
    Props.table(ctx, 800, 900, 900, 150, { cloth: '#fff0b3' });
    drawHamster(ctx, 210, 860, 230, { pose: this.phase === 'blow' ? 'wave' : this.phase === 'sing' ? 'sing' : 'idle', mood: 'happy' });
    drawHamster(ctx, 1400, 860, 240, { kind: this.friend.id, pose: this.phase === 'gift' && this.opened ? 'celebrate' : 'idle', mood: 'excited', facing: -1 });
    // Cake
    const cx = 800, cy = 700;
    box(ctx, cx - 200, cy - 60, 400, 120, 30, '#ffd6e5', { lw: 4 });
    box(ctx, cx - 150, cy - 160, 300, 110, 30, '#fff3b8', { lw: 4 });
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) { circle(ctx, cx - 175 + i * 50, cy - 58, 16); ctx.fill(); }
    for (let i = 0; i < 5; i++) drawEmoji(ctx, '🍓', cx - 120 + i * 60, cy - 160, 40);
    this.candles.forEach((c, i) => {
      const x = cx - 120 + i * 60;
      box(ctx, x - 8, cy - 240, 16, 70, 5, PARTY[i % 6], { lw: 2 });
      if (c.lit) {
        const f = 1 + Math.sin(Game.time * 14 + i) * 0.12;
        ellipse(ctx, x, cy - 258, 9 * f, 16 * f);
        ctx.fillStyle = '#ffb347';
        ctx.fill();
        ellipse(ctx, x, cy - 254, 4, 8);
        ctx.fillStyle = '#fff3a0';
        ctx.fill();
      }
    });
    if (this.phase === 'candles') drawText(ctx, `🕯️ ${this.candles.length} / ${this.age}`, 800, 420, 40, { color: '#ff7fb0', stroke: '#fff' });
    if (this.phase === 'blow') drawText(ctx, '💨 Tap the flames to blow them out!', 800, 400, 34, { color: '#7b6a8f', stroke: '#fff' });
    if (this.phase === 'gift') {
      if (!this.opened) {
        box(ctx, 1060, 600, 160, 140, 12, '#b197fc', { lw: 4 });
        box(ctx, 1128, 600, 24, 140, 4, '#ffd43b', { lw: 0 });
        drawBow(ctx, 1140, 596, '#ffd43b', 2);
        drawText(ctx, 'Tap to give!', 1140, 560, 26, { stroke: '#fff' });
      } else drawEmoji(ctx, this.gift || '🧸', 1140, 660, 130);
    }
  },
  down(p) {
    const cx = 800, cy = 700;
    if (this.phase === 'candles' && Math.abs(p.x - cx) < 220 && p.y > cy - 280 && p.y < cy + 70) {
      this.candles.push({ lit: true });
      this.score++;
      Snd.ding(this.candles.length * 2);
      Speech.say(NUMBER_WORDS[this.candles.length]);
      if (this.candles.length >= this.age) {
        this.phase = 'sing';
        this.say('Five candles! Now let\'s sing Happy Birthday!');
        this.sing();
      }
    } else if (this.phase === 'blow') {
      this.candles.forEach((c, i) => {
        const x = cx - 120 + i * 60;
        if (c.lit && Math.abs(p.x - x) < 45 && Math.abs(p.y - (cy - 250)) < 70) {
          c.lit = false;
          Snd.whoosh();
          FX.add({ kind: 'dot', x, y: cy - 270, vy: -60, life: 1, size: 10, color: 'rgba(200,200,220,.6)' });
        }
      });
      if (this.candles.every(c => !c.lit)) {
        FX.confetti(100);
        Snd.cheer();
        this.phase = 'gift';
        this.gift = pick(['🧸', '🪀', '🎨', '🚀', '🪁']);
        this.say(`Hooray! Happy birthday, ${this.friend.name}! Now give the present!`);
      }
    } else if (this.phase === 'gift' && !this.opened && p.x > 1040 && p.x < 1240 && p.y > 570 && p.y < 760) {
      this.opened = true;
      FX.confetti(60);
      Snd.fanfare();
      S.friends.hearts[this.friend.id] = (S.friends.hearts[this.friend.id] || 0) + 2;
      S.friends.visited[this.friend.id] = true;
      Speech.say(`Thank you, ${S.hamster.name}! I love it!`);
      this.finish(2, 'Happy birthday! 🎂');
    }
  },
  sing() {
    let t = 0.6;
    for (const [n, b] of BIRTHDAY_SONG) {
      Snd.note(noteMidi(n), { inst: 'flute', vel: 0.4, when: t, dur: b * 0.55 });
      if (b >= 1) Snd.note(noteMidi(n) - 12, { inst: 'pluck', vel: 0.25, when: t });
      t += b * 0.55;
    }
    setTimeout(() => {
      this.phase = 'blow';
      this.say('Make a wish! Now blow out the candles!');
    }, t * 1000 + 300);
  },
  keyDown(e) {
    if (e.code !== 'Space' && e.code !== 'Enter') return;
    if (this.phase === 'candles') this.down({ x: 800, y: 600 });
    else if (this.phase === 'blow') { const i = this.candles.findIndex(c => c.lit); if (i >= 0) this.down({ x: 800 - 120 + i * 60, y: 450 }); }
    else if (this.phase === 'gift') this.down({ x: 1140, y: 660 });
  },
  hammyAt() { return { x: 210, y: 700 }; },
});
