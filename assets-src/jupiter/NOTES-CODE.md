# Jupiter from code: lab notebook

Agent: jupiter_coder. Branch `agent/jupiter-code`, looks folder `jupiter-code`. Builder is `/root`.
After a compaction: read this file first, then the start message if still there, then `cut/HANDOVER.md` (Part C, then Part B).

## The job (short)

- Brandon's note of 2026-11-23: the dive and rise are a blurry mess and read as a transition; the surface view of Jupiter looks like an image being stretched. It should look generated out of code.
- Part C of `cut/HANDOVER.md`: rebuild the terrain view (frames 3060 to 3239, judged 3150) as a cloud deck in true 3D on the sphere at the red storm. Then Part B (S1 to S5) for the dive (2970 to 3059, judged 2997) and the rise (3240 to 3314, judged 3296). The hold (2820 to 2969, judged 2895) must stay the same picture.
- Milestones to report to `/root`: M1 first deck at 3150 beside the approved image plus 3060, 3150, 3239 in a row. M2 whole surface view (12 frame sheet, every sixth frame at review tier, compare at 3150, G5, G13, G17, seconds per sample). M3 dive and rise by Part B with proofs. Then the stop as a whole.
- Folders: `src/stops/jupiter/`, `assets-src/jupiter/`, `public/assets/jupiter/`. Nothing else is edited.
- Every commit ends with the trailer `Co-authored-by: Perplexity <noreply@perplexity.ai>`.
- Looks at least every 30 minutes: `npm run looks -- --push --folder jupiter-code --note "..."`.

## Mail 218 from the Builder (what "from code" allows)

Order of what matters:
1. In motion nothing may read as a picture that bends. True 3D, real parallax, nothing stretches, every frame 3060 to 3239.
2. At 3150 the picture must be as rich as the approved image to a critic who sees both side by side. Plain noise bands will not hold up.
3. The means are mine.

