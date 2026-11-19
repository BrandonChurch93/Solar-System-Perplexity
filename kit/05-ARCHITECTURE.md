# 05 · Architecture

## Stack

- Vite, TypeScript strict, three.js on WebGL2, GSAP for easing.
- Vitest for unit tests.
- A headless browser driver for the harness. Use the one that works with the browser already in this workspace.
- An MP4 muxer library for Export.
- `ffmpeg` and `ffprobe` for films and checks.
- Verify the current stable version of each from its own documentation in Phase 0. Pin the versions and record them in `kit/PROGRESS.md`.

## Folders

```
config/showcase.json     every number, the stops, the timeline
src/
  main.ts
  config.ts              typed import of the config, validated at startup
  core/                  renderer, accumulator, sampler, seeded random, tiers, set loader
  director/              timeline, segments, camera rig, modes, menu
  space/                 sky, the Sun as a light and a glare, dust, asteroid rocks, the ending
  bodies/                shared globe, atmosphere, cloud, ring and moon code
  terrain/               shared relief, flow and cover code
  stops/<id>/            one folder per stop: its set, its camera moves, its motion
  post/                  lens, tone curve, grade, bloom, grain, dither
  capture/               frame interface, Export
  diagnostics/           the views listed in kit/04-LOOK.md
public/assets/
  shared/                the sky and anything used by more than one stop
  <stop>/web/            that stop's textures at the web size
  <stop>/full/           that stop's textures at the full size
  third-party/           every file the Builder neither made nor generated
assets-src/<stop>/       the recipe for every generated asset: RECIPE.md, text only
tools/                   harness scripts
tests/
references/              approved/, drafts/, style-pass/, _real/ as they are now. cache/ is ignored by git
scorecards/              one folder per round, text only
cut/                     SHOTS.md, CUES.md
out/                     stills/, clips/, preview.mp4, roughcut.mp4, committed through the harness. work/ holds every other harness output and is ignored by git
```

## The config

- `src/config.ts` imports `config/showcase.json`, validates it and exports it typed.
- No other file contains a number, a stop id, a segment time or an approved image path that the config holds.
- Startup fails loudly if a key is missing, if the segments do not start at 0, if they have gaps or overlaps, if any segment boundary is not on a whole frame, if the last segment does not end at `film.durationSeconds`, or if a stop's approved image is missing.

## Determinism

A frame is a pure function of its frame index, the format, the tier, the asset set and the config.

- No `Math.random`, `Date.now` or `performance.now` in anything that affects a pixel.
- All randomness comes from one seeded generator built from `seed`, with a named stream per system.
- Time is the frame index divided by `film.fps`.
- Animation is a closed-form function of time, or a fixed-step simulation that always starts from the first frame of its segment. A simulation may cache checkpoints. The cache never changes the result.
- Rendering frame N after frame M gives the same image as rendering frame N on a fresh page load.
- A frame never depends on what happens to have loaded. See "Sets".

## Sets

The whole film does not fit in memory at once, least of all in software rendering.

- A set is everything one stop needs: globe maps, moons, rings, detail patches, relief layers.
- The timeline knows which sets each frame needs. A `travel` frame needs two. Every other frame needs one. The ending needs Neptune's set and the shared assets.
- At most `sets.maxLoaded` sets are in memory. The loader frees a set before it loads a third.
- `capture` and `export`: a frame is rendered only after every asset it needs is in memory. The call resolves when the frame is done, however long loading took.
- `autopilot`: the next set is loaded during the current stop. If it is not ready when its first frame is due, the timeline waits on the last complete frame. It never shows a missing asset.
- `live`: jumping to a stop shows a plain loading state in the interface, outside the canvas.

## The frame interface

The page exposes one object on `window`:

```ts
interface Showcase {
  ready: Promise<void>
  info(): { frameCount: number; fps: number; format: string; tier: string; assets: string; buildHash: string; versions: Record<string, string> }
  setFormat(id: string): Promise<void>
  setAssets(id: string): Promise<void>
  setDiagnostic(view: string): void
  renderFrame(frameIndex: number, tier: string): Promise<void>
}
```

- `renderFrame` loads what the frame needs, renders every sample of the tier, and leaves the finished frame on the canvas.
- `frameCount` is `film.fps` times `film.durationSeconds`. The film is frame indices 0 to `frameCount - 1`.
- If one frame at the `final` tier does not fit in `sandbox.chunkBudgetMinutes` in this workspace, add calls that split a frame's samples across steps, and prove with `npm run determinism` that a split frame is pixel-identical to an unsplit one.

