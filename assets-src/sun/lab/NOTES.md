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
