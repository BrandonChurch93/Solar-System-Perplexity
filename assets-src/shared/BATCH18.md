# Engine batch 18

Branch `agent/engine-batch18`, cut from main `0bfe5690`, and since mail 58 (02:22 UTC) holding main `3d4858199a94ac278f672eb5e3e648d5298777e9` (engine batch 17) by the merge `3f51122`. Task from the Builder's mail 51 (01:20 UTC, 22 Nov). Second branch `agent/engine-batch18-band` (`a8299d2`) holds part (c) alone, on top of this branch.

## What is in it

Everything is off until a plan asks. No stop folder, no config number, `src/space/sky.ts`, `src/space/dust.ts`, `src/space/travel/`, `src/space/belt/` and the travel and ending branches of `src/director/film.ts` are untouched on `agent/engine-batch18`.

| Part | Key or hook | Where | Commit |
| --- | --- | --- | --- |
| (a) hidden share for the sample rule | `StopPlan.coverHidden(segment, time)`, base returns `undefined` (today's `cover.amount * coverHides`) | `moves.ts`, two lines in the stop branch of `film.ts`, `CoverState.hidden` in `types.ts`, `seenShare` in `motion.ts` | `7c1ba3e` |
| (b) sky turn eased over the cover window | `skyTurnEase: { dive?, rise? }` beside `coverWindow`, hook `StopPlan.skyTurnShare(segment, time)` (share of the terrain turn, `null` is the switch) | `moves.ts`, one block in the stop branch of `film.ts` | `6fdb0c2` |
| (d) Sun glare through the swap | `light.glareCarry: { dive?, rise? }` in seconds, hook `StopPlan.glareCarry(segment, time)` | `moves.ts`, `FilmDirector.glareOf(shot)` in `film.ts` (a method of its own, `shotAt` does not know it), one line and an optional `Director.glareOf` in `engine.ts` | `83327fb`, `8ebe2c2` |
| (e) cover pass skipped when it cannot reach a pixel | nothing to set | `coverReaches(cover, vfov, aspect)` in `src/terrain/cover.ts`, the condition in `engine.ts` | `c981b66` |
| test for `skyGain` | | `tests/plankeys.test.ts` | `fe2123f` |
| tests for (a), (b), (d), (e) | | `tests/plankeys.test.ts` | `fd182e4`, `8ebe2c2` |
| docs | four bullets beside `coverWindow` | `assets-src/shared/STOP-AGENT.md` | `6597742`, `cdc37f4`, `be222bd`, `6ce1832` |

Design notes:
- (a) The hook returns `undefined` by default and not today's product, because Neptune and Jupiter set `coverHides` inside `coverAmount` and `tests/motion.test.ts` edits `hides` on copied shots; the sample rule falls back to `amount * hides` when `hidden` is absent, so both keep working. The hook dims nothing and draws nothing.
- (b) The turn is `slerp(orbit turn, terrain turn, share)` with `share` a smoother step over the whole cover window (first frame of the window to the frame after its last). At the ends the director hands the engine the very same quaternion objects as before. Only the turn eases: `terrainSkyGlow`, the star rule of the terrain view and the sky patches still switch at the centre.
- (d) The engine asks the director for the glare's place per sample. On the orbit side of a dive or rise, within the asked seconds from the centre, the director takes the Sun's direction in the terrain camera at the centre (one more call of the plan's `dive` or `rise`), and moves the Sun of the sky pass along the shortest arc from that place in the frame to the true Sun with a smoother step. Lighting, lens flare and `shot.sun` keep the true Sun. The first version put the place on `SunState` in the tail of `shotAt`; that conflicted with `agent/travel` on the return line, so it became a method of its own (`8ebe2c2`).
- (e) `coverReaches` is false when the amount is too small for any alpha (the largest value the shader's alpha argument can take is below zero: about 0.106 with no rush, lower with rush contrast), or when the shell's outer radius is negative, or when no ray of the frame passes within the outer radius of the shell (corners, one stationary point per edge, with a slack for float precision). With alpha 0 the blend leaves colour and alpha of the target as they are, so the skip is byte neutral by construction.

## Left out of `agent/engine-batch18`, and why

(c) The band only factor needs one uniform in `src/space/sky.ts`, which is closed while the travel agent edits it. It is built and tested on `agent/engine-batch18-band` (one commit on top of this branch, then merges of this branch): `light.bandLow: [from, to, level]` in the form of `skyLow`, hook `StopPlan.skyBand(segment, time)`, `FilmDirector.bandOf(shot)`, `Sky.setBandGain`, `uniform float uBandGain` multiplied into the band only when it differs from 1, one line above the terrain band line. It scales the band alone on the orbit side of a dive or rise by `level` at `from` radii of altitude and below, 1 at `to` and above. `git merge-tree` of that branch against `agent/travel` f4d0bd6, `agent/belt` b5ffb8e and `agent/venus` b6f5426 is clean. Batch 17 is on main now and merged into it (`a8299d2`). Merge it after this branch or not at all; nothing on `agent/engine-batch18` depends on it.

## Proof on the tree that holds main `3d48581`

Draft tier (1 sample), 1920 x 1080, one browser session per stop, main `3d48581` built and rendered in a second tree, the branch at the merge `3f51122`.

| Check | Result |
| --- | --- |
| Merge of main `3d48581` | clean, no conflict (`3f51122`) |
| `npx tsc --noEmit` | clean |
| `npm run build` | passes |
| `npm test` | 15 files, 79 tests, 0 failed |
| Engine hash | main `1e61fa4049d34863` (as mail 58 names it), branch `af68ba5d36aedba0` |
| Nine stop hashes | unchanged, the same as on main `3d48581`: Sun `c25a1bc1a5958b3c`, Mercury `a646fd32007c7ab8`, Venus `4a0019eb37f2a74d`, Earth `a1573c1a4a29dc23`, Mars `353338cc5c905af5`, Jupiter `bf3a6fa3f51a1e4d`, Saturn `a301db93a38deae8`, Uranus `5afa91dfab8a6bc7`, Neptune `85801023ee439540` |
| Shots of the director | all 38 segments that are not travel, every frame at shutter open, middle and close, as JSON: one hash on main `3d48581`, on the branch and on the band branch, `59fcd7cfc0dc3120`, and each of the 38 segment hashes equal |
| 53 stop frames against main `3d48581` | 50 of 53 byte equal; the ones that differ are Saturn 3594, 3840, 3866, dive and rise frames that do not repeat on main itself (below) |

| Stop | Frames | Byte equal to main `3d48581` |
| --- | --- | --- |
| Sun | 0, 60, 90, 247, 360 | 5 of 5 |
| Mercury | 615, 717, 744, 870, 990, 1016 | 6 of 6 |
| Venus | 1185, 1287, 1314, 1440, 1560, 1586 | 6 of 6 |
| Earth | 1755, 1857, 1884, 2010, 2130, 2156 | 6 of 6 |
| Mars | 2325, 2427, 2454, 2580, 2700, 2726 | 6 of 6 |
| Jupiter | 2895, 2997, 3024, 3150, 3270, 3296 | 6 of 6 |
| Saturn | 3465, 3567, 3594, 3720, 3840, 3866 | 3 of 6 (not 3594, 3840, 3866) |
| Uranus | 4035, 4137, 4164, 4290, 4410, 4436 | 6 of 6 |
| Neptune | 4605, 4707, 4734, 4860, 4980, 5006 | 6 of 6 |

Mars on main `3d48581` and on the branch: 2325 `fd128b1a999f76fa`, 2427 `5636a9764d87cc2e`, 2580 `7322ef9576f06ffb`, 2726 `d408b434a0b12d9f`. Venus: 1314 `1ecbd247ee24f8f6`, 1560 `ecfdd43a3a4526e0`.

Against main `0bfe5690` the new main moved these of the 53 frames: 247, 615, 717, 1016, 1185, 1287, 1314, 1560, 1586, 1857, 2130, 2156, 2895, 2997, 3024, 3150, 3296, 3567, 3594, 3720, 3840, 3866, 4035, 4137, 4436, 4605, 4707, 5006.

Not run again on this tree (they stand on the base `0bfe5690`, next section): the Venus veil frames (they need `agent/venus`, which does not hold main `3d48581`), the review tier frame, a second render of Saturn on main, the ten extra frames where the cover pass is now skipped, the 53 frames of the band branch.

## Earlier proof on the base `0bfe5690`

All renders at the draft tier (1 sample), 1920 x 1080, one browser session per stop, main `0bfe5690` in a second tree, before main `3d48581` was merged in. Branch source as of `cdc37f4` (later commits are docs only).

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npm run build` | passes |
| `npm test` | 15 files, 79 tests, 0 failed (main: 14 files, 70 tests) |
| Engine hash | main `26442750f28b11e0`, branch `217e11ea6f2f48e4` |
| Nine stop hashes | unchanged: Sun `c25a1bc1a5958b3c`, Mercury `a646fd32007c7ab8`, Venus `4a0019eb37f2a74d`, Earth `a1573c1a4a29dc23`, Mars `353338cc5c905af5`, Jupiter `bf3a6fa3f51a1e4d`, Saturn `a301db93a38deae8`, Uranus `5afa91dfab8a6bc7`, Neptune `85801023ee439540` |
| Shots of the director | all 38 segments that are not travel, every frame at shutter open, middle and close, as JSON: one hash on main and on the branch, `7f7a8d821526d7ad` |
| 53 stop frames against main | 50 byte equal in each of two passes; the three that differ are Saturn dive and rise frames, which do not repeat on main either (below) |
| Extra frames where main's own cover pass is now skipped | 212, 1307, 1876, 2122, 2446, 2692, 3016, 4151, 4396, 4726: 10 of 10 byte equal |
| Venus's veil (`agent/venus` b6f5426 with this branch's `src/core`, `src/director`, `src/terrain`) | draft: 1304, 1310, 1313, 1314, 1318, 1324, 1552, 1556, 1559, 1560, 1561, 1565, 1568 byte equal (13 of 15; 1300 and 1307 do not repeat on `agent/venus` itself, below). Review tier, frame 1310, 128 samples: byte equal, 388.6 s before, 363.8 s after |
| Merge check (`git merge-tree`) | clean against main, `agent/travel` f4d0bd6, `agent/belt` b5ffb8e, `agent/venus` b6f5426 |

The 53 stop frames per stop (first pass on the source of `fd182e4`, second pass on the source of `cdc37f4`):

| Stop | Frames | Equal, pass 1 | Equal, pass 2 |
| --- | --- | --- | --- |
| Sun | 0, 60, 90, 247, 360 | 5 of 5 | 5 of 5 |
| Mercury | 615, 717, 744, 870, 990, 1016 | 6 of 6 | 6 of 6 |
| Venus | 1185, 1287, 1314, 1440, 1560, 1586 | 6 of 6 | 6 of 6 |
| Earth | 1755, 1857, 1884, 2010, 2130, 2156 | 6 of 6 | 6 of 6 |
| Mars | 2325, 2427, 2454, 2580, 2700, 2726 | 6 of 6 | 6 of 6 |
| Jupiter | 2895, 2997, 3024, 3150, 3270, 3296 | 6 of 6 | 6 of 6 |
| Saturn | 3465, 3567, 3594, 3720, 3840, 3866 | 3 of 6 (not 3594, 3840, 3866) | 3 of 6 (not 3567, 3594, 3866) |
| Uranus | 4035, 4137, 4164, 4290, 4410, 4436 | 6 of 6 | 6 of 6 |
| Neptune | 4605, 4707, 4734, 4860, 4980, 5006 | 6 of 6 | 6 of 6 |

Mars draft hashes as in batch 16: 2325 `fd128b1a999f76fa`, 2427 `5636a9764d87cc2e`, 2580 `7322ef9576f06ffb`, 2726 `d408b434a0b12d9f`. Venus on main: 1314 `21cdf3eac6043a63`, 1560 `c45003be3cf74070`, both passes.

Frames that do not repeat, whatever the engine:
- Saturn 3567, 3594, 3840, 3866 (see BATCH16.md). Five renders of the same four frames (main in batch 16, the batch 16 branch, main now, this branch twice) gave 3 different pictures of 3567, 4 of 3594, 4 of 3840 and 5 of 3866. Main now differs from main in batch 16 on 3594, 3840 and 3866.
- Venus on `agent/venus` b6f5426 with main's engine: 1300 gave `c8d7a02f55bae595` three times and `5cca46c3f5eeaa17` once; 1307 gave `4511956c35a48bd7` three times and `154a9908f61766ae` once. With this branch's engine: 1300 `1e381d6e0a1a0ac1`, `5cca46c3f5eeaa17` twice, `c8d7a02f55bae595`; 1307 `4ad53ccd49c5c447` once, `4511956c35a48bd7` four times. Not caused by this batch; the cause is not found.

Which frames skip the cover pass now (`cover.amount > 0` and `coverReaches` false, at mid shutter): on main, Sun 16 of 16 covered frames (amount 0.0001), Mercury 32 of 32 (amount at most 0.04, the pass never reached a pixel), Venus 3 of 32, Earth 5, Mars 4, Jupiter 4, Uranus 8 of 63, Neptune 4, Saturn has no cover. All by the amount rule. On `agent/venus` all 62 covered frames (amount 0.02, shell `[-2, -1]`).

The band branch `agent/engine-batch18-band` (`ae3c566` on the base `0bfe5690`): tsc clean, 15 files, 81 tests, 0 failed; engine hash `a95a59c28849765f`; nine stop hashes unchanged; shots hash `7f7a8d821526d7ad`; 53 stop frames against main `0bfe5690`: 49 byte equal, the four that differ are Saturn 3567, 3594, 3840, 3866, the frames that do not repeat. After the merge with main `3d48581` (`a8299d2`): tsc clean, 15 files, 81 tests, 0 failed, engine hash `4cc2cb53a2543013`, nine stop hashes unchanged, shots hash `59fcd7cfc0dc3120`; its 53 frames were not rendered again on that tree.

## Lines in `src/director/film.ts` (tree of `3f51122`), for the order of the merges

- (b) the sky turn ease: one block, lines 643 to 650, after `sets = [s]` and before `if (view === 'terrain')`.
- (a) the hidden share: two lines, 597 and 598, after the `coverHides` line.
- (d) `glareOf`: a method of its own, lines 457 to 472, above `shotAt`.
- The rise lift of main: lines 659 to 665 in the orbit branch, 510 and 548 in the travel branches. Eight lines that this batch does not touch (651 to 658) lie between the sky turn block and the rise lift. A travel commit that stays at 659 and below merges in either order.
- The band branch adds `bandOf` above `shotAt` and nothing near `riseLift`; in `sky.ts` one uniform and one shader line above `if (uGlow < 0.999) band *= uTerrainBand;`.

## Weak points

1. No stop sets a key yet, and no critic has seen one in use. (b) and (d) were rendered once, at draft, in a scratch copy of `agent/venus` with `skyTurnEase` on both moves and `glareCarry` 0.4 s (frames 1310 to 1318 and 1556 to 1568, looked at by me only). What that showed for (d): the carried Sun sits at the place the engine's Sun has in the terrain camera (0.665, 0.257 of the frame at the rise swap), which on Venus is up and left of the painted Sun at the horizon, and the engine's disc, which Venus's air dome hides on the terrain side, is in view as a hard disc at 1560 and 1561. By 1565 the carried Sun has left the frame at the top and its wide glow lies over the sky. So on Venus the key is not a cure by itself: the stop has to hide the disc on the orbit side too, or the sky pass needs a glare without a disc (one line in `sky.ts`, closed now).
2. (b) eases the turn only. `terrainSkyGlow`, the star rule of the terrain view and the sky patches still switch at the centre, and a patch slides against the stars while the turn eases. The sky is drawn at mid shutter, so the stars step, they do not streak: Venus's two turns are 2.89 rad apart, which is about 10 degrees per frame at the centre of a 1 s window. A cross fade of two skies was the other cure the Venus notes name; it needs two sky passes and is not built.
3. (a) `coverHidden` is not clamped and not checked against what the stop draws. A share that is too high under a cover that lets a bright edge through gives stacked copies, as with `coverHides`.
4. (e) The amount rule rests on the ranges of the cover shader's noise (fbm at most 0.9375, the rush noise within 0 to 1). Nothing ties `coverReaches` to the shader text: whoever changes the alpha line of the cover shader must change the bound. The shell rule (a shell out of the frame at a large amount) is hit by no frame of the film today, only by unit tests, among them 400 seeded shells checked against a ray grid. The time saved on Venus is from one run each (388.6 s to 363.8 s on frame 1310 at review, 128 samples, about 0.19 s per sample).
5. Frames that do not repeat: Saturn's four and Venus's 1300 and 1307 on `agent/venus`. For those the proof can only say that the differences are not larger than between two runs of the same code. Two stops now show it in the dive, so the cause may sit in the engine. Not looked into in this batch.
6. (c) is not on this branch. On its own branch it edits `sky.ts`; I kept it apart so that nothing closed is touched here.
7. `tests/plankeys.test.ts` builds its plans from Mars's `params` and `fit.json` (read only). It expects Mars's two sky turns to differ and the Sun to sit at different places in Mars's two cameras at the swap; a Mars plan change that removes either would need the test moved to another stop.
8. The 53 frames were proved at draft, as asked; review and final are left to the Builder's chain.
9. `coverHidden` returns `undefined` by default instead of today's product. The effect is the same (the sample rule falls back), but a caller that wants the number must compute `coverAmount * coverHides` itself.
10. The tree holds main `3d48581` by a merge (`3f51122`). What was proved again on that tree and what was not is listed under the first proof table. The Venus veil frames and the review tier frame stand on the base `0bfe5690` only; the merge brought no change to `src/terrain/cover.ts` or to the cover line of `engine.ts`, so I expect them to hold, but they were not rendered again.
11. The band branch: its merge with this branch had one conflict, in `STOP-AGENT.md` (two bullets added at the same place), solved by keeping both. Its frames on the tree with main `3d48581` are in the first proof section if they were rendered in time.
12. Batch 17 moved frames of main itself (247, 615, 717, 1016, 1185, 1287, 1314, 1560, 1586, 1857, 2130, 2156, 2895, 2997, 3024, 3150, 3296, 3567, 3594, 3720, 3840, 3866, 4035, 4137, 4436, 4605, 4707, 5006 differ between main `0bfe5690` and main `3d48581` in my renders, 28 of the 53, Saturn's four among them for their own reason). That is main's own change, not this batch; I name it so that nobody compares this branch against the old hashes.

## Working notes (read after a compaction)

- Repo `/home/user/workspace/repo` (this branch), `/home/user/workspace/edit` (band branch), `/home/user/workspace/dev` (scratch, `origin/agent/venus` with this branch's engine files overlaid, never committed), `/home/user/workspace/main0` (main, for shot hashes).
- Hash lists on main `3d48581`: `/tmp/t9-main.txt`, `/tmp/t9-branch.txt`. On the base `0bfe5690`: `/tmp/t8-main.txt`, `/tmp/t8-branch-a.txt` (first pass), `/tmp/t8-branch.txt` (second pass), `/tmp/e-main.txt`, `/tmp/e-branch.txt`, `/tmp/v-a.txt`, `/tmp/v-a2.txt`, `/tmp/v-b.txt`, `/tmp/v-b2.txt`, `/tmp/v-ar.txt`, `/tmp/v-br.txt`, `/tmp/t8-band.txt`. Scratch scripts in `out/scratch/` (untracked): `hashes.ts` (`--tier`), `hh.ts`, `stophash.ts`, `reach.ts`, `reach2.ts`, `glare.ts`.
