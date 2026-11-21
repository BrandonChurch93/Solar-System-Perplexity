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

## Builder notes on the orbit view (04:00 UTC), to do before READY, worst first

1. Hold motion is too subtle. Crops 330 to 375 look the same. Over the 6 s the granulation must visibly crawl, loops visibly flow along their arcs, corona visibly stream, judged on a 400 px wide strip of 6 frames across 270 to 449 (phone size), not native crops. Zero at holdMid means the phase, not the speed. Exaggerate.
2. Sky card may carry only what is at infinity. Corona rays, loop glow and disc edge residue belong on the Sun's layers. Ghost test at draft, same exposure: frames 180, 247, 269, 270, 449, 450, 495, 540. No fixed ray pattern left in the sky when the disc changes size or place, no doubled stars against the film's stars, no jump 269 to 270 or 449 to 450, film stars must not slide across the card.
3. Fix the dark specks at lower left and the hard dark edge right of the upper right loop at the source.
- Main is about to move (optional `weight(time, view)` on a sky patch, faster sky pass, config keys). Merge when the Builder says so.
- 04:09 UTC. Merged main b4ae65c (engine batch 1, engine hash 434d0a5e367a62fd; older stills are stale). Sky patches may carry `weight(time, view)`. Shader cost rule from the Builder: the software rasterizer computes both sides of an `if` but skips a `for` body, so put costly conditional work in `for (int k = 0; k < (cond ? 1 : 0); k++) { ... }` and read textures inside with textureGrad or textureLod.
- Terrain fit (fit.py): ground sphere radius 20.63 camera heights, limb half angle 72.51 deg, down vector (-0.0205, -0.9361, -0.3512) in the approved camera frame, residual 0.2 deg rms. Plan values: horizonDeg 3.2, dipDeg 17.5. Canvas = approved frame times 1.5 (left -0.25, top -0.205), 8192 x 4608; plate = canvas rows 1728 to 4608.
- plate.py: plate.jpg (ground, plus the horizon glow on black above the horizon), loops.webp (approved minus clean, scene values, crop box 0.22 0.08 0.86 0.66), sky arrays for the terrain sky card. Wide take is histogram matched to the centre.

## Terrain view, first build (04:13 to 04:45 UTC)

- First compare at frame 90 was close to the approved close image. Found and fixed:
  - Lens-shaped orange outlines in the sky (the Builder saw them too): loop mesh vertices above image row 0.14 fell back to a negative ground distance (ray misses the sphere, closest approach behind the camera). `stage.groundDistance` now returns -1 for a miss and the loop mesh uses `look.loops.far` (9) there. Gone.
  - Green and red residue at the loop feet in the plate, red strand traces in the sky: the clean centre was `approved - loops layer`. Now the clean centre is the clean take itself inside a widened loop mask (WIDEN 49 px at 5632) and the approved pixels outside it.
  - Black spikes above the feet: the warm filter of the sky part of the loops layer cut the white core of the fountains. Bright extended light now always passes (blurred luminance difference above 0.12 to 0.3).
  - Green blobs in the ground glow of the loops layer: glow green and blue are capped by the red channel.
  - Sky rectangle seam: the wide take's sky gets its own histogram match (pixels more than 2.5 deg above the limb) and a 380 px feather in the sky (90 px on the ground).
