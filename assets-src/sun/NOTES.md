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

## Foreground of frame 0: the apron (07:20 to 08:00 UTC)

- Fault: the near ground of frame 0 (the poster frame) was a smear in both lower corners and along the bottom.
- Cause, measured: not the boil (off, same picture) and not the fold (stretch at most 1.6). The generated wide take around the approved image is only 1672 px wide and not true to the ground, and it covered 71 percent of the ground at frame 0 and 39 percent at frame 60 (`out/work/sun/reach4.ts`). All of that near ground lies inside the frustum of frame 0 for frames 0 to 80.
- Fix: a second painted plate, the apron, projected from the frozen frame 0 camera (`src/stops/sun/apron.json`, written by `npx tsx assets-src/sun/terrain/apron-pose.ts`; it does not follow the plan). `src/stops/sun/apron.ts` gives `apImage`, `apUv`, `apWeight`. Weight = (1 - inside the approved frame, feather 0.04) x near fade (ground distance 3.0 to 3.6 from the point under the frame 0 camera) x (1 - smoothstep(0.08, 0.1, distance outside frame 0)). Frame 90 never sees it.
- `ground.ts`: one `for` loop for the approved plate (w < 1), one for the apron (w > 0). `surface()` holds boil and twinkle for either map. Apron tone = stLimb(now) / stLimb(seen from the frame 0 camera). `look.ground.apron = { amount, cell, calm }`: cell 0.1 (boil cell of the apron; 0.3 bent the near cells into swirls at frame 60), calm 0.
- Asset run (all with `PYTHONPATH=assets-src/sun/terrain`): base = frame 0 at draft, `--diag nograin`, boil reach 0, twinkle 0, apron amount 0, saved as `out/work/sun/apron-base.png`; `apron.py mask`; one generation (take 2 kept, prompt in RECIPE.md); `apron.py register` (ECC affine, cc 0.93); `python3 tools/ml/upscale.py --in out/work/sun/apron-crop.png --out out/work/sun/apron-crop-x2.png --width 5504`; `apron.py build`.
- Green specks at frame 0 (8 pixels with G > R + 10): the channel scaling in `build` (base mean over take mean) pushed near-white glints toward green. Now the scaling fades out above 170 to 245 of 255. Frame 0 after: 0 such pixels.
- Test passed: with the base itself as the apron, frame 0 came back in place.
- Known weak: at frame 60 the lowest 140 rows show apron ground that frame 0 has at rows 733 to 800, enlarged about 2 times. Texel rate there is 1.6 per pixel (G13 fine) but the painted cells are fibrous at that size, softer than the approved plate above them. A fix would be a third plate for that band or an unsharp pass in `apron.py build`.
- Never `git checkout src/stops/sun/look.ts` for temporary edits; edit back by hand.

## READY sent (08:12 UTC), head 417dfcd, main 558e3a5 (batch 7) merged

- Build green, 35 tests. Gate G11, G12, G15 pass (sun/web 148 MB, sun/full 593 MB of texture memory). G5 pass (coverage 0 0.571, 60 0.528, 90 0.511, 247 0.366, 360 0.309). G17 pass at final: 0 1.003 (p25 0.732), 60 1.284, 90 1.027, 360 0.993.
- G13 not run at every frame. Texel check on 0, 20, 40, 60, 80 with the apron: 0 soft, lowest rate 1.41 at frame 80.
- Named as weak in the READY message: frame 60 lowest 140 rows (apron enlarged 2 times), flare core reads as a ball at 196 to 204 and the cover centre is flat gold 212 to 220, corona under the big prominences, star trim not verified at final, clean-take sky at the upper left of the terrain view, travel in and out only checked for jumps.
- While the critics are out: flare first, then the frame 60 strip.

## Flare rework (08:14 to 08:40 UTC), after READY

