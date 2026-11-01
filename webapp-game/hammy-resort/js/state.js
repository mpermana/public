// Everything that is saved: Hammy, needs, the clock and weather, stars,
// stickers, unlocks, garden, books, songs, friends and settings. Plus the
// rules that change them over (game) time. Nothing here ever punishes:
// low needs only make Hammy ask for things.

const SAVE_KEY = 'hammyResort.save.v1';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function freshState() {
  return {
    version: 1,
    started: false,
    hamster: { name: 'Hammy', fur: 'golden' },
    outfit: { hat: 'none', top: 'none' },
    scene: 'room:bedroom',
    pos: null,
    needs: { hunger: 62, energy: 92, hygiene: 55, bladder: 60, fun: 72, learning: 60, social: 75 },
    time: { day: 0, minute: 7 * 60 },
    weather: { day: 0, kind: 'sunny', rainFrom: 0, rainTo: 0 },
    speed: 1,
    stars: 0,
    today: { day: 0, done: [] },
    counts: {},
    stickers: [],
    seen: {},
    songs: {},
    books: {},
    garden: { plots: Array.from({ length: 6 }, () => ({ crop: null, planted: 0, water: 0, weeds: 0 })), apples: 0, flowers: 0, insects: [] },
    friends: { invited: null, hearts: {}, visited: {} },
    learned: { letters: [], numbers: [] },
    asleep: false,
    lastReward: -999,
    settings: { music: true, sfx: true, narration: true, volume: 0.8, dpad: false, voiceStyle: 'cute', voice: '' },
  };
}

let S = freshState();

// Fill in anything a saved game is missing (e.g. after an update).
function mergeState(base, saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return base;
  for (const [k, v] of Object.entries(saved)) {
    const b = base[k];
    if (b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object' && !Array.isArray(v)) mergeState(b, v);
    else if (v !== undefined && (b === undefined || b === null || typeof b === typeof v || Array.isArray(b) === Array.isArray(v))) base[k] = v;
  }
  return base;
}

const Save = {
  dirty: false,
  timer: 0,

  exists() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      return !!d?.started;
    } catch { return false; }
  },

  load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (d && d.version === 1) {
        S = mergeState(freshState(), d);
        return true;
      }
    } catch { /* unreadable save: keep the fresh state */ }
    return false;
  },

  // Settings live in the same save but survive "new game".
  loadSettingsOnly() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (d?.settings) mergeState(S.settings, d.settings);
    } catch { /* ignore */ }
  },

  write() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    } catch { /* storage full or blocked */ }
    this.dirty = false;
    this.timer = 0;
  },

  // Ask for a save soon (batches quick changes together).
  mark() { this.dirty = true; },

  tick(dt) {
    this.timer += dt;
    if ((this.dirty && this.timer > 1.2) || this.timer > 12) {
      if (S.started) this.write();
      else this.timer = 0;
    }
  },

  // A brand new game; settings are kept.
  reset() {
    const settings = { ...S.settings };
    S = freshState();
    S.settings = settings;
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    this.write();
  },
};

// -------------------------------------------------------------------- clock

const Clock = {
  boost: 0, // fast-forward while sleeping (game minutes per real second)

  // Game minutes per real second.
  rate() { return this.boost || [0, 1, 2][S.speed] || 0; },

  total() { return S.time.day * 1440 + S.time.minute; },

  advance(min) {
    S.time.minute += min;
    while (S.time.minute >= 1440) {
      S.time.minute -= 1440;
      S.time.day++;
      this.newDay();
    }
  },

  newDay() {
    S.today = { day: S.time.day, done: [] };
    Weather.roll();
    Save.mark();
  },

  label(m = S.time.minute) {
    const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
    return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  },

  dayName(day = S.time.day) { return DAYS[day % 7]; },

  part(m = S.time.minute) {
    if (m >= 5 * 60 && m < 12 * 60) return 'morning';
    if (m >= 12 * 60 && m < 17 * 60) return 'afternoon';
    if (m >= 17 * 60 && m < 20.5 * 60) return 'evening';
    return 'night';
  },

  isNight(m = S.time.minute) { return m >= 20 * 60 || m < 6 * 60; },

  // How dark (night), how orange (dusk) and how low the sun is (low).
  light(m = S.time.minute) {
    const h = m / 60;
    let night;
    if (h < 5) night = 1;
    else if (h < 7) night = (7 - h) / 2;
    else if (h < 18.5) night = 0;
    else if (h < 21) night = (h - 18.5) / 2.5;
    else night = 1;
    const dusk = Math.max(0, 1 - Math.abs(h - 18.7) / 1.4) * 0.9 + Math.max(0, 1 - Math.abs(h - 6.3) / 1) * 0.5;
    const low = clamp(Math.abs(h - 12.5) / 6.5, 0, 1);
    return { night, dusk: Math.min(1, dusk), low };
  },
};

