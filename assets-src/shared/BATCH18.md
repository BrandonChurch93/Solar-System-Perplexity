# Engine batch 18

Branch `agent/engine-batch18`, cut from main `0bfe5690`. Task from the Builder's mail 51 (01:20 UTC, 22 Nov), return DONE or PART at 03:00 UTC.

## Working notes (read after a compaction)

Rules of this batch: do not touch `src/space/sky.ts`, `src/space/dust.ts`, `src/space/travel/`, `src/space/belt/`, nor the travel and ending branches of `src/director/film.ts` (travel is editing them). Everything is off until a plan asks. No stop folder. Proof as batch 16: build, tests, engine hash, nine stop hashes, the 53 stop frames at draft against main, table here, each key in STOP-AGENT.md beside `coverWindow`.

Plan:
- (a) hidden share for the sample rule: `StopPlan.coverHidden(seg, time)`, base `coverAmount(seg, time) * (coverHides ?? 1)`; `CoverState.hidden`; `seenShare` in `src/core/motion.ts` reads it.
- (b) sky turn eased over the cover window: key `skyTurnEase { dive?, rise? }`, hook `skyTurnShare(seg, time)` (terrain share, null means today's switch); the stop branch of `film.ts` slerps the orbit turn and the terrain turn.
- (c) band only factor: needs one uniform in `sky.ts`, which is closed. Goes on a second branch `agent/engine-batch18-band` (one commit on top of this one) for after batch 17.
- (d) glare through the swap: key `light.glareCarry { dive?, rise? }` in seconds; the director carries the Sun's place on the terrain side into the orbit side as `SunState.glareDir`; `engine.ts` hands it to the sky pass (no change in `sky.ts`).
- (e) skip the cover pass when it cannot reach a pixel: pure function in `src/terrain/cover.ts` (shell out of the frame, or amount too small for any alpha), called in `engine.ts`.
- test for `skyGain`.

Main `0bfe5690` has the same `src`, `config`, `public` as `dba3ebc` (batch 16). Main's 53 draft hashes are rendered again in `/home/user/workspace/dev` into `/tmp/t8-main.txt`; the branch goes to `/tmp/t8-branch.txt` with `out/scratch/hashes.ts` and the groups in `/home/user/workspace/t8groups.txt`. Saturn's four dive and rise frames do not repeat (see BATCH16.md).
