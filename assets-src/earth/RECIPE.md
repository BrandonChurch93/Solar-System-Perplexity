# Earth assets: recipe

All paths are repo paths. Scripts are in `assets-src/earth/` and run from the repo root with Python 3 (numpy, opencv, Pillow, scipy). Work files go to `out/work/earth/` (not tracked). `geo.py` holds the hero fit, the camera, the ellipsoid shape, the map convention (direction of (lon, lat) = (cos lat sin lon, sin lat, cos lat cos lon), u = lon/360 + 0.5, north at top) and the tone coding (`decode` = sRGB to linear, then the inverse of the film tone curve; `encode` is its inverse).

Image tool: `generate_image` (media skill). Inputs are JPEG, because large PNG inputs fail: `out/work/earth/hero.jpg` is `references/approved/earth-hero.png` saved at quality 96, full size (2816 x 1584).

`<set>` is `full` or `web`. The web set is the full set scaled to half linear size with area averaging.

## Order

```
python3 tools/ml/upscale.py --in references/approved/earth-hero.png --out out/work/earth/up/hero-x2.png --width 5632
python3 assets-src/earth/shape.py
python3 assets-src/earth/light.py
(declouded hero take, see below)
python3 assets-src/earth/split.py
python3 assets-src/earth/wrap.py 8192
python3 assets-src/earth/air.py
python3 assets-src/earth/moon.py
(sky fill take, see below)
python3 assets-src/earth/aurora.py
(black-sky still of the hold, see "Sky patch")
python3 assets-src/earth/sky/patch.py out/work/earth/still/hold-nosky.png
```

`python3 assets-src/earth/wrap.py 8192 emissive` rebuilds only the emissive map.

## Inputs

- `references/approved/earth-hero.png` (the layout, the style and the pixels of the hero side).
- `references/cache/earth/bluemarble-july-21600.jpg` (layout and colour classes of the far side).
- `references/cache/earth/viirs-2020-09-10.jpg` (cloud layout of the far side).
- `references/cache/earth/blackmarble-13500.jpg` (layout of the night lights).
- Ledger rows for the three guides are in `assets-src/earth/ASSETS-ROWS.md`. None of them ships: each one is resampled through the registration to the hero layout and turned into the hero's palette by code before anything is written under `public/`.

## Generated takes

### Declouded hero (working input of the layer split, not shipped)

- Output: `out/work/earth/decloud/decloud-seedream-t1.png` (2816 x 1584).
- Tool and model: `generate_image`, `seedream_5`, aspect 16:9. Input: `out/work/earth/hero.jpg`.
- Prompt, exact: "Edit image 1, a view of planet Earth from space. Remove every cloud, cloud band, cloud swirl, the hurricane and every patch of haze from the planet, so the whole surface is seen under a perfectly clear sky. Where clouds covered ocean, paint clean deep blue open ocean that matches the neighboring water, with only gentle tonal variation. Where clouds covered land, continue the neighboring terrain naturally: forest, plains, desert, mountains, tundra, ice. Keep everything else exactly as it is, pixel for pixel: the same coastlines, the same continents in the same positions and sizes, the same land colors and turquoise shallows, the same polar ice cap, the same lighting and the same day and night boundary, the same golden city lights on the night side, the same green aurora, the same blue atmosphere glow on the edge of the planet, the same Moon, the same stars and Milky Way. Do not move, resize or rotate the planet. Do not add anything. No text, no border."
- Takes: 2 of 6. Take 1 (`seedream_5`) kept: median shift against the hero on clear land 0.2 to 0.7 px, output at hero size. Take 2 (same prompt, `nano_banana_pro`, `decloud-nbp-t1.png`) rejected: output 2752 x 1536, shift about 1.3 px, flow median about 3 px.
- Use: only as the estimate of the surface under the clouds. `split.py` matches its low frequencies to the hero on clear areas and solves cloud alpha and cloud colour so that surface and cloud compose back to the hero. Where the alpha is under 0.02 the surface is the hero's own pixel.

### Sky fill (working input of the sky patch, not shipped as is)

- Output: `out/work/earth/sky/fill-t1.png` (2816 x 1584).
- Tool and model: `generate_image`, `seedream_5`, aspect 16:9. Input: `out/work/earth/hero.jpg`.
- Prompt, exact: "Edit image 1. Remove the planet Earth completely, remove the small moon at the upper right, remove the green and red aurora, and remove every trace of the planet's blue glow and atmosphere halo. Fill the area they covered with deep space that continues the surrounding sky exactly: the same dense field of fine, pinpoint, slightly colored stars, the same faint dusty Milky Way with soft brown dust lanes crossing behind where the planet was, the same near-black blue background, the same star sizes, density, brightness and grain. Keep everything else in the image unchanged: same framing, same stars in the same places, same exposure and color. No planet, no moon, no sun, no glow, no aurora, no blue haze, no nebula colors that are not already present, no text, no border. Wide 16:9 image."
- Takes: 1 of 6, kept. It fills the planet, the Moon and the aurora with sky and keeps the stars outside in place.

