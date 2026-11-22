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

## Phase 6 list (MAIL 137, 141, 142; on main d5b851f9 with engine batches 21 and 22)

Findings of the Builder on batch 21, for the record: at the final tier 2325 did not keep its bytes, one pixel at (1918, 637) moved by one level (the margin touches the last columns under the shutter samples); 2427 moved in 196425 px, sky margin only. Both cures were taken as they were.

The list: 1 star twins under the unfold; 2 clustering and gradient of the flight field at 1072 (the hard corner is gone on main, 1072 has no band in frame after the new path); 3 saturn.travel 3932 to 3939, from the sheet of MAIL 142.

### Job 1, star twins under the unfold (`sky.ts` only)
- Cause: the batch 21 margin was a plain copy of the strip 0.1 of the patch further in, so each star of that strip stood twice in frame, and within the crossfade the mirror twins about the axis were still there.
- Law now, in `unfolded()`: the margin has two layers. The lower one is star free: `worn()` returns the third darkest by luminance of 13 taps (centre, 6 at 3 texels, 6 at 6 texels turned 30 degrees), tested offline on `mars/full/sky-hold.webp` (stars gone, no dents); it is taken from the mirror at the axis and crossfades to the strip `shift` further in over 0.05 to 0.4 of the margin, so the nebula stays continuous and the mirror symmetry of the nebula ends as before. The upper layer is stars and fine grain only, `max(texel - worn, 0)`, read at `1 - p`, the point reflection through the patch centre: with the mirror padding that is the strip just inside the opposite axis, turned over, which lies at or beyond the other frame edge, so a margin star has no twin near it. The whole margin fades in from 0.5 to 2.5 texels past the axis, so the mirror twins beside the axis go too and a star that straddles the axis stays whole.
- Tried and dropped: the upper layer by plain translation (`p + 0.8 * side`): no twins, but at 2275 the margin under the band was busier than the sky beside it, because the far strip has the band lower; the reflection puts band on band. A dead zone of 0.05 of the margin and a fade of 2 to 6 texels: twins 2 to 5 px from the axis stayed.
- Proofs, finals against main d5b851f9 (`/tmp/fs/p6/<f>-main.png` and `-j1.png`): 2249 moves in 175809 px, 2275 in 123179, 2399 in 193717, 2427 in 198642, all inside the margin (left of the axis at 2249 and 2275 plus the bottom strip, right of it and the top rows at 2399 and 2427), frame means within 0.03 of 255. Seen at native size: no pair about the axis, no line, no starless strip, the nebula continuous; a compact cluster glow of the copied strip stays as a soft patch without its stars. 2325 final: one pixel differs from main, (1918, 637), red 18 to 19. Ten stop drafts (2325, 2427, 2580, 615, 1440, 2010, 3150, 3720, 4290, 4860): nine sha256 equal to main, 2427 differs in the margin only.
- Final tier cost, main to job 1: 2249 126.9 to 132.5 s, 2427 84.1 to 92.1 s, 2275 36.2 to 37.5 s, 2399 36.9 to 37.9 s, 2325 35.4 to 35.7 s (43 taps per margin pixel against 4).
- Shader audit: same lines as main, the one `sky.ts` line moves from 168 to 189. Build green, vitest green.

