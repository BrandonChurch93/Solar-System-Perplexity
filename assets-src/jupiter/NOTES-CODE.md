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
- The storm on the hold globe (hero pixels in the wrap): lon -17.5, lat -10. Corrected 08:45 UTC: `look.spot.axesDeg` [7.0, 4.3] are half axes, so the storm is about 14 x 8.6 degrees (the 13.2 x 7.9 of the old notebook are full axes). The vortex of the close image is about 0.5 degrees wide: 1/28 of the storm's length. One scale cannot serve both: see "The place of the dive".
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

## Mail 225 from the Builder (08:01 UTC): E1 is on main

- Merged `origin/main` (E1 at 33ccccb6) into this branch at 3c8ae1d, build green. Never rebase.
- Contract (`assets-src/shared/HANDOVER-NOTES.md`, "The contract of E1, for the stop builders"): opt in with a `handover` object in the params (even `{}`); `handover.dive` and `handover.rise` may set `at`, `dissolveFrames`, `placeFrames` (defaults in `config.handover`: dive at 0.6, rise at 0.4, dissolve 1 frame, place 12 frames; for Jupiter the dive swap would be frame 3024). `plan.divePose(time, view)` and `plan.risePose(time, view)` must give a valid pose on both sides across the place window and the dissolve; `plan.dive(time)` and `plan.rise(time)` pick the side with `sideAt`. The old property `risePose` is now `riseEnd`.
- A stop that opted in has no cover and no added softness in its dive and rise; G13 then counts every frame of the dive and the rise.
- Not on main yet: E2 (the place picture on the globe side), E3 (the steady descent in the generic plan), E4 (the measures). Opting in today gives a hard swap at T: a fair first measure of how far the two sides are apart, not S4.
- `JupiterPlan.turn` freezes the planet's spin between the cover centres through `coverCenter`; look at it again when opting in.

## v4 and v5 (08:05 to 08:40 UTC)

- Limb glow. The engine's sky patch holds only the sky and the stars from 0.4 degrees over the horizon up; below that it is a dim brown fill, and the frozen deck drew the glow itself. So the glow is mine. Tool `deck/limb.py`: renders 3150 with the glow off (`limb.py clear`, then a draft frame), takes what the approved image has more than that render in the sky, and bins it over (tangent height of the ray over the sphere, the sunward coordinate of the ray's tangent point in the chart). The table (28 rows spaced by the square root of the height up to 1.4 units, 20 knots from -14 step 2 units, scene linear RGB) goes into `deck-fields.json` as `limb`; the shader reads it as one float texture and adds it to rays that miss the deck. Alpha 1 under 0.15 units and 0 over 0.45 hides the brown fill of the sky patch. Residual of the table against the image: mean under 0.005, rms 0.065, 0.035, 0.025. It is a function of the ray over the sphere, so it is right from any pose near this height; for the dive it has to be checked from higher up.
- Hidden zones. The far field had vertical streaks: chart texels hidden behind towers held copies of the tower and bled through the filter. `deck/view.py` now fills hidden zones by inpainting (radius `view.hiddenFill`) and gives them an interpolated length, so they blend instead of smearing.
- Far relief. The depth estimate is noise beyond about 10 units (stair steps at the horizon). `tool.reliefReach` 10 and `tool.reliefFade` [6, 10]: beyond that the deck is the smooth sphere and the image is paint on it. Parallax there is under a pixel over the whole flight, so nothing is lost.
- `bake.py` now keeps the `view` and `limb` blocks of `deck-fields.json`. Order after a change of the maps: `fields.py near mid`, `bake.py`, `view.py`, `limb.py clear`, draft frame of 3150 into `out/work/jupiter/frames/limboff/`, `limb.py` on that frame.
- The two fine detail steps of the march run only where the image is not trusted.

Measured on v5 (frame 3150 against the approved image at 1920 x 1080):
- mean absolute difference in display values: draft 4.58, review 4.64. The kept still of the frozen build: 4.33.
- `tools/measure/g17.py`: draft median 0.64 (one sample is soft by design), review median 0.97, p25 0.84; the kept still 0.99. The bar is 0.8.
- Time: boot 20 s, a draft frame 3.0 to 3.2 s. The engine raises the sample count with the motion in the shutter (0.6 px per sample): 3150 at the review tier took about 12 samples, 36 s. At the final tier the base is 16.
- Flight: straight, 0.3 units a second, 0.9 units behind the fit pose at 3060 and 0.9 ahead at 3239. The storm grows 1.6 times over the view.

