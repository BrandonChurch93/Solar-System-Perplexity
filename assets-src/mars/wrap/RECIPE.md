# Mars wrap maps: recipe

All paths are repo paths. Work files go to `out/work/wrap/` (not tracked). Scripts are in `assets-src/mars/wrap/` and run from that folder with Python 3 (numpy, opencv, Pillow, scipy). `geo.py` holds the hero camera fit, the map convention and the paths. The map convention is the one in the kit: direction of (lon, lat) = (cos lat sin lon, sin lat, cos lat cos lon), u = lon/360 + 0.5, north at top.

Image tool: `generate_image` (media skill). Models used: Seedream 5 (`seedream_5`) and Nano Banana Pro (`nano_banana_pro`), aspect 1:1. Inputs are always two images: image 1 = the tile to repaint, image 2 = the style image `out/work/wrap/s1/style-hero.jpg`, which is `references/approved/mars-hero.png` saved as JPEG at full size (2816 x 1584) because large PNG inputs fail. Every take was scaled back to its input size and compared with `flowcheck.py` (dense optical flow, median, p90 and p99 shift in px at 1024). A take was rejected if large features moved, appeared or vanished.

## Outputs

| File | What |
|---|---|
| `public/assets/mars/<set>/wrap-color.jpg` | full 8192 x 4096, web 4096 x 2048, JPEG q94, 4:4:4 |
| `public/assets/mars/<set>/wrap-height.bin` | full 4096 x 2048, web 2048 x 1024, raw LE uint16 |
| `public/assets/mars/<set>/wrap-storm.png` | full 2048 x 1024, web 1024 x 512, 8 bit gray |
| `assets-src/mars/wrap/wrap.json` | sizes, height decode, storm and cap data |

The web set is the full set scaled to half with area averaging (`cv2.INTER_AREA`).

## Inputs

- `references/approved/mars-hero.png` (hero, the style and the layout of the hero side).
- `references/cache/mars/viking-4096.png` (Viking MDIM 2.1 color mosaic, layout of the far side).
- `references/cache/mars/megt90n000eb.img` and `.lbl` (MOLA MEGDR 16 ppd, height base).
- `assets-src/mars/wrap/landmarks.json` (hand-picked pairs of hero pixels and Viking lon/lat for the warp).

## Steps for wrap-color.jpg

