# Hammy's character voices

The game plays local WAV or MP3 recordings when available and uses device speech for
missing lines and custom names. Music lowers during either kind of narration.
Hammy's browser fallback uses a gentle pitch and slower pacing. Mom, Dad and
friends retain distinct voices. Device voice controls in Settings affect the
fallback; recorded voices are selected here before generation.

## Free Windows recordings

The included WAV clips were generated locally with installed Windows voices,
without an API key or network service. Hammy and Mom use Zira with different
pitch and pacing, Dad uses David, and the friend uses Mark. Book pages have
slower pacing, and letter lessons spell isolated letters. These are traditional
computer voices, so they have less expression than modern neural narration.

The game loads `clips/manifest.js` automatically. To regenerate after changing
dialogue, run `./voice/make_voices_free.ps1` in PowerShell. Existing WAVs are
skipped; `-Force` replaces them and `-Limit 5` makes a small batch. No Python,
downloads, account or billing are needed for this option. WAV files are larger
than MP3s but play directly in the browser. If both formats exist, the manifest
prefers MP3. Settings identifies the voices as computer-generated.

## Optional OpenAI recordings

Install Python 3 if `py` is unavailable. Run these commands from the project root:

```powershell
py -m pip install --upgrade openai
# Read securely; the key is only set for this PowerShell session.
$voiceKey = Read-Host 'OpenAI API key' -AsSecureString
$env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new('', $voiceKey).Password
py voice/make_voices.py --dry-run
py voice/make_voices.py --audition
```

Listen to `voice/clips/audition/` and edit `VOICES` and `INSTRUCTIONS` at the top
of `make_voices.py` to choose each character. The directions emphasize warmth,
clear learning words and expressive stories without an exaggerated squeak.
Then try a small batch before recording all lines:

```powershell
py voice/make_voices.py --only hammy --limit 5
py voice/make_voices.py
Remove-Item Env:OPENAI_API_KEY
```

Refresh the game after recording. Clips and their generated `manifest.js` work
offline, including opening `index.html` directly. No key goes into the game.
The Settings panel discloses that character voices are computer-generated.

## Resume and update

Existing nonempty MP3 files are skipped. Interrupt with Ctrl+C and run again to
resume. `--ids hammy-067,mom-022` selects specific lines; `--only dad` selects a
speaker. Add `--force` to replace recordings, including after changing a voice
or its instructions. Partial downloads are never used as finished recordings.
Failed ids are listed at the end and the process returns a nonzero exit code.

After changing game dialogue, run:

```powershell
py voice/extract_lines.py
py voice/make_voices.py --dry-run
py voice/make_voices.py
```

Extraction keeps existing text/speaker ids stable so adding dialogue cannot
silently associate old recordings with different words. The manifest includes
only current lines with existing MP3 files. The extractor is a best-effort scan;
runtime dialogue it cannot resolve is listed in `browser-voice-lines.txt` and
continues using the device voice.

`--dry-run` works without the OpenAI package or a key. Its cost is only a rough
planning allowance based on character count and assumed speaking speed, not a
live quote. Check [OpenAI pricing](https://developers.openai.com/api/docs/pricing).
The script preserves the prompt's `gpt-4o-mini-tts` model; change `MODEL` if
needed for your account. API usage follows the official
[speech guide](https://developers.openai.com/api/docs/guides/text-to-speech).

Playback regression checks: `node --test tests/narration.test.cjs`.
