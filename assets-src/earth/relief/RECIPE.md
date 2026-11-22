# Earth terrain relief: recipe

Source view: `references/approved/earth-close.jpg` (2816 x 1584). All paths are repo paths. Scripts are in `assets-src/earth/relief/` and run from the repo root with Python 3 (numpy, opencv, Pillow, scipy). Work files go to `out/work/earth/relief/` (not tracked), pictures to look at go to `out/work/earth/view/`.

## Files that ship

| File | Size, full | Size, web | What it is |
| --- | --- | --- | --- |
| `public/assets/earth/<set>/relief-ground.webp` | 8192 x 3960, lossless | 4096 x 1980, quality 93 | The sea, the land, the cloud decks and every shadow, with the towers painted out, on a canvas that reaches 640 px past the left and right edge and 396 px below the frame (at 1x). Above the horizon it holds the air minus the sky. |
| `public/assets/earth/<set>/relief-towers.webp` | 5616 x 2432, lossless, RGBA | 2808 x 1216, quality 92 | The thunderheads, colour premultiplied by alpha, box [5, 367] to [2813, 1583] of the image. |
| `public/assets/earth/<set>/relief-lift.bin` | 1404 x 608 float32, little endian | the same | How far each tower pixel stands toward the camera: distance = sea distance x (1 - lift). |
| `public/assets/earth/<set>/relief-masks.png` | 1024 x 495 | the same | R = sun glint (shimmer), G = weight of the slow drift of the cloud field (0 on the island and the banks). |
| `public/assets/earth/<set>/sky-terrain.webp` | 5632 x 3168, lossless | 2816 x 1584, lossless | The sky of the close image, see "Sky" below. |
| `public/assets/earth/<set>/relief-low.webp` | 960 x 540, lossless | the same | What the lens chain's bloom adds to the judged terrain frame, see "Bloom" below. |

`src/stops/earth/relief.json` is written by `build.py`. `src/stops/earth/relief.ts` draws it.

## Order

```
python3 tools/ml/upscale.py --in references/approved/earth-close.jpg --out out/work/earth/up/close-x2.png --width 5632
python3 assets-src/earth/relief/camfit.py
python3 assets-src/earth/relief/edgeprep.py
  (takes 3, 4, 5 below)
python3 assets-src/earth/relief/edgefit.py left right bottom
python3 assets-src/earth/relief/margincomp.py
  (take 6 below, aligned to out/work/earth/relief/edge-corners-aligned.png the same way)
python3 assets-src/earth/relief/cornercomp.py
python3 tools/ml/upscale.py --in out/work/earth/relief/strip-left.png --out out/work/earth/relief/strip-left-x2.png --width 1600
  (the same for strip-right, strip-bottom at twice their width, corner-left and corner-right)
  (plate take and matte take below)
python3 assets-src/earth/relief/platefit.py t1
python3 tools/ml/upscale.py --in out/work/earth/relief/plate-t1-aligned.png --out out/work/earth/relief/plate-t1-x2.png --width 5632
python3 assets-src/earth/relief/build.py
```

## Camera (`camfit.py`, `geom.py`, `camera-fit.json`)

- The horizon of the close image is fitted as the limb of a sphere seen by a camera of vfov 45: pitch 28.348 degrees down, altitude 0.030751 radii (196 km), sphere radius 32.5197 camera heights, horizon dip 14.03 degrees, roll -2.0 degrees. The sea is that sphere. `relief.ts` rebuilds the same rays and puts every texel at its distance on the sphere, so the judged frame shows the image exactly and any other camera sees the sea in true perspective.
- `build.py` measures the horizon again on the finished canvas (steepest rise of the blue channel per column) and stores a polynomial of degree 8 in `relief.json`: residual rms 0.55 px, max 1.57 px. Against the fitted sphere the measured horizon sits 3.71 px lower inside the image (rms 1.57).

## Generated takes

Tool for every take: `generate_image` (Perplexity Computer image generation), aspect ratio 16:9, one input image. At most six takes per asset per round.

### Asset "relief margin": six takes, round 1

