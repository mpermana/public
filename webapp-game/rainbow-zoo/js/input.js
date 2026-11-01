// Keyboard, mouse/touch and gamepad in one place. App installs `handlers`
// for discrete events; modes poll `Input.dir()` and `Input.pointer`.

const KEY_NAV = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
// Standard gamepad mapping: 0 A, 1 B, 2 X, 3 Y, 4/5 bumpers, 8 back, 9 start, 12-15 d-pad.
const PAD_NAV = { 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

// 'A'..'Z' or '0'..'9' for a physical key, regardless of keyboard layout.
function keyChar(code) {
  const m = /^Key([A-Z])$/.exec(code) || /^(?:Digit|Numpad)(\d)$/.exec(code);
  return m ? m[1] : null;
}

// Readable name from a Gamepad id (Chrome: "Name (STANDARD GAMEPAD ...)", Firefox: "054c-09cc-Name").
function padName(id) {
  if (/054c/i.test(id) && /wireless controller|dualsense|dualshock/i.test(id)) return 'PlayStation Controller';
  return id.replace(/\s*\(.*\)\s*$/, '').replace(/^[0-9a-f]{1,4}-[0-9a-f]{1,4}-/i, '').trim() || 'Controller';
}

const padKey = g => `${g.index}:${g.id}`;

// Face-button labels and colors by physical position (standard mapping: 0 bottom, 1 right, 2 left, 3 top).
const PAD_STYLES = {
  xbox: {
    0: { label: 'A', color: 'green' }, 1: { label: 'B', color: 'red' },
    2: { label: 'X', color: 'blue' }, 3: { label: 'Y', color: 'yellow' },
    4: { label: 'LB', color: 'orange' }, 5: { label: 'RB', color: 'purple' },
  },
  playstation: {
    0: { label: '✕', color: 'blue' }, 1: { label: '○', color: 'red' },
    2: { label: '□', color: 'pink' }, 3: { label: '△', color: 'green' },
    4: { label: 'L1', color: 'orange' }, 5: { label: 'R1', color: 'purple' },
  },
};

function padStyle(id = Input.padId) {
  return /054c|playstation|dualshock|dualsense|wireless controller/i.test(id) ? PAD_STYLES.playstation : PAD_STYLES.xbox;
}

const Input = {
  handlers: {},
  held: new Set(),
  pointer: { x: 0, y: 0, down: false, inside: false, type: 'mouse' },
  pads: [],          // every connected gamepad, refreshed each frame
  pad: null,         // the one that drives the game (see choosePad)
  padId: '',
  padKey: '',
  padButtons: [],
  prevButtons: {},   // pad index -> pressed flags from last frame
  lastUsed: -1,      // index of the pad pressed most recently
  stick: [0, 0],
  stick2: [0, 0],
  stickArmed: [true, true],
  lastDevice: 'mouse', // 'mouse' | 'touch' | 'key' | 'pad', for choosing hint text

  emit(type, arg) { this.handlers[type]?.(arg); },

  init(surface) {
    const usePointer = e => { this.lastDevice = e.pointerType === 'touch' ? 'touch' : 'mouse'; };
    addEventListener('pointermove', usePointer, true);
    addEventListener('pointerdown', usePointer, true);
    addEventListener('keydown', e => {
      // Keep little fingers from scrolling, tabbing or typing into the page.
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !/^F\d+$/.test(e.key)) e.preventDefault();
      this.lastDevice = 'key';
      this.held.add(e.code);
      if (e.repeat) return;
      this.emit('key', e);
      if (KEY_NAV[e.code]) this.emit('nav', KEY_NAV[e.code]);
    });
    addEventListener('keyup', e => this.held.delete(e.code));
    addEventListener('blur', () => this.held.clear());
    addEventListener('contextmenu', e => e.preventDefault());

    const p = this.pointer;
    const track = e => { p.x = e.clientX; p.y = e.clientY; p.type = e.pointerType; };
    surface.addEventListener('pointerdown', e => {
      track(e);
      p.down = true;
      surface.setPointerCapture(e.pointerId);
      this.emit('pointerdown', p);
    });
    surface.addEventListener('pointermove', e => {
      track(e);
      p.inside = true;
      this.emit('pointermove', p);
    });
    const up = e => {
      track(e);
      if (!p.down) return;
      p.down = false;
      this.emit('pointerup', p);
    };
    surface.addEventListener('pointerup', up);
    surface.addEventListener('pointercancel', up);
    surface.addEventListener('pointerleave', () => { p.inside = false; });
  },

  // The chosen controller, or (for "any controller") the one pressed last.
  choosePad() {
    const want = Settings.pad;
    if (want) return this.pads.find(g => g.index === want.index && g.id === want.id) || this.pads.find(g => g.id === want.id) || null;
    return this.pads.find(g => g.index === this.lastUsed) || this.pads[0] || null;
  },

  // Called once per frame: gamepads have no events for buttons, so we diff.
  poll() {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(g => g && g.connected) : [];
    const before = new Set(this.pads.map(padKey)), now = new Set(pads.map(padKey));
    const added = pads.filter(g => !before.has(padKey(g))), removed = this.pads.filter(g => !now.has(padKey(g)));
    for (const g of removed) delete this.prevButtons[g.index];
    this.pads = pads;

    // Diff every pad, not just the active one, so switching never replays old presses.
    const presses = new Map();
    for (const g of pads) {
      const was = this.prevButtons[g.index] || [], is = g.buttons.map(b => b.pressed || b.value > 0.5);
      const fresh = is.flatMap((down, i) => (down && !was[i] ? [i] : []));
      this.prevButtons[g.index] = is;
      if (fresh.length) {
        presses.set(g, fresh);
        this.lastUsed = g.index;
      }
    }
    if (added.length || removed.length) this.emit('padschange', { added, removed });

    const pad = this.choosePad(), key = pad ? padKey(pad) : '';
    if (key !== this.padKey) {
      this.padKey = key;
      this.stickArmed = [true, true];
    }
    this.pad = pad;
    this.padId = pad ? pad.id : '';
    this.padButtons = pad ? this.prevButtons[pad.index] : [];
    if (pad) {
      if (presses.has(pad) || pad.axes.slice(0, 2).some(v => Math.abs(v) > 0.5)) this.lastDevice = 'pad';
      for (const i of presses.get(pad) || []) {
        this.emit('pad', i);
        if (PAD_NAV[i]) this.emit('nav', PAD_NAV[i]);
      }
      const dz = v => (Math.abs(v) < 0.22 ? 0 : v);
      this.stick = [dz(pad.axes[0] || 0), dz(pad.axes[1] || 0)];
      this.stick2 = [dz(pad.axes[2] || 0), dz(pad.axes[3] || 0)];
      // A flick of the stick works like the d-pad (menus, clock).
      this.stick.forEach((v, axis) => {
        if (this.stickArmed[axis] && Math.abs(v) > 0.65) {
          this.stickArmed[axis] = false;
          this.emit('nav', axis ? (v > 0 ? 'down' : 'up') : (v > 0 ? 'right' : 'left'));
        } else if (Math.abs(v) < 0.3) {
          this.stickArmed[axis] = true;
        }
      });
    } else {
      this.stick = [0, 0];
      this.stick2 = [0, 0];
    }
    // Presses from every controller, after the game's own events (the picker uses these).
    for (const [g, list] of presses) for (const i of list) this.emit('rawpad', { pad: g, button: i });
  },

  // Movement direction from arrow keys, d-pad or left stick; length <= 1.
  dir() {
    const key = c => this.held.has(c), btn = i => this.padButtons[i];
    let x = (key('ArrowRight') || btn(15) ? 1 : 0) - (key('ArrowLeft') || btn(14) ? 1 : 0);
    let y = (key('ArrowDown') || btn(13) ? 1 : 0) - (key('ArrowUp') || btn(12) ? 1 : 0);
    if (!x && !y) [x, y] = this.stick;
    const len = Math.hypot(x, y);
    return len > 1 ? [x / len, y / len] : [x, y];
  },
};
