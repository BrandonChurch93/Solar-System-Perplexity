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

## Next (current)

1. Terrain sky patch (`sky-terrain.webp`): `sky.json` has a `terrain` entry; with gain 0 a still of frame 2010 has a black sky (`out/work/earth/still/terrain-nosky.png`); `sky/patch.py terrain STILL` writes the patch = close image minus the still above the horizon, held below it and in the margins. Then set gain 2.380952 and the file name.
2. Stills of 1920, 2010, 2099, 2120; check tower parallax, drift, shimmer, the sky rim. `relief/RECIPE.md`. Commit the binaries. Terrain milestone message (say that `light.sunDir` is set).
3. Dive and rise: patch chain (`patches.levels` is empty), predictor, cover = thin veil of high cloud, G13; tune `dive` for the spot and heading.
4. `for` loop advice in `globe.ts` and `air.ts`, far-side polish, own checks, gates G11, G12, G15, `READY`.
