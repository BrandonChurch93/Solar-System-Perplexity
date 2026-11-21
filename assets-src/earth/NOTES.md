# Earth stop notes

Lab notebook of the agent that builds the `earth` stop. Read `assets-src/shared/STOP-AGENT.md` first, then this.

## State

- Branch `agent/earth`, looks on `agent/earth-looks`. VM: 4 cores, 7 GB RAM, no GPU.
- Started 2026-11-21 02:43 UTC. Merged `origin/main` at 9602aca.
- Judged frames: hold 1755, dive 1857, terrain 2010, rise 2156. Segments: hold 56 to 61 s, dive 61 to 64, terrain 64 to 70, rise 70 to 72.5, travel 72.5 to 75. 30 fps.
- Milestones sent to `/root`: orbit view (04:52 UTC, 90bedd6). Next: terrain view (in work, see "Terrain view as built"), then dive and rise.
- Engine hash 05c29d3a1588e95f since the merge of main 9f78a4e (engine batch 2). Stills from before are stale.

## Hero facts (`references/approved/earth-hero.png`, 2816 x 1584)

- Fit circle cx 1470.13, cy 793.37, r 682.72. vfov 30. Camera `[-0.090119, 0.002955, 4.442211]`. sunDir `[-0.815807, 0.533864, 0.222368]`. Globe quaternion `[0.0833959, 0.6138742, 0.0869521, 0.7801557]`. All of this is in `src/stops/earth/` JSON from the fit (see `geo.py` loaders).
- Sub-camera lon -77.354, lat 13.777. Sub-solar lon -160.212, lat 36.741. Landmark RMS 2.48 deg.
- Moon at (2509, 226) r 56 px, world position `[21.939059, 11.322249, -54.685321]`, radius 1.050301. Gibbous, lit from the left.
- Limb fit within about 3 px all round (30 degree sector at lower right unclear).
- Seen at native size: hurricane west of Mexico; aurora curtains rising above the north-east limb (green, red tops, up to about 120 px off the limb); aurora patches on the disc over the night Atlantic; small green patches at the right limb and bottom right; gold city lights on eastern Brazil and on West Africa and Iberia at the right limb; ice cap and Greenland at top; Milky Way dust left and right.
- Close image: horizon in the upper quarter, glint path up the middle, cumulus with long shadows toward the camera, peninsula at centre right, turquoise banks to its right, long green island at lower right.

## Tools that work here

- Image edits through `generate_image` (models: seedream_5, nano_banana_pro, gpt_image_2_6_flare), about 2 minutes each, input must be a JPEG (large PNG inputs fail): `out/work/earth/hero.jpg` is the hero at q96.
- Seedream keeps the picture pixel-aligned (median shift 0.2 to 0.7 px against the hero on clear land, output 2816 x 1584). Nano Banana Pro shifts it (about 1.3 px, flow median about 3 px, output 2752 x 1536). Use Seedream for edits that must stay registered.
- NASA `eoimages.gsfc.nasa.gov` returns 502 from this VM. `assets.science.nasa.gov/content/dam/science/esd/eo/images/...` serves the same files.
- `tools/ml/` upscale: about 20 s per tile, hero x2 took about 9 minutes. Result `out/work/earth/up/hero-x2.png` (5632 wide), `close-x2.png` same folder.
- `assets-src/earth/geo.py`: fit, camera and body loaders, `decode` and `encode` (sRGB and filmic), `hero(scale)`, `hero_geometry(scale)` (hit, lon, lat, cosv, ndl, y, d, rt), `map_dirs(W)`, `project_dirs(y, scale)`, `map_xy`, `sample_map`, `turn_about`, `spin_y`, gnomonic helpers, `read` and `write`, `WORK = out/work/earth`.

## Design decisions

### Memory (full set, with mipmaps; `src/core/sets.ts` counts w*h*4*4/3 for any image)

- Surface wrap 8192 x 4096: 171 MB. Cloud RGBA 8192 x 4096: 171. Emissive 4096 x 2048: 43. Storm mask 2048 x 1024: 11. Patches 5 x 4096 squared: 427 (96, 48, 24, 12, 6 degrees; nadir at altitude 0.03 needs a patch at most 7.2 degrees wide; confirm with G13). Relief about 350. Sky patches about 200. Moon about 15. Total about 1390 of 1400. Web set is a quarter. No height map for the globe.

### Layers of the globe

- Surface S (cloud free) and a cloud layer (color W, alpha a), composed in linear albedo: A = (1-a) S shadow + a W, then times the light curve.
- Solved from the hero: a = max over channels of (C - S~)/(Wmax - S~) against the declouded estimate S~ (Seedream take, low frequencies matched on clear areas, its bright glint patch on the Pacific west of Mexico flattened). Where a is under a threshold S = hero and a = 0. Elsewhere W = (C - (1-a) S~)/a, so the hold midpoint gives the hero back exactly.
- Cloud shadows: shader samples the cloud alpha offset toward the Sun (h tan zenith), soft. The surface is divided by the mid-hold shadow so the hero still matches.
- Cloud drift about the axis as a closed form d(t) that runs in the hold and eases to 0 by about 0.5 s after the hold ends, then stays 0, so the patches bake clouds at state 0 with no jump. The mid-hold offset is a whole number of map pixels (for example 12 px = 0.527 degrees, about 0.21 degrees per second) and the hero clouds are unprojected through the mid-hold warp. The hurricane turns the same way (storm mask as on Mars, counterclockwise, frozen at 0 after the hold; the unprojection includes the mid-hold angle). The hold orbit direction opposes the spin.
- Emissive map (RGBA, alpha says aurora): city lights (warm, twinkle) and on-disc aurora (green, ripple), taken from the hero night side and removed from the surface; far-side lights from Black Marble restyled by code; fade in past the terminator.
- Off-limb aurora: a shell raymarch (radius 1.0 to about 1.09) from a footprint map with ray structure, green low and red high, rippling, fitted by eye to the hero. Aurora, Moon and limb glow are removed from the hero sky patch.
- Light curve measured from the hero (white cloud envelope and ocean per sun-angle bin, 33 knots as `uCurve`). Haze shells (`src/bodies/haze.ts`, parameters as in `src/stops/mars/haze.json`) fitted by my own script to hero limb profiles; grazing layer across the disc edge on the lit and the night side.
- Hero pixels (from the 2x copy) where the view cosine is above 0.42, fading to 0.2. The rest is painted from the Blue Marble guide warped to the hero layout (thin plate spline on landmarks) and repainted in the hero style in gnomonic tiles with flow checks. Poles on a polar projection. Far-side clouds are a generated cloud layer.
- Moon: sphere with its own painted map plus hero pixels as a lit overlay (`src/bodies/moonbody.ts` pattern), moving along its orbit.

### Terrain

- Geography: camera over the Caribbean south of Cuba (about lon -81, lat 19) looking north. Long island = Cuba, peninsula = Florida, banks = Bahamas. The globe Sun is WNW of the spot while the close image has the Sun ahead; the cover hides that.
- A predictor (the hero globe rendered from the terrain camera pose) chooses the spot and the heading. The patch chain is strict super-resolution of the hero composite with clouds baked in; the cloud layer is off where a patch has full weight.

### Stop code

- Own copy of the planet shader in `src/stops/earth/` (mesh quaternion from the fit, `EQUIRECT_GLSL`, patches via gnomonic `uSpotN/E/U`, fade by parent texel density `[1.02, 1.5]`, feather 0.12). `set.ts` follows `src/stops/mars/set.ts` (orbit and terrain groups, descent grade by altitude 0.7 to 0.05 radii, sky patches from `sky.json`, `Relief.load`), plus `look.ts`, `assets.ts`, `plan.ts`.

## Takes used (limit 6 per asset per round)

- Declouded hero: 2 (Seedream t1 kept as the working source, Nano Banana Pro t1 rejected for the shift). Files in `out/work/earth/decloud/`. The exact prompt is in RECIPE.md.

## Log

- 02:50 UTC. Setup done (`npm ci`, build passes). Stand-in `hold` and `terrain` comparisons rendered at draft and pushed as the first looks.
- 02:55 to 03:00. Read the Mars code and recipes. Hero fit checked on the limb. Upscale of hero and close image started. Declouding experiment: both tools remove the clouds and keep the coasts; Seedream registered, the other shifted.
- 03:00. Guide maps fetched (Blue Marble 5400, Black Marble 3600), ledger rows in ASSETS-ROWS.md. Looks pushed.

## Next (old list, see the end of the file for the current state)

1. Wrap pipeline scripts in `assets-src/earth/`: cloud alpha and color from hero against the declouded surface, surface map, cloud map, emissive map, light curve, far side, poles.
2. Stop code: planet shader with cloud layer, shadows, hurricane, emissive, aurora shell, haze, moon, sky patch. Compare at draft after each change.
3. Orbit view milestone message to `/root`.
4. Not yet read: `assets-src/mars/relief/RECIPE.md`, `assets-src/mars/phobos/RECIPE.md`, the rest of the patches recipe, `src/terrain/relief.ts`, `src/bodies/moonbody.ts`, `src/director/moves.ts`, `assets-src/mars/sky/patch.py`.

## Builder notes received 03:10 UTC

- `public/assets/earth/web/` at or under 35 MB on disk (not 40). `full/` stays at 150 MB. The film is rendered from `full`.
- Engine requests: send `engine.patch` as early as the need is known; keep everything possible in the stop folder.
- Travel before the hold (body grows from a point of light, `FarPoint` as in the Mars set) and after the rise must keep working, free of pops. Judged in Phase 5.

## Pipeline as built (03:00 to 03:40 UTC)

All scripts in `assets-src/earth/`, work files in `out/work/earth/` (not in git). Order: `light.py` (curve and disc haze), `split.py` (layers of the hero), `motion.py` (imported), `wrap.py 8192` (maps, full and web).

- `light.py`: writes `src/stops/earth/curve.json` (33 knots), `assets-src/earth/limbhaze.json` and `src/stops/earth/limb.json`. Disc haze model, the same in `geo.limb_haze` and in `globe.ts`: `T = exp(-depth exp(-(mu/width)^power))`, in-scatter `(pale (shadeG/2)^gamma ramp(dayFrom, dayTo, ndl) + night)(1 - T)`. First fit had per-channel depth [0.55, 5.63, 6.76] with red pale at its bound: the render showed a red-brown rim on the night limb (red passed through). Refit 03:38 with one depth for all channels: pale [0.5448, 1.3654, 2.1529], depth 3.5289, width 0.05, power 0.5941, gamma 0.7438, rms log 0.299. Night limb term [0.0066, 0.0246, 0.0406] (measured inside the night limb).
- `split.py` (hero at 2x, 3168 x 5632): writes `out/work/earth/split/{surface,cloud,alpha,hero-albedo,city,aurora,shadow,haze}.npy`. A0 0.02, A1 0.12, cloud colour (0.86, 0.88, 0.9), shadow height 0.006 strength 0.4 blur 5 even 14. City gate: 17 px top-hat, warm chroma, night ramp `geo.NIGHT = (0.04, -0.14)`, inpaint under lights. Aurora gate with zone. Haze subtraction protected by a local floor (0.8 of eroded luminance). Recompose error against the hero: mean 0.208, p99 2.705, max 78.8 code values. Cloud cover 0.348, thick 0.256. About 90 s.
- `motion.py` and `src/stops/earth/motion.json`: drift 0.4 deg/s with profile -cos(3 lat) (tropics westward), ease 0.5; s(t) = -x^2/(x + 0.5), x = holdEnd - t, 0 after the hold; S_MID = -2.0833. Storm centre lon -106.154, lat 17.368 (hero px 1085, 730), 5 deg/s at the centre, core 6 deg, fade 10 to 16 deg, counterclockwise (arms trail; checked in the hero). `warp = drift(twist)`, `unwarp` is the exact inverse (roundtrip 2e-16). Shadow height 0.006, strength 0.4, lod 2.5, floor 0.12. Emissive peak 5.
- `wrap.py`: azimuthal equidistant registration (12 px per degree, radius 120 deg, centre lon -77.354 lat 13.777) of the July Blue Marble to the hero by dense flow on blueness, smoothed, faded outside. Measured flow median 4.94 deg, p95 11.3, max 14.7 (`out/work/earth/view/reg-check-crop.jpg`): the hero geography is distorted against the real Earth, so every real guide goes through `real_dirs(y, flow)`. Far-side colour: 32 cubed LUT from registered pairs (Blue Marble colour to hero surface albedo). Hero weight smoothstep(0.2, 0.42, view cosine). Cloud map: hero clouds through `motion.unwarp(y, S_MID)`, far clouds from VIIRS whiteness; WebP saved with `exact=True` (keeps colour under zero alpha). Emissive RGBA: RGB = city / max(night factor, 0.2) / peak, sRGB coded; A = sqrt(aurora / max(gate, 0.25) / peak). Writes `src/stops/earth/wrap.json`. Caches in `out/work/earth/guide/` (`flow.npy`, `lut.npy`): delete to rebuild. About 2 minutes.
- Guides in `references/cache/earth/`: `bluemarble-july-21600.jpg`, `viirs-2020-09-10.jpg`, `blackmarble-13500.jpg`, plus the two smaller first fetches. Rows in ASSETS-ROWS.md.