## Modes

Set by URL: `?mode=`, with `format`, `tier`, `assets`, `frame`, `first`, `last`, `stop` and `diag` as optional parameters.

| Mode | What it does |
| --- | --- |
| `live` | Free flight in real time. Orbit the body of the current stop, or look around inside its terrain view within the relief's safe range. A menu on the `M` key jumps to any stop and either view, scrubs the timeline, and switches mode, format, tier, asset set and diagnostic |
| `autopilot` | Plays the film in real time with a clean frame. `stop=<id>` plays only that stop's clip |
| `capture` | Renders nothing until asked through the frame interface. The harness uses this |
| `export` | Renders and encodes the film on this machine. See below |

- `live` is the default. It opens on the Sun.
- No interface pixel ever appears in `capture`, `autopilot` or `export` output.
- `assets` defaults to `web` in `live` and `autopilot`, and to `full` in `capture` and `export`.

## The harness

Scripts in `tools/`, run through npm.

| Command | Output |
| --- | --- |
| `npm run animatic` | The rough cut: `out/roughcut.mp4` in `formats.preview` at `previewFilm.bitrateMbps`, made only from the 18 approved images and the timings in `segments`. See below |
| `npm run still -- --frame N --tier T --format F --assets A --diag V` | One still in `out/work/stills/` |
| `npm run sheet -- --segment ID --tier T --format F` | A contact sheet of `critics.contactSheetFrames` frames across the segment. `--film` gives sheets with one frame per segment for the whole film |
| `npm run seq -- --first N --last M --tier T` | Every frame from N to M as separate stills, for stepping through a cover |
| `npm run crops -- --frame N --tier T --format F` | Native-size crops with a long edge of at most `critics.maxImageLongEdgePx`, covering every surface and every area of interest in the frame |
| `npm run compare -- --stop ID --view hold` or `--view terrain` | A comparison image named `compare-<stop>-<view>.jpg`: the approved image beside the judged frame at the same size, and under them matching native-size crops of each |
| `npm run film -- --tier T --format F --assets A` | Frames 0 to `frameCount - 1` in `out/work/frames/`, then `out/work/film-F-T.mp4`, encoded at `previewFilm.bitrateMbps` in `formats.preview` and at `export.bitrateMbps` in any other format. Takes `--first` and `--last`. Each frame is checked for G5 as it is rendered and the result is stored in the film's record |
| `npm run clip -- --stop ID --tier T` | That stop's clip in `formats.master`, encoded at `clips.bitrateMbps`, as `out/work/clips/<stop>.mp4`. It reuses frames a film render already made when their records match |
| `npm run texels -- --segment ID` | The G13 measure for every frame of a `hold`, `dive`, `terrain` or `rise` |
| `npm run stress` | For each segment in `quality.stress.segments`: `quality.stress.seconds` of film at `formats.master` and the `quality.stress.tier` tier, encoded at `export.bitrateMbps`, then re-encoded at `quality.compressionStressMbps`, with stills from both |
| `npm run pack -- --phase N --round R --stop ID` | The critic packs for a round, as `kit/07-QUALITY-BAR.md` describes |
| `npm run keep` | Copies into `out/` whatever matches the current build: judged stills and comparison images to `out/stills/`, clips to `out/clips/<stop>.mp4`, the `formats.preview` film to `out/preview.mp4`, each with its record |
| `npm run review` | Builds the review page described under "Build output and publishing" |
| `npm run proof` | Drives `?mode=export` at `formats.preview` and the `draft` tier for `export.proofSeconds` seconds of film, saves the download as the file named in `export.files.preview` under `out/work/export/` with its record, and runs `ffprobe` on it. `--memory` runs the memory test instead |
| `npm run determinism` | Renders the same frames on fresh page loads and in a different order, and compares them |
| `npm run gate -- --phase N` | Every automated check that phase needs, with a pass or fail line for each |

Rules:

- The browser runs headless with software WebGL.
- The build hash is a hash of everything under `src/`, `public/` and `config/` plus the package lock file. Commits that touch only logs or scorecards do not change it.
- Every output file has a record beside it: build hash, format, tier, asset set and diagnostic. A command reuses an existing output only when its record matches the current state. Otherwise it renders again.
- Judged stills and comparison images are rendered with the `full` asset set. If the `full` set of a stop cannot be loaded under software rendering, log it, render with the largest size that loads, and say so in the record.
- Any command that can exceed `sandbox.chunkBudgetMinutes` does its work in chunks and can be run again to continue.
- At most `sandbox.maxRenderProcesses` render processes run at once in one VM. Sandbox agents in their own VMs can each render a range of frames in parallel.
- Preview films are rendered at the highest tier whose estimated time, from the render budget, fits in `sandbox.previewFilmMaxHours`. Never below `draft`.
- Every harness output is written under `out/work/`, which git ignores. `out/work/frames/` is emptied once its film is encoded.

