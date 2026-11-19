# 03 · How each picture is made

The film is a hybrid. Space and whole bodies are true 3D, built and lit in code. Terrain views are the approved close images given real depth. Dives join the two.

Use the simplest technique that gets a frame to match its approved image. This file gives the starting technique for each kind of picture. The ladder in `kit/04-LOOK.md` says what to try when it falls short.

## 1. The orbit view

A globe with wrap maps, lit by code, with whatever the stop adds: atmosphere, clouds, rings, moons.

### Wrap maps grown from the approved hero image

The orbit view has to look like the approved hero image, feature for feature. So the wrap map starts from that image.

1. Fit a sphere and a camera to the approved hero image so the rendered silhouette lies on the body's silhouette in the image.
2. Unproject the image onto the sphere. That gives a wrap map that is correct for the part of the globe the image shows.
3. Remove the baked light from that part: the terminator shading, the limb glow, the shadow of a moon or ring. Use an image tool to relight it evenly. What remains is surface color only.
4. Fill the rest of the globe in the same style with an image tool. Where a real map exists, use it as the layout guide so the far side has the right continents, canyons or bands. `kit/06-ASSETS.md` lists sources.
5. Bring the map to `assetSets.full.wrapMapWidth` with detail that holds at native size, then derive the `web` set from it. The image tools return pictures a fraction of that size, in a few fixed shapes, so work in two passes. First one pass over the whole map at low resolution, to settle layout and color. Then overlapping tiles, each made with its piece of the low resolution pass and the approved image as inputs, blended across the overlaps.
6. Make the extra maps the stop needs: night lights, clouds, height or normal, a mask for water glint.

Check the map before it goes on a globe:

- No seam where the left edge meets the right edge.
- No pinching or swirling at the poles. Paint the poles in a polar view and reproject them if needed.
- No region that is visibly softer than the rest.
- No border between tiles, in color or in detail.
- No baked highlight, shadow or glow.

### Light and atmosphere in code

- One directional light, the Sun. Its direction per stop is chosen so the terminator matches the approved hero image.
- The terminator is soft on bodies with air and hard on bodies without.
- Atmosphere is a shell shaded in code: a glowing rim on the lit limb, a thinner twilight band past the terminator, color from the approved hero image.
- Clouds, where the stop has them, are their own layer just above the surface. They cast a soft shadow on the surface, offset away from the Sun.
- Night side lights, lightning and aurora are emissive layers that fade in past the terminator.
- Relief on rocky bodies comes from a normal or height map, strongest near the terminator.

### Rings

- A flat disc with a radial profile map: color and opacity along the radius, detailed enough to resolve hundreds of bands at the hero framing.
- The shadow of the globe on the rings and the shadow of the rings on the globe are both computed from the Sun's direction.
- Rings are lit from behind when the Sun is behind them: brighter where thin, darker where dense.
- Near the camera the profile alone is not enough. See the Saturn section of `kit/02-STOPS.md`.

### Moons

- Each moon is a real sphere with its own wrap map, lit by the same Sun.
- Phobos is a displaced, irregular body with crater relief. It is close to the lens.
- Io's shadow on Jupiter is computed.
- A moon's position in the `hold` matches the approved hero image at the midpoint and moves along its orbit through the segment.

### The Sun

- An emissive globe. Its surface is animated: granulation that churns, sunspots, bright regions that pulse.
- Prominences and loops are separate animated forms that rise off the limb, with plasma flowing along them.
- The corona is a field of long rays round the disc with fine structure, drifting slowly.
- It is rendered in high dynamic range, so bloom and glare come from real brightness.
- The surface detail survives the bloom, as in the approved hero image.

### The test for an orbit view

- Render the judged `hold` frame. Run `npm run compare`. Placed beside the approved hero image, a viewer calls them the same shot.
- Orbit the body in `live` mode. No seam, no pinched pole, no soft region comes into view.

## 2. The terrain view as a relief

The approved close image, given depth, so the camera can fly forward through it.

### Building a relief

1. Source: the approved close image, brought to `assetSets.full.reliefWidth` with detail that holds at native size. Nothing in it is redrawn. Only resolution is added. Use the tool from Phase 0 that adds resolution without redrawing. An image model may add fine detail on top only if the check in `kit/06-ASSETS.md` shows nothing moved.
2. Sky: cut the sky above the horizon out of the image. The film's own sky shows through, so stars stay fixed at infinity while the ground moves.
3. Ground: fit a curved surface to the ground in the image, matching the curve of the horizon. Project the image onto it from the position of the image's own camera.
4. Depth: estimate depth for the image and use it to raise what stands above the ground: crater rims, canyon walls, cloud towers, storm walls.
5. Layers: anything tall with clear space behind it becomes its own layer. Paint in what was hidden behind it with an image tool, so nothing stretches when the camera moves.
6. Camera: the film camera starts near the image's own camera and moves forward, with a little rise or pan. Find the largest move that shows no stretching, tearing or exposed edge, and stay inside it.

