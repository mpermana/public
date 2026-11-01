// Boot: load the save, start the loop, show the main menu.
// While developing: ?scene=<id> jumps straight into a scene (e.g.
// ?scene=game:piano or ?scene=pool), ?time=18.5 sets the clock (hours).

const App = {
  init() {
    Save.load();
    View.init(document.getElementById('game'));
    Input.init(View.canvas);
    UI.init();
    Speech.init();
    for (const type of ['pointerdown', 'keydown']) addEventListener(type, () => Snd.unlock(), true);
    // Never lose progress: save whenever the page is hidden or closed.
    addEventListener('visibilitychange', () => { if (document.hidden && S.started) Save.write(); });
    addEventListener('pagehide', () => { if (S.started) Save.write(); });

    const q = new URLSearchParams(location.search);
    if (q.has('time')) S.time.minute = clamp(Number(q.get('time')) * 60, 0, 1439);
    const dev = q.get('scene');
    if (dev && Scenes[dev]) {
      S.started = true;
      Game.go(dev, {}, { instant: true });
    } else Game.go('menu', {}, { instant: true });
    document.getElementById('loading').hidden = true;

    let last = performance.now();
    const frame = now => {
      Game.tick(clamp((now - last) / 1000, 0, 0.05));
      last = now;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },

  newGame() {
    const { hamster, settings } = S;
    Save.reset();
    S.hamster = hamster;
    S.settings = settings;
    S.started = true;
    Weather.roll();
    S.today.done.push('wake');
    Save.write();
    Game.go('room:bedroom');
    setTimeout(() => Speech.say(`Good morning! I'm ${S.hamster.name}! Welcome to my happy resort! My tummy is rumbling. Let's have breakfast!`), 600);
  },

  continueGame() {
    Save.load();
    S.started = true;
    const id = S.scene && Scenes[S.scene] && !S.scene.startsWith('game:') && S.scene !== 'menu' ? S.scene : 'room:bedroom';
    Game.go(id);
    setTimeout(() => Speech.say(`Hi again! ${Wishes.top()?.line || "Let's play!"}`), 600);
  },
};

App.init();
