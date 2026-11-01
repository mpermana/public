// The outdoor destinations (and the Games Zone hall): pool, sports
// complex, playground, garden, barbecue area, games zone, friends village.

const HORIZON = 330;

// Distant hills, the tree line and the ground. Sky is drawn live behind it.
function outdoorBase(g, { ground = PAL.grass, seed = 1, treeLine = true } = {}) {
  g.fillStyle = '#c4ecaa';
  ellipse(g, 260, HORIZON + 40, 520, 120);
  g.fill();
  g.fillStyle = '#b4e49c';
  ellipse(g, 1300, HORIZON + 50, 640, 130);
  g.fill();
  if (treeLine) {
    const rnd = seeded(seed);
    for (let i = 0; i < 10; i++) Art.tree(g, i * 170 + rnd() * 80, HORIZON + 26, 0.42 + rnd() * 0.2, { seed: i + seed, kind: rnd() < 0.3 ? 'pine' : rnd() < 0.2 ? 'blossom' : 'round' });
  }
  g.fillStyle = grassPattern(g, ground);
  g.fillRect(0, HORIZON + 20, W, H);
  const gg = g.createLinearGradient(0, HORIZON + 20, 0, HORIZON + 160);
  gg.addColorStop(0, 'rgba(255,255,255,.3)');
  gg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gg;
  g.fillRect(0, HORIZON + 20, W, 140);
}

// ------------------------------------------------------------------- pool

