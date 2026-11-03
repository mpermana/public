// The Main House: a dollhouse overview with every room visible, and one
// full-size scene per room. Room art is drawn once at full size; the
// overview reuses it as thumbnails so both always match.

const FLOORS = [['kitchen', 'living', 'family'], ['study', 'reading', 'piano'], ['bedroom', 'bathroom', 'karaoke']];
const HOUSE_BOX = { w: 360, h: 202 };
const HOUSE_ROOMS = {
  kitchen: [190, 650], living: [558, 650], family: [926, 650],
  study: [190, 440], reading: [558, 440], piano: [926, 440],
  bedroom: [190, 230], bathroom: [558, 230], karaoke: [926, 230],
  playroom: [640, 66],
};
const STAIRS_X = 1362;
const roomRect = id => {
  const [x, y] = HOUSE_ROOMS[id];
  return id === 'playroom' ? { x, y, w: 320, h: 152 } : { x, y, ...HOUSE_BOX };
};
const roomFloorY = id => { const r = roomRect(id); return r.y + r.h - 12; };

// The shared shell of a room: wallpaper, ceiling trim, floor, baseboard.
function roomShell(g, { wall = '#ffe9d6', accent = '#ffd9c4', pattern = 'stripes', floor = 'wood', floorColor = PAL.woodLight }) {
  g.fillStyle = wallPattern(g, pattern, wall, accent);
  g.fillRect(0, 0, W, 545);
  const wg = g.createLinearGradient(0, 0, 0, 545);
  wg.addColorStop(0, 'rgba(255,255,255,.28)');
  wg.addColorStop(1, 'rgba(90,60,110,.06)');
  g.fillStyle = wg;
  g.fillRect(0, 0, W, 545);
  g.fillStyle = floor === 'wood' ? woodPattern(g, floorColor) : floor === 'tile' ? tilePattern(g, '#ffffff', floorColor, 90) : carpetPattern(g, floorColor);
  g.fillRect(0, 540, W, 360);
  const fg = g.createLinearGradient(0, 540, 0, 900);
  fg.addColorStop(0, 'rgba(60,40,80,.16)');
  fg.addColorStop(0.25, 'rgba(60,40,80,0)');
  fg.addColorStop(1, 'rgba(60,40,80,.05)');
  g.fillStyle = fg;
  g.fillRect(0, 540, W, 360);
  // Dollhouse side walls, a little darker for depth.
  for (const side of [0, 1]) {
    g.fillStyle = 'rgba(74,58,92,.07)';
    g.beginPath();
    if (side) { g.moveTo(W, 0); g.lineTo(W - 26, 26); g.lineTo(W - 26, 545); g.lineTo(W, 545); }
    else { g.moveTo(0, 0); g.lineTo(26, 26); g.lineTo(26, 545); g.lineTo(0, 545); }
    g.fill();
  }
  box(g, -10, -14, W + 20, 40, 0, '#ffffff', { lw: 3 });
  box(g, -10, 526, W + 20, 24, 0, '#ffffff', { lw: 3 });
}

// One room scene. `draw` paints furniture into the cached backdrop.
function room(id, def) {
  const floorIdx = FLOORS.findIndex(f => f.includes(id)), floor = FLOORS[floorIdx] || [], i = floor.indexOf(id);
  // Rooms along a floor open into each other through a doorway in the side
  // wall. Hammy comes in a step clear of it, so the way back is in plain sight
  // and the doorway is not tripped again on arrival.
  const doors = [], entries = {};
  if (floor[i - 1]) {
    doors.push({ side: -1, to: `room:${floor[i - 1]}`, y: 600, h: 290 });
    entries[`room:${floor[i - 1]}`] = { x: GATE.w + 90, y: 760 };
  }
  if (floor[i + 1]) {
    doors.push({ side: 1, to: `room:${floor[i + 1]}`, y: 600, h: 290 });
    entries[`room:${floor[i + 1]}`] = { x: W - GATE.w - 90, y: 760 };
  }
  // The room at the left of every floor holds the stairs, so the whole house
  // can be walked: up at the back of the room, down through the stairwell at
  // the front. A floor with only one of the two gets the whole left wall.
  if (i === 0) {
    const up = FLOORS[floorIdx + 1]?.[0], down = FLOORS[floorIdx - 1]?.[0], both = up && down;
    if (up) {
      doors.push({ side: -1, to: `room:${up}`, y: 600, h: both ? 150 : 290, stairs: 'up' });
      entries[`room:${up}`] = { x: GATE.w + 90, y: both ? 680 : 700 };
    }
    if (down) {
      doors.push({ side: -1, to: `room:${down}`, y: both ? 750 : 600, h: both ? 140 : 290, stairs: 'down' });
      entries[`room:${down}`] = { x: GATE.w + 90, y: both ? 820 : 800 };
    }
  }
  const left = doors.some(d => d.side < 0), right = doors.some(d => d.side > 0);
  const blocks = def.blocks || [];
  return makeLocation({
    id: `room:${id}`, title: ROOMS[id].name, back: 'house', music: 'home', outdoor: false,
    walk: [{ x: left ? 0 : 70, y: 610, w: (right ? W : W - 70) - (left ? 0 : 70), h: 270 }],
    blocks, doors, entries, start: def.start || { x: W / 2, y: 780 },
    ...def,
    drawBack(g) {
      roomShell(g, def.shell);
      def.draw.call(this, g);
      for (const d of doors) {
        if (d.stairs) Props.stairwell(g, d);
        else Props.doorway(g, d.side, ROOMS[d.to.slice(5)].icon);
      }
    },
  });
}

// ----------------------------------------------------------------- rooms

