# Uranus notebook

Stop agent for `uranus`, branch `agent/uranus`, looks on `agent/uranus-looks`. Parent is `/root` (message with `message_agent`, never wait for a reply).
After a compaction: read `assets-src/shared/STOP-AGENT.md`, then this file.

## Fixed facts

- Frames: hold 3960 to 4109 (judged 4035), dive 4110 to 4199 (judged 4137), terrain 4200 to 4379 (judged 4290), rise 4380 to 4454 (judged 4436). Travel is not mine.
- Tiers: draft 1/1, review 4/16, final 16/64 samples. Judged stills at `final`, master 1920 x 1080, `full` assets.
- Budgets: texture memory full 1400 MB, web 450 MB, disk full 150 MB, web 40 MB, 6 takes per asset.
- Approved images are 2816 x 1584. Hero: globe circle cx 1460, cy 859, r 529 px. Miranda (671, 344) r 29 px, Ariel (2425, 444) r 24 px.
- Stand-in fit (`src/stops/uranus/fit.json`): vfov 30, camera `[-0.097815, 0.125613, 5.680177]` identity rotation, sunDir `[-0.519344, 0.736074, 0.43414]`, rings inner 1.4118 outer 1.5395, ring normal `[-0.110925, 0.133303, 0.984848]`.
- Commands: `npm run compare -- --stop uranus --view hold|terrain --tier draft|final`, `npm run looks -- --push --folder uranus --note "..."`, `npm run measure -- --stop uranus`, `npm run sheet -- --segment uranus.hold`, `npm run crops`.
- Commit only `src/stops/uranus public/assets/uranus assets-src/uranus`. Trailer `Co-authored-by: Perplexity <noreply@perplexity.ai>`.

## What the approved images show

- Hero: pale cyan globe centre right, bands running lower left to upper right as parallels seen side on, bright hazy limb upper left with a warm thin outer fringe, white cloud flecks in the upper half, broad soft dark terminator across the lower right, hair-fine rings as near face-on ellipses round the globe (many concentric lines, brightest outer one), Miranda upper left, Ariel upper right, Milky Way diagonal behind the right side.
- Close: horizon runs upper left to lower right, bright cyan limb glow, dark blue depths lower left with white wispy streaks, ring arcs as a great arch overhead (hair-fine concentric lines, bright silver on the sun side), Sun as a white star with flare just above the horizon right of centre, Milky Way, stars.
- Inconsistency kept from the image: the stand-in fit takes the globe pole from the ring normal (sub camera latitude 81.6), but the bands run like parallels seen side on. Plan: fit the band axis from the hero's bands (pole toward upper left, about in the image plane), spin about that axis, keep the rings in their fitted near face-on plane. The image wins.

## Log

- 02:43 UTC Nov 21 2026: cloned, `npm ci`, build passes. Stand-in compares rendered at draft, first looks pushed 02:46 (a27c3d89 on `agent/uranus-looks`).
- Reading done: STOP-AGENT, AGENTS, kit 02 to 07, addenda, PROGRESS (look lock, tool record, budget, Phase 3 and 4 decisions), Mars set, planet, haze, moonbody, relief, cover, sky patches recipe.

## Hero analysis (03:05 UTC)

- Pixel to ray in the fitted hold frame: `((px-1408)/792*tan15, (792-py)/792*tan15, -1)`, camera `[-0.097815, 0.125613, 5.680177]`, globe radius 1 at origin. Helpers in `assets-src/uranus/geo.py`.
- Rings: the stand-in ring normal is wrong. Planet-centred circles in one plane fitted by sharpness of the unwrap: normal `[-0.1989, -0.6042, 0.7716]` (39.5 deg from the view axis, top of the rings nearer the camera, far side passes behind the lower-left limb). Strong lines at radius 1.314 (strongest), 1.347, 1.36, 1.538; inner bundle 1.30 to 1.36, outer line 1.54; lines wavy by about 0.03 R; visible mainly over the upper half, fading below. In-plane basis of the unwrap: e1 `[0.9498, -0.3127, 0]`, e2 `[0.2413, 0.7329, 0.6361]`. Ring normal is perpendicular to the sun direction.
- CORRECTION 03:20: the first "band axis" `[-0.5457, 0.8049, 0.2331]` was the light direction, not the bands. A high-pass of the hero (`out/work/u/hero-bands.png`) shows the bands concentric about a pole visible at the bottom-left of the disc, hero pixel (1251.6, 1319.9).
- Light direction, fitted (luma as a function of one direction): `sunDir = [-0.54361, 0.79538, 0.26806]`. The stand-in value `[-0.519344, 0.736074, 0.43414]` was 10 deg off.
- Band axis: visible pole `[-0.3735, -0.8084, 0.4549]`; map north (body Y) is the opposite, `[0.3735, 0.8084, -0.4549]`; body Z = camera direction made perpendicular to Y. Sub-camera latitude about -27, sub-solar latitude about +18.5. Quaternion is in `out/work/u/wrap/curve.json` (written by `wrap/stage_a.py`).
- Ring normal `[-0.1989, -0.6042, 0.7716]` is 24 deg from the band axis. Both kept, the image wins: globe spins about the band axis, rings fixed, moons orbit in the ring plane. n.sun about -0.166.
- Light curve now 513 knots over ndl -1..1 (scene-linear / 0.45): night about `[0.005-0.016, 0.07-0.10, 0.10-0.15]`, sharp terminator between ndl 0.0 and 0.125 (`[0.067, 0.30, 0.35]` at 0.125), 0.5 `[0.35, 1.11, 1.16]`, 1.0 `[1.43, 3.40, 3.60]`. With 33 knots a terminator ghost line stayed in the albedo; with 513 it is gone. Ship the curve as a float LUT.
- The older table below was measured with the wrong sun direction; kept for the record only.
- Light by ndl (median scene-linear rgb, view cosine over 0.45): -0.5 `[.006,.047,.067]`, -0.1 `[.002,.036,.051]`, 0.1 `[.003,.039,.049]`, 0.2 `[.023,.109,.125]`, 0.4 `[.085,.31,.34]`, 0.6 `[.17,.53,.53]`, 0.8 `[.35,.94,.91]`, 0.9 `[.58,1.25,1.25]`. Night side is a flat deep teal, not black; terminator between ndl 0.1 and 0.3.
- Limb (display luma by position angle, radius/R 0.9 .. 1.26): bright upper-left limb falls 236 to 153 to 98 to 57 across 0.995 .. 1.05; a halo out to 1.2 R on the lit side; night limb at 240 to 270 deg shows a faint rim (29 at 0.985, 13 outside). Warm thin outer fringe on the lit limb.
- Hero details: flecks with bluish shadows, faint rainbow lens smudge in the lower-left sky (keep in the sky patch), moons gibbous grey cratered lit from upper left.
- (Derived with the OLD sun direction, redo.) Terrain spot candidate from the close image (camera high over the night side near the terminator looking sunward, Sun about 3 deg above the apparent horizon, ring arch 14 to 24 deg above the horizon): globe point `(0.721, -0.233, 0.653)`, hold frame normalised spot about `(0.654, 0.619)`. Close image focal at vfov 60 is 1372 px. To be confirmed by a fit of the close image.

## Builder notes (03:05 UTC)

- Web set at most 35 MB on disk (not 40). Full stays 150 MB.
- Engine requests as early as known; batch integration moves every stop's hash. Prefer stop-local code.
- Travel before the hold (body grows from a point, FarPoint as in Mars) and after the rise must work without pops; judged in Phase 5.

## Design

- Globe: own shader. Wrap 8192 x 4096 in the band-axis frame from the 2x hero (albedo = hero / light curve), faded toward the limb, far side zonal fill plus transplanted structure, poles on polar projection. Bands in albedo, light curve smooth. Zonal differential drift by latitude, flecks as a separate RGBA layer with its own rate and a soft shadow offset away from the Sun. At hold mid all offsets are zero, so the composite equals the hero.
- Limb: measured halo (impact parameter by ndl) plus one veil across the disc edge on lit and night sides.
- Rings: own module shared by orbit and terrain. 1D radial profile texture sampled with footprint filtering (mips, energy kept), low-res polar modulation. Alpha blended, not counted.
- Moons: two spheres placed to match hero pixels, slow orbit.
- Sky patch for the hold: hero minus film on black sky, one generated planet-removed fill.

## Plan

1. Orbit view: own `UranusGlobe` shader (wrap from hero pixels on the seen side, painted elsewhere, light curve, haze layers, fleck layer with soft shadow, band drift), own `Rings` module (true 3D, analytic thin lines filtered by pixel footprint so they do not shimmer), two `MoonBody` moons, hero sky patch.
2. Terrain view: relief with flow from the close image, ring arcs from the same ring module, sky patch, cyan haze cover.
3. Dive and rise: patch levels at most 2x apart, predictor, cover.
4. Self checks, then READY.

## Wrap pipeline (03:25 UTC)

Scripts in `assets-src/uranus/wrap/`, work files in `out/work/u/wrap/`.
- `stage_a.py`: from `out/work/u/hero-2x.png` (2x upscale, 5632 x 3168): fleck separation on the red channel (median 201, inpaint), shadow mask, base image, 513-knot light curve, writes `curve.json` (knots, norm 0.45, white 3.0878, shadowTint `[1.655, 0.957, 0.841]`, sun, axis, quaternion), `base.npy`, `alpha.npy`, `shadow.npy`.
- `stage_b.py`: unprojects to 8192 x 4096 equirect (u = lon/360 + 0.5, north at top): albedo = base / L, view-cosine fade 0.2 to 0.42, cloud map, ndl map.
- `stage_c.py`: zonal profile per latitude (north of 44 reflected), detail tile from the lit region mirror-tiled for the unseen side, planar polar mapping blended at lat 68 to 80, far-side cloud copy. First result: mirror tiling shows as diamond repeats and the tile carries coloured speckle and blobby patches from the fleck inpaint. Next: replace the tile by synthesised streak detail with the hero's statistics, keep the zonal profile.

## State at 04:25 UTC (older; the section at the end is newer)