## Shipped files

### `public/assets/earth/<set>/wrap-surface.jpg` (8192 x 4096 and 4096 x 2048, JPEG 4:4:4)

- Tool: `shape.py`, `light.py`, `split.py`, `wrap.py`. No image model output is in this file except through the declouded estimate under clouds.
- Coding: cloud-free albedo, coded with the film tone curve.
- `shape.py` fits the hero's disc as an ellipsoid in the camera frame (the disc is not a circle): `src/stops/earth/shape.json`. Lit limb rms 1.13 px, max 5.0 px.
- `light.py` measures the light curve (33 knots against the sun angle) and the disc haze from the hero: `src/stops/earth/curve.json`, `src/stops/earth/limb.json`, `assets-src/earth/limbhaze.json`.
- `split.py` (hero at 2x) removes the fitted haze, divides by the light curve, lifts the city lights and the aurora off the night side, and splits the rest into surface, cloud colour, cloud alpha and the cloud shadow at the middle of the hold. Recompose error against the hero: mean 0.209, p99 2.793 code values.
- `wrap.py`: registers the July Blue Marble to the hero by dense flow on an azimuthal map centred under the hero camera (flow median 6.69 degrees, p95 13.0: the hero's geography is not the real one, so every real guide goes through this flow); recolours it with a 32 cubed table learned from registered pairs of guide colour and hero surface albedo; uses the hero's own pixels where the hero's view cosine is above 0.42, fading out by 0.2. Between view cosine 0.2 and 0.1 the far painting is corrected by the hero residual: the far painting is projected to the hero camera (area average), subtracted from the hero surface, and the difference is laid back on the map, so the hold frame shows the hero up to the limb while detail finer than the hero resolves stays from the painting.

### `public/assets/earth/<set>/wrap-cloud.webp` (8192 x 4096 and 4096 x 2048, RGBA)

- Tool: `split.py`, `motion.py`, `wrap.py`.
- Coding: RGB = cloud colour times alpha (premultiplied, tone coded), A = cloud alpha.
- The hero's clouds are laid on the map through the inverse of the cloud motion at the middle of the hold (`motion.unwarp`), so the moving layer shows the hero exactly at that moment. Far-side clouds come from the whiteness of the VIIRS guide, recoloured to the hero's cloud tone. The same hero residual as for the surface runs to the limb.

### `public/assets/earth/<set>/wrap-emissive.webp` (4096 x 2048 and 2048 x 1024, RGBA)

- Tool: `split.py`, `wrap.py`.
- Coding: RGB = city lights (sRGB, divided by the peak 5), A = square root of the aurora on the disc.
- Hero lights where the hero was night. Elsewhere the Black Marble guide through the registration, base map removed (red minus 0.7 blue), sharpened and given a soft glow, tinted with the hero's gold (1, 0.72, 0.36). Light that the hero shows on terrain just past the terminator (the Andes) is kept in the same map and drawn as dusk light: full at the middle of the hold, fading as the terminator moves on.

### `public/assets/earth/<set>/wrap-far.webp` (8192 x 4096 and 4096 x 2048, RGBA)

- Files: `public/assets/earth/full/wrap-far.webp`, `public/assets/earth/web/wrap-far.webp`.
- Tool: `wrap.py` (`python3 assets-src/earth/wrap.py 8192 far`, 80 s). No image model output is in this file.
- Coding: RGB = cloud-free albedo, coded with the film tone curve. A = square root of the city lights.
- What it is for: outside the hold (the dive from frame 1800 on and the rise) the camera sees the hero's night side, its twilight and the land past its limb from other angles. There the hero map is amplified dark pixels and the registration flow of `wrap-surface.jpg` falls to zero within about 6 degrees past the hero's limb, which stretched land and lights. This map is the July Blue Marble through the same colour table (`lut.npy`), with ice laid as a pale blue white under the guide's own shading (the colour table gives ice a flat grey), placed with a gentle flow (`far_flow()`: the hero registration where the hero is lit and faces the camera, a smooth extension of it elsewhere, zero at 172 degrees from the hero centre; stretch outside the trusted zone -0.07 to 0.06 along x, -0.17 to 0.09 along y). Lights are the Black Marble guide through the same flow, base map removed, glow 2.2 px, so they are points along coasts.
- The shader (`globe.ts`) mixes to it only where the hero's light is low or past the hero's limb, times `away` (0 in the hold up to frame 1800). The hold frame 1755 is the same bytes with and without it.

### `public/assets/earth/<set>/wrap-far-cloud.webp` (5632 x 2816 and 2816 x 1408, RGBA)

- Files: `public/assets/earth/full/wrap-far-cloud.webp`, `public/assets/earth/web/wrap-far-cloud.webp`.
- Tool: `wrap.py` (`python3 assets-src/earth/wrap.py 8192 farcloud`, 60 s). No image model output is in this file.
- Coding: as `wrap-cloud.webp` (RGB = cloud colour times alpha, tone coded, A = cloud alpha).
- The whiteness of the VIIRS guide (`far_cloud()`, the same rule as the far side of `wrap-cloud.webp`), recoloured to the hero's cloud tone, placed with the gentle flow of `wrap-far.webp`. No cloud south of 63 degrees, where the guide ends with a hard edge. Used only outside the hold: on the hero's night side (the hero's own cloud there is amplified dark pixels) and, in the rise, on the ring past the hero's view where the first cloud map is stretched. Its fine structure (the map minus its own low pass) also modulates the hero's clouds outside the hold, so they carry detail finer than the hero resolves.

### `public/assets/earth/<set>/air-glow.png` (180 x 72)

- Tool: `air.py`. Rows 0 to 63: ratio of the hero's glow off the limb to the fitted layers, per position angle and height. Rows 64 to 71: colour of the hero's rim per position angle. Input: hero and the sky fill.

### `public/assets/earth/<set>/moon-color.jpg`, `public/assets/earth/<set>/moon-lit.webp` (1024 x 512 and 512 x 256)

- Tool: `moon.py`. Limb circle fitted on the lit arc of the 2x hero (69 points, rms 0.65 px, radius 58.1 px at 1x). `moon-lit.webp` holds the hero's own Moon pixels with their light baked, alpha = front mask. `moon-color.jpg` is the albedo from those pixels, mirrored to fill the far side.

### `public/assets/earth/<set>/aurora.webp` (2048 x 384 and 1024 x 192)

- Tool: `aurora.py`. The hero's curtains above the limb between position angles 2 and 92, unrolled along the limb: hero minus the smoothed sky fill minus the fitted glow, stars removed by opening and closing, gated on green or red chroma, faded at the ends and the top. Where the residue is red (red over green above `RED`, 0.9 to 1.8) only its smooth part is kept (opening of `CALM` 25 px, then a blur), so the red glow carries no star points and no blotches.

### `public/assets/earth/<set>/sky-hold.webp` (3520 x 1980 and 1760 x 990, lossless)

- Tool: `sky/patch.py` (`sky/deblock.py` is a copy of the Mars script). Inputs: hero, `out/work/earth/sky/fill-t1.png`, and a still of the film at frame 1755 with a black sky (`sky.json` gain set to 0 for that one render, review tier: `out/work/earth/still/hold-nosky.png`).
- The patch is the hero minus the film's own planet, glow, aurora and Moon, so the film adds back to the hero. Behind the planet, under the Moon and inside the bright glow the fill is used, scaled per channel (gain 1.579, 1.438, 1.015) and locally near the join; outside 1.03 radii the fill gives only its smooth part and the hero's own star points stay, also in the aurora sector (position angle 6 to 86 degrees, out to 1.3 radii) and around the Moon. There the points whose green or red stands 1.25 times above the other channels (what the fitted curtain leaves of the hero's aurora) are dropped, and so are the points on the Moon's disc (to 1.2 Moon radii). 12.5 percent margin for the camera's move in the hold and the start of the dive: outside the approved border the margin is the low pass of the mirrored padding (12 px) plus star points of the approved sky taken from the strip right inside the border and moved outward by one margin width (side margins along the row, top and bottom margins along the column, corners both). The points are the image minus its 4 px low envelope; a star whose peak stands above 0.08 linear is scaled down to that within 8 px, so the margin holds only faint stars and no bright pattern is seen twice; the points fade in over 4 px from the border. The engine fades the patch out across the margin, so the shared sky takes over toward the outer edge. Takes of the margin this round: 1 (clipped points became flat blobs, dropped), 2 (source strip 0.8 margins inside, peak 0.2: a dense cloud of stars with a vertical edge beside the sparse corner at frame 1857, dropped), 3 kept (share of pixels over 30 code values: margin 0.215, approved sky beside it 0.198; the take before this round, with points flipped from the far end of the image, left a starless strip at frame 1857). Inside the approved border nothing changes (0 pixels differ from the file before).

### Terrain relief and its sky

- `public/assets/earth/<set>/relief-ground.webp`, `public/assets/earth/<set>/relief-towers.webp`, `public/assets/earth/<set>/relief-lift.bin`, `public/assets/earth/<set>/relief-masks.png` and `public/assets/earth/<set>/sky-terrain.webp`: see `assets-src/earth/relief/RECIPE.md`.

## Checks

- `python3 assets-src/earth/holdcheck.py STILL`: mean difference of the hold frame against the hero per region, in code values.
- `python3 assets-src/earth/limbcheck.py STILL pa...`: radial profiles across the limb, hero against film.
- `python3 assets-src/earth/lightscheck.py STILL`: energy and colour of the city lights, hero against film.
- `python3 assets-src/earth/trim.py STILL reset`: after `trim.json` is set to ones and the hold still is rendered again, measures the film against the hero per sun-angle knot through the whole lens chain and writes `src/stops/earth/trim.json` (multipliers of the light curve, limits 0.8 to 1.2). Run it last, after every map and the sky patch.
- Numbers of the current build are in `assets-src/earth/NOTES.md`.
