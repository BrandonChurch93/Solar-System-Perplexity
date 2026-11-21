# Engine batch 16

Branch `agent/engine-batch16`, cut from main `c6ba9432`. Assembled by the engine profiler on its own VM (4 cores, SwiftShader, draft tier, 16x9). This file is the proof the Builder asked for.

## What is in it

| Step | Commit | What |
| --- | --- | --- |
| 1 | `dd63f4c` | merge of `agent/belt` at `4e8aadea`: `src/space/belt/belt.json`, `belt.ts`, `motion.ts`, `assets-src/belt/` |
| 2 | `c6b82e5` | merge of `agent/engine-perf` at `837adbbb`: the cure after a restored drawing context (`src/core/engine.ts`, `sets.ts`, `tools/restore.ts`), `coverWindow` (`src/director/moves.ts`, `timeline.ts`, `tools/cues.ts`, `tools/lib/render.ts`, `tools/measure.ts`), two test files, PERF.md, STOP-AGENT.md |
| 3 | `6ae9856` | merge of `agent/travel` at `7d5ffe7e`: `config/showcase.json` (`travel.dust` new, `travel.sky` numbers), `src/core/types.ts`, `src/director/film.ts`, `src/space/dust.ts`, `sky.ts`, `travel/field.ts`, `assets-src/travel/` |
| 4 | `c3c8d6a` | Saturn's engine request 2, the patch as Saturn wrote it: `StopPlan.skyGain(time)` returns 1; the stop branch of `film.ts` multiplies `light.sky` by it only when it is not 1 |
| 5 | `b343543` | `StopPlan.skyUnderCover(amount, time)` returns `Math.pow(1 - amount, 2)`; the cover line of `film.ts` calls it; one test |
| 6 | `4b70c37` | STOP-AGENT.md: the paragraph on the sky under a cover, beside `coverWindow` |

## Conflicts

None in the text: all three merges went through automatically and Saturn's patch applied cleanly. The files more than one side touches, and what was checked by reading the merged result:

| File | Sides | Merged result |
| --- | --- | --- |
| `src/director/moves.ts` | engine-perf (`coverWindow` in `MoveParams`, set in the constructor), Saturn (`skyGain`), step 5 (`skyUnderCover`) | three separate places of `StopPlan`, all kept |
| `src/director/film.ts` | travel (`dustLook`, `leave.from`, travel and retreat branches only), Saturn (two lines in the stop branch), step 5 (the cover line) | separate lines, all kept; `skyGain` and `skyUnderCover` multiply, so a plan that overrides both gets the product |
| `src/director/timeline.ts` | engine-perf only | no overlap |
| `src/core/types.ts` | travel only (`Shot.dustLook?`) | no overlap |
| `assets-src/shared/STOP-AGENT.md` | engine-perf (the `coverWindow` bullet), step 6 | the new bullet follows the `coverWindow` bullet |

## Build and tests

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean, built in 36 s |
| `npm test` | 14 files, 70 tests, all pass (`agent/engine-perf` alone has 14 files and 69 tests; step 5 adds one; belt and travel bring none) |
| engine hash | `26442750f28b11e0` (main `f854c8146f64c7e4`) |
| stop hashes | sun `c25a1bc1a5958b3c`, mercury `a646fd32007c7ab8`, venus `4a0019eb37f2a74d`, earth `a1573c1a4a29dc23`, mars `353338cc5c905af5`, jupiter `bf3a6fa3f51a1e4d`, saturn `a301db93a38deae8`, uranus `5afa91dfab8a6bc7`, neptune `85801023ee439540`: all nine equal main's and the Builder's list |
| director's shots | every frame of every terrain, rise, hold and dive segment, at three shutter times, the whole `Shot` serialised: identical on main and on the branch once the new field `dustLook` (0 in every such frame) is left out. Of the ending, `ending.retreat` differs (travel), `ending.lookback` and `ending.fade` are identical |
| lost and restored context | `tools/restore.ts` on the merged tree: pass, all seven checks (capture frame 2325 draft `fd128b1a999f76fa` before and after the restore, no texture or state errors, live frame and free view back) |

`npm run build` does not write `dist/build.json`; the tools do on their first run (`ensureBuild`), from `tools/lib/hashes.ts`. The hashes above are from that file on the branch and from the same function on main.

## Stop frames, draft, main against the branch