room('kitchen', {
  shell: { wall: '#e6f8ef', accent: '#d4f1e2', pattern: 'stripes', floor: 'tile', floorColor: '#ffe3ec' },
  blocks: [{ x: 120, y: 560, w: 1000, h: 60 }, { x: 1110, y: 690, w: 300, h: 60 }],
  spots: {
    sink: { name: 'Sink', x: 420, y: 670, hit: { x: 290, y: 400, w: 260, h: 200 }, acts: ['wash_dishes'],
      fiddle: { icon: '🚰', label: 'Turn the tap', snd: 'splash', pose: 'wash', fx: 'bubbles', fxAt: { x: 420, y: 430 },
        says: ['Tap off.', 'Splish splash!'] } },
    stove: { name: 'Stove', x: 760, y: 670, hit: { x: 660, y: 340, w: 200, h: 260 }, acts: ['cook_mom'] },
    fridge: { name: 'Fridge', x: 1000, y: 680, hit: { x: 915, y: 270, w: 170, h: 340 }, acts: ['snack', 'breakfast', 'lunch'],
      fiddle: { icon: '🧊', label: 'Peek inside', snd: 'soft', pose: 'think',
        says: ['Door shut. Keep it cold!', 'Brrr! So many yummy things.'] } },
    table: { name: 'Dining table', x: 1250, y: 800, hit: { x: 1080, y: 600, w: 340, h: 160 }, acts: ['breakfast', 'lunch', 'dinner', 'snack'], alwaysAsk: true },
    cabinet: { name: 'Cupboard', x: 300, y: 700, hit: { x: 120, y: 70, w: 500, h: 120 }, badgeAt: { x: 370, y: 60 },
      fiddle: { icon: '🍽️', label: 'Open the cupboard', snd: 'soft', pose: 'wave',
        says: ['Cupboard closed.', 'Plates, bowls and cups!'] } },
    toaster: { name: 'Toaster', x: 620, y: 700, hit: { x: 576, y: 400, w: 90, h: 70 }, badgeAt: { x: 620, y: 396 },
      fiddle: { icon: '🍞', label: 'Make some toast', snd: 'ding', pose: 'celebrate', fx: 'sparkle', fxAt: { x: 620, y: 420 },
        says: ['Bread goes in…', 'POP! Toast is ready!'] } },
    kettle: { name: 'Kettle', x: 265, y: 700, hit: { x: 223, y: 378, w: 86, h: 92 }, badgeAt: { x: 265, y: 372 },
      fiddle: { icon: '☕', label: 'Boil the kettle', snd: 'whoosh', pose: 'think',
        says: ['Kettle off.', 'Bubble bubble… nearly boiled!'] } },
    bin: { name: 'Bin', x: 880, y: 820, hit: { x: 836, y: 690, w: 90, h: 120 }, badgeAt: { x: 880, y: 680 },
      fiddle: { icon: '♻️', label: 'Pop the scraps in', snd: 'tap', pose: 'play',
        says: ['Lid closed. All tidy!', 'In it goes! Peels go in the green one.'] } },
    fruit: { name: 'Fruit bowl', x: 1200, y: 790, hit: { x: 1172, y: 584, w: 58, h: 56 }, badgeAt: { x: 1200, y: 572 },
      fiddle: { icon: '🍎', label: 'Take an apple', snd: 'pop', pose: 'celebrate',
        says: ['Back in the bowl!', 'A shiny red apple!'],
        on(state) { this.carry = state === 1 ? '🍎' : null; } } },
    clock: { name: 'Kitchen clock', x: 720, y: 700, hit: { x: 672, y: 82, w: 96, h: 96 }, badgeAt: { x: 720, y: 72 },
      fiddle: { icon: '🕰️', label: 'Listen to the clock', snd: 'tap', pose: 'think', fx: 'sparkle', fxAt: { x: 720, y: 130 },
        says: ['Tick… tock… tick… tock!', 'Is it nearly dinner time?'] } },
  },
  family: { mom: { x: 860, y: 700, facing: -1, acts: ['hug_mom', 'cook_mom', 'play_mom'] }, dad: { x: 1340, y: 800, facing: -1 } },
  draw(g) {
    Props.counter(g, 380, 610, 520, 150, '#a8dcc8');
    Props.sink(g, 420, 444, 140);
    box(g, 340, 435, 160, 20, 8, '#d8e4ee', { lw: 2 });
    drawEmoji(g, '🍯', 200, 430, 46);
    drawEmoji(g, '🍞', 520, 428, 52);
    Props.stove(g, 760, 605, 1);
    Props.window(g, 1150, 110, 230, 170, { curtain: '#ffd6e5', seed: 3 });
    Props.plant(g, 1480, 610, 0.9, { pot: '#ffb3cf' });
    for (const [px, c] of [[230, '#ffb3cf'], [290, '#ffe48a'], [350, '#bfe6ff']]) box(g, px, 210, 44, 54, 10, c, { lw: 2 });
  },
  props: [{ y: 760, draw(ctx) { Props.chair(ctx, 1095, 790, 1, '#ffd27a', -1); Props.chair(ctx, 1410, 790, 1, '#ffd27a', 1); Props.table(ctx, 1250, 760, 320, 130, { cloth: '#ffd6e5' }); if (this.fid('fruit') === 0) drawEmoji(ctx, '🍎', 1200, 610, 44); drawEmoji(ctx, '🌷', 1300, 600, 50); } }],
  drawDyn(ctx) {
    Props.wallCabinets(ctx, 120, 70, 500, 120, '#a8dcc8', this.fid('cabinet') === 1);
    Props.window(ctx, 1150, 110, 230, 170, { curtain: '#ffd6e5', seed: 3 });
    Props.wallClock(ctx, 720, 130, 44);
    Props.fridge(ctx, 1000, 615, 1, { open: this.fid('fridge') === 1 });
    Props.kettle(ctx, 265, 460, 1, this.fid('kettle') === 1);
    Props.toaster(ctx, 620, 460, 1, this.fid('toaster') === 1 ? 1 : 0);
    Props.bin(ctx, 880, 820, 1, { lid: this.fid('bin') === 1 });
    if (this.fid('sink') === 1) {
      ctx.strokeStyle = 'rgba(140,200,255,.75)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(420, 420);
      ctx.lineTo(420 + Math.sin(Game.time * 9) * 3, 448);
      ctx.stroke();
      if (Math.random() < 0.25) FX.bubbles(420, 444, 1, 18);
    }
    if (Family.where('mom') === this.id) Props.stove(ctx, 760, 605, 1, { on: true });
  },
  lights: () => [[720, 300, 360, '#ffe9a8', 0.5], [1260, 420, 320, '#ffe9a8', 0.4]],
});

room('living', {
  shell: { wall: '#fff0e3', accent: '#ffe0cc', pattern: 'dots', floor: 'wood', floorColor: '#e9bd8c' },
  blocks: [{ x: 210, y: 560, w: 340, h: 60 }, { x: 820, y: 560, w: 360, h: 80 }, { x: 1240, y: 560, w: 240, h: 60 }],
  spots: {
    tv: { name: 'TV', x: 420, y: 720, hit: { x: 220, y: 240, w: 340, h: 380 }, acts: ['watch_tv'], sit: { x: 900, y: 650, pose: 'sit', facing: -1 } },
    sofa: { name: 'Sofa', x: 1000, y: 700, hit: { x: 820, y: 480, w: 360, h: 160 }, acts: ['relax', 'read_together'], sit: { x: 1000, y: 625, pose: 'sit' } },
    rug: { name: 'Play rug', x: 760, y: 780, hit: { x: 600, y: 720, w: 320, h: 110 }, acts: ['play_mom', 'play_dad'], badgeAt: { x: 760, y: 700 } },
    photos: { name: 'Family photos', x: 680, y: 690, hit: { x: 580, y: 130, w: 220, h: 200 }, acts: ['photos'] },
    // Little things to fiddle with: no activity, no time, just fun.
    lamp: { name: 'Floor lamp', x: 1150, y: 700, hit: { x: 1160, y: 370, w: 110, h: 250 }, badgeAt: { x: 1212, y: 350 },
      fiddle: { icon: '💡', label: 'Switch the lamp', start: 1, snd: 'click', pose: 'wave', says: ['Click! Lights off.', 'Click! Nice and bright!'] } },
    curtains: { name: 'Curtains', x: 900, y: 660, hit: { x: 860, y: 80, w: 200, h: 210 }, badgeAt: { x: 1000, y: 100 },
      fiddle: { icon: '🪟', label: 'Open the curtains', start: 1, snd: 'swish', pose: 'wave', says: ['Curtains closed. Cosy!', 'Hello, sunshine!'] } },
    clock: { name: 'Wall clock', x: 1300, y: 660, hit: { x: 1310, y: 80, w: 100, h: 100 }, badgeAt: { x: 1360, y: 70 },
      fiddle: { icon: '🕰️', label: 'Listen to the clock', snd: 'tap', pose: 'think', fx: 'sparkle', fxAt: { x: 1360, y: 130 },
        says: ['Tick… tock… tick… tock!', 'Tick tock! What time is it?'] } },
    plant: { name: 'Houseplant', x: 200, y: 700, hit: { x: 60, y: 440, w: 130, h: 190 }, badgeAt: { x: 120, y: 430 },
      fiddle: { icon: '🚿', label: 'Water the plant', snd: 'splash', pose: 'play', fx: 'bubbles', fxAt: { x: 120, y: 540 },
        loop: false, says: ['Thirsty little plant!', 'Glug glug! There you go.', 'Look, a flower! Thank you!'],
        on(state) { if (state > 0) FX.hearts(120, 480, 3); } } },
    pillow: { name: 'Throw pillow', x: 880, y: 700, hit: { x: 830, y: 520, w: 110, h: 80 }, badgeAt: { x: 880, y: 505 },
      fiddle: { icon: '🩷', label: 'Hug the pillow', snd: 'soft', pose: 'hug', fx: 'hearts', fxAt: { x: 880, y: 540 },
        says: ['Puff! All fluffed up again.', 'Squish! So soft and snuggly.'] } },
    books: { name: 'Bookshelf', x: 1330, y: 720, hit: { x: 1255, y: 330, w: 210, h: 290 }, badgeAt: { x: 1360, y: 320 },
      fiddle: { icon: '📚', label: 'Pick a book', snd: 'page', pose: 'celebrate',
        says: ['Back on the shelf. All tidy!', 'I picked a book!'],
        on(state) { this.carry = state === 1 ? 'book' : null; } } },
    fan: { name: 'Fan', x: 300, y: 790, hit: { x: 250, y: 650, w: 100, h: 110 }, badgeAt: { x: 300, y: 640 },
      fiddle: { icon: '🌀', label: 'Turn on the fan', snd: 'whoosh', pose: 'dance',
        says: ['Fan off. All quiet.', 'Whirrr! My ears are flappy!'] } },
    speaker: { name: 'Speaker', x: 620, y: 790, hit: { x: 580, y: 600, w: 90, h: 190 }, badgeAt: { x: 622, y: 590 },
      fiddle: { icon: '🎵', label: 'Play some music', snd: 'ding', pose: 'dance', fx: 'sparkle', fxAt: { x: 622, y: 620 },
        says: ['Music off.', 'Dance party! La la la!'] } },
  },
  family: { dad: { x: 1250, y: 720, facing: -1, acts: ['hug_dad', 'play_dad', 'read_together'] }, mom: { x: 1400, y: 760, facing: -1, acts: ['hug_mom', 'play_mom'] } },
  draw(g) {
    Props.rug(g, 760, 780, 240, 60, '#ffc6dc');
    Props.tv(g, 380, 620, 300, 180);
    Props.sofa(g, 1000, 640, 380, '#b9a4ff');
    Props.picture(g, 600, 150, 90, 70, { kind: 'family' });
    Props.picture(g, 710, 210, 80, 100, { kind: 'flower', frame: '#ffb3cf' });
    Props.picture(g, 600, 250, 90, 70, { kind: 'hammy', frame: '#b9a4ff' });
    Props.bookshelf(g, 1360, 620, 220, 300, { seed: 7 });
  },
  // Everything that can be switched, pulled, watered or picked up is painted
  // live, so it can show what state it is in.
  drawDyn(ctx) {
    Props.window(ctx, 900, 110, 200, 160, { curtain: '#b9a4ff', seed: 5, open: this.fid('curtains') === 1 });
    Props.wallClock(ctx, 1360, 130, 40);
    Props.floorLamp(ctx, 1210, 620, 1, '#ffe48a', this.fid('lamp') === 1);
    Props.plant(ctx, 120, 620, 1.1, { flowers: this.fid('plant') });
    if (this.fid('books') === 1) {
      // One gap on the middle shelf, where the book came from.
      box(ctx, 1332, 500, 26, 62, 4, '#c08552', { lw: 0 });
    }
    const inl = this.inline;
    if (inl?.kind === 'tv') Props.tv(ctx, 380, 620, 300, 180, { on: true, show: (c, x, y, w, h) => tvShow(c, x, y, w, h, inl.channel) });
  },
  props: [
    { y: 730, draw(ctx) { Props.coffeeTable(ctx, 520, 760, 180, '#e0b07c'); drawEmoji(ctx, '🍪', 500, 685, 40); } },
    { y: 600, draw(ctx) { Props.pillow(ctx, 880, 560, 1, '#ffe48a', this.ham.pose === 'hug' ? 1 : 0); } },
    { y: 788, draw(ctx) { Props.fan(ctx, 300, 790, 0.72, this.fid('fan') === 1 ? Game.time * 14 : 0); } },
    { y: 786, draw(ctx) { Props.speaker(ctx, 622, 790, 0.5, this.fid('speaker') === 1 ? 0.5 + Math.sin(Game.time * 9) * 0.5 : 0); } },
  ],
  // Music gets Hammy dancing whenever he has nothing else on.
  update() {
    if (this.fid('speaker') === 1 && this.ham.pose === 'idle' && !this.inline && !Activity.current) this.ham.pose = 'dance';
  },
  lights() {
    const out = [[380, 520, 260, '#bfe6ff', 0.3]];
    if (this.fid('lamp') === 1) out.push([1210, 380, 300, '#ffe9a8', 0.8]);
    return out;
  },
});

