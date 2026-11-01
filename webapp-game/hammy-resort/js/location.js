// Location scenes: a backdrop, a walkable floor with A* pathfinding, objects
// (spots) with activities, Hammy walking by click / tap / arrow keys / WASD,
// Mom, Dad and an invited friend standing around, and in-place activities
// such as sleeping, watching TV, hugs and slides.

const GRID = 20;

// Walkable cells from rectangles / ellipses minus blocked shapes.
class WalkGrid {
  constructor(walk, blocks) {
    this.cols = W / GRID;
    this.rows = H / GRID;
    this.cells = new Uint8Array(this.cols * this.rows);
    const inside = (s, x, y) => (s.rx ? ((x - s.x) / s.rx) ** 2 + ((y - s.y) / s.ry) ** 2 <= 1 : x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const x = c * GRID + GRID / 2, y = r * GRID + GRID / 2;
      this.cells[r * this.cols + c] = walk.some(s => inside(s, x, y)) && !blocks.some(s => inside(s, x, y)) ? 1 : 0;
    }
  }

  cell(x, y) { return [clamp(Math.floor(x / GRID), 0, this.cols - 1), clamp(Math.floor(y / GRID), 0, this.rows - 1)]; }
  ok(c, r) { return c >= 0 && r >= 0 && c < this.cols && r < this.rows && this.cells[r * this.cols + c] === 1; }
  free(x, y) { const [c, r] = this.cell(x, y); return this.ok(c, r); }

  nearestFree(x, y) {
    const [c0, r0] = this.cell(x, y);
    if (this.ok(c0, r0)) return { x, y };
    for (let d = 1; d < 60; d++) {
      let best = null, bd = Infinity;
      for (let dr = -d; dr <= d; dr++) for (let dc = -d; dc <= d; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== d || !this.ok(c0 + dc, r0 + dr)) continue;
        const px = (c0 + dc) * GRID + GRID / 2, py = (r0 + dr) * GRID + GRID / 2, dd = dist(x, y, px, py);
        if (dd < bd) { bd = dd; best = { x: px, y: py }; }
      }
      if (best) return best;
    }
    return { x, y };
  }

  lineFree(ax, ay, bx, by) {
    const n = Math.ceil(dist(ax, ay, bx, by) / (GRID / 2));
    for (let i = 0; i <= n; i++) if (!this.free(lerp(ax, bx, i / n), lerp(ay, by, i / n))) return false;
    return true;
  }

  // A* over the grid, then straightened where the line is clear.
  path(sx, sy, tx, ty) {
    const s = this.nearestFree(sx, sy), t = this.nearestFree(tx, ty);
    const [sc, sr] = this.cell(s.x, s.y), [tc, tr] = this.cell(t.x, t.y), cols = this.cols;
    const key = (c, r) => r * cols + c, start = key(sc, sr), goal = key(tc, tr);
    const g = new Map([[start, 0]]), came = new Map(), open = [[0, start]], closed = new Set();
    const hfn = k => Math.hypot((k % cols) - tc, Math.floor(k / cols) - tr);
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [, cur] = open.splice(bi, 1)[0];
      if (cur === goal) break;
      if (closed.has(cur)) continue;
      closed.add(cur);
      const cc = cur % cols, cr = Math.floor(cur / cols);
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nc = cc + dc, nr = cr + dr;
        if (!this.ok(nc, nr) || (dr && dc && (!this.ok(cc + dc, cr) || !this.ok(cc, cr + dr)))) continue;
        const nk = key(nc, nr), ng = g.get(cur) + (dr && dc ? 1.414 : 1);
        if (ng < (g.get(nk) ?? Infinity)) {
          g.set(nk, ng);
          came.set(nk, cur);
          open.push([ng + hfn(nk), nk]);
        }
      }
    }
    if (!came.has(goal) && goal !== start) return [t];
    const cells = [goal];
    while (cells[0] !== start) cells.unshift(came.get(cells[0]));
    const pts = cells.map(k => ({ x: (k % cols) * GRID + GRID / 2, y: Math.floor(k / cols) * GRID + GRID / 2 }));
    pts[pts.length - 1] = t;
    const out = [];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !this.lineFree(pts[i].x, pts[i].y, pts[j].x, pts[j].y)) j--;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }
}

// ---------------------------------------------------------- Mom & Dad

