# Sun assets

Every file under `public/assets/sun/`. The `web` file is always derived from the `full` file by the same script. Scripts are run from the repository root unless a line says otherwise. Work files live in `out/work/sun/` and are not committed.

## Stand-ins

Stand-ins from the Phase 2 blockout. They are removed when the terrain view is built.

## public/assets/sun/full/standin-wrap.jpg and public/assets/sun/web/standin-wrap.jpg

- Tool: `python3 tools/assets/standin.py sun` (numpy and OpenCV, no model).
- Inputs: `references/approved/sun-hero.png`, `assets-src/sun/fit.json`.
- Prompt: none.
- What it does: unprojects the approved hero image onto the fitted sphere as an equirectangular map, 4096 wide for `full` and 2048 wide for `web`. The part of the globe the image does not show is filled by mirroring the visible part about a circle at 0.9 of the limb angle. No cleanup: the light, the limb glow and anything in front of the globe stay baked in.
- Take kept: the only one.
- Checks: the judged `hold` frame lines up with the approved hero image in `npm run compare`.

## public/assets/sun/full/standin-close.jpg and public/assets/sun/web/standin-close.jpg

- Tool: `python3 tools/assets/standin.py sun`.
- Input: `references/approved/sun-close.jpg`.
- Prompt: none.
- What it does: the approved close image, re-encoded at its own size for `full` and resized to 2048 wide for `web`. Nothing is redrawn.
- Take kept: the only one.
- Checks: the judged `terrain` frame lines up with the approved close image in `npm run compare`.

## Orbit view

Shared inputs:
- `references/approved/sun-hero.png` (2816 x 1584), the approved hero.
- `out/work/sun/hero-x2.png`: `python3 tools/ml/upscale.py --in references/approved/sun-hero.png --out out/work/sun/hero-x2.png --width 5632` (the 2x model named in `tools/ml/upscale.py`, no prompt).
- `assets-src/sun/fit.json`, the fitted sphere and camera of the hero.
- `assets-src/sun/orbit/geo.py` holds the shared geometry and the film tone curve (`scene` decodes approved pixels to scene values, `code` encodes them back).

### public/assets/sun/full/wrap-color.jpg and public/assets/sun/web/wrap-color.jpg

- Output: 8192 x 4096 and 4096 x 2048, JPEG quality 94, 4:4:4.
- Tool: `cd assets-src/sun/orbit && python3 wrap.py ../../../public/assets/sun/full/wrap-color.jpg ../../../public/assets/sun/web/wrap-color.jpg` (numpy, OpenCV; no model, no prompt).
- Steps: the 2x hero is unprojected onto the fitted sphere. On the side the hero shows, each pixel is decoded to scene values and divided by the measured limb curve (0.33 + 0.36 (1 - mu)) / 0.33, so the map holds the surface without the limb brightening and the shader puts the curve back at the real view angle. The hero is used where the view cosine is above 0.42 and fades out down to 0.2. The rest of the globe is filled from 12 copies of the hero's central cap (view cosine above 0.6 to 0.8), turned to the vertices of an icosahedron with a fixed random twist each (seed 7) and blended with wobbling weights raised to the 8th power, so the seams follow no straight line.
- Take kept: the only one.
- Checks: hold compare, the film disc lands on the hero disc with the same texture and colour.

### public/assets/sun/full/corona.webp and public/assets/sun/web/corona.webp

- Output: 8192 x 1024 and 4096 x 512, lossless WebP. Columns are the angle around the disc centre (counterclockwise from image right), rows are the distance from the centre on a log scale from 1 to 3 radii, bottom row at the limb.
- Tool: `cd assets-src/sun/orbit && python3 halo.py && python3 card.py ../../../public/assets/sun corona` (numpy, scipy, OpenCV; no model, no prompt).
- Steps in `halo.py`: the 2x hero is unwrapped to polar form (`polar.py`). The prominences are matted out (see the next entry) and the corona behind them is estimated from a morphological closing of the blue channel times the corona's colour ratio per row. Stars are taken out above 1.07 radii with a 7 x 7 opening. The sky floor (30th percentile between 1.6 and 1.9 radii) is subtracted. Hero data is used out to 1.42 radii, or to 0.03 radii inside the frame edge where the frame ends sooner. Beyond that each ray continues as a power law (exponent measured between 1.12 and 1.26 radii, 7.6, clipped to 4 to 8) from its own median level, and everything fades out between 2.4 and 3 radii.
- Take kept: the fifth version of the split. Earlier versions left streaks (row interpolation) or dark strands (blue channel alone).
- Checks: hold compare, frames 270 and 449 for rays that slide against the disc.

