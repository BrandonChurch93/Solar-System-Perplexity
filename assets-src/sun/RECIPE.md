# Sun assets

Every file under `public/assets/sun/`. The `web` file is always derived from the `full` file by the same script. Scripts are run from the repository root unless a line says otherwise. Work files live in `out/work/sun/` and are not committed.

## Files

| File | Section |
|---|---|
| `public/assets/sun/<set>/wrap-color.jpg` | Orbit view |
| `public/assets/sun/<set>/corona.webp` | Orbit view |
| `public/assets/sun/<set>/prominence.png` | Orbit view |
| `public/assets/sun/<set>/prominence-flow.png` | Orbit view |
| `public/assets/sun/<set>/sky-hold.webp` | Orbit view |
| `public/assets/sun/<set>/plate.jpg` | Terrain view |
| `public/assets/sun/<set>/loops.webp` | Terrain view |
| `public/assets/sun/<set>/loops-glow.png` | Terrain view |
| `public/assets/sun/<set>/sky-terrain.webp` | Terrain view |

`<set>` is `full` or `web`.

## Orbit view

Shared inputs:
- `references/approved/sun-hero.png` (2816 x 1584), the approved hero.
- `out/work/sun/hero-x2.png`: `python3 tools/ml/upscale.py --in references/approved/sun-hero.png --out out/work/sun/hero-x2.png --width 5632` (the 2x model named in `tools/ml/upscale.py`, no prompt).
- `assets-src/sun/fit.json`, the fitted sphere and camera of the hero.
- `assets-src/sun/orbit/geo.py` holds the shared geometry and the film tone curve (`scene` decodes approved pixels to scene values, `code` encodes them back).

### public/assets/sun/<set>/wrap-color.jpg

- Output: 8192 x 4096 and 4096 x 2048, JPEG quality 94, 4:4:4.
- Tool: `cd assets-src/sun/orbit && python3 wrap.py ../../../public/assets/sun/full/wrap-color.jpg ../../../public/assets/sun/web/wrap-color.jpg` (numpy, OpenCV; no model, no prompt).
- Steps: the 2x hero is unprojected onto the fitted sphere. On the side the hero shows, each pixel is decoded to scene values and divided by the measured limb curve (0.33 + 0.36 (1 - mu)) / 0.33, so the map holds the surface without the limb brightening and the shader puts the curve back at the real view angle. The hero is used where the view cosine is above 0.42 and fades out down to 0.2. The rest of the globe is filled from 12 copies of the hero's central cap (view cosine above 0.6 to 0.8), turned to the vertices of an icosahedron with a fixed random twist each (seed 7) and blended with wobbling weights raised to the 8th power, so the seams follow no straight line.
- Limb level (`level` and `level_at` in `wrap.py`): the fill comes from the centre of the hero, so at the limb it was too bright and too contrasty (white smears where the shader puts the limb curve back). On a grid of position angle and angle from the view axis (0.1 degree steps, 50 to 125 degrees from the axis) the hero and the fill are low-passed in log scene values (Gaussian, 1.3 degrees; the hero is trusted down to a view cosine of 0.12 and held beyond). The fill gets the hero's low-pass colour (gain limited to 0.12 to 3) and the hero's local contrast (ratio of the low-passed deviations, 0.35 to 1.15, median 0.53); highlights are capped at 1.0 above the low-pass in log, and green and blue may not rise more than 0.2 and 0.35 above red, so no highlight turns white. All of it fades out between 100 and 122 degrees from the axis.
- Take kept: the third. The first had no limb level (white smears at 0.93 to 0.99 radii), the second had the level without the highlight cap (one grey fleck left at the upper left limb).
- Checks: hold compare, the film disc lands on the hero disc with the same texture and colour; native crops of the left and right limb at frames 270, 360 and 449 beside the hero.

### public/assets/sun/<set>/corona.webp