### Giving it life

A relief that does not move reads as a photograph. Every relief carries the motion its stop lists in `kit/02-STOPS.md`.

- Motion is done in the shader: the image is pushed along a flow field, with masks that keep it to the right regions.
- Inside a segment the push is one continuous displacement that grows with time and stays small. Do not cross-fade two offset copies of the image. That doubles edges and washes out contrast. Looping is needed only in `live` mode.
- Rotation round a center for storms. Drift along a direction for mist, haze and cloud bands. Churn for the Sun's granulation. Shimmer for glint on water.
- Every motion is a closed-form function of time. It does not pop, snap back or visibly repeat within the segment.
- Motion is subtle. If a viewer notices the trick, it is too strong.
- If the workspace has a tool that turns a still into video, it may be used to make a moving plate for a relief, played as an image sequence indexed by frame. It is optional. It must be seamless across the segment and it must not change the look of the approved image.

### The test for a terrain view

- Render the judged `terrain` frame and run `npm run compare`. Beside the approved close image, the picture has lost nothing: same detail, same grade, no halo on any edge.
- Render the first and last frame of the segment. Foreground and horizon have clearly moved against each other. A viewer feels forward motion through space, not a zoom into a picture.
- No frame in the segment shows stretching, a torn edge, a doubled edge or the end of the image.

### When true 3D is better

If a terrain view can be built in true 3D and still match its approved close image, do that instead. Saturn's ring plane is the planned case.

## 3. The dive and the rise

A dive goes from the orbit view to the terrain view. A rise goes back. Both happen fast, with real motion blur, and both hide one handover.

### Staying sharp on the way in

- The wrap map is sharp enough for the `hold`. It is not sharp enough for a dive.
- Lay detail patches over the wrap map at the spot. Each patch covers a smaller area than the one under it at higher detail, and its edges are feathered and color matched so it cannot be seen as a patch.
- The deepest patch shows the spot from above in the style of the approved close image, so the ground the camera falls toward looks like the place it lands in.
- Add patches until the G13 measure in `kit/07-QUALITY-BAR.md` holds for every frame outside the cover, and the deepest patch has real detail, not enlarged pixels.

### The cover

- The cover is `cover.seconds` long. Its center is at `cover.diveCenterFraction` of a `dive` and `cover.riseCenterFraction` of a `rise`.
- In a dive the picture is the orbit view before the cover and the terrain view after it. In a rise it is the other way round.
- Each stop's cover is listed in `kit/02-STOPS.md`: haze, cloud, glare or a flare. It belongs to that world, so it reads as something the camera flew through.
- Across the cover the direction of travel, the horizon line, the color and the exposure all carry over. Nothing jumps.
- The camera is at its fastest during the cover.

### The path

- A dive starts from the `hold` framing, drops toward the spot, levels out and arrives at the start of the terrain view's camera move, still decelerating.
- A rise is not the dive played backward. It climbs away on a different line and ends with the whole body in frame, ready to turn away for `travel`.

### The test for a dive or rise

- Step through the segment frame by frame. No frame shows a soft or blocky texture, a patch edge, a pop or a cut.
- A viewer watching at full speed believes the camera flew down to the place it ended up.

## 4. Travel

- Only two sets are ever in memory: the one being left and the one being reached. See `kit/05-ARCHITECTURE.md`.
- The camera turns away from the body it is leaving and settles on open sky.
- The next body is first a point of light at its true position on the sky for that stop, then a disc, then the hero framing.
- Dust motes near the lens, lit by the Sun, give the sense of speed.
- The Sun's glare is placed where the Sun is for each stop and shrinks from stop to stop.

## 5. The sky

- One sky for the whole film, in two layers.
- The glow: the Milky Way's band, its dust and the faint haze of unresolved stars, as a map at `assetSets.full.skyWidth` wrapped on a sphere at infinity. It starts from a real star map with the individual stars taken out or blurred away, graded to match the approved images. `kit/06-ASSETS.md` names the source.
- The stars: points drawn in code on top of the glow, thousands of them, each with its own brightness and color. A map alone cannot do this. At the long lenses of the orbit views a map's stars turn into blobs.
- Star positions come from a public catalog or from the seeded generator. Accuracy is not required. Density, sharpness and the look of the approved images are.
- The brightest stars have a small soft glow.
- The sky keeps one orientation for the whole film. It turns only because the camera turns.
- Exposure dims the sky when a bright body or the Sun fills the frame, as a real lens would, but the sky never disappears completely.

## 6. The ending

- The lookback is true 3D: the sky, the Sun as one bright star with a small glare, and Neptune as a thin crescent at the edge of frame.
- The fade is a slow fall to black.