Same VM, same script (`renderPngFresh` and `openCapture` as `npm run still` uses them, one browser session per stop, frames in rising order, the same order on both trees). Mars on main gives the Builder's four hashes.

| Frame | Segment | Role | main `c6ba9432` | branch | Verdict |
| --- | --- | --- | --- | --- | --- |
| 0 | sun.terrain | judged | `ba059120c3602cca` | `ba059120c3602cca` | byte equal |
| 60 | sun.terrain | judged | `c6eb2297cd146931` | `c6eb2297cd146931` | byte equal |
| 90 | sun.terrain | judged | `a9b067b023abfe6b` | `a9b067b023abfe6b` | byte equal |
| 247 | sun.rise | judged | `97588c6edf85b30e` | `97588c6edf85b30e` | byte equal |
| 360 | sun.hold | judged | `fcbfbf2f25bffb63` | `fcbfbf2f25bffb63` | byte equal |
| 615 | mercury.hold | judged | `03209b114bab4eeb` | `03209b114bab4eeb` | byte equal |
| 717 | mercury.dive | judged | `0ef86bd914cd6af6` | `0ef86bd914cd6af6` | byte equal |
| 744 | mercury.dive | inside the cover | `2fe54a569480f544` | `2fe54a569480f544` | byte equal |
| 870 | mercury.terrain | judged | `f4755bcab73d54f0` | `f4755bcab73d54f0` | byte equal |
| 990 | mercury.rise | inside the cover | `f31b4505a9da5b15` | `f31b4505a9da5b15` | byte equal |
| 1016 | mercury.rise | judged | `c3ce11364e057b0c` | `c3ce11364e057b0c` | byte equal |
| 1185 | venus.hold | judged | `d4afc78222af04e2` | `d4afc78222af04e2` | byte equal |
| 1287 | venus.dive | judged | `6d0f9a3dc1057928` | `6d0f9a3dc1057928` | byte equal |
| 1314 | venus.dive | inside the cover | `21cdf3eac6043a63` | `21cdf3eac6043a63` | byte equal |
| 1440 | venus.terrain | judged | `042b228fca024f70` | `042b228fca024f70` | byte equal |
| 1560 | venus.rise | inside the cover | `c45003be3cf74070` | `c45003be3cf74070` | byte equal |
| 1586 | venus.rise | judged | `631e0874b8f405b7` | `631e0874b8f405b7` | byte equal |
| 1755 | earth.hold | judged | `cb4c42ecfce7cb41` | `cb4c42ecfce7cb41` | byte equal |
| 1857 | earth.dive | judged | `d12ecb4bc4f61c6c` | `d12ecb4bc4f61c6c` | byte equal |
| 1884 | earth.dive | inside the cover | `1002c2a1162b4392` | `1002c2a1162b4392` | byte equal |
| 2010 | earth.terrain | judged | `0f2303a6ad7dc69c` | `0f2303a6ad7dc69c` | byte equal |
| 2130 | earth.rise | inside the cover | `0b0c7bb02f747108` | `0b0c7bb02f747108` | byte equal |
| 2156 | earth.rise | judged | `62ce383cd442047d` | `62ce383cd442047d` | byte equal |
| 2325 | mars.hold | judged | `fd128b1a999f76fa` | `fd128b1a999f76fa` | byte equal |
| 2427 | mars.dive | judged | `5636a9764d87cc2e` | `5636a9764d87cc2e` | byte equal |
| 2454 | mars.dive | inside the cover | `eec258fb0fe9433c` | `eec258fb0fe9433c` | byte equal |
| 2580 | mars.terrain | judged | `7322ef9576f06ffb` | `7322ef9576f06ffb` | byte equal |
| 2700 | mars.rise | inside the cover | `0f60fc91acdf939e` | `0f60fc91acdf939e` | byte equal |
| 2726 | mars.rise | judged | `d408b434a0b12d9f` | `d408b434a0b12d9f` | byte equal |
| 2895 | jupiter.hold | judged | `449a2d4ac18584fc` | `449a2d4ac18584fc` | byte equal |
| 2997 | jupiter.dive | judged | `85cef0337b4bc4b8` | `85cef0337b4bc4b8` | byte equal |
| 3024 | jupiter.dive | inside the cover | `6155ba2d76a8b487` | `6155ba2d76a8b487` | byte equal |
| 3150 | jupiter.terrain | judged | `1f960e49c479c5b6` | `1f960e49c479c5b6` | byte equal |
| 3270 | jupiter.rise | inside the cover | `a32bc3f90bf71f62` | `a32bc3f90bf71f62` | byte equal |
| 3296 | jupiter.rise | judged | `02ed7391851bc215` | `02ed7391851bc215` | byte equal |
| 3465 | saturn.hold | judged | `9a5e9f2fe36a984e` | `9a5e9f2fe36a984e` | byte equal |
| 3567 | saturn.dive | judged | `57f0864826665c51` | `7cde7441645f839c` | differs, and differs on main against itself, see Saturn below |
| 3594 | saturn.dive | inside the cover | `2c7ccee34f3ef304` | `f27418208dfcb3b9` | differs, and differs on main against itself, see Saturn below |
| 3720 | saturn.terrain | judged | `dedcba178a114e18` | `dedcba178a114e18` | byte equal |
| 3840 | saturn.rise | inside the cover | `7fc692adaab0f4e1` | `e3facb206986b54e` | differs, and differs on main against itself, see Saturn below |
| 3866 | saturn.rise | judged | `136e42549da5e192` | `84c90b533ec82201` | differs, and differs on main against itself, see Saturn below |
| 4035 | uranus.hold | judged | `ff4fa1ef5fe252ec` | `ff4fa1ef5fe252ec` | byte equal |
| 4137 | uranus.dive | judged | `a29dfa6c9df99ef6` | `a29dfa6c9df99ef6` | byte equal |
| 4164 | uranus.dive | inside the cover | `2beabd86a63c8c15` | `2beabd86a63c8c15` | byte equal |
| 4290 | uranus.terrain | judged | `dd5c7580afadd5b7` | `dd5c7580afadd5b7` | byte equal |
| 4410 | uranus.rise | inside the cover | `f9b3bc0bf2d06221` | `f9b3bc0bf2d06221` | byte equal |
| 4436 | uranus.rise | judged | `30e390014b2fb97c` | `30e390014b2fb97c` | byte equal |
| 4605 | neptune.hold | judged | `7dc792b8f9e70281` | `7dc792b8f9e70281` | byte equal |
| 4707 | neptune.dive | judged | `0ddf8ad2f0b2159b` | `0ddf8ad2f0b2159b` | byte equal |
| 4734 | neptune.dive | inside the cover | `16e8e5ab57fda592` | `16e8e5ab57fda592` | byte equal |
| 4860 | neptune.terrain | judged | `1ccc4a12760db30a` | `1ccc4a12760db30a` | byte equal |
| 4980 | neptune.rise | inside the cover | `871e2637b69834a4` | `871e2637b69834a4` | byte equal |
| 5006 | neptune.rise | judged | `03d4cdb09175f2d6` | `03d4cdb09175f2d6` | byte equal |

