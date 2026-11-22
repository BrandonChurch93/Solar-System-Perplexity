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
