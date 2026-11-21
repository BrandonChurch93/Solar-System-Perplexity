# Mercury sky and Sun recipe

Five shipped pictures, each in both sets:

- `public/assets/mercury/<set>/sky-hold.webp`: the sky behind the globe in the orbit view (full 3520 x 1980, web 1760 x 990). A sky patch in replace mode, `src/stops/mercury/sky.json` `orbit` (vfov 30 degrees, margin 0.125, gain 4).
- `public/assets/mercury/<set>/sun-plate.webp`: the Sun of the approved orbit image as an additive plate fixed to the sky (`src/stops/mercury/sunplate.ts`, `sunplate.json`).
- `public/assets/mercury/<set>/sky-terrain.webp`: the sky above the horizon in the terrain view (full 4096 x 2304, web half). A sky patch in replace mode, `sky.json` `terrain` (vfov 60 degrees, margin 0.22727, feather 0.1, gain 4).

- `public/assets/mercury/<set>/lens-ghosts.webp`: the lens ghosts of the approved orbit image (the diagonal amber streak, the yellow green and pale ghosts, the blue hexagon at the limb, the small dot, the reddish streak, the comet like blob), cut out of the approved pixels as light on black (full 900 x 540, web half). Drawn by `src/stops/mercury/lens.ts` about the frame centre against the Sun's place in frame (`lens.json`).
- `public/assets/mercury/<set>/lens-streak.webp`: the level pale streak between the globe and the Sun of the approved orbit image, cut out of the approved pixels, softened, as light on black (full 500 x 130, web half). Drawn by `lens.ts` so that it slides with the Sun's place in frame (`streak.json`).

The approved pixels are `references/approved/mercury-hero.png` and `references/approved/mercury-close.jpg`. Stars in these pictures are the approved images' own stars inside sky patches; nothing else carries stars.

## Generated inputs

All three are inputs to the scripts below; none ships as is. Kept takes are under `out/work/mercury/gen/`.

1. `sky-fill-take1.png`: the approved orbit image with the planet and the lens ghost removed. Model `gpt_image_2_6_flare`, aspect 16:9, input image `out/work/mercury/gen/hero.jpg` (the approved image as JPEG). Two takes, take 1 kept. Prompt (`sky/prompts/fill.txt`):

```
Edit image 1. Remove the planet completely, and remove the thin warm glow around its edge and the small orange lens reflection at the lower left. Fill the area the planet covered with deep space that continues the surrounding sky exactly: the same field of fine, pinpoint, slightly colored stars, the same faint dusty Milky Way haze, the same near-black background, the same star sizes, density, brightness and film grain. Keep everything else in the image unchanged: the huge blazing Sun at the upper right edge with its glowing fringe, prominences and warm glow stays exactly as it is, same framing, same stars in the same places, same exposure and color. No planet, no moon, no new glow, no nebula colors that are not already present, no text, no border.
```

2. `sky-wide-take1.png`: the approved orbit image continued past its four edges. Model `nano_banana_pro`, aspect 16:9, input image `out/work/mercury/gen/hero-canvas.jpg` (the approved image centred at 80 percent of the width on a black 2816 x 1584 canvas). Two takes, take 1 kept. Prompt (`sky/prompts/wide.txt`):

```
Image 1 is a photograph placed in the middle of a larger black canvas. Outpaint it: fill the entire black border around it so the picture continues seamlessly past all four of its edges, as one wider photograph. Keep the central picture exactly as it is, same position, same size, same pixels. The huge blazing gold-white Sun at the upper right continues as one perfectly round disc past the top and right edges, with the same glowing fringe of fine radial filaments and looping prominences along its rim and the same warm glow fading into space. The star field continues on the left, bottom and top with the same fine pinpoint slightly colored stars, the same faint dusty Milky Way haze, the same near-black background and film grain. No black border left, no frame line where the old edge was, no new planets, no text.
```

3. `sun-full-take1.png`: the Sun completed as a whole disc. Model `nano_banana_pro`, aspect 1:1, input image `out/work/mercury/gen/sun-canvas.jpg` (the approved Sun region placed on a black 2048 square so that the disc centre is the canvas centre). Two takes, take 1 kept. Prompt (`sky/prompts/sun.txt`):

