# Sun stop notes

Lab notebook of the agent that builds the `sun` stop. Branch `agent/sun`, looks on `agent/sun-looks`.

## Standing facts

- Segments in order: `sun.terrain` (frames 0 to 179), `sun.rise`, `sun.hold`, `sun.travel`. No dive.
- Judged frames: 0 (frame 0), 60 (hook), 90 (terrain), 247 (rise), 360 (hold), 495 (travel).
- Approved images: `references/approved/sun-hero.png`, `references/approved/sun-close.jpg`, both 2816 x 1584.
- VM: 4 cores, 7 GB RAM, 17 GB free disk at the start.

## Log

- Start. Cloned, branch `agent/sun`, `npm ci`, build green. Stand-in compare frames rendered at draft for hold and terrain and pushed as the first looks.
- 03:05 UTC. Reading done (engine, Mars set and plan, relief, cover, sky, measures, recipes). Merged origin/main (2cbceef). Media skill loaded; image tools are `generate_image` (seedream_5 is the model of the approved images), called through the exec tool.

## Builder notes (03:10 UTC)

- `public/assets/sun/web/` at most 35 MB on disk (not 40). Full stays 150 MB. Film is rendered from full.
- Engine requests are expensive for every stop (the hash moves). Keep everything stop-local when it can be. Decision: no engine request for the sky. The hold sky is drawn by my own set as a far card (vertex shader pins it at the far plane, normal blend over the engine sky, alpha left untouched), so its weight is mine and nothing pops at frames 270 and 450.
- The set must also behave in an arriving travel (other stop's travel into the Sun's hold, FarPoint pattern from Mars) and in its own leaving travel. Judged in Phase 5; keep free of pops.
- Frame 0 is the poster frame, first two seconds judged at phone size (R6): finished picture at frame 0, plasma visibly flowing from the first frame.

## Engine facts that shape the design

- Post cannot be changed per stop. Bloom is mix(hdr, bloom, 0.08), streak from values above 14. So glare has to come from real HDR values in my layers.
- Approved pixels used as textures go through `inverseFilmic`, divided by `shot.post.exposure`, with the lens vignette undone.
- Terrain view is its own stage: origin at the spot, camera pose from `plan.terrain(tRel)` = (side u, rise u, -forward u), u from -0.5 to 0.5, looking down -Z at u = 0. Units are mine: camera height 1.
- Rise: terrain view with exit offsets until the cover centre (frame 216), then orbit view from `spot + normal * dive.altitude` to `hold(0)`. The Sun has no dive, so `dive.altitude` only sets where the orbit part of the rise starts. A high start (0.3 to 0.5) keeps G13 easy.
- Sky patch weight is fixed by the engine: 1 in hold and terrain, 0 in the orbit part of a rise and for the leaving stop in travel. For the Sun (rise goes into hold, then travel) that pops at frames 270 and 450. Needs an engine request (an optional weight on the patch, off by default). Not yet written.
- G13 counted frames: 0 to 207, 224 to 449.

## Geometry read from the approved images

- Hero: disc centre (1410.4, 791.8) px, radius 662.3 px, vfov 30, camera z 4.574. Frame reaches 1.196 R up and down, 2.13 R left and right.
- Close: horizon top at about y 0.47 of the height, drops to 0.55 at the left edge and 0.60 at the right. With vfov 55 that is a ground sphere of radius about 32 camera heights, dip about 14 degrees, horizon about 8 camera heights away. Sunspot centre near (0.52, 0.60), arcade feet at (0.375, 0.51) and (0.73, 0.555), apex near y 0.15.

## Design

Orbit view (all stop-local modules in `src/stops/sun/`):
- Globe: emissive sphere. Wrap 8192 x 4096: hero pixels from the 2x copy on the visible side with the limb curve f(mu) divided out, painted far side. Shader multiplies by the measured limb curve at the real view angle. Granulation boil by two-phase flow warp of the wrap along a small flow texture. Active regions pulse through a mask. Patch level(s) around the spot for the rise, copied from the Planet patch logic.
- Corona: one layer on a camera-facing shell, polar texture (angle, radius) from the hero with stars and prominences removed, extended past the hero frame. Angle is measured around the camera to centre axis against a body-fixed up vector, so the hold reproduces the hero and no view has a pinch. Radial two-phase streaming, shimmer, slow angular drift. Covers the disc edge.
- Prominences: card in the hero limb plane (z = 1/4.574 in body space), hero pixels with matte, turning with the globe. Flow along each loop (angle about a loop centre) plus rain along the radius.
- Sky patch: hero sky minus what the film draws itself (corona, prominences, glow), filled behind the disc by one generated image.

