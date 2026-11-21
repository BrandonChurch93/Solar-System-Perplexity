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

- Canvas at 2x (7040 x 4752): `close-5632.png` inside, the upscaled strips outside. The bottom margin is graded down to the darkness of the approved image's bottom 200 rows (L p50 6.3, p90 13.7): L x (0.36 + 0.14 smooth(40, 90, L)), chroma x k^0.7, ramp from 10 to 230 px below the approved edge.
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
