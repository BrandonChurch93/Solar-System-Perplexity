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
9. Round 2, `python3 assets-src/venus/wrap/calm.py` (no model, about 80 s; reads the round 1 files kept in `out/work/venus/r2/bak/` and writes `wrap-color.jpg` and `patch-a.jpg` of both sets): the ring of the map that the hero shows at a view cosine of -0.02 to 0.44 (full weight below 0.26) is pulled toward its local mean in log space, value = base * (value / base)^k with k down to 0.15 and base a Gaussian of 1 degree. That ring is the hero's limb glow taken apart and divided by a light curve near zero; it came out as red streaks, seen as thin stepped arcs inside the limb at the hold and the dive and as orange blocks from the departure camera (frame 1618). 19 percent of the wrap and 17 percent of patch a change (mean 0.85 and 1.4 of 255); patch b, c, d lie outside and are byte identical to round 1. The hue stage of the script runs on two spots only (`HUE.spots`, hero pixels (1866, 338) and (1874, 329), radius 8 to 16 px, gain 1 to 5, soft 0.7): the hero's two small golden highlights beside the vortex came out pink in the map, their green and blue are raised to the hero's hue. Run over the whole cap it made the hold worse, so it is masked to those spots. Checks: review 1185 against the hero in the ring 395 to 452 px 5.98 (before 6.15), crops of the vortex limb at 1185 and 1287, draft frames 1605 to 1630.

Checks: the hold compare at review tier (`npm run compare -- --stop venus --view hold --tier review`), native crops of the terminator, the vortex and the night side beside the hero.

### public/assets/venus/{full,web}/wrap-flow.jpg

Made by `build.py` from the map itself: the band pass of the cloud luminance (the streaks), 4096 x 2048 and 2048 x 1024. The shader draws it as a veil in ratio form, veil(now) / veil(hold middle), so the judged frame equals the hero and the layer drifts across the map before and after. No model.

Round 2: the file is RGB. Red is the flow layer as before. Green is the highlight lift, written by `python3 assets-src/venus/wrap/lift.py` (no model, about 20 s, inputs `out/work/venus/wrap/{far-eq,hero-eq,albedo-eq,hero-eq-w}.png` and the flow file itself): the wrap stores albedo up to 24 and scales brighter texels down with their hue kept, which left the sunlit cumulus tops on the night side five times too dim and, after the tone curve, orange and blocky where the hero is cream (true albedo there up to 135). Green holds log2(true peak / 24) / 3, zero elsewhere (0.019 percent of the map is lifted, median factor 1.9, none below cap weight 0.42). The shader multiplies the albedo by 2^(3 green) where the texel itself is bright. Checks: flow channel error after the round trip 0.67 of 255 (full), 0.89 (web); crops of the cumulus bank at frames 1185 and 1287 beside the hero.

### public/assets/venus/{full,web}/bolt.jpg

The two lightning cells of the hero, cut out by `lightning.py` as light above the cloud under them. They flash on a seeded schedule that peaks at the hold middle (39.5 s). Twelve more cells are seeded on the night side and light the cloud's own texture, no asset.

### public/assets/venus/{full,web}/limb.bin

