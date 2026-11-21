# Mercury dive patches recipe

Four nested, north-up gnomonic colour patches about the dive spot (`lon 14.47205059`, `lat -13.87220011` in the body frame; hero frame `(0.5144, 0.65436)`), which is the ring crater of the approved orbit image and the terraced crater of the approved terrain image. The globe shader blends each level in where its parent drops under about one texel per pixel, with a feather of 0.12 of the patch width.

- `public/assets/mercury/<set>/patch-1.jpg` (`public/assets/mercury/full/patch-1.jpg` at 4096 x 4096, `public/assets/mercury/web/patch-1.jpg` at 2048 x 2048): 76 degrees wide.
- `public/assets/mercury/<set>/patch-2.jpg` (`public/assets/mercury/full/patch-2.jpg` at 4096 x 4096, `public/assets/mercury/web/patch-2.jpg` at 2048 x 2048): 38 degrees wide.
- `public/assets/mercury/<set>/patch-3.jpg` (`public/assets/mercury/full/patch-3.jpg` at 4096 x 4096, `public/assets/mercury/web/patch-3.jpg` at 2048 x 2048): 19 degrees wide.
- `public/assets/mercury/<set>/patch-4.jpg` (`public/assets/mercury/full/patch-4.jpg` at 4096 x 4096, `public/assets/mercury/web/patch-4.jpg` at 2048 x 2048): 9.5 degrees wide.

The patches are unlit colour in the same sense as the wrap: they carry the wrap's baked relief shading (Sun 53 degrees clockwise from north, toward the upper right, elevation 5.02 degrees at the spot) and the shader multiplies its own light on top. `full` is JPEG quality 94, 4:4:4; `web` is the Lanczos half of `full`, same quality.

## Scripts