// Where Mom and Dad usually are, by hour. Activities that need them call
// them over (Family.summon) for a while.
const Family = {
  summoned: {},
  ROUTINE: {
    mom: [[6, 'room:kitchen'], [9, 'garden'], [11.5, 'pool'], [12.5, 'room:kitchen'], [13.5, 'room:living'], [16, 'garden'], [17.5, 'room:kitchen'], [19, 'room:living'], [21, 'room:family']],
    dad: [[6, 'room:living'], [9, 'sports'], [11.5, 'pool'], [12.5, 'room:family'], [15.5, 'room:living'], [16, 'playground'], [17.5, 'bbq'], [19, 'room:living'], [21, 'room:family']],
  },
  where(who) {
    const s = this.summoned[who];
    if (s && Clock.total() < s.until) return s.scene;
    const h = S.time.minute / 60, r = this.ROUTINE[who];
    let cur = r[r.length - 1][1];
    for (const [at, scene] of r) if (h >= at) cur = scene;
    return cur;
  },
  summon(who, scene, minutes = 60) {
    for (const w of who === 'family' ? ['mom', 'dad'] : [who]) this.summoned[w] = { scene, until: Clock.total() + minutes };
  },
};

const Friends = {
  // Each friend's favorite game for "Play together".
  GAMES: { pip: 'basketball', nutmeg: 'bugs', coco: 'dance', mochi: 'memory', biscuit: 'bowling', sunny: 'catch' },
  game(id) { return this.GAMES[id] || 'dance'; },
  birthday() { return FRIENDS[S.time.day % 7] || null; },
  invited() { return S.friends.invited ? FRIEND[S.friends.invited] : null; },
};

// --------------------------------------------------------- the factory