- Output: 8192 x 1024 and 4096 x 512, lossless WebP. Columns are the angle around the disc centre (counterclockwise from image right), rows are the distance from the centre on a log scale from 1 to 3 radii, bottom row at the limb.
- Tool: `cd assets-src/sun/orbit && python3 halo.py && python3 card.py ../../../public/assets/sun corona` (numpy, scipy, OpenCV; no model, no prompt). The level pass below runs after it.
- Steps in `halo.py`: the 2x hero is unwrapped to polar form (`polar.py`). The prominences are matted out (see the next entry) and the corona behind them is estimated from a morphological closing of the blue channel times the corona's colour ratio per row. Stars are taken out above 1.07 radii with a 7 x 7 opening. The sky that is subtracted is the low-pass of the film's own sky card (`infinity.py`, see `sky-hold.webp`), so corona plus card gives the hero's level back. Hero data is used as far out as the sky is under 0.3 of the total light (`TRUST`, never closer than 1.3 radii), or to 0.03 radii inside the frame edge where the frame ends sooner; the reach is smoothed around the disc (median 1.43 radii, 1.3 where the Milky Way lies behind the corona). Beyond that each ray continues as a power law (exponent measured between 1.12 and 1.26 radii, 8.0, clipped to 4 to 8) from its own median level. From 1.25 to 1.42 radii outward every ray is smoothed along the radius (0.03 in ln r) and made monotone, so no star remnant or Milky Way cloud stays in it. Everything fades out between 2.4 and 3 radii.
- Level pass: `assets-src/sun/orbit/match.py`. With `assets-src/sun/orbit/level.npy` and `assets-src/sun/orbit/veil.json` deleted, build corona and card, `npm run build`, `npm run still -- --frame 360 --tier review --out out/work/sun/h360-raw.png`, then `cd assets-src/sun/orbit && python3 match.py ../../../out/work/sun/h360-raw.png && python3 card.py ../../../public/assets/sun corona && python3 sky.py ../../../public/assets/sun`. `match.py` compares the star-free floor of that frame with the hero's in polar form, in scene values, and writes a smooth factor for the corona (`level.npy`, 512 x 128, 6 degrees across and 0.02 in ln r, limits 0.3 to 1.5) and the part the corona cannot absorb as a function of radius (`veil.json`), which `sky.py` takes out of the card. It accounts for the veil of the lens bloom and for the sky that the corona hides (`hide` in `src/stops/sun/look.ts`). One pass, not repeated.
- Take kept: the sixth version of the split. Earlier versions left streaks (row interpolation), dark strands (blue channel alone), or kept ray ends in the sky card.
- Checks: hold compare; frame 360 with the sky card switched off shows a whole corona with no wedge or edge; floors of film and hero by zone (far 0.032 against 0.032, 1.5 to 1.9 radii 0.061 against 0.059, 1.25 to 1.5 radii 0.167 against 0.166).

### public/assets/sun/<set>/prominence.png

- Output: 4096 x 4096 and 2048 x 2048, PNG, straight RGBA. RGB is the prominence light in the film's tone curve, A is how much of the corona behind it is hidden. The card spans 1.56 radii each way from the disc centre in the plane z = 1 / 4.574 of the fitted sphere, which is the plane of the limb as the hero camera sees it.
- Tool: `cd assets-src/sun/orbit && python3 halo.py && python3 card.py ../../../public/assets/sun card` (no model, no prompt).
- Steps: in polar form the matte is every connected red region (red against blue above 0.42 to 0.62, luminance above 0.006 to 0.02) that either stands on the limb with more than 1500 pixels or floats free with more than 400 and starts below 1.2 radii (orange Milky Way clouds further out are sky, not prominence), plus its feet, grown by 10 pixels and softened. Inside the matte A is one minus the blue channel over the estimated corona, and the light is the hero minus (1 - A) times the corona estimate, so corona plus card gives the hero back.
- Take kept: the same run as the corona.
- Checks: hold compare, crops of the limb at frames 270 to 449.

### public/assets/sun/<set>/prominence-flow.png

