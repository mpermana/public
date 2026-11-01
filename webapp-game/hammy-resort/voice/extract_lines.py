# Collects every line the game speaks, and who says it, into lines.json
# (for recording voice clips). Run again after changing the game's text:
#   python voice/extract_lines.py
import re, json, pathlib, unicodedata

root = pathlib.Path(__file__).resolve().parent.parent / 'js'
src = {p.relative_to(root).as_posix(): p.read_text(encoding='utf-8') for p in root.rglob('*.js')}

SQ = r"'((?:[^'\\\n]|\\.)*)'"
DQ = r'"((?:[^"\\\n]|\\.)*)"'
BQ = r'`((?:[^`\\]|\\.)*)`'
STR = SQ + '|' + DQ + '|' + BQ

lines, dynamic = {}, set()


def spoken(text):
    """The same clean-up Speech.say does: keep letters, numbers, spaces and . , ! ? ' - only."""
    keep = ''.join(c for c in text if unicodedata.category(c)[0] in 'LN' or c.isspace() or c in ".,!?'’-")
    return re.sub(r'\s+', ' ', keep).strip()


def add(text, who='hammy', where=''):
    text = text.replace("\\'", "'").replace('\\"', '"').strip()
    text = text.replace('${S.hamster.name}', 'Hammy')
    if '${' not in text:
        text = spoken(text)
    if len(text) < 1:
        return
    if '${' in text:
        dynamic.add(text)
        return
    lines.setdefault((text, who), where)


def strings(chunk):
    for m in re.finditer(STR, chunk):
        yield next(g for g in m.groups() if g is not None)


for f, s in src.items():
    # Speech.say(...) and this.say(...): the first argument.
    for m in re.finditer(r"(Speech\.say|this\.say)\(", s):
        i = j = m.end()
        depth = 1
        while j < len(s) and depth:
            if s[j] in '([{':
                depth += 1
            elif s[j] in ')]}':
                depth -= 1
            j += 1
        call = s[i:j - 1]
        if m.group(1) == 'this.say' and call.rstrip().endswith(', false'):
            continue  # shown on screen only; spoken by a separate Speech.say
        w = re.search(r"who:\s*'(\w+)'", call)
        whos = [w.group(1)] if w else ['mom', 'dad'] if re.search(r"\{\s*who\s*\}", call) else ['hammy']
        for who in whos:
            if call.startswith('pick(['):
                for t in strings(call[:call.index('])')]):
                    add(t, who, f)
                continue
            mm = re.match(r"\s*(?:" + STR + r")\s*(?:,|$)", call)
            if mm:
                add(next(g for g in mm.groups() if g is not None), who, f)
            elif call.strip():
                dynamic.add(call.strip()[:100])
                # Either/or lines: `cond ? 'Forehand!' : 'Backhand!'`
                for t in strings(call):
                    if '${' not in t and len(t) >= 5 and (' ' in t or t[-1] in '!?.'):
                        add(t, who, f)
    # prompt / say / after fields in definitions.
    for m in re.finditer(r"\b(prompt|say|after):\s*(?:" + STR + ")", s):
        add(next(g for g in m.groups()[1:] if g is not None), 'hammy', f)

st = src['state.js']
a = st.index('const NEED_LINES')
for t in strings(st[a:st.index('};', a)]):
    add(t, 'hammy', 'need lines')

rd = src['games/reading.js']
# Books are read by Hammy, or by Mom / Dad at bedtime and story time.
for reader in ['hammy', 'mom', 'dad']:
    for m in re.finditer(r"\[\s*(?:" + SQ + '|' + DQ + r")\s*,\s*\(c, a\)", rd):
        add(m.group(1) or m.group(2), reader, 'book page')
    for m in re.finditer(r"title:\s*" + SQ, rd):
        add(m.group(1) + '.', reader, 'book title')
for m in re.finditer(r"question:\s*\[\s*" + SQ, rd):
    add(m.group(1), 'hammy', 'book question')

hm = src['games/home.js']
a = hm.index('prompt() {')
for t in strings(hm[a:hm.index('[this.kind]', a)]):
    add(t, 'hammy', 'washing prompts')

od = src['games/outside.js']
for m in re.finditer(r"name: '(\w+)'(?:, icon: '[^']*')?, fact: " + SQ, od):
    add(f"A {m.group(1)}! {m.group(2)}", 'hammy', 'bug facts')
    add(f"New bug! A {m.group(1)}! {m.group(2)}", 'hammy', 'bug facts')

# Words spoken on their own a lot: counting, letters, colors, shapes, foods, places, friends.
nums = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
        'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
