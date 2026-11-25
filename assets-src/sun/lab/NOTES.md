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

## 07:36 to 07:50, while the clip of state y renders (no still possible)

- kit/05 read on determinism: a fixed step simulation from the first frame of the segment may cache checkpoints, the
  cache never changes the result. My table is made at load by the same code on every machine, no file.
- Looked at approved and state y side by side at 2 to 1 (v/appr-zoom.jpg): the approved top is a SOFT bright blotch
  mottled at about a third of a cell, the fibres are fine and soft and are strongest toward the rim (dark between
  them there), the crown is bright, the dark is thin veins with a soft halo and beads of light along them. State y
  is striped shells: the fan from a dark root at the foot reads as a scallop, the threads are too bold and too white.
- So state z (written, not yet seen): root of the fan inside the dome (fibre.offset 0.3 of the radius, was 0.92 at
  the foot), no dark root (fibre.dark 0), periodic noise round the turn (vnp, no seam), the fibres' strength grows
  from heat.thread[1] on the crown to heat.thread[0] at the rim, a mottle of the place (scale 30 and 66 a unit) on
  the top, veins now come in from the rim (14 places a turn, half drawn, each of its own reach), rim band thinner
  (0.8 to 0.98). Penumbra: thread counts 85, 190, 400 a radian (were 55, 120, 260), less white.
- Far end seen in y-far.jpg: red orange haze with few light patches against the approved's golden grain. The haze
  power 2.5 makes everything under a look of 4 degrees opaque. To try: power 1.5, amount 0.004, and smaller cells
  (sim slots 5625, radius 0.021 to 0.06) since the approved cells are about 0.8 of mine in the near pair.

## 07:40 to 08:02: states z to zk (committed d741d77, ac24b9b), and what is written but not yet seen

- The clip of state y was stopped at 59 pictures (240 to 298) to free the machine for the look. Proxy on those 59:
  pattern over 16 capture frames, largest 99th percentile 0.089, picture to next 0.021 (clipstat.py).
- z (root inside, soft fibres): flat pavers with a sharp bright top. FAILED as it stood. Cause found: the mesh's own
  ring coordinate rho is not the plan radius (rho 0.7 is 0.87 of the radius seen from above), so everything written
  by rho sat in a thin outer band. The heat profile now goes by the plan radius sin(a)/sin(arc).
- What held (zf on): top = floor + pow(1 - plan^2, heat.core) times the wide field of the place, times a mottle of
  three octaves (0.45 to 1.35); dark by depth (vDeep, the height of the surface over its foot, from the vertex
  shader: black where two domes meet low, a soft halo above); flanks cooler by the lie (heat.edge 0.12); veins come
  in from the rim (14 places a turn, 40 percent drawn); points down (knot 0.3); haze power 1.5 amount 0.004.
- zi: cells smaller (sim slots 5625, radius 0.021 to 0.06): flat starfish. zj: dome height 0.42, flat 1.9, core 1.4,
  rim 0.1: plump again. zk: fibre counts 6, 14, 32 a radian for the new size, join level 0.009, more joins.
  Near ground of zk: mean rgb [0.611 0.369 0.184], percentiles [0.271 0.412 0.616 0.796 0.961 1.0] against the
  approved [0.231 0.404 0.58 0.761 0.906 0.965].
- Clip of zk running since 07:56 (out/work/sun/lab/clip-zk, life now 5 to 14 s, well 0.06).
- Written, not seen: penumbra threads as level lines of the field about the spot (labPen, shared by dome and
  floor); fibres at 0.9 strength on the crown; wider dark halo by depth.
- Written, not seen: THE FAR END. A map of the tile (2048, half float, mips, anisotropy 16) is drawn each time the
  time changes from the same cells with the same dome shader seen from above (define LAB_MAP, heat alone). The
  floor reads it at the place in the cells' own chart (the comb toward the spot undone in closed form) wherever a
  mean cell is under far.px[1] = 10 px of a 1080 frame; a dome sinks to the floor and takes the map's heat between
  10 and 6 px and is left out under 6. So the cells in the map are the same cells at the same places as the domes,
  and the mips carry them to their mean. In the surface view the horizon is 6.5 units off and a mean cell is 62/d px
  wide, so every cell up to the horizon stays a real dome; the map is for the rise.
- Known cost risk: on the rise, cells of 6 px and more can be 70000 and more; level 2 list raised to 512 x 512.

## 08:18 UTC mail sent (not NAMED), state zl 4382e81
Clip of zk measured: proxy over 16 capture frames largest 0.108, mean 0.081; picture to next mean 0.004, largest 0.064 at k0314 to k0315 (table step boundary 5.25 s, lowest quarter of the picture: a jump, cause open).
Own verdict: still shells (white star and dark spokes on every cell). Next: heat as a field of the place, not a profile of the cell. Next mail by 09:45 UTC.

## 08:37 UTC states zm to zs (75403e8), MAIL 980 (08:26) taken in
MAIL 980: verdict shared; wants cells 40 to 160 px mixed, some run together; net wide and soft at triple points, thin to nothing along some borders; tops mid gold with small white glints; LIFE READABLE in 6 s: a share of cells with lives of 2 to 4 s, grain seen to flow from middle to rim; the jump first; table a pure function of seed and config; map drawn per frame time from the frame number alone. Next mail by 09:45: frame 90 pairs, cause of the jump, frames 0, 60, 179, one rise frame.
THE JUMP, cause found and cured (sim.ts): (1) a cell was live only while live at both steps and its weight at the ends was only twice its own radius squared below nil, so small cells still held ground when they were cut: about 200 cells popped at every step. Now the weight falls to minus (gone times largest radius) squared at both ends, and cellsAt reads the weight off the cell's own age at the time (table holds birth and span, not weight). (2) two sites born in one step in the same host at the same edge lay on one point and ignored each other: births now lean and reach by their own hash, and of two sites on one point the lighter holds nothing. (3) sites that left the tile between steps were binned wrong: wrapped now. Test /tmp/jump2.ts style: area change over 0.0002 across each of 42 step boundaries: 0 (was about 200 each).
Ramp read: target heat percentiles 5/25/50/75/95 are 0.115 0.21 0.335 0.51 0.71 (from convect.json ramp against the approved near field).
Failed: fibres as level lines of 2 d noise (marble, agate); root at 0.85 on the far side with low radial frequency (wood grain, tiger eye); tall domes arc 86 height 0.42 flat 1.9: half of what the lens sees is flank (debug picture of the band), so any dark band reads as a dark cap side: now height 0.3 flat 1.5.
Held (zr): dark band by plan radius, wide at corners (vCorner = second largest over largest edge term), gone where joined; rays 3/7/14 a radian; blot field (place noise and fan noise); lives 2.4 to 11 s squared toward short; well 0.14.

## 08:44 to 09:00 UTC states zt to zv (77693b1), the rise read, state zw written
zt strong crown, zu milder, zv (committed 77693b1): borders pushed about by a place field (join.wobble 0.022), sharper fibres, more lane points. Near ground of zv: mean rgb [0.625 0.374 0.174], percentiles [0.271 0.451 0.651 0.8 0.937 0.988] against the approved [0.231 0.404 0.58 0.761 0.906 0.965]. Own verdict: tufts or dry leaves with wide flat brown skirts, not plump.
Clip of zv (frames 120 to 179, 120 pictures) started 08:48, about 10.5 s a picture, log out/work/sun/lab/clip-zv.log. Then /home/user/workspace/v/after.sh clip-zv.
THE RISE with zv (stills 185, 200, 215, 230): 185 and 200 fine. At 215 a hard seam where the domes end and a bright broken patch over the spot. CAUSE: my materials were opaque with render order -6, so they were drawn BEFORE the globe's ball; the ball (no depth write while placing, depth test on) then drew over everything of mine that lies under the ball's radius: the pit and the whole floor (0.004 under). So the far map on the floor was never seen on the rise. CURE written (not yet seen): on the globe's side every material of mine is a transparent twin with premultiplied blending (WEIGHED, as convect.ts weighed), so it is drawn after the ball; labOut holds the standing law of place.json onGlobe (away 0.6 to 2.4 radii in the logarithm, reddening over 0.32 to 1.4, times keep). In the surface view the plain opaque materials are used as before.
pick(): mean cell width was computed from all slots (0.06 units); only about 2100 to 2360 of 5625 slots hold ground and the true mean width is 0.095. Now lab.far.cell 0.095.
WHY THE TUFTS (worked out on paper at 08:57): with dome.over 1.06 the border lies at plan radius 0.943, where the dome still stands at 41 percent of its height (arc 86, flat 1.5). So the dark by depth (smoothstep 0.03 to 0.4 of vDeep) never reached a border, only the pits at triple points, and the dark band by plan radius 0.8 to 0.94 covered the dome from 72 down to 41 percent of its height, which is the whole flank the lens sees: a brown skirt. State zw (written, not seen): band by plan radius removed; the crease is dark by depth from heat.crease[0] 0.36 (plus or minus crease[2] by a place field) over crease[1] 0.2 of the height, so it is thin along a border, wide and soft where three meet (the round footprints leave a deeper pit there) and nothing where joined; flank heat edge 0.5 (was 0.12); height 0.36; body 0.86; well 0.2.

