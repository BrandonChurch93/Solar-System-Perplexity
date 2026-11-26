# Mars place: the state at the stop of the quality loops (26 November 2026, MAIL 1548)

Written by mars_place_builder. The full log is PLACE-NOTES.md beside this file; the recipe is RECIPE.md.

## What is where

- main (262b9a68) holds Mars as it rides in the film. Nothing of this branch rides.
- agent/mars-place: the speck state, named 17:09 UTC as 498513133f001112164442409cd35fd8a6395ff7 (main's Mars with the blue law alone: 8 land plates, bluelaw.py, bodyfull.py, plates.json). Held by the letter of d374 (3) (MAIL 1526, MAIL 1531); a ruling on that letter was due after the freeze. The commit that adds this file holds the same Mars and the same engine as 49851313; only the two notes files differ.
- agent/mars-place-whole: the whole cure (the canyon's inside drawn as ground from above, with a crisp cast shade made from the heights, and the blue law), tree of 0d638c0742299ec5df14c2649c73b62504c21a23 with main 52ff2250 merged. A state, not a name. It stays off by MAIL 1522 and MAIL 1531.
- agent/mars-place-looks: the pictures of the day.
- Neither branch holds main 262b9a68 (MAIL 1540). git merge-tree gives a clean merge for both (trees 252852b4 and bda21536); the merge was not committed because the tests on a merge are a new run and MAIL 1548 stops new runs.

## What is proven (measured on my machine)

- The speck state: every proof of the name mail of 17:09 (path green, G11 and G15 pass, units 1106 passed on its first base, finals 2325 and 2580 main's bytes, memory 1399.834 MB, 2427 and 2726 main's to the pixel). The violet speck at 2466 (x 1012 to 1016, y 280 to 290) is gone: pixels with blue over red by more than 25: main 5, the state 0.
- The whole cure against main, drafts at native size: main's canyon from above is a soft smudge without an outline, the state has a floor, a far wall and a crisp cast shade (2436 to 2462, 2700). 2427 and 2726 are main's to the pixel.
- The whole cure's reader rows of the rise, K 5382 to 5401: 1.0596 at K 5384 (frame 2692), pixel 1808, 952, where main reads 0.4418. Main's rows on my machine equal round 56 in all 20 rows.
- The place of that number, proved by a control that restores main's plates in one ground box and brings the row back to 0.4164: the ground east 0.39 to 0.55, north 0.62 to 0.78 of the 1.6 plate (1.6 plate texels x 1438 to 2026, y 811 to 1400; 0.7 plate texels x 815 to 2012, y 0 to 739). There main holds a soft half shade about the dark mass north of the canyon, the whole cure a crisp line with pointed teeth and a pointed lit wedge.
- The line does not differ between the whole cure's levels more than main's does (0.7 against 1.6 in the box: over 16 levels on 0.0314 against 0.0302 of the texels; 1.6 against 3.8: 0.0000 both).
- In the reader's own maps of K 5384 the picture carried from frame 2700 does not hold the form frame 2692 has at the wedge, on main as well as on the whole cure (phase correlation response 0.04 to 0.15 in the two windows there, 0.67 to 1.07 in the 22 other windows). The place grows about 5 times between the two frames.

## What is still wrong, by frame and place

On main (and so in the film):
1. 2436 to 2462 and 2690 to 2700: the canyon seen from above is a soft dark smudge without an outline, floor or far wall.
2. 2685 to 2688: a dark rhomboid with stairs at the far rim (x 1335 to 1420, y 245 to 265 at 1920 wide). Cause proven: the wall of the made country east of the picture's field (the cap's own heights), not the law and not the picture's layer.
3. 2468 to 2472: a black band from the far rim's head; dots at 2468; the band's tip at 2472.
4. 2466: a violet speck at x 1012 to 1016, y 280 to 290; blue and violet specks of a few pixels at 2440 to 2470 and 2686 to 2700; a teal fleck past the canyon's east tip at 2440.
5. The reader's pattern rows of the rise are over 0.45 on main itself (K 5390 0.8657, K 5395 0.8872), the largest values in the upper left of the frame.

On the whole cure only:
- 2692 to 2694, lower right: the crisp line with teeth reads 1.06 (above).
- 2452 to 2456, upper left: a flat blue grey west stretch with a hard border beside the picture's field.
- A pale band along the mound's border on the 0.7 plate.
- 2471: pattern row 1.1659 against main's 1.0175; pop line 1.1441 against 1.1433, cause unknown.

## Unknown

- Whether the reader's carry (flows chained over 16 steps) slips at the wedge of 2692, or frame 2700 draws that ground otherwise. The control that tells is the kit's own: `npm run -s smooth -- --stop mars --kind rise --only pictures --frames 5384-5384 --calibrate --carry-range`, once on main's plates and once on the whole cure's, reading the column "pattern by the true carry". It was running on main's plates when MAIL 1548 stopped it; no number came of it. `--carry` (the sphere made from the pose) is no control here: its carried frame has the horizon far below the frame's.

## How to go on

1. Merge origin main into the branch you build on, run the units, the gate (G11, G15) and the path on the merge.
2. Run the control above on both sets of plates. If the true carry reads the whole cure no higher than main at K 5384, the 1.06 is the reader's, and the Builder rules. If it reads higher, the picture changes there between 2692 and 2700 and the cause is still to find.
3. The cure the Builder took for the next round (MAIL 1531 point 2, held by MAIL 1533 until the ground was named; it is named above): the heights of the made country east of the picture's field made to hold the plate's forms. It cures the slab of 2685 to 2688 at its cause as well. Every level and plate is then made again (inside.py, pyramid.py, webplates.py; RECIPE.md).
4. A draft of the other form (the crisp line drawn only where the heights' line lies inside the plate's own soft border) was built outside the tree and does not touch the lower right place; it was not taken.
5. Rules that bind any state here: no blur, no tone by ground distance, nothing by height or clock, 2325 and 2580 keep their bytes, memory of mars/full at most 1400 MB, the net of the three Mars folders must not rise.
