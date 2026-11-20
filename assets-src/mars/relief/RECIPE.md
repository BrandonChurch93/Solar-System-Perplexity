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
python3 assets-src/mars/relief/build.py
python3 assets-src/mars/relief/makejson.py 1
python3 assets-src/mars/relief/flowmasks.py
python3 assets-src/mars/relief/test.py identity
python3 assets-src/mars/relief/test.py sweep 1408 0.05,0.1,0.15,0.2,0.25,0.3,0.4 0
```

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

## Shipped files

All written by `assets-src/mars/relief/build.py` unless noted. Input files for all of them: `out/work/mars-upscaled.png`, `out/work/paint-comp-5632.png`, `out/work/dist0.npy`, `out/work/cutpaths.json`, `assets-src/mars/relief/cuts.json`, `out/work/paint-w.npy`, `out/work/paint-mask.npy`. Tool: the scripts in this folder (numpy, OpenCV, SciPy), no model beyond the ones named in steps 1, 3 and 5. One take each, kept because it passed the checks below.

- `public/assets/mars/<set>/relief-L0-color.jpg` (JPEG q94), `public/assets/mars/<set>/relief-L0-alpha.png`: the far layer, full frame. Upscaled image, with the painted ground under L1 and L2. Sky cut: alpha is a smoothstep from 0 at 110 px (full) above the horizon line to 1 at 10 px below it. In the band above the horizon a morphological opening (11 px disk) and a wide horizontal blur replace the image, so no star or bright speck in the image sky survives.
- `public/assets/mars/<set>/relief-L1-color.jpg`, `public/assets/mars/<set>/relief-L1-alpha.png`: the near escarpment at lower left. Box in full px x 0, y 1080, w 4004, h 2088.
- `public/assets/mars/<set>/relief-L2-color.jpg`, `public/assets/mars/<set>/relief-L2-alpha.png`: the right mesa. Box x 2784, y 836, w 2848, h 1008. Its top edge is soft, it joins the far plateau.
- Edges of L1 and L2: alpha is a 2 to 3 px antialiased edge along the cut. Color outside the opaque core is replaced by the nearest core color, so there is no background fringe. On the soft side of each edge the layer color and the L0 color under it are solved so that the composite equals the upscaled image to 8 bit precision.
- `public/assets/mars/<set>/relief-L<k>-dist.bin` for k = 0, 1, 2: raw little endian float32, row major, half the layer pixel size (full set: L0 2816 x 1584, L1 2002 x 1044, L2 1424 x 504; web set: half again). Fitted depth from step 3; behind each cut L0 holds the background distance pushed in from outside the cut (push pull fill in log distance); each upper layer continues its own surface past its edge. Capped at the horizon distance. Ranges: L0 3.80 to 44.11, L1 2.35 to 5.97, L2 5.73 to 16.45.
- `public/assets/mars/<set>/relief-masks.png` (full 2816 x 1584, web 1408 x 792), by `flowmasks.py` from `references/approved/mars-close.jpg`, `out/work/dist0.npy` and the mist zone in `cuts.json`. R: mist on the canyon floor, drawn along the canyon ribbon. G: thin dust haze: the band just below the horizon plus smooth far areas at 0.6. B: 0.
- `assets-src/mars/relief/relief.json` by `makejson.py`: image size, camera, horizon line, per layer files, boxes, dist size and range, masks, mist drift direction [0.899, 0.438] in image space (down canyon, toward the lower right), safe move.

## Checks run

- Identity (`test.py identity`): the three layers composited at full size in the image camera against `out/work/mars-upscaled.png`, over every pixel where the layers are opaque (13,918,789 px, all ground): mean abs difference 0.66 levels, p99 3.9, p99.9 6.0, max 34. JPEG q94 alone on the same image gives mean 0.59, p99 4.0, max 31, so the residual is the JPEG encoding. Against the approved image at 2816: PSNR 48.0 dB. The grid mesh viewer at the image camera gives the same, PSNR 48.0 dB, stretch ratio 1.000 on all layers.
- Move test (`test.py sweep`, `viewer.py`): each layer as a grid with one vertex per dist sample, rendered with a z buffer. Path: forward f along the view direction, rise 0.3 f, pan about the up axis. With pan 0: no exposed edge and no tear up to f = 0.20 (rise 0.06); first 1 px tears at f = 0.25. With any pan, the frame edge at the left horizon shows at once (14 px at pan -0.15 deg, 2 px at +0.3 deg), so pan is 0 until the margin set lands.
- Native size review of the f = 0.20 render (2816 wide, full color) at both cuts and the L2 peak: no doubled edge, no halo, no hole. L1 and L2 over magenta: no fringe of background color.
- Contact sheet of six views f = 0, 0.04, 0.08, 0.12, 0.16, 0.20 at `out/work/contact-sheet.jpg`.
- Text, watermark, border, logo, baked stars: none found in native crops.

## Weak points

- Depth is a monocular estimate: the canyon reads a little shallow, the far plain at left is 27 percent nearer than the ground model.
- The band behind L2 is a color transferred fill, it holds up for small moves only.
- A small pale haze sliver sits at the left of the L2 peak, about 15 x 10 px at full size, carried along with the mesa.

## Ledger rows

None. No third party downloads were used.