makeLocation({
  id: 'pool', title: 'Swimming Pool', music: 'pool', outdoor: true,
  walk: [{ x: 40, y: 470, w: 1520, h: 410 }],
  blocks: [{ x: 170, y: 548, w: 930, h: 300 }, { x: 1350, y: 722, rx: 180, ry: 86 }, { x: 1040, y: 470, w: 160, h: 125 }, { x: 80, y: 470, w: 260, h: 60 }],
  start: { x: 1400, y: 560 },
  spots: {
    pool: { name: 'Big pool', x: 640, y: 868, hit: { x: 180, y: 560, w: 900, h: 270 }, acts: ['swim'], badgeAt: { x: 640, y: 560 } },
    kiddie: { name: 'Kiddie pool', x: 1350, y: 860, hit: { x: 1180, y: 650, w: 340, h: 150 }, acts: ['float_toys', 'splash'], alwaysAsk: true, badgeAt: { x: 1350, y: 640 }, sit: { x: 1350, y: 742, pose: 'swim', shadow: false } },
    slide: { name: 'Water slide', x: 1100, y: 618, hit: { x: 1060, y: 330, w: 240, h: 260 }, acts: ['pool_slide'],
      route: [[1095, 616, 'walk'], [1095, 372, 'jump'], [1125, 362, 'ride'], [1205, 402, 'ride'], [1245, 485, 'ride'], [1290, 580, 'ride'], [1350, 742, 'swim'], [1350, 742, 'swim']] },
    lounger: { name: 'Sun lounger', x: 700, y: 520, hit: { x: 600, y: 400, w: 200, h: 120 }, acts: ['relax_pool'], sit: { x: 690, y: 470, pose: 'sit' } },
  },
  family: { dad: { x: 1500, y: 600, facing: -1, acts: ['hug_dad', 'swim', 'pool_slide'] }, mom: { x: 1540, y: 760, facing: -1, acts: ['hug_mom', 'float_toys', 'splash'] } },
  drawBack(g) {
    outdoorBase(g, { seed: 3 });
    g.fillStyle = tilePattern(g, '#fff7ea', '#f6e9d4', 70);
    g.fillRect(0, 420, W, H);
    // Changing cabin and outdoor shower at the back.
    box(g, 90, 250, 230, 210, 16, '#ffffff', { lw: 3 });
    g.save();
    rr(g, 90, 250, 230, 210, 16);
    g.clip();
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#a9dcff' : '#ffffff'; g.fillRect(90 + i * 30, 250, 30, 210); }
    g.restore();
    rr(g, 90, 250, 230, 210, 16);
    g.strokeStyle = '#8bb8d8';
    g.lineWidth = 3;
    g.stroke();
    g.beginPath();
    g.moveTo(70, 260); g.lineTo(205, 200); g.lineTo(340, 260); g.closePath();
    paint(g, '#ff8fb8', 200, 260, { lw: 3 });
    drawText(g, '👕 Changing', 205, 300, 24);
    box(g, 380, 330, 12, 130, 4, '#a9b9c8', { lw: 2 });
    box(g, 360, 320, 52, 16, 8, '#a9b9c8', { lw: 2 });
    drawEmoji(g, '🚿', 420, 360, 40);
    for (const lx of [520, 880]) Props.lounger(g, lx + 180, 470, 1, '#7cc6ff');
    Props.umbrella(g, 610, 470, 0.9, ['#ff8fb8', '#ffffff']);
    Props.umbrella(g, 970, 470, 0.9, ['#ffd43b', '#ffffff']);
    // Pool edges (water is drawn live).
    box(g, 160, 540, 940, 310, 70, '#ffffff', { lw: 4, line: '#d8c8b0' });
    ellipse(g, 1350, 722, 182, 88);
    paint(g, '#ffffff', 634, 810, { lw: 4, line: '#d8c8b0' });
    // A friendly sign and the lifeguard chair where Mom or Dad sits.
    box(g, 1236, 380, 8, 90, 3, PAL.woodDark, { lw: 1.5 });
    box(g, 1150, 330, 180, 64, 14, '#ffffff', { lw: 3, line: '#7cc6ff' });
    drawText(g, '🛟 Swim with', 1240, 352, 20, { color: '#4a8ac0' });
    drawText(g, 'a grown-up!', 1240, 376, 20, { color: '#4a8ac0' });
    box(g, 1480, 360, 80, 16, 6, '#ff8fb8', { lw: 2 });
    for (const lx of [1484, 1546]) box(g, lx, 372, 10, 110, 3, '#ffffff', { lw: 2 });
  },
  drawDyn(ctx) {
    const t = Game.time;
    Art.water(ctx, 178, 558, 904, 274, 56);
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 4;
    ctx.setLineDash([22, 18]);
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(220, 558 + i * 68);
      ctx.lineTo(1040, 558 + i * 68);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.save();
    ellipse(ctx, 1350, 722, 166, 74);
    ctx.clip();
    Art.water(ctx, 1180, 646, 340, 152, 0, { color: '#8ad9f5' });
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      const fx = 1280 + i * 70, h = 50 + Math.sin(t * 3 + i) * 12;
      ctx.strokeStyle = 'rgba(200,240,255,.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(fx, 730);
      ctx.quadraticCurveTo(fx + 10, 730 - h * 1.6, fx + 22, 730);
      ctx.stroke();
    }
    if (this.inline?.kind !== 'splash' && Activity.current?.act.id !== 'float_toys') {
      Props.duck(ctx, 1290 + Math.sin(t * 0.5) * 40, 730, 0.8, { t });
      Props.floatRing(ctx, 1420, 720, 26, '#7ed99a', t);
    }
    Props.floatRing(ctx, 360 + Math.sin(t * 0.3) * 60, 650, 40, '#ff8fb8', t);
    Props.floatRing(ctx, 860, 760 + Math.sin(t * 0.4) * 10, 34, '#ffd43b', t + 1);
    Props.beachBall(ctx, 620 + Math.sin(t * 0.25) * 120, 620 + Math.sin(t) * 4, 26, t * 0.4);
    Props.duck(ctx, 980, 640, 0.9, { t, color: '#ffd43b' });
    Props.poolSlide(ctx, 1150, 600, 1);
  },
  lights: () => [[205, 300, 200, '#ffe9a8', 0.4]],
});

// ----------------------------------------------------------------- sports

