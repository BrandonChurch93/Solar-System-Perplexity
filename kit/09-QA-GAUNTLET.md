# 09 · QA gauntlet

Run every item at the end of Phase 6. Record the evidence for each in `kit/PROGRESS.md`. One failed item means the build is not complete.

An open item from a round limit does not fail the gauntlet. A missing record of it does.

## The film

| No. | Item | Evidence |
| --- | --- | --- |
| 1 | Frame 0 is a finished picture with no fade in | The still |
| 2 | Every segment in `segments` appears, in order, showing what `kit/01-FILM.md` lists for it | The whole film contact sheets |
| 3 | There is no visible cut anywhere in the film | The R4 result for every stop and the R5 result |
| 4 | No people, spacecraft, text, logo or interface in any frame | Contact sheets and the R3 results |
| 5 | The last frame is black | The still |
| 6 | Each clip starts and ends on the frames `kit/01-FILM.md` defines | `ffprobe` frame counts against the counts computed from `segments` |

## The picture

| No. | Item | Evidence |
| --- | --- | --- |
| 7 | The record round ran every critic on the full judged list from the final build | The record round `SUMMARY.md` and the build hash |
| 8 | Every judged `hold` and `terrain` frame has a comparison image from the final build | File list with records |
| 9 | Every open item is logged with its stop, its frame, the critic's words and what was tried | "Open items" in `kit/PROGRESS.md` |
| 10 | The stress encode was judged | The R7 result |

## The machine

| No. | Item | Evidence |
| --- | --- | --- |
| 11 | G1 to G16 are green | `npm run gate -- --phase 6` output |
| 12 | A clean clone builds and renders frame 0 identically | Hash of frame 0 from a fresh clone against the committed still |
| 13 | `src/` takes frame rate, duration, formats, tiers, stops, segments, thresholds and names only from `src/config.ts` | Search of `src/` for those values, with every hit explained |
| 14 | No `Math.random`, `Date.now` or `performance.now` on any path that affects a pixel | Search output with each remaining use explained |
| 15 | Export proof exists and `ffprobe` accepts the file | `ffprobe` output |
| 16 | `export` mode shows progress and time remaining, and memory stays flat across a `travel` segment | Log of memory readings |
| 17 | `npm run build` output works from a subfolder path | A still rendered from `dist/` served under a subfolder |
| 18 | The published app plays the film in `autopilot` and jumps to every stop in `live` | A still captured from the published URL at three different stops |

## The repo

| No. | Item | Evidence |
| --- | --- | --- |
| 19 | `ASSETS.md` lists every third-party file, and every generated asset has a recipe | G11 result |
| 20 | Nothing under `references/approved/` has changed | G12 result |
| 21 | `cut/SHOTS.md` and `cut/CUES.md` are committed and match the final timings | File list and a check against `segments` |
| 22 | `out/roughcut.mp4`, `out/preview.mp4`, nine clips in `out/clips/` and `out/stills/` are committed | File list |
| 23 | Every round has a folder in `scorecards/` | File list |
| 24 | `README.md` has the app URL, how to fly it, how to export, and any credit the post must carry, with no em dashes and no model names | The file |
| 25 | Everything is pushed | `git status` and `git log origin/main -1` |
