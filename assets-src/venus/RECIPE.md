# Venus assets: recipe

All paths are repo paths. Work files are under `out/work/venus/` (not tracked). Scripts are in `assets-src/venus/` and run from the repo root. Image tool: `generate_image` (media skill), models `seedream_5` and `nano_banana_pro`. Upscaler and depth: `tools/ml/upscale.py`, `tools/ml/depth.py`.

## Orbit view

### public/assets/venus/{full,web}/wrap-color.jpg (8192 x 4096 and 4096 x 2048)

Encoding: the texel's linear value v gives albedo = 24 * v * v (`src/stops/venus/wrap.json`). The first encoding (filmic, top 6) clipped the red of the brightest cloud tops and turned them green and cyan under the light curve.

1. `python3 tools/ml/upscale.py --in references/approved/venus-hero.png --out out/work/venus/hero-5632.png --width 5632`.
2. `python3 assets-src/venus/wrap/lightning.py`: finds the lightning cells of the hero, cuts them into `bolt.jpg` (gnomonic, 30 deg, centre lon 15.5 lat 16.5) and paints the cloud under them back in.
3. `python3 assets-src/venus/wrap/unproject.py`: the hero unprojected on the fitted sphere (`fit.json`) to `out/work/venus/wrap/hero-eq.png` with the weight `hero-eq-w.png` (smoothstep 0.2 to 0.42 of the view cosine, so hero pixels fade before the limb).
4. `python3 assets-src/venus/wrap/curve.py`: the light curve measured from the hero, 33 knots, to `src/stops/venus/curve.json`.
5. `python3 assets-src/venus/wrap/albedo.py` and `deveil.py`: hero divided by the curve, the limb veil flattened between view cosine 0.7 and 0.42.
6. Far side, stage 1 (`stage1_faces.py`, `faces.py`): a cube about the hero centre, faces l, r, u, d, b, 110 deg, 2048 px, the unknown part flat magenta, written to `out/work/venus/wrap/s1/in-<face>.jpg`. Style image `s1/style-c.jpg` (the centre face, all hero pixels).
   - Prompt, faces l and r: "Image 1 is a square tile of a map of the cloud tops of a golden planet, seen straight down in even light. Part of the tile is painted; the rest is flat magenta (#FF00FF). Paint clouds over all of the magenta so the whole tile becomes one continuous cloud map: continue the bands, streaks, curls and cells from the painted part across the border with the same scale, colours, contrast and sharpness, so that the border cannot be found. Use image 2 as the guide for the cloud types, the colours and the amount of fine detail: long wind-drawn streaks and feathered chevrons that run mostly left to right, curled eddies, small bright puffy cells, pale cream and gold with soft amber shadows. The clouds must vary across the tile: wide bands, calm pale stretches and busy turbulent stretches, nothing repeated. Keep the painted part of image 1 exactly as it is. No magenta may remain anywhere. Even soft daylight everywhere, no night side, no dark areas, no horizon, no planet edge, no stars, no text, no border. Square image."
   - Face u: the same with, before "Keep the painted part": "The painted part at the bottom holds a spiral polar vortex: keep it as the only spiral in the tile. The bands above it sweep in wide arcs around that vortex, like circumpolar bands seen from above the pole; do not paint a second spiral."
   - Face d: the same with: "In the lower part of the magenta, centred about 80 percent of the way down the tile and in the middle left to right, paint one large spiral polar vortex with a calm bright eye and long curved arms; the bands around it sweep in wide arcs around that vortex." This is the south polar vortex, painted on a face that looks at the pole (a polar projection).
   - Face b: "the middle is flat magenta" in place of "the rest is flat magenta", and: "Do not paint any new spiral vortex in the magenta: fill it with long wind-drawn bands and streaks that join the left side to the right side, with a belt of small turbulent cells between them."
   - Inputs for every face: `[s1/in-<face>.jpg, s1/style-c.jpg]`, aspect 1:1.
   - Takes: l, r, u, d one take per model; b one `nano_banana_pro` and two `seedream_5`. Kept: `seedream_5` for all five (`t-l-sd`, `t-r-sd`, `t-u-sd`, `t-d-sd`, `t-b-sd2`). `nano_banana_pro` pasted the style image into the tile three times out of three (a second vortex, a visible square).
