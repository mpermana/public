// Activities: what Hammy can do, where, for how long, which needs it helps,
// and the stars it earns. Also the daily schedule (a suggestion, never a
// rule), Hammy's wishes, and the flow that walks Hammy to an activity.

// Map destinations, in the order they appear in menus.
const LOCATIONS = [
  { id: 'house', name: 'Main House', icon: '🏠', scene: 'house' },
  { id: 'pool', name: 'Swimming Pool', icon: '🏊', scene: 'pool' },
  { id: 'sports', name: 'Sports Complex', icon: '🏀', scene: 'sports' },
  { id: 'playground', name: 'Playground', icon: '🛝', scene: 'playground' },
  { id: 'garden', name: 'Garden', icon: '🌻', scene: 'garden' },
  { id: 'bbq', name: 'Barbecue Area', icon: '🍢', scene: 'bbq' },
  { id: 'games', name: 'Games Zone', icon: '🕹️', scene: 'games' },
  { id: 'village', name: 'Friends Village', icon: '🏘️', scene: 'village' },
];
const LOCATION = Object.fromEntries(LOCATIONS.map(l => [l.id, l]));

const ROOMS = {
  kitchen: { name: 'Kitchen', icon: '🍳' },
  living: { name: 'Living Room', icon: '🛋️' },
  family: { name: 'Family Room', icon: '💞' },
  study: { name: 'Study Room', icon: '✏️' },
  reading: { name: 'Reading Room', icon: '📖' },
  piano: { name: 'Piano Room', icon: '🎹' },
  playroom: { name: 'Playroom', icon: '🧸' },
  bedroom: { name: 'Bedroom', icon: '🛏️' },
  bathroom: { name: 'Bathroom', icon: '🛁' },
  karaoke: { name: 'Karaoke Room', icon: '🎤' },
};

// Which map destination a scene belongs to.
function locationOf(sceneId) {
  if (!sceneId) return null;
  if (sceneId === 'house' || sceneId.startsWith('room:')) return 'house';
  return LOCATION[sceneId] ? sceneId : null;
}
function placeName(sceneId) {
  if (sceneId?.startsWith('room:')) return ROOMS[sceneId.slice(5)]?.name || 'House';
  return LOCATION[sceneId]?.name || 'Resort';
}
function placeIcon(sceneId) {
  if (sceneId?.startsWith('room:')) return ROOMS[sceneId.slice(5)]?.icon || '🚪';
  return LOCATION[sceneId]?.icon || '🚪';
}

// ------------------------------------------------------------ activities

// e: needs effects; m: expected minutes; st: stars; game: mini-game id, or
// inline: an in-place animation handled by the location scene.
const ACTS = {};
function act(id, name, icon, where, spot, m, e, st, more = {}) {
  ACTS[id] = { id, name, icon, where, spot, minutes: m, effects: e, stars: st, tags: [], ...more };
}

// Kitchen
act('breakfast', 'Eat breakfast', '🥞', 'room:kitchen', 'table', 30, { hunger: 45, energy: 5 }, 2, { game: 'meal', params: { meal: 'breakfast' }, tags: ['meal'], hours: [6, 10], say: "I'm hungry! Can we eat breakfast?" });
act('lunch', 'Eat lunch', '🥪', 'room:kitchen', 'table', 30, { hunger: 50 }, 2, { game: 'meal', params: { meal: 'lunch' }, tags: ['meal'], hours: [11, 14], say: "It's lunch time! Yummy!" });
act('dinner', 'Family dinner', '🍝', 'room:kitchen', 'table', 40, { hunger: 50, social: 12 }, 2, { game: 'meal', params: { meal: 'dinner' }, with: 'family', tags: ['meal', 'family'], hours: [17, 20.5], say: "Let's have dinner with Mom and Dad!" });
act('snack', 'Have a snack', '🍪', 'room:kitchen', 'fridge', 10, { hunger: 22, fun: 4 }, 1, { game: 'meal', params: { meal: 'snack' }, tags: ['meal'], say: 'Can we have a little snack?' });
act('cook_mom', 'Cook with Mom', '🥣', 'room:kitchen', 'stove', 30, { social: 20, learning: 10, fun: 10, hunger: 10 }, 3, { game: 'cook', with: 'mom', tags: ['family'], say: "Let's cook something yummy with Mom!" });
act('wash_dishes', 'Wash the dishes', '🧽', 'room:kitchen', 'sink', 15, { fun: 6, learning: 4, social: 4 }, 2, { game: 'scrub', params: { kind: 'dishes' }, tags: ['chore'], say: 'I can help wash the dishes!' });

