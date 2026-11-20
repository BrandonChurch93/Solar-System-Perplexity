# Mars terrain relief: recipe

Source view: `references/approved/mars-close.jpg` (2816 x 1584). Every file below is rebuilt by the scripts in this folder, run from the repo root in this order:

```
python3 tools/ml/upscale.py --in references/approved/mars-close.jpg --out out/work/mars-upscaled.png --width 5632
python3 tools/ml/checkmoved.py --a references/approved/mars-close.jpg --b out/work/mars-upscaled.png --heatmap out/work/mars-flow.jpg
python3 tools/ml/depth.py --in references/approved/mars-close.jpg --out-prefix out/work/mars-depth
python3 assets-src/mars/relief/camfit.py
python3 assets-src/mars/relief/fitdepth.py
python3 assets-src/mars/relief/cutpaths.py
python3 assets-src/mars/relief/masks.py
(paint takes, see below)
python3 assets-src/mars/relief/paintcomp.py
python3 tools/ml/upscale.py --in out/work/paint-comp-2816.png --out out/work/paint-comp-5632.png --width 5632
(margin takes, see step 6)
python3 assets-src/mars/relief/marginfit.py t1
python3 assets-src/mars/relief/margincomp.py half t1
python3 assets-src/mars/relief/marginfit2.py
python3 tools/ml/upscale.py --in out/work/ext-2816.png --out out/work/ext-5632.png --width 6984
python3 assets-src/mars/relief/margincomp.py full
python3 assets-src/mars/relief/marginprep.py
MARGIN=1 python3 assets-src/mars/relief/build.py
python3 assets-src/mars/relief/makejson.py 1
python3 assets-src/mars/relief/flowmasks.py
python3 assets-src/mars/relief/maskext.py
python3 assets-src/mars/relief/fillfix.py
python3 assets-src/mars/relief/zorder.py
python3 assets-src/mars/relief/zcheck.py full
python3 assets-src/mars/relief/zcheck.py web
python3 assets-src/mars/relief/test.py identity
python3 assets-src/mars/relief/test.py sweep 1408 0.1,0.15,0.2,0.25,0.3 1
python3 assets-src/mars/relief/test.py sweep 1408 0.1,0.15,0.2,0.25,0.3 -1
```

Without `MARGIN=1` and without `maskext.py` the same scripts build the base set with no margin (the first commit on this branch).

`<set>` below is `full` (5632 x 3168 master) or `web` (half linear size, area downsample of `full`; dist maps downsampled in log space).

## Step 1: upscale

- Output: `out/work/mars-upscaled.png` (5632 x 3168), not shipped, it is the color source of every layer.
- Tool and model: `tools/ml/upscale.py`, Swin2SR lightweight x2 (ONNX, pinned in `tools/ml/MODELS.md`).
- Input: `references/approved/mars-close.jpg`.
- Prompt: none (not a generative tool).
- Take: one, kept. No image model detail pass was run on top, the plain upscale already passes and any detail pass would risk moving features.
- Checks (`tools/ml/checkmoved.py`, approved vs upscale): PSNR 50.635 dB, SSIM 0.998559, flow median 0.0055 px, p99 0.0278 px, max 0.4328 px. PASS (p99 limit 1.5 px).

## Step 2: camera and ground model

- `assets-src/mars/relief/camfit.py` writes `assets-src/mars/relief/camera-fit.json`. Assumes vfov 60 deg. Nine horizon points read off the knee of the haze profile (2816 px): (100,360) (400,348) (700,344) (1000,340) (1300,336) (1600,336) (2000,336) (2400,348) (2800,364). The curvature of that line gives a sphere below the camera.
- Result: pitch -21.03 deg (looking down), roll 0.037 deg, horizon dip 2.598 deg, sphere radius 972.27 camera heights, horizon distance 44.108. Fit residuals all under 0.14 deg.
- Units: camera height above the rim plateau = 1. Distances are along the pixel ray from the image camera.

## Step 3: depth and distance