### Job 2, clustering and gradient of the plain flight field (`field.ts`, one line of `sky.ts`, `travel.sky.flightStars.deep`)
- Diagnosis: on main 1072 has no band in frame, so the hard corner is gone with the new path. The look of the plain flight frames is carried by the deep set (760000 stars, stream `flight deep`), found by switching the sets off one at a time; the 500000 flight stars stay under 20 of 255 there and are left untouched, so their stream is unchanged. On main the final of 1072 had 1281 pixels at clip level and an even count per cell: the brightness law was flat at the bright end and the density law was 0.35 even plus the veil.
- Law now: the density of the deep set is `(even + (1 - even) * veil) * (1 + plane[0] * exp(-|galactic latitude| / plane[1] deg)) / (1 + plane[0]) * (1 - clump[0] + clump[0] * coarse(clump[1]))`, with the galactic pole from `galactic()` handed to `flightField(def, gal)`. Values: even 0.15, plane [2.5, 28], clump [0.45, 8]. The brightness law is steeper at the bright end (`law` share at 1: 0.0187 to 0.0107, at 0.3: 0.055 to 0.048). Groups: 480 instead of 160, radius drawn on a log scale from 0.2 to 3.2 degrees with `skew` 1.4 towards the small end, members 16 to 300 growing with the radius.
- Measured on finals, main d5b851f9 to job 2 (cells of 240 by 270, pixels above 45, standard deviation over mean): 1072 0.205 to 0.345, 3352 0.313 to 0.373; pixels at 250 or more: 1072 1281 to 960, 3352 1102 to 771, 2212 1359 to 1045, 4492 3683 to 3538, 5235 3653 to 3558. Frame means move by under 0.5 of 255.
- Proofs: finals of 1072, 2212, 4492, 5235 and 3352 at `/tmp/fs/p6/<f>-j2.png` against `<f>-main.png`; the band frames keep band, lanes and band stars, the field beside the band now thins away from it. Ten stop drafts (2325, 2427, 2580, 615, 1440, 2010, 3150, 3720, 4290, 4860) have the sha256 of the job 1 state. Final tier cost: 3352 70.8 s on main, 77.9 s here; the star count is the same. Vitest 16 files 83 tests, shader audit same lines as job 1.
- Not cured here: the soft look of the band nebulosity at 5235. The star free strip is a 13 texel median of an 8192 wide source and stands at about two screen pixels per texel there; detail finer than that is carried by the band stars only.
- The circular ripple shapes named for 5235, lower left: with the levels lifted the sky there shows the veil only, no rings. The rings in that corner are on Neptune's night side (its latitude bands seen from below the pole, levels 1 to 5 of 255). Not a sky fault, not my file.

### Job 3, saturn.travel 3932 to 3939: dropped
- Own review renders of 3925, 3929, 3932, 3935, 3939, 3945 on main d5b851f9: Uranus is a point at 3929 and a disc with moons from 3932, on a dense star field; frame means 19.3, 13.3, 10.4, 8.5, 9.3, 24.3. The empty dark field is gone. The frames are dark because that part of Uranus's own patch is dark (patch weight 0.59 at 3932, 0.76 at 3939); the band enters at 3945.

### Job 1, one more line
- The final of 2325 with job 1 differs from the tree before batch 21 (8738076e) in 0 pixels.

## Round 33 list (MAIL 146, 12:08 UTC)

Round 32 closed under the bar. Words on the flight sky: A 2212 dust cloud a soft airbrushed mass with the same tight stars on it; B 4492 the band ends in a scalloped hard lower boundary, density does not ramp down; C 3922 separate cotton wool puffs of one size; D 3922 lanes hold the same star density as the clouds; E 5235 sharp stars over a soft low resolution map with baked blobs (one of 30 px in tiles C and F); F 1072 and the five other sky only frames read as dead spacers. Minors: blob stars at 3352, flat topped cores at 4492, a smooth dark smear and magenta knots at 3922, a 15 px blob at 495, stars through the corona at 495, blotches after the stress encode at 5242.
Jobs from the Builder, one commit each, flight frames only: 1 D and A, stars thinned and dimmed by the dust (count and level), flight stars and deep set; 2 C and E, fine structure on the band's light in the shader, baked blobs out, magenta knots softened; 3 B, broad unresolved glow and density fall off beside the band; 4 one law for a bright star's core and glare. READY for round 33 by 13:05 UTC, then on for round 34.

