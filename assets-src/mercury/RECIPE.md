# Mercury stand-ins

Stand-ins for the Phase 2 blockout. Each is replaced when the stop is built.

## public/assets/mercury/full/standin-wrap.jpg and public/assets/mercury/web/standin-wrap.jpg

- Tool: `python3 tools/assets/standin.py mercury` (numpy and OpenCV, no model).
- Inputs: `references/approved/mercury-hero.png`, `assets-src/mercury/fit.json`.
- Prompt: none.
- What it does: unprojects the approved hero image onto the fitted sphere as an equirectangular map, 4096 wide for `full` and 2048 wide for `web`. The part of the globe the image does not show is filled by mirroring the visible part about a circle at 0.9 of the limb angle. No cleanup: the light, the limb glow and anything in front of the globe stay baked in.
- Take kept: the only one.
- Checks: the judged `hold` frame lines up with the approved hero image in `npm run compare`.

## public/assets/mercury/full/standin-close.jpg and public/assets/mercury/web/standin-close.jpg

- Tool: `python3 tools/assets/standin.py mercury`.
- Input: `references/approved/mercury-close.jpg`.
- Prompt: none.
- What it does: the approved close image, re-encoded at its own size for `full` and resized to 2048 wide for `web`. Nothing is redrawn.
- Take kept: the only one.
- Checks: the judged `terrain` frame lines up with the approved close image in `npm run compare`.

## Plates of the place: patch-2.jpg, patch-3.jpg, patch-4.jpg (dive) and patch-3r.jpg, patch-4r.jpg (rise)

Files, each in both sets (`<set>` is `full` at 4096 x 4096 and `web` at 2048 x 2048), all made by the steps of this section:

- `public/assets/mercury/<set>/patch-2.jpg`: plate of the place for the dive, 38 deg wide (steps 1 to 5, 7; generation in step 4)
- `public/assets/mercury/<set>/patch-3.jpg`: plate of the place for the dive, 19 deg wide (steps 1 to 5, 7; generation in step 4)
- `public/assets/mercury/<set>/patch-4.jpg`: plate of the place for the dive, 9.5 deg wide (steps 1 to 5, 7; generation in step 4)
- `public/assets/mercury/<set>/patch-3r.jpg`: plate of the place for the rise, 19 deg wide (steps 1 to 3 with `rise`, then 6 and 7 over the level 3 of the dive; no generation of its own, no takes)
- `public/assets/mercury/<set>/patch-4r.jpg`: plate of the place for the rise, 9.5 deg wide (steps 1 to 3 with `rise`, then 6 and 7 over the level 4 of the dive; no generation of its own, no takes)

The three deepest levels of the patch pyramid (38, 19 and 9.5 deg wide about the spot) are plates of the place: the ground of the close view at the handover, laid back onto the sphere, in the close view's own light inside 10 deg of the spot (ring feather to 15 deg, `src/stops/mercury/own.json`). Outside the ring level 2 is the old level. The dive uses `patch-2`, `patch-3`, `patch-4`; the rise binds `patch-3r` and `patch-4r` to the same two samplers (the same levels seen from the handover of the rise, because the relief of the close view shifts fine detail by 18 texels of level 4 in the median between the two views).

All values: `assets-src/mercury/place/plates.json`. Work files: `out/work/mercury/place/` (not committed).