65 x 256 RGBA float32 (azimuth around the disc from the projected Sun direction, by impact parameter). Rows inside the disc are a haze layer drawn over the disc's edge on both sides: rgb emission, a opacity. Rows outside are the glow past the edge. Round 1 fit: `bash assets-src/venus/fit/orbit.sh` (`fit/limb.py build`, then `refine` twice; those modes are gone, the inside rows of that fit are kept in `out/work/venus/limb-lut-r1.npz`). Round 2: `bash assets-src/venus/fit/glow.sh` (a still without the limb layer, `fit/limb.py glow`, two rounds of `fit/limb.py settle` at 0.8 and 0.6, a halo only still, build). `limb.py` has the modes `glow`, `settle` and `mono`. Last step of round 2: `python3 assets-src/venus/fit/limb.py mono` (no render; reads `out/work/venus/r2/bak/limb-lut-pre-mono.npz`, the table after `glow.sh`): the edge row is read from the hero again and smoothed along the azimuth in square root space with sigma 0.6 cells (in linear light with sigma 1.2 the hero's one short bright streak on the night limb bled into a 35 degree orange arc); the inside rows are scaled by min(new edge luma / old, 1), fading out 9 px inside the limb, and then fall monotonically inward in luma (they held a second band 16 to 20 px inside the night limb, read as a doubled rim). Check: review 1185 against the hero, whole frame 4.82 to 4.80, halo 5.21 to 5.14; rim peaks by azimuth cell in `NOTES.md`. The outside rows now reach impact parameter 2.5 (was 1.6) and hold a smooth model of the hero's glow: the hero's 25th percentile per cell minus a global background [0.00419, 0.00585, 0.00707], fitted off the Milky Way band by exponentials (lengths 0.03, 0.09, 0.27) times a Fourier series of order 3 in azimuth, equal to the hero within 0.03 of the edge, monotone, tapered to zero at the outer end. The round 1 rows ended on ragged lobes at 1.6 and had soaked up Milky Way light, which showed as a circular edge in the dive. The inside rows end on alpha 1 with the hero's edge colour over the last 0.0035 before the limb, so the rim shader's edge ramp (2 px, in display space) meets it. Fit: film against target outside rms 0.0032, 0.0008, 0.0004 scene units. The hero's edge is measured per azimuth (the painted disc is not round, its night limb lies up to 9.6 px outside the fitted sphere at 2816 wide). Residual at frame 1185 after the last fit: inside the disc 0.0175, outside 0.0042 scene units RMS.

Round 3: the file now holds 512 rows. Rows 0 to 255 are the hold table above, unchanged. Rows 256 to 511 are a far table for every frame after the hold, written by `python3 assets-src/venus/fit/far.py public/assets/venus/full/limb.bin` (it reads the first 256 rows of the file it is given and writes both sets): along the azimuth a median over 9 cells and a Gaussian of 2 cells in square root space, so the hero's short bright streak and violet patch on the night limb do not travel with the camera; on the night side the inside veil is one falloff (alpha halved, monotone inward and outward). `rim.ts` and `globe.ts` mix from the hold table to the far table with `uLimbFar` (0 in the hold, 1 from 0.5 s after it). Check at draft 1287: the deepest local dip of the radial luma profile across the limb is at most 3 levels at every azimuth (6 to 7 before).

Phase 6, item 4 (night limb at the rise pose, rim line outside a dark trough): `far.py` again, same command (input the hold rows, kept in `out/work/venus/r3/bak/limb-hold.bin`; the round 23 table is `out/work/venus/r3/bak/limb-r23.bin`). The round 3 night model had a step at the silhouette (inside edge 0.072 against 0.040 just outside, linear) and an inside spike 2 px wide at the rise's disc radius of 405 px. Now the night side's inside rows start from the first outside row, so one value crosses the silhouette, and fall inward with `SHAPE = (0.3, 6.0, 0.7, 45.0)` (two exponentials: weight and length in px at 543 px radius). Only the night columns of the far rows change (columns 0 to 13 and 49 to 64); the hold rows and the outside rows are the same bytes. Radial luma rows (`limbrow`): 1586 at azimuth -90: inside 41 to 50, edge 56, outside 47, 45, 43 (round 23: trough 36, edge 65). 1287 at azimuth -60: inside 43 to 48, edge 53, outside 49, 47, 44 (round 23: edge 73, outside 65, 53).

### public/assets/venus/{full,web}/hold-detail.jpg (2048 x 2048 and 1024 x 1024), hold-rim.bin (513 x 96 float32 RGBA, the same file in both sets), src/stops/venus/hold.json, assets-src/venus/hold/frame.json

Phase 6 polish, item 2 (hold 1185: strands to the edge, grey green rim and gold glint on the night side, fine structure on the night side). No model. Two gain layers for the hold only, both log2 of (approved hero / film without the layers):

