# Recipes: the flight sky

Both files are derived from `public/assets/shared/full/skyband.jpg` (recipe in `assets-src/shared/RECIPE.md`). No image model is used; the only tool is `assets-src/flightsky/make.py` (Python 3, `numpy`, `opencv-python-headless`, `Pillow`, all in `tools/ml/requirements.txt`). The seed is `seed` of `config/showcase.json`.

Command, from the repo root, about 90 s:

```
python3 assets-src/flightsky/make.py --thr 0.0008 --extra 400000 --detail 1 0.9 1 1.0 --size 8192 2048
```

Defaults that the command relies on: `--blur 1.5`, `--vivid 1.6`, `--warm 0.5`, `--faint 0.02 0.1`, `--fill 0.3 6 0.04`. `--checks` also writes `starless-x3.png` and `starless-over.jpg` to `/tmp/fs` for a look at the starless strip beside the source.

## public/assets/shared/full/skybandglow.png and public/assets/shared/web/skybandglow.png

- Output: `public/assets/shared/full/skybandglow.png` (8192 x 2048, 8 bit RGB PNG, 10.3 MB) and `public/assets/shared/web/skybandglow.png` (2048 x 512, 1.0 MB). The Milky Way strip without stars, the smooth light of the band in flight.
- Steps:
  1. Read the source strip (8192 x 2048), padded 64 columns on each side with its own wrap.
  2. Median 13 x 13 removes the stars. Where a pixel is more than 40 of 255 above that median (a large star), a soft mask (Gaussian sigma 5 of the mask, times 30, clamped) blends to a median 31 x 31.
  3. Gaussian sigma 1.5 on the padded strip, then the pad is cut off.
  4. To scene light (sRGB decode, inverse film curve). Three tenths of the light of the removed stars go back in as smooth light, so the star clouds keep their level: residual = source minus starless in scene light, each pixel's luminance capped at 0.04 so a bright star adds no blob, Gaussian sigma 6, times 0.3 (`--fill 0.3 6 0.04`), added to the starless strip.
  5. Dark detail (`--detail 1 0.9 1 1.0`): the median also removes dark veins thinner than its window. Luminance of the source in scene light, Gaussian sigma 0.9 twice (the kernel value 1 turns the grey opening between the two off), is compared with the luminance of the starless strip: where the source is darker, the starless strip is scaled down to it (ratio clamped to 0.2 to 1.0, so nothing gets brighter and no star comes back). Color stays that of the median, so no chroma speckle returns. The smooth light of step 4 is multiplied by the same ratio over its own Gaussian (sigma 6), so it does not fog the veins.
  6. Film curve, square root, area scale to the output size (`--size 8192 2048`: the full set keeps the source size), sRGB encode, 8 bit. The shader squares the sample. The square root keeps precision in the dark lanes.
- Why PNG: no 8 x 8 blocks, no chroma subsampling. A JPEG of this smooth map saved almost nothing and brought the blocks back.
- Loaded with linear filtering, without mipmaps. GPU memory: 67.1 MB (full), 4.2 MB (web).

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

## The star field of the band at a stop (no file, drawn by the sky pass)

- Since MAIL 732 the band at a stop (`uFlightStrip.x` under 1) is not the photograph strip `skyband.jpg` shown as it is. The cloud's light is `skybandglow.png` (the strip without stars, above), its colour calmed half way toward level 6 of `skyband.jpg`, and its stars are drawn by `stopLayer` in `src/space/sky.ts` from the values under `travel.sky.flightStrip.stop` of `config/showcase.json`.
- A layer is a grid of cells in band coordinates (`cells` across the 180 degree strip and up its 45 degrees, repeated with the strip). Each cell holds one star at a hashed place, with a hashed weight `min(u ^ (-1 / slope), cap)` (a power law of star counts) and a hashed cool or warm tint whose mean is white. A star is a Gaussian `exp(-r2 / core)` in pixels of the 1080 line picture, the same core as the catalog stars (0.7), found through the screen derivatives of the band coordinate, so its size on screen does not follow the lens or the format.
- A layer's mean light is `light` times the cloud's light at that place, whatever the lens; where a cell is under `fine[0]` pixels the layer is its mean (smooth light), with a ramp to `fine[1]`.
- Two layers: `points` (1080 by 180 cells, few and bright, slope 1.2, cap 120) and `grain` (5400 by 900 cells, about one a pixel at the stops' lens, slope 3, cap 5). `share` is the part of the cloud's smooth light that is taken out and given to the stars; what is left stays as the unresolved glow.
- Dust lanes: `min(photograph / cloud, 1) ^ lane` scales the cloud and both star layers, so a lane has fewer and fainter stars, with the photograph's own structure, and a bright blob of the photograph adds nothing.
- The band grade (`skyFrame.band.gamma`) and the warm look read the level from the cloud and lanes, not from a single star, so a bright star keeps the cloud's hue.
- No seed and no file: the hash of the cell index is the star. The same field stands at every stop and in both formats.

## The hold of the band in a rise (no file, a named look)

- Since MAIL 915 a stop can keep the band at the strength of its hold while the stars lift in its rise. `SkyLook.hold` in `src/space/sky.ts`: under a named hold of weight w the band's own lift is the lift of the stars times (1 - w). The band's own lift drives three things in the sky pass (uniform `uBandLift`: x the swap, y the lift): the swap of the stop's band for the flight strip, the gain of the flight (`flightStars.band.gain` over `level`), and the warm spread along the middle line. Everything else of the flight keeps the lift of the stars: the stars, the deep field, the haze, the veil, the soft sky off the band, and the exposure.
- `holdBand(id, u)` names the hold for one picture, u the progress of the stop's rise from 0 to 1. The weight is `bandHeld(id, u)`: 1 up to the first number of `travel.sky.bandHold.<stop>` in `config/showcase.json`, a smooth step down to 0 at the second. The third number is a gain on the band under the hold (1: the strength of the hold as it is; under 1 dims it further, measured at 0.5 on Neptune 5006: the corner box falls from 75, 62, 51 to 57, 49, 43 of 255 in the draft).
- A stop with no entry in `travel.sky.bandHold` names nothing and its sky is the same to the float. The stop's set calls `holdBand` at the top of `update` in its own rise (Uranus, Neptune).
- The windows are set for one camera path. They must lie where the bright part of the band is out of the frame, and end before the rise ends so that the flight starts at its own gain. `tests/skyhold.test.ts` reads the film and fails when the middle line of the band stands nearer to the frame than its limit during the fall (Uranus: the edge of the stop's band, 13.5 degrees; Neptune: 5 degrees). When a stop's rise or its sky turn changes, run that test and set the two numbers again.
