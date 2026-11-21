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

## Dive and rise: patches (built 06:25 UTC)

- `assets-src/jupiter/patches/predict.ts MAPWIDTH [widthDeg:px ...]` with env `CENTRE=lon,lat`, `BRIEF=1`, `FEATHER`, `FADE`. It walks the dive and rise frames through the director and applies the shader's own rule per pixel (every 12th): texels = max of the two screen derivatives of the body direction x mapWidth / 2 pi; a patch level counts where its weight is at least 0.5 (feather 0.12, fade 1.02 to 1.5).
- Cover window (engine, 0.5 s): dive 3016 to 3031 (view switches at 3024), rise 3262 to 3277 (centre 3270). Frames that must hold G13: dive to 3015, rise from 3278.
- Camera altitude (planet radii): 3005 1.52, 3008 1.24, 3010 1.06, 3012 0.89, 3015 0.67, 3016 0.60, 3020 0.38, 3023 0.27; rise 3270 0.12, 3277 0.28, 3278 0.32, 3282 0.51, 3285 0.73, 3288 1.11, 3292 1.92, 3296 2.87.
- Wrap alone (8192): dive soft from 3007 to the cover (share up to 0.81 at 3015); rise soft from 3278 to 3289.
- The dive comes in obliquely: the point under the camera is 18 to 21 deg east of the storm until the cover; the rise leaves west. So the patches are centred between them, not on the storm.
- Final: `src/stops/jupiter/patches.json`, centre lon -12, lat -10; gnomonic levels wide 100 deg at 5120, mid 61.5795 deg at 4096, near 33.1816 deg at 4096 (half tangents twice apart). Predicted min texels per pixel outside the cover 1.21 (3015) and 1.26 (3278), soft share 0 on every frame. The globe shader has its own patch centre (`uPatchN/E/U`), apart from the swirl centre.
- Built with `assets-src/jupiter/patches/build.py` (recipe section "Dive patches"): wide = wrap resampled and ML upscaled, mid and near = one global repaint plus four tile repaints each, high pass locked onto the parent's low pass, then nested bottom up. Disk: full 50 MB, web 14 MB with the patches.
- A gnomonic patch is finer toward its edge (1 / cos squared radially), so one wide level serves the oblique far field.

## Dive and rise: cover and haze (in progress)

- Engine cover can only ramp over 8 frames per side. Own haze carries it further on both sides:
  - Orbit side, `globe.ts` veil (`look.veil`): a thin layer just above the cloud tops, opacity 1 - exp(-amount x pattern / mu), amount a closed form of camera altitude (from 1.5 down to 0.35 radii), so it gathers from frame 3006 and is gone again by 3290 in the rise. Pattern from `wisp.png` at 4 and 12 repeats in longitude, read with `textureLod`.
  - Terrain side, `deck.ts` fog (`look.deck.haze`): 1 - exp(-density x distance x pattern), pattern read part way along the ray so it streams, also over the first degrees above the horizon; density is `(1 - (t - diveCover) / clear)^power` and the mirror of it before the rise cover.
