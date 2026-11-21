# Neptune assets

Every file exists in `public/assets/neptune/full/` and `public/assets/neptune/web/`. The prompts of every generated input are kept word for word as the tool calls in `assets-src/neptune/prompts/`. Rejected takes and intermediate files stay under `out/work/nep/`.

## wrap.webp

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

## triton.jpg

- What: Triton's colour map, 4096x2048 (`web` 2048x1024).
- Tool: image tool, then `python3 tools/ml/upscale.py --in out/work/nep/gen/triton-map-t3.png --out out/work/nep/gen/triton-map-t3-2x.png --width 4096`, then `python3 assets-src/neptune/triton/make.py` (seam mirror blend, poles smoothed to the zonal mean, saturation 0.3, contrast 1.25, colour wash to the hero's cap and plains).
- Input: `out/work/nep/triton-ref.jpg`, a crop of Triton from `references/approved/neptune-hero.png`.
- Prompts: take 1 in `prompts/tiles-2.js` (`triton-map`, model `seedream_5`), takes 2 (`seedream_5`) and 3 (`gpt_image_2_6_flare`) in `prompts/triton-2-3.js`.
- Take kept: 3 of 6. Take 1 had smooth empty areas, so takes 2 and 3 asked for dense texture everywhere (the ending passes Triton at close range). Takes 2 and 3 were compared side by side in crops and take 3 was chosen.
- Checks: hero cap sRGB (188, 173, 173) and plains (193, 193, 199) against the film crop `out/work/nep/triton-cmp.jpg`.

## sky-hold.webp

- What: the sky patch of the hold, 3520x1980 lossless (`web` 1760x990): the hero's own sky with margin 0.125.
- Tool: `python3 assets-src/neptune/sky/patch.py hold references/approved/neptune-hero.png out/work/nep/sky/fill-t1.png out/work/nep/sky/glow-only.png public/assets/neptune`.
- Inputs: the hero; `out/work/nep/sky/glow-only.png`, a review still of frame 4605 rendered with `sky.json` gain 0 (the film's own glow, ring off); the generated fill `out/work/nep/sky/fill-t1.png`.
- Fill: image tool model `gpt_image_2_6_flare`, input the hero, prompt in `prompts/sky-fill.js`. Take 1 of 6, kept: it continues the band behind the globe and keeps the hero's stars in place outside it.
- What the script does: sky = hero minus the film's glow. The hero's own sky is used from 1.07 radii out, except under Triton, the ring and the film's glow. Elsewhere the fill, with its low frequencies matched to the hero. Outside the disc the hero's own stars replace the fill's. The margin is a mirrored sky with the Sun removed.
- Checks: the radial blue medians round the Sun equal the hero's at the review tier; no rim where the patch meets the one sky at the fixed sky aim.

## ring.png

- What: the ring's brightness map in ring coordinates (radius 1.28 to 1.92 by azimuth), measured, not generated.
- Tool: `python3 assets-src/neptune/ring/map.py out/work/nep/ring/noring.png public/assets/neptune out/work/nep/ring/withring.png`.
- Inputs: the hero; a review still of frame 4605 with the ring off (`noring.png`); a second still rendered with the first pass map (`withring.png`) for the residual pass.
- What the script does: hero minus the film without the ring, unwrapped into the fitted ring plane (`look.ring.normal`, `centre`), stars removed, strands kept with gain 2.2. Where the hero does not show the ring (behind the globe, outside the frame) the map continues the measured azimuth profile.
- Checks: ring annulus medians within 5 percent of the hero by azimuth. Shimmer is checked in the hold sheet at the review tier; the map is filtered with mipmaps and the sheet term is analytic.