// ------------------------------------------------------------------ weather

const WEATHER = {
  sunny: { name: 'Sunny', icon: '☀️' },
  partly: { name: 'A few clouds', icon: '⛅' },
  cloudy: { name: 'Cloudy', icon: '☁️' },
  rain: { name: 'Gentle rain', icon: '🌧️' },
  rainbow: { name: 'Rainbow!', icon: '🌈' },
};

const Weather = {
  // Each day picks its weather; rainy days only rain for a few hours, and
  // there is a rainbow afterwards. Never storms.
  roll() {
    const r = Math.random(), w = S.weather;
    w.day = S.time.day;
    w.kind = r < 0.45 ? 'sunny' : r < 0.7 ? 'partly' : r < 0.82 ? 'cloudy' : 'rain';
    if (S.time.day === 0) w.kind = 'sunny';
    w.rainFrom = w.kind === 'rain' ? randi(9, 14) * 60 : 0;
    w.rainTo = w.rainFrom + randi(2, 3) * 60;
  },
  now() {
    const w = S.weather, m = S.time.minute;
    if (w.kind !== 'rain') return w.kind;
    if (m >= w.rainFrom && m < w.rainTo) return 'rain';
    if (m >= w.rainTo && m < w.rainTo + 75) return 'rainbow';
    return 'partly';
  },
  rainy() { return this.now() === 'rain'; },
  cloudy() { return this.now() === 'cloudy'; },
  rainbowAfterRain() { return this.now() === 'rainbow'; },
  icon() { return Clock.isNight() && this.now() !== 'rain' ? '🌙' : WEATHER[this.now()].icon; },
  name() { return WEATHER[this.now()].name; },
};

// -------------------------------------------------------------------- needs

const NEEDS = [
  { id: 'hunger', name: 'Hunger', kid: 'Tummy', icon: '🍎', awake: 6, asleep: 2 },
  { id: 'energy', name: 'Energy', kid: 'Energy', icon: '⚡', awake: 4, asleep: -14 },
  { id: 'hygiene', name: 'Hygiene', kid: 'Clean', icon: '🫧', awake: 3, asleep: 0.4 },
  { id: 'bladder', name: 'Bladder', kid: 'Potty', icon: '🚽', awake: 7, asleep: 1.5 },
  { id: 'fun', name: 'Fun', kid: 'Fun', icon: '🎈', awake: 5, asleep: 0 },
  { id: 'learning', name: 'Learning', kid: 'Learning', icon: '📚', awake: 2.5, asleep: 0 },
  { id: 'social', name: 'Social', kid: 'Love', icon: '💗', awake: 3.5, asleep: 0 },
];
const NEED = Object.fromEntries(NEEDS.map(n => [n.id, n]));

// Friendly things Hammy says when a need gets low.
const NEED_LINES = {
  hunger: ["I'm getting hungry! Can we have a snack?", "My tummy is rumbling! Let's eat something yummy!"],
  energy: ["I'm sleepy. Can I take a nap?", 'Yawn! I need a little rest.'],
  hygiene: ["I'm a bit messy! Can we take a bath?", "Let's wash up and get squeaky clean!"],
  bladder: ['I need to go potty!', 'Can we go to the bathroom, please?'],
  fun: ["Let's play something fun!", "Let's go to the playground!"],
  learning: ["Let's read a story together!", 'Can we learn something new?'],
  social: ['Can we play with Mom or Dad?', 'I want a big hug!'],
};

const Needs = {
  tick(minutes) {
    const hours = minutes / 60, asleep = S.asleep;
    for (const n of NEEDS) {
      const rate = asleep ? n.asleep : n.awake;
      S.needs[n.id] = clamp(S.needs[n.id] - rate * hours, 0, 100);
    }
  },

  apply(effects = {}) {
    for (const [k, v] of Object.entries(effects)) if (k in S.needs) S.needs[k] = clamp(S.needs[k] + v, 0, 100);
    Save.mark();
  },

  lowest() {
    let best = null;
    for (const n of NEEDS) if (!best || S.needs[n.id] < S.needs[best.id]) best = n;
    return best;
  },

  // Needs that would like attention, most pressing first.
  wants(threshold = 35) {
    return NEEDS.filter(n => S.needs[n.id] < threshold).sort((a, b) => S.needs[a.id] - S.needs[b.id]);
  },

  color(v) { return v >= 60 ? '#7ed99a' : v >= 30 ? '#ffd34d' : '#ff9ec4'; },
};

// --------------------------------------------------------------------- mood

const MOODS = {
  happy: 'Happy', excited: 'Excited', hungry: 'Hungry', sleepy: 'Sleepy', bored: 'Bored',
  dirty: 'Dirty', curious: 'Curious', lonely: 'Lonely', relaxed: 'Relaxed', proud: 'Proud',
};

