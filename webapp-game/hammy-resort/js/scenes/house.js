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
  const doors = [], entries = {};
  if (floor[i - 1]) {
    doors.push({ x: 0, y: 580, w: 46, h: 300, to: `room:${floor[i - 1]}` });
    entries[`room:${floor[i - 1]}`] = { x: 110, y: 760 };
  }
  if (floor[i + 1]) {
    doors.push({ x: W - 46, y: 580, w: 46, h: 300, to: `room:${floor[i + 1]}` });
    entries[`room:${floor[i + 1]}`] = { x: W - 110, y: 760 };
  }
  const blocks = def.blocks || [];
  const scene = makeLocation({
    id: `room:${id}`, title: ROOMS[id].name, back: 'house', music: 'home', outdoor: false,
    walk: [{ x: doors.some(d => d.x === 0) ? 0 : 70, y: 610, w: W - (doors.length === 2 ? 0 : doors.some(d => d.x === 0) ? 70 : doors.length ? 70 : 140), h: 270 }],
    blocks, doors, entries, start: def.start || { x: W / 2, y: 780 },
    ...def,
    drawBack(g) {
      roomShell(g, def.shell);
      def.draw.call(this, g);
      for (const d of doors) Props.sideDoor(g, d.x === 0 ? -1 : 1, ROOMS[d.to.slice(5)].icon);
    },
  });
  if (!doors.some(d => d.x === 0)) scene.walk[0].x = 70;
  if (!doors.some(d => d.x > 0)) scene.walk[0].w = W - scene.walk[0].x - 70;
  else scene.walk[0].w = W - scene.walk[0].x;
  return scene;
}

// ----------------------------------------------------------------- rooms