// What's on TV: friendly cartoons, three channels.
function tvShow(ctx, x, y, w, h, ch) {
  const t = Game.time;
  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, ['#9fdcff', '#ffd6e5', '#d8f5c8'][ch]);
  bg.addColorStop(1, ['#e9f8ff', '#fff3f8', '#f4ffe8'][ch]);
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  if (ch === 0) {
    Art.sun(ctx, x + w * 0.8, y + h * 0.25, h * 0.1);
    const bx = x + ((t * 60) % (w + 80)) - 40;
    drawHamster(ctx, bx, y + h * 0.95 - Math.abs(Math.sin(t * 5)) * 20, h * 0.55, { kind: 'pip', pose: 'run', facing: 1, shadow: false, fx: false });
  } else if (ch === 1) {
    for (let i = 0; i < 5; i++) Art.butterfly(ctx, x + w * (0.15 + i * 0.18), y + h * 0.5 + Math.sin(t * 2 + i) * h * 0.2, 0.9, Object.values(COLORS)[i], t + i);
  } else {
    for (let i = 0; i < 3; i++) {
      const bx = x + w * (0.2 + i * 0.3), by = y + h * 0.75 - Math.abs(Math.sin(t * 3 + i)) * h * 0.4;
      Props.beachBall(ctx, bx, by, h * 0.12, t * 2 + i);
    }
  }
  drawText(ctx, ['🌞 Pip Runs!', '🦋 Butterfly Show', '⚽ Bouncy Balls'][ch], x + w / 2, y + 18, 16, { color: '#4a3a5c', stroke: '#fff', sw: 0.3 });
}

room('family', {
  shell: { wall: '#f1e8ff', accent: '#e6d9ff', pattern: 'hearts', floor: 'carpet', floorColor: '#ffd9c7' },
  blocks: [{ x: 380, y: 560, w: 440, h: 80 }, { x: 960, y: 700, w: 280, h: 60 }, { x: 1300, y: 560, w: 220, h: 60 }],
  spots: {
    sofa: { name: 'Big sofa', x: 600, y: 700, hit: { x: 380, y: 470, w: 440, h: 170 }, acts: ['family_story', 'hug_family'], sit: { x: 600, y: 625, pose: 'sit' } },
    table: { name: 'Board games', x: 1100, y: 800, hit: { x: 950, y: 640, w: 300, h: 130 }, acts: ['board_game'] },
    wall: { name: 'Photo wall', x: 600, y: 700, hit: { x: 380, y: 90, w: 440, h: 230 }, acts: ['photos'] },
    lamp: { name: 'Floor lamp', x: 200, y: 700, hit: { x: 215, y: 380, w: 100, h: 240 }, badgeAt: { x: 262, y: 362 },
      fiddle: { icon: '💡', label: 'Switch the lamp', start: 1, snd: 'click', pose: 'wave',
        says: ['Click. Lights off.', 'Click! Warm and cosy.'] } },
    fire: { name: 'Fireplace', x: 915, y: 700, hit: { x: 840, y: 470, w: 150, h: 160 }, badgeAt: { x: 915, y: 458 },
      fiddle: { icon: '🔥', label: 'Light the fire', snd: 'whoosh', pose: 'think',
        says: ['Fire out. Nice and quiet.', 'Crackle crackle! So cosy.'] } },
    blankets: { name: 'Blanket basket', x: 330, y: 820, hit: { x: 276, y: 710, w: 112, h: 120 }, badgeAt: { x: 330, y: 700 },
      fiddle: { icon: '🧣', label: 'Get a blanket', snd: 'soft', pose: 'celebrate', fx: 'hearts', fxAt: { x: 600, y: 600 },
        says: ['Blanket folded away.', 'A blanket on the sofa — movie night!'] } },
    camera: { name: 'Camera', x: 1410, y: 760, hit: { x: 1372, y: 440, w: 80, h: 60 }, badgeAt: { x: 1412, y: 432 },
      fiddle: { icon: '📷', label: 'Take a photo', snd: 'sparkle', pose: 'wave', fx: 'sparkle', fxAt: { x: 1410, y: 470 },
        says: ['Say cheese! *click*', 'One more! Big smile!'] } },
    petbed: { name: 'Pet bed', x: 1270, y: 790, hit: { x: 1216, y: 730, w: 112, h: 62 }, badgeAt: { x: 1270, y: 724 },
      fiddle: { icon: '😴', label: 'Tuck someone in', snd: 'snore', pose: 'hug', fx: 'hearts', fxAt: { x: 1240, y: 800 },
        says: ['The little bed is empty.', 'Night night, sleep tight!'] } },
  },
  family: { mom: { x: 330, y: 720, facing: 1, acts: ['hug_mom', 'play_mom', 'board_game'] }, dad: { x: 880, y: 730, facing: -1, acts: ['hug_dad', 'play_dad', 'board_game'] } },
  draw(g) {
    Props.rug(g, 1100, 760, 230, 60, '#c9b6ff');
    Props.sofa(g, 600, 640, 460, '#ff9ec4');
    const frames = [[400, 110, 100, 80, 'family'], [520, 100, 90, 110, 'hammy'], [630, 120, 110, 80, 'landscape'], [760, 100, 70, 90, 'heart'], [430, 220, 80, 80, 'flower'], [540, 240, 120, 80, 'family'], [690, 230, 90, 90, 'hammy']];
    for (const [x, y, w, h, kind] of frames) Props.picture(g, x, y, w, h, { kind, frame: ['#e8b985', '#ffb3cf', '#b9a4ff'][x % 3] });
    Props.window(g, 1000, 110, 220, 170, { curtain: '#ffe48a', seed: 9 });
    Props.bookshelf(g, 1410, 620, 200, 280, { toys: true, color: '#ffd0a8', seed: 2 });
    Props.plant(g, 150, 620, 1);
  },
  drawDyn(ctx) {
    Props.window(ctx, 1000, 110, 220, 170, { curtain: '#ffe48a', seed: 9 });
    Props.floorLamp(ctx, 260, 620, 0.95, '#ffb3cf', this.fid('lamp') === 1);
    Props.fireplace(ctx, 915, 620, 1, this.fid('fire') === 1);
    Props.camera(ctx, 1410, 470, 1, this.ham.pose === 'wave' ? 1 : 0);
  },
  props: [{
    y: 760, draw(ctx) {
      Props.coffeeTable(ctx, 1100, 770, 260, '#e0b07c');
      box(ctx, 1010, 680, 180, 30, 8, '#7ed99a', { lw: 2.5 });
      for (let i = 0; i < 6; i++) { ctx.fillStyle = PARTY[i]; circle(ctx, 1030 + i * 28, 695, 7); ctx.fill(); }
      drawEmoji(ctx, '🎲', 1215, 680, 34);
    },
  }, {
    y: 820, draw(ctx) { Props.basket(ctx, 330, 820, 0.9, { color: '#ffd6a8', full: this.fid('blankets') === 0 ? 2 : 0 }); },
  }, {
    y: 640, draw(ctx) { if (this.fid('blankets') === 1) Props.blanket(ctx, 600, 612, 260, 90, '#ffd6a8'); },
  }, {
    y: 792, draw(ctx) {
      Props.petBed(ctx, 1270, 792, 1);
      if (this.fid('petbed') === 1) {
        const f = S.friends.invited || 'pip';
        drawHamster(ctx, 1270, 788, 92, { kind: f, pose: 'sleep', mood: 'relaxed', fx: false, shadow: false });
        if (Math.random() < 0.02) FX.hearts(1270, 742, 1);
      }
    },
  }],
  lights() {
    const out = [];
    if (this.fid('lamp') === 1) out.push([260, 380, 300, '#ffc6dc', 0.8]);
    if (this.fid('fire') === 1) out.push([915, 540, 260, '#ffc06a', 0.7]);
    return out;
  },
});

