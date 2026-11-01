// Shared art: the painting primitives that give everything the same soft,
// rounded look (gradient fill + darker outline + drop shadow), patterns,
// sky / day-night / weather, and nature pieces. Furniture and equipment are
// in props.js. All sizes are design units (the view is 1600x900).

const PAL = {
  ink: '#4a3a5c',
  grass: '#a6e08a', grass2: '#94d576', grassDark: '#78c25e',
  path: '#f8e7c8', pathEdge: '#e8cfa4',
  water: '#6fcdf2', waterLight: '#b3ebff', waterDeep: '#4bb4e6',
  sand: '#f7e2aa', sandDark: '#e8cc88',
  wood: '#d39a63', woodLight: '#e8b985', woodDark: '#a8723f',
  cream: '#fff6e6', peach: '#ffcfb0', pink: '#ffb3cf', rose: '#ff8fb8', lavender: '#cdbdff',
  sky: '#9fdcff', mint: '#b6ecc4', yellow: '#ffe48a', orange: '#ffbf80', red: '#ff8a8a', blue: '#8cc8ff',
  white: '#ffffff', leaf: '#7fcf6a', leafDark: '#5fae4f',
};

// The 7 colors children learn, with friendly names.
const COLORS = {
  red: '#ff6b6b', orange: '#ffa94d', yellow: '#ffd43b', green: '#69db7c',
  blue: '#4dabf7', purple: '#b197fc', pink: '#f783ac',
};

// Fill the current path with a soft top-to-bottom gradient and a darker outline.
function paint(ctx, color, y0, y1, { lw = 3, stroke = true, light = 0.2, dark = -0.05, line } = {}) {
  if (color.startsWith('#')) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, shade(color, light));
    g.addColorStop(1, shade(color, dark));
    ctx.fillStyle = g;
  } else ctx.fillStyle = color;
  ctx.fill();
  if (stroke && lw > 0) {
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = line || (color.startsWith('#') ? shade(color, -0.32) : 'rgba(74,58,92,.35)');
    ctx.stroke();
  }
}

// A rounded box painted with `paint`.
function box(ctx, x, y, w, h, r, color, opts) {
  rr(ctx, x, y, w, h, r);
  paint(ctx, color, y, y + h, opts);
}

function groundShadow(ctx, x, y, rx, ry = rx * 0.25, alpha = 0.16) {
  ctx.fillStyle = `rgba(60,40,80,${alpha})`;
  ellipse(ctx, x, y, rx, ry);
  ctx.fill();
}

// Several circles drawn as one soft blob with a single outer outline
// (outlines first, fills on top). Used for canopies, clouds, bushes.
function blob(ctx, circles, color, { lw = 4, line, light = 0.18, highlight = true } = {}) {
  ctx.lineWidth = lw * 2;
  ctx.strokeStyle = line || shade(color, -0.3);
  for (const [x, y, r] of circles) {
    circle(ctx, x, y, r);
    ctx.stroke();
  }
  let top = Infinity, bottom = -Infinity;
  for (const [, y, r] of circles) { top = Math.min(top, y - r); bottom = Math.max(bottom, y + r); }
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, shade(color, light));
  g.addColorStop(1, shade(color, -0.08));
  ctx.fillStyle = g;
  for (const [x, y, r] of circles) {
    circle(ctx, x, y, r);
    ctx.fill();
  }
  if (highlight) {
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    for (const [x, y, r] of circles.slice(0, 3)) {
      circle(ctx, x - r * 0.3, y - r * 0.35, r * 0.4);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------- patterns

const Patterns = {
  map: new Map(),
  // A repeating tile painted at 2x for crispness. paint(g, size) draws one tile.
  get(ctx, key, size, paint) {
    let p = this.map.get(key);
    if (!p) {
      const c = document.createElement('canvas');
      c.width = c.height = size * 2;
      const g = c.getContext('2d');
      g.scale(2, 2);
      paint(g, size);
      p = ctx.createPattern(c, 'repeat');
      p.setTransform?.(new DOMMatrix().scale(0.5));
      this.map.set(key, p);
    }
    return p;
  },
};

function grassPattern(ctx, color = PAL.grass) {
  return Patterns.get(ctx, `grass${color}`, 120, (g, s) => {
    g.fillStyle = color;
    g.fillRect(0, 0, s, s);
    const rnd = seeded(42);
    for (let i = 0; i < 26; i++) {
      const x = rnd() * s, y = rnd() * s;
      g.strokeStyle = shade(color, rnd() > 0.5 ? -0.1 : 0.12);
      g.lineWidth = 2;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x - 2, y - 7);
      g.moveTo(x + 3, y);
      g.lineTo(x + 5, y - 6);
      g.stroke();
    }
  });
}

function sandPattern(ctx) {
  return Patterns.get(ctx, 'sand', 80, (g, s) => {
    g.fillStyle = PAL.sand;
    g.fillRect(0, 0, s, s);
    const rnd = seeded(7);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = rnd() > 0.5 ? PAL.sandDark : '#fff1c9';
      g.fillRect(rnd() * s, rnd() * s, 2, 2);
    }
  });
}

