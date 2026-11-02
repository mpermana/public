// Furniture and equipment, drawn with the soft primitives from art.js.
// Convention: floor items take (x, y) = bottom center; wall items take the
// top-left corner plus a size. `s` scales an item from its natural size.

const Props = {
  // ------------------------------------------------------------ walls & co.

  window(ctx, x, y, w, h, { curtain = '#ffb3cf', seed = 1 } = {}) {
    box(ctx, x - 10, y - 10, w + 20, h + 20, 14, '#ffffff', { lw: 3 });
    ctx.save();
    rr(ctx, x, y, w, h, 8);
    ctx.clip();
    Sky.draw(ctx, x, y, w, h, { seed, clouds: 2, scale: 0.6 });
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
    box(ctx, x - 22, y + h + 4, w + 44, 14, 6, '#ffffff', { lw: 2.5 });
    if (curtain) {
      for (const side of [0, 1]) {
        const cx = side ? x + w + 4 : x - 4, dir = side ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(cx - dir * 22, y - 18);
        ctx.lineTo(cx + dir * 48, y - 18);
        ctx.quadraticCurveTo(cx + dir * 18, y + h * 0.4, cx + dir * 30, y + h + 10);
        ctx.lineTo(cx - dir * 22, y + h + 10);
        ctx.closePath();
        paint(ctx, curtain, y, y + h, { lw: 2.5 });
      }
      box(ctx, x - 40, y - 26, w + 80, 12, 6, '#c8a27a', { lw: 2 });
    }
  },

  door(ctx, x, y, w, h, color = '#e8b985', { knob = true } = {}) {
    rr(ctx, x - 8, y - 8, w + 16, h + 8, 14);
    paint(ctx, '#ffffff', y, y + h, { lw: 3 });
    rr(ctx, x, y, w, h, 10);
    paint(ctx, color, y, y + h, { lw: 3 });
    for (const py of [0.12, 0.55]) box(ctx, x + w * 0.16, y + h * py, w * 0.68, h * 0.32, 8, shade(color, 0.12), { lw: 2 });
    if (knob) {
      circle(ctx, x + w * 0.82, y + h * 0.52, 7);
      paint(ctx, '#ffd34d', y + h * 0.5, y + h * 0.55, { lw: 2 });
    }
  },

  // An opening in the side wall that leads to the next room. Only the frame
  // is painted into the backdrop: the peek of the room beyond, the sill and
  // the arrows are drawn live each frame (scene.drawGateways in location.js).
  doorway(ctx, side, icon) {
    const x = side < 0 ? -70 : W - GATE.w, w = GATE.w + 70, y = GATE.top, h = H - y + 20;
    ctx.save();
    rr(ctx, x, y, w, h, 110);
    ctx.clip();
    // A warm glow stands in for the next room wherever the live peek is not
    // drawn — the dollhouse thumbnails, for one.
    const g = ctx.createLinearGradient(side < 0 ? 0 : W, 0, side < 0 ? GATE.w : W - GATE.w, 0);
    g.addColorStop(0, '#f0d9bd');
    g.addColorStop(1, '#fff6e6');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    if (icon) drawEmoji(ctx, icon, side < 0 ? GATE.w / 2 : W - GATE.w / 2, y + 150, 56);
    ctx.restore();
    // The jamb: a thick white frame with a warm liner.
    rr(ctx, x, y, w, h, 110);
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#e9c6a4';
    ctx.stroke();
    // The shadow the jamb casts back into this room.
    const sx = side < 0 ? GATE.w : W - GATE.w - 130;
    const sg = ctx.createLinearGradient(side < 0 ? sx : sx + 130, 0, side < 0 ? sx + 130 : sx, 0);
    sg.addColorStop(0, 'rgba(74,58,92,.13)');
    sg.addColorStop(1, 'rgba(74,58,92,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(sx, y, 130, H);
  },

  // The stairwell at the left of a floor: up the back wall, or down through
  // the floor. The steps and the room beyond are drawn live by the scene.
  stairwell(ctx, d) {
    const r = gateRect(d), up = d.stairs === 'up', round = up ? 100 : 54;
    ctx.save();
    rr(ctx, r.x, r.y, r.w, r.h, round);
    ctx.clip();
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, up ? '#fff3e0' : '#a4897a');
    g.addColorStop(1, up ? '#dcbf9f' : '#6f5b50');
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();
    rr(ctx, r.x, r.y, r.w, r.h, round);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#e9c6a4';
    ctx.stroke();
  },

  picture(ctx, x, y, w, h, { frame = '#e8b985', kind = 'landscape' } = {}) {
    box(ctx, x - 8, y - 8, w + 16, h + 16, 6, frame, { lw: 2.5 });
    ctx.save();
    rr(ctx, x, y, w, h, 3);
    ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    switch (kind) {
      case 'family':
        g.addColorStop(0, '#ffe9f2'); g.addColorStop(1, '#ffd2e3');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        drawHamster(ctx, x + w * 0.25, y + h * 1.02, h * 0.75, { kind: 'mom', mood: 'happy' });
        drawHamster(ctx, x + w * 0.75, y + h * 1.02, h * 0.8, { kind: 'dad', mood: 'happy' });
        drawHamster(ctx, x + w * 0.5, y + h * 1.04, h * 0.55, { kind: 'hammy', mood: 'happy' });
        break;
      case 'flower':
        g.addColorStop(0, '#fff8d6'); g.addColorStop(1, '#fff0b3');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        Art.flower(ctx, x + w * 0.5, y + h * 0.95, h / 60, COLORS.pink, 'tulip', 1);
        break;
      case 'heart':
        ctx.fillStyle = '#fff0f5'; ctx.fillRect(x, y, w, h);
        heartPath(ctx, x + w / 2, y + h * 0.55, Math.min(w, h) * 0.42);
        ctx.fillStyle = COLORS.pink; ctx.fill();
        break;
      case 'hammy':
        ctx.fillStyle = '#e8f6ff'; ctx.fillRect(x, y, w, h);
        drawHamster(ctx, x + w / 2, y + h * 1.05, h * 0.9, { kind: 'hammy', mood: 'happy' });
        break;
      default:
        g.addColorStop(0, '#a8deff'); g.addColorStop(1, '#e0f5ff');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#9fdc7c';
        ellipse(ctx, x + w * 0.3, y + h * 1.05, w * 0.6, h * 0.45); ctx.fill();
        ctx.fillStyle = '#86cf66';
        ellipse(ctx, x + w * 0.85, y + h * 1.1, w * 0.5, h * 0.45); ctx.fill();
        ctx.fillStyle = '#ffe066';
        circle(ctx, x + w * 0.78, y + h * 0.28, h * 0.13); ctx.fill();
    }
    ctx.restore();
  },

  // A wall clock that shows the game's time.
  wallClock(ctx, x, y, r) {
    circle(ctx, x, y, r + 6);
    paint(ctx, '#ffb3cf', y - r, y + r, { lw: 3 });
    circle(ctx, x, y, r);
    ctx.fillStyle = '#fffdf6';
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      ctx.fillStyle = i % 3 ? '#cbbfd9' : '#7b6a8f';
      circle(ctx, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, i % 3 ? r * 0.05 : r * 0.08);
      ctx.fill();
    }
    const m = S.time.minute, hA = (m / 60 % 12) / 12 * TAU - Math.PI / 2, mA = (m % 60) / 60 * TAU - Math.PI / 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5b3fa0';
    ctx.lineWidth = r * 0.12;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(hA) * r * 0.45, y + Math.sin(hA) * r * 0.45); ctx.stroke();
    ctx.strokeStyle = '#ff6f9c';
    ctx.lineWidth = r * 0.07;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(mA) * r * 0.7, y + Math.sin(mA) * r * 0.7); ctx.stroke();
    ctx.fillStyle = '#ffd34d';
    circle(ctx, x, y, r * 0.09);
    ctx.fill();
  },

  rug(ctx, x, y, rx, ry, color = '#ffc6dc', { stripes = true } = {}) {
    ellipse(ctx, x, y, rx, ry);
    paint(ctx, color, y - ry, y + ry, { lw: 3 });
    if (stripes) {
      ctx.strokeStyle = shade(color, 0.3);
      ctx.lineWidth = 6;
      ellipse(ctx, x, y, rx * 0.72, ry * 0.7);
      ctx.stroke();
      ctx.strokeStyle = shade(color, -0.1);
      ctx.lineWidth = 4;
      ellipse(ctx, x, y, rx * 0.45, ry * 0.42);
      ctx.stroke();
    }
  },

  plant(ctx, x, y, s = 1, { pot = '#ff9e7a', seed = 4 } = {}) {
    groundShadow(ctx, x, y, 36 * s, 8 * s);
    const rnd = seeded(seed);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.32 + (rnd() - 0.5) * 0.2, len = (60 + rnd() * 30) * s;
      ctx.save();
      ctx.translate(x, y - 50 * s);
      ctx.rotate(a + Math.PI / 2 + Math.sin(Game.time + i) * 0.03);
      ellipse(ctx, 0, -len / 2, 13 * s, len / 2);
      paint(ctx, i % 2 ? PAL.leaf : '#8fdc7a', -len, 0, { lw: 2 * s });
      ctx.restore();
    }
    ctx.beginPath();
    ctx.moveTo(x - 30 * s, y - 56 * s);
    ctx.lineTo(x + 30 * s, y - 56 * s);
    ctx.lineTo(x + 22 * s, y);
    ctx.lineTo(x - 22 * s, y);
    ctx.closePath();
    paint(ctx, pot, y - 56 * s, y, { lw: 3 * s });
    box(ctx, x - 34 * s, y - 62 * s, 68 * s, 12 * s, 5 * s, shade(pot, 0.1), { lw: 2.5 * s });
  },

  floorLamp(ctx, x, y, s = 1, shadeColor = '#ffe48a') {
    groundShadow(ctx, x, y, 30 * s, 7 * s);
    box(ctx, x - 22 * s, y - 10 * s, 44 * s, 10 * s, 5 * s, '#9c87b8', { lw: 2 });
    box(ctx, x - 4 * s, y - 200 * s, 8 * s, 192 * s, 4 * s, '#9c87b8', { lw: 2 });
    ctx.beginPath();
    ctx.moveTo(x - 26 * s, y - 196 * s);
    ctx.lineTo(x + 26 * s, y - 196 * s);
    ctx.lineTo(x + 40 * s, y - 250 * s);
    ctx.lineTo(x - 40 * s, y - 250 * s);
    ctx.closePath();
    ctx.save();
    ctx.scale(1, 1);
    paint(ctx, shadeColor, y - 250 * s, y - 196 * s, { lw: 3 });
    ctx.restore();
  },

  tableLamp(ctx, x, y, s = 1, color = '#ffd6a8', lit = true) {
    box(ctx, x - 6 * s, y - 40 * s, 12 * s, 40 * s, 4 * s, '#c9b6e8', { lw: 2 });
    ctx.beginPath();
    ctx.moveTo(x - 20 * s, y - 38 * s);
    ctx.lineTo(x + 20 * s, y - 38 * s);
    ctx.lineTo(x + 30 * s, y - 74 * s);
    ctx.lineTo(x - 30 * s, y - 74 * s);
    ctx.closePath();
    paint(ctx, lit ? color : shade(color, -0.25), y - 74 * s, y - 38 * s, { lw: 2.5 });
  },

  bookshelf(ctx, x, y, w = 220, h = 300, { color = '#d39a63', seed = 3, toys = false } = {}) {
    groundShadow(ctx, x, y, w * 0.55, 12);
    box(ctx, x - w / 2, y - h, w, h, 12, color, { lw: 3 });
    const shelves = 3, sh = (h - 30) / shelves, rnd = seeded(seed), cols = ['#ff8a8a', '#ffb366', '#ffd43b', '#7ed99a', '#7cc6ff', '#b197fc', '#f783ac'];
    for (let i = 0; i < shelves; i++) {
      const sy = y - h + 15 + i * sh;
      rr(ctx, x - w / 2 + 12, sy, w - 24, sh - 10, 6);
      ctx.fillStyle = shade(color, -0.25);
      ctx.fill();
      let bx = x - w / 2 + 18;
      while (bx < x + w / 2 - 34) {
        if (toys && rnd() < 0.2) {
          drawEmoji(ctx, ['🧸', '🚂', '🪀', '🦕'][Math.floor(rnd() * 4)], bx + 18, sy + sh - 32, 40);
          bx += 40;
          continue;
        }
        const bw = 12 + rnd() * 10, bh = sh * (0.55 + rnd() * 0.32);
        box(ctx, bx, sy + sh - 12 - bh, bw, bh, 3, cols[Math.floor(rnd() * cols.length)], { lw: 1.5 });
        bx += bw + 2;
      }
      box(ctx, x - w / 2 + 6, sy + sh - 12, w - 12, 10, 3, shade(color, 0.08), { lw: 2 });
    }
  },

  sofa(ctx, x, y, w = 380, color = '#b9a4ff') {
    const h = w * 0.42;
    groundShadow(ctx, x, y, w * 0.55, 16);
    box(ctx, x - w / 2 + 16, y - h, w - 32, h * 0.62, 30, color, { lw: 3 });
    for (let i = 0; i < 3; i++) {
      const cw = (w - 80) / 3;
      box(ctx, x - w / 2 + 40 + i * cw, y - h * 0.58, cw - 4, h * 0.3, 16, shade(color, 0.12), { lw: 2.5 });
    }
    box(ctx, x - w / 2 + 30, y - h * 0.36, w - 60, h * 0.26, 14, shade(color, -0.04), { lw: 3 });
    for (const side of [-1, 1]) box(ctx, x + side * (w / 2 - 26) - 26, y - h * 0.68, 52, h * 0.62, 24, shade(color, 0.05), { lw: 3 });
    for (const side of [-1, 1]) box(ctx, x + side * (w / 2 - 40) - 8, y - 12, 16, 14, 4, '#9c7a5a', { lw: 2 });
  },

  armchair(ctx, x, y, s = 1, color = '#ffb38a') {
    Props.sofa(ctx, x, y, 200 * s, color);
  },

  coffeeTable(ctx, x, y, w = 220, color = '#d39a63') {
    groundShadow(ctx, x, y, w * 0.55, 10);
    for (const lx of [-w / 2 + 20, w / 2 - 34]) box(ctx, x + lx, y - 50, 14, 50, 4, shade(color, -0.1), { lw: 2 });
    box(ctx, x - w / 2, y - 66, w, 20, 10, color, { lw: 3 });
  },

  table(ctx, x, y, w = 320, h = 130, { color = '#e0b07c', cloth = '#ffd6e5' } = {}) {
    groundShadow(ctx, x, y, w * 0.55, 12);
    for (const lx of [-w / 2 + 26, w / 2 - 40]) box(ctx, x + lx, y - h + 20, 14, h - 20, 5, shade(color, -0.12), { lw: 2 });
    box(ctx, x - w / 2, y - h, w, 22, 10, color, { lw: 3 });
    if (cloth) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 - 6, y - h - 2);
      ctx.lineTo(x + w / 2 + 6, y - h - 2);
      ctx.lineTo(x + w / 2 + 2, y - h + 34);
      for (let i = 8; i >= 0; i--) ctx.quadraticCurveTo(x - w / 2 + w * (i + 0.5) / 8, y - h + 46, x - w / 2 + w * i / 8, y - h + 34);
      ctx.closePath();
      paint(ctx, cloth, y - h, y - h + 46, { lw: 2.5 });
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (let i = 0; i < 6; i++) { circle(ctx, x - w / 2 + 24 + i * (w - 48) / 5, y - h + 16, 4); ctx.fill(); }
    }
  },

  chair(ctx, x, y, s = 1, color = '#ffd27a', facing = 1) {
    groundShadow(ctx, x, y, 34 * s, 7 * s);
    const bx = x - facing * 26 * s;
    box(ctx, bx - 8 * s, y - 150 * s, 16 * s, 150 * s, 6 * s, shade(color, -0.08), { lw: 2 });
    box(ctx, bx - 10 * s, y - 158 * s, 20 * s, 64 * s, 10 * s, color, { lw: 2.5 });
    box(ctx, x - 34 * s, y - 72 * s, 68 * s, 16 * s, 7 * s, color, { lw: 2.5 });
    box(ctx, x + facing * 22 * s - 6 * s, y - 60 * s, 12 * s, 60 * s, 4 * s, shade(color, -0.12), { lw: 2 });
  },

  bedBack(ctx, x, y, w = 460, color = '#b9a4ff') {
    groundShadow(ctx, x, y, w * 0.55, 16);
    box(ctx, x - w / 2, y - 250, 46, 250, 22, shade(color, -0.05), { lw: 3 });
    heartPath(ctx, x - w / 2 + 23, y - 205, 14);
    ctx.fillStyle = '#ffd6e5';
    ctx.fill();
    box(ctx, x + w / 2 - 30, y - 140, 30, 140, 14, shade(color, -0.05), { lw: 3 });
    box(ctx, x - w / 2 + 30, y - 120, w - 50, 70, 24, '#ffffff', { lw: 3 });
    box(ctx, x - w / 2 + 40, y - 50, w - 70, 30, 10, shade(color, -0.2), { lw: 2.5 });
    box(ctx, x - w / 2 + 44, y - 168, 120, 60, 28, '#fff4fb', { lw: 3 });
  },
  bedBlanket(ctx, x, y, w = 460, color = '#ffc6dc', { pulled = 0 } = {}) {
    const bx = x - w / 2 + 120 + pulled * 160;
    ctx.beginPath();
    ctx.moveTo(bx, y - 132);
    ctx.quadraticCurveTo((bx + x + w / 2) / 2, y - 152, x + w / 2 - 26, y - 128);
    ctx.lineTo(x + w / 2 - 20, y - 46);
    ctx.lineTo(bx - 14, y - 46);
    ctx.quadraticCurveTo(bx - 24, y - 92, bx, y - 132);
    ctx.closePath();
    paint(ctx, color, y - 150, y - 46, { lw: 3 });
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    for (let i = 0; i < 12; i++) { starPath(ctx, bx + 20 + (i % 6) * 52, y - 110 + Math.floor(i / 6) * 36, 8); ctx.fill(); }
    ctx.restore();
  },

  wardrobe(ctx, x, y, w = 220, h = 340, color = '#ffd0a8') {
    groundShadow(ctx, x, y, w * 0.55, 12);
    box(ctx, x - w / 2, y - h, w, h, 16, color, { lw: 3 });
    for (const side of [-1, 1]) {
      box(ctx, x + (side < 0 ? -w / 2 + 12 : 4), y - h + 14, w / 2 - 16, h - 46, 10, shade(color, 0.1), { lw: 2.5 });
      circle(ctx, x + side * 14, y - h / 2, 7);
      paint(ctx, '#ffd34d', y - h / 2 - 7, y - h / 2 + 7, { lw: 2 });
    }
    box(ctx, x - w / 2 - 8, y - h - 14, w + 16, 20, 8, shade(color, -0.05), { lw: 3 });
  },

  nightstand(ctx, x, y, s = 1, color = '#ffd0a8', lit = true) {
    groundShadow(ctx, x, y, 44 * s, 9 * s);
    box(ctx, x - 40 * s, y - 90 * s, 80 * s, 90 * s, 10 * s, color, { lw: 3 });
    box(ctx, x - 30 * s, y - 70 * s, 60 * s, 26 * s, 6 * s, shade(color, 0.1), { lw: 2 });
    Props.tableLamp(ctx, x, y - 90 * s, s, '#ffe6a8', lit);
  },

  tv(ctx, x, y, w = 300, h = 180, { on = false, show = null } = {}) {
    groundShadow(ctx, x, y, w * 0.6, 12);
    box(ctx, x - w * 0.55, y - 90, w * 1.1, 90, 14, '#d39a63', { lw: 3 });
    for (const i of [-1, 1]) box(ctx, x + i * w * 0.27 - w * 0.2, y - 74, w * 0.4, 56, 8, '#e8b985', { lw: 2 });
    const ty = y - 90 - h - 14;
    box(ctx, x - 10, y - 104, 20, 20, 4, '#5d5470', { lw: 2 });
    box(ctx, x - w / 2 - 10, ty - 10, w + 20, h + 20, 16, '#5d5470', { lw: 3 });
    ctx.save();
    rr(ctx, x - w / 2, ty, w, h, 8);
    ctx.clip();
    if (on && show) show(ctx, x - w / 2, ty, w, h);
    else {
      ctx.fillStyle = '#3e3a52';
      ctx.fillRect(x - w / 2, ty, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.beginPath();
      ctx.moveTo(x - w / 2, ty);
      ctx.lineTo(x - w / 2 + w * 0.4, ty);
      ctx.lineTo(x - w / 2, ty + h * 0.8);
      ctx.fill();
    }
    ctx.restore();
    return { x: x - w / 2, y: ty, w, h };
  },

  fridge(ctx, x, y, s = 1, { open = false } = {}) {
    const w = 170 * s, h = 330 * s;
    groundShadow(ctx, x, y, w * 0.6, 12);
    box(ctx, x - w / 2, y - h, w, h, 24 * s, '#bfe6ff', { lw: 3 });
    ctx.strokeStyle = shade('#bfe6ff', -0.3);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 4, y - h * 0.62);
    ctx.lineTo(x + w / 2 - 4, y - h * 0.62);
    ctx.stroke();
    for (const hy of [y - h * 0.8, y - h * 0.45]) box(ctx, x - w / 2 + 18, hy, 12, 50 * s, 6, '#ffffff', { lw: 2 });
    drawEmoji(ctx, '🍎', x + 30 * s, y - h * 0.8, 34 * s);
    drawEmoji(ctx, '⭐', x + 50 * s, y - h * 0.4, 30 * s);
    drawEmoji(ctx, '🌈', x + 10 * s, y - h * 0.32, 30 * s);
    if (open) {
      ctx.fillStyle = 'rgba(255,255,230,.8)';
      rr(ctx, x - w / 2 + 10, y - h + 10, w - 20, h * 0.5, 14);
      ctx.fill();
    }
  },

  counter(ctx, x, y, w = 400, h = 160, color = '#a8dcc8') {
    groundShadow(ctx, x, y, w * 0.55, 10);
    box(ctx, x - w / 2, y - h, w, h, 12, color, { lw: 3 });
    const n = Math.max(1, Math.round(w / 130));
    for (let i = 0; i < n; i++) {
      const dw = (w - 30) / n;
      box(ctx, x - w / 2 + 15 + i * dw + 4, y - h + 34, dw - 8, h - 50, 10, shade(color, 0.12), { lw: 2 });
      box(ctx, x - w / 2 + 15 + i * dw + dw / 2 - 16, y - h + 46, 32, 8, 4, '#ffffff', { lw: 1.5 });
    }
    box(ctx, x - w / 2 - 10, y - h - 16, w + 20, 22, 8, '#fff8ee', { lw: 3 });
  },

  sink(ctx, x, y, w = 120) {
    rr(ctx, x - w / 2, y - 6, w, 12, 6);
    ctx.fillStyle = '#d8e4ee';
    ctx.fill();
    ctx.strokeStyle = '#a9b9c8';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y - 46);
    ctx.quadraticCurveTo(x, y - 62, x + 26, y - 60);
    ctx.stroke();
  },

  stove(ctx, x, y, s = 1, { on = false } = {}) {
    const w = 190 * s, h = 170 * s;
    groundShadow(ctx, x, y, w * 0.6, 10);
    box(ctx, x - w / 2, y - h, w, h, 14, '#ffffff', { lw: 3 });
    box(ctx, x - w / 2 + 20, y - h + 60, w - 40, h - 80, 12, '#5d5470', { lw: 2.5 });
    box(ctx, x - w / 2 + 34, y - h + 74, w - 68, 30, 8, '#8d84a3', { lw: 2 });
    for (let i = 0; i < 3; i++) {
      circle(ctx, x - 40 * s + i * 40 * s, y - h + 30, 8 * s);
      paint(ctx, '#ffb3cf', y - h + 22, y - h + 38, { lw: 2 });
    }
    box(ctx, x - w / 2 - 6, y - h - 12, w + 12, 16, 6, '#e8e1f0', { lw: 2.5 });
    rr(ctx, x - 60 * s, y - h - 70 * s, 120 * s, 58 * s, 18 * s);
    paint(ctx, '#ff9e7a', y - h - 70 * s, y - h - 12, { lw: 3 });
    box(ctx, x - 72 * s, y - h - 74 * s, 144 * s, 14 * s, 7, '#ffb899', { lw: 2.5 });
    if (on) {
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const t = (Game.time * 0.6 + i / 3) % 1, sx = x - 30 * s + i * 30 * s;
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.moveTo(sx, y - h - 80 * s - t * 60);
        ctx.quadraticCurveTo(sx + 12, y - h - 100 * s - t * 60, sx, y - h - 120 * s - t * 60);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  },

  wallCabinets(ctx, x, y, w, h = 110, color = '#a8dcc8') {
    box(ctx, x, y, w, h, 12, color, { lw: 3 });
    const n = Math.max(1, Math.round(w / 120));
    for (let i = 0; i < n; i++) {
      const dw = (w - 20) / n;
      box(ctx, x + 10 + i * dw + 4, y + 10, dw - 8, h - 20, 8, shade(color, 0.12), { lw: 2 });
      circle(ctx, x + 10 + i * dw + dw / 2, y + h - 24, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  },

  shower(ctx, x, y, s = 1, { on = false, curtain = '#a9dcff', open = 1 } = {}) {
    const w = 230 * s, h = 380 * s;
    box(ctx, x - w / 2, y - h, w, h, 18, '#e9f6ff', { lw: 3 });
    ctx.save();
    rr(ctx, x - w / 2 + 10, y - h + 10, w - 20, h - 20, 12);
    ctx.clip();
    ctx.fillStyle = tilePattern(ctx, '#ffffff', '#dff1ff', 40);
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.restore();
    ctx.strokeStyle = '#a9b9c8';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 30, y - h + 20);
    ctx.lineTo(x + w / 2 - 30, y - h + 70);
    ctx.quadraticCurveTo(x + w / 2 - 30, y - h + 46, x + 20, y - h + 56);
    ctx.stroke();
    ellipse(ctx, x + 10, y - h + 64, 34 * s, 12 * s);
    paint(ctx, '#d8e4ee', y - h + 52, y - h + 76, { lw: 2 });
    if (on) {
      ctx.strokeStyle = 'rgba(140,200,255,.7)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 14; i++) {
        const px = x + 10 + (i - 7) * 6 * s, ph = (Game.time * 2.5 + i * 0.37) % 1;
        ctx.beginPath();
        ctx.moveTo(px + (i - 7) * ph * 6, y - h + 80 + ph * (h - 120));
        ctx.lineTo(px + (i - 7) * ph * 7, y - h + 100 + ph * (h - 120));
        ctx.stroke();
      }
    }
    box(ctx, x - w / 2 - 4, y - 16, w + 8, 20, 8, '#ffffff', { lw: 3 });
    // Curtain, pulled to the side as `open` goes to 1.
    const cw = (w - 20) * (1 - open * 0.8);
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 10, y - h + 24);
    ctx.lineTo(x - w / 2 + 10 + cw, y - h + 24);
    for (let i = 6; i >= 0; i--) ctx.lineTo(x - w / 2 + 10 + cw * i / 6 + (i % 2 ? 6 : -6), y - 24);
    ctx.closePath();
    paint(ctx, curtain, y - h, y, { lw: 2.5 });
    box(ctx, x - w / 2 - 6, y - h + 16, w + 12, 10, 5, '#a9b9c8', { lw: 2 });
  },

  bathtub(ctx, x, y, w = 380, { bubbles = false, water = true } = {}) {
    groundShadow(ctx, x, y, w * 0.55, 12);
    for (const fx of [-w / 2 + 40, w / 2 - 40]) {
      circle(ctx, x + fx, y - 14, 14);
      paint(ctx, '#ffd34d', y - 28, y, { lw: 2 });
    }
    if (water) {
      ellipse(ctx, x, y - 120, w / 2 - 20, 22);
      ctx.fillStyle = PAL.waterLight;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - 130);
    ctx.lineTo(x + w / 2, y - 130);
    ctx.quadraticCurveTo(x + w / 2, y - 20, x + w / 2 - 70, y - 20);
    ctx.lineTo(x - w / 2 + 70, y - 20);
    ctx.quadraticCurveTo(x - w / 2, y - 20, x - w / 2, y - 130);
    ctx.closePath();
    paint(ctx, '#ffffff', y - 130, y - 20, { lw: 3, line: '#b8c8d8' });
    box(ctx, x - w / 2 - 10, y - 140, w + 20, 20, 10, '#f4f8ff', { lw: 3, line: '#b8c8d8' });
    if (bubbles) {
      const rnd = seeded(5);
      for (let i = 0; i < 16; i++) {
        const bx = x - w / 2 + 30 + rnd() * (w - 60), by = y - 140 - rnd() * 40 + Math.sin(Game.time * 2 + i) * 3, r = 12 + rnd() * 14;
        circle(ctx, bx, by, r);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(170,210,255,.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  },

  toilet(ctx, x, y, s = 1) {
    groundShadow(ctx, x, y, 50 * s, 10 * s);
    box(ctx, x + 6 * s, y - 170 * s, 66 * s, 100 * s, 14 * s, '#ffffff', { lw: 3, line: '#b8c8d8' });
    box(ctx, x + 50 * s, y - 154 * s, 18 * s, 8 * s, 4, '#a9b9c8', { lw: 1.5 });
    ctx.beginPath();
    ctx.moveTo(x - 60 * s, y - 80 * s);
    ctx.lineTo(x + 40 * s, y - 80 * s);
    ctx.quadraticCurveTo(x + 40 * s, y - 30 * s, x + 10 * s, y - 24 * s);
    ctx.lineTo(x + 14 * s, y);
    ctx.lineTo(x - 30 * s, y);
    ctx.lineTo(x - 26 * s, y - 26 * s);
    ctx.quadraticCurveTo(x - 64 * s, y - 40 * s, x - 60 * s, y - 80 * s);
    ctx.closePath();
    paint(ctx, '#ffffff', y - 80 * s, y, { lw: 3, line: '#b8c8d8' });
    box(ctx, x - 66 * s, y - 90 * s, 108 * s, 14 * s, 7 * s, '#ffd6e5', { lw: 2.5 });
  },

  bathSink(ctx, x, y, s = 1) {
    groundShadow(ctx, x, y, 40 * s, 8 * s);
    box(ctx, x - 16 * s, y - 120 * s, 32 * s, 120 * s, 10 * s, '#ffffff', { lw: 3, line: '#b8c8d8' });
    ctx.beginPath();
    ctx.moveTo(x - 70 * s, y - 150 * s);
    ctx.lineTo(x + 70 * s, y - 150 * s);
    ctx.quadraticCurveTo(x + 66 * s, y - 108 * s, x, y - 106 * s);
    ctx.quadraticCurveTo(x - 66 * s, y - 108 * s, x - 70 * s, y - 150 * s);
    ctx.closePath();
    paint(ctx, '#ffffff', y - 150 * s, y - 106 * s, { lw: 3, line: '#b8c8d8' });
    Props.sink(ctx, x, y - 150 * s, 90 * s);
    drawEmoji(ctx, '🪥', x - 50 * s, y - 172 * s, 34 * s);
  },

  mirror(ctx, x, y, w, h) {
    ellipse(ctx, x + w / 2, y + h / 2, w / 2 + 10, h / 2 + 10);
    paint(ctx, '#ffd6a8', y, y + h, { lw: 3 });
    ellipse(ctx, x + w / 2, y + h / 2, w / 2, h / 2);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#e9f7ff');
    g.addColorStop(1, '#bfe2f5');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.28, y + h * 0.3);
    ctx.lineTo(x + w * 0.45, y + h * 0.18);
    ctx.stroke();
  },

  towels(ctx, x, y, colors = ['#ffb3cf', '#a9dcff', '#ffe48a']) {
    box(ctx, x - 10, y - 8, colors.length * 64 + 20, 10, 5, '#a9b9c8', { lw: 2 });
    colors.forEach((c, i) => {
      box(ctx, x + i * 64, y, 54, 110, 10, c, { lw: 2.5 });
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + i * 64 + 8, y + 86);
      ctx.lineTo(x + i * 64 + 46, y + 86);
      ctx.stroke();
    });
  },

  desk(ctx, x, y, w = 300, color = '#ffd0a8') {
    groundShadow(ctx, x, y, w * 0.55, 10);
    box(ctx, x - w / 2 + 10, y - 120, 70, 120, 10, shade(color, -0.04), { lw: 3 });
    for (let i = 0; i < 3; i++) box(ctx, x - w / 2 + 18, y - 110 + i * 36, 54, 28, 6, shade(color, 0.1), { lw: 2 });
    box(ctx, x + w / 2 - 30, y - 120, 18, 120, 6, shade(color, -0.1), { lw: 2 });
    box(ctx, x - w / 2, y - 136, w, 22, 10, color, { lw: 3 });
    drawEmoji(ctx, '✏️', x + 30, y - 150, 34, { rot: -0.6 });
    drawEmoji(ctx, '📘', x - 40, y - 154, 40);
  },

  blackboard(ctx, x, y, w, h, draw = null) {
    box(ctx, x - 12, y - 12, w + 24, h + 24, 12, '#c98f5b', { lw: 3 });
    rr(ctx, x, y, w, h, 6);
    ctx.fillStyle = '#4f7a63';
    ctx.fill();
    if (draw) {
      ctx.save();
      rr(ctx, x, y, w, h, 6);
      ctx.clip();
      draw(ctx, x, y, w, h);
      ctx.restore();
    } else {
      drawText(ctx, 'A B C', x + w * 0.32, y + h * 0.36, h * 0.2, { color: '#ffffff' });
      drawText(ctx, '1 + 2 = 3', x + w * 0.62, y + h * 0.7, h * 0.16, { color: '#ffe48a' });
      circle(ctx, x + w * 0.82, y + h * 0.3, h * 0.1);
      ctx.strokeStyle = '#ffb3cf';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    box(ctx, x + w * 0.1, y + h + 4, w * 0.8, 10, 4, '#e0b07c', { lw: 2 });
  },

  poster(ctx, x, y, w, h, kind = 'abc') {
    box(ctx, x, y, w, h, 10, '#ffffff', { lw: 3 });
    switch (kind) {
      case 'abc':
        ['A', 'B', 'C', 'D'].forEach((l, i) => drawText(ctx, l, x + w * (0.2 + (i % 2) * 0.6), y + h * (0.3 + Math.floor(i / 2) * 0.42), h * 0.3, { color: Object.values(COLORS)[i] }));
        break;
      case '123':
        ['1', '2', '3'].forEach((l, i) => drawText(ctx, l, x + w * (0.22 + i * 0.28), y + h * 0.5, h * 0.42, { color: Object.values(COLORS)[i + 3] }));
        break;
      case 'shapes':
        ctx.fillStyle = COLORS.red; circle(ctx, x + w * 0.28, y + h * 0.32, h * 0.14); ctx.fill();
        ctx.fillStyle = COLORS.blue; ctx.fillRect(x + w * 0.58, y + h * 0.18, h * 0.28, h * 0.28);
        ctx.fillStyle = COLORS.yellow; ctx.beginPath(); ctx.moveTo(x + w * 0.28, y + h * 0.58); ctx.lineTo(x + w * 0.44, y + h * 0.86); ctx.lineTo(x + w * 0.12, y + h * 0.86); ctx.fill();
        ctx.fillStyle = COLORS.pink; heartPath(ctx, x + w * 0.72, y + h * 0.74, h * 0.16); ctx.fill();
        break;
      case 'colors':
        Object.values(COLORS).forEach((c, i) => {
          ctx.fillStyle = c;
          circle(ctx, x + w * (0.18 + (i % 4) * 0.22), y + h * (0.32 + Math.floor(i / 4) * 0.38), h * 0.12);
          ctx.fill();
        });
        break;
      case 'notes':
        drawText(ctx, '♪ ♫', x + w / 2, y + h * 0.38, h * 0.32, { color: '#b197fc' });
        drawText(ctx, 'C D E', x + w / 2, y + h * 0.76, h * 0.2, { color: '#4a3a5c' });
        break;
      case 'star':
        drawStar(ctx, x + w / 2, y + h / 2, h * 0.32);
        break;
    }
  },

  // Two blocks on the floor and one on top: (x, y) is the bottom center.
  letterBlocks(ctx, x, y, letters = 'ABC', size = 54) {
    [...letters].slice(0, 3).forEach((l, i) => {
      const bx = i < 2 ? x - size + i * size : x - size / 2, by = y - size * (i < 2 ? 1 : 2);
      const col = Object.values(COLORS)[i % 7];
      box(ctx, bx, by, size - 4, size - 4, 8, col, { lw: 2.5 });
      drawText(ctx, l, bx + size / 2 - 2, by + size / 2 - 1, size * 0.55, { color: '#fff', stroke: shade(col, -0.3), sw: 0.12 });
    });
  },

  grandPiano(ctx, x, y, s = 1) {
    groundShadow(ctx, x, y, 230 * s, 22 * s);
    for (const lx of [-170, 60, 170]) box(ctx, x + lx * s - 9, y - 110 * s, 18 * s, 110 * s, 6, '#2f2a3d', { lw: 2 });
    // Body
    ctx.beginPath();
    ctx.moveTo(x - 200 * s, y - 210 * s);
    ctx.lineTo(x + 40 * s, y - 210 * s);
    ctx.bezierCurveTo(x + 150 * s, y - 210 * s, x + 220 * s, y - 180 * s, x + 220 * s, y - 140 * s);
    ctx.lineTo(x + 220 * s, y - 100 * s);
    ctx.lineTo(x - 200 * s, y - 100 * s);
    ctx.closePath();
    paint(ctx, '#3d3650', y - 210 * s, y - 100 * s, { lw: 3, line: '#211c2e', light: 0.25 });
    // Lid, propped open
    ctx.beginPath();
    ctx.moveTo(x - 190 * s, y - 214 * s);
    ctx.lineTo(x + 160 * s, y - 330 * s);
    ctx.quadraticCurveTo(x + 220 * s, y - 300 * s, x + 200 * s, y - 214 * s);
    ctx.closePath();
    paint(ctx, '#4a4262', y - 330 * s, y - 214 * s, { lw: 3, line: '#211c2e', light: 0.3 });
    ctx.strokeStyle = '#c9b6e8';
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(x + 40 * s, y - 212 * s);
    ctx.lineTo(x + 70 * s, y - 280 * s);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath();
    ctx.moveTo(x - 150 * s, y - 228 * s);
    ctx.lineTo(x + 100 * s, y - 310 * s);
    ctx.lineTo(x + 110 * s, y - 300 * s);
    ctx.lineTo(x - 130 * s, y - 224 * s);
    ctx.fill();
    // Keyboard edge facing us
    box(ctx, x - 230 * s, y - 136 * s, 120 * s, 30 * s, 6, '#3d3650', { lw: 2, line: '#211c2e' });
    rr(ctx, x - 226 * s, y - 134 * s, 112 * s, 14 * s, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.fillStyle = '#2f2a3d';
    for (let i = 0; i < 9; i++) if (i % 7 !== 2 && i % 7 !== 6) ctx.fillRect(x - 220 * s + i * 12 * s, y - 134 * s, 6 * s, 8 * s);
    drawText(ctx, '♪', x - 30 * s, y - 160 * s, 34 * s, { color: '#ffd34d' });
  },

  pianoBench(ctx, x, y, s = 1, color = '#3d3650') {
    groundShadow(ctx, x, y, 60 * s, 8 * s);
    for (const lx of [-44, 34]) box(ctx, x + lx * s, y - 60 * s, 10 * s, 60 * s, 3, color, { lw: 2 });
    box(ctx, x - 56 * s, y - 72 * s, 112 * s, 18 * s, 7, color, { lw: 2.5, light: 0.3 });
    box(ctx, x - 50 * s, y - 82 * s, 100 * s, 14 * s, 7, '#ff9ec4', { lw: 2 });
  },

  musicStand(ctx, x, y, s = 1) {
    box(ctx, x - 3 * s, y - 150 * s, 6 * s, 150 * s, 3, '#7c6a96', { lw: 1.5 });
    ctx.save();
    ctx.translate(x, y - 160 * s);
    ctx.rotate(-0.12);
    box(ctx, -50 * s, -50 * s, 100 * s, 64 * s, 6, '#ffffff', { lw: 2.5 });
    ctx.strokeStyle = '#7c6a96';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-40 * s, -38 * s + i * 8 * s);
      ctx.lineTo(40 * s, -38 * s + i * 8 * s);
      ctx.stroke();
    }
    drawText(ctx, '♩ ♪ ♫', 0, -22 * s, 18 * s, { color: '#4a3a5c' });
    ctx.restore();
  },

  speaker(ctx, x, y, s = 1, pulse = 0) {
    groundShadow(ctx, x, y, 50 * s, 10 * s);
    box(ctx, x - 46 * s, y - 190 * s, 92 * s, 190 * s, 14 * s, '#5d5470', { lw: 3 });
    for (const [cy, r] of [[-140, 22], [-62, 34]]) {
      circle(ctx, x, y + cy * s, r * s * (1 + pulse * 0.08));
      paint(ctx, '#8d84a3', y + (cy - r) * s, y + (cy + r) * s, { lw: 2.5 });
      circle(ctx, x, y + cy * s, r * 0.4 * s);
      ctx.fillStyle = '#3e3a52';
      ctx.fill();
    }
  },

  micStand(ctx, x, y, s = 1, { glow = false } = {}) {
    groundShadow(ctx, x, y, 40 * s, 8 * s);
    ctx.strokeStyle = '#7c6a96';
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 34 * s, y); ctx.lineTo(x, y - 14 * s); ctx.lineTo(x + 34 * s, y);
    ctx.moveTo(x, y - 14 * s); ctx.lineTo(x, y - 170 * s);
    ctx.stroke();
    ctx.save();
    if (glow) {
      ctx.shadowColor = '#ffe066';
      ctx.shadowBlur = 20 + Math.sin(Game.time * 6) * 8;
    }
    box(ctx, x - 9 * s, y - 210 * s, 18 * s, 42 * s, 8, '#b197fc', { lw: 2 });
    circle(ctx, x, y - 216 * s, 16 * s);
    paint(ctx, '#d8d2e6', y - 232 * s, y - 200 * s, { lw: 2.5 });
    ctx.restore();
  },

  discoBall(ctx, x, y, r, t = Game.time) {
    ctx.strokeStyle = '#c9c1d6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, y - r);
    ctx.stroke();
    circle(ctx, x, y, r);
    paint(ctx, '#e6e2ee', y - r, y + r, { lw: 3 });
    ctx.save();
    circle(ctx, x, y, r);
    ctx.clip();
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
      const v = (Math.sin(t * 3 + i * 1.7 + j * 2.3) + 1) / 2;
      ctx.fillStyle = `hsla(${(i * 40 + j * 30 + t * 80) % 360}, 80%, ${70 + v * 25}%, .9)`;
      ctx.fillRect(x + i * r / 4 - r / 10, y + j * r / 4 - r / 10, r / 5.2, r / 5.2);
    }
    ctx.restore();
  },

  // Colored light beams swinging from the ceiling.
  beams(ctx, t = Game.time, alpha = 0.18) {
    ['#ff8fb8', '#7cc6ff', '#ffd34d', '#7ed99a'].forEach((c, i) => {
      const bx = 200 + i * 400, a = Math.sin(t * 0.9 + i * 1.6) * 0.5;
      ctx.save();
      ctx.translate(bx, 0);
      ctx.rotate(a);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, 0);
      ctx.lineTo(160, 900);
      ctx.lineTo(-160, 900);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  },

  toyBox(ctx, x, y, s = 1, color = '#7cc6ff') {
    groundShadow(ctx, x, y, 80 * s, 12 * s);
    drawEmoji(ctx, '🧸', x - 34 * s, y - 112 * s, 56 * s, { rot: -0.2 });
    drawEmoji(ctx, '🪀', x + 30 * s, y - 104 * s, 40 * s);
    drawEmoji(ctx, '🚀', x + 6 * s, y - 122 * s, 44 * s, { rot: 0.3 });
    box(ctx, x - 76 * s, y - 96 * s, 152 * s, 96 * s, 14 * s, color, { lw: 3 });
    box(ctx, x - 82 * s, y - 104 * s, 164 * s, 22 * s, 10 * s, shade(color, 0.12), { lw: 3 });
    drawStar(ctx, x, y - 48 * s, 22 * s, '#ffe48a');
  },

  teddy(ctx, x, y, s = 1, color = '#d9a066') {
    groundShadow(ctx, x, y, 34 * s, 7 * s);
    const c = color;
    for (const [dx, dy, r] of [[-22, -16, 13], [22, -16, 13]]) { circle(ctx, x + dx * s, y + dy * s, r * s); paint(ctx, c, y - 30 * s, y, { lw: 2.5 }); }
    ellipse(ctx, x, y - 38 * s, 30 * s, 32 * s);
    paint(ctx, c, y - 70 * s, y - 6 * s, { lw: 2.5 });
    for (const dx of [-24, 24]) { circle(ctx, x + dx * s, y - 98 * s, 11 * s); paint(ctx, c, y - 110 * s, y - 86 * s, { lw: 2.5 }); }
    circle(ctx, x, y - 84 * s, 26 * s);
    paint(ctx, c, y - 110 * s, y - 58 * s, { lw: 2.5 });
    ellipse(ctx, x, y - 76 * s, 12 * s, 9 * s);
    ctx.fillStyle = shade(c, 0.35);
    ctx.fill();
    ctx.fillStyle = '#3b2a2a';
    circle(ctx, x - 9 * s, y - 90 * s, 3.5 * s); ctx.fill();
    circle(ctx, x + 9 * s, y - 90 * s, 3.5 * s); ctx.fill();
    circle(ctx, x, y - 79 * s, 4 * s); ctx.fill();
    ctx.fillStyle = '#ff8fb8';
    ctx.beginPath();
    ctx.moveTo(x, y - 60 * s); ctx.lineTo(x - 16 * s, y - 68 * s); ctx.lineTo(x - 16 * s, y - 52 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - 60 * s); ctx.lineTo(x + 16 * s, y - 68 * s); ctx.lineTo(x + 16 * s, y - 52 * s); ctx.closePath(); ctx.fill();
  },

  // A little train going round an oval track, at angle `a`.
  trainTrack(ctx, x, y, rx, ry, a = Game.time * 0.8) {
    ellipse(ctx, x, y, rx, ry);
    ctx.strokeStyle = '#b08a68';
    ctx.lineWidth = 16;
    ctx.stroke();
    ctx.strokeStyle = '#e8d4bc';
    ctx.lineWidth = 4;
    ellipse(ctx, x, y, rx - 5, ry - 3);
    ctx.stroke();
    ellipse(ctx, x, y, rx + 5, ry + 3);
    ctx.stroke();
    const cars = [['#ff8a8a', 0], ['#ffd43b', 0.28], ['#7cc6ff', 0.56]];
    for (const [c, off] of cars) {
      const aa = a - off, cx = x + Math.cos(aa) * rx, cy = y + Math.sin(aa) * ry;
      box(ctx, cx - 26, cy - 34, 52, 32, 8, c, { lw: 2.5 });
      for (const wx of [-14, 14]) {
        circle(ctx, cx + wx, cy - 2, 7);
        paint(ctx, '#5d5470', cy - 9, cy + 5, { lw: 2 });
      }
      if (off === 0) {
        box(ctx, cx + 4, cy - 56, 16, 24, 4, '#5d5470', { lw: 2 });
        const p = (Game.time * 1.3) % 1;
        ctx.fillStyle = `rgba(255,255,255,${0.8 - p * 0.8})`;
        circle(ctx, cx + 12 + p * 10, cy - 62 - p * 40, 8 + p * 8);
        ctx.fill();
      }
    }
  },

  blockTower(ctx, x, y, n = 5, size = 50, seed = 2) {
    const rnd = seeded(seed), cols = Object.values(COLORS);
    for (let i = 0; i < n; i++) {
      const c = cols[Math.floor(rnd() * cols.length)], off = (rnd() - 0.5) * 10;
      box(ctx, x - size / 2 + off, y - size * (i + 1), size, size - 3, 8, c, { lw: 2.5 });
      starPath(ctx, x + off, y - size * (i + 0.5), size * 0.18);
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.fill();
    }
  },

  // -------------------------------------------------------------- outdoors

  umbrella(ctx, x, y, s = 1, colors = ['#ff8fb8', '#ffffff']) {
    ctx.strokeStyle = '#a8723f';
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 170 * s);
    ctx.stroke();
    const n = 6, r = 110 * s, top = y - 180 * s;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI + i * Math.PI / n, a1 = a0 + Math.PI / n;
      ctx.beginPath();
      ctx.moveTo(x, top - 40 * s);
      ctx.lineTo(x + Math.cos(a0) * r, top + 20 * s);
      ctx.quadraticCurveTo(x + Math.cos((a0 + a1) / 2) * r, top + 36 * s, x + Math.cos(a1) * r, top + 20 * s);
      ctx.closePath();
      paint(ctx, colors[i % colors.length], top - 40 * s, top + 30 * s, { lw: 2 });
    }
    circle(ctx, x, top - 42 * s, 7 * s);
    ctx.fillStyle = '#ffd34d';
    ctx.fill();
  },

  lounger(ctx, x, y, s = 1, color = '#7cc6ff') {
    groundShadow(ctx, x, y, 100 * s, 12 * s);
    for (const lx of [-80, 70]) box(ctx, x + lx * s, y - 30 * s, 10 * s, 30 * s, 3, '#ffffff', { lw: 2 });
    box(ctx, x - 90 * s, y - 44 * s, 150 * s, 18 * s, 8, color, { lw: 2.5 });
    ctx.save();
    ctx.translate(x + 56 * s, y - 40 * s);
    ctx.rotate(-0.7);
    box(ctx, 0, -12 * s, 70 * s, 18 * s, 8, color, { lw: 2.5 });
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 80 * s + i * 28 * s, y - 42 * s);
      ctx.lineTo(x - 80 * s + i * 28 * s, y - 28 * s);
      ctx.stroke();
    }
  },

  floatRing(ctx, x, y, r = 40, color = '#ff8fb8', t = Game.time) {
    const bob = Math.sin(t * 2 + x) * 4;
    ellipse(ctx, x, y + bob, r, r * 0.45);
    ctx.lineWidth = r * 0.38;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.lineWidth = r * 0.38;
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([r * 0.5, r * 0.6]);
    ctx.stroke();
    ctx.setLineDash([]);
  },

  duck(ctx, x, y, s = 1, { color = '#ffd43b', t = Game.time } = {}) {
    const bob = Math.sin(t * 2.5 + x * 0.1) * 3 * s;
    ctx.save();
    ctx.translate(x, y + bob);
    ellipse(ctx, 0, 0, 30 * s, 20 * s);
    paint(ctx, color, -20 * s, 20 * s, { lw: 2.5 });
    circle(ctx, 16 * s, -22 * s, 15 * s);
    paint(ctx, color, -37 * s, -7 * s, { lw: 2.5 });
    ctx.fillStyle = '#ff9f43';
    ellipse(ctx, 32 * s, -19 * s, 9 * s, 5 * s);
    ctx.fill();
    ctx.fillStyle = '#3b2a2a';
    circle(ctx, 20 * s, -26 * s, 3 * s);
    ctx.fill();
    ctx.fillStyle = shade(color, 0.3);
    ellipse(ctx, -6 * s, -4 * s, 14 * s, 8 * s, -0.3);
    ctx.fill();
    ctx.restore();
  },

  beachBall(ctx, x, y, r = 30, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const cols = ['#ff6b6b', '#ffffff', '#4dabf7', '#ffffff', '#ffd43b', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * TAU / 6, (i + 1) * TAU / 6);
      ctx.closePath();
      ctx.fillStyle = cols[i];
      ctx.fill();
    }
    circle(ctx, 0, 0, r);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(74,58,92,.35)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    circle(ctx, -r * 0.35, -r * 0.35, r * 0.22);
    ctx.fill();
    ctx.restore();
  },

  poolSlide(ctx, x, y, s = 1) {
    groundShadow(ctx, x, y, 120 * s, 16 * s);
    ctx.strokeStyle = '#c9c1d6';
    ctx.lineWidth = 8 * s;
    for (const lx of [-70, -40]) {
      ctx.beginPath();
      ctx.moveTo(x + lx * s, y);
      ctx.lineTo(x + lx * s, y - 240 * s);
      ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 70 * s, y - 30 * s - i * 32 * s);
      ctx.lineTo(x - 40 * s, y - 30 * s - i * 32 * s);
      ctx.stroke();
    }
    box(ctx, x - 80 * s, y - 252 * s, 60 * s, 16 * s, 6, '#ffffff', { lw: 2.5 });
    ctx.lineCap = 'round';
    ctx.lineWidth = 34 * s;
    ctx.strokeStyle = shade('#ffd43b', -0.3);
    const curve = () => {
      ctx.beginPath();
      ctx.moveTo(x - 30 * s, y - 240 * s);
      ctx.bezierCurveTo(x + 120 * s, y - 230 * s, x - 10 * s, y - 80 * s, x + 130 * s, y - 20 * s);
      ctx.stroke();
    };
    curve();
    ctx.lineWidth = 26 * s;
    ctx.strokeStyle = '#ffd43b';
    curve();
    ctx.lineWidth = 8 * s;
    ctx.strokeStyle = '#fff4b0';
    curve();
  },

  hoop(ctx, x, y, s = 1) {
    box(ctx, x - 8 * s, y - 300 * s, 16 * s, 300 * s, 6, '#8d84a3', { lw: 2.5 });
    box(ctx, x - 80 * s, y - 360 * s, 160 * s, 100 * s, 10, '#ffffff', { lw: 3 });
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 5 * s;
    ctx.strokeRect(x - 30 * s, y - 330 * s, 60 * s, 46 * s);
    return { x, y: y - 270 * s, r: 46 * s };
  },

  // The rim and net in front of a hoop (drawn after the ball).
  hoopFront(ctx, x, y, r) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 6; i++) {
      const nx = x - r + i * r / 3;
      ctx.beginPath();
      ctx.moveTo(nx, y);
      ctx.lineTo(x - r * 0.6 + i * r * 0.2, y + r * 1.2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - r * 0.8, y + r * 0.5);
    ctx.lineTo(x + r * 0.8, y + r * 0.5);
    ctx.moveTo(x - r * 0.65, y + r * 0.95);
    ctx.lineTo(x + r * 0.65, y + r * 0.95);
    ctx.stroke();
    ellipse(ctx, x, y, r, r * 0.25);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#ff6b3d';
    ctx.stroke();
  },

  cone(ctx, x, y, s = 1, color = '#ff9f43') {
    groundShadow(ctx, x, y, 22 * s, 6 * s);
    ctx.beginPath();
    ctx.moveTo(x - 20 * s, y - 4 * s);
    ctx.lineTo(x - 5 * s, y - 52 * s);
    ctx.lineTo(x + 5 * s, y - 52 * s);
    ctx.lineTo(x + 20 * s, y - 4 * s);
    ctx.closePath();
    paint(ctx, color, y - 52 * s, y, { lw: 2.5 });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 12 * s, y - 32 * s, 24 * s, 7 * s);
    box(ctx, x - 26 * s, y - 8 * s, 52 * s, 8 * s, 3, color, { lw: 2 });
  },

  swingSet(ctx, x, y, s = 1, angles = [0, 0]) {
    groundShadow(ctx, x, y, 170 * s, 16 * s);
    ctx.lineCap = 'round';
    ctx.strokeStyle = shade('#ff8fb8', -0.3);
    ctx.lineWidth = 16 * s;
    const frame = () => {
      ctx.beginPath();
      for (const fx of [-160, 160]) {
        ctx.moveTo(x + (fx - 30) * s, y);
        ctx.lineTo(x + fx * s, y - 280 * s);
        ctx.lineTo(x + (fx + 30) * s, y);
      }
      ctx.moveTo(x - 160 * s, y - 280 * s);
      ctx.lineTo(x + 160 * s, y - 280 * s);
      ctx.stroke();
    };
    frame();
    ctx.strokeStyle = '#ff8fb8';
    ctx.lineWidth = 11 * s;
    frame();
    angles.forEach((a, i) => {
      const px = x + (i ? 70 : -70) * s, py = y - 280 * s, len = 220 * s;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.strokeStyle = '#a8a2b8';
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(-26 * s, 0); ctx.lineTo(-26 * s, len);
      ctx.moveTo(26 * s, 0); ctx.lineTo(26 * s, len);
      ctx.stroke();
      box(ctx, -34 * s, len - 6 * s, 68 * s, 14 * s, 6, i ? '#7cc6ff' : '#ffd43b', { lw: 2.5 });
      ctx.restore();
    });
  },

  playSlide(ctx, x, y, s = 1) {
    groundShadow(ctx, x, y, 150 * s, 16 * s);
    box(ctx, x - 140 * s, y - 230 * s, 80 * s, 230 * s, 10, '#b197fc', { lw: 3 });
    for (let i = 0; i < 6; i++) box(ctx, x - 132 * s, y - 40 * s - i * 34 * s, 64 * s, 9 * s, 4, '#ffffff', { lw: 2 });
    box(ctx, x - 156 * s, y - 250 * s, 112 * s, 24 * s, 8, '#ffd43b', { lw: 3 });
    ctx.beginPath();
    ctx.moveTo(x - 60 * s, y - 244 * s);
    ctx.quadraticCurveTo(x + 30 * s, y - 210 * s, x + 80 * s, y - 60 * s);
    ctx.quadraticCurveTo(x + 100 * s, y - 14 * s, x + 150 * s, y - 10 * s);
    ctx.lineTo(x + 150 * s, y + 10 * s);
    ctx.quadraticCurveTo(x + 80 * s, y + 6 * s, x + 50 * s, y - 50 * s);
    ctx.quadraticCurveTo(x + 10 * s, y - 180 * s, x - 60 * s, y - 210 * s);
    ctx.closePath();
    paint(ctx, '#ff8fb8', y - 244 * s, y + 10 * s, { lw: 3 });
    // Roof
    ctx.beginPath();
    ctx.moveTo(x - 170 * s, y - 250 * s);
    ctx.lineTo(x - 100 * s, y - 320 * s);
    ctx.lineTo(x - 30 * s, y - 250 * s);
    ctx.closePath();
    paint(ctx, '#7ed99a', y - 320 * s, y - 250 * s, { lw: 3 });
  },

  trampoline(ctx, x, y, s = 1, sink = 0) {
    groundShadow(ctx, x, y, 140 * s, 20 * s);
    for (const lx of [-110, -40, 40, 110]) box(ctx, x + lx * s - 5, y - 60 * s, 10 * s, 60 * s, 3, '#8d84a3', { lw: 2 });
    ellipse(ctx, x, y - 66 * s, 140 * s, 34 * s);
    paint(ctx, '#7cc6ff', y - 100 * s, y - 32 * s, { lw: 3 });
    ellipse(ctx, x, y - 66 * s + sink * 10 * s, 112 * s, 24 * s + sink * 6 * s);
    ctx.fillStyle = '#4a4262';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ellipse(ctx, x, y - 66 * s + sink * 10 * s, 112 * s * i / 4, (24 + sink * 6) * s * i / 4);
      ctx.stroke();
    }
  },

  sandbox(ctx, x, y, w = 340, h = 150) {
    groundShadow(ctx, x, y, w * 0.55, 14);
    box(ctx, x - w / 2, y - h, w, h, 18, PAL.wood, { lw: 3 });
    rr(ctx, x - w / 2 + 16, y - h + 16, w - 32, h - 32, 12);
    ctx.fillStyle = sandPattern(ctx);
    ctx.fill();
    drawEmoji(ctx, '🪣', x - w * 0.3, y - h * 0.45, 48);
    drawEmoji(ctx, '⛱️', x + w * 0.32, y - h * 0.6, 50);
  },

  ballPit(ctx, x, y, w = 320, h = 140) {
    groundShadow(ctx, x, y, w * 0.55, 14);
    box(ctx, x - w / 2, y - h, w, h, 30, '#ffffff', { lw: 3 });
    ctx.save();
    rr(ctx, x - w / 2 + 14, y - h + 10, w - 28, h - 24, 22);
    ctx.clip();
    const rnd = seeded(8), cols = Object.values(COLORS);
    for (let i = 0; i < 70; i++) {
      const bx = x - w / 2 + 14 + rnd() * (w - 28), by = y - h + 18 + rnd() * (h - 30) + Math.sin(Game.time * 2 + i) * 1.5;
      circle(ctx, bx, by, 13);
      paint(ctx, cols[i % cols.length], by - 13, by + 13, { lw: 1.5 });
    }
    ctx.restore();
  },

  seesaw(ctx, x, y, s = 1, tilt = 0) {
    groundShadow(ctx, x, y, 160 * s, 14 * s);
    ctx.beginPath();
    ctx.moveTo(x - 30 * s, y);
    ctx.lineTo(x, y - 60 * s);
    ctx.lineTo(x + 30 * s, y);
    ctx.closePath();
    paint(ctx, '#b197fc', y - 60 * s, y, { lw: 3 });
    ctx.save();
    ctx.translate(x, y - 62 * s);
    ctx.rotate(tilt);
    box(ctx, -170 * s, -10 * s, 340 * s, 20 * s, 10, '#ffd43b', { lw: 3 });
    for (const sx of [-150, 150]) box(ctx, sx * s - 6, -40 * s, 12 * s, 32 * s, 4, '#ff8fb8', { lw: 2 });
    ctx.restore();
  },

  climbDome(ctx, x, y, s = 1) {
    groundShadow(ctx, x, y, 150 * s, 18 * s);
    ctx.lineCap = 'round';
    const cols = ['#ff8fb8', '#ffd43b', '#7ed99a', '#7cc6ff', '#b197fc'];
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = cols[i];
      ctx.lineWidth = 9 * s;
      ellipse(ctx, x, y, 140 * s * (1 - i * 0.18), 200 * s * Math.sqrt(1 - i * 0.18));
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 200 * s, y - 260 * s, 400 * s, 260 * s);
      ctx.clip();
      ellipse(ctx, x, y, 140 * s, 200 * s - i * 40 * s);
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = '#ff8fb8';
    ctx.lineWidth = 9 * s;
    ctx.beginPath();
    ctx.moveTo(x - 140 * s, y);
    ctx.quadraticCurveTo(x - 140 * s, y - 200 * s, x, y - 200 * s);
    ctx.quadraticCurveTo(x + 140 * s, y - 200 * s, x + 140 * s, y);
    ctx.stroke();
    for (let i = 1; i < 4; i++) {
      const hy = y - i * 50 * s, hw = 140 * s * Math.sqrt(1 - Math.pow(i * 50 / 200, 2));
      ctx.strokeStyle = cols[i];
      ctx.beginPath();
      ctx.moveTo(x - hw, hy);
      ctx.lineTo(x + hw, hy);
      ctx.stroke();
    }
    ctx.strokeStyle = '#7cc6ff';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 200 * s);
    ctx.stroke();
  },

  toyCar(ctx, x, y, s = 1, color = '#ff6b6b', facing = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facing, 1);
    groundShadow(ctx, 0, 0, 70 * s, 10 * s);
    box(ctx, -70 * s, -50 * s, 140 * s, 40 * s, 18 * s, color, { lw: 3 });
    ctx.beginPath();
    ctx.moveTo(-40 * s, -50 * s);
    ctx.quadraticCurveTo(-30 * s, -86 * s, 0, -86 * s);
    ctx.quadraticCurveTo(26 * s, -86 * s, 36 * s, -50 * s);
    ctx.closePath();
    paint(ctx, shade(color, 0.15), -86 * s, -50 * s, { lw: 3 });
    ctx.fillStyle = '#d8f1ff';
    ellipse(ctx, 6 * s, -64 * s, 22 * s, 12 * s);
    ctx.fill();
    for (const wx of [-42, 42]) {
      circle(ctx, wx * s, -10 * s, 16 * s);
      paint(ctx, '#5d5470', -26 * s, 6 * s, { lw: 2.5 });
      circle(ctx, wx * s, -10 * s, 6 * s);
      ctx.fillStyle = '#d8d2e6';
      ctx.fill();
    }
    ctx.restore();
  },

  // Garden soil bed.
  plot(ctx, x, y, w, h) {
    box(ctx, x - w / 2, y - h, w, h, 16, '#b88a5e', { lw: 3 });
    rr(ctx, x - w / 2 + 10, y - h + 8, w - 20, h - 18, 12);
    ctx.fillStyle = '#8f6442';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + 20, y - h + 8 + i * (h - 18) / 3);
      ctx.lineTo(x + w / 2 - 20, y - h + 8 + i * (h - 18) / 3);
      ctx.stroke();
    }
  },

  // A crop at growth stage 0 (seed) .. 4 (ready to pick).
  crop(ctx, x, y, kind, stage, s = 1) {
    const t = Game.time, sw = Math.sin(t * 2 + x) * 0.05;
    if (stage <= 0) {
      ellipse(ctx, x, y - 4 * s, 18 * s, 8 * s);
      ctx.fillStyle = '#7a5235';
      ctx.fill();
      ctx.fillStyle = '#f5e1b8';
      for (const dx of [-6, 0, 6]) { ellipse(ctx, x + dx * s, y - 8 * s, 3 * s, 2 * s); ctx.fill(); }
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sw);
    const leaf = (lx, ly, len, a, c = PAL.leaf) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a);
      ellipse(ctx, 0, -len / 2, len * 0.32, len / 2);
      paint(ctx, c, -len, 0, { lw: 2 * s });
      ctx.restore();
    };
    const h = [0, 26, 48, 70, 84][stage] * s;
    if (kind === 'sunflower') {
      ctx.strokeStyle = '#5fae4f';
      ctx.lineWidth = 6 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -h * 1.6);
      ctx.stroke();
      leaf(-4 * s, -h * 0.6, 26 * s, -1);
      leaf(4 * s, -h * 0.9, 26 * s, 1);
      if (stage >= 3) Art.flower(ctx, 0, -h * 1.6 + 46 * s * (stage === 4 ? 1.2 : 0.8), stage === 4 ? 1.2 * s : 0.8 * s, '#ffd43b', 'sunflower');
    } else {
      leaf(-5 * s, 0, h * 0.8, -0.5);
      leaf(5 * s, 0, h * 0.8, 0.5);
      leaf(0, 0, h, 0, '#8fdc7a');
      if (stage >= 3) {
        if (kind === 'carrot') {
          ctx.beginPath();
          ctx.moveTo(-12 * s, -2 * s);
          ctx.lineTo(12 * s, -2 * s);
          ctx.lineTo(0, 30 * s * (stage === 4 ? 1 : 0.5));
          ctx.closePath();
          paint(ctx, '#ff922b', -2, 30 * s, { lw: 2 * s });
        } else if (kind === 'tomato') {
          const c = stage === 4 ? '#ff6b6b' : '#a9e34b';
          for (const [dx, dy] of [[-16, -h * 0.5], [14, -h * 0.65], [0, -h * 0.35]]) {
            circle(ctx, dx * s, dy, 10 * s * (stage === 4 ? 1.2 : 0.8));
            paint(ctx, c, dy - 12 * s, dy + 12 * s, { lw: 2 * s });
          }
        } else if (kind === 'strawberry') {
          for (const [dx, dy] of [[-16, -12], [16, -16]]) {
            ctx.beginPath();
            ctx.moveTo(dx * s - 9 * s, dy * s);
            ctx.lineTo(dx * s + 9 * s, dy * s);
            ctx.lineTo(dx * s, dy * s + 18 * s * (stage === 4 ? 1 : 0.6));
            ctx.closePath();
            paint(ctx, stage === 4 ? '#ff5c7a' : '#ffd8d8', dy * s, dy * s + 18 * s, { lw: 2 * s });
          }
          if (stage === 3) Art.blossom(ctx, 0, -h * 0.7, 5 * s, '#ffffff');
        } else if (kind === 'lettuce') {
          blob(ctx, [[0, -14 * s, 18 * s * stage / 4 + 6 * s], [-12 * s, -8 * s, 12 * s * stage / 4 + 4 * s], [12 * s, -8 * s, 12 * s * stage / 4 + 4 * s]], '#8ce99a', { lw: 2 * s });
        }
      }
    }
    ctx.restore();
    if (stage === 4) FX.list.length < 200 && Math.random() < 0.01 && FX.sparkle(x, y - h, 1);
  },

  weed(ctx, x, y, s = 1) {
    ctx.strokeStyle = '#8a9a4a';
    ctx.lineWidth = 4 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [dx, h] of [[-8, 22], [0, 30], [8, 20], [-3, 16]]) {
      ctx.moveTo(x + dx * s, y);
      ctx.quadraticCurveTo(x + dx * 1.8 * s, y - h * 0.6 * s, x + dx * 2.2 * s, y - h * s);
    }
    ctx.stroke();
  },

  shed(ctx, x, y, s = 1, color = '#9fd8b4') {
    groundShadow(ctx, x, y, 130 * s, 16 * s);
    box(ctx, x - 110 * s, y - 170 * s, 220 * s, 170 * s, 10, color, { lw: 3 });
    for (let i = 1; i < 6; i++) {
      ctx.strokeStyle = shade(color, -0.12);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 110 * s + i * 37 * s, y - 165 * s);
      ctx.lineTo(x - 110 * s + i * 37 * s, y - 4);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - 130 * s, y - 166 * s);
    ctx.lineTo(x, y - 250 * s);
    ctx.lineTo(x + 130 * s, y - 166 * s);
    ctx.closePath();
    paint(ctx, '#ff9e7a', y - 250 * s, y - 166 * s, { lw: 3 });
    Props.door(ctx, x - 34 * s, y - 120 * s, 68 * s, 118 * s, '#ffe0b8');
    drawEmoji(ctx, '🪴', x + 80 * s, y - 196 * s, 40 * s);
  },

  wateringCan(ctx, x, y, s = 1, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    box(ctx, -30 * s, -40 * s, 60 * s, 44 * s, 12 * s, '#7cc6ff', { lw: 2.5 });
    ctx.strokeStyle = shade('#7cc6ff', -0.3);
    ctx.lineWidth = 9 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(28 * s, -16 * s);
    ctx.lineTo(56 * s, -46 * s);
    ctx.stroke();
    ctx.strokeStyle = '#7cc6ff';
    ctx.lineWidth = 6 * s;
    ctx.stroke();
    ctx.strokeStyle = shade('#7cc6ff', -0.3);
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.arc(-10 * s, -42 * s, 18 * s, Math.PI, TAU);
    ctx.stroke();
    ctx.restore();
  },

  gnome(ctx, x, y, s = 1) {
    groundShadow(ctx, x, y, 26 * s, 6 * s);
    ellipse(ctx, x, y - 24 * s, 22 * s, 26 * s);
    paint(ctx, '#7cc6ff', y - 50 * s, y, { lw: 2.5 });
    ctx.beginPath();
    ctx.moveTo(x - 20 * s, y - 54 * s);
    ctx.quadraticCurveTo(x + 4 * s, y - 120 * s, x + 18 * s, y - 104 * s);
    ctx.lineTo(x + 20 * s, y - 54 * s);
    ctx.closePath();
    paint(ctx, '#ff6b6b', y - 110 * s, y - 54 * s, { lw: 2.5 });
    circle(ctx, x, y - 54 * s, 14 * s);
    paint(ctx, '#ffd8b8', y - 68 * s, y - 40 * s, { lw: 2 });
    ellipse(ctx, x, y - 40 * s, 16 * s, 12 * s);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  },

  windmill(ctx, x, y, s = 1) {
    groundShadow(ctx, x, y, 40 * s, 8 * s);
    ctx.beginPath();
    ctx.moveTo(x - 24 * s, y);
    ctx.lineTo(x - 12 * s, y - 120 * s);
    ctx.lineTo(x + 12 * s, y - 120 * s);
    ctx.lineTo(x + 24 * s, y);
    ctx.closePath();
    paint(ctx, '#ffffff', y - 120 * s, y, { lw: 2.5 });
    ctx.save();
    ctx.translate(x, y - 120 * s);
    ctx.rotate(Game.time * 1.5);
    ['#ff8fb8', '#ffd43b', '#7cc6ff', '#7ed99a'].forEach((c, i) => {
      ctx.save();
      ctx.rotate(i * Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(54 * s, -12 * s);
      ctx.lineTo(54 * s, 12 * s);
      ctx.closePath();
      paint(ctx, c, -12 * s, 12 * s, { lw: 2 });
      ctx.restore();
    });
    ctx.restore();
    circle(ctx, x, y - 120 * s, 7 * s);
    ctx.fillStyle = '#7c6a96';
    ctx.fill();
  },

  birdhouse(ctx, x, y, s = 1) {
    box(ctx, x - 5 * s, y - 120 * s, 10 * s, 120 * s, 3, '#a8723f', { lw: 2 });
    box(ctx, x - 32 * s, y - 180 * s, 64 * s, 64 * s, 8, '#ffd6a8', { lw: 2.5 });
    ctx.beginPath();
    ctx.moveTo(x - 42 * s, y - 176 * s);
    ctx.lineTo(x, y - 214 * s);
    ctx.lineTo(x + 42 * s, y - 176 * s);
    ctx.closePath();
    paint(ctx, '#ff8fb8', y - 214 * s, y - 176 * s, { lw: 2.5 });
    circle(ctx, x, y - 150 * s, 11 * s);
    ctx.fillStyle = '#5d4a3a';
    ctx.fill();
  },

  grill(ctx, x, y, s = 1, { on = true } = {}) {
    groundShadow(ctx, x, y, 90 * s, 12 * s);
    ctx.strokeStyle = '#5d5470';
    ctx.lineWidth = 7 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 60 * s, y); ctx.lineTo(x - 40 * s, y - 100 * s);
    ctx.moveTo(x + 60 * s, y); ctx.lineTo(x + 40 * s, y - 100 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 90 * s, y - 140 * s);
    ctx.lineTo(x + 90 * s, y - 140 * s);
    ctx.quadraticCurveTo(x + 86 * s, y - 92 * s, x, y - 90 * s);
    ctx.quadraticCurveTo(x - 86 * s, y - 92 * s, x - 90 * s, y - 140 * s);
    ctx.closePath();
    paint(ctx, '#ff6b6b', y - 140 * s, y - 90 * s, { lw: 3 });
    ctx.strokeStyle = '#8d84a3';
    ctx.lineWidth = 4;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 80 * s + i * 26 * s, y - 142 * s);
      ctx.lineTo(x - 80 * s + i * 26 * s, y - 136 * s);
      ctx.stroke();
    }
    box(ctx, x - 94 * s, y - 146 * s, 188 * s, 8 * s, 4, '#a8a2b8', { lw: 2 });
    if (on) {
      ctx.lineWidth = 6;
      for (let i = 0; i < 3; i++) {
        const t = (Game.time * 0.5 + i / 3) % 1, sx = x - 40 * s + i * 40 * s;
        ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - t)})`;
        ctx.beginPath();
        ctx.moveTo(sx, y - 150 * s - t * 80);
        ctx.quadraticCurveTo(sx + 16, y - 170 * s - t * 80, sx, y - 190 * s - t * 80);
        ctx.stroke();
      }
    }
  },

  picnicTable(ctx, x, y, w = 360, color = '#d39a63') {
    groundShadow(ctx, x, y, w * 0.6, 16);
    for (const side of [-1, 1]) box(ctx, x + side * w * 0.36 - 7, y - 100, 14, 100, 4, shade(color, -0.12), { lw: 2 });
    box(ctx, x - w / 2 - 20, y - 54, w + 40, 16, 6, shade(color, 0.05), { lw: 2.5 });
    box(ctx, x - w / 2, y - 112, w, 22, 8, color, { lw: 3 });
    ctx.save();
    rr(ctx, x - w / 2, y - 112, w, 22, 8);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,107,107,.55)';
    for (let i = 0; i < w / 20; i++) if (i % 2 === 0) ctx.fillRect(x - w / 2 + i * 20, y - 112, 20, 22);
    ctx.restore();
  },

  stringLights(ctx, x1, y1, x2, y2, sag = 40) {
    const n = Math.round(Math.abs(x2 - x1) / 40), cols = PARTY, night = Clock.light().night;
    ctx.strokeStyle = '#7c6a96';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag * 2, x2, y2);
    ctx.stroke();
    for (let i = 1; i < n; i++) {
      const t = i / n, bx = lerp(lerp(x1, (x1 + x2) / 2, t), lerp((x1 + x2) / 2, x2, t), t);
      const by = lerp(lerp(y1, (y1 + y2) / 2 + sag * 2, t), lerp((y1 + y2) / 2 + sag * 2, y2, t), t);
      const c = cols[i % cols.length], on = 0.6 + 0.4 * Math.sin(Game.time * 3 + i);
      if (night > 0.2) {
        ctx.fillStyle = hexA(c, 0.25 * night * on);
        circle(ctx, bx, by + 8, 16);
        ctx.fill();
      }
      ellipse(ctx, bx, by + 8, 6, 9);
      ctx.fillStyle = night > 0.2 ? shade(c, 0.3) : c;
      ctx.fill();
    }
  },

  blanket(ctx, x, y, w = 300, h = 120, color = '#ff8a8a') {
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, -0.25, 1, 0, 0);
    rr(ctx, -w / 2, -h / 2, w, h, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = color;
    for (let i = 0; i < w / 30; i++) if (i % 2 === 0) ctx.fillRect(-w / 2 + i * 30, -h / 2, 30, h);
    for (let j = 0; j < h / 30; j++) if (j % 2 === 0) { ctx.globalAlpha = 0.5; ctx.fillRect(-w / 2, -h / 2 + j * 30, w, 30); ctx.globalAlpha = 1; }
    ctx.restore();
  },

  arcade(ctx, x, y, s = 1, color = '#b197fc', screen = null) {
    groundShadow(ctx, x, y, 80 * s, 12 * s);
    ctx.beginPath();
    ctx.moveTo(x - 70 * s, y);
    ctx.lineTo(x - 70 * s, y - 260 * s);
    ctx.quadraticCurveTo(x - 70 * s, y - 300 * s, x - 30 * s, y - 300 * s);
    ctx.lineTo(x + 30 * s, y - 300 * s);
    ctx.quadraticCurveTo(x + 70 * s, y - 300 * s, x + 70 * s, y - 260 * s);
    ctx.lineTo(x + 70 * s, y);
    ctx.closePath();
    paint(ctx, color, y - 300 * s, y, { lw: 3 });
    box(ctx, x - 56 * s, y - 286 * s, 112 * s, 36 * s, 10, '#fff4b0', { lw: 2.5 });
    box(ctx, x - 52 * s, y - 240 * s, 104 * s, 90 * s, 8, '#3e3a52', { lw: 2.5 });
    if (screen) {
      ctx.save();
      rr(ctx, x - 48 * s, y - 236 * s, 96 * s, 82 * s, 6);
      ctx.clip();
      screen(ctx, x - 48 * s, y - 236 * s, 96 * s, 82 * s);
      ctx.restore();
    }
    box(ctx, x - 64 * s, y - 146 * s, 128 * s, 34 * s, 8, shade(color, -0.1), { lw: 2.5 });
    ctx.strokeStyle = '#5d5470';
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(x - 30 * s, y - 132 * s);
    ctx.lineTo(x - 30 * s, y - 152 * s);
    ctx.stroke();
    circle(ctx, x - 30 * s, y - 156 * s, 8 * s);
    ctx.fillStyle = '#ff6b6b';
    ctx.fill();
    for (const [bx, c] of [[10, '#ffd43b'], [34, '#4dabf7']]) {
      circle(ctx, x + bx * s, y - 130 * s, 7 * s);
      ctx.fillStyle = c;
      ctx.fill();
    }
  },

  cottage(ctx, x, y, s = 1, { wall = '#ffd6a8', roof = '#ff8fb8', door = '#b197fc', lit = false } = {}) {
    groundShadow(ctx, x, y, 140 * s, 20 * s);
    box(ctx, x - 120 * s, y - 170 * s, 240 * s, 170 * s, 16 * s, wall, { lw: 3 });
    ctx.beginPath();
    ctx.moveTo(x - 150 * s, y - 160 * s);
    ctx.quadraticCurveTo(x - 120 * s, y - 300 * s, x, y - 300 * s);
    ctx.quadraticCurveTo(x + 120 * s, y - 300 * s, x + 150 * s, y - 160 * s);
    ctx.closePath();
    paint(ctx, roof, y - 300 * s, y - 160 * s, { lw: 3 });
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 5; i++) { circle(ctx, x - 80 * s + i * 40 * s, y - 196 * s - Math.sin(i) * 20 * s, 9 * s); ctx.fill(); }
    rr(ctx, x - 34 * s, y - 120 * s, 68 * s, 120 * s, 34 * s);
    paint(ctx, door, y - 120 * s, y, { lw: 3 });
    circle(ctx, x + 18 * s, y - 56 * s, 5 * s);
    ctx.fillStyle = '#ffd34d';
    ctx.fill();
    for (const wx of [-80, 80]) {
      circle(ctx, x + wx * s, y - 104 * s, 26 * s);
      paint(ctx, lit ? '#fff1a8' : '#cfeeff', y - 130 * s, y - 78 * s, { lw: 3, line: '#ffffff' });
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + wx * s - 26 * s, y - 104 * s);
      ctx.lineTo(x + wx * s + 26 * s, y - 104 * s);
      ctx.moveTo(x + wx * s, y - 130 * s);
      ctx.lineTo(x + wx * s, y - 78 * s);
      ctx.stroke();
    }
    box(ctx, x + 60 * s, y - 290 * s, 30 * s, 60 * s, 4, '#c9b6e8', { lw: 2.5 });
  },
};
