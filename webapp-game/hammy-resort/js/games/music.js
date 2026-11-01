// Music: the grand piano (two octaves, free play, scale, guided songs,
// rhythm and high / low), karaoke with lyrics and tap-along cues, and the
// village dance party. All sound comes from the Web Audio synth.

// Note colors, like a children's color-coded keyboard.
const NOTE_COLORS = { C: '#ff6b6b', D: '#ffa94d', E: '#ffd43b', F: '#69db7c', G: '#4dabf7', A: '#b197fc', B: '#f783ac' };
const WHITE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Public-domain melodies: [note, beats, lyric]. '/' starts a new lyric line.
const SONGS = {
  twinkle: { name: 'Twinkle, Twinkle, Little Star', icon: '⭐', bpm: 96, notes: [
    ['C4', 1, 'Twin'], ['C4', 1, 'kle'], ['G4', 1, 'twin'], ['G4', 1, 'kle'], ['A4', 1, 'lit'], ['A4', 1, 'tle'], ['G4', 2, 'star,'],
    ['F4', 1, '/How'], ['F4', 1, 'I'], ['E4', 1, 'won'], ['E4', 1, 'der'], ['D4', 1, 'what'], ['D4', 1, 'you'], ['C4', 2, 'are!'],
    ['G4', 1, '/Up'], ['G4', 1, 'a'], ['F4', 1, 'bove'], ['F4', 1, 'the'], ['E4', 1, 'world'], ['E4', 1, 'so'], ['D4', 2, 'high,'],
    ['G4', 1, '/Like'], ['G4', 1, 'a'], ['F4', 1, 'dia'], ['F4', 1, 'mond'], ['E4', 1, 'in'], ['E4', 1, 'the'], ['D4', 2, 'sky.'],
    ['C4', 1, '/Twin'], ['C4', 1, 'kle'], ['G4', 1, 'twin'], ['G4', 1, 'kle'], ['A4', 1, 'lit'], ['A4', 1, 'tle'], ['G4', 2, 'star,'],
    ['F4', 1, '/How'], ['F4', 1, 'I'], ['E4', 1, 'won'], ['E4', 1, 'der'], ['D4', 1, 'what'], ['D4', 1, 'you'], ['C4', 2, 'are!'],
  ] },
  mary: { name: 'Mary Had a Little Lamb', icon: '🐑', bpm: 108, notes: [
    ['E4', 1, 'Ma'], ['D4', 1, 'ry'], ['C4', 1, 'had'], ['D4', 1, 'a'], ['E4', 1, 'lit'], ['E4', 1, 'tle'], ['E4', 2, 'lamb,'],
    ['D4', 1, '/lit'], ['D4', 1, 'tle'], ['D4', 2, 'lamb,'], ['E4', 1, 'lit'], ['G4', 1, 'tle'], ['G4', 2, 'lamb.'],
    ['E4', 1, '/Ma'], ['D4', 1, 'ry'], ['C4', 1, 'had'], ['D4', 1, 'a'], ['E4', 1, 'lit'], ['E4', 1, 'tle'], ['E4', 1, 'lamb,'], ['E4', 1, 'its'],
    ['D4', 1, '/fleece'], ['D4', 1, 'was'], ['E4', 1, 'white'], ['D4', 1, 'as'], ['C4', 2, 'snow.'],
  ] },
  ode: { name: 'Ode to Joy', icon: '🎉', bpm: 104, notes: [
    ['E4', 1, 'Hap'], ['E4', 1, 'py,'], ['F4', 1, 'hap'], ['G4', 1, 'py,'], ['G4', 1, 'we'], ['F4', 1, 'are'], ['E4', 1, 'sing'], ['D4', 1, 'ing,'],
    ['C4', 1, '/Sun'], ['C4', 1, 'is'], ['D4', 1, 'shin'], ['E4', 1, 'ing,'], ['E4', 1.5, 'sing'], ['D4', 0.5, 'a'], ['D4', 2, 'long!'],
    ['E4', 1, '/Friends'], ['E4', 1, 'and'], ['F4', 1, 'fam'], ['G4', 1, "'ly,"], ['G4', 1, 'all'], ['F4', 1, 'to'], ['E4', 1, 'geth'], ['D4', 1, 'er,'],
    ['C4', 1, '/hap'], ['C4', 1, 'py,'], ['D4', 1, 'hap'], ['E4', 1, 'py,'], ['D4', 1.5, 'joy'], ['C4', 0.5, 'ful'], ['C4', 2, 'song!'],
  ] },
  rowboat: { name: 'Row, Row, Row Your Boat', icon: '🚣', bpm: 100, notes: [
    ['C4', 1.5, 'Row,'], ['C4', 1.5, 'row,'], ['C4', 1, 'row'], ['D4', 0.5, 'your'], ['E4', 1.5, 'boat'],
    ['E4', 1, '/Gent'], ['D4', 0.5, 'ly'], ['E4', 1, 'down'], ['F4', 0.5, 'the'], ['G4', 3, 'stream.'],
    ['C5', 0.5, '/Mer'], ['C5', 0.5, 'ri'], ['C5', 0.5, 'ly,'], ['G4', 0.5, 'mer'], ['G4', 0.5, 'ri'], ['G4', 0.5, 'ly,'], ['E4', 0.5, 'mer'], ['E4', 0.5, 'ri'], ['E4', 0.5, 'ly,'], ['C4', 0.5, 'mer'], ['C4', 0.5, 'ri'], ['C4', 0.5, 'ly,'],
    ['G4', 1, '/Life'], ['F4', 0.5, 'is'], ['E4', 1, 'but'], ['D4', 0.5, 'a'], ['C4', 3, 'dream!'],
  ] },
  happy: { name: "If You're Happy and You Know It", icon: '👏', bpm: 112, notes: [
    ['G4', 0.5, 'If'], ['G4', 0.5, "you're"], ['C5', 1, 'hap'], ['C5', 1, 'py'], ['C5', 1, 'and'], ['C5', 0.5, 'you'], ['B4', 0.5, 'know'], ['C5', 1, 'it'], ['D5', 2, 'clap!'],
    ['G4', 0.5, '/If'], ['G4', 0.5, "you're"], ['D5', 1, 'hap'], ['D5', 1, 'py'], ['D5', 1, 'and'], ['D5', 0.5, 'you'], ['C5', 0.5, 'know'], ['D5', 1, 'it'], ['E5', 2, 'clap!'],
    ['E5', 0.5, '/If'], ['E5', 0.5, "you're"], ['F5', 1, 'hap'], ['F5', 1, 'py'], ['F5', 1, 'and'], ['D5', 0.5, 'you'], ['D5', 0.5, 'know'], ['E5', 1, 'it,'], ['E5', 1, 'then'], ['C5', 1, 'your'],
    ['C5', 0.5, '/face'], ['C5', 0.5, 'will'], ['D5', 1, 'sure'], ['C5', 1, 'ly'], ['B4', 1, 'show'], ['A4', 1, 'it!'], ['G4', 2, 'Clap!'],
  ] },
  farm: { name: 'Old MacDonald Had a Farm', icon: '🐮', bpm: 116, notes: [
    ['G4', 1, 'Old'], ['G4', 1, 'Mac'], ['G4', 1, 'Don'], ['D4', 1, 'ald'], ['E4', 1, 'had'], ['E4', 1, 'a'], ['D4', 2, 'farm,'],
    ['B4', 1, '/E'], ['B4', 1, 'I'], ['A4', 1, 'E'], ['A4', 1, 'I'], ['G4', 3, 'O!'],
    ['D4', 1, '/And'], ['G4', 1, 'on'], ['G4', 1, 'his'], ['G4', 1, 'farm'], ['D4', 1, 'he'], ['E4', 1, 'had'], ['E4', 1, 'a'], ['D4', 2, 'cow,'],
    ['B4', 1, '/E'], ['B4', 1, 'I'], ['A4', 1, 'E'], ['A4', 1, 'I'], ['G4', 2, 'O!'],
    ['D4', 0.5, '/With'], ['D4', 0.5, 'a'], ['G4', 1, 'moo'], ['G4', 1, 'moo'], ['G4', 0.5, 'here,'], ['D4', 0.5, 'and'], ['D4', 0.5, 'a'], ['G4', 1, 'moo'], ['G4', 1, 'moo'], ['G4', 1, 'there!'],
  ] },
};
const PIANO_SONGS = ['twinkle', 'mary', 'ode'];
const KEYMAP = {
  KeyZ: 'C4', KeyS: 'C#4', KeyX: 'D4', KeyD: 'D#4', KeyC: 'E4', KeyV: 'F4', KeyG: 'F#4', KeyB: 'G4', KeyH: 'G#4', KeyN: 'A4', KeyJ: 'A#4', KeyM: 'B4',
  KeyQ: 'C5', Digit2: 'C#5', KeyW: 'D5', Digit3: 'D#5', KeyE: 'E5', KeyR: 'F5', Digit5: 'F#5', KeyT: 'G5', Digit6: 'G#5', KeyY: 'A5', Digit7: 'A#5', KeyU: 'B5', KeyI: 'C6',
};