// Wallpaper styles: stripes, dots, hearts, stars, diamonds, plain.
function wallPattern(ctx, style, base, accent) {
  return Patterns.get(ctx, `wall:${style}:${base}:${accent}`, 60, (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    g.fillStyle = accent;
    g.strokeStyle = accent;
    switch (style) {
      case 'stripes': g.fillRect(0, 0, s / 3, s); break;
      case 'dots':
        circle(g, s / 4, s / 4, 4); g.fill();
        circle(g, s * 0.75, s * 0.75, 4); g.fill();
        break;
      case 'hearts': heartPath(g, s / 2, s / 2, 9); g.fill(); break;
      case 'stars': starPath(g, s / 4, s / 4, 6); g.fill(); starPath(g, s * 0.75, s * 0.75, 4); g.fill(); break;
      case 'diamonds':
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(s / 2, 0); g.lineTo(s, s / 2); g.lineTo(s / 2, s); g.lineTo(0, s / 2); g.closePath();
        g.stroke();
        break;
      case 'notes': drawText(g, '♪', s / 3, s / 3, 18, { color: accent }); drawText(g, '♫', s * 0.78, s * 0.8, 14, { color: accent }); break;
      case 'leaves':
        ellipse(g, s / 3, s / 3, 7, 3.5, 0.6); g.fill();
        ellipse(g, s * 0.8, s * 0.78, 6, 3, -0.6); g.fill();
        break;
      case 'checks':
        g.globalAlpha = 0.5;
        g.fillRect(0, 0, s / 2, s / 2);
        g.fillRect(s / 2, s / 2, s / 2, s / 2);
        break;
    }
  });
}

function woodPattern(ctx, color = PAL.woodLight) {
  return Patterns.get(ctx, `wood${color}`, 160, (g, s) => {
    const rnd = seeded(3);
    for (let row = 0; row < 4; row++) {
      const y = row * s / 4, off = row % 2 ? s / 2 : 0;
      for (let k = -1; k < 2; k++) {
        const x = off + k * s;
        g.fillStyle = shade(color, (rnd() - 0.5) * 0.12);
        g.fillRect(x, y, s, s / 4);
        g.strokeStyle = shade(color, -0.18);
        g.lineWidth = 2;
        g.strokeRect(x + 1, y + 1, s - 2, s / 4 - 2);
        g.strokeStyle = shade(color, -0.08);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x + 12, y + s / 8 + 3);
        g.bezierCurveTo(x + s * 0.3, y + s / 8 - 4, x + s * 0.6, y + s / 8 + 6, x + s - 12, y + s / 8);
        g.stroke();
      }
    }
  });
}

