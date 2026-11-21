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

- 03:45 to 04:10. Io: position and radius from a fit of the hero shadow (`io/shadowfit.py`), light (`io/lightfit.py`), map (`io/build.py`). Night side and terminator refit. Hold sheet: band flow, spot swirl, wisps and Io crossing all move. Merged main b4ae65c (engine batch 1). Builder tip: the software rasterizer computes both sides of an `if` but skips a `for` body, so expensive conditional work goes in `for (int k = 0; k < (cond ? 1 : 0); k++)` with `textureGrad` or `textureLod` inside.
- 04:10 to 04:40. A dark line along the lit limb came from the post sharpen on a hard alpha edge plus a broken limb table. Fix: the globe is transparent with a soft edge (`uEdge`: one pixel wide, inset 0.0015) and a short air tail outside the disc (`uAir`, one exponential, rim 0.03, capped luminance). Limb table repaired and refit only on unsaturated pixels. Limb streaks and blown white ovals: albedo fades to a coarse mip (lod of 128 px width) for mu under 0.3 (`uLimbSoft`), wisp fades with it. Merged main 9f78a4e (engine batch 2, hash 05c29d3a1588e95f).
- 04:40 to 04:57. Sky patch: a kaleidoscope at the frame sides (mirrored margin seen when the sky shifts +-155 px) and a ghost arc left of the planet (the patch stored hero minus film glow, including the air tail cutoff). Fix: side margins painted (seedream_5, one take per side), patch rebuilt with a trust and own split (`sky/patch.py`), shells refit against a body only render (`/tmp/refit.sh`: shells off and sky gain 0, body only still, `haze/glow.py`, `fitglow.py`, `write.py 0.92`, halo only still, patch rebuild, sky gain back to 2). Commit 6a6c610.
- 04:57 to 05:10. Limb gain weighted by ndl (`uLimbLit`, look.limbLit [0.35, 0.1, 0.45]) because the limb brightening of the hero belongs to the lit side; ground night haze depth 0.012; refit. Table of hero/film luminance by mu and ndl is within 0.85 to 1.17 for mu 0.1 to 0.55, ndl -0.4 to 0.6. The row mu 0.05 to 0.1 is off (0.42 to 1.1) because the hero disc is slightly oblate (ellipse a 708.4, b 701.8 px at 2816): accepted, the Builder said to drop outline fits of a few pixels. North cap of the wrap was teal against the hero's tan: `wrap/write.py` pulls its chroma to that of lat 56 to 62. Merged main 3523b45 (engine batch 3, hash e44fa21a5a599a98, sky aim per stop: an orbit aim is ignored for Jupiter, the hold sky follows from Mars and my plan; do not paint anything against the sky behind the rise).
- 05:10. Orbit milestone sent. Builder's time check: motion first, move to the terrain view now, limb and sky refinements wait for the rounds.
- 05:10 to 05:36. Terrain view built (see the section below). Judged frame 3150 beside the approved picture reads as the same shot at draft tier. First and last frame show strong forward movement. Open: right tile seam, foreground stretch at the last frame, cover colors, dive patches. Builder: main 2d2161b (engine batch 4) to merge; before READY run `npm run -s gate -- --phase 4 --only G11` (every file under public/assets/jupiter named in a RECIPE.md, by full path or `public/assets/jupiter/<set>/NAME`) and `npm run -s gate -- --phase 4 --only G12,G15 --g15-stops mars,jupiter`, put the three results in the READY message.

- 05:36 to 06:00. Seam and sky fixes of the terrain canvas, sky aim, terrain sky glow, review sheet of the terrain, G11 clean for my files, merged main 2d2161b (engine batch 4), terrain milestone sent. Predictor for the dive and rise patches written (exact shader rule), design chosen.

## Orbit view: known weak points (for the rounds)