makeLocation({
  id: 'sports', title: 'Sports Complex', music: 'outdoor', outdoor: true,
  walk: [{ x: 40, y: 470, w: 1520, h: 410 }],
  blocks: [{ x: 1180, y: 470, w: 100, h: 90 }],
  start: { x: 800, y: 860 },
  spots: {
    tennis: { name: 'Tennis court', x: 380, y: 850, hit: { x: 150, y: 560, w: 440, h: 260 }, acts: ['tennis'] },
    basketball: { name: 'Basketball court', x: 1230, y: 850, hit: { x: 1010, y: 470, w: 440, h: 350 }, acts: ['basketball', 'basketball_dad'], alwaysAsk: true },
    badminton: { name: 'Badminton court', x: 800, y: 740, hit: { x: 620, y: 520, w: 360, h: 180 }, acts: ['badminton'] },
    track: { name: 'Running track', x: 120, y: 700, hit: { x: 40, y: 560, w: 130, h: 220 }, acts: ['running'], badgeAt: { x: 105, y: 540 } },
  },
  family: { dad: { x: 900, y: 860, facing: -1, acts: ['hug_dad', 'basketball_dad'] }, mom: { x: 1500, y: 780, facing: -1 } },
  drawBack(g) {
    outdoorBase(g, { seed: 9, ground: '#9fd981' });
    // Stands at the back.
    for (const bx of [80, 1180]) {
      for (let r = 0; r < 3; r++) box(g, bx, 300 + r * 30, 340, 26, 6, ['#ff8fb8', '#ffd43b', '#7cc6ff'][r], { lw: 2.5 });
    }
    box(g, 660, 150, 280, 130, 18, '#5d5470', { lw: 4 });
    box(g, 790, 280, 20, 70, 4, '#8d84a3', { lw: 2 });
    // Track around the field.
    ellipse(g, 800, 690, 790, 220);
    paint(g, '#ff9a8a', 470, 910, { lw: 4, line: '#e0776a' });
    ellipse(g, 800, 690, 700, 168);
    g.fillStyle = grassPattern(g, '#8fd474');
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.8)';
    g.lineWidth = 3;
    for (const r of [745, 722]) { ellipse(g, 800, 690, r, r * 0.29); g.stroke(); }
    box(g, 60, 560, 14, 200, 4, '#ffffff', { lw: 2 });
    drawText(g, 'START', 120, 795, 22, { color: '#ffffff', stroke: '#e0776a' });
    // Courts in perspective.
    const court = (x1, x2, y1, y2, color, net) => {
      const k = 30;
      g.beginPath();
      g.moveTo(x1 + k, y1); g.lineTo(x2 - k, y1); g.lineTo(x2, y2); g.lineTo(x1, y2); g.closePath();
      paint(g, color, y1, y2, { lw: 3 });
      g.strokeStyle = 'rgba(255,255,255,.9)';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x1 + k + 12, y1 + 10); g.lineTo(x2 - k - 12, y1 + 10); g.lineTo(x2 - 14, y2 - 10); g.lineTo(x1 + 14, y2 - 10); g.closePath();
      g.moveTo((x1 + x2) / 2, y1 + 10); g.lineTo((x1 + x2) / 2, y2 - 10);
      g.stroke();
      if (net) {
        g.strokeStyle = '#ffffff';
        g.lineWidth = 2;
        const ny = (y1 + y2) / 2;
        for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x1 + 20, ny - 30 + i * 7); g.lineTo(x2 - 20, ny - 30 + i * 7); g.stroke(); }
        for (const px of [x1 + 20, x2 - 20]) box(g, px - 4, ny - 40, 8, 46, 3, '#8d84a3', { lw: 1.5 });
      }
    };
    court(150, 590, 580, 810, '#7ccf8e', true);
    court(640, 960, 540, 690, '#8cc8ff', true);
    court(1010, 1450, 580, 810, '#e8b07c', false);
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = 3;
    ellipse(g, 1230, 720, 70, 24);
    g.stroke();
    Props.hoop(g, 1230, 580, 0.5);
    for (let i = 0; i < 6; i++) Props.cone(g, 200 + i * 240, 880, 0.7, i % 2 ? '#ffd43b' : '#ff9f43');
  },
  drawDyn(ctx) {
    drawText(ctx, '🏅 SPORTS', 800, 190, 34, { color: '#ffe066' });
    drawText(ctx, Clock.label(), 800, 245, 30, { color: '#ffffff' });
    for (const fx of [400, 1200]) {
      ctx.fillStyle = '#ff8fb8';
      ctx.beginPath();
      ctx.moveTo(fx, 240);
      ctx.quadraticCurveTo(fx + 30, 245 + Math.sin(Game.time * 3) * 6, fx + 60, 255);
      ctx.lineTo(fx, 275);
      ctx.fill();
      box(ctx, fx - 3, 240, 6, 90, 3, '#8d84a3', { lw: 1 });
    }
  },
});

// ------------------------------------------------------------- playground