| Take | Model | Input | Prompt | Result |
| --- | --- | --- | --- | --- |
| 1 | `seedream_5` | `out/work/earth/relief/margin-input.jpg` (the image set into a 3716 x 2090 canvas with magenta borders) | `margin-prompt-t1.txt` | Rejected: the frame inside was redrawn (`marginfit.py t1`: ECC 0.8921, flow inside the frame median 17.65 px). |
| 2 | `nano_banana_pro` | the same | `margin-prompt-t1.txt` | Rejected: the frame moved near its edges (`marginfit.py t2`: ECC 0.9871, flow inside median 1.32 px, in the 120 px ring inside the edges median 3.28, p90 54.61), and the whole canvas in one take leaves the borders too few pixels. |
| 3 | `nano_banana_pro` | `out/work/earth/relief/edge-input-left.jpg` (image shifted right by 704 px, left quarter magenta) | `margin-prompt-left.txt` | Kept. `edgefit.py`: ECC 0.9996, flow inside median 0.19 px, p99 1.17. |
| 4 | `nano_banana_pro` | `out/work/earth/relief/edge-input-right.jpg` | `margin-prompt-right.txt` | Kept. ECC 0.9996, flow median 0.21 px, p99 1.09. |
| 5 | `nano_banana_pro` | `out/work/earth/relief/edge-input-bottom.jpg` (image shifted up by 396 px) | `margin-prompt-bottom.txt` | Kept. ECC 0.9995, flow median 0.24 px, p99 1.09. |
| 6 | `nano_banana_pro` | `out/work/earth/relief/corner-input.jpg` (the canvas of takes 3 to 5 with the two lower corners magenta) | `margin-prompt-corners.txt` | Kept. |

- Why one edge per take: the tool returns 2752 x 1536, so a take of the whole canvas gives the borders too few pixels. One quarter of the frame per take keeps the new area at the scale of the image.
- `edgefit.py` aligns a take to its input by an affine fit (ECC) on the part both share and measures the remaining flow. `margincomp.py` corrects the low-frequency colour step at the seam, fading over 400 to 500 px into the new area, and writes the strips. `cornercomp.py` does the same for the corners. Only the new areas are used: the image itself is never replaced by a take.
- Checks: no magenta left, no second Sun, no land in the bottom strip, horizon of the side strips within 10.2 px of the fitted sphere (`build.py` prints it), no seam visible in `out/work/earth/view/relief-ground.jpg` or in film frames 1920 and 2099.

### Asset "relief plate": one take, round 1

- Take 1, kept. Model `nano_banana_pro`, input `references/approved/earth-close.jpg` (copied to a work file), prompt `plate-prompt.txt`. Output `out/work/earth/relief/plate-t1.png` (2752 x 1536): the same view with the thunderheads and their shadows painted out.
- `platefit.py t1`: ECC 0.9997 after the changed areas are masked (26 percent of the frame), affine [[1.0001, 0, -0.2987], [0, 1.0079, -6.1258]], flow where unchanged median 0.20 px, p90 0.60, p99 3.59; low-frequency colour offset of (-2.9, -0.6, -3.4) code values corrected.
- The plate redraws fine texture everywhere (mean abs difference 7.35 code values where nothing should change), so it is used only beneath the towers. Everything else on the ground is the approved image.

### Asset "relief matte": one take, round 1

- Take 1, kept. Model `nano_banana_pro`, input `references/approved/earth-close.jpg`, prompt `matte-prompt.txt`. Output `out/work/earth/relief/matte-t1.png`: the thunderheads white on black (white share 4.9 percent, grey 0.6 percent), aligned with the plate's affine.
- Checked by eye against the image in four crops: every tower outlined, no shadow and no flat cloud deck included. GrabCut and thresholds on the difference between image and plate were tried first and rejected (they took shadows and glint with them).

## `build.py`

