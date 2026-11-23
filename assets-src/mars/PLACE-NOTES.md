# Mars place notebook

Owner: `mars_place_builder`. Branch `agent/mars-place`. Looks folder `mars-place`. Reports go to `/root` by message.

Read after a compaction: this file, then `AGENTS.md`, `kit/addenda/`, `cut/HANDOVER.md` (Part B, S1 and S2), `assets-src/shared/HANDOVER-NOTES.md` ("How a stop uses it"), `assets-src/shared/STOP-AGENT.md`, `kit/PROGRESS.md` ("Review note of 2026-11-23", "Look lock"), `kit/06-ASSETS.md`, every `RECIPE.md` under `assets-src/mars/`, `kit/07-QUALITY-BAR.md` (G13, R3, R4).

## Brief 238 (from /root, 2026-11-23 09:59 UTC)

Task: S2 of `cut/HANDOVER.md` for Mars. Build the ground on the globe of Mars under the place its dive flies to, so the camera is seen to fly to a real place.

1. Find the twin camera at both handovers (`StopPlan.twin`, `closePose`, `place`) and draw the close side at T as the engine does.
2. Lay that ground back onto the unit sphere from the twin as top down gnomonic plates around the place, at several sizes. Sharp where the close view looks steeply; repaint the stretched parts (image generation only through the skill `media`, at most 6 takes per asset, recipe in `assets-src/mars/RECIPE.md`) or by code. Never a third party picture.
3. Colour match each plate to the level above it at its edge, feather, nest into the patch pyramid as its deepest levels. Rework the levels above so the canyon system seen from the hold leads down to this canyon. Levels come in while small on screen: nothing pops or morphs in view.
4. Result: 2400 to 2454 every frame shows one place coming closer, the place picture's fade in (2442 to 2454) changes nothing a viewer could name. Same in reverse 2700 to 2744. G13 on every frame of dive and rise (at most 0.02 of body pixels under 1.0 texels per pixel).

What may not change: no frame outside the dive (2400 to 2489) and the rise (2670 to 2744) by a single byte. Proof by hash at draft against main for 2212, 2250, 2325, 2399, 2490, 2580, 2669, 2745, 2782, and at final for 2325 and 2580 (sha256 of the PNG equals the first element of `extra.signature` in `out/stills/f02325-mars.hold.jpg.json` and `out/stills/f02580-mars.terrain.jpg.json`). The approved look of the globe and of the close view stays.

Folders: `assets-src/mars/`, `public/assets/mars/`, `src/stops/mars/` except `plan.ts`, `place.json`, `curve.json` (handover_engineer). Engine requests go to `/root/handover_engineer` by message.

Rules: looks every 30 minutes (`npm run looks -- --push --folder mars-place --note "..."`), draft to iterate, review to prove, one render process at a time, values in config or stop JSON, no file over 95 MB, binaries once per milestone, commit trailer `Co-authored-by: Perplexity <noreply@perplexity.ai>`, no em dashes, en dashes, exclamation points or model names.

Milestones: M1 (about 60 minutes): lay back of the close side at T as first plates on the globe, the check picture (globe side with the place picture off beside the close side at T), a 12 frame top down dive sheet from the hold to the twin with no blur. M2: plates repainted, matched, nested, levels above reworked; top down sheet; dense sheets 2430 to 2454 and 2700 to 2724 at draft and across both handovers at review; G13 for every frame of dive and rise; the hash proof.

## Facts from handover_engineer (mail, 10:0x UTC)

- Dump of the place picture on `agent/engine-handover` (commit 08e7cde, not on main yet): `npm run still -- --frame 2454 --tier draft --diag "ungraded/side=orbit/dump=X,Y,image" --out FILE` writes a 1920 x 1080 window of the picture, one picture pixel per pixel, top left at X,Y; values are sRGB of filmic(scene value). `dump=X,Y,alpha` gives the cover (1 ground, 0 sky). The Mars picture is about 4492 x 2668 (scale 2 plus margins), 3 x 3 windows cover it.
- Geometry: `placeLayout` and `placeUv` in `src/core/place.ts`. Twin = `plan.twin(plan.divePose(T, 'terrain'), T)`, T = `handoverOf('mars', 'dive').time` (frame 2454, 81.80833 s; rise frame 2700, 90.00833 s). The body turns 0.9 degrees a second: carry a plate texel to the set frame of T before projecting.
- Heights in radii at draft: 2400 2.42, 2424 0.090, 2436 0.011, 2442 0.0040, 2454 0.00172. One pixel is about height / 930 radii. A 4096 px plate 0.75 degrees wide holds to a height of about 0.003. Frames 2436 to 2443 are a plain blurry red ground today.
- The place as the twin sees it: a wedge from the spot (lon -81.86, lat -4.54) about 3.4 degrees toward east south east (heading -105), plus or minus 50 degrees. The picture's valid field ends 0.06 of the width right of the frame; in rise frames 2709 and 2710 that edge shows as a straight diagonal line.
- Planet shader: patch shown as inverseFilmic(texel) * shade * uTint, then haze, then gain. Mars: limb 0, relief 0.02, reliefNear 0.008; near the ground uTint goes to descent.tint and the haze deepens. All levels share one centre. MAX_PATCHES 6, Mars uses 5. A per level switch "shown as it is" can be asked for.
- Phobos leaves the frame by 2405 in the dive; check 2700 to 2712 in the rise.
- The paths of dive and rise change today (E3): new T frames will be told.