```
Image 1 is the lower left part of a photograph of the Sun in space, placed on a larger black canvas. Outpaint it: fill all of the black area so the picture continues seamlessly as one photograph of the entire Sun. The Sun is one perfectly round, blazing gold-white disc centered in the canvas, overexposed to white in the middle with soft golden granulation, with the same glowing fringe of fine radial filaments and a few looping prominences all the way around its rim, and the same warm golden glow fading smoothly into near-black space with fine pinpoint stars. Keep the existing part exactly as it is: same position, same size, same pixels. No black border left, no seam or line where the old edges were, no planets, no lens flare discs, no text.
```

## Steps: orbit sky and Sun plate

1. `python3 assets-src/mercury/sky/canvas.py out/work/mercury/gen/sky-fill-take1.png out/work/mercury/gen/sky-wide-take1.png out/work/mercury/sky-canvas`: the sky canvas in scene values (`sky-canvas.npy`). Approved pixels (deblocked) wherever the planet and the lens ghost do not cover them; the fill take, matched in level to the approved sky around the disc, under the planet; the wide take, matched in level to the inner picture, in the margin (12.5 percent of the frame on each side). Approved stars are kept between 1.012 and 1.03 disc radii on a star-free filled background, so no rim glow of the planet is baked into the sky.
2. `python3 assets-src/mercury/sky/canvas.py out/work/mercury/gen/sky-fill-take1.png out/work/mercury/gen/sky-wide-take1.png out/work/mercury/sky-canvas-plate 1.2 1.32`: the same with the ring moved out, the source for the Sun plate.
3. `python3 assets-src/mercury/sky/plate.py out/work/mercury/sky-canvas-plate.npy out/work/mercury/gen/sun-full-take1.png public/assets/mercury`: the Sun plate. Approved Sun pixels where the approved image has them, the completed disc elsewhere (shifted onto the approved part by phase correlation and matched in level to it), stars removed past about 1.1 Sun radii by a low-percentile filter in polar coordinates, the sky floor subtracted, faded to zero at the plate edge and scaled by `keep 0.94`. Writes `public/assets/mercury/full/sun-plate.webp` (2048 x 2048, lossless WebP), `public/assets/mercury/web/sun-plate.webp` (1024 x 1024), `out/work/mercury/sun-plate.npy` and `src/stops/mercury/sunplate.json` (plate rectangle in frame units, Sun centre (2690.65, 175.88) px and radius 564.41 px of the approved image).
4. Render frame 615 at review with the rim glow off, the lens ghosts off and a black sky patch (`look.light.rim.color` zero, `look.lens.gain` and `look.streak.gain` 0, `sky.json` `orbit.gain` 0, then all restored): what the film adds to the sky on its own (Sun plate, engine Sun, bloom). The ghost and the rim glow are drawn by the stop at any camera, so they must not be in this frame. Render it again whenever the engine Sun, the Sun plate or the bloom changes.
5. `python3 assets-src/mercury/sky/patch.py out/work/mercury/sky-canvas.npy out/work/mercury/sky-canvas-plate.npy BASE out/work/mercury/sun-plate.npy public/assets/mercury` with the frame of step 4 as `BASE`: sky patch = sky canvas minus the Sun plate minus the film's bloom, so that film frame 615 adds up to the approved image. Inside 1.015 disc radii the bloom is the spread of its values outside the disc, so no pixel of the globe is subtracted from the sky. Writes `public/assets/mercury/full/sky-hold.webp` and `public/assets/mercury/web/sky-hold.webp` (lossless WebP).

Measured at frame 615, review tier: low-pass sky luminance film over approved, median 1.018 (10th to 90th percentile 0.969 to 1.057).

## Steps: lens ghosts, streak and Sun plate tidy (round 8)

No generation. All three read the approved image or the `.npy` files the steps above leave under `out/work/mercury/`, and can be run again at any time (each keeps its untouched input as `*-base.npy`).