- Tool and model: `tools/ml/depth.py`, Depth Anything V2 Small (ONNX, pinned in `tools/ml/MODELS.md`). Input `references/approved/mars-close.jpg`, output `out/work/mars-depth.raw` (2816 x 1584 relative inverse depth).
- `fitdepth.py` fits dist = 1 / (a * depth^g + b) with b = 1 / horizon distance against ray to ground distances on four flat regions, writes `assets-src/mars/relief/depth-curve.json`: a = 0.40320, g = 0.63612, b = 0.022671. Region median ratios of fitted to ground model distance: near plateau 1.003, right mesa top 1.153, far plain left 0.732, far plain middle 1.131. All distances are capped at the horizon distance 44.108.

## Step 4: cuts

- `cuts.json` holds the hand placed waypoints of the two cuts and the mist zone. `cutpaths.py` runs a least cost path between the waypoints on a color and depth edge cost and writes `out/work/cutpaths.json`. `masks.py` turns them into layer regions, distance to cut maps and the paint mask, and writes the paint input `out/work/paint-input.png` (approved image with the region to paint flat magenta).
- `build.py` grows each cut outward by up to 9 px (2816 scale) over lit rock pixels that touch the cut and are brighter than the nearby background by 14 levels, so no lit ledge is split between two layers (a split ledge showed as a doubled edge when the camera moved). The thin strip behind the grown edge in L0 is filled from the background around it.

## Step 5: painted ground behind the cuts (image tool takes)

Tool and model for every take: image generation, `nano_banana_pro`, 16:9, output about 2752 x 1536, resized to 2816 x 1584 with Lanczos. Four takes used in total, limit 6.

Take t1, rejected.
- Inputs: `out/work/paint-input.png`, `references/approved/mars-close.jpg`.
- Prompt: exactly the text of `assets-src/mars/relief/paint-prompt-t1-t2.txt`, which reads:
  "Image 1 is a film frame of the canyons of Mars in which two areas are painted flat magenta. The rock that stood there has been removed for good and must not come back. Fill only the magenta areas with the ground that lies behind and below where that rock stood, as the same camera would see it from the same place: in the large lower left area, the deep canyon continues to the left and toward the viewer: the base of the far canyon wall runs on to the left at the top of the area, and below it shadowed stone benches, scree aprons, low ridges and the dark canyon floor with thin irregular sheets of dust mist, all far below the camera, reaching the bottom and left edges of the frame. In the smaller upper right area, the far canyon wall and the hazy canyon floor continue behind where the end of a mesa stood. The new ground meets the untouched pixels at the edge of each area without any seam, matching the features that touch the edge. Image 2 is a crop of the same frame and sets the style: match its grade, low raking light from the right, cool deep shadow, rust and burgundy palette, fine strata and film grain exactly. Every pixel outside the magenta areas stays exactly as it is in image 1: same layout, same features in the same places, same horizon and framing, no shift, no zoom, no crop. Do not draw any near cliff, escarpment, plateau or mesa in the magenta areas. No magenta left anywhere. No text, watermark, border, logo, people, vehicles or extra objects. 16:9."
- Why rejected: with the full frame as image 2 it put the near escarpment back into the magenta area.

Take t2, kept for the large area behind L1.
- Inputs: `out/work/paint-input.png`, `out/work/style-crop.png` (crop of `references/approved/mars-close.jpg`, x 1216 to 2816, y 400 to 1300, no escarpment in it).
- Prompt: same text as t1 (`paint-prompt-t1-t2.txt`).
- Why kept: no escarpment returned, no magenta left, the ground continues the canyon floor and the far wall base. Only masked pixels are used, so anything the take changed outside the mask is discarded; features at the mask edge line up with the untouched pixels at native size.