## Log

### 2026-11-23 10:00 UTC, start
- Clone of main at 2de491a, branch `agent/mars-place` pushed, ACK sent. `npm ci`, build passes, vitest 19 files 120 tests pass.
- Read: AGENTS.md, kit/addenda, cut/HANDOVER.md, HANDOVER-NOTES.md, STOP-AGENT.md, PROGRESS sections, kit/06, mars RECIPEs, G13, R3, R4, set.ts, assets.ts, look.ts, plan.ts, planet.ts.

### 10:06 to 10:12 UTC, geometry, predictor, dump
- Tools written under `assets-src/mars/place/`: `geometry.ts` (cameras of every dive and rise frame in the body frame, the twins, the layouts; `npx tsx assets-src/mars/place/geometry.ts` writes `out/work/place/geometry.json`; rerun when the path changes), `geom.py` (body frame, gnomonic patch frame, cameras, picture coordinates), `predict.py` (G13 predictor, no render), `dump.sh` and `join.py` (the place picture at its own size from the engine dump), `layback.py` (the picture onto a gnomonic plate).
- Engine worktree for the dump only: `../repo-engine` at `agent/engine-handover` 11e977f (never committed here).
- Body frame: plan local = turn(time) * Qglobe * d. Shader: g = (d.east, d.north) / d.n about the spot, level sampled at g * scale + 0.5, scale = 1 / (2 tan(width / 2)), north at the top. Level weight = front * edge feather 0.12 * (1 - smoothstep(1.02, 1.5, parent texels per pixel)).
- Dive T 81.80833 s frame 2454: twin height 0.00172, vfov 60, about 0.07 degrees behind the spot. Rise T 90.00833 s frame 2700: twin height 0.00100, about 0.11 degrees ahead of the spot. Layout of both pictures: scale 2, left 212, right 116, bottom 119, top 135, 4496 x 2668, picture px = (frame px + left) * 2 + 0.5.
- Heights: dive 2400 2.42, 2412 0.734, 2418 0.257, 2424 0.090, 2430 0.0315, 2436 0.0110, 2442 0.0040, 2448 0.0021, 2454 0.00172. Rise 2700 0.0010, 2706 0.00145, 2712 0.0042, 2718 0.0174, 2724 0.072, 2730 0.30, 2736 1.28, 2742 3.41.
- Predictor: on the hold frames 2250, 2325, 2399 every level has weight 0 (the wrap is denser than 1.5 texels a pixel), so levels cannot change hold bytes. Today's pyramid (96, 48, 24, 12, 3 at 4096) fails G13 when every frame counts: dive 2416 (0.022), 2425 to 2433 (0.02 to 0.11), 2435 to 2453 (0.05 to 0.56); rise 2701 to 2724 (0.64 down to 0.02).
- Rule: a 4096 level of width W holds while height >= 0.228 * W(rad) at vfov 60; a 1920 wide frame needs 2x steps. Ladders tried: `96,48,24,12,6,3,1.5,0.75,0.375` leaves dive 2416 (0.0218) and rise 2701 to 2707 (0.02 to 0.11; the place weight is over 0.5 until about 2706, where the picture counts instead). Without 96: dive 2410 to 2412 and rise 2734 to 2736 fail. Without 0.375: dive 2450 to 2453 and more of rise 2701 to 2707.
- Limits that are not mine: `MAX_PATCHES = 6` (src/bodies/planet.ts); Mars full set 1386 MB of `maxSetMemoryMb` 1400 (web 414 of 450), each 4096 level 89.5 MB; `public/assets/mars/full` 146.7 MB of 150. The memory limit is checked by the budget tool, not at load.
- Requests sent 10:12: to handover_engineer: MAX_PATCHES 10, no "as is" switch, no per level centre. To /root: decide the Mars budgets (3 to 4 more levels: about 1655 to 1745 MB full, 481 to 504 MB web).
- Colour plan: plates are baked as albedo for the globe's own light (texel = what makes inverseFilmic(texel) * shade * tint + haze equal the picture), found by rendering the globe side at T with the place off and correcting by the ratio to the close side, laid back like the picture.
- The dump takes about 33 s a window, 36 windows per handover.

