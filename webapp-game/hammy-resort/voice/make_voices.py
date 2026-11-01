"""Record Hammy's offline narration. See README.md for PowerShell commands."""
import argparse
import json
import os
from pathlib import Path
import random
import re
import time

HERE = Path(__file__).resolve().parent
MODEL = 'gpt-4o-mini-tts'
VOICES = {'hammy': 'coral', 'mom': 'sage', 'dad': 'ash', 'friend': 'nova'}
CANDIDATES = {
    'hammy': ['coral', 'shimmer', 'nova', 'sage'],
    'mom': ['sage', 'shimmer', 'coral'],
    'dad': ['ash', 'onyx', 'echo'],
    'friend': ['nova', 'fable', 'ballad', 'shimmer'],
}
SAMPLES = {
    'hammy': "Hi! I'm Hammy! Let's play together!",
    'mom': 'Hi sweetie! Shall we read a story?',
    'dad': 'Hello Hammy! Ready to shoot some hoops?',
    'friend': "Hi Hammy! It's me, Pip! Let's play!",
}
COMMON = (
    'Speak exactly the supplied words, with no additions. Clear English for a '
    'five-year-old. Use natural phrasing and short pauses between sentences. '
    'Keep a consistent character voice; no music or sound effects. '
    'Pronounce isolated capital letters as letter names, not sounds. '
)
INSTRUCTIONS = {
    'hammy': COMMON + (
        'A tiny, adorable young cartoon hamster: bright, light, bubbly, warm '
        'and encouraging. A gentle smile, never shrill or squeaky. Speak a '
        'little slowly. Emphasize learning words, colors, numbers and names. '
        'Questions are curious; praise is delighted; sleepy lines are soft '
        'and yawny. Never scary or sarcastic.'),
    'mom': COMMON + (
        'A loving mother hamster: warm, gentle and kind, with a soft smile. '
        'Slow, clear pacing. Stories and bedtime lines are soothing, quieter '
        'and expressive, like reading to a sleepy child.'),
    'dad': COMMON + (
        'A friendly father hamster: a warm, slightly deeper voice, playful '
        'and encouraging with a goofy grin. Relaxed, clear pacing. '
        'Stories are cozy and expressive.'),
    'friend': COMMON + (
        'A young cartoon hamster friend: playful, cheerful and full of energy. '
        'Light, youthful tone, distinct from Hammy; never shrill. Lively '
        'but clear, leaving time for a young child to follow.'),
}


def positive(value):
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError('must be at least 1')
    return number


def load_lines():
    lines = json.loads((HERE / 'lines.json').read_text(encoding='utf-8'))
    seen = set()
    for line in lines:
        ident = line.get('id', '')
        if not re.fullmatch(r'(hammy|mom|dad|friend)-\d+', ident) or ident in seen:
            raise ValueError(f'Invalid or duplicate line id: {ident!r}')
        seen.add(ident)
        if line.get('speaker') not in VOICES or not isinstance(line.get('text'), str) or not line['text'].strip():
            raise ValueError(f'Invalid speaker or text in {ident}')
    return lines


def exists(path):
    return path.is_file() and path.stat().st_size > 0


def manifest(lines):
    clips = HERE / 'clips'
    clips.mkdir(parents=True, exist_ok=True)
    data = {who: {} for who in VOICES}
    for line in lines:
        filename = line['id'] + '.mp3'
        if exists(clips / filename):
            data[line['speaker']][line['text']] = filename
    # Atomic writes avoid a broken manifest if recording is interrupted.
    temp = clips / 'manifest.js.tmp'
    temp.write_text('window.VOICE_CLIPS = ' + json.dumps(data, ensure_ascii=True, indent=2) + ';\n', encoding='utf-8')
    temp.replace(clips / 'manifest.js')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--audition', action='store_true')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--only', choices=VOICES)
    parser.add_argument('--ids', help='Comma-separated line ids')
    parser.add_argument('--limit', type=positive)
    args = parser.parse_args()
    lines = load_lines()
    ids = {ident.strip() for ident in args.ids.split(',')} if args.ids else None
    if args.audition and ids:
        parser.error('--ids cannot be combined with --audition')
    if ids and ids - {line['id'] for line in lines}:
        parser.error('Unknown ids: ' + ', '.join(sorted(ids - {line['id'] for line in lines})))
    jobs = []
    if args.audition:
        for who, voices in CANDIDATES.items():
            if not args.only or who == args.only:
                for voice in voices:
                    jobs.append((f'{who}-{voice}', who, voice, SAMPLES[who], HERE / 'clips' / 'audition' / f'{who}-{voice}.mp3'))
    else:
        for line in lines:
            who, ident = line['speaker'], line['id']
            if (not args.only or who == args.only) and (ids is None or ident in ids):
                jobs.append((ident, who, VOICES[who], line['text'], HERE / 'clips' / f'{ident}.mp3'))
    pending = [job for job in jobs if args.force or not exists(job[4])]
    if args.limit:
        pending = pending[:args.limit]
    chars = sum(len(job[3]) for job in pending)
    print(f'{len(pending)} clips to record; {chars:,} characters. {len(jobs) - len([j for j in jobs if args.force or not exists(j[4])])} existing clips skipped.')
    if args.dry_run:
        # Planning allowance, not a live price quote: ~900 characters/minute,
        # at an illustrative $0.015/minute. Instructions/usage can affect cost.
        print(f'Rough budget: ${chars / 900 * 0.015:.2f} USD (~900 characters/minute, $0.015/minute assumption). Check current API pricing.')
        return 0
    if not pending:
        if not args.audition:
            manifest(lines)
        return 0
    if not os.environ.get('OPENAI_API_KEY'):
        parser.error('Set OPENAI_API_KEY for this PowerShell session first. See voice/README.md.')
    try:
        from openai import OpenAI, APIConnectionError, APIStatusError, RateLimitError
    except ImportError:
        parser.error('Install the SDK first: py -m pip install --upgrade openai')
    client = OpenAI(max_retries=0, timeout=90)
    failures = []
    recorded_chars = 0
    try:
        for number, (ident, who, voice, text, path) in enumerate(pending, 1):
            print(f'{number} / {len(pending)}: {ident} ({voice})', flush=True)
            path.parent.mkdir(parents=True, exist_ok=True)
            temp = path.with_suffix('.mp3.part')
            try:
                for attempt in range(5):
                    try:
                        with client.audio.speech.with_streaming_response.create(
                            model=MODEL, voice=voice, input=text,
                            instructions=INSTRUCTIONS[who], response_format='mp3',
                        ) as response:
                            response.stream_to_file(temp)
                        if not exists(temp):
                            raise OSError('Empty recording')
                        temp.replace(path)
                        recorded_chars += len(text)
                        break
                    except (APIConnectionError, APIStatusError) as error:
                        retryable = isinstance(error, (APIConnectionError, RateLimitError)) or error.status_code >= 500
                        if not retryable or attempt == 4:
                            raise
                        time.sleep(min(2 ** attempt + random.random(), 20))
            except Exception as error:
                # Do not print API exception bodies or credentials.
                print(f'Failed {ident}: {type(error).__name__}')
                failures.append(ident)
            finally:
                temp.unlink(missing_ok=True)
    except KeyboardInterrupt:
        print('\nStopped. Run again to resume.')
        return 130
    finally:
        client.close()
        if not args.audition:
            manifest(lines)
        print(f'Total characters recorded: {recorded_chars:,}')
    if failures:
        print('Failed ids: ' + ', '.join(failures))
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