- Lower left glow at 225 deg slightly weak (film 19/17/17 against hero 33/29/23 x1000 at r 1.03). Glow at 135 deg: film G and B about 20 percent high at r 1.03.
- A few white ovals near the lower left limb slightly hot. Faint painted detail visible on the night side near the terminator.
- Hero disc is oblate, limb offsets of up to 3 px.
- Render time: a transparent globe costs about 1 s per review frame in the hold and 6 s in the dive (12.4 against 13.3 s, 24.7 against 31 s). Deferred: split the globe into an opaque core (discard where inside < 1) and a transparent camera facing ring for the edge and the air tail.
- Shells do not yet fade with altitude in the dive (`look.descent` unused).
- Travel and FarPoint, rise: not yet checked with the transparent globe.

## Temp tools (in /tmp, recreate if lost)

`/tmp/refit.sh N`, `/tmp/limb2d.py STILL` (hero/film by mu and ndl), `/tmp/limbrgb.py STILL [angles]`, `/tmp/pair.py STILL top bot ll left ur term io grs` (pairs in `out/work/view/pair_*.jpg`, hero left).

## Terrain view (own module `src/stops/jupiter/deck.ts`, not the engine Relief)

- Camera fit of `jupiter-close.jpg` from its horizon (`relief/camfit.py`, `camera-fit.json`): vfov 64, focal 1267.46 px at 2816 wide, nadir (-0.272, -0.885, -0.377), dip 4.44 deg, roll 17.09, camera height 1 unit, planet radius 331.95 units, horizon 25.8 units away. Plan: `horizonDeg 17.72, dipDeg 4.44, rollDeg 17.09`.
- Canvas: 5632 x 3168 in image pixels, the approved image at (1408, 792). Aprons by seedream_5, one edit per tile with the finished part pixel aligned and grey over the unfinished part (`relief/tiles.py`: left, right, bottom, bl, br; the top left triangle below the horizon is a mirror fill). A whole canvas outpaint at half size failed (the model redraws the picture at another size; nano_banana_pro pastes it as a rectangle). `relief/canvas.py`: seam step removal at the image edges, stars above the horizon replaced by a smooth rim table (polar, percentile along the horizon), image pixels kept to 0.4 deg above the fit horizon. `relief/build.py textures sky grid`: `deck-core.jpg` (approved, upscaled 2x), `deck-wide.jpg` (canvas), `sky-terrain.webp` (approved sky minus the deck texture in scene linear, mirrored below the horizon; sum with the deck is the approved picture), `deck-dist.bin` (705 x 397 float32: sphere distance x exp(-relief), relief = high pass of log depth from `tools/ml/depth.py` on the half size canvas, faded from 5 to 14 units), `src/stops/jupiter/relief.json`.
- Mesh: grid vertex = image ray x distance, so the judged frame is the approved picture by construction. Rays above the horizon sit at the tangent distance and carry the rim glow additively (alpha 0); the limb alpha is analytic from the current camera (ray miss distance against the sphere).
- Flow: closed form in ground coordinates (tangent frame at the storm centre): each vortex turns points by angle = rate x dt / (1 + q^4), q the elliptical radius; the texture is read at the turned point (difference of two projections, zero at the judged frame). GRS centre px (1132, 552), ground axes 1.12 x 2.18 units, four small vortices. Wisp layer: `wisp.png` in ground coordinates, turned faster, zero mean modulation plus a soft shadow toward the Sun. Lightning: eight seeded sites with closed form flash envelopes, quiet at the judged frame.
- Predictor `relief/predict.py` (reads the terrain params from `plan.ts`, `key=value` overrides): footprint of every pose in image pixels against the canvas (x -1408..4224, y -792..2376). Backing up needs the bottom apron fast (about 2000 px per unit), so the judged frame sits at u 0 with only 0.33 units behind it: `gather 0.6, forward 0.95` gives u -0.35..0.65 (slow after the dive, faster toward the rise). Forward needs no apron.
- Sky patch value = inverseFilmic(texel) x gain x skyGlow x skyExposure, so gain 2 with skyExposure 0.5 is unity.

## Terrain view: state at the milestone (06:00 UTC)

