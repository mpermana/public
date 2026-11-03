// The DOM layer on top of the canvas: HUD, navigation, the activity bar,
// popovers, panels (wishes, schedule, status, stickers, wardrobe, settings,
// pause), the reward card, the main menu and the hamster chooser.

const $ = id => document.getElementById(id);
function el(tag, cls = '', html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

const UI = {
  hudT: 0,
  lastMood: null,
  rewardOpen: false,
  panelKind: null,

  init() {
    for (const b of document.querySelectorAll('#nav button')) b.addEventListener('click', () => { Snd.click(); this.nav(b.dataset.nav); });
    $('hud-hammy').addEventListener('click', () => { Snd.click(); this.openStatus(); });
    $('hud-stars').addEventListener('click', () => { Snd.click(); this.openStickers(); });
    $('hud-speed').addEventListener('click', () => { Snd.click(); this.cycleSpeed(); });
    $('hud-clock').addEventListener('click', () => { Snd.click(); this.openSchedule(); });
    $('back-btn').addEventListener('click', () => { Snd.click(); this.back(); });
    $('cancel-btn').addEventListener('click', () => { Snd.click(); Activity.cancel(); });
    $('panel').addEventListener('click', e => { if (e.target === $('panel')) this.closePanel(); });
    // Keep --vvh on the height actually on screen, so a panel never puts its
    // buttons behind Safari's toolbars.
    const vv = window.visualViewport;
    const fitViewport = () => document.documentElement.style.setProperty('--vvh', `${Math.round(vv?.height || innerHeight)}px`);
    fitViewport();
    vv?.addEventListener('resize', fitViewport);
    addEventListener('orientationchange', () => setTimeout(fitViewport, 250));
    // The rotate hint is only a nudge: a tap puts it away, and it bows out on
    // its own so it never sits over a button for long.
    const hint = $('rotate-hint');
    const dismiss = () => hint.classList.add('gone');
    hint.addEventListener('click', () => { Snd.click(); dismiss(); });
    setTimeout(dismiss, 8000);
    document.querySelector('.sheet-close').addEventListener('click', () => { Snd.click(); this.closePanel(); });
    for (const b of document.querySelectorAll('#dpad button')) {
      const [x, y] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[b.dataset.dir];
      const on = e => { e.preventDefault(); Input.dpad.x = x; Input.dpad.y = y; };
      const off = () => { Input.dpad.x = 0; Input.dpad.y = 0; };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('pointercancel', off);
    }
    const needs = $('hud-needs');
    for (const n of NEEDS.slice(0, 5)) {
      const d = el('div', 'need', `<span class="ni">${n.icon}</span><span class="nb"><i></i></span>`);
      d.dataset.need = n.id;
      d.title = n.name;
      needs.append(d);
    }
  },

  // -------------------------------------------------------------- per scene

  onScene(scene) {
    const playing = scene && scene.id !== 'menu';
    const game = scene?.id?.startsWith('game:');
    $('hud').hidden = !playing;
    $('nav').hidden = !playing || game;
    $('menu').hidden = playing;
    const back = scene?.back;
    $('back-btn').hidden = !playing || !back;
    if (back) $('back-btn').title = typeof back === 'string' ? `Back to ${back === 'map' ? 'the map' : placeName(back)}` : 'Back';
    $('back-btn').textContent = game ? '✋' : back === 'map' ? '🗺️' : '⬅️';
    for (const b of document.querySelectorAll('#nav button')) {
      b.classList.toggle('here', (b.dataset.nav === 'map' && scene?.id === 'map') || (b.dataset.nav === 'home' && locationOf(scene?.id) === 'house'));
    }
    this.renderActbar(scene);
    $('dpad').hidden = !(playing && !game && S.settings.dpad && scene?.walkable);
    this.showCancel(!!Activity.current);
    this.closePopover();
    if (playing && !game) this.updateHud(true);
  },

  back() {
    const s = Game.scene;
    if (!s) return;
    if (s.id.startsWith('game:')) return s.quit ? s.quit() : Activity.cancel();
    if (Activity.current) Activity.cancel();
    const b = s.back;
    if (b === 'map') Game.go('map', { from: locationOf(s.id) });
    else if (b) Game.go(b, { from: s.id });
  },

  nav(kind) {
    this.closeAll();
    switch (kind) {
      case 'map':
        if (Activity.current) Activity.cancel();
        if (Game.id !== 'map') Game.go('map', { from: locationOf(Game.id) });
        break;
      case 'home':
        if (Activity.current) Activity.cancel();
        if (Game.id !== 'house') Travel.to('house', null);
        break;
      case 'wishes': this.openWishes(); break;
      case 'schedule': this.openSchedule(); break;
      case 'status': this.openStatus(); break;
      case 'settings': this.openSettings(); break;
    }
  },

  renderActbar(scene = Game.scene) {
    const bar = $('actbar'), acts = scene?.acts?.filter(id => ACTS[id]);
    if (!acts?.length || scene.id.startsWith('game:')) {
      bar.hidden = true;
      return;
    }
    const wished = new Set(Wishes.list().map(w => w.act.id));
    bar.replaceChildren(...acts.map(id => {
      const a = ACTS[id], b = el('button', `act-btn${wished.has(id) ? ' wish' : ''}`, `<span class="ai">${a.icon}</span><span class="al">${esc(a.name)}</span>`);
      b.title = a.name;
      b.addEventListener('click', () => { Snd.click(); Activity.start(id); });
      return b;
    }));
    bar.hidden = false;
  },

  // ---------------------------------------------------------------- HUD

  tick(dt) {
    this.hudT -= dt;
    if (this.hudT <= 0 && !$('hud').hidden) {
      this.hudT = 0.3;
      this.updateHud();
    }
    if (this.actbarT === undefined || (this.actbarT -= dt) <= 0) {
      this.actbarT = 5;
      if (!$('actbar').hidden) this.renderActbar();
    }
  },

  updateHud(force = false) {
    const mood = Mood.current();
    if (force || mood !== this.lastMood || Math.floor(Game.time * 2) % 6 === 0) {
      this.lastMood = mood;
      drawPortrait($('hud-portrait'), { mood, pose: S.asleep ? 'sleep' : 'idle' });
    }
    $('hud-name').textContent = S.hamster.name;
    $('hud-mood').textContent = MOODS[mood];
    for (const d of document.querySelectorAll('#hud-needs .need')) {
      const v = S.needs[d.dataset.need], bar = d.querySelector('i');
      bar.style.width = `${Math.max(4, v)}%`;
      bar.style.background = Needs.color(v);
      d.classList.toggle('low', v < 30);
      d.title = `${NEED[d.dataset.need].name}: ${Math.round(v)}`;
    }
    $('hud-time').textContent = Clock.label();
    $('hud-day').textContent = Clock.dayName();
    $('hud-weather').textContent = Weather.icon();
    $('hud-weather').title = Weather.name();
    $('hud-star-count').textContent = S.stars;
    $('hud-speed').textContent = Clock.boost ? '⏩' : ['⏸️', '▶️', '⏩'][S.speed];
    $('hud-speed').title = ['Time is paused', 'Normal speed', 'Double speed'][S.speed];
    $('wish-dot').hidden = !Wishes.urgent();
  },

  cycleSpeed() {
    S.speed = (S.speed + 1) % 3;
    this.toast(['⏸️ Time is paused', '▶️ Normal time', '⏩ Time goes twice as fast'][S.speed]);
    Save.mark();
    this.updateHud(true);
  },

  // Screen position of Hammy (for stars flying up from it).
  hammyScreenPos() {
    const p = Game.scene?.hammyPos?.() || { x: W / 2, y: H / 2 };
    return p;
  },

  flyStars(n, from) {
    const start = View.toScreen(from.x, from.y), target = $('hud-stars').getBoundingClientRect();
    const tx = target.left + 24, ty = target.top + target.height / 2;
    for (let i = 0; i < Math.min(n, 6); i++) {
      const s = el('div', '', '⭐');
      Object.assign(s.style, { position: 'fixed', left: '0', top: '0', zIndex: 40, fontSize: '40px', pointerEvents: 'none' });
      document.body.append(s);
      const ox = start.x + rand(-30, 30), oy = start.y + rand(-50, 0);
      const anim = s.animate([
        { transform: `translate(${ox - 20}px, ${oy - 20}px) scale(0.4)`, opacity: 0 },
        { transform: `translate(${ox - 20}px, ${oy - 90}px) scale(1.3)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${tx - 20}px, ${ty - 20}px) scale(0.6)`, opacity: 1 },
      ], { duration: 900 + i * 120, easing: 'ease-in-out' });
      anim.onfinish = () => { s.remove(); this.bumpStars(); Snd.ding(i * 2); };
    }
  },

  bumpStars() {
    const b = $('hud-stars');
    $('hud-star-count').textContent = S.stars;
    b.classList.remove('bump');
    void b.offsetWidth;
    b.classList.add('bump');
  },

  toast(text, ms = 2600) {
    const t = $('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  },

  // The way out of an activity in a location scene. Mini-games keep their own
  // handle in the corner, and this bar would cover the buttons they draw along
  // the bottom, so it stays hidden there.
  showCancel(on) {
    $('cancel-bar').hidden = !on || !!Game.id?.startsWith('game:');
  },

  // ------------------------------------------------------------- popover

  // Big choice buttons near a point on the canvas (design coords).
  popover(x, y, title, items, { sub = '' } = {}) {
    const pop = $('popover'), p = View.toScreen(x, y);
    pop.replaceChildren();
    if (title) pop.append(el('div', 'pop-title', esc(title)));
    if (sub) pop.append(el('div', 'pop-sub', esc(sub)));
    const row = el('div', 'pop-row');
    const wished = new Set(Wishes.list().map(w => w.act.id));
    for (const it of items) {
      const b = el('button', `pop-btn${it.wish || wished.has(it.id) ? ' wish' : ''}`, `<span class="pi">${it.icon}</span>${esc(it.label)}`);
      b.addEventListener('click', e => { e.stopPropagation(); Snd.click(); this.closePopover(); it.onClick(); });
      row.append(b);
    }
    pop.append(row);
    pop.hidden = false;
    const below = p.y < 220;
    pop.classList.toggle('below', below);
    const w = pop.offsetWidth;
    pop.style.left = `${clamp(p.x, w / 2 + 10, innerWidth - w / 2 - 10)}px`;
    pop.style.top = `${below ? p.y + 20 : p.y - 14}px`;
  },

  // Popover listing activities by id.
  actPopover(x, y, title, ids, params = {}, extra = []) {
    this.popover(x, y, title, [
      ...ids.filter(id => ACTS[id]).map(id => ({ id, icon: ACTS[id].icon, label: ACTS[id].name, onClick: () => Activity.start(id, params) })),
      ...extra,
    ]);
  },

  closePopover() { $('popover').hidden = true; },

  closeAll() {
    this.closePopover();
    this.closePanel();
  },

  // -------------------------------------------------------------- panels

  openPanel(kind, build, { onClose = null, pause = false, footTop = false } = {}) {
    const body = document.querySelector('.sheet-body');
    const foot = document.querySelector('.sheet-foot');
    body.replaceChildren();
    foot.replaceChildren();
    build(body, foot);
    foot.hidden = !foot.children.length;
    document.querySelector('.sheet').classList.toggle('foot-top', footTop);
    this.panelKind = kind;
    this.onPanelClose = onClose;
    $('panel').hidden = false;
    document.body.classList.add('panel-open');
    if (pause) Game.paused = true;
    this.closePopover();
  },

  closePanel() {
    if ($('panel').hidden) return;
    $('panel').hidden = true;
    document.body.classList.remove('panel-open');
    Game.paused = false;
    const cb = this.onPanelClose;
    this.onPanelClose = null;
    this.panelKind = null;
    cb?.();
  },

  activityCard(a, { line = null, onGo, done = false, params } = {}) {
    const d = Activity.describe(a), b = el('button', `card-btn${done ? ' done' : ''}`);
    b.innerHTML = `<span class="ci">${a.icon}</span><span class="ct"><b>${esc(a.name)}</b><small>${line ? `“${esc(line)}”` : ''}</small>
      <span class="tags"><span class="tag">📍 ${esc(d.place)}</span><span class="tag">⏱️ ${d.time}</span>${d.tags.map(t => `<span class="tag ${t.up ? 'up' : 'down'}">${t.text}</span>`).join('')}<span class="tag star">⭐ ${d.stars}</span></span></span>
      <span class="go">${done ? 'Again' : 'Go!'}</span>`;
    b.addEventListener('click', () => { Snd.click(); this.closePanel(); onGo ? onGo() : Activity.start(a.id === 'explore' ? a : a.id, params); });
    return b;
  },

  openWishes() {
    this.openPanel('wishes', body => {
      const wishes = Wishes.list();
      body.append(el('h2', '', `💭 What ${esc(S.hamster.name)} wants`));
      body.append(el('p', 'lead', wishes.length ? 'Tap one and we will go there together!' : `${esc(S.hamster.name)} is happy! You can do anything you like.`));
      for (const w of wishes) body.append(this.activityCard(w.act, { line: w.line, params: w.params }));
      const here = Game.scene?.acts?.filter(id => ACTS[id] && !wishes.some(w => w.act.id === id));
      if (here?.length) {
        body.append(el('h3', '', `More to do in the ${esc(placeName(Game.id))}`));
        for (const id of here.slice(0, 6)) body.append(this.activityCard(ACTS[id], { done: S.today.done.includes(id) }));
      }
      if (wishes[0]) Speech.say(wishes[0].line);
    });
  },

  openSchedule() {
    this.openPanel('schedule', body => {
      const cur = Schedule.current();
      body.append(el('h2', '', `📅 ${esc(Clock.dayName())}'s plan`));
      body.append(el('p', 'lead', `It is ${Clock.label()}. This is just a plan — you can do anything at any time! Done today: ${Schedule.doneToday()} / ${SCHEDULE.length}`));
      const tl = el('div', 'timeline');
      for (const e of SCHEDULE) {
        const done = Schedule.doneEntry(e), now = e === cur;
        const b = el('button', `slot${done ? ' done' : ''}${now ? ' now' : ''}${Schedule.isFavorite(e) ? ' fav' : ''}`,
          `<span class="st">${Clock.label(e.at)}</span><span class="si">${e.icon}</span><span class="sn">${esc(e.name)}</span><span class="ss">${done ? '✅' : now ? '👉' : ''}</span>`);
        b.addEventListener('click', () => {
          Snd.click();
          const id = e.acts.find(a => ACTS[a]);
          if (id) {
            this.closePanel();
            Activity.start(id);
          } else this.toast('🌅 Good morning! That happens when Hammy wakes up.');
        });
        tl.append(b);
      }
      body.append(tl);
      requestAnimationFrame(() => tl.querySelector('.now')?.scrollIntoView({ block: 'center' }));
    });
  },

  openStatus() {
    this.openPanel('status', body => {
      const mood = Mood.current(), top = Wishes.top();
      const head = el('div', 'status-top');
      const c = el('canvas');
      c.width = c.height = 280;
      drawPortrait(c, { mood, pose: S.asleep ? 'sleep' : 'idle' });
      const txt = el('div', '', `<div class="say">${esc(S.hamster.name)} is ${MOODS[mood].toLowerCase()}.</div><div class="moodline">${top ? `“${esc(top.line)}”` : '“I feel great! Let’s explore!”'}</div>`);
      head.append(c, txt);
      body.append(head);
      const meters = el('div', 'meters');
      for (const n of NEEDS) {
        const v = Math.round(S.needs[n.id]);
        meters.append(el('div', 'meter', `<span class="mi">${n.icon}</span><span class="mt"><b>${n.name}</b> <small>(${n.kid})</small><div class="mb"><i style="width:${Math.max(4, v)}%;background:${Needs.color(v)}"></i></div></span>`));
      }
      body.append(meters);
      const next = Rewards.nextUnlock();
      body.append(el('h3', '', `⭐ ${S.stars} stars`));
      if (next) {
        const [icon, name] = unlockInfo(next);
        body.append(el('p', 'lead', `Next surprise at ${next.stars} stars: ${icon} ${esc(name)}`));
      }
      const row = el('div', 'chip-row');
      const btn = (label, fn) => { const b = el('button', 'chip', label); b.addEventListener('click', () => { Snd.click(); fn(); }); row.append(b); };
      btn('👕 Wardrobe', () => this.openWardrobe());
      btn('🌟 Stickers & rewards', () => this.openStickers());
      btn('💭 Wishes', () => this.openWishes());
      body.append(row);
      Speech.say(`${S.hamster.name} is ${MOODS[mood]}. ${top ? top.line : ''}`);
    });
  },

  openStickers() {
    this.openPanel('stickers', body => {
      body.append(el('h2', '', `🌟 ${S.stickers.length} of ${STICKERS.length} stickers`));
      body.append(el('p', 'lead', 'Stickers are for trying new things. Tap one to hear how to get it!'));
      const grid = el('div', 'grid-items');
      for (const s of STICKERS) {
        const got = S.stickers.includes(s.id), b = el('button', `item${got ? '' : ' locked'}`, `<span class="ii">${s.icon}</span>${esc(s.name)}`);
        b.title = s.how;
        b.addEventListener('click', () => { Snd.click(); this.toast(`${s.icon} ${s.name}: ${s.how}`); Speech.say(got ? `${s.name}! You got it!` : s.how); });
        grid.append(b);
      }
      body.append(grid);
      body.append(el('h3', '', '🎁 Surprises from stars'));
      const g2 = el('div', 'grid-items');
      for (const u of UNLOCKS) {
        const [icon, name] = unlockInfo(u), got = S.stars >= u.stars;
        g2.append(el('div', `item${got ? '' : ' locked'}`, `<span class="badge">${got ? '' : `⭐${u.stars}`}</span><span class="ii">${icon}</span>${esc(name)}`));
      }
      body.append(g2);
    });
  },

  openWardrobe(onDone = null) {
    const render = body => {
      body.replaceChildren();
      body.append(el('h2', '', '👕 Wardrobe'));
      const preview = el('div', 'status-top');
      const c = el('canvas');
      c.width = c.height = 280;
      drawPortrait(c, { mood: 'happy' });
      c.style.background = 'radial-gradient(#fff,#ffeacc)';
      const big = el('canvas');
      big.width = 240;
      big.height = 300;
      big.style.cssText = 'width:160px;height:200px;';
      const g = big.getContext('2d');
      g.scale(1.6, 1.6);
      drawHamster(g, 75, 178, 150, { mood: 'happy', pose: 'wave' });
      preview.append(big, el('div', '', `<div class="say">Looking great, ${esc(S.hamster.name)}!</div><div class="moodline">Collect stars to unlock more clothes.</div>`));
      body.append(preview);
      for (const [kind, table, title] of [['hat', HATS, '🎩 Hats'], ['top', TOPS, '👕 Clothes']]) {
        body.append(el('h3', '', title));
        const grid = el('div', 'grid-items');
        for (const [id, info] of Object.entries(table)) {
          const open = Rewards.unlocked(kind, id), on = S.outfit[kind] === id;
          const need = UNLOCKS.find(u => u.kind === kind && u.id === id);
          const b = el('button', `item${open ? '' : ' locked'}${on ? ' on' : ''}`, `<span class="badge">${open ? '' : `⭐${need?.stars ?? '?'}`}</span><span class="ii">${info.icon}</span>${esc(info.name)}`);
          b.addEventListener('click', () => {
            if (!open) {
              Snd.hmm();
              this.toast(`⭐ Collect ${need?.stars} stars to unlock the ${info.name}!`);
              return;
            }
            Snd.pop();
            S.outfit[kind] = id;
            Save.mark();
            render(body);
          });
          grid.append(b);
        }
        body.append(grid);
      }
      const row = el('div', 'confirm');
      const done = el('button', 'menu-btn primary', '✅ Done');
      done.addEventListener('click', () => { Snd.click(); this.closePanel(); });
      row.append(done);
      body.append(row);
    };
    this.openPanel('wardrobe', render, { onClose: onDone });
  },

  openSettings() {
    this.openPanel('settings', body => {
      const st = S.settings;
      body.append(el('h2', '', '⚙️ Settings'));
      const toggle = (label, key, after) => {
        const row = el('div', 'toggle-row', `<span>${label}</span>`);
        const b = el('button', `chip${st[key] ? ' on' : ''}`, st[key] ? 'On' : 'Off');
        b.addEventListener('click', () => {
          st[key] = !st[key];
          b.textContent = st[key] ? 'On' : 'Off';
          b.classList.toggle('on', st[key]);
          Snd.click();
          after?.();
          Save.mark();
        });
        row.append(b);
        body.append(row);
      };
      toggle('🎵 Music', 'music', () => Snd.applySettings());
      toggle('🔔 Sounds', 'sfx', () => Snd.applySettings());
      toggle('🗣️ Talking (narration)', 'narration', () => { if (!st.narration) Speech.stop(); else Speech.say('Hi! I will talk to you.'); });
      // Voice: cute or normal, which device voice, and a button to hear it.
      const sample = () => Speech.say(`Hi! I'm ${S.hamster.name}! Let's play together!`, { force: true, browser: true });
      body.append(el('p', 'lead', 'Character voices are computer-generated. Missing lines and custom names use your device voice.'));
      const style = el('div', 'toggle-row', '<span>🐹 Device voice</span>');
      const srow2 = el('div', 'chip-row');
      for (const [id, label] of [['cute', '🐹 Cute'], ['normal', '🙂 Normal']]) {
        const b = el('button', `chip${(st.voiceStyle || 'cute') === id ? ' on' : ''}`, label);
        b.addEventListener('click', () => {
          st.voiceStyle = id;
          srow2.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
          Save.mark();
          sample();
        });
        srow2.append(b);
      }
      const tryBtn = el('button', 'chip', '🔊 Try');
      tryBtn.addEventListener('click', sample);
      srow2.append(tryBtn);
      style.append(srow2);
      body.append(style);
      const voices = Speech.list();
      if (voices.length) {
        const row = el('div', 'toggle-row', '<span>🎙️ Which voice</span>');
        const sel = el('select', 'voice-select');
        sel.append(new Option('✨ Cutest available', ''));
        for (const v of voices) sel.append(new Option(`${Speech.isChild(v) ? '🧒 ' : ''}${v.name.replace(/^Microsoft |\s*\(.*$|\s*-\s*English.*$/g, '')}`, v.voiceURI));
        sel.value = voices.some(v => v.voiceURI === st.voice) ? st.voice : '';
        sel.addEventListener('change', () => { st.voice = sel.value; Save.mark(); sample(); });
        row.append(sel);
        body.append(row);
        if (!voices.some(v => Speech.isChild(v))) body.append(el('p', 'lead', 'Tip: Microsoft Edge has a real child\'s voice (Ana) that sounds the cutest.'));
      }
      toggle('🕹️ On-screen arrows', 'dpad', () => UI.onScene(Game.scene));
      // Which game controller to play with, when more than one is plugged in.
      const pads = Input.padList();
      const padRow = el('div', 'toggle-row', '<span>🎮 Controller</span>');
      const prow = el('div', 'chip-row');
      const padChip = (val, label) => {
        const b = el('button', `chip${String(st.pad ?? 'auto') === String(val) ? ' on' : ''}`, label);
        b.addEventListener('click', () => {
          st.pad = val;
          Snd.click();
          prow.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
          Save.mark();
        });
        prow.append(b);
      };
      padChip('auto', '✨ Any');
      for (const g of pads) padChip(g.index, padName(g));
      padChip('off', '🚫 Off');
      padRow.append(prow);
      body.append(padRow);
      body.append(el('p', 'lead', pads.length
        ? 'Left stick or d-pad walks, A does things, B goes back. The right stick aims a pointer for the games.'
        : 'Plug in an Xbox controller (or any game pad) and press a button — it shows up here.'));
      const vol = el('div', 'toggle-row', '<span>🔊 Volume</span>');
      const vrow = el('div', 'chip-row');
      for (const [v, label] of [[0.35, 'Quiet'], [0.65, 'Medium'], [1, 'Loud']]) {
        const b = el('button', `chip${Math.abs(st.volume - v) < 0.1 ? ' on' : ''}`, label);
        b.addEventListener('click', () => {
          st.volume = v;
          Snd.applySettings();
          Snd.ding(4);
          vrow.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
          Save.mark();
        });
        vrow.append(b);
      }
      vol.append(vrow);
      body.append(vol);
      const sp = el('div', 'toggle-row', '<span>⏱️ Time speed</span>');
      const srow = el('div', 'chip-row');
      ['⏸️ Pause', '▶️ Normal', '⏩ 2x'].forEach((label, i) => {
        const b = el('button', `chip${S.speed === i ? ' on' : ''}`, label);
        b.addEventListener('click', () => {
          S.speed = i;
          Snd.click();
          srow.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
          this.updateHud(true);
          Save.mark();
        });
        srow.append(b);
      });
      sp.append(srow);
      body.append(sp);
      const row = el('div', 'confirm');
      const menu = el('button', 'chip', '🏠 Main menu');
      menu.addEventListener('click', () => { Snd.click(); Save.write(); this.closePanel(); Activity.cancel(); Game.go('menu'); });
      const reset = el('button', 'chip danger', '🗑️ Start over…');
      reset.addEventListener('click', () => { Snd.click(); this.confirmReset(); });
      row.append(menu, reset);
      body.append(row);
      body.append(el('p', 'lead', 'Your game saves by itself in this browser.'));
    });
  },

  // Two taps to erase, so nothing is lost by accident.
  confirmReset() {
    this.openPanel('confirm', body => {
      body.append(el('h2', '', '🗑️ Start a brand new game?'));
      body.append(el('p', 'lead', `This forgets ${esc(S.hamster.name)}'s stars, stickers, garden and everything else. A grown-up should decide!`));
      const row = el('div', 'confirm');
      const no = el('button', 'menu-btn primary', '↩️ No, keep playing');
      no.addEventListener('click', () => { Snd.click(); this.closePanel(); });
      const yes = el('button', 'menu-btn', '🗑️ Yes, start over');
      yes.addEventListener('click', () => {
        Snd.click();
        this.closePanel();
        Activity.cancel();
        Save.reset();
        this.toast('A fresh start! 🌱');
        Game.go('menu');
      });
      row.append(no, yes);
      body.append(row);
    });
  },

  openPause() {
    this.openPanel('pause', body => {
      body.append(el('h2', '', '⏸️ Paused'));
      body.append(el('p', 'lead', `${esc(S.hamster.name)} is waiting for you.`));
      const row = el('div', 'confirm');
      const go = el('button', 'menu-btn primary big', '▶️ Keep playing');
      go.addEventListener('click', () => { Snd.click(); this.closePanel(); });
      const set = el('button', 'menu-btn', '⚙️ Settings');
      set.addEventListener('click', () => { Snd.click(); this.openSettings(); });
      row.append(go, set);
      body.append(row);
    }, { pause: true });
  },

  // A friend's card in the village: who they are and what to do together.
  openFriend(f) {
    this.openPanel('friend', body => {
      const head = el('div', 'status-top');
      const c = el('canvas');
      c.width = c.height = 280;
      drawPortrait(c, { kind: f.id, mood: 'happy' });
      const hearts = S.friends.hearts[f.id] || 0, bday = Friends.birthday() === f;
      head.append(c, el('div', '', `<div class="say">${esc(f.name)} ${bday ? '🎂' : ''}</div><div class="moodline">${esc(f.personality)}</div><div class="moodline">❤️ Loves: ${esc(f.favorite)} · Friendship: ${'💗'.repeat(Math.min(5, hearts)) || '🤍'}</div>`));
      body.append(head);
      const acts = [
        ['play_friend', `Play ${f.favorite.toLowerCase()}`],
        ['share_food', 'Share a snack'],
        ['dance_party', 'Dance party'],
        [bday ? 'birthday' : null, `${f.name}'s birthday party!`],
        [S.friends.invited === f.id ? null : 'invite', `Invite ${f.name} to play at the resort`],
      ];
      for (const [id, label] of acts) {
        if (!id) continue;
        body.append(this.activityCard({ ...ACTS[id], name: label }, { onGo: () => Activity.start(id, { friend: f.id }) }));
      }
      if (S.friends.invited === f.id) {
        const b = el('button', 'chip', `👋 ${esc(f.name)} goes home`);
        b.addEventListener('click', () => { Snd.click(); S.friends.invited = null; Save.mark(); this.closePanel(); this.toast(`👋 Bye bye, ${f.name}! See you soon!`); });
        body.append(b);
      }
      if (!bday) body.append(el('p', 'lead', `🎂 ${esc(f.name)}'s birthday is on ${Clock.dayName(FRIENDS.indexOf(f))}.`));
      Speech.say(`Hi ${S.hamster.name}! It's me, ${f.name}!`, { who: 'friend' });
    });
  },

  // ---------------------------------------------------------- reward card

  showReward({ act, stars, text }) {
    const r = $('reward'), extras = this.takeRewards();
    const line = text || pick(['Great job!', 'Hooray!', 'Well done!', 'You did it!', 'Yay!', 'Amazing!']);
    r.innerHTML = `<div class="rw-big">${act.icon}</div><div class="rw-title">${esc(line)}</div>
      <div class="rw-text">${esc(act.name)}</div><div class="rw-stars">${'⭐'.repeat(Math.min(stars, 6))}</div>
      <div class="rw-text">You earned ${stars} star${stars === 1 ? '' : 's'}!</div>
      ${extras.length ? `<div class="rw-extra">${extras.map(x => `<span>${x}</span>`).join('')}</div>` : ''}
      <button id="reward-ok">Yay! 🎉</button>`;
    r.hidden = false;
    this.rewardOpen = true;
    Snd.fanfare();
    FX.confetti(70);
    // Separate pieces, so each can be a recorded voice clip.
    Speech.say(line);
    Speech.say(`You earned ${Math.min(stars, 6)} star${stars === 1 ? '' : 's'}!`, { interrupt: false });
    if (extras.length) Speech.say('And a surprise!', { interrupt: false });
    $('reward-ok').addEventListener('click', () => this.closeReward());
    clearTimeout(this.rewardTimer);
    this.rewardTimer = setTimeout(() => this.closeReward(), 9000);
  },

  closeReward() {
    if (!this.rewardOpen) return;
    Snd.click();
    $('reward').hidden = true;
    this.rewardOpen = false;
    clearTimeout(this.rewardTimer);
  },

  takeRewards() {
    const out = Rewards.pending.map(p => {
      if (p.kind === 'sticker') return `${STICKER[p.id].icon} New sticker: ${STICKER[p.id].name}`;
      const [icon, name] = unlockInfo(p);
      return `${icon} Unlocked: ${name}`;
    });
    Rewards.pending = [];
    return out;
  },

  // Rewards earned without a card (e.g. exploring) show as toasts.
  flushRewards() {
    const items = this.takeRewards();
    if (items.length) {
      this.toast(items.join(' · '), 4000);
      Snd.fanfare();
    }
  },

  // ------------------------------------------------------- controllers

  // The HTML layer a controller should be steering. Menus, panels and reward
  // cards are not on the canvas, so the stick moves between their buttons.
  padLayer() {
    if (!$('popover').hidden) return $('popover');
    if (!$('reward').hidden) return $('reward');
    if (!$('panel').hidden) return $('panel').querySelector('.sheet-body') || $('panel');
    if (!$('menu').hidden) return $('menu');
    return null;
  },

  padMove(step) {
    const layer = this.padLayer();
    const items = [...(layer?.querySelectorAll('button:not([disabled]), input, select') || [])];
    if (!items.length) return;
    const cur = items.indexOf(document.activeElement);
    const next = items[cur < 0 ? (step > 0 ? 0 : items.length - 1) : (cur + step + items.length) % items.length];
    for (const old of document.querySelectorAll('.pad-focus')) old.classList.remove('pad-focus');
    next.classList.add('pad-focus');
    next.focus();
    Snd.tap();
  },

  padPress() {
    const layer = this.padLayer();
    if (!layer) return;
    const on = layer.contains(document.activeElement) && document.activeElement.classList.contains('pad-focus');
    if (on) document.activeElement.click();
    else this.padMove(1);
  },

  // --------------------------------------------------------- keyboard

  key(e) {
    if (this.rewardOpen && ['Enter', 'Space', 'Escape'].includes(e.code)) {
      this.closeReward();
      return true;
    }
    if (e.code === 'Escape') {
      if (!$('popover').hidden) this.closePopover();
      else if (!$('panel').hidden) this.closePanel();
      else if (Game.id === 'menu') return false;
      else if (Activity.current && Activity.current.phase !== 'game') Activity.cancel();
      else this.openPause();
      return true;
    }
    if (!$('panel').hidden) return true; // panels take the keyboard
    return false;
  },

  // ------------------------------------------------------- main menu

  showMenu() {
    const m = $('menu'), has = Save.exists();
    const title = "Hammy's Happy Resort";
    m.innerHTML = `<div class="menu-inner">
      <h1 class="menu-title">${[...title].map((c, i) => `<span style="animation-delay:${i * 0.06}s">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('')}</h1>
      <p class="menu-sub">Take care of ${has ? esc(S.hamster.name) : 'Hammy'} in a big, happy resort!</p>
      <div class="menu-buttons"></div></div>`;
    const grid = m.querySelector('.menu-buttons');
    const add = (icon, label, cls, fn) => {
      const b = el('button', `menu-btn ${cls}`, `<span class="mi">${icon}</span>${label}`);
      b.addEventListener('click', () => { Snd.unlock(); Snd.click(); fn(); });
      grid.append(b);
      return b;
    };
    if (has) add('▶️', `Continue`, 'primary big', () => App.continueGame());
    add('🌟', has ? 'New game' : 'Play', has ? '' : 'primary big', () => (has ? this.confirmNewGame() : this.openChooser(true)));
    add('🐹', 'My hamster', '', () => this.openChooser(!has));
    add('⚙️', 'Settings', '', () => this.openSettings());
  },

  confirmNewGame() {
    this.openPanel('confirm', (body, foot) => {
      body.append(el('h2', '', '🌟 Start a new game?'));
      body.append(el('p', 'lead', `Your saved game with ${esc(S.hamster.name)} (⭐ ${S.stars}) will be replaced.`));
      const row = el('div', 'confirm');
      const keep = el('button', 'menu-btn primary', '▶️ Continue instead');
      keep.addEventListener('click', () => { Snd.click(); this.closePanel(); App.continueGame(); });
      const fresh = el('button', 'menu-btn', '🌟 New game');
      fresh.addEventListener('click', () => { Snd.click(); this.closePanel(); Save.reset(); this.openChooser(true); });
      row.append(keep, fresh);
      foot.append(row);
    });
  },

  // Pick a name and fur. `starting` begins a new game afterwards.
  openChooser(starting) {
    this.openPanel('chooser', (body, foot) => {
      body.append(el('h2', '', '🐹 Choose your hamster'));
      const wrap = el('div', 'chooser');
      const c = el('canvas');
      c.width = c.height = 440;
      const redraw = () => drawPortrait(c, { mood: 'excited', pose: 'idle' });
      const right = el('div', 'chooser-fields');
      const input = el('input', 'name-input');
      input.value = S.hamster.name;
      input.maxLength = 12;
      input.setAttribute('aria-label', 'Hamster name');
      input.addEventListener('input', () => { S.hamster.name = input.value.trim() || 'Hammy'; });
      const names = el('div', 'chip-row');
      for (const n of ['Hammy', 'Peanut', 'Mochi', 'Biscuit', 'Nibbles']) {
        const b = el('button', 'chip', n);
        b.addEventListener('click', () => { Snd.click(); input.value = n; S.hamster.name = n; });
        names.append(b);
      }
      const furs = el('div', 'chip-row');
      for (const [id, f] of Object.entries(FURS)) {
        const b = el('button', `fur-dot${S.hamster.fur === id ? ' on' : ''}`);
        b.style.background = `radial-gradient(circle at 40% 35%, ${f.light} 0 30%, ${f.main} 31%)`;
        if (f.patch) b.style.background = `radial-gradient(circle at 30% 30%, ${f.patch} 0 22%, ${f.main} 23%)`;
        b.title = f.name;
        b.addEventListener('click', () => {
          Snd.pop();
          S.hamster.fur = id;
          furs.querySelectorAll('.fur-dot').forEach(x => x.classList.toggle('on', x === b));
          redraw();
        });
        furs.append(b);
      }
      right.append(el('b', '', 'Name'), input, names, el('b', '', 'Fur'), furs);
      wrap.append(c, right);
      body.append(wrap);
      redraw();
      const row = el('div', 'confirm');
      const go = el('button', 'menu-btn primary', starting ? "🏝️ Let's go!" : '✅ Done');
      go.addEventListener('click', () => {
        Snd.click();
        this.closePanel();
        if (starting) App.newGame();
        else {
          Save.mark();
          this.showMenu();
        }
      });
      row.append(go);
      foot.append(row);
    }, { footTop: true });
  },
};
