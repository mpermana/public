// Experience and levels. Successes around the zoo (a star collected, a food
// eaten, a balloon popped, a quiz solved...) earn ⭐ experience. Each star flies
// into the level badge in the top bar; a full bar is a level up, and some
// levels unlock a hat that every animal wears (HATS in content.js).

const FLY_TIME = 0.75; // seconds for an earned star to reach the badge

// Stars needed to go from `level` to the next: quick at first, then steady.
const xpToNext = level => Math.min(10 * level, 60);

function levelInfo(xp) {
  let level = 1;
  while (xp >= xpToNext(level)) xp -= xpToNext(level++);
  return { level, into: xp, need: xpToNext(level) };
}

const Progress = {
  xp: 0,         // every star ever earned
  shownXp: 0,    // what the badge shows; it catches up as flying stars land
  hat: null,     // id of the hat the animals wear, or null
  flying: [],
  onLevelUp: null,

  init() {
    try {
      const saved = JSON.parse(localStorage.getItem('rainbowZoo.progress') || '{}');
      if (Number.isInteger(saved.xp) && saved.xp > 0) this.xp = this.shownXp = saved.xp;
      if (this.unlocked(saved.hat)) this.hat = saved.hat;
    } catch { /* storage blocked: start fresh */ }
    this.card = document.getElementById('levelup');
    this.pill = document.getElementById('level-pill');
    this.badge = document.getElementById('level-badge');
    this.render();
  },

  save() {
    try {
      localStorage.setItem('rainbowZoo.progress', JSON.stringify({ xp: this.xp, hat: this.hat }));
    } catch { /* storage blocked */ }
  },

  // The level the child has seen, so a hat unlocks when the bar fills, not before.
  get level() { return levelInfo(this.shownXp).level; },

  unlocked(id) {
    const hat = HATS.find(h => h.id === id);
    return !!hat && hat.level <= this.level;
  },

  wear(id) {
    this.hat = id;
    this.save();
  },

  // Award `n` stars that fly from (x, y) on the stage to the badge.
  earn(n, x = Stage.w / 2, y = Stage.h / 2) {
    this.xp += n;
    this.save();
    for (let i = 0; i < n; i++) this.flying.push({ x, y, t: -i * 0.09, step: i, bend: rand(-1, 1) });
  },

  update(dt) {
    if (!this.flying.length) return;
    for (const s of this.flying) s.t += dt;
    const landed = this.flying.filter(s => s.t >= FLY_TIME);
    if (!landed.length) return;
    this.flying = this.flying.filter(s => s.t < FLY_TIME);
    const before = this.level;
    this.shownXp += landed.length;
    landed.forEach(s => Sfx.twinkle(s.step));
    this.render(true);
    for (let level = before + 1; level <= this.level; level++) this.levelUp(level);
  },

  // Stars curve up to the badge, shrinking as they arrive.
  draw(ctx) {
    if (!this.flying.length) return;
    const r = this.badge.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height / 2, k = Stage.k;
    for (const s of this.flying) {
      if (s.t < 0) continue;
      const p = s.t / FLY_TIME, e = p * p * (3 - 2 * p), u = 1 - e;
      const cx = (s.x + tx) / 2 + s.bend * 160 * k, cy = Math.min(s.y, ty) - 60 * k;
      const x = u * u * s.x + 2 * u * e * cx + e * e * tx, y = u * u * s.y + 2 * u * e * cy + e * e * ty;
      drawEmoji(ctx, '⭐', x, y, (34 + 22 * Math.sin(Math.PI * Math.min(1, p * 1.6))) * k * (1 - e * 0.5), { rot: s.t * 8 });
    }
  },

  // The badge in the top bar: level number, rainbow bar, and the next hat to win.
  render(bump = false) {
    const { level, into, need } = levelInfo(this.shownXp), next = HATS.find(h => h.level > level);
    document.getElementById('level-num').textContent = level;
    document.getElementById('level-fill').style.width = `${into / need * 100}%`;
    document.getElementById('level-next').textContent = next ? next.emoji : '⭐';
    this.pill.title = `Level ${level}: ${into} / ${need} ⭐${next ? ` · ${next.emoji} at level ${next.level}` : ''}`;
    if (bump) {
      this.pill.classList.remove('bump');
      void this.pill.offsetWidth; // restart the animation
      this.pill.classList.add('bump');
    }
  },

  levelUp(level) {
    const reward = HATS.find(h => h.level === level);
    if (reward) this.wear(reward.id);
    Sfx.fanfare();
    Speech.speak(word('levelup').text, Settings.lang, { interrupt: false });
    if (reward) Speech.speak(word(reward.id).text, Settings.lang, { interrupt: false });
    for (let i = 0; i < 4; i++) FX.burst(rand(0.15, 0.85) * Stage.w, rand(0.25, 0.6) * Stage.h, { n: 24, speed: 520 });
    FX.burst(Stage.w / 2, Stage.h * 0.5, { emojis: ['🎉', '⭐', '🌈'], n: 10, speed: 480 });
    this.showCard(level, reward);
    this.onLevelUp?.(level, reward);
  },

  showCard(level, reward) {
    const el = this.card, w = word('levelup');
    const div = (cls, text = '') => {
      const d = document.createElement('div');
      d.className = cls;
      d.textContent = text;
      return d;
    };
    const badge = div('lu-level');
    badge.append(div('', level));
    const parts = [badge, div('lu-text', w.text)];
    if (w.roman) parts.push(div('lu-roman', w.roman));
    if (reward) {
      const row = div('lu-reward');
      row.append(div('lu-emoji', reward.emoji), div('lu-name', word(reward.id).text), div('lu-new', word('new').text));
      parts.push(row);
    }
    el.replaceChildren(...parts);
    UI.hush(3400);
    el.classList.remove('show');
    void el.offsetWidth; // restart the pop-in transition
    el.classList.add('show');
    clearTimeout(this.cardTimer);
    this.cardTimer = setTimeout(() => el.classList.remove('show'), 3400);
  },

  // Clicking the badge says the level out loud.
  sayLevel() {
    const w = word('level'), level = this.level;
    Speech.speak(`${w.text} ${level}`);
    UI.showWord({ emoji: '⭐', text: `${w.text} ${level}`, roman: w.roman && `${w.roman} ${level}`, en: `Level ${level}` });
  },
};
