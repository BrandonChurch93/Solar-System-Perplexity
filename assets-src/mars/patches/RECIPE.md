# Mars Dive Patches Recipe

## Overview

Three nested gnomonic surface-color patches centered on the Mars dive spot in Valles Marineris (`lon = -81.86`, `lat = -4.54` in the body frame; hero pixel `(1267.110, 855.387)` vs target `(1267, 855)`, `0.402 px` error through `assets-src/mars/fit.json`):

- `public/assets/mars/<set>/patch-1.jpg` (`public/assets/mars/full/patch-1.jpg` at `4096 x 4096`, `public/assets/mars/web/patch-1.jpg` at `2048 x 2048`): `48.0` degrees angular width (`halfTan = 0.44522869`).
- `public/assets/mars/<set>/patch-2.jpg` (`public/assets/mars/full/patch-2.jpg` at `4096 x 4096`, `public/assets/mars/web/patch-2.jpg` at `2048 x 2048`): `12.0` degrees angular width (`halfTan = 0.10510424`).
- `public/assets/mars/<set>/patch-3.jpg` (`public/assets/mars/full/patch-3.jpg` at `4096 x 4096`, `public/assets/mars/web/patch-3.jpg` at `2048 x 2048`): `3.0` degrees angular width (`halfTan = 0.02618592`).

All `full` masters are saved at JPEG quality `94` (`4:4:4` chroma, `subsampling=0`). All `web` files are derived from the `full` masters by Lanczos 2x downsampling to `2048 x 2048` at JPEG quality `94` (`subsampling=0`). Recommended shader feather width is `0.12` (`12%` of patch width on each side), recorded in `assets-src/mars/patches/patches.json`.

### Projection and Sun Direction

- Body direction of `(lon, lat)`: `(cos lat sin lon, sin lat, cos lat cos lon)` with `u = lon/360 + 0.5` and north at the top.
- At `(lon = -81.86, lat = -4.54)`:
  - `n = [-0.98681898, -0.07915506, 0.14114809]`
  - `east = normalize(cross((0, 1, 0), n)) = [0.14159236, 0.0, 0.98992505]`
  - `north = cross(n, east) = [-0.07835757, 0.99686232, 0.01120775]`
  - For body direction `d` with `d.n > 0`: `x = (d.east)/(d.n)`, `y = (d.north)/(d.n)`, `u = 0.5 + x / (2 tan(a_k/2))`, `v = 0.5 - y / (2 tan(a_k/2))`.
- Transforming `sunDir` from `assets-src/mars/fit.json` by the inverse of `globe.quaternion` gives body Sun direction `[-0.60336961, 0.55908845, -0.56865212]` and patch `(east, north, up)` components `[-0.64836, 0.59824, 0.4709]`, corresponding to Sun elevation `28.09` degrees and azimuth `-47.3` degrees clockwise from north (upper-left / north-west illumination casting local canyon shadows toward lower-right / south-east).

### Companion Scripts (`tools`-free)

- `assets-src/mars/patches/resample.py`: resamples an equirectangular map into a gnomonic patch (`to-patch`), resamples a patch back to an equirectangular RGBA layer with smoothstep feathering (`to-equirect`), extracts exact gnomonic child subpatches (`subpatch`), and nests a finer patch into its parent with prefiltering and feathering (`nest`).
- `assets-src/mars/patches/tile_assemble.py`: splits a `2048` global pass into four overlapping `2240 x 2240` quadrants on a `4096 x 4096` canvas (`384 px` smoothstep overlap), locks each tile's low frequencies (`sigma = 28` to `36 px`) to the global reference before blending, and matches low frequencies to the parent subpatch (`match-parent`).
- `assets-src/mars/patches/bake.py`: matches `patch-1` low frequencies (`sigma_interior = 0.75` deg, `sigma_edge = 0.25` deg) to any equirectangular wrap map and composites `patch-1` into an equirectangular wrap map of arbitrary width (for example `8192 x 4096`) inside its `48` degree footprint with the `0.12` smoothstep feather.
- `assets-src/mars/patches/verify.py`: runs the spot and Sun projection check against `assets-src/mars/fit.json`, measures nested consistency and feather low-frequency error, writes native center/edge crops, and renders the 8-panel top-down simulated dive contact sheet (`60` deg down to `1` deg).

---

## Asset 1: `public/assets/mars/<set>/patch-1.jpg`

- **Output files**:
  - `public/assets/mars/full/patch-1.jpg` (`4096 x 4096`, JPEG quality `94`, `subsampling=0`)
  - `public/assets/mars/web/patch-1.jpg` (`2048 x 2048`, JPEG quality `94`, `subsampling=0`, Lanczos downscale of `full`)
- **Angular width**: `48.0` degrees centered on `lon = -81.86, lat = -4.54`.
- **Tools and models**:
  - `assets-src/mars/patches/resample.py` (`to-patch`, `nest`)
  - `generate_image` with model `nano_banana_pro` (`aspect_ratio = "1:1"`, `2048 x 2048` output)
  - `assets-src/mars/patches/tile_assemble.py` (`split`, `assemble`)
  - `assets-src/mars/patches/bake.py` (low-frequency wrap matching)
  - `tools/ml/checkmoved.py` (alignment verification)
