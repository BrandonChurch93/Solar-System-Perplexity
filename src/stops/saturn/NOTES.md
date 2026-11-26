# Saturn, branch agent/saturn-code: the state at the freeze of 26 November 2026

Written at 20:53 UTC after MAIL 1548 (Brandon has said move on; the freeze is at 21:30). This file says what the
head of the branch is, what is proven, what is still wrong by frame and place, and how to go on. The long record
is `assets-src/saturn/NOTES-CODE.md` (read its last sections first).

## What this state is

NOT A NAME. NOT PROVEN. Nothing of it rides the film. The kept build is main (code sha 262b9a68), which carries
this branch's last name, the lens cure 5075e26d. Main 262b9a68 is merged into this branch (merge 14fe5a63).

The head holds the work of MAILS 1521, 1535 and 1543, stopped in its third step:

1. The thin sheet inside the inner rim follows one law (commit ed11ee09: `sheet.ts`, `grains.ts`): nothing
   reads the eye's height, the frame or the clock. Mailed at 19:00 with its measures.
2. Pose W of frame 3720 (`skim.json` pose: azimuthDeg -2.92, foot 2.269, height 0.215, yawDeg 25.98, tiltDeg
   9.99, rollDeg -6.70, vfov 62.06; `inner.depth` 0.05, 0). Taken by the Builder as the target of 3720: the globe
   stands as a dome at the upper right and the ring crosses in front of its foot, as in the approved picture.
   The lens stands at 62.06 through the whole skim (3630 to 3809); the skim's flow is 0.28 of main's numbers
   (`path.forward` 0.3362, `path.side` -0.1788) so that the disc never shrinks on the way in.
3. The lens law `even` for both moves (`plan.ts` `lensEven`; `skim.json` `lens.moves`, `lens.even.steps`): one
   function of the eye's distance for each move. The disc's rate goes from the rate of the motion before to the
   rate of the motion after in one straight ramp, never more than the path's own rate; the lens is what is left.
   The paces of both moves (`skim.json` `handover.dive`, `handover.rise`) were searched for this law.
4. The tone at W, in the middle of a trial (state W5): the ring's table by radius is main's again, the ringlets'
   amplitude (`light.grade.radial.fine.gain`) is taken back to as low as 0.5, the sand is at 0.7 of main's size
   (`grains.json` levels: cell 0.00084, size 0.00035 to 0.00091, height 0.0014). The globe's table by latitude
   is the refit of commit 52e8d97e.

## What is measured on this tree (all by my own runs, 20:38 to 20:52 UTC)

- `npx tsc --noEmit`: clean.
- The path part of the smooth tool, all nine stops: green each (20:46). Saturn's rows at rate 2, mine and
  (main 262b9a68): dive: rate step 0.068 (0.066), turn 0.062 (0.062), speed 0.068 (0.069), seam out of the speed
  0.067 (0.027), fall before on the turn 0.021 (0.000). Rise: rate 0.060 (0.053), turn 0.055 (0.073), speed 0.056
  (0.065), seam in 0.043 (0.045), seam out 0.035 (0.029). Limit 0.08, fall and climb 0.03.
- The disc of the globe, percent a frame, at whole and half frames: on the way in (3540 to 3720) the rate is
  never under +0.022; largest change of the rate in the dive 0.0110. In the rise (3810 to 3885) the rate is never
  over 0; largest change 0.0202. Main's rise: 0.0385 at 3851, over the bar of 0.035.
- The lens never turns back in either move (0 of 180 and 0 of 148 half frames). Dive: 32.942 at 3540, 39.628 at
  3570, 52.874 at 3600, 62.06 at 3630. Rise: 62.06 at 3810, 52.869 at 3840, 36.452 at 3864, 30.016 at 3884.
