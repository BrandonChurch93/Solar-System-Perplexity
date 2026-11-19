# 07 · The quality bar

## The standard

Every judged frame matches its approved image and reads as a frame from a top-budget film. Every move between them reads as one real flight. The checks below test that from different sides.

Quality here is pursued hard and inside limits. Use every round a limit allows. When a limit is reached, log what is open and move on. `AGENTS.md` explains why.

## Three kinds of automated check

`npm run gate -- --phase N` runs what that phase needs and prints pass or fail for each. The checks come in three kinds, and the kind decides what a red result means.

### Machine checks

They test the code, not the picture. They are cheap and they run on the current build at the start of every round.

| Id | Check |
| --- | --- |
| G1 | `npm run build` exits clean with no type errors |
| G2 | Unit tests pass |
| G3 | `npm run determinism` passes: on one machine, a frame is pixel-identical across fresh page loads and when frames are rendered in a different order |
| G4 | Every still is exactly the size of its format. `info().frameCount` equals `film.fps` times `film.durationSeconds` |
| G6 | No interface element is visible in `capture`, `autopilot` or `export` output |
| G7 | The config passes startup validation, and every frame on the computed judged list is on the judged list in `kit/PROGRESS.md` |
| G10 | Platform fit. `formats.master` is within `platform.maxWidth` and `platform.maxHeight`. `film.fps` is within `platform.maxFps`. `export.bitrateMbps` is within `platform.maxBitrateMbps`. Every clip is at or under `platform.loopsAtOrUnderSeconds` |
| G11 | Every file under `public/assets/third-party/` has a row in `ASSETS.md`. Every generated file under `public/assets/` has a recipe in `assets-src/` |
| G12 | No tracked file is over `repo.maxFileMb` megabytes. The tracked files together are under `repo.maxTreeGb` gigabytes. No secret is tracked. `references/cache/` and `out/work/` are not tracked. Every file listed in `references/approved/MANIFEST.sha256` still has the hash listed there |
| G14 | The app requires no WebGL2 limit or extension outside the set recorded in Phase 0 |
| G15 | Sets. No frame needs more than `sets.maxLoaded` sets. Every asset a finished stop names exists in both asset sets. The estimated texture memory of every finished set, with mipmaps, is at or under `maxSetMemoryMb` for its asset set |

- A red machine check is a bug. Fix it before critics see the round.
- If a machine check is still red after `quality.gateFixMaxAttempts` attempts in one round, log it as a severe open item, end the round and go on. Do not spend the run on it.

### Measures

They put a number on the picture. They run in every round, for the stop that round is about.

| Id | Measure |
| --- | --- |
| G5 | Sanity. In each judged frame of the stop: the frame before lens and grade holds no invalid or infinite value, and the body or relief covers at least `detail.minBodyCoverage` of the frame in every `hold` and `terrain` frame. Frames inside `ending.fade` are exempt |
| G13 | Texture detail. For every frame of the stop's `hold` and `terrain`, and every `dive` and `rise` frame outside the cover window: in the `texels` view, the share of body or relief pixels with fewer than `detail.minTexelsPerPixel` texels per screen pixel is at most `detail.maxSoftPixelFraction`. Not counted: the sky, and any surface drawn by a formula with no texture behind it, such as ring ice near the lens or the Sun's granulation. A stop with no cover counts every frame of its `dive` and `rise`. Measured in `formats.master` |
| G17 | Real sharpness. For the stop's judged `hold` and `terrain` frames: fine detail in the frame, measured as high frequency energy in matching regions, is at least `detail.minSharpnessRatio` of the same measure on the approved image at the same size |

- G13 counts texels, so a texture that was enlarged without gaining detail can pass it. G17 is there to catch that.
- A red measure is not a blocker. It is a severe issue in that round, beside the critics' issues, and it follows the same round limits.

### Deliverable checks

They test files that take long to make. They run only where `kit/08-BUILD-ORDER.md` names them, at the end of a phase.

