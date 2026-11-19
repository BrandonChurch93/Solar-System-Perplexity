# 07 · The quality bar

## The standard

Every judged frame matches its approved image and reads as a frame from a top-budget film. Every move between them reads as one real flight. The checks below test that from different sides.

Quality here is pursued hard and inside limits. Use every round a limit allows. When a limit is reached, log what is open and move on. `AGENTS.md` explains why.

## The automated gate

`npm run gate -- --phase N` runs the checks that phase needs and prints pass or fail for each. Every check a phase needs is green before any critic sees a round. `kit/08-BUILD-ORDER.md` says which checks each phase needs.

| Id | Check |
| --- | --- |
| G1 | `npm run build` exits clean with no type errors |
| G2 | Unit tests pass |
| G3 | `npm run determinism` passes: a frame is pixel-identical across fresh page loads and when frames are rendered in a different order |
| G4 | Every still is exactly the size of its format. `info().frameCount` equals `film.fps` times `film.durationSeconds` |
| G5 | No frame in scope is blank, a single flat color, or contains invalid pixels. Frames inside `ending.fade` are exempt from the flat color test. In scope: the judged frames of every finished stop. Preview frames are checked by `npm run film` as it renders each one, and G5 reads the result from the film's record |
| G6 | No interface element is visible in `capture`, `autopilot` or `export` output |
| G7 | The config passes startup validation, and the judged frame list in `kit/PROGRESS.md` equals the list computed from `judged.fractions` |
| G8 | `out/preview.mp4` exists and its record matches the current build hash. `ffprobe` reports `film.fps`, exactly `frameCount` frames and the `formats.preview` size. The file is under `repo.maxFileMb` megabytes |
| G9 | The Export proof exists, as `kit/05-ARCHITECTURE.md` defines it, and its frames show no interface element |
| G10 | Platform fit. `formats.master` is within `platform.maxWidth` and `platform.maxHeight`. `film.fps` is within `platform.maxFps`. `export.bitrateMbps` is within `platform.maxBitrateMbps`. Every clip is at or under `platform.loopsAtOrUnderSeconds` |
| G11 | Every file under `public/assets/third-party/` has a row in `ASSETS.md`. Every generated file under `public/assets/` has a recipe in `assets-src/` |
| G12 | No tracked file is over `repo.maxFileMb` megabytes. No secret is tracked. `references/cache/` and `out/work/` are not tracked. Every file listed in `references/approved/MANIFEST.sha256` still has the hash listed there |
| G13 | Detail. For every frame of a finished stop's `hold` and `terrain`, every `dive` frame before its cover and every `rise` frame after its cover: in the `texels` view, the share of body or relief pixels with fewer than `detail.minTexelsPerPixel` texels per screen pixel is at most `detail.maxSoftPixelFraction`. Sky pixels are not counted. A stop with no cover counts every frame of its `dive` and `rise`. Measured in `formats.master` with the `full` asset set |
| G14 | The app requires no WebGL2 limit or extension outside the set recorded in Phase 0 |
| G15 | Sets. No frame needs more than `sets.maxLoaded` sets. Every asset a finished stop names exists in both asset sets |
| G16 | `out/roughcut.mp4` exists with exactly `frameCount` frames at the `formats.preview` size |

Freshness: the gate and `npm run pack` accept an image or film only if its record matches the current build hash, format, tier and asset set, as `kit/05-ARCHITECTURE.md` describes. Anything else counts as missing. `out/roughcut.mp4` is exempt. It is made once from the approved images.

## Judged frames

- The fixed list the critics score. It is computed, not chosen: frame 0, the frame at `film.hookSeconds`, and for every segment the frame at its fraction in `judged.fractions`. Segments of kind `fade` have none.
- The list lives in `kit/PROGRESS.md` with the segment and stop of each frame.
- A stop's judged frames are the ones inside its `hold`, `dive`, `terrain` and `rise` segments. Judged frames inside `travel` segments and the ending are scored in Phase 5, when those segments are finished.
- Every judged frame is rendered at the `final` tier in `formats.master`.
- Frames can be added to the list. A frame is never removed.

## Packs

`npm run pack` builds what each critic receives.

- No image has a long edge over `critics.maxImageLongEdgePx`. A full frame is resized to fit. Fine detail is shown in native-size crops.
- Same file format for every image. All metadata is stripped.
- Neutral file names, as `AGENTS.md` requires.
- Pack images are written under `out/work/`.
- A critic receives its files as attachments only. Never give a critic a path into the repo or the workspace.
- A key maps each neutral name to what it is. It is written outside every folder a critic can reach, and copied into the round folder only after every answer for the round is in.

## The critics

- Every critic is a fresh agent in every round.
- Each critic receives its pack, its own section of this file word for word, and the return format below. Nothing else.
- R2 jurors and R8 jurors receive only what their sections say.
- Spread the critics across different model families. Rotate which family holds which role from round to round.
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

- Pack: for each judged `hold` and `terrain` frame of the stop, the approved image as `-a` and the frame as `-b`, at the same size, plus matching native-size crops of each.
- Compare region by region: composition and framing, where each feature sits, color and grade, contrast and depth of blacks, amount of fine detail, direction and quality of light, glow at the limb, moons and rings, the sky.
- Small differences in exact cloud or crater shapes are fine. A viewer shown both should call them the same shot from the same film.
- List every region where `-b` falls short of `-a` as an issue. Say what is different and which way to move it.
- Score 10 when the pair is the same shot and `-b` has lost nothing.

