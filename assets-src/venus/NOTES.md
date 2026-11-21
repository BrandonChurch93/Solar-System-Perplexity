# Venus stop notes (lab notebook)

Agent: `/root/venus_builder`, parent `/root`. Branch `agent/venus`, looks branch `agent/venus-looks`. Times are UTC.

After a compaction: read `assets-src/shared/STOP-AGENT.md`, then this file, then carry on.

## Standing facts

- VM: 4 cores, 7 GB RAM, about 17 GB disk. `npm ci` done, `npm run build` passes.
- Segments (s): hold 37 to 42, dive 42 to 45, terrain 45 to 51, rise 51 to 53.5, travel 53.5 to 56. Judged frames: hold 1185, dive 1287, terrain 1440, rise 1586.
- Budgets: full 1400 MB texture memory with mipmaps, web 450 MB. Disk full 150 MB, web 35 MB (Builder's mail 03:07, the brief said 40). File limit 95 MB. 6 takes per asset per round. 3 rounds with the critics.
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
- 02:50 to 03:00 upscales to 5632 wide: `out/work/venus/hero-5632.png`, `close-5632.png` (one upscale uses 3.1 GB).
- 02:55 close camera fit (vfov 60): pitch down 21.48, roll -1.03, dip 10.91 deg, altitude 0.0184 radii. Horizon points `out/work/venus/close-horizon-pts.npy`. Sun in the close image at px (2103.6, 503.2) of 2816 x 1584 = 26.89 deg right, 10.63 deg above the optical axis.
- 03:00 plan.ts: spot {x 0.6222, y 0.4356} (hero px 1752, 690, lit towers on the terminator, view cosine 0.9), dive.headingDeg 98.25, terrain {vfov 60, horizonDeg 10.57, dipDeg 10.91}. With spin -0.5 deg/s the engine Sun at 48 s sits at (right 0.4455, up 0.1899, fwd 0.8749). Stand-in terrain compare had the film Sun about 47 px (2816 scale) above the approved one: recheck with the real relief.
- 03:00 second looks push (9ebab7b).
- 03:07 Builder mail: web set at or under 35 MB, send engine.patch early, keep travel in and out free of pops like Mars (FarPoint).
- 03:00 to 03:12 hero taken apart (`assets-src/venus/wrap/`): lightning.py (cells at lon/lat (23.33, 17.8), (9.32, 14.74) painted in bolt.jpg, (32.04, 54.69) small seeded), unproject.py, curve.py (33 knots in `src/stops/venus/curve.json`, dayColor [1.0316, 0.4566, 0.1793]), albedo.py, deveil.py (limb veil flattened for view cosine 0.7 to 0.42). Hero cap weight = smoothstep(0.2, 0.42, view cosine).
- 03:14 globe.ts, set.ts written (Mars pattern): equirect map, curve, differential band drift (zero at the spot latitude), flow veil layer in ratio form (frame equals hero at hold mid), lightning cells (painted and seeded, peak at 39.5 s), FarPoint.
- 03:20 looks pushed: first real globe render.
- 03:20 to 03:35 limb. The film camera has a seeded drift (rig.ts DRIFT_RAD 0.0011), so the film disc at frame 1185 sits about 2.4 px (2816 scale) above the hero disc: all fits must use each image's own measured disc. Hero disc is not round: centre (1481.28, 786.88), semi axes 669.76 x 664.26 px (0.8 percent flat). Film disc (1481.46, 785.61) r 669.21.
- Limb model: one float table `limb.bin` (65 x 256 RGBA float32, read with ctx.dataTexture): columns = azimuth around the disc from the projected Sun direction (64 steps + wrap column), rows 0..127 inside the disc (b from 0.7 to 1, row 127 at the limb), rows 128..255 outside (b from 1 to 1.6), b = 1 -+ range * s^2. Scene values, added in globe.ts (inside, `limbGlow`) and rim.ts (outside, back side sphere radius 1.7, additive). Built by `python3 assets-src/venus/fit/limb.py build NOLIMB.png` (film still with `haze.json limb.gain 0` and `sky.json orbit.gain 0`, review tier, nograin) then `refine FILM.png 0.9` two or three times (film still with limb on, sky black). After refine: inside rms 0.04, outside rms 0.012 scene units. dist is rebuilt only when src changes: run `npm run build` after changing a public asset.
- Far side (stage 1): cube about the hero centre, faces l, r, u, d, b, FOV 110, 2048 px, magenta = unknown, model seedream_5 kept for all five (nano_banana_pro pasted the style image into the tile three times out of three: a second vortex, visible square). Takes: l 2, r 2, u 2, d 2, b 3. Seedream comes back paler (Lab b 22 to 27 against 35): every face is matched to the hero cap Lab mean and spread (`stage1_compose.py`), later faces only fill what earlier ones left, feathered. Result `out/work/venus/wrap/far-eq.png` -> `build.py`.
- Sky fill for the hold patch: seedream_5 take kept (`out/work/venus/sky-fill-sd.png`, same size as the hero, band continues evenly); nano_banana_pro take came back 2752 x 1536 with a brighter core behind the planet.

- 03:35 to 03:47 limb refit. `limb.py` rewritten: `build NOLIMB.png LAYERS.png` (frame 1185, review, nograin, limb gain 0, sky gain 0; LAYERS is the `--diag layers` still, the film disc comes from its coverage: (1482.06, 785.75) r 669.53) and `refine FILM.png GAIN`. Inside rows are a haze layer over the disc edge (rgb emission, a opacity, film = surface * (1 - a) + rgb), outside rows additive glow, non increasing. The hero's edge is measured per azimuth (`dev` in `out/work/venus/limb-geom.json`): the hero night limb lies up to 9.57 px outside the fitted ellipse. The older additive table with sharp refines drew concentric rings: gone. `rim.ts` limbGlow returns vec4.
- 03:40 sky patch on: `sky/patch.py` uses the same per azimuth edge. sky.json orbit gain 2.5. Fill gain [2.125, 1.959, 1.319], own share 0.635.
- 03:47 to 03:53 native crops showed cyan and green on the brightest terminator cloud tops: the albedo map clipped red at 6 in a filmic 8 bit encoding. New encoding: albedo = 24 * v * v (v linear texel value), chroma kept at the clip, highlights restored from hero-eq.png. `wrap.json top`. Everything that writes albedo (dive patches too) must use it.
- 03:53 `bash assets-src/venus/fit/orbit.sh` runs the whole orbit fit again (nolimb, layers, build, refine 0.8, refine 0.6, halo only, sky patch, build). Last run: inside 0.0175, outside 0.0042 scene units RMS.
- 03:57 seeded lightning cells drew soft lavender balls. Now they light the cloud's own structure: lum * (lum / blurred lum)^3 inside core^2. Crops at hero px (1777, 467) and (1700, 572) match the hero.
- Orbit weak points known: hero disc not round (film sphere is), far side softer than the hero side and has soft seams between generated faces, camera drift offsets the film disc by about 2 px, features brighten or dim as they cross the terminator in the hold (albedo is hero / curve).

## Terrain plan (03:52)

- Engine relief: `src/terrain/relief.ts` (`Relief.load(ctx, base, def, motion)`), layers with color JPG, alpha PNG, dist `.bin` (float32, half size, distance along the image ray), masks PNG (R drifts, G drifts, linear in time). A sway needs a sine of time, so a copy in `src/stops/venus/` if needed. Mars pattern: `src/stops/mars/set.ts`, `assets.ts` reliefDef, `look.ts` relief, `assets-src/mars/relief/RECIPE.md`.
- Terrain pose units: camera height above the deck = 1. Venus sphere radius about 54.3 units, horizon about 10.5 units away, bottom ray meets the deck at about 1.3, centre ray at about 2.7.
- Layers: L0 whole deck with outpainted margins and a soft cut at the horizon, L1 the three central towers as cutouts with painted fill behind, maybe L2 the near cloud mass. Depth from `tools/ml/depth.py` fitted to the sphere model. Masks: R haze between towers (drift), G shafts (sway). Colour `out/work/venus/close-5632.png`. Sky patch `sky-terrain.webp`.

## Log, continued

- 04:00 to 04:10 hold sheet (review) showed three faults, all fixed: a ghost arc behind the planet (the generated fill was brighter and greener than the hero's sky: its low frequencies now come from the hero's sky interpolated along each row), mirrored margins of the sky patch at the frame edges (now a generated outpaint, `sky-ext-sd.png`, registered by ECC 0.9982, gain 1.218), bright lightning dots at the limb (lift clamped at 1.7, lum at 1.2). `sky.json` orbit gain 2.5.
- 04:07 Builder: main at b4ae65c (engine batch 1), merged as e8c5bc8. Engine hash 434d0a5e367a62fd. Shader tip: the software rasterizer computes both sides of an `if` but skips the body of a `for`; put expensive conditional work in `for (int k = 0; k < (cond ? 1 : 0); k++)` and read textures inside with `textureGrad` or `textureLod`.
- 04:13 ORBIT MILESTONE sent. Hold compare at review close to the hero; vitest 24 of 24.

## Terrain work (04:00 onward)

- Canvas: the approved close image (2816 x 1584) sits at x 352 to 3168, y 0 to 1584 of a 3520 x 2376 canvas (margins 352 left and right, 792 bottom). Full asset scale is 2x (7040 x 4752), web 1x.
- Margins: `out/work/venus/relief/ext-nb1.png` (nano_banana_pro kept: warmest, closest palette; two seedream_5 takes paler). Clean plate without the two central towers: `clean-sd1.png` (seedream_5). `python3 assets-src/venus/relief/compose.py ext-nb1.png clean-sd1.png` writes `ext-3520.png`, `clean-2816.png`, `ext-weight.png` (ECC 0.9984 and 0.99).
- Depth: `relief/ext-depth.raw` (3520 x 2376 float32, relative inverse depth, near = 1).
- Camera model `assets-src/venus/relief/cam.py`: vfov 60, focal 1371.78 px at approved scale, pitch down 21.48, roll -1.03 (up = [0.01673, 0.9304, 0.36618] in camera axes), height 1, sphere radius 54.35, horizon distance 10.47, dip 10.908. The 70 measured horizon points sit at elevation -0.015 +- 0.036 deg in this model.
- Depth fit: dist = 1 / (a * depth^g + b), b = 1 / 10.47, a 1.3896, g 0.9014 (median abs log error 0.10 against the sphere). Ratio dist / sphere: towers 1.14 to 1.16 (the depth sees them as deck, so tower distances must come from their base), left bank 0.87, margins 0.74 to 0.97.
- Towers in approved px: centre x 1360 to 1700, y 790 to 1025; right x 1750 to 2030, y 835 to 1025.
- Sun in the close image at approved px (2103.6, 503.2), about 2.4 deg above the horizon. L1 box in approved px (1310, 760, 770, 290).

### Terrain build (04:14 to 05:00)

- Files: `relief/cam.py` (camera model), `compose.py`, `build.py` (no arguments, about 45 s; writes L0, L1, masks, `relief.json`, and for other scripts `out/work/venus/relief/canvas-1x.png` and `d0.npy`), `apron.py L_TAKE R_TAKE` (about 12 min, two upscales; writes `relief-Al-*`, `relief-Ar-*`, `src/stops/venus/aprons.json`), `air.py` and `air.sh` (base frame, air dome texture, terrain sky patch), `poses.ts FRAME...` then `footprint.py` (camera height and deck footprint per frame). Recipes with prompts are in `RECIPE.md` under "Terrain view".
- `src/stops/venus/relief.ts` (`CloudRelief`): an air dome (sky glow, the approved Sun, fixed to the true horizon of the camera's own position: local up and dip from the sphere) drawn first, then the layers Al, Ar (aprons, no depth write), L0 (deck, fades in over its outer 160 px left and right), L1 (towers). Haze drift (mask R, linear in time) and shaft sway (mask G, sine of time).
- Engine facts: cover seconds 0.5, dive cover frames 1306 to 1321 (centre 1314), rise cover 1552 to 1567 (centre 1560). The terrain view is on screen from 1314 to 1559. Entry adds (entryHeight g, entryBack g, pitch) with g = ((1 - u) / (1 - 0.511))^2.2: 0.643 at the cover centre, 0 at frame 1350. Exit from frame 1530. Frames 1322 to 1349 show the terrain uncovered and count for G13.
- Camera heights: 1.42 at 1322, 1.073 at 1350, 1.0 at 1440, 0.927 at 1529, 1.28 at 1548, 1.475 at 1552, 1.93 at 1559.
- Post chain: sharpen 0.6 (dark undershoot beside bright edges), bloom 0.08, vignette 0.45.
- The dome's cut (0.92) dims the engine Sun to 8 percent: the Sun in the film is the approved Sun in the air texture.
- Faults found and fixed: dark line at the horizon (blur mixed deck into the air; sky values now continued downward before the blur); ring and lines around the towers from a depth top-hat mask (now hand polygons, GrabCut, exact rebuild); pale stretched near-cumulus layer L2 (dropped, near cumulus are bumps in L0); bright outpainted puffs below the frame (bottom margin graded dark); holes at the lower corners in the entry (aprons); starless band above the horizon at 1529 (stars mirrored below the horizon in the patch).
- 05:00 frame 1548 (exit) showed: (1) a line of coloured sparkles in the sky: the thin limb line and amplified noise lived in the star patch, which stays with the stars while the horizon drops. Now the limb line is kept in the air (`calm_limb`: opening along the horizon) and the stars are gated where the air is bright. (2) a flat band 1.2 to 1.6 deg high between the dome's horizon and the deck: the dome used the fit position's up, 0.86 deg off after 0.83 units of travel; now local up. The remaining gap (deck mesh ends at the fit pose's horizon, 0.36 deg at 1548, 0.5 at 1552) is filled by the dome holding the horizon colour for 2 deg below the horizon.
- 05:00 Builder: main at 3523b45 (engine batch 3, hash e44fa21a5a599a98), merged. `npm run -s aim -- --stop venus` printed `skyAim: { orbit: [-178.86124, 23.97435, -12.9392], terrain: [70.88563, -102.57248, -13.65] }`, pasted into plan.ts (same picture, now fixed against other stops' changes). The sky behind the rise belongs to the next stop: paint nothing against it.
- 05:05 to 05:50 entry and exit repaired. Facts:
  - Frame 1322 had holes at the bottom (L0 ended inside the frame): the generated bottom margin stood at 0.67 of the sphere distance, so a pull back of 0.35 brought its lower edge into frame. Margin relief now pressed to 20 percent (`build.py`), edge out of frame from 1314 on.
  - Frame 1548: second small Sun (the film's Sun at 8 percent leaving the approved Sun as the horizon dips): the dome now cuts the sky fully within 2 deg of the film's Sun (`sunHideDeg` in look.ts). Dark mound and lines in the sky: holes of the star patch where the air was bright; now filled from a clean part of the image, mirror line at 1.0 deg.
  - G13 on the exit frames (my check: `bash assets-src/venus/relief/texels.sh FRAME...`, review stills, the share under 2.0 there equals under 1.0 at master). Texel density is 1.47 at the fit pose. What costs it: forward travel past the fit pose (near field magnified), NOT the rise (rising helps). With forward 0.7: 1.6 percent at 1529, 3.4 at 1538. With forward 0.6, exitHeight 1.6, exitForward -0.25: 0.5 at 1529, about 1.1 at 1540, 0.4 at 1551. The base pose keeps moving forward at terrain speed during the exit, so a negative exitForward cancels it.
  - The haze drift stretched the texture at the mask's edges (uv shift x mask gradient): mask blur 40 px, drift clamped to +-3.3 s (`flowSeconds`), speed 0.0025.
  - The smear on tower edges in exit stills is the motion blur of the review tier (few samples), not the mesh.
  - Budget (`npm run budget -- --stop venus`, takes 6 min, it is a render): full 585.6 MB of 1400, web 148.2 of 450. Disk full 38 MB, web 11 MB. Six dive patch levels at 4096 would add 537 MB.
- 05:25 Builder: main at 2d2161b (engine batch 4), merged at 05:46 (d3447c8). Before READY run `npm run -s gate -- --phase 4 --only G11` (every file under public/assets/venus named in RECIPE.md as `public/assets/venus/<set>/NAME`; a file list is at the end of RECIPE.md, keep it complete; failures listed for shared/belt are not mine) and `npm run -s gate -- --phase 4 --only G12,G15 --g15-stops mars,venus`, and put the three results in the READY message.
- Plan now: terrain { forward 0.6, rise 0.12, side -0.1, entry 0.7 / 0.7 / 5, exitHeight 1.6, exitForward -0.25, exitPitchDeg 10 }.
- 05:50 to 06:00 CORRECTION on G13. `formats.master` is 1920 x 1080 (not 3840 x 2160), and G13 counts a pixel soft when the red byte of the texels view is under 127.5, that is under 1.0 texel per pixel at 1920 x 1080. My `texels.sh` had counted under 2.0 (red byte not saturated), twice as strict. At the real threshold the terrain frames 1322, 1335, 1529, 1538, 1546, 1551 have 0 soft pixels. `texels.sh` now prints the G13 share, the share under 1.5 and the share under 2.0 (1.0 at uhd). The limit of 0.6 on `terrain.forward` came from the strict count: there is room to travel further (try 1.0 to 1.2 and look at the relief at the ends).
- 06:00 the pale cumulus of the generated bottom margin (entry frames 1322 to 1385) now takes the tone of the approved image's edge (`grade` in `build.py`: ratio of low frequencies continued outward). After `build.py` always run `apron.py ... dist`, then `npm run build`.
- 06:00 terrain compare at review after the regrade: same picture at 1440. vitest 28 of 28. TERRAIN MILESTONE sent.

## Dive and rise (05:50 onward)

- Predictor: `npx tsx assets-src/venus/patches/predict.ts --levels "90,53.13,28.07,14.25" --kinds dive,rise --every 3 [--stop mars] [--width 1920]`. It casts the film camera's rays and repeats the shader's density math. At 1920 x 1080 it gives 0 soft on the Mars dive and rise (as the Mars record says), so it is trusted.
- Spot in the body frame: lon 25.49, lat 50.37 (`patches/spot.ts` writes `patches/spot.json`). Sun at the spot: elevation 8.4 deg, azimuth -70 deg from north (upper left in a north-up patch). Dive heading: azimuth -100 deg (west, toward the Sun).
- Levels: gnomonic about the spot, half-tangent 1, 0.5, 0.25, 0.125 (90, 53.13, 28.07, 14.25 deg), 4096 px full, 2048 web. With the current moves the predictor gives 0 soft on every uncovered frame with the first three; the fourth covers the frames inside the covers. Texture memory: 4 x 89.5 MB more (586 -> 944 of 1400).
- Pipeline (`patches/patch.py`, `patches/tiles.py`): parent canvas at 4096 (level A: the wrap resampled; others: the parent's central half, exactly 2x), split into 2 x 2 tiles of 2240 px with 384 px overlap, each tile generated (nano_banana_pro, one input, "strict 2x super-resolution" prompt in RECIPE), resized to 2240, low frequencies locked to the canvas (ratio, sigma 28 px), chroma taken from the canvas (sigma 3 px, so the pink-cream highlights of the wrap keep their color: the model turned them cream), blended over the overlaps. Checked with `tools/ml/checkmoved.py` (p99 at most 1.5 px).
- Level A tiles: take 1 kept for all four (all pass checkmoved; br came back brighter, the lock takes that out).
- Dive move to do: `swoop: true` (the orbit side ends in the terrain entry's attitude and speed), `dive.altitude` 0.0267 (= 0.0184 x 1.45, the entry height at the cover centre, so the horizon dip is equal on both sides). Rise: `level: true`, `hug`, `settle`, `pan`, `ahead` as on Mars. Cover: `coverLow`, `coverTerrain`, `coverLowTerrain`, `coverTop`, `coverEdge`, `coverShell`, `coverRush` (see `src/terrain/cover.ts`, `src/director/film.ts` line 344).
