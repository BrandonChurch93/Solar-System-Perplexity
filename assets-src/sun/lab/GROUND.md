# The Sun's place for a ground from the lab

What the Sun's stop gives a ground and what it calls, so that a new ground can be laid in without a second fit.
All figures printed from the source of branch agent/sun-place (tools `out/work/sun/tools/placeat.ts` and
`eyepath.ts`, not committed; the path itself is `eye-path.json` beside this file).

## 1. Where the place sits

- The stage is the camera frame of the approved close image (`references/approved/sun-close.jpg`): origin at the
  eye of frame 90, the camera looks down -z, y up, x right, vertical field 55 degrees at 16 to 9.
- The ball in the stage: radius 20.6267 stage units about the centre [-0.442461, -20.244132, -7.595623]. The eye
  of frame 90 stands 1 unit above it (0.048481 radii). Down at the origin: [-0.020459, -0.936071, -0.351215].
- Body axes: body = toBody * (stage point - centre) / radius, with toBody (x, y, z, w) =
  [0.52156164, 0.09735748, -0.05269083, 0.84600157] (`place.json` stage.toBody). They are the world axes of the
  orbit view at the middle of the hold. The globe turns about its axis (3.4 degrees a second, `plan.carry`) and the
  place rides with it: in the stage and in these coordinates the place stands still at every frame.
- The spot (middle of the umbra): stage [0.107366, -0.277760, -2.447574]; body [0.238002, 0.213494, 0.947510];
  in the axes of the globe's map [0.23879979, 0.21355341, 0.94729594], which is longitude 14.149 degrees and
  latitude 12.331 degrees by the map's law u = atan(x, z) / (2 pi) + 0.5, v = asin(y) / pi + 0.5
  (u 0.53930, v 0.56850 of `wrap-color.jpg`).
- Up at the spot is its direction from the centre: stage [0.026656, 0.967987, 0.249582].
  North at the spot (tangent to the ball): body [-0.0520111, 0.97694443, -0.20706139],
  stage [0.006870, 0.249487, -0.968354] (north runs away from the eye, into the picture).
  East = Y x spot, north = spot x east in the map's axes (`place.json` globe.note).
- The point under the eye of frame 90: body [0.237026, 0.108310, 0.965447]. From it to the spot 6.1167 degrees at
  bearing 2.9578 degrees (`place.json`).
- The arcade stands on two feet, stage [-0.784660, -0.049357, -3.410566] and [1.289323, -0.154127, -3.253576],
  0.1010 radii apart; the middle between them, stage [0.252331, -0.101742, -3.332071], lies 0.0443 radii from the
  spot. The jets and the glow at the limb stand on the ground everywhere.

## 2. The eye's path, frames 0 to 269

`eye-path.json`: for every frame, at the middle of the shutter (time = (frame + 0.25) / 30 s), the view the film
draws from, the vertical field, the height above the ball in radii, the eye and the camera's quaternion in the
stage, and the same in body coordinates. Its heights equal `plan.eyeHeight` at every frame (largest difference
printed 0.000000).

- Frames 0 to 179 (0 to 6 s): the close view, field 55 degrees. Height 0.0571 radii at frame 0, 0.0521 at 60,
  0.0485 at 90, 0.0490 at 179.
- Frames 180 to 269 (6 to 9 s): the rise, drawn from the globe's side: the set lays the stage on the unit globe
  (scale 1 / radius, turned by carry(time) * toGlobe). Height 0.0491 at 180, 0.118 at 205, 0.307 at 217, 0.609 at
  225, 1.161 at 233, 2.620 at 247, 3.260 at 255, 3.574 at 269. The field narrows from 55 to 30 degrees over it.
- Frames 270 to 449: the hold (the ground is gone: it is kept only under height 3.2).

## 3. Exposure and grade

- `plan.ts` light: exposure 1, skyExposure 0.45. The set gets `shot.post.exposure` and `shot.post.vignette` from
  the director with every picture and sets uGain = 1 / exposure, uVignette and uAspect on the ground's uniforms.