- Canvas at 2x from the upscaled image, strips and corners. The image area is the approved pixels (upscaled), never a take.
- Towers: matte components of 300 px and more that do not touch the border; 39 groups (components of the matte dilated 13 px). Each group gets a base line (straight fit of the lowest matte pixel per column). Lift = 0.5 x (1 - reach(base) / reach(pixel)) above the base line, 0 below, capped at 0.085, blurred 3 px: the base of a tower stays on the sea and its top leans toward the camera. The cap is a tower of 16 km seen from 196 km.
- Ground beneath the towers: the clean plate plus a membrane (the difference image minus plate, solved as a Laplace problem from 10 px outside the matte), blended in between 10 and 6 px outside the matte, so nothing of a tower and no step is left under it. The shadows on the sea stay in the ground from the image.
- Tower colour = image minus (1 - alpha) x ground, in scene linear light, so the two layers put together give the image back: mean abs 0.003, max 4 code values (quantisation).
- Above the horizon the ground holds the air minus the sky, where the sky is the running minimum from the top of the star-free image. The limb glow rides with the ground, the sky comes from the sky patch, and the two add up to the image at the judged frame.
- Masks: glint from the plate's luminance (105 to 190) off the land; drift weight 0 inside the hand-drawn polygon `LAND` (island and banks, 70 px blur), 0 near the horizon, falling with distance.

## Motion (`relief.ts`, `look.ts`)

- Parallax comes from the geometry: the sea is a sphere, the towers stand off it. No layer is scaled or cross-faded.
- Cloud field and tower layer drift together by `drift` px per second times the G mask, the glint shimmers by a noise term times the R mask. Both are closed forms of film time and both are zero at the judged frame.

## Sky (`assets-src/earth/sky/patch.py terrain STILL`)

