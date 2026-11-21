# Engine batch 16

Branch `agent/engine-batch16`, cut from main `c6ba9432`. Assembled by the engine profiler on its own VM (4 cores, SwiftShader). This file is the proof the Builder asked for; the working notes at the end are for the profiler itself.

## What is in it

| Step | Commit | What |
| --- | --- | --- |
| 1 | `dd63f4c` | merge of `agent/belt` at `4e8aadea` |
| 2 | `c6b82e5` | merge of `agent/engine-perf` at `837adbbb` (the cure after a restored drawing context, `coverWindow`) |
| 3 | `6ae9856` | merge of `agent/travel` at `7d5ffe7e` |
| 4 | see log | Saturn's engine request 2: `StopPlan.skyGain(time)`, 1 by default |
| 5 | see log | `StopPlan.skyUnderCover(amount, time)`, `Math.pow(1 - amount, 2)` by default |

## Working notes

Task received 22:58 UTC, 21 Nov. Order of work: merges, Saturn patch, `skyUnderCover`, build and tests, draft hashes on main (second tree `/home/user/workspace/dev` at `c6ba9432`) and on the branch with the scratch script `out/scratch/hashes.ts` (one browser session per stop, `renderPngFresh`, the same bytes as `npm run still`), then this table, push, message `BATCH16 READY <commit>`. Hash lists: `/tmp/t6-main.txt`, `/tmp/t6-branch.txt` (frame, sha256, seconds, samples). If a stop frame differs: bisect over the five steps, say so, do not touch a stop folder.
