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
