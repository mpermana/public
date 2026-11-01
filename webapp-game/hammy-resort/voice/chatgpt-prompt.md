# Voice clips: prompt for ChatGPT

The recording script is now implemented in `make_voices.py` and the game loads
its manifest automatically. See `README.md` in this folder for current setup
and recording commands. The original specification is preserved below.

How to use this:

1. Copy everything in the **Prompt** section below into ChatGPT.
2. ChatGPT writes a script, `make_voices.py`. Save it in this `voice/` folder,
   next to `lines.json`.
3. Run it on your computer with your own OpenAI API key, following the
   commands ChatGPT gives you. Start with `--audition` to hear the voices.
4. The clips go into `voice/clips/` with a `manifest.js` file. Tell Claude
   when they are there, and it will make the game play them.

`lines.json` holds all 704 spoken lines, about 17,000 characters. Re-create it
after changing the game's text with `python voice/extract_lines.py`. Lines
that change while playing, such as custom names or "Mom rolled three", are
listed in `browser-voice-lines.txt`; those keep using the browser voice.

---

## Prompt

I'm making a free, offline browser game for 5-year-olds called **Hammy's
Happy Resort**, about a cute hamster named Hammy. Right now it talks using the
browser's built-in text-to-speech, which sounds robotic. I want to record
every line once with OpenAI's text-to-speech API, save the clips as MP3
files, and ship them with the game.

Please write a single Python 3 script, `make_voices.py`, that I can run on
Windows. Requirements:

**Input**
- Read `lines.json` from the same folder as the script. It is a JSON array
  of about 700 objects like these:
  ```json
  [
    { "id": "hammy-067", "speaker": "hammy", "group": "activities.js", "text": "Let's practice piano!" },
    { "id": "hammy-412", "speaker": "hammy", "group": "letters", "text": "This is B. B is for banana. Can you find B?" },
    { "id": "mom-022", "speaker": "mom", "group": "book page", "text": "The moon and stars say goodnight." },
    { "id": "dad-035", "speaker": "dad", "group": "location.js", "text": "Hi sweetie!" },
    { "id": "friend-009", "speaker": "friend", "group": "friend greetings", "text": "Hi Hammy! It's me, Pip!" }
  ]
  ```
- `speaker` is one of `hammy`, `mom`, `dad` or `friend`. Hammy also does all
  of the narration.

**Recording**
- Use the `openai` Python package with the model `gpt-4o-mini-tts`, MP3
  output, and the voice and `instructions` for each speaker given below.
  Keep both in dictionaries at the top of the script, so I can change them
  easily.
- Read the API key from the `OPENAI_API_KEY` environment variable. Never
  hard-code or print it.
- Say exactly the text in the line: no extra words.

**Output**
- Save each clip as `clips/<id>.mp3` next to the script.
- Skip clips that already exist, so I can stop and resume. Add `--force` to
  redo them.
- Retry with backoff on rate limits and network errors. If a line still
  fails, keep going and list the failed ids at the end.
- When finished, write `clips/manifest.js`, listing only clips that exist,
  in exactly this shape:
  ```js
  window.VOICE_CLIPS = {
    "hammy": { "Let's practice piano!": "hammy-067.mp3", ... },
    "mom": { ... }, "dad": { ... }, "friend": { ... }
  };
  ```
  It must be a `.js` file, not JSON, because the game runs from `file://` and
  loads it with a `<script>` tag. Use the `text` from `lines.json` exactly as
  the keys.

**Options**
- `--dry-run`: print how many lines and characters would be recorded, and a
  rough cost estimate, without calling the API.
- `--audition`: record one sample line for each speaker in each candidate
  voice listed below. Save them as `clips/audition/<speaker>-<voice>.mp3`,
  so I can pick by ear.
- `--only <speaker>`, `--ids id1,id2` and `--limit N`, for trying a few
  lines first.
- Show progress as `n / total`, and the total characters at the end.

**Voices** (candidate voices are for `--audition`)

| speaker | default voice | candidates | sample line |
|---|---|---|---|
| hammy | coral | coral, shimmer, nova, sage | "Hi! I'm Hammy! Let's play together!" |
| mom | sage | sage, shimmer, coral | "Hi sweetie! Shall we read a story?" |
| dad | ash | ash, onyx, echo | "Hello Hammy! Ready to shoot some hoops?" |
| friend | nova | nova, fable, ballad, shimmer | "Hi Hammy! It's me, Pip! Let's play!" |

**Instructions for each speaker** (pass as the `instructions` parameter)

- **hammy:** Voice: a tiny, adorable hamster about five years old: bright,
  light and bubbly, like a cheerful cartoon character for preschoolers. Tone:
  warm, happy and encouraging; you are smiling the whole time. Pacing: slow
  and very clear, with small pauses between sentences, so a five-year-old can
  follow every word. Emphasis: lean on the key word, such as colors, numbers,
  letters and names. Emotion: questions sound curious and hopeful; praise like
  "Great job!" sounds excited and proud; sleepy lines are soft and yawny.
  Never scary, never sarcastic. When a single capital letter appears (A, B,
  C), say the letter's name ("ay", "bee", "see"). Say exactly the words
  given.
- **mom:** Voice: a warm, gentle, loving mother hamster. Tone: calm and kind,
  with a soft smile. Pacing: slow and clear. Story and bedtime lines are
  soothing and a little quieter, like reading to a sleepy child. Say exactly
  the words given.
- **dad:** Voice: a friendly, playful father hamster, a bit deeper and very
  warm. Tone: cheerful, with a goofy grin; proud and encouraging. Pacing:
  relaxed and clear. Story lines are cozy and expressive. Say exactly the
  words given.
- **friend:** Voice: another little hamster friend, about five years old:
  playful, giggly and full of energy, a little different from Hammy. Pacing:
  lively but still clear for young children. Say exactly the words given.

Also:
- Show me the exact PowerShell commands to install the package, set the key
  for this session only, run `--dry-run`, run `--audition`, and then do the
  full run.
- Keep the script in one file, well commented, and easy for a parent to run.
- The clips are AI-generated, so I will say so in the game's settings.