## The rough cut

`npm run animatic` exists so Brandon can judge pacing before the scene is built.

- It needs no 3D. It is made from the approved images with `ffmpeg` or a small script.
- It follows `segments` exactly, frame for frame, in `formats.preview`.
- `hold`: the approved hero image with a slow push in.
- `dive`: a fast push into the hero image toward the spot, blurring, that dissolves into the close image.
- `terrain`: the approved close image with a slow push forward.
- `rise`: the reverse of the dive, shorter.
- `travel`: the hero image shrinks away into black space and the next hero image grows from a point.
- The Sun's segments and the ending follow their own order in `segments`.
- A small label in one corner names the current segment id. This is the only place in the project where text appears over the picture, and it exists only in the rough cut.

## Export

`?mode=export` is how the master is made, on a computer with a GPU.

- One page with three choices and a start button: the format (`formats.master` or `formats.uhd`), the range (the whole film, or one stop's clip), and the tier.
- Defaults: `formats.master`, the whole film, the `final` tier, the `full` asset set.
- Renders through the same code path as `renderFrame`.
- The `first` and `last` parameters limit the run to a range of frames. These exist for testing.
- Encodes with WebCodecs to `export.videoCodec` at `export.bitrateMbps`, muxes to `export.container`, and downloads the file named in `export.files`, with `{stop}` replaced by the stop id for a clip.
- Shows frames done, elapsed time and time remaining.
- Yields between frames through a message channel or the encoder's own callbacks. It does not use timers or `requestAnimationFrame`.
- Requests a screen wake lock and carries on if the request is refused.
- If the WebGL context is lost it stops and says so in plain words. It never writes a file with missing frames.
- Memory use is flat across the whole run, with sets freed as the film moves on.
- If the browser cannot encode `export.videoCodec`, or the machine cannot hold a texture of the `full` set, the page says so in plain words before starting.
- `formats.uhd` is offered as it is. Nothing in the kit is gated on it.
- Proof in this workspace, made by `npm run proof`: run Export end to end at `formats.preview` and the `draft` tier for `export.proofSeconds` seconds of film, and confirm the file with `ffprobe`. If this workspace's browser cannot encode `export.videoCodec`, prove the pipeline with a codec it has and log that `export.videoCodec` is unproven here.
- Memory test, made by `npm run proof -- --memory`: run Export at `formats.preview` and the `draft` tier across a `travel` segment and `export.memoryTestSeconds` seconds each side of it, and log memory use at intervals.

## Build output and publishing

- `npm run build` produces a static site in `dist/` with relative URLs. It works from any host at any base path.
- No server code. No runtime network calls except loading its own files.
- Publish `dist/` with the workspace's own app hosting so it opens at a public URL. Earlier builds were published under `pplx.app`.
- Publish both asset sets if the hosting accepts the size. If it does not, publish the `web` set, log it, and write in `README.md` the exact steps to run Export from a local copy with the `full` set.
- If no hosting is available, log that and continue. It is not a blocker.

### The review page

Brandon reviews on a tablet. He needs one link where everything plays.

- `npm run review` writes `dist/review.html` and copies into `dist/review/` whatever exists of: `out/roughcut.mp4`, `out/preview.mp4`, every clip in `out/clips/` and every comparison image in `out/stills/`.
- The page lists them newest first, with each video playable in the page and each image shown at full width. It carries the date and the current phase from `kit/PROGRESS.md`.
- It is plain HTML with no framework. It is not part of the app and not part of the build hash.
- Run it before every publish, so the review page is always at `<url>/review.html`.
- If the hosting does not accept the size, leave out the largest videos, say so on the page, and point to their paths in the repo.

## Tests

- Config validation, including every failure case above.
- Seeded random: same seed, same stream, same values.
- Timeline: every segment boundary maps to the right frame, the judged frame list is computed from `judged.fractions`, and the cover windows sit inside their segments.
- Sets: for every frame, the sets it needs, and that the loader never holds more than `sets.maxLoaded`.
- Sampler: sequences are deterministic and cover the shutter and the pixel.