### 10:13 to 10:30 UTC, first lay back, the globe's light measured
- Dump stopped after the 9 image windows of the dive (the cover is not needed: the lay back only reads points of the unit sphere below the twin's horizon). The rest (dive cover, rise) can be resumed with dump.sh, it skips files that exist.
- `layback.py` works: the laid back picture rendered on the globe side at T (place off) shows the same mesa and cliff in the same place as the close side. The twin sees a wedge that opens to the east and south east; stretch under 2 only near its tip (3 deg plate: 3 percent of the plate; 0.375 deg plate: 16 percent).
- Encoding: patch textures are sRGB, the globe takes inverseFilmic(linear(texel)) as scene value. The dump is sRGB(filmic(scene)): the same encoding. The ungraded diag is sRGB(clamp(scene, 0, 1)).
- Levels now come from `src/stops/mars/levels.json` (read by assets.ts). For tests it holds 12, 6, 3, 1.5, 0.75, 0.375.
- The globe's own light at T, measured with two flat stills (`flat.sh`, `light.py`): scene G = a * s + h. Light a (b g r) about 0.087 0.124 0.142 over the near and middle ground; haze h (b g r) 0.011 0.014 0.019 at the bottom rows, 0.024 0.031 0.041 mid frame, 0.088 0.111 0.151 near the horizon. So the globe lights the place about 7 times dimmer than the picture's own values, and its haze floor is above the picture's shadows (scene 0.013) on 13 (b), 22 (g), 29 (r) percent of the ground. The plate scene value needed, (c - h) / a: median 0.14 0.085 0.078, 95th percentile 1.9 2.5 5.4, 99th 6 to 10 (the encoding ends at 4.98).
- So albedo alone cannot make the globe show the picture at T. Two ways: the engineer's per level "shown as it is" switch (no shade, no tint; haze stays), or a ground stage in my descent look. Decision below.
- First ratio pass (`calibrate.py`, kept as a tool, superseded by light.py): mean difference globe side to close side on the ground 16.95 of 255, after one ratio pass 15.13.

### 10:27 UTC, MAIL 239 from /root (budget decision)
- Memory limits stay (full 1400, web 450). Room comes from one channel masks (engineer adds a loader option; I opt in relief-L0/L1/L2-alpha.png, phobos-lit-mask.png, wrap-storm.png from src/stops/mars/ and prove by hash; about 205 MB free in full, a quarter of that in web).
- The place picture carries the end: put the place weight rule of the texels view (src/core/place.ts) into the predictor before sizing the last levels; choose pyramid and place window together (placeFrames is the engineer's: tell the number). Size levels by height and angle, not by frame number, with a margin (E3 changes the path).
- A level need not be 4096 px nor centred on the place; a centre per level can be asked for with numbers.
- MAX_PATCHES: engineer raises it to 10 (or a layered texture); until then stay inside 6.
- Disk: Mars may use 180 MB full and 75 MB web. No file over 95 MB. standin-close.jpg and standin-wrap.jpg may go from both sets only if no code and no recipe names them and the gate's set checks stay green.
- Levels 12 and 3 may be replaced by plates made from the close image, as long as frames outside 2400 to 2489 and 2670 to 2744 keep their bytes.
- Order: M1 as briefed inside 6 levels. Then one message with the M2 plan in numbers (levels: width, size, centre; memory of both sets after one channel masks; largest soft share per frame for dive and rise; engine changes). Then build. Do not wait unless a limit cannot be met.

### 10:30 to 10:36 UTC, M1 state
- Check picture at 2454 (draft), plates baked as albedo for the globe's light (`rough.py --light`): ground differs from the close side by 19.1 of 255 on average (95th percentile 81). Three causes, all measured: (1) shade and tint (above), (2) the globe's haze floor, (3) softness: the level fade in planet.ts uses the longer screen axis gradient, so on a grazing view the finer level stays out. With a full 2x ladder 12 to 0.375 at T the deepest level in use has 0.25 texels per pixel on the minor axis near the horizon rows, 0.66 at row 596, 0.97 at row 756; 81 percent of ground pixels under 1.0, 39 percent under 0.5. G13 uses the same max and passes on that soft ground.
- Simulated top down sheet (`topdown.py`, levels fade as in a 1080 px frame): the wedge shows from 3.56 degrees across as a dark smeared cut out; nothing is nested above it yet and the land around is the old land.
- Requests to handover_engineer (10:31, 10:34): MAX_PATCHES 10; a per level flag `own` (no shade, tint, relief lift, nightFlat; haze, extinction, gain stay; mixed by weight at level edges); the level fade on the minor axis of the footprint capped by the anisotropy, as a flag of the stop. Not asked: a centre per level.
- `src/stops/mars/levels.json` is committed with main's five levels (same bytes as main); the test ladder is `out/work/place/levels-test6.json`. No binaries committed at M1.
- Rule found for the minor axis fade: a 4096 level of width W gives 1 texel per pixel on the minor axis for ground 0.228 W to 0.38 W away from the camera (vfov 60). At T: 12 serves the horizon (3.36 degrees away), 0.75 the nearest rows.
