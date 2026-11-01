// Sound: synthesized effects, instruments (piano, marimba, music box, flute)
// for the piano and karaoke games, gentle generated background music, and
// narration from local voice clips with device speech as a fallback.

const midiFreq = m => 440 * Math.pow(2, (m - 69) / 12);
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
// "C4" -> 60, "G#4" -> 68
function noteMidi(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return 60;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  return base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
}

const Snd = {
  ctx: null, master: null, sfxBus: null, musicBus: null,

  // Browsers only allow audio after a click or key press.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.5;
      this.musicBus.connect(this.master);
      this.applySettings();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  applySettings() {
    if (!this.ctx) return;
    const s = S.settings;
    this.master.gain.value = s.volume;
    this.sfxBus.gain.value = s.sfx ? 1 : 0;
    this.musicBus.gain.setTargetAtTime(s.music && !Music.ducked ? (Speech.active ? 0.1 : 0.5) : 0, this.ctx.currentTime, 0.2);
    if (Speech.audio) Speech.audio.volume = s.volume;
  },

  ok() { return this.ctx && this.ctx.state === 'running' ? this.ctx : null; },

  tone(freq, dur, { type = 'sine', vol = 0.2, to = freq, delay = 0, attack = 0.008, bus = this.sfxBus } = {}) {
    const ac = this.ok();
    if (!ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to !== freq) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  },

  noise(dur, { vol = 0.2, freq = 1000, type = 'lowpass', delay = 0, q = 1 } = {}) {
    const ac = this.ok();
    if (!ac) return;
    const len = Math.ceil(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(ac.currentTime + delay);
  },

  // A pitched note on an instrument. `when` is seconds from now.
  note(midi, { dur = 1.2, vel = 0.5, inst = 'piano', when = 0, bus = this.sfxBus } = {}) {
    const ac = this.ok();
    if (!ac) return;
    const f = midiFreq(midi), t = ac.currentTime + when;
    const voice = (freq, type, gain, decay, attack = 0.006) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain * vel, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + decay + 0.05);
      return o;
    };
    switch (inst) {
      case 'piano': {
        const d = clamp(dur * 1.6, 0.6, 2.4) * (midi > 72 ? 0.8 : 1);
        voice(f, 'triangle', 0.5, d);
        voice(f * 2, 'sine', 0.22, d * 0.6);
        voice(f * 3, 'sine', 0.08, d * 0.35);
        voice(f * 1.003, 'sine', 0.25, d);
        break;
      }
      case 'marimba':
        voice(f, 'sine', 0.55, 0.55, 0.004);
        voice(f * 4, 'sine', 0.08, 0.12, 0.002);
        break;
      case 'musicbox':
        voice(f, 'sine', 0.4, 1.1, 0.003);
        voice(f * 3, 'sine', 0.12, 0.4, 0.002);
        break;
      case 'bell':
        voice(f, 'sine', 0.35, 1.4, 0.003);
        voice(f * 2.76, 'sine', 0.12, 0.6, 0.002);
        break;
      case 'steel':
        voice(f, 'sine', 0.45, 0.6, 0.004);
        voice(f * 2.02, 'triangle', 0.12, 0.3, 0.003);
        break;
      case 'pluck':
        voice(f, 'triangle', 0.4, 0.35, 0.003);
        voice(f * 2, 'sine', 0.1, 0.18, 0.002);
        break;
      case 'bass':
        voice(f, 'triangle', 0.6, clamp(dur, 0.3, 0.9), 0.01);
        break;
      case 'pad':
        voice(f, 'sine', 0.25, dur, 0.25);
        voice(f * 1.005, 'triangle', 0.1, dur, 0.3);
        break;
      case 'flute': {
        const o = voice(f, 'triangle', 0.5, dur + 0.15, 0.06);
        const lfo = ac.createOscillator(), lg = ac.createGain();
        lfo.frequency.value = 5;
        lg.gain.value = f * 0.008;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(t);
        lfo.stop(t + dur + 0.2);
        voice(f * 2, 'sine', 0.08, dur, 0.08);
        break;
      }
    }
  },

  click()   { this.tone(880, 0.05, { type: 'square', vol: 0.05 }); },
  tap()     { this.tone(620, 0.08, { to: 900, vol: 0.14 }); },
  pop()     { this.tone(420, 0.12, { to: 1300, vol: 0.22 }); },
  step()    { this.noise(0.04, { freq: 700, vol: 0.05 }); },
  soft()    { this.tone(330, 0.18, { to: 280, vol: 0.12 }); },
  whoosh()  { this.noise(0.35, { freq: 1800, type: 'bandpass', vol: 0.35 }); },
  splash()  { this.noise(0.5, { freq: 2400, type: 'highpass', vol: 0.22 }); this.noise(0.25, { freq: 600, vol: 0.2 }); },
  munch()   { this.noise(0.07, { freq: 1400, vol: 0.3 }); this.noise(0.07, { freq: 1100, vol: 0.26, delay: 0.13 }); },
  boing()   { this.tone(190, 0.32, { to: 560, vol: 0.22 }); },
  bounce()  { this.tone(260, 0.18, { to: 420, vol: 0.18, type: 'triangle' }); },
  thud()    { this.tone(130, 0.2, { to: 60, vol: 0.4 }); this.noise(0.12, { freq: 300, vol: 0.25 }); },
  kick()    { this.tone(160, 0.14, { to: 70, vol: 0.35 }); this.noise(0.05, { freq: 2000, vol: 0.12 }); },
  swish()   { this.noise(0.18, { freq: 3000, type: 'bandpass', vol: 0.3, q: 2 }); },
  page()    { this.noise(0.22, { freq: 2600, type: 'bandpass', vol: 0.2, q: 0.6 }); },
  heart()   { this.tone(700, 0.15, { to: 1000, vol: 0.12, type: 'triangle' }); this.tone(1000, 0.2, { to: 1300, vol: 0.1, type: 'triangle', delay: 0.12 }); },
  flush()   { this.noise(1.2, { freq: 900, type: 'bandpass', vol: 0.35, q: 0.5 }); this.tone(500, 0.9, { to: 180, vol: 0.06 }); },
  snore()   { this.noise(0.9, { freq: 260, vol: 0.12 }); },
  sparkle() { [0, 0.06, 0.12].forEach((d, i) => this.tone(1500 + i * 400, 0.15, { vol: 0.05, delay: d, type: 'triangle' })); },
  ding(step = 0) {
    const f = 660 * Math.pow(2, step / 12);
    this.tone(f, 0.35, { type: 'triangle', vol: 0.18 });
    this.tone(f * 2, 0.25, { vol: 0.05 });
  },
  star()    { this.tone(1046, 0.12, { type: 'triangle', vol: 0.12 }); this.tone(1568, 0.25, { type: 'triangle', vol: 0.12, delay: 0.08 }); },
  cheer()   { [0, 4, 7, 12].forEach((s, i) => this.tone(523 * Math.pow(2, s / 12), 0.3, { type: 'triangle', vol: 0.16, delay: i * 0.09 })); },
  fanfare() {
    [0, 4, 7, 12].forEach((s, i) => this.tone(523 * Math.pow(2, s / 12), 0.16, { type: 'square', vol: 0.05, delay: i * 0.1 }));
    [12, 16, 19].forEach(s => this.tone(523 * Math.pow(2, s / 12), 0.9, { type: 'triangle', vol: 0.12, delay: 0.42 }));
  },
  // Not "wrong!", just a gentle "try again" bloop.
  hmm()     { this.tone(392, 0.16, { type: 'triangle', vol: 0.1 }); this.tone(349, 0.22, { type: 'triangle', vol: 0.1, delay: 0.14 }); },
  yawn()    { this.tone(520, 0.8, { to: 300, vol: 0.06, type: 'triangle', attack: 0.15 }); },
  tummy()   { this.tone(110, 0.25, { to: 90, vol: 0.12, type: 'sine' }); this.tone(95, 0.3, { to: 120, vol: 0.1, delay: 0.25 }); },

  // A looping water sound for the shower / bath.
  water(on) {
    const ac = this.ok();
    if (!on) {
      if (this.waterSrc) {
        this.waterGain.gain.setTargetAtTime(0, ac?.currentTime || 0, 0.1);
        const src = this.waterSrc;
        setTimeout(() => { try { src.stop(); } catch { /* already stopped */ } }, 400);
        this.waterSrc = null;
      }
      return;
    }
    if (!ac || this.waterSrc) return;
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf;
    src.loop = true;
    f.type = 'bandpass';
    f.frequency.value = 2200;
    f.Q.value = 0.4;
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.08, ac.currentTime, 0.2);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start();
    this.waterSrc = src;
    this.waterGain = g;
  },
};

