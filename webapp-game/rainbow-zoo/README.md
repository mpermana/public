# 🌈 Rainbow Zoo

A browser game for 4–5 year olds to practise using a **keyboard, mouse and game
controller**, with cute animals (rabbit, hamster, lion, dinosaur, Godzilla,
giraffe, elephant), rainbow colors, and words spoken in **English, 日本語,
中文 and Bahasa Indonesia**.

No build step, no dependencies: plain HTML, CSS and JavaScript.

## Run it

Double-click `index.html`, or serve the folder:

```sh
python -m http.server 8000   # then open http://localhost:8000
```

Click (or press any key) on the ▶ screen once. Browsers need a click or key
press before they will play sound, and a controller press doesn't count.

Tips for parents:

- Press ⛶ for full screen. In Chrome and Edge this also locks the keyboard, so
  stray Esc / Tab / Windows-key presses stay in the game. **Hold Esc** to leave
  full screen.
- The 🏠 button, Esc, or the controller's Start/Back button returns to the menu
  (except in Button Party, where every button belongs to the game).
- **More than one controller?** Press 🎮 in the top bar. Each controller's
  icon bounces when you press it; press **A** on the one to use (or click it).
  "Any controller" (the default) follows whichever one was pressed last. Once
  one is chosen, the others are ignored, which helps with siblings or extra
  devices such as racing wheels. B or Esc closes the picker.
- Language, animal, sound and controller settings are remembered in the browser.

## Game modes

| Mode | Teaches | What happens |
| --- | --- | --- |
| 🐾 **Walk & Play** | ⌨️ 🖱️ 🎮 | Move the animal with arrows, d-pad, stick, or by holding the mouse. Collect ⭐ and count to ten. Space / A / clicking the animal does its special move (rabbit hops, lion roars, Godzilla breathes rainbows, elephant sprays water…). Letter and number keys float out of the animal. Tab / X / Y / bumpers switch animals. |
| 🍎 **Snack Time** | ⌨️ 🖱️ 🎮 | Walk to fruits and vegetables, or drag them to the animal with the mouse. Each bite says the food's name and makes the animal **bigger**. The thought bubble shows a favorite food for bonus hearts. When the animal is fully grown there's a party, then it starts small again. |
| 🎈 **Letter Balloons** | ⌨️ | Balloons float up with letters (ABC) or numbers (123). Press the matching key to pop them. The on-screen keyboard lights up where each key is. |
| 🫧 **Bubble Pop** | 🖱️ 🎮 | Click bubbles to pop them and hear the animal or food inside. "Touch" mode pops by just moving the mouse over them (easier). A controller drives a sparkle cursor; A pops. |
| 🎮 **Button Party** | 🎮 ⌨️ | A big controller on screen. Press the glowing button and the animal celebrates; every button says its color, and the d-pad says up/down/left/right. Sticks wiggle on screen. PlayStation controllers get ✕ ○ □ △ colors. No controller? Use keys A B X Y. |
| 🕐 **Clock Time** | ⌨️ 🖱️ 🎮 | A rainbow clock. ← → move half an hour, ↑ ↓ one hour. Number keys jump to an hour; you can drag the long hand or click the day timeline. The animal shows the zoo's routine (wake up, breakfast, play, lunch, nap, snack, dinner, bath, bedtime) and the sky turns to night. 🕐 shows the real time; 🎯 (or X) starts a quiz: "Can you make it 3 o'clock?" |

## Languages and voices

Words are spoken with the browser's built-in speech (Web Speech API). Each word
card shows the word, its reading (romaji / pinyin) and the English.

If a language is silent, the computer has no voice installed for it, and the
menu shows a hint. On Windows: *Settings → Time & language → Speech → Add
voices*. **Microsoft Edge** includes good online voices for all four languages.

## Code layout

```
index.html        page skeleton; scripts load in order (no modules, so file:// works)
css/style.css     menu, HUD, dock, word card
js/i18n.js        LANGS, WORDS (all vocabulary), time phrases per language
js/content.js     animals, foods, rainbow colors, letter pictures, daily schedule
js/core.js        Settings, Stage (canvas + meadow), emoji sprites, FX particles, Animal, UI helpers
js/sound.js       Speech (text-to-speech) and Sfx (synthesized sound effects)
js/input.js       keyboard, pointer and gamepad → events + Input.dir()
js/modes/*.js     one file per game mode
js/app.js         menu, HUD, input routing, main loop
```

### Adding things

- **A word or language string:** add a row to `WORDS` in `js/i18n.js`:
  `[English, 'ja|romaji', 'zh|pinyin', Indonesian]`.
- **A food or animal:** add it to `js/content.js` and its name to `WORDS`.
- **A mode:** create `js/modes/<name>.js` that calls `Modes.push({...})` with
  `id, emoji, title, inputs, color, start(), update(dt), draw(ctx)` and any of
  `stop, onKey, onPad, onNav, onAction, onPointerDown, onPointerMove, onPointerUp`.
  `onKey` / `onPad` return `true` to consume the input. Then add a `<script>`
  tag in `index.html` and a `mode_<name>` title in `WORDS`.

While developing, `index.html?mode=clock&lang=ja` jumps straight into a mode
and language. Sound stays off until the first click.