room('study', {
  shell: { wall: '#fff8d9', accent: '#fff0b3', pattern: 'checks', floor: 'wood', floorColor: '#e3c08f' },
  blocks: [{ x: 260, y: 560, w: 330, h: 70 }, { x: 1230, y: 640, w: 200, h: 70 }],
  spots: {
    desk: { name: 'Desk', x: 430, y: 690, hit: { x: 260, y: 440, w: 330, h: 200 }, acts: ['learn_letters', 'learn_numbers', 'addition', 'matching'], alwaysAsk: true },
    board: { name: 'Chalkboard', x: 960, y: 680, hit: { x: 750, y: 110, w: 420, h: 270 }, acts: ['drawing'] },
    blocks: { name: 'Blocks', x: 1330, y: 760, hit: { x: 1220, y: 560, w: 220, h: 150 }, acts: ['learn_colors', 'learn_shapes'], alwaysAsk: true },
  },
  family: { mom: { x: 700, y: 760, facing: -1 }, dad: { x: 1150, y: 780, facing: -1 } },
  draw(g) {
    Props.window(g, 300, 110, 220, 160, { curtain: '#a9dcff', seed: 11 });
    Props.blackboard(g, 760, 120, 400, 250);
    Props.poster(g, 1240, 110, 120, 150, 'abc');
    Props.poster(g, 1390, 140, 120, 120, '123');
    Props.poster(g, 590, 140, 110, 140, 'shapes');
    Props.desk(g, 425, 630, 330, '#ffd0a8');
    Props.chair(g, 600, 650, 0.9, '#7cc6ff', -1);
    Props.bookshelf(g, 120, 620, 150, 220, { seed: 4 });
  },
  drawDyn(ctx) { Props.window(ctx, 300, 110, 220, 160, { curtain: '#a9dcff', seed: 11 }); },
  props: [{ y: 700, draw(ctx) { Props.letterBlocks(ctx, 1290, 706, 'ABC', 56); Props.blockTower(ctx, 1400, 706, 3, 46, 5); drawText(ctx, '1 2 3', 1340, 600, 22, { color: '#7b6a8f' }); } }],
  lights: () => [[430, 400, 280, '#ffe9a8', 0.6]],
});

room('reading', {
  shell: { wall: '#e3f3ff', accent: '#d2ebff', pattern: 'leaves', floor: 'carpet', floorColor: '#ffe7c2' },
  blocks: [{ x: 160, y: 560, w: 300, h: 70 }, { x: 640, y: 570, w: 320, h: 90 }, { x: 1180, y: 560, w: 300, h: 70 }],
  spots: {
    chair: { name: 'Reading chair', x: 800, y: 710, hit: { x: 640, y: 450, w: 320, h: 210 }, acts: ['read_book'], sit: { x: 800, y: 640, pose: 'read' } },
    shelf: { name: 'Bookshelf', x: 320, y: 700, hit: { x: 160, y: 300, w: 300, h: 330 }, acts: ['read_book'] },
  },
  family: { mom: { x: 1050, y: 760, facing: -1 }, dad: { x: 560, y: 770, facing: 1 } },
  draw(g) {
    Props.bookshelf(g, 310, 620, 300, 330, { seed: 12 });
    Props.bookshelf(g, 1330, 620, 300, 330, { seed: 13, color: '#e8b985' });
    Props.window(g, 690, 100, 220, 170, { curtain: '#ffb3cf', seed: 13 });
    Props.rug(g, 800, 760, 260, 60, '#a9dcff');
    Props.floorLamp(g, 1030, 650, 1, '#ffe48a');
    Props.sofa(g, 800, 665, 320, '#ffb38a');
    Props.plant(g, 560, 640, 0.8);
    drawText(g, '📖 Story Corner', 800, 330, 34, { color: '#5b8fd0', stroke: '#fff' });
  },
  drawDyn(ctx) { Props.window(ctx, 690, 100, 220, 170, { curtain: '#ffb3cf', seed: 13 }); },
  lights: () => [[1030, 420, 320, '#ffe9a8', 1]],
});

room('piano', {
  shell: { wall: '#f3ecff', accent: '#e3d6ff', pattern: 'notes', floor: 'wood', floorColor: '#d9a974' },
  blocks: [{ x: 560, y: 560, w: 520, h: 150 }],
  spots: {
    piano: { name: 'Grand piano', x: 560, y: 780, hit: { x: 560, y: 370, w: 520, h: 330 }, acts: ['piano', 'piano_mom'], alwaysAsk: true, sit: { x: 500, y: 760, pose: 'piano', facing: 1 } },
  },
  family: { mom: { x: 1200, y: 760, facing: -1, acts: ['hug_mom', 'piano_mom'] }, dad: { x: 1350, y: 780, facing: -1 } },
  draw(g) {
    Props.window(g, 180, 110, 220, 170, { curtain: '#c9b6ff', seed: 17 });
    Props.window(g, 1200, 110, 220, 170, { curtain: '#c9b6ff', seed: 18 });
    Props.poster(g, 640, 120, 150, 120, 'notes');
    Props.poster(g, 850, 140, 110, 110, 'star');
    Props.rug(g, 800, 780, 360, 70, '#ffd6e5');
    Props.grandPiano(g, 820, 700, 1.05);
    Props.musicStand(g, 1240, 660, 1);
    Props.plant(g, 120, 640, 1.1);
    Props.plant(g, 1480, 640, 1, { pot: '#b9a4ff' });
  },
  drawDyn(ctx) {
    Props.window(ctx, 180, 110, 220, 170, { curtain: '#c9b6ff', seed: 17 });
    Props.window(ctx, 1200, 110, 220, 170, { curtain: '#c9b6ff', seed: 18 });
    if (Rewards.unlocked('piano', 'bird')) {
      Art.bird(ctx, 860, 470 + Math.sin(Game.time * 3) * 4, 1.6);
      circle(ctx, 860, 488, 14);
      paint(ctx, '#7cc6ff', 474, 502, { lw: 2 });
      if (Math.random() < 0.01) FX.notes(860, 450, 1);
    }
    if (Rewards.unlocked('piano', 'sparkle') && Math.random() < 0.08) FX.sparkle(620 + rand(0, 140), 560, 1);
  },
  props: [{ y: 790, draw(ctx) { Props.pianoBench(ctx, 500, 790, 1); } }],
  lights: () => [[820, 380, 360, '#ffe9a8', 0.5]],
});

