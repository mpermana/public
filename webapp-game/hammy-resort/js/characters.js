// The hamsters: Hammy, Mom, Dad and the village friends, drawn in layers on
// the canvas (no images). One drawing function covers every pose and mood;
// outfits and accessories are layered on top.

// Fur palettes: main fur, light belly / muzzle, darker outline, optional patch.
const FURS = {
  golden:    { name: 'Golden',    main: '#e8a85c', light: '#fff4e2', dark: '#b97a3c', ear: '#f7b5b5' },
  cream:     { name: 'Cream',     main: '#f3d3a2', light: '#fffaf0', dark: '#c9a274', ear: '#f9c2c2' },
  chocolate: { name: 'Chocolate', main: '#b07a52', light: '#f6e4d0', dark: '#82563a', ear: '#efb0a6' },
  gray:      { name: 'Silver',    main: '#b9b3c4', light: '#f7f5fb', dark: '#8a8399', ear: '#f5b9c6' },
  ginger:    { name: 'Ginger',    main: '#f29a5a', light: '#fff1e4', dark: '#c46e33', ear: '#f9b4a8' },
  snow:      { name: 'Snowy',     main: '#fbf7f2', light: '#ffffff', dark: '#d2c8bd', ear: '#ffc2d1', patch: '#e2b07a' },
  panda:     { name: 'Patches',   main: '#fffaf5', light: '#ffffff', dark: '#cfc5bb', ear: '#ffc2d1', patch: '#6d5e58' },
};

// Mom, Dad and the friends. `look` adds accessories; `h` is their height
// relative to Hammy.
const FAMILY = {
  mom: { name: 'Mom', fur: { main: '#f6d9ae', light: '#fffaf2', dark: '#d1a876', ear: '#f9bfc4' }, h: 1.3, top: { kind: 'dress', color: '#ff9ec4' }, look: 'mom' },
  dad: { name: 'Dad', fur: { main: '#b98258', light: '#f8e8d6', dark: '#8a5a37', ear: '#efb0a6' }, h: 1.4, top: { kind: 'shirt', color: '#7cc6ff' }, look: 'dad' },
};

const FRIENDS = [
  { id: 'pip', name: 'Pip', fur: { main: '#fffaf5', light: '#ffffff', dark: '#cfc5bb', ear: '#ffc2d1', patch: '#a9a2b4' }, hat: 'cap', hatColor: '#ff6b6b', color: '#ff8a8a',
    personality: 'Sporty and super fast!', likes: ['basketball', 'running'], favorite: 'Basketball', house: { wall: '#ffd0d0', roof: '#ff6b6b' } },
  { id: 'nutmeg', name: 'Nutmeg', fur: FURS.ginger, hat: 'flower', color: '#ffa94d',
    personality: 'Loves flowers and digging in the garden.', likes: ['gardening', 'butterflies'], favorite: 'Gardening', house: { wall: '#ffe3c2', roof: '#ffa94d' } },
  { id: 'coco', name: 'Coco', fur: FURS.chocolate, hat: 'headphones', color: '#b197fc',
    personality: 'Always humming a happy tune.', likes: ['piano', 'karaoke'], favorite: 'Music', house: { wall: '#e8dcff', roof: '#9775fa' } },
  { id: 'mochi', name: 'Mochi', fur: FURS.cream, glasses: true, color: '#7cc6ff',
    personality: 'A quiet bookworm who loves stories.', likes: ['read_book', 'jigsaw'], favorite: 'Reading', house: { wall: '#d8efff', roof: '#4dabf7' } },
  { id: 'biscuit', name: 'Biscuit', fur: FURS.gray, scarf: '#69db7c', color: '#69db7c',
    personality: 'A silly joker and game champion.', likes: ['bowling', 'memory'], favorite: 'Games', house: { wall: '#dcf7e0', roof: '#51cf66' } },
  { id: 'sunny', name: 'Sunny', fur: { main: '#f8c76a', light: '#fff8e6', dark: '#c99a3e', ear: '#f9b4a8' }, hat: 'sunhat', color: '#ffd43b',
    personality: 'A splashy swimmer who loves the sun.', likes: ['swim', 'splash'], favorite: 'Swimming', house: { wall: '#fff3bf', roof: '#fcc419' } },
];
const FRIEND = Object.fromEntries(FRIENDS.map(f => [f.id, f]));

// Outfits Hammy can wear (unlocked with stars, see state.js).
const HATS = {
  none: { name: 'No hat', icon: '🚫' },
  bow: { name: 'Bow', icon: '🎀' },
  cap: { name: 'Cap', icon: '🧢' },
  flower: { name: 'Flower crown', icon: '🌼' },
  sunhat: { name: 'Sun hat', icon: '👒' },
  beanie: { name: 'Beanie', icon: '🧶' },
  party: { name: 'Party hat', icon: '🥳' },
  headphones: { name: 'Headphones', icon: '🎧' },
  tophat: { name: 'Top hat', icon: '🎩' },
  crown: { name: 'Crown', icon: '👑' },
};
const TOPS = {
  none: { name: 'Just fur', icon: '🐹' },
  tshirt: { name: 'T-shirt', icon: '👕', color: '#7cc6ff' },
  overalls: { name: 'Overalls', icon: '👖', color: '#6b9bff' },
  dress: { name: 'Dress', icon: '👗', color: '#ff9ec4' },
  sport: { name: 'Sports shirt', icon: '🎽', color: '#ffa94d' },
  cape: { name: 'Hero cape', icon: '🦸', color: '#ff6b6b' },
  pajamas: { name: 'Pajamas', icon: '🌙', color: '#a5b4fc' },
};