- Output: 1024 x 1024 and 512 x 512, PNG, RGBA, not colour. R and G are the direction of flow along the strands (0.5 is zero), B is how much of a prominence is there (zero within 0.03 to 0.12 radii of its foot point), A is the position along the strand as an angle about the point where the prominence stands on the limb, measured from the outward direction so that the wrap of the angle lies inside the disc.
- Tool: `cd assets-src/sun/orbit && python3 card.py ../../../public/assets/sun card flow` (no model, no prompt).
- Steps: structure tensor of the card (5 pixel window) gives the strand direction. Each connected prominence gets one sense of circulation about its limb point, alternating from one prominence to the next.
- Take kept: the second. The first had the wrap of the angle across the prominences on the left, which drew straight lines through them in motion.

### public/assets/sun/<set>/sky-hold.webp

- Output: 3520 x 1980 and 1760 x 990, lossless WebP. The middle 2816 x 1584 is the picture, the rest is a mirrored margin of one eighth on each side, the same layout as the Mars sky patches. It holds only what is at infinity: stars and the Milky Way. No pixel of the hero is in it, so nothing of the Sun can stay behind in the sky when the Sun moves.
- Tool: `python3 tools/ml/upscale.py --in out/work/sun/sky-fill-take1.png --out out/work/sun/sky-fill-x.png --width 3344`, then `cd assets-src/sun/orbit && python3 sky.py ../../../public/assets/sun` (after the level pass of the corona, which writes `veil.json`).
- Fill image `out/work/sun/sky-fill-take1.png`: the workspace image tool, model `gpt_image_2_6_flare`, aspect ratio 16:9, reference image `references/approved/sun-hero.png`. Prompt, exact: "Edit image 1. Remove the sun completely: the glowing globe, every flame and prominence, and every trace of its corona, rays, glow and halo. Fill the area they covered with deep space that continues the surrounding sky exactly: the same dense field of fine, pinpoint, slightly colored stars, the same faint dusty Milky Way clouds with brown dust and small star clusters at the left and right, the same near-black blue background, the same star sizes, density, brightness and grain. Keep everything else in the image unchanged: same framing, same stars in the same places, same exposure and color. No sun, no planet, no moon, no glow, no light rays, no nebula colors that are not already present, no text, no border."
- Takes: 1 of the 6 allowed, kept.
- Steps in `infinity.py`: the fill is split into a floor (7 x 7 opening) and stars (the rest). The floor is mapped by quantiles, per channel, onto the hero's floor beyond 1.9 radii. The stars are mapped by quantiles onto the hero's stars, separately for dark sky (beyond 1.9 radii) and for the Milky Way (beyond 1.6 radii, floor above 0.06), and mixed by the floor's brightness. The star light is then scaled by a smooth density map (hero local star light over card local star light, 160 px Gaussian, measured beyond 1.6 radii, limits 0.5 to 1.7), so the band and the dark sky each hold as many stars as the hero, and the stars of the dark sky are trimmed by 0.8, because at 1920 wide at the final tier they came out 24 percent brighter than the hero's while the band's stars were equal. `sky.py` takes the veil of `veil.json` out, applies the tone curve and sRGB and adds the mirrored margin.
- In the film: `src/stops/sun/skycard.ts` draws it on a card at the far plane, fixed in the set frame where the hero camera looks, over the film's own sky. Its weight is 1 in the hold and the orbit part of the rise and fades out over the first third of the travel. The corona hides the sky behind it where it is bright (`hide` in `src/stops/sun/look.ts`), as the hero shows no stars inside the glare.
- Checks: hold compare; star and floor statistics by zone against the hero (`out/work/sun/hstats.py`); frames 247, 269, 270, 449, 450, 472 for anything of the Sun left in the sky.

## Terrain view