const Mood = {
  recent: null, // { mood, until } set after rewards / fun activities

  set(mood, minutes = 25) { this.recent = { mood, until: Clock.total() + minutes }; },

  current() {
    if (S.asleep) return 'relaxed';
    if (this.recent && Clock.total() < this.recent.until) return this.recent.mood;
    const n = S.needs;
    if (n.hunger < 30) return 'hungry';
    if (n.energy < 28 || (Clock.isNight() && n.energy < 55)) return 'sleepy';
    if (n.hygiene < 25) return 'dirty';
    if (n.fun < 30) return 'bored';
    if (n.social < 28) return 'lonely';
    if (n.learning < 30) return 'curious';
    const avg = NEEDS.reduce((a, x) => a + n[x.id], 0) / NEEDS.length;
    if (avg > 80) return 'excited';
    if (n.energy > 75 && Clock.part() === 'evening') return 'relaxed';
    return 'happy';
  },

  name() { return MOODS[this.current()]; },
};

// ------------------------------------------------------------------ rewards

const REWARD_INFO = {
  book: { rain: ['☔', 'Rainy Day (book)'], swim: ['🏊', 'Splash Time (book)'], stars: ['⭐', 'Starry Night (book)'] },
  decor: { starlamp: ['🌟', 'Star night-light'], rainbowrug: ['🌈', 'Rainbow rug'], mobile: ['🪐', 'Star mobile'] },
  toy: { robot: ['🤖', 'Toy robot'], rocket: ['🚀', 'Toy rocket'] },
  garden: { mushroom: ['🍄', 'Mushroom house'], windmill: ['🌀', 'Pinwheel'], birdhouse: ['🐦', 'Birdhouse'] },
  piano: { sparkle: ['✨', 'Sparkly piano keys'], bird: ['🐦', 'Singing music bird'] },
};

// Unlocked by total stars collected (stars are never spent).
const UNLOCKS = [
  [3, 'hat', 'bow'], [6, 'top', 'tshirt'], [10, 'book', 'rain'], [14, 'hat', 'cap'], [18, 'decor', 'starlamp'],
  [22, 'top', 'overalls'], [26, 'toy', 'robot'], [30, 'garden', 'mushroom'], [35, 'hat', 'sunhat'], [40, 'book', 'swim'],
  [45, 'hat', 'flower'], [50, 'piano', 'sparkle'], [55, 'top', 'dress'], [60, 'decor', 'rainbowrug'], [66, 'hat', 'party'],
  [72, 'garden', 'windmill'], [80, 'top', 'sport'], [88, 'book', 'stars'], [96, 'toy', 'rocket'], [105, 'hat', 'headphones'],
  [115, 'piano', 'bird'], [125, 'top', 'cape'], [140, 'garden', 'birdhouse'], [155, 'hat', 'beanie'], [170, 'hat', 'tophat'],
  [190, 'decor', 'mobile'], [210, 'hat', 'crown'],
].map(([stars, kind, id]) => ({ stars, kind, id }));

function unlockInfo(u) {
  if (u.kind === 'hat') return [HATS[u.id].icon, HATS[u.id].name];
  if (u.kind === 'top') return [TOPS[u.id].icon, TOPS[u.id].name];
  return REWARD_INFO[u.kind][u.id];
}

const STICKERS = [
  { id: 'meal', icon: '🍳', name: 'Yummy Tummy', how: 'Eat a meal' },
  { id: 'clean', icon: '🫧', name: 'Squeaky Clean', how: 'Take a shower or bath' },
  { id: 'teeth', icon: '🦷', name: 'Sparkly Teeth', how: 'Brush teeth' },
  { id: 'dreams', icon: '🌙', name: 'Sweet Dreams', how: 'Sleep in your bed' },
  { id: 'piano', icon: '🎹', name: 'Little Pianist', how: 'Play a whole song' },
  { id: 'singer', icon: '🎤', name: 'Super Singer', how: 'Sing karaoke' },
  { id: 'reader', icon: '📚', name: 'Bookworm', how: 'Read 3 books' },
  { id: 'abc', icon: '🔤', name: 'ABC Star', how: 'Learn letters' },
  { id: 'numbers', icon: '🔢', name: 'Number Whiz', how: 'Count or add' },
  { id: 'artist', icon: '🎨', name: 'Artist', how: 'Draw a picture' },
  { id: 'builder', icon: '🧱', name: 'Builder', how: 'Build a tower' },
  { id: 'swimmer', icon: '🏊', name: 'Splash Star', how: 'Go swimming' },
  { id: 'sporty', icon: '🏅', name: 'Sporty', how: 'Play 3 different sports' },
  { id: 'gardener', icon: '🌻', name: 'Green Paws', how: 'Harvest from the garden' },
  { id: 'chef', icon: '🍲', name: 'Little Chef', how: 'Cook with Mom or Dad' },
  { id: 'hugs', icon: '💞', name: 'Family Hugs', how: 'Hug Mom and Dad' },
  { id: 'friends', icon: '🤝', name: 'Best Friends', how: 'Visit 3 friends' },
  { id: 'party', icon: '🎂', name: 'Party Time', how: 'Have a birthday party' },
  { id: 'explorer', icon: '🧭', name: 'Explorer', how: 'Visit every place' },
  { id: 'gamer', icon: '🕹️', name: 'Game Champ', how: 'Play 3 arcade games' },
  { id: 'helper', icon: '🧽', name: 'Helper', how: 'Help with a chore' },
  { id: 'goodday', icon: '📅', name: 'Great Day', how: 'Do 8 things from the schedule in one day' },
  { id: 'nature', icon: '🦋', name: 'Bug Spotter', how: 'Find 4 garden bugs' },
  { id: 'scale', icon: '🎼', name: 'Scale Climber', how: 'Play the C major scale' },
];
const STICKER = Object.fromEntries(STICKERS.map(s => [s.id, s]));