// --------------------------------------------------------------- poses

// Each pose returns how the body moves at time t (in hamster units, u = 1/100 height).
function poseParams(pose, t, o) {
  const P = {
    by: Math.sin(t * 2.2) * 0.8, sx: 1, sy: 1 + Math.sin(t * 2.2) * 0.012, tilt: 0, turn: 0,
    pawL: [-15, -34], pawR: [15, -34], footL: 0, footR: 0, eyes: null, mouth: null, look: [0, 0],
    fx: null, hold: o.holding || null, sit: false, cheeks: 1,
  };
  const f = o.facing || 1;
  switch (pose) {
    case 'walk': case 'run': {
      const sp = pose === 'run' ? 13 : 8, a = Math.sin(t * sp), b = pose === 'run' ? 7 : 3.5;
      P.by = -Math.abs(a) * b;
      P.tilt = a * 0.05 + f * (pose === 'run' ? 0.09 : 0.03);
      P.turn = 4 * f;
      P.footL = -Math.max(0, a) * 5;
      P.footR = -Math.max(0, -a) * 5;
      P.pawL = [-15, -34 + a * 3];
      P.pawR = [15, -34 - a * 3];
      P.look = [f * 1.5, 0];
      break;
    }
    case 'jump': {
      const p = Math.abs(Math.sin(t * 4));
      P.by = -p * 32;
      P.sy = 1 + (p < 0.15 ? -0.12 : 0.05);
      P.sx = 2 - P.sy;
      P.pawL = [-26, -62 + p * -8];
      P.pawR = [26, -62 + p * -8];
      P.mouth = 'open';
      P.eyes = 'happy';
      break;
    }
    case 'celebrate': {
      const p = Math.abs(Math.sin(t * 5));
      P.by = -p * 14;
      P.pawL = [-28, -70 - p * 6];
      P.pawR = [28, -70 - p * 6];
      P.mouth = 'open';
      P.eyes = 'happy';
      P.fx = 'sparkle';
      break;
    }
    case 'eat':
      P.pawL = [-7, -48];
      P.pawR = [7, -48];
      P.mouth = Math.sin(t * 12) > 0 ? 'munch' : 'w';
      P.cheeks = 1.25 + Math.sin(t * 12) * 0.08;
      P.eyes = 'happy';
      P.hold = o.holding || '🌻';
      break;
    case 'sleep':
      P.by = Math.sin(t * 1.2) * 1.2;
      P.sy = 1 + Math.sin(t * 1.2) * 0.025;
      P.eyes = 'closed';
      P.mouth = 'o';
      P.fx = 'zzz';
      P.pawL = [-10, -40];
      P.pawR = [10, -40];
      break;
    case 'sit': case 'read': case 'ride':
      P.sit = true;
      P.by = 4 + Math.sin(t * 2) * 0.6;
      P.sy = 0.96;
      if (pose === 'read') {
        P.pawL = [-12, -40];
        P.pawR = [12, -40];
        P.look = [0, 2];
        P.hold = 'book';
        P.mouth = 'smile';
      }
      if (pose === 'ride') {
        P.pawL = [-22, -52];
        P.pawR = [22, -52];
        P.mouth = 'open';
        P.eyes = 'happy';
      }
      break;
    case 'play':
      P.by = -Math.abs(Math.sin(t * 6)) * 8;
      P.pawL = [-24, -50 + Math.sin(t * 6) * 8];
      P.pawR = [24, -50 - Math.sin(t * 6) * 8];
      P.mouth = 'open';
      P.eyes = 'happy';
      break;
    case 'piano':
      P.sit = true;
      P.by = 4 + Math.sin(t * 4) * 1;
      P.tilt = Math.sin(t * 2) * 0.04;
      P.pawL = [-14, -36 + Math.max(0, Math.sin(t * 9)) * 4];
      P.pawR = [14, -36 + Math.max(0, Math.sin(t * 9 + 2)) * 4];
      P.eyes = 'happy';
      P.mouth = 'smile';
      P.fx = 'notes';
      break;
    case 'sing':
      P.tilt = Math.sin(t * 3) * 0.08;
      P.by = Math.sin(t * 6) * 1.5;
      P.pawR = [6, -52];
      P.pawL = [-22, -46 + Math.sin(t * 3) * 6];
      P.mouth = 'sing';
      P.eyes = Math.sin(t * 1.3) > 0.3 ? 'happy' : 'open';
      P.hold = 'mic';
      P.fx = 'notes';
      break;
    case 'swim':
      P.by = Math.sin(t * 3) * 2;
      P.pawL = [-28, -40 + Math.sin(t * 7) * 6];
      P.pawR = [28, -40 - Math.sin(t * 7) * 6];
      P.mouth = 'open';
      P.eyes = 'happy';
      P.swim = true;
      break;
    case 'hungry':
      P.pawL = [-8, -30];
      P.pawR = [8, -30];
      P.look = [f * 2, 0];
      P.mouth = 'o';
      P.fx = 'rumble';
      break;
    case 'sleepy': {
      const yawn = (t % 6) < 1.4;
      P.by = Math.sin(t * 1.2) * 1.2;
      P.tilt = Math.sin(t * 0.9) * 0.05;
      P.eyes = yawn ? 'closed' : 'half';
      P.mouth = yawn ? 'yawn' : 'w';
      if (yawn) P.pawR = [10, -66];
      break;
    }
    case 'hug':
      P.pawL = [-30, -48];
      P.pawR = [30, -48];
      P.eyes = 'happy';
      P.mouth = 'smile';
      P.fx = 'heart';
      P.by = -Math.abs(Math.sin(t * 3)) * 3;
      break;
    case 'wave':
      P.pawR = [36, -84 + Math.sin(t * 10) * 4];
      P.mouth = 'open';
      break;
    case 'brush':
      P.pawR = [6 + Math.sin(t * 14) * 5, -55];
      P.mouth = 'teeth';
      P.hold = 'brush';
      P.eyes = 'happy';
      break;
    case 'wash':
      P.pawL = [-22 + Math.sin(t * 10) * 4, -90];
      P.pawR = [22 - Math.sin(t * 10) * 4, -90];
      P.eyes = 'happy';
      P.mouth = 'smile';
      P.fx = 'bubbles';
      break;
    case 'dance':
      P.tilt = Math.sin(t * 5) * 0.15;
      P.by = -Math.abs(Math.sin(t * 5)) * 7;
      P.pawL = [-26, -60 + Math.sin(t * 5) * 12];
      P.pawR = [26, -60 - Math.sin(t * 5) * 12];
      P.mouth = 'open';
      P.eyes = 'happy';
      break;
    case 'cook':
      P.pawR = [16 + Math.cos(t * 6) * 5, -40 + Math.sin(t * 6) * 3];
      P.pawL = [-10, -38];
      P.hold = 'spoon';
      P.mouth = 'smile';
      break;
    case 'think':
      P.pawR = [8, -56];
      P.tilt = 0.08;
      P.look = [1.5, -1.5];
      P.mouth = 'w';
      P.fx = 'question';
      break;
  }
  return P;
}