| Id | Check | Checked at the end of |
| --- | --- | --- |
| G16 | `out/roughcut.mp4` exists with exactly `frameCount` frames at the `formats.preview` size | Phases 1 and 6 |
| G8 | `out/preview.mp4` exists and was rendered from the phase's final build. `ffprobe` reports `film.fps`, exactly `frameCount` frames and the `formats.preview` size. Its record holds the G5 sanity result of every frame, and every frame that failed is logged as an open item. The file is under `repo.maxFileMb` megabytes | Phases 2, 5 and 6 |
| G9 | The Export proof exists from the phase's final build, as `kit/05-ARCHITECTURE.md` defines it, and its frames show no interface element | Phases 2 and 6 |

- In Phase 6 the final build for G8 is the frozen build, or the build after the last fix that changed what the film shows. A later fix that changes no pixel does not make the preview stale. The proof for G9 is quick, so it is always made again after the last fix.
- A deliverable check that is still red after the last pass of the QA gauntlet is listed under "Failed QA items". It does not hold the build open.

## Freshness

- `kit/05-ARCHITECTURE.md` defines two hashes: one for the shared engine and one for each stop.
- In a round, the stills, sheets and measures for the stop being worked on come from the current build.
- When a stop is finished, its judged stills, comparison images and contact sheets are kept with their hashes. They are the stop's evidence. A later change to another stop does not make them stale.
- A later change to the shared engine can change a finished stop. After such a change, render that stop's judged `hold` and `terrain` stills again and look at them beside the kept ones. If they got worse, fix it. Do not re-run the stop's rounds for it.
- Everything is rendered once more from the final build in Phase 6. The record round and the Phase 6 gate use only that.

## Judged frames

- The fixed list the critics score. It is computed, not chosen.
- The list: frame 0, the frame at `film.hookSeconds`, and one frame for every segment whose kind has an entry in `judged.fractions`.
- A segment's judged frame is its first frame plus the whole part of its fraction times its length in frames.
- The list lives in `kit/PROGRESS.md` with the segment and stop of each frame.
- A stop's judged frames are the ones inside its `hold`, `dive`, `terrain` and `rise` segments. Judged frames inside `travel` segments and the ending are scored in Phase 5, when those segments are finished.
- Judged stills are rendered at the `final` tier in `formats.master`.
- Frames can be added to the list. A frame is never removed. If a segment is retimed, add its new computed frame and keep the old one.

## Packs

`npm run pack` builds what each critic receives.

- No image has a long edge over `critics.maxImageLongEdgePx`. A full frame is resized to fit. Fine detail is shown in native-size crops.
- A pack is never more than `critics.maxFilesPerMessage` files. Crops are tiled into labeled grids. A run of consecutive frames is one sheet. If a critic's material still does not fit, split it across two fresh critics with the same rubric and merge their answers.
- Same file format for every image. All metadata is stripped.
- Neutral file names, as `AGENTS.md` requires.
- Pack images are written under `out/work/`.
- A critic receives its files as attachments only. Never give a critic a path into the repo or the workspace.
- A key maps each neutral name to what it is. It is written outside every folder a critic can reach, and copied into the round folder only after every answer for the round is in.

## The critics

- Every critic is a fresh agent in every round.
- Each critic receives its pack, its own section of this file word for word, and the return format below. Nothing else.
- R2 jurors and R8 jurors receive only what their sections say.
- Spread the critics and jurors across different model families. Rotate which family holds which role from round to round. If fewer families can see images than a role asks for, use every family there is, fill the rest with fresh agents on the same families, and log it.
- R1 and R3 to R7 each return one JSON object. The Builder writes the R2 and R8 scorecards from the jurors' answers.

```json
{
  "critic": "R3",
  "score": 7,
  "pass": false,
  "issues": [
    { "severity": "major", "file": "set-C-04.png", "where": "upper right limb", "what": "the glow stops in a hard line", "fix": "widen and soften the falloff of the atmosphere" }
  ]
}
```

- `score` is 1 to 10. `severity` is `severe`, `major` or `minor`. Issues are listed most severe first.

### R1 · Match

You are comparing pairs of images. In each pair, the file whose name ends in `-a` is the target. The file whose name ends in `-b` has to match it.

- Pack: for each judged `hold` and `terrain` frame of the stop, the approved image as `-a` and the frame as `-b`, at the same size, plus a grid of matching native-size crops of each.
- Compare region by region: composition and framing, where each feature sits, color and grade, contrast and depth of blacks, amount of fine detail, direction and quality of light, glow at the limb, moons and rings, the sky.
- Small differences in exact cloud or crater shapes are fine. A viewer shown both should call them the same shot from the same film.
- List every region where `-b` falls short of `-a` as an issue. Say what is different and which way to move it.
- Score 10 when the pair is the same shot and `-b` has lost nothing.

