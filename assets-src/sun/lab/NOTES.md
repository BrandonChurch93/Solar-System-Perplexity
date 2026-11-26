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
- 19:27 to 19:31 UTC, u2 to u5 (in the tree). u2: fibre.along [0.5, 0.8, 1.2] (the threads were short dashes
  because their pattern changed 2.5 to 6 times along the run: now strands from crown to lane), tubes.silk
  [0.15, 0.6], pits where three cells meet (dome.base[7], [8]: the border's height falls by 0.8 where the cell's
  corner measure is over 0.6), heat.fold [0.5, 0.7], heat.core 1.2, rim 0.3: silk on the flanks, hot crowns, reads
  as glossy umbrellas. u3: heat.wide 1.8, stray 0.8 (hot patches off the middle): uneven, nearer the approved.
  u4 = u3 with the curve refit. u5: silk [0.3, 0.75], tubes.from [0.3, 0.7], crown 0.1, dome.height 0.42, cushion
  exponents 2.0, 1.4: broad flatter cushions with smooth mottled tops and streaked flanks: BEST SO FAR
  (v/strip-u5.jpg). Frame 90 near percentiles u5: 0.227 0.376 0.569 0.749 0.894 0.953 (curve of u4).
- 19:32 to 19:40 UTC, u6, u7 (in the tree). SEEN in motion-u5 (v/wedge.png): a dark flat patch with a saw toothed
  rim at the frame's bottom (captures 252, 276; x 250 to 550, y 980 to 1080): a low cell beside tall cushions whose
  near vertical rim the mesh rings sampled unevenly. CURE (u6): under the cushion the mesh's rings follow the
  border (`r = rad * pow(invP, -0.125)` before `place` in dome()), least bulge of a cell 0.4 of its base
  (dome.base[9]), junction pits off (dome.base[7] 0: the corner measure differs on the two sides of a border and
  made a wall), dome.over 1.2. v/wedge6.png: the flat patch is gone, a small saw tooth is left on some rims.
  u7: heat.crease[2] 0.35 to 0.27, heat.lane [0.07, 0.1, 0.6] (darker, wider lanes). Flicker u6/u7 motion strip:
  disc 26 px largest 0.155, 45 px 0.093, 60 px 0.099. Frame 90 near percentiles u7: 0.208 0.353 0.565 0.745 0.894
  0.953 (curve of u4, refit due).
  SEEN against the approved (v/strip-u7.jpg): mine read as flat cushions or leaves with a lit top and a dark flank
  and a hard outline against the next cell; the approved's are round bulbs lit up to their rim, with a thin dark
  lane and a thin bright rim, dark patches inside, strands that gather at the pits where three meet. The cells of
  the approved are near round in the picture (1.2 to 1), mine 2 to 1: at this lens that means bulbs near as high
  as wide. Trying u8 (height 0.7, cushion 2.0, 2.0) and u9 (height 0.6, cushion 2.5, 1.6, shade 0.8).
