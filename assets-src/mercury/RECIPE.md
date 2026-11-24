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

## Fine ground of the place: fine.png

Files, both sets: `public/assets/mercury/full/fine.png` (2048 wide, 2176 high) and `public/assets/mercury/web/fine.png` (1024 wide, 1088 high), one channel, 8 bit. Values written beside them: `src/stops/mercury/fine.json`. No generation, no takes: the picture is a function.

What it is: the ground finer than the finest plate (level 4, 9.5 deg over 4096 texels), where no viewpoint saw it. A repeating square of small craters and rough ground, lit by the Sun of the place (7.03 deg high at the spot, the same direction as the plates), stored as the share of the light of flat ground (1.0 is flat ground, `top` 3.0 is white in the file). The globe multiplies its ground by it, twice: once at twice the texels of level 4 and once at four times, each coming in by the texels a pixel of the level before it (`patches.fade`), never by time, and only where the meshes of the close view do not cover the ground. One period is 2.38 deg (2.56 close units) at the first scale.

All values: `assets-src/mercury/place/plates.json`, key `fine`. Work files: `out/work/mercury/place/fine/` (not committed).

1. `python3 assets-src/mercury/place/fine.py tile`: rough ground in four bands (periodic, by filtered noise, seed 23), then craters from a power law population (radius 1.5 to 9 texels, cover 0.06; rough ground 0.05, 0.05, 0.04, 0.03 in the four bands), each stamped with `craters.py`'s own crater on a field that repeats, built at twice the size and lit with cast shadows by `craters.py`'s `shade`. It prints the step across the wrap against the step beside it (they must be alike: 0.0769 and 0.0819 for columns, 0.0591 and 0.0615 for rows). Printed by the bake in use: craters 17801, stamps 22995, mean 1.0008, share under 0.3 0.0122, percentiles 1, 50, 99: 0.232, 0.999, 1.759. The first bake (cover 0.16, radius to 11, rough 0.2, 0.2, 0.18, 0.15) read coarse and dark on the frames at 757 and was dropped.
2. `python3 assets-src/mercury/place/fine.py write`: both sets, with the guard rows above and below (the loader repeats a picture only sideways, so the first and last 1/32 of the period are written again beyond the far edge and the shader reads the middle).

How it is drawn (`src/stops/mercury/globe.ts`, values `look.ts` key `fine`): only outside the box of the close picture and the box of the wide picture (feather 0.03 of the box), strength 0.3 in the plate's shadows (plate value 0.05 to 0.22), gone where one period falls under 16 to 48 samples of the smear. File sizes: full 2328104 bytes, web 649571 bytes.

Checks: `out/work/mercury/place/fine/tile-view.jpg` (two by two periods, no seam), the texels view of 754 to 763 (`DIAG=texels`), the frames 754 to 763 beside the frames before.

## Plates of the place: patch-2.jpg, patch-3.jpg, patch-4.jpg (dive), patch-3r.jpg, patch-4r.jpg (rise) and the place in patch-1.jpg

Files, each in both sets (`<set>` is `full` at 4096 x 4096 and `web` at 2048 x 2048), all made by the steps of this section:

