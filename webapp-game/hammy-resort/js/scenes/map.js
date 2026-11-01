// The resort world map: a big illustrated overhead map with all eight
// destinations joined by paths. Tap a place and Hammy walks there along the
// paths. Drag to look around, scroll / pinch / +− to zoom.

const MAP_W = 2400, MAP_H = 1500;

// Where each destination is on the map: `node` is where the path arrives,
// `area` is what can be tapped, `label` is where its name sign floats.
const MAP_PLACES = {
  house:      { node: [1180, 650], area: [880, 170, 600, 470], label: [1180, 150] },
  pool:       { node: [1720, 690], area: [1730, 430, 560, 330], label: [2010, 405] },
  sports:     { node: [1760, 1120], area: [1770, 950, 600, 470], label: [2070, 935] },
  playground: { node: [640, 1080], area: [180, 960, 560, 420], label: [470, 945] },
  garden:     { node: [570, 560], area: [150, 200, 620, 440], label: [460, 185] },
  bbq:        { node: [860, 880], area: [640, 730, 360, 230], label: [820, 715] },
  games:      { node: [1200, 1190], area: [1040, 1180, 330, 250], label: [1205, 1165] },
  village:    { node: [1960, 310], area: [1780, 30, 580, 340], label: [2070, 25] },
};

// Paths between places (polylines through the plaza).
const MAP_EDGES = [
  ['plaza', 'house', [[1200, 960], [1190, 800], [1180, 650]]],
  ['plaza', 'bbq', [[1200, 960], [1030, 940], [860, 880]]],
  ['bbq', 'garden', [[860, 880], [720, 730], [570, 560]]],
  ['plaza', 'playground', [[1200, 960], [930, 1050], [640, 1080]]],
  ['plaza', 'games', [[1200, 960], [1215, 1080], [1200, 1190]]],
  ['plaza', 'sports', [[1200, 960], [1480, 1050], [1760, 1120]]],
  ['plaza', 'pool', [[1200, 960], [1480, 870], [1720, 690]]],
  ['pool', 'village', [[1720, 690], [1830, 500], [1960, 310]]],
  ['house', 'garden', [[1180, 650], [870, 590], [570, 560]]],
  ['house', 'pool', [[1180, 650], [1450, 650], [1720, 690]]],
];
const MAP_NODES = { plaza: [1200, 960], ...Object.fromEntries(Object.entries(MAP_PLACES).map(([k, v]) => [k, v.node])) };

// Shortest route along the paths, as a list of points.
function mapRoute(from, to) {
  if (from === to) return [MAP_NODES[to]];
  const len = pts => pts.reduce((a, p, i) => (i ? a + dist(p[0], p[1], pts[i - 1][0], pts[i - 1][1]) : 0), 0);
  const adj = {};
  for (const [a, b, pts] of MAP_EDGES) {
    (adj[a] = adj[a] || []).push([b, pts, len(pts)]);
    (adj[b] = adj[b] || []).push([a, [...pts].reverse(), len(pts)]);
  }
  const d = { [from]: 0 }, prev = {}, todo = new Set(Object.keys(MAP_NODES));
  while (todo.size) {
    let u = null;
    for (const n of todo) if (d[n] !== undefined && (u === null || d[n] < d[u])) u = n;
    if (u === null || u === to) break;
    todo.delete(u);
    for (const [v, pts, l] of adj[u] || []) if (d[u] + l < (d[v] ?? Infinity)) { d[v] = d[u] + l; prev[v] = [u, pts]; }
  }
  const out = [];
  let n = to;
  while (prev[n]) {
    const [u, pts] = prev[n];
    out.unshift(...pts.slice(1));
    n = u;
  }
  out.unshift(MAP_NODES[from]);
  return out;
}

// --------------------------------------------------------------- drawing

