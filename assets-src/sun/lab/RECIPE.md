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
  bright posts.
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
  rim would show as a rise, a fall and a second rise).
