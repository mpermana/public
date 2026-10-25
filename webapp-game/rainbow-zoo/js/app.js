// Boot, menu, HUD and the main loop. Routes input to the active mode.
// While developing: ?mode=<id> jumps straight into a mode, ?lang=ja|zh|id|en picks a language.

const App = {
  mode: null,
  started: false,
  focus: null,
  parade: [],

  init() {
    Settings.load();
    Stage.init(document.getElementById('stage'));
    UI.init();
    Speech.init(() => this.renderMenu());
    Input.init(Stage.canvas);
    Input.handlers = {
      key: e => this.onKey(e),
      nav: dir => this.onNav(dir),
      pad: i => this.onPad(i),
      padschange: change => this.onPadsChange(change),
      rawpad: press => this.onRawPad(press),
      pointerdown: p => this.mode?.onPointerDown?.(p),
      pointermove: p => this.mode?.onPointerMove?.(p),
      pointerup: p => this.mode?.onPointerUp?.(p),
    };
    this.buildMenu();
    this.bindHud();
    this.parade = ANIMALS.map((kind, i) => ({ kind, x: i * 1.2 / ANIMALS.length - 0.1, t: rand(0, 6) }));

    document.getElementById('splash').addEventListener('click', () => this.begin());
    const params = new URLSearchParams(location.search), requested = Modes.find(m => m.id === params.get('mode'));
    if (params.get('lang') in LANG_COLUMN) {
      Settings.lang = params.get('lang');
      this.renderMenu();
    }
    if (requested) {
      this.begin();
      this.startMode(requested);
    }

    let last = performance.now();
    const frame = now => {
      // rAF timestamps can predate `last` on the first frame, so clamp at 0.
      this.tick(clamp((now - last) / 1000, 0, 0.05));
      last = now;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },

  // First click / key press: browsers need it before they'll play sound.
  begin() {
    if (this.started) return;
    this.started = true;
    Sfx.unlock();
    document.getElementById('splash').hidden = true;
    Speech.speak(word('hello').text);
    this.setFocus(document.querySelector('.mode-card'), false);
  },

  tick(dt) {
    Input.poll();
    const ctx = Stage.ctx;
    Stage.begin(dt);
    if (this.mode) {
      this.mode.update(dt);
      this.mode.draw(ctx);
    } else {
      this.drawParade(ctx, dt);
    }
    FX.update(dt);
    FX.draw(ctx);
  },

  drawParade(ctx, dt) {
    const k = Stage.k, size = 110 * k, y = Stage.h - size * 0.55;
    for (const p of this.parade) {
      p.x += dt * 0.035;
      if (p.x > 1.1) p.x -= 1.2;
      p.t += dt * 8;
      drawEmoji(ctx, p.kind.emoji, p.x * Stage.w, y - Math.abs(Math.sin(p.t)) * 14 * k, size, { flip: p.kind.flip, rot: Math.sin(p.t) * 0.08 });
    }
  },

  // ------------------------------------------------------------------ menu

  buildMenu() {
    const langRow = document.getElementById('lang-row');
    for (const lang of LANGS) {
      const b = this.navButton('chip', lang.name, () => this.setLang(lang.id), () => Speech.speak(word('hello', lang.id).text, lang.id));
      b.dataset.lang = lang.id;
      langRow.append(b);
    }
    const animalRow = document.getElementById('animal-row');
    for (const a of ANIMALS) {
      const b = this.navButton('animal-btn', a.emoji, () => this.setAnimal(a.id), () => UI.say(a.id, a.emoji));
      b.dataset.animal = a.id;
      animalRow.append(b);
    }
    const grid = document.getElementById('modes');
    for (const m of Modes) {
      const card = this.navButton('mode-card', '', () => this.startMode(m), () => Speech.speak(word(m.title).text));
      card.dataset.mode = m.id;
      card.style.setProperty('--card', m.color);
      for (const [cls, text] of [['mode-emoji', m.emoji], ['mode-title', ''], ['mode-sub', ''], ['mode-inputs', m.inputs]]) {
        const span = document.createElement('span');
        span.className = cls;
        span.textContent = text;
        card.append(span);
      }
      grid.append(card);
    }
    this.renderMenu();
  },

  navButton(cls, text, onClick, onSay) {
    const b = document.createElement('button');
    b.className = cls;
    b.tabIndex = -1;
    b.textContent = text;
    b.say = onSay;
    b.addEventListener('click', () => { b.blur(); Sfx.click(); onClick(); });
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') this.setFocus(b); });
    return b;
  },

  // Re-render every piece of text that depends on language or selection.
  renderMenu() {
    const lang = Settings.lang, title = word('title');
    document.getElementById('title').replaceChildren(...[...title.text].map((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch === ' ' ? ' ' : ch;
      span.style.color = RAINBOW[i % RAINBOW.length].hex;
      span.style.animationDelay = `${i * 0.08}s`;
      return span;
    }));
    document.getElementById('subtitle').textContent = lang === 'en' ? '' : [title.roman, title.en].filter(Boolean).join(' · ');
    document.querySelectorAll('.chip').forEach(b => b.classList.toggle('selected', b.dataset.lang === lang));
    document.querySelectorAll('.animal-btn').forEach(b => b.classList.toggle('selected', b.dataset.animal === Settings.animal));
    for (const card of document.querySelectorAll('.mode-card')) {
      const w = word(Modes.find(m => m.id === card.dataset.mode).title);
      card.querySelector('.mode-title').textContent = w.text;
      card.querySelector('.mode-sub').textContent = lang === 'en' ? '' : [w.roman, w.en].filter(Boolean).join(' · ');
    }

    const info = LANGS.find(l => l.id === lang), hint = document.getElementById('voice-hint');
    hint.textContent = !Speech.supported
      ? 'This browser cannot speak. Try Chrome or Microsoft Edge.'
      : Speech.voices.length && !Speech.voiceFor(lang)
        ? `No ${info.name} voice on this computer yet. Windows: Settings → Time & language → Speech → Add voices. Microsoft Edge also has online voices.`
        : '';

    document.getElementById('lang-btn').textContent = info.name;
    document.getElementById('sound-btn').textContent = Settings.sound ? '🔊' : '🔇';
    if (this.mode) document.getElementById('hud-title').textContent = `${this.mode.emoji} ${word(this.mode.title).text}`;
  },

  setFocus(el, speak = true) {
    if (!el || el === this.focus) return;
    this.focus?.classList.remove('focused');
    this.focus = el;
    el.classList.add('focused');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (speak && this.started) el.say?.();
  },

  // Move menu focus to the nearest item in a direction (keyboard / d-pad).
  spatialNav(dir) {
    const items = [...document.querySelectorAll('.chip, .animal-btn, .mode-card')];
    if (!items.includes(this.focus)) return this.setFocus(items.find(el => el.classList.contains('mode-card')));
    const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const [vx, vy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir], a = center(this.focus);
    let best = null, bestScore = Infinity;
    for (const el of items) {
      if (el === this.focus) continue;
      const b = center(el), dx = b.x - a.x, dy = b.y - a.y, along = dx * vx + dy * vy;
      if (along <= 4) continue;
      const score = along + Math.abs(dx * vy - dy * vx) * 2.5;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) this.setFocus(best);
  },

  setLang(id) {
    Settings.lang = id;
    Settings.save();
    this.renderMenu();
    Speech.speak(word('hello').text);
  },

  setAnimal(id) {
    Settings.animal = id;
    Settings.save();
    this.renderMenu();
    UI.say(id, ANIMALS.find(a => a.id === id).emoji);
  },

  // ----------------------------------------------------------- modes / HUD

  startMode(m) {
    this.home();
    this.mode = m;
    FX.clear();
    Stage.night = 0;
    document.body.classList.add('playing');
    document.getElementById('menu').hidden = true;
    this.renderMenu();
    m.start();
  },

  home() {
    if (!this.mode) return;
    this.mode.stop?.();
    this.mode = null;
    FX.clear();
    Stage.night = 0;
    Speech.stop();
    UI.setExtra();
    document.body.classList.remove('playing');
    document.getElementById('menu').hidden = false;
    this.renderMenu();
  },

  bindHud() {
    const on = (id, fn) => {
      const b = document.getElementById(id);
      b.tabIndex = -1;
      b.addEventListener('click', () => { b.blur(); Sfx.click(); fn(); });
    };
    on('home-btn', () => this.home());
    on('lang-btn', () => this.setLang(LANGS[(LANGS.findIndex(l => l.id === Settings.lang) + 1) % LANGS.length].id));
    on('sound-btn', () => {
      Settings.sound = !Settings.sound;
      Settings.save();
      if (!Settings.sound) Speech.stop();
      this.renderMenu();
    });
    on('fs-btn', () => this.toggleFullscreen());
    on('pad-btn', () => this.openPads());
    on('pad-close', () => this.closePads());
    const panel = document.getElementById('pad-panel');
    panel.addEventListener('click', e => { if (e.target === panel) this.closePads(); });
    addEventListener('pointerdown', () => Sfx.unlock(), true);
  },

  // ------------------------------------------------------ controller picker

  get padsOpen() { return !document.getElementById('pad-panel').hidden; },

  openPads() {
    document.getElementById('pad-panel').hidden = false;
    this.renderPads();
  },

  closePads() {
    document.getElementById('pad-panel').hidden = true;
  },

  selectPad(choice) {
    Settings.pad = choice;
    Settings.save();
    this.renderPads();
    Sfx.ding(4);
    UI.toast(choice ? `🎮 Using ${padName(choice.id)}` : '🎮 Any controller can play');
  },

  renderPads() {
    const same = (a, b) => a && b && a.id === b.id && a.index === b.index;
    const rows = [{ choice: null, icon: '✨', name: 'Any controller', sub: 'Whichever one was pressed last' }];
    for (const g of Input.pads) {
      const inUse = Input.pad && padKey(Input.pad) === padKey(g);
      rows.push({ choice: { id: g.id, index: g.index }, icon: '🎮', name: padName(g.id), sub: `Controller ${g.index + 1}${inUse ? ' · playing now' : ''}`, index: g.index });
    }
    if (Settings.pad && !Input.pads.some(g => same(Settings.pad, g))) {
      rows.push({ choice: Settings.pad, icon: '🔌', name: padName(Settings.pad.id), sub: 'Not connected', missing: true });
    }
    const list = document.getElementById('pad-list');
    list.replaceChildren(...rows.map(r => {
      const b = document.createElement('button');
      b.className = 'pad-row';
      b.tabIndex = -1;
      b.classList.toggle('selected', r.choice ? same(r.choice, Settings.pad) : !Settings.pad);
      b.classList.toggle('missing', !!r.missing);
      if (r.index !== undefined) b.dataset.index = r.index;
      for (const [cls, text] of [['pad-icon', r.icon], ['pad-text', ''], ['pad-check', '✓']]) {
        const span = document.createElement('span');
        span.className = cls;
        span.textContent = text;
        b.append(span);
      }
      const name = document.createElement('b'), sub = document.createElement('small');
      name.textContent = r.name;
      sub.textContent = r.sub;
      b.querySelector('.pad-text').append(name, sub);
      b.addEventListener('click', () => { b.blur(); this.selectPad(r.choice); });
      return b;
    }));
    if (!Input.pads.length) {
      const p = document.createElement('p');
      p.className = 'pad-empty';
      p.textContent = 'No controller found yet. Plug one in and press any button on it — browsers only show a controller after a button press.';
      list.append(p);
    }
  },

  // While the picker is open, any controller can answer: A picks it, B / Start closes.
  onRawPad({ pad, button }) {
    if (!this.padsOpen) return;
    this.renderPads();
    const icon = document.querySelector(`.pad-row[data-index="${pad.index}"] .pad-icon`);
    icon?.classList.add('ping');
    if (button === 0) this.selectPad({ id: pad.id, index: pad.index });
    else if (button === 1 || button === 9) this.closePads();
  },

  onPadsChange({ added, removed }) {
    if (added.length) {
      UI.toast(`🎮 ${padName(added[0].id)} connected!`);
      Sfx.ding(4);
    } else if (removed.length) {
      UI.toast(`🎮 ${padName(removed[0].id)} disconnected`);
    }
    if (this.padsOpen) this.renderPads();
  },

  // Fullscreen also locks the keyboard where supported, so stray Esc / Tab
  // presses stay in the game (hold Esc to leave fullscreen).
  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        navigator.keyboard?.unlock?.();
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
        await navigator.keyboard?.lock?.();
      }
    } catch { /* not supported here */ }
  },

  // ----------------------------------------------------------------- input

  onKey(e) {
    Sfx.unlock();
    if (!this.started) return this.begin();
    if (this.padsOpen) {
      if (['Escape', 'Enter', 'Space'].includes(e.code)) this.closePads();
      return;
    }
    if (!this.mode) {
      if (e.code === 'Enter' || e.code === 'Space') this.focus?.click();
      return;
    }
    if (this.mode.onKey?.(e)) return;
    if (e.code === 'Escape') this.home();
    else if (e.code === 'Space' || e.code === 'Enter') this.mode.onAction?.();
  },

  onNav(dir) {
    if (!this.started || this.padsOpen) return;
    if (!this.mode) this.spatialNav(dir);
    else this.mode.onNav?.(dir);
  },

  onPad(i) {
    // Controllers don't count as a user gesture for audio, so ask for a click once.
    if (!this.started) return UI.toast('👆 Click or press a key to start — that turns on the sound');
    if (this.padsOpen) return; // handled by onRawPad
    if (!this.mode) {
      if (i === 0) this.focus?.click();
      return;
    }
    if (this.mode.onPad?.(i)) return;
    if (i === 0) this.mode.onAction?.();
    else if (i === 8 || i === 9) this.home();
  },
};

App.init();