Take t3, rejected (band behind L2).
- Inputs: `out/work/paint2-input.png` (crop of `references/approved/mars-close.jpg`, x 1296 to 2096, y 380 to 830, scaled x2, magenta where the mesa stood within 200 px of the L2 cut), `out/work/style-crop2.png` (crop of the approved image, x 700 to 1500, y 330 to 780).
- Prompt: exactly the text of `assets-src/mars/relief/paint-prompt-t3.txt`:
  "Image 1 is a crop of a film frame of the canyons of Mars with one area painted flat magenta. The dark mesa that stood in that area has been removed for good and must not come back. Fill only the magenta area with what lies behind where it stood, far from the camera: the far canyon wall seen at the upper left of image 1 continues to the right across the area, with its fluted gullies, pale lit ledges and soft haze, and below it the hazy canyon floor with thin low sheets of dust mist continues to the right. It is all far away, so it is softer and paler than the near rock, exactly like the far wall at the upper left. The new ground meets the untouched pixels at the left and top edges of the area without any seam. Image 2 is another crop of the same frame and sets the style: match its grade, light, haze, palette and film grain exactly. Every pixel outside the magenta area stays exactly as it is in image 1: same layout, same features in the same places, same framing, no shift, no zoom, no crop. Do not draw any dark mesa, near cliff or slope in the magenta area. No magenta left anywhere. No text, watermark, border, logo, people or extra objects. 16:9."
- Why rejected: it copied the style crop into the area instead of continuing the wall.

Take t4, kept for the band behind L2.
- Input: `out/work/paint2-input.png` only (it is itself a crop of the approved image, so the approved image is the style to match).
- Prompt: exactly the text of `assets-src/mars/relief/paint-prompt-t4.txt`, which is t3 with the image 2 sentence replaced by "Match the grade, light, haze, palette and film grain of the rest of image 1 exactly."
- Why kept: the far wall continues across the band with no mesa returned. Its tone came out a little dark, so `paintcomp.py` applies a Lab mean and standard deviation transfer from a ring of untouched background around the band, then blends it in with a feathered membrane offset so the edge of the band has no step.

`paintcomp.py` writes `out/work/paint-comp-2816.png` and the blend weight `out/work/paint-w.npy`; the composite is upscaled with the same upscaler as step 1 to `out/work/paint-comp-5632.png`. Painted pixels are only placed where L1 or L2 is opaque in the image camera, so the image camera never sees them.

## Step 6: margin (image tool takes)

The canvas is extended by 12 percent of the image width on the left and on the right and by 12 percent of the image height at the bottom: 338 px left and right and 190 px at the bottom at 2816 scale, 676 and 380 px in the full set. Nothing is added at the top. Margin takes used: 2, limit 6. Tool and model for both: image generation, `nano_banana_pro`, 16:9, output 2752 x 1536.

Take t1, kept for the left margin, the bottom margin and as the base of the right margin.
- Input: `out/work/margin-input.png`: `references/approved/mars-close.jpg` at 2816 x 1584 placed at x 338, y 0 of a 3492 x 1964 canvas, the rest flat magenta, sent shrunk into the 16:9 frame. The approved image is the style to match and is inside the input.
- Prompt: exactly the text of `assets-src/mars/relief/margin-prompt-t1.txt`.
- `marginfit.py t1` resizes the take back to 3492 x 1964 and fits it to the approved image with an affine ECC on the inner frame (rows 400 down, the sky is cut anyway): ECC 0.977. Residual optical flow against the approved image inside the frame: median 0.43 px, p99 3.22 px; in a 60 px ring at the left, right and bottom edges: median 0.31 px, p99 3.67 px. No feature moved, appeared or vanished at the edges.
- Why kept: the escarpment, its striated face, the scree and the far plain continue outward at the same scale and light, no magenta left, no text or objects.

Take t2, kept for the right margin from y 600 to y 2124 (full set).
- Input: `out/work/margin-input-t2.png`: crop of `references/approved/mars-close.jpg`, x 1800 to 2816, y 300 to 1062, at the left of a 1354 x 762 canvas with flat magenta on the right 338 px. This is a higher resolution pass on the right edge only, because t1 at native size showed a vertical seam in the bright plateau above the mesa: its dune streaks did not continue the original ones and its margin was softer.
- Prompt: exactly the text of `assets-src/mars/relief/margin-prompt-t2.txt`.
- `marginfit2.py` resizes the take to 2708 x 1524 (full scale) and fits it to `out/work/mars-upscaled.png` with an affine ECC: ECC 0.998. Residual flow inside the crop: median 0.05 px, p99 1.92 px; in the 120 px ring at the right edge: median 0.04 px, p99 2.70 px, mean abs color difference 4.2 levels.
- Why kept: the plateau streaks, the bright ledges and the mesa rim continue across the edge at native size with no seam.

