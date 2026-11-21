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

## deck-color.jpg, deck-far.jpg, deck-height.bin, deck-light.bin, deck-halo.bin

- Output: `deck-color.jpg` (the wide plate of the close image, 8192 x 4608 full, 4096 x 2304 web), `deck-far.jpg` (4096 x 2048, log-polar albedo of the deck over 360 degrees round the nadir), `deck-height.bin` (float cloud height on the plate), `deck-light.bin` (384 x 256 x 4 float: deck light by view cosine and azimuth from the Sun), `deck-halo.bin` (384 x 128 x 4 float: the thin glow above the limb), and `src/stops/uranus/deck.json` (sizes, plate window, regulariser).
- Tools: `python3 assets-src/uranus/terrain/fit.py` (camera, horizon and Sun of the close image, writes `terrain/fit.json`), `python3 assets-src/uranus/terrain/plate.py`, `python3 assets-src/uranus/terrain/build.py`. Geometry shared by all of them is in `terrain/tgeo.py`.
- Inputs: `references/approved/uranus-close.jpg`; `out/work/u/t/close-2x.png` (`python3 tools/ml/upscale.py --in references/approved/uranus-close.jpg --out out/work/u/t/close-2x.png --width 5632`); one generated outpaint, `out/work/u/t/plate/plate-take3.png`, and its upscale (`python3 tools/ml/upscale.py --in out/work/u/t/plate/plate-take3.png --out out/work/u/t/plate/plate-take3-2x.png --width 5632`).
- Outpaint (asset `deck-plate`, 3 of 6 takes used): the close image at 1 / 1.8 of its size is placed at x 626 to 2190, y 0 to 880 of a 2816 x 1584 canvas, the rest is flat magenta (`out/work/u/t/plate/canvas.png`). Image generation tool of the workspace (`generate_image`), 16:9.
  - Take 1, model `seedream_5`, canvas plus the close image as a style reference: rejected, it redrew the frame to fill the canvas.
  - Take 2, model `nano_banana_pro`, canvas only: rejected, it moved the Sun.
  - Take 3, model `seedream_5`, canvas only: kept. Optical flow of the centre against the original has a median of 0.085 px, the horizon continues as one arc, the deck darkens toward the viewer.
  - Prompt of takes 2 and 3, exact:

  "This canvas holds a finished film frame in its upper middle: a view from high above the cloud deck of the ice giant planet Uranus, with the curved horizon, a low Sun and thin ring arcs. Around it, a strip on the left, a strip on the right and a wide band along the bottom are painted flat magenta: those areas are empty and must be painted now. Outpaint: extend the film frame into all magenta areas, as the same camera with a much wider lens would see the scene from the same place. Keep the film frame where it is, at the size it has, in the upper middle of the canvas: do not enlarge it, do not move it, do not redraw it to fill the canvas. The planet's curved horizon with its thin bright cyan glow continues as one unbroken smooth arc: it keeps rising gently into the left strip and keeps falling into the right strip. Above the horizon in both strips: black space with small sparse stars and the faint thin ring arcs continuing. Below the horizon everywhere: the same smooth pale cyan and deep teal haze deck continues without a break, with long soft parallel streaks and bands of haze running in the same direction as in the frame, and a few thin white wispy cloud streaks. The light stays the same: the low Sun near the horizon on the right, so the deck is brightest near the horizon on the right and falls off toward the viewer and toward the left into deep dark blue teal night where only faint soft streaks show. The bottom band is the darkest, nearly black teal at the lower left and slightly lighter at the lower right. The new areas meet the edges of the frame without any seam and continue each streak and cloud that touches an edge, with the same grade, palette, softness, haze and fine film grain. No magenta left anywhere. No second planet, no second Sun, no moon, no land, no ocean waves, no city lights, no text, watermark, border, frame line, logo or extra objects. 16:9."

