# Mercury notes (stop agent memory)

Read `assets-src/shared/STOP-AGENT.md` first, then this file.

## Where things stand

- Branch `agent/mercury` (code, JSON, notes). Looks go to `agent/mercury-looks` through `npm run looks -- --push --folder mercury --note "..."` only, at least every 30 minutes.
- Parent is `/root` (the Builder). Milestone messages: orbit view, terrain view, dive and rise, then `READY`. Each with commit, measured numbers, weak points. Do not wait for replies.
- Builder's notes: web set at most 35 MB on disk, full 150 MB. Engine requests early as `assets-src/mercury/engine.patch` (none needed so far). Travels before the hold and after the rise must stay free of pops (judged in Phase 5).
- VM: 4 cores, about 8 GB RAM. Two heavy Python jobs at once get killed: run one at a time. One render process at a time.

## Segments and judged frames (30 fps)

- hold 18 to 23 s, judged frame 615 (holdMid 20.5 s). dive 23 to 26 s, judged 717. terrain 26 to 32 s, judged 870. rise 32 to 34.5 s, judged 1016. Covers centered on frames 744 and 990. The Sun stop is before (travel 15 to 18 s), Venus after.

## How the orbit view is built (state at 03:45 UTC Nov 21)

- `globe.ts`: stop-local impostor. A back-side shell of radius 1.3, ray-sphere in the fragment shader, analytic limb coverage (clean at every tier, no haze, no glow at the limb from air). Shade = (curve(ndl) - night) x limb(mu) x relief lift + night. `curve.json` holds both tables, measured from the hero by `wrap/curve.py`: the hero brightens up to 2.46 times toward the lit limb (mu below 0.5), separate from the ndl curve.
- Lens glow outside the lit limb is a film layer in the same shader (the sky slides behind the globe in the hold, so it cannot live in the sky patch). It follows curve(dot(limb normal, Sun-in-sky direction projected on the image plane)), gated by the light on the limb. Hero glow is centered on position angle about 68 degrees (toward the Sun in frame), not on the light vector (57 degrees).
- `sunplate.ts`: the Sun is stop-local. The engine Sun cannot match the hero (flat pale disc, core dot, wide glow), so `sunGlare` is 0.012 and a sky-fixed additive plate draws the hero Sun (hero pixels plus two outpaints to complete the disc), fixed to the hold camera at holdMid, breathing with a sine that is zero at holdMid. In the arriving travel it fades in with smooth(ramp(0.25, 0.8, u)), the same ramp the engine uses for the Sun's glare; in the leaving travel it fades out with the same ramp. The plate carries no stars (polar low-percentile smoothing past 1.2 Sun radii).
- Sky patch `sky-hold.webp` (3520x1980 full, half for web, gain 4 with skyExposure 0.25): hero sky with the planet removed, minus the Sun plate, minus the film's bloom (frame 615 rendered with the rim glow off and a black sky patch). Hero stars kept between 1.012 and 1.3 radii on a star-free filled background, so no rim glow is baked in the sky.
- Wrap v1: `wrap/guide.py` (real mosaic graded to the hero's albedo statistics) then `wrap/match.py` (hero-2x pixels divided by the fitted shade, faded out between view cosine 0.42 and 0.2, tone ratio carried to the limb). The far side is still the unpainted guide.

## Measured (frame 615, review tier, hero vs film, scene luminance)

- Disc: night side ratio 0.96 to 1.10 by radius, day side 0.98 to 1.01 by ndl band.
- Sky: low-pass luminance ratio film/hero median 1.018 (10th to 90th percentile 0.969 to 1.057).
- Hero Sun: center (2690.65, 175.88) hero px, radius 564 px (9.4 degrees).

## Still to do, in order

1. Lens ghost in `near` (hero position (455, 1257) native, soft white-orange oval, red fringe), breathing veil.
2. Painted far side (gnomonic tiles repainted by the image model; lon 55 to 115 and poles first). The guide is flat grey past latitude 85 and has dark blobs near the north pole.
3. Height map: real DEM on the far side, shape from shading on the hero side. Then `wrap.height: true`.
4. Rise azimuth positive (about +15 to +40) so the Sun leaves the frame.
5. Dive patches (5 levels), terrain relief from `out/work/mercury/close-2x.png` (run `tools/ml/checkmoved.py` first), terrain sky patch with the Sun blob, plan values, glare cover in `near`.
6. Checks: `npm run measure -- --stop mercury`, compares at final, sheets at review, crops.

## Decisions

- Terrain: spot near the terminator, light about 8 degrees above the local horizon, heading = light azimuth turned 26 degrees right, horizon tilt about 10.7 degrees, dip about 6.8 degrees at vfov 60. The terrain Sun comes from the terrain sky patch.
- Cover: engine cover as a warm flash plus stop-local glare streaks in `near`.
- Mars open items to avoid: covers that read as a cut, stepped disc edge, razor night limb, smeared far side, blown areas, no soft terminator in the rise, soft shadowed foreground, hard horizon glow edge, repeated patterns.

## Engine facts that matter here

- Render order: sky, `world`, `near` (depth cleared), dust, cover. Camera at the origin; the world group sits at origin minus camera with `state.rotation`.
- Sky patches: replace mode, coords = aim^-1 x world ray, orbit aim = frame rotation x hold camera at frame 615. Patch weight 1 in hold, dive, terrain; 0 for the orbit patch in the rise; arriving travel smoothstep(u, 0.2, 0.8); leaving travel 0.
- Travel from the Sun (index 0): the Sun set fades out and the engine Sun fades in over u 0.3 to 0.42 at Mercury's `sunRadiusDeg`; glare mixes to Mercury's value over u 0.25 to 0.8.
- `plan.sunDir` (where the Sun is drawn) comes from `fit.sunInFrame`; `plan.lightDir` shades the globe. They are 62 degrees apart in the hero.
- Post: bloom 6 levels, filmic, vignette, grain, sharpen. Stills: `npm run still -- --frame N --tier T --out FILE [--diag nograin]`.

## Generated inputs kept (scratch, `out/work/mercury/gen/`)

- `sky-fill-take1.png` (planet and ghost removed), `sky-wide-take1.png` (hero extended past its edges), `sun-full-take1.png` (Sun completed as a whole disc). Prompts are in `sky/RECIPE.md`.