- `hold-detail.jpg`: byte 128 is a gain of 1 and the 255 levels span 4 stops (`stops` in `hold.json`). The globe shader projects it onto the sphere through the fitted hold camera (`src/stops/venus/fit.json`, map half width 1.016 disc radii, `margin`), so it is painted on the cloud map and turns and drifts with it. Where the layer acts the wrap is read at a fixed level (512 px wide, `look.hold.base`) as the smooth base, and the layer puts the hero's own cloud detail back on top.
- `hold-rim.bin`: float32 RGBA, 512 cells of azimuth plus one wrap column, 96 rows of radius about the film's silhouette in the view's frame (the closest approach point of the view ray projected through the fitted camera). Rows 0 to 39 lie inside the disc (0.95 to 1 radii, read by `globe.ts`), rows 40 to 95 outside (1 to 1.08 radii, read by `rim.ts`, faded out from 1.05 to 1.07). It is the part of the gain that is smooth along the limb (a median of 15 px runs along each ring before the ratio is taken), so no star enters it (the stars belong to the sky patch, which does not move with the planet). It carries the hero's out of round edge and the glow just past it. It acts only while the camera is within 3 to 6 percent of the fitted distance (`look.hold.near`).

Both weights go to zero with `uLimbFar` in the 0.5 s after the hold, so the dive, the terrain and the rise do not see the hold's light.

Items 3 and 4 (night side structure at 1287 and 1586): past the hold the detail map stays alive as a high pass only. `globe.ts` divides its gain by the gain of the same map read at mip level 5 (`look.hold.far.lod`), so the hero's fine cloud structure is carried and its broad light is not painted twice. It acts inside 0.86 to 0.94 of the hold's disc radius (`look.hold.far.inner`), only where the map has at least 1 to 1.25 texels per screen pixel (`look.hold.far.dense`) and not under the motion taps. For that the map went from 1536 to 2048 px (web 1024): at 1287 the screen has 766 px per radius at the nadir, the 2048 map 1008 texels per radius (1.32 per pixel; the 1536 map had 0.99).

Why two layers: a single map painted on the globe (takes f1 to f5) reached the same numbers at 1185 but showed a doubled rim at frames 1110 and 1259, because its edge part turned with the clouds (1.4 deg over the hold). The edge light belongs to the view, the cloud detail to the globe.

Script: `assets-src/venus/hold/detail.py`, inputs `references/approved/venus-hero.png`, `src/stops/venus/fit.json` and nograin final stills of frame 1185 (`npm run -s still -- --frame 1185 --tier final --diag nograin --out FILE`). Float state between passes: `out/work/venus/hold/logq.npy` (detail map) and `rim.npy` (rim strip). Steps, each followed by a build and a still:

1. `python3 assets-src/venus/hold/detail.py neutral`, still S0 (the smooth base without the layers).
2. `python3 assets-src/venus/hold/detail.py dots`, still DOTS; `python3 assets-src/venus/hold/detail.py measure S0 DOTS` writes `frame.json`: where the 45 dots of the map land in the film against the fitted camera (mean shift -0.62, -1.55 px at 1920 wide, rest after the affine fit 0.08 px rms; the film camera at 1185 is not the fitted camera to the pixel, the rig adds a seeded drift). Without this step the layer sat 1.6 px off and the disc zone stayed at 7.0 levels.
3. `python3 assets-src/venus/hold/detail.py build S0`, still G1. Inside the disc the detail gain is hero / S0 texel by texel (the film sample is held 0.9 px inside the silhouette); the rim strip takes the ring medians of both pictures every 0.25 px of radius.
4. `python3 assets-src/venus/hold/detail.py refine G1`, still G2; `refine G2`, still G3 (kept). Each pass adds log2(hero / film) to both float states.

The hero's painted disc is an ellipse (669.8 by 664.3 px at 2816 wide), the film's is a sphere (670.7 by 670.5): the outer 2.5 px at the top and 4.2 px at the bottom of the film's disc take the hero's glow there, so the visible edge is the hero's.

