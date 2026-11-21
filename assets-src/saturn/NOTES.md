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

So an engine request is needed (see ENGINE-REQUESTS.md once written): a flag for no cover, and hooks so a stop can give its own closed-form dive, terrain and rise path.

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
