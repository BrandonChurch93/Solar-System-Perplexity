# Brief for the harness agent

You extend two tools of this repo so that the whole film rounds of Phase 5 and the record round of Phase 6 run the way the stop rounds of Phase 4 already run. You change no picture: nothing under `src/`, `public/` or `config/`.

## Read first

- `AGENTS.md`, every file in `kit/addenda/`.
- `kit/07-QUALITY-BAR.md` in full: Packs, The critics, R1 to R8, The pass bar, Rounds and their limits.
- `kit/08-BUILD-ORDER.md`: Phase 5 and Phase 6.
- `tools/round.py` and `tools/pack.ts` in full, and `assets-src/shared/RENDER-WORKER.md`.
- One finished round as an example of what the tools write: `scorecards/round-005/`.

## Where you work

- Branch `agent/harness`, started from `origin/main`. Push it after every step that works. Only the Builder writes `main`.
- You own `tools/round.py`, `tools/pack.ts` and a new notebook `assets-src/shared/HARNESS-NOTES.md`. If you need another file under `tools/`, say so in your report, do not change files under `tools/lib/` that the renderers use without naming them.
- One render process at a time on your machine.
- Rules that are easy to break: no em dashes and no exclamation points in any copy, file name or message; no model names in anything that reaches the interface or the README; almost no code comments; never reword a rubric or a jury text (they are read from `kit/07-QUALITY-BAR.md` word for word by `tools/rubric.py`); critics receive attachments only, with neutral names.

## How a stop round runs today

`python3 tools/round.py <step> --round N`:

- `start --stop ID` writes the round line into `kit/PROGRESS.md` and pushes it before anything else, mirrors the stop's branch, builds, runs the tests and the gate, commits, pushes.
- `jobs --stop ID` writes `out/work/rounds/round-NNN/jobs.json`: about seven messages, each a job for a render worker (`npm run pack -- --phase 4 --round N --stop ID --only ...` at a named commit, the cache packed into a tar and sent back as attachments).
- `place` unpacks what the workers sent into the round's cache.
- `pack` runs `npm run pack` here, which finds every picture in the cache and renders nothing, and writes `critics.json`: for each critic its neutral name, model, attachments and message.
- `votes` takes the jurors' one line answers; the JSON critics' answers arrive as files.
- `close` reads every answer, applies the pass bar, writes `scorecards/round-NNN/` and the round line, final scores and status in `kit/PROGRESS.md`.

## What to build

1. `tools/pack.ts`: with `--phase 5` or `--phase 6`, `--only` renders the named parts into the round's cache and nothing else, as `part()` does for one stop. Choose the names so that every part of the whole film pack can be made on its own: the judged stills by frame range, each whole film contact sheet, the grids of the judged `hold` frames, the hook frames, each motion sheet by segment id. A later full run on another machine with the same commit must find all of it in the cache and render nothing. Prove that with the records and a timing.
2. `tools/round.py`, whole film rounds (`--whole`, Phase 5): `start`, `jobs`, `place`, `pack`, `votes`, `close`.
   - `jobs` splits the pack across about eight workers so that no job is expected to take more than about 15 minutes at the tiers the pack uses (final for stills and whole film sheets, review for motion sheets; a final still takes 40 to 95 s on a worker, a review frame 10 to 25 s), and adds one job for `npm run stress` that returns the before and after stills under `out/work/stress/`. `place` puts those where `pack.ts` reads them.
   - Critics of a whole film round: R5, R6, R7; R3 and R4 on the `travel` segments and the ending; R2 on its whole film list. No R1 and no R8. The controls of R2 are collected once more in the first whole film round and reused in later whole film rounds, as the kit says. Families and their rotation as in the stop rounds.
   - `close` applies the whole film pass bar of `kit/07-QUALITY-BAR.md` and writes the same kinds of files a stop round writes.
3. `tools/round.py`, the record round (`--record`, Phase 6): the measures and every critic once, on the full judged list, from one commit. That is all nine stops' R1, R3, R4, R8 and R2 with the whole film parts above, in one round number, with one `SUMMARY.md` that carries a table of every stop's scores and the whole film scores, and the "Final scores" table in `kit/PROGRESS.md`. The measures of a stop come from `npm run measure -- --stop ID`, which a worker can run; say how their results come back.
4. A scratch mode that touches nothing shared: with it, the tool writes no line into `kit/PROGRESS.md`, no `scorecards/` folder, makes no commit and no push, and uses a round number above 900. Use it to run a whole film round and a record round from `start` to `close` at the draft tier on your machine, with answers you make up for the critics (a few that pass, a few that fail, a juror that answers in an odd form), and check the tallies by hand.

## What must stay as it is

- A stop round must behave exactly as before. Run one in scratch mode before and after your change and compare the files it writes.
- The answer formats, the jury text, the rubric text, the neutral names, the shuffle of the jury images.
- The cache rule: a picture is reused only when its record carries the same engine hash, the same stop hashes for the stops it shows, the same tier and format.

## Reports

Message the Builder (`/root`) when part 1 works, when part 2 works, and `DONE` at the end: the commits on `agent/harness`, how to run each new step in one line each, what the scratch runs showed, and what is not covered. A message is not a question. Do not wait for a reply.