room('kitchen', {
  shell: { wall: '#e6f8ef', accent: '#d4f1e2', pattern: 'stripes', floor: 'tile', floorColor: '#ffe3ec' },
  blocks: [{ x: 120, y: 560, w: 1000, h: 60 }, { x: 1110, y: 690, w: 300, h: 60 }],
  spots: {
    sink: { name: 'Sink', x: 420, y: 670, hit: { x: 290, y: 400, w: 260, h: 200 }, acts: ['wash_dishes'] },
    stove: { name: 'Stove', x: 760, y: 670, hit: { x: 660, y: 340, w: 200, h: 260 }, acts: ['cook_mom'] },
    fridge: { name: 'Fridge', x: 1000, y: 680, hit: { x: 915, y: 270, w: 170, h: 340 }, acts: ['snack', 'breakfast', 'lunch'] },
    table: { name: 'Dining table', x: 1250, y: 800, hit: { x: 1080, y: 600, w: 340, h: 160 }, acts: ['breakfast', 'lunch', 'dinner', 'snack'], alwaysAsk: true },
  },
  family: { mom: { x: 860, y: 700, facing: -1, acts: ['hug_mom', 'cook_mom', 'play_mom'] }, dad: { x: 1460, y: 800, facing: -1 } },
  draw(g) {
    Props.wallCabinets(g, 120, 70, 500, 120, '#a8dcc8');
    Props.counter(g, 380, 610, 520, 150, '#a8dcc8');
    Props.sink(g, 420, 444, 140);
    box(g, 340, 435, 160, 20, 8, '#d8e4ee', { lw: 2 });
    drawEmoji(g, '🍯', 200, 430, 46);
    drawEmoji(g, '🍞', 560, 428, 52);
    Props.stove(g, 760, 605, 1);
    Props.fridge(g, 1000, 615, 1);
    Props.window(g, 1150, 110, 230, 170, { curtain: '#ffd6e5', seed: 3 });
    Props.wallClock(g, 720, 130, 44);
    Props.plant(g, 1480, 610, 0.9, { pot: '#ffb3cf' });
    for (const [px, c] of [[230, '#ffb3cf'], [290, '#ffe48a'], [350, '#bfe6ff']]) box(g, px, 210, 44, 54, 10, c, { lw: 2 });
  },
  props: [{ y: 760, draw(ctx) { Props.chair(ctx, 1095, 790, 1, '#ffd27a', -1); Props.chair(ctx, 1410, 790, 1, '#ffd27a', 1); Props.table(ctx, 1250, 760, 320, 130, { cloth: '#ffd6e5' }); drawEmoji(ctx, '🍎', 1200, 610, 44); drawEmoji(ctx, '🌷', 1300, 600, 50); } }],
  drawDyn(ctx) {
    Props.window(ctx, 1150, 110, 230, 170, { curtain: '#ffd6e5', seed: 3 });
    Props.wallClock(ctx, 720, 130, 44);
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
  },
  family: { dad: { x: 1250, y: 720, facing: -1, acts: ['hug_dad', 'play_dad', 'read_together'] }, mom: { x: 1400, y: 760, facing: -1, acts: ['hug_mom', 'play_mom'] } },
  draw(g) {
    Props.rug(g, 760, 780, 240, 60, '#ffc6dc');
    Props.tv(g, 380, 620, 300, 180);
    Props.window(g, 900, 110, 200, 160, { curtain: '#b9a4ff', seed: 5 });
    Props.sofa(g, 1000, 640, 380, '#b9a4ff');
    Props.picture(g, 600, 150, 90, 70, { kind: 'family' });
    Props.picture(g, 710, 210, 80, 100, { kind: 'flower', frame: '#ffb3cf' });
    Props.picture(g, 600, 250, 90, 70, { kind: 'hammy', frame: '#b9a4ff' });
    Props.bookshelf(g, 1360, 620, 220, 300, { seed: 7 });
    Props.floorLamp(g, 1210, 620, 1, '#ffe48a');
    Props.plant(g, 120, 620, 1.1);
    Props.wallClock(g, 1360, 130, 40);
  },
  drawDyn(ctx) {
    Props.window(ctx, 900, 110, 200, 160, { curtain: '#b9a4ff', seed: 5 });
    Props.wallClock(ctx, 1360, 130, 40);
    const inl = this.inline;
    if (inl?.kind === 'tv') Props.tv(ctx, 380, 620, 300, 180, { on: true, show: (c, x, y, w, h) => tvShow(c, x, y, w, h, inl.channel) });
  },
  props: [{ y: 730, draw(ctx) { Props.coffeeTable(ctx, 520, 760, 180, '#e0b07c'); drawEmoji(ctx, '🍪', 500, 685, 40); } }],
  lights: () => [[1210, 380, 300, '#ffe9a8', 0.8], [380, 520, 260, '#bfe6ff', 0.3]],
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
    Props.floorLamp(g, 260, 620, 0.95, '#ffb3cf');
  },
  drawDyn(ctx) { Props.window(ctx, 1000, 110, 220, 170, { curtain: '#ffe48a', seed: 9 }); },
  props: [{
    y: 760, draw(ctx) {
      Props.coffeeTable(ctx, 1100, 770, 260, '#e0b07c');
      box(ctx, 1010, 680, 180, 30, 8, '#7ed99a', { lw: 2.5 });
      for (let i = 0; i < 6; i++) { ctx.fillStyle = PARTY[i]; circle(ctx, 1030 + i * 28, 695, 7); ctx.fill(); }
      drawEmoji(ctx, '🎲', 1215, 680, 34);
    },
  }],
  lights: () => [[260, 380, 300, '#ffc6dc', 0.8]],
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
  },
  family: { mom: { x: 940, y: 760, facing: -1, acts: ['hug_mom', 'bedtime_story'] }, dad: { x: 1300, y: 770, facing: -1 } },
  draw(g) {
    Props.window(g, 140, 110, 200, 170, { curtain: '#a9b8ff', seed: 21 });
    if (Rewards.unlocked('decor', 'rainbowrug')) Props.rug(g, 900, 780, 260, 60, '#ffd6a8', { stripes: true });
    else Props.rug(g, 900, 780, 220, 55, '#c9d6ff');
    Props.bedBack(g, 560, 660, 480, '#b9a4ff');
    Props.nightstand(g, 880, 620, 1, '#ffd0a8');
    Props.wardrobe(g, 1080, 620, 220, 340, '#ffd0a8');
    Props.bookshelf(g, 1380, 620, 180, 240, { toys: true, seed: 6 });
    Props.picture(g, 520, 150, 110, 80, { kind: 'hammy', frame: '#ffb3cf' });
  },
  drawDyn(ctx) {
    Props.window(ctx, 140, 110, 200, 170, { curtain: '#a9b8ff', seed: 21 });
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
  props: [{ y: 650, draw(ctx) { Props.bedBlanket(ctx, 560, 660, 480, '#ffc6dc', { pulled: this.inline && ['sleep', 'nap', 'rest'].includes(this.inline.kind) ? 0 : 0.15 }); } }],
  lights: () => [[880, 450, 260, '#ffe9a8', Rewards.unlocked('decor', 'starlamp') ? 1.2 : 0.7]],
});

