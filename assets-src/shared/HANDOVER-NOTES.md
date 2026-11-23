# Handover engine notebook

Owner: `handover_engineer`. Branch `agent/engine-handover`. Looks folder `engine-handover`. Spec: `cut/HANDOVER.md` Part A (E1 to E5), with S1 and S2 of Part B for Mars. Reports go to `/root` by message at M1, M2, M3.

Read this file first after a compaction, then the task mail, then `cut/HANDOVER.md`.

## Log

### 2026-11-23 06:39 UTC, start
- Clone of main at 6da6c64, branch `agent/engine-handover`, `npm ci`, build passes, vitest 17 files 87 tests pass.
- Read: AGENTS.md, kit/addenda, cut/HANDOVER.md, PROGRESS sections, STOP-AGENT.md, kit 05, 03, 07, the code named in the task mail and the harness tools.

### 06:43 to 06:50, baseline before any change
- New tool `tools/samebytes.ts`: `npx tsx tools/samebytes.ts --label NAME [--tier draft] [--stops a,b] [--skip a,b] [--frames 1,2,5-9] [--against LABEL]`. PNGs and `hashes.json` go to `out/work/samebytes/NAME/`. Exit 1 on any difference. No script line in package.json (only `handover` may be added).
- Label `before`: all 47 judged frames at draft, then 85 frames across every cover window (first, centre minus 1, centre, centre plus 1, last of each of the 17 windows) at draft, then 6 frames at review (2450, 2454, 2700, 1883, 1313, 3024).

### 06:50 to 07:16, E1 written and tested
- Code: `src/director/handover.ts` (new: `HandoverTimes`, `HandoverParams {dive?, rise?}`, `Handover`, `handoverOf`, `dissolveWeight`, `shutterThreshold`, `sideAt`, `placeWeight`, `forceSide`, `handoverFrame`, `judgedWindow`), `src/director/timeline.ts` (`setHandover`, `handoverParams`, `handoverChanges`, `coverFrames(segment)` is the old window and always exists, `coverWindow(segment)` is null for a stop that opted in), `src/director/moves.ts` (`MoveParams.handover`, getter `handsOver`, `divePose(time, view)`, `risePose(time, view)`, `dive` and `rise` built from them with `sideAt`), `src/director/film.ts` (`shotAt(frame, time, forced?)`, the cover only when the stop did not opt in), `src/core/motion.ts` (`shotAt(..., side?)`, `FramePlan.split`, raw motion per side in a dissolve frame, softness 0 in the dive and rise of a stop that opted in), `src/core/engine.ts` (per side mid shot when the frame is split), `src/config.ts` and the block `handover` in `config/showcase.json`.
- Tools for MAIL 220: `tools/lib/render.ts` (`sheetFrames` goes through `judgedWindow`; `detailFrames(segments, noCover)` counts every frame of a dive and rise of a stop that opted in), `tools/lib/cues.ts` (new: `cuesOf`, `swapOf`; cue name `the handover`, move text `Handover in frame N, no cover` or `Handover from frame A to B, no cover`, seen `handover`), `tools/cues.ts`, `tools/shots.ts`, `tools/measure.ts`.
- Tests: `tests/handover.test.ts`, 16 tests. Not opted in: sides, place weight, shots and frame plans of another stop are unchanged when Mars opts in. Opted in: times, no cover, sides inside the dissolve, the weights of a 3 frame dissolve (0.15625, 0.5, 0.84375), the spread of the shutter thresholds, the shape of the place weight, poses on both sides at any time, motion per side, hold and terrain unchanged. `forceSide` on and off, and read nowhere but `director/handover.ts`. Tools with Mars opted in and Earth not: `judgedWindow`, `sheetFrames`, `detailFrames`, `cuesOf`, `swapOf`.
- vitest: 18 files, 103 tests pass (87 before). `npx tsc --noEmit -p .` clean. `npx tsx tools/cues.ts --check` passes (no stop opted in yet, so the committed cue sheet is unchanged).
- A test builds an opted in plan with `new StopPlan('mars', fit, {...params, handover})`. The handover registry in the timeline is one entry per stop id and the last plan built wins, so tests restore it in `afterAll`.
- Baseline of the frozen code at the review tier, rendered in a second worktree `/home/user/workspace/repo-before` (detached at 6da6c64): 2450 6f4f233a8b5af909, 2454 7030b7b3b51979c4, 2700 d7920969e17ba69b, 1883 d8a04b5882b05f8f, 1313 1e64290a2c5de79b, 3024 2fef51f387af6e57 (first 16 hex of the sha256 of the PNG).
- Looks pushed 07:02: the frozen Mars cover frames at draft (a brown smear in 2453 to 2455 and 2699 to 2701).

## Decisions