function makeLocation(def) {
  const scene = {
    walkable: true,
    back: def.back || 'map',
    music: def.music || 'outdoor',
    hamSize: def.hamSize || 150,
    ...def,
    acts: def.acts || [...new Set(Object.values(def.spots).flatMap(s => s.acts || []))],
  };

  scene.enter = function (params = {}, prev) {
    this.grid = this.grid || new WalkGrid(this.walk, this.blocks || []);
    this.ham = { x: 0, y: 0, facing: 1, path: [], pose: 'idle', onArrive: null, bubble: null };
    this.inline = null;
    this.hover = null;
    this.bubbleT = 6;
    this.lastLine = '';
    const entry = params.returnPos || (prev && this.entries?.[prev]) || this.start || { x: W / 2, y: H * 0.8 };
    const p = this.grid.nearestFree(entry.x, entry.y);
    Object.assign(this.ham, { x: p.x, y: p.y });
    this.friend = Friends.invited() ? { x: p.x - 110, y: p.y + 10, facing: 1 } : null;
    S.scene = this.id;
    S.pos = null;
    Music.play(Clock.isNight() && !this.outdoor ? 'night' : this.music);
    def.onEnter?.call(this, params);
    const loc = locationOf(this.id);
    if (!S.seen[this.id]) {
      S.seen[this.id] = true;
      if (loc) S.seen[loc] = true;
      setTimeout(() => {
        Rewards.addStars(1, { x: this.ham.x, y: this.ham.y - 160 });
        UI.toast(`🧭 New place: ${placeName(this.id)}! +1 ⭐`);
        Rewards.check(null);
        UI.flushRewards();
      }, 700);
    }
    if (!Travel.arrive()) this.sayWish(true);
    Save.mark();
  };

  scene.exit = function (to) {
    if (!to?.startsWith('game:')) this.cancelInline();
    Snd.water(false);
  };

  scene.hammyPos = function () { return { x: this.ham.x, y: this.ham.y - this.hamSize * 0.6 }; };

  // ---------------------------------------------------------- movement

  scene.walkTo = function (x, y, onArrive = null) {
    const h = this.ham;
    h.path = this.grid.path(h.x, h.y, x, y);
    h.onArrive = onArrive;
    if (!h.path.length) this.arrive();
  };

  scene.walkToSpot = function (id, cb) {
    const s = this.spots[id];
    if (!s) return cb?.();
    this.walkTo(s.x, s.y, () => {
      this.ham.facing = s.face || (s.hit ? Math.sign(s.hit.x + s.hit.w / 2 - this.ham.x) || 1 : this.ham.facing);
      cb?.();
    });
  };

  scene.arrive = function () {
    const h = this.ham, cb = h.onArrive;
    h.path = [];
    h.onArrive = null;
    cb?.();
  };

  scene.update = function (dt) {
    const h = this.ham;
    def.update?.call(this, dt);
    if (this.inline) {
      this.updateInline(dt);
    } else {
      const [dx, dy] = Input.dir();
      if (dx || dy) {
        h.path = [];
        h.onArrive = null;
        const sp = 300 * dt, nx = h.x + dx * sp, ny = h.y + dy * sp;
        if (this.grid.free(nx, ny)) { h.x = nx; h.y = ny; }
        else if (this.grid.free(nx, h.y)) h.x = nx;
        else if (this.grid.free(h.x, ny)) h.y = ny;
        if (dx) h.facing = Math.sign(dx);
        h.pose = 'walk';
        this.checkDoors();
      } else if (h.path.length) {
        const tgt = h.path[0], d = dist(h.x, h.y, tgt.x, tgt.y), far = h.path.reduce((a, p, i) => a + (i ? dist(p.x, p.y, h.path[i - 1].x, h.path[i - 1].y) : d), 0);
        const sp = (far > 600 ? 420 : 280) * dt;
        h.pose = far > 600 ? 'run' : 'walk';
        if (Math.abs(tgt.x - h.x) > 2) h.facing = Math.sign(tgt.x - h.x);
        if (d <= sp) {
          h.x = tgt.x;
          h.y = tgt.y;
          h.path.shift();
          if (!h.path.length) {
            this.arrive();
            this.checkDoors();
          }
        } else {
          h.x += (tgt.x - h.x) / d * sp;
          h.y += (tgt.y - h.y) / d * sp;
        }
        if (Math.random() < dt * 4) Snd.step();
      } else if (h.pose === 'walk' || h.pose === 'run') h.pose = 'idle';
    }
    // The invited friend follows a little behind.
    if (this.friend) {
      const f = this.friend, tx = h.x - h.facing * 110, ty = h.y + 8, d = dist(f.x, f.y, tx, ty);
      f.moving = d > 20;
      if (f.moving) {
        f.x += (tx - f.x) * Math.min(1, dt * 3);
        f.y += (ty - f.y) * Math.min(1, dt * 3);
        f.facing = Math.sign(tx - f.x) || f.facing;
      }
    }
    if (h.bubble && (h.bubble.t -= dt) <= 0) h.bubble = null;
    if ((this.bubbleT -= dt) <= 0) this.sayWish(false);
  };

  // Walking into a doorway leads to the next room.
  scene.checkDoors = function () {
    if (!this.doors || this.inline || Activity.current) return;
    for (const d of this.doors) {
      if (this.ham.x >= d.x && this.ham.x <= d.x + d.w && this.ham.y >= d.y && this.ham.y <= d.y + d.h) {
        this.ham.path = [];
        Game.go(d.to, {});
        return;
      }
    }
  };

  // Hammy says what it would like, now and then (and on arrival if urgent).
  scene.sayWish = function (arrival) {
    this.bubbleT = rand(28, 40);
    if (this.inline || Activity.current) return;
    const w = Wishes.top();
    if (!w || (arrival && !Wishes.urgent())) return;
    this.ham.bubble = { text: w.line, icon: w.act.icon, t: 6 };
    if (w.line !== this.lastLine) Speech.say(w.line, { interrupt: false });
    this.lastLine = w.line;
  };

  scene.say = function (text, secs = 4, speak = true) {
    this.ham.bubble = { text, t: secs };
    if (speak) Speech.say(text);
  };

  // ---------------------------------------------------------- characters

  scene.people = function () {
    const out = [];
    for (const who of ['mom', 'dad']) {
      if (Family.where(who) !== this.id || !this.family?.[who]) continue;
      const pos = this.family[who];
      out.push({ kind: who, x: pos.x, y: pos.y, pose: pos.pose || 'idle', facing: pos.facing || -1, h: this.hamSize * FAMILY[who].h, acts: pos.acts || [`hug_${who}`, who === 'mom' ? 'play_mom' : 'play_dad'] });
    }
    if (this.extraPeople) out.push(...this.extraPeople.call(this));
    return out;
  };

  scene.drawCharacters = function (ctx) {
    const h = this.ham, list = [];
    const inl = this.inline, pos = inl?.place || h;
    list.push({ y: pos.y, layer: inl?.layer || 0, draw: () => this.drawHammy(ctx) });
    for (const p of this.people()) {
      const hug = inl?.kind === 'hug' && (inl.with === p.kind || inl.with === 'family');
      list.push({ y: p.y, draw: () => drawHamster(ctx, p.x, p.y, p.h, { kind: p.kind, pose: hug ? 'hug' : p.pose, facing: p.facing, mood: 'happy', seed: p.kind.length, lookAt: { x: h.x, y: h.y - 90 } }) });
    }
    if (this.friend && !(this.hideFriend)) {
      const f = this.friend;
      list.push({ y: f.y, draw: () => drawHamster(ctx, f.x, f.y, this.hamSize * 0.95, { kind: S.friends.invited, pose: f.moving ? 'walk' : 'idle', facing: f.facing, mood: 'happy', seed: 3 }) });
    }
    if (this.props) for (const p of this.props) list.push({ y: p.y, draw: () => p.draw.call(this, ctx) });
    list.sort((a, b) => (a.layer || 0) - (b.layer || 0) || a.y - b.y);
    for (const d of list) d.draw();
  };

  scene.drawHammy = function (ctx) {
    const h = this.ham, inl = this.inline;
    const wet = this.id === 'pool' && inl?.kind === 'splash';
    if (inl?.place) {
      const p = inl.place;
      drawHamster(ctx, p.x, p.y, (p.size || 1) * this.hamSize, { pose: p.pose, facing: p.facing ?? h.facing, mood: inl.mood || Mood.current(), shadow: p.shadow !== false, t: Game.time, dirt: false });
      return;
    }
    drawHamster(ctx, h.x, h.y, this.hamSize, { pose: h.pose, facing: h.facing, mood: Mood.current(), lookAt: this.hover ? { x: this.hover.x, y: this.hover.y - 60 } : null, dirt: wet ? false : undefined });
  };

  scene.draw = function (ctx) {
    // Outdoors the sky is live (time of day, weather) behind the cached ground.
    if (this.outdoor) Sky.draw(ctx, 0, 0, W, (this.horizon || 340) + 60, { seed: this.id.length, clouds: 4, sunX: 0.82 });
    Cache.draw(ctx, `scene:${this.id}`, 0, 0, W, H, g => this.drawBack(g));
    this.drawDyn?.(ctx);
    this.drawCharacters(ctx);
    this.drawFront?.(ctx);
    if (this.inline) this.drawInline(ctx);
    Sky.overlay(ctx, { indoor: !this.outdoor });
    for (const l of this.lights?.() || []) Sky.glow(ctx, l[0], l[1], l[2], l[3], l[4]);
    if (this.outdoor && Weather.rainy()) Art.rain(ctx, 0, 0, W, H, 1);
    this.drawSpotBadges(ctx);
    const h = this.ham;
    if (h.bubble) speechBubble(ctx, h.bubble.text, h.x, h.y - this.hamSize * 1.12, { icon: h.bubble.icon, size: 24 });
  };

  // Floating icons above objects show what can be done there.
  scene.drawSpotBadges = function (ctx) {
    if (this.inline) return;
    const t = Game.time, near = this.nearSpot();
    for (const [id, s] of Object.entries(this.spots)) {
      if (!s.acts?.length || s.badge === false) continue;
      const b = s.badgeAt || { x: s.hit.x + s.hit.w / 2, y: s.hit.y - 18 };
      const hover = this.hover === s || near === s, by = b.y + Math.sin(t * 2 + id.length) * 4;
      ctx.save();
      ctx.globalAlpha = hover ? 1 : 0.85;
      circle(ctx, b.x, by, hover ? 32 : 25);
      ctx.fillStyle = hover ? '#fff3b8' : 'rgba(255,255,255,.9)';
      ctx.shadowColor = 'rgba(74,58,92,.25)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
      drawEmoji(ctx, ACTS[s.acts[0]]?.icon || '✨', b.x, by, hover ? 40 : 32);
      if (hover) drawText(ctx, s.name, b.x, by - 50, 24, { color: PAL.ink, stroke: '#fff', sw: 0.28 });
      if (near === s && Input.lastDevice === 'key') drawText(ctx, 'Press Enter', b.x, by + 46, 18, { color: '#7b6a8f', stroke: '#fff', sw: 0.3 });
    }
  };

  scene.nearSpot = function () {
    const h = this.ham;
    let best = null, bd = 170;
    for (const s of Object.values(this.spots)) {
      if (!s.acts?.length) continue;
      const d = dist(h.x, h.y, s.x, s.y);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  };

  scene.spotAt = function (p) {
    return Object.values(this.spots).find(s => s.hit && p.x >= s.hit.x && p.x <= s.hit.x + s.hit.w && p.y >= s.hit.y && p.y <= s.hit.y + s.hit.h)
      || Object.values(this.spots).find(s => s.acts?.length && dist(p.x, p.y, (s.badgeAt || { x: s.hit.x + s.hit.w / 2 }).x, (s.badgeAt || { y: s.hit.y - 18 }).y) < 34);
  };

  scene.personAt = function (p) {
    const list = this.people().map(x => ({ ...x }));
    if (this.friend) list.push({ kind: S.friends.invited, x: this.friend.x, y: this.friend.y, h: this.hamSize, friend: true });
    return list.find(c => Math.abs(p.x - c.x) < c.h * 0.4 && p.y < c.y + 10 && p.y > c.y - c.h);
  };

  // ------------------------------------------------------------ input

  scene.pointerMove = function (p) {
    this.hover = this.inline ? null : this.spotAt(p) || null;
    Game.canvasCursor(this.hover || this.personAt(p) ? 'pointer' : '');
  };

  scene.pointerDown = function (p) {
    if (this.inline) return this.tapInline(p);
    const person = this.personAt(p);
    if (person) return this.openPerson(person);
    const s = this.spotAt(p);
    if (s) {
      this.walkToSpot(Object.keys(this.spots).find(k => this.spots[k] === s), () => this.openSpot(s));
      return;
    }
    if (this.clickExtra?.(p)) return;
    this.walkTo(p.x, p.y);
    FX.sparkle(p.x, p.y, 3);
  };

  scene.openSpot = function (s) {
    const b = s.badgeAt || { x: s.hit.x + s.hit.w / 2, y: s.hit.y - 18 };
    if (s.go) return Game.go(s.go);
    if (s.acts?.length === 1 && !s.alwaysAsk) return Activity.start(s.acts[0]);
    UI.actPopover(b.x, b.y - 30, s.name, s.acts);
    Speech.say(s.name);
  };

  scene.openPerson = function (c) {
    if (c.villager) {
      const f = FRIEND[c.kind];
      this.walkTo(c.x - 120, c.y + 10, () => { this.ham.facing = 1; });
      UI.openFriend(f);
      S.friends.visited[f.id] = true;
      Rewards.check(null);
      UI.flushRewards();
      return;
    }
    if (c.friend) {
      const f = FRIEND[c.kind];
      return UI.popover(c.x, c.y - c.h - 10, f.name, [
        { icon: '🤝', label: 'Play together', onClick: () => Activity.start('play_friend', { friend: f.id }) },
        { icon: '🍪', label: 'Share a snack', onClick: () => Activity.start({ ...ACTS.share_food, where: this.id }, { friend: f.id }) },
        { icon: '👋', label: 'Go home', onClick: () => { S.friends.invited = null; this.friend = null; Save.mark(); UI.toast(`👋 Bye bye, ${f.name}!`); } },
      ]);
    }
    const who = c.kind, name = FAMILY[who].name;
    Speech.say(pick([`Hi sweetie!`, `Hello ${S.hamster.name}!`, `I love you!`]));
    UI.popover(c.x, c.y - c.h - 10, name, c.acts.filter(id => ACTS[id]).map(id => ({
      id, icon: ACTS[id].icon, label: ACTS[id].name,
      onClick: () => Activity.start(ACTS[id].where ? id : { ...ACTS[id], where: this.id }),
    })));
  };

  scene.key = function (e) {
    if ((e.code === 'Enter' || e.code === 'Space') && !this.inline) {
      const s = this.nearSpot();
      if (s) this.openSpot(s);
      return true;
    }
    if (this.inline && (e.code === 'Enter' || e.code === 'Space')) {
      this.tapInline({ x: this.ham.x, y: this.ham.y - 60 });
      return true;
    }
    return false;
  };

  // ------------------------------------------------------- in-place acts

  scene.beginInline = function (act, params = {}) {
    const kind = act.inline.kind, spot = this.spots[act.spot] || null;
    const inl = { act, kind, params, t: 0, secs: act.inline.secs || 4, taps: 0, with: act.with, place: null, layer: 0 };
    const sit = spot?.sit;
    if (sit) inl.place = { ...sit };
    if (act.with === 'mom' || act.with === 'dad' || act.with === 'family') Family.summon(act.with, this.id, 45);
    if (kind === 'hug') {
      inl.place = null;
      const who = act.with === 'family' ? 'mom' : act.with, pos = this.family?.[who];
      if (pos) this.ham.x = pos.x + (pos.x > W / 2 ? -110 : 110), this.ham.y = pos.y + 4;
      this.ham.pose = 'hug';
      Snd.heart();
      Speech.say(pick(['I love you!', 'Big hug!', 'Squeeze!']));
    }
    if (kind === 'sleep' || kind === 'nap') {
      const h = S.time.minute / 60;
      inl.until = kind === 'nap' ? Clock.total() + 60 : h >= 18 || h < 7 ? Clock.total() + ((7 * 60 - S.time.minute + 1440) % 1440 || 1440) : Clock.total() + 120;
      S.asleep = true;
      Clock.boost = kind === 'nap' ? 24 : 75;
      inl.place = inl.place || { x: this.ham.x, y: this.ham.y, pose: 'sleep' };
      inl.place.pose = 'sleep';
      Music.play('night');
      Speech.say(kind === 'nap' ? 'Nap time. Sweet dreams!' : 'Good night! Sleep tight!');
    }
    if (kind === 'toilet') Speech.say('Potty time!');
    if (kind === 'tv') { inl.channel = 0; Speech.say('Cartoon time!'); }
    if (kind === 'share' || kind === 'invite') {
      const f = FRIEND[params.friend] || Friends.invited() || FRIENDS[0];
      inl.friend = f;
      S.friends.hearts[f.id] = (S.friends.hearts[f.id] || 0) + 1;
      S.friends.visited[f.id] = true;
      if (kind === 'invite') {
        S.friends.invited = f.id;
        this.friend = { x: this.ham.x - 100, y: this.ham.y + 8, facing: 1 };
        Speech.say(`Yay! ${f.name} is coming to play at the resort!`);
      } else Speech.say(`Here you go, ${f.name}! Let's share!`);
      Snd.heart();
    }
    if (kind === 'splash') Speech.say('Tap the water to splash!');
    if (spot?.route) inl.route = spot.route;
    this.inline = inl;
    def.onInline?.call(this, inl);
  };

  scene.updateInline = function (dt) {
    const inl = this.inline;
    inl.t += dt;
    if (inl.kind === 'sleep' || inl.kind === 'nap') {
      if (Math.random() < dt * 0.5) Snd.snore();
      if (Clock.total() >= inl.until) this.finishInline();
      return;
    }
    if (inl.route) {
      const r = inl.route, p = clamp(inl.t / inl.secs, 0, 0.999), seg = p * (r.length - 1), i = Math.floor(seg), f = seg - i;
      inl.place = { x: lerp(r[i][0], r[i + 1][0], f), y: lerp(r[i][1], r[i + 1][1], f), pose: r[i][2] || 'ride', facing: Math.sign(r[i + 1][0] - r[i][0]) || 1, shadow: false };
    }
    def.inlineTick?.call(this, inl, dt);
    if (inl.kind === 'train' && Math.random() < dt * 0.7) Snd.tone(660, 0.25, { type: 'square', vol: 0.05 });
    if (inl.kind === 'splash' && Math.random() < dt * 2) FX.bubbles(inl.place?.x || this.ham.x, (inl.place?.y || this.ham.y) - 40, 2);
    if (inl.t >= inl.secs) this.finishInline();
  };

  scene.finishInline = function () {
    const inl = this.inline;
    if (!inl) return;
    this.inline = null;
    if (inl.kind === 'sleep' || inl.kind === 'nap') {
      S.asleep = false;
      Clock.boost = 0;
      if (inl.kind === 'sleep' && S.time.minute >= 6 * 60 && S.time.minute < 9 * 60 && !S.today.done.includes('wake')) S.today.done.push('wake');
      Music.play(this.music);
      Speech.say(pick(['Good morning! I feel so rested!', 'Yawn! What a nice sleep!']));
    }
    if (inl.kind === 'toilet') {
      Snd.flush();
      setTimeout(() => Speech.say("Don't forget to wash your hands!", { interrupt: false }), 300);
    }
    const h = this.ham;
    if (inl.place && !inl.route) { /* stay where we were standing */ }
    if (inl.route) {
      const end = inl.route[inl.route.length - 1], p = this.grid.nearestFree(end[0], end[1]);
      h.x = p.x;
      h.y = p.y;
    }
    h.pose = 'celebrate';
    setTimeout(() => { if (h.pose === 'celebrate') h.pose = 'idle'; }, 1500);
    Activity.complete({ bonus: inl.taps >= 5 ? 1 : 0 });
  };

  scene.cancelInline = function () {
    const inl = this.inline;
    if (!inl) return;
    this.inline = null;
    if (inl.kind === 'sleep' || inl.kind === 'nap') {
      S.asleep = false;
      Clock.boost = 0;
      Music.play(this.music);
    }
    this.ham.pose = 'idle';
  };

  // Taps during an in-place activity: splashes, sparkles, channel changes,
  // and waking up early.
  scene.tapInline = function (p) {
    const inl = this.inline;
    inl.taps++;
    switch (inl.kind) {
      case 'sleep': case 'nap':
        if (inl.taps >= 2 || dist(p.x, p.y, W - 150, 120) < 90) { Speech.say('Good morning!'); this.finishInline(); }
        else UI.toast('😴 Tap again to wake up — or let Hammy sleep until morning.');
        break;
      case 'tv': inl.channel = (inl.channel + 1) % 3; Snd.tap(); break;
      case 'splash': FX.burst(p.x, p.y, { n: 12, kind: 'bubble', size: 9, speed: 260, g: 500 }); Snd.splash(); break;
      case 'train': Snd.tone(700, 0.4, { type: 'square', vol: 0.06 }); Snd.tone(560, 0.4, { type: 'square', vol: 0.06, delay: 0.25 }); break;
      default: FX.hearts(p.x, p.y, 3); Snd.sparkle();
    }
  };

  scene.drawInline = function (ctx) {
    const inl = this.inline, k = inl.kind;
    if (this.inlineDraw?.[k]) this.inlineDraw[k].call(this, ctx, inl);
    if (k === 'sleep' || k === 'nap') {
      ctx.fillStyle = 'rgba(30,26,80,.35)';
      ctx.fillRect(0, 0, W, H);
      const left = Math.max(0, inl.until - Clock.total());
      drawText(ctx, k === 'nap' ? '😴 Nap time…' : '🌙 Sweet dreams…', W / 2, 150, 46, { color: '#fff', stroke: 'rgba(60,40,120,.6)' });
      drawText(ctx, `${Clock.label()} · wakes in ${Math.ceil(left / 60)} h`, W / 2, 205, 26, { color: '#e6ddff' });
      box(ctx, W - 250, 80, 200, 80, 40, '#ffe48a', { lw: 3 });
      drawText(ctx, '☀️ Wake up', W - 150, 121, 28);
      return;
    }
    if (k === 'toilet') {
      const s = this.spots[inl.act.spot];
      const p = Math.min(1, inl.t * 3), x = s.hit.x - 20, w = (s.hit.w + 40) * p;
      box(ctx, x, s.hit.y - 30, w, s.hit.h + 40, 18, '#ffd6e5', { lw: 3 });
      if (p >= 1) {
        drawEmoji(ctx, '🚽', x + w / 2, s.hit.y + s.hit.h / 2 - 20, 70);
        drawText(ctx, 'Privacy please! 🎵', x + w / 2, s.hit.y + s.hit.h / 2 + 40, 24);
      }
    }
    if (k === 'share' && inl.friend) {
      const h = this.ham;
      drawHamster(ctx, h.x + 130, h.y, this.hamSize * 0.95, { kind: inl.friend.id, pose: 'eat', holding: '🍪', mood: 'happy' });
      if (Math.random() < 0.05) FX.hearts(h.x + 65, h.y - 150, 1);
    }
    // A progress ring above Hammy for timed activities.
    const pos = inl.place || this.ham, p = clamp(inl.t / inl.secs, 0, 1), ry = pos.y - this.hamSize * 1.25;
    if (!inl.route && k !== 'toilet') {
      circle(ctx, pos.x, ry, 30);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#7ed99a';
      ctx.beginPath();
      ctx.arc(pos.x, ry, 30, -Math.PI / 2, -Math.PI / 2 + p * TAU);
      ctx.stroke();
      drawEmoji(ctx, inl.act.icon, pos.x, ry, 34);
    }
  };

  return defineScene(def.id, scene);
}

// Canvas cursor helper (hand over things you can click).
Game.canvasCursor = function (c) {
  if (this._cursor !== c) View.canvas.style.cursor = this._cursor = c;
};