Shared inputs:
- `references/approved/sun-close.jpg` (2816 x 1584), the approved close image.
- `out/work/sun/close-x2.png`: `python3 tools/ml/upscale.py --in references/approved/sun-close.jpg --out out/work/sun/close-x2.png --width 5632` (no prompt).
- `assets-src/sun/terrain/fit.json`: `python3 assets-src/sun/terrain/fit.py`, the ground sphere fitted to the horizon of the approved close image (radius 20.63 camera heights, limb half angle 72.51 deg, residual 0.2 deg rms).
- `assets-src/sun/terrain/common.py`: the canvas (the approved field times 1.5, left -0.25, top -0.205, 8192 x 4608), the film tone curve and the registration helper.
- `out/work/sun/register.json`: `PYTHONPATH=assets-src/sun/terrain python3 assets-src/sun/terrain/register.py`, the affine placement of each generated take against the approved image (phase correlation on the ground, no model).

### Generated input: clean take (the close image without the loops)

- Output: `out/work/sun/close-clean-take1.png` (1672 x 941), upscaled with `python3 tools/ml/upscale.py --in out/work/sun/close-clean-take1.png --out out/work/sun/close-clean-x.png --width 5632`.
- Tool and model: `generate_image`, model `gpt_image_2_6_flare`, aspect 16:9.
- Input image: `references/approved/sun-close.jpg`.
- Prompt: "Edit image 1. Remove the glowing arcs of plasma completely: the tall arch of fine golden strands that leaps from the bright foot on the left of the sunspot to the bright foot on the right, every thin strand, spark and droplet of it, and the two bright fountains at its feet with their glare. Where the arch was, show the sky that is behind it: the same dense field of fine pinpoint stars and the same dusty Milky Way band continuing across. Where the two feet were, show the same granulated golden surface as around them, and keep the thin orange glow and tiny flames along the horizon unbroken behind them. Keep everything else exactly unchanged: the dark sunspot with its filaments, every granulation cell, the curved horizon with its glow, the stars, framing, exposure and color. No arcs, no loops, no flares, no new light sources, no text, no border."
- Take kept: take 1 of 6. The loops and both fountains are gone, the ground under the feet is granulation of the same scale, the spot and the cells outside the loops stayed in place (registration residual under one pixel).
- Use: only inside the widened loop mask. Outside it the approved pixels are used.

### Generated input: wide take (the close image continued outward)

- Output: `out/work/sun/close-wide-take1.png` (1672 x 941), upscaled with `python3 tools/ml/upscale.py --in out/work/sun/close-wide-take1.png --out out/work/sun/close-wide-x.png --width 5632`.
- Tool and model: `generate_image`, model `gpt_image_2_6_flare`, aspect 16:9.
- Input image: `out/work/sun/close-canvas.jpg`, the approved close image at two thirds scale pasted at (469, 264) on a 2816 x 1584 canvas of grey 128.
- Prompt: "Image 1 is a photograph placed in the middle of a flat grey canvas. Fill the whole grey border by continuing the photograph outward seamlessly in every direction, so the result is one single wider picture with no visible frame or seam. Below and to the sides: more of the same boiling golden solar surface, granulation cells of the same size, color, contrast and lighting, growing larger toward the bottom of the picture as the ground comes closer to the camera. The curved horizon with its thin orange glow and tiny flames continues to the left and right and keeps curving downward at the same rate. Above: more of the same black sky with dense fine pinpoint stars and the dusty Milky Way band. Keep the central photograph exactly as it is, same position and size: the dark sunspot, the arch of golden plasma strands and its two bright feet. No new sunspots, no new arcs, no grey left anywhere, no text, no border, no vignette."
- Take kept: take 1 of 6. The horizon continues on the fitted circle within 0.4 deg, the cells grow toward the bottom, no second spot, no seam at the pasted frame.
- Use: only outside the approved frame, histogram matched to the centre (ground and sky separately), feathered 90 px on the ground and 380 px in the sky.

### public/assets/sun/<set>/plate.jpg, public/assets/sun/<set>/loops.webp, public/assets/sun/<set>/loops-glow.png

