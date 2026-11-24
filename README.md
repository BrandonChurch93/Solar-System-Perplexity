# Grand Tour

A three minute flight through the solar system, from the surface of the Sun to beyond Neptune, built as a web scene and delivered as a video.

## Status

The build is in progress. `kit/PROGRESS.md` says where it is.

- App URL: https://grand-tour-film.pplx.app
- Review page, where the rough cut, the preview film, clips and comparison images play: https://grand-tour-film.pplx.app/review.html
- Progress: `kit/PROGRESS.md`
- The 18 approved images: `references/approved/contact-sheet.jpg`

## What is here

| Path | What it is |
| --- | --- |
| `AGENTS.md` | Rules for the Builder |
| `kit/` | The build kit. Start at `kit/00-README.md` |
| `config/showcase.json` | Every number, the stops and the timeline |
| `references/approved/` | The two approved images for each stop |
| `references/drafts/`, `references/style-pass/` | Every image from the reference run, with prompts |
| `ASSETS.md` | The ledger of third-party files |

## The live player

Autopilot and the live page draw the film's time at the display's rate. Every display frame asks for the film frame of the clock as a real number, so a display at 60 or 120 shows pictures between the film's 30.

- When a machine cannot keep up, the player skips ahead on the clock: it shows fewer pictures, each at its true time. It never slows the film. The clock waits only while a set that has not arrived is still loading.
- Before a hold ends, every program the dive, the surface view, the rise and the next travel use is compiled and every texture is on the card. The player loads the next stop's set at the start of the hold (two sets loaded at most, as before) and draws the frames listed in `src/core/warm.json` once behind the picture, one per display frame; for the Sun it does this before the first frame. A slow machine can drop a picture in a hold. It does no such work in a dive, a surface view, a rise or a travel.
- `showcase.counts()` gives the programs, textures and buffers made since the last call. `npm run warm -- --first F --last L` draws a piece the way the player does and exits 1, with the frames and what they made, when a dive, a surface view, a rise or a travel made anything.
- The list is made per piece, one piece per stop from the first frame of its hold (frame 0 for the Sun) to the last frame of its travel: `npm run warm -- --write --reset --first F --last L`, then `--write` again with `--rate 2` and once more with `--player` (both without `--reset`, which empties the piece's part of the list), then the test. Run it after the last take of a stop: a stop that changes its programs makes the list stale and the test fail. One run draws every frame of the piece at the draft tier: on four cores without a graphics card that is 10 to 20 minutes for a piece at the preview format, and the master format has four times the pixels.

## For Brandon

The kickoff prompt, the resume prompts and what to expect are in `kit/10-KICKOFF.md`.

## Credits the post must carry

None so far.
