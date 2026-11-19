# 04 · The look

## 1. The bar

- Every frame looks like a still from a top-budget film or a AAA game cinematic, seen from inside a virtual reality flight through the solar system.
- It does not look like a spacecraft photograph, a textbook picture, a stock image, a web 3D demo or amateur generated art.
- It shows detail beyond anything a telescope or spacecraft has ever shown.
- It treats each world the way a master artist treats a real subject: based on the real thing, recognizable at a glance, then exaggerated until it is a masterpiece.
- Scientific accuracy is not required. Physical conviction is: real light, real materials, real depth. The viewer feels they are there.
- Never cartoon, painterly, stylized, flat, plastic or plain.

The 18 approved images in `references/approved/` are this bar made concrete. Brandon chose them. When words and an approved image disagree, the image wins.

## 2. What "exaggerated" means here

- Color is pushed past reality without turning garish.
- Features are bolder than life: taller cloud towers, deeper canyons, larger storms, brighter aurora, longer prominences.
- Space is alive: a dense star field, the Milky Way, a faint glow of dust. It is never an empty black card.
- Scale is felt. Something near the lens, something far, and air or dust between them.
- Do not tone an approved image down to make it more correct.

## 3. The lens

- A large-format anamorphic film look.
- Wide in terrain views, so the horizon curves and the scale is felt. Longer in orbit views, so the body sits large and calm in frame.
- The field of view for each judged frame is found by matching its approved image.
- Changes of field of view happen inside dives, rises and travel, never as a visible zoom during a `hold` or `terrain`.
- Depth of field is used only where something is close to the lens: Phobos, ring ice, asteroid rocks, dust motes. Everything else is sharp.
- Lens flare appears when the Sun is in or near frame: a soft glow and a horizontal anamorphic streak. It is strongest at Mercury and gone by Uranus, where the Sun is a star with a small glint.
- A gentle vignette on every frame.

## 4. Exposure, tone and color

- The scene is rendered in high dynamic range and brought to the screen through a film-like tone curve. Highlights roll off. They do not clip to flat white.
- Blacks are deep but not crushed. Detail survives in the shadows of every lit body.
- Cool shadows against warm light.
- Each stop is graded so its judged frames match the color and contrast of its approved images.
- The grade across stops reads as one film. No stop looks like it came from a different project.
- Exposure moves slowly and only during `travel`, dives and rises.

## 5. Bloom and glow

- Bloom comes from real brightness: the Sun, glint on water, lit limbs, city lights, lightning, ring ice catching the Sun.
- It is wide and soft, never a hard halo.
- Nothing that is not bright blooms.

## 6. Grain and banding

- Very fine film grain on every frame, seeded per frame index.
- Space is full of slow dark gradients. They must not band. Render and grade at high precision and dither the final output.
- Grain and dither have to survive compression. The stress test in `kit/07-QUALITY-BAR.md` checks this.

## 7. Motion blur and anti-aliasing

- A frame is the average of its samples, spread across the shutter set by `film.shutterDegrees` and across the pixel.
- That gives real motion blur in dives, rises and travel, and clean edges on limbs, rings and stars.
- Fast segments get more samples. `kit/05-ARCHITECTURE.md` says how. Blur is smooth. An edge never breaks into separate copies.
- Stars stay points. They do not smear or streak, even when the camera turns.
- Thin lines, such as Uranus's rings and ring bands at grazing angles, do not shimmer or crawl from frame to frame.

## 8. Diagnostic views

Each is a `diag` value in the URL and in the harness.

| View | Shows |
| --- | --- |
| `beauty` | The finished frame |
| `ungraded` | The frame before lens and grade |
| `texels` | A heat map of texture detail against screen pixels, for G13 |
| `layers` | Each relief layer in a flat color |
| `depth` | Depth from the camera |
| `flow` | The motion field of a relief or a globe |

## 9. The ladder

When a critic's issue survives `quality.plateauRounds` rounds, stop tuning and change technique. Move down the list for that problem and log which rung you are on.

### The orbit view does not match its approved hero image

1. Refit the sphere and camera, and regenerate the wrap map from the unprojection with the approved hero image as the style input.
2. Keep the unprojected part of the map untouched at full strength where the camera sees it in the `hold`, and blend to the generated map only outside that region.
3. Paint corrections into the map region by region with an image tool, giving it the current render and the approved image side by side.
4. Reduce how far the globe turns and the camera drifts in the `hold`, so the view stays inside the region the approved image covers.

### A globe looks plastic, flat or like a web demo

1. Add fine relief from a normal map, strongest at the terminator.
2. Rebuild the atmosphere: rim glow, twilight band, haze over the limb.
3. Separate the clouds from the surface and give them shadows.
4. Revisit the tone curve, the grade and the bloom against the approved image.

### A terrain view reads as a flat picture being zoomed

1. Check the ground surface fits the horizon and strengthen the depth of what stands above it.
2. Split more layers and paint in what they hide.
3. Add independent motion: drifting haze layers in front of and between layers, moving shadows, flow.
4. Rebuild the foreground third of the view in true 3D and keep the relief for the middle and far distance.

### A relief stretches, tears or shows doubled edges

1. Split the offending feature into its own layer and paint in what it hides.
2. Shorten or redirect the camera move until the fault is gone.
3. Soften the depth of that feature.

### A dive goes soft or shows a patch

1. Add a deeper detail patch and feather it wider.
2. Match the color of each patch to its parent again.
3. Move the cover earlier.

### A cover can be seen as a join

1. Match color, exposure, horizon line and direction of travel on both sides.
2. Thicken the cover element and make it move with the camera.
3. Lengthen `cover.seconds`.

### Flow looks fake

1. Lower its strength.
2. Mask it more tightly to the region that should move.
3. Replace a single flow with two layers moving at different speeds.

### The sky looks fake

1. Draw more stars as points, with more variety in brightness and color.
2. Grade the Milky Way's glow against the approved images.
3. Check that stars stay fixed while the ground moves.

### Fast motion breaks into ghost copies

1. Raise `fastSamplesPerFrame` for the tier.
2. Add blur along the direction of motion inside each sample.
3. Slow the fastest part of the move slightly and let the cover carry it.

### Dark gradients band

1. Raise render and grade precision.
2. Add dither at output.
3. Raise the grain slightly.
