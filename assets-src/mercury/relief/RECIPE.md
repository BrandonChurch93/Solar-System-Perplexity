# Mercury terrain relief recipe

All paths are repo paths. Scripts are in `assets-src/mercury/relief/` and run from the repo root with Python 3. Work files go to `out/work/mercury/relief/` (written `$R` below; not tracked). The terrain view is one relief layer: the approved terrain image as color, a distance for every pixel, an alpha cut at the horizon. Nothing on the ground moves.

## Outputs

| File | What |
|---|---|
| `public/assets/mercury/<set>/relief-color.jpg` | the approved terrain image with painted margins, full 8192 x 3864 (JPEG quality 93, 4:4:4), web 4096 x 1932 (quality 90) |
| `public/assets/mercury/<set>/relief-alpha.png` | 8 bit alpha, zero above the horizon, same sizes |
| `public/assets/mercury/<set>/relief-dist.bin` | distance from the camera in camera heights, raw little-endian float32, a quarter of the color size (full 2048 x 966, web 1024 x 483) |
| `public/assets/mercury/<set>/relief-masks.png` | 16 x 16 black: Mercury has no mist and no dust |
| `src/stops/mercury/relief.json` | sizes, box of the canvas against the approved frame, field of view |

## Inputs

- `references/approved/mercury-close.jpg`, 2816 x 1584: the picture. Its pixels are kept; only margins are painted.
- No third-party input.

## Steps