1. Hero fit and delight: `python3 delight.py`. Fits a shade table (light falloff against sun angle mu and view angle cosv) from the hero itself, divides it out, removes the pale limb veil (`remove_veil`), masks Phobos. Writes `delit-4096.npy`, `conf-4096.npy` (confidence: low near terminator, limb, Phobos and frame edge), `heropx-4096.npy` (hero px, py, cosv, mu for every map pixel).
2. Guide map: `python3 guide.py`. Warps the Viking mosaic to the hero layout with the landmark pairs (thin plate spline), color matched to the hero. Writes `guide-4096.npy`.
3. First composite: `python3 compose0.py`. Delit hero where conf is high, guide elsewhere, Lab matched.
4. Stage 1 faces: `python3 stage1_faces.py` renders six 90 degree gnomonic cube faces (n, s, w, c, e, b) of the composite to `out/work/wrap/s1/in-k.jpg` (take 1, 2) and `in2-k.jpg` (take 3), 2048 px. Each face is repainted with the prompt in `prompts/face-t1-t2.txt` (takes 1 and 2) or `prompts/face-t3.txt` (take 3), plus the face note for n, s and w written at the end of those files. Take 1 Nano Banana Pro, takes 2 and 3 Seedream 5. An extra face h centred at lon -140, lat 5, fov 90 covers the hazy west limb, prompt `prompts/t1-h.txt`, input `s1/in3-h.jpg`.
5. Stage 1 build: `python3 stage1b_build.py`. Back-projects the kept faces, Lab matches them to the composite, merges the low frequencies (sigma 24 px, decay 30) and keeps the hero core (hero weight 0.55 to 0.8) exactly. Detail weight 0.5. Writes `stage1-4096.npy`.
6. Harmonize: `python3 stage1c.py`. Quantile matches the far side to the hero inner disc (angle under 45 degrees from the sub-camera point lon -73.7, lat -9.9), keeps the hero inside 48 degrees and fades over 48 to 70, takes ring low frequencies from the guide in 52 to 105 degrees, swaps the smeared high frequencies in the south-west limb band for texture from 50 degrees east, evens local contrast (gain 0.85 to 2.0) and calms the pale Hellas blob. Writes `stage1c-4096.npy`.
7. Tiles: `python3 tiles.py` cuts 38 gnomonic tiles (2048 px) from the stage 1c map: e0 to e9 on the equator (fov 50, every 36 degrees), n0 to n7 and s0 to s7 at lat +40 and -40 (fov 56, every 45, the south row offset 22.5), np0 to np4 and sp0 to sp4 at lat +70 and -70 (fov 60, every 72), np and sp on the poles (fov 50). Centres in `out/work/wrap/s2/tiles.json`. Each tile is repainted with `prompts/tile.txt`; s5 (Hellas) gets `prompts/tile-hellas.txt` added, north polar tiles get `prompts/tile-pole.txt` added. Inputs `s2/in-k.jpg` and the style image.
8. Ring fix: `python3 ringfix.py`. In the ring 50 to 92 degrees from the sub-camera point (outside the dive zone, the hero cap and the cloud box) replaces detail finer than 14 px with guide detail times 0.84. Writes `ringfix-4096.npy` and the ring tile inputs `s2/inr-k.jpg`. The 21 ring tiles (e0 e1 e4 e5 n1 n2 n3 n4 np1 np2 s0 s1 s3 s4 sp0 to sp4 np sp) are repainted again with `prompts/tile.txt` plus `prompts/tile-ring.txt` (plus `tile-pole.txt` for north tiles), Seedream 5, files `s2/r1-k.png`.
9. Stage 2 build: `python3 stage2_build.py`. At 8192: low frequencies (sigma 6) locked to the input, tiles splatted with smooth weights (every map pixel has total weight 1.0 or more, 0 px under 0.05), hero inner region uses 0.6 tile detail, Hellas from s5 matched to the ring. Kept takes in `takes.json` (default t1). Writes `stage2-8192.npy`.
10. `python3 fix_west.py` removes the smooth pale wash along the west limb. Writes `stage3-8192.npy`.
11. `python3 despeck.py` removes isolated bright specks and cyan dots left by the generator (399k speck px, 473k cyan px replaced by a local median). Writes `stage4-8192.npy`.
12. `python3 fix_night.py` pulls the band near the hero terminator (mu 0.6 down to 0.32 full, fading out by mu -0.12) toward the day side next to it: low-frequency chroma capped at 0.92 of the day side median chroma (factor 0.55 to 1), hue halfway to the day side hue, lightness above the day side reduced by 35 percent, bright detail times 0.65, color detail times 0.5, yellow veins darkened. It does not touch anything within 29 degrees of the dive spot (lon -81.86, lat -4.54) and fades in over 29 to 35. Writes `stage5-8192.npy` and `final-4096.npy` (area scaled).
13. Save: `stage5-8192.npy` to `public/assets/mars/full/wrap-color.jpg`, `final-4096.npy` to `public/assets/mars/web/wrap-color.jpg`, both with OpenCV JPEG quality 94, sampling 4:4:4.

## Takes kept

| Asset | Takes | Kept | Why |
|---|---|---|---|
| face n, s, w, c, e | t1 Nano Banana Pro, t2 Seedream 5, t3 Seedream 5 | t3 | sharpest and most even; t1 shifted color, t2 left soft patches |
| face b | t1, t2, t3 | t2 | t3 moved features (flow median 1.60 px) |
| face h | t1 Seedream 5, t2 Nano Banana Pro | t2 | t1 kept the haze and shifted color; t2 flow median 0.20 |
| tiles (38) | t1 Seedream 5 | t1 | flow medians 0.17 to 0.56 px |
| tile e2 | t1 Seedream 5, t2 Nano Banana Pro | t2 | t1 moved features (median 1.85) and added a stray polar cap; t2 median 0.20 |
| tile s5 | t1 | t1 | Hellas rim and floor; p99 3.86 px is the intended repaint inside the basin only |
| ring tiles (21) | r1 Seedream 5 | r1 | flow medians 0.17 to 0.32 px |

Tiles e3 and sp3 failed once with a service error and were run again with the same prompt; that is not counted as a take.