- The ground of today makes a display colour `shown` (sRGB coded, 0 to 1), then
  `col = inverseFilmic(grade(shown, 0.0))` and
  `col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette)` with
  `q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0)`, vClip the clip position's x, y and w. The film's post (`src/post/chain.ts`) shows
  `toSrgb(filmic(hdr * uExposure * vig))`, filmic = (x (2.51 x + 0.03)) / (x (2.43 x + 0.59) + 0.14), so the
  picture gets grade(shown) back, before bloom and streak.
- `grade(colour, row)`: `src/stops/sun/grade.ts` with `public/assets/sun/{full,web}/grade.png`, 256 by 4, sRGB
  coded, one curve a channel. Row 0 the ground, row 1 the loops, row 2 the globe. Fitted to the approved image by
  `assets-src/sun/grade/grade.py`.

## 4. What the set calls and what it gets (`src/stops/sun/set.ts`, class Surface in `convect.ts`)

- `new Surface(shared, map, toStage)`. shared: the uniforms of the old ground's material, kept by reference:
  uGrade, uCam (the eye in the stage), uGain, uVignette, uAspect, and the lights the opening flare throws on the
  ground (uGlow, uBox, uLand, uKick, uFlash, uGlowBeat, uGlowPlain, uLandOn, uKickOn, uFlashOn, uLandVeil,
  uGroundMost, uGlowReach; MAIL 350 keeps the flare). map: the globe's own colour map. toStage: the 3 by 3 turn
  from the map's axes to the stage's, so the ground can read the globe's face.
- `surface.mesh`: a THREE.Group in the stage's frame; the set adds it to its `terrain` group. In the close view
  that group is the identity; in the rise it is scaled by 1 / radius, turned and moved so that the stage's ball is
  the unit globe. So the geometry is in stage units on the ball of section 1. Today: a cap of 100 degrees about
  the spot in pieces (mesh.sectors 3072, wedges 32, relief 0.08 units), each piece culled by the horizon.
- `surface.update(time, eye, keep, onGlobe)` with every picture the engine draws (every sample of a frame). time: seconds from the middle of
  the close view (state.time - 3.00833), the only clock the ground gets. eye: the eye in the stage. keep: 1 in the
  close view; in the rise 1 - smoothstep(log height, log 3.0, log 3.2). onGlobe: true in the rise.
- `surface.dispose()`.
- What it writes: `vec4(col * held, held)`, light already weighed by how much of the look the ground holds, into
  the scene's linear target; and gl_FragDepth of the surface shown. The arcade, the jets and the globe sort
  against that depth; while keep is over 0 in the rise the globe's ball is drawn first without writing depth and
  the ground covers it.
- Leaving in the rise: by the distance from the eye to the ground point alone, `place.json` onGlobe.away
  [0.6, 3.3] radii (a smooth step in the logarithm), reddened toward the globe's face between onGlobe.red.over
  [0.32, 1.4]; under it the globe's own face shows.
- For the gates: `uDiag` and `diagOut(...)` (texels, G13: `frames.ts --diag texels` and `g13.ts`); every term that
  counts screen pixels goes through `formatUniform` (`format.ts`, MAIL 799); no Math.random, Date.now or
  performance.now on a pixel path.
- Work a picture: today's ground draws a cell diagram into a buffer once a sample (`onBeforeRender` of its first
  piece) and marches the slab once; the film warms it with four whole pictures through `engine.warmDraw`.
- Who else reads the ground's uniforms: `new Jets(ground.material.uniforms)` and the globe
  (`place: { ground: ground.material.uniforms, toStage, capDeg: [36, 44], fade }`), and `lifeCalm`, `lifeFormat`
  of `life.ts`.
- Values: `src/stops/sun/convect.json` (ramp, tone, cells, spot, mesh, light, jets, glow, gas) and `place.json`.

## 5. Running it

`npx tsx assets-src/sun/place/frames.ts --frames 0,60,90 --tier draft --dir DIR` draws master frames of the stop
as the film does (add `--format preview --rate 2` for 960 by 540 at 60 captures a second, `--diag texels` for G13).