- **Input files**:
  - `assets-src/mars/wrap/stage1-color-4096.jpg` (from branch `agent/assets-mars-wrap`, commit `19404a0`, SHA-256 `c7d1ee122b2581950a0479e107f701681884ae8bae29ecd0eb6d16dfea07d16a`, delit Mars wrap pass with Phobos removed)
  - `references/approved/mars-hero.png` (style and orbital color reference)
  - `references/approved/mars-close.jpg` (canyon wall stratigraphy reference)
  - `public/assets/mars/full/patch-2.jpg` (nested into the central `12` degree region during final bottom-up nesting)

### Step 1A: Base Resample and `2048 x 2048` Global Pass

1. Resampled `assets-src/mars/wrap/stage1-color-4096.jpg` to a `48` degree gnomonic patch at `1024 x 1024` (`out/work/prod/p1/p1-in-1024.png`) and native wrap resolution `546 x 546` (`out/work/prod/p1/p1-in-546.png`):
   ```bash
   python3 assets-src/mars/patches/resample.py to-patch --map out/work/wrap/stage1-color-4096.jpg --width-deg 48 --size 1024 --out out/work/prod/p1/p1-in-1024.png
   python3 assets-src/mars/patches/resample.py to-patch --map out/work/wrap/stage1-color-4096.jpg --width-deg 48 --size 546 --out out/work/prod/p1/p1-in-546.png
   ```
2. Ran `generate_image` (`model: "nano_banana_pro"`, `aspect_ratio: "1:1"`) with input images `[out/work/prod/p1/p1-in-1024.png, references/approved/mars-hero.png, references/approved/mars-close.jpg]` and exact prompt:
   ```text
   Strict 4x super-resolution of Image 1, an orthographic top-down 90-degree nadir planetary surface map patch of Mars centered on Valles Marineris (48 x 48 degrees, 1:1 square, north at the top).

   EXACT LAYOUT AND TONE LOCK:
   Image 1 is the exact base map resampled from the delit Mars wrap map. When scaled back to Image 1's resolution, every canyon branch, Noctis Labyrinthus fracture network at left, twin central Valles Marineris troughs, Candor and Ophir chasma bays at right, Coprates troughs at lower-right, swirling golden-ochre dust storm in the upper half, volcano caldera in the upper-left, craters, and dark basalt albedo markings MUST stay in their exact pixel positions, shapes, and regional tones. Do NOT shift, rotate, resize, add, or remove any major feature.

   ORBITAL SURFACE DETAIL AND MODERATE LOCAL CANYON LIGHT:
   Replace only the pixel softness of Image 1 with crisp, photoreal orbital Martian geology matching the finish and rich rust, ochre, crimson, and dark basalt palette of Image 2 (approved Mars orbital frame), with subtle canyon wall stratigraphy hinted from Image 3 (approved Valles Marineris close frame):
   - Along Valles Marineris and Noctis Labyrinthus: razor-sharp scalloped canyon rims, stepped fault scarps, branching tributary gullies, landslide fans, and layered rust and dark burgundy cliff walls. Keep local relief shading moderate inside the canyons, lit by one Sun from the upper-left (north-west, azimuth -47 degrees, elevation 28 degrees), so north-west rims cast moderate dark cool shadows toward the lower-right onto trough floors while south-east/north-west-facing opposite walls catch warm amber-rust light. Do NOT add global limb darkening across the tile.
   - In the upper swirling dust storm: crisp billowing filamentary dust fronts and fine ochre cloud structure matching Image 2 without expanding the storm footprint.
   - Across surrounding plateaus: sharp small impact craters, wind streaks, wrinkle ridges, and fine regolith grain.

   Strict nadir map texture filling edge to edge. No horizon, no sky, no stars, no planet limb, no vignette, no border, no text, no watermark.
   ```
3. **Takes and selection**: 2 takes generated (`global-take-1.png`, `global-take-2.png`). Kept `global-take-2.png` because it preserved exact regional luminance (`PSNR 28.882 dB` vs `18.074 dB` on take 1) and tighter flow (`p99 = 0.4530 px` vs `0.7363 px` at `546 x 546`; `PSNR 27.994 dB`, `p99 = 0.9602 px` at `1024 x 1024`).

### Step 1B: Overlapping `2 x 2` Tile Pass to `4096 x 4096`

1. Split `global-take-2.png` into four `1120 x 1120` quadrant inputs (`tl`, `tr`, `bl`, `br`, each covering `2240 x 2240` of the `4096 x 4096` grid with `384 px` overlap):
   ```bash
   python3 assets-src/mars/patches/tile_assemble.py split --global-img out/work/prod/p1/global-take-2.png --out-dir out/work/prod/p1/tiles --input-size 1120
   ```
