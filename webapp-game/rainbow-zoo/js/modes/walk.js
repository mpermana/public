// Walk & Play: move your animal around and collect stars, counting to ten.
// Arrows / d-pad / stick or hold the mouse to walk. Space, A or clicking the
// animal does its special move. Letter and number keys float out of it.

Modes.push({
  id: 'walk', emoji: '🐾', title: 'mode_walk', inputs: '⌨️ 🖱️ 🎮', color: '#ff4d6d',

  start() {
    this.animal = new Animal(Settings.animal);
    this.stars = [];
    this.count = 0;
    this.holdingAnimal = false;
    this.dock = UI.animalDock(id => this.animal.setKind(id));
    UI.setExtra(...this.dock.nodes);
    UI.say(this.animal.kind.id, this.animal.kind.emoji);
  },

  update(dt) {
    let [dx, dy] = Input.dir();
    const p = Input.pointer;
    if (p.down && !this.holdingAnimal && !dx && !dy) [dx, dy] = this.animal.steer(p.x, p.y);
    this.animal.update(dt, dx, dy);

    while (this.stars.length < 3) this.stars.push(this.newStar());
    for (const s of this.stars) s.t += dt;
    const a = this.animal, hit = this.stars.find(s => dist(s.x, s.y, a.x, a.y) < a.radius + s.r);
    if (hit) this.collect(hit);
  },

  newStar() {
    const a = this.animal;
    for (let tries = 0; ; tries++) {
      const s = { x: rand(0.08, 0.92) * Stage.w, y: rand(Math.max(150, Stage.h * 0.3), Stage.h * 0.88), r: 34 * Stage.k, t: rand(0, 6) };
      if (tries > 20 || dist(s.x, s.y, a.x, a.y) > a.radius * 3) return s;
    }
  },

  collect(star) {
    this.stars.splice(this.stars.indexOf(star), 1);
    this.count++;
    Sfx.ding(this.count);
    FX.burst(star.x, star.y, { n: 14 });
    FX.text(star.x, star.y - star.r, String(this.count), RAINBOW[(this.count - 1) % RAINBOW.length].hex, 80);
    UI.say('n' + this.count, '⭐');
    Progress.earn(1, star.x, star.y);
    if (this.count === 10) {
      Progress.earn(3, this.animal.x, this.animal.y);
      Sfx.tada();
      Speech.speak(word('great').text, Settings.lang, { interrupt: false });
      FX.burst(this.animal.x, this.animal.y, { n: 50, speed: 600 });
      this.animal.doAction();
      this.count = 0;
    }
  },

  switchAnimal(step) {
    const i = ANIMALS.findIndex(a => a.id === this.animal.kind.id);
    const next = ANIMALS[(i + step + ANIMALS.length) % ANIMALS.length];
    Settings.animal = next.id;
    Settings.save();
    this.animal.setKind(next.id);
    this.dock.mark();
    FX.burst(this.animal.x, this.animal.y, { emojis: ['✨'], n: 8 });
    UI.say(next.id, next.emoji);
  },

  floatChar(ch) {
    const a = this.animal, k = Stage.k;
    FX.add({ kind: 'text', text: ch, x: a.x + rand(-20, 20) * k, y: a.y - a.size * 0.6, vx: rand(-60, 60) * k, vy: -220 * k, g: 60 * k, life: 1.6, size: 80 * k, color: pick(RAINBOW).hex });
    Sfx.pop();
    Speech.speak(/\d/.test(ch) ? word('n' + ch).text : ch);
  },

  draw(ctx) {
    for (const s of this.stars) {
      drawEmoji(ctx, '⭐', s.x, s.y + Math.sin(s.t * 3) * 6 * Stage.k, s.r * 2.4 * (1 + Math.sin(s.t * 5) * 0.06), { rot: Math.sin(s.t * 2) * 0.2 });
    }
    this.animal.draw(ctx);
    drawStarMeter(ctx, this.count, 10);
  },

  hint() { return animalHint(this.animal); },

  onAction() {
    this.animal.doAction();
    UI.say(this.animal.kind.id, this.animal.kind.emoji);
  },

  onPointerDown(p) {
    const a = this.animal;
    this.holdingAnimal = dist(p.x, p.y, a.x, a.y) < a.radius * 1.4;
    if (this.holdingAnimal) this.onAction();
  },

  onKey(e) {
    const ch = keyChar(e.code);
    if (ch) { this.floatChar(ch); return true; }
    if (e.code === 'Tab') { this.switchAnimal(e.shiftKey ? -1 : 1); return true; }
    return false;
  },

  onPad(i) {
    if (i === 1) { this.onAction(); return true; }
    if (i === 2 || i === 5) { this.switchAnimal(1); return true; }
    if (i === 3 || i === 4) { this.switchAnimal(-1); return true; }
    return false;
  },
});