// Moods choose the face when the pose doesn't.
function moodFace(mood, t, P) {
  const f = { eyes: 'open', mouth: 'w', fx: null, tilt: 0, dirt: false };
  switch (mood) {
    case 'happy': f.mouth = 'smile'; break;
    case 'excited': f.eyes = 'star'; f.mouth = 'open'; f.fx = 'sparkle'; break;
    case 'hungry': f.mouth = 'o'; f.fx = 'rumble'; break;
    case 'sleepy': {
      const yawn = (t % 7) < 1.3;
      f.eyes = yawn ? 'closed' : 'half';
      f.mouth = yawn ? 'yawn' : 'w';
      break;
    }
    case 'bored': f.mouth = 'flat'; P.look = [Math.sin(t * 0.8) * 2.2, -0.5]; break;
    case 'dirty': f.dirt = true; f.mouth = 'w'; break;
    case 'curious': f.eyes = 'wide'; f.tilt = 0.12; f.fx = 'question'; break;
    case 'lonely': f.mouth = 'w'; P.look = [0, 1.2]; f.fx = 'heartOutline'; break;
    case 'relaxed': f.eyes = 'happy'; f.mouth = 'smile'; break;
    case 'proud': f.eyes = 'happy'; f.mouth = 'smile'; f.fx = 'star'; P.sy *= 1.03; break;
  }
  return f;
}

// ------------------------------------------------------------- drawing

