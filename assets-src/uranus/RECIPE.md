# Uranus asset recipes

Every file under `public/assets/uranus/full/` has a twin under `public/assets/uranus/web/` made by the same script in the same run. Work files live under `out/work/u/` (not in git). All scripts run from the repo root. Shared geometry of the hold frame (camera, ellipsoid, pixel rays, tone curve) is in `assets-src/uranus/geo.py`.

Input made once for several assets: `out/work/u/hero-2x.png`, the approved hero at twice its size.
- Tool: `python3 tools/ml/upscale.py --in references/approved/uranus-hero.png --out out/work/u/hero-2x.png --width 5632` (the repo's upscaler, see `tools/ml/MODELS.md`). No prompt.

## wrap-color.jpg, wrap-cloud.png, light.bin, shade.bin

- Output: `wrap-color.jpg` (8192 x 4096 full, 4096 x 2048 web), `wrap-cloud.png` (cloud alpha in red, cloud shadow in green, same sizes), `light.bin` (513 x 128 x 4 float: light by sun cosine and view cosine), `shade.bin` (512 x 256 x 4 float: world-fixed light map).
- Tool: numpy, OpenCV and SciPy only, no model. Run in this order:
  `python3 assets-src/uranus/wrap/stage_a.py`, `stage_a2.py`, `stage_b.py`, `stage_c.py`, `stage_d.py`, `stage_e.py`.
- Inputs: `out/work/u/hero-2x.png`, `references/approved/uranus-hero.png`.
- Prompt: none.
- What each stage does:
  - `stage_a.py`: separates the bright cloud flecks and their bluish shadows from the globe (red channel against a median, inpainted base), fits the 513 knot light curve by sun cosine, writes `curve.json` with the sun direction, the band axis and the globe quaternion.
  - `stage_a2.py`: fits the light as a table over sun cosine and view cosine (view cosine over 0.05).
  - `stage_b.py`: unprojects the base image through the fitted ellipsoid to an equirectangular map in the band-axis frame. Albedo = hero / light. Fades the hero's pixels out between view cosine 0.34 and 0.14.
  - `stage_c.py`: zonal colour profile by latitude from the fully seen texels, mirrored north of 44 degrees; the unseen side is the zonal profile times eight octaves of streak noise stretched along the bands (warped 3D lattice noise sampled on the sphere, so there is no seam and no pinched pole) plus two tint fields. Divides the seen albedo by the low-pass (2.5 degrees) of albedo over fill and ships that low-pass as `shade.bin`, so the broad light structure of the hero stays fixed in space while the fine albedo turns. Night-side albedo is desaturated to 15 percent chroma and kept at 30 percent. Cloud map: the hero's flecks, plus a mirrored copy on the unseen side.
  - `stage_d.py`: writes both sets.
  - `stage_e.py`: replaces the light table rows below view cosine 0.2 by direct medians of hero over shipped albedo times shade, in bins across the last 6 percent of the disc radius.
- Take kept: the current run (deterministic, seeds fixed in the scripts).
- Checks: `python3 assets-src/uranus/check/disc.py STILL` (colour by cell within 4 percent of the hero, detail bands 0.80 to 0.99 of the hero's with correlation 0.74 to 1.00 at the review tier), `check/limb.py`, `check/crops.py`.

## halo.bin

- Output: `halo.bin`, 64 x 64 x 4 float: glow outside the disc by impact parameter 1.0 to 1.3 (square-root rows) and sun cosine at the grazing point.
- Tool: `python3 assets-src/uranus/halo/halo.py`. No model, no prompt.
- Input: `references/approved/uranus-hero.png`, `out/work/u/wrap/curve.json`.
- What it does: medians of the hero outside the fitted ellipsoid minus the far background (percentile 50 on the lit side inside 1.04, percentile 35 elsewhere, because stars lift the median), made monotone outward, the first rows on the night side held from 1.0055 so the hero's blurred disc edge is not counted twice.
- Checks: `check/limb.py STILL angles` beside the hero.

## miranda-color.jpg, miranda-height.bin, ariel-color.jpg, ariel-height.bin

- Output: colour 1536 x 768 (768 x 384 web), height uint16 of the same size.
- Tool: `python3 assets-src/uranus/moons/make.py`. Procedural: lattice noise and a crater field with a power-law size distribution, seeds fixed. No model, no prompt.
- Input: none. The grey level, the crater density and the light of each moon were set against crops of the hero (`check/crops.py STILL DIR miranda ariel`).
- Take kept: the current run.

## rings.bin

- Output: `rings.bin`: 81 ring lines as sampled 3D curves with amplitude (13 closed rings, 68 open arcs, 12,779 samples).
- Tool: `python3 assets-src/uranus/rings/trace.py` then `python3 assets-src/uranus/rings/build.py`. No model, no prompt.
- Input: `references/approved/uranus-hero.png`.
- What it does: `trace.py` unwraps the hero's residual (hero minus an oriented median that removes stars) in the fitted ring plane and tracks ridges. `build.py` gives each track of 25 degrees or more its own fitted plane and closes it into a ring with a floor amplitude on the unseen side; shorter tracks stay open arcs; amplitudes over 0.3 are halved above the knee. `rings/gain.json` must not exist (an abandoned calibration reads it).
- Checks: crops `ul`, `top`, `right`, `ll`, `lr` of `check/crops.py`.

## sky-hold.webp

- Output: `sky-hold.webp`, lossless, 3520 x 1980 full and 1760 x 990 web: the hero's own sky for the hold.
- Tool: `bash assets-src/uranus/sky/glow.sh` (renders the film's own glow on a black sky to `out/work/u/sky/glow.png`), delete `out/work/u/sky/along.npz`, then `python3 assets-src/uranus/sky/patch.py hold references/approved/uranus-hero.png out/work/u/sky/sky-fill-take1.png out/work/u/sky/glow.png public/assets/uranus`.
- Inputs: `references/approved/uranus-hero.png`, the film still, and one generated fill for the sky the globe hides: `out/work/u/sky/sky-fill-take1.png`.
- Fill: image generation tool of the workspace (`generate_image`, model `gpt_image_2_6_flare`, 16:9, reference image `references/approved/uranus-hero.png`), take 1 of 6, kept because the star field and the Milky Way continue behind the globe without a visible join. Prompt, exact:

  "Edit image 1. Remove the large pale cyan planet completely, remove the two small grey moons, remove every one of the thin hair-fine ring lines that circle the planet, and remove every trace of the planet's glow and atmosphere halo. Fill the area they covered with deep space that continues the surrounding sky exactly: the same dense field of fine, pinpoint, slightly colored stars, the same dusty Milky Way band with warm brown and gold dust clouds and small star clusters crossing diagonally behind where the planet was, the same near-black blue background, the same star sizes, density, brightness and grain. Keep everything else in the image unchanged: same framing, same stars in the same places, same exposure and color. No planet, no moon, no rings, no arcs, no lines, no sun, no glow, no nebula colors that are not already present, no text, no border."

- What `patch.py` does: deblocks the hero, subtracts the film's glow (shifted by the measured camera drift), removes the thin ring lines with an oriented median along the ring direction followed by an opening across radius, replaces the moons, the area behind the globe and the zone next to the limb by the fill plus the hero's stars, and encodes for the engine's sky patch (inverse tone curve, gain 1.6667 in `src/stops/uranus/sky.json`).
- Checks: `npm run compare -- --stop uranus --view hold --tier final`; crops of the sky beside the hero; frame 4035 before and after engine batch 2 was byte identical.
