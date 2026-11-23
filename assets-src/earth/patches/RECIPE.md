# Earth dive patches

Four nested gnomonic colour patches centred on the dive spot in the Caribbean (`lon = -77.4757`, `lat = 18.1499`, from `assets-src/earth/relief/spotfit.py`), north at the top:

| File | Width | full | web |
| --- | --- | --- | --- |
| `public/assets/earth/<set>/patch-96.jpg` | 96 degrees | 4096 x 4096 | 2048 x 2048 |
| `public/assets/earth/<set>/patch-48.jpg` | 48 degrees | 4096 x 4096 | 2048 x 2048 |
| `public/assets/earth/<set>/patch-24.jpg` | 24 degrees | 4096 x 4096 | 2048 x 2048 |
| `public/assets/earth/<set>/patch-12.jpg` | 12 degrees | 4096 x 4096 | 2048 x 2048 |

Since the place task (23 November) `patch-12.jpg` is no longer shipped: `public/assets/earth/<set>/place-12.jpg` takes its place and the three wider levels carry the place laid in, see "The place on the globe" in `assets-src/earth/RECIPE.md`. This file describes the levels as commit 6da6c641 ships them, which are the input of that step.

All are JPEG quality 94, 4:4:4. The `web` files are the `full` files reduced by Lanczos.

## What a patch holds

The picture the globe shader would draw before its lighting, at the cloud state the dive and the rise see (the drift has come to rest when the hold ends): filmic coded surface x cloud shadow x (1 - cloud alpha) + premultiplied cloud, from `public/assets/earth/full/wrap-surface.jpg` and `public/assets/earth/full/wrap-cloud.webp`. The shadow is the shader's own (offset away from the Sun) for the Sun of film time 67.0 s: on the patch the Sun stands at azimuth -54 degrees from north, 9.1 degrees high, so shadows fall to the lower right. Where a patch has full weight the shader turns its live cloud layer and shadow off.

## Scripts (`assets-src/earth/patches/`, work files in `out/work/earth/patches/`)

- `base.py`: `composite(width_deg, size)` builds the picture above in the gnomonic frame of the spot.
- `chain.py sub PARENT PDEG CDEG SIZE OUT`: the exact gnomonic child of a patch. `chain.py lock TAKE REF SIGMA OUT`: take plus the Gaussian low frequencies (sigma in pixels) of reference minus take. `chain.py nest PARENT CHILD PDEG CDEG OUT`: child reduced by area and laid into the parent with a 12 percent smoothstep feather.
- `shiftcheck.py A B`: block phase correlation of the two pictures at 1024 (median, 90th percentile and largest shift in pixels) and the low-frequency difference in code values.
- `tools/ml/upscale.py --in A --out B --width 4096`: the repo's 2x upscaler.

## Level 96 (no generated take)

1. `base.composite(96, 2048)` to `p96-src-2048.png`. At this size the patch is as fine as the wrap, so nothing is generated.
2. `tools/ml/upscale.py` to 4096.
3. Level 48 nested into it.

## Levels 48, 24 and 12 (one generated take each, round 1)

Tool: `generate_image`, model `nano_banana_pro`, aspect ratio 1:1, output 2048 x 2048. Image 1 is the 1024 x 1024 input named below; image 2 is `references/approved/earth-hero.png` (as JPEG) for finish and palette. Exact prompts: `assets-src/earth/patches/prompt-48.txt`, `prompt-24.txt`, `prompt-12.txt`.

| Level | Input (image 1) | Take kept | Shift at 1024: median, p90, max | Low-frequency difference, mean | Lock |
| --- | --- | --- | --- | --- | --- |
| 48 | `p48-in-1024.jpg` = `base.composite(48, 1024)` | 1 of 1 | 0.21, 0.49, 1.90 px | 19 code values (tones drifted) | to `base.composite(48, 2048)`, sigma 24 |
| 24 | `p24-in-1024.jpg` = `chain.py sub` of the locked 48 | 1 of 1 | 0.12, 0.25, 0.50 px | 2.71 | to `chain.py sub` of the locked 48 at 2048, sigma 24 |
| 12 | `p12-in-1024.jpg` = `chain.py sub` of the locked 24 | 1 of 1 | 0.17, 0.31, 0.57 px | 5.42 | to `chain.py sub` of the locked 24 at 2048, sigma 24 |

Then, per level: `tools/ml/upscale.py` from 2048 to 4096 (`pNN-up-4096.png`), and `python3 assets-src/earth/patches/ship.py`: nests 12 into 24, 24 into 48, 48 into 96 and writes JPEG quality 94 4:4:4 into `public/assets/earth/full/` and Lanczos 2048 into `public/assets/earth/web/`.

Known weak point: the take of level 12 painted cloud shadows longer than a Sun 9 degrees high gives for small cumulus.

## Checks

- `shiftcheck.py` numbers above (layout held within a pixel at 1024 on every level).
- `python3 assets-src/earth/texcount.py` on `--diag texels` stills, and `npm run measure -- --stop earth --only G13`: numbers in `assets-src/earth/NOTES.md`.
