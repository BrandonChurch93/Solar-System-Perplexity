# Harness notebook

Lab notebook of the harness agent (branch `agent/harness`). After a compaction: read `assets-src/shared/HARNESS-AGENT.md` again, then this file from the top.

## Where things are

- My clone: `/home/user/workspace/repo`, branch `agent/harness`. A second clone that plays the worker machine in tests: `/home/user/workspace/worker`.
- Files I own: `tools/round.py`, `tools/pack.ts`, this notebook. One new file under `tools/`: `tools/scratch_answers.py` (makes up critics' answers for scratch rounds, named in every report).
- Nothing under `src/`, `public/`, `config/` or `tools/lib/` is changed.
- Tests use the draft tier only.

## Facts read from the repo (2026-11-20, main at 7ba15bc)

- 46 segments, 47 judged frames. Fast kinds (`motion.fastKinds`): dive, rise, travel, retreat. Samples per frame: draft 1 and 1, review 4 and 16, final 16 and 64.
- The whole film pack of Phase 5 needs these rendered frames. Final tier: the 47 judged frames, the middle frame of `ending.fade` (the whole film sheets show one frame per segment, 46 in 4 sheets) and 7 more frames between 0 and 60 for the hook (9 hook frames, 0 and 60 are judged). Review tier: 12 frames for each of 8 travel segments and 3 ending segments.
- Cost on a worker, from the brief: a slow final still 40 to 95 s, a slow review frame 10 to 25 s. That is about 4.3 s per sample. A fast frame costs four times a slow one at the same tier (`kit/PROGRESS.md`, Render budget, Mars).
- `pack.ts` before my change: `--only` exists for one stop (`part()`): the word `stills` renders the stop's judged frames into `out/work/stills/`, a segment id renders its motion sheet into the round's cache, `ID-cover` its cover sheet. The hook rendered its 7 middle frames into a temp folder that is deleted, so a later run rendered them again.
- `stress.ts` writes `out/work/stress/<segment>-before-NNNNN.png`, `-after-NNNNN.png` and `<segment>.json` (a record for the segment). The PNG files have no record of their own.
- `round.py` before my change handles only `R3-part1` and `R3-part2`. The Sun has 5 judged frames (0, 60, terrain, rise, hold), which makes 3 parts. Reported to the Builder.
- A draft still of `mars.hold` takes 18 s here with the set load (4 cores).

## Decisions

1. Scratch mode (`--scratch`, round above 900) swaps two paths and switches git off: the ledger is a copy of `kit/PROGRESS.md` at `out/work/rounds/scratch/PROGRESS.md`, the scorecards go to `out/work/rounds/scratch/scorecards/`. Every other line of code is the same as in a real round, so the scratch run tests the real code. A round above 900 without `--scratch` is refused, and `--scratch` with a round up to 900 is refused.
2. Tiers below final are allowed in scratch mode only (`--tier draft`); the tool then adds `--tier draft --motion-tier draft` to every pack command and `--tier draft` to stress and measure.
3. Whole film part names for `npm run pack -- --phase 5|6 --round N --only ...` (no `--stop`): `stills:A-B` (every final tier frame of the whole film pack with A <= frame <= B: judged frames, whole film sheet frames, hook frames, all kept in `out/work/stills/`), `film-K` (whole film sheet K), `holds` (the grid of judged hold frames), `hook` (the phone size hook images), a segment id (its motion sheet), `ID-cover`. With `--stop` the old stop names keep their meaning.
4. The record round's pack (Phase 6) publishes one folder per stop and critic (`R1-mars`, `R3-mars-part1`, `R4-mars`), the whole film folders without a stop (`R3-part1`, `R4-part1`, `R5`, `R6`, `R7-part1`, `R2-part1`, `R8-part1`). Each R2 image is judged once; a stop's R2 is tallied from the votes on its own two frames and two controls, the whole film R2 from all of them.
5. Jobs are packed by expected minutes from a cost model (samples per frame times `--sample-seconds`, default 4.3) to at most `--job-minutes` (default 15) and spread over `--workers` (default 8); a worker gets several jobs in a row.
6. The record round collects its controls itself by default; `--controls-from N` reuses those of round N.
7. In whole film and record rounds a failed R2 is counted as one major issue in the round line, as the kit says. The stop round's line is left as it was.

## Log

- 2026-11-20: cloned, read the brief and the files it names, set up, wrote this plan.