// ------------------------------------------------------------------ music

// Gentle generated background music: a chord loop with bass, a soft arpeggio
// and a little melody, different per area. Scheduled slightly ahead with
// Web Audio timing so it stays steady.
const Music = {
  themeId: null, theme: null, step: 0, next: 0, timer: null, ducked: false,

  THEMES: {
    menu:    { bpm: 100, root: 60, inst: 'marimba', chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], seed: 3, rhythm: [1, 0, 1, 1, 0, 1, 1, 0] },
    home:    { bpm: 82,  root: 60, inst: 'marimba', chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], seed: 7, rhythm: [1, 0, 0, 1, 1, 0, 1, 0] },
    outdoor: { bpm: 104, root: 67, inst: 'pluck', chords: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]], seed: 11, rhythm: [1, 0, 1, 0, 1, 1, 0, 1] },
    pool:    { bpm: 108, root: 65, inst: 'steel', chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]], seed: 19, rhythm: [1, 0, 1, 1, 0, 1, 0, 1] },
    games:   { bpm: 116, root: 62, inst: 'pluck', chords: [[0, 3, 7], [8, 12, 15], [10, 14, 17], [7, 11, 14]], seed: 23, rhythm: [1, 1, 0, 1, 1, 0, 1, 0] },
    night:   { bpm: 64,  root: 65, inst: 'musicbox', chords: [[0, 4, 7], [5, 9, 12], [0, 4, 7], [7, 11, 14]], seed: 5, rhythm: [1, 0, 0, 0, 1, 0, 0, 0] },
    village: { bpm: 96,  root: 62, inst: 'bell', chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], seed: 31, rhythm: [1, 0, 1, 0, 1, 0, 1, 1] },
  },

  play(id) {
    if (this.themeId === id) return;
    this.themeId = id;
    this.theme = this.THEMES[id] || null;
    this.step = 0;
    this.melody = this.theme ? this.compose(this.theme) : null;
    const ac = Snd.ok();
    this.next = ac ? ac.currentTime + 0.15 : 0;
    if (!this.timer) this.timer = setInterval(() => this.pump(), 90);
  },

  stop() { this.play(null); },

  duck(on) {
    this.ducked = on;
    Snd.applySettings();
  },

  // One melody note per rhythm hit: chord tones with pentatonic steps between.
  compose(th) {
    const rnd = seeded(th.seed), notes = [];
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    let cur = 4;
    for (let bar = 0; bar < 8; bar++) {
      const chord = th.chords[bar % th.chords.length];
      for (let s = 0; s < 8; s++) {
        if (!th.rhythm[s] || (bar % 4 === 3 && s > 4)) { notes.push(null); continue; }
        if (s === 0) {
          const tone = chord[Math.floor(rnd() * chord.length)] % 12;
          cur = scale.indexOf(tone) >= 0 ? scale.indexOf(tone) : cur;
        } else cur = clamp(cur + Math.round((rnd() - 0.5) * 3), 0, scale.length - 1);
        notes.push(scale[cur]);
      }
    }
    return notes;
  },

  pump() {
    const ac = Snd.ok(), th = this.theme;
    if (!ac || !th) return;
    const eighth = 60 / th.bpm / 2;
    if (this.next < ac.currentTime) this.next = ac.currentTime + 0.05;
    while (this.next < ac.currentTime + 0.3) {
      const when = this.next - ac.currentTime, step = this.step % 64, bar = Math.floor(step / 8), s = step % 8;
      const chord = th.chords[bar % th.chords.length], bus = Snd.musicBus;
      if (s === 0 || s === 4) Snd.note(th.root - 24 + chord[0], { inst: 'bass', vel: 0.32, when, dur: eighth * 3, bus });
      if (s % 2 === 1) Snd.note(th.root - 12 + chord[(s >> 1) % 3], { inst: th.inst === 'musicbox' ? 'musicbox' : 'marimba', vel: 0.1, when, bus });
      if (s === 0 && bar % 2 === 0) chord.forEach(c => Snd.note(th.root - 12 + c, { inst: 'pad', vel: 0.08, when, dur: eighth * 15, bus }));
      const m = this.melody[step];
      if (m !== null) Snd.note(th.root + m, { inst: th.inst, vel: 0.22, when, dur: eighth * 1.5, bus });
      this.next += eighth;
      this.step++;
    }
  },
};