1. Camera: `src/stops/mercury/place.json` (`npx tsx assets-src/mercury/place/solve.ts`).
2. Source picture: the close side itself, drawn by the engine from the camera of the handover in 8 tiles, review tier, master, full, `DIAG=ungraded` (`assets-src/mercury/place/tiles.json`, `tiles.ts`, `python3 assets-src/mercury/place/tilepatch.py on dive`, render, `tilepatch.py off`; the same with `rise`; the patch is never committed).
3. Lay back: `python3 assets-src/mercury/place/plates.py lay dive` and `lay rise` (north up gnomonic plates through `mosaic.py`, with weight, stretch and ground sample distance per texel).
4. Repaint by generation of the ground around the place, through the skill named media, model seedream_5, 1:1. Prompt: `assets-src/mercury/place/prompts/repaint.txt`. Inputs per call: image 1 the lead tile `L<level>-in-<tile>.jpg` (2240 px of the 4096 px level, sent at 2048), image 2 `style.jpg` (the sharpest 1280 px of the lay back, `repaint.py style`). Five tiles per level: `tl`, `tr`, `bl`, `br` and `c` (over the place). Per level, 2 then 3 then 4: `python3 assets-src/mercury/place/repaint.py lead N`, generate the five tiles as `L<N>-<take>-<tile>.png`, `repaint.py build N '{"tl":"a3",...}'`. The lead of level 2 is the old level in the light and grade of the handover; within 8 to 14 deg of the place it is the old ground's luminance, flat fielded, matched to the place by quantiles and tinted with the place's colour, times the tone of the place at its edge spread outward (`zoneDeg`, `zoneFlatDeg`, `matchReachDeg`, `toneClamp`). The leads of levels 3 and 4 are the level above, enlarged. Inside the place the lead is the lay back. The build registers each take to its lead by flow, locks its lows to the lead (26 px), joins the tiles with 128 px seams, keeps the lead where the lead is dark (night side, `night`), and lays the unstretched lay back over the result.
5. The band, by code, no generation: `python3 assets-src/mercury/place/craters.py`, then `python3 assets-src/mercury/place/band.py lay`. `craters.py` builds a height field of a cratered plain on a 26 deg canvas about the spot at the texel of level 4 (`band.canvasDeg`, values under `craters` in `plates.json`): rolling ground, rough ground in four octaves, then craters from a seeded power law population (seed 11, cover 0.13, 3 px to 0.45 deg radius, bowl, rim, worn rim, terraces, flat floor and central peak above `complexDeg`), each stamped onto the ground it wipes. The field is lit once with the Sun of the place at each texel (direction and height from the spot, cast shadows marched along the Sun, penumbra, floor `range`) and written as a log shade. `band.py lay` puts, outside the sharp part of the place, the low tone of the place spread outward near its edge, then the low tone of the repainted level 2 (above `baseLowDeg`) plus its middle band (between `midDeg` and `baseLowDeg`, capped by `midCap`), plus the crater shade, times the dusk by the Sun's height. The craters thin out between `reachDeg` (a 4 norm of the tangent degrees from the spot) and end at `fadeDeg`, where the fine detail of the repainted level 2 takes over; levels 3 and 4 show no repainted detail outside the place. Inside the stretched part of the place the field only fills, octave by octave, the detail the lay back lacks (`fillDeg`, `fillWindowDeg`). Output `B<N>.npy`, views `B<N>-view.jpg`.
6. Rise: `python3 assets-src/mercury/place/band.py rise`: the lay back of the rise over `B3`, `B4`, tone matched at its edge, only where the rise lay has weight (`repaint.layWeight`). Output `B3r.npy`, `B4r.npy`.
7. Plates: `python3 assets-src/mercury/place/plates.py plate dive`, `plate rise`, then `plates.py install dive`, `install rise` (full 4096, web 2048, JPEG quality 94, no chroma subsampling).

Takes (at most 6 per asset per round; the asset is one tile of one level), flow of the take against its lead before registration, median px at 1024:

| level | take | tl | tr | bl | br | c | kept |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | a1 | | | | | | no: outline of the place, first mask |
| 2 | a2 | | | | | | no: outline, invented craters |
| 2 | a3 | | | | | | no: outline, invented craters |
| 2 | a4 | 1.16 | 1.01 | 1.33 | 0.87 | 0.70 | no: mask of the place too wide (sky and a lens ghost inside) |
| 2 | a5 | 0.83 | 0.87 | 1.34 | 1.07 | 0.83 | no: place stood as a grey fan in black night ground |
| 2 | a6 | 2.89 | | | | | yes, all five (tone zone 8 to 14 deg; the other four tiles 0.73 to 1.08) |
| 3 | a1 | 0.21 | 0.72 | 2.47 | 2.11 | 0.74 | no: mask of the place too wide |
| 3 | a2 | 0.41 | 0.59 | 0.43 | 2.75 | 0.32 | no: fan with straight edges |
| 3 | a3 | 0.28 | 0.66 | 0.82 | 0.55 | 0.28 | yes, all five |
| 3 | a4 | | | | 42 | | no: lead blurred near the place left a defocused ring |
| 3 | a5 | | | | 0.40 | | no (only `br`, for the a4 trial) |
| 4 | a1 | 0.19 | 0.43 | 13.79 | 0.41 | 0.35 | no: mask of the place too wide |
| 4 | a2 | | | 0.54 | | | no: mask of the place too wide |
| 4 | a3 | 0.45 | 1.30 | 0.27 | 0.29 | 0.22 | yes, all five |

Takes used: level 2 six of six on every tile (keeps a6); level 3 four (`br` five); level 4 two (`bl` three). The band (crater field by code), the far fill and the rise plates use no generation.

The old level pictures that `plates.py plate` mixes in outside the ring: `git show 1e492e92:public/assets/mercury/full/patch-N.jpg > out/work/mercury/place/old/full-patch-N.jpg` for N 2, 3, 4.

Checks: the sheets `out/work/mercury/place/repaint/L<N>-sheet-*.jpg` (lead beside result), `B<N>-view.jpg`, the top down dive sheet (`tilepatch.py on topdown`, 12 frames, `off`), the texel view of the dive (`DIAG=texels`), the dense sheets of dive and rise, the kept frames against `out/stills`.
