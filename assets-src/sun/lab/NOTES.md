# Sun ground lab, notebook

I am sun_ground_lab (path /root/venus_place_builder). Task: MAIL 936 from the Builder, 25 Nov 2026 06:11 UTC. I build a second,
independent version of the Sun's near ground on branch agent/sun-lab (from d91c0f63). Looks go to agent/sun-lab-looks
(`npm run looks -- --push --folder sun-lab`). I never push to agent/sun-place and never write main. Venus is dropped.

After a compaction: read assets-src/shared/STOP-AGENT.md, then this file.

## Rules of MAIL 936 in short

- Folders: src/stops/sun/lab/, assets-src/sun/lab/, public/assets/sun/{web,full}/lab/. At most 3 MB net growth of the tracked
  tree, counted and said in every mail.
- Other files of src/stops/sun only by the smallest switch. The standing ground stays reachable by one key in a json of
  mine: src/stops/sun/lab/lab.json "ground": "lab" or "standing". Edits outside the lab folder are listed in every NAMED mail.
- Not allowed: way (1) a picture on a relief warped by a flow, way (2) cells drawn by a formula in the fragment shader.
- Judged: (1) frame 90 draft and final as a pair at 1 to 1 beside the approved crop, approved left; (2) the life, a clip of
  frames 120 to 179 with every half frame at draft, and the smooth number (limit 0.45, standing 0.51 to 0.52),
  `npm run smooth -- --stop sun --kind rise --only pictures --frames A-B` in capture frames; (3) the far end, plan in words
  then built, nothing by the clock; (4) cost of a draft picture by part.
- Mails to /root: MEASURED, STATED, UNKNOWN apart; a mail at least every 90 minutes with the newest picture attached; a
  mail that names a commit starts with NAMED and the full sha and ends with my own list of what is still wrong. `date -u`
  before a time is written. No em dashes, no exclamation points. Trailer on every commit.

## Edits outside the lab folder (what sun_builder would take)

- src/stops/sun/set.ts: two import lines (LabGround, lab.json) and one line: `const surface = lab.ground === 'lab' ? new
  LabGround(ground.material.uniforms) : new Surface(ground.material.uniforms, map, mapToStage)`.

## Design

- sim.ts: power diagram of sites on a tile that repeats (8 units, 2800 slots). Fixed step 0.25 s, 30 s of warm up before the
  first frame of the terrain segment, kept from -0.5 s to 10.5 s (45 steps). Only + - * / sqrt and a whole number hash.
  Weight of a cell by the share u of its life: full radius squared times (3 env(u) - 2), so a cell comes from nothing and
  goes to nothing. Sites go toward the middle of their cell (relax 0.12 a step), so a growing cell presses its neighbours
  back. A slot whose life ends is born again: half of them inside the largest of 24 picked cells, 0.55 of the way to an
  edge (a split: the new cell takes a growing share of its host), the others on an edge of a picked cell.
  `cellsAt(t)` reads two steps of the table, blends them, and makes the diagram of that time: middle, area and up to 12
  edges (normal over distance) a cell.
- ground.ts (state of 07:05, after MAIL 949): one instanced polar mesh a cell in three densities (36 by 96, 14 by 40,
  6 by 16) picked by size in the picture. The cell data is a float texture (8 texels a cell), the list of drawn cells a
  float texture a level (read by gl_InstanceID). Radius r(theta) is a p-norm (p 10) of the edges times 1.06, so the
  pillows press on each other and the lane is the crease where two meet. Profile: an arc of 86 degrees, height 0.32 of
  the radius, top flattened (power 2.2), a few shallow creases between lobes round 4 sites of the dome's own.
- Light is heat alone (MAIL 949 point 1: no highlight that moves with the eye). heat 0 to 1 goes through the ramp of
  convect.json, above 1 it is brighter than white. A hot patch of no even outline in the middle (rho plus noise), a
  cooler shell round it combed into threads (fan from a root at the foot on the lens side), cold at the rim, at the
  root and in the creases, knots, small points on the rim. The flank of a dome is cooler than its top by the lie of the
  surface against the ball's up (not against the eye).
- Haze: tau = amount exp(-height / scale) / mu^power, mu the cosine between up and the look. Far cells melt into a
  bright limb, near ones stay sharp.