// Bathroom
act('shower', 'Take a shower', '🚿', 'room:bathroom', 'shower', 20, { hygiene: 60 }, 2, { game: 'scrub', params: { kind: 'shower' }, say: "Let's get squeaky clean!" });
act('bath', 'Bubble bath', '🛁', 'room:bathroom', 'bathtub', 30, { hygiene: 60, fun: 10 }, 2, { game: 'scrub', params: { kind: 'bath' }, say: 'Can I have a bubble bath?' });
act('brush_teeth', 'Brush teeth', '🪥', 'room:bathroom', 'sink', 5, { hygiene: 18 }, 1, { game: 'brush', say: "Let's brush my teeth!" });
act('wash_hands', 'Wash hands', '🧼', 'room:bathroom', 'sink', 5, { hygiene: 10 }, 1, { game: 'scrub', params: { kind: 'hands' }, say: 'Wash wash wash my hands!' });
act('toilet', 'Use the potty', '🚽', 'room:bathroom', 'toilet', 5, { bladder: 100 }, 1, { inline: { kind: 'toilet', secs: 4 }, say: 'I need to go potty!' });

// Bedroom
act('sleep', 'Go to sleep', '🌙', 'room:bedroom', 'bed', 0, { energy: 0 }, 2, { inline: { kind: 'sleep' }, hours: [19.5, 24], say: "I'm sleepy. Can we go to bed?" });
act('nap', 'Take a nap', '😴', 'room:bedroom', 'bed', 60, { energy: 32 }, 1, { inline: { kind: 'nap' }, hours: [12.5, 15], say: "I'm sleepy. Can I take a nap?" });
act('rest', 'Rest a little', '🛏️', 'room:bedroom', 'bed', 20, { energy: 12, fun: 4 }, 1, { inline: { kind: 'rest', secs: 5 }, say: 'I want to rest a little.' });
act('dress', 'Get dressed', '👕', 'room:bedroom', 'wardrobe', 5, { fun: 5 }, 1, { panel: 'wardrobe', say: 'Can I wear something new?' });
act('bedtime_story', 'Bedtime story', '🌜', 'room:bedroom', 'bed', 20, { learning: 12, social: 15, energy: 4 }, 2, { game: 'reading', params: { book: 'night' }, with: 'mom', hours: [19, 21], say: 'Can Mom read me a bedtime story?' });

// Living room
act('watch_tv', 'Watch TV', '📺', 'room:living', 'tv', 30, { fun: 14, energy: 4 }, 1, { inline: { kind: 'tv', secs: 9 }, say: 'Can we watch a cartoon?' });
act('relax', 'Relax on the sofa', '🛋️', 'room:living', 'sofa', 15, { energy: 10, fun: 4 }, 1, { inline: { kind: 'relax', secs: 5 }, say: "Let's relax on the comfy sofa." });
act('read_together', 'Read with Dad', '📗', 'room:living', 'sofa', 20, { learning: 15, social: 16, fun: 5 }, 2, { game: 'reading', with: 'dad', say: 'Dad, can we read together?' });
act('play_mom', 'Play with Mom', '🫧', 'room:living', 'rug', 20, { social: 25, fun: 18, energy: -5 }, 2, { game: 'bubbles', with: 'mom', tags: ['family'], hours: [15, 15.5], say: 'Can we play with Mom?' });
act('play_dad', 'Play with Dad', '⚽', 'room:living', 'rug', 20, { social: 25, fun: 18, energy: -8 }, 2, { game: 'catch', with: 'dad', tags: ['family'], hours: [15.5, 16], say: 'Can we play with Dad?' });
act('photos', 'Look at photos', '🖼️', 'room:living', 'photos', 10, { social: 8, fun: 4 }, 1, { inline: { kind: 'photos', secs: 5 }, say: "Let's look at our family photos!" });