2. Ran `generate_image` (`model: "nano_banana_pro"`, `aspect_ratio: "1:1"`) on each quadrant `[out/work/prod/p1/tiles/in-<tag>.png, references/approved/mars-hero.png, references/approved/mars-close.jpg]` with exact prompt:
   ```text
   Strict 2x super-resolution of Image 1, a square quadrant crop of an orthographic top-down 90-degree nadir planetary surface map of Mars near Valles Marineris (north at the top).

   EXACT PIXEL-LOCKED GEOMETRY AND TONE:
   Image 1 is the exact layout and tonal map to sharpen. When scaled back to Image 1's resolution, every canyon rim, fault scarp, spur-and-gully wall, dust storm filament, crater, ridge, and regional brightness and hue MUST match Image 1 pixel-for-pixel. Do NOT move, invent, erase, brighten, or darken any feature.

   TRUE NATIVE MICRO-DETAIL:
   Resolve fine sub-pixel Martian geology matching the orbital clarity of Image 2 (approved Mars hero frame) and rock texture of Image 3 (approved Valles Marineris close frame): crisp bedrock strata along canyon walls, miniature scree chutes, sharp rim micro-crenulations, tiny secondary craters, wind-etched regolith grain, and delicate dust filaments where dust clouds already exist in Image 1. Keep local canyon shadow direction strictly from upper-left (azimuth -47 degrees, elevation 28 degrees) casting shadows toward lower-right.

   Strict nadir map texture edge to edge. No border, no vignette, no horizon, no sky, no stars, no text, no watermark.
   ```
3. **Takes and selection**: 1 take per quadrant (`tile-tl-take-1.png`, `tile-tr-take-1.png`, `tile-bl-take-1.png`, `tile-br-take-1.png`), all kept on first take after passing `checkmoved.py` against `1120 x 1120` inputs:
   - `tl`: `PSNR 34.252 dB | SSIM 0.921128 | Flow median 0.0438 px | p99 0.5977 px (PASS)`
   - `tr`: `PSNR 31.793 dB | SSIM 0.859436 | Flow median 0.1267 px | p99 0.5881 px (PASS)`
   - `bl`: `PSNR 32.041 dB | SSIM 0.878158 | Flow median 0.0698 px | p99 0.5643 px (PASS)`
   - `br`: `PSNR 28.977 dB | SSIM 0.802089 | Flow median 0.1177 px | p99 0.7297 px (PASS)`
4. Assembled `4096 x 4096` mosaic (`--lock-sigma-px 28`), matched low frequencies to `stage1-color-4096.jpg`, nested `patch-2` (`12` deg, `feather = 0.12`) into `patch-1`, ran final `bake.py` low-frequency wrap match (`--out-patch`), and exported `full` (`4096`) and `web` (`2048`) JPEGs.
5. **Checks passed on final `public/assets/mars/full/patch-1.jpg`**:
   - `checkmoved.py` vs `546 x 546` wrap input: `PSNR 29.173 dB | SSIM 0.825347 | Flow median 0.1034 px | p99 0.4290 px | max 1.2391 px (PASS)`.
   - Low-frequency feather difference vs `stage1-color-4096.jpg` (`sigma = 0.25` deg = `21.33 px` over outer `12%` feather zone): `RMS = 0.00124` (`0.316 / 255`), `p99 = 0.993 / 255`, `max = 3.378 / 255`.

---

## Asset 2: `public/assets/mars/<set>/patch-2.jpg`

- **Output files**:
  - `public/assets/mars/full/patch-2.jpg` (`4096 x 4096`, JPEG quality `94`, `subsampling=0`)
  - `public/assets/mars/web/patch-2.jpg` (`2048 x 2048`, JPEG quality `94`, `subsampling=0`, Lanczos downscale of `full`)
- **Angular width**: `12.0` degrees centered on `lon = -81.86, lat = -4.54`.
- **Tools and models**:
  - `assets-src/mars/patches/resample.py` (`subpatch`, `nest`)
  - OpenCV bilateral + Gaussian pre-smoothing on parent subpatch (`cv2.bilateralFilter(d=7, sigmaColor=22.0, sigmaSpace=3.0)` + `cv2.GaussianBlur(sigma=1.1)`) to prevent 1-px parent stipple amplification
  - `generate_image` with model `nano_banana_pro` (`aspect_ratio = "1:1"`, `2048 x 2048` output)
  - `assets-src/mars/patches/tile_assemble.py` (`split`, `assemble`, `match-parent`)
  - `tools/ml/checkmoved.py` (alignment verification)
- **Input files**:
  - Wrap-matched Patch 1 global pass (`out/work/prod/p1/p1-global-matched-2048.png`, central `12` deg extracted at `484 x 484` as `out/work/prod/p2/p2-clean-484.png` and pre-smoothed as `out/work/prod/p2/p2-smooth-484.png`: `PSNR 30.573 dB | Flow median 0.0531 px | p99 0.6908 px` vs `p2-clean-484.png`)
  - `references/approved/mars-hero.png`
  - `references/approved/mars-close.jpg`
  - `public/assets/mars/full/patch-3.jpg` (nested into the central `3` degree region during final bottom-up nesting)

### Step 2A: Exploratory Global Pass and `2 x 2` Tile Pass to `4096 x 4096`

