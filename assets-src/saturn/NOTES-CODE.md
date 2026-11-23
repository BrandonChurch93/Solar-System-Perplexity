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
