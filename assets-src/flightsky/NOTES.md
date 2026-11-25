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

### After the first proofs of jobs 2 to 4 (14:05 to 14:40 UTC)
- Main moved the cameras of several travel frames in round 33 (84b0ea4a), so every before picture is rendered again on main: `/tmp/fs/p6/<f>-m33.png`, stop drafts in `/tmp/m33-draft.sha` (2325 2427 2580 615 1440 2010 3150 3720 4290 4860 4605), stop finals `2325-m33.png`, `2427-m33.png`. The old `-main`, `-e`, `-j1` files are from the camera before.
- First proof of d7ced701 plus merge (tag h): eleven stop drafts and two stop finals equal main. 615 and 4605 (Sun in frame) keep their bytes at draft; the gate is the pair (Sun radius under 6 px, shot glare above 0.7).
- Glow beside the band (84ad5ea2): the first values (tint [0.03, 0.026, 0.022], width 8, under 0.7) lifted the median of 4492 from (17, 24, 30) to (30, 33, 36) and read as grey fog. Now tint [0.024, 0.0185, 0.013], width 7 degrees, under 0.85. The far ring reads three taps.
- Magenta knots (aa1e700e): they are strip stars with r and b above g (the photo's HII knots taken as stars). `stars.pink` [0.8, 0.5]: green lifted by 0.8 of the gap, level cut by up to half. The random streams are not touched.
- Knee (c6782b81): the strip's stored luminance in the core runs median 0.39, 99 percent 0.56, top 0.716; `detail.knee` [0.52, 0.3] compresses what lies above 0.52, so baked cluster blobs sink to cloud level. Lanes a little softer: lane [0.62, 1.1, 0.5, 0.6], rim [0.5, 0.65].
- Faint star colour (c6782b81): the deep set has a tenth of pure rose, amber and azure stars at any level; `flightStrip.deep.calm` [0.4, 0.05, 0.8] takes saturation to 0.4 below level 0.05. Mean saturation of pixels at 40 to 140 on 3352: 0.205 to 0.149. The same on the 500000 flight stars moved 8933 pixels by at most 3 levels (they are paled at build time already) and was taken out again.
- Star groups (6eb06cef): the "stamped" clumps at 3352 are the groups of the deep set. Now 340 groups, radius 0.25 to 5 degrees uniform in log (skew 1), 12 to 340 stars, member factor 0.3 to 1.7 (was 480 groups, 0.2 to 3.2, skew 1.4, factor 0.6 to 1.4). The stream `flight deep` is consumed differently, so every deep star moves.
- Blue glow patches (6eb06cef): the round bluish patch at 3922 and the smooth haze at 3352 are the lobes of the flight glow map (512 by 256, Gaussian lobes). The map is now times `1 - m + 2 m coarse(f1) (0.4 + 0.6 coarse(f2))`, `clouds.mottle` [0.75, 9, 20], at build time, no render cost.
- Cost at the final tier, main 84b0ea4a to tag h: 3922 123 to 163 s, 5235 60 to 68, 4492 132 to 171, 2212 114 to 137, 1072 112 to 127, 3352 91 to 102. Tests on 3352: star law off 104 s, detail off 103 s, so the cost on a frame without band is not those; drafts cost the same on both trees (30.5 s). The cost sits in texture taps of the sky pass (noise cube, strip rings).

### Proofs for CUT34 (tag k, tree 734e7a91, 14:40 to 15:20 UTC)
- Finals against main 84b0ea4a (`/tmp/fs/p6/<f>-m33.png` and `<f>-k.png`), pixels that differ, mean level main to head, median (r, g, b) main to head, pixels at 250 or more main to head:
  - 3922: 1677455, 24.43 to 27.65, (11, 18, 24) to (14, 20, 25), 2256 to 1788, 123 s to 160 s.
  - 4492: 1874524, 37.46 to 42.54, (17, 24, 30) to (24, 28, 32), 4167 to 3106, 132 s to 168 s.
  - 5235: 1507081, 28.01 to 32.01, (13, 19, 25) to (17, 23, 27), 3460 to 2499, 60 s to 67 s.
  - 2212: 1394290, 13.82 to 14.93, (6, 12, 16) to (7, 12, 16), 1038 to 869, 114 s to 137 s.
  - 1072: 526236, 12.75 to 12.72, median equal, 1189 to 932, 112 s to 125 s.
  - 3352: 1437148, 11.95 to 11.37, (6, 11, 14) to (6, 10, 14), 771 to 605, 91 s to 100 s.
- Stop finals 2325 and 2427 equal main byte for byte. Eleven stop drafts equal main (2325 2427 2580 615 1440 2010 3150 3720 4290 4860 4605). Saturn hold 3465 and dive 3567 drafts equal main; the rise 3866 moves (lift 0.74, flight terms).
- Drafts of 495, 1642, 2782, 5085, 5362 looked at: no fault seen.

### Saturn stop sky, MAIL 170 (15:00 to 15:10 UTC), tried and taken out
- The sky at the dive 3567 is Saturn's own plates (`sky-hold.webp`, `sky-terrain.webp`, both 3520 by 1980, owner the Saturn stop). The orange blobs are painted in the plate, 6 to 10 px across.
- Trial: a per plate `wear` value (texels per pixel thresholds) that swaps the plate for its star free 13 tap estimate where the plate is magnified. With thresholds [0.8, 1.15] nothing fires at 3567: the plate has more than 1.15 texels per pixel there, so it is not stretched by sampling, the softness is its content. Forced fully on, 558899 pixels move, the blobs stay and the plate only gets softer. Reverted, nothing committed.
- So hold and dive are not answered by a commit of mine. The rise 3866 gets the flight detail layer through the lift. A cure needs a new plate or the plate star pass of the Saturn stop.

### Neptune arrival swing 0 (commit 88e925cf on agent/neptune), MAIL 173
- Rendered on top of this branch, final tier: 4436 mean 38.63, median (19, 29, 32), 2024 pixels at 250 or more; the band crosses behind the upper half of Uranus from lower left to upper right, detail layer and lanes hold, no edge, no Sun. 4492 mean 30.61, median (16, 22, 28); the band sits only in the lower right, the rest is star field with the mottled blue glow as a faint haze in the upper centre. The lanes the Neptune builder saw at 4 times the level in the upper left are there on this branch too, about 1 level, not seen at normal exposure.
- With swing 0 the proofs of the band edge and of the baked blobs for 4492 lose their frame (the core is out of it); they still stand at 3922 and 5235.

### The wide Sun at Uranus and Neptune (R5 severe, frames 4290 and 4605), tested, not offered
- Trial, not committed: `flightStrip.sun.glare` [0.3, 0.55] turns the tight Sun law on in the stops with a Sun under 6 px. Eleven stop drafts: only 4290, 4860 and 4605 move, Mars 2580 and the rest keep their bytes.
- 4290: 84427 pixels move by at most 3 levels. The wide orb there is not drawn by the Sun block of the sky pass. 4605: the flare keeps its width and its centre turns into a dark dot. 4860: 1922 pixels by 1 level.
- So the orb the critic names is the flare of those stops, not the sky's Sun. The gate stays at [0.7, 1.6].

### CUT34 (sent about 15:30 UTC on the VM clock)
- READY on the merge of this notebook commit with origin/main. Separable commits: 8f84206d, 64fd4698, d7ced701, 84ad5ea2, aa1e700e, c6782b81, 6eb06cef.
- Not in it: the far point lines for `src/bodies/farpoint.ts` (FOREIGN LINES in a message), anything for the Saturn plates, anything for the stop flares.

### After CUT34 (15:25 UTC on the VM clock)
- CUT34 sent: READY 38786b4da7313fac35053e8574fc196c9806b4d7, ten pictures from `scratch/r7/cut/`. A second message carried the far point lines as FOREIGN LINES (proved at 495 draft only; every stop builds a far point with the halo on, so stop frames would move; advice was not to take it blind) and the two trial pictures (Saturn plate, Sun gate).
- For CUT35 only small proven things and take-outs. Candidates: none started. If a critic of round 34 names the lanes as marble, the levers are `detail.lane` (depth, third value) and `detail.rim`.

## Round 34 critics and CUT35 (MAIL 198, 17:32 UTC; CUT35 due 18:30 UTC)

Round 34 build: main 89ced51b, engine 096721f26986d35a. Round 35 takes only take outs and small proven things. Helpers in `out/work/` (ignored): `shots2.ts` (per frame patch, lift, swap, sky exposure), `turn.ts` (camera turn against the sky per frame), `high.ts` (height, cover, exposure, lift).

### The band pops are camera turns, not fades (measured, no code change)
- venus.travel 1652 to 1666 (R4 severe): the sky is world locked through the travel (one constant sky turn, `src/director/film.ts` line 719). The travel camera turns 145 degrees against the sky in the segment, 3.97 degrees per frame constant from 1639 to 1659 (about 140 px per frame), 2.29 at 1666. Earth `arrive.swingDeg` 20 to 0 tested by numbers: 141 degrees, 3.87 per frame, no cure, reverted. On top the arriving Earth plate fades in under `flightStrip.patchHold` 3: held weight 0.033 at 1651, 0.10 at 1654, 0.40 at 1660, 0.755 at 1666.
- ending.retreat 5112 to 5122 (R4 severe): lift 1 and patch 1 all through, sky exposure 0.375 to 0.365: no fade at all. The band comes down from the top edge by the camera's turn around Neptune: 1.36 degrees per frame at 5105, 1.06 at 5115, 0.88 at 5120, 52 degrees over the segment (`LOOKBACK.glide` in `src/director/film.ts` line 28, not mine).
- saturn.travel 3925 to 3946 (R4 major): camera turn 78 degrees, 2.7 per frame from 3927 to 3942; plate weight 0.065 at 3924, 0.355 at 3933, 0.85 at 3945; flight swap 1 at 3930 to 0.13 at 3945.
- uranus.rise 4414 to 4427 (R4 uranus major): the rise camera turns 65 degrees between 4414 and 4432, 5.9 degrees per frame at 4422 to 4424, while the height goes 0.055 to 1.5 radii and the Uranus `light.skyLow` [0.04, 0.6, 0.3] takes the sky exposure 0.19 to 0.52 from 4414 to 4422. Trial `skyLiftFrom: 0` in `src/stops/uranus/plan.ts` (flight lift 0.236 at 4420 where it was 0.017): drafts 4414, 4417, 4420, 4423, 4427 show the point stars earlier and the band still entering from the right edge at 4423 by the turn. No cure, changes 4436, reverted, not offered. Picture `scratch/r7/ur-pair-grid.jpg`.
- `patchHold` 3 to 1 would stretch the plate fade from 16 to 20 frames (hold 0: 25) and bring back the plate speckle at mid flight (weight 0.074 at 1642, 0.332 at 3922 with hold 0). Not offered: the fade is not what the critic sees, the turn is.

### R3 part 2 fell 8 to 6 (frames 1642, 2212)
- The grey smudge at the right edge of 2212 is on main before CUT34 too.
- At 5 times the level the dark sky of 2212 shows diagonal streaks in the blue glow where main before CUT34 was smooth: `flightStars.clouds.mottle` [0.75, 9, 20] of commit 6eb06cef. An FFT of a dark 512 crop shows no periodic peak that main lacks.
- Take out tried, rendered, not offered: `clouds.mottle` first value 0. The glow map is then the sum alone, as before 6eb06cef. 2212 final: the streaks at 5 times the level go, the frame mean goes 14.93 to 15.92, at true level the dark sky looks the same; Jupiter hold 2895 draft keeps its bytes. It brings back the round bluish glow patch at 3922 and the smooth haze at 3352 that round 33 named and round 34 did not. The critic's cure names pixel scale noise, and the mottle is 9 and 20 cycles over the sky, so it is not the thing named. Picture `scratch/r7/2212-m0-x5.jpg`. If the Builder wants it: one number, `travel.sky.flightStars.clouds.mottle` [0.75, 9, 20] to [0, 9, 20].
- The clump at 2212 ("pasted photo patch", "busy, overdense star field inside it") is the flight strip with the detail layer of 8f84206d and the stars of the strip; the stars inside the clump were there in round 33 too. The fall cannot be pinned on one term from one frame. The seven CUT34 commits are separable, and taking out 8f84206d brings back the soft blocky band four critics named severe in round 33.

### CUT35 decision (18:05 UTC)
- Nothing new is offered: no take out and no plan number of mine cures a word, and the two tried (Uranus `skyLiftFrom`, `clouds.mottle`) do not. READY names the notebook commit only; every judged frame keeps its bytes against main.
- Numbers that would slow the band's entry are not mine: the travel camera turn of venus.travel and saturn.travel and `LOOKBACK.glide` in `src/director/film.ts`, the Uranus `rise` numbers in `src/stops/uranus/plan.ts`.
- CUT35 sent at 18:04 UTC: READY 49028c56de6410a5ef1b0b1f5e699af50a6eb14d (notebook only), four pictures (`scratch/r7/seq-venus-r34.jpg`, `seq-ending-r34.jpg`, `ur-pair-cut35.jpg`, `2212-m0-x5.jpg`). Working tree clean, no trial left in `src` or `config`.

### Trace of MAIL 426 and ruling of MAIL 448 (Nov 24, 00:51 to 01:45 UTC): post grain baked into sky patches
- Asked: at 60 frames a second the frame to frame change dips for two steps at the judged hold frame of Mercury, Mars, Saturn, Neptune, all of it in the dark sky.
- Cause: a sky patch built as approved image minus a film render carries the negative of that render's post grain. The grain is a hash of pixel and frame number only (`src/post/chain.ts` lines 126 to 131, `uFrame = frame % 4096`), so at the judged frame the live grain half cancels against the patch, and the pattern stands fixed in the sky through hold and dive. Not the camera, not dust, not the flight sky, not a `holdMid` term. Nothing of section B is involved.
- Proof numbers, Mars hold, draft, capture rate 2: grain against the scene without grain (`--diag nograin`) in the dark sky -0.228 at k4650, +0.010, -0.069, +0.007, +0.006 at k4648, k4649, k4651, k4652; fine noise (5 px high pass) 2.119, 1.991, 1.729, 1.950, 1.984, 2.126; dark sky step change 1.660, 1.523, 1.434, 1.630, 1.658 against 0.940, 0.912, 0.908, 0.910, 0.941 without grain. At the film rate the two steps that touch 2325 change 9 percent less (1.717, 1.689 against 1.860, 1.886).
- The dip in the change measure needs a sky that moves per capture step; Earth's sky hardly moves, so its change stays flat though its judged frame is 9 percent quieter.
- Tool: `assets-src/flightsky/graincorr.py FRAME NOGRAIN.png [FRAME NOGRAIN.png ...]` emulates the post grain in float32 and prints its correlation with the fine pattern of a nograin still (dark sky, whole frame, 48 blocks). A clean patch gives 0.00 with every block within 0.02. My first Neptune number was wrong (0.000) because the emulation lacked `% 4096`.
- Table of the eighteen patches, judged frame then half a frame beside it (main 7152f39, holds of Mercury, Mars, Neptune and the judged Venus, Earth, Saturn, Uranus frames rendered at 6dcd2c62, no patch file differs between the two):
  - sun hold 360: -0.001, +0.001 clean. sun terrain 90: 0.000, -0.002 clean.
  - mercury hold 615: -0.124, +0.002 HAS IT. mercury terrain 870: -0.001, +0.002 clean.
  - venus hold 1185: -0.002, -0.001 clean. venus terrain 1440: +0.001, 0.000 clean.
  - earth hold 1755: -0.253, 0.000 HAS IT. earth terrain 2010: -0.633 (block -0.545), -0.004 HAS IT.
  - mars hold 2325: -0.206, 0.000 HAS IT. mars terrain 2580: -0.048 (block -0.218), +0.004 HAS IT.
  - jupiter hold 2895: -0.267, 0.000 HAS IT. jupiter terrain 3150: -0.001, 0.000 clean.
  - saturn hold 3465: -0.111, 0.000 HAS IT. saturn terrain 3720: +0.002, -0.002 clean.
  - uranus hold 4035: +0.008, 0.000 clean. uranus terrain 4290: -0.152 (block -0.100), -0.001 HAS IT.
  - neptune hold 4605: -0.096 (-0.125 with the applied grain), -0.001 HAS IT. neptune terrain 4860: 0.000, 0.000 clean.
- Ruling of MAIL 448: cured at the cause by each owner (glow input rendered with `--diag nograin`, recipe says so), in the owner's next commit that changes its hold, dive or terrain bytes anyway. Relayed with the tool to mercury_builder, earth_builder, mars_place_builder, jupiter_coder, saturn_coder, uranus_builder, neptune_builder; sun_builder and venus_builder told they are clean.
- Helpers, untracked: `out/work/cap.ts` (one capture session, `--list k,k --diag nograin --rate 2`, writes `/tmp/cap/k<5 digits>-<diag>.png`).
- Repo trap: `git fetch --depth 1 origin main` makes the clone shallow again and the merge then refuses ("unrelated histories"); `git fetch --unshallow origin main agent/flightsky` cures it.

### MAIL 467 (Nov 24, 02:28 to 04:20 UTC): the dip of the sky in the lift, the look of the sky a stop names
- Asked: on Saturn's rise the engine's sky dips at 3874 and 3875 (lift 0.27 to 0.44) and comes back; the lift must be one monotone function with a test; Saturn's sky at 3720 shows orange clusters at the left and near black at the right where the approved image has an even field of faint blue white stars, to be cured through options the stop names; one owner for the lift by height.
- Reproduced: a walk of the lift at the camera of 3872 (film picture, step 0.02) falls between lift 0.26 and 0.46; the sky pass alone carries it (mean 22.126 to 20.833, median 18.66 to 16.95); the catalog stars, flight stars, deep stars and strip points do not.
- Cause, the term that falls: the swap. `swap = smoothstep(lift, 0, flightStrip.swap = 0.5)` ran on its own clock, complete at lift 0.5 with a slope up to 3 per unit of lift. The swap takes the photo band with its baked stars to the starless glow, the off band map to its blurred level and narrows the band. The swapped picture is dimmer in every class at every lift (camera 3872, lift 1: mean 38.06 at swap 0, 40.38 at 0.5, 34.75 at 1; median 28.16, 30.65, 25.37) and the loss sits in swap 0.5 to 1, which the old clock crossed between lift 0.25 and 0.5, faster than the linear lift terms (band gain, haze, veil, flight and deep stars) bring light in.
- Cure, at the swap: `flightSwap(lift, power) = 1 - (1 - lift)^power` in `src/space/sky.ts`, `travel.sky.flightStrip.swap` is now that power (2; it was the span 0.5). Exactly 0 at lift 0 and 1 at lift 1. The band's point stars come in by `flightSwap(swap, flightStrip.stars.lead)` with lead 4, ahead of the baked stars that leave (with lead 1 the top class, percentile 99.9, sagged from 0.663 to 0.636 at lift 0.02 to 0.20; lead 2 still 1.3 percent; lead 3 still falls at 0.02 and 0.08; lead 4 rises from the first step).
- Paths tried at 3872: the swap linear in the lift fails (median falls from lift 0.88, share over 40 from 0.82); power 2 and power 3 pass; 2 kept, the slower one.
- Test `tests/skylift-gl.test.ts`: the real `Sky` with the full maps in a WebGL2 browser at 1920 by 1080, float target, lift 0 to 1 in 50 steps over two views (the band at Saturn's rise, camera of 3872, exposure 0.53; a dark field off the band, camera of 5010, exposure 0.45). Asserted strictly, never falling: mean of the toned luma, percentiles 10, 50, 90, 99, 99.9. Asserted with a stated slack: the counts of pixels over the first picture's percentile 90, 99, 99.9 never stand more than 0.5 percent under their highest value so far (at exposure 0.53 the count over the first percentile 99.9 wobbles by 6 to 8 pixels of 2400 between lift 0.34 and 0.48 while the percentile itself rises; the baked stars that leave are wider than the points that replace them). `SKYLIFT_PRINT=1` prints the rows, `SKYLIFT_STEPS` sets the steps. vitest's reporter crashes on a failure here (`Map.groupBy`, Node 20), so the test logs its falls itself.
- Film walk at 3872 with the merged code, step 0.02, grain on: mean 23.41 to 38.98 rising at every step, all classes rising but percentile 99.9 228.24 to 228.10 at lift 0.36 to 0.38 (0.14 of 255).
- Frames whose bytes change: every frame with 0 < `shot.skyStars` < 1 at the frame's time. On main 6e17859d (with the lift by height of d192) 739 of 5400: 452 to 512 (sun.travel, lift up to 0.004), 961 to 1023 (mercury.rise), 1066 to 1106 (mercury.travel), 1545 to 1596 (venus.rise), 1636 to 1676 (venus.travel), 2106 to 2167 (earth.rise), 2206 to 2246 (earth.travel), 2747 to 2816 (mars.travel, lift up to 0.0017), 3247 to 3307 (jupiter.rise), 3346 to 3386 (jupiter.travel), 3867 to 3884 (saturn.rise), 3908 to 3956 (saturn.travel), 4397 to 4454 (uranus.rise), 4501 to 4526 (uranus.travel), 4950 to 5004 (neptune.rise). List from `out/work/liftscan.ts` (untracked). At the tiers with more than one sample the frame beside a range changes too when its shutter reaches into the range. On the earlier mains the list was 738 (0e5ddf1b) and 751 (e7fc53a2) frames; it follows the number of handover_engineer.
- Byte proof, draft, 1920 by 1080, beauty, one session each side, base = main 0e5ddf1b (the tree of this branch differed from it in `assets-src/flightsky` alone): the 18 judged frames, 0, 200, 3000, 4700 (lift 0) and 1050, 1620, 2190, 3330, 3895, 4470, 5100, 5399 (lift 1) keep their sha256; 480, 2780, 1010, 3868, 3874, 3880 change. Helper `out/work/bytes.ts --list k,k` (untracked). Again on main e7fc53a2 (the base of the commit): 360, 3465, 3720, 870, 3000, 1050, 3895, 5399 keep, 3874 and 1010 change.
- Byte proof on the head the commit sits on (main 6e17859d plus 156ed6f9), draft, 16 by 9: 2325, 2895, 5085, 5235 keep the hashes of main 8fb9ba9b; 360, 3465, 3720, 3895 keep the hashes they had on e7fc53a2; 495, 1072, 4436 change (lift between 0 and 1). 1050 was not compared on this main (d189 moved the frames 1035 to 1058).
- Tests on main 6e17859d plus 156ed6f9 plus this commit: `npm run build`, `npx vitest run`, 43 files, 402 passed. Main moved to 50146244 after that run in tests, tools and notes alone (`tests/onemove.test.ts`, `tests/place.test.ts`, `tools/seam.ts`); the commit sits on that merge.
- Tests on the merge with e7fc53a2: `npm run build`, `npx vitest run`, 42 files, 378 passed (the walk takes 180 s and 105 s, the look test 57 s).
- The look a stop names: `nameSkyLook(id, look, weight)` exported from `src/space/sky.ts`, `SkyLook { look, band, map, stars, even, cap }`. A stop calls it from its set's `update` every frame it wants it, with its own weight 0 to 1; the engine's sky reads the names at its next picture and forgets them (`Sky.render` clears after use, `Sky.setBandLook` clears before the sample's updates so a name from the place picture pass does not leak). No name, no change: the uniforms stand at 1, 1 and 1, 0, 0, 0 and every branch is skipped.
  - `look`: the band look weight, 0 the natural blue white band, 1 the warm flight look (replaces `travel.sky.bandLook` of the stop by the weight).
  - `band`: gain on the band's light. `map`: gain on the sky map off the band. `stars`: gain on the catalog stars.
  - `even`: 0 to 1, takes the crowd factor of the catalog stars to 1 (the same field everywhere, not thinned off the band).
  - `cap`: ceiling on a catalog star's level before exposure, so a high `stars` gain gives many faint stars and no fat ones.
  - All act on top of the stop's own sky exposure.
- Trial at 3720 (engine hook, since removed; box x 0 to 900, y 0 to 330 at 1920 by 1080; approved mean 7.7, 10.8, 15.4, percentile 99 29.3, share over 40 0.0049): film now 8.3, 11.5, 15.7 with orange clusters at the left (the band with the warm look; at exposure 0.0935 only its bright cores show) and a starless right. `{look: 0, even: 1, stars: 3}`: 8.3, 12.2, 16.7, p99 30.4, share 0.0061, clusters blue white, fewer and fatter stars than approved. `{look: 0, even: 1, stars: 8, cap: 0.5}`: 8.9, 12.8, 17.3, p99 36.5, share 0.0072, an even field of small faint stars, the nearest in kind; `cap: 1.5` at the same gain: p99 44.5, too many. Starting values sent to saturn_coder: `{ look: 0, even: 1, stars: 8, cap: 0.5 }`, then `stars` down toward 5 for the level.
- Split with handover_engineer: it owns the one function from height to `shot.skyStars` (`src/director/film.ts`, `src/director/moves.ts`), 0 to 1, never falling in height; I own what the sky draws for that number (`Sky.setStarLift`, the shaders, `travel.sky`). Its number is monotone in height, my sky is monotone in its number.
- MAIL 513 (04:20 UTC) came in between; its commit 156ed6f9 went first so that its 16 by 9 byte proof is clean against main, and this commit sits on top of it.
- Helpers, untracked: `out/work/walk2.ts`, `grid.ts`, `look.ts`, `gl.ts`, `views.ts`, `liftscan.ts`, `bytes.ts`.

### MAIL 513 (Nov 24, 04:20 to 05:15 UTC): nothing by the pixel in the stars, the 4K sky is the sky of the film
- Asked: the stars are not the same picture at uhd as at 16 by 9 (uranus_builder, parity at 4436: sky level -3.263, whole frame -2.550 against 2.2; harness_builder, travel 1073: 16 by 9 is 1.5 levels brighter than uhd scaled down and holds 2.14 times the fine detail).
- Cause: `STAR_FRAG` (one program text for the catalog stars, the flight stars, the deep stars and the strip stars) took `p = (gl_PointCoord - 0.5) * vSize` in buffer pixels, so the core `exp(-r2 / uCore)` and the tail of the star law `edge * edge / (1.0 + r2)` kept their width in buffer pixels while the sprite followed `uPixel`. At uhd a core had half its angle and a quarter of its light.
- Second term by the pixel, found on the way and cured in the same commit: the two dithers of the sky pass hashed `gl_FragCoord` (the grain on the swapped off band map and band glow, `flightStrip.dither`, and the dither of the flight veil, `uFlightVeil.w`). White noise per buffer pixel halves when uhd is scaled down by 2, which is the factor 2 in the fine detail of the travel row.
- Cure: `float size = vSize / uPixel` in `STAR_FRAG` and every length there in it; the two hashes take `gl_FragCoord / uPixel`, with a new `uPixel` on the sky pass. `uPixel = height / 1080` as before (the swap to `src/core/frame.ts` is a commit of its own, as MAIL 513 says). At 16 by 9 `uPixel` is 1 and a division by 1 is exact.
- Proof (a), draft, 16 by 9, beauty, one session each side, sha256 of the PNG (first 20 hex), main 8fb9ba9b against the commit, all seven equal: 495 387d17b8f1aaf2a08579, 1072 cde4a21e065dc31a353b, 2325 fd128b1a999f76fa0790, 2895 b3b3c64e06087fcd4cbf, 4436 93fbf2031cea7689844a, 5085 d33ccddcbc552e013c53, 5235 48028d691123b45fb3c8.
- Tests on the merge with 8fb9ba9b: `npx vitest run`, 42 files, 398 passed.
- Proof (b), `npm run smooth -- --stop uranus --kind rise --only parity` and `--stop mercury --only parity` on main 8fb9ba9b and on the commit (frame, segment, mean, 99th, max, level, colour, coarse mean, coarse max, block level, block, fine detail):
  - before `| 4436 | uranus.rise | 3.352 | 40.4 | 163 | -2.533 | -2.631 | 2.655 | 44.00 | -11.347 | 4,6 | 1.734 |`
  - after `| 4436 | uranus.rise | 1.578 | 9.6 | 104 | -0.166 | -0.190 | 0.393 | 7.06 | -1.170 | 9,1 | 1.341 |`
  - before `| 1073 | mercury.travel | 2.355 | 32.1 | 165 | -1.539 | -1.576 | 1.546 | 32.22 | -3.064 | 0,8 | 2.139 |`
  - after `| 1073 | mercury.travel | 1.291 | 7.9 | 38 | -0.016 | -0.018 | 0.156 | 1.66 | -0.205 | 8,3 | 1.471 |`
  - Uranus rise is green after (largest level -0.349 at 4418). Also moved: 4418 mean 1.489 to 1.406, level -0.466 to -0.349; mercury 998 mean 4.542 to 4.393, level 1.030 to 1.245; 1016 mean 3.097 to 2.658, level 0.139 to 0.743, coarse 2.048 to 1.491. Mercury stays red on the block level of 713, 998, 1016 (45.839, 35.089, 28.074 at blocks 8,5 and 10,5, unchanged, on the body: the place picture, not the sky).
- Proof (c), crops of 4436 pushed to `agent/flightsky-looks` 45cc098e: uhd one to one (x 600, y 120, 960 by 540) before and after, the 16 by 9 crop (x 300, y 60, 480 by 270) scaled up twice. Luma mean 20.50 before, 22.91 after, 22.96 at 16 by 9; share over 60: 0.0044, 0.0164, 0.0173; 99th percentile 42.3, 78.3, 81.7. After the cure the stars are the same discs as at 16 by 9; before they were thin points.
- What else stands by the pixel in `src/space/sky.ts`, read line by line:
  - Follows the pixel by design, the scaled down picture is the same: the derivatives that choose the level of a map (`smoothLod`, the band map), the four taps of `patchTexel` and `unfolded` (a footprint of the pixel), `fwidth` at the edge of the Sun's disc.
  - Already in pixels of the 1080 line picture: the small Sun (`perRad = 540 / tan(fov / 2)`, `flightStrip.sun.radiusPx`, `uSunPoint`), the fade of the stars at the Sun (`uSunHalf` 540), every point size (`* uPixel`).
  - In angles or in texels of the map: the Sun's disc, core and corona, the band's detail layer and dust (noise in the sky's direction), the fixed levels (`textureLod(uSky, uv, 1.0)`, `uCrowd.y`, `log2(textureSize) - c`). The galaxies are in the sky map alone, no term of their own.
  - No picture: `STAR_CULL_PAD_PX` 4, a margin of the cull in buffer pixels beyond the sprite.
  - Not mine: the post grain (`src/post/chain.ts`) is a hash of the buffer pixel and the frame.

### MAIL 545 and RULE d193 (Nov 24, 06:18 to 06:40 UTC): the sky's pixel factor comes from `src/core/frame.ts`

- MAIL 467 is on main inside the engine take f6ce51a5 (the Builder squashed it; fb501fc4 itself is not an ancestor of main). Main merged into the branch (5e977372); the tree of the merge is main's tree.
- The owed swap (MAIL 513: a commit of its own once the helper is on main; MAIL 520 named the helper and the rule): the five writes `uPixel = height / 1080` in `Sky.render` and the half sprite of the cull in `orderStars` now read `bufferFrame()`. No number of mine is left that divides by 1080; the 540 of `perRad` and `uSunHalf` are half the master's height, pixels of the 1080 line picture by design.
- Why `bufferFrame()` and not the shared `frameUniform` object: it is what the globe and the far point read, and it is right if the sky is ever drawn inside a place picture pass (there the engine sets the pass scale). Today the sky is drawn only by `Sky.render` on the frame's own buffer, after `setPass(1)`, so both are the format height over the master's, the same division with the same bits as before.
- A caller of `Sky.render` outside the engine (`tests/skylift-gl.test.ts`) draws at 1080 lines with the factor at its start value 1. A caller at another height calls `setFrame(height, master)` first.
- Not mine and still its own `height / 1080`: `src/space/dust.ts` line 182.
- Proof, sha256 of the draft PNG on the merge of main f6ce51a5 before and after the swap: 16 by 9 frames 495, 1072, 2325, 3874, 4436, 5085, 5235 equal; uhd frames 1072 and 4436 equal. No frame of the film changes its bytes in either format.
- Named at 06:49 UTC: head f50d84d5dea0b62963a42d2eb4ad2597655919a5 (merge of main b0b87889; my commit e892df20). Full suite on it: 45 files, 427 passed. MY FAULT: the NAMED mail carried a sha whose tail I wrote from memory, not the real one; the Builder took the branch head by its first eight characters (MAIL 553). From now on a full sha in a mail is pasted from `git rev-parse HEAD`, never typed.
- Parity after the naming (d194), `npm run smooth -- --stop uranus --kind rise --only parity`: green on the head; run again with main's `sky.ts`: the eight stills byte equal and the report equal but for the seconds a frame. No mail sent, as nothing differs.
- MAIL 553: the head is stacked in the Builder's proof tree with handover_engineer's relief presence; nothing more owed. This entry is committed locally and goes out with the next push.

### MAIL 590 and 592 (Nov 24, 08:50 to 09:02 UTC): the pop in Uranus's dive at 4141 to 4146 is not the sky's

- Asked: does a sky term set in or end at 3312 to 3314 (Jupiter's rise) or 4141 to 4146 (Uranus's dive), do stars keep their place at half frame steps, is it mine. Jupiter was withdrawn (MAIL 592: its rise law). Nothing built, no file changed; the answer went to the Builder at 09:01.
- Method, on proof tree 9a369939 checked out detached and left again: `out/work/pop.ts` (the shot's sky numbers and the step of the sky in master pixels a capture frame), `out/work/pose.ts` (pose of each capture frame as JSON), `out/work/half.ts` (draft frames at rate 2 into a folder), `out/work/popan.py` (the tool's own `left` from `tools/img/smooth.py`, split by zone, beside the same difference with the sky's true motion taken out by the pose, and single stars followed from frame to frame).
- Found: lift 0, exposure 0.6, glow 1, look and patch 1 through 4130 to 4156. The sky crosses the picture at 56 to 66 px a capture frame, half from the camera, half from the stop's own turn of the sky (`skyCarryShare`, span `low.skyTurn`), while `skyShare` dissolves the stop's two painted skies from 4138 to 4158. A bright star field enters at the left edge at 4140 + 1/2 and is gone by 4149. The tool's rise is all in the sky and limb zones (sky 0.15 to 1.68), the body flat at 0.51 to 0.63. The tool's flow finds 46 to 52 px of the true 58 to 62.
- Stars keep their place: median error 0.00 to 0.03 px in 36 pairs, scatter 0.09 to 0.26 px on lone stars, sub-pixel places evenly spread.
- Not known: how the 7 to 9 percent of brightening in place a capture frame divides between the dissolve, the vignette and the limb's glow; whether the orange field is the stop's painted picture or my band.
- MY FAULT in the first line back: I wrote a time I had not read from the clock. A time in a mail comes from `date -u`.

### MAIL 732 (Nov 24, 20:17 to 21:50 UTC): the Milky Way at a stop resolves into points

- Asked (critics of rounds 43 and 44, Saturn 3567 and Mars 2726): the Milky Way reads as soft blobs with colour noise under sharp star points. Find the cause, cure it at the cause, proof at the final tier, the grade must not shift, no star moves.
- Cause, read and measured:
  - Three layers made the band at a stop: the starless map `sky.jpg` off the band, the strip `skyband.jpg` on it, the catalog points on top.
  - Size against the lens: `sky.jpg` (8192 by 4096) gives 0.69 texels a pixel at 3567 (vfov 31.83) and 0.72 at 2726 (vfov 33.39). `skyband.jpg` (8192 by 2048 over 180 by 45 degrees, widen 1.5) gives 1.38 texels a pixel along the band and 2.07 across at 3567. So the strip is not short of texels; it is short of stars.
  - The strip is four takes of the image model `seedream_5` at 2816 by 1584, enlarged 4 to 3 and joined (`tools/assets/skyband.py`). The model paints a star cloud as soft spots several texels wide, not as points. Those are the blobs. The catalog points (core 0.7 px) on top are the sharp points, hence the jump in sharpness.
  - Colour noise: the band grade (`skyFrame.band.gamma` 1.4) and the warm look both took the level from the pixel itself, so every bright blob was pushed up and toward the look's light colour (orange at Saturn) and every dark gap toward the dust colour. The model's own red and blue spots were under that. Not the JPEG (quality 93, 4:4:4) and not a dither: `flightStrip.dither` acts on the swapped maps of the flight only.
- Cure (`stopLayer` in `src/space/sky.ts`, values under `travel.sky.flightStrip.stop`, recipe in `RECIPE.md`): at a stop the cloud's light is the starless strip `skybandglow.png` (colour calmed half way toward level 6 of the strip), 0.35 of it is taken out and given back as two layers of generated stars with the catalog stars' core, with a power law of brightness; the photograph only acts as the dust lane mask `min(photo / cloud, 1) ^ 1.3`, on cloud and stars alike. The grade and the look read the level from the smooth cloud and lanes, so a star has the cloud's hue. No new file, no third party source: `ASSETS.md` needs no row.
- No star moves: the catalog stars and their crowd factor are untouched (it still reads `uBand`). The generated stars are fixed in band coordinates, so they turn with the sky as the catalog does. In flight (lift 1, `uFlightStrip.x` 1) the branch is skipped and the picture is as before; between, the stop band dissolves into the flight band as before.
- MY choices: layer values (points 1080 by 180 cells, light 0.2, slope 1.2, cap 120; grain 5400 by 900 cells, light 0.37, slope 3, cap 5; share 0.35; lane 1.3; tint 0.5; calm 0.5 at level 6; fine 0.85 to 1.15), tuned against `references/approved/mars-hero.png` in a sky only harness (`out/work/skyshot.ts`, not committed) for equal mean level. Tried and left: share 0.5 to 0.55 with grain 4320 by 720 (reads as sand, the cloud's body is lost), lane 2.4 (lanes too black, mean falls).
- Proof, final tier, 16 by 9, before on the tree of main c6d87bc9, after on 2f73dfe2, one session a side (`out/work/fin.ts`), pictures in `/home/user/workspace/scratch/m732/` (`<frame>-before.png`, `<frame>-after.png`, `<frame>-pair-crop.png`) and as looks on `agent/flightsky-looks`. Crops one to one: 3567 x 0 to 760, y 0 to 400; 2726 x 1400 to 1920, y 0 to 520; 3866 x 1240 to 1920, y 560 to 1080.
  - Mean level, red green blue of 255. Band region = pixels within 4 px of a pixel that changed.
    - 3567 (saturn.dive): frame 86.366 78.989 69.828 to 86.354 78.989 69.778; band region 42.246 41.799 40.585 to 42.221 41.798 40.484.
    - 2726 (mars.rise): frame 66.779 47.487 43.675 to 66.778 47.487 43.658; band region 26.151 31.847 39.729 to 26.147 31.846 39.674.
    - 3866 (saturn.rise, the band crosses the whole picture): frame 80.770 75.142 67.139 to 80.859 75.146 67.025; band region 53.895 51.269 47.599 to 54.053 51.276 47.397.
    - Sky only, no post (harness, whole picture): 3567 22.903 25.883 26.961 to 23.182 25.981 26.756; 2726 9.257 15.413 20.802 to 9.275 15.426 20.786; the view of 2325 without its patch 14.630 22.234 29.979 to 14.647 22.295 30.002. Under the warm look red rises by about 0.3 and blue falls by about 0.2; under the plain look (Mars) nothing moves.
  - Brightest part of the band (3567 x 0 to 760, y 0 to 230; 2726 its crop; 3866 x 1500 to 1920, y 700 to 1080), before to after: colour mottle (rms of chroma between 6 and 24 px) 2.376 to 1.853, 1.004 to 0.717, 2.336 to 1.972; blob band (rms of luma between 1.5 and 5 px) 8.118 to 5.862, 6.173 to 5.870, 8.756 to 6.377; fine detail (rms of luma under 1 px) 9.369 to 10.110, 8.174 to 10.134, 10.514 to 11.406; 99th percentile of luma 138.8 to 124.4, 95.3 to 100.4, 137.9 to 125.1. The brightest part of 3567 is 0.3 levels lower in each channel (36.182 35.199 33.582 to 35.863 34.982 33.284): the bright blobs are gone.
  - The holds do not change, and that is a finding of its own: 4605 is byte equal (sha256 62b3be24c994127e0072 both sides), 2325 differs in 2 pixels by 1 level. At a hold the stop's painted picture `sky-hold.webp` (`"add": false`) replaces the engine's sky over the whole frame. Every stop has one (`src/stops/<stop>/sky.json`). So blobs in the sky of a hold are in that stop's painted patch, not in this layer, and this cure cannot reach them. The engine's band shows on rises, dives and the flight. 1857 (earth.dive) changes in 0.26 percent of its pixels (a corner of the band).
  - Flight unchanged: draft 5085 e970ab9d47805fafa407 and 1050 4d03a61feebaea0f7f2c, byte equal before and after.
- Checks on 2f73dfe2: `npx tsc --noEmit` clean; `npx vitest run` 53 files, 554 passed (`tests/skylift-gl.test.ts` holds: no pixel class falls from lift 0 to 1 at 3872 and 5010); `tools/shaderaudit.py` lists the same two lines of `sky.ts` as before (`patchTexel`, the band's own sample), none of the new code.
- Open: between lift 0 and 1 the generated points fade out while the flight's strip points fade in; they are not the same stars. Seen at lift 0.3 in the harness it reads as a dissolve of a faint field under bright points, no star jumps. The smooth tool was run for parity only.
- Open: the red of the band under the warm look is up by 0.1 to 0.3 levels in the sky only picture. Left as it is; one value (`points.light` or the tint) trims it if the Builder wants it exact.
- Parity on 2f73dfe2 (d194), both green: `npm run smooth -- --stop uranus --kind rise --only parity` (largest mean 1.523 at 4436, whole frame level -0.320 at 4290) and `--stop saturn --kind rise --only parity`, where the generated field crosses the whole picture at lift 0: `| 3866 | saturn.rise | 2.305 | 15.7 | 61 | -0.608 | -0.732 | 0.735 | 12.73 | -6.530 | 2,4 | 1.030 |`, fine detail of 16 by 9 over uhd 1.030, so the points are the same picture in both formats. No Saturn parity of main was run to set beside it.
- Looks pushed: `agent/flightsky-looks` 46cf32ba (the three crop pairs, 3567 and 2726 full before and after, 3866 half size pair; the tool scales to its long edge, the one to one files are the PNG in the scratch folder).
- Main moved to 6ecb2fb5 during the proof. Merged with depth 1 only (MAIL 572): `git merge-tree --write-tree --merge-base=<c6d87bc9> HEAD origin/main`, then `git commit-tree` with both parents; GitHub's compare says 6ecb2fb5 is 20 ahead of c6d87bc9 and 0 behind. Merge 079237df: its tree is main's plus `sky.ts`, `field.ts`, `showcase.json` (the `stop` values), `RECIPE.md`, `NOTES.md`. On it: `npx tsc --noEmit` clean, `npx vitest run` 56 files, 600 passed, parity of Uranus's rise green with the same rows as on 2f73dfe2. The proof pictures were taken on c6d87bc9 with and without the cure, not on 6ecb2fb5.
- MY FAULT, caught before it went out: I typed the base sha by hand in one command and dropped a digit; the command failed. A sha in a command comes from `git rev-parse` as well.

### Request of venus_builder (Nov 25, 01:54 to 02:36 UTC): the law of the sky seen from a surface comes in by a weight, not by a threshold

- Asked by venus_builder through handover_engineer, not by the Builder: `sky.ts` chose the terrain law of the band (`band.terrainGain` 2) and of the stars (`stars.terrainGain`, `terrainCrowd`, `terrainCore`, `terrainCap`) by `uGlow < 0.999`. On the globe side of a dive and a rise `film.ts` gives `skyGlow = mix(1, terrainSkyGlow, skyShare)`, so the whole law set in within one sample where the share passes 0.00133 (Venus, Mars 0.25) or 0.00154 (Jupiter 0.35).
- Main merged first (aeffd516, merge 53abb3dd, by `git merge-tree` as before; GitHub's compare: 219 ahead of 70267111, 0 behind).
- Confirmed on 53abb3dd (it holds MAIL 732), draft, 16 by 9, capture rate 128, luma of the upper left 480 by 129 px: k 168510 to 168516 = 19.35, 19.43, 19.48, 24.96, 25.05, 25.16, 25.23. The step of 5.48 stands between k 168512 and 168513 (film frame 1316.5 to 1316.5078), its neighbours are 0.05 to 0.11. Venus's rise: whole frame luma 74.705 to 74.535 between k 199259 and 199260, neighbours 0.001. Mars at its crossing (k 314596, 314597): the two frames are byte equal with and without the cure, the engine's sky does not show there.
- Cure, two commits:
  - ca3ecacc, `sky.ts` alone: `Sky.setTerrain(weight | null)` and a uniform `uTerrain` in the sky pass and the catalog stars. Band `*= mix(1, terrainGain, w)`, star `mix(orbit law, min(terrain law, cap), w)`; at w 0 and 1 the old expression is taken by a branch, not by `mix`, so the ends keep their bits. With no weight told (`null`, the start value) the weight is the old threshold on the glow, so this commit alone changes no frame.
  - 6be4c458, FOREIGN LINES, one line in `src/core/engine.ts` before `this.sky.render(...)`: `this.sky.setTerrain(shot.skyShare === undefined ? null : shot.skyGlow < 1 ? shot.skyShare : 0)`. A surface view has no share and keeps the threshold; the globe side of a stop without `terrainSkyGlow` has glow 1 and weight 0 as before.
- MY choice: the weight is `shot.skyShare` as it is, the same number the glow is mixed by, no second curve. The product of band gain and glow over the share s is then (1 + s)(1 - 0.75 s) for 0.25: 1 at 0, 1.02 at 1/6, 0.5 at 1; before it jumped to 2 at 0.00133.
- After, the same frames: 19.36, 19.43, 19.49, 19.56, 19.64, 19.73, 19.79; the rise 74.536, 74.537, 74.535, 74.535. The three frames before the old threshold move by 0.01 (the weight is 0.0013 there, not 0).
- What changes: only the globe side of the dives and rises of Venus, Mars and Jupiter while the share is between 0 and 1. There the band and stars are now dimmer than before, by design (1318: upper left 36.31 to 29.42; 1322: 38.85 to 37.34). Byte equal before and after at draft, rate 1: 1185 (hold), 1300 (venus.dive before the share), 1440, 2580, 3150 (terrains of Venus, Mars, Jupiter), 1857 (earth.dive), 3567 (saturn.dive), 5085 (flight). 1340 (venus.dive, share 0.997) differs by 1 level in a few pixels.
- Test: `tests/skylift-gl.test.ts` gains one case (about 75 s): weight 0 at glow 1 and weight 1 at glow 0.25 give the pictures of the threshold float for float, and from share 0 to 1 no step of the mean is larger than 1.5 times the step of the share (floor 0.002 of the mean).
- Pictures: `/home/user/workspace/scratch/tw/step-crop.png` (upper left crop twice enlarged: top row k 168512 and 168513 before, bottom row after), `1318-pair-half.png` (frame 1318 half size, before left).
- Checks on 6be4c458 (merge of main aeffd516 plus MAIL 732 plus the two commits): `npx tsc --noEmit` clean; `npx vitest run` 60 files, 636 passed; parity green for `--stop venus --kind dive` (1328: mean 1.319, level -0.324) and `--stop uranus --kind rise` (4436: mean 1.523, level -0.166).
- Not done: the smooth tool's path part on Venus's dive (venus_builder holds that measure), Jupiter's crossings (k 385342 and 419639) and Mars's rise were not rendered.
- Named at 02:34 UTC: 14ab0ab8431c10bc38be4def7c7138ce97101451 (merge of main 75102d49).
- handover_engineer read the engine line (02:36): it reads the Shot rightly and stands in the right place. On `agent/engine-under` the sky block of `renderSample` becomes a closure `sky(open)`; the line moves with it, unchanged, before `this.sky.render`. He resolves the conflict if mine is on main first.
- Edge he named, no stop has it: the globe side asks `skyGlow < 1`, a surface view (no weight told) asks `glow < 0.999`. A stop with `terrainSkyGlow` from 0.999 to under 1 would get the share on the globe side and 0 on the surface: a step at the change of view, of at most 0.1 percent of the glow times the terrain gains. Left open; closing it needs either the stop's `terrainSkyGlow` on the Shot or the surface view telling weight 1.
- MAIL 858 (02:50): the Builder wants the cure, judges the dimmer band on the globe side from pairs first, takes it with batch 9 after the under pass and merges the engine line by hand. Until then no commit on top of 14ab0ab8 that changes a pixel. Asked: the film frames where the change is largest per stop, at most 8 a stop.
- Answer to MAIL 858 (sent 03:18 UTC): every globe side frame of the three stops drawn on the tip and with the engine line taken out (draft tier, 960 by 540, one sample a frame), 98 pairs, in `scratch/tw/pv`, ranked by `scratch/tw/rank.py`. The change is largest at the lowest share and falls to nothing at share 1; it sits in the sky strip above the limb only.
  - Venus: 1317, 1318, 1319, 1320, 1321 (dive), 1553, 1554, 1555 (rise). Largest 1319: 5.3 percent of the pixels move more than 2 levels, frame mean 70.09 to 69.68.
  - Mars: 2463, 2464, 2465 (dive), 2692, 2693, 2694, 2695, 2696 (rise). Largest 2695: 1.5 percent, mean 77.31 to 77.26. The dive moves 0.13 percent at most.
  - Jupiter: 3016, 3017, 3018, 3019, 3020 (dive), 3271 (rise). Largest 3018: 0.8 percent, mean 169.01 to 168.98, in the corner of sky at the upper right. The rise shows no sky to speak of: 3 pixels in 3271.
  - From share 0.6 up the few stars that still move are a little brighter than before, since the terrain law's cap now arrives by the weight too.
  - Not measured: final tier, the full shutter.
- MAIL 885 (03:40 UTC): the Builder took the frame list; his machines draw the pairs, main beside the tip, at draft and at final, and he sends them with his word. The engine line is his to merge after the under pass (9ea28c24 on `agent/engine-under`) is on main: batch 10. No rebase onto it, `src/core/engine.ts` not touched until then. Standing order: keep the branch merged with main after each batch and name the sha again when it changed.
- Main 92c5f998 merged at 03:41 (6 commits, `kit/PROGRESS.md` and `scorecards/round-048` only, no source). Checks on the merge: tsc clean; parity green for Venus dive and Mars rise; vitest 59 files green, 1 file with 1 case over its time limit: `tests/globe-cap.test.ts`, "brings a colour level in by the texels of its parent", 5014 ms against the limit of 5000, while the sky's long GL case ran beside it. Alone the file passes 24 of 24. Not my file and equal to main; told to the Builder with the name.
- `gh` lost its login at 03:41. The ancestry check works without it: `curl -s https://api.github.com/repos/BrandonChurch93/Solar-System-Perplexity/compare/<old>...<new>` (status, ahead_by, behind_by, files).