1. An initial `2048` global pass (`global-take-1..6`, kept `global-take-6.png` at `PSNR 29.716 dB | p99 0.5715 px`) showed that super-resolving twice at `12` deg slightly amplified fine regolith dots, so the `2 x 2` `4096` tiles were generated directly from the `2048`-upsampled smoothed parent subpatch quadrants (`out/work/prod/p2/tiles-smooth-2048/in-{tl,tr,bl,br}.png`), using `mars-hero.png` alone on the mostly flat northern plateau quadrants (`tl`, `tr`) so canyon cliffs from `mars-close.jpg` were never hallucinated onto smooth plains, and both `[mars-hero.png, mars-close.jpg]` on the canyon-rich southern quadrants (`bl`, `br`).
2. Exact prompt for `tr` (`tile-tr-take-4.png`, inputs `[out/work/prod/p2/tiles-smooth-2048/in-tr.png, references/approved/mars-hero.png]`):
   ```text
   Strict super-resolution of Image 1, a top-down 90-degree nadir planetary surface map quadrant of Mars just north of Valles Marineris (1:1 square, north at the top).

   EXACT LAYOUT AND BRIGHTNESS LOCK:
   Image 1 is the exact low-resolution base map tile to sharpen in place. When downscaled back to Image 1's true resolution, EVERY region, smooth dust plain, wispy dust cloud, dark basin in upper-right, bright canyon rim, and lower canyon scarp MUST match Image 1 in position, shape, and brightness.
   - Smooth rust and ochre plains MUST stay smooth plains (NEVER carve new canyons, valleys, cliffs, or plateaus onto smooth plains).
   - Existing wispy pale dust clouds stay wispy dust clouds at the same brightness.

   FINE GEOLOGIC DETAIL TO RESOLVE (matching Image 2 approved Mars orbital frame):
   Replace only the blur of Image 1 with crisp, coherent Martian surface detail:
   - Across smooth plateaus: smooth wind-swept regolith, subtle aeolian dust streaks, faint wrinkle ridges, and sparse crisp tiny circular impact craters (never noisy gravel stippling).
   - Along ONLY the existing canyon rims and scarps (along the bottom edge and upper-right chasma bay): razor-sharp scalloped canyon rims, finely gullied rock cliff walls in rust and dark burgundy, talus slopes, and crisp local shadows cast from upper-left (azimuth -47 degrees, elevation 28 degrees) toward lower-right.

   Strict nadir map texture edge to edge. No border, no vignette, no horizon, no sky, no stars, no text, no watermark.
   ```
3. Exact prompt for `bl` and `br` (`tile-bl-take-4.png`, `tile-br-take-4.png`, inputs `[out/work/prod/p2/tiles-smooth-2048/in-<tag>.png, references/approved/mars-hero.png, references/approved/mars-close.jpg]`):
   ```text
   Top-down orthographic planetary surface map tile of Valles Marineris on Mars, 1:1 square, north at the top, straight-down 90-degree nadir view filling the entire frame edge to edge.

   REFERENCE IMAGES:
   - Image 1 is the exact low-resolution base map tile to super-resolve in place. Keep every canyon wall, dark trough, smooth plateau, ridge, crater, and color region in its exact position, scale, and brightness from Image 1. Nothing may shift, rotate, resize, appear, or vanish, and dark canyon troughs must stay dark (never fill dark troughs with white fog).
   - Image 2 is the approved Mars orbital frame from the same film, defining the rich rust, ochre, crimson, and dark basalt color grade.
   - Image 3 is the approved Valles Marineris close frame from the same film, defining the close rock material, dark burgundy and iron-red cliff stratigraphy, fluted wall gullies, landslide aprons, and flat mesas.

   SURFACE DETAIL AND LIGHT:
   Replace only the blur of Image 1 with crisp, physically convincing high-resolution Martian geology seen straight from above (no noisy stipple dots): stepped parallel fault scarps, razor-sharp canyon rims, finely gullied cliff faces exposing layered rust and dark burgundy strata, overlapping landslide fans and talus aprons at the base of the walls, fractured mesa tops, smooth wind-streaked plateaus with sparse crisp small impact craters, and subtle wispy texture inside existing pale canyon bands. Local canyon relief is lit by one directional Sun from the upper-left (north-west, azimuth -47 degrees, 28 degrees above the horizon), so cliff rims cast coherent dark cool shadows toward the lower-right (south-east) and opposing walls facing upper-left catch warm amber sunlight.

   Strict nadir map texture only. No horizon, no sky, no stars, no vignette, no border, no text, no watermark.
   ```
4. Exact prompt for `tl` (`tile-tl-take-5.png`, inputs `[out/work/prod/p2/tiles-smooth-2048/in-tl.png, references/approved/mars-hero.png]`; ASCII `--` shown below in place of one dash character to keep repo files ASCII-clean):
   ```text
   Strict 4x super-resolution of Image 1, the top-left quadrant of an orthographic top-down 90-degree nadir planetary surface map of Mars just north of Valles Marineris (1:1 square, north at the top).

   CRITICAL PIXEL-LOCKED RULE:
   Image 1 is the exact base map tile. When downscaled back to Image 1's resolution, EVERY region MUST match Image 1 in position, shape, and brightness:
   - The entire upper two-thirds of Image 1 consists ONLY of smooth dusty plains and soft wispy ochre dust clouds. Keep the entire upper two-thirds completely free of canyons, valleys, scarps, or gullies -- render ONLY smooth wind-swept Martian regolith, subtle aeolian streaks, soft translucent dust cloud wisps, and sparse tiny circular impact craters.
   - ONLY along the bottom-quarter band of Image 1 (where the bright and dark canyon scarp already exists in Image 1): resolve razor-sharp scalloped canyon rims, finely gullied rust and dark burgundy cliff walls, talus slopes, and pale floor haze matching Image 2 (approved Mars orbital frame), lit from the upper-left (azimuth -47 degrees, elevation 28 degrees).

   Strict nadir map texture edge to edge. No border, no vignette, no horizon, no sky, no stars, no text, no watermark.
   ```