const MapArt = {
  // Ground layer: grass, patches, paths and flat areas (cached once).
  ground(g) {
    g.fillStyle = grassPattern(g, PAL.grass);
    g.fillRect(0, 0, MAP_W, MAP_H);
    const rnd = seeded(77);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(90,160,70,.08)';
      ellipse(g, rnd() * MAP_W, rnd() * MAP_H, 80 + rnd() * 160, 40 + rnd() * 80, rnd());
      g.fill();
    }
    for (const [, , pts] of MAP_EDGES) Art.path(g, pts, 54);
    // Plaza
    ellipse(g, 1200, 960, 170, 110);
    g.fillStyle = PAL.pathEdge;
    g.fill();
    ellipse(g, 1200, 958, 160, 102);
    g.fillStyle = PAL.path;
    g.fill();
    g.strokeStyle = 'rgba(200,170,120,.35)';
    g.lineWidth = 3;
    for (let r = 40; r < 150; r += 36) { ellipse(g, 1200, 958, r, r * 0.64); g.stroke(); }
    // House lawn and patio
    rr(g, 900, 470, 560, 140, 40);
    g.fillStyle = '#f3e2cc';
    g.fill();
    // Pool deck
    rr(g, 1740, 440, 540, 310, 50);
    g.fillStyle = '#f7e9d2';
    g.fill();
    g.strokeStyle = '#e7d3b2';
    g.lineWidth = 4;
    g.stroke();
    // Sports: track and field
    ellipse(g, 2070, 1190, 290, 210);
    g.fillStyle = '#ff9a8a';
    g.fill();
    ellipse(g, 2070, 1190, 240, 165);
    g.fillStyle = '#8fd474';
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)';
    g.lineWidth = 3;
    for (const r of [265, 252]) { ellipse(g, 2070, 1190, r, r * 0.725); g.stroke(); }
    // Playground sand
    ellipse(g, 460, 1170, 270, 190);
    g.fillStyle = sandPattern(g);
    g.fill();
    g.strokeStyle = PAL.sandDark;
    g.lineWidth = 5;
    g.stroke();
    // Garden beds
    rr(g, 170, 230, 590, 400, 60);
    g.fillStyle = '#b9e89e';
    g.fill();
    // BBQ deck
    rr(g, 660, 760, 330, 180, 26);
    g.fillStyle = woodPattern(g, '#e3b27c');
    g.fill();
    g.strokeStyle = PAL.woodDark;
    g.lineWidth = 4;
    g.stroke();
    // Village green
    ellipse(g, 2070, 210, 260, 150);
    g.fillStyle = '#b7eb9c';
    g.fill();
    // Games zone forecourt
    rr(g, 1030, 1260, 350, 160, 30);
    g.fillStyle = tilePattern(g, '#f5ecff', '#e6dbff', 50);
    g.fill();
  },

  house(ctx, x, y) {
    const night = Clock.light().night, lit = night > 0.3;
    groundShadow(ctx, x, y + 6, 330, 40);
    // Side wings
    for (const side of [-1, 1]) {
      box(ctx, x + side * 230 - 90, y - 210, 180, 210, 18, '#ffe3cf', { lw: 4 });
      ctx.beginPath();
      ctx.moveTo(x + side * 230 - 110, y - 200);
      ctx.lineTo(x + side * 230, y - 290);
      ctx.lineTo(x + side * 230 + 110, y - 200);
      ctx.closePath();
      paint(ctx, '#c9b6ff', y - 290, y - 200, { lw: 4 });
    }
    box(ctx, x - 170, y - 300, 340, 300, 22, '#ffd9c2', { lw: 4 });
    ctx.beginPath();
    ctx.moveTo(x - 200, y - 290);
    ctx.lineTo(x, y - 430);
    ctx.lineTo(x + 200, y - 290);
    ctx.closePath();
    paint(ctx, '#b69cff', y - 430, y - 290, { lw: 4 });
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    for (let i = 0; i < 4; i++) { ctx.fillRect(x - 150 + i * 80, y - 330 + Math.abs(i - 1.5) * -20, 50, 6); }
    // Chimney with smoke
    box(ctx, x + 90, y - 420, 40, 80, 6, '#ff9e7a', { lw: 3 });
    for (let i = 0; i < 3; i++) {
      const p = (Game.time * 0.25 + i / 3) % 1;
      ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - p)})`;
      circle(ctx, x + 110 + Math.sin(p * 6) * 12, y - 430 - p * 90, 14 + p * 16);
      ctx.fill();
    }
    // Round window in the roof
    circle(ctx, x, y - 350, 30);
    paint(ctx, lit ? '#fff1a8' : '#cfeeff', y - 380, y - 320, { lw: 4, line: '#ffffff' });
    const win = (wx, wy, w = 60, h = 70) => {
      box(ctx, wx - w / 2 - 6, wy - 6, w + 12, h + 12, 10, '#ffffff', { lw: 3 });
      rr(ctx, wx - w / 2, wy, w, h, 6);
      ctx.fillStyle = lit ? '#ffe9a0' : '#bfe6ff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + h);
      ctx.moveTo(wx - w / 2, wy + h / 2); ctx.lineTo(wx + w / 2, wy + h / 2);
      ctx.stroke();
      box(ctx, wx - w / 2 - 8, wy + h + 4, w + 16, 14, 5, '#ff9ec4', { lw: 2 });
    };
    for (const wx of [x - 95, x + 95]) { win(wx, y - 270); win(wx, y - 150); }
    for (const side of [-1, 1]) { win(x + side * 230, y - 180, 70, 60); win(x + side * 230, y - 100, 70, 60); }
    Props.door(ctx, x - 40, y - 120, 80, 120, '#ff9ec4');
    box(ctx, x - 70, y - 4, 140, 14, 6, '#e6d6c2', { lw: 3 });
    if (lit) for (const wx of [x - 95, x + 95]) Sky.glow(ctx, wx, y - 200, 120, '#ffe9a8', 0.8);
    // Patio
    for (const px of [x - 220, x + 220]) {
      Props.umbrella(ctx, px, y + 110, 0.55, ['#ffd6e5', '#ffffff']);
      box(ctx, px - 30, y + 80, 60, 30, 10, '#ffffff', { lw: 2.5 });
    }
    for (const bx of [x - 300, x - 140, x + 140, x + 300]) Art.bush(ctx, bx, y + 10, 0.7, { flowers: '#ff9ec4', seed: bx });
  },

  pool(ctx, x, y) {
    const t = Game.time;
    box(ctx, x - 230, y - 120, 400, 220, 80, '#ffffff', { lw: 4, line: '#d8c8b0' });
    Art.water(ctx, x - 215, y - 105, 370, 190, 70);
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 14]);
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 190, y - 105 + i * 47);
      ctx.lineTo(x + 130, y - 105 + i * 47);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    circle(ctx, x + 250, y + 40, 70);
    paint(ctx, '#ffffff', y - 30, y + 110, { lw: 4, line: '#d8c8b0' });
    ctx.save();
    circle(ctx, x + 250, y + 40, 58);
    ctx.clip();
    Art.water(ctx, x + 190, y - 20, 120, 120, 0, { color: '#8ad9f5' });
    ctx.restore();
    Props.floatRing(ctx, x - 80, y - 20, 26, '#ff8fb8', t);
    Props.floatRing(ctx, x + 60, y + 40, 22, '#ffd43b', t + 1);
    Props.duck(ctx, x + 250, y + 40, 0.6, { t });
    Props.beachBall(ctx, x - 150, y + 50 + Math.sin(t * 2) * 3, 16, t * 0.3);
    Props.poolSlide(ctx, x + 230, y - 60, 0.55);
    for (const lx of [x - 160, x - 40, x + 80]) Props.lounger(ctx, lx, y - 150, 0.55, '#7cc6ff');
    Props.umbrella(ctx, x + 140, y - 130, 0.55, ['#7cc6ff', '#ffffff']);
  },

  sports(ctx, x, y) {
    // Tennis (green), basketball (wood), badminton (blue) inside the track.
    const court = (cx, cy, w, h, color, kind) => {
      box(ctx, cx - w / 2, cy - h / 2, w, h, 8, color, { lw: 3 });
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - w / 2 + 10, cy - h / 2 + 10, w - 20, h - 20);
      ctx.beginPath();
      if (kind === 'basket') { circle(ctx, cx, cy, 24); ctx.stroke(); ctx.moveTo(cx, cy - h / 2 + 10); ctx.lineTo(cx, cy + h / 2 - 10); }
      else { ctx.moveTo(cx, cy - h / 2 + 10); ctx.lineTo(cx, cy + h / 2 - 10); ctx.moveTo(cx - w / 2 + 10, cy); ctx.lineTo(cx + w / 2 - 10, cy); }
      ctx.stroke();
      if (kind !== 'basket') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - h / 2 - 6);
        ctx.lineTo(cx, cy + h / 2 + 6);
        ctx.stroke();
      }
    };
    court(x - 90, y - 70, 200, 120, '#7ccf8e', 'tennis');
    court(x + 130, y - 70, 180, 120, '#e8b07c', 'basket');
    court(x + 20, y + 90, 200, 110, '#8cc8ff', 'badminton');
    for (const hx of [x + 50, x + 210]) {
      box(ctx, hx - 4, y - 140, 8, 60, 3, '#8d84a3', { lw: 2 });
      box(ctx, hx - 20, y - 150, 40, 24, 4, '#ffffff', { lw: 2 });
      ellipse(ctx, hx, y - 120, 12, 4);
      ctx.strokeStyle = '#ff6b3d';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) Props.cone(ctx, x - 240 + i * 70, y + 200, 0.45, i % 2 ? '#ffd43b' : '#ff9f43');
  },

  playground(ctx, x, y) {
    Props.playSlide(ctx, x - 120, y - 30, 0.5);
    Props.swingSet(ctx, x + 110, y - 40, 0.42, [Math.sin(Game.time * 2) * 0.4, Math.sin(Game.time * 2 + 1) * 0.4]);
    Props.climbDome(ctx, x - 50, y + 110, 0.38);
    Props.trampoline(ctx, x + 150, y + 110, 0.42, Math.max(0, Math.sin(Game.time * 4)));
    Props.ballPit(ctx, x - 200, y + 120, 150, 70);
    Props.seesaw(ctx, x + 40, y + 190, 0.38, Math.sin(Game.time * 1.5) * 0.25);
  },

  garden(ctx, x, y) {
    const cols = Object.values(COLORS);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
      Art.flower(ctx, x - 230 + c * 28 + (r % 2) * 14, y - 110 + r * 34, 0.5, cols[(c + r) % cols.length], ['tulip', 'daisy', 'rose'][r], c);
    }
    for (let i = 0; i < 3; i++) {
      Props.plot(ctx, x + 40 + i * 70, y - 60, 60, 110);
      for (let k = 0; k < 2; k++) Props.crop(ctx, x + 40 + i * 70, y - 120 + k * 45, ['carrot', 'tomato', 'lettuce'][i], 4, 0.55);
    }
    Art.tree(ctx, x - 230, y + 110, 0.75, { fruit: '#ff6b6b', seed: 3 });
    Art.tree(ctx, x - 120, y + 140, 0.7, { fruit: '#ff6b6b', seed: 5 });
    Art.tree(ctx, x + 250, y + 150, 0.7, { kind: 'blossom', seed: 8 });
    Art.fountain(ctx, x + 50, y + 120, 0.55);
    Art.pond(ctx, x + 180, y + 60, 60, 26);
    Props.shed(ctx, x + 270, y - 60, 0.45);
    for (let i = 0; i < 3; i++) {
      const t = Game.time + i * 2;
      Art.butterfly(ctx, x - 100 + Math.sin(t * 0.6) * 140, y - 40 + Math.cos(t * 0.8) * 60, 0.8, cols[i + 3], t);
    }
  },

  bbq(ctx, x, y) {
    Props.stringLights(ctx, x - 150, y - 110, x + 150, y - 110, 24);
    for (const px of [x - 150, x + 150]) box(ctx, px - 4, y - 112, 8, 120, 3, PAL.woodDark, { lw: 2 });
    Props.grill(ctx, x - 90, y + 10, 0.5);
    Props.picnicTable(ctx, x + 60, y + 20, 170);
    Props.blanket(ctx, x + 120, y + 110, 150, 60, '#ff8a8a');
  },

  games(ctx, x, y) {
    box(ctx, x - 150, y - 160, 300, 170, 20, '#e4d8ff', { lw: 4 });
    ctx.save();
    rr(ctx, x - 165, y - 190, 330, 50, 16);
    ctx.clip();
    for (let i = 0; i < 11; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ff8fb8';
      ctx.fillRect(x - 165 + i * 30, y - 190, 30, 50);
    }
    ctx.restore();
    rr(ctx, x - 165, y - 190, 330, 50, 16);
    ctx.lineWidth = 4;
    ctx.strokeStyle = shade('#ff8fb8', -0.3);
    ctx.stroke();
    const glow = 0.7 + 0.3 * Math.sin(Game.time * 4);
    ctx.save();
    ctx.shadowColor = '#ff6fd0';
    ctx.shadowBlur = 16 * glow;
    drawText(ctx, 'GAMES', x, y - 113, 34, { color: '#ff5fb6', stroke: '#ffffff', sw: 0.2 });
    ctx.restore();
    for (let i = 0; i < 3; i++) Props.arcade(ctx, x - 90 + i * 90, y, 0.36, ['#b197fc', '#7cc6ff', '#ffa94d'][i], (g, sx, sy, sw, sh) => {
      g.fillStyle = `hsl(${(Game.time * 60 + i * 120) % 360}, 80%, 65%)`;
      g.fillRect(sx, sy, sw, sh);
    });
  },

  village(ctx, x, y) {
    FRIENDS.forEach((f, i) => {
      const a = i / FRIENDS.length * TAU + 0.3, hx = x + Math.cos(a) * 210, hy = y + 30 + Math.sin(a) * 110;
      Props.cottage(ctx, hx, hy, 0.38, { wall: f.house.wall, roof: f.house.roof, lit: Clock.light().night > 0.3 });
    });
    Props.swingSet(ctx, x, y + 40, 0.3, [Math.sin(Game.time * 2) * 0.3, 0]);
    FRIENDS.forEach((f, i) => {
      const a = Game.time * 0.3 + i * 1.05;
      drawHamster(ctx, x + Math.cos(a) * 100, y + 90 + Math.sin(a) * 40, 46, { kind: f.id, pose: 'walk', facing: -Math.sign(Math.sin(a)) || 1, t: Game.time + i, fx: false });
    });
  },

  trees: (() => {
    const rnd = seeded(2024), out = [];
    const clear = (x, y) => Object.values(MAP_PLACES).every(p => !(x > p.area[0] - 40 && x < p.area[0] + p.area[2] + 40 && y > p.area[1] - 40 && y < p.area[1] + p.area[3] + 80))
      && MAP_EDGES.every(([, , pts]) => pts.every(([px, py]) => dist(x, y, px, py) > 120)) && dist(x, y, 1200, 960) > 260;
    for (let i = 0; i < 400 && out.length < 46; i++) {
      const x = rnd() * MAP_W, y = 60 + rnd() * (MAP_H - 60);
      if (clear(x, y)) out.push({ x, y, s: 0.6 + rnd() * 0.4, kind: rnd() < 0.25 ? 'pine' : rnd() < 0.15 ? 'blossom' : 'round', seed: i });
    }
    return out;
  })(),
};

// ---------------------------------------------------------------- scene

const MapScene = {
  sim: true,
  back: null,
  cam: { x: MAP_W / 2, y: MAP_H / 2, z: 0.6 },
  node: 'house',
  walker: null,
  buttons: [],

  fitZoom() { return Math.max(W / MAP_W, H / MAP_H); },

  enter(params = {}) {
    Music.play('outdoor');
    S.scene = 'map';
    this.node = params.from && MAP_NODES[params.from] ? params.from : (S.mapNode && MAP_NODES[S.mapNode] ? S.mapNode : 'house');
    const n = MAP_NODES[this.node];
    this.ham = { x: n[0], y: n[1], facing: 1 };
    this.walker = null;
    this.drag = null;
    this.cam.z = clamp(this.cam.z || this.fitZoom(), this.fitZoom(), 1.6);
    this.focus(n[0], n[1], true);
    this.buttons = [
      { x: W - 92, y: 300, w: 72, h: 72, emoji: '➕', color: '#ffffff', onClick: () => this.zoomBy(1.25) },
      { x: W - 92, y: 386, w: 72, h: 72, emoji: '➖', color: '#ffffff', onClick: () => this.zoomBy(0.8) },
      { x: W - 92, y: 472, w: 72, h: 72, emoji: '🔭', color: '#ffffff', onClick: () => { this.cam.z = this.fitZoom(); this.focus(MAP_W / 2, MAP_H / 2, true); } },
    ];
    if (params.travelTo) this.travel(params.travelTo);
  },

  exit() {
    S.mapNode = this.node;
  },

  hammyPos() {
    const p = this.toScreen(this.ham.x, this.ham.y - 60);
    return p;
  },

  toWorld(p) { return { x: (p.x - W / 2) / this.cam.z + this.cam.x, y: (p.y - H / 2) / this.cam.z + this.cam.y }; },
  toScreen(x, y) { return { x: (x - this.cam.x) * this.cam.z + W / 2, y: (y - this.cam.y) * this.cam.z + H / 2 }; },

  // Keep the camera inside the map.
  clampCam() {
    const z = this.cam.z, hw = W / 2 / z, hh = H / 2 / z;
    this.cam.x = clamp(this.cam.x, Math.min(hw, MAP_W / 2), Math.max(MAP_W - hw, MAP_W / 2));
    this.cam.y = clamp(this.cam.y, Math.min(hh, MAP_H / 2), Math.max(MAP_H - hh, MAP_H / 2));
  },

  focus(x, y, instant) {
    if (instant) {
      this.cam.x = x;
      this.cam.y = y;
    } else {
      this.cam.x += (x - this.cam.x) * 0.08;
      this.cam.y += (y - this.cam.y) * 0.08;
    }
    this.clampCam();
  },

  zoomBy(f, at = { x: W / 2, y: H / 2 }) {
    const before = this.toWorld(at);
    this.cam.z = clamp(this.cam.z * f, this.fitZoom(), 1.6);
    const after = this.toWorld(at);
    this.cam.x += before.x - after.x;
    this.cam.y += before.y - after.y;
    this.clampCam();
  },

  // Walk along the paths to a destination, then go in.
  travel(loc) {
    if (!MAP_PLACES[loc]) return;
    const route = mapRoute(this.node, loc);
    this.walker = { route, i: 0, loc };
    this.target = loc;
    Snd.whoosh();
  },

  update(dt) {
    const w = this.walker, h = this.ham;
    if (w) {
      let step = 430 * dt;
      while (step > 0 && w.i < w.route.length) {
        const [tx, ty] = w.route[w.i], d = dist(h.x, h.y, tx, ty);
        if (d <= step) {
          h.x = tx;
          h.y = ty;
          step -= d;
          w.i++;
        } else {
          if (Math.abs(tx - h.x) > 1) h.facing = Math.sign(tx - h.x);
          h.x += (tx - h.x) / d * step;
          h.y += (ty - h.y) / d * step;
          step = 0;
        }
      }
      if (Math.random() < dt * 5) Snd.step();
      this.cam.z += (Math.max(this.fitZoom(), 0.85) - this.cam.z) * Math.min(1, dt * 2);
      this.focus(h.x, h.y, false);
      if (w.i >= w.route.length) {
        this.walker = null;
        this.node = w.loc;
        S.mapNode = w.loc;
        const a = MAP_PLACES[w.loc].area, tl = this.toScreen(a[0], a[1]), br = this.toScreen(a[0] + a[2], a[1] + a[3]);
        const zoom = { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
        if (Travel.pending) {
          const p = Travel.pending;
          if (p.sceneId.startsWith('room:')) Game.go('house', { walkTo: p.sceneId.slice(5) }, { zoom });
          else Game.go(p.sceneId, {}, { zoom });
        } else Game.go(LOCATION[w.loc].scene, {}, { zoom });
      }
    } else {
      const [dx, dy] = Input.dir();
      if (dx || dy) {
        this.cam.x += dx * 700 * dt / this.cam.z;
        this.cam.y += dy * 700 * dt / this.cam.z;
        this.clampCam();
      }
    }
  },

  draw(ctx) {
    const z = this.cam.z;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-this.cam.x, -this.cam.y);
    ctx.drawImage(Cache.get('map:ground', MAP_W, MAP_H, g => MapArt.ground(g), 1 / View.px), 0, 0, MAP_W, MAP_H);
    this.drawWorld(ctx);
    ctx.restore();
    Sky.overlay(ctx, {});
    if (Weather.rainy()) Art.rain(ctx, 0, 0, W, H, 1.2);
    this.drawLabels(ctx);
    Btn.drawAll(ctx, this.buttons, 1 / 60);
    if (this.walker) {
      const name = LOCATION[this.walker.loc].name;
      box(ctx, W / 2 - 220, H - 120, 440, 64, 32, '#ffffff', { lw: 0 });
      drawText(ctx, `🐾 Walking to the ${name}…`, W / 2, H - 87, 28);
    }
  },

  drawWorld(ctx) {
    const t = Game.time;
    // Everything that stands up is drawn back to front.
    const items = [
      ...MapArt.trees.map(tr => ({ y: tr.y, draw: () => Art.tree(ctx, tr.x, tr.y, tr.s, { kind: tr.kind, seed: tr.seed }) })),
      { y: 580, draw: () => MapArt.house(ctx, 1180, 560) },
      { y: 640, draw: () => MapArt.pool(ctx, 1990, 600) },
      { y: 1150, draw: () => MapArt.sports(ctx, 2070, 1180) },
      { y: 1150, draw: () => MapArt.playground(ctx, 470, 1130) },
      { y: 430, draw: () => MapArt.garden(ctx, 460, 430) },
      { y: 860, draw: () => MapArt.bbq(ctx, 820, 840) },
      { y: 1400, draw: () => MapArt.games(ctx, 1205, 1395) },
      { y: 200, draw: () => MapArt.village(ctx, 2070, 190) },
      { y: 960, draw: () => { Art.fountain(ctx, 1200, 975, 0.8); for (const [bx, by] of [[1060, 900], [1340, 900]]) Art.bench(ctx, bx, by, 0.6); for (const lx of [1040, 1360]) Art.lamppost(ctx, lx, 1040, 0.7); } },
      { y: this.ham.y, draw: () => drawHamster(ctx, this.ham.x, this.ham.y, 72, { pose: this.walker ? 'walk' : 'idle', facing: this.ham.facing, mood: Mood.current(), fx: false }) },
    ];
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();
    // Butterflies, birds and cloud shadows drift over everything.
    for (let i = 0; i < 6; i++) {
      const a = t * 0.2 + i * 1.7;
      Art.butterfly(ctx, 300 + i * 380 + Math.sin(a) * 120, 500 + Math.cos(a * 1.3) * 300 + i * 60, 0.9, Object.values(COLORS)[i], t + i);
    }
    for (let i = 0; i < 3; i++) {
      const bx = ((t * 60 + i * 900) % (MAP_W + 400)) - 200;
      Art.bird(ctx, bx, 200 + i * 300 + Math.sin(t + i) * 30, 1.2);
      Art.bird(ctx, bx - 40, 220 + i * 300 + Math.sin(t + i) * 30, 1);
    }
    ctx.fillStyle = 'rgba(60,60,110,.07)';
    for (let i = 0; i < 4; i++) {
      const cx = ((t * 25 + i * 700) % (MAP_W + 600)) - 300;
      ellipse(ctx, cx, 300 + i * 330, 220, 90);
      ctx.fill();
    }
  },

  // Name signs, plus what Hammy would like to do there.
  drawLabels(ctx) {
    const wishes = Wishes.list(), t = Game.time;
    for (const [id, place] of Object.entries(MAP_PLACES)) {
      const loc = LOCATION[id], p = this.toScreen(place.label[0], place.label[1]);
      const s = clamp(this.cam.z / 0.8, 0.75, 1.15), w = (loc.name.length * 15 + 90) * s, hgt = 56 * s;
      // Keep signs on screen and clear of the HUD while their place is visible.
      const a = place.area, tl = this.toScreen(a[0], a[1]), br = this.toScreen(a[0] + a[2], a[1] + a[3]);
      place.screen = null;
      if (br.x < 0 || tl.x > W || br.y < 0 || tl.y > H) continue;
      p.x = clamp(p.x, w / 2 + 12, W - w / 2 - 12);
      p.y = clamp(p.y, 120, H - 120);
      place.screen = { x: p.x, y: p.y, w };
      const hover = this.hoverId === id;
      ctx.save();
      ctx.translate(p.x, p.y + Math.sin(t * 2 + id.length) * 3);
      if (hover) ctx.scale(1.08, 1.08);
      ctx.shadowColor = 'rgba(74,58,92,.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      rr(ctx, -w / 2, -hgt / 2, w, hgt, hgt / 2);
      ctx.fillStyle = hover ? '#fff3b8' : '#ffffff';
      ctx.fill();
      ctx.shadowBlur = 0;
      drawEmoji(ctx, loc.icon, -w / 2 + hgt * 0.62, 0, hgt * 0.8);
      drawText(ctx, loc.name, hgt * 0.45, 1, 24 * s, { color: PAL.ink });
      const wish = wishes.find(x => locationOf(x.act.where) === id);
      if (wish) {
        circle(ctx, w / 2 + 6, -hgt * 0.55, 26 * s);
        ctx.fillStyle = '#fff3b8';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffd34d';
        ctx.stroke();
        drawEmoji(ctx, wish.act.icon, w / 2 + 6, -hgt * 0.55, 32 * s);
      }
      if (!S.seen[id]) drawText(ctx, 'New!', -w / 2 + 10, -hgt * 0.7, 20 * s, { color: '#ff5f9e', stroke: '#fff', sw: 0.3 });
      ctx.restore();
    }
  },

  placeAt(p) {
    const wpt = this.toWorld(p);
    for (const [id, place] of Object.entries(MAP_PLACES)) {
      const s = place.screen;
      if (s && Math.abs(p.x - s.x) < s.w / 2 + 10 && Math.abs(p.y - s.y) < 34) return id;
    }
    for (const [id, place] of Object.entries(MAP_PLACES)) {
      const [ax, ay, aw, ah] = place.area;
      if (wpt.x >= ax && wpt.x <= ax + aw && wpt.y >= ay && wpt.y <= ay + ah) return id;
    }
    return null;
  },

  pointerDown(p) {
    if (Btn.press(this.buttons, p)) return;
    this.drag = { x: p.x, y: p.y, cx: this.cam.x, cy: this.cam.y, moved: false };
  },

  pointerMove(p) {
    if (this.drag && Input.pointer.down) {
      const dx = p.x - this.drag.x, dy = p.y - this.drag.y;
      if (Math.hypot(dx, dy) > 12) this.drag.moved = true;
      if (this.drag.moved) {
        this.cam.x = this.drag.cx - dx / this.cam.z;
        this.cam.y = this.drag.cy - dy / this.cam.z;
        this.clampCam();
      }
    }
    this.hoverId = this.placeAt(p);
    Game.canvasCursor(this.hoverId ? 'pointer' : this.drag?.moved ? 'grabbing' : 'grab');
  },

  pointerUp(p) {
    const d = this.drag;
    this.drag = null;
    if (!d || d.moved || this.walker) return;
    const id = this.placeAt(p);
    if (!id) return;
    Activity.current && Activity.cancel();
    Speech.say(`Let's go to the ${LOCATION[id].name}!`);
    if (id === this.node) {
      Game.go(LOCATION[id].scene, {}, {});
      return;
    }
    this.travel(id);
  },

  wheel(dy, p) { this.zoomBy(dy < 0 ? 1.12 : 0.9, p); },
  pinch(f, c) { this.zoomBy(f, c); },

  key(e) {
    if (e.code === 'Equal' || e.code === 'NumpadAdd') this.zoomBy(1.2);
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.zoomBy(0.83);
    if (e.code === 'Enter' && !this.walker) Game.go(LOCATION[this.node].scene);
    return true;
  },
};
defineScene('map', MapScene);

// The main menu shows the map gently drifting behind the menu buttons.
defineScene('menu', {
  sim: false,
  enter() {
    Music.play('menu');
    this.t = 0;
    UI.showMenu();
    MapScene.cam.z = 0.75;
  },
  update(dt) {
    this.t += dt;
    MapScene.cam.x = MAP_W / 2 + Math.sin(this.t * 0.05) * 600;
    MapScene.cam.y = MAP_H / 2 + Math.cos(this.t * 0.04) * 260;
    MapScene.clampCam();
  },
  draw(ctx) {
    const z = MapScene.cam.z;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-MapScene.cam.x, -MapScene.cam.y);
    ctx.drawImage(Cache.get('map:ground', MAP_W, MAP_H, g => MapArt.ground(g), 1 / View.px), 0, 0, MAP_W, MAP_H);
    MapScene.drawWorld.call({ ...MapScene, ham: { x: -500, y: -500 } }, ctx);
    ctx.restore();
    drawHamster(ctx, W / 2, H - 60, 210, { pose: 'wave', mood: 'excited' });
  },
});