- Seam: `canvas.py seam()` takes a multiplicative tone ratio (approved pixels against tile) along the right, left and bottom image edges, applied outside with an exponential fall of 320 px and inside a 24 px blend band (ratios right 0.46 to 1.89, left 0.89 to 1.19, bottom 0.81 to 1.25). The right seam is gone.
- Sky: the rim glow table is the glow minus the sky background (median of 5 to 7.5 deg elevation per azimuth), so the sky patch keeps its background down to the horizon. The sky patch is built in `canvas.py` (image minus glow table from 0.4 deg up, mirrored about 0.4 deg below, `sky-lin.npy`); `build.py sky` only saves it. Deck above the horizon = (image minus blurred patch) x keep + glow x (1 minus keep), keep from 0.4 to 0.6 deg.
- `skyAim.terrain [0, -21.8, 31]` (band of the one sky where the approved picture has its band), `light.terrainSkyGlow 0.35` (the engine sky was 2.6 to 3.2 times the approved sky), `sky.json` terrain gain 5.714 (= 2 / 0.35, unity). The judged frame did not change.
- Measured, review tier, judged frame 3150 against the approved picture: luminance ratio 1.00 to 1.06 over a 12 x 6 grid, mean abs diff 3.99, p95 14.1 (8 bit), fine detail std ratio 1.148. Texels view at 3239: min 1.36 per pixel. Disk: full 34 MB, web 10 MB.
- Review sheet 3060 to 3239: the camera flies in toward the storm, foreground leaves at the bottom, horizon holds, no seam.
- Weak: bottom left foreground soft and stretched at 3239 (magnified core, relief stretch); faint brownish smudge along the judged frame horizon in the sky at 3060 (only at 2.5 x exposure); br apron very dark; top left apron is a mirror fill; slow start (speed factor 0.4 at 3060, only 0.33 units of apron behind the judged pose); flow, lightning, wisps not yet checked in motion; fine detail std 15 percent over the approved (post sharpen plus wisps).
- G11: recipe headings now carry `public/assets/jupiter/<set>/NAME`; the gate lists only shared belt files (not mine).

## Dive and rise: patch design (predictor, 06:00 UTC)

- `assets-src/jupiter/patches/predict.ts MAPWIDTH [widthDeg:px ...]` with env `CENTRE=lon,lat`, `BRIEF=1`, `FEATHER`, `FADE`. It walks the dive and rise frames through the director and applies the shader's own rule per pixel (every 12th): texels = max of the two screen derivatives of the body direction x mapWidth / 2 pi; a patch level counts where its weight is at least 0.5 (feather 0.12, fade 1.02 to 1.5 on the parent's texels).
- Cover window (engine, 0.5 s): dive 3016 to 3031, rise 3262 to 3277. Frames that must hold G13: dive to 3015, rise from 3278.
- Wrap alone (8192): dive soft from 3007 (alt 1.33) to the cover, soft share up to 0.81 at 3015 (alt 0.67, min 0.58); rise soft from 3278 (alt 0.315, min 0.29, share 0.875) to 3289 (alt 1.29).
- The dive comes in obliquely: the point under the camera is 18 to 21 deg east of the storm until the cover (lon +3 to 0, lat -7 to -10); the rise leaves west (lon -16 to -32). So the patches are centred between them, not on the storm.
- Chosen: centre lon -10, lat -10; gnomonic levels 90, 53.13, 28.07 deg (half tangents 1, 0.5, 0.25: exactly twice apart) at 4096 px. Predicted min texels per pixel outside the cover: 1.09 (3013), every frame soft share 0. Texture memory 3 x 89.5 MB.
- A gnomonic patch is finer toward its edge (1 / cos squared radially), so one wide level serves the oblique far field.

## Next

- Patches: build the three levels (resample of the wrap into gnomonic, painted detail in the style of the close picture, low frequencies locked to the wrap), `patches.levels` in `assets.ts` with their own centre (not the swirl centre), verify with the texels view at 3010, 3015, 3278, 3285.
- Cover: `coverEdge`, `coverEdgeRise` (each at most 0.5), `coverShell`, cover colors in pale cream; own haze in `deck.ts` that thins over the first 15 to 20 terrain frames and thickens before the rise; exit and entry so speed and direction carry across.
- Check in motion: storm rotation, vortices, wisps, lightning (`--diag flow`), shells fade with altitude, rise far side, poles, terminator, travel and FarPoint.
- Self check: measure, compare final, sheets, crops, budget, gates G11, G12, G15. Then READY.