7. `python3 assets-src/venus/wrap/stage1_compose.py l=t-l-sd.png r=t-r-sd.png u=t-u-sd.png d=t-d-sd.png b=t-b-sd2.png`: every face is matched to the hero cap in Lab (mean and spread, the takes come back paler), later faces fill only what earlier ones left, feathered. Result `out/work/venus/wrap/far-eq.png`.
8. `python3 assets-src/venus/wrap/build.py out/work/venus/wrap/far-eq.png`: hero cap over the far side by the cap weight, highlights restored from `hero-eq.png`, encoded, JPEG 96, both sets, also `wrap-flow.jpg` and `bolt.jpg`.

Checks: the hold compare at review tier (`npm run compare -- --stop venus --view hold --tier review`), native crops of the terminator, the vortex and the night side beside the hero.

### public/assets/venus/{full,web}/wrap-flow.jpg

Made by `build.py` from the map itself: the band pass of the cloud luminance (the streaks), 4096 x 2048 and 2048 x 1024. The shader draws it as a veil in ratio form, veil(now) / veil(hold middle), so the judged frame equals the hero and the layer drifts across the map before and after. No model.

### public/assets/venus/{full,web}/bolt.jpg

The two lightning cells of the hero, cut out by `lightning.py` as light above the cloud under them. They flash on a seeded schedule that peaks at the hold middle (39.5 s). Twelve more cells are seeded on the night side and light the cloud's own texture, no asset.

### public/assets/venus/{full,web}/limb.bin

65 x 256 RGBA float32 (azimuth around the disc from the projected Sun direction, by impact parameter). Rows inside the disc are a haze layer drawn over the disc's edge on both sides: rgb emission, a opacity. Rows outside are the glow past the edge. Fitted to the hero by `bash assets-src/venus/fit/orbit.sh` (`fit/limb.py build`, then `refine` twice). The hero's edge is measured per azimuth (the painted disc is not round, its night limb lies up to 9.6 px outside the fitted sphere at 2816 wide). Residual at frame 1185 after the last fit: inside the disc 0.0175, outside 0.0042 scene units RMS.

### public/assets/venus/{full,web}/sky-hold.webp

The hero's own sky as the sky patch of the hold.

- Fill behind the planet: `generate_image`, input `references/approved/venus-hero.png`, aspect 16:9. Prompt: "Edit image 1. Remove the planet completely, and remove every trace of the planet's glow and atmosphere halo. Fill the area it covered with deep space that continues the surrounding sky exactly: the same dense field of fine, pinpoint, slightly colored stars, the same dusty Milky Way band with warm brown dust clouds and small star clusters crossing horizontally behind where the planet was, the same near-black background, the same star sizes, density, brightness and grain. Keep everything else in the image unchanged: same framing, same stars in the same places, same exposure and color. No planet, no moon, no sun, no glow, no bright nebula, no colors that are not already present, no text, no border."
- Takes: one `nano_banana_pro` (came back 2752 x 1536 with a brighter core behind the planet, rejected), one `seedream_5` (kept, `out/work/venus/sky-fill-sd.png`: the band continues evenly).
- `python3 assets-src/venus/sky/patch.py` (called by `fit/orbit.sh`): the hero's sky outside the limb glow, the fill inside, the film's own halo (`halo-only.png`) subtracted so the glow is drawn once. Fill gain [2.125, 1.959, 1.319], the hero's own share of the patch 0.635.
- Fill, low frequencies: the fill's light below 0.25 (blur 40 px) is replaced by the hero's own sky, interpolated along each row across the disc, so no bright region sits behind the planet (it showed as a ghost arc when the sky shifts over the hold).
- Margins of the patch (12.5 percent each side): `generate_image`, input `out/work/venus/sky-ext-in.jpg` (written by `patch.py`: the patch core in the middle of a magenta canvas, 3072 x 1728), aspect 16:9. Prompt: "Image 1 is a photograph of deep space placed in the centre of a larger canvas. The rest of the canvas is flat magenta (#FF00FF), a frame all around the photograph. Paint over all of the magenta so the canvas becomes one continuous, wider view of the same sky: continue the dense field of fine pinpoint stars, and continue the dusty Milky Way band with its warm brown dust clouds and small star clusters outward to the left and right edges of the canvas, with the same brightness, colours, grain and star sizes, so that the border cannot be found. The new parts must be new sky, not a mirror image or a repeat of the centre. Keep the photograph in the centre exactly as it is. No magenta may remain anywhere. Near-black background. No planet, no sun, no moon, no bright nebula, no glow, no text, no border, no frame."
- Takes: one `seedream_5` (kept, `out/work/venus/sky-ext-sd.png`), one `nano_banana_pro` (rejected: it rescaled the centre). The take is registered to the core by ECC (0.9982), scaled by one gain (1.218) and replaces the mirrored margins, which showed as a butterfly at the frame edges at the ends of the hold.
- Command: `python3 assets-src/venus/sky/patch.py hold references/approved/venus-hero.png out/work/venus/sky-fill-sd.png out/work/venus/halo-only.png public/assets/venus out/work/venus/sky-ext-sd.png`.

