# Saturn asset recipes

Every file under `public/assets/saturn/` and how it is made. All scripts run from the repo root. Work files stay under `out/work/saturn/`.

## wrap-color.jpg (full 8192 x 4096, web 4096 x 2048)

- Tool: `python3 assets-src/saturn/wrap/light.py` then `python3 assets-src/saturn/wrap/build.py 12` (numpy, OpenCV). The 2x enlargement of the hero globe is `python3 tools/ml/upscale.py --in out/work/saturn/hero-globe.png --out out/work/saturn/hero-globe-2x.png --width 2304` (crop of the hero x 928..2080, y 200..1352).
- Inputs: `references/approved/saturn-hero.png`, `assets-src/saturn/fit.json`, `src/stops/saturn/curve.json`, `out/work/saturn/light-table.npy`.
- Prompt: none. No image model paints the globe.
- What it does: every hero pixel on the globe is put on the fitted spheroid and divided by the measured light (`light_at` in `wrap/geo.py`: curve by Sun cosine times the table by Sun cosine and latitude), which leaves albedo. Hero pixels are kept where the view cosine and the Sun cosine are high and no ring covers or shadows the globe. Elsewhere the map is the zonal albedo profile of the hero times a luminance detail tile cut from the hero's own bands, made periodic with 12 periods around the globe, so the far side has the same band structure and the same fine detail and no seam. The file stores sRGB of filmic(albedo); the shader decodes it with `inverseFilmic`.
- Take kept: the build after the light table (04:09 UTC). Earlier builds without the table left the terminator baked in.
- Checks: `python3 assets-src/saturn/check/ratio.py FILM OUT.jpg` on the judged hold: film over hero within about 0.2 stops for Sun cosine above 0 at every latitude. No pinched pole: the detail tile fades to the zonal profile above latitude 80.

## light.bin (48 x 41 RGBA float32, same file in both sets)

- Tool: `python3 assets-src/saturn/wrap/light.py`.
- Inputs: `references/approved/saturn-hero.png`, `assets-src/saturn/fit.json`.
- Prompt: none.
- What it does: iterates the zonal albedo and the light curve on hero pixels outside the rings and the ring shadow, then stores hero / (zonal albedo x curve) by Sun cosine (48 columns) and latitude (41 rows, row 0 is the south pole). Rows the hero does not show are mirrored from the north. Also writes `src/stops/saturn/curve.json` (33 knots) and `light.json`.
- Checks: residual with the table, median 0.99 to 1.01 in every range of Sun cosine, 10th and 90th percentile 0.84 to 1.16.

## rings.bin (full 32768 samples, web 16384, RGBA float32 with mip rows; two profiles)

- Tool: `python3 assets-src/saturn/rings/polar_view.py`, `rings/close_polar.py`, `rings/extract.py`, then `python3 assets-src/saturn/rings/build.py`. Azimuth gain: `python3 assets-src/saturn/rings/azimuth.py` writes `src/stops/saturn/azimuth.json`.
- Inputs: `references/approved/saturn-hero.png`, `references/approved/saturn-close.jpg`, `assets-src/saturn/fit.json`, `src/stops/saturn/close.json`.
- Prompt: none.
- What it does: both approved images are resampled to ring polar coordinates (radius by azimuth) with the fitted cameras. Columns are aligned and the median over azimuth gives the radial colour profile of each image. Above the resolution of the images the profile is continued with band limited fine structure whose strength per octave is taken from the profile's own finest octave, so the rings resolve into thousands of bands in the dive. Colour is stored in display space (filmic), alpha is coverage. Row 0 holds the profile, the following rows its mips (box filtered), so the shader can pick the level from the radial footprint and thin bands never alias.
- Checks: G13 on every dive and rise frame; ring display means against both approved images with `check/contrast.py`.

## sky-hold.webp (full 3520 x 1980, web 1760 x 990, lossless)

- Tool: `python3 assets-src/saturn/sky/patch.py hold references/approved/saturn-hero.png out/work/saturn/sky-fill-hero-take1.png out/work/saturn/halo-only.png` (numpy, OpenCV), fill image from the workspace image tool.
- Model for the fill: `seedream_5`, 16:9, 2816 x 1584, reference image `references/approved/saturn-hero.png`.
- Prompt for the fill: "Edit image 1. Remove the ringed planet, its whole ring system and the small orange moon completely, and remove every trace of their glow and shadow. Fill the area they covered with deep space that continues the surrounding sky exactly: the same field of fine, pinpoint, slightly colored stars, the same faint dusty Milky Way band crossing the frame, the same near-black blue background, the same star sizes, density, brightness and grain. Keep everything else unchanged: same framing, same stars in the same places, same exposure and color. No planet, no rings, no moon, no sun, no glow, no nebula colors that are not already present, no text, no border. Wide 16:9 frame."
- What it does: where the hero shows sky, the patch is the hero minus the film's own glow (a render of the judged hold with the patch gain at 0, `halo-only.png`). Where the body, the rings or Titan cover the sky (mask from the fit: spheroid, ring annulus, moon circle, grown a little), the generated fill is used, scaled per channel and locally to the hero's sky. A mirrored margin of 12.5 percent on every side lets the camera move in the hold.
- Take kept: take 1 of 1. The fill's stars match the hero's in size and density at native size and no trace of the planet is left.
- Checks: hero over film sky medians 1.7 to 1.95 at gain 1, so `sky.json` gain 1.85. No baked star in any other asset.