makeLocation({
  id: 'playground', title: 'Playground', music: 'outdoor', outdoor: true,
  walk: [{ x: 40, y: 470, w: 1520, h: 410 }],
  blocks: [{ x: 180, y: 470, w: 300, h: 170 }, { x: 600, y: 470, w: 330, h: 110 }, { x: 1070, y: 470, w: 230, h: 150 }, { x: 1300, y: 690, w: 260, h: 90 }, { x: 260, y: 760, w: 320, h: 120 }, { x: 660, y: 760, w: 280, h: 120 }, { x: 980, y: 760, w: 260, h: 70 }, { x: 1400, y: 490, w: 160, h: 80 }],
  start: { x: 800, y: 680 },
  spots: {
    slide: { name: 'Slide', x: 240, y: 680, hit: { x: 170, y: 370, w: 330, h: 270 }, acts: ['slide'],
      route: [[230, 676, 'walk'], [230, 400, 'jump'], [280, 380, 'ride'], [380, 410, 'ride'], [430, 520, 'ride'], [470, 600, 'ride'], [520, 640, 'celebrate']] },
    swings: { name: 'Swings', x: 760, y: 660, hit: { x: 600, y: 300, w: 330, h: 280 }, acts: ['swing'] },
    dome: { name: 'Climbing dome', x: 1180, y: 660, hit: { x: 1060, y: 450, w: 240, h: 170 }, acts: ['climb'],
      route: [[1070, 650, 'walk'], [1110, 540, 'jump'], [1180, 470, 'wave'], [1180, 470, 'wave'], [1250, 540, 'jump'], [1310, 650, 'walk']] },
    trampoline: { name: 'Trampoline', x: 1300, y: 830, hit: { x: 1300, y: 640, w: 260, h: 140 }, acts: ['trampoline'] },
    sandbox: { name: 'Sandbox', x: 420, y: 720, hit: { x: 260, y: 740, w: 320, h: 140 }, acts: ['sandcastle'], badgeAt: { x: 420, y: 740 } },
    ballpit: { name: 'Ball pit', x: 800, y: 720, hit: { x: 660, y: 740, w: 280, h: 140 }, acts: ['ball_pit'], badgeAt: { x: 800, y: 740 } },
    seesaw: { name: 'Seesaw', x: 1110, y: 860, hit: { x: 960, y: 720, w: 290, h: 120 }, acts: ['seesaw'], sit: { x: 970, y: 760, pose: 'ride', facing: 1 } },
    cars: { name: 'Toy cars', x: 1470, y: 620, hit: { x: 1390, y: 470, w: 170, h: 110 }, acts: ['toy_cars'] },
  },
  family: { dad: { x: 1250, y: 760, facing: -1, acts: ['hug_dad', 'seesaw'] }, mom: { x: 560, y: 700, facing: 1, acts: ['hug_mom', 'sandcastle'] } },
  inlineTick(inl) {
    if (inl.kind === 'seesaw') inl.place.y = 760 - Math.sin(inl.t * 3) * 42;
  },
  drawBack(g) {
    outdoorBase(g, { seed: 15 });
    ellipse(g, 800, 700, 790, 230);
    g.fillStyle = sandPattern(g);
    g.fill();
    g.strokeStyle = PAL.sandDark;
    g.lineWidth = 5;
    g.stroke();
    Props.playSlide(g, 330, 640, 1);
    Props.climbDome(g, 1180, 620, 0.85);
    Props.sandbox(g, 420, 880, 320, 130);
    Props.ballPit(g, 800, 880, 290, 130);
    Props.toyCar(g, 1470, 570, 0.9, '#ff6b6b', -1);
    Art.bench(g, 1480, 470, 0.8);
  },
  drawDyn(ctx) {
    const t = Game.time, inl = this.inline;
    Props.swingSet(ctx, 765, 580, 0.95, [Math.sin(t * 1.8) * 0.35, Math.sin(t * 1.8 + 2) * 0.3]);
    Props.trampoline(ctx, 1430, 780, 0.85, Math.max(0, Math.sin(t * 3)) * 0.5);
    const tilt = inl?.kind === 'seesaw' ? Math.sin(inl.t * 3) * 0.24 : Math.sin(t * 0.8) * 0.06;
    Props.seesaw(ctx, 1110, 830, 0.8, tilt);
    if (inl?.kind === 'seesaw') drawHamster(ctx, 1250, 760 + Math.sin(inl.t * 3) * 42, 200, { kind: 'dad', pose: 'ride', facing: -1, mood: 'happy' });
  },
});

// ----------------------------------------------------------------- garden

const CROPS = {
  carrot: { name: 'Carrots', icon: '🥕', grow: 180 },
  tomato: { name: 'Tomatoes', icon: '🍅', grow: 240 },
  strawberry: { name: 'Strawberries', icon: '🍓', grow: 200 },
  sunflower: { name: 'Sunflowers', icon: '🌻', grow: 300 },
  lettuce: { name: 'Lettuce', icon: '🥬', grow: 150 },
};
const PLOT_POS = [[340, 730], [500, 730], [660, 730], [340, 860], [500, 860], [660, 860]];

// Growth stage 0..4 from game time since planting (water speeds it up).
function cropStage(p) {
  if (!p.crop) return -1;
  const g = CROPS[p.crop].grow / (p.water ? 1.5 : 1), age = Clock.total() - p.planted;
  return clamp(Math.floor(age / g * 4), 0, 4);
}