for n in nums:
    add(n.capitalize() + '!', 'hammy', 'counting')
lg = src['games/learning.js']
for L, w in re.findall(r"\['([A-Z])', '([^']+)', '[^']+'\]", lg):
    W = w[0].upper() + w[1:]
    for t in [f"This is {L}. {L} is for {w}. Can you find {L}?", f"{L}! You found it!", f"{W}! Which letter does {w} start with?",
              f"{L}! {L} is for {w}.", f"This is big {L}. Can you find little {L.lower()}?", f"Little {L.lower()}!", f"Big {L}, little {L.lower()}!"]:
        add(t, 'hammy', 'letters')
for c in ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']:
    for t in [f"{c}! That's {c}!", f"Can you find the {c} balloon?", f"Can you find the {c} paint pot?"]:
        add(t, 'hammy', 'colors')
for s in ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart']:
    for t in [f"Can you find the {s}?", f"A {s}! Well done!"]:
        add(t, 'hammy', 'shapes')
a = hm.index('FOOD_NAMES')
for food in re.findall(r"'[^']+': '([a-z][a-z ]+)'", hm[a:hm.index('};', a)]):
    add(food + '!', 'hammy', 'food names')
for name in re.findall(r"name: '([^']+)', icon: '[^']+', scene:", src['activities.js']):
    add(f"Let's go to the {name}!", 'hammy', 'places')
    add(f"Let's explore the {name}!", 'hammy', 'places')
for _, n in re.findall(r"id: '(\w+)', name: '(\w+)'", src['characters.js']):
    add(f"Hi Hammy! It's me, {n}!", 'friend', 'friend greetings')
    add(f"Here you go, {n}! Let's share!", 'hammy', 'friends')
    add(f"Yay! {n} is coming to play at the resort!", 'hammy', 'friends')
    add(f"Hooray! Happy birthday, {n}! Now give the present!", 'hammy', 'friends')
for name in re.findall(r"\{ id: '\w+', icon: '[^']+', name: '([^']+)'", src['games/music.js']):
    add(name, 'friend', 'dance moves')
for name in re.findall(r"^\s+\w+: \{ name: '([^']+)', icon: '[^']+' \},", src['activities.js'], re.M):
    add(name, 'hammy', 'room names')
for f in ['scenes/house.js', 'scenes/outdoor.js']:
    for name in re.findall(r"\{ name: '([^']+)', x: \d+", src[f]):
        add(name, 'hammy', 'object names')
# The reward card: a cheer, then the stars.
for t in ['Great job!', 'Hooray!', 'Well done!', 'You did it!', 'Yay!', 'Amazing!', 'And a surprise!', 'You earned 1 star!'] + [f'You earned {n} stars!' for n in range(2, 7)]:
    add(t, 'hammy', 'reward card')
for t in ['Lap 1!', 'Lap 2!', "Mom's turn!", "Dad's turn!"]:
    add(t, 'hammy', 'games')

order = ['hammy', 'mom', 'dad', 'friend']
items = sorted(lines.items(), key=lambda kv: (order.index(kv[0][1]), kv[1], kv[0][0].lower()))
here = pathlib.Path(__file__).parent
# Preserve ids when new dialogue is added so existing recordings stay correct.
previous = json.loads((here / 'lines.json').read_text(encoding='utf-8')) if (here / 'lines.json').exists() else []
known = {(o['text'], o['speaker']): o['id'] for o in previous}
out, cnt = [], {}
for o in previous:
    cnt[o['speaker']] = max(cnt.get(o['speaker'], 0), int(o['id'].rsplit('-', 1)[1]))
# Retired recordings can still be on disk after dialogue is removed.
# Never reuse their ids for new text on a later extraction.
for clip in (here / 'clips').glob('*.mp3'):
    match = re.fullmatch(r'(hammy|mom|dad|friend)-(\d+)', clip.stem)
    if match:
        who, number = match.groups()
        cnt[who] = max(cnt.get(who, 0), int(number))
for (text, who), where in items:
    ident = known.get((text, who))
    if not ident:
        cnt[who] = cnt.get(who, 0) + 1
        ident = f"{who}-{cnt[who]:03d}"
    out.append({'id': ident, 'speaker': who, 'group': where, 'text': text})
(here / 'lines.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
(here / 'browser-voice-lines.txt').write_text('\n'.join(sorted(dynamic)), encoding='utf-8')
print(len(out), cnt, 'dynamic:', len(dynamic), 'chars:', sum(len(o['text']) for o in out))