- `public/assets/mercury/<set>/patch-2.jpg`: plate of the place for the dive, 38 deg wide (steps 1 to 5, 7; generation in step 4)
- `public/assets/mercury/<set>/patch-3.jpg`: plate of the place for the dive, 19 deg wide (steps 1 to 5, 7; generation in step 4)
- `public/assets/mercury/<set>/patch-4.jpg`: plate of the place for the dive, 9.5 deg wide (steps 1 to 5, 7; generation in step 4)
- `public/assets/mercury/<set>/patch-3r.jpg`: plate of the place for the rise, 19 deg wide (steps 1 to 3 with `rise`, then 6 and 7 over the level 3 of the dive; no generation of its own, no takes)
- `public/assets/mercury/<set>/patch-4r.jpg`: plate of the place for the rise, 9.5 deg wide (steps 1 to 3 with `rise`, then 6 and 7 over the level 4 of the dive; no generation of its own, no takes)
- `public/assets/mercury/<set>/patch-1.jpg`: the first level of the pyramid, 76 deg wide, with the place in it: `python3 assets-src/mercury/place/plates.py first dive` (numbers under `first` in `plates.json`, radii from `hold` and `deg` in `src/stops/mercury/own.json`; reads `out/work/mercury/place/old/full-patch-1.jpg` and `web-patch-1.jpg`, which are `git show 27f1ba3e:public/assets/mercury/<set>/patch-1.jpg`, and the installed `patch-2.jpg`; run after `plates.py install`; no generation, no takes). Inside `hold` (15.5 to 17.5 deg from the spot) the plate is the old plate's tone at scales over `first.sigmaDeg` times the detail of `patch-2.jpg` (the plate over its own blur at that scale, taken on its lit side only), in the picture's own code values. On the side of the place's own night (the straight edge the script finds and prints) it is that calm tone times `first.night`, rising to the old plate across the ring as `patch-2.jpg` itself rises, with the faint detail of `patch-2.jpg` times `first.faint`. Outside `hold` the old picture stands; the file is coded again as a whole. With it the globe shows one ground at the place from the hold on, and `patch-2.jpg` reduced to this level's scale is this level (`python3 assets-src/shared/globe-levels.py`, 0.25 against 0.45; 1.09 before).

The three deepest levels of the patch pyramid (38, 19 and 9.5 deg wide about the spot) are plates of the place: the ground of the close view at the handover, laid back onto the sphere, in the close view's own light inside 10 deg of the spot (ring feather to 15 deg, `src/stops/mercury/own.json`). Outside the ring level 2 is the old level. The dive uses `patch-2`, `patch-3`, `patch-4`; the rise binds `patch-3r` and `patch-4r` to the same two samplers (the same levels seen from the handover of the rise, because the relief of the close view shifts fine detail by 18 texels of level 4 in the median between the two views).

All values: `assets-src/mercury/place/plates.json`. Work files: `out/work/mercury/place/` (not committed).