Composite (`margincomp.py`):
- Half scale (`half t1`): the aligned take is warped by the optical flow measured in a 4 to 48 px band inside the frame edge, pushed outward and decayed to 0 over 400 px, so features that touch the edge line up. Then the approved pixels are pasted back untouched. The difference between approved and take along the frame edge is continued into the margin twice: a low frequency part (blur 42 px) faded out over 336 px, and the full difference as a half plane Poisson extension faded out over 42 px (1.5 percent of the width). Both live only in the margin, never on original pixels. Small bright specks in the margin (white top hat above 18 levels, 12 px or smaller, 66,504 px in total) are replaced by a 7 px median. Output `out/work/ext-2816.png`.
- Upscale: `tools/ml/upscale.py` (same model as step 1) to `out/work/ext-5632.png`, 6984 x 3548.
- Full scale (`full`): take t2 is pasted over the right margin from y 600 to y 2124 with a 120 px smoothstep feather on its top, bottom and left edges (the left edge lies inside the original frame, where it is replaced by the original pixels anyway). Then the same two part membrane at 16 px against `out/work/mars-upscaled.png`, and the original upscale is pasted back untouched. Output `out/work/ext-full.png`, the color source of the margin. Its right margin is also downsampled back into `out/work/ext-2816.png`.
- Cuts (`marginprep.py`, `margin-cuts.json`): the L1 cut runs on past the bottom edge through waypoints (2000,1583), (2030,1640), (2080,1700), (2120,1773) at 2816 scale on the same least cost path as step 4; the L1 region takes in the left and bottom margin under the escarpment; the L2 region runs on to the right edge of the margin.
- Distance in the margin: the log ratio of the fitted distance to the ground model is copied outward from the nearest frame pixel of the same region (L1 region and the rest kept apart), then blurred by 6 px with a smoothstep blend over 24 px, and added back to the ground model for the margin rays; capped at the horizon distance. `build.py` then makes each layer's own distance continuous across the frame edge (nearest edge offset, faded over 40 px). Under the L1 margin, L0 gets a push pull fill of color and distance.
- Masks (`maskext.py`): the inner masks from `flowmasks.py` are continued outward from the nearest edge pixels, blurred 8 px, blended over 24 px; R stays 0 in the margin (no mist there).

## Shipped files

All written by `assets-src/mars/relief/build.py` with `MARGIN=1` unless noted. Inputs: `out/work/mars-upscaled.png`, `out/work/ext-full.png`, `out/work/paint-comp-5632.png`, `out/work/logd-ext.npy`, `out/work/cutpaths-ext.json`, `assets-src/mars/relief/cuts.json`, `assets-src/mars/relief/margin-cuts.json`, `out/work/paint-wm-ext.npy`, the region and distance to cut maps written by `marginprep.py`. Tool: the scripts in this folder (numpy, OpenCV, SciPy), no model beyond the ones named in steps 1, 3, 5 and 6. Boxes are in full set pixels of the close image, so they may start at negative x and run past 5632 x 3168.