What the pictures show (looks folder `jupiter-code`, v5):
- 3150 is the approved image to within the draft softness; the limb and the far field are clean.
- 3165 to 3239: a rigid storm that comes nearer, relief reads. Where the camera now sees behind towers or along slopes the fallback deck shows: grey green mottled patches, soft brown foreground. Colour and richness of the fallback are wrong.
- 3060 to 3149: the camera is behind the fit pose and sees ground the image never held: the bottom 36 percent and a strip on the left at 3060 are the dark function deck, with a straight seam at the wedge border.
- Cure for both: complete top down plates (Mail 224), colour matched to the image field, as the fallback.

## Part B scale design (decided 08:10 UTC)

- Superseded by "The place of the dive" below (way B): the place is not inside the great storm.
- The deck maps continue the globe's patch pyramid (`patches.json`: centre lon -12 lat -10, levels 100, 61.58, 33.18 degrees): far 184.32 units = 31.8 degrees (about the globe's nearest patch, the whole great storm), mid 61.44 units = 10.6 degrees (the storm's inside), near 20.48 units = 3.53 degrees (the place).
- Plates are made zoom style: each level's rim agrees with the level above, its centre is the level below. Perhaps a fore plate of 5.12 units at 2048 px near chart (0.5, -3.6) for the foreground outside the wedge.
- The heading of the place on the globe is chosen so that the baked Sun of the close image (azimuth 130 degrees in the chart) agrees with the globe's Sun (sunDir (-0.744, 0.140, 0.653), n.l 0.81 at the storm). The dark lower right of the close image stays a local dark patch; the Sun does not move.
- The close side must be drawable from far greater heights, so that T can be chosen freely.

## The place of the dive (decided 08:55 UTC, Mail 229, decision d88 of the Builder)

Measured in `public/assets/jupiter/full/wrap-color.jpg` (8192 x 4096, lon = (x / W - 0.5) * 360, lat = (0.5 - y / H) * 180) and in the laid back image, display values:
- Great Red Spot inside: (226, 154, 94). Its long axis 14 degrees, short 8.6.
- The cream wake north west of it (lon -31 to -22, lat -10.3 to -1.3): (222, 204, 181).
- A small orange oval in that wake, in the approved hero: lon -26.6, lat -5.8, about 1.45 x 1.0 degrees, 12 px in the hold; core (223, 174, 126).
- Close image ground within 8 units of the vortex: (163, 146, 129); times 1.365 = (222, 199, 176), the wake's cream. Within 4 units: (139, 113, 94); times 1.6 = (222, 181, 150), near the oval's core. The funnel itself (145, 94, 68).
- So the close image is exposed about one stop under the hold (display factor 1.365, linear about 2), and its chroma is the wake's, not the Great Red Spot's.

Way A (the place is the centre of the Great Red Spot) would need a region 5 to 9 degrees wide to turn from orange to cream while it fills a third of the frame. Way B: the place is the small oval. The Builder took B (Mail 229) with these conditions:
1. The Great Red Spot leads the dive: in frame and growing through the first two thirds of the dive, then it passes under or beside the camera as a huge turning storm with its collar and wake in full detail. Plates and levels must carry it at that size, G13 on every frame. The dive reads as a flight down over the Great Red Spot to a red storm at its edge, never as a turn away from it.
2. The small oval is in frame from the moment it resolves and stays near the middle of the frame from about 15 px on. No step in its size, turn or colour when the close side takes over.
3. Check where the flank of the Great Red Spot lies as seen from the close camera. If any of it is inside the horizon in the direction of view, the far ground must show it as it is. The approved image has cream to the horizon, so choose the heading that the image's own light and bands allow; say which way the camera looks and what lies there.
4. The rise shows the Great Red Spot coming back into frame as the camera climbs.
5. The exposure ramp of about one stop: one function of time through T, spread over the whole dive so no frame shows a step, the same in reverse on the rise.
6. The hold stays the same bytes at 2895 (checked against the kept still).

Geometry of B (computed 08:50 UTC):
- At lon -26.6, lat -5.8 the Sun of the globe (sunDir (-0.744, 0.140, 0.653)) stands 64 degrees high; its ground azimuth is 148 degrees from east, counted toward north (32 degrees north of west). The chart has the Sun at 130 degrees from chart +x. For the baked light to agree the heading (chart +y) is 108 degrees from east: 18 degrees west of north.
- The Great Red Spot's centre lies 8.9 degrees east and 4.2 south of the place, 9.8 degrees away, 25 degrees south of east. With the heading above it is behind and to the right of the close camera, out of the frame (the frame takes azimuths -43 to 73 degrees round the heading).
- The horizon of the close view is 4.45 degrees away. The orange of the Great Red Spot starts about 3.6 degrees east of the place.

Light: the plates keep the baked shading of the low Sun (the richness), but the large gradient of the close image (bright haze toward the Sun, dark blue grey away from it) and its exposure are not a property of the place on the globe. Plan: plates stored flat (matched to the globe), a smooth grade field (gain and add per place) brings them to the image; its amount is a function of the camera's height over the deck (haze along grazing paths), so it is the same in the dive and the rise and has no step at T.

## Mail 230 from the Builder (09:00 UTC): life in the surface view is a must

Brandon wrote at 08:43 UTC about the Sun's surface view that the movement of its matter is lack luster. So on Jupiter life in frames 3060 to 3239 is a must. It comes after the plates and the rigid deck hold (M2), before the rounds. Kept small so nothing bends:
- The storm turns: the vortex turns about its own centre as a near rigid core, the angular speed falling smoothly to zero at its collar, and the height field turns with the colour, so the shadows of the cloud tops move as they should. Bound the wind up: over the 180 frames the difference in angle between any two radii stays so small that no eye can see a shape stretch. Say the bound and the number chosen in the json.
- Thin high cloud or haze drifts over the deck at the speed of its jet, as its own rigid layers at their own height, with their shadows on the deck. Neighbouring bands go opposite ways.
- Lightning, if added (the kit names it: faint, inside the darker clouds, seeded): from time alone, never strobes.
- Nothing else has to move. No field is dragged through a flow.
Proof: a life only sheet (camera frozen at the pose of 3150, time running, every 15th frame) and six consecutive frames at two places.

Plan for it (not built yet): lookups of height and colour inside the vortex are made at the place turned back by angle(r) x (time - time of 3150), so 3150 stays the approved picture; small angle, polynomial sine and cosine in the march. Drift layers are functions on rigid sheets per band. Lightning is a seeded list of flashes with smooth rise and decay.

## Plates and the handover: design (09:20 UTC)

Read again in `cut/HANDOVER.md`: E2, the engine draws the close side at T into a texture (the place picture) and lays it over the globe side during the place window (12 frames by default), only where it is honest (never enlarged over `maxEnlarge`, feathered). Outside it the globe's own surface shows, so the plates on the globe must agree with the close side by themselves. E3: the ratio of heights per frame is smooth with no spike; at T the globe pose is the twin of the close pose with the same velocity. The S2 check is a top down dive sheet.

Decided:
- One plate set in the globe's look. The plates hold albedo coded like the globe's patches (sRGB of the filmic curve); the globe decodes with its inverse curve and lights them. The close side draws the same plates times a grade: `plate x mix(globe light, M, a(h))`, with a = 1 at height 1 and 0 at T, where M is a smooth field (lowpass of the close image over lowpass of the globe's albedo, a small texture). So nothing changes locally at T; what is left is a global grade between T and the landing (the oval's region goes from the globe's orange toward the image's cream and rust, about 40 percent of the gap of way A). The exposure part can be spread over the whole dive as one function of time in both shaders. Knob `plates.matchSigma`: the scale above which the plates take the globe's colour.
- Plates on the globe: a second patch group in `globe.ts`, looked up with the rigid direction (not the flowed one) through the orthographic chart: `c = (dot(d, e), dot(d, u)) * R`, `uv = (c - centre) / size + 0.5`. The chart's origin, axes and R on the globe come from `place.json` (`solved.n`, `e`, `u`, `radiusUnits`). Weight by footprint: the plates fade in while the oval is 15 to 44 px wide (footprint 0.56 to 0.19 units a pixel), and count as texels for G13. Check `MAX_PATCHES`.
- The flow is frozen for the dive: `local = settle(elapsed, 5)` runs as today through the hold; from the dive's start the elapsed time eases to a constant over 0.5 s. Frozen local time 2.4096 s (bands 0.53 degrees times the jet, swirl 12.05 degrees times the turn). The rise starts at that value and releases after the plates are gone. The spin (1.6 degrees a second) runs to T of the dive, stands until T of the rise, then goes on from that value. The veil (`look.veil`) must be off in the dive.
- T low: height about 12 to 15 units (dive `at` about 0.6, frame about 3024), the camera pitched about 60 degrees down so the frame lies inside the mid plate. The globe side needs the mid and near plates for G13. Relief and live shadows of the close side fade in with falling height below T.
- Dive path: a constant ratio of 1.0775 a frame gives heights of 88 units at frame 30 of the dive, 42 at 40, 29 at 45, 20 at 50, 14.7 at 54, 9.4 at 60, 4.5 at 70, 2.1 at 80, 1 at 90. The sub point goes from about lon +4, lat +6 over the Great Red Spot's north west part (frames 35 to 45, the spot passes under and to the left), curves right and arrives from the south south east; the view stays on the oval.

Measured (09:10 UTC, `plates/globe.py`, a numpy copy of the globe's lookups):
- The orange oval with the flow frozen as above: centre lon -26.628, lat -5.783, 1.584 x 0.654 degrees (9.2 x 3.8 units), long axis 11.6 degrees north of east. At the middle of the hold: lon -26.594, lat -5.84, 1.357 x 0.711 degrees, mean colour (223, 164, 111).
- The vortex in the chart (relief aware lay back): dark heart about (-0.28, -0.9), red brown funnel by colour threshold centre (0.06 to 0.1, -0.7 to -1.0), about 2.3 x 1.9 units; the cream ring about 6 units across, the tower ring to about 12 units. `place.json` takes vortex = (-0.1, -1.0).
- So the oval on the globe (9.2 x 3.8 units) is larger than the close funnel (2.3 units) and of the size of the close image's cream ring and tower ring. The plates decide what a viewer sees there: the oval's orange at the scale of the globe, the funnel with its ring at the scale of the deck.

`plates/place.py` writes `place.json` (S1): at T (100.8 s, spin 6.88 degrees) the globe's Sun stands 56.8 degrees high over the oval at azimuth 151.9 degrees from east; with the baked Sun of the chart at 130 degrees the heading (chart +y) is 111.9 degrees from east, 21.9 degrees west of north. The chart's origin lies at lon -26.677, lat -5.616; the camera of 3150 over lon -26.428, lat -6.23; 20 units ahead is lon -27.71, lat -3.05.

`plates/prep.py NAME` makes the canvas of a plate for the repaint: the level above (for the mid plate the globe's own albedo with the flow frozen) enlarged, and inside the wedge the laid back close image divided by the grade field, blurred to what the image truly resolved there. It stores the blur map (plate pixels) so the join step knows what is finished.

## Plates made (09:30 to 10:20 UTC)

Tools in `assets-src/jupiter/plates/`: `place.py` (S1, writes `place.json`), `globe.py` (numpy copy of the globe's lookups), `prep.py NAME` (canvas for a repaint; also `NAME_bare_in.png` for a plate without a parent; `globeSoftenPx` blurs the globe's albedo first), `join.py NAME TAKE [keep]` (phase align, canvas above `lock` x tie, the take's detail below, finished parts kept; `keep` writes `gen/NAME-plate.npy/.png`), `nest.py` (near plate inside 6.5 units of the vortex, feathered to 9.2 into the mid; mid = near downsampled inside, the bare mid plate outside; fore unchanged), `prompts.json`. Generator files under `out/work/jupiter/gen/` (not in git).

- Plate set in `deck.json` `plates`: fore centre (0, -1.875), 8.448 x 4.752 units, 2816 x 1584 px (0.003 units a pixel); near centre (0, 0), 20.48 units, 2048 px; mid 61.44 units, 2048 px; far 184.32 units, 2048 px. 1 unit is about 215 km.
- Grade is one colour: plates = close image over the grade (the globe's exposure and hue). The surface view multiplies it back as one exposure by time alone (Mail 229 condition 5). The image's far tone is haze: flattened in the plates from 5 to 11 units of ground distance from the close camera.
- Takes this round: near 2 of 6 (take 1 rejected: hard wedge edge and the globe's exposure in its canvas; take 2 kept). Mid 4 of 6 (`mid_first_t1` funnel five times too large; `mid_t1` with the near plate laid in: storm 2.5 times too large, bands replaced by cream; `mid_t3` bare canvas: layout kept, band correlation 0.822, but it kept the globe's stipple grain; `mid_t4` softened bare canvas, prompt `mid_bare2`: shift 0.07 and -0.05 px, band correlation 0.847, detail 5.67 to 10.72, kept). Fore 1 of 6 (`fore_t1`: shift 0.11 and -0.07 px, band correlation 0.988, kept).
- Lesson: the generator keeps the layout only when no small storm sits in a soft surround. So the mid repaint is led by the canvas without the storm and the near plate is laid in afterwards by code, radially, so no square shows.
- The globe's own albedo at the place is a stippled grain at 0.03 units a pixel (patch-near has 0.047 units a texel; patches: wide 100 degrees 5120 px, mid 61.58 degrees 4096 px, near 33.18 degrees 4096 px, centre lon -12 lat -10; the place lies 1.9 degrees inside the west edge of patch-near).
- Heights: the depth tool on the top down plate does not agree with the image heights (correlation 0.04 to 0.08 after a high pass). So: image heights inside the fan (trust), depth tool high pass (0.8 units, gain 1) outside in the near map, the mid map image heights only, relief fades 6 to 10 units from the fit eye, no far height map.
- `deck/bake.py` writes `plate-{fore,near,mid,far}.png` (RGBA, sRGB of the filmic curve of plate x grade, alpha = roughness from the plate's own band energy), `deck-{near,mid}-height.bin`, `deck-fields.json` (`chart`, `heightRange`, `grade`, `maps`, `plates`; keeps `view` and `limb`). `deck/view.py` lays the image onto the heights (the view matched chart `deck-view-color.png`).
- Gate facts: G13 is measured at the draft tier (1 sample), soft when the texel count is under `detail.minTexelsPerPixel` 1.0, pass when soft over counted is at most 0.02. `GRAD_FLOOR` 0.5: the sample footprint shrinks at most by 2. `config.handover` defaults: dive at 0.6, rise at 0.4, dissolve 1, place 12, sky 24 frames, maxEnlarge 3, place scale 2.
- Globe facts: `uPatchFade` 1.02 to 1.5, `MAX_PATCHES` 6 with 3 used, the wisp scrolls by `uWispT`, veil and pall are covers.

## The plate deck in the shader (v6, 10:20 to 10:45 UTC)

`clouds.ts` now: march on two height maps; colour = mix(plates, image field, trust); plates are four nested levels with ground fixed weights and a narrow join (`look.join`); every lookup with `textureGrad` and the footprint of the pixel on the tangent plane of the hit (normal from the height maps, ray steps from `dFdx(vDir)`), anisotropy 16 (`EXT_texture_filter_anisotropic` is in the Workspace record). Function detail: billow octaves embossed along the Sun's azimuth, cells from `detail.w` x the footprint up to `detail.z` x the source's texel, up to `foot.z` taps along the long axis of the footprint. No live light on the plates.

Measured and seen:
- First try (no footprint filtering, detail gain 1, cells of 0.6 px): stipple grain everywhere, mean abs diff to the approved image 6.63. With the footprint filtering and gain 0.1: 4.56 at the draft tier (M1 mark 4.58). A draft frame takes about 3 s after a boot of about 20 s.
- `tools/repeat.ts --frames A,B,C --sessions 1 --runs 1 --keep DIR` renders several frames in one page (it has no help flag: a wrong flag starts a full run).
- Plates only (`look.trust[2]` = 1 takes the image field away): 3150 and 3239 hold as pictures by themselves. So the plates are registered and carry the composition.
- 3060 is BAD: the level flight (0.3 units a second, 0.9 units behind the fit pose at 3060, height 1) shows ground the image never saw: a strip in front of the image's near edge (36 percent of the frame height) and wedges at both sides. There the fore plate holds the repaint's bright cumulus banks, pale and soft, beside the image's dark foreground: the fan of the image stands in the frame as a dark quadrilateral.
- Geometry of what a pose can see: the ground footprint of a pose stays inside the footprint of the fit pose only if the camera is ahead of the fit pose's image plane and above its bottom plane. Every pose behind the fit pose shows margins at the sides; below the bottom plane (z < 1.376 x for x back) also at the bottom. So the first half of the flight always shows margins; they must be small and good.

Plan (10:45 UTC):
1. Flight: a slow, slightly descending approach (about 0.3 units back and 0.35 up at 3060, margins about a tenth of the frame), through the fit pose at 3150, then faster forward (about 1 unit ahead at 3239). Numbers in `deck.json` `flight`.
2. Haze by view angle: a fitted table T, S (transmittance and added light per channel) over the grazing angle of the ray and its azimuth from the Sun, from pairs (plates only render, approved image) at the fit pose. Applied to the plates only. From above it is the identity, so it serves the dive too.
3. Margin tone: near the fan's apex the plates outside the wedge take the image's tone carried out from the border (baked in `bake.py`), so the margins are as dark as the image's foreground.
4. Function detail: tune on magnified ground. G13 count for it: the function's finest cell.
5. Then the M2 proofs.

## Next (08:40 UTC)

1. Report M1 (way B: the image at its truly resolved scale in a view matched chart on true relief, trust that depends on the view so it is never shown stretched; way A, functions alone, was far too poor).
2. Plates by image generation led by the laid back wedge (media skill, recipe in `RECIPE.md`, at most 6 takes per asset per round): top down, nested, each colour matched to the level above. They become the fallback colour of the deck maps and the deepest levels of the globe's patches (Part B S2).
3. Heights for the plates (from their own structure or the depth tool), function detail under the plate's scale.
4. M2 proofs: 12 frame sheet, every sixth frame at the review tier, compare at 3150, G5, G13, G17, seconds per sample.
5. S1 `place.json`, S3 steady descent, then opt in with `handover` once E2 is on main (S4, S5). Remove `deck.ts`, `pall.ts` and the cover use in `plan.ts`.

## Mails 235 and 246 (engine on main)

- Mail 235: E2 is on main at c9c23b29 and merged into this branch (merge 1f087db). Near T the globe side shows the place picture (the close side drawn at T). `StopPlan.twin(local, time)`, `closePose(kind, time)`, `place(kind, time)`; per kind in `MoveParams.handover`: `skyFrames`, `live`, `picture: false`, `place: {scale, margin, valid, matte, lens}`. After opting in: `npm run handover -- --stop jupiter --tier draft --only sides,flow,path,sheets`, look at every frame of its sheets, send the report with the milestone. The place picture fades in over the globe's own ground during the 12 frames before T; where the globe under it is not the place, that reads as a dissolve. The plates on the globe decide that.
- Mail 246: main is at d690e42a, the planet shader takes up to ten patch levels (it took six); a globe with six or fewer keeps its shader text. Merge when it suits; say in the next report if more than six levels are used.

## The wide canvas (v6b to v7, 10:45 to 11:10 UTC)

- v6b (0.275 units behind the fit pose and 0.38 up at 3060): the ground outside the image's fan showed the plates' pale soft cumulus with a hard straight seam at both sides. Rule: a pose sees only ground of the fan if its position lies inside the frustum of the fit camera. Every pose behind the fit pose shows margins, and they must be of image quality.
- The earlier build left a wide canvas: `public/assets/jupiter/full/deck-wide.jpg`, 5632 x 3168, the approved image at (1408, 792), aprons painted by the generator in tiles, the stars replaced by a smooth rim (old notebook `NOTES.md` line 108, recipe in `RECIPE.md`). Native crops show no seam and the same style. Its middle differs from the approved image by 0.2 to 0.5 levels on the ground. A copy is now `assets-src/jupiter/relief/canvas-wide.jpg` and it is the picture every field is laid back from (`layback.canvas_display()`: the approved image pasted over the middle with a feather of 12 to 72 px). `geom.py`: `W, H` are the canvas, `W0, H0` the approved image, `OX, OY` = 1408, 792, the focal length stays 1267.46 px.
- The wide fan: near edge 0.25 units ahead of the fit nadir (chart (0.32, -3.58)), azimuth -66.6 to 88.8 degrees. A canvas of twice the image covers back shifts up to about the depth of the nearest ground; for x units back the bottom needs a height of at least 1.4 x minus 0.58.
- Depth: `python3 tools/ml/depth.py --in out/work/jupiter/deck/canvas-half.png --out-prefix out/work/jupiter/deck/canvas-depth` (the canvas at half size, 11 s). The old relief (depth on the approved image alone) had square tile steps and the funnel raised. The half size canvas depth is smooth and the funnel is a depression. The full size canvas depth shows tile steps again. Kept: half size, `tool.heightGain` 3.3 (std at the storm about 0.054 units, before 0.066).
- `deck.json` `view`: thetaDeg [-68, 90], psiNearDeg 76, pixels [4096, 1600], fade [24, 240] canvas pixels from the canvas border. The shader fades the image field out toward the canvas border (`uFitAxes`, `uFitWindow`).
- `deck.json` `flight`: 6 s, forward speed 0.0917 to 0.392 units a second (linear), 0.2 units higher at the start falling with the square of the way still to go. 3060 is 0.5 units behind the fit pose and 0.2 above, 3239 is 0.95 ahead.
- v7 drafts: 3060 to 3120 are complete rich pictures with the aprons' dark cumulus foreground and no seam; 3150 as before. Left: the plates' bright cumulus in the bottom 5 percent at the lower left of 3060, a soft bottom strip and a paler tone at 3195 to 3239, a small comb artifact near the funnel's lower rim.
- Plates only at 3150 hold the composition but are more saturated, and outside the old narrow wedge the kept takes are bright cumulus in a cream plain where the wide canvas has dark aprons. So the plates are made again on the wide wedge (`prep.py` now lays back the canvas).
- Near take 3 (led by the wide wedge, a prompt that names the fan): rejected, the generator kept the fan's edge as a hard line with a shadow under it. Takes this round: near 3 of 6, mid 4 of 6, fore 1 of 6.
- `deck/limb.py` still assumes the approved image's size (line 30 `k = geom.W / w`, rays at line 32): must use `geom.W0`, `geom.OX`, `geom.OY` before it is run again.

## v8 and v9 (11:10 to 11:40 UTC)

- Plates joined again on the wide wedge with the kept takes: near shift 0.74 px, band correlation 0.492; mid_bare shift 0.06 px, 0.82; fore shift 1.04 px, 0.75, image share 0.276, finished share 0.081. The nest is a rounded square (power 4) from 7.4 to 9.0 units about the near plate's centre (`plates.nest`, `plates.nestPower`); mid = near made smaller inside it. Seen top down the near plate still reads as an inset in the mid's pale cleared plain: work for the dive.
- The canvas is good right to its bottom border, so the image field fades over 8 to 72 canvas pixels from the border (`view.fade`).
- `deck/cover.py`: the share of the ground outside the image field per frame. With `flight.startAbove` 0.2: 1.2 percent at 3060 (bottom left, rows from 1020), 0.5 percent at 3075. Height is the lever, a side shift hardly helps. `startAbove` 0.32 gives zero in every frame. So the surface view shows plate ground only in hidden zones and where the image is not trusted.
- Review tier (`out/work/jupiter/frames/v8r`): 3060 24.4 s with 4 samples, 3150 31.3 s with 6, 3239 34.8 s with 7: 5 to 6 s per sample at the review tier, about 3 s at the draft tier. 3060 is a complete rich picture with no seam. 3239 is rich and reads as 3D; its bottom strip is softer (ground magnified about 1.7 times, motion blur about 4.7 px).
- Trust: on flat far ground the smear over the footprint equals the camera's offset over its height. `look.trust` [1.0, 2.5] trusts the image up to a stretch of 2 and ends at 3.5. From T (about 14 units up) the image field is trusted within about 4.5 units of the fit nadir.
- Bug found and fixed: a cream line on the right end of the limb at 3060. Two causes. The limb table's lookup wrapped below its first knot (now clamped to the knots, `uLimbShape.y`). And the far plate showed at grazing angles outside the image's fan with no air over it.
- The air (`deck/air.py`, `deck.json` `air`, `deck-fields.json` `air`): measured on the view chart against the plates at the same ground. Per sine of the angle between ray and ground (24 knots by ratio from 0.002 to 0.4) the share of the plate's light that comes through, and per sine and turn of the ray from the Sun's azimuth (16 knots over 0 to 180 degrees, mirrored) the light the air adds. Green: through 0 under a sine of 0.02, 0.14 at 0.03 to 0.06, 0.52 at 0.1, 0.98 at 0.16, 1 from 0.2; added toward the Sun about 1.9 at the horizon, away from it 0.03. The shader applies it to the plates only (the image field holds its own air): `plate x through + added`. A steep ray sees the plates as they are, so the same function serves the dive from above. After it the line at the limb is gone, and 3150 keeps its bytes (no plate shows there).
- Still open on the pictures: black chips in the fore plate (lay back holes near plate px (1210, 964), (1290, 969), (1310, 1294) of `fore-nest.png`), a black speck near frame (625, 880) and a comb near the funnel's lower rim near (520, 605) at 3239.