Allowed as fixed input: fields that a tool of mine derives from the approved close image and lays onto the sphere top down, stored with their recipe (large scale colour, cloud top height, the storm's outline, a stream function for the flow). Such a field never moves over the surface, is never dragged along a flow, and is never the finest thing in view: every structure smaller than what the laid back image truly resolves at that spot comes from functions, made at the scale of the pixel. Toward the limb, where laying back stretches the image, the fields are made again by code or by a repaint, never used stretched.

Motion comes from the camera first: a real flight forward over a deck with real height. A storm of this size would hardly turn in six seconds. If it turns, only fine detail made by functions carries it (advection with reset, flow noise), slowly; the large forms stay where they are on the sphere. If in doubt, less.

A deck from functions and a stored simulation alone is just as welcome if it reaches the richness. Put candidates beside the approved image at 3150, pick the best in crops, say why at M1.

Judging: R1 compares 3150 with the approved image region by region (composition, where each feature sits, colour and grade, contrast and blacks, fine detail, light, limb glow, sky). R4 judges motion on sheets (near ground and horizon move against each other, nothing stretches, tears, slides or swims). R3 looks at native crops (soft areas, stretched texture, repeats, banding, airbrushed surface).

## Facts read from disk (2026-11-23)

- VM: 4 cores, 7 GB RAM, 14 GB free disk after clone and `npm ci`. `npm run build` passes on a fresh clone of main 6da6c64.
- Segments: hold 2820 to 2969, dive 2970 to 3059, terrain 3060 to 3239, rise 3240 to 3314. Judged: 2895, 2997, 3150, 3296.
- Tiers: draft 1 sample, review 4 (16 in fast kinds), final 16 (64 in fast kinds). The terrain view is not a fast kind.
- Old fit of the close image (old notebook, `relief/camfit.py`): vfov 64, focal 1267.46 px at 2816 wide, nadir in camera space (-0.272, -0.885, -0.377), dip 4.44 deg, roll 17.09 deg. Height above the sphere from the dip: 1 / cos(4.44 deg) - 1 = 0.00301 radii.
- The storm in the close image, from the old deck: centre px (1132, 552) of 2816 x 1584, ground half axes 1.12 x 2.18 camera heights, so about 0.19 x 0.38 degrees on the sphere at that height.
- The storm on the hold globe (hero pixels in the wrap): lon -17.5, lat -10, half axes about 13.2 x 7.9 degrees. So the globe's storm is about 35 times larger than the close view's storm at the close view's horizon. One scale cannot serve both: this is the main design question (see "Design").
- Sun at the hold: sunDir (-0.744, 0.140, 0.653) in the set frame, n.l at the storm about 0.81. The close image has a low raking Sun from the upper left and a terminator at the lower right.
- Engine: the terrain view is drawn in a frame with its origin at the spot on the unit sphere and axes (right, normal, -heading), camera relative (`set.world.position = origin - camera`). Poses of `plan.terrain()` are in that frame.

## Measured on this VM (2026-11-23, 06:50 UTC)

Software WebGL cost, full 1920 x 1080 frame, nanoseconds per pixel per loop pass (bench outside the repo):
- empty loop 0.7; `textureLod` bilinear 5.7 to 7.3 at level 0, about 4 at level 2.5; trilinear 7 to 11; `textureGrad` 16 to 27 (avoid, compute the level by hand).
- hash value noise in arithmetic 2.8 to 3.2, cheaper than a fetch.
- 6 s per sample is about 2900 ns per pixel, about 4400 ns per ground pixel. A march of about 100 steps per pixel is affordable.
- `npm run build` 5 s. A draft still of 3150 on the frozen build: 20.6 s.

## Geometry of the close view (tool `deck/geom.py`)

- The terrain frame is the camera frame of the approved image at the fit: camera at the origin at mid shutter of 3150, identity quaternion, looking down -z, x right, y up.
- Nadir in that frame (-0.2722, -0.8852, -0.3772). Planet centre C = nadir x (R + 1), R = 331.946 units, camera height 1 unit. 1 unit = 0.1725 degrees on the sphere. Horizon 25.8 units away.
- Close image 2816 x 1584, focal 1267.46 px (864 px at 1080p). Storm centre px (1132, 552).
- Chart: origin S = the point of the sphere under the storm pixel (3.957 units from the camera), en = up at S, ey = the ground direction of the ray to S, ex = right. Camera in the chart: (0, -3.834), height 1.
- Ground under the frame corners: bottom centre (0.39, -3.15), bottom left (-0.57, -3.18), bottom right (2.28, -3.07), frame centre (0.65, -1.43).
- Height over the sphere of a chart point p (no cancellation): h = (2 R z + x^2 + y^2 + z^2) / (sqrt(R^2 + 2 R z + |p|^2) + R).

## Design (07:10 UTC, to be tested at M1)

Deck = a height field on the sphere, marched per pixel in the chart, camera relative. No mesh, no plate projected from a camera.
- A tool in `assets-src/jupiter/deck/` makes the coarse fields over the chart (colour without the light, cloud top height, masks for where towers stand and where the deck is combed, a stream function). Two candidates through the same shader: A fields from functions alone, B fields laid back from the approved image at the scale it truly resolves, the outside and the far part by code.
- Everything finer than the fields comes from functions in the shader, made down to the pixel footprint: billow octaves for cloud tops (real height, they are marched), stripes along the streamlines for the combed parts.
- Light is live: albedo x a curve over the Sun's height on the true sphere (so the terminator lies across the view) x the shading and the shadows of the marched tops. The Sun can then ramp over the dive (Part B).
- The limb, the haze toward it and the thin blue line come from the shader; the stars from the engine's sky patch as before.
- Flight: level, at constant height over the sphere, forward along a gentle left arc round the storm (the image is banked left), pose equal to the fit at mid shutter of 3150.
- G13: the texels view will report the finest generated octave per pixel, counted. To be said at M2.

## Mail 224 from the Builder (07:55 UTC)

- What Brandon judged was the motion: the frozen view failed because the picture was pushed along a flow field, not because its fields came from an image. Mars, which he approved, is a layered relief of its approved close image with painted fills and one true camera flight. The bar: at 3150 as rich as the approved image, in every other frame a rigid 3D deck that a real camera flies over, parallax between near and far tops, nothing bends, swims or drags.
- Image generation is allowed (Brandon: "Do new generation if you need to"). Strongest route: turn the laid back wedge into a complete top down plate of the storm region (the step of Part B S2): sharp near part kept, the stretched far part and everything outside the wedge repainted as the same cloud field seen from straight above. Two or three nested scales, each colour matched to the one above. Height from the plate with the depth tool or from its own structure. The plates are then both the deck's fields and the deepest levels of the globe's patch pyramid, so the dive goes to the very same clouds. Functions add the finest scale near the camera, the tops' thickness, the far field to the limb. Recipe in `assets-src/jupiter/RECIPE.md`, at most `assets.maxTakesPerAsset` takes per asset per round.
- Motion of the clouds themselves is optional and comes last. A rigid deck with a real flight passes.
- Proof looked at first: a sheet of every 15th frame of 3060 to 3239 at the draft tier with no blur, then consecutive frames 3148 to 3153, and 3150 beside the approved image.

## What was tried (07:10 to 08:00 UTC)

- v0, v1, v2: march on three stored height maps (near 0.01, mid 0.03, far 0.18 units per texel), colour from the image blurred to about 0.1 to 0.3 units with the light divided out by a fitted curve, live light with a shadow march, function detail (billow octaves) down to the pixel, function made streaks (line integral along a stream function) and towers (cell noise) outside the image wedge. Result at 3150: true relief and the right light direction, but dark, soft and grainy; the bands and the palette are gone. Far too poor beside the approved image. Plain functions do not reach that image. This was candidate A in all but name.
- Measured: the near map (0.01 units per texel) is three times coarser than what the image resolves across the view at the storm (0.0031 units per image pixel), and seven times coarser in the foreground (0.001). A uniform top down map that holds the image would need 0.001 units per texel over 10 units: too large.
- v3 (candidate B, chosen): the image is stored in a chart that matches what it truly resolves: polar about the fit nadir N0 = chart (0, -3.834), columns = azimuth (-43 to 73 degrees from chart +y), rows = the depression angle psi(d) = atan2(1 + d^2 / 2R, d) of the ground distance d, from the horizon (4.44 degrees) to 58 degrees. 3072 x 1200 texels hold the whole visible ground at about the image's own resolution. Tool: `deck/view.py`. It lays the image (display values, sRGB, the shader undoes the film curve) onto the stored height maps exactly as the shader sees them (same bilinear blend of the three levels), so at the fit pose the render reproduces the image whatever the relief is.
- Each texel also stores (in alpha, log scale) the length L over which the image cannot place its colour in depth: pixel size / |n . v| on the stored relief, and the largest value where the texel is hidden from the fit camera. The shader trusts the image field only where L x sin(angle between the current ray and the fit camera's ray to the same point) is under about a pixel. At the fit pose all of it is trusted; from other poses the hidden zones behind towers and the edge on slopes fall back to the code made deck; from above (the dive) the stretched far part falls back by itself. Nothing is ever shown stretched.
- The level weights of the three height maps are now fixed on the ground (by the distance to the map border), not by distance from the camera, so the surface is one fixed function of the place and cannot morph in motion.
- The image is a light map (the low Sun is baked in). For a fixed Sun and a rigid deck that is exact: diffuse light and cast shadows sit on the surface. Live light is used only where the code made deck shows.
- The limb glow and the stars come from the engine's sky patch (`sky.json`, cut from the approved image), as in the frozen build. My own limb term is off for now. It will be needed for the dive (the patch is only right near the fit pose).
- Found: `seen.rgb /= gain * vig` was a slip; the final line multiplies everything by gain x vig (the vignette undo), so the foreground was 10 percent too dark.
- Draft softness: at 1 sample the footprint is a whole pixel and the chart is sampled one level down; at the review tier `uGrad` shrinks the footprint and it is sharp. Judge sharpness at the review tier only.
- Kept still against the approved image: mean absolute difference 4.33 (display values). That is the mark the frozen build set at 3150.

## Next (08:00 UTC)

1. M1 pictures: 3150 beside the approved image, 3060 / 3150 / 3239, a sheet of every 15th frame at draft, frames 3148 to 3153. Report M1.
2. Top down plates by image generation led by the laid back wedge (media skill, recipe in `RECIPE.md`): fill the hidden zones, the outside of the wedge and the far part. They replace the function made colour of the three uniform maps and become the globe's deepest patch levels (Part B S2).
3. Heights for the plates (depth tool on the plate, or from its own structure), function detail below the plate's scale.
4. Speed: seconds per sample at the review tier.