- `public/assets/mars/<set>/relief-L0-color.jpg` (JPEG q94), `public/assets/mars/<set>/relief-L0-alpha.png`: the far layer, box x -676, y 0, w 6984, h 3548. Upscaled image and margin, with the painted ground under L1 and L2. Sky cut: alpha is a smoothstep from 0 at 110 px (full) above the horizon line to 1 at 10 px below it. In the band above the horizon a morphological opening (11 px disk) and a wide horizontal blur replace the image, so no star or bright speck survives.
- `public/assets/mars/<set>/relief-L1-color.jpg`, `public/assets/mars/<set>/relief-L1-alpha.png`: the near escarpment at lower left, box x -676, y 1080, w 4920, h 2468.
- `public/assets/mars/<set>/relief-L2-color.jpg`, `public/assets/mars/<set>/relief-L2-alpha.png`: the right mesa, box x 2784, y 836, w 3524, h 1088. Its top edge is soft, it joins the far plateau.
- Edges of L1 and L2: alpha is a 2 to 3 px antialiased edge along the cut. Color outside the opaque core is replaced by the nearest core color, so there is no background fringe. On the soft side of each edge the layer color and the L0 color under it are solved so that the composite equals the upscaled image to 8 bit precision.
- `public/assets/mars/<set>/relief-L0-dist.bin`, `public/assets/mars/<set>/relief-L1-dist.bin`, `public/assets/mars/<set>/relief-L2-dist.bin`: raw little endian float32, row major, half the layer pixel size (full set: L0 3492 x 1774, L1 2460 x 1234, L2 1762 x 544; web set: half again). Behind each cut L0 holds the background distance pushed in from outside the cut; each upper layer continues its own surface past its edge. Ranges: L0 3.49 to 44.11, L1 2.13 to 6.22, L2 5.73 to 16.45.
- `public/assets/mars/<set>/relief-masks.png` (full 3492 x 1774, web 1746 x 887, box x -676, y 0, w 6984, h 3548), by `flowmasks.py` and `maskext.py` from `references/approved/mars-close.jpg`, `out/work/dist0.npy` and the mist zone in `cuts.json`. R: mist on the canyon floor. G: thin dust haze: the band just below the horizon plus smooth far areas at 0.6. B: 0.
- `assets-src/mars/relief/relief.json` by `makejson.py`: image size, `margin` (left 676, right 676, bottom 380, full set px), camera, horizon line, per layer files, boxes, dist size and range, masks and their box, mist drift direction [0.899, 0.438] in image space, safe move.

## Checks run

- Identity (`test.py identity`): the three layers composited at full size in the image camera, inner frame only, against `out/work/mars-upscaled.png` over every opaque pixel (13,918,789 px): mean abs 0.66 levels, p99 3.0, p99.9 6.0, max 35. JPEG q94 alone gives max 31 on the same image, so the residual is the encoding. Against the approved image at 2816: PSNR 47.88 dB. The grid mesh viewer at the image camera: PSNR 47.88 dB, stretch ratio 1.000 on all layers.
- Seams at native size: crops of the full size composite `out/work/identity-ext.jpg` along the left, right and bottom frame edges, both bottom corners and the horizon at both ends. No step in tone or texture where margin meets original. The first build showed a seam in the bright plateau on the right; take t2 removed it.
- Move test (`test.py sweep`, `viewer.py`): each layer as a grid with one vertex per dist sample, z buffer. Path: forward f along the view direction, rise 0.3 f, pan 3 f deg about the up axis, both signs. Exposed edge px is 0 for every f up to 0.3 on both signs. Tears: none up to f = 0.15 (pan 0.45 deg) on both signs; at f = 0.2, 0 px with pan -0.6 deg and 2 px with pan +0.6 deg; 3 px at 0.25, 6 to 7 px at 0.3. Max stretch at f = 0.15: L0 2.23 to 2.30, L1 2.00 to 2.02, L2 1.56 to 1.57 (the base set had L0 2.50, L1 2.37 at f = 0.2 with no pan).
- Safe move written to `relief.json`: forward 0.15, rise 0.045, pan up to 0.45 deg either way.
- Native size review of both f = 0.15 renders (2816 wide, full color, magenta background): both cuts, the L2 peak, the left and right frame edges, both horizon ends and the bottom corners. No doubled edge, halo, hole or exposed end of the image.
- Contact sheet of six views along the path with pan -3 f deg, f = 0, 0.03, 0.06, 0.09, 0.12, 0.15: `out/work/contact-sheet-margin.jpg`. The base sheet without pan is `out/work/contact-sheet.jpg`.
- Text, watermark, border, logo, baked stars: none found in native crops.

## Weak points

