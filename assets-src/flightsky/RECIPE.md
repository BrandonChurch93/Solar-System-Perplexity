# Recipes: the flight sky

Both files are derived from `public/assets/shared/full/skyband.jpg` (recipe in `assets-src/shared/RECIPE.md`). No image model is used; the only tool is `assets-src/flightsky/make.py` (Python 3, `numpy`, `opencv-python-headless`, `Pillow`, all in `tools/ml/requirements.txt`). The seed is `seed` of `config/showcase.json`.

Command, from the repo root, about 30 s:

```
python3 assets-src/flightsky/make.py --thr 0.0008 --extra 400000
```

Defaults that the command relies on: `--blur 1.5`, `--vivid 1.6`, `--warm 0.5`, `--faint 0.02 0.1`, `--fill 0.3 6 0.04`. `--checks` also writes `starless-x3.png` and `starless-over.jpg` to `/tmp/fs` for a look at the starless strip beside the source.

## public/assets/shared/full/skybandglow.png and public/assets/shared/web/skybandglow.png

- Output: `public/assets/shared/full/skybandglow.png` (4096 x 1024, 8 bit RGB PNG, about 2.3 MB) and `public/assets/shared/web/skybandglow.png` (2048 x 512, about 0.8 MB). The Milky Way strip without stars, the smooth light of the band in flight.
- Steps:
  1. Read the source strip (8192 x 2048), padded 64 columns on each side with its own wrap.
  2. Median 13 x 13 removes the stars. Where a pixel is more than 40 of 255 above that median (a large star), a soft mask (Gaussian sigma 5 of the mask, times 30, clamped) blends to a median 31 x 31.
  3. Gaussian sigma 1.5 on the padded strip, then the pad is cut off.
  4. To scene light (sRGB decode, inverse film curve). Three tenths of the light of the removed stars go back in as smooth light, so the star clouds keep their level: residual = source minus starless in scene light, each pixel's luminance capped at 0.04 so a bright star adds no blob, Gaussian sigma 6, times 0.3 (`--fill 0.3 6 0.04`), added to the starless strip.
  5. Film curve, square root, area scale to the output size, sRGB encode, 8 bit. The shader squares the sample. The square root keeps precision in the dark lanes.
- Why PNG: no 8 x 8 blocks, no chroma subsampling. A JPEG of this smooth map saved almost nothing and brought the blocks back.
- Loaded with linear filtering, without mipmaps. GPU memory: 16.8 MB (full), 4.2 MB (web).

## public/assets/shared/full/skybandstars.bin and public/assets/shared/web/skybandstars.bin

- Output: the same file in both sets, about 7.6 MB: the stars of the strip as points, drawn by code in flight.
- Layout, little endian: bytes `BSTR`, u32 version (1), u32 count, then count records of 10 bytes:
  - u16 `u`: across the strip, divide by 65536.
  - u16 `v`: up the strip, divide by 65535, 0 is the bottom row.
  - u16 flux: `(log2(flux) + 16) * 2048`.
  - 3 x u8 color: red, green, blue with luminance 1, 63.75 per unit.
  - u8 the starless luminance under the star: `(log2(l) + 16) * 16`.
- Steps:
  1. Source and starless strip (step 3 above) to scene light: sRGB decode, then the inverse of the film curve, as the sky shader does.
  2. Residual = source minus starless. Its luminance (0.3, 0.5, 0.2), blurred with sigma 0.8, is searched for local maxima in 3 x 3 above `--thr`.
  3. Flux of a star = the sum of the positive residual in 5 x 5 around the peak (9 x 9 for peaks above 0.15, blended up to 0.4). Position = the 3 x 3 centroid, clamped to one texel from the peak, plus a jitter of a quarter texel.
  4. Color = the star's own residual color mixed half and half (`--warm`) with the starless color under it, its distance from white times `--vivid`, then set to luminance 1.
  5. `--extra N`: N faint points below the detection limit. Position drawn with density proportional to the starless luminance to the power 1.5 (the top and bottom fifth of the strip get none), flux between the two `--faint` values with most near the low one, color of the strip under the point plus a random warm or cool shift.
  6. The records are shuffled with the seeded generator and written.
- The count printed by the command at the time of delivery: 363 thousand found stars plus 400 thousand faint points.
