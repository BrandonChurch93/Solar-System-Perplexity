# Mercury sky and Sun recipe

Three shipped pictures, each in both sets:

- `public/assets/mercury/<set>/sky-hold.webp`: the sky behind the globe in the orbit view (full 3520 x 1980, web 1760 x 990). A sky patch in replace mode, `src/stops/mercury/sky.json` `orbit` (vfov 30 degrees, margin 0.125, gain 4).
- `public/assets/mercury/<set>/sun-plate.webp`: the Sun of the approved orbit image as an additive plate fixed to the sky (`src/stops/mercury/sunplate.ts`, `sunplate.json`).
- `public/assets/mercury/<set>/sky-terrain.webp`: the sky above the horizon in the terrain view (full 4096 x 2304, web half). A sky patch in replace mode, `sky.json` `terrain` (vfov 60 degrees, margin 0.22727, feather 0.1, gain 4).

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
4. Render frame 615 at review with the rim glow off and a black sky patch (`out/work/mercury/base-615.png`): what the film adds on its own (Sun plate, bloom, lens ghost).
5. `python3 assets-src/mercury/sky/patch.py out/work/mercury/sky-canvas.npy out/work/mercury/sky-canvas-plate.npy out/work/mercury/base-615.png out/work/mercury/sun-plate.npy public/assets/mercury`: sky patch = sky canvas minus the Sun plate minus the film's bloom, so that film frame 615 adds up to the approved image. Writes `public/assets/mercury/full/sky-hold.webp` and `public/assets/mercury/web/sky-hold.webp` (lossless WebP).

Measured at frame 615, review tier: low-pass sky luminance film over approved, median 1.018 (10th to 90th percentile 0.969 to 1.057).

## Steps: terrain sky

No generation. The sky of the approved terrain image, deblocked (`python3 assets-src/mercury/tools/deblock.py references/approved/mercury-close.jpg out/work/mercury/close-db.png`), on the relief's extended canvas (`assets-src/mercury/relief/RECIPE.md`, `out/work/mercury/relief/ext-2x.png`).

1. `python3 assets-src/mercury/sky/terrain.py base`: canvas 4096 x 2304 at approved scale, built at 8192 x 4608. Above the approved top edge the patch is the radial profile of the approved Sun glow about its centre ((745, -40) approved px, radial within 5 percent) plus mirrored approved stars; below the horizon it is star-free smooth sky taken 4 px above the relief's alpha edge, so the ground never shows a second horizon behind it.
2. `python3 assets-src/mercury/sky/terrain.py write`: writes `public/assets/mercury/full/sky-terrain.webp` (4096 x 2304) and `public/assets/mercury/web/sky-terrain.webp` (2048 x 1152).
3. `python3 assets-src/mercury/sky/terrain.py fix FILM` (twice, with frame 870 at review as `FILM`): measures approved over film in scene values on the sky of frame 870 and multiplies the patch by the smooth ratio, then writes again.

Measured at frame 870, review tier, film over approved: sky median 1.000 (p10 0.957, p90 1.025), near the Sun 1.000, dark sky at the right 1.001.