function tilePattern(ctx, a = '#ffffff', b = '#d9f0ff', size = 60) {
  return Patterns.get(ctx, `tile${a}${b}${size}`, size, (g, s) => {
    g.fillStyle = a;
    g.fillRect(0, 0, s, s);
    g.fillStyle = b;
    g.fillRect(0, 0, s / 2, s / 2);
    g.fillRect(s / 2, s / 2, s / 2, s / 2);
    g.strokeStyle = 'rgba(120,140,170,.25)';
    g.lineWidth = 1.5;
    g.strokeRect(0, 0, s / 2, s / 2);
    g.strokeRect(s / 2, s / 2, s / 2, s / 2);
  });
}

function carpetPattern(ctx, color) {
  return Patterns.get(ctx, `carpet${color}`, 40, (g, s) => {
    g.fillStyle = color;
    g.fillRect(0, 0, s, s);
    g.fillStyle = shade(color, 0.12);
    circle(g, s / 2, s / 2, 3);
    g.fill();
  });
}

// ------------------------------------------------------ sky, light, weather

const Sky = {
  // Colors for the current time of day and weather.
  colors() {
    const L = Clock.light(), rain = Weather.rainy() ? 1 : Weather.cloudy() ? 0.45 : 0;
    let top = mix('#7cc8ff', '#ff9fb4', L.dusk);
    let bottom = mix('#dff4ff', '#ffd9a0', L.dusk);
    top = mix(top, '#2b2f6e', L.night);
    bottom = mix(bottom, '#5d4f9c', L.night);
    top = mix(top, '#9aa7c2', rain * 0.6 * (1 - L.night));
    bottom = mix(bottom, '#d0d6e6', rain * 0.6 * (1 - L.night));
    return { top, bottom };
  },

  // Sky with sun / moon, stars and drifting clouds, for windows and outdoors.
  draw(ctx, x, y, w, h, { sunX = 0.8, clouds = 3, seed = 1, scale = 1 } = {}) {
    const L = Clock.light(), c = this.colors();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, c.top);
    g.addColorStop(1, c.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    const t = Game.time;
    if (L.night > 0.05) {
      const rnd = seeded(seed * 13);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < Math.round(w * h / 3000) + 4; i++) {
        ctx.globalAlpha = L.night * (0.55 + 0.45 * Math.sin(t * 2 + i));
        circle(ctx, x + rnd() * w, y + rnd() * h * 0.8, (1 + rnd() * 1.6) * scale);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const sy = y + h * (0.25 + 0.5 * L.low), sx = x + w * sunX, r = Math.min(w, h) * 0.12 * scale + 6;
    if (L.night < 0.95 && !Weather.rainy()) {
      ctx.globalAlpha = 1 - L.night;
      Art.sun(ctx, sx, sy, r);
      ctx.globalAlpha = 1;
    }
    if (L.night > 0.05) {
      ctx.globalAlpha = L.night;
      Art.moon(ctx, x + w * (1 - sunX), y + h * 0.28, r * 0.85);
      ctx.globalAlpha = 1;
    }
    const rnd = seeded(seed);
    const n = clouds + (Weather.cloudy() || Weather.rainy() ? 3 : 0);
    for (let i = 0; i < n; i++) {
      const speed = 0.006 + rnd() * 0.01, cx = x + (((rnd() + t * speed) % 1.3) - 0.15) * w, cy = y + h * (0.15 + rnd() * 0.4);
      Art.cloud(ctx, cx, cy, (0.35 + rnd() * 0.35) * scale * Math.min(1.6, w / 300), Weather.rainy() ? '#e3e7f0' : '#ffffff', 0.92 - L.night * 0.4);
    }
    if (Weather.rainy()) Art.rain(ctx, x, y, w, h, 0.5);
    if (Weather.rainbowAfterRain()) Art.rainbow(ctx, x + w * 0.5, y + h * 1.05, Math.min(w, h * 1.5) * 0.6, 0.45);
  },

  // Tint a whole scene for evening / night. Indoor rooms get a softer tint
  // because their lamps are on.
  overlay(ctx, { indoor = false } = {}) {
    const L = Clock.light();
    if (L.dusk > 0.01) {
      ctx.fillStyle = `rgba(255,140,90,${L.dusk * (indoor ? 0.06 : 0.12)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (L.night > 0.01) {
      ctx.fillStyle = `rgba(36,34,100,${L.night * (indoor ? 0.22 : 0.46)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (!indoor && Weather.rainy()) {
      ctx.fillStyle = 'rgba(110,120,150,.16)';
      ctx.fillRect(0, 0, W, H);
    }
  },

  // Warm light from lamps / windows, stronger at night. Call after overlay().
  glow(ctx, x, y, r, color = '#ffe9a8', strength = 1) {
    const a = (0.25 + Clock.light().night * 0.6) * strength;
    if (a < 0.02) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(color, a));
    g.addColorStop(1, hexA(color, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  },
};

function hexA(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
}

// --------------------------------------------------------------------- art

const Art = {
  sun(ctx, x, y, r) {
    const t = Game.time;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.15);
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3);
      ctx.lineTo(Math.cos(a) * r * 1.62, Math.sin(a) * r * 1.62);
      ctx.stroke();
    }
    ctx.restore();
    circle(ctx, x, y, r);
    paint(ctx, '#ffe066', y - r, y + r, { lw: r * 0.1, line: '#ffc93c' });
    ctx.fillStyle = 'rgba(255,140,120,.35)';
    circle(ctx, x - r * 0.42, y + r * 0.2, r * 0.16); ctx.fill();
    circle(ctx, x + r * 0.42, y + r * 0.2, r * 0.16); ctx.fill();
  },

  moon(ctx, x, y, r) {
    ctx.save();
    ctx.shadowColor = 'rgba(255,250,200,.8)';
    ctx.shadowBlur = r * 0.8;
    circle(ctx, x, y, r);
    ctx.fillStyle = '#fff4c2';
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(230,210,140,.5)';
    circle(ctx, x - r * 0.3, y - r * 0.2, r * 0.18); ctx.fill();
    circle(ctx, x + r * 0.25, y + r * 0.3, r * 0.12); ctx.fill();
  },

  cloud(ctx, x, y, s = 1, color = '#ffffff', alpha = 0.95) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    blob(ctx, [[x, y, 34 * s], [x - 38 * s, y + 10 * s, 24 * s], [x + 38 * s, y + 8 * s, 27 * s], [x + 12 * s, y - 18 * s, 24 * s]], color, { lw: 0, highlight: false, light: 0.05 });
    ctx.restore();
  },

  rainbow(ctx, x, y, r, alpha = 0.5) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const band = r * 0.06;
    ctx.lineWidth = band + 1;
    Object.values(COLORS).forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, r - i * band, Math.PI, TAU);
      ctx.stroke();
    });
    ctx.restore();
  },

  rain(ctx, x, y, w, h, density = 1) {
    const t = Game.time, n = Math.round(w * h / 9000 * density) + 6, rnd = seeded(99);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(200,225,255,.75)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const sp = 500 + rnd() * 300, px = x + ((rnd() * w + t * 60) % w), py = y + ((rnd() * h + t * sp) % h);
      ctx.moveTo(px, py);
      ctx.lineTo(px - 5, py + 16);
    }
    ctx.stroke();
    ctx.restore();
  },

  tree(ctx, x, y, s = 1, { kind = 'round', seed = 1, fruit = null, color = PAL.leaf } = {}) {
    const t = Game.time, sway = Math.sin(t * 1.1 + seed * 1.7) * 0.025;
    groundShadow(ctx, x + 6 * s, y, 62 * s, 16 * s);
    ctx.beginPath();
    ctx.moveTo(x - 13 * s, y);
    ctx.quadraticCurveTo(x - 8 * s, y - 40 * s, x - 9 * s, y - 80 * s);
    ctx.lineTo(x + 9 * s, y - 80 * s);
    ctx.quadraticCurveTo(x + 8 * s, y - 40 * s, x + 13 * s, y);
    ctx.closePath();
    paint(ctx, '#b07a4f', y - 80 * s, y, { lw: 3 * s });
    ctx.save();
    ctx.translate(x, y - 90 * s);
    ctx.rotate(sway);
    if (kind === 'pine') {
      for (let i = 0; i < 3; i++) {
        const ty = -i * 36 * s, ww = (62 - i * 14) * s;
        ctx.beginPath();
        ctx.moveTo(-ww, ty + 30 * s);
        ctx.quadraticCurveTo(0, ty - 60 * s, ww, ty + 30 * s);
        ctx.closePath();
        paint(ctx, '#6cc47a', ty - 40 * s, ty + 30 * s, { lw: 3 * s });
      }
    } else {
      const rnd = seeded(seed), c = kind === 'blossom' ? '#ffc6dc' : color;
      const parts = [[0, -10 * s, 58 * s]];
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + rnd() * 0.5;
        parts.push([Math.cos(a) * 42 * s, Math.sin(a) * 30 * s - 8 * s, (32 + rnd() * 12) * s]);
      }
      blob(ctx, parts, c, { lw: 3 * s });
      if (kind === 'blossom') {
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 14; i++) { circle(ctx, (rnd() - 0.5) * 110 * s, (rnd() - 0.6) * 80 * s, 4 * s); ctx.fill(); }
      }
      if (fruit) {
        for (let i = 0; i < 7; i++) {
          const fx = (rnd() - 0.5) * 100 * s, fy = (rnd() - 0.4) * 70 * s;
          circle(ctx, fx, fy, 8 * s);
          paint(ctx, fruit, fy - 8 * s, fy + 8 * s, { lw: 2 * s });
        }
      }
    }
    ctx.restore();
  },

  bush(ctx, x, y, s = 1, { color = PAL.leaf, flowers = null, seed = 2 } = {}) {
    groundShadow(ctx, x, y, 50 * s, 12 * s);
    blob(ctx, [[x, y - 28 * s, 30 * s], [x - 30 * s, y - 16 * s, 22 * s], [x + 30 * s, y - 16 * s, 23 * s]], color, { lw: 3 * s });
    if (flowers) {
      const rnd = seeded(seed);
      for (let i = 0; i < 6; i++) Art.blossom(ctx, x + (rnd() - 0.5) * 70 * s, y - 14 * s - rnd() * 34 * s, 6 * s, flowers);
    }
  },

  blossom(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    for (let p = 0; p < 5; p++) {
      const a = p / 5 * TAU;
      circle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75);
      ctx.fill();
    }
    ctx.fillStyle = '#fff2a8';
    circle(ctx, x, y, r * 0.6);
    ctx.fill();
  },

  flower(ctx, x, y, s = 1, color = COLORS.pink, kind = 'daisy', seed = 0) {
    const t = Game.time, sw = Math.sin(t * 2 + seed + x * 0.01) * 4 * s, top = y - 46 * s;
    ctx.strokeStyle = '#5fae4f';
    ctx.lineWidth = 4 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sw * 0.3, y - 25 * s, x + sw, top);
    ctx.stroke();
    ctx.fillStyle = '#7fcf6a';
    ellipse(ctx, x - 8 * s, y - 18 * s, 9 * s, 4 * s, -0.6);
    ctx.fill();
    const fx = x + sw, fy = top;
    switch (kind) {
      case 'tulip':
        ctx.beginPath();
        ctx.moveTo(fx - 12 * s, fy - 12 * s);
        ctx.lineTo(fx - 6 * s, fy - 4 * s);
        ctx.lineTo(fx, fy - 14 * s);
        ctx.lineTo(fx + 6 * s, fy - 4 * s);
        ctx.lineTo(fx + 12 * s, fy - 12 * s);
        ctx.quadraticCurveTo(fx + 13 * s, fy + 10 * s, fx, fy + 10 * s);
        ctx.quadraticCurveTo(fx - 13 * s, fy + 10 * s, fx - 12 * s, fy - 12 * s);
        paint(ctx, color, fy - 14 * s, fy + 10 * s, { lw: 2 * s });
        break;
      case 'sunflower':
        ctx.fillStyle = '#ffd43b';
        for (let p = 0; p < 12; p++) {
          const a = p / 12 * TAU;
          ellipse(ctx, fx + Math.cos(a) * 13 * s, fy + Math.sin(a) * 13 * s, 9 * s, 4.5 * s, a);
          ctx.fill();
        }
        circle(ctx, fx, fy, 10 * s);
        paint(ctx, '#a0662f', fy - 10 * s, fy + 10 * s, { lw: 2 * s });
        break;
      case 'rose':
        circle(ctx, fx, fy, 12 * s);
        paint(ctx, color, fy - 12 * s, fy + 12 * s, { lw: 2 * s });
        ctx.strokeStyle = shade(color, -0.25);
        ctx.lineWidth = 2 * s;
        ctx.beginPath();
        ctx.arc(fx, fy, 6 * s, 0, Math.PI * 1.5);
        ctx.stroke();
        break;
      default:
        ctx.fillStyle = color;
        for (let p = 0; p < 6; p++) {
          const a = p / 6 * TAU;
          ellipse(ctx, fx + Math.cos(a) * 10 * s, fy + Math.sin(a) * 10 * s, 8 * s, 5 * s, a);
          ctx.fill();
        }
        circle(ctx, fx, fy, 6.5 * s);
        ctx.fillStyle = '#ffe066';
        ctx.fill();
    }
  },

  grassTuft(ctx, x, y, s = 1) {
    ctx.strokeStyle = PAL.grassDark;
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [dx, h] of [[-6, 14], [0, 20], [6, 13]]) {
      ctx.moveTo(x + dx * s, y);
      ctx.lineTo(x + dx * 1.6 * s, y - h * s);
    }
    ctx.stroke();
  },

  butterfly(ctx, x, y, s = 1, color = COLORS.blue, t = Game.time) {
    const flap = 0.25 + Math.abs(Math.sin(t * 12)) * 0.75;
    ctx.save();
    ctx.translate(x, y);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side * flap, 1);
      ellipse(ctx, 11 * s, -7 * s, 12 * s, 9 * s, 0.5);
      paint(ctx, color, -16 * s, 2 * s, { lw: 1.5 * s });
      ellipse(ctx, 9 * s, 7 * s, 8 * s, 6 * s, -0.4);
      paint(ctx, shade(color, 0.25), 1 * s, 13 * s, { lw: 1.5 * s });
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      circle(ctx, 12 * s, -8 * s, 3 * s);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#5a4570';
    ellipse(ctx, 0, 0, 2.5 * s, 10 * s);
    ctx.fill();
    ctx.strokeStyle = '#5a4570';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(-1, -9 * s); ctx.quadraticCurveTo(-5 * s, -16 * s, -7 * s, -17 * s);
    ctx.moveTo(1, -9 * s); ctx.quadraticCurveTo(5 * s, -16 * s, 7 * s, -17 * s);
    ctx.stroke();
    ctx.restore();
  },

  bird(ctx, x, y, s = 1, t = Game.time) {
    const f = Math.sin(t * 10) * 6 * s;
    ctx.strokeStyle = '#5a4a70';
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 14 * s, y - f);
    ctx.quadraticCurveTo(x - 6 * s, y - 6 * s, x, y);
    ctx.quadraticCurveTo(x + 6 * s, y - 6 * s, x + 14 * s, y - f);
    ctx.stroke();
  },

  water(ctx, x, y, w, h, r, { color = PAL.water, t = Game.time, ripples = true } = {}) {
    rr(ctx, x, y, w, h, r);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, shade(color, 0.15));
    g.addColorStop(1, shade(color, -0.12));
    ctx.fillStyle = g;
    ctx.fill();
    if (!ripples) return;
    ctx.save();
    rr(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const rnd = seeded(Math.round(x + y));
    for (let i = 0; i < Math.round(w * h / 9000) + 3; i++) {
      const px = x + rnd() * w, py = y + rnd() * h, ph = rnd() * TAU, len = 18 + rnd() * 24;
      const o = Math.sin(t * 1.5 + ph) * 8;
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + ph);
      ctx.beginPath();
      ctx.moveTo(px + o, py);
      ctx.quadraticCurveTo(px + o + len / 2, py - 5, px + o + len, py);
      ctx.stroke();
    }
    ctx.restore();
  },

  pond(ctx, x, y, rx, ry, { fish = true } = {}) {
    ellipse(ctx, x, y + 6, rx + 10, ry + 8);
    ctx.fillStyle = '#c9b79c';
    ctx.fill();
    ctx.save();
    ellipse(ctx, x, y, rx, ry);
    ctx.clip();
    Art.water(ctx, x - rx, y - ry, rx * 2, ry * 2, 0);
    if (fish) {
      const t = Game.time;
      for (let i = 0; i < 3; i++) {
        const a = t * 0.5 + i * 2.1, fx = x + Math.cos(a) * rx * 0.55, fy = y + Math.sin(a) * ry * 0.45;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = ['#ffa94d', '#ff8787', '#ffd43b'][i];
        ellipse(ctx, 0, 0, 12, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(-20, -7); ctx.lineTo(-20, 7);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
    ctx.fillStyle = '#7fcf6a';
    for (const [dx, dy] of [[-0.6, -0.3], [0.5, 0.35], [0.2, -0.5]]) {
      ellipse(ctx, x + dx * rx, y + dy * ry, 18, 10);
      ctx.fill();
    }
  },

  fountain(ctx, x, y, s = 1) {
    const t = Game.time;
    groundShadow(ctx, x, y + 8 * s, 90 * s, 20 * s);
    ellipse(ctx, x, y, 86 * s, 26 * s);
    paint(ctx, '#e9e3f2', y - 26 * s, y + 26 * s, { lw: 4 * s });
    ellipse(ctx, x, y - 4 * s, 72 * s, 18 * s);
    ctx.fillStyle = PAL.water;
    ctx.fill();
    rr(ctx, x - 12 * s, y - 70 * s, 24 * s, 66 * s, 8 * s);
    paint(ctx, '#e9e3f2', y - 70 * s, y, { lw: 3 * s });
    ellipse(ctx, x, y - 70 * s, 34 * s, 10 * s);
    paint(ctx, '#f3eefa', y - 80 * s, y - 60 * s, { lw: 3 * s });
    ctx.strokeStyle = 'rgba(170,225,255,.9)';
    ctx.lineWidth = 4 * s;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + t * 0.4, dx = Math.cos(a) * 44 * s;
      ctx.beginPath();
      ctx.moveTo(x, y - 82 * s);
      ctx.quadraticCurveTo(x + dx * 0.5, y - 120 * s, x + dx, y - 8 * s + Math.sin(a) * 8 * s);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 5; i++) {
      const p = (t * 0.8 + i / 5) % 1;
      circle(ctx, x + Math.sin(i * 7) * 30 * s * p, y - 82 * s - 40 * s * Math.sin(p * Math.PI), 3 * s);
      ctx.fill();
    }
  },

  rock(ctx, x, y, s = 1) {
    ctx.beginPath();
    ctx.moveTo(x - 20 * s, y);
    ctx.quadraticCurveTo(x - 22 * s, y - 18 * s, x - 4 * s, y - 20 * s);
    ctx.quadraticCurveTo(x + 18 * s, y - 22 * s, x + 20 * s, y);
    ctx.closePath();
    paint(ctx, '#cfc6d8', y - 22 * s, y, { lw: 2.5 * s });
  },

  fence(ctx, x1, y, x2, { color = '#ffffff', h = 46 } = {}) {
    const n = Math.max(2, Math.round((x2 - x1) / 30));
    for (let i = 0; i <= n; i++) {
      const px = x1 + (x2 - x1) * i / n;
      ctx.beginPath();
      ctx.moveTo(px - 7, y);
      ctx.lineTo(px - 7, y - h + 6);
      ctx.lineTo(px, y - h);
      ctx.lineTo(px + 7, y - h + 6);
      ctx.lineTo(px + 7, y);
      ctx.closePath();
      paint(ctx, color, y - h, y, { lw: 2 });
    }
    for (const fy of [y - h * 0.35, y - h * 0.72]) box(ctx, x1 - 6, fy - 4, x2 - x1 + 12, 8, 3, color, { lw: 2 });
  },

  lamppost(ctx, x, y, s = 1) {
    rr(ctx, x - 4 * s, y - 120 * s, 8 * s, 120 * s, 3 * s);
    paint(ctx, '#7c6a96', y - 120 * s, y, { lw: 2 * s });
    circle(ctx, x, y - 128 * s, 13 * s);
    paint(ctx, '#fff1b8', y - 141 * s, y - 115 * s, { lw: 3 * s, line: '#7c6a96' });
  },

  bench(ctx, x, y, s = 1, color = PAL.wood) {
    groundShadow(ctx, x, y, 60 * s, 10 * s);
    for (const lx of [-46, 40]) box(ctx, x + lx * s, y - 30 * s, 8 * s, 30 * s, 2, '#7c6a96', { lw: 2 });
    box(ctx, x - 56 * s, y - 36 * s, 112 * s, 12 * s, 5 * s, color, { lw: 2.5 });
    box(ctx, x - 56 * s, y - 66 * s, 112 * s, 12 * s, 5 * s, color, { lw: 2.5 });
  },

  path(ctx, pts, width = 60) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [w, c] of [[width + 10, PAL.pathEdge], [width, PAL.path]]) {
      ctx.lineWidth = w;
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    }
  },

  // Rows of grass and flowers along the bottom of an outdoor scene.
  meadow(ctx, y, { seed = 5, flowers = 14 } = {}) {
    const rnd = seeded(seed);
    for (let i = 0; i < 30; i++) Art.grassTuft(ctx, rnd() * W, y + rnd() * (H - y), 1 + rnd() * 0.5);
    const kinds = ['daisy', 'tulip', 'daisy', 'rose'], cols = Object.values(COLORS);
    for (let i = 0; i < flowers; i++) Art.flower(ctx, rnd() * W, y + 30 + rnd() * (H - y - 30), 0.55 + rnd() * 0.3, cols[Math.floor(rnd() * cols.length)], kinds[i % kinds.length], i);
  },
};