49 of 53 stop frames byte equal (full sha256 compared, first 16 hex digits shown). The four that differ are all Saturn dive and rise.

## Saturn's dive and rise are not repeatable, on main alone

The four Saturn frames were rendered again, each in a browser session of its own (exactly what `npm run still` does), twice on main and twice on the branch, and once more on main in one session.

| Frame | main, stop session | branch, stop session | main, one session of the four | main, own session, A | main, own session, B | branch, own session, A | branch, own session, B |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3567 | `57f0864826665c51` | `7cde7441645f839c` | `7cde7441645f839c` | `57f0864826665c51` | `57f0864826665c51` | `57f0864826665c51` | `57f0864826665c51` |
| 3594 | `2c7ccee34f3ef304` | `f27418208dfcb3b9` | `02a34cddfb64c006` | `ab1a9127aa6e13a4` | `6ea37eb93504c448` | `4b6f159d60697ae9` | `5c9e72f6760a54ca` |
| 3840 | `7fc692adaab0f4e1` | `e3facb206986b54e` | `7fc692adaab0f4e1` | `c1d9283b46be0b13` | `c1d9283b46be0b13` | `c1d9283b46be0b13` | `c1d9283b46be0b13` |
| 3866 | `136e42549da5e192` | `84c90b533ec82201` | `66bf1f4e4b6131f6` | `5d67f5716d9239f0` | `6b8f6d1d188280e5` | `328a612e599d771a` | `55074619f96bb655` |