// (x, y) = between the feet on the ground; h = height. Options:
// kind ('hammy' | 'mom' | 'dad' | friend id), pose, mood, t, facing (1 | -1),
// fur, outfit {hat, top}, holding (emoji or 'book' / 'mic' / 'brush' / 'spoon'),
// shadow, alpha, dirt, wet, lookAt {x, y}.
function drawHamster(ctx, x, y, h, o = {}) {
  const kind = o.kind || 'hammy';
  const fam = FAMILY[kind], friend = FRIEND[kind];
  const fur = o.fur || (kind === 'hammy' ? FURS[S.hamster.fur] || FURS.golden : fam ? fam.fur : friend ? friend.fur : FURS.golden);
  const u = h / 100, t = (o.t ?? Game.time) + (o.seed || 0), facing = o.facing || 1;
  const P = poseParams(o.pose || 'idle', t, o);
  const M = moodFace(o.mood || 'happy', t, P);
  const eyes = P.eyes || M.eyes, mouth = P.mouth || M.mouth, fx = o.fx === null ? null : (P.fx || M.fx);
  const dirt = o.dirt ?? (M.dirt && kind === 'hammy');
  const outfit = o.outfit || (kind === 'hammy' ? S.outfit : null);
  const top = fam ? fam.top : outfit && outfit.top !== 'none' ? { kind: outfit.top, color: TOPS[outfit.top]?.color } : null;
  const hat = friend?.hat || (outfit && outfit.hat !== 'none' ? outfit.hat : null);
  if (o.lookAt) {
    const dx = o.lookAt.x - x, dy = o.lookAt.y - (y - h * 0.68);
    const m = Math.hypot(dx, dy) || 1;
    P.look = [dx / m * 2.2, dy / m * 1.6];
  }

  ctx.save();
  ctx.translate(x, y);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  if (o.shadow !== false && !P.swim) groundShadow(ctx, 0, 0, u * 36 * (1 + P.by / 120), u * 8, 0.18);
  ctx.translate(0, P.by * u);
  ctx.rotate(P.tilt + M.tilt * (P.tilt ? 0 : 1));
  ctx.scale(P.sx, P.sy);
  ctx.scale(u, u);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const tx = P.turn; // face shifts toward where Hammy is walking
  const line = fur.dark;

  // Feet
  if (!P.swim) {
    for (const [fxp, lift] of [[-13, P.footL], [13, P.footR]]) {
      ellipse(ctx, fxp + (P.sit ? fxp * 0.2 : 0), -3 + lift + (P.sit ? 2 : 0), 9, 5);
      paint(ctx, fur.ear, -8 + lift, 2 + lift, { lw: 1.8, line });
    }
  }

  if (top?.kind === 'cape') drawCape(ctx, top.color, t);

  // Silhouette: body + head, outlined once.
  ctx.lineWidth = 4.4;
  ctx.strokeStyle = line;
  ellipse(ctx, 0, -37, 35, 33); ctx.stroke();
  ellipse(ctx, tx * 0.3, -66, 32, 28); ctx.stroke();
  for (const ex of [-21, 21]) { circle(ctx, ex + tx * 0.2, -90, 10.5); ctx.stroke(); }
  for (const ex of [-21, 21]) {
    circle(ctx, ex + tx * 0.2, -90, 10.5);
    ctx.fillStyle = fur.main;
    ctx.fill();
    circle(ctx, ex + tx * 0.2, -89, 6);
    ctx.fillStyle = fur.ear;
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, -96, 0, 0);
  g.addColorStop(0, shade(fur.main, 0.14));
  g.addColorStop(1, shade(fur.main, -0.04));
  ctx.fillStyle = g;
  ellipse(ctx, 0, -37, 35, 33); ctx.fill();
  ellipse(ctx, tx * 0.3, -66, 32, 28); ctx.fill();
  if (fur.patch) {
    ctx.save();
    ellipse(ctx, tx * 0.3, -66, 32, 28);
    ctx.clip();
    ctx.fillStyle = fur.patch;
    ellipse(ctx, -15 + tx, -76, 13, 11, -0.3);
    ctx.fill();
    ctx.restore();
    circle(ctx, -21 + tx * 0.2, -90, 10.5);
    ctx.fillStyle = fur.patch;
    ctx.fill();
    circle(ctx, -21 + tx * 0.2, -89, 6);
    ctx.fillStyle = fur.ear;
    ctx.fill();
  }
  // Fur tuft on top of the head.
  ctx.strokeStyle = line;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-5 + tx * 0.3, -93);
  ctx.quadraticCurveTo(-2 + tx * 0.3, -99, 1 + tx * 0.3, -93);
  ctx.quadraticCurveTo(4 + tx * 0.3, -99, 6 + tx * 0.3, -93);
  ctx.stroke();

  // Belly and muzzle in the light fur.
  ctx.fillStyle = fur.light;
  ellipse(ctx, 0, -30, 23, 22);
  ctx.fill();
  ellipse(ctx, tx * 0.8, -56, 21 * P.cheeks, 13);
  ctx.fill();

  // Clothes
  if (top) drawTop(ctx, top, fur, t);
  if (dirt) {
    ctx.fillStyle = 'rgba(150,110,80,.45)';
    for (const [dx, dy, r] of [[-20, -30, 5], [14, -18, 4], [18, -48, 3.5], [-10, -78, 4]]) {
      circle(ctx, dx, dy, r);
      ctx.fill();
    }
  }

  // Puffy cheeks with blush
  for (const side of [-1, 1]) {
    const cx = side * 23 + tx * 0.7, r = 10.5 * P.cheeks;
    circle(ctx, cx, -57, r);
    ctx.fillStyle = fur.main;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,128,150,.42)';
    ellipse(ctx, cx, -55, r * 0.62, r * 0.42);
    ctx.fill();
  }

  // Eyes
  const [lx, ly] = P.look;
  for (const side of [-1, 1]) drawEye(ctx, side * 11.5 + tx + lx, -68 + ly, eyes, t + (o.seed || 0), kind === 'mom', side, fur);

  // Nose, mouth, whiskers
  ellipse(ctx, tx * 1.1, -60.5, 3.4, 2.5);
  ctx.fillStyle = '#f58aa0';
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  circle(ctx, tx * 1.1 - 1, -61.3, 0.9);
  ctx.fill();
  drawMouth(ctx, tx * 1.1, -56.5, mouth, t);
  ctx.strokeStyle = shade(fur.dark, -0.1);
  ctx.lineWidth = 1.1;
  const wig = Math.sin(t * 3.2) * 0.06;
  for (const side of [-1, 1]) for (const a of [-0.18, 0.02, 0.22]) {
    const sx0 = side * 15 + tx, sy0 = -57;
    ctx.beginPath();
    ctx.moveTo(sx0, sy0);
    ctx.lineTo(sx0 + side * Math.cos(a + wig) * 15, sy0 + Math.sin(a + wig) * 15);
    ctx.stroke();
  }

  // Accessories for Mom, Dad and friends
  if (fam?.look === 'dad') drawGlasses(ctx, tx);
  if (friend?.glasses) drawGlasses(ctx, tx, '#7c6a96');
  if (friend?.scarf) drawScarf(ctx, friend.scarf);
  if (fam?.look === 'mom') drawBow(ctx, 22 + tx * 0.2, -97, '#ff7fae', 1.1);
  if (hat) drawHat(ctx, hat, tx, friend?.hatColor);

  // Paws in front, then whatever Hammy holds.
  for (const [px, py] of [P.pawL, P.pawR]) {
    ellipse(ctx, px, py, 7.5, 6.5);
    paint(ctx, shade(fur.main, 0.08), py - 6, py + 6, { lw: 1.8, line });
    ctx.fillStyle = fur.ear;
    ellipse(ctx, px, py + 1.5, 3.6, 2.6);
    ctx.fill();
  }
  if (P.hold) drawHeld(ctx, P.hold, P.pawL, P.pawR, t);
  if (P.swim) {
    ellipse(ctx, 0, -26, 44, 14);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ff8fb8';
    ctx.stroke();
    ctx.setLineDash([12, 12]);
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  if (fx && o.fx !== false) drawFx(ctx, fx, x + (P.turn ? P.turn * u : 0), y + P.by * u - h * 1.02, u, t);
}