- Spot: the cells' chart is drawn in toward the spot (place r on the ground belongs to r + pull exp(-(r/wide)^2) of the
  chart), so cells become strands. A funnel in height (wall from 2.6 to 0.9 umbra radii, 0.12 deep), domes flatter
  there. Every thread ends over the pit at its own place (discard by the thread's own noise), so there is no ring of
  gaps. The floor is a dark mesh under all of it.

## What MAIL 949 asks (06:38)

1 no view bound highlight, heat alone. 2 wide range, knots that bloom, map a temperature. 3 cells half as wide, mixed,
flatter tops with lobes, lanes uneven with small bright points. 4 depth by a glowing haze. 5 spot a wide flat dark sunk
floor with fine dark threads over its edge. 6 far domes foreshorten into fine grain; look at 0 and 179 too.

## Measured

- 06:18 d91c0f63 builds (npm ci, build, vitest 62 files 700 tests).
- Standing ground, frame 90 draft: 51.3 s on this machine (4 CPUs, no GPU).
- Lab ground, first raw still of frame 90 draft: 22 s. life() takes 4.9 s once at set creation, cellsAt 30 to 70 ms.

## Traps

- three.js uploads changed vertex attributes in projectObject, before any onBeforeRender. An instanced attribute filled in
  onBeforeRender is one render late (first still was black). The list of cells is a DataTexture now: textures are
  uploaded at the draw.
- The read tool cannot open files under out/work; copy pictures to /home/user/workspace/v/ first.

## Log

- 06:36 first raw still with real domes (out/work/sun/lab/lab-90-b.png): cells about twice too large, too yellow and
  too evenly bright, no umbra.
- 06:38 to 07:05 stills d to o. What failed on the way: threads as broad bands (satin, shells), a dark root drawn large
  (reads as an open shell), deep lobes with a term by the eye (gems), dark rim all round a tall dome (beans), veins as
  thin lines (a drawing). What held: low pillows that press on each other, a hot patch with a soft uneven edge, thin
  dark rim, threads strong only in the shell and in the penumbra.
- 07:05 still o: near ground max channel percentiles 5 25 50 75 95 = 0.27 0.44 0.63 0.79 0.94 against the approved
  0.23 0.40 0.58 0.76 0.91. Frames 0 and 179 hold (stills n).
- 07:13 MAIL 956: direction right (heat alone, sunk spot). Asked: (1) one sheet, not pebbles: crease depth varies along
  a border down to nothing by a field of the place, bright patches cross borders, veins as thin dark threads that leave
  a lane and die inside a cell; (2) not polished: the top streaked by the fibre field at full strength, many small
  bright points; (3) spot: torn umbra edge with bright tongues, penumbra threads 2 to 3 times as long, dark and bright
  in turn, each of its own length and bend, ending among the cells with no ring, no row of bulges. Lanes darker and
  browner locally without moving the median. Order: fibres, veins, merging; then the life clip 120 to 179 at 60 a
  second with my own proxy number (the reader knows only dive and rise); then the far end and handover plan. Next mail
  by 08:30.
- 07:15 to 07:28 stills s to y. Failed: fibres as a fan from inside the dome with few fibres a turn (monstera leaves,
  scallops); cells with footprint 1.0 (holes). Held (commit 9119c72, still y): labJoin(place) lifts both sides of a
  border to one level (uLabMore.w, 0.007 units) so the crease is gone there and the dark rim and flank cooling go with
  it; the heat of the place (vn of the chart place, scale 8 a unit) crosses borders; fibres from the root at the foot
  with counts 14, 34, 80 a radian and the pattern cut along the fibre (4, 8, 14 a dome length) so they are streaks;
  veins: 4.5 a radian from the root, 45 percent drawn, each with its own reach; penumbra as threads in the polar
  chart about the spot (55, 120, 260 a radian), the same for all cells they cross, reach 2.9 umbra radii give or take
  by the thread; umbra edge by discard with tongues.
- One page renders a second frame in 9 s (the first 23 s holds the load and life()). assets-src/sun/lab/clip.ts renders
  capture frames on one page (query rate=2). clipstat.py and est.py: my proxy of the pattern reading. Calibration:
  standing ground 170 to 178 reads 0.38 by est.py where the judged reader says 0.47 to 0.52, so the proxy reads about
  a quarter low. Lab still o (no flow in the shader) 0.02, still p 0.10: far under the limit, there is room for more
  life.

## Far end and rise: the plan (07:35, not built)

Everything by place, eye distance, angle and pixel size. Nothing by the clock.
1. A dome is drawn as geometry while its width in the picture is over about 5 px of a 1080 frame (three densities by
   size, as now). Between 12 and 5 px its height sinks to the level of the floor and its heat goes to the mean heat
   of the ground at its place, so at 5 px it is the floor and can be left out without a step.
2. The floor under the domes carries the same ground as grain: a cell field of the chart place in its shader (cheap,
   two octaves), with the same heat law and haze, weighted by pixel size: full where a cell is 5 px, the mean heat
   alone under about 1.5 px. So the horizon of the surface view and the first part of the rise are domes near, grain
   behind them, a glowing limb last.
3. On the rise the group lies on the globe's ball as the standing ground does. As the eye climbs every cell shrinks in
   the picture, so the domes hand to the grain and the grain to its mean by pixel size alone, the far side first and
   the place under the eye last. Where a cell is under about 1.2 px the floor lets the globe's own face through
   (its alpha by pixel size), which is the standing law "away" expressed in pixels.
4. Count: at an eye height h (stage units) the frame holds about 1.9 h^2 / 0.008 cells at 0.1 / h * 1037 px. With the
   dome limit at 5 px (h about 20 units, 1 radius) that would be far too many, so the limit rises with the count:
   domes above 12 px only once more than 16000 are in the frame (h about 8 units), all of it by pixel size.
5. The chart about the place stretches sideways by sin(a)/a at the angle a from the place (0.64 at 90 degrees): grain
   only there, accepted.
