// Speech (Web Speech API) and little synthesized sound effects (Web Audio).

const Speech = {
  supported: 'speechSynthesis' in window,
  voices: [],

  init(onChange) {
    if (!this.supported) return;
    const load = () => {
      this.voices = speechSynthesis.getVoices();
      onChange?.();
    };
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
  },

  // Best installed voice for a language: exact locale first, nicer voices first.
  voiceFor(lang) {
    const tag = LANGS.find(l => l.id === lang).voice.toLowerCase();
    const norm = v => v.lang.toLowerCase().replace('_', '-');
    const same = this.voices.filter(v => norm(v) === tag);
    const family = this.voices.filter(v => norm(v).split('-')[0] === tag.split('-')[0]);
    const nice = list => list.find(v => /natural|online|google/i.test(v.name));
    return nice(same) || same[0] || nice(family) || family[0] || null;
  },

  speak(text, lang = Settings.lang, { interrupt = true } = {}) {
    if (!this.supported || !Settings.sound || !text) return;
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGS.find(l => l.id === lang).voice;
    const voice = this.voiceFor(lang);
    if (voice) u.voice = voice;
    u.rate = 0.85;
    u.pitch = 1.15;
    speechSynthesis.speak(u);
  },

  stop() {
    if (this.supported) speechSynthesis.cancel();
  },
};

const Sfx = {
  ctx: null,

  // Browsers only allow audio after a click or key press.
  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  ready() {
    return Settings.sound && this.ctx && this.ctx.state === 'running' ? this.ctx : null;
  },

  tone(freq, dur, { type = 'sine', vol = 0.2, to = freq, delay = 0 } = {}) {
    const ac = this.ready();
    if (!ac) return;
    const t = ac.currentTime + delay, osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  noise(dur, { vol = 0.2, freq = 1000, type = 'lowpass', delay = 0 } = {}) {
    const ac = this.ready();
    if (!ac) return;
    const len = Math.ceil(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), gain = ac.createGain();
    src.buffer = buf;
    filter.type = type;
    filter.frequency.value = freq;
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(ac.currentTime + delay);
  },

  pop()    { this.tone(500, 0.12, { to: 1400, vol: 0.25 }); },
  click()  { this.tone(900, 0.05, { type: 'square', vol: 0.06 }); },
  soft()   { this.tone(300, 0.15, { to: 250, vol: 0.12 }); },
  boing()  { this.tone(180, 0.35, { to: 520, vol: 0.25 }); },
  whoosh() { this.noise(0.4, { freq: 2500, type: 'bandpass', vol: 0.4 }); },
  splash() { this.noise(0.5, { freq: 3000, type: 'highpass', vol: 0.25 }); },
  thud()   { this.tone(120, 0.25, { to: 40, vol: 0.5 }); this.noise(0.15, { freq: 300, vol: 0.4 }); },
  roar()   { this.noise(0.6, { freq: 500, vol: 0.5 }); this.tone(110, 0.6, { to: 70, type: 'sawtooth', vol: 0.12 }); },
  chomp()  { this.noise(0.07, { freq: 1500, vol: 0.35 }); this.noise(0.07, { freq: 1200, vol: 0.3, delay: 0.12 }); },

  // Rising notes: pass a step to climb the scale (e.g. counting stars).
  ding(step = 0) {
    const f = 660 * Math.pow(2, step / 12);
    this.tone(f, 0.35, { type: 'triangle', vol: 0.2 });
    this.tone(f * 2, 0.25, { vol: 0.06 });
  },

  tada() {
    [0, 4, 7, 12].forEach((s, i) => this.tone(523 * Math.pow(2, s / 12), 0.3, { type: 'triangle', vol: 0.18, delay: i * 0.1 }));
  },
};