function drawEye(ctx, x, y, kind, t, lashes, side, fur) {
  const blink = (t * 0.9 + side * 0.01) % 3.6 < 0.12;
  ctx.strokeStyle = '#3a2a24';
  ctx.lineWidth = 2.4;
  if (kind === 'closed' || (blink && kind !== 'happy')) {
    ctx.beginPath();
    ctx.arc(x, y - 1, 5.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    return;
  }
  if (kind === 'happy') {
    ctx.beginPath();
    ctx.arc(x, y + 2, 5.5, Math.PI + 0.3, TAU - 0.3);
    ctx.stroke();
    return;
  }
  const big = kind === 'wide' || kind === 'star' ? 1.15 : 1;
  ellipse(ctx, x, y, 5.8 * big, 6.8 * big);
  ctx.fillStyle = '#2b1b17';
  ctx.fill();
  if (kind === 'star') {
    starPath(ctx, x - 1, y - 1.5, 3.4, 0.45);
    ctx.fillStyle = '#fff6b0';
    ctx.fill();
  } else {
    ctx.fillStyle = '#ffffff';
    circle(ctx, x - 1.8, y - 2.6, 2.4 * big);
    ctx.fill();
    circle(ctx, x + 2, y + 2.2, 1.1);
    ctx.fill();
  }
  if (kind === 'half') {
    ctx.fillStyle = fur.main;
    ctx.beginPath();
    ctx.ellipse(x, y - 3, 7.5, 6, 0, Math.PI, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 2);
    ctx.lineTo(x + 7, y - 2);
    ctx.stroke();
  }
  if (lashes) {
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + side * (0.6 + i * 0.35);
      ctx.moveTo(x + Math.cos(a) * 6, y + Math.sin(a) * 7);
      ctx.lineTo(x + Math.cos(a) * 9.5, y + Math.sin(a) * 10);
    }
    ctx.stroke();
  }
}

function drawMouth(ctx, x, y, kind, t) {
  ctx.strokeStyle = '#7a4a3a';
  ctx.lineWidth = 1.8;
  const omega = () => {
    ctx.beginPath();
    ctx.moveTo(x - 4.5, y);
    ctx.quadraticCurveTo(x - 2.2, y + 3, x, y);
    ctx.quadraticCurveTo(x + 2.2, y + 3, x + 4.5, y);
    ctx.stroke();
  };
  const teeth = (w = 2.6) => {
    ctx.fillStyle = '#ffffff';
    rr(ctx, x - w, y + 0.4, w * 2, 3.6, 1);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,60,.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y + 0.6);
    ctx.lineTo(x, y + 3.8);
    ctx.stroke();
  };
  switch (kind) {
    case 'smile':
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 0.5);
      ctx.quadraticCurveTo(x, y + 6.5, x + 7, y - 0.5);
      ctx.stroke();
      break;
    case 'open': case 'teeth': case 'sing': {
      const open = kind === 'sing' ? 3 + Math.abs(Math.sin(t * 6)) * 4 : kind === 'teeth' ? 4.5 : 5.5;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 0.5);
      ctx.quadraticCurveTo(x, y + open * 2, x + 6, y - 0.5);
      ctx.closePath();
      ctx.fillStyle = '#8a3b4a';
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#ff8fa3';
      ellipse(ctx, x, y + open * 1.5, 4, 2.5);
      ctx.fill();
      teeth(2.4);
      ctx.restore();
      break;
    }
    case 'o':
      ellipse(ctx, x, y + 2, 2.5, 3);
      ctx.fillStyle = '#8a3b4a';
      ctx.fill();
      break;
    case 'yawn':
      ellipse(ctx, x, y + 3.5, 4.5, 6);
      ctx.fillStyle = '#8a3b4a';
      ctx.fill();
      ctx.fillStyle = '#ff8fa3';
      ellipse(ctx, x, y + 6.5, 3, 2.2);
      ctx.fill();
      break;
    case 'munch':
      omega();
      ellipse(ctx, x, y + 2.5, 3, 2);
      ctx.fillStyle = '#8a3b4a';
      ctx.fill();
      break;
    case 'flat':
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 1);
      ctx.lineTo(x + 4, y + 1);
      ctx.stroke();
      break;
    default:
      omega();
      teeth(1.8);
  }
}