## Steps for wrap-height.bin

1. `guide.py` (step 2 above) also reads the MOLA MEGDR 16 ppd image (see its label for the format), warps it with the same landmark warp to the painted layout and saves `mola-warped-4096.npy`.
2. `python3 height.py`: base = warped MOLA blurred 10 px, inside the Valles box (lon -112 to -30, lat -24 to 5, soft edges) blurred 40 px so the painted canyon wins; adds 45 m times the band-passed lightness (sigma 1.5 minus sigma 14) of `final-4096.npy` (relief follows the painted detail; damped under the storm and the pale clouds), cuts 3500 m along the dark painted canyon mask in the Valles box, wrap-aware blur 0.8 px, maps min..max to 0..65535. Writes `wrap-height-4096.bin`, `wrap-height-2048.bin` (area scaled) and `height-range.json` (min -7513.52 m, max 19269.91 m).
3. Copied to `public/assets/mars/full/wrap-height.bin` and `public/assets/mars/web/wrap-height.bin`.

## Steps for wrap-storm.png

`python3 storm.py` reads `final-4096.npy`. Coverage = 1 inside 10 degrees of lon -85.5, lat 9.8, smooth falloff to 0 at 24 degrees, modulated by the pale haze of the painted storm (lightness and low chroma), blurred. Writes `wrap-storm-2048.png` and `wrap-storm-1024.png`, copied to the full and web sets.

## Checks passed (final files)

- Hero reprojection (`check_hero.py --map public/assets/mars/full/wrap-color.jpg`): render of the map with the hero shading compared to the delit hero, features only. Flow median 0.473, p90 0.923, p99 1.683 px at hero size. Albedo against delit mean abs 0.037, bias under 0.012 per channel.
- Dive zone hold (within 30 degrees of lon -81.86, lat -4.54): flow between stage 1 and final, median 0.17, p90 0.43, p99 0.80 px at 1024; low-frequency Lab mean abs difference 0.25 L, 0.14 a, 0.12 b. The night fix has weight 0.07 at most there.
- Seam (`checks.py`): mean color step across lon 180 is 0.0228 against 0.0275 between neighbor columns inside; height 0.00077 against 0.00086 (normalized). Rolled view `chk-seam.jpg` shows no line.
- Poles: ortho views of both poles (`chk-pole-n.jpg`, `chk-pole-s.jpg`), no pinching, no rings.
- Relit: four globe views lit from other directions with the height map (`chk-relit.jpg`), no hero shading baked in, no disc outline.
- Native crops: 12 crops of 512 px at full size (hero interior, storm, canyon, terminator band, west limb clouds, Tharsis west, Hellas, both poles, three far side regions; the pole rows are checked in the ortho views since the map stretches there), no text, borders, tile edges or stars.
- Sizes: color 13.4 MB and 3.7 MB, height 16.8 MB and 4.2 MB, storm 24 KB and 9 KB.

## Weak points

- Two north caps: the hero cap at lon -73, lat 47 and a second cap at the pole from the far side fill.
- Hero cap and pale clouds are soft at native size; the storm is soft by design.
- A faint smear remains near lon -30, lat 30. The fiery orange near lon -65, lat 15 sits inside the dive zone and was left as it is.
- Height relief comes from the painted lightness (albedo read as relief); volcano shields come from the warped MOLA.
- Slight diagonal crosshatch texture from the generator in places.

## Hero match pass (lead, Phase 3)

Made by the Builder after the agent's delivery, because the film's hold frame is judged against the approved hero and the painted map differed from it in color on the visible side (a fiery orange zone near lon -65, lat 15, paler plains at the upper left, a darker night side).