room('karaoke', {
  shell: { wall: '#6a5aa8', accent: '#7a6ab8', pattern: 'stars', floor: 'tile', floorColor: '#b69cff' },
  blocks: [{ x: 120, y: 560, w: 160, h: 70 }, { x: 1320, y: 560, w: 160, h: 70 }],
  spots: {
    mic: { name: 'Microphone', x: 800, y: 800, hit: { x: 560, y: 120, w: 480, h: 640 }, acts: ['karaoke'], badgeAt: { x: 800, y: 470 } },
  },
  family: { mom: { x: 420, y: 760, facing: 1 }, dad: { x: 1180, y: 760, facing: -1 } },
  draw(g) {
    box(g, 520, 90, 560, 320, 24, '#4a3f78', { lw: 4 });
    rr(g, 540, 110, 520, 280, 14);
    g.fillStyle = '#2b2550';
    g.fill();
    drawText(g, '🎤 KARAOKE', 800, 200, 54, { color: '#ffe066', stroke: '#ff6fd0', sw: 0.12 });
    drawText(g, 'Tap the mic to sing!', 800, 280, 30, { color: '#ffffff' });
    Props.speaker(g, 200, 620, 1);
    Props.speaker(g, 1400, 620, 1);
    Props.sofa(g, 1230, 700, 240, '#ff9ec4');
  },
  drawDyn(ctx) {
    Props.beams(ctx, Game.time, 0.13);
    Props.discoBall(ctx, 800, 60, 34);
    const pulse = Math.max(0, Math.sin(Game.time * 6));
    Props.speaker(ctx, 200, 620, 1, pulse);
    Props.speaker(ctx, 1400, 620, 1, pulse);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `hsla(${(i * 36 + Game.time * 90) % 360}, 90%, 70%, .9)`;
      circle(ctx, 120 + i * 150, 40, 9);
      ctx.fill();
    }
  },
  props: [{ y: 760, draw(ctx) { Props.micStand(ctx, 800, 760, 1, { glow: true }); } }],
  lights: () => [[800, 250, 420, '#ff9fe0', 0.6]],
});

room('bedroom', {
  shell: { wall: '#e8f0ff', accent: '#d9e5ff', pattern: 'stars', floor: 'wood', floorColor: '#efc999' },
  blocks: [{ x: 320, y: 560, w: 480, h: 110 }, { x: 960, y: 560, w: 240, h: 60 }, { x: 830, y: 580, w: 100, h: 40 }],
  spots: {
    bed: { name: 'Bed', x: 560, y: 720, hit: { x: 320, y: 400, w: 480, h: 270 }, acts: ['sleep', 'nap', 'rest', 'bedtime_story'], alwaysAsk: true, sit: { x: 450, y: 585, pose: 'sleep', size: 0.9 } },
    wardrobe: { name: 'Wardrobe', x: 1080, y: 680, hit: { x: 970, y: 270, w: 220, h: 350 }, acts: ['dress'] },
    blinds: { name: 'Blinds', x: 240, y: 700, hit: { x: 110, y: 80, w: 250, h: 220 }, badgeAt: { x: 240, y: 80 },
      fiddle: { icon: '🪟', label: 'Open the blinds', start: 1, snd: 'swish', pose: 'wave',
        says: ['Blinds down. Nice and dark.', 'Blinds up! Hello, day!'] } },
    bedlamp: { name: 'Bedside lamp', x: 880, y: 700, hit: { x: 836, y: 500, w: 88, h: 120 }, badgeAt: { x: 880, y: 492 },
      fiddle: { icon: '💡', label: 'Switch the lamp', start: 1, snd: 'click', pose: 'wave',
        says: ['Click. Sweet dreams!', 'Click! Cosy light.'] } },
    blanket: { name: 'Blanket', x: 560, y: 760, hit: { x: 380, y: 520, w: 380, h: 120 }, badgeAt: { x: 560, y: 505 },
      fiddle: { icon: '🛏️', label: 'Turn down the bed', snd: 'soft', pose: 'play', fx: 'sparkle', fxAt: { x: 560, y: 560 },
        says: ['All tucked in and tidy!', 'Bed ready. Peekaboo!'] } },
    pillow: { name: 'Pillow', x: 420, y: 740, hit: { x: 370, y: 540, w: 110, h: 70 }, badgeAt: { x: 420, y: 528 },
      fiddle: { icon: '🩷', label: 'Hug the pillow', snd: 'soft', pose: 'hug', fx: 'hearts', fxAt: { x: 420, y: 560 },
        says: ['Fluff fluff! All puffy.', 'Squish! My favourite pillow.'] } },
    teddy: { name: 'Teddy', x: 760, y: 790, hit: { x: 710, y: 700, w: 100, h: 110 }, badgeAt: { x: 760, y: 690 },
      fiddle: { icon: '🧸', label: 'Hug Teddy', snd: 'heart', pose: 'hug', fx: 'hearts', fxAt: { x: 760, y: 720 },
        says: ['Teddy is back on the floor to play.', 'Teddy is tucked into bed. Night night!'] } },
    slippers: { name: 'Slippers', x: 980, y: 820, hit: { x: 930, y: 780, w: 110, h: 60 }, badgeAt: { x: 980, y: 775 },
      fiddle: { icon: '🩴', label: 'Shuffle in the slippers', snd: 'step', pose: 'dance',
        says: ['Slippers lined up neatly.', 'Shuffle shuffle shuffle!'] } },
    laundry: { name: 'Laundry basket', x: 1270, y: 790, hit: { x: 1215, y: 680, w: 115, h: 120 }, badgeAt: { x: 1270, y: 670 },
      fiddle: { icon: '🧺', label: 'Put clothes in', loop: false, snd: 'soft', pose: 'celebrate',
        says: ['The basket is empty.', 'In they go! So tidy.', 'All the washing is in!'] } },
    nightlight: { name: 'Night-light', x: 1240, y: 700, hit: { x: 1200, y: 390, w: 80, h: 90 }, badgeAt: { x: 1240, y: 385 },
      fiddle: { icon: '✨', label: 'Turn on the stars', snd: 'sparkle', pose: 'think', fx: 'sparkle', fxAt: { x: 1240, y: 420 },
        says: ['Stars off.', 'Look! Stars on the ceiling!'] } },
  },
  family: { mom: { x: 940, y: 760, facing: -1, acts: ['hug_mom', 'bedtime_story'] }, dad: { x: 1300, y: 770, facing: -1 } },
  draw(g) {
    if (Rewards.unlocked('decor', 'rainbowrug')) Props.rug(g, 900, 780, 260, 60, '#ffd6a8', { stripes: true });
    else Props.rug(g, 900, 780, 220, 55, '#c9d6ff');
    Props.bedBack(g, 560, 660, 480, '#b9a4ff');
    Props.wardrobe(g, 1080, 620, 220, 340, '#ffd0a8');
    Props.bookshelf(g, 1380, 620, 180, 240, { toys: true, seed: 6 });
    Props.picture(g, 520, 150, 110, 80, { kind: 'hammy', frame: '#ffb3cf' });
  },
  drawDyn(ctx) {
    Props.window(ctx, 140, 110, 200, 170, { curtain: '#a9b8ff', seed: 21, open: this.fid('blinds') === 1 });
    Props.nightstand(ctx, 880, 620, 1, '#ffd0a8', this.fid('bedlamp') === 1);
    // The night-light, and the stars it throws on the ceiling.
    box(ctx, 1222, 430, 36, 44, 10, this.fid('nightlight') === 1 ? '#fff3a0' : '#e8e2f2', { lw: 2.5 });
    if (this.fid('nightlight') === 1) {
      Sky.glow(ctx, 1240, 450, 150, '#fff3a0', 0.5);
      for (let i = 0; i < 7; i++) {
        const sx = 180 + i * 190, sy = 90 + (i % 3) * 60;
        drawStar(ctx, sx, sy, 11 + Math.sin(Game.time * 2 + i) * 3, '#fff3a0');
      }
    }
    if (Rewards.unlocked('decor', 'starlamp')) {
      drawStar(ctx, 880, 470, 22 + Math.sin(Game.time * 2) * 2, '#fff3a0');
    }
    if (Rewards.unlocked('decor', 'mobile')) {
      for (let i = 0; i < 4; i++) {
        const a = Game.time * 0.6 + i * Math.PI / 2, mx = 560 + Math.cos(a) * 60, my = 300 + Math.sin(a) * 10;
        ctx.strokeStyle = '#a9a2b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(560, 230);
        ctx.lineTo(mx, my - 20);
        ctx.stroke();
        drawStar(ctx, mx, my, 14, PARTY[i]);
      }
    }
  },
  props: [
    { y: 650, draw(ctx) { Props.bedBlanket(ctx, 560, 660, 480, '#ffc6dc', { pulled: this.inline && ['sleep', 'nap', 'rest'].includes(this.inline.kind) ? 0 : this.fid('blanket') === 1 ? 0.85 : 0.15 }); } },
    { y: 648, draw(ctx) { Props.pillow(ctx, 430, 578, 1.15, '#fff1f6', this.ham.pose === 'hug' ? 1 : 0); } },
    // Teddy waits on the floor until he is tucked in.
    { y: 792, draw(ctx) { if (this.fid('teddy') === 0) Props.teddy(ctx, 760, 790, 0.85); } },
    // Tucked in: drawn after the blanket, so he peeks out over the top of it.
    { y: 655, draw(ctx) { if (this.fid('teddy') === 1) Props.teddy(ctx, 660, 600, 0.68); } },
    { y: 820, draw(ctx) { Props.slippers(ctx, 980, 820, 1, '#ffb3cf', this.fid('slippers') === 1 ? 1 : 0); } },
    { y: 790, draw(ctx) { Props.basket(ctx, 1270, 790, 0.95, { full: this.fid('laundry') }); } },
  ],
  lights() {
    const out = [];
    if (this.fid('bedlamp') === 1) out.push([880, 450, 260, '#ffe9a8', Rewards.unlocked('decor', 'starlamp') ? 1.2 : 0.7]);
    if (this.fid('nightlight') === 1) out.push([1240, 450, 200, '#fff3a0', 0.5]);
    return out;
  },
});

