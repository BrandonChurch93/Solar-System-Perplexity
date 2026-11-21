# Jupiter stop: lab notebook

Agent: jupiter_builder. Branch `agent/jupiter`, looks on `agent/jupiter-looks`. Builder is `/root`.
After a compaction: read `assets-src/shared/STOP-AGENT.md`, then this file, then carry on at "Next".

## Facts (read from disk, do not trust memory)

- Segments (config): hold 94 to 99 s (frames 2820 to 2969), dive 99 to 102 (2970 to 3059), terrain 102 to 108 (3060 to 3239), rise 108 to 110.5 (3240 to 3314), travel 110.5 to 113.
- Judged frames: hold 2895, dive 2997, terrain 3150, rise 3296.
- Approved: `references/approved/jupiter-hero.png` and `jupiter-close.jpg`, both 2816 x 1584.
- Fit (stand-in, `assets-src/jupiter/fit.json`): vfov 30, disc centre (1406.6, 789.0) r 706.1 px, camera z 4.3045, sunDir (-0.744, 0.140, 0.653), Io at (0.129, -0.232, 1.053) r 0.0494, globe tilt 2.8 deg about x.
- VM: 4 cores, 7 GB RAM, 17 GB free disk. Draft still of the stand-in takes seconds.
- Image tool: `generate_image` through the JS tool runner (models seedream_5, nano_banana_pro, gpt_image_2_6_sunburst, gpt_image_2_6_flare; 16:9, 1:1, 4:3). Reference images as paths. Parallel calls work with Promise.all.
- Upscale: `python3 tools/ml/upscale.py`, depth: `python3 tools/ml/depth.py`.

## Plan

Orbit view
1. Check fit overlay, measure Io disc and shadow in the hero.
2. Hero 2x (upscale.py), Io and shadow painted out of the hero pixels (image tool, kept only inside the mask).
3. Unproject, light curve (tools/assets/lightcurve.py), delit hero side.
4. Far side and poles: whole map low pass, then tiles, poles on a polar projection. 8192 x 4096.
5. Planet shader copy in `src/stops/jupiter/`: curve light, Io shadow computed from the Sun direction, band flow (zonal displacement by latitude, zero at hold mid), GRS rotation, flow layer of fine wisps with a soft shadow, limb edge haze on lit and night side.
6. Io: sphere with painted map, hero pixels on the hero side.
7. Sky patch from the hero sky.

Terrain view
- Relief of jupiter-close: 2x, sky cut, depth, extended canvas (aprons left, right, bottom, behind entry), flow map (storm rotation, small vortices, band shear), wisp layer with shadow, seeded lightning, haze cover.

Dive and rise
- Patch levels at most 2x apart from the wrap to the terrain, top down views of the Great Red Spot in the style of the close image, predictor first.

## Log

- 2026-11-21 02:44 UTC. Cloned, branch made, build green, stand-in hold and terrain compares rendered and pushed as first looks.

## Next

- Step 1 of the orbit view.
