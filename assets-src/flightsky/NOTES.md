# Flight sky notebook (agent `sky_builder`, branch `agent/flightsky`)

Task: section B of `assets-src/shared/ROUND31-FIXES.md`. After a compaction read the brief again, then this file.

## Setup

- Clone in `/home/user/workspace/repo`, branch `agent/flightsky`, base 2b50ee2.
- Before renders live in a second worktree `/home/user/workspace/base` (branch `base-ref`, same commit, node_modules linked). Stills in `base/out/work/stills/`. Draft hashes of the ten check frames in `/tmp/base-draft.sha`.
- One render process at a time. Final still about 75 to 100 s, review about 35 to 50 s, draft about 17 s on this 4 core VM.

## What the before finals show

- 3352: the strip's baked stars are tall ovals on blocky mush, under crisp white code stars. Large soft grey discs are the deep set's wide cores.
- 1642: the gold band ends on a nearly straight edge near x 700 of 1400, with a jump in speckle density. Cause: the strip fades between 0.12 and 0.3 of its latitude span along a pure latitude line, and the flight grade sharpens that ramp.
- 2782: orange red speckle groups in the dark sky. First read: `sky.jpg` itself. Later found: the arriving stop's sky patch at weight 0.079 (see the tuning log).
- 2782: the bright object at the lower right (x 1247, y 978 of 1920 x 1080) with a one axis stepped spike is not a star of any set. See "Not mine" below.

## Decisions

1. New assets, made by `make.py` from `public/assets/shared/full/skyband.jpg`:
   - `skybandglow.png`: the strip without stars. Median 13 (median 31 near large stars, soft mask), Gaussian sigma 1.5 at 8192 wide, then area scaled to 4096 x 1024 (full) and 2048 x 512 (web). Stored as the square root of the linear value under the sRGB curve, so dark tones keep precision in 8 bits. PNG, so no JPEG blocks and no chroma subsampling. No mipmaps.
   - `skybandstars.bin`: the strip's stars as points, the same file in both sets. Header `BSTR`, u32 version 1, u32 count, then 10 byte records: u16 u, u16 v (0 at the bottom), u16 flux (log2 code), 3 x u8 color (luminance 1, 63.75 per unit), u8 local starless luminance (log2 code). Stars are local maxima of (strip minus starless strip) in linear light above `--thr`; flux is the box sum around the peak; position is the centroid plus a small jitter. `--extra N` adds N faint points drawn with density following the starless strip, below the detection limit, so the glow has grain that is made of points and not of pixels.