### R2 · Film jury

One image per call, so no juror can compare images with each other.

- Judged images: the stop's judged `hold` and `terrain` frames. In the whole film rounds, every judged `hold`, `terrain`, `travel` and `lookback` frame.
- Controls: the approved hero and close image of the same stops, resized, cropped and encoded exactly like the judged images.
- Each image goes to `quality.jury.jurors` jurors.
- A control's votes are collected once per stop and reused in later rounds of that stop. The whole film rounds collect them once more.
- Each call is a fresh agent that receives one image and exactly this text, nothing else:

> You will see one image. Which of these is it most likely to be? (a) a frame from a top-budget film or AAA game cinematic, (b) a stock image, (c) a science textbook picture, (d) amateur generated art, (e) a real-time web 3D demo. Answer with one letter, a confidence from 0 to 100, and the one thing that most influenced your answer.

Scoring:

- The control share is the share of all votes on the controls that were (a). The judged share is the same for the judged images.
- R2 passes when the judged share is no lower than the control share minus `quality.jury.maxShareGap`.
- The film is being held to the approved images, not to an absolute. If the jurors are hard on the controls, they will be as hard on the frames.
- What a juror wrote about a judged image is input for the next round. A failed R2 counts as one major issue.

### R3 · Surface and detail

You are told the images are computer generated.

- Pack: the stop's judged frames, and grids of native-size crops of every surface in them: globe, limb, terminator, clouds, rings, moons, the near, middle and far parts of the terrain view, the sky.
- Look for: soft or blurry areas, visible pixels, seams, pinching or swirling at a pole, stretched texture, repeated patterns, borders between tiles, banding in gradients, halos or doubled edges round a layer, edges of a patch, a plastic or airbrushed surface, flat light, jagged or shimmering edges, stars that are blobs.
- Look for anything that should not be there: text, a logo, a border, a stray object.
- Score 10 when every crop holds up at native size and nothing gives away how it was made.

### R4 · Motion

You are told the images are computer generated.

- Pack: a contact sheet for each of the stop's `hold`, `dive`, `terrain` and `rise` segments, and one sheet of consecutive frames across each cover. In the whole film rounds: a contact sheet for every `travel` segment and each segment of the ending. Sheets are rendered at the `review` tier or higher.
- Camera: it has mass. Starts and stops are eased. No jump in position, direction, speed or field of view.
- Covers: the frames before and after belong to one move. Nothing pops. Color, exposure and horizon carry across.
- Fast motion is a smooth blur. It never breaks into separate ghost copies of an edge.
- Terrain views: the near ground and the horizon move against each other, so the view has depth. Nothing stretches, tears, slides or swims. No edge of the picture comes into frame.
- Life: turning globes, drifting clouds, moons, flow in the terrain view. Each moves at a believable speed, with no pop, snap or visible repeat.
- Stability: no flicker, crawling noise or shimmer in fine lines. Stars hold still when the camera does.
- Score 10 when the stop reads as one unbroken flight to a real place and back.

### R4 blockout · Motion, Phase 2 only

You are told the images are an unfinished blockout with stand-in pictures.

- Pack: the whole film contact sheets made by `npm run sheet -- --film`, and one contact sheet for each of four segments: `sun.terrain`, `mars.dive`, `mars.travel` and `ending.lookback`.
- Judge only the camera, the framing at each `hold` and `terrain`, the pacing and the variety from stop to stop.
- Score 10 when the camera work could be finished as it is.

### R5 · The whole film

You are told nothing about how the images were made.

- Pack: the whole film contact sheets, and grids of the judged `hold` frames in order.
- Does it read as one film: one grade, one lens, one sky?
- Does the Sun shrink from stop to stop and the light stay consistent with it?
- Is there variety in the camera moves, or does every stop feel the same?
- Does it build, and does the ending land?
- Score 10 when nothing breaks the feeling of one continuous journey.

### R6 · Scroll stop

You are told nothing about how the images were made.