// Reading room, study, piano, karaoke
act('read_book', 'Read a picture book', '📚', 'room:reading', 'chair', 20, { learning: 20, fun: 8 }, 2, { game: 'reading', hours: [8.5, 9], say: 'I want to read a book!' });
act('learn_letters', 'Learn letters', '🔤', 'room:study', 'desk', 15, { learning: 20, fun: 4 }, 2, { game: 'letters', tags: ['study'], say: "Let's learn the ABCs!" });
act('learn_numbers', 'Count numbers', '🔢', 'room:study', 'desk', 15, { learning: 20, fun: 4 }, 2, { game: 'numbers', tags: ['study'], say: "Let's count to twenty!" });
act('addition', 'Adding fun', '➕', 'room:study', 'desk', 15, { learning: 22 }, 2, { game: 'addition', tags: ['study'], say: 'Can we do some adding?' });
act('learn_colors', 'Learn colors', '🖌️', 'room:study', 'blocks', 15, { learning: 18, fun: 6 }, 2, { game: 'colors', tags: ['study'], say: "Let's learn colors!" });
act('learn_shapes', 'Learn shapes', '🔷', 'room:study', 'blocks', 15, { learning: 18, fun: 6 }, 2, { game: 'shapes', tags: ['study'], say: "Let's find the shapes!" });
act('matching', 'Big and small letters', '🔠', 'room:study', 'desk', 15, { learning: 18, fun: 4 }, 2, { game: 'matching', tags: ['study'], say: "Let's match the letters!" });
act('drawing', 'Draw a picture', '🖍️', 'room:study', 'board', 15, { fun: 15, learning: 5 }, 2, { game: 'drawing', say: 'Can I draw a picture?' });
act('piano', 'Practice piano', '🎹', 'room:piano', 'piano', 20, { learning: 18, fun: 14 }, 2, { game: 'piano', hours: [9, 9.5], say: "Let's practice piano!" });
act('piano_mom', 'Piano with Mom', '🎶', 'room:piano', 'piano', 20, { learning: 15, fun: 12, social: 15 }, 3, { game: 'piano', with: 'mom', tags: ['family'], say: 'Mom, can you play piano with me?' });
act('karaoke', 'Sing karaoke', '🎤', 'room:karaoke', 'mic', 20, { fun: 24, social: 10, energy: -5 }, 2, { game: 'karaoke', say: "Let's sing a song together!" });

// Playroom, family room
act('build_tower', 'Build a tower', '🧱', 'room:playroom', 'blocks', 15, { fun: 14, learning: 6 }, 2, { game: 'tower', say: "Let's build a tall tower!" });
act('puzzle', 'Do a puzzle', '🧩', 'room:playroom', 'puzzle', 15, { learning: 12, fun: 10 }, 2, { game: 'jigsaw', say: 'Can we do a puzzle?' });
act('organize_toys', 'Tidy the toys', '🧺', 'room:playroom', 'toybox', 10, { learning: 8, fun: 6 }, 2, { game: 'sort', params: { kind: 'toys' }, tags: ['chore'], say: 'Let me tidy up my toys!' });
act('play_train', 'Play with the train', '🚂', 'room:playroom', 'train', 10, { fun: 12 }, 1, { inline: { kind: 'train', secs: 6 }, say: 'Choo choo! Can I play with my train?' });
act('tea_party', 'Pretend tea party', '🫖', 'room:playroom', 'teddy', 15, { fun: 12, social: 6 }, 2, { game: 'teaparty', say: "Let's have a pretend tea party!" });
act('board_game', 'Family board game', '🎲', 'room:family', 'table', 30, { social: 25, fun: 15, learning: 5 }, 3, { game: 'boardgame', with: 'family', tags: ['family'], say: "Let's play a board game together!" });
act('family_story', 'Make up a story', '💬', 'room:family', 'sofa', 20, { social: 20, learning: 10 }, 2, { game: 'story', with: 'family', tags: ['family'], say: "Let's make up a story!" });
act('hug_family', 'Family hug', '🤗', 'room:family', 'sofa', 2, { social: 22 }, 1, { inline: { kind: 'hug', secs: 3.5 }, with: 'family', tags: ['family'], say: 'I want a big family hug!' });

