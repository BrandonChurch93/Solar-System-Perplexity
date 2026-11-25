# Sun ground lab: recipe

No file is baked. The film loads nothing from this folder and nothing under public/assets/sun/*/lab.

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