### public/assets/sun/full/prominence.png and public/assets/sun/web/prominence.png

- Output: 4096 x 4096 and 2048 x 2048, PNG, straight RGBA. RGB is the prominence light in the film's tone curve, A is how much of the corona behind it is hidden. The card spans 1.56 radii each way from the disc centre in the plane z = 1 / 4.574 of the fitted sphere, which is the plane of the limb as the hero camera sees it.
- Tool: `cd assets-src/sun/orbit && python3 halo.py && python3 card.py ../../../public/assets/sun card` (no model, no prompt).
- Steps: in polar form the matte is every connected red region (red against blue above 0.42 to 0.62, luminance above 0.006 to 0.02) that either stands on the limb with more than 1500 pixels or floats free with more than 400, plus its feet, grown by 10 pixels and softened. Inside the matte A is one minus the blue channel over the estimated corona, and the light is the hero minus (1 - A) times the corona estimate, so corona plus card gives the hero back.
- Take kept: the same run as the corona.
- Checks: hold compare, crops of the limb at frames 330 to 375.

### public/assets/sun/full/prominence-flow.png and public/assets/sun/web/prominence-flow.png

- Output: 1024 x 1024 and 512 x 512, PNG, RGBA, not colour. R and G are the direction of flow along the strands (0.5 is zero), B is how much of a prominence is there, A is the position along the strand as an angle about the point where the prominence stands on the limb.
- Tool: `cd assets-src/sun/orbit && python3 card.py ../../../public/assets/sun card flow` (no model, no prompt).
- Steps: structure tensor of the card (5 pixel window) gives the strand direction. Each connected prominence gets one sense of circulation about its limb point, alternating from one prominence to the next.
- Take kept: the only one.

### public/assets/sun/full/sky-hold.webp and public/assets/sun/web/sky-hold.webp

- Output: 3520 x 1980 and 1760 x 990, lossless WebP. The middle 2816 x 1584 is the picture, the rest is a mirrored margin of one eighth on each side, the same layout as the Mars sky patches. It holds the stars and Milky Way of the approved hero without the Sun.
- Tool: `bash assets-src/sun/orbit/sky.sh` (renders frame 360 at the review tier with the card black, then runs `assets-src/sun/orbit/sky.py hold references/approved/sun-hero.png out/work/sun/sky-fill-take1.png out/work/sun/halo-only.png public/assets/sun`). `deblock.py` is a copy of `assets-src/mars/sky/deblock.py`.
- Fill image: the workspace image tool, model `gpt_image_2_6_flare`, aspect ratio 16:9, reference image `references/approved/sun-hero.png`. Prompt, exact: "Edit image 1. Remove the sun completely: the glowing globe, every flame and prominence, and every trace of its corona, rays, glow and halo. Fill the area they covered with deep space that continues the surrounding sky exactly: the same dense field of fine, pinpoint, slightly colored stars, the same faint dusty Milky Way clouds with brown dust and small star clusters at the left and right, the same near-black blue background, the same star sizes, density, brightness and grain. Keep everything else in the image unchanged: same framing, same stars in the same places, same exposure and color. No sun, no planet, no moon, no glow, no light rays, no nebula colors that are not already present, no text, no border."
- Takes: 1 of the 6 allowed, kept.
- Steps in `sky.py hold`: sky = hero minus the film's own frame, in scene values, floored at zero. The hero's own sky is used from 1.46 radii outward (feathered from 1.28). Inside that, and wherever a red remnant of a prominence is left in the difference, the fill is used, scaled per channel to the hero's sky in a ring from 1.5 to 2 radii. The fill's star points are taken out between 0.8 and 1.2 radii (feathered to 0.55 and 1.5), where the corona is bright and the hero shows no stars. Tone curve, sRGB, mirrored margin.
- In the film: `src/stops/sun/skycard.ts` draws it on a card at the far plane, fixed in the set frame where the hero camera looks, over the film's own sky. Its weight is 1 in the hold and the orbit part of the rise and fades out over the first third of the travel.
- Checks: hold compare, frames 270 and 449 for remnants that slide against the Sun.
