# Saturn stop notes

Lab notebook of the agent that builds the `saturn` stop. Read `assets-src/shared/STOP-AGENT.md` first, then this file.

## Where things stand

- Branch `agent/saturn`, looks on `agent/saturn-looks`. Started 2026-11-21 02:43 UTC.
- First looks pushed 02:45 UTC: stand-in hold and terrain beside the approved images.
- Frames: hold 3390 to 3539 (judged 3465), dive 3540 to 3629 (judged 3567), terrain 3630 to 3809 (judged 3720), rise 3810 to 3884 (judged 3866), travel 3885 to 3959.

## What the engine gives and what it does not

- The engine puts the camera at the origin and each set's `world` at `state.origin - camera` with `state.rotation`. In the terrain view `origin` is the plan's spot and `rotation` is `terrainFrame` (right, ring normal, minus heading). There is no scale between the two views: terrain-local units are planet radii.
- `StopPlan.dive` switches from the orbit view to the terrain view at the cover centre (60 percent of the dive). For a ring spot the path before the switch (the branch without `swoop`) and the path after it (`diveTerrain`) do not meet: position, direction and field of view all jump (the field of view goes from about 52.5 to 56 degrees in one frame). `swoop` is built on a sphere (`position = ground * (1 + h)`), so it cannot land on the ring plane.
- `terrain()` has no pitch at its midpoint, so the terrain camera looks exactly along the ring plane. The approved close image has the ring horizon well above the middle of the frame, so the camera is pitched down.
- `coverAmount` always draws a cover in the cover window. `tools/measure.ts` counts every frame only with `--no-cover saturn` or when `info().noCover` lists the stop, and nothing in `src/` reports it yet.
- Sky patches are chosen by view (weight 1 when `patch.view === state.view`, 0 in the orbit part of a rise). Two at most. A view switch in sight of sky swaps the patch in one frame, so the switch has to sit on a frame with no sky in view.

Correction (03:10): none of the above needs the engine. `StopPlan` methods are overridden in `src/stops/saturn/plan.ts` (`SaturnPlan`): own `dive`, `terrain`, `rise`, `coverAmount` returns 0, measured with `--no-cover saturn`. The only engine request is `SkyPatch.weight(time, view)` (ENGINE-REQUESTS.md, engine.patch, sent 03:14), because patches are read before `set.update` and the close view looks only 21 degrees away from the hero view, so the hold patch would be on screen at the view change. It is on `main` since b4ae65c (engine batch 1, merged 04:08); the local copy was dropped. No other engine change is needed.

Engine facts worth keeping:
- Terrain view is a rigid transform of the orbit frame (near 0.01, far 4000). Orbit near = clamp(0.02 * (|pos| - 1), 0.0004, 1), far 80000. A `terrain` segment always uses `plan.terrain` and the terrain view.
- `set.near` is drawn after `clearDepth()`. `ctx.texture(path, {srgb, mips, repeat, anisotropy, flipY})`, `ctx.dataTexture(path, w, h, 1|4)` float32 binary, `ctx.floatTexture(data, w, h)`.
- Scene value of an approved pixel = `inverseFilmic(sRGB decode)` (`INVERSE_FILMIC_GLSL` in `src/post/chain.ts`, `inverse_filmic` in `tools/assets/lightcurve.py`).
- `src/bodies/planet.ts` and `HAZE_GLSL` assume a unit sphere. The oblate globe is shaded in sphere space: pole axis scaled by 1/0.902.
- Mars `set.ts`, `sky.json`, `assets-src/mars/sky/RECIPE.md` are the pattern for patches and FarPoint.

## Design as built

One world, true 3D, for all four segments. Nothing switches between the orbit view and the terrain view except the engine's frame of reference. No fallback relief is used.