1. Camera: `src/stops/mercury/place.json` (`npx tsx assets-src/mercury/place/solve.ts`).
2. Source picture: the close side itself, drawn by the engine from the camera of the handover in 8 tiles, review tier, master, full, `DIAG=ungraded` (`assets-src/mercury/place/tiles.json`, `tiles.ts`, `python3 assets-src/mercury/place/tilepatch.py on dive`, render, `tilepatch.py off`; the same with `rise`; the patch is never committed).
3. Lay back: `python3 assets-src/mercury/place/plates.py lay dive` and `lay rise` (north up gnomonic plates through `mosaic.py`, with weight, stretch and ground sample distance per texel). The lay back counts as ground up to `mask.borderPx` (64) source px before the end of the terrain; nearer to its end the terrain is dark.
4. Repaint by generation of the ground around the place, through the skill named media, model seedream_5, 1:1. Prompt: `assets-src/mercury/place/prompts/repaint.txt`. Inputs per call: image 1 the lead tile `L<level>-in-<tile>.jpg` (2240 px of the 4096 px level, sent at 2048), image 2 `style.jpg` (the sharpest 1280 px of the lay back, `repaint.py style`). Five tiles per level: `tl`, `tr`, `bl`, `br` and `c` (over the place). Per level, 2 then 3 then 4: `python3 assets-src/mercury/place/repaint.py lead N`, generate the five tiles as `L<N>-<take>-<tile>.png`, `repaint.py build N '{"tl":"a3",...}'`. The lead of level 2 is the old level in the light and grade of the handover; within 8 to 14 deg of the place it is the old ground's luminance, flat fielded, matched to the place by quantiles and tinted with the place's colour, times the tone of the place at its edge spread outward (`zoneDeg`, `zoneFlatDeg`, `matchReachDeg`, `toneClamp`). The leads of levels 3 and 4 are the level above, enlarged. Inside the place the lead is the lay back. The build registers each take to its lead by flow, locks its lows to the lead (26 px), joins the tiles with 128 px seams, keeps the lead where the lead is dark (night side, `night`), and lays the unstretched lay back over the result.
5. The band, by code, no generation: `python3 assets-src/mercury/place/craters.py`, then `python3 assets-src/mercury/place/band.py lay`. `craters.py` builds a height field of a cratered plain on a 26 deg canvas about the spot at the texel of level 4 (`band.canvasDeg`, values under `craters` in `plates.json`): rolling ground, rough ground in four octaves, then craters from a seeded power law population (seed 11, cover 0.13, 3 px to 0.45 deg radius, bowl, rim, worn rim, terraces, flat floor and central peak above `complexDeg`), each stamped onto the ground it wipes. The field is lit once with the Sun of the place at each texel (direction and height from the spot, cast shadows marched along the Sun, penumbra, floor `range`) and written as a log shade. `band.py lay` puts, outside the sharp part of the place, the low tone of the place spread outward near its edge, then the low tone of the repainted level 2 (above `baseLowDeg`) plus its middle band (between `midDeg` and `baseLowDeg`, capped by `midCap`), plus the crater shade, times the dusk by the Sun's height. The craters thin out between `reachDeg` (a 4 norm of the tangent degrees from the spot) and end at `fadeDeg`, where the fine detail of the repainted level 2 takes over; levels 3 and 4 show no repainted detail outside the place. Inside the stretched part of the place the field only fills, octave by octave, the detail the lay back lacks (`fillDeg`, `fillWindowDeg`). Output `B<N>.npy`, views `B<N>-view.jpg`. Where the place ends at the end of the terrain (`band.spill`): the plate holds the lay back to that end, and outside it ground copied from `shiftDeg` (1 degree) further in, moved by whole px, led over to the lay back by a membrane in a gamma 2.4 space (`cap`, `reachDeg`, first px exact by `nearPx`), fading into the band between `fadeDeg`. The junction of lay back and copy is a minimum cut (`band.py seam`, scipy `maximum_flow` on the px graph of level 4) between the end of the place and the outer edge of the place picture of the handover (`kept`: the T frame plus `keepPx`, in frame px left, right, bottom, top; `frame` is the film frame and its field of view), at most `seam.roomDeg` inside the place; the cost of a cut edge is `seam.length` plus `seam.scale` times the difference of lay back and copy. It is found at level 4, written as `seam-<kind>.npy` and used by every level, so the levels are laid from 4 down. The copy runs along the whole side of the field where the lay is stretched under `spill.elong` (5.5 to 8) and it does not lie under the picture inside the field. At the far end the picture goes over into the band where the stretch passes `spill.farElong` (3.5 to 8). Where the stretch at the edge is above `spill.join.elong` (3.0 to 4.5) the picture dissolves into the copy over `join.deg` (0.4 deg) inside the edge, soft over `join.softDeg`, and the membrane is off there. On an 8 GB machine run one level per process: `band.py lay 4`, `lay 3`, `lay 2`, `band.py rise 4`, `rise 3`.
6. Rise: `python3 assets-src/mercury/place/band.py rise`: the lay back of the rise over `B3`, `B4`, tone matched at its edge, only where the rise lay has weight (`repaint.layWeight`). Output `B3r.npy`, `B4r.npy`. Two steps hold for the rise only. The fan (`band.spill.fan.rise`): where the copy has no source one `shiftDeg` further in along its own side (a wedge at the corner of the place, outside it up to `reachDeg` and inside it up to `seam.roomDeg`), the copy is taken from `fan.shiftDeg` (1.5 deg) further in along one lead direction for the whole fill (the one of every `stepDeg`, 15 deg, with the largest summed score of nearness to the outward direction where it has a source), and along the nearest other direction only where the lead has none, the directions blended over `blendPx` plate px; the two sides' copies are weighted down to `leastSum` (1e-30, the dive keeps 1e-6), so ground between the two outward directions at the inward corner of the place takes the nearer side's copy and lacks no source; the minimum cut may then pass through that ground. A px of the place within `edgePx` of the cut that has a copy beside it stays whole place, so the plate under it does not show as a line. The apron (`band.apron.rise`): the ground under and outside the rise place (`B<N>` with its tone) is moved by `tone` (ln, per channel; measured: the median and the colour of the place within 0.75 deg of its left border less those of the band 0.9 to 2.4 deg outside it, tool `out/work/mercury/place/tell/whole.py`) and its shadows are held above the floor of the place (the `floorPct` percentile of the ln level of the rise lay at level 4, written to `apron-rise.json` and used by level 3; soft knee `soft`), both whole up to `fadeDeg[0]` from the place and gone at `fadeDeg[1]`. Run `rise 4` before `rise 3`, each alone (about 5 GB).
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