Takes: f1 to f5 (one map, rejected for the doubled rim at the hold's ends), g1 (build), g2, g3 (the 1536 map, kept until 23:00), then the same three steps at 2048 with `SIZE = {'full': 2048, 'web': 1024}`: h1 (build), h2, h3 (kept). `frame.json` and the rim strip's layout did not change.

Checks, take g3 (frame 1185, final tier, mean absolute difference from the hero in levels of 255, zones whole, disc inside 395 px, ring 395 to 452 px, halo 456 to 560 px, sky):
- nograin: 1.95, 0.72, 0.45, 2.96, 2.41 (round 23 build nograin 4.62, 8.65, 5.90, 4.91, 2.41).
- with grain, as judged: 2.30, 1.25, 1.03, 3.19, 2.68 (round 23 build 4.80, 8.53, 5.95, 5.14, 2.73).
- High pass luma against the hero in five boxes: shift under 0.03 px, correlation 0.995 to 0.997 (0.62 before), detail level 97 to 99 percent of the hero's.

Checks, take h3 (the 2048 map, same zones):
- nograin: 1.90, 0.56, 0.33, 2.96, 2.41.
- with grain, as judged: 2.27, 1.15, 0.98, 3.19, 2.68.
- High pass luma against the hero in five boxes: correlation 0.986 to 0.998.
- Radial profile across the limb at eight azimuths within 3 levels of the hero except the one pixel on the silhouette at the top (177 against 163) and at -45 deg, 1.006 radii (56 against 67).
- G17: 1185 median 1.124, p25 0.832 (1.122 before); 1440 median 1.035, p25 0.976.
- Draft frames 1095, 1110, 1150, 1230, 1259, 1263, 1267, 1271, 1275, 1287: one clean edge in every frame, no doubled rim, the layers gone by 1275.
- `python3 tools/assets/mirrorcheck.py` on the judged still with grain: clean.

### public/assets/venus/{full,web}/sky-hold.webp

The hero's own sky as the sky patch of the hold.

- Fill behind the planet: `generate_image`, input `references/approved/venus-hero.png`, aspect 16:9. Prompt: "Edit image 1. Remove the planet completely, and remove every trace of the planet's glow and atmosphere halo. Fill the area it covered with deep space that continues the surrounding sky exactly: the same dense field of fine, pinpoint, slightly colored stars, the same dusty Milky Way band with warm brown dust clouds and small star clusters crossing horizontally behind where the planet was, the same near-black background, the same star sizes, density, brightness and grain. Keep everything else in the image unchanged: same framing, same stars in the same places, same exposure and color. No planet, no moon, no sun, no glow, no bright nebula, no colors that are not already present, no text, no border."
- Takes: one `nano_banana_pro` (came back 2752 x 1536 with a brighter core behind the planet, rejected), one `seedream_5` (kept, `out/work/venus/sky-fill-sd.png`: the band continues evenly).
- `python3 assets-src/venus/sky/patch.py` (called by `fit/orbit.sh`): the hero's sky outside the limb glow, the fill inside, the film's own halo (`halo-only.png`) subtracted so the glow is drawn once. Fill gain [2.125, 1.959, 1.319], the hero's own share of the patch 0.635.
- Fill, low frequencies: the fill's light below 0.25 (blur 40 px) is replaced by the hero's own sky, interpolated along each row across the disc, so no bright region sits behind the planet (it showed as a ghost arc when the sky shifts over the hold).
- Margins of the patch (12.5 percent each side): `generate_image`, input `out/work/venus/sky-ext-in.jpg` (written by `patch.py`: the patch core in the middle of a magenta canvas, 3072 x 1728), aspect 16:9. Prompt: "Image 1 is a photograph of deep space placed in the centre of a larger canvas. The rest of the canvas is flat magenta (#FF00FF), a frame all around the photograph. Paint over all of the magenta so the canvas becomes one continuous, wider view of the same sky: continue the dense field of fine pinpoint stars, and continue the dusty Milky Way band with its warm brown dust clouds and small star clusters outward to the left and right edges of the canvas, with the same brightness, colours, grain and star sizes, so that the border cannot be found. The new parts must be new sky, not a mirror image or a repeat of the centre. Keep the photograph in the centre exactly as it is. No magenta may remain anywhere. Near-black background. No planet, no sun, no moon, no bright nebula, no glow, no text, no border, no frame."
- Takes: one `seedream_5` (kept, `out/work/venus/sky-ext-sd.png`), one `nano_banana_pro` (rejected: it rescaled the centre). The take is registered to the core by ECC (0.9982), scaled by one gain (1.218) and replaces the mirrored margins, which showed as a butterfly at the frame edges at the ends of the hold.
- Command: `python3 assets-src/venus/sky/patch.py hold references/approved/venus-hero.png out/work/venus/sky-fill-sd.png out/work/venus/halo-only.png public/assets/venus out/work/venus/sky-ext-sd.png` (round 1).
- Round 2 (the round 1 patch ended in a rectangle and in holes beside the planet that showed as a circular edge at frame 1287): canvas 4224 x 2376 (margin 25 percent each side, `sky.json` orbit margin 0.25, feather 0.125), no model run, the same two generated inputs. The hero is unchanged inside its border. First 12.5 percent past the border: the generated extension (`sky-ext-sd.png`), deblocked, its low frequencies (sigma 40) locked to a blend from the hero's edge to the live sky, its dark parts calmed (`calm()`: under scene 0.006 to 0.014 the background is the median and Gaussian of the luma with the goal's chroma, stars above 0.004 kept and half desaturated), cross faded through an irregular seeded mask to the live plate. Outer 12.5 percent: the live plate alone under the engine's feather. The live plate is the film's own shared sky at the patch's aim: `WIDE=43.79327 out/work/venus/r2/live2.sh wide -160 -4 -1 uhd review ungraded` (frame 1185, orbit group hidden, patch off, `skyAim.orbit [-160, -4, -1]`, which lays the live band on the hero's band line), shaded by 0.85 and washed toward the hero's sky tone across the whole margin (`FAR`: ratio of the hero's replicated edge to the plate at sigma 160, clipped 0.33 to 3, fading out with distance). No reflection anywhere (`tools/assets/mirrorcheck.py`). Take 4 of 6 this round kept (takes 1 to 3: blocky green extension, visible rectangle, dark threshold too high).
- Command, round 2: `python3 assets-src/venus/sky/patch.py hold references/approved/venus-hero.png out/work/venus/sky-fill-sd.png out/work/venus/halo-only.png public/assets/venus out/work/venus/sky-ext-sd.png out/work/venus/r2/live-wide.png 1.0`. Checks: frames 1287, 1259, 1110, 1296 and 1100 at draft boosted 5 times (no circle, no rectangle), stars of the baked ring against the live sky in the feather (mean difference 0.12 of 255).

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
- Round 3, right apron only: `python3 assets-src/venus/relief/apronshear.py` once, directly after `apron.py` (a second run would shear the band again; the file before this step is `out/work/venus/r3/bak/relief-Ar-color-full.jpg`, pass it as the argument to repeat the step). The mirrored fill of the top band (rows 0 to 520 of the 3840 x 3456 texture, blended out by row 804) showed as chevron bars at the right edge of frames 1316 to 1350. The step samples `relief-L0-color.jpg` mirrored about the plate edge and sheared, so a streak leaves the edge along its own slope (0.16 at the horizon, 0.27 at row 330, 0.37 at row 620, measured with a structure tensor on the 500 px next to the edge); above the continued horizon it holds the far deck colour, blurred along x. It reaches 900 px past the edge and fades out by 1400 px; the film sees at most 600 px (`npx tsx assets-src/venus/motion/reach.ts 1314 1322 1350`). Writes the full set at JPEG 92 and the web set at half size, JPEG 88.

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
- Phase 6, item 5 (`air.py`, star layer only; `relief-air.png` comes out byte for byte the same, md5 3f551bf9): the stars below the line 1.0 deg above the horizon are no longer the mirror image of the stars above it. The mirror put a second copy of every star near the left limb at twice its distance to the line (the two bright stars at film x 206 and 239, row 359, came back at row 395, 36 px lower, on the edge of the limb). Now the rows below the line take the star layer from 300 px higher and 137 px to the left (`SHIFT`, approved pixels, reflected at the image edge), faded in from 8 to 64 px below the line (`LANE`) and out from 130 to 260 px as before. At the judged pose nothing of it is in view; when the camera rises and the horizon dips, the stars that come out are not a reflection of their neighbours. The earlier take (the reflected donor tile below the line) showed a butterfly of mirrored bright stars and was dropped. Run as before: `python3 assets-src/venus/relief/air.py out/work/venus/relief/base.png` (the base frame of 05:18 is still valid, the terrain at 1440 has not changed).
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
6. Round 2: `python3 assets-src/venus/wrap/calm.py` rewrites `patch-a.jpg` of both sets (see the wrap, step 9).

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

