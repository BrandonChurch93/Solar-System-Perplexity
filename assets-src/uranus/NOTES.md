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
