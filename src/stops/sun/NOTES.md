# The Sun's stop: hand over at the move on

Written 26 November 2026, 20:53 UTC, on the Builder's MAIL 1548 (Brandon said move on; the freeze is 21:30 UTC; no new cure, trial or proof run after 20:47). The long notebook is `assets-src/sun/NOTES.md`; this file is the short state.

## What the state is

Branch `agent/sun-place`. It holds two states.

1. THE NAME: 5ccff1674ccb3ed7fab80c6f251aee1e8d989d53, named to the Builder at 17:05 UTC on main 2f5b2eb3. It is the one state of the Sun that may ride the freeze (MAIL 1548 point 3). The arch of the close view is a body: 150 arches of strands in three dimensions, beads that move along standing strands, a fountain at each foot, a rigid sky (plain stars behind the arch).
2. THE HEAD: candidate Z113, NOT NAMED, its proofs not whole. It is the name, then commit ea6d408d (`arcs.ts` and `arcs.json` alone), then merges of main up to d1bfb03e7fbe8eef65168d1dc9919559ea2f8592 (which holds the fifth cut 262b9a68), then this file and the notebook. Against the name, in the arcade alone:
   - the strand's colour: the hot share goes by the square of the light (`heat`), a colour over `light.most` keeps its hue (`limit`), the colour follows the light across the tube's width (pale core, orange flanks);
   - two passes over the same lines: a shade that hides what is behind the arcade, then the light, where strands add over each other up to the most (the head comment of `arcs.ts` says it);
   - 115 arches (were 150), thick and thin strands (`main.radius` [0.0006, 0.0036], `thinGain` 0.4), a tall pool of light inside each leg.
   All values live in `arcs.json`.

## What is proven on the head

Measured on 59cdcaea47bde238469e831a1ccb40a58ca65c09 (the parent of the commit that adds this file; that commit touches notes alone):
- `npx tsc --noEmit -p .` exit 0. `npm test`: 95 files, 1106 tests passed. `npx vitest run tests/globe-cap.test.ts` alone: 30 passed.
- Drafts 0, 60, 90, 91, 92, 360 are the same files as on the merge before the fifth cut (2938704d). Draft 360 is the named tree's file (sha256 73fed934b975cd44): the hold is not touched.
- Finals against the approved picture (`tools/measure/g17.py` and the plain match, on this machine; main's finals are of the main before the third cut):
  - frame 0: G17 median 0.8058, p25 0.4409 (the name 0.8042, 0.4211); plain match 40.2513 (the name 40.7016);
  - frame 60: G17 median 0.9893, p25 0.5336 (the name 0.9722, 0.5253; main 1.2148, 0.5842); plain match 35.2005 (the name 35.1217, main 33.5646);
  - frame 90: G17 median 0.8600, p25 0.4984 (the name 0.8250; main 1.2777, 0.5223); plain match 34.1142 (the name 34.0131, main 29.6374).
  Finals 0 and 90 were drawn on 2938704d, final 60 on 59cdcaea.
- Seen at draft: 90, 91, 92 the strands stand and the beads move; in the rise (211, 216, 221, 225, 229, 233) the arcade leaves by its size, no pop seen on these six frames.

## What is NOT proven on the head

Stopped at 20:50 UTC by MAIL 1548: the order proof (frame 90 alone, after 495, after 735, after 60), `npm run build`, the gate (`npm run gate -- --phase 6 --only G11,G15 --g15-stops sun`), the path line (`npx tsx tools/smooth.ts --stop sun --only path`), `npm run cues` and `npm run shots` (no change under `cut/`), the strip 70 to 150, the final of 90 after the merge of the fifth cut, the final of 360, the rise at the review tier, the clip at 60 frames a second. So the head is not a name. The name's own proofs are in the notebook and in the Builder's decisions d385 to d393.

## What is still wrong, by frame and place, worst first

1. Frames 0 to 179, the sky behind and through the arch: plain stars. The approved picture has the Milky Way from the upper left down to the limb. The rigid sky was taken by MAIL 1463 (no slide of the sky against the Sun's body). True of the name and of the head.
2. Frames 0 to 179, the arch: the strands are sharper and more wiry than the approved's soft glowing ropes. On the head at final 90: the left leg is dimmer than the approved's (box 158.0 against 191.5), the hollow darker (89.1 against 100.3), one faint red strand lies under the band, the left fountain's loops are thin. The name's arch is denser and more even (the Builder's words in d385).
3. Frames 0 to 179, the near ground in the lower third: the bright shapes are wider than the approved's (`sun-near.py` at final 60: half width 8.0 px against 4.8, distance of the band tables 0.077). Main's ground is the same ground. A ground from code stands on `agent/sun-lab` 045a88cb, held by d388.
4. Frame 0: G17 stands on the line (limit 0.8): 0.8058 on the head and 0.8042 on the name by this machine, 0.802 for the name on the Builder's machines.
5. Frames 211 to 233, the rise: the close ground gives way to the globe's map and the corona's rays come in between 225 and 233. The reader's rows of the name are green, its pattern rows above main's (0.3493 at 224 and 0.3803 at 225 against 0.3130 and 0.2452, d390).
6. Frame 495, the travel out: the far Sun of the name is not main's bytes (it wears the stop's gas, d385).
7. The plain match to the approved is worse than main's at 60 and 90, because main's arch is the approved's own pixels on a card (d385 (3) rules that it does not decide).

## How to go on

- To make the head a name: run what the list above lacks, on the head merged with the newest main (never rebase), one render at a time; then `git ls-remote origin main`, and the name mail in the form of MAIL 508 and MAIL 1510.
- To go back to the name's arcade: `git checkout 5ccff167 -- src/stops/sun/arcs.json src/stops/sun/arcs.ts`.
- The Milky Way behind the arch: the engine's change stands on `agent/engine-sky-seen` ac6be4de12a8e86920a50984479e031355935b15 (the handover engineer's, not on main). With it the Sun's plan says `skyAim: { ...as it stands, dive: [70, 156.637, -6.267], turn: [90, 269], seen: true }`; my own two edits of the trial are `assets-src/sun/sky-seen-own.patch` (add `seen: true`). Measured by the engineer: the sky's turn is at most 0.419 degrees a frame (212 to 213), the stars step 5 to 11 px from 180 to 181 while the ground stands. The turn runs by the clock and is seen: the Builder's to rule.
- The arch, next by MAIL 1463: a glow about the ropes that does not fill the dark gaps; bolder low loops at the left fountain; brighter legs. What was tried and why it failed is in the notebook under Z82 to Z115 (wide strands near the foot read as noodles; a lower `light.knee` makes cream, not gold; `light.floor` under 0.9 takes the fire).
- Frames: `npx tsx assets-src/sun/place/frames.ts --frames LIST --tier draft|final --dir out/work/sun/t/NAME`.
