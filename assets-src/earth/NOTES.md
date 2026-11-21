# Earth stop notes

Lab notebook of the agent that builds the `earth` stop. Read `assets-src/shared/STOP-AGENT.md` first, then this.

## State

- Branch `agent/earth`, looks on `agent/earth-looks`. VM: 4 cores, 7 GB RAM, no GPU.
- Started 2026-11-21 02:43 UTC. Merged `origin/main` at 9602aca.
- Judged frames: hold 1755, dive 1857, terrain 2010, rise 2156. Segments: hold 56 to 61 s, dive 61 to 64, terrain 64 to 70, rise 70 to 72.5, travel 72.5 to 75. 30 fps.
- Milestones sent to `/root`: none yet.

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
