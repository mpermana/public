const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup(supported = true) {
  const clips = [], spoken = [];
  const synth = { getVoices: () => [], cancel() {}, speak(u) { spoken.push(u); } };
  class Audio {
    constructor(src) { this.src = src; clips.push(this); }
    play() { return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const context = vm.createContext({
    window: { ...(supported ? { speechSynthesis: synth } : {}), VOICE_CLIPS: { hammy: { 'Hello!': 'hammy-001.mp3' } } },
    speechSynthesis: synth, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    Audio, S: { settings: { narration: true, volume: 0.8, music: true } },
    clamp: (n, lo, hi) => Math.min(hi, Math.max(lo, n)),
    setTimeout, setInterval, console,
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8') + '\nglobalThis.api = { Speech, Snd, Music };', context);
  return { ...context.api, context, clips, spoken };
}

test('recordings and dynamic device speech share an ordered queue', () => {
  const { Speech, clips, spoken } = setup();
  Speech.say('🐹 Hello!');
  Speech.say('Mia rolled three!', { interrupt: false });
  assert.equal(clips[0].src, 'voice/clips/hammy-001.mp3');
  assert.equal(spoken.length, 0);
  clips[0].onended();
  assert.equal(spoken[0].text, 'Mia rolled three!');
  spoken[0].onend();
  assert.equal(Speech.active, false);
});

test('failed clips fall back once, then advance to the next line', async () => {
  const { Speech, clips, spoken } = setup();
  Speech.say('Hello!');
  Speech.say('Next!', { interrupt: false });
  const error = clips[0].onerror;
  error(); error();
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, 'Hello!');
  spoken[0].onend();
  assert.equal(spoken[1].text, 'Next!');
});

test('interrupt clears queued speech and ignores stale media callbacks', () => {
  const { Speech, clips, spoken } = setup();
  Speech.say('Hello!');
  Speech.say('Old queued line', { interrupt: false });
  const ended = clips[0].onended;
  Speech.say('New instruction');
  ended();
  assert.equal(clips[0].paused, true);
  assert.deepEqual(spoken.map(u => u.text), ['New instruction']);
  spoken[0].onend();
  assert.equal(Speech.active, false);
});

test('music ducks while talking and preserves quiet-game ducking', () => {
  const { Speech, Snd, Music, spoken, context } = setup();
  const gains = [];
  Snd.ctx = { currentTime: 0 };
  Snd.master = { gain: {} }; Snd.sfxBus = { gain: {} };
  Snd.musicBus = { gain: { setTargetAtTime(value) { gains.push(value); } } };
  Speech.say('Device speech');
  assert.equal(gains.at(-1), 0.1);
  spoken[0].onend();
  assert.equal(gains.at(-1), 0.5);
  Music.duck(true);
  Speech.say('A quiet story');
  spoken[1].onend();
  assert.equal(gains.at(-1), 0);
  context.S.settings.narration = false;
  Speech.say('Muted');
  assert.equal(spoken.length, 2);
});

test('recordings work without speech synthesis and device preview bypasses clips', () => {
  const withoutSpeech = setup(false);
  withoutSpeech.Speech.say('Hello!');
  assert.equal(withoutSpeech.clips.length, 1);
  withoutSpeech.clips[0].onended();
  withoutSpeech.Speech.say('Unavailable fallback');
  assert.equal(withoutSpeech.Speech.active, false);
  const { Speech, clips, spoken } = setup();
  Speech.say('Hello!', { browser: true });
  assert.equal(clips.length, 0);
  assert.equal(spoken[0].text, 'Hello!');
});