room('bathroom', {
  shell: { wall: '#e4f6ff', accent: '#d3efff', pattern: 'checks', floor: 'tile', floorColor: '#cdeeff' },
  blocks: [{ x: 140, y: 560, w: 240, h: 60 }, { x: 470, y: 580, w: 380, h: 70 }, { x: 990, y: 570, w: 140, h: 50 }, { x: 1290, y: 570, w: 140, h: 60 }],
  spots: {
    shower: { name: 'Shower', x: 260, y: 690, hit: { x: 145, y: 240, w: 230, h: 380 }, acts: ['shower'] },
    bathtub: { name: 'Bathtub', x: 660, y: 720, hit: { x: 470, y: 470, w: 380, h: 180 }, acts: ['bath'] },
    // The tap is part of the sink, and the lid part of the potty: one badge
    // each, with the little job offered next to the big one.
    sink: { name: 'Sink', x: 1060, y: 690, hit: { x: 980, y: 300, w: 160, h: 320 }, acts: ['brush_teeth', 'wash_hands'], alwaysAsk: true,
      fiddle: { icon: '🚰', label: 'Turn the tap', snd: 'splash', pose: 'wash', fx: 'bubbles', fxAt: { x: 1060, y: 500 },
        says: ['Tap off. Not a drop wasted!', 'Splish splash! Warm water.'] } },
    toilet: { name: 'Potty', x: 1350, y: 700, hit: { x: 1280, y: 420, w: 150, h: 210 }, acts: ['toilet'],
      fiddle: { icon: '🚽', label: 'Lift the lid', snd: 'tap', pose: 'think',
        says: ['Lid down. All closed up.', 'Lid up, ready to go!'] } },
    showerCurtain: { name: 'Shower curtain', x: 400, y: 700, hit: { x: 330, y: 260, w: 70, h: 340 }, badgeAt: { x: 366, y: 250 },
      fiddle: { icon: '🚿', label: 'Pull the curtain', start: 1, snd: 'swish', pose: 'wave',
        says: ['Curtain closed. Peekaboo!', 'Curtain open!'] } },
    towel: { name: 'Towels', x: 560, y: 700, hit: { x: 455, y: 175, w: 215, h: 130 }, badgeAt: { x: 562, y: 165 },
      fiddle: { icon: '🧻', label: 'Take a towel', snd: 'soft', pose: 'wash',
        says: ['Towel back on the rail. Tidy!', 'Rub rub! All dry and fluffy.'] } },
    duck: { name: 'Rubber duck', x: 760, y: 760, hit: { x: 728, y: 455, w: 64, h: 62 }, badgeAt: { x: 760, y: 440 },
      fiddle: { icon: '🦆', label: 'Squeak the duck', snd: 'pop', pose: 'celebrate', fx: 'bubbles', fxAt: { x: 760, y: 470 },
        says: ['Back in the bath, little duck!', 'Squeak squeak! Hello, duck!'],
        on(state) { this.carry = state === 1 ? '🦆' : null; } } },
    soap: { name: 'Soap', x: 900, y: 700, hit: { x: 872, y: 472, w: 56, h: 58 }, badgeAt: { x: 900, y: 458 },
      fiddle: { icon: '🧼', label: 'Pump the soap', snd: 'pop', pose: 'wash', fx: 'bubbles', fxAt: { x: 900, y: 520 },
        says: ['Bubbles everywhere!', 'Squirt! Soapy paws.'] } },
    paper: { name: 'Toilet paper', x: 1450, y: 700, hit: { x: 1424, y: 442, w: 56, h: 58 }, badgeAt: { x: 1452, y: 430 },
      fiddle: { icon: '🧻', label: 'Unroll a little', loop: false, snd: 'page', pose: 'play',
        says: ['A nice full roll.', 'Whirr! Just a little bit.', 'That is plenty! Tear.'] } },
    scales: { name: 'Scale', x: 900, y: 800, hit: { x: 850, y: 745, w: 100, h: 70 }, badgeAt: { x: 900, y: 738 },
      fiddle: { icon: '⭐', label: 'Hop on the scale', snd: 'ding', pose: 'celebrate', fx: 'sparkle', fxAt: { x: 900, y: 760 },
        says: ['Hop off again!', 'A big happy star! Hooray!'] } },
    mirrorSpot: { name: 'Mirror', x: 1060, y: 700, hit: { x: 985, y: 150, w: 150, h: 180 }, badgeAt: { x: 1060, y: 140 },
      fiddle: { icon: '🪞', label: 'Wave at the mirror', snd: 'sparkle', pose: 'wave', fx: 'sparkle', fxAt: { x: 1060, y: 250 },
        says: ['Hello, me! *wave wave*', 'Silly face! Bleeh!'] } },
  },
  family: { mom: { x: 860, y: 780, facing: 1 }, dad: { x: 1200, y: 790, facing: -1 } },
  draw(g) {
    Props.bathtub(g, 660, 650, 380, { bubbles: true });
    Props.mirror(g, 990, 160, 140, 170);
    Props.bathSink(g, 1060, 620, 1);
    Props.plant(g, 1500, 630, 0.7, { pot: '#a9dcff' });
  },
  drawDyn(ctx) {
    Props.shower(ctx, 260, 620, 1, { open: this.fid('showerCurtain') === 1 ? 1 : 0.06 });
    // One towel goes missing from the rail while it is being used.
    Props.towels(ctx, 470, 190, this.fid('towel') === 1 ? ['#ffb3cf', '#a9dcff'] : ['#ffb3cf', '#a9dcff', '#ffe48a']);
    if (this.fid('duck') === 0) drawEmoji(ctx, '🦆', 760, 488, 50);
    drawEmoji(ctx, '🧴', 900, 500, 44);
    Props.toilet(ctx, 1350, 630, 1, { lid: this.fid('toilet') === 1 });
    // The roll, with as much paper hanging off it as has been unrolled.
    drawEmoji(ctx, '🧻', 1450, 470, 40);
    const un = this.fid('paper');
    if (un) box(ctx, 1436, 488, 28, 40 + un * 46, 6, '#ffffff', { lw: 2 });
    Props.scale(ctx, 900, 800, 1, { on: this.fid('scales') === 1 });
    // Water from the tap, and a reflection while Hammy is close enough to see.
    if (this.fid('sink') === 1) {
      ctx.strokeStyle = 'rgba(140,200,255,.75)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(1060, 492);
      ctx.lineTo(1060 + Math.sin(Game.time * 9) * 3, 524);
      ctx.stroke();
      if (Math.random() < 0.25) FX.bubbles(1060, 520, 1, 16);
    }
    if (dist(this.ham.x, this.ham.y, 1060, 700) < 260) {
      ctx.save();
      ellipse(ctx, 1060, 245, 68, 83);
      ctx.clip();
      ctx.globalAlpha = 0.75;
      drawHamster(ctx, 1060, 330, 150, { pose: this.ham.pose === 'wave' ? 'wave' : 'idle', facing: -this.ham.facing, mood: Mood.current(), fx: false, shadow: false });
      ctx.restore();
    }
  },
  lights: () => [[1060, 230, 260, '#e9f6ff', 0.6]],
});

