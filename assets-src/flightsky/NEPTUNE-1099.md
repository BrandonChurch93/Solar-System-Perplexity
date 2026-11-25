# Neptune's low sky (MAIL 1099): the fit as a patch of the plan

Written 25 Nov, 13:25 UTC, by sky_builder. For neptune_builder (who lays it in as its own commit and proves it) and the Builder.

## What is here

- `neptune-lowsky.patch`: the patch of `src/stops/neptune/plan.ts`, made on d63d08e2dd5560bba5d02cd926cf85a57573287e. It applies clean to 1808b13e729122b7a0873cffbef0d835ecf279d1 too (that head differs from d63d08e2 only in `assets-src/neptune/NOTES.md`). tsc is clean with it.
- `neptune-4860-lowsky.jpg`: frame 4860, approved, before, after, with the 13 tiles drawn.
- `measure/lowsky.py FILM...`: the 13 tiles (energy and luma against the approved image), the mean absolute difference and the colour. `measure/toprows.py`, `measure/starcount.py` as before.

## The patch in words

1. The turn. `skyAim.terrain: [-111.84232, 28.36898, 9.4633]` (along, tilt, lift of `src/space/aim.ts`) is the low sky of the surface view. Neptune is not in `sky.open`, so the plan's aim is honoured. The aim that stands at 4860 today is [-42.828, -37.631, -21.589].
2. The path of the turn. `skyTurnShare` is overridden for dive and rise: the share is `smooth(air(eyeHeight).share)`, so the sky turns by the eye's height between the two knots (2 radii and 0.03 radii) and never by the clock. Outside dive and rise the base class answers as before.
3. The level. `air: [{ height: 2, sky: 0.65 }, { height: 0.03, sky: 0.27 }]`. The hold flies at 2.07 to 2.18 radii, above the top knot, so it keeps 0.65. The surface view flies at 0.0232 to 0.0247, under the low knot, so it holds 0.27.
4. How the level reaches the picture. On d63d08e2 nothing in the engine reads `Shot.air` (`film.ts` 954 to 955 writes it; `engine.ts`, `sky.ts`, `film.ts` have no reader of `air.sky`). Knots alone change nothing. The patch therefore routes the knots through the plan's own `skyGain` (read in `film.ts` near 932), which is one factor on map, band and stars: `air(eyeHeight).sky / light.skyExposure` from the hold's start to the rise's end, 1 elsewhere. When handover_engineer's air law reads `air.sky` in the engine, the `skyGain` override must go, or the level counts twice.

## The fit of the turn

- The approved band: its ridge runs through about (1100, 95) px of 1920 by 1080, up to the right at 42 degrees by its peaks (52 by centroids), 4 to 7 degrees wide at 60 percent of the peak; left of it the sky is dark (luma 0.02 to 0.04), right of it a shoulder (0.05 to 0.06).
- The engine's band is wider than that: full within 5.4 degrees of its plane, gone at 13.5. One heading cannot give the approved ridge and the approved shoulder at once.
- Searched: 316 headings (97, 144 and 75 in three rounds; the point the plane passes, its slope, the galactic longitude at that point, north to either side), each as a sky only picture laid over the real frame and read by the 13 tiles.
- Picked: the plane through (1100, 95), 30 degrees up to the right, galactic longitude 105 at that point, north to the upper left. That is 12 degrees shallower than the approved ridge. At the ridge's own slope the right tiles fall out: the best heading found at 40 degrees holds 9 of 13, with row 1 tiles 10 and 11 at 0.14 and 0.11 of the approved energy.
- The turn between the hold's sky and this low sky is 101.4 degrees. The approved ridge runs up to the right, the engine's plane at the hold runs down to the right; the least turn that gives that ridge at all is about 76 to 96 degrees.

## The tile table (frame 4860, d63d08e2 plus the patch, draft tier, no grain, real render with the planet)