makeLocation({
  id: 'garden', title: 'Garden', music: 'outdoor', outdoor: true,
  walk: [{ x: 40, y: 480, w: 1520, h: 400 }],
  blocks: [{ x: 250, y: 650, w: 490, h: 230 }, { x: 880, y: 780, w: 440, h: 100 }, { x: 1420, y: 730, rx: 140, ry: 60 }, { x: 800, y: 530, rx: 110, ry: 40 }],
  start: { x: 800, y: 640 },
  spots: {
    plots: { name: 'Veggie beds', x: 500, y: 600, hit: { x: 250, y: 640, w: 490, h: 240 }, acts: ['gardening', 'count_veg'], alwaysAsk: true, badgeAt: { x: 500, y: 630 } },
    trees: { name: 'Apple trees', x: 290, y: 520, hit: { x: 60, y: 180, w: 440, h: 300 }, acts: ['apples'] },
    flowers: { name: 'Flower beds', x: 1100, y: 740, hit: { x: 880, y: 760, w: 440, h: 120 }, acts: ['pick_flowers'], badgeAt: { x: 1000, y: 760 } },
    butterflies: { name: 'Butterfly garden', x: 1240, y: 650, hit: { x: 1150, y: 540, w: 210, h: 160 }, acts: ['butterflies'] },
    pond: { name: 'Fish pond', x: 1420, y: 640, hit: { x: 1280, y: 670, w: 280, h: 110 }, acts: ['fish'], sit: { x: 1400, y: 655, pose: 'sit' } },
  },
  family: { mom: { x: 860, y: 680, facing: -1, acts: ['hug_mom', 'gardening', 'pick_flowers'] }, dad: { x: 160, y: 760, facing: 1, acts: ['hug_dad', 'apples'] } },
  drawBack(g) {
    outdoorBase(g, { seed: 21, ground: '#a9e28c' });
    Art.path(g, [[0, 620], [400, 590], [800, 600], [1200, 620], [1600, 600]], 70);
    Props.shed(g, 1430, 470, 1);
    for (const [x, c, k] of [[930, '#ff6b6b', 'tulip'], [980, '#ffd43b', 'daisy'], [1030, '#b197fc', 'tulip'], [1080, '#ff8fb8', 'rose'], [1130, '#4dabf7', 'daisy'], [1180, '#ffa94d', 'tulip'], [1230, '#f783ac', 'daisy'], [1280, '#69db7c', 'rose']]) {
      for (let r = 0; r < 2; r++) Art.flower(g, x + r * 20, 820 + r * 40, 1.1, c, k, x + r);
    }
    box(g, 870, 860, 460, 24, 10, '#c98f5b', { lw: 3 });
    for (const [x, y] of PLOT_POS) Props.plot(g, x, y, 140, 100);
  },
  drawDyn(ctx) {
    const t = Game.time;
    Art.tree(ctx, 170, 470, 1.35, { fruit: '#ff5c5c', seed: 7 });
    Art.tree(ctx, 390, 480, 1.2, { fruit: '#ff5c5c', seed: 11 });
    Art.fountain(ctx, 800, 540, 1.1);
    Art.pond(ctx, 1420, 730, 130, 50);
    if (Rewards.unlocked('garden', 'birdhouse')) Props.birdhouse(ctx, 620, 480, 1);
    if (Rewards.unlocked('garden', 'windmill')) Props.windmill(ctx, 1010, 500, 1);
    if (Rewards.unlocked('garden', 'mushroom')) { drawEmoji(ctx, '🍄', 1530, 560, 90); Props.gnome(ctx, 1460, 590, 0.8); }
    S.garden.plots.forEach((p, i) => {
      const [x, y] = PLOT_POS[i], st = cropStage(p);
      if (st < 0) {
        drawText(ctx, '🌱?', x, y - 50, 22, { color: 'rgba(255,255,255,.7)' });
        return;
      }
      for (const dx of [-35, 0, 35]) Props.crop(ctx, x + dx, y - 26, p.crop, st, 0.75);
      for (let w = 0; w < p.weeds; w++) Props.weed(ctx, x - 50 + w * 40, y - 20, 0.8);
    });
    for (let i = 0; i < 4; i++) {
      const a = t * 0.7 + i * 1.6;
      Art.butterfly(ctx, 1250 + Math.cos(a) * 110, 620 + Math.sin(a * 1.4) * 60, 1, Object.values(COLORS)[(i * 2) % 7], t + i);
    }
    Art.bird(ctx, (t * 70) % (W + 200) - 100, 160 + Math.sin(t) * 20, 1.4);
  },
});

// -------------------------------------------------------------- barbecue