function drawGlasses(ctx, tx, color = '#5d4a70') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  for (const side of [-1, 1]) {
    circle(ctx, side * 11.5 + tx, -68, 9);
    ctx.fillStyle = 'rgba(220,240,255,.25)';
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-3 + tx, -69);
  ctx.quadraticCurveTo(tx, -72, 3 + tx, -69);
  ctx.stroke();
}

function drawBow(ctx, x, y, color, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * 14, -12, side * 15, 0);
    ctx.quadraticCurveTo(side * 14, 12, 0, 0);
    paint(ctx, color, -12, 12, { lw: 1.6 });
  }
  circle(ctx, 0, 0, 3.6);
  ctx.fillStyle = shade(color, -0.15);
  ctx.fill();
  ctx.restore();
}

function drawScarf(ctx, color) {
  rr(ctx, -27, -50, 54, 11, 5);
  paint(ctx, color, -50, -39, { lw: 1.6 });
  rr(ctx, 10, -44, 10, 22, 4);
  paint(ctx, shade(color, -0.05), -44, -22, { lw: 1.6 });
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  for (let i = 0; i < 4; i++) ctx.fillRect(-22 + i * 12, -49, 5, 9);
}

function drawTop(ctx, top, fur, t) {
  const c = top.color || '#7cc6ff';
  ctx.save();
  ellipse(ctx, 0, -37, 35, 33);
  ctx.clip();
  const yTop = top.kind === 'overalls' ? -40 : -52;
  if (top.kind === 'cape') { // the cape itself is drawn behind the body (drawCape)
    ctx.restore();
    drawBow(ctx, 0, -50, '#ffd34d', 0.6);
    return;
  }
  rr(ctx, -40, yTop, 80, 60, 12);
  paint(ctx, c, yTop, 0, { lw: 2.2 });
  switch (top.kind) {
    case 'tshirt': case 'sport':
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      if (top.kind === 'sport') drawText(ctx, '5', 0, -28, 20, { color: '#fff', stroke: shade(c, -0.3), sw: 0.15 });
      else { starPath(ctx, 0, -30, 8); ctx.fill(); }
      break;
    case 'overalls':
      ctx.fillStyle = shade(c, 0.15);
      rr(ctx, -12, -36, 24, 16, 4);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = shade(c, -0.1);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-14, -40); ctx.lineTo(-18, -58);
      ctx.moveTo(14, -40); ctx.lineTo(18, -58);
      ctx.stroke();
      ctx.fillStyle = '#ffd34d';
      circle(ctx, -14, -40, 2.8); ctx.fill();
      circle(ctx, 14, -40, 2.8); ctx.fill();
      return;
    case 'dress':
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 9; i++) { circle(ctx, -28 + (i % 3) * 22 + (Math.floor(i / 3) % 2) * 11, -44 + Math.floor(i / 3) * 14, 2.6); ctx.fill(); }
      ctx.restore();
      drawBow(ctx, 0, -50, '#ffffff', 0.55);
      return;
    case 'shirt':
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-9, -53); ctx.lineTo(0, -43); ctx.lineTo(9, -53);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (const by of [-38, -28, -18]) { circle(ctx, 0, by, 1.8); ctx.fill(); }
      break;
    case 'pajamas':
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (let i = 0; i < 6; i++) { starPath(ctx, -24 + (i % 3) * 24, -40 + Math.floor(i / 3) * 18, 4); ctx.fill(); }
      break;
  }
  ctx.restore();
}

function drawCape(ctx, color, t) {
  ctx.beginPath();
  ctx.moveTo(-24, -54);
  ctx.quadraticCurveTo(-50, -20 + Math.sin(t * 3) * 3, -42, 4);
  ctx.lineTo(42, 4);
  ctx.quadraticCurveTo(50, -20 - Math.sin(t * 3) * 3, 24, -54);
  ctx.closePath();
  paint(ctx, color, -54, 4, { lw: 2.4 });
}

