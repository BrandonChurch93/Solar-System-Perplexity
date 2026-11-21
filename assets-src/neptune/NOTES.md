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

## Notes from the Builder (03:15 UTC, day 1)

- `public/assets/neptune/web/` at or under 35 MB on disk (not 40). Full stays 150 MB. The film is rendered from full.
- Engine requests as early as possible (they move the engine hash for every stop). Prefer stop-local code.
- The set is also on screen in the travel before the hold (body grows from a point of light: `FarPoint` as in the Mars set) and after the rise. Keep both free of pops. Judged in Phase 5.
- Ending (`ending.retreat`, `lookback`, `fade`): camera pulls away past Triton at close range, turns back, Neptune a thin blue crescent, Sun one bright star. The crescent needs a glowing limb and a night side that is not pure black. Triton's map must hold up larger than in the hero. Judged in Phase 5.

## Geometry decided

- `src/stops/neptune/fit.json` globe quaternion = `[-0.3659887, 0.0456763, -0.1774456, 0.9124029]`: body Y = band axis, body Z = camera direction projected (lon 0 under the hold camera). Sub-camera lon 0, lat -36.3. Sub-solar lon 35.0, lat 43.1 (the visible south pole is in polar night). Storm at lon -0.25, lat -18.8.
- `assets-src/neptune/geo.py` holds the shared geometry and tone functions (decode = inverse filmic of sRGB to linear, encode = the reverse).
- Hero in scene-linear: night side about (0.0013, 0.007, 0.017); deck blue rises 0.09 at ndl 0.15 to 1.14 at ndl 0.75; deck R/B about 0.07, G/B 0.40 at the terminator to 0.24 at high sun; brightest cloud luminance about 1.2 for ndl > 0.4, 0.7 at 0.2 to 0.4, 0.25 at 0.15.

## Wrap pipeline (decided and measured, 03:15 UTC)

- Scripts: `assets-src/neptune/wrap/unproject.py` (2x hero to the band-aligned equirect window, `out/work/nep/wrap/hero-map.png` 4552x3641 with `hero-map-geo.npz`: mu, ndl, window), `curves.py` (deck and cloud light curves, `curves-measured.json`), `separate.py` (functions), `sepmap.py` (separation in map space, writes `hero-layers.npz`: deck albedo, alpha, weight).
- 2x hero: `tools/ml/upscale.py`, about 6 minutes, `checkmoved` PASS (PSNR 54.17 dB, SSIM 0.9989, flow p99 0.028 px).
- Deck albedo reference `A0 = (0.058, 0.215, 0.80)` scene-linear. scene = albedo * deckCurve(ndl), 33 knots over ndl -1..1. Night about (0.022, 0.034, 0.021), terminator 0.027/0.040/0.027, 0.27/0.33/0.25 at ndl 0.25, 0.71/0.81/0.79 at 0.5, 1.18/1.06/1.14 at 0.625, 1.58/1.14/1.32 at 1.
- Clouds are bluish in scene-linear: `K = (0.30, 0.39, 1.0)`. Cloud scene blue level by ndl knots `[-1,-0.2,0,0.06,0.125,0.19,0.25,0.31,0.375,0.44,0.5,0.56,0.69,1]` is `[0.02,0.02,0.05,0.15,0.35,0.77,1.26,1.7,2.0,2.3,2.5,2.7,3.0,3.2]`. The shader gets a second 33 knot curve for the cirrus.
- Separation: albedo = decode(map)/deckCurve; local floor (25th percentile) gives the deck hue; least squares unmix `C = p*hue + q*K`; zone m from `q/white`; deck = albedo outside the zone, anisotropic fill along longitude inside (normalized convolution at growing scales, clean pixels only, plus a grain tile); alpha from luminance. Recomposite error in the well lit part: mean 2.48 of 255, p99 37 (thin bright cloud cores). Telea inpainting was tried first and rejected (bright blobs, blur). First unmix with a white cloud colour left pale clouds in the deck, fixed with K.
- Hero-lit part of the sphere is only about lon -60..70, lat -47..35 (12 percent). Hero pixels fade out for mu < 0.42 and ndl < 0.2. Everything else is generated.
- Far side plan: separate layers. Deck tiles (cloud free, flat lit, band aligned) and cirrus tiles (white on black, alpha directly). Mid band: 3 tiles of 160 x 90 deg at lon 60, 180, 300. Poles: polar projection caps of radius 55 deg, north and south. All upscaled 2x. Detail of each tile kept as ratio to its low pass, colour set from a zonal target profile so tiles cannot differ in colour. Cross-fade overlaps (cirrus by max).
- Limb in the hero (sRGB): thin bright line at the disc edge, strongest at theta 45 to 90 deg (R to 240), into the twilight (theta 120 B 169, 135 B 55, 150 B 33), gone at 165 to 180. Outside glow at theta 45: B 235 at +3 px, 209 at +11, 166 at +25, 123 at +40, 85 at +70. Inside the sun side limb brightens over the last 20 to 30 px. Night side inside about (2, 6, 17). Plan: ground haze in the shader, thin bright core shell plus wide halo, forward scatter term (zero at the hold, strong in the lookback crescent).