const Rewards = {
  // Pending celebration items shown together after an activity.
  pending: [],

  unlocked(kind, id) {
    if (kind === 'hat' && id === 'none') return true;
    if (kind === 'top' && (id === 'none' || id === 'pajamas')) return true;
    if (kind === 'book' && (id === 'butterfly' || id === 'apples' || id === 'night')) return true;
    return UNLOCKS.some(u => u.kind === kind && u.id === id && S.stars >= u.stars);
  },

  nextUnlock() { return UNLOCKS.find(u => S.stars < u.stars) || null; },

  // Add stars; `from` (design coords) makes them fly to the HUD counter.
  addStars(n, from = null) {
    if (n <= 0) return;
    const before = S.stars;
    S.stars += n;
    S.lastReward = Clock.total();
    for (const u of UNLOCKS) {
      if (before < u.stars && S.stars >= u.stars) {
        this.pending.push({ kind: 'unlock', ...u });
        Cache.drop('scene:'); // decorations appear in the rooms
        Cache.drop('thumb:');
      }
    }
    if (from) UI.flyStars(n, from);
    else UI.bumpStars();
    Snd.star();
    Save.mark();
  },

  sticker(id) {
    if (!STICKER[id] || S.stickers.includes(id)) return false;
    S.stickers.push(id);
    this.pending.push({ kind: 'sticker', id });
    Save.mark();
    return true;
  },

  // Check sticker rules after an activity finishes.
  check(act) {
    const c = S.counts, done = id => (c[id] || 0) > 0, cats = list => list.filter(done).length;
    const tags = act?.tags || [];
    if (tags.includes('meal')) this.sticker('meal');
    if (done('shower') || done('bath')) this.sticker('clean');
    if (done('brush_teeth')) this.sticker('teeth');
    if (done('sleep')) this.sticker('dreams');
    if (done('karaoke')) this.sticker('singer');
    if (Object.values(S.books).filter(b => b.done).length >= 3) this.sticker('reader');
    if (done('learn_letters')) this.sticker('abc');
    if (cats(['learn_numbers', 'addition', 'count_veg']) > 0) this.sticker('numbers');
    if (done('drawing')) this.sticker('artist');
    if (done('build_tower')) this.sticker('builder');
    if (done('swim')) this.sticker('swimmer');
    if (cats(['tennis', 'basketball', 'badminton', 'running']) >= 3) this.sticker('sporty');
    if (cats(['cook_mom', 'bbq']) > 0) this.sticker('chef');
    if (done('hug_mom') && done('hug_dad')) this.sticker('hugs');
    if (done('hug_family')) this.sticker('hugs');
    if (Object.keys(S.friends.visited).length >= 3) this.sticker('friends');
    if (done('birthday')) this.sticker('party');
    if (cats(['memory', 'bowling', 'shape_match', 'color_match', 'jigsaw', 'air_hockey']) >= 3) this.sticker('gamer');
    if (cats(['wash_dishes', 'organize_toys', 'set_table']) > 0) this.sticker('helper');
    if (S.garden.insects.length >= 4) this.sticker('nature');
    if (Schedule.doneToday() >= 8) this.sticker('goodday');
    if (LOCATIONS.every(l => S.seen[l.id])) this.sticker('explorer');
  },
};

// The per-frame simulation step.
const State = {
  tick(dt) {
    Save.tick(dt);
    if (!S.started || Game.scene?.sim === false) return;
    const rate = Clock.rate();
    if (!rate) return;
    const minutes = dt * rate;
    Clock.advance(minutes);
    Needs.tick(minutes);
  },
};