- `StopPlan.risePose` (a property, the pose at the end of the rise) is renamed `riseEnd`, because the contract of E1 needs the method `risePose(time, view)`. One line outside my folders follows it: `src/stops/earth/plan.ts:91`. Told to /root with M1.
- T is snapped to a shutter middle. With `at` the share of the segment, `centreFrame = floor((start + at * length) * fps)`, the dissolve frames are `first = centreFrame - floor((n - 1) / 2)` to `last = first + n - 1`, and `T = ((first + last) / 2 + shutterFraction / 2) / fps`. For `n = 1` the draft sample of the dissolve frame lies exactly at T.
- The dissolve weight is constant inside a frame (taken from the frame number), so both sides share every part of that frame's shutter: `w = smooth((frame - first + 1) / (n + 1))` in a dive, `1 - that` in a rise. At the draft tier (one sample at s 0.5, threshold 0.472) the dive swaps to the close side at the first frame whose weight is above 0.472.
- The place window: dive `placeFirstFrame = firstFrame - placeFrames`, `placeLastFrame = lastFrame`; rise `placeFirstFrame = firstFrame`, `placeLastFrame = lastFrame + placeFrames`. `placeWeight` is continuous in time: dive 0 at `placeFirstFrame / fps` to 1 at `firstFrame / fps`, then 1; rise 1 until `(lastFrame + 1) / fps`, 0 at `(placeLastFrame + 1) / fps`.
- A stop that did not opt in: `handoverOf` null, `placeWeight` 0, `sideAt` is today's test (dive: terrain when `time >= centre`; rise: terrain when `time < centre`, centre = `coverWindow(seg).centerFrame / fps`).
- `forceSide` is a module switch read by `sideAt` only. The film path never calls it. The harness reaches it through a diagnostic option of the engine (E4). Motion measuring per side does not use it: `shotAt(frame, time, side?)` takes the side as an argument.
- Harness hooks live in my folders: `src/capture/frame.ts` and `src/main.ts` are not mine, so options ride on the `diag` string that `setDiagnostic` already passes to the engine.

## The contract of E1, for the stop builders

- Opt in: `MoveParams.handover` in the stop's `params.json` (or its plan). Its presence, even `{}`, opts in both the dive and the rise. `handover.dive` and `handover.rise` may override `at`, `dissolveFrames`, `placeFrames` of `config.handover`.
- `plan.divePose(time, view)` and `plan.risePose(time, view)` give either side at any time of the segment. `plan.dive(time)` and `plan.rise(time)` pick the side with `sideAt`.
- `handoverOf(segment)` gives `{kind, time, firstFrame, lastFrame, placeFirstFrame, placeLastFrame, frames}` or null. `coverWindow(segment)` is null for a stop that opted in; `judgedWindow(segment)` is what tools should use.
- T sits on a shutter middle: `centre = floor((start + at * length) * fps + 1e-9)`, `first = centre - floor((n - 1) / 2)`, `last = first + n - 1`, `T = ((first + last) / 2 + shutterFraction / 2) / fps`. Mars with the defaults: dive frame 2454 (T = 2454.25 / 30), place window 2442 to 2454; rise frame 2700 (T = 2700.25 / 30), place window 2700 to 2712.
- Inside a dissolve frame the weight is constant: `smooth((frame - first + 1) / (n + 1))` in a dive, 1 minus that in a rise. A sample at shutter position s draws the close side when `w > fract(s * 8 + floor(s * 8) * 0.618)`. With `dissolveFrames` 1 the weight is 0.5: half the samples of that one frame come from each side, and the draft tier (one sample, s 0.5, threshold 0.472) draws it from the close side exactly at T.
- `placeWeight(segment, time)`: dive 0 at `placeFirstFrame / fps`, smooth to 1 at `firstFrame / fps`, then 1; rise 1 until `(lastFrame + 1) / fps`, smooth to 0 at `(placeLastFrame + 1) / fps`.
- Softness (`motion.softFromPx`) and the cover do not exist in the dive and rise of a stop that opted in. Everything else in the film is as before, byte for byte.
- Once a stop opts in, `cut/CUES.md` and `cut/SHOTS.md` are stale until `npm run cues` and `npm run shots` run (both files belong to /root).

## Mail from /root to keep in mind

MAIL 220 (06:5x UTC), an addition to E1, to report with M1 or M3:
1. `tools/lib/render.ts` `sheetFrames(cfg, segment, true)` throws when there is no cover window. For a stop that opted in the critics' pack still needs that sheet: `critics.contactSheetFrames` consecutive frames centred on T. Part names stay (`<segment>-cover` in tools/pack.ts, tools/round.py, tools/keep.ts, tools/sheet.ts --cover). A helper beside `coverWindow`, for example `judgedWindow(segment)`: the cover window, or the handover window for a stop that opted in.
2. `tools/measure.ts`: G13 counts every frame of a dive and a rise of a stop that opted in. `--no-cover` stays as it is for the others.
3. `tools/cues.ts` and `tools/shots.ts`: for a stop that opted in they list T where they listed the cover's times, same format, so `npm run cues -- --check` still passes for the others and the sheet can be made again at the end.
4. `tools/pack.ts`, `tools/round.py` and `npm run status` must run for a mix of stops, some opted in, some not.
5. Unit tests for 1 to 3 with one stop opted in and one not.