- Frame 3720 at the final tier (rendered 20:38, before the rise's paces changed; the rise's paces do not enter
  the skim): the plain difference to the approved picture 32.72 (main 28.51; commit 52e8d97e 30.95; W with all
  of main's tables 34.45).

## What is NOT measured on this tree

- The reader's rows (pictures part) of the dive and of the rise: no run. Main's rise rows on 262b9a68 were
  started at 20:44 and stopped at 20:49 by MAIL 1548, no result. Main's dive rows exist only on my machine.
- The finals of 3465, 3567 and 3866: not rendered. No strip of 3567 to 3720, no clip of the skim.
- The browser unit tests (vitest): not run on this tree.
- So nobody has seen this state move. It must not be merged as it is.

## What is still wrong, by frame and place

On this branch:
- 3720, whole frame: the ring's level by radius is not refitted at W. The near ring at the lower left is darker
  than the approved and has dark lanes 10 to 30 px wide between its ringlets; the approved is light, soft, even
  lines. A thin light band is left at the outer edge of the dense ring against the gap (about x 390, y 460 to
  x 1390, y 1060). The plain number is 4.2 worse than main's.
- 3720, upper right: the globe's bands are softer than the approved's near the terminator and the dark side
  takes more of the disc. Not worked on.
- 3885, the rise's end: the lens's rate ends in a corner (0.115 percent a frame at 3884, nothing at 3885). The
  path tool reads it green (speed 0.035 of the mean at the seam). A rounded end of the ramp is not built.
- The ring's shadow on the globe is not built (taken as stated by the Builder, MAIL 1543 point 5).

On main (262b9a68), Saturn's open items as I know them:
- 3630 to 3809 (judged at 3720): the eye stands too high over the plane and the globe hangs into the ring's
  opening; the approved picture has it as a dome behind the ring (critics of round 57, MAIL 1518; seen by the
  Builder). Pose W here answers it and is not proven.
- 3630 to 3809: hard striations with speckle on the near rings, streaks at 3744 to 3776, a smear of the near
  rings at 3866 (critics of round 57). Cause not proven by me.
- 3810 to 3884: the disc's rate changes by 0.0385 at 3851 (my measure), over the bar of 0.035.
- `assets-src/saturn/RECIPE.md` on main names an image model in five lines (35, 103, 105, 108, 165). The same
  file stands on this branch; the rule of the build is that no file names one.
- `tests/skylift-gl.test.ts` was not run to its end on the last name. The cause of the ring rows of the lens cure
  standing above main's from 3858 + 1/2 (MAIL 1498) is not found.

## How to go on

1. The tone at W, in this order (MAIL 1543 point 2): the light band at the edge of the dense ring; the near
   ring's lanes and sand; the ring's warmth; the globe's bands.
   - The cause of the white strip of commit 52e8d97e is known: the fit of the ring's table (`ring_tone.py`)
     clipped the knots 1.83 to 1.95 at the bound 1.8 in all three colours, which strips the ring's warm colour.
     It ran into the bound because the knot at 1.87 also carries the dark gap from 1.92 to 2.10, whose edges lie
     at other radii in the approved picture: the fit lifts the dense ring's edge to fill a gap it cannot draw.
   - `ring_tone.py FILM OUT 3 1.8 one` keeps the colour of each knot (one free value for its three colours).
     Its fit on W5 is `assets-src/saturn/code/moves/ring_tone_one_fit.json` (NOT applied, NOT rendered): the
     ring's part of the number goes from 26.95 to a predicted 24.64. Do not take its knots 1.83 to 1.99 and 2.35
     as they are (they chase the gap again, now with the colour kept); take the gap's pixels out of the fit's
     score first. Its knots 1.27 to 1.51 (factors 0.21 to 0.84 on main's) answer the inner ring standing far too
     light at W (level 166.6 against 119.2).
   - `ring_fine.py FILM OUT 1.6 0.5` (a floor under 1). Its next table from W5 is
     `moves/ring_fine_next.json`: at the floor 0.5 from 1.57 to 1.81 and at 2.29, 2.35. The amplitude reaches
     only ringlets narrower than a zone (`fine.wide` 16 footprints); the near ring's lanes are as wide or wider.
     A wider zone is the next trial; it changes every frame under the height 2.03, so both moves must be read.
   - The sand: half of main's size draws no sand at all at W (the level shows by the width of its middle grain,
     1.1 to 2.2 px); 0.7 is in the tree and reads as fine sand.
   - The table of commit 52e8d97e (fitted per colour) is `moves/ring_tone_per_colour_fit.json`.
2. Then the proofs a name needs, none of which exist: the reader's rows of both moves by part against main's on
   the same main (`npm run smooth -- --stop saturn --kind dive --only pictures --part 1/2`, and 2/2, and the
   same for the rise; about 22 minutes a part here; no line worse than main's), the finals of 3465, 3567, 3720
   and 3866 beside main's and the approved, every frame of 3567 to 3720 as a strip, the skim as a draft clip
   beside main's, the path part of all nine stops, the unit tests alone, main merged first.
3. The tools of the moves are in `assets-src/saturn/code/moves/` (run from the repo's root with `npx tsx`):
   `path_table.ts OUT.json` writes the path by half frames from 3380 to 3890 (frame, distance, height, lens,
   place, view; its rows after 3885 are not the film's, the travel is not in it); `disc_rate.py` and
   `lens_rows.py PATH [STEP]` read it; `opt7.ts dive|rise GENERATIONS SEED` searches the paces (LOW=0 for the
   rise) with `sm.ts` and `e3.ts`, and `put_pace.py KIND JSON` puts them into `skim.json`. `sm.ts` builds the
   film anew for every trial: the way out of the stop is laid from the rise's own end.
4. If pose W is given up: the lens law `even` and the rise's cure of 3851 can stand on main's pose alone. The
   paces must then be searched again for main's pose, and the rows read again.