makeLocation({
  id: 'bbq', title: 'Barbecue Area', music: 'outdoor', outdoor: true,
  walk: [{ x: 40, y: 480, w: 1520, h: 400 }],
  blocks: [{ x: 140, y: 480, w: 340, h: 80 }, { x: 460, y: 500, w: 200, h: 80 }, { x: 860, y: 560, w: 400, h: 100 }, { x: 1080, y: 780, w: 360, h: 100 }],
  start: { x: 800, y: 760 },
  spots: {
    grill: { name: 'Barbecue grill', x: 560, y: 640, hit: { x: 460, y: 380, w: 200, h: 200 }, acts: ['bbq'] },
    table: { name: 'Dining table', x: 1060, y: 720, hit: { x: 860, y: 500, w: 400, h: 160 }, acts: ['set_table', 'bbq'], alwaysAsk: true },
    blanket: { name: 'Picnic blanket', x: 1250, y: 750, hit: { x: 1080, y: 770, w: 360, h: 110 }, acts: ['picnic'], badgeAt: { x: 1250, y: 770 } },
  },
  family: { dad: { x: 700, y: 640, facing: -1, pose: 'cook', acts: ['hug_dad', 'bbq'] }, mom: { x: 1340, y: 680, facing: -1, acts: ['hug_mom', 'picnic', 'set_table'] } },
  drawBack(g) {
    outdoorBase(g, { seed: 27 });
    rr(g, 60, 430, 840, 330, 30);
    g.fillStyle = woodPattern(g, '#e9bd8c');
    g.fill();
    g.strokeStyle = PAL.woodDark;
    g.lineWidth = 4;
    g.stroke();
    Props.counter(g, 310, 560, 340, 140, '#ffd0a8');
    drawEmoji(g, '🥗', 230, 400, 50);
    drawEmoji(g, '🌽', 320, 396, 46);
    drawEmoji(g, '🍅', 400, 400, 42);
    Props.blanket(g, 1260, 830, 330, 100, '#ff8a8a');
    for (const px of [80, 1520]) box(g, px - 6, 180, 12, 340, 4, PAL.woodDark, { lw: 2 });
    Props.plant(g, 960, 520, 0.9, { pot: '#ff9e7a' });
    Props.plant(g, 1500, 560, 0.9, { pot: '#b9a4ff' });
  },
  drawDyn(ctx) {
    Props.stringLights(ctx, 80, 190, 1520, 190, 50);
    Props.grill(ctx, 560, 580, 1, { on: Family.where('dad') === 'bbq' || Activity.current?.act.id === 'bbq' });
    Props.chair(ctx, 880, 660, 0.9, '#7cc6ff', -1);
    Props.chair(ctx, 1240, 660, 0.9, '#7cc6ff', 1);
    Props.picnicTable(ctx, 1060, 650, 380);
    drawEmoji(ctx, '🍉', 1000, 525, 46);
    drawEmoji(ctx, '🥤', 1120, 525, 40);
    drawEmoji(ctx, '🧺', 1180, 790, 60);
  },
  lights: () => [[800, 220, 500, '#ffe9a8', 0.6]],
});

// ------------------------------------------------------------- games zone

