# 🐹 Hammy's Happy Resort

A gentle virtual-pet / life-simulation game for children aged 5 and up. Take
care of Hammy the hamster in a huge private resort: a dollhouse-style home
with ten rooms, a pool, sports courts, a playground, a garden, a barbecue
area, a games zone and a village of hamster friends. Hammy gets hungry,
sleepy and bored, and asks for things in a friendly voice, but nothing bad
ever happens if you do something else instead.

No build step, no downloads, no external services: plain HTML, CSS and
JavaScript. Every character and place is drawn in code (Canvas 2D); all
sounds and music are synthesized with the Web Audio API.

## Run it

Double-click `index.html`, or serve the folder:

```sh
python -m http.server 8000   # then open http://localhost:8000
```

Landscape works best (a tablet or laptop). The game saves itself in the
browser after every change and when the tab is closed.

## How to play

- **Main menu:** Play / Continue, *My hamster* (name and fur color), Settings.
- **World map:** tap a place and Hammy walks there along the paths. Drag to
  look around; scroll, pinch or use ➕ ➖ 🔭 to zoom. A 💭 bubble on a sign
  means Hammy would like to go there; *New!* marks places not visited yet.
- **Main House:** an open dollhouse. Tap a room and Hammy walks over (and
  up the stairs). Inside a room, tap the floor to walk, tap an object to see
  what you can do with it, or walk through the side doorways to the next room.
- **Activity bar** (bottom left): everything you can do in the current place.
  Items with 💭 are things Hammy wishes for right now.
- **Top bar:** Hammy's face and mood, five need meters, the clock (tap it for
  the schedule), weather, time speed (▶️ normal, ⏩ double, ⏸️ paused) and stars.
- **Bottom buttons:** 🗺️ map · 🏠 home · 💭 what Hammy wants · 📅 schedule ·
  🐹 how Hammy is · ⚙️ settings.
- **Keyboard:** arrows or WASD walk, Enter / Space uses the nearest object,
  Esc pauses (or stops what Hammy is doing). Mini-games also use the keyboard.
- **Touch:** tap to walk and choose; optional on-screen arrows in Settings.
- **✋ Stop** cancels any activity at any time, without losing anything.

## What's inside

| Place | Things to do |
| --- | --- |
| 🍳 Kitchen | breakfast, lunch, family dinner, snacks (feed Hammy food by name), cook with Mom (picture recipe + stirring), wash the dishes |
| 🛁 Bathroom | shower and bubble bath (scrub, then rinse), brush teeth, wash hands, potty |
| 🛏️ Bedroom | sleep (time fast-forwards to morning), nap, rest, bedtime story with Mom, wardrobe |
| 🛋️ Living Room | watch TV (three cartoon channels), relax, read with Dad, play with Mom (pop and count bubbles), play with Dad (catch), family photos |
| 📖 Reading Room | six illustrated picture books with narration, tap-a-word, and a question at the end |
| ✏️ Study Room | letters and phonics pictures, counting to 20, adding, colors, shapes, big & small letters, drawing on the chalkboard |
| 🎹 Piano Room | two-octave piano (mouse, touch or keys Z–M and Q–I): free play, C major scale, *Twinkle Twinkle*, *Mary Had a Little Lamb*, *Ode to Joy*, a beat game and high / low listening |
| 🎤 Karaoke Room | six public-domain songs with highlighted lyrics and tap-along cues (no microphone needed) |
| 🧸 Playroom (attic) | block tower, jigsaw, tidy the toys, toy train, teddy tea party |
| 💞 Family Room | family board game, make up a story together, family hug |
| 🏊 Swimming Pool | swimming with Dad in the water, collect toys by color with Mom, kiddie-pool splashing, water slide, sun lounger |
| 🏀 Sports Complex | tennis (timing + aiming, forehand / backhand), basketball (pull back and shoot; with or without Dad), badminton rallies, running track (collect stars over two laps) |
| 🛝 Playground | slide, swing (push at the right moment), trampoline, sandcastle builder, ball-pit treasure hunt, seesaw with Dad, climbing dome, toy cars |
| 🌻 Garden | plant, water, weed and harvest five crops (growth stages are saved and keep growing over game time), pick and count apples, bug hunt with fun facts, flower quiz, count the veggies, fish pond |
| 🍢 Barbecue Area | make veggie skewers while Dad does the grilling, set the table, family picnic |
| 🕹️ Games Zone | memory cards, bowling (with bumpers), shape sorting, color sorting, jigsaw, air hockey |
| 🏘️ Friends Village | six friends (Pip, Nutmeg, Coco, Mochi, Biscuit, Sunny), each with a house, personality and favorite game; play together, share a snack, dance party, a friend's birthday party (a different friend each weekday), invite a friend to follow Hammy around the resort |

