# Neptune stop notes

Lab notebook of the stop agent for `neptune`. Read `assets-src/shared/STOP-AGENT.md` first, then this.

## Log

- Start. Cloned, branch `agent/neptune`, merged `origin/main` at 9602aca. `npm ci` and `npm run build` pass. Rendered the stand-in `hold` and `terrain` comparisons at the draft tier and pushed them as the first looks.

## How the engine works (read once, kept here so it need not be read again)

- A stop = `src/stops/neptune/set.ts` (`createSet(ctx)` returns `StopSet { id, world, near?, sky?, update(state, shot, view), dispose }`) and `plan.ts` (`MoveParams`, `new StopPlan('neptune', fit, params)`). Mars is the pattern: `src/stops/mars/{set,plan,look,assets}.ts` with JSON beside them.
- Engine per sample: sky (with sky patches from `set.sky`, aim set by engine from `skyframe.json`), then `world` scene (set.world positioned at origin minus camera, rotated by `state.rotation`), then `near`, dust, cover. Post once on the average. Body pixels write alpha 1, sky 0 (G5 coverage). Diag views through `diagOut(...)` in `src/diagnostics/diag.ts`: texels (counted flag), layers, depth, flow.
- `state.view` is `orbit` or `terrain`. Terrain view: set.world origin = the spot on the globe, rotation = terrainFrame (x right, y normal, -z heading). Camera pose from `plan.terrain(t)`: position `(side*u, rise*u, -forward*u)` in camera heights around the fitted relief camera at origin, u from -0.5 to 0.5.
- Ending: `ending.retreat/lookback/fade` draw Neptune's set in the orbit view with `state.segment.stop !== plan.id`; Mars blends its light from `plan.lightDir` to `shot.sun.dir` (`lit`). LOOKBACK in `src/director/film.ts`: Neptune 31 deg off the Sun, distance 9 radii, vfov 34. So the crescent is seen at phase angle about 149 deg.
- Shared classes: `Planet` (`src/bodies/planet.ts`: wrap map, patch levels up to 6, storm turn about an axis by mask, light curve of 33 knots, ground haze, grazing haze), `HazeShell` (`src/bodies/haze.ts`), `MoonBody` (displaced, with baked lit map + mask), `Relief` (`src/terrain/relief.ts`: layers of color+alpha+dist with aprons, masks for mist/dust shift, valley fog march, air layer), `FarPoint`, `Cover` (engine-owned, set from plan colors).
- Approved pixels used as textures go through `inverseFilmic` and the lens vignette is undone on them (`uVignette`).
- Stand-in rings are a `RingGeometry` with 6 gaussian lines (shimmer risk). Neptune needs its own ring module.
- The loader counts texture bytes: w*h*4*(4/3 with mips), float data textures by byteLength. Limits: full 1400 MB, web 450 MB.
- Config: 30 fps. neptune.hold 151-156 s (frames 4530-4679, judged 4605), dive 156-159 (judged 4707), terrain 159-165 (judged 4860), rise 165-167.5 (judged 5006). Cover 0.5 s at 0.6 of dive, 0.4 of rise.

## Measured on the approved images

- Hero fit (`python3 tools/assets/fit.py --stop neptune`): rms 3.931 px, circle cx 1410.57, cy 1208.53, r 1003.96 in the 2816x1584 hero. vfov 30, camera `[-0.00035, 0.40304, 3.100998]`, identity rotation. My own limb points: the fitted silhouette sits on the disc edge at the top; the hero limb is 6 to 10 px outside it at the right (0 deg) and upper left (110 to 140 deg). Accepted, known weakness.
- The hero has a thin bright rim line about 8 px outside the disc edge on the lit right limb, and a thin blue line on the night limb.
- Band axis from the streak orientation of the hero (structure tensor, score 0.97): `a = [0.29036982, 0.66913061, -0.68406842]` in fit coordinates (x right, y up, z toward camera). Sub-camera latitude about -36 deg. The -a pole is visible at lower left on the night side. Saved in `out/work/nep/bandaxis.npy` (untracked, value is here).
- Hints: sunDir `[0.71645, 0.697532, -0.012168]`; Sun in frame near hero px (2514, 227), dir `[0.346125, 0.175842, -0.921562]`; Triton hero circle (337, 407) r 95, position `[-5.671008, 2.437694, -12.56572]`, radius 0.475967, pale with pink upper part, lit from the right; ring normal `[0.086509, 0.99591, 0.026066]`, radius 1.4082 (low confidence; in the hero the ring is a faint wide dusty band with brighter thin arcs, lower left in front of the night side and at right); storm near hero (0.55, 0.50).
- Close image: the horizon runs from about (10, 300) at the left edge to about (2710, 670) at the right in the 2816x1536 close image (y from top), a tilted, gently curved limb with a wide blue haze band above the deck. The dark storm sits in the lower right foreground, the white band streams from the left edge round it.

