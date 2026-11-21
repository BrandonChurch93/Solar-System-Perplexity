# Neptune assets

Every file exists in `public/assets/neptune/full/` and `public/assets/neptune/web/`. The prompts of every generated input are kept word for word as the tool calls in `assets-src/neptune/prompts/`. Rejected takes and intermediate files stay under `out/work/nep/`.

## public/assets/neptune/<set>/wrap.webp

- What: the globe map, 8192x4096 RGBA for `full`, 4096x2048 for `web`. RGB = cloud free deck albedo (sRGB of albedo times 0.5), A = cirrus opacity. Lossless alpha (`exact`), quality 92.
- Tools: `python3 tools/ml/upscale.py` (2x hero), then `assets-src/neptune/wrap/unproject.py`, `curves.py`, `sepmap.py`, `assemble.py`, in that order. `sepmap.py` also writes the cirrus light curve into `src/stops/neptune/curve.json`. After any change of `limb.veil*` in `src/stops/neptune/haze.json` run `sepmap.py` and `assemble.py` again.
- Inputs: `references/approved/neptune-hero.png`, `src/stops/neptune/fit.json`, `src/stops/neptune/haze.json`, and the generated tiles under `out/work/nep/gen/`.
- Hero side: the hero's own pixels, 2x, unprojected to the band aligned map, divided by the measured light curve and the limb veil, split into deck and cirrus by least squares against the cloud colour `(0.30, 0.39, 1.0)`. Hero pixels fade out below mu 0.42 and below ndl 0.2; the cirrus alpha is kept down to ndl -0.06 so the twilight clouds are the hero's.
- Far side: generated tiles, image tool model `seedream_5`, one take each. Reference inputs: `out/work/nep/wrap/ref-deck.jpg` (a crop of the separated hero deck in map space) and `out/work/nep/wrap/ref-cirrus.jpg` (a crop of the separated hero cirrus matte).
  - Deck: `deck-m0`, `deck-m2` (prompts in `prompts/tiles-1.js`), `deck-m1b` (`prompts/tiles-2.js`; it replaces `deck-m1`, whose bands bowed), polar caps `deck-n`, `deck-s` on a polar projection.
  - Cirrus: `cir-m0` to `cir-m2`, `cir-n`, `cir-s` (`prompts/tiles-1.js`), `cir-m3` to `cir-m5` (`prompts/tiles-2.js`).
  - Only the detail of a deck tile is used (log ratio to an anisotropic low pass, clamped). Its colour comes from the hero's zonal median profile, so tiles cannot differ in colour and there is no seam. Cirrus tiles cross-fade by maximum.
- Takes: 1 of 6 for every tile, 2 for the middle deck tile.
- Checks: recomposite error against the hero in the well lit part, mean 2.48 of 255; disc medians of the judged hold within 3 percent of the hero for ndl 0.1 to 0.8 (`check/ratio.py`). Still to check from the rise angle: the seam at lon 180, the poles, the lighter lens of the hero inset.

## public/assets/neptune/<set>/triton.jpg