room('playroom', {
  shell: { wall: '#ffeaf3', accent: '#ffd6e8', pattern: 'stars', floor: 'carpet', floorColor: '#d8f2c8' },
  blocks: [{ x: 120, y: 560, w: 260, h: 80 }, { x: 1310, y: 560, w: 200, h: 70 }],
  back: 'house',
  spots: {
    toybox: { name: 'Toy box', x: 260, y: 700, hit: { x: 150, y: 470, w: 230, h: 170 }, acts: ['organize_toys'] },
    blocks: { name: 'Block corner', x: 560, y: 720, hit: { x: 470, y: 480, w: 190, h: 200 }, acts: ['build_tower'] },
    puzzle: { name: 'Puzzle table', x: 1120, y: 700, hit: { x: 1000, y: 520, w: 240, h: 130 }, acts: ['puzzle'] },
    train: { name: 'Toy train', x: 820, y: 690, hit: { x: 660, y: 720, w: 330, h: 140 }, acts: ['play_train'], badgeAt: { x: 820, y: 700 } },
    teddy: { name: 'Teddy tea party', x: 1380, y: 720, hit: { x: 1300, y: 470, w: 200, h: 180 }, acts: ['tea_party'] },
    drum: { name: 'Toy drum', x: 660, y: 830, hit: { x: 608, y: 740, w: 104, h: 100 }, badgeAt: { x: 660, y: 730 },
      fiddle: { icon: '🥁', label: 'Bang the drum', snd: 'thud', pose: 'dance', fx: 'sparkle', fxAt: { x: 660, y: 770 },
        says: ['Boom boom boom!', 'Rat-a-tat-tat!'] } },
    xylo: { name: 'Xylophone', x: 470, y: 780, hit: { x: 400, y: 722, w: 140, h: 70 }, badgeAt: { x: 470, y: 714 },
      fiddle: { icon: '🎶', label: 'Play the bars', snd: 'ding', pose: 'play', fx: 'sparkle', fxAt: { x: 430, y: 780 },
        says: ['Ting ting ting! Going up!', 'Tong tong tong! Going down!'] } },
    ball: { name: 'Ball', x: 930, y: 830, hit: { x: 890, y: 778, w: 84, h: 84 }, badgeAt: { x: 932, y: 772 },
      fiddle: { icon: '⚽', label: 'Kick the ball', snd: 'bounce', pose: 'jump',
        says: ['Bounce bounce! Over here!', 'Kick! Off it rolls!'] } },
    chalk: { name: 'Chalkboard', x: 1010, y: 700, hit: { x: 950, y: 150, w: 170, h: 130 }, badgeAt: { x: 1035, y: 140 },
      fiddle: { icon: '🖍️', label: 'Draw on the board', snd: 'page', pose: 'play',
        says: ['All wiped clean!', 'Look what I drew!'] } },
    horse: { name: 'Rocking horse', x: 1170, y: 800, hit: { x: 1100, y: 700, w: 140, h: 120 }, badgeAt: { x: 1170, y: 692 },
      fiddle: { icon: '🐴', label: 'Rock the horse', snd: 'boing', pose: 'celebrate',
        says: ['Whoa there! Steady now.', 'Rock rock rock! Yeehaw!'] } },
  },
  family: { mom: { x: 1000, y: 800, facing: -1 }, dad: { x: 420, y: 800, facing: 1 } },
  draw(g) {
    Props.window(g, 700, 90, 220, 160, { curtain: '#ffb3cf', seed: 25 });
    Props.toyBox(g, 260, 640, 1.2, '#7cc6ff');
    Props.blockTower(g, 520, 650, 5, 52, 9);
    Props.blockTower(g, 600, 650, 3, 52, 4);
    Props.teddy(g, 1400, 650, 1.2, '#d9a066');
    drawEmoji(g, '🫖', 1310, 620, 50);
    Props.picture(g, 1180, 140, 100, 80, { kind: 'heart', frame: '#7cc6ff' });
    drawEmoji(g, '🪁', 420, 180, 80, { rot: -0.3 });
    if (Rewards.unlocked('toy', 'robot')) drawEmoji(g, '🤖', 980, 610, 70);
    if (Rewards.unlocked('toy', 'rocket')) drawEmoji(g, '🚀', 1240, 380, 80, { rot: -0.5 });
  },
  drawDyn(ctx) {
    Props.window(ctx, 700, 90, 220, 160, { curtain: '#ffb3cf', seed: 25 });
    const fast = this.inline?.kind === 'train';
    Props.trainTrack(ctx, 820, 790, 160, 44, Game.time * (fast ? 2.2 : 0.6));
    Props.blackboard(ctx, 950, 150, 170, 130, this.fid('chalk') === 1 ? (g, x, y, w, h) => {
      drawEmoji(g, '🏠', x + w * 0.3, y + h * 0.55, 56);
      drawEmoji(g, '☀️', x + w * 0.72, y + h * 0.32, 40);
      g.strokeStyle = '#d9f2e4';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x + 14, y + h - 18);
      g.lineTo(x + w - 14, y + h - 18);
      g.stroke();
    } : null);
  },
  props: [
    { y: 650, draw(ctx) { Props.coffeeTable(ctx, 1120, 660, 240, '#ffd27a'); for (let i = 0; i < 4; i++) box(ctx, 1040 + i * 42, 570, 38, 26, 5, PARTY[i], { lw: 2 }); } },
    { y: 830, draw(ctx) { Props.drum(ctx, 660, 830, 1, this.ham.pose === 'dance' ? 0.5 + Math.sin(Game.time * 12) * 0.5 : 0); } },
    { y: 782, draw(ctx) { Props.xylophone(ctx, 470, 782, 1, this.ham.pose === 'play' ? Math.floor(Game.time * 6) % 6 : -1); } },
    // The ball rolls to the other side of the room when it is kicked.
    { y: 824, draw(ctx) { Props.beachBall(ctx, this.fid('ball') === 1 ? 1030 : 930, 822, 40, Game.time * (this.fid('ball') === 1 ? 2 : 0.4)); } },
    { y: 802, draw(ctx) { Props.rockingHorse(ctx, 1170, 802, 1, this.ham.pose === 'celebrate' ? Game.time * 7 : 0); } },
  ],
  lights: () => [[810, 300, 300, '#ffe9a8', 0.5]],
});

// --------------------------------------------------------- house overview

// The next room along in the dollhouse: left and right along a floor, up and
// down a floor in the same column, with the playroom up in the attic.
function houseNeighbour(id, dx, dfloor) {
  if (id === 'playroom') return dfloor < 0 ? FLOORS[FLOORS.length - 1][1] : null;
  const f = FLOORS.findIndex(fl => fl.includes(id));
  if (f < 0) return null;
  const i = FLOORS[f].indexOf(id);
  if (dx) return FLOORS[f][i + dx] || null;
  if (dfloor > 0) return FLOORS[f + 1]?.[i] || (f === FLOORS.length - 1 ? 'playroom' : null);
  if (dfloor < 0) return FLOORS[f - 1]?.[i] || null;
  return null;
}