## Cover veil

### public/assets/venus/{full,web}/veil-clouds.jpg (2048 x 2048 and 1024 x 1024)

What it is: the cloud texture of the stop's own cover (`src/stops/venus/veil.ts`), a tile of cloud deck that repeats without a seam. The veil draws it on four sheets below the camera, each 2.5 times finer than the one above; the shapes of the sheets (holes, streaks along the pull back) are drawn by the shader, the tile gives them their cloud colour and their edges.

- Tool: `python3 assets-src/venus/veil/tile.py`. No model, no prompt: the file is derived from a generated asset of this stop.
- Input: `public/assets/venus/full/patch-d.jpg`, the finest dive patch (its recipe is under "Dive patches").
- Steps: resize to 2048; divide by its own blur of a fifth of the width so no side is brighter than the other; close the tile on itself along x, then along y (the last fifth is laid over the first fifth and the two are joined along the path of least difference, found by dynamic programming, feathered by 6 px; nothing is cross faded, so no cloud appears twice); the tile is then 1639 px. Highlights are rolled off: linear luma above 0.35 (`KNEE`) is compressed toward 0.6 (`CEIL`), colour kept, so the few burnt out tops of the patch do not show as white specks when a sheet is thin. The engine's loader repeats a texture along u only, so the file carries the tile with an eighth of itself repeated above and below, and the shader wraps v itself. Resize to 2048 x 2048 for `full`, 1024 x 1024 for `web`.
- Also written: `src/stops/venus/veil.json` (file name, pad, mean of the linear texels, 95 percent quantile of their luma), read by `look.ts`.
- Takes: 2. Take 1 joined the tile by a cross fade with itself half a tile away: every cloud appeared twice (`out/work/venus/veil-tiled.jpg` of that take showed the doubled banks). Take 2, kept, is the seam cut above.
- Checks: `out/work/venus/veil-tiled.jpg` (the tile 2 by 2): no line at the joins, no doubled cloud. No text, no stars, no sky in the tile.