// Swimming pool (Mom or Dad always watches from the side)
act('swim', 'Go swimming', '🏊', 'pool', 'pool', 30, { fun: 25, energy: -15, hygiene: 4 }, 3, { game: 'swim', with: 'dad', tags: ['sport'], hours: [11.5, 12], say: 'I feel like swimming!' });
act('float_toys', 'Collect pool toys', '🦆', 'pool', 'kiddie', 20, { fun: 18, learning: 8, energy: -6 }, 2, { game: 'swim', params: { mode: 'toys' }, with: 'mom', say: "Let's collect the floating toys!" });
act('splash', 'Splash play', '💦', 'pool', 'kiddie', 15, { fun: 15, energy: -5 }, 1, { inline: { kind: 'splash', secs: 6 }, with: 'mom', say: 'Splash splash!' });
act('pool_slide', 'Water slide', '🌊', 'pool', 'slide', 10, { fun: 18, energy: -5 }, 2, { inline: { kind: 'waterslide', secs: 4 }, with: 'dad', say: 'Can I go down the water slide?' });
act('relax_pool', 'Relax poolside', '😎', 'pool', 'lounger', 15, { energy: 10, fun: 5 }, 1, { inline: { kind: 'relax', secs: 5 }, say: "Let's relax in the sunshine." });

// Sports complex
act('tennis', 'Play tennis', '🎾', 'sports', 'tennis', 20, { fun: 20, energy: -14, hygiene: -5 }, 2, { game: 'tennis', tags: ['sport'], say: "Let's play tennis!" });
act('basketball', 'Shoot hoops', '🏀', 'sports', 'basketball', 20, { fun: 20, energy: -14, hygiene: -5 }, 2, { game: 'basketball', tags: ['sport'], say: "Let's play basketball!" });
act('basketball_dad', 'Basketball with Dad', '⛹️', 'sports', 'basketball', 20, { fun: 18, energy: -12, social: 15 }, 3, { game: 'basketball', with: 'dad', tags: ['sport', 'family'], say: 'Dad, can we shoot hoops?' });
act('badminton', 'Play badminton', '🏸', 'sports', 'badminton', 20, { fun: 20, energy: -14, hygiene: -5 }, 2, { game: 'badminton', tags: ['sport'], say: "Let's hit the shuttlecock!" });
act('running', 'Run the track', '🏃', 'sports', 'track', 15, { fun: 18, energy: -18, hygiene: -6 }, 2, { game: 'running', tags: ['sport'], say: "Let's run and collect stars!" });

// Playground
act('slide', 'Slide down', '🛝', 'playground', 'slide', 10, { fun: 14, energy: -4 }, 1, { inline: { kind: 'slide', secs: 5 }, say: 'Wheee! Can I go down the slide?' });
act('swing', 'Swing high', '🎠', 'playground', 'swings', 10, { fun: 15, energy: -3 }, 2, { game: 'swing', say: 'Push me on the swing!' });
act('trampoline', 'Bounce!', '🤸', 'playground', 'trampoline', 10, { fun: 20, energy: -10 }, 2, { game: 'trampoline', say: 'Boing boing! Trampoline time!' });
act('sandcastle', 'Build a sandcastle', '🏰', 'playground', 'sandbox', 15, { fun: 14, learning: 6, hygiene: -6 }, 2, { game: 'sandcastle', say: "Let's build a sandcastle!" });
act('ball_pit', 'Ball pit hunt', '🔴', 'playground', 'ballpit', 10, { fun: 15, learning: 4 }, 2, { game: 'ballpit', say: 'Can I jump in the ball pit?' });
act('seesaw', 'Seesaw', '⚖️', 'playground', 'seesaw', 10, { fun: 10, social: 10 }, 1, { inline: { kind: 'seesaw', secs: 5 }, with: 'dad', say: 'Up and down on the seesaw!' });
act('climb', 'Climb the dome', '🧗', 'playground', 'dome', 10, { fun: 12, energy: -6 }, 1, { inline: { kind: 'climb', secs: 4 }, say: 'I can climb all the way up!' });
act('toy_cars', 'Drive toy cars', '🚗', 'playground', 'cars', 15, { fun: 15 }, 2, { game: 'cars', say: 'Vroom vroom! Can I drive a car?' });