- What `plate.py` does: matches the tone of the take to the original (gain median `[0.905, 0.938, 0.876]`, local near the footprint, global beyond 320 px), warps the limb in the side strips onto the fitted horizon (up 15 px at the left edge, 39 px at the right edge, zero at the seams), puts the original pixels back in the centre with a feather of 6 to 40 px, gives the near-black areas one fixed teal chroma and a floor so noise does not turn into colour, and writes `out/work/u/t/plate/wide.png` (8192 x 4608, covers -1.8 to 1.8 frame widths and -2.6 to 1.0 frame heights of the close camera) and `wide-canvas.png`.
- What `build.py` does: light table by view cosine and Sun azimuth from medians of the plate, extended periodically per row; albedo = `(plate + 0.005) / (light + 0.005)`; halo table = the limb glow only (background at 6 to 12 degrees subtracted, tapered 3 to 7 degrees); far map = low frequencies of the real albedo continued round the full circle plus synthesised streaks along the measured streak direction (140.9 degrees), colour fitted on lit pixels; height from the luma of the wisps.
- Take kept: the current run (deterministic).
- Checks: `npm run compare -- --stop uranus --view terrain --tier final`, terrain sheet `npm run sheet -- --segment uranus.terrain`.

## deck-rings.bin

- Output: `deck-rings.bin`: 36 ring lines as sampled 3D curves with amplitude (21,503 samples), and `src/stops/uranus/deck-rings.json` (centre, scale).
- Tool: `python3 assets-src/uranus/terrain/ringfit.py` then `python3 assets-src/uranus/terrain/rings.py`. No model, no prompt.
- Input: `references/approved/uranus-close.jpg`.
- What it does: `ringfit.py` fits one 3D circle set (centre, normal, radius; rms 1.26 px) to the ring arch of the close image and writes `terrain/ringfit.json` and the unwrap; `rings.py` tracks the ridges in the unwrap and writes them as 3D lines in the terrain frame. Drawn by the same `Rings` class as the orbit view, so the arcs are real geometry and move against the sky.
- Checks: `python3 assets-src/uranus/check/arcs.py STILL` (line energy film over image 1.11, width at half height 3 rows in both).

## sky-terrain.webp

