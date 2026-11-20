# Mars sky patches

Two regions of the one sky that carry the sky of the approved images, so the judged hold and terrain views show the sky the approved images show. `src/space/sky.ts` draws each patch on the fixed sky sphere where the approved view looks (`patches.mars` in `src/space/skyframe.json`), feathers its border into the rest of the sky and switches the drawn star points off inside it. `src/stops/mars/sky.json` holds the lens and gain of each patch.

## public/assets/mars/full/sky-hold.webp and public/assets/mars/web/sky-hold.webp

- Output files: `public/assets/mars/full/sky-hold.webp` (`3520 x 1980`, lossless WebP) and `public/assets/mars/web/sky-hold.webp` (`1760 x 990`, lossless WebP). The middle `2816 x 1584` is the picture; the rest is a margin, see step 5. The sky of `references/approved/mars-hero.png` with the planet, the moon and the planet's glow taken out.
- Tool: `python3 assets-src/mars/sky/patch.py hold references/approved/mars-hero.png out/work/match/sky-fill-take1.png out/work/match/halo-only.png public/assets/mars` (`numpy`, `scipy`, `Pillow`; no generation in this step).
- Inputs:
  - `references/approved/mars-hero.png`, the approved hero.
  - `out/work/match/halo-only.png`: the film's own frame 2325 at the review tier with the sky black (every `gain` in `src/stops/mars/sky.json` set to 0 for that one render), so it holds the globe, the moon and the film's limb glow and nothing else.
  - `out/work/match/sky-fill-take1.png`: one generated image, the hero with the planet removed, used only where the hero has no sky (behind the globe and in the first few percent outside the limb).
  - `assets-src/mars/fit.json` for the fitted circle of the globe.
- Fill image, model and prompt: the workspace image tool with the model `gpt_image_2_6_flare`, aspect ratio 16:9, reference image `references/approved/mars-hero.png`. Prompt, exact: "Edit image 1. Remove the planet and the small moon completely, and remove every trace of the planet's glow and atmosphere halo. Fill the area they covered with deep space that continues the surrounding sky exactly: the same dense field of fine, pinpoint, slightly colored stars, the same dusty Milky Way band with brown dust lanes and small star clusters crossing diagonally behind where the planet was, the same near-black blue background, the same star sizes, density, brightness and grain. Keep everything else in the image unchanged: same framing, same stars in the same places, same exposure and color. No planet, no moon, no sun, no glow, no nebula colors that are not already present, no text, no border."
- Takes: 1 of the 6 allowed, kept.
- Steps in `patch.py hold`:
  1. The hero, the fill and the film frame are brought to the film's scene values (sRGB decode, then the inverse of the film's tone curve).
  2. Sky = hero minus film frame, floored at zero. Outside the globe this is the hero's sky without the glow the film already draws, so film plus patch gives the hero back.
  3. The hero's own sky is used from 1.07 globe radii outward (feathered from 1.03) and wherever the film's glow is under about 0.6 of the hero's brightness. Elsewhere the fill is used, scaled per channel to the hero's sky in a ring around the globe and, close to the ring, to the local brightness of the hero's sky so there is no step where the two meet.
  4. Tone curve and sRGB encode.
  5. A margin of one eighth of the width and height is added on every side by mirroring the picture about its border (`MARGIN` in `patch.py`, `margin` in `src/stops/mars/sky.json`). The film feathers the patch into the rest of the sky across that margin, so the feather sits outside the approved view and the judged frame shows the approved sky to its corners. Saved lossless at that size for `full` and half that for `web`.
- Block grid: the approved images carry a faint 8 px block grid in their dark sky (boundary steps about twice the steps inside a block). `assets-src/mars/sky/deblock.py` takes the step across each block boundary, less the local slope, capped at 4 code values, and spreads it over the four pixels on each side. It runs on the hero, the fill and the close image before anything else. Measured on the hero's sky: boundary to inside ratio 1.9 before, 0.8 to 1.0 after. The files are lossless so no new grid is added.
- Checks: frame 2325 beside the hero at the review tier (limb profiles at 110 to 210 degrees within a few code values from 5 percent of a radius outward, star statistics by region equal to the hero's within 5 percent), frames 2255 and 2395 show no ring or hole where the globe has moved off its place in the hero.

## public/assets/mars/full/sky-terrain.webp and public/assets/mars/web/sky-terrain.webp

- Output files: `public/assets/mars/full/sky-terrain.webp` (`3520 x 1980`, lossless WebP) and `public/assets/mars/web/sky-terrain.webp` (`1760 x 990`, lossless WebP), with the same mirrored margin and the same block grid removal as the hold patch. The stars and fine band of `references/approved/mars-close.jpg` above its horizon, without the air glow the film draws itself.
- Tool: `python3 assets-src/mars/sky/patch.py terrain references/approved/mars-close.jpg out/work/match/air-only.png public/assets/mars out/work/match/terrain-pass1.png` (no generation, no model).
- Inputs:
  - `references/approved/mars-close.jpg`, the approved close image.
  - `out/work/match/air-only.png`: the film's frame 2580 at the review tier with the sky black, so it holds the ground and the film's air glow.
  - `out/work/match/terrain-pass1.png`: the film's frame 2580 at the review tier drawn with the patch made without this last argument. It measures how much of the sky the film's air lets through.
  - `src/stops/mars/relief.json` for the fitted horizon.
- Prompt: none.
- Takes: the only one.
- Steps in `patch.py terrain`:
  1. Sky = close image minus the film's air and ground, in scene values, floored at zero.
  2. Divided by the share of the patch that reached the frame in the first pass (a smooth map, floor 0.25), so the stars arrive as bright as the close image has them.
  3. Kept from 48 px above the fitted horizon upward (feathered over 34 px). Below that line the sky is mirrored about it, so a camera that tips up finds stars and not a hole.
- Checks: frame 2580 beside the close image at the review tier (star statistics in three regions of the sky within 10 percent at the 99th percentile), terrain contact sheet shows no edge of the patch.