### R2 · Film jury

One image per call, so no juror can compare images with each other.

- Judged images: the stop's judged `hold` and `terrain` frames. In the whole film rounds, every judged `hold`, `terrain`, `travel` and `lookback` frame.
- Controls: the approved hero and close image of the same stops, resized, cropped and encoded exactly like the judged images.
- Each image goes to `quality.jury.jurors` jurors, each on a different model family.
- Each call is a fresh agent that receives one image and exactly this text, nothing else:

> You will see one image. Which of these is it most likely to be? (a) a frame from a top-budget film or AAA game cinematic, (b) a stock image, (c) a science textbook picture, (d) amateur generated art, (e) a real-time web 3D demo. Answer with one letter, a confidence from 0 to 100, and the one thing that most influenced your answer.

Scoring:

- The test is valid when the share of control votes for (a) is at least `quality.jury.minControlFilmShare`.
- The test passes when it is valid and every judged image gets (a) from at least `quality.jury.minFilmVotes` jurors.
- When the test is invalid, run it again with fresh jurors. After `quality.jury.maxInvalidRuns` invalid runs in a row, record R2 as `invalid` for the round. An invalid R2 neither passes nor fails the round. Log it and rely on the other critics.
- What a juror wrote about a judged image is input for the next round.

### R3 · Surface and detail

You are told the images are computer generated.

- Pack: the stop's judged frames, and native-size crops of every surface in them: globe, limb, terminator, clouds, rings, moons, the near, middle and far parts of the terrain view, the sky.
- Look for: soft or blurry areas, visible pixels, seams, pinching or swirling at a pole, stretched texture, repeated patterns, banding in gradients, halos or doubled edges round a layer, edges of a patch, a plastic or airbrushed surface, flat light, jagged or shimmering edges, stars that are blobs.
- Look for anything that should not be there: text, a logo, a border, a stray object.
- Score 10 when every crop holds up at native size and nothing gives away how it was made.

### R4 · Motion

You are told the images are computer generated.

- Pack: a contact sheet for each of the stop's `hold`, `dive`, `terrain` and `rise` segments, and a run of consecutive frames across each cover. In the whole film rounds: a contact sheet for every `travel` segment and each segment of the ending. Sheets and runs are rendered at the `review` tier or higher.
- Camera: it has mass. Starts and stops are eased. No jump in position, direction, speed or field of view.
- Covers: the frames before and after belong to one move. Nothing pops. Color, exposure and horizon carry across.
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

- Pack: the whole film contact sheets, and every judged `hold` frame in order.
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

- Pack: stills taken from the stress encode beside the same frames before encoding, with native-size crops.
- The stress encode is made by `npm run stress`, as `kit/05-ARCHITECTURE.md` describes.
- Look for banding in dark gradients, blocks in glow and haze, smeared grain, stars that vanish, and lost fine detail on surfaces.
- Score 10 when the encoded frames still hold up at native size.

### R8 · Recognition

One image per call.

- Judged images: the stop's judged `hold` frame.
- Each image goes to `quality.recognition.jurors` jurors, each on a different model family.
- Each call is a fresh agent that receives one image and exactly this text, nothing else:

> You will see one image. Name the body in space that it shows, in one or two words.

- R8 passes when every juror names the right body.

## The pass bar

For a stop, all of these hold at once:

1. The gate is green for the current phase.
2. R1, R3 and R4 each score at least `quality.passScore`, with no severe or major issue open.
3. R2 passes or is recorded as `invalid`.
4. R8 passes.

For the whole film, in Phase 5:

1. The gate is green.
2. R5, R6 and R7 each score at least `quality.passScore`, with no severe or major issue open.
3. R2 passes or is recorded as `invalid` on its whole film list.
4. R3 and R4 hold on the `travel` segments and the ending.

## Rounds and their limits

- One round: build, gate, pack, critics, read every issue, fix, log, commit, push.
- Each round writes `scorecards/round-NNN/`: the pack manifest, the key, each critic's JSON, the jurors' answers, and `SUMMARY.md` with the scores, the top issues and what changes next. Text files only.
- `kit/PROGRESS.md` gets one line per round.
- Fix causes, not symptoms. If a critic names an artifact, find what produces it.
- Never tune the picture to please one critic at the cost of another.

| What | Limit | Key |
| --- | --- | --- |
| Blockout rounds in Phase 2 | per film | `quality.blockoutMaxRounds` |
| Rounds on the look lock stop in Phase 3 | per stop | `quality.lookLockMaxRounds` |
| Rounds on every other stop in Phase 4 | per stop | `quality.maxRoundsPerStop` |
| Whole film rounds in Phase 5 | per film | `quality.wholeFilmMaxRounds` |
| Polish rounds in Phase 6 | per film | `quality.polishMaxRounds` |

- A round counts when critics have scored it.
- Stop a loop early only when its pass bar holds.
- When a loop reaches its limit without passing: keep the best build of that stop, write every open severe and major issue under "Open items" in `kit/PROGRESS.md` with the frame, the critic's words and what was tried, and go on.
- Open items are worked again in Phase 6, worst first.

## The plateau rule

- If the same issue survives `quality.plateauRounds` rounds in a row, change technique. Move to the next rung for that problem in the ladder in `kit/04-LOOK.md` and log which rung.
- Never lower a threshold. Never drop a critic. Never reword a rubric or a jury text. Never remove a judged frame.
