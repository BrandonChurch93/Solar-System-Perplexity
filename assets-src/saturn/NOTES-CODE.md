# Saturn from code: notebook of saturn_coder

Read this first after a compaction, then the task message from /root, then cut/HANDOVER.md.
The earlier builder's notebook is NOTES.md in this folder. It is kept and not edited.

## The job

Part D of cut/HANDOVER.md, then Part B for Saturn. Rebuild the surface view (the skim over the
ring plane, frames 3630 to 3809) from code, and make the dive (3540 to 3629) and the rise
(3810 to 3884) seamless. Hold is 3390 to 3539. Judged frames: 3465 hold, 3567 dive, 3720 terrain,
3866 rise.

Branch: agent/saturn-code. Folders: src/stops/saturn/, assets-src/saturn/, public/assets/saturn/.
Looks folder: saturn-code. Report to /root with a message at M1, M2, M3 and the whole stop.

Milestones
- M1 early: first ring plane from code at 3720 beside the approved image, and 3630, 3720, 3809 in a
  row, as looks. Say which way I chose and why.
- M2: whole skim: 12 frame sheet and every sixth frame at the review tier, compare at 3720
  (npm run compare -- --stop saturn --view terrain), G5, G13, G17, seconds per sample.
- M3: dive and rise by Part B (S1 to S5 where a swap remains, steady move of E3 in any case), with
  proofs. S4 needs E1 and E2 on main: wait for /root's word; write divePose and risePose against
  the contract.
- Then the stop as a whole: four judged frames, three sheets, npm run build, npx vitest run, gates.

Rules I must not forget
- Work only in my three folders. Push only to agent/saturn-code. Never main, never force, never rebase.
- Commit trailer: Co-authored-by: Perplexity <noreply@perplexity.ai>
- No em dashes, no en dashes, no exclamation points, no model names or version strings in any file,
  file name or commit message.
- Every number the picture depends on comes from config/showcase.json or a JSON in my stop folder.
- No Math.random, Date.now, performance.now on a pixel path. No WebGL limit or extension beyond the
  Workspace record in kit/PROGRESS.md.
- One render process at a time. Long jobs detached with a log. Looks pushed at least every 30 minutes
  of working time: npm run looks -- --push --folder saturn-code --note "..."
- Terrain view budget: aim under about 6 seconds per sample at 1920 x 1080 (16 samples per frame at
  the final tier). Tell /root if the look needs more.
- Do not take code from origin agent/saturn. Never edit references/.
- Do not change the rise exit pose or the travel values without telling /root (they set the sky of
  Uranus). A plan change that moves a hold start or arrival needs tools/assets/skyframe.ts --keep,
  which is shared and not mine to run.

## Mail 219 from /root (addition to the brief, 06:47 UTC day 1)

1. In the frozen build the skim at 3720 came out as the approved close image almost line for line
   (profile.ts, shot.ts, streak.ts show how). The fault Brandon named is how it moved and what it
   was: streaks on a flat disc that read as a stretched picture. Of ten jurors none took the judged
   hold or skim frame for a film frame. On the skim: "generic unlabeled CGI beauty shot of Saturn
   with a flat textured ring disc" and "the real-time shader and alpha-blending artifact where the
   planet's glowing lit limb meets the semi-transparent inner rings, alongside high-frequency
   procedural noise and aliasing across the ring bands and cloud textures". On the hold: "The ring
   geometry is physically wrong: the rings don't pass in front of the planet's near side, and the
   planet looks like it's sitting on top of them."