makeLocation({
  id: 'games', title: 'Games Zone', music: 'games', outdoor: false,
  walk: [{ x: 40, y: 600, w: 1520, h: 280 }],
  blocks: [{ x: 1060, y: 600, w: 220, h: 80 }, { x: 260, y: 780, w: 340, h: 100 }, { x: 1320, y: 600, w: 240, h: 150 }],
  start: { x: 800, y: 760 },
  spots: {
    memory: { name: 'Memory machine', x: 260, y: 660, hit: { x: 180, y: 260, w: 160, h: 340 }, acts: ['memory'] },
    shapes: { name: 'Shape machine', x: 480, y: 660, hit: { x: 400, y: 260, w: 160, h: 340 }, acts: ['shape_match'] },
    colors: { name: 'Color machine', x: 700, y: 660, hit: { x: 620, y: 260, w: 160, h: 340 }, acts: ['color_match'] },
    jigsaw: { name: 'Puzzle table', x: 1170, y: 720, hit: { x: 1050, y: 540, w: 240, h: 140 }, acts: ['jigsaw'] },
    bowling: { name: 'Bowling lane', x: 1440, y: 800, hit: { x: 1320, y: 300, w: 260, h: 450 }, acts: ['bowling'] },
    hockey: { name: 'Air hockey', x: 430, y: 760, hit: { x: 250, y: 680, w: 360, h: 200 }, acts: ['air_hockey'], badgeAt: { x: 430, y: 690 } },
  },
  family: { dad: { x: 900, y: 800, facing: -1 }, mom: { x: 1000, y: 780, facing: -1 } },
  drawBack(g) {
    g.fillStyle = wallPattern(g, 'stars', '#5b4a8a', '#6b5a9a');
    g.fillRect(0, 0, W, 600);
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = PARTY[i];
      g.lineWidth = 6;
      g.globalAlpha = 0.5;
      g.beginPath();
      g.moveTo(0, 60 + i * 14);
      g.lineTo(W, 60 + i * 14);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = carpetPattern(g, '#7b6ab8');
    g.fillRect(0, 590, W, 310);
    const rnd = seeded(4);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = PARTY[i % 6];
      g.globalAlpha = 0.5;
      g.fillRect(rnd() * W, 600 + rnd() * 300, 10, 4);
    }
    g.globalAlpha = 1;
    box(g, -10, 580, W + 20, 24, 0, '#ffffff', { lw: 3 });
    // Bowling lane going back into the wall.
    g.beginPath();
    g.moveTo(1380, 300); g.lineTo(1520, 300); g.lineTo(1580, 760); g.lineTo(1320, 760); g.closePath();
    g.fillStyle = woodPattern(g, '#f0c890');
    g.fill();
    g.strokeStyle = PAL.woodDark;
    g.lineWidth = 4;
    g.stroke();
    for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) {
      const px = 1450 - r * 12 + c * 24, py = 330 - r * 10;
      box(g, px - 6, py - 26, 12, 30, 6, '#ffffff', { lw: 1.5 });
      g.fillStyle = '#ff6b6b';
      g.fillRect(px - 6, py - 18, 12, 4);
    }
    drawEmoji(g, '🎳', 1450, 700, 60);
    // Puzzle table
    Props.coffeeTable(g, 1170, 680, 240, '#ffd27a');
    for (let i = 0; i < 5; i++) box(g, 1080 + i * 36, 594, 32, 22, 5, PARTY[i], { lw: 1.5 });
    Props.picture(g, 900, 120, 160, 110, { kind: 'hammy', frame: '#ff8fb8' });
    drawText(g, '🏆 Prizes', 980, 300, 30, { color: '#ffe066' });
  },
  drawDyn(ctx) {
    const t = Game.time;
    const screens = [
      (g, x, y, w, h) => { g.fillStyle = '#ffd6e5'; g.fillRect(x, y, w, h); for (let i = 0; i < 4; i++) box(g, x + 8 + (i % 2) * (w / 2 - 4), y + 6 + Math.floor(i / 2) * (h / 2 - 2), w / 2 - 12, h / 2 - 10, 4, i === Math.floor(t) % 4 ? '#ffffff' : '#ff8fb8', { lw: 1 }); },
      (g, x, y, w, h) => { g.fillStyle = '#d8f5c8'; g.fillRect(x, y, w, h); g.fillStyle = COLORS.blue; circle(g, x + w * 0.3, y + h * 0.5, 14); g.fill(); g.fillStyle = COLORS.red; g.fillRect(x + w * 0.58, y + h * 0.3, 26, 26); },
      (g, x, y, w, h) => { for (let i = 0; i < 7; i++) { g.fillStyle = Object.values(COLORS)[i]; g.fillRect(x + i * w / 7, y, w / 7 + 1, h); } },
    ];
    ['#ff8fb8', '#7ed99a', '#7cc6ff'].forEach((c, i) => Props.arcade(ctx, 260 + i * 220, 600, 1.1, c, screens[i]));
    ctx.save();
    ctx.shadowColor = '#ff6fd0';
    ctx.shadowBlur = 20 + Math.sin(t * 4) * 8;
    drawText(ctx, '🕹️ GAMES ZONE', 520, 150, 56, { color: '#ff7fd0', stroke: '#ffffff', sw: 0.12 });
    ctx.restore();
    Props.beams(ctx, t, 0.08);
  },
  props: [{
    y: 790, draw(ctx) {
      box(ctx, 250, 700, 360, 170, 26, '#e3f2ff', { lw: 4, line: '#7cc6ff' });
      ctx.strokeStyle = 'rgba(124,198,255,.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(430, 708); ctx.lineTo(430, 862);
      ctx.stroke();
      circle(ctx, 430, 785, 30);
      ctx.stroke();
      const px = 430 + Math.sin(Game.time * 2) * 110;
      circle(ctx, px, 785, 14);
      paint(ctx, '#ff6b6b', 771, 799, { lw: 2 });
      for (const sx of [280, 580]) { circle(ctx, sx, 785, 22); paint(ctx, sx < 430 ? '#7ed99a' : '#ffa94d', 763, 807, { lw: 2.5 }); }
    },
  }],
  lights: () => [[520, 160, 420, '#ff9fe0', 0.5], [1450, 350, 260, '#ffe9a8', 0.5]],
});