- Merged main 48a2bfc (engine batches 8 and 9, all eight stops' folders; engine hash a3d211c425dc0406) as 443c9a0. Frame 90 identical before and after; 0 and 204 differ by 1 level in the sky only; 360 on 2,603 pixels (world pin rounding). My set uses no shared Relief and no haze shell, so shield and trim do not apply. Round 10 runs from that head.
- Fault: the flare was a soft white ball hanging in the air between the feet at 196 to 207 (anchor was a point between the feet lifted toward the crown, core power 2.2).
- Now the flare belongs to the arcade:
  - `loops.ts` `burst`: the loops layer is multiplied by 1 + surge x amount x (floor + (1 - floor) x climb), climb = exp(-along / reach) + other x exp(-(1 - along) / reach), reach grows from 0.03 to 0.55 of the strand with the amount, so the white heat climbs from the feet to the crown. Only texels brighter than `from` (0.03 to 0.18 scene luminance) are lifted: without that the faint residue of the layer came up as blotches and combs beside the feet.
  - Two screen kernels (`flare.ts`, two instances): on the left foot and, 0.12 s later at half gain, on the right foot, both 0.06 above the ground. Core power 1.6, radius 0.006 to 0.42, gain 30; rays amount 1.6.
  - Ground: the loop light gain map is multiplied by 1 + 6 x amount (`look.flare.ground`), so the ground under the arcade lights up.
- Cover colour: the old gold (2.4, 0.68, 0.11) was darker than the white frames around it (mean level 216 at 212, 167 at 216, 216 at 220: two flashes with a yellow card between). Now cover (2.8, 1.05, 0.28), low (2.6, 0.85, 0.19): mean 222 at 212, 192 at 216, 219 at 220.
- In the orbit part the kernel sits on the plan spot and dies into the white active region by frame 237. Frame 247 is clean (amount 0 after 1.0 s).
- Tool: `python3 out/work/sun/strip.py DIR OUT COLS WIDTH frames...` makes a contact strip from a `seq` folder.

## Ground motion that damaged the stills (08:40 to 09:00 UTC)

- Found on frame 60 at final, native crops: the whole ground had a melted marble look (wavy contour lines in every cell), and frame 0 had concentric rings in the near cells. Neither is in the plates.
- Cause 1, the boil: the warp along the luminance gradient was clamped to a fixed length (0.14 of a cell), so its direction flipped across every lane and cell centre and stretched the picture there (about 25 px at 1920 in the near field). Now the push is soft limited (`push /= sqrt(1 + |push|^2 / max^2)`), `boil.reach` 0.25, `boil.max` 0.06. Mean absolute difference to the picture with no boil on frame 60: 19 before, about 10 now. At 0.09 the marble starts to come back.
- Cause 2, the twinkle: its phase was the plate's luminance times 60, so away from frame 90 it drew contour rings inside each cell (the same fault the globe had). Now it is value noise on the ground plane in a third time dimension: `vnoise(g * spread, t * rate) - vnoise(g * spread, 0)` plus one finer octave, `twinkle = { amount 0.5, rate 0.9, spread 4 }`. Cells brighten and dim by about 15 percent, no rings. Two texture reads fewer per pixel.
- Frame 90 is byte identical to before (both terms are zero at the judged frame).
- Still open on frame 60: below row 935 the apron's painted cells are about 2.5 times larger than the approved cells just above them and softer (0.7 real pixels per frame pixel). Next: a plate painted from the frame 60 camera for that band.

## Apron painted again, true cell size, three tiles (08:53 to 09:05 UTC)

- Fault on frame 60 (and on frame 0, less plain): below row 935 the painted cells were about 2.5 times the size of the approved cells right above them, and soft. Cause: my own prompt for the first apron asked for cells "three times as large" at the bottom edge. `out/work/sun/dist.ts` gives the true numbers: the ground at the edge of the approved image is 2.6 camera heights from the frame 0 camera, the ground at the bottom row 1.87, so cells grow 1.4 times in width. On frame 60: 1.70 to 1.52, growth 1.12.
- New plate: same projector (`apron.json`, frame 0 camera), same file name and size, but painted in three tiles of 2752 x 1548 on a 5504 x 1548 canvas (`assets-src/sun/terrain/apron2.py`: `start`, `input C`, generate, `place C`, then L and R, `build`). 2.87 painted pixels for each pixel of frame 0, about 1.4 for each pixel of the near band on frame 60 (was 0.7).
- Tile C take 1 with the lower half of the approved image as a style picture pasted that picture into the grey area (a second sunspot). Lesson: no style picture that has the same layout as the tile. Take 2 without it is kept; L and R first takes kept. 4 of 6 takes in this round.
- Checked at draft: frames 0, 30, 60 lower parts at native size, no scale jump, no seam between tiles, 0 and 1 green pixels. Frame 80 texels: 0 soft, lowest rate 1.41 (as before). Frame 90 unchanged (never sees the apron).
- Rise sheet at review with the reworked flare viewed: feet erupt at 204, gold cover with the arcade inside at 212 and the disc inside at 220, kernel on the disc at 229, gone by 245. Reads as one move.

## Round 10 result (09:31 UTC), first of three rounds, judged at 6ddfe8c

Scorecard on main: `scorecards/round-010/` (SUMMARY.md, R1/R3/R4 json, key.json). R1 7, R3 5, R4 4, R2 pass, R8 pass, G5 G13 G17 green. 1 severe, 14 major. Two rounds left. Sheets are 480 x 270 cells.

Corrections from the Builder, worst first (motion first):
1. SEVERE, rise cover 211 to 222: two sides are not one move. Terrain side skims low over a nearly flat horizon (limb at y 155 to 185 of 270), orbit side is a globe about 280 px wide with its top limb at y 35. Terrain camera must climb and pull back before the cover so limb height and curvature agree on both sides; more frames for the cover.
2. MAJOR, glare 204 to 237: white starburst on the left foot at 204 to 212, flat drifting yellow clouds 214 to 218 (the engine cover), kernel jumps to the disc centre 220 to 229, gone abruptly by 237. Glare must stay locked to the active region and exposure must ramp smoothly.
3. MAJOR, camera 221 to 269 and hold: pitch overshoot (top limb y 35 at 222, 7 at 237, 23 at 261), star drift jerks 245 to 270, pull back stops at 269 then creeps inward over the hold (push -0.03). One eased move, no overshoot, no reversal, no creep.
4. MAJOR, match (R1): frame 90 arch, loop strands and spicule glow brighter than approved, highlights cyan white instead of amber; on 90 and 360 dark lanes, penumbra, spot shadows lifted (flatter, slightly warm).
5. MAJOR, near field of terrain (0, 60, 90): soft amber blobs along the bottom, diagonal streaks and whorls with a glossy molten look, radial pinch round a featureless black spot (frame 60 crop A), dotted tracks and cross marks (a mesh) inside the main arch (frame 0 crop H). Frame 90 bottom strip y 866 to 1080 soft with streaks toward the corners. Frame 90 middle ground reads glossy, wet, cells repeat.
6. MAJOR, rise 247: stars in the lower and left sky are short diagonal dashes while the upper sky has sharp points; corona under the lower limb is a brushy mass of vertical strokes ending in grey haze.
7. MINOR: mirror seams in the star sky 245 to 449 (card padded by reflection; outside the border fade into the film's sky, inside nothing may change; `python3 tools/assets/mirrorcheck.py` on main); un-eased start at frame 0 and the reversal of travel 188 to 204; uniform comb spicule fringe with a doubled glow band; one curl motif repeated over the disc; prominence ribbons hard edged and saturated red at 247; loops read as steel wool spark trails; soft round star dots at frame 0. R1 one to two pixel offsets are not to be chased.

Engine facts read for the rise (src/director/moves.ts): cover window fixed by config (208 to 223, centre 216). Before the centre the pose is `terrain(time)` plus exitHeight, exitForward, exitPitchDeg times g = ramp(0, 0.489, u)^2.2 (0.643 at the centre). After it: from = spot + normal x dive.altitude + heading x ahead, e = 1 - (1 - x)^settle, altitude grows geometrically in e, vfov mix(55, 30, smooth(e)), with `rise.level` the horizon is carried (limb `horizonDeg - exitPitchDeg x 0.643` degrees above the frame centre) and goes to the hold framing with smooth(e); blend into the hold pose over u 0.6 to 1. The set's `world` group is placed by the engine against a camera at the origin, so my `terrain` group can carry its own extra transform (a camera path of my own on the terrain side) and the orbit group can be drawn inside the terrain view.

## Corona and sky card from hero pixels (09:10 to 09:55 UTC)

- `orbit/stars.py` (new, runs first): star detection on the hero; components longer than 11 px within 1.7 radii are strands of the Sun, not stars. `halo.py`: fine detail back in the rays, strand detector lifts the trusted reach. `infinity.py card_scene()`: generated floor plus hero stars near the Sun, hero minus exported corona beyond the reach. `sky.py`: margin is edge extended low-pass plus wrapped fine detail, no mirror; inside the border untouched.
- Ghost test at draft, frames 270 and 449 beside the hero: the thin strand above the upper left prominence now stays with the Sun. Two orange specks of 2 px remain in the sky there.
- G17 on frame 360 at final: median 1.013, p25 0.887, min 0.594 (was 0.993, 0.806, 0.405).
- Lesson: the image viewer caches by file path. Always write a picture I want to look at under a new name.
- 09:52 Builder: batch 10 on main (811fbca), merge now. Stepped ghost copies in the fastest rise frames are an engine matter, not mine; no blur tricks.

## Rise rebuilt as one path (10:00 UTC on), round 10 items 1 to 3

- `plan.ts` is now `class SunPlan extends StopPlan` with its own `rise()`. One path in globe space from the end of the terrain glide to the hold pose; the terrain view shows it through `local()` (globe to stage: rotation `toStage`, scale `stage.radius`, centre `stage.centre`), the orbit view shows it as it is. The view switches at `switchTime` (cover centre, frame 216). `coverAmount()` returns 1e-4 inside the window so the engine cloud pass draws nothing but the stop still counts as covered.
- `climb` in `plan.ts`: height geometric in e, e from a table of an asymmetric Gaussian rate (peak at x 0.4), vfov mix(55, 30, e^3), the top limb's height in the frame eased from its value at 180 to the hold's, which fixes the pitch. Blend from the glide over x 0 to 0.14 and into `hold()` over 0.72 to 1. `hold.push` 0 (no creep).
- Probe `npx tsx out/work/sun/path.ts`: limb top y (share of frame height) 180 0.485, 204 0.369, 212 0.208, 216 0.144, 270 0.084, monotone. Height 0.72 units at 180, 5.29 units at 215 (0.256 R), 0.304 R at 216, 1.07 R at 224, 3.57 R at 270.
- `look.ground.cap` 63 degrees (was 42), rings 252: from 5.3 units up the limb is 37 degrees away.
- Flare off, frames 184 to 269 (`out/work/sun/raw1-a.jpg`, `raw1-b.jpg`): limb height and curvature agree on both sides of 216. Seen from high up the stage has concentric streaks beyond the painted plates (212 to 215) and the loops layer shows as a milky rectangle (210 to 215). The surface at 215 (granulation, one spot) and 216 (hero swirls) differ, so the veil must be opaque at the switch.
- `flare.ts` is one kernel now: no rays, no streak, no second foot. Blend One / OneMinusSrcAlpha: a gold veil with a cover alpha (rises first near the anchor, last at the frame edge) plus a wide halo and a hot core that only comes in near the peak (amount cubed). Anchor: midpoint of the loop feet lifted 0.12 in the terrain view, the plan spot on the globe in the orbit view.
- First try (core gain 26, halo 7, veil 3 additive): 14 frames of flat cream white, a white ball in the umbra at 200. Wrong. Levels cut, veil tied to the alpha.
- Tool: `npx tsx out/work/sun/frames.ts --frames a,b,c --dir DIR [--tier draft] [--diag nograin]` renders a list in one browser.

## Rise path, second version, and the grade (10:10 to 10:40 UTC)

- `path(x)` has no blends any more. Start reading `a` = the terrain glide carried on past frame 180 (`coast` 4 s time constant, so near constant speed), end reading `b` = `hold()` at the current time (a moving target, so the orbit rate never dips). A reading is (out, height, level, limb, vfov, rest): `rest` is what is left of the pose's rotation after the frame built from the other five, so the path meets both ends exactly. Height geometric in e, ground track slerp by the linear share of height, vfov mix by e^3, top limb by 1 - (1 - e)^3, `a.rest` out over e 0 to `level`, `b.rest` in with smooth(e).
- `climb.early` 0 (no pedestal), `before` 0.11, `ends` [0.06, 0.25]. Lesson: the mean speed of ground points on the screen must dip at the turn from approach to retreat (forward flow and climb flow oppose), so do not tune for a monotone speed. Tune the acceleration: `npx tsx out/work/sun/flowq.ts A B` prints speed/acceleration per frame in px at 1080. Now the acceleration grows smoothly from 0.02 (180) to 0.84 (192) to 5.4 (206); with a pedestal or a wide `before` it had a bump at 184. Speed 5.9 at 180, lowest 3.4 at 192, 53.6 at 211, 47 at 216, 13 at 232.
- `motion.ts 180 276 4`: distance 1.0349, 1.0345 (188, the glide's own slight descent), then monotone to 4.5741 at 264; limb top y 0.4851 (180), 0.4304 (200), 0.2098 (212), 0.1447 (216), 0.0898 (224), 0.0820 (240), 0.0836 from 260 (0.0016 under, 1.7 px at 1080); orbit rate peak 0.45 deg per frame at 232, 0.0303 at 252, 0.0333 from 264.
- `terrain()` override: time warp over the first 3 s (first version `climb.ease = { over 3, ramp 0.17 }`, replaced at 10:38, see the next section).
- Flare: one kernel on the left loop foot lifted `look.flare.lift`; on the orbit side the same point carried into globe space (`kernelBody` in `set.ts`), so it does not jump at 216. `look.flare.ground` 3 (6 fogged the umbra at 204). Levels at draft with the first path version: mean 104 (204), 135 (208), 155 (210), 190 (212), 203 to 206 (213 to 218), 201 (220), 181 (222), 161 (224), 123 (228); no white clipping.
- Grade (item 4): `src/stops/sun/grade.ts`, a 256 x 4 LUT `grade.png` in sRGB coding applied to the picture value before the inverse film curve: row 0 ground (plate, apron, limb band), row 1 loops, row 2 globe. `assets-src/sun/grade/grade.py` fits it per channel by histogram match of a final nograin render against the approved image (`ground|loops|globe FILM APPROVED lo hi limit`, composes into `out/work/sun/grade.npy`, then `export`; `reset` writes identity). Two passes done. After pass 1 (percentiles 1, 5, 10, 25 of red, film against approved): ground 30/28, 58/58, 74/74, 107/108 (before: about 38/28, 70/58, 85/74, 117/108); globe 83/93, 118/125, 136/141 (before 109/93, 136/125, 151/141; pass 1 overshot, pass 2 takes half back); loops region blue p50 30/24 before pass 2.
- `out/work/sun/gradecheck.py REGION FILM APPROVED` prints the percentiles without changing the table.

## Terrain speed, loop lanes, cover shape, sky lock (10:38 to 11:00 UTC)

- Frame 90's soft bottom strip with streaks to the corners (item 5) is motion blur, not the plate: ground points at the bottom corners moved 10.9 px a frame at 90 and 27 px at 175 with a 180 degree shutter. New time warp in `plan.ts` `terrain()`: speed = settle x smootherstep(x) + gain x sin^2(pi x (min(x / span, 1))^skew) over the first 3 s (`climb.ease = { over 3, settle 0.55, skew 0.6, span 0.8 }`), then constant speed 0.55 after frame 90. Frame 0 and frame 90 poses unchanged, the pose at 180 is earlier on the glide. `npx tsx out/work/sun/corner.ts FRAMES` (px a frame at the bottom left corner): 0.2 (0), 5.4 (10), 10.6 (30, the swoop), 5.4 (60), 6.0 (90), 7.2 (120), 10.4 (178).
- Mesh inside the arch at frame 0 (item 5): not geometry. The flow packets ran in lanes of constant `arc`, one independent noise row every 0.75 degrees, and those lanes lie flat between the feet where the strands hang down, so they drew scan lines, dotted tracks and cross marks. Fix in `loops.ts`: `uFlowMask`, `strand = (1 - smoothstep(inside)) x smoothstep(from, luminance)` multiplies flow and swell (no flow on faint texels or inside the arch), lanes 0.12, the dimming side of the wave is soft limited (`floor` 0.25). Viewed at 0, 60, 150: interior clean, flow still shows on the outer arcs (`out/work/sun/i5-mesh-f.png`).
- Rise after the warp change (`flowq.ts 176 232`, `motion.ts 180 276 4`): speed/acceleration 2.8/0.01 (180), 1.9/0.49 (192, the turn), 11.0/2.2 (200), 39.8/4.9 (212), 38.4/5.3 (216), 12.1/1.8 (232). Distance 1.0398 (180), 1.0395 (184, 188), then monotone to 4.5741 at 264. Limb top y 0.4721 (180), 0.3628 (204), 0.2057 (212), 0.1427 (216), 0.0895 (224), 0.0820 (240), 0.0836 from 260. Orbit rate 0.41 deg a frame at 232, 0.0296 at 252, 0.0333 from 264.
- Draft sequence 176 to 272 (`out/work/sun/rise9-a.jpg`, `rise9-b.jpg`): one move, no jump (neighbour difference 0.9 at 269 to 272). Flat gold from 213 to 219.
- Cover shape (`flare.ts` `cover`, `look.flare.cover = { rise [-0.45, -0.035], fall [0.02, 0.45], power 2 }`): the veil now rises over 12 frames and thins over 13, opaque only round the switch. Mean level at draft: 127 (206), 152 (208), 179 (210), 190, 199, 205 (213), 207 to 208 (214 to 217), 207 (218), 205, 201, 196, 189 (222), 169 (224), 146 (226), 124 (228). Limb seen through the veil to 213, disc from 219 (`out/work/sun/cover1.jpg`).
- Sky lock (item 6, dashed stars at 247): the two sky cards are world meshes and were drawn at each sample's own camera, the engine's stars at the middle of the shutter. Now the cards are on the sky's clock without an engine flag: `plan.seen(kind, time)` gives the local pose for terrain, rise and hold; `set.ts` passes the camera space rotation `seen(mid)^-1 x seen(sample)` and the ratio of the two lens tangents to `skycard.ts` (`uLock`, `uZoom`). Identity at draft (one sample) and in the travel. The camera drift of the director is not in it (far below a pixel).
- Limb band at frame 90 against approved (rows above the limb, columns 60 to 420): the film is 4 to 9 levels brighter in red and 8 to 12 in blue at 18 to 40 px above the limb. Cause: `terrain/sky.py` mirrors the sky below a line 2.1 to 4.6 degrees above the limb, and the fringe adds the plate's own pixels there, which already hold the approved sky. Open.

## Batch 11 merged, engine sky flag, terrain sky card, limb seam (11:03 to 11:20 UTC)

- origin/main (e5c57ba, batch 11) merged at f78849b. Sample counts now follow screen motion: at review the rise takes 19 (206) up to 56 (216) and back to 18 (228), 16 from 229 to 269, hold 4. Check motion at draft, single frames at review.
- Sky lock replaced by the engine flag: `this.mesh.userData.skyClock = true` in `SkyCard`; `uLock`, `uZoom`, the lock code in `set.ts` and `plan.seen()` are gone. Both cards (hold and terrain) are flagged siblings under `world`. Review tier, frame 247 (16 samples) and 360 (4 samples): stars are points in all four corners, no weave seen at native size (`out/work/sun/i8-247-stars.png`, `i8-360-stars.png`). `mirrorcheck.py` on 90, 247, 360 at review: clean.
- Terrain sky card (`terrain/sky.py`, item 4): `skyband.py` showed the film brighter than approved near the limb by about the whole card (left, 0 deg: 96.7/43.6/25.8 against 84.2/32.2/14.2 x 1000 in scene values, card 10.1/9.5/8.0). The card is now multiplied by `near` (0 below 0.5 deg, 0.9 at 1.7 deg, 1 from 4.5 deg) and by 1 - 0.25 x loop mask; the fill below the line is the mirrored low-pass plus the stars taken 160 px to the side (no mirrored stars). After: left 0 deg 86.7/34.2/17.8 against 84.2/32.2/14.2, 1.2 deg 33.0/18.6/12.4 against 31.7/16.6/10.2, from 1.6 deg within 1; right within 3. Loops region blue percentiles 7/5, 10/10, 12/12, 16/15, 26/24, 41/43, 72/78, 99/105, 156/159 (film/approved).
- Dark line parallel to the limb at frame 90 (seen at 2.2 x exposure, `i7-arc-boost.png`): the ground's limb band reads the plate and was graded with the ground row, the fringe above reads the same plate ungraded, so the last rows under the limb were 6 to 10 levels darker than approved. Fix in `ground.ts`: the far lookup is not graded. After (`i9-arc-boost.png`): rows -1.5 to 0.3 deg within 2 of approved in red on the left, within 6 at x 200 to 440. A fainter edge is left at about 0.5 deg at x 330 to 440; it is the upper edge of the plate's own bright band (`i9-plate-limb.png`). Open, minor.
- Hold sky card: the margin has been an edge extended low-pass plus wrapped detail since the round 10 rebuild; `mirrorcheck.py` finds one weak hit in the card (x 1368, rows from 1728, 0.72) and none in frames.

## Batch 12 merged, stars near the limb, base90 again (11:20 to 11:35 UTC)

- origin/main (759b70f, batch 12) merged at cd38255. Rise at draft 176 to 272 after the merge: same levels as before (mean 103 at 204, 208 at 215 to 217, 124 at 228), neighbour difference 0.9 from 262 to 272, no jump at 269 to 270. Travel probe: join at 450 turn 0.035 to 0.035 deg per frame, speed 7.98e-2 to 7.95e-2.
- `terrain/sky.py`: the near limb factor and the loop mask factor now take down only the smooth floor of the card (Gaussian 24 px), the stars stay at full strength. With the whole card dimmed, stars near the limb had gone and the holes they leave in the loops layer showed as dark specks.
- Lesson: `base90.jpg` must be rendered again whenever the terrain sky card changes. The loops layer above the limb is approved minus base90, so it has a hole wherever base90 has a star. The card's fill below the line now takes its stars from 160 px to the side, base90 still had them mirrored, so two dark specks stood under the arcade at frame 90 (`out/work/sun/i16-specks.png`, `i17-base-old-new.png`). Done again in the recipe's order: `look.loops.gain` 0, build, frame 90 at review into `base90.jpg` (JPEG 95), gain back to 1, `plate.py`, `sky.py`, build.
- `plate.py` `FILL` 27 (was a 9 px closing): star holes in the orange part above the limb are closed. 0.02 percent of the plate changes.

## Dark specks near the limb, three causes (11:30 to 11:50 UTC)

- Rendering `base90.jpg` again did not remove the dark specks under the arcade at frame 90. Probed pixel by pixel (approved, film, base):
  1. Where the approved image has a white star within about 2 deg of the limb, the loops layer keeps the star out and fills its place with `under`, an opening of the layer. An opening is the lower envelope, so the fill was 8 to 10 levels under its surroundings. Now `under` is at least the warm weighted mean of the layer round the star (`MEND` 8 px, only where at least 20 to 50 percent of the neighbourhood is warm). Speck at (505, 471) gone: film 47 to 50, was 35 to 40.
  2. Where the film's own base has a star below 2 deg, the layer had a hole (approved minus base, clamped), and the layer sits 1 to 2 px off the card, so the hole showed beside the star as a dark dot (571, 480; 1172, 470; 1067, 467). The base's stars were only opened out above 2 deg, to keep the thin spicules of the fringe. Now white small features of the base are opened out from 0.1 to 0.4 deg up (`WHITE`), orange ones stay.
  3. `sky.py` `STARS` 0.4: the card's stars are taken down to 0.4 where the floor is taken down (near the limb), since the approved stars there are drowned in the glow.
- Order when the sky card changes stays: `sky.py`, loops gain 0, build, frame 90 at review into `base90.jpg`, gain 1, `plate.py`, `sky.py`, build (`out/work/sun/chain.sh`).
- `npm run measure -- --stop sun` takes about 25 min here (G13 on 434 frames, 3.5 s each).

## READY for round 2 sent (11:58 UTC), head 294ef64

- Stop commit e6cbf02, then origin/main c57f694 merged (Neptune, scorecards, status only; engine hash 020740ac07ff27f7 and stop hash ade92bf31ecceede unchanged).
- Measures at e6cbf02 (`--every 2`, 631 s): G13 0 of 217 frames soft; G5 coverage 0.571, 0.520, 0.511, 0.312, 0.309; G17 median/p25 1.452/1.111 (0), 1.153/1.023 (60), 1.089/0.994 (90), 1.014/0.910 (360). Tests 59 of 59. G11, G12 (1765 files, 1.36 GB), G15 (sun/web 148 MB, sun/full 593 MB) pass. On disk web 12 MB, full 35 MB.
- Frame 90 at final (`out/work/sun/r9`): ground percentiles within 1 of approved; loops red within 1, blue 7/5, 10/10, 12/12, 17/15, 27/24, 42/43, 73/78, 100/105. Globe at 360 (`gr2`): red 89/93 at p1, else within 2.
- Leaving at draft, 440 to 490: neighbour difference 1.1 across 449 to 450, smooth to 16.7 at 464, 1.2 at 478. At twice exposure a horizontal edge in the sky at 484 to 490, moving with the sky; my cards are at weight 0 there. Reported to the Builder as seen, origin not confirmed.
- Weak points told to the Builder: flat gold 214 to 218; apron cells soft and glossy at 0 and 60; faint edge 0.5 deg above the limb at x 330 to 440 of frame 90; sky left of the left foot 4 to 6 levels under approved; stars within 4 deg of the limb are not the approved stars; hold card structure at 5 times exposure; comb fringe, curl motif, prominence edges untouched.
- The rounds mirror the head of `agent/sun` when a round starts: push only work that is verified. Keep experiments in the working tree.

## Apron painted again, round 11 (12:00 to 12:20 UTC), not committed until verified

- Why: item 5 of round 10 (soft amber blobs along the bottom, glossy molten metal look, diagonal streaks) is in the painted apron itself. The round 10 prompt said "glowing plasma ... wispy filaments ... white-hot glints", which the model reads as polished gold.
- New prompts (in `RECIPE.md`): matte, cloud-like pillow cells, "not metal, not gold foil, not liquid, not glass", deep dark clefts. Tile C take a kept. Take b with a look reference from the approved image came out softer: a look reference does not help here.
- Side tiles: first takes had cells twice the centre's size and a straight step at the centre tile's border. Second prompt names the neighbour's cell size and forbids growth to the side and dark pits: kept.
- `apron2.py`: `cut` joins the side tiles to the centre along a least difference path inside the shared 160 px; `mend` replaces a smeared corner of tile L by the mirrored lower right corner of tile C (Poisson clone; the corner of tile R was tried first and brought long diagonal cells); the warp fills its missing bottom rows by reflection instead of a stretched last row.
- 6 of 6 takes of the apron used in round 11. No more takes for it this round.
- Round 10 files kept: `out/work/sun/apron-round10-full.jpg`, `apron-round10-web.jpg`, `apron2-take-*-round10.png`, `apron2-canvas-round10.png`.
- To verify before commit: frames 0, 30, 60 at final (`out/work/sun/ap5`), frame 90 unchanged, G17 and G13 on the terrain segment, a draft sequence 0 to 90 for the motion.

## Apron verified, feather moved out, frame 0 pose (12:30 to 12:50 UTC)

- Correction of an old note: frame 90 does see the apron. The plate is mixed in over the 4 percent feather inside the approved frame (77 px at the sides, 43 px at the bottom). With the round 10 apron those rows were streaky (part of R3's "streaks toward the corners").
- `look.ground.apron.out` [-1, -0.1] (seconds from the judged terrain frame): `uApronOut` goes 0 to 1 between frames 60 and 87 and moves the feather to the outside of the approved frame (`shift` in `apron.ts`; `out` is a reserved word in GLSL). Frame 60 is unchanged (max difference 1 level), frame 90 at final against approved: bottom 43 rows mean difference 10.7 (was 19.9), left 77 columns 19.3 (25.2), right 13.3 (16.9). The centre of the ground stays at 14.1: that is added fine detail and the 1 to 2 px offsets, not a tone error.
- The band morphs between 60 and 87 without a visible wipe: draft 56 to 100 neighbour difference falls evenly from 7.8 to 5.7, crops of the lower left at 60, 66, 72, 78, 84, 90 viewed (`out/work/sun/i53-dissolve-BL.jpg`). Rise 186 to 214 at draft: no ground edge seen, differences smooth.
- Mirrored chevrons in the left 8 px of frame 0: `apron.json` is the base glide at 1/120 s (middle of the shutter of frame 0 when the takes were made, before the eased start). With the eased start the film's frame 0 stood at glide time 0, 0.0044 units further back, and saw past the canvas into its mirrored wrap. `climb.ease.lead` 1/120 in `plan.ts`: the warp starts at that glide time (`eased = lead / over + calm + gain x fast`, gain solved again so the warp still ends at 1 with speed `settle`). Frame 0 pose now equals the json to 5e-7; chevrons gone (`out/work/sun/i57-f0-edges-lead.png`); frame 90 identical byte for byte, frame 60 differs by 0.07 levels in the mean. Corner speeds unchanged (0.2 px at frame 0, 10.6 at 30, 6.0 at 90).
- The approved close image is itself defocused and streaked in its bottom corners (`out/work/sun/i51-f90-BR-approved-ap6-ap7.png`). At frame 90 the film now shows exactly that. Not to be "fixed": R1 judges against it.
- Cover 214 to 218 measured again at draft: gold 238/207/115 at the frame edge, 255/253/246 at the core, 3.3 percent of pixels above 240 in all channels, the core drifts 20 px a frame. Left as it is: the kit asks for a bloom to bright gold for a moment.
- G5 and G17 with the new apron before the shift (`measure5.log`): coverage 0.571, 0.520, 0.511, 0.312, 0.309; G17 median/p25 1.352/1.092 (0), 1.085/0.999 (60), 1.079/0.988 (90), 1.014/0.910 (360).

## Round 15 result (12:52 UTC): my round 2 of 3, judged on main at 992e56f. Round 3 is the last: what it holds is what ships

Scores: R1 8 (was 7), R3 3 (parts 6, 3, 7; lowest counts), R4 4. R2 pass, R8 pass, G5 G13 G17 green. Bar: R1, R3, R4 each 9, no severe or major open.

Corrections from the Builder, worst first (his words kept where they bind):
1. RISE 204 to 229 (R4 severe, R4 major on the cover 211 to 222). "change technique, do not tune." "The whiteout is withdrawn as a technique." 212 to 218 are a featureless yellow field with a white core. Wanted: "at the swap frames the relief view and the globe view must show the same thing, the limb arc at the same height with the same curvature, the sunspot region at the same place, the same exposure and color, the same direction of travel (up and back). So: let the relief camera climb and tilt until its horizon bows like the globe's limb at that height, start the globe view from that exact framing, dissolve over a few frames, then ease the pullback to the hold. Glare is allowed only as a partial veil bound to a footpoint that moves with the camera; the limb stays readable in every frame (as a guide, limb contrast never under a third of what frame 204 has)." Motion before everything else.
2. FRAME 247 right sky (R3 severe): straight vertical edge at x 1735, y 380 to 860, brighter and warmer on its left, darker and bluer on its right; not there at 360. The border of the hold sky patch in frame while the camera is not yet on the hold framing. "the patch fades into the shared star sky outside the approved border on all four sides over a wide feather, no mirror padding, inside the border nothing changes. Check 229 to 269 and the whole hold drift at review tier."
3. FRAME 90 sky round the arch (R3 severe, R1 major): "a jagged, posterized black moat outlines the outer edge of the warm glow patch"; seen with 2.2 times gain on x 760 to 1500, y 0 to 420. "The glow must fall off monotonically, never darker than the sky outside it." Keep the falloff in float, dither at output.
4. NEAR GRANULATION (R3 major at 0, 60, 90): smeared streaky brush strokes stretched diagonally at 60 lower right; soft, mushy, muddy brown between the cells at 0 bottom strip; blurred and radially stretched toward the bottom corners at 90.
5. GLOSS (R3 major at 0 and 90): glossy specular highlights, wet liquid gold, hammered metal, "hard pinpoint specular glints inside dark intergranular lanes". "The approved close image wins where it shows the same. Where your relief, lighting or sharpening adds highlights the image does not have, take them out. Compare native crops first."
6. CORONA (R3 major at 247 and 360): dark patches shaped like the sky's dust lanes cutting into the warm rays at x 1380 to 1730, y 380 to 630. "Where the hero shows the same, leave it. Where your sky shows through darker than the hero, lift it." Also "long, nearly parallel strands have the same soft blur and taper" at 360 lower limb.
7. ACTIVE REGIONS (R3 major at 360): same tight rosette shape. Hero wins where it shows them.
8. TERRAIN MOTION 0 to 179 (R4 major and minor): "granulation is replaced between samples 16 frames apart, so the ground swims instead of flowing. Near ground and horizon do not read as depth"; "the limb drifts about 24 pixels and the dark sunspot region slides down about 50 pixels, with no eased start from rest". Wanted: "every granule keeps its identity from frame to frame and travels toward the camera with the ground; boil only evolves a cell in place, slowly; near cells pass clearly faster than far ones across all 180 frames; eased start."
9. HOLD MOTION 270 to 449 (R4 minor): surface features and prominences stay frozen. "A slow continuous turn inside what the hero covers; prominences may drift, never pop."
10. NOT CONFIRMED, do not chase: mirror seams behind the sunspot at 90 (the approved image shows the same shapes). Only if a relief texture is mirror padded somewhere that can come into frame, fix that.

Minors, only after 1 to 9: hold limb thin continuous yellow-orange outline (360), sharp bright hairline rim with a thin dark gap (247); smooth amber veil just inside the limb; stars brighter and larger than the target in hold and terrain; footpoints "broader yellow pools"; arch "more uniformly orange"; sunspot "distinct slanted dark patch" at left; frame 0 "a dark, smoky band lies between the limb glow and the starfield"; loops like steel wool; spicules comb-like; "an artificial ruler-straight horizontal bright streak" above the left footpoint at 90; stars at the left edge at 90 "smeared into elongated coma blobs and doubled smudges".

Rules: sky patches fade into the shared star sky outside the approved border and change nothing inside (`python3 tools/assets/mirrorcheck.py <png...>`); the approved image wins in the hold and terrain frame when a critic faults what the approved image itself shows; stepped copies in fast frames are an engine matter, report, do not work round; every number from `config/showcase.json`; every generated asset has a recipe; only my folders on `agent/sun`. Engine batch 13 (sky change for the travels) is coming; merge origin/main before READY.

READY format: `READY <commit> round 3`, then changes per item number, what is still weak, measures (G5, G13, G17, mirrorcheck). Before sending: render my own rise sheet and rise cover sheet at review tier and look at every frame from 200 to 235: "if any frame has no readable limb, it is not ready."

Found by me just before the mail (12:50): `plate.py` blends the wide take with the approved image INSIDE the approved frame: `FEATHER` 90 canvas px (46 film px) for the ground, `FEATHER_SKY` 380 canvas px (194 film px) for the sky. So at frame 90 the outer 194 px of the sky (top, left, right) are partly the wide take: other stars, a nebula patch at the top left, 4 to 8 levels brighter than approved in rows 0 to 60 at x 0 to 800 (`out/work/sun/i62-f90-topleft-x3-approved-film-base.png`). Likely the cause of "stars at the left edge at 90 smeared into ... doubled smudges" and part of R1's lifted sky floor. To fix with item 3: approved pixels to the frame edge, the wide take matched outside.

## Checkpoint (13:01 UTC): apron round 11, feather shift, lead

- Measures on the working tree (`measure6.log`, `--every 2`, 597 s): G13 0 of 217 soft; G5 coverage 0.571, 0.520, 0.511, 0.312, 0.309; G17 median/p25 1.365/1.092 (0), 1.085/0.999 (60), 1.089/1.022 (90), 1.014/0.910 (360). Tests 59 of 59. G11, G12, G15 pass. On disk web 12 MB, full 35 MB.
- Order for round 3: item 1 (rise as a matched dissolve, no whiteout), 2 (hold sky border), 3 (moat at 90, plate feather inside the approved frame), 8 (terrain motion), 9 (hold turn), then 4 to 7, then minors.