5. **Takes and selection** (at most 6 takes per quadrant):
   - `tl`: 6 takes total; kept `tile-tl-take-5.png` (`PSNR 29.865 dB | SSIM 0.900465 | Flow median 0.0510 px | p99 0.3931 px | max 1.2567 px`, `PASS`; chosen over take 6 for lower max flow `1.26 px` vs `2.13 px`; takes 1 to 4 failed `p99 <= 1.5 px` due to false scarps on the upper dust plain).
   - `tr`: 4 takes total; kept `tile-tr-take-4.png` (`PSNR 20.773 dB | SSIM 0.864395 | Flow median 0.1502 px | p99 0.8489 px | max 1.5617 px`, `PASS`; takes 1 to 3 failed `p99 <= 1.5 px`).
   - `bl`: 4 takes total; kept `tile-bl-take-4.png` (`PSNR 25.828 dB | SSIM 0.825719 | Flow median 0.1408 px | p99 0.6088 px`, `PASS`; chosen over earlier passing takes for cleaner landslide aprons and zero stipple).
   - `br`: 4 takes total; kept `tile-br-take-4.png` (`PSNR 25.390 dB | SSIM 0.835785 | Flow median 0.1339 px | p99 0.6273 px | max 1.0557 px`, `PASS`; highest PSNR and cleanest fluted canyon walls).
6. Assembled with `tile_assemble.py assemble --lock-sigma-px 36`, ran `tile_assemble.py match-parent` against `p2-clean-484.png` (`--feather 0.12 --sigma-in-px 96 --sigma-edge-px 24`), nested `patch-3` (`3` deg, `feather = 0.12`) into `patch-2`, and exported `full` (`4096`) and `web` (`2048`) JPEGs.
7. **Checks passed on final `public/assets/mars/full/patch-2.jpg`**:
   - `checkmoved.py` vs `484 x 484` parent subpatch (`p2-clean-484.png`): `PSNR 31.138 dB | SSIM 0.868673 | Flow median 0.0969 px | p99 0.3879 px | max 0.9710 px (PASS)`.
   - Nested consistency (`patch-1` central `12` deg at `967 x 967` vs downscaled `patch-2`): core `PSNR 40.315 dB` (`RMS 2.459 / 255`), full `PSNR 34.675 dB` (`RMS 4.707 / 255`).

---

## Asset 3: `public/assets/mars/<set>/patch-3.jpg`

- **Output files**:
  - `public/assets/mars/full/patch-3.jpg` (`4096 x 4096`, JPEG quality `94`, `subsampling=0`)
  - `public/assets/mars/web/patch-3.jpg` (`2048 x 2048`, JPEG quality `94`, `subsampling=0`, Lanczos downscale of `full`)
- **Angular width**: `3.0` degrees centered on `lon = -81.86, lat = -4.54`.
- **Tools and models**:
  - `assets-src/mars/patches/resample.py` (`subpatch`)
  - `generate_image` with model `nano_banana_pro` (`aspect_ratio = "1:1"`, `2048 x 2048` output)
  - `tools/ml/upscale.py` (`swin2sr-lightweight-x2.onnx` 2x super-resolution for localized sand-streak patch on `br`)
  - `assets-src/mars/patches/tile_assemble.py` (`split`, `assemble`, `match-parent`)
  - `tools/ml/checkmoved.py` (alignment verification)
- **Input files**:
  - Central `3` deg subpatch extracted from `p2-4096-matched-final.jpg` at `1020 x 1020` (`out/work/prod/p3/p3-in-1020.png`), `510 x 510` (`out/work/prod/p3/p3-in-510.png`), and `558 x 558` quadrant tiles (`out/work/prod/p3/tiles-in-558/in-{tl,tr,bl,br}.png`)
  - `references/approved/mars-close.jpg` (primary close-range canyon wall, burgundy/rust strata, and pale floor mist style target)
  - `references/approved/mars-hero.png` (orbital Mars palette continuity)

### Step 3A: `2048 x 2048` Global Reference Pass

