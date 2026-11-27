# Grand Tour

A three minute flight through the solar system, from the surface of the Sun to beyond Neptune, built as a web scene and delivered as a video. It has nine stops: the Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune. Every stop has a whole view and a surface view, and the camera flies from one to the next without a cut.

## Status

The build is complete. `kit/PROGRESS.md` is the record: every round, every decision, the final scores and the items that stayed open.

- App URL: https://grand-tour-film.pplx.app
- Watch it live: https://grand-tour-film.pplx.app?mode=autopilot
- Export page: https://grand-tour-film.pplx.app?mode=export
- Review page, which opens on the finished film with its sound and its subtitles and then shows the nine posts, the nine clips and the comparison images: https://grand-tour-film.pplx.app/review.html. The rough cut and the preview film are in the repo as `out/roughcut.mp4` and `out/preview.mp4`. The film, the posts and the clips on that page are 1280 by 720 copies made to fit the host. The full size posts, clips and comparison images are in `out/posts/`, `out/clips/` and `out/stills/`, and the full size film with its sound is handed over with the build because it is larger than one file in this repo may be.
- Progress: `kit/PROGRESS.md`
- The 18 approved images: `references/approved/contact-sheet.jpg`

## How to fly it

Open the app URL. The page starts in free flight at the first stop.

- Drag to look around. Scroll to move in and out.
- Press M, or click the hint in the corner, to open the menu.
- Stop: pick one of the nine stops. The two buttons beside it switch between the whole view and the surface view.
- Timeline: drag the slider to any frame of the film.
- Mode: Live is free flight, Autopilot plays the film on its clock, Export opens the export page.

## How to export the film and a single clip

In the browser, on the graphics card of your own machine:

- The film: open `https://grand-tour-film.pplx.app?mode=export`, choose the format and the tier and start it. The page renders every frame on your machine, encodes it and saves one video file. Keep the tab in front until it finishes.
- A single clip: open `https://grand-tour-film.pplx.app?mode=export&stop=mars`, or choose the stop in the range list of the export page. The stop ids are sun, mercury, venus, earth, mars, jupiter, saturn, uranus and neptune.

From this repository, on a machine with or without a graphics card (without one every frame is drawn in software, which is slow):

- The film: `npm run film -- --format master --tier final`. It draws the film in chunks under `out/work/chunks/` and joins them. A run that was stopped goes on with the chunks it has.
- A single clip: `npm run clip -- --stop mars --tier final`.
- A post, which is a stop's intro joined to its clip: `npm run post -- --stop mars`.

For the film at 3840 by 2160 and 60 frames a second, see "Capture the film on your own machine" below.

## What is here

| Path | What it is |
| --- | --- |
| `AGENTS.md` | Rules for the Builder |
| `kit/` | The build kit. Start at `kit/00-README.md` |
| `kit/PROGRESS.md` | The record of the build, with the final scores and the open items |
| `config/showcase.json` | Every number, the stops and the timeline |
| `src/` | The scene: the engine, the director and one folder for every stop |
| `out/preview.mp4` | The preview film, 960 by 540, without sound |
| `out/roughcut.mp4` | The rough cut of the whole film, without sound |
| `out/clips/` | The nine single stop clips |
| `out/posts/` | The nine posts, each a stop's intro joined to its clip, and the nine intros on their own |
| `out/stills/` | The comparison images: every judged frame beside its approved image |
| `scorecards/` | One folder for every round, with the critics' answers, the measures and a summary |
| `cut/SHOTS.md`, `cut/CUES.md` | The shot list and the cue sheet, with every timing |
| `references/approved/` | The two approved images for each stop |
| `references/drafts/`, `references/style-pass/` | Every image from the reference run, with prompts |
| `ASSETS.md` | The ledger of third-party files |

The films in this repository have no sound. The film with the narration and the music is delivered as a file with the build.

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

1. Node, release 22 or newer, from https://nodejs.org
2. Google Chrome, a current release
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

None. No license of a file in this film asks for a credit line in a post. Every third-party file is in the public domain or under a license that asks for no credit; `ASSETS.md` lists each one with its source and with the credit its source would like to see where credits are given.