Orbit view is close to the hero; not yet reported to `/root`. Order from here: finish the sky patch and rings, moons check, limb crops at final, NOTES and RECIPE, remove stand-ins, merge main, commit binaries, push, message `/root`. Then terrain, dive and rise, self checks, READY.

Budget change: web set at most 35 MB. Engine batch 1 is merged (hash 434d0a5e367a62fd): sky patches may carry `weight?: (time, view) => number`; in shaders put costly conditional work in `for (int k = 0; k < (cond ? 1 : 0); k++) {}` and read textures inside with `textureGrad` or `textureLod`.

### Code in `src/stops/uranus/`
- `globe.ts` (own shader: wrap colour, cloud layer, light LUT by ndl, band drift), `halo.ts` (LUT by impact parameter 1.0..1.3 and ndl), `moons.ts`, `rings.ts`, `look.ts`, `set.ts`, `plan.ts`, `sky.json`, `fit.json`.
- `look.show = { rings, moons }` gates visibility for the black-sky renders the sky patch needs. Must be true/true when committing.
- Engine facts: `set.world.position = state.origin - camera`, `set.world.quaternion = state.rotation`, `gain = 1 / shot.post.exposure`. The engine adds a deterministic camera drift: at frame 4035 the film frame sits (-1.79, +2.19) px at 1920 scale from the hero. Not an error; compares must allow for it (`patch.drift` measures it by phase correlation).
- Sky patch value = inverseFilmic(texel) * gain * skyExposure; with skyExposure 0.6 the gain is 1.6667. `aim` is overwritten by the engine from the plan.

### Hold geometry (hero, 2816 x 1584)
- Globe circle cx 1460.3, cy 858.74, r 528.64. Globe quaternion `[-0.2313692, 0.0370392, -0.2055664, 0.9501783]`. sunDir `[-0.54361, 0.79538, 0.26806]`.
- Ring plane n0 `[-0.1989, -0.6042, 0.7716]`, basis e1 = z x n, e2 = n x e1.
- Miranda position `[-1.42237, 0.93171, 0.36292]` radius 0.05228; Ariel `[1.5367, 0.68432, 0.93198]` radius 0.03855.

### Assets and scripts
- Wrap: `wrap/stage_a..d.py` -> `wrap-color.jpg`, `wrap-cloud.png`; light LUT `light.bin`; halo `halo/halo.py` -> `halo.bin`.
- Moons: `moons/make.py` -> `{miranda,ariel}-color.jpg`, `-height.bin` (uint16, 1536 x 768 full, 768 x 384 web). The hero lights the moons from the left, 30 to 55 degrees off the globe's sun, so each moon has its own fitted light in `look.moons.bodies` (image wins). Miranda phase about 105 to 115 degrees, lit part warm cream and nearly saturated, dark side at sky level. Ariel phase 99.
- Rings: `rings/trace.py` (hero residual unwrapped in the n0 plane, oriented median removes stars, ridge tracking) then `rings/build.py` (tracks of 25 degrees or more get their own fitted plane and close into rings with a floor amplitude on the unseen side, shorter ones are open arcs; amplitudes above 0.3 are halved above the knee) -> `rings.bin` (81 rings, 13 closed, 12,779 samples). Plus 30 faint parametric hair lines in `rings.ts`. Shader: Gaussian line widened by the pixel footprint with energy kept (`sig = sqrt(sigma^2 + 0.11 fw^2)`), glint and forward-scatter terms normalised to the hold-mid camera, globe shadow, additive. Look: sigma 0.0009, gain 2.17.
- `rings/calib2.py` (per-cell gain from oriented-median peaks) is NOT trusted: the hero measure is biased by stars and the Milky Way. Judge rings by review-tier crops beside the hero (`out/work/u/cmp-*.jpg`).
- Sky patch: `sky/patch.py hold HERO FILL GLOW OUTDIR`. GLOW is a review still at 4035 with `show` false/false and a black `sky-hold.webp` in place (engine sky replaced by black), saved as `out/work/u/sky/glow.png`. Hero is deblocked, film glow shifted by the measured drift and subtracted, thin ring lines are removed from the hero by an oriented median along the ring direction (unwrap 2700 x 1520, 21 columns, 17 shears) followed by an opening across radius, moons are replaced by the fill, the area behind the globe and next to the limb comes from the generated fill plus the hero's stars. First version that replaced the whole ring band by the low-passed fill made the sky there blurry: do not do that.
- Fill: `out/work/u/sky/sky-fill-take1.png`, take 1 of 6, model `gpt_image_2_6_flare`, 16:9, reference the hero; prompt is in RECIPE.md.

### Findings
- Film line FWHM is about 1.5 times the hero's at 1920 (raster limit); narrower sigma helps a little.
- The hero's top glint streak (ring 2) has scene peak 0.9 to 1.9; with a wide line it looks fat, hence the knee.
- Limb on the night side at review tier showed a dotted bright edge when brightened 3x: check at final.

## State at 04:50 UTC (read this first after a compaction)

Still on the orbit view. Not yet reported to `/root`. Engine batch 2 is merged (main 9f78a4e, hash 05c29d3a1588e95f, merge commit 6d9a4ae); frame 4035 at review was byte identical before and after. `terrain.rollDeg` exists now as an optional move parameter.

### Globe is an ellipsoid (04:35)
- The hero's disc outline is not a circle. Ellipse fit of the edge: centre (1458.86, 860.13), semi-axes 519.81 (0.9833 R) along -2.75 deg and 530.77 (1.00403 R), rms 0.91 px. A sphere left a 1.5 px mismatch round the limb that showed as a bright or dark edge line.
- `look.shape = { axis [0.99885, -0.04789, 0], polar 0.9833, equator 1.00403, center [-0.00273, -0.00263, 0] }`, mirrored in `geo.py` (`geo.globe(d)`, `geo.graze(d)`, `geo.surface(u)`). In `set.ts` a `shape` group (rotate X to axis, scale, offset) holds an `upright` group (inverse rotation) that holds the globe and halo. Shaders take the camera in local space (`vCamL`), so the limb math is that of a unit sphere.
- Film outline after the change: centre (1459.78, 861.00), semi 520.65 / 531.18, -2.51 deg (the offset is the camera drift).

### Light
- `light.bin` 513 (ndl) x 128 (mu) x 4 float. `stage_a2.py` fits a model for mu over 0.05. `stage_e.py` replaces the rows mu under 0.2 by direct medians of hero / film albedo, because the model extrapolated to a dotted bright edge at mu under 0.03.
- `shade.bin` 512 x 256 x 4 float (04:50): a world-fixed light map. `stage_c.py` takes the low-pass (sigma 2.5 deg, normalised by weight, fading to 1 outside the seen side) of albedo / zonal fill, divides the albedo by it and ships it. The globe shader multiplies the light by it at the unspun direction, so the hero's broad light and night-side structure stays put while the fine albedo and the clouds turn. Reason: with the night albedo kept at only 20 percent the film's night side was flatter than the hero's.
- Halo: `halo.bin` 64 x 64 over b 1.0..1.3 (sqrt rows) by ndl; percentile 50 for b under 1.04, 35 beyond.

### Checks (use these, do not guess)
- `python3 assets-src/uranus/check/crops.py FILM OUTDIR [names]`: hero beside film at native size, boxes ul, top, right, ll, lr, limb-ul, limb-night, limb-night3, disc, miranda, ariel.
- `python3 assets-src/uranus/check/limb.py FILM angles...`: radial profiles across the limb, hero | film, scene linear.
- `python3 assets-src/uranus/check/outline.py IMAGE [shift]`: ellipse fit of the disc edge.

### Sky patch rebuild (needed after every change of halo or globe edge)
1. Copy the real `full/sky-hold.webp` to `out/work/u/sky/real/`, put an all-black one in its place, `look.show` false/false, build, `npm run still -- --frame 4035 --tier review --out out/work/u/sky/glow.png`, restore.
2. Delete `out/work/u/sky/along.npz`, then `python3 assets-src/uranus/sky/patch.py hold references/approved/uranus-hero.png out/work/u/sky/sky-fill-take1.png out/work/u/sky/glow.png public/assets/uranus` (about 10 min, detached).

### Order from here
Orbit: check shade map in the frame, rebuild sky patch, compare at final, RECIPE, remove stand-ins, commit binaries, push, message `/root`. Then terrain (fit `uranus-close.jpg`), dive and rise, self checks, READY.

## State at 05:30 UTC (read this first after a compaction)

Orbit milestone was sent to `/root` at 05:05 with commit 2fd342b (binaries committed, stand-ins removed). Now on the terrain view. Priority from `/root`: motion first (sharp dive handover, clear forward movement and depth across the whole terrain segment); limb and sky fits of a few pixels wait for the rounds.

### Mail since 04:50
- Batch 3 (main 3523b45) merged: `skyAim` in plan, `npm run -s aim -- --stop uranus`. The sky behind the rise belongs to the next stop: paint nothing against it.
- Batch 4 (main 2d2161b, merge it at the next commit): Saturn has no cover, so Saturn and Uranus share one sky and Saturn's aim decides it. `skyAim.orbit` in my plan has no effect. The rim of the hold sky patch gets fitted LAST, when `/root` says Saturn's exit and travel are final (merge main, read the aim, fit the rim). Until then keep the rim wide and soft. `skyAim.terrain` still works.
- Before READY: `npm run -s gate -- --phase 4 --only G11` (every file under `public/assets/uranus/` named in a RECIPE.md, by full path or as `public/assets/uranus/<set>/NAME`), and `npm run -s gate -- --phase 4 --only G12,G15 --g15-stops mars,uranus`; put the three results in the READY message.

