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


## Measured so far (orbit view)

- Hero geometry: disc centre (1406.6, 789.0) r 706.1 px. Io in hero about (1524, 1000) r 46 px. Its shadow: ellipse centre (1656, 1030), about 190 x 120 px, soft edge, about 1.3 x the size of Io.
- Fit: camera (0.001547, -0.003452, 4.30454), sunDir (-0.744226, 0.139788, 0.653136): Sun 49 deg left of the camera, terminator 41 deg right of centre. Io (0.129142, -0.232241, 1.053324) r 0.049425. Computed shadow centre about (0.273, -0.259, 0.926), ndl there 0.366. Globe quaternion (0.024833, 0.0001797, -4.5e-06, 0.9996916).
- Light fit (`wrap/delight.py`): seen = A(lat) x C(ndl) x L(mu), alternating medians. `src/stops/jupiter/curve.json` (33 knots) and `limb.json` (17 knots over mu).
  - C(ndl), R: 1.0 at 1, 0.56 at 0.75, 0.26 at 0.5. Night floor (0.0045, 0.0106, 0.0223) x albedo: hero night is about (5, 9, 12) in 8 bit, bluish, never black.
  - L(mu), R: 3.47 at mu 0 to 0.12, 2.96, 2.45, 2.03, 1.72, 1.48, 1.29, 1.15, 1.05, 0.99, 0.98, 0.99, 1, 1. G and B lower (2.89, 2.43 at mu 0). So the hero brightens toward the limb. The shader needs a clamp on C x L for other phase angles.
  - A(lat) mean (0.43, 0.32, 0.24). The wrap stores tone coded albedo (sRGB of filmic), the shader decodes with inverseFilmic.
- Equirect (u = lon/360 + 0.5, north at top): hero pixels cover lon -62 to +36, lat +-65. Weight = smoothstep(0.2, 0.42, mu) x smoothstep(0.035, 0.11, curve G). Zonal profile valid for lat -54 to +61. GRS at 4k px (1848, 1142), radii (150, 90): lon -17.5, lat -10.
- Hero poles: north cap is dark grey brown with small cyclones. The stripe guide is flat tan there, so the poles need their own darker mottled paint on a polar projection.
- Rise frame 3296 (stand-in): planet at the right of the frame, seen from the west and south, mostly painted far side and south pole, nearly full phase. The far side must hold up at hero quality.

## Work files (out/work/jupiter, not in git)

- `hero2x.png` 5632 x 3168 (upscale.py), `hero2x-nomoon.png` Io and shadow painted out, `hero_albedo.png`, `hero_pred.png`, `profile.npy`, `eq8k-{color,weight,moon}.png` (hero unprojected to 8192 x 4096), `guide-{stripes,copies}-hero.png` (4096 x 2048 far side guides), `gen/` takes.
- Scripts: `assets-src/jupiter/wrap/{common,delight,unproject,guide,nomoon}.py`. Run from the repo root with `PYTHONPATH=assets-src/jupiter/wrap python3 assets-src/jupiter/wrap/X.py`.

## Image tool notes

- seedream_5 gives 2816 x 1584, exact 16:9, edits stay pixel aligned. nano_banana_pro gives 2752 x 1536 and stretches content 0.8 percent vertically: to align with a 1792 x 1008 input, resize to 1792 x 1000 and reflect pad 4 px top and bottom. It is sharper and its fills look more natural.
- Io removal: nano_banana_pro take kept (`gen/ioremove_nbp_al.png`), seedream take rejected (bland fill). Kept only inside the mask, low frequencies matched to the hero.
- Io map: seedream take kept (`gen/iomap_sd5.png`), nano_banana_pro take rejected (pattern repeats twice).

## Far side plan

- Tiles at 8192 scale, 2816 x 1584 each (123.75 x 69.6 deg): rows y 512 to 2096 and 2000 to 3584, columns x 4400 to 7216, 6700 to 9516 (wraps), 808 to 3624. Two polar caps (|lat| > 60) on a polar projection at 2048 px. Hero content pasted at the tile edges, minimum error seams, low frequencies locked to the guide, band heights corrected by zonal profile correlation.

## Shader plan (src/stops/jupiter/globe.ts, copy of src/bodies/planet.ts)