## File list

Every file below exists in both sets (`full` and `web`); the section that makes it is named after it.

- `public/assets/venus/<set>/wrap-color.jpg`: Orbit view, wrap.
- `public/assets/venus/<set>/wrap-flow.jpg`: Orbit view, flow layer.
- `public/assets/venus/<set>/bolt.jpg`: Orbit view, lightning.
- `public/assets/venus/<set>/limb.bin`: Orbit view, limb table.
- `public/assets/venus/<set>/hold-detail.jpg`, `public/assets/venus/<set>/hold-rim.bin`: Orbit view, hold detail layer and rim strip, `hold/detail.py`.
- `public/assets/venus/<set>/sky-hold.webp`: Orbit view, sky patch of the hold.
- `public/assets/venus/<set>/relief-L0-color.jpg`, `public/assets/venus/<set>/relief-L0-dist.bin`: Terrain view, `build.py`.
- `public/assets/venus/<set>/relief-L1-color.jpg`, `public/assets/venus/<set>/relief-L1-alpha.png`, `public/assets/venus/<set>/relief-L1-dist.bin`: Terrain view, `build.py`.
- `public/assets/venus/<set>/relief-masks.png`: Terrain view, `build.py`.
- `public/assets/venus/<set>/relief-Al-color.jpg`, `public/assets/venus/<set>/relief-Al-dist.bin`, `public/assets/venus/<set>/relief-Ar-color.jpg`, `public/assets/venus/<set>/relief-Ar-dist.bin`: Terrain view, `apron.py`.
- `public/assets/venus/<set>/relief-air.png`, `public/assets/venus/<set>/sky-terrain.webp`: Terrain view, `air.sh`.
- `public/assets/venus/<set>/patch-a.jpg`, `public/assets/venus/<set>/patch-b.jpg`, `public/assets/venus/<set>/patch-c.jpg`, `public/assets/venus/<set>/patch-d.jpg`: Dive patches, `patch.py export`.
- `public/assets/venus/<set>/veil-clouds.jpg`: Cover veil, `veil/tile.py`.
