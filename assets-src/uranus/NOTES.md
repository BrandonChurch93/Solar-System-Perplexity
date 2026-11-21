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

## State at 04:25 UTC (read this first after a compaction)

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