// Garden
act('gardening', 'Garden time', '🌱', 'garden', 'plots', 20, { learning: 14, fun: 10, hygiene: -5 }, 2, { game: 'garden', say: "Let's look after the garden!" });
act('pick_flowers', 'Flower fun', '🌷', 'garden', 'flowers', 15, { learning: 15, fun: 6 }, 2, { game: 'flowers', say: "Let's find pretty flowers!" });
act('apples', 'Pick apples', '🍎', 'garden', 'trees', 15, { learning: 10, fun: 10, hunger: 5 }, 2, { game: 'apples', say: "Let's pick apples and count them!" });
act('butterflies', 'Bug hunt', '🦋', 'garden', 'butterflies', 15, { learning: 15, fun: 10 }, 2, { game: 'bugs', say: "Let's look for butterflies!" });
act('count_veg', 'Count the veggies', '🥕', 'garden', 'plots', 10, { learning: 16 }, 2, { game: 'countveg', tags: ['study'], say: 'How many carrots can we count?' });
act('fish', 'Watch the fish', '🐟', 'garden', 'pond', 10, { energy: 6, fun: 6 }, 1, { inline: { kind: 'relax', secs: 5 }, say: "Let's watch the fish in the pond." });

// Barbecue and family area (the grown-ups do the grilling)
act('bbq', 'Barbecue with Dad', '🍢', 'bbq', 'grill', 40, { hunger: 40, social: 25, fun: 10 }, 3, { game: 'bbq', with: 'dad', tags: ['family', 'meal'], hours: [17.5, 18], say: "Let's make a barbecue with Dad!" });
act('set_table', 'Set the table', '🍽️', 'bbq', 'table', 10, { learning: 8, social: 8 }, 2, { game: 'settable', tags: ['chore'], say: 'I can set the table!' });
act('picnic', 'Family picnic', '🧺', 'bbq', 'blanket', 30, { hunger: 30, social: 22, fun: 10 }, 3, { game: 'picnic', with: 'family', tags: ['family', 'meal'], say: "Let's have a picnic together!" });

// Games zone
act('memory', 'Memory cards', '🃏', 'games', 'memory', 15, { learning: 15, fun: 15 }, 2, { game: 'memory', say: "Let's play memory!" });
act('bowling', 'Bowling', '🎳', 'games', 'bowling', 15, { fun: 20, energy: -4 }, 2, { game: 'bowling', say: "Let's go bowling!" });
act('shape_match', 'Shape puzzle', '🔺', 'games', 'shapes', 10, { learning: 15, fun: 8 }, 2, { game: 'shapematch', say: 'Can we match the shapes?' });
act('color_match', 'Color sorting', '🌈', 'games', 'colors', 10, { learning: 15, fun: 8 }, 2, { game: 'colormatch', say: 'Can we sort the colors?' });
act('jigsaw', 'Jigsaw puzzle', '🧩', 'games', 'jigsaw', 15, { learning: 12, fun: 12 }, 2, { game: 'jigsaw', say: "Let's do a jigsaw puzzle!" });
act('air_hockey', 'Air hockey', '🏒', 'games', 'hockey', 10, { fun: 20, energy: -4 }, 2, { game: 'airhockey', say: 'Can we play air hockey?' });

// Friends village
act('play_friend', 'Play together', '🤝', 'village', 'square', 20, { social: 22, fun: 15 }, 2, { game: 'friendplay', with: 'friend', say: 'Can I play with my friends?' });
act('share_food', 'Share a snack', '🍪', 'village', 'square', 5, { social: 15, hunger: 6 }, 1, { inline: { kind: 'share', secs: 3.5 }, with: 'friend', say: "Let's share a snack with a friend!" });
act('dance_party', 'Dance party', '🪩', 'village', 'stage', 15, { social: 25, fun: 20, energy: -8 }, 2, { game: 'dance', with: 'friend', say: "Let's have a dance party!" });
act('birthday', 'Birthday party', '🎂', 'village', 'party', 30, { social: 30, fun: 20, hunger: 10 }, 3, { game: 'birthday', with: 'friend', say: "It's a birthday! Let's have a party!" });
act('invite', 'Invite to the resort', '💌', 'village', 'square', 2, { social: 10 }, 1, { inline: { kind: 'invite', secs: 2.5 }, with: 'friend', say: 'Can a friend come and play at our house?' });

