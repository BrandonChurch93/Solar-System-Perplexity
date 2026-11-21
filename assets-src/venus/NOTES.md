# Venus stop notes (lab notebook)

Agent: `/root/venus_builder`, parent `/root`. Branch `agent/venus`, looks branch `agent/venus-looks`. Times are UTC.

After a compaction: read `assets-src/shared/STOP-AGENT.md`, then this file, then carry on.

## Standing facts

- VM: 4 cores, 7 GB RAM, about 17 GB disk. `npm ci` done, `npm run build` passes.
- Segments (s): hold 37 to 42, dive 42 to 45, terrain 45 to 51, rise 51 to 53.5, travel 53.5 to 56. Judged frames: hold 1185, dive 1287, terrain 1440, rise 1586.
- Budgets: full 1400 MB texture memory with mipmaps, web 450 MB. Disk full 150 MB, web 40 MB. File limit 95 MB. 6 takes per asset per round. 3 rounds with the critics.
- Fit (`src/stops/venus/fit.json`): vfov 30, camera [-0.10884, -0.005645, 4.527276], sunDir [-0.84145, 0.383012, 0.381135], globe quaternion [0.3397865, -0.0671923, -0.1502475, 0.9259892], hero disc cx 1482.82, cy 788.05, r 669.75 in 2816 x 1584. North pole on the painted vortex near px (1649, 302). Sub camera lat 40, lon 0. Sub solar lon -74.8, lat 19.2. Limb residual RMS 1.7 px, sectors 0 and 330 deg off by 5 to 8 px.
- Map convention: dir(lon, lat) = (cos lat sin lon, sin lat, cos lat cos lon), u = lon / 360 + 0.5, north at top.
- Sky patch aims come from `src/space/skyframe.json` `patches.<stop>`, a shared file written by `npx tsx tools/assets/skyframe.ts --keep` (the Builder's). The director computes aims for every plan (`aimSky`), the engine reads `director.sky.patches[id][view]`, so a venus patch is aimed without a skyframe entry.

## Plan of record

1. Orbit view: 2x upscale of hero, unproject on fitted sphere, delight, far side painted at dive patch detail (tiles, poles on polar projection), hero pixels on the visible side faded toward the limb, light curve measured, fitted haze layers plus one across the disc edge, cloud band flow layer, night side lightning, hero sky as sky patch.
2. Terrain view: relief of `venus-close.jpg` (upscale 5632, depth, camera fit, layers for cloud towers, aprons past every edge, haze drift, shafts sway), own sky patch.
3. Dive and rise: patch levels at most 2x apart with predictor, bright haze cover, level rise, far side and poles checked from the rise angle.
4. Self check: measure, compare at final, sheets at review, crops. Then READY.

## Log

- 02:43 cloned, branch made, `npm ci`.
- 02:45 first looks pushed (stand-in hold and terrain beside approved, draft), looks commit 16bed66f.
- 02:48 reading done except Mars patches recipe details. Starting assets.