// A speech bubble pointing down at (x, y), sized to its text.
function speechBubble(ctx, text, x, y, { size = 26, maxW = 420, color = '#fff', ink = PAL.ink, icon = null } = {}) {
  const lines = wrapLines(ctx, text, maxW, size);
  ctx.font = `700 ${size}px ${FONT}`;
  const iconW = icon ? size * 1.5 : 0;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + size * 1.4 + iconW, lh = size * 1.25, h = lines.length * lh + size * 0.9;
  const bx = clamp(x - w / 2, 10, W - w - 10), by = Math.max(10, y - h - 18);
  ctx.save();
  ctx.shadowColor = 'rgba(74,58,92,.25)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  rr(ctx, bx, by, w, h, Math.min(h / 2, 28));
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  const tx = clamp(x, bx + 24, bx + w - 24);
  ctx.beginPath();
  ctx.moveTo(tx - 12, by + h - 1);
  ctx.lineTo(tx, by + h + 16);
  ctx.lineTo(tx + 12, by + h - 1);
  ctx.fillStyle = color;
  ctx.fill();
  if (icon) drawEmoji(ctx, icon, bx + size * 0.7 + iconW / 2 - size * 0.25, by + h / 2, size * 1.35);
  lines.forEach((l, i) => drawText(ctx, l, bx + size * 0.7 + iconW, by + size * 0.45 + lh * (i + 0.5), size, { align: 'left', color: ink }));
  return { x: bx, y: by, w, h };
}
