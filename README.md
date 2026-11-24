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

## Capture the film on your own machine

The machines that build this film have no graphics card, so they draw every frame slowly in software. Your Mac has one. This command opens the film in Chrome on your graphics card, draws every frame at 4K, and joins the frames to one video at 60 frames a second.

What to install, once:

1. Node 22 or newer, from https://nodejs.org
2. Google Chrome
3. ffmpeg, to join the frames to a video: `brew install ffmpeg`. Without it the frames are still saved as PNG files, and the command says so.
4. This repository: `git clone https://github.com/BrandonChurch93/Solar-System-Perplexity.git`, then inside the folder `npm ci`

The one command, inside the folder:

```
npm run capture
```

A Chrome window opens. Leave it open and do not minimise it. The film is written to `out/work/capture/uhd-r2-final/`, with a file `manifest.json` beside it that says how many frames it has, the format, the rate, the tier, the commit and the seconds per frame.

How long it takes: UNKNOWN until you run it. The film is 10800 frames. After the first frame the command prints how long that frame took, what the whole run costs at that pace and how much disk it needs. If that is too long, stop it and tell the Builder the number.

To stop: press Ctrl C once. It finishes the frame it is on and ends.

To go on: run the same command again. It skips every frame and every part that is already whole. Nothing is drawn twice.

Disk: frames are drawn in chunks of 600. When a chunk is whole it is encoded to a part of the video, the part is checked, and the PNG files of that chunk are removed. So the run needs a few GB of free disk at a time, not hundreds.

Options, all of them optional:

| Option | What it does | Default |
| --- | --- | --- |
| `--stop mars` | Only one stop | The whole film |
| `--from 1200 --to 1799` | Only these frames, counted at 60 a second, both counted in | All |
| `--format uhd` | The picture size, a format from `config/showcase.json` | `uhd`, 3840 by 2160 |
| `--rate 2` | Frames drawn for each frame of the 30 a second film | 2, so 60 a second |
| `--tier final` | The quality tier | `final` |
| `--out DIR` | The folder to write to | `out/work/capture/uhd-r2-final` |
| `--chunk 600` | Frames in a chunk; 0 keeps every PNG until the end | 600 |
| `--keep-frames` | Keep the PNG files after their chunk is encoded | Off |
| `--keep-parts` | Keep the parts after they are joined | Off |
| `--no-join` | Stop after the frames and the parts, without the one video | Off |
| `--crf 12` | The quality of the video; smaller is better and larger on disk | 12, near lossless |
| `--browser chrome` | Another browser: `msedge`, or the path of a Chromium browser | `chrome` |
| `--headless` | No window | Off |
| `--allow-software` | Run even when the browser does not use the graphics card | Off |
| `--ignore-limits` | Run even when the graphics card is under what the film needs | Off |

A short try before the long run, the first second of the dive to Mars: `npm run capture -- --from 4800 --to 4859 --out out/work/capture/try`

At the start the command prints what the graphics card can do (its name, the largest texture, render buffer and viewport, the point sizes, the samples) and writes the same into the manifest. If one of them is under what the film needs at 4K it stops and says which. Send that line to the Builder.

If the command says the browser draws without the graphics card: in Chrome open Settings, System, switch on "Use graphics acceleration when available", and start Chrome again.

## Credits the post must carry

None so far.