- Light = clamp(C(ndl) x L(mu)). Io shadow: ray from the surface point to the Sun against the moon sphere, umbra about 1.3 x with a soft penumbra, moon position uniform in world space.
- Band flow: jet(lat) from the zonal profile, lon shift = jet x rate x elapsed, elapsed clamped to +-12 s, about +-0.6 deg at the hold ends. GRS swirl about its own centre, elliptical and confined, also applied to the patch lookup.
- Wisp layer: its own tileable fine turbulence texture, drifts faster, alternates by band, zero mean modulation, soft shadow offset away from the Sun, faded above |lat| 60.
- Ground haze, patches and the diagnostic outputs stay as on Mars.

## Log

- 2026-11-21 02:44 UTC. Cloned, branch made, build green, stand-in hold and terrain compares rendered and pushed as first looks.
- 03:00. Hero upscaled 2x. Io and its shadow painted out. Light fit done: delit hero is flat, prediction matches. Hero unprojected to 8192 x 4096. Guides built. Looks pushed 02:59.
- 03:05. Four trial far side tiles back (copies and stripes guides, seedream_5 and nano_banana_pro). Evaluating.


- 03:10 to 03:25. Far side method chosen after two trial rounds: seedream_5 edit of a stripes guide (zonal mean colors of the hero) with finished hero pixels at one edge. It continues every band at the right height with new detail in the hero style. Rejected: free repaint (band heights reinvented), nano_banana_pro on any guide (keeps the guide verbatim, smears included), a latitude locked quilt of hero pixels (`wrap/quilt.py`, repeats every 83 deg). Tiles T1 (hero on right), T3 (hero on left), T2 (bridge), 3200 x 1800 px at 8k each (lat +-39.5), take 1 kept for each. Polar caps on an azimuthal equidistant projection (60 deg, 2048 px), take 1 kept for each. `wrap/tiles.py` holds the state in `out/work/jupiter/far-canvas.npy`. Seam at lon 180 measured 1.98 mean code values against 1.75 between neighbours.
- 03:26. `public/assets/jupiter/{full,web}/wrap-color.jpg` written (8192 and 4096 wide). Flow build (`flow/build.py`): `src/stops/jupiter/flow.json` (129 jet knots from the band passed zonal profile) and `wisp.png` (2048 square, tileable). Io map from `gen/iomap_sd5.png`.
- 03:28. First real orbit render. `globe.ts` (own copy of the planet shader: curve light, limb table, Io shadow from the Sun direction, band flow by latitude, spot swirl, wisp layer with shadow, patches), `io.ts`, `set.ts`, `look.ts`.
- 03:30 to 03:43. Closed loop light fit (`haze/refit.py`): render body only, median hero/film by mu knot and by ndl knot, multiply the tables, repeat (4 passes). The night is now its own term: `curve.json.night` (0.0033, 0.0048, 0.0061), 30 percent albedo modulated, plus a ground haze that only adds a night limb glow (extinction 0). The curve holds direct light only.
- Limb glow of the hero falls off like 1/x, peak at screen angle 162 deg, flat between 150 and 180, and is about 30 times weaker at the top limb: it is bloom of the bright limb. Fitted as three haze shells (scale heights 0.006, 0.025, 0.1), each with a broad lobe and a narrow lobe (the shell's core), by non negative least squares on hero minus film (`haze/glow.py`, `haze/fitglow.py`, `haze/write.py 0.92`). Residual after the fit is within about 0.03 scene units where the hero has 0.2 to 0.5.
- Sky patch: `sky/patch.py` (Mars pattern), fill image `gen/skyfill_sd5.png` (seedream_5 keeps the hero stars aligned; gpt_image_2_6_flare reinvented the whole sky, rejected). The engine aims the patch from the plan. `sky.json` gain 2. To do: fill gain is measured in a ring that holds glow (R 1.9), measure it farther out.
- Engine facts learned: GLSL reserves the word `cast`. Review tier stills are 1920 x 1080 as well (4 samples), about 27 s.

## Next

- Io: more orange and mottled like the hero, darker right rim. Shadow: hero ellipse is about 190 x 120 px, ours is longer and softer; limit the grazing stretch.
- Terminator: tile content shows in the twilight (a blue white band at lat -25). Check after the Io work.
- Check the hold sheet for motion: band flow, spot swirl, wisps, Io crossing. Flow diag view.
- Sky patch fill gain. Then RECIPE.md for wrap, caps, Io map, sky fill, wisp. Commit binaries at the orbit milestone and message /root.
- Then terrain view (relief of jupiter-close with flow), then dive and rise (patch levels).