Land matte of the place picture (no picture file, no generation): the engine's place picture is the close view at the handover; its horizon rows are left to the globe by `StopSet.placeMatte`, drawn per frame by `src/stops/mercury/matte.ts` from `src/stops/mercury/matte.json` (per column the share of the picture's height where the ground begins). Make the json: dump the picture's cover in nine windows a kind, `npm run still -- --frame 742 --tier draft --diag "ungraded/dump=X,Y,alpha"` for X in 0, 1920, 3840 and Y in 0, 1080, 2160 into `out/work/mercury/place/e1/ad/X-Y/f742.png`, the same with frame 992 into `e1/ar/X-Y/f992.png`, then `python3 assets-src/mercury/place/matte.py out/work/mercury/place/e1/ad out/work/mercury/place/e1/ar`. Values: `plates.json` `matte` (window, frames, solid level, reach of the smoothing, picture size per kind, columns) and `src/stops/mercury/look.ts` `matte` (rows, band, frames). The matte is 0 at the handover frame and whole two frames from it.

The old level pictures that `plates.py plate` mixes in outside the ring: `git show 1e492e92:public/assets/mercury/full/patch-N.jpg > out/work/mercury/place/old/full-patch-N.jpg` for N 2, 3, 4.

Checks: the sheets `out/work/mercury/place/repaint/L<N>-sheet-*.jpg` (lead beside result), `B<N>-view.jpg`, the top down dive sheet (`tilepatch.py on topdown`, 12 frames, `off`), the texel view of the dive (`DIAG=texels`), the dense sheets of dive and rise, the kept frames against `out/stills`.

## Last step for every JPEG of the stop: squeeze.py

Files, both sets: `public/assets/mercury/<set>/patch-1.jpg`, `patch-2.jpg`, `patch-3.jpg`, `patch-3r.jpg`, `patch-4.jpg`, `patch-4r.jpg`, `relief-color.jpg`, `wide-color.jpg`, `wrap-color.jpg`. No generation, no takes.

What it is: the same picture in fewer bytes. `python3 assets-src/mercury/squeeze.py` writes every JPEG of both sets again with its own coefficients, entropy coded once more as a progressive file with fitted tables (`pip install mozjpeg-lossless-optimization`, version 1.3.3). No coefficient is changed, so every decoder gives the picture it gave before. The script decodes the file before and after, stops if one value differs, and writes only when the file gets smaller. A second run changes nothing.

When: after any step of any recipe of this stop that writes a JPEG into `public/assets/mercury/` (`plates.py install`, `levels.py`, `resample.py`, the wrap and the relief recipes).

Sizes (24 Nov): both sets together 97.388 MB before, 89.279 MB after, 8.109 MB less (full 74.646 to 68.600, web 22.742 to 20.679).

Checks: the script's own line per file; 22 frames of hold, dive, terrain, rise and the frame after at draft, master, full set, and 3 frames with the web set, each the same bytes of picture as before the step (`out/work/mercury/place/tools/same.py`).