// ------------------------------------------------------------- narration

// Local recordings provide expressive characters; dynamic and missing lines
// use device speech. Keep the fallback pitch gentle so words remain clear.
const CHILD_VOICE = /\b(ana|maisie)\b/i;
const MALE_VOICE = /\b(male|guy|davis|andrew|brian|christopher|eric|roger|steffan|david|mark|ryan|thomas|daniel|alex|fred|george|james|tony|jason|ralph|aaron|arthur|oliver|liam|noah)\b/i;
const BRIGHT_VOICE = /\b(ava|emma|jenny|aria|michelle|libby|sonia|samantha|zira|karen|moira|tessa|natasha|clara|joanna|salli|ivy|kimberly)\b|google us english|google uk english female/i;

const Speech = {
  supported: 'speechSynthesis' in window,
  voices: [],
  queue: [], active: false, audio: null, generation: 0,

  init() {
    if (!this.supported) return;
    const load = () => { this.voices = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang)); };
    load();
    speechSynthesis.addEventListener?.('voiceschanged', load);
  },

  // How cute a voice is: child voices first, then bright natural voices.
  score(v) {
    let s = 0;
    if (CHILD_VOICE.test(v.name)) s += 100;
    if (/natural|online|neural|premium|enhanced|google/i.test(v.name)) s += 40;
    if (BRIGHT_VOICE.test(v.name)) s += 25;
    if (MALE_VOICE.test(v.name)) s -= 60;
    if (/en[-_]us/i.test(v.lang)) s += 5;
    return s;
  },

  // English voices, cutest first (for the Settings picker).
  list() { return [...this.voices].sort((a, b) => this.score(b) - this.score(a)); },

  isChild(v) { return !!v && CHILD_VOICE.test(v.name); },

  // The voice and tone for a speaker: hammy (narration too), mom, dad, friend.
  voiceFor(who) {
    const all = this.list(), chosen = S.settings.voice && all.find(v => v.voiceURI === S.settings.voice);
    const adults = all.filter(v => !this.isChild(v)), children = all.filter(v => this.isChild(v));
    const main = chosen || (S.settings.voiceStyle === 'normal' ? adults.find(v => !MALE_VOICE.test(v.name)) || adults[0] : all[0]) || null;
    if (who === 'mom') return adults.find(v => !MALE_VOICE.test(v.name)) || main;
    if (who === 'dad') return adults.find(v => MALE_VOICE.test(v.name) && /natural|online|neural|google|premium/i.test(v.name)) || adults.find(v => MALE_VOICE.test(v.name)) || main;
    if (who === 'friend') return children.find(v => v !== main) || main;
    return main;
  },

  tone(who, voice) {
    const cute = S.settings.voiceStyle !== 'normal', child = this.isChild(voice);
    switch (who) {
      case 'mom': return { pitch: 1.08, rate: 0.95 };
      case 'dad': return { pitch: MALE_VOICE.test(voice?.name || '') ? 0.98 : 0.9, rate: 0.92 };
      case 'friend': return { pitch: child ? 1.05 : cute ? 1.18 : 1.05, rate: 0.96 };
      default: return cute ? { pitch: child ? 1.02 : 1.15, rate: 0.92 } : { pitch: 1, rate: 0.95 };
    }
  },

  clean(text) { return text.replace(/[^\p{L}\p{N}\s.,!?'’-]/gu, '').replace(/\s+/g, ' ').trim(); },

  say(text, { interrupt = true, force = false, who = 'hammy', browser = false } = {}) {
    if (!text || (!S.settings.narration && !force) || !S.settings.volume) return;
    text = this.clean(text);
    if (!text) return;
    if (interrupt) this.stop();
    this.queue.push({ text, who, browser });
    if (!this.active) this.next();
  },

  next() {
    const line = this.queue.shift();
    this.active = !!line;
    Snd.applySettings();
    if (!line) return;
    const token = this.generation;
    let finished = false;
    const done = () => {
      if (finished || token !== this.generation) return;
      finished = true;
      this.audio = null;
      this.next();
    };
    const file = !line.browser && window.VOICE_CLIPS?.[line.who]?.[line.text];
    if (file) {
      const audio = this.audio = new Audio(`voice/clips/${file}`);
      audio.volume = S.settings.volume;
      audio.onended = done;
      let failed = false;
      const fallback = () => {
        if (failed || finished || token !== this.generation) return;
        failed = true;
        audio.onended = audio.onerror = null;
        audio.pause();
        this.audio = null;
        this.device(line, done);
      };
      audio.onerror = fallback;
      try { audio.play().catch(fallback); } catch { fallback(); }
    } else this.device(line, done);
  },

  device({ text, who }, done) {
    if (!this.supported) { done(); return; }
    const u = new SpeechSynthesisUtterance(text);
    const voice = this.voiceFor(who), t = this.tone(who, voice);
    u.lang = voice?.lang || 'en-US';
    if (voice) u.voice = voice;
    u.rate = t.rate;
    u.pitch = t.pitch;
    u.volume = clamp(S.settings.volume * 1.2, 0, 1);
    u.onend = u.onerror = done;
    try { speechSynthesis.speak(u); } catch { done(); }
  },

  stop() {
    this.generation++;
    this.queue.length = 0;
    if (this.audio) {
      this.audio.onended = this.audio.onerror = null;
      this.audio.pause();
      this.audio = null;
    }
    this.active = false;
    if (this.supported) speechSynthesis.cancel();
    Snd.applySettings();
  },
};