- 19:40 UTC, MAIL 1267 (Builder): d9 as read by his machines: rise part 1 and 4 green, part 2 RED (pattern 0.5191
  at 217 + 1/2, at the limb over the spot), part 3 red (pop 1.32 at 240 + 1/2 to 242, pattern 0.61: the whole disc
  changes where my ground fades to the globe's painting, far.away 2.0 to 3.0 radii). d9 does not go on. RULED:
  (a) what takes over from the live cells is the bake of the same cells at the same places, baked again for the
  named state, laid on the globe by the turned anchor's numbers (the globe's folder is sun_builder's: I hand it the
  bake and the numbers); (b) the swing at a place between live and bake measured first and alone at 221 and 229,
  aim 99th percentile under 12 levels; (c) only then the law of the share and the 2 levels a frame. ORDER: form
  first (silk as long strands crown to lane, crowns hotter than flanks, dark pits where three meet, bright threads
  where two touch, cells flatter with mottled tops), then flicker by cause, then bake and band, then hashes and
  the master run. Measure the cost of 80 sectors at the second level. Flicker: measure also on each cell's own
  mean (a disc of the cell's size), the tenth stands for that. Send back: the next sheet with the same pictures
  and the swing of (b). Brandon on u1: it still looks like an image, not like plasma.
- 19:41 to 19:46 UTC. u8 (height 0.7, cushion 2, 2): round mushrooms, a pile of stones, dropped. u9 (0.6, 2.5,
  1.6, shade 0.8): round cushions, still gourds. u10: height 0.5, cushion 2.2, 1.5, heat.shade [0.8, 0.45],
  tubes.silk [0.1, 0.5], heat.rim 0.45, heat.core 0.9. u11 = u10 with heat.cool 1.1, fibre.cold 0.08, heat.thread
  [0.3, 1.0]: streaked and of high contrast inside the cell as the approved, reads as satin shells or umbrellas
  because every strand runs straight from the crown. u12: the tubes and strands fan from the cell's hot patch and
  not from its middle (labFan in ground.ts, tubes.off 0.8): lopsided fans, the umbrella is gone, BEST SO FAR
  (v/strip-u12.jpg). Percentiles u12 0.224 0.384 0.600 0.780 0.933 0.980, curve refit due.
  STILL WRONG: no even dark lane round every cell (near cells stand over the lanes behind them), the strands are
  too clean and parallel (satin), few dark patches inside the cells, no sparkle.
- 19:46 to 19:51 UTC. u13: pits where three cells meet by the way to the point where the cell's two nearest borders
  cross (the same point for all three cells, so one pit; dome.base[7] depth 0.7, [8] radius 0.025 units; heat.pit
  0.5 darkens it; varying vJunc): slight, no wall. u14: heat.patch [0.25, 0.7], heat.wide 1.3, heat.rim 0.35:
  defined hot blotches on darker bodies, nearer the approved's contrast inside a cell. Curve refit for u14:
  percentiles 0.208 0.353 0.576 0.757 0.906 0.961 (low end still under the approved's 0.231 0.404).
  flicker.py takes an ellipse now (half width, half height). MEASURED on mo-u6, box 0 760 1920 320: disc 26 px
  largest 0.389 (57 percent of 61 over a tenth); ellipse 90 by 45 (a near cell's own outline) largest 0.120, 1 of
  17 over a tenth; ellipse 70 by 35 largest 0.155. CAUSE (stated, by the law): heat's life factor mix(1.15, 0.7,
  smoothstep(0.3, 0.85, age)) alone moves a cell of 2.5 s life by up to 0.2 in 12 frames. To cure by the law of
  the life, not by slowing cells.
- 19:53 UTC, sun_builder asks about the bake (his globe lays the first patch level about HIS mapSpot, fine bands
  under 0.55 degrees only, turning with the map). Answered 19:54 (the mail says 19:58, my clock guess; read date -u first): files, 40 degrees gnomonic, what is baked in;
  the file on the branch is d7's at clock 0, not to be laid; my axes are globe.spot's numbers used in the MAP's
  frame (0.047 degrees off his mapSpot): the NEW BAKE TAKES place.json globe.mapSpot, E = Y x N, U = N x E, and
  the cells of one film frame of the handover (bake() must use the frame's time, not this.start). Proposal: fine
  bands only, my low band the map's by the time the ground leaves. Asked: does the stage's ground turn with the
  map over 221 to 256.
  TOOLS: swing.ts (frames twice: as it stands and with globalThis.labGone, the live ground away) and swing.py.
  For the swing on my branch: place.json plates.levels = [{file: "lab/place-far-0.jpg", widthDeg: 40}].
- 19:54 to 20:00 UTC. SEEN at the whole frame (v/four-u14.jpg): u14 reads as a heap of shiny nuggets, each a hot
  blotch on a dark body with wide dark gaps; the approved is one sheet of cells lit up to their rims with thin
  dark lanes. The 1 to 1 strip alone misled me: judge at the whole frame too (v/duo.sh NAME: frame 90 over the
  approved, lower 60 percent). The sheet chain of u14 was killed unread.
  u15: heat.wide 2.4, core 0.4, patch [0.0, 0.8], rim 0.5, shade [0.9, 0.3], dome.height 0.36, cushion 3.0, 1.5,
  pit depth 0.4: lit cells, packed. u16: lanes dark from the border (heat.lane [0.12, 0.12, 0.6, 0.35]: the 4th
  is the share of the lane's width that stays dark), heat.crease[2] 0.15, curve refit: golden with dark red brown
  lanes, at the whole frame near the approved (v/duo-u16.jpg). u17 (thread [0.3, 0.7], tubes.heat [0.6, 1.15],
  silk [0.25, 0.7]): flat lily pads, dropped. u18: thread [0.3, 0.85], tubes.heat [0.5, 1.2, 0.45], silk [0.2,
  0.65], height 0.42, cushion 2.4, 1.5, and the flicker's causes by law: heat.life [1.05, 0.9, 0.0, 1.0] (was
  1.15 to 0.7 over ages 0.3 to 0.85), heat.born [0.85, 0.0, 1.0] (was 0.4 over 0.3 to 0.9 of the growth),
  tubes.lump [0.4, 1.6, 4] (was 0.6, 3 round). u19 = u18 with the curve refit (u18 percentiles 0.239 0.459 0.635
  0.784 0.894 0.945). Sheet chain of u19 started 20:00 (v/sheet.sh u19, log v/sheet-u19.log).
  STILL WRONG (u18, seen): no thin bright rim where two cells touch, no sparkle, the strands are evenly fluted
  (satin), dark gaps with debris where small low cells sit between large ones, the middle distance is beads, the
  penumbra's threads are light where the approved's are dark.
- 20:06 to 20:20 UTC. sun_builder MEASURED (his 20:06): the stage's ground and the map do not part over 90 to 269
  (0.00000 degrees); his first level is whole everywhere in frame at 225 to 233, at the anchor until 245 (1.436
  radii from the eye to the anchor), gone at 256; eye to anchor in ball radii: 199 0.158, 221 0.395, 225 0.485,
  229 0.600, 233 0.745, 237 0.926, 241 1.152, 245 1.436, 248 1.693, 252 2.110, 256 2.624. My old frames for
  far.away [2.0, 3.0] (241 to 256) were wrong: that was 251 and later, the live ground left AFTER his level (d9's
  red rows). NEW LAW: far.away [0.6, 0.93] (anchor: leaves 229 to 237); bake at film frame 233 (far.level.frame),
  axes N = globe.mapSpot, E = Y x N, U = N x E (in lab.json). ground.ts: `now` is the frame's time under labBake
  too. Told him 20:08. Sheet chain of u19 killed at the final frame (the state changed).
  THE SCALY PATCH (frame 90, x 283 to 323, y 927 to 943): found by debug outputs of the fragment's terms (one
  cell only, so no two surfaces; not the law, not the height; in the heat before the tubes): it was the BEADS
  (fibre.beads 0.45, value noise of 31 round by 9 along the run, times the strands: a lattice of diamonds near
  the fan's centre). Not it: the strands' filter (now 0.17 to 0.33 strands a px, kept), spark (removed, kept
  out), tube relief finer than the mesh (now faded by the tube's width over the mesh's spacing, uLabMesh, kept),
  heat.fine. u24: fibre.beads [0.0, 9]: the patch is gone (v/glitch-u24.png).
  How to debug a term: add `outColor = vec4(a, b, c, 1.0);` after labOut in DOME_FRAG's main, render, crop.
- 20:20 to 20:50 UTC. 80 sectors at the second level: draft frame 90 38.7 s against 35.4 s; taken (lod.sectors
  [96, 80, 16]). Bake of film frame 233 about mapSpot: 1,821,925 and 519,257 bytes.
  THE SWING, first run (whole patch on my globe): 221 live to bake 99th percentile 177 levels. FOUND by
  correlation of windows (v/reg.py): the bake lay 21 to 33 px off the live cells at 221. Cause: my branch had the
  turned anchor's numbers in place.json but not plan.ts params.spot (sun_builder's 1d0faacf: 0.569554, 0.396149;
  the place moved 0.72 degrees over the map). With his spot: within 3 px. Edits outside my folders now: set.ts
  (switch, fineDeg passed on), place.json (anchor numbers, plates.levels with fineDeg), plan.ts (spot), globe.ts
  (his file of e1c18f46 whole: fine bands).
  swing.ts now draws three: live whole (labStay), live whole in its far form (labFlat), live gone (labGone).
  MEASURED (u24, fine bands, 99th percentile / median, levels): 221 live to bake 225 / 72, far form to bake
  211 / 61, live to far form 154 / 36; 229: 210 / 68, 200 / 62, 139 / 18; 233: 194 / 64, 192 / 62, 59 / 4. Means
  at 233: live 149, globe's face 194: the map's low band is far lighter and of far more contrast than my ground's
  tone at the share of that height (0.49 at 221). So the swing is (1) the tone, (2) domes against far form,
  (3) far form against bake (unknown until the tone is equal).
  PLAN: the ONE share on both sides (the globe gives the level's low band the same share: level times mix(1,
  mapLow / levelLow, share)), the bake with the share at 0; the live ground wholly in its far form before it
  leaves (far.px against far.away); then far form against bake read alone.
  SEEN at the strip (v/strip-u24.jpg): mine are shiny shells with broad sheen and wide dark gaps; the approved's
  cells have darker mottled tops, light at the rims where two cells touch with a thin dark line between, fine
  sparkle, one sheet. Next for the form: tubes' relief and heat contrast down (less satin), mottle on the top that
  rides with the flow (labWell), light rims, lanes thinner.
- MAIL 1296 from /root, 20:56 UTC (read 21:00). RULED: (1) tone: my way, both sides carry the same share, the bake
  with the share at 0, the globe gives the level's low band the same share; prove on my branch, hand sun_builder
  the lines. (2) the live ground wholly in its far form before it leaves, then far form against bake alone.
  (3) THE NEAR FIELD AT 0, 60, 90 COMES FIRST, the swing second. Brandon: "still looks unbelievable like it's an
  image doesn't look like it's really plasma".
  What the Builder sees: (a) my cells are LIT (a highlight on one side, a sheen over the folds, a metal shell under
  a lamp). Every part of the brightness that depends on a light's or the eye's direction other than the limb law
  has to go or be so small that no cell shows a lit and a shaded side. SAY which terms depend on a direction and
  what share of the brightness they carry at frame 90. (b) brightness across a cell runs the wrong way: the
  approved's cell is darker and mottled on top, lightest in a rim where it meets its neighbour, then a thin dark
  line. MEASURE: mean brightness against the distance from a cell's middle to its edge, 0 to 1, over at least 30
  cells of the near field, approved and mine, and the lane's width in px. Aim: inside 0.05 of the approved's at
  every tenth, lanes within 1.5 px. (c) sizes: many small cells between the large; count cells in one window on
  both, give the share under half the median size. (d) fine sparkle (points of 1 to 3 px, lighter than the rim):
  heat seen through the lanes' edges and on the tops' mottle, rides with the flow, does not twinkle faster than
  the cells live.
  LIMITS: frame 90 against the approved by d296 (mean absolute RGB, no worse than main's); the reader's rows for
  the rise no worse than main's on any line (d311); flicker of point 6 no worse than now. Cost of a frame no limit.
  SEND when b and c are measured: the two curves, the counts, frame 90 draft and final, the strip at 1 to 1, and
  what a, b, c, d each cost in the d296 number. No name before that. Say plainly if a point cannot be reached.
- 21:00 to 21:20 UTC. TOOLS: cells.py (the cells of a picture read from the picture alone, same way on the approved
  and on a render: lanes = dark lines by the Hessian of brightness over its 25 px mean at 3 and 5 px, over 0.3
  grown to 0.15, pieces under 120 px dropped; a cell = the ground that climbs to one top of the distance from
  the lanes, tops joined where the neck is wider than 0.75 of the smaller; box 100 800 1720 280 of 1920 by 1080;
  brightness = largest channel). It gives: count, sizes, the curve middle to border at every tenth, the spread
  inside a ring, the share of cells lightest in their outer half, side to side slope of a cell and whether all
  cells lean one way, lane width at half depth and depth, the mean lane profile. match.py: mean absolute RGB of
  a frame 90 against the approved in levels of 255 (my reading of d296; whole frame, and rows from 0.72).
  watershed_ift of scipy gave square floods (ties), so the flood is my own steepest climb.
  MEASURED (draft tier, frame 90):
    approved: 129 cells in the box (244 a box wholly counted), median width 34.7 px, 10/50/90 18.2/34.7/76.8,
      share under half the median 0.085; curve 0.667 0.662 0.657 0.647 0.619 0.586 0.547 0.496 0.433 0.369
      0.324; spread 0.146 at the half; lightest in the outer half 14 percent of cells; side to side 0.323, one
      direction 0.10; lane 7.08 px wide, 0.234 deep.
    standing ground (main's, on my branch): 119 cells (186), median 35.6; curve 0.59 0.591 0.582 0.568 0.55
      0.523 0.488 0.439 0.382 0.318 0.276; side 0.387, one direction 0.25; lane 6.47, 0.225. match 30.286 / 53.294.
    u24: 61 cells (127), median 50.7, under half 0.148; curve 0.713 0.704 0.692 0.672 0.654 0.626 0.587 0.533
      0.473 0.383 0.311 (largest gap to the approved 0.046); side 0.281, one direction 0.40 (lighter toward the
      top of the screen); lane 6.13, 0.296. match 30.467 / 51.282. h14: match 31.27 / 52.894.
    So the mean curve and the lane width were inside the Builder's aims already; what differs is the count (half
    as many cells), the common lean, and the texture (mine smooth sheen and long ribs, approved mottle).
    The approved's cells are NOT lightest at a rim on the mean: flat from the middle to 0.3, then falling.
  (a) THE TERMS THAT DEPEND ON A DIRECTION: one only, the eye law on the dome's own normal (heat.graze 0.6 to 1).
    heat.graze[2] = its share; at 0 the law is the limb law alone (the ball's normal). Its cost at frame 90: mean
    absolute change of the box 0.011 of a mean 0.561 (2 percent), 99th percentile 0.055. With it gone (a1) the
    common lean is 0.52, not less: the lean comes from the relief (the hot crown stands high and is seen shifted
    up the screen by about a quarter of the cell's radius at a look 54 to 67 degrees down), not from a lamp.
    match a1 30.384 / 51.061.
  (c) sim.radius [0.025, 0.075], slots 2056 (was [0.035, 0.1], 1123): 118 cells (238), median 39.7, 10/50/90
    22.8/39.7/71.3, under half 0.085. Draft frame 67 s (was 38). match c1 29.884 / 49.65. THE BAKE IS STALE
    from here until it is baked again (the cells are other cells).
  (b) first trial b1: mottle that rides with the cell (heat.spread[3] 1, scale 4), cool 1.8, patch [0.3, 0.7],
    rim 0.3, wide 3.2, tubes.heat [0.8, 1.08], lump 0.2, thread [0.2, 0.6], tubes.depth 0.3: 135 cells, curve
    0.707 0.701 0.687 0.673 0.647 0.608 0.567 0.506 0.43 0.35 0.301, side 0.327, one direction 0.32, lane 5.75,
    0.313; match 30.043 / 50.043. SEEN: dark blobs on the tops, reads as marbled stone; outlines still crisp.
- 21:10 to 21:25 UTC. THE FORM BY THE NUMBERS (frame 90 draft, cells.py, match.py; committed lab.json of u24 plus):
  SEEN at 3 times (v/x3-b1.jpg): my cells were plates with crisp rims lying apart on a dark floor (heat.lane with a
  flat dark bottom of 0.35 of its width, 0.12 to 0.24 of a radius wide on each side); the approved's cells touch,
  with thin soft dark creases, black pits where three meet, dark olive tops, bright streaky patches on the
  flanks, soft points of light along the lanes, everything soft.
  b2: ground.ts: x = heat.blot times rise + ring + ...; ring = heat.ring[0] times smoothstep(ring[1], ring[2],
    plan) times broad lobes round the cell (ring[3] of them, by the tubes' turn, fixed for the cell's life): the
    flanks hotter than the top. heat.ring [0.7, 0.3, 0.75, 3], heat.blot 0.5, heat.lane [0.05, 0.05, 0.6, 0],
    crease[2] 0.3. Cells touch; match 29.301 / 47.445 (flat, low contrast: P95 0.831).
  b3: labSparks (ground.ts): small hot points in the cell's own frame (place from the middle in stage units, grid
    heat.spark[1], share [2] of the grid's cells lit), two generations of [3] seconds each fading in and out, carried
    outward by a zoom of exp([4]), 1.2 to 2.8 px wide by the screen derivative, gone where a pixel is over 0.3 of
    the grid; weight [5] on the top rising to 1 on the flank. heat.glint 0 (the old points were fixed to the place).
  b4: curve refit (percentiles 0.235 0.384 0.545 0.745 0.902 0.957), lane [0.1, 0.1], crease[2] 0.22: match
    31.136 / 52.266; camouflage blobs, glazed look.
  b5: patch [0, 1], rim 0.45, cool 1.5, spread[2] 6, thread [0.3, 0.8], fine [0.6, 2.0]: worn stone, too even.
  b6: patch [0.2, 0.8], rim 0.3, cool 1.0, thread [0.8, 0.8] (the strands carry the patches: streaks from the
    rim inward): the nearest to the approved's character so far. match 30.97 / 51.864.
  b7: sparks 1.2 to 2.8 px, spark [1.2, 0.012, 0.3, 6, 1, 0.12], crease[2] 0.3, lane [0.12, 0.1, 0.6, 0].
    MEASURED b7: 118 cells in the box (282 a box wholly counted; approved 129, 244), median 33.4 px (34.7),
    10/50/90 19.0/33.4/68.6 (18.2/34.7/76.8), under half the median 0.042 (0.085); curve 0.682 0.677 0.678 0.668
    0.649 0.62 0.582 0.527 0.456 0.389 0.346 against 0.667 0.662 0.657 0.647 0.619 0.586 0.547 0.496 0.433 0.369
    0.324: largest gap 0.035 (at 0.6); lightest in the outer half 10.7 percent (14.4); side to side 0.29 (0.32);
    one direction 0.08 (0.10); lane 5.97 px (7.08), depth 0.306 (0.234). Percentiles 0.239 0.384 0.557 0.733
    0.902 0.976. match 31.093 / 52.25 (standing 30.286 / 53.294).
  THE MATCH NUMBER AND WHAT IT CAN SAY: the approved's near ground against itself moved 40 px reads 50.58, moved
    160 px 51.59, against its own flat mean colour 39.04. So a perfect twin with its cells at other places reads
    about 51 on the near ground, a flat colour 39: the number falls with contrast, not with likeness. Costs:
    (a) -0.083 whole frame (30.467 to 30.384), (c) -0.50 (to 29.884), (b) +1.09 (to 30.97 at b6; of it the
    refit of the curve to the approved's percentiles +0.8), (d) +0.12 (to 31.093).
  SEEN b7 whole frame (v/duo-b7.jpg): packed, mottled, streaky, sparkling; the nearest to the approved so far.
    Still wrong: browner and darker in hue than the approved (its lights are more yellow at the same largest
    channel: the ramp is the standing ground's), the lanes are no clear dark web (borders read by shading), the
    cells are lumps rather than flat pillows, sparks are white pin points and not soft, every edge is crisp
    (the approved's near field is soft), no black pits with spikes, the penumbra is long light hair.
  Chain b7 started 21:22 (frames 0, 60, motion and flicker, final frame 90, four).
  Chain b7 ended 21:32. Flicker b7 (u24): disc 26 px in box 100 790 460 290 largest 0.211 (0.192), 37.5 percent
    of cells over a tenth (40); whole band disc 26 largest 0.255 (0.330), 34.2 percent (53); ellipse 90 by 45
    largest 0.080 (0.087), none over; ellipse 70 by 35 largest 0.119 (0.253), 4 percent (15). Final tier frame 90
    (lab-90-b7f.png, 372.5 s, 16 samples): percentiles 0.243 0.392 0.565 0.741 0.91 0.992, match 31.496 / 52.591.
  21:33 the push of looks and the dry run of a push of code both fail: github answers 401 (no user name); reading
    still works. Nothing changed on my side (no credential helper is set in git; the push of 21:10 went through).
    Commits are kept locally until it works again; pictures go by mail.
- 21:34 UTC both pushes went through (the 401 was passing). b7 = c0c5dac2 pushed; looks pushed.
- 21:45 UTC MAIL to /root (answer to 1296, not a name) with b7's numbers, costs, flicker, ten pictures.
  FINDINGS after the chain, all at frame 90 draft:
  match.py now prints four bands of rows (0 to 0.3, to 0.5, to 0.72, to 1): standing 6.693 14.205 47.78 53.294;
    u24 6.693 22.199 43.895 51.282; b7 6.693 22.27 45.446 52.25. The whole loss against the standing ground is
    rows 460 to 560: (1) my far field is a pale fog (haze.amount 0.002, power 3 over the limb law's darkening
    0.6) where the approved shows gold cells with dark lanes to the limb, (2) the shot's horizon stands 25 to 30
    px above the approved's (standing too; the camera, not mine). v/limb-b7.jpg, v/band-b7.jpg.
  f1 haze.power 2: far field dark red brown, 33.468. f2 graze [0.85, 1, 0], haze.amount 0.0006: 33.996.
  f3 graze [1.3, 1, 0] (a mild brightening toward the limb, still the limb law alone), haze.amount 0.0003: gold
    cells to the limb as the approved; near field brighter by a tenth. f4 = f3 with the curve refit: 33.737 /
    55.186 bands 6.693 21.694 54.263 55.186. The number rewards fog; ruling asked in the mail.
    cells.py on f4: curve 0.672 0.673 0.671 0.66 0.646 0.624 0.588 0.536 0.462 0.383 0.331, sizes 10/50/90
    20.3/34.6/73.4, one direction 0.14, lane 5.35 px depth 0.337.
  A hard white line at the limb stays in f4; the standing ground on my branch does not show it; cause not found.
  SEEN at 1 to 1 (v/strip-f4.jpg, v/duo-f4.jpg): b7 and f4 are glazed bronze PEBBLES (lumps with crisp outlines
    and dark blotches). The approved is soft cushions that touch: a dark navel off the middle, fine light fibres
    (2 to 4 px) fanning from the navel to the border, lightest in a ring at half to three quarters of the way,
    then a thin dark seam; large cushions 100 to 150 px with small ones of 30 to 50 between. cells.py cuts the
    approved's cushions at their inner folds, so its median (34.7 px) is of pieces: shrinking my cells to it (c1)
    was a mistake by the number. NEXT: wider spread of sizes with larger cells, low relief, no lumps, no blotches,
    navel and fibres, light ring, thin dark seam, soft orange sparks at the seams.
- MAIL 1311 from /root, 21:56 UTC (answer to my mail of 21:45), core verbatim:
  "1. THE RULING you asked for (d329 (5)). ... at frame 90: the plain match holds on the part of the frame that is
  NOT ground (sky and the limb's line), no worse than main's own there. On the ground it is replaced by three
  lines: (i) the low band, both pictures blurred with a Gaussian of sigma 64 px, mean absolute RGB over the whole
  frame, no worse than main's own; (ii) luminance bands, differences of blurs at sigma 1, 2, 4, 8, 16, 32 and 64
  px, root mean square over the ground, the ratio to the approved's within 0.7 and 1.4 in the six bands from 1 to
  2 up to 32 to 64 px; (iii) my eye at 1 to 1 for the form. Take the far field of trial f4: cells to the limb, as
  the approved shows them. The horizon standing 25 to 30 px above the approved's is the camera's and is not yours
  to close; leave rows that lie on the approved's sky out of the ground mask and say which rows.
  2. MY EYE on the strip, and I agree with your verdict. b7 is further from the approved than u24, in size and in
  gloss. What reads as glaze in both: narrow hard highlights on a dark body. The approved's light is broad: most
  of a cushion is light, its curve is flat to 0.3 and falls from there, and the texture is carried by fine fibres
  of 2 to 4 px that fan from the navel, not by blotches. Its highlights have no hard edge. Its lanes are not
  black: dark red brown, about 7 px, with a soft orange glow in places. It grows softer with distance. u24's
  shells had the size and the sheet; they lacked the fibres, the navel off the middle, the low relief and the
  soft light. Go back to u24's sizes with the wider spread you name (large cushions of 100 to 150 px with small
  ones of 30 to 50 between), relief lower than u24's, then fibres, navel, ring and seam; the sparks soft and
  orange along the seams or not at all.
  3. YOUR READER. Do not shrink cells to match a count that splits the approved's cushions at their folds. Mend
  the reader first (join pieces across a fold that is lighter than a lane and narrower than 3 px), or drop the
  count as a line and keep the eye. Say which.
  4. Costs: 67 s a draft frame is no limit. The handover comes after the near field, as ruled in 1296.
  5. THE TOOL is attached: bands.py --top 64 FRAME APPROVED [MASK], pictures at 1920 by 1080, the mask a white on
  black png of the ground. MEASURED by it on a machine's final of main's code at 90, whole frame without a mask:
  plain 29.5582, low band at 64 px 10.9492, bands from 1 to 2 up to 32 to 64 px 0.94, 0.89, 0.93, 0.95, 0.89,
  0.93. Send me your ground mask and I measure main's numbers and yours with it.
  MAIN MOVED at 21:41: the fourth cut is on main (merge 6bdd87ec, tip 172e7bcd). Merge origin main before you
  name. Give me the date of the next state."
  The tool is kept as v/bands.py (the Builder's, not committed). Owed: the ground mask, the reader's mend or the
  count dropped, the date of the next state.
- sun_builder 21:47 (low): the smooth bright band at the limb and the flat glow over it are my haze and my air
  (tau = amount / max(mu, 0.02)^power is 250 at the limb); his trial power 1.5 and air[1] 0.5 gives a thin gold
  line with cells to the limb. He names the band as mine.
- 21:50 to 22:08 UTC. CUSHION TRIALS (frame 90 draft; each refit with v/fit.sh; pictures v/strip-NAME.jpg):
  ground.ts: heat.cushion (when set, with tubes on) replaces the heat of the top: tone times navel (cooler within
    navel[1] of the fan's root) times a profile on the way to the border (prof: ring lift, from, to, fall, from,
    power) times fibres (fibre: fan amplitude, from, to, thread amplitude; never under 0.25) times broad swells
    (patch: amplitude, scale). The seam, folds, tubes and pits follow as before.
  sim.radius [0.022, 0.09], slots 1675 (law: slots = 4.03 / mean of r squared with r = r0 + (r1 - r0) k^2).
  haze.power 2, haze.amount 0.0003, haze.air [0.04, 0.4, 0.45], graze [1.3, 1, 0] (far field of f4).
  g1 dome parabola (base[4] 2, [5] 1), height 0.3, lanes thin: touching cells, hairline black cracks, polished.
  g2 strong fan and thread, soft lanes: crumpled leather, a black hole where the product went under 0.
  g3, g4 dark mottled top and hot fibred flanks on a round dome (height 0.45): the right layout by my look at
    the approved at 3 times (v/appr-x3.jpg: the near flank of a cushion is light and streaky, its top medium and
    mottled, the far flank hidden), but glazed pebbles: narrow hard highlights on a dark body.
  h1 to h3 after MAIL 1311 (light top, navel, ring, fibres; height 0.28, parabola; fibre.counts [3, 7, 14]):
    satin shells, each cell still with broad dark parts; not there.
  v/levels-h3.jpg (both pictures cut at the approved's percentiles): the approved's darks are broad soft blobs
    of 10 to 30 px (lanes with their pits, and patches on the tops), its lights irregular soft blobs of 20 to 40
    px; mine is clean plates with thin dark outlines and straight streaks. The approved has no crisp edge at all;
    bands.py reads my finest band (under 1 px) at 1.7 to 2.2 times the approved's.
  mask.py: the ground mask for the Builder's bands.py (approved's limb by eye at nine columns, cubic, 10 px
    below). v/bd.sh NAME: bands.py with the mask. MEASURED (plain, low band 64, outside the mask, inside, ratios
    under 1, 1 to 2, ... 32 to 64):
    standing 29.8003 10.01 10.2255 51.0286 [0.81 0.81 0.85 0.92 0.99 1.04 1.03]
    u24 29.9412 9.1214 15.5578 45.5396 [1.19 0.81 0.75 0.81 0.91 0.96 1.04]
    b7 30.5724 9.3446 15.6437 46.7621 [1.82 1.17 0.94 0.84 0.80 0.77 1.00]
    f4 33.2634 8.7372 14.8345 53.249 [2.20 1.36 1.08 0.96 0.91 0.86 0.90]
    h2 31.4203 8.0387 12.4283 52.0166 [1.69 1.13 1.00 0.98 1.01 0.96 0.85]
    Outside the mask my frames are worse than the standing ground: the strip between my limb and the approved's
    is ground in my frame (gold, as ruled) and sky in the approved, and my air glows above the limb.
- MAIL 1318 from /root, 22:12 UTC (d330 (4)): 1. the frame has three parts: ground (my mask), sky above the film's
  own limb, the strip between the film's limb and the approved's. Plain match outside the mask is read on the sky
  part alone; the strip is stated as its own number, no line. "Put the three part mask in mask.py and send it with
  the next state (one png, three levels)". 2. the gas above the limb comes down until the sky part reads not worse
  than the standing ground's. 3. finest band: "bring the band under 1 px and the band 1 to 2 px to the approved's
  (ratio 1.0, within 0.15) by the form itself (soft shoulders, lanes that are broad dark blobs with pits, tops
  with soft dark patches), not by a blur over the frame." 4. levels picture with every state; "your lights are
  whole plates, the approved's lights are irregular blobs of about half a cell with dark patches on the tops; your
  darks are thin lines, the approved's are broad lanes that swell where three cells meet. The streaks along the
  shells (the satin) have no counterpart in the approved at this scale; take them out or break them up." 5. count
  dropped. Date 23:15 stands: frame 90 at draft and final, strip, levels, the bands' rows with the three parts.
- 22:08 to 22:35 UTC. TRIALS h4 to h11 (frame 90 draft). Tools in v: levels.sh NAME (both cut at the approved's
  percentiles), fine.sh NAME (where the band under 1 px lives, times 8), zone.py NAME (band ratios by rows),
  rows.py (percentiles by rows), x3.sh NAME X Y (approved over mine at 3 times).
  h4 profile fall and big swells: cobblestones, plates with thin outlines.
  h5 NEW cushion law in ground.ts: the light of a cell is one soft blob with an uneven outline: qEdge = blob[0] +
    blob[1] (lobes round the cell, blob[6] of them) + blob[2] (labWell swell) + blob[3] (fan), light = 1 - smoothstep
    (qEdge -+ blob[4], plan), heat mix(blob[5], 1, light); patches on the top: 1 - patch[0] smoothstep(patch[2],
    patch[3], labWell(d patch[1] 1.7)); navel; fibres. h5 lichen on stones (patches small and crisp).
  h6 swell 2.5, lobes 0.6, patches larger: levels picture near the approved's for the first time.
  h7 BELL DOME: dome.base[5] 0.5 (shape (1 - e^2)^2: no slope at the border, so a lane is a smooth valley seen
    from both sides; the parabola met its neighbour in a crease and the far flank was pressed to a hairline),
    height 0.32, heat.thin a soft glow [0.2, 0.08, 40], lane 0.16: crisp outlines gone, liquid lumps.
  h8 sparks soft (spark[6..11]: radius px, spread, core, where on plan, cut at the border), tubes.depth 0.03.
  h9 fibre.counts [2, 4, 8], breaks off [2, 3, 0.3] (no parting lines): fine band unchanged (1.69), so the lines
    were not fibres. At 3 times: the line on every border was the step between two cells' own heats.
  h10 SEAM OF THE PLACE (cushion.seam): on the border the heat is a field of the place (crease[2] times 0.7 + 0.6
    vn(vG 40), pits), the same from both sides; the cell's own heat comes in over laneWide, ragged by the fan.
    Grain (cushion.grain). Soft gas for the first time; cells less clear. MEASURED h10: low64 8.00, bands
    [1.69 1.11 0.97 0.98 1.03 0.98 0.90], lane width 6.5 px (approved 7.1), curve inside 0.07.
  h11 rim filaments from fan with counts [2, 4, 8], amplitude 1.2: broad satin streaks again. Worse than h10.
  zone.py: the approved's band under 1 px is strongest in rows 600 to 760 (rms 12 to 13) and weakest in the
    nearest rows 960 to 1080 (3.9); mine is 1.4 to 1.6 times in the middle and 2 times at both ends. Even the
    standing ground reads 1.95 in the nearest rows.
- 22:35 to 22:45 UTC. h12 rim filaments from the finest fibres only (counts [3, 6, 14]), amplitude 0.6, grain
  [0.3, 1.5]: soft gas lumps, cushions unclear. h13 light nearer the lane (blob[0] 0.82, swell 1.6), lane 0.15,
  seam 0.28, skirt steep (dome.base[6] 40): cushions clearer. h14 = h13 with haze.air depth 0 (no gas past the
  limb). MEASURED h13: low64 7.88, bands [1.62 1.09 0.98 1.02 1.09 1.02 0.90]; h14 curve [0.728 0.722 0.717
  0.699 0.67 0.621 0.567 0.511 0.448 0.388 0.344] (approved 0.667 0.662 0.657 0.647 0.619 0.586 0.547 0.496
  0.433 0.369 0.324: middle 0.06 too light), lane 6.3 px (7.1).
  mask.py now writes the three part png (255 ground, 128 strip, 0 sky). The film's limb: topmost row where the
  lab's frame with haze.air off differs from the standing ground's frame by more than 6 levels, cubic through
  1877 columns, rms 1.44 px: rows 584.0, 503.7, 483.4, 524.2, 626.8 at x 0, 480, 960, 1440, 1919 (17 to 38 px
  above the approved's). parts.py PARTS FRAME...: plain match on the three parts. MEASURED (ground, strip, sky):
  standing 51.3722 40.8483 8.4355; b7 47.1275 74.8329 11.7807; h13 (air 0.4) 52.7269 54.7915 9.9224;
  h14 (air 0) 52.7469 51.0511 8.5568. Still 0.12 over the standing ground on the sky: 0 to 5 px above the
  fitted limb mine is 8 to 10 levels lighter (the limb's own ragged line and the bloom of my lighter far
  ground), 5 to 40 px above about 1 level (bloom), nothing above 100 px.
  SEEN at 0.75 (v/half-h14.jpg, approved over mine, rows 580 to 1080): the approved is a net of thin dark red
  lanes round cushions that are textured inside (fibres, olive middles, light rims); mine is smooth gold lumps
  in soft dark valleys. Next: lane about 7 px and a net, light nearer the lane, fine fibres over the whole top
  from the finest count, fewer blotches.
- 22:47 to 22:54 UTC. h14 at the final tier (338 s, 16 samples): low64 7.66, bands [1.56 1.14 1.00 1.04 1.10 1.03
  0.93], parts ground 52.9182 strip 51.4092 sky 9.1752 (the sky at final reads higher than at draft, 8.5568: the
  standing ground has to be read at the same tier).
  h15 lane 0.1, light to 0.9 of the way, fine fibres from 0.1 (rim [0.5, 0.1, 0.4, 0.3, 0.7, 0.5]): a net of thin
  lanes, cushions clear, tops too even (curve's middle 0.07 over).
  h16 (commit 82822a4a): patches 0.65 [0.4, 0.7], navel [0.65, 0.3], lane [0.13, 0.06], fold 0.1, thread 0,
  sparks 0.8 of 3 to 5 px along the seams. MEASURED draft: low64 7.63, bands [1.75 1.16 1.00 0.98 0.99 0.93
  0.90], parts ground 52.1131 strip 50.2522 sky 8.5419; curve [0.688 0.689 0.689 0.676 0.65 0.621 0.588 0.534
  0.474 0.407 0.353] (all inside 0.05 of the approved's), lane 5.85 px (approved 7.08; inside 1.5).
  NOT DONE for h16: frames 0 and 60, motion, flicker, bake, share, hashes, RECIPE (cushion law, mask.py,
  parts.py, match.py, cells.py).
- 22:59 UTC. h16 at the final tier (335 s): plain whole 30.9342, low64 7.586, bands [1.67 1.21 1.02 0.99 1.00 0.94
  0.92]; parts ground 52.2389 strip 50.3887 sky 9.1586; curve [0.693 0.694 0.696 0.683 0.658 0.629 0.597 0.542
  0.479 0.41 0.356], lane 5.93 px. Finest band by rows (520, 600, 680, 760, 840, 960 to 1080): 1.97, 1.66, 1.57,
  1.56, 1.57, 2.09; band 1 to 2: 1.53, 1.28, 1.15, 1.18, 1.04, 1.30.
  SEEN at times 3 beside the approved: mine are smooth lumps with cloudy patches (crumpled satin), thin lanes; the
  approved's are darker olive tops with bright fibres fanning to the rims, broad dark red lanes with bokeh dots.
- 23:09 UTC. Standing ground at the final tier (618 s): parts ground 51.4401 strip 40.9655 sky 9.0457 whole
  30.4864; bands [0.78 0.82 0.86 0.93 1.00 1.04 1.03], low64 10.01. So the sky part of h16 is 0.113 over the
  standing ground's at final (9.1586) and 0.106 over at draft (8.5419 against 8.4355). Line 2 of mail 1318 not met.
- 23:10 UTC. MAIL to /root: state h16 (commit 533cd7c5), draft and final, three parts, lines not met (sky 0.113 over, finest band 1.67), next state by 00:20 UTC.
- 23:12 UTC. MAIL 1336 from /root: h16 read, he sees what I see. ORDER CHANGED: motion before the finest band,
  the limb and frames 0 and 60. The state of 00:20 carries, beside frame 90: (1) frames 60 to 120, every second
  frame, draft tier (reduced size allowed, say which), as one mp4 or a sheet of twelve; (2) in words what moves
  (cells swell, split, sink; lanes open and close; strands flow; sparks live and die; anything sliding or bending
  as one flat picture); (3) the two flicker numbers as far as they can be read on that strip. Lines of 1318 stand.
- 23:11 to 23:25 UTC. h17, h18: petals (cushion.petal [amount, along a, along b, lo, hi, share of b]: soft radial
  dabs in the fan's own coordinates, riding outward with the flow; h17 on counts x and y, h18 on y and z), counts
  [2.5, 5, 9], lane [0.16, 0.08], patch 0.55, sparks 0.6. h18 MEASURED draft, curve refit: bands [1.64 1.10 0.95
  0.94 0.97 0.91 0.88] before the refit, low64 8.14; curve [0.688 0.689 0.68 0.655 0.628 0.591 0.553 0.493 0.428
  0.371 0.33] (before the refit), lane 6.03. SEEN: still smooth lumps of polished gold; at preview size they read
  as nuggets. The texture is in cell units, so a large cell has large smooth features: next make it true to the
  px (fibre.size).
  MOTION of h18 (v/mov.sh): film frames 60 to 120 every second frame at preview size, 9.3 s a frame, in
  out/work/sun/lab/film-h18, v/film-h18.mp4 (15 a second, true speed), v/sheet-h18.jpg (twelve). Eye held clip
  mo-h18 (captures 180 to 276, step 24). FLICKER h18 (b7 in brackets): near box disc 26 px 0.287 (0.211), 53.3
  percent over a tenth (37.5); band disc 26 0.397 (0.255), 46.4 (34.2); ellipse 90 by 45 0.106 (0.080), 6.7;
  ellipse 70 by 35 0.138 (0.119), 16 (4). WORSE than b7 on every line: the stronger patches and petals ride
  through a fixed disc. SEEN in the held clip: cells swell, brighten, are covered by neighbours; the pattern of
  the middle crop is mostly new after 1.6 s; nothing slides as one picture.
- 23:26 to 23:34 UTC. fibre.size 0.05 (ground.ts qSize = radius of the cell over 0.05, clamp 0.4 to 3): the fan's
  counts, the petals' run and the grain are true to the px, not to the cell, so a large cushion no longer has
  large smooth features. h19 (= h18 + size): big cells mottled, less polished. bands [1.71 1.13 0.98 0.98 1.01
  0.94 0.91], low64 7.62, curve inside 0.036, lane 5.98. h20 petals 0.7 with narrow thresholds: hard dark
  teardrops, a leopard (failed). h21 petals soft and mostly dark with light dabs: glossy nuggets again. h22 =
  h19 with dome.height 0.22: no gain to the eye, middle 0.075 too light; back to 0.32.
  CAUSE of the worse flicker: labWell (blob's swell, patches, grain) grows by e^2 = 7.4 times in one generation
  of 3 s (heat.spread [3, 2]), far faster than the gas crosses a cell in its life. h23 = h19 with spread
  [4.0, 1.0]: 2.7 times in 4 s.
- 23:34 to 23:53 UTC. h23 (= h19 + heat.spread [4.0, 1.0]), curve refit. MEASURED frame 90: draft plain 30.7666
  low64 7.6989 bands [1.76 1.18 1.02 1.01 1.03 0.94 0.90]; final plain 31.1683 low64 7.6814 bands [1.68 1.22 1.04
  1.02 1.03 0.95 0.92]; parts draft ground 52.5422 strip 50.3973 sky 8.5442, final 52.701, 50.6059, 9.1614
  (standing final sky 9.0457: 0.116 over). Curve final [0.743 0.737 0.722 0.709 0.683 0.645 0.598 0.538 0.466
  0.394 0.346]: 0.076 too light in the middle, OUTSIDE 0.05 at the first seven tenths (h19 was inside). Lane 6.24.
  MOTION h23: film-h23 (frames 60 to 120, every second, preview size), v/film-h23.mp4, v/sheet-h23.jpg; held clip
  mo-h23 (12 frames apart) and mh-h23 (captures 180 to 204 step 4, 2 film frames apart, v/held7-h23.jpg).
  FLICKER h23 (h18; b7): near box disc 26 px 0.387 (0.287; 0.211), 81.2 percent over a tenth (53.3; 37.5); band
  disc 26 0.387 (0.397; 0.255), 63.0 (46.4; 34.2); ellipse 90 by 45 0.141 (0.106; 0.080), 18.2 (6.7); ellipse 70
  by 35 0.179 (0.138; 0.119), 24.1 (16; 4). The slower swell did NOT help; my cause was wrong or not the main one.
  Mean absolute change of the near rows (800 to 1080), eye held: 14 levels in 2 film frames, 36 in 12 frames (b7
  38, u24 31 in 12). Farneback flow of the near rows in 2 film frames: median 1.46 px, 90th percentile 3.48.
  SEEN in held7: cells keep their place, borders creep, patches on the tops change smoothly, nothing slides as
  one picture. SEEN at 2 times in the umbra (v/pen-h23.jpg): stair steps on the umbra's side edges at draft, a
  small knot of cells at the umbra's near edge.
  SEEN in half-h23f: my cells in the middle distance (rows 680 to 800) are about half as wide as the approved's;
  my penumbra's near side is about twice as long as the approved's and pale; the whole reads as gold pebbles,
  light all over with dark gaps, where the approved is darker amber with a thin net of lanes and lit rims.
- 23:53 UTC. MAIL to /root: state h23 with the motion (commit 44adf48f): mp4, sheet, held clips, words, flicker
  worse than b7 on every line, curve outside 0.05, next mail by 00:50 UTC.
- 23:54 UTC. MAIL 1343 from /root (no answer needed): NEW MAIN code tip 1f51abc9a151db2cffca8eb0cb1aec99eed1f7f7
  (take batches 14 and 15). Merge origin main before the next name and say which main it holds.
- 23:54 to 23:57 UTC. FLICKER BY CAUSE, trial t1 = h23 with patch, petal, grain, blob's swell and sparks all 0
  (the cushion texture off, the cells and borders as they are). t1 (h23; b7): near box disc 26 px 0.226 (0.387;
  0.211), 50.0 percent over a tenth (81.2; 37.5); band disc 26 0.337 (0.387; 0.255), 44.3 (63.0; 34.2); ellipse
  90 by 45 0.084 (0.141; 0.080), 0 percent (18.2); ellipse 70 by 35 0.128 (0.179; 0.119), 3.4 (24.1; 4).
  READING: the base (borders that creep and the cells' own life) is at b7's level; the large texture on the
  tops (patch 0.55, swell 1.2) about doubled it. Mean change of the near rows in 12 frames t1 37 levels (h23 36):
  that number comes from the cells and the fan, not from the cushion texture. SEEN in t1 capture 5: thin dark
  crack lines over cells (edges where one cell covers another).
  REMEDY: carry the texture by fine fibres (they average out in a disc of 26 px), lower patch and swell.
- 23:57 to 00:05 UTC. ground.ts qRise: cushion.petal[6] shifts the petals' thresholds toward the border from
  petal[7] on. h24 = h23 with petal [0.3,3,5,0.3,0.6,0.5,0.1,0.3], blob swell 0.4, patch 0.25: a clear net of
  lanes but smooth stones; plain 31.04 low64 7.7475 bands [1.63 1.12 1.01 1.05 1.09 0.99 0.89], middle 0.09 too
  light. h25 = h24 with thread fibres (cushion.fibre[3] 0.7, counts [2,4,7], thick 0.5): fibres seen; 30.6842,
  8.2214, [1.63 1.09 0.97 0.99 1.05 0.98 0.91], 0.10 too light. h26 = h25 with fibre[3] 1.0, heat.lane [0.19,
  0.08], navel [0.6, 0.4], curve refit: cushions with fine bright threads fanning from the middle and a net of
  lanes, the closest so far, but still light and lumpy, washed middle tones. MEASURED h26 draft: plain 30.5791,
  low64 8.3698, bands [1.66 1.11 0.97 0.96 1.01 0.95 0.91], curve [0.713 0.707 0.701 0.69 0.668 0.634 0.591 0.532
  0.457 0.381 0.339] inside 0.05 at every tenth (largest gap 0.049, all on the light side), lane 6.19 px; parts
  ground 52.2784 strip 48.7545 sky 8.5354. Copy of the json: v/lab-h26.json.
- 00:05 to 00:07 UTC, 26 Nov. PENUMBRA: h27 = h26 with spot.depth 0.035, spot.hot 1.9, spot.strand [2.5, 1.0].
  SEEN beside the approved (v/pen3.jpg): darker and shorter, the strands no longer pale hair, near the
  approved's tone; still wider to the sides than the approved's and the strands still hard. MEASURED h27 draft:
  plain 30.2268, low64 9.5799 (main 10.9492; h26 8.37), bands [1.44 0.99 0.91 0.94 0.99 0.93 0.89], parts ground
  51.5449 strip 48.7646 sky 8.5349.
- 00:07 to 00:10 UTC. FLICKER h27 (h23; t1; b7): near box disc 26 px 0.380 (0.387; 0.226; 0.211), 76.9 percent
  over a tenth (81.2; 50.0; 37.5); band disc 26 0.380 (0.387; 0.337; 0.255), 50.0 (63.0; 44.3; 34.2); ellipse 90
  by 45 0.104 (0.141; 0.084; 0.080), 15.4 (18.2; 0; 0); ellipse 70 by 35 0.124 (0.179; 0.128; 0.119), 3.7 (24.1;
  3.4; 4). The ellipses (a cell's own outline) are back near b7; the small disc is not. The largest change of
  the disc (0.38 at [437, 950]) is a border that creeps into the disc (a dark gap opens beside a cell), not a
  cell that changes its light: the fixed disc of 26 px reads borders on cells of 100 to 200 px.
  SEEN in the held box (v/box-h27.jpg): cells keep their place, borders creep, a small cell is covered; the tops
  carry long bright streaks from the middle to the edge, like the ribs of a shell (satin again, by the thread
  term at 1.0 with fibre.along under 1.2 a radius).
- 00:10 to 00:16 UTC. ground.ts: the fan's change along the run (fibre.along) and the patches (cushion.patch)
  are true to the px too (times qSize). h28 = h27 with that only. h29 = h28 with fibre.along [1.5, 2.5, 4.0],
  cushion.fibre[3] 0.8: the streaks broken into short strokes; draft plain 30.2032 low64 9.5522 bands [1.44 1.00
  0.91 0.94 0.98 0.92 0.89] (v/lab-h29.json). SEEN at 3 times beside the approved (v/x3-h29.jpg): the
  approved's tops have dark soft patches and bright dabs toward the lanes, bokeh points in the lanes, nothing
  crisp; mine are of one middle tone, fleshy, with crisp lines where one cell covers another.
  h30 = h29 with cushion.patch [0.45, 0.4, 0.3, 0.8], spot.hot 2.2, spot.strand [2.3, 1.0], curve refit: tops
  with dark patches beside light dabs, nearer the approved's tones inside a cell, but it leans toward crumpled
  foil. MEASURED h30 draft: plain 30.2111, low64 8.9564, bands [1.56 1.06 0.94 0.94 0.97 0.92 0.90], curve
  [0.696 0.701 0.699 0.686 0.666 0.635 0.59 0.533 0.465 0.394 0.345] (inside 0.05, largest gap 0.049), percentiles
  0.235 0.412 0.584 0.757 0.906 0.961. The darker penumbra of h27 cost 1.2 on the low band (9.58); hot 2.2 gives
  it back in part. v/lab-h30.json.
  STATED, not to be done without a ruling: the approved's cells in the middle distance (rows 680 to 800) are
  about twice as wide as mine while the near ones are alike; the approved does not shrink with distance as a
  true view does. A ground that is really there cannot match both.
- 00:16 UTC commit 641ccfb2 pushed (h30), looks pushed (8).
- 00:16 to 00:19 UTC. FLICKER h30: near box disc 26 px 0.360, 63.6 percent; band disc 26 0.360, 51.7; ellipse 90
  by 45 0.096, 0 percent; ellipse 70 by 35 0.137, 8.0. SEEN at 3 times (v/x3-h30.jpg): the patches true to the
  px are small dark speckles on a large cell; the approved's are broad and soft, a third to half a cell.
  ground.ts: cushion.patch[4] says how far the patches are true to the px (0 a share of the cell, 1 px).
- 00:19 to 00:30 UTC. h31 = h30 with cushion.patch [0.5, 0.3, 0.3, 0.8, 0.3], curve refit (v/lab-h31.json):
  broader soft dark and light patches on the tops. MEASURED h31 draft frame 90: plain 30.3607, low64 8.824, bands
  [1.55 1.06 0.96 0.97 1.00 0.93 0.90], percentiles 0.235 0.404 0.584 0.761 0.906 0.965, curve [0.717 0.712 0.701
  0.68 0.656 0.63 0.593 0.529 0.457 0.392 0.345] (gaps to the approved 0.050 0.050 0.044 0.033 0.037 0.044 0.046
  0.033 0.024 0.023 0.021: at the edge of 0.05 on the first two tenths), lane 6.1 px (approved 7.08).
  LEVELS (v/levels-h31.jpg): my lights are more broken than h16's plates but still broader than the approved's
  blobs; my darks sit as blobs at the crossings with thin lines between, the approved's are a connected net.
  CHAIN h31 (v/chain-h31.sh, log v/chain-h31.log): fit, film frames 60 to 120 every second frame at preview size
  (out/work/sun/lab/film-h31, v/film-h31.mp4, v/sheet-h31.jpg), held clip mo-h31, final frame 90, frames 0, 60.
  FLICKER h31 (h30; b7): near box disc 26 px 0.385 (0.360; 0.211), 75.0 percent (63.6; 37.5); band disc 26 0.385
  (0.360; 0.255), 53.3 (51.7; 34.2); ellipse 90 by 45 0.126 (0.096; 0.080), 6.7 percent, 1 of 15 (0; 0); ellipse
  70 by 35 0.146 (0.137; 0.119), 7.1 (8.0; 4). The broad patches cost a little flicker against h30; both are
  worse than b7. Near rows change in 12 frames, eye held: 35.3 to 36.9 levels (b7 38).
  SEEN in motion-h31 (eye held, 12 frames apart): cells keep their place, borders creep, patches on the tops
  come and go, small cells are covered; thin dark crack lines where one cell covers the next; the look is of
  overlapping scales more than of gas. Nothing slides as one picture.
- 00:30 to 00:37 UTC. h31 FINAL frame 90 (lab-90-h31f.png): plain 30.7021, low64 8.7907 (main 10.9492), bands
  [1.45 1.10 0.98 0.98 1.01 0.94 0.91], percentiles 0.235 0.408 0.588 0.765 0.91 0.965, curve [0.719 0.718 0.717
  0.697 0.671 0.645 0.599 0.537 0.46 0.397 0.348]: gaps 0.052 0.056 0.060 0.050 0.052 0.059 0.052 0.041 0.027 0.028
  0.024, OUTSIDE 0.05 on six tenths (the draft was at the edge). Lane 6.24 px. Three parts: draft ground 51.7591
  strip 49.5995 sky 8.5416; final ground 51.8002 strip 49.7223 sky 9.1584 (standing 8.4355 and 9.0457: 0.106 and
  0.113 over). Frames 0 and 60 draft (v/lab-0-h31.jpg, v/lab-60-h31.jpg): hold, the same faults as 90.
  SEEN in half-h31f: the approved is a deeper amber with a connected dark net and larger cells in the middle
  distance; mine is lighter there (rows 620 to 800), gold pebbles.
- 00:38 UTC. MAIL to /root: state h31 (commit 2c088771, not a name): motion (film-h31.mp4, sheet, held group),
  flicker rows (better than h23, worse than b7), curve outside 0.05 at final on six tenths, sky 0.11 over, the
  middle distance stated as a matter of true view, list of what is wrong. Growth 2,651,165. NEXT stated: the crisp
  cover lines and the lanes as one soft net, the middle 0.05 darker, the limb, flicker. Next mail by 02:05 UTC.
- 00:39 UTC. MAIL 1353 from /root (no answer needed), core verbatim: "RULING on your question: keep the true
  view. ... the approved picture's cells that do not shrink with distance are a property of a painted picture
  and are not copied. Where your measures against the approved (the widths in rows 620 to 800) come from this
  alone, state it beside the number and it is no fault. MY EYE ...: (1) the tops read as metal foil, not as
  gas, and the cause I see is the hard edge: bright streaks with sharp borders on the tops and a hard line where
  one cell covers the next. Gas has no surface that can crease. A top should lose its light smoothly from its
  middle to the lane, and the lane should be a soft dark band of even width that still glows, never a line. Your
  next step (the cover lines and the lanes as one soft net) is the right one; the fine hot threads must not read
  as scratches, so judge them at 1 to 1 after that step and take them back if they do. (2) The penumbra's
  strands read as fibres and are the best part of the frame; leave their form. (3) Flicker against b7 stays a
  line: not met, as you say. No date changes: next mail by 02:05. Nothing goes on main from the lab before a
  name with the merge of main 1f51abc9 (batch 16 follows on main soon; merge the newest main then)."
- 00:39 to 01:02 UTC. THE HARD EDGES, by cause. Trials on h31 (v/trials.sh BASE.json name 'k=v' ...: one draft
  frame 90 each, lab.json restored at the end; v/trials-a.jpg to trials-e.jpg, crop 860 900 320 160 at 3 times):
  heat.fold 0 (t2), heat.crease 0 (t3), dome.lobe 0 (t5), heat.ring and breaks 0 (t6), tubes.finger and depth 0
  (t12, t13: no change at all, the cushion body does not use the tubes' body), fibre thread 0.4 with qSize from 1
  (t10): none takes the facets of the small cells away. tubes.on false (t4) is another law (not tuned). dome.over
  1.0 (t7, t9): black floor between the cells (failed, as before). dome.height 0.2 (t8): little change.
  heat.pit 0 (t14): the lanes turn light brown: most of the lanes' dark came from the pits at the crossings, not
  from the seam. That is why the darks sat as blobs at the crossings with thin lines between.
  ground.ts: lab.json "show" (junc, edge, deep, cell, tall, seam) draws one field of the dome as heat, for
  finding a cause; absent in the film. FOUND with it (v/trials-s.jpg): vJunc, the way to the point where three
  cells meet, was taken from the two nearest edges of the look's direction and JUMPED where the second nearest
  edge changed: wedges and shards with straight sides, in the heat (pit 0.9) and in the height (base[7] 0.4),
  with a radius of 0.04 units (38 px near), so a small cell was all pits and facets. This is the debris and a
  large part of the crisp lines. The seam field itself (show seam) is a soft band, but its width is a share of
  the cell's radius: 20 px round a large cell, a hairline round a small one.
  CURE: junc from the nearest edge with both its neighbours (the larger of the two pits, no jump where they
  change); heat.lane[4] a lane width in stage units (lane[5], [6]: least and most as a share of the radius), so
  the lane is of even width; fibre.span the range of qSize.
- 01:02 to 01:14 UTC. Show fields s5 to s7 of the new junc (two nearest borders of the own cell, root of the sum
  of squares): no jump inside a cell, but with a radius of 0.04 units it is bright along all borders and over
  whole small cells, and it differs across a border (each side reads its own second border). So it may not carry
  a strong pit in heat or height; usable for a soft swell of the lane's width (same level on the border).
  t16 (lane of even width alone, pits kept): 30.4066, 8.80. t18, t19 (pits weaker): low64 10.42, 9.90, bands
  16 to 32 at 0.80. t20 (heat.pit 0, base[7] 0, lane 0.009 units, seam [0.4,0.5,40]): plain 29.8675, low64
  10.5985, bands [1.67 1.14 0.99 0.91 0.84 0.75 0.86]; t21 (lane 0.012, seam [0.25,0.5,40]): 30.1443, 10.0366,
  [1.68 1.16 1.03 0.96 0.89 0.79 0.87], 5th percentile 0.318 (approved 0.231).
  SEEN (v/trials-h.jpg, v/strip-t21.jpg): the facets and shards are gone, but the lanes are wide, flat, light
  brown bands with a plain border to the tops: stones in mortar (a way that failed before). The lane must be
  darker and narrower, with a soft shoulder, and swell where three cells meet.
- 01:15 UTC. ground.ts: heat.lane[7], the lane's width grows by this share where the junc field is high (a swell
  at the crossings; the level on the border stays the same from both sides). Trials t22 (lane 0.007 units, swell
  1.5, junc radius 0.025, seam [0.15,0.4,40], pit 0), t23 (lane 0.006, swell 2.5, seam [0.08,0.35,40]), t24 (t22
  with heat.pit 0.5 and junc radius 0.02); v/trials-i.jpg, v/strip-t24.jpg.
- 01:15 to 01:22 UTC. MEASURED t22: 30.4851, 10.0959, [1.72 1.19 1.05 0.98 0.91 0.80 0.87]; t23: 30.7575, 9.9312;
  t24: 30.6219, 10.0124. SEEN (v/trials-i.jpg, v/strip-t24.jpg): dark lanes with a glow, swelling at the crossings,
  no facets; but the tops are light up to the lane, so the frame reads as cobbles in dark mortar, and the lanes
  are too wide (0.007 units is the width of ONE side: 13 px across).
  ground.ts: heat.lane[8], [9]: a shoulder, the top's heat falls to the share lane[9] over the outer lane[8] of
  the radius (smoothstep), before the seam. t25 (lane 0.004, swell 2.0, shoulder 0.45 to 0.6): 30.3586, 9.0637,
  [1.62 1.13 1.02 1.00 0.96 0.84 0.84]; t26 (also blob 0.75, rim 0.3): 30.5063, 9.1367, [1.57 1.09 0.99 1.00 0.99
  0.86 0.82]; t27 (shoulder 0.6 to 0.5, cushion.fibre[3] 0.4): 30.2632, 9.1322, [1.53 1.06 0.97 0.97 0.96 0.85
  0.81]. SEEN (v/trials-j.jpg, v/strip-t27.jpg): t27 is the softest: the tops lose their light toward the lane,
  the lanes are a connected dark red brown net that glows; deeper amber, nearer the approved than h31. Still
  wrong: small cells as lit pebbles with a crisp far side, lights on the tops broader than the approved's.
  Trials t28 (lane 0.0035, swell 1.0, shoulder 0.7 to 0.45), t29 (thread 0.2, rim 0.25, blob 0.8), t30 (dome
  height 0.26): v/trials-k.jpg, v/strip-t30.jpg.
- 01:22 to 01:26 UTC. MEASURED t28: 30.2635, 10.2125, [1.48 1.02 0.92 0.94 0.94 0.83 0.79]; t29: 30.5377, 9.6404,
  [1.51 1.05 0.96 0.99 0.99 0.86 0.81]; t30 (height 0.26): 30.3435, 9.237, no gain to the eye over t27.
  SEEN (v/trials-k.jpg, v/strip-t30.jpg): t28 and t29 are soft cushions with thin dark lanes that glow; the
  foil is gone at 3 times. Small bright posts (1 px wide, about 7 px tall) stand under some corners: a wall of
  the skirt lit by a spark or the seam's glow; to find.
- 01:26 UTC. STATE h32 = h31 with heat.pit 0, dome.base[7] 0 and [8] 0.025, cushion.seam [0.12,0.4,40], heat.lane
  [0.19,0.08,0.8,0.0,0.0035,0.06,0.6,1.0,0.7,0.45], cushion.fibre[3] 0.3, cushion.rim[0] 0.25, cushion.blob[0] 0.8,
  curve refit (v/lab-h32.json). Chain v/chain-h32.sh (log v/chain-h32.log).
  MEASURED h32 draft frame 90: plain 30.2863, low64 7.874 (main 10.9492), bands [1.58 1.08 0.98 1.02 1.03 0.91
  0.84], percentiles 0.259 0.416 0.584 0.761 0.906 0.961 (approved 0.231 0.404 0.58 0.761 0.906 0.965), curve
  [0.795 0.789 0.774 0.759 0.738 0.702 0.652 0.58 0.5 0.409 0.352]: gaps to the approved 0.128 0.127 0.117 0.112
  0.119 0.116 0.105 0.084 0.067 0.040 0.028, OUTSIDE 0.05 on nine tenths and worse than h31 (the shoulder gathers
  the light in the middle of each top; the percentiles of the whole ground match, so the approved carries its
  contrast in patches across the tops and not from middle to border). Lane 5.59 px (approved 7.08), lane depth
  0.303.
  SEEN (v/x3-h32.jpg, v/levels-h32.jpg): soft cushions, no foil, no facets; but in the levels picture every cell
  is a light plate inside an even dark net (cobbles), where the approved's lights are irregular blobs of half a
  cell and its darks are broad areas that take in parts of the tops. NEXT: the light of a top as an off centre
  blob of about half the cell whose dark side runs into the lane (blob lobes larger, shoulder gentler), then the
  curve again.
- 01:29 UTC. MAIL 1361 from /root (no answer): origin main is now fb40db962c77add634dabe98d9a6ac1519fbb59d
  (batches 16 and 17). Nothing changes in my orders: merge this main (or a newer one) before my next NAMED mail
  and say which main it holds. After the merge `npm run cues` and `npm run shots` should leave no change under
  cut/; if they do, say so with the name.
- 01:28 to 01:43 UTC. CHAIN h32 done. FLICKER h32 (h31; b7): near box disc 26 px 0.257 (0.385; 0.211), 56.2 percent
  (75.0; 37.5); band disc 26 0.257 (0.385; 0.255), 41.3 (53.3; 34.2); ellipse 90 by 45 0.076 (0.126; 0.080), 0 of 13
  (6.7; 0); ellipse 70 by 35 0.159 (0.146; 0.119), 3.1 percent, 1 of 32 (7.1; 4). Better than h31 on seven of
  eight, at b7's level on the band's largest and both ellipse shares; worse than b7 on the near box and on the
  70 by 35 largest.
  h32 FINAL frame 90 (lab-90-h32f.png): plain 30.6185, low64 7.789 (main 10.9492), bands [1.50 1.12 1.00 1.02
  1.03 0.91 0.85], percentiles 0.259 0.42 0.588 0.765 0.906 0.961, curve [0.801 0.79 0.775 0.761 0.743 0.709
  0.656 0.583 0.499 0.409 0.351]: gaps 0.134 0.128 0.118 0.114 0.124 0.123 0.109 0.087 0.066 0.040 0.027, OUTSIDE
  0.05 on nine tenths. Lane 5.56 px, depth 0.299. Three parts: draft ground 51.5061 strip 50.8236 sky 8.5528;
  final ground 51.5178 strip 51.0563 sky 9.1715 (standing 8.4355 and 9.0457: 0.117 and 0.126 over).
  SEEN (v/half-h32f.jpg, v/x3-h32f.jpg, v/motion-h32.jpg, v/sheet-h32.jpg): soft lumps of dough in an even dark
  net; no foil, no facets, no black; the approved is darker on the tops, with its dark in broad areas. In motion,
  eye held: cells keep their place, borders creep, a large cell swells, small ones are covered; thin cover lines
  remain where a crest hides the lane behind it; nothing slides as one picture.
- 01:45 UTC. MAIL to /root: state h32 (commit 3d6d5bb0, not a name): cause of the hard edges (jumping junction
  field, pits, seam width as a share of the radius), what h32 does, final numbers, motion words, flicker rows,
  honest list (cobbles: every cell a light plate in an even ring; curve outside 0.05 on nine tenths; sky 0.126
  over; finest band 1.50; flicker against b7 not met). Growth 2,663,313. Next mail by 03:10 UTC.
- 01:44 UTC. ground.ts: heat.lane[10] the scale of a slow field of the place (0 off) and lane[11] the least share:
  the shoulder acts in full only where the field is high, so the dark areas cross lanes and take in parts of
  tops. Trials on h32 (v/t31.sh): t31 (shoulder 0.8 to 0.4, field 10, least 0.2), t32 (field 6), t33 (t31 with
  patch[0] 0.65 and blob [0.65,0.8,0.4,0.3,0.25,0.5,2]); v/trials-l.jpg, v/strip-t33.jpg, v/levels-t31..33.jpg.
- 01:47 to 01:56 UTC. MEASURED (drafts on h32's curve, no refit): t31 30.0489, 8.2432, [1.60 1.08 0.96 0.97 0.98
  0.91 0.88], curve [0.776 .. 0.357]; t32 30.0965, 8.4631; t33 30.491, 9.3947, [1.57 1.06 0.94 0.94 0.94 0.90
  0.88], curve [0.728 0.714 0.691 0.673 0.647 0.621 0.579 0.522 0.451 0.381 0.331] (gaps to the approved at most
  0.061); t34 (field 8, least 0, shoulder 0.9 to 0.35) 30.4007, 9.8323, curve [0.729 .. 0.325]; t35 (t33 with
  blob [0.55,1.0,0.5,0.3,0.3,0.45,2], patch[0] 0.7) 31.1508, 12.5336 (too dark before a refit: percentiles 0.2
  0.318 0.467 0.639 0.867 0.949), curve [0.677 0.663 0.648 0.626 0.594 0.567 0.529 0.48 0.421 0.362 0.315] (gaps
  at most 0.025, before the refit); t36 (lane 0.0045, seam [0.1,0.5,40], spark 0.3) 30.4181, 9.4732, lane 5.43
  (the lane's width param does not move the read width much).
  SEEN (v/levels-l.jpg, v/strip-t33.jpg, v/strip-t36.jpg, v/trials-m.jpg): the place field with the off centre
  blob breaks the plates: t33 and more so t35 have lights as uneven blobs and dark areas that take in parts of
  tops, as the approved has. v/lab-t33.json, v/lab-t35.json.
  FOUND (v/blocks.png, v/blocks2.png, crop 800 812 160 50 at 6 times; show edge, show tall): rectangles of 10 by
  6 px with straight sides and bright posts at junctions are the SKIRTS (the part of a body beyond its border,
  falling to 0 over 0.025 of the radius) in the small holes where three rounded corners meet: walls, and on
  them each cell's own sparks and lane threads, differing from skirt to skirt. dome.base[6] 5 (t37) takes the
  walls away but leaves a rectangle (skirt and body too near in depth). CURE in ground.ts: beyond its border a
  body carries only the seam's heat of the place (no points, threads, sparks), the same for every cell.
  Trial t38 = t35 with this, curve refit (v/t38.sh).
- 01:58 UTC. MAIL 1367 from /root (no answer): origin main is now 8fb3bffe499832a8696a7caf2b0b15045a1aef1a
  (batch 18, Saturn's own files only). Merge the newest main before my next NAMED mail and say which.
- 01:56 to 01:59 UTC. t38 (t35 with skirts carrying only the seam's heat, curve refit; v/lab-t38.json): plain
  30.3551, low64 7.6526, bands [1.69 1.10 0.96 0.96 0.97 0.95 0.93], percentiles 0.247 0.416 0.592 0.757 0.902
  0.957, curve [0.706 0.704 0.696 0.689 0.668 0.639 0.606 0.558 0.49 0.411 0.354]: gaps 0.039 0.042 0.039 0.042
  0.049 0.053 0.059 0.062 0.057 0.042 0.030 (outside 0.05 on four tenths by at most 0.012; h32 was 0.134), lane
  5.4. SEEN (v/x3-t38.jpg, v/levels-t38.jpg, v/blocks-t38.png): tops with dark patches and uneven lights, the
  rectangles gone but for small wedges; a thin light line runs along many borders (heat.thin, the hot thread in
  the lane) and reads as an outline; sparks are white beads. Trial t39 = t38 with heat.thin[0] 0, spark[0] 0.25.
- 01:59 to 02:05 UTC. t39 (thin 0, spark 0.25, refit; v/lab-t39.json): plain 30.7564, low64 7.7108, bands [1.62
  1.09 0.98 1.00 1.02 0.99 0.95], percentiles 0.235 0.404 0.58 0.757 0.906 0.965 (the approved's), curve [0.745
  0.735 0.728 0.712 0.69 0.66 0.617 0.557 0.48 0.401 0.346]: gaps up to 0.078 (t38 0.062: the reader's pieces
  change when the light line on the borders goes), lane 5.45. SEEN (v/x3-t39.jpg, v/strip-t39.jpg): no outline
  round the cells, lanes soft and dark with a glow; cells still read as polished lumps (smooth lights, little
  fine structure), lanes as a flat brown bed where they are wide.
  t40 (fan 0.28), t41 (fan 0.28, grain 0.45, rim 0.4), t42 (fan 0.2, thread 0.5, height 0.27): 30.77 to 30.86,
  low64 7.71 to 7.82, bands as t39; to the eye nearly the same (v/trials-n.jpg). v/lab-t41b.json = t39 with
  fibre [0.28,0.15,0.5,0.4], grain [0.45,1.5]. Trials on it of the body's shape (v/t43.sh): t43 base[4] 3 (flatter
  top, steeper flank), t44 base[5] 0.75 (narrower valley), t45 both with lane swell 0.4; v/trials-o.jpg.
  NOTE: the commit of 02:05 holds ground.ts with the skirt cure and lab.json of h32, so its frame differs from
  the mailed h32 on the skirts only.
- 02:08 UTC. MAIL 1368 from /root on h32 (no answer needed before my mail of 03:10; "take from this what your own
  eye confirms and leave the rest"), core verbatim: "1. THE RIM. In your half of the levels picture nearly every
  cell has a bright band just inside its lane, a darker ring inside that, then the bright top. That is the
  profile of a pebble with a bevel, and it is what makes the net read as cobbles lit from one side. In the
  approved half no cell has a rim: the light falls from the top toward the edge and breaks into fibres before
  it reaches the lane. If the rim comes from a term that lights the slope (a normal, a height derivative, a side
  light), that term is the cause; plasma is lit by its own heat alone, so brightness should follow height or
  heat and nothing that knows a direction. 2. THE SPREAD OF SIZES. Your cells keep to one size at one distance.
  In the approved the largest are about three times the smallest side by side, small ones gather in groups, and
  bright tops fuse over a thin lane into one larger patch. 3. THE LANES. Yours have one width. In the approved
  they swell into dark pools where three or more cells meet and thin to nothing between fused tops; your trials
  on dark areas that cross lanes point the same way. 4. THE TOPS. The approved tops are not domes: a bright blob
  off the centre with fibres running from it to the edge, and the fibres of neighbours run on across the lane
  here and there. 5. MOTION, when the still holds: cells that are born, grow, split and fade over the hold, with
  the fibres streaming outward, not a fixed net that boils in place. A fixed net is what reads as a picture.
  The low band is the right number to watch for 2 and 3; for 1 a profile across ten cells (level against the
  distance from the lane, yours beside the approved) would show it at once."
- 02:09 to 02:18 UTC. rim.py written (level against the distance from the nearest lane; lanes = darkest 12 percent
  after 1 px blur; box 260 820 1400 260; mean, quartiles, share of pixels far from a lane; plot with --out).
  MEASURED mean level at 1 2 3 4 5 6 8 10 12 16 20 25 30 40 px: approved 0.310 0.376 0.435 0.491 0.531 0.559
  0.599 0.627 0.646 0.672 0.690 0.702 0.714 0.742; h32 final 0.382 0.469 0.516 0.552 0.583 0.608 0.653 0.691
  0.718 0.757 0.771 0.774 0.781 0.760; t39 0.373 0.458 0.505 0.542 0.575 0.599 0.641 0.675 0.702 0.732 0.749
  0.751 0.769 0.789. No fall after a rise in the mean or the upper quartile of any (the mean shows no rim; the
  reader cannot see a rim that sits at a changing distance). What it does show: mine is 0.06 to 0.08 lighter at
  every distance and rises faster in the first 2 px (the approved loses its light slowly toward the lane); share
  of pixels over 10 px from a lane: approved 0.538, h32 0.420, t39 0.437 (my dark is spread into the tops, the
  approved's is gathered in lanes and pools).
  STATED: no term in the lab's heat knows a direction: heat.graze[2] is 0 (the limb law does not use the dome's
  normal), no lamp, no height derivative. The band inside the lane in h32 came from heat.thin (a hot thread on the
  border) and the sparks at 0.75 to 0.95 of the radius; both are out or down since t39.
  New in ground.ts (uncommitted at 02:18): `pool` = smoothstep(0.3, 0.7, vn(vG * lane[10] + 61)), the same slow
  place field as the shoulder's; lane[7] (swell at crossings) is multiplied by pool, lane[12] is the lane's width
  where pool is 0 (lanes thin between fused tops), cushion.seam[3] the factor on the seam's heat where pool is 0.
  t46 to t48 (seam[3] 5 and 9): the lanes between fused tops become a flat pale bed with a light outline, reads as
  mortar; FAILED, do not repeat (v/trials-p.jpg). t49 (lane [..,3.0,0.8,0.35,10,0.1,0.35], seam[3] 1), t50 (lane[4]
  0.0045, seam[3] 2), t51 (lane [..,3.0,0.9,0.28,10,0.1,0.35]): dark pools at the crossings, thin lanes between
  some tops, no mortar (v/trials-q.jpg, v/levels-q.jpg). t51 nearest to the approved's profile: mean 0.337 0.420
  0.468 0.508 0.545 0.572 0.616 0.650 0.679 0.708 0.725, far share 0.490; plain 31.0888 low64 8.0656 (no refit).
  v/lab-t51.json. Still lumps with smooth lights: the approved's tops are a small light with fibres to the edge.
- 02:18 to 02:42 UTC. t52 to t54 (stronger fan and fine fibres on the tops): little to see at 3 to 1, low64 7.69
  to 8.38 (v/trials-r.jpg). New lane[13]: the shoulder's start moves with the fan, so a top's light ends in
  fingers along its fibres (t55 1.0, t56 2.5, t57 2.5 with shoulder 1.0, 0.18: v/trials-s.jpg, levels-s.jpg).
  02:25 commit e285903a (ground.ts with pool, lane[12], lane[13], seam[3]; rim.py; RECIPE; lab.json still h32).
  STATE h33 = t51 + lane[13] 2.5, curve refit (v/lab-h33.json): lane [0.19,0.08,0.8,0.0,0.0035,0.06,0.6,3.0,0.9,
  0.28,10,0.1,0.35,2.5], seam [0.12,0.4,40,1.0], fibre [0.28,0.15,0.5,0.4], grain [0.45,1.5], thin 0, spark[0] 0.25,
  blob [0.55,1.0,0.5,0.3,0.3,0.45,2], patch [0.7,0.3,0.3,0.8,0.3]. Chain v/chain-h33.sh 02:25 to 02:42.
  MEASURED h33 draft: plain 30.8825, low64 7.908, bands [1.65 1.10 0.98 0.98 1.00 1.00 0.98], percentiles 0.227
  0.4 0.58 0.757 0.906 0.965, curve [0.707 0.698 0.69 0.674 0.646 0.612 0.57 0.51 0.451 0.387 0.336], lane 5.67.
  h33 final (335 s): plain 31.2165, low64 7.8419, bands [1.55 1.13 0.99 0.99 1.01 1.01 0.99], percentiles 0.231
  0.404 0.584 0.761 0.91 0.969, curve [0.718 0.708 0.702 0.682 0.656 0.62 0.573 0.514 0.45 0.387 0.339] (gaps to
  the approved's at the tenths 0.051 0.046 0.045 0.035 0.037 0.034 0.026 0.018 0.017 0.018 0.015: the first is
  0.001 outside 0.05, the others inside), lane 5.61 px (approved 7.08; quartiles 3.89 and 7.56).
  Three parts: h33 draft ground 52.7272 strip 51.4944 sky 8.5344; final 52.7347, 51.8319, 9.1536 (standing final
  sky 9.0457: 0.108 over).
  rim.py h33 final: mean 0.367 0.454 0.505 0.542 0.576 0.600 0.640 0.668 0.693 0.723 0.740 0.747 0.747 0.789, far
  share over 10 px 0.470 (h32 0.420, approved 0.538), over 20 px 0.170 (h32 0.125, approved 0.196).
  FLICKER h33 (as before: near box disc 26 / band disc 26 / ellipse 90 by 45 / ellipse 70 by 35): 0.183, 50.0 /
  0.264, 36.4 / 0.068, 0 / 0.179, 3.8 (b7 0.211, 37.5 / 0.255, 34.2 / 0.080, 0 / 0.119, 4; h32 0.257, 56.2 /
  0.257, 41.3 / 0.076, 0 / 0.159, 3.1). Not met on lines 2 and 4 (largest), line 1 share.
  Sizes from the table at 3 s (radius of the ground, stage units, 1564 cells): 5 10 25 50 75 90 95 99 percent =
  0.0065 0.0114 0.0215 0.0338 0.0530 0.0755 0.0856 0.1027; the largest quarter holds 0.666 of the ground. So the
  table has a spread of over three to one side by side; the look of one size came from the even lane and shoulder.
  Colour by level in the near box: approved mean [0.555 0.315 0.135], h33 draft [0.587 0.344 0.15]; ratios g/r
  equal within 0.02 below 0.95; my top band 0.95 to 1 is whiter (g/r 0.931 against 0.851, share 0.021 against
  0.011) and my darkest band 0.1 to 0.3 holds 0.109 of the pixels against 0.147.
  SEEN (v/half-h33f.jpg, x3-h33f.jpg, levels-h33f.jpg, life-h33.jpg, motion-h33.jpg): lanes now swell into pools at
  some crossings and nearly close between some tops; tops end in soft fingers, no outline, no bevel band. Still
  wrong: the ground reads as paving of pale lumps from far (tops evenly light, in the approved the dark runs from
  the crossings up the flanks as fibres and the tops carry one small light); lanes still a flat brown bed where
  wide; in motion cells swell, shrink and close and the lights move outward, but the net is the same net over
  2 s (few births in the near field in 60 frames).
- 02:41 UTC. The session was resumed; the sandbox lost its git identity and its git and gh sign in
  (~/.perplexity/cli-config gone; push says "could not read Username"). Identity set again in the repo's own
  config (the same as the earlier commits). PUSH BLOCKED since then: commit 41e13272 (lab.json of h33, notes) is
  local only, origin agent/sun-lab at e285903a. Retry the push with every commit; do not rebuild access by hand.
  Disk was full at 02:43 (renders refuse under 3 GB free): old runs and trial pngs under out/work/sun/lab removed
  (kept: b7, b7f, h14, h14f, h23f, h31, h31f, h32, h32f, h33, h33f, standing, standingf, t38, t39, t51, t56, t58).
- 02:43 to 02:50 UTC. t58 to t60 on h33 (smaller light on the tops; v/trials-t.jpg, levels-t.jpg). t60 = blob
  [0.35,1.0,0.5,0.3,0.2,0.3,2], patch [0.2,0.3,0.3,0.8,0.3], navel [0.5,0.3]; refit as h34 (v/lab-h34.json, draft
  only): plain 30.9434, low64 7.8334, bands [1.59 1.04 0.93 0.97 1.02 1.05 0.98], curve [0.694 0.683 0.67 0.651
  0.628 0.593 0.537 0.467 0.4 0.346 0.321] (all gaps inside 0.05), lane 5.88, rim mean 0.370 0.462 0.508 0.542
  0.573 0.595 0.628 0.659 0.676 0.700 0.719, far shares 0.507 and 0.225. SEEN: levels picture nearer the
  approved's (lights as blobs with dark between); at full size one pale light per cell, risk of polished nuggets.
- 02:51 UTC. MAIL to /root (high, because of the push block): state h33, not a name; patch of 41e13272 attached;
  rim profile, motion words (fixed net that boils: point 5 of 1368 not met), flicker, list. Promised: per cell
  rim profile, the tops (h34 direction), then births and splits; next mail by 04:20.
- 02:52 to 02:57 UTC. rim.py cell by cell (watershed of the way from the lane, pieces of 1200 to 14000 px, the dip
  = fall between a crest within 8 px of the lane and a later rise; `--cells PLOT.png` draws the ten largest of each
  picture). MEASURED: share of cells with a dip over 0.04: approved 0.341 (41 cells; its tops have dark middles),
  h32 final 0.161 (31), h33 final 0.286 (42), h34 0.200 (25). So a bevel band is not a common thing in h32 or h33
  by this reader. What the plot shows instead (v/rimcells-h33.png): the approved's large cells are PLATEAUS, the
  level climbs over about 8 px from the lane and is flat from there; mine are RAMPS, the level climbs all the way
  to the middle (a dome). Cause: the shoulder is a share of the radius (lane[8] 0.9 in h33), so a large cell loses
  its light over its whole flank. New lane[14]: the shoulder's width in stage units (0: the share as before; least
  0.08 of the radius, most lane[8]); lane[15]: how much wider the shoulder is at a crossing in a pool (the dark
  climbs from the crossings up the flanks, in fingers along the fan by lane[13]).
  t61 (lane[14] 0.012), t62 (0.02), t63 (lane[4] 0.0045, shoulder level 0.2, lane[14] 0.015, blob 0.45 with outside
  0.4): profiles of the large cells are plateaus (v/rimcells-u.png); low64 8.83, 8.26, 7.65; to the eye the tops
  are flatter and more evenly light, lanes narrow: reads as plates more than before (v/trials-u.jpg). Not chosen.
- 02:58 UTC. MAIL 1378 from /root on h33 and h34, core verbatim: "1. The sign in: I can not restore it and you
  were right not to rebuild it by hand. It does not hold your work up. Keep committing locally; with each state
  mail send the patch as now, or a bundle of the code commits since e285903a without the looks. A name goes the
  same way and I cut from the bundle. The patch of 41e13272 is filed. 2. My eye on half-h33f, the approved above
  and h33 below, in the order of weight. (a) The tops are flat pale plates of one height with a thin brown seam,
  so the field reads as hammered brass or paving, as you say yourself; in the approved each cell is a dome whose
  light sits in a crown and falls into a dark flank, and the dark between the cells is wide and deep with a red
  orange glow in it. (b) The whole field is paler and more yellow than the approved, most of all from the middle
  rows to the horizon, where the approved closes into dark amber with small bright grains and yours stays a field
  of pale lumps. (c) The spot: the approved's penumbra is a wide dark ring of thick orange strands with dark
  between them; yours is pale straw, fine and even, round a small hard umbra, so the spot reads as laid on. (d)
  The two flares at the limb read alike. 3. Direction: the way of h34 (a smaller light on each top, dark between)
  is right, with the dark climbing the flanks from the crossings. Judge it at 1 to 1 on rows 800 to 1080 and in
  motion. Bring the share of the darkest band (0.109 against the approved's 0.147) up by the flanks, not by wider
  lanes. The penumbra's level and the width of its strands belong to the next state, not to a later one. 4. Then
  the births and the splits, as you plan. The sky's line (0.108 over) and the flicker lines stay open and red.
  5. The rim profile by cell, ten cells: yes. Mail by 04:20, as you say."
  So: no push is possible; with each state mail send `git bundle` of the code commits since e285903a (or the
  patch). A name goes by bundle too.
- 02:57 to 03:01 UTC. t64, t65 (lane[15] 3 and 6 on t63), t66 (large blob): t66 low64 11.46, FAILED (pale plates).
- 03:01 UTC. MEASURED for points (b) and (c) of MAIL 1378 (frame 90, boxes rows r0 r1, cols c0 c1; level = largest
  channel). Middle rows left (640 to 820, 200 to 700): approved mean rgb about 0.65 0.39 0.175, level 5 25 50 75
  95 = 0.33 0.51 0.67 0.82 0.95; h33 final 0.58 to 0.61 0.33 to 0.37 0.15 to 0.17, 0.27 0.42 0.56 to 0.62 0.76 to
  0.80 0.94 (mine is NOT lighter there by the mean; g/r equal within 0.03). Right (640 to 760, 1250 to 1800):
  approved 0.736 0.468 0.210, mine 0.539 0.273 0.103 (mine darker and redder). Near box (820 to 1080, 260 to 1660):
  approved 0.555 0.315 0.135 median 0.55, h33 0.590 0.347 0.151 median 0.60 (mine lighter). So "paler from the
  middle rows to the horizon" is not in the means; it is the pattern (small pale lumps with thin seams against
  bright grains on wide dark).
  Penumbra (left 650 720 720 820; below 705 745 880 1040; right 650 720 1150 1250): approved medians 0.62 0.47
  0.49, g/r 0.564 0.520 0.537, band power (difference of blurs) 1 to 2, 2 to 4, 4 to 8 px about 0.05 0.06 0.06;
  h33 medians 0.75 0.61 0.62, g/r 0.646 0.566 0.544, bands 0.05 to 0.07, 0.033 to 0.058, 0.031 to 0.042. So mine
  is 0.13 lighter, more yellow on the left, and has half the power at 2 to 8 px: strands too fine. Umbra (level
  under 0.12 in 700..1300 by 560..800): approved 10524 px, mine 14217 px; approved umbra g/r 0.72 at level 0.06
  (a grey brown), mine 0.33 at 0.03 (red black).
- 03:01 to 03:05 UTC. `cushion.blob[7]` (the light's reach shortened at crossings, by vJunc) and `blob[8]` (share
  of that where the pool is low). t67 to t69 on h34. MEASURED (draft, not refit): t67 31.1532, 7.721, rim mean at
  1 px 0.375, dips over 0.04 0.241; t68 32.0921, 8.0011, 0.341, 0.406; t69 (blob [0.45,0.8,0.5,0.5,0.15,0.2,3,
  0.5,0.3], fibre [0.5,0.1,0.4,0.5], patch[0] 0) 33.3372, 9.0548, rim mean 0.307 0.399 0.454 0.494 0.526 0.554
  0.595 0.629 0.650 0.677 0.695 (the approved's 0.310 0.376 0.435 0.491 0.531 0.559 0.599 0.627 0.646 0.672 0.690),
  dips 0.429. SEEN: a smaller light on each top, dark flanks that end in fingers, dark wedges at the crossings.
- 03:05 to 03:08 UTC. h35 = t69 refit (draft). MEASURED: plain 31.2392, low64 8.1088, bands [1.59 1.08 0.99 1.02
  1.05 1.03 0.93], curve [0.659 0.66 0.653 0.643 0.621 0.59 0.539 0.48 0.411 0.356 0.32] (every gap inside 0.02),
  lane 5.53 px, far shares 0.488 and 0.212, dips over 0.04: 0.366 (approved 0.341). SEEN at 1 to 1 (v/one-h35.jpg
  beside v/one-approved.jpg, rows 800 to 1080): the light on each top has a HARD cut edge and is cream white, so
  tops read as glossy enamel; the approved's light is gold, soft, and its flanks keep fine bright edges. So the
  numbers are met and the eye is not: soften the light's edge (blob[4]) next.
- 03:08 UTC. Penumbra, MEASURED on a line through the spot (rows 660 to 700, median level by 25 px): approved 0.45
  to 0.52 over 125 to 250 px beside the umbra, even; h35 0.36 to 0.56 beside the umbra then 0.75 to 0.82 at 100 to
  150 px out (a pale outer ring). Below the spot: approved 0.43 to 0.51, mine 0.64 to 0.80. New keys `spot.ring`
  [inner, outer factor on the strands' heat, was fixed 0.5 and 1.0] and `spot.edge` [the two radii of the umbra's
  edge in umbra radii, was fixed 0.72 and 0.88]. Trials t70 to t72: heat.pen 0.5 to 0.6, tongues fewer (thicker
  strands), ring flat, softer umbra edge, floor of the umbra up.
- 03:08 to 03:12 UTC. t70 to t72 on h35 (softer light's edge blob[4] 0.3 to 0.4; pen 0.5 to 0.6, tongues [90,58] to
  [130,84], ring flat, edge soft). MEASURED (not refit): t70 29.6806, 7.5578; t71 30.5342, 7.4829; t72 30.0582,
  7.4578; dips 0.267 0.214 0.244. SEEN (v/pen-x.jpg): the penumbra darker but its strands are short pale leaves
  side by side, not strands on dark. The tops keep dark dabs with hard edges.
- 03:12 to 03:16 UTC. New key `spot.lean` (a strand's half width as a share of its column). t73 to t75: lean 0.3 to
  0.38, ranks down to [2.0,1.5] (longer), hot 1.8 to 2.6. MEASURED: 29.2358, 9.0208; 29.5172, 8.7543; 29.6347,
  7.9787. SEEN (v/pen-y.jpg): long strands on dark, the ring reads dark as the approved's does; but the strands
  wave like hair and narrow to lines at the umbra. t74 (tongues [100,64], lean 0.3, ranks [2.4,1.8], hot 1.8, pen
  0.55) the thickest.
- 03:16 to 03:20 UTC. t76 to t78: the flank's floor blob[5] raised to 0.3 to 0.4 with a lower seam (0.06, 0.08).
  MEASURED: 28.6778, 8.8795; 28.5299, 9.2233; 28.9279, 8.9634; rim mean at 1 px 0.51 to 0.54, dips 0.071 0.056
  0.176. SEEN: pale plates with a thin dark seam again (paving). FAILED: the dark of the flanks comes from the low
  floor of the light; keep blob[5] at 0.2.
- 03:20 to 03:23 UTC. h36 = h35 + blob [0.42,0.8,0.5,0.35,0.24,0.2,3,0.6,0.3], petal[0] 0.15, rim[0] 0.1 (the
  bright band inside the lane, MAIL 1368 point 1, taken down), penumbra of t74 with ring [0.8,0.7], edge [0.6,1.0],
  floor [0.012,0.03]; refit. MEASURED (draft): plain 30.7422, low64 8.6241, bands [1.47 1.03 0.97 1.01 1.05 1.00
  0.88], curve [0.678 0.669 0.661 0.641 0.62 0.591 0.531 0.467 0.404 0.348 0.32] (gaps inside 0.02), lane 5.71 px,
  far shares 0.517 and 0.245, dips over 0.04: 0.333 (approved 0.341), rim mean 0.380 0.475 0.523 0.558 0.587 0.609
  0.646 0.675 0.691 0.712 0.722. SEEN at 1 to 1 (v/one-h36.jpg, v/pen-h36.jpg): each top carries a smaller light
  and dark flanks, the field is darker between; but the lights are cream with a firm outline (glossy, like enamel
  or wet metal), the lanes are a mid brown bed, and the approved's fine bright edges and sheen along fibres are
  not there. The penumbra is a dark ring with strands on dark, but they wave like lashes and lie flat.
  New key `spot.bend` (was fixed 0.3). t79 to t81: straighter, more strands.
- 03:23 to 03:27 UTC. t79 to t81 (bend 0.1 and 0, tongues [120,76] to [160,100]): the strands still wave, the wave
  comes from the warp of the angle, not from `spot.bend`. New key `spot.wave` [0.06, 0.02 were fixed]. t80 (blob
  floor 0.15, edge 0.3): low64 9.7118, darker and blotched, FAILED. t79 (lane[13] 1.2): softer fingers, dips 0.333.
- 03:27 UTC. MEASURED, why the darkest band's share does not move: the fit pins the percentiles of the fit's near
  ground, so the share of levels 0.1 to 0.3 in my box (rows 820 to 1080) stays near 0.10 (h33f 0.105, h36 0.097,
  h37 0.098; approved 0.147) however dark the flanks are. By rows of 40 (cols 100 to 1820) the approved's share
  under 0.3 is 0.07 to 0.10 in rows 680 to 920 and 0.18, 0.18, 0.15 in rows 920 to 1040; mine is even (0.10 to 0.13
  everywhere in h33). So the approved is darker in the nearest rows and lighter in the middle rows than mine: the
  cure is a slope of the dark with the nearness (larger cells show more flank), not the fit. Open.
- 03:27 to 03:29 UTC. h37 = h36 + lane[13] 1.2, spot.bend 0.05, wave [0.025,0.004], tongues [160,100], lean 0.36,
  ranks [2.8,2.0]; refit. MEASURED (draft): plain 30.6518, low64 8.2907, bands [1.51 1.02 0.95 1.00 1.06 1.01
  0.88], curve [0.681 0.678 0.668 0.646 0.628 0.593 0.529 0.464 0.401 0.348 0.317], lane 5.49 px. Penumbra boxes
  (left, below, right) medians 0.56 0.49 0.46 (approved 0.62 0.47 0.49; h33 0.75 0.61 0.62), g/r 0.523 0.545
  0.478 (approved 0.564 0.520 0.537), band power 2 to 4 px 0.033 0.047 0.024 and 4 to 8 px 0.028 0.033 0.019
  (approved about 0.06 and 0.055: mine half, the strands are still too fine or too faint). Umbra under 0.12:
  16866 px (approved 10524), level 0.079 (0.078), g/r 0.34 (0.60).
  Chain h37 started 03:29.
- 03:29 to 03:46 UTC. Chain h37 (commit 6b5abade, local; lab.json = v/lab-h37.json). MEASURED final frame 90:
  plain 30.971, low64 8.1237 (main 10.9492, standing 10.0147, h33 7.8419), bands [1.41 1.05 0.96 1.01 1.06 1.02
  0.89], parts ground 52.1386 strip 52.5211 sky 9.18 (standing 9.0457: 0.134 over; h33 0.108 over), curve [0.694
  0.685 0.68 0.661 0.641 0.604 0.54 0.472 0.409 0.352 0.32] (largest gap 0.027), lane 5.61 px (3.89, 7.85;
  approved 7.08), rim mean 0.376 0.461 0.508 0.545 0.575 0.600 0.642 0.676 0.694 0.717 0.723 (approved 0.310 0.376
  0.435 0.491 0.531 0.559 0.599 0.627 0.646 0.672 0.690: mine 0.03 to 0.085 lighter at every distance), far shares
  0.529 and 0.252 (0.538, 0.196), cells with a dip over 0.04: 0.316 (0.341). Darkest band 0.1 to 0.3 in rows 820
  to 1080: 0.096 (approved 0.147, h33 0.105): NOT moved. Level over 0.95: share 0.024 g/r 0.930 (0.011, 0.851).
  Penumbra boxes medians 0.57 0.52 0.50 (approved 0.62 0.47 0.49), g/r 0.521 0.544 0.473 (0.564 0.520 0.537), band
  power 2 to 4 px 0.033 0.049 0.024, 4 to 8 px 0.028 0.034 0.020 (approved about 0.06, 0.055). Umbra 17786 px
  (10524). Draft: plain 30.6909, low64 8.2854, sky 8.5593.
  FLICKER h37 (largest, percent over a tenth): 0.246, 58.3 / 0.246, 42.4 / 0.069, 0 / 0.138, 9.4 (h33 0.183, 50.0 /
  0.264, 36.4 / 0.068, 0 / 0.179, 3.8; b7 0.211, 37.5 / 0.255, 34.2 / 0.080, 0 / 0.119, 4). Worse than h33 in three
  shares: a smaller light on a top makes the mean of a disc of 26 px move more as the border moves.
  Low band, where (blur 64 of the level, mine minus approved): the right side rows 660 to 900, cols 1360 to 1840 is
  0.15 to 0.26 DARKER than the approved (a bright region right of the spot in the approved, level 0.73 to 0.77,
  mine about 0.5), the near middle 0.04 to 0.10 lighter, and the penumbra now 0.05 to 0.12 darker at its sides
  (h33 was 0.06 to 0.08 lighter below the spot). The fit trades the dark right side against a lighter near field.
  The fit reads rows 778 to 1080 over the whole width; there the share under 0.3 is equal (0.112, 0.122).
- 03:43 UTC. MAIL 1390: origin main is now cfabcc52f6dbe1ac02ad4fec5bfe73c709c2e974 (nothing changes for the lab;
  merge this main at the next name, or the Builder cuts the name onto main; no fetch is possible here now).
- 03:46 to 03:51 UTC. Trial h38 (v/lab-h38.json, not committed) = h37 + lane[4] 0.0043 (wider), seam [0.06,0.3,40,
  1.0] (darker bed), blob[2] 0.15 (a steadier outline of the light), blob[7] 1.0. MEASURED (draft): plain 30.6566,
  low64 8.0748, bands [1.49 1.01 0.94 1.01 1.08 1.03 0.88], lane 5.87 px, darkest band 0.106, dips 0.111, rim mean
  0.363 0.447 0.490 0.527 0.560 0.586 0.625 0.658 0.680 0.711 0.734. FLICKER 0.261, 63.6 / 0.261, 40.0 / 0.065, 0 /
  0.140, 10.3: no better, so the well in the light's reach (blob[2]) is not the cause. SEEN (v/one-h38.jpg): the
  bed is darker and the tops hold more mid tone, nearer the approved in tone; but the lanes turn to thin dark
  lines and the cells read as rounded stones.
- NEXT (after the mail of 03:55): (1) the light of a top as fibres and sheen, not one cream blob with an outline;
  (2) the bright region right of the spot as heat of the place (low band); (3) flicker by cause: read which cells
  change (border passing the disc, or the light itself); (4) births and splits: a split as a lane that opens
  across an old dimmed cell (sim.ts: the newborn takes half of the host at once, the lane between the two starts
  closed), not a point that grows.
- 03:52 UTC MAIL to /root (high): state h37, measures, motion words, trial h38, bundle v/h37.bundle (e285903a..
  6e8d9664), 10 attachments. Next mail by 05:20.
- 03:54 UTC. FLICKER BY CAUSE, read on the four worst cells of mo-h37 (v/flk-h37.jpg, five captures 12 film frames
  apart at 2 to 1 with the disc drawn): every one is a cell that shrinks to nothing within 1.2 to 1.6 s or a border
  that crosses the disc; none is a light that blinks on a standing cell. So the rows of disc 26 count the life
  itself (lives of 2 to 4 s are ordered, "do not slow the cells to pass the row"). The ellipse rows (the cell's own
  outline) hold: 0 and 9.4 percent.
- 03:55 UTC. READ of the approved at 3 to 1 (v/a3.jpg, cols 820 to 1140, rows 820 to 1000) against mine (v/m3.jpg):
  the approved's bodies are MID brown and mottled, not pale; the brightest things are fans of discrete rays that
  rise from the dark pits where cells meet, up the flank of the cell behind the pit (the flank that faces the
  eye), 20 to 40 px long; small round bright grains along the lanes; pits black. Mine: a pale blob in the middle of
  each top, a dark fibrous flank all round, a smooth mid brown bed. The law by the relief's own normal
  (heat.graze[2]) would give the facing flank but is ruled out (MAIL 1296 (a) no lit side; 1368 nothing that knows
  a direction). So by heat alone: new key `cushion.wall` [amount, rise from the lane, reach, more reach at a
  crossing, ray low, ray high, least share away from a crossing]: the flank beside a crossing is hot in rays, on
  every side; the relief decides how much of it the eye sees. Trials t82 to t84 with a mid body (blob[5] 0.45 to
  0.55).
- 03:55 to 03:59 UTC. t82 to t84 (`cushion.wall`, hot rays on the flank beside a crossing, mid body): low64 14.13,
  13.79, 10.96; SEEN pale plates, no fans. FAILED, the key is taken out again.
- 03:56 UTC MAIL 1397 from the Builder (high), verbatim core: "State h37 is read: the bundle is filed, half-h37f and
  motion-h37 are seen. It is a state and stays in the lab. 1. My eye on half-h37f, the approved above. The plates
  of h33 are gone and each top carries its own light and dark flanks: that part of (a) moved the right way. What a
  viewer names now is wet pebbles under a lamp: one cream blob with a firm outline on a smooth body, and a smooth
  brown bed between. The approved has no blob and no bed. Each of its cells is a dome made of fibres: fine bright
  threads that run from the crown outward and down the flank, bunch to a bright edge where the dome turns over, and
  end in a dark seam where they meet the neighbour's threads. The light is the sum of the threads' crests; the dark
  is the depth between threads and between domes. 2. So your NEXT (1) is right and it is the main thing: the top's
  light as fibres and sheen. Three points of direction. (i) Lay the fibres in the cell's own polar frame (angle
  round the crown, distance from it), many to a cell, uneven in length and brightness, in the height as well as in
  the light, so the sheen follows them. (ii) Let them flow: the pattern travels from the crown outward and down
  into the seam at the rate the cell's matter moves, with new threads rising at the crown. That travel is what
  reads as plasma and not as a picture; a light that swells and shrinks in place reads as a lamp. (iii) No bed:
  where two cells meet, their threads meet. The seam's width comes from the threads thinning out and its dark from
  depth, so h38's wider lanes and darker bed are not the way; you saw it harden the lanes to lines and the cells to
  stones. 3. Colour: your own measure stands (highlights twice the approved's share and whiter, g over r 0.930
  against 0.851). The crests are gold, and white only at the few hottest points. 4. The bright place right of the
  spot as heat of the place: allowed, as you take it. Heat, no lamp. 5. The spot: the level is reached, the form
  not, as you say. The approved's penumbra is a pit's wall: thick strands with bright heads on the rim that run
  down into the dark and thin as they go; the umbra lies deep, grey brown, and smaller (10524 px against your
  17786). Give the place its depth in the height (the ground falls into the pit and the strands run down its wall)
  before more work on the strands' paint. After 2. 6. Flicker by cause per cell before any change: yes. With the
  fibres travelling, measure it again. The flicker rows stay open and red, as do the sky's line (0.134 over) and
  the finest band (1.41). 7. Order: 2, then 4 and 5, then 6, then births and splits. Judge every state at 1 to 1 on
  rows 800 to 1080 and in motion over 2 s. Your mail by 05:20 stands. Send by bundle as now."
- 04:00 UTC. For point 2: new key `cushion.weave` [threads round a cell of fibre.size at the crown, radius of the
  first doubling, rows per unit of the run, half width on the top, half width at the border, where the thinning
  starts, how uneven that is round the cell, the floor between threads, bend, the mean when too fine to draw]. The
  threads are ranks of drops (the penumbra's labTongue, now with lean and bend as arguments) in the cell's frame
  (tb.w round the crown, run outward), riding with the flow, doubling in number with the radius. Trials t85 to t87.
- 04:05 UTC. t85 to t87 (weave on h37, not refit): MEASURED low64 11.69, 12.77, 10.82, bands 1 to 2 px 0.92 to 0.94,
  2 to 4 px 0.77 to 0.85. SEEN at 3 to 1 and 1 to 1: the threads are there and fan from the crown, but with the blob
  floor raised the whole cell is pale; t86 (12 threads, thin) reads as hair combed from the crown, t87 (7, wider)
  better. All three are pale tufts on a smooth light bed.
- 04:14 UTC. Heads turned outward (the drop's hot narrow end leads) and the threads thin sooner at crossings
  (weave[10]). New helper v/trialsf.sh refits the curve for each trial (two renders each). t88 to t90 MEASURED:
  low64 7.84, 8.03, 8.58; bands 1 to 2 px 1.04, 1.00, 1.06; finest 1.65, 1.56, 1.73 (worse than h37's 1.41);
  share 0.1 to 0.3: 0.120, 0.113, 0.125 (h37 0.096, approved 0.147); highlights over 0.95: 0.016 to 0.020 at g/r
  0.93. SEEN: the drop with its head outward has a hard pointed end: feathers, scales of a cone. FAILED as a form
  (hard edges). t90's lanes (lane[4] 0.002, lane[5] 0.03, lane[7] 2.0, lane[9] 0.4) are the nearest to "no bed":
  narrow, dark, pits at crossings.
- 04:15 UTC. `labThread`: a thread soft at both ends and across, long (1 to 1.3 rows to the run), hottest toward
  its outer end, bent as an arc. Trials t91, t92.
- 04:17 UTC MAIL 1399 from the Builder (to every builder, no answer needed from me): "THE THIRD CUT: names in my
  hands by 06:45 go onto main as they are proven (about 08:15). ... THE FOURTH CUT: names by 13:30, on main about
  15:00, rounds at 15:15. THE FREEZE: 20:30. The last names by 18:30. ... What a name is: your best state that is
  better than main to the eye and no worse than main by the laws in force: (a) the units and the gate green; (b)
  the reader by part: of the three numbers of each part (the largest pop, pattern and level step of the part), each
  one that is over its limit is no worse than main's own number for that part; (c) the plain match at each judged
  frame no worse than main's; (d) G17 not red where main is green; and the laws of your own stop as they stand. A
  name need not be your last word. What is still wrong is named red in the mail and goes into the next cut. ... If
  your machine cannot push, send the name as a bundle by attachment and say its base." Main is 5798676c (code
  cfabcc52).
- 04:19 UTC. t91, t92 (labThread, refit): MEASURED low64 7.95, 7.52; bands 1 to 2 px 1.13, 1.08; finest 1.78, 1.69;
  dip share 0.306, 0.256. SEEN: soft threads stream from the crown, no hard ends; reads as gathered silk, the
  threads equally lit all round, still a smooth bed in the pools with a firm outline to the cell. Next: the light
  as a soft lobed envelope over the threads (blob floor 0.2, edge 0.4), no pool in the seam (lane[7] 0, the
  threads thin sooner at crossings instead, weave[10]), threads fade sooner with distance (weave[11], [12]),
  LAB_TAIL 0.6 in curve.py for the gold. Trials t93, t94.
- 04:24 UTC. t93, t94 (envelope floor 0.2, no pool in the seam, threads fading sooner): MEASURED low64 7.50, 7.86;
  finest 1.45, 1.43; 1 to 2 px 1.00, 0.98. SEEN at 1 to 1: with weave[11], [12] at 0.1, 0.3 the threads are gone on
  all but the nearest cells: pebbles with a cream blob again, and the bed stays though lane[7] is 0. So the bed is
  not the seam's pool: it is the lower flank of the cell behind a lane, the part that faces the eye, dimmed by the
  shoulder (lane[8], [9]) and by the threads thinning. In the approved that flank carries the bright fans.
  LAB_TAIL did nothing (the tail is capped at 1.0 either way). MEASURED why the highlights are white: the ramp's
  top (convect.json tone.white 1.0 0.97 0.85) is whiter than anything in the approved; the approved's pixels over
  0.95 have g/r 0.85, b/r 0.585, the ramp gives 0.92 to 0.96 and 0.74 to 0.84 there.
- 04:27 UTC MAIL 1400 (no answer needed): "MAIN MOVED: origin main is 834d5148f93966efa2d55c59c4fc02acc375b151 ...
  Merge origin main into your tree before you name (MAIL 1314, 1367)." I cannot fetch here; the Builder cuts from
  the bundle (MAIL 1390).
- 04:30 UTC. New key `heat.gold`: the colour of the lab ground's ramp at its top instead of tone.white (the ramp of
  the standing set is not touched). t95, t96 (gold 1.0 0.87 0.62, shoulder nearly off lane[8] 0.5 lane[9] 0.8,
  threads thin only from 0.75 of the way, fade 0.18 to 0.45; t96 also seam 0.06, weave floor 0.2): MEASURED low64
  7.47, 7.44; plain 30.00, 29.63; highlights g/r 0.878 (h37 0.930, approved 0.851), share over 0.95 0.020, 0.019;
  finest 1.56, 1.78 and 1 to 2 px 1.05, 1.14; dip share 0.067, 0.088 (approved 0.341: the threads fill the
  middle). Penumbra medians fell with the refit (0.39 0.29 0.29, approved 0.62 0.47 0.49) and the umbra grew
  (24991 px). SEEN: t96 has the least bed so far, the threads reach the rim and the lanes are thin and dark;
  the threads read as even stripes (urchin), every cell striped alike. Trials t97, t98: heat.pen up, the umbra's
  edge in, threads less even.
- 04:32 UTC MAIL 1402 (copy of the ruling to sun_builder, no answer needed): "A ground made by code is not judged
  by the plain match ... the plain number is replaced, for the ground part of the Sun's 60 and 90 (the lower 70
  percent of the frame), by three lines: (i) the low band (both pictures blurred with a Gaussian of 16 px, mean
  absolute RGB) over that part no worse than main's own; (ii) luminance in the bands 1 to 2, 2 to 4, 4 to 8 and 8
  to 16 px over that part within 0.7 and 1.4 of the approved image's; (iii) by my eye at 1 to 1: it reads as
  plasma, better than main's cloth, with the approved's palette and light. The tool is attached (bands.py; in a
  mask white counts; its low band is over the whole frame, so cut both pictures to the part first for line (i))."
  "The sky part (the upper 30 percent) stays under the plain number: at or under main's own at 60 (11.5380) and at
  90." "the ground goes on by the lab's own name when it passes the three lines." Tool kept as v/bands.py; my
  wrapper v/l70.sh (cut rows 324 to 1080 for (i), a mask of those rows for (ii)). MEASURED with it: standing final
  low band 16: 23.4775, bands 0.877 0.881 0.938 0.992; h37 final 20.954, bands 1.098 0.994 1.025 1.070, under 1 px
  1.342. Main's own low band on that part is UNKNOWN here (no picture of main's 90 on this machine).
- 04:35 UTC. t97, t98 (heat.pen 0.75, 0.7; spot.edge 0.5, 0.9; t98 16 threads, half width 0.35, rows 0.8, envelope
  floor 0.2 lobes 1.0): MEASURED low64 7.45, 7.21; finest 1.73, 1.60; 1 to 2 px 1.10, 1.04; penumbra medians
  0.43 0.35 0.34 and 0.49 0.42 0.41; umbra 19781, 18278 px. SEEN: t98 softer, the cells differ more from one to
  the next. A straight edge crosses the big cell at cols 840 to 900, rows 880 to 940 (there in every trial since
  t91 and before: a neighbour's dome that cuts through, not the threads). State h39 = t98; chain started 04:35.
- 04:53 UTC. STATE h39 (= t98, refit; lab.json in the tree, v/lab-h39.json). Keys new against h37: heat.cushion.weave
  [16,0.25,0.8,0.35,0.15,0.75,0.4,0.3,0.6,0.45,0.2,0.18,0.45], heat.gold [1.0,0.87,0.62], blob
  [0.55,1.0,0.3,0.35,0.4,0.2,3,0.6,0.3], cushion.fibre [0.2,0.1,0.4,0.2], petal[0] 0, cushion.seam [0.06,0.4,40,1.0],
  lane [0.19,0.08,0.8,0.0,0.002,0.03,0.6,0.0,0.5,0.8,10,0.1,0.35,1.2], heat.pen 0.7, spot.edge [0.5,0.9].
  MEASURED final frame 90: plain 30.2146, low64 7.1483 (h37 8.1237, main 10.9492), bands [1.43 1.05 0.94 0.98 1.04
  0.99 0.96], parts ground 50.5606 strip 52.0738 sky 9.2196 (standing 9.0457: 0.174 over; h37 9.18), curve middle
  to border [0.735 0.75 0.747 0.74 0.718 0.683 0.631 0.569 0.491 0.418 0.355] (approved [0.667 0.662 0.657 0.647
  0.619 0.586 0.547 0.496 0.433 0.369 0.324]: largest gap 0.099 at 0.3 of the way, the limit is 0.05: RED, h37
  0.027), lane 4.98 px (3.36, 7.01; approved 7.08: RED, h37 5.61), rim mean px 1 2 3 4 5 6 8 10 12 16 20: 0.382
  0.458 0.500 0.535 0.567 0.593 0.639 0.676 0.704 0.750 0.781 (approved 0.310 0.376 0.435 0.491 0.531 0.559 0.599
  0.627 0.646 0.672 0.690), far shares 0.433, 0.132 (0.538, 0.196), cells with a dip over 0.04: 0.059 (0.341),
  darkest band 0.094 (0.147), highlights over 0.95: 0.022 at g/r 0.872 (0.011, 0.851; h37 0.024, 0.930), near mean
  rgb 0.595 0.350 0.151 (0.555 0.315 0.135), penumbra medians 0.51 0.45 0.44 (0.62 0.47 0.49), umbra 18174 px
  level 0.068 g/r 0.32 (10524, 0.078, 0.60). MAIL 1402's lines at 90 on the lower 70 percent (v/l70.sh): low band
  16: 19.5061 (h37 20.954, standing 23.4775, main's UNKNOWN here), bands 1 to 2: 1.090, 2 to 4: 0.974, 4 to 8:
  0.999, 8 to 16: 1.053, under 1 px 1.339. At 60 (draft): low band 16 on that part 21.5176, sky part plain 11.176.
  Draft 90: plain 29.9409, low64 7.1278.
  FLICKER (near box disc 26 / band disc 26 / ellipse 90 by 45 / ellipse 70 by 35; largest, percent over a tenth):
  h39 0.284, 70.0 / 0.284, 43.5 / 0.074, 0 / 0.116, 9.7 (h37 0.246, 58.3 / 0.246, 42.4 / 0.069, 0 / 0.138, 9.4).
  The two disc rows are worse: RED.
  SEEN at 1 to 1 rows 800 to 1080: the near cells carry soft threads from the crown to the rim, the bed is nearly
  gone and the lanes are thin and dark, the lights are gold. What a viewer names: shells or mushroom caps with
  ribs, each a separate body with a firm outline, lighter than the approved all over the top. From row 800 upward
  (cells under about 40 px) the threads are under the fade limit and not drawn: pale stones with a blob, as h37.
  At the film's preview size (960) no thread is drawn at all, so the mp4 shows stones that change shape.
  SEEN in motion (five captures 12 film frames apart at 1920, eye held): the threads of a cell are different in
  each capture, the cells swell and change outline, lanes open and close; whether the threads travel or jump is
  UNKNOWN from captures 0.4 s apart.
  NEXT: (1) threads at every distance: choose the count of threads by their width in the picture (never under 3 px
  a column) instead of fading them to the mean; (2) the top darker and the fans on the flank that faces the eye
  (curve 0.099 over); (3) a strip of 2 s at 1920 on a box, every frame, to see the travel; (4) the straight edge
  in the big cell (a neighbour's dome cutting through); then points 4 and 5 of MAIL 1397.
- 04:54 UTC MAIL to /root (high): state h39 with the bundle (e285903a..0c3c1c5d) and nine pictures; no name for
  the third cut. 04:46 MAIL 1406 (pre-flight of names for the third cut; none from me). 04:39 MAIL 1405: main is
  23f1089b3cde1279798527c697ef5efbdff9eebf.
- 04:55 UTC. The number of threads follows the picture: weave[13] = least pixels to a column (the count is the
  cell's own count, halved until a column is that wide; base count 3 to 6 times a power of two, so the committed
  h39 config gives a slightly different picture from now on: 7 threads became 8, and so on), weave[14] = a
  thread's heat at the crown as a share of its heat from 0.7 of the way outward (the threads bunch to a brighter
  edge). t99 (4 px, 1.0), t100 (3 px, 0.6, thinner, floor 0.22) MEASURED: finest band 1.95, 2.17 (h39 1.43; RED,
  wrong way), 1 to 2 px 1.08, 1.10, low64 7.97, 7.46, penumbra medians 0.55 0.50 0.49 and 0.56 0.53 0.52, umbra
  15234, 13385 px. SEEN on rows 480 to 1080: every cell is ribbed now, to the limb; t100 is darker and nearer to
  the approved's tone, but the ribs are thin, hard and many: scratches, zebra shells. The approved grows softer
  with distance. Trials t101, t102: 6 and 8 px to a column, fading from 7 and 10 px.
- 05:03 UTC MAIL 1412 from the Builder (high), verbatim core: "Your state h39, read by me at 1 to 1 (one-h39f.jpg)
  and whole (lab-90-h39f.jpg). Not a name, as you say yourself. What my eye names: flat pale caps with ribs, like
  shells, every cell alike, each a separate body with a firm outline; the approved above it shows cushions with
  dark mottled tops, the light gathered in short fans on the flank that faces the eye, and wide lanes with depth
  between them. So the ribs are right as matter but wrong in place and in light: in the approved they do not run
  from the crown over the whole top, they sit on the shoulder and the flank. Order of work, changed in one place
  only: your point 2 first (tops darker and uneven, the light in fans on the facing flank, the curve inside 0.05,
  the lanes back to about 7 px), then your point 1 (threads at every distance, never under about 3 px a column),
  then the flicker by cause (0.284 and 70.0 percent are red and went the wrong way: a disc that sees threads pass
  must still read steady, so the threads' travel has to be slow against their width or their heat has to change
  smoothly, found by measure and not by slowing everything), then your 2 s strip at 1920, then points 4 and 5,
  births and splits. The sky part 0.174 over the standing ground: find the cause before the next state, it moved
  with no change of yours in the sky. The clock: this ground is out of the third cut; for the fourth cut a state
  has to pass line (iii) of MAIL 1402 by my eye before 11:30 so that handover, bake, reader rows and the master
  run fit before 13:30. You do not merge main: when a state passes I cut your files onto main's code myself. Your
  bundle h39 was not unpacked: it stands on e285903a, which I do not hold. When a state is a candidate, send one
  bundle that holds every commit from 0c3c1c5d's first parent chain that I lack, or simply the whole branch from
  the last commit of yours that is on origin. Send the next state when point 2 reads at 1 to 1, with the same
  pictures and numbers as this mail; no answer needed before that."
- 05:04 UTC. t101, t102 (6 and 8 px to a column): finest 1.88, 1.81; dip share 0.194, 0.103. Not looked at
  further: MAIL 1412 moves the threads off the top first.
- 05:05 UTC. `git fetch origin` and `git push origin agent/sun-lab` work again (MEASURED: e285903a..0c3c1c5d
  pushed, no force). Told /root in one low line. I do not merge main (MAIL 1412).
- 05:06 UTC. THE SKY PART'S CAUSE, MEASURED on the finals of frame 90 (h39 0.174 over the standing ground): 0.095
  of it lies in the three rows just above the mask's limb (0.6 percent of the sky's pixels): there the lab's
  picture is 17 levels lighter than the standing's, because the lab's ground stands 1 to 3 px higher at the limb
  and its last rows are 245 to 250 where the standing's are about 215 (the approved is 110 to 150 there, its limb
  lies lower). The other 0.08 lies in rows 3 to 200 above the limb, where the lab's picture is 0.06 to 2.2 levels
  lighter (the gas and haze over the limb take light from the ground under them). h39 against h37 (0.04): rows 3
  to 100 above the limb 0.15 to 0.7 levels lighter, mostly at cols 0 to 480; the 3 rows at the limb only 0.004.
  So it moved with the ground's last rows before the limb getting lighter (the refit curve and heat.gold), not
  with anything in the sky's own code. Draft against final adds 0.62 for every ground (the corona's samples).
  Cure to try: heat.graze[0] 1.3 toward 1.1 (the ground at a grazing look less hot), and the dome's height
  toward the limb.
- 05:07 UTC. For MAIL 1412 point 2: weave[14] to [16] (a thread's heat at the crown as a share, and between which
  shares of the way to the border it comes to full), weave[17], [18] (fans: the heat of the threads in the dark
  sectors as a share, and how much of the round is dark; the sectors are the three lobes of the cell moved by
  the swells). The blob is off (floor 1.0) or weak, patches on the top 0.3, lane[4] 0.004. Trials t103, t104.
- 05:11 UTC. t103, t104 (threads only from the shoulder outward, in fans, blob off, patches 0.3, lane 0.004): at
  1 to 1 still flat plates with a firm outline, the fans all round each plate like a daisy; curve 0.63 to 0.70
  flat to 0.7 of the way and then a cliff; lane 4.6 to 4.8 px; under 1 px 2.2 to 2.5 times the approved's. FAILED.
- 05:17 UTC. weave[19], [20] (a thread on the flank keeps its own heat where the cushion has cooled). t105 (h37's
  blob, 12 threads, wider) and t106 (the same, dome.height 0.45): softer, still plates. heat.graze[0] 1.15
  brings the draft's sky part from 8.6004 to 8.542 (standing 8.4355).
- 05:18 UTC. WHAT THE APPROVED SHOWS AT 2 TO 1 (v/ap2x.jpg, rows 820 to 1080), written down so I do not lose it:
  cushions pressed together, their tops dark amber and mottled; the light is in fans of short streaks that run
  down the flank into a dark pit, and it is always the flank on the far side of the pit, the one that faces the
  eye; the near cell shows its dark top and hides its own far flank. Between two cells there is often only a
  soft crease; the dark is in the pits where three meet. Many hot points of 1 to 3 px on flanks and creases.
  WHY MINE ARE PLATES, MEASURED in the code: the body is (1 - e^2)^2 times dome.height times the radius, a bell:
  its steepest slope is 1.54 times 0.32 = 0.49 (26 degrees) at 0.58 of the way and it is flat at the border.
  The eye looks down at about 36 degrees there, so no flank is ever hidden and every lane is seen all round:
  that is the firm outline and the plate. A flank that faces the eye can only stand out without any rule that
  knows the eye if the far flank is truly hidden, so the body has to be a cushion that is steep at its border.
  Trials t107 (dome.base[4], [5] = 2.2, 1.5: (1 - e^2.2)^0.667, height 0.36) and t108 ((1 - e^2.2), 0.45), with
  dark tops (navel 0.45 to 0.65 of the way, blob off) and hot threads on the flank only.
- 05:23 UTC. t107, t108 (cushion profile at heights 0.36 and 0.45, dark tops, hot threads on the flank): still
  plates, now with a light rim all round (a bevel, MAIL 1368 forbids it). The far flank is hidden only where the
  slope is over the eye's 36 to 45 degrees, at these heights the last 7 percent of the way. FAILED.
- 05:28 UTC. t109 (dome.height 0.7, body (1 - e^2.2)^0.667) and t110 (height 1.0, (1 - e^2.2)). t109 is the
  first picture in which the cells are bodies: cushions that stand before the ones behind them, the far flank
  hidden, the near flank wide and carrying the threads, so the light sits on the flank that faces the eye with
  no rule that knows the eye. t110 is haystacks, too pointed: FAILED. Draft numbers of t109: sky part 8.5101
  (standing 8.4355, h39 8.6004), strip 41.72 (h39 about 52), low64 11.54 (worse, the tops are dark), curve
  [0.604 0.59 0.597 0.616 0.625 0.619 0.614 0.595 0.565 0.493 0.37], lane 4.85 px, under 1 px 1.92.
  Still wrong in t109: the threads are short white dabs, the lanes are thin cracks, the tops too even.
- 05:34 UTC. t111 (height 0.7, threads long: 1.2 rows a unit run, from 0.45 of the way outward) and t112 (height
  0.55, body exponent 1/1.3): t111 reads as cushions with dark mottled tops and threads running down the near
  flank; t112 is flatter and falls back toward plates. Height 0.7 or more it is.
- 05:39 UTC. t113 (lane[4] 0.009, seam 0.12, tone [0.8, 0.4]) and t114 (lane 0.013, height 0.6): the lower flank
  now darkens softly into the crease, lanes with depth; lane 5.6 px, curve [0.597 0.605 0.618 0.621 0.626 0.624
  0.602 0.571 0.523 0.436 0.328]. MEASURED palette by level (rows 800 to 1080): the same as the approved's within
  0.02 at every tenth of red, so what differs is where the light lies, not its colour: bands 4 to 8 px 0.77,
  8 to 16 px 0.74, under 1 px 1.72.
- 05:44 UTC. weave[21] (the flank's heat in the dark sectors as a share: the fans are broad lit sectors, the
  threads a finer comb on top of them). t115 (weave[21] 0.45, threads weak 0.65) and t116 (the same, height 0.8,
  dome.base[7] 0.5: the bodies stand lower where three meet, pits): bands 4 to 8 px 0.92, 8 to 16 px 0.92,
  under 1 px 1.46 to 1.51; curve of t116 [0.668 0.669 0.67 0.667 0.662 0.648 0.623 0.582 0.53 0.437 0.346]
  (largest gap 0.097 at 0.8 of the way), lane 5.6 px. To my eye the form is now the approved's (round bodies
  pressed together, pits) but with weak threads they read as boulders: the fibre is what makes it gas. t117,
  t118: stronger and finer threads on the lit flank.
- 05:50 UTC. t117, t118 (threads stronger and finer on the lit flank, height 0.75, pits 0.3): mushroom caps with
  fine fibre; the light too even over the body. weave[22] added (the light begins further up the top in a lit
  sector).
- 05:55 UTC. t119 (navel [0.4, 0.7]) and t120 (navel [0.3, 0.8], crest 1.4): the tops dark and mottled, the light
  in fans on the flank that faces the eye, the threads running down into the crease. t120 draft: curve [0.646
  0.652 0.65 0.646 0.642 0.625 0.599 0.57 0.523 0.437 0.362] (largest gap 0.09 at 0.8 of the way: the lit flank
  is where the approved's cell is already falling), lane 5.6 px, bands [1.64 1.0 0.90 0.92 0.96 0.96 0.96],
  low64 9.46, sky part 8.5858 (standing 8.4355), strip 43.4. STATE h40 = t120; chain started 05:55.
  Read of t120 by me: the form is the approved's kind for the first time (bodies, depth, a facing flank). Still
  wrong: paler and more even than the approved (its fans are white gold against dark brown, mine tan on tan),
  the bodies read as caps of one make, small cells have no threads, no hot points.
- 06:14 UTC. STATE h40 (= t120 after its own refit), MEASURED. Final frame 90: plain 30.5521, low64 9.4256 (h39
  7.1483, main 10.9492), bands [1.41 1.02 0.92 0.94 0.98 0.98 0.98], parts ground 51.8701 strip 43.6791 (h39
  52.07) sky 9.2068 (h39 9.2196, standing 9.0457), curve [0.637 0.633 0.629 0.632 0.631 0.623 0.598 0.561 0.515
  0.434 0.358] (largest gap 0.082 at 0.8 of the way, RED; 0.065 at 0.7 and 0.9), lane 5.62 px, quartiles 3.6
  and 7.6 (approved 7.08, RED), dip share 0.195 (approved 0.341), over 0.95: 0.022 at g/r 0.871, penumbra medians
  0.40 0.35 0.32 (approved 0.62 0.47 0.49: darker than h39's), umbra 23616 px (approved 10524, worse).
  MAIL 1402 lines at 90: low band 16 on the cut 22.0579 (h39 19.5061, h37 20.954, standing 23.4775), bands
  1.073 0.963 0.965 0.980, under 1 px 1.320. Frame 60 draft: low band 16 24.2083 (h39 21.5176), sky part plain
  11.1763 (main's 11.5380), bands green.
  FLICKER (largest, share over a tenth): near box disc 26: 0.158, 14.3 percent of 7 cells (h39 0.284, 70.0);
  band disc 26: 0.216, 27.8 percent of 54 (h39 0.284, 43.5); ellipse 90 by 45: 0.075, 0; ellipse 70 by 35:
  0.087, 0 (h39 0.116, 9.7). Not by slowing anything: the threads are now on the flank and the disc sits on a
  top that is dark and even.
  The sky part: heat.graze[0] 1.15 gave 0.013 only. The rest is the three rows at the limb (the lab's ground
  stands 1 to 3 px higher than the standing ground's there) and the light of the gas over it: still open.
  My read at 1 to 1 (v/c-h40f.jpg): bodies with depth, dark mottled tops, the light in fans on the facing flank,
  creases with depth. Wrong: caps of one make (mushrooms, shells), paler and more even than the approved, no
  white gold against dark brown, small cells bare, no hot points; at 960 the ground reads as petals.
- 06:16 UTC. MAIL to /root (high): state h40, commit 62bda846 pushed, eight pictures, not a name.
- 06:21 UTC. Code: heat.lane[3] now also in the seam (a flat dark bottom of that share of the lane's width),
  dome.vary (a cell's height differs by its seed), dome.drop (the whole lab ground lower by that many stage
  units, for the limb line). t121 (blob floor 2.0: the top is the dark field inside the blob's lobed outline,
  fans narrower and whiter) and t122 (the same, lane[3] 0.25, pits 0.5 within 0.03): to my eye the nearest to
  the approved's light so far, white gold fans on dark brown, wide dark creases; but the threads are thin white
  lines (scratches) and the low band 16 px of the cut is 24.17 (draft; h40 22.06, standing 23.48): over.
  WHERE THE LOW BAND'S ERROR LIES, MEASURED (blur 16 px, rows 324 to 1080, in boxes of 320 by 126): the penumbra
  and its surround (rows 576 to 828, cols 640 to 1600) are 25 to 55 levels darker than the approved in t122
  (h39 12 to 35), and the place right of the spot (rows 576 to 954, cols 1600 to 1920) 40 to 60 darker in every
  state and in the standing ground too. The near ground itself is within 20. So line (i) is the spot's
  brightness: the refit with dark tops pushed the penumbra down (medians 0.25 0.18 0.18 against the approved's
  0.62 0.47 0.49). t123: heat.pen 1.1, spot.edge [0.35, 0.7], threads thicker with a glow between them (0.55).
  t124: the same with spot.depth 0.07, wall [0.8, 2.2], dome.drop 0.004.
- 06:32 UTC. t123 to t126, MEASURED: tone halved ([0.35, 0.3]) with the blob floor 2.0 brings the penumbra back
  (medians 0.37 0.33 0.29 at pen 0.9); spot.tongues [100, 64], hot 2.4, gap [0.05, 0.3] give 0.46 0.41 0.41 and
  an umbra of 14393 px; low band 16 px of my cut 22.45 and 21.70. dome.drop 0.004 moved the limb by under a
  pixel. THE LIMB, MEASURED by rows about the mask's last sky row: with the bodies 0.75 high the lab's limb
  stands 4 to 6 rows higher on the left (cols 0 to 480: 123 against the standing's 91 at six rows above the
  mask's line); a px at the limb is about 0.008 stage units, so dome.drop about 0.012 would bring it back.
- 06:33 UTC. MAIL 1429 from /root (high), kept in full in the thread; its core: h40 is the base (not h39), not
  in the name as it stands. RIGHT and to keep: the size of the near cells, the hidden far flank, the far field's
  density, THE SPOT, the arcade. WRONG: (2) EDGE: a crisp pale rim over a thin seam, caps that lie ON a floor;
  the approved's glow falls into the lane over a visible width (gold, brown, near black), neighbours press
  against each other, a net of valleys. (3) FACE: evenly pale, chalk; the approved has fine fibres from the lane
  up the flank toward the crown, the crown mottled, brightest where the fibres meet, only small parts near
  white. (4) LANES: empty; the approved has small bright points and thin bright threads at the corners.
  (5) the largest contrast must be crown to lane, not cap to seam. ASKED by cause: (a) hot crown, cooler flank,
  cold lane, the fall over a width, no rim line; (b) fibres on the flanks as flow lines of the field that moves
  the cells; (c) bright points and threads in the lanes; (d) no cap may slide as a body: swell, split, sink.
  One state mail when a state does 2 to 4 to my own eye: 60 and 90 at FINAL beside the approved at HIS CROP
  (x 0.28 to 0.62, y 0.62 to 0.96 = cols 538 to 1190, rows 670 to 1037), the low band whole and on rows 540 and
  under (his numbers with bands.py: main 15.303 whole, 27.289 rows 540 and under; h40 14.653, 25.873; bands of
  h40 1.111 0.977 0.969 0.981), the bands, my list. Name the box of my own low band (mine was the cut of rows
  324 to 1080). TELL sun_builder at the same time which commit he takes: his name closes 13:30.
  So the dark tops of MAIL 1412 are overruled by "hot crown": the trials t121 to t126 (dark field on top) stop.
  t127, t128: the blob back as the cell's own heat (hot crown, wide fall), threads from the crown down the
  flank that keep their heat on the cooler flank, no flat lane bottom, lane 0.009.
- 06:40 UTC. t127, t128 READ at 1 to 1 and at the Builder's crop: hairy caps on a TAN floor. The lane was not the
  coldest place: the seam's heat ([0.12, 0.4]) lay over the cooled flank's, and the refit curve lifts the low end,
  so the lanes came out tan and the bodies stood on a floor. The thin threads (18 round the crown, 4 px a column)
  on a dark flank are hairs. Views of the shader (lab.json "show": edge, seam, tall, cell, deep, junc; v/show.sh)
  showed the lanes where they should be; the haze is not the cause (tau 0.0006 in the near field).
- 06:50 UTC. t129, t130 (seam [0.03, 0.1], lane 0.007, threads 12 and 9 round the crown, 8 and 12 px a column,
  half width 0.6 and 0.75 at the top so the fibres are broad soft streaks with thin dark gaps, crown smoother
  (weave[14] 0.3), blob floor 0.35): the floor is gone, the lanes are dark, the fibres read as streaks of gas and
  no more as hair. MEASURED t130 draft: curve [0.685 0.687 0.687 0.684 0.673 0.648 0.608 0.553 0.475 0.384 0.323]
  (largest gap to the approved 0.062 at 0.5 to 0.7; h40 0.082), lane 5.55 px, cut low band 22.14, sky 8.70.
  Still wrong: each body has a dark outline all round and a crisp silhouette: polished pebbles in a pile.
- 06:56 UTC. t131, t132 (profile 2.0 / 1.1, a parabola, at height 0.75 and 0.9): pointed mounds, nuggets. FAILED,
  the profile stays 2.2 / 1.5.
- 06:57 UTC. Code: heat.corner [heat of the fibre ends where three cells meet, from which share of the way, to
  which, how many times stronger the small hot points are there]. t133: lane 0.004 (black only in the bottom of
  the valley), shoulder 0.6 within 0.4, corner [1.2, 0.7, 0.9, 3], sparks 0.6 of 1.5 to 3 px near the border.
  t134: the same, blob floor 0.5, seam [0.03, 0.25, 15] (a glow in places).
- 07:02 UTC. t133, t134 READ: the black is only in the bottom of the valley now and the bodies press closer; the
  corner points are too few to judge at the draft tier (draft pixels are 2 px). Still polished solids: crisp
  silhouettes, a clean cut at every base.
- 07:05 UTC. THE GAS MARCH BACK ON (gas.steps 12; it was built at f1 and never tuned). t135 = t133 with skin
  [20, 0.005], pool [30, 0.012]: the bases of the bodies fade into glowing gas, silhouettes softer, the first
  state where the fall into the lane has a width by cause. MEASURED t135 draft: curve [0.68 0.682 0.678 0.664
  0.649 0.622 0.572 0.521 0.454 0.386 0.34], largest gap to the approved 0.036 (inside 0.05 at every tenth for
  the first time), lane 6.18 px (7.08), sky part 8.4711 (standing 9.0457), plain 29.9162, cut low band 21.56.
  Wrong: the glow is tan and hides the dark of the lanes; the umbra fills (4657 px against 14301).
  Code: gas.spot [from, to] in pit widths (the gas thins toward the spot; was 2.0 to 3.5 fixed);
  weave[23], [24]: the fibres bend toward the nearest point where three cells meet on their way down the flank
  (vBend from the vertex shader: the turn to the meeting point of the two nearest borders, nothing at the middle
  of a border); [23] the share of that turn at the border, [24] from which share of the way.
  t136: gas skin 12, pool 20, glow level 0.6 (haze.level; the gas glows cooler than the ground), spot [3, 5],
  bend 0.4 from 0.3. t137: glow level 0.9, pool 30.
- 07:11 UTC. t136, t137 READ: the fibres gather into fans toward the corners. MEASURED draft: plain 30.44 / 30.32,
  sky 8.49, cut low band 21.91 / 21.92, umbra 11388 / 7847 px, curve gap 0.075 / 0.066 at 0.6 to 0.7.
- 07:18 UTC. t138 (skin [40, 0.008]), t139 (skin [80, 0.008], dome.vary 0.25): softer, the bases dissolve.
  MEASURED t139 draft: plain 30.2009, sky 8.4065, cut low band 22.57, umbra 2617 px (too small: the refit curve
  lifts the darks to 0.10), lane 5.88 px, curve gap about 0.065, bands [1.57 0.98 0.86 0.88 0.95 0.94 0.83].
  To my eye still glazed bulbs with crisp upper silhouettes. Config kept as v/lab-t139.json.
- 07:19 UTC. THE CAUSE OF "A CAP SLIDES AS A BODY", MEASURED from the table (tool slide.ts: frames 60, 75, 90,
  cells with a radius over 0.05): the way of a cell's middle in 1 s is 0.493 of its radius at the median, 0.958
  at the 90th, 1.951 at the most; the change of its radius is 0.157 / 0.494. The caps travel three times more
  than they swell, because crown and pattern hang on the centroid of a ground that changes with every birth and
  death next door. With the crown at the cell's site (clamped to 0.6 of the way to any border): relax 0.3:
  0.420 / 0.863; relax 0.1: 0.195 / 0.754; relax 0.03: 0.174 / 0.624; relax 0: 0.189 / 0.611.
  Code: dome.anchor [share of the way from the centroid to the site, most share of the way to any border].
- 07:26 UTC. t140 (anchor [1.0, 0.5]), t141 (the same, sim.relax 0.1; the table changes, so the far twin must be
  baked again before a name). MEASURED draft: t140 plain 30.3298, sky 8.4344, cut low band 22.3146, curve
  [0.666 0.674 0.657 0.636 0.625 0.607 0.565 0.515 0.452 0.389 0.329] (largest gap 0.021: inside 0.05 at every
  tenth), lane 6.09 px, umbra 2664; t141 plain 30.331, sky 8.439, cut 22.4036, curve [0.681 0.671 0.664 0.66
  0.645 0.617 0.581 0.531 0.464 0.387 0.332] (largest gap 0.035), lane 5.83 px, umbra 2873.
  READ: no lopsided dunes; the layout holds. Still wrong to my eye: glazed bulbs, hard streaks, crisp silhouettes,
  the dark of the lanes filled by the gas glow.
- 07:27 UTC. Code sim.heir (a cell that is no split wells up beside the cell nearest its end): slide with the
  centroid 0.417 / 0.846 at 0.5 and 0.421 / 0.846 at 1.0 against 0.493 / 0.958. A small gain; the neighbours'
  growth moves the centroid, not the births. Key left out of lab.json (off).
- 07:28 UTC. Final of t141 running (v/t141f.log) to judge at 1 to 1; draft pixels are 2 px.
- 07:38 UTC. FINAL of t141 (605 s with the gas, 16 samples; the draft tier is 1 sample at full size, so its
  hardness is aliasing). READ at 1 to 1: tall mounds with marbled patches, polished agate; hardly any dark net
  between them because every body hides the valley behind it. Not points 2 to 4. G17 by tools/measure/g17.py on
  my final picture (with grain; the gate uses no grain): median 1.347 for t141f and for h40f (line 0.8).
- 07:40 UTC. Code heat.cushion.root [depth, threads round a cell 0.05 wide, where the longest and the shortest
  end (0 crown, 1 border), half width at the lane in columns, longer at three cell points, wider there, columns a
  pixel where they fade to their mean, share of the turn to the three cell point, from which share of the way,
  unevenness of the ends, mean]: dark threads of sunk gas rooted in the lane (labRoot).
  t142 (root), t143 (root, no dark sectors, gas glow 0.6): fine dark hair on the flanks, lanes darker; plain
  30.76 / 31.38, cut low band 22.83 / 22.97, sky 8.43 / 8.47. Still mounds.
- 07:52 UTC. t144 (height 0.45), t145 (height 0.3): the dark net of lanes shows on all sides, but 0.3 is cracked
  mud and 0.45 a quilt of pads with hairline lanes. cut low band 24.53 / 25.66 (over the standing 23.48), sky
  8.21 / 8.28. FAILED as they stand.
- 07:56 UTC. WHERE THE LOW BAND IS LOST (v/rows.py: low band and mean by bands of 108 rows): rows 540 to 756 are
  27 to 36 levels darker than the approved (lab 88 / 75, approved 118 / 102) in every state from h40 to t146;
  rows 864 on are level. The far field and the ground round the spot are too dark and too brown: the approved's
  far field is bright gold and fine. Tall bodies at a grazing look show their dark bases; the gas glow at 0.6
  takes more.
- 07:59 UTC. t146 (height 0.45, weave weak, tone wider, roots at corners), t147 (the same at 0.75): pads with
  thin lanes / satin boulders with wood grain (the ends of the roots follow the well noise: contour lines).
  Code gas.heat [heat of the gas over the cells, heat of the gas sunk in the valleys] as shares of the ground's
  heat under it: the hot gas wells up over the cells and glows, the cooled gas lies in the lanes.
  t148: height 0.45, valley black 0.012 wide, shoulder 0.4, gas heat [1.3, 0.5]. t149: height 0.75, gas [1.4, 0.5].
  NOTE: ground.ts was edited while t147 rendered (gas.heat, default [1, 1], the same picture); not again.
- 08:05 UTC. t148 READ: the first state that is one sheet of pressed cushions with soft dark valleys (height
  0.45, the valley's black 0.012 wide, shoulder to 0.4, hot gas over the cells and cool gas in the valleys).
  Wrong: wood grain on the faces, the lanes muddy. t149 (0.75, gas heat 1.4): golden nuggets, the umbra filled.
  MEASURED t148 / t149: plain 30.96 / 30.48, cut low band 22.26 / 21.52, sky 8.30 / 8.54.
- 08:11 UTC. t150 (t148, weave without contrast: [7] 1, [17] 1, [20] 0, [21] 1; roots straight ended, 14 round,
  pool heat 0.35, gas.spot [5, 9]), t151 (the same, height 0.55): clean pillows pressed together, dark valleys
  with combed threads. plain 30.35 / 30.21, cut 22.17 / 21.98, sky 8.27 / 8.28, curve gap 0.07 at the middle
  (the crown too light), lane 5.54 / 5.73 px. The umbra is a brown star (474 px): the refit curve lifts heat
  0.04 to level 0.12 because the valleys are cold, and the strands' ends in the umbra (0.04 of their heat)
  come up with it. Code spot.dark (that share, 0.04 before).
- 08:18 UTC. t152, t153 (seam heat [0.3, 0.3], patches smaller and sharper, limb law [1.4, 0.5]): FAILED to the
  eye though the numbers were the best (plain 29.70, cut 20.69): the valleys turn into an orange floor
  (mushrooms on a floor, the tan floor again) and the patches are leopard dabs. The seam stays cold [0.03, 0.1].
  Kept: the limb law [1.4, 0.5, 0] (rows 540 to 648 six levels lighter).
  Code root[12], [13]: hot tongues between the dark threads; the number of threads round a cell from its seed
  (0.7 to 1.3 of root[1]) and no more from its size, so no thread pops in or out as a cell grows.
- 08:24 UTC. t154 (t151, limb law, tongues 0.6, patch [0.4, 0.5, 0.35, 0.75, 0.3]), t155 (crown against flank
  stronger): plain 29.85 / 30.28, cut 20.83 / 21.45, sky 8.37 / 8.32, lane 5.54 px, bands 0.92 0.86 0.94 1.04.
  READ: pillows of one sheet, soft valleys; but matte like dough or leather: the skin gas (80 by 0.008 is an
  optical depth of 0.64 over every body, more aslant) lays an even tan veil over the tops. t156: skin 30,
  spot.dark 0.012. t157: also corner 2.0, sparks 1.2, tongues 1.2.
- 08:30 UTC. t156 (skin gas 30, spot.dark 0.012), t157 (also corner 2.0, sparks 1.2, tongues 1.2): plain
  29.81 / 29.74, cut low band 20.64 / 20.57, sky 8.45 / 8.45, lane 5.4 px, umbra 1416 / 1490 px (474 before),
  bands of t157 1.02 0.88 0.91 0.97. To the eye nearly the picture of t154: the veil was not the cause.
- 08:27 UTC. MAIL 1439 (Builder, seen c-t154): the form is the right direction (one sheet of bodies pressed
  together, soft dark valleys). What reads as a solid is the light: every cushion has a lit flank toward the
  upper left and a shaded flank away from it, with a sheen. Asked: take the side light and the sheen out, the
  level of a point follows its heat alone (crown, fibre, flank, lane); roundness by the heat falling toward the
  edge, not by a shadow. MAIL 1412 stands (no merge). State by 10:00, ruling 11:30.
- 08:32 UTC. THE SIDE LIGHT MEASURED (v/side.py: in the Builder's box, the mean light 6 to 24 px from a lane
  pixel in eight directions; a lane pixel is one under 0.55 of the 12 px mean): the approved has below a lane
  0.284 and above it 0.287 (difference -0.003); t154 0.325 and 0.274 (+0.051), t157 +0.060, t141f +0.030,
  h40f +0.012. Right against left is level in all (0.003 to 0.008). CAUSE: no lamp is in the code (the only
  term of the eye is the limb law by the ground's up). It is the form with the heat: a tall body seen aslant
  shows its top and its near flank, the far flank is hidden; the heat falls smoothly from crown to lane (blob
  floor 0.35 outside 0.45 of the way, shoulder to 0.4 over 0.4 of the way), so every body is pale above and
  dark below, a smooth gradient that reads as a lamp from behind. The gas over the tops at 1.3 of the ground's
  heat adds a pale band where the look runs longest through it (the far edge of each top): the sheen.
  t158: blob floor 0.8, shoulder 0.25 wide, gas heat [1.0, 0.35]. t159: also the dark threads climb higher
  (root ends 0.15 to 0.6 of the way).
- 08:38 UTC. t158, t159 READ: FAILED. Side measure +0.046 / +0.057 (no better); t159 is draped satin cloth (the
  dark threads climbing to 0.15 of the way: wood grain again). plain 29.91 / 30.18, cut 21.51 / 20.96.
  So the smooth fall of the body's heat is not the whole cause. Older pictures by the same measure: t144 +0.034,
  t145 +0.025, t148 +0.028 (height 0.45, weave contrast on, pool heat 0.5), t150 +0.052 (the same without
  weave contrast, pool heat 0.35), t151 +0.060, h40 +0.010 to 0.012.
  READ of the approved at 2 to 1 (v/ap2x.jpg): its near white is not on whole crowns. It is in streaks 3 to 5 px
  wide and 20 to 50 px long on the flanks, in fans that run together toward the dark points where three cells
  meet; the crowns are mid orange with dark mottles; the far edge of a cell is as dark as its near edge. In the
  lab the top quarter of the levels is whole pale tops (tan), so the tops read lit and the flanks shaded.
- 08:45 UTC. t160 (t158 with height 0.45, corner threads [2.5, 0.3, 0.8, 3], patch 0.55), t161 (also pool gas
  3): side +0.039 / +0.038, plain 29.50 / 29.46, cut 20.72 / 20.67, sky not read. Still foil nuggets: pale
  blotched tops. t162: the weave with contrast again but on the flank only and no dark sectors (between threads
  0.45, threads 0.3 of their spacing wide at the border, none on the crown, the threads keep 1.35 of the tone
  where the body cools, blob floor 0.6). t163: the same without the dark roots.
- 08:51 UTC. t162 / t163 MEASURED: plain 29.31 / 29.16, cut low band 19.81 / 20.18, side +0.030 / +0.034, bands
  1 to 16 px 1.20 0.94 0.82 0.76 (too little at 4 to 16 px), lane 5.43 / 5.56 px. READ: fibres on the flanks,
  still nuggets with pale blotched tops; pale lines along the borders from the corner threads (a rim line: wrong).
  At 3 to 1 (z-t162): the dark threads that bend to the three cell points draw arcs like wood grain.
- 08:57 UTC. t164 (t162 with tone spread [0.8, 0.4], corner 1.2, between threads 0.3, threads 1.6 of the tone from
  0.2 to 0.6 of the way, patch 0.35), t165 (the same at height 0.35, valley black 0.008): plain 29.49 / 29.45,
  cut low band 19.34 / 19.29 (best so far), side +0.021 / +0.018, bands 1.20 0.97 0.87 0.82 / 1.22 0.98 0.86
  0.79, lane 5.65 / 5.43 px. READ: bright streaks now on the flanks and the tops less pale; still crumpled foil
  to my eye: the streaks are smooth satin bands, the tops carry wavy pale bands.
- 08:57 UTC. Code heat.fan [strength, streaks in a quarter turn, length in cell radii, half width in columns,
  where they begin, share of columns left empty, mean where too fine]: streaks of hot gas round each point where
  three cells meet, like a fan about that point (the approved's bright fans run together to the dark points
  between three cells, not to the crowns). Vertex: vFan (the turn about the point from the ways to the two
  nearest borders, the way from it, and a fade where the second nearest border changes). None in the lane (times
  the seam's share). t166: fan [1.0, 5, 0.6, 0.3, 0.06, 0.3, 0.15]. t167: [2.0, 7, 0.8, 0.25, ...], corner off.
- 09:03 UTC. t166 / t167 (fans): plain 29.30 / 29.23, cut low band 19.14 / 18.94, side +0.021 / +0.013, lane
  5.49 / 5.69 px. READ t167: the dark net of valleys shows on all sides and fans stand round the three cell
  points, but the streaks are 2 px lines (scratches) and the tops still carry wavy pale bands. The wavy bands are
  heat.cushion.grain [0.45, 1.5] (a flowing noise of plus and minus 45 percent over the top: reads as foil).
- 09:09 UTC. t168 (t167 with grain 0.2, patches [0.5, 0.7, 0.4, 0.8, 0.3], fan [2.0, 5, 0.9, 0.4, 0.06, 0.25,
  0.15]: fewer, wider, longer streaks), t169 (fan 3.0, blob floor 0.85). MEASURED draft: t168 plain 29.2215,
  low64 7.394, cut low band 18.5531 (standing 23.48, h40 22.06), side +0.005 (approved -0.003), bands
  [2.27 1.28 0.99 0.84 0.76 0.72 0.82], curve [0.622 0.621 0.619 0.621 0.616 0.601 0.579 0.537 0.472 0.38 0.309]
  (largest gap 0.045 at the middle: inside 0.05 at every tenth), lane 5.81 px, umbra 1617 px.
  t169: plain 29.40, cut 18.36, side +0.002, curve middle 0.589 (gap 0.078: out), umbra 3152.
  READ t168 at 1 to 1: no lit side by the measure and little by the eye, a dark net of valleys, fans at the three
  cell points. Still wrong: it reads as crumpled gold foil, hard and crisp where the approved is soft and glows;
  the bodies overlap like leaves at 3 to 1; arcs like wood grain where the dark threads bend; a red orange speck
  about 4 by 10 px at frame col 942, row 965 (a spark of middle heat in a dark valley, cause not proven).
- 09:09 UTC. STATE h41 = t168 (v/lab-h41.json). Chain v/chain-h41.sh: final 90, final 60, film 60 to 120 with
  the flicker rows (markers FINAL90 DONE, FINAL60 DONE, MOV DONE, CHAIN DONE; log v/chain-h41.log).
- 09:19 UTC. FINAL of h41 at 90 (16 samples). MEASURED with v/bands.py against sun-close.jpg: whole frame low
  band 16 px 12.1024 (h40 14.7244; the standing ground by the same tool 15.592; the Builder's main 15.303), plain
  29.6361 (h40 30.5521; standing 30.4864; the Builder's main 29.558); rows 540 on: low band 24.4501 (h40 25.873 by
  the Builder, main 27.289; standing by my tool 31.6089), plain 49.2355 (main 49.735); bands 1 to 2, 2 to 4, 4 to
  8, 8 to 16 px: 1.289 1.040 0.879 0.791 (green; under 1 px 1.547); cut rows 324 on: low band 18.3481 (standing
  23.4775), plain 38.5862 (40.1645); sky part rows 0 to 324 plain 7.0417, the same as the standing ground's
  (nothing of the ground is in those rows at 90). By my readers: plain 29.3095, low64 7.265, curve [0.617 0.62
  0.623 0.62 0.614 0.6 0.581 0.551 0.484 0.394 0.315] (largest gap 0.055 at the 0.7 tenth, 0.05 at the middle),
  lane 5.61 px (quartiles 3.83, 7.71; approved 7.08), side +0.005, G17 by g17.py with grain median 1.698.
  Rows by 108: 540: -13 levels, 648: -18, 756: -10, 864: 0, 972: +7 (the far field and round the spot still
  too dark).
- 09:29 UTC. FINAL of h41 at 60. whole low band 13.7685, plain 32.912, bands 1.304 1.068 0.909 0.832; rows 540
  on: low band 25.2373, plain 50.4149; cut rows 324 on: low band 19.9201 (h40 draft 24.2083); sky part rows 0
  to 324 plain 11.4421 (main's own 11.5380 by the Builder).
  READ at 1 to 1 (m-h41f.jpg, z-h41f.jpg, lab-90-h41f.jpg): no lamp from a side, a dark net of valleys, fans of
  streaks at the three cell points. But the ground reads as crumpled gold foil with cracks: the streaks are
  crisp, the bodies end in hard silhouettes over one another (the valley behind a body is hidden), the outlines
  are angular, the lanes are thin cracks with black pools at the corners. The levels picture says why: in the
  approved the top level lies in round blobs in the middle of the cells and the dark levels in broad soft bands
  round every cell, on the far side too; in h41 the top level lies in streaks and planes and the dark in thin
  lines. So the approved's cells are low and their heat falls to the lane over a broad width on all sides.
  NEXT (t170, t171): height 0.3 / 0.4, shoulder 0.55 wide down to 0.25, valley black 0.014, blob floor 0.45, the
  dark on the bodies weaker (roots 0.35, patches 0.3, between threads 0.5), so the dark levels gather round the
  lanes. Then the fan about the meeting point itself (v/patch-fan2.py: the turn in the place's own frame, so no
  pop when a cell's border list changes).
  The red speck (col 946, row 970, rgb 200 79 32) moves with the cells (h40f had one at 901, 993): likely a
  spark under the cool valley gas, which glows red over it. Not proven.
