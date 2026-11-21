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