## First real render (03:35 UTC)

- Wrap assembled by `assets-src/neptune/wrap/assemble.py`: `public/assets/neptune/full/wrap.webp` 8192x4096 RGBA (RGB = sRGB of albedo x 0.5, A = cirrus opacity, WebP exact, quality 92, 9.7 MB), web 4096x2048 (2.4 MB). Far side from generated tiles (deck: `deck-m0`, `deck-m1b`, `deck-m2` at lon 60, 180, 300, caps `deck-n`, `deck-s`; cirrus `cir-m0..m5`, `cir-n`, `cir-s`), all take 1 except `deck-m1` (bowed bands, replaced by `deck-m1b`). No ML upscale of the tiles. Tile detail = log ratio to an anisotropic low pass, colour from the hero zonal median profile so tiles cannot differ in colour.
- Stop code now: `planet.ts` (NeptunePlanet: deck + cirrus on a raised shell with parallax, two shadow taps toward the Sun, storm turn, stream shear, ground haze, rim and forward terms), `triton.ts` (sphere with map), `ring.ts` (true 3D annulus, analytic ringlets widened by `fwidth`, planet shadow, additive, alpha 0), `plate.ts` (temporary terrain plate), `look.ts`, `haze.json`, `assets.ts`, `set.ts`.
- First hold comparison at the draft tier: framing, storm, cirrus and terminator are in place. Wrong so far: no hero sky patch yet, the limb shell is far too bright and wide, the ring is too bright, too sharp and not on the hero's ellipse, the Sun is too small, clouds read slightly lavender.
- Known open problem: the hero inset carries the hero's limb lighting, so in a flat lit preview it shows as a lighter lens. To check from the rise and lookback angles.
- Triton map: `assets-src/neptune/triton/make.py` from `out/work/nep/gen/triton-map-t1.png` (take 1), 4096x2048, seam mirror-blended, poles smoothed to the zonal mean.

## Orbit view work, 03:45 to 04:20 UTC