Mom and Dad move around the resort on their own daily routine; tap them for
hugs and games. Swimming always happens with a grown-up in the water, and
only Dad touches the barbecue grill.

## Needs, time and rewards

- **Needs (0–100):** Hunger, Energy, Hygiene, Bladder, Fun, Learning, Social.
  They drift slowly with game time (slower while asleep) and every activity
  changes several of them. A low need only makes Hammy ask nicely, e.g.
  *"I'm getting hungry! Can we have a snack?"*
- **Mood:** happy, excited, hungry, sleepy, bored, dirty, curious, lonely,
  relaxed or proud, shown on Hammy's face and in the top bar.
- **Clock:** a 24-hour day (one game minute per real second at normal speed),
  day of the week, morning / afternoon / evening / night lighting, and
  weather (sunny, clouds, a few hours of gentle rain, then a rainbow).
  Finishing an activity moves the clock on by its expected duration.
- **Schedule:** the daily plan from 7:00 wake-up to 20:00 sleep is only a
  suggestion; every activity is always available. Hammy's wishes come from its
  needs, the schedule, its favorite activities and unexplored places.
- **Stars:** earned for every activity (more for finishing a mini-game nicely)
  and for discovering each new place. Stars are never spent; collecting them
  unlocks hats, clothes, new books, bedroom decorations, toys, garden
  decorations and piano extras. There are also 24 stickers for trying things
  (first song, three books, every place visited…). No purchases, no random
  prizes.

## Settings and saving

Settings: music, sounds, narration, voice (🐹 Cute or 🙂 Normal, which
voice, and a 🔊 Try button), on-screen arrows, volume and time speed.

Narration plays local character recordings when available, with device voices
for missing lines and custom names. Music lowers while a character speaks.
The device fallback uses gentle pitch changes and clear pacing; Mom, Dad and
friends have their own voices. The Settings voice picker and Try button preview
the device fallback. To create the AI-generated offline recordings, follow
[voice/README.md](voice/README.md). *Start over…* in
Settings erases the save after a second confirmation; starting a *New game*
from the menu also asks first. Everything is stored in `localStorage`
(`hammyResort.save.v1`).

## Code layout

```
index.html            page, HUD and panel skeleton; scripts load in order (no modules, so file:// works)
css/style.css         HUD, buttons, panels, menu
js/core.js            1600x900 design view, input (mouse, touch, pinch, keys), scenes + transitions, particles, canvas buttons
js/audio.js           sound effects, instruments, generated background music, narration
js/art.js             painting primitives, patterns, sky / day-night / weather, nature
js/props.js           furniture and equipment
js/characters.js      the hamsters: poses, moods, outfits; family and friends data
js/state.js           save data, clock, weather, needs, mood, stars, unlocks, stickers
js/activities.js      places, every activity, the schedule, wishes, and the activity flow
js/ui.js              HUD, navigation, popovers, panels, reward card, menu
js/location.js        walkable location scenes: pathfinding, objects, Mom / Dad / friends, in-place activities
js/scenes/map.js      the world map (and the menu background)
js/scenes/house.js    dollhouse overview and the ten rooms
js/scenes/outdoor.js  pool, sports, playground, garden, barbecue, games zone, village
js/games/base.js      mini-game frame + quiz, drag-and-drop, scrub, tap and steer patterns
js/games/*.js         the mini-games (home, learning, music, reading, sports, arcade, outside, family)
js/app.js             boot and main loop
```

### Adding things

- **An activity:** add an `act(...)` line in `js/activities.js` with its
  place (`where` scene and `spot`), minutes, need effects and stars, plus
  either `game: '<id>'` (a mini-game) or `inline: { kind }` (an in-place
  animation handled in `js/location.js`). Add the id to the object's `acts`
  in the scene definition so it shows up there.
- **A mini-game:** `defineGame('<id>', { init, tick, render, down, move, up,
  keyDown })` in a file under `js/games/`, or use `quizGame`, `dragGame`,
  `scrubGame`, `tapGame` or `steerGame` from `base.js`. Call `this.good()` /
  `this.oops()` for feedback and `this.finish(bonus)` when done.
- **A room:** `room('<id>', { shell, spots, family, draw, drawDyn, blocks })`
  in `js/scenes/house.js`, plus an entry in `ROOMS` and `HOUSE_ROOMS`.

While developing, `index.html?scene=game:piano` (or `?scene=pool`,
`?scene=room:kitchen`…) jumps straight into a scene, and `?time=18.5` sets
the clock.