- Pack: frame 0 and frames across the first `film.hookSeconds` seconds, each resized to `critics.phonePreviewWidthPx` wide.
- Would this stop someone scrolling a feed with the sound off?
- Is the subject readable at this size in the first frame?
- Does something change inside the first `film.hookSeconds` seconds that rewards staying?
- Score 10 when the opening is striking at phone size with no sound and no caption.

### R7 · Compression

You are told the images are computer generated.

- Pack: stills taken from the stress encode beside the same frames before encoding, with grids of native-size crops.
- The stress encode is made by `npm run stress`, as `kit/05-ARCHITECTURE.md` describes.
- Look for banding in dark gradients, blocks in glow and haze, stars that vanish, and surfaces that turn to mush.
- Losing some of the finest grain is expected at this bitrate and is not an issue.
- Score 10 when the encoded frames show no banding or blocking and the surfaces still read as detailed.

### R8 · Recognition

One image per call.

- Judged images: the stop's judged `hold` frame, and as its control the stop's approved hero image, prepared the same way.
- Each image goes to `quality.recognition.jurors` jurors.
- Each call is a fresh agent that receives one image and exactly this text, nothing else:

> You will see one image. Name the body in space that it shows, in one or two words.

- R8 passes when the judged frame is named correctly by at least as many jurors as its control.

## The pass bar

For a stop, all of these hold at once:

1. The machine checks are green.
2. The measures G5, G13 and G17 are green for the stop.
3. R1, R3 and R4 each score at least `quality.passScore`, with no severe or major issue open.
4. R2 passes.
5. R8 passes.

For the whole film, in Phase 5:

1. The machine checks are green.
2. R5, R6 and R7 each score at least `quality.passScore`, with no severe or major issue open.
3. R2 passes on its whole film list.
4. R3 and R4, run on the `travel` segments and the ending, each score at least `quality.passScore` with no severe or major issue open.

## Rounds and their limits

- One round: build, machine checks, measures, pack, critics, read every issue, fix, log, commit, push.
- A round is counted when it starts. Write its number into `kit/PROGRESS.md` before doing anything else in it.
- Each round writes `scorecards/round-NNN/`: the pack manifest, the key, the measures, each critic's JSON, the jurors' answers, and `SUMMARY.md` with the scores, the top issues and what changes next. Text files only.
- `kit/PROGRESS.md` gets one line per round.
- Fix causes, not symptoms. If a critic names an artifact, find what produces it.
- Never tune the picture to please one critic at the cost of another.

| What | Limit | Key |
| --- | --- | --- |
| Blockout rounds in Phase 2 | per film | `quality.blockoutMaxRounds` |
| Rounds on the look lock stop in Phase 3 | per stop | `quality.lookLockMaxRounds` |
| Rounds on every other stop in Phase 4 | per stop | `quality.maxRoundsPerStop` |
| Rounds on Mars after the review, if an addendum asks for changes | per stop | `quality.maxRoundsPerStop` |
| Whole film rounds in Phase 5 | per film | `quality.wholeFilmMaxRounds` |
| Polish rounds in Phase 6 | per film | `quality.polishMaxRounds` |
| Runs of the record round in Phase 6 | per film | `quality.recordRoundMaxRuns` |
| Passes through the QA gauntlet in Phase 6 | per film | `quality.gauntletMaxPasses` |
| Attempts to fix one machine check in one round | per round | `quality.gateFixMaxAttempts` |
| Takes of one generated asset | per round, and per phase for assets made outside a round | `assets.maxTakesPerAsset` |

- Stop a loop early only when its pass bar holds.
- When a loop reaches its limit without passing: keep the best build of that stop, write every open severe and major issue under "Open items" in `kit/PROGRESS.md` with the frame, the critic's words and what was tried, and go on.
- Open items are worked again in Phase 6, worst first.
- Nothing in this kit loops without a limit in this table. If you find yourself repeating a step that is not in the table, stop after three tries, log it as an open item and go on.

## The plateau rule

- If the same issue survives `quality.plateauRounds` rounds in a row, change technique. Move to the next rung for that problem in the ladder in `kit/04-LOOK.md` and log which rung.
- Never lower a threshold. Never drop a critic. Never reword a rubric or a jury text. Never remove a judged frame.