- What: Triton's colour map, 4096x2048 (`web` 2048x1024).
- Tool: image tool, then `python3 tools/ml/upscale.py --in out/work/nep/gen/triton-map-t3.png --out out/work/nep/gen/triton-map-t3-2x.png --width 4096`, then `python3 assets-src/neptune/triton/make.py` (seam mirror blend, poles smoothed to the zonal mean, saturation 0.3, contrast 1.25, colour wash to the hero's cap and plains).
- Input: `out/work/nep/triton-ref.jpg`, a crop of Triton from `references/approved/neptune-hero.png`.
- Prompts: take 1 in `prompts/tiles-2.js` (`triton-map`, model `seedream_5`), takes 2 (`seedream_5`) and 3 (`gpt_image_2_6_flare`) in `prompts/triton-2-3.js`.
- Take kept: 3 of 6. Take 1 had smooth empty areas, so takes 2 and 3 asked for dense texture everywhere (the ending passes Triton at close range). Takes 2 and 3 were compared side by side in crops and take 3 was chosen.
- Checks: hero cap sRGB (188, 173, 173) and plains (193, 193, 199) against the film crop `out/work/nep/triton-cmp.jpg`.

## public/assets/neptune/<set>/sky-hold.webp

- What: the sky patch of the hold, 3520x1980 lossless (`web` 1760x990): the hero's own sky with margin 0.125.
- Tool: `python3 assets-src/neptune/sky/patch.py hold references/approved/neptune-hero.png out/work/nep/sky/fill-t1.png out/work/nep/sky/glow-only.png public/assets/neptune`.
- Inputs: the hero; `out/work/nep/sky/glow-only.png`, a review still of frame 4605 rendered with `sky.json` gain 0 (the film's own glow, ring off); the generated fill `out/work/nep/sky/fill-t1.png`.
- Fill: image tool model `gpt_image_2_6_flare`, input the hero, prompt in `prompts/sky-fill.js`. Take 1 of 6, kept: it continues the band behind the globe and keeps the hero's stars in place outside it.
- What the script does: sky = hero minus the film's glow. The hero's own sky is used from 1.07 radii out, except under Triton, the ring and the film's glow. Elsewhere the fill, with its low frequencies matched to the hero. Outside the disc the hero's own stars replace the fill's. The margin is a mirrored sky with the Sun removed.
- Checks: the radial blue medians round the Sun equal the hero's at the review tier; no rim where the patch meets the one sky at the fixed sky aim.

## public/assets/neptune/<set>/ring.png

- What: the ring's brightness map in ring coordinates (radius 1.28 to 1.92 by azimuth), measured, not generated.
- Tool: `python3 assets-src/neptune/ring/map.py out/work/nep/ring/noring.png public/assets/neptune out/work/nep/ring/withring.png`.
- Inputs: the hero; a review still of frame 4605 with the ring off (`noring.png`); a second still rendered with the first pass map (`withring.png`) for the residual pass.
- What the script does: hero minus the film without the ring, unwrapped into the fitted ring plane (`look.ring.normal`, `centre`), stars removed, strands kept with gain 2.2. Where the hero does not show the ring (behind the globe, outside the frame) the map continues the measured azimuth profile.
- Checks: ring annulus medians within 5 percent of the hero by azimuth. Shimmer is checked in the hold sheet at the review tier; the map is filtered with mipmaps and the sheet term is analytic.

## public/assets/neptune/<set>/close-deck.webp, close-cloud.webp, close-deck-wide.webp, close-cloud-wide.webp, close-height.png

The five maps are `public/assets/neptune/<set>/close-deck.webp`, `public/assets/neptune/<set>/close-cloud.webp`, `public/assets/neptune/<set>/close-deck-wide.webp`, `public/assets/neptune/<set>/close-cloud-wide.webp` and `public/assets/neptune/<set>/close-height.png`.

- What: the terrain view. `references/approved/neptune-close.jpg` is projected from its fitted camera onto a sphere and split into a blue deck, a raised cloud layer and a shadow factor, so the clouds have parallax against the deck, cast a moving shadow and stream along the band.
  - `close-deck.webp` 5632x3168 (`web` 2816x1584): the deck inside the approved frame, clouds removed, shadows divided out.
  - `close-cloud.webp` 5632x3168 RGBA: cloud colour and opacity inside the approved frame.
  - `close-deck-wide.webp`, `close-cloud-wide.webp` 4096x2304 (`web` 2048x1152): the same two layers on a canvas 1.75 times as wide and tall as the approved frame (same top edge), for everything the flight sees outside the approved frame.
  - `close-height.png` 2048x1152 (`web` 1024x576) on the wide canvas: R = cloud top height (0 to 1 of the slab), G = shadow factor on the deck.
- Tools, in order:
  1. `python3 assets-src/neptune/terrain/horizon.py 30` fits the horizon of the approved image and writes `src/stops/neptune/close.json` (pitch 20.63, roll -9.54, radius 41.81 camera heights, rms 0.029 degrees).
  2. `python3 tools/ml/upscale.py --in references/approved/neptune-close.jpg --out out/work/nep/terrain/close2x.png --width 5632`.
  3. `python3 assets-src/neptune/terrain/guide.py` writes `out/work/nep/terrain/guide.png`: the approved image in its place on the wide canvas, flat blue below the model horizon and black above it elsewhere.
  4. Image tool, prompts word for word in `prompts/canvas.js`, input `guide.png`: `canvas-t1` (model `gpt_image_2_6_flare`, 1672x941) and `canvas-t2` (model `seedream_5`). Take 1 of 6 kept: its centre stays on the approved image to 0.7 px. Take 2 rejected: it redrew and warped the centre.
  5. Image tool, prompt in `prompts/clean.js`, model `gpt_image_2_6_flare`: the clouds and their shadows removed. `clean-canvas-t1` (input `out/work/nep/terrain/canvas-base.png`, the approved image pasted into take 1) kept, take 1 of 6. `clean-centre-t1` (input the approved image) rejected: it enlarged the storm.
  6. `python3 tools/ml/upscale.py --in out/work/nep/terrain/canvas-t1.png --out out/work/nep/terrain/canvas-t1-2x.png --width 3344`.
  7. `python3 assets-src/neptune/terrain/layers.py` writes the five files.
- What `layers.py` does: the generated canvas is matched to the approved image (histogram match per channel inside the approved frame, then a smooth log gain taken at the frame border and carried outward), and the approved image is pasted in with a 14 px feather. The clean plate is scaled to the canvas where there is neither cloud nor shadow. Cloud opacity = how far the red to blue ratio rises from the clean plate toward white (`WHITE 0.9`, `MARGIN 0.07`). Shadow factor = smoothed luminance ratio to the clean plate near clouds with a dead zone of 0.1. Deck = image divided by the shadow factor outside clouds, the clean plate under clouds. Cloud colour is solved so that deck times shadow under cloud gives the image back. Height = blurred opacity times cloud brightness.
- Checks: recomposite error against the canvas, mean 0.22 of 255, p99 6; against the 2x approved image, mean 0.24, p99 6. The judged frame 4860 beside the approved image in `npm run compare -- --stop neptune --view terrain`.

## public/assets/neptune/<set>/close-glow.png and public/assets/neptune/<set>/sky-terrain.webp

- What: `close-glow.png` 512x64 is the blue glow above the horizon of the approved close image, unwrapped by azimuth about the nadir (80 degrees wide) and by height above the horizon (0 to 0.012 radii), stars removed. `sky-terrain.webp` 3520x1980 lossless (`web` 1760x990) is the sky of the approved close image without that glow, with margin 0.125.
- Tool: `python3 assets-src/neptune/sky/terrain.py` (no generation). Inputs: the approved close image and `src/stops/neptune/close.json`.
- What the script does: block grid removed, scene values, glow = smooth part above the far sky level, 30th percentile along azimuth so no star or cloud of the Milky Way gets into it. Sky = image minus glow; within 0.3 of the glow height the smooth part is taken from higher up so no line stays at the horizon. Below the horizon the sky is mirrored about the horizon, because the planet's turn moves the stars against the horizon by a few degrees during the view.
- Checks: frames 4770 and 4949 at the review tier show no line in the sky where the horizon was.

## public/assets/neptune/<set>/standin-wrap.jpg and public/assets/neptune/<set>/standin-close.jpg

- What: the stand-in maps the kit made with `python3 tools/assets/standin.py` before this stop was built. The stop no longer reads them. They stay until the Builder removes the stand-in set.