1. Camera fit: `python3 assets-src/mercury/relief/camfit.py` fits a sphere horizon to 46 points of the approved image's horizon, with a vertical field of 60 degrees assumed. Writes `assets-src/mercury/relief/camera-fit.json`: roll -11.27 degrees, dip of the horizon 10.25 degrees, planet radius 61.7 camera heights, horizon 11.15 heights away, residual 0.022 degrees rms.
2. Block grid: `python3 assets-src/mercury/tools/deblock.py references/approved/mercury-close.jpg out/work/mercury/close-db.png` removes the 8 px block steps where the picture is calm (boundary step over inside step in the crater shadow 2.90 before, 0.78 after; sky 1.66 before, 0.97 after; mean change 0.39 codes). `python3 tools/ml/upscale.py --in out/work/mercury/close-db.png --out out/work/mercury/close-db-2x.png --width 5632` (Swin2SR, `tools/ml/MODELS.md`).
3. Margins. Canvas 4096 x 1932 at approved scale: 640 px to the left and to the right, 348 px below, nothing above (the sky is the film's). `python3 assets-src/mercury/relief/ext.py prep` writes the two squares `$R/left-in.jpg` and `$R/right-in.jpg` (1932 px, approved pixels with the missing part flat magenta). Each is painted with `generate_image`, model `nano_banana_pro`, aspect 1:1, one input image, the prompt below. Then `python3 assets-src/mercury/relief/ext.py prepbottom left=$R/left-t1.png right=$R/right-t1.png` writes `$R/bottom-in.jpg` (the gap below the approved frame, between the two squares), painted the same way at aspect 16:9. Prompt (`relief/prompts/margin.txt`):

```
Image 1 is part of a film frame: a view from low orbit over the cratered surface of the planet Mercury, lit by a hard low Sun from the upper left, with razor black shadows and no air. Part of the canvas is flat magenta: that part of the picture is missing.
Paint the missing part so that the picture continues past its edge as the same camera would see it: the same grey and bronze cratered plain, with craters, rims, small pits and ridges of the same sizes for their distance from the camera, the same hard light direction, the same long black shadows, the same grade, sharpness and film grain. Ground close to the camera at the bottom shows larger, sharper detail. Every feature that touches the magenta edge continues across it without a seam. Where the missing part reaches above the curved horizon it is black space with a few faint stars, and the horizon continues its curve.
No large new crater bigger than the ones beside it, no bright ray crater, no mountains, no haze, no glow on the ground. Every pixel outside the magenta area stays exactly as it is. No magenta left anywhere, no text, no border, no frame.
```

4. `python3 assets-src/mercury/relief/ext.py comp $R/ext-2816.png left=$R/left-t1.png right=$R/right-t1.png bottom=$R/bottom-t1.png`: each take is scaled to its box, checked by optical flow against the approved pixels it contains, matched to them in level, and blended in only where the canvas was magenta. Approved pixels are pasted back exactly.
5. Margins at twice the size: `python3 assets-src/mercury/relief/up.py cut` writes the three margin strips (64 px overlap into the approved frame), each is upscaled with `python3 tools/ml/upscale.py --in $R/strip-K.png --out $R/strip-K-2x.png --width W` (`W` twice the strip's width), `python3 assets-src/mercury/relief/up.py join` writes `$R/ext-2x.png` (8192 x 3864) with `out/work/mercury/close-db-2x.png` pasted over the approved frame.
6. Depth: `python3 tools/ml/depth.py --in $R/ext-2816.png --out-prefix $R/ext-depth` (Depth Anything V2, `tools/ml/MODELS.md`).
7. Lens fix: `python3 assets-src/mercury/relief/lens.py FILM --fresh` with frame 870 at review as `FILM` (twice). It measures approved over film on the ground in scene values and writes `$R/lens-fix.npy`, a smooth factor that `build.py` multiplies into the color, so the film's own bloom does not lift the shadows above the approved image (before the fix: ground 1.027, shadows 1.16). The factor is tidied before it is saved: its luminance is median filtered at a quarter of the size (11 px) and blurred 6 px (at 1920), its chroma blurred 40 px and held within 0.94 to 1.06, so it cannot draw dark rings or colored halos around the small glints of the approved image (`lens.py --tidy [FILE]` applies the same to an existing file). Round 7 used a narrow tidy (1.5 px), which left a dark dot of about 0.4 at every glint: the bright dots with dark rings in the crater shadows.
8. Build: `RELIEF_GAIN=2.6 python3 assets-src/mercury/relief/build.py`. Before the lens fix the color is despeckled (`specks`): a pixel whose chroma is more than 5 codes off a 21 px median of the chroma takes the median chroma (fully from 8 codes), and a compact bright dot loses 70 percent of what it has above its surroundings; shadows are not touched. The approved image carries hundreds of 1 to 3 px colored sparkles on matte rock, which hard light and motion make read as noise. Distance = the sphere ground model of the camera fit times exp(detail); detail = the high-pass (300 px) of log(fitted depth) minus log(sphere), times the gain, faded out between 4.5 and 8 camera heights so the horizon stays one clean curve. Alpha is cut 2.5 px (at 2816) above the fitted horizon, and along the detected horizon in the margins, so the thin warm fringe on the horizon belongs to the ground and travels with it. Writes both sets.

## Takes

| Asset | Takes | Kept | Why |
|---|---|---|---|
| left margin | `t1` (`nano_banana_pro`), `t2` (`seedream_5`) | `t1` | `t2` changed the whole picture to orange streaks |
| right margin | `t1` (`nano_banana_pro`) | `t1` | continues the plain and the horizon; flow in the known part under 1 px |
| bottom margin | `t1`, `t2` (`nano_banana_pro`) | `t1` | `t2` showed a visible rectangle |

## Checks

- Painted horizon against the fitted sphere: within 1 to 4 px, except the far right edge (5 to 12 px low), where the alpha follows the detected horizon.
- Frame 870 at review, film over approved (`python3 out/work/mercury/tprobe.py FILM`): ground median 0.994 (10th percentile 0.943, 90th 1.041), under the Sun 0.998, shadows 1.007, bright ground 0.995. Laplacian rms film over approved on the ground 1.138.
- Frames 781, 870 and 959: foreground and horizon move against each other, no stretching at the crater rims, no box edge in frame (`out/work/mercury/check-apron.ts`: frame 744 sees canvas x -583 to 3443 against the limits -640 and 3456).
