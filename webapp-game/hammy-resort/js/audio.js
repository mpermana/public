// Sound: synthesized effects, instruments (piano, marimba, music box, flute)
// for the piano and karaoke games, gentle generated background music, and
// narration through the browser's speech voices. No audio files needed.

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
    this.musicBus.gain.setTargetAtTime(s.music && !Music.ducked ? 0.5 : 0, this.ctx.currentTime, 0.2);
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

const Speech = {
  supported: 'speechSynthesis' in window,
  voice: null,

  init() {
    if (!this.supported) return;
    const load = () => {
      const voices = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
      const nice = voices.filter(v => /natural|online|google|samantha|aria|jenny|zira/i.test(v.name));
      this.voice = nice.find(v => /us/i.test(v.lang)) || nice[0] || voices.find(v => /us/i.test(v.lang)) || voices[0] || null;
    };
    load();
    speechSynthesis.addEventListener?.('voiceschanged', load);
  },

  say(text, { interrupt = true, force = false } = {}) {
    if (!this.supported || !text || (!S.settings.narration && !force) || !S.settings.volume) return;
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,!?'’-]/gu, ''));
    u.lang = 'en-US';
    if (this.voice) u.voice = this.voice;
    u.rate = 0.92;
    u.pitch = 1.15;
    u.volume = clamp(S.settings.volume * 1.2, 0, 1);
    speechSynthesis.speak(u);
  },

  stop() {
    if (this.supported) speechSynthesis.cancel();
  },
};
