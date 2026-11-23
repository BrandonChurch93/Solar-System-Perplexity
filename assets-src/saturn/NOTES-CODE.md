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
- The hatch like woven cloth was the sand of ice.ts in the skim: fine points drawn out along the motion of
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