- `wisp.png` is loaded with repeat in u only (engine `ctx.texture`); `set.ts` sets `wrapT` to repeat on it. Before that the deck wisps and the veil were stretched into streaks wherever v left 0 to 1.
- The deck writes its color unpremultiplied (the pixels above the horizon add the approved picture's rim glow onto the sky); leave it so, the judged frame matches.

## Dive and rise: camera (06:40 UTC)

- The legacy dive path left the horizon 33 deg off and the lens 11 deg narrower at the cut (orbit 3023 horizon normal 106 deg, offset -0.23, vfov 53; terrain 3024 normal 72.6 deg, offset -0.37, vfov 64). Now the Mars pattern: `dive.swoop: true` with Mars's surge (`glide 0.14, rise 60, fall 2, swell [0.3, 9, 1.2]`): at 3023 normal 77.6 deg, offset -0.39, vfov 62.3, altitude 0.06. The plunge happens inside the cover: altitude 2.56 at 2997, 1.70 at 3010, 1.13 at 3015, 0.78 at 3018, 0.13 at 3022.
- Rise: Mars pattern `ahead 0.03, hug 1.7, settle 5, level true, pan 0.3`: the camera keeps the terrain heading, horizon and roll through the cover (3270 normal 72.9 deg, offset -0.22 against terrain 3269 73.2 deg, -0.28), then pans to the rise framing. Altitude 0.41 at 3277, 0.67 at 3279, 1.44 at 3283, 2.2 at 3286, 4.29 at 3296.
- Predictor with these moves and the built patches: no frame over 0.02 soft outside the cover, lowest min 1.26 texels per pixel (3011 and 3278). Env `DIVE`, `RISE`, `TERRAIN` (JSON) override plan values in the predictor.
- `out/work/jupiter/tools/try.ts` and `tryrise.ts` print horizon, lens, altitude and camera space velocity per frame.

## Dive and rise: first pictures (06:45 to 07:00 UTC)

- Strips `out/work/view/strip_dive2.jpg`, `strip_rise2.jpg` (draft): the dive swoops in, Io and its shadow cross, cover gathers 3019 to 3023, 3023 and 3024 match in tone and direction; the way out fogs from 3262, 3269 and 3270 match, the globe clears by 3277, veil to 3283.
- Texels view (draft, 1920 x 1080): 3011 soft share 0, min 1.26; 3015 soft 0, min 1.24; 3278 soft 0, min 1.24.
- Found on the way out (3255, 3262): a streaked slab above the horizon top left. Cause: the sky patch below the horizon held reflected cloud where the mirrored sample fell outside the picture (cv2 BORDER_REFLECT), exposed when the camera climbs and the horizon drops. Fixed in `relief/canvas.py` (row reflection about the valid part, median sky far below), `sky-terrain.webp` and the deck textures rebuilt; the same garbage had made a small black notch in the deck at the picture's top left corner, gone too. Judged frame 3150 unchanged by eye (draft compare).
- Main 45d1651 (engine batch 6) merged at b3ad07e. `npx tsx assets-src/travel/probe.ts`: jupiter.travel join in turn 0.005 to 0.007 deg per frame, speed 7.96e-2 to 8.00e-2; mars.travel join out (into my hold) turn 0.041 to 0.041, speed 9.56e-2 to 9.51e-2.
- Rise view: `azimuthDeg -44` gave phase 21 deg (flat, nearly full disc). `out/work/jupiter/tools/risevar.ts` (env `RISE` JSON, builds its own StopPlan) prints phase, disc centre and axis per frame; `phase.ts` lists phase by azimuth. Trying `azimuthDeg 44` (phase 93 deg, Sun from the top of the frame, half lit); predictor lowest min 1.16 at 3283, no soft frame. The predictor's `RISE` override does not move the end pose (it is set in the constructor): edit `plan.ts` instead.

## Rise view and terrain speed (07:00 UTC)

- Rise `azimuthDeg 44` kept (`strip_rise3.jpg`): the storm upright, Io in front with its shadow drawn out toward the terminator, the lower half in night. Judged rise frame 3296 is this view.
- Terrain speed: the old values (`gather 0.6, forward 0.95, rise 0.37`) started the view at 0.0021 units per frame forward (hover) and ended at 0.0083. Mars uses `gather 0.22, rise 0.06`. The apron limits backing up to about 0.41 units (canvas x -1408, y 2376; a lower camera needs more bottom apron, so less climb allows more backing). Now `gather 0.35, forward 1.05, rise 0.12`: 0.0038 at 3060, 0.0058 at 3150, 0.0078 at 3239; footprint at the start x -1216, y 2288 (see the next section for the entry). The judged frame is u 0 and does not move.
- Handover numbers now: orbit 3023 horizon normal 77.8 deg, offset -0.391, vfov 62.3; terrain 3024 72.6 deg, -0.362, 64. Terrain 3269 73.2 deg, -0.274; orbit 3270 72.9 deg, -0.219.

## Entry: canvas edge in frame, found and fixed (07:10 UTC)

- `strip_entry.jpg` with `side 0.114, entryBack 0.2`: the left canvas edge was in frame bottom left from 3024 to 3055 (a black wedge with stars, up to 97 px at draft). `relief/predict.py` missed it: its entry rows hold the base pose at the segment start, but the base path keeps running backward before 3060 (lin below -0.5), so the camera is further back than the predictor says.
- New tool `npx tsx assets-src/jupiter/relief/edge.ts` (env `TERRAIN` JSON override, `FR` like `3024-3060:2,3060-3239:20`): projects the real mesh border (with relief, `deck-dist.bin`) through the real director poses and prints how far the border reaches into the frame, per frame. Use this, not predict.py, for entry and exit.
- Fix: `side -0.24` (the camera starts right of the judged pose and drifts left toward the storm; the right apron had 960 px spare, the left 190) and `entryBack 0.1`. edge.ts: no border vertex in frame on any frame 3024 to 3269.
- Texels view at the old values: 3060 soft 0, min 1.29; 3239 soft 0, min 1.50.

## After milestone 3: the Builder's order (07:15 UTC)

Builder's list, worst first: (1) cover fog outside the limb against black sky at 3019 and 3275, nothing may hang in space; (2) the quick first step of the cover 3026 to 3028; (3) terrain: soft bottom left at 3239, very dark bottom right apron, flow and wisps must be seen moving; (4) mirrored stars below the horizon in the terrain sky patch: fill with haze color, no stars; (5) Io close at 3281 is fine if it does not cover the storm at 3296. The 5 deg horizon step under full cover is accepted.

Done so far (not yet verified by picture, batch5 renders `strip_cover3.jpg`, `strip_exit3.jpg`, `strip_ends3.jpg`):
- (1) The ring outside the limb was the engine cover between 1.0 and 1.08 radii (`coverShell`), not my veil (the veil is mixed into the surface color, body pixels only). `coverShell [1.0, 1.015]`. On the terrain side the engine cover has no shell and covers the sky with `cover color x coverTop`: `coverTop [0.3, 0.05]` (was [0.6, 0.3]) so the sky above the horizon goes dark under the cover instead of brown (Mars [0.25, 0.04]).
- (2) The engine cover's alpha runs from full to about one third within about 3 frames whatever `coverEdge` is (amount 0.85 to 0.3; with `last` 0.5 that is 3026 to 3029; `last` above 0.5 leaves the cover short of full at the cut). So the ten frames come from my own deck fog: `look.deck.haze` density 1.6 to 8, power 2 to 2.5 (clear 0.8 s). Optical depth k = 8 x h^2.5: near field (reach 1.2, thin pattern) 0.97 at 3024, 0.88 at 3028, 0.76 at 3031, 0.58 at 3034, 0.38 at 3037, 0.19 at 3040; far field clear by 3047. The fog color now carries the fog pattern (x 0.8 to 1.2), it was flat.
- (3) `deck.ts` detail layer (`look.deck.detail [amount 0.3, tile 0.7 units, magnification 1.1 to 1.9]`): fine turbulence from `wisp.png` in the turned ground coordinates (it sits on the cloud texture), multiplied in only where the texture is magnified against the judged frame (mag = judged footprint / current footprint from screen derivatives, 1 at the judged frame, so 3150 does not change). `canvas.py night()` lifts the black night side of the aprons to about 6 of 255 with cloud structure.
- (4) `canvas.py`: the sky patch below 0.4 deg is the mirror of a star free copy of the sky.

## Checks of the Builder's list by picture (07:35 UTC)

- `strip_cover3.jpg`, `strip_exit3.jpg`: (1) no ring outside the limb at 3019, 3021, 3273, 3275 (the cream halo that stays is the limb glow of the orbit view). (2) the deck fog now thins from 3028 to about 3044 and gathers from 3246 to 3266. On the rise the globe veil is altitude driven: altitude 0.045 at 3270, 0.26 at 3275, 0.9 at 3280, 2.3 at 3286, so it thins until 3286.
- Found in the same strips: a black belt between the limb and a detached thin rim line, on every terrain frame where the camera is higher than at the judged frame (3024 to about 3100, and the exit). Cause: the deck's wall above the horizon is transparent above the analytic limb, the limb drops against the sky when the camera is higher, and the sky patch below its horizon was the dark mirror fill. Fix as the Builder said: the sky patch below the horizon is the haze color of the far deck per azimuth (`canvas.py`, RECIPE step 4). Check `strip_band.jpg`.
- The page console error "texSubImage2D: Overload resolution failed" came from my `set.ts`: `wispMap.needsUpdate = true` (to get `wrapT` repeat) asked three for a second upload after the engine had closed the bitmap. The upload failed, the wrap mode was still set, so the picture was right. Fix: `wispMap.source.dataReady = false` before `needsUpdate`, three then only sets the parameters.
- Storm rotation raised: `vortices[0]` 5 to 7 deg/s, wisps 9 to 12 deg/s (dt 0 at the judged frame, 3150 unchanged).
- (5) Io at 3296 sits below the storm, clear of it (`r3_quad.jpg`).

## The sky turns against the deck in the terrain view (07:45 UTC)

- The engine sets the terrain set's rotation to `frame x turn(time) x terrainFrame` (`film.ts` state()): the deck rides the spinning planet (`spinDegPerSecond 1.6`), the sky does not. So the sky and its patch move against the limb by about 1.07 deg per second in the pitch direction: at 3060 the patch horizon is 3.2 deg above the limb, at 3150 on it, after 3150 below it (stars set behind the limb). Camera height adds only 0.25 deg at 3060 (`out/work/jupiter/tools/dip.ts`, `lines.ts`: limb at x 1500 predicted y 452, seen 450; patch horizon seen at 375).
- So before the judged frame there is always a strip between the limb and the patch horizon that shows the sky patch below its horizon. Mirror fill: mirrored stars (the Builder's item 4). Star free mirror: a black belt under a detached line. Flat haze color: a flat belt with a hard top (`strip_band.jpg`). Now: haze color of the far deck per azimuth x (1 - exp(elev / 1.5 deg)), dark at the patch horizon, so it reads as glow over the limb (`strip_band2.jpg`).
- A star of the approved picture 0.3 deg above the horizon was baked into `deck-core.jpg` (dot with a dark red halo, seen riding on the limb at 3200 and 3239). `canvas.py` now takes stars out of the deck's sky rows (opening) and subtracts the star free blurred patch.
- `canvas.py` needs about 6 GB: it is killed (exit 137, no message through a pipe) when a render runs beside it. Run it alone and read `out/work/jupiter/canvas.log`.
- Do not `pkill -f batch` only: `strip.sh` and the npm child keep running. Kill `strip.sh`, `tools/still.ts`, `tools/compare.ts` too and check with `ps`.

## Glow strip above the limb, second take (07:50 UTC)

- `strip_band2.jpg`, `band2_three.jpg` (fill = far deck haze x (1 - exp(elev / 1.5))): 3030 to 3100 show a cream strip over the limb that reads as lit air, but its top is a hard edge with a thin black line (the fill is zero at the patch horizon, the sky above it is not). 3200 and 3239 are clean, the star speck on the limb is gone, 3255 and 3266 gather the fog.
- Compare terrain draft with the rebuilt deck and patch: 3150 still matches the approved picture (`compare-jupiter-terrain-view.jpg`).
- Second take in `canvas.py`: fill = star free sky background of that azimuth (0.5 to 2 deg above the horizon) + far deck haze x (1 - exp(elev / 1.5)) ^ 2.5. No dark line, the glow starts softly under the patch horizon. This is the last take before READY; if it is not better it goes on the weak list.
- Committed and pushed 1864a85 (code and notes, binaries of the first take not committed).
- Second take checked (`band3_four.jpg`, `band3_3060_crop.jpg`): the strip over the limb at 3030 to 3100 is a soft glow that fades into the stars, no hard top, no black line. Kept. `canvas.py` peaks near 7 GB even with the 4x reduced background pass: run it with nothing else on the VM.

## Own checks at head 6ac52de (main 558e3a5 merged, 08:00 UTC)

- `npm run build` green, `npx vitest run` 35 of 35.
- G11 PASS (every asset has a row or a recipe). G12 PASS (1076 tracked files, 0.85 GB). G15 PASS (at most 2 sets per frame; jupiter/web 194 MB of 450, jupiter/full 777 MB of 1400).
- `npm run measure -- --stop jupiter --every 10` (281 s; the texels view at draft takes about 2.5 s per frame, so the full run is about 25 min): G5 PASS (invalid 0 on the four judged frames; coverage hold 0.350, dive 0.459, terrain 0.754, rise 0.233). G17 PASS (2895 median 1.222, p25 0.963 over 81 tiles; 3150 median 1.026, p25 0.988 over 80 tiles). G13 PASS on the sample: 0 of 47 frames over 0.02 soft; lowest mean texels per pixel dive 1.74 at 3010, terrain 1.94 at 3236, rise 1.78 at 3282, hold 2.0.
- `npm run compare` at final tier, both views: 2895 and 3150 read like the approved pictures (`out/work/compare/compare-jupiter-hold-view.jpg`, `compare-jupiter-terrain-view.jpg`).
- READY sent at 08:02 UTC. The full measure (`--every 1`, log `out/work/jupiter/measure1.log`) runs after it; then review sheets with and without cover, crops, flow view, budget, travel frames.
- Logs: `out/work/jupiter/gate-g11.log`, `gate-g12-g15.log`, `measure10.log`, `compare-hold-final.log`, `compare-terrain-final.log`.
- Full measure done 08:15 UTC (`--every 1`, 864 s, `out/work/measure/jupiter.json`): G13 PASS, 0 of 463 frames over 0.02 soft; worst 3260 0.91 percent, 3261 0.81 percent, 3259 0.38 percent (the exit frames under the gathering fog). G5 and G17 as above. `npm run -s gate -- --phase 4 --only G5,G13,G17 --stop jupiter`: three PASS. Sent to the Builder as a follow-up.
- Render cost seen in the measure: texels view at draft 1 to 2 s per frame once the page is loaded; a final tier frame about 60 s. The 14 s of a draft still is mostly page load and shader compile.
- 08:16 UTC: `/tmp/after.sh` renders the review sheets (terrain, dive, rise, hold, then dive and rise with `--cover`) and the flow view at 3100, log `out/work/jupiter/after.log`.

## After READY (08:17 to 08:30 UTC)

- Builder's mail 08:17: main holds engine batches 8 and 9 (terrain shield, trim of haze shell triangles) and all eight stops; round 8 starts from the head of `agent/jupiter` and the head is mirrored again at each round start. Merged main 7919c31 (head 32c240d; NOTES conflict resolved to mine). Draft frames before and after the merge: 2895, 2997, 3150 byte identical; 3296 differs only by the sky behind the rise (now the next stop's sky with the Milky Way; inside the disc 2 percent of pixels by 1 code value). No opt out needed: my deck is not the shared `Relief` (no shield), and the trim on `HazeShell` changes nothing. Told the Builder.
- Review sheets rendered before the change below: `out/work/sheets/jupiter.terrain-16x9-review.png` (storm grows from a quarter to half of the frame width, foreground towers leave the frame bottom left, glow strip over the limb until about 3109) and `jupiter.dive-16x9-review.png` (slow push until 3010, rush 3010 to 3024, 3027 dark smoky cover, 3035 beige fog with the bright strip over the limb).
- The quick first step of the cover is a brightness dip, measured on draft stills (mean of the frame centre, R of 255): 3021 160, 3023 137, 3024 124, 3026 88, 3028 107, 3030 131, 3033 127; exit 3258 122, 3262 132, 3266 97, 3269 118, 3270 137, 3273 183. Cause: below the horizon the engine cover uses `coverLow` blended to `coverLowTerrain`, and `coverLowTerrain [0.075, 0.064, 0.055]` was far darker than my deck fog (131, 119, 103 on screen). Fitted from 3024 and 3026 (display is about cover color to the power 0.63 to 0.72): the fog tone needs `coverLowTerrain [0.205, 0.173, 0.138]`. Set that, `coverTerrain [0.21, 0.177, 0.14]`, and `coverTop [0, 0]` (sky under the terrain side cover black like the orbit side at the cut: top right 0.4 at 3023 against 45 at 3024 before). Check: `strip_cut4.jpg` (batch9).
- The strip of glow over the limb (3024 to about 3109) cannot be removed in my folder: the sky does not turn with the planet, so the patch horizon stands above the limb before 3150. Lowering `spinDegPerSecond` would shrink it but changes hold, dive and rise. Left for the round.
- `strip_cut4.jpg` checked: centre brightness (R) 3021 162, 3023 152, 3024 148, 3025 144, 3026 140, 3027 137, 3028 135, 3030 131, 3033 128; exit 3262 132, 3266 137, 3268 144, 3269 149, 3270 156, 3271 160, 3273 184. No dip any more, top right 0 on both sides of both cuts. Committed f505575.
- With the dip gone the strip over the limb stood out as a bright cream band next to the fog at 3028 to 3035 (it was as bright as the far deck). Third and last take of the fill: `canvas.py` multiplies the haze by 0.3, so the strip is always dimmer than the deck under it. `strip_band4.jpg`, `band4_3060_crops.jpg`: a dim warm glow over the limb at 3028 to 3100 that fades up; stars begin at its top (about 3 deg over the limb at 3060). Kept; binaries of this take are the ones to commit for this round (`deck-wide.jpg`, `deck-core.jpg`, `sky-terrain.webp`, both sets).

## Round 8 running (from 08:57 UTC, judged at b3bc1be)

- Builder's mail 08:57: round 8 (first of three) renders from `agent/jupiter` at b3bc1be on twelve machines; everything pushed after b3bc1be (cover tone f505575, dimmed strip 0877121, Io below) is judged in the next round. Scorecard expected 10:00 to 10:30 UTC.
- Review sheets after the cover fix: `jupiter.rise-16x9-review.png` (3240 to 3253 exit with fog gathering, 3267 cover, 3274 bright veil, 3280 rush with blur, 3287 to 3314 planet lit from the top, dark lower half against the next stop's Milky Way, Io beside the storm with a long shadow streak), `jupiter.hold-16x9-review.png` (planet nearly static on screen, stars slide).
- Hold motion measured with `out/work/jupiter/tools/io.ts` (screen positions of the disc, the storm and Io per frame, in disc radii from the disc centre, 1920 wide): storm 2820 (-0.40, 0.25) to 2969 (-0.36, 0.23), 19 px; Io at `moonDegPerSecond 0.9` (0.19, 0.31) to (0.16, 0.28), 10 px. Cause: the camera orbits 1.2 deg/s the same way the planet spins 1.6 deg/s and Io turned 0.9 deg/s, so Io stood still on screen. Io does not cross the disc.
- Io rates tried in the tool (hold start to hold end, then judged rise 3296): 2 gives (0.12, 0.31) to (0.22, 0.28), 51 px, rise (-0.03, -0.18); 2.4 gives 0.10 to 0.25, rise (-0.01, -0.07); 2.8 gives 0.08 to 0.27, 95 px, rise (0.01, 0.05). Storm at 3296 is at (-0.13, -0.71), so every faster rate moves Io away from it. 2895 does not change (Io is anchored at the hold mid).
- `strip_io_rate2.jpg` (rate 2): Io leaves the frame before 3281 (it was 92 px wide at the disc centre there), enters from the bottom at 3283 and sits on the terminator from 3290 on, lit, its shadow falls on the night side. Io past 17 deg behind the terminator would be in Jupiter's shadow (the set computes that eclipse), so rates above about 3 would hide it in the rise.
- Chosen `moonDegPerSecond 2.6` (about 0.18 radii, 85 px across the hold).
- Band flow and storm turn in the hold seen on 2820 against 2969 (`out/work/view/hold_pairs.jpg`, `hold_diff.jpg`): the storm arms turn about 22 deg, band edges shear against each other, the wisp layer drifts. Small by design (closed form, settles within a segment).
- The second full measure was stopped at 220 of 463 to change Io; it runs again at the new head before any gate claim.
- Third full measure at 7780e18 (Io 2.6), 867 s, log `out/work/jupiter/measure3.log`: G13 PASS 0 of 463 frames over 0.02 soft (worst 3260 0.91 percent, 3261 0.81 percent, 3259 0.38 percent); G5 PASS invalid 0, coverage hold 0.350, dive 0.459, terrain 0.754, rise 0.233; G17 PASS 2895 median 1.222 p25 0.963 over 81 tiles, 3150 median 1.026 p25 0.988 over 80 tiles. Gates G5, G13, G17, G11 PASS (09:18 UTC).

## Round 8 result (first of three), 09:31 UTC, judged on main 47a7600 (my b3bc1be)

Scorecards on main at dc0bf6d: `scorecards/round-008/` (SUMMARY.md, R1.json, R3.json, R4.json, key.json). R1 9 (three minors), R3 4, R4 6, R2 pass (3 of 10 against 2 of 10), R8 pass, G5 G13 G17 green. 2 severe, 7 major. Two rounds left. Corrections from the Builder, worst first (motion first where two compete):

1. SEVERE twice: dive 2997 shows the sky repeated by mirroring (vertical seam near x 1848, crop 1824,866,96,214; crossing seams upper left 0,0,456,433). Cause: `assets-src/jupiter/sky/patch.py` pads the sky patch with `np.pad(mode='symmetric')` past the approved image's border. Outside the border: fade into the film's shared star sky (graded to the patch's level and star density) within a short band, or continue with content that is not a reflection. Inside the border nothing changes. Check: `python3 tools/assets/mirrorcheck.py <png...>` must print clean for 2895, 2997, 3150, 3296, 3352 and two more frames in the dive and two in the rise; also look at native size.
2. MAJOR dive cover 3028 to 3029: blurred cloud field becomes in one frame a flat tan veil with a sharper rim and much clearer stars. Carry the moving haze into the terrain view for several more frames, match rim sharpness and star visibility on both sides of the cut.
3. MAJOR rise cover 3269 to 3274: broad blurred haze gives way to a clean curved limb and nearly black sky around 3270, then rim detail and stars return within a few frames. Align the limb on both sides, bring rim brightness and stars back over ten frames or more.
4. MAJOR night limb (3296 and 2997): hard circular mask, stars stop on a clean arc; stair steps along the dark silhouette and the lower left lit limb. One haze falloff across the limb.
5. MAJOR Io: surface blocky at native size, lit limb with one pixel stair steps and a dark fringe against Jupiter; shadow in the rise a long vertical column that never closes into an ellipse and smears into the night side. Finer colour map, feathered edge with no dark fringe, shadow as a closed ellipse with a penumbra.
6. MAJOR Milky Way in 2997: coarse noisy texels at 1:1, stars hard single pixel squares or 2 by 2 blocks. Check the patch's scale at that camera and the star rendering.
7. MINOR terrain 3060 to 3239: weak parallax. More sideways travel so near ridges cross faster than the horizon, and band flow round the storm that can be followed.
8. R1 minors: lower two thirds of the terrain view one to two levels darker and less warm than approved (red and orange most); night limb a few pixels inward in the hold; stars a little busier; R3 minors: lit limb washed to a flat cream band (hold crops B, D), night side a uniform fill, cloud map slightly soft at 2997.

Before READY: merge origin/main (engine batch 10, asteroid belt), own gate and both measures green, looks pushed. READY names the commit, what changed per item, what is still weak.

## Round 8 corrections, work log (from 09:35 UTC)

Head before: 7780e18. Merged main 811fbca (engine batch 10) as 1f5c3e0. Main moved again (baed58d and later): merge again before READY.

### Item 1 (sky reflection), done in the files, commit e1aa60c (code), binaries in the working tree until the round's best take is chosen

- Tool `assets-src/jupiter/sky/margins.py` (`hold-prep`, `hold-place`, `terrain-prep`, `terrain-place`, run with `PYTHONPATH=assets-src/jupiter/sky`). `patch.py` no longer pads with `symmetric` (edge pad, and `side()` no longer blends a mirrored copy); the margins come from `margins.py`, which keeps the inside of the approved border byte for byte (it prints the check).
- Hold patch: left and right margins from the takes of the earlier round (`gen/skyext_{left,right}_sd5.png`) placed without any mirror blend; top from two new takes `gen/skyext_{tl,tr}_sd5.png` (seedream_5, 16:9, take 1 each, phase correlation score 0.954 and 0.951), joined at the middle column over 32 px; bottom from `gen/skyext_br_sd5.png` (take 1, score 0.92, padded columns 704 to 3520) joined at column 736 to a translated copy (`borrow()`: the sky 198 rows higher and 250 px sideways, high pass sigma 24, on the border's level). Rejected: bottom left takes `skyext_bl_sd5`, `skyext_bl_t2_sd5`, `skyext_bl_t4_sd5` (seedream_5, redrew the whole picture), `skyext_bl_t3_nbp` (nano_banana_pro, second Milky Way band), centre window `skyext_bc_sd5` (redrew the picture).
- Terrain patch: top from two takes `gen/skyterr_{tl,tr}_sd5.png` (seedream_5, 16:9, take 1 each, score 0.904 and 0.921) made on display domain windows of the canvas with the approved image inside (`gen/skyterr_{tl,tr}_in.png`, top 198 rows grey). Only the fine part of the takes is used (minus a Gaussian of sigma 40, in display values, each take on its own, cross-fade over 240 px from column 704), on a level taken from the 24 rows under the border, smoothed over 48 px and continued upward along a slope of 3 px sideways per row (the horizon and the Milky Way both run that way). Right margin: the canvas right tile, level matched to the inside at the border (harmonic), its chroma cut to 0.35 (the tile's stars were orange). Left and bottom margins lie below the horizon: the haze formula recovered from the inside (mean error 0.0006). First try (patch domain window with a grey bar on the right, `gen/skyterr_right_sd5.png`) redrew the picture, rejected.
- The image model redraws the whole picture when the window is mostly dark, or is the patch domain terrain picture; it stays faithful on display domain pictures and where the Milky Way reaches the bar. `bar()` refuses a take whose phase correlation shift exceeds 8 px; good takes score 0.90 to 0.95, bad ones 0.1 to 0.26.
- `tools/assets/mirrorcheck.py` on drafts after the hold rebuild: 2895, 2985, 2997, 3013 clean; 3005 reports x 1596 (0.60) and 3020 reports x 224 (0.56). Own scan `out/work/jupiter/tools/axis.py` repeats the tool's test and then leaves out the 6 px beside the axis: the correlation falls to 0.00 in both, so the score comes from one bright star sitting on the test axis, not from a reflection. Native windows `out/work/view/mirror_3005_3020.jpg` show no reflected pattern.
- Weak: the generated margins hold fewer stars than the inside (hold), and the terrain top margin near the horizon glow is only a level continuation.

### Plan for the other items (causes found)

- Item 2: engine cover alpha falls 0.42 to 0.10 between 3028 and 3029 (amount 0.5 to 0.316; the alpha has a threshold) and on the terrain side it covers the whole frame with `coverTop [0, 0]`, so the sky is black under it and stars return in one frame. The cover window (16 frames) is the engine's. Plan: `coverSea { centre: nadir x (R + 1), radius: R, edge }` (nadir and R from `relief.json`; R 331.946, 1.004 R is about 2.9 deg over the horizon like `coverShell [1, 1.015]` at the handover altitude) so the sky is open on both sides of the cut; the deck's own haze takes over with a moving pattern and a rim softness that falls with the haze amount over about 20 frames.
- Item 3: same on the rise side (cut 3269 to 3270).
- Item 6: at 2997 the hold patch is minified 1.56 texels per pixel (hold 1.47), not magnified; the stars are the approved hero's. Test `mips: true` for the sky patches.

## Next

- Milestone message dive and rise after `strip_entry.jpg` and the texels views at 3060 and 3239 are checked.
- Entry frames 3024 to 3030: look for the dark deck edge bottom left; exit pose values are still the first guess but the strips show no edge.
- `npm run measure -- --stop jupiter` (long: every frame of four segments; `--only G13 --every 6` for a first pass).
- Check in motion: storm rotation, vortices, wisps, lightning (`--diag flow`), shells fade with altitude, rise far side, poles, terminator, travel and FarPoint.
- Milestone message dive and rise, commit the patch binaries once.
- Self check: measure, compare final, sheets, crops, budget (alone, more than 8 min), gates `npm run -s gate -- --phase 4 --only G11` and `--only G12,G15 --g15-stops mars,jupiter`. Then READY (build and tests green on main merged, stand-ins removed, looks pushed).
