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