// Hugs with Mom or Dad, wherever they are.
act('hug_mom', 'Hug Mom', '🤗', null, null, 2, { social: 15 }, 1, { inline: { kind: 'hug', secs: 3 }, with: 'mom' });
act('hug_dad', 'Hug Dad', '🤗', null, null, 2, { social: 15 }, 1, { inline: { kind: 'hug', secs: 3 }, with: 'dad' });

// Hammy's favorite things (used for wishes) and what helps each need.
const FAVORITES = ['piano', 'swim', 'read_book', 'gardening', 'karaoke', 'basketball', 'trampoline', 'build_tower', 'board_game', 'memory'];
const FOR_NEED = {
  fun: ['slide', 'trampoline', 'karaoke', 'swim', 'basketball', 'bowling', 'toy_cars', 'swing', 'tower', 'play_train'],
  learning: ['read_book', 'learn_letters', 'piano', 'learn_numbers', 'butterflies', 'pick_flowers', 'learn_shapes', 'addition'],
  social: ['play_mom', 'play_dad', 'hug_family', 'board_game', 'play_friend', 'piano_mom'],
};

// --------------------------------------------------------------- schedule

const SCHEDULE = [
  ['7:00', 'Wake up', '🌅', ['wake']],
  ['7:15', 'Brush teeth & shower', '🪥', ['brush_teeth', 'shower', 'bath']],
  ['7:45', 'Breakfast', '🥞', ['breakfast']],
  ['8:30', 'Read books', '📚', ['read_book', 'read_together', 'bedtime_story']],
  ['9:00', 'Practice piano', '🎹', ['piano', 'piano_mom']],
  ['9:30', 'Study time', '✏️', ['learn_letters', 'learn_numbers', 'addition', 'learn_colors', 'learn_shapes', 'matching', 'drawing']],
  ['10:00', 'Outdoor play', '🛝', ['slide', 'swing', 'trampoline', 'sandcastle', 'ball_pit', 'seesaw', 'climb', 'toy_cars']],
  ['11:30', 'Swimming or sports', '🏊', ['swim', 'float_toys', 'tennis', 'basketball', 'basketball_dad', 'badminton', 'running', 'splash']],
  ['12:00', 'Lunch', '🥪', ['lunch']],
  ['13:00', 'Nap or quiet time', '😴', ['nap', 'rest', 'relax']],
  ['14:00', 'Learning games', '🧠', ['learn_letters', 'learn_numbers', 'addition', 'learn_colors', 'learn_shapes', 'matching', 'butterflies', 'pick_flowers', 'count_veg', 'memory']],
  ['15:00', 'Play with Mom', '👩', ['play_mom', 'cook_mom', 'piano_mom', 'hug_mom']],
  ['15:30', 'Play with Dad', '👨', ['play_dad', 'basketball_dad', 'read_together', 'hug_dad']],
  ['16:00', 'Garden or playground', '🌻', ['gardening', 'pick_flowers', 'apples', 'butterflies', 'slide', 'swing', 'trampoline', 'sandcastle']],
  ['17:30', 'Help with dinner', '🍢', ['bbq', 'set_table', 'cook_mom', 'picnic']],
  ['18:00', 'Dinner', '🍝', ['dinner', 'bbq', 'picnic']],
  ['18:45', 'TV or relax', '📺', ['watch_tv', 'relax', 'photos', 'relax_pool']],
  ['19:15', 'Bedtime story', '🌜', ['bedtime_story', 'read_together', 'read_book']],
  ['19:45', 'Brush teeth & potty', '🦷', ['brush_teeth', 'toilet']],
  ['20:00', 'Sleep', '🌙', ['sleep']],
].map(([at, name, icon, acts]) => {
  const [h, m] = at.split(':').map(Number);
  return { at: h * 60 + m, name, icon, acts };
});

