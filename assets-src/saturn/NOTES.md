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

Correction (03:10): none of the above needs the engine. `StopPlan` methods are overridden in `src/stops/saturn/plan.ts` (`SaturnPlan`): own `dive`, `terrain`, `rise`, `coverAmount` returns 0, measured with `--no-cover saturn`. The only engine request is `SkyPatch.weight(time, view)` (ENGINE-REQUESTS.md, engine.patch, sent 03:14), because patches are read before `set.update` and the close view looks only 21 degrees away from the hero view, so the hold patch would be on screen at the view change. The change sits uncommitted in `src/core/engine.ts` and `src/core/types.ts`. Never commit those two files.

Engine facts worth keeping:
- Terrain view is a rigid transform of the orbit frame (near 0.01, far 4000). Orbit near = clamp(0.02 * (|pos| - 1), 0.0004, 1), far 80000. A `terrain` segment always uses `plan.terrain` and the terrain view.
- `set.near` is drawn after `clearDepth()`. `ctx.texture(path, {srgb, mips, repeat, anisotropy, flipY})`, `ctx.dataTexture(path, w, h, 1|4)` float32 binary, `ctx.floatTexture(data, w, h)`.
- Scene value of an approved pixel = `inverseFilmic(sRGB decode)` (`INVERSE_FILMIC_GLSL` in `src/post/chain.ts`, `inverse_filmic` in `tools/assets/lightcurve.py`).
- `src/bodies/planet.ts` and `HAZE_GLSL` assume a unit sphere. The oblate globe is shaded in sphere space: pole axis scaled by 1/0.902.
- Mars `set.ts`, `sky.json`, `assets-src/mars/sky/RECIPE.md` are the pattern for patches and FarPoint.

## Design (decided 2026-11-21, before any asset was made)

One world, true 3D, for all four segments. Nothing switches between the orbit view and the terrain view except the engine's frame of reference.

- Globe: oblate sphere, wrap map from the hero's own pixels on the hero's side (faded toward the limb), painted elsewhere. Zonal flow in the shader: each latitude band drifts at its own speed, zero displacement at the hold midpoint. Light as a measured curve. Haze layers fitted across the limb. Ring shadow on the globe computed from the ring profile's opacity along the Sun's ray.
- Rings: a flat annulus shaded from a 1D radial profile (color and opacity) with its own mip pyramid packed into rows of a texture (8192 wide is the largest texture here). Band-limited by the pixel's footprint in radius, so thin bands at grazing angles cannot shimmer. 32768 samples across the ring span keep at least one texel per pixel at the skim height. Azimuthal structure (faint clumps, streaks, sparkle) turns with a Kepler law so the inner parts visibly run faster. Globe shadow on the rings computed, with a soft edge. Lit from behind where the Sun is behind them.
- Terrain view: the same rings from just above the plane. The approved close image is unprojected onto the ring plane from its fitted camera and laid on the rings as a patch that fades in by distance, with the 1D profile carrying the fine detail and everything outside the patch. Near the lens: drifting ice grains that sparkle, drawn as points with depth of field.
- Titan: a sphere with a hazy orange map and a haze shell, moving on its orbit.
- No globe detail patches are needed: the globe is largest in the terrain view (about 610 px radius at 1080p), where an 8192 wrap still gives about 2 texels per pixel.
- Texture budget: wrap 8192 x 4096 (179 MB with mips), ring profile and patch small, Titan small, two sky patches. Far under the limit.

## Log

- 02:43 Cloned, branch made, `npm ci`, build passes. Merged origin/main (9602aca).
- 02:44 Stand-in compares rendered at draft. Pushed looks.
- 02:45 to 03:10 Read the brief, the kit files, Look lock, the director and the engine.
- 03:10 to 03:22 Refit (`refit.py`) of the Sun and the ring plane on both shadows of the hero. Values in `fit.json` (both copies): sunDir [-0.789623, 0.580852, -0.197751], 14.6 degrees above the ring plane; ring normal [0.19599, 0.881152, 0.430301]; rings 1.2458 to 2.3394 radii; globe quaternion [0.2171781, -0.0427061, -0.1107142, 0.9688923], scale [1, 0.902, 1]; hero camera [-0.182312, -0.033514, 5.556652], vfov 30; Titan [8.194999, 4.225177, -17.747954] radius 0.364424.
- Close camera fit (`close/fit_close2.py`, fixed radii): vfov 56, globe centre in camera coords [0.9954, -0.0653, -2.1202], tilt 9.88, roll -8.99, height 0.274 radii above the plane, 2.327 radii from the axis (over the outer A ring), rms 41 px. In `src/stops/saturn/close.json`. Alternative vfov 48: centre [0.9787, -0.1171, -2.2966], tilt 9.39, roll -9.48, height 0.33, distance 2.48, rms 34.
- `plan.ts` rewritten as `SaturnPlan`: skim pose from close.json at azimuth n x sunFlat (Sun to the camera's left), `join()` blends extrapolated poses (smootherstep, height geometric), view changes at dive u 0.5 and rise u 0.45, `patchWeight(time, view)` fades the hold patch out over dive u 0 to 0.45, the terrain patch in over 0.55 to 1 and out over rise u 0 to 0.4. tsc passes. Rise azimuth 36, elevation 22, distance 6.6: still to be checked for the lit north side.
- Ring profile extraction: `rings/polar_view.py` (hero to ring polar, 3000 rows r 1.10 to 2.60, 4096 columns), `rings/close_polar.py` (close image to ring polar, 6000 rows), `rings/extract.py` (column alignment by shift, median). Results in `out/work/saturn/profile-{hero,close-a,close-b}.npy`. Hero scene values (R,G,B): C ring 0.15/0.12/0.09, inner B 0.76/0.39/0.24, outer B 1.32/0.63/0.34 (peaks 2.6), Cassini 0.016/0.018/0.019, A 0.27/0.20/0.16, outer A 0.32/0.24/0.18, beyond 0.008/0.011/0.014. Close image: B about 0.43/0.31/0.24 (flatter, creamier, less orange), A 0.16/0.14/0.12 inner to 0.11/0.10/0.085 outer (grey), Cassini 0.014/0.016/0.017. So the close image is less saturated and dimmer in the B ring: the terrain view gets its own ring tint and gain blended by view (a `closeMix` uniform), not a different profile.

## Rendering design, final

- Rings: annulus mesh in the ring plane, depth test against the globe, no depth write, premultiplied blend with coverage alpha. Two passes split per pixel around the glow shell (farther than the ray's closest approach to the globe centre before the shell, nearer after). Profile: float RGBA rows of 8192 with explicit mip rows, `texelFetch` trilinear, footprint = length(dFdx(r), dFdy(r)) * uGrad. Globe shadow on rings by line miss distance in sphere space, penumbra 0.004 + 0.012 t. Azimuthal clumps turn at spin * (r/1.86)^-1.5.
- Globe: copy of the planet shader, oblate normal, measured light curve, ring shadow from the profile's opacity along the Sun ray, zonal drift per latitude (zero at hold mid), haze in sphere space.
- Glow shell: additive BackSide shell in sphere space with `HAZE_GLSL`. Titan: small sphere, soft wrap light, halo, moving about the pole. Ice grains: points in `set.near`, sparkle, depth of field. Sky: hold patch from the hero, terrain patch from the close image, both with `weight`. Travel: FarPoint as Mars.