Terrain view:
- Ground: image-space grid mesh from the fitted close camera, each vertex at its distance on the ground sphere (radius about 32) plus relief from the picture (cells domed, lanes low, umbra depressed). Texture is the clean plate (close image without loops, min with the approved pixels) at 5632 wide plus side aprons outpainted in the same projection. Foreground apron below the frame as a top-down granulation map (cells at the size of the picture's near cells), blended in over about one cell.
- Loops: additive layer = approved minus clean plate (scene values), on cards hinged on the foot to foot axis with different lean so arcs separate in depth. Flow in bipolar coordinates of the two feet (tau runs foot to foot). Plus true 3D strands (camera-facing ribbons along arcs, streak texture scrolled along them) near the camera so the camera passes under loops in the first two seconds.
- Flow on the ground: cells churn (two-phase warp), penumbra filaments creep toward the umbra centre, spicule fringe flickers on the horizon.
- Sky patch from the close image above the horizon.

Rise: terrain camera lifts and tips toward the surface, a flare grows from the left loop foot (stop-local HDR layer driven by `shot.cover.amount`), plan cover colours gold, then the orbit view starts high above the spot and pulls back to the hold.

## Memory budget, full set (limit 1400 MB, mips count 4/3)

| Asset | Size | MB |
|---|---|---|
| wrap | 8192 x 4096 | 179 |
| spot patch level 1 (and 2 if the predictor asks) | 4096 x 4096 each | 89 each |
| corona polar | 4096 x 1024 | 22 |
| prominence card | 4096 x 4096 | 89 |
| sky hold, no mips | 3520 x 1980 | 28 |
| ground plate with side aprons | about 7040 x 3168 | 119 |
| loops layer | 5632 x 3168 | 95 |
| top-down apron | 4096 x 4096 | 89 |
| sky terrain, no mips | 3520 x 1980 | 28 |
| distance, masks, flow, noise, strands | small | 40 |
| total | | about 870 |

Web set is every file at half size: about 220 MB (limit 450).

## Log, continued

- 03:08 UTC. `hero-x2.png` done (5632 wide, `tools/ml/upscale.py`). `orbit/wrap.py` run: 8192 x 4096 wrap, hero side from the 2x copy with limb curve (0.33 + 0.36 (1 - mu)) / 0.33 divided out, hero weight fades over view cosine 0.2 to 0.42, far side from 12 rotated hero caps. Not yet checked for seams at native size.
- 03:14 UTC. `src/stops/sun/globe.ts` (emissive globe: wrap, limb curve, rim, boil by two-phase warp along the map's own low-pass luminance gradient with zero displacement at holdMid, region pulse, HDR boost of the hot cores, patch levels, diag outputs) and a first `set.ts` with globe and FarPoint. First hold compare: disc matches the hero in place and colour. No corona, prominences or sky yet.
- 03:54 UTC. Orbit view milestone, commit 9fbb610. In: globe (wrap, limb curve, single-phase boil wobble along the low-pass luminance gradient, cell twinkle, region pulse, HDR boost), corona shell from the polar texture (hero data to 1.42 R, power law beyond), prominence card with flow texture (warp plus running brightness waves along the strand angle), own sky card (hero minus film, generated fill behind the disc, take 1). Two-phase warps were dropped on the globe: any blend of two displaced copies softened the surface between phase ends. Frame 360 equals the hero by construction (every motion term is zero at holdMid).
- Weak in the orbit view: corona layer under the big prominences is a smooth estimate; a few dark specks in the corona left of the lower left prominence; hard dark edge in the corona right of the upper right loop; far side of the wrap not checked at native size; no patch levels yet for the rise; hold motion only checked on four draft frames.
- Terrain plan (04:00): everything is projected from the approved camera (the terrain stage frame is the approved camera frame at u = 0), so frame 90 gives the approved picture back for any geometry. Assets: wide clean plate 8192 x 4608 canvas at 1.5 times the approved field (centre from the 2x close image, outside from one outpaint take, loops removed with one clean take), loops layer = approved minus clean, sky card for the terrain. Geometry: ground sphere cap from the horizon fit, backdrop sphere at the horizon distance for the fringe, loop sheets hinged on the foot axis with different lean, near strands as ribbons.
- Generated so far for the terrain: `out/work/sun/close-clean-take1.png` (loops removed, take 1, good), `out/work/sun/close-wide-take1.png` (outpaint of the close image at two thirds scale on a grey canvas, take 1, good). Both being upscaled to 5632.