### Terrain view: true 3D haze deck
- Fit of the close image (`terrain/fit.py`, `terrain/fit.json`): the terrain-local frame IS the close image's camera frame (camera at the origin, identity, vfov 60, unit = camera height). Nadir `[-0.23637, -0.94616, -0.22116]`, horizon angular radius 80.0945 deg (rms 1.9 px), sphere radius 66.08 units, altitude 0.0151327 R, Sun at px (1998, 758) of 2816 x 1584, direction `[0.395, 0.02276, -0.9184]`, 4.85 deg above the limb.
- Plan: `terrain { horizonDeg 2.874, dipDeg 9.9055, rollDeg 14.03 }` puts the engine's nadir on the fitted one. `spot { x 0.5574, y 0.6721 }` and `dive.headingDeg 53.784` make the world Sun fall on the image's Sun at frame 4290 (the spot is on the hero's terminator; `out/work/u/t/solve.ts` lists the one-parameter family, this is the member deepest inside the disc). `dive.swoop true`, `dive.altitude 0.02623` = 0.0151327 x (1 + entryHeight x g), g 0.6431 at the cover centre (frame 4164); `terrain/predict.ts` prints these. The globe spin of -1 deg/s turns the Sun against the deck: 2.2 deg above the limb at frame 4200, 7.4 deg at 4379.
- `terrain/tgeo.py` (geometry), `terrain/build.py [2x image]` (light table L(mu, psi), halo table, `deck-color.jpg`, `deck-far.jpg` log-polar albedo, `deck-height.bin`, `src/stops/uranus/deck.json`), `src/stops/uranus/deck.ts` (log-polar mesh displaced along the image ray by cloud height, colour = mix(far albedo, image / L(image view)) x L(current view), shear flow, halo sphere).
- First render 05:25: the judged frame reproduces the image; forward 1.2 gives strong motion; but at frame 4200 the image footprint is a trapezoid in the middle and the synthesized surround is far too bright and smooth, with a hard edge. Decision: paint a wider plate of the close image (same camera, wider field, original pixels in the middle) with the image model, fit the light table on the plate, keep the synthesized map only beyond the plate.
- Still to do in the terrain view: plate, rings (second `Rings` instance fitted to the close image's arch, in terrain-local space), terrain sky patch and `skyAim.terrain`, cover, G13 check.

## State at 06:10 UTC (read this first after a compaction)

Terrain view is built and matches the close image at frame 4290. Next: terrain sheet review, G13 texels, terrain milestone message, then dive and rise (cover, patches on the globe), self checks, gates G11, G12, G15, READY. Looks pushed 06:03 (push at least every 30 minutes).

### Plan now
- `terrain { vfov 60, forward 2.0, rise 0.43, side 0.15, yawDeg 1.5, pitchDeg -0.5, entryHeight 1.14, entryBack 1.26, entryPitchDeg 6, exitHeight 2.4, exitForward 1.3, exitPitchDeg 10, horizonDeg 2.874, dipDeg 9.9055, rollDeg 14.03 }`. Forward was 1.2: too gentle on the sheet. Level flight needs `side x 0.2364 + rise x 0.9462 - forward x 0.2212 = 0`.
- `skyAim.terrain` pinned at `[22.60603, 20.42393, -46.69144]` (the value `aim` printed, 47 deg off the band, a dark sky).
- `npx tsx assets-src/uranus/terrain/predict.ts`: dive cover centre frame 4164, g 0.6431, cover frames about 4157 to 4171.

### Deck
- `terrain/tgeo.py`: wide plate window `WIDE = (-1.8 TX, -2.6 TY, 1.8 TX, 1.0 TY)`, `rays_wide`, `project_wide`, full circle (`PSI_MAX = pi`; a hole showed behind the pole before), light table 384 x 256, halo 384 x 128.
- `terrain/plate.py`: outpaint take 3 (seedream_5) tone matched, limb warped onto the fitted horizon, original pixels in the centre, dark areas one fixed teal chroma `[0.103, 1, 1.590]` with floor 0.012 (noise in near-black had turned into pink and cyan mottle through the albedo division).
- `terrain/build.py`: albedo `(img + 0.005) / (L + 0.005)` (eps in `deck.json`), halo = thin limb glow only (the old table had baked the image's sky veil into the deck's glow), `deck-far.jpg` 360 degrees log-polar.
- `deck.ts`: `uWin`, `uEps`, far map with `textureGrad` and seam-safe gradients. `look.deck = { flow [0, 0.01, 0.9, 0.4], limb [0.02, 0.06], edge 0.05, lift 1 }`. `look.show.deck` gates the deck for the sky render.

### Ring arcs
- `terrain/ringfit.py`: centre `[-8.5202, -28.6297, -52.036]`, normal `[-0.16339, -0.30177, 0.93928]`, radius 49.934 (terrain units), rms 1.26 px. `terrain/rings.py`: 36 lines, 21,503 samples, scale 33.289.
- `look.deckRings`: sigma 0.0004, gain 1.6, glint `[0.6, 24]`. `check/arcs.py STILL`: energy film / image 1.11 (sixths 1.28, 1.18, 0.74, 0.83, 0.93, 0.89), width 3 rows in both. History: sigma 0.0008 gain 3 gave 2.25x; sigma 0.0004 gain 2.7 with the first sky patch gave 1.80x.
- In `set.ts` the arcs sit in the terrain group and turn with the sky (`skyTurn`), so they get real parallax from the camera move.

### Terrain sky patch
- `sky/terrain.sh` then `sky/terrain.py` (see RECIPE). In line regions the whole thin part across radius is removed (the first version left dark dotted specks along the bright arcs). The soft ring band stays in the patch. `sky.json` terrain: vfov 60, margin 0.125, gain 1.6667.
- Rebuild the patch after any change of the deck halo, the Sun settings or the terrain camera at 4290.

### Known weak points of the terrain view
- Limb glow above the horizon on the left is thinner and sharper than in the image (limb refinements wait for the rounds).
- The soft ring band is in the sky patch, the lines are 3D: they shift against each other by up to about 27 px over the segment.
- Dark foreground has little streak detail; cloud height 0.07 gives modest parallax.

## State at 06:40 UTC (read this first after a compaction)

Terrain milestone was sent 06:18 (commit ad8fe46). Now on dive and rise. Looks pushed 06:25.

### Mail since 06:10
- Batch 5 is on main (9d33905): merge it at the next commit. Optional `gradTexel` in `src/core/texel.ts`; the world pin (my `light.sunDir`, travel values and exit poses are mine to set); G11 is now only about my own folder.
- Preflight by `/root` at c4d49f1: build and tests green, G12 PASS, G15 PASS (web 178 MB, full 689 MB), G11 failed on the file list. Fixed 06:33: RECIPE.md has a "Files" list, one line per file as `public/assets/uranus/<set>/NAME`; `npm run -s gate -- --phase 4 --only G11` passes here. Keep the list current when files are added.
- READY needs: build and tests green on main merged, G11, G12, G15 results in the message, stand-ins removed, looks pushed.

### Dive patches (built)
- `dive/spot.ts` writes `dive/spot.json` (spot in the wrap frame `[0.302697, -0.613113, 0.729703]`, lat -37.815, lon 22.53, unit 0.0151344 R). The spot turns with the globe (`plan.turn`), so it is fixed in the wrap frame as long as the band drift is zero at its latitude: `look.globe.bandRate[3] = 1.584` does that (`sin(2.4 lat + 1.584) = 0` at lat -0.66).
- `dive/patches.py` (take 3 kept, see RECIPE): four gnomonic levels 76, 42, 22, 11 deg, 4096 px full, 2048 web, table `src/stops/uranus/patches.json` (feather 0.12, fade 1.02 to 1.5 parent texels per pixel).
- `globe.ts`: patch block as Mars (`uPatch0..3`, weights by parent density, inside a `for` guarded by `dn > 0.3 && texels < fade.y`), diag texels from the active level.
- Tools: `npx tsx assets-src/uranus/dive/predict.ts dive|rise` (zoom needed over the wrap), `npx tsx assets-src/uranus/dive/softfit.ts dive|rise '{"rise":{...}}'` (soft fraction per frame with the patch table, end pose framing, Sun, ring normal and band axis in view; overrides of the plan as JSON).
- Measured at draft with the texels view, frames 4129, 4137, 4146, 4154: soft 0.
- Seen: take 1 read as brushed fabric, take 2 as short curled strokes. The patch area shows more fine structure than the wrap around it, so the detail must stay low in contrast.

### Rise
- First sheet (no `level`): after the cover the limb stood vertical at the left edge (horizon not carried), soft globe, the globe left the frame at 4434 and came back. With the wrap alone the rise needed 2x out to 52 deg from the spot, more than patch 1 covers.
- Now `rise { ..., ahead 0.03, hug 1.7, settle 5, level true, pan 0.3 }` as Mars: softfit predicts soft 0 on every frame outside the cover (window 4402 to 4417), altitude 0.52 R at 4418, 5.4 R at the judged 4436, end pose globe centre ndc (0.305, -0.074), radius 0.28 of the frame height, phase 42 deg.

### Cover
- Scene values measured at draft: orbit 4150 sky `[0.004, 0.011, 0.013]`, under the limb `[0.004, 0.04, 0.053]`; terrain 4175 sky `[0.006, 0.012, 0.018]`, under the limb `[0.08, 0.31, 0.42]`, middle `[0.02, 0.09, 0.13]`, low `[0.002, 0.014, 0.022]`.
- Plan: `cover [0.14, 0.38, 0.45]`, `coverLow [0.02, 0.1, 0.14]`, `coverTerrain [0.16, 0.5, 0.62]`, `coverLowTerrain [0.012, 0.06, 0.09]`, `coverTop [0.12, 0.06]`, `coverEdge [0.2, 0.45]`, `coverEdgeRise [0.4, 0.45]`, `coverShell [1.04, 1.14]`, `coverRush` as Mars. First sheets with these are rendering.

### Still to check in the rise
- Miranda read as a flat white disc in the first rise sheet (its own fitted light saturates from this side).
- The wrap albedo has pink rings round the south pole (seen in `out/work/u/dive/patch-1-v.jpg`, bottom): check whether the rise shows them lit.
- Cloud flecks inside the patch area are soft (the cloud layer is 8192 wide): idea, modulate cloud alpha by the patch detail (`patch / wrap - 1`).

## State at 06:55 UTC (read this first after a compaction)

Commits pushed: 46cef58 (patches in the shader, cover, level rise), 25e04aa (merge of main with batches 5 and 6), cd3a263 (patch binaries). Looks pushed 06:50.

### Mail since 06:40
- Batch 6 is on main (45d1651): travel cameras, dust, sky lock for far bodies, the ending. Do not edit `src/space/travel` or `film.ts`. `npx tsx assets-src/travel/probe.ts` prints turn rate and speed per travel: the rise must reach its last frame at the speed and turn rate the travel starts with, the hold must begin where the travel ends.
- Probe at cd3a263: `uranus.travel` join in (4455) turn 0.002 to 0.001 deg/frame (step 0.003, neighbours 0.069), speed 7.96e-2 to 8.00e-2; `saturn.travel` join out (3960) turn 0.042 to 0.042 (step 0.000), speed 1.27e-1 to 1.25e-1. Same order as the Mars rows (join in step 0.001, neighbours 0.030). Peak turn in my travel 4.40 deg/frame at 4476 (Mars 3.69, Mercury 3.93): highest of all stops, it follows from my rise end pose.

### Since 06:40
- Cover colours raised about 40 percent (first values read as dark teal mist): `cover [0.2, 0.5, 0.58]`, `coverLow [0.035, 0.15, 0.2]`, `coverTerrain [0.2, 0.58, 0.7]`, `coverLowTerrain [0.02, 0.09, 0.13]`.
- `look.globe.cloudFine 4`: cloud alpha times `1 + cloudFine x (patch / wrap - 1)`, exactly 1 where no patch is active.
- Review stills 4137, 4152, 4420, 4436 seen (`out/work/u/dive/v-sheet.jpg`): patch area reads as fine streaked haze, no seam; the rise end frame holds the globe right of centre with vertical bands, flecks and thin rings; no pink bands visible; Miranda and Ariel are white discs from this side; rings faint; at review the limb shows 1 px steps (check at final).
- Disk: full 42 MB, web 18 MB.

## State at 07:25 UTC (read this first after a compaction)

Saturn's exit is final (mail 06:55, agent/saturn 16a4b5f: rise az -14, el 6, distance 6.6, offset [-0.28, -0.12], roll 0; travel turnDeg 88, side -1, turnEnd 0.5). The hold sky patch rim is fitted to the shared sky. Still owed: dive and rise milestone message, self checks, gates, READY. Looks pushed 07:18.

### Shared sky and the rim fit
- Main does not carry Saturn's final plan yet. The shared aim was read on a throwaway worktree (`/tmp/fit`, HEAD plus `src/stops/saturn` of agent/saturn 16a4b5f): `npm run -s aim -- --stop uranus` printed `orbit [145.41987, -22.38676, 20.05787]`. `plan.ts` pins `skyAim.orbit` to that, so my branch shows the sky main will show once Saturn is merged (then the pin is ignored and `aim` should print the same).
- The one sky there: grey pink band at the top and right of the frame. The hero's warm band runs through the planet at about 31 degrees. They cannot be aimed onto each other (one free angle only), so the patch carries the hero's sky over into the one sky across a wide margin.
- `sky.json` orbit margin 0.375, patch 4928 x 2772 full, 2464 x 1386 web. `patch.py`: `widen()` carries the hero's broad sky along the band, crosses to the smooth one sky (`out/work/u/sky2/one-wide375.png`: frame 4035 at final with `look.show` rings, moons, globe, sky false and `vfovDeg 50.244803` in `fit.json` for that render only) between the frame edge and 0.6 of the margin; fine detail from a copy shifted 700 px along the band, fading between 0.3 and 0.85. `rim ONE OUT` rebuilds only the margin (40 s), `hold ...` rebuilds all.
- Checked at review: 3948 (Saturn travel), 3960, 4109, 4118 show no rim; 4035 unchanged within 3 levels.
- `look.show` has `globe` and `sky` flags now (all true at commit).

### Ring zone of the hold patch
- The hero's ring residue (broad faint ring bands, dark grooves where lines were removed) stays in the patch. The camera orbits 6 degrees in the hold, so the residue slides about 108 px to each side against the true 3D rings: at 3960 and 4109 a faint second set of arcs shows left or right of the rings (`out/work/u/sky2/c-ringzone.jpg`, right half).
- Variant tried: ring zone (ring plane radius under 1.9 to 2.02) from the generated fill, `min(f, low(f)) + hero stars` (`RING_FILL 1`). No residue, but blobby soft stars and a blurrier band there, and the faint haze of the rings is lost at the judged frame. Not kept (`RING_FILL 0`); backups of both in `out/work/u/sky2/`.
- Better idea, to do while the critics are out: in the unwrap of the ring plane take the band part too (opening across radius far wider than `THIN`, then a long median along the ring so nebula clouds stay), subtract it from the hero, floor at the envelope, and give the faint haze to the 3D rings.

### G13 and the far deck map (07:30)
- `npm run measure -- --stop uranus --only G13 --every 5` at 8a67180: dive and rise pass, terrain frames 4221, 4226, 4231, 4236 failed (worst 3.96 percent soft at 4231). The soft texels were the lower left corner, outside the plate window, where the log-polar far map (4096 x 2048) fell under one texel per pixel.
- Fix: `terrain/build.py` designs the far map at 4096 x 2048 as before (`FAR_BASE`) and writes it at 8192 x 4096 (web 4096 x 2048) with the plate sampled again and the streak octaves continued to 0.003 (`FAR_FINE`). Every other deck file came out byte identical. Frame 4231: soft 0, beauty differs by at most 2 levels.
- Band removal for the ring residue (`band()` in `sky/patch.py`, long median along the ring of the part that is narrow across radius) removed almost nothing: the hero's rings are not in one plane, so over 40 degrees they leave their row. It is switched off (`BAND[0] = 0`). Next try: cache the unwrap of `along()` and take a wider opening across radius on the sheared short median.
- Seen in the unwrap (`out/work/u/sky/along-polar.npy`, written by `along()`; preview `out/work/u/sky3/polar.jpg`): the hero's rings wander by up to 200 rows of 1520 (S curves, slopes to 0.7 rows per column), lines and faint bands together. So no fixed row filter can take the bands. Plan for after READY: straighten the unwrap with the ridge tracks of `rings/trace.py` (each track onto its mean row, offsets interpolated across radius), take the long median along the ring of the radial high-pass there (signed, so bands and grooves both go), map it back and subtract it from the hero's sky. Then the faint ring haze belongs in the 3D rings.

## State at 07:50 UTC (read this first after a compaction)

Branch head 11884d7 (main 558e3a5 merged, engine batch 7: dust only). Dive and rise milestone sent 07:25 (8a67180). `/root` at 07:40: do not hold READY back for polish, the rounds name what matters.

### Measured at 11884d7 (assets as committed in 9b0d054)
- `npm run measure -- --stop uranus` (every frame, 626 s): G13 PASS, 0 of 463 frames over 0.02 soft, worst 4393 0.57 percent; G5 PASS (hold coverage 0.196, dive 0.812, terrain 0.519, rise 0.159, invalid 0); G17 PASS (4035 median 1.178, p25 1.046 over 70 tiles; 4290 median 1.035, p25 0.775 over 59 tiles).
- `npm run budget -- --stop uranus`: full 1208 MB one set (1277 with Neptune's stand-in), web 308 MB (332). Disk: full 47 MB, web 19 MB.
- Gates: G11 PASS, G12 PASS (1108 tracked files, 0.86 GB), G15 PASS (uranus/web 308 MB, uranus/full 1208 MB). Build green, 35 tests pass.

### After READY, in this order (while the critics are out)
1. Sheets at review for hold, dive, terrain, rise; `npm run crops`; read R1, R3, R4 against them.
2. Ring residue in the hold sky patch (straighten the unwrap with the traced tracks, see above).
3. Moons: soft knee so they do not read as white discs from the rise side (the hold must not change).
4. Cover clearing frame 4167 (patchy at the top for one frame).

## State at 08:35 UTC (read this first after a compaction)

READY sent at b87454f (07:51). Round 6 is running from the branch head; the scorecard path arrives when it closes. `/root`: keep working the weak points, worst first; push only finished, green steps.

### Merge of main 48a2bfc (7517b04)
- Engine batches 8 and 9 (terrain shield, trim of discarded haze shell triangles) and all eight stop folders. `npm run -s aim -- --stop uranus` prints orbit `[145.41987, -22.38676, 20.05787]` with Saturn on main (the pin in `plan.ts` is ignored and matches).
- Review frames before and after: 4035 max 17 levels on one pixel (else 1), 4137 max 3, 4290 max 1, 4436 only the sky changed (Neptune's now). No opt out of shield or trim needed.

### Moons (weak point 2, done)
- `moons.ts`: `mu = dot(n, v)`, `back = 1 - max(dot(v, sun), 0)`, `lit = mix(mu0, mu0 / (mu0 + mu + 0.08), seeliger x back) x (1 + rim.x x back x pow(1 - mu, rim.y))`, then a soft knee on luma (`look.moons.knee [0.6, 1.6]`).
- `look.moons`: miranda `sun [1.8, 1.67, 1.53]`, `rim [3.8, 2]`, `seeliger 0.6` (was `[6.2, 5.4, 4.5]`, Lambert, clipped); ariel `sun [1.43, 1.33, 1.3]`, `rim [0, 2]`, `seeliger 0` (a rim on Ariel gave a jagged bright outline at its size).
- `python3 assets-src/uranus/check/moons.py STILL` prints lit pixels, mean, p25, p50, p75, p90, p99 and tint for hero and film. At 4035 review: Miranda film 0.710, 0.565, 0.731, 0.854, 0.924 (mean, p25, p50, p75, p90) against hero 0.693, 0.537, 0.71, 0.862, 0.926 (before: mean 0.797, p50 0.866). Ariel film 0.637, 0.521, 0.66, 0.741, 0.813 against hero 0.629, 0.495, 0.638, 0.768, 0.825.
- Rise 4436: Miranda is a shaded grey white sphere, no clipped disc (`out/work/u/r1/m6-rise-moons.jpg`).

### Ring residue in the hold sky patch (weak point 1, not solved, shipped patch unchanged)
- The shipped `sky-hold.webp` is still the rim only patch of READY. `sky/patch.py` and `RECIPE.md` in the working tree hold experiment g and are not committed (diff saved in `out/work/u/sky3/patch-g.diff`).
- e: openings across radius of 25, 300 and 700 rows plus groove fill. Rings gone, but the Milky Way inside the ring zone right of the globe goes flat against the hero (`out/work/u/r1/c/cmp-right.jpg`). Rejected.
- f: mask by share of sky. g: median along the ring over 40 degrees at quarter scale, neutral colour min. Both keep the Milky Way, both let faint arcs back in.
- Ring levels measured: ring haze 0.003 to 0.02 scene units over sky 0.02; Milky Way core right of the globe 0.07 to 0.12. The two overlap in level, so only the shape along the ring separates them.
- Straightening fit (`out/work/u/sky3/straight.py`, tracks in `out/work/u/rings2/tracks.json`, `r` there is in rows of 0.0005 R): Fourier model of the ring wander against angle and radius; rms 17.5 rows before, 14.3 (K 1), 10.5 (K 2), 9.4 (K 4), 9.2 (K 6). A global model leaves about 9 rows, too coarse for lines 2 to 4 rows wide: straighten per track instead (offset field interpolated between neighbouring tracks) or drop it.

### Sheets seen at review (08:00)
- Hold steady; terrain shows parallax of the deck against the ring arcs; dive 4142 ring ribbon fine; 4167 cover clearing patchy and blocky at the top for one frame; rise rings faint.
- A faint curved line on the deck at lower left and right at 4175 and 4200: to inspect (plate or far map edge).

## State at 09:10 UTC (read this first after a compaction)

Round 6 renders from b87454f (mail 08:57); everything pushed later is judged in round 7. Scorecard expected 10:00 to 10:30.

### Ring bands of the hold sky: veil (weak point 1, shipped)
- Idea: the hero's faint ring bands cannot stay in the sky patch (they slide against the 3D rings when the camera orbits) and cannot simply be removed (the judged frame loses them). They are taken out of the patch and drawn again on the ring plane, so patch plus veil at 4035 is the shipped picture by construction and the bands move with the rings.
- `sky/patch.py`: `grid()`, `unwrap()`, `coherent()` (median along the ring over 120 of 2700 columns, 17 shears), `cast()`. The veil code is sqrt encoded, `VEIL_MAX 0.04` scene units, limited to the room under the sky (7 px minimum filter), shifted by the drift of the camera fit (-1.79, 2.18 px at 1920), subtracted from the patch. Grooves of removed lines are filled only in dark sky (`GROOVE (0.004, 0.012)`). Writes `veil.webp` (2700 x 1520 full, 1350 x 760 web) beside `sky-hold.webp`.
- `src/stops/uranus/veil.ts`: annulus of 96 segments in the plane of `look.veil.normal`, radius 1.08 to 1.84, additive, alpha 0, `textureGrad` with analytic gradients in angle and radius, same lens falloff as the sky. `set.ts` gives it the weight the engine gives the patch (`smoothstep(u, 0.2, 0.8)` in the travel of the stop before, 1 in hold and dive, else 0) times `shot.skyGlow`.
- Measured at review against the shipped stills (`out/work/u/sky2/r-4035.png`): mean difference 0.05 levels, abs mean 0.12 levels, 0.87 percent of pixels over 3 levels, 0.17 percent over 8 (that includes the refitted moons). Final compare of the hold looks like before. Veil max 0.0276, mean in the zone 0.0018.
- Patch alone, x4 crops: `out/work/u/sky4/top-before-veil.jpg`, `left-before-veil.jpg` (bands gone, grooves mostly filled). 3960 and 4109 side by side: `out/work/u/r2/c3-*.jpg`. Dive 4120, 4137, 4150 and arrival 3948: no blotch, no pop (`out/work/u/r2/v3-dive4.jpg`).
- Disk: full 49 MB, web 20 MB.
- Tried before the veil and dropped: flow straightening of the unwrap (`out/work/u/sky3/flow.py`): the traced tracks cross, flow error 7.8 rows after 40 columns on the 89 longest smooth tracks, global Fourier model 9 rows rms. Groove fill alone made bright seams.
- Finding: the m-series stills of the moon fit (`out/work/u/r1/m*.png`) and the hold compare pushed to looks at 08:33 were rendered with experiment patch g in `public/`, not the shipped patch. The moon numbers are unaffected, the committed assets at e4e07fd were the shipped patch. The 09:05 compare is patch plus veil.

### Next
1. Rings faint in the rise (back-scatter term).
2. Cover clearing 4167 patchy and blocky at the top.
3. Faint curved line on the deck at 4175 and 4200.
4. `npm run crops`, read R1, R3, R4.

## State at 09:55 UTC (rise rings, motion smear, round 1 scorecard arrived)

- Rings, orbit view (`rings.ts`, `set.ts`, `look.ts`):
  - `flat`: every ring line point is projected along the ray from the hold camera onto the common ring plane (`fit.rings.normal`). The hold frame 4035 stays the same picture (max 1 level on 0.008 percent of pixels against the render before), and the lines are coplanar with the veil. Reason: the lines in `rings.bin` each had their own normal, tilted 2 to 10 degrees, which showed as a tangle from the rise side.
  - `evenLines` and a second mesh `farRings`: in the rise and the own travel all lines sit in the common plane with radius `mean + even * (r - mean)`, `look.rings.even 0.1`. The swap happens under the terrain interlude. The hold and dive keep the hero's wavy lines.
  - Back-scatter: `look.rings.back [3, 2]`, gain normalised to the hold camera, so the hold is unchanged and the rings read from the far side.
  - Motion smear: the film takes 4 or 16 time samples per frame at review (16 or 64 at final). A line thinner than its travel per sample strobes into a comb (ring line, 4410 to 4420, about 120 px per frame). The set holds its own `FilmDirector`, asks it for the pose one sample later, and passes the camera space delta to the ring shader, which widens the line's gaussian along the screen motion (`look.rings.smear 0.55`, reach 0.4 of the half width). Only in fast kinds (dive, rise, travel), so the hold is bit exact. Checked at review 4415, 4142, 4460 and final 4415 (116 s, no cost).
  - Moons are hidden in the first 1.4 s of the rise (`look.moons.riseFrom`): Miranda's back lit crescent strobed into a dotted line while it crossed the frame at 4412 to 4420. They enter from the frame edge after 4428.
- Round 1 scorecard (round 6 of the film, `scorecards/round-006/` on main): R1 7, R3 5, R4 4, R2 and R8 pass, measures green. 2 severe, 13 major. Worst first:
  1. Dive cover 4150 to 4175: the two sides are not one move (pose, roll, horizon angle, Sun, rings, colour, exposure, speed).
  2. Rise cover 4405 to 4416: same, and the Milky Way pops on at 4416.
  3. The cover itself 4159 to 4170: stands still, upright bands at 4166 to 4168, dust lane pops at 4170.
  4. Terrain picture edge in frame 4175 to 4216, lower centre right.
  5. Stepped copies in fast motion: puffs and ring edges 4126 to 4134, 4420 to 4427.
  6. R1: ring strands and dust softer than approved (hold), ring lanes and limb softer (terrain).
  7. R3: dive 4137 cloud detail smeared, moon with hard dark edge, rise 4436 terminator as a hard crescent, bands airbrushed, storms pasted, rings wobbly (fixed above), terrain near field smeared, dark corner banding.
  8. Minor: mirrored stars at the terrain sky margins (top 15 px, right 20 px), one pixel stars flicker, inner ring beading in the hold, squashed moon, flat white moon, even outer arc, ring strands ending at the haze.

## State at 10:05 UTC (read this first after a compaction)

Round 1 result is in (list above). Two rounds remain. Branch head pushed: bd3fef5, local merge 71fea95 (main 811fbca, engine batch 10: `terrain.exitDipDeg`).

### Correction to the 09:55 section
- Mail 09:52: stepped ghost copies in the fastest dive and rise frames are an engine matter (time samples that follow the screen motion). No blur tricks, extra sprites or slower moves in the stop folder. So the motion smear (`look.rings.smear`), the set's own `FilmDirector` copy and the moon hiding (`look.moons.riseFrom`) are removed again. Kept: `flat`, `evenLines` and `farRings` (`look.rings.even 0.1`), back-scatter `look.rings.back [3, 2]`.
- After the removal: build green, 48 tests pass, 4035 at review equals the render before (max 1 level on 0.008 percent).
- Item 5 finding for the READY message: globe, flecks, rings and moons all take `state.time` of the time sample (`globe.update(sun, plan.spin(state.time), elapsed, ...)`), no coarser clock. The copies come from the sample count, not from my layers.

### Cover analysis (items 1 and 2), measured with `out/work/u/dbg/track.ts` and `sunlimb.ts`
- Horizon angle on screen is continuous at the swap (orbit 4162 -13.8 deg, terrain 4164 -14.3) but only -2.6 at 4150: the roll arrives too late.
- Sun jumps: orbit 4162 at (1381, 363), 9.77 deg above the limb; terrain 4164 at (1293, 508), 3.17 deg. Aim above limb -6.68 against -4.28. Rise: 4408 terrain 14.08 deg, 4410 orbit 18.72.
- Cause: the deck sphere's up `[0.2364, 0.9462, 0.2212]` is 18.9 deg from terrain local Y, the engine's `terrainFrame` maps local Y to the spot normal, and `swoop` only lines the horizon up on screen.
- Speeds: orbit 4150 20.3 mR per frame and 4.94 deg per frame, 4162 4.0 and 1.0, terrain 4166 2.17 and 0.46, 4200 0.36.
- The engine sky exposure is times `(1 - cover.amount)^2` in `film.ts`: reads as the Milky Way pop at 4169 to 4170 and 4415 to 4416.
- Terrain mapping: unit 0.0151344 R per terrain unit, deck centre `[-15.8563, -63.4702, -14.8357]`, radius 66.0819 units (1.0001 R). Deck ring arcs: circle radius 49.934 units, centre `[-8.5202, -28.6297, -52.036]`, mesh scale 33.289.

### Plan, worst first
1. `plan.ts`: own subclass of `StopPlan` so the orbit pose at each cover centre equals the world mapped terrain pose (position, look, roll, velocity), roll and pitch arriving before 4150. Longer cover thinning.
2. Deck (and haze, arcs) drawn in the orbit view under the same mapping, cross-faded with the globe by altitude before the dive cover and after the rise cover.
3. Sun on both sides alike.
4. Cover rush: faster veil, finer billow, lower contrast.
5. Far map fill (item 4), then items 6 to 8.

## State at 12:30 UTC (read this first after a compaction)

Round 2 build in work. Branch pushed at fd27cc1; local merge 1951b7b of main (engine batch 12, 759b70f, my engine request 1 accepted, `engine.patch` removed). Mails since 10:05: batch 11 (sample count follows screen motion, up to 64 at review and 128 at final; the cure for the stepped copies, not mine to fix; check motion at draft, confirm single frames at review), batch 12 (sky keeps its true ray).

### Done since 10:05, by item of the round 1 list
1. and 2. Covers (severe). `plan.ts` is now `UranusPlan extends StopPlan`: the orbit pose at each cover centre is the world mapped terrain pose (position, look, roll, speed), two beat dive, `coverAmount` override, `deckWeight(altitude)`. `set.ts` draws the deck, the deck ring arcs and a Sun flare card in the orbit view of the own dive and rise, cross-faded with the globe by altitude (`move.deckFade`, `arcFade`, `ringFade`), with a near grade on the globe (`look.near`) that bridges the colour of the two approved looks. Checked with the cover on at draft (batch q and v, `out/work/u/r4/`): one move across both covers, horizon angle, Sun and ring arcs continuous, stars fade in over 4169 to 4171.
3. Cover veil: `params.coverRush { speed 14, reach 2.5, billow [3, 3, 1], streak [10, 6, 1.6], contrast [0.75, 0.5] }`. Measured (log-polar correlation about the rush focus): speed 6 moved 0.047 ln r per frame, speed 12 moved 0.105 to 0.111. Contrast 1.4 and 1.1 left dark holes, 0.75 does not. The static part of the cover (engine `cover.flow`) cannot be changed from the plan. A faint weave shows in the dark upper part at draft (one sample).
4. Plate edge 4175 to 4216: `deck.ts` `uInset`, `look.deck.inset [0.1, 0.2]`, far map rebuilt by `terrain/build.py` so the real picture is continued to the plate edge. Draft 4175, 4200, 4216: edge and corner gone.
5. Stepped copies: all my layers take `state.time` of the time sample. Own smear and moon hiding were removed at 10:05. Engine batch 11 is the cure.
7. Dive detail: generated asset `dive-detail` (take 1 of 6, kept) is the mid-scale cloud structure of the four patches (`dive/patches.py`: `GEN_SIGMA 260, GEN_AMP 1.1, GEN_FLOOR 0.24, GEN_CEIL 0.42`, procedural `STRETCH 5`, `PROC`, `WISP 0.12`, wisp stretch 10). First try with sigma 100 and amp 0.8 was too faint in the frame. Recipe is in RECIPE.md with the exact prompt; the input is made by `dive/gen_input.py`.
7. Moons: air extinction by impact parameter (`look.moons.air [1.0, 1.04]`), depth along the hold ray (`depth` 1.2 Miranda, 1.3 Ariel; the hold keeps place and size by construction, draft 4035 differs only in aliased edge pixels of the moons), in the rise lit by the film Sun at `away 0.45` with planet shine `shine 5` so the dark limb reads as a sphere. Miranda sets behind the limb near 4124 and is out of frame in the rise; Ariel is at about (1805, 735) in 4436.
7. Rise globe. Finding: the rise camera at 4436 sits over wrap longitude -27, latitude -20, only 27 degrees from the hold camera's point (0, -26), so the rise shows the hero's own side, not the painted far side. The planet has turned 13.4 degrees by then, so the hero's night side structure baked in `shade.bin` and in the albedo sits in the light. Changes, all only after the terrain interlude (`left`): light table averaged over sun cosine +-0.22 (`look.globe.soft`), shade map at 0.3 (`awayShade`), globe gain 0.85 (`away`). The darker crescent with the hard inner edge and the seam at the upper left are gone at draft.
7. Rise rings: `fullLines` replaces `evenLines`: every line is a full circle in the common plane at its mean radius, level = mean of the upper half of its samples times `look.rings.far 0.5`, slow variation along the ring (`vary 0.35`). The far ring material blends as `src + dst * (1 - a)` with `a` = `look.rings.near [0.45, 120]` so the near arc reads as thin dark lines across the lit disc, and fades through the air where a line passes behind the limb (`look.rings.air`). The hold and dive rings are unchanged (additive, alpha 0).
8. Sky margin of the terrain view rebuilt without mirroring (`sky/terrain.py`, 8469 margin stars from 4491 stamps).

### Still to do before READY
- Hold acutance (item 6): per tile G17 of a final still (old measure: worst tiles [5,2] 0.55, [7,3] 0.57, [6,2], all at the globe's limb and rings, not the open sky).
- `python3 tools/assets/mirrorcheck.py` on terrain frames. Build, vitest, G11, measure, compares at final, sheets at review, budget, travel probe, commit binaries once, push, READY.
- Left as weak: terrain near field and dark corner follow the approved picture; rise bands are the hero's own pixels seen front lit; ring shadow on the disc is not drawn.

## State at 12:55 UTC (read this first after a compaction)

Round 2 build, all code changes are in the working tree, nothing committed since fd27cc1 (local merge 1951b7b). The check suite is running (measure first). After it: compares at final, sheets at review, budget, travel probe, commit with binaries, push, READY.

### Done since 12:30
- Item 6, hold acutance. Per tile G17 (12 x 8, `out/work/u/dbg/g17tiles.py FILM APPROVED`, final nograin): before median 1.177, p25 1.041, min 0.55, the soft tiles were all on the globe (0.55 to 0.69), the sky tiles are 1.0 to 1.4. Cause: the wrap is minified about 2 texels per pixel in the hold and read between two mip levels. Change: unsharp term on the wrap in `globe.ts` (`enc + sharp * (enc - wider sample)`, `look.globe.sharp [0.3, 0.8]`, second value times `1 - view cosine`, so more at the limb). It is zero where the wrap is magnified (both samples hit mip 0), so the dive patches are untouched. Tried 0.35 flat (min 0.65), 0.7 flat (centre tiles 1.67, speckle too strong, dropped). Kept [0.3, 0.8]: median 1.176, p25 1.085, min 0.72. Still soft: tiles row 2 cols 5, 6 (0.72): the approved has fine filaments at the bright pole, the wrap there is painted flecks.
- Item 6, terrain acutance. Per tile G17 of 4290 before: median 1.035, p25 0.778, min 0.60, all deck tiles 0.62 to 0.69. Cause: `deck.ts` read the 8192 px picture with implicit derivatives, 4.3 texels per pixel, so between mip 2 and mip 3. Change: `textureGrad` with the derivatives times `uGrad` (the engine's sample count uniform, 0.5 from 4 samples up) for the picture and the far map, plus an unsharp term `look.deck.sharp 0.3`. After: median 1.093, p25 0.988, min 0.80, deck tiles 0.91 to 1.17. Side by side with the approved the cloud wisps match. Still different: the ring arcs are discrete bright lines, the approved has a milky sheet with fine lanes between them (tiles 0.80 to 0.93 near the glare). Needs a refit of `deck-rings.bin`, not done.
- Item 8, hold ring beading: `RingLook.filter` (screen filter term of the line width, was a fixed 0.11): 0.2 for the orbit rings, 0.11 for the deck arcs. At x4 nearest no beads at either value at review; 0.2 chosen as the safer one.
- Item 8, star flicker measured (`out/work/u/dbg/flicker.py A B dx dy`): the sky drifts 1.5 px per frame in the hold; star peak two frames apart varies by 10 percent (one sigma), the 3 x 3 sum by 8 percent, the same at review (4 samples) and final (16). The engine reads the patch with four taps and full derivatives, so this is the 1 px star size of the approved hero against the pixel grid. Wider stars would cost the sky acutance R1 already faults. Left, reported.
- Item 8, mirrored stars: `tools/assets/mirrorcheck.py` on 4200, 4290, 4379 reports only a vertical axis at x 722, 784, 832 from row 0: that is the apex of the real ring arcs (a symmetric curve), it moves with the camera. Nothing at the top or right margins.
- Item 7, ring shadow on the disc in the rise: `ringProfile()` in `rings.ts` (1024 texel radial density of the full circle lines, mipmapped), `globe.ringShade()` and `globe.shadeRings()`; the fragment follows the Sun ray to the ring plane and darkens by the density there (`look.rings.shade [0.55, 0.004]`, strength and line sigma in radii). Sun stands 9.5 degrees off the ring plane, so the shadow is a narrow band of thin arcs beside the near arc. Only after the terrain interlude, the hold is untouched.
- Rise 4436 at draft (`y-4436`): soft terminator, full ring ellipse, near arc as thin dark lines over the lit disc, shadow band, Ariel as a sphere.

### Numbers so far (to be confirmed by the suite)
- Build green, 59 tests pass, G11 pass.

## State at 13:25 UTC (read this first after a compaction)

### G13 failed after the cover rebuild, cause and cure
- Full measure at 13:00 (`out/work/u/r4/measure2.log`): G5 pass (hold coverage 0.196, dive 0.499, terrain 0.519, rise 0.158), G17 pass (hold median 1.176, p25 1.085; terrain median 1.093, p25 0.988), G13 FAIL: 15 of 463 frames over 0.02 soft, 4131 to 4140 at 2.0 to 2.66 percent, 4144 to 4148 at 2.2, 3.4, 4.4, 5.4, 13.05 percent. Rise max 1.09 percent at 4424.
- Cause: the dive of `UranusPlan` ends over the deck sphere's centre (mapped pose), wrap longitude 38.6, latitude -24.4, 19 degrees from the old patch centre (22.5, -37.8, the engine's `plan.spot`). The camera looks west from there, so the near field fell outside patch levels 2 and 3 and the far field outside level 1.
- Predictor: `npx tsx assets-src/uranus/dive/softmap.ts A B STEP '[lon,lat]' '[widths]'` reads the film's own camera from the director (so it follows `UranusPlan`), the shape, spin and band drift, and the patch table. Sample time `(f + 0.5 shutter) / fps`. It gives the measured numbers back: 4144 to 4148 predicted 2.23, 3.41, 4.45, 5.53, 13.08 percent. `softfit.ts` uses the plain `StopPlan` path and is out of date for the dive.
- Scan of the patch centre (`out/work/u/dbg/spotscan.ts '[widths]'`, frames 4126 to 4148 and 4418 to 4454): with 76, 42, 22, 11 deg only longitude 23 to 25 at latitude -30 to -22 gives zero on both sides (dive needs level 3 out to longitude 34, rise needs level 1 out to longitude -12). With 80, 44, 24, 12 deg: zero from longitude 22 to 28 (texels view at draft, frames 4137, 4146, 4148: soft 0). Chosen: centre `[25, -26]` (`CENTRE_DEG` in `dive/spot.ts`), levels 80, 46, 24, 12.2 deg (densities over the wrap 1.87, 3.70, 7.39, 14.7, every step at most 2.0; same zero region in the scan). Predicted soft 0 on every dive and rise frame outside the cover.
- `spot.json` keeps the engine ground spot as `ground`; `spot` is the patch centre. `GEN_WIDTH` 80.
- 13:19 to 13:35, full measure with the new patches (tree before the batch 13 merge and before the hold sky margin): PASS G13 0 of 463 frames over 0.02 soft, worst 4392 0.57 percent; PASS G5 (4035 coverage 0.196, 4137 0.499, 4290 0.519, 4436 0.158, invalid 0); PASS G17 (4035 median 1.176, p25 1.085 over 70 tiles; 4290 median 1.093, p25 0.988 over 59 tiles). Gates: G11 PASS, G12 PASS (1827 tracked files, 1.36 GB), G15 PASS (uranus/web 313 MB, uranus/full 1230 MB). Build green, 59 tests pass. Copy of the JSON: `out/work/u/r4/measure-1335.json`.

### Mail 13:31, engine batch 13 (6ed0829) and the hold sky margin
- Batch 13: sky across the travels (lens opens to a star field, the arriving stop's orbit patch comes in over the last quarter of the travel). No hold, dive, terrain or rise frame moves. Merged: 973c134 (main ab7c0de), then 8c5b7c0 (main 5710e9f). `npm run -s aim -- --stop uranus` after the merge: orbit `[145.41987, -22.38676, 20.05787]` (ignored, Saturn decides), terrain as in the plan, so the margin fit of the hold patch still holds.
- The Builder's new `tools/assets/mirrorcheck.py` reported the hold patch: seams at x 1056 and 3872, y 594 and 2178, correlation 0.95 to 0.98. True: `widen()` in `sky/patch.py` used a symmetric pad for the fine detail in a 28 px seam at the frame edge and everywhere no copy shifted along the band existed (right end of the top edge, left end of the bottom edge, two corners: a four fold kaleidoscope at the upper right corner, see the look pushed 13:45).
- Cure: `shifted()` fills the whole margin from shifted copies (along the band, then across it), no pad; the star free mottle (`low(lin) - broad`) of the edge row is held outward and crosses over to the shifted copy within `SEAM` 28 px; the star points come straight from the shifted copy. Inside the frame the old expression is kept, so the inner 2816 x 1584 pixels of the full file are byte identical (checked against a rebuild with the old code, which gave the committed bytes back). New tool on the new file: `clean`.
- 13:39: `out/work/u/r4/final2.sh` runs detached (log `final2.log`): compares at final, four sheets at review, budget, travel probe, vitest, gates, then the full measure again on the final tree. Then commit with binaries, push, READY.

## State at 14:15 UTC (read this first after a compaction)

Round 2 build is complete in the working tree on top of the local merge 8c5b7c0 (main 5710e9f, engine batch 13). The final check chain (`out/work/u/r4/final2.sh`, log `final2.log`) ran on this tree from 13:39.

### Final checks on the round 2 tree
- Compares at final: hold and terrain beside the approved images, both read as the same shot (`out/work/compare/compare-uranus-{hold,terrain}-view.jpg`).
- Sheets at review, all four viewed: hold steady; dive one move across the cover (Sun, horizon slope and ring arcs carried); terrain; rise (cover 4407 and 4414 keep the arcs and the haze, 4420 the limb with the Milky Way, from 4427 the globe with the full ring ellipse, Ariel at the right).
- Budget (`out/work/budget/budget.json`): full set 1230 MB, web set 313 MB; disk 48 MB full, 20 MB web. Frame seconds at 16x9: hold 1.3 draft, 5.1 review, 19.7 final; dive 1.4, 28.8, 85.6; terrain 1.8, 6.8, 26.0; rise 2.0, 27.6, 110.1.
- Travel probe: `saturn.travel` joins out at 3960 with turn 0.042 to 0.042 deg per frame; `uranus.travel` joins in at 4455 with turn 0.002 to 0.001, peak turn 4.40 deg per frame at 4476, departing body in view 4455 to 4469.
- vitest: 13 files, 59 tests pass. Gates: G11 PASS, G12 PASS (1832 tracked files, 1.36 GB), G15 PASS (uranus/web 313 MB, uranus/full 1230 MB).
- `tools/assets/mirrorcheck.py`: final still 4035 clean, `sky-hold` clean, `sky-terrain` clean; final still 4290 reports one vertical axis at x 782 from row 0 with correlation 0.56, which is the apex of the real ring arcs (it moves with the camera: 722, 784, 832 at 4200, 4290, 4379), nothing at the top or right margins.
- Terrain 4200, lower right (round 1 item 4): the straight plate edge and the corner are gone. What is left at draft and in the review sheet is a soft darker patch low right of centre where the far map takes over from the plate. It has no straight side and reads as cloud shading. Left, reported as weak.
- 14:11 to 14:26, full measure on the final tree (`out/work/u/r4/measure-1426.json`): PASS G13 0 of 463 frames over 0.02 soft, worst 4392 and 4393 0.57 percent, 4391 0.53; PASS G5 (4035 coverage 0.196, 4137 0.499, 4290 0.519, 4436 0.158, invalid 0); PASS G17 (4035 median 1.177, p25 1.082 over 70 tiles; 4290 median 1.093, p25 0.988 over 59 tiles).

## State at 14:30 UTC (read this first after a compaction)

READY for round 2 sent at 14:29 with commit cae2846 on `agent/uranus` (work commit 54e0471, merge of main 5cfb8dc with Saturn's round 2; no engine change in that merge, engine hash 6728b99fa98fbd73 and stop hash ea6fbabf377550d2 are the same before and after, aim unchanged, vitest and gates run again after the merge and green). Looks pushed 14:28.

Reported as still weak (work on these while the round is out, motion first, push only finished and green steps):
- Rise turn peaks at about 11.9 deg per frame near 4422; the Sun leaves the frame under the rise cover.
- Terrain 4200 to 4216 low right: soft darker patch where the far map takes over from the plate.
- Terrain ring arcs: discrete bright lines where the approved has a milky sheet with fine lanes (needs a refit of `deck-rings.bin`).
- Hold pole tiles 0.72 (approved has fine filaments).
- Miranda out of frame in the rise. Dive 4142 ring as a soft thick band (motion blur).
- Not mine: stepped copies (engine), Milky Way change under the covers (engine sky turn), oval stars with fringes in the dive (lens chain).

## State at 14:50 UTC (read this first after a compaction)

After the READY (cae2846). Working tree holds one finished step, not committed yet:
- Terrain 4175 to 4216 low right (round 1 item 4, the rest of it). `--diag layers` at 4200 shows the plate's lower edge running through the patch: the plate is dark there, and the far map below it had a bright synthesised streak (the streaks did not know the plate), so the hand over read as a darker patch with a straight lower side. `terrain/build.py` `CARRY`: the synthesised albedo takes its low frequencies per channel from the real albedo at the hand over and returns to the fitted colour line with distance; the large scale of the streaks comes in with distance. Draft 4183 and 4200 before and after (`/tmp/c4183.png`, look pushed 14:47): patch gone. Draft 4148 to 4176, 4216, 4398, 4419, 4422 look right. `deck-far.jpg` and `deck-height.bin` changed (both sets). Needs the gates and a measure before it is pushed.

Next: fine ring lanes of the terrain view. `check/arcs.py` on the final still 4290: thin line energy film over image 1.12 overall but 0.74, 0.84, 0.94, 0.89 in the four sixths away from the limb glare, so about a fifth of the lane energy is missing there. `sky/terrain.py` takes all thin coherent structure out of the sky patch (`coh`), the 36 tracked lines give only part of it back. Loosening the tracker (`out/work/u/t/rings_x.py LOW MINLEN MINN ROUGH TAG`) gives wobbly fragments and junk, dropped. Plan: a textured sheet in the ring plane (true 3D, same frame as the lines) that carries `coh` minus the model of the tracked lines, star free (median along the ring), drawn additive with the lines' photometric terms.

### Rise move, analysis 14:55 to 15:05 (no render, `out/work/u/dbg/{riseref,risegeo,risescan,riseparts}.ts`)
- `riseref.ts` over all plans, turn of the camera in the orbit view of each rise: mercury total 73 deg, peak 6.3 deg per frame; venus 71, 6.2; earth 63, 6.3; mars (approved) 91, 5.6; jupiter 54, 4.4; saturn 16, 0.9; neptune 52, 3.9; **uranus 147, 11.95**. Mine is twice any other stop.
- Why: my rise end (azimuth -36, elevation 15 from the hold direction) lies 46 degrees AHEAD of the terrain spot along the heading (end direction in the spot frame: up 0.69, ahead 0.72, right 0.09), so the camera flies over the planet and looks back: forward to forward 140 degrees. Jupiter, Saturn and Neptune back away (ahead -0.62, -0.88, -0.63), Mars leans 0.38 ahead with total 91.
- Parts per frame at the peak (4421): dip of the horizon grows 4.9 deg per frame (altitude 0.035 to 5.8 radii, exponential, 27 to 36 percent per frame), the lean ahead adds up to 5.4, the blend from the carried terrain look to the framed look adds about 4. A lean behind takes away from the dip instead of adding.
- Phase follows from the geometry: the Sun stands ahead at the spot's horizon (up 0.09, ahead 0.89, right 0.45), so phase is about 165 minus the forward to forward angle. Table (`risegeo.ts`): az 30 el 0: phase 91, net 76, ring opening 34; az 40 el 0: 97, 67, 27; az 50 el -15: 115, 52, 29; now: 42, 140, 35. Other stops' rises have phase 78 to 94 (Mars 86).
- Tried in `plan.ts` (switches in `move`, uncommitted): `riseSwing` (the lean follows the dip angle, so it cancels the dip while it grows) and `riseEase [up, flat, total]` frames (trapezoid rate of the log altitude from the cover centre instead of settle 7: lower peak rate, and the move is over by 4436, turn 0.0 to 0.1 deg per frame there against 0.89 now). Numbers with swing 1, ease [3, 13, 27], aim [0, 0.95], join 0: az -36 el 15: total 144, peak 10.8; az 30 el 0: total 85, peak 7.1; az 50 el -15: total 62, peak 5.5.
- To decide by pictures: is the globe at phase 91 to 97 (half lit from the top of the frame) as good a rise frame as the present phase 42.

### Far map step, checks 14:49 to 15:05 (tree = cae2846 plus the far map and `build.py`)
- Build green, 59 tests pass, G11 PASS, G12 PASS (1881 tracked files, 1.40 GB), G15 PASS (uranus/web 313 MB, uranus/full 1230 MB).
- Full measure (`out/work/u/r4/measure-1504.json`): PASS G13 0 of 463 frames over 0.02 soft, worst 4392 and 4393 0.57 percent; PASS G5 (4035 coverage 0.196, 4137 0.499, 4290 0.519, 4436 0.158, invalid 0); PASS G17 (4035 median 1.177, p25 1.082 over 70 tiles; 4290 median 1.090, p25 0.986 over 59 tiles; before 1.093 and 0.988).

## ROUND 2 RESULT, mail from /root at about 15:10 UTC (round 21, judged on main at 23c9282 = my c74032a). ROUND 3 IS THE LAST.

Scores (round 1 in brackets): R1 7 (7), R3 6 (5; both parts 6), R4 4 (4), R2 PASS, R8 pass. Measures green. 2 severe, 13 major. Summary on main: `scorecards/round-021/SUMMARY.md`. "Motion is what holds Uranus down; it comes first in round 3. Your update of 15:05 (rise end beside and behind the spot, phase 91) goes the right way: carry on with it, with what follows."

Corrections, worst first (quotes are the critics' words as mailed):

1. SEVERE x2 (R4), rise 4416 to 4454. "the rise does not continue the move that comes out of the cover. At 4416 the sun and ring arcs are upper right over a limb at the bottom. At 4420 the sun and rings are gone, the limb is lit from above and a Milky Way field appears. At 4427 the planet jumps to the right half with rings on a new side, and by 4434 it has shrunk to a small disc on almost black sky. These are three changes of direction and background in about 18 frames"; and "the camera does not return to the place it left. The hold shows a diagonally banded globe with its lower right half in shadow over a dense Milky Way. The end of the rise shows the same planet fully lit, bands nearly vertical, rings at a different tilt and an empty black sky. The sun direction and the sky contradict each other between the two". Critic's fix: "drive the whole rise as one eased pull back on a single spline from the terrain pose. Keep the sun, rings and star field fixed in world space so they fall away continuously". Builder: both true; 4434 to 4454 is a globe on a near empty black field, against "Space is alive ... never an empty black card". The join at the rise cover was severe in round 1 too, so the plateau rule applies: stop tuning the wipe. Ladder "A cover can be seen as a join": rung 1 on the geometry and rung 2. That means:
   - (a) one Sun direction in the world for the whole stop; the rise does not fly to the lit side. Rising from a spot where the Sun sits on the horizon ends above the terminator: a half lit globe, as the phase 91 test gives. That is wanted.
   - (b) at the swap frame the limb line, the Sun and the ring arcs sit at the same place and angle on both sides (measure them: limb height and tilt, Sun position in px, the ring ellipse), so nothing is drawn twice at two places.
   - (c) after the swap one eased curve: the Sun, the rings and the stars stay fixed in the world and fall away; no reframing, no second turn; the peak turn at or under the other stops' (about 6 to 7 degrees per frame).
   - (d) the cover thicker and moving with the camera while it is on.
   - (e) the sky stays alive to 4454: check where the end view looks and that the band and dense stars are in frame behind the globe (my skyAim), at an exposure that shows them, as in the hold.
   - (f) the night half at the end is never pure black: faint band detail, planetshine level as in the approved hero's shadow.
2. MAJOR (R4), dive 4142 to 4150: "the move jumps in position and direction just before the cover. A bright sun pops in upper right, the thin ring streaks on the upper right become large arcs on the upper left, the limb flattens and darkens, and the Milky Way drops out, all within 8 frames". Fix: the swap of the two pictures happens only where the cover is full; before it the orbit camera already bends toward the terrain pose so the Sun rises over the limb gradually and the rings sweep. (Builder renders 4143 to 4149 at review and writes if more.)
3. MAJOR (R4), dive 4118 to 4134: "the speed jumps. The disc roughly doubles in size between 4118 and 4126 and fills the frame by 4134, after a near static hold". Ease the dive in over 30 frames or more; the lens changes slowly across the whole dive, never as a step.
4. MAJOR x2 (R4), stepped copies. Rise cover exit 4413 to 4416: "The sun shows as two separate blobs at 4415 and 4416, and the ring arcs and the upper right streaks at 4413 are drawn as parallel double lines". Builder: two pictures of the same Sun and rings at two places during the swap, item 1 (b) removes it. Dive cover 4159 to 4161: "the bright limb and ring edges break into stacked parallel copies". Builder: my cover is translucent there, the bright limb shows through, and the engine gives a covered frame few samples. Engine side in work (a plan number for how much a stop's cover hides, default as today; will be told when on main). Until then: make the cover dense enough at those frames that the limb line does not show through, or keep the limb line dim under it.
5. MAJOR (R4), dive cover exit 4167 to 4170: "the cover ends too fast. Within 3 frames the sun goes from absent to full flare and the ring arcs go from invisible to crisp". Stretch the clearing to 10 frames or more, the Sun's flare and the rings' brightness rising with the thinning haze.
6. MAJOR x3 (R1). 4290 ring arcs: "on the right arc the bright outer and inner ringlets collapse into thick, flat solid-white strokes lacking -a's fine multi-strand splitting and subtle warm/cyan tint, with dark speckled aliasing dots along the inner bright ringlet; on the upper and left arcs several fine inner ringlets and cyan dust bands simplify or fade out prematurely before reaching the limb". 4290 limb: "a sharp, thin geometric line runs along the planet disc boundary inside the cyan atmospheric glow instead of diffusing continuously from sunlit cloud tops into haze". 4035 moons: "the right moon is roughly 25-30% larger in diameter than in -a, and both moons have crisp cut-out CG rims, uniform micro-noise instead of larger terminator crater basins, and crushed pitch-black night hemispheres that lose -a's dim planetshine fill".
7. MAJOR x4 (R3), plateau on the cloud deck (named in round 1 and 2): 4137 "the near terrain and mid disk are a soft brushed smear, with linear streaks along the view ... stretched procedural texture"; 4290 "Much of the surface detail smears into similarly angled bands. The bright far layer loses separation from the limb glow"; 4436 "Cloud texture stretches into long, nearly parallel streaks and loses fine structure, making the globe look airbrushed". Ladder "A globe looks plastic, flat or like a web demo", rung 3 with rung 1: the bright cloud flecks and fine turbulence as their own layer above the bands with soft shadows, and fine relief, so a native crop holds detail at several scales inside the streaks. NOT a fault: the soft banding itself and the long streaks at the hold's scale are the approved hero's own; keep the low frequencies. 4436 moon: "a soft oval with a smeared brightness gradient and no distinct lit edge or surface relief".
8. BRANDON'S ORDER, terrain 4200 to 4379 (R4 minor, first rank): "the near cloud deck and the horizon move together as one plane: the whole limb drifts slowly down and rotates, with little motion of the near ground against it". The terrain view has to show clear forward movement and depth across its whole length. More forward travel at lower height, a nearer cloud layer that slides past faster than the limb, haze between; check first against last tile that near and far have clearly moved against each other, with 4290 still matching the approved image.

Minors. Hold 3960 to 4109: "the planet's rotation and cloud drift are barely visible over about 150 frames". 4035: micro ringlets and grain softer than approved, the top left outer ringlet a little bright, faint strands across the Milky Way nearly lost; Milky Way core smudged; the dark limb's inner edge hard. 4290: the Sun's core softer, its horizontal streak "fainter and shorter"; "The thinnest bright ring ends as a sharp needle against the cyan haze"; "Several brighter stars are softened into colored dashes or irregular blobs" right of the rings (stars stay points). 4436: "The almost white rim sits over a broader blue halo, reading as a separate outline". 4035 lower left sky: "a faint greenish iridescent smudge": compare with the approved hero; if it is there too, keep it and say so.

Jurors (input, no fault): rings as "nested neon loops", "2D arch". Do not change the ring design.

Rules. Nothing may cost R1 at 4035 and 4290. No threshold, rubric or judged frame changes. Engine: batches 1 to 13 on main (hash 6728b99fa98fbd73); two more are coming (the travel sky and fast frames); merge origin/main before READY; engine files are not mine, ask in ENGINE-REQUESTS.md.

READY format: "READY <commit> round 3", per item what changed, what is still weak, measures (G5, G13, G17, gates, tests), the peak turn in the rise. Before READY look at my own dive, dive-cover, rise and rise-cover sheets at review tier tile by tile, and at 4035, 4137, 4290, 4436 at final tier.