1. Ran `generate_image` (`model: "nano_banana_pro"`, `aspect_ratio: "1:1"`) on `[out/work/prod/p3/p3-in-510.png, references/approved/mars-hero.png, references/approved/mars-close.jpg]` with exact prompt:
   ```text
   Strict 4x super-resolution of Image 1 (510x510), a top-down 90-degree nadir planetary surface map of the Valles Marineris dive spot on Mars (3 x 3 degrees, 1:1 square, north at the top).

   EXACT LAYOUT AND BRIGHTNESS LOCK:
   Image 1 is the exact input map. When downscaled back to 510x510, every single pixel region, curved canyon rim in upper-left, narrow dark gullied scarp in middle-right, sweeping pale cream-ochre canyon-floor mist band across the center, flat southern plateau, dark wind streak, and every small crater MUST match Image 1 in exact position, shape, and brightness (>32 dB PSNR, <0.5 px optical flow). Do NOT carve new canyons, do NOT widen cliff walls, do NOT add dark rocks into smooth pale mist, and do NOT shift any feature.

   CLOSE-RANGE MARTIAN GEOLOGY AND DIRECTIONAL LIGHT (matching Image 3 approved Valles Marineris close view and Image 2 approved Mars orbital view):
   Add razor-sharp close-range geological micro-structure strictly inside existing features of Image 1:
   - Inside existing dark burgundy and rust cliff slopes and scarps: crisp horizontal sedimentary and basalt rock strata in deep dark burgundy, charcoal, iron rust, and burnt sienna; finely spaced fluted wall gullies; stepped fault ledges; eroded rock mesas; and striated landslide/talus aprons at slope bases, lit from the upper-left (azimuth -47 degrees, 28 degrees elevation) with shadows toward the lower-right.
   - Inside the existing sweeping pale cream-ochre canyon-floor mist band across the middle: delicate, translucent, ground-hugging sheets and wispy ribbons of pale canyon-floor mist at the exact brightness and shape of Image 1.
   - Across existing flat rust plateaus: smooth wind-swept regolith, subtle aeolian streaks, and crisp rims on existing tiny craters.

   Strict orthographic nadir map texture edge to edge. No horizon, no sky, no stars, no border, no text, no watermark.
   ```
2. **Takes and selection**: 2 takes generated (`global-take-1.png`, `global-take-2.png`). Kept `global-take-1.png` (`PSNR 34.429 dB | SSIM 0.928627 | Flow median 0.0560 px | p99 0.3109 px | max 0.6531 px`, `PASS` vs `27.493 dB` on take 2).

### Step 3B: Overlapping `2 x 2` Tile Pass to `4096 x 4096`

1. Exact prompt for `tl` (`tile-tl-take-2.png`, inputs `[out/work/prod/p3/tiles-in-558/in-tl.png, references/approved/mars-close.jpg, references/approved/mars-hero.png]`):
   ```text
   Strict 4x super-resolution of Image 1, a top-down 90-degree nadir planetary surface map tile of Valles Marineris on Mars (1:1 square, north at the top).

   EXACT LAYOUT AND BRIGHTNESS LOCK:
   Image 1 is the exact input map (558x558). When the output is downscaled back to 558x558, every single pixel region, canyon rim, cliff slope, dark shadow shape, bright lit scarp, pale canyon-floor mist band, flat plateau, and every small crater MUST match Image 1 in exact position, boundary width, shape, and brightness.
   - Do NOT widen or extend cliff walls onto adjacent flat plateaus.
   - Do NOT carve new canyons, fault benches, or craters where Image 1 is smooth.
   - Do NOT expand or move shadows or add fog over rust plains.

   FINE SUB-PIXEL GEOLOGICAL DETAIL TO ADD (matching Image 2 approved Valles Marineris close view and Image 3 approved Mars orbital view):
   Add razor-sharp close-range Martian geological micro-structure strictly INSIDE the existing features of Image 1:
   - Inside existing dark burgundy and rust cliff slopes and scarps: crisp horizontal sedimentary and basalt rock strata in deep dark burgundy, charcoal, iron rust, and burnt sienna; finely spaced fluted wall gullies; serrated fault ledges; eroded rock mesas; and striated landslide/talus aprons at slope bases, with crisp local canyon shadows from the upper-left (north-west, azimuth -47 degrees, 28 degrees elevation) toward the lower-right.
   - Inside the existing pale cream-ochre canyon-floor band: delicate, translucent, ground-hugging sheets and wispy ribbons of pale canyon-floor mist lying on the trough floor with dark burgundy rock bases subtly showing through, matching the mist in Image 2 while keeping the exact brightness and boundary of Image 1.
   - Across existing flat rust plateaus: smooth wind-swept regolith with subtle aeolian streaks and crisp rims ONLY on existing craters.

   Strict orthographic nadir map texture edge to edge. No horizon, no sky, no stars, no border, no text, no watermark.
   ```