function drawHat(ctx, hat, tx, color) {
  const hx = tx * 0.3;
  switch (hat) {
    case 'bow': drawBow(ctx, 18 + hx, -96, '#ff6f9c', 1); break;
    case 'cap': {
      const c = color || '#4dabf7';
      ctx.beginPath();
      ctx.arc(hx, -88, 22, Math.PI, TAU);
      ctx.closePath();
      paint(ctx, c, -110, -88, { lw: 2 });
      ellipse(ctx, hx + 16, -88, 18, 5);
      paint(ctx, shade(c, -0.1), -93, -83, { lw: 2 });
      circle(ctx, hx, -110, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    }
    case 'flower':
      for (let i = 0; i < 5; i++) Art.blossom(ctx, hx - 22 + i * 11, -92 - Math.sin(i / 4 * Math.PI) * 6, 3.6, ['#ff8fb8', '#ffd43b', '#ffffff', '#b197fc', '#ff8fb8'][i]);
      break;
    case 'sunhat':
      ellipse(ctx, hx, -90, 40, 9);
      paint(ctx, '#f6d98a', -99, -81, { lw: 2 });
      ctx.beginPath();
      ctx.arc(hx, -92, 20, Math.PI, TAU);
      ctx.closePath();
      paint(ctx, '#f6d98a', -112, -92, { lw: 2 });
      rr(ctx, hx - 20, -98, 40, 6, 3);
      ctx.fillStyle = '#ff8fb8';
      ctx.fill();
      break;
    case 'beanie':
      ctx.beginPath();
      ctx.arc(hx, -86, 26, Math.PI, TAU);
      ctx.closePath();
      paint(ctx, '#ff8a8a', -112, -86, { lw: 2 });
      rr(ctx, hx - 27, -92, 54, 10, 5);
      paint(ctx, '#ffd0d0', -92, -82, { lw: 2 });
      circle(ctx, hx, -114, 7);
      paint(ctx, '#ffffff', -121, -107, { lw: 2 });
      break;
    case 'party':
      ctx.beginPath();
      ctx.moveTo(hx - 15, -90);
      ctx.lineTo(hx + 2, -132);
      ctx.lineTo(hx + 17, -90);
      ctx.closePath();
      paint(ctx, '#b197fc', -132, -90, { lw: 2 });
      ctx.fillStyle = '#ffd43b';
      for (let i = 0; i < 3; i++) { circle(ctx, hx - 4 + i * 4, -98 - i * 10, 2.6); ctx.fill(); }
      circle(ctx, hx + 2, -134, 5);
      ctx.fillStyle = '#ff6f9c';
      ctx.fill();
      break;
    case 'headphones':
      ctx.strokeStyle = '#7c6a96';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(hx, -78, 30, Math.PI * 1.05, TAU - 0.05);
      ctx.stroke();
      for (const side of [-1, 1]) {
        ellipse(ctx, hx + side * 30, -70, 7, 11);
        paint(ctx, color || '#ff8fb8', -81, -59, { lw: 2 });
      }
      break;
    case 'tophat':
      ellipse(ctx, hx, -92, 26, 6);
      paint(ctx, '#4a4262', -98, -86, { lw: 2 });
      rr(ctx, hx - 16, -126, 32, 34, 4);
      paint(ctx, '#4a4262', -126, -92, { lw: 2 });
      ctx.fillStyle = '#ff6f9c';
      ctx.fillRect(hx - 16, -100, 32, 6);
      break;
    case 'crown':
      ctx.beginPath();
      ctx.moveTo(hx - 18, -90);
      ctx.lineTo(hx - 20, -112);
      ctx.lineTo(hx - 9, -102);
      ctx.lineTo(hx, -116);
      ctx.lineTo(hx + 9, -102);
      ctx.lineTo(hx + 20, -112);
      ctx.lineTo(hx + 18, -90);
      ctx.closePath();
      paint(ctx, '#ffd43b', -116, -90, { lw: 2 });
      ctx.fillStyle = '#ff6f9c';
      circle(ctx, hx, -97, 3);
      ctx.fill();
      ctx.fillStyle = '#4dabf7';
      circle(ctx, hx - 11, -96, 2.4); ctx.fill();
      circle(ctx, hx + 11, -96, 2.4); ctx.fill();
      break;
    case 'raincoat':
      ctx.beginPath();
      ctx.arc(hx, -86, 27, Math.PI, TAU);
      ctx.closePath();
      paint(ctx, '#ffd43b', -113, -86, { lw: 2 });
      ellipse(ctx, hx, -86, 34, 6);
      paint(ctx, '#ffd43b', -92, -80, { lw: 2 });
      break;
    case 'goggles':
      ctx.strokeStyle = '#4dabf7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-30 + hx, -80);
      ctx.lineTo(30 + hx, -80);
      ctx.stroke();
      for (const side of [-1, 1]) {
        circle(ctx, side * 11 + hx, -82, 8);
        ctx.fillStyle = 'rgba(170,225,255,.7)';
        ctx.fill();
        ctx.stroke();
      }
      break;
  }
}

function drawHeld(ctx, item, pawL, pawR, t) {
  const mx = (pawL[0] + pawR[0]) / 2, my = (pawL[1] + pawR[1]) / 2;
  switch (item) {
    case 'book': {
      ctx.save();
      ctx.translate(mx, my - 4);
      box(ctx, -24, -16, 24, 30, 3, '#ff8fb8', { lw: 1.6 });
      box(ctx, 0, -16, 24, 30, 3, '#7cc6ff', { lw: 1.6 });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-21, -13, 19, 24);
      ctx.fillRect(2, -13, 19, 24);
      ctx.strokeStyle = '#c9b6e8';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-18, -8 + i * 5); ctx.lineTo(-5, -8 + i * 5);
        ctx.moveTo(5, -8 + i * 5); ctx.lineTo(18, -8 + i * 5);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'mic':
      ctx.save();
      ctx.translate(pawR[0], pawR[1]);
      ctx.rotate(-0.4);
      box(ctx, -3.5, -2, 7, 20, 3, '#b197fc', { lw: 1.4 });
      circle(ctx, 0, -6, 7);
      paint(ctx, '#d8d2e6', -13, 1, { lw: 1.6 });
      ctx.restore();
      break;
    case 'brush':
      ctx.save();
      ctx.translate(pawR[0] - 6, pawR[1] - 2);
      ctx.rotate(-0.15);
      box(ctx, -16, -2.5, 26, 5, 2.5, '#7cc6ff', { lw: 1.2 });
      box(ctx, -18, -7, 8, 5, 2, '#ffffff', { lw: 1.2 });
      ctx.restore();
      break;
    case 'spoon':
      ctx.save();
      ctx.translate(pawR[0], pawR[1]);
      ctx.rotate(0.5);
      box(ctx, -2.5, -28, 5, 30, 2.5, '#e0b07c', { lw: 1.2 });
      ellipse(ctx, 0, -30, 6, 8);
      paint(ctx, '#e0b07c', -38, -22, { lw: 1.2 });
      ctx.restore();
      break;
    default:
      drawEmoji(ctx, item, mx, my - 6, 26);
  }
}