### Round 33 job 1, stars cut by the dust (`sky.ts`, `field.ts`, `travel.sky.flightStrip.dust`)
- Found by trial: the stars that fill the lanes at 3922 are mostly the strip stars (the photo's own stars, `bandField`), not the deep set. A cut on the deep set and the flight stars alone barely shows.
- Law, three sets:
  - Deep set and flight stars, in the vertex shader (`SKY_DUST_GLSL`, function `dust(d, bright)`): one `textureLod` of the star free strip at the star's band coordinate gives `g` (stored value, luminance). `lane = 1 - smoothstep(lane[0], lane[1], g)`, `cloud = smoothstep(cloud[0], cloud[1], g)`. Weight `w` = inside the band core (`span`, in units of the strip's half height) times the strip swap times `1 - smoothstep(keep[0], keep[1], brightness)`, so bright foreground stars stay. A star is dropped when its own hash (integer hash of `gl_VertexID`) is below `w * (lane * lane[2] + cloud * cloud[2])`, the others are dimmed by `1 - w * (lane * lane[3] + cloud * cloud[3])` and tinted towards `red` inside the dense cloud. Off the band and at swap 0 every factor is exactly 1.
  - The flight stars get their own vertex shader text (`STAR_VERT` with the dust call patched in), so the program of the stop catalog is unchanged.
  - Strip stars, at build time in `bandField`: `lane = (1 - smoothstep(strip[0], strip[1], bg)) * (1 - smoothstep(strip[4], strip[5], level)) * core`; the existing thin draw keeps a star with probability times `1 - strip[2] * lane`, its level is times `1 - strip[3] * lane`. The stream `flight band thin` is drawn as before, so stars outside lanes keep their place.
- Values: span [0.08, 0.2], lane [0.09, 0.15, 0.9, 0.5], cloud [0.17, 0.27, 0.35, 0.3], keep [0.8, 2.5], red [1, 0.86, 0.72], strip [0.014, 0.03, 0.8, 0.5, 0.5, 2]. The strip's stored luminance in the band core runs 0.08 (lanes) to 0.27 (clouds), median 0.13.
- First values had span [0.12, 0.34]: the strip is dark just outside the bright clouds, so the cut emptied a rim under the band (4492, pixels above 60 per row in rows 420 to 520: main 25, old job 2 30, first trial 21). With span [0.08, 0.2] the rim is back at 30 (5235 rows 420 to 540: 27, 32, 32).
- Proofs at the final tier against main d5b851f9 (`/tmp/fs/p6/<f>-main.png`, head `<f>-e.png`): 3922 moves in 889706 px, mean 24.43 to 24.43; 2212 774902 px, 13.95 to 13.82; 4492 1019448 px, 34.25 to 34.13; 5235 929246 px, 28.35 to 28.01. 1072 and 3352 have no band in frame and keep the bytes of the old job 2 state (every dust factor is exactly 1 there).
- Stop frames: drafts of 2325, 2427, 2580, 615, 1440, 2010, 3150, 3720, 4290, 4860 have the sha256 of the old job 1 state; finals of 2325 and 2427 are byte equal to the old job 1 finals. The other stop frames are not rendered at the final tier here.
- Drafts of 495, 1642, 2782, 5085, 5362 looked at, not compared with main.
- Cost at the final tier, old job 2 to here: 3922 110.6 to 111.9 s, 4492 112.7 to 114.8 s, 5235 47.3 to 46.9 s, 2212 101.4 to 101.2 s.
- Left open after this job: the gas of the cloud itself (A, C, E: job 2 of this list), the band's lower edge (B: job 3), bright star cores (job 4).
- Answer owed to the Builder on stars through the corona at 495: the sky can take a mask if the owner of the Sun and Mercury plates hands it a direction, two angular radii and a strength per frame (the star vertex shaders already dim by the patch lens the same way); a mask with the streamers' own shape needs a texture rendered by that owner.

### CUT33 (sent 12:43 UTC)
- `READY fcfd0dba154332fb3a9eb355df2fc53ad53efb6d`, taken into round 33 (MAIL 155). It holds the old jobs 1 and 2 and round 33 job 1.

### Finding, the blobs at 5235 and 495
- The "30 px white blob" at 5235 is not baked in the strip and is not a far point: it is the Sun of the lookback at (1278, 378), radius 4.3 px, glare 4, drawn by the Sun block at the end of `SKY_FRAG`. A first note to the Builder blamed `farpoint.ts`; a correction went out the same minute.
- The "15 px blob" at 495 is Mercury's far point (`src/bodies/farpoint.ts`, 30 px sprite, Gaussian halo of sigma 3 px) at (823, 724). Not my file: lines go as FOREIGN LINES.
- MAIL 155 grant: the Sun block at the end of `SKY_FRAG` is mine for the small Sun only. Above 6 px of radius and in every hold, dive, terrain and rise frame of every stop it gives today's bytes.