MAIL 221 (for E2): some close sides are alive (the Sun's cells boil, cloud decks drift, Jupiter's storm turns). A place picture drawn once at T freezes that life. So the place picture has a switch per stop and kind: `fixed` (drawn once at T, the default, cheapest) or `live` (drawn again for each sample with the set at the sample's own time, the camera fixed at the twin's pose of T). With `live` the globe side shows the living place from the first frame of the place window, and at T it is still equal to the close side. Determinism holds either way. The Sun's builder needs it for the rise at frames 180 to 269. Say in this notebook how a stop turns it on.

MAIL 222 (for E2): things that stand high above the ground cannot ride in the place picture (the Sun's loops, a moon, rings, a tall cloud tower). A stop must be able to (a) leave such things out of the place picture: a flag the set can read while the place picture is drawn, or a layer rule; and (b) draw them itself as true 3D on the globe side after the pass, in the same place, size and light as on the close side, so they are one object through T. At T the pass plus those objects must still equal the close side, so E4's side difference at T has to count them. Say in this notebook how a stop uses it.

## Facts measured

- Judged frames (47): 0 60 90 247 360 495 615 717 870 1016 1072 1185 1287 1440 1586 1642 1755 1857 2010 2156 2212 2325 2427 2580 2726 2782 2895 2997 3150 3296 3352 3465 3567 3720 3866 3922 4035 4137 4290 4436 4492 4605 4707 4860 5006 5085 5235.
- Cover windows today (first, last, centre): sun.rise 208 223 216; mercury 736 751 744 and 982 997 990; venus 1299 1329 1314 and 1545 1575 1560; earth 1876 1891 1884 and 2122 2137 2130; mars 2446 2461 2454 and 2692 2707 2700; jupiter 3016 3031 3024 and 3262 3277 3270; saturn 3586 3601 3594 and 3832 3847 3840; uranus 4156 4171 4164 and 4402 4417 4410; neptune 4728 4758 4743 and 4972 4987 4980.
- Draft render: about 3 s a frame, about 20 s to load a set.

## E2 design notes (07:10, nothing coded yet)

- Mars has the solved close camera in `src/stops/mars/relief.json`: vfov 60, pitch -21.028 deg, roll 0.037, horizon dip 2.598 deg, the ground a sphere of radius 972.27 units under a camera at height 1 unit. So 1 terrain unit = 1 / 972.27 radii and the twin's height is 0.0010285 radii. `config.motion.terrainGround` 1 = the ground plane one unit below the terrain origin. The terrain frame's vertical is `(0, cos(tilt), sin(tilt))`, tilt = `horizonDeg + dipDeg` = 21.03 deg; `StopPlan.horizon('terrain', pose)` gives that nadir in camera space.
- The twin: height `1 / cos(dip) - 1` radii above the sphere, its nadir in camera space equal to the close view's nadir, the ground place and the heading carried over from the terrain frame with that scale. Velocities scale the same way (E3).
- Sets undo the lens vignette (0.45) by screen position (relief, planet, moon; kit/PROGRESS.md "Tone curve"). The sky undoes it only for patches and partly for stars. A place picture with a wider field cannot carry that per pixel factor. Plan: draw the place picture with the vignette undo off and undo the vignette at the current pixel in the pass (exact for the set layer); keep the sky exact by drawing it live on the globe side with the close side's sky values instead of baking it. Fallbacks: a two render split, or a black and a white background for the transmittance.
- The sky must be one function through T. The sides differ today in `skyGlow` (terrainSkyGlow 0.25 against 1), `skyTurn` (`sky.turns[id]` against `sky.orbits[id]`), `light.sky` (the skyLow factor), the patch per view (Mars `sky-hold.webp` and `sky-terrain.webp`, at most 2 patches in the shader), the near and far planes, and the camera's world orientation (the twin differs from the close camera by a fixed camera space rotation D = Q_twin^-1 * Q_close of about 21 deg). Plan: on the globe side of a stop that opted in, ramp the sky quaternion, the turn, glow, exposure and both patches' weights so that they equal the close side at T. Rotations ramp over more frames than the place window.
- Honest limits: the ground that the twin cannot see (beyond its horizon) and the band between the two horizons show the globe's own surface and limb haze, so plates and low altitude haze must agree with the close picture (`look.descent` of Mars already tunes this).
- Risk: the close side has real relief depth and the picture painted on the sphere has none before T. Measure the flow gap (E4.2); consider a reprojection that knows depth if the start of the parallax is visible.
- Picture size: about 2 texels per frame pixel in the middle for sharpness. `src/core/caps.ts` `needs()` must declare the larger render buffer when a stop opted in (the record lists MAX_RENDERBUFFER_SIZE 8192). The Cover pass in `src/terrain/cover.ts` is the model for a blended pass into `sampleTarget`. The post chain ignores alpha.
- When Mars opts in through its plan: `tests/plankeys.test.ts` takes `coverWindow(seg)` as never null on plans built from `params` (its `bare()` must drop `handover`). Mars uses `dive.swoop: true` with a surge; E3 replaces it with a steady descent only for stops that opted in.

## Next

1. E1 code and tests, same bytes check, push, M1 to /root.
2. E2 on Mars, M2.
3. E3, E4, E5, M3.