- Ground past the plate (camera higher or further back than the approved pose): no apron asset. The ground point is folded back into the covered ground in ground coordinates before it is projected (`stFold` in `stage.ts`): reflection at the near line (image row of the canvas bottom), at the two side lines (image columns of the canvas sides, as angles about the point where the camera's down axis meets the ground) and at a circle 2.6 deg inside the approved limb. Cells keep their true size, seams are mirror lines. Frame 90 never reaches a fold.
- Limb: the band from 2.2 to 1.2 deg below the limb and everything above it is taken from the plate by elevation and azimuth relative to the current limb (`stLimbDir`), elevation scaled by tan(dip now) / tan(dip approved), so rim, glow and flames follow the limb at any camera height. Below the band the ground is multiplied by T(mu now) / T(mu approved), T measured from the plate: lum 0.48 at mu 0.115, 0.31 at 0.18, 0.24 at 0.275, 0.20 at 0.45, 0.16 above 0.5 (fit 0.15 + 0.12 exp(-m/0.35) + 0.25 exp(-m/0.05), m = max(mu, 0.1) - 0.1). Colour is constant with mu.
- Fringe comb (regular vertical bars at frames 0 and 179): the stretch and flicker phases ran at up to 1000 rad per rad of azimuth. Now 37, 83, 151 for the stretch and 113 for the flicker.
- Shader trap: a second `float band` in the ground shader made the whole ground vanish without any message. A missing layer means a compile error first.
- Camera now: frame 0 is 1.45 behind and 0.52 above the approved pose, frame 180 is 0.48 ahead and 0.17 below. Frame 0 reads as the whole arcade over the spot on a strongly curved limb (radius 20.6 camera heights).
- Merged main 9f78a4e (engine batch 2, engine hash 05c29d3a1588e95f).

## Terrain view, second pass (04:45 to 05:45 UTC)

- Merged main 3523b45 (batch 3, sky aim) and 2d2161b (batch 4). `skyAim` in `plan.ts` holds the values printed by `npm run -s aim -- --stop sun`. The Sun's hold shares its sky with Mercury's arrival, so Mercury's aim decides it later; a hold sky patch must fade out with its own weight before the hold ends (the engine drops it at the first travel frame).
- Light of the loops on the ground is a gain, not an added layer: `loops-glow.png` holds clip(blur(approved) / blur(clean), 1, 12) - 1 inside the loop mask, off in the sky and in the columns above the feet. The ground shader multiplies the plate by 1 + map * beat. An added glow gave red smears and then a milky haze; the gain is crisp. Frame 90 means after it: left of the spot film 191/114/53 against approved 183/112/54, under the left foot 248/235/181 against 249/234/179.
- The loops layer is a hue-preserving residual (approved * clip((lum approved - lum clean) / lum approved)). Plain differences left coloured specks.
- Limb between the feet: the fitted limb sits about 1 deg above the approved bright limb line there and the mirrored sky fill was greyer than the approved. Fix: the sky card is dimmed inside the loop mask near the limb (`DIM` in `sky.py`) and the sky part of the loops layer is computed against the film's own frame 90 without loops (`assets-src/sun/terrain/base90.jpg`, review tier, `look.loops.gain` 0). Order of a full asset run: `plate.py`, `sky.py`, `export.py`, build, render frame 90 at review with loops gain 0 into `base90.jpg`, `plate.py` again.
- Dark specks in the sky under the arcade: the warm filter that keeps the approved stars out of the loops layer left holes at each approved star. The holes are now filled with the opened residual (`HOLES` 13 px). Stars of the film's own frame are opened out of `base90` above 2 deg (`STARS`), so they sit on top of the glow.
- The upper left sky inside the widened loop mask is the clean take's sky, not the approved sky. Same style, different stars. Accepted.
- G13 at every 15th frame of the terrain segment: 0 percent soft on every frame.
- Motion: the loops carry small packets (`flow`) and large swells that run from the left foot to the right in about 2.4 s (`swell`, off within 0.45 s of the judged frame so frame 90 stays the approved picture).

## Rise (from 05:30 UTC)

- `src/stops/sun/flare.ts`: one full-screen additive layer anchored on a world point (in the terrain view a point between the feet lifted toward the crown, in the orbit view the plan spot). Core, halo with rays, a thin streak. Amount rises over `before` seconds to the cover centre and falls over `after` seconds, so the judged frame 247 is clean. The loops surge with it.
- Engine cover colour set to gold, `coverTop [1, 1]`. `dive.altitude` 1.0 so the orbit part starts one radius up: with 0.05 frame 226 was 100 percent soft in G13.

## Milestone 4f393be (06:03 UTC): terrain view and the rise with its flare

- `dive.altitude` 0.7, `rise.settle` 2. G13 on every third counted frame: 0 of 145 frames over 2 percent soft.
- Stand-ins removed, RECIPE has a Files table that names every shipped file as `public/assets/sun/<set>/NAME` (G11).
- Sets on disk then: full about 34 MB, web about 11 MB.

## Hold rework (from 06:05 UTC), Builder notes 1 to 3

Rule adopted: every hold frame must look as good as frame 360. A motion term that damages a still is wrong, however visible it is. Every term is still zero at holdMid, so frame 360 is the hero.

- First exaggeration failed: a luminance-phase twinkle (difference of two sines, reaches 2) drew contour rings on the globe away from frame 360, and the prominence brightness wave went negative (teal gashes in the upper right prominence at frame 270 and 414).
- Globe now: `cell` twinkle is a difference of value noise at two times (`churn`), clamped at 0.35; boil reach 0.0018, max 0.006; `spinDegPerSecond` 1.6 so the surface visibly turns over the 6 s.
- Corona now: a procedural `stream(angle, ln r, t)` (hash value noise, 40 and 96 cells around, periodic) brightens and dims the rays as it runs outward. The old texture flicker is gone.
- Prominences: the brightness wave is `exp2(surge * strength * run)`, so it cannot go negative. `prominence-flow.png` alpha (position along the strand) is now measured from the outward direction at the foot, so its wrap seam lies inside the disc, and the strength channel fades to zero within 0.03 to 0.12 radii of the foot point, where the angle turns too fast (spoke pattern).
- Phone strip measure (`out/work/sun/change.py`, mean absolute difference between frames 36 apart at 400 px wide): disc about 21, corona about 11, sky about 5 of 255.

Sky card, infinity only (Builder note 2):
- Found: the old card was hero minus the film's own halo outside 1.46 radii. Everything the corona model did not reproduce (ray ends, chevrons at the top and bottom frame edge, grain) stayed in the card and would slide against the Sun, because the camera orbits 6 degrees in the hold (about 225 px of sky shift).
- Now: the card is only the generated empty sky (`out/work/sun/sky-fill-take1.png`, upscaled 2x to `sky-fill-x.png`), with its floor (7 px opening) and its stars (the rest) each mapped by quantiles onto the hero's floor and stars measured beyond 1.9 radii (`orbit/infinity.py`). No hero pixel is in the card.
- The corona carries every ray: hero minus the low-pass of that sky, hero data as far out as the corona is at least about twice the sky (`TRUST` 0.3 of the total), a monotone envelope along the radius beyond 1.25 to 1.42 radii, then the power law. Stray orange Milky Way clouds at 1.34 to 1.58 radii on the right were in the prominence matte; detached pieces now have to start below 1.2 radii.
- The engine's own stars do not show through the card in the hold (checked at one bright engine star: 255 without the card, 15 with it).
- Level pass (`orbit/match.py`): the lens bloom adds a veil that the old card had swallowed. One pass: render frame 360 at review without `level.npy` and `veil.json`, compare floors with the hero in polar form, scale the corona by a smooth factor (6 degrees across, 0.02 in ln r, limits 0.3 to 1.5), and take what the corona cannot absorb out of the card as a function of radius only.

## Hold, second pass (06:47 to 07:10 UTC)

- Merged main 45d1651 (engine batch 6: travel cameras, dust, sky lock, ending; engine hash 704d5d55f51b7b15). 35 tests green before, to run again. `npx tsx assets-src/travel/probe.ts`: `sun.travel` join in at 450 turn 0.035 to 0.035 deg per frame, speed 8.19e-2 to 8.15e-2, departing body in view 450 to 472.
- Corona hides what is behind it: alpha = `hide.amount` (0.92) times smoothstep(0.012, 0.07, luminance of the corona texel), blend One / OneMinusSrcAlpha. Film stars no longer shine through the glare near the limb, as in the hero. The level pass (`match.py`) ran once more after it. Floors film against hero at review: far 0.0319 / 0.0322, 1.5 to 1.9 radii 0.0608 / 0.0589, 1.25 to 1.5 radii 0.1668 / 0.1661, 1.08 to 1.25 radii 0.3481 / 0.3491.
- Corona stream has a slow part (11 cells around) so the six phone frames differ; sway 0.0024 with little change along the radius (2.5 and 4.0 rad over the layer), because at 0.004 with 7 and 11 the rays bent into curls at frames 270 and 449. Rule kept: rays stay straight.
- Phone strip numbers (`change.py`, frames 36 apart, 400 px wide, of 255): disc 19 to 26, corona about 9, sky 4.6.
- White smears on the disc at 0.93 to 0.99 radii (found in a native crop of the upper left limb): the far side fill of the wrap comes from the hero's centre, bright and contrasty, and the shader multiplies the limb by 2. Fixed in `wrap.py` (`level`, `level_at`): the fill takes the hero's low-pass colour and local contrast in a zone around the limb, highlights capped and kept warm. Wrap take 3 is in. Limb at frames 270, 360, 449 checked beside the hero: orange, no smear.
- Sky card stars: density map (hero local star light / card local star light, 160 px Gaussian, beyond 1.6 radii, limits 0.5 to 1.7) so the band has as many stars as the hero. Measured at 1920 at the final tier the stars of the dark field came out 24 percent brighter than the hero's (band equal), so the dark field stars are trimmed by 0.8 (`TRIM`). To verify at final.
- Tools: `npm run seq -- --first A --last B --tier draft` renders a range in one browser (11 s a frame). `out/work/sun/jump.py DIR` prints the difference between neighbours and flags a jump.
