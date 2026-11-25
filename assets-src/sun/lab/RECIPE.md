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
- The table of the life alone, measured without a picture: `npx tsx assets-src/sun/lab/spans.ts`.
- The reader of a clip (largest and mean change of the pattern between pictures):
  `npx tsx assets-src/sun/lab/reader.ts --dir FOLDER --hold 0`.