defineScene('house', {
  back: 'map',
  sim: true,
  walkable: true,

  enter(params = {}) {
    Music.play(Clock.isNight() ? 'night' : 'home');
    S.scene = 'house';
    const from = params.from?.startsWith?.('room:') ? params.from.slice(5) : S.houseRoom || 'living';
    this.room = HOUSE_ROOMS[from] ? from : 'living';
    const r = roomRect(this.room);
    this.ham = { x: r.x + r.w / 2, y: roomFloorY(this.room), facing: 1 };
    this.walk = null;
    this.hover = null;
    if (!S.seen.house) {
      S.seen.house = true;
      setTimeout(() => { Rewards.addStars(1, { x: 800, y: 400 }); UI.toast('🧭 New place: Main House! +1 ⭐'); UI.flushRewards(); }, 700);
    }
    if (params.walkTo) this.goRoom(params.walkTo);
  },

  exit() { S.houseRoom = this.room; },

  hammyPos() { return { x: this.ham.x, y: this.ham.y - 40 }; },

  // Walk through the house (via the stairs) to a room. Tapping a room goes
  // inside on arrival; strolling with the arrows or a stick stays out here.
  goRoom(id, enter = true) {
    if (!HOUSE_ROOMS[id]) return;
    const fromY = this.ham.y, toY = roomFloorY(id), r = roomRect(id), pts = [];
    if (Math.abs(fromY - toY) > 2) {
      pts.push([STAIRS_X, fromY], [STAIRS_X, toY]);
    }
    pts.push([r.x + r.w / 2, toY]);
    this.walk = { pts, to: id, enter };
    Snd.whoosh();
  },

  update(dt) {
    const h = this.ham;
    // Arrows, the on-screen pad or a controller stick stroll Hammy from room
    // to room: one room per push, and a push during a stroll carries on from
    // wherever that stroll was heading.
    const [dx, dy] = Input.dir();
    const push = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
    this.navT = push ? Math.max(0, (this.navT || 0) - dt) : 0;
    if (push && !this.navT && !this.walk?.enter) {
      this.navT = 0.3;
      const sideways = Math.abs(dx) > Math.abs(dy);
      const id = houseNeighbour(this.walk?.to || this.room, sideways ? Math.sign(dx) : 0, sideways ? 0 : -Math.sign(dy));
      if (id) this.goRoom(id, false);
      else Snd.hmm();
    }
    const w = this.walk;
    if (!w) return;
    let step = (w.enter ? 520 : 1000) * dt;
    while (step > 0 && w.pts.length) {
      const [tx, ty] = w.pts[0], d = dist(h.x, h.y, tx, ty);
      if (d <= step) {
        h.x = tx;
        h.y = ty;
        step -= d;
        w.pts.shift();
      } else {
        if (Math.abs(tx - h.x) > 1) h.facing = Math.sign(tx - h.x);
        h.x += (tx - h.x) / d * step;
        h.y += (ty - h.y) / d * step;
        step = 0;
      }
    }
    if (!w.pts.length) {
      this.walk = null;
      this.room = w.to;
      S.houseRoom = w.to;
      if (w.enter) Game.go(`room:${w.to}`, {}, { zoom: roomRect(w.to) });
      else Snd.tap();
    }
  },

  draw(ctx) {
    Sky.draw(ctx, 0, 0, W, H, { seed: 31, clouds: 4, sunX: 0.93, scale: 0.55 });
    ctx.fillStyle = grassPattern(ctx);
    ctx.fillRect(0, 852, W, 60);
    Art.bush(ctx, 120, 870, 1, { flowers: '#ff9ec4', seed: 1 });
    Art.bush(ctx, 1500, 870, 1, { flowers: '#ffd43b', seed: 2 });
    Art.tree(ctx, 70, 860, 0.9, { seed: 4 });
    Art.tree(ctx, 1540, 860, 0.85, { kind: 'blossom', seed: 6 });
    // House frame and roof.
    groundShadow(ctx, 810, 860, 680, 26);
    box(ctx, 170, 220, 1280, 640, 18, '#ffe7d6', { lw: 5, line: '#d9a98a' });
    ctx.beginPath();
    ctx.moveTo(130, 232);
    ctx.lineTo(810, 22);
    ctx.lineTo(1490, 232);
    ctx.closePath();
    paint(ctx, '#b69cff', 22, 232, { lw: 5 });
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 9; i++) ctx.fillRect(130, 60 + i * 22, 1400, 6);
    ctx.restore();
    // Rooms
    for (const id of Object.keys(HOUSE_ROOMS)) this.drawRoom(ctx, id);
    // Floors between rooms
    for (const y of [432, 642, 852]) box(ctx, 176, y, 1268, 8, 3, '#d9a98a', { lw: 0 });
    // Stairs tower on the right.
    box(ctx, 1294, 226, 140, 626, 10, '#ffd9c2', { lw: 3 });
    for (let i = 0; i < 18; i++) {
      const sy = 830 - i * 34, sx = 1300 + (i % 6) * 20;
      box(ctx, sx, sy, 50, 12, 4, '#e0b07c', { lw: 2 });
    }
    drawText(ctx, '🪜', STAIRS_X, 250, 34);
    // Front door to the outside.
    Props.door(ctx, 1314, 700, 96, 150, '#ff9ec4');
    box(ctx, 1302, 662, 120, 34, 17, '#ffffff', { lw: 2.5 });
    drawText(ctx, '🗺️ Outside', 1362, 680, 19);
    // Tiny Hammy walking through the house.
    const pose = this.walk ? (Math.abs(this.ham.x - STAIRS_X) < 2 ? 'jump' : 'walk') : 'idle';
    drawHamster(ctx, this.ham.x, this.ham.y, 64, { pose, facing: this.ham.facing, mood: Mood.current(), fx: false });
    Sky.overlay(ctx, { indoor: true });
    for (const id of Object.keys(HOUSE_ROOMS)) {
      const r = roomRect(id);
      if (Clock.light().night > 0.3) Sky.glow(ctx, r.x + r.w / 2, r.y + r.h / 2, 180, '#ffe9a8', 0.4);
    }
    // Labels on top of the tint.
    for (const id of Object.keys(HOUSE_ROOMS)) {
      const keyish = Input.lastDevice === 'key' || Input.lastDevice === 'pad';
      const r = roomRect(id), wish = Wishes.list().find(x => x.act.where === `room:${id}`);
      // With arrows or a controller the room Hammy is in carries the ring, so
      // it is plain which one Enter opens.
      const hover = this.hover === id || (keyish && !this.walk && this.room === id);
      const label = `${ROOMS[id].icon} ${ROOMS[id].name}`;
      ctx.font = `700 21px ${FONT}`;
      const lw = ctx.measureText(label).width + 28;
      box(ctx, r.x + r.w / 2 - lw / 2, r.y + 8, lw, 34, 17, hover ? '#fff3b8' : '#ffffff', { lw: 2 });
      drawText(ctx, label, r.x + r.w / 2, r.y + 26, 21);
      if (wish) {
        const bx = r.x + r.w - 30, by = r.y + 56 + Math.sin(Game.time * 3) * 4;
        circle(ctx, bx, by, 24);
        ctx.fillStyle = '#fff3b8';
        ctx.fill();
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 3;
        ctx.stroke();
        drawEmoji(ctx, wish.act.icon, bx, by, 32);
      }
      if (hover) {
        rr(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 12);
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    }
    if (this.walk) {
      box(ctx, W / 2 - 230, H - 66, 460, 54, 27, '#ffffff', { lw: 0 });
      drawText(ctx, `🐾 Going to the ${ROOMS[this.walk.to].name}…`, W / 2, H - 39, 26);
    } else if (Input.lastDevice === 'key' || Input.lastDevice === 'pad') {
      box(ctx, W / 2 - 250, H - 66, 500, 54, 27, '#ffffff', { lw: 0 });
      drawText(ctx, '⬅️➡️⬆️⬇️ Move room to room · Enter to go in', W / 2, H - 39, 24);
    }
  },

  // A room as a thumbnail of its full-size scene, plus Mom / Dad if there.
  drawRoom(ctx, id) {
    const r = roomRect(id), sc = Scenes[`room:${id}`], s = r.h / H, tw = W * s;
    ctx.save();
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.clip();
    ctx.fillStyle = '#fff3e8';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    const tx = r.x + (r.w - tw) / 2;
    ctx.drawImage(Cache.get(`thumb:${id}`, W, H, g => sc.drawBack(g), s), tx, r.y, tw, r.h);
    for (const who of ['mom', 'dad']) {
      if (Family.where(who) === `room:${id}` && sc.family?.[who]) {
        const p = sc.family[who];
        drawHamster(ctx, tx + p.x * s, r.y + p.y * s, 150 * FAMILY[who].h * s, { kind: who, mood: 'happy', fx: false });
      }
    }
    ctx.restore();
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.strokeStyle = '#d9a98a';
    ctx.lineWidth = 4;
    ctx.stroke();
  },

  roomAt(p) {
    return Object.keys(HOUSE_ROOMS).find(id => { const r = roomRect(id); return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }) || null;
  },

  pointerMove(p) {
    this.hover = this.roomAt(p);
    Game.canvasCursor(this.hover || this.doorAt(p) ? 'pointer' : '');
  },

  doorAt(p) { return p.x > 1300 && p.x < 1430 && p.y > 660 && p.y < 852; },

  pointerDown(p) {
    if (this.walk) return;
    if (this.doorAt(p)) {
      Game.go('map', { from: 'house' });
      return;
    }
    const id = this.roomAt(p);
    if (!id) return;
    Activity.current && Activity.cancel();
    Speech.say(ROOMS[id].name);
    if (id === this.room) Game.go(`room:${id}`, {}, { zoom: roomRect(id) });
    else this.goRoom(id);
  },

  key(e) {
    if (e.code === 'Enter' && !this.walk) Game.go(`room:${this.room}`, {}, { zoom: roomRect(this.room) });
    return true;
  },
});