## Design decisions

- Orbit: own `NeptunePlanet` shader in `src/stops/neptune/` (copy of `src/bodies/planet.ts`, changed). Body Y axis = band axis `a` (globe quaternion in `src/stops/neptune/fit.json`). Spin about it; with omega = +a the visible surface moves right and down along the streaks. `hold.axis` near `a`, orbit opposite to the spin. Ring keeps its fitted normal.
- One RGBA texture per level: RGB = cloud-free deck albedo (hero divided by the light curve, tone coded), A = cirrus opacity. Cirrus colour is a computed white. Alpha from luminance `(hero - deck)/(white - deck)`. WebP with alpha saved with `exact=True`. Loader does not premultiply.
- Memory plan (full): wrap 8192x4096 RGBA = 179 MB, five 4096 patch levels at 89.5 MB = 447 MB, total 626 MB, leaving about 770 MB for relief layers, Triton, sky patches, ring.
- Cirrus is sampled where the view ray crosses a shell at radius about 1.004 (parallax in the dive). It streams by an extra latitude-dependent rotation about body Y with bounded fine turbulence, all zero at the judged frame (`elapsed = time - holdMid`).
- Soft shadow computed in the shader: 4 to 6 taps of cirrus alpha offset toward the Sun (`L_tangent * h / max(ndl, 0.15)`), modest strength. Deck = hero pixels where there is no cloud, generated cloud-free deck (image tool: remove cirrus and shadows from the hero, colour matched) under and beside clouds.
- Storm turns by rotating the deck lookup about the storm centre with falloff, zero at the judged frame.
- Haze: ground haze in the shader, a thin shell with the bright rim line at about 1.008 R, a wide halo, one layer across the disc edge on lit and night side. Night side never black. Crescent checked from the lookback angle (phase about 149 deg).
- Triton: real sphere, generated map, moves about 2 px per frame. Ring: own true 3D module with a smooth analytic, filtered profile so it does not shimmer. Hero sky patch for the hold. Sun as a small star with spikes via the plan light settings.
- Terrain: close image projected from its own camera onto a fitted sphere deck plus a raised cloud layer (mesh displaced by a height map). Motion as rigid rotations on the sphere reprojected into image coordinates (storm about its centre with falloff, cloud band about the band pole). Cloud shadows as a soft shadow map taken from the close image (approved over clean deck) travelling with the clouds. Clean deck via image tool. Aprons outpainted left, right and bottom on one extended canvas. Haze/air layer at the horizon. Terrain sky patch. Fit the horizon to get camera height over radius and set `dive.altitude` to match. Fine detail added in the dark lower-left foreground keeping approved pixels as the low frequencies.
- Dive and rise: patch levels 2x apart designed with a predictor. Blue haze cover streaming on both sides, thinning over 10 frames or more. Descent grade toward the terrain light. Rise ends with the whole body in frame, calm.

## Next

1. Orbit view: fit.json quaternion, 2x hero, cloud-free deck, RGBA wrap, light curve, shader, haze, Triton, ring, sky patch, Sun. Compare draft then final. Message `/root`.
2. Terrain view. 3. Dive and rise. 4. Self-check, `READY`.
