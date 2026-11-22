# Mercury, branch agent/mercury-leave (MAIL 110, 22 Nov)

A small branch from `origin/main` (616695b) that holds only the cure of what round 31 named at frame 495 of `sun.travel`, where the picture is mostly this stop's Sun plate and lens. The polish of Phase 6 lives on `agent/mercury`; its notes are in `NOTES.md` there. The mail's text is in `NOTES.md` on `agent/mercury` under "MAIL 110".

## Item 1, the streak

- Cause: the level streak is the approved hero's own streak cut out between the globe and the corona (`lens-streak.webp`, from 0.84 to 1.43 screen half heights left of the Sun's centre, greenish because the sky level was taken off it); the piece from 0.84 to the limb lives in the hold's sky patch, which the engine brings in only at the end of the travel (`shot.skyPatch`). Until then the plate hung alone, short of the corona, in its own hue.
- Cure (`lens.ts`, `set.ts`, `look.ts streakCore`): while the hold's sky patch is not yet in (`whole = 1 - shot.skyPatch` in the travel that arrives at Mercury, 0 everywhere else), the streak pass draws the missing piece itself: a line on the plate's row from the plate's peak inward to the Sun's limb, rising as (0.958 / r) ^ 3, hidden under the disc (`rise` in limb radii), with the plate's own vertical profile (sigma 0.0177 half heights), and a short mirrored tail on the far side of the disc; plate and line take the glare's warm white (`warm`) by the same weight. The limb's place on the streak's row is found per frame by bisection through the Sun plate's own mapping. As the patch comes in, the line and the tint go out and the approved streak stands as before.
- Draft, preview, web set, before against after (`out/work/mercury/leave/d0`, `d1`): 539 and 615 the same bytes; 474 1650 pixels by 1 code, 484 to 529 between 11547 and 1393 pixels, at most 27 codes, 534 161 pixels by 1 code.

## Item 2, the plate's surface

- Cause: the plate is the approved hero's Sun corner, about 1.5 plate texels per screen pixel at the hold and less in the travel, and soft in itself (a painted swirl with no cell scale); in the travel it stood at the hold's level, where the filmic curve leaves it near white, with the hold's weak limb darkening (0.08, 0.16, 0.2).
- Cure (`sunplate.ts`, `look.ts sunSurface`), all computed in the shader, no new file:
  - Granulation: cells (second minus first nearest point of a jittered grid, 53 cells per radian of the sphere, laid on the sphere and not on the screen, so they crowd toward the limb) times a coarser layer at 0.23 of the scale; it multiplies the plate in scene light and goes out between 0.86 and 0.985 limb radii. Amount 0.3 in the travel that arrives, 0.07 at the hold; it goes out over the first 18 frames of the dive (`dive: [0, 0.2]` of the segment) and is 0 in the rest of the dive, the rise and the travel that leaves, so those keep the pixels of main.
  - Limb darkening in the travel (0.3, 0.42, 0.55), going over to the hold's as the hold's sky patch comes in, by the same weight as the streak (`1 - shot.skyPatch`).
  - Three active regions (a plage and two spots with umbra and penumbra each) at fixed places on the sphere, weighted by `1 - shot.skyPatch`, so they belong to the travel only. They also lie outside the frame at the hold (the hold shows the disc only below 0.31 radii up and 0.22 radii right of its centre). A first state without the weight showed a spot pair in the dive at 717, where the Sun has slid into the frame: 8224 pixels over 2 codes, at most 60; with the weight 717 is back to main.
- The hold: 615 at final against main 616695b changes 127962 pixels, 3028 of them by more than 2 codes, at most 4 codes, all in the Sun's corner (rows 0 to 468, x from 1493): the grain under the roll off. More than that would leave the approved crop, which is soft itself. `corner-615` sheets: approved, before, after.
- 495 at final against main 616695b (items 1 to 4 together): 749315 pixels, 380628 over 2 codes, at most 149 (the ghost that is gone).
- Open: the cells keep a jitter of 0.7 of a cell, so at half size (preview, one sample) a faint regular weave can be read in the grain; full jitter would cure it and needs one more round of finals. The loops are still the hero's own shapes: only brightness and reach vary round the ring, not their place or size.

## Item 3, loops and spikes

- Cause: the corona and the loops are the hero's own, painted with even spacing and one reach; in the travel the whole ring is in view, at the hold only a quarter.
- Cure: outside 1.03 to 1.12 limb radii the plate's detail (the plate minus its own level 5 blur) is scaled around the ring by two periodic value noises of the angle (23 and 17 knots): depth 0.45 for brightness, and a reach between 1.22 and 1.72 limb radii with a soft end of 0.17 radii, so spikes end in the glow at different lengths. The glow itself (the blurred plate) is not touched, so nothing is cut. Weight `1 - shot.skyPatch`: at the hold the approved ring stands.

## Item 4, the orange smudges

- They are this stop's lens ghosts (`lens-ghosts.webp`, cut from the approved hero's lower left; the blob the critic names is at plate pixel 119, 438), and they lie within 0.5 degrees of the line through the frame centre opposite the Sun. They are the hero's own, so they stay at the hold.
- In the travel they came in with the Sun plate's weight, 0.44 at 495, long before anything else of the hold. Now the ghost pass takes the hold's sky patch weight to the power `look.sun.ghostIn`, 4: weight 0.00006 at 495, 0.04 at 509, 0.29 at 519, 0.53 at 524, 0.80 at 529, 1 from 536. The ghosts are out of the travel until the Sun is nearly at its hold place (it moves 30 px from 519 to 539) and come in with the patch they belong to, so the drift from 499 on is gone.

## The plate for the hand over

- `out/work/mercury/leave/limb.ts` (scratch, not committed) computes the plate's limb per frame through the mapping of `set.ts`. At 1920 x 1080, mid shutter: 488 centre 1296.6, 370.6, mean radius 338.5, weight 0.239; 495 centre 1435.6, 296.9, radius 347.1, weight 0.440; 499 centre 1512.8, 254.6, radius 353.1, weight 0.560; 539 centre 1685.0, 107.8, radius 371.9; hold 615 centre 1834.6, 120.0, radius 384.9. The disc is not quite round in the travel (at 495 the limb is 352.7 px left, 325.9 right, 348.3 up, 361.4 down of the engine's Sun at 1449.0, 290.4), because the plate is flat in the hold camera's frame. The whole table went to sun_builder at 09:37 UTC.

## The painted disc (10:03, from sun_builder's fit)

- The disc `sunplate.json` states (centre of the picture, radius 0.227585) is the hero's disc as fitted in the hold's quarter. The disc painted on the whole plate is larger and off centre: centre uv 0.5176, 0.5207, radius 0.2506 (sun_builder's fit on `sun-plate.webp`, 405 rays, median residual 0.67 px). In the hold's quarter the two limbs agree within about 9 px; on the right and the top, which only the travel shows, the painted limb is 55 and 65 px further out at 495.
- 1962bf3 laid the grain, the travel's limb darkening and the corona's reach on the stated disc, which left a pale band without grain along the right limb at 495. Now `sunSurface.disc` carries the painted disc and those three are laid on it; the hold's own limb darkening keeps the stated disc, so with the travel weight at 0 the shade is the hold's to the bit.