2. A copy of the approved image line for line is not the aim. The aim is the same shot (R1:
   composition and framing, where each feature sits, colour and grade, contrast and depth of blacks,
   amount of fine detail, direction and quality of light, the globe, the sky; "A viewer shown both
   should call them the same shot from the same film") with what the image lacks: depth. Ice with
   size near the camera, a soft thickness, light that comes through thin parts and is blocked by
   dense ones, the shadow of the globe lying across the plane with a soft edge, the globe's limb
   seen through the thin inner ring without a cut-out step, lines that never alias at native size.
3. R4 judges the motion on sheets: "the near ground and the horizon move against each other, so the
   view has depth. Nothing stretches, tears, slides or swims. No edge of the picture comes into
   frame." R3 looks at native size crops for visible pixels, stretched texture, repeats, banding,
   halos or doubled edges round a layer, jagged or shimmering edges.
4. The hold may change where the same scene draws it better (rings in front of the near side of the
   globe, a curved terminator, no halo round the limb): its chunk will be rendered again. It must
   stay the same shot as the approved hero (references/approved/saturn-hero.png) and no worse
   beside it. The judged hold frame is 3465.

## What the frozen build does (read from code, day 1)

- SaturnPlan in plan.ts overrides dive, terrain, rise; coverAmount is 0. View switches orbit to
  terrain at diveSwitch 0.5 and riseSwitch 0.47; the terrain view is a rigid transform of the orbit
  frame (units are planet radii).
- The world is not rigid: set.ts morphs the ring layout with uClose and skimW (circle family
  familyAt, layout.bin field, globe scaled by skimGrow, light direction turned in the close view,
  inner disc drawn to r 0.02 with no depth test) and projects the approved close image onto the
  plane (skim-rings.jpg, skim-apron.jpg, masks, skim-tone.bin, skim-light.bin). The hold uses
  rings.bin (1D profile), polar-rings.jpg and polar-inner.jpg (hero pixels unwrapped), polar-warp.bin,
  streak.ts, hold-light.bin. This is what reads as a stretched picture and a pasted globe.
- Rings are drawn with depthTest false in two passes (behind and in front of the globe decided per
  pixel by a formula), which is where the pasted edge comes from.
- Earlier builder's finding, which my own check agrees with: no rigid world gives the approved close
  image. Its ring and globe junction lies on the far arc of the equator, as if the globe were a dome
  on an ocean. A true globe shows the near arc lower, with the C ring gap and the southern
  hemisphere below it.

## Fit values (src/stops/saturn/fit.json, close.json)

- Hero camera [-0.182312, -0.033514, 5.556652], vfov 30. sunDir [-0.789623, 0.580852, -0.197751].
  Ring normal [0.19599, 0.881152, 0.430301]. Rings 1.2458 to 2.3394 radii. Globe quaternion
  [0.2171781, -0.0427061, -0.1107142, 0.9688923], scale [1, 0.902, 1]. Titan
  [8.194999, 4.225177, -17.747954] r 0.364424.
- close.json: vfov 48, globe centre in camera coords [0.9254, -0.2123, -2.0082], tilt 7.72,
  roll -12.87 (height about 0.27 radii above the plane, about 2.2 from the axis).

## Engine facts I rely on

- Camera at origin; each set's world at state.origin minus camera. Terrain near 0.01, far 4000;
  orbit near = clamp(0.02 * (|pos| - 1), 0.0004, 1), far 80000. set.near is drawn after clearDepth.
- Software rasterizer evaluates both sides of an if but skips a for body: wrap costly branches in
  for (int k = 0; k < (cond ? 1 : 0); k++).
- "half" is a reserved word in GLSL ES 3.0. After a shader change read the whole still output and
  grep for "Shader Error".
- Stop shaders take part in diag views (texels with counted flag, layers, depth, flow). Body pixels
  write alpha, sky writes none (G5 coverage). Formula drawn surfaces are not counted by G13.
- Sampler: sample i gets jitter and timeOffset ((i + 0.5) / count) * shutterFraction. Review tier:
  4 samples in hold and terrain, 16 in dive, rise, travel; final 16 and 64.
- rawMotion probes the ring plane to bodyReach 2.5 for a ringed stop in the orbit view, and the
  ground plane at eye.y + ground in the terrain view.

## Log

### Day 1, 06:40 UTC start

- Cloned, branch agent/saturn-code from main 6da6c64, npm ci, build passes.
- Read AGENTS.md, addenda, cut/HANDOVER.md, STOP-AGENT.md, PROGRESS.md sections, kit 02 03 04 07,
  NOTES.md head, set.ts, plan.ts, moves.ts, rig.ts, timeline.ts, film.ts, engine.ts, rings.ts,
  profile.ts, look.ts.
- 06:55 first look pushed: the frozen build at 3720, draft tier, as the baseline.

### Day 1, 06:55 to 07:15 UTC: measuring, and the design

Tools written (assets-src/saturn/code/): geom.py (fit, ring frame, filmic and its inverse, rays, ring
and globe hits, globe shadow), hero_profile.py (scene linear profile of the hero rings by radius in
three sectors, out/hero_profile.npz), skim_view.py (overlay of the rigid world on the approved close
for a pose given as foot, height, yaw, tilt, roll, vfov), ring_model.py (writes
src/stops/saturn/ringfield.json).

Measured
- Ring frame: hero camera azimuth 89.7 deg, elevation 24.7 deg. Sun azimuth 199 (or -161), elevation
  15.8 deg, so mu0 0.272 and the hero's mu 0.418. Lit side on the left of the picture means the Sun's
  azimuth is the camera's plus a positive (counterclockwise) angle.
- Hero profile, scene linear luma: left sector (toward the Sun, sharpest, complete) B ring 0.25 to
  0.55 with spikes to 1.1, A ring 0.27 to 0.28, C ring 0.08 to 0.17, Cassini about 0.02. Near sector
  B 0.31 to 0.41, A 0.15 to 0.18. Sky floor 0.014, bluish. Colour over luma about 1.45, 0.9, 0.58 in
  B; 1.3, 0.94, 0.73 in A; 1.1, 0.99, 0.82 in C. Outer edge at 2.335 (left), 2.38 (near), 2.30
  (right): the hero's rings are not one circle, so a rigid world moves the edge by about 6 px
  somewhere in the hold.
- Approved close, scene linear: B ring luma p50 0.32, p90 0.55, mean rgb 0.51, 0.33, 0.24; A ring
  near left p50 0.13; C ring 0.027; globe lit 0.88, bright limb 1.86; night side 0.010; sky 0.008;
  shadowed ring 0.009. Hero: globe lit 0.54, bright 0.90, sky 0.020, night 0.015, ring shadow 0.011.
- Frozen close fit: foot 2.2048, height 0.2706, globe 25.51 deg right of the view axis, tilt 7.72,
  roll -12.87, vfov 48; globe centre about (1114, 490) of 1408 x 792, radius 465 px. The close
  image's rings are the hero's scaled by about 0.9 (1.746, 1.858, 2.12 for the hero's 1.94, 2.063,
  2.3394), so one rigid world cannot match both the globe size and the ring layout. The approved
  close shows the globe as a dome cut at its equator by opaque rings; the true world shows a strip
  of the southern hemisphere through the inner gap and the C ring.
- Mid pose chosen by overlay (candidate A): foot 2.44, height 0.30, yaw 25.51, tilt 7.72, roll
  -12.87, vfov 48. The Cassini division lands on the approved dark band and the globe is about 10
  percent smaller than in the approved image. Camera azimuth about 88 deg from the Sun's as in the
  frozen build (the approved terminator is near straight, phase 85 to 90 deg), so the swing from the
  hero's azimuth is about 21 deg.

Design (decided)
- One rigid, physically true world for hold, dive, skim and rise. Dropped: the uClose morph, the
  layout warp, skimGrow, the close light turn, the projected close picture, the projected light
  tables, the close globe patch.
- Skim path: forward along the view axis (mostly radially inward). Start foot about 2.6 at height
  0.33, mid 2.44 at 0.30, end about 2.2 at 0.25. The true outer edge and the F ring pass under the
  camera in the first second, drawn as a soft edge of particles. Tell /root in M1.
- Ring field: ringfield.json holds 2048 knots of normal optical depth and ice brightness over
  [1.2, 2.5] and 33 knots of ice colour. One float texture, rows are box filtered levels, read at row
  centres with two levels blended; level from the footprint of the pixel in radius. Depth rule:
  tau = 1.6 * (L / 0.45)^1.6 capped at 3.5; ice = L / (1 - exp(-tau (1/mu0 + 1/mu_hero))). Edges of
  the measured profile sharpened by a shock filter.
- Below the knots: octaves of shaped noise in radius on brightness and depth, each faded by the
  footprint, plus hue lanes; then grain cells in (radius, azimuth) with Kepler shear; then instanced
  spheres near the camera that fade in above about one pixel, with their shadows.
- Shading: single scatter of a sheet, I = ice * colour * (mu0 / (mu0 + mu)) over its hero value, by a
  strength k, times (1 - exp(-tau (1/mu0 + 1/mu))), a mild phase term, and light through thin parts
  where the Sun is behind. Alpha = 1 - exp(-tau / mu). Globe shadow by an analytic ellipsoid test with
  a soft edge and a faint floor. Ring shadow on the globe by walking along the Sun to the plane and
  reading tau there.
- Ring passes: one shader, depthTest false, pass 0 the part behind the globe (drawn before it), pass
  1 the part in front (after it). Front is decided per pixel by the ray: the ring point lies nearer
  than the ray's entry into the globe. Both passes use the same analytic limb cover so the join is
  exact.
- G13 on code surfaces: texels = footprint over the finest scale the functions still produce.

Next: field.ts (texture and GLSL), sheet.ts (ring pass), globe without the close patch, set.ts,
plan.ts, look.ts; stills at 3720, 3630, 3809; M1.

### Day 1, 07:15 to 07:35 UTC: decisions before the first code

- ring_model.py now writes ringfield.json with span, knots (2048), inner, outer, muSun, muHero, tau,
  lum (brightness at the hero's camera), red and blue (colour over luma, green follows from luma 1),
  fine (strength of the structure below the knots). A dust sheet and three strands lie outside the
  outer edge 2.3394. Model depth: C p50 0.13, B 1.13, A 0.62.
- Field texture (field.ts): 2048 wide; rows 0 to 11 tau at box widths 2^k knots, rows 12 to 23 lum,
  row 24 red, row 25 blue, row 26 fine. textureLod at row centres, level = log2(footprint over knot
  spacing).
- Shading: I = lum * (1 - exp(-tau k)) / (1 - exp(-tau kh)) with k = 1/mu0 + 1/mu and kh the hero's,
  times a view term (mu0/(mu0+mu) over its hero value, by a strength) and a sphere phase ratio (by a
  strength). Alpha = 1 - exp(-tau/mu). Premultiplied.
- Fine structure (ringfine.json): plateau steps (one hashed level per cell with a soft step, never
  narrower than the footprint), octaves from wavelength 0.0026 by ratio 0.55, products on lum and
  tau, each faded by the footprint; hue lanes; wave trains in the A ring. The octaves lie below the
  hero's resolution, so the hold shows the measured profile.
- No flat grain on the sheet: at grazing angles it reads as a stretched texture. Ice is instanced
  sphere impostors in size classes, one per cell of a (radius row, azimuth) grid from a hash of the
  cell, a window of cells that follows the camera, rows sliding by Kepler (prograde is decreasing
  atan2(z, x), the sense of the globe's spin), fading out below about one pixel, lit as spheres, in
  the globe's shadow where the sheet is, with their own shadows on the plane.
- Passes: rings behind, shell, globe, rings in front, particle shadows, particles. Front when the
  ring point lies nearer than the ray's closest approach to the globe (tc > 1).
- Globe shadow on the rings analytic in the polar scaled space, soft edge growing with distance, warm
  penumbra, faint bluish floor. Ring shadow on the globe = exp(-tau(rho)/mu0) at the point where the
  Sun ray from the globe point crosses the plane.
- G13 on the sheet: texels = diagTexels(position over the finest octave), counted.
- Skim pose (mid): foot 2.44, height 0.30, yaw 25.51, tilt 7.72, roll -12.87, vfov 48. Camera build:
  flat = Sun projected on the plane; out = flat turned about the normal by 90 deg plus azimuthDeg;
  view axis = -out turned by yaw; position = out * foot + normal * height.
- Path: forward 0.24 along the view axis with a sink of 0.08 keeps the bottom left corner inside
  radius 2.340, so the outer edge never crosses the near field; a forward of 0.36 would put 2.41 in
  the corner at the start. About 3 px per frame at the bottom of the frame. The outer edge shows only
  in the distance at the left (y about 411 of 1080 at mid), as in the approved image. This replaces
  the earlier idea of starting outside the edge.
- Hold in the true world: the near ring arcs pass in front of the globe's southern part. Allowed by
  Mail 219 if no worse; judge after M2.

### Day 1, 07:35 to 08:05 UTC: first render from code, pose and light checked (M1)

- First still of 3720 from code: 9.2 to 9.6 s for one sample at 1920 x 1080 (the frozen build took 16.1 s
  here). No shader error. Files: field.ts (ring field texture and functions), sheet.ts (two ring passes),
  globe.ts (close patch and skim light removed, ring shadow read from the field), set.ts (rigid world),
  plan.ts (skim camera from skim.json), skim.json, sheet.json, ringfine.json. The frozen rings.ts, ice.ts
  and profile.ts are gone from the stop.
- Light check with the globe's probe view (look.ts probe 3, --diag layers gives the cosine to the Sun per
  pixel): at azimuthDeg -8 the geometric terminator leaves the frame at the right (cosine 0 at x 1750 to
  1900 of 1920). The approved close has its light boundary from (1196, 63) to (1081, 441) of 1408 x 792,
  left of the globe's centre at the base: phase a little over 90 deg, and it leans 19 deg from the
  vertical where the true Sun (15.8 deg over the plane, camera roll -12.87) gives 30 to 40 deg. The
  approved light is not the hero's Sun; the true world keeps the hero's Sun.
- azimuthDeg is now +17 (camera 107 deg round from the Sun, phase about 106 deg). Two reasons: the
  terminator comes into frame with a night side on the right as in the approved image, and the hero camera
  stands at 109.3 deg, so the dive needs almost no swing round the axis: it becomes a straight descent
  toward a place on the plane.
- The prompt of the approved close (references/approved/saturn-close.prompt.txt) asks for the true
  geometry in words: "the near rings sweep across the lower frame in front of the globe's lower limb, the
  dense bright bands hiding it and the thin dusky inner ring letting the globe show dimly through; between
  that inner ring and the globe there is a dark empty gap". The image model drew a dome cut at the equator
  instead. The code scene follows the words: the lit southern part of the globe shows through the gap and
  the C ring down to the B ring's inner edge.
- The globe's shadow on the near rings lies just outside the right frame edge at this pose (the shadow
  strip is 1 radius wide and starts behind the globe). In the approved image the dark band under the dome
  is not a true shadow. To be decided: a little more yaw or azimuth to bring the shadow's edge into frame.
- Sharpness as the gate counts it (assets-src/saturn/code/detail_grid.py prints it tile by tile): the first
  render has 0.115 of the approved fine detail energy (median over 62 tiles; needs 0.8). The approved has
  5 to 8 percent band contrast in the B ring and 10 to 17 percent in the A ring at 3 to 12 px, at every
  distance; the first render has 2.5 percent. The measured knots hold 5 to 12 percent (linear) in B and
  2.5 to 5 percent in A. So the ladder of ringlets must start at about 0.05 radii, not 0.0026, carry
  about the same contrast in every octave, and add thin dark grooves; the A ring needs the most.
- Stars show through the Cassini division (depth 0.008): the approved has thin grey ringlets there and no
  stars. Raise its floor.
- Rings are too bright and too pale in the A ring (display luma 0.61 to 0.66 against 0.42 to 0.48).

Next: ringlet ladder with grooves, colour lanes, brightness by ring; then ice particles; then the globe's
light near the terminator, the halo, the shadow. Then M2.