- Tool: `python3 assets-src/mars/wrap/match.py <source wrap> public/assets/mars 12`, run from the repo root. No image model is used.
- Inputs: the agent's `public/assets/mars/full/wrap-color.jpg` at commit 4181fcf as the source wrap, `references/approved/mars-hero.png`, `assets-src/mars/fit.json`, the ground haze in `src/stops/mars/haze.json`, `tools/assets/lightcurve.py`.
- Steps: 1. Remove the tone curve and the fitted ground haze from the hero. 2. Fit the light curve over the sun angle (hero over map, median per angle bin), correct the map's low frequencies toward the hero (blur 12 px near, 80 px far, two passes), refit. 3. Inside the hero's frame, away from the frame edge and the limb, replace the map with the hero divided by the light curve at full strength (ladder rung 2 of "The orbit view does not match its approved hero image"). 4. Behind Phobos (a hand outline dilated 12 px) the hero has no surface: the low frequencies there are an inpaint of the divided hero and the detail is the agent's painted map. 5. Outside the frame and past the limb the agent's map is kept with the low frequency correction faded out.
- Outputs: `public/assets/mars/full/wrap-color.jpg`, `public/assets/mars/web/wrap-color.jpg`, and the fitted curve `src/stops/mars/curve.json`.
- Sharpness: the hero's surface is blurred before the divide only where the light curve is dim (under 0.12), where the divide would amplify the hero's grain. Lit areas keep the hero's pixels unblurred. The first version blurred everywhere and the hold frame measured 0.55 of the hero's fine detail (G17). With this change it measures about 1.0.
- Look lock changes (round 4 work): the tool takes an optional fourth argument, a 2x copy of the hero made with `python3 tools/ml/upscale.py --in references/approved/mars-hero.png --out out/work/match/hero-x2.png --width 5632` (checked with `tools/ml/checkmoved.py`: p99 shift 0.03 px), and takes the hero's pixels from it. Full command: `python3 assets-src/mars/wrap/match.py out/work/match/wrap-source.jpg public/assets/mars 12 out/work/match/hero-x2.png`. Hero pixels are resampled onto the map in tone-coded values, not scene-linear ones, because Lanczos ringing around highlights in linear values drove the red channel to zero and left teal pixels on ridge lines. Hero pixels now fade out between view cosine 0.42 and 0.2 (`LIMB`), the low frequency correction between 0.2 and 0.09 (`TONE`), so the hero's own limb haze and its stretched limb pixels are no longer painted into the map, where they showed as a pale arc from other angles. The bright cap at lon -73, lat 47 keeps its hero pixels down to view cosine 0.05 (`CAP`), since it sits on the limb in the hero. The ground haze the hero is divided by was refitted to the hero's limb first (`src/stops/mars/haze.json`, ground layer).
- The dive patches are not baked into this map. The shader lays them over it and fades each one in only when the level under it runs out of texels, so the hold shows this map alone. See `assets-src/mars/patches/RECIPE.md`.

## Repaint passes after the hero match (lead, Phase 3, look lock round 3)

Both run on `public/assets/mars/full/wrap-color.jpg` after `match.py`, in this order, and write `public/assets/mars/full/wrap-color.jpg` and `public/assets/mars/web/wrap-color.jpg`. If `match.py` is run again, run both again.

Commands, from the repo root:

- `python3 assets-src/mars/wrap/cap.py public/assets/mars/full/wrap-color.jpg out/work/cap/cap-take1.png /tmp/wrap-cap.png /tmp/wrap-cap-web.png`
- `python3 assets-src/mars/wrap/hole.py /tmp/wrap-cap.png out/work/hole/hole-take1.png public/assets/mars/full/wrap-color.jpg public/assets/mars/web/wrap-color.jpg`

### Polar cap (`cap.py`)

- Why: a reviewer of the rise frame 2726 marked the cap major: "a soft airbrushed smear with detached bright fragments". In the hero the cap sits on the limb, about one hero pixel for eight map pixels, so its map pixels were a blur.
- Input to the image tool: `out/work/cap/cap-in.png`, the map crop centered on x 2430, y 969 (lon -73.2, lat 47.4), 900 x 610 map px, with its width scaled by cos 47.4 degrees and resized to a square so the cap is seen from straight above.
- Tool and model: the workspace image tool, model `gpt_image_2_6_flare`, aspect ratio 1:1, reference image `out/work/cap/cap-in.png`.
- Prompt, exact: "Edit image 1. Image 1 is a soft, low-resolution top-down satellite view of a small polar ice cap on orange-red Martian terrain. Recreate the same view at full sharpness, as a crisp high-resolution orbital photograph taken straight down. Keep every shape where it is: the same cap outline, the same swirl of troughs inside the cap, the same small outlying ice patches at the left and lower left, the same dark patches, craters and terrain colors around it. Replace the blur with real fine detail: layered white and pale cream ice with sharp narrow spiral troughs that expose dark red-brown ground, crisp scalloped cap edges with thin frost fringes, fine wind-carved ridges on the ice, small crisp craters, dunes and rocky texture on the surrounding ground. Flat even overhead light, no cast shadows, no atmosphere, no haze, no glow, no clouds, no vignette. Same colors and brightness as image 1. No text, no border."
- Takes: 1 of the 6 allowed, kept (`out/work/cap/cap-take1.png`, 1254 x 1254): the outline, the swirl and the outlying patches sit where the input has them.
- Steps in `cap.py`: the take is resized back to the 900 x 610 crop, its low frequencies (blur 36 px) are scaled to the map's so color and brightness do not shift, and it is feathered in over 90 px from the crop border.

