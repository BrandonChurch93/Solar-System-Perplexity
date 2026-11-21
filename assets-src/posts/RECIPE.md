# Planet post intros

Nine intros for addendum 003. Each shows the stop's prompt being typed into the Perplexity prompt box and submitted. The interface is drawn by a skill of the workspace. Nothing of the interface is drawn by this repo.

## Output files

- `out/work/posts/intro-<stop>.mp4` for sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune.
- `out/work/posts/intro-<stop>.mp4.json`, the record of each.
- `npm run keep -- --posts` copies both to `out/posts/`.

## Tool

- The skill `org:synthetic-query-typing`, loaded with the skill loader of the workspace. It lands in `~/.perplexity/skills/org/synthetic-query-typing`.
- Its composer render is used as it is: `node scripts/render.mjs --q "<query>" --out DIR`, with only the parameters its `references/spec.md` offers. No file of the skill is changed.
- The skill's source and its font are not in this repo and must not be added. The font is for private demos. The skill is named here and its files are identified by hash.
- No model is involved. The skill draws on a canvas in a headless browser. It submits no real query.
- Driver: `assets-src/posts/intro.ts`. Inputs that are not kit numbers: `assets-src/posts/inputs.json`.

Skill files at the time of the render, sha256:

| File | sha256 |
| --- | --- |
| `scripts/composer.mjs` | `7917862714a28a4187ac385bf693ec1619b83208a71175875e69a7d6e05136da` |
| `scripts/composer.html` | `4d55976dffc04cc2917729d7348a053e0341075c7a7f2858413e4e4a702ec245` |
| `scripts/render.mjs` | `70007c2243551f5b4e842fa01c39c85ee709991a51e6277f71e01e1619bdd9ab` |

## Inputs

| Input | Value | Where it comes from |
| --- | --- | --- |
| `--q` | the stop's prompt | `posts.prompts.<stop>` |
| `--preset` | `full` | `inputs.json`. The skill's preset for a first appearance |
| `--cps` | `20` | `inputs.json`. Characters per second |
| `--hold` | `0.55` plus at most one frame | `inputs.json`. The driver adds the fraction of a frame that puts the skill's send instant on a frame |
| `--dpr` | `1.5` | width of `formats.master` over the skill's 1280 logical pixels |
| `--fps` | `30` | `film.fps` |

Everything else is the skill's default: heading, eyebrow, placeholder, effort label, no slash command.

## The nine prompts and the exact inputs

| Stop | `--q` | `--hold` |
| --- | --- | --- |
| sun | `Give me a hyperrealistic Sun using three.js` | 0.5533 |
| mercury | `Give me a hyperrealistic Mercury using three.js` | 0.5533 |
| venus | `Give me a hyperrealistic Venus using three.js` | 0.5533 |
| earth | `Give me a hyperrealistic Earth using three.js` | 0.5533 |
| mars | `Give me a hyperrealistic Mars using three.js` | 0.5699 |
| jupiter | `Give me a hyperrealistic Jupiter using three.js` | 0.5533 |
| saturn | `Give me a hyperrealistic Saturn using three.js` | 0.57 |
| uranus | `Give me a hyperrealistic Uranus using three.js` | 0.57 |
| neptune | `Give me a hyperrealistic Neptune using three.js` | 0.5533 |

## Exact command lines

One time, in the skill's folder: `npm ci --ignore-scripts`.

The driver runs these two skill commands per stop, from the skill's folder. Shown for Mars:

```
node scripts/render.mjs --q "Give me a hyperrealistic Mars using three.js" --out DIR/timing --preset full --cps 20 --hold 0.55 --dpr 1.5 --fps 30 --times 0
node scripts/render.mjs --q "Give me a hyperrealistic Mars using three.js" --out DIR/full --preset full --cps 20 --hold 0.5699 --dpr 1.5 --fps 30 --no-video 1
```

- The first writes one frame and the skill's timeline. The driver reads `timeline.send` from its `manifest.json` and computes the hold of the second: `0.55 + ceil(send * 30) / 30 - send`, cut to four decimals.
- The second writes every frame as PNG with `manifest.json` and `checks.json`. `--no-video 1` leaves out the skill's own encode, because the frames are encoded here with the film's encoder.

What the driver does with the frames:

1. Finds the submit frame: the first frame whose state has `illustrativeSubmit` true. It keeps frames 0 to that frame and drops the skill's tail (the hold after the send and its fade toward the background). That is a trim, not a restyle.
2. Pipes the kept PNG frames into a lossless intermediate and encodes it in two passes with `x264Args` and `rgbToYuvFilter` of `tools/lib/encode.ts`, the same call `tools/film.ts` makes for a clip part, plus `+faststart`. The exact arguments are in each record under `extra.encode`.
3. Writes the record.

## How to make an intro again

```
npx tsx assets-src/posts/intro.ts --stop mars
npx tsx assets-src/posts/intro.ts
npm run post -- --sheets
npm run post -- --check
```

- The first line makes one intro, the second all nine. `--skill-dir DIR` names another folder for the skill.
- It tries a failing intro `posts.introMaxTries` times and exits with code 1 if one still fails.
- If the skill cannot be loaded, do not imitate the interface by hand. The addendum says what to deliver instead.
- An intro is not made again when a clip is remade. Only `npm run post -- --stop ID` runs again.

## Take kept

The first take of each. No take was thrown away. The skill renders by seeking to each frame time, and its own check of that (`seekDeterminism`) passed for all nine.

## Checks each intro passed

- The skill's own `checks.json`: readiness, font loaded, seek determinism, fixed framing, text inside the box, first frame visible, no runtime errors, typing only ever appends, final text exact, hold of the complete prompt.
- By the driver, from the skill's per frame state: the typed text is a prefix of the config string at every frame, no frame adds more than one character, the last frame is the first frame at or after the send and at most 2 ms after it, the full prompt is on screen at least `posts.readHoldSeconds` before the submit, the intro is at most `posts.introMaxSeconds` long.
- On the encoded file: frame count, `formats.master` size, `film.fps`, H.264, yuv420p, no audio stream. The last two frames are decoded and compared with their PNG (about 46 dB, which is the ceiling of 4:2:0 color for this picture; against the same picture in lossless 4:2:0 the encode measures 73 dB).
- `npm run post -- --check` repeats the format, length and hold checks from the files and the records.

## Numbers of the kept takes

| Stop | Frames | Seconds | First key | Last key | Submit | Full prompt held |
| --- | --- | --- | --- | --- | --- | --- |
| sun | 137 | 4.567 | 0.833 | 2.933 | 4.533 | 1.600 |
| mercury | 143 | 4.767 | 0.833 | 3.133 | 4.733 | 1.600 |
| venus | 140 | 4.667 | 0.833 | 3.033 | 4.633 | 1.600 |
| earth | 140 | 4.667 | 0.833 | 3.033 | 4.633 | 1.600 |
| mars | 139 | 4.633 | 0.833 | 3.000 | 4.600 | 1.600 |
| jupiter | 143 | 4.767 | 0.833 | 3.133 | 4.733 | 1.600 |
| saturn | 142 | 4.733 | 0.833 | 3.100 | 4.700 | 1.600 |
| uranus | 142 | 4.733 | 0.833 | 3.100 | 4.700 | 1.600 |
| neptune | 143 | 4.767 | 0.833 | 3.133 | 4.733 | 1.600 |

Times are seconds from the first frame of the intro, which is also the first frame of the post. The cut to the clip is at the intro's length. Each record also lists the time of every key under `extra.keySeconds`.
