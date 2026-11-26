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