- Output `public/assets/earth/<set>/sky-terrain.webp`. Inputs: the close image and a still of the film at frame 2010 with a black sky (`sky.json` terrain gain set to 0 for that one render, review tier: `out/work/earth/still/terrain-nosky.png`).
- Patch = close image minus that still, in scene linear light, from 100 px above the horizon upward. Nearer the horizon and below it the patch holds the value found 70 px above the horizon, because the sky slides about 108 px against the ground over the segment.
- Margin 50 percent on every side (25 percent until 08:05 UTC: the rise pitches up 11 degrees and showed the engine's sky with the band of the Milky Way beside the Sun above the patch at 2116 to 2122). Left and right: the outer quarter of the image mirrored twice, so the Sun's glow is not repeated at the ends. Below: held. Above the top edge the glow of the Sun is continued by a power law around the Sun's place in the frame (0.251 frame half-heights above the top edge, 0.083 half-widths left of centre), fitted to the image per channel (powers 2.39, 2.05, 1.94), capped at 3.
- Stepping in the dark sky (Phase 6 item 8). The close image's dark blue sky carries mottling of 16 to 64 px (rms 0.5 to 0.7 code values about a smooth trend) under pixel noise of rms 1.5, which reads as tone steps at gain. `deband` keeps every pixel's own noise and every star (points 2.5 to 6 code values above their surround, grown by 5 px, are left out of every mean) and moves only the local mean toward a smooth trend: Gaussian 32 px, twiced twice so curvature is kept, by at most 2 code values, where the sky is dark (code under 0.3 to 0.5) and more than 110 to 220 px above the horizon. The 8 bit write there is dithered with seeded noise of one code value (seed 20101), so moves below one code value survive.
- Margin, second take (Phase 6 polish, after the sky agent's finding on mirrored margins and the Builder's round 11 rule: no mirrored copy outside the approved border, inside it nothing changes). The image region of the patch (columns 1408 to 4224, rows 792 to 2376 of the full file) and everything below it are byte equal to the first take.
  - Left and right (`untwin`): the mirrored fill keeps its level and its grain, and its points are taken out: found with two differences of Gaussians in code space (0.7 and 4 px at 4 to 8 code values, mask grown 5 px, 11 px for points 5 times brighter; 1.5 and 6 px at 1.6 to 2.4 code values, mask grown 7 px, for soft points), replaced by the local base plus the grain found 37 rows away. The image's own points are put in translated instead of mirrored (the left margin takes them from image column (col - 1408 + 704) mod 2816, the right margin from (col - 4224 - 704) mod 2816, so no point has a copy nearer than 704 px), faded in over 8 to 16 px from the border. Only in the sky above the held rows. 499 points taken out.
  - Top: the power law of the Sun's glow is referenced to row 6, the centre of the band it is fitted to (it was row 0.5, which left a step of 3 code values in the glow). The narrow ray under the Sun is kept as the ratio of the 4 px to the 24 px blur of the top band inside 110 to 170 px of the Sun's column and carried up as a cone toward the Sun's place, faded out 90 to 30 px below it; before, it ended at the border in a line (step 11 code values). The column structure of the band is eased toward a 64 px blur over 120 rows.
  - Grain: the top margin had none. Seeded noise (`np.random.default_rng(SEED + 1)`, Gaussian 0.7 px, 92 percent shared between the channels) with amplitude `0.63 + 0.232 ln(level)` code values (level clipped to 4 to 130), fitted to the image's own grain by level: image rows 0 to 150 against margin rows -150 to 0, high pass 2 px, 1.00 and 0.99 at level 4 to 10, 1.25 and 1.26 at 20 to 40, 1.60 and 1.53 at 100 to 130.
  - Checks: image region 0 pixels differ; step at the top border per 32 px band from max 11.0 (rms 1.58) to max 2.1 (rms 0.62); pixels over 2.5 code values on both sides of the border axis within 400 px: left 810 of 838 before, 24 after; right 579 of 603 before, 18 after. The approved image's first two rows are about 0.6 code values darker than its third: that hair line at the border is inside the approved image and stays. The top margin stays without stars.
  - Files: full 5632 x 3168 lossless 4.54 MB (sha 78b87df3), web 2816 x 1584 1.17 MB (sha 72729536); the first take was 3.41 and 0.78 MB (8203c9ac, df903ae6).
  - Kept: this take, the only one made for the shipped file (four scratch versions under `out/work/earth/pb/t/` came first; version 4 is this recipe). Proved in the film on main 6e46f06 with engine batches 21 and 22: frames 2060, 2099, 2112 at the review tier: inside the approved border at most 1 level moves in 0.2 percent of the pixels (the lens chain's bloom of the changed margin), the twin star at the left border (frame 2099, film px (10, 212) beside (55, 211)) is gone, the ray under the Sun no longer ends in a line at the top border; `python3 tools/assets/mirrorcheck.py` clean on 1921, 2060, 2099, 2112, 2125. The engine's `unfold` flag does not reach this margin (it acts within `edge` of the patch's outer side) and is not set.
  - Judged frames at the final tier on main 8780b3c (engine batches 21 and 22), before against after: 1755 equal (da369901). 2010 from 6abe0501 to 60eb68c0: 1,727 of 2,073,600 pixels differ. Row 0: 1,280 pixels, 1,163 of them by 1 level, 28 by more than 2 (x 741, 819, 832 to 833, 868 to 895), 7 by 4 (x 880 to 890): the top row of the frame is filtered across the border and takes a share of the first margin texels, most where the ray under the Sun now runs on above the border. Row 1: 244 pixels by 1 level. Rows 2 to 199: 203 pixels by 1 level (the lens chain's bloom). Nothing below row 199, nothing in columns 0 and 1919 but one pixel each of rows 0 and 1.
- Check: `python3 assets-src/earth/relief/judged.py STILL` (film minus close image per region, code values).

## Bloom (`assets-src/earth/relief/low.py [--out DIR] [--check STILL]`)

- Output `public/assets/earth/<set>/relief-low.webp` and the key `low` in `src/stops/earth/relief.json`. Input: the close image only. No generation.
- The lens chain mixes every frame with its own bloom (the mean of six pyramid levels, strength 0.08). On the judged terrain frame that pulled warm cloud light into the blue sea and the cloud shadows and took the bright cloud down (Phase 6 item 8, measured in `NOTES.md`). `low.py` emulates the chain's pyramid in numpy (13 tap down, tent up, six levels, mean) on the close image at 1920 x 1080 in scene light with the lens term, and writes that low pass. The ground and tower shaders take it out before the chain adds it: `c = (c - s low) / (1 - s)` with `s` the shot's bloom strength, so the frame after the chain is the close image again. With the map taken out the emulated frame returns the close image within mean 0.054, p99 0.47 code values.
- The term follows the canvas, so it is exact at the judged frame and an approximation as the camera moves on; `look.ground.bloom` scales it (1).