function drawFx(ctx, fx, x, y, u, t) {
  switch (fx) {
    case 'zzz':
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.45 + i / 3) % 1;
        ctx.globalAlpha = Math.sin(p * Math.PI);
        drawText(ctx, 'z', x + 18 * u + p * 26 * u, y + 20 * u - p * 40 * u, (12 + p * 12) * u, { color: '#8c7ae6', stroke: '#fff', sw: 0.25 });
      }
      ctx.globalAlpha = 1;
      break;
    case 'notes':
      for (let i = 0; i < 2; i++) {
        const p = (t * 0.6 + i / 2) % 1;
        ctx.globalAlpha = Math.sin(p * Math.PI);
        drawText(ctx, i ? '♫' : '♪', x + (i ? -24 : 26) * u + Math.sin(p * 6) * 4 * u, y + 24 * u - p * 36 * u, 20 * u, { color: i ? '#ff8fb8' : '#b197fc', stroke: '#fff', sw: 0.2 });
      }
      ctx.globalAlpha = 1;
      break;
    case 'question': {
      const b = Math.sin(t * 3) * 3 * u;
      drawText(ctx, '?', x + 26 * u, y + 8 * u + b, 26 * u, { color: '#7cc6ff', stroke: '#fff', sw: 0.22 });
      break;
    }
    case 'heart': case 'heartOutline': {
      const p = (t * 0.5) % 1;
      ctx.globalAlpha = Math.sin(p * Math.PI);
      heartPath(ctx, x + 24 * u, y + 16 * u - p * 22 * u, 9 * u);
      if (fx === 'heart') {
        ctx.fillStyle = '#ff7fa8';
        ctx.fill();
      } else {
        ctx.strokeStyle = '#ff9ec4';
        ctx.lineWidth = 2.5 * u;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'sparkle':
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.8 + i / 3) % 1, a = i * 2.1;
        ctx.globalAlpha = Math.sin(p * Math.PI);
        drawStar(ctx, x + Math.cos(a) * 34 * u, y + 40 * u + Math.sin(a) * 30 * u, 6 * u * Math.sin(p * Math.PI) + 1, '#fff3a0');
      }
      ctx.globalAlpha = 1;
      break;
    case 'star':
      drawStar(ctx, x + 28 * u, y + 12 * u + Math.sin(t * 3) * 2 * u, 8 * u, '#ffd34d', t);
      break;
    case 'rumble':
      if (t % 4 < 1.2) {
        ctx.strokeStyle = '#ffb38a';
        ctx.lineWidth = 2.2 * u;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(x + side * 10 * u, y + 72 * u, 10 * u, side < 0 ? Math.PI * 0.7 : -0.3, side < 0 ? Math.PI * 1.3 : 0.3);
          ctx.stroke();
        }
        drawEmoji(ctx, '🍎', x + 30 * u, y + 10 * u, 18 * u);
      }
      break;
    case 'bubbles':
      for (let i = 0; i < 4; i++) {
        const p = (t * 0.5 + i / 4) % 1;
        circle(ctx, x + (i - 1.5) * 12 * u, y + 30 * u - p * 30 * u, (3 + i % 2 * 2) * u);
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(160,210,255,.9)';
        ctx.lineWidth = 1.2 * u;
        ctx.stroke();
      }
      break;
  }
}

// A round portrait of a hamster's face, for the HUD and panels.
function drawPortrait(canvas, opts = {}) {
  const g = canvas.getContext('2d');
  const s = canvas.width;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, s, s);
  const bg = g.createRadialGradient(s / 2, s * 0.4, 0, s / 2, s / 2, s * 0.7);
  bg.addColorStop(0, '#fffaf0');
  bg.addColorStop(1, '#ffe2bd');
  g.fillStyle = bg;
  g.fillRect(0, 0, s, s);
  drawHamster(g, s / 2, s * 1.42, s * 1.45, { shadow: false, fx: false, ...opts });
}