- 3594 and 3866 give a new hash in every one of the seven runs, main against main included. Main B against branch B: 3594 differs in 4 pixels by one level of 255 (x 1116 to 1117, y 458 to 462), 3866 in 7 pixels by one level (x 386 to 390, y 573 to 642).
- 3567 gives two values, and main shows both (`57f0` and `7cde`). 3840 gives three, main shows two of them. In a session of their own both are equal on main and on the branch, four runs of four.
- So the difference in the table above is Saturn's own, present on main `c6ba9432` without any of this batch, and no step of the batch can be blamed or cleared by these four frames. A bisect over the five steps has nothing stable to compare. What does hold for Saturn: its stop hash, its shots (dive and rise included), its hold 3465 and its terrain 3720 are equal.
- Cause not found, not looked for in `src/stops/saturn/` beyond its imports (nothing of belt, dust or travel; `EQUIRECT_GLSL` from `sky.ts`, which the batch does not change). A few pixels by one level, changing from run to run, in dive and rise only, points at something in Saturn's orbit view that is not settled when the frame is taken. This is for Saturn's agent; no stop folder was touched here.

## Frames that are meant to change

| Frame | Segment | main `c6ba9432` | branch | Verdict |
| --- | --- | --- | --- | --- |
| 1072 | mercury.travel | `c07b0288cfe3e33c` | `152ec8ef2270b7ae` | changed |
| 1642 | venus.travel | `ef4c0c236d376654` | `e85142f99c67795f` | changed |
| 2212 | earth.travel | `7c7d85fab694299f` | `be070ab31e9ec871` | changed |
| 2782 | mars.travel | `2b4eb61f0e730f45` | `bad33f535c457797` | changed |
| 3352 | jupiter.travel | `4463e6f41a556073` | `6f6a7d4307a6ff38` | changed |
| 3922 | saturn.travel | `3f8905d7641d6a0a` | `b90f1b8b91066d82` | changed |
| 4492 | uranus.travel | `1e3b629102ea7792` | `b04022a6f5f0a936` | changed |
| 5085 | ending.retreat | `70a83ffe8c0db3d6` | `f90d73fb79be4a81` | changed |
| 5235 | ending.lookback | `677cf8724356c241` | `677cf8724356c241` | not changed |

5235 (`ending.lookback`) did not change, and by travel's own notes it is not meant to: `assets-src/travel/NOTES.md` says "so the lookback is untouched" and travel's own byte list holds 5235 as a frame that must stay equal. The director's shots of `ending.lookback` and `ending.fade` are identical too. The ending changes in the retreat (5085).

## Beyond the merges

- Steps 4, 5 and 6 above, as asked.
- One test in `tests/cover.test.ts` (the base of `skyUnderCover` equals the expression; a plan with a floor lifts `skyExposure` under the cover only).
- This file and a pointer in PERF.md. Nothing else: no stop folder, no config number except travel's, no threshold, no tier.

Config numbers the travel merge brings, all under `travel`: `dust` (new), `sky.starLevel` 1.9 to 0.9, `sky.leave.by` 0.16 to 0.3, `sky.leave.from` (new), `sky.retreatOpen`, `sky.retreatClose`, and in `sky.flightStars`: `count`, `floor`, `glow`, `glowTint`, `level`, `clusters`, new `band`, `haze`, `law`, `warm`, removed `brightness` and `slope`.

## Weak points

- Draft tier only (1 sample), 16x9 only, SwiftShader on one VM. Final tier and the other formats are not rendered here.
- 53 stop frames are compared, not every frame. For the rest the shot comparison covers the director only; it says nothing about `sky.ts`, `dust.ts` and the belt, which is what the bytes are for.
- Saturn's dive and rise have no byte proof, see above.
- `sky.ts` gains uniforms and a branch behind `uFlightGlow.w > 0` in the shader every frame runs. The bytes are equal on SwiftShader; another graphics driver may compile it differently, and the live view on a real GPU was not checked.
- `skyGain` came without a test. `skyUnderCover` has one, on the director only.
- The frames meant to change were hashed, not looked at; their look is the belt's and travel's own proof.
- `npm run cues -- --check` fails on main and on the branch alike (reported with `coverWindow`), not rerun here.

## Working notes

Task received 22:58 UTC, 21 Nov. Hash lists on the VM: `/tmp/t6-main.txt`, `/tmp/t6-branch.txt`, `/tmp/t6-sat-*.txt`, `/tmp/t6-main-sat2.txt`; scripts `out/scratch/hashes.ts` (frames to sha256), `out/scratch/stophash.ts` (shots), `/home/user/workspace/t6table.py` (the tables), untracked. Main was rendered in the second tree `/home/user/workspace/dev` at `c6ba9432`.