- Own atmosphere module `src/stops/neptune/air.ts`: three exponential layers plus one thin line shell, each with its own aimed light direction (`aim`, scaled by `home`) and `away` values `[from, to, gain]` that replace `dayFrom`, `dayTo` and the day gain when `home` is 0 (ending, far side). `home` is 1 near the hold view and 0 in the ending. Values in `src/stops/neptune/haze.json` (`air`, `limb`).
- `check/fit_air.py` (least squares on the outside limb profiles) was unstable. Values were set by hand from it. The dim inside limb was extinction by optically thick layers: depths bounded, `extinction` 0.5.
- Veil: the hero deck brightens toward the sunward limb (1.3 to 2 times at mu 0.45 to 0.25, about 3 times near the subsolar limb). The planet shader mixes toward `limb.veil` by `veilAmount * (1 - smoothstep(veilMu, mu)) * pow(smoothstep(veilSun.xy, dot(n, veilDir)), veilSun.z)`; `veilDir` is the Sun aimed by `veilAim` (toward theta 25 deg, because the hero's brightening is stronger at the right limb than at the top). `wrap/sepmap.py` divides the same veil out of the hero inset (reads `haze.json`), so after any veil change run `sepmap.py` then `assemble.py` (about 5 min).
- Limb terms added 04:10: `limb.shade` (air on the disc is switched off where the ground is unlit, except at mu < 0.1, times `home`; it removed a blue wash in the upper left twilight zone), `limb.twilight` (limb darkening for ndl 0 to 0.4, the hero is 0.5 times the curve there), `limb.dark` now applied after the air, direction theta -30 deg, wider with strength (the hero has a wide dark blue band inside a thin cyan line at the lower right limb, hero B 0.06 to 0.09 from rt 0.945 at theta -15 to -20), times `home`. `rim` raised to `[2.2, 4.4, 6]`, width 0.055 (hero rim line peaks 3 to 5 at rt 0.993 to 0.995). Hot spot layer `dayFrom` 0.9. `look.nightGain` 1.2 on the night knots of the deck curve (hero night 0.014 to 0.019 B, film was 0.012 to 0.016).
- The hero limb is not a circle: disc edge at rt 0.996 at theta 45 to 90 (inside the fitted sphere by 4 to 5 hero px), at rt 1.004 at theta 0, cyan line at rt 1.013 to 1.017 at theta -15 to -20, line at 1.005 to 1.007 at theta 135. Probably an oblate body (minor axis near theta 65 deg). The sphere is kept. Known weakness: limb offset up to 4 px at 1920x1080.
- Ring: fitted to hand-picked points of the hero's main strand (`out/work/nep/ringfit3.py`): `normal [0.1681, 0.9779, 0.1244]`, `centre [0.0533, 0.0532, -0.4902]` (rms 12.7 px; a centred ring gives 73 px). `centre` is scaled by `home`. Main strand radius 1.52. Hero strand points: far branch (95,1010) to (470,795), near branch (100,1050), (250,1195), (460,1260), (700,1365), (760,1385), right (2440,1160) to (2800,1395). Still open: the right branch is too faint and too regular in the film.
- Sky patch for the hold: `assets-src/neptune/sky/patch.py hold HERO FILL GLOW OUT`. Sky = hero minus a film frame rendered with the sky off (`sky.json` gain 0, review tier, copied to `out/work/nep/sky/glow-only.png`), hero's own sky from 1.07 radii out except where the film glow covers it, Triton's disc and the projected ring annulus; never excluded within 330 px of the Sun. Elsewhere a generated fill (`out/work/nep/sky/fill-t1.png`, take 1 of 6; recipe to be written in `sky/RECIPE.md`), low frequencies matched to the hero; outside the disc the fill's stars are replaced by the hero's own stars (top hat by line openings, so ring strands and the limb line are not copied), inside the disc the fill's stars are scaled to the hero's star energy. Margin 0.125: mirrored sky with the Sun removed (radial glow profile continued), blended over 110 px into a plain mirror at the border. Lossless WebP 3520x1980 (6.3 MB), web 1760x990 (1.9 MB). `sky.json` gain 1.538 = 1 / skyExposure. The engine draws the Sun core as a black dot in the patch.
- Triton: light aimed by `look.triton.aim` (times `home`). Film Triton measured 89 px radius against 95 in the hero, 8 px up and left (to check at the final tier).
- Check scripts: `check/profiles.py` (fine limb profiles), `check/outside.py` (compact table by theta), `check/ratio.py STILL OUT` (film over hero map in blue, red = film brighter, and a table of medians by ndl for mu > 0.45). At 04:05 the disc medians matched within 3 percent for ndl 0.1 to 0.8.
- Engine batch 1 merged (b4ae65c): sky patch `weight(time, view)` optional, faster sky pass. Software rasterizer computes both sides of an `if`; put costly conditional work in `for (int k = 0; k < (cond ? 1 : 0); k++)` with `textureGrad`.

## Orbit view work, 04:20 to 05:10 UTC

- Line shell (`air.ts`, `haze.json` `air.line`): `bulge [0.866,-0.496,0.0645,0.011]` (shell radius raised toward theta -30, times `home`), `tail [0.5,2.8,5.0]` with `tailEdge [0.3,0.75]` (extra cyan light on the line by `dot(tp, sun)`, times `home`), `inner 1.0005` (closed a dark gap at the night limb), `lift 0.0025`. Broad layer night colour `[0.0005,0.0016,0.0036]`.
- Twilight cirrus: `sepmap.py` builds the 33 knot cloud curve itself (`CLOUD_KNOTS/CLOUD_VALUES`, tint by sun angle `TINT_KNOTS/TINT`: neutral grey at the terminator to `(0.30,0.39,1)` above ndl 0.3) and writes `src/stops/neptune/curve.json`. Alpha is extracted down to ndl -0.06. `gweight` (mu 0.08..0.26, ndl -0.1..-0.04) removes generated cirrus inside the hero's disc. `planet.ts` cloud fade `smoothstep(-0.09, -0.03, ndlc)`. Result: grey-white twilight cirrus like the hero.
- Limb field: `field.json` 40x40 x 2 sides (side 1 = clockwise from the Sun direction), mu 0..1 by ndl -0.3..1, a log2 gain per cell, applied after the air, weighted by `home * look.field.amount`. One iteration: `npm run still -- --frame 4605 --tier review && python3 assets-src/neptune/check/field.py out/work/stills/f04605-16x9-review-full.png`. Rules in `field.py`: `EDGE 3`, `RIM 8, CAP 1.2`, `hot` (ndl above 0.84..0.93: columns below 8 clipped to +-0.4). Residual now rms log2 0.256, p95 0.568.
- Limb terms in `planet.ts`: rim centred at `rimMu` (times `home`) and a cut at the very edge (`cut`, `cutMu`, `cutFrom`, `cutTo`, `cutAim`). `cut` 0.75 drew a dark outline at the lit limb in crops; it is 0.3 now and the outline is gone. The right limb still shows two or three thin stripes where the hero has one soft band and one thin cyan line.
- Ring: `ring/map.py` measures the ring map from the hero (hero minus a still with the ring off, unwrapped into the fitted ring plane); a second pass adds the broad residual from a still with the first map. `STRAND 2.2`, `FLOOR 0.0008`. Annulus medians within about 5 percent of the hero by azimuth. The left ansa in front of the night side is fainter than the hero's (crop D).
- Triton: `make.py` `SATURATION 0.3, CONTRAST 1.25, WASH (0.93,0.84,0.845), PLAIN (0.97,0.975,1.0)`; `triton.ts` relief step `eps = max(9/mapWidth, 2.5*length(fwidth(d)))`; `look.triton.gain 1.75`. In the final compare Triton is a little smaller (89 against 95 px radius in the hero frame), darker and more speckled pink than the hero's.
- Sun: radial blue medians round the Sun equal the hero's at the review tier, rays the same.
- Engine batches 1 to 3 merged (main 3523b45, engine hash e44fa21a5a599a98). `skyAim.orbit [25.78793, 56.89437, -50.63077]` is in `plan.ts` (printed by `npm run -s aim -- --stop neptune`; the hold is the same picture). Do not tune it for the ending.
- `npm run budget -- --stop neptune` throws in `tools/budget.ts:18` (`travel.firstFrame` of undefined: Neptune has no travel segment). Reported to the Builder. Texture memory by hand: wrap 179 MB, Triton 44.7, sky patch 37.2, ring under 3, stand-in plate about 23: about 290 MB of 1400.
- Builder at 05:03: motion first. Orbit milestone sent as it is; limb, ring and Triton refinements come back through the rounds. Move to the terrain view, then dive and rise.

## Open on the orbit view (for the rounds)

1. Right limb stripes, limb offset up to 4 px (hero body is not a circle), lit limb has a teal band outside the white rim where the hero has a soft glow.
2. Ring left ansa fainter than the hero; ring map measured only where the hero shows the ring.
3. Triton size, tone and speckle; its aliased edge at the final tier.
4. Night side: faint dark blotches from generated deck tiles (`DARK, LIGHT = 0.14, 0.35` in `assemble.py`); hero night disc B 0.011 against film 0.006 to 0.008 near the left limb.
5. Not yet checked: lookback crescent (`ending.lookback`), the rise view of the far side (hero inset lens, annulus with no cirrus at hero mu 0.08 to 0.26), hold motion sheet (clouds crossing the limb field, Triton speed, ring shimmer).

## Next (05:10 UTC)

1. Terrain view (milestone 2): fit the close image camera and horizon, deck plus raised cloud layer with real parallax, flow (band streams, storm turns), shadows, aprons, haze cover, terrain sky patch, `skyAim.terrain`.
2. Dive and rise with patch levels and the predictor (milestone 3). Rise and lookback checks from item 5 above belong here.
3. Self-check, `READY`.