function noteLetter(n) { return n[0]; }

defineGame('piano', {
  music: 'quiet',
  init() {
    const x0 = 236, kw = 88;
    this.doneBtn.x = 1340;
    this.doneBtn.y = 166;
    this.doneBtn.w = 210;
    this.doneBtn.h = 70;
    this.keys = [];
    for (let o = 4; o <= 5; o++) WHITE.forEach((l, i) => this.keys.push({ note: `${l}${o}`, white: true, x: x0 + ((o - 4) * 7 + i) * kw, w: kw - 4, y: 600, h: 270 }));
    this.keys.push({ note: 'C6', white: true, x: x0 + 14 * kw, w: kw - 4, y: 600, h: 270 });
    for (let o = 4; o <= 5; o++) ['C#', 'D#', null, 'F#', 'G#', 'A#'].forEach((l, i) => {
      if (l) this.keys.push({ note: `${l}${o}`, white: false, x: x0 + ((o - 4) * 7 + i) * kw + kw * 0.64, w: kw * 0.62, y: 600, h: 165 });
    });
    this.lit = {};
    this.mode = null;
    this.played = 0;
    this.lastKey = null;
    const modes = [['free', '🎹', 'Free play'], ['scale', '🪜', 'Scale'], ['twinkle', '⭐', 'Twinkle'], ['mary', '🐑', 'Mary'], ['ode', '🎉', 'Joy'], ['rhythm', '🥁', 'Beat'], ['highlow', '🐦', 'High/Low']];
    this.buttons = modes.map(([id, e, label], i) => ({ id, x: 12, y: 160 + i * 60, w: 188, h: 52, emoji: e, label, size: 21, color: '#ffffff', onClick: () => this.setMode(id) }));
    this.listenBtn = { x: 1330, y: 260, w: 220, h: 64, emoji: '👂', label: 'Listen', size: 24, color: '#fff3b8', hidden: true, onClick: () => this.listen() };
    this.buttons.push(this.listenBtn);
    this.setMode('free');
  },

  setMode(id) {
    this.mode = id;
    for (const b of this.buttons) b.selected = b.id === id;
    this.seq = null;
    this.idx = 0;
    this.listenBtn.hidden = !SONGS[id];
    this.rhythm = null;
    this.hl = null;
    if (id === 'free') this.say('Play any keys you like! Each color is a note.');
    if (id === 'scale') {
      this.seq = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'].map(n => [n, 1, n[0]]);
      this.say('The C major scale! Play the glowing keys: C D E F G A B C!');
    }
    if (SONGS[id]) {
      this.seq = SONGS[id].notes;
      this.say(`${SONGS[id].name}! Play the glowing key each time.`);
    }
    if (id === 'rhythm') {
      this.rhythm = { t: -1.2, beat: 0.75, hits: 0, beats: 12, judged: new Set() };
      this.say('Tap any key on the beat, when the ball lands! Ready?');
    }
    if (id === 'highlow') {
      this.hl = { round: 0, right: 0, waitT: 0.8, note: null };
      this.say('Listen! Is the sound HIGH like a bird, or LOW like a bear?');
      this.hlButtons = [
        { x: 520, y: 330, w: 260, h: 150, emoji: '🐦', label: 'High', size: 34, color: '#d8efff', onClick: () => this.answer(true) },
        { x: 820, y: 330, w: 260, h: 150, emoji: '🐻', label: 'Low', size: 34, color: '#ffe3cf', onClick: () => this.answer(false) },
      ];
    }
  },

  play(note, auto = false) {
    const midi = noteMidi(note);
    Snd.note(midi, { inst: 'piano', vel: 0.55 });
    this.lit[note] = 0.3;
    const k = this.keys.find(k => k.note === note);
    if (k && !auto) {
      FX.notes(k.x + k.w / 2, k.y - 20, 1);
      if (Rewards.unlocked('piano', 'sparkle')) FX.sparkle(k.x + k.w / 2, k.y + 40, 2);
    }
    if (auto) return;
    this.played++;
    if (this.mode === 'free') {
      this.score++;
      if (this.played % 12 === 0) FX.text(800, 420, pick(['Beautiful!', 'Lovely music!', 'Wow!']), '#b197fc', 48);
    }
    if (this.seq) this.checkSeq(note);
    if (this.rhythm) this.tapBeat();
  },

  checkSeq(note) {
    const want = this.seq[this.idx]?.[0];
    if (!want) return;
    if (note === want) {
      if (this.act.with === 'mom') Snd.note(noteMidi(want) - 12, { inst: 'piano', vel: 0.3, when: 0.02 });
      this.idx++;
      this.score++;
      if (this.idx >= this.seq.length) {
        const id = this.mode;
        if (SONGS[id]) S.songs[id] = { plays: (S.songs[id]?.plays || 0) + 1 };
        if (id === 'scale') Rewards.sticker('scale');
        if (SONGS[id]) Rewards.sticker('piano');
        this.say(SONGS[id] ? `You played ${SONGS[id].name}!` : 'You climbed the whole scale!');
        this.finish(2, SONGS[id] ? 'Bravo! 🎶' : 'Scale star!');
      }
    } else if (this.played % 3 === 0) FX.text(800, 470, `Try ${want[0]}!`, NOTE_COLORS[want[0]], 40);
  },

  listen() {
    if (!this.seq) return;
    const bpm = SONGS[this.mode]?.bpm || 100;
    let t = 0;
    const id = this.mode;
    for (const [n, b] of this.seq) {
      setTimeout(() => { if (this.mode === id) this.play(n, true); }, t * 1000);
      t += b * 60 / bpm;
    }
    Speech.say('Listen first!');
  },

  tapBeat() {
    const r = this.rhythm;
    if (!r || r.t < 0) return;
    const i = Math.round(r.t / r.beat), off = Math.abs(r.t - i * r.beat);
    if (off < 0.22 && !r.judged.has(i) && i < r.beats) {
      r.judged.add(i);
      r.hits++;
      this.score++;
      FX.text(800, 430, pick(['On the beat!', 'Great!', 'Yes!']), '#69db7c', 42);
      Snd.tone(1200, 0.05, { vol: 0.06 });
    }
  },

  answer(high) {
    const h = this.hl;
    if (!h?.note || h.answered) return;
    h.answered = true;
    const right = (h.note > 70) === high;
    if (right) {
      h.right++;
      this.good(800, 320, high ? 'High! Tweet!' : 'Low! Grr!');
    } else {
      this.oops(800, 320);
      Speech.say(h.note > 70 ? 'That was a high sound, like a bird!' : 'That was a low sound, like a bear!');
    }
    h.round++;
    h.waitT = 1.6;
    if (h.round >= 6) setTimeout(() => this.finish(h.right >= 5 ? 1 : 0, 'Great listening!'), 900);
  },

  tick(dt) {
    for (const n in this.lit) if ((this.lit[n] -= dt) <= 0) delete this.lit[n];
    const r = this.rhythm;
    if (r) {
      const before = r.t;
      r.t += dt;
      const bi = Math.floor(r.t / r.beat);
      if (r.t >= 0 && Math.floor(before / r.beat) !== bi && bi < r.beats) Snd.tone(bi % 4 ? 880 : 1320, 0.06, { type: 'square', vol: 0.05 });
      if (bi >= r.beats + 1 && !r.done) {
        r.done = true;
        this.say(`You tapped ${r.hits} beats!`);
        this.finish(r.hits >= 8 ? 1 : 0, 'Great rhythm!');
      }
    }
    const h = this.hl;
    if (h && h.round < 6 && (h.waitT -= dt) <= 0 && (!h.note || h.answered)) {
      h.note = Math.random() < 0.5 ? randi(79, 86) : randi(43, 50);
      h.answered = false;
      Snd.note(h.note, { inst: 'piano', vel: 0.6, dur: 1.4 });
      h.waitT = 99;
    }
  },

  render(ctx) {
    gameBackdrop(ctx, '#f3ecff', '#e3d6ff', { pattern: 'notes', accent: '#e9ddff' });
    // Piano body behind the keys.
    box(ctx, 214, 560, 1372, 340, 30, '#3d3650', { lw: 4, line: '#211c2e', light: 0.25 });
    drawText(ctx, '♪ Hammy Grand ♪', 900, 580, 22, { color: '#ffd34d' });
    this.drawStrip(ctx);
    for (const k of this.keys.filter(k => k.white)) this.drawKey(ctx, k);
    for (const k of this.keys.filter(k => !k.white)) this.drawKey(ctx, k);
    if (this.hl) {
      Btn.drawAll(ctx, this.hlButtons);
      drawText(ctx, `Round ${Math.min(6, this.hl.round + 1)} of 6`, 800, 510, 26, { color: '#7b6a8f' });
    }
    if (this.rhythm) this.drawRhythm(ctx);
    drawHamster(ctx, 1450, 540, 200, { pose: Object.keys(this.lit).length ? 'piano' : 'sit', mood: 'happy' });
    if (this.act.with === 'mom') drawHamster(ctx, 1290, 540, 250, { kind: 'mom', pose: Object.keys(this.lit).length ? 'piano' : 'idle', mood: 'happy', facing: -1 });
    if (Rewards.unlocked('piano', 'bird')) {
      Art.bird(ctx, 1560, 200 + Math.sin(Game.time * 3) * 5, 1.4);
    }
    drawText(ctx, 'Keys: Z X C V B N M  ·  Q W E R T Y U I', 900, 890, 18, { color: '#c9b6e8' });
  },

  drawKey(ctx, k) {
    const down = this.lit[k.note] > 0, want = this.seq?.[this.idx]?.[0] === k.note, l = noteLetter(k.note);
    const glow = want && (Math.sin(Game.time * 8) > -0.2);
    if (k.white) {
      rr(ctx, k.x, k.y + (down ? 6 : 0), k.w, k.h, 12);
      const g = ctx.createLinearGradient(0, k.y, 0, k.y + k.h);
      g.addColorStop(0, down ? '#f3ecff' : '#ffffff');
      g.addColorStop(1, down ? '#e3d6ff' : '#f3f0f7');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = glow ? 7 : 3;
      ctx.strokeStyle = glow ? NOTE_COLORS[l] : '#c9c1d6';
      ctx.stroke();
      circle(ctx, k.x + k.w / 2, k.y + k.h - 46 + (down ? 6 : 0), 26);
      ctx.fillStyle = NOTE_COLORS[l];
      ctx.fill();
      drawText(ctx, l, k.x + k.w / 2, k.y + k.h - 45 + (down ? 6 : 0), 30, { color: '#ffffff', stroke: 'rgba(0,0,0,.18)', sw: 0.12 });
    } else {
      rr(ctx, k.x, k.y + (down ? 4 : 0), k.w, k.h, 8);
      ctx.fillStyle = down ? '#7c6a96' : '#2f2a3d';
      ctx.fill();
      if (glow) { ctx.lineWidth = 5; ctx.strokeStyle = '#ffd34d'; ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(k.x + 6, k.y + 8, k.w - 12, 30);
    }
  },

  // The notes to play, as big colored bubbles above the keyboard.
  drawStrip(ctx) {
    box(ctx, 240, 250, 1060, 260, 30, 'rgba(255,255,255,.85)', { lw: 0 });
    if (!this.seq) {
      if (this.mode === 'free') {
        WHITE.forEach((l, i) => {
          circle(ctx, 320 + i * 140, 360, 44);
          paint(ctx, NOTE_COLORS[l], 316, 404, { lw: 3 });
          drawText(ctx, l, 320 + i * 140, 360, 44, { color: '#fff', stroke: 'rgba(0,0,0,.2)', sw: 0.1 });
        });
        drawText(ctx, 'Do Re Mi Fa Sol La Ti', 770, 460, 30, { color: '#7b6a8f' });
      }
      return;
    }
    const start = Math.max(0, this.idx - 1);
    for (let j = 0; j < 7; j++) {
      const i = start + j, n = this.seq[i];
      if (!n) break;
      const [note, , lyric] = n, l = noteLetter(note), x = 320 + j * 150, cur = i === this.idx, done = i < this.idx;
      const y = 350 + (cur ? Math.sin(Game.time * 6) * 8 : 0) - (note.endsWith('5') ? 30 : 0);
      circle(ctx, x, y, cur ? 54 : 42);
      paint(ctx, done ? '#d8d2e6' : NOTE_COLORS[l], y - 50, y + 50, { lw: cur ? 5 : 3, line: cur ? '#ffd34d' : undefined });
      drawText(ctx, l, x, y, cur ? 52 : 40, { color: '#ffffff', stroke: 'rgba(0,0,0,.2)', sw: 0.1 });
      if (lyric) drawText(ctx, lyric.replace('/', ''), x, 470, 26, { color: done ? '#b8aec8' : PAL.ink });
    }
    drawText(ctx, `${this.idx} / ${this.seq.length}`, 1250, 280, 22, { color: '#7b6a8f' });
  },

  drawRhythm(ctx) {
    const r = this.rhythm, beat = r.t / r.beat, ph = beat - Math.floor(beat);
    const bx = 800, by = 470 - Math.sin(ph * Math.PI) * 160;
    ellipse(ctx, bx, 480, 70, 16);
    ctx.fillStyle = r.t >= 0 && ph < 0.15 ? '#ffd34d' : '#e3d6ff';
    ctx.fill();
    circle(ctx, bx, r.t < 0 ? 300 : by, 30);
    paint(ctx, '#ff8fb8', by - 30, by + 30, { lw: 3 });
    for (let i = 0; i < r.beats; i++) {
      circle(ctx, 380 + i * 70, 290, 14);
      ctx.fillStyle = r.judged.has(i) ? '#69db7c' : i < beat ? '#d8d2e6' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#c9b6e8';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (r.t < 0) drawText(ctx, 'Get ready…', 800, 380, 40, { color: '#7b6a8f' });
  },

  keyAt(p) {
    return this.keys.find(k => !k.white && p.x >= k.x && p.x <= k.x + k.w && p.y >= k.y && p.y <= k.y + k.h)
      || this.keys.find(k => k.white && p.x >= k.x && p.x <= k.x + k.w + 4 && p.y >= k.y && p.y <= k.y + k.h);
  },
  down(p) {
    if (this.hl && Btn.press(this.hlButtons, p)) return;
    const k = this.keyAt(p);
    if (k) { this.play(k.note); this.lastKey = k; }
  },
  move(p) {
    if (!Input.pointer.down) return;
    const k = this.keyAt(p);
    if (k && k !== this.lastKey) { this.play(k.note); this.lastKey = k; }
  },
  up() { this.lastKey = null; },
  keyDown(e) {
    const n = KEYMAP[e.code];
    if (n) this.play(n);
    if (this.hl) {
      if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') this.answer(true);
      if (e.code === 'ArrowDown' || e.code === 'ArrowRight') this.answer(false);
    }
    if (e.code === 'Space' && this.rhythm) this.tapBeat();
  },
  hammyAt() { return { x: 1450, y: 400 }; },
});

// ---------------------------------------------------------------- karaoke

defineGame('karaoke', {
  music: 'quiet',
  init() {
    this.song = null;
    this.pickButtons();
    this.say('Pick a song to sing with Hammy!');
  },
  pickButtons() {
    const ids = Object.keys(SONGS);
    this.buttons = ids.map((id, i) => ({ x: 170 + (i % 3) * 430, y: 300 + Math.floor(i / 3) * 190, w: 400, h: 150, emoji: SONGS[id].icon, label: SONGS[id].name, size: 24, color: ['#ffd6e5', '#d8efff', '#fff3b8', '#e2f8e7', '#efe6ff', '#ffe3cf'][i], onClick: () => this.start(id) }));
  },
  start(id) {
    const s = SONGS[id], spb = 60 / s.bpm;
    let t = 1.5;
    this.song = { id, ...s, events: s.notes.map(([n, b, lyr]) => { const e = { n, b, lyr: lyr.replace('/', ''), line: lyr.startsWith('/'), t, played: false, hit: false }; t += b * spb; return e; }), end: t + 1, time: 0, hits: 0 };
    let line = 0;
    for (const e of this.song.events) { if (e.line) line++; e.lineNo = line; }
    this.buttons = [{ x: W - 300, y: H - 220, w: 260, h: 110, emoji: '🎤', label: 'Sing!', size: 34, color: '#ff8fb8', glow: true, onClick: () => this.sing() }];
    this.say(`${s.name}! Tap "Sing!" when the stars reach the circle.`, false);
    Speech.say(`${s.name}! Let's sing!`);
  },
  sing() {
    const s = this.song;
    if (!s) return;
    const e = s.events.find(e => !e.hit && Math.abs(e.t - s.time) < 0.35);
    FX.notes(800, 520, 2);
    if (e) {
      e.hit = true;
      s.hits++;
      this.score++;
      FX.sparkle(260, 790, 5);
      FX.text(800, 470, pick(['♪ La la!', '♪ Lovely!', '♪ Yay!']), '#ff8fb8', 38);
    }
  },
  tick(dt) {
    const s = this.song;
    if (!s) return;
    s.time += dt;
    if (s.time > 3.5 && this.prompt) this.prompt = '';
    const spb = 60 / s.bpm;
    for (const e of s.events) {
      if (!e.played && s.time >= e.t) {
        e.played = true;
        Snd.note(noteMidi(e.n), { inst: 'flute', vel: 0.45, dur: e.b * spb * 0.9 });
        if (e === s.events.find(x => x.t === e.t) && Math.round(e.t / spb) % 2 === 0) Snd.note(noteMidi(e.n) - 12 - (noteMidi(e.n) % 12 === 4 ? 4 : noteMidi(e.n) % 12 === 2 ? 2 : 0), { inst: 'pluck', vel: 0.3 });
      }
    }
    if (s.time >= s.end && !s.done) {
      s.done = true;
      Rewards.sticker('singer');
      this.finish(s.hits >= s.events.length * 0.5 ? 1 : 0, `What a singer! 🎤`);
    }
  },
  render(ctx) {
    gameBackdrop(ctx, '#5b4a8a', '#3e3270');
    Props.beams(ctx, Game.time, 0.14);
    Props.discoBall(ctx, 800, 70, 40);
    for (const sx of [120, 1480]) Props.speaker(ctx, sx, 860, 1.2, Math.max(0, Math.sin(Game.time * 7)));
    const s = this.song;
    // Screen with lyrics.
    box(ctx, 300, 140, 1000, 330, 30, '#2b2550', { lw: 5, line: '#8d7ae0' });
    if (!s) {
      drawText(ctx, '🎤 Pick a song!', 800, 210, 52, { color: '#ffe066' });
    } else {
      const cur = s.events.filter(e => e.t <= s.time).pop() || s.events[0];
      const lineNo = cur.lineNo, words = s.events.filter(e => e.lineNo === lineNo), next = s.events.filter(e => e.lineNo === lineNo + 1);
      ctx.font = `700 46px ${FONT}`;
      const parts = words.map(e => e.lyr), tw = parts.reduce((a, p) => a + ctx.measureText(p + ' ').width, 0);
      let x = 800 - tw / 2;
      for (const e of words) {
        const wpx = ctx.measureText(e.lyr + ' ').width, on = e.t <= s.time;
        drawText(ctx, e.lyr, x, 260, 46, { align: 'left', color: on ? '#ffe066' : '#ffffff', stroke: on ? '#ff6fd0' : null, sw: 0.1 });
        if (e === cur) { circle(ctx, x + wpx / 2 - 10, 205 - Math.abs(Math.sin((s.time - e.t) * 6)) * 20, 12); ctx.fillStyle = '#ff8fb8'; ctx.fill(); }
        x += wpx;
      }
      drawText(ctx, next.map(e => e.lyr).join(' '), 800, 340, 32, { color: '#b8aee0' });
      drawText(ctx, `${SONGS[s.id].icon} ${s.name}`, 800, 430, 26, { color: '#d8d0ff' });
      // Cue lane: stars slide to the circle; tap Sing! as they arrive.
      rr(ctx, 160, 730, 1080, 120, 60);
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      ctx.fill();
      circle(ctx, 260, 790, 50);
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 6;
      ctx.stroke();
      for (const e of s.events) {
        const dx = (e.t - s.time) * 300;
        if (dx < -60 || dx > 1000) continue;
        drawStar(ctx, 260 + dx, 790, e.hit ? 30 : 24, e.hit ? '#69db7c' : NOTE_COLORS[e.n[0]], Game.time);
      }
    }
    drawHamster(ctx, 800, 700, 220, { pose: s ? 'sing' : 'wave', mood: 'excited' });
    const b = this.buddy();
    if (b) drawHamster(ctx, 1040, 690, 230, { kind: b, pose: s ? 'dance' : 'idle', mood: 'happy', facing: -1 });
    if (s) drawText(ctx, `⭐ ${s.hits}`, 1380, 640, 40, { color: '#ffe066', stroke: '#5b4a8a' });
  },
  keyDown(e) { if (e.code === 'Space' || e.code === 'Enter') this.sing(); },
  down(p) { if (this.song) this.sing(); },
  hammyAt() { return { x: 800, y: 500 }; },
});

// ------------------------------------------------------------ dance party

const DANCE_MOVES = [
  { id: 'up', icon: '🙌', name: 'Arms up!', key: 'ArrowUp', pose: 'celebrate' },
  { id: 'spin', icon: '🌀', name: 'Spin!', key: 'ArrowLeft', pose: 'dance' },
  { id: 'jump', icon: '🦘', name: 'Jump!', key: 'ArrowDown', pose: 'jump' },
  { id: 'clap', icon: '👏', name: 'Clap!', key: 'ArrowRight', pose: 'play' },
];

defineGame('dance', {
  music: 'village',
  init() {
    this.round = 0;
    this.goal = 8;
    this.move = null;
    this.mine = null;
    this.wait = 1;
    this.buttons = DANCE_MOVES.map((m, i) => ({ x: 280 + i * 270, y: 720, w: 240, h: 130, emoji: m.icon, label: m.name, size: 26, color: ['#ffd6e5', '#d8efff', '#fff3b8', '#e2f8e7'][i], onClick: () => this.doMove(m) }));
    this.say('Dance party! Copy your friend\'s dance move!');
  },
  tick(dt) {
    if (this.mine && (this.mine.t -= dt) <= 0) this.mine = null;
    if (!this.move && (this.wait -= dt) <= 0) {
      this.move = pick(DANCE_MOVES);
      this.moveT = 0;
      Speech.say(this.move.name, { who: 'friend' });
      Snd.ding(3);
    }
    if (this.move) this.moveT += dt;
  },
  doMove(m) {
    this.mine = { m, t: 1 };
    if (!this.move) return;
    if (m === this.move) {
      this.round++;
      this.good(800, 300, pick(['Groovy!', 'Great moves!', 'Yeah!']));
      this.move = null;
      this.wait = 0.8;
      if (this.round >= this.goal) this.finish(this.tries === 0 ? 1 : 0, 'Dance star! 🪩');
    } else this.oops(800, 300);
  },
  render(ctx) {
    gameBackdrop(ctx, '#ffe9f8', '#e8dcff');
    Props.beams(ctx, Game.time, 0.12);
    box(ctx, 120, 560, W - 240, 130, 30, '#e0b07c', { lw: 4 });
    Props.stringLights(ctx, 120, 140, W - 120, 140, 30);
    const f = this.buddy();
    const fm = this.move;
    drawHamster(ctx, 520, 620, 280, { kind: f, pose: fm ? fm.pose : 'idle', mood: 'happy', t: Game.time });
    drawHamster(ctx, 1080, 620, 280, { pose: this.mine ? this.mine.m.pose : 'idle', mood: 'excited', t: Game.time });
    if (fm) {
      speechBubble(ctx, `${fm.icon} ${fm.name}`, 520, 330, { size: 34 });
    }
    drawText(ctx, `${FRIEND[f]?.name || 'Friend'}`, 520, 655, 26);
    drawText(ctx, S.hamster.name, 1080, 655, 26);
    drawText(ctx, `🪩 ${this.round} / ${this.goal}`, W - 150, 200, 40, { color: '#ff7fb0', stroke: '#fff' });
    if (Math.random() < 0.06) FX.notes(rand(200, 1400), 560, 1);
  },
  keyDown(e) {
    const m = DANCE_MOVES.find(x => x.key === e.code);
    if (m) this.doMove(m);
  },
  hammyAt() { return { x: 1080, y: 450 }; },
});