- Output: `plate.jpg` 8192 x 2880 (canvas rows 1728 to 4608) and 4096 x 1440, JPEG 92 and 88, 4:4:4. `loops.webp` 3605 x 1838 (image box 0.22, 0.08, 0.86, 0.66 of the approved frame) and half size, WebP 92 and 90. `loops-glow.png` 901 x 459 and 450 x 229, PNG.
- Tool: `PYTHONPATH=assets-src/sun/terrain python3 assets-src/sun/terrain/plate.py` (numpy, OpenCV, scipy; no model, no prompt).
- Inputs: `out/work/sun/close-x2.png`, `out/work/sun/close-clean-x.png`, `out/work/sun/close-wide-x.png`, `out/work/sun/register.json`, `assets-src/sun/terrain/fit.json`, `assets-src/sun/terrain/base90.jpg`.
- Steps:
  - Loop mask from the difference approved minus clean take.
  - `loops-glow.png`: how much the loops light the ground, as a gain: clip(blur(approved) / blur(clean), 1, 12) - 1 with a 24 px blur, inside the mask, off above the limb and in the columns above the two feet, blurred 10 px, stored as the sRGB code of the value over 12. The ground shader multiplies the plate by one plus this map.
  - Clean centre: the clean take inside the widened mask, the approved pixels elsewhere, times one plus the gain map. Above the limb the film's own frame 90 without loops (`base90.jpg`, stars opened out above 2 deg) takes its place, so sky card plus loops gives the approved picture back.
  - `loops.webp`, scene values: approved times clip((lum approved - lum clean) / lum approved), which keeps the hue of the approved pixel. On the ground only the sharp strands, the fountain columns above the feet and the band within about 1 deg of the limb pass. Above the limb only the warm or bright part passes, so the approved stars stay out of the layer, and the hole each star leaves is filled with the 13 px opening of the same residual.
  - Canvas: the wide take outside the approved frame, matched and feathered.
  - `plate.jpg`: the canvas below the detected horizon, and above it only the orange glow and flames (split by colour, fading from 1.6 to 4.2 deg above the limb) on black. The smooth part of the glow is fitted as a function of elevation and written to `assets-src/sun/terrain/glow.json` for the shader.
- `assets-src/sun/terrain/base90.jpg`: frame 90 of the film at the review tier with `look.loops.gain` set to 0 (`npm run still -- --frame 90 --tier review --out out/work/sun/base90.png`, saved as JPEG 95). Order of a full run: `plate.py`, `sky.py`, `export.py`, `npm run build`, render `base90`, `plate.py` again.
- Take kept: the run of 05:40 UTC. Earlier runs: an added ground glow (red smears, then haze), plain differences (coloured specks), no fill of the star holes (dark specks under the arcade).
- Checks: `out/work/sun/canvas-check.jpg`, `loops-mask.png`; frame 90 beside the approved close image in `npm run compare -- --stop sun --view terrain`; crops of the limb between the feet and of the sky under the arcade against the approved image.

### public/assets/sun/<set>/apron.jpg (the foreground plate, painted in the view of frame 0)