- Output: `sky-terrain.webp`, lossless, 3520 x 1980 full and 1760 x 990 web: the sky of the close image for the terrain view.
- Tool: `bash assets-src/uranus/sky/terrain.sh` (renders the film's own glow on a black sky to `out/work/u/sky/t/glow.png` and the one sky alone to `out/work/u/sky/t/sky.png`, then restores the stop files), then `python3 assets-src/uranus/sky/terrain.py references/approved/uranus-close.jpg out/work/u/sky/t/glow.png out/work/u/sky/t/sky.png public/assets/uranus`. No model, no prompt.
- What it does: close image minus the film's glow in scene values; the thin ring lines are removed in the unwrap of the fitted ring plane (thin part across radius, coherent along the ring); from 12 to 46 px above the fitted horizon upward the image's sky is kept, below that the one sky plus the image's veil round the Sun; a mirrored margin of 12.5 percent.
- Checks: the compare above; `check/arcs.py`.

## patch-1.jpg to patch-4.jpg

- Output: `public/assets/uranus/<set>/patch-1.jpg` to `patch-4.jpg`, 4096 px square in `full`, 2048 px in `web`, and the table `src/stops/uranus/patches.json`.
- Tool: `npx tsx assets-src/uranus/dive/spot.ts` (writes `assets-src/uranus/dive/spot.json`: the dive spot in the frame of the wrap, its latitude, the heading, the unit of the terrain view), then `python3 assets-src/uranus/dive/patches.py` (`preview` as first argument writes only centre crops to `out/work/u/dive/`). No model, no prompt.
- Inputs: `out/work/u/wrap/wrap-albedo.npy` (the float albedo of the wrap, written by `wrap/stage_c.py`), `assets-src/uranus/dive/spot.json`.
- What it does: four nested gnomonic patches centred on the dive spot, 76, 42, 22 and 11 degrees wide (2.0, 4.1, 8.1 and 16.3 times the density of the 8192 px wrap, so no level is more than twice its parent). Each is the wrap albedo resampled (bicubic) times `exp(detail)`: six octaves of streak and billow noise stretched along the parallels, from a wavelength of 0.284 terrain units down, each octave present only where it is at least two texels wide so a level low-passed equals its parent, plus sparse pale streak wisps. Coded with the film curve like the wrap.
- Designed with `npx tsx assets-src/uranus/dive/predict.ts dive|rise` (zoom needed over the wrap per frame) and checked with `npx tsx assets-src/uranus/dive/softfit.ts dive|rise` (soft fraction per frame with the patch table).
- Takes: 1 (grain of one band, stretch 7, finer octaves turned 51 degrees) rejected, it read as brushed fabric; 2 (ridged wisps) rejected, short curled strokes; 3 kept: stretch 14, curl 0.18, wisps 36 to 1.3 at weight 0.22.
- Checks: the texels view at frames 4129, 4137, 4146 and 4154 shows no soft pixel; `npm run measure -- --stop uranus --only G13`.

## Files

Every file the set loads, in both sets (`<set>` is `full` or `web`), with the section above that makes it.

- `public/assets/uranus/<set>/ariel-color.jpg`: section "miranda-color.jpg, miranda-height.bin, ariel-color.jpg, ariel-height.bin"
- `public/assets/uranus/<set>/ariel-height.bin`: section "miranda-color.jpg, miranda-height.bin, ariel-color.jpg, ariel-height.bin"
- `public/assets/uranus/<set>/deck-color.jpg`: section "deck-color.jpg, deck-far.jpg, deck-height.bin, deck-light.bin, deck-halo.bin"
- `public/assets/uranus/<set>/deck-far.jpg`: section "deck-color.jpg, deck-far.jpg, deck-height.bin, deck-light.bin, deck-halo.bin"
- `public/assets/uranus/<set>/deck-halo.bin`: section "deck-color.jpg, deck-far.jpg, deck-height.bin, deck-light.bin, deck-halo.bin"
- `public/assets/uranus/<set>/deck-height.bin`: section "deck-color.jpg, deck-far.jpg, deck-height.bin, deck-light.bin, deck-halo.bin"
- `public/assets/uranus/<set>/deck-light.bin`: section "deck-color.jpg, deck-far.jpg, deck-height.bin, deck-light.bin, deck-halo.bin"
- `public/assets/uranus/<set>/deck-rings.bin`: section "deck-rings.bin"
- `public/assets/uranus/<set>/halo.bin`: section "halo.bin"
- `public/assets/uranus/<set>/light.bin`: section "wrap-color.jpg, wrap-cloud.png, light.bin, shade.bin"
- `public/assets/uranus/<set>/miranda-color.jpg`: section "miranda-color.jpg, miranda-height.bin, ariel-color.jpg, ariel-height.bin"
- `public/assets/uranus/<set>/miranda-height.bin`: section "miranda-color.jpg, miranda-height.bin, ariel-color.jpg, ariel-height.bin"
- `public/assets/uranus/<set>/patch-1.jpg`: section "patch-1.jpg to patch-4.jpg"
- `public/assets/uranus/<set>/patch-2.jpg`: section "patch-1.jpg to patch-4.jpg"
- `public/assets/uranus/<set>/patch-3.jpg`: section "patch-1.jpg to patch-4.jpg"
- `public/assets/uranus/<set>/patch-4.jpg`: section "patch-1.jpg to patch-4.jpg"
- `public/assets/uranus/<set>/rings.bin`: section "rings.bin"
- `public/assets/uranus/<set>/shade.bin`: section "wrap-color.jpg, wrap-cloud.png, light.bin, shade.bin"
- `public/assets/uranus/<set>/sky-hold.webp`: section "sky-hold.webp"
- `public/assets/uranus/<set>/sky-terrain.webp`: section "sky-terrain.webp"
- `public/assets/uranus/<set>/wrap-cloud.png`: section "wrap-color.jpg, wrap-cloud.png, light.bin, shade.bin"
- `public/assets/uranus/<set>/wrap-color.jpg`: section "wrap-color.jpg, wrap-cloud.png, light.bin, shade.bin"