const Schedule = {
  doneEntry(e) { return e.acts.some(a => S.today.done.includes(a)); },
  doneToday() { return SCHEDULE.filter(e => this.doneEntry(e)).length; },
  current(m = S.time.minute) {
    let cur = null;
    for (const e of SCHEDULE) if (e.at <= m) cur = e;
    return cur;
  },
  isFavorite(e) { return e.acts.some(a => FAVORITES.includes(a)); },
};

// ------------------------------------------------------------------ wishes

const Wishes = {
  // Up to 4 things Hammy would like to do now, most wanted first.
  list() {
    const out = [], used = new Set(), h = S.time.minute / 60;
    const add = (id, line, why, params) => {
      if (!ACTS[id] || used.has(id)) return;
      used.add(id);
      out.push({ act: ACTS[id], line: line || ACTS[id].say || `Let's ${ACTS[id].name.toLowerCase()}!`, why, params });
    };
    const notToday = list => list.filter(id => !S.today.done.includes(id));
    const day = S.time.day;
    for (const n of Needs.wants(38)) {
      const line = NEED_LINES[n.id][day % 2];
      switch (n.id) {
        case 'hunger': add(h >= 6 && h < 10 ? 'breakfast' : h >= 11 && h < 14 ? 'lunch' : h >= 17 && h < 20.5 ? 'dinner' : 'snack', line, n.id); break;
        case 'energy': add(Clock.isNight() || h >= 19.5 ? 'sleep' : h >= 12 && h < 16 ? 'nap' : 'rest', line, n.id); break;
        case 'hygiene': add(h >= 17 ? 'bath' : 'shower', line, n.id); break;
        case 'bladder': add('toilet', line, n.id); break;
        default: {
          const options = notToday(FOR_NEED[n.id]);
          add(options[(day + n.id.length) % Math.max(1, options.length)] || FOR_NEED[n.id][0], line, n.id);
        }
      }
    }
    const sched = Schedule.current();
    if (sched && !Schedule.doneEntry(sched) && sched.acts[0] !== 'wake') add(sched.acts[0], null, 'schedule');
    const favs = notToday(FAVORITES);
    if (favs.length) add(favs[day % favs.length], null, 'favorite');
    const unseen = LOCATIONS.find(l => !S.seen[l.id]);
    if (unseen && out.length < 4) out.push({ act: { id: 'explore', name: `Explore the ${unseen.name}`, icon: unseen.icon, where: unseen.scene, minutes: 5, effects: { fun: 5, learning: 3 }, stars: 1 }, line: `Let's explore the ${unseen.name}!`, why: 'explore', params: { loc: unseen.id } });
    return out.slice(0, 4);
  },

  top() { return this.list()[0] || null; },
  urgent() { return Needs.wants(30).length > 0; },
};

// --------------------------------------------------------- the activity flow

// Moving Hammy between scenes: through the house for rooms, along the map
// paths for everything else. `pending` survives the scene changes.
const Travel = {
  pending: null,

  to(sceneId, then) {
    this.pending = { sceneId, then };
    const here = Game.id, from = locationOf(here), to = locationOf(sceneId);
    if (here === sceneId) return this.arrive();
    if (from && from === to) {
      if (to === 'house') Game.go('house', { walkTo: sceneId.slice(5) });
      else Game.go(sceneId);
    } else Game.go('map', { travelTo: to });
  },

  // Called by a scene once Hammy is standing in it.
  arrive() {
    const p = this.pending;
    if (!p || p.sceneId !== Game.id) return false;
    this.pending = null;
    p.then?.();
    return true;
  },

  // Where the map should send Hammy next after walking to `loc`.
  continueFrom(loc) {
    const p = this.pending;
    if (!p) return Game.go(LOCATION[loc].scene, {}, { zoom: null });
    if (p.sceneId.startsWith('room:')) return Game.go('house', { walkTo: p.sceneId.slice(5) });
    Game.go(p.sceneId);
  },

  cancel() { this.pending = null; },
};