## 09:08 UTC state zzc (committed), what was seen and measured since zv
- Clip of zv stopped at 44 pictures (k0240 to k0283) to free the machine. Proxy on those: over 16 capture frames largest 0.542, mean 0.481; picture to next largest 0.125, mean 0.041. FAR TOO FAST, and the cause is in the weight law of 08:37: weight = full^2 env - GONE (1 - env) with GONE 0.032 against full^2 of 0.001 to 0.004, so a cell held ground only while env was over about 0.75: visible for 46 percent of its span (1.1 to 5 s), grown in 13 percent of it (0.3 to 1.4 s). Boiling.
- New weight law (sim.grow 0.38, sim.edge 0.08, sim.under 3): weight = full^2 ((1 + under) env - under) - GONE gate, env rises over the first grow of the life and falls over the last, gate is 1 only in the first and last edge of the life. So a cell grows over about a third of its life and shrinks over a third, and the plunge to nothing happens only at the very ends. jump2 test: 0 area jumps over 42 boundaries. sim.life [2.5, 14] (hash squared: 36 percent under 4 s), sim.slots 3000, radius [0.028, 0.088]: 1932 cells on, widths 5/25/50/75/95 0.021 0.064 0.096 0.124 0.160 units.
- zw (crease by depth, low domes): flat pads, failed. zx (height 0.62, flat 1.25, crease 0.33 over 0.5, join.level 0.02, cool 0.38, edge 0.6): plump loaves, matte. zy (new life and sizes, fewer lane points): mixed sizes, overlap seen. zz (thread sharper and finer counts 4/9/20, dark between threads 0.42, blot 0.38 to 0.64, cool 0.28, hot 1.4, body 0.95, a thin dark line in the crease, join level at most 0.7 of the own height): satin cushions with radial pleats, the nearest so far. zza: floor in the penumbra carries the threads, dome.pen 0.12, hot 1.25. zzb: penumbra flatter and wider. zzc: thread widths 0.03 to 0.1 (were 0.045 to 0.2: nearly everything was thread), spot.depth 0.04, wall 0.95 to 2.0, umbra dark to 2.2 radii.
- Near ground of zzc: mean rgb [0.567 0.337 0.168], percentiles [0.224 0.361 0.545 0.769 0.957 0.996] against the approved [0.578 0.338 0.147], [0.231 0.404 0.58 0.761 0.906 0.965].
- THE RISE: frame 215 with the transparent twins: cells to the limb, spot whole, no seam, no patch. Still to see: 230 and 240 (the away fade into the globe's face).
- Still wrong: creases soft brown, not thin dark lines; tops clip (p95 0.957); fine speckle and dark veins from dimples missing; spot: umbra a clean flat ellipse, black slits between the petals of the penumbra, threads read as wood grain on the near side.

## 09:20 UTC state zzd (6e9ed56) committed, clip of zzd running, state zze written (not seen)
- Frame 240 of zzc had a dark ring inside the limb. CAUSE: labOut discarded where the ground had given way (held 0), so nothing wrote depth over the ball (the ball writes none while placing) and what lies behind the ball showed through at the limb. CURE (zzd): discard only when keep is 0 or in the diagnostic views; a ground that has given way still writes its depth, as the standing ground does. Frame 240 clean, frame 222 shows the ground fading into the globe's face toward the limb.
- Clip of zzd: `npx tsx assets-src/sun/lab/clip.ts --from 240 --to 359 --out out/work/sun/lab/clip-zzd`, started 09:14, about 11 s a picture, ends about 09:37. Then after.sh clip-zzd. Then the test of the frame law: git stash, clip.ts --from 300 --to 300 --out out/work/sun/lab/fresh-zzd, cmp with clip-zzd/k0300.png, git stash pop.
- Measured on the pair of zzc: the umbra's dark is x 203 to 418, y 178 to 260 in the spot crop against the approved 199 to 420, 172 to 228: same width, same far edge, 32 px too tall on the near side. A flat disc under a look of 24 degrees is 2.4 times as wide as tall; the approved is 3.95 times. So the approved umbra is a real pit whose near lip hides the near part of its floor: a lip of 0.07 units with a steep wall does that. zze: spot.depth 0.07, wall 0.92 to 1.25 umbra radii, dark of the umbra ends at 1.5 radii.
- The black slits in the penumbra are the floor seen between the low domes there (its threads stood at 0.55 of the domes'): now 0.9.
- Read off the approved at native size (appr-native-near.jpg): the tops are mottled mid gold, the bright is thin lines and points at the lips of the domes where they turn down into the crease, the dark is pits where three cells meet with the fibres running into them. zze: knee on the heat of the tops (heat.knee 0.6, slope 0.45), points added after the knee, hot ends of the threads at the lip (heat.lip 0.45), veins as the thin creases between the lobes dying toward the crown (heat.vein 0.55), fibres bent by a place field (fibre.bend 1.3), crease shoulder narrower (0.28), dome.lobe 0.18.
- Cost: life() 3.6 s once at load, cellsAt 20 ms a sample (node, while a clip ran).

## 09:40 UTC mail sent (not NAMED), state zze faca211, clip of zzd
- Clip of zzd (120 pictures): proxy over 16 capture frames largest 0.406 at k0308, mean 0.287; picture to next largest 0.042 at k0341 (not on a table step), mean 0.010. No jump.
- Frame law tested: capture frame 300 after 297 to 299 on one page equals 300 on a fresh page, byte for byte (out/work/sun/lab/law-a, law-b).
- zze near ground: mean rgb [0.592 0.347 0.154], percentiles [0.231 0.412 0.588 0.796 0.914 0.941]: the numbers fit the approved. The look does not: gold foil nuggets, satin swirls (fibre.bend 1.3 swirls too much), a brown gap round each cell, no glints. Spot: pit with wall 0.92 to 1.25 shows a brown cliff with a notched top edge (floor mesh too coarse there, 3 rings on the wall), dark still y 172 to 255 against 172 to 228.
- Said to the Builder: next mail by 11:05 UTC. Next: one sheet (gap to a line, heat across borders), fibres into the pits, the wall of the pit, then the final tier pair of frame 90, cost by part.

## 10:22 UTC, states a1 to c4 (after MAIL 1018: no lamp, one sheet, no cliff)

All stills are frame 90, draft. Pictures in /home/user/workspace/v (NAME-near.jpg, NAME-spot.jpg, NAME-zoom.jpg).

- a1 to a9: the lamp went. Heat by plan radius (1 - plan^2), view law on a smoothed normal (heat.lie 0.3; the full
  local normal read as a headlamp), polygon cells (round 10, over 1.03, flat 1.6, height 0.42), level law
  min(join.level (0.5 + 0.5 join), join.most high).
- pit.py (applied, do not rerun): pit centre moved back (spot.back 0.14), a fine pit disc (define LAB_PIT), labPen
  takes the distance to the pit.
- b1 to b9: funnel in place of the cliff (spot.wall [0.78, 1.5], depth 0.15), domes end at the lip, fade of fibres by
  the picture's width ACROSS them (fwidth faded them at grazing view).
- The black slits and triangles in the penumbra were the FLOOR seen in the gaps at triple points (diag: floor heat 3
  shows white there). The floor had the haze thinned to 0.1 round the pit and the domes did not, so the domes had an
  orange wash and the floor none. Cure (c3): one haze law of the place for both
  (0.1 + 0.9 smoothstep(2u, 3.5u, distance to the pit)), the floor carries the same threads at the same strength.
  The slits are gone and the penumbra is dark with bright threads.
- Penumbra threads (c1 on): value noise at N a radian shows threads about 3 lattice steps apart, so 24 a radian gave
  ribbons 30 px wide. Now the count doubles with each doubling of the distance (octaves of log2(rs), cross faded):
  52 f0 and 110 f0 a radian, a broad 26 f0 that only weighs them. Along the thread the noise runs on log2(rs).
- Near field: fibre.offset 1.0 (root outside the cell) read as agate or wood grain (c3). offset 0.45, thread
  [0.25, 0.8] (c4) reads as shells with ribs. Small hot points along the fibres (spark) added.
- MEASURED c4 near ground: mean rgb [0.612 0.356 0.156], max channel 5/25/50/75/95/99
  [0.263 0.427 0.643 0.788 0.918 0.961]; approved [0.578 0.338 0.147], [0.231 0.404 0.58 0.761 0.906 0.965].
  c3: [0.591 0.336 0.150], [0.263 0.408 0.6 0.761 0.933 0.973].
- Reader against proxy on one window (zzd clip, capture frames 240 to 300): judged reader largest 0.717 at k0255 at
  [68, 1072], mean 0.383; proxy largest 0.305 at k0283, mean 0.244. The 0.406 of the 09:40 mail was the proxy.
  reader.ts is the judged reader's pictures() run on a folder.
- A draft still is 25 to 27 s on a fresh page now.
- STATED verdict c4: no lamp, no cliff, no slits. Near field still reads as solid shells, not gas.

## 10:44 UTC, state c7 (commit 5663fa267a0e65784e8111eb86288dfd48fa2cae), MAIL 1030 and sun_builder's mail of 10:33

- MAIL 1030: round 50 closed on the film's standing ground. Decision d290: the lab ground replaces it once proven
  beside the approved image at 1 to 1. From now the critics' words judge: granules with ridges and narrow dark lanes,
  bright tops at the approved scale; umbra with depth, penumbra filaments of varied length; G17 at frame 0 was 0.635
  against 0.8 on the standing ground. Owed in the 11:05 mail: no lamp state, frame 90 pairs at 1 to 1 (whole, cells,
  spot, limb), my reading of G17 on frame 0, the control for the gold foil, the clip 120 to 150, reader against proxy,
  one line on whether the ground lays into sun_builder's interface.
- sun_builder's interface (GROUND.md, eye-path.json in /home/user/.perplexity/attachments/d1add9c365c7465faa1ac6a60ef50c98/):
  new Surface(shared, map, toStage), mesh, update(time, eye, keep, onGlobe), dispose(). LabGround has the same four
  (constructor takes shared only) and is switched in set.ts by lab.ground.
- c5 to c7: the heat of a cell is two blotches of its own (seeded places and sizes in the cell's disc) in place of a
  ring about the middle, so no rim of even width; the dark by the lane has a width of the place (0.1 + 2 c0);
  join.level 0.012; counts [2, 5, 11]; rim 0.32, body 1.0, core 0.35, patch [0.15, 0.75], thread [0.25, 0.7],
  offset 0.45. c6 (rim 0.16, lane dark 0.4) was bright spots in a dark sea.
- MEASURED c7 frame 90 near ground: mean rgb [0.614 0.349 0.161], max channel [0.337 0.455 0.592 0.773 0.933 0.969].
- MEASURED G17 (tools/measure/g17.py) frame 0, nograin view, review tier (15 samples): median 0.916, 25th percentile
  0.629, 79 tiles; worst tiles [6,4] 0.268, [7,4] 0.337, [5,4] 0.393 (the penumbra and the pit). Frame 90 review
  beauty (with grain): 1.331.
- Control for the lamp: c7 with heat.lie 30 (view law on the full local normal) against lie 0.3: bright faces toward
  the eye come back; mean difference of the near ground 0.035, 5.6 percent of pixels over 0.1.
  /home/user/workspace/v/control-lamp.jpg.
- STATED verdict c7: scales or leaves of polished amber with marbling; hard polygon silhouettes; flat red level
  between the cells in the middle field; limb darker and redder than the approved (its far field is a bright haze).
- NEXT (plan): the gas as a march. The map pass also writes the height of the ground; every fragment marches its
  sight line through a thin layer over that height field (in the chart, warp undone) and gathers glow with the
  depth of gas under the line: thick over lanes, thin over tops, most toward the horizon. Also: bend down (the
  marbling), level lower and over higher (V creases, no flat red), haze up toward the limb.
- MEASURED clip of c7, capture frames 240 to 300 (film 120 to 150), 61 pictures at 10.3 to 10.8 s: judged reader
  largest 0.626 at k0259 at [28, 1040] (bottom left corner, one cell event near the lens, rows 254 to 267 over the
  limit 0.45), mean 0.357; outside that event 0.19 to 0.30. Proxy largest 0.276 at k0282, mean 0.184. zzd on the
  same window: reader 0.717 and 0.383, proxy 0.305 and 0.244. Files reader-c7.txt, proxy-c7.txt, clip-c7.mp4.
- 10:48 mail sent (not NAMED, state c7 5663fa2). MAIL 1038 (10:55) from the Builder: c7 not for a critic. Worst
  first: (1) leaves of amber on a red floor: no floor may be seen, cells one pressed sheet, a lane the crease where
  two cells meet, 1 to 3 px in the middle field of a 1080 frame, near black; (2) far field and limb redder and darker
  than the approved, hard horizon; (3) the spot: satin ribbons in a neat round funnel, wanted a ragged umbra outline,
  needles of mixed length with bright heads, outer edge fraying into the granules. The march: light from the same
  heat field as the ground under it, a function of place and eye alone, cost by part at the final tier. Owed: the
  life in three lines (what moves by what law, how many film frames a cell lives) and two clips of film frames 0 to
  60 at every half frame, one with the eye held still, one with the film's eye. The reader's 0.626 corner: look frame
  by frame; the cure is in the span law if a cell ends too fast; read the still eye clip too. Decision d292: round 2
  waits for the lab ground, starts at the first take that holds it and at 15:00 UTC at the latest. NAMED wanted by
  13:30 UTC. State owed by 12:30 UTC: frame 90 pair, frames 0 and 60, the two clips, G17 on 0, 60, 90, rise stills
  185 to 240.
- d1 to d3 (failed): join.level 0.004 and dome.over 1.08 press the cells into one sheet (kept); counts [5, 13, 30]
  with strong threads were corduroy shells; a thin lane line by plan with haze 0.015 was cracked mud in an orange
  wash.
- e1 to e3: lane dark by the distance to the cell's border (edgeD = 1/over - plan) with a ragged edge by the fan
  noise; veins by labLobes; commit 4078134. Still leaves: a dark rim of 0.3 and a hard patch gave each cell a big
  dark share.
- e4 to e8 (the step that worked): the cell is bright all over (rim 0.45 to 0.62) with a soft hotter middle (patch
  [0.15, 0.75], three seeded blotches), a narrow near black lane (lane [0.035, 0.2, 0.8], crease[2] 0.02) and a
  shade toward the border (shade [0.12, 0.25]), both with a width by the place (smoothstep(0.4, 0.75) of the crease
  field) so that some borders are a thin line and others a wide dark valley. Fan threads weak (thread [0.04, 0.5]),
  cool 0.7, groove 0.6, vein 0.3, edge 0.6, haze 0.008 power 1.5 tint [1, 0.85, 0.5]. Penumbra noise with a higher
  frequency along (lr 9 and 15) broke the ribbons into dashes: white squiggles on the near side (bad).
- Corner of the c7 clip (k0250 to k0268, /home/user/workspace/v/corner-c7.jpg): no cell ends or splits in that
  window; the cells keep their outline and the bright fan pattern inside them flows. So the reader's number there is
  the bright threads' flow under the lens, not a short life.
- Control hook: LabGround.update adds globalThis.labAhead (seconds, absent in the film) to its time; clip.ts --hold K
  draws capture frame K again and again with labAhead = (k - K)/60, so the eye stands still and the ground lives.
  reader.ts --hold K reads such a folder with the pose of K.
- e9: tongues in the penumbra (labTongue: n drops side by side about the spot in ranks along log radius, head
  toward the umbra, own length, bend and heat; two layers 72 and 46), umbra edge by the lot of the column, pit
  shallower (depth 0.07, wall [0.85, 1.9]).
- e10 to e13 (commit 45c6206): tongues [110, 70] in ranks [2.2, 1.7], hot 1.8; dome.round 8, flat 1.5, wobble 0.03;
  shade [0.22, 0.4] with a width of (0.4 + 1.2 smoothstep(0.3, 0.8, crease field)); lane [0.03, 0.12, 0.6]; rim 0.5,
  patch [0, 0.9], body 1.12. e11 (round 6, flat 1.3) was nuggets with gaps. Whole frame reads as a pressed sheet of
  golden cells with a tongue spot; near pair still cobbles: lanes brown and soft, not thin and black; too smooth.
- f1: the gas march (labGas in TAIL_GLSL: 20 steps from the place to the eye through a layer to gas.top, the ground
  under each step read from the map, which now holds the height in g; a skin on the domes and a pool in the low
  places; glow by the mean heat of the ground under the path). First try (skin [5, 0.005], pool [2, 0.012]): glow
  far too weak, lanes black, far field pebbles on black, limb dark; a draft still 66.8 s against 27 s. Behind the
  switch gas.steps (0: the analytic haze as before). Not tuned yet.
- f2 (commit d26bc8a): labWell: the heat lumps of a cell are born small about its middle, spread outward with the
  gas and fade at the rim (two generations cross faded, period heat.spread[0] 4 s, growth e^1.2 a period, size 3 a
  dome radius, share 0.8 against the still mottle of the place); heat.well 0.3. Chain 3 runs on f2: still 90, hold
  clip (capture 0 to 120 with the eye of capture 0), film clip 0 to 120, rise stills 185 to 240, G17 0, 60, 90.
- Mail of sun_builder 11:15 and MAIL 1051: the globe wants a baked level of my ground: gnomonic about the spot,
  W 40 degrees, N 4096 (2048 enough if the ground stays to 0.37 to 0.72 radii), 8 bit sRGB, seen from straight
  above, no view law, no gas, no flare lights, clock 0; files public/assets/sun/full/place-far-0.jpg and web at
  half size, the bake script, a recipe for G11 (FAR-TWIN.md in
  /home/user/.perplexity/attachments/fee7a78ca7f14731b42b9170441488b0/). RULED: my ground takes its large tone
  (over about 3 degrees) from the globe's map inside the level and outside; my spot is the map's dark knot (1.9 to
  2.0 degrees wide as a disc of equal area, box 2.2 to 2.5 by 3.0 to 3.25, middle 0.08 west and 0.32 south of the
  spot's coordinate; standing ground's umbra 1.82 wide, penumbra 3.82). If mine differs by more than a fifth say
  so with both numbers before baking. Owed in the 12:30 mail: spot width in degrees, far hand over law and reach,
  whether my pass can give the level.
- Life span law (sim.ts): span = 2.5 + 11.5 q^2 s with q even in 0 to 1: shortest 75 film frames, median 5.4 s
  (161 frames), longest 420; 36 percent under 4 s. A cell grows over the first 38 percent and shrinks over the last.
- 11:20 to 12:05 UTC, all in the worktree /home/user/workspace/lab2 (at f2) while chain 3 draws in the repo; to be
  copied into the repo when the chain ends (src/stops/sun/lab/*, set.ts, assets-src/sun/lab/bake.ts, level.py,
  spans.ts):
  - Still eye clip of f2 (out/work/sun/lab/clip-f2h, v/clip-f2-still-eye.mp4): reader largest 0.476 at k0016 at
    [980, 888], mean 0.263 (limit 0.45); proxy largest 0.308. Cause seen in v/spot980.jpg: a large old cell in the
    middle of the near field is eaten by its neighbours in about 10 film frames. The fault is the span law.
  - spans.ts (CPU only, about 30 s) measures the table alone. f2 law: half of the largest ground to nothing in a
    median of 13 film frames, quartile 7, 5 percent in 2.
  - New span law (sim.ts): every cell is given the ground its age asks for. share(u, span): from nothing to its
    full ground over max(0.38 of the span, 1.4 s), at most half the span, the ground growing evenly with the time
    (quadratic ease over the first 0.3). At every step of 0.25 s the weights of the power diagram are moved toward
    the weights at which each cell holds its share: 6 rounds of 0.6 of the lacking ground over the cell's
    stiffness (sum over its edges of length over twice the way to the neighbour: the ground gained by a unit of
    weight); a cell that holds nothing is put by bisection (find) at the weight at which it holds its share. A
    cell born on a step comes up from the weight at which it holds nothing at that step (find(.., 0)), the cell
    that ended went down to that weight at its last place. What failed on the way: a closed form weight with a
    least window (neighbours rule the ends); a start weight of anchor (the cell holds half the host at once);
    the threshold weight taken at the next step (the gauge of the weights drifts from step to step, so a newborn
    began with a radius of 0.05 and ate its neighbours for a few frames); find for every cell over 1.5 times its
    share (jumps: 95th percentile of the share lost in 8 frames up from 0.31 to 0.59).
  - MEASURED with spans.ts on the new law (solve 6, gain 0.6, soft 0.8, warm 15): cells over 0.06 units of
    radius: half of the largest ground to nothing in at least 14 film frames (1 percent 16, quartile 22, median
    29); largest share of the largest ground lost in 8 film frames: median 0.19, 95 percent 0.29, most 0.82. All
    cells: ends 5 percent in 5 frames, quartile 18, median 24; births 5 percent 6, quartile 20, median 27. Whole
    lives seen in the 180 frames: least 57 frames, median 86, most 170. Not yet drawn.
  - Map tone (labTone): heat times clamp((L / 0.245)^0.3, 0.8, 1.2), L the globe's map at about 2.8 degrees (4 taps
    at the lod of that width); LabGround(shared, map, toStage). Map about the spot (gnomonic 40 degrees, linear
    light, lod 6): percentiles 1/5/25/50/75/95/99 = 0.129 0.151 0.203 0.244 0.291 0.463 0.632, at the spot 0.283.
  - Bake of the far twin: globalThis.labBake = {deg, size}; LabGround.bake() draws the floor shader with LAB_BAKE
    (far 1, mu 1, no haze, no lights, tone on, clock 0) from the ball's centre toward the spot, x mirrored;
    assets-src/sun/lab/bake.ts writes out/work/sun/lab/level/place-far-0.rgba, level.py makes
    public/assets/sun/full/lab/place-far-0.jpg (2048) and web (1024), quality 92. Untested.
  - Look candidates in lab2's lab.json: spot.floor [0.004, 0.02], spot.gap [0, 0.07], heat.lane [0.04, 0.13, 0.6],
    heat.shade [0.3, 0.2], heat.rim 0.72, heat.body 1.05, heat.patch [0.1, 0.9], heat.thread [0.04, 0.6], haze
    {amount 0.006, power 2.0, level 1.1, own 0.45}. Untested.

- 12:20 to 12:45 UTC, 25 Nov: state g15 (to be NAMED).
  - 12:20 state mail sent on f2 (d26bc8a3). MAIL 1088 (12:36) rules: spot width by the hold's measure at final 360
    (bake laid in at 1.58 and 1.9 degrees, mean absolute difference to references/approved/sun-hero.png, whole and
    in the place's box; sun_builder reads 11.9772 whole): NOT DONE, needs sun_builder's globe reading my level. Spot
    onto the knot: if spot.back moves the spot in frame 90 by over a hundredth of the width, sun_builder turns the
    place's anchor by 0.7 degrees instead. Bake 2048 allowed if not coarser than the map; in my folder: yes. The
    Builder's eye on f2: cobbles on a brown floor (close the lanes), one sided satin sheen (no lamp), glitter in
    lanes, umbra level, far field and hard horizon, rise 215 to 225 two bodies (law wanted: map's low band times
    my fine band). Order for the NAMED of 13:30: span law drawn, both clips under 0.45, a and b, f as far as it
    stands.
  - lab2 copied into the repo; worktree lab2 to be removed.
  - Looks g1 to g15 at frame 90 draft. What helped: heat.body 0.88, rim 0.48, shade [0.14, 0.3], patch [0.2, 1.0],
    heat.fine [0.6, 4.0] (a finer welling), edge 0.8; spot ranks [3.6, 2.7], tongues [180, 115], hot 2.6, gap
    [0.02, 0.2]; heat.lie 0 (the view law reads the ball's up alone, no dome normal: the one sided sheen was the
    0.3 of the dome's normal); glint 0.3 and points 0.93 (glitter in lanes gone); dome.height 0.3 and arc 70 (the
    near flank of a tall dome showed its dark rim to the eye: boulders; flatter reads as one sheet); haze.amount
    0.0045 (lanes darker). far.tone deg 1.5, power 0.5, range [0.6, 1.3] (the map's tone stronger).
  - Air: the gas past the limb. A sphere of radius ST_RADIUS + 8 * air[0], back side, no depth test, in a group of
    renderOrder 1 (at -5.8 inside my group it did not show: drawn before the sky's later layers). tau = air[1] *
    exp(-(nearest way of the look past the ball) / air[0]). air [0.1, 3] was a wide orange fog over the stars,
    [0.03, 1.5] nothing to see, [0.04, 1.2] a soft glow of some 15 px. The limb itself is still a hard pale line.
  - g15 near ground, frame 90 draft: max channel percentiles 5 25 50 75 95 99 = 0.224 0.353 0.569 0.753 0.949 1.0
    (approved 0.231 0.404 0.58 0.761 0.906 0.965).
  - Bake at 1280 (g15): full 1,984,357 bytes, web (640) 549,666 bytes. Texel: 0.0326 degrees at the middle, 0.0288
    (radial) at the edge; the globe's map (8192 wide) 0.0439 degrees: finer everywhere. Web: 0.065 against 0.088.
    Umbra on the bake (max channel under 0.15 after a blur of 3 px): disc of equal area 1.55 degrees wide (1.43 at
    0.1, 1.66 at 0.2), box 1.60 E-W by 1.53 N-S, middle 0.06 east and 0.39 north of S. The map's knot (sun_builder):
    1.9 to 2.0 wide, 0.08 west and 0.32 south. So: width 0.8 of the knot, middles 0.72 degrees apart.
  - Still eye and film eye clips on the new span law: see the next entry.

- 13:18 UTC, 25 Nov: NAMED 751af6d0a9ab9d6900f801ffd2dc4710f7532858 (g15) sent to /root with 10 attachments (text in
  the desk's v/named.txt). Sent to sun_builder at 12:46: the far twin's answers (files, texels, umbra on the bake,
  laws, the anchor to turn by 0.14 east and 0.71 north, ruling 1 open).
  - MEASURED on g15: spans.ts: cells over 0.06 units: half of largest ground to nothing in at least 13 film frames
    (1 percent 16, quartile 22, median 29); all cells ends median 25, 5 percent 5; whole lives least 50, median 87,
    most 172. Still eye clip (clip-g15h, 121 pictures, 13.3 s each): reader largest 0.161 at capture 45 at
    [1536, 1020], mean 0.110, share read 0.506; proxy 0.157 and 0.104, picture to next 0.004 (f2 0.054: the flowing
    grain of the fibres and the points is turned down, so the low number is not the span law alone; whether the eye
    sees flow outward is UNKNOWN).
  - Draft still 43 s, of which the table about 13 s.
  - Growth 2,681,925 bytes in my folders (JPGs 2,534,023, text 147,902).
  - Owed in a second mail: film eye clip number, G17 at 0, 60, 90, rise stills 185 to 240, all on g15 (chain4.sh in
    the desk's v folder, log v/chain4.log).
  - Open: ruling 1 of MAIL 1088 (bake a second level with spot.umbra about 1.2 for an umbra of 1.9 degrees, hand it to
    sun_builder, or read the hold at final 360 on a tree that reads the level). Law f (the map's low band above
    about 0.55 degrees at full strength times my fine band; think of it in linear light: my colour times the map's
    low band over my ground's mean light). Cells too large by about 1.6 against the approved and angular; far
    cells are tiles; limb a hard line.

- 13:19 UTC, 25 Nov: MAIL 1109. g15 goes to sun_builder for the round (round 2 of 3 starts at 15:00 at the latest).
  Order of work for the next named (due 14:40): a outline (round domes, soft upper envelope, no straight seam
  longer than a third of a cell), b size (70 to 120 px in the lowest rows), c inside (bright blotchy core smaller
  than the cell, dark veins to the junctions, from the flow), d tone (six percentiles of the approved, lane dark
  amber, one law), e far field and limb (grain under 6 px, limb the gas edge on), f life (flow outward as a number:
  mean radial motion of the grain in px a film frame at frame 90's near rows). Specks at the arcade's left foot:
  whose.
- 13:41 UTC: second mail of g15 sent (low). Film eye clip cut at 65 pictures: reader largest 0.260 at capture 48 at
  [1268, 504], mean 0.166, share 0.478; proxy 0.258, 0.100, picture to next 0.032. Flow on g15's still eye clip
  (flow.py): mean radial 0.032 px a film frame (4 captures apart), 0.041 (8 apart), standard error 0.018, share of
  cells outward 0.56 to 0.58, 168 cells: no flow a number can tell. G17 on g15 NOT read; rise only 215 and 225
  (gravel at 215). Specks: not mine by the code (STATED). At 225 pale blue white patches left of the spot: UNKNOWN
  whose.
- The h series (13:25 to 13:49), what each step did at frame 90:
  - h1: ground.ts: vertex gives vEdge (the way to the cell's own border by a soft least way of power dome.round,
    1 on the border); the dome's footprint is dome.over 1.45 of the cell, so bodies cut into each other and the
    sheet is the upper side of all (depth buffer). sim scaled: tile 3.2, slots 4560, radius [0.0195, 0.0468]
    (0.68 of g15's size), far.cell 0.062. spans.ts threshold 0.83 of radius[1]: same numbers as g15.
  - h2: folds softer (heat.fold), lane dark amber (crease[2] 0.2, shade[0] 0.22), dome.height 0.4.
  - h3: heat.curve fitted by curve.py (labCurve in labOut and the bake).
  - h4: patch [0.35, 0.95], rim 0.5. Percentiles 0.208 0.333 0.569 0.745 0.902 0.969.
  - h5: haze amount 0.004 power 2.5 level 1.3 own 0.6: the far field glows into the limb (no line) but the middle
    distance is a flat orange fog. own 0.6 is the cause of the fog (the valleys light up).
  - h6: shade [0.3, 0.2] (narrower dark skirt), thread[1] 0.22 (less streak), cool 1.1 (stronger lumps): blotchier,
    lanes thinner.
  - h7: join.level 0.0015: no change to see, kept.
  - h8: haze amount 0.002 power 3.0 level 1.3 own 0.45; rim 0.6, vein 0.45: far field a glowing grain into the
    limb, near unchanged.
  - h9: curve fitted again, fold [0.55, 0.78]: percentiles 0.227 0.400 0.576 0.749 0.906 0.961 against the
    approved's 0.231 0.404 0.58 0.761 0.906 0.965. FROZEN for the named.
  - Still wrong in h9 by my eye: near cells read as nuggets with a dark skirt, not bubbles pressing; cores not
    small blotchy spots; middle distance flat; penumbra ribbons and a dark red ring round the spot.
- Draft still 56 s with the scaled sim. Clip picture about 17 s.
- 13:50 UTC: h9 baked: full 1,966,957 bytes, web 499,732. Umbra on the bake (max channel under 0.15 after a blur
  of 3 px): disc of equal area 1.51 degrees (1.39 at 0.1, 1.64 at 0.2), middle 0.06 east and 0.37 north of S.
  Growth 2,627,955 bytes (JPGs 2,466,689, text 161,266). spans.ts on h9: cells that show: at least 13 film
  frames from half of the largest ground to nothing (1 percent 16, quartile 22, median 29); whole lives least 51,
  median 87, most 171.
  size.py (new, rough): lane to lane along a row at 3 px: approved 66 to 68 px, h9 49 to 57, g15 60 to 71; at 8 px:
  approved 110 to 115, h9 93 to 99, g15 97 to 99. It counts veins as lanes and does not tell g15 from h9, so b is
  not proven by it. The sim's own scale is 0.68 of g15's.
- 13:51 UTC: h9 committed and pushed as 9a4c4e9460964043c6525f45be16626140a1017a (not named). sun_builder told at
  13:52 (new sha, rebaked level, the specks at frame x 1390, y 600) and corrected at 13:53.
- 13:55 UTC: a strip at 1 to 1 (rows 820 to 1080, x 260 to 1660 of the 1920 frame, v/strip.jpg) showed h9 had
  overshot the size: approved cells 100 to 160 px, g15 100 to 200, h9 60 to 130 with many of 60. The Builder's 70
  to 120 against 100 to 220 was most likely read on my 1408 px attachments. So:
  - h10: sim.slots 2790, radius [0.0249, 0.0598], far.cell 0.079 (0.83 of g15's size, tile 3.2): 70 to 150 px.
  - h11, h12: fold [0.7, 0.72], vein 0.6: the cells turn dull, clay lumps with few bright cores. Not kept.
  - h13: heat.tone [0.8, 0.4] (new key, was 0.55 + 0.9 of the place's field in the code), rim 0.5: little change.
  - h14: fold [0.6, 0.77], vein 0.5, rim 0.55, patch [0.28, 0.9]: brighter cores. Percentiles 0.224 0.404 0.592
    0.761 0.906 0.961 against 0.231 0.404 0.58 0.761 0.906 0.965 with the curve of h12
    ([0.1047, 0.1155] ... [1.3871, 1.0]). FROZEN for the named at 14:01.
  - size.py on h14 at 3 px: lane to lane 53 to 62 px (approved 66 to 68, g15 60 to 71).
- 14:02 UTC: mail from sun_builder: g15 joined in f906d2ec on agent/sun-place. (1) The level laid whole reads 13.4045
  on the hold 360 against 11.9772 (too dark), so it lays it by law f: the level's bands finer than 0.55 degrees
  over the map's low band, in linear light; the hold is then the map alone. (2) The anchor is turned: place.json
  globe.spot [0.23625665, 0.2013716, 0.95059575], north [-0.04857035, 0.97951492, -0.19542631]. My far.level.axes
  are of the old frame; it passes the place from place.json. A rebake should be at the new place (NOT DONE in h14:
  my branch's place.json is the old one; only the fine band of the level is used, so the harm is small). (3) The
  rise with my ground reads 0.778 at [40, 330] against a limit of 0.45 (standing ground 0.349), captures 218.5 to
  226.5: the stage ground seen from far, grains of one or two pixels kept sharp. Cure on my side: the far ground
  filtered to the pixel by distance. OWED, first thing after the named. (4) The specks: none in its state at
  x 1390, y 600; the old loops.ts with sparks is still drawn in my branch, not in its.
- 14:02 UTC: h14 baked: full 1,972,137 bytes, web 519,307. Umbra on the bake at 0.15: 1.46 degrees wide (1.36 at
  0.1, 1.56 at 0.2), middle 0.06 east and 0.38 north of S (old axes). Growth 2,654,872 bytes (JPGs 2,491,444,
  text 163,428). spans.ts on h14: cells that show (614): at least 13 film frames from half of the largest ground
  to nothing (1 percent 16, 5 percent 18, quartile 22, median 29); all ends median 25, 5 percent 6; whole lives
  least 58, median 87, most 172.
- 14:17 UTC: NAMED 212defeca69aa1e30f374c17d5cb7c9192fa1c3e (h14) sent to /root with 7 attachments. sun_builder told
  at 14:18 (h14 replaces h9; asked which command reads its rise number).
  - MEASURED on h14: percentiles as above. Still eye clip (clip-h14h, captures 0 to 40, 15.2 s a picture): reader
    largest 0.181 at capture 4 at [88, 1072], mean 0.158, share 0.507; proxy 0.177, picture to next largest 0.032
    at capture 14 (g15 0.004; cause UNKNOWN, look at k0013 to k0015). flow.py: 15 cells found (168 on g15), mean
    radial -0.003 px a film frame, standard error 0.049, share outward 0.40: no flow by number. Draft still 44 s.
  - My verdict in the mail: h14 better than g15 in outline, size, tone, far field, limb; not in the cores (dimmer)
    and the lowest rows can read as lumps side by side. The hard maximum of the depth buffer is not the smooth
    maximum the Builder asked for in a. The veins follow the borders, not a flow (c not done). f not done.
  - NOT DONE: G17, film eye clip, rise of h14, rebake at the new place.
- NEXT (order told to the Builder): 1. the far filter for the rise: labPx is uLabFar.z / distance (width, no
  foreshortening); the far map (2048, mips, anisotropy 16) is read by textureGrad with the true footprint, so a
  cell of 1 to 2 px stays a sharp grain. Cure to try: widen gx, gy as the cell's width in px falls (1 at 6 px, 3
  at 2 px) so a cell under about 3 px fades into the mean; also let the domes sink by the foreshortened size near
  the limb. Read captures 218.5 to 226.5 at preview. 2. the smooth maximum (a), the flow (c, f).
- 14:21 UTC: MAIL 1123. RULING: h14 stands for the outline, the size, the tone, the far field and the limb. Neither
  g15 nor h14 is plasma: both read as stones (g15 slabs, h14 cobbles), because a stone is lit from one side and a
  cell of the Sun shines from within. Orders: (5) FIRST the far filter for the rise, named by 15:20 and told to
  sun_builder at once. Then (2) the law of the cell's light: heat of the gas at the point times a darkening by the
  angle between the surface normal and the EYE, 0.6 to 1, nothing by any light direction; send frame 90 with and
  without any light term. (3) relief: the dome's height against its width goes down until the dark skirt is the
  cool lane seen from above; soft valley; no step of the heat at the lane. (4) the inside and the flow are one:
  the fine grain is a pattern carried outward by the cell's own flow, read in the cell's polar frame (angle, radius
  less speed times time), drawn out along the radius. Second name with what is ready of 2 to 4 by 16:15; the rest
  goes to round 3 of 3. The specks: no work.
- 14:19 to 14:45 UTC: THE FAR FILTER (h15 to h17).
  - The rise's reader (tools/img/smooth.py pattern, through my reader.ts): capture 437 against capture 453 carried
    back along the flows, both reduced to their detail between 8 and 40 px of the preview frame and divided by
    their local contrast. Commands: ../v/rise2.sh NAME [--still 437] (clip.ts --from 437 --to 453 --tier draft
    --format preview, then reader.ts and clipstat.py). reader.ts --sheet OUT.png draws the pair (first, last carried
    back, difference, pattern); --job FILE keeps the job for other readings.
  - MEASURED: h14 0.875 at [276, 360]. h15 (cells under 2 to 5 px seen fade into the mean of the map by a wider
    footprint, far.blur [2, 5, 4]; seen = width in px times min(mu + far.lie 0.35, 1); px are now real pixels of
    the drawn frame, the focal from the buffer's height) 0.810 at [332, 440]. h15 with the life of the cells held
    at capture 437 (clip.ts --still 437) 0.812: so it is NOT the life of the cells and NOT the grain alone.
  - THE CAUSE, seen in the sheet (v/sheet-h15s.jpg, v/rise-pair.jpg): between capture 437 and 453 the film goes
    from my ground to the globe. The globe at 453 shows its map (plages, filaments, dark lanes of 1 to 3 degrees);
    my ground at 437 was an even grain with only the map's light wider than 1.5 degrees at power 0.5. The band the
    reader judges, 8 to 40 px, is 0.7 to 3.3 degrees there: two unrelated patterns.
  - THE CURE (h16): where the cells are too small to be things the ground is the globe's own map. labTone reads the
    map's light at a level that goes from far.tone.deg 1.5 to far.tone.far.deg 0.55 (the width of law f on
    sun_builder's side, place.json plates.fineDeg), never finer than the pixel, as the cell's width seen falls from
    far.tone.far.px 12 to 4 px; the power goes from 0.5 to far.tone.far.power 1, the range from [0.6, 1.3] to
    far.tone.far.range [0.25, 2.2]. In the bake the weight is 0 (the twin is as before, no rebake).
  - MEASURED h16: reader 0.172 at [524, 264] (limit 0.45), proxy 0.268, picture to next 0.025. The large light of
    my ground at 437 against the globe at 453 carried back (/tmp/tonefit.py: both blurred 3 px at quarter scale,
    lower 55 percent of the frame, 13499 px): slope of the logs 1.003, correlation 0.956, standard deviations of
    the logs 0.345 and 0.362, means 98.8 against 106.9 of 255 (mine 8 percent darker), 95th 144 against 171 (the
    globe's white plages are brighter than my ramp's top). The power 1 was the first value tried and is kept.
  - Frame 90 at 1080 with h16: near percentiles to the digit those of h14. But a dark dashed line stood on the
    silhouette at the left (x 0 to 500, y 520 to 600 of 1920): the domes at the horizon sunk by the lie of the look
    left the limb's own edge bare. h17: the sink of the domes goes by the width alone (labPx) as in h14, the heat
    and the tone by the width seen. Dashed line gone (v/limb-14-17.jpg). The far band under the horizon is a
    little smoother than h14.
  - tone.py (the mean light of the twin for a given share of the heat) was started and stopped, not used.
- 14:46 UTC: h17 committed and NAMED df86fc7a45cad102bd756ffedeb47ef9265d8950; sun_builder told 14:48.
- 14:54 UTC: THE WHOLE RUN 380 to 470 on df86fc7a (75 pairs): 437 reads 0.121 but 401 to 424 read over the limit,
  largest 0.853 at capture 412 at [156, 392], mean 0.365. Cause (v/pair412.jpg): the map's light came in only where
  the cells are small in the picture, so between 412 and 428 the map's patches fade in over an even grain. The
  filter moved the fault 12 film frames earlier. CORRECTION sent to /root and sun_builder at 14:59 (hold df86).
  LESSON: never name on one pair; read the whole run 380 to 470.
- 14:59 UTC: sun_builder MEASURED df86 on its branch: 437 to 453 0.294 at [46, 322] (was 0.778); the map's patches
  stand at the same places (the turn through the constructor's map is right with its anchor); frame 360 the same
  bytes. NEW FAULTS it saw: a row of single dark red pixels along the limb at captures 437 and 453; single pale
  violet and green pixels in the grain at 453 at [430, 420] (NOT LOOKED AT YET). Its frame 60 lines of sun-near.py
  on df86: white 0.027 (g15 0.072), half width 4.1 px, 2431 shapes, distance 0.089 (g15 0.074). It needs a name by
  15:45 to join it for the 17:00 cut; its chain starts 16:15.
- 15:01 UTC: MAIL 1145: direction accepted (the ground carries the map's band always, law f). THE PROOF OF A STATE
  FROM NOW ON: the whole run 380 to 470 under the limit on my reader, every pair, with the rows; and frame 90 at
  1080 beside h14 and beside the approved ground at 1 to 1. Do not name before the whole run is read. Then 2, 3, 4
  of MAIL 1123 in order.
- 15:00 to 15:08 UTC: h18 to h20.
  - h18: the map's light at 0.55 degrees, power 1, everywhere: frame 90 goes pale where the map has plage
    (percentiles 0.275 0.451 0.663 0.859 0.992 1.0). Not kept.
  - h19: THE BAND. labTone = the wide tone as before (1.5 degrees, power 0.5, [0.6, 1.3]) times the map's light at
    far.tone.far.deg 0.55 (never finer than a pixel) over the map's light at far.tone.far.broad 4 degrees, power 1,
    range [0.4, 2.2], at every distance; faded out toward my spot by the same weight as the haze (the map has its
    own spot there). In the bake the band is off. Run 404 to 453 (34 pairs): largest 0.332 at 422, mean 0.214.
    Frame 90 percentiles 0.235 0.392 0.588 0.8 0.961 1.0.
  - h20: curve refit by curve.py to [[0,0],[0.1065,0.1155],[0.1829,0.2113],[0.3463,0.3335],[0.6051,0.5078],
    [1.0652,0.7174],[1.3442,0.8703],[1.6442,1.0]]: 0.22 0.38 0.576 0.757 0.918 0.992. And the limb's dots: they
    are in h14 too, at the same pixels, so not the far filter: the air beyond the limb (AIR_FRAG, new in the h
    series) is not drawn where the sight line passes inside the ball, and the ground's mesh stands a part of a
    pixel inside the ball's edge; single pixels of neither. Cure: the air is drawn 1.5 pixels into the ball.
  - The law work of point 2 (a1: fibre.offset 0, blotches centred by heat.stray 0, the darkening 0.6 to 1 by the
    dome's normal to the eye, linear in the cosine, for the far ground by the ball's up) is written as a script,
    /tmp/law.py on ground.ts, and waits for the whole run of h20. a1 at frame 90 (v/lab-90-a1.jpg): the cells have
    a bright middle and darker rims, still cobbles; percentiles 0.212 0.369 0.553 0.722 0.898 0.953.
- 15:17 UTC: THE WHOLE RUN of h20, captures 380 to 470, 75 pairs: every pair under 0.45, largest 0.446 at capture
  416 at [132, 536], mean 0.225 (rows in v/rise-h20.txt and in the NAMED mail). Stills 0 and 60 drawn.
- 15:19 UTC: h20 committed, pushed, NAMED eccae6571e844f6539c5c5bc2023b8808e7af3d5 to /root; sun_builder told 15:20.
  Growth 2,670,240 bytes.
- 15:23 UTC: MAIL 1162. eccae657 is taken (ledger), joins the chain only when the harness's own reader is green on
  the chain with it. THE LOOK IS NOT ACCEPTED AS PLASMA: approved = soft pillows with a bright middle, fine fibres
  from the middle to the lane, thin dark lanes with bright filigree; mine = stones with hard facets, a lit side and
  dark skirts. ORDER: 1 light as heat (heat times the darkening by the eye's angle; no lamp, no lit side, no cast
  skirt). 2 lower relief: pillows, the lane thin and dark because it is cool, not because it is deep. 3 fibres and
  grain carried outward in each cell's polar frame, flow by number, seen in 30 frames at the film's rate without
  reading as a slide of a picture. 4 birth and death by a smooth law: no cell appears or goes inside one frame
  (slivers in frames 0 to 179). 5 the top 1 percent 0.992 against 0.965: bring it to the approved. First find why
  the pair at 416 stands out and say what it was. BY WHEN: a sheet of frames 0, 60, 90 against the approved at
  1 to 1 with points 1 and 2 by 17:30 UTC. NAMED with points 1 to 4 by 19:15 UTC for the 20:00 cut, with the whole
  run 380 to 470 and the hold's frames read again. If a point cannot be had, name what stands and say which point
  is missing.
- 15:24 to 15:36 UTC: WHY THE PAIR 416 STANDS OUT (h20).
  - MEASURED (/tmp/band.py on the reader's own carry, quarter scale, boxes of the lowest 35 of 135 rows from the
    left): the same ground is brighter 16 captures later: 96.5 to 108.8, 108.2 to 135.9, 63.2 to 77.3, 88.0 to 81.9
    of 255. The pair 400 to 416 at the same corner: 104.7 to 104.8. Near the limb the later picture is darker.
  - Cause 1, MEASURED: capture 432 drawn with the handover to the globe's face off (uLabAway zero) against the
    film's 432: the film's is brighter by 1.09 to 1.17 in the lower 160 rows of 540 (1.15 to 1.17 in the lowest
    100). From film frame 207 on (capture 414) the ground gives way to the globe's face by the distance from the
    eye (place.json onGlobe.away 0.6 to 2.4 radii), and the globe's face is brighter there than my ground.
  - Cause 2, MEASURED: capture 416 with every cell forced into the mean of the far map against the cells as
    drawn: 1.03, 1.06, 1.08, 0.99 in the lowest 140 rows, 0.94 to 0.98 in the 70 rows above. The far filter took
    the curve of the mean heat, and the curve bends, so many cells in a pixel were brighter than the same cells
    apart. This is also why the refit of the curve raised the readings of 404 to 423.
  - CURE of cause 2 (in the tree, not named): the far map carries the heat through the curve in its blue channel
    beside the heat; a pixel of the far map shows the curve of the mean heat times mean(curve) / curve(mean)
    (labMeans). MEASURED after: 0.975 to 1.00 in all eight boxes.
  - Cause 1 is not cured: the twin on the globe is the bake of h14 with the old curve and the old filter. It needs
    the rebake at the turned anchor with the final curve, then the level of my ground against the globe's face
    measured at 432 with and without the handover. OWED.
- 15:22 to 15:40 UTC: THE LIGHT LAW AND THE RELIEF (trials on frame 90, v/strip-b1.jpg, b2, b4).
  - a2 = h20 with the law (/tmp/law.py): the blotches centred (heat.stray 0), the fibres' root in the middle
    (fibre.offset 0), one darkening mix(graze[0], 1, |n.eye| / graze[1]) with the dome's normal eased to the ball's
    up toward the rim (dome.soft) and for the far ground by the ball's up. STATED from the code: there never was a
    term with a light direction; the one sided look came from the root set toward the lens and the blotches off
    centre, and the skirt from heat.shade (a dark band of 0.3 inside the border) on a tall dome.
  - b1: dome.height 0.22, dome.soft [0.55, 1], heat.shade off, heat.core 1.0, heat.patch [0, 0.85], heat.rim 0.2,
    fibre.along [2.5, 4, 6], heat.thread [0.15, 0.5]: glowing blobs, the bright middle too small.
  - b2: heat.wide 1.8 (the width of the hot middle), heat.core 0.6, heat.patch [0, 0.7], heat.rim 0.3: bright
    cells with rays to the lane, thin lanes; reads as petals, a little flat, the lanes hairlines, angular.
  - b4: heat.round 0.886 (the heat falls by the larger of the way to the border and the way to the dome's round
    foot: cool wide corners, round bright bodies), dome.height 0.28, heat.crease[2] 0.45, heat.rim 0.2: soft
    pillows with a streaked bright middle and cool lanes. b5 = b4 with the curve refit:
    [[0,0],[0.1115,0.1155],[0.1661,0.2113],[0.3138,0.3335],[0.5712,0.5078],[1.1382,0.7174],[1.5756,0.8703],
    [1.8756,1.0]]; frame 90 near percentiles 0.239 0.365 0.569 0.757 0.906 0.957 (approved 0.231 0.404 0.58 0.761
    0.906 0.965). The top 1 percent is at the approved's (point 5 of MAIL 1162).
  - b6 (heat.core 1.0, heat.patch [0, 1], thread[0] 0.1): too dark, glow blobs. Not kept.
  - STILL WRONG in b5: the cells are angular flakes beside the approved's round pillows; lanes thin, no bright
    filigree; the middle field reads flatter than h20's; fibres short.
  - The twin was not rebaked: the bake now also carries labMean (the bake's own picture changes a little).
- 15:44 UTC: MAIL 1175 (the newest, rules): b7 has the approved's levels and not its form. (a) SIZE: approved near
  cells 150 to 260 px, b7 70 to 150. (b) LANE: 10 to 25 px wide, dark red brown, thin bright threads in it; b7's are
  hairlines and the cells meet as flat flakes with corners. (c) BODY: swollen, fibres from a darker dimple to the
  rim, the light strongest on the crest; the roll all round the cell by the eye's angle and not by a side. MOTION is
  the other half: a cell swells, its rim breaks, it splits or fades within the 12 s of the surface view, no pop.
  SHEET at 17:30 UTC: frame 90's lower third at 1 to 1 against the approved (form) and one group of cells at 1 to 1
  in five captures 12 frames apart (motion). If it still reads as stones or flakes: name another way of making the
  body and its cost. NAMED by 19:15 with points 1 to 4 of MAIL 1162, the rebake, the whole run and the hold.
- 15:44 to 16:15 UTC: FORM, trials on frame 90 (v/strip-NAME.jpg: approved, the one before, this one).
  - b8: fibre.slow 1.3 (the grain runs along r as -slow log(1 - r / slow)); b9: dimple, the roll back by heat.shade
    on 1 - fall (round, no side), wider lane, thin threads: orange fill in the lanes (the threads lacked
    abs(edgeD)); c1: that cured. c2: cells 1.3 times (radius [0.0324, 0.0777], slots 1651, far.cell 0.103). c3:
    height 0.36: little gained. c4: rim 0.45, shade [0.55, 0.35], dimple [0.4, 0.25], lane [0.07, 0.1]: close
    packed, thin lanes, still leaves with veins (commit e799c1c4). c5: heat.round 0.95, vein 0.3, groove 0.35, fold
    0.35: smooth cobbles. c6: thick strands of the first count (fibre.thick 0.9), thread [0.15, 0.85], dimple
    [0.55, 0.3]. c7: fibre.counts [2.5, 7, 14] (were [5, 13, 30]), thread [0.2, 0.9], heat.hot 1.8: THE STEP: thick
    bright strands on a darker body, the cell reads full. The fibres were two to three times too fine for the
    approved's strands (16, 44 and 88 round a cell now). c8: fibre.cold 0.18, lane [0.1, 0.16], shade [0.45, 0.4].
  - c9, d1: heat.breaks [0.45, 0.9, 0.8] (an old cell's rim breaks: the dark threads between its lobes grow from
    the rim inward with its age), thin threads rarer, sim.relax 0.3 (rounder cells, fewer wedges), born laws
    heat.born [0.2, 0.45, 0.95] then [0.4, 0.3, 0.9], dome.born [0.3, 0.3, 0.95]. A young cell's radius is its full
    radius times the root of its share, so it is at half its radius early: the first born law left wedges bright.
  - d2: radius [0.035, 0.10], slots 1123, far.cell 0.125 (largest cells 1.67 times h20's, wider spread). d4: curve
    refit [[0,0],[0.0981,0.1155],[0.1285,0.2113],[0.2532,0.3335],[0.4677,0.5078],[0.8874,0.7174],[1.2366,0.8703],
    [1.5366,1.0]]: frame 90 near percentiles 0.235 0.384 0.58 0.757 0.906 0.965 (approved 0.231 0.404 0.58 0.761
    0.906 0.965). Commit 772d28de (not named). By eye d4 reads as swollen cells with strands from a dimple and dark
    lanes with thin threads, near the approved's form; v/strip-d4.jpg, v/four-d4.jpg (0, 60, 90, approved).
  - SEEN in d4, wrong: the far half of the ground washes to an even orange where the approved keeps its lanes to
    the limb; the penumbra's strands read as long wavy hair at 1 to 1 (rows 780 to 900, x 900 to 1200); the group
    of cells changes much in 12 film frames (v/motion-d4.jpg): one cell goes from mid to white in 0.4 s (the lumps
    of heat.spread with heat.cool 0.7).
  - flow.py on clip-b8h (9 pictures): 6 cells read, mean -0.380 px a film frame: not trusted (too few cells).
  - Helpers: clip.ts --step N; v/motion.sh NAME x y w h (five captures 24 apart from 180, eye held, 3 by 2 sheet).
- 16:17 UTC: the turned anchor lives in agent/sun-place f906d2ec (place.json toBody, globe.spot, north, mapSpot,
  plates.fineDeg 0.55, and convect.json, set.ts, globe.ts differ from my branch). My branch's place.json is the old
  one, so a bake with turned axes on my branch would put the umbra 0.7 degrees off the middle. PLAN: bake in a
  worktree of f906d2ec (/home/user/workspace/place, node_modules linked) with my lab folders laid over it, and read
  frame 90 and the run there too. Whole run d4 on my own branch started 16:18 (twin of h14 still).
- 16:20 to 16:36 UTC, d5 (commit 9ddb0705, pushed, not named): beads (knots of hotter gas that ride outward on the
  strands, fibre.beads [0.45, 9]). MEASURED: whole run d4 on my branch (old anchor, twin of h14) largest 0.360 at
  capture 398 at [0, 536], mean 0.190, 75 pairs, limit 0.45. spans.ts: cells over the size that shows (224 ends):
  half of the largest ground to nothing in at least 16 film frames (1 percent 18, 5 percent 19, quartile 22, median
  31); all ends (1049): least 1, 1 percent 3, median 25; largest share lost in 8 film frames for showing cells:
  median 0.18, 95 percent 0.27, most 0.34; whole lives seen (216): least 60, median 82, most 170 film frames.
  flow.py (grain's radial drift by correlation, px a film frame): d4 21 cells mean 0.069 (SE 0.065), share outward
  0.71; d5 30 cells mean 0.046 (SE 0.070), median 0.110, share outward 0.70. NOT conclusive. STATED from code: grain
  speed 0.3 (1 - r / 1.3) dome radii a second.
- 16:37 UTC: bake in the place tree (worktree /home/user/workspace/place at f906d2ec, local only, never pushed)
  with my lab folders laid over: frame 90 there gave near percentiles 0.255 0.431 0.62 0.792 0.922 0.988, the same
  as my branch gives once place.json carries the turned anchor. So I took the anchor numbers of f906d2ec into my
  branch's src/stops/sun/place.json (stage.toBody, globe.spot, north, mapSpot, mapNorth, patchNorthOffDeg,
  twin.position, twin.quaternion, onGlobe.heights.surface, onGlobe.away; backup v/place-old.json). This is an edit
  outside my folders and goes in every NAMED mail.
- 16:40 UTC, d7: curve refit at the turned anchor: frame 90 near percentiles 0.243 0.396 0.58 0.757 0.906 0.957
  (approved 0.231 0.404 0.58 0.761 0.906 0.965). Twin rebaked at the turned anchor: full 1,715,215 bytes, web
  490,030. Whole run 380 to 470 and hold 700 to 732 started 16:42:46 (v/rise-d7.txt, v/hold-d7.txt).
- 16:50 UTC, SEEN on v/form-d7.jpg (approved lower third over d7, 1 to 1): cells read as swollen pads with strands
  from a dimple, no longer flakes; WRONG: the pads float apart on a wide dark floor (gaps 30 to 60 px, approved 10
  to 25 px and packed), the right of the frame (x over 1400) and the middle distance are dark red brown and flat
  (same in d4 and h20, so not the turned anchor; the tone of the place from the globe's map, far.tone), the
  penumbra's strands reach into the lower third as wavy hair. Cause of the gaps by the code: the heat falls by a
  round law (heat.round 0.95: zero at rho 0.73) times a gaussian blotch (heat.wide 1.8) so the corners between
  three cells and the rims are cold. Next: wide up, round down a little, then the tone's lower bound.
- 16:54 UTC, MEASURED d7 (turned anchor, twin rebaked): whole run 380 to 470: largest 0.406 at capture 398 at
  [0, 536], mean 0.206, 75 pairs, limit 0.45; pair 416 now 0.213 (h20 0.446), the hump 419 to 429 stands at 0.31 to
  0.39. Hold 700 to 732: largest 0.006, mean 0.005.
- 17:00 UTC, e4 (on d7 5a8c028a): heat.wide 2.8, heat.round 0.85 (cells fill their ground, gaps narrower), heat.shade
  [0.45, 0.65], heat.dimple [0.6, 0.35]. Frame 90 near percentiles 0.243 0.400 0.584 0.745 0.898 0.953 with the d7
  curve (no refit). Run and hold NOT read for e4. MEASURED cause of the dark right and bright middle of frame 90:
  the globe's map low band (far.tone.far, law f). Mean of the largest channel, band on: right (x 1400 to 1900, rows
  720 to 1080) 0.524, left (200 to 700) 0.642, middle near (800 to 1200, rows 900 to 1080) 0.662; band off (range
  [1, 1]): 0.565, 0.579, 0.587; approved: 0.625, 0.587, 0.541. far.tone.range's lower bound does nothing there.
  SEEN on v/form-e4.jpg and v/motion-e4.jpg: still pads (river stones with a fan drawn on top), not the approved's
  bulbs made of broad tubes; whole cells change their light much between captures 12 film frames apart.
- 17:02 to 17:22 UTC, RULINGS. MAIL 1217 (judge's reading): cells read as stones, must be round domes of glowing
  melt, light swelling smoothly from lane to crown, no glint, no facet, glow of the crowns bleeding over the lanes;
  lanes thin, dark red brown, never black, fine bright threads where two cells touch; nearest cells a tenth of the
  frame wide; colour deep gold to orange with red brown darks; nothing may move as a bent picture, each cell lives
  (swell, brighten, spread, split or sink), lanes close and open, the spot's threads creep inward; fine silky
  threads from the crown down into the lane, a crackle is the sign of a solid. MAIL 1218: THE TUBES RULED (6 to 12
  tubes in the cell's polar frame, rise at the dimple, arch over, plunge into the lane; relief in the vertices; heat
  on the crest, cold in the groove; light is heat times the eye's angle on the tube's own normal; carried outward
  and renewed from the middle; a tube thins and sinks at the lane; an old cell's tubes part and it falls into two or
  three). Sheet aimed 19:00 in the same form (form at 1 to 1 under the approved, motion strip, four frames). THE BAND
  (point 3): at the surface the low band is the close picture's, at the hold the globe's map, ONE share between as a
  smooth step in the logarithm of the lens's height over the whole rise; measure the largest change of a fixed place
  from frame to frame, aim under 2 levels; the map is not touched. THE FLICKER (point 4): no cell's mean light
  changes by more than a tenth within 12 film frames, measured on the motion strip's group. After the tubes: the
  penumbra's strands end in short tongues, the split, the hump 419 to 429. MAIL 1228: NAMED 5a8c028a taken; jobs
  sd7-01 (G3), sd7-02 to 05 (rise by the standing reader), sd7-06 (units and gate) out on d7. G3 RED on sun_builder's
  e1c18f46 (an earlier state of my ground): frame 90 forward 4196dac2b200c2b2, backward or alone e22fe5d141289031.
- 17:15 UTC: NAMED d7 5a8c028a mailed. Ruler (v/matchto.py, sun_builder's, three numbers) at frame 60: d7 draft
  35.4568 | 11.2729 | 45.8213, d7 final 35.5695 | 11.5344 | 45.8703, e4 draft 35.0582 | 11.2729 | 45.2520; frame 90
  e4 draft 30.8340 | 6.6924 | 41.1804. Builder's: sun_builder's ground 48.1804, main 43.5632 (third number, final).
  Share of ground pixels (rows 600 to 1079) changing by more than 8 levels over 30 film frames on e4: eye held 0.778
  from 60, 0.720 from 150; film eye 0.831, 0.835.
- 17:13 UTC, MISTAKE: a second work tree filled the disk and the chain failed. Never add a work tree again. The e4
  run was started and killed UNREAD at 17:20 to free the renderer for the tubes.
- 17:20 UTC, TUBES (uncommitted until they read): SHAPE_GLSL gained vnq, labTubes (x across the tube, tube number,
  count, turn), labTubeWide, labPart (old cell's 2 or 3 grooves open from rim to middle), labTubeBody (round back,
  bumps riding outward, dimple); the dome's body is multiplied by the tube body in the vertices; fragment: strands
  lie along the tubes, heat by place across the tube, parted groove dark, lane edge scalloped by the tubes.
  t1 (twist 0.5, thin fingers): pinwheels, daisies, too dark. t2 (twist 0.08, finger [0.7, 0.9, 0.3, 0.08], heat
  [0.45, 1.1, 0.35]): lobed pumpkins seen from above, real relief, lying flat, too regular, too dark. t3 (dome.height
  0.5, sway [0.3, 0.9, 1.2]): flowers with a dark eye, every cell parted from its neighbours by a wide dark gap,
  the grooves read as petals. WRONG in all three: grooves too deep at the crown, dimple reads as a flower's eye,
  cells do not fill their ground.
- 17:20 UTC, band law in trial: uLabToneFar.w = smooth step of log(height of the eye over the stage) between
  far.tone.far.heights [1.2, 73.7], multiplied into the band in labTone (override globalThis.labBand).
  Flicker cure in trial: heat.spread[3] 0 and heat.fine [0.2, 4] (labWell's lumps with generations of 3 s were the
  cause, with the life law mix(1.15, 0.7, age)).
- 17:27 UTC, MEASURED (pure.ts and pure.py, new): frame 90 at draft, 1920 by 1080, tubes state of the tree: drawn
  alone, after 60, after 360, after 0 then 60: all four files the same bytes (543ac4c2bfe3871e), 0 pixels differ.
  G3 itself (tools/determinism.ts: review tier, preview format, forward 360, 495, 735, 90; backward; 90 alone)
  started 17:28 on the same tree, log v/det-tubes.log.
- 17:40 to 17:58 UTC, THE MAP KEPT EARLIER FRAMES (MAIL 1238, found by engine_profiler). LabGround.pick drew the
  map of the tile (this.map, depth and mipmaps) with no clear while the engine holds autoClear false. MEASURED at
  preview, review tier (pure.ts, pure.py): d7 5a8c028a frame 90 alone 26495988d11a058a, 60 then 90 d4749e64fbafd470,
  228 pixels differ, most 16 levels. My test at draft and 1920 by 1080 read four equal files and is NOT to be
  trusted: THE PROOF IS AT THE GATE'S SETTINGS (--format preview --tier review). CURE: the map is cleared (colour,
  depth, stencil, to 0 0 0 0) before every draw and the clear colour put back; update() wipes the whole record of a
  slot that is off. Same as sun_builder's cure of 17:47. Proof on the cured tubes tree: alone, 30, 60, 120, 495 then
  90: five equal (png d9f7749704c2e76e, pixels 229e83efad0aa6e2). Pushed as d8 f24e0aa8 = d7's ground and json plus
  the cure (lab.json is d7's again; the tubes trial lives in /home/user/workspace/v/tubes/ until it reads).
  The standing determinism tool (tools/determinism.ts) takes over 13 minutes here; killed unread.
- 17:50 UTC, MAIL 1243: the standing reader on d7: rise parts 1, 3, 4 green, part 2 RED: pattern 0.62 from frame
  221 to 8 film frames later, band 8 px, 17 frames over, first 216 + 1/2 (captures 433 to 449). e1c18f46 (earlier
  ground) was green on all four. My own reader on d7 read 0.18 to 0.22 there and its hump at 419 to 429: both runs
  are on one page, so both saw the map's heap of earlier frames; suspect the same cause. Order: the hashes, this
  row, then the tubes' sheet (slips to about 19:25, said). Standing reader part 2 on d8 started 17:57
  (npx tsx tools/smooth.ts --stop sun --kind rise --only pictures --part 2/4, log v/p2-d8.log, out/work/smooth).
- New tools (17:35): flicker.py (a cell's mean light over captures 12 film frames apart), band.ts and band.py (the
  low band's share by frame and the largest change of a fixed place it makes). Not yet run.
- 18:23 to 18:37 UTC, THE RED ROW OF PART 2 (MAIL 1243). MEASURED: the standing reader's part 2 on d8 here reads the
  same red as the Builder's on d7 (0.62 from frame 221, 17 frames over, first 216 + 1/2): the map's cure does not
  touch it. MISTAKE FOUND: my reader's runs (h14 to d7) were on pictures of 960 by 540 (clip.ts was given --format
  preview in the chain), where the band of 8 to 40 px is another size on the ground; on the standing tool's own
  pictures (out/work/smooth/sun/frames, master) my reader reads 0.625 at capture 442. FROM NOW ON: clip.ts
  --format master for every proof (about 13 s a frame on the globe's side here). The reader cannot be fed a pair
  with filler frames: it carries along the flows of every frame between.
  SEEN by one layer at a time at frame 229 (v/x-crop.jpg): cells held from sinking (far.px [1, 2]) changes nothing;
  the ground held against the globe's face (onGlobe.away [3.0, 3.3]) keeps the living cells of 221. So the layer
  is the globe's face (my far twin: still cells from above, 11 texels a cell) coming over living cells of 12 to 25
  px by place.json onGlobe.away [0.6, 3.3]. d7's cells are 1.6 times h20's (far.cell 0.125 against 0.079), so the
  swap came into the band.
  CURE, d9 f5a268bf: lab.json far.away [2.0, 3.0] is the lab ground's own law (ground.ts update() reads it in
  place of place.onGlobe.away; place.json untouched): the face takes the place where a cell is under about 6 px,
  under the eye over frames about 241 to 256. Frame 247 looks the same with both (v/cmp247.jpg). Clip 425 to 528
  at master started 18:36 (out/work/sun/lab/rise-d9, v/rise-d9.log). The tubes copy in v/tubes has both cures.
  Eye heights hold: frame 247 is 2.6 radii up, the globe about half the frame's height.
- 18:41 UTC, MAIL 1258: the Builder's machines read d9 f5a268bf with the standing reader (sd9-01 to 04, rows come to
  me); my reader at master only is right; the cure by cause is accepted as a trial (he looks at the swap at 241 to
  256 and at a line between living ground and still face on the far side of the ball); THE STILL FACE is an open
  point: where a cell of the face is wider than about 3 px in a frame of the hold or the rise it has to live; the
  tubes' sheet must say at what cell size in pixels the face stands in the whole Sun view (270 to 450).
- 18:59 UTC, MEASURED on d9 at preview, review tier (pure.ts, pure.py): frame 90 alone, 30, 60, 120, 495 then 90:
  five equal, file f1c0cd9a4ad7cfa6, pixels f4cb0e50e25ccde2, 0 pixels differ. Mailed in one line to /root and to
  sun_builder. MISTAKE: the master clip of d9 (started 18:36) was not dead at 18:43 (pkill by SIGTERM does not end
  clip.ts, it starts its browser again): it ran beside the hashes until 18:52. Kill clip.ts with kill -9 on both
  node processes and on the browser's processes, and check with pgrep.
- 19:00 to 19:10 UTC, TUBES t4 to t9 (in the tree, uncommitted until the sheet). t4 (grooves only on the flank, no
  dimple, lumps): leaves with a star in the middle on a wide dark floor. t5 (threads only on the flank by
  tubes.silk, lane and shade halved, dome.over 1.6): flat pads, hard rims, gaps as before.
  CAUSE OF THE GAPS FOUND (stood since d7, "pads float apart on a dark floor"): every dome reached over its border
  (dome.over) with a height of 0.77 of its own at the border, so a tall cell's skirt lay over a lower neighbour's
  ground, and the skirt is drawn with the lane's heat (the place is past the cell's own border): the wide dark
  gaps were skirts. CURE, dome.base [height, share of a field, scale of the field, more where two cells join,
  two exponents of the cushion, fall of the skirt]: every body stands on the height of the place at its own border
  (a field of the place, the same for both sides) and rises from there to its own crown as a cushion of the way to
  the border, the tubes' relief on the part over that height. Two neighbours meet on their border, no body lies
  over another's ground, the lane is the crease on the border. t6: packed cells, thin lanes. t7 (rounder dome
  1.8, 1.2; heat swells from lane to crown: heat.patch [0, 1], core 0.8, rim 0.35; tubes depth 0.5, crown 0.2, from
  [0.2, 0.6]; dome.height 0.5): packed domes of ribs, read as gourds. t8 (count [6, 10], sway [0.5, 1.2, 1.2], lump
  [0.6, 1.6, 3], tube heat [0.4, 1.2, 0.45]): broad uneven lobes, nearer the approved's bulbs. t9: fibre.counts
  [2, 5, 9] (the finest thread 6.6 px on a near cell), little change. u1 = t9 with the curve refit (frame 90 near
  percentiles before: 0.227 0.443 0.616 0.765 0.882 0.918). Sheet chain started 19:09 (v/sheet.sh u1).
  STILL WRONG, seen: matte, no silk on the flanks, crowns not hot enough against the flanks, lanes lack the dark
  pits where three cells meet, cells read as gourds or shells more than as melt.
- 19:26 UTC, THE TUBES' FIRST SHEET mailed (u1, commit c1b54b2b, not named). MEASURED on u1: frame 90 near
  percentiles 0.231 0.412 0.584 0.761 0.910 0.961; ruler at 60 draft 35.4393 | 11.2726 | 45.7965; flicker
  (flicker.py, box 100 790 460 290, disc 26 px) largest 0.158, median 0.080, 3 of 8 over a tenth; with a disc of
  45 px largest 0.071, of 60 px 0.091, none over a tenth: the 0.158 is the swells riding through a small disc,
  not the cell's mean. Band (band.ts, band.py, frames 221 to 222): share steps 0.0316 a frame, largest change of a
  fixed place 5.84 levels, 99th percentile of places 3.35; the band's swing at a place is up to 183 levels (99th
  percentile 88), so 2 levels cannot be met at the top places by any law over 90 frames (a straight line in time
  gives 2.0). Asked the Builder to rule.
  THE FACE (MAIL 1258 point 3), MEASURED on my branch at 250, 262, 360 (1920 by 1080): from about 256 nothing of
  my ground is drawn (far.away 2.0 to 3.0 radii; at 269 the eye is 3.57 radii up); the face is the globe's own
  map (the painting), strongest period 23 px, smallest bright blobs 3 to 8 px, globe radius 450 px. CORRECTION:
  nothing on my branch loads my baked level (place.json plates.levels is empty); what came over the living cells
  at 221 to 229 on d7 and d8 was the standing globe's own place (the standing ground's plates on the ball), not my
  far twin. If sun_builder's globe shows my baked level at the hold, a cell of it (0.07 to 0.2 units) is 1.5 to
  4.4 px at the disc's middle (by geometry, unmeasured). The baked level is d7's, not rebaked.
  MESH (stated): near cells (over 70 px) 96 sectors, 10 to 16 a tube; a tube of 15 px belongs to a cell of 29 to
  48 px, second level, 40 sectors, 4 to 7 facets a tube, relief faded there by tubes.px [20, 48].
- 19:27 to 19:40 UTC, u2 to u5 (in the tree). u2: fibre.along [0.5, 0.8, 1.2] (the threads were short dashes
  because their pattern changed 2.5 to 6 times along the run: now strands from crown to lane), tubes.silk
  [0.15, 0.6], pits where three cells meet (dome.base[7], [8]: the border's height falls by 0.8 where the cell's
  corner measure is over 0.6), heat.fold [0.5, 0.7], heat.core 1.2, rim 0.3: silk on the flanks, hot crowns, reads
  as glossy umbrellas. u3: heat.wide 1.8, stray 0.8 (hot patches off the middle): uneven, nearer the approved.
  u4 = u3 with the curve refit. u5: silk [0.3, 0.75], tubes.from [0.3, 0.7], crown 0.1, dome.height 0.42, cushion
  exponents 2.0, 1.4: broad flatter cushions with smooth mottled tops and streaked flanks: BEST SO FAR
  (v/strip-u5.jpg). Frame 90 near percentiles u5: 0.227 0.376 0.569 0.749 0.894 0.953 (curve of u4).
