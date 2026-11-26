# Venus: the state of this branch at the freeze (26 Nov, 20:48 UTC)

The notebook with every mail, control and number is `assets-src/venus/NOTES.md`; the recipe of the pictures is `assets-src/venus/RECIPE.md`. This file is the short way in. MEASURED, STATED and UNKNOWN are kept apart.

## What the state is

- Branch `agent/venus-place`. The state is commit c9bb399ca86bba589fff8d2106d5c7e0422a2a2d plus notes. It holds main 262b9a68df0a6bda8d77518539580de554bb0dc5 (the fifth cut), merged, no conflict.
- Against main it changes: `src/stops/venus/assets.ts`, `plates.json`, `relief.ts`, `set.ts`; the ten dive plates `public/assets/venus/{full,web}/place3-{w,a-light,b-light,c,d-light}-dive.jpg` (376,390 bytes more than main's; the Builder's word for up to 400,000 is MAIL 1539); notes.
- It is the cure of one fault of round 58 (MAIL 1534, point 1 (a)): on main, at the dive's handover, frames 1337 to 1340, the border of the surface picture is in frame (a dark strip with slanted stripes at the lower right).
- It is NOT on main. By MAIL 1548 (Brandon: move on; the freeze at 21:30 UTC) it stays on this branch. All runs were stopped at 20:48 UTC.

## The cause and the cure (MEASURED by controls, draft tier, rate 2)

- Cause: where the sight of the dive passes the lower end of the close ground (1328 to 1341), main's ten dive plates hold another picture than the ground, so the end of the ground stands as a straight cut over a dark strip. Controls: with the ground off the plates run on whole, no cut; from the eye of T turned down 34 degrees the plates under the end of the ground hold small pebbly cells where the ground holds towers; the eye of T has not moved since the plates were laid (position equal, axes within 0.02 degrees); 8546202d (25 Nov) took the wider picture out of the plates for a pattern number.
- Cure, two parts that need each other: (1) the wider picture of step 10 of the recipe back in the ten dive plates (the plates of 2bf1a398, byte for byte); (2) the end of the ground on the globe side laid flat on the deck and faded by its forms (`relief.ts`, uniform `uEnd`; `plates.json`: `ground.flat.end` [0.03, 0.4], `ground.flat.most` 0.985, `ground.matte.end` 0.03). Part (2) alone leaves the cut; part (1) alone read 0.67 in the corner on 25 Nov.
- The camera's path is not touched (the Builder's word, MAIL 1539).

## What is proven (MEASURED)

