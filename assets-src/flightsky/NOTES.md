# Flight sky notebook (agent `sky_builder`, branch `agent/flightsky`)

Task: section B of `assets-src/shared/ROUND31-FIXES.md`. After a compaction read the brief again, then this file.

## Setup

- Clone in `/home/user/workspace/repo`, branch `agent/flightsky`, base 2b50ee2.
- Before renders live in a second worktree `/home/user/workspace/base` (branch `base-ref`, same commit, node_modules linked). Stills in `base/out/work/stills/`. Draft hashes of the ten check frames in `/tmp/base-draft.sha`.
- One render process at a time. Final still about 75 to 100 s, review about 35 to 50 s, draft about 17 s on this 4 core VM.

## What the before finals show

- 3352: the strip's baked stars are tall ovals on blocky mush, under crisp white code stars. Large soft grey discs are the deep set's wide cores.
- 1642: the gold band ends on a nearly straight edge near x 700 of 1400, with a jump in speckle density. Cause: the strip fades between 0.12 and 0.3 of its latitude span along a pure latitude line, and the flight grade sharpens that ramp.
- 2782: orange red speckle groups in the dark sky come from `sky.jpg` itself (JPEG chroma noise lifted by the flight grade), not from the band strip.
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

## Not mine, seen while working

- 2782, the bright point with a one axis spike at (1247, 978): it is the next planet's far point, `src/bodies/farpoint.ts` line 20, third term `0.05 * exp(-p.y * p.y / 0.7 - p.x * p.x / (0.06 * uSize * uSize))`. Not a star of any sky set. Proposed line for its owner: `outColor = vec4(uColor * (exp(-r2 / 0.9) + 0.07 * exp(-r2 / (0.02 * uSize * uSize))), 0.0);` (drops the spike; changes every frame where a far point shows, holds included).
- `src/capture/export.ts` `skyBytesFor()` counts only `sky.jpg`. The band strip was already missing there; the new glow map adds 16.8 MB (full) or 4.2 MB (web).
- Probe: `npx tsx tools/_probe.ts <frames>` is not committed; it printed lift, patch weight and look weight per frame. Travel mid frames: lift 0.921, patch 0.079 (3922: lift 0.662, patch 0.338). Rise frames: lift 0.74, no patch. 5085: lift 1. 5235 and 5362: lift 0.