### Round 33 job 2, detail layer on the band's light (commit 8f84206d)
- `noiseCube(32)` in `sky.ts`: a 32 cube RGBA noise texture (integer hash by `Math.imul`, 128 KB on the GPU, nothing on disk), sampler `uFlightNoise`. `skyNoise(vec3)` reads it with a quintic warped coordinate at level 0.
- `skyDetail(g, fp)`: one warp sample, five octaves with a rotation between octaves, each octave faded by the pixel footprint `fp`, returns a mottle value and a ridged value. Stretched along the galactic plane by `stretch`.
- In the band branch, only where `uFlightStrip.x > 0` and `uFlightDetail.x > 0`: a ring of six strip samples at `fill[1]` gives `wide`; `glow = (glow * exp(mottle * min(mot, 0.1)) * (1 - depth * smoothstep(lo, hi, ridge)) + fill * exp(fill[2] * mot)) * grain`; the feather takes `max(sq, wide * fill[3])`, which joins the puffs.
- First version used a float hash in the shader: marble look at thumbnail size with strong lanes, and 45 to 60 percent more time on the final of 3922. The cube texture version costs 132 s against 111 s there.
- The strip is not rebuilt at a higher resolution: it has about 1.26 texels per pixel at vfov 30; its softness is content (a median of the photo), not sampling.

### Round 33 job 3, the edge of the band (commit 64fd4698)
- A second ring of six strip samples at `far[1]` degrees, turned 30 degrees: `rim = clamp(1 - 0.5 lum(wide + far) / lum(sq))` lowers the lane threshold by `rim[0] * rim` and deepens the lanes toward 1 by `rim[1] * rim`, so the cloud edge is eaten by the same multi scale noise; `fill += inverseFilmic(far^2) * far[0]`.
- A warm additive glow along the galactic plane in the haze block: `col += tint * swap * lift * (1 - under * bz) * exp(-(lat / width)^2) * (1 + vary * (noise - 0.5))`, two low frequency samples of the cube. The band mix is a `min` of two mixes and the feather cuts the strip light outside the clouds, so a fill inside the band branch cannot make a broad glow; this term can.
- Values: lane [0.62, 1.05, 0.5, 0.6], rim [0.5, 0.8], far [0.12, 4], spread tint [0.03, 0.026, 0.022], width 8 degrees, freq 6, vary 1.4, under 0.7.
- 4492 draft, median row level (r, g, b) before and after: y 300 (55, 53, 49) to (66, 64, 60); y 350 (29, 34, 38) to (47, 50, 51); y 400 (19, 26, 32) to (35, 39, 42); y 500 (15, 23, 29) to (23, 29, 34); y 600 (13, 21, 29) to (16, 23, 30); y 800 unchanged. The drop of 36 levels in 100 px is now a fall of about 50 levels over 300 px.
- Tried and dropped: keying the glow off the ring samples instead of `bz` (a dark rim under the clouds).

### Round 33 job 4, bright stars and the far Sun (commit d7ced701)
- Star law in `STAR_FRAG`, weight `uStarLaw.w = swap` (0 in every stop frame): core times `pow(max(peak / knee, 1), -power)`, wing `gain * edge^2 / (1 + r2)` in place of the Gaussian skirt. Values `flightStrip.stars.law` [2, 0.6, 0.06]. Shared by catalog, flight, deep and strip star materials.
- Far Sun: `flightStrip.sun` {radiusPx 6, glare [0.7, 1.6], core [2.5, 2.25], wing [0.52, 4], stars [5, 26]}. Weight = (Sun radius under 6 px) times smoothstep(0.7, 1.6, shot glare). Scan of all segments: every stop frame with a small Sun has glare 0.60 to 0.65 (uranus dive, terrain, rise, travel; neptune hold, dive, terrain, rise); ending.retreat ramps 0.6 to 4, lookback and fade 4. So the weight is exactly 0 outside the ending, and today's `col +=` line is kept verbatim with the new term added in a gated loop.
- Stars fade to zero inside 5 px of the Sun and are full at 26 px (`sunFade` in the star vertex shaders, the catalog one behind `if (uSunHalf.z > 0.0)`).