const Activity = {
  current: null, // { act, params, phase, startedAt }

  // Start an activity anywhere: Hammy walks there and it begins.
  start(id, params = {}) {
    const act = typeof id === 'object' ? id : ACTS[id];
    if (!act) return;
    UI.closeAll();
    this.current = { act, params: { ...act.params, ...params }, phase: 'travel', startedAt: Clock.total() };
    UI.showCancel(true);
    Speech.say(pick(["Okay! Let's go!", 'Yay! Here we go!', "Let's do it!"]));
    if (act.id === 'explore') {
      Travel.to(act.where, () => this.complete({ silent: true }));
      return;
    }
    const where = act.where || Game.id;
    Travel.to(where, () => this.arrived());
  },

  arrived() {
    const cur = this.current;
    if (!cur) return;
    cur.phase = 'walk';
    const scene = Game.scene;
    if (cur.act.spot && scene.walkToSpot) scene.walkToSpot(cur.act.spot, () => this.begin());
    else this.begin();
  },

  begin() {
    const cur = this.current;
    if (!cur) return;
    const a = cur.act;
    if (a.game) {
      cur.phase = 'game';
      cur.returnTo = Game.id;
      const hp = Game.scene.hammyPos?.();
      cur.returnPos = Game.scene.ham ? { x: Game.scene.ham.x, y: Game.scene.ham.y } : hp;
      if (a.with === 'friend') {
        cur.params.friend = cur.params.friend || Friends.invited()?.id || Friends.birthday()?.id || FRIENDS[S.time.day % FRIENDS.length].id;
        S.friends.visited[cur.params.friend] = true;
        S.friends.hearts[cur.params.friend] = (S.friends.hearts[cur.params.friend] || 0) + 1;
      }
      const game = a.game === 'friendplay' ? Friends.game(cur.params.friend) : a.game;
      Game.go(`game:${game}`, { act: a, params: cur.params });
    } else if (a.inline) {
      cur.phase = 'doing';
      Game.scene.beginInline?.(a, cur.params);
    } else if (a.panel === 'wardrobe') {
      cur.phase = 'doing';
      UI.openWardrobe(() => this.complete());
    } else this.complete();
  },

  // Finish: needs change, stars, stickers, time moves on, then a celebration.
  complete(result = {}) {
    const cur = this.current;
    if (!cur) return;
    const a = cur.act;
    this.current = null;
    UI.showCancel(false);
    Clock.boost = 0;
    if (a.id !== 'explore') {
      Needs.apply(a.effects);
      S.counts[a.id] = (S.counts[a.id] || 0) + 1;
      if (!S.today.done.includes(a.id)) S.today.done.push(a.id);
      const spent = Clock.total() - cur.startedAt;
      if (a.minutes > spent) Clock.advance(a.minutes - spent);
    }
    const stars = Math.max(1, (a.stars || 1) + (result.bonus || 0));
    Rewards.addStars(stars, UI.hammyScreenPos());
    Rewards.check(a);
    Mood.set(result.mood || (a.effects.fun > 12 ? 'excited' : 'proud'));
    Save.mark();
    if (result.silent) {
      UI.flushRewards();
      return;
    }
    UI.showReward({ act: a, stars, text: result.text });
    // Mini-games return to where they started.
    if (cur.phase === 'game' && Game.id?.startsWith('game:')) Game.go(cur.returnTo || 'map', { returnPos: cur.returnPos });
  },

  // Stop whatever is happening; nothing is lost.
  cancel() {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    Travel.cancel();
    Clock.boost = 0;
    UI.showCancel(false);
    Game.scene?.cancelInline?.();
    if (cur.phase === 'game' && Game.id?.startsWith('game:')) Game.go(cur.returnTo || 'map', { returnPos: cur.returnPos });
  },

  // How an activity reads on a card: "20 min", needs and stars.
  describe(a) {
    const tags = [];
    for (const [k, v] of Object.entries(a.effects || {})) if (v) tags.push({ text: `${NEED[k].icon} ${v > 0 ? '+' : '−'}`, up: v > 0, need: k });
    return { place: a.where ? placeName(a.where) : 'Anywhere', time: a.minutes ? `${a.minutes} min` : a.id === 'sleep' ? 'All night' : 'A moment', tags, stars: a.stars };
  },
};