// ------------------------------------------------------- friends village

const VILLAGE_HOUSES = [[230, 470, 0.8], [800, 455, 0.85], [1370, 470, 0.8], [520, 375, 0.5], [1080, 370, 0.5], [1520, 380, 0.45]];

makeLocation({
  id: 'village', title: 'Friends Village', music: 'village', outdoor: true,
  walk: [{ x: 40, y: 500, w: 1520, h: 380 }],
  blocks: [{ x: 1180, y: 740, w: 280, h: 110 }, { x: 380, y: 770, w: 260, h: 90 }],
  start: { x: 800, y: 700 },
  spots: {
    square: { name: 'Village square', x: 800, y: 700, hit: { x: 700, y: 590, w: 200, h: 120 }, acts: ['play_friend', 'share_food', 'invite'], alwaysAsk: true, badgeAt: { x: 800, y: 590 } },
    stage: { name: 'Dance stage', x: 1320, y: 720, hit: { x: 1180, y: 640, w: 280, h: 210 }, acts: ['dance_party'] },
    party: { name: 'Party table', x: 510, y: 740, hit: { x: 380, y: 680, w: 260, h: 180 }, acts: ['birthday'] },
  },
  family: { mom: { x: 120, y: 760, facing: 1 }, dad: { x: 1530, y: 640, facing: -1 } },
  extraPeople() {
    const bday = Friends.birthday();
    return FRIENDS.filter(f => f.id !== S.friends.invited).map((f, i) => {
      const [x, y, s] = VILLAGE_HOUSES[i], fy = i < 3 ? y + 70 : 560;
      return { kind: f.id, x: x + (i < 3 ? 120 : 0), y: fy, h: this.hamSize * 0.95, pose: f === bday ? 'celebrate' : 'idle', facing: -1, villager: true, bday: f === bday, acts: [] };
    });
  },
  drawBack(g) {
    outdoorBase(g, { seed: 33, ground: '#b2e894', treeLine: true });
    ellipse(g, 800, 700, 330, 110);
    g.fillStyle = PAL.path;
    g.fill();
    for (const [x, y, s] of VILLAGE_HOUSES.slice(3)) Art.path(g, [[x, y], [x, 560]], 40 * s);
  },
  drawDyn(ctx) {
    const t = Game.time, lit = Clock.light().night > 0.3;
    const order = VILLAGE_HOUSES.map((h, i) => [h, i]).sort((a, b) => a[0][1] - b[0][1]);
    for (const [[x, y, s], i] of order) Props.cottage(ctx, x, y, s, { wall: FRIENDS[i].house.wall, roof: FRIENDS[i].house.roof, lit });
    FRIENDS.forEach((f, i) => {
      const [x, y, s] = VILLAGE_HOUSES[i];
      const lw = (f.name.length * 14 + 50) * Math.max(0.7, s);
      box(ctx, x - lw / 2, y - 330 * s - 30, lw, 34, 17, '#ffffff', { lw: 2 });
      drawText(ctx, `${f.name}'s house`, x, y - 330 * s - 13, 18 * Math.max(0.8, s));
    });
    // Little well in the square, the stage and the party table.
    Art.fountain(ctx, 800, 650, 0.6);
    box(ctx, 1180, 740, 280, 90, 16, '#e0b07c', { lw: 3 });
    Props.stringLights(ctx, 1180, 650, 1460, 650, 18);
    for (const px of [1180, 1460]) box(ctx, px - 5, 640, 10, 110, 3, PAL.woodDark, { lw: 2 });
    drawEmoji(ctx, '🪩', 1320, 600 + Math.sin(t * 2) * 4, 54);
    Props.table(ctx, 510, 850, 240, 110, { cloth: '#fff0b3' });
    drawEmoji(ctx, '🎂', 510, 720, 64);
    for (let i = 0; i < 3; i++) drawEmoji(ctx, '🎈', 400 + i * 110, 640 + Math.sin(t * 2 + i) * 8, 56);
    const b = Friends.birthday();
    if (b) drawText(ctx, `🎂 ${b.name}'s birthday today!`, 510, 610, 22, { color: '#ff5f9e', stroke: '#fff', sw: 0.3 });
  },
  lights: () => VILLAGE_HOUSES.slice(0, 3).map(([x, y]) => [x, y - 80, 160, '#ffe9a8', 0.6]),
});
