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

State at 01:42 UTC (notes, replaced by the report below when done):
- Head of `agent/engine-batch18` is `cdc37f4`: (a) `7c1ba3e`, (b) `6fdb0c2`, (d) `83327fb` then `8ebe2c2` (the glare's place is asked from the director by the engine, `FilmDirector.glareOf(shot)`, so `shotAt` and `SunState` are untouched and the merge with `agent/travel` is clean), (e) `c981b66`, tests `fe2123f` and `fd182e4`, docs `6597742` and `cdc37f4`. 15 test files, 79 tests pass.
- (c) is on `agent/engine-batch18-band` (`ae3c566`, one commit on top): `light.bandLow [from, to, level]`, `StopPlan.skyBand`, `FilmDirector.bandOf`, `Sky.setBandGain`, `uBandGain` in `sky.ts`. Merges cleanly with `agent/travel` f4d0bd6 (checked with `git merge-tree`). Worktree `/home/user/workspace/edit`.
- First pass of the 53 frames (code of `fd182e4`) against main: 50 equal, Saturn 3594, 3840, 3866 differ (and main differs from its own batch 16 render on the same three). Second pass on `cdc37f4` running into `/tmp/t8-branch.txt`.
- Still to do, one render at a time: Venus tree (`/home/user/workspace/dev` at `origin/agent/venus` b6f5426, no engine diff against main) frames 1304 to 1318 and 1556 to 1565 before and after `git checkout cdc37f4 -- src/core src/director src/terrain`; extra frames where main's cover pass is now skipped (212, 1307, 1876, 2122, 2446, 2692, 3016, 4151, 4396, 4726; list from `edit/out/scratch/reach.ts`); 53 frames on the band branch; hashes with `out/scratch/hh.ts`; then the report here and the DONE mail.
