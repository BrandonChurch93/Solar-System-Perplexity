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

## Mail 225 from /root (about 08:02 UTC day 1): E1 is on main

- E1 of the handover engine is on main at 33ccccb6 (main head add6ccbe). Do: git fetch origin main, git
  merge origin/main (never rebase), build, go on.
- Engineer's notes: assets-src/shared/HANDOVER-NOTES.md, section "The contract of E1, for the stop
  builders". Opt in with a `handover` object in the params (even {}). handover.dive and handover.rise may
  set at, dissolveFrames, placeFrames; defaults in config.handover. plan.divePose(time, view) and
  plan.risePose(time, view) must give a valid pose on both sides across the place window and the dissolve;
  plan.dive(time) and plan.rise(time) pick the side with sideAt.
- Rename: the old property risePose (pose at the end of the rise) is now riseEnd.
- For a stop that opted in there is no cover and no added softness in its dive and rise;
  coverWindow(segment) is null and judgedWindow(segment) is what tools use; G13 counts every frame of the
  dive and the rise.
- Not in yet: E2 (place picture on the globe side), E3 (steady descent in the generic plan), E4 (the
  measures). /root will say when. Opting in today gives a hard swap at T; do not report that as S4.
- Keep going with S2 and S3. Looks every 30 minutes.

## Mail 226 from /root (about 08:03 UTC day 1): decision on M1 and the order of work

- Decision: keep the one rigid true world. Do not build the dome. Logged in kit/PROGRESS.md.
- Inside the true world come as near to the approved close as an honest camera and honest light allow, in
  this order:
  1. Richness first: the approved has hundreds of fine ringlets with colour variation (cream, rose, grey
     green) at every distance; mine reads as about twenty soft bands. Bring the ladder of ringlets up
     through the middle scales, each filtered by the footprint, with the colour varying by ringlet.
  2. The dark band of the Cassini division and the outer A ring in the approved are darker and greyer; my
     A ring is pale.
  3. The junction: the slant opacity of the thin inner ring so the globe shows only dimly through it, the
     ring shadow on the globe as the dark band under the equator, the globe's shadow on the far rings in
     frame if the pose allows it. If a small change of camera height or foot brings less of the lower
     globe into view without losing the ring layout, take it; say what it costs.
  4. Sky: no stars through the Cassini division where the sheet has optical depth, and the same sky as the
     approved (dark, few stars).
  5. Then the ice near the camera with parallax, the limb halo and the terminator.
- Speed: 9.4 s a sample is fine for now, do not trade the look for it.
- The hold (3465) must still come out as the same picture as the kept still, and the dive needs no swap, so
  after E3 the dive is one move through one scene. At the next milestone say whether the hold changed by a
  single pixel, and push a sheet of every 15th frame of 3630 to 3809 plus consecutive frames 3718 to 3723.

### Day 1, 08:05 to 09:10 UTC: ladders two to four, the light by angle, the tools that measure them

State of the branch: local head 1f7e9c1 (merge of origin/main 1e492e9 with E1) plus the work below.
Scratch in /tmp/v (not in the repo, rebuild if lost): go.sh [hold] renders 3720 (nograin, tier from $TIER)
and prints G17 and the contrast table; mk.py cuts native pairs beside the approved; fine.py is the contrast
table (rms of ln luma, ln red over blue, ln green in three bands of scale, film / approved).

What the two approved images measure (tools in assets-src/saturn/code):

- band_energy.py FILM [APPROVED] [hold]: contrast by band of wavelength across and along the ringlets.
  Approved close, display rms percent across the ringlets in bands 2-4, 4-8, 8-16, 16-32, 32-64, 64-128 px:
  A near 11.7, 19.8, 11.3, 11.8, 4.9, 4.0; B near 7.9, 8.7, 7.7, 6.0, 2.5, 1.7; B far 7.7, 10.4, 10.0, 8.9,
  8.4, 9.0. Along the lanes (grain) in bands 2-4, 4-8, 8-16, 16-32 px: A near 5.6, 5.0, 4.2, 3.4; B near
  3.0, 2.8, 2.0, 1.9. The code scene has about 1 along the lanes until the grain is built.
- skim_map.py: with no argument the radius, cosine of the view, phase and radii per pixel at the patches;
  with FILM [APPROVED] the scene linear light by ring and by cosine of the view. Patches of 3720 (pixel:
  radius, mu, phase, radii per pixel): A near left (260, 930): 2.156, 0.478, 131.7, 0.00046; A left (120,
  700): 2.143, 0.339, 142.0, 0.00056; A far left (190, 500): 2.078, 0.205, 148.7, 0.00093; B near (1100,
  900): 1.738, 0.377, 111.6, 0.00153; B far (640, 470): 1.641, 0.132, 140.4, 0.0037.
- hero_light.py: how the hero's rings change with the angle of view and the phase. Thin ring (A and the
  division) over the left sector: 0.57 at phase 85, 0.9 at 100, 1.0 at 109 to 120. The close wants the thin
  ring at about 0.93 at 128, 0.63 at 137, 0.5 at 145, 0.4 at 150.
- The film's tone curve passes only 0.34 (B ring) and 0.59 (A ring) of the scene contrast to the display.
  So the ladder works in the logarithm of the brightness with strengths that look large.
- No single light gives both approved images: the close's globe is 1.63 times the hero's, its rings 0.85
  times, its ice less saturated (red and blue over luma: close B 1.30, 0.70 and A 1.12, 0.84; the hero's
  ink gives B 1.50, 0.56). So skim.json light blends exposure of globe and rings and the saturation of the
  ice by the logarithm of the camera's height between the hold and the skim. Tell /root at M2.
- The sky of the skim already has the approved's numbers (mean rgb 0.031 0.044 0.063 in both; share of
  pixels over 0.3: 0.0021 film, 0.0014 approved): the sky patch of the kept build is aimed by the plan at
  the judged frame and follows the new pose by itself. It is a picture fixed on the sky, not on the plane.

The light law of the sheet (sheet.ts, sheet.json): brightness = knots * ladder * seen(tau, mu) *
pow(clamp((mu0 + muHero) / (mu0 + mu)), power) * phase gain, with a power and phase knots for a dense sheet
and for a thin one (the model's thin row: 0 inside 1.93, 1 from 1.95 out). The ice loses colour with the
law in the thin ring (grey). Stars are covered by any part of the sheet that holds ice (starCover times
the slant depth), the globe by the true depth.

Ladders:

- Two (plateaus, linear strengths): G17 0.760 at draft, but striped like a barcode and too colourful.
- Three (thin row, law, star cover): too smooth, candy colours, G17 0.255. Found skim.json light arrays in
  the wrong order (hold first, then skim) and fixed them.
- Four (levels in the logarithm, two tables dense and thin, bunches from the octave two steps wider, hue
  after the loss of colour): G17 1.42 at review, overshoot, lines too hard and even.
- Four b (thin signed lines at the edges of the ringlets in place of deep plateaus; the mean of the lines
  divided out): G17 0.544; mid bands on the approved (A near 0.103 against 0.108, B near 0.047 against
  0.045), fine band under it (0.153 against 0.221, the rest is grain that is not built yet).
- Four c: ten octaves from 0.128 (the two widest are soft zones of colour only), per octave edge softness,
  hue cut at the fine octaves (the coloured hairlines are gone), filterFloor 0.75: the ladder is filtered
  with the pixel's footprint times max(uGrad, 0.75) so that four samples do not bead the thin lines. G17
  0.454. The A ring came out lilac (blue over luma 0.97 against 0.84): the wide zone of colour sat on rose
  with blue. pinkAxis blue now -0.01, grey 0.5.
- The hero beside the hold: the hero's Cassini division is all but black with stars through it and two or
  three thin grey ringlets; mine was dark brown. Its profile there is the blur of its neighbours. So
  ring_model.py now sets the division itself between 1.969 and 2.047: depth 0.006, four thin ringlets,
  neutral ink. starCover 60.
- The hero's B ring is dense warm hairlines at 2 to 6 px, its A ring smooth with grain. So the structure at
  0.008 to 0.016 radii must be lines rather than plateaus: fine in the hold, sparse dark lines between
  smooth zones in the skim. Levels cut, lines raised (in progress).

Pose facts to tell /root at M2: the approved close draws bright ring almost to the globe (dark zone about
60 px) while the rigid world fitted to the hero has the B ring's inner edge about 250 px from the limb and
the Cassini band about 100 px left of the approved one; the globe's shadow on the rings lies about 4 deg
outside the right edge at azimuth 17 (27 would thin the lit globe); a lone lowering (height 0.22, foot
2.40) raises the junction about 90 px but moves the Cassini band up about 124 px (to try with skim_view.py
after M2). The hold changed: every ring pixel is now drawn by the code field.

E1 to do (after M2): SaturnPlan.divePose(time, view) and risePose(time, view) (orbit = join pose, terrain =
local(join pose)), base dive and rise pick with sideAt, handover: {} in params, same sky on both sides at T
(skyGain, patchWeight, seat). Read src/director/handover.ts, moves.ts 400 to 480,
assets-src/shared/HANDOVER-NOTES.md. Saturn cover centres 3594 (dive) and 3840 (rise).

Next: grain and sparkle anchored in the plane with Kepler drift, instanced ice near the camera, soft
thickness, junction, limb halo, terminator. Then M2.

## Mail 231 from /root (about 09:12 UTC day 1): the ice moves up the order

- "I saw your fourth ladder at 3720: the ring plane is rich now and reads as code, not as a stretched
  picture. Good. Your own list of what is wrong (lines too hard, pale outer ring) is right."
- "The change: the ice near the camera moves up the order, right after the hardness of the lines. Reason:
  the ring pattern is the same all along the flight, so the pattern alone cannot show that the camera moves
  forward. Brandon asked early on for clear forward movement and depth across the whole length of every
  surface view, and his newest note (08:43 UTC, on the Sun) says a surface view whose matter does not
  visibly move is lack luster. On Saturn that movement is the ice: grains and clumps with size and depth
  that pass the lens with parallax, each on its own orbit so near ones overtake far ones, merging into the
  sheet with distance with no seam. Also let the fine structure of the sheet itself carry things that
  travel along the orbit (clumps, wakes, a spoke or two), so the plane is seen to turn under the camera."
- "Proof with it: six consecutive frames at two places, and a sheet of every 15th frame 3630 to 3809. In
  consecutive frames the eye must see at once which way the camera flies."
- No answer needed.

Result of the lines after 09:10 (ladder four d: levels cut, lines raised, bunches 0.1 to 2.0, the division
set by the model): 3720 G17 0.673 at review (A near fine band 0.211 against 0.221, mid 0.166 against 0.108:
thin ring lines a little too strong), hold G17 1.120, p25 0.738 against the hero. The beading of thin
lines at four samples is gone with filterFloor 0.75.

Plan for the ice (09:20):
- In the sheet shader, grain anchored in the plane: rows in radius, cells in azimuth, each row turning
  rigidly at the Kepler rate of its radius (spin 1.4 deg per second at 1.86 radii, rate goes with radius
  to the power -1.5), three fixed sizes in radii so near grains are larger on screen and far ones merge
  into the sheet; each grain an ellipse on the plane filtered by the pixel's footprint in both directions.
- Wakes: longer soft clumps pitched to the orbit; spokes: two or three soft radial smudges in the B ring
  that turn with the globe.
- Raised ice: layers or instanced grains above the sheet with true parallax, lit by the Sun.
- The camera flies 0.04 radii a second, the A ring orbits at 0.042 radii a second, to the right in frame
  (prograde, seen from the north side). Both are seen: grains ride the lanes while the lanes slide down.

## Mail 235 from /root (about 09:55 UTC day 1): E2 is on main, S4 can start

- "The engine's E2 is on main at c9c23b29. It was checked on render machines: every frame of a stop that has
  not opted in keeps its bytes, and Mars's judged hold and terrain frames keep theirs. Merge origin/main into
  your branch now."
- "What is new, and how a stop uses it, is in assets-src/shared/HANDOVER-NOTES.md, section 'How a stop uses
  it'. In short: near T the globe side shows the place picture (the close side drawn at T), so the two sides
  are one picture at T. StopPlan.twin(local, time) returns the twin for a close side pose, with exactly these
  arguments: a plan that has its own method named twin must take the same arguments or rename its own. Also
  closePose(kind, time) and place(kind, time), and per kind in MoveParams.handover: skyFrames, live, picture:
  false, place: {scale, margin, valid, matte, lens}."
- "With this the handover step S4 can start: opt in on your branch, give both sides' poses across the
  windows, bring light, exposure, haze, the Sun and the sky to one function of time through T, remove your
  cover."
- "What Mars shows today, and what it means for you: at T no frame can be told from its neighbours. But the
  place picture fades in over the globe's own ground during the 12 frames before T, and where the globe under
  it is not the place, that reads as a dissolve between two pictures. Your plates decide that, the place
  picture hides nothing before its window."
- "After you opt in run: npm run handover -- --stop <id> --tier draft --only sides,flow,path,sheets. Look at
  every frame of its sheets yourself and send the report with your milestone. Do not answer this mail, go on."

## The ice, as built (10:00 UTC day 1), ice.ts and ice.json

What failed first, and why:
- Flat grains (ellipses on the plane, seven classes): at the skim's grazing view everything flat is squashed
  to a third or a half across the line of sight, so grains of any size read as dashes that all lie level in
  the frame: hatching. Along lane energy at B near stayed at a third of the approved in the two finest bands.
  The approved's grain is the same size in both directions on screen, so the grains must have height.
- Balls with one lookup per cell (the centre kept 2.9 radii from the cell walls): only sparse fields.

What is built now:
- Stones are balls. Resting classes (cells 0.0006 to 0.0192 radii, radius 0.2 to 0.36 of the cell, shares
  0.85 down to 0.02) are the upper half of a ball on the sheet; a stone is looked for in the cell of the
  point, in the next cell toward the lens (a dome shows over the plane behind it) and, for the three largest
  classes, in the next cell toward the Sun (its shadow). Small ones show little of a ball's light (depth 0.5)
  and are the sheet's grain, large ones are blocks with a lit cap, a dark body and a shadow toward the lens
  (the skim looks sunward, phase 110 to 140 degrees).
- Floating classes on five levels (0.004 to 0.14 radii above the sheet), drawn where the ray crosses the
  level, each throwing its shadow down on the sheet at q + S.xz / S.y * h.
- Wakes: two classes of long soft patches along the orbit (cells 0.012 and 0.006, 10 and 8 times longer than
  wide), plus three spokes in the B ring that turn with the globe. Both are multiplied by the nearness of the
  lens (0 in the hold), so the hold keeps its picture.
- Every row turns by Kepler's third law from the orbit that keeps pace with the globe (1.86 radii), written
  as s * sqrt(s) with s = sync radius over radius (no pow); one atan per level.

The flight: assets-src/saturn/code/skim_flow.py prints the motion in pixels per frame of the plane, of ice on
its orbit and of floaters at a few places. With the old path (forward 0.24 radii over the skim) the plane
moved 1.8 px a frame at A near left and 0.4 at B near: too slow to read. Path now forward 0.5, sink 0.12
(height 0.36 to 0.24): 4.2 px a frame at A near left (ice 4.2, floaters 4.2 to 7.4), B near plane 1.35, ice
3.6, floaters to 6.4, B low right ice 5.6. The middle frame 3720 keeps its pose. TELL /root: the terrain
path changed, so the poses at the end of the dive and at the start of the rise changed with it.

Frame of the sheet shader (vLocal.xz): camera azimuth 90 to 95 degrees, B near at 98, A near left at 104,
prograde is toward smaller azimuth, which is to the right in frame. Spin since the middle of the hold: 7.7
degrees at 3630, 11.9 at 3720, 16.1 at 3809.

### Day 1, 10:00 to 10:25 UTC: blocks, the dashes found, the ladder measured by band, nearness gains

Head 0da1bbe is the merge of origin/main with E2 (pushed). The work below is on top of it.

- Blocks: stones of the larger classes are now blocks with twelve faces (six axes ICE_AXIS and their
  opposites, cut at a hashed depth between faces lo and hi), tumbling at tumble degrees a second about a
  hashed axis, each face with its own tone (faceTone), thin ice glowing where the Sun is behind (glow,
  glowDepth). ice.json: block per class, faces, tumble, edge, faceTone, glow, glowDepth.
- The level dark dashes all over the near field were the shadows of the floating stones. The Sun's azimuth
  lies about 70 degrees off the view direction and it stands 15.8 degrees over the plane, so a floater's
  shadow lands far from its stone and reads as a dash with no owner. Floaters throw a shadow only where
  throws is 1 for the class (all 0 now); the resting classes three and four keep theirs.
- Measured by band against the approved close (band_energy.py, film over approved, rms contrast in bands 2-4,
  4-8, 8-16, 16-32, 32-64, 64-128 px across the lanes) at draft 3720 after this pass: A near left 1.42 0.90
  1.41 0.94 2.31 1.20; A left 0.87 0.80 1.38 0.95 1.51 1.19; A far left 1.39 1.47 2.25 1.03 0.60 0.81; B near
  0.97 0.73 0.87 0.79 2.37 2.83; B far 1.19 1.17 1.35 1.64 1.41 1.74. Mean rgb film against approved: A near
  left 0.464 0.424 0.382 / 0.520 0.476 0.431; A left 0.517 0.473 0.428 / 0.485 0.449 0.411; B near 0.814
  0.745 0.668 / 0.758 0.689 0.612; B far 0.683 0.614 0.543 / 0.728 0.645 0.563. G17 at draft: median 1.133,
  p25 0.764 (3720), 0.708 and 0.365 at the start of the segment. Draft has one sample and no shutter, so the
  review tier will read lower. Still wrong: B ring contrast at 32 to 128 px is 2.4 to 2.8 times the
  approved (it comes from the model's knots), and the B ring has less variety of colour than the approved's
  pink, blue grey and yellow lanes.
- Ladder (ringfine.json, field.ts): the fine ladder of the thin ring was rebuilt: level.thin and
  groove.strengthThin per octave, hue.thin warm and pink per octave, even lines from octave 6 with their own
  roughness. uRfMore[o] = (edge, strengthThin); uRfLine = (groove.open, even.rough lo, hi, even.from).
  ringFine takes more = (gain, first octave it applies to): the gain acts on brightness and depth, the hues
  keep their strength.
- Nearness (skim.json light, set.ts, sheet.ts): by the logarithm of the camera's height between heights
  [0.35, 1.6] the sheet gets detail gains (dense 2.0, thin 1.25 from octave 4), footprints 0.6 (octaves show
  earlier), and a tint (dense [1.0, 1.02, 0.96], thin [0.99, 1.045, 0.94]) because the model's ink in the A
  ring is rose while the approved close is olive neutral there. All of these are 1 in the hold.
- Ice sizes: ten classes (five resting, five floating), cells 0.0006 to 0.048 radii, glints as stones turned
  to the Sun (glintShare, glint), white share per class.
- Six consecutive draft frames 3718 to 3723 (/tmp/v/six.sh): at A near left the lanes slide about 4 px a
  frame toward the lens and the stones ride them; at B near one wake patch is seen to drift to the right
  along its lane. Draft stills cost 17.9 to 19.1 s with about 6 s of start, so about 12 s a sample: twice
  the aim. Savings to try: skip a wake class whose tone is 0, take the floaters' atan only where they throw.

### Day 1, 10:25 to 11:05 UTC: the look of the skim against the approved close (soft lanes, sand, hues)

All of this is on top of head 0da1bbe and NOT yet committed when this entry was written.

MAIL 246 (low priority, about 10:53 UTC), verbatim: "Main is at d690e42a: the planet shader takes up to ten
patch levels now (it took six). The shader text of a globe with six levels or fewer is unchanged, and the
proof on the render machines shows every frame of every stop keeps its bytes. Also in it: raw motion follows
a body that turns under a camera that follows the place (only for a stop that opted in), and a probe option
that dumps the place picture. Merge origin/main into your branch when it suits you; no answer needed. If
your stop needs more than six levels to hold one texel per pixel through the dive and the rise, use them
inside your memory budget and say so in your next report."

What the approved close shows at 8x (crops at 240,900 and 1060,880 of the 1920 wide picture):
- A ring: wide soft lanes of grey beige, rose and blue grey; between them bunches of thin lines, 1 to 2 px
  wide, the bright ones nearly white and the dark ones nearly black; over all of it a gentle grain of the
  size of a pixel (about plus or minus 10 percent), a few white dots of 2 px and rose specks.
- B ring: pastel lanes (cream, peach, rose) with thin dark grooves, the same gentle grain.
- No olive and no green lanes anywhere; a hue that changes without the brightness reads as a rainbow.

What was changed to get there:
- Shadows of the globe on the rings fade by the slant of the Sun; halo and dusk of the globe by nearness
  (skim.json light.halo, light.dusk): the globe row at y 480 reads close to the approved.
- The ladder has its own strengths near the sheet: ringfine.json "near" (level, groove, hue with follow, green
  and gold, edge, rough, even, footprints); RingField.set(near) blends far and near by the logarithm of the
  camera's height (the same value as the light). The far values did not change, and near has no weight in
  the hold. uRfNear and uDetail are gone; ringFine has no "more" any longer.
- lanes {from 5, amount 0.7}: from octave 5 on the cells take turns, a bright one next to a dark one
  (ringLane), so the fine structure is lines side by side and not noise. The mean for such an octave is
  lanesMean in field.ts. TO DO: the two numbers in ringLane (0.15, 0.35) and in lanesMean (0.3) are literals;
  move them to ringfine.json lanes.
- hue.follow: a brighter ringlet is warmer and more rose (dense [0.2, 0], thin [1.0, 0.6] per unit of the
  level's exponent). The hue axes act in linear light, so a difference seen on the display needs about 2.2
  times the amplitude.
- hue.green 0.25 near: the share of the rose to green axis kept on its green side. hue.gold 0.35 near: the
  share of the warm to cool axis kept on its warm side in the thin rings (olive lanes in the A ring came from
  there). Both are 1 in the hold.
- flatten (skim.json light.flatten, sheet.ts uFlatten): near the sheet the broad zones of the dense rings are
  evener: lum *= pow(clamp(knots at width 0.02 / pivot 0.42, 1/1.6, 1.6), power -0.6 * (1 - thin)). The
  B ring's contrast at 32 to 128 px was 2.4 to 2.8 times the approved before.
- The sand (ice.json grain, ice.ts iceGrain): the sheet has grains of many sizes, from finest 0.0002 radii by
  7 doublings; a size is a pair (across the orbit, along it); each size is smooth noise in the sheet with
  every row of cells on its own orbit (Kepler shear). A layer shows the sand whose grains are its number of
  pixels across and along the orbit at that pixel, blended between the four sizes next to that and
  normalised; beyond the coarsest size it merges into the sheet. Reason: a round grain seen at a slant is a
  dash, and a single size is either mush far away or boulders near. Layers now: 1.1 px (dense 0.3, thin 0.28,
  with sparks) and 5.6 px (0.08, 0.08). At 1.4 px and thin 0.55 the A ring read as brushed cloth with strokes
  of 3 to 5 px: too coarse and too strong.
- Stones: eight classes (three resting, five floating), cells 0.0024 to 0.048 radii; presence 1 - exp(-deep^2)
  so a stone smaller than a pixel fades and does not flicker; their shadows fade by the slant.

Scale facts at 3720 (pixels per radius, across the orbit and along it): A near left 2529, 1410; A left 2006,
651; B near 807, 1547; B low right 608, 1848; B mid 742, 622; B far 557, 156. Octave cells: o3 0.016, o4
0.008, o5 0.004, o6 0.002, o7 0.001, o8 0.0005 radii. A hard edged level octave of cells c px wide has its
band energy peak at waves of 2.5c to 5c. The knots of the model are 2048 over 1.2 to 2.5 radii, 1.6 px a
knot at A near left.

Measured at draft 3720 after this pass (film over approved, bands 2-4 to 64-128 px, before the last hue and
sand step): A near left luma across 1.13 0.67 0.98 0.69 1.85 1.44, along 1.35 1.69 1.76 1.58 0.98 0.71,
red/blue across 0.41 0.34 0.43 0.50 0.49 0.25; B near luma across 0.88 0.70 0.88 0.65 1.74 2.01, along 1.14
1.15 1.42 1.15 1.05 0.77, red/blue 1.72 1.45 1.26 1.07 2.40 1.26. Mean rgb film / approved: A near left 0.508
0.478 0.426 / 0.520 0.476 0.431; B near 0.782 0.700 0.619 / 0.758 0.689 0.612; B far 0.693 0.620 0.553 /
0.728 0.645 0.563. G17 at draft after the last step: median 0.864, p25 0.411 (it was 0.693 at the softest
step and 1.133 before the softening, when the lines were too hard).

11:05 to 11:25 UTC, the hold re-checked, the sand in the hold, a bug in the stones

- Review still of 3720: 70.8 s with 6 samples (about 11.8 s a sample). G17 on it: median 0.893, p25 0.470
  (limit 0.8). Draft 3720: 0.864 and 0.411.
- The hold with this ice (3465 at draft): the sand at full strength read as brushed cloth and the A ring was
  brown rose and too dark. Changed: ice.json grain far 0.5 (the sand's share of its strength in the hold;
  ice.set(spin, near) blends far to 1 by nearness), skim.json light.tint far and near (set.ts blends by
  nearness; far dense [0.97, 1.04, 1.08], thin [1.21, 1.285, 1.21]; near dense [0.9, 0.926, 0.888], thin
  [1.28, 1.42, 1.29]), a gentler far thin ladder (ringfine.json far level.thin and groove.strengthThin) and
  far hue.green 0.4, hue.gold 1.0.
- The hold after it (3465 at draft): G17 median 0.950, p25 0.570 (the kept build's still: 0.861). Mean rgb
  hero / mine: A left 0.620 0.550 0.486 / 0.596 0.527 0.452 (before the last blue step), B left 0.875 0.798
  0.694 / 0.853 0.766 0.655, B bottom 0.597 0.531 0.458 / 0.668 0.583 0.495. Still different in the hold: no
  bright thin line at the A ring's outer edge, ringlets inside the Cassini division where the hero has a
  clean dark gap, B ring broader zones than the hero's fine lines.
- Commits e7c7a2a (skim look pass) and 9860e4d (merge of origin/main d690e42, ten patch levels), both pushed.
- Six draft frames 3718 to 3723: the lanes slide about 4 px a frame toward the lower left and white stones
  ride them, but small dark level dashes lay scattered over the near field and read as scratches.
- The cause was a bug, not the look: in iceStones the two rays kept off the floor, Dc (view) and Sc (Sun),
  were built as vec3(horizontal.xy, vertical), but the sheet is the plane y = 0 (e = vec3(e2.x, 0, e2.y)),
  so the vertical part sat in z. Every resting stone was seen and shaded along a ray that lay nearly flat in
  the sheet: a level dash. Fixed: Dc = vec3(dv.x * flat, vertical, dv.y * flat), the same for Sc. The bug
  has been there since the stones were first written (d5b0f78), so every earlier picture of stones had it.
  After the fix the resting stones are bodies with a lit top and the dashes are gone. G17 at draft 3720
  after the fix: median 0.866, p25 0.413.

MAIL 252 (high priority, about 11:33 UTC), verbatim: "MAIL 252 from the Builder (/root) to saturn_coder. I
rendered your commit 9860e4d7 on the render machines: the surface view 3630 to 3808, every second frame, draft
tier, joined to a clip and looked at frame by frame (3770 to 3788 are still out). Three sheets attached. No
answer needed before your next report.

What is good: a true plane with ringlets at every scale, the true globe, both shadows, stars through the gap.
Nothing is a stretched picture any more. Keep that.

What is wrong, with frames, in the order I would fix it:
1. The flight. Over the 180 frames the plane tips a few degrees and the pattern slides by about 3 to 4 px a
frame at the bottom edge (my estimate from the sheet: the dark gap moves about 600 px in 168 frames). It reads
as a slow tilt, not as a skim. The view must show clear forward movement and depth in every part of its
length: the near sheet passing under the lens at 10 to 20 px a frame at the bottom edge, ice near the lens that
crosses the frame within 10 to 40 frames with parallax against the sheet behind it, the globe growing clearly.
The pose at 3720 stays the approved shot; the speed through it is yours to raise.
2. Ice near the lens. At native size the near sheet shows fine lines and a salt and pepper grain, and a few
white dots. There is no ice with size and depth yet: blocks from about 3 to 40 px with a lit side and a shadow,
most small, a few large, each on its own orbit. The grain must be filtered by the pixel footprint so it does
not crawl: show three consecutive frames at native size at the review tier.
3. 3720 against the approved image (pair attached): the globe is larger and stands further right, cut by the
frame edge, where the approved image shows the whole lit limb with dark sky to its right. Lay the approved
image over 3720 at half weight and bring the limb, the edge of night and the two edges of the dark gap onto
each other.
4. The night side of the globe glows red brown with a soft edge of night. The approved image has a black night
side and a crisp edge.
5. Palette and line weight: outside the gap the rings read grey green and grey blue, and the lines are hard and
all of one weight. The approved image has cream, rose and warm grey in broad soft bands with few fine lines
between them.
6. Then the dive and the rise as one scene from the hold to the skim.

When 1 and 2 are done and pushed, say so with the commit and I render every frame again."
(Attached: saturn-view-every-12.jpg, saturn-3720-beside-approved.jpg, saturn-native-consecutive.jpg. The
commit it rendered still had the stones bug, fixed in f3ee2fd.)

11:35 to 12:45 UTC, after mail 252: pose fit, new flight, soft outer rim, true blocks

Mails in this time (cores verbatim):
- MAIL 258 (low, about 11:55): "Main moved to da69509a. New in the globe shader and the loader, all off unless
  your stop asks (notes: assets-src/shared/GLOBE-NOTES.md): `ctx.texture(path, {srgb: false, channels: 1})`: a
  one channel texture, a quarter of the memory. Use it for every mask and height map you load, if your set is
  near its memory limit. `PatchSet.own?: boolean[]`: a patch level with its own light. `PatchSet.fadeMinor?:
  boolean`: a level fades in by its fine axis on screen. MAX_PATCHES is 10. No frame of main changed. Merge
  origin/main into your branch at your next commit. Nothing else changes for you: go on with the list of my
  last mail to you."
- handover_engineer (low, about 12:10, no answer needed): E3. For a stop with handover: {} the generic path
  between the far pose and T is a steady descent or climb; height and field of view on one schedule,
  direction and attitude on a second that leads it; level glide near the ground along the heading of the
  close side; at T the globe camera carries the close side's own speed, turn and climb. Options per kind:
  "The old path back: handover: { dive: { path: { turnFall: 0.3, level: false } } } (the same under rise)",
  path.levelBy (dive 0.8, rise 0.5), path.sidestep { right, up, by } ("For a moon or a ring in the way of
  the dive"), skyFloor: true, place { seen, maxEnlarge, enlargeSoft }. Check: npm run handover -- --stop ID
  --tier draft. Requests for the engine: by message to handover_engineer.
- MAIL 263 (low): "I rendered every frame of 3630 to 3809 at f76f04b4, the head of agent/saturn-code. That
  commit holds the notebook only, so the clip shows the old slow flight and the old pose ... Push the code as
  soon as the new flight and the pose fit hold together, and send me one line with the commit. I then render
  all 180 frames at once and judge them. From your sheet I already see: 3630 shows the outer edge of the rings
  as a hard line with the dark sky behind it, which Part D rules out, so fade the sheet out by function there
  or keep that edge out of frame; and the flight now has clear forward movement, which is what the first clip
  lacked."
- MAIL 265 (high, 12:36): "E3 is on main. Main is at 03510ddd." For a stop that has opted in and uses the
  generic path read assets-src/shared/HANDOVER-NOTES.md, section "E3 as built". To keep the old line:
  `handover: { dive: { path: { turnFall: 0.3, level: false } } }` (and the same under rise), "Say so in your
  report, with the reason". "A stop that has not opted in keeps every byte." "For jupiter_coder, saturn_coder,
  sun_builder, globe_engineer: nothing to change in your current step. Merge main when you next push."

Point 3 of mail 252, the pose at 3720 (assets-src/saturn/code/pose_fit.py):
- The tool marks the lit limb, the edge of night and the two edges of the dark gap in the approved close
  (references, read only) and fits azimuth, foot, height, yaw, tilt, roll at vfov 48. Result in skim.json
  pose: azimuthDeg 4.72, foot 2.589, height 0.3955, yawDeg 22.22, tiltDeg 11.14, rollDeg -8.76. Fit: limb rms
  7.8 px, edge of night rms 27.4 px, gap inner edge +18.0 px, outer edge -16.9 px (the old pose had the limb
  58.9 px off). What still differs: the lean of the edge of night, and the approved gap is about 35 px
  narrower at its core than the true gap between B and A drawn from the measured profile.
- The approved close has ice in the bottom left corner and faint strands beyond: its rings reach further out
  than the model's rim (2.3394). So the fitted pose stands outside the rim (foot 2.589) and the sheet needs
  ice beyond the rim near the lens (the outer zone below).

Point 1 of mail 252, the flight (plan.ts skimAt and flight(time), skim.json path, skim_map.py same law):
- Path {forward 1.7, descent 2.2, side 0, yawDeg 0, pitchDeg 0}: an exponential law, the lens comes in and
  down by the same ratio every frame, so the flow on screen is constant over the 180 frames while the globe
  grows. Start foot 3.550 height 0.587; 3720 foot 2.589 height 0.396; end foot 1.978 height 0.268. Globe
  radius on screen 351, 501, 702 px.
- Flow in px a frame (constant): bottom left corner 17.7, left edge at y 800 11.0, bottom middle 8.0, middle
  at y 800 2.6, bottom right 12.4, right edge at y 800 6.3. The focus of expansion lies on the middle line
  about 490 px to the side of the centre. The rim passes the bottom middle at about skim frame 45 and the
  bottom left corner at about 90.
- This changes the end of the dive and the start of the rise (the skim now starts outside the rim and ends
  over the B ring). To tell /root.

The sand and the ringlets under a moving lens (ice.ts iceSweep, uIceMove; sheet.ts):
- One take of the shutter moves the lens; the point of the sheet under a pixel slides by iceSweep (radii,
  across and along the orbit, with the orbital turn of the ice). The grain is drawn out by that slide and is
  fainter by the number of grains the pixel passes over (ice.json grain.sweep 1.0); the ringlet filter takes
  the slide across the orbit into its footprint. So near sand is a soft streak that keeps its place, not a
  crawl. set.ts scales uIceMove by nearness, so the slide is 0 in the hold.

The outer rim by function (answers mail 263; sheet.ts SHEET_OUTER_GLSL, skim.json outer):
- Beyond the model's rim the sheet thins out by function: two exponentials, depth [0.55, 0.006] with lengths
  [0.09, 0.45] radii, ended between 3.2 and 3.9, inset 0.012, inkBy 8 (ink and thin are read at a radius
  pulled back inside the rim so the outer zone has ringlets of the A ring's kind). The depth is times the
  nearness of the lens: none of it in the hold (and no fragment beyond 2.5 there). The first try (depth[1]
  0.09, lengths 0.07 and 0.5) gave a broad fog band at the far left horizon: a thin sheet is solid at a
  grazing view, so the far veil must stay weak.
- Seen at draft 3630: a soft shore, no hard line against the sky.

Point 2 of mail 252, blocks of ice (blocks.ts, blocks.json; the old stones in the sheet shader are deleted):
- The old stones were discs drawn inside the sheet's fragment shader: no size, no depth. Now blocks are true
  bodies: one instanced mesh, each block a small faceted solid on its own Kepler orbit (position from its
  radius, its start azimuth and the turn of its orbit at the time of the take), so near ones overtake far
  ones and all of them pass the lens with parallax.
- Three classes in blocks.json: resting (on the sheet, half sunk), low (just over it), high (floaters up to
  0.22 radii over the sheet, with a swing). perArea [40000, 2500, 2000], sizes in radii [[0.0007, 0.012],
  [0.0006, 0.005], [0.0004, 0.004]] with power laws [3, 3, 2.4]. 21,655 blocks; the set is made in 2.9 s.
- Why they fade the way they do: with a power 3 law of sizes the cover by blocks wider than a pixel is the
  same at every distance and goes with one over the camera's height. So a block fades in by its width in
  pixels (fade.pixels [2.0, 3.6]) and by its distance in heights of the lens over the sheet (reach per
  class), and below that the sand of the sheet stands for it: no seam.
- Light: a resting block takes the sheet's own brightness at its radius (so it reads as a piece of the
  sheet, not as a white dot), times the sheet's law of view and Sun, times a face term: direct by the angle
  of the face to the Sun, a bounce from the sheet and the sky, a little light through the ice. Each block
  throws a soft shadow on the sheet (a second instanced mesh, flat, drawn before the blocks).
- Blocks exist only near the lens (blocks.set(focal, close > 0)): none in the hold.
- In view at skim frames 0, 45, 90, 135, 179, resting blocks at 2, 4, 10, 20 px and more: [8149, 1039, 57,
  0], [11456, 1965, 128, 6], [6619, 2795, 181, 17], [2715, 2338, 200, 16], [1375, 1372, 251, 21]. High
  floaters at 2 px and more: 214, 147, 35, 17, 6. Too few floaters late in the skim: to raise.
- Seen: drafts 3630, 3675, 3720, 3765, 3809 and the review still 3720. Blocks have lit faces and shadows.
  At the review tier the near field carries 4 to 9 px of shutter blur at these speeds, so blocks at the
  bottom edge are smeared and those in the middle distance are distinct. Still wrong: all blocks have the
  same shape, floaters are dark specks against the globe, a brushed hatch at bottom left, a pale haze band
  at the far left horizon, the ringlets under the blocks are hard and of one weight (point 5).
- Seconds: review tier 3720, 17 samples, 105.1 s, about 6.2 s a sample.

The hold, checked against head f76f04b (both at draft, 3465, same machine):
- 262,543 pixels differ, max 135; 19,688 by 2 and more, 1,500 by 8 and more, 432 by 16 and more, 33 by 64
  and more. The large differences are single points: head still drew the old stones in the hold as faint
  white points (some inside the globe's shadow on the rings, which was wrong); they are gone because blocks
  exist only near the lens. The rest is 1 level over the ring area; not separated whether that is the same
  stones below a pixel or rounding in the reworded sand. Limb, ringlets, shadows and colour look the same at
  native size (holdpair.png in the looks: head left, now right).
- The sweep term of the ringlet filter changes no pixel of the hold (measured: 0 pixels differ with and
  without it at 3465). The outer zone has depth 0 in the hold by its law (depth times nearness).

12:45 to 13:00 UTC, after f9007f0: mail 270, blocks third version, a render tree

MAIL 270 (high, about 12:47 UTC), verbatim: "From the Builder (/root) to saturn_coder. Mail 270. Got f9007f07.
I am rendering 3630 to 3809 at the review tier on 18 render machines now and will write what I see. Carry on
with points 1 and 2, then the dive and the rise (opt in to the handover, E3 is on main). The hold change you
name (old stones gone as faint points) is accepted if the hold at the final tier still matches the approved
image as well as before: check 3465 against the approved hero and name the number in your next report."

Blocks, third version (blocks.ts, blocks.json), why:
- The second version read as grey gravel: all blocks one shape, floaters dark specks against the globe. The
  skim looks toward the Sun (phase 110 to 140 degrees), so a body that only reflects shows its dark side. Ice
  is not opaque: each class now has `through` (light through the body, 0.55 to 0.7) and `white` (its own
  albedo range), and the light is level 1.0, bounce 0.6, sky 0.5.
- Shape: each block is a body of 80 faces (12 corners plus 30 edge middles, shape.round 0.55) and every
  corner is moved in or out by a hash of its vertex number and the block's own seed (shape.jitter 0.3), so no
  two blocks are alike.
- Floaters (class 3) now have an absolute reach in radii (0.6 to 1.2), not in heights of the lens, because the
  lens comes down through the skim and the old law left 6 floaters in view at the last frame. They pass the
  lens (passes = 1): such a block fades out between 46 and 110 px of width (fade.largest) instead of
  filling the frame.
- One take of the shutter: the block is drawn out along its own way on screen with ramps at both ends (a
  trapezoid of cover), its faces are shaded from the unsmeared body; the shadow is drawn out the same way.
  This matters at the draft tier (1 take); at 16 takes each take's slide is a sixteenth.
- Seen at draft, every 15th frame 3630 to 3795 (looks: saturn-code): white chunks with facets, floaters
  through the whole skim, the soft shore at 3630. To judge at the review tier: whether the field of small
  blocks is too busy over the bands (the approved close shows fine sand and soft bands, no blocks).

A render tree: /tmp/v/sync.sh copies the working tree's sources to /home/user/workspace/rt (node_modules,
public and references are links), and REPO=/home/user/workspace/rt makes st.sh, six.sh, every.sh render from
there. So a long render reads a fixed copy and the sources can be edited meanwhile. Still one render at a time.

13:14 UTC: MAIL 275 (high, to every stop builder and coder), verbatim core: "how your stop gets to its critic
rounds. No answer needed unless a point below is red for you. 1. A stop is taken onto main and its round 1
starts (rounds are numbered on from 37, up to three per stop, every critic each round) when four things hold on
one commit that you name: a. both handovers run with no cover and read as one place (Jupiter and Saturn: also
the surface view from code; the Sun: the surface view with its new motion and the rise); b. the machine checks
are green on every frame you changed: G5, G13 and G17 as the harness gives them, and the handover report of
`npm run handover -- --stop <id>`; c. the frames you may not change keep their bytes (your hold and your surface
view where it is approved, at the draft tier everywhere and at the final tier on the judged frames); d. build,
tsc and tests are green on a merge of the newest main. It does not have to be finished. What is still wrong
goes to the critics with the rest. Do not wait for a perfect state: when a to d hold, send me "READY <stop>
<commit>" with the list of what you still see as wrong. 2. Takes of generated assets: kit/06-ASSETS.md gives
six takes per asset per round, and six per phase for an asset made outside a round. A mail of mine with
findings is not a round. If an asset has used its six in this phase, keep its best take and say so in your
READY line. In a round each asset has six again where a critic asks for a change. Work by code has no take
limit. 3. I render every commit you name at every frame on the render machines and write what I see. Push your
code branch whenever your looks show something you want judged, and name the commit."
So the order now: blocks fourth version out (points 1 and 2), then the handover opt in at once, then READY.

13:25 UTC: MAIL 276 (high), verbatim: "From the Builder (/root) to saturn_coder. Mail 276: all 180 frames of
f9007f07 seen at the review tier (3630 to 3809, rendered on the render machines). The clip went to Brandon as
work in progress.

HOLDS, keep it: a real plane under one true flight in and down, nothing stretches or bends, the soft shore at
3630, the fine ringlets of the inner rings near the globe (3740 to 3745 at x 600 to 1300, y 380 to 630 are the
best part of the picture), the gap, the composition of 3720.

WRONG, most important first:
1. The ring reads as a floor. In the mid and near field (every frame; look at 3700 to 3705 and 3790 to 3795 at
x 0 to 700, y 680 to 1080, and at 3740 below y 630) the sheet is a solid board of planks or straw, broken into
dashes and box ends, with grey rocks lying ON it and casting shadows ONTO it. In the approved image the sheet
is clean, continuous, crisp ringlets with a satin sheen right down to the bottom edge of the frame, and only a
fine grain near the lens. Wanted:
 a. The ringlets continuous and smooth in the mid and near field too: no plank ends, no dashes, no box shapes,
 no cast shadow on a surface. With the ice switched off, 3720 must already read as the approved picture.
 b. The ice only as ice: near the lens the sheet dissolves into many small bright grains and a few larger
 chunks that FLOAT in a layer with depth (above and below the mid level of the plane, with parallax between
 them, each on its own orbit speed), lit as ice (bright, a little translucent, a soft shadow side, shadows from
 grain to grain only). Between them one sees the grains behind and dark space, never a floor. Far fewer large
 chunks than now, more shapes, none box like.
 c. With distance the grains go below a pixel and their sum is the ringlet colour, with no seam.
2. A fine hatch like woven cloth near the lens (3700 to 3705 lower left, the blue grey band of 3720 at x 0 to
350, y 560 to 1080). Something fine is not filtered for the pixel, or two line systems beat. Find it and filter
it; it will shimmer in the film.
3. Colour near the lens: olive green and blue grey patches read dirty. The approved lower left is cream, warm
grey, rose and a little cool grey. Mid field level: ours 156 against 176 of the approved (mean of x 700 to 1300
at the ring below the globe).
4. The night side of the globe is brown: near the terminator (x 1600 to 1700, y 450 to 550) ours is 45, 26, 12,
where the approved image goes to a neutral 12, 12, 11 within a narrow band. Narrow the terminator and take the
orange out of it.
5. The globe is smooth cream with little in it at this size (3740 crop). The approved globe has many fine bands
with small swirls. Check the texels on the globe in this view and give it the fine banding.
6. Fit at 3720 against the approved image (shares of the frame height): top of the globe 7 percent approved, 9
ours; where the globe meets the near rings 57 approved, 69 ours; the far ring edge at the left frame edge 38
approved, 35 ours. The globe is about a sixth too large and too low.
7. Speed: the near field moves about 5 pixels a frame from 3660 to 3780 and 2 from 3790 on. Do not let the
flight stall before the rise; the rise must take it over at cruise speed.
8. Still to do after that: the dive (3540 to 3629) and the rise (3810 to 3884) as one scene with the surface
view, with no cover and no swap that can be seen, and the hold 3465 number I asked for in mail 270.

Order: 1 and 2 first, they decide whether this reads as Saturn's rings. Push looks as you go and name a commit
when 1 and 2 are in; I render it at once. Then 8, then READY as mail 275 says."

13:56 UTC: MAIL 279 (high), verbatim core: "A time for READY. The rule of mail 275 stands... 2. Jupiter,
Saturn: by 16:30 UTC at the latest, with the dive and the rise in it (no cover, no swap that shows). 3. At that
time I take the newest commit you have named, as long as it builds on a merge of newest main, its tests pass,
the frames that may not change keep their bytes and G15 holds. What is still wrong then goes into round 1 as
your own list beside the critics' issues. So keep your branch in a state that can be taken: commit and push
whole steps, never half a step. 4. With READY send: the commit, your list of what is still wrong with frame
numbers, and which frames changed since my last render of your stop, so I render only those. 5. Each stop then
gets up to three rounds with fresh critics. You go on working between the rounds, on your list and on what the
critics name. No answer is needed."

MAIL 276 POINTS 1 AND 2, WHAT WAS WRONG AND WHAT IS THERE NOW (14:30 UTC)

Diagnosis, each proven by switching the part off in the render tree and looking at 3720:
- The planks, dashes and box ends were the wakes of ice.ts (ringlets cut along the orbit). Deleted.
- The grey rocks with shadows on a surface were the blocks (blocks.ts, blocks.json). Deleted.
- (At the draft tier only; the hatch the Builder saw at the review tier has a second cause, see THE HATCH
  AT THE REVIEW TIER below.) A hatch like woven cloth was the sand of ice.ts in the skim: fine points drawn out along the motion of
  the lens, crossing the ringlets at an angle, two line systems. The sand now has strength times (1 minus
  near), so it is the hold's sand only (the hold keeps its bytes: 3465 at the draft tier has 0 differing
  pixels against f9007f0) and the skim has none.
- With the ice off, 3720 reads as the approved picture: clean ringlets down to the bottom edge
  (look "3720 draft with the ice switched off").

What is there now: grains.ts and grains.json. One system of grains on three levels (sand, pebbles, chunks).
- Every grain is a body of its own: a cell on the orbit of its radius (rows by radius, each row turns at its
  own orbital speed, so near rows overtake far ones), a height of its own above or below the middle of the
  plane, three lobes, lit by the Sun by angle with a soft shadow side and light through the rim.
- The sum rule: where a level shows whole, the share grains.json.share of the sheet's optical depth is taken
  out of the sheet (sheet.ts: taken = grainTaken(grainCells(tau), dist); left = tau - taken; the rest is in
  the shade of the grains, exp(-taken / mu0)) and given to grains that have the sheet's own brightness at
  their place. So grains plus rest add up to the sheet and there is no seam where they go below a few pixels.
  Measured at 3720 and 3809, mean display level with grains over without: 0.91 to 1.07 in ten boxes with lift
  0.3; lift is now 0.42 for the two counted levels.
- A level shows by the width in pixels of its middle grain (levels.pixels): sand from 1.6 px, whole at 3 px.
  With sand 0.00096 to 0.002 radii that is whole within about 0.56 radii of the lens and none beyond 1.05.
  At 3720 the bottom edge is 0.67 to 1.06 away, so the sheet stays a sheet of ringlets down the frame and
  dissolves only at the lower left; at 3809 (0.45 to 0.71) the lower third is grains.
- Pebbles (0.003 to 0.007) are sparse bright ice over the sheet, chunks (0.008 to 0.03) are few, not counted
  in the depth, float up to 0.05 (some 0.15) radii off the plane and give the parallax.
- Per take the CPU lists the grains in view (about 310k at 3720, 420k at 3780, 100 to 190 ms), sorted far to
  near, drawn as points with an analytic smear over the shutter.
- Costs: a draft still is 12.6 to 13.8 s with grains and 12.1 to 12.4 s without (fixed costs included).

Commits: a7d092b (grains in place of blocks and wakes), 50b7312 (merge of origin/main 53a4d57). On the
merge: tsc green, vitest 162 of 162, npm run build green (checked in a clean worktree of the commit).

THE DIVE AND THE RISE AS ONE SCENE (14:35 UTC)

- plan.ts: handover opted in (params.handover, picture false: no place picture, the place is the scene
  itself). flight(time) is the one path from the hold to the end of the rise. divePose and risePose give the
  same lens for both views (the close view is the flight in the frame of the skim, twin() turns it back),
  coverAmount() is 0, place() is a point of the ring plane ahead of the lens of the skim (the ground of this
  stop is the ring plane, so Saturn flies its own path, not the engine's generic line to a point of the
  sphere). patchWeight is gone; set.ts gives the sky pictures weight look.patchShow and the engine fades them
  over skyFrames.
- The dive's descent law (diveReach): the distance of the lens to the globe's surface falls by a steady factor
  a frame. The rate comes up from the hold's own over the first share (skim.json handover.dive.rise 0.2) and
  comes to the skim's own over the last share (fall 0.25). First try was a trapeze on the share of the way
  between the hold pose and the skim pose of the same time; that failed E3 (frame 3610 at 2.66 times the mean
  rate, frame 3550 at 0.29 of the mean) because the skim pose itself moves under it. With the law on the
  distance: fastest frame 3596 at 1.211 times the mean, frame 3550 at 0.698 of the mean, flow gap at T
  0.004 px a frame (T is frame 3589).
- The rise keeps the trapeze on the share of the way (rise 0.25, fall 0.2): flow gap at T 0.046 px a frame
  (T is frame 3860), fastest frame 3870 at 1.391 times the mean. The rise path changed against the kept
  build, so the judged frame 3866 changes.
- Every look of the scene (gains, tints, haze, grains) is a function of the lens height over the plane
  (close in set.ts), so it is one function of time through T on both sides.

MAIL 284 (14:39 UTC, from the Builder, verbatim core)

"your trees differ from main in the globe engine files (src/bodies/haze.ts, src/bodies/planet.ts,
src/core/sets.ts, tests/globe-gl.test.ts, tests/globe-levels.test.ts, assets-src/shared/GLOBE-NOTES.md) and
lack tests/globe-haze.test.ts, which main has since 13:40 UTC (3d61ec53). A READY commit must build and pass
on a merge of newest main (mail 275 point d). Before your READY line: git fetch origin main, git merge
origin/main (merge, never rebase, main's version of every file outside your folders), npm run build, npm
test, and draft hashes of your kept frames again. Tell me in one line if a frame changes with the merge.
Your READY times stand (mail 279)."

HANDOVER RUN ON THE MERGED TREE PLUS THE HANDOVER STEP (14:37 to 14:44 UTC)

npm run handover -- --stop saturn --tier draft --only sides,flow,path,sheets: every line passes.
- Dive: T is frame 3589 (place window 3577 to 3589). Side difference at T: mean 0, 99.9th percentile 0, max
  1 display level. Flow gap 0.004 px a frame. Fastest frame 3596 at 1.211 times the mean rate, frame 3550 at
  0.698 of the mean, place at most 0.406 of the half frame from the middle.
- Rise: T is frame 3860 (window 3860 to 3872). Side difference pass, flow gap pass (0.046 px), fastest frame
  3870 at 1.391 times the mean.
- All six sheets looked at, every frame: no frame where the scene changes. The moon goes behind the dark
  limb of the globe over 3583 to 3591 (dive) and comes out over the top limb at 3870 (rise); both are true
  occlusion by the globe, the same on both sides of T. The sky pictures come in over 3868 to 3872 at the
  lower right. The rim of the rings goes from the soft rim of the skim to the edge of the hold over about
  3860 to 3870 (close 0.72 to 0.007).
- Seen and not yet solved: in the rise the moon passes the limb fast (about 20 to 30 px a frame against the
  limb at 3870 to 3872), which is the parallax of the fast last part of the rise.

THE HATCH AT THE REVIEW TIER (14:40 to 14:50 UTC): NOT THE SAND, THE RINGLETS

The draft frame is smooth, the review frame (17 takes) shows ropes on every steep ringlet at the lower left
(3720, x 0 to 320, y 620 to 860), a beat of 4 px along the line. Read from the pixels: a dark line one pixel
wide at a slope of one column in four rows is 161 where it sits on a pixel and 168, 170 where it sits
between two. Cause: in the skim an octave of ringlets was drawn in full from 0.675 px wide (near.footprints
0.45 times the footprint 0.75 px at many takes) and its edges and thin lines were 0.9 px wide. Ringlets
under one pixel cannot be drawn, they beat with the pixel grid; a line under about 1.8 px reads as beads on
a steep slope under the box of the takes. The draft tier hid it because one take widens the footprint by
the sweep of the whole shutter.
Fix (numbers only, the hold keeps its values at close 0): ringfine.json near.footprints 0.45 to 1.34 (no
ringlet under one pixel, in full from two) and a new near.filter 1.2 (edges and lines 1.8 px wide at many
takes) blended from filter 0.6 by close in field.ts set().
Review tier costs 5.6 s a take at 3720 with grains (17 takes, 95 s).

COMMITS OF 14:50 UTC AND WHAT WAS MEASURED ON 0111bf2

5c4004a (dive and rise as one scene, no cover), 715861f (ringlet filter of the skim), 0111bf2 (merge of
origin/main 7f7d7b4). Pushed 14:54, named to the Builder as the commit with mail 276 points 1, 2, 8.
On 0111bf2: npm run build green, vitest 162 of 162, tsc, shaderaudit exit 0, gauntlet 24a 24b pass.
Hold at draft 3390, 3465, 3539: 0 differing pixels against f9007f0.
npm run handover -- --stop saturn --tier draft --only sides,flow,path on 0111bf2: every line passes (copy
of the report in /tmp/v/handover_0111bf2.md).
Hold 3465 at the final tier against the approved hero (tools/measure/g17.py): median 1.073, p25 0.717 over
71 tiles (rule: median at least 0.8). Before, at draft: median 0.950, p25 0.570.
The plane passes the lens at a steady rate by the plan through the whole skim (out/scratch/flow.ts): 7.7 px
a frame at the bottom middle, 14.1 at (200, 1000), 2.6 at (960, 800), 3636 to 3804, no stall before the
rise. In the rise the flight turns round (the skim flies toward the globe, the way out lies behind): the
flow falls to 6.2 at 3816 and is 27 to 60 px a frame at 3828. That is a jolt; to solve after READY.

MAIL 287 (14:58 UTC, from the Builder, verbatim core)

"0111bf2 is rendering: JOB st4, the skim 3630 to 3809, every frame at the review tier, on 18 render
machines. You get my findings from the clip when it is back, about 15:40 UTC. Keep working, do not wait for
it. Seen in your looks of 14:50 (rise across T 3854 to 3865, skim every 15th frame, 3720 beside the approved
image): 1. Both handovers read as one scene. I cannot name the frame either. Good. 2. 3720 against the
approved image: in the approved the ringlets run sharp and readable to the bottom edge, with fine coloured
lines. In yours the lower left quarter is a bright carpet of grains that hides them, and from 3750 on the
lower third is gravel, as you say yourself. The grains must read as separate bodies with sheet between
them, fewer and darker than now at 3720, so the ringlets stay the picture and the grains give it depth.
Judge it on the pair at 3720, the approved image is the target there. 3. The far left of the plane (upper
left of the frame in 3630 to 3690 and through the rise) fades into a pale soft glow with no structure. It
reads as a wash. Give it ringlets or let it fall off into the dark, not into a haze. 4. The globe is larger
and further right at 3720 than in the approved image, and its bands are plainer. That is your point 6 and
point 5, they count for the match critic. READY saturn <commit> by 16:30 UTC stands, with G5, G13, G17, G15
and the handover report measured on that commit and the hold 3465 at the final tier against the kept
still. What is still wrong then goes into round 1 as your list."
The kept still is out/stills/f03465-saturn.hold.jpg (final tier, beauty, 16 samples, JPEG quality 92).

MAIL 289 (15:10 UTC, from the Builder to every stop builder, core)

"Main is e4782fe (plus a status commit)... the last engine piece for the handover... StopPlan now has a
public method named above (the top down view of the harness). If your plan class has a member of that name,
rename yours... Merge origin/main before you name your READY commit. READY times stand: ... Jupiter and
Saturn 16:30 UTC. A commit I take is checked as main plus your three folders on twelve render machines, so
what you send must build there. The engineer's report now prints a number "under the place picture"... It is
a warning, not a gate."
Checked: src/stops/saturn/plan.ts has no member named above. Main is 5eba228 at 15:13 (the method is now
topDown). Merge it before READY.

WORK ON MAIL 287 (15:00 to 15:45 UTC)

What the pair at 3720 showed, read from the frames and from out/scratch/planemap.ts:
- The lower left quarter at 3720 is the A ring of the model (radius 2.02 to 2.36), not the ice past the rim.
  Past the rim (2.3394) lies only the corner x under 100, y over 950. At 3660 the camera's foot is at 3.18
  and the left third of the frame is ice past the rim; the foot crosses the rim at about 3745.
- Point 2, grains. Trial A (share 0.35) took the carpet away at 3720 but 3809 was still gravel. Trial B:
  share 0.15, sand pixels [3, 6], gain [0.7, 0.7, 0.5], lift 0, presence [1, 0.06, 0.05]: at 3720 and 3809
  the ringlets are the picture and single bodies lie on it. Bodies read as pale beads: light.ambient 0.22 to
  0.12 and wrap 0.35 to 0.15 so a body has a lit side and a dark limb.
- Point 3, the wash. Past the rim the ice had no structure wider than the fine ladder, so far from the lens
  it was a plain veil. Now it lies in ringlets of its own (skim.json outer.bands, sheet.ts sheetOuterBands):
  three sets of plateaus (0.085, 0.031, 0.0115 radii) that are all open at the rim and have more and wider
  gaps the further out (gap share 0.6 at 0.3 radii past the rim), filtered by the footprint, a set finer than
  the footprint counts by its mean. Seen at 3660: the rings go on outward in fewer and fainter ringlets and
  end in the dark, no haze. None of it in the hold (the depth past the rim is 0 there).
- Why the near ringlets were soft bands of pastel colour: the strengths of the ladder are per octave, so near
  the lens the octaves 0.032 to 0.008 radii, 40 to 10 px wide there, had the weak level and the soft edge
  (0.35 cells) and the strong hue that suit them in the middle distance where they are 5 to 10 px wide. And
  the finer octaves that carry the contrast are wiped near the lens by the sweep of the shutter (7 px a
  frame at the lower left, about 4 px across the ringlets). Fix in field.ts ringFine with numbers in
  ringfine.json near.wide: an octave from the third on that is wide on screen (8 to 24 footprints) gets
  level + 0.2, an edge of 0.07 cells and keeps 0.4 of its hue. Exact zero in the hold (the terms are times
  0 there).
- Point 4 of mail 276, the night side: the dusk now cuts between the cosines -0.02 and 0.12 (was -0.2 and
  0), and the floor of the night side is grey (dusk.grey, globe.ts uDuskGrey) instead of the red of the low
  Sun. Measured at x 1600 to 1700, y 450 to 550 at 3720: 45, 26, 12 before; 24, 7, 2.5 with the narrower dusk
  alone; the approved image has 14, 14, 12 there.

MAIL 290 (15:14 UTC, from the Builder, core)

"Main is 5eba228. The engine's top down view of the harness is now StopPlan.topDown, not StopPlan.above...
Merge origin/main (5eba228) before you name a READY commit. Nothing else in mail 289 changes."
Note from the handover engineer (15:20): a new place option edgeIn for stops with a place picture. Saturn
has none (one scene, no cover): nothing to do.

TRIALS C TO F (15:12 to 15:30 UTC), the pair at 3720 at the review tier

Regions (x, y in the 1920 x 1080 frame) and the approved means: lower left 0 to 500, 700 to 1080: 118, 109,
101; left edge 0 to 250, 480 to 700: 115, 104, 94; A ring mid 150 to 450, 560 to 700: 93, 85, 80; mid B 700
to 1300, 640 to 760: 196, 178, 159; B near 700 to 1300, 850 to 1050: 142, 128, 114; night 1600 to 1700, 450
to 550: 14, 14, 12.
- Trial C (wide law level 0.2, no tint change): lower left 142, 135, 123, left edge 158, 149, 138, A ring mid
  130, 121, 112: the A ring near the lens too bright and olive. Cause: tint.near.thin [1.28, 1.42, 1.29]
  lifted the thin ring (the gap and the A ring, thin is 1 from radius 1.95 outward) with more green.
- Trial E (thin tint [0.89, 0.966, 0.885], hue.green 0.1, dark 0.25, flatten.power -0.35, wide level 0.3 from
  3 to 9 footprints): 102, 93, 84; 118, 108, 99; 105, 95, 86; 190, 166, 142; 121, 106, 93; night 12, 12, 12.
- Trial F, kept (dark 0.1, flatten.power -0.45, wide level 0.4 from 2.5 to 7.5 footprints, hue kept 0.6
  between 12 and 36 footprints): 101, 92, 83; 114, 105, 96; 105, 94, 86; 189, 165, 141; 120, 105, 93; night
  12, 12, 12.
- Fine detail, the standard deviation of the picture minus its Gaussian blur of radius 2, 5, 12, 30 px. Lower
  left: approved 25.4, 31.8, 34.6, 36.8; trial C 6.4, 12.5, 19.0, 24.3; trial F 8.0, 16.9, 25.3, 31.9. Mid B:
  approved 16.9, 20.2, 21.7, 22.7; trial C 8.9, 12.1, 13.8, 16.0; trial F 11.1, 15.4, 18.6, 21.3. So the
  ringlets 10 to 60 px wide are close to the approved now, the lines of 2 to 5 px are a third to a half of
  it: the shutter sweeps 4 to 7 px across them near the lens. Still wrong, on the list.
- Three frames in a row at native size (3719, 3720, 3721 at the review tier, three_ll.png and three_mid.png
  in the looks): the same ringlets in the same places, no hatch, no crawl; the bodies drift.
- The hold keeps its bytes with all the new terms: beauty drafts 3390, 3465, 3539 equal the bases of the
  kept build byte for byte (15:30). Use plain npm run still for this check, not the script with --diag
  nograin: the bases are beauty frames.

STILL WRONG AT READY (16:30 UTC), for round 1
1. Fit at 3720: the globe is about a sixth too large, too low and further right than in the approved image.
   At x 1400 to 1900, y 760 to 900 ours shows the thin inner ring and the gap over the night globe (83, 66,
   54) where the approved has bright rings (193, 177, 162).
2. The globe's bands are plain, no small swirls (3740).
3. Fine lines near the lens are fewer than in the approved (numbers above), and the B ring near the lens is a
   little dark (120, 105, 93 against 142, 128, 114 at 3720).
4. The rise: the flow over the plane falls to 6.2 px a frame at 3816 and is 27 to 60 px a frame at 3828, a
   jolt. The moon passes the limb fast at 3870 to 3872.
5. Bodies: shapes still few; some read as pale beads.
6. The terminator may read hard at 3630 to 3660.

MAIL 293 (15:36 UTC, from the Builder, core for Saturn)

"MAIN is 0eae595... Merge main 0eae595 before your next named commit. Nothing outside your three folders, as
before. HOW IT GOES ON for every stop: the commit you named READY is checked on the machines (reference
frames, kept frames at the final tier, handover report, then G15 here). Green: it goes onto main and the
stop's first round starts with fresh critics. Your own list of what is still wrong goes into that round
beside what the critics name. Keep working on your list meanwhile and name the next commit when a cure is
rendered and proven; it is taken as the fix of the round... saturn_coder: READY by 16:30 UTC stands. Your
0111bf2 skim is rendered at the review tier, every frame 3630 to 3809, and shown to Brandon. Seen by me: the
far left of the ring plane is a pale glow with no structure from 3630 to about 3700; from 3750 the near
grains read as a gravel bed with no ringlets between them; the globe's bands are plain beside the approved
image."

THE MERGE OF MAIN 0eae595 (15:35 UTC) AND THE TEST IT BROUGHT

- Merge 92226bb: main's version of every file outside the three folders (git diff origin/main outside them
  is empty).
- One test of the new main failed on the merge: tests/place.test.ts, "the top down view of the harness". It
  reads a plan's place as a unit vector (a direction from the centre of the globe) and asks topDown to sit on
  the line through it, looking at the centre. Saturn's place was a point of the ring plane ahead of the lens
  of the skim, 2.6 and more radii out, so the test could not hold.
- Cure in plan.ts: placePoint() is that point of the plane, place() is its direction, and topDown() is
  overridden: on the line from the centre through the place at the distance and field of the given pose,
  looking at the centre, the heading of the lens at the handover up.
- Not on a pixel path: place is read by tools/handover.ts (where the place lies in the frame) and by the
  test only, topDown by the harness's forced view only. So the frames keep their bytes; proven by drafts
  after the change (see the READY report below).
- With the unit place the handover path still passes: the place is at most 0.172 of the half frame from
  the middle in the dive (frame 3550, it was 0.406 with the point of the plane) and 0.378 in the rise (3879).
- vitest 170 of 170, tsc clean.

MAIL 295 (16:04 UTC, from the Builder, core for Saturn)

"MAIN is c9bc056... Merge main before your next named commit. Nothing outside your three folders, as before.
ROUNDS... G13 is counted on every frame of the dive and the rise... Batch two (the Sun, Mars, Venus, Jupiter,
Saturn) starts at about 17:15 UTC with every stop that is on main by then... A check of a named commit takes
about 25 minutes on twelve machines, so name it by 16:45 UTC to be in batch two... saturn_coder: READY by
16:30 UTC stands. A commit named by then is checked and on main by about 17:10 UTC and in batch two."

READY (16:20 UTC): WHAT WAS MEASURED AND ON WHICH STATE

The states: fefa26e (work on mail 287), 92226bb (merge of main 0eae595), 569bef7 (plan.ts place and topDown),
then the merge of main c9bc056 and this notebook on top. The Saturn sources of 92226bb and of the named
commit differ in plan.ts place() and topDown() only, which no pixel reads.

Measured on 92226bb (render tree, full assets):
- G5 PASS at the final tier: 3465 hold invalid 0 coverage 0.559; 3567 dive invalid 0 coverage 0.449; 3720
  terrain invalid 0 coverage 0.737; 3866 rise invalid 0 coverage 0.560.
- G17 FAIL: 3465 median 1.073, p25 0.717 over 71 tiles; 3720 median 0.519, p25 0.206 over 62 tiles (rule
  0.8). Tile map at 3720 (12 by 8 tiles of 160 by 135 px, ours over approved): 18 tiles at 0.8 or more, 32
  are needed, 15 lie between 0.5 and 0.8. The lower left (rows 4 to 7, columns 0 to 3) is at 0.07 to 0.42:
  the approved image has sharp lines of 3 to 12 px period to the bottom edge, ours has few. The grain carpet
  that carried G17 before (mail 287 point 2) is gone, and lines of that period near the lens are wiped by
  the true blur of the flight across the ringlets (4 to 7 px sweep a frame).
- G13 FAIL (every 10th frame, 50 frames): 3810 4.10 percent and 3820 4.57 percent soft against 2 percent;
  every other frame 0 (3800: 29 pixels). The soft pixels are the globe at the right frame edge (x 1684 to
  1919, y 412 to 903 at 3820) at 0.93 to 1.0 map texels a pixel: the closest pass of the globe at the end
  of the skim and the first frames of the rise. The sheet has none. Not measured before with this flight;
  the flight and the globe are those of 0111bf2, so it holds there too.
- G15 PASS (at most 2 sets a frame; saturn/web 63 MB, saturn/full 239 MB).
- Handover sides, flow and path pass: dive T 3589, flow gap mean 0.004 px, largest 0.006; rise T 3860, gap
  mean 0.046 px, largest 0.056.
- The final tier 3720 without grain is byte equal to the review tier render (17 takes).

The hold 3465 at the final tier (16 samples, 85 s): sha256
4765f239f22e6d470a79ecc1c7bef0e52b80f53a6eb397e44524be2ed6d78b52. The kept still's source fingerprint is
f671886b1bf3099675d2378858080385e2ac703a0dfb000a94861ad6e5cacd0e: not the same bytes.
- Against the kept still: mean difference 13.80 levels (7.66 after a 12 px blur), 37 percent of the pixels
  over 8 levels, no shift. The globe is equal (under 2 levels). The rings differ: they come from the ring
  model, every ringlet lies elsewhere, the A ring is smoother, the bright outer line of the A ring and the
  thin lines outside it are missing, the inner edge of the B ring is brighter.
- Against the approved hero: this build 14.56 (8.08 blurred), the kept still 5.05 (2.13 blurred). G17
  against the hero: this build median 1.079, p25 0.719; the kept still median 1.061, p25 0.933.
- Region means hero, this build, kept: A ring left 154,137,122 / 159,142,125 / 159,141,125; B ring
  195,176,152 / 188,165,140 / 199,179,155; A ring near 101,89,80 / 109,95,82 / 108,94,84; globe 198,174,138
  all three.
- So the hold is a worse match of the approved hero than the kept still, in the rings. "The hold keeps its
  bytes" in these notes means against my own f9007f0 and 0111bf2 (the bases in /tmp/v/hold), not against
  main's kept build.

STILL WRONG AT READY (the list sent with it)

1. G17 red at 3720 (0.519 against 0.8): too few sharp fine lines in the lower left and near the lens.
2. G13 red at 3801 to about 3828 (3810 4.10, 3820 4.57 percent): the globe's map under one texel a pixel at
   the closest pass. Cures: a finer code layer on the globe (also point 4) or a wider pass.
3. The hold's rings are not the kept still's and match the hero worse (numbers above), 3390 to 3539.
4. Fit at 3720: the globe about a sixth too large, too low and further right (top of globe 9 against 7,
   globe meets the near rings 69 against 57, far ring edge at the left frame edge 35 against 38 percent of
   the frame height). At x 1400 to 1900, y 760 to 900 ours shows the thin inner ring and the gap over the
   night globe (83, 66, 54) where the approved image has bright rings (193, 177, 162).
5. The globe's bands are plain, no small swirls (3740; globe tiles 0.50 and 0.54).
6. B ring near the lens and lower left a little dark at 3720 (120,105,93 against 142,128,114; 101,92,83
   against 118,109,101).
7. 3630 to 3690: the globe seen through the Cassini division is a wedge with a sawtooth edge (x 1060, y 756
   at 3630; x 1090, y 824 at 3660). Already in 0111bf2. A moire of the rings' fine shadow lines on the globe
   with the lines of the gap. Cure idea: soften the ring shadow on the globe in the skim (exactly 0 in the
   hold).
8. Rise: the flow falls to 6.2 px a frame at 3816, then 27 to 60 px at 3828 (a jolt); the moon passes the
   limb fast at 3870 to 3872.
9. The bodies near the lens: few shapes, some read as pale beads (3750 to 3809).
10. The terminator may read hard at 3630 to 3660.

MAIL 298 (16:16 UTC, high, verbatim)

"MAIL 298 from the Builder to saturn_coder, 16:16 UTC. READY d4015b7 is read. The list is what a READY should
be: measured, with the bad news first. Decision: (b). It is not taken with this hold. The hold is a judged
frame and R1 holds it against the approved hero; 14.56 against 5.05 gives away a frame that was right, and for
every stop the frames that may not change must keep their picture. A round started on d4015b7 would also spend
one of Saturn's three rounds on three things you already know (the hold, G17 at 3720, G13 at 3801 to 3828). In
this order: 1. The hold. 3465 at the final tier must be the same picture as the kept still: against the
approved hero no worse than the kept still's two numbers (5.05, and 2.13 after the 12 px blur) by more than a
tenth, with the bright outer line of the A ring, the thin lines outside it, the Cassini division at its width
and the C ring over the globe all there. The way you name is right: down to the scale the hold resolves, the
radial profile of the model is the kept ring picture itself, and the model adds ringlets only below that
scale, so nothing of the model shows in the hold and its detail comes in as the camera closes. Check 3390 and
3539 as well, and the first dive frames 3540 to 3560: no ringlet may move, appear or fade while it is wider
than a pixel. 2. G13 at 3801 to 3828: the finer code layer on the globe, which is also your point 5. 3. G17 at
3720. You name the cause yourself: the flight's blur across the ringlets wipes lines of 3 to 12 px. The
approved image has sharp ringlets in the lower left and near the lens. Cure the cause over the whole skim, not
at the judged frame alone: less of the flight across the ringlets and more along them with the globe kept
ahead, or near structure that is wider than the blur. Say which you chose and why. No change of speed around
3720. Then name the commit. READY by 18:30 UTC with point 1 done and proven by the same numbers; points 2 and
3 in it if they are rendered and proven by then. If point 1 is not there by 18:30 UTC, the newest named commit
is taken as it stands and the hold is the first severe issue of Saturn's round 1, because no single item may
hold up the film. Run the handover tool with every part before you name it (no --only): the parts frames,
under and top were not in your run. My own take check had the same gap until 16:10 UTC. Points 4 to 10 of your
list go into round 1 as you wrote them. Your point 8 (the jolt in the rise at 3816 to 3828) is a motion fault
a critic will name at once: take it up right after point 1 if it is cheap."

WHAT THE KEPT HOLD IS (read 16:17 to 16:23 from origin/main c9bc056)

The kept rings in the hold are not a plain radial profile. rings.ts at uClose 0 draws: the polar picture of the
hero (polar-rings.jpg, weight uPolarW, texel density uPolarFit.z and .w), an inner map (polar-inner.jpg, the C
ring), the radial profile rings.bin (hero rows, n 32768, width 8192, height 40) read at a radius warped by
azimuth (polar-warp.bin, uPolarShape), arcs outside the edge, rim tint and halo, sparkle, mottle turning with
Kepler time. set.ts drives it with close (from the camera height over the plane, look.closeRange), poseW (the
distance to the hero pose, look.heroRange), polarW, gate, skimW, the kept globe, shell and streak. A radial
model cannot reach 5.05; the hold has to be drawn by the kept code itself.

PLAN B FOR MAIL 298, POINT 1 (started 16:24)

- The kept build's Saturn code goes verbatim into src/stops/saturn/kept/ (set, globe, rings, profile, look,
  ice, shot, streak, titan, plan and the kept JSON files they import), import paths one level deeper, the same
  assets under saturn/.
- My set.ts builds both sets and gives the engine one set. For every take either the kept set or the model set
  is visible, never both: kept for the approach, the whole hold and the dive through 3560, then a dissolve by
  takes over about 3561 to 3585 (it ends before T 3589), the model from there through the rise and departure.
  Model share w: 0 while time is in the hold or before, then a smooth step of the camera's distance from the
  hero pose between two values from a JSON in my folder, 1 from the terrain start on. The take choice is a
  pure function of time: v = frac(time * fps * 5 / shutterFraction), model if v < w. The average of the takes
  is then an exact mix of two whole pictures.
- Proof wanted: drafts 3390, 3465, 3539, 3540, 3550, 3560 byte equal to the kept build's drafts
  (/tmp/v/kept/k_*.png, rendered from main c9bc056); 3465 at the final tier with the kept still's fingerprint
  f671886b1bf3099675d2378858080385e2ac703a0dfb000a94861ad6e5cacd0e, at most 5.555 and 2.343 against the hero.
- Honest limit: inside the dissolve the kept ringlets fade out and the model's fade in. The full cure is to
  build the model's field from the kept profile with the same warp, model octaves only below that scale.

STATE 16:40 (c605678, pushed, not named)

- Plan B is in: src/stops/saturn/kept (set, globe, rings, profile, look, ice from main, plan.ts an adapter on
  the one live plan, pose.json the kept close pose numbers), model.ts (the model set, was set.ts), set.ts the
  composer, skim.json handover.kept (from 0.31, to 0.53 of the dive: frames 3567.9 to 3587.7; strides).
- Measured: drafts 3390, 3465, 3539 byte equal to main c9bc056 (/tmp/v/kept/k_*.png). 3465 final tier sha256
  f671886b1bf3099675d2378858080385e2ac703a0dfb000a94861ad6e5cacd0e (the kept still's fingerprint); against
  the hero 4.803, 2.124 blurred (script /tmp/v/herocmp.py; it gives the kept JPG still 5.051, 2.132).
- Along the flight the kept set's weights stay at hold values through 3560 (pose 1, polar 1, close 0); from
  3562 its own morph runs (pose 0.98 at 3562, 0.52 at 3572, 0.09 at 3582, 0 at 3590; polar 1, 0.46, 0.02, 0).
- Vitest 170 of 170, tsc clean.
- The rise in numbers (out/scratch/rise.ts): speed over the plane 2.37 percent of the height a frame forward
  in the skim, 0.90 at 3816, then backward up to 12.6 at 3848. A pull back. Not a number to tune.

MAIL 302 (16:42 UTC, high, verbatim)

"MAIL 302 from the Builder to saturn_coder, 16:42 UTC. On your state of 16:40 (c605678).
1. The kept set for the approach and the hold: accepted. 3465 with the kept still's own fingerprint is the
proof I asked for.
2. The dissolve of two whole pictures in 3568 to 3587 is not accepted as it stands. Twenty frames in which one
set of ringlets fades out while another fades in elsewhere is a change of picture in view, the very thing the
note of 05:57 UTC is about; a viewer stepping through names those frames at once. The cure is the one you named
yourself at 16:11 as way (a), now for the dive instead of the hold: the model's coarse field is the kept ring
picture. Take the radial profile (and the opacity) of the kept picture on the plane, as the model sees it along
the dive, as the model's own profile down to the scale that picture resolves, and let the functions add only
ringlets finer than that, growing with the closeness of the camera by pixel footprint. Then both scenes show
the same ringlets in the same places through 3568 to 3587, the takes of the two scenes can share the shutter
without a ghost, and what changes is light and fine detail, not the picture.
3. The proof is a number, as for every other stop: both scenes drawn alone at the middle frame of the window
(3577) and at its two ends with the shutter closed, their difference as a picture and as mean and 99th
percentile. Aim: mean under 2 of 255 at 3577, no ringlet wider than 2 px present in one and absent in the
other. Send the three pairs with the READY.
4. Time: READY moves to 19:30 UTC so that this is in it. No single item may hold up the film, so at 19:30 UTC
the newest named commit is taken; a dissolve of two different ring pictures would then be the first severe
issue of round 1 in your own words.
5. Render time is not yours to save: push the commit to agent/saturn-code, mail me its sha and the exact
commands (G5, G13, G17, handover with every part, stills at any tier, review tier frames), and I run them on my
machines in parallel and send you the files. Ask as often as you need.
6. Point 8, the rise as a pull back with the jolt at 3816 to 3828: agreed that it needs a new rise path. After
the READY, for round 2; it stays on the round 1 list in your words."

MAIL 302 WORK (16:50 to 17:45): THE MODEL'S COARSE FIELD IS THE KEPT RING PICTURE

- What was wrong at c605678: the kept set (K) and the model (M) drew two different ring pictures and the takes
  of a frame were shared between them in 3568 to 3587. Measured with the shutter closed, each scene alone
  (skim.json handover.kept.alone, a switch for the proof only, "" in the film): K against the old M mean 9.17
  of 255 at 3568, 11.34 at 3577, 14.73 at 3587, 99th percentile 133, 135, 160.
- The cure, as mail 302 asks:
  1. The model's knots are the kept hero profile. assets-src/saturn/code/ring_model.py reads the hero rows of
     public/assets/saturn/*/rings.bin (the kept build's own profile, 8192 knots): optical depth
     -ln(1 - min(alpha, 0.999)) * 0.43, brightness the luma of the inverse filmic of the picture, colour of the
     ice the hue of the kept picture at display luma 0.5 smoothed over 0.001 radii (the raw inverse filmic
     chroma gave a pink comb of pinstripes). ringfield.json is regenerated from it (never print it: one line).
  2. The ladder of ringlets (ringfine.json) starts below what the kept picture resolves: "from" 4, octaves 0 to
     5 are zero in level, slope, grooves and hue, far and near (near hue keeps octave 5). The wide on screen
     boost counts only for the octaves after "from".
  3. The far look: sheet.ts SHEET_FAR_GLSL keptSheet is the kept ring shader's pure state (no pose, no polar
     picture, no closeness) on the kept profile itself (field.ts keptLevel, keptProf; uniforms uKProf, uKProfN,
     uKProfLevels, uKHeroRow, uKSpan). uRfFar mixes it with the model's own light in the sheet, in the ring
     shadow on the globe (globe.ts: the kept law 1 - pow(1 - alpha, soft.z)) and in the field. The closeness of
     everything in M is closeness by height times (1 - far weight).
  4. The kept set stays the far picture in the dive: kept/set.ts holds its close layout, its skim haze and its
     ice out after the hold (skim.json handover.kept.close 0).
- Timeline of the dive now: 3540 to 3562 the hero picture (K, weights at hold values); 3562 to 3588 K's own
  morph to its plain radial profile (pose weight 0.98 at 3562, 0.52 at 3572, 0.09 at 3582, 0 at 3590); 3588.06
  to 3592.02 K to M by takes (from 0.534, to 0.578 of the dive): the two scenes are one picture there; 3592 to
  3628 M's far look gives way to its own light (far [0.578, 0.978]); 3630 the skim.
- Why the window sits after K's morph and not at 3568 to 3587: M draws the plain radial profile. The picture of
  the hold is a layout by pose that only the kept shader has, so M can take over only once K is the pure
  profile. K with close 0 against K's pure profile: 5.45 of 255 at 3568, 1.93 at 3577, 0.053 at 3587.
- First pairs (window then 3588 to 3602, before the last edits to M's own look): K alone against M alone, draft,
  shutter closed, 3588, 3595, 3602: mean 0.063, 0.062, 0.063 of 255, 99th percentile 1.0, max 65, 61, 58; 0.04
  percent of the pixels differ by more than 8: two slivers a few pixels wide at the globe's limb where the rings
  pass in front of and behind it. No ringlet differs.
- The skim on the new knots was plainer at first (grey green A ring, a bright plain zone past the rim, a white B
  ring). Changes to M's own look: sheet.ts rimLum is the median over outer.rimReach insets; uEven (skim.json
  light.flatten.bands, bandReach, band) evens bands of the dense rings against their zone near the sheet;
  light.ringSaturation [1, 0.9]; light.tint.far 1 (the far look has the kept picture's own colour);
  light.tint.near dense [0.916, 0.926, 0.947], thin [0.75, 0.94, 1.04], fitted to the approved close in two
  boxes (B ring near the lens: r/g 1.094 against 1.106, b/g 0.908 against 0.897, luma median 164 against 173,
  95th percentile 235 against 211; A ring near the lens: r/g 1.083 against 1.083, b/g 0.923 against 0.917).
  flatten.band 0.002 with bands 0.35 was tried and thrown out: the B ring loses its lines.
- The draft tier does not show the ladder in the skim (one take sweeps the whole shutter); judge the skim's
  lines at the review tier (3720 review: 93 s here).

## 18:03 to 19:30 UTC: mails 311, 315, 318, 321, one look from far to near, the globe's fine bands

Mails, in short (the words are the Builder's):
- 311: the engine caps the shutter in dives and rises (part E6, at most 6 px of motion). Do not slow or bend
  the path for less blur, build no blur cure. Look at 3567 and 3866 at draft at native size, list what shows.
  Nothing to merge until E6 is on main.
- 315 (check jobs on c605678, handover PASS): 1 the moon fades away 3586 to 3589, "A moon may leave the frame,
  it may not fade". 2 from 3600 to 3620 the rings turn from warm beige to grey white with harder lanes, the
  globe turns paler and its dark side grows: "The rings and the globe must have one look from far to near:
  whatever the near view needs has to come from getting nearer (detail that resolves), not from a tone that
  slides." 3 show 3621 to 3640.
- 318 (measures on c605678): G5 PASS, G17 PASS (3465 median 1.055, 3720 median 0.806, p25 0.384), G15 PASS,
  G13 FAIL: 3820 4.57 percent soft, 3810 4.10. Cure the cause and prove it on every frame of dive and rise.
- 321: approach 3621 to 3640 accepted. Tone slide: the cure by distance per pixel is right, prove it on 3590
  to 3630 every fifth frame beside f06bc5c. G13: do not buy it with a slower flight; the globe near the lens
  gets its fine band structure from functions under the 8192 map, fading in by distance to the lens; ask
  harness_builder how the texels view counts function detail. Moon: ring light on the night limb, only if the
  hold and the judged frames do not change; else leave it and say so. READY by 19:30.

What was found:
- The moon (Titan) does not fade by any weight: it is occulted by the dark night limb of the globe (touches
  at 3586, half at 3588, sliver at 3589, gone at 3590). Against black the limb cannot be seen, so it reads as a
  fade. Left as it is in this pass: lighting the night limb changes the judged frames 3567, 3720 and 3866.
- G13: the soft pixels were the globe's map (8192 by 4096, the workspace limit) at the right frame edge, 0.92
  to 1.00 texels a pixel while the lens is 0.974 radii from the cloud tops (3816). Texels views of the old
  state: 3800 0.00, 3810 4.10, 3815 6.18, 3820 4.57, 3830 0.00 percent soft.
- The tone slide 3600 to 3628 was the far weight by time: M's far look gave way to its own light on a clock.

What was done:
1. One look from far to near, by distance per pixel. sheet.ts: the far weight of a pixel is
   max(uRfFar, smoothstep(uRfReach.x, uRfReach.y, log(length(ray)))): a pixel of the sheet has M's own light
   only as far as it is near the lens (skim.json handover.kept.reach [0.6, 1.3] radii). field.ts: uRfFarGlobe,
   uRfReach, far(weight, onGlobe). The globe keeps the hold's look in the whole surface view: skim.json
   light.globeNear 0 (model.ts closeGlobe = close * globeNear drives the globe's gain, the sharpening, the
   night blur, the halo, the dusk and its grey). Proof sheet: /tmp/v/r8/proof2_*.png (new above, f06bc5c
   below, 3590 to 3630 every fifth frame): the new state keeps beige rings and the hold's globe in all nine,
   f06bc5c turns grey white with a hard dark side from 3605 on.
2. The ice past the rim grows out of the rim (skim.json outer.grow), so the approach 3621 to 3640 has no
   plain zone that pops in. Accepted by the Builder in mail 321.
3. The globe's fine bands from functions (globe.ts bandNoise, bandFine; skim.json globeFine). Streaks along
   the bands: value noise over cells of latitude and longitude, 8 octaves that halve from a cell of 0.0056
   rad, 6 times longer along the band, each octave bent by the one before, on the logarithm of the cloud
   colour (first octave 0.09, 0.88 per octave, the blue 1.3 times so that a dark streak is warmer). It is
   whole where the surface is nearer to the lens than 1.3 radii and absent beyond 2.0 (by the logarithm of the
   distance of the pixel's surface point to the lens), and the uniform that opens it is set only while the lens
   is nearer to the cloud tops than 2.0 radii (after about 3690), so the hold and the dive keep their bytes.
   An octave is drawn by the width of its cell in pixels: absent up to 0.25 px, whole from 0.75 px; the cells
   a pixel come from the same rates of longitude and latitude that place the noise.
   Where the structure is whole the sharpening of the map's own texels (showcase look.fine) steps back
   (globeFine.calm 1): at one texel a pixel it sharpened the grid of the map into a mosaic of tiles.
4. What the texels view counts (asked of harness_builder, answers of 18:37 and 18:44): the tool reads only
   what the material reports, red = clamp(texels * 0.5), soft under 1.0. Jupiter's deck reports texture
   densities only. The Sun (ground.ts line 166, globe.ts 291 to 294) counts its finer function level where
   it is drawn at more than half weight. His rules for a true count: one number a pixel for what carries the
   picture; the same coordinate, frequency and weight as the picture, no constant for the view only; the
   finest octave that is really drawn at half its amplitude or more, not the finest in the list; counted only
   where it is there; the counted flag stays 1; show a native crop of the nograin view at 3810 and 3820
   before and after with one sharpness number. The globe now reports max(map texels, cells a pixel of the
   finest octave drawn at half strength or more) and that second term only where the structure is whole
   (weight 1). By the weights that octave has between 1 and 2 cells a pixel.

What was measured (draft tier unless said, this workspace):
- Texels views with the functions: 3804, 3809, 3812, 3815, 3820, 3825, 3828: soft share 0.000 percent in all
  seven, least 1.051, 1.020, 1.004, 1.004, 1.004, 1.082, 1.145 texels a pixel (before: 3810 4.10, 3815 6.18,
  3820 4.57 percent). G13 on every frame of dive, skim and rise is the Builder's job on his machines.
- The fine octave in the picture: nograin view, box x 1220 to 1920, y 180 to 880 on the globe, the band energy
  that G17 uses (difference of Gaussians 0.6 and 2.0 px, mean square): 3810 3.99e-05 with the functions off
  and 4.65e-05 with them, 3820 3.86e-05 and 4.43e-05. With the functions off the energy is the map's grid
  sharpened into tiles; with them it is streaks along the bands (/tmp/v/r12/fine_3810.png, fine_3820.png).
- G17 by tools/measure/g17.py on 3720, nograin, review tier here: median 0.902, 25th percentile 0.346, 62
  tiles (the Builder measured 0.806 and 0.384 on c605678; rule: median at least 0.8).
- Hold drafts 3390, 3465, 3539 byte equal to main's kept build. 3630 byte equal with and without the globe's
  functions. The model alone at 3590 byte equal to f06bc5c's, so the three pairs of mail 302 stand: 3588 mean
  0.063 of 255, 3590 0.059, 3592 0.059, 99th percentile 1.0, max 65, 62, 66; 0.04 percent of the pixels over 8
  (two slivers at the globe's limb); no ringlet differs.
- tsc clean, vitest 180 of 180 after the merge of main fdf97b8.

Habits learned in this pass:
- A measure that reads what the material reports must report from the same coordinates and weights as the
  picture: no constant for the view only, the finest octave that is drawn at half strength or more, counted
  only where it is whole. With an octave filter that is absent up to 0.25 px of cell width and whole from 0.75
  px that octave has between 1 and 2 cells a pixel.
- At one texel a pixel a sharpening of the map sharpens the map's grid: let it step back where functions
  carry the fine structure.
- New rule of mail 326: before a commit is named READY run
  npm run gate -- --phase 6 --only G11,G15 --g15-stops saturn and quote its two lines.

Still wrong after this pass, worst first:
1. The moon is occulted by the black night limb in four frames (3586 to 3590) and reads as a pop.
2. Near the lens the broad bands of the globe lose some contrast where the map's sharpening steps back
   (3780 to 3830); the cure is to sharpen from a blurred level of the map there, not to switch it off.
3. Stars show through the shaded rings inside the globe's shadow (3567, 3866 and the hold: the kept picture).
4. Dark bodies of ice in front of the globe near the lens (3750 to 3809) read as rocks, not ice.
5. K's own tone change 3562 to 3588 (main's kept shader), limb slivers in the pairs.
6. The rise as a pull back and its jolt 3816 to 3828 (mail 302 point 8, round 2); moon at 3870 to 3872.
7. Wedge with a sawtooth edge through the Cassini division 3630 to 3690; terminator 3630 to 3660.
8. Fit to the approved close at 3720: the globe is now the hold's (softer terminator, warmer) and the far
   rings are the hold's beige, the approved close is paler and icier.

The commit of this pass: 9ed4ef4 (the work), 8d42701 (merge of main fdf97b8: the engine's fromDive files and
the harness; nothing outside the three folders differs from main; drafts 3465, 3567, 3720 and 3866 byte equal
before and after the merge), then the notebook. The gate of mail 326 on this tree:
PASS G11  every asset has a row or a recipe
PASS G15  at most 2 sets per frame; finished stops: saturn/web 281 MB, saturn/full 774 MB
Not done in this pass: the capped shutter (E6) is not on main; nothing of it is in this folder.

## 19:05 to now: after the READY (a284d54), round 2: a new path for the rise

READY sent 19:05 UTC on a284d54 (merge of main 1466487 on top of 9ed4ef4 and 8d42701; only kit/PROGRESS.md
came with that merge). After it: drafts 3690, 3750, 3800, 3830 viewed, one look.

The rise as it was (out/scratch/rise.ts and rise4.ts with OLD=1; ring frame forward, right, height):
- The way out lies 3.66 radii behind, 1.46 left and 2.67 above the skim's end, so every rise is a pull back.
- join() moved the foot and the height by one share: the foot straight, the height by a steady factor. So the
  way back was taken while the lens was still low: speed over height 2.37 percent a frame in the skim, 2.12 at
  3812, 0.90 at 3816 (the stall, the climb near zero), then 3.99 backward at 3820, 7.74 at 3824, 10.35 at
  3828, 12.62 at 3848. Mean flow on the screen (16 by 9 grid of plane and globe points, pixels a frame): 5.2
  in the skim, 2.3 at 3816, 16 at 3830 with single points at 70, then 33.2 at 3870 and from there to 0.7 at
  3884 (largest change 3.7 px a frame per frame at 3878).

The new path (plan.ts riseAt, numbers in skim.json handover.rise):
- The height goes from the skim's to the way out's by its own share (climb.rise, climb.fall: a steady factor a
  frame through the middle). The foot goes by the share of the height already won, to the power back. Over one
  the lens lifts off first and draws back where it is high: the forward speed turns into the climb and only
  then into the way back, the plane never stands still under the lens.
- The view (the globe's place in the picture, its lean, the field of view) goes over by handover.rise.rise and
  fall as before; the globe moves from x 1650 to x 692, that pan is most of the flow (18 px a frame).
- Why a climb first: a plane point at the angle th under the level moves on the screen by
  (climb over height) sin th cos th + (forward over height) sin th sin th a frame, so a climb keeps the plane
  flowing the way the skim's forward flight did, while a way back at low height reverses it.
- Tried by numbers (rise4.ts: step, climb rise, climb fall, back, view rise, view fall): back 1.0 stalls again
  (forward reverses at 3816), 1.3 to 1.6 turn forward into up into back with no dip, 2.0 has higher peaks
  (28 px mean). Longer ramps lower the change a frame and raise the plateau.
- Taken for the first drafts: climb 0.25 and 0.3, back 1.4, view 0.3 and 0.3. Mean flow 5.2 (skim), 6.1 at
  3815, 8.3, 12.2, 15.9, 19.0, 20.9 at 3830, then 21 to 22 up to 3857, 24.9 at 3863, 20.3 at 3869, 11.1 at
  3875, 0.4 at 3884; largest change 1.67 px a frame per frame (was 3.71). Lens to the cloud tops: least 0.95
  at 3818 to 3824 (was 0.97 at 3816).
- The handover tool's rate rule for a rise (tools/handover.ts line 325): the mean rate of the distance to the
  unit sphere from T (3860) to the last frame, and no frame of the rise over 2 times it. Old path 1.39 times
  at 3870; the new one 1.68 times at 3864. Longer falls push this up (0.35 gives 1.82 to 1.87).

Seen and measured on the new path (19:19 to 19:48 UTC, all drafts, folder /tmp/v/r15 and r17 on this VM):
- Every frame 3808 to 3823 (sheet s5 and the near sheet at native size, cA): no stall and no jump, the ringlets
  run on through the lift, the grain streaks lengthen with the climb. Every 4th frame to 3836, every 6th to
  3882 (s1 to s4): one continuous lift and pull back, the globe crosses from the right to the left.
- Texel views 3812 to 3852 every 4th frame: soft share 0.000 percent in all eleven, least 1.004 (3812 to
  3832), then 1.067, 1.075, 1.176, 1.318, 1.498.
- The moon rises over the globe's limb in three frames, 3856 to 3859 (cMoon): an occultation, it does not fade.
- The brown speckled cloud at the lower right of 3858 and in the open sky at 3870 to 3882 is the Milky Way of
  the sky, seen through the gap and the C ring where the globe's shadow lies (the kept picture has it too).
- Still wrong on this path: the globe near the lens is soft and flat at 3808 to 3836 (cGlobe at 3824); the
  rise ends with a brake, mean flow 24.9 px a frame at 3863 down to 0.4 at 3884, into the kept way out.
- Frames before the rise keep their bytes against a284d54 apart from the chunks (below): 3465 and 3539 equal
  the kept hold byte for byte, 3567 equals the draft of a284d54.

The chunks as ice (grains.json levels, third value): white 0.3 to 0.75 and gain 0.5 to 1.0. Before, the large
pieces were brown three ball bodies, dark against the globe and the C ring, and read as rocks (c_bodies,
c_body_zoom). After, they are pale ice lit like the sheet (c_white, c_white_zoom, c_3720_chunks). Changed
pixels, draft against draft: 3630 0.19 percent, 3720 0.32, 3780 0.42, 3800 0.24, all in the bodies and the
glow around them (six clusters at 3800, twelve at 3720). G17 on the draft of 3720 against the approved close:
median 0.68145 before and 0.68145 after, p25 0.28672 both (the draft with the grain; the number sent with
the READY, 0.902, was the nograin view at the review tier).

Main e13dc05 merged at 19:49 UTC (3935678; sun folders, kit/PROGRESS.md, the harness report "carried":
tools/measure/carried.ts, tests/carried.test.ts). PROGRESS d134 names an open item for this folder: on a284d54
the fine bands of the globe from functions are "in the picture but faint, and one bright patch behind the limb
(frames 3804 to 3828) carries nothing at any scale". The report: npm run measure -- --stop saturn --carried
3804,3810-3812 [--tier draft]; a tile is flagged when the texels view says sharp, it is not dark and its band
energy (luma blurred 0.6 px minus 2.0 px, squared, mean) is under 2e-5.

## 19:49 to 20:30: round 2 milestone b9b333e, then the globe near the lens

Milestone b9b333e (19:57 UTC, pushed, mailed 19:59): the new rise path (plan.ts riseAt) and the chunks as pale
ice, on top of the merge of main e13dc05. Gate lines on that tree:
PASS G11  every asset has a row or a recipe
PASS G15  at most 2 sets per frame; finished stops: saturn/web 281 MB, saturn/full 774 MB
Review tier on the new rise (this VM): 3820 28 samples 133 s, 3848 40 samples 153 s, 3866 55 samples 239 s. Seen:
the blur follows the pan, no double image; the globe at 3820 pale and flat (the fault below).
The orange arc at 3828 near (1050, 960) is the glow of the globe's limb seen through the ring sheet.

Mails, in short (the words are the Builder's):
- 335 (20:09): a284d54 is on main as 32c488a (d135). Checked there: 115 of 115 draft reference frames, 11 differ,
  all inside 3540 to 3884; 3465 at the final tier is the kept still byte for byte; handover report passes both
  ways; G13 pass on 495 of 495 frames; G5 pass; G17 pass (3465 median 1.055; 3720 median 0.902, p25 0.346, worst
  tiles [11,5] 0.0097, [10,5] 0.0376, [0,6] 0.0515, [0,5] 0.058, [1,7] 0.0615 of the approved energy: "the right
  middle and the lower left of the terrain frame carry far less detail than the approved close"). Open for this
  round: 1 the bright patch behind the limb, 3804 to 3828, tiles x 16 to 24, y 1 to 11 of the 32 by 18 grid,
  "luma 0.90 and it carries nothing at any scale. It reads as a blown flat area, not as a lit globe"; 2 "The
  globe function is faint: band energy two to three times the floor only"; 3 the moon is gone from 3589 on.
  My own list stands. "Keep the numbering of your open list". READY needs: full sha, tsc, tests, G11, G15 web
  and full, G13 on every frame of the dive and rise, the handover report verdict with every part.
- 340 (20:30): main is a9ed9a0. The shutter of dives and rises (d140): handover.maxBlurPx 14 with
  handover.minShutter 0.5, on main in about 40 minutes; the draft tier does not change. "Do not add blur,
  softness or a cover of your own to hide a fault at the handover". Brandon's words stay the measure: "the goal
  would be to make it seamless. Like there's actually a place on the planet that the camera's going to." The
  place has to be in the picture early, agree with the globe around it in tone, and the camera travels to it in
  one move.

The globe near the lens (items 1 and 2 of mail 335), what was found:
- The map is 8192 wide: about one texel a pixel at the nearest surface (lens to cloud tops 0.95 radii at 3818 to
  3824). The kept look sets the map's small features off against a neighbourhood of look.fine[0] pixels (8); near
  the lens 8 pixels are 8 texels, a neighbourhood too small to hold anything, and a284d54 switched that boost off
  where the functions are whole (calm 1). So the globe near the lens had neither the map's contrast nor a strong
  function: flat, and a few percent brighter where it was nearest (a tone wedge by distance).
- The function itself was faint: amount 0.09 on the logarithm of the colour, cells only 6 times longer than
  wide (short dashes, not streaks).

What was done (globe.ts, skim.json globeFine):
1. wide 20: the neighbourhood of the kept boost is, near the lens, never fewer than 20 texels of the map, so the
   map's features keep their contrast when a texel grows to a pixel; calm is gone (the boost is whole
   everywhere). This also removes the tone wedge.
2. amount 0.09 to 0.14, stretch 6 to 14: long laminar streaks along the bands.
3. zone [0.4, 1.6, 0.03]: the strength of the streaks changes from belt to belt (a value per 0.03 radians of
   latitude), so some belts are calm and some streaked.
4. relief [1.5, -0.1, 0.45]: toward the terminator the strength grows (up to 2.5 times where the cosine of the
   Sun's angle is at or under -0.1, none from 0.45 on).
The count of the texels view is unchanged: the cells a pixel of the finest octave drawn at half strength or
more, only where the structure is whole.

Measured, drafts (band energy: luma blurred 0.6 px minus 2.0 px, squared, mean over a 60 px tile; floor 2e-5):
- Carried report (npm run measure -- --stop saturn --carried 3804,3816,3828 --tier draft), flagged tiles:
  a284d54 and b9b333e as the Builder saw them; boost only: 3804 4, 3816 0, 3828 8; with all four changes:
  3804 2 (31,14 and 31,15), 3816 0, 3828 4 (13,16 and 31,16, 30,17, 31,17).
- The Builder's patch (tiles x 16 to 24, y 1 to 11): band energy least 2.8e-5 (3804), 3.6e-5 (3816), 5.9e-5
  (3828); median 1.8e-4, 1.8e-4, 1.9e-4; before the change the bright patch inside the limb had 1.2e-5 to 2.5e-5.
- The tiles still flagged: 31,14 to 31,17 and 30,17 are the darkest part of the dusk in the lower right corner
  (luma 0.15 to 0.31, energy 5.6e-6 to 1.9e-5: the same relative contrast as the lit side, the measure is
  absolute); 13,16 at 3828 is a smooth lane of the ring sheet at the bottom (energy 1.85e-5), not the globe.
- 3720 changes with it: 12.85 percent of the pixels, all on the globe (x 825 to 1911, y 7 to 908), at most 39
  levels (246 pixels over 30, near the terminator at x 1224 to 1460, y 416 to 619). The near half of the globe
  was soft in a284d54 and b9b333e (the map magnified), it now carries streaks at about half strength (the lens
  is 1.62 radii from the cloud tops at 3720, reach [1.3, 2.0]). The approved close has a smooth globe there
  (its globe tiles carry 0.2e-5 to 8e-5, under the floor of G17, so G17 does not see the globe).
- Lens to the nearest cloud tops by frame (out/scratch/dist.ts): 3680 2.00, 3720 1.62, 3760 1.30, 3800 1.05,
  3810 0.99, 3820 0.95, 3830 0.99, 3840 1.17, 3850 1.62, 3860 2.56. So the streaks begin at 3680, are whole at
  the nearest point from 3760 and are gone again at 3855.

The moon (item 3), measured on drafts 3580 to 3592: Titan is 40 px wide, 20 radii behind the globe, at
(1532, 463) at 3580, lit half toward the globe. The dive swings the lens around the globe, the far sky moves
about 10 px a frame against the limb, and the night limb crosses the moon from 3586 (touch) to 3590 (gone).
The night side is 5 of 255 against a sky of 8: the limb cannot be seen, 30 px below the moon it can (against the
lit far arc of the rings). Stars set behind the limb in the same frames. Cures that were weighed: light on the
night side (ring light) changes the bytes of the hold and the judged frames; a moon nearer or elsewhere changes
the bytes of the hold (it moves 0.3 degrees a second there); another dive path would have to be proven again
from the start. Left, and said so.

The fit at 3720 (item 6), measured on the nograin draft against the approved close (12 by 8 tiles, g17.py):
median 0.677, p25 0.289; worst [11,5] 0.014, [10,5] 0.036, [2,7] 0.060, [1,7] 0.060, [1,6] 0.124.
- [10,5] and [11,5]: in the approved close the ring sheet passes in front of the globe there (its waterline
  runs from (940, 500) to (1920, 660)); in the film the waterline is 120 to 140 px lower ((950, 620) to
  (1920, 800)) and those tiles show the night side of the globe. A matter of the pose (height over distance).
- The lower left ([0..3, 4..7], ratios 0.06 to 0.3): the approved close has crisp ringlets 3 to 10 px wide
  with dark gaps between them and a fine speckle of ice on every ringlet, band energy 2.5e-3 to 6.8e-3; the
  film has smooth lanes 10 to 40 px wide with soft edges, a few thin lines and sparse grains, 3e-4 to 1.7e-3.
- Why: at 3720 the lens is 0.40 radii above the plane and the bottom of the frame is 0.69 radii away, so a
  pixel there is 5e-4 radii wide and 9e-4 radii deep. The ladder of ringlets (ringfine.json) has strength only
  from octave 6 on (0.002 radii and finer: 2 px and less at the bottom of the frame); octaves 4 and 5 (0.008
  and 0.004 radii: 4 to 16 px there) carry no strength because at those scales the sheet is the profile of the
  kept ring picture, which is soft there (the hero resolves about 0.0035 radii). So the near field lacks
  contrast exactly at 3 to 16 px. near.wide adds level to octave 5 only from 2.5 footprints on.

## 20:44 to 21:10: the globe at the review tier, and why the sheet at 3720 is the far look

Review tier with the globe change (reach [1.3, 2.0]): 3816 and 3828 carry streaks and mottle on the globe near
the lens, no flat area; 3828 is smeared by the true blur of the rise.

The globe's reach, still open at 21:10:
- reach [1.3, 2.0]: the patch (tiles x 16 to 24, y 1 to 11) has no tile under the floor at 3804 (least 3.11e-5),
  but at 3720 the lower half of the globe is streaked. The approved close has a smooth globe with soft wavy bands
  and swirls and no fine streaks.
- reach [1.2, 1.62]: 3720 mottled, not streaked, but at 3804 two limb tiles (16,8), (16,9) fall to 1.7e-5.
- reach [1.3, 1.75] is the next test (function weight 0.17 at the nearest globe point of 3720, 0.27 at the limb
  end of 3804, 1.58 radii away).

Item 6, the fit at 3720. The main finding: handover.kept.reach [0.6, 1.3] are distances in planet radii
(field.ts takes their logarithms; an earlier note that read them as 1.82 to 3.67 radii was wrong). So the
model's own light, with the ladder of ringlets, shows only where the sheet is within 1.3 radii of the lens. At
3720 its weight is 0.91 at 0.69 radii (the bottom edge), 0.60 at 0.85, 0.27 at 1.0, 0.07 at 1.15: at least half
only below y about 880. The rest of the frame is the far look: the kept profile, soft at 0.0035 radii, with no
ringlet under that at all. That is why the mid field of 3720 has broad soft lanes where the approved close has
crisp ringlets.

Looks rendered to see it (drafts, render tree, values restored after):
- far everywhere (reach [0.000001, 0.000002]), model everywhere (reach [12, 13]), the film, and the film
  without the sweep in the ladder filter ("nosweep").
- Region means at 3720 (R, G, B, sd of luma). x 300 to 600, y 800 to 1000: film 0.501, 0.450, 0.408, sd 0.128;
  far 0.575, 0.503, 0.444, sd 0.135; model 0.452, 0.419, 0.388, sd 0.126; approved 0.422, 0.390, 0.366, sd 0.218.
  x 0 to 200, y 700 to 1000: film 0.598, 0.537, 0.481, sd 0.096; far 0.655, 0.579, 0.508; model 0.495, 0.470,
  0.437; approved 0.468, 0.435, 0.399, sd 0.146. x 1000 to 1300, y 760 to 900: film 0.805, 0.729, 0.636, sd
  0.117; model 0.787, 0.712, 0.638, sd 0.139; approved 0.775, 0.698, 0.626, sd 0.087.
- So the model's light is nearer to the approved in the A ring (about 20 percent darker and greyer than the far
  look) and in the contrast of the ringlets; without the sweep the lower left gains only part of what is missing
  (sd 0.149 against 0.128 and the approved 0.218): the blur is only part of the gap.

Numbers at 3720 (out/scratch/sweep.ts): radial footprint in 1e-4 radii, distance to the lens, and the slide of
the picture across the ringlets in footprints a frame, at x 0, 160, 320, 640, 960, 1280, 1600:
- y 600: fp 7.3 to 73, distance 1.40 to 2.03, slide 7.9, 6.4, 4.5, 1.6, 0.4, 0.1
- y 700: fp 5.9 to 58, distance 1.15 to 1.86, slide 10.1, 7.7, 5.5, 2.7, 1.2, 0.5, 0.3
- y 800: fp 5.2 to 35, distance 0.98 to 1.41, slide 12.1, 9.4, 7.2, 4.1, 2.4, 1.4, 0.9
- y 900: fp 4.5 to 22.5, distance 0.86 to 1.15, slide 14.3, 11.6, 9.3, 5.9, 3.9, 2.6, 1.9
- y 1000: fp 3.9 to 16, distance 0.77 to 0.98, slide 17, 14.2, 11.7, 8.1, 5.7, 4.1, 3.2
- y 1079: fp 3.5 to 12.5, distance 0.72 to 0.88
With half a shutter the blur across the ringlets is under 2 px at y 600 from x 400, y 700 from x 500, y 800
from x 650, y 900 from x 950, y 1000 from x 1300. The mid field and the right can carry crisp ringlets; the
lower left cannot while the path and the shutter stand (they are the Builder's: mail 311, and d140 keeps the
whole shutter in the terrain).

Distances that bound a cure (out/scratch/pmin.ts, gmin.ts):
- Least distance from the lens to the ring plane inside the span of the kept profile (radius up to 2.5): 3588
  2.046, 3589 2.018, 3590 1.991, 3591 1.968, 3592 1.943, 3592.5 1.928, 3593 1.918; then 3600 1.66, 3620 1.26,
  3640 1.01, 3660 0.87, 3680 0.80, 3700 0.73, 3720 0.67.
- Lens to the nearest cloud tops: 3540 4.48, 3580 3.60, 3590 3.36, 3600 3.13, 3620 2.74, 3630 2.60, 3660 2.22,
  3680 2.00, 3700 1.80, 3720 1.62 (farthest in frame 2.41), 3760 1.30, 3800 1.05, 3810 0.99, 3820 0.95, 3830
  0.98, 3840 1.17, 3850 1.62, 3860 2.56, 3870 4.30.

The design that follows from it ("detail on the far look"), coded at 21:05 and taken back at 21:21 (see below):
- The ladder of ringlets belongs to both looks. A second reach, skim.json handover.kept.detail [1.0, 1.9]
  (planet radii, by the logarithm of the distance; uniform uRfDetail beside uRfReach): the ladder is whole
  nearer than the first and absent beyond the second. In the far look its factors act on the kept look's colour
  (times the brightness factor and the tint) and on its opacity (1 - (1 - a)^factor); the model's branch takes
  the same weight. So the tone still changes only inside 1.3 radii and the ringlets resolve from 1.9 radii in.
- While the kept set still draws takes (to 3592.02) no part of the kept profile is nearer than 1.94 radii, so
  the frames of the window do not change (a loop of zero trips where the weight is 0).
- ringfine.json bunchFrom 6: the octaves before it have their whole strength everywhere (was a literal 2 in the
  shader, which never counted because octaves under 4 are not worked out); it lets octaves 4 and 5 be given an
  even strength.

## 21:10 to 21:40 UTC: the far look ladder taken back, the globe function chosen, the step of mail 348

Taken back at 21:21 (not in the commit): the "detail on the far look" edits (sheet.ts, field.ts, ringfine.json,
skim.json handover.kept.detail). Judged on drafts and one review frame: detail reach [1.0, 1.9] left 3630
identical to b9b333e and changed 3720 hardly; with octaves 4 and 5 raised (levels 0.22, 0.3, edge 0.1) the G17
median at 3720 was 0.690 at the draft tier (0.682 before) and 0.978 at the review tier (17 samples, 107.9 s)
with the 25th percentile 0.379. Small gain, unproven on the dive, so it waits. The patch is kept outside the
repo (detail.patch, detail.skim.json in the scratch folder of this VM); the design above stands as a plan.

What the fit at 3720 is made of (g17grid.py: the 12 by 8 grid of G17 ratios against the approved):
- Draft film: median 0.682, 25th percentile 0.287; lower left tiles 0.06 to 0.3; bottom right 1.1 to 2.5.
- The same frame without the sweep of the shutter: median 0.861, 25th percentile 0.504, lower left 0.27 to
  1.54. So most of the lower left deficit is the blur of the picture sliding 10 to 17 px a frame across the
  ringlets; the path and the shutter are the Builder's (mails 311, 340).
- Right middle tiles [10,5], [11,5]: the pose (the sheet stands 120 px lower than in the approved there).
- Colour (chroma.py): the A ring at the left is 20 percent brighter than the approved with half its contrast
  and a third of its chroma variation; bottom right mean colour matches (0.762, 0.691, 0.606 against 0.755,
  0.681, 0.611).

The globe near the lens (skim.json globeFine, globe.ts bandFine), chosen: reach [1.3, 1.75] radii from the
lens to the surface, cell 0.0056, stretch 14, 8 octaves, amount 0.14, fall 0.88, zone [0.4, 1.6, 0.03], relief
[1.5, -0.1, 0.45], wide 20. Beyond 1.75 radii the function is switched off whole (uBandFine.x 0), and the lens
is 2.60 radii from the cloud tops at 3630 and farther before it, so the hold and the dive keep their bytes.
3720 (1.62 radii) changes: a faint mottle on the globe. Measured on drafts 3804, 3816, 3828 in the Builder's
patch (tiles x 16 to 24, y 1 to 11 of 32 by 18): least band energy 2.73e-5, 3.61e-5, 6.17e-5, median 2.0e-4,
none under the floor 2e-5 (reach [1.2, 1.62] left two tiles under it at 3804; reach [1.3, 2.0] streaked 3720).
At 3832 the globe is streaked along its bands at the review tier; amount 0.11 would put limb tiles under the
floor again.

Mail 348 (21:17), the Builder's look clip of b9b333e, review tier, five machines:
1. A step in the rings between 3832 and 3834 (cream white with bright near strips, then tan and duller, the
   band layout shifts).
2. The globe pale and flat 3806 to 3832, the night side comes in from 3834, bands deepen from 3842.
3. 3854 to 3884 one true scene.

What I measured on 1 (one process, this VM):
- Drafts of every frame 3830 to 3836 on the committed rings: lower left quarter mean R 0.673, 0.667, 0.661,
  0.656, 0.652, 0.649, 0.646; whole frame mean R 0.664, 0.664, 0.664, 0.664, 0.663, 0.661, 0.658. No step.
- Review stills 3832 (37 samples, 191.6 s) and 3834 (35 samples, 176.3 s), each alone: lower left quarter mean
  0.679, 0.594, 0.506 and 0.668, 0.584, 0.496; same strips, same band layout, shifted by the flight only.
- The count of samples steps at 3832 (31 at 3831, 37 at 3832) because the motion estimate of the harness steps
  from 18.5 to 21.9 px there: a probe of its grid starts to meet the plane. The flight itself has no step
  (riseAt is one expression of time); the knot of the view trapeze (handover.rise.rise 0.3) is at 3832.2 and
  is a knot of the rate, not of the view.
- Nothing in model.ts, set.ts, field.ts or sheet.ts keeps a value from one frame to the next: every uniform is
  set from the time and the pose each take.
So the step does not show in one process. Suspects outside this folder: a boundary between two machines of the
job (state or checkout), or the trial shutter. Asked the Builder which frames each machine drew.

What does slide with height in the rise and is still open: everything model.ts blends by `close` (ring gain,
saturation, tints, flatten, the ladder set, ice, grains) starts to go back at height 0.6 (frame 3830.5) and is
done at 1.8. It is smooth (close 0.992 at 3832, 0.959 at 3834) but it is a tone that slides with height, not
with distance (mail 315). Not changed in this commit.

## 21:40 to 22:00 UTC: the commit for round 45 is named, the step of mail 348 looked for on two engines

Commit: 114e2d6 (globe function, notebook), then main a9a5b9f merged in (never rebased): c984dd4, pushed 21:34.
- Merge recipe: `git fetch --depth 1 origin main` gives "refusing to merge unrelated histories" on this shallow
  clone; `git fetch --depth 40 origin main; git merge FETCH_HEAD` finds the base. Main holds this stop's three
  folders as of a284d54, so the merge conflicts in my own files (plan.ts, skim.json, globe.ts, grains.json, this
  notebook). Resolved with `git checkout 114e2d6 -- src/stops/saturn assets-src/saturn public/assets/saturn`,
  then checked: my folders equal 114e2d6, nothing outside them differs from main. The merge brought
  src/bodies/planet.ts and three tests, no engine change (the gentler shutter is not on main at a9a5b9f).
- On c984dd4: tsc exit 0; vitest 27 files, 186 passed;
  "PASS G11  every asset has a row or a recipe";
  "PASS G15  at most 2 sets per frame; finished stops: saturn/web 281 MB, saturn/full 774 MB".
- Bytes of drafts: 3465 and 3539 equal the kept build, 3567 equals r12, 3630 equals b9b333e; 3720 differs from
  b9b333e (mean 0.130 of 255, 99th percentile 4, max 18: the globe function); 3832 equal before and after the
  merge. G17 at 3720, draft: median 0.681, 25th percentile 0.287.
- Not run here: G13 on every frame of 3540 to 3884 (47 minutes on this VM) and the handover report. Said so in
  the mail, with the commands.

Mail to the Builder, 21:47 (high): c984dd472881cb6b5832153beb9ead19ca1352ce named for the round, gate lines,
what was not run, the measurements on items 1 and 2 of mail 348, my open list 1 to 8.

The step between 3832 and 3834 (mail 348, item 1), what was tried and what it showed:
- Review stills of the commit, each alone, plain engine: 3831 (31 samples), 3832 (37), 3834 (35). Lower left
  quarter mean 0.692 0.607 0.520, 0.686 0.602 0.515, 0.674 0.593 0.505; ringlet contrast (sd of log luma across
  the bands) 0.061, 0.063, 0.067. One look.
- The trial engine with the gentler shutter (branch agent/handover-trial-floor50-14, 7d9f486: maxBlurPx 14,
  blurEaseFrames 12, minShutter 0.5) with this stop folder, in /home/user/workspace/trial. Its shutter in the
  rise: 0.757 at 3830, 0.759 at 3831, 0.640 at 3832, 0.654, 0.670, 0.688, 0.709, 0.732, 0.755 at 3838; capped
  from 3817 to 3873; at its floor 0.5 from 3856 to 3868. So the shutter falls by 16 percent in one frame at
  3832. Cause: the motion estimate of the harness (src/core/motion.ts) steps from 18.5 to 21.9 px there, when
  one more probe of its grid meets the ground plane of the terrain view; the flight has no step.
  Review stills on that engine, 24 samples each: 3831 lower left mean 0.687 0.602 0.516, ringlet contrast 0.075;
  3832 mean 0.678 0.594 0.508, contrast 0.084. So with the cap 3832 is 12 percent crisper than 3831 (plain
  engine: 3 percent), the same tone and the same band layout. A small step in crispness, in the other direction
  than the mail describes (duller from 3834). Not the step of the mail, or a small part of it.
- One process, draft tier: `npm run seq -- --first 3829 --last 3836 --tier draft` (68 s for 8 frames). Every
  frame 3830 to 3836 has the same bytes as the same frame drawn alone. So nothing in the scene or the engine
  carries over from one frame to the next at the draft tier.
- The grains: grains.ts stops collecting at grains.json capacity (900000) and would then drop the later rows
  and levels in one frame. Not measured in the rise yet (see below).

Draft against review in the rise (open item 8): at 3832 the draft is whiter and crisper with fine cream streaks
(lower left ringlet contrast 0.099, mean 0.661 0.580 0.498), the review still has broad tan bands (0.063, mean
0.686 0.602 0.515). Cause: iceSweep (ice.ts) draws the grain of the sheet out by the travel of the lens during
one take (model.ts `take`, `moved`), not by the turn of the lens, and the lens turns fast in the rise. The film
tiers show the true blur by their takes; the draft tier shows a picture nobody will see. When the engine passes
its shutter (`view.shutter` on the trial branches), `take` must use it; the Builder asked not to set a shutter
here before that engine is on main.

The globe at 3832, review tier (rv_globe.png, full size): streaked along its bands by the blur, mottled, a few
small orange specks; not flat. Shading toward the limb is still missing before 3834 (open item 2).

## 22:00 to 22:10 UTC: no state between frames, the grains are not cut, and a correction of my own numbers

- One process, review tier: `npm run seq -- --first 3831 --last 3834 --tier review` (31, 37, 36, 35 samples, about
  135 s a frame). 3831, 3832 and 3834 have the same bytes as the same frames drawn alone. Lower left quarter mean
  R 0.692, 0.686, 0.680, 0.674; ringlet contrast 0.061, 0.063, 0.064, 0.067: even steps. So at both tiers the
  picture is a function of the frame alone on this engine, and the stop has no step between 3832 and 3834.
- Grains (out/scratch/count.ts builds Grains without a renderer and counts what one take draws): at most 52,432
  (frame 3814) of a capacity of 900,000 over the whole flight, so the cut at the capacity never acts. In the rise:
  16,555 at 3826, 5,300 at 3828, 617 at 3830, 256 at 3832, 234 at 3834, 145 at 3854, 0 from 3860. The sand
  leaves the picture between 3826 and 3830 as the lens climbs from 0.34 to 0.40 radii.
- CORRECTION. The heights I wrote down for the rise before (0.59 at 3830, 0.636 at 3832, 0.686 at 3834, and
  "close 0.992 at 3832, 0.959 at 3834", "from frame 3830.5") were wrong. Measured from plan.flight and from the
  director (out/scratch/h.ts, d.ts; both agree):

  | frame | height over the plane | foot | lens to cloud tops | close |
  |---|---|---|---|---|
  | 3630 | 0.587 | 3.553 | 2.612 | 1.000 |
  | 3720 | 0.396 | 2.591 | 1.628 | 1.000 |
  | 3800 | 0.279 | 2.029 | 1.052 | 1.000 |
  | 3814 | 0.264 | 1.952 | 0.974 | 1.000 |
  | 3826 | 0.336 | 1.924 | 0.959 | 1.000 |
  | 3832 | 0.431 | 1.958 | 1.015 | 1.000 |
  | 3834 | 0.469 | 1.979 | 1.046 | 1.000 |
  | 3840 | 0.607 | 2.076 | 1.183 | 1.000 |
  | 3842 | 0.663 | 2.124 | 1.247 | 0.977 |
  | 3848 | 0.865 | 2.327 | 1.517 | 0.741 |
  | 3852 | 1.038 | 2.531 | 1.780 | 0.502 |
  | 3856 | 1.248 | 2.811 | 2.133 | 0.260 |
  | 3860 | 1.505 | 3.193 | 2.602 | 0.071 |
  | 3864 | 1.819 | 3.710 | 3.223 | 0.000 |
  | 3884 | 2.938 | 5.906 | 5.745 | 0.000 |

  So everything model.ts blends by `close` slides between frames 3839.7 and 3864 in the rise (heights 0.6 to
  1.8), and nothing of the rings is blended by height between 3832 and 3834. The band function of the globe
  (reach 1.3 to 1.75 radii from the cloud tops) fades out between 3843 and 3852: where the Builder saw the bands
  of the globe deepen (mail 348, item 2).
- Mail to the Builder, 22:08 (high): these measurements, the shutter step of the trial engine at 3832 (in the
  engine's measure, not in this folder), the correction, and a request for his frames 3830 to 3836 or the
  engine sha and the span of each machine.
- Disk: 3.2 GB free at 22:05 (renders refuse under 3). Old picture folders in /tmp/v removed (kept: kept, hold,
  r12, r17 to r21, g13, the scripts); 4.9 GB free after.

## 22:10 to 22:32 UTC: main 1ce3137 merged, the second review note, the answer to mail 350, mail 362

Mail 350 (22:19): E6 is on main 1ce3137125360e48c107dce6a95a431b815b4a15. Brandon's second review note
(kit/PROGRESS.md "Second review note of 2026-11-23", decision d147) in the Builder's words: E one pace through
each move, no dent at the change of view. F one scene through the change of view, nothing comes in by time
(blends only by distance, height or angle), the close view drawn on the globe from the height where it first
shows, relief real where it can be seen, the place picture retired. G no surface view is a picture that is
pushed, bent or rippled. H he captures the film himself at 3840 by 2160 and 60 frames a second, frame by frame,
so every motion must hold between frames (nothing snaps to a whole frame, no state from frame to frame) and the
cost of drawing a frame is no limit. The timetable of 22:00 and 22:45 is void; no round is spent on a build made
before the note; three rounds per stop for it. For Saturn: the ring plane, the deck and the shadow of the rings
on the globe are the same functions from the hold to the surface view and back, the rings are particles and gaps
with depth near the lens, the deck is cloud with height, nothing fades by frame number, and the pace is one
move. Plan E limits: the change of rate a film frame at most 0.08 of the move's mean; after its peak the rate
never climbs again by more than 0.03, before it never falls by more than 0.03; the same at both seams.
`npm run smooth -- --stop saturn` and `npm run capture` are not on main yet. A round starts when a commit is
named, the take check is clean and the smooth report is green.

Mail 362 (22:30): model.ts `take = shutterFraction / fps / samples` is the film's shutter and not the drawn
frame's, twice too long at rate 2. travel_builder gives a helper with its first commit (about 23:45 UTC): the
drawn frame's shutter in seconds, on the view or the shot, the same bytes at rate 1. Use it as soon as it is on
main and say so in a report.

Done in this span:
- Merge c1be190 (`git fetch --depth 40 origin main; git merge FETCH_HEAD`), nothing outside the three folders
  differs from main.
- The step of 3832 measured on main's E6 (review, one process, 24 samples, the pictures of c984dd4): shutter
  0.7586 at 3831, 0.6395 at 3832 (motion 18.5 then 21.9 px). Lower left quarter fine contrast 0.075, 0.084,
  0.083, 0.083 for 3831 to 3834; mean R 0.687, 0.678, 0.673, 0.668. In the box of the Builder's clip the means
  slide evenly (0.694, 0.684, 0.673, 0.664, 0.657 for 3828 to 3836). What the eye takes for a jump there is the
  sheet's near light (handover.kept.reach 0.6 to 1.3 radii a pixel) leaving the frame: the nearest ring point
  in frame is 0.558 at 3826, 0.601 at 3828, 0.648 at 3830, 0.699 at 3832, 0.754 at 3834, 0.948 at 3840, 1.107
  at 3844, 1.297 at 3848 (0.671 at 3720, 0.447 at 3814). That is open item 7, a tone that slides.
- The model alone at the hold (temp switch, draft): against the approved hero plain 12.316, blurred 5.915 (the
  kept set at draft 5.547 and 2.158); the model against the kept set 9.608 at 3465, 9.969 at 3539. The hero's
  ring layout is not a rigid plane round the globe (the true rings are larger in frame). The kept set morphs
  its layout by pose from 3562 to 3588 (heroRange 0.6 to 1.6).
- The pace as it is (out/scratch/pace.ts), change of rate a frame over the mean: 0.100 at 3549 in the dive and
  0.164 at 3875 in the rise by distance to the deck; 0.136 at 3550 and 0.113 at 3820 by height. The rise by
  distance to the deck runs backward (to -0.24 of the mean) until about 3822, peak 2.33 at 3863; dive peak
  1.221 at 3557.
- The by time list (what the note forbids): (i) set.ts shares the kept set and the model by time (0.534 to 0.578
  of the dive); (ii) model.ts `farW` (handover.kept.far 0.578 to 0.978 of the dive); (iii) the kept set's
  streak fade and uSolid by 0.6 s after the hold's end; (iv) the sky patches by skyFrames; (v) the sky gain
  skim.skyNear by diveShare and riseShare; (vi) `take` from the film's shutter.

The answer to mail 350 went at 22:30 (high): (a) the surface view has no pushed picture; two rigid pictures
remain (the 8192 globe map with its zonal drift look.globe.drift 0.2 degrees a second, his word asked for; the
sky patch). (b) Nothing under 0.05 radii is modelled as a body; the deck and the sheet far from the lens are
flat. (c) The plan, in order, hours on the Builder's clock:
1. (looks 23:25) nothing by time: (i) to (vi) above onto distance, height or pose; the pace of both moves under
   the limits of plan E.
2. (23:55) one look of the rings: the near light takes the far look's tone, only ringlets, sand and grains
   resolve by the footprint of the pixel. Numbers of 3720 before and after.
3. (00:50) the deck with height: a cloud top height field from the band functions, marched in the globe's
   shader on the ellipsoid, with the Sun's shadow at the terminator, from the distance where it moves a pixel;
   one lighting of the globe near and far.
4. (01:50) one set: the kept set's hold layout by pose into the model's field, the kept shaders go. Asked
   whether to keep the kept set and spend the time on 2 and 3.
5. depth in the sheet near the lens (gaps with walls, soft thickness), after 3; grains `largest` to an angle,
   point size at 2160.
(d) Whole frame items named: `take` (film shutter), the samples count, skyFrames.

Open list (numbering kept): 1 globe near the lens (function in; limb shading and pale flat lit face open).
2 brake at the end of the rise. 3 moon pop 3586 to 3590. 4 stars through the shaded rings. 5 wedge with sawtooth
edge through the Cassini division 3630 to 3690. 6 fit at 3720. 7 ring tone slides with height 3840 to 3864 and
by distance 3826 to 3848. 8 draft and review differ in the rise (take must use the engine's shutter).

## 2026-11-23, 22:32 to 23:45 VM: step 1 of the plan, nothing by time, one sky, the pace

Mails in this span (the VM clock runs 5 to 7 minutes behind the Builder's stamps).

Mail 374 (22:46 UTC), rulings on my answer to mails 350 and 362:
- (a) The globe's map stays rigid on its ellipsoid: the slide of the bands by latitude (look.globe.drift) comes
  off the map, motion goes on the function streaks only. 3720 is then judged by G17 and beside the approved
  close, not by its bytes.
- (c) Order 1, 2, 3, then 5; 4 dropped (the kept set stays). For 1: one sky for the stop, its stars are the
  film's own star field, so no two star fields ever cross; what sky-terrain.webp added that is Saturn's own
  (glow) may stay, its stars go. The pace: handover_engineer builds the engine's one move (plan E); my skim path
  stays mine only where I show a need; the judge is `npm run smooth -- --stop saturn --only path`. For 2: one
  look of the ring per pixel, the near light in the mean equal to the far tone, only ringlets, sand and grains
  resolving by footprint; the fit of 3720 to the approved close by a grade of the whole frame by the lens's
  height (the stop's air), not by distance from the lens; give 3720 beside the approved close before and after
  with the G17 numbers. For 3: cloud tops as a height field marched on the ellipsoid, one lighting near and
  far. For the layout that bends by pose over 3562 to 3588: a sheet of every second frame with the ring edges
  traced.
- (d) 4: grain limits become angles (shares of the frame height); every chunk above a set size is a quad on
  every machine, not a point. 5: skyFrames goes with the engine's one air by height (plan F).
- The step of the shutter at 3832 is handover_engineer's point 2, after travel_builder's fractional frames.
- "Name a commit when 1 is whole; I prove it on the machines with the three jobs you listed plus smooth."

handover_engineer (two mails): in dive and rise the film's camera is the engine's; `handover.ownPath` lists the
stops on their own path. My need (the ground of the skim is the ring plane, plan E is about the sphere) is
accepted, Saturn stays in `handover.ownPath`, divePose and risePose are the film's camera as today, inside the
same limits at whole and half frames and across both seams; the speed curve is measured on the unit sphere
round `plan.place(kind, time)`. It asks: leave the hold with the hold's own velocity and enter the travel with
the travel's; read the eye's height from `state.height` in update() once its commit is on main, not from a
clock of my own.

Mail 377: `npm run smooth -- --stop ID --only path` is on main (f0c67f1): the rate of fall or climb, the turn
and the speed of the picture may change by at most smooth.path.maxStep (0.08) of the move's mean from one film
frame to the next, on whole and on half frames and across both seams; after its peak the rate never climbs
again by more than smooth.path.maxRebound (0.03). Reports out/work/smooth/ID.md. Run it on every commit named
and quote its last lines in READY.

Mail 385: grains.json largestPoint is 1000 px of the drawn format. Rule: every size in pixels becomes a share
of the frame height; no point sprite larger than 255 px at 3840 by 2160, anything larger is a quad (two
triangles, instanced) with the same shading. Say which commit holds it and the largest point at uhd.

Mail 387, ruling on the sky: way A (the hold keeps its own sky picture, it leaves by pose). Conditions:
(1) the patch is a footprint on the sky; its weight falls over the part of the dive where the least of that
footprint is still in frame, as long as the pose allows, one smooth fall, never back up; report the frames, the
share of the frame that is sky inside the footprint at start and end, the largest change of the sky's mean
level in one frame. (2) The skim's sky is the film's field seen through Saturn's own air: dimming as one
function of height (extinction and the glow of the haze, the same down and up), never a second picture, never a
gain on time; report 3720 plain and blurred against the kept still and say plainly if it loses more than a
tenth. (3) The rise and the travel keep the film's stars; report the sky's state at the last frame (exposure,
patch weight 0). (4) The step of 0.106 at 3887 is the travel's start, cured on travel's branch; do not shape
the rise against it.

### What was by time and what it is by now

| item | was | is |
|---|---|---|
| kept set to model in the dive | share of takes by the clock, 0.534 to 0.578 of the dive | share of takes by the logarithm of the lens's height over the ring plane, handover.kept.heights 1.03 to 0.93 radii (set.ts) |
| the model's far look | handover.kept.far by the clock | by the height of the lens, handover.kept.far 0.93 to 0.6 radii (model.ts farW), the same down and up |
| the model's close light | by the clock | by the height of the lens (model.ts close) |
| the kept set's streak fade and solid shade | 0.6 s after the hold's end | by how far the lens has come in from the hold's last distance: `dove = holdEndFar - |lens|` (kept/set.ts), over 0.116 radii (kept/look.ts shadeSolid, streak fade) |
| the sky pictures | skyFrames, two pictures crossed by the clock | one picture (the hold's), by the lens's distance from the hero's lens (plan.ts heroSky, skim.json sky.hero 0.36 to 1.2 radii); the close view has no sky picture |
| the sky gain | skim.skyNear by the share of the dive and of the rise | by the logarithm of the lens's height, skim.json sky.heights 1.8 to 0.6 radii (plan.ts lowAt), with the glow (veil.ts) on the same function |
| `take` | the film's shutter | `config.shutterFraction * (view.shutter ?? 1) / fps / samples`; the helper of travel_builder goes in when it is on main |

Still by time and not mine: the engine's lift of the stars in the rise's orbit view and the arriving patch's
`smoothstep(u, 0.2, 0.8)` in the travel (both engine, both outside my folder).

### The pace (plan.ts Pace, law, move)

A move (the dive, the rise) is one move in four measures: reach (log of the distance to the globe's surface),
climb (log of the height over the ring plane), round (the angle of the foot of the lens round the globe), view
(the share of the turn and of the field of view). Each has one Pace: the rate goes from the rate of the motion
before (the hold, the skim) to one largest value and down to the rate of the motion after (the skim, the way
out), by a steady change a frame on both sides, with rounded turns. So the move leaves the hold with the hold's
velocity and enters the travel with the travel's in position; the turn starts and ends with rate 0 of its
share, so the camera turns at the rate of the motion before and after. peak and round per measure are in
skim.json handover.dive and handover.rise; round is one share or three (start, top, end).

The search: out/scratch/opt.ts (one round per measure) and opt3.ts (three rounds) walk the numbers at random
and keep what lowers the smooth tool's own measure (out/scratch/sm.ts calls tools/smooth: the worst of step
over 0.08 and rebound over 0.03 over both capture rates, inside my own frames); under 1 is green.

Dive (one round each: reach 0.555, 0.094; climb 0.707, 0.146; round 0.557, 0.103; view 0.478, 0.05): green.
Steps: rate 0.037, turn 0.054, speed 0.061; rebounds at most 0.006.

Rise, try 1 (one round each, opt.ts): the speed of the picture at the place fell to 0.105 of the mean at 3819
(the flow of the skim reverses into the pull back) and stepped 0.094 at 3842; cost 1.04 at best. Try 2 (three
rounds each, opt3.ts, rounds not under 0.03 so no turn is sharper than two frames): reach peak 0.504, rounds
0.031, 0.032, 0.1; climb 0.269, rounds 0.03, 0.151, 0.03; round 0.475, rounds 0.162, 0.03, 0.035; view 0.496,
rounds 0.121, 0.03, 0.08. The lens lifts off the plane early (the climb turns at 0.269 of the rise) and the
picture never slows. Smooth tool on it: rate step 0.067 (a steady 0.067 a frame up to 2.148 at 3848 and 0.066 a
frame down), turn 0.067, speed 0.067 inside the rise, fall before the peak 0.005, no climb after it. Left red:
speed 0.088 at 3887 on whole frames and 0.098 at rate 2, which is the start of the travel (mail 387 (4)).
Heights of the new rise: 0.267 at 3810, 0.474 at 3830, 0.599 at 3834, 0.951 at 3842, 1.403 at 3850, 2.389 at
3866, 2.941 at 3886; least distance to the hero's lens 1.5495.

### The sky

How the engine draws it (read, not changed): in the terrain view only patches with view 'terrain' draw; with
my `skyShare` = { low 0, high 1 } the orbit patch has its own weight in the orbit view of the dive and of the
rise; `patch.aim` is set each frame by the view; Saturn is an open stop, the star field is rigid from the hold
through the rise; `skyGlow` only scales patches; the post grain is 0.012.

Finding (mailed 23:17 VM): the film's star field alone cannot hold both judged frames. 3720 (draft, against
the approved close, plain and blurred, G17 median and p25): kept still 5.335, 1.079, 0.995, 0.919; my frame with
the terrain sky picture 33.669, 26.876, 0.681, 0.287; with the film's field at exposure 0.193 and no glow
34.998, 28.099, 0.625, 0.287. In the box x 0 to 900, y 0 to 330 of 3720: approved mean 7.7, 10.8, 15.4 (p95 19,
p99 31); with the picture 7.8, 11.1, 15.8; film field 7.5, 9.5, 11.1 (p95 20, p99 43).

Way A as built (this replaces what stood here at 23:45; the hero sky function and the place of the veil changed):
- The hold's sky picture (sky.json orbit) stays; before the hold the engine alone brings it in; from the hold
  on its weight is `look.patchShow * plan.heroSky(time)`. heroSky is by the distance of the lens from the path
  the lens flies in the hold (plan.ts fromHold: the nearest point of that path, measured with sky.hero.chords
  = 300 chords; under sky.hero.slack = 0.0001 radii the lens counts as on it): 1 - smooth((d / reach) to the
  power power), reach 1.2 radii, power 0.75 (skim.json sky.hero). On the hold's own path d is 0, so the weight
  is exactly 1 there and the hold keeps its bytes. The first version measured from the hero's one lens (the
  middle of the hold) with a log ramp from 0.36: it held the weight at 1 until 3545 and then fell 0.0624 in
  one frame at 3575; by the distance from the path the fall starts with the dive and is spread evenly.
- `plan.skyProof()` runs at build and throws if the hold's weight is not exactly 1, if the dive's distance
  ever turns back, if the weight is not 0 at the engine's change of view, or if the rise comes within reach.
  Its numbers now: hold 1, distance at the change of view (3589.25) 1.2127, least in the rise 1.2805 (at
  3865.75).
- Weight on the present dive: 0.999 at 3541.30, 0.99 at 3546.50, 0.9 at 3558.65, 0.75 at 3564.55, 0.5 at
  3571.30, 0.25 at 3577.55, 0.1 at 3582.15, 0.01 at 3586.90, 0 at 3589.00; largest fall in one frame 0.0407
  at 3572.
- public/assets/saturn/full/sky-terrain.webp and web/sky-terrain.webp are deleted, sky.json has no terrain
  entry, RECIPE.md has a "Retired" note in place of the recipe.
- The air: `plan.lowAt(height)` = 1 - smooth(log(h / 0.6) / log(1.8 / 0.6)) (skim.json sky.heights); the
  exposure of the stars is times mix(1, sky.near, low) (plan.skyGain; sky.near 0.17, so 0.55 * 0.17 = 0.0935
  in the skim). veil.ts draws the light of the dust under the stars as a function of the ray: color times
  (1 + plane * exp(-|sine of the angle over the plane| / fall)) plus a halo round the lit globe (color at the
  limb, falling by exp(-angle from the limb / fallDeg), times how lit the nearest limb is). One full screen
  triangle, additive, no depth, drawn first, so everything covers it.
- The veil is owned by set.ts, not by the model: it is set each frame from the drawn scene's transform and its
  amount is lowAt(height of the lens) times the weight of the stop over the exposure of the shot (0 in the raw
  diagnostics or when the stop is not drawn). So it does not know which scene (kept or model) is on and does
  not change when the takes change scene. 3720 kept its bytes when the veil moved from the model to the set.
- The air is 0 outside my two moves: the lens is higher than 1.8 radii over the plane in the approach (49.8
  at 3350, 11.8 at 3360, 4.6 at 3370, 2.54 at 3380), in the hold (2.228 to 2.413) and in the travel (3.0 at
  3890, 4.3 at 3900, 9.3 at 3910), from the engine's shots (out/scratch/apprh.ts).
- The approach and the hold keep their bytes: draft stills 3350, 3370, 3380 equal to the tree before the
  change, 3390, 3465, 3539 equal to the kept stills (cmp). Proved again after the hero sky function changed
  (see below).

Calibration of the air on 3720 (four draft stills, against the approved close; herocmp plain and blurred):
kept still 5.335, 1.079; my frame with the old sky picture 33.669, 26.876; the film's field with no air
34.998, 28.099; way A now 33.983, 27.100. So way A loses 0.31 plain and 0.22 blurred against my frame with the
picture, more than the tenth of mail 298: said plainly in the report, the Builder decides. In the sky both
frames share (21.7 percent of the frame): kept still 2.123, 0.899; with the picture 2.069, 1.253; the film's
field alone 7.707, 6.235; now 3.927, 2.467 (signed +0.21, +0.09, -0.34 levels). Box x 0 to 900, y 0 to 330:
approved mean 7.7, 10.8, 15.4, p95 18.7, p99 30.0; now 8.3, 11.5, 15.7, p95 19.4, p99 28.8. What is left is
not level but place: the film's field has a warm band of stars at the far left of the frame (+1.6 to +4.8
levels there) where the approved has plain blue black, and the approved's stars are fewer and softer.

Footprint of the hold's picture in the dive (out/scratch/foot.ts; share of the frame that is sky, share that
is sky inside the footprint, weighted): 3540: 0.412, 0.392; 3560: 0.442, 0.385; 3568: 0.473, 0.343; 3576: 0.513,
0.275; 3584: 0.562, 0.211; 3588: 0.584, 0.186; 3596: 0.623, 0.162 (least); 3612: 0.679, 0.183. It never leaves
the frame; its share falls because the field of view widens (30 to 48 degrees).

handover_engineer (low, about 23:50 VM): plan E is on agent/engine-handover at 6d260fb (E commit 667cae5), not
on main yet. Saturn stays in handover.ownPath and flies its own path. New and usable on any path once it is on
main: state.height, plan.eyeHeight(time), plan.eye(kind, time, view), plan.eyeShot(kind, time); `--diag
onemove` draws Saturn on E. To do when it is on main: read the height from state.height in set.ts and model.ts
(today: the drawn scene's eye in the ring frame, the same number).

## 2026-11-24, 00:00 to 00:30 VM: step 1 made whole (what changed since "Way A as built" above)

Mails read: 417 (main 65fb91d holds the capture rate, plan H; merge it; nothing of mine changes by it). Plan E
and the seam cure of the travels are not on main yet.

Merges (never rebased): main f0c67f1 as 0a965c8, main 304f1c6 as a85665e, main 65fb91d as 91017d9. Stale
worktrees removed, 11 GB free.

### The air starts under the hold (replaces heights 1.8 above)

The first dive sequence with way A (draft, every frame looked at) was continuous, but the sky's mean level rose
from 18.77 (3540) to 25.29 (3576) before it fell: the film's warm star band shows where the hold's picture
leaves, and the air only began at 1.8 radii (3577). So skim.json sky.heights is now [0.6, 2.2] and sky.power
0.5: lowAt(h) = (1 - smooth(log(h / 0.6) / log(2.2 / 0.6))) to the power 0.5. 2.2 lies under the least height of
the hold (2.228 at 3390; skyProof now throws if low(t) is not 0 anywhere in the hold), so the stars the
picture uncovers are dimmed as they show. Second dive sequence (3556 to 3630 new, 3540 to 3555 are the same
bytes; out/scratch/skymask.ts and /tmp/v/skylevel.py, the sky inside an eroded mask of sky, levels of 255):
18.77 at 3540, peak 22.92 at 3571, 16.46 at 3589, 12.11 at 3600, 9.62 at 3623; largest change in one frame
-0.560 at 3583 (inside the footprint of the hold's picture -0.929 at 3583). Before: peak 25.29, largest change
-0.613 at 3592, inside -0.891. Every frame of the second sequence looked at on sheets and the top of 3564,
3574, 3584, 3592, 3606 at full size: one continuous move, the band is strong at the left from 3566 to 3590
and dims with the height, the moon goes behind the limb 3596 to 3598. The soft blue lane next to the band is
the film's own sky (it turns with the stars; the horizon of the ring plane, where my veil is brightest, runs
from x 328 at the top to the right edge at y 259 in 3592, out/scratch/horizon.ts).
3720 does not change by this (the air is whole there either way).

### The engine's sky schedule is off for Saturn (replaces the skyShare override)

`skyShare()` returning { low 0, high 1 } broke two tests of tests/place.test.ts (421: the shot at T must carry
the engine's sky share 1; 455: the share must equal skyWeight). Fixed in my folder: no override; instead the
plan gives `handover.dive.skyFrames: 0` and `handover.rise.skyFrames: 0`, so the engine's skyWeight is a step
at its own first frame of the handover (3589 in the dive: from there the engine draws no orbit patch; up to
there the patch has its own weight, heroSky) and there is no cross by the clock. skyProof now asks that heroSky
is 0 at 3589.0 (distance there 1.2016, reach 1.2). The picture is the same (proved by bytes, see below).
vitest: 31 files, 340 ok, 0 not ok (use --reporter=tap; the default reporter crashes on a failure in this workspace).

### The stars of the flight come in by height in the rise (new: plan.skyLiftAt)

Found while checking the sky's state at the last frame: in the rise the engine lifts the stars of the flight
(travel.sky.riseLift 1: the 500000 flight stars, the 760000 deep stars, the flight look of the band, and the
exposure from the stop's 0.55 to the travel's 0.45) from its change of view (3860.25) to the end of the rise by
the clock: x = smooth(ramp(T, end, time)), lift = 1 - (1 - x) squared. On the first rise sequence that is
visible: 3858 and 3866 have few stars at the right, 3874 and 3884 a dense field. The engine has a hook for
it, StopPlan.skyLiftAt (the time the lift is read at). plan.skyLiftAt now gives the time by the height of the
lens: mix(T, end, liftAt(h)), liftAt(h) = ramp(2.04, 2.92, h) to the power 1.5 (skim.json sky.lift), so the
engine's own course runs on the share of the way between the two heights. 2.04 is over the height at the
change of view (2.0337), 2.92 under the height at the end (2.9391); skyProof throws if the lift is not 0 at
the change of view, not 1 at the end of the rise, or ever falls. Numbers (out/scratch/lift2.ts): largest step
of the lift in one frame 0.12 at 3867.5 (by the clock 0.08 at 3868); lift 0.296 at 3866.25 (by the clock
0.274), 0.75 at 3870, 1 from 3878 on (by the clock 3884), because the lens nearly stands still over the last
frames of the rise (the travel starts from rest). By the logarithm from the hold's top (2.42 to 2.9) it
would step 0.20 in a frame: not taken. It is a function of height in the rise only: the dive and the hold
are drawn by the engine with no lift at all (the hold is the hero's sky), there is no hook for them.
State at the last frame 3884 (out/scratch/turn.ts): sky exposure 0.4500, lift 1, patch weight 0 (the engine
gives the orbit patch 0 in a rise and heroSky is 0 there), the sky turn the same quaternion from 3380 to 3900.

### The shutter of the drawn frame (mail 362)

main 65fb91d brings `view.shutterSeconds` (src/core/clock.ts shutterSeconds(): the full shutter of the frame
being drawn, in seconds, at the capture rate). model.ts: take = (view.shutterSeconds ?? shutterFraction / fps)
* (view.shutter ?? 1) / samples. plan.ts skimAt keeps `config.shutterFraction / (2 fps)`: that is where the
middle of the skim lies in film time (the pose of the approved close at 3720.25), not a shutter.

### Waiting to be done after this commit

- Ruling (a), built once and taken out again so that step 1 commits alone; the patch is /tmp/v/ruling_a.patch
  (if /tmp is gone: globe.ts map rigid `spinY(p, uSpin)` with the drift added only to the longitude of
  bandFine and flow vec2(0.0); kept/globe.ts zonal and uDrift removed; kept/look.ts and kept/set.ts drift
  removed; look.ts comment). Hold frames other than 3465 change bytes by it (the map slid up to 0.5 degrees,
  about 2 px, at 3390 and 3539; 3465 has elapsed 0); 3720 is then judged by G17.
- The traced sheet of every second frame 3562 to 3598 with the ring edges.
- Ruling (d) and mail 385: every size in pixels in grains.json (levels.pixels, levels.largest, lobes.pixels,
  largestPoint 1000), ice.json (the sand layer's pixels, ice.ts 212 and 221) and a sweep of sheet.json,
  ringfine.json, skim.json becomes pixels of a frame 1080 high scaled by the drawn height (a `frame: 1080`
  in the JSON keeps the bytes at 1920 by 1080); the largest point becomes a share of the height (0.1: 108 px
  at 1080, 216 px at 2160, under 255). Grains are sorted far to near in 4096 log distance buckets
  (grains.ts set()): points keep every bucket farther than the farthest bucket that holds a grain whose
  point size (2 radius + way + 3 + 2 past, on the CPU from deep, dist, size, lens.slack and the projected
  centre) is over the limit; all nearer grains go to a second batch of instanced quads (index order a, b, c,
  d, a, c; the same shaders with a define: the place in the sprite from an interpolated varying in place of
  gl_PointCoord), so the order far to near holds across both batches.
- state.height from plan E when it is on main; then step 2, step 3, step 5.

## 2026-11-24, 00:30 to 00:50 VM: proofs of step 1, the handover tool, the traced sheet

### Proofs at draft on the final tree (job /tmp/v/job25.sh, pictures /tmp/v/r25)

- Same bytes as before the last changes (skyFrames 0 in place of the skyShare override, the drawn frame's shutter,
  the merge of main 65fb91d): 3465, 3390, 3539 (the kept build's drafts /tmp/v/kept), 3380, 3720, 3560, 3588, 3589,
  3600, 3850, 3856 to 3860, 3885, 3886.
- 3861 to 3884 differ, as meant: the stars of the flight come in by the height of the lens. Looked at every frame
  3856 to 3886 and at the sky at full size 3860 to 3879 (rise2_a, rise2_top1, rise2_top2 in the looks): the field
  fills evenly from 3861 to about 3872, no frame steps. The globe does not change by it (a box on the lit globe:
  0.0001 of its pixels differ, by 1 level); the rings change only where stars show through them.
- tsc clean; vitest 31 files, 340 ok, 0 not ok.
- `npm run gate -- --phase 6 --only G11,G15 --g15-stops saturn`:
  "PASS G11  every asset has a row or a recipe"
  "PASS G15  at most 2 sets per frame; finished stops: saturn/web 274 MB, saturn/full 747 MB"
- `npm run smooth -- --stop saturn --only path` (6 s): red by two numbers, both at 3887 (the travel's start, mail
  387 (4)): whole frames speed 0.088, rate 2 speed 0.098. Dive: no number over its limit. Rise inside its own
  frames: all under 0.08 (numbers in the section before).

### The handover tool's older rate rule is red with the new pace (not cured, reported)

`npm run handover -- --stop saturn --tier draft --only sides,flow,path` on the final tree:
"saturn.dive side difference at T: pass", "saturn.dive flow gap at T: pass",
"saturn.dive every frame: FAIL frame 3591 changes height at 2 times the mean rate, limit 2; frame 3550 (one fifth
of the way) moves at 0.31 of the mean rate, at least 0.5 asked",
"saturn.rise side difference at T: pass", "saturn.rise flow gap at T: pass",
"saturn.rise every frame: FAIL frame 3848 changes height at 3.39 times the mean rate, limit 2".
Side difference at T in the dive: mean 0, max 1 level; flow gap 0.02 px a frame mean, 0.025 largest.

What the rule is (tools/handover.ts 404 to 424, "the rate limits of E3"): the height is the lens's distance
from the globe's centre less 1 (the same height smooth uses); the mean is taken over the far part only (first
frame to T in a dive, T to the last frame in a rise); no frame of the whole move may be over 2 times that mean,
and a dive must have half of it by one fifth of the way to T. Before step 1 it passed (dive fastest 1.211 at
3596, 0.698 at 3550; rise fastest 1.391 at 3870) and smooth was red (0.092 dive, 0.149 rise).

Why the two rules pull apart: smooth wants the rate to leave the hold's own rate and to arrive at the travel's
own rate with no step over 0.08 of the mean, so each measure of my pace goes up to one top by a steady change a
frame and down again (a triangle with round corners). A triangle from the hold's rate (0.04 of the mean) has
0.2 of its top at one fifth of the way and its top is 2 times the mean of the way up: 0.31 and 2.002 in the
dive. In the rise the rate has to come down to the travel's start (ratio 1.00065 a frame at 3884), so the far
part (3860 to 3884, 1.49 percent a frame) is the slow part and the top at 3848 (5.03 percent) is 3.39 times it;
the near part's mean alone (height 0.98 to 3.92 in 48 frames, 2.9 percent a frame) is 1.95 times the far part's.
The engine's own pace on agent/engine-handover (config handover.pace: rise 0.4, fall 0.4, corner 0.2, read only,
no code taken) has the same shape, so the rule would be red there for the same reason (my reading, not run).
What would pass both in the dive: a quicker start and a flat top (a trapezoid): the way up over about 0.2 of the
dive, then level to T; in smooth's unit that is a step near 0.065. Not built: it is a new pace for the dive
(all 90 frames change) and the rise cannot pass with T at 3860 unless the rate stays at its top until after T
and falls to the travel's start within about 21 frames (step near 0.063, at the edge). Asked the Builder which
rule holds for a path of my own.

### The traced sheet: how far the kept set's ring layout is from a rigid plane, 3562 to 3598

Tools: out/scratch/trace.ts FROM TO STEP OUT OFFSET (the lens of the film per frame from plan.flight and drift, the
weight of the hero layout as kept/set.ts takes it: 1 less smooth step of the lens's distance from the hero
pose over look.heroRange 0.6 to 1.6), /tmp/v/trace.py (projection, the globe as an ellipsoid with the polar
scale along the ring normal, hidden test), trace2.py and trace3.py (the picture's own edges: the steepest
change of level along 720 radial lines of the plane, per frame), trace4.py (outliers out against a running
median), trace7.py (the table), trace6.py (the sheets). Frames: the draft dive /tmp/v/r24/keep_dive2. The lens
model is checked by the globe's limb (the drawn limb lies on the picture's limb in 3562 and 3598) and by the
end state (from 3598 on the picture's edges lie on the circles).

What the kept set does there (read from kept/rings.ts and kept/set.ts, uClose is 0 on this branch): the hold's
rings are the hero's layout, which is not circles on a plane round the globe: the radius the profile is read at
is pushed by a table by azimuth and radius (polar-warp.bin, 512 by 64, least -0.072, most +0.053 radii), with
the hero's own edge look (bright rim, arcs outside the edge) and the hero's ring pixels on the plane (weight by
height 1.0 to 1.7). The weight of all of this (uPolarShape) is the pose weight: 1 through 3574, 0.984 at 3576,
0.873 at 3580, 0.662 at 3584, 0.395 at 3588, 0.151 at 3592, 0.012 at 3596, 0 from 3598. (The notebook said
3562 to 3588 before; on this tree's path it is 3575 to 3597.)

Measured (px of the 1920 frame; the edges are the outer edge, the inner edge of the A ring, the outer edge of
the B ring; gap is the distance between the picture's edge and the place where the same azimuth's edge settles
after the bend):
- With the hero layout whole (3560 to 3574): outer edge median 11 px, 95th percentile 23.8 px; A inner 3.6 and
  22 px; B outer 5.5 and 13 px.
- Half way (3586, weight 0.531): outer 5.4 and 11.0; A inner 1.7 and 12.4; B outer 2.6 and 9.2.
- From 3597: under 0.2 px median, 1.4 px at the 95th percentile (the finder's own floor).
- The slide of the picture's edge against the rigid plane in one frame, median over azimuths: at most 0.80 px
  (outer edge, 3586), 0.33 px (A inner), 0.39 px (B outer); where the table is largest about 1.5 px a frame
  (0.068 of the weight a frame times 22 px); the finder's floor is 0.04 to 0.14 px median. The picture's own
  motion of those edges is 7 to 8 px a frame there (median), so the slide is up to one fifth of the motion.
- Scale: 440 to 466 px to a radius at the near left of the ring, 240 to 270 at the right, 180 to 200 at the far
  side.
What I see on the sheets (bend_whole_1 to 3, bend_left, bend_right in the looks): in the stills the edges are
off the circles by up to about 25 px until 3576 and on them from 3596; in the window on the near left the
bright rim of the outer edge and the dark lane outside it go between 3582 and 3590 and the A ring's grain goes
smooth; the Cassini gap's edges walk about 8 px onto the lines. It is a change of the ring's shape and edge look
by pose over about 20 frames, small against the motion, and it is what note G names if one looks for it.
A cure, if the Builder wants one: one layout for the whole stop. Either the hero's table stays on at full
weight at every height and the model's field is read at the same pushed radius (then the plane is rigid, its
rings are not exact circles, 3720 moves by up to 0.05 radii of ring layout), or the hold is drawn on true
circles (then 3465 loses against the approved hero: the model alone measured 12.3 and 5.9 against 5.5 and 2.2).

## 2026-11-24, 00:46 to 01:00 VM: step 1 committed (07cadd2), main 4f2127a merged (e7a9815), proofs on the merge

main moved to 4f2127a while I wrote the notes (the travels' seam cure, d162: src/space/travel/path.ts passCurve,
two lines of src/director/film.ts, tests/pass.test.ts). Step 1 is commit 07cadd2 on the merge of 65fb91d; the
merge of 4f2127a is e7a9815. On e7a9815:

- tsc clean. vitest exit 0: 32 files, 0 not ok (346 rows ok by the count that gave 340 before; the six new rows
  are tests/pass.test.ts).
- `npm run smooth -- --stop saturn --only path`: "smooth saturn: green. out/work/smooth/saturn.md", in the
  report "VERDICT: green. No number is over its limit." The two reds at 3887 are gone with the travel's cure, as
  mail 387 (4) said. Dive, whole frames: rate 0.037, turn 0.053, speed 0.060 (rate 2: 0.037, 0.054, 0.061).
  Rise, whole frames: rate 0.067, turn 0.067, speed 0.067 (rate 2: 0.068 each); seam in 0.009, 0.002, 0.003; seam
  out 0.007, 0.008, 0.020; fall before the peak at most 0.005, no climb after it. Largest values over the mean:
  dive rate 1.599 at 3592, turn 1.945 at 3584, speed 1.676 at 3582; rise rate 2.148 at 3848, turn 2.110 at
  3848, speed 1.686 at 3849. Shown and not judged: the travel's speed steps 0.169 at 3892 and 0.672 at 3896.
- `npm run handover -- --stop saturn --tier draft --only path` (18 s, no pictures): the same two red lines as
  before the merge (dive 3591 at 2 times, 3550 at 0.31; rise 3848 at 3.39).
- Draft pictures on the merge (job /tmp/v/job26.sh, /tmp/v/r26): 3465, 3390, 3539, 3720, 3560, 3588, 3589, 3600,
  3850 and every frame 3856 to 3884 keep the bytes they had before the merge. 3380, 3885 and 3886 changed by
  the merge (the travel's cure changes the arrival's size curve and the first frames of the leg): rendered on
  a worktree of main 4f2127a itself (/home/user/workspace/mainref), 3380, 3885 and 3888 of my tree equal main's
  bytes. So step 1 changes no frame before 3540 and none after 3884.

The handover tool's rate rule, read again (cut/HANDOVER.md E3: "rises smoothly from the hold's own rate, stays
near constant"; plan E of the second note: "rises once and falls once"). Both can hold together with a pace
that has a level top: up, level, down. My note above that the rise cannot pass was wrong: it can if the top is
held through T and the fall takes the last 21 frames or so: top about 1.5 of the mean, steps about 0.07, the
far part's mean about 0.55 of the top, so the fastest frame is about 1.8 times it. In the dive: up over about
22 frames to about 1.23 of the mean, level to about 3605, down to the skim's 0.85: steps about 0.06, the
fastest frame about 1.4 times the far mean, 0.5 of it at 3550. That is a third try of the pace (all frames
of the dive and the rise move). Pace gets a level top for it (peak as two shares).

## 2026-11-24, 01:00 to 01:45 VM: mails 437, 439, 450, main 94be42e merged (b85c30e), try 3 of the pace

Mails since the last section:
- 437: main 94be42ed77bf4468a83f30aee634185d27b29e88 holds plan E's one move (engine 6d260fb8); only Mars is on
  it; merge at the next commit and name commits only on top of it. Done: merge b85c30e (my folders untouched by
  it).
- 439 (rulings, d165): 1 ac0b7325 is not a candidate (one judge red); try 3, the pace with a level top; name the
  commit when both judges are green on the VM. 2 read the every frame rule again on the merge; say why the
  one move cannot carry Saturn. 3 the stars' lift by height is accepted as a step; state the level of the
  flight's stars in the dive at the same heights beside the rise; "If the two differ by more than you can see
  on two frames side by side, the dive takes the same function." 4 3720 with the film's own sky stays; no sky
  picture comes back; before any change show 3720's top left at full size beside the approved image, at final.
  5 the hold's ring layout stays the hero's and gives way to the rigid plane by pose; what may not happen is an
  edge look that fades: "the bright rim of the outer edge and the thin dark lane in the A ring must be in both
  tables at the same radius, so they walk the 8 px onto the circles and never go out and come back." That is
  step 2. 6 no machines for ac0b7325.
- 450 (size, G12): main's tracked tree is 2961 MB of 3000. Every asset that comes in is paid for by one that
  goes out in the same commit; every READY says the net MB of my folders against main; growth needs the
  Builder's word first.
- From sky_builder (copy of its mail 426 to the Builder, no action until the Builder decides): the picture
  public/assets/saturn/{full,web}/sky-hold.webp carries the negative of the post grain of frame 3465, because
  assets-src/saturn/sky/patch.py hold, line 154, subtracts a film frame rendered with grain and dither on. Its
  cure if asked: render the glow input with --diag nograin and rebuild the patch (changes the bytes of every
  frame that shows the patch). Its judgement: below sight, leave it.

### Mail 439 item 2: the every frame rule on the merge, and the one move on Saturn

On b85c30e with the pace of ac0b732 `npm run handover -- --stop saturn --tier draft --only path` printed the
same two lines word for word: "saturn.dive every frame: FAIL frame 3591 changes height at 2 times the mean rate,
limit 2; frame 3550 (one fifth of the way) moves at 0.31 of the mean rate, at least 0.5 asked" and "saturn.rise
every frame: FAIL frame 3848 changes height at 3.39 times the mean rate, limit 2". The rule's code (tools/
handover.ts 404 to 424) did not change with plan E; only the eye now comes from plan.eye.

The engine's one move forced on Saturn (out/scratch/onemove.ts, the engine's forceOneMove, numbers only): the
eye goes through the ring plane. Dive: least height over the plane -0.3341 radii at 3598, under the plane from
about 3590 to 3608, back up to 0.589 at 3629. Rise: -0.2703 at 3839, under it from about 3828 to 3847. The
one move carries the eye by its height over the globe's sphere toward the place; Saturn's place is on the ring
plane, 1.38 radii out from the globe's surface, and the straight way by that height cuts the plane. The judge
on it: dive rate climbs again by 0.269 after its peak, steps turn 0.200, speed 0.080; rise steps rate 0.091,
turn 0.100, speed 0.133. So Saturn stays in handover.ownPath (the engineer's own test skips Saturn for the same
reason).

state.height (plan E) is the height of the lens over the globe's unit sphere. What follows a height in this
stop follows the height over the ring plane (the air lies on the plane, the sheet's near light, the kept set
giving way to the model). The model and the air already read it from the pose of the scene as drawn (camL.y).
set.ts read it from plan.flight(time): now it reads it from the pose the engine gave the set for the take, so
nothing of the picture asks the stop's own flight for a height.

### Try 3: a pace with a level top (plan.ts Pace, peak as two shares)

Pace takes peak as one share (as before, the same numbers) or two: the rate goes up, stays level between the
two shares, and comes down; round is one share or four (start, into the level, out of it, end). The four
measures of a move (reach, climb, round, view) each have their own.

The search (out/scratch/opt4.ts to opt6.ts, pace.ts for the two judges on a candidate, e3.ts the every frame
rule, sm.ts smooth's three curves; all read skim.json and take name=value): least largest step of the three
curves at whole and half frames under E3 (no frame over 2 times the far mean, the dive's frame 3550 at least
0.5 of it), with a weight on the roughness of the speed curve so that it stays one hump.

The pace chosen (skim.json handover.dive and handover.rise; candidates in /tmp/v/p3: cand1, dv1, dv2, rv1, rv2;
curves pace_dive_v.png and pace_rise_v.png in the looks):
- Dive (dv2): reach peak [0.248, 0.655] round [0.03, 0.086, 0.177, 0.03]; climb [0.679, 0.746] round [0.088,
  0.161, 0.163, 0.154]; round [0.549, 0.664] round [0.071, 0.211, 0.126, 0.03]; view [0.428, 0.448] round [0.087,
  0.155, 0.105, 0.063]. The rate goes up over 3541 to 3562, is level at 1.17 of the mean to about 3599 and comes
  down to the skim's 0.86; the turn and the speed of the picture are one hump each (speed top 1.46 at 3588).
- Rise (rv1): reach peak [0.364, 0.691] round [0.03, 0.075, 0.04, 0.03]; climb 0.267 round [0.036, 0.093, 0.03];
  round 0.562 round [0.24, 0.09, 0.118]; view 0.438 round [0.095, 0.091, 0.03]. The rate goes up over 3811 to
  3837, is level at 1.52 of the mean to 3862 and comes down to the travel's start.
- The rise cannot go much under 0.074: two flanks and a level that has to last until after T (3860), since E3
  takes its mean over T to the last frame and no frame may be over 2 times it.

Both judges on the VM, working tree on b85c30e:
- `npm run smooth -- --stop saturn --only path`: "smooth saturn: green. out/work/smooth/saturn.md"; in the
  report "VERDICT: green. No number is over its limit." Dive, whole frames: rate 0.066 at 3545, turn 0.066 at
  3565, speed 0.066 at 3544 (rate 2: 0.066 each; between capture frames 0.033, 0.033, 0.034); seam in 0.008,
  0.001, 0.002; seam out 0.004, 0.002, 0.007; fall before the top at most 0.006, no climb after it; tops 1.166
  at 3594, 1.812 at 3581, 1.460 at 3588. Rise, whole frames: rate 0.075 at 3818, turn 0.073 at 3835, speed
  0.074 at 3824 (rate 2: 0.075, 0.073, 0.075; between capture frames 0.038, 0.037, 0.038); seam in 0.011, 0.003,
  0.003; seam out 0.024, 0.017, 0.022; fall before the top at most 0.003, no climb after it; tops 1.513 at 3844,
  1.919 at 3844, 1.690 at 3848. Shown and not judged: the travel's speed steps 0.654 at 3896 (rate 2: 0.751).
- `npm run handover -- --stop saturn --tier draft --only path`: "saturn.dive every frame: pass", "saturn.rise
  every frame: pass". In the report: dive "fastest frame 3563 at 1.24 times the mean rate; frame 3550 (one
  fifth of the way) at 0.631 of the mean. The place is at most 0.328 of the half frame from the middle (frame
  3576)."; rise "fastest frame 3839 at 1.782 times the mean rate; frame 3879 (one fifth of the way) at 0.462
  of the mean. The place is at most 0.451 of the half frame from the middle (frame 3873)." Shutter: dive no
  frame shortened, longest blur 9.79 px (3629); rise 51 of 75 frames shortened, shortest 0.5279 (3862), none at
  the floor, largest change of the blur from one frame to the next 1.92 px (into 3818).
- tsc clean. vitest exit 0: 35 files ok, 0 not ok (349 rows).

What moved with the pace (heights over the ring plane by frame, out/scratch/proof.ts):
- Dive: 2.413 at 3540, 2.415 at 3543 (its top), 2.2 at 3563.05, 2.04 at 3569.38, 1.8 at 3577.27, 1.03 at 3600.72,
  0.93 at 3604.46, 0.6 at 3625.79, 0.587 at 3630. So the kept set gives way to the model over 3600.7 to 3604.5
  (ac0b732: about 3598 to 3601).
- Rise: 0.267 at 3810, 0.6 at 3833.95, 0.93 at 3841.47, 1.03 at 3843.41, 1.8 at 3856.31, 2.2 at 3862.78, 2.42 at
  3866.66, 2.92 at 3881.14, 2.939 at the end.
- The kept set's layout weight (lens to the hero pose over look.heroRange 0.6 to 1.6): 1 through 3564, 0 from
  3597.5, where the lens is 1.117 over the plane, above the 1.03 at which the model's first take is drawn. So
  the bend of the layout by pose now runs over 3565 to 3597 (33 frames; 24 before).
- The sky picture of the hold (plan.heroSky, out/scratch/hero.ts): weight 0.999 at 3541.28, 0.5 at 3565.34, 0
  from 3586.58; largest fall in one film frame 0.0367 (from 3562.5); it never goes back up; 1.2868 from the
  hold's path at the dive's change of view (reach 1.2), 1.2866 at the nearest in the rise.

### Mail 439 item 3: one function of the height for the flight's stars

The hold is flown at 2.228 (3390) to 2.413 (3540) over the ring plane and the dive tops at 2.4146 (3545). With
sky.lift.heights [2.04, 2.92] the rise showed the flight's stars at heights where the dive and the hold show
none: 0.08 at 2.27, 0.25 at 2.38 (the dive: 0 at every height). The dive cannot take that function without
changing the hold (2.228 to 2.413 lies inside it). So the function moved instead: the lower height of
sky.lift.heights is now 2.42, above every height of the hold and of the dive (skyProof stops the build if the
hold or the dive is flown inside it). It is one function of the height on both sides: 0 at every height the
lens has on the way down, and the same 0 at those heights on the way up; only the rise goes higher.

First build of it, [2.42, 2.92] with the old course (share to the power 1.5, then the engine's own smooth step
and 1 - (1 - x)^2): the stars came in over 3867 to 3880, the largest change of the lift in one film frame 0.171
(into 3872; 0.123 before; 0.080 by the engine's clock). Rendered at draft and looked at at full size (looks:
"sky at full size 3866 to 3871", "3872 to 3877"): the field of faint stars doubles from one frame to the next
around 3871. The sky's mean inside the sky mask (/tmp/v/skylevel.py) changed by up to +2.26 in one frame (3873).
Not kept.

Second build, kept: liftAt is the level of the flight's stars itself, a smooth step of 1 - (1 - share)^power,
share the way between sky.lift.heights [2.42, 2.9377], power 0.5; skyLiftAt undoes the engine's own course
(x = 1 - sqrt(1 - level), share of its span = 0.5 - sin(asin(1 - 2x) / 3)) so that shot.skyStars is that level.
Why one half: the lens climbs ever slower toward the end of the rise, the height left goes with the square of
the time left (2.938 - height is 0.00164 times the square of the frames left to 3884.5, checked at 3867, 3875,
3880), so the square root of the share left is the share of the time left and the level runs as a smooth step
over the frames 3866.7 to 3884. The upper height is the height of the lens at the last frame of the rise
(2.9377 at 3884), where it hardly climbs any more, so the level lands softly (with 2.93 it stopped at 3882 from
0.052 a frame).
Level by frame (out/scratch/stars.ts, shot.skyStars): 3866 0, 3867 0.0009, 3868 0.014, 3869 0.042, 3870 0.083,
3871 0.136, 3872 0.200, 3873 0.272, 3874 0.351, 3875 0.435, 3876 0.521, 3877 0.608, 3878 0.691, 3879 0.770,
3880 0.842, 3881 0.902, 3882 0.950, 3883 0.983, 3884 0.9999, 3884.5 and after 1. Largest change in one film
frame 0.0865 (into 3876.5), on whole and half frames (out/scratch/lift5.ts searches the upper height and the
power: the least it finds is 0.0840).
The exposure of the sky by height is the same function down and up already (plan.lowAt): 0.5000 at 2.0227 in
the dive (3570), 0.5025 at 2.0314 in the rise (3860).

What the pair shows (looks: "same height 2.38 radii: dive 3552 beside rise 3866", top right at full size and
whole frames): the two skies at the same height do not look the same, though the flight's stars are 0 in both.
At 3552 the sky is the picture of the hold (many faint stars, its weight 0.9 there, it leaves by the distance
of the lens from the hold's path); at 3866 it is the film's field at the stop's level, few stars and the blue
glow of the dust, and the many faint stars come in above 2.42. So down and up differ by the hold's picture,
which the rise never comes near (1.287 radii from the hold's path at the nearest), not by the lift. Said to the
Builder as it is.

Sky level in the rise, draft, every frame 3810 to 3890 (/tmp/v/skylevel.py, masks from out/scratch/skymask.ts;
mean luma of the sky inside the eroded sky mask, levels of 255): 15.84 at 3810, 16.0 to 16.5 through 3836, 17.9
at 3848, 21.65 at 3858, 25.17 at 3866, 27.89 at 3870, 30.15 at 3873, 29.25 at 3874, 28.22 at 3875, 29.08 at
3876, 31.45 at 3878, 33.37 at 3880, 34.67 at 3882, 35.14 at 3884, 35.15 at 3885 to 3890. Largest change in one
frame +1.228 (3877); the fall -0.898 (3874) and -1.033 (3875) is the engine's sky itself, which is not monotone
in the lift: between a lift of 0.27 and 0.44 its band changes from the stop's look (grainy warm clusters) to
the flight's (soft glow with dark lanes, src/space/sky.ts swap), and the mean of the sky falls by 1.9 while it
does (looks: "band at full size 3872 to 3877"). The same fall was there with the first build (3871, 3872). It
is the engine's, not touched. Last frames: 3882 +0.562, 3883 +0.344, 3884 +0.132, 3885 +0.005.

### Mail 439 item 4: 3720's top left at final beside the approved image

/tmp/v/topleft.py: the top left 960 by 540 of the final tier's 3720 at full size beside the same box of
references/approved/saturn-close.jpg brought to the frame's size (looks: "3720 at final, top left 960 by 540").
What it shows: in the film's frame the sky right of x 300 is nearly black with a few stars, and the far left
(x under 250) holds the warm band of the film's field, orange clusters and a faint brown veil; the approved
image has an even field of faint blue white stars over a dark blue sky across the whole box and no warm
clusters. Box means: film R 48.62 G 46.37 B 44.49, luma 46.71, median 12.58; approved R 39.37 G 37.96 B 37.53,
luma 38.23, median 12.72 (the box holds the rings below, which are brighter in the film). Nothing changed.

### Mail 439 item 5

Nothing of it is in this commit: it is step 2 (the bright rim of the outer edge and the thin dark lane in the
A ring in both tables at the same radius).

### Proofs at draft on the working tree (b85c30e plus this commit's changes)

- Stills: 3465, 3390, 3539 equal the kept drafts byte for byte (/tmp/v/kept); 3720 equals ac0b732's draft byte
  for byte (/tmp/v/r26). The hold and the skim do not read the pace or the lift.
- Dive 3536 to 3632, every frame, sheets of 12 at one third (looks "try 3 dive draft"): one move, no frame at
  which a part comes in. The moon goes behind the globe's night limb over 3596 to 3600, cut by the limb. The
  draft tier's switch from the kept set to the model lies between 3602 and 3603 and cannot be told on the
  sheets; the frame's mean luma runs through it without a step.
- Rise 3806 to 3890, every frame, sheets of 12 (looks "try 3 rise draft"): one move; the moon comes out from
  behind the globe's limb at 3849; the stars come in over 3867 to 3884 (sky crops at full size, looks "sky at
  full size, even course"). 3885 and 3888 equal main's bytes (/tmp/v/r26/main_3885.png, main_3888.png), 3884 is
  the same with both builds of the lift.
- Judges on the final working tree, run again after the lift changed: smooth "smooth saturn: green.
  out/work/smooth/saturn.md", "VERDICT: green. No number is over its limit."; handover path "saturn.dive every
  frame: pass", "saturn.rise every frame: pass"; tsc exit 0; vitest "Test Files  35 passed (35)", "Tests  268
  passed | 1 todo (269)", exit 0; gate "PASS G11  every asset has a row or a recipe", "PASS G15  at most 2 sets
  per frame; finished stops: saturn/web 274 MB, saturn/full 747 MB".
- Not run on the VM: G13 on every frame, G5, G17 (npm run measure), the handover's picture parts (sides, flow,
  sheets), review and final tiers of the two moves. Final tier: 3720 only (item 4).
- Size (mail 450): no asset added, removed or changed by this commit; net 0 MB against main.

### Mails that came while this was built

- sky_builder, follow up of the Builder's mail 448 (low): sky-hold.webp has the fault (correlation of the
  frame's own post grain with the scene -0.111 at 3465, 0.000 at 3465.5), sky-terrain.webp is clean. Ruling
  relayed: cure it at the cause, the glow input of every sky patch is rendered with --diag nograin (RECIPE.md
  line 37, halo-only.png; it enters at sky/patch.py line 154) and the recipe says so; low priority, never holds
  up a candidate; "put it into the next commit of your own that changes the bytes of your hold or dive anyway",
  at the latest into the round candidate. With that commit send the Builder (a) 3465 at final against the kept
  still: in the dark sky the difference must be grain only (mean and largest), body, rings and limb byte equal
  or at most one level; (b) the correlation number again, at the level of its neighbours (0.00, every block
  within 0.02). Tool: graincorr.py (attached to the mail, saved to /tmp/v/graincorr.py; also assets-src/
  flightsky/ on agent/flightsky): two nograin stills N and N + 1 at draft, then python3 graincorr.py N a.png
  N+1 b.png. Plan: it goes with ruling (a) of mail 374, the next commit, which changes the bytes of the hold
  anyway (this commit keeps the hold's bytes so that the pace can be proven alone).
- globe_engineer (low, no answer): the air of the globe by the height of the lens (plan F). When both
  branches are on main and the Builder says so: in update, if (shot.air) { planet.setAir(shot.air); if
  (shot.air.shell) shell.setAir(shot.air.shell) }; a material of its own with the haze text: if (shot.air?.haze)
  setHazeAir(material.uniforms, shot.air.haze) from src/bodies/air.ts; the stop takes out its own lines that
  change limb, tint or haze by view, segment or time. The knots are the stop's params: air: [{ height, limb,
  tint, haze: { nine fields }, shell: { ... } }, { height: lower, haze: { depth: 1.8 } }, ...], highest first;
  the highest knot from today's numbers of the hold (hazeAir(look.haze)), so the hold keeps its bytes. Not on
  main yet (agent/engine-globe abf28ac5, agent/engine-handover dddef05). Do not wire before the Builder says.

## 2026-11-24, 01:45 to 02:00 VM: try 3 named (a359a4b), main 2dfaf06 merged (21915d7), the report

- Merge 21915d7 of main 2dfaf06 (kit/PROGRESS.md only: decisions d165 to d168 and the jobs line), then commit
  a359a4b7677331c3c6d08df3cd7146a92e13b3f6 "Saturn: try 3 of the pace, a level top; the flight's stars by one
  function of the height", pushed to agent/saturn-code. Every check of the section above was run again on the
  commit and gave the same lines (logs /tmp/v/r27/c_tsc, c_vitest, c_smooth, c_handover, c_gate).
- Decisions read on main: d165 smooth's picture limits are maxPop 1.2 and a change in place of at most 20
  (Saturn's two moves read under it; the tool still owes "Saturn's rings count as the body"); handover_engineer
  is ordered to make the engine's star lift one function of the height on both sides for every stop, so the
  hook plan.skyLiftAt may become the engine's; d168 sky_builder's table lists Saturn's hold patch as carrying
  grain.
- Size against main (mail 450): my three folders are 71.355 MiB at a359a4b against 73.262 MiB on main, minus
  1.91 MiB (sky-terrain.webp went out with step 1).
- Report mailed to /root (high, five pictures): the commit, the four commands (npm run measure -- --stop
  saturn; npm run handover -- --stop saturn --tier draft --only sides,flow,path,sheets; npm run gate -- --phase
  6 --only G11,G15 --g15-stops saturn; npm run smooth -- --stop saturn --only path), the lines of both judges,
  the answers to items 2 to 5 of mail 439, what was not run on the VM, and the open list with a new point 9
  (the engine's sky is not monotone in the lift: its mean falls by 1.9 between a lift of 0.27 and 0.44, frames
  3874 and 3875).
- Open list as mailed, numbering kept: 1 globe near the lens; 2 end of the rise (one fall from the level top
  3862 to 3884, to judge on a review clip); 3 moon (cut by the globe's limb 3596 to 3600 at draft, no pop seen,
  not checked at review); 4 stars through the shaded rings; 5 sawtooth wedge through the Cassini division 3630
  to 3690; 6 fit at 3720; 7 ring tone slides with height 3840 to 3864; 8 draft and review differ in the rise; 9
  the engine's sky dip at 3874, 3875.

## 2026-11-24, 02:00 VM on: ruling (a) of mail 374, the map rigid on the globe

What the ruling asks: "The globe's map stays rigid on its ellipsoid: take the slide of the bands by latitude
(look.globe.drift) off the map and put motion on the function streaks only."

As built (working tree on a359a4b):
- src/stops/saturn/globe.ts (the model's globe): the map is read at spinY(p, uSpin), one turn of the whole body;
  the slide by latitude, uDrift times zonal(lat), is added to the longitude of bandFine only (the fine streaks
  from functions, drawn near the lens). The flow view of the diagnostics gives 0 for the globe's map.
- src/stops/saturn/kept/globe.ts, kept/look.ts, kept/set.ts (the kept set of the hold and the far view): zonal
  and uDrift are gone; the map is read at spinY(p, uSpin). The kept set draws no function streaks, so nothing
  slides in it.
- look.globe.drift (0.2 degrees a second at the fastest latitudes) stays in src/stops/saturn/look.ts as the
  speed of the streaks.
- The slide was counted from the middle of the hold (elapsed = time - plan.holdMid), so 3465 keeps its bytes;
  every other frame of the stop that shows the globe changes by the slide that is no longer there (at most 0.2
  degrees a second times the seconds from 3465: 0.5 degrees at 3390 and 3539, 1.7 degrees at 3720, 2.8 degrees
  at 3884).

Measured (drafts against a359a4b, files /tmp/v/r28/a_FRAME.png; finals /tmp/v/r28/af_3720.png and
/tmp/v/r27/final_3720.png):
- 3465 does not keep its bytes to the last level: 4795 pixels of the globe change by 1 level at draft (the order
  of the sums in the shader); at final 0.5 percent of the pixels of body, rings and moon by 1 level, none by
  more.
- 3390: 237277 pixels, largest 33, 1351 over 8 levels. 3539: 260977, largest 40, 1362 over 8. 3567: 281088,
  largest 43. 3720: 544208, largest 88, 53324 over 8, mean difference 1.08. 3866: 333287, largest 103, 26703
  over 8. Same character everywhere; the storms sit a few pixels along their bands.
- 3720 at final against the approved close (herocmp, g17grid): plain 34.812, blurred 27.846, G17 median 0.691,
  25th percentile 0.326, 62 tiles; before (a359a4b) 34.811, 27.845, 0.690, 0.326. No loss.
  The same on the draft stills: 33.984, 27.101, G17 0.575, 0.275; before 33.983, 27.100, 0.575, 0.275 (these are
  the numbers of way A in the section of step 1: they were draft stills; final stills read 0.83 higher plain
  and 0.12 higher in the G17 median, with the same tool).
- Pictures: /tmp/v/r28/cmp_3720_globe.png (globe crop, before over after), /tmp/v/r28/cmp_3720_close.png
  (approved, before, after), both in the looks.
- Not looked at yet on consecutive frames: the streaks sliding over the rigid map near the lens (0.2 degrees a
  second is about 0.1 px a frame at the middle of the globe in the skim).

## 2026-11-24, 02:10 to 02:35 VM: the sky picture of the hold without the grain of its glow input (mail 448)

- The fault: public/assets/saturn/<set>/sky-hold.webp is the hero minus the film's own glow; the glow input of
  the first build was a still of 3465 with the grain on, so the picture carried the negative of that frame's
  grain. Measured on the kept picture: -0.106 against the grain pattern of 3465 in the hero's own sky, 0.00
  against 3464, 3465.5, 3466.
- The inputs of the first build (the fill take, halo-only.png, the round 2 file) are on no machine and not in
  git. So the picture cannot be built again from nothing; assets-src/saturn/sky/glow.py builds again only what
  the glow enters. Inputs rendered here: 3465 at final with orbit.gain 0 in src/stops/saturn/sky.json, once as
  it is (/tmp/v/r28/glow_grain.png: this is the first input again, it gives the kept file back exactly on 0.90
  of the far dark sky and within 1 level on 0.987) and once with --diag nograin (/tmp/v/r28/glow_nograin.png).
- Three versions, the third is kept:
  1. new = kept + own share x (second run - first run). Film: 3465 dark sky +0.006 (kept -0.083).
  2. the same, and in the calm far sky (where the first run gives the kept picture back on the mean of a 41 px
     box within half a level) the second run as it is, so stars at the limit of the split carry no grain.
     Same film number; the files get smaller.
  3. the same, and the mean of the change over a Gaussian of 16 px is taken out again (weighted by the sky's
     own share), so the level of the kept picture stays. Versions 1 and 2 had a level difference of 0.24 to
     0.36 of a level rms at 6 px in the far sky and -0.14, -0.09, -0.09 near the body; version 3 has 0.12 and
     -0.04.
- Numbers of version 3. Files: full 2157496 bytes (was 2258846), web 713644 (was 739504): 127210 bytes less.
  Picture against the grain of 3465 in the hero's own sky 0.001, level 16.24 (16.26). Film, draft, --diag
  nograin, sky_builder's graincorr.py: 3464 dark sky -0.001, whole -0.000, blocks -0.011 to +0.011; 3465
  +0.006, +0.001, -0.012 to +0.009; 3466 -0.001, -0.000, -0.008 to +0.011. The kept picture at 3465: -0.083,
  -0.016, -0.076 to +0.006. By region at 3465 (/tmp/v/r28/corrmap.py): calm far sky -0.002 (kept -0.150), own
  sky where the first run does not give the kept picture back +0.030 (kept -0.188), mixed +0.054 (kept
  -0.109), no share of the picture +0.003 (the same in both). So near the body the cure takes out a little
  more than the kept picture carried: my glow of today is not the first glow there.
- 3465 at final against the kept still (/tmp/v/r28/holdcmp.py, kept_final_3465.png is main's build): far dark
  sky changed 0.856 of the pixels, mean -0.022, -0.020, -0.040, mean difference 0.839, 99.9th percentile 5,
  largest 21, 20 pixels over 8 levels; own sky nearer the body mean -0.04, 0.902 changed, largest 12; body,
  rings and moon 0.0045 changed, all by 1 level (ruling (a)). Against the approved hero: plain 5.526, blurred
  2.239; the kept still 5.502, 2.234.
- The 20 pixels over 8 levels are faint points at the limit of the star split (peaks of about 20 of 255 in
  blue) that fell on the other side of it. Stars over 40 levels in the far dark sky of the picture: hero
  4890, kept 5100, new 4950.
- Left in: faint bands along the body where the film's glow crosses the hero's sky in one colour (the cut at
  black, which the grain had lifted): 99th percentile of the difference blurred over 6 px 0.42 of a level near
  the body, 0.38 in the far sky.
- RECIPE.md: two lines added to the sky-hold section (the glow input is taken with --diag nograin; checks).

## 2026-11-24, 02:28 VM: mail 466

- a359a4b7: the byte proof is whole and clean (115 drafts, 11 differ, all inside Saturn's segments; 3465 at
  final is the kept still; G11, G15 pass; tsc clean; vitest 37 files 302). The dive's handover report: sides
  at T 0, flow gap 0.016 px, pose gap 0. Measures and smooth still out. The take onto main runs as a base; no
  round starts on it.
- Point 3 accepted (the patch leaves by distance from the hold's path, the lift is one function of height).
  Points 4 and 6 (the sky at 3720: orange clusters left, near black right, where the approved image has an
  even field of faint blue white stars) are cured through the stop's look of the engine's sky with
  sky_builder, not with a pasted patch. Not mine to touch.
- Owed, in this order: ruling (a) with the sky-hold cure, then (d), then steps 2, 3 and 5.
- handover_engineer's finding: on Saturn the place is on the rings and the eye never comes nearer than 3.3
  radii over the body, so the path measure's ground points lie on the body's sphere, not on the ring plane; the
  judge is corrected before a set is searched for Saturn. "Until then do not tune the path to the report's
  speed lines."
- After the take: 60 frames a second clips of the dive and the rise are rendered and shown.

## 2026-11-24, 02:32 to 02:50 VM: ruling (a) and the sky cure pushed (3e9ee2f), main 3efc31d merged (6426068)

- ae772cb (work), 3e9ee2f (merge of main f2375d2), reported to the Builder 02:47 VM with five pictures. Checks
  on 3e9ee2f: tsc exit 0; vitest 36 files, 286 tests; smooth path green ("VERDICT: green. No number is over its
  limit."); handover path "saturn.dive every frame: pass", "saturn.rise every frame: pass"; "PASS G11  every
  asset has a row or a recipe", "PASS G15  at most 2 sets per frame; finished stops: saturn/web 274 MB,
  saturn/full 747 MB". Net size of the three folders against main f2375d2: minus 2.105 MB (74.716 against
  76.821, decimal MB as the Builder counts).
- Frames outside my segments change with ruling (a), because the kept set draws the globe there too (drafts,
  a359a4b in /home/user/workspace/mainref against the working tree): 3360 globe only (largest 12), 3380 globe
  (largest 43) and the sky inside the footprint of the hold's picture (largest 16, the cure), 3890 and 3900
  globe only (largest 102, 91). a359a4b equals main 4f2127a byte for byte at those four frames. Said in the
  report (looks: "ruling a and sky cure: a359a4b against now").
- 3716 to 3725 at draft, the globe at full size: storms and spots ride with the map, nothing slides against it;
  the slide of the streaks is under 0.12 px a frame there (0.2 degrees a second on a globe of about 1000 px).
- sky_builder asked three things (mail 467 of the Builder: the dip of the engine's sky on the rise and the sky
  look at 3720); answered 02:36 VM: sky_e1, sky_e2 are draft frames 3867 to 3884 of a359a4b, the level per
  frame (shot.skyStars) is one function of the height in my plan, the measure that dipped is the mean luma of
  the sky inside the eroded sky mask, the reference at 3720 is the approved close (the sky both share, the box
  x 0 to 900, y 0 to 330, the top left 960 by 540). It sends the exact lines for the stop's look of the sky.
- NOTE 482: main is 3efc31d: Saturn's folders are a359a4b there, and npm run smooth has all parts (path,
  pictures, place, parity, counts). A READY for a round carries its last lines whole. The merge of 3efc31d had
  two conflicts (globe.ts, this notebook), because main took a359a4b as a copy and not as a merge; resolved with
  my side, after checking that main's three folders equal a359a4b and that my folders equal 3e9ee2f after it.
- parity (tools/smooth.ts): the same film frame at uhd scaled down by 2 against the master, draft tier, at
  shares 0.25, 0.5, 0.75 of the dive and of the rise and 0.5 of the surface view; limits in config smooth.parity
  (maxMean 12, maxCoarse 3.2, maxBlockLevel 12, maxLevel 2.2). It is the judge of ruling (d).

## 2026-11-24, 02:40 VM on: ruling (d) with mail 385

Built in the working tree on 6426068:
- grains.ts: every grain is a square of two triangles that faces the lens (InstancedBufferGeometry: four
  corners, index 0 1 2, 2 1 3; per instance aPlace and aGrain; Mesh, DoubleSide, renderOrder 7), at the depth of
  the middle of the grain. No point is drawn any more, so nothing in the picture depends on the card's limit of
  the point size; grains.json largestPoint is gone. The square is 2 radius + way + 3 px wide with no upper
  limit; the triangles are clipped by the frame, so the trick that drew a point from the edge of the frame is
  gone too. The pixel inside the grain is a smooth varying (vAt, pixels from the middle); every flat varying
  has the same value at all four corners, so no rule about the first or last corner of a triangle is in it.
- The limits of the look written in pixels are shares of the height of the frame: grains.json frame (1080);
  ice.ts pixelScale(height) = height / frame; levels.pixels (uGrainLevel zw, and the reach on the CPU),
  levels.largest (uGrainLook xy), lobes.pixels (uGrainShape2 xy) are multiplied by it for each frame. Left in
  pixels because they are the pixel itself: the 3 px pad of the square, the half pixel soft edge of a ball, the
  footprint of the pixel on the sheet.
- Counts of grains by frame at the master (out/scratch/count.ts): 3640 104, 3680 473, 3720 711, 3760 2445,
  3780 18444, 3800 40272, 3820 32245, 3840 201. So four corners a grain cost nothing that matters.

## 2026-11-24, 02:52 VM: MAIL 483 (the Builder's machines on a359a4b as it stands on main, proof aac2e8dd)

A. Measure: "PASS G13 saturn: 0 of 495 frames over 0.02 soft. PASS G5 (3465, 3567, 3720, 3866 invalid 0). FAIL
G17 saturn: 3465 median 1.055 p25 0.919 over 71 tiles; 3720 median 0.685 p25 0.325 over 62 tiles." "A red
measure is a severe issue in the round, so 3720's fine detail belongs on your list with a plan: say which tiles
lose (the near ring, the globe's bands, the far ring) and what would carry the approved image's detail there."
B. The whole smooth report: VERDICT red, 6 numbers.
1. Path green on the dive and on the rise, whole frames and rate 2 (largest step 0.066).
2. Pictures, dive: level step 0.02, pop 1.09: green. Change in place 20.7 from 3594 + 1/2 (limit 20, 9 frames
over it, first 3593, most at pixel 1844, 980). Provisional, not in force; the judged number will be the pattern
number. "Look at saturn-dive-changes.png all the same and tell me what it is."
3. Pictures, rise: pop 1.43 from 3895 + 1/2 to the next, limit 1.2, 8 frames over it, first 3815 + 1/2. "what
is left without the motion sits on the outer rim of the rings and along the ringlets: the rim sparkles from
frame to frame. 3892 to 3896 lie in the leg after your rise, but the picture there is your globe and rings as
the kept set draws them, and the first frame over the limit is 3815 + 1/2, inside your rise. This one is in
force." Change in place 29.0 from 3824 (28 frames over it, first 3821, most at pixel 1300, 904: the globe's
lower edge where it meets the ring; provisional).
4. Parity: mean at one 8th of the size 3.703 at 3563 (limit 3.2); one block minus 22.068 at 3720 (limit 12;
3563 minus 13.567, 3720 minus 22.068, 3829 minus 14.956); whole frame level minus 2.184 at 3563 (limit 2.2).
"at 3563 and 3585, where the rings are far, the whole lit ring differs along its ringlets, and the 4K picture
is the smoother and paler one. So the ring's radial pattern is not filtered by its footprint in the same way at
both sizes (the master shows more contrast than the 4K picture scaled down). Brandon captures at 4K, so what is
judged must be what the 4K picture shows. Your (d) cures the points; find the cause for the ringlets as well
(the footprint in pixels, a fixed mip bias, a sample count per pixel, or noise in pixel units) and name the
file. If it lies in the engine's ring and not in your folder, say so and I pass it to its owner."
5. Counts: not measured, main has no counter yet. Not mine.
C. 3e9ee2f8 received, (a) reads right; the frames outside my segments are allowed to change by it. "I hold its
proof until (d) is in, so that one proof covers both and the parity part can be read on the same commit: send me
ONE head merged with main (now 7e7fb89, same tree as 3efc31d but for kit/PROGRESS.md) with (a), the sky cure and
(d), with npm run smooth -- --stop saturn run whole on your side (every part; the counts part will stay
unmeasured until the profiler's take, say so) and its red lines listed. If (d) takes longer than 90 minutes,
tell me and I prove 3e9ee2f8 alone."
D. "For the round: a commit is named for the round when A, B.3 and B.4 are green or carry your plain word that
they are not, with the plan. The base stays a base."
Attachments in /home/user/.perplexity/attachments/69fc139468fb430699c3af6cbe96894b/ (smooth-saturn-aac2e8dd.md
and .json, saturn-dive-pops.png, saturn-dive-changes.png, saturn-rise-pops.png, saturn-rise-changes.png,
saturn-parity.png, measure-saturn-aac2e8dd.json, sat3-13-tail.txt). Clock: (d) is due by about 04:20 VM.

## 03:16 VM: (d) measured, the parity of the ringlets cured, the dashed line outside the rim found and cured

State: working tree on 6426068 (local merge of main 3efc31d on the pushed 3e9ee2f), nothing of this committed
yet. Main is now 274f4c9 (NOTE 491), to be merged before the commit.

NOTE 491 (03:16 UTC, to every stop builder), changes NOTE 482: "do not wait for your own whole npm run smooth
before you name a commit. Name it as soon as, on your own tree merged with newest main, the path part is green
or its red lines are listed, the handover report passes with the place picture off, and G13, G5, G17, G11 and
G15 are read. The whole smooth report then runs on my machines ... On your own renderer run only the kinds and
parts you are changing (--only pictures --kind dive and the like)." A whole smooth run here would take about
2.6 hours (228 + 198 draft frames at rate 2 and 14 parity stills), so it is not run here.

(d) as built (mail 374 d and mail 385): every grain of every level is a square of two triangles, instanced
(grains.ts Grains.mesh); no gl.POINTS is left in src/stops/saturn. The limits of a grain in pixels are angles:
pixelScale(height) = height / grains.frame (grains.json frame 1080). grains.json largestPoint is 0 and stays
as a key because tests/capture-tool.test.ts reads it. Measured at 3800, master, points against squares: 21139
pixels differ, largest 27 levels, mean 0.00637. Counts drawn at master: 3720 711, 3780 18444, 3800 40272,
3820 32245. Parity at 3800 (uhd scaled down against master; mean, level, coarse, worst block): points 11.120,
-7.471, 8.047, -46.281; squares 2.388, -0.735, 0.980, -6.267.

Cause of the ringlet parity (mail 483 B.4): src/stops/saturn/kept/rings.ts, the weight of the hero's polar
ring map and inner ring map against the profile function. It was measured in texels of the map per pixel of
the drawn format (look.polarDensity [1.0, 1.3]), so at 3840 by 2160 the map gave way to the function at twice
the distance and the far ring was the smoother, paler function there while the master still showed the map.
The same pixel units sat in the sparkle (show by major axis over cell), the glint offset, the grain cells of
the kept ring, the globe's edge width, fine detail and night blur, the moon's edge width, the model's globe
and moon, and the sand layers of ice.ts. Cure: one scale "foot" = format height / grains.frame carried to all
of them (uniform uFoot in kept/rings.ts: x foot, y and z foot times texels of the full set per loaded texel
for the two maps, so the web set and the full set agree as well). At 1080 the bytes do not change (cmp equal
at 3465, 3563, 3720, 3829, draft).
Parity before (with (d) only), then after the cure, by my tool /tmp/v/parity.py (same maths as
tools/img/smooth.py; it gives the Builder's 3563 row): mean, level, coarse, worst block, detail:
  3465: 5.655 -1.636 2.992 -11.798 1.027  then  1.702 -0.638 0.738 -3.871 1.094
  3563: 6.423 -2.192 3.709 -13.572 1.047  then  2.104 -1.120 1.196 -4.338 1.133
  3585: 4.771 -2.012 2.783 -10.599 1.047  then  2.219 -1.188 1.384 -8.289 1.208
  3720: 2.680 -0.933 1.132 -5.462 0.894   then  2.645 -0.982 1.100 -6.295 0.900
  3829: 2.726 -0.753 1.109 -6.984 0.969   then  2.706 -0.823 1.093 -7.846 0.971
Limits: mean 12, coarse 3.2, block 12, level 2.2. 3608, 3848, 3866 not rendered here.
What is left is the engine's, not in my folder: the glow beside the bright limb reaches half as far in
pixels of the master at uhd (src/post/chain.ts: the bloom pyramid has a fixed count of halvings from the
drawn size; 3829, row 540, x 860 to 956: master 25.9 to 144.5, uhd 19.4 to 143.7), the stars of the engine's
sky (src/space/sky.ts, blocks minus 2 to minus 4 at 3563) and the film grain (detail ratio over 1).

The dashed line (mail 483 B.3, the rim that sparkles): a line of tan dashes, level about 40, one pixel wide,
outside the faint F ring line along the lower left of the ring, in the kept set's picture: in the hold (3465),
in the dive (3563) and after the rise (3891 to 3896), at both sizes. Test: with look.arc's gain at 0 the dashes
go; with sparkle 0 or the polar map off they stay. Cause: src/stops/saturn/kept/rings.ts, the arc term (the
thin line outside the outer edge, drawn from the profile's F ring through look.arc). Its footprint was the
frame to frame derivative of the bent radius rq, and rq jumps at the reach of the profile (r 2.5), because the
hero's shape is taken off only inside the reach. On the pixel pairs that lie across that jump the derivative
was huge, the arc read the coarsest levels of the profile (whose last texels hold the mean of the outer ring)
and drew a dash; which pixels draw it depends on how the jump falls on the 2 by 2 pixel blocks, so the dashes
move from frame to frame: sparkle. Cure in my folder: the arc's footprint is at most skim.json
handover.kept.seam (2) times the footprint of the true radius of the plane, and the arc draws only inside the
span of the profile. Measured at draft, master, before against after: 3563 4211 pixels differ (258 by more
than 20 levels), 3465 5391 (338), all on that one arc; nothing else in either frame changes
(/tmp/v/r29/seam_crops.png, seam_diffs_small.png).

G17 at 3720 by tiles (12 by 8, final still of 3e9ee2f, median 0.691, p25 0.326, gate asks median 0.8):
  near ring left of the division (columns 0 to 2, rows 4 to 7, and 2,3): 13 tiles, all under 0.45, median 0.13
  inner border of the division and the B ring's edge: 7 tiles under 0.8, median 0.41
  far ring across the globe's lower edge (6,3 6,4 7,4 8,4): 4 tiles, median 0.43
  right edge of row 5 (9,5 10,5 11,5: 0.44, 0.04, 0.02): the approved shows ring there, the film the globe's
  night side: a difference of layout, not of detail
  sky: 6 of 10 kept tiles under 0.8 (0.18 to 0.78): stars of the engine's sky, sky_builder's look for the stop
With the 13 near tiles at 1 the median would be 1.0 (p25 0.645). The approved has there hairline dark gaps,
a speckle of sand and a mix of grey, pink and tan at 3 to 12 px; the film has soft pale bands. Picture:
/tmp/v/r29/g17_tiles_3720.png, g17_left_3720.png. The plan: step 2 (ringlets, sand and grains resolving by
footprint) with the function's fine octaves as narrow dark gaps in the A ring and the sand as a speckle that
is in the picture at 3 to 12 px, and the same crispness for the far ring across the globe.

## 03:30 VM: head 010d5ee pushed ((a), sky cure, (d), parity cure, dashed line cure, merge of main b2ebc62)

- Commit 081c441 holds (d) (mail 374 d, mail 385), the footprint scale (parity) and the seam cure of the arc.
  Merge 010d5eece98181c153aca730c208705b8759fc69 of main b2ebc62 (the engine's one air d179, the retreat's light
  law d178, counters and warm start d176, d177): no conflict, nothing of main's touches my folders. Pushed.
- On the merge: tsc exit 0; vitest 39 files, 322 tests pass; handover --only path: "saturn.dive every frame:
  pass", "saturn.rise every frame: pass"; smooth --only path: "VERDICT: green. No number is over its limit."
- Size (decimal MB, git ls-tree -r -l, my three folders): head 74.734 (179 files), main b2ebc62 74.821 (178
  files): net minus 0.087 MB.
- The hold at final with the seam cure (/tmp/v/r29/sf_3465.png) against the final of 3e9ee2f
  (/tmp/v/r28/v3_final_3465.png): 2768 pixels differ, largest 10 levels, 613 by more than 2, all in the box
  2,482 to 767,1079 (the arc of the dashes). Against the approved hero: plain 5.525, blurred 2.239 (3e9ee2f
  5.526, 2.239; the kept still 5.502, 2.234).
- The frames after the rise (3894, 3895, 3896 at draft) are byte equal before and after all of this, and they
  are drawn by the model (no arc term): so the dashed line was never in the rows 3891 + 1/2 to 3896 of the
  pop measure. It was in the hold and in the dive up to the change of scene.
- The path table of the smooth report shows what those rows are: my rise ends at 3884 at speed 0.031 of the
  mean, the travel leg stands almost still from 3885 to 3888 (0.009, 0.006) and then picks up from 3889:
  0.026, 0.071, 0.165, 0.329, 0.588, 0.963, 1.472, 2.126 at 3896 (steps 0.094 to 0.654, starred, in the
  neighbour and not judged). The measure of 3888 has 0.42 left with 0.11 px of motion, of 3895 + 1/2 1.55 with
  7.1 px; the pop is that over the median of 8 frames to either side (0.93), which spans the standstill.
  What is left sits on the stars beside the rim and the limb (the measured motion follows the body there, the
  stars move otherwise) and in lines along the ringlets. My own pair 3895 to 3896 (whole frame, draft): left
  1.869, carried 1.276, motion 14.1 px.
- The tool still floors a fractional frame number (3895.5 gives 3895's bytes), so half frames need seq.

## 03:32 to 03:50 VM: main 6884e80 merged (7825f77), note 501, why 3720 loses fine detail, the pop at 3815

- Job M: the pair 3895, 3896 at final: left 1.969, carried 1.323, motion 13.92 px (draft 1.869, 1.276,
  14.10): the same at both tiers, so the end rows are not a matter of the draft tier.
- Drafts 3813 to 3818, what is left of each pair after the motion is taken out (my tool, a quarter size):
  3813 3.356, 3814 3.424, 3815 3.766, 3816 3.586, 3817 3.269, motion 4.87, 5.25, 6.36, 7.81, 8.77 px. By
  blocks (16 by 9) it sits in the near sheet at lower left (7 to 12 levels) and patchy on the globe's streaks
  at upper right (1 to 4.4). Full size crops of the lower left (/tmp/v/r29/pop3815_crops.png): nothing comes
  in or snaps, the ringlets soften from 3814 to 3817 as the lens picks up speed (the slide of the lens during
  one take filters them, ice.json sweep 1). The lens: flat move a frame 6.2e-3 radii at 3809, 3.0e-3 at 3814,
  3.7e-3 at 3816, 9.1e-3 at 3820; the height turns from falling 1.2e-3 a frame to rising 3.7e-3 at 3816.
  So the pop at 3815 + 1/2 is the corner of my own pace at the start of the rise, the same place as the red
  speed line below (3814 to 3816). Its cure is the pace, not a picture.
- Main moved to 6884e80 (the globe's options d180, the corners of the pace and the law tool d181, the judge
  of the smooth report renewed d182, the retreat's turn d183). Merged: 7825f77, no conflict. On the merge: tsc
  exit 0; vitest 41 files, 370 tests pass; handover --only path: "saturn.dive every frame: pass",
  "saturn.rise every frame: pass". smooth --only path with the renewed judge (the speed is now a mean over 8
  ground points round the place, on the ring plane where the globe does not hide it, as mail 466 said it would
  be corrected): "smooth saturn: red, 11 over the limit or not measured":
  dive, whole frames: speed changes by 0.089 of the mean (over 6 points) in 5 steps from 3618 to 3622, most at
  3621, limit 0.08; climbs again by 0.045 after its largest value (3589), up to 3629, limit 0.03. Rate 2: 0.089
  in 10 steps from 3617 + 1/2 to 3622; climbs again by 0.051 up to 3629 + 1/2.
  rise, whole frames: 0.085 in 2 steps from 3815 to 3816; 0.099 in 14 steps from 3870 to 3883, most at 3877;
  falls by 0.090 before its largest value (3864), lowest at 3834. Rate 2: 0.086 in 5 steps from 3814 to 3816;
  0.085 in 2 steps at 3862 to 3862 + 1/2; 0.100 in 29 steps from 3869 + 1/2 to 3883 + 1/2; falls by 0.100,
  lowest at 3836 + 1/2. Rate and turn are inside their limits in both moves. On b2ebc62 with the old judge the
  same path was green. Mail 466 held the path back until the judge was corrected; it now is, so these lines
  are mine: the pace of my own path (plan.ts Pace, skim.json) at four corners.
- NOTE 501 (03:38 UTC, to every stop builder): the same film frame at uhd is not the same picture as at 16 by
  9 because fades read texels a pixel of the format. Ruling: the measure is an angle (a 1080th of the frame
  height); one factor, buffer height over 1080, into every density that a fade reads and into nothing that
  only picks a mip. The same for every number counted in pixels that can be seen. Proof by the builder: (a)
  hashes of the own draft frames at 16 by 9 equal before and after; (b) npm run smooth -- --stop ID --only
  parity (seven frames; limits mean 12, coarse mean 3.2, one block 12, frame level 2.2). saturn_coder: check
  the place code for the same kind of term and say what was found.
  What I found: 081c441 already carries the factor (ice.ts pixelScale, format height over grains.json frame)
  through the kept set and the model: the weights of the polar and inner ring maps (the cause of mail 483
  B.4), sparkle, glint, grain cells, edge widths of globe and moon, fine detail and night blur of the globe,
  sand layers, grain limits. One term was left: ringfine.json near.wide (a ringlet from 2.5 to 7.5 footprints
  wide on screen is drawn stronger, from 12 to 36 it loses hue and its bright side), counted in pixels of the
  format. Cure: the pixel part of that footprint is the pixel of the look's frame (field.ts uRfFoot,
  ringLookPixel; sheet.ts and grains.ts pass it as fpl); the part from the slide of the lens during a take is
  the same in every format and stays. Checked: 3720 and 3829 at 1080 draft byte equal before and after; 3829
  at uhd changes in 120792 pixels, largest 11; parity of 3829 (mean, level, coarse, block) 2.706 -0.823 1.093
  -7.846 before, 2.700 -0.819 1.089 -7.846 after; 3720 at uhd does not change at all (see the next point).
  Terms that stay by pixel because they are the band limit of the format (an octave is drawn where it is
  wider than a pixel and counts by its mean where it is not): the ladder's seen, the edge and line filters
  (area true), the sand's size pick, the globe's band octaves (skim.json globeFine.pixels).
  Left in the parity panels after that: one arc of blocks where the uhd picture is darker by 2 to 6 levels
  (the worst block is 7,4 at 3720 and at 3829), along the bright limb and the ring edge: reads as the glow of
  the engine's bloom (a fixed count of halvings, so half as wide at uhd). Not found in my folder.
- Why 3720 loses its fine detail (G17, mail 483 A), measured on the path (out/scratch/slide.ts): in the skim
  the lens flies along its own view, and the view is within 22 degrees of the radius: at 3720 it moves 9.2e-3
  radii a frame along the plane, 8.5e-3 of that straight across the ringlets (foot radius 3.55 at 3630, 2.59
  at 3720, 1.98 at 3809), and sinks 1.7e-3. With the film's shutter of half a frame every point of the sheet
  slides 4.3e-3 radii across the ringlets while the shutter is open, in every take set. At the bottom edge a
  pixel is about 1e-3 radii, mid frame 7e-3: so every ringlet from 1.3 to about 6 px wide in the lower third
  is smeared by the shutter (4.6 px of blur at the bottom edge, 0.6 px mid frame). That is why the uhd draft
  of 3720 did not change with near.wide: no octave of the ladder under 0.006 radii is drawn at all there (the
  draft filters with the whole slide, the final tier adds its 16 takes to the same smear). The approved close
  is a still: hairlines of 2 to 6 px all over the lower left. G17's band is 3 to 12 px, so the near tiles
  lose by the shutter first, whatever the model holds. Not yet measured: the same final still with the shutter
  closed (the engine has no switch for a still; it would need config.shutterFraction in a scratch tree).

## 03:50 to 04:20 VM: NOTE 504, the head 9467fee, the gate, the parity, mail 483 B.2 by calculation

- NOTE 504 (03:51 UTC): the factor is not to be taken from view.format in a pass that draws a place picture
  (that pass has its own buffer); code that multiplies its density by uFine needs the format's factor alone.
  The shared helper is src/core/frame.ts (frameUniform, setPass, bufferFrame), in proof on agent/engine-globe,
  not on main yet. Ruling: use the helper; a cure already written with its own uniform stays and swaps its
  source when the Builder says the helper is on main (no byte changes then, no new proof beyond the hashes).
  Saturn has no place picture (plan F), so only that last sentence matters here: my factor is
  pixelScale(view.format.height) (ice.ts), to be swapped to the helper on the Builder's word.
- Main moved to 4fb3788 (Mercury's base, d184). Merged: 9467fee9857f4fdcfdf1d1e63b8f990694e6bf21, no
  conflict, pushed 03:50. On the merge: tsc exit 0; vitest 41 files, 370 tests pass; handover --only path:
  "saturn.dive every frame: pass", "saturn.rise every frame: pass"; smooth --only path: the same 11 red speed
  lines as on 7825f77, word for word (the section above).
- The gate on 9467fee (worktree mainref): "PASS G11  every asset has a row or a recipe", "PASS G15  at most 2
  sets per frame; finished stops: saturn/web 274 MB, saturn/full 747 MB".
- npm run smooth -- --stop saturn --only parity on 9467fee (seven frames, draft, 16 by 9 against uhd):
  "smooth saturn: green". Largest mean difference 3.024 at 3866 (limit 12); at one 8th of the size 1.767 at
  3866 (limit 3.2); one block -9.127 at 3866, block 5,2 (limit 12); whole frame -1.685 at 3866 (limit 2.2).
  The rows (mean, level, coarse mean, block level, block): 3563 2.090 -1.107 1.185 -4.265 7,1; 3585 2.217
  -1.195 1.384 -8.382 6,2; 3608 2.226 -0.881 1.017 -5.723 7,4; 3720 2.663 -1.100 1.178 -6.286 7,4; 3829 2.709
  -0.835 1.097 -7.847 7,4; 3848 2.444 -1.080 1.177 -7.657 5,5; 3866 3.024 -1.685 1.767 -9.127 5,2. Picture:
  /tmp/v/r29/parity_official_9467fee.png. What is left in the panels: the stars (finer at uhd), fine lines
  along the ringlets, a glow along the limb and the ring edge.
- Size of my three folders at 9467fee: 74.744 MB in 179 files, main 74.821 MB in 178 files: net minus 0.077
  MB (git ls-tree -r -l over src/stops/saturn, assets-src/saturn, public/assets/saturn).
- The smear of the shutter at 3720, measured on the path (out/scratch/smear.ts; vfov 48, shutter 0.5),
  replaces the estimate in the section above (4.6 px at the bottom edge, 0.6 px mid frame). How far a point
  of the sheet slides across the ringlets while the shutter is open, in pixels of the 1080 frame: at x 240:
  7.6 at the bottom edge, 5.2 at y 900, 3.8 at y 760, 2.9 at y 640; at x 960: 3.7, 1.9, 0.9, 0.3; at x 1680:
  2.1 at the bottom, 0.3 at y 760. 3660 and 3780 are nearly the same. So the lower left third, where the
  approved close holds its hairlines of 2 to 6 px and where G17 loses 13 tiles, is smeared by 3 to 8 px.
- Mail 483 B.2, by calculation on the path (out/scratch/b2.ts), not yet looked at on my own carried frames:
  Dive, pixel (1844, 980) at 3594 + 1/2: the ring plane at radius 1.954 (the outer edge of the B ring at the
  Cassini division), 3.17 radii from the lens. From 3594 + 1/2 to 3602 + 1/2 the lens sinks from height 1.218
  to 0.981, the share of takes of the model goes from 0 to 0.464, the far look at that point stays 1.000 (it
  lies farther than handover.kept.reach 1.3) and close stays 0. So it is NOT the near light coming in (what I
  first thought). What changes there in those frames: the kept set's layout goes from the hero's to the plain
  profile by pose (done at height about 1.05), and from height 1.03 the kept set gives way to the model. The
  next row of the judge's sheet (3602 + 1/2 to 3610 + 1/2, change 20.1): height 0.981 to 0.789, share of the
  model 0.464 to 1, far look by height 1 to 0.685, close 0 to 0.266; at the pixel (radius 2.027, the outer
  border of the division, 2.69 radii away) the far look by distance stays 1.000. Both rows sit on the borders
  of the Cassini division: an edge between bright and dark that lies at a slightly different place in the two
  tables shows as a change in place. That is mail 439 point 5, my step 2 (the same radius in both tables).
  Rise, pixel (1300, 904) at 3824: the ring plane at radius 1.296 (the C ring), 0.83 radii from the lens, with
  the globe behind it at 1.19. From 3824 to 3832 the lens climbs from height 0.343 to 0.532; close stays 1,
  closeGlobe is 0 (light.globeNear is 0, so the globe's settings do not slide: my first reading was wrong);
  the far look at that ring point goes from 0.381 to 0.861 as its distance grows from 0.830 to 1.084 radii
  (handover.kept.reach 0.6 to 1.3). So this one is the near light of the sheet giving way to the far look by
  distance, on the thin inner ring in front of the globe: a tone that slides through the frame. Step 2 as
  ruled in mail 374 (one look of the ring per pixel, the near light in the mean equal to the far tone).

## 04:08 to 04:50 VM: mails 508 and 511, main merged twice, 3720 with the shutter closed, the pace cured

- MAIL 508 (03:58 UTC, the timetable): the first NAMED commit is due by 07:00 UTC, one commit on my branch on
  top of the newest origin/main that can be merged (7a6f888 or later); its mail starts with the word NAMED and
  the full sha. With no NAMED mail at the hour the newest head that builds and passes its tests is taken as it
  stands, so push whole states. NAMED means the build I would show a critic today: (a) dive and rise each one
  move by my own path with my own lines of npm run smooth -- --stop saturn --only path; (b) nothing by the
  clock, the place picture off in both moves; (c) note 501, nothing by the pixel; (d) the judged hold and
  surface view at the final tier beside the kept stills, equal bytes or the pair with one line on what changed
  and why; (e) the net size of my three folders against main. The mail carries, in this order: my smooth lines
  (path, pictures, parity), the frames that change outside my dive and rise, my list of what is still wrong,
  worst first. Reds do not hold the mail back; a hidden red costs a round. After NAMED the Builder cuts the
  proof tree and runs the take check and the whole report (about 45 minutes); red means a second commit within
  90 minutes. ONE commit or ONE head in earlier mails means the named commit.
- MAIL 511: main at f5a51b3 (d187): the judge reads a rebound over ring points as a valley on one set of points
  (my rise then read fall 0.127 over 5 points at whole frames, 0.136 at rate 2); parity gets two more rows a
  stop (the hold at its middle, the leg that leaves the stop at its middle), same four limits; src/core/frame.ts
  is not on main yet, keep my own factor until the Builder writes that it is, then swap in a commit with
  nothing else; G17 at 3720 stays the open measure, the NAMED mail with the cause by tiles is the place.
- globe_engineer (04:16): the frame factor is on agent/engine-globe dace4ba6, not on main: frameUniform (format
  height over the master's) and bufferFrame() for a place picture; do not take the factor from view.format in
  a place picture. Saturn draws no place picture, so only the swap of the source is left, on the Builder's word.
- Main merged twice, no conflict: 26677ed (the timetable, d186) as ceafef8 and f5a51b3 (d187) as a4dec17.
- Job Q on 9467fee (worktree): "PASS G5 saturn: 3465 hold invalid 0 coverage 0.514; 3567 dive invalid 0
  coverage 0.525; 3720 terrain invalid 0 coverage 0.725; 3866 rise invalid 0 coverage 0.428"; "FAIL G17 saturn:
  3465 median 1.055 p25 0.919 over 71 tiles; 3720 median 0.685 p25 0.325 over 62 tiles"; "PASS G13 saturn: 0 of
  83 frames over 0.02 soft (every 6th frame); worst frame 3390 0.00%, frame 3396 0.00%, frame 3402 0.00%".
- 3720 with the shutter closed (job R, scratch tree only, config film.shutterDegrees 1.8 in place of 180, never
  committed): final tier, no grain, 16 takes, 108.9 s. tools/measure/g17.py against the approved close: median
  1.131, p25 0.541 over 62 tiles; the measure's own final of the same commit with the film's shutter: median
  0.685, p25 0.325. So the fine detail of the model is there and passes; what G17 loses at 3720 is the smear of
  the film's shutter at the pace of the skim (the table of the section before: 3 to 8 px across the ringlets in
  the lower left third). The worst tiles left with the shutter closed: 11,5 (0.014) and 10,5 (0.041) at the
  right edge (layout: the approved has ring there, mine the globe's shadow side), 5,1 (0.162), 8,4 (0.172),
  7,4 (0.194). Picture in the looks: /tmp/v/r30/shutter_3720.png (film shutter, closed shutter, approved; the
  lower left quarter of each at full size). Mail 311 forbids slowing or bending the path against blur and a
  blur cure of my own, so this needs the Builder's ruling (judge G17 on a still with the shutter closed, or
  take the red as the price of the film's shutter).
- The pace against the renewed judge (f5a51b3). My scratch judge (out/scratch/sm.ts) reads the tool's numbers
  to three places. The search (out/scratch/opt7.ts: a soft largest value over every step near the limit, both
  rebounds and the handover's rate rule, minimised by a diagonal evolution strategy; about 35 paths a second):
  - Dive: green as found before the merge: largest step 0.066 (rate), 0.067 (turn, speed) of the mean, climb
    after the top 0.006; cost 0.832 of the limits.
  - Rise with the change of view at 3860 (rise.at 0.667): no path of this family under 1.016. Why: the
    handover's rate rule (no frame over 2 times the mean rate from the change of view to the last frame) makes
    the rate stay at its top until 3860 and fall inside 24 frames; the speed of the picture at the place falls
    with it (1.22 times the rate's slope, because the lens also narrows its field from 48 to 30 degrees while
    it still turns: at 3862 the turn alone moves the picture 15.8 px a frame, the lens's own move 14.0), and
    the way up cannot be steeper than 0.08 either. All three sit on their limits at once.
  - The change of view is a number of mine (skim.json handover.rise.at; the engine's own default is 0.4). With
    rise.at 0.56 (the change at 3852 + 1/4) the rate may begin to fall at 3855: cost 0.933. Rate: step 0.072,
    top 1.746 of the mean from 3842 to 3855; turn: step 0.070, top 1.86 at 3842; speed: step 0.074 (0.075 at
    rate 2), tops 1.289 at 3829 and 1.553 at 3859, not measured 3838 to 3853 (under 5 ring points); no fall
    before a top and no climb after one; the handover's rule: fastest frame 1.84 times the mean (limit 2).
  - Where the place is: below the frame for most of the rise (spot y 1184 at 3808, 1474 at 3832, 1092 at 3862,
    852 at 3884), so the judge's ring sits at the bottom edge of the picture (out/scratch/spot.ts).
  - In skim.json now: dive reach peak [0.262, 0.688] round [0.03, 0.112, 0.189, 0.073]; climb [0.663, 0.663],
    [0.089, 0.085, 0.215, 0.084]; round [0.539, 0.645], [0.06, 0.332, 0.234, 0.03]; view [0.432, 0.444], [0.069,
    0.191, 0.053, 0.03]. Rise at 0.56: reach [0.424, 0.592], [0.038, 0.073, 0.048, 0.058]; climb 0.244, [0.03,
    0.118, 0.03]; round 0.495, [0.397, 0.104, 0.03]; view 0.411, [0.031, 0.092, 0.03].
  - On the working tree (a4dec17 plus these numbers): tsc exit 0; vitest 41 files, 374 tests pass; handover
    --only path: "saturn.dive every frame: pass", "saturn.rise every frame: pass"; smooth --only path: "smooth
    saturn: green".

## 04:25 to 04:35 VM: what the moved change of view does to the picture, the pace committed, main d38353f merged

- Job S (scratch tree, draft tier, frames 3848 to 3862, the same paces, rise.at 0.56 against 0.667): 3848 to
  3852, 3861 and 3862 are the same bytes; 3853 to 3860 differ in 1266 to 2340 pixels of the frame, at most 14
  levels, mean 0.0002 to 0.0005 levels: single scattered pixels, stars at the upper left and the edge of the
  ring and of the globe at the lower right (12 pixels of 5 levels or more at 3855, 21 at 3860). So the engine's
  two views draw the same picture and where the change sits is free. Frames in /tmp/v/r30/at056 and at667.
- Commit 8d471c2 (the paces and rise.at in skim.json, this notebook). Then main d38353f merged without a
  conflict as 23cb30efa0f10f2aa37dc75452290f81d923f85a (Jupiter's hold sky d188, travel d189: every leg lands
  and starts in one move, in src/space/travel/path.ts and src/director/film.ts; nothing of mine).
- On 23cb30e: tsc exit 0; vitest 41 files, 380 tests pass; handover --only path: "saturn.dive every frame:
  pass", "saturn.rise every frame: pass"; smooth --only path: "smooth saturn: green", "VERDICT: green. No
  number is over its limit." Pushed to agent/saturn-code at 04:30.
- The path lines as they print (out/work/smooth/saturn.md). Dive, whole frames: rate largest 1.166 at 3573,
  step 0.065 at 3549; turn 1.805 at 3580, step 0.066 at 3562, fall before 0.005; speed 1.611 at 3593, step
  0.066 over 6 at 3618, climb after 0.004 over 6. Rate 2: rate 1.168, step 0.066 at 3546 + 1/2; turn 1.815,
  step 0.067 at 3562, fall 0.006; speed 1.618, step 0.067 over 6 at 3618, climb 0.006 over 6. Fewest points 6.
  Rise, whole frames: rate 1.746 at 3846, step 0.072 at 3817; turn 1.862 at 3842, step 0.070 at 3833; speed
  1.553 at 3859, step 0.074 over 8 at 3877. Rate 2: rate 1.759, step 0.072 at 3816 + 1/2; turn 1.875, step
  0.070 at 3833 + 1/2; speed 1.554, step 0.075 over 8 at 3877. No fall, no climb. Rows of the speed shown and
  not judged: whole frames 17 (3838 to 3854), rate 2 34 (3837 + 1/2 to 3854); fewest points 4.
- Beyond my seam, shown and not judged: the speed steps 0.852 at 3896 (0.980 at 3896 + 1/2) of my rise's mean:
  the leg to Uranus picking up speed from 3889 on (travel, not my folder; mail 387: do not shape the rise
  against it).
- Job T started 04:31 in the worktree on 23cb30e (pictures of the rise first) and was stopped at 04:42: my
  sheet of its rise frames showed a fault that had to be cured before any report (next section). Its rise
  frames stay in the worktree (out/work/smooth/saturn/frames, k = film frame times 2); no pictures report.

## 04:38 to 05:05 VM: a one frame slit along a spoke of the sheet's mesh, the sheet as one triangle; mails 520 and 526

- MAIL 520 (04:40): main 8fb9ba9b and later; a named commit sits on it. d193: src/core/frame.ts (frameUniform,
  bufferFrame) is the one measure of buffer pixels in a master pixel: use it, not a factor of my own. d194:
  smooth builds before it opens a page; run parity again on the head. Main a19dc7a merged without a conflict
  as 4d8b904 (d191 the sky's dim starts every leg at nothing, d192 stars by height on other stops' rises).
- FOUND on my own sheet of the rise frames of job T (capture rate 2, draft): at capture frame k007640 (film
  3820) a thin dark slit runs from (0, 551) to about (805, 582), 5 px wide at the left edge and 1 px at x 700,
  and the sky shows through the ring sheet in it. Only in that frame (not at 3819 + 1/2, not at 3820 + 1/2,
  not in the film rate still of 3820). /tmp/v/flash2.py finds it (2865 pixels dark here and bright in both
  neighbours) and nothing else in the rise.
- MEASURED (out/scratch/slit2.ts): in the frame of the rings the slit is one spoke: azimuth 146.11 +/- 0.04
  degrees, radius 1.37 to 1.87 and on past the frame. The sheet's mesh had 720 segments, an edge every half
  degree: it is the shared edge at 146.0. The lens is at height 0.302 there and the outer end of that edge lies
  behind the plane of the lens. So the cause: the software rasteriser cuts every triangle on its own where it
  passes behind the lens, the two cut copies of a shared edge need not meet, and the long slivers of the mesh
  (half a degree wide, 2.7 radii long) open a wedge. It can strike any frame with the lens near the plane, at
  any rate and format.
- CURE (sheet.ts): the sheet is no mesh. Each of its two passes is one triangle over the whole picture
  (gl_Position from the corner alone, nothing to clip), and the point of the plane under a pixel is where the
  ray through that pixel meets the plane: the vertex shader gives the ray in the frame of the rings (the
  inverse of the model view matrix, the projection matrix for the lens) and the lens there; the fragment
  shader has depth = -eye.y / ray.y and q = eye.xz + ray.xz * depth, in place of the varying vLocal.xz. A ray
  that does not meet the plane, or meets it past 1e6 radii, gets a point far outside the ice. The bounds of the
  ice (the inner end of the model, the end of the ice past the rim) are a uniform (uBounds) where they were the
  rim of the mesh. sheet.json segments is gone with the mesh. The error of q by this way is the float's error
  of the ray over the angle of a pixel: about 0.0003 px at the master, 0.0005 px in the 4K capture, the same
  at every distance.
- PROOF, rate 2, draft, k007639 to k007641, the same tree with the mesh and with the triangle: the slit is
  gone at k007640 (flash2: 10 pixels of grain where it counted 2865). The other two frames differ from the
  mesh's in 345141 and 360016 pixels by a mean of 0.19 levels, 15 and 24 pixels by more than 8, largest 11 and
  16. The difference picture is the sand's cross hatch: the mesh's long slivers carried q a little wrong (a
  few hundredths of a pixel), so the pattern sits a shade off. Film rate, draft, triangle against mesh (the
  mesh on 23cb30e): 3465 the same bytes (the kept set draws there); 3660 mean 0.151, 14 pixels over 8, largest
  25; 3720 mean 0.225, 32 pixels over 8, largest 70; 3829 mean 0.150, 5 over 8; 3866 mean 0.105, none over 8,
  largest 6. The pixels over 8 at 3720 lie on hard ring edges near the lens (the stair of an edge moved by one
  pixel at a few steps, the draft tier has one sample a pixel) and on grains. Nothing that the eye sees.
  Frames in /tmp/v/r32 (base, full, pre, mesh; slit_cure_7640.png in the looks).
- The kept set's rings (kept/rings.ts) are a mesh too (small triangles, shared edges) and draw while the lens
  is high in the dive. Not changed. The detector runs over every dive frame of the next pictures run.
- The frame factor: pixelScale(height) of ice.ts and grains.json frame are gone; ice.ts, grains.ts, model.ts
  and kept/set.ts take bufferFrame() of src/core/frame.ts. A commit with nothing else. tsc exit 0, vitest 42
  files, 398 tests pass on the tree with both changes.
- MAIL 526 (04:52, d196): across each seam with the surface view the eye's speed over its own height never
  dips and never turns back; cured in the surface view's own path; the camera of the judged surface frame
  (3720) stays to the byte, the bend lives after it; a new line of smooth reads it (due 05:40). A stop that
  needs the bend may name by 08:30 if it says so before 07:00.
- MEASURED (out/scratch/seam.ts, rate 2, the eye's speed over its height against the last capture frame
  before the seam, over the ring plane and over the globe's surface): dive to skim at 3630: lowest 0.998 and
  0.998, the direction does not turn: clean. Skim to rise at 3810: lowest 0.616 and 0.630 at 3814 + 1/2, the
  eye's direction turns up to 13.8 degrees per half frame from 3812 to 3817. The skim pushes straight at the
  globe (velocity -8.5, -3.5, -1.7 thousandths of a radius a frame along e1, e2 and the normal at 3720) and
  the way out lies back along nearly the same line (foot 5.9, height 2.94), so the rise turned the eye round
  in its first eight frames. Mailed at 04:59 with the ask for the later time.
- PLAN of the bend: skimAt keeps its path to the byte up to just past 3720 (the take of 3720 ends at u =
  shutter over 2 * 180). From there the direction of the eye's velocity turns at a steady pace from the push
  through a track across to the pull back toward the way out, and its speed stays the same share of its height
  over the plane, so the height levels and then climbs. The rise takes that motion at 3810 and only speeds it
  up; its paces are set again by the path judge.

## 05:05 to 05:30 VM: the bend of the skim into the rise (ruling d196), built and tuned

- MAIL 529 (05:08): the 4K baseline of saturn on main 8fb9ba9b is red on parity: coarse mean 3.703 at 3563
  (limit 3.2), block level -22.068 at 3720 (limit 12, 3 frames over), whole frame level -3.168 at 3923 (the
  sky's, sky_builder's cure is on the machines). The rows are now 3465, 3563, 3585, 3608, 3720, 3829, 3848,
  3866, 3923. My head has to be green on it on my own tree: run it on the named head.
- MAIL 530 (05:10): main 5014624 (tools/seam.ts, two tests mended); merged as 387ba2c. The later time (NAMED
  by 08:30) is given. The tool: npx tsx tools/seam.ts --stop saturn [--kind rise] [--rows] [--before N]
  [--rate N]; its height is the distance to the unit sphere.
- sky_builder (05:18): the lines for the look of my sky at 3720 are on agent/flightsky fb501fc (not on main):
  in set.ts update, every time: nameSkyLook(plan.id, { look: 0, even: 1, stars: 8, cap: 0.5 }, weight) from
  '../../space/sky'; weight 1 where my sky is the frame's sky, 0 where the flight's has taken over; stars
  toward 5 or 6. Not in the named commit (it is not on main). After NAMED.
- THE BEND (plan.ts skimAt, skimStraight, skimBend, bendStep; skim.json path.bend). The skim is the straight
  way up to the share 0.0111 from its middle (two frames past 3720; the take of 3720 ends at 0.0014), so the
  camera of 3720 and of every frame before it is the same to the byte. From there to the share 0.489 the
  direction of the eye's velocity turns: its heading over the plane by turnDeg toward the right of the lens
  (where the globe is), its angle to the plane from the descent (10.7 degrees down) up to liftDeg 30. The
  speed stays the same share of the height over the plane all the way (4.2626 per unit of u, 0.02368 a
  frame), so the lens never rests. The lens does not turn in the skim. The way has no closed form: a table of
  256 steps of the fourth order rule, a place between two steps is one such step from the one before.
- WHY RIGHT: the track to the right moves the globe left in the picture, the pull back moves it left too
  (it stands right of the middle), and the rise then turns the lens right, so the globe goes right to left
  in one sweep: 1445 px at 3718, 1481 at 3742 (the push), 1331 at 3784, 1292 at 3808, 1263 at 3820, 973 at
  3850, 692 at 3886. A turn to the left would send it right and back.
- turnDeg: 210 aims the end at the way out but its last frames track left of the lens, and the globe drifts
  8 px back to the right from 3796 to 3814 before the sweep (measured, out/scratch/scr.ts). 190 keeps the
  drift to the left at every frame. 190 it is; the rise curves the rest.
- MEASURED on the bend (out/scratch/meas.ts): 3720 reach 1.6212, height 0.3959, foot 2.5911 (as before);
  lowest height 0.3498 at 3760; nearest foot 2.278 at 3770; 3810 reach 1.5788, height 0.5013, foot 2.5296,
  azimuth 6.44 degrees, velocity (10.05, 2.17, 5.94) thousandths of a radius a frame along (e1, e2, normal).
- THE SKY'S PROOF caught the first try (plan.ts skyProof stops the build): the bend ends 0.26 radii to the
  side of the old end, toward the path of the hold, and the rise with its old paces passed that path at
  1.0525 (sky.hero.reach is 1.2: a share of the hero's sky would have come back near 3861). The path of the
  hold runs from (5.087, 1.001, 2.228) at 3390 to (4.673, 1.529, 2.413) at 3540 in (e1, e2, normal); the way
  out is (5.905, -0.225, 2.939). The paces of the rise are now found with that distance as a wall
  (out/scratch/opt7.ts): nearest 1.258 at 3861 + 1/4.
- THE PACES OF THE RISE (skim.json handover.rise; at 0.56 as before): reach [0.369, 0.534], rounds [0.481,
  0.481, 0.125, 0.031]; climb [0.239, 0.256], [0.412, 0.421, 0.049, 0.56]; round [0.281, 0.291], [0.382,
  0.092, 0.136, 0.537]; view [0.432, 0.572], [0.03, 0.089, 0.053, 0.174]. A round longer than the room
  before its turn is cut to that room by Pace (so the first turn of reach and climb has no round of its own:
  the rate starts to grow at once and its growth falls off toward the level).
- MEASURED, npm run smooth -- --stop saturn --only path: green. Dive lines as on 23cb30e (rate 1.166 at 3573,
  step 0.065; turn 1.805, 0.066; speed 1.611, 0.066 over 6 at 3618; rate 2: 0.066, 0.067, 0.067). Rise, whole
  frames: rate mean 0.01708, largest 1.399 at 3847, step 0.068 at 3812, seam in 0.051; turn 1.772 at 3853,
  step 0.075 at 3871; speed mean 14.36 px a film frame, 1.502 at 3829, step 0.075 over 8 at 3883, seam in
  0.056. Rate 2: steps 0.069, 0.075, 0.077; seam in 0.061, 0.003, 0.068. Rows of the speed not judged: 3842
  to 3858 (the place has under 5 ground points; 23cb30e had 3838 to 3854). The speed mean of the kept rise
  was 13.96, so the pace of the picture is the same.
- MEASURED, npx tsx tools/seam.ts --stop saturn --rate 2 --before 88: dive "lowest 0.999 at 3629 + 1/2 | never
  against the surface view's way"; rise "the surface view flies 0.00749 of its height a film frame | lowest
  1.079 at 3810 | never against the surface view's way | surface view, largest step a film frame 0.008 at
  3809 + 1/2". Before the bend (b5cf72a, my scratch): 0.616 at 3814 + 1/2; the Builder's table on main: 0.543
  at 3813 + 1/2. Across the bend the eye's speed over its height runs from 0.00578 (3718) to 0.00741 (3810)
  without a dip; its part along the way at the seam passes 0 at 3766 at 0.87 of the seam's speed (a bend at
  speed, not a rest).
- npm run handover -- --stop saturn --tier draft --only path: "saturn.dive every frame: pass", "saturn.rise
  every frame: pass". tsc exit 0. vitest 42 files, 398 tests pass.
- SEEN (draft, film rate, every sixth frame 3722 to 3810, /tmp/v/r33/b2): the track and the pull back read
  as one arc; the globe grows to 585 px radius at 3766 and is cut by the top edge from 3740 to 3790; at 3810
  the far side of the rings shows as a short lit piece at the right edge beyond the globe's dark limb.
- STILL OPEN on the bend: the rise starts to speed up at once at 3810 (the eye's speed over its height
  doubles in 5 frames, as the kept rise did in 9). If it reads as a kick on the frames, the cure is to let
  the speed share grow over the last second of the bend, so the rise has less to add.
- The last three seconds of the skim no longer push forward: they track across and pull back (ruling d196).
  This stands against "clear forward movement through all 180 frames" of the first brief: named in the mail.

### 05:28 to 05:40 UTC: e3df591 pushed, MAIL 534, the proofs of the bend are rendering

- PUSHED: e3df591ce360c5cb373f3fcfafe5d221ef260ae5 on agent/saturn-code (the bend and the rise's paces), on
  387ba2c (merge of main 5014624). Looks pushed 05:28 (the two bend sheets and 3810).
- MAIL 534 (05:27, d198, main 3060b72: only kit/PROGRESS.md against 5014624): smooth.path.minEye is 0.87. At
  the end of each dive and the start of each rise, over 16 film frames either side of the seam at rate 2, the
  way of the eye over its own height above the ground never falls under 0.87 of the surface view's own (the
  mean of its 2 film frames next to the seam). Judged in the path part of npm run smooth (harness_builder's
  07148aa6, on the machines, not on main yet; until then npx tsx tools/seam.ts --rate 2 gives the same number
  inside the move). Saturn rise on main 0.536 at 3814 (the judge takes the height above the ring plane
  there). The window reaches 16 film frames into the surface view: a bend that buys the seam by slowing the
  eye later in the surface view is red by the same line. So a gain of the speed share over the last 16 frames
  of the bend may be 1 over 0.87 at most (1.149): the cure named in the entry before this one ("let the speed
  share grow over the last second of the bend") can add no more than that; a larger gain has to be spread
  over the whole bend (1.149 every 16 frames is 2.15 over 88 frames). Red by this line at the named commit is
  a severe issue of its round. Time to name: 08:30 UTC for Saturn.
- THE LONG JOB (/tmp/v/job_z.sh SHA OUT, detached, log /tmp/v/r34/job.log) runs in the worktree mainref on
  e3df591 from 05:28: smooth pictures rise, parity, pictures dive, path, the gate, measure G5 and G17, the
  two final stills, G13 every sixth frame, the handover (sides, flow, path). Reports are copied to /tmp/v/r34
  after every step. A draft frame at rate 2 takes about 4 s.
- SEEN while it renders (rate 2, 3800 to 3812, /tmp/v/r34/seam_a.jpg and edge_a.jpg): the far ring's lit
  piece beyond the dark limb comes in at the right edge of the frame from 3806 + 1/2 and grows as the eye
  pulls back; it comes in by the edge, not by a blend.
- NET SIZE of the three folders against main at e3df591 (git ls-tree -r -l): assets-src/saturn plus 0.072
  MB, public/assets/saturn minus 0.127 MB, src/stops/saturn plus 0.013 MB: net minus 0.042 MB.

### 05:40 to 05:55 UTC: the rise's pictures on e3df591, parity on my tree, mails 538 and 540, the sky look

- MAIL 538 (05:34, no answer needed): a 4K check of main's stops with the sky's star cure. Saturn on main:
  coarse 3.226 at 3563 and block -22.068 at 3720; its travel level at 3923 is cured (-0.024 from -3.168).
  "These are main's stops, not your trees. If your tree already cures yours, say so in the NAMED mail with
  the number." Main gets 156ed6f9, fb501fc4, 797d3361 and 07148aa6 within the hour if the check is clean;
  the new main sha comes by mail.
- MAIL 540 (05:42): the engine's bend is handover_engineer's 3aa0a862 on agent/engine-handover, off by
  default, on main about 06:45 if clean. I do not need it (my path is my own, handover.ownPath). The risk
  for every stop that bends: after the bend render every frame from 10 before T to 4 after at the draft
  tier, put the sheet in the looks and say in the NAMED mail what is in them (the set's border, the far edge
  of the ground, a jump at T). The same at the dive's end for a stop that changes its landing (mine did
  not). Judged frames keep their camera to the byte.
- handover_engineer (05:42 and 05:47): main's rise dents to 0.54, the cure is the bend in my path; 3720 must
  not change; a warning from Mars: once the eye no longer stops, the whole early rise is further along at
  every frame, so look at the last close frames before the change of view and at the two sides at T. On my
  tree T is 3852 (main: 3860).
- THE T SHEET (looks: "the rise with the bend, draft, every frame 3842 to 3856"): no border of a set, no far
  edge of the plane, no jump at 3852. Frame to frame mean difference 11.70, 11.75, 11.78, 11.79 across T.
- THE EYE LINE on my tree (out/scratch/eye.ts, the judge's rule with the height over the ring plane, rate 2,
  16 film frames either side): rise own 0.02368, lowest 1.000 at 3794; dive lowest 1.000 at 3639 + 1/2.
- SMOOTH PICTURES RISE on e3df591 (198 draft frames; /tmp/v/r34/smooth_pic_rise.md and the two pictures):
  "smooth saturn: red, 2 over the limit or not measured."
  "rise: pop score 1.63 from frame 3895 + 1/2 to the next, limit 1.2 (12 frames over it, first 3874)"
  "rise: the pattern of the picture changes in place by 0.55 from frame 3859 to 8 film frames later, limit
  0.45 (6 frames over it, first 3808)"
  Largest level step 0.09 at 3865 + 1/2 (limit 1.3). Largest change in place 26.3 from 3868 + 1/2 at pixel
  1196, 728 (shown, not judged). Ground beside: change 10.5, pattern 0.16.
  Pops over 1.2: 3874 1.21 and 3875 1.22 (the engine's sky dip, sky_builder's fb501fc is its cure), then
  3891 1.27, 3891 + 1/2 1.38, 3892 1.40, 3892 + 1/2 1.27, 3893 1.21, 3894 1.34, 3894 + 1/2 1.38, 3895 1.40,
  3895 + 1/2 1.63, 3896 1.59: all in saturn.travel after my rise.
  Pattern over 0.45, six frames: 3808 0.48 (largest at pixel 1916, 664: the far ring's lit piece coming in
  at the right frame edge; one pair, the neighbours are 0.21 and 0.14); 3858, 3858 + 1/2, 3859, 3859 + 1/2
  0.50 to 0.55 (largest at pixels 1240 to 1316, 1056 to 1076) and 3863 0.451 (1224, 1020). Looked at in a
  crop at twice the size (looks: "rise 3859 to 3867 every second frame, crop at the globe's lower right"):
  the place is the thin inner ring (C ring) right of the globe's lower limb, inside the globe's shadow. The
  ring itself is dark there, so the detail in that place is the film's star field and its bright band seen
  through the ring, and it slides against the ring as the eye rises: two true layers, one seen through the
  other. The judge carries the ring's place back along the flow and finds another piece of sky behind it.
  Nothing is replaced in place there by a blend. Named in the mail, not cured: a cure would be to hide the
  sky behind a ring that lets light through, which is false.
- PARITY on e3df591 (/tmp/v/r34/smooth_parity.md): "smooth saturn: red, 1 over the limit or not measured."
  "parity: level difference of the whole frame -3.168 at frame 3923 (saturn.travel), limit 2.2 (2 frames
  over it)". Rows (mean, level, coarse, block): 3465 1.690, -0.632, 0.732, -3.883; 3563 2.097, -1.120, 1.196,
  -4.718; 3585 2.220, -1.178, 1.386, -8.081; 3608 2.179, -0.866, 0.996, -5.626; 3720 2.651, -1.100, 1.176,
  -6.282; 3829 2.473, -1.062, 1.153, -7.101; 3848 3.161, -2.026, 2.096, -9.624; 3866 4.129, -3.000, 3.060,
  -10.025 (block 13,7); 3923 3.841, -3.168, 3.171, -11.687. So my tree cures main's two (3563 coarse 1.196
  against 3.226, 3720 block -6.282 against -22.068). The second frame over the limit is 3866, in my rise:
  level -3.000 (it was -1.685 on 23cb30e). Its worst block is the lower right, the open sky with the bright
  band; with the bend the rise is further along at 3866, so more of the frame is the engine's open sky,
  whose stars are dimmer at 4K (the same cause as 3923, which sky_builder's star cure brings to -0.024).
  To be measured again on the merge with main once fb501fc is on it.
- THE SKY LOOK (sky_builder's fb501fc, not on main yet): nameSkyLook(id, { look, band, map, stars, even,
  cap }, weight), read and forgotten every picture. The star gain is 1 + (stars - 1) * weight; even takes
  the crowding of the stars into the bright band out by the weight; cap is a ceiling on a star's level, mixed
  in by the weight. With weight = plan.lowAt(height) and the look as sky_builder gave it (look 0, even 1,
  stars 8, cap 0.5) the level of a faint star, gain times the air's share of the exposure (skyGain, 0.17 at
  the skim), would be 1 at the heights of the hold, 2.6 half way and 1.36 at the skim: a swell on the way
  down and on the way up. Prepared in the scratch tree rt (repo at e3df591 with fb501fc's three engine
  files laid over it): plan.starsAt(low) names the gain that lets that level run straight in low from 1 to
  stars * near, and set.ts names { ...sky.look, stars: plan.starsAt(low) } with the weight low. Not rendered
  yet. Decision at about 06:30 by a trial at draft (3720's sky box against the approved image: mean 7.7,
  10.8, 15.4, p99 29.3, share over 40 0.0049; the dive from 3596 and the rise to 3840 for a swell; parity).
  If it is not clean by then, the NAMED commit goes without it and it is the first thing after.

### 05:55 to 06:05 UTC: what the two red picture lines of the rise are made of (read from saturn-rise.json)

- d199 on main c65e474 (only kit/PROGRESS.md against 5014624): a red smooth report breaks the pass bar of its
  round, each RED line is one severe issue of the stop in the scorecard, in the report's own words. So the
  red lines are to be cured where the cure is mine and true, and named with their cause where it is not.
- THE POP LINE, rows of the report (residual, the window's base, motion in px per half frame):
  3856 2.21, 2.21, 11.4; 3864 2.51, 2.42, 8.5; 3870 2.49, 2.51, 5.7; 3872 2.73, 2.42, 4.9; 3874 2.89, 2.32, 4.6;
  3875 2.86, 2.32, 3.8; 3877 2.48, 2.32, 3.2; 3880 1.60, 1.61, 1.66; 3882 0.96, 0.95, 0.71; 3884 0.46, 0.94,
  0.16; 3886 0.42, 0.94, 0.12; 3888 0.42, 0.94, 0.11; 3889 0.56, 0.93, 0.26; 3890 0.81, 0.93, 0.63; 3891 1.07,
  0.81, 1.27; 3892 1.33, 0.81, 2.32; 3893 1.45, 0.81, 3.80; 3894 1.39, 0.81, 4.38; 3895 1.37, 0.81, 6.57;
  3895 + 1/2 1.55, 0.81, 7.12; 3896 1.47, 0.81, 7.86.
  Two things. (1) 3873 to 3875 (1.21, 1.22): the leftover rises while the motion falls. It is the engine's
  sky changing its band from the stop's look to the flight's between a lift of 0.27 and 0.44 (the entry
  "Sky level in the rise" above: the sky's mean falls by 1.9 while it does). sky_builder's fb501fc changes
  3867 to 3884; measured again on the merge. (2) 3891 to 3896, in saturn.travel: the picture is at rest from
  3884 to 3888 (0.11 to 0.16 px per half frame; my rise lands there over 28 frames, 11.4 px at 3856 to 0.16
  at 3884) and the travel leg then takes it from 0.26 px at 3889 to 7.86 px at 3896. The leftover goes with
  it from 0.42 at rest to 1.47; at the same motion it is lower there than in my rise (1.47 at 7.86 px at
  3896 against 1.79 at 7.87 px at 3820 and 2.26 at 7.9 px at 3866). The score is over the limit because the
  window's median still holds the rest. What is left sits on the ring's outer rim where it crosses the dense
  star field (stars covered and uncovered as the rim passes them), along the ringlets, and on the star field
  seen through the thin inner ring (looks: "smooth pictures rise on e3df591"). The onset of the travel leg
  is not mine (mail 387: do not shape the rise against the travel's step); named in the mail with these
  numbers.
- THE PATTERN LINE at 3858 to 3863, looked at again with the judge's own picture at three times the size
  and the frames at eight times the gain: the band of changed pattern runs along the right border of the
  bright star cloud that shows through the thin inner ring in the globe's shadow, strongest at the bottom
  edge (1240 to 1320, 1000 to 1075). The shadowed ring beside it is 11.6, 15.8, 20.2 with ringlets of 2
  levels and holds no stars (the B ring lets none through); the ring lets light through by its optical
  depth over the cosine of the view (sheet.ts, alpha = 1 - exp(-tau / mu)), which is right. The judge's
  window is 40 px wide, so the cloud sliding behind the ring (two true layers) fills it. Not a blend.
- COUNTS: the page has a counter now (src/capture/frame.ts), but the warm list (src/core/warm.json, the
  engine's, "made again at the freeze", d177) holds frames up to 2203 only, none of Saturn's. The counts
  part of the smooth report is not run here (1140 pictures) and is not mine to cure; said in the mail.
- CORRECTION of the pattern line's cause, by the judge's own code run on the frames of the report
  (/tmp/v/patmap.py: tools/img/smooth.py change and pattern over the chain of 17 half frames, without the
  body mask; looks: "the judge's pattern change 3859 to 3867 laid over 3859" and "3808 to 3816 laid over
  3808"). 3859: the pixels over 0.45 on the body are one patch at 1180 to 1310, 1020 to 1080: the star
  cloud seen through the thin inner ring where it meets the bottom edge of the frame; the same cloud higher
  up, seen through the same ring, reads under 0.3. From 3863 the near lit ring comes into the frame at that
  edge. 3808: one patch at 1840 to 1919, 564 to 687, at the right edge of the frame on the night limb,
  where the far ring's lit piece comes in from 3806 + 1/2. So both are places next to a frame edge where a
  lit ring enters within the 8 frames, not a look replaced in place; the sliding of the cloud behind the
  ring alone (the paragraph above) does not reach the limit. Named in the mail with the two pictures.

### 06:05 to 06:22 UTC: the dive's pattern line, the sky look, MAIL 545, the merge of main f6ce51a

- DIVE PICTURES on e3df591 (/tmp/v/r34/saturn-dive.md, .json, the two panels): "dive: the pattern of the
  picture changes in place by 0.53 from frame 3561 to 8 film frames later, limit 0.45 (18 frames over it,
  first 3560)". Level step 0.02 at 3562, pop 1.09 at 3563 (green), change in place 23.6 from 3594 at 1804,
  680 (shown, not judged), ground beside: change 6.4, pattern 0.04. By frame: 0.18 at 3548, 0.38 at 3558,
  0.475 at 3560, 0.529 at 3561, 0.45 at 3568, 0.29 at 3572, all at 1124 to 1148, 228 to 268; then one frame
  of 0.508 at 3581 at 1704, 992 (0.376 at 3582, 0.21 at 3580).
- THE JUDGE JUDGES THE BODY ONLY (tools/img/smooth.py body: the unit sphere and the rings of the pose, less
  20 px). My earlier maps (/tmp/v/patmap.py) had no body mask. /tmp/v/patmap2.py takes the poses
  (out/scratch/poses.ts K..., the judge's carriedCamera) and gives the judge's numbers: 3561: p99 0.529 at
  1124, 236 (the judge's own); 3859: 0.545 at 1240, 1076, patch 1240 to 1335, 1000 to 1079; 3808: 0.48 at
  1916, 664, patch 1820 to 1919, 568 to 767. So the two causes named for the rise stand with the mask.
- CAUSE OF 3560 to 3568 (the globe's north pole under the top limb): the flow, not the globe. The film's
  dense star field lies right behind the top limb there and moves against the globe (the sky turns with the
  lens, the globe comes nearer; the hold's sky picture is leaving by distance, 0.68 of it at 3560, 0.38 at
  3568, and uncovers that field). Over the chain of 16 half frames the flow carries the limb's bright rim
  into the judged body over the dark pole (looks: "dive 3561 to 3569 at the pole, the judge's own steps":
  the carried limb is warped). PROOF (/tmp/v/patmask.py): the same measure with the flow taken on the body
  alone (sky set to zero in the pictures the flow sees, the pattern taken on the true pictures): p99 0.201
  (as judged 0.529), pole box p99 0.32 (as judged 1.09). The pose weight of the kept set (the hero's light)
  is still 1.000 up to 3565 (out/scratch/posew.ts: farthest in the hold 0.3505, heroRange 0.6 to 1.6: it
  falls from 3566 to 3598), and the air comes in from 3562 (low 0.024 at 3564), so no look of the globe is
  replaced in those frames; the eye's latitude falls 1.3 degrees in the 8 frames (4.5 percent of
  foreshortening at the pole).
- CAUSE OF 3581 (one frame): the tip of the lit wedge where the border of the globe's shadow crosses the
  ring, at the bottom edge of the frame (patch 1692 to 1767, 932 to 1079). With the flow on the body alone
  the whole body's p99 is 0.147 (as judged 0.485) but the patch keeps 0.66: there the kept set's own look
  of the shade gives way by the pose weight (0.6 at 3581, 0.2 at 3589: the hero's baked light to the
  computed shadow) while the tip leaves the frame. Small and real; in the list.
- SEEN ON THE WAY: (1) single dark pixels along the globe's top limb from 3570 to 3576 at draft (looks:
  "top limb 3568 to 3576 at six times"); to be looked at on the final tier. (2) The stars seen through the
  ring gap under the wedge change between 3588 + 1/2 and 3589 (the engine's change of view) on e3df591;
  looked at again on the merged head.
- TRIAL Q (fb501fc's sky files and my sky look over e3df591, /tmp/v/r35): parity green on every row: 3465
  mean 1.690 level -0.632 coarse 0.732 block -3.883; 3563 1.736, -0.589, 0.694, -4.391; 3585 1.663, -0.385,
  0.629, -3.311; 3608 1.990, -0.526, 0.684, -4.578; 3720 2.558, -0.959, 1.043, -4.631; 3829 2.132, -0.544,
  0.663, -4.517; 3848 2.017, -0.463, 0.598, -4.618; 3866 2.252, -0.534, 0.710, -4.279; 3923 1.560, -0.026,
  0.235, 0.498. Sky box of the trial's dive frames (0 to 700, 0 to 300, mean red): 16.5 at 3596, 12.2,
  9.6, 8.5, 8.3 at 3628, 8.3 at 3660, 8.4 at 3720: falls all the way, no swell (head: 16.0 to 7.7).
- THE SKY LOOK IS IN (sky_builder's request, main holds fb501fc now). Sky of 3720, box 0 to 700 by 0 to
  300, display values: approved mean 7.0, 10.2, 14.7, median 6, 9, 13, p99 36, p99.9 98; head before mean
  7.8, 11.0, 15.2, median 6, 10, 14, p99 33, p99.9 125 (warm clusters at the left, the right half bare);
  look stars 8 cap 0.5: 8.4, 12.4, 17.0, median 7, 11, 16, p99 42, p99.9 65 (an even dust, no bright star);
  look stars 5.5 cap 0.9: 8.0, 12.0, 16.7, median 7, 11, 16, p99 41, p99.9 80: an even field with bright
  and faint stars, the nearest of the three to the approved (looks: "sky of 3720 ... four"). Taken: skim.json
  sky.look { look 0, even 1, stars 5.5, cap 0.9 }, weight low (the air's own course by height), the gain on
  the way by plan.starsAt. Still off: the floor is 1, 2, 3 values over the approved (the even field's many
  faint stars); the veil's colour could take that up, not before the named commit.
- MAIL 545 (06:18): main is f6ce51a55b2fe2816cb80df8a68fd2b3584bec94 (sky swap fb501fc4, quintic pull at
  sun.travel, the eye line with smooth.path.minEye 0.87, the warm list, the engine's bend off by default,
  tools/round.py with the smooth judging: each RED line is one severe issue). Coming about 06:45: the sample
  offsets less their own mean (c2aaa84d: draft pictures do not change, every review and final picture moves
  0.09 px left and 0.035 px up, so no final equals a kept still to the byte; each builder gets its two
  judged frames as PNG on the new pattern to compare with) and a plan check (tools only). NAMED by 08:30
  for a stop that bends. Offer: PRE, the full sha and parts for a render machine (about 140 minutes whole).
- MERGED f6ce51a as b99e8b6 (no conflict, nothing of main in my folders). The engine's StopPlan has a
  private bend() now, so my plan's private field bend is ownBend (the only change the merge needed).

### 06:27 to 06:34 UTC: the merged head 589fd9a, the first proofs

- PUSHED 589fd9aa521bb3644012e939b9a125a2242bf6ef (merge of main f6ce51a plus the sky look). tsc clean,
  vitest 44 files 418 tests, build ok. Job V runs on it in the worktree (/tmp/v/r36): path, T sheet, parity,
  pictures rise, pictures dive, head sample, handover, G13, main sample.
- PATH: "VERDICT: green. No number is over its limit." Dive eye line: "Lowest 1.00 at frame 3634, limit 0.87;
  inside the dive itself 1.00 at frame 3630. Largest step from one capture frame to the next 0.02 at frame
  3620, shown." Rise eye line: "Lowest 1.00 at frame 3794, limit 0.87; inside the rise itself 1.07 at frame
  3810 + 1/2. Largest step from one capture frame to the next 0.10 at frame 3811, shown." Largest steps:
  dive rate 0.066, turn 0.067, speed 0.067 over 6; rise rate 0.069 at 3811 + 1/2, turn 0.075 at 3871 + 1/2,
  speed 0.077 over 8 at 3882 + 1/2, seam in 0.068 (limit 0.08). T: dive 3589, rise 3852.
- SEAM TOOL (npx tsx tools/seam.ts --stop saturn): dive "lowest 0.999 at 3629 + 1/2 | never against the
  surface view's way"; rise "lowest 1.079 at 3810 | never against the surface view's way".
- PARITY: "VERDICT: green." 3465 mean 1.690 level -0.632 coarse 0.732 block -3.883; 3563 1.736, -0.589,
  0.694, -4.391; 3585 1.649, -0.386, 0.630, -3.356; 3608 1.979, -0.527, 0.685, -4.578; 3720 2.557, -0.960,
  1.044, -4.631; 3829 2.118, -0.546, 0.664, -4.517; 3848 2.015, -0.463, 0.597, -4.618; 3866 2.252, -0.534,
  0.710, -4.279; 3923 1.560, -0.026, 0.235, 0.498. Main's 4K reds (MAIL 538: coarse 3.226 at 3563, block
  -22.068 at 3720) are 0.694 and -4.631 here.
- T SHEET (MAIL 540): every frame 3842 to 3856 at draft, T is 3852 (looks: "589fd9a ... every frame 3842 to
  3856", and 3850 to 3853 at full size). In them: no border of the set, no far edge of the plane, no jump
  at T. Mean difference from frame to frame 14.27 (3850 to 3851), 14.44, 14.54 (3852 to 3853), 14.69; it
  grows by 0.1 to 0.4 a frame from 12.15 at 3842 to 14.91 at 3855, with no step. Level 64.73 to 65.02.
- CAMERA AGAINST MAIN, TO THE BIT (out/scratch/samecam.ts: plan.flight of the head against plan.flight of a
  copy of origin/main's folder, every eighth of a film frame 3390 to 3885): the same everywhere but 3540 +
  1/8 to 3629 + 7/8 (the dive, my own path) and 3722 + 1/4 to 3884 + 7/8 (the bend after the judged frame
  and the rise). 3720 and 3465: every number of position, turn and lens equal.
- NET SIZE (/tmp/v/netsize.sh, git ls-tree of the head against origin/main): assets-src/saturn plus 0.091
  MB, public/assets/saturn minus 0.127 MB, src/stops/saturn plus 0.015 MB: net minus 0.022 MB.
- COUNTS are not run here: src/core/warm.json on main ends at frame 3012, the piece of this stop is the
  Builder's at the take (d197). What the counter counts (src/core/counts.ts): linkProgram, texture
  uploads, createBuffer, createFramebuffer, createRenderbuffer, createVertexArray. The grains write their
  two instance buffers in place every frame (update ranges, no new buffer); no texture is uploaded per frame
  by the skim.

### 06:37 to 06:55 UTC: MAIL 546, main b0b8788 merged (c8ca94e), the rise's pictures on 589fd9a

- MAIL 546 (06:37): main is b0b87889e1af276ed3b9543373ac1346744925dc: the centred sample pattern (c2aaa84d:
  draft pictures the same to the byte, review and final pictures move as a whole 0.09 px left and 0.035 px
  up, so no final equals a kept still to the byte) and the plan check in tools/lib/pace.ts (191dded2).
  Attached: my two judged frames as PNG, made on main's engine with the new pattern and nothing of my stop
  changed (/tmp/v/ref): 3465 sha256 21f107a66c0cb0318b1d070d25e6f605cf7c603a97b9c217c2c551381ac3a42a, 3720
  sha256 6c4e4e1061c931ac7b0cbd246ef89b6e3d5339b964f88e28c2f0774dcd8b0679 (main's picture of today, not the
  kept still and not my head's). "Where your stop leaves a judged frame alone, your final must give these
  bytes." "Where you change a judged frame on purpose, say so in the NAMED mail as before." NAMED by 08:30.
- MERGED as c8ca94eb4d524367af5303b2c09d93239482bb79 (no conflict, nothing in my folders imports
  director/pace). tsc exit 0, build exit 0, vitest without the three tests that open a browser (skylift-gl,
  globe-gl, globe-cap): 42 files, 394 tests pass. Pushed 06:39. The three go with job W when the renderer
  is free. Before it, 9eb7c84 (merge of the status commit e3320e5) and b006082 (notebook).
- JOB PLAN: job V (589fd9a) is stopped after its dive pictures; job W (/tmp/v/job_w.sh, /tmp/v/r37) runs on
  c8ca94e: finals 3465 and 3720 with their sha256, path, parity, gate, G5 and G17, the whole vitest, the
  draft sample of the head and of main b0b8788, handover, G13. The draft frames of 589fd9a stay for the
  hash proof (the T sheet frames 3842 and 3852 are in the new sample).
- 3465 AND 3720 CHANGE ON PURPOSE against main (main holds a359a4b's Saturn): 3465 by the sky picture of the
  hold without the baked grain (mail 448) and ruling (a) (the map rigid on the globe, 0.0045 of the body's
  pixels by 1 level); 3720 by the sky look. The pairs go into the mail with those lines.
- RISE PICTURES on 589fd9a (/tmp/v/r36/saturn-rise.md): "VERDICT: red. 2 numbers over the limit or not
  measured." "RED pop score 1.63 from frame 3895 + 1/2 to the next, limit 1.2 (11 frames over it, first
  3875)"; "RED the pattern of the picture changes in place by 0.50 from frame 3859 to 8 film frames later,
  limit 0.45 (5 frames over it, first 3858 + 1/2)". Largest level step 0.06 at 3849 (limit 1.3). Change in
  place 26.0 from 3868 + 1/2 at 1196, 728, shown. Ground beside it: change 11.3, pattern 0.16.
  - The pops over the limit: 3875 (1.21, one capture frame) and 3891 to 3896 (1.26 to 1.63, ten capture
    frames): the travel leaving its rest (what is left 0.43 in the rest 3884 to 3888, 1.5 once it moves,
    over a median of 0.81); MAIL 387 keeps my rise from being shaped against it. The judge's panel shows the
    four largest, all 3892 to 3896: what is left lies along the ring edges and where stars show through the
    outer ring.
  - 3871 to 3876 (1.09 to 1.21): what is left has a hump there (2.45 at 3870, 2.86 at 3874, 2.34 at 3877 +
    1/2) while the motion falls evenly (5.7 to 2.9 px). By blocks (/tmp/v/popmap.py, my own flow): the bottom
    strip x 720 to 1080 (blocks 6,8 to 8,8, plus 8 to 14 over their own median of 8): the bright near ring
    slides out over the bottom frame edge and the division comes in there from 3874 (looks: crops 3870 to
    3877). Nothing snaps or comes in by a blend.
  - The pattern over the limit: 3858 + 1/2 (0.48), 3859 (0.50), 3859 + 1/2 (0.48), 3863 (0.49), 3863 + 1/2
    (0.454); 3808 is 0.448 now. The judge's panel of 3859: the white lies on the shaded ring at the bottom
    right (x about 1240 to 1490, y 940 to 1079), where the star cloud of the film's sky shows through the
    ring inside the globe's shadow: two layers that move apart (the ring and the sky behind it), so the
    pattern in place changes. Item 4 of the list (stars through the shaded rings).
- FOUND ON THE WAY (out/scratch/posew.ts 3810 3886): the lens passes the hero pose at 1.444 radii at 3858, so
  the pose weight of the kept set (heroRange 0.6 to 1.6) comes back to 0.065 from 3852 to 3866 (0.009,
  0.032, 0.054, 0.065, 0.061, 0.045, 0.023, 0.005 on the even frames) and leaves again. The sky's proof
  keeps the hero's sky out (reach 1.2, nearest 1.258) but the look's range is wider. A blend by distance
  that comes and goes: to be measured (a frame with the weight held at 0 against the head) and closed, by a
  far end of the range under 1.44 or by the same wall for the look as for the sky. In the list.
- 06:55 UTC: the chain is /tmp/v/chain2.sh now (log /tmp/v/r37.log): after the dive pictures of job V it
  renders 3854 and 3859 at draft in the scratch tree twice (/tmp/v/r38/a with heroRange as kept, /tmp/v/r38/b
  with the far end at 1.4, so the pose weight stays 0 through the rise) to measure what the returning pose
  weight puts into the picture, then job W on c8ca94e as planned. The scratch tree holds a copy of the head;
  nothing of the test is in the repo.

### 06:55 to 07:10 UTC: the dive's pictures on 589fd9a, the pose weight closed, main bae3d4d

- DIVE PICTURES on 589fd9a (/tmp/v/r36/saturn-dive.md, done 07:06): "VERDICT: red. 1 number over the limit or
  not measured." "RED the pattern of the picture changes in place by 0.56 from frame 3580 to 8 film frames
  later, limit 0.45 (20 frames over it, first 3560)". Largest level step 0.02 at 3562 + 1/2 (limit 1.3),
  largest pop 1.09 at 3563 (limit 1.2). Change in place 24.0 from 3594 at 1804, 680, shown, not judged.
  The 20 capture frames over the limit:
  - 3560 to 3567 + 1/2 (16 frames, 0.454 to 0.532) at 1120 to 1136, 232 to 260: the top limb at the pole. The
    pose weight is 1 until 3565 (posew.ts), so nothing of the hold's look changes there; the film's star cloud
    slides in behind the limb while the hold's sky leaves by distance. Earlier measure with my copy of the
    judge's functions: with the flow of the body alone the pattern reads p99 0.201 against 0.529.
  - 3580, 3580 + 1/2, 3581 (0.556, 0.498, 0.523) at 1700 to 1724, 1004 to 1060: the tip of the globe's shadow
    on the ring at the bottom right corner. Cause found in the kept look: the border of the shadow goes from
    penumbra [0.978, 0.994, 0.006] to penumbraAway [0.95, 1.02, 0.03] with 1 less the pose weight
    (kept/set.ts soft), and the pose weight falls 0.648 to 0.245 from 3580 to 3588 (distance to the hero pose
    1.000 to 1.277): the border widens in place, most at the tip (the third number grows along the shadow).
    A blend by distance, yet a change in place. Cure to try after NAMED: one border for the kept set through
    the whole dive (the model takes the picture at 3597 to 3603).
  - 3587 + 1/2 (0.459) at 1268, 828: not looked at yet (the shadow's border on the ring near the globe; the
    comb along the border that I saw at 3587 to 3590 lies there).
- THE RETURNING POSE WEIGHT IS CLOSED, MEASURED: frames 3854 and 3859 at draft in the scratch tree are equal
  to the byte with heroRange [0.6, 1.6] (weight 0.032, 0.065) and with [0.6, 1.4] (weight 0): /tmp/v/r38/a
  and b, stop hashes 47699bc6 and e9e49ffd. The kept set is not drawn after the dive (set.ts: alone 'model'
  from the end of the hold's share on), so its pose weight shows nowhere in the rise. Off the list.
- So the rise's pattern red (3858 + 1/2 to 3863 + 1/2 at 1240 to 1331, 1008 to 1079 by my copy of the judge's
  map, /tmp/v/r36/pat3859.png) is the model's own: the star cloud shows through the inner ring where the
  globe's shadow lies on it, and the stars slide against the ring. Cure to try after NAMED: how much of the
  sky the model lets through the shaded inner ring.
- DARK SINGLE PIXELS just inside the top limb at the pole, draft, 3570 to 3577 (/tmp/v/r36/dive_limb.png and
  limb_px.png): 3 to 7 pixels a frame, 25 to 40 percent under their neighbours, other pixels in each frame.
  The kept set draws there; my change to kept/globe.ts is only the drift taken out. 3573 and 3576 are in the
  sample of job W for the head and for main, to see if main has them.
- MAIN is bae3d4d at 06:58 (kit/PROGRESS.md only, status 218 and d202, d203). d202: "a stop's round starts on
  a named commit whose take check is clean and whose smooth report is green, a third named commit goes into
  its round as it stands". d203: Venus named with its pictures red (pattern 1.27 and 1.37). Four engine
  pieces were named 06:40 to 06:49 (Relief.presence off by default; the sky's pixel factor from
  src/core/frame.ts; two more) and wait for a take: main may move again before I name. I merge the newest
  main right before the NAMED mail and say which proof ran on which tree.
- JOB W runs on c8ca94e since 07:07:43 (/tmp/v/r37.log). Looks pushed 07:09.

### 07:10 to 07:17 UTC: the two judged finals against the Builder's PNGs, path and parity on c8ca94e

- MAIN is 09d64d7 at 07:10 (b0b8788 plus kit/PROGRESS.md only). My pushed head 3af4dfc is on c8ca94e (merge of
  b0b8788); take check 0 files outside my three folders; net size -0.013 MB.
- FINAL 3465 on c8ca94e: sha256 f4b3a39598b5e761fa1c45c9c3cf19836a621e6aa70a95453c64bbb654a2a963 against the
  Builder's 21f107a6 (MAIL 546). Changed on purpose. 32.2 percent of the pixels differ, 10.4 percent by more
  than 1 level, 0.08 percent by more than 4, one pixel by more than 16 (1880, 265). Mean difference 0.325 of
  255, blurred 0.033. Lit body and rings (33 percent of the frame): 0.61 percent of the pixels, all by 1
  level, mean level equal 163.331 (the map rigid on the globe, ruling (a)). The rest is the sky: the hold's
  sky picture without the baked grain (mail 448), sky mean 14.000 against 14.001.
  Pair /tmp/v/r37/pair_3465.jpg.
- FINAL 3720 on c8ca94e: sha256 408729eb246dbe02ee7ee02ee0a52d004671faad01f005fdea018cac09bed0d5 against the
  Builder's 6c4e4e10. Changed on purpose in two places. 66.5 percent of the pixels differ, 12.3 percent by
  more than 4 levels, 0.8 percent by more than 16; mean 1.306, blurred 0.392.
  - sky upper left (0 to 700, 0 to 300): mean 11.36 to 12.26, blurred green +0.96, blue +1.52, 14.3 percent
    over 4 levels: the sky look sky_builder asked for (the warm star cloud gives way to an even field).
  - globe (1100 to 1800, 200 to 700): mean level equal 139.54, blurred 0.00, 42.5 percent of the pixels over
    4 levels: detail displaced, main's map still drifts by latitude, mine is rigid on the globe (ruling (a)).
  - near ring plane (0 to 1920, 760 to 1080): mean difference 0.56, 0.2 percent over 4, level equal 136.10.
  Pair /tmp/v/r37/pair_3720.jpg, difference times 8 /tmp/v/r37/diff_3720_x8.png. The camera at 3720 is
  main's to the bit (samecam.ts).
- PATH on c8ca94e (/tmp/v/r37/smooth_path.md): "VERDICT: green. No number is over its limit." Dive: "Lowest
  1.00 at frame 3634, limit 0.87; inside the dive itself 1.00 at frame 3630. Largest step from one capture
  frame to the next 0.02 at frame 3620, shown." Rise: "Lowest 1.00 at frame 3794, limit 0.87; inside the rise
  itself 1.07 at frame 3810 + 1/2. Largest step from one capture frame to the next 0.10 at frame 3811, shown."
- PARITY on c8ca94e (/tmp/v/r37/smooth_parity.md, done 07:15): "VERDICT: green. No number is over its limit."
  Largest mean 2.557 at 3720 (limit 12), coarse 1.044 at 3720 (limit 3.2), block -4.631 at 3720 (limit 12),
  level -0.960 at 3720 (limit 2.2). The nine rows are the same numbers as on 589fd9a. Main's 4K reds (MAIL
  538: coarse 3.226 at 3563, block -22.068 at 3720) read 0.694 and -4.631 here.
- THE DIVE'S TWO LATE PATTERN PLACES by my copy of the judge's map (/tmp/v/r36/pat_dive_two.png):
  - 3580: a strip along the border of the globe's shadow on the far ring, 1680 to 1779, 936 to 1079 (6112
    pixels over 0.45, largest 0.686 at 1724, 1060): the border of the shadow widening with the pose weight.
  - 3587 + 1/2: a half disc on the dark globe just above the near edge of the ring, 1224 to 1331, 780 to 839
    (4368 pixels, largest 0.714 at 1268, 828). Not explained yet.

### 07:17 to 07:38 UTC: causes of the three pattern reds, the merge of main 8b2c538, the job on the merged head

- GATE on c8ca94e (/tmp/v/r37/gate.log): "PASS G11  every asset has a row or a recipe" and "PASS G15  at most 2
  sets per frame; finished stops: saturn/web 274 MB, saturn/full 747 MB".
- MEASURE on c8ca94e (/tmp/v/r37/measure.log): "PASS G5 saturn: 3465 hold invalid 0 coverage 0.514; 3567 dive
  invalid 0 coverage 0.514; 3720 terrain invalid 0 coverage 0.725; 3866 rise invalid 0 coverage 0.372" and
  "FAIL G17 saturn: 3465 median 1.054 p25 0.918 over 71 tiles; 3720 median 0.683 p25 0.325 over 62 tiles".
  The sky look did not move G17 at 3720 (0.685 before it).
- VITEST on c8ca94e: exit 0, 45 files, 427 tests, the three browser tests with them (they pass when no other
  render runs beside them).
- SEAM TOOL on b6df4ba (npx tsx tools/seam.ts --stop saturn): dive "seam 3630 (its own path): the surface view
  flies 0.00535 of its height a film frame | lowest 0.999 at 3629 + 1/2 | never against the surface view's way
  | surface view, largest step a film frame 0.001 at 3632 + 1/2 | change of view at 3589"; rise "seam 3810 (its
  own path): the surface view flies 0.00749 of its height a film frame | lowest 1.079 at 3810 | never against
  the surface view's way | surface view, largest step a film frame 0.008 at 3809 + 1/2 | change of view at 3852".
- THE THREE PATTERN REDS HAVE ONE KIND OF CAUSE, MEASURED by my copy of the judge's map and the courses from
  the path (out/scratch/skydump.ts, /tmp/v/r38/skydump.json): each is a blend by distance or height (plan F
  holds) whose course is a smooth step, which runs 1.5 times its mean rate in its middle, so 8 film frames
  there carry too much of it.
  - Dive 3560 to 3567 + 1/2 (16 capture frames, 0.454 to 0.532), top limb at the pole (1120 to 1136, 232 to
    260): the hold's sky picture leaves by distance from the hold's path (skim.json sky.hero reach 1.2, power
    0.75). 0.297 of it goes in the 8 frames from 3560; a straight course (same power) computes 0.203.
    Hero sky 1.0 at 3540, 0.68 at 3560, 0.383 at 3568, 0 from 3586.
  - Dive 3580, 3580 + 1/2, 3581 (0.556, 0.498, 0.523), the strip 1680 to 1779, 936 to 1079 at the far tip of
    the globe's shadow on the ring, and 3587 + 1/2 (0.459), the half disc 1224 to 1331, 780 to 839 where the
    shadow's border meets the ring's inner edge before the dark globe: the shadow's border goes from penumbra
    [0.978, 0.994, 0.006] to penumbraAway [0.95, 1.02, 0.03] with 1 less the pose weight (kept/set.ts soft;
    pose weight 0.648 to 0.245 from 3580 to 3588). penumbraAway is a relic of the kept build; the model's own
    near shadow is sheet.json shadow.soft [0.006, 0.012], reach [1.25, 1.1, 1]. Cure to test: one border.
  - Rise 3858 + 1/2 to 3860, 3863, 3863 + 1/2 at 1240 to 1331, 1008 to 1079: the sky seen in the gap between
    the globe and the inner ring. The stars of the flight come in by height (skim.json sky.lift heights [2.42,
    2.9377], power 0.5, smooth step; lift 0 at 3853, 1 at 3884): 0.42 of them in the 8 frames at 3860 + 1/2;
    straight with power 0.4 computes 0.282. (My earlier guess, the star cloud through the shaded ring, is
    withdrawn: the place is open sky.)
  - The other course of the same kind: low (air and sky look, heights [0.6, 2.2], power 0.5) falls 1 to 0 from
    3816 to 3850 in the rise and rises from 3563 in the dive. No red lies on it.
- THE SCRATCH TREE /home/user/workspace/rt holds the three cures, tsc 0, NOT rendered yet: kept/look.ts
  penumbraAway equal to penumbra; plan.ts liftAt mix(level, smooth(level), k.round) and heroSky with the same
  mix; skim.json sky.hero.round 0, sky.lift.power 0.4, sky.lift.round 0. They go into the second named commit
  only after the whole pictures runs of both moves, parity and path on them.
- ITEM 9 (the engine's sky dip in the rise) IS NOT SEEN ANY MORE, MEASURED on 589fd9a's rate 2 frames: the
  sky mean in 1300 to 1900, 0 to 300 rises every frame from 7.36 (3848) to 18.95 (3884), largest step 0.60 at
  3862.
- MAIL 572 (07:29): main is 8b2c538 with take C (Relief.presence in src/terrain/relief.ts, the sky's pixel
  factor swap in src/space/sky.ts, two tests, notes). The Builder measured 115 of 115 drafts and 18 of 18
  judged finals of main equal with it. Take D (tools and tests only) is announced. "A commit on an older main
  is taken as long as it touches only your three folders; say which main it stands on." NAMED is due 08:30.
- THE MERGE OF 8b2c538 IS MADE BY PLUMBING, because main is fetched with --depth 1 only and git merge then
  refuses ("refusing to merge unrelated histories"; the parent be1de182 is not in my store). It is a true
  merge here because main's change since b0b8788 touches no file in my three folders (git diff --name-only
  b0b8788 origin/main). Recipe: a scratch index (GIT_INDEX_FILE), git read-tree MAIN, then for each of my three
  folders git rm -r -q -f --cached DIR and git read-tree --prefix=DIR/ HEAD:DIR, git write-tree, then git
  commit-tree TREE -p HEAD -p MAIN, then git merge --ff-only. Checked: 0 files of the tree differ from main
  outside my folders, 0 files differ from my head inside them, 21 files differ from main in all.
- MERGED HEAD 086fcbd5900866df54b30c2dba87d4a0686fdb8e (parents b6df4ba and 8b2c538), pushed 07:34: tsc 0,
  build 0. Net size against main: assets-src/saturn +0.106 MB, public/assets/saturn -0.127 MB,
  src/stops/saturn +0.015 MB, net -0.006 MB.
- JOB W was stopped after its two samples (head c8ca94e and main b0b8788, /tmp/v/r37/head and main); the
  job on the merged head runs from /tmp/v/chain3.sh, log /tmp/v/r39.log, outputs /tmp/v/r39: finals, path,
  parity, gate, sample, vitest, handover, G13.

### 07:38 to 08:00 UTC: proofs on the merged head, the first NAMED mail, what the second commit shall cure

- FIRST NAMED COMMIT: 2ab7243b7cb5e5e5f741ae6a763952e15a1f5b22 (the notebook commit on the merge 086fcbd of main
  8b2c538). The NAMED mail went to /root at 07:57 UTC, high, with 10 pictures. Its text is /tmp/v/mail/named.md.
  The Builder's report on it starts a clock: the second named commit is due within 90 minutes of that report
  (MAIL 508); the third goes into its round as it stands.
- MAIL 575 (07:45): main is aaea819b3ec05f04742fdb6f55ccb032327aed47, take D, tools only. "Nothing under src,
  config, public or package.json changed, so no hash moves and no picture changes; no merge is needed for a
  named commit". My head stands on 8b2c538 and the mail says so.
- PROOFS ON 2ab7243 (worktree /home/user/workspace/mainref, outputs /tmp/v/r39):
  - tsc 0, build 0, vitest exit 0 (47 files, 437 tests).
  - Take check: 21 files differ from main 8b2c538, 0 outside my three folders.
  - Net size against main: assets-src/saturn +0.106 MB, public/assets/saturn -0.127 MB, src/stops/saturn
    +0.015 MB, net -0.006 MB.
  - Finals: 3465 sha256 f4b3a39598b5e761fa1c45c9c3cf19836a621e6aa70a95453c64bbb654a2a963, 3720 sha256
    408729eb246dbe02ee7ee02ee0a52d004671faad01f005fdea018cac09bed0d5, both equal to those of c8ca94e, both
    changed on purpose against the Builder's PNGs of MAIL 546 (pairs /tmp/v/r37/pair_3465.jpg, pair_3720.jpg).
  - Path: "VERDICT: green. No number is over its limit." The report is the one of c8ca94e line for line.
  - Parity: "VERDICT: green. No number is over its limit." Largest mean 2.557, coarse 1.044, block -4.631,
    level -0.960, all at 3720; 3563 coarse 0.694 (main's 4K reds of MAIL 538 were 3.226 and -22.068).
  - Gate: "PASS G11  every asset has a row or a recipe" and "PASS G15  at most 2 sets per frame; finished
    stops: saturn/web 274 MB, saturn/full 747 MB".
  - Handover (draft, sides, flow, path): "saturn.dive side difference at T: pass", "saturn.dive flow gap at T:
    pass", "saturn.dive every frame: pass", "saturn.rise side difference at T: pass", "saturn.rise flow gap at
    T: pass", "saturn.rise every frame: pass". Side difference at T in both moves: mean 0, max 1.
  - G13 (every 6th frame, 08:00): "PASS G13 saturn: 0 of 83 frames over 0.02 soft (every 6th frame); worst
    frame 3390 0.00%, frame 3396 0.00%, frame 3402 0.00%".
  - 26 draft frames equal to the byte to those of c8ca94e. Stop hash 47699bc6d1834c03 (the hash of the pictures
    runs on 589fd9a), engine hash 12ba5366b28777b2.
  - The pictures of both moves were NOT run again on this head; they stand on 589fd9a with the same stop hash.
- SAMPLE OF MY HEAD AGAINST MAIN (draft, /tmp/v/r37/head and /tmp/v/r37/main, 26 frames): equal bytes at 3330,
  3922, 3950, 3959, 3960; 3350 0.01 percent of the pixels; 3370 14 percent; 3389 to 3539 32 to 37 percent, mean
  0.46 to 0.54 of 255; 3630 to 3720 63 to 66 percent, mean 1.67 to 1.98; 3780 and 3809 are the bend (mean 66.8
  and 89.9); 3885 to 3900 15 to 20 percent, on the globe (the rigid map) with a faint lattice on the rings
  (/tmp/v/r39/s3885_head_main_diff.jpg).
- FORWARD SHARE of the lens' way along its own view (out/scratch/fwd.ts): 1.000 from 3630 to 3729, 0.947 at
  3740, 0.655 at 3750, 0.153 at 3760, -0.397 at 3770, -0.815 at 3780, -0.974 at 3790, -0.933 at 3808. Height
  0.581 at 3632, 0.395 at 3720, 0.350 at 3760, 0.4925 at 3808. Speed 9.345e-3 radii a frame at 3720. So the
  last 70 frames of the surface view do not fly forward: that is the bend d196 asks for, and it is against
  the brief's "clear forward movement and depth through all 180 frames". Mailed as item 11 for a ruling.
- DARK SINGLE PIXELS inside the top limb at the pole (draft 3570 to 3577, 3 to 7 a frame): main's 3573 and
  3576 have them too (/tmp/v/r37/limb_head_main.png). So they come from the kept set, not from my model.
  Item 14.
- COURSES OF THE TWO SKY BLENDS, computed from the path (out/scratch/skydump.ts, /tmp/v/r38/skydump.json), the
  largest share that goes inside 8 film frames:
  - hero sky (dive): now 0.297 at 3560; straight course, same power 0.75: 0.203 at 3556 + 1/2.
  - lift (rise), frames 3859 to 3867 and 3863 to 3871: now 0.415 and 0.402; straight with power 0.5: 0.301 and
    0.276 (largest 0.324 at the start, end rate 0.031 a frame); power 0.45: 0.285 and 0.268; power 0.4: 0.266
    and 0.258 (end rate 0.047 a frame, a harder stop at 3884).
- THE OPEN LIST AS MAILED, worst first, old numbers kept: 10 the three pattern reds; 6 G17 at 3720 (the film's
  shutter at the skim's pace, needs a ruling); 12 pop 1.21 at 3875 (the near ring leaving over the bottom
  edge, x 720 to 1080); 11 the last 70 frames of the surface view do not fly forward; 1 the globe near the
  lens 3808 to 3836; 4 stars through the shaded C ring; 2 the near rest at 3884; 13 the rise picks up its
  speed inside one frame at 3810; 14 dark limb pixels; 5 sawtooth wedge 3630 to 3690; 7 ring tone slides 3840
  to 3864; 3 the moon cut by the limb 3596 to 3600. 8 and 9 are closed.
- PLAN FOR THE SECOND NAMED COMMIT (all in the scratch tree /home/user/workspace/rt, tsc 0, not rendered):
  1. One shadow border: kept/look.ts penumbraAway = penumbra [0.978, 0.994, 0.006]. Check the 3720 draft
     bytes against /tmp/v/r39/head/f03720.png (the globe's shadow border is out of frame there).
  2. Hero sky course straight: plan.ts heroSky mix(gone, smooth(gone), k.round), skim.json sky.hero.round 0.
  3. Lift course straight: plan.ts liftAt mix(level, smooth(level), k.round), sky.lift.round 0, power 0.5 or
     0.45.
  Test first with film shutter stills in rt (/tmp/v/job_y.sh DIR FRAMES, half frames allowed) and my copy of
  the judge's pattern map (/tmp/v/patmap3.py K0 K1 /tmp/v/r38/poses.json OUT, run in mainref, K = 2 x frame).
  Then copy into the repo, commit locally, run job W with "keepframes dive rise path parity finals gate
  vitest", check the two finals (3465 must stay f4b3a395..., 3720 must stay 408729eb... unless a cure moves
  them on purpose), merge the newest main by the plumbing recipe, push whole.

## 24 Nov, 08:00 to 08:50 UTC: after the first NAMED mail, the Builder's report, the second commit

- NAMED 2ab7243b7cb5e5e5f741ae6a763952e15a1f5b22 was mailed at 07:57 (notebook commit 08fae29 on top).
- MAIL 577 (08:26), the Builder's report on it: drafts, finals, gate, handover, path, parity as I stated. RED:
  dive pattern 0.56 at 3580 (20 over, first 3560; 0.53 at 3561, "the top of the globe" and "the outer ring edge
  at the lower right"), rise pop 1.63 at 3895 + 1/2 (11 over, first 3875) and rise pattern 0.50 at 3859 (5
  over). Wanted: "the ring's fine structure filtered to the pixel at every scale of the rise and of the travel
  after it", and the two places of the dive "cured or explained with pictures". SECOND COMMIT DUE 09:56 UTC,
  answer with NAMED and the full sha.
  RULING 1: d196 stands (the bend after 3720; depth must read in every frame; the camera of 3720 to the byte).
  So item 11 is ruled: it stays as it is.
  RULING 2: G17 at 3720 is read with the film's shutter, limit 0.8 stays. "The cure is in the flight: the pose
  at the middle of 3720's shutter stays, the way the camera travels through it may change, so that it crosses
  fewer ringlets a frame at 3720". Red means a severe issue in the round. This lifts MAIL 311 for this one
  purpose (a bent path is allowed, the pace is not: MAIL 298 and plan E still hold).
- TOOLS FOR THE JUDGE'S OWN NUMBERS (all in /tmp/v, scratch, K = 2 x frame):
  - rt/out/scratch/rate2.ts and /tmp/v/job_r2.sh TREE DIR SPANS: capture frames at rate 2, named like the
    judge's (k%06d-r2-draft.png).
  - /tmp/v/patscan2.py DIR K0 K1 POSES POLAR (cwd mainref): the judge's own pictures() on those frames; POLAR 1
    is the judge's body (unit sphere), 0.902 the globe as it is drawn. It gives the judge's numbers to the
    digit on the named commit's frames. Pops are exact from 16 capture frames after K0, and for the last
    frames of a move's window when K1 is the window's last frame (the judge moves the window inward there).
  - /tmp/v/leftreg.py POSES K... -- DIR...: what is left without the motion, split by globe, rings, sky near
    the body, sky beyond.
- WHAT THE REDS ARE, MEASURED (this corrects two causes of the first NAMED mail):
  1. Dive, pole, 3560 to 3567 + 1/2 (16 capture frames): NOT the course of the hero sky. The straight course
     gave 0.539 at 3561 against 0.532. The judge's body (tools/img/smooth.py body()) is the unit sphere; my
     globe is drawn flattened (fit.json globe.scale [1, 0.902, 1], as in main). At the pole the unit sphere
     reaches up to 55 px beyond the drawn limb (3561, column 1440), the margin is 20 px, so a strip of sky up to
     35 px high is judged as body, and in it the stars change (the hold's sky leaves, the flight's stars come
     in, both by where the lens is). Same frames, same function, only the body flattened by 0.902 along the
     ring normal: largest 0.288 at 3562 + 1/2, none over. tools/smooth.ts poseOf hands body() the rings and not
     the globe's scale, so this is not curable in my folders. Picture /tmp/v/r40/mask_pole_3561.png.
  2. Dive, 3580, 3580 + 1/2, 3581, 3587 + 1/2: the shadow's border widening away from the hero pose, as said.
     Cured by one border (kept/look.ts penumbraAway = penumbra): 0.556, 0.498, 0.523, 0.459 become 0.216,
     0.313, 0.197, 0.371.
  3. Rise pattern, 3858 + 1/2 to 3863 + 1/2: NOT the course of the lift. It is the star cloud seen through
     the shaded C ring: the shade grew solid only between radius 1.2458 and 1.5. With the shade solid from the
     ring's inner edge (new sheet.json shadow.solid [1.2458, 1.27], used by the kept set and by the far look
     alike) the largest pattern of the rise is 0.238 at 3871, none over; the lift's course is untouched.
  4. Rise pop. 3875 reads 1.194 with the cure of 3 (was 1.21). 3891 to 3896 is the travel leg taking off
     after its standstill (3885 to 3888): what is left without the motion goes 0.42 (the film's grain, also on
     the empty sky) to 1.54 inside 8 film frames and the median of the judge's window (3880 + 1/2 to 3896 + 1/2)
     stays at 0.82. Main's own frames (8b2c538, same window, same function) read 1.43 at 3895 + 1/2 with 5
     frames over 1.2: red on main too. The ring profile is filtered already (mip chain at 1.2 px of the pixel's
     radial footprint, kept/look.ts lodBias); twice that width takes the left over at 3895 + 1/2 from 1.519 to
     1.443, no clumps and no spokes change nothing (1.519, 1.523). Split at 3895 + 1/2: rings 0.47, sky within 8
     quarter pixels of the body 0.23, sky beyond 0.18, globe 0.12. For 1.2 the part that comes with the motion
     would have to fall to an eighth. So no filter of mine cures it; it needs a ruling or a gentler take off.
- TEST A (kept): one border and shadow.solid. Dive, judge's body: 16 over, all at the pole (0.528 at 3561);
  elsewhere the largest is 0.395 at 3592 + 1/2 (frames 3552 to 3607 measured). Flattened body: largest 0.387
  at 3587 + 1/2, none over. Rise (3852 to 3896 + 1/2 measured): pattern 0.238, pops as in 4. The hold's draft
  frame 3535 is equal to the byte to the named commit's (the shade is solid only in the dive: uSolid.x is 0
  in the hold; the border is the hero's at the hero pose).
- DROPPED: the straight hero sky course and the straight lift course of the plan above (no effect on the
  measure, and the lift's straight course made a level step of 0.10 at 3853 + 1/2).
- git push failed with "could not read Username" between 08:21 and 08:26 (three looks pushes), then worked
  again without any change on my side.

## 24 Nov, 08:50 to 09:50 UTC: proofs of the second commit, MAILS 596, 598 and 613, the plan for the flight (G17)

- SECOND COMMIT: 1e4bfd4e46d236e0032fc1f045cc954c58511d41 (test A: one border for the globe's shadow, the
  shaded sheet solid from its inner edge; kept/look.ts, kept/rings.ts, sheet.ts, sheet.json). The camera is
  untouched. Proofs in /tmp/v/r41, all on that sha (job_w.sh and job_x.sh in the mainref worktree):
  - path green (the numbers of 2ab7243: dive lowest 1.00 at 3634, rise 1.00 at 3794; steps 0.066, 0.067,
    0.075, 0.077).
  - parity green: mean 2.557, coarse 1.044, block -4.631, level -0.960, all at 3720 (the numbers of 2ab7243).
  - finals equal to the byte to 2ab7243's: 3465 f4b3a39598b5e761fa1c45c9c3cf19836a621e6aa70a95453c64bbb654a2a963,
    3720 408729eb246dbe02ee7ee02ee0a52d004671faad01f005fdea018cac09bed0d5.
  - gate: "PASS G11  every asset has a row or a recipe", "PASS G15  at most 2 sets per frame; finished stops:
    saturn/web 274 MB, saturn/full 747 MB". tsc 0, build 0, vitest exit 0, 437 tests in 47 files.
  - G17 by the measure's own tools/measure/g17.py on nograin finals of this head (npm run still, tier final,
    diag nograin): 3720 median 0.683, p25 0.325 over 62 tiles (worst [11,5] 0.0095, [10,5] 0.038, [0,6] 0.052,
    [0,5] 0.058, [1,7] 0.062); 3465 median 1.054, p25 0.918 over 71 tiles. The numbers of the machines on 2ab7243.
  - 26 draft frames against 2ab7243's (/tmp/v/r39/head): equal to the byte 3330 to 3539 (approach, hold),
    3720, 3922 to 3960. Changed: dive 3573 (3.0 percent of the pixels), 3576; surface view 3630 (1.4 percent,
    x 1407 to 1919), 3660 (0.66), 3780 (12 px by 1 level), 3809 (0.53): the shaded far ring right of the globe
    is solid now where the sky showed through it; rise 3842, 3852, 3859 (2.0 to 2.7); way out 3885, 3890
    (4.0), 3900 (2.7): the shade of the ring solid with one crisp border, the star cloud no longer shows
    through it. Pairs /tmp/v/r41/pair_*.png (in the looks).
- THE JUDGE'S OWN RISE PICTURES ON 1e4bfd4 (npm run smooth, pictures, rise; 198 frames, 15 minutes):
  red, 2 numbers. "RED pop score 1.59 from frame 3895 + 1/2 to the next, limit 1.2 (11 frames over it, first
  3891)": all 11 are 3891 to 3896, the travel's take off; inside the rise the largest is 1.19 (3873 + 1/2 to
  3875). "RED the pattern of the picture changes in place by 0.55 from frame 3807 + 1/2 to 8 film frames later,
  limit 0.45": NEW, one capture frame (3807 reads 0.34, 3808 0.30), most at pixel 1872, 608. On 2ab7243 the
  same place read 0.41 and 0.448 (3807 + 1/2, 3808), so it stood 0.002 under the limit and I never saw it: MY
  SCAN OF TEST A BEGAN AT 3852 AND THE JUDGE'S WINDOW BEGINS AT 3798. Lesson: scan the judge's whole window
  (dive 3528 to 3641 + 1/2, rise 3798 to 3896 + 1/2), not the frames of the old reds.
  What is there (/tmp/v/r41/rise3807_edge.png): at 3807 the lit far ring beyond the globe's shadow comes into
  the frame at the right edge (x 1915, y 540 to 565), in the last frames of the bend, and grows to 80 px by
  3815 + 1/2; between it and the globe's dark limb lies the shaded ring, solid and without detail in this
  commit, with a crisp border. My copy of the judge's map (/tmp/v/patmap3.py 7615 7631, the same 0.55 at
  1872, 608) shows the patch over the limit: x 1816 to 1919, y 548 to 755, 13072 px, on the night side of the
  globe round the place where the ring comes out from behind the limb (/tmp/v/r41/patmap_3807h.png). Reading,
  not proven by a variant: the night side has no detail of its own, so within the 40 px of the measure the
  pattern there is that of the growing ring, and the crisp border of this commit lets the ring come out
  brighter than the wide border of 2ab7243 did. The old red at 3859 reads 0.11 (3858 to 3863 +
  1/2: 0.11 to 0.17): cured by the judge's own run. Largest pattern elsewhere 0.30 at 3815 + 1/2.
- THE JUDGE'S OWN DIVE PICTURES ON 1e4bfd4: still running when this block was written (228 frames); their
  lines go into the NAMED mail and into the next block.
- The judge's body mask is the unit sphere less a margin of 20 px at its edge (cv2.erode, tools/img/smooth.py
  line 105). On a globe flattened to 0.902 that margin does not keep it inside the limb at the pole.
- MAIL 596 (09:05): a level check for plate pyramids (assets-src/shared/globe-levels.py on main 81d568a7);
  asked: run it on every pyramid the dive and the rise show and put its lines into the NAMED mail. MEASURED in
  the code: Saturn's globe has no pyramid. One wrap (wrap-color.jpg, 8192 by 4096) is the only picture of the
  globe in every frame, in the kept set and in the model alike; the close patch (close-globe.jpg) is loaded
  by the kept set and its weight is uClose, which is 0 at every frame (skim.json handover.kept.close 0,
  kept/globe.ts pw). The rings are a radial profile (function and table), no plates. So there is no pair to
  judge; said so in NAMED.
- MAIL 598 (09:05): on 2ab7243 G5 passes, G13 passes on all 495 frames, G17 fails at 3720 (median 0.683, p25
  0.325 over 62 tiles); warm list and counts green. Asked in the second NAMED: 3720 beside the approved image
  with the G17 lines by my own run, and the reds of the dive and the rise as they stand.
- MAIL 613 (09:22): the engine's default sky weight (skyFrames 24) and place weight (placeFrames 12) run by the
  clock; "Saturn: none". Owed in NAMED, one line: which hooks the stop sets and the frames in which anything
  of mine still reads the time in a dive or a rise. Mine: plan.ts handover dive and rise both picture false
  and skyFrames 0; the hold's sky leaves by the distance of the lens from the hold's path (plan.heroSky), the
  flight's stars come in by height (plan.skyLiftAt), the sky gain and the glow by height (plan.lowAt), the
  kept set gives way to the model by height, the shade turns solid by the distance to the globe. Frames that
  read the time: none (the orbits of the ring and the grains run in their own time).
- 09:34 the named sha was pushed alone (MAIL 621: one sandbox lost its GitHub login; push while it works, a
  bundle attached to the mail if it does not: git bundle create NAME.bundle origin/main..HEAD).
- THE SHADE BETWEEN HOLD AND DIVE (item 15, new on the list): uSolid.x = smooth(dove / 0.116) with dove = how
  much nearer to the globe the lens is than at the end of the hold. The lens is 5.476 radii from the centre at
  3540 and 5.360 at about 3552, so the shaded ring turns solid over 3540 to 3552. It did so before this commit
  from radius 1.5 on; now from the inner edge on, so the C ring's shade joins. Looked at once
  (/tmp/v/r41/shade_3538_3556.png, every second frame, x 1300 to 1920, y 520 to 1000): through 3546 the shade
  is the hold's dark wedge with its faint streak and no edge at the ring's inner end; from 3548 to 3556 the
  stars in the gap between globe and ring come up and the inner edge of the shaded ring shows. So stars come
  in there by distance; open, not judged frame by frame at full size yet.
- G17 BY TILE (/tmp/v/g17map.py APPROVED FILM: the measure's own g17.py, the ratio of every kept tile). On
  the nograin final of 3720: 27 of the 62 tiles are at or over 0.8, the median needs 31 or 32. Rows top to
  bottom, columns left to right:
    row 0:  .     .     .     .     .     .     .     .    0.55  0.48   .     .
    row 1:  .     .     .    0.42   .    0.27  0.59  0.79   .     .     .     .
    row 2:  .    2.20  2.80  3.29   .     .    0.76   .     .     .     .     .
    row 3: 1.01  1.03  0.37  0.97  1.28  2.74  0.69   .     .     .     .     .
    row 4: 0.13  0.43  0.25  0.67  1.20  0.90  0.66  0.19  0.16   .     .     .
    row 5: 0.06  0.12  0.68  0.32  0.64  1.40  1.95  1.76  1.22  0.43  0.04  0.01
    row 6: 0.05  0.07  0.31  1.14  0.34  0.57  1.04  1.95  3.03  2.80  2.73  1.70
    row 7: 0.20  0.06  0.07  0.41  1.43  0.89  0.36  0.75  1.35  2.40  2.53  3.26
  The right end of row 5 is layout (the approved has lit ring there, the true world has the globe's shadow on
  the ring); the left ends of rows 4 to 7 are the near ring under the shutter.
- THE FLIGHT FOR G17 (ruling 2 of MAIL 577), PLAN AND FIRST NUMBERS (scratch tree rt, nothing committed):
  - out/scratch/ringway.ts FROM TO STEP: the way of the lens over the ring plane by frame (foot, height,
    speed, the part across the ringlets, the heading off the inward radial and off the view axis).
  - Now: at 3720 the lens goes 9.205e-3 radii a frame over the plane, 8.521e-3 of it across the ringlets (the
    heading is the view axis, 22.2 degrees off the inward radial).
  - The straight skim can head left of its view axis with numbers alone: path.forward 1.7 cos d, path.side
    -1.7 sin d keeps the speed. d = 28 degrees: heading 50.2 degrees off the radial, across 5.889e-3 (0.69 of
    now). The pose at 3720 stays; the start of the skim (3630) moves to foot 3.331 (3.550 now).
  - The bend after 3720 stays a turn to the RIGHT (path.bend.turnDeg 190 + d = 218): the heading swings back
    through the view axis and on as now, the end of the skim is where it is now (3810: foot 2.515, height
    0.5028, heading 171.7 off inward; now 2.532, 0.5028, 174.5). A turn to the left (turnDeg -130) was tried on
    paper: the globe would drift right through the whole skim and swing back in the rise. Dropped.
  - Globe centre in the picture with d = 28: 1143 px at 3630, 1448 at 3720, 1535 at 3750, 1353 at 3810 (now
    1303, 1449, 1481 at 3740, 1290).
  - The paces of the dive must be found again (the tool's path is red with the old ones): opt7.ts dive 400 1
    gives hard 0.831 (the old dive stands at 0.832): reach [0.353, 0.802] rounds [0.03, 0.287, 0.112, 0.118];
    climb [0.737, 0.791], [0.032, 0.275, 0.315, 0.048]; round [0.558, 0.733], [0.068, 0.305, 0.148, 0.061]; view
    [0.492, 0.527], [0.191, 0.093, 0.085, 0.033] (/tmp/v/r42/opt_dive_d28.log). The rise: not searched yet.
  - NEXT: G17 by render for d = 28, 34 (final nograin 3720, then g17map.py), choose d, search the paces of
    both moves, then every proof again over the judge's whole windows (the judged dive frame 3567 and every
    frame of the skim but 3720's pose change), and the place 3807 at the right edge with it.
- SECOND NAMED MAILED 09:45 UTC (due 09:56): NAMED 1e4bfd4e46d236e0032fc1f045cc954c58511d41, the text is
  /tmp/v/mail/named2_sent.md, ten pictures attached (3720 beside approved, gapA_dive, gapA_rise, mask_pole_3561,
  pole_frames, rise3807_edge, patmap_3807h, pair_3630, pair_3885, shade_3538_3556). Looks pushed 09:45:53.
- THE JUDGE'S DIVE PICTURES ON 1e4bfd4 (/tmp/v/r41/saturn-dive.md, done 09:42:40, window 3528 to 3641, 228 draft
  frames at rate 2): "VERDICT: red. 1 number over the limit or not measured." and "RED the pattern of the
  picture changes in place by 0.53 from frame 3561 to 8 film frames later, limit 0.45 (16 frames over it,
  first 3560)". Largest pop 1.09 at 3563, largest level step 0.02 at 3562 + 1/2.
  - The red of 3580 is cured by the judge too: 0.22 at 3580, 0.31 at 3580 + 1/2, 0.20 at 3581, 0.37 at 3587 +
    1/2 (were 0.556, 0.498, 0.523, 0.459).
  - The pole stands: over from 3560 to 3567 + 1/2. The pattern number climbs evenly from 0.03 at 3540 to 0.44
    at 3559 + 1/2, then 0.48 to 0.53 to 0.47, and falls from 0.44 at 3568 and 3568 + 1/2 (0.42 at 3569, 0.38 at
    3569 + 1/2). The judge's own change picture shows it at the top of the globe only (the strip of sky judged
    as body, see the pole block above).
  - THIN MARGINS, named in the mail: 0.44 at 3559 + 1/2 and at 3568 (the same strip), and 0.40 at 3592 + 1/2
    (3591 0.29, 3591 + 1/2 0.33, 3592 0.37, 3593 0.30: the judge's picture of 3593 shows it at the outer ring
    edge at the lower right, the place of the old red of 3580). My own scan with the flattened body had 0.387
    at 3587 + 1/2 as its largest; the judge's body reads 0.40 at 3592 + 1/2.
  - Nothing new in 3528 to 3551 (0.00 to 0.23, climbing with the hold's sky share) nor in 3608 to 3641.
- CHECKED AGAIN before the mail: main 8b2c538's own frames 3889 to 3896 by the judge's function
  (patscan2.py on /tmp/v/r40/smooth_main): pop 1.21 at 3891 + 1/2, 1.24 at 3892, 1.24 at 3895, 1.43 at 3895 +
  1/2, 1.40 at 3896: 5 over 1.2 in the travel's take off, so that red is on main without my stop's change.
- NEXT (the order): the flight for G17 in rt (render d = 28 and 34 at final nograin 3720, g17map.py, choose),
  the paces of the rise, then the judge's WHOLE windows on it (dive 3528 to 3641 + 1/2, rise 3798 to 3896 +
  1/2) with the 3807 place at the right edge, path, parity, gate, tests; mail PRE with its sha (MAIL 545).
- THE FLIGHT FOR G17, MEASURED AND COMMITTED LOCALLY (10:01 UTC): d07e2b453fc32afdab00ff3ec3b084e232ff452f on
  4f21127 (only src/stops/saturn/skim.json differs from the second NAMED 1e4bfd4 besides the notebook).
  - G17 by render in rt (final nograin 3720, the film's shutter, /tmp/v/job_g.sh D, tile maps by g17map.py):
    d = 0: median 0.683, p25 0.325, 27 of 62 tiles at or over 0.8; d = 28: median 0.945, p25 0.477, 35 tiles;
    d = 40: median 1.095, p25 0.566, 36 tiles. The tiles that stay under 0.8 at d = 28 lie on the globe and on
    the far horizon (0.79, 0.75, 0.67, 0.65, 0.59, 0.56, 0.48, 0.42, 0.27) and do not move with the angle.
  - CHOSEN d = 28: the larger forward part of the motion (the brief wants clear forward movement) with a margin
    of 0.145 over the limit. path.forward 1.501, path.side -0.7981, path.bend.turnDeg 218.
  - The pose at 3720.25 (the middle of the shutter of 3720) is equal to the old one to 8.9e-16 (pose3720.ts in
    rt against repo before the copy); 3720.0 and 3720.5 differ by 1.06e-3, as they must: the way through it is
    another. The DRAFT still of 3720 is taken at 3720.0 and so differs (560270 px, largest 113, mean 1.13); the
    FINAL 3720 changes on purpose (less smear across the ringlets). Say both in the mail.
  - Paces of the dive: as in the block above. Paces of the rise: HI=0.6 npx tsx out/scratch/opt7.ts rise 500 2
    (log /tmp/v/r42/opt_rise_d28b.log, hard 0.984; with the default HI 0.4 it stayed red at 1.006): reach peak
    [0.347, 0.54] rounds [0.534, 0.515, 0.085, 0.031]; climb [0.261, 0.261], [0.592, 0.557, 0.03, 0.6]; round
    [0.298, 0.404], [0.321, 0.183, 0.103, 0.436]; view [0.417, 0.468], [0.03, 0.068, 0.117, 0.223].
  - Path proof (rt and again in mainref on d07e2b4, /tmp/v/r43/smooth_path.md): "VERDICT: green. No number is
    over its limit." Dive steps: rate 0.066 at 3545, turn 0.062 at 3576, speed 0.058 over 8 at 3574. Rise: rate
    0.074 at 3811 + 1/2, turn 0.071 at 3868, speed 0.079 over 8 at 3883 (limit 0.08, THIN), seam in 0.071.
    Seams: dive lowest 1.00 at 3631 + 1/2 (limit 0.87); rise lowest 1.00 at 3794, inside the rise 1.07 at 3810
    + 1/2, largest step from one capture frame to the next 0.10 at 3811.
  - Way of the lens (ringway.ts 3630 3810 15): 3630 foot 3.331, h 0.5866, across 1.094e-2; 3720 foot 2.589, h
    0.3955, across 5.889e-3 (was 8.521e-3), heading 50.2 degrees off inward, 28 off the view; 3750 foot 2.390;
    lowest h 0.3519 at 3765; 3780 foot 2.276; 3795 foot 2.375, h 0.4235; 3810 foot 2.515, h 0.5028.
  - Draft sheets of it looked at: /tmp/v/r42/d28_sheet.png (3567 to 3866), d28b_sheet_a.png (3716 to 3726
    consecutive), d28b_sheet_b.png (every second 3728 to 3760): sound at sheet size, no jump. The lower left of
    the final 3720 at full size beside the approved (/tmp/v/r42/g17_pair_lowleft.png): the ringlets are crisp
    lines now where the named commit smears them.
  - Looks pushed 10:03 (5 new). RUNNING since 10:01: /tmp/v/job_w.sh d07e2b4 /tmp/v/r43 "path rise dive g17
    parity gate vitest finals head" (log /tmp/v/r43w.log).
  - STILL TO DO ON IT: read the judge's rise and dive reports over the WHOLE windows; the entry of the far ring
    beside the night limb at the right frame edge (3807 + 1/2 on the old flight, about 3812 to 3820 on this
    one); then mail PRE (or the third NAMED when the report on 1e4bfd4 names a due time).
- MAIL 624 (10:05 UTC), receipt of the second NAMED 1e4bfd4. Proof tree c546f20f on builder/proof-sn2 (main
  cd8355dd with my folders). The verdict mail comes when its handover, measure and gate parts are in; my 90
  minutes for the THIRD commit run from that mail. Ruled:
  1. Dive pattern 0.53 at 3561 (body mask): a bug of the judge, with harness_builder (MAIL 623). "Send
     harness_builder your patch for body() directly. Do not spend your third commit on this number until its
     answer is in." DONE 10:10: /tmp/v/patch/body.patch (poseOf hands fit.globe when its scale is not 1, 1, 1;
     body() takes ray and camera into the globe's frame over its scale; old lines unchanged with no globe)
     mailed to /root/harness_builder with mask_pole_3561.png. Checked: applies on main da59c441; 0 px differ
     from main's body with no globe named and 0 px from my scan's flattened body with it, on 12 poses.
  2. Rise pop 1.59 at 3895 + 1/2: the rest between rise and travel; the travel's carry (5d54f36c on
     agent/travel-carry) is in its engine check; once on main "a rise may end with speed and the travel takes
     it over". The Builder sends the sha and assets-src/travel/NOTES.md. "Until then: nothing to do on it."
  3. Rise pattern 0.55 at 3807 + 1/2: "yours. Say what changes there."
  G17: the flight that heads 28 degrees left is ALLOWED as the cure of a red measure: "send the PRE with 3720
  at the final tier beside the approved close image and the G17 number. It must stay one flight (dive, surface
  view, rise) and the seam lines must stay green."
  "main is now da59c441 (the relief fix cd8355dd and the slice tool). Merge it."
- DONE 10:07: cff62ce (note of the bend reworded: the way ends on the heading it ended on; at 3810 the new
  way stands 0.12 radii from the old), then MERGE of main da59c441: head
  68b45619c9b8a49e33e17639a44504a39e29e2a7, pushed. 21 files differ from that main, all in my folders. The
  merge brings src/terrain/relief.ts (my stop does not import it), tools (smooth.py: slices only, the whole
  window run is the same function), tests. The proof job on d07e2b4 was stopped at 57 rise frames (kept in
  /tmp/v/r43/rise_part) and started again on the merged head: /tmp/v/job_w.sh 68b4561 /tmp/v/r44 "path g17
  finals gate vitest rise parity dive head" (log /tmp/v/r44w.log).
  - Path on 68b4561: "VERDICT: green. No number is over its limit." (/tmp/v/r44/smooth_path.md), the same
    numbers as in rt. THIN: rise speed step 0.079 over 8 at 3883 at rate 2 (0.078 at whole frames), limit 0.08.
  - Partial scan of the new flight's rise (patscan2.py on /tmp/v/r43/rise_part, k 7596 to 7652, the judge's
    body, poses /tmp/v/r43/poses_all.json = new flight, all k 7056 to 7800): 3798 to 3818 largest pattern
    0.211 at 3811 + 1/2; the place moves to the right frame edge at 3817 (0.155, 0.153, 0.183 at [1888 to 1896,
    532 to 552]): the entry of the far ring beside the night limb is at about 3817 on this flight. Numbers
    past 3818 need the whole window.
- PRE MAILED 10:30 UTC: PRE 68b45619c9b8a49e33e17639a44504a39e29e2a7 (text /tmp/v/mail/pre3_sent.md; three
  pictures: /tmp/v/r44/3720_beside_approved.png, /tmp/v/r42/g17_pair_lowleft.png,
  /tmp/v/r43/edge_new_3810_3826.png). Proven on the sha before the mail (all in /tmp/v/r44):
  - measure, as printed: "PASS G5 saturn: 3465 hold invalid 0 coverage 0.514; 3567 dive invalid 0 coverage
    0.600; 3720 terrain invalid 0 coverage 0.725; 3866 rise invalid 0 coverage 0.384" and "PASS G17 saturn:
    3465 median 1.054 p25 0.918 over 71 tiles; 3720 median 0.945 p25 0.477 over 62 tiles". The measure's own
    nograin final of 3720 is to the byte the one rendered in rt for d = 28 (sha256 250bab4c).
  - finals: 3465 sha256 f4b3a39598b5e761fa1c45c9c3cf19836a621e6aa70a95453c64bbb654a2a963 (equal to the byte);
    3720 sha256 33bb2086f66838b044eb2cb0fbba49ae51dd2f35fe6486186b885c1e466617b7 (was 408729eb, changes on
    purpose). Pose at 3720.25 equal to the old one to 8.9e-16 (pose3720.ts on the head against the old file).
  - gate: "PASS G11  every asset has a row or a recipe" and "PASS G15  at most 2 sets per frame; finished
    stops: saturn/web 274 MB, saturn/full 747 MB". tsc exit 0. vitest exit 0 (455 tests, 48 files).
  - net size against main da59c441: plus 0.028 MB at 68b4561, plus 0.031 at the head b5d773a.
  - NOT in the PRE, still running at 10:30: rise pictures, parity, dive pictures, head sample. Handover check
    not started (run after the job: job_w.sh 68b4561 /tmp/v/r44 "handover keepframes").
- THE ENTRY OF THE FAR RING ON THE NEW FLIGHT (looked at /tmp/v/r43/edge_new_3810_3826.png, the right 420 px
  of 3810, 3813, 3815, 3817, 3819, 3821, 3823, 3826): from 3810 the sky comes in at the top right beside the
  dark limb; the lit ring comes out from behind the limb at 3819 at the frame edge, y about 660 to 720, and
  widens. The judge's pattern at such a place (read in tools/img/smooth.py pattern()): frame i has the thin
  bright sliver, its band pass halo reaches about 80 px into the dark globe; the later frame carried back has
  the globe's own night side there; the correlation falls to 0 in the halo; the number is the 99th
  percentile over the judged pixels, so it turns on whether the halo is more than 1 percent of them. At 3817
  the judged share is 0.27 of the frame (0.62 at 3802), so 1 percent is a smaller patch than on the old
  flight: this place may read worse. The judge's whole rise window decides.

### 10:30 to 10:50 UTC: the rise's pictures on the PRE, MAIL 638, a correction

- HANDOVER PATH on 68b4561 (10:33, /tmp/v/r44/handover_path.log): "saturn.dive every frame: pass",
  "saturn.rise every frame: pass". The handover's picture parts (sides, flow) are not run yet.
- RISE PICTURES on 68b4561, the judge's whole window 3798 to 3896 + 1/2 (/tmp/v/r44/saturn-rise.md):
  "VERDICT: red. 1 number over the limit or not measured." "RED pop score 1.59 from frame 3895 + 1/2 to the
  next, limit 1.2 (11 frames over it, first 3891)": the travel's take off after its rest (ruled in MAIL 624:
  nothing to do until the carry is on main). Inside the rise the largest pop is 1.17 at 3873 and 3873 + 1/2.
  "Largest change of the pattern alone: 0.35 from frame 3871 to 8 film frames later, most at pixel 1304, 792
  ..., limit 0.45." GREEN: the old red of 3807 + 1/2 (0.55) is gone on this flight; the entry of the far ring
  reads 0.21 at 3818 + 1/2. Largest level step 0.05 at 3896 (limit 1.3). Change in place 30.1 from 3868,
  shown. Ground beside it: change 11.8, pattern 0.16.
  - Looked at: rise_a (3798 to 3813), rise_b (3816 to 3840), rise_c (3844 to 3884), rise_d (3885 to 3895 +
    1/2), 3828 and 3866 at full size, the judge's changes panel. Nothing new: the ring comes out behind the
    night limb at 3819, the moon rises over the limb at 3836, 3866 is rich; the rest 3885 to 3888 and the
    take off stand as before. Looks pushed 10:48.
- MAIL 638 (10:45 UTC). PRE 68b4561 received: proof tree e79f126d1e68587958f48228b26c239c8d6dc141 on
  builder/proof-sn3 (main 1c3da4b2 with my three folders, 21 files differ inside them, none outside), queued
  behind about 110 jobs (sn3 01 to 10 engine drafts, 11 finals, 12 handover, 13 measure, 15 gate; ss3 01 dive
  pictures, 02 rise, 03 path place parity, 04 warm list and counts). "If your NAMED differs from the PRE by
  notes only, give the tree hashes of src/stops/saturn and public/assets/saturn of both in NAMED and the PRE's
  results stand for it; nothing runs twice." My 3720_beside_approved.png goes to the critics as it is.
  The machines on 1e4bfd4 (proof c546f20f): 102 of 115 drafts keep main's bytes, 11 differ inside dive,
  surface view and rise, 2 outside (3352, 3465); finals 3465 and 3720 differ from the reference finals; G13
  pass (0 of 495 frames over 0.02 soft), G5 pass, G17 FAIL 0.683; G11, G15 pass, tsc 0, 449 tests; smooth
  path, place, parity green; dive pictures red (pattern 0.53 at 3561, 16 capture frames over, first 3560);
  rise pictures red (pop 1.59 at 3895 + 1/2, pattern 0.55 at 3807 + 1/2).
  "DUE: your third NAMED 20 minutes after the PRE's numbers reach you, and at 13:00 UTC at the latest with
  whatever is back by then. It goes into Saturn's round as it stands." "No answer needed."
- CORRECTION MAILED 10:47 (low priority): MAIL 638 read my PRE's "3465: equal to the byte" as against the
  reference PNG of MAIL 546. It was against my own commit 1e4bfd4. 3465 at final is sha256 f4b3a395 on
  2ab7243, 1e4bfd4 and 68b4561; the reference is 21f107a6; measured again now: 32.2 percent of the pixels
  differ, 10.3 percent by more than 1 level, 0.08 percent by more than 4, largest 22, mean 0.325 of 255
  (0.77 on the dark sky, 0.09 on the lit parts): the hold's sky without the baked grain (mail 448) and the
  map rigid on the globe (ruling (a)), as named in the first NAMED, item (d). LESSON: say against WHAT a
  frame is equal, every time.
- MAIN IS 1c3da4b2 now (not asked to merge; read only): 02249f1 adds the REST LINE to the path part of the
  smooth report (tools/smooth/path.ts judgeLeave, camera.ts sampleLeave): at the seam from a rise into its
  travel, reachFrames film frames to each side, the lowest speed of the fastest point of the body's edge
  (px a film frame, from the path alone) over the smaller of that speed at the two ends of the window;
  "Judged against smooth.path.minLeave once the config has it; shown until then." kit/PROGRESS.md d211 (11):
  "A rise and the travel after it are one flight: through the seam the speed falls once and rises once and
  never comes to rest." The travel's carry is proven, its take is next; then a limit for the rest line.
  For my rise that is items 2 and 12: it ends near rest at 3884 by its own pace. Nothing to do until the
  Builder sends the carry's sha (MAIL 624).

### 10:50 to 11:30 UTC: the PRE proven whole here, the carry on main, a rise that ends with speed

- THE PRE 68b4561 IS PROVEN WHOLE HERE (job done 11:11, all in /tmp/v/r44) but for the handover's picture
  parts:
  - parity (smooth_parity.md): "VERDICT: green. No number is over its limit." mean 2.785 at 3720 (limit 12),
    coarse 1.257 at 3720 (3.2), block level -6.722 at 3848 (12), level -1.125 at 3720 (2.2).
  - dive pictures (saturn-dive.md, the judge's whole window): "VERDICT: green. No number is over its limit."
    "Largest level step: 0.01 at frame 3576 ..., limit 1.3." "Largest pop score: 1.04 from frame 3578 to the
    next, limit 1.2." "Largest change of the pattern alone: 0.41 from frame 3565 to 8 film frames later, most
    at pixel 1100, 180 ..., limit 0.45." (at the pole, the judge's round body; thin). Change in place 15.7
    from 3606 + 1/2, shown. Sheets dive_a to dive_d, bend.png (the owed sheet 3562 to 3588), shade.png (item
    15) and the changes panel looked at: continuous; the moon goes behind the limb at about 3610 to 3614.
  - head sample against 1e4bfd4 (/tmp/v/r41/head): 3330, 3350, 3370, 3389, 3390, 3420, 3465, 3510, 3539,
    3885, 3890, 3900, 3922, 3950, 3959, 3960 equal to the byte; 3573, 3576, 3630, 3660, 3720, 3780, 3809,
    3842, 3852, 3859 differ (inside the dive, the surface view and the rise).
- MAIN IS bdd47cf NOW, MERGED 11:21 (5863ae0). 5420365 on it is the take of the travel's carry
  (travel_builder 5d54f36c), status 229: "the carry is on main". The interface (assets-src/travel/NOTES.md):
  place as today on riseEnd; a stated speed above the drift along the rise's own line; the rise may end in the
  middle of its brake (the travel carries the acceleration on); it does not speed up at the end nor switch
  its law in the last 1/300 s; turn of the sky and vfov at rest as today; eyeShot('rise', t, 'orbit') valid
  to the end. film.ts carryOf(i): one sided velocity at the rise's end minus the exit's drift, and the
  acceleration, h = 1/600 s; under 0.02 radii a second no carry; the carried speed decays over 0.4 s.
  kit d216: smooth.path.minLeave is set once the seven rest lines are read from this main.
- THE RISE ENDS WITH SPEED NOW (items 2 and 12, MAIL 624 ruling 2). Tried in the scratch tree ct first.
  - plan.ts law(..., gain): the end rate of the three measures of the place (reach, climb, round) is the way
    out's own rate times gain; rising() gives 1 + handover.rise.carry / driftSpeed. The place at the end is
    the same; the turn of the camera and the field of view arrive at rest as before. The dive is untouched
    (gain 1).
  - skim.json handover.rise.carry 2.2 (planet radii a second over the drift) and the four paces of the rise
    fitted again (out/scratch/opt7.ts with the rest line and the brake at the end among its aims): reach peak
    [0.438, 0.605] round [0.391, 0.375, 0.232, 0]; climb [0.331, 0.331] / [0.343, 0.362, 0.076, 0.397]; round
    [0.4, 0.405] / [0.237, 0.183, 0.131, 0.4]; view [0.421, 0.423] / [0.03, 0.039, 0.105, 0.255].
  - skim.json sky.lift.power 0.5 to 1. With the old power the level of the sky (the flight's stars by the
    height) ran evenly over the frames only because the lens came to rest; with speed left at the end it
    stopped with a slope at 3885: the judge read a level step 0.21 at 3885 on the first trial (limit 1.3) and
    the level of the right part of the frame rose by 0.7 a frame up to 3885 and was flat after. With the
    power 1 the level is a smooth step of the height itself: the same part now rises by 0.65, 0.54, 0.35,
    0.10, 0.00 a frame from 3882 to 3886.
  - MEASURED in the repo on the merge (path, 11:25): "VERDICT: green. No number is over its limit." Rest
    line: "lowest 3.36 at frame 3889, against 8.96 at frame 3873 and 34.77 at frame 3896 + 1/2 at the ends of
    the window. The lowest is 0.375 of the slower end, no limit yet, shown and not judged." (the PRE: 0.026.)
    Steps at rate 2: rate 0.046 at 3815 + 1/2, turn 0.073 at 3838 + 1/2, speed 0.070 over 8 at 3839 + 1/2
    (limit 0.08; the PRE: 0.074, 0.071, 0.079). Seam at 3810: "Lowest 1.00 at frame 3794, limit 0.87; inside
    the rise itself 1.01 at frame 3810 + 1/2. Largest step from one capture frame to the next 0.05 at frame
    3815, shown."
  - The speed of the lens through the seam (out/scratch/seamout.ts, radii a second): 2.337 at 3882, 2.319 at
    3883, 2.299 at 3884, 2.277 at 3885, 2.264 at 3885 + 1/2, 2.244 at 3886, 2.159 at 3887; its change
    -0.54, -0.56, -0.61, -0.65, -0.78, -1.23, -3.06 radii a second squared: it brakes through the end and does
    not speed up there (the first trial sped up by 0.74 at 3885: the reach pace runs in the logarithm of the
    distance; the fit now has the brake at the end among its aims).
  - A slice of the judge's pictures across the seam on the trial (capture frames 7770 to 7793, the paces of
    the first trial with the power 1): "VERDICT: green", "Largest pop score: 1.07 from frame 3895 + 1/2 to
    the next, limit 1.2." (the PRE: 1.59, red), "Largest level step: 0.02 at frame 3892 + 1/2", pattern 0.13
    at 3888. Sheet /tmp/v/ct_seam_b.png (3877 to 3896 + 1/2, every third capture frame) looked at: the globe
    draws back through the seam at one pace, nothing rests, nothing jumps. The whole window with the final
    paces is in the proof of the commit.
  - tsc clean; tests/pass.test.ts, smooth.test.ts, onemove.test.ts pass on the merge with it (85 tests).
  - WHAT CHANGES against the PRE: the frames of the rise (3810 to 3884, new paces; 3866 is a judged frame and
    changes on purpose) and the frames of the travel after it from 3885 on while the carried speed decays
    (0.4 s) and as far as the engine's slide of the leaving body is solved anew. The hold, the dive and the
    surface view keep the PRE's code and numbers.
  - FALLBACK: the PRE 68b45619c9b8a49e33e17639a44504a39e29e2a7 stays nameable as it is.

### 11:27 to 11:55 UTC: 91d6247 pushed and in proof, PRE 2 mailed

- COMMIT 91d62470b26f63decf5f17ae69ee1cf6716bc4ee (11:26, pushed): the rise ends with speed, on the merge of
  main bdd47cf (5863ae0). Trees: src/stops/saturn 7f13c95306f08c785073d108e624e595858a9a22 (the PRE:
  eeacefbcf0098b624009de980c4621033f21a26e), public/assets/saturn 75fa372a9187c0eb07c296a431b846aeb3962279
  (equal to the PRE's).
- WHAT THE ENGINE READS from the rise (out/scratch/carryread.ts, film.ts carryOf): speed 2.2000 radii a
  second, 0.0001 degree from riseOut; rate 0.9735 radii a second squared, of it -0.6597 along riseOut (a
  brake), span 0.4 s, drift 0.08. The brake is 0.12 of the speed over the span; the engine's own test allows
  up to 7.5.
- THE SPEED OF THE LENS over the whole rise (seamout.ts, radii a second): 0.34 at 3806, 0.36 at 3810, 0.86
  at 3822, 1.46 at 3834, 1.84 at 3846, 2.15 at 3858, 2.36 at 3866, 2.42 at 3874 (its largest), 2.34 at 3882,
  2.24 at 3886, 1.47 at 3890 (the travel's own dip while the carried speed decays), 5.75 at 3898. It rises
  once and falls once inside the rise. The globe's radius in the picture falls in every frame: 524 px at
  3806, 392 at 3866, 305 at 3886, 285 at 3898.
- PROOF OF 91d6247 (/tmp/v/r45, job started 11:27):
  - path: "VERDICT: green. No number is over its limit." (numbers as in the block before.)
  - handover path: "saturn.dive every frame: pass", "saturn.rise every frame: pass".
  - rise pictures, the judge's whole window 3798 to 3896 + 1/2 (saturn-rise.md, 11:43): "VERDICT: green. No
    number is over its limit." "Largest level step: 0.05 at frame 3875 + 1/2 ..., limit 1.3." "Largest pop
    score: 1.15 from frame 3872 + 1/2 to the next, limit 1.2." "Largest change in place: 21.9 from frame 3873
    to 8 film frames later, most at pixel 1232, 692 ..., shown, not judged." "Largest change of the pattern
    alone: 0.25 from frame 3821 + 1/2 to 8 film frames later, most at pixel 1220, 852 ..., limit 0.45."
    From 3885 on the largest pop is 1.06 at 3895 + 1/2 (the PRE: 1.59, red, 11 frames over); the pop falls
    to 0.74 at 3891 where the picture is slowest and is back at 1.0 by 3895. Pops over 1.1: 1.11 at 3836,
    1.10 to 1.15 at 3870 + 1/2 to 3874 (the PRE had 1.12 to 1.17 at the same frames with the other course
    of the stars: the panel shows the faint stars of the flight and the ring's fine lines at the fastest
    part of the rise). Pattern over 0.2 only at 3818 + 1/2 to 3832 + 1/2 (0.20 to 0.25: the far ring
    coming out behind the night limb, low on the globe).
  - Looked at: rise_a (3798 to 3813), rise_b (3816 to 3840), rise_c (3844 to 3877), rise_d (3878 to 3896),
    3866 at full size, the pops and the changes panels, the right edge 3817 to 3828 at full size (the far
    ring comes out behind the night limb at 3820 and widens, cut by the limb, no fade), the moon 3842 to
    3850 at full size by half frames (it rises over the limb from 3844 + 1/2 to 3848, cut by the limb, no
    fade). The seam: the globe draws back through 3885 at one pace, nothing rests, nothing jumps.
  - measure (11:54): "PASS G5 saturn: 3465 hold invalid 0 coverage 0.514; 3567 dive invalid 0 coverage
    0.600; 3720 terrain invalid 0 coverage 0.725; 3866 rise invalid 0 coverage 0.464" and "PASS G17 saturn:
    3465 median 1.054 p25 0.918 over 71 tiles; 3720 median 0.945 p25 0.477 over 62 tiles".
- PRE 2 MAILED 11:46 (high): 91d6247 replaces 68b4561 for the third NAMED; NAMED promised when the rest is
  back, 12:40 UTC at the latest; if a red shows that I cannot cure, I name 68b4561 and say so.
- MAIN moved twice since the merge: 5cfbbf1 (status 230, Venus's warm list: kit/PROGRESS.md and
  src/core/warm.json) and 36970ce (Neptune's third named commit). Status 230: "Saturn's third by 13:00."
  I merge the newest main for the NAMED; my two picture trees stay those of 91d6247.
- MAIL 656 (about 12:01 UTC), word for word: "PRE 2 read: 91d62470b26f63decf5f17ae69ee1cf6716bc4ee replaces
  68b45619. The 13 jobs of the old PRE that were still waiting are withdrawn; no machine is spent on its rise
  from here. Your third and last NAMED by 12:40 UTC as you wrote; it goes into its round as it stands. Because
  the judged frame 3866 changes on purpose, show it beside the kept still in the NAMED (d186) and state the
  hold 3465 and the surface view 3720 as bytes against your last proof. Ruled today on the judge (MAIL 653):
  body() takes the globe's own scale, as your patch has it, so sky is no longer judged as the body at 3561;
  the limit stays."
- PROOF OF 91d6247, the rest (/tmp/v/r45):
  - gate (11:54): "PASS G11  every asset has a row or a recipe" and "PASS G15  at most 2 sets per frame;
    finished stops: saturn/web 274 MB, saturn/full 747 MB".
  - vitest (12:00): exit 0, 465 tests in 48 files.
  - finals: 3465 sha256 f4b3a39598b5e761fa1c45c9c3cf19836a621e6aa70a95453c64bbb654a2a963, equal to the byte
    to the PRE 68b4561 and to 1e4bfd4 and 2ab7243 (not to the reference 21f107a6: 32.2 percent of the pixels
    differ, largest 22, mean 0.325 of 255, as before). 3720 sha256
    33bb2086f66838b044eb2cb0fbba49ae51dd2f35fe6486186b885c1e466617b7, equal to the byte to the PRE 68b4561
    (1e4bfd4 had 408729eb; the reference 6c4e4e10 is the kept picture). 3866 sha256
    29ee4549b5020a02ac1095156b3b41cfad8cb39baae968ca8df5d3424b757add, 214 s, 64 shutter samples (3465 and
    3720 take 16: the lens is fast at 3866).
  - parity (12:07): "VERDICT: green. No number is over its limit." Mean 2.785 at 3720 (limit 12), coarse
    1.257 at 3720 (limit 3.2), block level -6.563 at 3866 (limit 12; the PRE: -6.722 at 3848), level -1.125
    at 3720 (limit 2.2).
  - head sample, 26 draft frames against the PRE's sample by bytes (12:10). Equal: 3330, 3350, 3370, 3389,
    3390, 3420, 3465, 3510, 3539, 3573, 3576, 3630, 3660, 3720, 3780, 3809, 3960. Differ: 3842, 3852, 3859
    (the rise, on purpose) and the travel 3885 (39.0 percent of the pixels, mean 3.47 of 255), 3890 (49.0
    percent, mean 14.97), 3900 (31.0 percent, mean 6.73), 3922 (0.12 percent, largest 6), 3950 (0.06
    percent, largest 7), 3959 (0.01 percent, largest 1). Why the travel differs to its end: carried() in
    src/director/film.ts adds speed x span x carryWay(s) and rate x span squared x carryBend(s) to the
    leaving pose, so the pose the travel leaves from stays carried on after the span and the travel takes
    the difference out towards its end; 3960 is equal again. At 3885 also my sky.lift.power.
  - 3866 at the final tier beside the kept still (3866_beside_kept.png), looked at whole and at full size in
    three crops. The globe is nearer and larger than in the kept still (radius 392 px here) and
    sharp; the far ring at the right, the globe's shadow on the ring, the moon over the limb and the sky are
    crisp. The near ring at the lower left is drawn out along the flight by the film's shutter: its fine
    lines stay lines, the grain between them is gone, and the nearest band in the corner is soft. The kept
    still has the whole ring crisp there (its lens was slower at 3866). This is the price of one flight
    through the seam: the fastest part of the rise is now 3874 (2.42 radii a second) and 3866 sits near it.
    No blur cure of my own (MAIL 311). Open as item 16 of the list.
- MERGED main 4885e4a (status 231 and d218, its progress file only) as 16bee4d. Trees of the head:
  src/stops/saturn 7f13c95306f08c785073d108e624e595858a9a22, public/assets/saturn
  75fa372a9187c0eb07c296a431b846aeb3962279, both equal to 91d6247's. No file outside my folders differs
  from main. tsc exit 0 on 16bee4d. Path on 16bee4d: "VERDICT: green. No number is over its limit.", equal
  from line 5 on to the report of 91d6247.
- NOT RUN on 91d6247 before the NAMED: G13, the picture parts of the handover tool (sides, flow), the dive
  pictures. The dive's code and numbers are the PRE's, where the dive pictures were green (level 0.01 at
  3576, pop 1.04 at 3578, pattern 0.41 at 3565, limit 0.45), and the sample frames 3573 and 3576 are byte
  equal. They run after the mail.
- THE OPEN LIST FOR THE THIRD NAMED, worst first, old numbers kept, 16 is new:
  16 the judged frame 3866: the near ring at the lower left is drawn out by the film's shutter (64 samples),
     the kept still is crisp there; the price of one flight through the seam, no blur cure of my own.
  10 pattern: dive 0.41 at 3565 at the pole (limit 0.45, thin; measured on the PRE, the dive is unchanged);
     rise 0.25 at 3821 + 1/2 (the far ring coming out behind the night limb).
  6  G17 at 3720: PASS 0.945 here (p25 0.477, 62 tiles), the machines have not read it yet.
  12 pops at the end of the rise and at the travel's take off: 1.15 at 3872 + 1/2 inside the rise (limit
     1.2, thin: faint stars of the flight and the ring's fine lines at the fastest part), 1.06 at 3895 + 1/2
     after it (was 1.59, red).
  2  the rest between the rise and the travel: the rest line reads 0.375 of the slower end (was 0.026), the
     lowest 3.36 px at 3889, now inside the travel while the carried speed decays; no limit yet.
  thin steps of the rise at rate 2 (limit 0.08): turn 0.073 at 3838 + 1/2, speed 0.070 over 8 at 3839 + 1/2.
  11 the last 70 frames of the surface view bend and do not fly straight on (ruled, d196, stays).
  15 the shade between the hold and the dive 3546 to 3556.
  13 the onset of the rise at 3810 (largest step of the eye from one capture frame to the next 0.05 at 3815,
     was 0.10 at 3811).
  1  the globe near the lens 3808 to 3836.
  14 dark limb pixels 3570 to 3577.
  5  the sawtooth wedge through the Cassini division 3630 to 3690.
  7  the ring's tone slides with the height 3840 to 3864.
  3  the moon cut by the limb about 3610 to 3614 (it leaves, it does not fade).
  4, 8 and 9 are closed.
- ON THE NAMED HEAD 2d54c49 itself (/tmp/v/r46): path "VERDICT: green. No number is over its limit.", equal
  from line 5 on to 91d6247's; tsc exit 0; parity (12:21) green with the same four numbers; finals 3465
  (12:23) and 3720 (12:25) with the same two sha256 as on 91d6247 and on the PRE.
- THIRD AND LAST NAMED MAILED 12:26 UTC (high): 2d54c492140ab79ed2c20004e8129ed2302647bf, branch
  agent/saturn-code, pushed and read back with git ls-remote. The mail is kept in /tmp/v/mail/named3_sent.md.
  In MAIL 508's order: the smooth lines (path, rise pictures, parity green as printed; the dive pictures
  named as NOT run on this state, with the PRE's green lines and why the dive cannot have changed), the
  frames that change outside my dive and rise (against the PRE: the travel 3885 to 3959 through main's
  carry, with sizes; against main: the far view 3352 and 3465, the surface view, the travel), the judged
  frames (3465 and 3720 as bytes against the PRE; 3866 changes on purpose, shown beside the kept still with
  what I see: the near ring at the lower left softened by the shutter), G5 and G17, the gate lines word for
  word, tests, the list worst first with the new item 16, what was not run. Attached: 3866 beside the kept
  still (full and half size), its lower left beside the kept still's, the rise's pops and changes panels,
  the seam sheet 3878 to 3896, the parity panel. Said in the mail: main had moved to 62ff7be (the judge's
  border cure and the globe's body), not merged in the named head, so my smooth lines are read with the
  judge before it.
- AFTER THE NAMED: main 62ff7be merged as f057cf9 (tools/smooth.ts, tools/smooth/path.ts, tools/smooth/made.py,
  tools/img/smooth.py, tests/smooth.test.ts, notes; my two picture trees unchanged). Job on f057cf9 with the
  new judge started 12:27 (/tmp/v/r47): dive pictures, rise pictures, the handover tool's picture parts, G13.
  I mail only if one of them is red (MAIL 520: only NAMED, a blocker, or an answer asked for).
- LOOKS pushed 12:14 (parity panel) and 12:27 (3866 beside the kept still, whole and lower left). Next by 12:57.
- MAIL 662 (about 12:38 UTC), the receipt of the third NAMED, in the Builder's words: "NAMED
  2d54c492140ab79ed2c20004e8129ed2302647bf on agent/saturn-code is verified on the remote: 21 files, all
  inside your three folders. saturn stays in handover.ownPath." Its proof tree is
  26f5ed3a27b2f0a68b3135b509916e5ccf754430 on builder/proof-sa3, built on the engine's proof tree d6b4b8e8
  ("the tree main becomes with the engine take") with the five harness files of main 62ff7be6 laid in. 27
  jobs out since 12:29; slice 1 of the dive is green. "This commit is your third. By d186 it goes into
  Saturn's round as it stands; red measures, if any, go in as severe issues." Frame 3866 "goes into the
  round named as your item 16." "Do not start a fourth commit. Mail me only if your own runs show G13 red,
  the handover's picture parts red or the dive's pictures red on 2d54c492. Keep pushing looks to your looks
  branch. Round work follows after the round's critics."
  So: nothing is pushed to agent/saturn-code until the round's work is ordered (this notebook is kept and
  committed here, and goes out with the round's fix); looks go on every 30 minutes; fixes are prepared and
  measured here, not pushed.
- OWN RUNS ON THE NAMED TREES WITH THE NEW JUDGE (f057cf9 = 2d54c49 plus main 62ff7be plus notes; /tmp/v/r47):
  - path (12:30, on 22aa54e): "VERDICT: green. No number is over its limit.", equal from line 5 on to
    91d6247's report.
  - dive pictures (12:46): "VERDICT: green. No number is over its limit." Largest level step 0.01 at 3576
    (limit 1.3); largest pop 1.04 from 3578 to the next (limit 1.2); pop of one block 2.14 from 3629 + 1/2,
    block column 9 row 7, shown, not judged; largest change in place 15.8 from 3606 to 8 film frames later
    at pixel 1736, 660, shown, not judged; largest change of the pattern alone 0.21 from 3596 + 1/2 at
    pixel 1212, 760 (limit 0.45; the judge before the border cure read 0.41 at 3565 at the pole); the
    ground beside it 3630 to 3641 + 1/2: change 8.0, pattern 0.10. Panels looked at: pops and changes.
  - rise pictures, the handover tool's picture parts and G13 follow in the same job.
- MEASURED AFTER THE NAMED, not mailed (only reds are mailed now):
  - the shutter at 3866 (out/scratch/smear3866.ts): the lens moves 2.354 radii a second (height 2.294,
    5.091 from the centre); points of the near ring in the lower left move 1.8 to 7.9 px while the shutter
    is open (5.6 px at pixel 100, 1000 and at 400, 1050, of it 5.5 and 4.8 across the ringlets; 7.9 px at
    1000, 1050). Lens speed 1.686 at 3840, 1.977 at 3852, 2.174 at 3859, 2.421 at 3874, 2.339 at 3882.
    Every cure of item 16 that I can see is a slower or a bent path, which MAIL 311 forbids without a ruling.
  - the palette of the lit ring at 3720, lower left crop, against the approved close image: approved mean
    rgb 152.7, 138.3, 124.3 (luminance 0.550, saturation 0.185, hue 10th, 50th, 90th percentile 21, 31, 50);
    mine 167.1, 150.2, 133.6 (0.599, 0.203, hue 23, 29, 38). Mine is about 9 percent brighter with a
    narrower range of hues; by eye the approved has a gritty grain and pink and slate bands, mine reads
    smoother with single bodies. Picture /tmp/v/r45/3720_beside_approved.png. Goes on the list as item 17.
  - main's d219 (kit/PROGRESS.md at 62ff7be): the engine's option handover.rise.pullBack { speed, over, from }
    is named, off by default, to be taken after rounds 41 and 42; each stop's builder sets its own value in
    its round's fix; smooth.path.minLeave is not set (proposal 0.07 of the slower end). My own carry
    (handover.rise.carry 2.2) gives 2.2000 radii a second along the way out and a rest line of 0.375.
- LIST ITEM 15 LOOKED AT AGAIN on the dive's draft frames of r47 (3538 to 3560 every frame, crop of the gap
  between globe and ring at full size, and the same with the levels times 5). Two things happen there, both
  by the place of the lens and neither by the clock:
  (a) the inner zone of the shaded sheet (the first 50 px outward of its inner edge) is see through in the
      hold, as in the kept hero, and turns solid while the lens comes 0.116 radii nearer to the globe than
      at the end of the hold (kept/set.ts dove over look.rings.shadeSolid[1]): its level falls from about
      21 to 10 of 255 between 3546 and 3558 and the sheet's inner edge shows as an arc from 3548 on;
  (b) the picture of the sky of the hold leaves with the distance from the hold's path (weight 0.984 at
      3546, 0.941 at 3550, 0.801 at 3556, 0.667 at 3560, 0 at 3585) and the film's own field comes up
      under it: in the gap a red cluster and a dozen stars show from 3546 on, and the open sky at the top
      right turns from the hold's blue white band to the film's warm one by 3570.
  The air of the stop (sky.heights) starts only at 3562, so the stars that show first are at the full
  exposure of the open sky. Possible cures for the round, none tried yet: the sheet solid in the hold too
  (changes the hold by about 10 of 255 in a zone of 60 by 250 px and shows the arc there, needs a ruling
  because the hold's bytes change); the solid over a longer distance (a slower slide); the stars the hold
  uncovers held down until the air starts. Looks: shade_c.png, gap_x5.png.
- LOOKS pushed 12:47 (5d78e230): dive changes and pops panels with the new judge, item 15 at full size and
  with the levels times 5. Next by 13:17.
- OWN RUNS ON THE NAMED TREES WITH THE NEW JUDGE, THE REST (f057cf9, /tmp/v/r47), all green, so no mail (MAIL 662):
  - rise pictures (13:01): "VERDICT: green. No number is over its limit." Largest level step 0.05 at 3875 + 1/2
    (limit 1.3); largest pop 1.15 from 3872 + 1/2 to the next (limit 1.2); pop of one block 12.03 from 3896,
    block column 10 row 7, shown, not judged (the travel's take off, the same number as on 91d6247); largest
    change in place 22.0 from 3873, shown, not judged; largest change of the pattern alone 0.24 from 3820 + 1/2
    at pixel 1228, 848 (limit 0.45; the judge before the border cure read 0.25 at 3821 + 1/2); the ground
    beside it 3798 to 3809 + 1/2: change 10.6, pattern 0.16. Panels looked at: pops and changes, as before.
  - the handover tool's parts (13:02, draft, sides, flow, path), as printed: "saturn.dive side difference at T:
    pass", "saturn.dive flow gap at T: pass", "saturn.dive every frame: pass", "saturn.rise side difference at
    T: pass", "saturn.rise flow gap at T: pass", "saturn.rise every frame: pass". Dive T 3589: side difference
    max 1, flow gap largest 0.008 px a frame. Rise T 3852: side difference max 1, flow gap largest 0.045 px a
    frame. The tool's shutter lines for the rise: 31 of 75 frames run with a shortened shutter, the shortest
    0.6181 at 3840; frame 3866 has the full shutter, blur most 11.21 px, blur centre 5.45, blur edge 10.83
    (the cap is 14 px).
  - G13 (13:06): "PASS G13 saturn: 0 of 83 frames over 0.02 soft (every 6th frame)".
- LOOKS pushed 13:02 (aec04fbe, 8 looks): 3720 beside the approved and the kept still, its lower left beside
  the approved's, the dive every third frame (two sheets), the rise panels. Next by 13:32.
- ITEM 15, THE SKY THROUGH THE DIVE, NUMBERS (out/scratch/skycourse.ts; r47 draft frames): the hold is flown at
  heights 2.228 (3390) to 2.414 (3541) over the ring plane, so the air of the stop (sky.heights upper 2.2)
  cannot start before the lens is under the hold's lowest height; it starts at 3562. The hold's sky picture
  has the share 0.937 at 3550, 0.583 at 3562, 0.160 at 3574, 0 from 3586; the gain of the film's field
  (skyGain) is 0.996 at 3562, 0.835 at 3574, 0.626 at 3586, 0.170 from 3625. So between about 3555 and 3595
  the film's warm field shows at up to about 0.8 of its open exposure and then sinks: mean rgb of the top
  left box (0, 0 to 500, 160 of the 1920 frame) 21, 33, 41 at 3538 (the hold's blue), 45, 41, 36 at 3568
  (warm, the brightest), 18, 20, 23 at 3586, 7, 11, 16 at 3628. The kept still at 3567 has 32, 36, 37 in the
  same box. A sky whose tone goes blue, warm, dark in three seconds; every part of it by distance or height.
  Possible cure, not tried: the air of the stop follows the union of the height and of the distance from the
  hold's path (air = low + (1 - low) * (1 - hero)), so the hold's sky hands to the skim's sky and the film's
  field never comes up between; the price is the judged frame 3567, whose sky would be darker and evener
  than the kept still's.
- ITEM 16, WHAT THE SMEAR AT 3866 IS MADE OF (out/scratch/smearsplit.ts; shutterFraction 0.5): in the lower
  left the move of a ring point while the shutter is open is, lens moving with the aim held against aim
  turning with the lens held: pixel 100, 1000: (6.8, -2.4) and (-4.7, -2.8), together (2.1, -5.2), across the
  ringlets 5.5 px; pixel 400, 1050: (3.6, -2.7) and (-4.3, -2.9), across 4.8 px; pixel 1000, 1050: (-1.8,
  -2.1) and (-4.2, -3.0), across 5.4 px. At 3874: across 7.4 px at 100, 1000 with the aim turning only 0.05
  degrees. So the smear is the lens pulling away at 2.35 radii a second, not the turn of the aim; nothing in
  the look can take it out. It stands for the round as named.
- ITEM 17, THE RING AT 3720 AGAINST THE APPROVED, MEASURED (tool /tmp/v/t17/pal.py: the box 0, 380 to 960, 1080
  of the 1920 frame, pixels over 0.12 luminance; bands by the percentile of the luminance):
  - approved: luminance mean 0.511, 10th, 50th, 90th, 99th percentile 0.242, 0.505, 0.777, 0.912, share of
    white pixels 0.0003; red over green and blue over green by band: darks 1.044, 0.932; low 1.085, 0.900;
    mids 1.115, 0.892; high 1.118, 0.891; bright 1.098, 0.907; top 1.070, 0.924.
  - named: mean 0.563, percentiles 0.287, 0.568, 0.837, 0.977, white 0.0083; darks 1.118, 0.912; low 1.129,
    0.894; mids 1.133, 0.884; high 1.121, 0.880; bright 1.081, 0.887; top 1.018, 0.941.
  - the kept still reads as the approved (0.512; 0.252, 0.502, 0.777, 0.887).
  - by region: the near A ring (lower left): approved luminance 0.453 (5th and 95th percentile 0.193, 0.735),
    contrast under 31 px 0.144, under 5 px 0.106; named 0.506 (0.301, 0.696), contrast 0.088 and 0.056. The B
    ring: approved 0.630, contrast 0.121 and 0.093; named 0.652, 0.111 and 0.083. The lit globe and the sky
    are close (globe 215, 191, 148 against 224, 191, 144; sky 7, 10, 15 against 8, 12, 17).
  So mine is a tenth brighter on the ring, its highlights clip to yellow white at the outer edge of the B
  ring, its dark ringlets are brown where the approved has grey, and the near A ring has about 0.6 of the
  approved's ringlet contrast (the film's shutter, 9.03 px at 3720, takes part of it).
  - WHY: at 3720 the lens is 0.396 over the plane and the nearest ring in frame is 0.67 to 1.06 away. The
    model's own light shows only within handover.kept.reach (0.6 to 1.3 from the lens, by the logarithm): its
    share is 0.9 at the bottom edge, 0.6 at row 900, 0.35 at row 800 and under 0.1 above row 700. The rest of
    the frame is the far look, the hero's ring profile with the hero's tone. So the palette of the skim is
    the hero's, and the near numbers of skim.json light reach only the bottom rows.
  - TRIAL t1 (final 3720, light.rings near 0.85 to 0.77): mean 0.558, percentiles 0.279, 0.562, 0.834, 0.976:
    one hundredth. The gain of the model's own light alone does not carry it.
  - PLAN for the round, if the palette is named: a tone of the sheet near the lens (level, the depth of the
    darks, their grey) that holds for the far look and the model's own light alike, weighted by the distance
    from the lens and by the height (nothing of it above the heights where the kept set draws, so the dive's
    handover, the hold and the travel keep their bytes); numbers in skim.json. To be tried and measured here.
- OWED PROOFS STARTED 13:14 (/tmp/v/r48, the worktree at f057cf9): the review tier frames 3581 to 3597 and 3844
  to 3860 (every frame across both handovers), then 3567 at the final tier for the pair with the kept still.

## 13:14 to 13:30 UTC: main took the engine pieces (MAIL 670), merged here and not pushed; item 17 gets a trial

- MAIL 670 (13:25, to every builder, no answer needed): main is c8888d579e98130bd2d7c54e34d83f450fb1a164 (the
  engine take, 31 files: the far Sun from code, the shares by height in the handover, the globe's cap cure;
  2bc36ce6 on top of it is a status). Standing: merge origin main at the next commit, run the tests on the
  merge, name commits only on top of it. A commit named before the take is taken as it is (my three folders).
  Rounds 41 and 42 start on this main; no stop is taken onto main between their start and their pack. One
  shared test (tests/globe-cap.test.ts, "brings a colour level in by the texels of its parent") ran over its 5
  second limit on a loaded machine: if seen, run that file alone, report both results, do not touch the test.
- MERGED HERE, LOCAL ONLY (MAIL 662: no fourth commit): 66de92e "Merge main 2bc36ce into agent/saturn-code"
  on 8598286 (notebook) on 5dadc06 on the remote head 22aa54e. No file outside my three folders differs from
  main 2bc36ce; my trees are the named ones (src/stops/saturn 7f13c953, public/assets/saturn 75fa372a). Against
  the Builder's proof tree 26f5ed3 (builder/proof-sa3) the merge differs only in this notebook,
  assets-src/shared/HARNESS-NOTES.md, kit/PROGRESS.md and tests/weights.test.ts: in src, tools and config it is
  the tree the machines run. tsc on it: no output.
- REVIEW TIER ACROSS THE DIVE'S HANDOVER, every frame 3586 to 3591 (the worktree at f057cf9, 16 samples, 72 to
  94 s a frame; /tmp/v/r48/rev): the mean level of the whole frame goes 70.81, 70.05, 69.28, 68.53, 67.80,
  67.10 (steps -0.76, -0.77, -0.75, -0.73, -0.70), the mean change between two frames 10.29, 10.15, 10.03,
  9.91, 9.81: no step at T (3589). Looked at as a sheet: one picture. The rise's frames 3849 to 3855 and 3567
  at the final tier follow in the same job.
- LOOKS pushed 13:26 (688f5f8f, 8 looks): that sheet and the pair of trial t1. Next by 13:56.
- ITEM 17, WHERE THE DIFFERENCE LIES (tool /tmp/v/t17/rows.py: the left half by rows of 60 px, lit pixels):
  the approved's mean luminance by row from 480 down is 0.499, 0.577, 0.593, 0.581, 0.560, 0.533, 0.500,
  0.467, 0.440, 0.434; the named frame's 0.582, 0.605, 0.639, 0.650, 0.628, 0.589, 0.541, 0.487, 0.450, 0.419.
  So the bottom rows, where the model's own light shows, are right, and the rows 600 to 840, where the far
  look shows, are 8 to 12 percent too bright. The 95th percentile of those rows is 0.93 to 0.95 against the
  approved's 0.83 to 0.87 (in the light before the film's curve: 2.55 against 1.27, a factor of two), the
  darkest 15 percent have red over green 1.12 to 1.14 against 1.02 to 1.10, and the contrast under 5 px is
  0.097 in every row against 0.12 to 0.14.
  - Why no law by angle or by distance can do it: the cosine of the view to the plane's normal is 0.287 to 0.67
    over the ring in the hold (out/scratch/mu.ts) and 0.28 to 0.58 in the rows 700 to 1080 of 3720, the same
    angles; only the rows above 700 lie under the hold's range. The nearest ring point in frame is 3.55 away in
    the hold, 1.87 at 3601 and 0.67 at 3720, but the far rows of 3720 are 3 to 5 away, as far as the hold's.
    A weight that is the union of both leaves a band of the hold's tone between a toned far part and a toned
    near part in the frames around 3616 (weight 0.08 at cosine 0.26 against 0.71 and 0.46 beside it).
  - So the trial is by the height of the lens: skim.json handover.kept.skim, heights 0.6 to 0.93 (the far
    look's own window; all of the terrain 3630 to 3809 lies under 0.6, so the tone holds still through the
    surface view and comes and goes in the last 21 frames of the dive and the first 21 of the rise). On the
    far look in sheet.ts keptSheet only, in a guard loop, so nothing runs where the kept set draws: the
    ringlets stand out more from their zone (a power on the profile at the pixel over the profile 24 times
    wider), each colour is held under a ceiling (c g / (1 + c g / ceiling)), and the thinnest ice loses a
    share of its colour. Predicted on the named final by the film's curve and its inverse
    (/tmp/v/t17/sim.py; gain 0.94, ceiling 3.4, grey 0.7 under 0.12 to 0.32): mean 0.515, percentiles 10, 50,
    90, 99: 0.280, 0.512, 0.765, 0.905 (the approved 0.511; 0.242, 0.505, 0.777, 0.912). The darks are left
    to the power on the ringlets. It is a tone that comes by height (mail 315 wanted distance; plan F allows
    height): to be judged on consecutive frames of the dive before it is offered.
  - The code is in the working tree only (model.ts, sheet.ts, skim.json), not committed.

## 2026-11-24, 13:40 to 14:55 VM: item 17, the trials T2 to T7d (working tree only, nothing pushed to the branch)

State: NAMED 2d54c492 stands (mail 662: no fourth commit, mail only for reds of my own runs). Local head 41cac1f
on the merge 66de92e (mail 670), not pushed. r49: the finals of 3465 and 3720 keep the named bytes on the merge.

CORRECTION to the entry above: the line "in the light before the film's curve: 2.55 against 1.27" has wrong
values (sim.py read the picture as the film's curve alone; the film is toSrgb(filmic(light x exposure x
vignette)), so a picture value is decoded from sRGB first). By /tmp/v/t17/fit.py (right transfer; the box x 0 to
1100, y 560 to 1080, quantile bands of the light): the band 90 to 95 is 1.05 in the named frame against 0.54 in
the approved, 95 to 98 1.73 against 0.71, 80 to 90 0.57 against 0.41; the bands 40 to 70 are equal within 8
percent; 5 to 30 are 0.063 to 0.12 against 0.049 to 0.099. sim.py is not to be used.

The measures (all at 3720, final tier, against references/approved/saturn-close.jpg; tools in /tmp/v/t17):
- pal.py, the box x 0 to 960, y 380 to 1080, lit pixels: mean, p10, p50, p90, p95, p99 of the luminance and
  the share of white pixels. Approved 0.511, 0.242, 0.505, 0.777, 0.827, 0.912, 0.0003. Named 0.563, 0.287,
  0.568, 0.837, 0.910, 0.977, 0.0083.
- rows.py, the left half by rows of 60 px from 480 down. Approved 0.499, 0.577, 0.593, 0.581, 0.560, 0.533,
  0.500, 0.467, 0.440, 0.434. Named 0.582, 0.605, 0.639, 0.650, 0.628, 0.589, 0.541, 0.487, 0.450, 0.419.
- patch.py, three patches (the approved's composition differs a little, so the boxes differ): the A ring far
  (approved x 0 to 200, y 600 to 900; frame x 0 to 250, y 700 to 900): approved 0.438 (sd 0.147, red over
  green 1.075 to 1.085), named 0.543 (0.091, 1.13). The B ring (approved x 800 to 1100, y 600 to 750; frame x
  700 to 1000, y 650 to 800): approved 0.702 (sd 0.089, darkest tenth 0.536, brightest tenth 0.846, red over
  green 1.154 down to 1.086), named 0.760 (0.136, 0.510, 0.965, 1.187 down to 1.022: its top is white). The
  near ring (x 0 to 500, y 950 to 1080 in both): approved 0.462 (sd 0.142), named 0.452 (0.125).

The trials before T7 (all dropped):
- T2: the plan of the entry above with the wrong transfer. Bad still (the ceiling far too high).
- T3, T4: the far look in sheet.ts only, share by the height over 0.6 to 0.93 (the far look's own window): the
  thin zones (ringThin of the model's map) times 0.75, their ringlets raised by a power 0.8, a ceiling 0.75 on
  the light, grey 0.25 dense and 0.45 thin. Still at 3720: 0.542, p50 0.537, p90 0.803, p95 0.850, p99 0.912,
  white 0.0014. MOTION BAD: the whole change comes in the 21 frames 3606 to 3627 in a view that hardly moves
  (4.8 percent of it a frame, 7.4 in the rise); on the sheet the A ring is seen to darken (look "T4 slide",
  pushed 14:17 and labelled bad).
- T5, T6: the same law by the distance from the lens (1.0 to 1.5, then 1.0 to 2.0 planet radii). No change in
  the dive's wide view, but mail 374 (c) rules exactly this out ("by a grade of the whole frame by the lens's
  height (the stop's air), not by distance from the lens"): a tone by distance is a tone that slides through
  the frame as the lens moves on (the old item 7). T5's diff is kept at /tmp/v/t17/t5.diff only as a record.
- A law by the phase angle was looked at and set aside: Sun, ring point, lens is 74 to 123 degrees in the hold
  and 142 at 3720 (out/scratch/phase.ts, phasemax.ts), but it would darken the left of the ring in the dive.

WHERE THE DIFFERENCE REALLY LIES (two instrument renders of 3720 at the final tier, the mix by distance
switched off through handover.kept.reach, which is back at [0.6, 1.3]):
- the model's near light alone (reach [50, 100]): the A ring far 0.437 (the approved 0.438) with red over green
  1.07 to 1.08 (the approved 1.075 to 1.085); the near ring 0.417 (0.462); the B ring 0.761 with a white top
  (0.980, red over green 1.003) against 0.702.
- the far look alone (reach [0.01, 0.02]) is the tone of the hold's picture: its A ring is far brighter than the
  near light's (the named mix reads 0.543 in the A patch), its B ring 0.76 with a white top.
- So in the named frame the far tone and the near light are not one look in the A ring, and both have the B
  ring's top in the white. The near light of the A ring is already the approved's. That is why a curve on every
  ring pixel alike (T7b) put the lowest rows too dark (0.414, 0.370, 0.340 against 0.467, 0.440, 0.434).

T7d, THE CURE AS IT STANDS IN THE WORKING TREE (new file src/stops/saturn/grade.ts; sheet.ts, model.ts,
kept/rings.ts, kept/set.ts, skim.json light.grade):
- Driver: the height of the lens over the ring plane alone, share = 1 - smooth(log(height / 0.6) / log(2.2 /
  0.6)), the two heights of the air of the stop (skim.json sky.heights), absolute value of the height. Every
  height of the hold (2.228 to 2.414), of the approach (2.379 at 3380 and above) and of the way out (2.29 at
  3866, 2.77 at 3880) lies above 2.2: share 0 there, and the calls sit in guard loops, so those frames keep
  their bytes. Every height of the surface view (0.587 at 3630, 0.350 at 3760, 0.490 at 3808) lies under 0.6:
  share 1 through the whole skim, nothing changes during it. Between: 0.005 at 3567, 0.015 at 3570, 0.054 at
  3576, 0.24 at 3588, 0.55 at 3600, 0.63 at 3602.5, 0.74 at 3606.5, 0.86 at 3612, 0.98 at 3620, 1 from 3627;
  rise 1 to 3819, 0.76 at 3832, 0.61 at 3836, 0.44 at 3840, 0.09 at 3852, 0.007 at 3860, 0 from 3863.5. The
  fastest pace is 2.8 percent of the grade a frame in the dive (3600 to 3606) and 4.0 in the rise (3836 to
  3840). The air of the stop itself (plan.lowAt, the root of this share) was tried on paper and not used: its
  root starts with a kink (1.5 percent a frame from the first frame under 2.2).
- The same GLSL in the kept set's ring shader (on col after the hero picture's inner map, radius rq) and in the
  model's far look (keptSheet, on c after the mottle, radius r), so the two scenes hold one tone through the
  handover: outward of the dense ring (a ramp over the radii 1.94 to 2.063, rings.json warpHero, it lies in the
  division) the ice darker than the pivot 0.6 sinks by the power 0.4 of its light over the pivot; the light is
  held under the ceiling 0.75 (c / sqrt(1 + (l / 0.75)^2)), its colour kept; the ice loses a share of its
  colour, 0.2 in the dense ring and 0.55 in the thin zones.
- The model's near light gets only the ceiling (iceHeld), on the lit ice before the globe's shadow.
- 3720 final with it (sha 566235ab...): pal 0.522, 0.280, 0.511, 0.785, 0.831, 0.864, white 0.0001 (approved
  0.511, 0.242, 0.505, 0.777, 0.827, 0.912, 0.0003). Rows 0.545, 0.565, 0.595, 0.600, 0.575, 0.537, 0.493,
  0.444, 0.415, 0.395. A ring far 0.454 (sd 0.104), red over green 1.08. B ring 0.713 (sd 0.109), darkest
  tenth 0.495, brightest 0.859, red over green 1.158 down to 1.062. Near ring 0.417 (sd 0.118).
- Still wrong in the still: the lowest three rows are 0.02 to 0.04 darker than the approved (the near light as
  it was, minus 0.006 from the ceiling); the brightest hundredth is 0.864 against 0.912 (the ceiling cuts the
  tail); the A ring's contrast is 0.104 against 0.147; the row 480 to 540 is 0.545 against 0.499.
- Pictures: /tmp/v/t17/t7d_three.png (approved, named, trial), t7d_left.png, t7d_right.png.
- NOT YET DONE at this line: the motion on consecutive frames (draft list d7: 3556 to 3632 and 3808 to 3868),
  the proofs (3465 and 3866 byte equal to the named finals, 3567 beside the kept still, G17 at 3720, the dive's
  and the rise's pictures, the handover's parts, G13, smooth, vitest on the merge).

## 2026-11-24, 14:55 to 15:30 VM: T7d fails G17, the ceiling retuned (T7e), working tree only

State unchanged: NAMED 2d54c492 stands, nothing pushed to the branch, the code of the trial is in the working
tree only (backups /tmp/v/t17/t7d.diff and grade.ts.t7d for T7d).

T7d, THE MOTION AT THE DRAFT TIER (list d7: every frame 3556 to 3632 and 3808 to 3868):
- Mean level of the whole frame (0 to 255) by frame through the change of set: steps -0.75, -0.70, -0.67,
  -0.63, -0.58, -0.53, -0.49, -0.43, -0.42, -0.39, -0.36 over 3598 to 3609; no step at 3602 to 3607. Looked at
  every frame 3601 to 3608 at full size (crop x 0 to 760, y 440 to 1000): one picture, ringlets hold their
  places, the A ring a little greyer in each frame.
- The mean of the lit pixels falls 153.7 to 135.3 over the dive (the named frames 3600 to 3632 hold 148.2 to
  149.0): that fall is the grade, 0.3 to 0.57 levels a frame, largest change of step 0.196 at 3582.

T7d FAILS G17 AT 3720 (final tier, no grain, tools/measure/g17.py through /tmp/v/g17map.py): median 0.779, 30
of 62 tiles at or over 0.8 (31 needed). The named commit on the same tool: 0.945, 35 of 62 (render
/tmp/v/t17/namedg_3720.png, sha 250bab4c...). By tile the energy of the band is 0.65 to 0.70 of the named in
every tile of the dense ring (the ceiling at 0.75 flattens the bright ringlets, and their edges are the band's
energy there) and 1.2 to 1.7 in the far thin zones (the toe). So T7d is not to be offered.

WHY A GAIN BY THE TONE OF THE ZONE CANNOT REPLACE THE CEILING: the white top is made of narrow ringlets whose
light is 4 and more against 0.4 to 0.5 for their zone (the film's input in the patch x 700 to 1000, y 650 to
800: p50 0.43, p90 1.63, p99 4.58). A gain read from a low pass of the tone leaves them white (simulated: white
share 0.03). Only a curve on the pixel holds them, and any curve on the pixel takes band energy with it.

THE SIMULATOR (/tmp/v/t17/sim2.py, sim4.py, sim5.py): from the two renders without grain (named and T7d) it
solves, pixel by pixel, the light before the ceiling and the factor of the toe, applies another ceiling or toe
and measures G17 and the tone. The shader's light is the film's input over 0.88 in the dense ring (0.68 to
0.99 across the frame: exposure, vignette). It reproduces T7d to the digit and predicted T7e within 0.03 of G17
(0.908 against 0.877 rendered). Read from it: the ceiling 0.75, 0.85, 0.95, 1.05, 1.2 gives G17 0.779, 0.819,
0.862, 0.898, 0.941 and the brightest hundredth of the box 0.864, 0.881, 0.895, 0.906, 0.919 (approved 0.912);
a sharper knee (power 4) keeps 0.03 to 0.05 more G17 but leaves the dense ring's body as bright as the named
(p90 0.818 to 0.841 against 0.777); a square root shoulder or c / (1 + l / c) keeps G17 at 0.90 to 0.96 but
lets the brightest tenth of the dense ring back to 0.93 to 0.98 (white ringlets again).

T7e, THE TRIAL AS IT STANDS: skim.json light.grade toe 0.5 (was 0.4), ceiling 1.0 (was 0.75); nothing else
changed against T7d.
- 3720 final without grain (sha ddd15110...): G17 median 0.877, 33 of 62 tiles at or over 0.8.
- 3720 final (sha 5f9a9ba1...), the box x 0 to 960, y 380 to 1080, mean, p10, p50, p90, p95, p99, white share:
  T7e 0.523, 0.268, 0.504, 0.807, 0.860, 0.899, 0.0001; approved 0.511, 0.242, 0.505, 0.777, 0.827, 0.912,
  0.0003; named 0.563, 0.287, 0.568, 0.837, 0.910, 0.977, 0.0083.
- Rows of 60 px from 480 down, the left half: T7e 0.546, 0.567, 0.597, 0.602, 0.576, 0.536, 0.491, 0.442,
  0.414, 0.396; approved 0.499, 0.577, 0.593, 0.581, 0.560, 0.533, 0.500, 0.467, 0.440, 0.434. The contrast
  under 5 px by row: T7e 0.103 to 0.117, approved 0.115 to 0.139, named 0.096 to 0.100.
- Still wrong in the still: the three lowest rows are 0.025 to 0.04 darker than the approved and their bright
  ringlets 0.04 to 0.085 darker (the far look has a share down to 0.6 planet radii from the lens, and it is
  toned like the near light there); the row 480 to 540 is 0.047 brighter; p90 and p95 of the box are 0.03
  over; the bright rim of the dense ring along the division is still the brightest line of the frame; the
  approved's pink and blue grey ringlets are not in my ring.
- Pictures: /tmp/v/t17/t7e_three.png (approved, named, trial), t7e_left.png (approved beside the trial, the
  left half at full size).

## 2026-11-24, 15:30 to 16:25 VM: T7e in motion and in proof, MAIL 703, main ed003c7 merged here, the tone by material

STATE: the trial T7e (the grade of the rings by height, grade.ts, skim.json light.grade toe 0.5, ceiling 1.0)
is still only in the working tree. Backups: /tmp/v/t17/t7e.diff, grade.ts.t7e. Branch head here 501914c (the
merge of main ed003c7, local, not pushed); remote head of the branch 22aa54e; NAMED stays 2d54c49.

MAIL 703 (16:21): take batch 3 is on main (ed003c70) with my third commit 2d54c492; round 44 (Saturn) runs on
it; the critics' issues come when the round closes. Standing from it: merge main before the next commit (merge,
never rebase, never force); work on my branch only, on what my own report and looks still show red or wrong,
each change by height, distance or angle and never by the clock, the judged hold and surface frames keeping
their bytes unless I say exactly what changed; do not name a commit until asked for the round 2 build; no
answer needed unless main breaks my branch.
- Done: origin main ed003c7 merged as 501914c. Outside my folders 186 files came in. In my folders only the
  notebook differed: main holds the notebook of the named commit (byte equal to 2d54c492's), every line of it
  is in mine (0 lines only there, 324 only here), so the conflict was settled by keeping mine. Trees after the
  merge: src/stops/saturn 7f13c953 and public/assets/saturn 75fa372a, the named ones. package.json and the
  lock did not change against 66de92e. Tests on the merge: still to run (after the proof job, not beside it).

T7e IN MOTION, draft, every 6th frame and the frames around the largest steps (d8 against the named frames n7
and d0; lit mean of 255): the dive differs by 0 up to 3562, 0.05 at 3568, 0.24 at 3574, 0.67 at 3580, 1.47 at
3586, 3.20 at 3592, 6.09 at 3598, 9.42 at 3604, 12.06 at 3610, 13.75 at 3616, 14.54 at 3622, 14.59 at 3628 (all
darker). Largest step of the mean from frame to frame 0.626 at 3599 (named 0.431 at 3578), of the median 1.218
at 3598 (named 0.709 at 3598); largest change of step 0.188 at 3582 (named 0.197 at 3582). The rise differs by
4.42 at 3808, 5.97 at 3820, 4.43 at 3832, 2.44 at 3838, 0.78 at 3844, 0.15 at 3850, 0 from 3862; largest step
0.979 at 3861 (named 0.980 at 3861: the flight's own). Sheets and full size pairs (dive 3598, 3602, 3606, 3612;
rise 3836, 3838, 3840) looked at: one picture, the ringlets hold their places, the tone sinks evenly.
T7e FINALS: 3465 (sha f4b3a395) and 3866 (sha 29ee4549) are byte equal to the named finals; 3567 (sha 3e8148e7)
differs from the named final by 1 of 255 in 8.2 percent of the pixels and by 2 or more in none (the share of
the grade is 0.005 there). So with T7e the judged hold keeps its bytes, the judged surface frame 3720 changes
on purpose, the judged dive frame changes by one level at most and the judged rise frame keeps its bytes.

PROOF JOB r50 on the T7e working tree (job_t.sh, started 15:58:30, engine of 66de92e): so far
- G5 pass; G17 pass: 3465 median 1.054, p25 0.918 over 71 tiles; 3720 median 0.877, p25 0.483 over 62 tiles
  (named 0.945; limit 0.8).
- handover parts sides, flow, path: all six lines pass; dive T 3589 side difference max 1, flow gap 0.008 px a
  frame; the table of the dive is the named one.
- the pictures of the dive and of the rise, G13, path, parity and the gate are still running.

A CORRECTION OF MY OWN READING. I wrote that the dense ring's lanes stand out too much at 3720 (patch x 700 to
1000, y 650 to 800: sd 0.118 against 0.089). That patch is not one material in my frame: its upper right
corner lies at ring radius 1.4 (my inner B ring and C ring, tone 0.57 to 0.62), where the approved shows bright
ring all over. By octave bands the whole excess of that patch is in the tone wider than 32 px (0.0438 against
0.0080). In a clean zone (my radius 1.62 to 1.92, x 560 to 1300, y over 640, the approved bright there) the
numbers are: approved mean 0.703, sd 0.113, percentiles 1, 10, 50, 90, 95, 99: 0.373, 0.556, 0.715, 0.835,
0.865, 0.931; T7e 0.736, 0.115, 0.475, 0.567, 0.749, 0.880, 0.892, 0.902; named 0.772, 0.133, 0.492, 0.583,
0.777, 0.949, 0.969, 0.987. Bands 0 to 1, 1 to 2, 2 to 4, 4 to 8, 8 to 16 px: approved 0.0661, 0.0330,
0.0264, 0.0159, 0.0100; T7e 0.0668, 0.0329, 0.0201, 0.0207, 0.0163. Colour over luma: approved 1.089, 0.986,
0.878; T7e 1.083, 0.987, 0.882. So in the dense ring T7e has the approved's contrast and colour; what is left
is the level (0.03 over from the median up) and a flat top (the brightest tenth sits under the ceiling at 0.88
to 0.90, where the approved runs on from 0.835 to 0.931).

THE COMPOSITIONS DIFFER, so a box fixed on the frame mixes materials. The division by row (centre x / width in
px, rows 640, 700, 760, 820, 880, 940, 1000, 1060): approved 322/137, 407/107, 479/125, 560/148, 649/169,
744/193, 845/217, 940/228; mine 384/83, 447/95, 526/108, 619/122, 724/137, 839/152, 964/169, 1098/187. Mine
lies 40 to 160 px to the right and is 20 to 60 px narrower. The camera of 3720 is ruled (d196, to the byte), so
this stays. Tool for the tone by material, each picture cut by its own division: /tmp/v/t17/matzones.py.
- A ring, rows 640 to 800, 800 to 950, 950 to 1080, mean: approved 0.430, 0.438, 0.437; T7e 0.424, 0.412,
  0.379; named 0.547, 0.484, 0.410. Colour over luma, far rows: approved 1.070, 0.988, 0.913; T7e 1.075,
  0.985, 0.926. So the far A ring fits; toward the lens my A ring sinks by 0.045 where the approved stays level.
- At one ring radius the near rows are darker than the far rows (T7e, radius: far, middle, near rows): 2.07:
  0.54, 0.54, 0.49; 2.17: 0.39, 0.38, 0.34; 2.25: 0.47, 0.44, 0.41; 2.27: 0.52, 0.48, 0.44 (named 2.17: 0.53,
  0.46, 0.37). The share of the far look in those rows is 0.8 to 0.9, 0.4 to 0.5 and 0.1 to 0.2. So the near
  light of the thin zones is still 10 to 35 percent under the far tone in light: ruling (c) is not yet met in
  full there. The near light's level is light.rings near 0.85 times the thin tint (luma 0.907).
- B ring, same rows, mean: approved 0.704, 0.695, 0.662; T7e 0.747, 0.730, 0.689; named 0.781, 0.767, 0.724.

SIMULATORS (predictions from the named and T7d finals without grain; G17 comes out about 0.03 high; the top
twentieth of the dense ring is not to be trusted: those pixels are clipped in the named final and under the
ceiling in T7d, so their light is not known):
- sim6, a grade of the whole frame: an exposure of 0.75 fits the ring's mean but leaves the dense ring's top
  white (0.948 against 0.846), darkens the near corner (0.380 against 0.462) and the globe (0.725; the
  approved's globe patch 0.823, mine 0.785); a ceiling on the whole frame fails G17 (0.739). This is the
  measured reason the grade acts on the rings by zone and not on the whole frame; to be said when reporting.
- sim11 to sim13, an evening of the dense ring by the light of a lane (the profile at a wider footprint, by
  ring radius): with a lane of 0.01 radii, pivot 0.40, power 1 the bands of 4 to 16 px come to the approved's
  (0.0158, 0.0098) and G17 rises to 1.04 (38 tiles), the median fits (0.716), but the brightest tenth stays at
  the ceiling (0.88 to 0.90) and the fine bands rise (0.0791, 0.0389). The radial light of the outer B ring at
  0.02 radii is level within a tenth (0.42 to 0.52): there are no broad lanes to even, the contrast is in
  ringlets of 0.005 radii.
- sim14, a shoulder by a power above a pivot in the dense ring: a fit of the median and the 90th percentile
  (pivot 0.33, power 0.4) takes G17 to 0.82 with 31 tiles, the limit. Any curve that takes the dense ring to the
  approved's distribution takes fine energy from the tiles that carry the median of G17.
- sim9, colour by a pivot in the thin zones: gives the approved's spread of hue in the lanes at k 1.4, with a
  yellow line at the division's edge unless the difference is clamped.

WHAT I TAKE FROM IT FOR THE NEXT TRIAL (T8), in this order, each by height and in both scenes alike:
1. the near light of the thin zones up to the far tone (light.rings or the thin tint), so the A ring holds
   its level toward the lens as in the approved (rows 950 to 1080: 0.379 against 0.437);
2. the dense ring 0.03 down from the median up without a flat top (a gain with a higher ceiling, or a shoulder
   with a mild power), G17 measured with every step;
3. the spread of hue in the thin zones (the pivot of sim9, clamped).
Looks pushed: 15:36 (fea14fd1), 16:11 (c1284c8b).

## 2026-11-24, 16:25 to 17:00 VM: proof job r50 on trial T7e is green on every line

r50 = the working tree of trial T7e (grade.ts with the toe of the thin zones, one ceiling on the far look and
the near light, the loss of colour) on the engine of 66de92e, all through the harness, in /tmp/v/r50:
- G5 pass, G17 pass: 3465 median 1.054 (71 tiles), 3720 median 0.877 (62 tiles; named 0.945).
- Handover picture parts: all six lines pass, dive T 3589 side difference max 1, flow gap 0.008 px.
- Dive pictures (draft, rate 2, 228 frames): green. Level step 0.02 at 3576 (limit 1.3; named 0.01), pop 1.04
  from 3640 (limit 1.2; named 1.04 from 3578), pattern 0.29 from 3601, most at pixel 1748, 952 (limit 0.45;
  named 0.21 from 3596 + 1/2), change in place 16.6 from 3599 + 1/2 (named 15.8). So the grade coming in by
  height costs 0.08 of the pattern measure: item 10 is worse by that much with T7e.
- Rise pictures: green. Level step 0.05 at 3875 + 1/2, pop 1.15 from 3872 + 1/2, pattern 0.25 from 3820 + 1/2
  (named 0.24), change in place 22.0 from 3873: as named within 0.01.
- G13: 0 of 83 frames over 0.02 soft. Path: green (the same numbers as named: the grade does not touch the
  flight). Parity: green, largest mean difference 2.818 at 3720 (limit 12), at one 8th 1.334 (limit 3.2), block
  level -6.563 at 3866 (limit 12), whole frame -1.206 at 3720 (limit 2.2).
- Gate G11 and G15 pass (saturn/web 274 MB, saturn/full 747 MB). tsc clean on the merge 501914c with T7e.
I looked at the dive's and the rise's panels of changes and the dive's panel of pops: nothing new against the
named commit except the ring going from the warm cream of the hold to the grey cream of the skim between 3588
and 3620, which is the grade by height.

A MECHANISM I HAD NOT COUNTED (read in sheet.ts and ice.ts, not yet measured): near the lens the grains carry
grains.json share 0.15 of the sheet's optical depth where the counted levels show whole; the sheet is thinner
by that much and lies in the shade of the grains (exp(-taken / mu0)). In a thin zone the light follows the
depth, so the sheet loses 15 percent and the shade more, and the grains have to give it back as bodies (their
gain is 0.7). If they do not, this is the reason the A ring sinks toward the lens (rows 950 to 1080: 0.379
against the approved's 0.437) while the dense ring does not. Instrument renders running at 16:57 (far look
alone, near light alone, near light alone with share 0) to measure it before any number is turned.

A FIT OF THE DENSE RING BY PERCENTILES (the clean outer B zone, display values of T7e taken back through the
film curve and the ceiling to the light before it, then a gain g and a ceiling C applied and the film curve
again): the light before the ceiling at the percentiles 10, 25, 50, 75, 90, 95 is 0.22, 0.31, 0.48, 0.90, 2.0,
5.6; the approved's, through the same curve, is 0.21, 0.28, 0.37, 0.50, 0.66, 0.80. So the bright half of my
ringlets is spread 4.2 times over the median in light where the approved's lanes are spread 1.8 times: the
flat top under the ceiling is the kept picture's near white ringlets, taken back through the film curve. A
gain alone moves the median (g 0.85: 0.717 against 0.715) and leaves the top (p90 0.875 against 0.835, p10
0.522 against 0.556); only a power under 1 above the median narrows it, and that costs G17 (sim14).
Looks pushed: 16:32 (5524cb35).

## 2026-11-24, 17:00 to 17:40 VM: the base of main ed003c7, instruments on T7e, the plan of T8

CORRECTION of the entry before: the grains' share is NOT the reason the A ring sinks toward the lens. Measured
with instrument renders at 3720 (final tier, no film grain, in /tmp/v/t17): the near light alone with
grains.json share 0 over the near light alone as it stands is 1.00 within 0.01 at every radius and row. The
grains conserve the light.

THE BASE. Main ed003c7 (take batch 3) is merged as 501914c, main 0e805c4 as 184a7fd (only tests/weights.test.ts,
kit/PROGRESS.md and round 41's scorecards differ from ed003c7: no engine file, so no picture changes with it).
On the engine of ed003c7 the SAME trees give other bytes than on the engine of 66de92e: 3465 differs by one
level in 5614 pixels (sky and globe, none on the rings), 3720 by one level in 1390 pixels (sky, upper left).
Bisected with one render each: not the far Sun's shader line (old line on the new base: the new sha), not
src/core/warm.json (old list: the new sha), not config/showcase.json (the file of 66de92e on the new base: the
new sha 4077873a). What is left is the code of the other stops or of the shared sky that came with the take.
Every "equal in bytes" from here on is said against a base. New reference hashes on the engine of ed003c7,
final tier: named tree 3465 4077873a1a2005c40bed0e9f225e2ebbe3cf153ee06f75b93a2c3a4735002f0f, named tree 3720
9c261b0378a1f7bad298acb29d25d670c32f18c933a07b6789c0c6777fe47792, T7e 3465 4077873a (equal to the named tree:
the hold keeps its bytes), T7e 3720 69afd1692b40b7f18959e06d865a251c51e456191945c6c86371e197a393bea6. The
references of 3866 and 3567 on the new base are not made yet.

TESTS. The full vitest on the merge 501914c with T7e: all files pass but tests/weights.test.ts (3 of 9 failed:
"no dive of the film leaves a sky over 24 frames and a picture over 12 to the engine any more"). That is the
red machine check of main after take batch 3 (status 246); main cured it in 57695be (the span is made in
memory). Merged with 0e805c4; the full run on 184a7fd with T7e: 53 files, 554 tests, all pass (382 s).

THE BUILDER'S OWN WORDS ON 3720 OF ROUND 44 (status 248, 17:16 UTC, kit/PROGRESS.md): "on Saturn's surface view
the globe sits larger and further right, its night side is not dark and the near rings have lost their fine
dark grain"; "Saturn's surface view is the weakest of the four". Measured on the globe at 3720 (T7e, equal to
the named tree there): the night side is 18, 18, 15 to 31, 24, 15 of 255 where the approved has 10, 12, 11, and
the terminator falls from 200 to 40 over 300 px where the approved falls from 190 to 25 over 180 px. The dusk
of the globe (skim.json light.dusk, globe.ts uDusk) is switched off since "one look from far to near"
(light.globeNear 0). New item 18: the night side at 3720, to be cured by the lens's height like the grade.

INSTRUMENTS ON T7e AT 3720 (the far look alone, the near light alone; nearfar.py; the mix of the two by the
far share of each pixel gives the render back: mean difference 0.0009, 0.09 percent of ring pixels over 2
levels, sim16.py):
- near over far in light, dense ring: 0.88 to 0.97 at rows 560 to 720, 0.76 to 0.92 at rows 800 to 880, 0.77
  to 0.88 at rows 960 to 1080. The far look is the brighter one.
- thin zones (r 2.06, 2.10, 2.14, 2.18, 2.22, 2.26): 1.13, 1.04, 1.23, 1.01, 0.94, 0.84 at rows 560 to 640 and
  0.91, 0.89, 1.13, 0.97, 0.92, 0.85 at rows 1020 to 1080.
- the phase knot of 150 degrees (thin 0.4) raised to 1.0: the near light of the thin zones 1.28 to 1.57 times
  brighter at rows 560 to 640 and 1.00 to 1.10 at rows 1020 to 1080. So that knot holds the far rows down; it
  is not what darkens the rows near the lens.
- the view power of the thin zones (sheet.json view.thin 2) set to 0: 0.77 to 0.81 at rows 560 to 640, 1.29
  to 1.53 at rows 1020 to 1080. So the view power is what lets the near light fall toward the lens.
- the cosine of the view in the A ring by rows 560, 640, 720, 800, 880, 960, 1020: 0.284, 0.336, 0.389, 0.442,
  0.493, 0.535, 0.568 (the model's reference is 0.4, the kept look's 0.43). The far look's opacity grows with
  0.43 over the cosine, so it stops falling from row 800 down; the near light goes on falling.

PLAN OF T8, predicted from the instruments (sim16a.py, sim16b.py; A and B ring by rows 640 to 800, 800 to 950,
950 to 1080; approved A 0.430 0.438 0.437, B 0.704 0.695 0.662; T7e A 0.424 0.412 0.379, B 0.747 0.730 0.689):
1. dense ring: the far look times 0.78 before the ceiling and the near light of the dense ring times 0.92 (the
   near tint): B 0.709 0.698 0.659, near over far 1.03 1.08 1.03 1.00 (rows 560), 0.90 0.98 1.00 1.02 (rows
   800), G17 1.04 (T7e 0.877: the ceiling squeezes less).
2. thin zones: both looks times (cosine of the view over 0.4) to the power 0.8 where the view is steeper than
   0.4, by the share of the grade: A 0.425 0.442 0.441, near over far as before. An angle and a height, no
   distance.
3. item 18, the dusk of the globe by the lens's height.
All of it by the share of the grade (the lens's height), in both scenes alike; share 0 keeps the bytes.
Looks pushed: 17:01 (4f2375e1), 17:29 (a2bdd921).

## 2026-11-24, 19:19 UTC: MAIL 720 (my number), ROUND 44 RESULT and the list for ROUND 2 OF 3, verbatim

"ROUND 44 RESULT and your list for ROUND 2 OF 3. From the Builder (/root), 19:19 UTC, 2026-11-24.

Round 44 judged Saturn on main 57695be (stop hash ba66c76da083da6f) with 30 fresh critics on the frames at the final tier. MEASURED: R1 match 5, R3 surface 5 (parts 5 and 6), R4 motion 8, R2 film jury FAIL (0 of 10 votes for "a frame from a top-budget film" on 3465 and 3720 against 4 of 10 on the two approved images), R8 pass, G5 G13 G17 green, the motion report green. 3 severe, 10 major issues. The pass bar is R1, R3, R4 at 9 with no severe or major open, R2 and R8 pass.

The whole record is on main (7d52b3e0, fetch it shallow): scorecards/round-044/ with SUMMARY.md, R1.json, R3.json, R4.json, jurors.txt and key.json, which maps the critics' neutral file names to frames. Read all of it. Every issue there is yours unless it is named below as someone else's. Attached are ten of the pictures the critics had: r44-R1-pair-03-a (the approved close image) and r44-R1-pair-03-b (your 3720), r44-R1-pair-04-a and -b (their native size crops), and six of the surface critics' crop sheets (r44-R3-image-02, 03, 06, 07, 08, 10; the key says which frame each shows).

YOUR LIST, causes first:
1. SEVERE, R1: the close view is not the approved shot. At 3720 the globe is bigger, lower and further right and runs off the right edge; the left ring horizon is higher and more curved; between the inner ring and the globe lies a black gap with stars, where the approved image has dark inner ring material running into the planet and the shadow band of the rings across the lower globe. Solve the pose of the close view again against the approved image (globe size and place, the ring horizon's height and curve) and give the ring model its dark inner part and its shadow on the globe. This list lifts d196 for frame 3720: the judged surface frame changes because the critic asks for it. The hold 3465 must not get worse.
2. MAJOR, R1 R3 R4 and three jurors: the near ring field. Bright moonlets and boulders that the approved image does not have, read as smooth pills and disc sprites, as "instanced rocks on a flat striped plane". The approved image has a matte, finely grained surface in cooler grey, lilac and pink. The motion critic misses fine grains to track. The field becomes very many fine irregular grains with depth, their own orbital speed and blur, no moonlets, and the ring colours are measured from the approved image by radius.
3. MAJOR, R1 R3: the globe in the close view is too orange and too busy, with a broad brown terminator and painted ribbons at native size. The approved image is pale cream with a grey blue band near the top limb, calm bands with a few ovals, and a tight terminator that falls to near black.
4. MAJOR, R3 R1: edges at native size in 3465, 3567 and 3720: the sunlit limb in steps with a detached, doubled orange glow edge across the inner ring gap; the outer ring edge and the thin ringlets in steps with a bright doubled rim; one straight pale seam across the ring bands; the large moon with a stepped limb, no haze and plastic bands; a scalloped rim at the dark limb. The same steps are named on Uranus in round 45, so engine_profiler looks for the engine's part in them now. Whatever of it lies in your own shaders (an edge decided per pixel with no filter width, a seam where two parameter ranges meet) is yours: find it and say what you found.
5. SEVERE, R3: the sky behind the dive at 3567, soft orange and white blobs under sharp points, ending in a hard ellipse at the inner ring edge. The hard end is the ring's and is yours. The blobs are the shared sky and go to its owner, not to you.

WHAT STAYS: motion passed at 8 with one minor issue and the motion report is green. Keep the dive's and the rise's paths wherever the new pose allows it. Where the new pose moves the end of the dive and the start of the rise, the report must be green again on the commit you name: run `npm run smooth -- --stop saturn` yourself before you name it. Plans F and G stand: nothing appears or changes with the clock, the ring plane is real 3D from code, no picture is stretched. The cost of a frame is no limit.

HOW TO NAME (d186): a mail that starts NAMED with the full sha on agent/saturn-code, with main merged in, saying what changed by file, your own numbers (the report's lines, G13, G17 at 3465 and 3720, the sha of the judged frames before and after), and what is not cured. I prove it on the machines (take check and motion report). Green: it is taken and round 2 starts at once. Red: your next commit within 90 minutes. Two rounds remain for Saturn in this note, so a commit that cures 1 and 2 well is worth more than one that touches all five lightly. Send a look of 3720 beside the approved image to agent/saturn-code-looks after each of your steps, at least every 30 minutes, and a mail starting PART when the new pose stands. First named commit by 22:30 UTC with what is cured by then; say at once if something needs longer and why.

No em dashes and no exclamation points in anything you write into the repo."

Attachments (in /home/user/.perplexity/attachments/e5a1da98b2bb475fab3ba0599df69b5a/): r44-R1-pair-03-a.png, -b.png,
r44-R1-pair-04-a.png, -b.png, r44-R3-image-02, 03, 06, 07, 08, 10 .png.

STATE WHEN IT CAME (19:19 UTC): head bc97f0c pushed; the working tree holds T10, not committed: T8 (the tone of the
rings by the height of the lens), item 18 (the dusk of the globe by the height), item 19 (R3a: dark grooves at the
edges of the two widest octaves in the thin rings near the sheet, near.groove.dark 2.0), item 20 (the day edge of
the haze by the height, light.halo.day [0.1, 0.9]). Final tier, engine of ed003c7: T10 3465 4077873a (the bytes of
the named tree), T10 3720 no grain 5457aced. The heading trial (38 degrees left of the view axis in place of 28):
crisper near rings, but the dive's path goes red and a search of 400 generations ends at 1.008 of the limit
(/tmp/v/t17/opt_dive_d38.log); dropped. Looks pushed 18:50 (3d93e729).

## 2026-11-24, 20:15 UTC: MAIL 729 from the Builder (verbatim)

"MAIL 729 from the Builder (/root), 20:15 UTC. Your part mail of 20:08 is read. Rulings:
1. The pose: keep the limb and the left ring horizon as fitted and close the foot with ring material by the lens's height (dark inner dust into the planet, the shadow band across the foot), none of it in the hold. That is what the critic of round 44 named as missing ("dark C-ring material runs into the planet, and the ring plane casts a shadow band across the globe"), so it is a cure and not a patch, as long as it is ring matter in the ring plane with depth and not a dark shape on the screen. Show 3720 beside the approved image at full size with a crop of the foot in your looks.
2. Item 5, the hard ellipse where the sky's blobs end at the inner ring edge at 3567: the hold is lifted for it. You may change the far look's floor alpha at the inner edge although 3465 changes its bytes, under one condition: 3465 at the final tier before and after, side by side at full size with a crop of the inner ring edge, in your looks before you name, and the hold no worse against its approved image (its match had minor issues only: small dark specks on the outer ring, a little less sparkle grain, the dark limb below the shadow a little bright). If the cure costs the hold anything you can see, say so and I rule again.
3. Everything else as mail of the round: first named commit by 22:30 UTC, the picture report run by you before you name, NAMED with the full sha."

PART mail sent 20:08 UTC (pose (g), path scaled 0.8, path check green, foot cannot be fitted by a pose).

## 2026-11-24, 20:36 UTC: round 2 list of mail 720, what stands in the tree (before the proofs)

State after a compaction: read this entry first, then mail 720 and mail 729 above.

Owed entries, short:
- T8 to T10, items 18 to 20 and the heading trial are in the tree as they were at 19:19 (field.ts, ringfine.json,
  the path's heading 28 degrees left). Looks pushed 17:50, 18:13, 18:50, 19:22, 19:50, 20:19.
- Open list (my numbering, next free 21): 16 to 20 as before. The round's own list is 1 to 5 (mail 720).

Item 1 of the round (the pose), done in the tree:
- skim.json pose, fitted again by assets-src/saturn/code/pose_fit2.py (limb, horizon, gap, night, foot):
  azimuth 8.62, foot 2.688, height 0.3618, yaw 21.18, tilt 8.68, roll -9.54, vfov 41.77. Left of the limb in
  pixels of 1920 by the ray's angle: 80:-15 85:-10 90:-6 95:-2 100:0 105:+3 110:+4 115:+4 120:+5 125:+5 130:+4
  135:+3 140:+2 145:-1 150:-4 155:-9 160:-11 165:-12 (rms 6.6); horizon rms 6.0, within 5 from x 4 to 836.
- Fact: the foot of the lit globe of the approved image lies 55 to 65 px above the model's equator line at
  x 1040 to 1140. No pose of a flat plane round a globe fits limb, horizon and foot together. Ruling of mail
  729: keep limb and horizon, close the foot with ring matter by the lens's height.
- Path: forward 1.2008, side -0.6385 (0.8 of the path before: the lens is lower and its lens longer). Dive
  paces searched again (out/scratch/opt7.ts with SKYM=0: the search's old constant 1.063 was its own sky
  margin), rise paces as before. Path check green, 0 RED, at 20:00.
- skim.json inner: dust inside the inner rim (sheet.ts sheetInner, sheetBands): depth 0.3 at the rim, 0.6 at
  the globe, in plateaus; its light is that of the thin inner ring at radius 1.33 (share 0.9 at the rim, 0.12
  by the globe, falling between radii 1.16 and 1.07): bright ring matter down to about 1.16, then dark into
  the planet, as the approved image has it (measured there at x 1250: lit globe to y 578, dark band 590 to
  655 at scene light 0.09 to 0.15, bright rings from 664). Comes by nearness to the power 0.5, none in the
  hold. Far look weight: no far look inward of the rim (wfar).
- inner.foot: a layer of dust with a soft thickness round the plane in front of the foot of the globe
  (globe.ts and kept/globe.ts, uDust, uDustInk; the haze shell of both too, so no glow lies over it):
  depth 4.0, heights 0.03 to 0.055, ink 0.095 0.088 0.074, by gradeShare of the height (grade.ts dustAt).
- light.grade.low: the thin inner ring darker where the view runs low over the plane (cosine 0.2, power 6,
  least 0.04, inward of 1.35, none outward of 1.75), by the share of the grade: the far side of the inner
  ring by the globe goes dark as in the approved image.

Item 2 of the round (near ring field), in the tree:
- grains.json presence 1, 0, 0: no pebbles and no chunks, so no moonlets and no boulders.
- light.grade.radial: the tone of the rings by radius, 70 knots from 1.03 by 0.02, measured from the
  approved image by assets-src/saturn/code/ring_radial.py (grade.ts iceZone; sheet far look, near look,
  kept rings, grains). Before: approved luma nearly flat 0.25 to 0.33 from 1.25 to 1.95, film 0.05 to 0.12
  at 1.25 to 1.47 and 0.2 to 0.5 in the dense ring.
- ice.json sand.near 1.0, 2.5: the sand of the sheet (in the plane, on its orbit, swept by the shutter)
  now has strength near the sheet too (ice.ts), by nearness; exact in the hold.
- grains.json sand level: size 0.001 to 0.0022, pixels 1.8 to 3.2, gain 0.5: about 420000 grains at most
  (frame 3746, capacity 900000; out/scratch/count.ts), where there were 96 at 3720 with the new pose. A
  first try with size 0.0013 to 0.003, pixels 1.6 to 3.0, gain 0.7 read as a bed of white gravel (720000
  grains, 4 minutes a frame): dropped.
- Still wrong, seen at full size in the last render (3720, final tier, no grain, sha df312836...): white
  grains stand on the dark gap; the grain of the field is coarser than the approved's matte sand; the
  globe's shadow on the rings is black where the approved shows grey ringlets in it.

Not touched in this commit: item 3 (globe paler, calmer, tighter terminator), item 4 (edges; found so far:
the haze shell's glow lay over the dust of one pass and not the other, cured with the dust band in the
shell), item 5 (the hard end of the sky at the inner ring edge at 3567: the far look's floor alpha at the
rim; the hold is lifted for it by mail 729 with a before and after of 3465 in the looks; not done yet).

Renders of this step (3720, final tier, no grain), in /tmp/v/t17: in1 to in8; pairs in /tmp/v/t18/pair_inN.png.

## 2026-11-24, 20:41 to 21:15 UTC: steps in9, in10, r53, r54; the white grains and the snow; main moved

Tests on the merge of 20:41 (290448a, main c6d87bc): vitest 554 of 554 in 185 files; the globe-cap test
"brings a colour level in by the texels of its parent" 3932 ms.

Steps after the entry of 20:36 (3720, final tier, each looked at in full beside the approved image):
- in9: inner.light 0.9 at the rim and 0.7 by the globe (was 0.12), inner.dark 1.0 to 1.06 (was 1.07 to
  1.16): the dust inside the rim stays bright ring matter almost to the planet, as the approved image has
  it. inner.foot: depth 3.2 (was 4.0), heights 0.05 to 0.09 (was 0.03 to 0.055), ink 0.115 0.10 0.08.
- in10: the same, the radial table measured again from in9.
- r53 (proof job, started 20:45, stopped by me at 20:57): its 3720 with grains showed two faults.
  1. White specks on the dark gap. Cause: the grains of the sand level floated up to 0.008 radii above
     and below the plane (grains.json height, heightFar 4), so from the low lens grains of the dense ring
     stood in front of the gap. Cure: height 0.002 and heightFar 2 for the sand level.
  2. The near field read as snow. Cause: the grains were neither under the ceiling of the grade (iceHeld)
     nor under the tone by radius, so each stood white on the graded sheet. Cure: grains.ts uGrainMatte,
     col = mix(col, iceHeld(col) * iceZone(r, mu), counted), with grains.json matte 1, 0, 0 and matteGain
     1.0, 1, 1: the sand level alone, by the grain's own share.
- assets-src/saturn/code/ring_radial.py: a factor stays within 0.4 to 4.5, and within 0.55 to 1.8 outward
  of radius 1.56 (the tone of the dense ring is not forced); across the gap, radii 1.92 to 2.10, the table
  is a straight line between its two rims, so it does not paint the gap bright. The table in skim.json
  was written by `ring_radial.py /tmp/v/t17/in10_3720.png write`.
- Most grains in a frame: about 416000 at frame 3740 (out/scratch/count.ts), capacity 900000.
- r54: proof job on this tree, started 21:02:27. Path part green. The finals:
  3465 sha 4077873a1a2005c40bed0e9f225e2ebbe3cf153ee06f75b93a2c3a4735002f0f
  3720 sha ee1aec39c955a54d5808b20638bfdd21094ac2e1b05402a210b1352a9fdd14a5

Main moved at 21:10 to 8e06f69 (take batch 4). What it changes for this stop:
- tools: the path part now judges the rest between the rise and the travel against smooth.path.minLeave
  0.07 (this tree reads 0.373 at frame 3889); the handover judges the step between two frames in place
  (tools/lib/steps.ts IN_PLACE.judged true) with handover.limits.levelStep 5 (was 6); the handover's run
  of frames is centred on the change of view; the report can be joined from parts.
- engine: src/director/moves.ts and handover.ts (the pull back of a rise, an option this stop does not
  set), src/space/farsun (the strand loop), src/core/warm.json.
- The proof job r54 runs on the worktree at a34beaa, whose engine is that of c6d87bc. After it the
  worktree goes to 8e06f69 and the finals, the path, the gate and the handover run again there.

## 2026-11-24, 21:22 UTC: MAIL 761 from the Builder (verbatim)

"MAIL 761 from the Builder (/root), 21:22 UTC. For your named commit due at 22:30 UTC: take batch 4 is on
main as the merge 952628367d1fdb87acac0f0e782f169d86fe01cd; its hashed files are those of the batch tip.
Your leave line passes (0.375 against the floor 0.07), so the pull back is not an item for you. Your frame
3720 of 20:45 UTC was shown to Brandon in status 259 as work in progress beside the approved ring view,
with what you named as still open: the dark band across the globe's foot too tall and too hard, the near
ring coarser, the shadow side wider. If a push fails with "could not read Username", try it again first:
the login came back by itself on other machines between 21:00 and 21:13 UTC. Only if it still fails, send
your looks as pictures and your commits as a bundle by mail. No answer needed."

Checked at 21:31: 9526283 is an ancestor of 8e06f69, which is merged here (3859178), and src, tools,
config and public do not differ between the two. Main stood at b890fee by then (kit/PROGRESS.md alone
against 8e06f69); it is merged again at the commit that is named.

## 2026-11-24, 21:42 to 22:35 UTC: r54 red on the pattern line in the dive and in the rise; cause and cure

r54 (the tree of 2087f8e, engine of c6d87bc) read, the pictures part:
- Dive: "VERDICT: red". Largest change of the pattern alone 0.54 (limit 0.45), 17 capture frames over it,
  first 3588; two episodes, 3588 to 3593 at pixels (800, 816) to (704, 752), and 3605 to 3608 at (628, 600).
  Level step 0.02 at 3601 (limit 1.3), pop 1.07 at 3568 + 1/2 (limit 1.2). The named tree before this round
  read pattern 0.29, pop 1.04.
- Rise: "VERDICT: red". Pattern 0.70 from 3822 + 1/2 (20 capture frames over it, first 3822), at (672, 568),
  then (1332, 892), (1676, 980) and from 3831 + 1/2 at (1072, 936). Level step 0.05 at 3875 + 1/2, pop 1.196
  from 3872 + 1/2 (limit 1.2; the sheet shows the residual there mostly on the stars of the sky and on the
  thin arcs at the inner ring). The named tree before this round read pattern 0.25, pop 1.15.
- Finals, path, G5 and G17 of r54 are in the entry above and in the NAMED list below.

What the measure is (tools/img/smooth.py pattern(), read): both pictures are reduced to their detail between
8 and 40 px, the local mean out, divided by the local contrast; the number is one minus their local
correlation over a 40 px neighbourhood, frame against the frame 8 film frames later carried back along the
flows; the 99th percentile on the body. A plain gain counts little; a pattern that is replaced counts in
full. My own reading of it, /tmp/v/t19/pat.py (the tool's functions, the body by brightness), on r54's
frames: at capture frame 7181 a gap of 16 capture frames gives 0.399, 8 gives 0.102, 4 gives 0.034; at 7213
0.803, 0.169, 0.034. So the number falls about with the square of the pace of a change: a change that comes
by height is cured by a law that is slower where the lens falls or climbs fast.

The cause, two things this round added, both by the height of the lens and both too fast:
1. The tone of the rings by radius (iceZone: the table light.grade.radial and the thin inner ring by the
   view, light.grade.low) came in with the share of the grade, a smooth step in the logarithm of the height
   from 2.2 to 0.6. The thin inner ring gains up to 4.5 times its light by it, with bands of its own (the
   knots of the table), so over the globe it went from dark with fine ringlets to pale with broad bands
   within about 10 frames, in the dive still in the kept set (heights 1.38 to 1.19).
2. The dust inside the inner rim (sheetInner) had its depth by the nearness of the lens, which runs from 0
   to 1 between the heights 0.93 and 0.6 (handover.kept.far): 17 frames in the dive, 11 in the rise. It
   filled the gap and covered the underside of the globe within 8 to 12 frames.
3. Found after the first cure (rise slice, below): the dust band on the foot of the globe (inner.foot,
   dustAt) had its depth by the share of the grade too. It reaches both sides of the plane, so it also lies
   on the strip of the globe seen through the gap under the equator; in the climb it thinned fastest
   between 3832 and 3841, and that strip grew in place.

The lens over the plane (out/scratch/h2.ts; height in planet radii): the rise climbs through every height
about one and a half times as fast as the dive falls through it. Change of the logarithm of the height in 8
film frames: dive at most 0.217 (3600 to 3606), rise at most 0.318 (3834 to 3840). The rise passes the
heights 0.365 to 2.2 in 71.6 frames (3792.3 to 3863.9) and 0.40 to 0.93 in 32.8 frames (3802.2 to 3835.0).
No law by height can do better in the rise than an even pace over those frames, so that is how the two
laws are set: tables of height against share in skim.json, made by /tmp/v/t20/knots.py from the rise's
heights (the frame at which the rise passes a height gives the share there). They are functions of the
height alone: the same way down and up, at any capture rate, no state.

The cure, by file:
- grade.ts: byHeight (straight lines in the logarithm of the height between knots); zoneShare (skim.json
  light.grade.by: 30 knots, 0 at 2.2 and above, 1 at 0.365 and under, even in the rise); innerShare
  (skim.json inner.by: 16 knots, 0 at 0.93 and above, 1 at 0.40 and under, set so that the opacity of a
  sheet of depth 2.5 on the view changes evenly in the rise); iceZone applies its factor to the power of
  its own share (uGradeLow.w), and is the factor itself at share 1, so a frame low in the skim keeps its
  values; dustAt takes innerShare (one dust, one law).
- sheet.ts: set(near, inner): the depth of the dust inside the rim is its full depth times inner (was the
  nearness to the power inner.grow, which is gone from skim.json); far(..., grade, zone) sets uGradeLow.w.
- model.ts and kept/set.ts: set the zone share wherever the share of the grade is set; model.ts passes
  innerShare to the sheet. The kept set has no dust inside the rim and now no dust band on the foot at its
  heights either (innerShare is 0 above 0.93), so the two scenes still hold one picture at the handing over.
- skim.json: light.grade.by, inner.by, inner.grow removed, the notes.

What the laws do in numbers (knots.py): largest change of the zone share in 8 film frames 0.115 in the rise
(from 3814), 0.081 in the dive (from 3584); with the factor to the power of the share the thin inner ring
changes by at most 4.5 to the power 0.115, 19 percent, in 8 frames (before: about 41 percent in the dive).
The opacity of the dust at depth 2 changes by at most 0.25 in 8 frames in the rise and 0.12 in the dive
(before: nearly all of it in 11 frames). Shares through the dive: zone 0.14 at 3576, 0.37 at 3600, 0.58 at
3624, 0.68 at 3660, 0.85 at 3696, 1 at 3720; dust 0.06 at 3610, 0.22 at 3630, 0.33 at 3660, 0.72 at 3690, 1
from 3700. So through the first 70 frames of the skim the thin inner ring still brightens and the dust
still closes as the lens sinks: by height, slowly, and all of it is there at 3720 (shares 1, 1, 1).

Slices on the first cure (zone share and dust in the plane; the dust band still on the grade's share), on
main 7026711 with this stop folder, `npm run smooth -- --stop saturn --only pictures --kind K --frames A-B`:
- Dive, capture frames 7176 to 7232: green, largest pattern 0.28 at 3608 (was 0.54); 3588 to 3594 0.19 to
  0.21 (was 0.45 to 0.54).
- Rise, capture frames 7640 to 7690: red, pattern 0.67 from 3832 + 1/2 at pixel (1044, 936), 10 capture
  frames over, first 3830; 3820 to 3829 0.21 to 0.36 (was 0.42 to 0.70); pop at most 1.10. The tool's detail
  maps round that pixel (/tmp/v/t19/patdbg.py, in the looks as the zoom) show cause 3.

Second cure and the full run r55 (22:32 to 23:18; main 7026711 with the stop folder of that minute):
- dustAt took innerShare in place of the share of the grade (cause 3).
- r55 rise: "VERDICT: red". Pattern 0.46 from 3816 + 1/2 at pixel (1188, 840), limit 0.45, 2 capture frames
  over it, first 3816; rows 3806 0.18, 3810 0.27, 3812 0.32, 3814 0.39, 3816 0.45, 3818 0.41, 3820 0.37, 3824
  0.32, 3826 0.23, 3830 0.31, 3834 0.31, 3838 0.23. Level step 0.05 at 3875 + 1/2, pop 1.196 from 3872 + 1/2
  (the same number as r54: those frames lie above every height my laws touch), change in place 27.6, the
  ground beside it change 26.1 and pattern 0.20 (before the dust: 11.8 and 0.13).
- What it is (the report's changes sheet and my crops of 3808, 3816, 3824, 3832, in the looks): the band of
  dust between the inner rim and the foot of the globe, pale olive with dark streaks, thins and goes within
  about 24 frames; the hot band of the measure lies along it from x 1150 to 1700.

Third cure, the table inner.by set from the measure (/tmp/v/t21/retime.py): the states of the dust under the
table of r55 are passed again, at a pace that is even in the measured change of the pattern (the square root
of the row's pattern less a floor of 0.17, never under the root of 0.06, the row taken for the middle of its
8 frames; past row 3826 other places lead the measure and the floor is taken), over the rise's frames from
the height 0.38 (frame 3797.0) to 0.93 (3835.1): 28 knots. The dust is then whole from 3710 to 3797 (it was
whole from 3700 to 3802). Shares in the rise: 3798 0.86, 3802 0.57, 3806 0.39, 3810 0.30, 3814 0.24, 3818 0.20,
3822 0.16, 3826 0.11, 3830 0.07, 3834 0.01; in the dive: 3610 0.07, 3620 0.13, 3630 0.17, 3650 0.21, 3670 0.25,
3680 0.30, 3690 0.42, 3700 0.62, 3710 1.0. Across the red window (3816 + 1/2 to 3824 + 1/2) the share now
changes by 0.085 where it changed by 0.145. What the model of the measure expects: about 0.26 to 0.31 at the
old peak. Not measured yet when this was written.

## 2026-11-24, 22:45 UTC: MAIL 785 from the Builder (verbatim)

"MAIL 785 from the Builder (/root), 22:45 UTC. One ruling for every stop, for your awareness and your next
commit. It changes no due time.
Four builders (Neptune, Sun, Jupiter, Earth) read their dives and rises frame by frame tonight and each
found the same cause behind what Brandon's third note calls an image that pops up, a flat smudge that turns
into the canyon and a moment where things load in: two pictures of one ground weighed against each other by
the camera's height, or a region that takes another look by a share of the height. So: nothing is cured by
such a weight. A stop has one ground at every height; what the surface view needs at the place is a
permanent thing of the planet at its true size, drawn by one law; detail comes by distance (the size of a
pixel on the ground), haze and tone by the length of the path through the air. Where that thing is in view
at the hold, the hold may change inside a small disc round the place and keeps its bytes outside it; the
hold beside the approved hero at 1 to 1 comes to me before such a commit is named.
Allowed, and not meant by this: a grade that follows the camera's height slowly through the whole move, as
an eye adapts, if no frame shows it as a thing arriving (the pattern line green, and by eye). Not allowed:
a picture, a layer or a region that comes in or goes out by height.
Answer in two lines, with your next mail and not before: which laws of your stop still weigh two pictures
or two looks by height, at which frames they show, and whether your commit in hand removes them."

## 2026-11-24, 23:16 UTC: MAIL 797 from the Builder (verbatim)

"MAIL 797 from the Builder (/root), 23:16 UTC. Attached: range-saturn-globe.patch by globe_engineer. It gives
your globe (and the kept globe) the carry range the smooth tool needs. It applies with `git apply` on
e51dd9f1 and on 86184412; if it does not apply on your branch, port its lines by hand and say so. Put it into
your next named commit. The smooth proving jobs of Saturn (4 jobs) are held until a commit of yours carries
it. Law for every stop from today (decision d253), after mercury_builder MEASURED that b0b87889 exchanged its
globe and place by the real pixel, so its capture at 3840 by 2160 was not the picture of its render at 1920
by 1080: (a) every term that counts screen pixels (a level picked by texels per pixel, a presence by size on
screen, an exchange between two grounds, a width or a feather in pixels, fwidth and its kin) goes through
the frame factor, `frameUniform` of `src/core/frame.ts`, `uFrame` in shaders, so that a capture at 3840 by
2160 is the same picture as a render at 1920 by 1080; (b) the asset set must not move the moment at which a
level, a patch or an exchange arrives: count the full set's texels in both sets, the web set is only
softer. Say in your next NAMED mail that both hold for your stop, with one dive frame drawn at both sizes
and in both sets as proof (the mean difference of each pair, 0 to 255)."

Attachment: /home/user/.perplexity/attachments/9ecef59465be4b5ea4d86a1d728fb8ba/range-saturn-globe.patch (26
lines: the last argument of diagOut in globe.ts and kept/globe.ts, the range of the point drawn, becomes the
range to the surface of the globe where the limb is drawn inflated). `git apply --check` passes on this
branch as it stands.

## 2026-11-24, 23:17 to 23:45 UTC: r55 read whole, the dark inner zone, d253 measured, the frame factor

r55 (main 7026711 plus the tree of 22:32, cures 1 and 2, the old table inner.by), what it measured before it
was stopped at 23:22 (its later steps would have had to run again on the tree that is named):
- Rise: "VERDICT: red", pattern 0.46 from 3816 + 1/2, limit 0.45, 2 capture frames over (see above).
- Dive: "VERDICT: green". Pattern 0.33 from 3576 at pixel (1404, 428); level step 0.02 at 3601; pop 1.07
  from 3568 + 1/2; change in place 16.4 from 3598 + 1/2 at (1564, 624); ground 3630 to 3641 + 1/2 change
  6.2, pattern 0.05.
- Finals on the engine of 7026711: 3465 4077873a1a2005c40bed0e9f225e2ebbe3cf153ee06f75b93a2c3a4735002f0f,
  3720 ee1aec39c955a54d5808b20638bfdd21094ac2e1b05402a210b1352a9fdd14a5: both the bytes of r54 (the
  older engine), so the engine of 7026711 draws these two frames as the one before did.
- Path: "VERDICT: green. No number is over its limit."
Main moved to cc9015f by 23:18: kit/PROGRESS.md alone against 7026711 (src, tools, tests, config, cut and
package.json do not differ), so a proof on the worktree at 7026711 is a proof on the engine of cc9015f.

Mail to the Builder at 23:20 (STATUS): the red and its cause, the cure in the tree, the patch of mail 797,
the two lines for mail 785 and the ruling I need on the dust (see below), NAMED about 01:30 UTC.

The answer to mail 785 as sent. Still by the lens's height in Saturn: (a) the scene change kept set to model,
1.03 to 0.93 (dive 3600 to 3604, the same far look on both sides); (b) the model's nearness, 0.93 to 0.6
(dive 3604 to 3622, rise 3823 to 3835): the ice past the outer rim, the globe's near look, the grain field;
(c) new this round: the dust inside the inner rim with its band on the globe's foot, 0.93 to 0.38 (dive 3604
to 3710, rise 3797 to 3835), and the rings' tone by radius, 2.2 to 0.365 (dive 3561 to 3718, rise 3792 to
3864); (d) grade, dusk and haze, 2.2 to 0.6. The rings' far look against their close look is by distance per
pixel (0.6 to 1.3 radii from the lens); the height overrides it only between 0.6 and 0.70. The commit in hand
removes none of them: it slows (c) until the pattern line is green. The ruling asked for: by the length of
the view's path alone the dust cannot be absent from the hold (the path through a sheet at the foot is 2.4
times longer at 3720 than at the hold, view cosine 0.22 against 0.53, so a sheet deep enough to close the
foot at 3720 is a veil of about 0.4 of that depth in the hold): by height as mail 729 ruled, or permanent
and seen in the hold, or none. The tone by radius can go by the path through the ring per pixel.

The dark inner zone (item 1 of mail 720, "give the ring model its dark inner part"). Seen on 3720 beside the
approved image: my inner zone was pale and grainy where the approved has a dark grey band with ringlets at
the foot and a dark arc left of the globe. Cause: the dust's light was 0.9 and 0.7 of the thin inner ring's,
and the table of the tone by radius multiplies it by about 4 at these radii (its knots under the inner rim
were measured before there was dust, against black). Two trials at 3720, draft, no grain
(/tmp/v/t17/run2g.sh): dk1 inner.light [0.3, 0.12]; dk2 the same light 0.25 and 0.1 with twice the depth
(0.7 and 1.4). Both give the dark band at the foot and the dark arc; dk2 is no better and changes how the
share by height maps to what is seen, so dk1 stands: inner.light [0.3, 0.12]. Not cured by it and named:
the dust is still grainy (the sand of the sheet on a thin depth: the globe shows through it in specks)
where the approved has clean ringlets; the band on the globe's foot is still broad and brown; the lit ring
at the right edge begins lower than in the approved (the globe's shadow on the sheet, true to the Sun).

Mail 797 (d253), measured before any change (/tmp/v/job_u.sh step sizes, /tmp/v/t21/sizes.py: stills at
the draft tier with grain, the 3840 by 2160 picture brought to 1920 by 1080 by the mean of each 2 by 2
block; mean absolute difference 0 to 255; "broad": after both are evened over 16 px):
- 3567 (kept set): sizes, full set, mean 1.787, broad mean 0.672, broad most 7.2 at (642, 473); sizes, web
  set, mean 1.655; sets at 1920, mean 2.181, broad mean 0.492; sets at 3840, mean 2.904.
- 3612 (model, all of it the far look): sizes, full set, mean 2.468, broad mean 0.655, broad most 13.1 at
  (970, 747); sets at 1920, mean 0.156; sets at 3840, mean 0.190.
What the differences are, seen on the difference pictures: (1) the ringlets differ between the sizes in
bands (15 of 255 at (970, 747) of 3612): the level of the kept profile and the octaves of my ladder were
picked by the real pixel, so the larger frame showed ringlets the smaller one had filtered away. That is
the fault of d253 and it is mine. (2) At 3567 the sky in the gap between the inner ring edge and the globe
reads (27, 27, 29) at 1920 and (16, 22, 26) at 3840, a warm veil that falls away from the lit limb, and
3612 has the same faint halo left of the lit limb. My stop draws nothing there by pixels. Read in
src/post/chain.ts: the film's bloom is a pyramid of 6 levels (LEVELS) from the frame's own size, so in
the larger frame it reaches half as far in angle. Not proven by a render and not mine to change: reported.
(3) Between the sets the model differs by 0.16 (the globe's map and the sky); the kept set by 2.2 (its
pictures are softer in the web set); no patch or exchange stands out in either difference picture.

The cure of (1), /tmp/v/t21/frame_edits.py (13 places, each a factor that is 1 at 1920 by 1080):
- sheet.ts: the footprint the ladder is filtered with is the look's pixel (ringLookPixel, uRfFoot); the
  texels of the far look, its fillet, the feathers of the globe's shadow (kMw) and outline (bw) too.
- grains.ts: the grains read the ladder with the same footprint.
- globe.ts: the shadow of the ringlets on the globe (ringShadowAt) and the rate of the fine structure of
  the bands (bandRate).
- kept/rings.ts: the level of the profile (lodP), of the strands (sl), the feathers bw, mw and fw
  (uFoot.x).
What stays by the real pixel, as the engine's own planet reads its map (src/bodies/planet.ts,
equirectGrad with the engine's grad): the levels of the picture maps (the globe's map, the takes of the
kept set: textureGrad with the pixel's own gradients). The presences of the takes were through the factor
and the full set's texels already (uFoot.y, uFoot.z), as were the grains, the sand and the look's widths.
The kept set's shadow of the rings on the globe (kept/profile.ts ringShadowAt) keeps the real pixel under
its soft floor: the kept globe has no factor uniform, and the floor is wider than a pixel in hold and dive.

## 2026-11-24, 23:45 UTC: the frame factor proven on two frames (s2), main at b5849a3, proof r56 started

s2 (/tmp/v/s2, the same eight stills as s1 on the tree with the 13 factors):
- The four stills at 1920 by 1080 (3567 and 3612, full and web set) have the sha256 of s1: the factors
  are 1 at the master and change no byte there.
- 3612, sizes, full set: mean 2.468 to 1.629, broad mean 0.655 to 0.459, broad most 13.1 to 6.6; counted
  as the Builder counts (status 267: cells of 10 by 10 px, 20736 of them, the mean difference of a cell):
  cells over 12: 55 to 0, the most 16.1 to 6.9. The web set the same (1.624, 0 cells).
- 3567, sizes, full set: mean 1.787 to 1.753, cells over 12: 0 before and after, the most 7.5; web set
  1.620, 0 cells.
- Sets at 1920: 3567 mean 2.181, 111 cells over 12 (the most 18.5 at pixel (895, 1075)); 3612 mean 0.156,
  0 cells. Sets at 3840: 3567 mean 2.826 (2.151 after halving, 73 cells); 3612 mean 0.190 (0.159, 0).
What the rest is, seen at full size (/tmp/v/t21/e3612_all.png, e3567_c1.png, e3567_sets.png, all three in
the looks): at 3612 thin lines on the edges of the ringlets (one sample a pixel at the draft tier, the
film's sharpen of one real pixel), the film's grain, a moire of the draft tier at the lower right, and the
warm halo by the lit limb (bloom). At 3567 the same ringlets stand in the same places at both sizes; the
kept takes are sharper at 3840 (their maps are read at the level of the real pixel) and the gap by the
globe is warmer at 1920 (bloom). Between the sets at 3567 the picture is one picture, the web set softer
and with the grain of its smaller files; the 111 cells are the near ring at the lower edge where the
ringlets are finest. No patch, level or exchange arrives at another moment in either pair.
Tools: /tmp/v/t21/sizes.py, cells.py (the Builder's count), dview.py, dcrop.py, scrop.py.

origin/main at 23:45: b5849a3 (status 267, d254). Against 7026711 nothing differs under src, tools, tests,
config, cut or in package.json: kit/PROGRESS.md, Neptune's web assets and scorecards alone. So the proof
on the worktree at 7026711 is a proof on the engine of b5849a3.

Read in d253 and d254 (kit/PROGRESS.md of b5849a3): the frame law as mail 797 gives it; Mercury's fault
was an exchange of globe and place by the real pixel (frame 717: mean 5.04, block 135.8). d254 (4), a
ruling for Jupiter and Neptune: a place may show in the hold and on the way down under four conditions
(one Sun; through the globe's own filter by the pixel's foot; no light of its own and no law by height or
clock; its tones at the hold inside what the hero has within about 200 px, or a curve from the hold to T
with no step). It is not addressed to Saturn; my question on the dust inside the inner rim (mail of 23:20)
is of the same kind and has no answer yet.

Proof r56 started 23:46:29 on main 7026711 plus the tree as it stands (cures 1 and 2, the table inner.by
re-timed, inner.light 0.3 and 0.12, the patch of mail 797, the 13 factors): steps rise, finals, dive, path,
g13, parity, gate, handover, place, sizes, g17. From here on no file of the picture path is touched until
the proof is read: the committed tree must be the proven tree.

## 2026-11-25, 00:09 to 00:15 UTC: r56 red in the rise by one line, the cause, the table stretched, r57

r56 (main 7026711 plus the tree of 23:46), the rise alone was read, then the job was stopped:
- "VERDICT: red. 1 number over the limit": "the pattern of the picture changes in place by 0.46 from frame
  3801 + 1/2 to 8 film frames later, limit 0.45 (3 frames over it, first 3800 + 1/2)", most at pixel (852,
  732). The ground line (3798 to 3809 + 1/2): change 36.8, pattern 0.46. Level step 0.05 at 3875 + 1/2; pop
  1.196 from 3872 + 1/2 (limit 1.2); change in place 36.8 from 3798 (shown, not judged).
- The rows of the pattern, every second one: 3798 0.39, 3800 0.44, 3802 0.45, 3804 0.43, 3806 0.41, 3808
  0.39, 3810 0.41, 3812 0.44, 3814 0.43, 3816 0.40, 3817 0.20, 3820 0.20, 3824 0.17, 3828 0.26, 3832 0.31,
  3836 0.28, 3840 0.20, 3842 0.33, 3848 0.23, 3856 0.23, 3864 0.16, 3868 0.27, 3872 0.15, 3880 0.13.
- What it is, seen on the report's sheet (saturn-rise-changes.png, kept as /tmp/v/r56a): the dust in front
  of the foot of the globe. The band along the lower limb of the lit globe gets lighter from frame to frame
  and the pattern there goes over from the band's own edge to the limb and the globe's bands under it. The
  table inner.by did what it was made for, an even pace (0.39 to 0.46 on every row from 3798 to 3816), but
  at a level one hundredth over the limit. The fall to 0.20 at 3817 is the measure's own rule ("only where
  both have detail over 1"): from there the later frame has too little of the band left to count.
- What I take from it: the measure counts how fast one structure is exchanged for another, whatever the
  tone. A whole exchange over N frames reads about 0.17 plus 0.28 times 38 over N. The climb gives 38
  frames between the heights 0.38 and 0.93 and 48 between 0.35 and 0.93; under 0.35 the lens has not begun
  to climb.
- My early check (/tmp/v/t19/pat.py, the body by brightness) read 0.448 at its largest and the fall at
  3817 too: it follows the report within 0.02 on these rows. /tmp/v/t21/pat_rows.py gives all rows at once.

The cure (/tmp/v/t21/stretch.py 0.35): the same states of the dust in the same order, passed later in the
climb by one factor (0.792), so the dust begins to thin at 0.35 in place of 0.38 and is gone at 0.93 as
before. Expected from the rows above: 0.34 to 0.40. What it costs: with the lens at the height of the
approved close image (0.362) the dust has 0.652 of its depth, and all of it only from 3728 to 3787 (the
lens under 0.35). Seen at 3720, draft, no grain (/tmp/v/t17/st1_3720.png against dk1_3720.png, mean
difference 0.54 of 255; the foot crop of both beside the approved: /tmp/v/t21/st1_foot3.png): the band on
the foot is a little lighter, the dust lets a little more of the globe through; no worse, and as far from
the approved's dark ringlets as before. Scaling the depths up to keep 3720 as it was would pass the thin
states of the dust faster than now (reckoned from the table: 1.2 to 1.8 times from the share 0.22 down),
so the depths stay. The table of r56 is kept as /tmp/v/t21/inner_by_r56.json.

Not taken, thought through: a foot band with a softer upper end (its edge then holds less detail between 8
and 40 px, which is what the measure reads); a band of less depth. Both change the look at 3720 and need
trials. The true cure is the one mail 785 asks for: the dust by the path of the view and nothing by height.
That needs the Builder's ruling on the hold (asked 23:20, no answer yet).

Proof r57 started 00:14:00 on main 7026711 plus this tree, rise first. Mail to the Builder 00:15 (STATUS):
the red, the cause, the cure, d253 in numbers, the bloom reading, NAMED about 01:50 UTC if the rise is green.

## 2026-11-25, 00:19 UTC: MAIL 821 from the Builder (verbatim), the answer to my STATUS of 00:15

"MAIL 821 from the Builder (/root) to saturn_coder, 00:19 UTC by my date -u. Answer to your STATUS of 00:15.

1. NAMED at about 01:50 UTC is noted. Say at once if the rise is not green at 00:40.
2. Ruling on the levels of the picture maps (the globe's map, the takes of the kept set): they stay by the
real pixel. A plain filtered read of a picture is not a choice under the frame law (d253); at 3840 by 2160
it takes the finer level, and that is what the capture is for. What goes through the factor is every choice
of what is drawn or when it changes, which is what you moved in the 13 places. Good.
3. The bloom of src/post/chain.ts (6 halvings of the frame's own size, so half the reach in angle at 3840)
is not yours and goes to the engine's owner today with your reading; the warm veil by the lit limb at 3567
is the picture to prove it on. Do not work round it in your stop.
4. Your question of 23:20 on the dust stands as you say; the law by height in the rise is judged when the
proof is in."

What follows from it: the picture maps stay as they are (nothing to do); the bloom is left alone; the
ruling on the dust comes with the proof, so the NAMED mail must give the rise's rows plainly and say again
that the dust and the tone by radius are laws by height. If the rise is not green at 00:40: one line to
the Builder at once.

## 2026-11-25, 00:15 to 00:40 UTC: local commit 5e094e5, the rise of r57 is green

- 00:17: the tree under proof committed locally as 5e094e5 (not pushed). Checked before: the stop folder in
  mainref and in the repo are equal file by file (diff -rq), tsc passes, no forbidden character.
- r57 rise (report of the tool, engine 7026711, 198 draft frames at rate 2, 5.5 s a frame):
  "VERDICT: green. No number is over its limit."
  Pattern 0.40 from 3813 + 1/2 at pixel 1136, 792 (limit 0.45). Level step 0.05 at 3875 + 1/2 (limit 1.3).
  Pop 1.196 from 3872 + 1/2 (limit 1.2). Change in place 24.1 from 3831 at 1108, 896. The ground beside it
  (3798 to 3809 + 1/2): change 17.0, pattern 0.35.
  Rows of the pattern: 3798 0.35, 3800 0.32, 3802 0.29, 3804 0.29, 3806 0.31, 3808 0.33, 3810 0.37, 3812
  0.39, 3813 + 1/2 0.40, 3814 0.40, 3816 0.38, 3817 0.21, 3820 0.20, 3824 0.17, 3828 0.26, 3832 0.31, 3836
  0.28, 3840 0.20, 3842 0.33, 3846 0.24, 3850 0.17, 3856 0.23, 3862 0.13, 3868 0.27, 3874 0.14, 3880 0.13.
  One row over 0.40, nine over 0.38. The six largest pops: 1.145, 1.161, 1.175, 1.194, 1.194, 1.196, all
  at 3872 to 3874, on the stars of the sky (the sheet of the pops: what is left without the motion is the
  star field and thin arcs where the stars show through the ring by the globe's shadow).
- The stretch did what the rule of thumb said (an exchange over N frames reads about 0.17 + 0.28 x 38 / N:
  0.39 for 48 frames; read 0.40). The hot place is the dust in front of the foot of the globe at the upper
  edge of the rings, x 1136, y 792 (crop of the frames 3802 to 3822 in the looks).
- A correction to my own instrument (/tmp/v/t21/pat_rows.py, the body taken by brightness): against the
  report of r56 it reads between 0.076 lower and 0.021 higher (not "within 0.02" as I wrote): lower where
  the dark dust lies under its brightness floor (3800 to 3802: 0.38 and 0.39 against 0.44 and 0.45), and it
  reads a false red where the glow of the limb comes in over the starry gap (r57, 3838 + 1/2 to 3842: 0.35
  to 0.72 where the report reads 0.20 to 0.33), because the stars of the gap then count as body. It is good
  for an early warning on the foot, not for a number to report. Only the report's numbers go into mails.
- Mail to the Builder 00:37 (STATUS, low): the rise's lines, NAMED about 02:10 in place of 01:50 (the rest
  of the job ends near 02:00 by the paces measured). Looks pushed 00:29 (15019d5b).

## 2026-11-25, 00:40 to 00:50 UTC: finals of r57, the globe and the foot measured against the approved image

Finals of r57 (final tier, engine 7026711, the tree of 5e094e5):
- 3465 4077873a1a2005c40bed0e9f225e2ebbe3cf153ee06f75b93a2c3a4735002f0f: the bytes of the named tree, of
  r54 and of r55. The hold is the same picture.
- 3720 631f3cf203bc7ed84f841e909dae67cf604d51f1e96f87062860a2977ba4a55b (was ee1aec39... in r55 before the
  dark dust, the factors and the stretch; 33bb2086... on the named tree 2d54c49).
Pictures (in the looks): /tmp/v/t21/f57_whole.png (3720 beside the approved, half size), f57_foot.png (the
foot at full size, x 900 to 1660, y 480 to 900), f57_ll.png (lower left at full size).

A new instrument, /tmp/v/t22/globe_meas.py FILM (to go into assets-src/saturn/code with the next commit):
on the fitted pose of skim.json it gives every pixel of the globe its latitude and the cosine of the Sun's
angle, and prints the middle display colour of the approved image and of the film per bin.
By the cosine of the Sun (latitudes 12 to 55), approved against the final 3720:
  -0.10: 14,14,13 | 19,18,17     0.00: 114,94,61 | 123,92,67    0.05: 157,126,82 | 174,133,90
   0.10: 189,155,105 | 200,160,111   0.20: 218,187,140 | 217,183,133   0.30: 231,204,162 | 228,196,150
   0.50: 243,224,193 | 241,216,176   0.70: 250,241,218 | 250,236,207
  Scene luma at 0.5: 0.965 against 0.802. So over these latitudes the light by the Sun's angle is close; the
  film is redder in the twilight (red over green 1.37 against 1.23) and less pale in the day (blue 176
  against 193 at 0.5), and about 17 percent darker in scene light on the day side.
By latitude on the day side (cosine over 0.45), approved against film:
  6 to 18: 251,244,224 to 248,233,204 | 248,231,201 to 248,230,193 (saturation 0.11 to 0.18 | 0.19 to 0.22)
  21: 249,237,210 | 246,221,176 (0.16 | 0.28)     24 to 42: 245,225,187 to 237,221,192 | 245,221,184 to
  234,211,172 (0.19 to 0.26 | 0.25 to 0.27)       45: 224,212,190 | 238,220,186    48: 217,209,195 |
  236,223,199    51: 209,205,197 | 231,215,190    54: 204,201,197 | 231,210,176 (0.03 | 0.24)
  So the grey band near the top limb of the approved image lies above latitude 44 and the film has none;
  everywhere else the film is 0.05 to 0.10 more saturated.
Along the rows of the picture the terminator of the approved image does not lie on the model's line of the
Sun: at y 150 it is about 70 px further left (half light at cosine 0.10, grey blue: 103,104,92 at x 1604
where the film has 166,141,111), at y 450 about 30 px further right. Item 3 is therefore a table of
factors by latitude and by the cosine of the Sun, measured like the tone of the rings by radius, with a
slow share by height, plus less fine contrast. Not in this commit.

The foot, by the same instrument (day side, latitude bins of 3 degrees, approved | final 3720 | the trial
dk1 with the dust whole at 3720):
  -6: 194,176,157 | 196,166,138 | 171,152,128     -3: 159,143,125 | 166,135,104 | 127,105,85
   0: 120,111,98  | 192,155,118 | 154,125,99       3: 196,171,134 | 234,203,161 | 222,184,141
Along x 1250 the band between the foot of the lit globe and the bright rings reads 137 to 148 (tan) in the
final 3720, 116 to 140 in dk1, 89 to 127 (grey) in the approved image; the film's lit globe ends at y 604
there, the approved's at 572; the film's bright rings begin at 724, the approved's at 652.
What this says, plainly: the stretch of the table (dust whole at 0.35 and under, 0.65 of it at the height
of 3720) bought the green rise and cost the judged frame about 38 display values on the dark band of the
foot (192 against 154 at latitude 0 to 3, where the approved has 120). With the dust whole at 3720 the rise
has 43 frames for the exchange and reads about 0.42 to 0.43 by the rule of thumb, too near the limit to
stake a proof of 100 minutes on. Named as not cured in the mail; the ways out to weigh in the next commit:
(a) the band on the globe's foot as a slow tone by the whole move (the zone share, 72 frames in the rise,
whole at 3720), which shows as a faint dark belt at the ring plane at middle heights; (b) a dust without
structure of its own between 8 and 40 px, so that its exchange is a change of tone and not of pattern;
(c) a slower climb between the heights 0.35 and 0.93, which is the path's and needs the gate again.

## 2026-11-25, 01:03 UTC: the dive and the path of r57 are green

After a break in the session (00:53 to 00:57) the job was found running as left; nothing was started twice.
- r57 dive (228 draft frames at rate 2, 4.84 s a frame): "VERDICT: green. No number is over its limit."
  Level step 0.02 at 3601 (limit 1.3). Pop 1.07 from 3568 + 1/2 (limit 1.2); the four largest 1.051 to
  1.067, all at 3567 to 3569. Change in place 16.5 from 3601 + 1/2 at pixel 940, 752. Pattern 0.33 from
  3576 at pixel 1404, 428 (limit 0.45). The ground beside it (3630 to 3641 + 1/2): change 6.1, pattern 0.05.
  Rows of the pattern: 3540 0.05, 3552 0.08, 3560 0.16, 3567 0.17, 3576 0.33, 3584 0.29, 3588 0.20, 3592
  0.15, 3596 0.10, 3600 0.09, 3604 0.11, 3608 0.13, 3612 0.14, 3616 0.14, 3620 0.11, 3624 0.03, 3630 0.03.
  Against r55 (the pale dust on the first table), read from both json files: the head lines are equal
  within 0.01; the rows of the pattern differ by up to 0.054, all between 3609 + 1/2 and 3623, and r57 is
  the lower one there (3612 0.16 to 0.14, 3616 0.19 to 0.14, 3618 0.18 to 0.13, 3620 0.15 to 0.11): the
  dust comes in more slowly through the last frames of the dive. The largest pop differs by 0.011.
- r57 path: "VERDICT: green. No number is over its limit." Whole frames, dive: rate step 0.066 at 3544, turn
  0.062 at 3573, speed 0.066 over 8 at 3543; seams in and out 0.009 and 0.008, 0.000 and 0.001, 0.009 and
  0.020. Rise: rate 0.053 at 3816, turn 0.072 at 3838, speed 0.055 over 8 at 3840; seams 0.004 and 0.019,
  0.002 and 0.003, 0.036 and 0.047; fall before 0.010 over 6, climb after 0.029 over 6 (limit 0.03). At rate
  2: dive 0.067, 0.062, 0.068 over 8; rise 0.053, 0.073, 0.055 over 8; climb after 0.028 over 6. The eye
  against the near ground: dive lowest 1.00 at 3638 + 1/2 (limit 0.87), rise lowest 1.00 at 3794, inside
  the rise 1.02 at 3810 + 1/2, largest step between capture frames 0.07 at 3815 (shown). Rest between the
  rise and the travel: lowest 3.34 px at 3889, 0.373 of the slower end (limit 0.07). The path is the path
  of r54: this commit changes no pace.
- A new measuring tool in my folder: assets-src/saturn/code/globe_tone.py FILM (the instrument of the entry
  before, with the repo's own paths). It makes no pixel of the film.
- Looks: a first push at 01:03 failed three times, the second went through (616e0af2): the report's sheets
  of the rise and the dive.

## 2026-11-25, 01:07 to 01:12 UTC: main moved to af6ba5f (take batch 5), r57 stopped after G13, r58 on the new engine

- r57 G13 (engine 7026711): "PASS G13 saturn: 0 of 83 frames over 0.02 soft (every 6th frame); worst frame
  3390 0.00%, frame 3396 0.00%, frame 3402 0.00%".
- Fetched at 01:07: origin/main is af6ba5f8b41cbc49658ca580acdda035717efa9f. Against 7026711 the engine
  differs in src/director/film.ts (the dim of the open sky while the Sun stands in a travel's frame, the
  Sun's own leg), src/space/farsun (farsun.ts, look.json, shader.ts: the far Sun near Mercury) and
  tests/pass.test.ts; 43 files in all, the rest notes, scorecards and Neptune's web patches.
- My rule: the proof is on the engine of the main that is merged. So at 01:11 I stopped r57 between its
  steps (parity had run one minute; nothing of it is used), put the worktree mainref on af6ba5f and
  started r58 there with the same stop folder (the tree of 5e094e5), finals first.
  What r57 holds on the engine of 7026711: rise, finals, dive, path, G13 (all green, numbers above).
  r57's frames of the rise are kept in /tmp/v/r57/old/frames (the dive's were deleted for the disk:
  3583 MB free with them, 4677 without).
- The plan by what the finals say. If 3465 and 3720 on af6ba5f have the bytes of r57 (4077873a... and
  631f3cf2...), the engine does not touch the stop's frames: then the steps not yet run (parity, gate,
  handover, place, the two sizes, G5 and G17) run on af6ba5f, and the end of the rise with the travel's
  first frames (3868 to 3896) is drawn again there and compared with r57's frames byte by byte. If the
  finals differ, rise, dive, path and G13 run again on af6ba5f, and NAMED moves by about 50 minutes.

## 2026-11-25, 01:13 to 01:22 UTC: finals byte equal on af6ba5f, the slices, main at 9c59fe7 merged

- r58 on af6ba5f, the same stop folder: final 3465 sha256 4077873a1a2005c40bed0e9f225e2ebbe3cf153ee06f75b93a2c3a4735002f0f,
  final 3720 sha256 631f3cf203bc7ed84f841e909dae67cf604d51f1e96f87062860a2977ba4a55b: both the bytes of r57
  on 7026711. Batch 5 does not touch the stop at these two frames.
- What batch 5 changes in src/director/film.ts (read in the diff): the dim of the open sky while the Sun
  stands in a travel's frame now counts only what lies deeper in the frame than at both ends of the leg and
  lowers the open sky's share, "never a stop's own sky"; the Sun's own leg has its own weight. So the frames
  of the stop (3390 to 3884) are out of its reach by the code, and of my two windows only the travel's first
  frames in the rise window (3885 to 3896) can change.
- So the plan is the short one, with two slices as the check. Job r58b on af6ba5f (script job_v.sh, the
  steps of job_u.sh plus two slices): the rise's capture frames 7736 to 7792 (film 3868 to 3896: the thin
  pop line at 3872 + 1/2 and all the travel frames of the window) drawn again and compared pixel for pixel
  with r57's frames (/tmp/v/t22/cmpdir.py), a slice of the dive 7130 to 7160 (film 3565 to 3580, the rows
  of its largest pattern and pop) to compare row against row with r57's report, then parity, place, gate,
  handover, the d253 pairs and G5 with G17. Started 01:18:11.
- Mail to /root at 01:19 (STATUS): the four green results on 7026711, main's move, the check on af6ba5f,
  NAMED about 02:20 if the slices are equal, about 02:50 if the whole rise must run again.
- Looks pushed 01:19 (head 13ad67c0): the dive's pops panel and changes panel and the rise's changes panel
  of r57. Seen in them: nothing new; the globe's shadow on the rings is black (open), the orange moon stands
  at the upper right through the dive's start.
- 01:19:40 fetch: main is 9c59fe7e962cff6328ceb14c574ea7bfe19fac37. Between af6ba5f and it only
  kit/PROGRESS.md and scorecards/round-049: the engine, the tools and the tests of 9c59fe7 are af6ba5f's.
- Commit 1f451ea: the notebook through 01:12 and assets-src/saturn/code/globe_tone.py.
- THE MERGE, and a trap. `git merge origin/main` failed with conflicts in fourteen files (my stop's, the
  notebook, src/director/film.ts, tests/pass.test.ts, kit/PROGRESS.md). Cause: this clone is shallow
  (148 cut points in .git/shallow), so git cannot see that the older mains are ancestors of 8e06f69 and
  finds six merge bases (8e06f69, 2008483, 6884e80, b2ebc62, 3efc31d, f0c67f1) and merges those first.
  I aborted that merge. The true base is 8e06f69, the main merged here in 3859178. Checked by diff:
  (a) main did not change my three folders between 8e06f69 and 9c59fe7, (b) my branch changed nothing
  outside them since 8e06f69. Then the merge with the base named:
  `git merge-tree --write-tree --merge-base=8e06f69 HEAD origin/main` gave the tree 2c7dadd6 without a
  conflict, `git commit-tree` with the two parents 1f451ea and 9c59fe7 gave the merge commit
  a9545ffae0453e7727d110e34bb1d65f3a351153, and `git merge --ff-only` put the branch on it. Checked: the
  head equals main outside my three folders; src/stops/saturn is the tree 9f71d5a4 of 5e094e5 and
  public/assets/saturn is 75fa372a as before. No fetch that deepens the clone: the disk has 4.6 GB.
  For the next merge: the same three commands, with the last merged main as the base.
- tsc on a9545ff: exit 0.

## 2026-11-25, 01:26 to 01:33 UTC: the two slices on af6ba5f are r57 to the pixel and to the row

- Rise slice, capture frames 7736 to 7792 (film 3868 to 3896 + 1/2) on af6ba5f (engine hash c6c6edca; r57
  was engine hash 13d9cc75; the stop hash is 73932c17 in both): the tool drew 90 frames, 7720 to 7809
  (film 3860 to 3904 + 1/2, the slice and the overlap its numbers need). cmpdir.py against r57's frames:
  "frames in both 90 equal in every pixel 90 different 0". rowcmp.py on the two reports: 57 rows in both,
  equal in every field 57. The slice's own lines: "VERDICT: green", level step 0.05 at 3875 + 1/2, pop
  1.196 from 3872 + 1/2, pattern 0.27 from 3868 (the whole run's row at 3868 is 0.27 too).
  So batch 5 changes no pixel of the rise's last 25 frames and none of the travel's first 20.
- Dive slice, capture frames 7130 to 7160 (film 3565 to 3580) on af6ba5f: 31 rows in both, equal in every
  field 31. Its lines: pop 1.07 from 3568 + 1/2, pattern 0.33 from 3576 at 1404, 428: the whole run's two
  largest. (r57's frames of the dive were deleted for the disk, so here the rows are the check.)
- What this proves and what not. Proved on af6ba5f: both finals by bytes, 90 frames of the rise window
  by bytes, 88 rows of the two reports field by field. Not drawn again on af6ba5f: the rise 3798 to 3859
  and the dive outside 3565 to 3580; they are frames of the stop, which the change in film.ts does not
  reach by its code. The reports of the whole rise and the whole dive are r57's on 7026711 and are
  named so in the mail.
- Net size of my folders against main 9c59fe7 at a9545ff: src/stops/saturn plus 0.039 MB, assets-src/saturn
  plus 0.117 MB, public/assets/saturn 0. 18 files differ from main, all in my three folders.

## 2026-11-25, 01:33 to 01:39 UTC: parity, place, gate and handover on af6ba5f

- Parity (3.6 min): "VERDICT: green. No number is over its limit." "Largest mean difference: 2.180 at frame
  3720 (saturn.terrain), limit 12." Coarse mean 0.920 at 3720 (limit 3.2). Block level -6.453 at 3866
  (limit 12). Level of the whole frame -0.831 at 3720 (limit 2.2). The named tree 2d54c49 read 2.785, 1.257,
  -6.563 and -1.125: the frame factor on the ring widths took a fifth off the mean and a quarter off the
  level. Rows (mean, level): 3465 1.671, -0.642; 3563 1.739, -0.627; 3585 1.590, -0.435; 3608 1.616, -0.360;
  3720 2.180, -0.831; 3829 1.616, -0.400; 3848 1.574, -0.442; 3866 1.674, -0.445; 3923 travel 1.561, -0.026.
  The level that stays in the hold (-0.64) is the bloom of src/post/chain.ts, not mine (mail 821, point 3).
  Panel looked at, all nine rows: the same picture in both formats, the difference is fine lines at the
  ringlets' edges and at the limb.
- Place (2 s): green. "Note: the stop draws no place picture: there is nothing to switch off." for the dive
  and for the rise.
- Gate: "PASS G11  every asset has a row or a recipe", "PASS G15  at most 2 sets per frame; finished stops:
  saturn/web 274 MB, saturn/full 747 MB".
- Handover (draft, sides, flow, path): saturn.dive side difference at T pass, flow gap at T pass, every frame
  pass; saturn.rise the same three, pass.
- Still to come in this job: the d253 pairs (3567 and 3612 at both sizes in both sets), G5 and G17. After
  it: job D (path on af6ba5f, my finals 3567 and 3866), the tests, job C (five draft frames outside the dive
  and the rise, main's stop folder against mine).

## 2026-11-25, 01:39 to 01:44 UTC: the d253 pairs on the tree to be named (draft tier, af6ba5f)

- Eight stills: 3567 and 3612, master (1920 by 1080) and uhd (3840 by 2160), full set and web set. The uhd
  picture is halved by the mean of each 2 by 2 block; mean absolute difference 0 to 255 over all pixels and
  channels (/tmp/v/t21/sizes.py), and cells of 10 by 10 px over 12 as the Builder counts (cells.py).
  - 3567, the two sizes: full set 1.753 (0 of 20736 cells over 12, most 7.5), web set 1.620 (0 cells).
  - 3567, the two sets: at 1920 2.181 (111 cells over 12, most 18.5 at px 895, 1075, the near ring at the
    lower edge: the takes of the kept set are softer in the web set), at 3840 2.826 (halved 2.151, 73 cells).
  - 3612, the two sizes: full set 1.629 (0 cells, most 6.9), web set 1.625 (0 cells).
  - 3612, the two sets: at 1920 0.156 (0 cells), at 3840 0.190 (halved 0.159).
  The same numbers as before the tables were stretched (3612 web 1.624 then). Sheet of the eight looked at:
  the same picture four times in each row. In the looks (head 3584c77a, pushed 01:43) with the parity panel.

## 2026-11-25, 01:44 to 01:56 UTC: G5 and G17 on af6ba5f, the path again there

- "PASS G5 saturn: 3465 hold invalid 0 coverage 0.514; 3567 dive invalid 0 coverage 0.601; 3720 terrain
  invalid 0 coverage 0.733; 3866 rise invalid 0 coverage 0.468"
- "PASS G17 saturn: 3465 median 1.054 p25 0.918 over 71 tiles; 3720 median 0.971 p25 0.557 over 62 tiles"
  (limit 0.8 on the median). The named tree 2d54c49 read 3720 median 0.945, p25 0.477; r54 read 1.013 and
  0.567. The quarter of the tiles under 0.557 is the near field under the shutter (open, item 16).
- Path on af6ba5f (job D, 2 s): "VERDICT: green. No number is over its limit." The report equals r57's
  from its fifth line on, line for line (diff: 0 lines).
- Job D goes on with my finals of the judged frames 3567 and 3866. r57's old frames are deleted.

## 2026-11-25, 01:56 to 02:07 UTC: the finals of 3567 and 3866 on the tree to be named, looked at

- Job D on af6ba5f: final 3567 sha256 41415f50e58caa450b4a77b3ed0e16e71f17caf6463fb122947e3425bd07656d
  (321 s, 64 samples); final 3866 sha256 cece00f8cda26e5893df4372080833fdd8ff4a3a56174f78f7238a47925d0370
  (238 s). A final of the dive or the rise costs four to five and a half minutes here, not the hundred
  seconds of the hold: plan with that.
- Main's stop folder at 9c59fe7 is the tree of 2d54c49 (7f13c953, checked by diff), so "before" in every
  comparison is the named tree of round 44. Its finals of 3567 and 3866 are not drawn on af6ba5f (ten
  minutes); both frames change on purpose (the dive's path and paces, the laws by height).
- Looked at, whole and the lower halves at full size.
  3567: rich; the kept takes of the hold with the dive begun. Faults I see: the globe's shadow on the rings
  is near black with faint ringlets; the night side of the globe is brown with a blue rim at the right
  limb; the stars in the gap between globe and ring end hard at the inner ring where it lies in the
  shadow (round item 5, not touched); a blue white rim along the outer edge of the rings (item 4).
  3866: the near ring at the lower left is drawn out by the shutter, its lines stay lines (item 16); the
  Milky Way in the gap ends hard at the inner ring inside the shadow, more visible than at 3567 because
  the sky is brighter there.
- Looks pushed 02:06 (head 0d5e4f0b): both finals and the crop of 3866 with the hard end.
- 02:05:18: vitest started on the merged head a9545ff, alone.

## 2026-11-25, 02:05 to 02:12 UTC: the tests on the merged head

- vitest on a9545ff (main 9c59fe7 merged), alone, 6.3 minutes: exit 0, 604 tests passed in 56 files, none
  failed, none pending. tests/globe-cap.test.ts "brings a colour level in by the texels of its parent" ran
  4.74 s, under the 5 s of mail 670, so it was not run alone.
- tsc exit 0 on the same head (01:21).
- 02:11:42: job C started on af6ba5f: draft stills of 3389, 3539, 3567, 3866, 3885 and 3920 with main's
  stop folder and with mine, to compare by pixels (the frames outside the dive and the rise, and the two
  judged frames of the moves).

## 2026-11-25, 02:12 to 02:26 UTC: the frames outside the dive and the rise; main moved again (batch 6)

- Job C on af6ba5f, draft tier, main's own stop folder (the tree of 2d54c49) against mine (the tree of
  5e094e5), pixel for pixel (/tmp/v/t22/cmp2.py, pictures in /tmp/v/r58c):
  3389 equal in every pixel; 3539 equal in every pixel (the hold is the same picture);
  3567: 96.68 percent of the pixels differ, mean 15.809 of 255; 3866: 89.13 percent, mean 10.809 (the
  moves, on purpose);
  3885: 1.43 percent of the pixels differ (29587), largest 46, mean 0.005 of 255, box x 0 to 1415, y 57 to
  1079; 148 pixels by more than 1 level, 57 by more than 4 (box x 374 to 891, y 323 to 835: the globe's
  outline), 9 by more than 16; the largest at pixel 701, 325 on the upper limb, main 128, 115, 92 against
  mine 174, 161, 135;
  3920: 134 pixels differ by one level, mean 0.000.
- The picture of the difference at 3885 (/tmp/v/t22/where.py, diff_3885.png): one level of noise over the
  whole ring sheet and thin over the globe, bright points all round the globe's outline, 43 pixels on the
  moon, nothing right of x 1415 where there is only sky. So the lens and the sky stand where they stood.
- The path part with main's stop folder (job P, one second, /tmp/v/r58c/path_main.json) against mine
  (/tmp/v/r58/smooth_path.json), both on af6ba5f: the height at 3885 is 5.619 in both; the speed at 3885 is
  3.7721 against 3.7710; the leave line is 0.3745 for main's folder (lowest 3.3575 at capture frame 7778,
  film 3889) against 0.3732 for mine (lowest 3.3398). Both green.
- NOT TRACED: which term moves the outline of the globe at 3885 by a part of a pixel. It is not the lens.
  New number 25 of the open list. To trace it: draw 3885 at the draft tier with single files of main's
  folder laid over mine (globe.ts first, then kept/globe.ts, sheet.ts, skim.json), 30 s each.
- The open list now: 16 to 20 as before; 21 the foot band at 3720; 22 the globe's shadow on the rings near
  black; 23 the near field reads as pale dashes on grey; 24 the dark gap blacker and wider; 25 the outline
  at 3885. Next free number: 26.
- The NAMED mail (the fourth) is written from /tmp/v/mail/named4_draft.md with fill4.py; point 2 is the list
  above; point 3 says that "before" was drawn on the engine of ed003c7.
- 02:23 fetch: main stands at 7fd2923ce15a8a7fbbed3193ac979af2f59082b1 (status 275, d262). Since 9c59fe7:
  take batch 6 (merged on main 01:47 as aeffd51): src/bodies/cap.ts, limb.ts (new), planet.ts,
  src/diagnostics/diag.ts, nine test files, tools/smooth.ts, tools/smooth/made.py and pose.ts,
  tools/img/smooth.py and range.py, assets-src/shared/GLOBE-NOTES.md, kit/PROGRESS.md. Nothing in my
  three folders. By d261 the Builder MEASURED 115 of 115 draft frames of main equal to the byte, "so no
  picture moves yet", and the proving run of the new reader on main's Saturn pictures was green (dive 4,
  rise 4). The reader is new: "The pair is read on the nearer of its two frames, the farther one carried
  from its finer picture", with a band printed for each pattern reading. So the pattern numbers of my rise
  (0.40) and dive (0.33) are numbers of the old reader.
- The frames of the smooth tool are kept by a stamp of the engine hash and the stop hashes, so on batch 6's
  engine every frame is drawn again (rise 23 minutes, dive 21). I do not rewrite stamps.
- Plan: commit this entry; merge 7fd2923 with the base 9c59fe7 named; on the merge: tsc, vitest (alone),
  the path part, the finals of 3465 and 3720 by hash and drafts of 3567 and 3866 against those drawn on
  af6ba5f; then the NAMED mail, saying which numbers are from which engine and that the picture parts by
  batch 6's reader are running; then that run (rise, dive, parity, place, G13) and a mail with its lines.
  Batch 7 (the bloom cure, the frame law's steps in the engine, the relief's edge) is cut and in its checks;
  it moves pictures. I do not wait for it.

## 2026-11-25, 02:26 to 02:40 UTC: batch 6 merged, what is measured on its engine, the fourth NAMED mail

- Merge 7359286c9cfa43401d5e7dcc989b1ce41f1ca07d: main 7fd2923 into the branch, made with the base 9c59fe7
  named (merge-tree, commit-tree, ff-only, as before). Checked before: main changed nothing in my three
  folders since 9c59fe7, the branch nothing outside them. After: the head equals main outside the three
  folders; src/stops/saturn is still 9f71d5a4 and public/assets/saturn 75fa372a. The worktree mainref is
  detached at 7fd2923 (engine hash ee785742acc8b67e).
- On the merged head: tsc exit 0 (both new files in its list). vitest alone, 02:26:17 to 02:32:52: exit 0,
  635 tests passed, none failed, none pending, 60 test files. tests/globe-cap.test.ts "brings a colour
  level in by the texels of its parent" ran 4.44 s.
- Job r59 (job_v.sh, steps finals path rise dive parity place g13), started 02:33:00 on 7fd2923 with my
  stop folder: final 3465 sha256 4077873a1a2005c40bed0e9f225e2ebbe3cf153ee06f75b93a2c3a4735002f0f, final
  3720 sha256 631f3cf203bc7ed84f841e909dae67cf604d51f1e96f87062860a2977ba4a55b: both the bytes of af6ba5f
  and of 7026711. The path part: "VERDICT: green. No number is over its limit.", 274 lines, every line
  equal to the report on af6ba5f but the commit line. The rise's pictures began 02:37:27 (new reader, every
  frame drawn again); then dive, parity, place, G13. Expected: rise about 03:02, all about 03:35.
- Looks pushed 02:27 (head f5bf8a30): the draft pairs of 3567 and 3866 (main's stop folder beside mine) and
  the crop of the upper limb at 3885.
- 3885 again, read closer. The path part of both folders says the lens runs a slightly different course
  through the leave (speed at 3885 3.7721 against 3.7710, height at 3890 5.9511 against 5.9521, at 3896
  6.0937 against 6.0949; at 3884 and 3885 equal to four places): the travel starts from the rise's end and
  my rise has new paces. A shift of that size would give one level over the ringlets and no change in the
  stars, which is what the difference picture shows. The single pixels of up to 46 levels on the outline
  need more than a smooth edge gives: at six times (/tmp/v/r58c/limb_3885.png) the globe's upper limb is a
  row of dark single pixels between the cream globe and the orange haze, in main's folder and in mine. A
  reading, not proven by a trial. Number 25 stays open.
- FOUND for round item 4 (edges at native size), to check on the judged frames next: that row of dark
  pixels on the limb. In globe.ts the last line multiplies the colour by cover times mix(cover, 1, uEdgeLin)
  and writes cover as alpha: with uEdgeLin under 1 an edge pixel is darker than a plain blend of the globe
  over the haze. To do: crop the limb of 3465, 3567 and 3720 at six times; read uEdgeLin and uEdgePx of
  both looks; try uEdgeLin 1 on a move frame (the hold must keep its bytes, so only by a law that is none
  in the hold, or not at all if the kept look draws the hold's limb the same way).
- The fourth NAMED mail goes out now from /tmp/v/mail/named5_draft.md (fill5.py): it names the head that
  holds this entry, says which numbers come from which of the three engines (7026711, af6ba5f, 7fd2923) and
  that the picture parts by batch 6's reader are running. Its text is kept in /tmp/v/mail/named5.md.
- After the mail: watch r59; mail the rise's lines when they are in, then the rest. If the new reader reads
  a line red: say so at once, find the frame, cure it within 90 minutes of the mail.

## 02:48 UTC Nov 25. After the fourth NAMED mail (88ba238): what is running, what was found, what comes next

- State: head and remote head 88ba2385ea8a0e9f2bb77ba8dd5eefabf071fe5e (merge of main 75102d4, base
  7fd2923; main's change was kit/PROGRESS.md only: status 276 and d263). The NAMED mail went out about
  02:40 (text in /tmp/v/mail/named5.md). It says which numbers come from which engine (7026711, af6ba5f,
  7fd2923), that on 7fd2923 only tsc, vitest, the finals of 3465 and 3720 and the path part are measured,
  and that my own run of the picture parts by batch 6's reader goes on (rise, then dive, then parity,
  place, G13).
- Read in kit/PROGRESS.md on main, no mail to me. d261: batch 6 moves no picture (115 of 115 draft frames
  equal) and the new reader's proving run on main's Saturn pictures is green. d263, written about another
  stop: a commit that brings new visible faults and moves a judged frame outside its folders is not taken;
  a builder does not draw the pictures part of dive and rise itself, the Builder's machines draw it at
  every NAMED line, and slices on request.
- Decision: r59 runs until the rise's pictures are read (about 03:01), because the reader is new and my
  rise's pop stood at 1.196 of 1.2 by the old one. Then I stop the job before the dive unless the Builder
  writes otherwise, and the machine goes to draft trials of the cures. Dive, parity, place and G13 on the
  newest engine are then his machines' numbers, not mine, and the mail says so.
- CORRECTION to the entry above ("FOUND for round item 4"): the row of dark single pixels on the upper
  limb is of the draft tier only. The finals of 3465, 3567 and 3720 at six times
  (/tmp/v/r58/limbs_final.png, in the looks) show a smooth limb with no dots. So it is no film fault and
  no finding for item 4. Lesson: a fault seen at the draft tier is checked at the final tier before it is
  called a fault of the film. Item 4 is still open and not found.
- Looks pushed 02:47: the finals' limbs at six times; the approved close image beside final 3720 whole,
  the right foot region at full size, the lower left near field at full size.
- Reading of the approved image against final 3720 (full size crops, numbers are rows of the 1920 by 1080
  picture at the right foot, x about 1500):
  - 21, the foot. Approved: the lit globe ends at y 572 with a grey shadow band under it, dim grey ringlets
    from there to the bright rings, which begin at y 652. Mine: the globe runs to y 604, a tan band of about
    11 rows sits where the grey shadow band should be, the bright rings begin at y 724.
  - 22, the globe's shadow on the rings. Approved: grey ringlets can be read under the night side. Mine:
    a near black wedge.
  - 24, the dark gap. Approved: blacker and wider than mine, with a soft upper edge and thin dark grey
    ringlets inside it.
  - 23, the near field. Approved: crisp slate, pink and cream ringlets with fine sparkling grains. Mine:
    grey with pale dashes.
- Code facts for 22, read while the rise renders. The code look (sheet.ts) shades the ice inside the
  globe's shadow with mix(uFloor, 1, lit) times uShade.z, uFloor from sheet.json shadow.floor
  [0.006, 0.008, 0.012]. The far look inside the model (keptSheet) has its own floor:
  uKFloorHold times (uKFloorTone.x + uKFloorTone.y * dense) times ramp times body. Which of the two looks
  a pixel shows is decided per pixel by distance (wfar, skim.json handover.kept.reach). Not known yet
  which look draws the black wedge at 3720: a draft trial decides.
- Plan for 22: a fill of the shadow as a slow grade by the height of the lens, a table in skim.json and a
  function in grade.ts beside gradeShare, zoneShare, innerShare, duskAt, dustAt and hazeDayAt, none at the
  hold's heights so the hold keeps its bytes, the same in both looks so no exchange shows. Target at 3720:
  grey ringlets under the night side. By mail 785 a slow grade by height through the whole move is allowed;
  a layer that comes in by height is not: the fill changes the tone of ice that is there at every height.
- Lens heights over the ring plane (out/scratch/lens.ts): 3700 0.395, 3720 0.362, 3740 0.333, 3760 0.318
  (the lowest), 3780 0.335, 3800 0.391, 3810 0.434, 3820 0.534, 3832 0.823, 3840 1.132.
- Order of work after the rise is read: 22, 21, 24, 23 (round items 1 and 2), each by draft trials at 3720
  with 3465 checked for its bytes; then item 3 (the globe: paler, grey blue band near the top limb, tight
  terminator to a black night side); item 5 under mail 729's condition; item 4 (not found yet).

## 05:03 UTC Nov 25. Round 44's items 5, 1 and 3 in one tree; item 2 in work; mails 855, 862, 897, 905

- Mails since the last entry. 855: the Builder's machines draw the motion report (sa9), I do not draw it;
  my machine goes on with the cures of round 44's other items, worst first; the flight after the rise: the
  pairs decide; looks every 30 minutes. 862: sa9 03 green; take range-saturn.patch in the next commit, hold
  bodies-saturn.patch. 897 (04:36): 88ba2385 is on main with take batch 8 (merge 7ecd813b); round 51,
  Saturn's round 2 of 3, runs on it since 04:14; its whole smooth report came back green (sa9-04); the
  critics' words come when the round closes; carry the range patch; write down by frame what the critics
  will still name. 905 (04:48): the range line stands once in globe.ts and once in kept/globe.ts on main,
  nothing is laid. The hold is lifted for item 4 under mail 729's condition: the final of 3465 before and
  after, side by side at full size, with crops of each cured edge, in the looks before the name, and no
  worse against the hero anywhere (the jury gave the hold 0 of 10, so keeping its bytes protects nothing).
  Order for item 4: the moon first (bands, haze, limb), then the glow's dip at the sunlit limb, then the
  orange line on the night limb; the ring's rim line that the hero has too stays. Item 5 is severe and in
  my tree: commit what stands as soon as its checks are in and NAME it, round 3 of 3 takes it; do not hold
  a cured severe item back for item 2.
- Read on main (kit/PROGRESS.md, main 64c4ccb): d264 and d270: take batch 8 with 88ba2385 is on main and
  round 51 judges it. d271: the range patch needs no laying.
- By mail 855 the job r59 (my own run of the picture parts) was stopped unread at 02:49:52 and the
  reference tree was restored at 03:03. Dive, rise, parity, place and G13 of 88ba2385 on the newest engine
  are the Builder's numbers (all green by d267 and d270: largest pop of the rise 1.196 of 1.2, largest
  pattern change 0.41 of 0.45).
- The range patch: its two lines have been in my tree since mail 797 (git apply --check -R passes on the
  tree, so the patch is whole in it). Nothing to lay. bodies-saturn.patch is held and not applied.
- FOUND, item 5 (the sky behind the dive at 3567 ends in a hard ellipse at the inner ring edge). Cause:
  sheet.json shadow.solid. Inside the globe's shadow the shaded sheet lets stars through at its inner edge
  and grew solid between the radii 1.2458 and 1.27, in the far look and in the kept set alike. So in the
  shadow the stars stood up to the inner rim and ended within 0.024 radii of it: the hard ellipse. The
  same edge shows at 3866. Cure: the ramp is now 1.2458 to 1.5, the stars thin out over a quarter of a
  radius and no edge is left to name. The share of it is 0 in the hold (kept/set.ts uSolid by the dive), so
  3465 should keep its bytes; the final decides.
- Item 1 (the close view is not the approved shot), open 21 and 22, the foot and the black wedge. What was
  wrong: the dust inside the inner rim was thin (depth 0.3 at the rim, 0.6 by the globe), so the lit globe
  ran down through it to the plane, and under the night side the sheet was a near black wedge. Now:
  - skim.json inner.depth [1.3, 1.3], inner.light [0.3, 0.3], inner.dark [1.0, 1.2], bands.floor 0.75,
    foot.depth 4.5, foot.height [0, 0.036], foot.ink [0.19, 0.165, 0.125]: the dust closes the foot, as the
    grey band under the globe in the approved image.
  - inner.rings (new): the dust lies in ringlets of its own, three sets of widths 0.027, 0.014 and 0.0075
    radii, by sheetBandsOf in sheet.ts, the plateaus of the outer rim with their own widths and seed,
    filtered by the footprint.
  - inner.air (new) and grade.ts dustAir: the light of the Sun reaches the dust through the globe's air
    (depth 0.15 straight up, thinning by e over 0.04 radii), on a slant ray, from the place and the angle
    of the Sun alone. The first trial (n5) had a hard diagonal step in the dust at the terminator plane;
    the two cases of the slant (Sun over and under the horizon of the point) now meet where the Sun stands
    on the horizon, so there is no edge. The sheet and the dust in front of the foot (globe.ts) call the
    same function.
  - grade.ts dustShadeAt and dustShade: the dust shades the strip of the globe that shows through it
    behind the plane.
  - sheet.ts wfar: the far look begins at the rim (it began inward of it), and the sand of the sheet has
    no strength inside the rim: dust is powder.
  - light.grade.radial.gain knots 0 to 11 (radii 1.03 to 1.25): one factor [2.97, 3.2085, 3.6], the dust in
    slate grey as in the approved image (the measured factors there followed the globe's glow).
  All of it by the share of the dust (innerShare, by the height of the lens), none in the hold.
- Item 3 (the globe too orange and too busy, a broad brown terminator, painted ribbons), open 18:
  - skim.json light.tone and grade.ts latTone: a factor on the colour of the clouds by latitude, 81 knots
    by whole degrees, measured by assets-src/saturn/code/lat_tone.py (the lit globe of the approved close
    image over the lit globe of frame 3720, two passes), to the power of the share of the grade of the
    rings (gradeShare, by the height of the lens). The knots stand in a row of float texels read with
    texelFetch (no filter on a float texture, so nothing beyond the workspace record).
  - tone.calm: near the sheet the map is mixed by 0.4 with itself averaged over 12 texels and the boost of
    its small features (look.globe.fine) is taken back by the same share. This is a grade by height on
    the one map, not a second map; I name it in the mail so the Builder can rule on it against mail 785.
  - light.dusk.night [1, 0.45] (was [1, 1.3]): the night side is dark near the sheet. dusk.tint: the last
    light on the clouds is less red and less blue.
- Item 2 (the near ring field), open 23, in work, not cured. In the tree: grains.json (trial g1: finer
  grains), ringfine.json from 2 with near.level and near.hue on the octaves 2 to 5 (waves 0.032 to 0.004
  radii), near.wide.hue 0 and the new key near.wide.first 5 (field.ts uRfWideFirst): the boost of a ringlet
  that is wide on screen applies from octave 5 on, the octaves 2 to 4 stay soft lanes of colour. Trial g5
  (review tier, /tmp/v/x/g5_3720.png, in the looks 04:58): wide lanes of rose and grey beige in the lower
  left as the approved has, but the grains are streaks under the shutter where the approved has a matte
  fine grain, and the lanes are less blue grey. In the hold these octaves have no strength (level 0, hue 0),
  so the hold should keep its bytes.
- FOUND for item 2: at 3720 the ring beyond a distance of 0.6 to 1.3 radii from the lens is the far look
  (handover.kept.reach, by the logarithm of the distance), which has the kept profile and its mottle but no
  sand: the bright B ring in the middle of the frame is smooth stripes. A trial with the reach at
  [1.5, 3.5] (g4) was garish and is not kept. Next idea: sand by distance in the far look, by the same
  formula in sheet.ts keptSheet and kept/rings.ts, zero at the hold's distances (2.4 and more).
- What I expect the critics still to name on this tree, by frame (mailed to the Builder about 04:45):
  3465: the edges of item 4 (the moon's limb, bands and haze in titan.ts; the dip of the glow at the sunlit
  limb; a thin orange line on the night limb over the bright rings). 3567 and 3866: item 5, cured in this
  tree. 3720: the near field (item 2) and what is left of item 1 (the composition against the approved,
  the dark gap, open 24); the globe (item 3) should read cured. 3866: the near ring soft (open 16).
- Open list (next free 26): 16 near ring at 3866 soft; 17 palette at ringlet scale; 18 night side, cured in
  this tree; 19 dark grooves; 20 day edge of haze; 21 foot, cured in this tree; 22 black wedge, cured in
  this tree; 23 near field, in work; 24 dark gap; 25 travel after the rise (the pairs decide).
- Plan. (1) This commit, then its proof on the committed tree: slices of the dive and the rise where the
  grade by height runs, finals of 3465, 3567, 3720 and 3866, path, parity, place, gate G11 and G15, G5,
  G17, G13, handover. (2) Merge main, tsc, the unit tests, push, NAMED mail. (3) Item 4 with the hold
  lifted, in the order of mail 905, as a second commit. (4) Item 2 further.

## 25 Nov, 05:35 to 06:20 UTC: the pace of the dust over the night side (commits 06d73b4, d8723c6), item 4 begun

- Proof r60 of f7991ad: red in the dive slice (pattern 0.65 at 3612), killed. Commit 06d73b4: the dust inside
  the rim back to the values of the tree the round took (skim.json inner, with rings.amount 0, air.depth 0 and
  the new inner.shade 0), the palette of the globe by latitude smoothed (lat_tone.py smooth, the raw knots kept
  as assets-src/saturn/code/lat_tone_raw.json).
- Proof r61 of 06d73b4: dive slice 3600 to 3630 red, pattern 0.65 at 3603 (pair 3603 and 3611), most at
  pixel 1388, 700; rows 3600 to 3604 0.41 to 0.65; rows 3608 to 3616 0.11 to 0.15 (the cure of the dust works
  there); pop 1.02, level step 0.02. Killed.
- CAUSE, seen in the frames: the dust inside the rim, lit, lies as a pale band over the night side of the
  globe from the equator's near arc to the rim, ending at the globe's shadow. With the night side sunk by the
  grade (dusk.night 0.45 by gradeShare, a share of 0.65 already at height 0.93) and the map calmed, the faint
  night clouds went out just as the dust came in, so the pattern there changed within 8 frames. The tree the
  round took read 0.09 to 0.12 on these rows.
- Cure 1 (E3): grade.ts nightShare, skim.json light.dusk.nightHeights [0.36, 0.6]: the fall of the night side
  follows heights of its own, under those of the grade, so over 0.6 radii the night side keeps the hold's light.
  Mini slice: 0.453 at 3603 (limit 0.45), most at pixel 1404, 716. Still red by a hair.
- MODEL that fits these readings: the report reads a pair of frames 8 apart as 1 less the cosine of the angle
  between their patterns. With the night clouds a and the dust d times its share s (inner.by), the pattern's
  angle is atan(s d / a), and d / a is about 25 at the night spot (the dust equals the clouds at a share of
  0.04). The old knots (0 at 0.93, 0.02 at 0.866, 0.04 at 0.806, 0.061 at 0.751) turned that angle by 57
  degrees in the frames 3603 to 3611: 1 less cos 57 is 0.455, the reading.
- Cure 2: assets-src/saturn/code/inner_onset.py (input rise_heights.json, the lens height by frame on the
  rise, printed from the flight) sets the knots of inner.by from 0.519 radii up so the angle runs straight
  with the frames of the rise, the faster of the two flights through these heights: 37.6 degrees in 8 frames
  there (1 less cos is 0.21). New shares: 0.548 0.0918, 0.58 0.0641, 0.616 0.0473, 0.657 0.0351, 0.701 0.0261,
  0.751 0.0185, 0.806 0.0118, 0.866 0.0058, 0.93 0. The knots under 0.519 are as they were (3720 keeps 0.652).
- Commit d8723c6 holds both cures. Proof r62 on it (engine 64c4ccb, draft, rate 2): dive slice 3600 to 3630
  GREEN: pattern 0.12 at 3615 + 1/2, most at pixel 680, 644; pop 1.02; level step 0.02. Rise slice, finals
  and the other checks running as I write.
- Item 4, the moon (mail 905: bands, haze, limb first). FOUND in titan.ts: the stepped limb comes from the
  rim term, rim colour 1.9, 1.15, 0.6 times (1 less z) to the power 4, a line of light under a pixel wide at
  the very limb and 2.5 times as bright as the ground, cut by the cover to the power 1.5; no count of samples
  holds such a line still, and after the tone curve each pixel on it is either near white or dark. The bands
  were two sines of the latitude: regular stripes, the plastic look. There was no air but a faint halo.
- The new moon (titan.ts, titan.json; look.ts and kept/look.ts read the one file; model.ts and kept/set.ts
  pass the size of the frame as uFoot): the cover eased over 1.3 px with the limb in the middle; the rim a
  bell 0.025 radii wide, never under 0.7 px, by the Sun's angle at the limb; no limb darkening (the fit left
  none); the south pale, the north hooded; irregular belts from value noise of the latitude bent by the
  mottle, a mottle of two sizes and a fine grain, all from the integer hash of kept/rings.ts (the same on any
  machine, the old sine hash was not); a thin haze over the lit limb that adds light; a high haze of the
  north where the Sun grazes it, mauve to violet, as the approved moon has at its top right. The smooth part
  is a least squares fit in numpy to the approved moon (rms 16.9 to 9.6 display values over the crop), the
  moon's radius by that fit 30.6 px in the approved picture against 31.7 of the older look: size 0.943.
  NOT YET RENDERED by the film: the first render follows when the proof is through.
- Item 4, the sunlit limb over the inner ring gap (frame 3465, crop 672,560 to 732,630): the approved edge
  goes from the gap to the ground over 3 pixels in pale tones (85,58,30 then 124,95,63 then 200,168,132 then
  244,212,174); mine over 2 with one orange pixel (89,55,35 then 184,112,67 then 230,187,132 then
  244,217,177), and no glow below the ring plane where the approved keeps a soft one. In my shaders: the
  globe writes its colour times the cover squared (kept/globe.ts, globe.ts uEdgeLin 0) over a ramp of 2.6 px
  that lies wholly inside the limb. The cause of the missing glow is not found yet (the shine of
  kept/rings.ts and the shell are the two that draw there); diagnostic renders when the machine is free.

## 25 Nov, 06:20 to 06:45 UTC: the rise red on d8723c6, the cause is the unshaded foot dust

- Proof r62 on d8723c6: the rise slice 3798 to 3840 is RED: pattern 0.89 at 3827 (pair 3827 and 3835), most
  at pixel 1856, 876, limit 0.45, 21 frames over it, first 3821 + 1/2 (rows 3819 0.30, 3821 0.41, 3823 0.58,
  3825 0.78, 3827 0.89, 3829 0.63, 3831 0.52, 3833 0.40, 3840 0.17); pop 1.07 at 3814 + 1/2, level step 0.03.
  The dive slice was green (0.12). Killed at 06:28, no finals. Status mail to the Builder 06:38: the NAMED
  slips, earliest about 08:30.
- CAUSE, shown by three stills of 3819 lifted 4 times (/tmp/v/x/dust_cause_3819.png, in the looks): as is,
  a pale band lies over the night side at the foot (display 58 to 62 over a night side of 20 to 22); with
  inner.foot.depth 0 the band is gone; with inner.depth [0, 0] (the sheet's dust off) it stays. So the band is
  the dust in front of the foot of the globe (globe.ts, uDust and uDustInk): its light is the ink times
  dustAir, and dustAir is 1 everywhere when inner.air.depth is 0 (so since 06d73b4). The dust stood lit in
  full inside the globe's shadow. In the tree the round took it was lit there too, but the night clouds were
  bright and busy enough to carry the pattern. The cure of the timing in d8723c6 (inner_onset.py) treated the
  wrong thing, and its knots had a kink between 0.519 and 0.548 radii that the lens crosses in a frame and a
  half of the rise.
- Cure in test (tree: d8723c6 with skim.json alone changed): inner.air.depth 0.15 again (height 0.04), so the
  dust in the shadow returns no sunlight and only dims the night side behind it (display 22 to 12 at 3819,
  no band left to see at 3827); inner.by back to the smooth knots of the tree the round took (0.136, 0.123,
  0.109, 0.095, 0.079, 0.061, 0.04, 0.02 from 0.548 to 0.866); the note of inner says so. Mini slice r63 of the
  rise (capture frames 7636 to 7680) running.
- If the slice is still red: the dust in the shadow would have to return what the night clouds behind it
  return (ring shine on both alike), a number in skim.json inner.foot, so that no band shows over the night
  side at all. Physically the dust in the plane sees the rings edge on and should be darker than the clouds,
  so the dim band is the truer picture; decide by the report.
- The moon edits of item 4 are set aside in /tmp/v/moonsrc (titan.ts, titan.json, look.ts, model.ts,
  kept/look.ts, kept/set.ts, and moon_tracked.patch) so the proof tree holds the cures of items 1, 3 and 5
  alone. assets-src/saturn/code/moon_fit.py stays in the tree (a tool, no pixel path).

## 25 Nov, 06:45 to 07:26 UTC: commit da02133 (local), its proof r64 running, and a correction of my own claim

- Commit da02133 (local, not pushed yet; parents d8723c6, 06d73b4, f7991ad, all unpushed; remote head
  7755294): d8723c6 with skim.json inner.air.depth 0.15 and inner.by from 0.548 radii up back to the knots of
  the tree the round took; inner_onset.py and rise_heights.json removed (they treated the wrong thing).
- Mini slice r63 of the rise on that tree (frames 3818 to 3840): GREEN, pattern 0.37 at 3832 + 1/2 (pixel
  1740, 980), pop 1.07, level step 0.02.
- /tmp/v/job_v.sh fixed: at its end it restores the reference tree (git checkout and git clean of
  src/stops/saturn in mainref), so a later job cannot inherit files of an older one.
- Proof r64 on da02133 started 06:52 (engine 64c4ccb, draft tier, rate 2). So far:
  - dive slice 3600 to 3630 GREEN: pattern 0.12 at 3615 + 1/2 (pixel 680, 644), pop 1.02 from 3626 + 1/2,
    level step 0.02 at 3601.
  - finals: 3465 sha 4077873a1a20 (the bytes of the named tree, so the hold is untouched); 3567 sha
    490370cc897d (against the named: 31866 pixels differ by more than 4, the cure of item 5); 3720 sha
    7c659e5b2b2a; 3866 sha cb10803eb6dd (against the named: 28178 pixels over 4, 12573 over 16, all in the box
    987,655 to 1268,1006: the sky inside the globe's shadow now thins out through the shaded inner ring, the
    hard ellipse is gone; looked at at full size, /tmp/v/x/r64_3866_gap_pair.png, in the looks).
  - rise slice 3798 to 3840 drawing, then path, G13, G17, gate, parity, place, handover.
- CORRECTION, found 07:10 to 07:17 with out/scratch/proj.ts 3720 (ring plane points to pixels, with the
  globe's shadow marked). My commit message and my 06:38 mail say the dust in front of the night side stands
  in the globe's shadow. That is wrong. At 3720 the lens stands at -0.485, 0.362, 2.645 (ring frame, y the
  normal of the plane), the Sun at -0.910, 0.272, -0.314, the phase is 96 degrees. The dust that lies between
  the lens and the foot of the visible night side (0 to 20 degrees to the right of the lens direction, radius
  1.05 and more) is in sunlight; only the dust nearer the globe than 1.05 radii at 10 degrees and 1.1 at 20
  degrees is shaded. dustAir is taken at the point of the globe's surface behind the dust (dark on the night
  side), not where the dust is, so the foot dust over the night side is drawn darker than its true light.
  The pale band of d8723c6 was the truer picture; it read red on the rise because it came and went within 8
  frames over a night side that the calm had left without a pattern of its own.
- What it means at 3720, column x 1700 (display values, 13 by 5 px means): the approved has the night side
  (10) to row 672, then dim grey ring matter rising 30, 60, 80, 82, 106, 126 over rows 684 to 756, then the
  bright rings (190) from row 768. da02133 has the night side (8 to 10) to row 708, a black band (1 to 2) over
  rows 720 to 792, the sheet's dust 26, 72, 90, 98 over rows 804 to 840, the bright rings from 852. The named
  tree: night side 20 to 24, the same black band (2 to 5), dust 71, 104, 115, 78, bright rings from 852. So
  the black band (open 22) is in both trees: it is the foot dust (inner.foot, heights 0.05 to 0.09 over the
  plane) drawn unlit over the night side. Lit by its true place it would be the dim grey matter of the
  approved. And the whole foot lies about 85 to 100 px lower on the right than in the approved (the contact
  line of globe and plane by the lens height 0.362; the approved's perspective is not that of one lens).
- Decision: da02133 is named as it stands when its proof is through (mail 905: do not hold the cured severe
  item 5 back), with this said plainly in the mail. The foot dust lit by its true place, in a way that stays
  green on the rise, is the next work on item 1, together with item 4.
- Idea for that (not yet tried): the red comes where the band falls from stronger than the night clouds to
  nothing within one pair of frames. If the share of the foot dust falls along the rise by a constant factor
  per frame (a straight line in the logarithm against the frames of the rise, about 4.6 per 8 frames), the
  pattern at every pixel turns by at most about 40 degrees per pair whatever the strength of the clouds
  there, and the share that is left at 0.93 radii is under half a display level. The shares would be far
  smaller than now between 0.5 and 0.93 radii and the same at 3720.
- SECOND CORRECTION (07:32, read in git show 88ba2385:src/stops/saturn/globe.ts line 272): the entry of 06:20
  to 06:45 says the foot dust was lit over the night side in the tree the round took. It was not. There the
  ink of the foot dust was multiplied by smoothstep(uDusk.x, uDusk.y, ndl), the daylight of the globe's
  surface behind it, so it was dark over the night side, as it is again in da02133 (now by dustAir at the
  surface point). The lit pale band existed only in 06d73b4 and d8723c6 (inner.air.depth 0). So at the foot
  da02133 behaves as the named tree did: the black band over the night foot at 3720 is in both, no worse
  and no better. What differs at the night foot: the sheet's dust inside the rim near the globe is a little
  dimmer (the soft twilight of the globe's air, dustAir at the dust's own place, which is the true place
  there) and has no sand.
- The foot dust by its true place, design for after the name (B1): (1) globe.ts and kept/globe.ts: the light
  of the foot dust is dustAir taken on the view ray in front of the surface, at heights between the surface
  point and the top of the dust (skim.json inner.foot.height[1]), a few taps, their share in skim.json; the
  opacity stays as it is. (2) skim.json inner.by: from the height 0.403 (frame 3803 of the rise) up, the share
  falls by a constant factor per frame of the rise (0.303 at 0.403 to 0.0006 at 0.928, a factor 4.7 per 8
  frames), knots at the heights of the rise's frames, then 0 at 0.93. Predicted turn of the pattern per pair
  41 degrees at most (1 less cosine 0.24) wherever the band crosses the level of the night clouds. The cost:
  between 3603 and about 3660 of the dive the gap inside the rim holds almost no dust (share 0.01 to 0.03
  where the named table has 0.06 to 0.19); 3720 keeps 0.652.

## 25 Nov, 07:37 UTC: MAIL 959 and 960. Round 51 closed, round 3 of 3 is the last, NAMED no later than 12:00 UTC

- Round 51 (Saturn, 2 of 3, judged on main 579400e with my 88ba2385): R1 7 with 4 major; R3 4 (1 severe and 3
  major in part 1, 1 severe and 4 major in part 2); R4 8 with 1 minor; R2 fail, 0 of 10 against 4 of 10 on
  the approved images; R8 pass. The whole card with the critics' words is on main 9033f8ff under
  scorecards/round-051/ (SUMMARY.md, issues 1 to 27, read it there after a compaction). The pictures of the
  pack are in /home/user/.perplexity/attachments/4d6275a837d34520ad7092bf72521263/ (image-05, 06, 07, 09 to
  15) and /home/user/.perplexity/attachments/09dd74d54ada415a8961949a174b7fa9/ (image-16, 01 to 04, 08,
  pair-03-a, pair-03-b, pair-04-a, pair-04-b).
- The two severe issues, word for word. Issue 1, R3, frame 3567, ring plane right of and below the globe
  (crops E, G, I, Q): "the gap between globe and inner ring is filled with a separate patch of bright
  starfield with red nebula knots that does not match the sky around it; it reads as a cut-out with a
  different background pasted in". Fix named by the critic: "fill the inner ring gap with the same sky layer
  as the rest of the frame, or with dark unlit ring material, so no patch edge shows". Issue 2, R3, frame
  3720, base of globe meeting inner rings (image-10 crop A, image-11 crops Q and R): "the bottom of Saturn's
  globe curls inward with a shaded bevel like a solid puck resting on a glossy tabletop, casting a vertical
  mirror reflection onto the inner ring that terminates in a hard vertical patch seam against a bright
  ringlet". Fix named by the critic: "occlude the oblate globe cleanly behind the ring plane without a
  beveled lip, remove the specular tabletop reflection from the C-ring, and keep concentric ringlets
  continuous across the inner ring".
- The Builder's reading (his words): "(1) the inner ring and its crossing of the globe, the cause of both
  severe issues and of R1's strip ... The ring model gets its dim inner sheet with a true optical depth (it
  dims what is behind it and has no mirror term), the globe is hidden by the rings by that depth alone, and
  the shadow of the rings on the globe and of the globe on the rings come from the one light. (2) The globe's
  light: the boundary of day and night reads as a straight soft band laid over a disc at 3465 and 3567 and
  eats too far into the lit face at 3720. The light term follows the oblate body, its falloff is tightened
  against the approved image and the night side keeps a trace of tone; the dark limb at 3567 is the body's
  own ellipse, with no lumps where it meets the shadowed ring; the crest and the cool cap at 3720 are matched
  again. (3) The near ring field at 3720: the outer ring is coarse, mottled and bark like against the fine
  crisp ringlets, the faint strands inside the main division and the pink and cool grey separation of the
  approved image, and the main division is wider at the left bend and leaves the frame farther right. (4)
  The lower lit globe at 3720 breaks into flat blocky dabs with no zonal bands: band detail from code at that
  scale. (5) At 3866 stars lie on top of opaque rings and clip unevenly along the dark limb, the lower ring
  arc is soft, a broken line runs 12 px outside the ring edge and the moon's limb is stepped. (6) R2 failed
  ... the grooved record look of the ring plane, the seam where the globe meets it and bands that read as
  generated swirls, which are (1), (3) and (4). (7) R4 gave 8 with one minor issue, sharp edges at four
  pixels a frame in the rise from 3847 to 3858: the shutter's blur along that pull back." "This is my
  reading, not a recipe: find what draws each fault by layer before you cure it, and say in your mail what
  you found." From the engine, not mine: the Milky Way's blobs (issues 10, 22), the ghost shapes at 3866.
  The bluish streaks at the right edge of 3465 stay tied to the approved picture.
- WHAT HE ASKS, word for word: "(1) Within 90 minutes a state mail with pictures at 1 to 1, before and
  after, of the two severe places: 3567 low right of the globe (the space between globe and inner ring) and
  3720 at the foot of the globe (crops Q and R of image-11), with the layer that draws each named. (2) The
  NAMED mail with the full sha when the two severe issues and the majors 3 to 13 are cured by your own
  pictures at 1 to 1 beside the approved image, and no later than 12:00 UTC. What is not cured by then goes
  into the round as it stands, named by you in the mail, worst first. (3) Nothing of this is bought with the
  hold: 3465 is the frame R1 calls closest to its target. Say which judged frames move and show each beside
  the approved image. (4) Your own smooth lines of dive and rise on the commit (your status of 06:38 named a
  red 0.89 at 3827 from the foot dust lit in front of the night side). A red line is a severe issue of round
  3. (5) The frame law stands: nothing comes or goes by the clock in dive or rise; the full set and the web
  set show the same picture."
- So: state mail due by 09:05 UTC, NAMED by 12:00 UTC at the latest. A full proof and the name take about
  1 h 45 min, so the tree must stand by about 10:10 UTC.

## 07:37 to 08:25 UTC, Nov 25: round 3, the two severe places found by layer and cured in trial

- Tools of this hour: `/tmp/v/x/tr.sh NAME FRAME...` (draft stills of the working tree), `/tmp/v/x/footcmp.py`,
  `/tmp/v/x/by_table.py F END` (the table of inner.by: a constant factor F per frame of the rise).
- SEVERE 1 (3567 low right, also 3866): WHAT DRAWS IT. The engine's sky (the bright part of the Milky Way with
  its red knots) seen through the empty space between the globe (radius 1.0 in the plane) and the inner rim
  (1.2458) inside the globe's shadow. Its outer bound is the shaded sheet of the kept set, which is solid
  black from the rim on (kept/rings.ts, `uSolid`); its inner bound is the night limb. In the hold the sky is
  the dim plate and `uSolid` is 0, so the hero and 3465 do not show it. The lump of issue 8 is the same
  place: the southern night side showing through that space down to the rim's curve, in front of the bright
  sky.
- CURE (trial T8): the shaded plane lets no sky through from the globe on (sheet.json shadow.solid, now by
  the true radius, [0.992, 1.0]); where the view ray ends on the globe the true depth counts, so the night
  side is the body's own whole ellipse behind the empty space and behind thin ice. First try (T3, T4) made
  the plane solid for the globe too: a black blade cut the globe at its equator and a black wedge started
  at the terminator. Not kept. A ray counts as passing the globe from where the globe's own soft edge
  begins (edgePx 2.6 pixels inside its outline): with the edge at the outline a line of star pixels one
  pixel wide stood on the night limb.
- Stars on the thin lit rings (issue 13): the kept set let the sky through thin ice. Cure: once the lens
  has left the hold the depth counts starCover times where the view ray passes the globe (`cover`, by
  `uSolid`); the colour is premultiplied, so the ring gets no brighter, only the sky behind it goes.
- SEVERE 2 (3720 foot): WHAT DRAWS IT. (a) The bevel, the brown strip that steps and the black strip: the
  foot dust painted on the globe (globe.ts `uDust`, skim.json inner.foot, depth 3.2 between the heights 0.05
  and 0.09 on both sides of the plane), lit over the day side, unlit over the night side. (b) The mirror
  image and its vertical seam: NOT the globe seen through the sheet (I thought so first; trials T4 and T5
  with the globe hidden changed the place by 5 levels at most). It is the far look of the model, which at
  3720 draws every part of the sheet farther than 1.3 radii from the lens: it carries the hold's look of the
  ice in front of the globe (keptSheet `over`: the strands over the globe toned by uKStrand; `sheet` and
  `wedge`: the thin sheet at the inner rim and its glow where the day side lies behind). Both end at the
  outline of the globe behind the sheet, which at 3720 is a vertical line at x 932 below the left foot.
- CURE (trial T7): no layer on the globe (inner.foot.depth 0); the dust deep enough to hide the globe by its
  depth alone (inner.depth [3, 3]) with its ringlets on (rings.amount 1); and one law by the angle of the
  view on the plane (sheet.json graze [0.3, 0.4], the sine of the angle between ray and plane): under 0.3
  the sheet hides the globe as it hides the stars and nothing of the globe behind is added to the ice in
  front of it (`steep` on `over`, `sheet`, `wedge`, `shine`; `past` on the cover and the shade), over 0.4
  all of it holds. In the kept set (once the lens has left the hold, by `uSolid`), in the far look and in
  the model's own look alike. From the heights of the hold, dive and rise down to about 1.2 radii the view
  is steeper than 0.4 wherever the globe lies behind the rings, so 3465, 3567 and 3866 do not move by it.
- Also in the tree: fill (skim.json inner.fill 0.08, `uFill`): the share of its own light the ice in the
  globe's shadow keeps near the sheet, times the share of by. light [0.3, 0.1], dark [1.0, 1.2458],
  bands.floor 0.75. The table of by: 1.22 per frame of the rise from 0.353 up, 0.0001 at 0.928 (share about
  0.59 at 3720). shadeSolid [1, 0.116] (was 0.995: a few bright stars leaked at half a percent).
- Trials, all draft tier, 1920 by 1080: T3 (solid for all, blade), T6 (true depth for the globe), T7 (3720,
  graze law: seam at x 932 gone), T8 (3567, 3866: night limb clean). Pictures: `/tmp/v/x/state_3567_QR.png`,
  `state_3720_QR.png`, `state_3567_gap.png` (the critics' boxes Q and R, 912,433 to 1824,866, at 1 to 1).
- Not curable by the model at 3720: the approved's contact line lies about 110 px higher at x 1470 (y 622
  against 733): its plane is nearly edge on at the globe while its rings are seen from above.
- Measured against the approved at 3720: my night side is (4,4,3), the approved's (12,13,11): the trace of
  tone of issue 5 is missing.
- 08:22 job r65 started: dive slice 3540 to 3562 (half frames 7080 to 7124), then rise slice 3798 to 3840.
  No edit of a picture number in src before FIRST DONE stands in /tmp/v/r65/job.log (the second job copies
  the tree at its start); the note of skim.json was rewritten in between (no pixel).
- Looks pushed 08:09 (e138f4d0). Next by 08:39.

## 08:25 to 09:10 UTC, Nov 25: terminator, night side, sand; state mail sent 08:51; MAIL 991

- r65 dive start on the tree of 08:22 (draft, rate 2): frames 3540 to 3562 green: pattern 0.17 at 3560 + 1/2,
  pop 1.01, level step 0.01. The rise slice of r65 was killed at 08:33 when the tree moved on: no rise measure
  exists for any tree after da02133 until the proof.
- T9, T10 (drafts 3720): THE TERMINATOR. Measured on rows of 3720 against the approved (the x where the light
  has fallen to given levels): mine lay 30 to 45 px too far from the Sun at rows 140 to 300 and 30 to 40 px
  too far toward it at rows 540 and under: the approved's boundary of day and night stands more upright.
  New: skim.json light.dusk.lean (low 0.05, fall 0.08, lat [0.15, 0.6], the sines of the latitude), grade.ts
  leanAt, uLean in globe.ts and kept/globe.ts: the cosine of the Sun's angle gets low more by the equator
  and falls by fall toward the pole, times the share of the grade of the rings (by the lens's height, 0 at
  2.2 radii and above, so none in the hold; about 0.01 at 3567). After it the half level lies within about
  15 px of the approved at rows 140 to 460.
- THE NIGHT SIDE: dusk.night [1, 0.8] (was 0.45): 7 to 18 of 255 at 3720 against the approved's 10 to 14
  (was 2 to 4). inner.light [0.3, 0.3] (the dust by the globe as bright as at the rim), inner.air
  {depth 0.4, height 0.09} (the dust by the globe goes into the globe's twilight over a longer way).
- THE LOWER GLOBE (issue 12): with the foot dust gone the dabs are gone in the final (t10f, t13f); calm
  amount 0.6 (was 0.4). A trial with the fine streaks from functions at this distance (globeFine.reach
  [2.0, 2.8], T11) read as scratches along the bands: not kept, reach stays [1.3, 1.75].
- G17 by the tool's own script on my final stills (`python3 tools/measure/g17.py FILE
  references/approved/saturn-close.jpg`; the named final gives 0.974, the gate said 0.971): working tree
  1.000 to 1.001, p25 0.663.
- STATE MAIL sent 08:51 (looks 7befc928: state2_3567_gap.png, state2_3567_QR.png, state2_3720_QR.png).
- MAIL 991 (08:52), word for word: "1. The bark at 3720 (issue 11) is the sheet's sand swept by the shutter.
  Before you take sand out: kit/05 says "Fast motion must come out as a smooth blur. If an edge still breaks
  into separate copies at the final tier, add blur along the direction of motion inside each sample." So
  first say what the approved picture has in that near field (grains, streaks or neither, at 1 to 1) and what
  the final tier's sample count makes of the sand (your drafts have one sample). If the approved has grain
  there, the cure is the blur along the motion inside the sample, not less sand; if it has none, less sand is
  the cure. One pair at the final tier decides; send it with the trial. 2. The contact line at the foot, 110
  px higher in the approved at x 1470 than one camera gives with its rings: accepted as a departure that is
  said, not hidden. One camera and one plane stay (Brandon's second note: everything is to look as if it were
  really there; d251). Write it in your notebook with the two numbers and the picture that shows it; R1
  judges the pair as it stands and I put your sentence in the round's summary. 3. 3465 byte identical: needed
  for the NAMED, with the hash, as you say. 4. The rise on the new tree, both moves at rate 2 on the tool's
  own lines, the step in place and the handover tool are part of the NAMED as before. My reader goes on the
  sha at once. NAMED before 12:00 UTC stands."
- DEPARTURE THAT IS SAID (ruling 2 of mail 991): at 3720 the line where the globe meets the ring plane lies
  at y 733 at x 1470 in the film and at y 622 in the approved close image, 110 px higher there. The approved
  image has its ring plane nearly edge on at the globe while its rings are seen from well above; one camera
  over one plane cannot give both, and the film keeps one camera and one plane. Picture: the looks of 08:50
  (7befc928), "STATE 08:50, SEVERE 2: 3720 boxes Q and R at 1 to 1" (/tmp/v/x/state2_3720_QR.png).
- THE BARK (issue 11), found: the approved has grain in that near field: fine, even grain of 1 to 2 px with
  white sparks, no streaks. The final tier draws 3720 with 16 takes; each take drew the sand sharp (filtered
  by its own slide, a sixteenth of the shutter's) and the sum drew every grain out into one unbroken streak
  of 10 to 14 px along the motion, which there runs down the frame, across the ringlets: a hatch. No
  separate copies. Finals: sand as named (t10f), near [0.4, 0.5] (t13f: the same hatch, fainter), the fine
  sand whole and the coarse off (t14f: the same hatch, so it is the fine sand). A draft of one take filters
  the sand by the slide of the whole shutter and is smooth there.
- CURE BY THE RULING (blur along the motion inside the take, not less sand): ice.json sand.shutter 1,
  ice.ts uIceFit.w: every take filters the sand by the slide of the whole shutter, so grain the shutter
  draws out over many of its widths merges into the sheet, and the sand is the same picture at every
  number of takes. The strengths of the sand are as named (near [1, 2.5]). The ringlets keep the take's own
  slide (uIceFit.x). Final t15f renders.
- 09:14 t15f (final, sand by the whole shutter): THE HATCH STAYS, a little calmer. So it is not the sand
  alone: a draft of one take has the same hatch, softer (t15f_zoom2.png, left). It is the grains
  (grains.ts, the ice seen grain by grain, each drawn out along its motion during the take) with the fine
  sand: under the shutter every grain is one unbroken streak of 10 to 14 px down the frame (the flight
  aims at about x 233, y 600 of the frame, so the ice at the lower left flows straight down), across the
  ringlets. A smooth blur along the motion, no separate copies: by kit/05 it is right, and the ruling says
  not less sand where the approved has grain. The trial is NOT KEPT (ice.ts, ice.json and model.ts are as
  named): a change that does not cure does not ship. The bark of issue 11 goes into the round as it
  stands, named, with the pair at the final tier (t15f_O.png, t15f_zoom2.png).
- What would cure it and was not built for want of time: a grain that the shutter draws out over many of
  its own widths hands over to the sheet (as a grain under a few pixels does), in grains.ts with ice.ts
  grainTaken giving its depth back to the sheet.
- 09:16 the tree stands: commit, then the proof r66 (finals first for the hash of 3465, then the whole
  rise and the whole dive at rate 2, path, G13, G17, gate, parity, place, handover).

## 2026-11-25, 09:16 UTC: the tree of round 3 committed (ab362641), the proof r66 runs

- Commit ab362641b9d9a924f577d3ad73df9d28231e3ebd on agent/saturn-code, local, not pushed yet (it is pushed
  with main merged in when the proof stands). The sand trial is not in it (ice.ts, ice.json as named).
- r66 from the committed tree, started 09:16:43: finals 3465, 3567, 3720, 3866, then the whole rise and the
  whole dive at rate 2 on the tool's own lines, path, G13, G17, gate G11 and G15, parity, place, handover.
  Log /tmp/v/r66.log, pictures /tmp/v/r66/. Nothing under src is edited until it ends.
- 09:18:25 final 3465: sha256 4077873a1a2005c40bed0e9f225e2ebbe3cf153ee06f75b93a2c3a4735002f0f, byte for
  byte the named frame of round 2 (88ba2385) and of da02133. The hold does not move.
- Looks pushed 09:17 (head 7a744474): the sand pair at the final tier with the zoom, the lower globe, the
  crops of 3866. Next push due by 09:47.
- The pictures of the NAMED mail come from /tmp/v/x/mail_pics.py /tmp/v/r66 (rows: approved, named 88ba2385,
  this commit; boxes by the critic's tiles: 3567 Q R and K L; 3720 Q R, O P, T U, the cap, V W; 3866 D, I,
  T U V, A), into /tmp/v/x/mail/.
- AFTER A COMPACTION: wait for "ALL DONE" in /tmp/v/r66.log; look at every sheet; then merge origin/main with
  merge-tree (see the entry of the last NAMED), tsc, vitest alone, push, NAMED mail before 12:00 UTC.

## 09:28 UTC, Nov 25: MAIL 1009 (a line for set.ts, NOT NOW), finals of r66

- MAIL 1009, word for word: "One line for your set from the engine's shutter owner (handover_engineer,
  commit 1c85affe on take/b10e, named 09:25, not on a take yet). Nothing to do now: it can only stand on a
  tree that has that commit. Put it in your first commit after I tell you the engine take carries it.
  src/stops/saturn/set.ts line 64 (line numbers of b1721d2c):
    const order = ((view.sample * stride) % count + 0.5) / count
  becomes
    const order = view.weights ? sampleOrder(view.weights, view.sample, stride) : ((view.sample * stride) % count + 0.5) / count
  with: import { sampleOrder } from '../../core/sampler'
  Why, in its words: without shutter ends view.weights is absent and the line is today's. Under ends the
  samples carry unequal weights, and a set that spreads something over the samples has to spread it by
  summed weight. Proof I ask with it: the hash of 3465, 3589 and 3720 at draft equal before and after the
  line. Also for your record: the whole smooth report of round 51's build (690afebe: path, place, parity,
  the pictures of both moves, counts) was joined at 09:23 and is green. It is in
  scorecards/round-051/smooth-saturn.md on main. Your NAMED by 12:00 stands."
- So: the line is NOT in the commit to be named. It waits for the Builder's word that the engine take
  carries src/core/sampler.
- r66 finals: 3465 4077873a... (identical to the named); 3567
  92cd367987bfff8077565d504ea0dd51bcc4f412a2dc199769ea7bd917c16306 (09:24:19); 3720
  63564b1628b4a60bb40716a97be02725893b6f783bf887495ef9c2db282445cd (09:28:55), G17 by the tool's script
  median 1.000, p25 0.664 over 62 tiles.
- 3567 final looked at at 1 to 1 (mail/n3567_QR_gap.png): the sky patch is gone, the night limb is the
  body's own ellipse against the unlit plane. Left of the globe the stars no longer shine through the thin
  inner ring; they stand in the empty space inside the rim alone, as in the hero. Against the named: 59942
  pixels over 4 of 255, in the boxes x 480 to 790, y 263 to 776 (stars behind the thin ring) and x 1200 to
  1700, y 430 to 1063 (the space in the shadow). SEEN AND NAMED: one dim star in the soft edge of the night
  limb at x 1439, y 677 to 683 (38 to 41 of 255 on 25).
- 3866 final: sha256 2a21654461435dc511223d3e1798cf35feb3b34187cdf1cecd9e30df839f0cfe (09:33:06).
- FINALS OF ab362641 LOOKED AT at 1 to 1 beside the approved and the named (pictures in /tmp/v/x/mail/, in
  the looks of 09:36, head 13b48156, 16 pictures; the tool pushes 8 unless --max is given):
  - 3720 Q R (the foot): lip, brown strip, black strip, mirror image and the seam at x 932 are gone; the globe
    meets the plane in one clean curve over dark ringlets of dust. The approved's contact lies higher (said)
    and is a soft grey band of strands; mine is a harder edge.
  - 3720 O P: the main division is wider (about 130 px against about 60) and empty; the approved has faint
    strands in it and a strand filled grey margin. NOT CURED (issue 3). Outer ring greyer than the approved.
  - 3720 T U and the corner at 2 to 1: the bark of the named (a strong hatch down the frame) is down to a
    faint hatch. Laplacian RMS of the box 0,880 to 300,1080: named 49.0, da02133 41.0, this commit 41.0,
    approved 50.8 (its grain with sparks); mean level 100.8, 115.5, 115.5, approved 112.2. The calmer field
    came with f7991ad (finer grains: grains.json level 1 cell 0.0012, size 0.0005 to 0.0013, pixels
    [1.1, 2.2], spread 0.15; ringfine.json the octaves from 0.032 radii on, near.wide.first), not with the
    sand. So issue 11: less, not gone.
  - 3720 cap: terminator half level at rows 140, 200, 260, 320, 380, 440, 500, 560: approved x 1606, 1590,
    1553, 1545, 1502, 1506, 1497, 1474; named 1656, 1621, 1593, 1557, 1531, 1489, 1468, 1428; this commit
    1609, 1586, 1563, 1535, 1526, 1508, 1509, 1474 (within 24 px, named up to 50). Night side box x 1780 to
    1900, y 300 to 500: approved 11, named 12, this commit 8 of 255. Cap, box x 1380 to 1560, y 105 to
    150: approved (185,178,161) blue minus red -24, named (213,190,154) -59, this commit (180,168,140) -41:
    half way. Crest: y 88 at x 1520 against the approved's y 76 at x 1610 (limb at x 1600: y 90 against
    77): the approved's globe is larger to the right; one camera, not moved.
  - 3720 V W: smooth warm stripes with some pink; the approved has grain, pink and cool grey. NOT CURED
    (issue 6).
  - 3866 D and I: no star on the rings, the sky patch is gone. SEEN AND NAMED: a dim red streak of the
    sky's knot in the soft edge of the night limb, x 1085 to 1100, y 790 to 820, up to 88 of 255 on about 30
    (most pixels 15 to 25 over). Cause read in kept/rings.ts line 555: the solid shade counts from the true
    radius 0.992 on (uShadeRamp); a ray that ends in the globe's soft edge near the equator crosses the
    plane inside that radius, so the sky shows through the 2 to 3 pixels of that edge. The cure would be
    to let the solid shade count in the whole soft edge whatever the radius. Not built: no trial can run
    beside the proof.
  - 3866 T U V: the lower arc is as soft as in the named (the shutter along the pull back; a draft of one
    take is sharp there). NOT CURED.

## 09:41 UTC, Nov 25: MAIL 1016, the rings' fine lines at 3870 to 3876 (pop score at the end of the rise)

- MAIL 1016, word for word: "For your record, the last quarter of Saturn's way up on three engines, pop
  score at rate 2, draft, limit 1.2: main's engine 1.196 at 3872 + 1/2; take/b10e 1.19 at 3873 + 1/2 (green);
  take/b10f 1.21 at 3874 (red by 0.01). The panel is attached: what is left without the motion is the stars
  over the bright band (the sky's owner has that, MAIL 1012) and the fine lines of your rings, which change
  from one frame to the next as they move over the grid. The second is yours: in your NAMED by 12:00 say what
  the rings' lines do at 3870 to 3876 (their width in pixels there, how they are drawn under a pixel) and
  cure it by cause if they are thinner than the grid can hold. No softening of the rings elsewhere to pass
  the number."
- The panel: /home/user/.perplexity/attachments/156da66db1ec46f2970e059c1bdb9466/saturn-rise-end-pops-b10f.jpg
- Disk: old proofs deleted from /tmp/v (r44, r45, r48, r54, r58c, s1, s2, t17, t18), 5.4 GB free at 09:42.

## 10:00 UTC, Nov 25: MAIL 1023 (the engine's motion measure at my borders) and what the rings' lines do

- MAIL 1023, word for word: "A question from the handover engineer's work that only you can answer. It
  changes nothing in your timetable (NAMED by 12:00). The engine measures how far the picture moves across
  the shutter on each side of a border, and from that it takes the number of samples and the blur. For the
  surface views it measures on a plane (y = -terrain.ground in the set); for the globe side on the ball. At
  your borders, computed from the plans on the engine commit 1c85affe: dive border 3589: globe side 2.94 px,
  surface side 8.80 px (your plane is the ring plane, ground 0); rise border 3852: globe side 17.80 px,
  surface side 17.37 px. My reader measures 4.6 px a capture frame over the whole picture from 3585 to 3593,
  flat across the border, and 11.1 px at 3852 (round 51's report). For seven stops the engineer cures the
  difference by measuring the surface view on the globe as the plan's twin has it. Saturn stays out of that,
  since your surface view is the ring plane and the ball is the wrong shape for it. So, at 3589: what fills
  the frame and moves there, the rings (then 8.80 is true and the globe side under-reads, and the dive takes
  too few samples before the border) or the ball (then 2.94 is true)? Answer from your set, by what is drawn
  in the frame at 3585 to 3593 and how far its sharpest lines move across the shutter (the rings' fine lines
  are the thing you are curing at 3870 to 3876 anyway). One paragraph with the numbers, with your next
  state. I pass it to the engineer."
- Counted from the plan alone (out/scratch/border.ts FROM TO STEP [inner outer]: a grid of 96 by 54 pixels,
  the ray of each at the frame's time, what it meets first, where that same point of the ring plane or of the
  globe turned by its spin stands on screen one film frame later):
  - 3585 to 3593 (lens height 1.479 to 1.218, 4.33 to 4.10 radii from the centre): rings (radius 1.239 to
    2.27) 33.3 to 31.3 percent of the frame, ball 19.0 to 18.1, sky 47.7 to 50.5. Rings, px a film frame:
    median 3.85 to 4.08, 90th percentile 6.30 to 6.80, most 8.56 to 9.29 (8.70 at 3589, 8.80 at 3590);
    across their lines (along the radius on screen): median 2.89 to 3.12, 90th percentile 4.61 to 5.24, most
    7.19 to 7.59. Ball with its spin: median 3.53 to 3.84, 90th percentile 4.19 to 4.38, most 4.30 to 4.55.
    The whole ring plane in frame (no edges): median 5.2, most 16.9 at 3589.
  - 3852 (height 1.681): rings 28.0 percent, ball 26.0, sky 46.0. Rings median 15.20, 90th percentile 27.29,
    most 33.56; across the lines 14.02, 26.81, 33.19. Ball median 17.41, 90th percentile 21.27, most 23.03.
- The dive's border is frame 3589 + 1/2 (skim.json handover.dive.at 0.55 of 3540 to 3629), the rise's 3852
  (0.56 of 3810 to 3884).
- MAIL 1016, found by code and on the proof's own draft frames of the rise (r66, this commit):
  - Which set draws: from the end of the dive on every take is the model's (set.ts line 61, share 1 after
    dive.end); the kept set's pose weight plays no part on the rise (my 09:46 guess was wrong: model.ts
    line 149 sets poseW 0).
  - At heights over 0.93 the model's rings are the far look (sheet.ts keptSheet): the kept profile read from
    its ladder of levels at the level whose texel is 1.2 times the pixel's footprint in radius times the
    scale of the take (1 at one take, 1 over the root of the takes at more), linear between texels and
    between levels. So no line is drawn narrower than about 1.2 px at one take; what is narrower is tone.
    The clumps (value noise, 640 cells a turn, 70 a radius, strength 0.05) are not filtered: a cell is 5.7 px
    wide across the radius at the ansa and 1.3 px on the far side.
  - Scale at 3870 (out/scratch/ringpx.ts): a radius of the globe is 392 to 406 px at the left ansa, 277 to
    431 px on the near side, 88 to 112 px on the far side; at 3876: 364 to 377, 244 to 362, 85 to 106.
    The ansa at radius 1.95 moves from x 1 to x 33 in six frames: 5.3 px a frame.
  - The move of the take: ice.move is multiplied by close (0 over height 0.93) and the far look does not
    count it in any case: one take is an instant, the lines are not blurred along the motion in the sample.
  - Measured (/tmp/v/x/ringline.py with out/scratch/ringline.ts: the brightness along one radial line of the
    ring plane at the left ansa, 1400 points from radius 1.25 to 2.3, read from every half frame at the
    places the plan gives, so a line of the rings stands at the same point in every frame): fine contrast
    of the lines 11.4 to 12.7 of 255 rms; change from one half frame to the next 1.33 to 3.54 rms, in a beat:
    3.54 at 3860, 1.33 at 3865, 3.24 at 3868, 1.77 at 3872, 3.09 at 3877, 1.83 at 3881 + 1/2. Near side:
    2.2 to 2.75 all the way. The beat is the place of the lines on the grid: least where the picture has
    moved a whole number of pixels between two frames, most at half a pixel.
  - After 3885 the plan's flight no longer gives the lens (same measure: correlation 0.99 up to 3885, 0.2
    after): the travel moves the lens and my set does not know how far it moves in a take there.

10:02 to 10:12 UTC. THE WHOLE RISE OF r66 (ab36264, main's engine 64c4ccb) IS RED ON TWO LINES.
  - Red 1: "the pattern of the picture changes in place by 0.98 from frame 3830 to 8 film frames later, band
    8 px, limit 0.45 (35 frames over it, first 3809 + 1/2)". By frame: 3809.5 0.53; 3810 0.62; 3811 0.72;
    3812 0.83; 3813 0.90; 3814 0.95; 3814.5 0.97 (most at pixel 912, 672); 3815 0.94; 3816 0.81; 3817 0.44;
    3818 to 3821 0.45 to 0.53; 3822 to 3829.5 0.26 to 0.41; 3830 0.98 (most at pixel 1528, 960); 3831 0.81;
    3832 0.62; 3833 0.52; from 3849.5 on 0.07 to 0.23. r64 on da02133 had this slice green (0.37 at
    3832 + 1/2): what ab36264 added causes it.
  - Red 2: "pop score 1.21 from frame 3872 + 1/2 to the next, limit 1.2" (1.05 at 3870 up to 1.21 at 3872.5,
    1.07 at 3876). The frame's mean level, which falls steadily otherwise, rises from 74.33 (3870) to 75.44
    (3875 + 1/2) and is back at 74.36 by 3878: a brightening that is not motion, not located yet.
  - What the frames show (strip /tmp/v/x/rise_gap_strip.png, crop x 700 to 1100, y 480 to 780, frames 3806 to
    3824 in steps of 2; lens height 0.416 at 3806, 0.434 at 3810, 0.460 at 3814, 0.505 at 3818, 0.568 at
    3822, 0.608 at 3824, 0.760 at 3830): the plane in front of the lower globe is a solid dark band up to
    3810, a brown band with stripes at 3812 to 3816, tan at 3818, pale at 3820, clear at 3822; the gap
    between globe and inner rim beside it is dark up to 3816, stars show faintly at 3818 and it is clear sky
    at 3822. So a cover over the globe and the gap goes out within 8 to 10 frames of the rise.
  - The two things in the tree that can do that: sheet.json graze [0.3, 0.4] (the sheet hides the globe like
    the stars where the sine of the view to the plane is under 0.3, true depth over 0.4: by the angle, but
    the angle at a place of the picture changes with the lens's height, fast in the rise) and skim.json
    inner.by with inner.depth [3, 3] (the dust inside the rim, by the lens's height, falling by 1.22 a frame
    of the rise: my own model of the pattern measure gave 0.25 for that, the tool gives up to 0.97).
  - r66 killed at 10:09 (the dive of a tree that has to change). Trials one thing at a time at draft:
    v1 = graze off.

10:09 to 10:30 UTC. THE CAUSE OF THE RED PATTERN LINE OF THE RISE, BY LAYER, AND THE CURE ON TRIAL.
  - Counted from the plan (out/scratch/mu.ts FRAME...: the sine of the view to the plane for plane points
    drawn in front of the globe, by band of radius): hold 3390 to 3539 at least 0.416 (gap band 1 to 1.2458),
    0.467 (thin inner ring 1.2458 to 1.53); 3720 0.149 to 0.243 (gap), 0.210 to 0.298 (inner ring); rise,
    medians gap / inner ring: 3806 0.261 / 0.318, 3814 0.275 / 0.331, 3822 0.310 / 0.366, 3830 0.362 / 0.419,
    3836 0.411 / 0.465, 3844 0.474 / 0.523. So a cover by the angle that is whole at 3720 and gone in the
    hold has only the sines 0.3 to 0.41 to go out in, and the rise crosses them in 15 to 30 frames; it went
    by the depth (60 times the depth under 0.3, once over 0.4), and an opacity that is 1 - exp of that
    changes nearly all within a third of the window: 4 to 8 frames. That is the brown band over the globe
    at 3812 to 3820 and the dark soft edge in front of the night side at 3830 to 3838 (the shaded plane in
    front of the globe, solid by the same law).
  - Trial v1 (graze off by its numbers) at 3814, 3818, 3822 (/tmp/v/x/v1_cmp.png): the brown band is gone,
    the globe looks alike in the three frames; the gap still goes from dark to stars: that part is the dust
    inside the rim (inner.by, 1.22 a frame, seen 60 times its depth against the sky).
  - The cure (v2, the tree of proof r67): what hides the globe and the stars with the lens low goes by the
    height of the lens alone and in the opacity itself. skim.json inner.cover: share 1 at 0.364 and under
    (3720 is at 0.362), 0 at 0.928, knots at the lens's heights at the frames of the rise (3792 to 3835),
    the same step at each: 1 part in 43 a frame, so at most 0.19 of it in 8 frames. sheet.ts: uOpen =
    1 - share; far look: a = mix(a with the sheet counting as against the sky, a as it is, uOpen); shade in
    front of the globe by max(edge, 1 - uOpen); what the globe adds to the ice in front of it times uOpen;
    near look: alpha = mix(1 - exp(-60 depth), alpha by the true depth, uOpen), and the dust inside the rim
    counts by its true depth against the sky too (it is no ice of the sheet), so the gap follows the same
    share. inner.by: as it was down to 0.48, then a floor of 0.004 up to 0.823, gone at 0.93: at 0.004 the
    dust is too deep for a star at 60 times and too thin to see by itself, so one law shows, not two.
    sheet.json graze [-2, -1]: the angle law of the kept set is off by its numbers (the kept set draws only
    above 0.93, where the cover is none); kept/rings.ts is not touched, so the hold's shader is the same
    text. The model alone draws under 0.93 (handover.kept.heights 0.93 to 1.03), so both sets show the same
    picture where they are mixed.
  - Trial stills at draft (v2_strip.png: 3798 to 3836 against ab36264): the band over the globe goes from
    brown at 3798 to pale at 3814 to clear at 3830 with no step; the gap from dust to stars over the same
    frames. 3720 at draft beside the final of ab36264 (v2_3720_foot.png): the foot is closed as before.
  - What it changes elsewhere, expected: 3465, 3567 and 3866 not at all (their sines are over 0.4 and the
    cover is none at their heights): the proof's hashes will say. 3720: only ice in front of the globe at
    sines over 0.3 (the dense ring, deep anyway). The first part of the skim (3628 to 3719, lens 0.544 to
    0.364): the gap is closed by the share only (0.33 at 3628, 0.47 at 3660, 1 at 3719), so stars show
    through the dust there where ab36264 had it closed from 3625 on. This is a law by the lens's height:
    under mail 729 and 905 (ring matter in the ring plane), against the letter of 785; said in the NAMED.
  - Proof r67 started 10:28:51 on this working tree, order: rise, dive, finals (3465 3567 3720 3866), g17,
    place, handover, g13, gate, parity, path. main moved to dde6df5 since 64c4ccb in kit/PROGRESS.md only,
    so the proof worktree's engine is main's.

### 10:30 to 10:56 UTC: v2 read red before its proof ended, the cause, v3 (odds in equal steps)

  - Early reading of r67 (5df42e1, v2) while it rendered: the tool's own python (tools/img/smooth.py, the
    pictures measure) on the draft frames as they came, whole frame, no body mask, so not the tool's line.
    Pattern 0.44 at 3799 + 1/2 and 0.46 to 0.54 at 3807 to 3812 (0.54 at 3810 + 1/2, most at pixel 1036 to
    1048, 716 to 724: in the cover band over the lower globe; limit 0.45). r67 killed at 10:51:19, not
    finished; v2 is pushed as 5df42e1 for the record and is not named.
  - What the frames show (v2 frames 3792 to 3804, crop x 560 to 1180, y 470 to 830): the dark dust band
    over the lower globe lightens right of the globe's outline behind the sheet (x about 905) as the lit
    globe shows through. No step to the eye, but the pattern of the detail turns over fast.
  - Cause, by model: the tool's pattern number is 1 minus the cosine of the angle between the detail of two
    frames. A mix of two unrelated patterns with contrast ratio r, the incoming one at share T, stands at
    the angle atan(r T / (1 - T)). Equal steps of T run through most of that angle in the first frames when
    the incoming picture (the lit globe's bands) has much more contrast than the dust. An even pace for any
    ratio needs log(T / (1 - T)) in equal steps: the odds, not the share.
  - v3 (skim.json only, no shader text changed): inner.cover.share at the 44 knots (the lens's heights at
    rise frames 3792 to 3835): 1 at 0.364, then 1 - 1 / (1 + exp(-L)), L from -4.4 to 3.6 in equal steps
    (0.186 a frame): 0.985 at 0.367, 0.927 at 0.399, 0.806 at 0.425, 0.576 at 0.460, 0.438 at 0.492, 0.235
    at 0.568, 0.065 at 0.760, 0.032 at 0.892, 0 at 0.928. inner.by.depth: as it was from 0.350 to 0.364,
    then halving a knot down to 0.032, 0.02 from 0.380 to 0.445, then equal steps to 0 at 0.928. By the
    model the worst pattern of a pure crossing is about 0.23.
  - Known side effects: the fill (inner.fill times by) and the dust's own light fall within 4 to 5 frames
    after 3792; a veil of about a fifth of the dust stays in the gap between 0.38 and 0.93 and thins with
    height; 3720 (lens 0.362) has share 1 and the same by as v2, so it is v2's 3720 by design.
  - Trial stills at draft, v3 against v2 at 3796, 3804, 3812, 3820, 3828 (/tmp/v/x/v3_strip.png, crop x 600
    to 1160, y 480 to 800): the band over the globe is lighter at 3796 than v2's, alike at 3804, paler at
    3812; the gap shows stars through a veil at 3820 and 3828. No step seen in these five.
  - Proof r68 started 10:55:22 on this working tree (order: final 3465, rise, final 3720, dive, finals 3567
    and 3866, g17, place, handover, g13, gate, parity, path). The NAMED is due by 12:00; what has not ended
    by then is said as running in the mail.
  - Mail from harness_builder (by the Builder's MAIL 1031 item 3b) asked for the sha, command and frames of
    the run that read 0.98 at 3830. Answered 10:52: ab362641b9d9a924f577d3ad73df9d28231e3ebd on
    agent/saturn-code, the rise at rate 2 at draft, slice frames 7596 to 7680.
  - Branch pushed at 10:52 (7755294..5df42e1).

### 10:57 UTC: MAIL 1045 from the Builder, verbatim

"MAIL 1045 from the Builder (/root), 10:57 UTC. To saturn_coder. Your state of 10:11 is read. Your answer to
MAIL 1023 went to handover_engineer; Saturn stays out of its list until a measure is taken on what is drawn
over both bodies.
On ab36264: the two severe faults cured in your pictures is accepted as stated, to be seen by me in the
NAMED's pairs. The rise is red by your own lines. (1) The pop of 1.21 at 3872 + 1/2 sits in the stars: by
sky_builder's control the reader itself swings between 0.16 and 1.31 on one picture slid against itself, so
no star and no ring is to be changed for it. Do not chase it. (2) The pattern of 0.98 at 3830, from the
foot's cover going out at 3812 to 3822, is yours: by d253 the cover goes by the eye's height, never by the
clock, and what it uncovers is there under it before it goes. Cure it by that law before 12:00 if it can be
done by cause; if not, name the best committed tree and list it.
NAMED at 12:00 UTC stands; it goes into Saturn's round 3 of 3, your last."

  - Where this stands at 10:58: the cover of v3 (d567cfd) goes by the lens's height alone; the true globe,
    the true sky and the true ice are drawn under it at every height, the cover only weighs how much of
    them shows. Main f0b54bd merged as 74dfa6b (tree: main's outside the three folders, the branch's
    inside; tsc clean), pushed. Proof r68: final 3465 sha256
    4077873a1a2005c40bed0e9f225e2ebbe3cf153ee06f75b93a2c3a4735002f0f, byte identical to the named
    88ba2385. The proof's engine is main at 64c4ccb; main f0b54bd differs from it outside the stops in the
    far sun (farsun.ts, look.json, shader.ts, share.ts), src/core/warm.json, three tests, kit and
    scorecards. State mail to the Builder at 10:58.

### 11:00 to 11:18 UTC: v3 reads red too by the early reading; the pace is not the cause

  - Early reading of r68's rise (v3, the tool's python on the draft frames, whole frame, no body mask, pairs
    8 frames apart carried along the flow of every half frame between; not the tool's line): 0.09 to 0.13 at
    3790 to 3798, then 0.20 at 3799 + 1/2, 0.41 at 3803, 0.48 at 3804, 0.61 at 3806 + 1/2 (pixel 916, 740),
    0.66 at 3808 to 3809, 0.80 at 3812, 0.86 at 3813 and at 3817 (pixel 1056, 808), 0.70 at 3818, 0.46 at
    3819, 0.29 at 3820, 0.16 to 0.28 from 3820 + 1/2 to 3825. Red from 3804 to 3819: worse than v2 as far
    as v2 was read (0.54 at 3811; v2 was stopped at about 3820, so its frames after 3812 were never read).
  - So the model of 10:50 (an even pace of the odds keeps a pure crossing under about 0.23) does not hold
    here. What the frames show (strip3 crops of 3802, 3806 + 1/2, 3810, 3814 + 1/2 at twice size, x 780 to
    1100, y 660 to 800): in the band in front of the lit globe two fine patterns lie over each other, the
    faint streaks of the dust and of the thin inner ring, which move with the ring plane, and the mottled
    fine texture of the globe behind, which moves with the globe. Between two frames 8 apart they slide
    against each other by more than their own size. The tool carries the picture along one flow, so the
    other pattern is unrelated after the carry. With D the share of the detail's energy that is carried
    and G the share that slid, the number is about G / (D + G): about 0.1 while the sheet's streaks rule
    (to 3798), about 0.2 once the globe rules (from 3820), and up to 0.86 while the two change places
    within the 8 frames. A slower pace only stretches the red span: two sliding patterns of the same
    strength read about 0.5 standing still.
  - A direct reading of two stills 8 frames apart (pairread.py, no chain of flows) gives 0.04 to 0.08 for
    v2 and v3 alike: it does not see this, so it is no measure of it. Only consecutive frames do.
  - Why round 51's tree was green here, by my reading of its code, not measured: the globe's foot was
    painted on the globe itself as a smooth band (the fault of severe 2), so the sheet's dust thinned over
    a strip of the globe without detail. Every tree that
    hides a lit, detailed globe behind a detailed sheet at 3720 and shows it through that sheet in the hold
    has this crossing somewhere on the way; by cause it is cured only if one of the two carries no detail
    while the sheet lets the globe through, or if the change happens where they do not slide (far from the
    plane). Neither is built: it is not a change of numbers, and what is left of the time (40 minutes) does
    not hold a proof of it.
  - To the eye (strips of 3792 to 3806 and 3808 to 3836, crop x 560 to 1180, y 470 to 830): the band over
    the globe opens from dark brown to clear with no step; the gap goes from dust to stars through a veil;
    the globe's outline shows through the sheet as a soft upright edge at x about 800 from 3796 on.
  - Decision: v3 is named as the best committed tree (the cover goes by the lens's height alone and what
    it uncovers is drawn under it at every height; MAIL 1045), with the rise's pattern line named red and
    its cause said. The proof r68 runs on for the tool's own lines.

### 11:27 UTC: the tool's own lines of the rise on v3 (r68): RED on the pattern and on the pop

  - /tmp/v/r68/saturn-rise.md (draft, rate 2, window 3798 to 3896, 198 frames; engine main 64c4ccb with the
    stop folder of d567cfd, which is the stop folder of the head): VERDICT red, 2 numbers.
  - Largest level step 0.05 at 3875 + 1/2, limit 1.3: green.
  - RED pop score 1.21 from 3872 + 1/2 to the next, limit 1.2. The same line as on ab36264: the frames over
    0.93 radii are the same pictures. In the stars by MAIL 1045 item 1; not chased.
  - RED the pattern changes in place by 1.03 from 3812 + 1/2 to 8 film frames later, most at pixel 1024,
    732, band 8 px, limit 0.45, 35 half frames over it, first 3802. By whole frames: 0.17 at 3798, 0.31 at
    3800, 0.49 at 3802, 0.67 at 3804, 0.82 at 3806, 0.89 at 3808, 0.99 at 3811, 1.03 at 3813, 0.96 at 3814
    to 3817, 0.80 at 3818, 0.51 at 3819, 0.35 at 3820, 0.17 to 0.36 from 3821 to 3843, 0.23 at most from
    3850 on. Largest change in place 52.8 from 3805 (shown, not judged), at pixel 1176, 752.
  - Beside ab36264 (r66): there 0.98 at 3830, 35 half frames over the limit in two spans (3809 + 1/2 to
    3821, peak 0.95 at 3814; 3830 to 3835). v3 has one span, 3802 to 3819: the second span, the dust in
    the gap going over to stars, is green on v3 (0.36 at most); the first, the band in front of the lit
    globe, is as red as before and starts 7 frames earlier.
  - The tool's sheet (saturn-rise-changes.png) puts both the change in place and the change of the pattern
    on the band in front of the lit globe right of the globe's outline: the band goes from brown with
    streaks to the pale globe within the 8 frames.
  - The rise's pattern line is not cured. Named red, with its cause as found at 11:18.
- 11:32 UTC. The judged frame 3720 on the head's stop folder (proof r68, engine 64c4ccb, final tier):
  - sha256 c5dcf7675cef1e39b2555ae7b776480ad8d6bc20ad38545421c7dbbb98b60c6b. G17 by tools/measure/g17.py
    against references/approved/saturn-close.jpg: median 1.000, p25 0.664 (limit 0.8; the named 88ba2385
    read 0.974).
  - Against ab36264's 3720 (r66): 2683 pixels differ, the largest by 7 levels of 255, 76 by more than 4,
    all of those in x 1152 to 1265, y 1000 to 1078 (the nearest ice at the frame's foot). No pixel differs
    by more than 12.
  - Seen at 1 to 1 beside the approved image and the named 88ba2385 (whole frame, foot, near field, cap,
    lower globe): the picture of ab36264. What was open there is open here.
  - Main is at c1305a2 (kit/PROGRESS.md only since f0b54bd): merged again before the NAMED.
  - The NAMED goes out on that merge: the best committed tree, the rise's pattern line red and named,
    the pop line red and not chased (MAIL 1045). Still running on r68: the dive's lines, then the finals
    3567 and 3866, G17, the step in place, the handover tool, G13, the gate, parity, path. Each goes to
    the Builder as it ends.
- 11:36 UTC. NAMED sent to the Builder on 6e96b4cb11c1145aa3cab3792832485152f571b2 (this branch, main
  c1305a2 merged in, tsc clean, remote checked, net 0.134 MB of my three folders against main).
  - Said as: the best committed tree, not a cured one; the rise red by the tool's own lines.
  - A: what drew the two severe faults and the cures (as in the entries above). B: the rise's lines of
    11:27, the three paces of the cover, the cause by layer, the cure not built. C: not yet measured on
    this sha: the dive's lines, the finals 3567 and 3866, the step in place, the handover tool, G13, the
    gate, parity, path, vitest; each follows by mail. D: 3465 byte identical (4077873a), G17 1.062; 3720
    c5dcf767, G17 1.000; 3567 and 3866 not rendered on this sha, ab36264's hashes given as what I expect.
    E: the files since 88ba2385. F: not cured, worst first, 11 lines. G: said, not hidden (the contact
    line's departure, the bark pair, the answer to MAIL 1016, the dust's depth by height against the
    letter of 785, stars through the dust in the first part of the skim).
  - Ten pictures attached: 3720 whole, foot, near field, cap; 3567 gap and 3866 arc (third row ab36264);
    the tool's sheet of the rise; the strip 3808 to 3836; the 2 times crop 3802 to 3814 + 1/2; the bark
    pair.
  - Disk: the dive's frames would have taken the disk under 3 GB. Removed the rise's smooth frames in the
    worktree (940 MB; the tool's outputs are in /tmp/v/r68, my strips in /tmp/v/x) and the dist of the old
    copy tree ct (its blocks were shared, it freed little). 4.7 GB free at 11:37.
  - Looks pushed 11:38 with the 3720 pictures and the tool's sheet of the rise.
  - Next: the dive's lines when job 2 ends (about 12:05), then job 3 (finals 3567 and 3866, G17, place,
    handover, G13, gate, parity, path), then vitest alone. A mail to the Builder at each.
- 11:39 UTC. MAIL 1061 from the Builder, verbatim:
  "MAIL 1061 from the Builder (/root), 11:39 UTC. To saturn_coder, answer to NAMED
  6e96b4cb11c1145aa3cab3792832485152f571b2. 1. Received as the second NAMED of your round 3 (the first was
  88ba2385). Proofs are queued on my machines on that sha (jobs sn6-01 to sn6-09): dive and rise in two
  parts each by my reader, path and parity, the measure part finals, the landing report, the final stills
  3465 and 3720 with hashes, and the units with the gate lines. Results go to you as they come. 2. By d186
  a red NAMED is followed by the next commit within 90 minutes, and the third NAMED goes into the round as
  it stands. The cut of batch 10 is laid after the running round start ends (about 13:15 UTC). It takes
  the Saturn NAMED that stands then: 6e96b4cb, or a newer one if you name it by 13:10. Round 3 is Saturn's
  last; its reds go to the jury as severe issues. 3. Your finding on the rise (two fine patterns, ring
  plane and globe, sliding over each other while the sheet lets the globe through) needs one control
  before any cure, because a thin sheet in front of a globe does show two patterns that slide under a
  moving camera, and that is true parallax, not a fault of the picture. Run the window 3798 to 3830 with
  the cover held at one fixed share (its value at 3811) on every frame. If the pattern line stays red with
  the cover held, the red is the reader's (it carries one depth per pixel), and I pass it to
  harness_builder with your frames; do not take detail out of either body to please it. If it turns green,
  the red is the pace of the cover and the cure is yours: the share by the path of the view ray through
  the sheet (its depth over the sine of the ray's angle to the plane, per ray), which is how a real sheet
  goes from closed at a grazing view to open from above. Send the number with your next mail. 4. The pop
  1.21 at 3872 + 1/2 sits in the stars and is the sky's (sky_builder has it, MAIL 1012). Not yours to
  chase. 5. The departure of the contact line (y 733 against 622) and the open items of your list F go to
  the jury as they stand, in your words."
- 11:47 UTC. The control of MAIL 1061 item 3, started at once.
  - The dive's lines on the named tree were running (frames to k7218 of about k7300 rendered). Stopped,
    because the control decides whether there is a cure to build before 13:10 and the dive's frames keep
    (the tool reuses a frame whose stamp fits the tree; the worktree's frames are left in place). The
    chain r68 is stopped with it; its third job never started. The dive goes on from k7219 after the
    control.
  - New job script /tmp/v/job_n.sh: job_v.sh with the stop folder taken from SRC, so the proofs no longer
    read the repo's working folder. /tmp/v/named/src/stops/saturn is the folder of 6e96b4cb (git archive).
  - The control tree /tmp/v/ctl/saturn: the folder of 6e96b4cb with skim.json inner.cover.share set to
    0.7037 at every knot and inner.by.depth to 0.02 at every knot (their values at the lens's height of
    3811, 0.439). Nothing else differs (checked by comparing the two JSON files without those two lists).
    Not committed: a control, not a tree.
  - Run: SRC=/tmp/v/ctl/saturn KEEP=1 SLICE=7596-7680 /tmp/v/job_n.sh /tmp/v/r69 slice (the rise's
    pictures at rate 2, draft, capture frames 7596 to 7680, film frames 3798 to 3840; the pattern at 3830
    needs 3838). Engine 64c4ccb.
  - The lens over the ring plane by out/scratch/lens.ts (h height, rho radius in the plane) and the sine of
    the view ray's angle to the plane at the near point of radius 1.25: 3465 2.326, 5.050, 0.52; 3567
    2.048, 4.464, 0.54; 3600 1.013, 3.776, 0.37; 3612 0.734, 3.536, 0.31; 3628 0.544, 3.296, 0.26; 3660
    0.471, 3.044, 0.25; 3720 0.362, 2.689, 0.24; 3760 0.318, 2.466, 0.25; 3792 0.364, 2.495, 0.28; 3806
    0.416, 2.592, 0.30; 3814 0.460, 2.655, 0.31; 3822 0.568, 2.775, 0.35; 3830 0.760, 2.971, 0.40; 3836
    0.966, 3.157, 0.45; 3852 1.681, 3.784, 0.55; 3866 2.282, 4.576, 0.57. Through the whole skim the sine
    stays 0.24 to 0.26 while the height falls from 0.544 to 0.318; hold and far look stand at 0.48 to
    0.57. So the true path through the sheet grows only by a factor 2 from the hold to the skim: a sheet
    that lets the globe through at the hold (18 in 100 covered) covers 33 in 100 at 3720 by its true
    path. A share that closes the sheet at 3720 is steeper than a true sheet's, by height or by ray.
- 11:57 UTC. While the control renders (about 13 s a frame in the low part of the rise; due about 12:12):
  the cure the Builder names for the case that the control turns green is written as a trial in the
  working tree, not committed: the cover by the view ray's own angle to the plane in place of the lens's
  height.
  - sheet.ts: uniform uOpen (one number a frame) gives way to openBy(mu), smoothstep over the sine of the
    ray's angle to the plane between skim.json inner.cover.sine [0.30, 0.42]; keptPast takes the sine; the
    far look, the near look and the shaded plane read it per pixel. Sheet.set loses its third argument;
    grade.ts coverShare and the 44 knots of inner.cover go. tsc clean.
  - Why these two numbers: the rays to the thin ice in front of the globe (radius up to 1.53) stand at
    0.21 to 0.30 at 3720, so 3720 stays closed; at 3567 and 3866 and wherever the kept set draws no ray in
    front of the globe stands under 0.42 (the lowest are the rays through the plane at the globe's limb:
    0.426 at 3567, 0.455 at 3866), so those frames keep their arithmetic.
  - What it changes by design: the first part of the skim (3628 to 3719) is closed all through, since the
    sine there is 0.24 to 0.26; on the dive the sheet closes between about 3590 and 3613; on the rise each
    place opens as its own ray steepens, the place at radius 1.4 between 3806 and 3826.
  - What I expect, said before the reading: the same red on the rise. Each place still goes from streaks
    to the globe within about 20 frames, the pace the lens sets, and three paces of the share have read
    red already. It is rendered only if the control turns green, as MAIL 1061 says.