- `assets-src/mercury/patches/resample.py` (from the Mars patches): `to-patch` (equirectangular map to gnomonic patch), `subpatch` (exact child patch of a parent), `nest` (finer patch into its parent with a feather).
- `assets-src/mercury/patches/levels.py`: the whole pipeline, one level at a time.
- `assets-src/mercury/patches/patches.json`: spot, Sun, widths, file names, the level 4 centre tile origin (`centre`) and the crater placement (`crater`). Written by `out/work/mercury/dump-spot.ts` (spot and Sun from `src/stops/mercury/plan.ts` and `fit.json`) and edited by hand for `centre` and `crater`.
- `assets-src/mercury/patches/close.py`: the approved terrain image rectified into a north-up patch about the spot. A layout guide only (it showed that the terraced crater is the hero's ring crater); none of its pixels ship.

## Steps

The wrap the shipped patches were cut from is the wrap of commit 085dae7 (md5 6ebf15b48692), from before the terminator rework of the wrap. Get it with `git show 085dae7:public/assets/mercury/full/wrap-color.jpg > out/work/mercury/wrap-parent.jpg` and run every `levels.py` step with `PATCH_WRAP=out/work/mercury/wrap-parent.jpg` in the environment. Why the old wrap: see "Parent wrap" under Checks.

For level N from 1 to 4:

1. `python3 assets-src/mercury/patches/levels.py cut N`. The parent of level 1 is `public/assets/mercury/full/wrap-color.jpg` resampled to a 76 degree patch at 4096 and cleaned with a 7 px median (the wrap's dotted noise along the terminator otherwise comes back as dots). The parent of level N is level N-1's exact subpatch. Five overlapping 2240 px tiles are cut and written at 2048: four corners (`tl tr bl br`) and one centre tile (`c`) so no seam crosses the middle. The level 4 centre tile is moved onto the crater (`centre: [0.62, 0.55]`).
2. Generate each tile: model `seedream_5`, aspect 1:1, input images `[out/work/mercury/patches/LN-in-K.jpg, out/work/mercury/tiles/style.jpg]` (image 2 is the style tile of the wrap recipe, `assets-src/mercury/wrap/RECIPE.md`), prompt `assets-src/mercury/patches/prompts/patch.txt`. Output `out/work/mercury/patches/LN-TAKE-K.png` (2048 x 2048).
3. `python3 assets-src/mercury/patches/levels.py flow N TAKE` prints the optical flow between each take and its input at 1024 px. A take is kept when its median is under about 2.5 px (a uniform shift up to 6 px is removed by the registration); a take that redraws the layout is rejected.
4. `python3 assets-src/mercury/patches/levels.py build N '{"tl": "TAKE", "tr": "TAKE", "bl": "TAKE", "br": "TAKE", "c": "TAKE"}'`: each take is resized to 2240, registered to its input by a blurred optical flow (sigma 24 px at 1024), its low frequencies are locked to the parent in the log domain (sigma 26 px), the corners are blended over 128 px seams, the centre tile is laid on top with a 200 px feather. Writes `out/work/mercury/patches/LN.png`.

Then `python3 assets-src/mercury/patches/levels.py finish` nests level 4 into 3, 3 into 2, 2 into 1 (feather 0.12) and writes the eight shipped files.

## Prompts

`prompts/patch.txt` (every tile unless noted):

```
Image 1 is a soft, low-detail, straight-down map tile of the surface of the planet Mercury near its day and night line. The Sun is very low, toward the upper right. Image 2 is a finished, sharp map tile of another region of the same planet in the same straight-down view: it is the look to match.
Repaint image 1 at the same framing so that it has the surface look of image 2: crisp, densely cratered ground with sharp crater rims, a thin bright sunlit wall on the lower left inside of each crater and a small dark shadow under its upper right rim, chains of tiny secondary craters, wrinkle ridges, scarps and smooth plains, with fine sharp natural detail everywhere, as if seen at four times the resolution of image 1. Smooth, featureless or noisy areas of image 1 become finely cratered ground of the same brightness and color.
Keep the layout of image 1: every crater, basin, ridge and every pale, tan, blue, grey or dim region stays in the same place with the same size and shape. Keep the brightness and the color of every region as it is in image 1. Do not move, add or remove any large feature, and do not add any large new ray crater.
No soft, blurred or hazy patches, no blotchy or camouflage patterns, no dotted or checkered noise, no stars, no space, no planet edge, no text, no border, no frame. Output the same square tile.
```

`prompts/ray.txt` (appended to `patch.txt` for the level 1 `tr` tile, whose bright ray crater the model kept moving):

```
The large bright ray crater near the top edge of image 1 stays exactly where it is, at the same distance from the top edge and the same size; nothing in the tile is shifted, zoomed or re-centered.
```

`prompts/crater.txt` (appended to `patch.txt` for the centre tile of level 3 take `a1` and of level 4, with `out/work/mercury/patches/crater-ref.jpg`, a crop of the crater from `references/approved/mercury-close.jpg`, as image 3):

```
The large crater just right of the centre of image 1 is a complex impact crater. Give it terraced inner walls that step down in three or four concentric ledges with slump blocks, a flat floor and a small cluster of central peaks. Its upper right inner wall and the floor under that wall lie in deep shadow, and its lower left terraces catch the low Sun. Image 3 is a low oblique photograph of this same crater, for its character only: the view stays straight down as in image 1, and the crater keeps the place, size and outline it has in image 1.
```

## Takes

| level | tile | kept | flow median px at 1024 | rejected |
| --- | --- | --- | --- | --- |
| 1 | tl | a2 | 0.70 | a1 (inputs not cleaned: dotted noise) |
| 1 | tr | a4 (`ray.txt`) | 5.25, near uniform, removed | a1 (13 px shift), a2 (39 px shift), a3 |
| 1 | bl | a2 | 0.35 | a1 |
| 1 | br | a2 | 0.84 | a1 |
| 1 | c | a2 | 0.84 | a1 |
| 2 | tl tr bl br c | a1 | 0.93, 2.12, 0.80, 1.16, 2.18 | none |
| 3 | tl tr bl br | a1 | 0.75, 0.59, 1.18, 0.57 | none |
| 3 | c | a2 from `L3-in2-c.jpg` | 0.67 | a1 as a tile (see below) |
| 4 | tl | a2 | 0.31 | a1 (layout redrawn, 67 px), a3 (0.33, spare) |
| 4 | tr bl | a1 | 0.42, 0.38 | none |
| 4 | br | a2 | 0.39 | a1 (copied the style tile, 30 px), a3 (0.80, spare) |
| 4 | c | a1 (`crater.txt`, image 3) | 0.60 | none |

## The terraced crater

The level 3 centre take `a1` (`patch.txt` and `crater.txt`, image 3) drew the terraced crater with the right character but 2.3 times too large (flow p99 22.7 px). `python3 assets-src/mercury/patches/levels.py crater 3` scales that crater into the ellipse of the ring crater in the level 3 centre input and writes `out/work/mercury/patches/L3-in2-c.jpg` (`patches.json` `crater.3`: source centre and half axes `[1172, 1078, 552, 518]`, target `[1388, 1153, 245, 200]`, in 2048 px; feathered from 1.02 to 1.32 of the target ellipse). Take `a2` is generated from that input with `patch.txt` alone and is built with `"c": "a2@in2"`, which registers and locks it against `L3-in2-c.jpg` instead of the parent. Level 4 is cut from the finished level 3, so its centre tile already holds the crater at the right size and `crater.txt` only adds detail.

## Checks

- Parent wrap. The current wrap codes the sunlit rims of the terminator band as colour above 1, which the shader's dusk term turns back into the hero's pixel. Two rebuilds of the four levels from the current wrap with the stored takes were rendered at frame 731 (draft) beside the shipped set and beside the wrap alone (`out/work/mercury/j5/f731-three-a.jpg`): locked in the colour domain the rims came out saturated orange and red; locked in the shown domain (colour as the shader shows it from the hero's side) they came out dimmer and still orange. The shipped set, cut from the wrap of 085dae7, shows thin pale gold rims as the approved orbit image does at the spot (`out/work/mercury/j5/hero-spot-a.jpg`), so it stays. Outside the terminator band both wraps are the same picture.

- Disk after `finish`: `public/assets/mercury/full` 88 MB, `public/assets/mercury/web` 26 MB.
- The patches show only where the wrap is magnified. With `fade: [1.02, 1.95]` in `src/stops/mercury/assets.ts` (wrap texels per pixel where level 1 is fully in and fully out) level 1 comes in over about frames 705 to 731 of the dive and leaves over 1004 to 1011 of the rise at 1080p; the hold (2.06 to 2.12 texels per pixel) shows the wrap alone.