2. Exact prompt for `bl` (`tile-bl-take-4.png`, inputs `[out/work/prod/p3/tiles-in-558/in-bl.png, references/approved/mars-hero.png, references/approved/mars-close.jpg]`):
   ```text
   Strict 4x super-resolution of Image 1 (558x558), a bottom quadrant of an orthographic top-down 90-degree nadir surface map of Valles Marineris on Mars (1:1 square, north at the top).

   CRITICAL PIXEL-LOCKED GEOMETRY RULE:
   Image 1 is the exact parent map tile. Every boundary, brightness, smooth plain, dark wind streak, and tiny crater MUST match Image 1 pixel-for-pixel when scaled back to 558x558. Never copy any cliff, bench, terrace, or canyon shape from Image 2 or Image 3.
   - TOP STRIP ONLY (top 20% of Image 1): where the pale cream-ochre canyon-floor mist band and small dark outcrops already exist in Image 1, resolve delicate translucent ground-hugging pale canyon-floor mist and crisp dark burgundy/rust rock outcrops matching Image 3 (approved close canyon view) at the exact brightness and position of Image 1.
   - ENTIRE LOWER 80% OF IMAGE 1: completely flat, smooth wind-swept Martian rust regolith matching Image 2 (approved Mars orbital view). NEVER add any cliff, fault scarp, terrace, bench, valley, ridge, or new crater anywhere in the lower 80%. Keep every existing tiny crater and dark sand streak in its exact pixel position and size.

   Strict nadir map texture edge to edge. No horizon, no sky, no stars, no border, no text, no watermark.
   ```
3. Exact prompt for `tr` and `br` (`tile-tr-take-5.png`, `tile-br-take-6.png`, inputs `[out/work/prod/p3/tiles-in-558/in-<tag>.png, references/approved/mars-hero.png, references/approved/mars-close.jpg]`):
   ```text
   Strict 4x super-resolution of Image 1 (558x558), a square quadrant of an orthographic top-down 90-degree nadir planetary surface map of Valles Marineris on Mars (1:1 square, north at the top).

   STRICT PIXEL-FOR-PIXEL FIDELITY:
   Image 1 is the exact input map to sharpen in place. When downscaled back to 558x558, EVERY pixel's brightness, color, and edge position MUST match Image 1 (>32 dB PSNR, <0.5 px optical flow everywhere):
   - Dark pixels stay dark, pale cream-ochre mist pixels stay pale cream-ochre mist (NEVER add dark rocks into smooth pale mist), and smooth rust plains stay smooth rust plains.
   - NEVER draw any horizontal split line, border, or seam, and NEVER copy or paste any cliff or rock shape from Image 2 or Image 3.

   NATURAL SUB-PIXEL MICRO-DETAIL (style from Image 2 approved Mars orbital view and Image 3 approved Valles Marineris close view):
   Replace only pixel blur with natural Martian micro-detail strictly inside existing features of Image 1:
   - Where dark fluted gullies and scarps ALREADY exist in Image 1: sharpen their fine gullies, dark burgundy and iron-rust rock strata, and talus slopes in their exact existing footprint, lit from upper-left (azimuth -47 degrees, 28 degrees elevation).
   - Where pale cream-ochre canyon-floor mist ALREADY exists in Image 1: keep it smooth, soft, translucent pale cream-ochre mist at the exact same brightness and shape.
   - Where smooth rust regolith and tiny craters ALREADY exist in Image 1: keep smooth wind-swept regolith and sharpen existing tiny crater rims in place.

   Seamless nadir map texture edge to edge. No seams, no horizon, no sky, no stars, no border, no text, no watermark.
   ```
4. **Takes and selection** (at most 6 takes per quadrant):
   - `tl`: 2 takes total; kept `tile-tl-take-2.png` (`PSNR 15.978 dB | SSIM 0.839246 | Flow median 0.1459 px | p99 0.9847 px | max 2.9245 px`, `PASS`; take 1 had `p99 = 2.38 px`).
   - `tr`: 6 takes total; kept `tile-tr-take-5.png` (`PSNR 34.732 dB | SSIM 0.937360 | Flow median 0.0306 px | p99 0.3489 px | max 0.8070 px`, `PASS`; takes 1 to 4 and 6 widened the middle scarp and failed `p99 <= 1.5 px`).
   - `bl`: 4 takes total; kept `tile-bl-take-4.png` (`PSNR 37.407 dB | SSIM 0.960864 | Flow median 0.0092 px | p99 0.3368 px | max 0.8074 px`, `PASS`; sharper and higher PSNR than take 3 at `25.159 dB`).
   - `br`: 6 takes total; `tile-br-take-6.png` was spotless across `97%` of the tile (`median flow 0.039 px`) except for a localized contrast drift on one faint aeolian sand streak in `[0..780, 1160..1780]` of `2240` tile space. Repaired that localized rectangle by running `python3 tools/ml/upscale.py --in out/work/prod/p3/br-streak-crop-512.png --out out/work/prod/p3/br-streak-swin-1024.png --width 1024` (`swin2sr-lightweight-x2.onnx` on crop `[928..1440, 1440..1952]` of `global-take-1.png`) and blending with a `sigma = 48 px` Gaussian feather to produce `tile-br-take-6-clean.png` (`PSNR 33.667 dB | SSIM 0.929681 | Flow median 0.0351 px | p99 0.7512 px`, `PASS`).