## Stop code as built

- `globe.ts` (`Globe`): own copy of the planet shader, no height map. Surface (filmic coded), patch chain (gnomonic; `baked` weight turns the live cloud layer off), cloud RGBA at `cloudDir(d)` (twist about the storm axis, then drift; `uFlow` = s), shadow = cloud alpha at `normalize(d + (sun - d ndl) h / max(ndl, floor))` by `textureLod`, light curve `uCurve[33]`, disc haze, emissive city lights with twinkle and aurora (alpha squared, colour (0.22, 1, 0.42)) with ripple, both equal to the hero at mid hold (`uClock` = time - holdMid). `diagOut`, alpha 1. GLSL reserved words bite: `cast` is one.
- `air.ts` (`Air`): BackSide sphere radius 1 + 0.3, blending (ONE, ONE_MINUS_SRC_ALPHA; alpha ZERO, ONE), depthTest off. Outside the disc three exponentials in tangent height times a day factor about `uGlowDir`, plus a night term; inside the disc a band exp(h / inner) toward the rim colour. `uWide` scales the two wide layers with descent. `air.json` is a first guess, to be fitted by `air.py`.
- `set.ts`: globe + air + `FarPoint`; light = `plan.lightDir` rotated by `state.rotation`; `low` descent factor between altitude 0.7 and 0.05; `sky: []`; no Moon; terrain is still the stand-in plate (`standin-close.jpg`).

## Measured in the hero, for the air fit

- Off-limb glow, scene linear, minus sky floor (0.005, 0.013, 0.021): +1 px (0.27, 0.80, 1.97), +12 (0.029, 0.162, 0.407), +20 (0.0155, 0.100, 0.223), +44 (0.009, 0.042, 0.086), +80 (0.006, 0.020, 0.036), +150 (0.003, 0.005, 0.005). 1 hero px = 0.00146 radii. Strong at position angles 90 to 240 degrees, centred near 170.
- Rim colour at grazing on the lit side: lin (0.70, 1.19, 1.53).

## Log, continued

- 03:22. Looks pushed (layer split).
- 03:36. First render of the layered globe at the hold (draft): disc close to the hero. Wrong: red-brown rim on the night limb (haze fit, fixed by the refit above, to be confirmed), no sky patch, no Moon, no off-limb aurora, glow a first guess. Looks pushed.

## Known weak points of the wrap (first pass)

- Emissive must use restyled Black Marble lights wherever the hero was in daylight (the terminator sweeps west at 1.1 deg/s; by the rise the Americas are dark). Hero lights only where the hero was night.
- Far side palette: Antarctica grey, Arctic ocean teal, Africa flat tan (LUT weak for ice and for classes the hero does not show). Far side is soft: repaint in gnomonic tiles with the image model.
- VIIRS far clouds too heavy, hard cut at lat 66 to 78 south.
- Residual green aurora and noisy night albedo in the surface on the hero night side.

## Orbit view, second pass (03:40 to 04:20 UTC)

### Findings

- The hero disc is an ellipse, not the fitted circle: limb deviation from -12 px (position angle 12 to 30) to +3 px (290). `shape.py` fits an ellipsoid in the camera frame (s1 1.00556, s2 0.98955, long axis at position angle 106, view axis sqrt(s1 s2)); lit limb rms 1.13 px, max 5.0. It writes `src/stops/earth/shape.json` (`matrix`). `geo.py` has `SHAPE`, `SHAPE_INV`, a `Shaped` body; `hero_geometry` returns `rt` (tangent distance in the unit-sphere space, 1 at the limb) and `at` (unit vector to the tangent point). In `set.ts` a `shape` group carries the matrix; globe, air and aurora are its children. The eye is brought into that space for the shaders.
- Position angle convention everywhere: pa = atan2(px - cx, -(py - cy)), 0 up, 90 right, 180 down, 270 left. Lit limb about pa 200 to 20, night limb pa 80 to 190, aurora curtains pa 14 to 78. Fit camera quaternion is identity, so world x, y are image right, up.
- GLSL: `cast` is a reserved word.
- The image `read` tool often fails once right after a file is written. Retry.

### Air (`air.py`, `air.ts`, `air.json`, `air-glow.png`)

- Samples: median of hero minus sky fill minus offset (0.0021, 0.0026, -0.0008) per 4 degree sector and height bin, aurora sector and Moon masked. Four exponential layers times a day factor x = (dot(at, dir) + 1) / 2 raised to a power per layer. Fit: heights [0.012, 0.012, 0.0526, 0.5], powers [0.3, 4.08, 3.5, 1.0], dir [-0.9016, 0.3311, 0.2784], rms log 0.32. Angular lumps of about 40 percent remain, so a ratio map (180 x 64, u = position angle, v = sqrt(h / 0.6), RGB = ratio / 4, A = line ratio / 4) corrects the layers at the hold; `uPhysical` fades it to 1 with descent and after the hold. Rows 64 to 71 of the same PNG hold the rim colour per position angle (hero median 2.7 to 7.5 px inside the limb, sqrt coded, times 4).
- Blue limb line: Gaussian of width 0.0016 radii centred at h = -0.0009 (measured peak at -0.0011), colour (0.496, 1.789, 4.195) times x^4.31 times the line ratio.
- Inner band: cover = 0.92 exp(h / 0.007) toward the rim colour from the map (hold) or mix(rimNight, rim, smoothstep(0.42, 0.68, x)) (physical). The first version used x^0.5 as the day factor and drew a pale line round the night limb: fixed.
- `limbcheck.py STILL pa...` prints hero and film radial profiles across the limb (scene linear). Run it on `npm run still -- --frame 1755 --tier draft --out FILE`.
- Measured after the fix: lit limb pa 250 film within about 10 percent of the hero from +2 px outward; night limb pa 160 film (0.013, 0.026, 0.040) against hero (0.007, 0.014, 0.021) just inside (still a little bright); inside the lit limb the wrap content differs from the hero (far side painting starts at view cosine 0.42).

### Moon (`moon.py`, `moon.ts`, `moon.json`)

- Limb circle fitted on the lit arc of the 2x hero by steepest radial descent: centre shifted (+3.9, +1.05) px at 1x from the fit, radius 58.1 px (fit said 52.5). World centre [22.016856, 11.301699, -54.685321], radius 1.16755.
- Maps 1024 x 512 (web 512 x 256): `moon-color.jpg` (albedo from the lit hero pixels, mirrored to fill, flat grey elsewhere, coded times 0.4) and `moon-lit.webp` (hero pixels with their light baked, alpha = front mask). Shader: albedo times sun colour times (smoothstep terminator times ndl^0.55) plus earthshine, mixed to the baked pixels by the mask. Motion as Mars: home rotated about `plan.axis` by `moonDegPerSecond` times (time - holdMid).

### Sky patch (`sky/patch.py`, `sky.json`)

- `sky.json` gain is 1 / skyExposure = 2.380952 (plan has skyExposure 0.42). To render the film with a black sky set that gain to 0 for one still (`out/work/earth/still/hold-nosky.png`, review tier), then `python3 assets-src/earth/sky/patch.py out/work/earth/still/hold-nosky.png`.
- Own sky (hero minus film) from 1.012 radii (feathered to 1.04) where the film glow is under 0.6 to 0.85 of the hero; the fill elsewhere (behind the globe, in the bright glow, under the Moon out to 1.35 to 1.8 Moon radii, in the aurora sector pa 6 to 86 out to 1.3 radii), scaled per channel (gain 1.576, 1.441, 1.015) and locally near the join; from 1.03 radii outward the fill keeps only its smooth part plus the hero's star points. Deblocked, 12.5 percent mirrored margin, lossless WebP 3520 x 1980 and 1760 x 990.
- First pass had a visible straight seam from a hard threshold in the local scaling: made smooth. To check again after the aurora and at the hold ends (frames 1680 and 1830), because the sky slides against the planet.

### Aurora off the limb (`aurora.py`, `aurora.ts`, `aurora.json`, `aurora.webp`)

- A ribbon standing on the hero's limb circle between pa 2 and 92, 0.27 radii tall: vertex (1 + h) at(pa, h) with at on the sphere of tangent points for the fit camera, so from the hero camera it lands exactly on the hero's pixels. Texture 2048 x 384 = hero (2x) minus smoothed fill minus offset minus the fitted glow, stars removed (opening and closing), chroma gate (green or red over blue), faded at the ends and the top. Additive, depth tested against the globe, turns with the globe spin, ripples by three sine terms that vanish at mid hold.

### Builder mail 04:12 UTC

- main moved to b4ae65c (engine batch 1). Sky patches may carry `weight?: (time, view) => number`. Software rasterizer computes both sides of an `if` but skips a `for` body: put expensive conditional shader work in `for (int k = 0; k < (cond ? 1 : 0); k++) { ... }` and use `textureGrad` or `textureLod` inside. Engine hash 434d0a5e367a62fd: stills from before the merge are stale.

## Orbit view, third pass (04:28 to 04:50 UTC)

### Engine facts found

- A frame renders at the shutter's middle: time = (frame + 0.25) / 30.
- `film.ts` applies `pose.quaternion.multiply(drift(time))` to every shot. At frame 1755 the film's disc sits (+0.14, +0.94) px (at 1920) from the hero's while the sky patch does not move. Not fixable in the stop, not visible side by side. `holdcheck.py` measures the shift by phase correlation and removes it inside 1.1 radii before it compares.
- Bloom is `hdr = mix(hdr, bloom, 0.08)` with the mean of 6 blur levels (`defaultPost()` in `src/post/chain.ts`). It lifted the day side by about 5 code values.
- Scaling the hero down in code values against the film's linear filtering accounts for about +1.2 to +1.9 code values on the day core. Left as it is.
- Main 9f78a4e merged as 3c695d4: frame 1755 byte identical before and after (max diff 0).

### What changed