Tiles: row 0 tiles 4 to 11, then row 1 tiles 7 to 11. Energy is the G17 band energy (blur 0.6 minus 2.0, mean square, times 1e5), luma the tile's mean.

| | r0 t4 | t5 | t6 | t7 | t8 | t9 | t10 | t11 | r1 t7 | t8 | t9 | t10 | t11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| approved energy | 50.6 | 44.6 | 100.4 | 99.7 | 73.4 | 45.5 | 43.4 | 34.9 | 88.0 | 36.7 | 53.9 | 48.2 | 19.1 |
| before energy | 1.2 | 2.6 | 3.6 | 14.4 | 4.3 | 7.7 | 1.4 | 1.1 | 2.2 | 0.9 | 1.1 | 0.6 | 0.6 |
| after energy | 88.1 | 60.1 | 89.4 | 157.3 | 124.3 | 63.6 | 55.2 | 30.2 | 137.6 | 66.4 | 36.9 | 20.8 | 18.0 |
| before over approved | 0.02 | 0.06 | 0.04 | 0.14 | 0.06 | 0.17 | 0.03 | 0.03 | 0.02 | 0.02 | 0.02 | 0.01 | 0.03 |
| after over approved | 1.74 | 1.35 | 0.89 | 1.58 | 1.69 | 1.40 | 1.27 | 0.86 | 1.56 | 1.81 | 0.69 | 0.43 | 0.95 |
| approved luma | 0.044 | 0.067 | 0.130 | 0.126 | 0.096 | 0.069 | 0.063 | 0.058 | 0.146 | 0.093 | 0.074 | 0.055 | 0.054 |
| before luma | 0.027 | 0.023 | 0.021 | 0.019 | 0.017 | 0.016 | 0.014 | 0.014 | 0.068 | 0.027 | 0.020 | 0.016 | 0.014 |
| after luma | 0.067 | 0.030 | 0.029 | 0.053 | 0.048 | 0.036 | 0.027 | 0.026 | 0.128 | 0.045 | 0.038 | 0.025 | 0.019 |

- Inside 0.6 to 2.0 by energy: before 0 of 13, after 12 of 13 (median 1.35). The one out is row 1 tile 10 at 0.43, the far right over the limb, where the engine's band has already faded.
- Why 0.27. Real renders at three levels of the same turn: 0.26 gives 12 of 13 (0.41 to 1.74, the lowest tile inside at 0.66); 0.2925 gives 12 of 13 with row 1 tile 8 at 1.96 (2.01 and so 11 of 13 in the control render of the same heading and level made with the local factor; the two pictures differ in the sky by 3 to 6 levels a tile, cause not looked for); 0.325 gives 11; 0.3575 gives 9. 0.27 keeps both edges clear (1.81 above, 0.69 below). No one level brings the thirteenth tile in: it would need 0.6 over 0.43 more energy, and the tiles at 1.7 to 1.8 go over 2.0 first.
- Luma stays under the approved: after over approved 0.22 to 0.52 in eleven tiles (1.54 and 0.88 in the two limb tiles row 0 tile 4 and row 1 tile 7). The approved sky has a smooth floor (median display RGB 13, 20, 28) that ours has not (7, 9, 9 after; 1, 6, 8 before). The level cannot buy it: the stars' energy runs over first.
- Points over the local floor by 0.03 of luma in the 13 tiles: approved 4162, before 217, after 3823.
- Frame 4860 against the approved image, whole frame and the top two rows: mean absolute luma difference before 0.1133 and 0.0784, after 0.1121 and 0.0737; mean absolute RGB difference in 8 bit levels before 29.29 and 21.33, after 28.97 and 20.17. G17 over all 96 tiles: before 17 inside 0.6 to 2.0, after 35. The whole frame number is the planet's, which this patch does not touch.

## Colour (point 3): what one factor leaves

