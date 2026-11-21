# Mercury notes (stop agent memory)

Read `assets-src/shared/STOP-AGENT.md` first, then this file.

## Where things stand

- Branch `agent/mercury` (code, JSON, notes). Looks go to `agent/mercury-looks` through `npm run looks -- --push --folder mercury --note "..."` only, at least every 30 minutes.
- Parent is `/root` (the Builder). Milestone messages: orbit view, terrain view, dive and rise, then `READY`. Each with commit, measured numbers, weak points. Do not wait for replies.
- Builder's notes: web set at most 35 MB on disk, full 150 MB. Engine requests early as `assets-src/mercury/engine.patch` (request 1, `terrain.rollDeg`, is on main). Travels before the hold and after the rise must stay free of pops (judged in Phase 5).
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

## Session 2 (03:47 to 04:15 UTC): what changed

- Registration: the Sun plate and the sky patch are fixed to `plan.hold(holdMid - hold.start).quaternion x drift(plan.holdMid)` (`drift` from `director/rig`). The film's disc sits (2.11, -1.41) px at 1080p off the hero's from the engine's camera drift; accepted.
- Lens ghost in `near` (`lens.ts`, `look.lens`). It was about (-7.3, -5.7) px at 1080p from the hero's: nudge left.
- Night side: the map's night side is the painted guide times a scalar level (0.88), not hero pixels (the hero night side is smooth and carries lens artifacts). Shader: `col = (ground * lit + mix(vec3(nightFlat), ground, nightDetail) * night * (1 + nightVeil * smoothstep(nightVeilFrom, 1, mu))) * tint`. Night ratio film/hero by radius 1.05, 1.07, 1.00, 1.07, 1.07, 1.01; day by ndl band 1.00 to 1.04; rim glow outside the limb at 1.006 to 1.012 radii 0.77 to 0.93 (a little low), good farther out.
- Guide v3 (`wrap/guide.py`): color and low-frequency albedo from the real color mosaic (blur 7 px at 4096, graded to hero statistics, polar fade 58 to 74 degrees), crater structure from the real DEM at 8192 with light baked for the film's Sun direction (the hero carries its relief the same way), `MARK 0.22`, `STEEP 2.5`, `SOFT 0.05`, `UNIT 0.5`, `LOW 0.6`. v1 (mosaic only) kept the seams and blocks of the mosaic; v2 (non-directional marks only) gave blobby "lichen" takes.
- Tiles (`wrap/tiles.py cut|build`): 38 gnomonic tiles of 2048 px (e0 to e9, n0 to n7, s0 to s7, np0 to np4, sp0 to sp4, np, sp). Each is repainted by the image model with `style.jpg` (hero day region) as the style reference, prompt `wrap/prompts/tile.txt` (`tile-pole.txt` for np, sp), checked with `wrap/flowcheck.py`, low frequencies locked to the input at sigma 24 px, splat back. Takes so far: `a1` nano on all 38 (old guide), `b1` seedream on e7, n6, np, e2, `t1`/`t2` old; round on guide v3: `c1` seedream and `d1` nano on all 38 (running at 04:11).
- Height map (`wrap/height.py`): real DEM at 4096x2048, flattened to its 40 px low-pass where the hero day pixels are kept (the hero carries its own shading). `wrap-height.bin` uint16, `assets.ts` `wrap.height: true`, shader relief by normal perturbation, mild.
- Merged `origin/main` b4ae65c (engine hash 434d0a5e367a62fd): stills before it are stale. Shader tip from the Builder: expensive conditional work goes in `for (int k = 0; k < (cond ? 1 : 0); k++)` with `textureGrad`/`textureLod`.
- Terrain inputs: `out/work/mercury/close-2x.png` passes `checkmoved` (p99 under 1.5 px). Depth: `out/work/mercury/close-depth.raw` (float32 2816x1584, near = 1). Camera fit `relief/camfit.py` -> `relief/camera-fit.json`: vfov 60 assumed, pitch down -30.05 (camera looks down 30 degrees... sign as Mars: see file), roll -11.27 degrees, dip 10.25 degrees, planet radius 61.7 camera heights, horizon distance 11.15 heights, rms 0.022 degrees.

## Session 3 (04:15 to 04:50 UTC): what changed