- `wrap.py` rewrite: premultiplied cloud colour (`wrap-cloud.webp` RGB = colour times alpha; shader `col = (lin * shadow * (1 - a) + inverseFilmic(cloud.rgb) * live) * shade * uTint`), and the hero's residual laid on the far painting between view cosine 0.2 and 0.1 (`out/work/earth/view/wrap-rim-residual.jpg`).
- Bloom pre-emphasis in `globe.ts`: `uBloomPre` vec4 (x = `shot.post.bloomStrength`, set every frame in `set.ts`; y, z, w = `look.globe.bloomPre` [3, 4, 0.5]); three wide samples of surface and cloud with gradient scales 3, 12, 48; `col = max(col - wide * shade * uTint * (x / 3) * mix(w, 1, smoothstep(0, 0.5, mu)), 0) / (1 - x)` before the haze.
- Curve trim: `src/stops/earth/trim.json` (33 knots x 3 multipliers, limits 0.8 to 1.2; night knots below index 13 use medians) multiplies `curve.json` in `look.ts`. Procedure: set `trim.json` to ones, build, render the hold still at draft, `python3 assets-src/earth/trim.py STILL reset`, build. Current trim about 0.92 to 0.99 on the day side, 0.87 to 0.98 at night.
- City lights were 1.28 times the hero's energy and whiter. Lights gain 0.7 is the fourth value of `twinkle` ([0.22, 5.5, 900, 0.7], `uTwinkle.w`, on the night lights only, not on the dusk light). Ratio now 1.155 (`lightscheck.py STILL`).
- On-disc aurora weight reaches the limb (`smooth(0.03, 0.1, cosv)` in `emissive_map`).
- Dusk zone: light the hero shows on terrain just past the terminator (the Andes) is drawn from the emissive map as dusk light, full at mid hold, fading as the terminator moves (`uSunHold`, `uCentreHold`, `uDuskZone` from `wrap.json` `dusk` [-0.24, -0.2, 0.45, 0.6], `uDuskFade` 0.15).
- `limb.json` now: pale [0.3116, 0.7163, 1.0621], depth 2.5503, width 0.1896, power 1.1656, gamma 0.8921, dayFrom -0.25, dayTo 0.15, night [0.0066, 0.0246, 0.0406]. (The values earlier in this file are older fits.)
- Sky patch rebuilt at 04:49 after the trim (fill gain 1.579, 1.438, 1.015; own share 0.568).
- `standin-wrap.jpg` removed from both sets.

### Hold check, frame 1755 at draft (`holdcheck.py`, film minus hero in code values, shift removed)

| region | r | g | b | abs | abs low |
| --- | --- | --- | --- | --- | --- |
| day core | +2.35 | +0.95 | +0.95 | 4.70 | 2.24 |
| day rim | +2.88 | +1.80 | +0.76 | 7.12 | 4.33 |
| terminator | +1.50 | +0.55 | +0.56 | 4.56 | 2.35 |
| night core | -0.24 | -0.14 | +0.03 | 2.34 | 0.91 |
| night rim | -0.11 | -0.13 | +1.28 | 3.33 | 1.59 |
| glow 1.0 to 1.1 radii | +1.81 | +1.62 | +2.10 | 4.18 | 2.40 |
| sky 1.1 to 1.5 | +0.10 | +0.32 | +0.46 | 2.08 | 0.66 |
| sky beyond | -0.44 | -0.54 | -0.50 | 1.62 | 0.61 |

Before this pass the day core was +7.23 +5.82 +5.28 (abs low 6.14) and the day rim abs low 10.99.

### Rise direction

- The globe spins 15.4 degrees by the end of the rise, so the hero face then sits at azimuth +14.93, elevation +0.91 from the hold direction. With the stand-in values (azimuth -16, elevation 24) frame 2156 showed the Pacific far side with a visible arc where the hero pixels end and heavy white far clouds.
- `plan.ts` now: `rise: { azimuthDeg: 10, elevationDeg: 8, distance: 5.3, offset: [0.3, 0.15], driftSpeed: 0.08, rollDeg: -4 }`. Frames 2156 and 2174 show the hero face, the whole body in frame at the end, the terminator moved west with lights on Brazil, the far painting only as a limb crescent (`out/work/earth/view/rise-frames.jpg`). An image-model repaint of the far side is no longer critical.
- Sun elevation at the spot (lon -81, lat 19): about 19.6 degrees at the hold, 12 at the terrain (67 s), 8 at the rise end. The close image has a low Sun ahead with long shadows toward the camera.

### Budgets at the orbit milestone

- Disk: `full/` 34 MB, `web/` 9.6 MB. `npx vitest run` green (28 tests).

### Still weak in the orbit view

- Day core about +2 red, +1 green and blue; day rim abs low 4.3; glow ring +2; city lights 1.15 times the hero's energy; ellipse fit max error 5 px lower right; disc 0.94 px low from the engine's camera drift.
- Far side: palette (Antarctica grey, Arctic teal, Africa flat tan), soft, VIIRS clouds heavy with a cut at lat 66 to 78 south, poles not painted on a polar projection. Seen only as a limb crescent in the rise and in travel.
- Moon albedo is a mirrored fill. The sky fill puts a bright Milky Way band behind the planet. The rise sky has no Milky Way (hold patch only).
- The Builder's `for` loop advice is not yet applied in `globe.ts` and `air.ts`.

## Terrain view as built (04:55 to 05:50 UTC)

The older "Terrain" design above (spot at lon -81, lat 19, patches with baked clouds) is replaced by this.

### Scripts, in order (`assets-src/earth/relief/`, work files in `out/work/earth/relief/`)

1. `camfit.py`: camera of the close image at vfov 45. Result `camera-fit.json`: pitch 28.348 degrees down, altitude 0.030751 radii, sphere radius 32.5197 camera heights, nadir [0.030783, -0.879541, -0.474826], horizon dip 14.03, roll -2.0. `geom.py` has the rays, the sea sphere and `horizon_row`.
2. Margins (asset "relief margin", 6 of 6 takes used this round): the image is outpainted to a canvas 4096 x 1980 at 1x (640 px left and right, 396 px below). `marginfit.py`, `edgefit.py`, `margincomp.py`, `cornercomp.py` align the takes to the image and compose strips; strips and the close image are upscaled x2 (`tools/ml/upscale.py`). Prompts in `margin-prompt-*.txt`.
3. Clean plate (asset "relief plate", take 1 kept): `nano_banana_pro` on `references/approved/earth-close.jpg`, prompt `plate-prompt.txt`, the thunderheads and their shadows painted out. `platefit.py t1` aligns it (ECC 0.9997, affine [[1.0001, 0, -0.2987], [0, 1.0079, -6.1258]], flow where unchanged median 0.20 px) and corrects a low-frequency colour offset. Fine texture is regenerated everywhere in the plate, so it is used only beneath the towers.
4. Matte (asset "relief matte", take 1 kept): same tool and input, prompt `matte-prompt.txt`, white towers on black, aligned with the plate's affine. GrabCut and difference thresholds were tried first and rejected.
5. `build.py`: everything that ships. Towers = matte components of 300 px and more, groups = components of the matte dilated 13 px, a base line per group, lift = 0.5 (1 - reach(base) / reach(pixel)) above the base and 0 below, capped at 0.085 (a 16 km tower seen from 196 km), alpha = matte dilated 2 px and blurred 1.2. Ground beneath the towers = clean plate plus a membrane (Laplace solve of image minus plate from 10 px outside the matte) blended in from 10 to 6 px, then limited so the tower layer stays above zero. Tower colour is premultiplied in scene linear: image minus (1 - alpha) ground. Layers put together give the image back: mean abs 0.003, max 4 code values. Above the horizon the ground texture holds air minus sky (sky = running minimum from the top of the star-free image, saved as `sky-target-1x.npy`), so the limb glow rides with the ground and the sky comes from the sky patch. Masks at a quarter of the canvas: R glint, G drift weight (off on land and banks, hand polygon `LAND`).
   - Outputs in both sets: `relief-ground.webp` (full 8192 x 3960 lossless 21.3 MB, web 4096 x 1980 1.3 MB), `relief-towers.webp` (RGBA, full 5616 x 2432 1.6 MB), `relief-lift.bin` (float32, 1404 x 608), `relief-masks.png`; `src/stops/earth/relief.json`.
   - `towers.py` is the rejected difference-threshold attempt (to delete).

### Code

- `relief.ts` (`Ground`): ground mesh on the sea sphere of the fitted camera, alpha = smoothstep across the fitted horizon polynomial, colour added above it. Towers mesh at distance sea x (1 - lift), premultiplied, no depth test. Drift `look.ground.drift` [-3.2, 0.1] px per second times masks.g and shimmer [0.3, 220, 1.6, 0] times masks.r, both zero at the judged frame (`ground.update(state.time - terrainMid, ...)`).

### Spot, heading and the Sun

- The close image has the Sun's glow at the top edge (peak near x 1300 of 2816, code 158 in row 0), so the Sun sits just above the frame over the glint. `plan.ts`: `spot: { x: 0.52, y: 0.46 }` (lon about -77, lat 18, south of eastern Cuba), `dive.headingDeg: 52.25`, `dive.rollDeg: 5`.
- No Caribbean spot gives the 27 degrees of elevation the image needs (true elevation 9.1 at the spot), so `light.sunDir: [-0.692237, 0.508, 0.512586]` moves the drawn Sun (18.2 degrees off the fitted light). The sets still light from `plan.lightDir`. It also turns Earth's frame against the world Sun in the travel segments (told to the Builder at the terrain milestone).
- `npx tsx assets-src/earth/sunat.ts FRAMES` prints the Sun on screen (x right, y up, frame edge at 1): 1920 (-0.085, 1.388), 2010 (-0.083, 1.251), 2099 (-0.081, 1.118), 2110 y 1.070, 2125 y 0.860 (enters the frame in the rise, above the glint). `python3 assets-src/earth/relief/spotfit.py [x y heading]` prints lon, lat, elevation and screen position.
- Sky and Sun slide about 0.14 frame half-heights down over the segment against the ground (108 px at 1584), so the terrain sky patch has a margin of 0.25.

### Seen in the renders

- Compare at draft (05:47): the judged frame beside the close image is the same picture, towers included. Stills 1920, 2010, 2099, 2120 with the ground only (05:25) showed clean margins and clear motion of foreground against horizon.
- Engine: sky patches with `add: false` replace the sky inside the patch (stars too), colour = inverseFilmic(texel) x gain x skyGlow x skyExposure; the Sun's glare is added after the patches. Terrain gain = 1 / skyExposure = 2.380952.

### Engine batch 4 (main 2d2161b, merged as 0ac38d4 from d918687)

- Before `READY`: `npm run -s gate -- --phase 4 --only G11` (every file under `public/assets/earth/` named in a `RECIPE.md` as its full path or as `public/assets/earth/<set>/NAME`), and `npm run -s gate -- --phase 4 --only G12,G15 --g15-stops mars,earth`. Put the three results in the `READY` message.
- The sky behind the rise belongs to the next stop on main: nothing is painted against it.

## Terrain milestone (sent 05:58 UTC, commit 8afd5ab)

- Frame 2010 at draft, film minus close image, code values b, g, r; abs; abs low: sky -0.04 -0.07 -0.01; 0.87; 0.34. Limb +0.14 +1.03 +4.41; 3.43; 2.07. Sea and land +0.74 +1.02 +1.60; 4.56; 1.19. Towers +0.91 +1.89 +3.64; 10.37; 2.97. Disk: full 59 MB, web 14 MB.
- Engine request 1 (`engine.patch`, `ENGINE-REQUESTS.md`): the shared test "every stop has an orbit patch aim on the view of its judged hold frame" ignores `sky.orbits[id]`, so it fails for earth because `light.sunDir` turns Earth's frame. The fix lives in `tests/skyframe.test.ts` in the working tree and is never committed. When the Builder says it is on main: `git checkout tests/skyframe.test.ts`, merge main.
- Never `git add` `tests/` or `.vitest/`.

## Dive and rise (from 06:00 UTC)

### Engine facts (`src/director/moves.ts`, `src/director/film.ts`, `src/terrain/cover.ts`)