room('bathroom', {
  shell: { wall: '#e4f6ff', accent: '#d3efff', pattern: 'checks', floor: 'tile', floorColor: '#cdeeff' },
  blocks: [{ x: 140, y: 560, w: 240, h: 60 }, { x: 470, y: 580, w: 380, h: 70 }, { x: 990, y: 570, w: 140, h: 50 }, { x: 1290, y: 570, w: 140, h: 60 }],
  spots: {
    shower: { name: 'Shower', x: 260, y: 690, hit: { x: 145, y: 240, w: 230, h: 380 }, acts: ['shower'] },
    bathtub: { name: 'Bathtub', x: 660, y: 720, hit: { x: 470, y: 470, w: 380, h: 180 }, acts: ['bath'] },
    sink: { name: 'Sink', x: 1060, y: 690, hit: { x: 980, y: 300, w: 160, h: 320 }, acts: ['brush_teeth', 'wash_hands'], alwaysAsk: true },
    toilet: { name: 'Potty', x: 1350, y: 700, hit: { x: 1280, y: 420, w: 150, h: 210 }, acts: ['toilet'] },
  },
  family: { mom: { x: 860, y: 780, facing: 1 }, dad: { x: 1200, y: 790, facing: -1 } },
  draw(g) {
    Props.shower(g, 260, 620, 1, { open: 1 });
    Props.towels(g, 470, 190);
    Props.bathtub(g, 660, 650, 380, { bubbles: true });
    drawEmoji(g, '🦆', 760, 488, 50);
    Props.mirror(g, 990, 160, 140, 170);
    Props.bathSink(g, 1060, 620, 1);
    Props.toilet(g, 1350, 630, 1);
    Props.plant(g, 1500, 630, 0.7, { pot: '#a9dcff' });
    drawEmoji(g, '🧴', 900, 500, 44);
    drawEmoji(g, '🧻', 1450, 470, 40);
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
  },
  props: [{ y: 650, draw(ctx) { Props.coffeeTable(ctx, 1120, 660, 240, '#ffd27a'); for (let i = 0; i < 4; i++) box(ctx, 1040 + i * 42, 570, 38, 26, 5, PARTY[i], { lw: 2 }); } }],
  lights: () => [[810, 300, 300, '#ffe9a8', 0.5]],
});

// --------------------------------------------------------- house overview

defineScene('house', {
  back: 'map',
  sim: true,

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

  // Walk through the house (via the stairs) to a room, then go inside.
  goRoom(id) {
    if (!HOUSE_ROOMS[id]) return;
    const fromY = roomFloorY(this.room), toY = roomFloorY(id), r = roomRect(id), pts = [];
    if (Math.abs(fromY - toY) > 2) {
      pts.push([STAIRS_X, fromY], [STAIRS_X, toY]);
    }
    pts.push([r.x + r.w / 2, toY]);
    this.walk = { pts, to: id };
    Snd.whoosh();
  },

  update(dt) {
    const w = this.walk, h = this.ham;
    if (!w) return;
    let step = 520 * dt;
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
      Game.go(`room:${w.to}`, {}, { zoom: roomRect(w.to) });
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
      const r = roomRect(id), hover = this.hover === id, wish = Wishes.list().find(x => x.act.where === `room:${id}`);
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
