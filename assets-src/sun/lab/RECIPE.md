# Sun ground lab: recipe

One file is baked, in two sizes: the far twin of the ground for the globe (FAR-TWIN.md of sun_builder).

- The life of the cells is made at load by src/stops/sun/lab/sim.ts (life(), fixed step, from sim.from seconds before
  the first frame of sun.terrain, after sim.warm seconds of warm up): sums, products, quotients, square roots and a
  whole number hash only, so the table is the same on every machine. Parameters: src/stops/sun/lab/lab.json, sim.
- The map of the tile for the far ground is drawn by the page from that table at the frame's time
  (src/stops/sun/lab/ground.ts, define LAB_MAP).
- Pictures: `npm run still -- --frame F --tier draft --out out/work/sun/lab/NAME.png`.
- Pairs beside the approved crop (approved left): `python3 assets-src/sun/lab/pair.py PNG OUTBASE`.
- Life clip, capture frames A to B on one page: `npx tsx assets-src/sun/lab/clip.ts --from 240 --to 359 --out FOLDER`.
- Proxy of the pattern reading on a clip: `python3 assets-src/sun/lab/clipstat.py FOLDER`. Two stills:
  `python3 assets-src/sun/lab/est.py`.
- The standing ground comes back with `"ground": "standing"` in src/stops/sun/lab/lab.json.
- The far twin: `public/assets/sun/full/lab/place-far-0.jpg` (1280 by 1280) and
  `public/assets/sun/web/lab/place-far-0.jpg` (640 by 640), JPG quality 92, no chroma subsampling. Made by
  `npx tsx assets-src/sun/lab/bake.ts && python3 assets-src/sun/lab/level.py` (about 1.5 minutes, needs the dev
  server's page as the stills do). bake.ts opens the film's page with globalThis.labBake set, LabGround.bake() draws
  the ground's far form (the map of the cells of the tile, LAB_BAKE) from straight above every point: gnomonic about
  the spot, 40 degrees wide, north up, east right, seen from outside, the axes of far.level.axes (body frame),
  drawn at twice the size and brought down by Lanczos. Display colour after the grade, exposure 1, no view law
  (mu 1), no gas, no haze, no flare light, the large tone of the globe's map on, clock at 0. Parameters:
  src/stops/sun/lab/lab.json, far.level and far.tone. The files are a pure function of lab.json, the table of the
  life and the globe's map (public/assets/sun/full/wrap-color.jpg).
  Take kept (d7, 16:42 UTC 25 Nov): baked at the turned anchor, which is far.level.axes together with the turned
  numbers of src/stops/sun/place.json (stage.toBody, globe.spot, north, mapSpot, mapNorth, twin), taken from
  agent/sun-place f906d2ec. The umbra sits in the middle of the picture. Full 1,715,215 bytes, web 490,030.
- The table of the life alone, measured without a picture: `npx tsx assets-src/sun/lab/spans.ts`.
- The reader of a clip (largest and mean change of the pattern between pictures):
  `npx tsx assets-src/sun/lab/reader.ts --dir FOLDER --hold 0`.
- The one curve from the heat of the sheet to the heat the ramp shows (lab.json heat.curve):
  `python3 assets-src/sun/lab/curve.py P5 P25 P50 P75 P95 P99` with the six percentiles of the near ground of a
  frame 90 still (pair.py prints them) gives the next curve from the one that stands in lab.json; put it there by
  hand. It reads src/stops/sun/convect.json (ramp) and the approved's six numbers.
- The flow inside the cells on a clip, in px a film frame, radially from each cell's core:
  `python3 assets-src/sun/lab/flow.py FOLDER`.
- A rough reading of the cells' width in the lowest rows beside the approved:
  `python3 assets-src/sun/lab/size.py RENDER.png [FINEST_PX]`. It counts veins inside a cell as lanes and did not
  tell g15 from h9, so it is no proof of size.
- The rise read on my side: `npx tsx assets-src/sun/lab/clip.ts --from 437 --to 453 --tier draft --format preview
  --out FOLDER` (add `--still 437` to hold the ground's time at that capture while the eye moves), then
  `npx tsx assets-src/sun/lab/reader.ts --dir FOLDER --sheet OUT.png` (the sheet draws the first picture, the last
  carried back to it, their difference and the change of the pattern; `--job FILE` keeps the job).
- The cushion law of a cell's heat (lab.json heat.cushion, ground.ts DOME_FRAG; no baked file): navel (heat at the
  fan's root, reach), blob (how far the light reaches toward the border, lobes, swell, fan, softness, heat outside
  the light, lobes round the cell), fibre (fan amplitude, from, to, thread), patch (cooler patches on the top:
  amplitude, size, two thresholds of the swell field), grain (amplitude, size), seam (the heat of the place on the
  border: level, change, size of its field), rim (fine fibres of the finest count: amplitude, from, to on the way to
  the border, two thresholds, mean). dome.base[5] 0.5 makes the body a bell with no slope at its border.
  petal (short cooler strokes along the fan: amount, change along the run of two sizes, two thresholds, share of
  the finer size, how far the thresholds rise toward the border, from where). patch[4] says how far the patches
  are true to the pixel (0 a share of the cell, 1 a size in stage units). fibre.size (stage units): a cell of
  that radius has the stated counts; larger cells have more fibres, more change along the run and finer grain, so
  the texture keeps its size in the picture however large the cell (qSize in the shader, 0.4 to 3). fibre.along
  is the change of the three fan sizes along the run, a radius of a cell of fibre.size. cushion.fibre[3] is the
  strength of the thread term (hot threads of the three sizes) on the top.
  fibre.span is the least and the most of qSize. The lane (heat.lane): [4] the width of one side of the lane in
  stage units (0: a share of the radius as before), [5] and [6] its least and most as a share of the cell's radius,
  [7] how much wider it is where three cells meet (the junc field of the dome: from the ways to the two nearest
  borders of the own cell, radius dome.base[8]), [8] and [9] the shoulder: over the outer share [8] of the radius
  the top's heat falls smoothly to the share [9], then to the seam's heat on the border, which is the same from
  both sides. With heat.pit 0 and dome.base[7] 0 the junc field carries no step in heat or height.
  heat.lane[10] is the scale of a slow field of the place (0: off; `pool` in the shader, 0 to 1), [11] the least
  share of the shoulder where that field is low, [12] the lane's width there as a share (lanes thin between tops
  that fuse; the swell [7] at the crossings counts only where the field is high, so the lanes gather into dark
  pools in some places and nearly close in others), [13] how far the shoulder's start moves with the fan (the top's
  light ends in fingers along its fibres, not on a ring). cushion.seam[3] is a factor on the seam's heat where the
  field is low (1: none; over 2 it reads as a pale bed, do not use). Beyond its border a cell's skirt carries the
  seam's heat alone (no lit points, threads or sparks), so the small holes between three rounded corners show no
  bright posts. heat.lane[14] (the shoulder's width in stage units, 0: off) and [15] (wider at crossings in a pool)
  gave plates and stay 0. cushion.blob[7] shortens the reach of a top's light where three cells meet (the dark
  climbs the flanks from the crossings), [8] is the share of that where the place field is low.
  The penumbra: spot.tongues (strands round the spot, two ranks), spot.ranks (rows of strands per doubling of the
  radius: fewer rows, longer strands), spot.lean (a strand's half width as a share of its column, 0.5: side by
  side, less: dark between), spot.hot and spot.gap (heat of a strand and of the dark between), spot.ring (factor on
  that heat at the umbra's edge and from 2.2 umbra radii outward), spot.edge (the two radii of the umbra's edge in
  umbra radii), spot.floor (heat of the umbra's floor and of its dots), heat.pen (the level of the whole ring).
  The threads of a top: heat.cushion.weave (absent: off) = [0] threads round the crown of a cell of fibre.size,
  [1] the radius (0 to 1 of the way to the border) of the first doubling of their number, [2] rows of threads per
  unit of the run (fewer: longer threads), [3] a thread's half width as a share of its column on the top and [4]
  at the border, [5] where the thinning starts, [6] how uneven that is round the cell, [7] the heat between
  threads as a share of a thread's, [8] bend (a thread is an arc), [9] the mean when a column is too fine to
  draw, [10] how much sooner the threads thin where three cells meet, [11] and [12] the columns per pixel between
  which a rank fades to its mean. The threads are ranks of `labThread` in the cell's own frame (the angle round
  the crown, the run outward), two ranks at each of two counts, each thread of its own length and heat, soft at
  both ends and across, hottest toward its outer end; they ride outward with the cell's flow (the same flow as
  the fibres), so new ones rise at the crown and old ones go down at the seam. They are in the heat only: the
  mesh carries the tubes, not threads of 2 to 6 px. `labTongue` (the penumbra's strand) takes its lean and bend as
  arguments now (spot.lean, spot.bend).
  weave[13] the least pixels a column of threads may have (their number round the cell is 3 to 6 times a power of
  two and halves until a column has that many pixels), [14] a thread's heat at the crown as a share, [15] and [16]
  between which shares of the way to the border the threads (and the fans) come to their full heat, [17] the heat
  of the threads in the dark sectors as a share, [18] how much of the round is dark (the sectors are the lobes of
  cushion.blob[6] moved by the swells), [19] the heat of a thread's crest on the flank as a share of the top's
  tone and [20] how far it keeps that heat where the cushion round it has cooled, [21] the heat of the whole flank
  in the dark sectors as a share (the fans are broad lit sectors and the threads a comb on them), [22] how much
  further up the top the light begins in a lit sector.
  The body of a cell: dome.height times its radius, times (1 - e^base[4])^(1/base[5]) with e the share of the way
  to the border. With height 0.32 and base[5] 0.5 it was a bell with a slope of 26 degrees at most and none at
  the border, so at the eye's 36 to 45 degrees over the near ground no flank was ever hidden and a cell was a
  plate; with height 0.7 to 0.8 and base[4], [5] = 2.2, 1.5 it is a cushion that is steep at its border and
  hides its own far flank, so the flank that faces the eye shows wide and the lane behind a cell lies in its
  depth. base[7] lowers the body where three cells meet (within base[8] of the corner): pits.
  heat.graze[0] 1.3 to 1.15: the ground at a grazing look, at the limb, less hot (the sky part's rows above the
  limb take their light from it).
  heat.gold (absent: the ramp's own tone.white): the colour of the lab ground's ramp at its top. The ramp of
  src/stops/sun/convect.json is not edited; its top is whiter than any pixel of the approved (MEASURED: the
  approved's pixels over 0.95 have g/r 0.85 and b/r 0.585).
  LAB_TAIL in the environment of curve.py scales the slope of the curve past the 99th percentile (1 if not set).
  lab.json "show" (junc, edge, deep, cell, tall, seam) draws one field of the dome as heat, for finding a cause;
  absent in the film.
- Readers of frame 90 against the approved close image (pictures at 1920 by 1080, none of them writes a file the
  film loads): `python3 assets-src/sun/lab/match.py RENDER.png` (plain match, whole and by rows);
  `python3 assets-src/sun/lab/cells.py RENDER.png|approved [--box X Y W H] [--out OVERLAY.jpg] [--json FILE]`
  (curve from a piece's middle to its border, lane width; its count of pieces is no line, it splits cushions at
  their folds); `python3 assets-src/sun/lab/mask.py OUT.png [OVERLAY.jpg] [--film LAB.png STANDING.png]` (the three
  part mask: 255 ground, 128 the strip between the film's limb and the approved's, 0 sky; --film reads the film's
  limb again from a lab frame with haze.air off and a standing ground frame, else the cubic stored in the file);
  `python3 assets-src/sun/lab/parts.py PARTS.png FRAME.png ...` (plain match on each part).
  `python3 assets-src/sun/lab/rim.py RENDER.png ... [--out PLOT.png] [--box X Y W H] [--dark SHARE]` (level against
  the distance from the nearest lane, the approved first: mean, quartiles, the share of pixels far from a lane; a
  rim would show as a rise, a fall and a second rise). `--cells PLOT.png` reads the same by cell (the pieces
  between lanes, the largest of the near field): the profile of each, the dip of each (a fall after a rise) and
  the share of cells with a dip over 0.04, the approved's beside it.
  STATE h41 (26 Nov). New keys, all in lab.json:
  heat.lane[3]: the share of the lane's width from which the cell's own heat comes in over the seam's (0: from
  the border). dome.vary: how much the height of a body differs from cell to cell (by its seed). dome.drop: the
  whole ground lowered by that many stage units (0: off; it brings the limb back when the bodies are tall).
  dome.anchor [a, b]: the crown and the pattern of a cell stand at its site and not at the centroid of its
  ground: a is the share of the way from the centroid to the site, b the most share of the way to any border.
  The ground grows and shrinks round the site as the neighbours come and go, so a cell swells on one side and
  gives way on another and does not travel as a body (measured with slide.ts). sim.relax 0.1 (was 0.3): the
  sites follow the centroids of their grounds more slowly; this changes the table, so place-far-0.jpg is baked
  again (bake.ts). sim.heir (absent: 0): the share of new cells that are no splits and well up beside the cell
  nearest its end; measured as a small gain and left off.
  heat.corner [k, from, to, sparks]: where three cells meet the ends of the fibres are hot: k times the thread
  profile of the weave times the nearness of the three cell point, between the shares from and to of the way to
  the border; sparks: the factor on the small hot points there.
  weave[23], [24]: the fibres bend toward the nearest point where three cells meet on their way down the flank
  ([23] the share of the turn reached at the border, [24] from which share of the way). The turn comes from the
  vertex shader (vBend: the angle to the meeting point of the two nearest borders, nothing at mid border). In
  h41 the weave has contrast on the flank only and no dark sectors (weave[7] 0.3 between the threads, [14] 0.1 on
  the crown, [15], [16] = 0.2, 0.6 where it comes in, [17] 1, [21] 1, [19], [20] = 1.6, 0.7: a thread keeps 1.6 of
  the tone where the body round it has cooled), so the near white of the picture lies in streaks on the flanks
  and not on whole tops. The marbling of dark sectors on tall bodies read as polished stone.
  heat.fan [k, streaks in a quarter turn, length in cell radii, half width as a share of a column, where they
  begin in cell radii, share of columns left empty, mean where a column is finer than the picture shows]: streaks
  of hot gas round each point where three cells meet, like a fan about that point, each of its own length, width
  and heat; none in the dark point itself and none in the lane (times the seam's share). The turn about the point
  and the way from it come from the vertex shader (vFan: from the ways to the two nearest borders of the cell,
  faded where the second nearest border changes).
  heat.cushion.grain [0.2, 1.5] (was 0.45): the flowing unevenness of the top; at 0.45 it drew wavy pale bands
  that read as foil. heat.tone [0.8, 0.4] (was [0.55, 0.9]): the broad tone from cell to cell.
  spot.dark (absent: 0.04): the share of a strand's heat left where it ends in the umbra. With cold valleys the
  fitted curve lifts low heat, and at 0.04 the strand ends filled the umbra with a brown star.
  side.py: `python3 assets-src/sun/lab/side.py PICTURE ...`: is a cell lit from a side (the mean light below and
  above a lane pixel, and in six more directions). MEASURED: approved -0.003, h40 +0.012, t154 +0.051, h41 draft
  +0.005. The cause of the lit side was no lamp: the top quarter of the levels lay on whole tops of tall bodies,
  of which the eye sees the top and the near flank but not the far flank.
  heat.cushion.root [0] depth, [1] threads round a cell, [2] and [3] where the longest and the shortest end (0
  crown, 1 border), [4] half a thread's width at the lane as a share of its column, [5] how much longer they are
  where three cells meet and [6] how much wider, [7] the columns per pixel from which a rank fades to its mean,
  [8] the share of the turn to the three cell point and [9] from which share of the way, [10] unevenness of the
  ends by the cell's swells (0: the ends drew contour lines), [11] the mean, [12] the heat added between the
  threads (the hot gas pressed into tongues) and [13] its share away from the three cell points. `labRoot`: the
  gas that has cooled sinks back down the flank in thin dark threads rooted in the lane, two ranks, each thread
  of its own height and width.
  dome.height 0.45, blob floor 0.6, shoulder (lane[8]) 0.25, valley black (lane[4]) 0.012.
  gas.steps 12: the march through the gas over the ground is on (it was built at f1 and off since). gas.skin
  [density, height scale] is the gas over the bodies, gas.pool the gas lying in the valleys, gas.spot [from, to]
  in pit widths where the gas thins toward the spot, gas.heat [skin, pool] the heat of each as a share of the
  ground's heat under it: the gas that wells up over the cells is hot and glows, the gas that has sunk into the
  lanes has cooled. haze.level is the factor on both. With gas.steps over 0 the analytic haze is not used.
  heat.graze [at a look along the surface, the cosine at which it is 1, 0]: the limb law, the only term that
  knows the eye; it uses the ground's own up and no body's normal ([2] = 0), so no body has a lit side.
  "show": edge | seam | tall | cell | deep | junc in lab.json draws that quantity alone (a debug view, absent in
  a state).
  slide.ts: `npx tsx assets-src/sun/lab/slide.ts`: from the table alone, the way of a cell's middle (as the
  ground places it, with dome.anchor) in 1 s of film against the change of its radius, for the cells wider than
  0.05 and for all.
  h42 (26 Nov, 10:42 UTC), on top of h41:
  heat.fan: the turn is now the angle about the meeting point itself in the place's frame (vFan = the place minus
  the meeting point of the two nearest borders, and the fade), 4 N columns round the full turn; the pattern no
  longer depends on the order of a cell's border list, so it cannot flip when that list changes. The length key
  is the true distance in cell radii (0.75 for what was 0.9). heat.fan[7] (absent: 0): a streak's half width as a
  fixed share of the cell's radius instead of a share of its column; tried and left off (asterisks).
  heat.cushion.hot [gain, nearest, farthest from the crown, least, largest size, a cell's own tone]: three soft
  hot clumps a cell, each at its own place (by the seed), size and heat, the largest of the three times the gain
  added to the cell's heat; [5]: each cell's heat times 1 plus or minus this share by its seed. In h42
  [2.5, 0.1, 0.5, 0.25, 0.45, 0.35]. Reason, MEASURED: the percentiles of all three channels of h41 on the 1 to 1
  strip were the approved's within 0.03, but the approved's top levels lie in clumps of 10 to 30 px and it has
  whole bright and whole dark cells; h41 had the same mix in every cell.
  weave[11], [12] = 0.12, 0.25 and root[7] = 0.12 (were 0.22, 0.4 and 0.25): threads and roots are drawn only
  where they are wider than about 4 to 8 px, finer ones are their mean; crisp hairlines read as a solid.
  heat.graze[3], [4] (absent: off) = 0.3, 0.7: the limb law on a cell's own body: where the skin is seen more
  aslant than the ground itself the heat shown falls to the share [3] (the ratio of the law by the skin's normal
  to the law by the ground's up, never over 1, the cosine [4] from which it is 1). A far cell, seen as the
  ground, is unchanged. dome.soft [0.9, 1.0]: the skin's normal holds to 0.9 of the way to the border.
  MEASURED side.py: without it +0.026, with it +0.015.
  dome.base[10], [11] (absent: 0): the body's outline pulled in round the directions of the cell's corners; tried
  (t174, t175) and left off: islands on a floor.
  After h42 (26 Nov, 12:25 UTC; code only, lab.json of the commit is h42's):
  heat.cushion.hot[6] (absent: 3): the number of hot clumps a cell. gas.heat[2] (absent: 99): the cap on the
  map's heat by which the gas glows (uncapped, clumps and fans under the gas drew red smears).
  heat.fan[8] (absent or 0: the single rank of h42, unchanged): the fan round a pit is two ranks, the second with
  [8] times the columns and [12] of the heat (absent 0.8); [9] the turn of a rank with the way from the pit, in
  turns a cell radius (the ranks turn against each other and cross; which way by the cell's seed); [10] how
  uneven the streaks' starts are (share of fan[4]); [11] the share of its length over which a streak rises
  (absent 0.25); [13] (absent 0) the share of the shoulder's law (the fall of a cell's heat toward its border,
  heat.lane[8], [9], [11]) that the fans take too.
  lens (absent: off) = [aperture, focus, far, near, h0, h1]: an open aperture, after MAIL 1480 (26 Nov, 12:34
  UTC; replaces the form [k px, focus, far] of 32cf9274). aperture: its radius in thousandths of the frame's
  height (1.85 is 2.0 px at 1080 and 4.0 px at 2160: the same part of the picture at every size); focus: the
  distance in focus in stage units; far, near: the largest disc behind and before the focus in apertures; h0, h1
  (absent: 0.065, 0.1): the heights of the eye between which the aperture closes smoothly to 0 (the terrain
  frames lie at 0.045 to 0.057; on the rise 0.061 at frame 190, 0.108 at 200, the handover to the globe at 205 is
  at 0.144, so the lens is shut six frames before it; the focus distance never changes). The engine draws each
  sample of a frame from its own place inside the pixel (camera.view offset, core/jitter.ts, read only). In
  `pick` the sample's index i and count n are found by matching that offset against jitterOffsets(n), n from 2
  to 256; the sample's point of the aperture is r = sqrt((i + 0.5) / n), turned i times the golden angle
  (2.39996 rad), less the mean of the n points. DOME_VERT and FLOOR_VERT move gl_Position.xy by that point times
  the aperture (2 a / width, 2 a / height in clip units, a in px) times clamp(focus - w, -far w, near w), w the
  depth in stage units: a (focus / depth - 1) px, held between -far a and near a. No pass over the frame. The
  lens is off (no shift) in every frame whose sample count is under pi times the square of the largest disc's
  radius in px (a times the larger of far and near): one sample a px of the disc, so that the copies tile and no
  double shows; so draft (1 sample) and review (4) show no lens, final (16) carries 2.26 px, 64 carry 4.5 px, 256
  carry 9 px. The map pass and the far twin are not moved.
  heat.cushion.hot[7] (absent or 0: clumps fixed in the cell, as before): the life of a clump in seconds (each
  0.7 to 1.3 of it, at its own hour); it wells up at [8] (absent 0.5) of its place's distance from the crown,
  rides outward to it, grows by a half, fades in and out over a quarter of its life each; the next of its slot
  comes at another place.
  heat.fan[14] (absent or 0: off): the share by which knots of hotter gas along a streak weigh; [15] knots a
  cell radius; [16] their speed toward the dark point ([16] / [15] radii a second); [17] (absent or 0: streaks
  fixed): the life of a streak in seconds (each column 0.7 to 1.3 of it, own hour, two generations, one fading
  in as the other goes); [18] (absent 0.5): its length at birth as a share of its full length.
  heat.fan[19] (absent 1: everywhere alike): the share of the fans' heat where a field of the place ([20] its
  scale, absent 6 a stage unit) is low, so that the fans stand strong round some pits and faint round others.
  gas.spot[2] (absent: 0, as before): the share by which the veil of gas on a sight line follows the thinness of
  the place where the line ends, squared (0.01 in the spot to 2 pit widths, 1 from 3.5): with the walked gas of h41 on, the
  gas of the cells before the spot lay over the umbra as a brown haze (h41, h42: MEASURED rows 620 to 800 middle
  third, luminance 2nd percentile 0.068 against h40's 0.009 and the approved's 0.046).
  State h43 (26 Nov, 14:06 UTC; lab.json of the commit): no walked gas (gas.steps 0, skin [5, 0.005], pool [2,
  0.012], as h40), so the spot's haze cannot return and a frame is faster. heat.lane[3] 0.15: the seam's heat
  alone over the first 0.15 of the lane's width (a dark bottom of the valley), lane[7] 1.0, cushion.seam [0.005,
  0.12, 40, 1.0]; cushion.patch [0.9, 1.2, 0.3, 0.7, 0.3] and blob [0.4, 0.8, 0.5, 0.35, 0.3, 0.12, 3, 1.2, 0.3]
  (larger, softer cool patches; the body outside the light darker); heat.fan [3.0, 12, 0.9, 0.5, 0.08, 0.3, 0.3,
  0, 1.7, 0.04, 0.8, 0.3, 0.9, 0.3, 0.7, 6, 1.8, 5.0, 0.5, 0.5, 6.0] (12 streaks a quarter turn, short; 7 wide
  ones read as starbursts and palm leaves); heat.spark[0] 0.5 (at 1.5 white rice grains); spot.ring [0.35, 1.0],
  spot.gap [0.02, 0.10], spot.hot 1.8, spot.floor [0.008, 0.02] (dark wall near the umbra, light outer rim, darker
  floor); heat.curve refit on the draft of t224 (curve.py), not after the floor.
- cellflk.py: `python3 assets-src/sun/lab/cellflk.py DIR MASKDIR X Y W H [least area px]`: MAIL 1218 by the cell
  itself. DIR an eye held clip (clip.ts --from 180 --to 276 --step 24 --hold 180), MASKDIR the same captures with
  lab.json "show": "seam" (never committed with that key). A cell is an island of the mask, followed from one
  capture to the next by the ground they share; its light is the mean of the largest channel inside its own
  island. flicker.py (fixed discs) counts a border that passes through a disc as a change of light; this does not.
- State h44 (26 Nov, 14:49 UTC; lab.json of the commit) = h43 and: the spot as a bowl of short tongues: spot.depth
  0.08 and spot.wall [0.9, 2.3] (the ground sinks by 0.08 stage units between 2.3 and 0.9 umbra radii, so the far
  wall is seen from the eye of frame 90), spot.tongues [70, 44], spot.ranks [3.4, 2.6], spot.lean 0.34, spot.bend
  0.35, spot.wave [0.1, 0.02] (short tongues in ranks, each bent, dark between), spot.hot 2.4, spot.gap [0.01,
  0.05], spot.ring [0.45, 1.0]; heat.cushion.patch[0] 0.5 (the dark clumps on a cell at half their depth: soft
  mottling, at 0.9 they read as a leopard's coat, with fewer clumps as polished nuggets); heat.curve refit on the
  draft of that state (curve.py). The far twin is baked again for this state (bake.ts, level.py). Not kept, tried
  the same hour: sim.slots 1100 (cells 1.23 times wider: larger than the approved's in the Builder's crop), long
  tongues (a wheel of spokes), heat.lane[4] 0.015 and lane[3] 0.3 (nothing moves in the picture's lane).
- v/proof.sh (a helper outside the repo, its steps are these commands in this order): bake.ts and level.py; final
  90; the eye held clip, flicker.py four ways, the same clip with "show": "seam", cellflk.py; the film 60 to 120;
  clip.ts --from 380 --to 470 and reader.ts --dir; pure.ts --frame 90 --after "30;60;120;495" --format preview
  --tier review and pure.py; final 60; final 90 a second time and sha256sum of both; final 90 at --format preview.
- State h45 (26 Nov, 17:11 UTC; lab.json of the commit) = h44 and far.tone.far.heights [1.2, 3.4] (was [1.2,
  73.7]): the lab ground takes the map's light between far.tone.far.deg and far.tone.far.broad degrees by the
  eye's height over the stage, a smooth step of the logarithm between these two heights in stage units. The far
  ground begins to give way to the globe's face at the limb when the eye is 3.4 units up (far.away[0] 0.6 radii is
  the horizon's distance there), so the light is whole before the face comes. Frames 0 to 179 lie under 1.2 units
  and keep their bytes. The far twin baked again for this state (bake.ts, level.py) has the same bytes as h44's.
  Proof steps for such a change: bake.ts and level.py; clip.ts --from 380 --to 470 at master and
  reader.ts --dir; pure.ts --frame 90 --after "30" --format preview --tier review against the state before. Main's
  own number for a part of the rise: lab.json "ground": "standing", the same clip.ts and reader.ts, then the
  state's lab.json back.
- State h48 (26 Nov, 19:39 UTC; v/lab-h48.json until committed) = h45 and:
  heat.lane[16] (absent or 0: off, the fall of heat toward the border is the straight mix of lane[9] and 1 as
  before) = 1.5: the fall is a ratio, heat times lane[9]^((1 - s)^lane[16]), s the smooth way in from the border
  over lane[8] of the radius; with lane[8] 0.55, lane[9] 0.03, lane[13] 0 (the same all round) and heat.fan[13] 1
  (the fans take the whole fall). Why: the display curve is steep at its dark end, so a straight fall of heat
  stays gold to the border and then drops in one step; a ratio falls evenly through gold, brown, near black.
  dome.anchor [0.0, 0.5]: the crown and the pattern of a cell stand in the middle of its ground (at the site
  they lay against one border in frame 90 and every law from crown to border was squeezed to a step there).
  dome.base[4], [5] = 2.0, 0.5: the body is the bell (1 - e^2)^2, no slope at the border; dome.height 0.45.
  heat.graze[3] 0: the skin law by the eye is off; only the limb law of the ground (graze[0], [1]) knows the eye.
  heat.spark [0.5, 0.02, 0.5, 6.0, 1.0, 0.0, 1.0, 1.2, 0.0, 0.8, 0.97, 0.0]: the small hot points are 1 to 2.2 px
  in radius and stand only from 0.8 of the way to the border on (on the dark flank they were grains of rice).
  heat.dull (absent: off) [the least share of heat, the scale of a field of the place, the share of that field
  against the cell's own lot, from, to] = [0.3, 3, 0.7, 0.3, 0.6]: cells differ in heat; a slow field of the
  place and each cell's own lot give a share between dull[0] and 1 that the cell's heat after the knee and its
  fans are multiplied by. Why: in the approved whole cells are dull olive beside bright ones, and the mean curve
  from middle to border lies 0.07 under a ground whose cells are all equally hot at the same percentiles.
  heat.curve fitted again by curve.py on the draft of 90 (v/tb.sh: render, fit, render), LAB_TAIL 0.6.
  The far twin baked again (bake.ts, level.py).
  Trials that led here, drafts of 90 by v/tb.sh on v/lab-h45.json: t238 to t255 (NOTES, 18:41 to 19:40).

## The tree at the freeze of 26 Nov 2026 (MAIL 1548)
- src/stops/sun/lab/lab.json is the state h48 (the same as states/lab-h48.json); the far twin in
  public/assets/sun/{full,web}/lab/place-far-0.jpg was baked from h48 (bake.ts, then level.py; 1,569,474 and
  467,999 bytes).
- Code added to ground.ts after h48 was drawn, off without its key, used by the trial states only:
  heat.olive (absent: off) [amount, blue against green, from, to, share off the dull bodies]: the ramp's green and
  blue are multiplied under a level (from, to, of the shown heat) by how dull the cell is; not in the lane, the
  penumbra or a sunk cell. Why: at one level the approved's green over red differs from place to place two to
  three times more than the lab's, and its darks are less red.
  heat.lane[17] (absent: 1): the power of the shoulder (lane[16]) times mix(lane[17], 1, pool), so the valley is
  shallow where the field of the place has no pool and neighbours press against each other.
  cushion.seam[3]: a factor on the seam's heat where the place has no pool (5.0 in t258: the seam glows brown
  there and the dark stands in pools only).
- states/lab-h45.json: the last named state (commit 045a88cb4dc9d7a5235c345552f671dab1d3e3b5).
- states/lab-t258.json = h48 with heat.lane [.., 16: 1.5, 17: 0.35], cushion.seam [0.005, 0.12, 40, 5.0],
  heat.olive [0.4, 1.8, 0.35, 0.7, -0.3], heat.curve fitted again on its draft of 90.
- states/lab-t264.json = t258 with spot.floor [0.001, 0.004], spot.edge [0.75, 0.95], spot.lean 0.2,
  spot.ring [0.2, 0.9], spot.tongues [110, 70], spot.gap [0.004, 0.03], spot.depth 0.07, spot.wall [0.85, 1.2]:
  the spot as a hole. Drawn as drafts of frame 90 only. To draw one: copy it over src/stops/sun/lab/lab.json,
  bake the far twin again (npx tsx assets-src/sun/lab/bake.ts, then python3 assets-src/sun/lab/level.py), render.
- Instruments added: blobs.py (connected dark and bright parts by rows), spotprof.py (rings about the umbra),
  flat.py (the share of flat ground and of hard edges, and a picture of where they lie). Each takes pictures
  under out/work/sun/lab by name and is run from the repo's top folder.
