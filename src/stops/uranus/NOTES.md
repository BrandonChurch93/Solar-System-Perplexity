# Uranus: where the stop stands

Written 26 Nov 2026, 21:00 UTC, at the freeze (MAIL 1548). The long notebook with every mail word for word, every control and every number is `assets-src/uranus/NOTES.md`. Film frames of the stop: hold 3960 to 4109, dive 4110 to 4199, terrain 4200 to 4379, rise 4380 to 4454. Judged frames: 4035, 4137, 4290, 4436.

## The state

- Main `262b9a68df0a6bda8d77518539580de554bb0dc5` (the fifth cut) carries the name `b7f9558077fb3565f41555bbd5cbd4735978fc3e`. The stop's code on main is the name's.
- Branch `agent/uranus-place`: main 262b9a68 is merged in (merge `57d6c0a19ab6ba88acfe652718e6fcc12beba51b`, no conflict). Over main the stop's code differs by one commit, cure D `17b4dca9` (`deck.ts`, `globe.ts`), which is HELD and not on main.
- Not in the code, kept as files: the trial of a new law of the air's share for the pale lanes, `assets-src/uranus/trials/air-law-c.patch` (touches `look.ts` and `set.ts`; applies on main and on the branch) with its arithmetic in `air-law-c.py`.
- The small tools that lived outside the repo are copied to `assets-src/uranus/tools/` (the two `.ts` tools and the control script as `.txt`; they ran from `out/work/u/`).

## What is proven

- The name on main, by my NAMED mail of 18:07 UTC 26 Nov (notebook): the reader's four parts read on b7f95580, every pop under the limit 1.2 (dive 1.0961 and 1.1228, rise 1.0843 and 1.1135), the plain match 3.737 at 4035 against `uranus-hero.png` and 3.178 at 4290 against `uranus-close.jpg`, G17 green at both (4290 median 1.067047, 25th percentile 0.958142, limit 0.8), the judged finals with the bytes of the fourth cut (sha256 first 16: 4035 fac21b65d1310642, 4137 97aed4f8fddd2b9f, 4290 17e76eeb2683ad89, 4436 8bba6dc3d574143b).
- Main 262b9a68 against the name: no file of Uranus differs, and six drafts drawn on 262b9a68 (4035, 4137, 4195, 4290, 4416, 4436) have the name's bytes. The reader was NOT run again on 262b9a68.
- Cure D: SEEN on drafts of every frame 4396 to 4404 beside main's and on the finals of 4400 on both trees: the rows of short dark dashes in the white cloud are gone. Its reader rows are in the notebook (rise part 2 pop 1.1135 at 4463, pattern 0.8239 at 4422). HELD by d374 (3): on rows 4398 to 4402 + 1/2 its reading stands over main's by less than the spread of the seven placements; the ruling asked for is in MAIL 1528.

## What is still wrong, by frame and place, worst first

1. PALE LANES, rise 4403 to 4413 and dive 4164 to 4176. The dark ground between the white cloud lanes stands pale, a milky teal. MEASURED at draft (median green of the lower part, the state before the name against main): 4403 43 / 47, 4407 33 / 44, 4410 35 / 45, 4413 41 / 47; dive 4164 25 / 30, 4168 19 / 27, 4172 18 / 26. Cause, by the code and three controls: the share of the air under the eye, `hazeUnder(h) = 1 - exp(-h / 0.3)` in `set.ts`, lifts the globe's own light too early (0.16 to 0.40 at 4403 to 4413).
2. DARK DASHES in the white cloud, rise 4391 to 4416 (clearest at 4400 and 4401, at 1 to 1). Cure D is at hand on the branch, held as said above.
3. THE VORTEX SLIDES against the ground round it, rise 4426 to 4454: 5.5 to 12.9 px, MEASURED by phase correlation against a control with the clock held. Cause: `plan.clock` catches up 10.75 s over the second half of the rise. A cure (832be54a, notebook) waits for a ruling.
4. FAR GROUND UNDER THE HORIZON changes its pattern as the eye's height changes: the reader's pattern lines 0.9873 at 4151, 1.6031 at 4175 + 1/2, 1.4796 at 4411, 0.8239 at 4422 against the limit 0.45 (each under the number main had before the name). Two causes named in the notebook (the air by the path, the white tops' light); dive part 1's cause not proven.
5. POP of dive part 2, 1.1228 at about 4176, green but 0.013 over the number main had before the name. Cause not proven.
6. SOFT STREAKS in the cloud at 4399 (MAIL 1343), open.
7. CLOUD GROUP at 4416 and 4418, lower right. The dark slashes and curled edges are a fault of the draft tier (the name's final of 4416, 64 samples, has none: 0 dark px in the box against the draft's 60). A softened stair is left at the lower right of the big patch in the final. Its cause is the relief's fold (173 of 523264 mesh steps run backward). A relief that cannot fold gives soft edges there and costs the body of the white tops at 4186 to 4250; a fibre gain of 1 takes the cloud's fine fibre. Neither was taken.
8. From the critics' older list, not worked on: the spiral knot at 4035, the pasted look of the vortex, the smeared disc, the ring strands (notebook, NAMED mail of 26 Nov, point 10).

## How to go on

- Pale lanes first. `git apply assets-src/uranus/trials/air-law-c.patch`, then draw drafts of 4035, 4137, 4150, 4155, 4160, 4164, 4168, 4172, 4176, 4180, 4186, 4195, 4200, 4250, 4290, 4350, 4390, 4395, 4399, 4403, 4407, 4410, 4413, 4416, 4418, 4422, 4428, 4432, 4436 and compare with main's. Law C keeps the name's law to the bit below 0.016 R (so 4195 to 4385 and 4035 should keep their bytes and 4290 its match), holds the share near 0.066 to 0.05 R and then climbs linear in ln h to 1 at 1.4 R, never faster than the name's law (0.3548 against 0.3679 per ln h; a law twice as fast read pop 1.2791 at 4418 and was ruled out). Law C was NOT looked at: its control was stopped by the freeze after 5 frames. Its nearest relative, law B (no hold below, 0.045 to 1.4 R), was drawn and looked at on 28 frames: the lanes of 4407 to 4413 as dark as before the name (35, 38, 42 against 33, 35, 41), 4416 to 4422 a slightly deeper teal than main (47, 48, 49 against 52), and 4290 worse by 0.0003 on the match, which is why C holds the terrain.
- A name then needs, on the state: the reader's four parts (`npx tsx tools/smooth.ts --stop uranus --kind dive|rise --only pictures --part I/N`, about 45 minutes each), the path part (`--only path`), finals of 4035, 4137, 4290, 4436 with the match and G17, G13, the units, `tests/globe-cap.test.ts` alone, the gate, and main merged in.
- D: show the seven placements of main and of D side by side for rows 4398 to 4402 + 1/2 (MAIL 1528 point 3).
- The clock's slide: the cure 832be54a and its control are in the notebook.