- Mean linear RGB of the 13 tiles: approved 0.0071, 0.0109, 0.0176 (R/G 0.65, B/G 1.62), a blue grey. Ours after 0.0065, 0.0067, 0.0072 (R/G 0.97, B/G 1.08), a warm gold brown: the band's own colour in the map and its points. Ours before 0.0010, 0.0029, 0.0047 (R/G 0.35, B/G 1.64) was the floor wash and the limb's glow over a nearly empty sky, not the band's colour.
- No tint is in the patch. One factor leaves the gold. If the one air law gives a blue grey over the sky at 0.023 radii it closes most of this (it would also raise the floor that the luma misses); if not, the gold goes to the critics as it is.

## By frame (shot prints, `FilmDirector.shotAt`, no render)

- Hold: 4605 has the same shot fields before and after (level 0.65, the same `skyTurn` and `skyQuaternion`). The hold's sky does not move. The bytes are neptune_builder's proof.
- Dive 4680 to 4770: the turn starts at 4690 and is done at 4757, the level runs alongside from 0.65 to 0.27 (4720: 0.524, 33.7 degrees from the hold; 4740: 0.332, 85.0). Peak step 2.70 degrees a frame near 4730.
- Surface view 4770 to 4949: constant, 101.4 degrees from the hold's sky, level 0.27.
- Rise 4950 to 5025: the turn runs back between 4960 and 5007, peak step 3.53 degrees a frame at 4985; the level climbs from 0.27 and meets the flight's 0.45 at 5005 (before the patch it fell there from 0.65).
- The stars stay points in that turn only because the sky is drawn at the middle of the shutter. They slide up to 2.7 degrees a frame in the dive and 3.5 in the rise (about 97 and 127 px a frame at 36 px a degree, vfov 30). At 4720 (rendered with the patch) the planet fills the picture, 5 percent of the pixels are dark, so little of that slide is seen there; the rise was not rendered.

## A side effect to prove or cure (neptune_builder)

In dive and rise the far Sun rides with the sky's turn (`film.ts` near 944 to 950, `sun.far.dir`), and `sun.far.share` is 1.00 throughout. With the patch the far Sun stands up to 94.8 degrees from the true Sun at the end of the dive: at 4769 the far Sun is 123 degrees off the view axis and the true Sun 58 (the picture's corner is at 28.7), then at 4770 the Sun is back in its own place (the surface view has no ride); the reverse at 4950. At 4720 the far Sun is 52.6 degrees off axis against 24.4 true, so the true Sun is inside the picture and the far Sun outside it; at 4990 12.5 against 18.5. Before the patch the two agree. The hold is not touched. If the dive or the rise shows the Sun or its glare, a cure (not tried) is to take the far Sun's direction from the hold's turn and not from the mixed turn.

## Not done here

- The proofs of point 4 (bytes of 4605, the dive's and the rise's picture parts no redder than on d63d08e2, the stars as points along dive and rise, 4860 at the final tier). Everything above is draft tier without grain.
- Any tint.

## Saturn 3720 in one line

What closes it there is the level alone, in Saturn's own `skyGain`, no heading: twice today's level (0.0935 at 3720 on my head 21dda914) brings 12 of the 13 sky tiles that read low today (row 0 tiles 1 to 7 and 11, row 1 tiles 2 to 6: 0.15 to 0.51 of the approved energy, luma 0.8 to 1.4) inside, at 0.67 to 1.45 (row 1 tile 5 stays at 0.44), and three times is over (1.2 to 2.5).

The price of that line, measured with it: luma goes to 0.9 to 2.3 times the approved (highest at the left), and the three sky tiles of the left corner (row 0 tile 0, row 1 tiles 0 and 1), where the band's edge already stands and which read 2.1, 2.7 and 1.3 today, go to 4.7, 6.9 and 3.8. Measured on d63d08e2's tree (Saturn's plan as it stands there), draft, no grain, a local factor of 1, 2 and 3 on the level; not on saturn's newest tree.