- Units on c9bb399c: tsc clean; vitest 95 files, 1106 tests passed.
- Whole dive, draft, rate 2, drawn on 0d69f4f4 (this state before the merge of 262b9a68; main's Venus folders are the same on both), against main's whole dive:
  - stills equal by sha at 1240 to 1266 + 1/2 and from 1343 (T) on; different at 1267 to 1342 + 1/2;
  - corner rows 1328 to 1333, pattern: 0.37, 0.35, 0.30, 0.31, 0.33, 0.34, 0.30, 0.32, 0.27, 0.28, 0.23 against main's 0.37, 0.37, 0.35, 0.38, 0.41, 0.48, 0.50, 0.49, 0.55, 0.53, 0.50;
  - rows over the pattern limit 0.45: 22 against main's 28; largest pop 1.0866 at 1270 on both; largest level step 0.3363 at 1287 + 1/2 on both.
- Seen by me on every draft frame 1327 to 1344 beside main's: the dark strip with slanted stripes at the lower right is gone from 1331 to 1341; no straight line found.
- On c9bb399c, the slice 1265 to 1286 + 1/2 (44 stills): equal by sha to the same stills drawn on 0d69f4f4. On main 262b9a68 the same slice: equal by sha to main's stills before the fifth cut.

## What is still wrong in this state, by frame and place

- RED, MEASURED: the dive's largest pattern reads 0.6513 at 1275 + 1/2 (pixel 1361, 858) against main's 0.6213. Seven placements of the same stills, rows 1273 to 1278: this state 0.6513, 0.5924, 0.6319, 0.6096, 0.5902, 0.6071, 0.5565 (placements 0,0; 1,0; 0,1; 1,1; 2,0; 0,2; 2,2). Main, six of seven read before the stop: 0.6213, 0.5708, 0.6235, 0.5966, 0.5844, 0.6112 (2,2 not read). This state is higher in five of the six. The stills differ from main's there by 296 pixels of 1 level at 1275 + 1/2; I see no difference at one to one. What in the picture moves the number is UNKNOWN.
- RED, SEEN at one to one (draft): 1327 to 1335, lower edge, x 700 to 1920: the cumulus under the end of the ground is larger, paler and softer than the ground beside it.
- RED, SEEN: 1332 to about 1354, lower left margin: a large soft tower stands as a block (it is in the ground's left extension, canvas x under 0). Main shows it too (STATED by the Builder from round 58: a blocky wall at the lower left margin). Not started (state A2).
- MEASURED: row 1335 reads 0.3770 against main's 0.3108 (under the limit). Rows over the limit that read higher than main's by less than 0.005: 1275, 1276 + 1/2, 1277 + 1/2, 1311, 1324, 1325, 1325 + 1/2.
- SEEN: at 1338, in the darkest part (levels 5 to 8 of 255), a level step of about 1 level is left; I do not see it without lifting the picture.

## What is UNKNOWN (the runs were queued and did not run)

- The four judged frames at final tier (1185, 1287, 1440, 1586) against main's. The draft stills of 1287 differ from main's by sha (the dive's stills differ from 1267 on), so the final of 1287 is expected to differ; it was not drawn. Whether 1586 differs is not known: the flat end of the ground also acts in the rise after 1539.
- The rise with this state (no still of the rise was drawn with it).
- The corner rows 1328 to 1333 drawn on c9bb399c itself; the path lines (`npx tsx tools/smooth.ts --stop venus --only path`); the gate (G11, G15, G17); `npm run cues`, `npm run shots` and the state of `cut/` after them; review tier stills of 1332 and 1338.

## How to go on

1. Prove this state before any merge. On this tree and on main's tree (check out main's `src/stops/venus` and `public/assets/venus`, build, measure, check the take's back): `npm run smooth -- --stop venus --kind dive --only pictures --frames 2656-2666` (corner rows; frames are counted in half frames, k = 2 times the film frame); `--kind rise --frames 3070-3112` (1535 to 1556); the whole dive and rise once; `npm run still -- --frame N --tier final` for 1185, 1287, 1440, 1586; the path lines; the gate; cues and shots.
2. The pattern line at 1275 + 1/2 and the pale cumulus have one likely cure, not tried: a next take of step 10 of the recipe that keeps the tones and the coarse forms of the plate it is laid into and brings only the fine forms of the wider picture.
3. Then, in the Builder's order (MAIL 1534): A2, the block at the lower left margin (1332 to 1354); B, the rise's handover (1541 and 1542 a dark level band across the Sun's glow, 1544 and 1545 streaks at the left edge; controls of 26 Nov: with `air.sun` off the glow and the bands go together, so the bands are in the Sun's part of the air; the pale cells at the left edge stand with the ground off, so they are in the plates and the air); (c) and (d), one light and one sky on both sides of each handover (1309 to 1317, 1550 to 1557); then the globe at 1586.
4. Laws that bind any next state are in the notebook: the judged frames keep their camera to the byte, nothing comes or goes with the clock, no cure by values before the cause is named, the hold must not pay for the rise.

## This machine at the freeze (none of this is on origin)

- To make room for the master (MAIL 1548, point 5) I removed, on this machine only: the frame folders and sheets of the proof runs under `/tmp`; this tree's own copies of `public/`, `references/`, `audio/`, `scorecards/` and `dist/` (`git checkout -- public references audio scorecards` and `npm run build` bring them back); and 208 working files, 2390 MB, under `out/work/venus`.
- Those 208 files are, by their names (not checked file by file), files that the recipe's tools write: the float states `*.npy` (among them `hold/logq.npy` and `hold/rim.npy`, the state between the passes of the hold's fit, and `wrap/hero-emis.npy`), the assembled, laid and levelled plates as PNG (`place/{w,a,b,c,d}/plate-*.png`, `comp-4096.png`, `tiles-4096.png`, `place/t/*-round*.png`, `place/t/dive-*.png`, `place/levels/`, `place/laid-*.png`), the patches as PNG (`patches/{a,a2,b,c,c-test,d}-4096.png`), the maps `wrap/*-eq*.png`, and survey and test stills. To go on with a step of the recipe that reads one of them, run the step before it again.
- Kept under `out/work/venus` (1627 MB): every image take, every input of a take, the folders `cap/`, `gen/`, `more/`, the `bak/` folders, every JSON file. They exist on this machine only.
- Main's tree stands apart at `/home/user/workspace/master` (a worktree at 262b9a68, built).