5. Assembled with `tile_assemble.py assemble --global-img out/work/prod/p3/global-take-1.png --lock-sigma-px 28` and matched to `out/work/prod/p3/p3-in-1020.png` (`--feather 0.12 --sigma-in-px 96 --sigma-edge-px 24`), then exported `full` (`4096`) and `web` (`2048`) JPEGs.
6. **Checks passed on final `public/assets/mars/full/patch-3.jpg`**:
   - `checkmoved.py` vs `510 x 510` parent subpatch: `PSNR 35.672 dB | SSIM 0.943830 | Flow median 0.0476 px | p99 0.3612 px | max 1.2860 px (PASS)`.
   - `checkmoved.py` vs `1020 x 1020` parent subpatch: `PSNR 34.561 dB | SSIM 0.923591 | Flow median 0.0430 px | p99 0.5399 px (PASS)`.
   - Nested consistency (`patch-2` central `3` deg at `1020 x 1020` vs downscaled `patch-3`): core `PSNR 41.954 dB` (`RMS 2.036 / 255`), full `PSNR 39.776 dB` (`RMS 2.617 / 255`).

---

## End-to-End Verification Summary

Running `python3 assets-src/mars/patches/verify.py --wrap out/work/wrap/stage1-color-4096.jpg` on the final delivered files:

- **Spot projection check**: `lon = -81.86, lat = -4.54` projects to `(1267.110, 855.387)` vs `(1267, 855)` (`0.402 px` error).
- **Nested consistency (`patch-1` vs `patch-2` at `967 x 967`)**: core `PSNR = 40.315 dB` (`RMS = 2.459 / 255`), full square `PSNR = 34.675 dB` (`RMS = 4.707 / 255`).
- **Nested consistency (`patch-2` vs `patch-3` at `1020 x 1020`)**: core `PSNR = 41.954 dB` (`RMS = 2.036 / 255`), full square `PSNR = 39.776 dB` (`RMS = 2.617 / 255`).
- **Low-frequency feather match (`patch-1` vs `stage1-color-4096.jpg` over outer `12%`, `sigma = 0.25` deg)**: `RMS = 0.00124` (`0.316 / 255`), `p99 = 0.993 / 255`, `max = 3.378 / 255`.
- **Provisional hero-calmed low-frequency match**: After the wrap map changed from `stage1-color-4096.jpg` to a direct light-curve-delit hero unprojection, all three patches (`full` and `web`) were matched with `python3 assets-src/mars/patches/bake.py --wrap out/work/wrap/hero-clean-wrap-4096.jpg --blur-deg 0.35`, calming the fiery orange region near `lon -65, lat 15` toward the hero's rust and burgundy while leaving all detail above `0.35` deg untouched and keeping feature alignment to the direct unprojected hero within `0.369 px` median / `0.941 px` p99 (`PASS`).
- **Re-matching all three patches and baking into the final `8192 x 4096` wrap**: `python3 assets-src/mars/patches/bake.py --wrap <8192-map> --blur-deg 0.35 --out <out-map>` (or `--blur-px <wrap-px>`, or `--patch <single-patch>`) re-matches `patch-1`, `patch-2`, and `patch-3` (`full` and `web`) to `--wrap` at the chosen blur radius while leaving patch detail above that radius untouched, and composites `patch-1` into `<out-map>` with the `0.12` smoothstep feather.
- **Simulated dive contact sheet**: 8 top-down views (`60.0, 33.429, 18.626, 10.377, 5.782, 3.221, 1.795, 1.0` degrees wide) blending wrap + `patch-1` + `patch-2` + `patch-3` with `0.12` smoothstep feather show zero visible patch edges and zero level-transition jumps; native `640 x 640` center and edge crops of all three `4096 x 4096` patches show crisp native detail and no text, watermark, border, logo, stray object, or baked stars.

## Hero re-match pass (lead, Phase 3)

Made by the Builder after delivery. `bake.py` matched the patches to the wrap by adding a low frequency difference in display values. On the hero-matched wrap that pushed canyon rims to clipped orange, which the tone curve turned into glowing edges. The shipped patches are re-matched with `rematch.py` and are not baked into the wrap.

- Tool: `python3 assets-src/mars/patches/rematch.py --wrap public/assets/mars/full/wrap-color.jpg --src-dir <folder with the agent's originals> --full-dir public/assets/mars/full --web-dir public/assets/mars/web --ceiling 4.5`, run from the repo root. No image model is used. The originals are the files at commit 5a9f247 on `agent/assets-mars-patches`.
- Steps: 1. Bring patch and wrap to scene-linear values through the inverse tone curve. 2. Multiply the patch by the ratio of the wrap's low frequencies to its own (0.35 degrees), so the patch keeps its fine detail and takes the wrap's regional color. 3. Tame highlights: detail brighter than 1.35 times its surroundings is compressed and capped at 1.9 times, with a hue preserving ceiling. 4. Back through the tone curve, saved as JPEG quality 94, 4:4:4, `web` by a 2x Lanczos downscale.
- Outputs: `public/assets/mars/full/patch-1.jpg`, `public/assets/mars/full/patch-2.jpg`, `public/assets/mars/full/patch-3.jpg` and the same three under `public/assets/mars/web/`.
- Use: `src/bodies/planet.ts` lays the levels over the wrap by gnomonic projection about the spot. Each level fades in only where the level under it has fewer than about 1.25 texels per screen pixel, so the hold frame shows the wrap alone.

## Ledger rows

None (no third-party files were downloaded; all three patches were generated from `assets-src/mars/wrap/stage1-color-4096.jpg` and styled from `references/approved/mars-hero.png` and `references/approved/mars-close.jpg`).