- Output: `apron.jpg` 5504 x 1548 (rows 0.5 to 1 of the picture of frame 0) and 2752 x 774, JPEG 92 and 88, 4:4:4.
- Why: before frame 75 the camera is higher and further back than the approved pose and sees ground the approved image does not hold (71 percent of the ground at frame 0, 39 percent at frame 60). The wide take that covered it was 1672 px wide and not true to the ground, so the foreground of frame 0 was soft and stretched. This plate is painted in the view of frame 0 and projected onto the ground from the camera of frame 0, the same way the main plate is projected from the approved camera.
- `src/stops/sun/apron.json`: `npx tsx assets-src/sun/terrain/apron-pose.ts`, the camera of frame 0 at the time of the take (position, quaternion, field of view), the first row kept, the reach on the ground (full within 3.0 camera heights of the point under that camera, gone at 3.6) and the feather inside the approved frame (0.04 of the frame). The projector does not follow the plan: if the terrain move changes, frame 0 no longer gives the painting back exactly, and the take should be made again.
- Base picture: `out/work/sun/apron-base.png`, frame 0 at the draft tier without grain (`npm run still -- --frame 0 --tier draft --diag nograin`), with `look.ground.boil.reach` 0, `look.ground.twinkle.amount` 0 and `look.ground.apron.amount` 0.
- Model input: `out/work/sun/apron-input.png` from `PYTHONPATH=assets-src/sun/terrain python3 assets-src/sun/terrain/apron.py mask`: the base at 2816 x 1584 with flat grey 128 wherever the apron weight is 0.4 or more (35 percent of the frame).
- Tool and model: `generate_image`, model `nano_banana_pro`, aspect 16:9, images: 1 `out/work/sun/apron-input.png`, 2 `references/approved/sun-close.jpg`.
- Prompt, exact: "Image 1 is a film frame of the surface of the Sun in which the lower part has been painted out with flat grey. Fill the whole grey area by continuing the picture downward seamlessly, so the result is one single finished picture with no visible seam and no grey left anywhere. The grey area is the foreground of the same boiling golden solar surface: granulation cells of the same look, color, contrast and lighting as the cells just above the grey edge, each cell a rounded swollen dome of glowing plasma with a bright golden crown, fine wispy filaments on its skin, small white-hot glints, and narrow dark brown lanes between the cells. The ground is one continuous curved surface that comes closer to the camera toward the bottom of the picture, so the cells grow steadily larger toward the bottom edge: just below the grey edge they are the same size as the cells above it, at the bottom edge they are about three times as large. Every cell is crisp and sharply detailed, in full focus, with no blur, no smearing, no stretching and no haze. Image 2 is a style reference from the same film: the cells in its foreground show the exact look, sharpness and richness that the new foreground cells must have. Keep the upper part of image 1 exactly as it is, same position and size: the black sky with stars and the Milky Way, the curved glowing horizon, the dark sunspot, the arch of golden plasma strands and its two bright feet, and all the ground that is already visible. No new sunspots, no new arcs, no new light sources, no text, no border, no vignette, no depth of field blur."
- Takes: 2 of 6. Take 1 (`out/work/sun/apron-fill-take1.png`, model `seedream_5`, same prompt and images) repainted the whole frame and moved the horizon, not used. Take 2 (`out/work/sun/apron-fill-take2.png`, 2752 x 1536) kept the upper part in place and is the one kept.
- Build: `PYTHONPATH=assets-src/sun/terrain python3 assets-src/sun/terrain/apron.py register` (affine placement of the take on the base over the kept ground, ECC, correlation 0.93: the take is the base cropped by 0.8 percent in height), `python3 tools/ml/upscale.py --in out/work/sun/apron-crop.png --out out/work/sun/apron-crop-x2.png --width 5504` (rows from 0.44 down), `PYTHONPATH=assets-src/sun/terrain python3 assets-src/sun/terrain/apron.py build` (placed on the grid of frame 0, channel means matched to the base over the kept ground; the match fades out for pixels brighter than 170 to 245 of 255, so white glints stay white and do not turn green).
- Earlier tries, not shipped: two top-down granulation fields (`out/work/sun/apron-take1.png` with `seedream_5`, `out/work/sun/apron-take2.png` with `nano_banana_pro`), whose cells did not look like the cells of the approved image.
- Checks: frame 0 with the base itself as the apron gives the base back in place; native crops of the lower corners of frames 0, 30 and 60; frame 90 unchanged.

### public/assets/sun/<set>/sky-terrain.webp

- Output: 4096 x 2304 and 2048 x 1152, WebP 95 and 92.
- Tool: `PYTHONPATH=assets-src/sun/terrain python3 assets-src/sun/terrain/sky.py` after `plate.py` (no model, no prompt).
- Steps: the canvas minus the plate (what is left above the horizon is stars and the Milky Way), mirrored about a line 2.1 deg (centre) to 4.6 deg (sides) above the limb so the card has no edge behind the limb, and dimmed by up to 0.55 inside the loop mask within 3 deg of the limb, where the mirrored fill was brighter than the approved sky.
- Check: `out/work/sun/sky-terrain-check.jpg`, the limb crop of frame 90.

### src/stops/sun/terrain.json

- Tool: `PYTHONPATH=assets-src/sun/terrain python3 assets-src/sun/terrain/export.py`. The fit, the canvas, the loops box, the feet and the spot for the set.