- Globe (`globe.ts`): oblate sphere shaded in sphere space. Wrap map 8192 x 4096, stored as sRGB of filmic(albedo), decoded with `inverseFilmic`. Light = 33 knot curve by `ndl` (`curve.json`) times a table by (`ndl`, latitude) (`light.bin`, 48 x 41 RGBA float, read with `texelFetch`), both measured from the hero. `ndl` is shifted toward night at high northern latitude (`termShift` 0.085 between sin lat 0.55 and 0.97) because the hero's terminator sits further sunward near the pole. Ring shadow from the ring profile's alpha along the Sun ray (`ringShadowAt` in `profile.ts`). Night side uses a blurred albedo sample. Rim terms: lit rim `uRim` gaussian in view cosine times ndl^3, night rim `uRimNight`. Zonal drift per latitude, zero at the hold midpoint.
- Shell (`globe.ts` Shell): additive haze shell with `HAZE_GLSL`, ring shadowed.
- Rings (`rings.ts`): annulus, two passes split around the shell, premultiplied colour with coverage alpha, 1D profile with explicit mip rows (`rings.bin`, 32768 samples in `full`), two profiles (hero, close) cross-faded by `uClose` (camera height above the ring plane, `closeRange` in `look.ts`). Profile colour is filmic display space, `inverseFilmic` in the shader. Azimuthal brightness of the hero as an order 2 Fourier gain in 5 radial bands (`azimuth.json`), faded out by `uClose`. Globe shadow on rings by line miss distance with a penumbra. Kepler turn of azimuthal structure. Sparkle cells.
- Titan (`titan.ts`), FarPoint for travel, sky patches with `weight` from `plan.patchWeight`.
- Still to build: ice grains near the lens (`set.near`), terrain sky patch, depth of field if needed.

## Asset pipeline (all under `assets-src/saturn/`)