- Engine request 1 (`terrain.rollDeg`) is on `main` since 9f78a4e (engine hash 05c29d3a1588e95f). Local patch dropped, main merged (aa3e4fb). `engine.patch` and `ENGINE-REQUESTS.md` stay as the record. Check script: `npx tsx out/work/mercury/check-roll.ts <rollDeg> <altitudeScale>`. With `terrain.rollDeg: 11.27`, `horizonDeg: 19.8`, `dipDeg: 10.25`, `dive.swoop: true`, `rise.level: true`, `dive.altitude: 0.0162` the ground's up vector and the pitch carry across both covers (tilt 11.27 vs 11.75 and 10.59 vs 11.27; pitch 33.91 vs 33.83).
- Rise: azimuth 12 (was 32). At 32 the far side filled a third of the disc and washed out; at 12 the rise shows a half-lit globe with the terminator, mostly hero pixels, the Sun out of frame at the lower left, the far side only at the lower-left limb (lon 75 to 113).
- Glare gate (`look.light.glareGate [0.616, 0.766, 0.35]`): limb brightening and rim glow are lens glare, so they only apply where the drawn Sun is near the view ray. Frame 615 numbers did not change.
- Guide v4 (`wrap/guide.py`): large scales of the real color removed (`WIDE 60`, `KEEP 0.35`), color spread 0.6 of the hero's, ring term from DEM slope where the Sun is high (`RING 0.14`), marks reduced 60 percent under a high Sun. The v3 high-Sun zone was pale cream blobs.
- Tile takes: `c1` seedream and `d1` nano on guide v3 for all 38; `c2` seedream on guide v4 for e5 to e9, n4 to n7, s4 to s7, np3, np4, sp3 (the tiles the film can see lit); `d2` nano on 7 of them. Seedream adds real fine texture and crisp rims; nano keeps the blur and draws embossed white lines, so seedream is used. All kept takes pass the flow check (median under 0.4 px, p99 under 1 px at 2048). `wrap/takes.json` lists the take per tile.
- Terrain margins (`relief/ext.py`): canvas 4096 x 1932 at approved scale (640 px left and right, 348 px below, nothing above). Left and right squares outpainted with nano (take t1 kept; seedream t2 on the left changed the whole picture to orange streaks, rejected), then the gap below with nano (t1 kept, t2 had a visible rectangle). Approved pixels are pasted back exactly. Painted horizon follows the fitted sphere within 1 to 4 px, except the far right edge (5 to 12 px low): the alpha cut uses the detected horizon in the margins.
- Relief build (`relief/geom.py`, `relief/build.py`): distance = sphere ground model x exp(detail), detail = high-pass (300 px) of log(depth fit) minus log(sphere), gain 1.6, faded out between 4.5 and 8 camera heights so the horizon stays a clean curve. One layer, alpha cut at the horizon, black masks.
- The `read` tool caches pictures by name: write each picture to a new file name.

## Terrain plan

- Engine class `Relief.load(ctx, base, def, motion)` in a `terrain` group as `src/stops/mars/set.ts`; `ReliefDef` {imageSize, vfovDeg, layers [{color, alpha?, dist, box, distSize, tint}], masks, maskBox, mistDir}; dist files raw float32 at half the layer size; masks black (no mist, no dust on Mercury).
- Distance = fit of 1 / (a x depth^g + b) to a sphere ground model from the camera fit. One layer first; a cut layer only if a sweep shows stretching. Margins outpainted about 12 percent left, right, bottom. Sky cut by alpha at the horizon.
- Terrain sky patch from the close image's sky (stars, Sun bloom at top left near x 730, y 10 of 2816x1584, glow along the horizon). `skyAim: { terrain: [...] }` in `plan.ts`.

## Still to do, in order

1. Choose tile takes (`takes.json`), `tiles.py build`, `match.py`; look at the far side from the rise angle. Re-render the hold compare, re-measure with `tools/probe.py ... align`, tune relief strengths, nudge the lens ghost, sheet of the hold, check the travel to Venus for a pop.
2. `sky/RECIPE.md`, `wrap/RECIPE.md`. Orbit milestone message (merge main first, commit binaries).
3. Terrain view (plan above), then dive patches (5 levels, at most 2x apart), dive and rise (azimuth positive +15 to +40, glare cover in `near`).
4. Checks: `npm run measure -- --stop mercury`, compares at final, sheets at review, crops. `READY`.

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