- Cover windows: dive frames 1876 to 1891, centre 1884 (the view switches from orbit to terrain at the centre); rise 2122 to 2137, centre 2130. The cover is a full-frame pass. Without `coverEdge` the amount is a smooth rise to 1 at the centre and back. With `coverEdge: [first, last]` the amount is min(smooth(x / first), smooth((1 - x) / last)) over the window; the rise uses `coverEdgeRise`. Colours: `cover` and `coverLow` on the orbit side, `coverTerrain` and `coverLowTerrain` on the terrain side; `coverLow` must be set for horizon, `coverTop`, `coverShell`, flow and `coverRush` to apply. Sky exposure is times (1 - amount) squared. To look at the join without the cover set `coverEdge: [1e6, 1e6]` for a still.
- Terrain entry: offset (height `entryHeight` g, back `entryBack` g), g = x^2.2, x from 1 at the cover's first frame to 0 at the end of the dive (g 0.643 at the centre, 0.37 at 1891). Exit: g = (u / 0.5067)^2.2 from frame 2100 (0.243 at 2120, 0.594 at 2130).
- `dive.swoop: true` takes position, heading, pitch and roll at the cover centre from the terrain entry, so the views join; `surge` retimes it. `rise.level: true` carries pitch and heading across the rise cover (the pullback then shows Earth rolled about 52 degrees; `rise.rollDeg` may take part of it back); `settle`, `hug`, `ahead`, `pan`.
- G13: a pixel is soft when texel density is under 1; a frame fails over 2 percent soft; measured at draft on hold, dive, terrain and rise frames outside the cover windows. Patch weight = front x feather 0.12 x (1 - smoothstep(1.02, 1.5, parent density)).
- Mars open items to stay clear of: 6 (rise reads as a concealed cut: streaming cover in the climb, thinning of ten frames or more on the orbit side, terrain sky faded across the pullback) and 7 (dive seems to stop under a blur dissolve: carry the plunge's speed through the first second of the terrain view).

### Tools

- `npx tsx assets-src/earth/dive/predict.ts --frames A,B --widths "96,48,24,12,6" --set '{"dive":{...},"rise":{...}}'` prints altitude, pitch, horizon position, heading on screen, soft fraction, blur per shutter and cover per frame. Agrees with rendered texel stills within a point.
- `python3 assets-src/earth/texcount.py FILES` counts the soft pixels of `--diag texels` stills. `npx tsx assets-src/earth/pathat.ts` prints the camera path.

### Measured before any change (no patches)

- Soft fraction 0 at 1840 and 1857, 0.203 at 1866, 0.886 at 1872, 0.991 at 1875; 0 in the terrain view; 0.888 at 2138, 0.830 at 2142, 0.607 at 2148, 0 at 2156. Blur at the judged frames 8.3 px (1857) and 16.8 px (2156): too much.
- Predicted with swoop, surge `{ glide: 0.14, rise: 60, fall: 2, swell: [0.3, 9, 1.2] }`, rise `ahead 0.03, hug 1.7, settle 5, level true, pan 0.3` and levels 96, 48, 24, 12, 6: soft 0 on all frames outside the cover; altitude 2.59 at 1857 (blur 2.7 px), 1.04 at 1875, 0.036 at 1883 (pitch 29.5, horizon y 0.62); rise 0.036 at 2130, 0.71 at 2138, 4.11 at 2156 (blur 2.6 px). Three levels (96, 48, 24) cover every frame outside the cover; 12 is margin for frames seen through the thinning veil.

### Memory (full set, by hand; `npm run budget` renders at final and is slow)

- 752 MB before patches: ground 173, towers 72.8, cloud 179, surface 179, emissive 44.7, sky-hold 37.2, sky-terrain 53.5, small ones 13. Each 4096 squared patch adds 89.5 MB; four levels give about 1110 of 1400.

### Patch plan

- Spot lon -77.4757, lat 18.1499 (from `spotfit.spot(0.52, 0.46)`), set in `assets.ts`.
- Content = filmic coded composite before shading: filmic(surface x shadow x (1 - a) + cloud premultiplied) at cloud state 0 (flow 0 after the hold), since a patch at full weight turns the live cloud layer and its shadow off.
- Per level as on Mars (`assets-src/mars/patches/RECIPE.md`): gnomonic resample of the parent, one strict super-resolution take at 2048 (`nano_banana_pro`, 1:1), flow and low-frequency check, low frequencies locked to the parent, 4096 by the ML upscaler, nested into the coarser level. At most 6 takes per asset.

### Log

- 06:10. `plan.ts`: `dive.swoop` with the surge above and the rise set above. Draft sheet of the dive: the approach holds, frame 1879 is inside the cover over the Gulf, 1887 is the white veil over the terrain, 1895 to 1919 barely move (entry 0.3, 0.3 is too small: open item 7). The cover is still the grey default.

- 06:15 to 06:24. Cover in `plan.ts`: `cover [0.5, 0.68, 1]`, `coverLow [0.9, 0.95, 1.02]`, the same pair for the terrain side, `coverTop [0.3, 0.12]`, `coverEdge [0.25, 0.5]`, `coverEdgeRise [0.45, 0.5]`, `coverShell [1.02, 1.08]`, `coverRush { speed 2.4, reach 2.5, billow [2.2, 0.9, 1], streak [9, 2.2, 1.6], contrast [0.7, 0.55] }`. Terrain entry `entryHeight 0.9, entryBack 1` (0.3, 0.3 left frames 1895 to 1919 nearly still), exit `exitHeight 2.3, exitForward 1.4, exitPitchDeg 11`. Sheets: the cover reads as a white cloud veil with streaks, full white 1879 to 1885 and 2127 to 2131, but thins over only about 5 frames per side.
- Terrain entry limits: g = x^2.2 (0.643 at the centre, 0.37 at 1891, 0 at 1919); the ground canvas allows a footprint up to about 1.83 times laterally (side aprons 22.7 percent each), the bottom apron reaches 0.573 camera heights ahead of the judged nadir; exit g 0.30 at 2122 (footprint about 1.69 times).
- 06:24. Engine batch 5 (main 9d33905) merged as c6ca1e1: world pin (sunDir, travel and exit poses are mine to set), `gradTexel` from `src/core/texel.ts` optional, G11 is about my folder only. Builder preflight of adc492d: build and 35 tests green, G12 PASS, G15 PASS (web 184 MB, full 728 MB), G11 FAIL on `moon-lit.webp` not named by its full path: fixed in `RECIPE.md` (each file needs `public/assets/earth/<set>/NAME` written out).
- 06:25. Own veil `src/stops/earth/veil.ts` (class `Veil`, in the set's `world`, drawn last): the engine cover's fragment shader on a full-screen mesh, fed from `shot.cover` in `set.update`, amount = `look.veil.peak` x smooth ramp from `lead` seconds before the window's first frame to its centre and down to `tail` seconds after its last frame (`look.ts`: `veil = { lead, tail, peak }`). It lets the veil thin over more than ten frames on each side and drifts over the sky and the Sun too. It discards in diagnostic views. It must be 0 at 1857 and 2156.

- 06:30 to 06:40, seen in stills and cover sheets, fixed:
  - Veil over black space read as smoke: the veil is now cut above the terrain horizon (exact cone from `terrain.dipDeg` and the cover's horizon line), held inside `look.veil.rim` [0.985, 1.003] radii of the view ray's closest pass in the orbit view, and darkened on the night side (Sun in view space).
  - A fat white halo outside the limb in the rise (2132 to 2136): `coverShell` [1.02, 1.08] to [1, 1.015].
  - Vertical streaks in the sky above the top of the ground canvas at the terrain entry and exit (clamped top row): the ground lookup widens its footprint sideways above the canvas top (`relief.ts`, up to 160 image px, in image units so every tier matches). A first try with scaled screen gradients hit the smallest mip and drew a grey band; do not scale gradients without a cap.
  - `coverEdge` [0.25, 0.5] to [0.4, 0.5], `coverEdgeRise` [0.45, 0.5] to [0.5, 0.5], `look.veil = { lead 0.5, tail 0.5, peak 0.6 }`: thin wisps from about frame 1866, thick by 1878, full 1882 to 1885, wisps over the terrain to about 1897; rise the same mirrored.
  - `coverRush.reach` 2.5 to 1: the rise cover looked like a still horizontal band (Mars open item 6); with the focus just outside the frame the streaks fan across it.
- Open: stars fade in at the top of the frame at 2116 to 2122 (feather of the terrain sky patch, exit pitch 11 degrees); level 96 is now the wrap at 2048 through the upscaler (no take).

### Patch chain as made (`assets-src/earth/patches/`, work in `out/work/earth/patches/`)

- `base.py composite(width_deg, size)`: filmic coded surface x shadow x (1 - a) + premultiplied cloud from the shipped full maps at cloud state 0, Sun at bake time 67.0 s (on the patch: azimuth -54 degrees from north, elevation 9.1; shadows fall to the lower right). `chain.py lock TAKE REF SIGMA OUT`, `chain.py sub PARENT PDEG CDEG SIZE OUT`, `chain.py nest PARENT CHILD PDEG CDEG OUT`. `shiftcheck.py A B`: block phase correlation plus low-frequency difference (`tools/ml/checkmoved.py` fails on repainted land).
- Level 96: `p96-src-2048.png` = `base.composite(96, 2048)` (as fine as the wrap), through the upscaler to `p96-up-4096.png`, no take.
- Level 48: input `p48-in-1024.jpg`, `prompt-48.txt`, take 1 kept: shift median 0.21 px at 1024, p90 0.49, max 1.90; low-frequency difference mean 19 code values before the lock (sigma 24 against `p48-src-2048.png`).
- Level 24: input `p24-in-1024.jpg` (centre of the locked 48), `prompt-24.txt`, take 1 kept: shift median 0.12, p90 0.25, max 0.50; low-frequency mean 2.71.
- Level 12: input `p12-in-1024.jpg` (centre of the locked 24), `prompt-12.txt`, take 1 kept: shift median 0.17, p90 0.31, max 0.57; low-frequency mean 5.42. It painted long soft cloud shadows toward the lower right (longer than a 9 degree Sun gives for small cumulus); kept, weak point.
- Takes this round: patch 48: 1, patch 24: 1, patch 12: 1.
- Each locked 2048 goes to 4096 with `python3 tools/ml/upscale.py --in A --out B --width 4096` (5.6 minutes alone, one at a time), then `chain.py nest` 12 into 24, 24 into 48, 48 into 96, then JPEG q94 4:4:4 to `full/patch-NN.jpg` and Lanczos 2048 to `web/`.

### Log, continued

- 06:40 to 06:46. `plan.ts`: `coverShell` [1, 1.015] to [1, 1.035] and `coverTop` [0.3, 0.12] to [0.06, 0.04] (frames 2129 to 2130 popped from a blue-grey band to a crisp black horizon; now the rise cover sheet reads as one move). `cover` and `coverTerrain` [0.5, 0.68, 1] to [0.22, 0.34, 0.6] (step between 1883, orbit side with a dark top, and 1884, terrain side with a light top: the cover's sky colour is its top colour within 0.22 of the horizon).
- 06:46. `relief.ts`: above the canvas top the ground lookup folds back into the canvas (`look.ground.fold` 110 px: mirror that saturates) instead of clamping to the top row, with a small sideways footprint (up to 40 px). The clamped row drew a lighter vertical column at the top centre of 1890 to 1893 (the close image's Sun glow at the canvas top).
- 06:46. Level 96 upscale done (360 s). `python3 assets-src/earth/patches/ship.py` wrote `patch-96.jpg`, `patch-48.jpg`, `patch-24.jpg`, `patch-12.jpg` in both sets (full 6.2 to 7.0 MB each, 4096; web 2048). Disk now full 85 MB, web 23 MB. `assets.ts` `patches.levels` set coarse to fine: 96, 48, 24, 12.
- Looks pushed 06:46 (cover sheets, veil stills).

- 06:47 to 06:53. Patches in: texel stills 1866, 1872, 1875, 2138, 2142, 2148 all 0 soft (min density 1.41, 1.26, 1.26, 1.08, 1.26, 1.94). Hold 1755 unchanged against the 05:58 still (max 1 code value in 0.18 percent of pixels). Commit 6285358 (code and the eight patch files), merge of main 45d1651 (engine batch 6: travel cameras) as 7a0b0c0, build and 35 tests green, pushed. `npx tsx assets-src/travel/probe.ts`: venus.travel joins my hold at 1680 with step 0.000 in turn and speed 1.16e-1 to 1.15e-1; earth.travel joins my rise at 2175 with turn 0.002 to 0.003 and speed 7.96e-2 to 8.00e-2. Do not edit `src/space/travel` or `film.ts`.
- 06:55. Dive and rise sheets at draft: the approach holds, the veil and cover read as one cloud layer, the terrain entry decays fast (1903 to 1919 nearly alike; the entry is at the canvas limit). Rise: at 2120 a grey band sat above the limb. Cause: the engine's cover horizon uses the fixed `dipDeg`, but at the exit the camera is 0.56 heights higher (dip 17.4 against 14.0 degrees), so my veil's horizon cut sat about 80 px above the true horizon. Fix in `set.ts` and `veil.ts`: the veil takes the true horizon from the sea sphere (`reliefJson.nadir`, `radius`) and the camera's place in the terrain group; 2120 is clean.
- 06:58. `coverTop` terrain side 0.04 to 0.012: the engine cover above the horizon was a lighter blue than the sky, so its streaks drew a comb of vertical lines in the sky at 1889 and 1890 and dark and light blotches at 1886 to 1888 and 2125 to 2128.
- Looked at and left: the top of 1893 at gain 3 (a faint row of soft dots and a gradient of 2 code values over 60 rows; the Sun's glow column at the top centre is in the sky patch and belongs there). The aurora off the limb in the rise is the same comb with red above as in the approved hero.

## Next (current, from 07:05 UTC)

1. Dive and rise milestone message: commit, G13 numbers (`out/work/earth/g13-e3.log`, every third frame), blur at the judged frames (predictor: 1857 median 2.7 px, p90 3.9; 2156 median 2.6, p90 4.2), weak points.
2. Travel before the hold and after the rise at draft (`npm run -s sheet -- --segment venus.travel --tier draft`, `earth.travel`): free of pops, FarPoint to globe.
3. Own checks: `npm run measure -- --stop earth` (full, G13 every frame takes about 35 minutes), compare both views at `final`, sheets of hold and terrain at `review`, dive and rise at draft plus review stills of 1857 and 2156, `npm run crops`.
4. Gates: `npm run -s gate -- --phase 4 --only G11` (PASS at 07:03 with the patches), `--only G12,G15 --g15-stops mars,earth`. Stand-ins removed. Merge `origin/main`. `READY` with the three results.
5. If time: `for` loop advice in `globe.ts` and `air.ts`, bloom pre-emphasis for the relief limb, delete `assets-src/earth/relief/towers.py`.

## Builder reply to the dive and rise milestone (07:12 UTC): three fixes before READY, worst first

1. Motion first: frames 1903 to 1919 must not stall. The camera may slow after the cover but keeps a visible forward drift that runs into the terrain glide at 1920 with no step in speed or heading. If the painted canvas ends, start the entry closer or lower rather than letting it stop. Check 1919, 1920, 1921 as a triple.
2. Grey cloud above the horizon at 1886 to 1888 and 2125 to 2128: first the stop's own controls (`coverTerrain`, `coverLowTerrain`, `coverTop`, `coverEdge`, `coverEdgeRise`; `coverTop` shapes the part above the horizon). If they cannot do it: exact engine change into `assets-src/earth/REQUESTS.md` (file, new plan key with a default that leaves every other stop's bytes alone, what it does) and one line to the Builder. Do not wait for it with READY.
3. Aurora blobby at 2156 (judged frame): fix. Stars fading in at 2116 to 2122: neighbour, lower priority.

### Fix 1, entry motion (from 07:15 UTC)

- Tool `npx tsx assets-src/earth/dive/canvas.ts --frames A,B [--set JSON] [--scan first,last]`: per frame of the terrain side of the dive, the terrain view and the terrain side of the rise it prints the camera in relief space, its speed, the footprint of the frame on the ground canvas (x of -640 to 3456, bottom ymax of 1980, image px) and the flow in screen px per frame at the bottom, the middle and the left of the frame.
- Cause of the stall. In relief space -z is the optical axis (28.3 degrees below level) and +y the camera's up, so the old entry (height 0.9, back 1) was a 70 degree descent: the whole picture slid up 7 to 12 px per frame and stopped at 1919. `gather: 0.8` made the glide stand still through the whole dive (u stays near -0.31 from 1876 to 1920; the glide's speed is 0.2 of its mean at 1920): flow at the bottom of the frame 0.4 px per frame at 1919, 0.5 at 1920.
- The hard limit is the bottom apron. Forward flight brings new ground in at the bottom of the frame; the canvas holds 396 image px (270 screen px) below the judged frame, so between the first clear frame (about 1888) and 2010 the flow at the bottom edge can average 2.2 px per frame at most. Any entry that flows downward (forward) costs bottom apron; a descent flows upward and costs the sides (limit about 1.4 times at 1888).
- Measured options (bottom, middle flow in px per frame): pure glide run back through the dive, `entryHeight 0, entryBack 0`: gather 0.4 gives 1.1, 0.5 at 1886 and 1.5, 0.6 at 1920 with ymax 2002 at 1886, 1981 at 1894, 1904 at 1920; gather 0.5 gives 0.8 to 1.2, ymax 1954 to 1881; gather 0.3 gives 1.4 to 1.7, ymax 1928 at 1920. Any descent on top (`entryHeight` 0.1 and more) turns the flow upward first and brings the reversal (the stall) back near 1910 to 1914.
- A faster plunge after the cover needs more bottom apron (about 300 image px more for twice the speed). The relief margin asset has used 6 of 6 takes in round 1, so that is for round 2.

### Fix 1 as built (07:35 to 07:50 UTC, commit 10b0fd5)

- `plan.ts` terrain: `gather 0.4, side 0.3, entryHeight 0, entryBack 0`. The terrain side of the dive is the terrain glide run backward (level forward flight plus a drift to the right toward the islands), so speed and heading at 1920 are continuous by construction. Measured on draft stills by phase correlation, px per frame at the bottom of the frame: 1900 to 1906 (-0.85, 1.12), 1912 to 1919 (-0.99, 1.20), 1919 to 1920 (-1.03, 1.19), and without the side drift 1919 to 1920 1.19, 1920 to 1921 1.17. Mid frame (-0.73, 0.44).
- The side drift is free: it uses the left apron (x reaches -573 of -640 at 1886). It puts the direction of travel 34 degrees right of the optical axis (near the right frame edge) and gives the towers parallax against the sea. More forward speed is not possible on this canvas (bottom apron).
- `relief.ts`: the ground mesh reaches `under` 140 image px below the canvas and mirrors the lookup there (`skip` 24 px above the canvas bottom, where the last rows have a line and speckles). With gather 0.4 the mirror is in frame only at 1886 to 1894, under cover and veil.
- `look.veil.tail` is now [dive, rise] = [0.85, 0.5] s: wisps stream over the sea until about 1915 while it drifts. It must stay 0 at 1857 and 2156.
- `out/work/earth/flowpx.py A B C` measures the flow between stills (bottom, mid, left windows).
- The harness (`ensureBuild` in `tools/lib/common.ts`) rebuilds `dist` at the start of every still, sheet, compare and measure when the tree changed. So do not edit sources while a long job is queued behind another: the queued job renders the tree as it is when it starts.

### Fix 2, grey cloud above the horizon (07:40 to 07:52 UTC)

- Cause: the engine cover is drawn over the whole frame on the terrain side; above its horizon line it stays lit for 0.22 tan units (about 290 px) whatever `coverTerrain` and `coverTop` are, and in the rise its fixed horizon line sits 60 to 150 px above the true limb. The stop's controls cannot cut it. My veil has the cut (true sea limb), the engine cover has not.
- Request written: `assets-src/earth/REQUESTS.md` and `assets-src/earth/engine.patch` (against main 558e3a5): plan key `coverSea: { centre, radius, edge }`, five lines in the cover block of `film.ts`, one in `MoveParams`. Tested in the working tree only (stills in `out/work/earth/p7/`): 1885, 1886, 1888, 1890 show a white cloud deck under a crisp blue limb and black sky. Then reverted: `git checkout src/director/film.ts src/director/moves.ts`, and the plan does not carry `coverSea` until the key is on main. When the Builder says it is on main: merge, add `coverSea: { centre: [1.031837, -29.481955, -15.916028], radius: 32.5197, edge: [1, 1.003] }` after `coverShell` in `plan.ts`, render 1885 to 1890 and 2124 to 2129.

### Fix 3, aurora at 2156 (07:42 UTC)

- Cause (`npx tsx assets-src/earth/aurat.ts FRAMES`): the ribbon stood on the limb circle of the hero camera and turned with the globe. At 2156 the camera is 12.8 degrees off the hero direction and the globe has turned 14.7 degrees, so the ribbon's foot was behind the limb and only its upper part (red) showed, detached.
- Fix in `set.ts`: after the globe's turn the ribbon is leaned by the shortest rotation that puts its axis on the current camera direction, so it always stands on the limb of the current camera. `aurora.json` `fade` [1.0, 1.7]: the ribbon fades out below 1.7 radii of altitude (its cone is built for the hero distance). At the judged hold the lean is the identity.

### Fix 3, second part: the ripple (07:50 to 07:56 UTC)

- The lean alone left 2156 the same (a comb of bright stubs with separate red blobs, `out/work/earth/p8/aur-2156.jpg`). Real cause: the three ripple terms (`wave`, `sway`, `stretch`) are differences from clock 0 (mid hold), so far from the hold they reach twice their amplitude (clock 13.4 s at 2156: brightness 0.4 to 1.6 in 17 cycles along the ribbon).
- Fix: `aurora.json` `calm: [2.6, 6.0, 0.15]`. `Aurora.update` scales the three amplitudes by 1 inside 2.6 s of mid hold (the whole hold), falling to 0.15 by 6 s. `out/work/earth/p9/aur-2156.jpg`: one curtain of rays with a continuous red border. Hold 1755 against the 05:58 state: max 2 code values in 0.0002 percent of pixels. 1857 and 2148 looked at (`p9/pair.jpg`): fine.

### State at 07:57 UTC

- Looks pushed 07:54. Draft dive sheet (`out/work/sheets/earth.dive-16x9-draft.png`): 1903, 1911, 1919 drift visibly, no stall; 1887 still has the grey cloud above the limb (waits for `coverSea`). Draft rise sheet: 2127 the same; 2120 clean; faint stars at the top left of 2120.
- Gates without the browser: G11 PASS (every asset has a row or a recipe), G12 PASS (1120 tracked files, 0.90 GB). `npx vitest run` 35 of 35, `tsc` clean. Disk: full 85 MB, web 23 MB; the two sets hold the same 17 file names; no stand-in file left.
- Running: `npm run -s measure -- --stop earth` (every frame, `out/work/earth/measure.log`), started 07:55:50.
- Tried and dropped: `light.terrainSkyGlow: 0.2` with the terrain patch gain times 5. Not rendered alone. In the engine the stars outside the patch then take the terrain values (gain 2.2, cap 0.9), brighter, not dimmer. Reverted before any picture was kept.

### Measure, every frame (07:55 to 08:13 UTC, tree 84abaca, `out/work/earth/measure.log`, `out/work/measure/earth.json`)

- PASS G13: 0 of 463 frames over 0.02 soft.
- PASS G5: 1755 hold invalid 0 coverage 0.329; 1857 dive invalid 0 coverage 0.483; 2010 terrain invalid 0 coverage 0.781; 2156 rise invalid 0 coverage 0.252.
- PASS G17 (final, no grain): 1755 median 1.235, p25 1.191 over 72 tiles; 2010 median 1.012, p25 0.975 over 78 tiles.
- The measure ran before the sky patch change and before the merge of main 48a2bfc. After both, the draft stills of 1755, 1857, 2010, 2156 and 2120 are the same bytes as before (`out/work/earth/p11/` against `p9/` and `p10/`), so the numbers stand; a full rerun costs 18 minutes.

### Stars at 2116 to 2122 (08:03 to 08:20 UTC, commit 46ddc5b)

- Cause: `set.ts` gave every sky patch `edge = margin / wide`, so the whole margin was the fade to the engine's sky. The rise pitches up 11 degrees before its cover, so from about 2110 the engine's sky came in at the top: the band of the Milky Way with dense stars right beside the Sun (`out/work/earth/p9/top-2120-before.jpg`).
- Fix: `sky.json` carries `edge` per patch (orbit 0.1, the same number as before; terrain 0.05), and the terrain patch has `margin` 0.5 (`assets-src/earth/sky/patch.py` `TERRAIN_MARGIN = 0.5`, file 5632 x 3168 full, 2816 x 1584 web, 1.07 and 0.33 MB). The patch is solid to 14 degrees above the frame top of 2010. Left and right pads: the outer quarter of the image mirrored twice (one mirror of half the image put the Sun's glow at both ends of the top margin).
- Checks: 2010 against the still before the change: sky rows max 1 code value; 2010 with edge 0.05 against edge 0.25: same bytes. 2120 (`p10/top-2120b.jpg`): dark blue sky with the Sun's glow, no band, no pop.
- `out/work/earth/stills.sh` does not make its folder: `mkdir -p` first, or every still fails silently.

### Merge of main 48a2bfc (08:21 UTC, 553bd02)

- Main holds engine batches 8 and 9 (terrain shield, trim of haze shell triangles; engine hash a3d211c425dc0406) and the folders of all eight stops as of 08:05. Six add/add conflicts in my own files (main carried my 08:05 state, `git diff b8d32b6 origin/main -- my folders` was empty): resolved with my side.
- After the merge: build passes, 48 of 48 tests, draft stills 1755, 1857, 2010, 2156, 2120 are the same bytes as before the merge. No opt out of the shield or the trim needed.
- Travel probe: venus.travel joins my hold at 1680 with step 0.000 (speed 1.16e-1 to 1.15e-1); earth.travel joins my rise at 2175 with turn 0.002 to 0.003, speed 7.96e-2 to 8.00e-2.
- Gates on the merged tree (08:27 UTC): G11 PASS (every asset has a row or a recipe), G12 PASS (1646 tracked files, 1.36 GB), G15 PASS (at most 2 sets per frame; earth/web 281 MB, earth/full 1118 MB). Disk: full 85 MB, web 23 MB.

### `coverSea` in the plan (08:30 to 08:37 UTC, commit 64659d1)

- The key is on main since batch 8. `plan.ts` now has `coverSea: { centre: [1.031837, -29.481955, -15.916028], radius: 32.5197, edge: [1, 1.003] }` after `coverShell`. `REQUESTS.md` says served.
- Draft stills `out/work/earth/p12/` (sheets `dive-sea.jpg`, `rise-sea.jpg`, `joins.jpg`): 1884 to 1889 a white deck under a crisp blue limb, black sky. 2125 to 2129 black sky with the Sun, white deck below, no grey cloud above the horizon; the limb there is a dark edge, not a blue line (column 400 to 420 at 2127: sky (27,13,5) BGR to deck (198,191,186) within 9 px, no blue peak), small blue patches at the limb ends at 2125 to 2126. 2130 is the orbit side at full cover with a soft blue limb.
- Possible later: `edge: [0.997, 1]` to keep the blue line at full cover in the rise. Not tried.
- The Builder was told the head 64659d1 at 08:37; round 11 runs from it.

### Hold sky, stars beside the aurora and the Moon (08:26 to 08:45 UTC)

- Found in the final compare of the hold: in the aurora sector (position angle 6 to 86 degrees, out to 1.3 radii) and around the Moon the patch used the fill's own stars times the fill gain (1.58, 1.44, 1.02): dense bright orange points where the approved image has sparse faint white ones (`out/work/earth/p11/aurora-pair.jpg`).
- Fix in `sky/patch.py` `hold()`: the hero's own star points are kept everywhere beyond `STARS`; inside the aurora sector the points with a green or red tint (`TINT = 1.25`, residue of the curtain) are dropped, and the points on the Moon's disc (`DISC = (1.06, 1.2)` Moon radii). Run: `python3 assets-src/earth/sky/patch.py out/work/earth/still/hold-nosky.png` (40 s, writes both sets). The old files are in `out/work/earth/skyold/`.
- Draft 1755 against the still before (`out/work/earth/p13/hold-sky-3.jpg`, `hold-sky-zoom.jpg`): 5.0 percent of pixels change, all inside x 1068 to 1771, y 0 to 473. Star points over 40 code values above the local median, approved, before, after: aurora sector (x 1250 to 1500, y 40 to 340) 544, 860, 704; Moon side (x 1500 to 1780, y 60 to 420) 341, 548, 466; far left untouched 978, 1179, 1179. 1680 and 1829 looked at (`p13/hold-3.jpg`): no seam.

### Rise cut with `coverSea`: the Sun pops and the limb jumps (found 08:50 UTC on the draft rise cover sheet)

- With the cover cut above the sea limb, the sky is open at the cut 2129 to 2130. Terrain side 2129: Sun in frame at 17.8 degrees above the axis (`npx tsx assets-src/earth/sunat.ts 2129 2130`: screen y 0.774), true limb at mid height (the camera climbed 1.3 heights, the limb sank 7.7 degrees below the place the engine carries to the orbit side). Orbit side 2130: Sun 48 degrees above the axis (out of frame), limb 20 percent from the top. So one frame to the next the Sun vanishes and the limb jumps about 190 px. The two views do not share a Sun direction (terrain uses the approved image's low Sun, and the spin turns it 1.1 degrees per second), so no pose can match them. The dive cut 1883 to 1884 is fine: no climb, Sun 8 degrees above the frame top.
- Pose fixes rejected: any change of `exitPitchDeg` moves the judged frame 2156 (38 percent of the carried pitch is still in it); `horizonDeg` is shared with the dive.
- Fix (stop folder only, `veil.ts` `uWhole`, `set.ts`, `look.veil.whole: [0.78, 0.97, 0.62]`): near the rise cut the veil goes whole frame and white (the colour of the deck, with the same streaks), driven by the engine's cover amount: from 0.78 to 0.97 before the cut, 0.97 to 0.62 after it; rise only. Draft stills `out/work/earth/p15/whole-c.jpg`: 2126, 2127 open sky with the Sun; 2128 the Sun through half a veil; 2129, 2130, 2131 white; 2132 the limb through a thinning veil; 2133 open sky. With `uWhole` 0 the shader gives the same bytes: 1887 and 2126 equal the stills before.
- Also seen: at 2125 to 2129 the blue limb line is gone because the relief's limb wall (hero limb circle, tangent distance) sinks 44 to 81 px below the true limb as the camera climbs and the cover hides it.

## Next (from 08:45 UTC)

1. Round 11 runs from 64659d1. When its issues arrive: fix causes, worst first.
2. Own checks still owed: G17 and G5 again after the hold sky change; cover sheets with `coverSea`, hold and terrain sheets at draft (`sh out/work/earth/sheets.sh rise-cover dive-cover hold terrain`); review tier sheets (hold, terrain, dive, rise); `npm run crops -- --frame N` for 1755, 1857, 2010, 2156. Look at every picture, push looks.
3. Known weak, in order: glide speed before 2010 limited by the bottom apron (1.2 px per frame at the frame bottom; a taller apron of about 300 image px would allow twice that; relief margin used 6 of 6 takes in round 1); level 12 patch has long soft cloud shadows; rise cover 2127 to 2129 has no blue limb line; hold aurora rays a little softer than the approved ones and city lights show through on the limb; star flux in the hold about 20 percent above the approved image (G17 median 1.235, passes).

### Terrain glide against the approved Mars glide (09:03 to 09:08 UTC)

- Draft stills of Mars 2574, 2580, 2586 (`out/work/earth/mars/`) and Earth 2004, 2010, 2016 (`out/work/earth/p16/`), flow by phase correlation (`out/work/earth/flowpx.py`), px per frame at 1920: Mars bottom (-0.2, 1.1), middle (-1.0, 0.2), lower left (-3.6, 1.4). Earth bottom (-1.7, 2.0), middle (-0.9, 0.7), lower left (-2.6, 1.6). Dense flow in a 6 by 8 grid: Mars has 2 to 3 px per frame only on its left cliff and under 1 elsewhere; Earth has 1.5 to 3.4 across the whole lower third and 0.5 to 1.4 in the middle rows.
- So around the judged frame the Earth glide moves more than the approved Mars glide ("the canyon view drew no motion issue" in round 5). The 1.2 px per frame figure is the start of the glide (1912 to 1921), where it eases in. A taller bottom apron is not the next thing to spend takes on.

### Crops of the four judged frames at final (09:09 to 09:14 UTC, `out/work/crops/f0NNNN-16x9-final-01.png`)

- 1755 and 2010: every crop holds at native size. 1857: rich and sharp enough (predicted blur median 2.8 px, p90 3.9, a zoom blur that is 0 at the centre).
- 2156 is the soft one: every city light is a vertical dash 4 px tall and South America is smeared along the same line (`out/work/earth/p16/r-sa.jpg`, `r-lights.png`, a smooth blur, no ghost copies). Predicted blur at 2156 with `rise.settle: 5`: median 2.6 px, p90 4.2. With `settle: 6`: 1.2 and 1.9. With `settle: 7`: 0.5 and 0.8 (altitude 4.25 against 4.11, body 0.24 against 0.25 of the frame, so the framing is nearly the same). The brief wants the judged rise frame sharp, so `plan.ts` now has `settle: 7`. The travel probe is unchanged (join at 2175: turn 0.002 to 0.003, speed 7.96e-2 to 8.00e-2).

### The limb of the relief follows the true limb (`relief.ts` `place()`, `look.ground.lock`, from 09:10 UTC)

- Cause of the missing blue line at 2125 to 2127 (and of a horizon that sank too fast in the climb): rays of the fitted camera that miss the sea sphere were put on a wall at the tangent distance (8.13 camera heights), standing on the limb circle of the fitted camera. From a higher camera the true limb lies above that wall's foot (3.9 degrees at 2129), and `coverSea` and the veil cut at the true limb, so the deck covered the blue line. From a camera further back the sea's own bulge hid the wall's foot (about 7 px at 1920).
- Fix: the vertex shader of the ground and tower meshes moves every vertex whose fitted ray is above `lock[1]` (-0.003 rad below the fitted limb) in elevation only, in the vertical plane through the camera's nadir axis, so that its angle above the true limb of the current camera equals its angle above the limb in the approved image. Between `lock[0]` (-0.014 rad) and `lock[1]` the vertex is a mix of its place on the sea and the locked place, so that strip of haze under the limb stretches when the camera climbs. Sideways the vertex keeps the parallax of a point at the tangent distance. At the fitted pose (frame 2010) the move is the identity.
- Checked at draft (`out/work/earth/p17/`, sheets `lock-a.jpg`, `lock-b.jpg`, `lock-c.jpg`, `rise-s7.jpg`): 2120, 2124, 2126, 2127 keep a clean blue limb line above the deck (before: a frayed band at 2120, a dark edge with no blue at 2126 and 2127). 2099, 2110, 1920, 1900, 1886: clean limb, no fold, no tear. 2010 against the still before the lock: max 8 code values, 1.6 percent of pixels, all in limb rows 150 to 330 (perspective interpolation with other vertex depths); against the approved close image the frame is marginally closer (limb band mean abs 3.243 after, 3.263 before; whole frame 4.055 after, 4.058 before).
- `settle: 7` at draft: 2134 the globe fills the frame under the thinning cover, 2140 the disc, 2148 to 2165 the globe at its end place. Predicted blur (median px): settle 5: 2140 38, 2144 29.5, 2148 17.1, 2152 7.4, 2156 2.6, 2160 0.7; settle 7: 2140 39.5, 2144 18.3, 2148 7.0, 2152 2.3, 2156 0.5, 2160 0.1. So settle 7 puts more of the pullback inside the cover (2130 to 2137) and every frame from 2142 on is sharper. With any settle the last 15 frames are nearly still (the engine blends to the exit pose from 2145, as on Mars).
- 48 of 48 tests, build passes.

### The rise cut is still a concealed cut (09:25 UTC, own weak list item 1)

- The look lock names it: "a full-frame cover that paints over space beyond the limb" and a cover that "clears onto a limb in two frames" read as a concealed cut. The whole frame veil of 5ed4c0e is that (white at 2129 to 2131, open at 2133). It hides two real breaks: the limb jumps about 190 px at the cut and the Sun is in frame only on the terrain side.
- Cause of the limb jump, from `src/director/moves.ts`: on the orbit side `climb()` holds the limb at `carried = horizonDeg - exitPitchDeg * g` above the axis and adds the true dip of the globe. On the terrain side the camera only pitches by `exitPitchDeg * g`, but it also climbs (`exitHeight` 2.3), so the true limb sinks by the growth of the dip (14.0 to about 21.7 degrees at 2129). The difference is that growth, whatever `exitPitchDeg` is. Mars climbs 0.8 heights over a sphere that is far larger against the camera height, so its dip hardly grows.
- Cause of the Sun pop (`npx tsx assets-src/earth/sunat.ts`): at 2010 the Sun is 27.4 degrees above the axis (y 1.251, the frame edge is 1), at 2099 y 1.118; the exit pitch of 11 degrees brings it into frame from about 2116 (2120 y 0.949, 2129 y 0.774); at 2130 it is at y 2.76.
- Plan: (a) ask for `terrain.exitDipDeg` (default 0): `carried` minus that angle, so the orbit side starts with the limb where the climbed terrain camera has it; (b) `exitPitchDeg` at or below 0 so the Sun never enters the frame; (c) the veil stays below the limb and `look.veil.whole` goes to 0.

### The rise cut without the whole frame veil (09:28 to 09:40 UTC, working tree, waits for `terrain.exitDipDeg` on main)

- Tool: `npx tsx assets-src/earth/dive/cut.ts --frames LIST [--set JSON]` prints per frame the view, the height, the dip, the true limb's angle above the optical axis and its place from the frame top, the limb's tilt and (terrain side) the Sun's place (y, frame edge at 1; it agrees with `sunat.ts` to 0.002).
- As committed in 9f1e1ff (`exitPitchDeg: 11`): limb from the top 0.203 at 2100, 0.336 at 2120, 0.486 at 2129 (0.65 degrees above the axis), then 0.334 at 2130 (7.80 degrees): a jump of 165 px. Sun y 1.116 at 2100, 0.951 at 2120, 0.775 at 2129, gone at 2130.
- The drop of the limb that the engine does not carry is 7.3 degrees at 2129 (dip 14.0 to 18.6 plus 2.7 degrees of turn of the local vertical over 1.7 heights of forward flight). It does not depend on `exitPitchDeg`.
- New values in the working tree: `terrain.exitPitchDeg: -13` (the camera tilts down as it climbs, which holds the limb at 0.196 to 0.204 from the top from 2100 to 2129 and takes the Sun out: y 1.117, 1.257 at 2120, 1.468 at 2129), `terrain.exitDipDeg: 7.85` (needs the engine change: orbit side 14.19 degrees at 2130 against 14.14 at 2129), `coverShell: [1, 1.003]` (was 1.035, a soft white band 11 degrees wide above the limb at 2130; now the deck ends at the limb as `coverSea` does on the terrain side), `look.veil.whole` off, `look.descent.air` (the two thin air layers shrink near the ground, because the fitted glow of the hero is 0.012 radii high and stands 150 px tall above the limb at 2130 against the relief's thin blue line; 0.2 lost the line, 0.45 in test).
- Canvas use with the new pitch (`canvas.ts`): ymax 1109 at 2110, 809 at 2120, 586 at 2129 of 1980; x 174 to 2787 of -640 to 3456. Inside.
- Draft stills `out/work/earth/p19/` (`cut-a.jpg` shell 1.035, `cut-b.jpg` shell 1.003, `cut-c.jpg` 2128 to 2133, `cut-d.jpg` air 0.2): the limb, its curve and the streaks of the deck carry across 2129 to 2130.
- The dive cut already carries the limb: 0.189 from the top at 1883 (orbit side), 0.183 at 1884.
- Not committed yet: `plan.ts` with `exitDipDeg` does not pass `tsc` without the shared change, so the branch head stays 9f1e1ff (whole frame veil) for code until the key is on main. `src/director/moves.ts` is changed in the working tree only and is never committed.

### Limb glow carried across both cuts, whole frame veil removed (09:40 to 09:55 UTC, working tree)

- `look.descent` is now `{ high, low, air: 0.25, glow: { dive, rise } }`. Near the ground (`low` 1 below 0.05 radii of altitude, 0 above 0.7) `set.ts` shrinks the two thin air layers to `air` times their fitted height and multiplies their colours by the tint of the segment. In the hold and at the judged frames `low` is 0, so nothing changes there (2156 against the still before: 793 pixels differ by more than 2 code values, all single points).
- Why two tints: the relief's limb glow is baked (the approved close image), the orbit side's glow follows the Sun angle at the limb ahead, and the dive and the rise look at different parts of the limb.
- Rise cut, column x 950 to 970, code values R G B at 3, 12, 30 px above the limb: 2129 (terrain) 26 105 157, 14 64 108, 6 28 46; 2130 (orbit, `air 0.25`, `rise: [0.6, 2.4, 2]`, `coverShell: [1, 1.0012]`) 31 106 155, 14 68 112, 6 28 51. Before (air 1): a glow 150 px tall. Limb rows at x 300, 950, 1600: 2128 269 202 236, 2129 269 201 236, 2130 268 204 225, 2131 278 197 236, 2132 283 184 242, 2133 292 167 245.
- Left at the rise cut: the right end of the limb line is 11 px higher for the one frame 2130. Two causes, both in the engine's start of the orbit side: its height is the dive altitude (0.0376 radii at 2130, dip 15.5 degrees) while the terrain camera has climbed to 1.8 heights (dip 18.6), so the limb is less curved for a frame (9 px at 650 px from the middle); and the limb tilt is -2.0 against -1.6 degrees (4.5 px). Not asked for: a lower `exitHeight` would match the dip but takes the lift off out of 2100 to 2121.
- Dive cut, same column: 1883 (orbit) with `dive: [0.2, 1.1, 1.25]` 24 87 154, 12 56 112, 5 23 52; 1884 (terrain) 16 93 148, 9 58 101, 5 24 46. Before the tint 1883 was 31 132 183. Limb rows 1883 284 198 196, 1884 246 183 196 (tilt -4.1 against -2.3 degrees: the dive is still rolling out when the cut comes; not touched).
- The whole frame veil is gone: `veil.ts` is the file of 6d658f0 again, `look.veil.whole` and its lines in `set.ts` are removed.
- Sheets: `out/work/earth/p20/cut-a.jpg` (2128 to 2133), `cut-native.jpg` (limb strips at native size), `cut-b.jpg` (2132 to 2137, 2126, 2120), `rise-terrain.jpg` (2099 to 2124: the ground sinks, the limb stays, the Sun leaves at the top), `dive-cut.jpg`.

### Hold stars against the approved image, settled (09:43 UTC)

- The earlier count (film 20 to 37 percent more star flux) came from resizing the approved image with an area filter. With a Lanczos resize to 1920 the far left sky (the hero's own pixels) has flux 859 approved against 866 film, peaks over 40 code values 1057 against 887; lower right 639 against 636. So the film's stars are the approved ones. Off the weak list.

## Round 11 result (09:55 UTC): R1 9, R3 4, R4 6. Round 1 of 3 used, two left

Judged on main ae28011 (my 6d658f0, `rise.settle: 5`, whole frame veil not in it). Scorecard: `git show origin/main:scorecards/round-011/SUMMARY.md` and `R1.json`, `R3.json`, `R4.json`. Corrections, worst first:

1. SEVERE R4, rise handover 2129 to 2130: Sun and horizon change in one frame, blur at full strength at once, veil only on the lower half. Check every frame 2120 to 2140 as a strip.
2. SEVERE R3, 2156: South America ends in a straight shelf on the night side lined with stretched yellow blocks; no texture edge of the wrap may be seen from any dive or rise camera; lights are points along coasts.
3. MAJOR R3, 1857: aurora is separate smeared green blobs on the disc, stray green in the night side and at the south limb; it must be a thin band above the limb with soft vertical rays, nothing green inside the disc. In 2156 red blotchy noise outside the limb and flat green smears over the clouds.
4. MAJOR R3, 1857: pale grey brown land patch with a hard outline on the night side at the right limb; night side looks half transparent. The night side is opaque.
5. MAJOR R4, dive cover 1883 to 1885: limb snaps from a blurred corner sliver to a sharp arc, then the camera stands still.
6. MAJOR R3, finish at full size in 1857 and 2156: embossed land, halo on the Andes, flat Amazon, cotton clouds without cast shadows, smooth hurricane, a hard cyan white line inside the sunlit limb glow (doubled edge), clouds stretched along the lower left limb.
7. MAJOR R3, 2156 sky: lower right Milky Way smeared into blobs, upper left stars sharp. One sky sharpness.
8. Minors: hold aurora rays finer, city lights smaller and less hot, star cores dimmer, rim softer at the left edge, Moon's night side deeper; terrain a touch less warm lift on the sun track, finer wavelets, deeper cloud shadows; city lights on land in daylight colour near the terminator; a few stars doubled in the dive sky; glint striations too coarse; faint banding in the upper glare.

Rules from the Builder: sky patch margin must not show a mirrored copy outside the approved border (`python3 tools/assets/mirrorcheck.py`); inside the approved border change nothing; when R3 faults something that is in the approved image, the approved image wins in the hold view. Stepped ghost copies in fast frames are the engine's, not mine.

### Work on the corrections (09:55 to 10:15 UTC)

- e20e759 (pushed): the rise cut of 09:28 to 09:55 above (`exitPitchDeg -13`, `exitDipDeg 7.85`, `coverShell [1, 1.0012]`, `look.descent`, no whole frame veil).
- Engine request 3 (3d76305, `engine.patch`, `REQUESTS.md` item 3; `src/director/moves.ts` changed in the working tree only): `rise.gentle`, `rise.from`, `dive.level`, `terrain.entryDipDeg`. The plan on the branch carries them, so the branch builds only with the patch until it is on main. Then: drop the local copy (`git checkout src/director/moves.ts`) and merge main.
- Correction 1, numbers with `rise: { settle: 10, gentle: true, from: 0.0565 }` (`cut.ts`, `predict.ts`): 2129 terrain height 1.800, dip 18.64, limb 14.14 degrees above the axis, 0.196 from the top, tilt -1.6; 2130 orbit altitude 0.0573, dip 18.95, limb 14.20, 0.195, tilt -2.0; altitude 0.0665, 0.0885, 0.1274, 0.1902, 0.286, 0.424, 0.612, 0.853 at 2131 to 2138, 1.47 at 2140, 2.88 at 2144, 3.82 at 2148, 4.27 at 2156. Predicted blur median px: 2130 11.5, 2131 47, 2132 66, 2134 65, 2136 49, 2138 51, 2140 50, 2144 25, 2148 7.9, 2152 1.9, 2156 0.2 (before: 2130 159, 2131 134). Draft strip `out/work/earth/p23/strip-a.jpg` (2128 to 2138): one move, the limb stays, the veil thins over 2131 to 2138.
- Correction 5 and a sharp 1857, plan values `dive: { level: 0.62, surge: { glide: 0.03, rise: 40, fall: 3, swell: [0.35, 11, 1.3] } }`, `terrain: { entryPitchDeg: 1.2, entryRollDeg: -3, entryDipDeg: 0.42 }`. `horizonDeg` is NOT to be changed (it is the limb of the judged terrain frame and is used by the terrain pose and the rise). Limb from the top 1876 to 1883: -0.107, -0.061, 0.022, 0.098, 0.127, 0.146, 0.159, 0.165; terrain from 1884: 0.166, 0.167, 0.168, 0.170 (1888), 0.174 (1892), 0.179 (1900), 0.184 (1910). Tilt -36.5 to -4.2, then easing to -2.4 by 1910. Predicted blur at 1857 0.7 px median, 1.0 p90 (was 2.8, 3.9), altitude 3.17; 1864 3.0, 1870 11.6, 1872 19.9, 1874 39.8, 1875 57. Canvas with entry pitch 1.2: ymax 2124 at 1884, 2086 at 1888, 2051 at 1892, 2021 at 1896, 1994 at 1900 of 1980 (the mirrored bottom margin reaches 2120; under cover until 1891; look at 1892 to 1900 at the frame bottom).
- Findings at native size (round 11 finals against the hero): the "yellow blocks" at 2156 were city lights smeared by 2.6 px of motion blur (now 0.2 px); the "shelf" is the approved image's south east coast of Brazil with its lights, level in the rise frame. The on disc green at 1857 is the hero's aurora in the emissive alpha plus green residue in the surface map (south Atlantic, West Africa); the ribbon mesh is built for the hold distance, so from further away (2156, 5.27 radii) it stands in front of the disc. The pale patch at the right limb of 1857 is West Africa: amplified hero night pixels (blocky, saturated, an outline where the hero weight ends).

### Outside the hold: `away`, the far map, the aurora map, the sky margin (10:15 to 10:45 UTC, working tree)

- `away` (`set.ts`): 0 until frame 1800, 1 from 1851 and in the rise (`look.away = [1, 0.7]`, seconds before and after the end of the hold). Every change below is times `away`, so hold frames before 1800 are the same bytes as before (checked: 1755 against p13 differs only in the aurora sector, from the aurora map change below).
- Why: the wrap map is the hero where the hero shows the globe, and the hero's dark side (night and twilight) divided by a dark light curve is amplified noise, with the hero's on disc aurora left in the surface colour (North Atlantic, lon -40 to -5, lat 25 to 65) and in the cloud colour, and the hero's limb pixels stretched. In the hold that is the approved picture. From any other camera it is the faulted material (items 2, 3, 4, 6).
- Cause found for the stretched lights and smeared land past the hero's limb (item 2): the registration flow (`out/work/earth/guide/flow.npy`, hero geography against the real one) is 4 to 10 degrees (max 16) and falls to zero within about 6 degrees past the hero's limb, so the far map there was squeezed and stretched (Europe and its lights in horizontal streaks).
- Fix: a second map `wrap-far.webp` (`wrap.py 8192 far`, 80 s): Blue Marble through the hero colour table as before, but placed with a gentle flow (`far_flow()`: the old flow where the hero is lit and faces the camera, a smooth extension of it elsewhere, fading to zero at 172 degrees from the hero centre; stretch outside the trusted zone 1st to 99th percentile -0.07 to 0.06 along x, -0.17 to 0.09 along y, before -0.6 to 0.9). RGB is the surface, alpha the Black Marble lights (square root coded, 8192 wide, glow 2.2 px, so points). Full 8192 by 4096 (5.2 MB), web 4096 by 2048 (1.2 MB).
- Shader (`globe.ts`, all inside `for (k < (uAway > 0 ? 1 : 0))`): `bad = away * (1 - smoothstep(far.light, held - cap))` where `held` is the light of the hero at that place and `cap` widens the zone around the aurora residue (`far.cap`: lon, lat, boost, inner and outer radius in degrees); surface mixes to the far map by `bad`; cloud colour goes neutral by `bad` (green tint of the hero's aurora over cloud); lights mix to the far lights by `rim` (`far.rim` on the cosine from the hero centre: the hero's limb lights are stretched). Night flatten as before but the tone is a mix of a sea tone and a land tone by the red to blue ratio of the surface, so night land reads.
- Aurora map: red glow cleaned (see above in the summary of 10:15), on disc aurora times `1 - away`.
- Sky patch margin: with a low pass margin the dive showed a starless strip about 140 px wide at the left frame edge (1840, 1857, `/tmp/sky-edges.png` pushed as a look). The engine mixes patch and shared sky by one weight, so a starless margin dims the shared stars too. Now the margin is the low pass plus the star points of the padded image turned (side margins flipped top to bottom, top and bottom margins flipped left to right, corners both): no mirror line at the approved border, stars continue. Inside the approved border nothing changes.

### Far cloud map, night land, Andes dusk light, aurora tail (10:46 to 11:00 UTC)

- Commit ef5d0e9 (pushed 10:46): `away`, `wrap-far.webp`, aurora map, sky margin with turned stars.
- Sky margin, checked at draft: 1857 against the frame before has stars in the left 120 px (star pixels per 60 px column band 244, 455 against 22, 16), `mirrorcheck.py` says clean. 1755 against the frame before the margin change: 1408 pixels differ, all over 4 code values lie in row 0 or column 0 (half a texel of margin at the frame edge).
- Found in p27 2156 at native size: (a) the Andes glow as a bright orange blob in the night: it is the hero's dusk light, kept in the emissive map and drawn as city light once `away` turns the dusk rule off. Now the emissive map gives way to the far lights wherever the dusk zone is (`max(rim, zone * uAway)`). (b) white speckled blotches on the night sea and green noise: the hero's cloud map on its night side is amplified noise (`/tmp/cl-pair.png`), and past the hero's limb the far clouds were laid through the old registration flow, so they are stretched in stripes. (c) night land was darker and bluer than the night sea (8,13,24 against 3,11,26): the hero has night land lighter and neutral.
- Fix for (b): `wrap-far-cloud.webp` (`python3 wrap.py 8192 farcloud`, 53 s; full 4096 by 2048, web 2048 by 1024, RGBA, same coding as `wrap-cloud.webp`): the VIIRS guide's whiteness through the gentle far flow, no clouds south of 63 degrees (the guide ends there with a hard edge). The shader mixes the cloud layer to it by `drift = max(away * hero dark, rim * rise)`: on the hero's night side in the dive and the rise, and in the ring past the hero's view cosine 0.3 to 0.55 in the rise only. The lit North Atlantic keeps the hero's clouds in the dive (a far cloud there would cross fade in view during 1800 to 1851). Cast shadow and the bloom precompensation follow the same mix. `soft` is 0 now (the blur of hero cloud made smooth blobs), `dim` 0.65 (night clouds faint, as in the hero).
- Fix for (c): `look.globe.away.land` [0.17, 0.166, 0.16]. With [0.2, 0.195, 0.185] night land at 2156 measured (23,24,32) against sea (3,11,26).
- Far map: ice (Blue Marble minimum channel above 0.7 to 0.86) is laid as a pale blue white with the guide's own shading instead of the colour table's flat grey (Greenland read as a grey patch).
- Aurora ribbon: `look.aurora.tail` [0.78, 0.86] fades the last part of the ribbon times `away` (from the rise camera its end stood in front of the disc at the lower right limb).
- `uRise` (1 from the start of the terrain segment): the lit ring past the hero's limb is swapped only in the rise.
- `flat` is back to [0.1, -0.08].

### Engine batch 11 merged (11:02 UTC, 190969e), request 3 is on main

- `src/director/moves.ts` local copy dropped, `origin/main` e5c57ba merged (never rebase). Build passes, 59 of 59 tests. `engine.patch` stays as a record and is not applied again. `cut.ts` gives the same numbers as before the merge (2129 limb 14.14 degrees, 2130 14.20; 1883 15.51, 1884 15.46).
- Batch 11: sample count follows the screen motion (draft stays 1, final up to 128). `npm run -s samples -- --tier final --frames ...`: 1755 16, 1857 64, 1875 91, 2010 16, 2136 93, 2140 72, 2156 64. A raised frame costs up to four times as long. Stepped copies are the engine's cure, soft or blocky texture under motion stays mine.
- G15 with both far maps (far cloud at 4096): earth/full 1341 MB, earth/web 337 MB. Far cloud is now 5632 wide (about 21 MB more in full, 5 in web): measure again before READY.

### Outside the hold, second pass (11:03 to 11:10 UTC, p30)

- `look.globe.away.fine` [0.6, 4, 0.6, 1.2]: gain of the far cloud map's fine structure on the hero clouds (map minus its level 4 low pass), cast shadow strength 0.6 (hold 0.4) and 1.2 levels crisper, all times `away`. 1857 before and after `/tmp/fine-a.png`, `/tmp/fine-b.png`: a little more structure in the hurricane and the cloud fields, shadows deeper.
- `look.globe.away.far.ring` [0.5, 0.66, 0.2]: the rise ring (cosine from the hero centre) and the dimming of city lights toward the limb (`exp(-0.2 (1 / mu - 1))`, the lights at the east limb were a bright crust).
- p30 2156: South America is a dark neutral silhouette on a deep blue night sea, lights as points on its coasts, no green on the disc, the aurora a band outside the limb with a soft red glow. 1755 same bytes as before.

### Rise strip 2120 to 2140 at draft, after the merge of batch 11 (11:09 to 11:22 UTC, `out/work/earth/p31/`)

- Every frame looked at (`/tmp/s1.jpg`, `/tmp/s2.jpg`, strips of 8): 2120 to 2129 the limb stays 0.2 from the frame top, the ground sinks, the deck grows from 2122 and is whole below the limb at 2129; the sky above the limb stays open and black, no Sun in frame. 2129 to 2130 (the switch): same limb line and curve, same deck streaks, same blue line. 2131, 2132: the globe shows through the thinning deck.
- Draft has one time sample, so the blur ramp is not in these frames. Predicted: 11.5, 47, 66 px at 2130 to 2132.
- Tried and dropped: fine land detail from the far map on the hero's land (offline test `/tmp/det-am.png`, `/tmp/det-na.png`): the Blue Marble through the colour table has no visible fine structure at the frame's scale; the hero's own land has more. Not built.
- The far cloud map has a swirl of stretched bands near the hero's hurricane (lon -125 to -112, lat 14 to 32: the hero registration is wild there). It is used there only as fine structure on the hero's clouds; at 1857 it reads as a little more structure in the spiral arms. Watch it at final.
- Batch 12 (11:14 UTC, main 759b70f): the sky pass dropped out for single frames low over a planet; hit in my stop: 1883, 2130, 2131. Merge before the next renders.
- Plan: `look.away` to [0, 0.85] so the whole hold is the approved picture and the change of the night side happens inside the first 26 frames of the dive (full at 1856).