- `wrap/geo.py`: hero geometry on the spheroid, `term_shift`, `curve_at`, `table_at`, `light_at`, `filmic`, `scene`.
- `wrap/light.py`: iterates zonal albedo and the curve on hero pixels (outside rings and ring shadow, view cosine above 0.3), then the table of hero / (zonal albedo x curve) by ndl and latitude (view cosine above 0.14, rows without data mirrored from the north, smoothed 0.7 bins). Writes `src/stops/saturn/curve.json`, `light.json`, `public/assets/saturn/{full,web}/light.bin`, `out/work/saturn/{curve,zonal,light-table}.npy`. Residual with the table: median 0.99 to 1.01 in every ndl range, 10th and 90th percentile 0.84 to 1.16.
- `wrap/build.py 12`: wrap map. Hero pixels (2x ML upscale `out/work/saturn/hero-globe-2x.png`, crop x 928..2080 y 200..1352) divided by the light, kept where view cosine and ndl are high and no ring covers or shadows; elsewhere the zonal profile times a luminance detail tile periodised with 12 periods. Run `light.py` first. About 1 to 2 minutes.
- `rings/build.py`: both ring profiles and mips to `rings.bin`, `rings.json`. Alpha = 1 - exp(-scene luminance / 0.04), so the C ring is nearly opaque in front of the globe as in the hero (hero shows 0.08 to 0.18 scene there, the C ring's own colour).
- `rings/azimuth.py`: azimuth gain fit to `azimuth.json`.
- `sky/patch.py hold HERO FILL GLOW|none`: hold sky patch (Mars pattern: hero minus the film's own glow where the hero shows sky, generated fill elsewhere, mirrored margin). Fill images: `out/work/saturn/sky-fill-hero-take1.png` and `sky-fill-close-take1.png`, one take each with `seedream_5`, prompts to be recorded in `sky/RECIPE.md`.
- `check/limb.py FILM`, `check/ratio.py FILM OUT`, `check/side.py hero|close FILM OUT x,y,w,h ...`, `check/contrast.py`: hero against a film still in scene values.

## Measurements from the hero

- Globe shadow on the rings is at sky level (0.008/0.011/0.013 scene), edge at miss 1.0 to 1.08, penumbra to 1.15.
- Halo outside the lit limb, scene x100: 7 at 8 px, 5 to 8 at 14 px, 3 to 5 at 24 px, 1.5 to 2 at 40 px (hero px), neutral to warm. None on the night side. Night limb has a thin blue rim, +0.004/0.012/0.025 within 8 px.
- Lit rim inside the limb: excess about +1.0 in green, +0.5 in blue at ndl 0.9 within 4 to 8 px of the limb, about +0.2 at ndl 0.48, gone by 14 px. Fit limb position error about 4 hero px.
- Terminator: with one curve the film was 2 to 4 times too bright at latitudes 50 to 80 near ndl -0.15 to 0 and 35 percent too bright on the night side at latitude -10 to 0. Hence the shift and the table.
- Rings in front of the globe: hero is nearly opaque there, the globe is geometrically lit behind the C ring (its ring shadow starts at latitude -11.6 on the camera's meridian, the rings hide everything south of -6.6).
- Hero sky (display) about 0.064/0.087/0.116 against the film's fixed sky 0.006/0.019/0.025: the hold needs its patch.

## Open list (worst first)

1. Hold sky patch: glow-only render, final patch, gain by measurement.
2. Terrain view: camera refit (rms 41 px, film globe larger and further right), close profile bright from r 1.21, close alpha higher (sky shows through Cassini and outer A), stronger dark grooves in the foreground, paler globe in the close view, globe shadow on rings at right, sky patch from the close image.
3. Ice grains near the lens, sparkle tuning, Titan tune (hero circle about [2470, 252, 49] px, moon speed about 0.8 deg/s).
4. Dive and rise sheets: profile cross-fade, azimuth gain fade, rise pose lit north side, fill repetition every 30 degrees, travel free of pops.
5. RECIPE.md for wrap, rings, curve, azimuth, sky. Delete `standin-close.jpg` and `standin-wrap.jpg` from both sets. Commit binaries at the milestone. Self-check, budget, vitest.

## Log

- 02:43 Cloned, branch made, `npm ci`, build passes. Merged origin/main (9602aca).
- 02:44 Stand-in compares rendered at draft. Pushed looks.
- 02:45 to 03:10 Read the brief, the kit files, Look lock, the director and the engine.
- 03:10 to 03:22 Refit (`refit.py`) of the Sun and the ring plane on both shadows of the hero. Values in `fit.json` (both copies): sunDir [-0.789623, 0.580852, -0.197751], 14.6 degrees above the ring plane; ring normal [0.19599, 0.881152, 0.430301]; rings 1.2458 to 2.3394 radii; globe quaternion [0.2171781, -0.0427061, -0.1107142, 0.9688923], scale [1, 0.902, 1]; hero camera [-0.182312, -0.033514, 5.556652], vfov 30; Titan [8.194999, 4.225177, -17.747954] radius 0.364424.
- Close camera fit (`close/fit_close2.py`, fixed radii): vfov 56, globe centre in camera coords [0.9954, -0.0653, -2.1202], tilt 9.88, roll -8.99, height 0.274 radii above the plane, 2.327 radii from the axis (over the outer A ring), rms 41 px. In `src/stops/saturn/close.json`. Alternative vfov 48: centre [0.9787, -0.1171, -2.2966], tilt 9.39, roll -9.48, height 0.33, distance 2.48, rms 34.
- `plan.ts` rewritten as `SaturnPlan`: skim pose from close.json at azimuth n x sunFlat (Sun to the camera's left), `join()` blends extrapolated poses (smootherstep, height geometric), view changes at dive u 0.5 and rise u 0.45, `patchWeight(time, view)` fades the hold patch out over dive u 0 to 0.45, the terrain patch in over 0.55 to 1 and out over rise u 0 to 0.4. tsc passes. Rise azimuth 36, elevation 22, distance 6.6: still to be checked for the lit north side.
- Ring profile extraction: `rings/polar_view.py` (hero to ring polar, 3000 rows r 1.10 to 2.60, 4096 columns), `rings/close_polar.py` (close image to ring polar, 6000 rows), `rings/extract.py` (column alignment by shift, median). Results in `out/work/saturn/profile-{hero,close-a,close-b}.npy`. Hero scene values (R,G,B): C ring 0.15/0.12/0.09, inner B 0.76/0.39/0.24, outer B 1.32/0.63/0.34 (peaks 2.6), Cassini 0.016/0.018/0.019, A 0.27/0.20/0.16, outer A 0.32/0.24/0.18, beyond 0.008/0.011/0.014. Close image: B about 0.43/0.31/0.24 (flatter, creamier, less orange), A 0.16/0.14/0.12 inner to 0.11/0.10/0.085 outer (grey), Cassini 0.014/0.016/0.017. So the close image is less saturated and dimmer in the B ring: the terrain view gets its own ring tint and gain blended by view (a `closeMix` uniform), not a different profile.
- 03:22 to 03:36 True 3D rings, globe, shell, Titan modules; first draft compares. Commit and looks 03:36.
- 03:36 to 03:49 Ring shadow in the shell, grey shadow floor, ML upscales, wrap pipeline and light curve, first hero-pixel wrap. Commit and looks 03:49.
- 03:49 to 04:08 Check tools; ring profile in display space; azimuth gain; rim terms; found the terminator shift and the opaque rings; light table; sky fill images generated; sky patch script; engine batch 1 merged (b4ae65c).
