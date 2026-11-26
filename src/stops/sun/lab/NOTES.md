# The Sun ground lab at the freeze of 26 Nov 2026

The notebook with every trial is assets-src/sun/lab/NOTES.md, the recipes are assets-src/sun/lab/RECIPE.md.
This file is the short hand over.

## What the state is
- This folder is a second ground for the Sun's close view: cells as real domes from a baked life (sim.ts), their
  heat and the spot in ground.ts, all values in lab.json. It is NOT on main and main does not draw it: the Sun's
  place.json there says "ground": "main". Here the switch is place.json "ground" ("lab" or "standing").
- lab.json in this commit is the state h48. The last state named for judging is h45, commit
  045a88cb4dc9d7a5235c345552f671dab1d3e3b5 (named 17:58 UTC as not whole; never ruled).
- Newer trial states, drawn as drafts of frame 90 only, are in assets-src/sun/lab/states: lab-t258.json (cells
  press together, the dark stands in pools) and lab-t264.json (t258 with the spot as a hole). t264 is the best
  to the eye. Its far twin is not baked.
- The base is the old main (merge base d91c0f63). Main 262b9a68 is not merged: the merge conflicts in
  src/stops/sun/place.json; the Sun's tree take/e5-t2 b3f98c1b conflicts in 12 files.

## What is proven (MEASURED, h48, old base)
- Final 90: whole frame low band 13.6752 (main's 15.303), plain 31.1579 (main 29.558, worse); rows 540 on low
  band 27.7788 (main 27.289, worse), plain 51.7021 (main 49.735, worse); sky part 7.0416; bands of 1 to 16 px
  against the approved 1.101 1.007 1.013 1.034; G17 median 1.3165, worst tile 0.5227; curve from middle to
  border inside 0.05; lane 6.44 px (approved 7.08).
- Flicker (frames 380 to 470): by cell the largest step over 12 frames 0.247, 4.5 percent of cells over a tenth.
  The law of MAIL 1218 (none over a tenth) is NOT met.
- tsc is clean on this commit. NOT run on h48: the units, the gate, the rise, frame 60, the five hashes, the two
  finals, the path lines. UNKNOWN: whether h48 draws the same bytes with the code added after its final (the
  additions are off without their keys).

## What is still wrong, by frame and place
- 90, rows 800 to 1080: reads as pale flat plates in a brown net, not as domes of gas. By measure: three times
  the approved's share of flat ground (0.074 against 0.025), hard edges where a body meets a pool, highlight
  pieces twice too large (660 px against 343), the dark one joined net (largest part 0.41 in h48, 0.20 in t264,
  0.08 in the approved), every cell lighter on its far side (0.49 against 0.10).
- 90, rows 620 to 800: in h48 the spot is a brown dish. In t264 it is a hole with a black floor, but its threads
  are even stripes; the approved has thin hairs of many lengths and tufts on the far rim.
- 90, rows 540 to 620: the far field is pale, without the warm glow at the limb.
- 380 to 470 and the film of 120 to 240: cells swell and dim and pools open and close; no births or splits that
  read as such, the fibres do not stream outward; flicker law red.
- 0, 60, 247, 360: not looked at since h45.

## How to go on
1. Take states/lab-t264.json as lab.json, bake the twin (bake.ts, level.py), draw the film and the flicker rows
   first: the motion weighs as much as the still.
2. Work the near field with flat.py, blobs.py and cells.py beside the eye at 1 to 1: fill the pools with
   gradient (the glow of the bodies falling in), take the one step at the far outline of each body away, break
   the plates into smaller glints.
3. For a name: build on main, take main's place.json whole and lay the lab's fields on it by hand (MAIL 1541),
   then the whole list of v/proof.sh in the notebook (final 90 and 60, flicker, film, rise, five hashes, G17,
   the units, the gate, the path lines).