- Depth is a monocular estimate: the canyon reads a little shallow, the far plain at left is 27 percent nearer than the ground model.
- The band behind L2 is a color transferred fill, it holds up for small moves only.
- A small pale haze sliver sits at the left of the L2 peak, about 15 x 10 px at full size, carried along with the mesa.
- L0 under the L1 margin is a blurred push pull fill; it only shows if the camera moves far past the safe move.
- The far plain in the left margin near the horizon has a faint horizontal streak texture from the take.
- The margin distance is the ground model plus a constant offset copied from the frame edge, so relief in the margin is flatter than inside.

## Fill fix (lead, Phase 3)

The hidden band of `relief-L0-color.jpg` behind the L2 mesa carried a near black wedge that showed as a dark sliver along the mesa's foot in the film view. `python3 assets-src/mars/relief/fillfix.py` (run once from the repo root on the agent's files at commit 58d0e17) repaints only that wedge, about 56,000 px at full size inside a hand outline, with an OpenCV inpaint from its surroundings plus fine noise. No image model is used. Nothing visible in the close image's own view changes.

## Draw order fix (Round 4)

Problem: in the film the three layers share one depth buffer and are drawn L0, L2, L1 with depth test on, each as a grid of 420 cells along its long side (`src/stops/mars/look.ts`, `src/terrain/relief.ts`). Under L2 and L1, L0 carried about the same distance as the upper layer (the mesa itself) or, in the hidden band behind the cut, a background distance pushed in from the nearer valley floor in front of the mesa foot. Where the interpolated L0 grid came out nearer than the upper layer, the upper layer failed the depth test and the hidden band of `relief-L0-color.jpg` showed through, even at the image's own camera: the bright displaced floor and the smooth brown smear along the L2 foot and the fleck on the mesa face at film frame 2580. The near black wedge that `fillfix.py` repainted was the same fault.

Fix, by `assets-src/mars/relief/zorder.py`, run after `build.py`, `maskext.py` and `fillfix.py`, and only on `public/assets/mars/full/relief-L0-dist.bin` and `public/assets/mars/web/relief-L0-dist.bin`. Inputs: those two files, `public/assets/mars/<set>/relief-L1-dist.bin`, `public/assets/mars/<set>/relief-L2-dist.bin`, `public/assets/mars/<set>/relief-L1-alpha.png`, `public/assets/mars/<set>/relief-L2-alpha.png`, `assets-src/mars/relief/relief.json`. No image model, no color file changes.
- For L2 and then L1: the upper layer's distance is placed on the L0 distance grid, continued past its box from the nearest box sample, and grown by a grey dilation of one L0 grid cell (about 8 distance samples in the full set, 4 in the web set), so the target holds at any point the 420 cell grid interpolates.
- Wherever the upper layer's alpha is above 0.002, and over 1.5 grid cells past its edge, L0 is set to at least 1.03 times that target; over the next cell the weight falls to 0 with a smoothstep. L0 is never moved nearer.
- Full set: 671,535 L0 distance samples moved back, median by a factor of 1.033. Web set: 167,718 samples, same median. Since all three layers sit on the rays of the image camera, a change of distance does not move any pixel in that camera; it only changes which layer wins the depth test there and the parallax of hidden L0 ground when the camera moves.

Checks:
- `zcheck.py <set>` rebuilds the 420 cell grids exactly as `src/terrain/relief.ts` does and counts pixels where an upper layer with alpha at least 0.004 lies behind a lower layer on the same ray. Before: L2 behind L0 882,373 px (771,026 with alpha at least 0.5), L1 behind L0 40,877 px (19,323). After, full and web: 0 for every pair.
- Film stills, `npm run still -- --frame N --tier review --format master`, N = 2462, 2470, 2489, 2490, 2535, 2580, 2625, 2669, 2670, 2685, 2692: native crops along the L2 foot and the L1 foot show no gap, smear, doubled or displaced floor. Frames 2490, 2625, 2669 and 2462 rendered before and after differ only in about 4,000 to 6,200 px, all inside the band where the hidden L0 ground used to show.
- `python3 tools/measure/g17.py out/work/stills/f02580-16x9-review-full.png references/approved/mars-close.jpg`: median 1.0161 before, 1.0163 after.
- Contact sheet `npm run sheet -- --segment mars.terrain --format preview --tier draft`, checked by eye.

## Ledger rows

None. No third party downloads were used.