## Terrain view

Source view: `references/approved/venus-close.jpg` (2816 x 1584). Scripts in `assets-src/venus/relief/`, run from the repo root. Work files in `out/work/venus/relief/` (not tracked). Camera model in `cam.py`: vfov 60, pitch down 21.48, roll -1.03, camera height 1, sphere radius 54.35, canvas 3520 x 2376 at the approved scale (the approved image at x 352, y 0; margins 352 left and right, 792 below). The full set is 2x that scale, the web set 1x.

Order: upscale, margins (image tool), clean plate (image tool), `compose.py`, depth, strips upscaled, `build.py`, aprons (image tool), `apron.py`, `air.sh`.

### Inputs made once

- `out/work/venus/close-5632.png`: `python3 tools/ml/upscale.py --in references/approved/venus-close.jpg --out out/work/venus/close-5632.png --width 5632`.
- Margins, `out/work/venus/relief/ext-nb1.png`. Tool `generate_image`, model `nano_banana_pro`, aspect 4:3, one input: `ext-in.jpg` (3072 x 2304 flat magenta #FF00FF, the approved image scaled by 0.8727 to 2458 x 1382 at the top centre). Takes: 3 (two `seedream_5`, one `nano_banana_pro`). Kept the `nano_banana_pro` take: warmest, closest palette to the approved image; both `seedream_5` takes were paler. Prompt:

  > Image 1 is a view from high above the cloud tops of a golden planet at sunrise, placed in the top centre of a larger canvas. The rest of the canvas is flat magenta (#FF00FF): a strip on the left, a strip on the right and a wide strip along the bottom. Paint over all of the magenta so the canvas becomes one continuous, wider and taller view of the same cloudscape: continue the cloud deck, the towering cumulus, the deep shadowed canyons between them and the warm haze outward past the picture's edges with the same scale, colours, contrast, lighting and sharpness, so that the border cannot be found. The Sun is low on the horizon at the upper right, so cloud tops facing it are lit warm gold and cream and everything facing away falls into deep brown shadow. In the bottom strip the clouds are nearer to the camera: larger billowing cumulus tops seen from above with crisp detail, lit rims and dark valleys between them, getting bigger toward the bottom edge. On the left and right continue the curved horizon, the thin bright atmosphere line and the dark starry sky. Keep the painted part of image 1 exactly as it is. No magenta may remain anywhere. No text, no border, no frame, no vignette.

- Clean plate (the deck behind the two central towers), `out/work/venus/relief/clean-sd1.png`. Tool `generate_image`, model `seedream_5`, aspect 16:9, one input: `references/approved/venus-close.jpg`. Takes: 2 (one per model). Kept `seedream_5`: the deck behind the towers continues the streaks of the surrounding deck. Prompt:

  > Edit image 1. Remove the tall cloud towers that rise above the cloud deck in the middle of the picture: the central tower with the pointed top, the tower just to its right, and the large bank of piled cloud to their left. Where they stood, paint the flatter, more distant cloud deck that lies behind them: low rippled cloud tops, soft warm haze and long faint streaks receding toward the horizon, matching the surrounding deck in scale, colour, brightness and sharpness. Keep the foreground clouds at the bottom, the horizon, the Sun, the sky and the stars exactly as they are. Same framing, same exposure, same colours. No text, no border.

- `python3 assets-src/venus/relief/compose.py ext-nb1.png clean-sd1.png` registers both takes on the approved image (ECC 0.9984 and 0.99), matches colour, and writes `ext-3520.png` (the canvas: approved pixels inside, the take outside, feathered), `ext-weight.png` and `clean-2816.png`.
- Depth: `python3 tools/ml/depth.py --in out/work/venus/relief/ext-3520.png --out-prefix out/work/venus/relief/ext` gives `ext-depth.raw` (3520 x 2376 float32, relative inverse depth).
- Margin strips of the canvas upscaled 2x with `tools/ml/upscale.py`: `strip-b-2x.png` (bottom), `strip-l-2x.png`, `strip-r-2x.png`, and `strip-c-2x.png` (the clean plate under the towers, from x 1250, y 700 of the approved image).

### public/assets/venus/{full,web}/relief-L0-*, relief-L1-*, relief-masks.png, src/stops/venus/relief.json

`python3 assets-src/venus/relief/build.py` (about 45 s, no arguments).

- Canvas at 2x (7040 x 4752): `close-5632.png` inside, the upscaled strips outside. The margins take the tone of the approved image's own edge (`grade` in `build.py`): the low frequencies (Gaussian, sigma 70 px at 1x) of the approved image are continued outward from its nearest edge pixel, and each margin pixel is multiplied by the ratio of that target to the canvas's own low frequencies (limits 0.15 to 1.6), per channel, from 40 px past the edge on, for the bottom margin and the lower 450 to 700 rows of the side margins. Before this the generated cumulus below the frame stood pale grey against the approved image's dark golden foreground in frames 1322 to 1385.
- Distance: dist = 1 / (a depth^g + 1 / 10.4736) fitted to the sphere (a 1.3896, g 0.9014, median abs log error 0.10), blended into the exact sphere distance within 3 deg of the horizon. Near cumulus stay in as bumps.
- L1, the two central towers: hand outlines (`TOWERS` in build.py) refined by GrabCut at 2x, base faded over 34 and 46 px. Colour rebuilt in scene space so that L1 over L0 gives the approved pixels at the fit pose (clipped share 1.8e-5). Distance: a curtain standing on the base line of each tower, never behind 0.97 of the deck.
- L0, the whole deck from 30 px above the horizon down, with the clean plate under the towers.
- Masks: R = haze in the basin between the towers (drifts), G = the light shafts (sway about the Sun). Both zero on the towers.
- Checks: frame 1440 at review beside the approved image, mean abs difference 1.85 of 255 before the aprons.

### public/assets/venus/{full,web}/relief-Al-*, relief-Ar-*, src/stops/venus/aprons.json

The entry of the terrain view starts higher and further back (camera height 1.42 at frame 1322), so the frame reaches up to 1164 px left and 816 px right of the canvas (canvas px, approved scale; `poses.ts` and `footprint.py` print it per frame).

- Inputs: `apron-l-in.jpg`, `apron-r-in.jpg` (2400 x 1800): rows 900 to 2376 of `canvas-1x.png` (written by build.py), 672 px of the canvas edge as context on one side, 1296 px of flat magenta on the other.
- Tool `generate_image`, aspect 4:3, one input each. Takes: 2 per side (one `nano_banana_pro`, one `seedream_5`). Kept `seedream_5` for both: darker, tone continuous with the canvas edge; the `nano_banana_pro` takes were brighter and showed a step at the border. Prompt (left; for the right side "left" and "right" are swapped):

  > Image 1 is part of a wide view from high above the cloud tops of a golden planet at sunrise, looking steeply down at the cloud deck. The right third of the canvas is painted; the rest of the canvas is flat magenta (#FF00FF). Paint over all of the magenta so the canvas becomes one continuous view of the same cloudscape: continue the cloud deck to the left with the same scale, colours, contrast, lighting and sharpness, so that the border cannot be found. The Sun is far away beyond the top of the frame, low on the horizon to the upper right, so here almost everything lies in deep brown shadow: dark billowing cumulus tops seen from above, near black valleys between them, and only faint warm gold rim light on a few crests that face the Sun. The clouds get larger toward the bottom edge, where they are nearest the camera, with crisp cauliflower detail. No bright white clouds, no sky, no horizon, no stars and no sun in the new part. Keep the painted part of image 1 exactly as it is. No magenta may remain anywhere. No text, no border, no frame, no vignette.

- `python3 assets-src/venus/relief/apron.py apron-l-sd1.png apron-r-sd1.png` (paths under `out/work/venus/relief/`): registers each take on its context (ECC, affine), matches Lab mean and spread on the 412 px of context next to the border, builds each apron 1920 x 1728 at the approved scale (1760 px beyond the canvas edge plus 160 px under it; the outer 464 px and the rows above 900 are mirrored fill, seen only under the cover), upscales 2x with `tools/ml/upscale.py`, and writes the distance as the canvas edge's ratio to the sphere, relaxed to its median over 500 px.
- In the film L0 fades in over its outer 160 px (approved scale) on the left and right; the aprons are drawn under it and do not write depth.

### public/assets/venus/{full,web}/relief-air.png, sky-terrain.webp

`bash assets-src/venus/relief/air.sh` renders frame 1440 with the air and the sky glow off (`out/work/venus/relief/base.png`, review, nograin) and runs `air.py` on it.

- Air (1024 x 512, azimuth +-80 deg by elevation 0 to 80 deg above the true horizon, power 0.5): the approved image with stars removed (opening 9 px, blur 2.5) minus the same of the base frame, in scene values. Sky values are continued downward from 0.08 deg above the horizon before the blur, so the blur does not mix deck into the horizon row. The dome draws it over everything, with opacity 0.92 where it is bright, so the Sun in the film is the approved Sun.
- Sky patch: the stars of the approved image (image minus the calm sky, divided by what the dome lets through), mirrored about the horizon and faded out over 170 px below it, because the stars slide against the horizon as the camera sinks and rises. Margin 0.125, `sky.json` terrain gain 10.

### Changes after the first entry and exit frames (05:05 to 05:45)

- `build.py`: the relief of the bottom margin is pressed toward the deck (ratio to the sphere distance: 1 - (1 - ratio) x (1 - 0.8 smooth(1560, 1860, y)), canvas rows): the generated bank below the frame stood 0.33 camera heights above the deck and its lower edge came into frame at 1314 to 1350. Edge of L0 now below the frame on every frame from 1314 on (predicted by projecting the mesh edge through the poses of `poses.ts`).
- `build.py`: slope of the log ratio limited to 0.0015 per px (`SLOPE`, a cone erosion at 1/8 size), so no wall of the mesh is steeper than that.
- `build.py`: the haze mask is blurred with sigma 40 px (was 14) and the drift is clamped to +-3.3 s in `relief.ts`, speed 0.0025 widths per second: the sharp mask edges stretched the texture by up to 90 percent at the end of the drift (2.8 percent of relief pixels under one texel at frame 1551, now 0.4).
- `apron.py ... dist` rebuilds only the distances. The far part of each apron follows the row profile of the canvas edge (blur 160 rows) and is blended into the sphere within 3 deg of the horizon, so no apron stands above the horizon when the camera rises.
- `air.py`: stars are mirrored about the line 1.0 deg above the horizon (`SEAM`), faded from 130 to 260 px below it. Where the air is bright (around the Sun, along the limb) the star layer is filled from a clean part of the same image (`CLEAN`, rows 30 to 390, columns 100 to 1300, tiled by reflection, gain 0.7) instead of black: when the camera rises the horizon dips and that part of the patch comes out above the glow.
- `relief.ts`: the dome cuts the sky fully within 2 deg of the film's Sun (fading to 5 deg), so the only Sun in the terrain view is the approved one in the air texture. Without it a second small Sun separated from the first on the rise.

## Dive patches

### public/assets/venus/{full,web}/patch-a.jpg, patch-b.jpg, patch-c.jpg, patch-d.jpg (4096 x 4096 and 2048 x 2048)

Four gnomonic levels about the dive spot (`assets-src/venus/patches/spot.json`, body lon 25.4909, lat 50.3727, written by `npx tsx assets-src/venus/patches/spot.ts`), widths 90, 53.13010235, 28.07248694 and 14.25003270 deg (half-tangent 1, 0.5, 0.25, 0.125: each level is exactly twice the scale of its parent). North up. Same albedo encoding as the wrap (24 * v * v). Designed with the predictor before anything was rendered: `npx tsx assets-src/venus/patches/predict.ts --levels "90,53.13,28.07,14.25" --kinds dive,rise --every 3` gives 0 soft pixels at 1920 x 1080 on every frame outside the covers (the same tool gives 0 on the Mars dive and rise).

No real data exists for the cloud tops at this scale, so the detail is generated, level by level, each from its parent:

1. Canvas. Level A: `python3 assets-src/venus/patches/patch.py to-patch public/assets/venus/full/wrap-color.jpg 90 4096 out/work/venus/patches/a-src-4096.png`. Levels B, C, D: `patch.py subpatch PARENT-4096.png PARENT_DEG CHILD_DEG 4096 CHILD-src-4096.png` (the parent's central half, enlarged twice).
2. `python3 assets-src/venus/patches/tiles.py split CANVAS OUTDIR SIZE`: 2 x 2 tiles of 2240 px with 384 px overlap, written at 1408 px (level A) or 1120 px (B, C, D) as `in-tl.png`, `in-tr.png`, `in-bl.png`, `in-br.png`.
3. Each tile: `generate_image`, model `seedream_5`, aspect 1:1, one input (`in-<tile>.png`), output 2048 x 2048. Prompts below.
4. `python3 assets-src/venus/patches/tiles.py assemble CANVAS TILE_DIR OUT-4096.png 12 TL,TR,BL,BR cut` (the four numbers are the takes kept): each tile is resized to 2240, its low frequencies are locked to the canvas (ratio of Gaussian blurs, sigma 12 px), its chroma is taken from the canvas (sigma 3 px: the model turns the pink-cream highlights cream), and the tiles are joined along the least-difference path through the overlap (`cut`, feather 6 px). A cross-fade over the overlap ghosts, because two takes of the same area do not agree in their fine detail.
5. `python3 assets-src/venus/patches/patch.py export out/work/venus/patches public/assets/venus 4`: nests the levels from the deepest up (every parent carries its child's pixels, reduced, in its centre, feather 0.12, so nothing changes shape where a level fades in), JPEG 94 4:4:4, `full` at 4096 and `web` at 2048.

The approved images are not inputs of these takes. The patches are albedo (the hero divided by its light curve, encoded), a muted tan map that does not look like either approved image, and a style image pulled the tiles toward the lit hero colours (tried on the far side of the wrap: the style image was pasted into the tile). The approved hero is in every tile through the canvas: level A is the hero's own pixels in the wrap.

Prompt, levels C and D (take 1 of every tile):

"Faithful 2x enlargement of Image 1, a small square crop of a top-down (straight down, nadir) aerial photograph of the cloud tops of Venus: one thick unbroken deck of cloud seen from above, north at the top.

LAYOUT, TONE AND COLOR LOCK:
Image 1 fixes the picture. Every cloud bank, bright cloud top, streak, swirl, soft shadow and darker trough that can be seen in Image 1 stays at its exact position, with its exact outline, brightness and color. Smooth areas of Image 1 stay evenly toned: do not put a new cloud bank, a new tower, a new dark shadow or a new bright patch where Image 1 has none. Keep the muted tan and beige palette with pale pink-cream highlights exactly as in Image 1, and the same gentle contrast: no deep shadows, no grey or cold tones. Scaled back down to the size of Image 1, the result must look identical to Image 1.

DETAIL TO ADD, ALL OF IT SMALLER THAN THE SMALLEST FEATURE OF IMAGE 1:
Image 1 has far too few pixels. Give every part of it the fine grain of a sharp, high resolution aerial photograph taken straight down: the outlines of the brighter banks break up into small knotted cauliflower billows and crisp scalloped edges; the surfaces of the banks show fine cottony cumulus texture; the smooth areas show fine fibrous streaks combed along the flow, faint ripples and rows of tiny soft puffs; thin wisps of haze feather the edges of the darker gaps. It is cloud everywhere, soft and vaporous, never rock, sand or foam. The Sun is very low in the upper left: the small billows catch warm light on their left side and lay short soft shadows to the right. Every part is in sharp focus down to the pixel. No blur, no noise, no grain stipple, no sharpening halos, no painterly brush strokes.

Strict nadir aerial texture edge to edge. No horizon, no sky, no stars, no planet limb, no vignette, no border, no text, no watermark."

- Level D, take 1: the same with "seen from above at close range".
- Level D, later takes (the first takes of level D drifted toward an oblique view, one with a Sun on a horizon): the first paragraph ends "seen from directly above at close range, north at the top. The camera looks straight down: there is no horizon, no sky and no Sun anywhere in the picture, every part of the frame is cloud deck seen from above."; the lock adds "a new glow", "no grey, white or cold tones, no glare" (and for tile tl, takes 3 and 4: "Same framing, same scale, same crop: nothing is shifted, zoomed, rotated or recomposed."); the sentence on the Sun becomes "The small billows catch warm light on their left side and lay short soft shadows to the right."; the last paragraph is "Strict nadir aerial texture edge to edge, evenly lit from corner to corner. No horizon, no sky, no Sun, no glow, no stars, no planet limb, no vignette, no border, no text, no watermark."
- Level B: as C with "fine pebbled cumulus texture", "rows of tiny puffs", and without the sentence "It is cloud everywhere, soft and vaporous, never rock, sand or foam."
- Level A: as B with "a square crop of a top-down (straight down, nadir) orbital photograph", "seen from far above", "Every cloud band", "Image 1 has too few pixels", "orbital photograph taken straight down", "Strict nadir orbital texture".

Takes and checks. Check: `python3 tools/ml/checkmoved.py --a in-<tile>.png --b <take resized to the input size>.png`, passes when the 99th percentile of the flow is at most 1.5 px.

| Level | Tile | Takes | Kept | p99 of the kept take (px) | Rejected |
| --- | --- | --- | --- | --- | --- |
| A | tl | 2 | 2 | 3.74, fails | take 1 (other model, see below) |
| A | tr | 2 | 2 | 9.35, fails | take 1 |
| A | bl | 2 | 2 | 4.23, fails | take 1 |
| A | br | 2 | 2 | 7.39, fails | take 1 |
| B | tl | 1 | 1 | 0.95 | |
| B | tr | 1 | 1 | 0.60 | |
| B | bl | 1 | 1 | 0.68 | |
| B | br | 1 | 1 | 0.73 | |
| C | tl | 1 | 1 | 0.76 | |
| C | tr | 3 | 3 | 1.02 | take 1: 16.2 px; take 2: the service returned an error, no image |
| C | bl | 1 | 1 | 0.54 | |
| C | br | 1 | 1 | 1.44 | |
| D | tl | 4 | 4 | 1.47 | take 1: 2.68; take 2: 52.7 (the picture shifted); take 3: 2.80 |
| D | tr | 3 | 3 | 1.50 | take 1: 37.5 (an oblique view with a Sun); take 2: 0.31, passes but adds almost nothing |
| D | bl | 2 | 2 | 1.28 | take 1: 1.52 |
| D | br | 2 | 2 | 0.75 | take 1: 1.96 |

Known departure, level A. Take 1 of level A was `nano_banana_pro` with this prompt: "Strict 2x super-resolution of Image 1, a square crop of a top-down (straight down, nadir) orbital map of the cloud tops of Venus: one thick unbroken deck of cloud seen from far above, north at the top.

EXACT LAYOUT, TONE AND COLOR LOCK:
Image 1 is the exact map to sharpen in place. Scaled back to the size of Image 1, every cloud band, streak, swirl, filament, bright cloud top and darker trough must stay at its exact position, shape, brightness and color. Keep the muted tan and beige palette with pale pink-cream highlights exactly as in Image 1. Do not shift, rotate, resize, add or remove any large feature. Do not brighten, darken, recolor or raise the contrast.

DETAIL TO RESOLVE:
Replace only the softness of Image 1 with crisp, photoreal cloud-top structure, as a high resolution orbital photograph would show it: fine fibrous streaks combed along the flow, feathered filament edges, small billows and cauliflower cumulus tops along the brighter ridges, soft troughs between the bands, thin wisps of haze. The Sun is very low in the upper left: raised cloud tops catch light on their left side and lay soft shadows to the right. No noise, no grain stipple, no sharpening halos, no painterly brush strokes.

Strict nadir map texture edge to edge. No horizon, no sky, no stars, no planet limb, no vignette, no border, no text, no watermark." It passes the check and adds nothing: the tile comes back as soft as the wrap, and the frames of the dive between 1.7 and 0.6 radii showed enlarged pixels. `kit/03-METHOD.md` asks for real detail, not enlarged pixels. The `seedream_5` takes kept for level A add cumulus and fibrous structure below the size of the wrap's features. Their median flow is 0.29 to 0.41 px, but their 99th percentile is 3.7 to 9.4 px at the input size of 1408 px, above the limit: against a soft input the flow tool reads the new fine structure as movement. By eye every band, bank and the vortex sit where the wrap has them (`out/work/venus/patches/a-seam.jpg`, canvas beside result), and the low frequencies and the chroma are the wrap's by construction (step 4). From level B on, where the input is already sharp, the same model and prompt pass. Rejected takes from the prompt search (folders `b`, `b2`, `c`, `c2`, `c3` under `out/work/venus/patches/`) were a "DETAIL TO INVENT" prompt that added towers and shadows of its own (rejected by eye and by the check) and the faithful model at levels B and C (no detail added).

The join between wrap and levels is checked in rendered frames, not only in the maps: stills of the dive at 1287, 1296, 1299, 1302, 1305 and of the rise at 1563 to 1586.

## File list

Every file below exists in both sets (`full` and `web`); the section that makes it is named after it.

- `public/assets/venus/<set>/wrap-color.jpg`: Orbit view, wrap.
- `public/assets/venus/<set>/wrap-flow.jpg`: Orbit view, flow layer.
- `public/assets/venus/<set>/bolt.jpg`: Orbit view, lightning.
- `public/assets/venus/<set>/limb.bin`: Orbit view, limb table.
- `public/assets/venus/<set>/sky-hold.webp`: Orbit view, sky patch of the hold.
- `public/assets/venus/<set>/relief-L0-color.jpg`, `public/assets/venus/<set>/relief-L0-dist.bin`: Terrain view, `build.py`.
- `public/assets/venus/<set>/relief-L1-color.jpg`, `public/assets/venus/<set>/relief-L1-alpha.png`, `public/assets/venus/<set>/relief-L1-dist.bin`: Terrain view, `build.py`.
- `public/assets/venus/<set>/relief-masks.png`: Terrain view, `build.py`.
- `public/assets/venus/<set>/relief-Al-color.jpg`, `public/assets/venus/<set>/relief-Al-dist.bin`, `public/assets/venus/<set>/relief-Ar-color.jpg`, `public/assets/venus/<set>/relief-Ar-dist.bin`: Terrain view, `apron.py`.
- `public/assets/venus/<set>/relief-air.png`, `public/assets/venus/<set>/sky-terrain.webp`: Terrain view, `air.sh`.
- `public/assets/venus/<set>/patch-a.jpg`, `public/assets/venus/<set>/patch-b.jpg`, `public/assets/venus/<set>/patch-c.jpg`, `public/assets/venus/<set>/patch-d.jpg`: Dive patches, `patch.py export`.