6. `python3 assets-src/mercury/sky/ghosts.py public/assets/mercury out/work/mercury`: the ghost plate. Approved box (340, 820) to (1240, 1360) px; the background is a normalised blur (sigma 45 px) of the picture outside the listed ghost spots, taken separately inside and outside the disc; stars outside the disc are opened away; the grain of the night side (0.0009 in scene values) is subtracted; the limb band is left out. Coded at 4 times the scene value. Writes both sets and `src/stops/mercury/lens.json` (box in frame half heights, the Sun's place in the approved frame, boost).
7. `python3 assets-src/mercury/sky/streak.py public/assets/mercury out/work/mercury`: the level streak. Approved box (1560, 150) to (2060, 280) px, rows 188 to 236. Background per column: a line through the medians of the rows above and below the streak. The streak is the picture minus that line, median filtered 41 px along the row so no star goes with it, kept only outside 1.015 disc radii of the globe and outside 1.2 to 1.34 Sun radii (inside that the Sun plate holds it). It is subtracted from `sky-hold.webp` (both sets written again), and written as the lens streak after a blur of 10 px along and 4.5 px across (the two hard lines of the approved streak become one soft one), a taper toward the globe between x 1640 and 1880, a slow swell of 18 percent along its length, and a gain of 0.85. Writes `src/stops/mercury/streak.json`. Check picture `out/work/mercury/streak-check.png` (approved, sky without the streak, sky with the lens streak, the cut streak, the lens streak).
8. `python3 assets-src/mercury/sky/sunfix.py public/assets/mercury out/work/mercury`: tidies `sun-plate.webp`. Along the two edges of the approved frame inside the plate (plate row 1064, column 1366 of 2480) the completed part is matched in level to the approved part over 140 px and the line itself is blurred 1.2 px; the thin reddish arc at the left of the disc just above the approved frame (plate (538, 1066) to (668, 1004), 26 px) is replaced by the low percentile of the corona around the Sun at that radius. Approved pixels are not touched. Check picture `out/work/mercury/sunfix-check.jpg` (before over after).

Measured at frame 615, draft: the comet like blob at the lower left peaks at 0.1223 in scene values against 0.136 in the approved image, and is absent with `look.lens.gain` 0, so nothing is drawn twice.

## Steps: terrain sky

No generation. The sky of the approved terrain image, deblocked (`python3 assets-src/mercury/tools/deblock.py references/approved/mercury-close.jpg out/work/mercury/close-db.png`), on the relief's extended canvas (`assets-src/mercury/relief/RECIPE.md`, `out/work/mercury/relief/ext-2x.png`).

1. `python3 assets-src/mercury/sky/terrain.py base`: canvas 4096 x 2304 at approved scale, built at 8192 x 4608. Above the approved top edge the patch is the radial profile of the approved Sun glow about its centre ((745, -40) approved px, radial within 5 percent) plus mirrored approved stars; below the horizon it is star-free smooth sky taken 4 px above the relief's alpha edge, so the ground never shows a second horizon behind it.
2. `python3 assets-src/mercury/sky/terrain.py write`: writes `public/assets/mercury/full/sky-terrain.webp` (4096 x 2304) and `public/assets/mercury/web/sky-terrain.webp` (2048 x 1152).
3. `python3 assets-src/mercury/sky/terrain.py fix FILM` (twice, with frame 870 at review as `FILM`): measures approved over film in scene values on the sky of frame 870 and multiplies the patch by the smooth ratio, then writes again.
4. `python3 assets-src/mercury/sky/terrain.py calm`, then `write` (round 8): the measured ratio of step 3 is replaced by its star free low frequencies (quarter size median 21, blur 8 px, tint blurred 40 px and held within 0.9 to 1.1). Before this the ratio dipped around every bright star, because the film's stars are a little wider than the approved ones, which drew dark rings around bright stars and black pinholes in the star field.

Measured at frame 870, review tier, film over approved: sky median 1.000 (p10 0.957, p90 1.025), near the Sun 1.000, dark sky at the right 1.001.