### Ground behind Phobos (`hole.py`)

- Why: a reviewer of the dive frame 2427 marked major: "bright, broken, hook-shaped strokes float on the dark surface". The hero has no surface behind Phobos, so `match.py` kept the first painted map there, which was a smooth blank with stray white strokes and a teal smudge. The dive flies over it once the moon has passed.
- Input to the image tool: the map crop x 1900 to 2900, y 2150 to 2900 (`BOX` in `hole.py`; run it with a fifth argument, a PNG path, to write the crop and the mask instead of the map).
- Tool and model: the workspace image tool, model `gpt_image_2_6_flare`, aspect ratio 4:3, reference image that crop.
- Prompt, exact: "Edit image 1. Image 1 is a top-down orbital view of orange-red Martian terrain, with a large canyon system across the top. The large oval area in the middle and lower part of the image is damaged: it is blurred and smeared, with a pale washed-out blank zone, a teal smudge at its right, and a few stray bright white squiggles and hook-shaped strokes near its bottom. Repaint that damaged oval area as crisp, sharp, believable Martian ground that continues the surrounding terrain: cratered rust-red plains with many small sharp-rimmed craters of different sizes, fine wind streaks, low wrinkle ridges, dune fields, darker basalt-toned patches toward the bottom where the image is already darker, and the canyon's lower rim and eroded slopes continuing naturally along the top of the oval. Remove every white squiggle, every hook-shaped stroke, the teal smudge and the pale blank zone. Keep the overall color and brightness of each part as it is: paler orange at the upper middle, darker brown-red at the bottom. Keep everything outside the damaged area unchanged: the canyon across the top, the craters at the upper left, the dark patch at the lower left. Flat even overhead light, no cast shadows, no atmosphere, no haze, no glow, no clouds, no vignette. Photographic, high-resolution orbital imagery. No text, no border."
- Takes: 1 of the 6 allowed, kept (`out/work/hole/hole-take1.png`, 1448 x 1086): the surroundings stayed in place and the strokes are gone.
- Steps in `hole.py`: the take is resized back to the crop and its low frequencies (blur 36 px) are scaled to the map's. It replaces the map only where the hero has Phobos in front of the globe: the hand outline of the moon from `match.py`, grown by 30 hero px, softened, projected onto the map with `assets-src/mars/fit.json`, and faded to nothing 50 px inside the crop border. Every map pixel the hero shows in the hold is untouched.
- Checks for both: map crops before and after at native size; frames 2325, 2427 and 2726 at the review tier beside the round before; G17 on the hold.

## Ledger rows

| File | What it is | Source URL | License | Credit line | Date fetched |
|---|---|---|---|---|---|
| `references/cache/mars/viking-4096.png` | Viking MDIM 2.1 colorized global mosaic, 4096 x 2048 | https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:4326&bbox=-180,-90,180,90&width=4096&height=2048&format=image/png&styles=&layers=MDIM21_color (product page https://astrogeology.usgs.gov/search/map/mars_viking_global_color_mosaic_925m) | Public domain (USGS product page: access public domain, use none) | NASA / USGS Astrogeology Science Center, Viking MDIM 2.1 color mosaic | 2026-11-20 |
| `references/cache/mars/megt90n000eb.img`, `.lbl` | MOLA MEGDR global topography, 16 pixels per degree | https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg016/megt90n000eb.img (USGS page https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m) | Public domain (NASA PDS; USGS page: CC0) | NASA / MGS MOLA Science Team | 2026-11-20 |