2. `src/space/travel/field.ts`: `bandField()` decodes the file and places each star on the sphere for each repeat of the strip (it inverts the strip's widen mapping). Level follows flux by a power law. Each star carries the starless luminance under it so the vertex shader can give it the grade the band has there. Stars fade toward the band edge by the same broken edge as the glow.
3. `src/space/sky.ts`:
   - The sky pass gets `uBandGlow`, `uFlightStrip`, `uFlightEdge`. With flight lift the old strip sample is mixed to the starless glow (bicubic B-spline, four `textureLod` taps, integer hash dither) and the strip's straight fade is mixed to a wide edge broken by the flight veil map.
   - The off band sky (`sky.jpg`) is mixed with flight lift to a bicubic sample of its own mip chain at 512 texels wide (`offLevel` 9), with the same dither. That removes the JPEG speckle in the dark sky without a new map.
   - One point spread for every flight set: the deep set used its own fragment shader with wide cores and a flat halo (`DEEP_FRAG`); it is removed. Flight, deep and strip stars all draw with `STAR_FRAG`.
   - `swap = smoothstep(0, travel.sky.flightStrip.swap, lift)`. At lift 0 the loop does not run and the strip points are not drawn, so hold, dive and terrain frames keep their bytes.
4. `src/core/engine.ts`: loads the two files with the sky maps, counts the glow map in `skyBytes`.
5. `config/showcase.json`: one new line `travel.sky.flightStrip`. Line 147 (`flightStars`) is not touched, to keep the merge with the travel agent clean; `deep.core` and `deep.halo` on that line are now unused.

## Tuning log

- gain 2.5, power 0.75, max 12, 280k stars: every star the same white dot, a uniform pepper field. Rejected.
- gain 1, power 1, max 30, 363k stars (`--thr 0.0008`): long tail returns, glow smooth. Glow too airbrushed at sigma 3.
- sigma 1.5, `--extra 500000`, color spread 1.6: lanes keep their edges, fine grain of faint points.
- gain 1.4, power 1.3: more range between faint and bright, but the band turned into white pepper on fog: the energy keeping level is about 0.3 x flux at this lens, so mid stars were 3 to 7 times too bright and clipped to white.
- gain 0.5, power 1.15: band too foggy and pale. Two causes: the starless strip lost the light of the removed stars, so the flight grade (which colors by level) read it as dust, and the points did not get the gold of the lit band.
- Fix: `--fill 0.5 6 0.04` puts half of the removed light back as smooth light; `stars.warm` 3 lifts the level the star's look color is read at; `stars.tint` 0.85; gain 0.8; faint points 0.02 to 0.1.
- Deep set: with the catalog point spread every mid star became the same white dot. `deep.tail` steepens its law in the vertex shader (b times (b / 8) to the power tail), 0.3 was too sparse above the band at 4492, 0.15 kept.
- Arriving sky patch: at mid travel it sits at weight 0.079 and its JPEG speckle is the "orange red speckle" of 2782. `patchHold` 3: in flight the weight is raised to the power 1 + 3 x lift, so the patch stays out until the lift falls. Weight 1 stays 1, lift 0 stays as on main.
- Halo: `stars.halo` 0.035 for the flight sets and, with the flight lift, for the catalog stars (0.012 at lift 0, as on main).
- Look 2 (delivered): the finals of look 1 (fill 0.5, gain 0.8, 500k faint points) cured the defects but read as points on fog. `--fill 0.3 6 0.04`, `--extra 400000`, `stars.gain` 1: more of the light sits in points, less in the smooth map.

## Not mine, seen while working

- 2782, the bright point with a one axis spike at (1247, 978): it is the next planet's far point, `src/bodies/farpoint.ts` line 20, third term `0.05 * exp(-p.y * p.y / 0.7 - p.x * p.x / (0.06 * uSize * uSize))`. Not a star of any sky set. Proposed line for its owner: `outColor = vec4(uColor * (exp(-r2 / 0.9) + 0.07 * exp(-r2 / (0.02 * uSize * uSize))), 0.0);` (drops the spike; changes every frame where a far point shows, holds included).
- `src/capture/export.ts` `skyBytesFor()` counts only `sky.jpg`. The band strip was already missing there; the new glow map adds 16.8 MB (full) or 4.2 MB (web).
- Probe: `npx tsx tools/_probe.ts <frames>` is not committed; it printed lift, patch weight and look weight per frame. Travel mid frames: lift 0.921, patch 0.079 (3922: lift 0.662, patch 0.338). Rise frames: lift 0.74, no patch. 5085: lift 1. 5235 and 5362: lift 0.

## Measured (look 2, the delivered state)

- Render time of a final still on the 4 core VM: 3352 before 75.8 s, after 102.0 s; 1642 before 100.5 s, after 110.8 s.
- Texture memory the new map adds: 16.8 MB in the full set (4096 x 1024, RGBA, no mipmaps), 4.2 MB in the web set (2048 x 512).
- Band points: 763 thousand records, drawn for two repeats of the strip, 44 bytes per vertex, about 67 MB of vertex data in each set. `skybandstars.bin` is 7.6 MB and sits in both asset sets.
- `npx vitest run`: 15 files, 79 tests pass. `python3 tools/shaderaudit.py`: no new line; the two existing `sky.ts` lines moved from 108 to 111 and from 134 to 153.

## Weak points

- The band's smooth light is softer than the old strip; the median that removes the stars also removes fine dust structure.
- Render time rises, most where the band fills the frame.
- The vertex data of the band points is large.
- The deep set's long tail is set in the shader by `flightStrip.deep`, not on config line 147.
- Band points use the catalog core (about 1.4 px wide at half height), so few are truly under 1 px.
- Ten check frames at draft (2325, 2427, 2580, 615, 1440, 2010, 3150, 3720, 4290, 4860): sha256 equal to main, checked again with look 2 at 07:15 UTC.

## Mail after PART (07:29 UTC, commit f8edc6e accepted into the trial merge)

- MAIL 96: the Builder takes `src/bodies/farpoint.ts` line 20 and `skyBytesFor` himself. Request: one trial of a sharper star free strip (keep lane edges and filaments, full size allowed), finals of 3352 and 1072, native crops beside the current after, by 08:05 UTC. Commit only if clearly better, asset and recipe only; report texture memory and file size.
- Trial: `make.py --detail amount blur kernel cap --size full web`. Kernel 7 (grey opening) brought disc shaped blobs back: rejected at strip level. Kernel 1 (`--detail 1 0.9 1 1.0 --size 8192 2048`): the starless luminance is pulled down to the lightly blurred source where the source is darker than the median, color stays that of the median, the fill follows the same ratio. Dark veins return. Full map 8192 x 2048 (67 MB on the GPU, PNG 10.3 MB).
- MAIL 104, batch 21, due 09:00 UTC, on `agent/flightsky` based on `builder/b20` (head a514fd37), picture byte for byte, proved with final stills of 4492 and 5235:
  1. `travel.sky.flightStars.deep.core` and `deep.halo` in `config/showcase.json` have no reader: remove the keys (or read them).
  2. The deep set uploads four floats per star (`field.ts` 209), the shader reads one (`aStar.y`, `sky.ts` 318 to 324): upload what is read.
  - Also: the ending now holds the lift at 1 through the lookback and the fade (`film.ts` 526), so 5235 and 5362 draw the strip band at sky exposure 0.36 on `builder/b20`; my lift 0 statement for those two is out of date.
- Trial result (07:56 UTC): finals of 3352 and 1072 with the kernel 1 map. Dark veins and lane edges return inside the gold clouds, clearest at 1072; at three times no star blob, no block, no chroma speckle. Render time unchanged (3352 102.3 s, 1072 116.6 s against 119.1 s). Judged clearly better at 1072, modest at 3352. Committed as an asset and recipe change: full map 8192 x 2048 (67.1 MB on the GPU, 50.3 MB more than before; PNG 10.3 MB, 8.0 MB more), web map 2048 x 512 as before (4.2 MB; PNG 1.0 MB). `skybandstars.bin` is byte equal. Draft sha256 of 2325, 615, 4860 equal to main. The previous maps are the ones of commit a5e819c.

## Batch 21 (MAIL 104 and the notice of 08:03 UTC)

- 08:03 UTC: engine batch 20 is on main (b784153), with 7ec8107 (the strip with dark veins) taken as is. Base is `origin/main` from now on (merge, never rebase). The clone was shallow and gave false merge conflicts; `git fetch --unshallow origin` cured that.
- Changes, picture byte for byte:
  1. `config/showcase.json` line 147: `flightStars.deep.core` and `deep.halo` removed (no reader since the deep set draws with the star shader).
  2. Deep set: `aStar` is one float per star (the level), was four. `field.ts` writes `deep.star[n] = b`, `sky.ts` `in float aStar`, attribute size 1. Saves 9.1 MB of vertex data.
  3. Band points: `aStar` is two floats per star (level, starless luminance), was four. Saves up to 12 MB.
  4. Uniforms cut to what is read: `uFlightStrip` vec3, `uDeepLaw` vec3, `uStripStar` vec2.
- Not mine: `assets-src/travel/veil.ts` line 8 reads `f.deep.star[i * 4 + 1]`. With one float per star the line is `const b = Array.from(f.deep.star)`.
- Proof 1 (steps 1 to 3 on the merge with builder/b20 9a3ec26): final sha256 before and after equal, 4492 b154b5e6..., 5235 8db8e994....
- Proof 2 (all four steps on the merge with origin/main 07aabf5), final sha256 on main and on the branch equal: 1072 d5216671..., 3352 91c9c5bb..., 5235 8db8e994..., 4492 b154b5e6.... Build green, vitest 79 of 79, shaderaudit prints the same lines as main.
- Render time at final on main at 08:10 UTC, machine idle: 1072 88.4 s, 3352 79.8 s, 4492 119.1 s; on the branch 84.4 s, 78.7 s, 118.7 s. The 102 s for 3352 reported at 07:29 was measured before batch 20; the figures are not comparable across code states.

## Batch 21, second part (reply of 08:23 UTC, due 09:15 UTC): vertex memory of the shared sky

- Why the band points are in the buffer twice: the band strip repeats twice around the sky (`skyframe.json` `band.repeats` 2), so every star of the file stands at two places half a turn apart. Each placement has its own edge fade (veil map cell at that place, its own jitter draw), and 1468235 of the 1529168 placements survive the edge. It is one draw call, and only the points in view are drawn (index list).
- One copy drawn twice (instancing) does not give the same bytes for sure: the second place would be computed in the vertex shader in 32 bit floats instead of in doubles on the CPU, and the fade would need a slot per repeat. Left as it is.
- Done, bytes equal:
  1. Star and color arrays of every point set (catalog, flight, deep, band) are released after their upload (`shed`, the `onUpload` hook). Positions and the index lists stay: the view culling reads the positions every time the view turns.
  2. `Sky` keeps only the veil map of the flight field (for the band's edge), no longer the whole field.
  3. Catalog stars: `aStar` three floats (the fourth was never read). The flight set keeps four: `assets-src/travel/dense.ts` and `fieldview.ts` read its layout.
  4. What read the arrays again: only a restored WebGL context (three uploads every attribute again). `Sky.render` now listens for `webglcontextrestored` on the canvas and fills the sets again from their deterministic generators before the next draw (`refill`); the band points are rebuilt from the kept file bytes.
- Counts: catalog 3465000 points, flight 500000, deep 760000, band 1468235. The same in the full and the web set.
- Vertex bytes, computed from the layouts (per point: position 12, star, color 12, index 4), in MB of a million bytes, catalog / flight / deep / band / sum:
  - GPU on main 07aabf5e: 152.5 / 22.0 / 33.4 / 64.6 / 272.5.
  - GPU after the first part (6b40894a): 152.5 / 22.0 / 24.3 / 52.9 / 251.6.
  - GPU after this part: 138.6 / 22.0 / 24.3 / 52.9 / 237.8.
  - CPU on main: the same arrays as the GPU, 272.5, after the first part 251.6; after this part, once a set is uploaded, position and index only: 55.4 / 8.0 / 12.2 / 23.5 / 99.1.
  - Kept beside these on the CPU, before and after: the view list of the catalog (13.9), the bytes of `skybandstars.bin` (7.6, the band points are built from them again), the veil map (0.5).
  - A set that is never drawn is never uploaded and keeps its arrays (the flight sets at a hold only render, the catalog never is such a set).
- Proof on this tree against origin/main 07aabf5e: finals 1072, 3352, 4492, 5235 and drafts 615, 2325, 2427, 4860 byte equal; `tools/restore.ts` at 3352 and at 2325 (draft) all lines pass, the frame after the restored context has the same sha256 as before; vitest green; shader audit the same lines.
- Considered and left for the risk to the bytes: colors as bytes, positions at half precision, one band copy drawn twice.

## Round 31 critics (MAIL 114, 117, 121; due 10:25 UTC)

Three commits on top of 36d0bd11, each cure its own commit: the band edge, the unfold flag in `sky.ts`, and one commit marked FOREIGN LINES (`src/core/types.ts`, `src/stops/mars/set.ts`, `src/stops/mars/sky.json`) for the Builder to take or drop.

### Cure 1, the band edge (5235 lookback, 1072 corner)
- Cause: the strip and its stars ended by one law of galactic latitude alone (`flightStrip.edge` 0.14 to 0.46 of the half span, plus 0.1 of veil noise), so the cut ran level; under it the band star carpet went on at full density while the glow had stopped, which read as a strip of other star density.
- Cure, the same law in the shader (`SKY_FRAG`, flight block) and in `bandField()`:
  - `ar = |lat| * (1 + reach * (1 - w))`, w the normalized veil: the edge comes in where the veil is thin.
  - `ar + rough * roughMap * smoothstep(0, 0.5 * edgeFrom, ar)`: a second static cloud map (`rough`, 512 x 256, three octaves from `flightStars.veil.rough` = 6 cells round the sky) pushes the edge in by lobes; one sided, and off in the core.
  - `fade = smoothstep(follow * (1 - lum), 1, fade)`: dark parts of the glow open first, so the edge follows the cloud shapes of the picture (`mean` stands for lum on the CPU side).
  - Band stars: a star is kept when its own draw `pick <= fade ^ thin`; `pick` comes from its own stream (`flight band thin`) at build time, so the other draws are those of main and no star blinks. Level is times `fade ^ dim`.
  - Behind the band: the soft sky under the strip (`off`, the blurred map) is brighter than the graded strip in the core, so a cut showed a grey fog lobe (up to 45 levels over main at 5235). Now `off` is shaded by `1 - shade * (fz0 - fz)` where the new law cuts inside main's footprint (fz0 is main's edge value), and the composite is the per channel minimum of the new mix and main's mix.
- Never brighter than main (base composite, per channel, by the minimum above): every new term only adds to the edge argument or contracts the fade, `dim` is 1, the star set is a subset of main's with levels at or under main's.
- No crawl: every term is a function of sky direction (static maps on the sphere), nothing reads the camera or the frame.
- Config: `flightStrip.feather = {reach 1.2, rough 0.18, follow 0.7, mean 0.45, thin 1.5, dim 1, shade 0.85}`, `flightStars.veil.rough = 6`.
- Tried and dropped: rough two sided 0.24 (parts brighter than main), one sided 0.22 without the core gate (ate the core of the band on the left of 5235), gate on raw latitude with 0.15 (edge level again: the reach term had already moved the edge inside the gate).
- The glow is sampled wherever main sampled it (fz0 above 0), so the cost is main's.
- With both cures the ten check frames at draft keep main's sha256 except 2427 (Mars dive): it moves only in the margin strips of the Mars patch (right of x 1700 and the top rows), which is cure 2 at work.

### Cure 2, the mirror seam beside Mars (2242, 2249)
- Cause: `public/assets/mars/full/sky-hold.webp` was padded by reflection: exact mirror axes at columns 352 and 3168 and rows 198 and 1782 of 3520 x 1980, the margin 0.1 of the patch per side. The patch fades in across that margin, so the reflected sky shows wherever the margin is in frame. Shared layers have no axis.
- Where: 2242 axis at x 341; 2249 and 2250 left of x 170 plus a thin strip at the bottom; 2275 left of 115 plus bottom strip; 2325 none; 2399 right of 1750 plus top strip.
- Cure: `unfolded()` in `SKY_FRAG`. Only in the margin, the texel is taken `unfold[0]` further in (a translation, so no axis) and crossfaded with the mirrored texel over the first 0.35 of the margin. `unfold[1]` moves the start of the patch fade (0 keeps main's fade). Mars hold: `[0.1, 0]`, the margin repeats the strip just inside the axis.
- Tried and dropped: displacement that grows across the margin (smear line at the ramp), 0.25 with early fade 0.65 (soft vertical step to the flight sky, faint lump), 0.25 full (a bright piece of the Milky Way from behind Mars, cut on a vertical).
- The same mirror padding is in `mars/sky-terrain.webp`, `venus/sky-terrain.webp`, `earth/sky-terrain.webp`: not checked in frame for lack of time, polish list.

### Round 31 critics, proofs and what is left (DONE sent 10:18 UTC, head ddd8ab24)
- Cure 1 is two commits (51f71589 and 57239993); cure 2 is 6d7276eb; the foreign lines are 44f0b38f.
- Finals of 5235 against main: at a 6 px blur no pixel rises by more than 1 level; 0.06 percent of pixels rise by more than 2 in a channel, the most 17. Cost 5235 47.1 s to 45.3 s, 3352 79.0 s to 78.4 s.
- Draft sha256 on the head: 615, 2325, 3150, 4860 equal to main. 2427 (Mars dive) moves by cure 2 only in the margin strips (196k pixels, right of x 1700 and the top rows).
- Cure 2 moved pixels: 2249 174k, 2250 172k, 2275 113k, 2399 178k, about 12k each over 8 levels, 2325 none. A star just inside the axis gets a fainter copy about 232 px outward (2275 x 297 y 780, the blue clump in 2249 and 2250).
- Open: the three sky-terrain patches with mirror padding (mars, venus, earth) not checked in frame; finals of 2242 not rendered; item 5 (Mercury's patch fades in by travel time u 0.4 to 0.96 over a still camera; `travel.sky.patchFrom.sun` can start it with the turn, a per stop end needs `film.ts`); items 3 and 4; saturn.travel 3932 to 3939 dark field (reach: `travel.sky` flight field floor, a cluster on that line of sight, or `patchFrom.saturn`).
